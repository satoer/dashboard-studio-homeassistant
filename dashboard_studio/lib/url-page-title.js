'use strict';

const http = require('http');
const https = require('https');
const zlib = require('zlib');
const { URL } = require('url');

const MAX_BYTES = 512 * 1024;
const FETCH_TIMEOUT_MS = 12000;
const MAX_REDIRECTS = 6;

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const BROWSER_HEADERS = {
    'User-Agent': BROWSER_UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,nl;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
};

function decodeEntities(s) {
    return String(s == null ? '' : s)
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, function (_m, dec) {
            return String.fromCharCode(parseInt(dec, 10));
        })
        .replace(/&#x([0-9a-fA-F]+);/g, function (_m, hex) {
            return String.fromCharCode(parseInt(hex, 16));
        });
}

function cleanTitle(s) {
    return decodeEntities(String(s == null ? '' : s).replace(/\s+/g, ' ').trim());
}

function extractMetaProperty(html, property) {
    const re = new RegExp('<meta[^>]+(?:property|name)=["\']' + property + '["\'][^>]*>', 'gi');
    const matches = String(html).match(re);
    if (!matches) return '';
    for (let i = 0; i < matches.length; i++) {
        const tag = matches[i];
        let contentM = tag.match(/content=["']([\s\S]*?)["']/i);
        if (!contentM) {
            contentM = tag.match(/content=([^\s"'>]+)/i);
        }
        if (contentM && contentM[1]) {
            const v = cleanTitle(contentM[1]);
            if (v) return v;
        }
    }
    return '';
}

function extractTitleTag(html) {
    const m = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!m || !m[1]) return '';
    return cleanTitle(m[1]);
}

function extractTitleFromHtml(html) {
    const text = String(html == null ? '' : html);
    const og = extractMetaProperty(text, 'og:title');
    if (og) return og;
    const twitter = extractMetaProperty(text, 'twitter:title');
    if (twitter) return twitter;
    const tag = extractTitleTag(text);
    if (tag) return tag;
    const itemProp = extractMetaProperty(text, 'name');
    if (itemProp) return itemProp;
    return '';
}

function normalizeTargetUrl(raw) {
    let s = String(raw == null ? '' : raw).trim();
    if (!s) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) {
        s = 'https://' + s;
    }
    let parsed;
    try {
        parsed = new URL(s);
    } catch (_e) {
        return null;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
}

function streamToBuffer(res) {
    return new Promise((resolve, reject) => {
        let stream = res;
        let decompressor = null;
        const encoding = String(res.headers && res.headers['content-encoding'] || '').toLowerCase();
        if (encoding === 'gzip') {
            decompressor = zlib.createGunzip();
            stream = res.pipe(decompressor);
        } else if (encoding === 'deflate') {
            decompressor = zlib.createInflate();
            stream = res.pipe(decompressor);
        } else if (encoding === 'br') {
            decompressor = zlib.createBrotliDecompress();
            stream = res.pipe(decompressor);
        }

        let settled = false;
        const cleanup = (err) => {
            if (settled) return;
            settled = true;
            if (decompressor && typeof decompressor.destroy === 'function') {
                try { decompressor.destroy(); } catch (_e) {}
            }
            if (res && !res.destroyed) {
                try { res.destroy(); } catch (_e) {}
            }
            reject(err);
        };

        res.on('error', cleanup);
        if (decompressor) decompressor.on('error', cleanup);

        const chunks = [];
        let total = 0;
        stream.on('data', (chunk) => {
            total += chunk.length;
            if (total > MAX_BYTES) {
                cleanup(new Error('Response too large'));
                return;
            }
            chunks.push(chunk);
        });
        stream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        stream.on('error', (err) => {
            cleanup(err);
        });
    });
}

function fetchHtmlOnce(targetUrl, redirectCount, cookieJar) {
    return new Promise((resolve, reject) => {
        if (redirectCount > MAX_REDIRECTS) {
            return reject(new Error('Too many redirects'));
        }
        let parsed;
        try {
            parsed = new URL(targetUrl);
        } catch (e) {
            return reject(new Error('Invalid URL'));
        }
        const client = parsed.protocol === 'https:' ? https : http;
        const headers = Object.assign({}, BROWSER_HEADERS);
        if (cookieJar && cookieJar.length) {
            headers['Cookie'] = cookieJar.join('; ');
        }
        let activeRes = null;
        let settled = false;

        const cleanup = (err) => {
            if (settled) return;
            settled = true;
            if (activeRes && !activeRes.destroyed) {
                try { activeRes.destroy(); } catch (_e) {}
                activeRes = null;
            }
            if (err) reject(err);
        };

        const req = client.get(targetUrl, { headers: headers }, (res) => {
            activeRes = res;
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume();
                let newUrl;
                try {
                    newUrl = new URL(res.headers.location, targetUrl).toString();
                } catch (_e) {
                    return cleanup(new Error('Invalid redirect URL'));
                }
                const setCookies = res.headers['set-cookie'];
                if (Array.isArray(setCookies) && setCookies.length) {
                    cookieJar = cookieJar.concat(setCookies.map(function (c) {
                        return String(c).split(';')[0];
                    }).filter(Boolean));
                }
                settled = true;
                return resolve(fetchHtmlOnce(newUrl, redirectCount + 1, cookieJar));
            }
            if (res.statusCode < 200 || res.statusCode >= 300) {
                res.resume();
                return cleanup(new Error('HTTP ' + res.statusCode));
            }
            streamToBuffer(res).then(function (buf) {
                settled = true;
                let body = buf.toString('utf8');
                const charset = detectCharset(res.headers, body);
                if (charset && charset.toLowerCase() !== 'utf-8' && charset.toLowerCase() !== 'utf8') {
                    try {
                        body = buf.toString(charset);
                    } catch (_e) {
                        body = buf.toString('utf8');
                    }
                }
                resolve({ body: body, finalUrl: targetUrl });
            }).catch(cleanup);
        });
        req.on('error', cleanup);
        req.setTimeout(FETCH_TIMEOUT_MS, () => {
            try { req.destroy(new Error('Request timed out')); } catch (_e) {}
            cleanup(new Error('Request timed out'));
        });
    });
}

function detectCharset(headers, body) {
    const ct = String(headers && headers['content-type'] || '').toLowerCase();
    const ctM = ct.match(/charset=([^;]+)/);
    if (ctM && ctM[1]) return ctM[1].trim();
    const m = String(body).match(/<meta[^>]+charset=["']?([\w-]+)/i);
    if (m && m[1]) return m[1].trim();
    return '';
}

async function fetchHtml(targetUrl) {
    return fetchHtmlOnce(targetUrl, 0, []);
}

async function fetchUrlPageTitle(rawUrl) {
    const targetUrl = normalizeTargetUrl(rawUrl);
    if (!targetUrl) return '';
    try {
        const result = await fetchHtml(targetUrl);
        return extractTitleFromHtml(result.body);
    } catch (_e) {
        return '';
    }
}

const GOOGLE_FAVICON_BASE = 'https://s2.googleusercontent.com/s2/favicons';
const FAVICON_SIZE = 128;

const IMG_MAX_BYTES = 256 * 1024;
const IMG_TIMEOUT_MS = 10000;
const IMG_MAX_REDIRECTS = 5;

function fetchImageBytes(targetUrl, redirectCount) {
    return new Promise((resolve, reject) => {
        if (redirectCount > IMG_MAX_REDIRECTS) {
            return reject(new Error('Too many redirects'));
        }
        let parsed;
        try {
            parsed = new URL(targetUrl);
        } catch (e) {
            return reject(new Error('Invalid URL'));
        }
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return reject(new Error('Unsupported protocol'));
        }
        const client = parsed.protocol === 'https:' ? https : http;
        let activeRes = null;
        let settled = false;

        const cleanup = (err) => {
            if (settled) return;
            settled = true;
            if (activeRes && !activeRes.destroyed) {
                try { activeRes.destroy(); } catch (_e) {}
                activeRes = null;
            }
            if (err) reject(err);
        };

        const req = client.get(targetUrl, { headers: BROWSER_HEADERS }, (res) => {
            activeRes = res;
            res.on('error', cleanup);

            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume();
                let newUrl;
                try {
                    newUrl = new URL(res.headers.location, targetUrl).toString();
                } catch (_e) {
                    return cleanup(new Error('Invalid redirect URL'));
                }
                settled = true;
                return resolve(fetchImageBytes(newUrl, redirectCount + 1));
            }
            if (res.statusCode < 200 || res.statusCode >= 300) {
                res.resume();
                return cleanup(new Error('HTTP ' + res.statusCode));
            }
            const chunks = [];
            let total = 0;
            res.on('data', (chunk) => {
                total += chunk.length;
                if (total > IMG_MAX_BYTES) {
                    cleanup(new Error('Image too large'));
                    return;
                }
                chunks.push(chunk);
            });
            res.on('end', () => {
                settled = true;
                const buf = Buffer.concat(chunks);
                const contentType = String(res.headers && res.headers['content-type'] || 'image/x-icon').split(';')[0].trim();
                resolve({ buf: buf, contentType: contentType });
            });
        });
        req.on('error', cleanup);
        req.setTimeout(IMG_TIMEOUT_MS, () => {
            try { req.destroy(new Error('Image request timed out')); } catch (_e) {}
            cleanup(new Error('Image request timed out'));
        });
    });
}

function hostFromUrl(rawUrl) {
    try {
        const u = new URL(String(rawUrl || ''));
        return String(u.hostname || '');
    } catch (_e) {
        return '';
    }
}

function googleFaviconUrlForHost(rawUrl) {
    const host = hostFromUrl(normalizeTargetUrl(rawUrl) || rawUrl);
    if (!host) return '';
    return GOOGLE_FAVICON_BASE + '?domain=' + encodeURIComponent(host) + '&sz=' + FAVICON_SIZE;
}

/** Fetch favicon bytes via Google's S2 favicon service (domain-based). Returns { buf, contentType } or null. */
async function fetchFaviconBytes(rawUrl) {
    const faviconUrl = googleFaviconUrlForHost(rawUrl);
    if (!faviconUrl) return null;
    try {
        const result = await fetchImageBytes(faviconUrl, 0);
        if (result && result.buf && result.buf.length > 0) {
            return result;
        }
    } catch (_e) { /* ignore */ }
    return null;
}

module.exports = {
    extractTitleFromHtml,
    extractMetaProperty,
    normalizeTargetUrl,
    fetchUrlPageTitle,
    fetchFaviconBytes
};
