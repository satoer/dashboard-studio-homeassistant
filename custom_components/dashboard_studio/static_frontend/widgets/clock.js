/**
 * Clock widget: analog, flip, and date/time text modes.
 * Instance typography is stored under `overrides.typography` (roles: groupLabel, analogNumbers,
 * flipNumbers, flipLabels, flipAmPm, timeDate); runtime merges nested roles onto `clock*` flat keys via
 * `applyTypographyNestedToConfig`. Pre-1.7.0 flat `label*` / `num*` overrides are upgraded in migrator.js only.
 */

/** Fills `position:relative` mode shell on iOS 12 / Safari 12 (`inset` is unsupported there). */
const DS_CLOCK_LAYER_STRETCH = 'position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;box-sizing:border-box;';

class DsFlipDigitPiece {
    constructor(labelText) {
        const el = document.createElement('span');
        el.className = 'ds-flip-piece';
        el.innerHTML =
            '<span class="ds-flip-card"><span class="ds-flip-card-top"></span><span class="ds-flip-card-bottom"></span><span class="ds-flip-card-back"><span class="ds-flip-card-bottom"></span></span></span>' +
            `<span class="ds-flip-slot">${labelText}</span>`;
        this.el = el;
        this.top = el.querySelector('.ds-flip-card-top');
        this.bottom = el.querySelector('.ds-flip-card > .ds-flip-card-bottom');
        this.back = el.querySelector('.ds-flip-card-back');
        this.backBottom = el.querySelector('.ds-flip-card-back .ds-flip-card-bottom');
        this.currentValue = null;
        this._syncFrontBottom = null;
        this.top.textContent = '00';
        this.bottom.setAttribute('data-value', '00');
        this.back.setAttribute('data-value', '00');
        this.backBottom.setAttribute('data-value', '00');
    }

    update(valStr) {
        const val = String(valStr).length >= 2 ? String(valStr).slice(-2) : ('0' + String(valStr)).slice(-2);
        if (val === this.currentValue) return;
        const animate = this.currentValue !== null;
        if (this._syncFrontBottom) {
            clearTimeout(this._syncFrontBottom);
            this._syncFrontBottom = null;
        }
        if (animate && this.currentValue !== '') {
            this.back.setAttribute('data-value', this.currentValue);
            this.bottom.setAttribute('data-value', this.currentValue);
        }
        this.currentValue = val;
        this.top.textContent = this.currentValue;
        this.backBottom.setAttribute('data-value', this.currentValue);
        if (!animate) {
            this.bottom.setAttribute('data-value', this.currentValue);
            this.back.setAttribute('data-value', this.currentValue);
        }
        if (animate) {
            this.el.classList.remove('ds-flip');
            void this.el.offsetWidth;
            this.el.classList.add('ds-flip');
            this._syncFrontBottom = setTimeout(() => {
                this.bottom.setAttribute('data-value', this.currentValue);
                this.back.setAttribute('data-value', this.currentValue);
                this._syncFrontBottom = null;
            }, 600);
        }
    }

    dispose() {
        if (this._syncFrontBottom) {
            clearTimeout(this._syncFrontBottom);
            this._syncFrontBottom = null;
        }
    }
}

class ClockWidget extends BaseWidget {
    static get metadata() {
        return { shortName: 'Clock', label: 'Clock', icon: 'ph-clock', category: 'Time', color_dark: 'hsl(330, 80%, 65%)', color_light: 'hsl(330, 85%, 35%)', version: '2.3.1', date: '2026-11-02' };
    }

    static DISPLAY_MODE_OPTIONS() {
        return [
            { value: 'analog', text: 'Analog Clock' },
            { value: 'flip', text: 'Flip Clock' },
            { value: 'text', text: 'Date Time Text' }
        ];
    }

    static TEXT_SEGMENT_OPTIONS() {
        return [
            { value: 'none', text: 'None' },
            { value: 'day', text: 'Day of Month' },
            { value: 'day2Digit', text: '2-Digit Day' },
            { value: 'monthNum', text: 'Number of Month' },
            { value: 'monthNum2Digit', text: '2-Digit Month' },
            { value: 'monthName', text: 'Name of Month' },
            { value: 'weekday', text: 'Name of Day' },
            { value: 'week', text: 'Week Number' },
            { value: 'weekLabeled', text: 'Week Week Number' },
            { value: 'yearLong', text: 'Year Long' },
            { value: 'yearShort', text: 'Year Short' }
        ];
    }

    /**
     * Best-effort localized string from Intl.DisplayNames. Some engines omit `unit` or `dateTimeField`;
     * each combination is try/catch isolated so one failure does not block others.
     */
    static _intlDisplayName(locale, type, code, style) {
        const loc = locale || 'en-GB';
        const st = style || 'long';
        try {
            if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') return '';
            const dn = new Intl.DisplayNames(loc, { type, style: st });
            const s = dn.of(code);
            return typeof s === 'string' && s.trim() ? s.trim() : '';
        } catch (e) {
            return '';
        }
    }

    /** Standalone "week" word for ISO week number prefix (Date Time Text segment). */
    static weekPrefixForLocale(locale) {
        const loc = locale || 'en-GB';
        let s = ClockWidget._intlDisplayName(loc, 'dateTimeField', 'weekOfYear', 'long');
        if (!s) s = ClockWidget._intlDisplayName(loc, 'dateTimeField', 'weekOfYear', 'short');
        if (!s) s = ClockWidget._intlDisplayName(loc, 'unit', 'week', 'long');
        if (!s) s = ClockWidget._intlDisplayName(loc, 'unit', 'week', 'short');
        if (!s) return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    /** Localized column caption for flip clock (hour / minute / second). */
    static flipUnitCaption(locale, unit) {
        const loc = locale || 'en-GB';
        const u = unit === 'minute' ? 'minute' : unit === 'second' ? 'second' : 'hour';
        let s = ClockWidget._intlDisplayName(loc, 'dateTimeField', u, 'long');
        if (!s) s = ClockWidget._intlDisplayName(loc, 'dateTimeField', u, 'short');
        if (!s) s = ClockWidget._intlDisplayName(loc, 'unit', u, 'long');
        if (!s) s = ClockWidget._intlDisplayName(loc, 'unit', u, 'short');
        if (s) return s.charAt(0).toUpperCase() + s.slice(1);
        if (u === 'hour') return 'Hours';
        if (u === 'minute') return 'Minutes';
        return 'Seconds';
    }

    static LOCALE_OPTIONS() {
        const base = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'nl-NL', 'es-ES', 'it-IT', 'pt-PT', 'sv-SE', 'da-DK', 'no-NO', 'fi-FI', 'pl-PL', 'cs-CZ', 'sk-SK', 'hu-HU', 'ro-RO', 'bg-BG', 'el-GR', 'tr-TR', 'ru-RU', 'uk-UA', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'ar-SA', 'he-IL', 'hi-IN', 'id-ID', 'th-TH', 'vi-VN'];
        try {
            if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
                const locs = Intl.supportedValuesOf('locale');
                if (Array.isArray(locs) && locs.length > 0) return locs.slice().sort();
            }
        } catch (e) { /* ignore */ }
        return base;
    }

    static timezoneOptions() {
        try {
            if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
                return Intl.supportedValuesOf('timeZone').slice().sort();
            }
        } catch (e) { /* ignore */ }
        return ['UTC', 'Europe/London', 'Europe/Amsterdam', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo'];
    }

    /**
     * Cached formatters per IANA zone: one formatToParts per tick, no extra loops.
     * fractionalSecondDigits (when supported) gives smooth analog seconds in non-system-time mode.
     */
    static _zonedWallDtfEntry(tzRaw) {
        const tz = tzRaw || 'UTC';
        let map = ClockWidget.__zonedWallDtfMap;
        if (!map) {
            map = new Map();
            ClockWidget.__zonedWallDtfMap = map;
        }
        let entry = map.get(tz);
        if (entry) return entry;
        const base = {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        try {
            entry = {
                dtf: new Intl.DateTimeFormat('en-CA', { ...base, fractionalSecondDigits: 3 }),
                hasFrac: true
            };
        } catch (e) {
            entry = { dtf: new Intl.DateTimeFormat('en-CA', base), hasFrac: false };
        }
        map.set(tz, entry);
        return entry;
    }

    static zonedWallParts(epochMs, timeZone) {
        const entry = ClockWidget._zonedWallDtfEntry(timeZone);
        const parts = entry.dtf.formatToParts(new Date(epochMs));
        const o = {};
        parts.forEach((p) => {
            if (p.type !== 'literal') o[p.type] = p.value;
        });
        let ms = 0;
        if (entry.hasFrac && o.fractionalSecond != null && o.fractionalSecond !== '') {
            const f = parseInt(o.fractionalSecond, 10);
            if (Number.isFinite(f)) ms = f;
        }
        return {
            year: parseInt(o.year, 10),
            month: parseInt(o.month, 10),
            day: parseInt(o.day, 10),
            hour: parseInt(o.hour, 10),
            minute: parseInt(o.minute, 10),
            second: parseInt(o.second, 10),
            ms
        };
    }

    static isoWeekNumber(year, month, day) {
        const t = new Date(Date.UTC(year, month - 1, day));
        const dow = t.getUTCDay() || 7;
        t.setUTCDate(t.getUTCDate() + 4 - dow);
        const y1 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
        return Math.ceil((((t - y1) / 86400000) + 1) / 7);
    }

    /** Editor + schema visibility: instance uses displayMode; master uses defaultClockDisplayMode. */
    static editorClockType(values, isGlobal) {
        const raw = isGlobal
            ? (values && values.defaultClockDisplayMode)
            : (values && values.displayMode);
        if (raw === 'flip' || raw === 'text' || raw === 'analog') return raw;
        return 'analog';
    }

    static MODE_GROUP_DEPS() {
        return ['displayMode', 'defaultClockDisplayMode'];
    }

    static TIME_SOURCE_DEPS() {
        return ['useSystemTime', 'defaultClockUseSystemTime'];
    }

    /**
     * Flatten overrides.typography roles onto runtime keys used by applyTypographyToElement.
     */
    static applyTypographyNestedToConfig(c) {
        BaseWidget.applyTypographyNestedToConfig(c, [
            ['groupLabel', 'clockGroupLabel'],
            ['analogNumbers', 'clockAnalogNum'],
            ['flipNumbers', 'clockFlipNum'],
            ['flipLabels', 'clockFlipLabel'],
            ['flipAmPm', 'clockFlipAmPm'],
            ['timeDate', 'clockTimeDate']
        ], {});
    }

    static get CLOCK_TYPO_ROLE_PREFIX_TUPLES() {
        return [
            ['groupLabel', 'clockGroupLabel'],
            ['analogNumbers', 'clockAnalogNum'],
            ['flipNumbers', 'clockFlipNum'],
            ['flipLabels', 'clockFlipLabel'],
            ['flipAmPm', 'clockFlipAmPm'],
            ['timeDate', 'clockTimeDate']
        ];
    }

    static getNestedBindingOverlaySpec() {
        return BaseWidget.buildTypographyBindingOverlaySpec(ClockWidget.CLOCK_TYPO_ROLE_PREFIX_TUPLES);
    }

    /**
     * Ensure flat typography keys used by the editor (widget.config) and applyTypographyToElement
     * always have concrete values. Sources: nested typography (already flattened), instance `clock*`
     * keys, clock global defaults, then shared master defaults (same idea as menu.js).
     */
    static fillClockTypographyResolved(c) {
        const pick = (a, b) => (a !== undefined && a !== null && a !== '' ? a : b);
        const M = typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS ? MASTER_SETTINGS : {};
        const baseFont = pick(c.fontFamily, pick(M.fontFamily, "'Inter', sans-serif"));

        // Canonical-first dial defaults:
        // - Prefer defaultClockAnalogNum* (current master keys)
        // - Accept legacy defaultClockNum* only as fallback for older saves
        // This avoids stale legacy master keys silently overriding canonical defaults.
        const defaultAnalogCol = pick(
            c.defaultClockAnalogNumCol,
            c.defaultClockNumColor,
            c.clockColNumbers,
            c.defaultColLabel,
            M.defaultColLabel,
            '@textMuted'
        );
        const defaultAnalogFont = pick(c.defaultClockAnalogNumFont, c.defaultClockNumFont, baseFont);
        const defaultAnalogFs = pick(c.defaultClockAnalogNumFs, c.defaultClockNumSize, 20);
        const defaultAnalogBold = pick(c.defaultClockAnalogNumBold, c.defaultClockNumFontBold, true);
        const defaultAnalogItalic = pick(c.defaultClockAnalogNumItalic, false);
        const defaultAnalogCase = pick(c.defaultClockAnalogNumCase, 'none');

        if (c.clockAnalogNumCol == null || c.clockAnalogNumCol === '') c.clockAnalogNumCol = defaultAnalogCol;
        if (c.clockAnalogNumFont == null || c.clockAnalogNumFont === '') c.clockAnalogNumFont = defaultAnalogFont;
        if (c.clockAnalogNumFs == null || c.clockAnalogNumFs === '') c.clockAnalogNumFs = defaultAnalogFs;
        if (c.clockAnalogNumBold == null) c.clockAnalogNumBold = !!defaultAnalogBold;
        if (c.clockAnalogNumItalic == null) c.clockAnalogNumItalic = !!defaultAnalogItalic;
        if (c.clockAnalogNumCase == null) c.clockAnalogNumCase = defaultAnalogCase;

        const analogRefFont = (c.clockAnalogNumFont != null && c.clockAnalogNumFont !== '') ? c.clockAnalogNumFont : baseFont;

        const flipNumFs = pick(c.defaultClockFlipNumFs, pick(c.defaultFsLabel, pick(M.defaultFsLabel, 28)));
        const flipLabFs = pick(c.defaultClockFlipLabelFs, 10);
        const tdFs = pick(c.defaultClockTimeDateFs, pick(c.defaultFsLabel, pick(M.defaultFsLabel, 16)));
        const themeLabelCol = pick(c.defaultColLabel, M.defaultColLabel, '@textMuted');

        const flipNumCol = pick(c.defaultClockFlipNumCol, '@onAccent');
        const flipNumFont = pick(c.defaultClockFlipNumFont, analogRefFont);
        const flipNumBold = pick(c.defaultClockFlipNumBold, true);
        const flipNumItalic = pick(c.defaultClockFlipNumItalic, false);

        if (c.clockFlipNumCol == null || c.clockFlipNumCol === '') c.clockFlipNumCol = flipNumCol;
        if (c.clockFlipNumFont == null || c.clockFlipNumFont === '') c.clockFlipNumFont = flipNumFont;
        if (c.clockFlipNumFs == null) c.clockFlipNumFs = flipNumFs;
        if (c.clockFlipNumBold == null) c.clockFlipNumBold = !!flipNumBold;
        if (c.clockFlipNumItalic == null) c.clockFlipNumItalic = !!flipNumItalic;
        if (c.clockFlipNumCase == null) c.clockFlipNumCase = 'none';

        const flipLabelCol = pick(c.defaultClockFlipLabelCol, themeLabelCol);
        const flipLabelFont = pick(c.defaultClockFlipLabelFont, analogRefFont);
        const flipLabelBold = pick(c.defaultClockFlipLabelBold, false);
        const flipLabelItalic = pick(c.defaultClockFlipLabelItalic, false);
        const flipLabelCase = pick(c.defaultClockFlipLabelCase, 'none');

        if (c.clockFlipLabelCol == null || c.clockFlipLabelCol === '') c.clockFlipLabelCol = flipLabelCol;
        if (c.clockFlipLabelFont == null || c.clockFlipLabelFont === '') c.clockFlipLabelFont = flipLabelFont;
        if (c.clockFlipLabelFs == null) c.clockFlipLabelFs = flipLabFs;
        if (c.clockFlipLabelBold == null) c.clockFlipLabelBold = !!flipLabelBold;
        if (c.clockFlipLabelItalic == null) c.clockFlipLabelItalic = !!flipLabelItalic;
        if (c.clockFlipLabelCase == null) c.clockFlipLabelCase = flipLabelCase;

        const tdCol = pick(c.defaultClockTimeDateCol, themeLabelCol);
        const tdFont = pick(c.defaultClockTimeDateFont, analogRefFont);
        const tdBold = pick(c.defaultClockTimeDateBold, false);
        const tdItalic = pick(c.defaultClockTimeDateItalic, false);
        const tdCase = pick(c.defaultClockTimeDateCase, 'none');
        const tdAlign = pick(c.defaultClockTimeDateAlign, 'center');

        if (c.clockTimeDateCol == null || c.clockTimeDateCol === '') c.clockTimeDateCol = tdCol;
        if (c.clockTimeDateFont == null || c.clockTimeDateFont === '') c.clockTimeDateFont = tdFont;
        if (c.clockTimeDateFs == null) c.clockTimeDateFs = tdFs;
        if (c.clockTimeDateBold == null) c.clockTimeDateBold = !!tdBold;
        if (c.clockTimeDateItalic == null) c.clockTimeDateItalic = !!tdItalic;
        if (c.clockTimeDateCase == null) c.clockTimeDateCase = tdCase;
        if (c.clockTimeDateAlign == null) c.clockTimeDateAlign = tdAlign;

        BaseWidget.fillWidgetLabelTypographyResolved(c, M, 'clockGroupLabel');
        if (c.clockGroupLabelBold == null) {
            c.clockGroupLabelBold = !!__nullish(c.defaultLabelBold, __nullish(M.defaultLabelBold, false));
        }
        if (c.clockGroupLabelItalic == null) c.clockGroupLabelItalic = false;

        const flipLabOffX = pick(c.defaultClockFlipLabelOffX, 0);
        const flipLabOffY = pick(c.defaultClockFlipLabelOffY, 0);
        if (c.clockFlipLabelOffX == null) c.clockFlipLabelOffX = flipLabOffX;
        if (c.clockFlipLabelOffY == null) c.clockFlipLabelOffY = flipLabOffY;

        const ampmFs = Math.max(8, Math.round(flipLabFs * 1.15));
        const ampmCol = pick(c.defaultClockFlipAmPmCol, '@onAccent');
        const ampmFont = pick(c.defaultClockFlipAmPmFont, analogRefFont);
        const ampmBold = pick(c.defaultClockFlipAmPmBold, true);
        const ampmItalic = pick(c.defaultClockFlipAmPmItalic, false);
        const ampmCase = pick(c.defaultClockFlipAmPmCase, 'none');
        const ampmAlign = pick(c.defaultClockFlipAmPmAlign, 'center');
        const ampmOffX = pick(c.defaultClockFlipAmPmOffX, 0);
        const ampmOffY = pick(c.defaultClockFlipAmPmOffY, 0);

        if (c.clockFlipAmPmCol == null || c.clockFlipAmPmCol === '') c.clockFlipAmPmCol = ampmCol;
        if (c.clockFlipAmPmFont == null || c.clockFlipAmPmFont === '') c.clockFlipAmPmFont = ampmFont;
        if (c.clockFlipAmPmFs == null) c.clockFlipAmPmFs = pick(c.defaultClockFlipAmPmFs, ampmFs);
        if (c.clockFlipAmPmBold == null) c.clockFlipAmPmBold = !!ampmBold;
        if (c.clockFlipAmPmItalic == null) c.clockFlipAmPmItalic = !!ampmItalic;
        if (c.clockFlipAmPmCase == null) c.clockFlipAmPmCase = ampmCase;
        if (c.clockFlipAmPmAlign == null) c.clockFlipAmPmAlign = ampmAlign;
        if (c.clockFlipAmPmOffX == null) c.clockFlipAmPmOffX = ampmOffX;
        if (c.clockFlipAmPmOffY == null) c.clockFlipAmPmOffY = ampmOffY;
    }

    static get globalSettings() {
        return {
            clockColTicks: '@controlOff',
            clockColNumbers: '@textMuted',
            clockColHour: '@text',
            clockColMin: '@onSurface',
            clockColSec: '@glow',

            defaultClockShowTicks: true,
            defaultClockShowNumbers: true,
            defaultClockSweep: 'smooth',

            defaultClockCapSize: 12,
            defaultClockBackCapSize: 18,
            defaultClockOffset: 0,
            defaultClockNumDist: 70,
            defaultClockNumSize: 20,
            defaultClockNumColor: '@textMuted',
            defaultClockNumFont: "'Inter', sans-serif",
            defaultClockNumFontBold: true,

            clockHandWidthHour: 8,
            clockHandLengthHour: 55,
            clockHandWidthMin: 5,
            clockHandLengthMin: 85,
            clockHandWidthSec: 2,
            clockHandLengthSec: 90,

            defaultClockUseSystemTime: true,
            defaultClockTimezone: 'UTC',
            defaultClockDisplayMode: 'analog',
            defaultClockUse12Hour: false,

            defaultClockFlipUpperColor: '@accentSoft',
            defaultClockFlipLowerColor: '@accent',
            defaultClockFlipCardRadius: 12,
            defaultClockFlipSeparator: 6,
            defaultClockFlipShowLabels: true,
            defaultClockFlipShowSeconds: true,

            defaultClockTextShowDate: true,
            defaultClockTextDateSeg0: 'weekday',
            defaultClockTextDateSeg1: 'day',
            defaultClockTextDateSeg2: 'monthName',
            defaultClockTextDateSeg3: 'yearLong',
            defaultClockTextDateSeg4: 'none',
            defaultClockTextDateSeparator: '',
            defaultClockTextDateLinebreak: true,
            defaultClockTextShowTime: true,
            defaultClockTextShowHour: true,
            defaultClockTextShowMinute: true,
            defaultClockTextShowSecond: true,
            defaultClockTextSeparator: ':',
            defaultClockTextBlinkSeparator: false,
            defaultClockTextLocale: 'en-GB',

            defaultClockAnalogNumFs: 20,
            defaultClockAnalogNumFont: "'Inter', sans-serif",
            defaultClockAnalogNumCol: '@textMuted',
            defaultClockAnalogNumCase: 'none',
            defaultClockAnalogNumBold: true,
            defaultClockAnalogNumItalic: false,

            defaultClockFlipNumFs: 28,
            defaultClockFlipNumFont: '',
            defaultClockFlipNumCol: '@onAccent',
            defaultClockFlipNumBold: true,
            defaultClockFlipNumItalic: false,

            defaultClockFlipLabelFs: 10,
            defaultClockFlipLabelFont: '',
            defaultClockFlipLabelCol: '@textMuted',
            defaultClockFlipLabelCase: 'none',
            defaultClockFlipLabelBold: false,
            defaultClockFlipLabelItalic: false,
            defaultClockFlipLabelOffX: 0,
            defaultClockFlipLabelOffY: 0,

            defaultClockFlipAmPmFs: 12,
            defaultClockFlipAmPmFont: '',
            defaultClockFlipAmPmCol: '@onAccent',
            defaultClockFlipAmPmAlign: 'center',
            defaultClockFlipAmPmCase: 'none',
            defaultClockFlipAmPmBold: true,
            defaultClockFlipAmPmItalic: false,
            defaultClockFlipAmPmOffX: 0,
            defaultClockFlipAmPmOffY: 0,

            defaultClockTimeDateFs: 16,
            defaultClockTimeDateFont: '',
            defaultClockTimeDateCol: '@textMuted',
            defaultClockTimeDateAlign: 'center',
            defaultClockTimeDateCase: 'none',
            defaultClockTimeDateBold: false,
            defaultClockTimeDateItalic: false,

            defaultClockFlipLocale: 'en-GB',

            defaultClockTextWeekPrefix: '',
            defaultClockFlipLabelHour: '',
            defaultClockFlipLabelMinute: '',
            defaultClockFlipLabelSecond: ''
        };
    }

    static get basicSettingKeys() {
        return ['timezone', 'useSystemTime', 'timeOffset', 'clockUse12Hour'];
    }

    static get globalSchema() {
        const tzOpts = ClockWidget.timezoneOptions().map((z) => ({ value: z, text: z }));
        const locOpts = ClockWidget.LOCALE_OPTIONS().map((l) => ({ value: l, text: l }));
        const depType = ['defaultClockDisplayMode'];
        const depSys = ['defaultClockUseSystemTime', 'defaultClockDisplayMode'];
        const gAnalog = (v) => v.defaultClockDisplayMode === 'analog';
        const gFlip = (v) => v.defaultClockDisplayMode === 'flip';
        const gText = (v) => v.defaultClockDisplayMode === 'text';
        const gTz = (v) => v.defaultClockUseSystemTime === false;
        const g12 = (v) => gFlip(v) || gText(v);
        const gShowDate = (v) => gText(v) && v.defaultClockTextShowDate !== false;
        const depDateGlobal = ['defaultClockDisplayMode', 'defaultClockTextShowDate'];
        return [
            { type: 'heading', label: 'Type & Time', cols: 12 },
            { key: 'defaultClockDisplayMode', type: 'select', label: 'Type', options: ClockWidget.DISPLAY_MODE_OPTIONS(), cols: 6 },
            {
                key: 'defaultClockUse12Hour',
                type: 'checkbox',
                label: '12-hour clock (AM/PM)',
                cols: 6,
                dependsOn: depType,
                visibleWhen: (v) => g12(v)
            },
            {
                key: '_clockGlobalTypeRowSpacer',
                type: 'spacer',
                cols: 6,
                dependsOn: depType,
                visibleWhen: (v) => gAnalog(v)
            },
            { key: 'defaultClockUseSystemTime', type: 'checkbox', label: 'Use system time', cols: 6 },
            { key: 'defaultClockOffset', type: 'number', label: 'Manual time offset (minutes)', cols: 6 },
            {
                key: 'defaultClockTimezone',
                type: 'select',
                label: 'Timezone (when not system time)',
                options: tzOpts,
                cols: 12,
                dependsOn: depSys,
                visibleWhen: (v) => gTz(v)
            },

            { type: 'heading', label: 'Analog Face', cols: 12, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'defaultClockShowTicks', type: 'checkbox', label: 'Show Ticks', cols: 6, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'defaultClockShowNumbers', type: 'checkbox', label: 'Show Numbers', cols: 6, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'defaultClockSweep', type: 'select', label: 'Sweep Mode', options: ['tick', 'smooth'], cols: 12, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'clockColTicks', type: 'color', label: 'Tick Color', cols: 4, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'clockColNumbers', type: 'color', label: 'Number Color', cols: 4, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'defaultClockNumColor', type: 'color', label: 'Default Number Color', cols: 4, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'clockColHour', type: 'color', label: 'Hour Hand Color', cols: 4, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'clockColMin', type: 'color', label: 'Minute Hand Color', cols: 4, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'clockColSec', type: 'color', label: 'Second Hand Color', cols: 4, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'defaultClockNumDist', type: 'number', label: 'Number Distance %', cols: 4, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'defaultClockNumSize', type: 'number', label: 'Number Size', cols: 4, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'defaultClockCapSize', type: 'number', label: 'Cap Size', cols: 4, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'defaultClockNumFont', type: 'select', label: 'Number Font Family', options: window.AVAILABLE_FONTS, cols: 8, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'defaultClockNumFontBold', type: 'checkbox', label: 'Number Font Bold', cols: 4, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'defaultClockBackCapSize', type: 'number', label: 'Back Cap Size', cols: 12, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'clockHandWidthHour', type: 'number', label: 'Hour Hand Width', cols: 4, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'clockHandLengthHour', type: 'number', label: 'Hour Length %', cols: 8, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'clockHandWidthMin', type: 'number', label: 'Minute Width', cols: 4, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'clockHandLengthMin', type: 'number', label: 'Minute Length %', cols: 8, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'clockHandWidthSec', type: 'number', label: 'Second Width', cols: 4, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },
            { key: 'clockHandLengthSec', type: 'number', label: 'Second Length %', cols: 8, dependsOn: depType, visibleWhen: (v) => gAnalog(v) },

            { type: 'heading', label: 'Flip Clock Defaults', cols: 12, dependsOn: depType, visibleWhen: (v) => gFlip(v) },
            { key: 'defaultClockFlipUpperColor', type: 'color', label: 'Upper Card Color', cols: 6, dependsOn: depType, visibleWhen: (v) => gFlip(v) },
            { key: 'defaultClockFlipLowerColor', type: 'color', label: 'Lower Card Color', cols: 6, dependsOn: depType, visibleWhen: (v) => gFlip(v) },
            { key: 'defaultClockFlipShowLabels', type: 'checkbox', label: 'Show Labels', cols: 6, dependsOn: depType, visibleWhen: (v) => gFlip(v) },
            { key: 'defaultClockFlipShowSeconds', type: 'checkbox', label: 'Show Seconds', cols: 6, dependsOn: depType, visibleWhen: (v) => gFlip(v) },
            { key: 'defaultClockFlipSeparator', type: 'number', label: 'Flip Separator (px)', cols: 6, dependsOn: depType, visibleWhen: (v) => gFlip(v) },
            { key: 'defaultClockFlipCardRadius', type: 'number', label: 'Card Roundness (px)', cols: 6, dependsOn: depType, visibleWhen: (v) => gFlip(v) },
            { key: 'defaultClockFlipLocale', type: 'select', label: 'Language / Locale', options: locOpts, cols: 12, dependsOn: depType, visibleWhen: (v) => gFlip(v) },
            {
                key: 'defaultClockFlipLabelHour',
                type: 'text',
                label: 'Custom Hour Label (Optional)',
                cols: 4,
                dependsOn: depType,
                visibleWhen: (v) => gFlip(v)
            },
            {
                key: 'defaultClockFlipLabelMinute',
                type: 'text',
                label: 'Custom Minute Label (Optional)',
                cols: 4,
                dependsOn: depType,
                visibleWhen: (v) => gFlip(v)
            },
            {
                key: 'defaultClockFlipLabelSecond',
                type: 'text',
                label: 'Custom Second Label (Optional)',
                cols: 4,
                dependsOn: depType,
                visibleWhen: (v) => gFlip(v)
            },

            { type: 'heading', label: 'Date Time Text Appearance', cols: 12, dependsOn: depType, visibleWhen: (v) => gText(v) },
            { key: 'defaultClockTextShowTime', type: 'checkbox', label: 'Show Time', cols: 4, dependsOn: depType, visibleWhen: (v) => gText(v) },
            { key: 'defaultClockTextSeparator', type: 'text', label: 'Time Separator Character', cols: 4, dependsOn: depType, visibleWhen: (v) => gText(v) },
            { key: 'defaultClockTextBlinkSeparator', type: 'checkbox', label: 'Blink Separator', cols: 4, dependsOn: depType, visibleWhen: (v) => gText(v) },
            { key: 'defaultClockTextShowHour', type: 'checkbox', label: 'Show Hour', cols: 4, dependsOn: depType, visibleWhen: (v) => gText(v) },
            { key: 'defaultClockTextShowMinute', type: 'checkbox', label: 'Show Minute', cols: 4, dependsOn: depType, visibleWhen: (v) => gText(v) },
            { key: 'defaultClockTextShowSecond', type: 'checkbox', label: 'Show Second', cols: 4, dependsOn: depType, visibleWhen: (v) => gText(v) },
            { key: 'defaultClockTextShowDate', type: 'checkbox', label: 'Show Date', cols: 6, dependsOn: depType, visibleWhen: (v) => gText(v) },
            { key: 'defaultClockTextDateSeparator', type: 'text', label: 'Date Separator Character', cols: 6, dependsOn: depDateGlobal, visibleWhen: (v) => gShowDate(v) },
            { key: 'defaultClockTextDateSeg0', type: 'select', label: 'Date Part 1', options: ClockWidget.TEXT_SEGMENT_OPTIONS(), cols: 6, dependsOn: depDateGlobal, visibleWhen: (v) => gShowDate(v) },
            { key: 'defaultClockTextDateSeg1', type: 'select', label: 'Date Part 2', options: ClockWidget.TEXT_SEGMENT_OPTIONS(), cols: 6, dependsOn: depDateGlobal, visibleWhen: (v) => gShowDate(v) },
            { key: 'defaultClockTextDateSeg2', type: 'select', label: 'Date Part 3', options: ClockWidget.TEXT_SEGMENT_OPTIONS(), cols: 6, dependsOn: depDateGlobal, visibleWhen: (v) => gShowDate(v) },
            { key: 'defaultClockTextDateSeg3', type: 'select', label: 'Date Part 4', options: ClockWidget.TEXT_SEGMENT_OPTIONS(), cols: 6, dependsOn: depDateGlobal, visibleWhen: (v) => gShowDate(v) },
            { key: 'defaultClockTextDateSeg4', type: 'select', label: 'Date Part 5', options: ClockWidget.TEXT_SEGMENT_OPTIONS(), cols: 6, dependsOn: depDateGlobal, visibleWhen: (v) => gShowDate(v) },
            { key: 'defaultClockTextDateLinebreak', type: 'checkbox', label: 'Line Break After Date', cols: 6, dependsOn: depDateGlobal, visibleWhen: (v) => gShowDate(v) },
            { key: 'defaultClockTextLocale', type: 'select', label: 'Language / Locale', options: locOpts, cols: 12, dependsOn: depType, visibleWhen: (v) => gText(v) },
            {
                key: 'defaultClockTextWeekPrefix',
                type: 'text',
                label: 'Custom Week Label (Optional)',
                cols: 12,
                dependsOn: depDateGlobal,
                visibleWhen: (v) => gShowDate(v)
            },

            { type: 'heading', label: 'Typography', cols: 12 },
            Object.assign(
                BaseWidget.getTypographySchema('defaultClockAnalogNum', 'Analog numbers', {
                    exclude: ['align', 'opacity'],
                    fontDefaultKey: 'defaultClockNumFont',
                    fontSizeDefaultKey: 'defaultFsLabel',
                    colorDefaultKey: 'defaultClockNumColor',
                    boldDefaultKey: 'defaultClockNumFontBold',
                    italicDefaultKey: 'defaultLabelItalic',
                    caseDefaultKey: 'defaultLabelCase',
                    offXDefaultKey: null,
                    offYDefaultKey: null
                }),
                { dependsOn: depType, visibleWhen: (v) => gAnalog(v) }
            ),
            Object.assign(
                BaseWidget.getTypographySchema('defaultClockFlipNum', 'Flip numbers', {
                    exclude: ['align', 'offset', 'opacity', 'case'],
                    fontDefaultKey: 'fontFamily',
                    fontSizeDefaultKey: 'defaultFsLabel',
                    colorDefaultKey: 'defaultColLabel',
                    boldDefaultKey: 'defaultLabelBold',
                    italicDefaultKey: 'defaultLabelItalic',
                    offXDefaultKey: null,
                    offYDefaultKey: null
                }),
                { dependsOn: depType, visibleWhen: (v) => gFlip(v) }
            ),
            Object.assign(
                BaseWidget.getTypographySchema('defaultClockFlipLabel', 'Flip labels', {
                    exclude: ['align', 'opacity'],
                    fontDefaultKey: 'fontFamily',
                    fontSizeDefaultKey: 'defaultFsLabel',
                    colorDefaultKey: 'defaultColLabel',
                    boldDefaultKey: 'defaultLabelBold',
                    italicDefaultKey: 'defaultLabelItalic',
                    caseDefaultKey: 'defaultLabelCase',
                    offXDefaultKey: null,
                    offYDefaultKey: null
                }),
                { dependsOn: depType, visibleWhen: (v) => gFlip(v) }
            ),
            Object.assign(
                BaseWidget.getTypographySchema('defaultClockFlipAmPm', 'AM / PM', {
                    exclude: ['opacity'],
                    fontDefaultKey: 'fontFamily',
                    fontSizeDefaultKey: 'defaultFsLabel',
                    colorDefaultKey: 'defaultColLabel',
                    alignDefaultKey: 'defaultTextAlign',
                    boldDefaultKey: 'defaultLabelBold',
                    italicDefaultKey: 'defaultLabelItalic',
                    caseDefaultKey: 'defaultLabelCase',
                    offXDefaultKey: null,
                    offYDefaultKey: null
                }),
                { dependsOn: depType, visibleWhen: (v) => gFlip(v) }
            ),
            Object.assign(
                BaseWidget.getTypographySchema('defaultClockTimeDate', 'Time & Date', {
                    exclude: ['offset', 'opacity'],
                    fontDefaultKey: 'fontFamily',
                    fontSizeDefaultKey: 'defaultFsLabel',
                    colorDefaultKey: 'defaultColLabel',
                    alignDefaultKey: 'defaultTextAlign',
                    boldDefaultKey: 'defaultLabelBold',
                    italicDefaultKey: 'defaultLabelItalic',
                    caseDefaultKey: 'defaultLabelCase'
                }),
                { dependsOn: depType, visibleWhen: (v) => gText(v) }
            )
        ];
    }

    constructor(cid, id, ov, bn) {
        super(cid, id, ov, bn);
        this._syncClockTicker();
    }

    onRemove() {
        Dashboard.unregisterTicker(this.id);
        this._stopSecondTimer();
        if (this._clockFaceRaf && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._clockFaceRaf);
        }
        this._clockFaceRaf = 0;
        if (this._flipPieces) {
            for (var fp = 0; fp < this._flipPieces.length; fp++) {
                if (this._flipPieces[fp] && typeof this._flipPieces[fp].dispose === 'function') {
                    this._flipPieces[fp].dispose();
                }
            }
        }
    }

    pauseForBackground() {
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.unregisterTicker === 'function') {
            Dashboard.unregisterTicker(this.id);
        }
        this._stopSecondTimer();
        this._setSecondHandPaused(true);
    }

    resumeFromBackground() {
        const wrap = this.elements && this.elements.wrapper;
        if (!wrap || wrap.style.display === 'none') return;
        if (typeof Dashboard !== 'undefined' && Dashboard._pageHidden) return;
        this._smoothForce = true;
        this._syncClockTicker();
        this.onTick();
        this._scheduleClockFaceMeasure();
    }

    _stopSecondTimer() {
        if (this._secondTimerHandle) {
            if (this._secondTimerNative) {
                clearInterval(this._secondTimerHandle);
            } else if (typeof WorkerTimer !== 'undefined' && typeof WorkerTimer.clearInterval === 'function') {
                WorkerTimer.clearInterval(this._secondTimerHandle);
            } else {
                clearInterval(this._secondTimerHandle);
            }
        }
        this._secondTimerHandle = null;
        this._secondTimerNative = false;
        this._secondTimerMs = 0;
    }

    _clockTickMs(c) {
        const mode = (c && c.displayMode) || 'analog';
        if (mode === 'text' && c.textBlinkSeparator) return 500;
        return 1000;
    }

    _setSecondHandPaused(paused) {
        const el = this.e && this.e.sc;
        if (!el || !el.style) return;
        if (!el.style.animationName || el.style.animationName === 'none') return;
        el.style.animationPlayState = paused ? 'paused' : 'running';
    }

    _clearSmoothSecondHand() {
        const el = this.e && this.e.sc;
        if (!el || !el.style) return;
        if (el.style.animationName && el.style.animationName !== 'none') {
            el.style.animationName = 'none';
            el.style.animationDuration = '';
            el.style.animationDelay = '';
            el.style.animationTimingFunction = '';
            el.style.animationIterationCount = '';
            el.style.animationPlayState = '';
        }
        this._smoothSyncedAt = null;
    }

    /**
     * One 60s rotation, aligned to the wall-clock second. Restart only when the
     * hand has drifted, so a one-second tick does not rebuild the animation.
     */
    _syncSmoothSecondHand(st, force) {
        const el = this.e && this.e.sc;
        if (!el || !el.style) return;
        const sec = st.s + (st.ms / 1000);
        let drift = 999;
        if (!force && this._smoothSyncedAt != null) {
            const elapsed = (Date.now() - this._smoothSyncedAt) / 1000;
            let predicted = (this._smoothSyncSec + elapsed) % 60;
            if (predicted < 0) predicted += 60;
            drift = Math.abs(predicted - sec);
            if (drift > 30) drift = 60 - drift;
        }
        const running = el.style.animationName === 'ds-clock-sec-sweep';
        if (drift < 0.25 && running) {
            if (el.style.animationPlayState !== 'running') el.style.animationPlayState = 'running';
            return;
        }
        el.style.transition = 'none';
        el.style.animationName = 'ds-clock-sec-sweep';
        el.style.animationDuration = '60s';
        el.style.animationTimingFunction = 'linear';
        el.style.animationIterationCount = 'infinite';
        el.style.animationDelay = (-sec) + 's';
        el.style.animationPlayState = 'running';
        el.style.transform = '';
        this._smoothSyncedAt = Date.now();
        this._smoothSyncSec = sec;
    }

    _writeHandTransform(el, angleDeg) {
        if (!el || !el.style) return;
        const next = 'rotate(' + angleDeg + 'deg)';
        if (el.style.transform !== next) el.style.transform = next;
    }

    /**
     * Keep a hand moving forward by the short step to the next wall-clock angle.
     * The on-screen position matches the clock. At midnight the second hand steps
     * 6 degrees instead of unwinding through the day's full rotation while the
     * spring transition is still on.
     */
    _advanceHandDegrees(slot, absoluteDeg) {
        if (!isFinite(absoluteDeg)) return 0;
        const norm = ((absoluteDeg % 360) + 360) % 360;
        if (!this._handUnwind) this._handUnwind = {};
        const prev = this._handUnwind[slot];
        if (prev == null || !isFinite(prev)) {
            this._handUnwind[slot] = norm;
            return norm;
        }
        const prevNorm = ((prev % 360) + 360) % 360;
        let delta = norm - prevNorm;
        if (delta < 0) delta += 360;
        if (delta >= 360) delta = 0;
        const next = prev + delta;
        this._handUnwind[slot] = next;
        return next;
    }

    /**
     * Face radius, flip type, and date text are sized from the laid-out box.
     * Render can run before that box exists, so one frame later we measure again.
     * A matching size does nothing. Hidden widgets are not measured.
     */
    _scheduleClockFaceMeasure() {
        if (this._clockFaceRaf) return;
        const self = this;
        const run = function () {
            self._clockFaceRaf = 0;
            self._syncClockFaceToBox();
        };
        if (typeof requestAnimationFrame === 'function') {
            this._clockFaceRaf = requestAnimationFrame(run);
        } else {
            run();
        }
    }

    _noteClockFaceBox(innerW, innerH) {
        this._clockFaceW = Math.round(innerW);
        this._clockFaceH = Math.round(innerH);
    }

    _applyClockTextScale(c, minDim) {
        if (!this._textDateEl || !this._textTimeEl) return;
        const dim = minDim > 0 ? minDim : 80;
        const baseFs = c.clockTimeDateFs != null ? c.clockTimeDateFs : 16;
        const scale = Math.min(Math.max(dim / 120, 0.65), 2.5);
        const next = Math.max(10, Math.round(baseFs * scale)) + 'px';
        if (this._textDateEl.style.fontSize !== next) this._textDateEl.style.fontSize = next;
        if (this._textTimeEl.style.fontSize !== next) this._textTimeEl.style.fontSize = next;
    }

    _syncClockFaceToBox() {
        const wrap = this.elements && this.elements.wrapper;
        if (!wrap || wrap.style.display === 'none') return;
        if (typeof Dashboard !== 'undefined' && Dashboard._pageHidden) return;
        if (!this.modeWrap) return;
        const mwW = this.modeWrap.clientWidth;
        const mwH = this.modeWrap.clientHeight;
        if (!(mwW > 0) || !(mwH > 0)) return;
        const rw = Math.round(mwW);
        const rh = Math.round(mwH);
        if (rw === this._clockFaceW && rh === this._clockFaceH) return;
        this._clockFaceW = rw;
        this._clockFaceH = rh;
        const c = this.config;
        const mode = c.displayMode || 'analog';
        if (mode === 'analog' && this.e && this.e.n) {
            this._applyAnalogChrome(c, mwW, mwH, !!c.deactivated);
            return;
        }
        if (mode === 'flip') {
            this._scaleFlipToContainer();
            return;
        }
        if (mode === 'text') this._applyClockTextScale(c, Math.min(mwW, mwH));
    }

    _syncClockTicker() {
        if (typeof Dashboard !== 'undefined' && Dashboard._pageHidden) {
            this.pauseForBackground();
            return;
        }
        const wrap = this.elements && this.elements.wrapper;
        if (!wrap || wrap.style.display === 'none') {
            this.pauseForBackground();
            return;
        }
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.unregisterTicker === 'function') {
            Dashboard.unregisterTicker(this.id);
        }
        const c = this.config;
        const ms = this._clockTickMs(c);
        if (this._secondTimerMs === ms && this._secondTimerHandle) return;
        this._stopSecondTimer();
        this._secondTimerMs = ms;
        const self = this;
        const tick = function () { self.onTick(); };
        if (typeof WorkerTimer !== 'undefined' && typeof WorkerTimer.setInterval === 'function') {
            this._secondTimerHandle = WorkerTimer.setInterval(tick, ms);
            this._secondTimerNative = false;
        } else {
            this._secondTimerHandle = setInterval(tick, ms);
            this._secondTimerNative = true;
        }
    }

    static get AUDIO_TRIGGERS() {
        return [
            { key: 'everySecond', label: 'Every Second' },
            { key: 'everyMinute', label: 'Every Minute' },
            { key: 'everyHour', label: 'Every Hour' },
            { key: 'everyDay', label: 'Every Day' }
        ];
    }

    getDefaultOverrides() {
        return {
            timeOffset: 0,
            label: '',
            displayMode: 'analog',
            useSystemTime: true,
            timezone: 'UTC',
            clockUse12Hour: false,
            flipCardRadius: 12,
            flipSeparator: 6,
            flipShowLabels: true,
            flipShowSeconds: true,
            flipLocale: 'en-GB',
            flipLabelHour: '',
            flipLabelMinute: '',
            flipLabelSecond: '',
            textShowDate: true,
            textDateSeg0: 'weekday',
            textDateSeg1: 'day',
            textDateSeg2: 'monthName',
            textDateSeg3: 'yearLong',
            textDateSeg4: 'none',
            textDateSeparator: '',
            textDateLinebreak: true,
            textShowTime: true,
            textShowHour: true,
            textShowMinute: true,
            textShowSecond: true,
            textTimeSeparator: ':',
            textBlinkSeparator: false,
            textLocale: 'en-GB',
            textWeekPrefix: '',
            audio: (typeof DashboardAudio !== 'undefined' && DashboardAudio.defaultAudio)
                ? DashboardAudio.defaultAudio(ClockWidget.AUDIO_TRIGGERS)
                : { everySecond: '', everyMinute: '', everyHour: '', everyDay: '' }
        };
    }

    getWallClockState(resolvedConfig) {
        const c = resolvedConfig || this.config;
        const offsetMin = c.timeOffset !== undefined ? c.timeOffset : (c.defaultClockOffset || 0);
        const epochMs = Date.now() + offsetMin * 60000;
        const useSys = c.useSystemTime !== undefined ? c.useSystemTime : c.defaultClockUseSystemTime;
        if (useSys !== false) {
            const d = new Date(epochMs);
            return {
                epochMs,
                h24: d.getHours(),
                m: d.getMinutes(),
                s: d.getSeconds(),
                ms: d.getMilliseconds(),
                year: d.getFullYear(),
                month: d.getMonth() + 1,
                day: d.getDate(),
                dow: d.getDay()
            };
        }
        const tz = c.timezone || c.defaultClockTimezone || 'UTC';
        const p = ClockWidget.zonedWallParts(epochMs, tz);
        return {
            epochMs,
            h24: p.hour,
            m: p.minute,
            s: p.second,
            ms: p.ms,
            year: p.year,
            month: p.month,
            day: p.day,
            dow: new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()
        };
    }

    get config() {
        const c = super.config;
        const merged = {
            ...c,
            colTicks: c.colTicks || c.tickColor || c.clockColTicks,
            colHour: c.colHour || c.hourColor || c.clockColHour,
            colMin: c.colMin || c.minuteColor || c.clockColMin,
            colSec: c.colSec || c.secondColor || c.clockColSec,

            showTicks: BaseWidget.configFlag(__nullish(c.showTicks, c.defaultClockShowTicks), true),
            showNumbers: BaseWidget.configFlag(__nullish(c.showNumbers, c.defaultClockShowNumbers), true),
            showSecondHand: BaseWidget.configFlag(__nullish(c.showSecondHand, c.defaultClockShowSecondHand), true),
            sweepMode: c.sweepMode || c.defaultClockSweep,

            capSize: c.capSize || c.defaultClockCapSize,
            backCapSize: c.backCapSize || c.defaultClockBackCapSize,
            timeOffset: c.timeOffset !== undefined ? c.timeOffset : (c.defaultClockOffset || 0),

            numDist: c.numDist !== undefined && c.numDist !== null ? c.numDist
                : (c.numberDistance !== undefined && c.numberDistance !== null ? c.numberDistance
                    : (c.defaultClockNumDist !== undefined ? c.defaultClockNumDist : 70)),

            wHour: c.wHour || c.clockHandWidthHour,
            lHour: c.lHour || c.clockHandLengthHour,
            wMin: c.wMin || c.clockHandWidthMin,
            lMin: c.lMin || c.clockHandLengthMin,
            wSec: c.wSec || c.clockHandWidthSec,
            lSec: c.lSec || c.clockHandLengthSec,

            label: c.label != null ? String(c.label) : '',

            displayMode: c.displayMode || c.defaultClockDisplayMode || 'analog',
            useSystemTime: c.useSystemTime !== undefined ? c.useSystemTime : (__nullish(c.defaultClockUseSystemTime, true)),
            timezone: c.timezone || c.defaultClockTimezone || 'UTC',
            clockUse12Hour: c.clockUse12Hour !== undefined ? c.clockUse12Hour : (__nullish(c.defaultClockUse12Hour, false)),

            flipUpperColor: c.flipUpperColor || c.defaultClockFlipUpperColor,
            flipLowerColor: c.flipLowerColor || c.defaultClockFlipLowerColor,
            flipCardRadius: c.flipCardRadius !== undefined ? c.flipCardRadius : (__nullish(c.defaultClockFlipCardRadius, 12)),
            flipSeparator: (() => {
                const raw = c.flipSeparator !== undefined && c.flipSeparator !== null ? c.flipSeparator : c.defaultClockFlipSeparator;
                const n = Number(raw);
                return Number.isFinite(n) ? Math.max(0, Math.min(n, 200)) : 6;
            })(),
            flipShowLabels: c.flipShowLabels !== undefined ? c.flipShowLabels : (__nullish(c.defaultClockFlipShowLabels, true)),
            flipShowSeconds: c.flipShowSeconds !== undefined ? c.flipShowSeconds : (__nullish(c.defaultClockFlipShowSeconds, true)),
            flipLocale: c.flipLocale || c.defaultClockFlipLocale || 'en-GB',
            flipLabelHour: c.flipLabelHour != null ? c.flipLabelHour : (c.defaultClockFlipLabelHour != null ? c.defaultClockFlipLabelHour : ''),
            flipLabelMinute: c.flipLabelMinute != null ? c.flipLabelMinute : (c.defaultClockFlipLabelMinute != null ? c.defaultClockFlipLabelMinute : ''),
            flipLabelSecond: c.flipLabelSecond != null ? c.flipLabelSecond : (c.defaultClockFlipLabelSecond != null ? c.defaultClockFlipLabelSecond : ''),

            textShowDate: c.textShowDate !== undefined ? c.textShowDate : (__nullish(c.defaultClockTextShowDate, true)),
            textDateSeg0: c.textDateSeg0 || c.defaultClockTextDateSeg0 || 'weekday',
            textDateSeg1: c.textDateSeg1 || c.defaultClockTextDateSeg1 || 'day',
            textDateSeg2: c.textDateSeg2 || c.defaultClockTextDateSeg2 || 'monthName',
            textDateSeg3: c.textDateSeg3 || c.defaultClockTextDateSeg3 || 'yearLong',
            textDateSeg4: c.textDateSeg4 || c.defaultClockTextDateSeg4 || 'none',
            textDateSeparator: c.textDateSeparator != null ? c.textDateSeparator : (c.defaultClockTextDateSeparator != null ? c.defaultClockTextDateSeparator : ''),
            textDateLinebreak: c.textDateLinebreak !== undefined ? c.textDateLinebreak : (__nullish(c.defaultClockTextDateLinebreak, true)),
            textShowTime: c.textShowTime !== undefined ? c.textShowTime : (__nullish(c.defaultClockTextShowTime, true)),
            textShowHour: c.textShowHour !== undefined ? c.textShowHour : (__nullish(c.defaultClockTextShowHour, true)),
            textShowMinute: c.textShowMinute !== undefined ? c.textShowMinute : (__nullish(c.defaultClockTextShowMinute, true)),
            textShowSecond: c.textShowSecond !== undefined ? c.textShowSecond : (__nullish(c.defaultClockTextShowSecond, true)),
            textTimeSeparator: c.textTimeSeparator != null && c.textTimeSeparator !== '' ? c.textTimeSeparator : (c.defaultClockTextSeparator || ':'),
            textBlinkSeparator: c.textBlinkSeparator !== undefined ? c.textBlinkSeparator : (__nullish(c.defaultClockTextBlinkSeparator, false)),
            textLocale: c.textLocale || c.defaultClockTextLocale || 'en-GB',
            textWeekPrefix: c.textWeekPrefix != null ? c.textWeekPrefix : (c.defaultClockTextWeekPrefix != null ? c.defaultClockTextWeekPrefix : '')
        };

        ClockWidget.applyTypographyNestedToConfig(merged);
        ClockWidget.fillClockTypographyResolved(merged);
        BaseWidget.applyTypographyBindingOverlay(this, merged, ClockWidget.CLOCK_TYPO_ROLE_PREFIX_TUPLES);

        return merged;
    }

    getSchema() {
        const depMode = ClockWidget.MODE_GROUP_DEPS();
        const depTz = ClockWidget.TIME_SOURCE_DEPS();
        const tzOpts = ClockWidget.timezoneOptions().map((z) => ({ value: z, text: z }));
        const locOpts = ClockWidget.LOCALE_OPTIONS().map((l) => ({ value: l, text: l }));
        const typeAnalog = (v, isG) => ClockWidget.editorClockType(v, isG) === 'analog';
        const typeFlip = (v, isG) => ClockWidget.editorClockType(v, isG) === 'flip';
        const typeText = (v, isG) => ClockWidget.editorClockType(v, isG) === 'text';
        const visTz = (v, isG) => (isG ? v.defaultClockUseSystemTime === false : v.useSystemTime === false);
        const vis12h = (v, isG) => typeFlip(v, isG) || typeText(v, isG);
        const visFlipAmPm = (v, isG) => typeFlip(v, isG) && (isG ? !!v.defaultClockUse12Hour : !!v.clockUse12Hour);
        const depFlipAmPm = ['displayMode', 'defaultClockDisplayMode', 'clockUse12Hour', 'defaultClockUse12Hour'];
        const depDateParts = ['displayMode', 'defaultClockDisplayMode', 'textShowDate', 'defaultClockTextShowDate'];
        const visTextDateDetail = (v, isG) => typeText(v, isG) && (isG ? v.defaultClockTextShowDate !== false : v.textShowDate !== false);

        const clockTimeDateTypo = BaseWidget.getTypographySchema('clockTimeDate', 'Time & Date', {
            exclude: ['offset', 'opacity'],
            nestedTypography: { root: 'typography', role: 'timeDate' },
            fontSizeDefaultKey: 'defaultClockTimeDateFs',
            fontDefaultKey: 'defaultClockTimeDateFont',
            fontDefaultKeyFallback: 'fontFamily',
            colorDefaultKey: 'defaultClockTimeDateCol',
            alignDefaultKey: 'defaultClockTimeDateAlign',
            boldDefaultKey: 'defaultClockTimeDateBold',
            italicDefaultKey: 'defaultClockTimeDateItalic',
            caseDefaultKey: 'defaultClockTimeDateCase'
        });
        clockTimeDateTypo.visibleWhen = typeText;
        clockTimeDateTypo.dependsOn = depMode;

        const clockAnalogNumTypo = Object.assign(
            BaseWidget.getTypographySchema('clockAnalogNum', 'Analog numbers', {
                exclude: ['align', 'offset', 'opacity'],
                nestedTypography: { root: 'typography', role: 'analogNumbers' },
                fontSizeDefaultKey: 'defaultClockAnalogNumFs',
                fontDefaultKey: 'defaultClockAnalogNumFont',
                fontDefaultKeyFallback: 'fontFamily',
                colorDefaultKey: 'defaultClockAnalogNumCol',
                boldDefaultKey: 'defaultClockAnalogNumBold',
                caseDefaultKey: 'defaultClockAnalogNumCase',
                italicDefaultKey: 'defaultClockAnalogNumItalic'
            }),
            { visibleWhen: typeAnalog, dependsOn: depMode }
        );

        const clockFlipNumTypo = Object.assign(
            BaseWidget.getTypographySchema('clockFlipNum', 'Flip numbers', {
                exclude: ['align', 'offset', 'opacity', 'case'],
                nestedTypography: { root: 'typography', role: 'flipNumbers' },
                fontSizeDefaultKey: 'defaultClockFlipNumFs',
                fontDefaultKey: 'defaultClockFlipNumFont',
                fontDefaultKeyFallback: 'fontFamily',
                colorDefaultKey: 'defaultClockFlipNumCol',
                boldDefaultKey: 'defaultClockFlipNumBold',
                italicDefaultKey: 'defaultClockFlipNumItalic'
            }),
            { visibleWhen: typeFlip, dependsOn: depMode }
        );

        const clockFlipLabelTypo = Object.assign(
            BaseWidget.getTypographySchema('clockFlipLabel', 'Flip labels', {
                exclude: ['align', 'opacity'],
                nestedTypography: { root: 'typography', role: 'flipLabels' },
                fontSizeDefaultKey: 'defaultClockFlipLabelFs',
                fontDefaultKey: 'defaultClockFlipLabelFont',
                fontDefaultKeyFallback: 'fontFamily',
                colorDefaultKey: 'defaultClockFlipLabelCol',
                boldDefaultKey: 'defaultClockFlipLabelBold',
                italicDefaultKey: 'defaultClockFlipLabelItalic',
                caseDefaultKey: 'defaultClockFlipLabelCase',
                offXDefaultKey: 'defaultClockFlipLabelOffX',
                offYDefaultKey: 'defaultClockFlipLabelOffY'
            }),
            { visibleWhen: typeFlip, dependsOn: depMode }
        );

        const clockFlipAmPmTypo = Object.assign(
            BaseWidget.getTypographySchema('clockFlipAmPm', 'AM / PM', {
                exclude: ['opacity'],
                nestedTypography: { root: 'typography', role: 'flipAmPm' },
                fontSizeDefaultKey: 'defaultClockFlipAmPmFs',
                fontDefaultKey: 'defaultClockFlipAmPmFont',
                fontDefaultKeyFallback: 'fontFamily',
                colorDefaultKey: 'defaultClockFlipAmPmCol',
                alignDefaultKey: 'defaultClockFlipAmPmAlign',
                boldDefaultKey: 'defaultClockFlipAmPmBold',
                italicDefaultKey: 'defaultClockFlipAmPmItalic',
                caseDefaultKey: 'defaultClockFlipAmPmCase',
                offXDefaultKey: 'defaultClockFlipAmPmOffX',
                offYDefaultKey: 'defaultClockFlipAmPmOffY'
            }),
            { visibleWhen: visFlipAmPm, dependsOn: depFlipAmPm }
        );

        return [
            {
                id: 'c_time',
                title: 'Type & Time',
                icon: 'ph-globe-hemisphere-west',
                fields: [
                    {
                        key: 'displayMode',
                        type: 'select',
                        label: 'Type',
                        options: ClockWidget.DISPLAY_MODE_OPTIONS(),
                        cols: 6,
                        defaultKey: 'defaultClockDisplayMode'
                    },
                    {
                        key: 'clockUse12Hour',
                        type: 'checkbox',
                        label: '12-hour clock (AM/PM)',
                        cols: 6,
                        defaultKey: 'defaultClockUse12Hour',
                        dependsOn: depMode,
                        visibleWhen: vis12h
                    },
                    {
                        key: '_clockInstanceTypeRowSpacer',
                        type: 'spacer',
                        cols: 6,
                        dependsOn: depMode,
                        visibleWhen: typeAnalog
                    },
                    {
                        key: 'useSystemTime',
                        type: 'checkbox',
                        label: 'Use system time',
                        cols: 6,
                        defaultKey: 'defaultClockUseSystemTime'
                    },
                    {
                        key: 'timeOffset',
                        type: 'number',
                        label: 'Manual time offset (minutes)',
                        cols: 6,
                        defaultKey: 'defaultClockOffset'
                    },
                    {
                        key: 'timezone',
                        type: 'select',
                        label: 'Timezone',
                        options: tzOpts,
                        cols: 12,
                        defaultKey: 'defaultClockTimezone',
                        dependsOn: depTz,
                        visibleWhen: visTz
                    }
                ]
            },
            (typeof DashboardAudio !== 'undefined' && DashboardAudio.schemaGroup)
                ? DashboardAudio.schemaGroup('c_audio', ClockWidget.AUDIO_TRIGGERS)
                : {
                    id: 'c_audio', title: 'Audio', icon: 'ph-music-notes',
                    fields: [{ key: 'audio', type: 'audio_trigger_map', cols: 12, triggers: ClockWidget.AUDIO_TRIGGERS }]
                },
            {
                id: 'c_face',
                title: 'Analog Face',
                icon: 'ph-clock',
                dependsOn: depMode,
                visibleWhen: typeAnalog,
                fields: [
                    { key: 'showTicks', type: 'checkbox', label: 'Show Ticks', cols: 4, defaultKey: 'defaultClockShowTicks' },
                    { key: 'showNumbers', type: 'checkbox', label: 'Show Numbers', cols: 4, defaultKey: 'defaultClockShowNumbers' },
                    { key: 'tickColor', type: 'color', label: 'Tick Color', cols: 4, defaultKey: 'clockColTicks' },
                    { key: 'numberDistance', type: 'number', label: 'Number Distance %', cols: 4, defaultKey: 'defaultClockNumDist' },
                    { key: 'capSize', type: 'number', label: 'Cap Size', cols: 4, defaultKey: 'defaultClockCapSize' },
                    { key: 'backCapSize', type: 'number', label: 'Back Cap Size', cols: 4, defaultKey: 'defaultClockBackCapSize' }
                ]
            },
            {
                id: 'c_hands',
                title: 'Hands & Sweep',
                icon: 'ph-line-segments',
                dependsOn: depMode,
                visibleWhen: typeAnalog,
                fields: [
                    { key: 'sweepMode', type: 'select', label: 'Sweep Mode', options: ['tick', 'smooth'], cols: 12, defaultKey: 'defaultClockSweep' },
                    { key: 'hourColor', type: 'color', label: 'Hour Color', cols: 4, defaultKey: 'clockColHour' },
                    { key: 'wHour', type: 'number', label: 'Hour Width', cols: 4, defaultKey: 'clockHandWidthHour' },
                    { key: 'lHour', type: 'number', label: 'Hour Length', cols: 4, defaultKey: 'clockHandLengthHour' },
                    { key: 'minuteColor', type: 'color', label: 'Minute Color', cols: 4, defaultKey: 'clockColMin' },
                    { key: 'wMin', type: 'number', label: 'Minute Width', cols: 4, defaultKey: 'clockHandWidthMin' },
                    { key: 'lMin', type: 'number', label: 'Minute Length', cols: 4, defaultKey: 'clockHandLengthMin' },
                    { key: 'secondColor', type: 'color', label: 'Second Color', cols: 4, defaultKey: 'clockColSec' },
                    { key: 'wSec', type: 'number', label: 'Second Width', cols: 4, defaultKey: 'clockHandWidthSec' },
                    { key: 'lSec', type: 'number', label: 'Second Length', cols: 4, defaultKey: 'clockHandLengthSec' }
                ]
            },
            {
                id: 'c_flip',
                title: 'Flip Clock Appearance',
                icon: 'ph-square-split-vertical',
                dependsOn: depMode,
                visibleWhen: typeFlip,
                fields: [
                    { key: 'flipUpperColor', type: 'color', label: 'Upper Card Color', cols: 6, defaultKey: 'defaultClockFlipUpperColor' },
                    { key: 'flipLowerColor', type: 'color', label: 'Lower Card Color', cols: 6, defaultKey: 'defaultClockFlipLowerColor' },
                    { key: 'flipShowLabels', type: 'checkbox', label: 'Show Labels', cols: 3, defaultKey: 'defaultClockFlipShowLabels' },
                    { key: 'flipShowSeconds', type: 'checkbox', label: 'Show Seconds', cols: 3, defaultKey: 'defaultClockFlipShowSeconds' },
                    { key: 'flipSeparator', type: 'number', label: 'Flip Separator (px)', cols: 3, defaultKey: 'defaultClockFlipSeparator' },
                    { key: 'flipCardRadius', type: 'number', label: 'Card Roundness (px)', cols: 3, defaultKey: 'defaultClockFlipCardRadius' },
                    { key: 'flipLocale', type: 'select', label: 'Language / Locale', options: locOpts, cols: 12, defaultKey: 'defaultClockFlipLocale', dependsOn: depMode },
                    { key: 'flipLabelHour', type: 'text', label: 'Custom Hour Label (Optional)', cols: 4, defaultKey: 'defaultClockFlipLabelHour' },
                    { key: 'flipLabelMinute', type: 'text', label: 'Custom Minute Label (Optional)', cols: 4, defaultKey: 'defaultClockFlipLabelMinute' },
                    { key: 'flipLabelSecond', type: 'text', label: 'Custom Second Label (Optional)', cols: 4, defaultKey: 'defaultClockFlipLabelSecond' }
                ]
            },
            {
                id: 'c_datetime_text_appearance',
                title: 'Date Time Text Appearance',
                icon: 'ph-text-aa',
                dependsOn: depMode,
                visibleWhen: typeText,
                fields: [
                    { key: 'textShowTime', type: 'checkbox', label: 'Show Time', cols: 4, defaultKey: 'defaultClockTextShowTime' },
                    { key: 'textTimeSeparator', type: 'text', label: 'Time Separator Character', cols: 4, defaultKey: 'defaultClockTextSeparator' },
                    { key: 'textBlinkSeparator', type: 'checkbox', label: 'Blink Separator', cols: 4, defaultKey: 'defaultClockTextBlinkSeparator' },
                    { key: 'textShowHour', type: 'checkbox', label: 'Show Hour', cols: 4, defaultKey: 'defaultClockTextShowHour' },
                    { key: 'textShowMinute', type: 'checkbox', label: 'Show Minute', cols: 4, defaultKey: 'defaultClockTextShowMinute' },
                    { key: 'textShowSecond', type: 'checkbox', label: 'Show Second', cols: 4, defaultKey: 'defaultClockTextShowSecond' },
                    { key: 'textShowDate', type: 'checkbox', label: 'Show Date', cols: 4, defaultKey: 'defaultClockTextShowDate' },
                    { key: 'textDateSeparator', type: 'text', label: 'Date Separator Character', cols: 4, defaultKey: 'defaultClockTextDateSeparator', dependsOn: depDateParts, visibleWhen: visTextDateDetail },
                    { key: 'textDateLinebreak', type: 'checkbox', label: 'Line Break After Date', cols: 4, defaultKey: 'defaultClockTextDateLinebreak', dependsOn: depDateParts, visibleWhen: visTextDateDetail },
                    { key: 'textDateSeg0', type: 'select', label: 'Date Part 1', options: ClockWidget.TEXT_SEGMENT_OPTIONS(), cols: 3, defaultKey: 'defaultClockTextDateSeg0', dependsOn: depDateParts, visibleWhen: visTextDateDetail },
                    { key: 'textDateSeg1', type: 'select', label: 'Date Part 2', options: ClockWidget.TEXT_SEGMENT_OPTIONS(), cols: 3, defaultKey: 'defaultClockTextDateSeg1', dependsOn: depDateParts, visibleWhen: visTextDateDetail },
                    { key: 'textDateSeg2', type: 'select', label: 'Date Part 3', options: ClockWidget.TEXT_SEGMENT_OPTIONS(), cols: 3, defaultKey: 'defaultClockTextDateSeg2', dependsOn: depDateParts, visibleWhen: visTextDateDetail },
                    { key: 'textDateSeg3', type: 'select', label: 'Date Part 4', options: ClockWidget.TEXT_SEGMENT_OPTIONS(), cols: 3, defaultKey: 'defaultClockTextDateSeg3', dependsOn: depDateParts, visibleWhen: visTextDateDetail },
                    { key: 'textDateSeg4', type: 'select', label: 'Date Part 5', options: ClockWidget.TEXT_SEGMENT_OPTIONS(), cols: 6, defaultKey: 'defaultClockTextDateSeg4', dependsOn: depDateParts, visibleWhen: visTextDateDetail },
                    {
                        key: 'textWeekPrefix',
                        type: 'text',
                        label: 'Custom Week Label (Optional)',
                        cols: 6,
                        defaultKey: 'defaultClockTextWeekPrefix',
                        dependsOn: depDateParts,
                        visibleWhen: visTextDateDetail
                    },
                    { key: 'textLocale', type: 'select', label: 'Language / Locale', options: locOpts, cols: 12, defaultKey: 'defaultClockTextLocale' }
                ]
            },
            {
                id: 'clk_appear',
                title: 'Appearance',
                icon: 'ph-palette',
                fields: [
                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }
                ]
            },
            {
                id: 'clock_text_typography',
                title: 'Text & Typography',
                icon: 'ph-text-t',
                fields: [
                    { key: 'label', type: 'text', label: 'Widget Label', cols: 12 },
                    BaseWidget.getWidgetLabelTypographySchema('clockGroupLabel', 'groupLabel', { exclude: ['opacity'] }),
                    clockAnalogNumTypo,
                    clockFlipNumTypo,
                    clockFlipLabelTypo,
                    clockFlipAmPmTypo,
                    clockTimeDateTypo
                ]
            }
        ];
    }

    /** Full clock subtree into widget innerContent (constructor or self-heal). */
    _mountClockContent(ic) {
        if (!ic) return;
        ic.innerHTML = '';
        this.lblEl = null;
        this.modeWrap = null;
        this.analogWrap = null;
        this.flipRoot = null;
        this.flipInner = null;
        this.textRoot = null;
        this._textInnerEl = null;
        this._textDateEl = null;
        this._textTimeEl = null;
        this.e = null;
        this._tickEls = null;
        this._numInners = null;
        this._flipPieces = null;
        this._flipCols = null;
        this._flipAmpmEl = null;
        this._handUnwind = null;
        this._secHandLive = false;

        ic.style.display = 'flex';
        ic.style.flexDirection = 'column';
        ic.style.alignItems = 'stretch';
        const lbl = document.createElement('div');
        BaseWidget.applyWidgetLabelElementChrome(lbl);
        lbl.style.display = 'none';
        ic.appendChild(lbl);
        this.lblEl = lbl;

        this.modeWrap = document.createElement('div');
        this.modeWrap.style.flex = '1';
        this.modeWrap.style.width = '100%';
        this.modeWrap.style.minHeight = '0';
        this.modeWrap.style.position = 'relative';
        ic.appendChild(this.modeWrap);

        this.analogWrap = document.createElement('div');
        this.analogWrap.className = 'ds-clock-analog-wrap';
        this.analogWrap.style.cssText = DS_CLOCK_LAYER_STRETCH + 'display:none;';
        this.analogWrap.innerHTML =
            '<div class="face"></div>' +
            '<div class="num"></div>' +
            '<div class="bcp"></div>' +
            '<div class="h hr"></div>' +
            '<div class="h mn"></div>' +
            '<div class="h sc"></div>' +
            '<div class="cp"></div>';
        this.modeWrap.appendChild(this.analogWrap);

        this.e = {
            f: this.analogWrap.querySelector('.face'),
            n: this.analogWrap.querySelector('.num'),
            bcp: this.analogWrap.querySelector('.bcp'),
            hr: this.analogWrap.querySelector('.hr'),
            mn: this.analogWrap.querySelector('.mn'),
            sc: this.analogWrap.querySelector('.sc'),
            cp: this.analogWrap.querySelector('.cp')
        };

        this._tickEls = [];
        for (let i = 0; i < 60; i++) {
            const t = document.createElement('div');
            t.className = (i % 5 === 0) ? 'tk tk-major' : 'tk';
            t.style.setProperty('--clock-tick-angle', (i * 6) + 'deg');
            this.e.f.appendChild(t);
            this._tickEls.push(t);
        }
        this._numInners = [];
        for (let i = 1; i <= 12; i++) {
            const n = document.createElement('div');
            n.className = 'nm';
            n.style.setProperty('--clock-num-angle', (i * 30) + 'deg');
            n.style.setProperty('--clock-num-angle-neg', (-i * 30) + 'deg');
            const inner = document.createElement('span');
            inner.className = 'nm-inner';
            inner.textContent = String(i);
            n.appendChild(inner);
            this.e.n.appendChild(n);
            this._numInners.push(inner);
        }

        this.flipRoot = document.createElement('div');
        this.flipRoot.className = 'ds-flip-clock';
        this.flipRoot.style.cssText = DS_CLOCK_LAYER_STRETCH + 'display:none;align-items:center;justify-content:center;';
        this.flipInner = document.createElement('div');
        this.flipInner.className = 'ds-flip-inner';
        this.flipRoot.appendChild(this.flipInner);
        this.modeWrap.appendChild(this.flipRoot);

        this.textRoot = document.createElement('div');
        this.textRoot.className = 'ds-clock-text-root';
        this.textRoot.style.cssText = DS_CLOCK_LAYER_STRETCH + 'display:none;flex-direction:column;align-items:stretch;justify-content:center;padding:4px;overflow:hidden;';
        this._textInnerEl = document.createElement('div');
        this._textInnerEl.className = 'ds-clock-text-inner';
        this._textDateEl = document.createElement('div');
        this._textDateEl.className = 'ds-clock-text-date';
        this._textTimeEl = document.createElement('div');
        this._textTimeEl.className = 'ds-clock-text-time';
        this._textInnerEl.appendChild(this._textDateEl);
        this._textInnerEl.appendChild(this._textTimeEl);
        this.textRoot.appendChild(this._textInnerEl);
        this.modeWrap.appendChild(this.textRoot);
    }

    _ensureClockStructure() {
        const ic = this.elements && this.elements.innerContent;
        if (!ic) return;
        if (this.modeWrap && this.modeWrap.parentNode === ic && this.lblEl && this.lblEl.parentNode === ic &&
            this._textInnerEl && this._textDateEl && this.textRoot && this.flipRoot && this.analogWrap && this.e && this.e.hr) {
            return;
        }
        this._mountClockContent(ic);
    }

    _applyHandChrome(el, widthPx, heightPx, color) {
        if (!el) return;
        Utils.setCssVarIfChanged(el, '--clock-hand-w', widthPx + 'px');
        Utils.setCssVarIfChanged(el, '--clock-hand-h', heightPx + 'px');
        Utils.setCssVarIfChanged(el, '--clock-hand-left', 'calc(50% - ' + (widthPx / 2) + 'px)');
        Utils.setCssVarIfChanged(el, '--clock-hand-color', color);
    }

    _applyCapChrome(el, sizePx, color) {
        if (!el) return;
        Utils.setCssVarIfChanged(el, '--clock-cap-w', sizePx + 'px');
        Utils.setCssVarIfChanged(el, '--clock-cap-h', sizePx + 'px');
        Utils.setCssVarIfChanged(el, '--clock-cap-color', color);
    }

    _applyAnalogChrome(c, innerW, innerH, deactivated) {
        if (!this.analogWrap || !this.e) return;
        const wrap = this.analogWrap;
        const r = Math.min(innerW, innerH) / 2;
        const deactCol = deactivated ? BaseWidget.getDeactivatedColor(c) : null;
        const accentCol = deactivated ? BaseWidget.getDeactivatedColorAccent(c) : null;
        const tickCol = deactivated ? accentCol : BaseWidget.resolveCssColor(c.colTicks);
        wrap.classList.toggle('ds-clock-hide-ticks', !BaseWidget.configFlag(c.showTicks, true));
        wrap.classList.toggle('ds-clock-hide-numbers', !BaseWidget.configFlag(c.showNumbers, true));
        wrap.classList.toggle('ds-clock-deact-face', !!deactivated);
        wrap.classList.toggle('ds-clock-hide-second', !BaseWidget.configFlag(c.showSecondHand, true));
        wrap.classList.toggle('ds-clock-hide-back-cap', !!deactivated);
        Utils.setCssVarIfChanged(wrap, '--clock-tick-dist', (r * 0.85) + 'px');
        Utils.setCssVarIfChanged(wrap, '--clock-tick-color', tickCol);
        Utils.setCssVarIfChanged(wrap, '--clock-num-dist', (r * (c.numDist / 100)) + 'px');
        Utils.setCssVarIfChanged(wrap, '--clock-deact-col', deactCol || 'transparent');
        Utils.setCssVarIfChanged(wrap, '--clock-deact-size', (r * 2) + 'px');
        this._applyHandChrome(this.e.hr, c.wHour, (c.lHour / 100) * r, deactivated ? deactCol : BaseWidget.resolveCssColor(c.colHour));
        this._applyHandChrome(this.e.mn, c.wMin, (c.lMin / 100) * r, deactivated ? deactCol : BaseWidget.resolveCssColor(c.colMin));
        this._applyHandChrome(this.e.sc, c.wSec, (c.lSec / 100) * r, deactivated ? deactCol : BaseWidget.resolveCssColor(c.colSec));
        this._applyCapChrome(this.e.cp, c.capSize || 8, deactivated ? deactCol : BaseWidget.resolveCssColor(c.colSec));
        this._applyCapChrome(this.e.bcp, c.backCapSize || 8, deactivated ? deactCol : BaseWidget.resolveCssColor(c.colHour));
        const numInners = this._numInners;
        if (numInners) {
            for (let i = 0; i < numInners.length; i++) {
                this.applyTypographyToElement(numInners[i], 'clockAnalogNum', c);
                if (deactivated) numInners[i].style.color = accentCol;
            }
        }
    }

    static _getTextSegmentDtf(locale, tz, prop, val) {
        if (!ClockWidget._textSegmentDtfMap) {
            ClockWidget._textSegmentDtfMap = new Map();
        }
        const map = ClockWidget._textSegmentDtfMap;
        const key = (locale || 'en-GB') + '|' + (tz || '') + '|' + prop + ':' + val;
        let dtf = map.get(key);
        if (dtf) return dtf;
        const opts = tz ? { timeZone: tz } : {};
        opts[prop] = val;
        dtf = new Intl.DateTimeFormat(locale, opts);
        if (map.size >= 64) {
            const oldestKey = map.keys().next().value;
            if (oldestKey !== undefined) map.delete(oldestKey);
        }
        map.set(key, dtf);
        return dtf;
    }

    _formatTextSegment(kind, st, locale) {
        if (!kind || kind === 'none') return '';
        const c = this.config;
        const useSys = c.useSystemTime !== false;
        const tz = useSys ? null : (c.timezone || c.defaultClockTimezone || 'UTC');
        const inst = new Date(st.epochMs);
        try {
            switch (kind) {
                case 'day':
                    return ClockWidget._getTextSegmentDtf(locale, tz, 'day', 'numeric').format(inst);
                case 'day2Digit':
                    return (st.day < 10 ? '0' : '') + st.day;
                case 'monthNum':
                    return ClockWidget._getTextSegmentDtf(locale, tz, 'month', 'numeric').format(inst);
                case 'monthNum2Digit':
                    return (st.month < 10 ? '0' : '') + st.month;
                case 'monthName':
                    return ClockWidget._getTextSegmentDtf(locale, tz, 'month', 'long').format(inst);
                case 'weekday':
                    return ClockWidget._getTextSegmentDtf(locale, tz, 'weekday', 'long').format(inst);
                case 'week':
                    return String(ClockWidget.isoWeekNumber(st.year, st.month, st.day));
                case 'weekLabeled': {
                    const wn = String(ClockWidget.isoWeekNumber(st.year, st.month, st.day));
                    const custom = c.textWeekPrefix != null && String(c.textWeekPrefix).trim();
                    const prefix = custom || ClockWidget.weekPrefixForLocale(locale) || 'Week';
                    return `${prefix} ${wn}`;
                }
                case 'yearLong':
                    return ClockWidget._getTextSegmentDtf(locale, tz, 'year', 'numeric').format(inst);
                case 'yearShort':
                    return ClockWidget._getTextSegmentDtf(locale, tz, 'year', '2-digit').format(inst);
                default:
                    return '';
            }
        } catch (e) {
            return '';
        }
    }

    /** Build time row with span nodes so blinking separators keep fixed width (opacity toggle). */
    static fillTextTimeElement(el, c, st) {
        if (!el) return;
        if (!c.textShowTime) {
            if (el.firstChild) {
                while (el.firstChild) el.removeChild(el.firstChild);
            }
            el._dsClockSlotSig = '';
            return;
        }
        let h = st.h24;
        let ampmStr = '';
        if (c.clockUse12Hour) {
            ampmStr = st.h24 >= 12 ? 'PM' : 'AM';
            h = st.h24 % 12;
            if (h === 0) h = 12;
        }
        const sepRaw = c.textTimeSeparator != null && String(c.textTimeSeparator) !== '' ? String(c.textTimeSeparator) : ':';
        const sep = sepRaw.length ? sepRaw.charAt(0) : ':';
        const blinkOn = !c.textBlinkSeparator || (Math.floor(Date.now() / 500) % 2 === 0);
        const sepOpacity = (c.textBlinkSeparator && !blinkOn) ? '0' : '1';
        const pad2 = (n) => (n < 10 ? '0' : '') + n;

        const showH = !!c.textShowHour;
        const showM = !!c.textShowMinute;
        const showS = !!c.textShowSecond;
        const showAmpm = !!ampmStr;
        const structSig = (showH ? '1' : '0') + (showM ? '1' : '0') + (showS ? '1' : '0') + (showAmpm ? '1' : '0');

        let idx = 0;
        const rebuild = el._dsClockSlotSig !== structSig;
        if (rebuild) {
            while (el.firstChild) el.removeChild(el.firstChild);
            el._dsClockSlotSig = structSig;
        }
        const kids = el.children;
        let hasNum = false;
        const syncSpan = (cls, txt, opacity) => {
            let s;
            if (rebuild || idx >= kids.length) {
                s = document.createElement('span');
                s.className = cls;
                s.textContent = txt;
                if (opacity !== null) s.style.opacity = opacity;
                el.appendChild(s);
            } else {
                s = kids[idx];
                if (s.className !== cls) s.className = cls;
                if (s.textContent !== txt) s.textContent = txt;
                if (opacity !== null && s.style.opacity !== opacity) s.style.opacity = opacity;
            }
            idx += 1;
        };
        if (showH) {
            syncSpan('ds-clock-text-num', c.clockUse12Hour ? String(h) : pad2(st.h24), null);
            hasNum = true;
        }
        if (showM) {
            if (hasNum) syncSpan('ds-clock-text-sep', sep, sepOpacity);
            syncSpan('ds-clock-text-num', pad2(st.m), null);
            hasNum = true;
        }
        if (showS) {
            if (hasNum) syncSpan('ds-clock-text-sep', sep, sepOpacity);
            syncSpan('ds-clock-text-num', pad2(st.s), null);
            hasNum = true;
        }
        if (showAmpm) {
            syncSpan('ds-clock-text-ampm', `\u00a0${ampmStr}`, null);
        }
    }

    _syncClockTextLayout(c) {
        const inner = this._textInnerEl;
        if (!inner || !this._textDateEl || !this._textTimeEl) return;
        const align = c.clockTimeDateAlign || 'center';
        const jc = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
        inner.style.display = 'flex';
        inner.style.flexWrap = 'wrap';
        inner.style.width = '100%';
        inner.style.boxSizing = 'border-box';
        inner.style.justifyContent = jc;
        const showDate = !!c.textShowDate;
        const showTime = !!c.textShowTime && (!!c.textShowHour || !!c.textShowMinute || !!c.textShowSecond);
        const oneRow = !c.textDateLinebreak && showDate && showTime;
        inner.style.flexDirection = oneRow ? 'row' : 'column';
        inner.style.alignItems = oneRow ? 'baseline' : 'stretch';
        this._textTimeEl.style.marginLeft = oneRow ? '0.35em' : '';
        this._textDateEl.style.width = oneRow ? 'auto' : '100%';
        this._textTimeEl.style.width = oneRow ? 'auto' : '100%';
        const marginAfterDate = c.textDateLinebreak && showDate && showTime ? '0.35em' : '0';
        this._textDateEl.style.marginBottom = marginAfterDate;
        const ta = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
        this._textDateEl.style.textAlign = ta;
        this._textTimeEl.style.textAlign = ta;
    }

    _buildBaseDOM() {
        const b = super._buildBaseDOM();
        this._mountClockContent(b.innerContent);
        return b;
    }

    _ensureFlipPieces(showSeconds, use12h, c) {
        const needAmpm = use12h;
        const cols = 2 + (showSeconds ? 1 : 0) + (needAmpm ? 1 : 0);
        const loc = (c && c.flipLocale) || 'en-GB';
        const trimLab = (key) => {
            const v = c && c[key] != null ? c[key] : '';
            return String(v).trim();
        };
        const caption = (unit, key) => {
            const t = trimLab(key);
            if (t) return t;
            return ClockWidget.flipUnitCaption(loc, unit);
        };
        const captionKey = [loc, trimLab('flipLabelHour'), trimLab('flipLabelMinute'), trimLab('flipLabelSecond')].join('\u0001');
        const rebuildKey = `${cols}|${captionKey}`;
        if (this._flipCols === cols && this._flipPieces && this._flipRebuildKey === rebuildKey) return;
        this._flipCols = cols;
        this._flipRebuildKey = rebuildKey;
        this.flipInner.innerHTML = '';
        this._flipPieces = [];
        const hPiece = new DsFlipDigitPiece(caption('hour', 'flipLabelHour'));
        this.flipInner.appendChild(hPiece.el);
        this._flipPieces.push(hPiece);
        const mPiece = new DsFlipDigitPiece(caption('minute', 'flipLabelMinute'));
        this.flipInner.appendChild(mPiece.el);
        this._flipPieces.push(mPiece);
        if (showSeconds) {
            const sPiece = new DsFlipDigitPiece(caption('second', 'flipLabelSecond'));
            this.flipInner.appendChild(sPiece.el);
            this._flipPieces.push(sPiece);
        }
        if (needAmpm) {
            this._flipAmpmEl = document.createElement('div');
            this._flipAmpmEl.className = 'ds-flip-ampm-card';
            this.flipInner.appendChild(this._flipAmpmEl);
        } else {
            this._flipAmpmEl = null;
        }
    }

    onTick() {
        const epochSig = this._renderInputsEpochSig();
        const hasBindings = this.bindings && Object.keys(this.bindings).length > 0;
        const c = (!hasBindings && this._lastTickConfig && this._lastTickEpochSig === epochSig)
            ? this._lastTickConfig
            : (this._lastTickEpochSig = epochSig, this._lastTickConfig = this.config);
        const mode = c.displayMode || 'analog';
        const st = this.getWallClockState(c);

        if (typeof DashboardAudio !== 'undefined' && !c.deactivated) {
            if (!this._audioEdgeStore) {
                this._audioEdgeStore = { s: {}, m: {}, h: {}, d: {} };
            }
            const audio = c.audio;
            DashboardAudio.observeChange(this._audioEdgeStore.s, st.s, function () {
                DashboardAudio.playFrom(audio, 'everySecond');
            });
            DashboardAudio.observeChange(this._audioEdgeStore.m, st.m, function () {
                DashboardAudio.playFrom(audio, 'everyMinute');
            });
            DashboardAudio.observeChange(this._audioEdgeStore.h, st.h24, function () {
                DashboardAudio.playFrom(audio, 'everyHour');
            });
            DashboardAudio.observeChange(
                this._audioEdgeStore.d,
                String(st.year) + '-' + String(st.month) + '-' + String(st.day),
                function () {
                    DashboardAudio.playFrom(audio, 'everyDay');
                }
            );
        }

        if (mode === 'analog') {
            if (!this.e || !this.e.hr || !this.e.mn || !this.e.sc) return;
            const h = st.h24;
            const m = st.m;
            const s = st.s;
            const ms = st.ms;
            const ts = (h * 3600) + (m * 60) + s;
            const smooth = c.sweepMode === 'smooth';
            const md = (ts / 60) * 6;
            const hd = (ts / 3600) * 30;
            this._writeHandTransform(this.e.hr, this._advanceHandDegrees('hour', hd));
            this._writeHandTransform(this.e.mn, this._advanceHandDegrees('min', md));
            const hideSecond = this.analogWrap && this.analogWrap.classList.contains('ds-clock-hide-second');
            if (smooth && !hideSecond) {
                this._secHandLive = false;
                const force = this._smoothForce === true;
                this._smoothForce = false;
                this._syncSmoothSecondHand(st, force);
            } else if (c.sweepMode === 'tick') {
                this._clearSmoothSecondHand();
                const sd = this._advanceHandDegrees('sec', ts * 6);
                const tickTransition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                if (!this._secHandLive) {
                    this.e.sc.style.transition = 'none';
                    this._writeHandTransform(this.e.sc, sd);
                    this._secHandLive = true;
                } else {
                    if (this.e.sc.style.transition !== tickTransition) this.e.sc.style.transition = tickTransition;
                    this._writeHandTransform(this.e.sc, sd);
                }
            } else {
                this._secHandLive = false;
                this._clearSmoothSecondHand();
                const sd = this._advanceHandDegrees('sec', ts * 6);
                if (this.e.sc.style.transition !== 'none') this.e.sc.style.transition = 'none';
                this._writeHandTransform(this.e.sc, sd);
            }
            return;
        }

        if (mode === 'flip') {
            this._ensureFlipPieces(!!c.flipShowSeconds, !!c.clockUse12Hour, c);
            if (!this._flipPieces || this._flipPieces.length < 2) return;
            let hDisp = st.h24;
            let ampm = '';
            if (c.clockUse12Hour) {
                ampm = st.h24 >= 12 ? 'PM' : 'AM';
                hDisp = st.h24 % 12;
                if (hDisp === 0) hDisp = 12;
            }
            this._flipPieces[0].update(String(hDisp).padStart(2, '0'));
            this._flipPieces[1].update(st.m);
            if (c.flipShowSeconds && this._flipPieces[2]) {
                this._flipPieces[2].update(st.s);
            }
            if (this._flipAmpmEl) {
                this._flipAmpmEl.textContent = ampm;
            }
            return;
        }

        if (mode === 'text') {
            const locale = c.textLocale || 'en-GB';
            const parts = [];
            if (c.textShowDate) {
                [c.textDateSeg0, c.textDateSeg1, c.textDateSeg2, c.textDateSeg3, c.textDateSeg4].forEach((seg) => {
                    const t = this._formatTextSegment(seg, st, locale);
                    if (t) parts.push(t);
                });
            }
            const dateSepRaw = c.textDateSeparator != null ? String(c.textDateSeparator) : '';
            const dateStr = parts.join(dateSepRaw.length ? dateSepRaw.charAt(0) : ' ');
            if (this._textDateEl) {
                if (this._textDateEl.textContent !== dateStr) this._textDateEl.textContent = dateStr;
                const dateDisp = c.textShowDate && dateStr ? '' : 'none';
                if (this._textDateEl.style.display !== dateDisp) this._textDateEl.style.display = dateDisp;
            }
            if (this._textTimeEl) {
                ClockWidget.fillTextTimeElement(this._textTimeEl, c, st);
                const hasTime = c.textShowTime && (c.textShowHour || c.textShowMinute || c.textShowSecond);
                const timeDisp = hasTime ? '' : 'none';
                if (this._textTimeEl.style.display !== timeDisp) this._textTimeEl.style.display = timeDisp;
            }
            this._syncClockTextLayout(c);
        }
    }

    _applyModeVisibility(mode, resolvedConfig) {
        if (this.analogWrap) this.analogWrap.style.display = mode === 'analog' ? 'block' : 'none';
        if (this.flipRoot) this.flipRoot.style.display = mode === 'flip' ? 'flex' : 'none';
        if (this.textRoot) this.textRoot.style.display = mode === 'text' ? 'flex' : 'none';
        if (mode === 'flip' && this.flipInner) {
            const c = resolvedConfig || this.config;
            this._ensureFlipPieces(!!c.flipShowSeconds, !!c.clockUse12Hour, c);
        }
    }

    _scaleFlipToContainer() {
        const c = this.config;
        if (!this.modeWrap || !this.flipRoot) return;
        const w = this.modeWrap.clientWidth;
        const h = this.modeWrap.clientHeight;
        if (w < 8 || h < 8) return;
        const n = (c.flipShowSeconds ? 1 : 0) + 2 + (c.clockUse12Hour ? 0.65 : 0);
        const base = Math.min(w / (n * 2.2), h / 1.8);
        const layoutFs = Math.max(10, Math.min(base * 0.85, 120));
        const refFs = 28;
        const userWant = c.clockFlipNumFs != null ? c.clockFlipNumFs : refFs;
        const fs = Math.max(10, Math.min(layoutFs * (userWant / refFs), 160));
        this.flipRoot.style.setProperty('--ds-flip-font-size', fs + 'px');
        const labFs = c.clockFlipLabelFs != null ? c.clockFlipLabelFs : 10;
        const labelPx = Math.max(8, Math.min(fs * (labFs / 28), fs * 0.45));
        this.flipRoot.style.setProperty('--ds-flip-label-size', labelPx + 'px');
    }

    _renderSpecific() {
        this._ensureClockStructure();
        const c = this.config;
        this._lastTickConfig = c;
        this._lastTickEpochSig = this._renderInputsEpochSig();
        const mode = c.displayMode || 'analog';

        if (!this.lblEl || !this.modeWrap) return;

        this.lblEl.textContent = c.label;
        this.lblEl.style.display = c.label ? 'block' : 'none';
        if (c.label) {
            this.applyTypographyToElement(this.lblEl, 'clockGroupLabel', c);
            this.lblEl.style.transform = `translate(${c.clockGroupLabelOffX || 0}px, ${c.clockGroupLabelOffY || 0}px)`;
        } else {
            this.lblEl.style.transform = 'none';
        }

        this._applyModeVisibility(mode, c);

        const glFs = c.clockGroupLabelFs != null ? c.clockGroupLabelFs : 12;
        const labelHeight = c.label ? (glFs + 12) : 0;
        let innerW = c.width - (c.padding * 2);
        let innerH = c.height - (c.padding * 2) - labelHeight;
        // In Responsive Columns the cell size differs from the fixed c.width/c.height,
        // so prefer the real modeWrap dimensions once the grid has laid out. modeWrap
        // already sits inside the container padding and below the label, so its
        // clientWidth/clientHeight are the true drawable face area.
        if (this.modeWrap) {
            const mwW = this.modeWrap.clientWidth;
            const mwH = this.modeWrap.clientHeight;
            if (mwW > 0) innerW = mwW;
            if (mwH > 0) innerH = mwH;
        }

        if (c.deactivated) {
            this._wasDeactivated = true;
            const deactCol = BaseWidget.getDeactivatedColor(c);
            const accentCol = BaseWidget.getDeactivatedColorAccent(c);

            if (c.label) {
                this.lblEl.style.display = 'block';
                this.lblEl.style.color = accentCol;
            } else {
                this.lblEl.style.display = 'none';
            }

            if (mode === 'analog' && this.e && this.e.n) {
                this._applyAnalogChrome(c, innerW, innerH, true);
            } else if (mode === 'flip' && this.flipRoot && this.flipInner) {
                this.flipRoot.style.setProperty('--ds-flip-upper-bg', deactCol);
                this.flipRoot.style.setProperty('--ds-flip-lower-bg', deactCol);
                this.flipRoot.style.setProperty('--ds-flip-radius', (c.flipCardRadius || 0) + 'px');
                this.flipInner.style.setProperty('--ds-flip-column-gap', `${c.flipSeparator}px`);
                this.flipInner.querySelectorAll('.ds-flip-slot').forEach((el) => {
                    el.style.display = c.flipShowLabels ? '' : 'none';
                    this.applyTypographyToElement(el, 'clockFlipLabel', c);
                    el.style.color = accentCol;
                });
                this.flipInner.style.fontFamily = c.clockFlipNumFont || c.fontFamily || 'inherit';
                this.flipInner.style.fontWeight = c.clockFlipNumBold ? '700' : '400';
                this.flipInner.style.fontStyle = c.clockFlipNumItalic ? 'italic' : 'normal';
                this.flipInner.style.setProperty('--ds-flip-num-color-top', accentCol);
                this.flipInner.style.setProperty('--ds-flip-num-color-bottom', accentCol);
                this._scaleFlipToContainer();
                if (this._flipAmpmEl) {
                    this.applyTypographyToElement(this._flipAmpmEl, 'clockFlipAmPm', c);
                    this._flipAmpmEl.style.color = accentCol;
                    this._flipAmpmEl.style.alignSelf = 'center';
                }
            } else if (mode === 'text' && this._textDateEl && this._textTimeEl && this._textInnerEl) {
                this.applyTypographyToElement(this._textDateEl, 'clockTimeDate', c);
                this.applyTypographyToElement(this._textTimeEl, 'clockTimeDate', c);
                this._textDateEl.style.color = accentCol;
                this._textTimeEl.style.color = accentCol;
                const minDim = Math.min(this.modeWrap.clientWidth, this.modeWrap.clientHeight) || 80;
                this._applyClockTextScale(c, minDim);
                this._syncClockTextLayout(c);
            }

            this.onTick();
            this._syncClockTicker();
            this._noteClockFaceBox(innerW, innerH);
            this._scheduleClockFaceMeasure();
            return;
        }

        if (mode === 'analog' && this.e && this.e.n) {
            this._wasDeactivated = false;
            this._applyAnalogChrome(c, innerW, innerH, false);
        }

        if (mode === 'flip' && this.flipRoot && this.flipInner) {
            this.flipRoot.style.setProperty('--ds-flip-upper-bg', BaseWidget.resolveCssColor(c.flipUpperColor));
            this.flipRoot.style.setProperty('--ds-flip-lower-bg', BaseWidget.resolveCssColor(c.flipLowerColor));
            this.flipRoot.style.setProperty('--ds-flip-radius', (c.flipCardRadius || 0) + 'px');
            this.flipInner.style.setProperty('--ds-flip-column-gap', `${c.flipSeparator}px`);
            this.flipInner.querySelectorAll('.ds-flip-slot').forEach((el) => {
                el.style.display = c.flipShowLabels ? '' : 'none';
                this.applyTypographyToElement(el, 'clockFlipLabel', c);
            });
            this.flipInner.style.fontFamily = c.clockFlipNumFont || c.fontFamily || 'inherit';
            this.flipInner.style.fontWeight = c.clockFlipNumBold ? '700' : '400';
            this.flipInner.style.fontStyle = c.clockFlipNumItalic ? 'italic' : 'normal';
            const flipNumFg = BaseWidget.resolveCssColor(c.clockFlipNumCol || '@onAccent');
            this.flipInner.style.setProperty('--ds-flip-num-color-top', flipNumFg);
            this.flipInner.style.setProperty('--ds-flip-num-color-bottom', flipNumFg);
            this._scaleFlipToContainer();
            if (this._flipAmpmEl) {
                this.applyTypographyToElement(this._flipAmpmEl, 'clockFlipAmPm', c);
                this._flipAmpmEl.style.alignSelf = 'center';
            }
        }

        if (mode === 'text' && this._textDateEl && this._textTimeEl && this._textInnerEl) {
            this.applyTypographyToElement(this._textDateEl, 'clockTimeDate', c);
            this.applyTypographyToElement(this._textTimeEl, 'clockTimeDate', c);
            const minDim = Math.min(this.modeWrap.clientWidth, this.modeWrap.clientHeight) || 80;
            this._applyClockTextScale(c, minDim);
            this._syncClockTextLayout(c);
        }

        if (mode !== 'analog') this.onTick();
        this._syncClockTicker();
        if (mode === 'analog') this.onTick();
        this._noteClockFaceBox(innerW, innerH);
        this._scheduleClockFaceMeasure();
    }
}

WidgetRegistry.register('clock', ClockWidget);
