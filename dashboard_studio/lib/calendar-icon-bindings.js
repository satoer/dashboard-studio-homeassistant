'use strict';

const path = require('path');

/**
 * English default block: single source in locales/en.json (used when i18n has no string yet).
 * @returns {string}
 */
function readEnglishDefaultBlockFromLocaleFile() {
    try {
        return require(path.join(__dirname, '../locales/en.json')).settings.calendar.iconBindings.defaultBlock;
    } catch (e) {
        return 'ph-cake: birthday, bday, cake, anniversary, celebration\nph-trash: trash, garbage, recycle, recycling, bin, dump, waste, disposal, rubbish';
    }
}

const DEFAULT_CALENDAR_ICON_BINDINGS_TEXT = readEnglishDefaultBlockFromLocaleFile();

/** Reserved Phosphor slug for markdown; Text widget must render as invisible width-reserving token. */
const MARKDOWN_PH_SPACER_SLUG = 'ph-spacer';

const PH_ICON_LINE = /^\s*(ph-[a-z0-9-]+)\s*:\s*(.+?)\s*$/i;

/**
 * @param {string} text
 * @returns {{ ok: boolean, errors: Array<{line:number,message:string}>, warnings: Array<{line:number,message:string}>, bindings: Array<{icon:string,keywords:string}> }}
 */
function parseIconBindingsText(text) {
    const errors = [];
    const warnings = [];
    const bindings = [];
    const lines = (text != null) ? String(text).split(/\r\n|\n|\r/) : [];
    const seenIcon = new Object(null);

    for (let i = 0; i < lines.length; i += 1) {
        const lineNum = i + 1;
        const line = String(lines[i]).trim();
        if (line.length === 0) continue;
        if (line.indexOf('#') === 0) continue;

        const m = line.match(PH_ICON_LINE);
        if (!m) {
            if (line.indexOf(':') < 0) {
                errors.push({ line: lineNum, message: 'Expected a line like ph-cake: keyword1, keyword2 (add ":" after the ph- icon name).' });
            } else {
                errors.push({ line: lineNum, message: 'Icon name must be like ph-cake, ph-trash, ph-first-aid (ph- and lowercase letters, numbers, hyphens).' });
            }
            continue;
        }
        const phIcon = m[1].toLowerCase();
        const keywordPart = m[2].replace(/\s*#.*$/, '').trim();
        if (!keywordPart) {
            errors.push({ line: lineNum, message: 'No keywords after the colon.' });
            continue;
        }
        if (seenIcon[phIcon]) {
            warnings.push({ line: lineNum, message: 'Duplicate ' + phIcon + ': first definition is kept; remove this line if not needed.' });
            continue;
        }
        seenIcon[phIcon] = true;
        bindings.push({ icon: phIcon, keywords: keywordPart });
    }
    return { ok: errors.length === 0, errors: errors, warnings: warnings, bindings: bindings };
}

/**
 * @param {Array<{icon:string,keywords?:string|Array}>} arr
 */
function legacyIconBindingsToText(arr) {
    if (!Array.isArray(arr) || !arr.length) return '';
    const out = [];
    for (let i = 0; i < arr.length; i += 1) {
        const b = arr[i];
        if (!b) continue;
        const raw = (b.icon != null) ? String(b.icon).trim() : '';
        const kws = b.keywords;
        const kw = Array.isArray(kws) ? kws.join(', ') : (kws != null ? String(kws).trim() : '');
        if (!raw || !kw) continue;
        const ph = raw.indexOf('ph-') === 0 ? raw.toLowerCase() : 'ph-' + raw.toLowerCase();
        out.push(ph + ': ' + kw);
    }
    return out.join('\n');
}

/**
 * @param {string} phOrSlug
 * @returns {string} e.g. :ph-cake: from "ph-cake" or "cake"
 */
function iconToMarkdownToken(phOrSlug) {
    const t = (phOrSlug != null) ? String(phOrSlug).trim().toLowerCase() : 'ph-calendar';
    const core = t.indexOf('ph-') === 0 ? t.substring(3) : t;
    return ':ph-' + core + ':';
}

module.exports = {
    DEFAULT_CALENDAR_ICON_BINDINGS_TEXT,
    MARKDOWN_PH_SPACER_SLUG,
    parseIconBindingsText,
    legacyIconBindingsToText,
    iconToMarkdownToken
};
