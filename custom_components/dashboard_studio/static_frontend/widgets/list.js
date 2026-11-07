class ListWidget extends BaseWidget {
    static get metadata() {
        return { label: "List / Log", shortName: "List", icon: "ph-list-dashes", category: "Text", color_dark: "hsl(280, 80%, 65%)", color_light: "hsl(280, 85%, 35%)", version: "2.3.5", date: "2026-11-07" };
    }

    static get LIST_ICON_SLOT_NAMES() {
        return ['row', 'checkboxOn', 'checkboxOff'];
    }

    /** Checkbox Off inherits On for source/weight/url/tint/size — not `builtin` (legacy default `ph-square` vs On `ph-check-square`). */
    static get LIST_CHECKBOX_OFF_ICON_INHERIT_KEYS() {
        return ['source', 'weight', 'customUrl', 'tintImage', 'size'];
    }

    static get ICON_OFF_INHERIT_KEYS() {
        return ListWidget.LIST_CHECKBOX_OFF_ICON_INHERIT_KEYS;
    }

    static get INHERIT_EDITOR_ICON_SLOTS() {
        return {
            leaderSlot: 'checkboxOn',
            followerSlot: 'checkboxOff',
            inheritKeys: ListWidget.LIST_CHECKBOX_OFF_ICON_INHERIT_KEYS,
            followerKeymap: ListWidget.ICON_KEYMAP_CHECKBOX_OFF
        };
    }

    static get ICON_KEYMAP_ROW() {
        return {
            source: 'iconSourceRow',
            builtin: 'iconRow',
            weight: 'iconWeightRow',
            customUrl: 'imgRow',
            tintImage: 'colorizeRow',
            color: 'iconSlotColRow',
            size: 'iconSizeRow'
        };
    }

    static get ICON_KEYMAP_CHECKBOX_ON() {
        return {
            source: 'iconSourceCheckboxOn',
            builtin: 'iconCheckboxOn',
            weight: 'iconWeightCheckboxOn',
            customUrl: 'imgCheckboxOn',
            tintImage: 'colorizeCheckboxOn',
            color: 'iconSlotColCheckboxOn',
            size: 'iconSizeCheckboxOn'
        };
    }

    static get ICON_KEYMAP_CHECKBOX_OFF() {
        return {
            source: 'iconSourceCheckboxOff',
            builtin: 'iconCheckboxOff',
            weight: 'iconWeightCheckboxOff',
            customUrl: 'imgCheckboxOff',
            tintImage: 'colorizeCheckboxOff',
            color: 'iconSlotColCheckboxOff',
            size: 'iconSizeCheckboxOff'
        };
    }

    /** Editor reset / flat-key cleanup for a nested `icons` slot (switch uses on/off only). */
    static resolveIconKeymapForEditorSlot(slot) {
        if (slot === 'row') return ListWidget.ICON_KEYMAP_ROW;
        if (slot === 'checkboxOn') return ListWidget.ICON_KEYMAP_CHECKBOX_ON;
        if (slot === 'checkboxOff') return ListWidget.ICON_KEYMAP_CHECKBOX_OFF;
        return null;
    }

    static defaultIconSlot() {
        return typeof MenuWidget !== 'undefined'
            ? MenuWidget.defaultIconSlot()
            : { source: 'phosphor', builtin: '', weight: 'fill', customUrl: '', tintImage: false };
    }

    static masterListIconSize(M) {
        if (M && M.defaultListIconSize != null && M.defaultListIconSize !== '') {
            const n = Number(M.defaultListIconSize);
            if (Number.isFinite(n)) return n;
        }
        return 20;
    }

    static defaultListRowIconSlotFromMaster(M) {
        const base = ListWidget.defaultIconSlot();
        const slot = { ...base, weight: 'regular' };
        slot.size = ListWidget.masterListIconSize(M);
        if (M && M.defaultListIconColor != null && String(M.defaultListIconColor).trim() !== '') {
            slot.color = M.defaultListIconColor;
        }
        return slot;
    }

    static defaultListCheckboxOnIconSlotFromMaster(M) {
        return {
            source: 'phosphor',
            builtin: 'ph-check-square',
            weight: 'regular',
            customUrl: '',
            tintImage: false,
            size: ListWidget.masterListIconSize(M),
            color: (M && M.defaultListIconColor) ? M.defaultListIconColor : BaseWidget.themeTokenRef('icon')
        };
    }

    static defaultListCheckboxOffIconSlotFromMaster(M) {
        return {
            source: 'phosphor',
            builtin: 'ph-square',
            weight: 'regular',
            customUrl: '',
            tintImage: false,
            size: ListWidget.masterListIconSize(M),
            color: (M && M.defaultListTextColor) ? M.defaultListTextColor : '@onSurface'
        };
    }

    /** Effective checkbox Off slot: factory defaults, then sparse overrides, then inherit from On where configured. */
    static resolveListCheckboxOffSlot(cbOn, cbOffStored, M) {
        const cbOffDef = ListWidget.defaultListCheckboxOffIconSlotFromMaster(M);
        const inherited = BaseWidget.resolveIconFollowerSlotFromLeader(
            cbOn,
            cbOffStored,
            ListWidget.LIST_CHECKBOX_OFF_ICON_INHERIT_KEYS
        );
        return { ...cbOffDef, ...inherited };
    }

    static normalizePhosphorBuiltin(raw) {
        const s = String(raw || '').trim();
        if (!s) return '';
        if (s.startsWith('ph-')) return s;
        if (s.startsWith('ph ')) return s.slice(3).trim();
        return s;
    }

    static attachListIconStyleNested(group, slotName) {
        if (!group || !Array.isArray(group.fields)) return;
        const maps = {
            row: {
                iconSourceRow: 'source',
                iconRow: 'builtin',
                iconWeightRow: 'weight',
                imgRow: 'customUrl',
                colorizeRow: 'tintImage',
                iconSlotColRow: 'color',
                iconSizeRow: 'size'
            },
            checkboxOn: {
                iconSourceCheckboxOn: 'source',
                iconCheckboxOn: 'builtin',
                iconWeightCheckboxOn: 'weight',
                imgCheckboxOn: 'customUrl',
                colorizeCheckboxOn: 'tintImage',
                iconSlotColCheckboxOn: 'color',
                iconSizeCheckboxOn: 'size'
            },
            checkboxOff: {
                iconSourceCheckboxOff: 'source',
                iconCheckboxOff: 'builtin',
                iconWeightCheckboxOff: 'weight',
                imgCheckboxOff: 'customUrl',
                colorizeCheckboxOff: 'tintImage',
                iconSlotColCheckboxOff: 'color',
                iconSizeCheckboxOff: 'size'
            }
        };
        const map = maps[slotName];
        if (!map) return;
        group.fields.forEach((field) => {
            const prop = map[field.key];
            if (prop) field.iconsNested = { root: 'icons', slot: slotName, prop };
        });
    }

    static attachListFieldVisibleWhen(field, predicate, dependsOnKeys) {
        if (!field || typeof field !== 'object') return;
        const prevVisibleWhen = field.visibleWhen;
        field.visibleWhen = function (values, isGlobal) {
            if (typeof prevVisibleWhen === 'function' && !prevVisibleWhen(values, isGlobal)) return false;
            return predicate(values, isGlobal);
        };
        if (dependsOnKeys && dependsOnKeys.length) field.dependsOn = dependsOnKeys;
    }

    static showRowIconFields(values) {
        return values.showIcons !== false;
    }

    static showTimestampFields(values) {
        return values.showTimestamp !== false;
    }

    static showCheckboxFields(values) {
        return values.enableCheckboxes === true;
    }

    /** Inherit via omitted keys only — do not delete follower keys that match the leader (explicit overrides). */
    static pruneListCheckboxOffIconInheritKeys(_follower, _leader) {
        return false;
    }

    /**
     * Idempotent heal: lift stray flat icon keys → nested slots; fix Off glyph wrongly copied from On (`ph-check-square`).
     */
    static healListIconOverrides(o) {
        if (!o || typeof o !== 'object') return false;
        let changed = false;
        if (!o.icons || typeof o.icons !== 'object') o.icons = {};

        const lift = (flatKey, slot, prop, transform) => {
            if (!Object.prototype.hasOwnProperty.call(o, flatKey)) return;
            if (!o.icons[slot] || typeof o.icons[slot] !== 'object') o.icons[slot] = {};
            if (!Object.prototype.hasOwnProperty.call(o.icons[slot], prop)) {
                let v = o[flatKey];
                if (typeof transform === 'function') v = transform(v);
                o.icons[slot][prop] = v;
                changed = true;
            }
            delete o[flatKey];
            changed = true;
        };

        lift('iconSourceRow', 'row', 'source');
        lift('iconRow', 'row', 'builtin', ListWidget.normalizePhosphorBuiltin);
        lift('iconWeightRow', 'row', 'weight');
        lift('imgRow', 'row', 'customUrl');
        lift('colorizeRow', 'row', 'tintImage', (v) => v === true);
        lift('iconSlotColRow', 'row', 'color');
        lift('iconSizeRow', 'row', 'size', (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : v;
        });

        lift('iconSourceCheckboxOn', 'checkboxOn', 'source');
        lift('iconCheckboxOn', 'checkboxOn', 'builtin', ListWidget.normalizePhosphorBuiltin);
        lift('iconWeightCheckboxOn', 'checkboxOn', 'weight');
        lift('imgCheckboxOn', 'checkboxOn', 'customUrl');
        lift('colorizeCheckboxOn', 'checkboxOn', 'tintImage', (v) => v === true);
        lift('iconSlotColCheckboxOn', 'checkboxOn', 'color');
        lift('iconSizeCheckboxOn', 'checkboxOn', 'size', (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : v;
        });

        lift('iconSourceCheckboxOff', 'checkboxOff', 'source');
        lift('iconCheckboxOff', 'checkboxOff', 'builtin', ListWidget.normalizePhosphorBuiltin);
        lift('iconWeightCheckboxOff', 'checkboxOff', 'weight');
        lift('imgCheckboxOff', 'checkboxOff', 'customUrl');
        lift('colorizeCheckboxOff', 'checkboxOff', 'tintImage', (v) => v === true);
        lift('iconSlotColCheckboxOff', 'checkboxOff', 'color');
        lift('iconSizeCheckboxOff', 'checkboxOff', 'size', (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : v;
        });

        const onSlot = o.icons.checkboxOn && typeof o.icons.checkboxOn === 'object' ? o.icons.checkboxOn : {};
        const offSlot = o.icons.checkboxOff && typeof o.icons.checkboxOff === 'object' ? o.icons.checkboxOff : {};
        const onB = ListWidget.normalizePhosphorBuiltin(onSlot.builtin);
        const offB = ListWidget.normalizePhosphorBuiltin(offSlot.builtin);
        if (onB === 'ph-check-square' && offB === 'ph-check-square') {
            o.icons.checkboxOff = { ...offSlot, builtin: 'ph-square', source: offSlot.source || 'phosphor' };
            changed = true;
        } else if (!offB && onB === 'ph-check-square') {
            o.icons.checkboxOff = { ...offSlot, builtin: 'ph-square', source: offSlot.source || 'phosphor' };
            changed = true;
        }

        if (o.icons.checkboxOff && typeof o.icons.checkboxOff === 'object') {
            const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
            const leader = { ...ListWidget.defaultListCheckboxOnIconSlotFromMaster(M), ...onSlot };
            if (ListWidget.pruneListCheckboxOffIconInheritKeys(o.icons.checkboxOff, leader)) changed = true;
        }

        return changed;
    }

    static buildIconsNestedEditorPatch(widgetType, icnIgnored, iconsPatch, effectiveLeaderOn) {
        if (widgetType !== 'list' || !iconsPatch || typeof iconsPatch !== 'object') {
            return { icons: iconsPatch };
        }
        const out = {};
        ListWidget.LIST_ICON_SLOT_NAMES.forEach((slotName) => {
            const src = iconsPatch[slotName];
            if (src && typeof src === 'object') {
                out[slotName] = { ...src };
            }
        });
        const leader = (effectiveLeaderOn && typeof effectiveLeaderOn === 'object')
            ? effectiveLeaderOn
            : (out.checkboxOn || {});
        if (out.checkboxOff) {
            BaseWidget.stripIconFollowerInheritPlaceholders(out.checkboxOff, ListWidget.LIST_CHECKBOX_OFF_ICON_INHERIT_KEYS);
            ListWidget.pruneListCheckboxOffIconInheritKeys(out.checkboxOff, leader);
            if (Object.keys(out.checkboxOff).length === 0) delete out.checkboxOff;
        }
        return { icons: out };
    }

    static ensureListIcons(o) {
        if (!o || typeof o !== 'object') return;
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        if (!o.icons || typeof o.icons !== 'object') o.icons = {};

        const rowDef = ListWidget.defaultListRowIconSlotFromMaster(M);
        if (!o.icons.row || typeof o.icons.row !== 'object') o.icons.row = { ...rowDef };
        else o.icons.row = { ...rowDef, ...o.icons.row };

        const cbOnDef = ListWidget.defaultListCheckboxOnIconSlotFromMaster(M);
        if (!o.icons.checkboxOn || typeof o.icons.checkboxOn !== 'object') o.icons.checkboxOn = { ...cbOnDef };
        else o.icons.checkboxOn = { ...cbOnDef, ...o.icons.checkboxOn };

        const prevOff = (!o.icons.checkboxOff || typeof o.icons.checkboxOff !== 'object') ? {} : o.icons.checkboxOff;
        o.icons.checkboxOff = {};
        Object.keys(prevOff).forEach((k) => { o.icons.checkboxOff[k] = prevOff[k]; });
        BaseWidget.stripIconFollowerInheritPlaceholders(o.icons.checkboxOff, ListWidget.LIST_CHECKBOX_OFF_ICON_INHERIT_KEYS);
        ListWidget.pruneListCheckboxOffIconInheritKeys(o.icons.checkboxOff, o.icons.checkboxOn);
    }

    static expandListIconsToFlat(o) {
        let iconsCopy;
        try {
            iconsCopy = JSON.parse(JSON.stringify(o.icons || {}));
        } catch (e) {
            iconsCopy = { ...(o.icons || {}) };
        }
        const env = { icons: iconsCopy };
        ListWidget.ensureListIcons(env);
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const nz = (v) => v !== undefined && v !== null && String(v).trim() !== '';
        const row = env.icons.row;
        const cbOn = env.icons.checkboxOn;
        const cbOffStored = env.icons.checkboxOff;
        const cbOffEff = ListWidget.resolveListCheckboxOffSlot(cbOn, cbOffStored, M);
        const sizeFb = ListWidget.masterListIconSize(M);
        const sizeNum = (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : sizeFb;
        };

        const rowColFb = M.defaultListIconColor || BaseWidget.themeTokenRef('icon');
        const cbOnColFb = M.defaultListIconColor || BaseWidget.themeTokenRef('icon');
        const cbOffColFb = M.defaultListTextColor || '@onSurface';

        const wRow = (row && row.weight != null && String(row.weight).trim() !== '')
            ? String(row.weight).toLowerCase().trim() : 'regular';
        const wCbOn = (cbOn && cbOn.weight != null && String(cbOn.weight).trim() !== '')
            ? String(cbOn.weight).toLowerCase().trim() : 'regular';
        const wCbOff = (cbOffEff && cbOffEff.weight != null && String(cbOffEff.weight).trim() !== '')
            ? String(cbOffEff.weight).toLowerCase().trim() : 'regular';

        const flat = {
            iconSourceRow: row.source,
            iconRow: row.builtin,
            iconWeightRow: wRow,
            imgRow: row.customUrl,
            colorizeRow: row.tintImage === true,
            iconSlotColRow: (Object.prototype.hasOwnProperty.call(row, 'color') && nz(row.color)) ? row.color : rowColFb,
            iconSizeRow: sizeNum(row.size),

            iconSourceCheckboxOn: cbOn.source,
            iconCheckboxOn: cbOn.builtin,
            iconWeightCheckboxOn: wCbOn,
            imgCheckboxOn: cbOn.customUrl,
            colorizeCheckboxOn: cbOn.tintImage === true,
            iconSlotColCheckboxOn: (Object.prototype.hasOwnProperty.call(cbOn, 'color') && nz(cbOn.color)) ? cbOn.color : cbOnColFb,
            iconSizeCheckboxOn: sizeNum(cbOn.size),

            iconSourceCheckboxOff: cbOffEff.source,
            iconCheckboxOff: cbOffEff.builtin,
            iconWeightCheckboxOff: wCbOff,
            imgCheckboxOff: cbOffEff.customUrl,
            colorizeCheckboxOff: cbOffEff.tintImage === true,
            iconSlotColCheckboxOff: (cbOffStored && Object.prototype.hasOwnProperty.call(cbOffStored, 'color') && nz(cbOffStored.color))
                ? cbOffStored.color : cbOffColFb,
            iconSizeCheckboxOff: sizeNum(cbOffEff.size)
        };

        Object.assign(flat, BaseWidget.flattenIconSlotTransformFlat(row, ListWidget.ICON_KEYMAP_ROW));
        Object.assign(flat, BaseWidget.flattenIconSlotTransformFlat(cbOn, ListWidget.ICON_KEYMAP_CHECKBOX_ON));
        Object.assign(flat, BaseWidget.flattenIconSlotTransformFlat(cbOffEff, ListWidget.ICON_KEYMAP_CHECKBOX_OFF));
        return flat;
    }

    static applyIconsNestedToConfig(c) {
        const flat = ListWidget.expandListIconsToFlat(c);
        Object.keys(flat).forEach((k) => { c[k] = flat[k]; });
    }

    static applyTypographyNestedToConfig(c) {
        BaseWidget.applyTypographyNestedToConfig(c, [
            ['listItem', 'listItem'],
            ['listTimestamp', 'listTimestamp'],
            ['listLabel', 'listLabel']
        ]);
    }

    static getNestedBindingOverlaySpec() {
        const spec = BaseWidget.buildTypographyBindingOverlaySpec([
            ['listItem', 'listItem'],
            ['listTimestamp', 'listTimestamp'],
            ['listLabel', 'listLabel']
        ]);
        const iconSlots = [
            ['row', ListWidget.ICON_KEYMAP_ROW],
            ['checkboxOn', ListWidget.ICON_KEYMAP_CHECKBOX_ON],
            ['checkboxOff', ListWidget.ICON_KEYMAP_CHECKBOX_OFF]
        ];
        iconSlots.forEach(([slotName, km]) => {
            Object.keys(km).forEach((logical) => {
                const prop = logical === 'color' ? 'color' : (logical === 'size' ? 'size' : logical);
                if (['source', 'builtin', 'weight', 'customUrl', 'tintImage', 'color', 'size', 'offsetX', 'offsetY', 'rotation'].indexOf(prop) >= 0) {
                    spec.push({ path: ['icons', slotName, prop], configKey: km[logical] });
                }
            });
        });
        return spec;
    }

    static extractPreloadImageUrls(o) {
        if (!o || typeof o !== 'object') return [];
        ListWidget.ensureListIcons(o);
        const out = [];
        ['row', 'checkboxOn', 'checkboxOff'].forEach((slotName) => {
            const slot = o.icons[slotName];
            if (!slot || slot.source !== 'custom') return;
            const u = String(slot.customUrl || '').trim();
            if (u) out.push(u);
        });
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const cbOffEff = ListWidget.resolveListCheckboxOffSlot(o.icons.checkboxOn, o.icons.checkboxOff, M);
        if (cbOffEff && cbOffEff.source === 'custom') {
            const u = String(cbOffEff.customUrl || '').trim();
            if (u && out.indexOf(u) < 0) out.push(u);
        }
        return out;
    }

    // --- Global Configuration Injection ---
    static get globalSettings() {
        return {
            defaultListShowIcons: true,
            defaultListShowTimestamp: false,
            defaultListMaxLines: 10,
            defaultListRawMode: false,

            defaultListIconSize: 20,
            defaultListIconColor: BaseWidget.themeTokenRef('icon'),
            defaultListIconGap: 12,

            defaultListTextColor: "@onSurface",
            defaultListFontSize: 14,
            defaultListGap: 4,
            defaultListTextWrap: false,
            defaultListLineHeight: 1.5,
            defaultListCase: "none",
            defaultListFont: "'Inter', sans-serif",
            defaultListFontBold: false,

            defaultListTimeSize: 12,
            defaultListTimeColor: BaseWidget.themeTokenRef('warning'),
            defaultListTimeFormat: "HH:mm",
            defaultListTime24h: true,
            defaultListDateFormat: "none"
        };
    }

    // --- Global Editor Schema ---
    static get basicSettingKeys() {
        return [
            'data', 'maxLines', 'outputTopic', 'triggerTopic',
            'iconRow', 'iconCheckboxOn', 'iconCheckboxOff'
        ];
    }

    static get globalSchema() {
        const listItemTypoMaster = BaseWidget.getTypographySchema('defaultListItem', 'List Item', {
            exclude: ['align', 'offset', 'italic', 'opacity', 'colorOff'],
            fontDefaultKey: 'fontFamily',
            fontSizeDefaultKey: 'defaultListFontSize',
            colorDefaultKey: 'defaultListTextColor',
            boldDefaultKey: 'defaultListFontBold',
            caseDefaultKey: 'defaultListCase',
            caseLabel: 'Text Case',
            caseOptions: [
                { value: 'none', text: 'Normal' },
                { value: 'first', text: 'First Cap' },
                { value: 'capitalize', text: 'Title Case' },
                { value: 'uppercase', text: 'UPPERCASE' },
                { value: 'lowercase', text: 'lowercase' }
            ],
            extraFieldsInsert: 'afterColor',
            extraFields: [
                { key: 'defaultListLineHeight', type: 'number', step: 0.1, label: 'Line Height', cols: 6 },
                { key: 'defaultListTextWrap', type: 'checkbox', label: 'Wrap Text', cols: 6 }
            ]
        });
        const listTimestampTypoMaster = BaseWidget.getTypographySchema('defaultListTimestamp', 'Timestamp', {
            exclude: ['colorOff', 'offset'],
            fontDefaultKey: 'defaultListFont',
            fontSizeDefaultKey: 'defaultListTimeSize',
            colorDefaultKey: 'defaultListTimeColor',
            boldDefaultKey: 'defaultListFontBold',
            caseDefaultKey: 'defaultListCase',
            caseLabel: 'Text Case',
            caseOptions: [
                { value: 'none', text: 'Normal' },
                { value: 'first', text: 'First Cap' },
                { value: 'capitalize', text: 'Title Case' },
                { value: 'uppercase', text: 'UPPERCASE' },
                { value: 'lowercase', text: 'lowercase' }
            ]
        });
        const listLabelTypoMaster = BaseWidget.getTypographySchema('defaultListLabel', 'Widget Label', {
            exclude: ['italic', 'opacity', 'colorOff', 'offset'],
            fontDefaultKey: 'fontFamily',
            fontSizeDefaultKey: 'defaultFsLabel',
            colorDefaultKey: 'defaultColLabel',
            alignDefaultKey: 'defaultTextAlign',
            caseDefaultKey: 'defaultLabelCase',
            boldDefaultKey: 'defaultLabelBold'
        });

        return [
            { type: 'heading', label: 'Data & Behavior', cols: 12 },
            { key: 'defaultListRawMode', type: 'checkbox', label: 'Raw Data', cols: 6 },
            { key: 'defaultListMaxLines', type: 'number', label: 'Max Lines', cols: 6 },

            { type: 'heading', label: 'Appearance', cols: 12 },
            { key: 'defaultListGap', type: 'number', label: 'Item Spacing', cols: 12 },
            { key: 'defaultListShowIcons', type: 'checkbox', label: 'Show Icons', cols: 4 },
            { key: 'defaultListShowTimestamp', type: 'checkbox', label: 'Show Timestamp', cols: 4 },

            { type: 'heading', label: 'Icon', cols: 12 },
            { key: 'defaultListIconSize', type: 'number', label: 'Icon Size', cols: 4 },
            { key: 'defaultListIconGap', type: 'number', label: 'Icon Gap', cols: 4 },
            { key: 'defaultListIconColor', type: 'color', label: 'Icon Color', cols: 4 },

            { type: 'heading', label: 'Typography', cols: 12 },
            listItemTypoMaster,
            listTimestampTypoMaster,
            listLabelTypoMaster,

            { type: 'heading', label: 'Timestamp Format', cols: 12 },
            {
                key: 'defaultListTimeFormat', type: 'select', label: 'Time Format', options: [
                    { value: 'HH:mm', text: 'Hours:Minutes' },
                    { value: 'HH:mm:ss', text: 'Hours:Minutes:Seconds' },
                    { value: 'none', text: 'None' }
                ], cols: 6
            },
            { key: 'defaultListTime24h', type: 'checkbox', label: '24 Hour Clock', cols: 6 },
            {
                key: 'defaultListDateFormat', type: 'select', label: 'Date Format', options: [
                    { value: 'none', text: 'None' },
                    { value: 'DD-MM', text: 'DD-MM' },
                    { value: 'DD-MM-YYYY', text: 'DD-MM-YYYY' },
                    { value: 'MM-DD', text: 'MM-DD' },
                    { value: 'MM-DD-YYYY', text: 'MM-DD-YYYY' }
                ], cols: 12
            },

        ];
    }

    constructor(cid, id, ov, bn) {
        super(cid, id, ov, bn);
        this.lastRawData = null;
        this._syncBindings();
    }

    update(payload, replace = false) {
        super.update(payload, replace);
        this._syncBindings();
    }

    _syncBindings() {
        const c = this.config;

        if (c.triggerTopic) {
            this.bindings['__trigger'] = c.triggerTopic;
        } else {
            delete this.bindings['__trigger'];
        }

        if (c.selectAllTopic) {
            this.bindings['__select_all'] = c.selectAllTopic;
        } else {
            delete this.bindings['__select_all'];
        }

        if (c.deselectAllTopic) {
            this.bindings['__deselect_all'] = c.deselectAllTopic;
        } else {
            delete this.bindings['__deselect_all'];
        }

        if (c.deleteSelectedTopic) {
            this.bindings['__delete_selected'] = c.deleteSelectedTopic;
        } else {
            delete this.bindings['__delete_selected'];
        }
        this.notifyBindingsMutated();
    }

    static get AUDIO_TRIGGERS() {
        return [
            { key: 'checkboxOn', label: 'On Checkbox On' },
            { key: 'checkboxOff', label: 'On Checkbox Off' }
        ];
    }

    getDefaultOverrides() {
        return {
            data: "",
            timeFormat: "HH:mm",
            dateFormat: "none",
            label: "",

            outputTopic: "",
            triggerTopic: "",
            outputMode: "on_trigger",
            outputFormat: "json_array",
            selectAllTopic: "",
            deselectAllTopic: "",
            deleteSelectedTopic: "",

            enableCheckboxes: false,
            checkboxAlignment: "left",
            readOnly: false,
            strikethroughChecked: false,

            audio: (typeof DashboardAudio !== 'undefined' && DashboardAudio.defaultAudio)
                ? DashboardAudio.defaultAudio(ListWidget.AUDIO_TRIGGERS)
                : { checkboxOn: '', checkboxOff: '' },

            typography: { listItem: {}, listTimestamp: {}, listLabel: {} },
            icons: { row: {}, checkboxOn: {}, checkboxOff: {} }
        };
    }

    get config() {
        const c = super.config;
        ListWidget.applyTypographyNestedToConfig(c);
        ListWidget.applyIconsNestedToConfig(c);
        BaseWidget.applyNestedBindingOverlay(this, c, ListWidget.getNestedBindingOverlaySpec());

        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const getNum = (val, def) => (val !== null && val !== undefined && val !== "") ? val : def;

        const out = {
            ...c,
            showIcons: c.showIcons !== undefined && c.showIcons !== null ? c.showIcons : c.defaultListShowIcons,
            showTimestamp: c.showTimestamp !== undefined && c.showTimestamp !== null ? c.showTimestamp : c.defaultListShowTimestamp,
            rawMode: c.rawMode !== undefined && c.rawMode !== null ? c.rawMode : c.defaultListRawMode,
            maxLines: c.maxLines !== undefined && c.maxLines !== null ? c.maxLines : c.defaultListMaxLines,
            lineGap: c.lineGap !== undefined && c.lineGap !== null ? c.lineGap : c.defaultListGap,
            iconGap: c.iconGap !== undefined && c.iconGap !== null ? c.iconGap : c.defaultListIconGap,

            listItemFont: c.listItemFont || c.defaultListItemFont || c.defaultListFont || c.globalFontFamily || "'Inter', sans-serif",
            listItemBold: c.listItemBold !== undefined && c.listItemBold !== null
                ? c.listItemBold
                : (c.defaultListItemBold !== undefined && c.defaultListItemBold !== null
                    ? c.defaultListItemBold
                    : (c.defaultListFontBold || false)),
            listItemFs: c.listItemFs !== undefined && c.listItemFs !== null
                ? c.listItemFs
                : (c.defaultListItemFs !== undefined && c.defaultListItemFs !== null
                    ? c.defaultListItemFs
                    : c.defaultListFontSize),
            listItemCol: c.listItemCol || c.defaultListItemCol || c.defaultListTextColor,
            listItemCase: c.listItemCase || c.defaultListItemCase || c.defaultListCase || 'none',
            lineHeight: c.lineHeight !== undefined && c.lineHeight !== null ? c.lineHeight : (c.defaultListLineHeight || 1.5),
            textWrap: c.textWrap !== undefined && c.textWrap !== null ? c.textWrap : c.defaultListTextWrap,

            listTimestampFont: c.listTimestampFont || c.defaultListTimestampFont || c.defaultListFont || c.globalFontFamily || "'Inter', sans-serif",
            listTimestampFs: c.listTimestampFs !== undefined && c.listTimestampFs !== null
                ? c.listTimestampFs
                : (c.defaultListTimestampFs !== undefined && c.defaultListTimestampFs !== null
                    ? c.defaultListTimestampFs
                    : c.defaultListTimeSize),
            listTimestampCol: c.listTimestampCol || c.defaultListTimestampCol || c.defaultListTimeColor || BaseWidget.themeTokenRef('warning'),
            listTimestampBold: c.listTimestampBold !== undefined && c.listTimestampBold !== null
                ? c.listTimestampBold
                : (c.defaultListTimestampBold !== undefined && c.defaultListTimestampBold !== null
                    ? c.defaultListTimestampBold
                    : (c.defaultListFontBold || false)),
            listTimestampCase: c.listTimestampCase || c.defaultListTimestampCase || c.defaultListCase || 'none',
            timeFormat: c.timeFormat || c.defaultListTimeFormat || "HH:mm",
            time24h: c.time24h !== undefined && c.time24h !== null ? c.time24h : (c.defaultListTime24h !== undefined ? c.defaultListTime24h : true),
            dateFormat: c.dateFormat || c.defaultListDateFormat || "none",

            iconSizeRow: getNum(c.iconSizeRow, c.defaultListIconSize),

            iconSizeCheckboxOn: getNum(c.iconSizeCheckboxOn, c.defaultListIconSize),
            iconSizeCheckboxOff: getNum(c.iconSizeCheckboxOff, c.defaultListIconSize),

            outputTopic: c.outputTopic || "",
            triggerTopic: c.triggerTopic || "",
            outputMode: c.outputMode || "on_trigger",
            outputFormat: c.outputFormat || "json_array",
            selectAllTopic: c.selectAllTopic || "",
            deselectAllTopic: c.deselectAllTopic || "",
            deleteSelectedTopic: c.deleteSelectedTopic || "",

            enableCheckboxes: c.enableCheckboxes !== undefined && c.enableCheckboxes !== null ? c.enableCheckboxes : false,
            checkboxAlignment: c.checkboxAlignment || "left",
            readOnly: c.readOnly !== undefined && c.readOnly !== null ? c.readOnly : false,
            strikethroughChecked: c.strikethroughChecked !== undefined && c.strikethroughChecked !== null ? c.strikethroughChecked : false,

            label: c.label || "",
            listLabelFont: c.listLabelFont || c.defaultListLabelFont || c.listItemFont || "'Inter', sans-serif",
            listLabelFs: c.listLabelFs !== undefined && c.listLabelFs !== null
                ? c.listLabelFs
                : (c.defaultListLabelFs !== undefined && c.defaultListLabelFs !== null
                    ? c.defaultListLabelFs
                    : (c.defaultFsLabel || 12)),
            listLabelCol: c.listLabelCol || c.defaultListLabelCol || c.defaultColLabel || "@textMuted",
            listLabelAlign: c.listLabelAlign || c.defaultListLabelAlign || c.defaultTextAlign || "center",
            listLabelOffX: c.listLabelOffX !== undefined && c.listLabelOffX !== null ? c.listLabelOffX : 0,
            listLabelOffY: c.listLabelOffY !== undefined && c.listLabelOffY !== null ? c.listLabelOffY : 0,
            listLabelCase: c.listLabelCase || c.defaultListLabelCase || c.defaultLabelCase || 'uppercase',
            listLabelBold: c.listLabelBold !== undefined && c.listLabelBold !== null
                ? c.listLabelBold
                : (c.defaultListLabelBold !== undefined && c.defaultListLabelBold !== null
                    ? c.defaultListLabelBold
                    : (c.defaultLabelBold || false))
        };

        delete out.typography;
        delete out.icons;
        return out;
    }

    getSchema() {
        const listItemTypo = BaseWidget.getTypographySchema('listItem', 'List Item', {
            exclude: ['align', 'offset', 'italic', 'opacity', 'colorOff'],
            nestedTypography: { root: 'typography', role: 'listItem' },
            fontDefaultKey: 'defaultListFont',
            fontSizeDefaultKey: 'defaultListFontSize',
            colorDefaultKey: 'defaultListTextColor',
            boldDefaultKey: 'defaultListFontBold',
            caseDefaultKey: 'defaultListCase',
            caseLabel: 'Text Case',
            caseOptions: [
                { value: 'none', text: 'Normal' },
                { value: 'first', text: 'First Cap' },
                { value: 'capitalize', text: 'Title Case' },
                { value: 'uppercase', text: 'UPPERCASE' },
                { value: 'lowercase', text: 'lowercase' }
            ],
            extraFieldsInsert: 'afterColor',
            extraFields: [
                {
                    key: 'lineHeight', type: 'number', step: 0.1, label: 'Line Height', cols: 6,
                    defaultKey: 'defaultListLineHeight'
                },
                {
                    key: 'textWrap', type: 'checkbox', label: 'Wrap Text', cols: 6,
                    defaultKey: 'defaultListTextWrap'
                }
            ]
        });
        const listTimestampTypo = BaseWidget.getTypographySchema('listTimestamp', 'Timestamp', {
            exclude: ['colorOff', 'offset'],
            nestedTypography: { root: 'typography', role: 'listTimestamp' },
            fontDefaultKey: 'defaultListFont',
            fontSizeDefaultKey: 'defaultListTimeSize',
            colorDefaultKey: 'defaultListTimeColor',
            boldDefaultKey: 'defaultListFontBold',
            caseDefaultKey: 'defaultListCase'
        });
        const listLabelTypo = BaseWidget.getTypographySchema('listLabel', 'Widget Label', {
            exclude: ['italic', 'opacity', 'colorOff'],
            nestedTypography: { root: 'typography', role: 'listLabel' },
            fontDefaultKeyFallback: 'listItemFont',
            fontSizeDefaultKey: 'defaultFsLabel',
            colorDefaultKey: 'defaultColLabel',
            alignDefaultKey: 'defaultTextAlign',
            caseDefaultKey: 'defaultLabelCase',
            boldDefaultKey: 'defaultLabelBold'
        });

        const timeFormatField = {
            key: 'timeFormat', type: 'select', label: 'Time Format', cols: 6, defaultKey: 'defaultListTimeFormat',
            options: [
                { value: 'HH:mm', text: 'Hours:Minutes' },
                { value: 'HH:mm:ss', text: 'Hours:Minutes:Seconds' },
                { value: 'none', text: 'None' }
            ]
        };
        ListWidget.attachListFieldVisibleWhen(timeFormatField, ListWidget.showTimestampFields, ['showTimestamp']);
        const time24hField = {
            key: 'time24h', type: 'checkbox', label: '24 Hour Clock', cols: 6, defaultKey: 'defaultListTime24h'
        };
        ListWidget.attachListFieldVisibleWhen(time24hField, ListWidget.showTimestampFields, ['showTimestamp']);
        const dateFormatField = {
            key: 'dateFormat', type: 'select', label: 'Date Format', cols: 12, defaultKey: 'defaultListDateFormat',
            options: [
                { value: 'none', text: 'None' },
                { value: 'DD-MM', text: 'DD-MM' },
                { value: 'DD-MM-YYYY', text: 'DD-MM-YYYY' },
                { value: 'MM-DD', text: 'MM-DD' },
                { value: 'MM-DD-YYYY', text: 'MM-DD-YYYY' }
            ]
        };
        ListWidget.attachListFieldVisibleWhen(dateFormatField, ListWidget.showTimestampFields, ['showTimestamp']);

        const iconGapField = {
            key: 'iconGap', type: 'number', label: 'Icon Spacing', cols: 12, defaultKey: 'defaultListIconGap'
        };
        ListWidget.attachListFieldVisibleWhen(iconGapField, ListWidget.showRowIconFields, ['showIcons']);

        const iconFields = (() => {
            const kmRow = { ...ListWidget.ICON_KEYMAP_ROW };
            const kmCbOn = { ...ListWidget.ICON_KEYMAP_CHECKBOX_ON };
            const kmCbOff = { ...ListWidget.ICON_KEYMAP_CHECKBOX_OFF };
            const gRow = BaseWidget.getIconStyleSchema('Default Row Icon', kmRow, {
                headerSuffix: 'Base Icon Style',
                pairWeightAndSize: true
            });
            const gCbOn = BaseWidget.getIconStyleSchema('Icon (On)', kmCbOn, {
                headerSuffix: 'Base Icon Style',
                pairWeightAndSize: true
            });
            const gCbOff = BaseWidget.getIconStyleSchema('Icon (Off)', kmCbOff, {
                exclude: ['hoverColor'],
                pairWeightAndSize: true
            });
            ListWidget.attachListIconStyleNested(gRow, 'row');
            ListWidget.attachListIconStyleNested(gCbOn, 'checkboxOn');
            ListWidget.attachListIconStyleNested(gCbOff, 'checkboxOff');
            ListWidget.attachListFieldVisibleWhen(gRow, ListWidget.showRowIconFields, ['showIcons']);
            ListWidget.attachListFieldVisibleWhen(gCbOn, ListWidget.showCheckboxFields, ['enableCheckboxes']);
            ListWidget.attachListFieldVisibleWhen(gCbOff, ListWidget.showCheckboxFields, ['enableCheckboxes']);
            gRow.fields.forEach((fd) => {
                if (fd.key === 'iconSizeRow') fd.defaultKey = 'defaultListIconSize';
                if (fd.key === 'iconSlotColRow') fd.defaultKey = 'defaultListIconColor';
            });
            gCbOn.fields.forEach((fd) => {
                if (fd.key === 'iconSizeCheckboxOn') fd.defaultKey = 'defaultListIconSize';
                if (fd.key === 'iconSlotColCheckboxOn') fd.defaultKey = 'defaultListIconColor';
            });
            gCbOff.fields.forEach((fd) => {
                if (fd.key === 'iconSizeCheckboxOff') fd.defaultKey = 'defaultListIconSize';
                if (fd.key === 'iconSlotColCheckboxOff') fd.defaultKey = 'defaultListTextColor';
            });
            return [gRow, gCbOn, gCbOff, iconGapField];
        })();

        const selectAllTopic = {
            key: 'selectAllTopic', type: 'topic', label: 'Trigger Topic: Select All', cols: 12
        };
        ListWidget.attachListFieldVisibleWhen(selectAllTopic, ListWidget.showCheckboxFields, ['enableCheckboxes']);
        const deselectAllTopic = {
            key: 'deselectAllTopic', type: 'topic', label: 'Trigger Topic: Deselect All', cols: 12
        };
        ListWidget.attachListFieldVisibleWhen(deselectAllTopic, ListWidget.showCheckboxFields, ['enableCheckboxes']);
        const deleteSelectedTopic = {
            key: 'deleteSelectedTopic', type: 'topic', label: 'Trigger Topic: Delete Selected', cols: 12
        };
        ListWidget.attachListFieldVisibleWhen(deleteSelectedTopic, ListWidget.showCheckboxFields, ['enableCheckboxes']);

        const readOnlyField = { key: 'readOnly', type: 'checkbox', label: 'Read Only', cols: 6 };
        ListWidget.attachListFieldVisibleWhen(readOnlyField, ListWidget.showCheckboxFields, ['enableCheckboxes']);
        const checkboxAlignmentField = {
            key: 'checkboxAlignment', type: 'select', label: 'Checkbox Alignment', cols: 6,
            options: [
                { value: 'left', text: 'Left' },
                { value: 'right', text: 'Right' }
            ]
        };
        ListWidget.attachListFieldVisibleWhen(checkboxAlignmentField, ListWidget.showCheckboxFields, ['enableCheckboxes']);
        const strikethroughField = {
            key: 'strikethroughChecked', type: 'checkbox', label: 'Strikethrough (Checked)', cols: 6
        };
        ListWidget.attachListFieldVisibleWhen(strikethroughField, ListWidget.showCheckboxFields, ['enableCheckboxes']);

        return [
            {
                id: 'list_data', title: 'Data & Behavior', icon: 'ph-database',
                fields: [
                    { key: 'data', type: 'text', label: 'Data (String/JSON)', cols: 12 },
                    { key: 'maxLines', type: 'number', label: 'Max Lines', cols: 6, defaultKey: 'defaultListMaxLines' },
                    { key: 'rawMode', type: 'checkbox', label: 'Raw Data', cols: 6, defaultKey: 'defaultListRawMode' }
                ]
            },
            {
                id: 'list_output', title: 'Output & Trigger', icon: 'ph-lightning',
                fields: [
                    { key: 'outputTopic', type: 'topic', label: 'Output Topic', cols: 12 },
                    { key: 'triggerTopic', type: 'topic', label: 'Trigger Topic', cols: 12 },
                    {
                        key: 'outputMode', type: 'select', label: 'Output Mode', options: [
                            { value: 'on_trigger', text: 'On Trigger Topic Only' },
                            { value: 'immediate', text: 'On Any Change' }
                        ], cols: 6
                    },
                    {
                        key: 'outputFormat', type: 'select', label: 'Output Format', options: [
                            { value: 'json_array', text: 'JSON Array (Objects)' },
                            { value: 'boolean_array', text: 'Boolean Array' }
                        ], cols: 6
                    },
                    selectAllTopic,
                    deselectAllTopic,
                    deleteSelectedTopic
                ]
            },
            (typeof DashboardAudio !== 'undefined' && DashboardAudio.schemaGroup)
                ? DashboardAudio.schemaGroup('list_audio', ListWidget.AUDIO_TRIGGERS)
                : {
                    id: 'list_audio', title: 'Audio', icon: 'ph-music-notes',
                    fields: [{ key: 'audio', type: 'audio_trigger_map', cols: 12, triggers: ListWidget.AUDIO_TRIGGERS }]
                },
            {
                id: 'list_timestamp', title: 'Timestamp Format', icon: 'ph-clock',
                visibleWhen: (values, isGlobal) => !!isGlobal || ListWidget.showTimestampFields(values),
                dependsOn: ['showTimestamp'],
                fields: [
                    timeFormatField,
                    time24hField,
                    dateFormatField
                ]
            },
            {
                id: 'list_appear', title: 'Appearance', icon: 'ph-palette',
                fields: [
                    {
                        key: 'showIcons', type: 'checkbox', label: 'Show Icons', cols: 4,
                        defaultKey: 'defaultListShowIcons', gridColStart: 1
                    },
                    {
                        key: 'showTimestamp', type: 'checkbox', label: 'Show Timestamp', cols: 4,
                        defaultKey: 'defaultListShowTimestamp', gridColStart: 5
                    },
                    {
                        key: 'enableCheckboxes', type: 'checkbox', label: 'Show Checkboxes', cols: 4,
                        gridColStart: 9
                    },
                    { key: 'lineGap', type: 'number', label: 'Item Spacing', cols: 6, defaultKey: 'defaultListGap' },
                    readOnlyField,
                    checkboxAlignmentField,
                    strikethroughField,
                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }
                ]
            },
            {
                id: 'list_icon', title: 'Icon', icon: 'ph-star',
                fields: iconFields
            },
            {
                id: 'list_typo', title: 'Text & Typography', icon: 'ph-text-t',
                fields: [
                    { key: 'label', type: 'text', label: 'Widget Label', cols: 12 },
                    listLabelTypo,
                    listItemTypo,
                    listTimestampTypo
                ]
            }
        ];
    }

    _buildBaseDOM() {
        const b = super._buildBaseDOM();

        if (!this.lineBuffer) this.lineBuffer = [];
        if (!this.checkState) this.checkState = new Map();
        if (this._lastPublishFingerprint === undefined) this._lastPublishFingerprint = null;

        b.container.classList.add('interactive');
        b.innerContent.style.display = 'flex';
        b.innerContent.style.flexDirection = 'column';
        b.innerContent.style.overflow = 'hidden';

        const lbl = document.createElement('div');
        lbl.className = 'widget-label';
        lbl.style.width = '100%';
        lbl.style.marginBottom = '8px';
        lbl.style.flexShrink = '0';
        b.innerContent.appendChild(lbl);
        this.lblEl = lbl;

        const list = document.createElement('div');
        list.className = 'tb-list';
        list.style.width = '100%';
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        b.innerContent.appendChild(list);
        this.listEl = list;

        this.listEl.addEventListener('click', (e) => {
            if (Dashboard.isEditMode) return;
            const c = this.config;
            if (!c.enableCheckboxes || c.readOnly || c.deactivated) return;

            const row = e.target.closest('[data-item-index]');
            if (!row) return;

            const index = parseInt(row.dataset.itemIndex, 10);
            if (isNaN(index)) return;

            const current = this.checkState.get(index) || false;
            const next = !current;
            this.checkState.set(index, next);
            if (typeof DashboardAudio !== 'undefined') {
                DashboardAudio.playFrom(c.audio, next ? 'checkboxOn' : 'checkboxOff');
            }
            this.render();

            if (c.outputMode === 'immediate') {
                this._publishState();
            }
        });

        return b;
    }

    _publishState() {
        const c = this.config;
        const outTopic = c.outputTopic;
        if (!outTopic) return;

        this._lastPublishFingerprint = this.lineBuffer.map(l => l ? (l.timestamp || 0) : 0).join(',');

        let payload;

        if (c.outputFormat === 'boolean_array') {
            payload = this.lineBuffer.map((line, i) => this.checkState.get(i) || false);
        } else {
            payload = this.lineBuffer.reduce((acc, line, i) => {
                if (!line) return acc;
                const item = { checked: this.checkState.get(i) || false, text: line.text };
                if (line.icon) item.icon = line.icon;
                if (line.timestamp) item.timestamp = line.timestamp;
                acc.push(item);
                return acc;
            }, []);
        }

        Dashboard.send(outTopic, JSON.stringify(payload));
    }

    onIncomingData(topic, payload, count) {
        const c = this.config;
        if (Dashboard.isEditMode) return false;

        if (c.triggerTopic && topic === c.triggerTopic) {
            this._publishState();
            return true;
        }

        if (c.selectAllTopic && topic === c.selectAllTopic) {
            this.lineBuffer.forEach((_, i) => this.checkState.set(i, true));
            if (c.outputMode === 'immediate') this._publishState();
            return true;
        }

        if (c.deselectAllTopic && topic === c.deselectAllTopic) {
            this.lineBuffer.forEach((_, i) => this.checkState.set(i, false));
            if (c.outputMode === 'immediate') this._publishState();
            return true;
        }

        if (c.deleteSelectedTopic && topic === c.deleteSelectedTopic) {
            this.lineBuffer = this.lineBuffer.filter((_, i) => !this.checkState.get(i));
            this.checkState.clear();
            this.lineBuffer.forEach((_, i) => this.checkState.set(i, false));
            if (c.outputMode === 'immediate') this._publishState();
            return true;
        }

        return typeof BindingsTree !== 'undefined' && BindingsTree.widgetWantsTopic(this, topic);
    }

    /**
     * Data-only (and list command) ticks update rows via _renderSpecific without a full
     * widget chrome render. Appearance bindings fall through to the dirty-flush path.
     */
    onLiveTopicUpdate(topic, payload, count) {
        if (typeof Dashboard !== 'undefined' && Dashboard.isEditMode) return false;
        const c = this.config;
        if (c.triggerTopic && topic === c.triggerTopic) {
            this._publishState();
            return true;
        }
        const isCommand = (c.selectAllTopic && topic === c.selectAllTopic)
            || (c.deselectAllTopic && topic === c.deselectAllTopic)
            || (c.deleteSelectedTopic && topic === c.deleteSelectedTopic);
        if (isCommand) {
            this.onIncomingData(topic, payload, count);
            this._renderSpecific();
            return true;
        }
        const hitKeys = this._bindingKeysForTopic(topic);
        if (hitKeys.length !== 1 || hitKeys[0] !== 'data') return false;
        if (this.usesFormulaTopic(topic, { data: true })) return false;
        this._renderSpecific();
        return true;
    }

    parseData(input) {
        if (input === undefined || input === null || input === "") return { mode: 'multi', lines: [] };

        if (this.config.rawMode) {
            let text = input;
            if (typeof input === 'object') {
                try {
                    text = JSON.stringify(input, null, 2);
                } catch (e) {
                    text = String(input);
                }
            } else {
                text = String(input);
            }
            return { mode: 'single', lines: [{ state: false, icon: "", text: text, timestamp: Date.now() }] };
        }

        if (typeof input === 'object') {
            return { mode: 'multi', lines: this._parseObjectOrArray(input) };
        }

        if (typeof input === 'string') {
            const trimmed = input.trim();
            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                try {
                    const parsed = JSON.parse(trimmed);
                    return { mode: 'multi', lines: this._parseObjectOrArray(parsed) };
                } catch (e) { }
            }
            if (input.includes(',') && input.includes('|')) {
                const parts = input.split(',');
                const lines = parts.map(p => this._parseStringLine(p.trim()));
                return { mode: 'multi', lines: lines };
            }

            return { mode: 'single', lines: [this._parseStringLine(input)] };
        }

        return { mode: 'single', lines: [{ state: false, icon: '', text: String(input), timestamp: Date.now() }] };
    }

    _parseObjectOrArray(data) {
        const now = Date.now();

        const resolveState = (item) => {
            if (item.checked !== undefined) return item.checked === true || item.checked === 'true';
            if (item.state !== undefined) return item.state === true || item.state === 'true';
            return false;
        };

        const rowText = (item) => {
            if (!item || typeof item !== 'object') return '';
            if (item.text !== undefined) return BaseWidget.displayText(item.text);
            if (item.content !== undefined) return BaseWidget.displayText(item.content);
            if (item.message !== undefined) return BaseWidget.displayText(item.message);
            return '';
        };

        if (Array.isArray(data)) {
            return data.map(item => {
                if (typeof item === 'string') return this._parseStringLine(item);
                return {
                    state: resolveState(item),
                    icon: item.icon || "",
                    text: rowText(item),
                    timestamp: item.timestamp || now
                };
            });
        } else {
            const result = [];
            const keys = Object.keys(data).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
            if (keys.length > 0) {
                const maxKey = keys[keys.length - 1];
                for (let i = 0; i <= maxKey; i++) {
                    const item = data[String(i)];
                    if (item) {
                        result.push({
                            state: resolveState(item),
                            icon: item.icon || "",
                            text: rowText(item),
                            timestamp: item.timestamp || now
                        });
                    } else {
                        result.push(null);
                    }
                }
            }
            return result;
        }
    }

    _parseStringLine(str) {
        const now = Date.now();
        if (!str.includes('|')) {
            return { state: false, icon: "", text: str, timestamp: now };
        }

        const parts = str.split('|');
        let state = false;
        let iconCandidate = null;
        let textParts = [];

        const first = parts[0].trim();
        if (first === 'true' || first === 'false') {
            state = first === 'true';
            const remaining = parts.slice(1);
            if (remaining.length >= 2) {
                iconCandidate = remaining[0].trim();
                textParts = remaining.slice(1);
            } else {
                iconCandidate = "";
                textParts = remaining;
            }
        } else {
            if (parts.length >= 2) {
                iconCandidate = first;
                textParts = parts.slice(1);
            } else {
                iconCandidate = "";
                textParts = parts;
            }
        }

        return {
            state,
            icon: iconCandidate || "",
            text: textParts.join('|').trim(),
            timestamp: now
        };
    }

    _formatTimestamp(ts, c) {
        if (!ts) return "";
        const date = new Date(ts);
        if (isNaN(date.getTime())) return "";

        let timeStr = "";
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();

        if (!c.time24h) {
            hours = hours % 12;
            hours = hours ? hours : 12;
        }

        const pad = (n) => n < 10 ? '0' + n : n;

        if (c.timeFormat === 'HH:mm') {
            timeStr = `${pad(hours)}:${pad(minutes)}`;
        } else if (c.timeFormat === 'HH:mm:ss') {
            timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }

        if (!c.time24h && timeStr) {
            timeStr += ` ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
        }

        let dateStr = "";
        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1);
        const year = date.getFullYear();

        switch (c.dateFormat) {
            case 'DD-MM': dateStr = `${day}-${month}`; break;
            case 'DD-MM-YYYY': dateStr = `${day}-${month}-${year}`; break;
            case 'MM-DD': dateStr = `${month}-${day}`; break;
            case 'MM-DD-YYYY': dateStr = `${month}-${day}-${year}`; break;
        }

        if (dateStr && timeStr) return `${dateStr} ${timeStr}`;
        if (dateStr) return dateStr;
        return timeStr;
    }

    _computeRowsSignature() {
        if (this._hasAnyPayloadFormula()) return null;
        const parts = [this._renderInputsEpochSig(), this.config.deactivated ? '1' : '0'];
        for (let i = 0; i < this.lineBuffer.length; i++) {
            const l = this.lineBuffer[i];
            parts.push(l
                ? (l.timestamp || 0) + ';' + (l.state === true ? 1 : 0) + ';' + (l.icon || '') + ';' + (l.text || '')
                : '');
            parts.push(this.checkState.get(i) ? '1' : '0');
        }
        return parts.join('\x01');
    }

    _renderSpecific() {
        const c = this.config;
        const newData = c.data;

        this.lblEl.textContent = c.label;
        this.lblEl.style.display = c.label ? 'block' : 'none';
        this.applyTypographyToElement(this.lblEl, 'listLabel', c);

        if (newData !== this.lastRawData) {
            this.lastRawData = newData;
            const parsed = this.parseData(newData);

            if (parsed.mode === 'multi') {
                this.lineBuffer = parsed.lines;
            } else if (parsed.mode === 'multi-append') {
                this.lineBuffer.unshift(...parsed.lines);
            } else {
                this.lineBuffer.unshift(...parsed.lines);
            }

            this.checkState.clear();
            this.lineBuffer.forEach((line, i) => {
                if (line) this.checkState.set(i, line.state === true);
            });

            const incomingFingerprint = this.lineBuffer.map(l => l ? (l.timestamp || 0) : 0).join(',');
            if (c.outputMode === 'immediate' && incomingFingerprint !== this._lastPublishFingerprint) {
                this._publishState();
            }
        }

        const limit = parseInt(c.maxLines) || 10;
        if (this.lineBuffer.length > limit) {
            this.lineBuffer = this.lineBuffer.slice(0, limit);
        }

        // Skip the full row rebuild when its inputs are unchanged: row data, checkbox states,
        // and config generation (widget edits + master changes). Formula-driven widgets keep
        // rebuilding because live payloads can restyle rows without any epoch change.
        const rowsSig = this._computeRowsSignature();
        if (rowsSig !== null && rowsSig === this._lastRowsSig) return;
        this._lastRowsSig = rowsSig;

        const noFlexGap = document && document.documentElement &&
            document.documentElement.classList &&
            document.documentElement.classList.contains('no-flex-gap');

        this.listEl.style.gap = noFlexGap ? '' : `${c.lineGap}px`;

        const neededRows = this.lineBuffer.length;
        while (this.listEl.childElementCount > neededRows) this.listEl.removeChild(this.listEl.lastChild);
        while (this.listEl.childElementCount < neededRows) this.listEl.appendChild(document.createElement('div'));

        const rowEpoch = this._renderInputsEpochSig();

        const itemFs = c.listItemFs || 14;
        const lineHeight = c.lineHeight || 1.5;
        const rowMinHeight = Math.max(
            itemFs,
            c.showIcons ? (c.iconSizeRow || 0) : 0,
            c.enableCheckboxes ? Math.max(c.iconSizeCheckboxOn || 0, c.iconSizeCheckboxOff || 0) : 0
        );

        const deactCol = c.deactivated ? BaseWidget.getDeactivatedColor(c) : null;
        const accentCol = c.deactivated ? BaseWidget.getDeactivatedColorAccent(c) : null;

        if (c.deactivated) {
            c.listItemCol = accentCol;
            c.listTimestampCol = accentCol;
            c.iconSlotColRow = accentCol;
            c.iconSlotColCheckboxOn = accentCol;
            c.iconSlotColCheckboxOff = accentCol;
            c.readOnly = true;

            if (c.label) {
                this.lblEl.style.display = 'block';
                this.lblEl.style.color = accentCol;
            } else {
                this.lblEl.style.display = 'none';
            }

            if (this.lineBuffer.length === 0) {
                while (this.listEl.childElementCount > 1) this.listEl.removeChild(this.listEl.lastChild);
                while (this.listEl.childElementCount < 1) this.listEl.appendChild(document.createElement('div'));
                const emptyRow = this.listEl.children[0];
                emptyRow.innerHTML = '';
                emptyRow.style.width = '100%';
                emptyRow.style.minHeight = `${rowMinHeight}px`;
                emptyRow.style.borderBottom = '';
                return;
            }
        }

        this.lineBuffer.forEach((line, index) => {
            const row = this.listEl.children[index];
            const isChecked = !!(line && (this.checkState.get(index) || false));
            const rowSig = rowEpoch + '\x01' + index + '\x01' + (line
                ? (line.timestamp || 0) + ';' + (line.state === true ? 1 : 0) + ';' + (line.icon || '') + ';' + (line.text || '')
                : '') + '\x01' + (isChecked ? '1' : '0') + '\x01' + rowMinHeight + '\x01' + (c.iconGap || 0) + '\x01' + (c.lineGap || 0) + '\x01' + (c.deactivated ? '1' : '0');
            if (row.dataset.rowSig === rowSig) return;
            row.dataset.rowSig = rowSig;
            row.innerHTML = '';
            row.dataset.itemIndex = index;
            row.style.borderBottom = '';
            row.style.display = 'flex';
            row.style.alignItems = 'flex-start';
            row.style.width = '100%';
            row.style.minHeight = `${rowMinHeight}px`;
            row.style.gap = noFlexGap ? '' : `${c.iconGap}px`;
            row.style.boxSizing = 'border-box';

            if (c.deactivated) {
                row.style.cursor = 'default';
            } else if (c.enableCheckboxes && !c.readOnly) {
                row.style.cursor = 'pointer';
            }

            if (line) {
                const isChecked = this.checkState.get(index) || false;

                const buildCheckbox = () => {
                    const wrap = document.createElement('div');
                    wrap.style.display = 'flex';
                    wrap.style.alignItems = 'center';
                    wrap.style.justifyContent = 'center';
                    wrap.style.flexShrink = '0';
                    const cbSize = isChecked
                        ? (c.iconSizeCheckboxOn != null ? c.iconSizeCheckboxOn : (c.defaultListIconSize || 20))
                        : (c.iconSizeCheckboxOff != null ? c.iconSizeCheckboxOff : (c.defaultListIconSize || 20));
                    wrap.style.width = `${cbSize}px`;
                    wrap.style.height = `${itemFs * lineHeight}px`;

                    const km = isChecked ? ListWidget.ICON_KEYMAP_CHECKBOX_ON : ListWidget.ICON_KEYMAP_CHECKBOX_OFF;
                    const colKey = isChecked ? 'iconSlotColCheckboxOn' : 'iconSlotColCheckboxOff';
                    BaseWidget.applyIconStyleToElement(wrap, c, km, {
                        color: c[colKey]
                    });
                    if (c.deactivated) {
                        wrap.style.setProperty('--icon-secondary-color', accentCol);
                        const cbEl = wrap.querySelector('i, svg');
                        if (cbEl) cbEl.style.color = accentCol;
                    }
                    return wrap;
                };

                if (c.enableCheckboxes && c.checkboxAlignment === 'left') {
                    row.appendChild(buildCheckbox());
                }

                if (c.showIcons) {
                    const iconWrap = document.createElement('div');
                    const rowIconSize = c.iconSizeRow || 20;
                    iconWrap.style.width = `${rowIconSize}px`;
                    iconWrap.style.display = 'flex';
                    iconWrap.style.justifyContent = 'center';
                    iconWrap.style.alignItems = 'center';
                    iconWrap.style.flexShrink = '0';
                    iconWrap.style.height = `${itemFs * lineHeight}px`;

                    const lineBuiltin = ListWidget.normalizePhosphorBuiltin(line.icon || c.iconRow);
                    if (lineBuiltin || c.iconRow || c.imgRow) {
                        const rowResolved = { ...c, iconRow: lineBuiltin || c.iconRow };
                        BaseWidget.applyIconStyleToElement(iconWrap, rowResolved, ListWidget.ICON_KEYMAP_ROW, {
                            color: c.iconSlotColRow
                        });
                        if (c.deactivated) {
                            iconWrap.style.setProperty('--icon-secondary-color', accentCol);
                            const icEl = iconWrap.querySelector('i, svg');
                            if (icEl) icEl.style.color = accentCol;
                        }
                    }
                    row.appendChild(iconWrap);
                }

                if (c.showTimestamp) {
                    const timeWrap = document.createElement('div');
                    timeWrap.style.flexShrink = '0';
                    timeWrap.style.whiteSpace = 'nowrap';
                    timeWrap.style.display = 'flex';
                    timeWrap.style.alignItems = 'center';
                    timeWrap.style.height = `${itemFs * lineHeight}px`;
                    this.applyTypographyToElement(timeWrap, 'listTimestamp', c);

                    const ts = line.timestamp || Date.now();
                    timeWrap.textContent = this._formatTimestamp(ts, c);
                    row.appendChild(timeWrap);
                }

                const textEl = document.createElement('div');
                textEl.style.flex = '1';
                this.applyTypographyToElement(textEl, 'listItem', c);
                textEl.style.lineHeight = String(c.lineHeight || 1.5);

                if (c.textWrap) {
                    textEl.style.whiteSpace = 'pre-wrap';
                    textEl.style.wordBreak = 'break-word';
                } else {
                    textEl.style.whiteSpace = 'pre';
                    textEl.style.overflow = 'hidden';
                    textEl.style.textOverflow = 'ellipsis';
                }

                const itemCase = c.listItemCase || 'none';
                if (itemCase === 'uppercase') textEl.style.textTransform = 'uppercase';
                else if (itemCase === 'capitalize') textEl.style.textTransform = 'capitalize';
                else if (itemCase === 'lowercase') textEl.style.textTransform = 'lowercase';
                else if (itemCase === 'none' || itemCase === 'first') textEl.style.textTransform = 'none';

                if (c.enableCheckboxes && c.strikethroughChecked && isChecked) {
                    textEl.style.textDecoration = 'line-through';
                    textEl.style.opacity = '0.5';
                } else {
                    textEl.style.textDecoration = 'none';
                    textEl.style.opacity = '1';
                }

                let content = line.text;
                if (itemCase === 'first' && content.length > 0) {
                    content = content.charAt(0).toUpperCase() + content.slice(1);
                }

                textEl.textContent = content;
                row.appendChild(textEl);

                if (c.enableCheckboxes && c.checkboxAlignment === 'right') {
                    row.appendChild(buildCheckbox());
                }
            }

            if (noFlexGap) {
                if (index > 0 && c.lineGap) row.style.marginTop = `${c.lineGap}px`;
                const children = row.children;
                const iconGap = c.iconGap || 0;
                for (let ci = 1; ci < children.length; ci++) {
                    children[ci].style.marginLeft = `${iconGap}px`;
                }
            }

        });
    }

    onRemove() {
        this.lineBuffer = [];
        if (this.checkState) {
            this.checkState.clear();
        }
        super.onRemove();
    }
}

WidgetRegistry.register('list', ListWidget);
