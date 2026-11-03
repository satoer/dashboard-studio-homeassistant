'use strict';

const crypto = require('crypto');
const https = require('https');
const http = require('http');
const readline = require('readline');
const { parseSingleVeventLines, parseSingleVtimezoneLines, eventHasEffectiveRrule, expandRecurringEvents } = require('./webcal-markdown');

/**
 * Normalize URL string for stable short calendar IDs (privacy: not the full stored URL exposed per event downstream).
 */
function normalizeUrlForCalendarId(urlStr) {
    let s = String(urlStr || '').trim();
    try {
        if (s.startsWith('webcal://') || s.toLowerCase().startsWith('webcal://')) {
            s = 'https://' + s.replace(/^webcal:\/\//i, '');
        }
        const u = new URL(s);
        u.hash = '';
        let host = (u.hostname || '').toLowerCase();
        try {
            if (host && host.startsWith('[')) host = host.replace(/^\[|\]$/g, '');
        } catch (eInner) { /* ignore */ }
        return u.protocol + '//' + host + (u.port ? ':' + u.port : '') + u.pathname + u.search;
    } catch (e) {
        return String(urlStr || '').trim();
    }
}

function deriveCalendarIdFromUrl(urlStr) {
    const base = normalizeUrlForCalendarId(urlStr);
    return crypto.createHash('sha256').update(base || 'anonymous', 'utf8').digest('hex').slice(0, 12);
}

/**
 * Fast-path lightweight parser for discard checks.
 */
function parseSimpleIcalDate(val) {
    if (!val) return null;
    const s = String(val).trim();
    const m = s.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?/i);
    if (!m) return null;
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    const hasT = s.toUpperCase().indexOf('T') > 0;
    if (!hasT) {
        return new Date(Date.UTC(y, mo, d, 0, 0, 0, 0)).getTime();
    }
    const h = m[4] ? parseInt(m[4], 10) : 0;
    const mi = m[5] ? parseInt(m[5], 10) : 0;
    const se = m[6] ? parseInt(m[6], 10) : 0;
    return new Date(Date.UTC(y, mo, d, h, mi, se)).getTime();
}

/**
 * Streams an iCal file over HTTP/HTTPS; parses VEVENTs on the fly and buffers only events that can
 * affect the window, grouped by UID so RECURRENCE-ID / cancellations apply to RRULE masters.
 * Expansion runs once per UID after download completes.
 */
class ICalStreamFilter {
    constructor(url, filterStart, filterEnd, timeZone) {
        this.url = url;
        this.filterStart = filterStart;
        this.filterEnd = filterEnd;
        this.timeZone = timeZone;
        this.events = [];
        /** @type {Map<string, object[]>} */
        this.uidToEvents = new Map();
        this.syntheticUidCounter = 0;
        this.vtimezones = new Map();
        this.rangeDays = Math.max(1, Math.ceil((this.filterEnd.getTime() - this.filterStart.getTime()) / 86400000) + 1);
        this.maxInstancesPerUid = Math.min(20000, (this.rangeDays * 16) + 512);
        this.globalEmittedCap = Math.min(250000, this.maxInstancesPerUid * 500);
    }

    async process() {
        let targetUrl = this.url;
        if (targetUrl.startsWith('webcal://') || targetUrl.startsWith('webcal://'.toUpperCase())) {
            targetUrl = targetUrl.replace(/^webcal:\/\//i, 'https://');
        }
        this.calendarId = deriveCalendarIdFromUrl(targetUrl || this.url);
        await this.fetchUrl(targetUrl, 0);
        this.flushGroupedVeventsToEvents();
        return this.events;
    }

    flushGroupedVeventsToEvents() {
        let totalEmitted = 0;
        const calendarIdStamp = this.calendarId;

        const entries = [];
        this.uidToEvents.forEach(function (grp, uidKey) {
            entries.push({ uidKey: uidKey, grp: grp });
        });

        entries.sort(function (a, b) {
            const ca = String(a.uidKey)[0] === '_' ? 1 : 0;
            const cb = String(b.uidKey)[0] === '_' ? 1 : 0;
            if (ca !== cb) return ca - cb;
            if (a.uidKey < b.uidKey) return -1;
            if (a.uidKey > b.uidKey) return 1;
            return 0;
        });

        for (let ei = 0; ei < entries.length; ei += 1) {
            if (totalEmitted >= this.globalEmittedCap) break;
            const rawGroup = entries[ei].grp;
            if (!rawGroup || !rawGroup.length) continue;

            try {
                const budget = Math.min(this.maxInstancesPerUid, this.globalEmittedCap - totalEmitted);
                const expanded = expandRecurringEvents(
                    rawGroup,
                    this.filterStart,
                    this.filterEnd,
                    this.timeZone,
                    budget,
                    calendarIdStamp
                );
                if (!expanded || !expanded.length) continue;

                for (let j = 0; j < expanded.length; j += 1) {
                    if (totalEmitted >= this.globalEmittedCap) break;
                    this.events.push(expanded[j]);
                    totalEmitted += 1;
                }
            } catch (e) {
                // Keep stream resilient: skip malformed UID groups only
            }
        }
    }

    unfoldLines(lines) {
        const unfoldedLines = [];
        for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i];
            if ((line.startsWith(' ') || line.startsWith('\t')) && unfoldedLines.length > 0) {
                unfoldedLines[unfoldedLines.length - 1] += line.slice(1);
            } else {
                unfoldedLines.push(line);
            }
        }
        return unfoldedLines;
    }

    bufferVtimezone(lines) {
        try {
            const unfolded = this.unfoldLines(lines);
            const vtz = parseSingleVtimezoneLines(unfolded);
            if (vtz && vtz.tzid) {
                this.vtimezones.set(vtz.tzid, vtz);
                this.vtimezones.set(vtz.tzid.toLowerCase(), vtz);
            }
        } catch (e) {
            // Ignore malformed VTIMEZONE blocks
        }
    }

    bufferVeventIfRelevant(lines) {
        const unfoldedLines = this.unfoldLines(lines);
        let ev;
        try {
            ev = parseSingleVeventLines(unfoldedLines, this.timeZone, this.vtimezones);
        } catch (e) {
            return; // Unparseable component: skip it, keep the stream resilient
        }
        if (!ev || !ev.startDate) return;

        const hasSeries = eventHasEffectiveRrule(ev);
        const hasExc = !!(ev.recurrenceStart && !isNaN(ev.recurrenceStart.getTime()));
        if (ev.status === 'CANCELLED' && !hasSeries && !hasExc) return;

        // Pad filter window by 2 days (172800000 ms) for simple UTC vs Local floating timezone safety
        const safeFilterStart = this.filterStart.getTime() - 172800000;
        const safeFilterEnd = this.filterEnd.getTime() + 172800000;

        const isRecurring = hasSeries || (Array.isArray(ev.rDates) && ev.rDates.length > 0);
        const isException = hasExc || (ev.recurrenceId != null && String(ev.recurrenceId).trim() !== '');

        if (!isRecurring && !isException) {
            const sMs = ev.startDate.getTime();
            const eMs = ev.endDate ? ev.endDate.getTime() : sMs;
            if (eMs < safeFilterStart || sMs > safeFilterEnd) {
                return; // Discard standalone event completely outside our window
            }
        }

        // Recurring master that expired before our window
        if (isRecurring && ev.rrule && ev.rrule.UNTIL) {
            const untilMs = parseSimpleIcalDate(ev.rrule.UNTIL);
            if (untilMs !== null && untilMs < safeFilterStart) {
                return; // Discard expired series
            }
        }

        let key = ev.uid ? ev.uid.trim() : '';
        if (!key) {
            this.syntheticUidCounter += 1;
            key = '__no_uid_' + this.syntheticUidCounter;
        }

        let arr = this.uidToEvents.get(key);
        if (!arr) {
            arr = [];
            this.uidToEvents.set(key, arr);
        }
        arr.push(ev);
    }

    fetchUrl(targetUrl, redirectCount) {
        const self = this;
        return new Promise((resolve, reject) => {
            if (redirectCount > 5) {
                return reject(new Error('Too many HTTP redirects'));
            }

            let parsedUrl;
            try {
                parsedUrl = new URL(targetUrl);
            } catch (e) {
                return reject(new Error(`Invalid URL: ${targetUrl}`));
            }

            const client = parsedUrl.protocol === 'https:' ? https : http;
            let activeRes = null;
            let activeRl = null;
            let settled = false;

            const cleanup = (err) => {
                if (settled) return;
                settled = true;
                if (activeRl) {
                    try { activeRl.close(); } catch (_e) { }
                    activeRl = null;
                }
                if (activeRes && !activeRes.destroyed) {
                    try { activeRes.destroy(); } catch (_e) { }
                    activeRes = null;
                }
                if (err) reject(err);
                else resolve();
            };

            const req = client.get(targetUrl, {
                headers: {
                    'User-Agent': 'Homey-Dashboard-Studio/1.0',
                    'Accept': 'text/calendar'
                }
            }, (res) => {
                activeRes = res;
                res.on('error', (err) => cleanup(err));

                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    res.resume();
                    let newUrl;
                    try {
                        newUrl = new URL(res.headers.location, targetUrl).toString();
                    } catch (e) {
                        return cleanup(new Error('Invalid redirect URL'));
                    }
                    settled = true;
                    return resolve(this.fetchUrl(newUrl, redirectCount + 1));
                }

                if (res.statusCode < 200 || res.statusCode >= 300) {
                    res.resume();
                    return cleanup(new Error(`Failed to fetch iCal: HTTP ${res.statusCode}`));
                }

                const rl = readline.createInterface({
                    input: res,
                    crlfDelay: Infinity
                });
                activeRl = rl;

                let inEvent = false;
                let currentEventLines = [];
                let inTimezone = false;
                let currentTimezoneLines = [];

                rl.on('line', (line) => {
                    if (line.startsWith('BEGIN:VTIMEZONE')) {
                        inTimezone = true;
                        currentTimezoneLines = [line];
                    } else if (inTimezone) {
                        currentTimezoneLines.push(line);

                        if (currentTimezoneLines.length > 2000) {
                            inTimezone = false;
                            currentTimezoneLines = [];
                            return;
                        }

                        if (line.startsWith('END:VTIMEZONE')) {
                            self.bufferVtimezone(currentTimezoneLines);
                            inTimezone = false;
                            currentTimezoneLines = [];
                        }
                    } else if (line.startsWith('BEGIN:VEVENT')) {
                        inEvent = true;
                        currentEventLines = [line];
                    } else if (inEvent) {
                        currentEventLines.push(line);

                        if (currentEventLines.length > 5000) {
                            inEvent = false;
                            currentEventLines = [];
                            return;
                        }

                        if (line.startsWith('END:VEVENT')) {
                            self.bufferVeventIfRelevant(currentEventLines);
                            inEvent = false;
                            currentEventLines = [];
                        }
                    }
                });

                rl.on('close', () => {
                    cleanup();
                });

                rl.on('error', (err) => {
                    cleanup(err);
                });
            });

            req.on('error', (err) => {
                cleanup(err);
            });

            req.setTimeout(15000, () => {
                try { req.destroy(new Error('HTTP request timeout')); } catch (_e) { }
                cleanup(new Error('HTTP request timeout'));
            });
        });
    }
}

module.exports = {
    ICalStreamFilter
};
