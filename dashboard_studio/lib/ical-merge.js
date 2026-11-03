'use strict';

const RX_VEVENT = /BEGIN:VEVENT[\s\S]*?END:VEVENT/gi;
const RX_VTIMEZONE = /BEGIN:VTIMEZONE[\s\S]*?END:VTIMEZONE/gi;
const RX_UID_LINE = /^UID:(.+)$/im;
const RX_TZID_LINE = /^TZID:(.+)$/im;
const RX_VCAL_OPEN = /BEGIN:VCALENDAR/i;
const RX_VCAL_CLOSE = /END:VCALENDAR/i;

/**
 * Strict ICS shape check (text payload).
 * @param {string} ics
 * @param {string} label e.g. "iCal data A"
 */
function assertIcsLooksValid(ics, label) {
    if (!ics || typeof ics !== 'string') {
        throw new Error(label + ' is empty.');
    }
    if (ics.indexOf('\0') >= 0) {
        throw new Error(label + ' looks like binary, not a text .ics file.');
    }
    if (!RX_VCAL_OPEN.test(ics) || !RX_VCAL_CLOSE.test(ics)) {
        throw new Error(label + ' is not a valid iCalendar document (missing BEGIN:VCALENDAR / END:VCALENDAR).');
    }
}

/**
 * @param {string} ics
 * @returns {{ vtimezones: string[], vevents: string[] }}
 */
function extractBlocks(ics) {
    const vtimezones = ics.match(RX_VTIMEZONE) || [];
    const vevents = ics.match(RX_VEVENT) || [];
    return { vtimezones: vtimezones.slice(), vevents: vevents.slice() };
}

/**
 * @param {string} block
 */
function uidFromVeventBlock(block) {
    const m = RX_UID_LINE.exec(block);
    return m ? String(m[1]).trim() : '';
}

/**
 * @param {string} block
 */
function tzidFromVtimezoneBlock(block) {
    const m = RX_TZID_LINE.exec(block);
    return m ? String(m[1]).trim() : '';
}

/**
 * Merges two iCal text payloads into a single VCALENDAR.
 * - VEVENTs are deduplicated by UID (first occurrence wins; events without UID are kept as-is).
 * - VTIMEZONEs are deduplicated by TZID.
 *
 * @param {string} icsA
 * @param {string} icsB
 * @param {{ labelA?: string, labelB?: string, prodId?: string }} [opts]
 * @returns {string} combined VCALENDAR
 */
function mergeTwoIcsPayloads(icsA, icsB, opts) {
    const o = opts || {};
    const labelA = o.labelA || 'iCal data A';
    const labelB = o.labelB || 'iCal data B';
    const prodId = o.prodId || '-//Dashboard Studio//Combine iCal//EN';

    assertIcsLooksValid(icsA, labelA);
    assertIcsLooksValid(icsB, labelB);

    const a = extractBlocks(icsA);
    const b = extractBlocks(icsB);

    const tzSeen = Object.create(null);
    const tzOut = [];
    [a.vtimezones, b.vtimezones].forEach(function (list) {
        for (let i = 0; i < list.length; i += 1) {
            const block = list[i];
            const id = tzidFromVtimezoneBlock(block);
            if (id) {
                if (tzSeen[id]) continue;
                tzSeen[id] = true;
            }
            tzOut.push(block);
        }
    });

    const evSeen = Object.create(null);
    const evOut = [];
    [a.vevents, b.vevents].forEach(function (list) {
        for (let i = 0; i < list.length; i += 1) {
            const block = list[i];
            const uid = uidFromVeventBlock(block);
            if (uid) {
                if (evSeen[uid]) continue;
                evSeen[uid] = true;
            }
            evOut.push(block);
        }
    });

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:' + prodId,
        'CALSCALE:GREGORIAN'
    ];
    for (let i = 0; i < tzOut.length; i += 1) lines.push(tzOut[i]);
    for (let i = 0; i < evOut.length; i += 1) lines.push(evOut[i]);
    lines.push('END:VCALENDAR');

    return lines.join('\r\n') + '\r\n';
}

module.exports = {
    mergeTwoIcsPayloads,
    assertIcsLooksValid
};
