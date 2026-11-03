'use strict';

/** Hard cap on binding rows to avoid unbounded settings.json growth. */
const MAX_SOURCE_BLOCK_BINDINGS = 500;

/** Calendar IDs from iCal hash are hex; allow alphanumeric, underscore, hyphen. */
const CALENDAR_ID_RE = /^[a-zA-Z0-9_-]+$/;

/**
 * @typedef {{ calendarId: string, block: number }} SourceBlockBinding
 */

/**
 * @param {string} text
 * @returns {{ ok: boolean, errors: Array<{line:number,message:string}>, warnings: Array<{line:number,message:string}>, bindings: SourceBlockBinding[] }}
 */
function parseSourceBlockBindingsText(text) {
    const errors = [];
    const warnings = [];
    const bindings = [];
    const lines = (text != null) ? String(text).split(/\r\n|\n|\r/) : [];
    const seen = Object.create(null);

    for (let i = 0; i < lines.length; i += 1) {
        const lineNum = i + 1;
        let line = String(lines[i]);
        const hashIdx = line.indexOf('#');
        if (hashIdx >= 0) {
            line = line.substring(0, hashIdx);
        }
        line = line.trim();
        if (line.length === 0) continue;

        const parts = line.split(/\s+/);
        if (parts.length !== 2) {
            errors.push({ line: lineNum, message: 'Expected: calendarId then a block number 1–4 (one space). Lines starting with # are comments.' });
            continue;
        }
        const cid = String(parts[0] || '').trim();
        const blockStr = String(parts[1] || '').trim();
        const block = parseInt(blockStr, 10);
        if (!CALENDAR_ID_RE.test(cid)) {
            errors.push({ line: lineNum, message: 'Calendar ID must contain only letters, numbers, underscore, and hyphen (no spaces).' });
            continue;
        }
        if (!isFinite(block) || block < 1 || block > 4 || String(block) !== blockStr) {
            errors.push({ line: lineNum, message: 'Block must be a single digit from 1 to 4.' });
            continue;
        }
        if (seen[cid]) {
            errors.push({ line: lineNum, message: 'Duplicate calendar ID: ' + cid + ' — each source may appear only once.' });
            continue;
        }
        if (bindings.length >= MAX_SOURCE_BLOCK_BINDINGS) {
            errors.push({
                line: lineNum,
                message: 'Too many rows (max ' + MAX_SOURCE_BLOCK_BINDINGS + '). Remove unused calendar sources.'
            });
            continue;
        }
        seen[cid] = true;
        bindings.push({ calendarId: cid, block: block });
    }

    return { ok: errors.length === 0, errors: errors, warnings: warnings, bindings: bindings };
}

/**
 * @param {SourceBlockBinding[]} bindings
 * @returns {string}
 */
function formatSourceBlockBindingsText(bindings) {
    const arr = Array.isArray(bindings) ? bindings : [];
    const out = [];
    for (let i = 0; i < arr.length; i += 1) {
        const b = arr[i];
        if (!b || !b.calendarId) continue;
        const n = parseInt(b.block, 10);
        if (!isFinite(n) || n < 1 || n > 4) continue;
        out.push(String(b.calendarId).trim() + ' ' + String(n));
    }
    return out.join('\n');
}

/**
 * Existing bindings order is preserved; new IDs are appended sorted by calendarId.
 * @param {SourceBlockBinding[]} existingBindings
 * @param {string[]} newCalendarIds
 * @returns {SourceBlockBinding[]}
 */
function assignLeastUsedBlocks(existingBindings, newCalendarIds) {
    const existing = Array.isArray(existingBindings) ? existingBindings.slice() : [];
    const map = Object.create(null);
    for (let i = 0; i < existing.length; i += 1) {
        const b = existing[i];
        if (b && b.calendarId) map[b.calendarId] = b.block;
    }
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < existing.length; i += 1) {
        const b = existing[i];
        if (!b || !b.calendarId) continue;
        const bn = parseInt(b.block, 10);
        if (isFinite(bn) && bn >= 1 && bn <= 4) counts[bn - 1] += 1;
    }

    const uniq = Object.create(null);
    const raw = Array.isArray(newCalendarIds) ? newCalendarIds : [];
    const toAdd = [];
    for (let j = 0; j < raw.length; j += 1) {
        const id = String(raw[j] || '').trim();
        if (!id || !CALENDAR_ID_RE.test(id)) continue;
        if (map[id]) continue;
        if (uniq[id]) continue;
        uniq[id] = true;
        toAdd.push(id);
    }
    toAdd.sort();

    const out = existing.slice();
    for (let k = 0; k < toAdd.length; k += 1) {
        const id = toAdd[k];
        let bestBlock = 1;
        let bestCount = counts[0];
        let b;
        for (b = 2; b <= 4; b += 1) {
            if (counts[b - 1] < bestCount) {
                bestCount = counts[b - 1];
                bestBlock = b;
            }
        }
        out.push({ calendarId: id, block: bestBlock });
        counts[bestBlock - 1] += 1;
        map[id] = bestBlock;
    }
    if (out.length > MAX_SOURCE_BLOCK_BINDINGS) {
        throw new Error('Too many calendar sources (max ' + MAX_SOURCE_BLOCK_BINDINGS + ' bindings). Remove unused rows in Calendar settings.');
    }
    return out;
}

/**
 * @param {SourceBlockBinding[]} bindings
 * @returns {Object<string, number>}
 */
function sourceBlockBindingsToMap(bindings) {
    const m = Object.create(null);
    const arr = Array.isArray(bindings) ? bindings : [];
    for (let i = 0; i < arr.length; i += 1) {
        const b = arr[i];
        if (!b || !b.calendarId) continue;
        const n = parseInt(b.block, 10);
        if (isFinite(n) && n >= 1 && n <= 4) m[b.calendarId] = n;
    }
    return m;
}

module.exports = {
    MAX_SOURCE_BLOCK_BINDINGS,
    CALENDAR_ID_RE,
    parseSourceBlockBindingsText,
    formatSourceBlockBindingsText,
    assignLeastUsedBlocks,
    sourceBlockBindingsToMap
};
