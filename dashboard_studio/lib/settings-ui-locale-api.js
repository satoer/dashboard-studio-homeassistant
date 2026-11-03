'use strict';

const fs = require('fs').promises;
const path = require('path');

const SUPPORTED = new Set(['en', 'nl', 'de', 'fr', 'it', 'sv', 'no', 'es', 'da', 'ru', 'pl', 'ko', 'ar']);

function deepMergeSettings(base, over) {
    const a = base && typeof base === 'object' ? base : {};
    const b = over && typeof over === 'object' ? over : {};
    const out = { ...a };
    Object.keys(b).forEach((k) => {
        const bv = b[k];
        const av = out[k];
        if (bv && typeof bv === 'object' && !Array.isArray(bv)) {
            out[k] = deepMergeSettings(av && typeof av === 'object' && !Array.isArray(av) ? av : {}, bv);
        } else {
            out[k] = bv;
        }
    });
    return out;
}

function flattenSettingsLeaves(tree, prefix) {
    const out = {};
    if (!tree || typeof tree !== 'object') return out;
    Object.keys(tree).forEach((k) => {
        const v = tree[k];
        const next = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'string') {
            out[next] = v;
        } else if (v && typeof v === 'object' && !Array.isArray(v)) {
            Object.assign(out, flattenSettingsLeaves(v, next));
        }
    });
    return out;
}

function normalizeLanguageCode(langRaw) {
    const part = String(langRaw || 'en').split(/[-_]/)[0].toLowerCase().replace(/[^a-z]/g, '');
    if (!part) return 'en';
    return SUPPORTED.has(part) ? part : 'en';
}

/**
 * Flat map: "settings.tabs.configuration" -> string (merged user language over English for `settings` subtree).
 * @param {string} appDir Homey app root (directory containing `locales/`).
 * @param {string} langRaw language code from Homey (e.g. nl-NL).
 * @returns {Promise<Record<string, string>>}
 */
async function buildSettingsUiLocaleFlat(appDir, langRaw) {
    const code = normalizeLanguageCode(langRaw);
    const readLocale = async (c) => {
        const p = path.join(appDir, 'locales', `${c}.json`);
        const raw = await fs.readFile(p, 'utf8');
        return JSON.parse(raw);
    };
    const enDoc = await readLocale('en');
    let userDoc = enDoc;
    if (code !== 'en') {
        try {
            userDoc = await readLocale(code);
        } catch (e) {
            userDoc = enDoc;
        }
    }
    const mergedSettings = deepMergeSettings(enDoc.settings || {}, userDoc.settings || {});
    return flattenSettingsLeaves(mergedSettings, 'settings');
}

module.exports = {
    buildSettingsUiLocaleFlat
};
