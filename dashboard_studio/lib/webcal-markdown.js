'use strict';

const { iconToMarkdownToken, MARKDOWN_PH_SPACER_SLUG } = require('./calendar-icon-bindings');

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const RRULE_DAY_TO_JS = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function getWeekStartSettingToJs(weekStart) {
    if (weekStart === 'sunday') return 0;
    if (weekStart === 'saturday') return 6;
    return 1;
}

/**
 * @param {number} weekStartJs 0=Sun … 6=Sat
 * @returns {string} one markdown table row: weekday column titles (no separator line)
 */
function getHeadersForMonth(weekStartJs, allowedDaysOfWeek, i18n) {
    if (!allowedDaysOfWeek) allowedDaysOfWeek = [0, 1, 2, 3, 4, 5, 6];
    const headers = [];
    for (let i = 0; i < 7; i += 1) {
        const d = (weekStartJs + i) % 7;
        if (allowedDaysOfWeek.includes(d)) {
            headers.push(i18n && i18n[DAY_NAMES[d]] ? i18n[DAY_NAMES[d]] : DAY_NAMES[d]);
        }
    }
    let md = `| ${headers.join(' | ')} |\n`;
    const alignments = [];
    for (let i = 0; i < headers.length; i += 1) alignments.push(':---');
    md += `| ${alignments.join(' | ')} |\n`;
    return md;
}

/**
 * @param {Date} d
 * @param {string} dateFormat  'dd-mm-yyyy' | 'mm-dd-yyyy' | 'yyyy-mm-dd'
 */
function formatUserDate(d, dateFormat) {
    if (!d || isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    if (dateFormat === 'mm-dd-yyyy') return `${m}-${day}-${y}`;
    if (dateFormat === 'yyyy-mm-dd') return `${y}-${m}-${day}`;
    return `${day}-${m}-${y}`;
}

function formatUserDateFromYMD(y, m0, d, dateFormat) {
    const m = String(m0 + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    if (dateFormat === 'mm-dd-yyyy') return `${m}-${day}-${y}`;
    if (dateFormat === 'yyyy-mm-dd') return `${y}-${m}-${day}`;
    return `${day}-${m}-${y}`;
}

/**
 * Finds the index of the first ':' outside of double quotes.
 * Fixes splitting on parameters like TZID="tzone://Microsoft/Utc".
 */
function indexOfUnquotedColon(line) {
    if (!line || typeof line !== 'string') return -1;
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const ch = line.charCodeAt(i);
        if (ch === 34) {
            inQuotes = !inQuotes;
        } else if (ch === 58 && !inQuotes) {
            return i;
        }
    }
    return -1;
}

/**
 * Extracts TZID parameter from property keyPart, supporting quoted or unquoted values.
 */
function extractTzidParam(keyPart) {
    if (!keyPart || typeof keyPart !== 'string') return '';
    const mQuoted = keyPart.match(/(?:^|;)TZID="([^"]+)"/i);
    if (mQuoted && mQuoted[1]) return mQuoted[1].trim();
    const mUnquoted = keyPart.match(/(?:^|;)TZID=([^;]+)/i);
    if (mUnquoted && mUnquoted[1]) return mUnquoted[1].replace(/^"+|"+$/g, '').trim();
    return '';
}

const WINDOWS_TO_IANA_TZ = Object.freeze({
    'tzone://microsoft/utc': 'UTC',
    'utc': 'UTC',
    'gmt': 'UTC',
    'z': 'UTC',
    'etc/utc': 'UTC',
    'etc/gmt': 'UTC',
    'utc-00': 'UTC',
    'utc+00': 'UTC',
    'greenwich mean time': 'UTC',
    'coordinated universal time': 'UTC',
    'gmt standard time': 'Europe/London',
    'greenwich standard time': 'Atlantic/Reykjavik',
    'w. europe standard time': 'Europe/Berlin',
    'central europe standard time': 'Europe/Budapest',
    'romance standard time': 'Europe/Paris',
    'central european standard time': 'Europe/Warsaw',
    'w. central africa standard time': 'Africa/Lagos',
    'e. europe standard time': 'Europe/Chisinau',
    'fle standard time': 'Europe/Kiev',
    'gtb standard time': 'Europe/Bucharest',
    'turkey standard time': 'Europe/Istanbul',
    'israel standard time': 'Asia/Jerusalem',
    'egypt standard time': 'Africa/Cairo',
    'south africa standard time': 'Africa/Johannesburg',
    'e. africa standard time': 'Africa/Nairobi',
    'arabic standard time': 'Asia/Baghdad',
    'arab standard time': 'Asia/Riyadh',
    'arabian standard time': 'Asia/Dubai',
    'iran standard time': 'Asia/Tehran',
    'russian standard time': 'Europe/Moscow',
    'india standard time': 'Asia/Kolkata',
    'sri lanka standard time': 'Asia/Colombo',
    'nepal standard time': 'Asia/Kathmandu',
    'central asia standard time': 'Asia/Almaty',
    'se asia standard time': 'Asia/Bangkok',
    'china standard time': 'Asia/Shanghai',
    'singapore standard time': 'Asia/Singapore',
    'taipei standard time': 'Asia/Taipei',
    'w. australia standard time': 'Australia/Perth',
    'tokyo standard time': 'Asia/Tokyo',
    'korea standard time': 'Asia/Seoul',
    'cen. australia standard time': 'Australia/Adelaide',
    'aus central standard time': 'Australia/Darwin',
    'e. australia standard time': 'Australia/Brisbane',
    'aus eastern standard time': 'Australia/Sydney',
    'tasmania standard time': 'Australia/Hobart',
    'new zealand standard time': 'Pacific/Auckland',
    'fiji standard time': 'Pacific/Fiji',
    'azores standard time': 'Atlantic/Azores',
    'cape verde standard time': 'Atlantic/Cape_Verde',
    'e. south america standard time': 'America/Sao_Paulo',
    'argentina standard time': 'America/Buenos_Aires',
    'sa eastern standard time': 'America/Cayenne',
    'greenland standard time': 'America/Godthab',
    'newfoundland standard time': 'America/St_Johns',
    'atlantic standard time': 'America/Halifax',
    'sa western standard time': 'America/La_Paz',
    'central brazilian standard time': 'America/Cuiaba',
    'pacific sa standard time': 'America/Santiago',
    'venezuela standard time': 'America/Caracas',
    'sa pacific standard time': 'America/Bogota',
    'eastern standard time': 'America/New_York',
    'us eastern standard time': 'America/Indianapolis',
    'central america standard time': 'America/Guatemala',
    'central standard time': 'America/Chicago',
    'central standard time (mexico)': 'America/Mexico_City',
    'canada central standard time': 'America/Regina',
    'us mountain standard time': 'America/Phoenix',
    'mountain standard time (mexico)': 'America/Chihuahua',
    'mountain standard time': 'America/Denver',
    'pacific standard time': 'America/Los_Angeles',
    'pacific standard time (mexico)': 'America/Tijuana',
    'alaskan standard time': 'America/Anchorage',
    'hawaiian standard time': 'Pacific/Honolulu',
    'samoa standard time': 'Pacific/Apia',
    'dateline standard time': 'Etc/GMT+12'
});

const _validIanaTzCache = new Map();
function isValidIanaTimeZone(tz) {
    if (!tz || typeof tz !== 'string') return false;
    if (_validIanaTzCache.has(tz)) return _validIanaTzCache.get(tz);
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
        if (_validIanaTzCache.size >= 500) _validIanaTzCache.clear();
        _validIanaTzCache.set(tz, true);
        return true;
    } catch (e) {
        if (_validIanaTzCache.size >= 500) _validIanaTzCache.clear();
        _validIanaTzCache.set(tz, false);
        return false;
    }
}

function resolveIanaTimeZone(rawTz) {
    if (!rawTz || typeof rawTz !== 'string') return null;
    const cleaned = rawTz.replace(/^"+|"+$/g, '').trim();
    if (!cleaned) return null;
    const lower = cleaned.toLowerCase();
    if (WINDOWS_TO_IANA_TZ[lower]) return WINDOWS_TO_IANA_TZ[lower];
    if (isValidIanaTimeZone(cleaned)) return cleaned;
    return null;
}

const _intlDtfCache = new Map();
function getCachedDtf(locale, options) {
    const o = options || {};
    let safeTz = o.timeZone;
    if (safeTz) {
        safeTz = resolveIanaTimeZone(String(safeTz)) || 'UTC';
    }
    const key = locale + '|' + (safeTz || '') + '|' + (o.year || '') + '|' + (o.month || '') + '|' + (o.day || '') + '|' + (o.hour || '') + '|' + (o.minute || '') + '|' + (o.second || '') + '|' + (o.hour12 != null ? o.hour12 : '');
    let f = _intlDtfCache.get(key);
    if (!f) {
        const safeOpts = Object.assign({}, o);
        if (safeTz) safeOpts.timeZone = safeTz;
        else delete safeOpts.timeZone;
        f = new Intl.DateTimeFormat(locale, safeOpts);
        _intlDtfCache.set(key, f);
    }
    return f;
}

function getCalendarYMDInTimeZone(utc, timeZone) {
    if (!timeZone) {
        return { y: utc.getUTCFullYear(), m0: utc.getUTCMonth(), d: utc.getUTCDate() };
    }
    const f = getCachedDtf('en-CA', { timeZone: timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    const str = f.format(utc);
    return {
        y: parseInt(str.slice(0, 4), 10),
        m0: parseInt(str.slice(5, 7), 10) - 1,
        d: parseInt(str.slice(8, 10), 10)
    };
}

function formatDateKeyInTimeZone(utc, timeZone) {
    if (!timeZone) {
        const p = getCalendarYMDInTimeZone(utc, null);
        return `${p.y}-${String(p.m0 + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
    }
    const f = getCachedDtf('en-CA', { timeZone: timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    return f.format(utc);
}

function addCivilCalendarDaysLocal(y, m0, d, delta) {
    const u = new Date(Date.UTC(y, m0, d + delta, 0, 0, 0, 0));
    return { y: u.getUTCFullYear(), m0: u.getUTCMonth(), d: u.getUTCDate() };
}

/**
 * Parses an iCal UTC offset string like "+0100", "-0500", "+0530" into milliseconds.
 */
function parseIcalUtcOffsetToMs(offsetStr) {
    if (!offsetStr || typeof offsetStr !== 'string') return null;
    const s = offsetStr.trim();
    const m = s.match(/^([+-])(\d{2})(\d{2})(\d{2})?$/);
    if (!m) return null;
    const sign = m[1] === '-' ? -1 : 1;
    const hh = parseInt(m[2], 10);
    const mm = parseInt(m[3], 10);
    const ss = m[4] ? parseInt(m[4], 10) : 0;
    return sign * (((hh * 3600) + (mm * 60) + ss) * 1000);
}

/**
 * Parses unfolded lines of a single VTIMEZONE block.
 */
function parseSingleVtimezoneLines(lines) {
    if (!lines || !lines.length) return null;
    let tzid = '';
    const rules = [];
    let currentRule = null;

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        const upper = line.toUpperCase();
        if (upper.indexOf('BEGIN:STANDARD') === 0) {
            currentRule = { type: 'STANDARD', offsetFromMs: 0, offsetToMs: 0, dtstart: '', rrule: null };
            continue;
        }
        if (upper.indexOf('BEGIN:DAYLIGHT') === 0) {
            currentRule = { type: 'DAYLIGHT', offsetFromMs: 0, offsetToMs: 0, dtstart: '', rrule: null };
            continue;
        }
        if (upper.indexOf('END:STANDARD') === 0 || upper.indexOf('END:DAYLIGHT') === 0) {
            if (currentRule) rules.push(currentRule);
            currentRule = null;
            continue;
        }
        if (upper.indexOf('END:VTIMEZONE') === 0) {
            if (currentRule) rules.push(currentRule);
            currentRule = null;
            continue;
        }
        const col = indexOfUnquotedColon(line);
        if (col < 0) continue;
        const key = line.substring(0, col).split(';')[0].trim().toUpperCase();
        const val = line.substring(col + 1).trim();

        if (!currentRule) {
            if (key === 'TZID') {
                tzid = val.replace(/^"+|"+$/g, '').trim();
            }
        } else {
            if (key === 'TZOFFSETFROM') {
                const ms = parseIcalUtcOffsetToMs(val);
                if (ms !== null) currentRule.offsetFromMs = ms;
            } else if (key === 'TZOFFSETTO') {
                const ms = parseIcalUtcOffsetToMs(val);
                if (ms !== null) currentRule.offsetToMs = ms;
            } else if (key === 'DTSTART') {
                currentRule.dtstart = val;
            } else if (key === 'RRULE') {
                currentRule.rrule = parseRRule(val);
            }
        }
    }
    if (!tzid || !rules.length) return null;
    return { tzid: tzid, rules: rules };
}

/**
 * Computes transition wall timestamp (as UTC-encoded ms) for a VTIMEZONE rule in target year.
 */
function getVtimezoneRuleTransitionWallMsInYear(rule, year) {
    let dtH = 0, dtM = 0, dtS = 0;
    let dtY = 1601, dtMo0 = 0, dtD = 1;
    if (rule.dtstart) {
        const m = rule.dtstart.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?/);
        if (m) {
            dtY = parseInt(m[1], 10);
            dtMo0 = parseInt(m[2], 10) - 1;
            dtD = parseInt(m[3], 10);
            dtH = m[4] ? parseInt(m[4], 10) : 0;
            dtM = m[5] ? parseInt(m[5], 10) : 0;
            dtS = m[6] ? parseInt(m[6], 10) : 0;
        }
    }
    if (year < dtY) return null;
    const rr = rule.rrule;
    if (!rr || String(rr.FREQ || '').toUpperCase() !== 'YEARLY') {
        return Date.UTC(dtY, dtMo0, dtD, dtH, dtM, dtS, 0);
    }
    if (rr.UNTIL) {
        const mu = rr.UNTIL.match(/^(\d{4})/);
        if (mu && year > parseInt(mu[1], 10)) return null;
    }
    const byMonths = parseIntegerList(rr.BYMONTH, 1, 12);
    const m0 = byMonths.length ? (byMonths[0] - 1) : dtMo0;
    const byDayList = parseRRuleByDayList(rr.BYDAY);
    const byMonthDay = parseIntegerList(rr.BYMONTHDAY, -31, 31).filter(function (n) { return n !== 0; });
    let candidates = [];
    const dim = daysInMonthUtc(year, m0);
    if (byMonthDay.length) {
        for (let di = 0; di < byMonthDay.length; di += 1) {
            const raw = byMonthDay[di];
            const d = raw > 0 ? raw : (dim + raw + 1);
            if (d >= 1 && d <= dim) candidates.push(d);
        }
    }
    if (byDayList.length) {
        const matchedDays = getDaysFromByDayInMonth(year, m0, byDayList);
        candidates = candidates.length
            ? candidates.filter(function (d) { return matchedDays.includes(d); })
            : matchedDays;
    }
    const day = candidates.length ? candidates[0] : dtD;
    return Date.UTC(year, m0, day, dtH, dtM, dtS, 0);
}

/**
 * Converts wall clock to UTC Date using parsed VTIMEZONE rules.
 */
function wallTimeInVtimezoneToUtc(y, m0, d, H, M, S, vtz) {
    const targetWallMs = Date.UTC(y, m0, d, H, M, S, 0);
    const rules = vtz && Array.isArray(vtz.rules) ? vtz.rules : [];
    if (!rules.length) return new Date(targetWallMs);
    if (rules.length === 1) {
        return new Date(targetWallMs - rules[0].offsetToMs);
    }

    const transitions = [];
    for (let yr = y - 1; yr <= y; yr += 1) {
        for (let i = 0; i < rules.length; i += 1) {
            const r = rules[i];
            const transMs = getVtimezoneRuleTransitionWallMsInYear(r, yr);
            if (transMs !== null && transMs <= targetWallMs) {
                transitions.push({ transMs: transMs, offsetToMs: r.offsetToMs });
            }
        }
    }

    if (transitions.length > 0) {
        transitions.sort(function (a, b) { return a.transMs - b.transMs; });
        const active = transitions[transitions.length - 1];
        return new Date(targetWallMs - active.offsetToMs);
    }

    for (let i = 0; i < rules.length; i += 1) {
        if (rules[i].type === 'STANDARD') {
            return new Date(targetWallMs - rules[i].offsetToMs);
        }
    }
    return new Date(targetWallMs - rules[0].offsetToMs);
}

function lookupVtimezone(vtimezoneMap, rawTz) {
    if (!vtimezoneMap || !rawTz) return null;
    const cleaned = String(rawTz).replace(/^"+|"+$/g, '').trim();
    if (!cleaned) return null;
    if (vtimezoneMap instanceof Map) {
        return vtimezoneMap.get(cleaned) || vtimezoneMap.get(cleaned.toLowerCase()) || null;
    }
    return vtimezoneMap[cleaned] || vtimezoneMap[cleaned.toLowerCase()] || null;
}

function utcToWallPartsInVtimezone(utcDate, vtz) {
    const utcMs = utcDate.getTime();
    const rules = vtz && Array.isArray(vtz.rules) ? vtz.rules : [];
    let offsetMs = 0;
    if (rules.length === 1) {
        offsetMs = rules[0].offsetToMs;
    } else if (rules.length > 1) {
        const approxYear = utcDate.getUTCFullYear();
        const transitions = [];
        for (let yr = approxYear - 1; yr <= approxYear + 1; yr += 1) {
            for (let i = 0; i < rules.length; i += 1) {
                const r = rules[i];
                const transWallMs = getVtimezoneRuleTransitionWallMsInYear(r, yr);
                if (transWallMs !== null) {
                    const transUtcMs = transWallMs - r.offsetFromMs;
                    if (transUtcMs <= utcMs) {
                        transitions.push({ transUtcMs: transUtcMs, offsetToMs: r.offsetToMs });
                    }
                }
            }
        }
        if (transitions.length > 0) {
            transitions.sort(function (a, b) { return a.transUtcMs - b.transUtcMs; });
            offsetMs = transitions[transitions.length - 1].offsetToMs;
        } else {
            offsetMs = rules[0].offsetToMs;
            for (let i = 0; i < rules.length; i += 1) {
                if (rules[i].type === 'STANDARD') {
                    offsetMs = rules[i].offsetToMs;
                    break;
                }
            }
        }
    }
    const wallDate = new Date(utcMs + offsetMs);
    return {
        y: wallDate.getUTCFullYear(),
        m0: wallDate.getUTCMonth(),
        d: wallDate.getUTCDate(),
        h: wallDate.getUTCHours(),
        m: wallDate.getUTCMinutes(),
        s: wallDate.getUTCSeconds(),
        ms: wallDate.getUTCMilliseconds()
    };
}

function wallTimeInZoneToUtc(y, m0, d, H, M, S, timeZone, vtimezoneMap, fallbackTimeZone) {
    if (!timeZone && !fallbackTimeZone) {
        return new Date(y, m0, d, H, M, S, 0);
    }
    const rawTz = timeZone ? String(timeZone).replace(/^"+|"+$/g, '').trim() : '';

    let ianaTz = resolveIanaTimeZone(rawTz);

    if (!ianaTz && rawTz && vtimezoneMap) {
        const vtz = lookupVtimezone(vtimezoneMap, rawTz);
        if (vtz) {
            return wallTimeInVtimezoneToUtc(y, m0, d, H, M, S, vtz);
        }
    }

    if (!ianaTz && fallbackTimeZone) {
        ianaTz = resolveIanaTimeZone(fallbackTimeZone);
    }
    if (!ianaTz) {
        return new Date(Date.UTC(y, m0, d, H, M, S, 0));
    }
    if (ianaTz === 'UTC') {
        return new Date(Date.UTC(y, m0, d, H, M, S, 0));
    }

    try {
        let guess = Date.UTC(y, m0, d, H, M, S, 0);
        const formatter = getCachedDtf('en-GB', {
            timeZone: ianaTz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        for (let i = 0; i < 48; i += 1) {
            const parts = {};
            formatter.formatToParts(new Date(guess)).forEach(function (p) {
                if (p.type !== 'literal') parts[p.type] = p.value;
            });
            const py = parseInt(parts.year, 10);
            const pm0 = parseInt(parts.month, 10) - 1;
            const pd = parseInt(parts.day, 10);
            const pH = parseInt(parts.hour, 10);
            const pM = parseInt(parts.minute, 10);
            const pS = parseInt(parts.second, 10);
            if (py === y && pm0 === m0 && pd === d && pH === H && pM === M && pS === S) {
                return new Date(guess);
            }
            guess += ((d - pd) * 86400000) + ((H - pH) * 3600000) + ((M - pM) * 60000) + ((S - pS) * 1000);
        }
        return new Date(guess);
    } catch (e) {
        return new Date(Date.UTC(y, m0, d, H, M, S, 0));
    }
}

function getHourInTimeZone(utc, timeZone) {
    if (!timeZone) {
        return utc.getHours();
    }
    const f = getCachedDtf('en-GB', { timeZone: timeZone, hour: '2-digit', hour12: false });
    return parseInt(f.format(utc), 10);
}

function parseICalDate(icalStr, timeZoneForFloating, vtimezoneMap, fallbackTimeZone) {
    if (!icalStr || typeof icalStr !== 'string') return null;
    const colIdx = indexOfUnquotedColon(icalStr);
    const s = colIdx >= 0 ? icalStr.substring(colIdx + 1) : icalStr;
    const match = s.match(/^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})(Z?))?/i);
    if (match) {
        const y = parseInt(match[1], 10);
        const mo = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const hasT = s.toUpperCase().indexOf('T') > 0;
        const h = (match[5] != null) ? parseInt(match[5], 10) : 0;
        const mi = (match[6] != null) ? parseInt(match[6], 10) : 0;
        const se = (match[7] != null) ? parseInt(match[7], 10) : 0;
        const hasZ = (match[8] != null && match[8].toUpperCase() === 'Z') || s.toUpperCase().indexOf('Z') > 0;
        if (!hasT) {
            return new Date(Date.UTC(y, mo, day, 12, 0, 0, 0));
        }
        if (hasZ) {
            return new Date(Date.UTC(y, mo, day, h, mi, se));
        }
        return wallTimeInZoneToUtc(y, mo, day, h, mi, se, timeZoneForFloating, vtimezoneMap, fallbackTimeZone);
    }
    return null;
}

function parseIcalDateValueToUtcMidnight(value) {
    if (!value || typeof value !== 'string') return null;
    const m = value.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!m) return null;
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    return new Date(Date.UTC(y, mo, d, 0, 0, 0, 0));
}

function parseIcalDateValueToUtcAtZoneMidnight(value, timeZoneForFloating, vtimezoneMap, fallbackTimeZone) {
    if (!value || typeof value !== 'string') return null;
    const m = value.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!m) return null;
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    if (timeZoneForFloating || fallbackTimeZone) {
        return wallTimeInZoneToUtc(y, mo, d, 0, 0, 0, timeZoneForFloating, vtimezoneMap, fallbackTimeZone);
    }
    return new Date(Date.UTC(y, mo, d, 0, 0, 0, 0));
}

function parseRRule(rruleStr) {
    const rule = {};
    if (!rruleStr) return rule;
    const parts = String(rruleStr).split(';');
    for (let p = 0; p < parts.length; p += 1) {
        const part = String(parts[p] || '').trim();
        const eq = part.indexOf('=');
        if (eq < 0) continue;
        const rkey = part.substring(0, eq).trim().toUpperCase();
        const rval = part.substring(eq + 1).trim();
        if (rkey && rval) rule[rkey] = rval;
    }
    return rule;
}

/** Normalizes RRULE objects after JSON round-trip (mixed-case keys). */
function normalizeIcsRruleObject(rrule) {
    if (!rrule || typeof rrule !== 'object' || Array.isArray(rrule)) return null;
    const out = {};
    const keys = Object.keys(rrule);
    for (let i = 0; i < keys.length; i += 1) {
        const k = keys[i];
        if (!Object.prototype.hasOwnProperty.call(rrule, k)) continue;
        const uk = String(k).trim().toUpperCase();
        const rawv = rrule[k];
        if (rawv == null) continue;
        const v = String(rawv).trim();
        if (!v) continue;
        out[uk] = v;
    }
    return Object.keys(out).length ? out : null;
}

function eventHasEffectiveRrule(ev) {
    const ruleNorm = normalizeIcsRruleObject(ev && ev.rrule);
    const freqRaw = ruleNorm ? ruleNorm.FREQ : '';
    return !!(freqRaw && String(freqRaw).trim() !== '');
}

function parseRRuleByDayList(byDayStr) {
    if (!byDayStr) return [];
    const out = [];
    const parts = String(byDayStr).split(',');
    for (let i = 0; i < parts.length; i += 1) {
        const t = String(parts[i] || '').trim().toUpperCase();
        if (!t) continue;
        const m = t.match(/^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/);
        if (!m) continue;
        const ord = (m[1] != null && m[1] !== '') ? parseInt(m[1], 10) : null;
        const dow = RRULE_DAY_TO_JS[m[2]];
        if (dow === undefined) continue;
        out.push({ ord: ord, dow: dow });
    }
    return out;
}

function parseIntegerList(str, min, max) {
    if (!str) return [];
    const out = [];
    const parts = String(str).split(',');
    for (let i = 0; i < parts.length; i += 1) {
        const v = parseInt(String(parts[i] || '').trim(), 10);
        if (!isFinite(v)) continue;
        if (min != null && v < min) continue;
        if (max != null && v > max) continue;
        out.push(v);
    }
    return out;
}

function uniqueNumberArray(arr) {
    const seen = {};
    const out = [];
    for (let i = 0; i < arr.length; i += 1) {
        const n = arr[i];
        const k = String(n);
        if (seen[k]) continue;
        seen[k] = true;
        out.push(n);
    }
    return out;
}

function getYmdInTimeZoneOrUtc(dateObj, timeZone, vtimezoneMap, fallbackTimeZone) {
    if (timeZone) {
        const iana = resolveIanaTimeZone(timeZone);
        if (iana) return getCalendarYMDInTimeZone(dateObj, iana);
        const vtz = lookupVtimezone(vtimezoneMap, timeZone);
        if (vtz) {
            const p = utcToWallPartsInVtimezone(dateObj, vtz);
            return { y: p.y, m0: p.m0, d: p.d };
        }
        if (fallbackTimeZone) {
            const fbIana = resolveIanaTimeZone(fallbackTimeZone);
            if (fbIana) return getCalendarYMDInTimeZone(dateObj, fbIana);
        }
    }
    return { y: dateObj.getUTCFullYear(), m0: dateObj.getUTCMonth(), d: dateObj.getUTCDate() };
}

function getTimePartsInTimeZone(dateObj, timeZone, vtimezoneMap, fallbackTimeZone) {
    if (!timeZone) {
        return {
            h: dateObj.getUTCHours(),
            m: dateObj.getUTCMinutes(),
            s: dateObj.getUTCSeconds(),
            ms: dateObj.getUTCMilliseconds()
        };
    }
    let iana = resolveIanaTimeZone(timeZone);
    if (!iana) {
        const vtz = lookupVtimezone(vtimezoneMap, timeZone);
        if (vtz) {
            return utcToWallPartsInVtimezone(dateObj, vtz);
        }
        if (fallbackTimeZone) iana = resolveIanaTimeZone(fallbackTimeZone);
    }
    if (!iana) {
        return {
            h: dateObj.getUTCHours(),
            m: dateObj.getUTCMinutes(),
            s: dateObj.getUTCSeconds(),
            ms: dateObj.getUTCMilliseconds()
        };
    }
    const f = getCachedDtf('en-GB', { timeZone: iana, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const str = f.format(dateObj);
    return {
        h: parseInt(str.slice(0, 2), 10),
        m: parseInt(str.slice(3, 5), 10),
        s: parseInt(str.slice(6, 8), 10),
        ms: 0
    };
}

function buildOccurrenceStartFromYmd(ymd, baseEvent, timeZoneForIcal, fallbackTimeZone) {
    if (!baseEvent || !baseEvent.startDate) return null;
    const vtzMap = (baseEvent && baseEvent._vtimezoneMap) || null;
    if (baseEvent.allDay) {
        if (timeZoneForIcal || fallbackTimeZone) {
            return wallTimeInZoneToUtc(ymd.y, ymd.m0, ymd.d, 0, 0, 0, timeZoneForIcal, vtzMap, fallbackTimeZone);
        }
        return new Date(Date.UTC(ymd.y, ymd.m0, ymd.d, 0, 0, 0, 0));
    }
    const t = (baseEvent && baseEvent.wallTime) || getTimePartsInTimeZone(baseEvent.startDate, timeZoneForIcal, vtzMap, fallbackTimeZone);
    if (timeZoneForIcal || fallbackTimeZone) {
        const dt = wallTimeInZoneToUtc(ymd.y, ymd.m0, ymd.d, t.h, t.m, t.s, timeZoneForIcal, vtzMap, fallbackTimeZone);
        dt.setUTCMilliseconds(t.ms || 0);
        return dt;
    }
    return new Date(Date.UTC(ymd.y, ymd.m0, ymd.d, t.h, t.m, t.s, t.ms || 0));
}

function startOfWeekYmd(ymd, weekStartDow) {
    const mid = new Date(Date.UTC(ymd.y, ymd.m0, ymd.d, 12, 0, 0, 0));
    const dow = mid.getUTCDay();
    const back = (dow - weekStartDow + 7) % 7;
    return addCivilCalendarDaysLocal(ymd.y, ymd.m0, ymd.d, -back);
}

function addMonthsYmd(ymd, deltaMonths) {
    const d = new Date(Date.UTC(ymd.y, ymd.m0 + deltaMonths, 1, 12, 0, 0, 0));
    return { y: d.getUTCFullYear(), m0: d.getUTCMonth(), d: 1 };
}

function daysInMonthUtc(y, m0) {
    return new Date(Date.UTC(y, m0 + 1, 0, 12, 0, 0, 0)).getUTCDate();
}

function getMonthDowMatches(y, m0, dow) {
    const out = [];
    const dim = daysInMonthUtc(y, m0);
    for (let d = 1; d <= dim; d += 1) {
        const test = new Date(Date.UTC(y, m0, d, 12, 0, 0, 0));
        if (test.getUTCDay() === dow) out.push(d);
    }
    return out;
}

function getDaysFromByDayInMonth(y, m0, byDayList) {
    const out = [];
    for (let i = 0; i < byDayList.length; i += 1) {
        const item = byDayList[i];
        const matches = getMonthDowMatches(y, m0, item.dow);
        if (!matches.length) continue;
        if (item.ord == null) {
            for (let j = 0; j < matches.length; j += 1) out.push(matches[j]);
            continue;
        }
        if (item.ord > 0) {
            const idx = item.ord - 1;
            if (idx >= 0 && idx < matches.length) out.push(matches[idx]);
        } else if (item.ord < 0) {
            const idx = matches.length + item.ord;
            if (idx >= 0 && idx < matches.length) out.push(matches[idx]);
        }
    }
    return uniqueNumberArray(out).sort(function (a, b) { return a - b; });
}

function parseDateListPropertyValue(value, isDateValue, tz, vtimezoneMap, fallbackTimeZone) {
    const items = String(value || '').split(',');
    const out = [];
    for (let i = 0; i < items.length; i += 1) {
        const raw = String(items[i] || '').trim();
        if (!raw) continue;
        let dt = null;
        if (isDateValue) dt = parseIcalDateValueToUtcAtZoneMidnight(raw, tz, vtimezoneMap, fallbackTimeZone) || parseIcalDateValueToUtcMidnight(raw);
        else dt = parseICalDate(raw, tz, vtimezoneMap, fallbackTimeZone);
        if (dt && !isNaN(dt.getTime())) out.push({ date: dt, isDateOnly: !!isDateValue });
    }
    return out;
}

/**
 * @param {string} defaultIcon
 * @param {Array<{icon:string,keywords?:string|Array}>} rules
 * @param {{ timeZone?: string, eventOrder?: string }} [resolverOpts] When `defaultIcon` is the reserved spacer slug, it is emitted only for timed events and only when `eventOrder` is `icon_time_title`.
 */
function buildIconResolver(defaultIcon, rules, resolverOpts) {
    const list = Array.isArray(rules) ? rules : [];
    const ro = resolverOpts || {};
    const tz = ro.timeZone;
    const orderNorm = normalizeCalendarEventOrder(ro.eventOrder);
    return function getIconToken(ev) {
        const evObj = ev && typeof ev === 'object' ? ev : null;
        const title = evObj && evObj.title != null ? String(evObj.title) : (typeof ev === 'string' ? ev : '');
        const lowerTitle = title.toLowerCase();
        for (let i = 0; i < list.length; i += 1) {
            const r = list[i];
            if (!r || !r.icon) continue;
            const kws = r.keywords;
            if (!kws) continue;
            const arr = Array.isArray(kws) ? kws : String(kws).split(',');
            for (let j = 0; j < arr.length; j += 1) {
                const kw = String(arr[j] || '').trim().toLowerCase();
                if (kw && lowerTitle.indexOf(kw) >= 0) {
                    return iconToMarkdownToken(r.icon);
                }
            }
        }
        if (!defaultIcon) return '';
        const dLow = String(defaultIcon).trim().toLowerCase();
        if (dLow === String(MARKDOWN_PH_SPACER_SLUG).toLowerCase()) {
            if (orderNorm !== 'icon_time_title') return '';
            if (!evObj || !evObj.startDate || isNaN(evObj.startDate.getTime())) return '';
            if (isEffectivelyAllDay(evObj, tz)) return '';
        }
        return iconToMarkdownToken(defaultIcon);
    };
}

function formatTime(dateObj, timeZone, i18n) {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    const f = getCachedDtf('en-GB', { timeZone: timeZone || undefined, hour: '2-digit', minute: '2-digit' });
    const t = f.format(dateObj);
    if (t === '00:00' || t === '24:00' || t === '00.00' || t === '24.00') return (i18n && i18n.AllDay) ? i18n.AllDay : 'All Day';
    return t;
}

/** Default for settings `calendarEventOrder` and unknown values. */
const CALENDAR_EVENT_ORDER_DEFAULT = 'icon_time_title';

const CALENDAR_EVENT_ORDER_SEQUENCES = Object.freeze({
    icon_time_title: ['icon', 'time', 'title'],
    icon_title_time: ['icon', 'title', 'time'],
    time_title_icon: ['time', 'title', 'icon'],
    time_icon_title: ['time', 'icon', 'title'],
    title_time_icon: ['title', 'time', 'icon'],
    title_icon_time: ['title', 'icon', 'time']
});

/** @returns {typeof CALENDAR_EVENT_ORDER_DEFAULT|'icon_title_time'|'time_title_icon'|'time_icon_title'|'title_time_icon'|'title_icon_time'} */
function normalizeCalendarEventOrder(raw) {
    const s = String(raw == null ? '' : raw).trim();
    return Object.prototype.hasOwnProperty.call(CALENDAR_EVENT_ORDER_SEQUENCES, s) ? s : CALENDAR_EVENT_ORDER_DEFAULT;
}

/**
 * Single place to combine icon markdown, timed label, and title for calendar markdown rows.
 * @param {string} order normalized `calendarEventOrder`
 * @param {{ icon?: string, time?: string, title?: string }} parts `time` typically `**HH:MM**` when inline
 * @param {{ skipKeys?: Set<string> }} [opts] e.g. day view skips `time` (shown in adjacent table column)
 * @returns {string}
 */
function joinCalendarMarkdownEventSegments(order, parts, opts) {
    const p = parts || {};
    const skip = opts && opts.skipKeys ? opts.skipKeys : null;
    const seq = CALENDAR_EVENT_ORDER_SEQUENCES[normalizeCalendarEventOrder(order)] || CALENDAR_EVENT_ORDER_SEQUENCES[CALENDAR_EVENT_ORDER_DEFAULT];
    const out = [];
    for (let i = 0; i < seq.length; i += 1) {
        const key = seq[i];
        if (skip && skip.has(key)) continue;
        const val = p[key];
        if (val == null) continue;
        const str = typeof val === 'string' ? val : String(val);
        if (str.trim() === '') continue;
        out.push(str);
    }
    return out.join(' ');
}

function calendarTimedInlineChunk(ev, timeZone, i18n) {
    if (!ev || !ev.startDate || isNaN(ev.startDate.getTime())) return '';
    if (isEffectivelyAllDay(ev, timeZone)) return '';
    return '**' + formatTime(ev.startDate, timeZone, i18n) + '**';
}

function getTimePartsForSort(dateObj, timeZone) {
    if (!dateObj || isNaN(dateObj.getTime())) return { h: 0, m: 0, s: 0 };
    if (!timeZone) {
        return {
            h: dateObj.getHours(),
            m: dateObj.getMinutes(),
            s: dateObj.getSeconds()
        };
    }
    const f = getCachedDtf('en-GB', { timeZone: timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const str = f.format(dateObj);
    return {
        h: parseInt(str.slice(0, 2), 10),
        m: parseInt(str.slice(3, 5), 10),
        s: parseInt(str.slice(6, 8), 10)
    };
}

/** Local hour 0–23 → section heading for week-style cells (stable sort key + label). */
function getTimedDaypartKeyAndLabel(hour24, i18n) {
    const h = (hour24 !== null && hour24 !== undefined && isFinite(hour24)) ? parseInt(hour24, 10) : 0;
    if (isNaN(h)) return { key: 0, label: (i18n && i18n['Night']) ? i18n['Night'] : 'Night' };
    if (h < 6) return { key: 0, label: (i18n && i18n['Night']) ? i18n['Night'] : 'Night' };
    if (h < 12) return { key: 1, label: (i18n && i18n['Morning']) ? i18n['Morning'] : 'Morning' };
    if (h < 18) return { key: 2, label: (i18n && i18n['Afternoon']) ? i18n['Afternoon'] : 'Afternoon' };
    return { key: 3, label: (i18n && i18n['Evening']) ? i18n['Evening'] : 'Evening' };
}

function isEffectivelyAllDay(ev, timeZone) {
    if (ev && ev.allDay) return true;
    if (!ev || !ev.startDate) return false;
    if (timeZone) {
        const f = getCachedDtf('en-GB', { timeZone: timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        return f.format(ev.startDate) === '00:00:00';
    }
    return ev.startDate.getHours() === 0 && ev.startDate.getMinutes() === 0 && ev.startDate.getSeconds() === 0;
}

function getDurationMs(ev) {
    if (!ev || !ev.startDate || !ev.endDate || isNaN(ev.startDate.getTime()) || isNaN(ev.endDate.getTime())) return 0;
    return ev.endDate.getTime() - ev.startDate.getTime();
}

function isMultiDayAllDay(ev, timeZone) {
    if (!ev) return false;
    if (ev.multiDayAllDay) return true;
    if (!isEffectivelyAllDay(ev, timeZone)) return false;
    if (!ev.startDate || !ev.endDate || isNaN(ev.startDate.getTime()) || isNaN(ev.endDate.getTime())) return false;
    // Exclusive end at the next civil midnight is one day, including a 25-hour fallback day.
    return civilDaysBetween(ev.startDate, ev.endDate, timeZone) > 1;
}

function isRecurringEvent(ev) {
    if (!ev || typeof ev !== 'object') return false;
    if (ev.isRecurring === true) return true;
    if (ev.recurrenceId != null && String(ev.recurrenceId).trim() !== '') return true;
    if (Array.isArray(ev.rDates) && ev.rDates.length > 0) return true;
    const norm = normalizeIcsRruleObject(ev.rrule) || null;
    if (norm && norm.FREQ && String(norm.FREQ).trim() !== '') return true;
    return false;
}

/** Text widget `[blockN:inner]` strips on first `]`; remove from user text to avoid truncation. */
function sanitizeCalendarMarkdownBlockInner(s) {
    return String(s || '').replace(/\]/g, '\u203a');
}

/**
 * Canonical block index for styling (matches Load & Filter iCal `calendarEventBlock`).
 * Recurring (including timed weekly) wins so block 4 tint applies.
 * Else: timed → 2, multi-day all-day → 3, single all-day → 1.
 */
function getCalendarEventMarkdownBlock(ev, timeZone) {
    if (isRecurringEvent(ev)) return 4;
    if (!isEffectivelyAllDay(ev, timeZone)) return 2;
    if (isMultiDayAllDay(ev, timeZone)) return 3;
    return 1;
}

/** Stable string label for dashboards / MQTT (matches `calendarEventKind` JSON). */
function getCalendarEventKind(ev, timeZone) {
    const b = getCalendarEventMarkdownBlock(ev, timeZone);
    if (b === 4) return 'recurring';
    if (b === 2) return 'timed';
    if (b === 3) return 'multi_day';
    return 'all_day';
}

/**
 * @param {{ useBlocks?: boolean, calendarColorBlockMode?: string, calendarSourceBlockMap?: Object<string,number>|null }} resolveOpts
 * Prefer calendar source map (settings) when mode calendar_source + wrap blocks; else `calendarEventBlock` from Load & Filter; else compute locally.
 */
function resolveCalendarEventMarkdownBlock(ev, timeZone, resolveOpts) {
    const ro = resolveOpts || {};
    const useBlocks = ro.useBlocks !== false;
    const mode = (ro.calendarColorBlockMode === 'calendar_source') ? 'calendar_source' : 'event_type';

    if (useBlocks && mode === 'calendar_source' && ev && typeof ev === 'object' && ev.calendarId != null) {
        const cid = String(ev.calendarId).trim();
        const map = ro.calendarSourceBlockMap;
        if (cid !== '' && map && typeof map === 'object') {
            if (Object.prototype.hasOwnProperty.call(map, cid)) {
                const n = map[cid];
                const blockNum = (typeof n === 'number' && isFinite(n)) ? n : parseInt(n, 10);
                if (blockNum >= 1 && blockNum <= 4) return blockNum;
            }
        }
        return getCalendarEventMarkdownBlock(ev, timeZone);
    }

    if (!ev || typeof ev !== 'object') return 1;
    const raw = ev.calendarEventBlock;
    if (raw != null && raw !== '') {
        const num = (typeof raw === 'number' && isFinite(raw)) ? raw : parseInt(raw, 10);
        if (num >= 1 && num <= 4) return num;
    }
    return getCalendarEventMarkdownBlock(ev, timeZone);
}

function wrapCalendarMarkdownBlock(blockIndex, innerMarkdownLine) {
    const idx = blockIndex >= 1 && blockIndex <= 4 ? blockIndex : 1;
    return '[block' + idx + ':' + sanitizeCalendarMarkdownBlockInner(innerMarkdownLine) + ']';
}

function isCalendarMarkdownBlockLine(line) {
    return /^\[block[1-4]:/i.test(String(line || '').trim());
}

function formatCalendarEventLine(useBlocks, blockIndex, innerMarkdownLine) {
    const inner = sanitizeCalendarMarkdownBlockInner(innerMarkdownLine);
    if (!useBlocks) return inner;
    return wrapCalendarMarkdownBlock(blockIndex, inner);
}

// When blocks are enabled: omit <br> only between consecutive [blockN:] lines (tinted strips).
// When blocks are disabled: always join with <br> so events remain readable.
function joinCalendarMarkdownCellParts(lines, useBlocks) {
    const arr = lines || [];
    let out = '';
    for (let i = 0; i < arr.length; i += 1) {
        const row = arr[i];
        if (i === 0) {
            out = row;
            continue;
        }
        const prev = arr[i - 1];
        const noBreakBetweenBlocks = !!useBlocks && isCalendarMarkdownBlockLine(prev) && isCalendarMarkdownBlockLine(row);
        out += (noBreakBetweenBlocks ? '' : '<br>') + row;
    }
    return out;
}

function getDisplaySortRank(ev, timeZone) {
    const allDay = isEffectivelyAllDay(ev, timeZone);
    const recurring = isRecurringEvent(ev);
    if (isMultiDayAllDay(ev, timeZone)) return 0;
    if (allDay && recurring) return 1;
    if (allDay) return 2;
    return 3;
}

function compareEventsForDisplay(a, b, timeZone) {
    const ra = getDisplaySortRank(a, timeZone);
    const rb = getDisplaySortRank(b, timeZone);
    if (ra !== rb) return ra - rb;
    if (ra === 3) {
        const ta = getTimePartsForSort(a && a.startDate, timeZone);
        const tb = getTimePartsForSort(b && b.startDate, timeZone);
        const sa = (ta.h * 3600) + (ta.m * 60) + ta.s;
        const sb = (tb.h * 3600) + (tb.m * 60) + tb.s;
        if (sa !== sb) return sa - sb;
    }
    const aa = a && a.startDate ? a.startDate.getTime() : 0;
    const bb = b && b.startDate ? b.startDate.getTime() : 0;
    if (aa !== bb) return aa - bb;
    const at = a && a.title ? String(a.title) : '';
    const bt = b && b.title ? String(b.title) : '';
    if (at < bt) return -1;
    if (at > bt) return 1;
    return 0;
}

function civilDaysBetween(startDate, endDate, timeZone) {
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
    const s = getYmdInTimeZoneOrUtc(startDate, timeZone);
    const e = getYmdInTimeZoneOrUtc(endDate, timeZone);
    return Math.round((Date.UTC(e.y, e.m0, e.d) - Date.UTC(s.y, s.m0, s.d)) / 86400000);
}

function isZoneMidnight(dateObj, timeZone) {
    if (!dateObj || isNaN(dateObj.getTime())) return false;
    const t = getTimePartsInTimeZone(dateObj, timeZone);
    const h = (t.h === 24) ? 0 : t.h;
    return h === 0 && t.m === 0 && t.s === 0;
}

function civilMidnightUtc(y, m0, d, timeZone) {
    if (timeZone) return wallTimeInZoneToUtc(y, m0, d, 0, 0, 0, timeZone);
    return new Date(Date.UTC(y, m0, d, 0, 0, 0, 0));
}

/**
 * All-day DTEND is an exclusive civil date. A millisecond duration taken from a year
 * whose start and end straddle a DST change is an hour off in years that do not.
 * Returns null when the master is not a date-only span, so the caller keeps the raw duration.
 */
function endDateFromAllDaySpan(masterStart, masterEnd, occurrenceStart, timeZone) {
    if (!occurrenceStart || isNaN(occurrenceStart.getTime())) return null;
    if (!isZoneMidnight(masterStart, timeZone) || !isZoneMidnight(masterEnd, timeZone)) return null;
    const days = civilDaysBetween(masterStart, masterEnd, timeZone);
    if (!isFinite(days) || days <= 0) return null;
    const occ = getYmdInTimeZoneOrUtc(occurrenceStart, timeZone);
    const endYmd = addCivilCalendarDaysLocal(occ.y, occ.m0, occ.d, days);
    return civilMidnightUtc(endYmd.y, endYmd.m0, endYmd.d, timeZone);
}

function addSpannedInstances(ev, instanceStart, filterStart, filterEnd, outArray, timeZone) {
    if (!instanceStart || isNaN(instanceStart.getTime())) return;
    let instanceEnd;
    if (ev.endDate && ev.startDate && !isNaN(ev.endDate.getTime()) && !isNaN(ev.startDate.getTime())) {
        const duration = ev.endDate.getTime() - ev.startDate.getTime();
        instanceEnd = new Date(instanceStart.getTime() + duration);
    } else {
        instanceEnd = new Date(instanceStart.getTime());
    }

    if (instanceStart > filterEnd) return;
    const hasDuration = instanceStart < instanceEnd;
    if (hasDuration) {
        if (instanceEnd <= filterStart) return;
    } else if (instanceEnd < filterStart) return;

    const overlapStartMs = Math.max(instanceStart.getTime(), filterStart.getTime());
    const overlapEndMs = hasDuration
        ? Math.min(instanceEnd.getTime() - 1, filterEnd.getTime())
        : Math.min(instanceStart.getTime(), filterEnd.getTime());
    if (overlapEndMs < overlapStartMs) return;

    const firstYmd = getYmdInTimeZoneOrUtc(new Date(overlapStartMs), timeZone);
    const lastYmd = getYmdInTimeZoneOrUtc(new Date(overlapEndMs), timeZone);
    const multiDayAllDay = !!(ev.allDay && civilDaysBetween(ev.startDate, ev.endDate, timeZone) > 1);

    let ymd = { y: firstYmd.y, m0: firstYmd.m0, d: firstYmd.d };
    let failsafe = 0;
    // Civil midnights, not filterStart + 24h. A window that opens before the autumn
    // fallback stays on the summer offset, which puts every later all-day event on the previous evening.
    while (failsafe < 400) {
        failsafe += 1;
        const dayStart = civilMidnightUtc(ymd.y, ymd.m0, ymd.d, timeZone);
        const nextYmd = addCivilCalendarDaysLocal(ymd.y, ymd.m0, ymd.d, 1);
        const nextDayStart = civilMidnightUtc(nextYmd.y, nextYmd.m0, nextYmd.d, timeZone);

        let overlapsThisDay = false;
        if (hasDuration) {
            overlapsThisDay = (instanceStart < nextDayStart && instanceEnd > dayStart);
        } else {
            overlapsThisDay = (instanceStart >= dayStart && instanceStart < nextDayStart);
        }

        if (overlapsThisDay) {
            let actualStartForThisDay = new Date(Math.max(instanceStart.getTime(), dayStart.getTime()));
            if (ev.allDay) actualStartForThisDay = dayStart;
            const sliceEndMs = hasDuration
                ? Math.min(instanceEnd.getTime(), nextDayStart.getTime())
                : instanceStart.getTime();

            const row = {
                title: ev.title,
                startDate: actualStartForThisDay,
                endDate: new Date(sliceEndMs),
                uid: ev.uid || '',
                rrule: ev.rrule,
                recurrenceId: ev.recurrenceId || '',
                allDay: !!ev.allDay,
                multiDayAllDay: multiDayAllDay
            };
            if (ev.calendarId != null && String(ev.calendarId) !== '') {
                row.calendarId = ev.calendarId;
            }
            outArray.push(row);
        }

        if (ymd.y === lastYmd.y && ymd.m0 === lastYmd.m0 && ymd.d === lastYmd.d) break;
        ymd = nextYmd;
    }
}

function buildOccurrenceKey(ev, startDate, timeZoneForIcal) {
    const uid = ev && ev.uid ? String(ev.uid) : '';
    if (ev && ev.allDay) {
        const d = formatDateKeyInTimeZone(startDate, timeZoneForIcal);
        return uid + '|D|' + d;
    }
    return uid + '|T|' + String(startDate.getTime());
}

function matchesDateFilter(itemDate, filterStart, filterEnd) {
    if (!itemDate || isNaN(itemDate.getTime())) return false;
    return itemDate >= filterStart && itemDate <= filterEnd;
}

function expandSimpleStep(ev, rule, filterStart, filterEnd, timeZoneForIcal, pushOccurrence, fallbackTimeZone) {
    let current = new Date(ev.startDate.getTime());
    const vtzMap = (ev && ev._vtimezoneMap) || null;
    const intervalRaw = rule.INTERVAL ? parseInt(rule.INTERVAL, 10) : 1;
    const interval = isFinite(intervalRaw) && intervalRaw > 0 ? intervalRaw : 1;
    const untilDate = rule.UNTIL ? parseICalDate(rule.UNTIL, timeZoneForIcal, vtzMap, fallbackTimeZone) : null;
    const maxCountRaw = rule.COUNT ? parseInt(rule.COUNT, 10) : null;
    const maxCount = (maxCountRaw != null && isFinite(maxCountRaw) && maxCountRaw > 0) ? maxCountRaw : Infinity;
    let produced = 0;
    let failsafe = 0;
    while (failsafe < 120000 && produced < maxCount) {
        failsafe += 1;
        if (untilDate && current > untilDate) break;
        if (current > filterEnd && !rule.COUNT) break;
        pushOccurrence(current);
        produced += 1;
        if (rule.FREQ === 'DAILY') {
            const ymd = getYmdInTimeZoneOrUtc(current, timeZoneForIcal, vtzMap, fallbackTimeZone);
            const next = addCivilCalendarDaysLocal(ymd.y, ymd.m0, ymd.d, interval);
            const stepped = buildOccurrenceStartFromYmd(next, ev, timeZoneForIcal, fallbackTimeZone);
            current = stepped || new Date(current.getTime() + interval * 86400000);
        }
        else if (rule.FREQ === 'MONTHLY') {
            const ymd = getYmdInTimeZoneOrUtc(current, timeZoneForIcal, vtzMap, fallbackTimeZone);
            let nextM0 = ymd.m0 + interval;
            let nextY = ymd.y + Math.floor(nextM0 / 12);
            nextM0 = ((nextM0 % 12) + 12) % 12;
            const dim = daysInMonthUtc(nextY, nextM0);
            const nextD = Math.min(ymd.d, dim);
            const stepped = buildOccurrenceStartFromYmd({ y: nextY, m0: nextM0, d: nextD }, ev, timeZoneForIcal, fallbackTimeZone);
            current = stepped || (function () {
                const c = new Date(current.getTime());
                c.setUTCMonth(c.getUTCMonth() + interval);
                return c;
            }());
        }
        else if (rule.FREQ === 'YEARLY') {
            const ymd = getYmdInTimeZoneOrUtc(current, timeZoneForIcal, vtzMap, fallbackTimeZone);
            const nextY = ymd.y + interval;
            const dim = daysInMonthUtc(nextY, ymd.m0);
            const nextD = Math.min(ymd.d, dim);
            const stepped = buildOccurrenceStartFromYmd({ y: nextY, m0: ymd.m0, d: nextD }, ev, timeZoneForIcal, fallbackTimeZone);
            current = stepped || (function () {
                const c = new Date(current.getTime());
                c.setUTCFullYear(c.getUTCFullYear() + interval);
                return c;
            }());
        }
        else break;
    }
}

function expandWeeklyByDay(ev, rule, filterStart, filterEnd, timeZoneForIcal, pushOccurrence, fallbackTimeZone) {
    const vtzMap = (ev && ev._vtimezoneMap) || null;
    const intervalRaw = rule.INTERVAL ? parseInt(rule.INTERVAL, 10) : 1;
    const interval = isFinite(intervalRaw) && intervalRaw > 0 ? intervalRaw : 1;
    const wkstKey = String(rule.WKST || 'MO').toUpperCase();
    const weekStartDow = (RRULE_DAY_TO_JS[wkstKey] !== undefined) ? RRULE_DAY_TO_JS[wkstKey] : 1;
    const untilDate = rule.UNTIL ? parseICalDate(rule.UNTIL, timeZoneForIcal, vtzMap, fallbackTimeZone) : null;
    const maxCountRaw = rule.COUNT ? parseInt(rule.COUNT, 10) : null;
    const maxCount = (maxCountRaw != null && isFinite(maxCountRaw) && maxCountRaw > 0) ? maxCountRaw : Infinity;
    const byDay = parseRRuleByDayList(rule.BYDAY).filter(function (it) { return it && it.ord == null; });
    const startYmd = getYmdInTimeZoneOrUtc(ev.startDate, timeZoneForIcal, vtzMap, fallbackTimeZone);
    const startDow = new Date(Date.UTC(startYmd.y, startYmd.m0, startYmd.d, 12, 0, 0, 0)).getUTCDay();
    const weekDays = uniqueNumberArray((byDay.length ? byDay.map(function (x) { return x.dow; }) : [startDow])).sort();
    let weekAnchor = startOfWeekYmd(startYmd, weekStartDow);
    let produced = 0;
    let failsafe = 0;
    while (failsafe < 120000 && produced < maxCount) {
        failsafe += 1;
        for (let i = 0; i < weekDays.length; i += 1) {
            const dow = weekDays[i];
            const dayOffset = (dow - weekStartDow + 7) % 7;
            const ymd = addCivilCalendarDaysLocal(weekAnchor.y, weekAnchor.m0, weekAnchor.d, dayOffset);
            const occurrenceStart = buildOccurrenceStartFromYmd(ymd, ev, timeZoneForIcal, fallbackTimeZone);
            if (!occurrenceStart) continue;
            if (occurrenceStart < ev.startDate) continue;
            if (untilDate && occurrenceStart > untilDate) return;
            if (occurrenceStart > filterEnd && !rule.COUNT) return;
            pushOccurrence(occurrenceStart);
            produced += 1;
            if (produced >= maxCount) return;
        }
        weekAnchor = addCivilCalendarDaysLocal(weekAnchor.y, weekAnchor.m0, weekAnchor.d, interval * 7);
    }
}

function monthMatchesFilters(month1, byMonthList) {
    if (!byMonthList || !byMonthList.length) return true;
    return byMonthList.includes(month1);
}

function expandMonthlyOrYearlyWithSelectors(ev, rule, filterStart, filterEnd, timeZoneForIcal, pushOccurrence, fallbackTimeZone) {
    const vtzMap = (ev && ev._vtimezoneMap) || null;
    const intervalRaw = rule.INTERVAL ? parseInt(rule.INTERVAL, 10) : 1;
    const interval = isFinite(intervalRaw) && intervalRaw > 0 ? intervalRaw : 1;
    const untilDate = rule.UNTIL ? parseICalDate(rule.UNTIL, timeZoneForIcal, vtzMap, fallbackTimeZone) : null;
    const maxCountRaw = rule.COUNT ? parseInt(rule.COUNT, 10) : null;
    const maxCount = (maxCountRaw != null && isFinite(maxCountRaw) && maxCountRaw > 0) ? maxCountRaw : Infinity;
    const byMonth = uniqueNumberArray(parseIntegerList(rule.BYMONTH, 1, 12));
    const byMonthDay = uniqueNumberArray(parseIntegerList(rule.BYMONTHDAY, -31, 31).filter(function (n) { return n !== 0; }));
    const byDay = parseRRuleByDayList(rule.BYDAY);
    const startYmd = getYmdInTimeZoneOrUtc(ev.startDate, timeZoneForIcal, vtzMap, fallbackTimeZone);
    let cursor = { y: startYmd.y, m0: (rule.FREQ === 'YEARLY') ? 0 : startYmd.m0, d: 1 };
    let produced = 0;
    let periodIndex = 0;
    let failsafe = 0;
    while (failsafe < 120000 && produced < maxCount) {
        failsafe += 1;
        const year = cursor.y;
        const monthIndexes = [];
        if (rule.FREQ === 'YEARLY') {
            const src = byMonth.length ? byMonth : [startYmd.m0 + 1];
            for (let bi = 0; bi < src.length; bi += 1) monthIndexes.push(src[bi] - 1);
            monthIndexes.sort(function (a, b) { return a - b; });
        } else {
            if (monthMatchesFilters(cursor.m0 + 1, byMonth)) monthIndexes.push(cursor.m0);
        }
        for (let mi = 0; mi < monthIndexes.length; mi += 1) {
            const m0 = monthIndexes[mi];
            const dim = daysInMonthUtc(year, m0);
            let days = [];
            if (byMonthDay.length) {
                for (let di = 0; di < byMonthDay.length; di += 1) {
                    const rawDay = byMonthDay[di];
                    const d = rawDay > 0 ? rawDay : (dim + rawDay + 1);
                    if (d >= 1 && d <= dim) days.push(d);
                }
            }
            if (byDay.length) {
                const byDayDays = getDaysFromByDayInMonth(year, m0, byDay);
                days = days.length ? days.filter(function (d) { return byDayDays.includes(d); }) : byDayDays.slice();
            }
            if (!days.length) {
                const fallbackDay = Math.min(startYmd.d, dim);
                days = [fallbackDay];
            }
            days = uniqueNumberArray(days).sort(function (a, b) { return a - b; });
            for (let di = 0; di < days.length; di += 1) {
                const ymd = { y: year, m0: m0, d: days[di] };
                const occurrenceStart = buildOccurrenceStartFromYmd(ymd, ev, timeZoneForIcal, fallbackTimeZone);
                if (!occurrenceStart) continue;
                if (occurrenceStart < ev.startDate) continue;
                if (untilDate && occurrenceStart > untilDate) return;
                if (occurrenceStart > filterEnd && !rule.COUNT) return;
                pushOccurrence(occurrenceStart);
                produced += 1;
                if (produced >= maxCount) return;
            }
        }
        periodIndex += 1;
        if (rule.FREQ === 'MONTHLY') cursor = addMonthsYmd(cursor, interval);
        else cursor = { y: startYmd.y + (periodIndex * interval), m0: 0, d: 1 };
    }
}

/** RECURRENCE-ID;RANGE=THISANDFUTURE is not modeled - exclusions/overrides apply to the single recurrence instance only. */

function hasValidRecurrenceStart(ev) {
    if (!ev || !ev.recurrenceStart) return false;
    const d = ev.recurrenceStart;
    return d instanceof Date && !isNaN(d.getTime());
}

function eventStatusCancelled(ev) {
    const s = String(ev && ev.status ? ev.status : 'CONFIRMED').trim().toUpperCase();
    return s === 'CANCELLED';
}

function seqNum(ev) {
    const n = ev && ev.sequence;
    if (n === null || n === undefined || n === '') return 0;
    const p = parseInt(String(n), 10);
    return isFinite(p) ? p : 0;
}

function populateExclusionsFromParsedExdates(exItems, seriesAllDay, tz, timedSet, daySet) {
    const arr = Array.isArray(exItems) ? exItems : [];
    for (let i = 0; i < arr.length; i += 1) {
        const it = arr[i];
        if (!it || !it.date || isNaN(it.date.getTime())) continue;
        if (seriesAllDay || it.isDateOnly) {
            daySet.add(formatDateKeyInTimeZone(it.date, tz));
        } else {
            timedSet.add(it.date.getTime());
        }
    }
}

function occurrenceExcluded(seriesAllDay, instanceStart, tz, timedSet, daySet) {
    if (!instanceStart || isNaN(instanceStart.getTime())) return true;
    if (seriesAllDay) return daySet.has(formatDateKeyInTimeZone(instanceStart, tz));
    return timedSet.has(instanceStart.getTime());
}

const EMPTY_FROZEN_ARRAY = Object.freeze([]);

/** Build display instance merged with optional recurrence exception overlay. recurrenceId/recurrenceStart cleared so instances are plain events. */
function composeInstanceEvent(masterEv, occurrenceStartDate, tz, ov, calendarIdStamp) {
    const durMaster = (masterEv.endDate && masterEv.startDate)
        ? Math.max(0, masterEv.endDate.getTime() - masterEv.startDate.getTime())
        : 0;
    let title = masterEv.title;
    let startDate = occurrenceStartDate;
    let allDay = !!masterEv.allDay;
    let endDate = null;
    if (ov && !eventStatusCancelled(ov)) {
        if (ov.title !== null && ov.title !== undefined && String(ov.title).trim() !== '') {
            title = ov.title;
        }
        if (ov.startDate && !isNaN(ov.startDate.getTime())) {
            startDate = ov.startDate;
        }
        if (ov.allDay !== null && ov.allDay !== undefined) allDay = !!ov.allDay;
        if (ov.endDate && !isNaN(ov.endDate.getTime())) {
            endDate = ov.endDate;
        }
    }
    if (!endDate) {
        if (allDay && masterEv.startDate && masterEv.endDate) {
            endDate = endDateFromAllDaySpan(masterEv.startDate, masterEv.endDate, startDate, tz);
        }
        if (!endDate) endDate = new Date(startDate.getTime() + durMaster);
    }
    const out = {
        title: title,
        startDate: startDate,
        endDate: endDate,
        uid: masterEv.uid || '',
        rrule: masterEv && masterEv.rrule ? masterEv.rrule : null,
        recurrenceId: '',
        allDay: allDay,
        multiDayAllDay: !!(allDay && civilDaysBetween(startDate, endDate, tz) > 1),
        status: 'CONFIRMED',
        sequence: 0,
        recurrenceStart: null,
        recurrenceIdDateOnly: false,
        exDates: EMPTY_FROZEN_ARRAY,
        rDates: EMPTY_FROZEN_ARRAY
    };
    if (calendarIdStamp != null && calendarIdStamp !== '') {
        out.calendarId = String(calendarIdStamp);
    }
    return out;
}

/**
 * @param {{
 *   timedExcludedPreset?: Set<number>,
 *   dayExcludedPreset?: Set<string>,
 *   skipSeedFromEvExdates?: boolean,
 *   timedOverrideMs?: Map<number, object>,
 *   overrideDay?: Map<string, object>,
 *   seriesAllDay?: boolean,
 *   calendarIdStamp?: string
 * }} opts
 */
function applyExDateRDateAndExpand(ev, starts, filterStart, filterEnd, timeZoneForIcal, expanded, maxEventInstances, opts) {
    const o = opts || {};
    const seriesAllDay = o.seriesAllDay != null ? !!o.seriesAllDay : !!ev.allDay;
    const timedSet = o.timedExcludedPreset ? o.timedExcludedPreset : new Set();
    const daySet = o.dayExcludedPreset ? o.dayExcludedPreset : new Set();
    if (!o.skipSeedFromEvExdates) {
        populateExclusionsFromParsedExdates(ev.exDates, seriesAllDay, timeZoneForIcal, timedSet, daySet);
    }
    const timedOverrideMs = (o.timedOverrideMs instanceof Map) ? o.timedOverrideMs : null;
    const overrideDayKey = (o.overrideDay instanceof Map) ? o.overrideDay : null;
    const cid = o.calendarIdStamp;
    const rdates = Array.isArray(ev.rDates) ? ev.rDates : [];

    let count = 0;
    const seen = {};
    const templateMaster = {};
    templateMaster.uid = ev.uid || '';
    templateMaster.title = ev.title;
    templateMaster.startDate = ev.startDate;
    templateMaster.endDate = ev.endDate;
    templateMaster.allDay = seriesAllDay;
    templateMaster.rrule = ev.rrule;

    function maybePush(startDate) {
        if (!startDate || isNaN(startDate.getTime())) return;
        if (occurrenceExcluded(seriesAllDay, startDate, timeZoneForIcal, timedSet, daySet)) return;

        let ovExc = null;
        if (timedOverrideMs && overrideDayKey) {
            if (seriesAllDay) {
                const k = formatDateKeyInTimeZone(startDate, timeZoneForIcal);
                ovExc = overrideDayKey.has(k) ? overrideDayKey.get(k) : null;
            } else {
                ovExc = timedOverrideMs.has(startDate.getTime()) ? timedOverrideMs.get(startDate.getTime()) : null;
            }
        } else if (timedOverrideMs && !seriesAllDay) {
            ovExc = timedOverrideMs.has(startDate.getTime()) ? timedOverrideMs.get(startDate.getTime()) : null;
        } else if (overrideDayKey && seriesAllDay) {
            const k = formatDateKeyInTimeZone(startDate, timeZoneForIcal);
            ovExc = overrideDayKey.has(k) ? overrideDayKey.get(k) : null;
        }

        const displayEv = composeInstanceEvent(templateMaster, startDate, timeZoneForIcal, ovExc, cid);
        const dk = buildOccurrenceKey(displayEv, displayEv.startDate || startDate, timeZoneForIcal);
        if (seen[dk]) return;
        seen[dk] = true;

        const dispStartMs = displayEv.startDate ? displayEv.startDate.getTime() : startDate.getTime();
        const dispEndMs = (displayEv.endDate && displayEv.startDate)
            ? displayEv.endDate.getTime()
            : dispStartMs;
        if (dispStartMs > filterEnd.getTime() || dispEndMs < filterStart.getTime()) return;
        if (count >= maxEventInstances) return;
        addSpannedInstances(displayEv, displayEv.startDate || startDate, filterStart, filterEnd, expanded, timeZoneForIcal);
        count += 1;
    }

    let iStart;
    for (iStart = 0; iStart < starts.length; iStart += 1) maybePush(starts[iStart]);
    let iR;
    for (iR = 0; iR < rdates.length; iR += 1) {
        const it = rdates[iR];
        if (!it || !it.date) continue;
        maybePush(it.date);
    }
}

/** Choose first RRULE-bearing master VEVENT not cancelled - EXDATE cancellations still apply via merged exclusions. */
function pickPrimaryMaster(mastersList) {
    for (let i = 0; i < mastersList.length; i += 1) {
        const m = mastersList[i];
        if (!m || !m.startDate) continue;
        if (eventStatusCancelled(m)) continue;
        if (eventHasEffectiveRrule(m)) return m;
    }
    return null;
}

/** Expand overlapping UID components (RFC 5546 recurrence overrides). RANGE=THISANDFUTURE unsupported. */
function expandUidBucket(uidGroup, filterStart, filterEnd, timeZoneForIcal, emitBudget, calendarIdStamp) {
    const out = [];
    if (!uidGroup.length || emitBudget <= 0) return out;

    const masters = [];
    const exceptions = [];
    const standalones = [];

    let g;
    for (g = 0; g < uidGroup.length; g += 1) {
        const raw = uidGroup[g];
        if (!raw || !raw.startDate) continue;
        if (hasValidRecurrenceStart(raw)) {
            exceptions.push(raw);
            continue;
        }
        if (eventHasEffectiveRrule(raw)) {
            masters.push(raw);
            continue;
        }
        standalones.push(raw);
    }

    const timedExcluded = new Set();
    const dayExcluded = new Set();

    let mi;
    for (mi = 0; mi < masters.length; mi += 1) {
        const m = masters[mi];
        populateExclusionsFromParsedExdates(m.exDates, !!m.allDay, timeZoneForIcal, timedExcluded, dayExcluded);
    }

    const overrideTimedMs = new Map();
    const overrideDay = new Map();

    const excSorted = exceptions.slice().sort(function (a, b) {
        return seqNum(a) - seqNum(b);
    });

    let exi;
    for (exi = 0; exi < excSorted.length; exi += 1) {
        const x = excSorted[exi];
        if (!hasValidRecurrenceStart(x)) continue;
        const masterHint = pickPrimaryMaster(masters);
        const seriesHintAllDay = masterHint ? !!masterHint.allDay : false;
        const useDayKey = !!(seriesHintAllDay || x.recurrenceIdDateOnly);
        if (eventStatusCancelled(x)) {
            if (useDayKey) {
                dayExcluded.add(formatDateKeyInTimeZone(x.recurrenceStart, timeZoneForIcal));
            } else {
                timedExcluded.add(x.recurrenceStart.getTime());
            }
            continue;
        }
        if (useDayKey) {
            overrideDay.set(formatDateKeyInTimeZone(x.recurrenceStart, timeZoneForIcal), x);
        } else {
            overrideTimedMs.set(x.recurrenceStart.getTime(), x);
        }
    }

    const primaryMaster = pickPrimaryMaster(masters);
    const seriesAllDay = primaryMaster ? !!primaryMaster.allDay : !!(standalones[0] && standalones[0].allDay);

    let remaining = emitBudget;

    let si;
    for (si = 0; si < standalones.length; si += 1) {
        const sEv = standalones[si];
        if (!sEv || !sEv.startDate) continue;
        if (eventStatusCancelled(sEv)) continue;
        const starts = [];
        function pushSs(dt) {
            if (!dt || isNaN(dt.getTime())) return;
            starts.push(new Date(dt.getTime()));
        }
        pushSs(sEv.startDate);
        const beforeLen = out.length;
        applyExDateRDateAndExpand(sEv, starts, filterStart, filterEnd, timeZoneForIcal, out, remaining, {
            calendarIdStamp: calendarIdStamp
        });
        remaining -= Math.max(0, out.length - beforeLen);
        if (remaining <= 0) return out;
    }

    if (!primaryMaster) return out;

    const startsCollect = [];
    function pushOcc(dt) {
        if (!dt || isNaN(dt.getTime())) return;
        startsCollect.push(new Date(dt.getTime()));
    }

    const ruleNorm = normalizeIcsRruleObject(primaryMaster.rrule);
    const freqRaw = ruleNorm ? ruleNorm.FREQ : '';
    if (!freqRaw || String(freqRaw).trim() === '') {
        pushOcc(primaryMaster.startDate);
        const beforePm = out.length;
        applyExDateRDateAndExpand(primaryMaster, startsCollect, filterStart, filterEnd, timeZoneForIcal, out, remaining, {
            timedExcludedPreset: timedExcluded,
            dayExcludedPreset: dayExcluded,
            skipSeedFromEvExdates: true,
            timedOverrideMs: overrideTimedMs,
            overrideDay: overrideDay,
            seriesAllDay: !!primaryMaster.allDay,
            calendarIdStamp: calendarIdStamp
        });
        remaining -= Math.max(0, out.length - beforePm);
        return out;
    }

    const freq = String(freqRaw).toUpperCase();
    const ruleForExpand = ruleNorm;
    const hasVtz = !!lookupVtimezone(primaryMaster._vtimezoneMap, primaryMaster.tzid);
    const expansionTz = (primaryMaster.tzid && (isValidIanaTimeZone(primaryMaster.tzid) || resolveIanaTimeZone(primaryMaster.tzid) || hasVtz))
        ? (resolveIanaTimeZone(primaryMaster.tzid) || primaryMaster.tzid)
        : timeZoneForIcal;

    if (freq === 'DAILY') {
        expandSimpleStep(primaryMaster, ruleForExpand, filterStart, filterEnd, expansionTz, pushOcc, timeZoneForIcal);
    } else if (freq === 'WEEKLY') {
        expandWeeklyByDay(primaryMaster, ruleForExpand, filterStart, filterEnd, expansionTz, pushOcc, timeZoneForIcal);
    } else if (freq === 'MONTHLY' || freq === 'YEARLY') {
        expandMonthlyOrYearlyWithSelectors(primaryMaster, ruleForExpand, filterStart, filterEnd, expansionTz, pushOcc, timeZoneForIcal);
    } else {
        pushOcc(primaryMaster.startDate);
    }

    applyExDateRDateAndExpand(primaryMaster, startsCollect, filterStart, filterEnd, timeZoneForIcal, out, remaining, {
        timedExcludedPreset: timedExcluded,
        dayExcludedPreset: dayExcluded,
        skipSeedFromEvExdates: true,
        timedOverrideMs: overrideTimedMs,
        overrideDay: overrideDay,
        seriesAllDay: !!primaryMaster.allDay,
        calendarIdStamp: calendarIdStamp
    });

    return out;
}

/**
 * @param {number} [emitBudgetOptional] Max instances for this invocation (streaming card passes per-fetch cap).
 * @param {string} [calendarIdOptional] Short opaque id from subscription URL hash.
 */
function expandRecurringEvents(events, filterStart, filterEnd, timeZoneForIcal, emitBudgetOptional, calendarIdOptional) {
    const expanded = [];
    const rangeDays = Math.max(1, Math.ceil((filterEnd.getTime() - filterStart.getTime()) / 86400000) + 1);
    const computedCap = Math.min(20000, (rangeDays * 16) + 512);
    const perInvocationCap = (emitBudgetOptional != null && isFinite(emitBudgetOptional) && emitBudgetOptional > 0)
        ? Math.min(Math.floor(emitBudgetOptional), 200000)
        : computedCap;

    /** @type {Map<string, object[]>} */
    const buckets = new Map();
    let noUidCtr = 0;

    let eidx;
    for (eidx = 0; eidx < events.length; eidx += 1) {
        const raw = events[eidx];
        if (!raw || !raw.startDate) continue;
        let k = raw.uid ? String(raw.uid).trim() : '';
        if (!k) {
            noUidCtr += 1;
            k = '__no_uid_' + noUidCtr;
        }
        let arr = buckets.get(k);
        if (!arr) {
            arr = [];
            buckets.set(k, arr);
        }
        arr.push(raw);
    }

    /** Stable UID bucket order - synthetic keys sort after real UIDs. */
    const keys = [];
    buckets.forEach(function (_v, key) {
        keys.push(key);
    });
    keys.sort(function (a, b) {
        const aa = String(a)[0] === '_' ? 1 : 0;
        const bb = String(b)[0] === '_' ? 1 : 0;
        if (aa !== bb) return aa - bb;
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    });

    let emittedTotal = 0;
    let bi;
    for (bi = 0; bi < keys.length; bi += 1) {
        if (emittedTotal >= perInvocationCap) break;
        const grp = buckets.get(keys[bi]);
        if (!grp.length) continue;
        const sliceBudget = Math.max(0, perInvocationCap - emittedTotal);
        const chunk = expandUidBucket(grp, filterStart, filterEnd, timeZoneForIcal, sliceBudget, calendarIdOptional);
        let ci;
        for (ci = 0; ci < chunk.length; ci += 1) {
            expanded.push(chunk[ci]);
        }
        emittedTotal += chunk.length;
    }

    expanded.sort(function (a, b) {
        const sa = a && a.startDate ? a.startDate.getTime() : 0;
        const sb = b && b.startDate ? b.startDate.getTime() : 0;
        if (sa !== sb) return sa - sb;
        const ta = a && a.title ? String(a.title) : '';
        const tb = b && b.title ? String(b.title) : '';
        if (ta < tb) return -1;
        if (ta > tb) return 1;
        return 0;
    });
    return expanded;
}

/** Parse lines belonging to a single VEVENT into an event object. */
function parseSingleVeventLines(lines, timeZoneForFloating, vtimezoneMap) {
    if (!lines || !lines.length) return null;
    const tz = timeZoneForFloating;
    const current = {
        uid: '',
        title: '',
        startDate: null,
        endDate: null,
        tzid: '',
        wallTime: null,
        _vtimezoneMap: vtimezoneMap || null,
        rrule: null,
        recurrenceId: '',
        recurrenceStart: null,
        recurrenceIdDateOnly: false,
        allDay: false,
        status: '',
        sequence: 0,
        exDates: [],
        rDates: []
    };
    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (line.indexOf('BEGIN:VEVENT') === 0 || line.indexOf('END:VEVENT') === 0) continue;
        const col = indexOfUnquotedColon(line);
        if (col < 0) continue;
        const keyPart = line.substring(0, col);
        const value = line.substring(col + 1);
        const key = keyPart.split(';')[0].trim().toUpperCase();
        if (key === 'SUMMARY') {
            current.title = value
                .replace(/\\[nN]/g, ' ')
                .replace(/\\,/g, ',')
                .replace(/\\;/g, ';')
                .replace(/\\\\/g, '\\')
                .replace(/\|/g, '\u2223');
        } else if (key === 'UID') {
            current.uid = String(value || '').trim();
        } else if (key === 'DTSTART') {
            const isDateValue = keyPart.toUpperCase().indexOf('VALUE=DATE') >= 0;
            const hasT = (value && value.indexOf('T') >= 0) && !isDateValue;
            const startTzid = extractTzidParam(keyPart);
            const resolvedStartTz = startTzid ? resolveIanaTimeZone(startTzid) : null;
            current.tzid = resolvedStartTz || startTzid || '';
            const startTz = resolvedStartTz || startTzid || tz;
            if (isDateValue) {
                current.startDate = parseIcalDateValueToUtcAtZoneMidnight(value, startTz, vtimezoneMap, tz) || parseICalDate(value, startTz, vtimezoneMap, tz);
            } else {
                current.startDate = parseICalDate(value, startTz, vtimezoneMap, tz);
            }
            current.allDay = isDateValue || !hasT;
            if (hasT && value && value.indexOf('Z') < 0 && (!value.endsWith('Z'))) {
                const tm = value.match(/T(\d{2})(\d{2})(\d{2})/);
                if (tm) {
                    current.wallTime = {
                        h: parseInt(tm[1], 10),
                        m: parseInt(tm[2], 10),
                        s: parseInt(tm[3], 10)
                    };
                }
            }
        } else if (key === 'DTEND') {
            const isDateValue = keyPart.toUpperCase().indexOf('VALUE=DATE') >= 0;
            const endTzid = extractTzidParam(keyPart);
            const endTz = endTzid || tz;
            if (isDateValue) {
                current.endDate = parseIcalDateValueToUtcAtZoneMidnight(value, endTz, vtimezoneMap, tz) || parseIcalDateValueToUtcMidnight(value) || parseICalDate(value, endTz, vtimezoneMap, tz);
            } else {
                current.endDate = parseICalDate(value, endTz, vtimezoneMap, tz);
            }
        } else if (key === 'RRULE') {
            current.rrule = parseRRule(value);
        } else if (key === 'RECURRENCE-ID') {
            const upperKp = keyPart.toUpperCase();
            const ridIsDateValue = upperKp.indexOf('VALUE=DATE') >= 0;
            const ridTzid = extractTzidParam(keyPart);
            const ridTz = ridTzid || tz;
            current.recurrenceId = String(value || '').trim();
            current.recurrenceIdDateOnly = !!ridIsDateValue;
            if (ridIsDateValue) {
                current.recurrenceStart = parseIcalDateValueToUtcAtZoneMidnight(value, ridTz, vtimezoneMap, tz) ||
                    parseIcalDateValueToUtcMidnight(value) ||
                    parseICalDate(value, ridTz, vtimezoneMap, tz);
            } else {
                current.recurrenceStart = parseICalDate(value, ridTz, vtimezoneMap, tz);
            }
        } else if (key === 'STATUS') {
            current.status = String(value || '').trim().toUpperCase();
        } else if (key === 'SEQUENCE') {
            const sq = parseInt(String(value || '').trim(), 10);
            current.sequence = isFinite(sq) ? sq : 0;
        } else if (key === 'EXDATE' || key === 'RDATE') {
            const upperKey = keyPart.toUpperCase();
            const isDateValue = upperKey.indexOf('VALUE=DATE') >= 0;
            const listTzid = extractTzidParam(keyPart);
            const listTz = listTzid || tz;
            const parsed = parseDateListPropertyValue(value, isDateValue, listTz, vtimezoneMap, tz);
            if (key === 'EXDATE') current.exDates = current.exDates.concat(parsed);
            else current.rDates = current.rDates.concat(parsed);
        }
    }
    if (!current.startDate) return null;
    if (!current.title) current.title = '(No title)';
    const stUpper = String(current.status || '').trim().toUpperCase();
    current.status = stUpper ? stUpper : 'CONFIRMED';
    return current;
}

/**
 * @param {string} text
 * @param {string} [timeZoneForFloating] IANA zone for floating DTSTART
 */
function parseIcsToEvents(text, timeZoneForFloating) {
    if (!text || typeof text !== 'string') return [];
    const unfolded = text.replace(/\r\n[ \t]|\n[ \t]/g, '');
    const lines = unfolded.split(/\r\n|\n|\r/);
    const events = [];
    const vtimezoneMap = new Map();
    let currentLines = null;
    let inTimezone = false;
    let tzLines = null;
    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (line.indexOf('BEGIN:VTIMEZONE') === 0) {
            inTimezone = true;
            tzLines = [line];
        } else if (inTimezone) {
            tzLines.push(line);
            if (line.indexOf('END:VTIMEZONE') === 0) {
                const vtz = parseSingleVtimezoneLines(tzLines);
                if (vtz && vtz.tzid) {
                    vtimezoneMap.set(vtz.tzid, vtz);
                    vtimezoneMap.set(vtz.tzid.toLowerCase(), vtz);
                }
                inTimezone = false;
                tzLines = null;
            }
        } else if (line.indexOf('BEGIN:VEVENT') === 0) {
            currentLines = [];
        } else if (line.indexOf('END:VEVENT') === 0 && currentLines) {
            try {
                const ev = parseSingleVeventLines(currentLines, timeZoneForFloating, vtimezoneMap);
                if (ev) {
                    const hasExc = ev.recurrenceStart && !isNaN(ev.recurrenceStart.getTime());
                    const hasSeries = eventHasEffectiveRrule(ev);
                    if (ev.status !== 'CANCELLED' || hasSeries || hasExc) events.push(ev);
                }
            } catch (e) {
                // Ignore unparseable component
            }
            currentLines = null;
        } else if (currentLines) {
            currentLines.push(line);
        }
    }
    return events;
}

function buildBlockResolveOptsFromCellOptions(allowedDaysWithOpts) {
    if (!allowedDaysWithOpts || typeof allowedDaysWithOpts !== 'object' || !allowedDaysWithOpts.__blockResolveOpts) {
        return { useBlocks: true, calendarColorBlockMode: 'event_type', calendarSourceBlockMap: null };
    }
    return allowedDaysWithOpts.__blockResolveOpts;
}

function buildMonthMarkdown(events, targetYear, targetMonth, weekStartJs, timeZone, getIcon, allowedDaysOfWeek, i18n) {
    if (!allowedDaysOfWeek) allowedDaysOfWeek = [0, 1, 2, 3, 4, 5, 6];
    const daysInMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 12, 0, 0, 0)).getUTCDate();
    
    const eventsByDate = {};
    for (let i = 0; i < events.length; i += 1) {
        const ev = events[i];
        if (!ev || !ev.startDate) continue;
        const k = timeZone ? formatDateKeyInTimeZone(ev.startDate, timeZone) : (function () {
            const p = getCalendarYMDInTimeZone(ev.startDate, null);
            return `${p.y}-${String(p.m0 + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
        }());
        if (!eventsByDate[k]) eventsByDate[k] = [];
        eventsByDate[k].push(ev);
    }

    const columns = [];
    for (let i = 0; i < 7; i += 1) {
        const d = (weekStartJs + i) % 7;
        if (allowedDaysOfWeek.includes(d)) columns.push(d);
    }

    let md = getHeadersForMonth(weekStartJs, allowedDaysOfWeek, i18n);
    let currentRow = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
        const dDate = new Date(Date.UTC(targetYear, targetMonth, day, 12, 0, 0, 0));
        const dow = dDate.getUTCDay();
        
        if (!allowedDaysOfWeek.includes(dow)) continue;
        
        const colIdx = columns.indexOf(dow);
        if (currentRow.length === 0) {
            for (let j = 0; j < colIdx; j += 1) {
                currentRow.push(currentRow.length === 0 ? '&nbsp;<br>&nbsp;<br>&nbsp;' : '');
            }
        }

        let cell = String(day);
        const dateKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (eventsByDate[dateKey]) {
            eventsByDate[dateKey].sort(function (a, b) {
                return compareEventsForDisplay(a, b, timeZone);
            });
            const useBlocks = allowedDaysOfWeek && typeof allowedDaysOfWeek === 'object' && allowedDaysOfWeek.__useBlocks === false ? false : true;
            const blockRo = buildBlockResolveOptsFromCellOptions(allowedDaysOfWeek);
            blockRo.useBlocks = useBlocks;
            const eventOrder = normalizeCalendarEventOrder(
                allowedDaysOfWeek && typeof allowedDaysOfWeek === 'object' && allowedDaysOfWeek.__eventOrder
                    ? allowedDaysOfWeek.__eventOrder
                    : null
            );
            let firstMoEvent = true;
            for (let e = 0; e < eventsByDate[dateKey].length; e += 1) {
                const ev = eventsByDate[dateKey][e];
                const icon = getIcon(ev);
                const lineMd = joinCalendarMarkdownEventSegments(eventOrder, {
                    icon: icon || '',
                    time: calendarTimedInlineChunk(ev, timeZone, i18n),
                    title: ev.title || ''
                });
                const bi = resolveCalendarEventMarkdownBlock(ev, timeZone, blockRo);
                const wrapped = formatCalendarEventLine(useBlocks, bi, lineMd);
                const sep = firstMoEvent ? '<br>' : (useBlocks ? '' : '<br>');
                cell += sep + wrapped;
                firstMoEvent = false;
            }
        }

        if (currentRow.length === 0) {
            const m = cell.match(/<br>/g);
            const breakCount = m ? m.length : 0;
            if (breakCount === 0) cell += '<br>&nbsp;<br>&nbsp;';
            else if (breakCount === 1) cell += '<br>&nbsp;';
        }

        currentRow.push(cell);
        if (currentRow.length === columns.length) {
            md += `| ${currentRow.join(' | ')} |\n`;
            currentRow = [];
        }
    }

    if (currentRow.length > 0) {
        while (currentRow.length < columns.length) currentRow.push('');
        md += `| ${currentRow.join(' | ')} |\n`;
    }
    return md;
}

function buildWeekMarkdown(events, weekStartYMD, weekStartJs, dateFormat, timeZone, getIcon, days, options, i18n) {
    const eventsByDate = {};
    for (let i = 0; i < events.length; i += 1) {
        const ev = events[i];
        if (!ev || !ev.startDate) continue;
        const k = timeZone ? formatDateKeyInTimeZone(ev.startDate, timeZone) : (function () {
            const p = getCalendarYMDInTimeZone(ev.startDate, null);
            return `${p.y}-${String(p.m0 + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
        }());
        if (!eventsByDate[k]) eventsByDate[k] = [];
        eventsByDate[k].push(ev);
    }

    const headerParts = [];
    for (let i = 0; i < days; i += 1) {
        const dayName = (i18n && i18n[DAY_NAMES[(weekStartJs + i) % 7]]) ? i18n[DAY_NAMES[(weekStartJs + i) % 7]] : DAY_NAMES[(weekStartJs + i) % 7];
        const ymd = addCivilCalendarDaysLocal(weekStartYMD.y, weekStartYMD.m0, weekStartYMD.d, i);
        const dateStr = formatUserDateFromYMD(ymd.y, ymd.m0, ymd.d, dateFormat);
        headerParts.push(`${dayName}<br>${dateStr}`);
    }
    let md = `| ${headerParts.join(' | ')} |\n`;
    const alignments = [];
    for (let i = 0; i < days; i += 1) alignments.push(':---');
    md += `| ${alignments.join(' | ')} |\n`;
    const rowCells = [];

    for (let i = 0; i < days; i += 1) {
        const ymd = addCivilCalendarDaysLocal(weekStartYMD.y, weekStartYMD.m0, weekStartYMD.d, i);
        const dateKey = `${ymd.y}-${String(ymd.m0 + 1).padStart(2, '0')}-${String(ymd.d).padStart(2, '0')}`;

        let cellHtml = '';
        if (eventsByDate[dateKey]) {
            eventsByDate[dateKey].sort(function (a, b) {
                return compareEventsForDisplay(a, b, timeZone);
            });
            const useBlocks = !(options && options.useBlocks === false);
            const showDaySections = !(options && options.showDaySections === false);
            const blockRo = options && options.blockResolveOpts ? options.blockResolveOpts : { useBlocks: useBlocks, calendarColorBlockMode: 'event_type', calendarSourceBlockMap: null };
            blockRo.useBlocks = useBlocks;
            const eventOrder = normalizeCalendarEventOrder(options && options.eventOrder);
            const lines = [];
            const allDayEvs = [];
            const timedEvs = [];
            for (let e0 = 0; e0 < eventsByDate[dateKey].length; e0 += 1) {
                const ev0 = eventsByDate[dateKey][e0];
                if (isEffectivelyAllDay(ev0, timeZone)) allDayEvs.push(ev0);
                else timedEvs.push(ev0);
            }
            timedEvs.sort(function (a, b) {
                return compareEventsForDisplay(a, b, timeZone);
            });
            let hasAllDayHeader = false;
            for (let e = 0; e < allDayEvs.length; e += 1) {
                const ev = allDayEvs[e];
                const icon = getIcon(ev);
                const lineInner = joinCalendarMarkdownEventSegments(eventOrder, {
                    icon: icon || '',
                    time: '',
                    title: ev.title || ''
                });
                if (showDaySections && !hasAllDayHeader) {
                    lines.push('**' + ((i18n && i18n.AllDay) ? i18n.AllDay : 'All Day') + '**');
                    hasAllDayHeader = true;
                }
                lines.push(formatCalendarEventLine(
                    useBlocks,
                    resolveCalendarEventMarkdownBlock(ev, timeZone, blockRo),
                    lineInner
                ));
            }
            let lastDaypartKey = null;
            for (let t = 0; t < timedEvs.length; t += 1) {
                const ev = timedEvs[t];
                const icon = getIcon(ev);
                const lineInner = joinCalendarMarkdownEventSegments(eventOrder, {
                    icon: icon || '',
                    time: calendarTimedInlineChunk(ev, timeZone, i18n),
                    title: ev.title || ''
                });
                const tp = getTimePartsForSort(ev.startDate, timeZone);
                const dp = getTimedDaypartKeyAndLabel(tp.h, i18n);
                if (showDaySections && lastDaypartKey !== dp.key) {
                    lines.push('**' + dp.label + '**');
                    lastDaypartKey = dp.key;
                }
                lines.push(formatCalendarEventLine(
                    useBlocks,
                    resolveCalendarEventMarkdownBlock(ev, timeZone, blockRo),
                    lineInner
                ));
            }
            cellHtml = joinCalendarMarkdownCellParts(lines, useBlocks);
        }
        rowCells.push(cellHtml === '' ? ' ' : cellHtml);
    }

    md += `| ${rowCells.join(' | ')} |\n`;
    return md;
}

/** @param {{y:number,m0:number,d:number}} ymd civil calendar components */
function formatYmdCalendarKey(ymd) {
    if (!ymd || typeof ymd !== 'object') return '';
    return String(ymd.y) + '-' + String(ymd.m0 + 1).padStart(2, '0') + '-' + String(ymd.d).padStart(2, '0');
}

/**
 * Events whose instance start falls on dateKey (same semantics as week/month cells).
 * @param {Array<any>} events
 * @param {string} dateKey YYYY-MM-DD
 * @param {string} [timeZone]
 */
function collectEventsStartingOnCalendarDateKey(events, dateKey, timeZone) {
    const list = [];
    const arr = Array.isArray(events) ? events : [];
    for (let i = 0; i < arr.length; i += 1) {
        const ev = arr[i];
        if (!ev || !ev.startDate || isNaN(ev.startDate.getTime())) continue;
        let k = '';
        if (timeZone) k = formatDateKeyInTimeZone(ev.startDate, timeZone);
        else {
            const p = getCalendarYMDInTimeZone(ev.startDate, null);
            k = `${p.y}-${String(p.m0 + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
        }
        if (k === dateKey) list.push(ev);
    }
    list.sort(function (a, b) {
        return compareEventsForDisplay(a, b, timeZone);
    });
    return list;
}

/**
 * Append two-column table rows (Time | Event) for one civil day: optional daypart / All Day headers, then one row per event.
 * @param {Array<string>} rowsOut mutates with full table lines including trailing newline
 */
function appendDayTwoColumnTableRows(rowsOut, dayEvents, timeZone, getIcon, useBlocks, blockRo, eventOrder, showDaySections, skipTimeInEventCell, i18n) {
    if (!dayEvents.length) {
        rowsOut.push('|  | *No events scheduled.* |\n');
        return;
    }
    const allDayEvs = [];
    const timedEvs = [];
    for (let e0 = 0; e0 < dayEvents.length; e0 += 1) {
        const ev0 = dayEvents[e0];
        if (isEffectivelyAllDay(ev0, timeZone)) allDayEvs.push(ev0);
        else timedEvs.push(ev0);
    }
    timedEvs.sort(function (a, b) {
        return compareEventsForDisplay(a, b, timeZone);
    });
    let hasAllDayHeader = false;
    for (let e = 0; e < allDayEvs.length; e += 1) {
        const ev = allDayEvs[e];
        const icon = getIcon(ev);
        const eventCellInner = joinCalendarMarkdownEventSegments(eventOrder, {
            icon: icon || '',
            time: '',
            title: ev.title || ''
        }, { skipKeys: skipTimeInEventCell });
        if (showDaySections && !hasAllDayHeader) {
            rowsOut.push('|  | **' + ((i18n && i18n.AllDay) ? i18n.AllDay : 'All Day') + '** |\n');
            hasAllDayHeader = true;
        }
        const biAll = resolveCalendarEventMarkdownBlock(ev, timeZone, blockRo);
        const timeLeft = '**' + ((i18n && i18n.AllDay) ? i18n.AllDay : 'All Day').toLowerCase() + '**';
        const lineAll = formatCalendarEventLine(useBlocks, biAll, eventCellInner);
        rowsOut.push('| ' + timeLeft + ' | ' + lineAll + ' |\n');
    }
    let lastDaypartKey = null;
    for (let t = 0; t < timedEvs.length; t += 1) {
        const ev = timedEvs[t];
        const icon = getIcon(ev);
        const eventCellInner = joinCalendarMarkdownEventSegments(eventOrder, {
            icon: icon || '',
            time: '',
            title: ev.title || ''
        }, { skipKeys: skipTimeInEventCell });
        const tp = getTimePartsForSort(ev.startDate, timeZone);
        const dp = getTimedDaypartKeyAndLabel(tp.h, i18n);
        if (showDaySections && lastDaypartKey !== dp.key) {
            rowsOut.push('|  | **' + dp.label + '** |\n');
            lastDaypartKey = dp.key;
        }
        const biT = resolveCalendarEventMarkdownBlock(ev, timeZone, blockRo);
        const timeTimed = '**' + formatTime(ev.startDate, timeZone, i18n) + '**';
        const lineTimed = formatCalendarEventLine(useBlocks, biT, eventCellInner);
        rowsOut.push('| ' + timeTimed + ' | ' + lineTimed + ' |\n');
    }
}

/**
 * Markdown H2 headings plus a `Time | Event` table per section (H2 cannot reliably live inside pipe-table cells).
 */
function buildTodayTomorrowListMarkdown(processedEvents, todayYMD, timeZone, getIcon, options, i18n) {
    const opts = options || {};
    const useBlocks = !(opts.useBlocks === false);
    const showDaySections = !(opts.showDaySections === false);
    const blockRo = opts.blockResolveOpts ? opts.blockResolveOpts : { useBlocks: useBlocks, calendarColorBlockMode: 'event_type', calendarSourceBlockMap: null };
    blockRo.useBlocks = useBlocks;
    const eventOrder = normalizeCalendarEventOrder(opts.eventOrder);
    const skipTimeInEventCell = new Set(['time']);

    const todayKey = formatYmdCalendarKey(todayYMD);
    const tom = addCivilCalendarDaysLocal(todayYMD.y, todayYMD.m0, todayYMD.d, 1);
    const tomorrowKey = formatYmdCalendarKey(tom);

    const todayList = collectEventsStartingOnCalendarDateKey(processedEvents, todayKey, timeZone);
    const tomorrowList = collectEventsStartingOnCalendarDateKey(processedEvents, tomorrowKey, timeZone);

    const timeLabel = (i18n && i18n.Time) ? i18n.Time : 'Time';
    const eventLabel = (i18n && i18n.Event) ? i18n.Event : 'Event';
    const tableHead = '| ' + timeLabel + ' | ' + eventLabel + ' |\n| :--- | :--- |\n';
    const todayRows = [];
    appendDayTwoColumnTableRows(todayRows, todayList, timeZone, getIcon, useBlocks, blockRo, eventOrder, showDaySections, skipTimeInEventCell, i18n);
    const tomorrowRows = [];
    appendDayTwoColumnTableRows(tomorrowRows, tomorrowList, timeZone, getIcon, useBlocks, blockRo, eventOrder, showDaySections, skipTimeInEventCell, i18n);

    const todayLabel = (i18n && i18n.Today) ? i18n.Today : 'Today';
    const tomorrowLabel = (i18n && i18n.Tomorrow) ? i18n.Tomorrow : 'Tomorrow';

    return '## ' + todayLabel + '\n\n' + tableHead + todayRows.join('') + '\n\n## ' + tomorrowLabel + '\n\n' + tableHead + tomorrowRows.join('');
}

function buildDayMarkdown(events, timeZone, getIcon, options, i18n) {
    if (events.length === 0) return '*No events scheduled.*';
    events.sort(function (a, b) {
        return compareEventsForDisplay(a, b, timeZone);
    });
    const useBlocks = !(options && options.useBlocks === false);
    const blockRo = options && options.blockResolveOpts ? options.blockResolveOpts : { useBlocks: useBlocks, calendarColorBlockMode: 'event_type', calendarSourceBlockMap: null };
    blockRo.useBlocks = useBlocks;
    const eventOrder = normalizeCalendarEventOrder(options && options.eventOrder);
    const skipTimeInEventCell = new Set(['time']);
    const timeLabel = (i18n && i18n.Time) ? i18n.Time : 'Time';
    const eventLabel = (i18n && i18n.Event) ? i18n.Event : 'Event';
    let md = '| ' + timeLabel + ' | ' + eventLabel + ' |\n| :--- | :--- |\n';
    for (let i = 0; i < events.length; i += 1) {
        const ev = events[i];
        if (!ev) continue;
        const icon = getIcon(ev);
        const t = isEffectivelyAllDay(ev, timeZone) ? '**' + ((i18n && i18n.AllDay) ? i18n.AllDay : 'All Day') + '**' : '**' + formatTime(ev.startDate, timeZone, i18n) + '**';
        const bi = resolveCalendarEventMarkdownBlock(ev, timeZone, blockRo);
        const eventCellInner = joinCalendarMarkdownEventSegments(eventOrder, {
            icon: icon || '',
            time: '',
            title: ev.title || ''
        }, { skipKeys: skipTimeInEventCell });
        md += '| ' + t + ' | ' + formatCalendarEventLine(useBlocks, bi, eventCellInner) + ' |\n';
    }
    return md;
}

/**
 * @param {string} icsString raw ICS
 * @param {object} options
 * @param {Date} options.filterStart
 * @param {Date} options.filterEnd
 * @param {string} options.viewFormat 'day_view'|'week_view'|'month_view'
 * @param {string} options.weekStart 'monday'|'sunday'|'saturday'
 * @param {string} options.dateFormat
 * @param {string} [options.defaultIcon]
 * @param {Array<{icon:string,keywords:string}>} [options.iconBindings]
 * @param {string} [options.timeZone] IANA
 * @param {{y:number,m0:number,d:number}} [options.anchorYMD] civil date for day/month title
 * @param {{y:number,m0:number,d:number}} [options.weekStartYMD] first day of week row (civil)
 */
function generateCalendarMarkdown(icsString, options) {
    const opts = options || {};
    const filterStart = opts.filterStart;
    const filterEnd = opts.filterEnd;
    if (!filterStart || !filterEnd || isNaN(filterStart.getTime()) || isNaN(filterEnd.getTime())) {
        return '*No calendar data.*';
    }
    const timeZone = opts.timeZone || undefined;
    const rawEvents = parseIcsToEvents(icsString, timeZone);
    const processed = expandRecurringEvents(rawEvents, filterStart, filterEnd, timeZone);
    processed.sort((a, b) => a.startDate - b.startDate);

    return generateCalendarMarkdownFromEvents(processed, options);
}

/**
 * @param {Array<any>} processedEvents already filtered and expanded events
 * @param {object} options
 */
function generateCalendarMarkdownFromEvents(processedEvents, options) {
    const opts = options || {};
    const timeZone = opts.timeZone || undefined;
    const weekStartJs = getWeekStartSettingToJs(opts.weekStart);
    const dateFormat = opts.dateFormat || 'dd-mm-yyyy';
    const anchorYMD = opts.anchorYMD;
    const viewFormat = opts.viewFormat || 'day_view';
    const useBlocks = !(opts && opts.useBlocks === false);
    const showDaySections = !(opts && opts.showDaySections === false);

    const colorMode = (opts.calendarColorBlockMode === 'calendar_source') ? 'calendar_source' : 'event_type';
    const blockResolveOpts = {
        useBlocks: useBlocks,
        calendarColorBlockMode: colorMode,
        calendarSourceBlockMap: opts.calendarSourceBlockMap && typeof opts.calendarSourceBlockMap === 'object' ? opts.calendarSourceBlockMap : null
    };
    const eventOrder = normalizeCalendarEventOrder(opts.calendarEventOrder);
    const getIcon = buildIconResolver(opts.defaultIcon, opts.iconBindings, {
        timeZone: timeZone,
        eventOrder: eventOrder
    });

    // Fallback if no filterStart provided
    const filterStart = opts.filterStart || new Date();

    if (viewFormat === 'day_view') {
        const targetKey = formatDateKeyInTimeZone(filterStart, timeZone);
        const dayEvents = (Array.isArray(processedEvents) ? processedEvents : []).filter(function (ev) {
            if (!ev || !ev.startDate || isNaN(ev.startDate.getTime())) return false;
            return formatDateKeyInTimeZone(ev.startDate, timeZone) === targetKey;
        });
        blockResolveOpts.useBlocks = useBlocks;
        return buildDayMarkdown(dayEvents, timeZone, getIcon, { useBlocks: useBlocks, blockResolveOpts: blockResolveOpts, eventOrder: eventOrder }, opts.i18n);
    }
    if (viewFormat === 'today_tomorrow_list') {
        const anchorDay = anchorYMD || getCalendarYMDInTimeZone(filterStart, timeZone);
        blockResolveOpts.useBlocks = useBlocks;
        return buildTodayTomorrowListMarkdown(processedEvents, anchorDay, timeZone, getIcon, {
            useBlocks: useBlocks,
            showDaySections: showDaySections,
            blockResolveOpts: blockResolveOpts,
            eventOrder: eventOrder
        }, opts.i18n);
    }
    if (viewFormat === 'week_view' || viewFormat === 'workweek_view' || viewFormat === 'weekend_view') {
        const w = opts.weekStartYMD;
        let startJs = weekStartJs;
        let days = 7;
        
        if (viewFormat === 'workweek_view') {
            startJs = 1;
            days = 5;
        } else if (viewFormat === 'weekend_view') {
            startJs = 6;
            days = 2;
        }
        
        blockResolveOpts.useBlocks = useBlocks;
        const weekOpts = { useBlocks: useBlocks, showDaySections: showDaySections, blockResolveOpts: blockResolveOpts, eventOrder: eventOrder };
        if (w) {
            return buildWeekMarkdown(processedEvents, w, startJs, dateFormat, timeZone, getIcon, days, weekOpts, opts.i18n);
        }
        const f = getCalendarYMDInTimeZone(filterStart, timeZone);
        return buildWeekMarkdown(processedEvents, f, startJs, dateFormat, timeZone, getIcon, days, weekOpts, opts.i18n);
    }
    if (viewFormat.startsWith('month_view') || viewFormat === 'month_workweek_view' || viewFormat === 'month_weekend_view') {
        let allowedDays = [0, 1, 2, 3, 4, 5, 6];
        if (viewFormat === 'month_workweek_view') allowedDays = [1, 2, 3, 4, 5];
        else if (viewFormat === 'month_weekend_view') allowedDays = [6, 0];
        
        let y = anchorYMD ? anchorYMD.y : null;
        let m0 = anchorYMD ? anchorYMD.m0 : null;
        if (!anchorYMD) {
            const a = getCalendarYMDInTimeZone(filterStart, timeZone);
            y = a.y;
            m0 = a.m0;
        }
        // Pass `useBlocks` through a private marker on allowedDays (avoid signature churn).
        const allowedDaysWithOpts = Array.isArray(allowedDays) ? allowedDays.slice() : allowedDays;
        if (allowedDaysWithOpts && typeof allowedDaysWithOpts === 'object') {
            allowedDaysWithOpts.__useBlocks = useBlocks;
            allowedDaysWithOpts.__blockResolveOpts = blockResolveOpts;
            allowedDaysWithOpts.__eventOrder = eventOrder;
        }
        blockResolveOpts.useBlocks = useBlocks;
        return buildMonthMarkdown(processedEvents, y, m0, weekStartJs, timeZone, getIcon, allowedDaysWithOpts, opts.i18n);
    }
    if (viewFormat.startsWith('days_from_date_')) {
        const days = parseInt(viewFormat.split('_')[3], 10);
        const w = opts.weekStartYMD;
        const startDow = new Date(Date.UTC(w.y, w.m0, w.d, 12, 0, 0, 0)).getUTCDay();
        blockResolveOpts.useBlocks = useBlocks;
        return buildWeekMarkdown(processedEvents, w, startDow, dateFormat, timeZone, getIcon, days, { useBlocks: useBlocks, showDaySections: showDaySections, blockResolveOpts: blockResolveOpts, eventOrder: eventOrder }, opts.i18n);
    }
    blockResolveOpts.useBlocks = useBlocks;
    return buildDayMarkdown(processedEvents, timeZone, getIcon, { useBlocks: useBlocks, blockResolveOpts: blockResolveOpts, eventOrder: eventOrder }, opts.i18n);
}

module.exports = {
    generateCalendarMarkdown,
    generateCalendarMarkdownFromEvents,
    parseIcsToEvents,
    parseSingleVeventLines,
    parseSingleVtimezoneLines,
    eventHasEffectiveRrule,
    getCalendarYMDInTimeZone,
    compareEventsForDisplay,
    expandRecurringEvents,
    getWeekStartSettingToJs,
    formatUserDate,
    isRecurringEvent,
    getCalendarEventMarkdownBlock,
    getCalendarEventKind,
    resolveCalendarEventMarkdownBlock,
    normalizeCalendarEventOrder,
    CALENDAR_EVENT_ORDER_DEFAULT
};
