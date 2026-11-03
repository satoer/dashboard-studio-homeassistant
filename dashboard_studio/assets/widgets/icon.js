class IconWidget extends BaseWidget {

    static get metadata() {

        return { label: "Icon", shortName: "Icon", icon: "ph-star", category: "Graphics", color_dark: "hsl(10, 80%, 65%)", color_light: "hsl(10, 85%, 35%)", version: "2.3.1", date: "2026-11-02" };

    }



    static get ICON_KEYMAP_ON() {

        if (typeof MenuWidget !== 'undefined' && MenuWidget.ICON_STYLE_KEYMAP_ON) {

            return MenuWidget.ICON_STYLE_KEYMAP_ON;

        }

        return {

            source: 'iconSourceOn',

            builtin: 'iconOn',

            weight: 'iconWeightOn',

            customUrl: 'imgOn',

            tintImage: 'colorizeOn',

            accentColor: 'iconSlotAccentOn',

            offsetX: 'iconSlotOffsetXOn',

            offsetY: 'iconSlotOffsetYOn',

            rotation: 'iconSlotRotationOn'

        };

    }



    static get ICON_KEYMAP_OFF() {

        if (typeof MenuWidget !== 'undefined' && MenuWidget.ICON_STYLE_KEYMAP_OFF) {

            return MenuWidget.ICON_STYLE_KEYMAP_OFF;

        }

        return {

            source: 'iconSourceOff',

            builtin: 'iconOff',

            weight: 'iconWeightOff',

            customUrl: 'imgOff',

            tintImage: 'colorizeOff',

            accentColor: 'iconSlotAccentOff',

            offsetX: 'iconSlotOffsetXOff',

            offsetY: 'iconSlotOffsetYOff',

            rotation: 'iconSlotRotationOff'

        };

    }



    /** Active (`icons.on`) stores only deltas from inactive (`icons.off`) for these keys (incl. custom image + tint). */
    static get ICON_ACTIVE_INHERIT_KEYS() {
        return ['source', 'builtin', 'weight', 'customUrl', 'tintImage', 'offsetX', 'offsetY', 'rotation'];
    }

    /**
     * Editor immediate sync after a base (inactive) nested save ({@link Editor._syncFollowerIconSlotFromLeaderImmediate}).
     */
    static get INHERIT_EDITOR_ICON_SLOTS() {
        return {
            leaderSlot: 'off',
            followerSlot: 'on',
            inheritKeys: IconWidget.ICON_ACTIVE_INHERIT_KEYS,
            followerKeymap: IconWidget.ICON_KEYMAP_ON
        };
    }

    static _normalizeIconWeightForCompare(w) {
        const s = w != null ? String(w).toLowerCase().trim() : '';
        return s || 'fill';
    }

    static iconActiveInheritPropEquals(a, b, prop) {
        if (prop === 'tintImage') return (!!a) === (!!b);
        if (prop === 'offsetX' || prop === 'offsetY' || prop === 'rotation') {
            const pickNum = function (v) {
                if (v === undefined || v === null || v === '') return 0;
                const n = typeof v === 'number' ? v : parseFloat(String(v).trim());
                return Number.isFinite(n) ? n : 0;
            };
            return pickNum(a) === pickNum(b);
        }
        if (prop === 'weight') {
            return IconWidget._normalizeIconWeightForCompare(a) === IconWidget._normalizeIconWeightForCompare(b);
        }
        if (prop === 'source') {
            const sa = (a === 'custom' || a === 'phosphor') ? a : 'phosphor';
            const sb = (b === 'custom' || b === 'phosphor') ? b : 'phosphor';
            return sa === sb;
        }
        const sa = String(a != null ? a : '').trim();
        const sb = String(b != null ? b : '').trim();
        return sa === sb;
    }

    /**
     * Formerly removed follower keys when equal to the leader for sparse storage.
     * That erased explicit user overrides when the base later matched (e.g. active Style bold, then base bold).
     * Inherit mode is represented by omitted keys + {@link BaseWidget.stripIconFollowerInheritPlaceholders} only.
     */
    static pruneIconActiveInheritKeys(_activeFollower, _inactiveLeader) {
        return false;
    }

    /** Migrator may call; inactive→active inherits sparsely — no stored merge. */
    static normalizeMirroredInactiveActiveGlyphStored(_oIgnored) {
        return false;
    }



    static get ICON_MASTER_KEYMAP() {

        return {

            source: 'defaultIconWidgetSource',

            builtin: 'defaultIconWidgetBuiltin',

            weight: 'defaultIconWidgetWeight',

            customUrl: 'defaultIconWidgetCustomUrl',

            tintImage: 'defaultIconWidgetTintImage',

            accentColor: 'defaultIconWidgetAccentColor'

        };

    }



    static get ICON_MASTER_KEYMAP_ACTIVE() {

        return {

            source: 'defaultIconWidgetActiveSource',

            builtin: 'defaultIconWidgetActiveBuiltin',

            weight: 'defaultIconWidgetActiveWeight',

            customUrl: 'defaultIconWidgetActiveCustomUrl',

            tintImage: 'defaultIconWidgetActiveTintImage',

            accentColor: 'defaultIconWidgetActiveAccentColor'

        };

    }



    /** Legacy full-glyph compare (migrator / `iconSlotsShareIdentity`); active sparse keys use {@link ICON_ACTIVE_INHERIT_KEYS}. */
    static get ICON_MIRROR_PROPS() {
        return ['source', 'builtin', 'weight', 'customUrl', 'tintImage'];
    }

    static get ICON_IDENTITY_PROPS() {
        return [...IconWidget.ICON_MIRROR_PROPS, 'accentColor'];
    }



    static defaultIconSlot() {

        if (typeof MenuWidget !== 'undefined' && MenuWidget.defaultIconSlot) {

            return MenuWidget.defaultIconSlot();

        }

        return { source: 'phosphor', builtin: '', weight: 'fill', customUrl: '', tintImage: false };

    }



    static defaultIconSlotFromMaster(M, keymap) {

        M = M || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {});

        const map = keymap || IconWidget.ICON_MASTER_KEYMAP;

        const slot = IconWidget.defaultIconSlot();

        const src = M[map.source];

        if (src === 'custom' || src === 'phosphor') slot.source = src;

        const builtin = M[map.builtin];

        if (builtin != null && String(builtin).trim() !== '') slot.builtin = String(builtin).trim();

        let w = M[map.weight];

        if (w == null || String(w).trim() === '') {

            w = M.defaultIconFilled === false ? 'regular' : 'fill';

        }

        slot.weight = String(w).toLowerCase().trim();

        if (M[map.customUrl] != null) slot.customUrl = String(M[map.customUrl]);

        if (M[map.tintImage] === true) slot.tintImage = true;

        else if (M[map.tintImage] === false) slot.tintImage = false;

        return slot;

    }



    static defaultActiveIconSlotFromMaster(M) {

        const inactive = IconWidget.defaultIconSlotFromMaster(M, IconWidget.ICON_MASTER_KEYMAP);

        const active = IconWidget.defaultIconSlotFromMaster(M, IconWidget.ICON_MASTER_KEYMAP_ACTIVE);

        const activeBuiltin = M.defaultIconWidgetActiveBuiltin;

        if (activeBuiltin == null || String(activeBuiltin).trim() === '') {

            active.builtin = inactive.builtin;

            if (!active.source || active.source === 'phosphor') active.source = inactive.source;

            if (!String(active.customUrl || '').trim() && String(inactive.customUrl || '').trim()) {

                active.customUrl = inactive.customUrl;

            }

        }

        return active;

    }



    static iconSlotsShareIdentity(a, b) {

        if (!a || !b) return false;

        return IconWidget.ICON_IDENTITY_PROPS.every((prop) => {

            const av = a[prop];

            const bv = b[prop];

            if (prop === 'tintImage') return !!av === !!bv;

            return String(av != null ? av : '').trim() === String(bv != null ? bv : '').trim();

        });

    }



    /**
     * Full active slot for flatten / render / preload: stored `icons.on` stays sparse; inherit-keys resolve
     * from `icons.off`, then inactive-default keys fill from `defaultActiveIconSlotFromMaster` (never flood
     * master defaults onto stored `icons.on` — same pattern as sparse `SwitchWidget.icons.off`).
     */
    static resolveActiveIconSlotForRuntime(o) {
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const defOn = IconWidget.defaultActiveIconSlotFromMaster(M);
        if (!o || !o.icons || typeof o.icons !== 'object') return defOn;
        const off = o.icons.off && typeof o.icons.off === 'object' ? o.icons.off : {};
        const sparseOn = o.icons.on && typeof o.icons.on === 'object' ? o.icons.on : {};
        const inherited = BaseWidget.resolveIconFollowerSlotFromLeader(
            off, sparseOn, IconWidget.ICON_ACTIVE_INHERIT_KEYS);
        return { ...defOn, ...inherited };
    }



    /** Prune redundant `icons.on` keys against master-aware inactive leader (editor save). */
    static buildIconsNestedEditorPatch(widgetType, icnIgnored, iconsPatch) {
        if (widgetType !== 'icon' || !iconsPatch || typeof iconsPatch !== 'object') {
            return { icons: iconsPatch };
        }
        const onPrev = iconsPatch.on && typeof iconsPatch.on === 'object' ? iconsPatch.on : {};
        const offPrev = iconsPatch.off && typeof iconsPatch.off === 'object' ? iconsPatch.off : {};
        const envPrune = { icons: { on: { ...onPrev }, off: { ...offPrev } } };
        IconWidget.ensureIconWidgetIcons(envPrune);
        const leaderForPrune = envPrune.icons.off;
        const on = {};
        Object.keys(onPrev).forEach(function (k) {
            on[k] = onPrev[k];
        });
        BaseWidget.stripIconFollowerInheritPlaceholders(on, IconWidget.ICON_ACTIVE_INHERIT_KEYS);
        IconWidget.pruneIconActiveInheritKeys(on, leaderForPrune);
        return { icons: { on, off: offPrev } };
    }



    static ensureIconWidgetIcons(o) {

        if (!o || typeof o !== 'object') return;

        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};

        const defOff = IconWidget.defaultIconSlotFromMaster(M, IconWidget.ICON_MASTER_KEYMAP);

        if (!o.icons || typeof o.icons !== 'object') o.icons = {};

        if (!o.icons.off || typeof o.icons.off !== 'object') {

            o.icons.off = { ...defOff };

        } else {

            const prev = { ...o.icons.off };

            Object.assign(o.icons.off, defOff);

            Object.assign(o.icons.off, prev);

        }

        const prevOn = (!o.icons.on || typeof o.icons.on !== 'object')

            ? {}

            : { ...o.icons.on };

        o.icons.on = {};

        Object.keys(prevOn).forEach(function (k) {

            o.icons.on[k] = prevOn[k];

        });

        BaseWidget.stripIconFollowerInheritPlaceholders(o.icons.on, IconWidget.ICON_ACTIVE_INHERIT_KEYS);

        IconWidget.pruneIconActiveInheritKeys(o.icons.on, o.icons.off);

    }



    static expandIconWidgetIconsToFlat(o) {

        IconWidget.ensureIconWidgetIcons(o);

        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};

        const nz = (v) => v !== undefined && v !== null && String(v).trim() !== '';

        const off = o.icons.off;

        const on = IconWidget.resolveActiveIconSlotForRuntime(o);

        const colOffFb = o.colInactive || M.iconInactive || '@icon';

        const colOnFb = o.colActive || M.iconActive || '@danger';

        const wOff = (off.weight != null && String(off.weight).trim() !== '')

            ? String(off.weight).toLowerCase().trim()

            : 'fill';

        const wOn = (on.weight != null && String(on.weight).trim() !== '')

            ? String(on.weight).toLowerCase().trim()

            : 'fill';

        const rawSrcOff = off ? off.source : 'phosphor';

        const coercedSrcOff = (rawSrcOff === 'custom' || rawSrcOff === 'phosphor') ? rawSrcOff : 'phosphor';

        const rawSrcOn = on ? on.source : 'phosphor';

        const coercedSrcOn = (rawSrcOn === 'custom' || rawSrcOn === 'phosphor') ? rawSrcOn : 'phosphor';

        const flat = {

            iconSourceOff: coercedSrcOff,

            iconOff: off.builtin,

            iconWeightOff: wOff,

            imgOff: off.customUrl,

            colorizeOff: off.tintImage === true,

            iconSlotColOff: (off && Object.prototype.hasOwnProperty.call(off, 'color') && nz(off.color)) ? off.color : colOffFb,

            iconSlotAccentOff: BaseWidget.resolveIconSlotAccentColor(off, M.defaultIconWidgetAccentColor),

            iconSourceOn: coercedSrcOn,

            iconOn: on.builtin,

            iconWeightOn: wOn,

            imgOn: on.customUrl,

            colorizeOn: on.tintImage === true,

            iconSlotColOn: (on && Object.prototype.hasOwnProperty.call(on, 'color') && nz(on.color)) ? on.color : colOnFb,

            iconSlotAccentOn: BaseWidget.resolveIconSlotAccentColor(on, M.defaultIconWidgetActiveAccentColor || M.defaultIconWidgetAccentColor)

        };

        Object.assign(flat, BaseWidget.flattenIconSlotTransformFlat(off, IconWidget.ICON_KEYMAP_OFF));

        Object.assign(flat, BaseWidget.flattenIconSlotTransformFlat(on, IconWidget.ICON_KEYMAP_ON));

        return flat;

    }



    static applyIconsNestedToConfig(c) {

        const flat = IconWidget.expandIconWidgetIconsToFlat(c);

        Object.keys(flat).forEach((k) => { c[k] = flat[k]; });

    }



    static attachIconWidgetMasterDefaultKeys(group, keymap) {

        if (!group || !Array.isArray(group.fields)) return;

        const map = keymap || IconWidget.ICON_MASTER_KEYMAP;

        const km = group.iconStyleKeyMap;

        group.fields.forEach((field) => {

            if (!field || !field.key) return;

            if (km) {

                Object.keys(km).forEach((logical) => {

                    if (field.key === km[logical] && map[logical]) field.defaultKey = map[logical];

                });

                return;

            }

            if (map[field.key]) field.defaultKey = map[field.key];

        });

    }



    static attachIconWidgetSlotColorDefaultKeys(group, slot) {

        if (!group || !Array.isArray(group.fields)) return;

        group.fields.forEach((field) => {

            if (slot === 'off' && field.key === 'iconSlotColOff') field.defaultKey = 'iconInactive';

            if (slot === 'on' && field.key === 'iconSlotColOn') field.defaultKey = 'iconActive';

        });

    }



    static applyTypographyNestedToConfig(c) {

        BaseWidget.applyTypographyNestedToConfig(c, [

            ['caption', 'iconCaption']

        ]);

    }



    static getNestedBindingOverlaySpec() {

        const spec = [];

        const pairs = [

            [IconWidget.ICON_KEYMAP_OFF, 'off'],

            [IconWidget.ICON_KEYMAP_ON, 'on']

        ];

        pairs.forEach(([km, slot]) => {

            const iconPropRows = [

                [km.source, 'source'],

                [km.builtin, 'builtin'],

                [km.weight, 'weight'],

                [km.customUrl, 'customUrl'],

                [km.tintImage, 'tintImage'],

                [slot === 'off' ? 'iconSlotColOff' : 'iconSlotColOn', 'color'],

                [km.accentColor, 'accentColor']

            ];

            if (km.offsetX && km.offsetY && km.rotation) {

                iconPropRows.push([km.offsetX, 'offsetX'], [km.offsetY, 'offsetY'], [km.rotation, 'rotation']);

            }

            iconPropRows.forEach(([configKey, prop]) => {

                spec.push({ path: ['icons', slot, prop], configKey });

            });

        });

        return spec.concat(BaseWidget.buildTypographyBindingOverlaySpec([['caption', 'iconCaption']]));

    }



    static fillIconCaptionTypographyResolved(c, M) {
        // Per-widget master typography keys (defaultIconCaption*) win over universal globals.
        const m = (suf) => M['defaultIconCaption' + suf];
        const hasStr = (v) => v != null && String(v).trim() !== '';

        if (!c.iconCaptionFont) {
            const mf = m('Font');
            c.iconCaptionFont = hasStr(mf) ? mf : (c.fontFamily || M.fontFamily || "'Inter', sans-serif");
        }

        if (c.iconCaptionFs == null || c.iconCaptionFs === '') {
            const mfs = m('Fs');
            c.iconCaptionFs = mfs != null ? mfs : (M.defaultFsLabel != null ? M.defaultFsLabel : 12);
        }

        if (!c.iconCaptionCol) {
            const mcol = m('Col');
            c.iconCaptionCol = hasStr(mcol) ? mcol : (M.defaultColLabel || '@textMuted');
        }

        if (!c.iconCaptionAlign) {
            const malign = m('Align');
            c.iconCaptionAlign = hasStr(malign) ? malign : BaseWidget.resolveMasterTextAlign(M);
        }

        if (!c.iconCaptionCase) {
            const mcase = m('Case');
            c.iconCaptionCase = hasStr(mcase) ? mcase : (M.defaultLabelCase || 'uppercase');
        }

        if (c.iconCaptionBold === undefined || c.iconCaptionBold === null) {
            const mbold = m('Bold');
            c.iconCaptionBold = mbold !== undefined && mbold !== null ? mbold === true : (M.defaultLabelBold === true);
        }

        if (c.iconCaptionOffX === undefined || c.iconCaptionOffX === null) {
            const moffx = m('OffX');
            c.iconCaptionOffX = moffx != null ? moffx : 0;
        }

        if (c.iconCaptionOffY === undefined || c.iconCaptionOffY === null) {
            const moffy = m('OffY');
            c.iconCaptionOffY = moffy != null ? moffy : 0;
        }

    }



    static extractPreloadImageUrls(o) {

        if (!o || typeof o !== 'object') return [];

        IconWidget.ensureIconWidgetIcons(o);

        const out = [];

        const off = o.icons.off;
        const onEff = IconWidget.resolveActiveIconSlotForRuntime(o);
        [off, onEff].forEach((slot) => {

            if (slot && slot.source === 'custom') {

                const u = String(slot.customUrl || '').trim();

                if (u) out.push(u);

            }

        });

        const leg = typeof o.iconUrl === 'string' ? o.iconUrl.trim() : '';

        if (leg) out.push(leg);

        return out;

    }



    static buildIconStyleGroupsForSchema(labelOff, labelOn, master) {

        const kmOff = { ...IconWidget.ICON_KEYMAP_OFF, color: 'iconSlotColOff' };

        const kmOn = { ...IconWidget.ICON_KEYMAP_ON, color: 'iconSlotColOn' };

        const gOff = BaseWidget.getIconStyleSchema(labelOff, kmOff, {
            exclude: ['hoverColor', 'size'],
            headerSuffix: 'Base Icon Style'
        });

        const gOn = BaseWidget.getIconStyleSchema(labelOn, kmOn, { exclude: ['hoverColor', 'size'] });

        BaseWidget.attachIconsNestedToIconStyleGroup(gOff, 'off');

        BaseWidget.attachIconsNestedToIconStyleGroup(gOn, 'on');

        if (master) {

            BaseWidget.attachIconAccentFieldDefaultKeys(gOff, { iconSlotAccentOff: 'defaultIconWidgetAccentColor' });

            BaseWidget.attachIconAccentFieldDefaultKeys(gOn, { iconSlotAccentOn: 'defaultIconWidgetActiveAccentColor' });

            IconWidget.attachIconWidgetMasterDefaultKeys(gOff, IconWidget.ICON_MASTER_KEYMAP);

            IconWidget.attachIconWidgetMasterDefaultKeys(gOn, IconWidget.ICON_MASTER_KEYMAP_ACTIVE);

        } else {

            BaseWidget.attachIconAccentFieldDefaultKeys(gOff, { iconSlotAccentOff: 'defaultIconWidgetAccentColor' });

            BaseWidget.attachIconAccentFieldDefaultKeys(gOn, { iconSlotAccentOn: 'defaultIconWidgetActiveAccentColor' });

        }

        IconWidget.attachIconWidgetSlotColorDefaultKeys(gOff, 'off');

        IconWidget.attachIconWidgetSlotColorDefaultKeys(gOn, 'on');

        return [gOff, gOn];

    }



    static get globalSettings() {

        return {

            iconActive: "@danger",

            iconInactive: "@icon",

            defaultIconFilled: true,

            defaultIconAnimSpeed: 1,

            defaultIconBlink: false,

            defaultIconGlowOnActive: true,

            defaultIconSize: 80,



            defaultIconWidgetSource: "phosphor",

            defaultIconWidgetBuiltin: "ph-warning",

            defaultIconWidgetWeight: "fill",

            defaultIconWidgetCustomUrl: "",

            defaultIconWidgetTintImage: false,

            defaultIconWidgetAccentColor: "@iconAccent",



            defaultIconWidgetActiveSource: "phosphor",

            defaultIconWidgetActiveBuiltin: "",

            defaultIconWidgetActiveWeight: "fill",

            defaultIconWidgetActiveCustomUrl: "",

            defaultIconWidgetActiveTintImage: false,

            defaultIconWidgetActiveAccentColor: "@iconAccent"

        };

    }



    static get basicSettingKeys() {
        return [
            { key: 'active', cols: 6 },
            { key: 'blink', cols: 6 },
            'iconOff',
            'iconOn',
            { key: 'size', cols: 12 }
        ];
    }

    static get globalSchema() {

        const [gOff, gOn] = IconWidget.buildIconStyleGroupsForSchema('Default Icon', 'Default Active Icon', true);



        return [

            { key: 'defaultIconSize', type: 'number', label: 'Default Icon Size', cols: 12 },

            { key: 'defaultIconBlink', type: 'checkbox', label: 'Default Blink', cols: 4 },

            { key: 'defaultIconAnimSpeed', type: 'number', label: 'Animation Speed (s)', cols: 4 },

            { key: 'defaultIconGlowOnActive', type: 'checkbox', label: 'Glow on Active', cols: 4 },



            { type: 'heading', label: 'Default Icon', cols: 12 },

            gOff,

            { type: 'heading', label: 'Default Active Icon', cols: 12 },

            gOn,

            { type: 'heading', label: 'Text & Typography', cols: 12 },

            BaseWidget.getWidgetLabelTypographySchema('defaultIconCaption', 'caption', {
                exclude: ['opacity', 'italic']
            })

        ];

    }



    static get AUDIO_TRIGGERS() {

        return [

            { key: 'activated', label: 'On Activated' },

            { key: 'deactivated', label: 'On Deactivated' }

        ];

    }



    getDefaultOverrides() {

        return {

            active: false,

            label: "",

            activeIconMirrorsInactive: true,

            typography: { caption: {} },

            icons: { off: {}, on: {} },

            audio: (typeof DashboardAudio !== 'undefined' && DashboardAudio.defaultAudio)

                ? DashboardAudio.defaultAudio(IconWidget.AUDIO_TRIGGERS)

                : { activated: '', deactivated: '' }

        };

    }



    get config() {

        const c = super.config;

        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};



        IconWidget.applyTypographyNestedToConfig(c);

        IconWidget.fillIconCaptionTypographyResolved(c, M);

        IconWidget.applyIconsNestedToConfig(c);

        BaseWidget.applyNestedBindingOverlay(this, c, IconWidget.getNestedBindingOverlaySpec());



        const out = {

            ...c,

            activeIconMirrorsInactive: c.activeIconMirrorsInactive !== false,

            size: c.size !== undefined && c.size !== null ? c.size : (c.defaultIconSize || 80),

            blink: c.blink !== undefined && c.blink !== null ? c.blink : c.defaultIconBlink,

            animSpeed: c.animSpeed !== undefined && c.animSpeed !== null ? c.animSpeed : (c.defaultIconAnimSpeed || 1),

            glowOnActive: c.glowOnActive !== undefined && c.glowOnActive !== null
                ? c.glowOnActive !== false
                : (c.defaultIconGlowOnActive !== false),

            label: c.label || ""

        };



        [

            'labelFont', 'labelFs', 'labelCol', 'labelAlign', 'labelCase', 'labelBold', 'labelOffX', 'labelOffY',

            'icon', 'iconUrl', 'iconColorize', 'iconFilled',

            'colActive', 'colInactive'

        ].forEach((k) => { delete out[k]; });

        delete out.typography;

        delete out.icons;



        return out;

    }



    getSchema() {

        const [gOff, gOn] = IconWidget.buildIconStyleGroupsForSchema('Icon', 'Active Icon', false);



        const captionTypo = BaseWidget.getWidgetLabelTypographySchema('iconCaption', 'caption');



        return [

            {

                id: 'ic_data', title: 'Data Configuration', icon: 'ph-database',

                fields: [

                    { key: 'active', type: 'checkbox', label: 'Default State (On/Off)', cols: 12 }

                ]

            },

            (typeof DashboardAudio !== 'undefined' && DashboardAudio.schemaGroup)

                ? DashboardAudio.schemaGroup('ic_audio', IconWidget.AUDIO_TRIGGERS)

                : {

                    id: 'ic_audio', title: 'Audio', icon: 'ph-music-notes',

                    fields: [{ key: 'audio', type: 'audio_trigger_map', cols: 12, triggers: IconWidget.AUDIO_TRIGGERS }]

                },

            {

                id: 'ic_icon', title: 'Icon', icon: 'ph-star',

                fields: [gOff, gOn]

            },

            {

                id: 'ic_style', title: 'Appearance', icon: 'ph-palette',

                fields: [

                    { key: 'size', type: 'number', label: 'Icon Size', cols: 12, defaultKey: 'defaultIconSize' },

                    { key: 'blink', type: 'checkbox', label: 'Blink on Active', cols: 4, defaultKey: 'defaultIconBlink' },

                    { key: 'animSpeed', type: 'number', label: 'Blink Speed (s)', cols: 4, step: 0.1, defaultKey: 'defaultIconAnimSpeed' },

                    { key: 'glowOnActive', type: 'checkbox', label: 'Glow on Active', cols: 4, defaultKey: 'defaultIconGlowOnActive' },

                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }

                ]

            },

            {

                id: 'ic_typo', title: 'Text & Typography', icon: 'ph-text-t',

                fields: [

                    { key: 'label', type: 'text', label: 'Widget Label', cols: 12 },

                    captionTypo

                ]

            }

        ];

    }



    _buildBaseDOM() {

        const b = super._buildBaseDOM();

        b.innerContent.style.display = 'flex';

        b.innerContent.style.flexDirection = 'column';

        b.innerContent.style.alignItems = 'center';

        b.innerContent.style.justifyContent = 'center';



        const lbl = document.createElement('div');

        lbl.className = 'widget-label';

        lbl.style.width = '100%';

        lbl.style.marginBottom = '8px';

        lbl.style.letterSpacing = '1px';

        lbl.style.flexShrink = '0';

        b.innerContent.appendChild(lbl);

        this.lblEl = lbl;



        const iconWrap = document.createElement('div');

        iconWrap.className = 'icn-wrap';

        iconWrap.style.flex = '1';

        iconWrap.style.display = 'flex';

        iconWrap.style.alignItems = 'center';

        iconWrap.style.justifyContent = 'center';

        iconWrap.style.transition = 'color 0.3s';

        b.innerContent.appendChild(iconWrap);

        this.iconWrap = iconWrap;



        if (!document.getElementById('style-blink')) {

            const s = document.createElement('style');

            s.id = 'style-blink';

            s.innerHTML = '@keyframes blnk {50%{opacity:0.3}} .blnk{animation:blnk 1s linear infinite;}';

            document.head.appendChild(s);

        }



        return b;

    }



    _renderSpecific() {

        const c = this.config;



        if (typeof DashboardAudio !== 'undefined') {

            if (!this._audioActiveStore) this._audioActiveStore = {};

            const audio = c.audio;

            DashboardAudio.observeEdge(

                this._audioActiveStore,

                !!c.active,

                function () { DashboardAudio.playFrom(audio, 'activated'); },

                function () { DashboardAudio.playFrom(audio, 'deactivated'); }

            );

        }



        this.lblEl.textContent = c.label;

        this.lblEl.style.display = c.label ? 'block' : 'none';

        this.applyTypographyToElement(this.lblEl, 'iconCaption', c, {});



        const iconKm = c.active ? IconWidget.ICON_KEYMAP_ON : IconWidget.ICON_KEYMAP_OFF;

        const iconCol = BaseWidget.resolveCssColor(c.active ? c.iconSlotColOn : c.iconSlotColOff);

        BaseWidget.applyIconStyleToElement(this.iconWrap, c, iconKm, { color: iconCol });



        this.iconWrap.style.fontSize = `${c.size}px`;

        this.iconWrap.style.width = `${c.size}px`;

        this.iconWrap.style.height = `${c.size}px`;

        this.iconWrap.style.filter = (c.active && c.glowOnActive) ? `drop-shadow(0 0 10px ${iconCol})` : 'none';

        this.iconWrap.style.animationDuration = `${c.animSpeed}s`;

        this.iconWrap.classList.toggle('blnk', !!(c.active && c.blink));

        if (c.deactivated) {
            const accentColor = BaseWidget.getDeactivatedColorAccent(c);
            if (c.label) {
                this.lblEl.style.display = 'block';
                this.lblEl.style.color = accentColor;
            } else {
                this.lblEl.style.display = 'none';
            }
            BaseWidget.applyIconStyleToElement(this.iconWrap, c, iconKm, { color: accentColor });
            this.iconWrap.style.filter = 'none';
            this.iconWrap.classList.remove('blnk');
        }

    }

}



WidgetRegistry.register('icon', IconWidget);

