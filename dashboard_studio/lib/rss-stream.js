'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * In-memory cache for fetched and parsed RSS/Atom feeds.
 * Key: feed URL (normalized)
 * Value: { title: string, items: Array, expiresAt: number }
 */
const _feedCache = new Map();
const _inflightFeeds = new Map();
const FEED_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
const MAX_FEED_CACHE_ENTRIES = 50;
const FEED_REQUEST_DEADLINE_MS = 20000;
const USER_AGENT = 'Homey-Dashboard-Studio (RSS-Feed-Reader)';

/**
 * Cache for Intl.DateTimeFormat instances to avoid garbage collection churn.
 */
const _intlDtfCache = new Map();
function getCachedDtf(locale, options) {
    const key = `${locale || 'default'}_${JSON.stringify(options || {})}`;
    let f = _intlDtfCache.get(key);
    if (!f) {
        f = new Intl.DateTimeFormat(locale || undefined, options);
        _intlDtfCache.set(key, f);
    }
    return f;
}

/**
 * Clean up expired feed cache entries if cache size grows.
 */
function pruneFeedCache() {
    const now = Date.now();
    _feedCache.forEach((entry, url) => {
        if (entry.expiresAt <= now) {
            _feedCache.delete(url);
        }
    });
    if (_feedCache.size > MAX_FEED_CACHE_ENTRIES) {
        const firstKey = _feedCache.keys().next().value;
        if (firstKey) _feedCache.delete(firstKey);
    }
}

/**
 * Convert a numeric character reference to text; invalid code points are left untouched.
 */
function codePointToString(codePoint, original) {
    if (!isFinite(codePoint) || codePoint < 1 || codePoint > 0x10FFFF) return original;
    return String.fromCodePoint(codePoint);
}

/**
 * Decode common HTML entities.
 */
function decodeHtmlEntities(text) {
    return String(text || '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#(\d+);/g, (m, n) => codePointToString(parseInt(n, 10), m))
        .replace(/&#x([0-9a-f]+);/gi, (m, n) => codePointToString(parseInt(n, 16), m))
        .replace(/&quot;/g, '"')
        .replace(/&apos;|&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

/**
 * Strip scripts, styles, and HTML tags from a text string.
 */
function stripHtmlTags(text) {
    return String(text || '')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]*>/g, ' ');
}

/**
 * Strip raw HTTP/HTTPS URLs from text.
 */
function stripUrls(text) {
    return String(text || '')
        .replace(/https?:\/\/[^\s<>"']+/gi, ' ')
        .replace(/www\.[^\s<>"']+/gi, ' ');
}

/**
 * Collapse multiple whitespaces into a single space.
 */
function collapseSpaces(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
}

/**
 * Convert raw markup/text into plain text, stripping markdown table pipes and bracket tokens.
 */
function toPlainText(rawText) {
    let text = decodeHtmlEntities(rawText);
    const stripped = stripHtmlTags(text);
    // Escaped markup (&lt;p&gt;...) only reveals its own entities once the tags are gone.
    if (stripped !== text) text = decodeHtmlEntities(stripped);
    text = stripUrls(text);
    text = text
        .replace(/\|/g, ':')
        .replace(/[\n\r]+/g, ' ')
        .replace(/[\[\]<>]/g, '');
    return collapseSpaces(text).replace(/\s+([.,;:!?])/g, '$1');
}

/**
 * Truncate plain text safely at a word boundary with trailing ellipsis.
 */
function truncateAtWord(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    let cut = text.substring(0, maxLength);
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > Math.floor(maxLength * 0.6)) {
        cut = cut.substring(0, lastSpace);
    }
    cut = cut.replace(/[.,;:!?\-\s]+$/, '');
    return cut + '...';
}

/**
 * Extract an XML tag's inner string value, unwrapping CDATA blocks.
 */
const _tagRegexCache = new Map();
function extractTagValue(xmlBlock, tagName) {
    let regex = _tagRegexCache.get(tagName);
    if (!regex) {
        regex = new RegExp(`<${tagName}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i');
        _tagRegexCache.set(tagName, regex);
    }
    const match = xmlBlock.match(regex);
    if (!match) return '';
    return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
}

/**
 * Extract link URL from an RSS or Atom block.
 */
function extractLink(xmlBlock, isAtom) {
    if (isAtom) {
        const hrefMatch = xmlBlock.match(/<link\s+[^>]*href=["']([^"']+)["']/i);
        if (hrefMatch) return sanitizeUrl(hrefMatch[1]);
    }
    return sanitizeUrl(extractTagValue(xmlBlock, 'link'));
}

/**
 * Decode XML entities in a URL, accept only http(s), and escape characters that would break a markdown link or table cell.
 */
function sanitizeUrl(rawUrl) {
    const url = decodeHtmlEntities(rawUrl).trim();
    if (!/^https?:\/\//i.test(url)) return '';
    return url
        .replace(/ /g, '%20')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\|/g, '%7C');
}

const IMAGE_EXTENSION_REGEX = /\.(?:jpe?g|png|gif|webp|avif)(?:[?#]|$)/i;

/**
 * Read an XML attribute value from a single tag string.
 */
function tagAttribute(tag, name) {
    const match = tag.match(new RegExp(`\\s${name}=["']([^"']*)["']`, 'i'));
    return match ? match[1] : '';
}

/**
 * Whether an enclosure / media tag points at an image rather than audio or video.
 */
function isImageMediaTag(tag, isThumbnail) {
    if (isThumbnail) return true;
    const type = tagAttribute(tag, 'type').toLowerCase();
    if (type) return type.indexOf('image/') === 0;
    const medium = tagAttribute(tag, 'medium').toLowerCase();
    if (medium) return medium === 'image';
    return IMAGE_EXTENSION_REGEX.test(tagAttribute(tag, 'url'));
}

/**
 * Extract image URL from enclosure, media thumbnail/content, or inline img tags.
 */
function extractImageUrl(xmlBlock) {
    const mediaTags = xmlBlock.match(/<(?:enclosure|media:content|media:thumbnail)\s[^>]*>/gi) || [];
    for (let i = 0; i < mediaTags.length; i += 1) {
        const tag = mediaTags[i];
        if (!isImageMediaTag(tag, /^<media:thumbnail/i.test(tag))) continue;
        const url = sanitizeUrl(tagAttribute(tag, 'url'));
        if (url) return url;
    }
    const imgMatch = xmlBlock.match(/<img\s+[^>]*src=["']([^"']+)["']/i);
    if (imgMatch) return sanitizeUrl(imgMatch[1]) || null;
    return null;
}

/**
 * Parse date string from RSS or Atom tags into a JavaScript Date.
 */
function parseFeedDate(xmlBlock, isAtom) {
    const dateStr = isAtom
        ? (extractTagValue(xmlBlock, 'updated') || extractTagValue(xmlBlock, 'published'))
        : (extractTagValue(xmlBlock, 'pubDate') || extractTagValue(xmlBlock, 'dc:date'));
    if (!dateStr) return new Date(0);
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
}

/**
 * Stream-based feed fetcher and incremental parser with early abort when item cap is reached.
 */
class RssFeedFetcher {
    /**
     * @param {string} url
     * @param {number} maxItems
     */
    constructor(url, maxItems) {
        this.url = url;
        this.maxItems = Math.max(1, Math.min(maxItems || 15, 50));
        this.items = [];
        this.channelTitle = '';
        this.deadlineAt = 0;
    }

    fetch() {
        this.deadlineAt = Date.now() + FEED_REQUEST_DEADLINE_MS;
        return this.fetchWithRedirect(this.url, 0);
    }

    fetchWithRedirect(targetUrl, redirectCount) {
        return new Promise((resolve, reject) => {
            if (redirectCount > 5) {
                return reject(new Error('Too many HTTP redirects'));
            }

            let parsed;
            try {
                parsed = new URL(targetUrl);
            } catch (err) {
                return reject(new Error(`Invalid feed URL: ${targetUrl}`));
            }

            const client = parsed.protocol === 'https:' ? https : http;
            let activeReq = null;
            let activeRes = null;
            let settled = false;
            let buffer = '';
            let isAtom = false;

            const remainingMs = this.deadlineAt - Date.now();
            if (remainingMs <= 0) {
                return reject(new Error('Feed request timeout'));
            }
            const deadlineTimer = setTimeout(() => cleanup(new Error('Feed request timeout')), remainingMs);

            const cleanup = (err) => {
                if (settled) return;
                settled = true;
                clearTimeout(deadlineTimer);
                if (activeRes && !activeRes.destroyed) {
                    try { activeRes.destroy(); } catch (_) { }
                    activeRes = null;
                }
                if (activeReq && !activeReq.destroyed) {
                    try { activeReq.destroy(); } catch (_) { }
                    activeReq = null;
                }
                if (err) reject(err);
                else resolve({ channelTitle: this.channelTitle, items: this.items });
            };

            activeReq = client.get(targetUrl, {
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
                }
            }, (res) => {
                activeRes = res;
                res.setEncoding('utf8');
                res.on('error', (err) => cleanup(err));

                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    res.resume();
                    let redirectTarget;
                    try {
                        redirectTarget = new URL(res.headers.location, targetUrl).toString();
                    } catch (e) {
                        return cleanup(new Error('Invalid HTTP redirect URL'));
                    }
                    settled = true;
                    clearTimeout(deadlineTimer);
                    return resolve(this.fetchWithRedirect(redirectTarget, redirectCount + 1));
                }

                if (res.statusCode < 200 || res.statusCode >= 300) {
                    res.resume();
                    return cleanup(new Error(`HTTP status ${res.statusCode} from ${targetUrl}`));
                }

                res.on('data', (chunk) => {
                    if (settled) return;
                    buffer += chunk;

                    // Check feed type early
                    if (!isAtom && buffer.indexOf('<entry') !== -1) {
                        isAtom = true;
                    }

                    // Extract channel/feed title if not yet discovered
                    if (!this.channelTitle) {
                        const channelMatch = buffer.match(/<(?:channel|feed)[^>]*>[\s\S]*?<title(?:\s+[^>]*)?>([\s\S]*?)<\/title>/i);
                        if (channelMatch) {
                            const rawTitle = channelMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
                            this.channelTitle = toPlainText(rawTitle);
                        }
                    }

                    // Process completed item/entry tags from the rolling buffer
                    const tagStart = isAtom ? '<entry' : '<item';
                    const tagEnd = isAtom ? '</entry>' : '</item>';

                    let startIdx = buffer.indexOf(tagStart);
                    while (startIdx !== -1) {
                        const endIdx = buffer.indexOf(tagEnd, startIdx);
                        if (endIdx === -1) {
                            // Incomplete tag; wait for more stream chunks
                            break;
                        }

                        const blockEnd = endIdx + tagEnd.length;
                        const itemBlock = buffer.substring(startIdx, blockEnd);

                        // Parse the complete item block
                        const rawTitle = extractTagValue(itemBlock, 'title');
                        const link = extractLink(itemBlock, isAtom);
                        const date = parseFeedDate(itemBlock, isAtom);
                        const rawDesc = extractTagValue(itemBlock, isAtom ? 'summary' : 'description') || extractTagValue(itemBlock, 'content');
                        const image = extractImageUrl(itemBlock);

                        const cleanTitle = toPlainText(rawTitle);
                        if (cleanTitle) {
                            this.items.push({
                                title: cleanTitle,
                                link: link,
                                date: date,
                                excerpt: truncateAtWord(toPlainText(rawDesc), 240),
                                image: image || null
                            });
                        }

                        // Discard processed block from buffer immediately
                        buffer = buffer.substring(blockEnd);

                        // Early exit when maxItems is reached: stop downloading rest of the feed
                        if (this.items.length >= this.maxItems) {
                            return cleanup();
                        }

                        startIdx = buffer.indexOf(tagStart);
                    }

                    // Cap buffer size if feed is malformed without closing tags
                    if (buffer.length > 131072) {
                        buffer = buffer.substring(buffer.length - 65536);
                    }
                });

                res.on('end', () => {
                    cleanup();
                });
            });

            activeReq.on('error', (err) => {
                cleanup(err);
            });
        });
    }
}

/**
 * Year, month and day of a date in the given time zone (server zone when omitted).
 */
function getZonedYmd(date, timeZone) {
    const parts = getCachedDtf('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timeZone }).formatToParts(date);
    const ymd = { y: '', m: '', d: '' };
    for (let i = 0; i < parts.length; i += 1) {
        if (parts[i].type === 'year') ymd.y = parts[i].value;
        else if (parts[i].type === 'month') ymd.m = parts[i].value;
        else if (parts[i].type === 'day') ymd.d = parts[i].value;
    }
    return ymd;
}

/**
 * Format date/time string respecting universal date format settings and relative display.
 */
function formatArticleDate(targetDate, dateFormatMode, userDateFormat, timeZone) {
    if (!targetDate || isNaN(targetDate.getTime()) || targetDate.getTime() === 0) return '';
    if (dateFormatMode === 'hidden') return '';

    const tz = timeZone || undefined;
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz };
    const timeFormatter = getCachedDtf('en-GB', timeOptions);
    const clockTime = timeFormatter.format(targetDate);

    if (dateFormatMode === 'time_only') {
        return clockTime;
    }

    const target = getZonedYmd(targetDate, tz);
    const today = getZonedYmd(new Date(), tz);
    const targetKey = `${target.y}-${target.m}-${target.d}`;
    const todayKey = `${today.y}-${today.m}-${today.d}`;
    const yesterdayKey = new Date(Date.UTC(Number(today.y), Number(today.m) - 1, Number(today.d) - 1)).toISOString().slice(0, 10);

    // Format calendar date according to userDateFormat ('dd-mm-yyyy', 'mm-dd-yyyy', 'yyyy-mm-dd')
    let dateStr = `${target.d}-${target.m}-${target.y}`;
    if (userDateFormat === 'mm-dd-yyyy') dateStr = `${target.m}-${target.d}-${target.y}`;
    else if (userDateFormat === 'yyyy-mm-dd') dateStr = targetKey;

    const isToday = targetKey === todayKey;
    const isYesterday = targetKey === yesterdayKey;

    if (dateFormatMode === 'date_time') {
        return `${dateStr}<br>${clockTime}`;
    }

    // Default / Relative mode
    if (isToday) {
        return `Today<br>${clockTime}`;
    } else if (isYesterday) {
        return `Yesterday<br>${clockTime}`;
    } else {
        return `${dateStr}<br>${clockTime}`;
    }
}

/**
 * Parse multi-line or comma-separated URL string from the flow card argument.
 * Format per line: URL | [any order: Label, Icon (ph-...), Color (#... or @...)]
 */
function parseFeedSpecs(rawInput) {
    if (!rawInput) return [];
    const lines = String(rawInput).split(/[\r\n]+/);
    const specs = [];
    const seen = new Set();

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split('|').map(p => p.trim());
        let url = '';
        const nonUrlParts = [];

        for (let j = 0; j < parts.length; j += 1) {
            const p = parts[j];
            if (!url && (p.startsWith('http://') || p.startsWith('https://'))) {
                url = p;
            } else if (p) {
                nonUrlParts.push(p);
            }
        }

        if (!url || seen.has(url)) continue;
        seen.add(url);

        let customLabel = '';
        let icon = '';
        let color = '';

        for (let k = 0; k < nonUrlParts.length; k += 1) {
            const token = nonUrlParts[k];
            if (/^ph-[a-z0-9-]+$/i.test(token)) {
                icon = token.replace(/^ph-/i, '');
            } else if (/^#[0-9a-f]{3,8}$/i.test(token) || /^@[a-z0-9_-]+$/i.test(token)) {
                color = token;
            } else if (token.toLowerCase() === 'none') {
                icon = 'none';
            } else if (!customLabel) {
                customLabel = token;
            }
        }

        specs.push({
            url: url,
            customLabel: customLabel,
            icon: icon,
            color: color
        });
    }

    return specs;
}

/**
 * Fetch a feed through the cache. The item cap is part of the cache key because the fetcher stops
 * downloading once it is reached; concurrent requests for the same feed share one download.
 */
async function fetchFeedCached(url, maxItems) {
    const key = `${maxItems}|${url}`;
    const cached = _feedCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached;

    let pending = _inflightFeeds.get(key);
    if (!pending) {
        pending = new RssFeedFetcher(url, maxItems).fetch().then((result) => {
            const entry = {
                channelTitle: result.channelTitle || '',
                items: result.items,
                expiresAt: Date.now() + FEED_CACHE_TTL_MS
            };
            _feedCache.set(key, entry);
            return entry;
        }).finally(() => _inflightFeeds.delete(key));
        _inflightFeeds.set(key, pending);
    }
    return pending;
}

/**
 * Main coordinator: fetch feeds with caching, merge, sort, and render Markdown table.
 */
class RssStreamProcessor {
    /**
     * @param {object} options
     * @param {string} options.rawUrls
     * @param {string} options.layout 'standard' | 'full' | 'compact' | 'headlines'
     * @param {number} options.maxItems
     * @param {string} options.dateFormatMode 'default' | 'relative' | 'date_time' | 'time_only' | 'hidden'
     * @param {string} options.userDateFormat 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'yyyy-mm-dd'
     * @param {string} [options.timeZone]
     */
    static async process(options) {
        const feedSpecs = parseFeedSpecs(options.rawUrls);
        if (feedSpecs.length === 0) {
            throw new Error('Please provide at least one valid RSS or Atom feed URL starting with http:// or https://');
        }

        const maxItems = Math.max(1, Math.min(parseInt(options.maxItems, 10) || 10, 50));
        const layout = options.layout || 'standard';
        const imageWidth = Math.max(40, Math.min(parseInt(options.imageWidth, 10) || 180, 800));
        const dateFormatMode = options.dateFormatMode || 'default';
        const userDateFormat = options.userDateFormat || 'dd-mm-yyyy';
        const timeZone = options.timeZone || undefined;

        pruneFeedCache();

        let allItems = [];
        let failedCount = 0;
        let lastError = null;

        // Fetch feeds sequentially to prevent CPU/memory spikes on Homey
        for (let i = 0; i < feedSpecs.length; i += 1) {
            const spec = feedSpecs[i];
            let feedData;
            try {
                feedData = await fetchFeedCached(spec.url, maxItems);
            } catch (fetchErr) {
                // A failed feed is skipped so the others still render
                failedCount += 1;
                lastError = fetchErr;
                continue;
            }

            const label = spec.customLabel || feedData.channelTitle || 'News';
            const icon = (spec.icon === 'none') ? '' : (spec.icon || 'newspaper');
            const color = spec.color || `@markerTint${(i % 4) + 1}`;

            for (let j = 0; j < feedData.items.length; j += 1) {
                const item = feedData.items[j];
                allItems.push({
                    title: item.title,
                    link: item.link,
                    date: item.date,
                    excerpt: item.excerpt,
                    image: item.image,
                    feedLabel: label,
                    feedIcon: icon,
                    feedColor: color
                });
            }
        }

        if (failedCount === feedSpecs.length) {
            throw new Error(`Could not load RSS feed: ${lastError.message || lastError.code || 'connection failed'}`);
        }

        // Sort chronologically descending
        allItems.sort((a, b) => b.date.getTime() - a.date.getTime());

        // Cap to global maxItems
        allItems = allItems.slice(0, maxItems);

        const showSource = feedSpecs.length > 1;
        const showImage = layout === 'full';
        const showTimestamp = dateFormatMode !== 'hidden';
        const showExcerpt = layout === 'standard' || layout === 'full';

        // Build active table columns
        const cols = [];
        if (showSource) cols.push({ id: 'source', title: 'Source', align: ':---' });
        if (showImage) cols.push({ id: 'image', title: 'Image', align: ':---:' });
        cols.push({ id: 'headline', title: 'Headline', align: ':---' });
        if (showTimestamp) cols.push({ id: 'timestamp', title: 'Published', align: ':---:' });

        let markdown = '';
        if (allItems.length > 0) {
            markdown += '| ' + cols.map(c => c.title).join(' | ') + ' |\n';
            markdown += '| ' + cols.map(c => c.align).join(' | ') + ' |\n';

            for (let i = 0; i < allItems.length; i += 1) {
                const item = allItems[i];
                const cells = cols.map(c => {
                    switch (c.id) {
                        case 'source': {
                            const bgPrefix = item.feedColor ? `[cell ${item.feedColor}] ` : '';
                            const iconString = item.feedIcon ? `:ph-${item.feedIcon}|18: ` : '';
                            return `${bgPrefix}${iconString}${item.feedLabel}`.trim();
                        }
                        case 'image':
                            if (item.image) {
                                return `![|${imageWidth}](${item.image})`;
                            }
                            return '';
                        case 'headline': {
                            let linkTitle = item.link ? `### [${item.title}](${item.link} ^)` : `### ${item.title}`;
                            if (showExcerpt && item.excerpt) {
                                linkTitle += `<br>[color @textMuted]${item.excerpt}[/color]`;
                            }
                            return linkTitle;
                        }
                        case 'timestamp':
                            return formatArticleDate(item.date, dateFormatMode, userDateFormat, timeZone);
                        default:
                            return '';
                    }
                });
                markdown += '| ' + cells.join(' | ') + ' |\n';
            }
        }

        const latestHeadline = allItems.length > 0 ? allItems[0].title : '';
        const latestLink = allItems.length > 0 ? allItems[0].link : '';
        const latestSummary = allItems.length > 0 ? (allItems[0].excerpt || '') : '';
        const latestImageUrl = allItems.length > 0 ? (allItems[0].image || '') : '';

        return {
            markdown: markdown,
            articleCount: allItems.length,
            latestHeadline: latestHeadline,
            latestLink: latestLink,
            latestSummary: latestSummary,
            latestImageUrl: latestImageUrl
        };
    }
}

module.exports = {
    RssStreamProcessor,
    RssFeedFetcher,
    parseFeedSpecs,
    formatArticleDate
};
