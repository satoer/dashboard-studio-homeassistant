const DashboardMigrator = {
    SWITCH_TYPO_LEGACY_KEYS: ['labelFont', 'labelFs', 'labelCol', 'labelAlign', 'labelCase', 'labelBold', 'labelOffX', 'labelOffY'],
    SWITCH_ICON_LEGACY_KEYS: ['icon', 'iconOn', 'iconUrl', 'iconOnUrl', 'iconFilledOn', 'iconFilledOff', 'iconColorize'],
    SWITCH_VALID_TEXT_TRANSFORM: new Set(['uppercase', 'lowercase', 'capitalize', 'none']),
    /** Pre-1.5 / factory default single-line caption (compare case-insensitive). */
    SWITCH_FACTORY_DEFAULT_CAPTION_LC: 'switch',

    /** Pre-1.7.0 clock widget: flat label typography → nested `typography.groupLabel`. */
    CLOCK_GROUP_LABEL_LEGACY_KEYS: ['labelFont', 'labelFs', 'labelCol', 'labelAlign', 'labelCase', 'labelBold', 'labelItalic', 'labelOffX', 'labelOffY'],
    /** Pre-1.7.0 clock widget: flat dial number styling → nested `typography.analogNumbers`. */
    CLOCK_ANALOG_LEGACY_KEYS: ['numFont', 'numSize', 'numColor', 'numFontBold'],
    /** Stray instance flat keys (should live only under `typography.analogNumbers` after 1.7.0). */
    CLOCK_ANALOG_FLAT_INSTANCE_KEYS: [
        'clockAnalogNumFont', 'clockAnalogNumFs', 'clockAnalogNumAlign', 'clockAnalogNumCase',
        'clockAnalogNumBold', 'clockAnalogNumItalic', 'clockAnalogNumCol', 'clockAnalogNumColOff',
        'clockAnalogNumOpacity', 'clockAnalogNumOffX', 'clockAnalogNumOffY'
    ],
    /** Stray instance flat keys for group label typography. */
    CLOCK_GROUP_LABEL_FLAT_INSTANCE_KEYS: [
        'clockGroupLabelFont', 'clockGroupLabelFs', 'clockGroupLabelAlign', 'clockGroupLabelCase',
        'clockGroupLabelBold', 'clockGroupLabelItalic', 'clockGroupLabelCol', 'clockGroupLabelOpacity',
        'clockGroupLabelOffX', 'clockGroupLabelOffY'
    ],

    /** Pre-1.9.0 gauge: flat caption typography → nested `typography.caption`. */
    GAUGE_CAPTION_LEGACY_KEYS: ['labelFont', 'labelFs', 'labelCol', 'labelAlign', 'labelCase', 'labelBold', 'labelItalic', 'labelOffX', 'labelOffY'],
    /** Pre-1.9.0 gauge: flat value typography → nested `typography.value`. */
    GAUGE_VALUE_LEGACY_KEYS: ['valueFont', 'fsVal', 'colVal', 'valueBold', 'valOffX', 'valOffY'],
    /** Pre-1.9.0 gauge: flat unit typography → nested `typography.unit`. */
    GAUGE_UNIT_LEGACY_KEYS: ['fsUnit', 'colUnit'],
    /** Pre-1.9.0 gauge: flat axis typography → nested `typography.axis`. */
    GAUGE_AXIS_LEGACY_KEYS: ['axisFont', 'axisFontSize', 'axisFontColor', 'axisFontBold'],
    /** Pre-1.9.0 gauge: flat icon keys → nested `icons.on`. */
    GAUGE_ICON_LEGACY_KEYS: ['icon', 'iconUrl', 'iconColorize', 'iconFilled', 'colIcon'],
    /** Pre-1.9.0 gauge: vertical icon offset was `iconY` (now `iconOffY`). */
    GAUGE_LAYOUT_LEGACY_KEYS: ['iconY'],

    GAUGE_CAPTION_FLAT_INSTANCE_KEYS: [
        'gaugeCaptionFont', 'gaugeCaptionFs', 'gaugeCaptionAlign', 'gaugeCaptionCase',
        'gaugeCaptionBold', 'gaugeCaptionItalic', 'gaugeCaptionCol', 'gaugeCaptionOpacity',
        'gaugeCaptionOffX', 'gaugeCaptionOffY'
    ],
    GAUGE_VALUE_FLAT_INSTANCE_KEYS: [
        'gaugeValueFont', 'gaugeValueFs', 'gaugeValueAlign', 'gaugeValueCase',
        'gaugeValueBold', 'gaugeValueItalic', 'gaugeValueCol', 'gaugeValueOpacity',
        'gaugeValueOffX', 'gaugeValueOffY'
    ],
    GAUGE_UNIT_FLAT_INSTANCE_KEYS: [
        'gaugeUnitFont', 'gaugeUnitFs', 'gaugeUnitAlign', 'gaugeUnitCase',
        'gaugeUnitBold', 'gaugeUnitItalic', 'gaugeUnitCol', 'gaugeUnitOpacity',
        'gaugeUnitOffX', 'gaugeUnitOffY'
    ],
    GAUGE_AXIS_FLAT_INSTANCE_KEYS: [
        'gaugeAxisFont', 'gaugeAxisFs', 'gaugeAxisAlign', 'gaugeAxisCase',
        'gaugeAxisBold', 'gaugeAxisItalic', 'gaugeAxisCol', 'gaugeAxisOpacity',
        'gaugeAxisOffX', 'gaugeAxisOffY'
    ],

    /** Pre-1.9.0 slider: flat caption typography → nested `typography.caption`. */
    SLIDER_CAPTION_LEGACY_KEYS: ['labelFont', 'labelFs', 'labelCol', 'labelCase', 'labelBold', 'labelOffX', 'labelOffY'],
    /** Pre-1.9.0 slider: flat value typography → nested `typography.value`. */
    SLIDER_VALUE_LEGACY_KEYS: ['valFs', 'valFam', 'valFamBold', 'valAlign', 'colVal', 'valOffX', 'valOffY'],
    SLIDER_CAPTION_FLAT_INSTANCE_KEYS: [
        'sliderCaptionFont', 'sliderCaptionFs', 'sliderCaptionCase',
        'sliderCaptionBold', 'sliderCaptionCol', 'sliderCaptionOffX', 'sliderCaptionOffY'
    ],
    SLIDER_VALUE_FLAT_INSTANCE_KEYS: [
        'sliderValueFont', 'sliderValueFs', 'sliderValueAlign',
        'sliderValueBold', 'sliderValueCol', 'sliderValueOffX', 'sliderValueOffY'
    ],
    SLIDER_UNIT_FLAT_INSTANCE_KEYS: [
        'sliderUnitFont', 'sliderUnitFs', 'sliderUnitBold', 'sliderUnitItalic',
        'sliderUnitCol', 'sliderUnitOpacity'
    ],

    /** Edit box: flat input/label typography → nested `typography.inputText` / `typography.widgetLabel`. */
    EDITBOX_INPUT_LEGACY_TYPO_KEYS: ['fontFamily', 'fontBold', 'textColor', 'fontSize', 'textAlign'],
    EDITBOX_LABEL_LEGACY_TYPO_KEYS: ['labelFont', 'labelFs', 'labelCol', 'labelCase', 'labelBold', 'labelOffX', 'labelOffY'],
    EDITBOX_INPUT_FLAT_TYPO_KEYS: [
        'editboxInputFont', 'editboxInputFs', 'editboxInputAlign', 'editboxInputBold',
        'editboxInputCol', 'editboxInputItalic'
    ],
    EDITBOX_LABEL_FLAT_TYPO_KEYS: [
        'editboxLabelFont', 'editboxLabelFs', 'editboxLabelCol', 'editboxLabelCase',
        'editboxLabelBold', 'editboxLabelItalic', 'editboxLabelAlign',
        'editboxLabelOffX', 'editboxLabelOffY'
    ],

    CONTAINER_LABEL_LEGACY_TYPO_KEYS: [
        'labelFont', 'labelFs', 'labelCol', 'labelCase', 'labelBold', 'labelAlign',
        'labelItalic', 'labelOffX', 'labelOffY'
    ],
    CONTAINER_LABEL_FLAT_TYPO_KEYS: [
        'labelFont', 'labelFs', 'labelCol', 'labelCase', 'labelBold', 'labelAlign',
        'labelItalic', 'labelOffX', 'labelOffY'
    ],

    GRAPH_AXIS_X_FLAT_TYPO_KEYS: ['axisXFont', 'axisXFontSize', 'axisXFontColor', 'axisXFontBold', 'axisXFontOpacity'],
    GRAPH_AXIS_LEGACY_FLAT_TYPO_KEYS: ['axisFont', 'axisFontSize', 'axisFontColor', 'axisFontBold'],
    GRAPH_DATA_TEXT_FLAT_TYPO_KEYS: ['textFont', 'textSize', 'textColor', 'textFontBold'],

    /** Pre-1.9.0 icon widget: flat caption typography → nested `typography.caption`. */
    ICON_CAPTION_LEGACY_KEYS: ['labelFont', 'labelFs', 'labelCol', 'labelAlign', 'labelCase', 'labelBold', 'labelOffX', 'labelOffY'],
    /** Pre-1.9.0 icon widget: flat icon keys → nested `icons.on`. */
    ICON_SLOT_LEGACY_KEYS: ['icon', 'iconUrl', 'iconColorize', 'iconFilled'],
    ICON_CAPTION_FLAT_INSTANCE_KEYS: [
        'iconCaptionFont', 'iconCaptionFs', 'iconCaptionAlign', 'iconCaptionCase',
        'iconCaptionBold', 'iconCaptionCol', 'iconCaptionOpacity',
        'iconCaptionOffX', 'iconCaptionOffY'
    ],
    ICON_SLOT_FLAT_INSTANCE_KEYS: [
        'iconSourceOn', 'iconOn', 'iconWeightOn', 'imgOn', 'colorizeOn', 'iconSlotColOn', 'iconSlotAccentOn'
    ],
    ICON_SLOT_FLAT_OFF_INSTANCE_KEYS: [
        'iconSourceOff', 'iconOff', 'iconWeightOff', 'imgOff', 'colorizeOff', 'iconSlotColOff', 'iconSlotAccentOff'
    ],

    LIGHT_GRID_TILE_TYPO_LEGACY_KEYS: ['tileFont', 'tileFontBold'],
    LIGHT_GRID_WIDGET_LABEL_LEGACY_KEYS: ['labelFont', 'labelFs', 'labelCol', 'labelAlign', 'labelCase', 'labelBold', 'labelOffX', 'labelOffY'],
    LIGHT_GRID_PANEL_TITLE_LEGACY_KEYS: [
        'panelTitleFont', 'panelTitleFs', 'panelTitleCol', 'panelTitleAlign', 'panelTitleCase',
        'panelTitleBold', 'panelTitleOffX', 'panelTitleOffY'
    ],
    /** List widget: flat typography → nested `typography.listItem` / `listTimestamp` / `listLabel`. */
    LIST_ITEM_TYPO_LEGACY_KEYS: ['fontFamily', 'fontSize', 'fontBold', 'textColor', 'textCase'],
    LIST_TIMESTAMP_TYPO_LEGACY_KEYS: ['timeSize', 'timeColor'],
    LIST_LABEL_TYPO_LEGACY_KEYS: ['labelFont', 'labelFs', 'labelCol', 'labelAlign', 'labelOffX', 'labelOffY', 'labelCase', 'labelBold'],
    LIST_ICON_LEGACY_KEYS: [
        'defaultIcon', 'iconColor', 'iconSize',
        'checkboxIconOn', 'checkboxIconOff', 'checkboxIconOnFilled', 'checkboxIconOffFilled',
        'checkboxColorOn', 'checkboxColorOff', 'checkboxIconSize'
    ],

    LIGHT_GRID_LIGHT_ICON_LEGACY_KEYS: ['icon', 'iconUrl'],
    LIGHT_GRID_LIGHT_NAME_FLAT_INSTANCE_KEYS: [
        'lgLightNameFont', 'lgLightNameFs', 'lgLightNameAlign', 'lgLightNameCase',
        'lgLightNameBold', 'lgLightNameCol', 'lgLightNameOffX', 'lgLightNameOffY'
    ],
    LIGHT_GRID_WIDGET_LABEL_FLAT_INSTANCE_KEYS: [
        'lgWidgetLabelFont', 'lgWidgetLabelFs', 'lgWidgetLabelAlign', 'lgWidgetLabelCase',
        'lgWidgetLabelBold', 'lgWidgetLabelCol', 'lgWidgetLabelOffX', 'lgWidgetLabelOffY'
    ],
    LIGHT_GRID_PANEL_TITLE_FLAT_INSTANCE_KEYS: [
        'lgPanelTitleFont', 'lgPanelTitleFs', 'lgPanelTitleAlign', 'lgPanelTitleCase',
        'lgPanelTitleBold', 'lgPanelTitleCol', 'lgPanelTitleOffX', 'lgPanelTitleOffY'
    ],

    /** Pre-1.8.0 label widget: flat typography keys folded into `typography.mdParagraph` when migrating to `text`. */
    LABEL_LEGACY_FLAT_TYPO_KEYS: ['fontFamily', 'fontSize', 'textColor', 'lineHeight'],

    /** Shipped label widget (post-1.8.0): flat `label*` → nested `typography.label`. */
    LABEL_WIDGET_FLAT_TYPO_KEYS: [
        'labelFont', 'labelFs', 'labelAlign', 'labelCase', 'labelBold', 'labelItalic',
        'labelCol', 'labelOpacity', 'labelOffX', 'labelOffY'
    ],

    /** Legacy flat MQTT binding keys → canonical configKey (per widget type). */
    TYPOGRAPHY_BINDING_LEGACY_ALIASES: {
        gauge: { labelCol: 'gaugeCaptionCol' },
        slider: { labelCol: 'sliderCaptionCol' },
        icon: { labelCol: 'iconCaptionCol' },
        switch: { labelCol: 'switchGroupLabelCol' },
        list: { textColor: 'listItemCol', timeColor: 'listTimestampCol', labelCol: 'listLabelCol' },
        graph: { labelCol: 'labelCol', axisFontColor: 'axisXFontColor', textColor: 'textColor' },
        clock: { labelCol: 'clockGroupLabelCol', numColor: 'clockAnalogNumCol' }
    },

    /** Legacy flat icon-color MQTT binding keys → canonical icon slot configKey (1.9.0 icon-style overhaul). */
    ICON_BINDING_LEGACY_ALIASES: {
        icon: {
            colInactive: 'iconSlotColOff',
            colActive: 'iconSlotColOn',
            iconInactive: 'iconSlotColOff',
            iconActive: 'iconSlotColOn'
        },
        gauge: {
            colIcon: 'iconSlotColOn',
            gaugeColIcon: 'iconSlotColOn'
        },
        list: {
            iconColor: 'iconSlotColRow',
            checkboxColorOn: 'iconSlotColCheckboxOn',
            checkboxColorOff: 'iconSlotColCheckboxOff'
        },
        switch: {
            iconColOn: 'iconSlotColOn',
            iconColOff: 'iconSlotColOff',
            iconColHover: 'iconSlotHoverOn',
            switchIconColOn: 'iconSlotColOn',
            switchIconColOff: 'iconSlotColOff',
            switchIconColHover: 'iconSlotHoverOn'
        }
    },

    /** Legacy flat override color keys → canonical configKey for aux suffix migration (`_correct_*`, `_bind_map*`). */
    TYPOGRAPHY_AUX_COLOR_RENAMES: {
        gauge: [{ legacyFlatKey: 'labelCol', canonicalFlatKey: 'gaugeCaptionCol' }],
        slider: [{ legacyFlatKey: 'labelCol', canonicalFlatKey: 'sliderCaptionCol' }],
        icon: [{ legacyFlatKey: 'labelCol', canonicalFlatKey: 'iconCaptionCol' }],
        switch: [{ legacyFlatKey: 'labelCol', canonicalFlatKey: 'switchGroupLabelCol' }],
        list: [
            { legacyFlatKey: 'textColor', canonicalFlatKey: 'listItemCol' },
            { legacyFlatKey: 'timeColor', canonicalFlatKey: 'listTimestampCol' },
            { legacyFlatKey: 'labelCol', canonicalFlatKey: 'listLabelCol' }
        ]
    },

    /** Legacy flat icon-color override keys → canonical icon slot configKey for aux suffix migration. */
    ICON_AUX_COLOR_RENAMES: {
        icon: [
            { legacyFlatKey: 'colInactive', canonicalFlatKey: 'iconSlotColOff' },
            { legacyFlatKey: 'colActive', canonicalFlatKey: 'iconSlotColOn' }
        ],
        gauge: [
            { legacyFlatKey: 'colIcon', canonicalFlatKey: 'iconSlotColOn' }
        ],
        list: [
            { legacyFlatKey: 'iconColor', canonicalFlatKey: 'iconSlotColRow' },
            { legacyFlatKey: 'checkboxColorOn', canonicalFlatKey: 'iconSlotColCheckboxOn' },
            { legacyFlatKey: 'checkboxColorOff', canonicalFlatKey: 'iconSlotColCheckboxOff' }
        ],
        switch: [
            { legacyFlatKey: 'iconColOn', canonicalFlatKey: 'iconSlotColOn' },
            { legacyFlatKey: 'iconColOff', canonicalFlatKey: 'iconSlotColOff' },
            { legacyFlatKey: 'iconColHover', canonicalFlatKey: 'iconSlotHoverOn' }
        ]
    },

    TYPOGRAPHY_AUX_SUFFIXES: [
        '_correct_en', '_correct_hue', '_correct_sat', '_correct_bri',
        '_correct_hue_fixed', '_correct_sat_fixed', '_correct_bri_fixed',
        '_bind_mapTrue', '_bind_mapFalse', '_bind_formula', '_bind_transformMode'
    ],

    /**
     * Old LabelWidget rendered `# line` with `font-size: 1.4em` on the header (see `previous_versions/label.js`).
     * Text widget maps the same to Markdown h1, which uses `typography.mdH1` — this scale preserves visual size.
     */
    LABEL_TO_TEXT_LEGACY_H1_EM: 1.4,

    _switchButtonLabelTrim: function (o) {
        if (!o || o.buttonLabel === undefined || o.buttonLabel === null) return '';
        return String(o.buttonLabel).trim();
    },

    _isFactoryDefaultSwitchCaption: function (s) {
        if (s === undefined || s === null) return false;
        return String(s).trim().toLowerCase() === this.SWITCH_FACTORY_DEFAULT_CAPTION_LC;
    },

    // Helper to compare semantic version strings (e.g., "1.0.0" vs "1.1.2")
    compareVersions: function (v1, v2) {
        const parts1 = String(v1 || '0').split('.').map(Number);
        const parts2 = String(v2 || '0').split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if ((parts1[i] || 0) < (parts2[i] || 0)) return -1;
            if ((parts1[i] || 0) > (parts2[i] || 0)) return 1;
        }
        return 0;
    },

    LATEST_MIGRATION_VERSION: '2.3.0',

    MIGRATION_RULES: [
        { version: '1.1.2', description: 'Label standardization and UI property keys' },
        { version: '1.5.0', description: 'Switch buttonLabel, typography, icons' },
        { version: '1.5.1', description: 'Switch group caption heal' },
        { version: '1.5.2', description: 'Switch label colors' },
        { version: '1.6.0', description: 'Menu and switch nested bindings' },
        { version: '1.7.0', description: 'Clock nested typography' },
        { version: '1.8.0', description: 'Text widget markdown and typography' },
        { version: '1.8.3', description: 'Phosphor icons' },
        { version: '1.8.5', description: 'Duotone icons' },
        { version: '1.8.6', description: 'Phosphor weight' },
        { version: '1.9.0', description: 'Gauge, slider, lightgrid, list, container nested shapes' },
        { version: '1.9.3', description: 'Text per-role vertical spacing' },
        { version: '1.9.4', description: 'Typography forward-heal' },
        { version: '2.0.0', description: 'Responsive Columns and V2 nested save format' },
        { version: '2.3.0', description: 'Graph multi-series' }
    ],

    getLatestMigrationVersion: function () {
        if (Array.isArray(this.MIGRATION_RULES) && this.MIGRATION_RULES.length > 0) {
            let latest = this.MIGRATION_RULES[0].version;
            for (let i = 1; i < this.MIGRATION_RULES.length; i++) {
                if (this.compareVersions(this.MIGRATION_RULES[i].version, latest) > 0) {
                    latest = this.MIGRATION_RULES[i].version;
                }
            }
            return latest;
        }
        return this.LATEST_MIGRATION_VERSION || '2.0.0';
    },

    _typographyNestedWriterHelpers: function () {
        const setNestedString = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            const s = String(raw).trim();
            if (!s && prop !== 'textTransform') return false;
            if (block[prop] !== undefined && block[prop] !== null && String(block[prop]).trim() !== '') return false;
            block[prop] = raw;
            return true;
        };
        const setNestedBool = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            if (block[prop] !== undefined && block[prop] !== null) return false;
            block[prop] = !!raw;
            return true;
        };
        const setNestedFontSize = (block, raw) => {
            if (raw === undefined || raw === null) return false;
            if (block.fontSize !== undefined && block.fontSize !== null && String(block.fontSize).trim() !== '') {
                return false;
            }
            const n = Number(raw);
            if (Number.isFinite(n)) {
                block.fontSize = n;
                return true;
            }
            const s = String(raw).trim();
            if (!s) return false;
            block.fontSize = raw;
            return true;
        };
        const setNestedOpacity = (block, raw) => {
            if (raw === undefined || raw === null || String(raw).trim() === '') return false;
            if (block.opacity !== undefined && block.opacity !== null && String(block.opacity).trim() !== '') {
                return false;
            }
            const n = Number(raw);
            block.opacity = Number.isFinite(n) ? n : raw;
            return true;
        };
        const setNestedTextAlign = (block, raw) => {
            if (raw === undefined || raw === null) return false;
            const align = String(raw).trim().toLowerCase();
            if (align !== 'left' && align !== 'center' && align !== 'right') return false;
            if (block.textAlign !== undefined && block.textAlign !== null && String(block.textAlign).trim() !== '') {
                return false;
            }
            block.textAlign = align;
            return true;
        };
        const writeNestedProp = (block, prop, raw, writers) => {
            if (prop === 'bold' || prop === 'italic') return writers.setNestedBool(block, prop, raw);
            if (prop === 'fontSize') return writers.setNestedFontSize(block, raw);
            if (prop === 'opacity') return writers.setNestedOpacity(block, raw);
            if (prop === 'textAlign') return writers.setNestedTextAlign(block, raw);
            if (prop === 'offsetX' || prop === 'offsetY') {
                if (block[prop] !== undefined && block[prop] !== null && String(block[prop]).trim() !== '') {
                    return false;
                }
                if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
                    const n = Number(raw);
                    block[prop] = Number.isFinite(n) ? n : raw;
                    return true;
                }
                if (raw === 0) {
                    block[prop] = 0;
                    return true;
                }
                return false;
            }
            return writers.setNestedString(block, prop, raw);
        };
        return {
            setNestedString,
            setNestedBool,
            setNestedFontSize,
            setNestedOpacity,
            setNestedTextAlign,
            writeNestedProp
        };
    },

    /**
     * Lift flat typography override keys into `o.typography[roleKey]`; delete flat keys only after nested write.
     * Merges into existing nested blocks without clobbering non-empty nested values.
     */
    _liftFlatTypographyKeysOnOverrides: function (o, roleKey, flatToNestedMap, flatKeys) {
        if (!o || typeof o !== 'object' || !roleKey || !flatToNestedMap || !flatKeys || !flatKeys.length) {
            return false;
        }
        const writers = this._typographyNestedWriterHelpers();
        const typ = { ...(o.typography && typeof o.typography === 'object' ? o.typography : {}) };
        let block = null;
        let changed = false;
        let blockChanged = false;

        flatKeys.forEach((flatKey) => {
            if (o[flatKey] === undefined) return;
            const prop = flatToNestedMap[flatKey];
            if (!prop) return;
            if (block === null) {
                block = { ...(typ[roleKey] && typeof typ[roleKey] === 'object' ? typ[roleKey] : {}) };
            }
            const wrote = writers.writeNestedProp(block, prop, o[flatKey], writers);
            if (wrote) {
                delete o[flatKey];
                changed = true;
                blockChanged = true;
            }
        });

        if (blockChanged && block !== null) {
            if (Object.keys(block).length > 0) typ[roleKey] = block;
            else delete typ[roleKey];
        }
        if (changed) {
            if (Object.keys(typ).length > 0) o.typography = typ;
            else if (o.typography) delete o.typography;
        }
        return changed;
    },

    _widgetClassForType: function (type) {
        if (typeof WidgetRegistry === 'undefined' || !WidgetRegistry.get) return null;
        return WidgetRegistry.get(type) || null;
    },

    _getTypographyBindingSpecForWidgetType: function (type) {
        const cls = this._widgetClassForType(type);
        if (!cls || typeof cls.getNestedBindingOverlaySpec !== 'function') return null;
        const spec = cls.getNestedBindingOverlaySpec();
        return Array.isArray(spec) ? spec : null;
    },

    _migrateBindingsFlatToNestedFromSpec: function (b, spec, legacyAliases) {
        if (!b || typeof b !== 'object' || typeof BindingsTree === 'undefined') return false;
        if (!spec || !spec.length) return false;
        let changed = false;

        const moveTopic = (sourceKey, path) => {
            if (typeof b[sourceKey] !== 'string' || b[sourceKey] === '') return;
            const existing = BindingsTree.getAtPath(b, path);
            if (typeof existing === 'string' && existing !== '') return;
            BindingsTree.setAtPath(b, path, b[sourceKey]);
            delete b[sourceKey];
            changed = true;
        };

        spec.forEach(({ path, configKey }) => {
            moveTopic(configKey, path);
        });

        if (legacyAliases && typeof legacyAliases === 'object') {
            Object.keys(legacyAliases).forEach((legacyKey) => {
                const configKey = legacyAliases[legacyKey];
                const entry = spec.find((e) => e.configKey === configKey);
                if (!entry) return;
                moveTopic(legacyKey, entry.path);
            });
        }

        return changed;
    },

    _migrateTypographyAuxKeysOnOverrides: function (o, renames) {
        if (!o || typeof o !== 'object' || !Array.isArray(renames) || !renames.length) return false;
        const suffixes = this.TYPOGRAPHY_AUX_SUFFIXES;
        let changed = false;

        renames.forEach(({ legacyFlatKey, canonicalFlatKey }) => {
            if (!legacyFlatKey || !canonicalFlatKey || legacyFlatKey === canonicalFlatKey) return;
            suffixes.forEach((suffix) => {
                const fromKey = legacyFlatKey + suffix;
                const toKey = canonicalFlatKey + suffix;
                if (o[fromKey] === undefined) return;
                if (o[toKey] === undefined) {
                    o[toKey] = o[fromKey];
                }
                delete o[fromKey];
                changed = true;
            });
        });

        return changed;
    },

    _mergeBindingLegacyAliases: function (type) {
        const out = {};
        const typo = this.TYPOGRAPHY_BINDING_LEGACY_ALIASES[type];
        const icon = this.ICON_BINDING_LEGACY_ALIASES[type];
        if (typo) Object.assign(out, typo);
        if (icon) Object.assign(out, icon);
        return Object.keys(out).length ? out : null;
    },

    _mergeAuxColorRenames: function (type) {
        const typo = this.TYPOGRAPHY_AUX_COLOR_RENAMES[type];
        const icon = this.ICON_AUX_COLOR_RENAMES[type];
        if (!typo && !icon) return null;
        return (typo || []).concat(icon || []);
    },

    _migrateWidgetTypographyBindingsAndAux: function (w) {
        if (!w || !w.type) return false;
        let changed = false;
        const spec = this._getTypographyBindingSpecForWidgetType(w.type);
        const legacyAliases = this._mergeBindingLegacyAliases(w.type);
        if (w.bindings && spec && this._migrateBindingsFlatToNestedFromSpec(w.bindings, spec, legacyAliases)) {
            changed = true;
        }
        const auxRenames = this._mergeAuxColorRenames(w.type);
        if (w.overrides && auxRenames && this._migrateTypographyAuxKeysOnOverrides(w.overrides, auxRenames)) {
            changed = true;
        }
        return changed;
    },

    /**
     * Label widget (shipped): flat `label*` → nested `typography.label`. Distinct from pre-1.8.0 label→text migration.
     */
    _migrateLabelWidgetTypographyOverridesToCanonical: function (o) {
        if (!o || typeof o !== 'object') return false;
        const flatKeys = this.LABEL_WIDGET_FLAT_TYPO_KEYS;
        if (!flatKeys.some((k) => o[k] !== undefined)) return false;
        const flatToNested = {
            labelFont: 'fontFamily',
            labelFs: 'fontSize',
            labelAlign: 'textAlign',
            labelCase: 'textTransform',
            labelBold: 'bold',
            labelItalic: 'italic',
            labelCol: 'color',
            labelOpacity: 'opacity',
            labelOffX: 'offsetX',
            labelOffY: 'offsetY'
        };
        return this._liftFlatTypographyKeysOnOverrides(o, 'label', flatToNested, flatKeys);
    },

    _healWidgetTypographyForward: function (w, master) {
        if (!w || !w.type) return false;
        let changed = false;

        if (w.overrides) {
            const o = w.overrides;
            if (w.type === 'empty' && this._migrateContainerOverridesToCanonical(o)) changed = true;
            if (w.type === 'battery' && this._migrateWidgetLabelTypographyOverridesToCanonical(o)) changed = true;
            if (w.type === 'graph' && this._migrateGraphAxisTypographySplitV110Overrides(o)) changed = true;
            if (w.type === 'graph' && this._migrateGraphOverridesToCanonical(o)) changed = true;
            if (w.type === 'list' && this._migrateListOverridesToCanonical(o)) changed = true;
            if (w.type === 'editbox' && this._migrateEditboxOverridesToCanonical(o)) changed = true;
            if (w.type === 'clock' && this._migrateClockOverridesToCanonical(o)) changed = true;
            if (w.type === 'label' && this._migrateLabelWidgetTypographyOverridesToCanonical(o)) changed = true;
            if (w.type === 'gauge' && this._migrateGaugeOverridesToCanonical(o)) changed = true;
            if (w.type === 'slider' && this._migrateSliderOverridesToCanonical(o)) changed = true;
            if (w.type === 'icon' && this._migrateIconWidgetOverridesToCanonical(o)) changed = true;
            if (w.type === 'icon' && this._migrateIconWidgetDualSlotsAndColors(o, master)) changed = true;
            if (w.type === 'lightgrid' && this._migrateLightGridOverridesToCanonical(o, {})) changed = true;
        }

        if (this._migrateWidgetTypographyBindingsAndAux(w)) changed = true;
        return changed;
    },

    /** Deterministic JSON for comparing migration output without key-order false positives. */
    _stableJsonStringify: function (val) {
        if (val === null) return 'null';
        const t = typeof val;
        if (t === 'undefined') return 'undefined';
        if (t !== 'object') return JSON.stringify(val);
        if (Array.isArray(val)) {
            return '[' + val.map(function (item) { return this._stableJsonStringify(item); }, this).join(',') + ']';
        }
        const keys = Object.keys(val).sort();
        let out = '{';
        for (let i = 0; i < keys.length; i++) {
            if (i > 0) out += ',';
            const k = keys[i];
            out += JSON.stringify(k) + ':' + this._stableJsonStringify(val[k]);
        }
        return out + '}';
    },

    /** True only for pre-nested "linked groups" saves that used `memberIds` instead of `group.widgets`. */
    _groupsNeedLegacyLinkedMigration: function (data) {
        if (!data || !data.groups || typeof data.groups !== 'object') return false;
        const ids = Object.keys(data.groups);
        for (let i = 0; i < ids.length; i++) {
            const g = data.groups[ids[i]];
            if (g && Array.isArray(g.memberIds)) return true;
        }
        return false;
    },

    /**
     * Per-widget switch upgrade: caption -> buttonLabel, nested typography, nested icons.
     * Runs typography block if not done or leftover flat typo keys; icons block if not done or leftover flat icon keys.
     */
    _migrateSwitchOverridesToV2: function (o) {
        if (!o || typeof o !== 'object') return;
        const typoDone = o._switchTypographyV2 === true;
        const iconsDone = o._switchIconsV2 === true;
        const hasTypoLegacy = this.SWITCH_TYPO_LEGACY_KEYS.some((k) => o[k] !== undefined);
        const hasIconLegacy = this.SWITCH_ICON_LEGACY_KEYS.some((k) => o[k] !== undefined);

        if (!typoDone || hasTypoLegacy) {
            const legacyKeys = this.SWITCH_TYPO_LEGACY_KEYS;
            const hasLegacy = legacyKeys.some((k) => o[k] !== undefined);
            const needsCaptionMove = this._switchButtonLabelTrim(o) === '';

            if (needsCaptionMove) {
                o.buttonLabel = o.label !== undefined && o.label !== null ? String(o.label) : '';
                o.label = '';
            }

            const typ = { ...(o.typography && typeof o.typography === 'object' ? o.typography : {}) };

            if (hasLegacy) {
                const btn = { ...(typ.buttonLabel && typeof typ.buttonLabel === 'object' ? typ.buttonLabel : {}) };
                if (o.labelFont !== undefined) btn.fontFamily = o.labelFont;
                if (o.labelFs !== undefined) btn.fontSize = o.labelFs;
                if (o.labelAlign !== undefined) btn.textAlign = o.labelAlign;
                if (o.labelCase !== undefined) btn.textTransform = o.labelCase;
                if (o.labelBold !== undefined) btn.bold = o.labelBold;
                if (o.labelCol !== undefined) {
                    btn.color = o.labelCol;
                    btn.colorOff = o.labelCol;
                }
                if (o.labelOffX !== undefined) btn.offsetX = o.labelOffX;
                if (o.labelOffY !== undefined) btn.offsetY = o.labelOffY;
                typ.buttonLabel = btn;
                legacyKeys.forEach((k) => { delete o[k]; });
            }

            if (typ.buttonLabel && typeof typ.buttonLabel === 'object') {
                const base = JSON.parse(JSON.stringify(typ.buttonLabel));
                typ.buttonLabelOutside = {
                    ...base,
                    ...(typ.buttonLabelOutside && typeof typ.buttonLabelOutside === 'object' ? typ.buttonLabelOutside : {})
                };
                typ.buttonLabelInside = {
                    ...base,
                    ...(typ.buttonLabelInside && typeof typ.buttonLabelInside === 'object' ? typ.buttonLabelInside : {})
                };
                delete typ.buttonLabel;
            }

            o.typography = typ;
            o._switchTypographyV2 = true;
        }

        if (!iconsDone || hasIconLegacy) {
            const iconLegacyKeys = this.SWITCH_ICON_LEGACY_KEYS;
            const hasIconLegacyInner = iconLegacyKeys.some((k) => o[k] !== undefined);
            const slotDef = () => ({ source: 'phosphor', builtin: '', filled: true, customUrl: '', tintImage: false });
            let icons = { on: { ...slotDef() }, off: { ...slotDef() } };
            if (o.icons && typeof o.icons === 'object') {
                if (o.icons.on && typeof o.icons.on === 'object') icons.on = { ...slotDef(), ...o.icons.on };
                if (o.icons.off && typeof o.icons.off === 'object') icons.off = { ...slotDef(), ...o.icons.off };
            }
            if (hasIconLegacyInner) {
                const tint = o.iconColorize === true;
                const offUrl = String(o.iconUrl || '').trim();
                const offBuiltin = String(o.icon || '').trim();
                const offFilled = o.iconFilledOff !== undefined ? o.iconFilledOff : true;
                icons.off = {
                    source: offUrl ? 'custom' : 'phosphor',
                    builtin: offUrl ? '' : offBuiltin,
                    filled: offFilled !== false,
                    customUrl: offUrl,
                    tintImage: tint
                };
                const onUrl = String(o.iconOnUrl || o.iconUrl || '').trim();
                const onBuiltinRaw = (o.iconOn != null && String(o.iconOn).trim() !== '')
                    ? String(o.iconOn)
                    : offBuiltin;
                const onBuiltin = onUrl ? '' : onBuiltinRaw;
                const onFilled = o.iconFilledOn !== undefined
                    ? o.iconFilledOn
                    : (o.iconFilledOff !== undefined ? o.iconFilledOff : true);
                icons.on = {
                    source: onUrl ? 'custom' : 'phosphor',
                    builtin: onBuiltin,
                    filled: onFilled !== false,
                    customUrl: onUrl,
                    tintImage: tint
                };
            }
            o.icons = icons;

            const defOn = { enabled: false, color: '#ffffff' };
            const defOff = { enabled: false, color: '@thumb' };
            const prev = o.iconColorOverrides && typeof o.iconColorOverrides === 'object' ? o.iconColorOverrides : {};
            const prevOn = prev.on && typeof prev.on === 'object' ? prev.on : {};
            const prevOff = prev.off && typeof prev.off === 'object' ? prev.off : {};
            o.iconColorOverrides = {
                on: { ...defOn, ...prevOn, enabled: prevOn.enabled === true },
                off: { ...defOff, ...prevOff, enabled: prevOff.enabled === true }
            };

            iconLegacyKeys.forEach((k) => { delete o[k]; });
            o._switchIconsV2 = true;
        }
    },

    _switchNeedsFullV2Migrate: function (o) {
        if (!o || typeof o !== 'object') return false;
        if (o._switchTypographyV2 !== true || o._switchIconsV2 !== true) return true;
        if (this.SWITCH_TYPO_LEGACY_KEYS.some((k) => o[k] !== undefined)) return true;
        if (this.SWITCH_ICON_LEGACY_KEYS.some((k) => o[k] !== undefined)) return true;
        return false;
    },

    /** Dev-preview `textOnly` checkbox → Visual Style `text-only`. */
    _healSwitchTextOnlyCheckboxToStyle: function (o) {
        if (!o || typeof o !== 'object' || o.textOnly !== true) return false;
        if (o.style !== 'text-only') o.style = 'text-only';
        delete o.textOnly;
        return true;
    },

    _healSwitchCaption: function (o) {
        if (!o || typeof o !== 'object') return false;
        const labelTrim = o.label !== undefined && o.label !== null ? String(o.label).trim() : '';
        if (!labelTrim) return false;
        if (this._switchButtonLabelTrim(o) !== '') return false;
        o.buttonLabel = String(o.label);
        o.label = '';
        return true;
    },

    /**
     * Grouped / partial 1.5.0 saves often kept the real caption in `label` while `buttonLabel` was filled with
     * the factory default "Switch" from class defaults. Replace the placeholder button text with `label`, then clear `label`.
     */
    _healSwitchCaptionWhenButtonHoldsFactoryDefault: function (o) {
        if (!o || typeof o !== 'object') return false;
        const blTrim = this._switchButtonLabelTrim(o);
        if (!this._isFactoryDefaultSwitchCaption(blTrim)) return false;
        const labelTrim = o.label !== undefined && o.label !== null ? String(o.label).trim() : '';
        if (!labelTrim) return false;
        o.buttonLabel = labelTrim;
        o.label = '';
        return true;
    },

    /**
     * Pre-1.5 default caption was label "Switch". After V2, that string in `label` is group chrome only;
     * if buttonLabel already holds the real caption, clear the phantom default group title.
     * Matches "Switch" case-insensitive. Treats null/empty buttonLabel as no caption (caption heal runs first).
     */
    _healSwitchStaleDefaultGroupLabel: function (o) {
        if (!o || typeof o !== 'object') return false;
        if (this._switchButtonLabelTrim(o) === '') return false;
        const lab = o.label !== undefined && o.label !== null ? String(o.label).trim() : '';
        if (!this._isFactoryDefaultSwitchCaption(lab)) return false;
        o.label = '';
        return true;
    },

    _normalizeTextTransformCase: function (raw) {
        if (raw === undefined || raw === null) return null;
        const s = String(raw).trim().toLowerCase();
        if (!s) return null;
        if (this.SWITCH_VALID_TEXT_TRANSFORM.has(s)) return s;
        return null;
    },

    /**
     * Fill missing typography.buttonLabelOutside/Inside.textTransform from labelCase or master.defaultLabelCase.
     * Removes stale o.labelCase when nested typography is updated.
     */
    _healSwitchButtonTextTransform: function (o, master) {
        if (!o || typeof o !== 'object') return false;
        o.typography = o.typography && typeof o.typography === 'object' ? o.typography : {};
        const outside = o.typography.buttonLabelOutside && typeof o.typography.buttonLabelOutside === 'object'
            ? o.typography.buttonLabelOutside
            : {};
        const inside = o.typography.buttonLabelInside && typeof o.typography.buttonLabelInside === 'object'
            ? o.typography.buttonLabelInside
            : {};
        const outsideTf = outside.textTransform;
        const insideTf = inside.textTransform;
        const outsideUnset = outsideTf === undefined || outsideTf === null || String(outsideTf).trim() === '';
        const insideUnset = insideTf === undefined || insideTf === null || String(insideTf).trim() === '';
        if (!outsideUnset && !insideUnset) {
            if (o.labelCase !== undefined) delete o.labelCase;
            return false;
        }

        let pick = this._normalizeTextTransformCase(o.labelCase);
        if (pick === null && master && typeof master === 'object' && master.defaultLabelCase !== undefined && master.defaultLabelCase !== null) {
            pick = this._normalizeTextTransformCase(master.defaultLabelCase);
        }
        if (pick === null) return false;

        let changed = false;
        if (outsideUnset) {
            o.typography.buttonLabelOutside = { ...outside, textTransform: pick };
            changed = true;
        }
        if (insideUnset) {
            o.typography.buttonLabelInside = { ...inside, textTransform: pick };
            changed = true;
        }
        if (o.labelCase !== undefined) delete o.labelCase;
        return changed;
    },

    /**
     * Pre-1.5.0 bound the caption on `bindings.label`; after 1.5.0 that key targets group chrome.
     * Move to bindings.buttonLabel when button is not already bound (root and grouped switches).
     */
    _healSwitchBindingsLabelToButtonLabel: function (w) {
        if (!w || w.type !== 'switch') return false;
        const b = w.bindings && typeof w.bindings === 'object' ? w.bindings : null;
        if (!b) return false;
        if (!Object.prototype.hasOwnProperty.call(b, 'label')) return false;
        const raw = b.label;
        const topic = raw !== undefined && raw !== null ? String(raw).trim() : '';
        if (!topic) {
            delete b.label;
            return true;
        }
        const existingBtn = b.buttonLabel;
        const existingTrim = existingBtn !== undefined && existingBtn !== null ? String(existingBtn).trim() : '';
        if (existingTrim !== '') return false;
        b.buttonLabel = topic;
        delete b.label;
        return true;
    },

    /** True if string is an http(s) URL that looks like a raster/SVG asset (not arbitrary web links). */
    _looksLikeWebImageAssetUrl: function (s) {
        if (s === undefined || s === null) return false;
        const t = String(s).trim().toLowerCase();
        if (!t.startsWith('http://') && !t.startsWith('https://')) return false;
        return /\.(svg|png|jpg|jpeg|webp|gif)(\?|#|$)/i.test(t) || /\/svg\//i.test(t);
    },

    /**
     * Migration copied old `label` into `buttonLabel`; clear when that string is a duplicate or stale icon URL.
     * Exact match to on/off customUrl, OR same pattern as "Copy" widgets: http(s) image-like URL while both
     * slots use http(s) custom images, OR image-only style with at least one http(s) custom icon.
     */
    _healSwitchDuplicateIconUrlInButtonLabel: function (o) {
        if (!o || typeof o !== 'object') return false;
        const bl = this._switchButtonLabelTrim(o);
        if (!bl) return false;
        const low = bl.toLowerCase();
        if (!low.startsWith('http://') && !low.startsWith('https://')) return false;

        const urls = [];
        if (o.icons && typeof o.icons === 'object') {
            ['on', 'off'].forEach((slot) => {
                const slotObj = o.icons[slot];
                if (slotObj && typeof slotObj === 'object') {
                    const u = String(slotObj.customUrl || '').trim();
                    if (u) urls.push(u);
                }
            });
        }
        if (urls.length === 0) return false;

        if (urls.some((u) => u === bl)) {
            o.buttonLabel = '';
            return true;
        }

        const httpIconCount = urls.filter((u) => {
            const t = u.toLowerCase();
            return (t.startsWith('http://') || t.startsWith('https://')) && u.length > 8;
        }).length;

        if (!this._looksLikeWebImageAssetUrl(bl)) return false;
        if (httpIconCount === 0) return false;
        if (httpIconCount >= 2 || o.style === 'image-only') {
            o.buttonLabel = '';
            return true;
        }
        return false;
    },

    /** True when a master color field is unset or whitespace-only. */
    _masterSwitchLabelColorIsEmpty: function (v) {
        return v === undefined || v === null || String(v).trim() === '';
    },

    /** Normalize #rgb / #rrggbb for comparison (lowercase). Non-hex returns ''. */
    _normalizeMasterHex: function (s) {
        if (s === undefined || s === null) return '';
        const t = String(s).trim().toLowerCase();
        if (!t.startsWith('#') || t.length < 4) return '';
        if (t.length === 4) {
            return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`;
        }
        return t;
    },

    _masterSwitchLabelHexEquals: function (a, b) {
        const na = this._normalizeMasterHex(a);
        const nb = this._normalizeMasterHex(b);
        return na.length > 0 && na === nb;
    },

    /**
     * Pre-1.5 used master switchColLabel (then defaultColLabel) for switch caption color; 1.5.x added
     * switchButtonOutside/Inside DefaultCol(+Off) but did not copy legacy master label colors.
     * Fills empty slots; if all four are still factory gray (#94a3b8) and legacy differs, set all four.
     */
    _migrateMasterSwitchButtonLabelColorsFromLegacy: function (m) {
        if (!m || typeof m !== 'object') return false;
        const trim = (v) => {
            if (v === undefined || v === null) return '';
            return String(v).trim();
        };
        const legacy = trim(m.switchColLabel) || trim(m.defaultColLabel);
        if (!legacy) return false;
        const keys = [
            'switchButtonOutsideDefaultCol',
            'switchButtonOutsideDefaultColOff',
            'switchButtonInsideDefaultCol',
            'switchButtonInsideDefaultColOff'
        ];
        const STOCK_GRAY = '#94a3b8';
        const vacantOrStock = (v) => this._masterSwitchLabelColorIsEmpty(v)
            || this._masterSwitchLabelHexEquals(v, STOCK_GRAY);
        const vals = keys.map((k) => m[k]);
        const allVacantOrStock = vals.every(vacantOrStock);
        const legacyDiffersFromStock = !this._masterSwitchLabelHexEquals(legacy, STOCK_GRAY);

        let changed = false;
        if (allVacantOrStock && legacyDiffersFromStock) {
            keys.forEach((k) => {
                m[k] = legacy;
            });
            return true;
        }
        keys.forEach((k) => {
            if (this._masterSwitchLabelColorIsEmpty(m[k])) {
                m[k] = legacy;
                changed = true;
            }
        });
        return changed;
    },

    /**
     * Switch / Button: legacy flat `iconSize` / `iconOffX` / `iconOffY` → nested `icons.on.size` / `offsetX` / `offsetY` (idempotent).
     */
    _migrateSwitchLegacyFlatIconGeometryToNested: function (o) {
        if (!o || typeof o !== 'object') return false;
        const touchedLegacy = Object.prototype.hasOwnProperty.call(o, 'iconSize')
            || Object.prototype.hasOwnProperty.call(o, 'iconOffX')
            || Object.prototype.hasOwnProperty.call(o, 'iconOffY');
        if (!touchedLegacy) return false;

        let changed = false;
        if (!o.icons || typeof o.icons !== 'object') o.icons = {};
        if (!o.icons.on || typeof o.icons.on !== 'object') o.icons.on = {};
        const on = o.icons.on;

        const pickFinite = function (raw) {
            if (raw === undefined || raw === null || raw === '') return null;
            const n = typeof raw === 'number' ? raw : parseFloat(String(raw).trim());
            return Number.isFinite(n) ? n : null;
        };

        if (Object.prototype.hasOwnProperty.call(o, 'iconSize')) {
            if (!Object.prototype.hasOwnProperty.call(on, 'size')) {
                const n = pickFinite(o.iconSize);
                if (n !== null && n > 0) {
                    on.size = n;
                    changed = true;
                }
            }
            delete o.iconSize;
            changed = true;
        }

        [['iconOffX', 'offsetX'], ['iconOffY', 'offsetY']].forEach(function (pair) {
            const flatK = pair[0];
            const nestK = pair[1];
            if (!Object.prototype.hasOwnProperty.call(o, flatK)) return;
            if (!Object.prototype.hasOwnProperty.call(on, nestK)) {
                const n = pickFinite(o[flatK]);
                if (n !== null) {
                    on[nestK] = n;
                    changed = true;
                }
            }
            delete o[flatK];
            changed = true;
        });

        return changed;
    },

    _forEachSwitchWidget: function (migratedData, fn) {
        if (!migratedData || typeof migratedData !== 'object' || typeof fn !== 'function') return;
        const widgets = migratedData.widgets && typeof migratedData.widgets === 'object' ? migratedData.widgets : {};
        Object.keys(widgets).forEach((id) => {
            const w = widgets[id];
            if (w && w.type === 'switch') fn(w);
        });
        const groups = migratedData.groups && typeof migratedData.groups === 'object' ? migratedData.groups : {};
        Object.keys(groups).forEach((gid) => {
            const g = groups[gid];
            const nested = g && g.widgets && typeof g.widgets === 'object' ? g.widgets : {};
            Object.keys(nested).forEach((wid) => {
                const w = nested[wid];
                if (w && w.type === 'switch') fn(w);
            });
        });
    },

    /**
     * Text widget table typography: pre-1.8.5 `left` matched markdown-friendly column alignment.
     * Remap to `table_defined` so **Left** can mean forced left alignment.
     */
    _migrateTextWidgetTableTypographyAlignV185: function (migratedData) {
        const TABLE_DEF = 'table_defined';
        let changed = false;
        const applyMapLeftToTableDefined = function (obj, key) {
            if (!obj || typeof obj !== 'object') return;
            if (obj[key] === undefined || obj[key] === null) return;
            if (String(obj[key]).trim() !== 'left') return;
            obj[key] = TABLE_DEF;
            changed = true;
        };
        if (migratedData.master && typeof migratedData.master === 'object') {
            const m = migratedData.master;
            applyMapLeftToTableDefined(m, 'textMdThAlign');
            applyMapLeftToTableDefined(m, 'textMdTdAlign');
        }
        this._forEachWidget(migratedData, function (w) {
            if (!w || w.type !== 'text') return;
            const o = w.overrides && typeof w.overrides === 'object' ? w.overrides : null;
            if (!o) return;
            applyMapLeftToTableDefined(o, 'textMdThAlign');
            applyMapLeftToTableDefined(o, 'textMdTdAlign');
            if (o.typography && typeof o.typography === 'object') {
                const mdTh = o.typography.mdTh;
                if (mdTh && typeof mdTh === 'object') applyMapLeftToTableDefined(mdTh, 'textAlign');
                const mdTd = o.typography.mdTableText;
                if (mdTd && typeof mdTd === 'object') applyMapLeftToTableDefined(mdTd, 'textAlign');
            }
        });
        return changed;
    },

    /**
     * Text widget: legacy global vertical spacing → per-role typography.blockSpacing
     * (paragraph, headers, table block margin — not table body text or block callouts).
     */
    _copyTextMdLegacyBlockSpacingToRoles: function (target, legacyVal) {
        if (!target || typeof target !== 'object') return false;
        const hp = Object.prototype.hasOwnProperty;
        const val = Number.isFinite(Number(legacyVal)) ? Number(legacyVal) : 8;
        const roles = [
            ['mdParagraph', 'textMdPara'],
            ['mdH1', 'textMdH1'],
            ['mdH2', 'textMdH2'],
            ['mdH3', 'textMdH3'],
            ['mdTh', 'textMdTh']
        ];
        let changed = false;
        if (!target.typography || typeof target.typography !== 'object') {
            target.typography = {};
            changed = true;
        }
        for (let i = 0; i < roles.length; i++) {
            const role = roles[i][0];
            const prefix = roles[i][1];
            if (!target.typography[role] || typeof target.typography[role] !== 'object') {
                target.typography[role] = {};
                changed = true;
            }
            const block = target.typography[role];
            if (block.blockSpacing == null && !hp.call(target, prefix + 'BlockSpace')) {
                block.blockSpacing = val;
                changed = true;
            }
            if (hp.call(target, prefix + 'BlockSpace')) {
                delete target[prefix + 'BlockSpace'];
                changed = true;
            }
        }
        return changed;
    },

    _migrateTextMdBlockSpacingMaster: function (master) {
        const hp = Object.prototype.hasOwnProperty;
        if (!master || typeof master !== 'object' || !hp.call(master, 'textMdBlockSpacing')) return false;
        const legacyVal = parseInt(String(master.textMdBlockSpacing), 10);
        const val = isNaN(legacyVal) ? 8 : legacyVal;
        const masterKeys = [
            'textMdParaBlockSpace',
            'textMdH1BlockSpace',
            'textMdH2BlockSpace',
            'textMdH3BlockSpace',
            'textMdThBlockSpace'
        ];
        let changed = false;
        for (let i = 0; i < masterKeys.length; i++) {
            const k = masterKeys[i];
            if (master[k] == null) {
                master[k] = val;
                changed = true;
            }
        }
        delete master.textMdBlockSpacing;
        return true;
    },

    _migrateTextWidgetOverridesBlockSpacing: function (overrides) {
        const hp = Object.prototype.hasOwnProperty;
        if (!overrides || typeof overrides !== 'object' || !hp.call(overrides, 'mdBlockSpacing')) return false;
        const legacyVal = parseInt(String(overrides.mdBlockSpacing), 10);
        const val = isNaN(legacyVal) ? 8 : legacyVal;
        this._copyTextMdLegacyBlockSpacingToRoles(overrides, val);
        delete overrides.mdBlockSpacing;
        return true;
    },

    _graphSeriesNameFromTopic: function (topic) {
        const raw = String(topic || '').trim();
        if (!raw || raw.indexOf('{{') >= 0 || raw.indexOf(',') >= 0) return '';
        const parts = raw.split('/');
        const leaf = parts[parts.length - 1] || raw;
        const words = leaf.replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (!words) return '';
        return words.replace(/\w\S*/g, function (w) {
            return w.charAt(0).toUpperCase() + w.slice(1);
        });
    },

    _graphMasterBag: function (data) {
        const master = data && data.master;
        if (!master || typeof master !== 'object') return null;
        const defaults = master.widgetDefaults;
        if (defaults && defaults.graph && typeof defaults.graph === 'object') return defaults.graph;
        return null;
    },

    /**
     * Read-only master graph defaults for the 2.3.0 widget migration. Must be
     * captured BEFORE `normalizeMasterToNested`: its save-map round trip drops
     * pre-2.2 graph keys (lineColor, fillColor, negativeFillColor, fill,
     * fillOpacity, barColor, pointColor) that the series conversion still reads.
     * V1 flat masters keep their `defaultGraph*` / `graphLineCol`-era keys here too.
     */
    _graphMasterBagForMigration: function (data) {
        if (!data || typeof data !== 'object' || !data.master || typeof data.master !== 'object') return {};
        const m = data.master;
        const merged = {};
        Object.keys(m).forEach(function (k) {
            if (/^defaultGraph/.test(k) || k === 'graphLineCol' || k === 'graphFillCol' || k === 'graphNegFillColor') {
                merged[k] = m[k];
            }
        });
        const nested = this._graphMasterBag(data);
        if (nested) {
            Object.keys(nested).forEach(function (k) {
                if (merged[k] === undefined) merged[k] = nested[k];
            });
        }
        return merged;
    },

    _dropKeysWithCorrections: function (bag, keys) {
        if (!bag || typeof bag !== 'object') return false;
        let changed = false;
        const suffixes = this.TYPOGRAPHY_AUX_SUFFIXES;
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (Object.prototype.hasOwnProperty.call(bag, key)) {
                delete bag[key];
                changed = true;
            }
            if (suffixes && suffixes.length) {
                for (let s = 0; s < suffixes.length; s++) {
                    const auxKey = key + suffixes[s];
                    if (Object.prototype.hasOwnProperty.call(bag, auxKey)) {
                        delete bag[auxKey];
                        changed = true;
                    }
                }
            }
            // Sibling corrections and attached binding rules of a dropped key are meaningless without it.
            const correctPrefix = key + '_correct_';
            const bindPrefix = key + '_bind_';
            Object.keys(bag).forEach((k) => {
                if (k.indexOf(correctPrefix) === 0 || k.indexOf(bindPrefix) === 0) {
                    delete bag[k];
                    changed = true;
                }
            });
        }
        return changed;
    },

    _migrateGraphMasterSeriesDefaults: function (bag, preBag) {
        if (!bag || typeof bag !== 'object') return false;
        let changed = false;
        const fillOff = bag.fill === false || bag.defaultGraphFill === false
            || (preBag && (preBag.fill === false || preBag.defaultGraphFill === false));
        let opacity = null;
        if (bag.fillOpacity !== undefined && bag.fillOpacity !== null && bag.fillOpacity !== '') opacity = bag.fillOpacity;
        else if (bag.defaultGraphFillOpacity !== undefined && bag.defaultGraphFillOpacity !== null && bag.defaultGraphFillOpacity !== '') {
            opacity = bag.defaultGraphFillOpacity;
        } else if (preBag) {
            if (preBag.fillOpacity !== undefined && preBag.fillOpacity !== null && preBag.fillOpacity !== '') opacity = preBag.fillOpacity;
            else if (preBag.defaultGraphFillOpacity !== undefined && preBag.defaultGraphFillOpacity !== null && preBag.defaultGraphFillOpacity !== '') {
                opacity = preBag.defaultGraphFillOpacity;
            }
        }
        if (fillOff) {
            if (bag.positiveStartOpacity == null) { bag.positiveStartOpacity = 0; changed = true; }
            if (bag.negativeStartOpacity == null) { bag.negativeStartOpacity = 0; changed = true; }
        } else if (opacity != null) {
            if (bag.positiveStartOpacity == null) { bag.positiveStartOpacity = opacity; changed = true; }
            if (bag.negativeStartOpacity == null) { bag.negativeStartOpacity = opacity; changed = true; }
        }
        const drop = [
            'lineColor', 'fillColor', 'negativeFillColor', 'fill', 'fillOpacity', 'barColor', 'pointColor', 'linearTimeScale',
            'graphLineCol', 'graphFillCol', 'graphNegFillColor', 'defaultGraphFill', 'defaultGraphFillOpacity',
            'defaultGraphBarColor', 'defaultGraphPointColor', 'defaultGraphLinearTimeScale'
        ];
        if (this._dropKeysWithCorrections(bag, drop)) changed = true;
        return changed;
    },

    _hasGraphColorAux: function (bag, key) {
        if (!bag || typeof bag !== 'object' || !key) return false;
        const suffixes = this.TYPOGRAPHY_AUX_SUFFIXES;
        if (suffixes && suffixes.length) {
            for (let s = 0; s < suffixes.length; s++) {
                const auxKey = key + suffixes[s];
                if (bag[auxKey] !== undefined && bag[auxKey] !== null && bag[auxKey] !== '') {
                    return true;
                }
            }
        }
        const correctPrefix = key + '_correct_';
        const bindPrefix = key + '_bind_';
        const names = Object.keys(bag);
        for (let i = 0; i < names.length; i++) {
            const k = names[i];
            if ((k.indexOf(correctPrefix) === 0 || k.indexOf(bindPrefix) === 0)
                && bag[k] !== undefined && bag[k] !== null && bag[k] !== '') {
                return true;
            }
        }
        return false;
    },

    _graphValuePresent: function (v) {
        return v !== undefined && v !== null && v !== '';
    },

    _graphTopic: function (bag, key) {
        if (!bag || typeof bag[key] !== 'string' || bag[key] === '') return '';
        return bag[key];
    },

    _graphColorSame: function (a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; }
    },

    _copyGraphColorAux: function (src, srcKey, dest, destKey) {
        if (!src || !dest || !srcKey || !destKey) return false;
        const suffixes = this.TYPOGRAPHY_AUX_SUFFIXES;
        let changed = false;
        for (let i = 0; i < suffixes.length; i++) {
            const from = srcKey + suffixes[i];
            if (!Object.prototype.hasOwnProperty.call(src, from)) continue;
            const to = destKey + suffixes[i];
            if (!Object.prototype.hasOwnProperty.call(dest, to)) {
                dest[to] = src[from];
                changed = true;
            }
        }
        const correctPrefix = srcKey + '_correct_';
        const bindPrefix = srcKey + '_bind_';
        const keys = Object.keys(src);
        for (let k = 0; k < keys.length; k++) {
            const fromKey = keys[k];
            let suf = '';
            if (fromKey.indexOf(correctPrefix) === 0) suf = fromKey.slice(srcKey.length);
            else if (fromKey.indexOf(bindPrefix) === 0) suf = fromKey.slice(srcKey.length);
            if (suf) {
                const toKey = destKey + suf;
                if (!Object.prototype.hasOwnProperty.call(dest, toKey)) {
                    dest[toKey] = src[fromKey];
                    changed = true;
                }
            }
        }
        return changed;
    },

    _setSeriesColorBinding: function (w, index, prop, topic) {
        if (!w || typeof topic !== 'string' || topic === '') return false;
        if (!w.bindings || typeof w.bindings !== 'object') w.bindings = {};
        const b = w.bindings;
        if (!Array.isArray(b.series)) b.series = [];
        if (!b.series[index] || typeof b.series[index] !== 'object') b.series[index] = {};
        if (typeof b.series[index][prop] === 'string' && b.series[index][prop] !== '') return false;
        b.series[index][prop] = topic;
        return true;
    },

    /**
     * Old graph colors lived on the widget or on the master (with a global
     * topic and color correction). `barColor` on the master is the positive
     * bar color, runtime key `defaultGraphBarColor`.
     */
    _graphColorSource: function (o, bindings, bag, globalBindings, widgetKey, masterKeys, globalKey) {
        const present = this._graphValuePresent.bind(this);
        const widgetTopic = this._graphTopic(bindings, widgetKey);
        const hasWidgetAux = this._hasGraphColorAux(o, widgetKey);
        if (widgetTopic || present(o && o[widgetKey]) || hasWidgetAux) {
            return {
                value: present(o && o[widgetKey]) ? o[widgetKey] : undefined,
                topic: widgetTopic,
                auxSrc: o,
                auxKeys: [widgetKey],
                clearBinding: bindings,
                clearKey: widgetKey,
                globalKey: ''
            };
        }
        let value;
        const auxKeys = [];
        const keys = masterKeys || [];
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!bag || typeof bag !== 'object') break;
            const hasMasterAux = this._hasGraphColorAux(bag, key);
            if (present(bag[key]) || hasMasterAux) {
                if (value === undefined && present(bag[key])) value = bag[key];
                auxKeys.push(key);
            }
        }
        let topic = this._graphTopic(globalBindings, globalKey);
        if (!topic) {
            for (let i = 0; i < keys.length; i++) {
                topic = this._graphTopic(globalBindings, keys[i]);
                if (topic) break;
            }
        }
        if (value === undefined && !topic && !auxKeys.length) return null;
        return {
            value: value,
            topic: topic,
            auxSrc: bag,
            auxKeys: auxKeys,
            clearBinding: null,
            clearKey: '',
            globalKey: globalKey || ''
        };
    },

    _installGraphColor: function (w, series, prop, source, usedGlobals) {
        if (!w || !series || !series.id || !source) return false;
        const o = w.overrides;
        if (!o || typeof o !== 'object') return false;
        let changed = false;
        if (source.value !== undefined && !this._graphValuePresent(series[prop])) {
            series[prop] = source.value;
            changed = true;
        }
        const dest = 'graphSeries_' + series.id + '_' + prop;
        const auxKeys = source.auxKeys || [];
        for (let i = 0; i < auxKeys.length; i++) {
            if (this._copyGraphColorAux(source.auxSrc, auxKeys[i], o, dest)) changed = true;
        }
        if (source.topic && this._setSeriesColorBinding(w, 0, prop, source.topic)) changed = true;
        if (source.clearBinding && source.clearKey && source.clearBinding[source.clearKey] !== undefined) {
            delete source.clearBinding[source.clearKey];
            changed = true;
        }
        if (source.topic && usedGlobals && source.globalKey) usedGlobals[source.globalKey] = true;
        return changed;
    },

    /**
     * Bar outline colors moved from the widget onto every series. A topic or
     * color correction on the old key is copied onto each series, then removed.
     */
    _migrateGraphOutlineColorsToSeries: function (w) {
        if (!w || w.type !== 'graph' || !w.overrides) return false;
        const o = w.overrides;
        if (!Array.isArray(o.series) || !o.series.length) return false;
        const pairs = [
            { from: 'barOutlineColor', prop: 'positiveOutlineColor' },
            { from: 'negBarOutlineColor', prop: 'negativeOutlineColor' }
        ];
        const suffixes = this.TYPOGRAPHY_AUX_SUFFIXES;
        const b = (w.bindings && typeof w.bindings === 'object') ? w.bindings : null;
        let changed = false;
        for (let s = 0; s < o.series.length; s++) {
            const series = o.series[s];
            if (!series || typeof series !== 'object') continue;
            if (!series.id) {
                series.id = 's_' + String(w.id || '1').replace(/[^a-zA-Z0-9]/g, '') + (s ? ('_' + s) : '');
                changed = true;
            }
            for (let p = 0; p < pairs.length; p++) {
                const pair = pairs[p];
                if (typeof o[pair.from] === 'string' && o[pair.from] !== ''
                    && (typeof series[pair.prop] !== 'string' || series[pair.prop] === '')) {
                    series[pair.prop] = o[pair.from];
                    changed = true;
                }
                const topic = (b && typeof b[pair.from] === 'string' && b[pair.from] !== '') ? b[pair.from] : '';
                if (topic) {
                    if (!Array.isArray(b.series)) b.series = [];
                    if (!b.series[s] || typeof b.series[s] !== 'object') b.series[s] = {};
                    if (typeof b.series[s][pair.prop] !== 'string' || b.series[s][pair.prop] === '') {
                        b.series[s][pair.prop] = topic;
                        changed = true;
                    }
                }
                const dest = 'graphSeries_' + series.id + '_' + pair.prop;
                for (let i = 0; i < suffixes.length; i++) {
                    const srcKey = pair.from + suffixes[i];
                    if (!Object.prototype.hasOwnProperty.call(o, srcKey)) continue;
                    const dstKey = dest + suffixes[i];
                    if (!Object.prototype.hasOwnProperty.call(o, dstKey)) {
                        o[dstKey] = o[srcKey];
                        changed = true;
                    }
                }
            }
        }
        for (let p = 0; p < pairs.length; p++) {
            const from = pairs[p].from;
            if (Object.prototype.hasOwnProperty.call(o, from)) {
                delete o[from];
                changed = true;
            }
            for (let i = 0; i < suffixes.length; i++) {
                const srcKey = from + suffixes[i];
                if (!Object.prototype.hasOwnProperty.call(o, srcKey)) continue;
                delete o[srcKey];
                changed = true;
            }
            if (b && b[from] !== undefined) {
                delete b[from];
                changed = true;
            }
        }
        return changed;
    },

    _migrateGraphWidgetToSeries: function (w, masterBag, data, usedGlobals) {
        if (!w || w.type !== 'graph') return false;
        if (!w.overrides || typeof w.overrides !== 'object') w.overrides = {};
        const o = w.overrides;
        const bag = masterBag || {};
        const globals = data && data.globalBindings;
        let changed = false;
        const present = function (v) { return v !== undefined && v !== null && v !== ''; };
        const hasSeries = Array.isArray(o.series) && o.series.length > 0;
        const chartType = o.type || 'line';
        const sourceFor = (widgetKey, masterKeys, globalKey) => this._graphColorSource(
            o, w.bindings, bag, globals, widgetKey, masterKeys, globalKey
        );
        const install = (series, prop, source) => {
            if (this._installGraphColor(w, series, prop, source, usedGlobals)) changed = true;
        };
        if (!hasSeries) {
            const masterLine = present(bag.lineColor) ? bag.lineColor : (present(bag.graphLineCol) ? bag.graphLineCol : '@markerTint1');
            const masterFill = present(bag.fillColor) ? bag.fillColor : (present(bag.graphFillCol) ? bag.graphFillCol : masterLine);
            const masterNegFill = present(bag.negativeFillColor) ? bag.negativeFillColor : (present(bag.graphNegFillColor) ? bag.graphNegFillColor : masterFill);
            let masterOpacity = null;
            if (present(bag.fillOpacity)) masterOpacity = bag.fillOpacity;
            else if (bag.defaultGraphFillOpacity !== undefined && bag.defaultGraphFillOpacity !== null && bag.defaultGraphFillOpacity !== '') {
                masterOpacity = bag.defaultGraphFillOpacity;
            }
            const lineSrc = sourceFor('lineColor', ['lineColor', 'graphLineCol'], 'graphLineCol')
                || { value: masterLine, topic: '', auxSrc: null, auxKeys: [], clearBinding: null, globalKey: '' };
            const barSrc = sourceFor('barColor', ['barColor', 'defaultGraphBarColor'], 'defaultGraphBarColor');
            const negSrc = sourceFor('negFillCol', ['negFillCol', 'negativeFillColor', 'graphNegFillColor'], 'graphNegFillColor')
                || { value: masterNegFill, topic: '', auxSrc: bag, auxKeys: ['negativeFillColor', 'graphNegFillColor'], clearBinding: null, globalKey: '' };
            const fillSrc = sourceFor('fillCol', ['fillCol', 'fillColor', 'graphFillCol'], 'graphFillCol')
                || { value: masterFill, topic: '', auxSrc: bag, auxKeys: ['fillColor', 'graphFillCol'], clearBinding: null, globalKey: '' };
            const pointSrc = sourceFor('pointColor', ['pointColor', 'defaultGraphPointColor'], 'defaultGraphPointColor');
            // Old bars painted Bar Color on the positive body. A missing bar
            // color used the master Bar Color, including its topic and correction.
            const positiveSrc = (chartType === 'bar' && barSrc) ? barSrc : lineSrc;
            const negativeSrc = (chartType === 'bar') ? negSrc : lineSrc;
            let fillOn = true;
            if (o.fill === false) fillOn = false;
            else if (o.fill !== true && (bag.fill === false || bag.defaultGraphFill === false)) fillOn = false;
            let start = 0;
            if (fillOn) {
                if (o.fillOpacity !== undefined && o.fillOpacity !== null && o.fillOpacity !== '') start = o.fillOpacity;
                else if (masterOpacity != null) start = masterOpacity;
                else start = 40;
            }
            const topic = (w.bindings && typeof w.bindings.data === 'string') ? w.bindings.data : '';
            const fromTopic = this._graphSeriesNameFromTopic(topic);
            const series = {
                id: 's_' + String(w.id || '1').replace(/[^a-zA-Z0-9]/g, ''),
                name: fromTopic || 'Graph 1',
                nameLocked: false,
                visible: true,
                data: o.data != null ? String(o.data) : '',
                positiveStartOpacity: start,
                positiveEndOpacity: 0,
                negativeStartOpacity: start,
                negativeEndOpacity: 0
            };
            install(series, 'positiveColor', positiveSrc);
            install(series, 'negativeColor', negativeSrc);
            install(series, 'positiveFillColor', fillSrc);
            install(series, 'negativeFillColor', negSrc);
            if (pointSrc) install(series, 'pointColor', pointSrc);
            if (!present(series.positiveColor)) series.positiveColor = masterLine;
            if (!present(series.negativeColor)) series.negativeColor = series.positiveColor;
            if (!present(series.positiveFillColor)) series.positiveFillColor = masterFill;
            if (!present(series.negativeFillColor)) series.negativeFillColor = masterNegFill;
            if (o.lineWidth !== undefined && o.lineWidth !== null && o.lineWidth !== '') series.lineWidth = o.lineWidth;
            if (present(o.pointColor)) series.pointColor = o.pointColor;
            o.series = [series];
            if (o.showLegend === undefined) o.showLegend = false;
            changed = true;
        } else if (o.series[0] && typeof o.series[0] === 'object') {
            const series = o.series[0];
            if (!series.id) {
                series.id = 's_' + String(w.id || '1').replace(/[^a-zA-Z0-9]/g, '');
                changed = true;
            }
            const barSrc = sourceFor('barColor', ['barColor', 'defaultGraphBarColor'], 'defaultGraphBarColor');
            const lineSrc = sourceFor('lineColor', ['lineColor', 'graphLineCol'], 'graphLineCol');
            const negSrc = sourceFor('negFillCol', ['negFillCol', 'negativeFillColor', 'graphNegFillColor'], 'graphNegFillColor');
            const fillSrc = sourceFor('fillCol', ['fillCol', 'fillColor', 'graphFillCol'], 'graphFillCol');
            const pointSrc = sourceFor('pointColor', ['pointColor', 'defaultGraphPointColor'], 'defaultGraphPointColor');
            const linkInherited = (prop, src) => {
                if (!src) return;
                const own = (src.auxSrc === o);
                const empty = !present(series[prop]);
                const matches = src.value !== undefined && this._graphColorSame(series[prop], src.value);
                const lightObject = chartType === 'bar' && prop === 'positiveColor'
                    && series[prop] && typeof series[prop] === 'object';
                if (!(own || empty || matches || lightObject)) return;
                if (own && src.value !== undefined && !this._graphColorSame(series[prop], src.value)) {
                    series[prop] = '';
                }
                install(series, prop, src);
            };
            if (chartType === 'bar') linkInherited('positiveColor', barSrc);
            else linkInherited('positiveColor', lineSrc);
            if (chartType === 'bar') linkInherited('negativeColor', negSrc);
            else linkInherited('negativeColor', lineSrc);
            linkInherited('positiveFillColor', fillSrc);
            linkInherited('negativeFillColor', negSrc);
            linkInherited('pointColor', pointSrc);
        }
        if (w.bindings && w.bindings.data !== undefined) {
            if (typeof w.bindings.data === 'string' && w.bindings.data !== '') {
                if (!Array.isArray(w.bindings.series)) w.bindings.series = [];
                if (!w.bindings.series[0] || typeof w.bindings.series[0] !== 'object') w.bindings.series[0] = {};
                if (w.bindings.series[0].data == null || w.bindings.series[0].data === '') {
                    w.bindings.series[0].data = w.bindings.data;
                }
            }
            // Pre-2.2 saves stored `false` for a cleared topic; nothing reads it now.
            delete w.bindings.data;
            changed = true;
        }
        const firstSeriesId = (o.series && o.series[0] && o.series[0].id)
            ? o.series[0].id
            : ('s_' + String(w.id || '1').replace(/[^a-zA-Z0-9]/g, ''));
        if (this._copyGraphColorAux(o, 'data', o, 'graphSeries_' + firstSeriesId + '_data')) {
            changed = true;
        }
        for (let si = 0; si < this.TYPOGRAPHY_AUX_SUFFIXES.length; si++) {
            const dataAuxKey = 'data' + this.TYPOGRAPHY_AUX_SUFFIXES[si];
            if (Object.prototype.hasOwnProperty.call(o, dataAuxKey)) {
                delete o[dataAuxKey];
                changed = true;
            }
        }
        if (this._migrateGraphOutlineColorsToSeries(w)) changed = true;
        const rootDrop = ['data', 'lineWidth', 'lineColor', 'fill', 'fillOpacity', 'fillCol', 'negFillCol', 'barColor', 'pointColor', 'linearTimeScale'];
        if (this._dropKeysWithCorrections(o, rootDrop)) changed = true;
        return changed;
    },

    _forEachWidget: function (migratedData, fn) {
        if (!migratedData || typeof migratedData !== 'object' || typeof fn !== 'function') return;
        const widgets = migratedData.widgets && typeof migratedData.widgets === 'object' ? migratedData.widgets : {};
        Object.keys(widgets).forEach((id) => {
            const w = widgets[id];
            if (w) fn(w);
        });
        const groups = migratedData.groups && typeof migratedData.groups === 'object' ? migratedData.groups : {};
        Object.keys(groups).forEach((gid) => {
            const g = groups[gid];
            const nested = g && g.widgets && typeof g.widgets === 'object' ? g.widgets : {};
            Object.keys(nested).forEach((wid) => {
                const w = nested[wid];
                if (w) fn(w);
            });
        });
    },

    /**
     * V2 Responsive Columns refactor: responsive widget settings moved from flat
     * `responsiveOrder` / `responsiveColumnSpan` / `responsiveHeight` keys into the
     * canonical nested `overrides.layout.responsive` blob so they cannot bleed into
     * fixed-mode `x/y/width/height`. Also remaps removed engines (flex/masonry/
     * subgrid/bento) on the master layout to the closest surviving engine.
     * Idempotent: a widget flagged `overrides._layoutResponsiveV2` is skipped.
     */
    _RESPONSIVE_REMOVED_ENGINES: { flex: true, masonry: true, subgrid: true, bento: true },

    _dashboardHasLegacyResponsiveLayoutKeys: function (data) {
        if (!data || typeof data !== 'object') return false;
        // Master: removed engine values on the responsive column mode.
        const env = data.master && data.master.environment && typeof data.master.environment === 'object'
            ? data.master.environment : null;
        const layout = env && env.layout && typeof env.layout === 'object' ? env.layout : null;
        const resp = layout && layout.responsive && typeof layout.responsive === 'object' ? layout.responsive : null;
        if (resp && typeof resp.columnMode === 'string'
                && Object.prototype.hasOwnProperty.call(this._RESPONSIVE_REMOVED_ENGINES, resp.columnMode)) {
            return true;
        }
        // Widget: any flat responsive* override key, or a missing migration flag.
        let found = false;
        this._forEachWidget(data, (w) => {
            if (found) return;
            const o = w && w.overrides && typeof w.overrides === 'object' ? w.overrides : null;
            if (!o) return;
            if (o.responsiveOrder !== undefined || o.responsiveColumnSpan !== undefined
                    || o.responsiveHeight !== undefined) {
                found = true;
            }
        });
        if (!found && data.master && typeof data.master === 'object') {
            if (data.master.defaultGraphAutoMin !== undefined || data.master.defaultGraphAutoMax !== undefined) {
                found = true;
            }
        }
        return found;
    },

    /** Map a removed responsive engine id to the closest surviving engine. */
    _remapResponsiveEngine: function (raw) {
        const engine = typeof raw === 'string' ? raw : '';
        if (Object.prototype.hasOwnProperty.call(this._RESPONSIVE_REMOVED_ENGINES, engine)) {
            // subgrid was a fixed 6-col grid -> fixed-columns; others -> auto-fit.
            return engine === 'subgrid' ? 'fixed-columns' : 'grid-autofit';
        }
        return engine || 'grid-autofit';
    },

    /** Strip removed per-widget Row Span setting from a `layout.responsive` blob. */
    _stripResponsiveRowSpanSetting: function (resp) {
        if (!resp || typeof resp !== 'object') return false;
        if (!Object.prototype.hasOwnProperty.call(resp, 'rowSpan')) return false;
        delete resp.rowSpan;
        return true;
    },

    /**
     * Lift flat responsive widget keys into `overrides.layout.responsive` and strip
     * the flat copies. The `_layoutResponsiveV2` flag is set and stripped from runtime
     * config by `BaseWidget.get config`.
     */
    _migrateResponsiveLayoutOverridesToNested: function (o) {
        if (!o || typeof o !== 'object') return false;
        if (o._layoutResponsiveV2 === true) {
            // Still strip any stray flat keys from an incomplete prior pass.
            let stripped = false;
            if (o.responsiveOrder !== undefined) { delete o.responsiveOrder; stripped = true; }
            if (o.responsiveColumnSpan !== undefined) { delete o.responsiveColumnSpan; stripped = true; }
            if (o.responsiveHeight !== undefined) { delete o.responsiveHeight; stripped = true; }
            if (o.responsiveRowSpan !== undefined) { delete o.responsiveRowSpan; stripped = true; }
            if (o.layout && o.layout.responsive && this._stripResponsiveRowSpanSetting(o.layout.responsive)) {
                stripped = true;
            }
            return stripped;
        }
        const hasFlat = o.responsiveOrder !== undefined
            || o.responsiveColumnSpan !== undefined
            || o.responsiveHeight !== undefined;
        const existing = o.layout && o.layout.responsive && typeof o.layout.responsive === 'object'
            ? o.layout.responsive : null;
        if (!hasFlat && existing) {
            o._layoutResponsiveV2 = true;
            return this._stripResponsiveRowSpanSetting(existing);
        }
        if (!hasFlat && !existing) return false;

        const layoutNode = (o.layout && typeof o.layout === 'object') ? { ...o.layout } : {};
        const resp = existing ? { ...existing } : {};

        if (o.responsiveOrder !== undefined) {
            const n = parseInt(o.responsiveOrder, 10);
            if (Number.isFinite(n)) resp.order = n;
            delete o.responsiveOrder;
        }
        if (o.responsiveColumnSpan !== undefined) {
            const n = parseInt(o.responsiveColumnSpan, 10);
            if (Number.isFinite(n) && n > 0) resp.columnSpan = n;
            delete o.responsiveColumnSpan;
        }
        if (o.responsiveHeight !== undefined) {
            const n = Number(o.responsiveHeight);
            if (Number.isFinite(n) && n >= 0) resp.height = n;
            delete o.responsiveHeight;
        }
        this._stripResponsiveRowSpanSetting(resp);
        if (resp.preferredColumn === undefined) resp.preferredColumn = 0;
        if (resp.hidden === undefined) resp.hidden = false;

        layoutNode.responsive = resp;
        o.layout = layoutNode;
        o._layoutResponsiveV2 = true;
        return true;
    },

    _migrateResponsiveLayoutV2: function (migratedData) {
        if (!migratedData || typeof migratedData !== 'object') return false;
        let changed = false;

        // Master: remap removed engines.
        if (migratedData.master && migratedData.master.environment
                && migratedData.master.environment.layout
                && migratedData.master.environment.layout.responsive
                && typeof migratedData.master.environment.layout.responsive.columnMode === 'string') {
            const resp = migratedData.master.environment.layout.responsive;
            const remapped = this._remapResponsiveEngine(resp.columnMode);
            if (remapped !== resp.columnMode) {
                resp.columnMode = remapped;
                changed = true;
            }
        }

        // Widgets: lift flat keys into nested blob.
        this._forEachWidget(migratedData, (w) => {
            if (!w || !w.overrides || typeof w.overrides !== 'object') return;
            if (this._migrateResponsiveLayoutOverridesToNested(w.overrides)) changed = true;
        });

        // Groups: strip removed Row Span setting from nested responsive layout.
        const groups = migratedData.groups && typeof migratedData.groups === 'object' ? migratedData.groups : {};
        Object.keys(groups).forEach((gid) => {
            const g = groups[gid];
            if (!g || !g.layout || !g.layout.responsive || typeof g.layout.responsive !== 'object') return;
            if (this._stripResponsiveRowSpanSetting(g.layout.responsive)) changed = true;
        });

        return changed;
    },

    /**
     * Nested `icons.on|off`: boolean `filled` → string `weight`; strip `filled`.
     * Bindings: `icons.on|off.filled` → `weight` (same topic value).
     */
    _migratePhosphorIconSlotsFilledToWeightV186: function (icons, bindingsIcons) {
        if (!icons || typeof icons !== 'object') return false;
        let changed = false;
        ['on', 'off'].forEach((slotKey) => {
            const slot = icons[slotKey];
            if (!slot || typeof slot !== 'object') return;
            const weightMissing =
                slot.weight === undefined ||
                slot.weight === null ||
                String(slot.weight).trim() === '';
            if (weightMissing && slot.filled !== undefined) {
                slot.weight = slot.filled === false ? 'regular' : 'fill';
                changed = true;
            }
            if (Object.prototype.hasOwnProperty.call(slot, 'filled')) {
                delete slot.filled;
                changed = true;
            }
        });
        if (bindingsIcons && typeof bindingsIcons === 'object') {
            ['on', 'off'].forEach((slotKey) => {
                const b = bindingsIcons[slotKey];
                if (!b || typeof b !== 'object') return;
                if (Object.prototype.hasOwnProperty.call(b, 'filled')) {
                    b.weight = b.filled;
                    delete b.filled;
                    changed = true;
                }
            });
        }
        return changed;
    },

    _migrateDashboardIconWeightV186: function (migratedData) {
        let changed = false;
        this._forEachWidget(migratedData, (w) => {
            if (!w || !w.overrides) return;
            if (w.type === 'switch') {
                const o = w.overrides;
                if (o.icons && typeof o.icons === 'object') {
                    const bIcons =
                        w.bindings && w.bindings.icons && typeof w.bindings.icons === 'object'
                            ? w.bindings.icons
                            : null;
                    if (this._migratePhosphorIconSlotsFilledToWeightV186(o.icons, bIcons)) changed = true;
                }
                if (o._switchIconsV2 === true) {
                    delete o._switchIconsV2;
                    o._switchIconsV3 = true;
                    changed = true;
                }
            } else if (w.type === 'menu' && Array.isArray(w.overrides.menuItems)) {
                w.overrides.menuItems.forEach((it, idx) => {
                    if (!it || !it.icons || typeof it.icons !== 'object') return;
                    const bRow =
                        w.bindings && Array.isArray(w.bindings.menuItems) ? w.bindings.menuItems[idx] : null;
                    const bIcons = bRow && bRow.icons && typeof bRow.icons === 'object' ? bRow.icons : null;
                    if (this._migratePhosphorIconSlotsFilledToWeightV186(it.icons, bIcons)) changed = true;
                });
            }
        });
        return changed;
    },

    _toFiniteNumber: function (raw, fallback) {
        const n = Number(raw);
        if (Number.isFinite(n)) return n;
        const fb = Number(fallback);
        return Number.isFinite(fb) ? fb : 0;
    },

    _clampNumber: function (raw, fallback, min, max) {
        let out = this._toFiniteNumber(raw, fallback);
        if (min !== undefined && min !== null) {
            const mn = this._toFiniteNumber(min, out);
            if (out < mn) out = mn;
        }
        if (max !== undefined && max !== null) {
            const mx = this._toFiniteNumber(max, out);
            if (out > mx) out = mx;
        }
        return out;
    },

    _normalizeNumberKey: function (obj, key, fallback, options) {
        if (!obj || typeof obj !== 'object') return false;
        options = options || {};
        if (!Object.prototype.hasOwnProperty.call(obj, key) && options.writeWhenMissing !== true) {
            return false;
        }
        const current = obj[key];
        const normalized = this._clampNumber(
            current,
            fallback,
            options.min !== undefined ? options.min : null,
            options.max !== undefined ? options.max : null
        );
        if (options.integer === true) {
            const rounded = Math.floor(normalized);
            if (current !== rounded) {
                obj[key] = rounded;
                return true;
            }
            return false;
        }
        if (current !== normalized) {
            obj[key] = normalized;
            return true;
        }
        return false;
    },

    _normalizeWidgetLayoutOverrides: function (o) {
        if (!o || typeof o !== 'object') return false;
        let changed = false;
        changed = this._normalizeNumberKey(o, 'x', 400) || changed;
        changed = this._normalizeNumberKey(o, 'y', 300) || changed;
        changed = this._normalizeNumberKey(o, 'width', 260, { min: 1 }) || changed;
        changed = this._normalizeNumberKey(o, 'height', 300, { min: 1 }) || changed;
        changed = this._normalizeNumberKey(o, 'padding', 0, { min: 0 }) || changed;
        return changed;
    },

    _migrateWidgetNumericsV183: function (migratedData) {
        if (!migratedData || typeof migratedData !== 'object') return false;
        const master = migratedData.master && typeof migratedData.master === 'object' ? migratedData.master : {};
        let changed = false;

        changed = this._normalizeNumberKey(master, 'defaultGraphAxisOffY', 10, { writeWhenMissing: true }) || changed;

        this._forEachWidget(migratedData, (w) => {
            if (!w) return;
            const o = (w.overrides && typeof w.overrides === 'object') ? w.overrides : (w.overrides = {});
            changed = this._normalizeWidgetLayoutOverrides(o) || changed;

            if (w.type === 'graph') {
                changed = this._normalizeNumberKey(
                    o,
                    'axisOffY',
                    master.defaultGraphAxisOffY !== undefined ? master.defaultGraphAxisOffY : 10
                ) || changed;
                changed = this._normalizeNumberKey(o, 'axisOffX', 5) || changed;
                changed = this._normalizeNumberKey(o, 'axisWidthY', 0, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'axisResX', 5, { min: 1, integer: true }) || changed;
                changed = this._normalizeNumberKey(o, 'axisResY', 4, { min: 2, integer: true }) || changed;
                changed = this._normalizeNumberKey(o, 'axisXFontSize', 10, { min: 1 }) || changed;
                changed = this._normalizeNumberKey(o, 'lineWidth', 2, { min: 1 }) || changed;
                changed = this._normalizeNumberKey(o, 'barGap', 2, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'barRadius', 4, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'pointSize', 4, { min: 1 }) || changed;
            } else if (w.type === 'gauge') {
                changed = this._normalizeNumberKey(o, 'min', 0) || changed;
                changed = this._normalizeNumberKey(o, 'max', 100) || changed;
                changed = this._normalizeNumberKey(o, 'value', 0) || changed;
                changed = this._normalizeNumberKey(o, 'baselineValue', 0) || changed;
                changed = this._normalizeNumberKey(o, 'barThickness', 12, { min: 1 }) || changed;
                changed = this._normalizeNumberKey(o, 'trackThickness', 16, { min: 1 }) || changed;
                changed = this._normalizeNumberKey(o, 'trackOutlineWidth', 0, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'axisFontSize', 11, { min: 1 }) || changed;
                changed = this._normalizeNumberKey(o, 'labelCount', 5, { min: 2, integer: true }) || changed;
                changed = this._normalizeNumberKey(o, 'tickMarkLength', 8, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'tickMarkThickness', 1.5, { min: 0 }) || changed;
            } else if (w.type === 'slider') {
                changed = this._normalizeNumberKey(o, 'min', 0) || changed;
                changed = this._normalizeNumberKey(o, 'max', 100) || changed;
                changed = this._normalizeNumberKey(o, 'value', 0) || changed;
                changed = this._normalizeNumberKey(o, 'trackThickness', 24, { min: 1 }) || changed;
                changed = this._normalizeNumberKey(o, 'fillThickness', 24, { min: 1 }) || changed;
                changed = this._normalizeNumberKey(o, 'thumbSize', 20, { min: 1 }) || changed;
                changed = this._normalizeNumberKey(o, 'trackOutlineWidth', 0, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'stepSize', 0.1, { min: 0.0000001 }) || changed;
            } else if (w.type === 'arrow') {
                changed = this._normalizeNumberKey(o, 'fromX', 100) || changed;
                changed = this._normalizeNumberKey(o, 'fromY', 100) || changed;
                changed = this._normalizeNumberKey(o, 'toX', 300) || changed;
                changed = this._normalizeNumberKey(o, 'toY', 100) || changed;
                changed = this._normalizeNumberKey(o, 'thickness', 10, { min: 1 }) || changed;
                changed = this._normalizeNumberKey(o, 'headSize', 20, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'lineRadius', 0, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'pathBendRadius', 0, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'flowWidth', 80, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'gradientWidth', 100, { min: 0, max: 100 }) || changed;
                changed = this._normalizeNumberKey(o, 'glowWidth', 8, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'glowOpacity', 75, { min: 0, max: 100 }) || changed;
                changed = this._normalizeNumberKey(o, 'animSpeed', 1.5, { min: 0.1 }) || changed;
                if (Array.isArray(o.customPoints)) {
                    const nextPoints = [];
                    let localChanged = false;
                    for (let i = 0; i < o.customPoints.length; i++) {
                        const pt = o.customPoints[i];
                        if (!pt || typeof pt !== 'object') {
                            localChanged = true;
                            continue;
                        }
                        const nx = this._toFiniteNumber(pt.x, 0);
                        const ny = this._toFiniteNumber(pt.y, 0);
                        if (pt.x !== nx || pt.y !== ny) localChanged = true;
                        nextPoints.push({ x: nx, y: ny });
                    }
                    if (localChanged) {
                        o.customPoints = nextPoints;
                        changed = true;
                    }
                }
            } else if (w.type === 'lightgrid') {
                changed = this._normalizeNumberKey(o, 'cols', 1, { min: 1, integer: true }) || changed;
                changed = this._normalizeNumberKey(o, 'itemHeight', 0, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'itemWidth', 0, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'itemSpacing', 0, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'rowGap', 0, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'presetCols', 4, { min: 1, integer: true }) || changed;
                changed = this._normalizeNumberKey(o, 'presetRows', 4, { min: 1, integer: true }) || changed;
                changed = this._normalizeNumberKey(o, 'presetGap', 8, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'iconSize', 24, { min: 1 }) || changed;
                changed = this._normalizeNumberKey(o, 'popoverW', 260, { min: 100 }) || changed;
                changed = this._normalizeNumberKey(o, 'popoverH', 360, { min: 150 }) || changed;
                changed = this._normalizeNumberKey(o, 'popoverOffX', 280) || changed;
                changed = this._normalizeNumberKey(o, 'popoverOffY', 0) || changed;
                changed = this._normalizeNumberKey(o, 'popoverCornerRadius', 16, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'popoverBorderWidth', 1, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'popoverBorderOpacity', 100, { min: 0, max: 100 }) || changed;
                changed = this._normalizeNumberKey(o, 'popoverGlowRadius', 40, { min: 0 }) || changed;
                changed = this._normalizeNumberKey(o, 'popoverGlowOpacity', 50, { min: 0, max: 100 }) || changed;
                changed = this._normalizeNumberKey(o, 'sliderTrackH', 36, { min: 1 }) || changed;
                changed = this._normalizeNumberKey(o, 'sliderFillH', 24, { min: 1 }) || changed;
                changed = this._normalizeNumberKey(o, 'sliderThumbSz', 29, { min: 1 }) || changed;
            }
        });

        return changed;
    },

    /**
     * Graph axis spacing normalization (pre-1.8.3):
     * - Ensures flat master has numeric `defaultGraphAxisOffY`
     * - Ensures every graph override has numeric `axisOffY`
     */
    _migrateGraphAxisDefaultsV183: function (migratedData) {
        if (!migratedData || typeof migratedData !== 'object') return false;
        const master = migratedData.master && typeof migratedData.master === 'object' ? migratedData.master : {};
        let changed = false;

        const masterAxisOffY = Number(master.defaultGraphAxisOffY);
        if (!Number.isFinite(masterAxisOffY)) {
            master.defaultGraphAxisOffY = 10;
            changed = true;
        }

        const fallbackRaw = Number(master.defaultGraphAxisOffY);
        const fallback = Number.isFinite(fallbackRaw) ? fallbackRaw : 10;

        this._forEachWidget(migratedData, (w) => {
            if (!w || w.type !== 'graph') return;
            const o = (w.overrides && typeof w.overrides === 'object') ? w.overrides : (w.overrides = {});
            const axisOffY = Number(o.axisOffY);
            if (!Number.isFinite(axisOffY)) {
                o.axisOffY = fallback;
                changed = true;
            }
        });

        return changed;
    },

    /**
     * Graph X-axis: legacy dateFormat + time-only timeFormat → timeFormat DateHours (idempotent).
     */
    _migrateGraphXAxisDateFormatV190: function (migratedData) {
        if (!migratedData || typeof migratedData !== 'object') return false;
        let changed = false;

        const migratePair = function (obj, timeKey, dateKey) {
            if (!obj || typeof obj !== 'object') return;
            const timeFmt = obj[timeKey];
            if (timeFmt === 'none') {
                obj[timeKey] = 'Datapoints';
                changed = true;
            }
            const dateFmt = obj[dateKey];
            if (dateFmt === undefined || dateFmt === null || dateFmt === '' || dateFmt === 'none') return;
            const resolvedTimeFmt = obj[timeKey];
            if (resolvedTimeFmt === 'DateHours' || resolvedTimeFmt === 'Date') return;
            obj[timeKey] = 'DateHours';
            changed = true;
        };

        if (migratedData.master && typeof migratedData.master === 'object') {
            migratePair(migratedData.master, 'defaultGraphTimeFormat', 'defaultGraphDateFormat');
        }

        this._forEachWidget(migratedData, function (w) {
            if (!w || w.type !== 'graph' || !w.overrides) return;
            migratePair(w.overrides, 'timeFormat', 'dateFormat');
        });

        return changed;
    },

    /**
     * Rewrite old Label text content so it renders the same in the Markdown-based Text widget.
     * Old label used single-asterisk segments as bold; CommonMark uses ** for bold.
     */
    _convertOldLabelTextToMarkdown: function (src) {
        if (src === undefined || src === null) return '';
        const s = String(src);
        return s
            .replace(/\*([^\*\n]+)\*/g, function (_m, inner) {
                return '**' + String(inner).trim() + '**';
            })
            .replace(/_([^_\n]+)_/g, function (_m, inner) {
                return '_' + String(inner).trim() + '_';
            });
    },

    /**
     * True if overrides.text contains a line that old LabelWidget treated as a header: `#` then whitespace (ATX h1), not `##…`.
     * Matches `LabelWidget._parseText` (see `previous_versions/label.js`).
     */
    _labelOverrideTextHasLegacyAtxH1: function (text) {
        if (text === undefined || text === null) return false;
        const lines = String(text).split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            if (/^\s*#\s+(?!#)/.test(lines[i])) return true;
        }
        return false;
    },

    /** True when old Label parser features are used (`# `, `- `, `*bold*`, `_italic_`). */
    _labelOverrideHasLegacyParserMarkdown: function (text) {
        if (text === undefined || text === null) return false;
        const s = String(text);
        const lines = s.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            if (/^\s*#\s+(?!#)/.test(lines[i])) return true;
            if (/^\s*-\s+/.test(lines[i])) return true;
        }
        if (/\*([^\*\n]+)\*/.test(s)) return true;
        if (/_([^_\n]+)_/.test(s)) return true;
        return false;
    },

    /** Copy global legacy label defaults to new labelDefault* keys (idempotent). */
    _migrateLabelMasterDefaultsV180: function (master) {
        if (!master || typeof master !== 'object') return false;
        let changed = false;
        const setIfMissing = function (targetKey, value) {
            if (master[targetKey] !== undefined) return;
            master[targetKey] = value;
            changed = true;
        };
        setIfMissing('labelDefaultFont', master.fontFamily || "'Inter', sans-serif");
        setIfMissing('labelDefaultFs', master.defaultFsGeneral != null ? master.defaultFsGeneral : 24);
        setIfMissing('labelDefaultAlign', master.defaultTextAlign || 'center');
        setIfMissing('labelDefaultCase', master.defaultLabelCase || 'uppercase');
        setIfMissing('labelDefaultBold', master.defaultLabelBold === true);
        setIfMissing('labelDefaultItalic', master.defaultLabelItalic === true);
        setIfMissing('labelDefaultCol', master.defaultColVal || '@text');
        setIfMissing('labelDefaultOpacity', 100);
        setIfMissing('labelDefaultOffX', 0);
        setIfMissing('labelDefaultOffY', 0);
        setIfMissing('labelDefaultWAuto', false);
        setIfMissing('labelDefaultHAuto', false);
        return changed;
    },

    /**
     * Legacy label -> new lightweight label path for plain lines:
     * requires `bgVisible === false` and no old parser markdown features.
     */
    _migrateLegacyLabelToNewLabel: function (w) {
        if (!w || w.type !== 'label') return false;
        const o = (w.overrides && typeof w.overrides === 'object') ? w.overrides : (w.overrides = {});
        if (o.bgVisible !== false) return false;
        if (this._labelOverrideHasLegacyParserMarkdown(o.text)) return false;

        const typ = Object.assign({}, (o.typography && typeof o.typography === 'object') ? o.typography : {});
        const lbl = Object.assign({}, (typ.label && typeof typ.label === 'object') ? typ.label : {});

        if (o.fontFamily !== undefined && lbl.fontFamily === undefined) lbl.fontFamily = o.fontFamily;
        if (o.fontSize !== undefined && lbl.fontSize === undefined) lbl.fontSize = o.fontSize;
        if (o.textColor !== undefined && lbl.color === undefined) lbl.color = o.textColor;

        typ.label = lbl;
        o.typography = typ;

        const legacy = this.LABEL_LEGACY_FLAT_TYPO_KEYS;
        legacy.forEach(function (k) { delete o[k]; });

        // Preserve old Label text settings that exist in the new Label widget.
        if (o.textVerticalAlign !== undefined && o.textVerticalAlign !== null) {
            const va = String(o.textVerticalAlign).toLowerCase();
            if (va === 'top' || va === 'middle' || va === 'bottom') o.textVerticalAlign = va;
            else delete o.textVerticalAlign;
        }
        if (o.textRotation !== undefined && o.textRotation !== null && o.textRotation !== '') {
            const r = Number(o.textRotation);
            o.textRotation = Number.isFinite(r) ? r : 0;
        }

        o.labelWAuto = false;
        o.labelHAuto = false;
        return true;
    },

    /**
     * Migrate one widget: `type: "label"` → `type: "text"`, nested typography, text rewrite, default align/case.
     */
    _migrateLabelWidgetToText: function (w, master) {
        if (!w || w.type !== 'label') return false;
        const o = (w.overrides && typeof w.overrides === 'object') ? w.overrides : (w.overrides = {});

        const hasLegacyH1 = this._labelOverrideTextHasLegacyAtxH1(o.text);
        const m = (master && typeof master === 'object') ? master : {};
        const typ = Object.assign({}, (o.typography && typeof o.typography === 'object') ? o.typography : {});
        const para = Object.assign({}, (typ.mdParagraph && typeof typ.mdParagraph === 'object') ? typ.mdParagraph : {});

        // Copy explicitly set legacy flat keys first.
        if (o.fontFamily !== undefined && para.fontFamily === undefined) para.fontFamily = o.fontFamily;
        if (o.textColor !== undefined && para.color === undefined) para.color = o.textColor;

        // Always preserve effective fontSize and color so migrated labels do not fall back
        // to the text widget's smaller paragraph defaults (12 px / @textMuted).
        if (para.fontSize === undefined) {
            para.fontSize = o.fontSize !== undefined ? o.fontSize : (m.defaultFsGeneral || 24);
        }
        if (para.color === undefined) {
            para.color = m.defaultColVal || '@text';
        }

        // Remove all legacy flat keys.
        const legacy = this.LABEL_LEGACY_FLAT_TYPO_KEYS;
        legacy.forEach(function (k) { delete o[k]; });

        typ.mdParagraph = para;
        if (hasLegacyH1) {
            const baseNum = Number(para.fontSize);
            const baseFs = Number.isFinite(baseNum) ? baseNum : (Number(m.defaultFsGeneral) || 24);
            const h1Fs = Math.round(baseFs * this.LABEL_TO_TEXT_LEGACY_H1_EM);
            const prevH1 = (typ.mdH1 && typeof typ.mdH1 === 'object') ? typ.mdH1 : {};
            const mdH1 = Object.assign({}, prevH1);
            if (para.fontFamily !== undefined && para.fontFamily !== null && String(para.fontFamily).trim() !== '') {
                mdH1.fontFamily = para.fontFamily;
            }
            mdH1.fontSize = h1Fs;
            if (para.color !== undefined && para.color !== null && String(para.color).trim() !== '') {
                mdH1.color = para.color;
            }
            mdH1.bold = true;
            typ.mdH1 = mdH1;
        }
        o.typography = typ;

        if (o.text !== undefined && o.text !== null) {
            o.text = this._convertOldLabelTextToMarkdown(o.text);
        }

        if (o.textAlign === undefined || o.textAlign === null || o.textAlign === '') {
            o.textAlign = m.defaultTextAlign || 'center';
        }
        if (o.labelCase === undefined || o.labelCase === null || o.labelCase === '') {
            o.labelCase = m.defaultLabelCase || 'uppercase';
        }

        w.type = 'text';
        return true;
    },

    /** Flat `imgOn` / `typography.*` keys → nested `bindings.icons` / `bindings.typography` (v1.6.0). */
    _migrateSwitchBindingsFlatToNested: function (b) {
        if (!b || typeof b !== 'object' || typeof BindingsTree === 'undefined') return false;
        const spec = typeof SwitchWidget !== 'undefined' ? SwitchWidget.getNestedBindingOverlaySpec() : null;
        if (!spec || !spec.length) return false;
        let changed = false;
        spec.forEach(({ path, configKey }) => {
            if (typeof b[configKey] !== 'string') return;
            const topic = b[configKey];
            BindingsTree.setAtPath(b, path, topic);
            delete b[configKey];
            changed = true;
        });
        return changed;
    },

    /** Flat `menuItem_i_prop` → `bindings.menuItems[i]` tree (v1.6.0). */
    _migrateMenuBindingsFlatToNested: function (b) {
        if (!b || typeof b !== 'object' || typeof BindingsTree === 'undefined' || typeof MenuWidget === 'undefined') return false;
        const keys = Object.keys(b).filter((k) => /^menuItem_\d+_/.test(k));
        if (keys.length === 0) return false;
        keys.forEach((k) => {
            const m = k.match(/^menuItem_(\d+)_(.+)$/);
            if (!m) return;
            const idx = parseInt(m[1], 10);
            const prop = m[2];
            const val = b[k];
            if (typeof val !== 'string') return;
            const path = MenuWidget.menuItemBindingPath(idx, prop);
            BindingsTree.setAtPath(b, path, val);
            delete b[k];
        });
        return true;
    },

    _migrateWidgetBindingsNestedV160: function (w) {
        if (!w || !w.bindings || typeof w.bindings !== 'object') return false;
        if (w.type === 'switch') {
            return this._migrateSwitchBindingsFlatToNested(w.bindings);
        }
        if (w.type === 'menu') {
            return this._migrateMenuBindingsFlatToNested(w.bindings);
        }
        if (w.type === 'gauge') {
            return this._migrateGaugeBindingsFlatToNested(w.bindings);
        }
        return false;
    },

    /**
     * Clock (pre-1.7.0): flat `label*` / `num*` on overrides → nested `typography.groupLabel` /
     * `typography.analogNumbers`. Also lifts stray flat `clockAnalogNum*` / `clockGroupLabel*` on overrides
     * into nested typography (editor sometimes persisted placeholders that blocked `take`-only merges).
     */
    _migrateClockOverridesToCanonical: function (o) {
        if (!o || typeof o !== 'object') return false;

        const typoKeys = this.CLOCK_GROUP_LABEL_LEGACY_KEYS;
        const numKeys = this.CLOCK_ANALOG_LEGACY_KEYS;
        const hasTypoLegacy = typoKeys.some((k) => o[k] !== undefined);
        const hasNumLegacy = numKeys.some((k) => o[k] !== undefined);
        const hasGroupFlat = this.CLOCK_GROUP_LABEL_FLAT_INSTANCE_KEYS.some((k) => o[k] !== undefined);
        const hasAnalogFlat = this.CLOCK_ANALOG_FLAT_INSTANCE_KEYS.some((k) => o[k] !== undefined);

        if (!hasTypoLegacy && !hasNumLegacy && !hasGroupFlat && !hasAnalogFlat) return false;

        const setNestedString = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            const s = String(raw).trim();
            if (!s) return false;
            block[prop] = raw;
            return true;
        };

        const setNestedBool = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            block[prop] = !!raw;
            return true;
        };

        const setNestedFontSize = (block, raw) => {
            if (raw === undefined || raw === null) return false;
            const n = Number(raw);
            if (Number.isFinite(n)) {
                block.fontSize = n;
                return true;
            }
            const s = String(raw).trim();
            if (!s) return false;
            block.fontSize = raw;
            return true;
        };

        const setNestedOpacity = (block, raw) => {
            if (raw === undefined || raw === null || String(raw).trim() === '') return false;
            const n = Number(raw);
            block.opacity = Number.isFinite(n) ? n : raw;
            return true;
        };

        const analogFlatToNested = {
            clockAnalogNumFont: 'fontFamily',
            clockAnalogNumFs: 'fontSize',
            clockAnalogNumAlign: 'textAlign',
            clockAnalogNumCase: 'textTransform',
            clockAnalogNumBold: 'bold',
            clockAnalogNumItalic: 'italic',
            clockAnalogNumCol: 'color',
            clockAnalogNumColOff: 'colorOff',
            clockAnalogNumOpacity: 'opacity',
            clockAnalogNumOffX: 'offsetX',
            clockAnalogNumOffY: 'offsetY'
        };

        const groupFlatToNested = {
            clockGroupLabelFont: 'fontFamily',
            clockGroupLabelFs: 'fontSize',
            clockGroupLabelAlign: 'textAlign',
            clockGroupLabelCase: 'textTransform',
            clockGroupLabelBold: 'bold',
            clockGroupLabelItalic: 'italic',
            clockGroupLabelCol: 'color',
            clockGroupLabelOpacity: 'opacity',
            clockGroupLabelOffX: 'offsetX',
            clockGroupLabelOffY: 'offsetY'
        };

        let changed = false;
        const typ = { ...(o.typography && typeof o.typography === 'object' ? o.typography : {}) };

        if (hasTypoLegacy) {
            const gl = { ...(typ.groupLabel && typeof typ.groupLabel === 'object' ? typ.groupLabel : {}) };
            if (setNestedString(gl, 'fontFamily', o.labelFont)) changed = true;
            if (setNestedFontSize(gl, o.labelFs)) changed = true;
            if (setNestedString(gl, 'textAlign', o.labelAlign)) changed = true;
            if (setNestedString(gl, 'textTransform', o.labelCase)) changed = true;
            if (setNestedBool(gl, 'bold', o.labelBold)) changed = true;
            if (setNestedBool(gl, 'italic', o.labelItalic)) changed = true;
            if (setNestedString(gl, 'color', o.labelCol)) changed = true;
            if (o.labelOffX !== undefined && o.labelOffX !== null && String(o.labelOffX).trim() !== '') {
                const n = Number(o.labelOffX);
                gl.offsetX = Number.isFinite(n) ? n : o.labelOffX;
                changed = true;
            } else if (o.labelOffX === 0) {
                gl.offsetX = 0;
                changed = true;
            }
            if (o.labelOffY !== undefined && o.labelOffY !== null && String(o.labelOffY).trim() !== '') {
                const n = Number(o.labelOffY);
                gl.offsetY = Number.isFinite(n) ? n : o.labelOffY;
                changed = true;
            } else if (o.labelOffY === 0) {
                gl.offsetY = 0;
                changed = true;
            }
            if (Object.keys(gl).length > 0) typ.groupLabel = gl;
            else delete typ.groupLabel;
            typoKeys.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        let ana = null;
        if (hasNumLegacy || hasAnalogFlat) {
            ana = { ...(typ.analogNumbers && typeof typ.analogNumbers === 'object' ? typ.analogNumbers : {}) };
        }

        if (hasNumLegacy) {
            if (setNestedString(ana, 'fontFamily', o.numFont)) changed = true;
            if (setNestedFontSize(ana, o.numSize)) changed = true;
            if (setNestedString(ana, 'color', o.numColor)) changed = true;
            if (setNestedBool(ana, 'bold', o.numFontBold)) changed = true;
            numKeys.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (hasAnalogFlat) {
            this.CLOCK_ANALOG_FLAT_INSTANCE_KEYS.forEach((flatKey) => {
                if (o[flatKey] === undefined) return;
                const prop = analogFlatToNested[flatKey];
                if (!prop) return;
                let wrote = false;
                if (prop === 'bold' || prop === 'italic') wrote = setNestedBool(ana, prop, o[flatKey]);
                else if (prop === 'fontSize') wrote = setNestedFontSize(ana, o[flatKey]);
                else if (prop === 'opacity') wrote = setNestedOpacity(ana, o[flatKey]);
                else if (prop === 'offsetX' || prop === 'offsetY') {
                    const raw = o[flatKey];
                    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
                        const n = Number(raw);
                        ana[prop] = Number.isFinite(n) ? n : raw;
                        wrote = true;
                    } else if (raw === 0) {
                        ana[prop] = 0;
                        wrote = true;
                    }
                } else wrote = setNestedString(ana, prop, o[flatKey]);
                if (wrote) {
                    delete o[flatKey];
                    changed = true;
                }
            });
        }

        if (hasGroupFlat) {
            const gl2 = { ...(typ.groupLabel && typeof typ.groupLabel === 'object' ? typ.groupLabel : {}) };
            let glChanged = false;
            this.CLOCK_GROUP_LABEL_FLAT_INSTANCE_KEYS.forEach((flatKey) => {
                if (o[flatKey] === undefined) return;
                const prop = groupFlatToNested[flatKey];
                if (!prop) return;
                let wrote = false;
                if (prop === 'bold' || prop === 'italic') wrote = setNestedBool(gl2, prop, o[flatKey]);
                else if (prop === 'fontSize') wrote = setNestedFontSize(gl2, o[flatKey]);
                else if (prop === 'opacity') wrote = setNestedOpacity(gl2, o[flatKey]);
                else if (prop === 'offsetX' || prop === 'offsetY') {
                    const raw = o[flatKey];
                    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
                        const n = Number(raw);
                        gl2[prop] = Number.isFinite(n) ? n : raw;
                        wrote = true;
                    } else if (raw === 0) {
                        gl2[prop] = 0;
                        wrote = true;
                    }
                } else wrote = setNestedString(gl2, prop, o[flatKey]);
                if (wrote) {
                    delete o[flatKey];
                    glChanged = true;
                    changed = true;
                }
            });
            if (Object.keys(gl2).length > 0) typ.groupLabel = gl2;
            else delete typ.groupLabel;
            if (glChanged) changed = true;
        }

        if (ana !== null) {
            if (Object.keys(ana).length > 0) typ.analogNumbers = ana;
            else if (typ.analogNumbers) delete typ.analogNumbers;
        }

        if (typ.groupLabel && typeof typ.groupLabel === 'object' && Object.keys(typ.groupLabel).length === 0) {
            delete typ.groupLabel;
        }

        o.typography = typ;
        if (o.typography && typeof o.typography === 'object' && Object.keys(o.typography).length === 0) {
            delete o.typography;
        }

        return changed;
    },

    /**
     * Copy legacy `layout` / caption align into style-specific keys for the widget's current bar type.
     * The other style key is left unset so factory defaults apply.
     */
    _migrateGaugeStyleSpecificLayoutAndCaption: function (o, master) {
        if (!o || typeof o !== 'object') return false;
        const m = master && typeof master === 'object' ? master : {};
        const style = o.barType != null && o.barType !== '' ? o.barType : (m.defaultGaugeType || 'round');
        const isHoriz = style === 'horizontal' || style === 'none';
        let changed = false;

        const legacyLayout = o.layout;
        let legacyAlign = o.gaugeCaptionAlign;
        if (o.typography && o.typography.caption && typeof o.typography.caption === 'object'
                && o.typography.caption.textAlign != null) {
            legacyAlign = o.typography.caption.textAlign;
        }

        if (isHoriz) {
            if (o.layoutHoriz === undefined && legacyLayout !== undefined && legacyLayout !== null) {
                o.layoutHoriz = legacyLayout;
                changed = true;
            }
            if (o.gaugeCaptionAlignHoriz === undefined && legacyAlign !== undefined && legacyAlign !== null) {
                o.gaugeCaptionAlignHoriz = legacyAlign;
                changed = true;
            }
        } else {
            if (o.layoutRound === undefined && legacyLayout !== undefined && legacyLayout !== null) {
                o.layoutRound = legacyLayout;
                changed = true;
            }
            if (o.gaugeCaptionAlignRound === undefined && legacyAlign !== undefined && legacyAlign !== null) {
                o.gaugeCaptionAlignRound = legacyAlign;
                changed = true;
            }
        }
        return changed;
    },

    /**
     * Ensure gap lives on the key the active style reads (round → gapRound; horizontal/none → gapHoriz).
     * Heals dashboards where legacy `gap` was copied to gapRound while style is none/horizontal.
     */
    _migrateGaugeStyleSpecificGap: function (o, master) {
        if (!o || typeof o !== 'object') return false;
        const m = master && typeof master === 'object' ? master : {};
        const style = o.barType != null && o.barType !== '' ? o.barType : (m.defaultGaugeType || 'round');
        const isHoriz = style === 'horizontal' || style === 'none';
        let changed = false;

        if (o.gap !== undefined && o.gap !== null && String(o.gap).trim() !== '') {
            if (isHoriz) {
                if (o.gapHoriz === undefined || o.gapHoriz === null || o.gapHoriz === '') {
                    o.gapHoriz = o.gap;
                    changed = true;
                }
            } else if (o.gapRound === undefined || o.gapRound === null || o.gapRound === '') {
                o.gapRound = o.gap;
                changed = true;
            }
            delete o.gap;
            changed = true;
        }

        if (isHoriz) {
            if ((o.gapHoriz === undefined || o.gapHoriz === null || o.gapHoriz === '')
                    && o.gapRound !== undefined && o.gapRound !== null && o.gapRound !== '') {
                o.gapHoriz = o.gapRound;
                changed = true;
            }
        } else if ((o.gapRound === undefined || o.gapRound === null || o.gapRound === '')
                && o.gapHoriz !== undefined && o.gapHoriz !== null && o.gapHoriz !== '') {
            o.gapRound = o.gapHoriz;
            changed = true;
        }
        return changed;
    },

    _migrateGaugeMasterStyleSpecificDefaults: function (m) {
        if (!m || typeof m !== 'object') return false;
        const style = m.defaultGaugeType || 'round';
        const isHoriz = style === 'horizontal' || style === 'none';
        let changed = false;

        if (isHoriz) {
            if ((m.defaultGaugeHorizontalLayout === undefined || m.defaultGaugeHorizontalLayout === null || m.defaultGaugeHorizontalLayout === '')
                    && m.defaultGaugeLayout != null && m.defaultGaugeLayout !== '') {
                m.defaultGaugeHorizontalLayout = m.defaultGaugeLayout;
                changed = true;
            }
            if ((m.defaultGaugeCaptionAlignHoriz === undefined || m.defaultGaugeCaptionAlignHoriz === null || m.defaultGaugeCaptionAlignHoriz === '')
                    && m.defaultGaugeCaptionAlign != null && m.defaultGaugeCaptionAlign !== '') {
                m.defaultGaugeCaptionAlignHoriz = m.defaultGaugeCaptionAlign;
                changed = true;
            }
        } else {
            if ((m.defaultGaugeRoundLayout === undefined || m.defaultGaugeRoundLayout === null || m.defaultGaugeRoundLayout === '')
                    && m.defaultGaugeLayout != null && m.defaultGaugeLayout !== '') {
                m.defaultGaugeRoundLayout = m.defaultGaugeLayout;
                changed = true;
            }
            if ((m.defaultGaugeCaptionAlignRound === undefined || m.defaultGaugeCaptionAlignRound === null || m.defaultGaugeCaptionAlignRound === '')
                    && m.defaultGaugeCaptionAlign != null && m.defaultGaugeCaptionAlign !== '') {
                m.defaultGaugeCaptionAlignRound = m.defaultGaugeCaptionAlign;
                changed = true;
            }
        }
        return changed;
    },

    /** Gauge (idempotent heal): instance display-format key renames (legacy names from pre-rename saves). */
    _migrateGaugeOverridesNumberFormatKeys: function (o) {
        if (!o || typeof o !== 'object') return false;
        const hp = Object.prototype.hasOwnProperty;
        let changed = false;

        const moveIfPresent = function (legacyKey, newKey) {
            if (!hp.call(o, legacyKey)) return;
            if (!hp.call(o, newKey)) o[newKey] = o[legacyKey];
            delete o[legacyKey];
            changed = true;
        };

        moveIfPresent('decimals', 'decimalPlaces');
        moveIfPresent('fixedDecimalPlaces', 'keepTrailingZeros');
        moveIfPresent('autoScale', 'abbreviateLargeValues');
        moveIfPresent('shortenDecimals', 'abbreviatedDecimalPlaces');

        return changed;
    },

    /** Gauge master / widgetDefaults (idempotent heal): default keys for abbreviated readout + trailing zeros. */
    _migrateGaugeMasterNumberFormatKeys: function (m) {
        if (!m || typeof m !== 'object') return false;
        const hp = Object.prototype.hasOwnProperty;
        let changed = false;

        const patch = function (tgt) {
            if (!tgt || typeof tgt !== 'object') return;
            if (!hp.call(tgt, 'defaultGaugeAutoScale')) return;
            if (!hp.call(tgt, 'defaultGaugeAbbreviateLargeValues')) {
                tgt.defaultGaugeAbbreviateLargeValues = tgt.defaultGaugeAutoScale;
            }
            delete tgt.defaultGaugeAutoScale;
            changed = true;
        };
        const patchFixed = function (tgt) {
            if (!tgt || typeof tgt !== 'object') return;
            if (!hp.call(tgt, 'defaultGaugeFixedDecimalPlaces')) return;
            if (!hp.call(tgt, 'defaultGaugeKeepTrailingZeros')) {
                tgt.defaultGaugeKeepTrailingZeros = tgt.defaultGaugeFixedDecimalPlaces;
            }
            delete tgt.defaultGaugeFixedDecimalPlaces;
            changed = true;
        };

        patch(m);
        patchFixed(m);

        let wd = null;
        try {
            if (m.widgetDefaults && typeof m.widgetDefaults === 'object') wd = m.widgetDefaults;
        } catch (e) {
            wd = null;
        }
        if (wd) {
            patch(wd);
            patchFixed(wd);
        }

        return changed;
    },

    /** Legacy gauge stored an empty icon class (flat `icon` / `iconOn` / nested `builtin`), not merely absent keys. */
    _gaugeLegacyIconExplicitlyEmpty: function (o) {
        if (!o || typeof o !== 'object') return false;
        const customUrl = String(
            o.iconUrl || o.imgOn || (o.icons && o.icons.on && o.icons.on.customUrl) || ''
        ).trim();
        if (customUrl) return false;
        if (o.icon !== undefined) return String(o.icon || '').trim() === '';
        if (o.iconOn !== undefined) return String(o.iconOn || '').trim() === '';
        if (o.icons && o.icons.on && typeof o.icons.on === 'object'
                && Object.prototype.hasOwnProperty.call(o.icons.on, 'builtin')) {
            return String(o.icons.on.builtin || '').trim() === '';
        }
        return false;
    },

    _switchFactoryIconOnBuiltin: function () {
        if (typeof SwitchWidget !== 'undefined' && SwitchWidget.DEFAULT_SWITCH_ICON_ON_BUILTIN) {
            return String(SwitchWidget.DEFAULT_SWITCH_ICON_ON_BUILTIN).trim();
        }
        return 'ph-check-fat';
    },

    _switchResolvedVisualStyle: function (o) {
        if (!o || typeof o !== 'object') return 'switch';
        const raw = o.style !== undefined && o.style !== null && String(o.style).trim() !== ''
            ? o.style
            : o.defaultSwitchStyle;
        return String(raw || 'switch').trim() || 'switch';
    },

    _switchIsButtonLikeVisualStyle: function (styleKey) {
        return styleKey === 'button' || styleKey === 'image-only';
    },

    /**
     * Pre-1.9.0 Button / Image-only: no user icon (empty legacy class, sparse slot, or only the new factory glyph).
     * Pill switches are excluded — they already default to hidden icon unless overridden.
     */
    _switchButtonHadNoUserIconBeforeV190: function (o) {
        if (!o || typeof o !== 'object') return false;
        const customUrl = String(
            o.iconUrl || o.iconOnUrl || o.imgOn
            || (o.icons && o.icons.on && o.icons.on.customUrl) || ''
        ).trim();
        if (customUrl) return false;
        if (o.icon !== undefined && String(o.icon || '').trim() !== '') return false;
        if (o.iconOn !== undefined && String(o.iconOn || '').trim() !== '') return false;
        const on = o.icons && o.icons.on && typeof o.icons.on === 'object' ? o.icons.on : null;
        if (!on) return true;
        const builtin = String(on.builtin || '').trim();
        if (!builtin) return true;
        return builtin === this._switchFactoryIconOnBuiltin();
    },

    /**
     * 1.9.0 factory Icon (On) must not appear on legacy Button / Image-only widgets that never had an icon.
     * Sets explicit `showIcon: false` and strips persisted factory `builtin` (runtime may still merge defaults for new widgets).
     */
    _migrateSwitchButtonPreserveNoIconFromV190: function (o) {
        if (!o || typeof o !== 'object') return false;
        if (!this._switchIsButtonLikeVisualStyle(this._switchResolvedVisualStyle(o))) return false;
        if (o.showIcon === true) return false;
        if (!this._switchButtonHadNoUserIconBeforeV190(o)) return false;

        let changed = false;
        if (o.showIcon !== false) {
            o.showIcon = false;
            changed = true;
        }
        const factoryBuiltin = this._switchFactoryIconOnBuiltin();
        if (o.icons && o.icons.on && typeof o.icons.on === 'object') {
            const on = o.icons.on;
            const b = String(on.builtin || '').trim();
            if (b === factoryBuiltin || b === '') {
                if (Object.prototype.hasOwnProperty.call(on, 'builtin')) {
                    delete on.builtin;
                    changed = true;
                }
            }
        }
        return changed;
    },

    /**
     * Gauge (pre-1.9.0): flat caption/value/unit/axis + icon keys → nested typography / icons.on.
     * Lifts stray flat gaugeCaption* / gaugeValue* / gaugeUnit* / gaugeAxis* into nested roles.
     */
    _migrateGaugeOverridesToCanonical: function (o) {
        if (!o || typeof o !== 'object') return false;

        const captionLegacy = this.GAUGE_CAPTION_LEGACY_KEYS;
        const valueLegacy = this.GAUGE_VALUE_LEGACY_KEYS;
        const unitLegacy = this.GAUGE_UNIT_LEGACY_KEYS;
        const axisLegacy = this.GAUGE_AXIS_LEGACY_KEYS;
        const iconLegacy = this.GAUGE_ICON_LEGACY_KEYS;

        const hasCaptionLegacy = captionLegacy.some((k) => o[k] !== undefined);
        const hasValueLegacy = valueLegacy.some((k) => o[k] !== undefined);
        const hasUnitLegacy = unitLegacy.some((k) => o[k] !== undefined);
        const hasAxisLegacy = axisLegacy.some((k) => o[k] !== undefined);
        const hasIconLegacy = iconLegacy.some((k) => o[k] !== undefined);
        const hasLayoutLegacy = this.GAUGE_LAYOUT_LEGACY_KEYS.some((k) => o[k] !== undefined);
        const hasCaptionFlat = this.GAUGE_CAPTION_FLAT_INSTANCE_KEYS.some((k) => o[k] !== undefined);
        const hasValueFlat = this.GAUGE_VALUE_FLAT_INSTANCE_KEYS.some((k) => o[k] !== undefined);
        const hasUnitFlat = this.GAUGE_UNIT_FLAT_INSTANCE_KEYS.some((k) => o[k] !== undefined);
        const hasAxisFlat = this.GAUGE_AXIS_FLAT_INSTANCE_KEYS.some((k) => o[k] !== undefined);

        if (!hasCaptionLegacy && !hasValueLegacy && !hasUnitLegacy && !hasAxisLegacy && !hasIconLegacy
            && !hasLayoutLegacy
            && !hasCaptionFlat && !hasValueFlat && !hasUnitFlat && !hasAxisFlat) {
            return false;
        }

        const setNestedString = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            const s = String(raw).trim();
            if (!s && prop !== 'textTransform') return false;
            block[prop] = raw;
            return true;
        };

        const setNestedBool = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            block[prop] = !!raw;
            return true;
        };

        const setNestedFontSize = (block, raw) => {
            if (raw === undefined || raw === null) return false;
            const n = Number(raw);
            if (Number.isFinite(n)) {
                block.fontSize = n;
                return true;
            }
            const s = String(raw).trim();
            if (!s) return false;
            block.fontSize = raw;
            return true;
        };

        const setNestedOpacity = (block, raw) => {
            if (raw === undefined || raw === null || String(raw).trim() === '') return false;
            const n = Number(raw);
            block.opacity = Number.isFinite(n) ? n : raw;
            return true;
        };

        const flatToNestedStandard = {
            gaugeCaptionFont: 'fontFamily',
            gaugeCaptionFs: 'fontSize',
            gaugeCaptionAlign: 'textAlign',
            gaugeCaptionCase: 'textTransform',
            gaugeCaptionBold: 'bold',
            gaugeCaptionItalic: 'italic',
            gaugeCaptionCol: 'color',
            gaugeCaptionOpacity: 'opacity',
            gaugeCaptionOffX: 'offsetX',
            gaugeCaptionOffY: 'offsetY',
            gaugeValueFont: 'fontFamily',
            gaugeValueFs: 'fontSize',
            gaugeValueAlign: 'textAlign',
            gaugeValueCase: 'textTransform',
            gaugeValueBold: 'bold',
            gaugeValueItalic: 'italic',
            gaugeValueCol: 'color',
            gaugeValueOpacity: 'opacity',
            gaugeValueOffX: 'offsetX',
            gaugeValueOffY: 'offsetY',
            gaugeUnitFont: 'fontFamily',
            gaugeUnitFs: 'fontSize',
            gaugeUnitAlign: 'textAlign',
            gaugeUnitCase: 'textTransform',
            gaugeUnitBold: 'bold',
            gaugeUnitItalic: 'italic',
            gaugeUnitCol: 'color',
            gaugeUnitOpacity: 'opacity',
            gaugeUnitOffX: 'offsetX',
            gaugeUnitOffY: 'offsetY',
            gaugeAxisFont: 'fontFamily',
            gaugeAxisFs: 'fontSize',
            gaugeAxisAlign: 'textAlign',
            gaugeAxisCase: 'textTransform',
            gaugeAxisBold: 'bold',
            gaugeAxisItalic: 'italic',
            gaugeAxisCol: 'color',
            gaugeAxisOpacity: 'opacity',
            gaugeAxisOffX: 'offsetX',
            gaugeAxisOffY: 'offsetY'
        };

        const liftFlatKeys = (roleKey, flatKeys) => {
            let block = null;
            let blockChanged = false;
            flatKeys.forEach((flatKey) => {
                if (o[flatKey] === undefined) return;
                const prop = flatToNestedStandard[flatKey];
                if (!prop) return;
                if (block === null) {
                    block = { ...(typ[roleKey] && typeof typ[roleKey] === 'object' ? typ[roleKey] : {}) };
                }
                let wrote = false;
                if (prop === 'bold' || prop === 'italic') wrote = setNestedBool(block, prop, o[flatKey]);
                else if (prop === 'fontSize') wrote = setNestedFontSize(block, o[flatKey]);
                else if (prop === 'opacity') wrote = setNestedOpacity(block, o[flatKey]);
                else if (prop === 'offsetX' || prop === 'offsetY') {
                    const raw = o[flatKey];
                    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
                        const n = Number(raw);
                        block[prop] = Number.isFinite(n) ? n : raw;
                        wrote = true;
                    } else if (raw === 0) {
                        block[prop] = 0;
                        wrote = true;
                    }
                } else wrote = setNestedString(block, prop, o[flatKey]);
                if (wrote) {
                    blockChanged = true;
                    delete o[flatKey];
                }
            });
            if (block !== null) {
                if (Object.keys(block).length > 0) typ[roleKey] = block;
                else delete typ[roleKey];
            }
            return blockChanged;
        };

        let changed = false;
        const typ = { ...(o.typography && typeof o.typography === 'object' ? o.typography : {}) };

        if (hasCaptionLegacy) {
            const cap = { ...(typ.caption && typeof typ.caption === 'object' ? typ.caption : {}) };
            if (setNestedString(cap, 'fontFamily', o.labelFont)) changed = true;
            if (setNestedFontSize(cap, o.labelFs)) changed = true;
            if (setNestedString(cap, 'textAlign', o.labelAlign)) changed = true;
            if (setNestedString(cap, 'textTransform', o.labelCase)) changed = true;
            if (setNestedBool(cap, 'bold', o.labelBold)) changed = true;
            if (setNestedBool(cap, 'italic', o.labelItalic)) changed = true;
            if (setNestedString(cap, 'color', o.labelCol)) changed = true;
            if (o.labelOffX !== undefined && o.labelOffX !== null && String(o.labelOffX).trim() !== '') {
                const n = Number(o.labelOffX);
                cap.offsetX = Number.isFinite(n) ? n : o.labelOffX;
                changed = true;
            } else if (o.labelOffX === 0) {
                cap.offsetX = 0;
                changed = true;
            }
            if (o.labelOffY !== undefined && o.labelOffY !== null && String(o.labelOffY).trim() !== '') {
                const n = Number(o.labelOffY);
                cap.offsetY = Number.isFinite(n) ? n : o.labelOffY;
                changed = true;
            } else if (o.labelOffY === 0) {
                cap.offsetY = 0;
                changed = true;
            }
            if (Object.keys(cap).length > 0) typ.caption = cap;
            else delete typ.caption;
            captionLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (hasValueLegacy) {
            const val = { ...(typ.value && typeof typ.value === 'object' ? typ.value : {}) };
            if (setNestedString(val, 'fontFamily', o.valueFont)) changed = true;
            if (setNestedFontSize(val, o.fsVal)) changed = true;
            if (setNestedString(val, 'color', o.colVal)) changed = true;
            if (setNestedBool(val, 'bold', o.valueBold)) changed = true;
            if (o.valOffX !== undefined && o.valOffX !== null && String(o.valOffX).trim() !== '') {
                const n = Number(o.valOffX);
                val.offsetX = Number.isFinite(n) ? n : o.valOffX;
                changed = true;
            } else if (o.valOffX === 0) {
                val.offsetX = 0;
                changed = true;
            }
            if (o.valOffY !== undefined && o.valOffY !== null && String(o.valOffY).trim() !== '') {
                const n = Number(o.valOffY);
                val.offsetY = Number.isFinite(n) ? n : o.valOffY;
                changed = true;
            } else if (o.valOffY === 0) {
                val.offsetY = 0;
                changed = true;
            }
            if (Object.keys(val).length > 0) typ.value = val;
            else delete typ.value;
            valueLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (hasUnitLegacy) {
            const unit = { ...(typ.unit && typeof typ.unit === 'object' ? typ.unit : {}) };
            if (setNestedFontSize(unit, o.fsUnit)) changed = true;
            if (setNestedString(unit, 'color', o.colUnit)) changed = true;
            if (Object.keys(unit).length > 0) typ.unit = unit;
            else delete typ.unit;
            unitLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (hasAxisLegacy) {
            const axis = { ...(typ.axis && typeof typ.axis === 'object' ? typ.axis : {}) };
            if (setNestedString(axis, 'fontFamily', o.axisFont)) changed = true;
            if (setNestedFontSize(axis, o.axisFontSize)) changed = true;
            if (setNestedString(axis, 'color', o.axisFontColor)) changed = true;
            if (setNestedBool(axis, 'bold', o.axisFontBold)) changed = true;
            if (Object.keys(axis).length > 0) typ.axis = axis;
            else delete typ.axis;
            axisLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (liftFlatKeys('caption', this.GAUGE_CAPTION_FLAT_INSTANCE_KEYS)) changed = true;
        if (liftFlatKeys('value', this.GAUGE_VALUE_FLAT_INSTANCE_KEYS)) changed = true;
        if (liftFlatKeys('unit', this.GAUGE_UNIT_FLAT_INSTANCE_KEYS)) changed = true;
        if (liftFlatKeys('axis', this.GAUGE_AXIS_FLAT_INSTANCE_KEYS)) changed = true;

        if (hasLayoutLegacy) {
            if (o.iconY !== undefined) {
                if (o.iconOffY === undefined || o.iconOffY === null || o.iconOffY === '') {
                    o.iconOffY = o.iconY;
                    changed = true;
                }
                delete o.iconY;
                changed = true;
            }
        }

        if (hasIconLegacy) {
            const slotDef = () => {
                if (typeof MenuWidget !== 'undefined' && MenuWidget.defaultIconSlot) {
                    return MenuWidget.defaultIconSlot();
                }
                return { source: 'phosphor', builtin: '', weight: 'fill', customUrl: '', tintImage: false };
            };
            let icons = { on: { ...slotDef() } };
            if (o.icons && typeof o.icons === 'object' && o.icons.on && typeof o.icons.on === 'object') {
                icons.on = { ...slotDef(), ...o.icons.on };
            }
            const tint = o.iconColorize === true;
            const url = String(o.iconUrl || '').trim();
            const builtin = String(o.icon || '').trim();
            const weight = o.iconFilled === false ? 'regular' : 'fill';
            icons.on = {
                source: url ? 'custom' : 'phosphor',
                builtin: url ? '' : builtin,
                weight: weight,
                customUrl: url,
                tintImage: tint
            };
            if (o.colIcon !== undefined && o.colIcon !== null && String(o.colIcon).trim() !== '') {
                icons.on.color = o.colIcon;
            }
            if (Object.prototype.hasOwnProperty.call(icons.on, 'filled')) {
                delete icons.on.filled;
            }
            iconLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
            o.icons = icons;
            changed = true;
            if (this._migratePhosphorIconSlotsFilledToWeightV186(o.icons, null)) changed = true;
            if (this._gaugeLegacyIconExplicitlyEmpty(o) && o.showIcon !== false) {
                o.showIcon = false;
                changed = true;
            }
        } else if (o.icons && typeof o.icons === 'object') {
            if (this._migratePhosphorIconSlotsFilledToWeightV186(o.icons, null)) changed = true;
        }

        if (this._gaugeLegacyIconExplicitlyEmpty(o) && o.showIcon !== false) {
            o.showIcon = false;
            changed = true;
        }

        o.typography = typ;
        if (o.typography && typeof o.typography === 'object' && Object.keys(o.typography).length === 0) {
            delete o.typography;
        }

        return changed;
    },

    /**
     * Slider: flat caption/value typography → nested `typography.caption` / `typography.value`.
     * Idempotent; lifts stray `sliderCaption*` / `sliderValue*` instance keys.
     */
    _migrateSliderOverridesToCanonical: function (o) {
        if (!o || typeof o !== 'object') return false;

        const captionLegacy = this.SLIDER_CAPTION_LEGACY_KEYS;
        const valueLegacy = this.SLIDER_VALUE_LEGACY_KEYS;
        const hasCaptionLegacy = captionLegacy.some((k) => o[k] !== undefined);
        const hasValueLegacy = valueLegacy.some((k) => o[k] !== undefined);
        const hasCaptionFlat = this.SLIDER_CAPTION_FLAT_INSTANCE_KEYS.some((k) => o[k] !== undefined);
        const hasValueFlat = this.SLIDER_VALUE_FLAT_INSTANCE_KEYS.some((k) => o[k] !== undefined);
        const hasUnitFlat = this.SLIDER_UNIT_FLAT_INSTANCE_KEYS.some((k) => o[k] !== undefined);

        if (!hasCaptionLegacy && !hasValueLegacy && !hasCaptionFlat && !hasValueFlat && !hasUnitFlat) {
            return false;
        }

        const setNestedString = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            const s = String(raw).trim();
            if (!s && prop !== 'textTransform') return false;
            block[prop] = raw;
            return true;
        };

        const setNestedBool = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            block[prop] = !!raw;
            return true;
        };

        const setNestedFontSize = (block, raw) => {
            if (raw === undefined || raw === null) return false;
            const n = Number(raw);
            if (Number.isFinite(n)) {
                block.fontSize = n;
                return true;
            }
            const s = String(raw).trim();
            if (!s) return false;
            block.fontSize = raw;
            return true;
        };

        const flatToNestedStandard = {
            sliderCaptionFont: 'fontFamily',
            sliderCaptionFs: 'fontSize',
            sliderCaptionCase: 'textTransform',
            sliderCaptionBold: 'bold',
            sliderCaptionCol: 'color',
            sliderCaptionOffX: 'offsetX',
            sliderCaptionOffY: 'offsetY',
            sliderValueFont: 'fontFamily',
            sliderValueFs: 'fontSize',
            sliderValueAlign: 'textAlign',
            sliderValueBold: 'bold',
            sliderValueCol: 'color',
            sliderValueOffX: 'offsetX',
            sliderValueOffY: 'offsetY',
            sliderUnitFont: 'fontFamily',
            sliderUnitFs: 'fontSize',
            sliderUnitBold: 'bold',
            sliderUnitItalic: 'italic',
            sliderUnitCol: 'color',
            sliderUnitOpacity: 'opacity'
        };

        let changed = false;
        const typ = { ...(o.typography && typeof o.typography === 'object' ? o.typography : {}) };

        const liftFlatKeys = (roleKey, flatKeys) => {
            let block = null;
            let blockChanged = false;
            flatKeys.forEach((flatKey) => {
                if (o[flatKey] === undefined) return;
                const prop = flatToNestedStandard[flatKey];
                if (!prop) return;
                if (block === null) {
                    block = { ...(typ[roleKey] && typeof typ[roleKey] === 'object' ? typ[roleKey] : {}) };
                }
                let wrote = false;
                if (prop === 'bold') wrote = setNestedBool(block, prop, o[flatKey]);
                else if (prop === 'fontSize') wrote = setNestedFontSize(block, o[flatKey]);
                else if (prop === 'offsetX' || prop === 'offsetY') {
                    const raw = o[flatKey];
                    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
                        const n = Number(raw);
                        block[prop] = Number.isFinite(n) ? n : raw;
                        wrote = true;
                    } else if (raw === 0) {
                        block[prop] = 0;
                        wrote = true;
                    }
                } else wrote = setNestedString(block, prop, o[flatKey]);
                if (wrote) {
                    blockChanged = true;
                    delete o[flatKey];
                }
            });
            if (block !== null) {
                if (Object.keys(block).length > 0) typ[roleKey] = block;
                else delete typ[roleKey];
            }
            return blockChanged;
        };

        if (hasCaptionLegacy) {
            const cap = { ...(typ.caption && typeof typ.caption === 'object' ? typ.caption : {}) };
            if (setNestedString(cap, 'fontFamily', o.labelFont)) changed = true;
            if (setNestedFontSize(cap, o.labelFs)) changed = true;
            if (setNestedString(cap, 'textTransform', o.labelCase)) changed = true;
            if (setNestedBool(cap, 'bold', o.labelBold)) changed = true;
            if (setNestedString(cap, 'color', o.labelCol)) changed = true;
            if (o.labelOffX !== undefined && o.labelOffX !== null && String(o.labelOffX).trim() !== '') {
                const n = Number(o.labelOffX);
                cap.offsetX = Number.isFinite(n) ? n : o.labelOffX;
                changed = true;
            } else if (o.labelOffX === 0) {
                cap.offsetX = 0;
                changed = true;
            }
            if (o.labelOffY !== undefined && o.labelOffY !== null && String(o.labelOffY).trim() !== '') {
                const n = Number(o.labelOffY);
                cap.offsetY = Number.isFinite(n) ? n : o.labelOffY;
                changed = true;
            } else if (o.labelOffY === 0) {
                cap.offsetY = 0;
                changed = true;
            }
            if (Object.keys(cap).length > 0) typ.caption = cap;
            else delete typ.caption;
            captionLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (hasValueLegacy) {
            const val = { ...(typ.value && typeof typ.value === 'object' ? typ.value : {}) };
            if (setNestedString(val, 'fontFamily', o.valFam)) changed = true;
            if (setNestedFontSize(val, o.valFs)) changed = true;
            if (setNestedString(val, 'textAlign', o.valAlign)) changed = true;
            if (setNestedBool(val, 'bold', o.valFamBold)) changed = true;
            if (setNestedString(val, 'color', o.colVal)) changed = true;
            if (o.valOffX !== undefined && o.valOffX !== null && String(o.valOffX).trim() !== '') {
                const n = Number(o.valOffX);
                val.offsetX = Number.isFinite(n) ? n : o.valOffX;
                changed = true;
            } else if (o.valOffX === 0) {
                val.offsetX = 0;
                changed = true;
            }
            if (o.valOffY !== undefined && o.valOffY !== null && String(o.valOffY).trim() !== '') {
                const n = Number(o.valOffY);
                val.offsetY = Number.isFinite(n) ? n : o.valOffY;
                changed = true;
            } else if (o.valOffY === 0) {
                val.offsetY = 0;
                changed = true;
            }
            if (Object.keys(val).length > 0) typ.value = val;
            else delete typ.value;
            valueLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (liftFlatKeys('caption', this.SLIDER_CAPTION_FLAT_INSTANCE_KEYS)) changed = true;
        if (liftFlatKeys('value', this.SLIDER_VALUE_FLAT_INSTANCE_KEYS)) changed = true;
        if (liftFlatKeys('unit', this.SLIDER_UNIT_FLAT_INSTANCE_KEYS)) changed = true;

        o.typography = typ;
        if (o.typography && typeof o.typography === 'object' && Object.keys(o.typography).length === 0) {
            delete o.typography;
        }

        return changed;
    },

    /**
     * Edit box: flat input/label typography → nested `typography.inputText` / `typography.widgetLabel`.
     * Idempotent; lifts stray `editboxInput*` / `editboxLabel*` instance keys. `placeholderColor` / `textPadding` stay flat.
     */
    _migrateEditboxOverridesToCanonical: function (o) {
        if (!o || typeof o !== 'object') return false;

        const inputLegacy = this.EDITBOX_INPUT_LEGACY_TYPO_KEYS;
        const labelLegacy = this.EDITBOX_LABEL_LEGACY_TYPO_KEYS;
        const hasInputLegacy = inputLegacy.some((k) => o[k] !== undefined);
        const hasLabelLegacy = labelLegacy.some((k) => o[k] !== undefined);
        const hasInputFlat = this.EDITBOX_INPUT_FLAT_TYPO_KEYS.some((k) => o[k] !== undefined);
        const hasLabelFlat = this.EDITBOX_LABEL_FLAT_TYPO_KEYS.some((k) => o[k] !== undefined);
        const hasOrphanInputAlign = o.textAlign !== undefined && o.textAlign !== null && String(o.textAlign).trim() !== '';

        if (!hasInputLegacy && !hasLabelLegacy && !hasInputFlat && !hasLabelFlat && !hasOrphanInputAlign) {
            return false;
        }

        const setNestedString = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            const s = String(raw).trim();
            if (!s && prop !== 'textTransform') return false;
            block[prop] = raw;
            return true;
        };
        const setNestedBool = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            block[prop] = !!raw;
            return true;
        };
        const setNestedFontSize = (block, raw) => {
            if (raw === undefined || raw === null) return false;
            const n = Number(raw);
            if (Number.isFinite(n)) {
                block.fontSize = n;
                return true;
            }
            const s = String(raw).trim();
            if (!s) return false;
            block.fontSize = raw;
            return true;
        };

        const setNestedTextAlign = (block, raw) => {
            if (raw === undefined || raw === null) return false;
            const align = String(raw).trim().toLowerCase();
            if (align !== 'left' && align !== 'center' && align !== 'right') return false;
            block.textAlign = align;
            return true;
        };

        const flatToNestedStandard = {
            editboxInputFont: 'fontFamily',
            editboxInputFs: 'fontSize',
            editboxInputAlign: 'textAlign',
            editboxInputBold: 'bold',
            editboxInputItalic: 'italic',
            editboxInputCol: 'color',
            editboxLabelFont: 'fontFamily',
            editboxLabelFs: 'fontSize',
            editboxLabelCase: 'textTransform',
            editboxLabelBold: 'bold',
            editboxLabelItalic: 'italic',
            editboxLabelAlign: 'textAlign',
            editboxLabelCol: 'color',
            editboxLabelOffX: 'offsetX',
            editboxLabelOffY: 'offsetY'
        };

        let changed = false;
        const typ = { ...(o.typography && typeof o.typography === 'object' ? o.typography : {}) };

        const liftFlatKeys = (roleKey, flatKeys) => {
            let block = null;
            let blockChanged = false;
            flatKeys.forEach((flatKey) => {
                if (o[flatKey] === undefined) return;
                const prop = flatToNestedStandard[flatKey];
                if (!prop) return;
                if (block === null) {
                    block = { ...(typ[roleKey] && typeof typ[roleKey] === 'object' ? typ[roleKey] : {}) };
                }
                let wrote = false;
                if (prop === 'bold' || prop === 'italic') wrote = setNestedBool(block, prop, o[flatKey]);
                else if (prop === 'fontSize') wrote = setNestedFontSize(block, o[flatKey]);
                else if (prop === 'textAlign') wrote = setNestedTextAlign(block, o[flatKey]);
                else if (prop === 'offsetX' || prop === 'offsetY') {
                    const raw = o[flatKey];
                    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
                        const n = Number(raw);
                        block[prop] = Number.isFinite(n) ? n : raw;
                        wrote = true;
                    } else if (raw === 0) {
                        block[prop] = 0;
                        wrote = true;
                    }
                } else wrote = setNestedString(block, prop, o[flatKey]);
                if (wrote) {
                    blockChanged = true;
                    delete o[flatKey];
                    changed = true;
                }
            });
            if (block !== null) {
                if (Object.keys(block).length > 0) typ[roleKey] = block;
                else delete typ[roleKey];
            }
            return blockChanged;
        };

        if (hasInputLegacy) {
            const inp = { ...(typ.inputText && typeof typ.inputText === 'object' ? typ.inputText : {}) };
            if (setNestedString(inp, 'fontFamily', o.fontFamily)) changed = true;
            if (setNestedBool(inp, 'bold', o.fontBold)) changed = true;
            if (setNestedString(inp, 'color', o.textColor)) changed = true;
            if (setNestedFontSize(inp, o.fontSize)) changed = true;
            if (setNestedTextAlign(inp, o.textAlign)) changed = true;
            if (Object.keys(inp).length > 0) typ.inputText = inp;
            else delete typ.inputText;
            inputLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (hasLabelLegacy) {
            const lbl = { ...(typ.widgetLabel && typeof typ.widgetLabel === 'object' ? typ.widgetLabel : {}) };
            if (setNestedString(lbl, 'fontFamily', o.labelFont)) changed = true;
            if (setNestedFontSize(lbl, o.labelFs)) changed = true;
            if (setNestedString(lbl, 'color', o.labelCol)) changed = true;
            if (setNestedString(lbl, 'textTransform', o.labelCase)) changed = true;
            if (setNestedBool(lbl, 'bold', o.labelBold)) changed = true;
            if (o.labelOffX !== undefined && o.labelOffX !== null && String(o.labelOffX).trim() !== '') {
                const n = Number(o.labelOffX);
                lbl.offsetX = Number.isFinite(n) ? n : o.labelOffX;
                changed = true;
            } else if (o.labelOffX === 0) {
                lbl.offsetX = 0;
                changed = true;
            }
            if (o.labelOffY !== undefined && o.labelOffY !== null && String(o.labelOffY).trim() !== '') {
                const n = Number(o.labelOffY);
                lbl.offsetY = Number.isFinite(n) ? n : o.labelOffY;
                changed = true;
            } else if (o.labelOffY === 0) {
                lbl.offsetY = 0;
                changed = true;
            }
            if (Object.keys(lbl).length > 0) typ.widgetLabel = lbl;
            else delete typ.widgetLabel;
            labelLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (liftFlatKeys('inputText', this.EDITBOX_INPUT_FLAT_TYPO_KEYS)) changed = true;
        if (liftFlatKeys('widgetLabel', this.EDITBOX_LABEL_FLAT_TYPO_KEYS)) changed = true;

        if (hasOrphanInputAlign) {
            const inp = { ...(typ.inputText && typeof typ.inputText === 'object' ? typ.inputText : {}) };
            if (!Object.prototype.hasOwnProperty.call(inp, 'textAlign')) {
                if (setNestedTextAlign(inp, o.textAlign)) {
                    typ.inputText = inp;
                    delete o.textAlign;
                    changed = true;
                }
            } else if (o.textAlign !== undefined) {
                delete o.textAlign;
                changed = true;
            }
        }

        if (Object.keys(typ).length > 0) o.typography = typ;
        else if (o.typography) {
            delete o.typography;
            changed = true;
        }

        return changed;
    },

    /**
     * Widget label typography (Container, Battery, …): flat `label*` → nested `typography.widgetLabel`.
     * Idempotent; `label` text stays flat.
     */
    _migrateWidgetLabelTypographyOverridesToCanonical: function (o) {
        if (!o || typeof o !== 'object') return false;
        const flatKeys = this.CONTAINER_LABEL_FLAT_TYPO_KEYS;
        if (!flatKeys.some((k) => o[k] !== undefined)) return false;
        const flatToNested = {
            labelFont: 'fontFamily',
            labelFs: 'fontSize',
            labelAlign: 'textAlign',
            labelCase: 'textTransform',
            labelBold: 'bold',
            labelItalic: 'italic',
            labelCol: 'color',
            labelOffX: 'offsetX',
            labelOffY: 'offsetY'
        };
        return this._liftFlatTypographyKeysOnOverrides(o, 'widgetLabel', flatToNested, flatKeys);
    },

    _migrateContainerOverridesToCanonical: function (o) {
        return this._migrateWidgetLabelTypographyOverridesToCanonical(o);
    },

    /** True when dashboard still carries pre–axis-X/Y-split graph axis typography keys. */
    _dashboardHasLegacyGraphAxisTypography: function (data) {
        if (!data || typeof data !== 'object') return false;
        const m = data.master;
        if (m && typeof m === 'object') {
            if (m.defaultGraphAxisFont !== undefined
                    || m.defaultGraphAxisFontSize !== undefined
                    || m.defaultGraphAxisFontColor !== undefined
                    || m.defaultGraphAxisFontBold !== undefined) {
                return true;
            }
        }
        let found = false;
        this._forEachWidget(data, (w) => {
            if (found || !w || w.type !== 'graph' || !w.overrides) return;
            const o = w.overrides;
            const legacyFlat = this.GRAPH_AXIS_LEGACY_FLAT_TYPO_KEYS;
            if (legacyFlat.some((k) => o[k] !== undefined)) {
                found = true;
                return;
            }
            const typ = o.typography;
            if (typ && typeof typ === 'object' && typ.axis && typeof typ.axis === 'object') {
                found = true;
            }
        });
        return found;
    },

    /**
     * Graph multi-series heal (2.3.0). Runs the graph batch again on dashboards that
     * already carry a 2.3.0 stamp but still hold pre-overhaul flat graph keys (saved by
     * an intermediate build) or graphs without a `series` list. Idempotent: once the
     * batch has converted every graph, the check finds nothing and stays out of the way.
     */
    GRAPH_SERIES_LEGACY_FLAT_WIDGET_KEYS: [
        'data', 'lineWidth', 'lineColor', 'fill', 'fillOpacity', 'fillCol', 'negFillCol',
        'barColor', 'pointColor', 'linearTimeScale', 'barOutlineColor', 'negBarOutlineColor'
    ],

    _dashboardHasLegacyGraphSeriesShape: function (data) {
        if (!data || typeof data !== 'object') return false;
        let found = false;
        this._forEachWidget(data, (w) => {
            if (found || !w || w.type !== 'graph') return;
            const o = w.overrides;
            if (!o || typeof o !== 'object' || !Array.isArray(o.series) || o.series.length === 0) {
                found = true;
                return;
            }
            if (this.GRAPH_SERIES_LEGACY_FLAT_WIDGET_KEYS.some((k) => o[k] !== undefined)) {
                found = true;
                return;
            }
            if (o.autoMin !== undefined || o.min !== undefined || o.autoMax !== undefined || o.max !== undefined) {
                found = true;
                return;
            }
            if (w.bindings && (w.bindings.data !== undefined || w.bindings.barColor !== undefined || w.bindings.lineColor !== undefined || w.bindings.fillCol !== undefined || w.bindings.negFillCol !== undefined || w.bindings.pointColor !== undefined || w.bindings.barOutlineColor !== undefined || w.bindings.negBarOutlineColor !== undefined || w.bindings.autoMin !== undefined || w.bindings.min !== undefined || w.bindings.autoMax !== undefined || w.bindings.max !== undefined)) {
                found = true;
                return;
            }
            const names = Object.keys(o);
            for (let n = 0; n < names.length; n++) {
                const key = names[n];
                if (key.indexOf('barOutlineColor_') === 0 || key.indexOf('negBarOutlineColor_') === 0 || key.indexOf('barColor_') === 0 || key.indexOf('lineColor_') === 0 || key.indexOf('fillCol_') === 0 || key.indexOf('negFillCol_') === 0 || key.indexOf('pointColor_') === 0) {
                    found = true;
                    return;
                }
            }
        });
        if (found) return true;
        const globals = data.globalBindings;
        if (globals && typeof globals === 'object') {
            const legacyGlobals = ['defaultGraphBarColor', 'graphLineCol', 'graphFillCol', 'graphNegFillColor', 'defaultGraphPointColor', 'defaultGraphAutoMin', 'defaultGraphAutoMax'];
            for (let g = 0; g < legacyGlobals.length; g++) {
                if (typeof globals[legacyGlobals[g]] === 'string' && globals[legacyGlobals[g]] !== '') return true;
            }
        }
        return false;
    },

    /** Graph master: `defaultGraphAxisFont*` → `defaultGraphAxisXFont*` (1.10.0 axis X/Y split). */
    _migrateGraphAxisTypographySplitV110Master: function (m) {
        if (!m || typeof m !== 'object') return false;
        let changed = false;
        const renames = [
            ['defaultGraphAxisFont', 'defaultGraphAxisXFont'],
            ['defaultGraphAxisFontSize', 'defaultGraphAxisXFontSize'],
            ['defaultGraphAxisFontColor', 'defaultGraphAxisXFontColor'],
            ['defaultGraphAxisFontBold', 'defaultGraphAxisXFontBold']
        ];
        renames.forEach(([oldKey, newKey]) => {
            if (m[oldKey] === undefined) return;
            if (m[newKey] === undefined) m[newKey] = m[oldKey];
            delete m[oldKey];
            changed = true;
        });
        return changed;
    },

    /**
     * Graph instance: `typography.axis` + flat `axisFont*` → `typography.axisX` only (1.10.0).
     * Does not seed `typography.axisY`.
     */
    _migrateGraphAxisTypographySplitV110Overrides: function (o) {
        if (!o || typeof o !== 'object') return false;
        let changed = false;
        const typ = { ...(o.typography && typeof o.typography === 'object' ? o.typography : {}) };

        if (typ.axis && typeof typ.axis === 'object') {
            const prevX = typ.axisX && typeof typ.axisX === 'object' ? typ.axisX : {};
            typ.axisX = { ...typ.axis, ...prevX };
            delete typ.axis;
            changed = true;
        }

        const flatToNested = {
            axisFont: 'fontFamily',
            axisFontSize: 'fontSize',
            axisFontColor: 'color',
            axisFontBold: 'bold'
        };
        this.GRAPH_AXIS_LEGACY_FLAT_TYPO_KEYS.forEach((flatKey) => {
            if (o[flatKey] === undefined) return;
            const prop = flatToNested[flatKey];
            if (!prop) return;
            if (!typ.axisX || typeof typ.axisX !== 'object') typ.axisX = {};
            typ.axisX[prop] = o[flatKey];
            delete o[flatKey];
            changed = true;
        });

        if (typ.axis) {
            delete typ.axis;
            changed = true;
        }

        if (Object.keys(typ).length > 0) o.typography = typ;
        else if (o.typography) {
            delete o.typography;
            changed = true;
        }

        return changed;
    },

    /**
     * Graph: flat widgetLabel / axisX / dataText typography → nested `typography.*`.
     * Idempotent; reuses widget-label lift for `label*`.
     */
    _migrateGraphScaleKeys: function (wOrOverrides) {
        if (!wOrOverrides || typeof wOrOverrides !== 'object') return false;
        const w = (wOrOverrides.overrides && typeof wOrOverrides.overrides === 'object') ? wOrOverrides : null;
        const o = w ? w.overrides : wOrOverrides;
        const b = (w && w.bindings && typeof w.bindings === 'object') ? w.bindings : null;
        let changed = false;
        const pairs = [
            { from: 'autoMin', to: 'dynamicFloor' },
            { from: 'min', to: 'fixedFloor' },
            { from: 'autoMax', to: 'dynamicCeiling' },
            { from: 'max', to: 'fixedCeiling' }
        ];
        const suffixes = this.TYPOGRAPHY_AUX_SUFFIXES;
        for (let p = 0; p < pairs.length; p++) {
            const pair = pairs[p];
            if (o[pair.from] !== undefined) {
                if (o[pair.to] === undefined) o[pair.to] = o[pair.from];
                delete o[pair.from];
                changed = true;
            }
            if (suffixes && suffixes.length) {
                for (let s = 0; s < suffixes.length; s++) {
                    const fromAux = pair.from + suffixes[s];
                    const toAux = pair.to + suffixes[s];
                    if (Object.prototype.hasOwnProperty.call(o, fromAux)) {
                        if (!Object.prototype.hasOwnProperty.call(o, toAux)) {
                            o[toAux] = o[fromAux];
                        }
                        delete o[fromAux];
                        changed = true;
                    }
                }
            }
            if (b && typeof b[pair.from] === 'string' && b[pair.from] !== '') {
                if (b[pair.to] === undefined || b[pair.to] === '') {
                    b[pair.to] = b[pair.from];
                }
                delete b[pair.from];
                changed = true;
            } else if (b && b[pair.from] !== undefined) {
                delete b[pair.from];
                changed = true;
            }
        }
        if (o.graphAnimation === 'draw') {
            o.graphAnimation = 'morph';
            changed = true;
        }
        if (o.pointValuesInterval !== undefined) {
            const oldVal = Number(o.pointValuesInterval);
            if (o.pointValuesTimeWidth === undefined) {
                o.pointValuesTimeWidth = Math.max(1, Math.round((oldVal > 0 ? oldVal : 1) * 48));
            }
            if (o.pointValuesStep === undefined) {
                o.pointValuesStep = Math.max(1, Math.round(oldVal >= 1 ? oldVal : 1));
            }
            delete o.pointValuesInterval;
            changed = true;
        }
        if (suffixes && suffixes.length) {
            for (let s = 0; s < suffixes.length; s++) {
                const fromAux = 'pointValuesInterval' + suffixes[s];
                const toAux = 'pointValuesTimeWidth' + suffixes[s];
                if (Object.prototype.hasOwnProperty.call(o, fromAux)) {
                    if (!Object.prototype.hasOwnProperty.call(o, toAux)) {
                        o[toAux] = o[fromAux];
                    }
                    delete o[fromAux];
                    changed = true;
                }
            }
        }
        if (b && b.pointValuesInterval !== undefined) {
            if (typeof b.pointValuesInterval === 'string' && b.pointValuesInterval !== '') {
                if (b.pointValuesTimeWidth === undefined || b.pointValuesTimeWidth === '') {
                    b.pointValuesTimeWidth = b.pointValuesInterval;
                }
            }
            delete b.pointValuesInterval;
            changed = true;
        }
        return changed;
    },

    _migrateGraphOverridesToCanonical: function (o) {
        if (!o || typeof o !== 'object') return false;

        let changed = this._migrateWidgetLabelTypographyOverridesToCanonical(o) === true;

        const scalePairs = [
            { from: 'autoMin', to: 'dynamicFloor' },
            { from: 'min', to: 'fixedFloor' },
            { from: 'autoMax', to: 'dynamicCeiling' },
            { from: 'max', to: 'fixedCeiling' }
        ];
        const suffixes = this.TYPOGRAPHY_AUX_SUFFIXES;
        for (let p = 0; p < scalePairs.length; p++) {
            const pair = scalePairs[p];
            if (o[pair.from] !== undefined) {
                if (o[pair.to] === undefined) o[pair.to] = o[pair.from];
                delete o[pair.from];
                changed = true;
            }
            if (suffixes && suffixes.length) {
                for (let s = 0; s < suffixes.length; s++) {
                    const fromAux = pair.from + suffixes[s];
                    const toAux = pair.to + suffixes[s];
                    if (Object.prototype.hasOwnProperty.call(o, fromAux)) {
                        if (!Object.prototype.hasOwnProperty.call(o, toAux)) {
                            o[toAux] = o[fromAux];
                        }
                        delete o[fromAux];
                        changed = true;
                    }
                }
            }
        }

        const axisKeys = this.GRAPH_AXIS_X_FLAT_TYPO_KEYS;
        const textKeys = this.GRAPH_DATA_TEXT_FLAT_TYPO_KEYS;
        const hasAxis = axisKeys.some((k) => o[k] !== undefined);
        const hasText = textKeys.some((k) => o[k] !== undefined);
        if (!hasAxis && !hasText) return changed;

        const setNestedString = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            const s = String(raw).trim();
            if (!s && prop !== 'textTransform') return false;
            block[prop] = raw;
            return true;
        };
        const setNestedBool = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            block[prop] = !!raw;
            return true;
        };
        const setNestedFontSize = (block, raw) => {
            if (raw === undefined || raw === null) return false;
            const n = Number(raw);
            if (Number.isFinite(n)) {
                block.fontSize = n;
                return true;
            }
            const s = String(raw).trim();
            if (!s) return false;
            block.fontSize = raw;
            return true;
        };

        const flatToNested = {
            axisXFont: 'fontFamily',
            axisXFontSize: 'fontSize',
            axisXFontColor: 'color',
            axisXFontBold: 'bold',
            axisXFontOpacity: 'opacity',
            axisYFontOpacity: 'opacity',
            textFont: 'fontFamily',
            textSize: 'fontSize',
            textColor: 'color',
            textFontBold: 'bold'
        };

        const typ = { ...(o.typography && typeof o.typography === 'object' ? o.typography : {}) };

        const liftRole = (roleKey, flatKeys) => {
            let block = null;
            flatKeys.forEach((flatKey) => {
                if (o[flatKey] === undefined) return;
                const prop = flatToNested[flatKey];
                if (!prop) return;
                if (block === null) {
                    block = { ...(typ[roleKey] && typeof typ[roleKey] === 'object' ? typ[roleKey] : {}) };
                }
                if (prop === 'bold') {
                    if (setNestedBool(block, prop, o[flatKey])) {
                        delete o[flatKey];
                        changed = true;
                    }
                } else if (prop === 'fontSize') {
                    if (setNestedFontSize(block, o[flatKey])) {
                        delete o[flatKey];
                        changed = true;
                    }
                } else if (setNestedString(block, prop, o[flatKey])) {
                    delete o[flatKey];
                    changed = true;
                }
            });
            if (block !== null) {
                if (Object.keys(block).length > 0) typ[roleKey] = block;
                else delete typ[roleKey];
            }
        };

        if (hasAxis) liftRole('axisX', axisKeys);
        if (hasText) liftRole('dataText', textKeys);

        if (Object.keys(typ).length > 0) o.typography = typ;
        else if (o.typography) {
            delete o.typography;
            changed = true;
        }

        return changed;
    },

    _migrateSliderBindingsFlatToNested: function (b) {
        if (!b || typeof b !== 'object' || typeof BindingsTree === 'undefined') return false;
        const spec = typeof SliderWidget !== 'undefined' ? SliderWidget.getNestedBindingOverlaySpec() : null;
        if (!spec || !spec.length) return false;
        let changed = false;
        spec.forEach(({ path, configKey }) => {
            if (typeof b[configKey] !== 'string') return;
            const topic = b[configKey];
            BindingsTree.setAtPath(b, path, topic);
            delete b[configKey];
            changed = true;
        });
        return changed;
    },

    _migrateIconWidgetMasterDefaults: function (m) {
        if (!m || typeof m !== 'object') return false;
        let changed = false;
        if (m.defaultIconWidgetSource === undefined || m.defaultIconWidgetSource === null || m.defaultIconWidgetSource === '') {
            m.defaultIconWidgetSource = 'phosphor';
            changed = true;
        }
        if (m.defaultIconWidgetBuiltin === undefined || m.defaultIconWidgetBuiltin === null) {
            m.defaultIconWidgetBuiltin = 'ph-warning';
            changed = true;
        }
        if (m.defaultIconWidgetWeight === undefined || m.defaultIconWidgetWeight === null || m.defaultIconWidgetWeight === '') {
            m.defaultIconWidgetWeight = m.defaultIconFilled === false ? 'regular' : 'fill';
            changed = true;
        }
        if (m.defaultIconWidgetCustomUrl === undefined || m.defaultIconWidgetCustomUrl === null) {
            m.defaultIconWidgetCustomUrl = '';
            changed = true;
        }
        if (m.defaultIconWidgetTintImage === undefined || m.defaultIconWidgetTintImage === null) {
            m.defaultIconWidgetTintImage = false;
            changed = true;
        }
        if (m.defaultIconWidgetAccentColor === undefined || m.defaultIconWidgetAccentColor === null || m.defaultIconWidgetAccentColor === '') {
            m.defaultIconWidgetAccentColor = '@iconAccent';
            changed = true;
        }
        if (m.defaultIconWidgetActiveSource === undefined || m.defaultIconWidgetActiveSource === null || m.defaultIconWidgetActiveSource === '') {
            m.defaultIconWidgetActiveSource = 'phosphor';
            changed = true;
        }
        if (m.defaultIconWidgetActiveBuiltin === undefined || m.defaultIconWidgetActiveBuiltin === null) {
            m.defaultIconWidgetActiveBuiltin = '';
            changed = true;
        }
        if (m.defaultIconWidgetActiveWeight === undefined || m.defaultIconWidgetActiveWeight === null || m.defaultIconWidgetActiveWeight === '') {
            m.defaultIconWidgetActiveWeight = m.defaultIconFilled === false ? 'regular' : 'fill';
            changed = true;
        }
        if (m.defaultIconWidgetActiveCustomUrl === undefined || m.defaultIconWidgetActiveCustomUrl === null) {
            m.defaultIconWidgetActiveCustomUrl = '';
            changed = true;
        }
        if (m.defaultIconWidgetActiveTintImage === undefined || m.defaultIconWidgetActiveTintImage === null) {
            m.defaultIconWidgetActiveTintImage = false;
            changed = true;
        }
        if (m.defaultIconWidgetActiveAccentColor === undefined || m.defaultIconWidgetActiveAccentColor === null || m.defaultIconWidgetActiveAccentColor === '') {
            m.defaultIconWidgetActiveAccentColor = '@iconAccent';
            changed = true;
        }
        return changed;
    },

    _iconWidgetColorMatchesDefault: function (val, def) {
        if (val === undefined || val === null || val === '') return true;
        return String(val).trim() === String(def).trim();
    },

    /**
     * Icon widget: inactive/active slots, colors in nested icons, mirror flag.
     * Idempotent; heals single-slot `icons.on` era and flat `colActive` / `colInactive`.
     */
    _migrateIconWidgetDualSlotsAndColors: function (o, master) {
        if (!o || typeof o !== 'object') return false;
        const M = master && typeof master === 'object' ? master : {};
        const defOffColor = M.iconInactive || '@icon';
        const defOnColor = M.iconActive || '@danger';
        const colorDefault = (val, def) => this._iconWidgetColorMatchesDefault(val, def);
        let changed = false;

        if (o.colInactive !== undefined) {
            if (!colorDefault(o.colInactive, defOffColor)) {
                if (!o.icons || typeof o.icons !== 'object') o.icons = {};
                if (!o.icons.off || typeof o.icons.off !== 'object') o.icons.off = {};
                o.icons.off.color = o.colInactive;
            }
            delete o.colInactive;
            changed = true;
        }
        if (o.colActive !== undefined) {
            if (!colorDefault(o.colActive, defOnColor)) {
                if (!o.icons || typeof o.icons !== 'object') o.icons = {};
                if (!o.icons.on || typeof o.icons.on !== 'object') o.icons.on = {};
                o.icons.on.color = o.colActive;
            }
            delete o.colActive;
            changed = true;
        }

        const hasOn = o.icons && o.icons.on && typeof o.icons.on === 'object';
        const hasOff = o.icons && o.icons.off && typeof o.icons.off === 'object';
        if (hasOn && !hasOff) {
            const prevOn = { ...o.icons.on };
            o.icons.off = { ...prevOn };
            const onColor = prevOn.color;
            o.icons.on = {};
            if (onColor !== undefined && !colorDefault(onColor, defOnColor)) {
                o.icons.on.color = onColor;
            }
            o.activeIconMirrorsInactive = true;
            changed = true;
        }

        if (o.icons && o.icons.off && o.icons.on && o.activeIconMirrorsInactive === undefined) {
            if (typeof IconWidget !== 'undefined' && IconWidget.iconSlotsShareIdentity
                    && IconWidget.iconSlotsShareIdentity(o.icons.off, o.icons.on)) {
                o.activeIconMirrorsInactive = true;
            } else {
                o.activeIconMirrorsInactive = false;
            }
            changed = true;
        }

        if (typeof IconWidget !== 'undefined' && IconWidget.normalizeMirroredInactiveActiveGlyphStored) {
            const glyphStored = IconWidget.normalizeMirroredInactiveActiveGlyphStored(o);
            if (glyphStored) changed = true;
        }

        return changed;
    },

    /**
     * List: flat typography + icon keys → nested `typography` / `icons.row|checkboxOn|checkboxOff`.
     * Idempotent; heals dashboards that still carry pre-conversion flat keys.
     */
    _migrateListOverridesToCanonical: function (o) {
        if (!o || typeof o !== 'object') return false;

        const itemLegacy = this.LIST_ITEM_TYPO_LEGACY_KEYS;
        const tsLegacy = this.LIST_TIMESTAMP_TYPO_LEGACY_KEYS;
        const labelLegacy = this.LIST_LABEL_TYPO_LEGACY_KEYS;
        const iconLegacy = this.LIST_ICON_LEGACY_KEYS;

        const hasItem = itemLegacy.some((k) => o[k] !== undefined);
        const hasTs = tsLegacy.some((k) => o[k] !== undefined);
        const hasLabel = labelLegacy.some((k) => o[k] !== undefined);
        const hasIcon = iconLegacy.some((k) => o[k] !== undefined);

        if (!hasItem && !hasTs && !hasLabel && !hasIcon) {
            return false;
        }

        const setNestedString = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            const s = String(raw).trim();
            if (!s && prop !== 'textTransform') return false;
            block[prop] = raw;
            return true;
        };

        const setNestedBool = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            block[prop] = !!raw;
            return true;
        };

        const setNestedFontSize = (block, raw) => {
            if (raw === undefined || raw === null) return false;
            const n = Number(raw);
            if (Number.isFinite(n)) {
                block.fontSize = n;
                return true;
            }
            const s = String(raw).trim();
            if (!s) return false;
            block.fontSize = raw;
            return true;
        };

        const filledToWeight = (filled) => (filled === false ? 'regular' : 'fill');

        const normalizeBuiltin = (raw) => {
            const s = String(raw || '').trim();
            if (!s) return '';
            if (s.startsWith('ph-')) return s;
            if (s.startsWith('ph ')) return s.slice(3).trim();
            return s;
        };

        let changed = false;
        const typ = { ...(o.typography && typeof o.typography === 'object' ? o.typography : {}) };

        if (hasItem) {
            const block = { ...(typ.listItem && typeof typ.listItem === 'object' ? typ.listItem : {}) };
            if (setNestedString(block, 'fontFamily', o.fontFamily)) changed = true;
            if (setNestedFontSize(block, o.fontSize)) changed = true;
            if (setNestedBool(block, 'bold', o.fontBold)) changed = true;
            if (setNestedString(block, 'color', o.textColor)) changed = true;
            if (setNestedString(block, 'textTransform', o.textCase)) changed = true;
            if (Object.keys(block).length > 0) typ.listItem = block;
            else delete typ.listItem;
            itemLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (hasTs) {
            const block = { ...(typ.listTimestamp && typeof typ.listTimestamp === 'object' ? typ.listTimestamp : {}) };
            if (setNestedFontSize(block, o.timeSize)) changed = true;
            if (setNestedString(block, 'color', o.timeColor)) changed = true;
            if (Object.keys(block).length > 0) typ.listTimestamp = block;
            else delete typ.listTimestamp;
            tsLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (hasLabel) {
            const block = { ...(typ.listLabel && typeof typ.listLabel === 'object' ? typ.listLabel : {}) };
            if (setNestedString(block, 'fontFamily', o.labelFont)) changed = true;
            if (setNestedFontSize(block, o.labelFs)) changed = true;
            if (setNestedString(block, 'color', o.labelCol)) changed = true;
            if (setNestedString(block, 'textAlign', o.labelAlign)) changed = true;
            if (setNestedString(block, 'textTransform', o.labelCase)) changed = true;
            if (setNestedBool(block, 'bold', o.labelBold)) changed = true;
            if (o.labelOffX !== undefined && o.labelOffX !== null && String(o.labelOffX).trim() !== '') {
                const n = Number(o.labelOffX);
                block.offsetX = Number.isFinite(n) ? n : o.labelOffX;
                changed = true;
            } else if (o.labelOffX === 0) {
                block.offsetX = 0;
                changed = true;
            }
            if (o.labelOffY !== undefined && o.labelOffY !== null && String(o.labelOffY).trim() !== '') {
                const n = Number(o.labelOffY);
                block.offsetY = Number.isFinite(n) ? n : o.labelOffY;
                changed = true;
            } else if (o.labelOffY === 0) {
                block.offsetY = 0;
                changed = true;
            }
            if (Object.keys(block).length > 0) typ.listLabel = block;
            else delete typ.listLabel;
            labelLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (Object.keys(typ).length > 0) o.typography = typ;
        else if (o.typography) {
            delete o.typography;
            changed = true;
        }

        if (hasIcon) {
            if (!o.icons || typeof o.icons !== 'object') o.icons = {};
            const row = { ...(o.icons.row && typeof o.icons.row === 'object' ? o.icons.row : {}) };
            const cbOn = { ...(o.icons.checkboxOn && typeof o.icons.checkboxOn === 'object' ? o.icons.checkboxOn : {}) };
            const cbOff = { ...(o.icons.checkboxOff && typeof o.icons.checkboxOff === 'object' ? o.icons.checkboxOff : {}) };

            if (o.defaultIcon !== undefined) {
                const builtin = normalizeBuiltin(o.defaultIcon);
                if (builtin) {
                    row.builtin = builtin;
                    row.source = 'phosphor';
                }
                delete o.defaultIcon;
                changed = true;
            }
            if (o.iconColor !== undefined) {
                row.color = o.iconColor;
                delete o.iconColor;
                changed = true;
            }
            if (o.iconSize !== undefined && o.iconSize !== null && o.iconSize !== '') {
                const n = Number(o.iconSize);
                if (Number.isFinite(n)) row.size = n;
                delete o.iconSize;
                changed = true;
            }
            if (o.checkboxIconOn !== undefined) {
                const builtin = normalizeBuiltin(o.checkboxIconOn);
                if (builtin) {
                    cbOn.builtin = builtin;
                    cbOn.source = 'phosphor';
                }
                delete o.checkboxIconOn;
                changed = true;
            }
            if (o.checkboxIconOff !== undefined) {
                const builtin = normalizeBuiltin(o.checkboxIconOff);
                cbOff.builtin = builtin || 'ph-square';
                cbOff.source = 'phosphor';
                delete o.checkboxIconOff;
                changed = true;
            }
            if (o.checkboxIconOnFilled !== undefined) {
                cbOn.weight = filledToWeight(o.checkboxIconOnFilled);
                delete o.checkboxIconOnFilled;
                changed = true;
            }
            if (o.checkboxIconOffFilled !== undefined) {
                cbOff.weight = filledToWeight(o.checkboxIconOffFilled);
                delete o.checkboxIconOffFilled;
                changed = true;
            }
            if (o.checkboxColorOn !== undefined) {
                cbOn.color = o.checkboxColorOn;
                delete o.checkboxColorOn;
                changed = true;
            }
            if (o.checkboxColorOff !== undefined) {
                cbOff.color = o.checkboxColorOff;
                delete o.checkboxColorOff;
                changed = true;
            }
            if (o.checkboxIconSize !== undefined && o.checkboxIconSize !== null && o.checkboxIconSize !== '') {
                const n = Number(o.checkboxIconSize);
                if (Number.isFinite(n)) {
                    cbOn.size = n;
                    cbOff.size = n;
                }
                delete o.checkboxIconSize;
                changed = true;
            }

            if (Object.keys(row).length > 0) o.icons.row = row;
            if (Object.keys(cbOn).length > 0) o.icons.checkboxOn = cbOn;
            if (Object.keys(cbOff).length > 0) o.icons.checkboxOff = cbOff;

            if (o.icons && typeof o.icons === 'object' && Object.keys(o.icons).length === 0) {
                delete o.icons;
            }

            iconLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (changed && typeof ListWidget !== 'undefined' && ListWidget.healListIconOverrides) {
            ListWidget.healListIconOverrides(o);
        }

        return changed;
    },

    /**
     * List: heal nested icons (flat canonical keys, wrong Off glyph copied from On). Idempotent on load.
     */
    _healListWidgetIconOverrides: function (o) {
        if (!o || typeof o !== 'object') return false;
        if (typeof ListWidget === 'undefined' || !ListWidget.healListIconOverrides) return false;
        return ListWidget.healListIconOverrides(o);
    },

    /**
     * Light grid: tile typography + per-light icons → nested `typography.lightName` / `lightsData[].icons.on`.
     * Idempotent; lifts stray `lgLightName*` and legacy `icon` / `iconUrl` on each light.
     */
    _migrateLightGridOverridesToCanonical: function (o, master) {
        if (!o || typeof o !== 'object') return false;
        let changed = false;

        if (Object.prototype.hasOwnProperty.call(o, 'rowGap') && !Object.prototype.hasOwnProperty.call(o, 'itemSpacing')) {
            o.itemSpacing = o.rowGap;
            delete o.rowGap;
            changed = true;
        }

        if (o.labelPos === 'center' || o.labelPos === 'top') {
            o.labelPos = 'top_center';
            changed = true;
        } else if (o.labelPos === 'bottom') {
            o.labelPos = 'bottom_center';
            changed = true;
        } else if (o.labelPos === 'left') {
            o.labelPos = 'top_left';
            changed = true;
        } else if (o.labelPos === 'right') {
            o.labelPos = 'top_right';
            changed = true;
        }

        const setNestedString = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            const s = String(raw).trim();
            if (!s && prop !== 'textTransform') return false;
            block[prop] = raw;
            return true;
        };
        const setNestedBool = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            block[prop] = !!raw;
            return true;
        };
        const setNestedFontSize = (block, raw) => {
            if (raw === undefined || raw === null) return false;
            const n = Number(raw);
            if (Number.isFinite(n)) {
                block.fontSize = n;
                return true;
            }
            const s = String(raw).trim();
            if (!s) return false;
            block.fontSize = raw;
            return true;
        };
        const setNestedOffset = (block, prop, raw) => {
            if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
                const n = Number(raw);
                block[prop] = Number.isFinite(n) ? n : raw;
                return true;
            }
            if (raw === 0) {
                block[prop] = 0;
                return true;
            }
            return false;
        };

        const mergeTileTextColorIntoLightName = () => {
            const hadColTileText = o.colTileText !== undefined;
            const hadInstLgColTileText = o.lgColTileText !== undefined;
            if (!hadColTileText && !hadInstLgColTileText) return;
            const typ = { ...(o.typography && typeof o.typography === 'object' ? o.typography : {}) };
            const block = { ...(typ.lightName && typeof typ.lightName === 'object' ? typ.lightName : {}) };
            const colorUnset = block.color === undefined || block.color === null || String(block.color).trim() === '';
            let merged = false;
            if (colorUnset) {
                const raw = hadColTileText ? o.colTileText : o.lgColTileText;
                merged = setNestedString(block, 'color', raw);
                if (merged) {
                    typ.lightName = block;
                    o.typography = typ;
                }
            }
            if (hadColTileText) {
                delete o.colTileText;
                changed = true;
            }
            if (hadInstLgColTileText) {
                delete o.lgColTileText;
                changed = true;
            }
        };
        mergeTileTextColorIntoLightName();

        const migrateLegacyTypoBlock = (roleKey, legacyKeys, mapFn) => {
            if (!legacyKeys.some((k) => o[k] !== undefined)) return;
            const typ = { ...(o.typography && typeof o.typography === 'object' ? o.typography : {}) };
            const block = { ...(typ[roleKey] && typeof typ[roleKey] === 'object' ? typ[roleKey] : {}) };
            if (mapFn(block)) typ[roleKey] = block;
            o.typography = typ;
            legacyKeys.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        };

        migrateLegacyTypoBlock('lightName', this.LIGHT_GRID_TILE_TYPO_LEGACY_KEYS, (lightName) => {
            let wrote = false;
            if (o.tileFont !== undefined) {
                lightName.fontFamily = o.tileFont;
                wrote = true;
            }
            if (o.tileFontBold !== undefined) {
                lightName.bold = !!o.tileFontBold;
                wrote = true;
            }
            if (wrote) changed = true;
            return wrote;
        });

        migrateLegacyTypoBlock('widgetLabel', this.LIGHT_GRID_WIDGET_LABEL_LEGACY_KEYS, (block) => {
            let wrote = false;
            if (setNestedString(block, 'fontFamily', o.labelFont)) wrote = true;
            if (setNestedFontSize(block, o.labelFs)) wrote = true;
            if (setNestedString(block, 'textAlign', o.labelAlign)) wrote = true;
            if (setNestedString(block, 'textTransform', o.labelCase)) wrote = true;
            if (setNestedBool(block, 'bold', o.labelBold)) wrote = true;
            if (setNestedString(block, 'color', o.labelCol)) wrote = true;
            if (setNestedOffset(block, 'offsetX', o.labelOffX)) wrote = true;
            if (setNestedOffset(block, 'offsetY', o.labelOffY)) wrote = true;
            if (wrote) changed = true;
            return wrote;
        });

        migrateLegacyTypoBlock('panelTitle', this.LIGHT_GRID_PANEL_TITLE_LEGACY_KEYS, (block) => {
            let wrote = false;
            if (setNestedString(block, 'fontFamily', o.panelTitleFont)) wrote = true;
            if (setNestedFontSize(block, o.panelTitleFs)) wrote = true;
            if (setNestedString(block, 'textAlign', o.panelTitleAlign)) wrote = true;
            if (setNestedString(block, 'textTransform', o.panelTitleCase)) wrote = true;
            if (setNestedBool(block, 'bold', o.panelTitleBold)) wrote = true;
            if (setNestedString(block, 'color', o.panelTitleCol)) wrote = true;
            if (setNestedOffset(block, 'offsetX', o.panelTitleOffX)) wrote = true;
            if (setNestedOffset(block, 'offsetY', o.panelTitleOffY)) wrote = true;
            if (wrote) changed = true;
            return wrote;
        });

        const flatToNestedStandard = {
            lgLightNameFont: 'fontFamily',
            lgLightNameFs: 'fontSize',
            lgLightNameAlign: 'textAlign',
            lgLightNameCase: 'textTransform',
            lgLightNameBold: 'bold',
            lgLightNameCol: 'color',
            lgLightNameOffX: 'offsetX',
            lgLightNameOffY: 'offsetY',
            lgWidgetLabelFont: 'fontFamily',
            lgWidgetLabelFs: 'fontSize',
            lgWidgetLabelAlign: 'textAlign',
            lgWidgetLabelCase: 'textTransform',
            lgWidgetLabelBold: 'bold',
            lgWidgetLabelCol: 'color',
            lgWidgetLabelOffX: 'offsetX',
            lgWidgetLabelOffY: 'offsetY',
            lgPanelTitleFont: 'fontFamily',
            lgPanelTitleFs: 'fontSize',
            lgPanelTitleAlign: 'textAlign',
            lgPanelTitleCase: 'textTransform',
            lgPanelTitleBold: 'bold',
            lgPanelTitleCol: 'color',
            lgPanelTitleOffX: 'offsetX',
            lgPanelTitleOffY: 'offsetY'
        };
        const liftFlatKeys = (roleKey, flatKeys) => {
            let block = null;
            let blockChanged = false;
            flatKeys.forEach((flatKey) => {
                if (o[flatKey] === undefined) return;
                const prop = flatToNestedStandard[flatKey];
                if (!prop) return;
                if (block === null) {
                    const typ = o.typography && typeof o.typography === 'object' ? o.typography : {};
                    block = { ...(typ[roleKey] && typeof typ[roleKey] === 'object' ? typ[roleKey] : {}) };
                }
                let wrote = false;
                if (prop === 'bold') wrote = setNestedBool(block, prop, o[flatKey]);
                else if (prop === 'fontSize') wrote = setNestedFontSize(block, o[flatKey]);
                else if (prop === 'offsetX' || prop === 'offsetY') wrote = setNestedOffset(block, prop, o[flatKey]);
                else wrote = setNestedString(block, prop, o[flatKey]);
                if (wrote) {
                    blockChanged = true;
                    delete o[flatKey];
                }
            });
            if (block !== null) {
                const typ = { ...(o.typography && typeof o.typography === 'object' ? o.typography : {}) };
                if (Object.keys(block).length > 0) typ[roleKey] = block;
                else delete typ[roleKey];
                o.typography = typ;
            }
            return blockChanged;
        };

        if (liftFlatKeys('lightName', this.LIGHT_GRID_LIGHT_NAME_FLAT_INSTANCE_KEYS)) changed = true;
        if (liftFlatKeys('widgetLabel', this.LIGHT_GRID_WIDGET_LABEL_FLAT_INSTANCE_KEYS)) changed = true;
        if (liftFlatKeys('panelTitle', this.LIGHT_GRID_PANEL_TITLE_FLAT_INSTANCE_KEYS)) changed = true;

        if (o.typography && typeof o.typography === 'object' && Object.keys(o.typography).length === 0) {
            delete o.typography;
        }

        let lights = o.lightsData;
        if (typeof lights === 'string') {
            try { lights = JSON.parse(lights); } catch (e) { lights = null; }
        }
        if (Array.isArray(lights)) {
            lights.forEach((light) => {
                if (!light || typeof light !== 'object') return;
                const hasLegacyIcon = this.LIGHT_GRID_LIGHT_ICON_LEGACY_KEYS.some((k) => light[k] !== undefined);
                if (typeof LightGridWidget !== 'undefined' && LightGridWidget.ensureLightItemIcons) {
                    LightGridWidget.ensureLightItemIcons(light);
                } else if (!light.icons || typeof light.icons !== 'object') {
                    light.icons = { on: { source: 'phosphor', builtin: 'ph-lightbulb', weight: 'fill', customUrl: '', tintImage: false } };
                } else if (!light.icons.on || typeof light.icons.on !== 'object') {
                    light.icons.on = { source: 'phosphor', builtin: 'ph-lightbulb', weight: 'fill', customUrl: '', tintImage: false };
                }
                if (hasLegacyIcon) {
                    const on = light.icons.on;
                    const url = String(light.iconUrl || '').trim();
                    const builtin = String(light.icon || '').trim();
                    on.source = url ? 'custom' : 'phosphor';
                    on.builtin = url ? '' : (builtin || 'ph-lightbulb');
                    on.customUrl = url;
                    if (light.iconColorize === true) on.tintImage = true;
                    this.LIGHT_GRID_LIGHT_ICON_LEGACY_KEYS.forEach((k) => {
                        delete light[k];
                    });
                    changed = true;
                }
                if (typeof this._migratePhosphorIconSlotsFilledToWeightV186 === 'function' && light.icons) {
                    if (this._migratePhosphorIconSlotsFilledToWeightV186(light.icons, null)) changed = true;
                }
            });
            o.lightsData = lights;
        }

        return changed;
    },

    _migrateLightGridBindingsFlatToNested: function (b) {
        if (!b || typeof b !== 'object' || typeof BindingsTree === 'undefined') return false;
        const spec = typeof LightGridWidget !== 'undefined' ? LightGridWidget.getNestedBindingOverlaySpec() : null;
        if (!spec || !spec.length) return false;
        let changed = false;
        spec.forEach(({ path, configKey }) => {
            if (typeof b[configKey] !== 'string') return;
            const topic = b[configKey];
            BindingsTree.setAtPath(b, path, topic);
            delete b[configKey];
            changed = true;
        });
        return changed;
    },

    /**
     * Icon widget: flat caption + icon keys → nested typography.caption / icons.on.
     * Idempotent; lifts stray iconCaption* / iconSourceOn* instance keys.
     */
    _migrateIconWidgetOverridesToCanonical: function (o) {
        if (!o || typeof o !== 'object') return false;

        const captionLegacy = this.ICON_CAPTION_LEGACY_KEYS;
        const slotLegacy = this.ICON_SLOT_LEGACY_KEYS;
        const hasCaptionLegacy = captionLegacy.some((k) => o[k] !== undefined);
        const hasSlotLegacy = slotLegacy.some((k) => o[k] !== undefined);
        const hasCaptionFlat = this.ICON_CAPTION_FLAT_INSTANCE_KEYS.some((k) => o[k] !== undefined);
        const hasSlotFlat = this.ICON_SLOT_FLAT_INSTANCE_KEYS.some((k) => o[k] !== undefined);
        const hasSlotFlatOff = this.ICON_SLOT_FLAT_OFF_INSTANCE_KEYS.some((k) => o[k] !== undefined);

        if (!hasCaptionLegacy && !hasSlotLegacy && !hasCaptionFlat && !hasSlotFlat && !hasSlotFlatOff) {
            return false;
        }

        const setNestedString = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            const s = String(raw).trim();
            if (!s && prop !== 'textTransform') return false;
            block[prop] = raw;
            return true;
        };

        const setNestedBool = (block, prop, raw) => {
            if (raw === undefined || raw === null) return false;
            block[prop] = !!raw;
            return true;
        };

        const setNestedFontSize = (block, raw) => {
            if (raw === undefined || raw === null) return false;
            const n = Number(raw);
            if (Number.isFinite(n)) {
                block.fontSize = n;
                return true;
            }
            const s = String(raw).trim();
            if (!s) return false;
            block.fontSize = raw;
            return true;
        };

        const flatToNestedStandard = {
            iconCaptionFont: 'fontFamily',
            iconCaptionFs: 'fontSize',
            iconCaptionAlign: 'textAlign',
            iconCaptionCase: 'textTransform',
            iconCaptionBold: 'bold',
            iconCaptionCol: 'color',
            iconCaptionOpacity: 'opacity',
            iconCaptionOffX: 'offsetX',
            iconCaptionOffY: 'offsetY',
            iconSourceOn: 'source',
            iconOn: 'builtin',
            iconWeightOn: 'weight',
            imgOn: 'customUrl',
            colorizeOn: 'tintImage',
            iconSlotColOn: 'color',
            iconSlotAccentOn: 'accentColor',
            iconSourceOff: 'source',
            iconOff: 'builtin',
            iconWeightOff: 'weight',
            imgOff: 'customUrl',
            colorizeOff: 'tintImage',
            iconSlotColOff: 'color',
            iconSlotAccentOff: 'accentColor'
        };

        let changed = false;
        const typ = { ...(o.typography && typeof o.typography === 'object' ? o.typography : {}) };

        const liftFlatKeys = (roleKey, flatKeys) => {
            let block = null;
            let blockChanged = false;
            flatKeys.forEach((flatKey) => {
                if (o[flatKey] === undefined) return;
                const prop = flatToNestedStandard[flatKey];
                if (!prop) return;
                if (block === null) {
                    block = { ...(typ[roleKey] && typeof typ[roleKey] === 'object' ? typ[roleKey] : {}) };
                }
                let wrote = false;
                if (prop === 'bold' || prop === 'italic') wrote = setNestedBool(block, prop, o[flatKey]);
                else if (prop === 'fontSize') wrote = setNestedFontSize(block, o[flatKey]);
                else if (prop === 'offsetX' || prop === 'offsetY') {
                    const raw = o[flatKey];
                    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
                        const n = Number(raw);
                        block[prop] = Number.isFinite(n) ? n : raw;
                        wrote = true;
                    } else if (raw === 0) {
                        block[prop] = 0;
                        wrote = true;
                    }
                } else wrote = setNestedString(block, prop, o[flatKey]);
                if (wrote) {
                    blockChanged = true;
                    delete o[flatKey];
                }
            });
            if (block !== null) {
                if (Object.keys(block).length > 0) typ[roleKey] = block;
                else delete typ[roleKey];
            }
            return blockChanged;
        };

        if (hasCaptionLegacy) {
            const cap = { ...(typ.caption && typeof typ.caption === 'object' ? typ.caption : {}) };
            if (setNestedString(cap, 'fontFamily', o.labelFont)) changed = true;
            if (setNestedFontSize(cap, o.labelFs)) changed = true;
            if (setNestedString(cap, 'textAlign', o.labelAlign)) changed = true;
            if (setNestedString(cap, 'textTransform', o.labelCase)) changed = true;
            if (setNestedBool(cap, 'bold', o.labelBold)) changed = true;
            if (setNestedString(cap, 'color', o.labelCol)) changed = true;
            if (o.labelOffX !== undefined && o.labelOffX !== null && String(o.labelOffX).trim() !== '') {
                const n = Number(o.labelOffX);
                cap.offsetX = Number.isFinite(n) ? n : o.labelOffX;
                changed = true;
            } else if (o.labelOffX === 0) {
                cap.offsetX = 0;
                changed = true;
            }
            if (o.labelOffY !== undefined && o.labelOffY !== null && String(o.labelOffY).trim() !== '') {
                const n = Number(o.labelOffY);
                cap.offsetY = Number.isFinite(n) ? n : o.labelOffY;
                changed = true;
            } else if (o.labelOffY === 0) {
                cap.offsetY = 0;
                changed = true;
            }
            if (Object.keys(cap).length > 0) typ.caption = cap;
            else delete typ.caption;
            captionLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
        }

        if (hasSlotLegacy) {
            const slotDef = () => {
                if (typeof IconWidget !== 'undefined' && IconWidget.defaultIconSlot) {
                    return IconWidget.defaultIconSlot();
                }
                return { source: 'phosphor', builtin: '', weight: 'fill', customUrl: '', tintImage: false };
            };
            let icons = { off: { ...slotDef() }, on: {} };
            if (o.icons && typeof o.icons === 'object') {
                if (o.icons.off && typeof o.icons.off === 'object') {
                    icons.off = { ...slotDef(), ...o.icons.off };
                } else if (o.icons.on && typeof o.icons.on === 'object') {
                    icons.off = { ...slotDef(), ...o.icons.on };
                }
            }
            const tint = o.iconColorize === true;
            const url = String(o.iconUrl || '').trim();
            const builtin = String(o.icon || '').trim();
            const weight = o.iconFilled === false ? 'regular' : 'fill';
            icons.off = {
                source: url ? 'custom' : 'phosphor',
                builtin: url ? '' : builtin,
                weight: weight,
                customUrl: url,
                tintImage: tint
            };
            if (Object.prototype.hasOwnProperty.call(icons.off, 'filled')) {
                delete icons.off.filled;
            }
            o.activeIconMirrorsInactive = true;
            slotLegacy.forEach((k) => {
                if (o[k] !== undefined) {
                    delete o[k];
                    changed = true;
                }
            });
            o.icons = icons;
            changed = true;
            if (typeof this._migratePhosphorIconSlotsFilledToWeightV186 === 'function') {
                if (this._migratePhosphorIconSlotsFilledToWeightV186(o.icons, null)) changed = true;
            }
        } else if (o.icons && typeof o.icons === 'object') {
            if (typeof this._migratePhosphorIconSlotsFilledToWeightV186 === 'function') {
                if (this._migratePhosphorIconSlotsFilledToWeightV186(o.icons, null)) changed = true;
            }
        }

        if (liftFlatKeys('caption', this.ICON_CAPTION_FLAT_INSTANCE_KEYS)) changed = true;

        const liftFlatToIconSlot = (slotName, flatKeys) => {
            const slot = { ...(o.icons && o.icons[slotName] && typeof o.icons[slotName] === 'object' ? o.icons[slotName] : {}) };
            let slotChanged = false;
            flatKeys.forEach((flatKey) => {
                if (o[flatKey] === undefined) return;
                const prop = flatToNestedStandard[flatKey];
                if (!prop) return;
                let wrote = false;
                if (prop === 'bold' || prop === 'italic') wrote = setNestedBool(slot, prop, o[flatKey]);
                else if (prop === 'fontSize') wrote = setNestedFontSize(slot, o[flatKey]);
                else wrote = setNestedString(slot, prop, o[flatKey]);
                if (wrote) {
                    delete o[flatKey];
                    slotChanged = true;
                    changed = true;
                }
            });
            if (slotChanged) {
                if (!o.icons || typeof o.icons !== 'object') o.icons = {};
                o.icons[slotName] = slot;
            }
        };

        if (hasSlotFlat) liftFlatToIconSlot('on', this.ICON_SLOT_FLAT_INSTANCE_KEYS);
        if (hasSlotFlatOff) liftFlatToIconSlot('off', this.ICON_SLOT_FLAT_OFF_INSTANCE_KEYS);

        o.typography = typ;
        if (o.typography && typeof o.typography === 'object' && Object.keys(o.typography).length === 0) {
            delete o.typography;
        }

        return changed;
    },

    _migrateIconWidgetBindingsFlatToNested: function (b) {
        if (!b || typeof b !== 'object' || typeof BindingsTree === 'undefined') return false;
        const spec = typeof IconWidget !== 'undefined' ? IconWidget.getNestedBindingOverlaySpec() : null;
        return this._migrateBindingsFlatToNestedFromSpec(b, spec, this._mergeBindingLegacyAliases('icon'));
    },

    _migrateGaugeBindingsFlatToNested: function (b) {
        if (!b || typeof b !== 'object' || typeof BindingsTree === 'undefined') return false;
        const spec = typeof GaugeWidget !== 'undefined' ? GaugeWidget.getNestedBindingOverlaySpec() : null;
        return this._migrateBindingsFlatToNestedFromSpec(b, spec, this._mergeBindingLegacyAliases('gauge'));
    },

    migrateSnippet: function (snippetData) {
        if (!snippetData || typeof snippetData !== 'object') {
            return { migrated: false, dataMutated: false, data: snippetData };
        }

        const preservedMeta = {
            snippetHeader: snippetData.snippetHeader,
            snippetType: snippetData.snippetType,
            snippetFormatVersion: snippetData.snippetFormatVersion,
            source: snippetData.source,
            master: snippetData.master
        };

        const result = this.migrate(snippetData);
        if (result && result.data && typeof result.data === 'object') {
            if (preservedMeta.snippetHeader !== undefined) result.data.snippetHeader = preservedMeta.snippetHeader;
            if (preservedMeta.snippetType !== undefined) result.data.snippetType = preservedMeta.snippetType;
            if (preservedMeta.snippetFormatVersion !== undefined) result.data.snippetFormatVersion = preservedMeta.snippetFormatVersion;
            if (preservedMeta.source !== undefined) result.data.source = preservedMeta.source;
        }
        return result;
    },

    /** Flatten nested canonical master so legacy semver batches can read flat keys. */
    _ensureFlatMasterForLegacyBatches: function (data) {
        if (!data || typeof data === 'undefined') return;
        const m = data.master;
        if (!m || typeof m !== 'object') return;
        if (typeof MasterLayout === 'undefined' || !MasterLayout.isCanonicalNestedMaster(m)) return;
        data.master = MasterLayout.expandMasterToFlat(m);
    },

    /** Normalize known legacy master aliases to canonical keys (migration path only). */
    _sanitizeMasterLegacyAliases: function (master) {
        if (!master || typeof master !== 'object') return false;
        let changed = false;
        const hasOwn = Object.prototype.hasOwnProperty;
        const isEmpty = function (v) {
            return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
        };
        const looselyEqual = function (a, b) {
            if (a === b) return true;
            const na = Number(a);
            const nb = Number(b);
            if (Number.isFinite(na) && Number.isFinite(nb)) return na === nb;
            return String(a) === String(b);
        };
        const moveLegacy = function (legacyKey, canonicalKey) {
            if (!hasOwn.call(master, legacyKey)) return;
            const legacyVal = master[legacyKey];
            if (isEmpty(master[canonicalKey]) && !isEmpty(legacyVal)) {
                master[canonicalKey] = legacyVal;
                changed = true;
            }
            delete master[legacyKey];
            changed = true;
        };
        const moveLegacyPreferValueOverFactory = function (legacyKey, canonicalKey, factoryDefault) {
            if (!hasOwn.call(master, legacyKey)) return;
            const legacyVal = master[legacyKey];
            const canonicalVal = master[canonicalKey];
            const canonicalUnset = isEmpty(canonicalVal);
            const canonicalIsFactory = !canonicalUnset && looselyEqual(canonicalVal, factoryDefault);
            const legacyHasValue = !isEmpty(legacyVal);
            const legacyDiffersFromFactory = legacyHasValue && !looselyEqual(legacyVal, factoryDefault);
            if ((canonicalUnset && legacyHasValue) || (canonicalIsFactory && legacyDiffersFromFactory)) {
                master[canonicalKey] = legacyVal;
                changed = true;
            }
            delete master[legacyKey];
            changed = true;
        };

        // Text widget: old table background aliases -> canonical row background keys.
        moveLegacy('textMdTableBackgroundColor', 'textMdTableRowBg');
        moveLegacy('textMdTableBackgroundOpacity', 'textMdTableRowBgOpacity');

        // Clock widget: old analog-number aliases -> canonical analog defaults.
        moveLegacyPreferValueOverFactory('defaultClockNumColor', 'defaultClockAnalogNumCol', '@textMuted');
        moveLegacyPreferValueOverFactory('defaultClockNumFont', 'defaultClockAnalogNumFont', "'Inter', sans-serif");
        moveLegacyPreferValueOverFactory('defaultClockNumSize', 'defaultClockAnalogNumFs', 20);
        moveLegacyPreferValueOverFactory('defaultClockNumFontBold', 'defaultClockAnalogNumBold', true);

        moveLegacy('defaultGaugeAutoScale', 'defaultGaugeAbbreviateLargeValues');
        moveLegacy('defaultGaugeFixedDecimalPlaces', 'defaultGaugeKeepTrailingZeros');

        return changed;
    },

    /**
     * Migrate one settings blob via a synthetic dashboard widget.
     */
    _migrateWidgetPresetSettingsBlob: function (settings, widgetType, fromVersion) {
        if (!settings || typeof settings !== 'object') return settings || {};
        let overrides;
        try {
            overrides = JSON.parse(JSON.stringify(settings));
        } catch (e) {
            overrides = settings;
        }
        const synthetic = {
            version: fromVersion,
            master: {},
            widgets: {
                __preset__: {
                    type: widgetType,
                    overrides: overrides,
                    bindings: {}
                }
            }
        };
        let migratedData = synthetic;
        try {
            const result = this.migrate(synthetic);
            if (result && result.data) migratedData = result.data;
        } catch (err) {
            console.warn('[DashboardMigrator] migrateWidgetPreset settings failed:', err);
        }
        const w = migratedData && migratedData.widgets && migratedData.widgets.__preset__;
        let out = (w && w.overrides && typeof w.overrides === 'object') ? w.overrides : overrides;
        if (widgetType === 'switch' && out && typeof this._migrateSwitchOverridesToV2 === 'function') {
            try { this._migrateSwitchOverridesToV2(out); } catch (e2) { /* ignore */ }
        }
        if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.convertOverridesToV2 === 'function') {
            try { out = SaveFormatV2.convertOverridesToV2(out, widgetType); } catch (e3) { /* ignore */ }
        }
        return out;
    },

    /**
     * Migrate a multi-variant widget preset file.
     * Preserves id/name/widgetType/variants; bumps version to the current app version.
     */
    migrateWidgetPreset: function (preset) {
        if (!preset || typeof preset !== 'object') return preset;
        const fromVersion = preset.version || (window.DASHBOARD_VERSION || '2.0.0');
        const widgetType = String(preset.widgetType || 'empty');

        if (typeof WidgetPresetModel === 'undefined' || typeof WidgetPresetModel.normalizePreset !== 'function') {
            return preset;
        }
        const normalized = WidgetPresetModel.normalizePreset(preset);
        if (!normalized) return null;

        normalized.variants.forEach((v) => {
            v.settings = this._migrateWidgetPresetSettingsBlob(v.settings, widgetType, fromVersion);
        });
        normalized.version = window.DASHBOARD_VERSION || fromVersion;
        return normalized;
    },

    /**
     * Convert a theme file (built-in or Homey-saved) to nested 2.0 master.
     * Missing version means pre-2.0. Flat `settings` is wrapped as a synthetic dashboard.
     */
    migrateTheme: function (theme) {
        if (!theme || typeof theme !== 'object') return theme;
        const ver = theme.version || '1.0.0';
        const hasV2Master = theme.master
            && typeof SaveFormatV2 !== 'undefined'
            && typeof SaveFormatV2.isV2Master === 'function'
            && SaveFormatV2.isV2Master(theme.master);
        if (this.compareVersions(ver, '2.0.0') >= 0 && hasV2Master) {
            const keep = {
                version: '2.0.0',
                name: theme.name,
                master: theme.master
            };
            if (theme.previewImage) keep.previewImage = theme.previewImage;
            if (theme.themeKind === 'full' || theme.themeKind === 'adjustment') keep.themeKind = theme.themeKind;
            return keep;
        }
        let syntheticMaster = theme.master;
        if (theme.settings && typeof theme.settings === 'object') {
            syntheticMaster = theme.settings;
        }
        const syntheticVer = this.compareVersions(ver, '2.0.0') >= 0 ? '1.11.0' : ver;
        const synthetic = {
            version: syntheticVer,
            master: syntheticMaster && typeof syntheticMaster === 'object' ? syntheticMaster : {},
            widgets: {}
        };
        let migratedData = synthetic;
        try {
            const result = this.migrate(synthetic);
            if (result && result.data) migratedData = result.data;
        } catch (err) {
            console.warn('[DashboardMigrator] migrateTheme failed:', err);
        }
        const nested = migratedData && migratedData.master && typeof migratedData.master === 'object'
            ? migratedData.master
            : {};
        if (nested.connection) delete nested.connection;
        const out = {
            version: '2.0.0',
            name: theme.name,
            master: nested
        };
        if (theme.previewImage) out.previewImage = theme.previewImage;
        if (theme.themeKind === 'full' || theme.themeKind === 'adjustment') out.themeKind = theme.themeKind;
        return out;
    },

    migrate: function (data) {
        if (!data) return { migrated: false, dataMutated: false, data: data };

        const originalVersion = data.version || "1.0.0";
        const targetVersion = window.DASHBOARD_VERSION || "2.0.0";
        const latestMigrationVersion = this.getLatestMigrationVersion();
        let needsVersionBatches = this.compareVersions(originalVersion, latestMigrationVersion) < 0;
        const appliedChangeLabels = [];
        const appliedLabelSet = {};
        const addChangeLabel = function (label) {
            if (!label) return;
            if (appliedLabelSet[label]) return;
            appliedLabelSet[label] = true;
            appliedChangeLabels.push(label);
        };
        
        // Force migration if they still have the old shared track outline keys
        const hasLegacyTrackOutlineKeys = !!(data.master
            && (data.master.defaultTrackOutlineColor !== undefined
                || data.master.defaultTrackOutlineWidth !== undefined));
        if (hasLegacyTrackOutlineKeys) {
            needsVersionBatches = true;
        }

        const hasLegacyGraphAxisTypography = this._dashboardHasLegacyGraphAxisTypography(data);
        if (hasLegacyGraphAxisTypography) {
            needsVersionBatches = true;
        }

        // Graph multi-series heal: dashboards stamped 2.3.0 by an intermediate build
        // can still hold flat graph keys; the batch is idempotent so re-running is safe.
        const hasLegacyGraphSeriesShape = this._dashboardHasLegacyGraphSeriesShape(data);
        if (hasLegacyGraphSeriesShape) {
            needsVersionBatches = true;
        }

        // V2 Responsive Columns refactor: flat responsive widget keys / removed engines
        // must migrate even on current-version dashboards (the feature predates the
        // nested `overrides.layout.responsive` save shape).
        const hasLegacyResponsiveLayout = this._dashboardHasLegacyResponsiveLayoutKeys(data);
        if (hasLegacyResponsiveLayout) {
            needsVersionBatches = true;
        }

        // Same or newer than latest migration rules: do not run semver migrations or master normalization
        // (avoids false "upgraded" prompts and any mutation on current-version dashboards).
        if (!needsVersionBatches) {
            return {
                migrated: false,
                dataMutated: false,
                originalVersion: originalVersion,
                newVersion: targetVersion,
                appliedChangeLabels: [],
                data: data
            };
        }

        let migratedData = JSON.parse(JSON.stringify(data));
        const baselineSnapshot = this._stableJsonStringify(migratedData);
        let hasChanges = false;
        let semanticMigrationApplied = false;
        const dashboardPredates190 = this.compareVersions(originalVersion, "1.9.0") < 0;

        // Housekeeping aliases (silent — same policy as normalization / patch noise).
        if (dashboardPredates190 && this._sanitizeMasterLegacyAliases(migratedData.master)) {
            hasChanges = true;
        }

        if (dashboardPredates190) {
            this._ensureFlatMasterForLegacyBatches(migratedData);
        }

        // ====================================================================
        // MIGRATION BATCH: 1.0.0 -> 1.1.2
        // Purpose: Standardizing Label implementations and UI property keys
        // ====================================================================
        if (this.compareVersions(originalVersion, "1.1.2") < 0) {
            const beforeRule = this._stableJsonStringify(migratedData);
            if (migratedData.widgets) {
                Object.keys(migratedData.widgets).forEach(id => {
                    let w = migratedData.widgets[id];
                    if (!w || !w.overrides) return;

                    let o = w.overrides;

                    // 1. Container widget (type: empty)
                    if (w.type === 'empty') {
                        if (o.title !== undefined) { o.label = o.title; delete o.title; }
                        if (o.colTitle !== undefined) { o.labelCol = o.colTitle; delete o.colTitle; }
                        if (o.fs !== undefined) { o.labelFs = o.fs; delete o.fs; }

                        // If the user previously hid the title using the checkbox,
                        // explicitly clear the label text so the new engine hides it.
                        if (o.showTitle === false) {
                            o.label = "";
                        }
                        if (o.showTitle !== undefined) {
                            delete o.showTitle;
                        }
                    }

                    // 2. Label Widget (Core text, not a standardized label)
                    else if (w.type === 'label') {
                        if (o.fs !== undefined) { o.fontSize = o.fs; delete o.fs; }
                        if (o.color !== undefined) { o.textColor = o.color; delete o.color; }
                        if (o.align !== undefined) { o.textAlign = o.align; delete o.align; }
                    }

                    // 3. Gauge Widget
                    else if (w.type === 'gauge') {
                        if (o.name !== undefined) { o.label = o.name; delete o.name; }
                        if (o.lblOffX !== undefined) { o.labelOffX = o.lblOffX; delete o.lblOffX; }
                        if (o.lblOffY !== undefined) { o.labelOffY = o.lblOffY; delete o.lblOffY; }
                    }

                    // 4. Switch Widget
                    else if (w.type === 'switch') {
                        if (o.labelPos === 'center') { o.labelPos = 'inside_bottom'; }
                        if (o.switchFsLabel !== undefined) { o.labelFs = o.switchFsLabel; delete o.switchFsLabel; }
                        if (o.switchColLabel !== undefined) { o.labelCol = o.switchColLabel; delete o.switchColLabel; }
                    }

                    // --- Global Standardized Label Catch-All ---
                    // Applies to all widgets EXCEPT the 'label' widget
                    if (w.type !== 'label') {
                        // Alignments
                        if (o.align !== undefined && o.labelAlign === undefined) { o.labelAlign = o.align; delete o.align; }

                        // Sizes
                        if (o.fsLabel !== undefined && o.labelFs === undefined) { o.labelFs = o.fsLabel; delete o.fsLabel; }

                        // Colors
                        if (o.colLabel !== undefined && o.labelCol === undefined) { o.labelCol = o.colLabel; delete o.colLabel; }
                    }
                });
            }
            if (this._stableJsonStringify(migratedData) !== beforeRule) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Standardized older widget labels');
            }
        }

        // ====================================================================
        // MIGRATION BATCH: < 1.5.0
        // Switch/Button: caption -> buttonLabel; nested typography.buttonLabelOutside
        // and buttonLabelInside (same content when upgrading); label is group chrome only.
        // ====================================================================
        if (this.compareVersions(originalVersion, "1.5.0") < 0) {
            const beforeRule = this._stableJsonStringify(migratedData);
            if (migratedData.master && typeof migratedData.master === 'object') {
                const m = migratedData.master;
                if (m.switchFsLabel !== undefined) {
                    const v = m.switchFsLabel;
                    if (m.switchButtonOutsideDefaultFs === undefined || m.switchButtonOutsideDefaultFs === null || m.switchButtonOutsideDefaultFs === '') {
                        m.switchButtonOutsideDefaultFs = v;
                    }
                    if (m.switchButtonInsideDefaultFs === undefined || m.switchButtonInsideDefaultFs === null || m.switchButtonInsideDefaultFs === '') {
                        m.switchButtonInsideDefaultFs = v;
                    }
                    delete m.switchFsLabel;
                }
                const masterBtnSuf = ['Font', 'Fs', 'Align', 'Case', 'Bold', 'Italic', 'Col', 'ColOff', 'Opacity', 'OffX', 'OffY'];
                masterBtnSuf.forEach((suf) => {
                    const oldK = `switchButtonDefault${suf}`;
                    if (m[oldK] === undefined) return;
                    const outK = `switchButtonOutsideDefault${suf}`;
                    const inK = `switchButtonInsideDefault${suf}`;
                    if (m[outK] === undefined) m[outK] = m[oldK];
                    if (m[inK] === undefined) m[inK] = m[oldK];
                    delete m[oldK];
                });
            }

            if (migratedData.widgets) {
                Object.keys(migratedData.widgets).forEach((id) => {
                    const w = migratedData.widgets[id];
                    if (!w || w.type !== 'switch' || !w.overrides) return;
                    const o = w.overrides;
                    const typoDone = o._switchTypographyV2 === true;
                    const iconsDone = o._switchIconsV2 === true;
                    if (typoDone && iconsDone) return;
                    this._migrateSwitchOverridesToV2(o);
                });
            }
            if (this._stableJsonStringify(migratedData) !== beforeRule) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Upgraded switch buttons and icons');
            }
        }

        // ====================================================================
        // GROUPS SHAPE MIGRATION (legacy only)
        // Converts saves that used `group.memberIds` + root `widgets` into nested `group.widgets`.
        // Do not rebuild modern groups here: output would drop `visible`, `bindings`, `overridePage`, etc.,
        // which falsely triggers semantic migration for every dashboard with groups on a version-only bump.
        // ====================================================================
        if (migratedData.groups && typeof migratedData.groups === 'object' && this._groupsNeedLegacyLinkedMigration(migratedData)) {
            const normalizedGroups = {};
            const groupedWidgetIds = new Set();
            const rootWidgets = (migratedData.widgets && typeof migratedData.widgets === 'object')
                ? Object.assign({}, migratedData.widgets)
                : {};

            Object.keys(migratedData.groups).forEach(groupId => {
                const group = migratedData.groups[groupId];
                if (!group || typeof group !== 'object') return;

                const nestedWidgets = {};
                if (group.widgets && typeof group.widgets === 'object') {
                    Object.keys(group.widgets).forEach(widgetId => {
                        const widgetPayload = group.widgets[widgetId];
                        if (!widgetPayload || typeof widgetPayload !== 'object') return;
                        if (groupedWidgetIds.has(widgetId)) return;
                        nestedWidgets[widgetId] = widgetPayload;
                        groupedWidgetIds.add(widgetId);
                    });
                } else if (Array.isArray(group.memberIds)) {
                    group.memberIds.forEach(widgetId => {
                        if (typeof widgetId !== 'string' || !widgetId) return;
                        if (groupedWidgetIds.has(widgetId)) return;
                        const widgetPayload = rootWidgets[widgetId];
                        if (!widgetPayload || typeof widgetPayload !== 'object') return;
                        nestedWidgets[widgetId] = widgetPayload;
                        delete rootWidgets[widgetId];
                        groupedWidgetIds.add(widgetId);
                    });
                }

                if (Object.keys(nestedWidgets).length < 2) return;

                normalizedGroups[groupId] = {
                    id: groupId,
                    name: String(group.name || groupId),
                    locked: group.locked === true,
                    widgets: nestedWidgets
                };
            });

            const groupsShapeChanged = this._stableJsonStringify(normalizedGroups) !== this._stableJsonStringify(migratedData.groups)
                || this._stableJsonStringify(rootWidgets) !== this._stableJsonStringify(migratedData.widgets);

            if (groupsShapeChanged) {
                migratedData.widgets = rootWidgets;
                migratedData.groups = normalizedGroups;
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Rebuilt old widget groups');
            }
        }

        // ====================================================================
        // MIGRATION BATCH: < 1.5.1
        // Group-only switches missed <1.5.0 root pass; caption / text case heals;
        // fix factory "Switch" on buttonLabel while real text remains in label; stale group "Switch";
        // bindings.label -> buttonLabel (pre-1.5 caption binding); strip duplicate icon URL from buttonLabel.
        // ====================================================================
        if (this.compareVersions(originalVersion, "1.5.1") < 0) {
            const master = migratedData.master && typeof migratedData.master === 'object' ? migratedData.master : {};
            let batchChanged = false;
            this._forEachSwitchWidget(migratedData, (w) => {
                if (!w.overrides) return;
                const o = w.overrides;
                if (this._switchNeedsFullV2Migrate(o)) {
                    this._migrateSwitchOverridesToV2(o);
                    batchChanged = true;
                }
                if (this._healSwitchTextOnlyCheckboxToStyle(o)) batchChanged = true;
                if (this._healSwitchCaption(o)) batchChanged = true;
                if (this._healSwitchCaptionWhenButtonHoldsFactoryDefault(o)) batchChanged = true;
                if (this._healSwitchStaleDefaultGroupLabel(o)) batchChanged = true;
                if (this._healSwitchDuplicateIconUrlInButtonLabel(o)) batchChanged = true;
                if (this._healSwitchBindingsLabelToButtonLabel(w)) batchChanged = true;
                if (this._healSwitchButtonTextTransform(o, master)) batchChanged = true;
            });
            if (batchChanged) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Fixed switch captions and bindings');
            }
        }

        // ====================================================================
        // MIGRATION BATCH: < 1.5.2
        // Master switchColLabel / defaultColLabel -> switchButton outside/inside label colors (on+off)
        // when those defaults were never set or still match factory gray while legacy label color differs.
        // ====================================================================
        if (this.compareVersions(originalVersion, "1.5.2") < 0) {
            if (migratedData.master && typeof migratedData.master === 'object') {
                if (this._migrateMasterSwitchButtonLabelColorsFromLegacy(migratedData.master)) {
                    hasChanges = true;
                    semanticMigrationApplied = true;
                    addChangeLabel('Aligned switch text default colors');
                }
            }
        }

        // ====================================================================
        // MIGRATION BATCH: < 1.6.0
        // Nested widget bindings for switch (icons/typography/iconColorOverrides) and menu (menuItems[]).
        // ====================================================================
        if (this.compareVersions(originalVersion, "1.6.0") < 0) {
            let batchBindings = false;
            this._forEachWidget(migratedData, (w) => {
                if (this._migrateWidgetBindingsNestedV160(w)) batchBindings = true;
            });
            if (batchBindings) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Updated nested topic bindings');
            }
        }

        // ====================================================================
        // MIGRATION BATCH: < 1.7.0
        // Clock: flat label* / num* → nested typography.groupLabel / analogNumbers (new clock widget).
        // ====================================================================
        if (this.compareVersions(originalVersion, "1.7.0") < 0) {
            let clockCanon = false;
            this._forEachWidget(migratedData, (w) => {
                if (w.type !== 'clock' || !w.overrides) return;
                if (this._migrateClockOverridesToCanonical(w.overrides)) clockCanon = true;
            });
            if (clockCanon) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Updated clock typography defaults');
            }

            // Gauge: split master defaultGap → style-specific gap defaults
            if (migratedData.master && typeof migratedData.master === 'object') {
                const m = migratedData.master;
                if (m.defaultGap !== undefined) {
                    if (m.defaultGaugeHorizontalGap === undefined) m.defaultGaugeHorizontalGap = m.defaultGap;
                    if (m.defaultGaugeRoundGap === undefined) m.defaultGaugeRoundGap = -25;
                    delete m.defaultGap;
                    hasChanges = true;
                    semanticMigrationApplied = true;
                    addChangeLabel('Split gauge spacing defaults');
                }
            }

            // Gauge: per-widget gap override → gapRound or gapHoriz based on configured style
            const masterForGauge = migratedData.master && typeof migratedData.master === 'object' ? migratedData.master : {};
            let gaugeGapMigrated = false;
            this._forEachWidget(migratedData, (w) => {
                if (w.type !== 'gauge' || !w.overrides || w.overrides.gap === undefined) return;
                const o = w.overrides;
                const style = o.barType || masterForGauge.defaultGaugeType || 'round';
                const isHoriz = style === 'horizontal' || style === 'none';
                if (isHoriz) {
                    if (o.gapHoriz === undefined) o.gapHoriz = o.gap;
                } else {
                    if (o.gapRound === undefined) o.gapRound = o.gap;
                }
                delete o.gap;
                gaugeGapMigrated = true;
            });
            if (gaugeGapMigrated) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Moved gauge spacing to new keys');
            }
        }

        // ====================================================================
        // MIGRATION BATCH: < 1.8.0
        // Legacy label split:
        // - plain+bgHidden => new lightweight Label
        // - markdown-like or non-hidden background => Text (existing migration)
        // ====================================================================
        if (this.compareVersions(originalVersion, "1.8.0") < 0) {
            const master = (migratedData.master && typeof migratedData.master === 'object') ? migratedData.master : {};
            let labelMigrationChanged = false;
            if (this._migrateLabelMasterDefaultsV180(master)) {
                labelMigrationChanged = true;
            }
            this._forEachWidget(migratedData, (w) => {
                if (!w || w.type !== 'label') return;
                if (this._migrateLegacyLabelToNewLabel(w)) {
                    labelMigrationChanged = true;
                    return;
                }
                if (this._migrateLabelWidgetToText(w, master)) {
                    labelMigrationChanged = true;
                }
            });
            if (labelMigrationChanged) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Converted legacy label widgets');
            }
        }

        // ====================================================================
        // MIGRATION BATCH: < 1.8.3
        // Numeric normalization pass for shipped widgets + base layout geometry.
        // ====================================================================
        if (this.compareVersions(originalVersion, "1.8.3") < 0) {
            if (this._migrateWidgetNumericsV183(migratedData)) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Normalized widget numeric settings');
            }
        }

        // ====================================================================
        // MIGRATION BATCH: < 1.8.5
        // Text: table header/body typography `left` → `table_defined` (explicit GFM alignment).
        // ====================================================================
        if (this.compareVersions(originalVersion, "1.8.5") < 0) {
            if (this._migrateTextWidgetTableTypographyAlignV185(migratedData)) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Text widget table typography alignment semantic');
            }
        }

        // ====================================================================
        // MIGRATION BATCH: < 1.8.6
        // Switch + menu row icon slots: `filled` (boolean) → `weight` (string); binding key rename;
        // bump `_switchIconsV2` → `_switchIconsV3` for re-flatten.
        // ====================================================================
        if (this.compareVersions(originalVersion, "1.8.6") < 0) {
            if (this._migrateDashboardIconWeightV186(migratedData)) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Phosphor icon style: filled → weight + accent');
            }
        }

        // ====================================================================
        // MIGRATION BATCH: < 1.9.0
        // Gauge: nested typography (caption/value/unit/axis) + icons.on
        // Slider: nested typography (caption/value)
        // Icon: nested typography (caption) + icons.on
        // ====================================================================
        if (this.compareVersions(originalVersion, "1.9.0") < 0) {
            let gaugeChanged = false;
            let sliderChanged = false;
            let iconChanged = false;
            let lightGridChanged = false;
            let switchButtonNoIconChanged = false;
            if (migratedData.master && typeof migratedData.master === 'object') {
                if (this._migrateIconWidgetMasterDefaults(migratedData.master)) iconChanged = true;
            }
            this._forEachWidget(migratedData, (w) => {
                if (w.type === 'gauge') {
                    if (w.overrides && this._migrateGaugeOverridesToCanonical(w.overrides)) gaugeChanged = true;
                    if (w.bindings && this._migrateGaugeBindingsFlatToNested(w.bindings)) gaugeChanged = true;
                }
                if (w.type === 'slider') {
                    if (w.overrides && this._migrateSliderOverridesToCanonical(w.overrides)) sliderChanged = true;
                    if (w.bindings && this._migrateSliderBindingsFlatToNested(w.bindings)) sliderChanged = true;
                }
                if (w.type === 'icon') {
                    if (w.overrides && this._migrateIconWidgetOverridesToCanonical(w.overrides)) iconChanged = true;
                    if (w.overrides && this._migrateIconWidgetDualSlotsAndColors(w.overrides, migratedData.master)) iconChanged = true;
                    if (w.bindings && this._migrateIconWidgetBindingsFlatToNested(w.bindings)) iconChanged = true;
                }
                if (w.type === 'lightgrid') {
                    if (w.overrides && this._migrateLightGridOverridesToCanonical(w.overrides, migratedData.master)) lightGridChanged = true;
                    if (w.bindings && this._migrateLightGridBindingsFlatToNested(w.bindings)) lightGridChanged = true;
                }
                if (w.type === 'switch' && w.overrides
                        && this._migrateSwitchButtonPreserveNoIconFromV190(w.overrides)) {
                    switchButtonNoIconChanged = true;
                }
            });
            if (gaugeChanged) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Gauge: nested typography and icons');
            }
            if (sliderChanged) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Slider: nested typography');
            }
            if (iconChanged) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Icon: nested typography and icons');
            }
            if (lightGridChanged) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Light grid: nested typography and per-light icons');
            }
            if (switchButtonNoIconChanged) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Button: no factory icon on legacy icon-less widgets');
            }
            if (this._migrateGraphXAxisDateFormatV190(migratedData)) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Graph: X-axis Date Hours migration');
            }

            let typoNestedBatch = false;
            this._forEachWidget(migratedData, (w) => {
                if (!w || !w.overrides) return;
                if (w.type === 'empty' && this._migrateContainerOverridesToCanonical(w.overrides)) typoNestedBatch = true;
                if (w.type === 'battery' && this._migrateWidgetLabelTypographyOverridesToCanonical(w.overrides)) typoNestedBatch = true;
                if (w.type === 'graph' && this._migrateGraphAxisTypographySplitV110Overrides(w.overrides)) typoNestedBatch = true;
                if (w.type === 'graph' && this._migrateGraphOverridesToCanonical(w.overrides)) typoNestedBatch = true;
                if (w.type === 'list' && this._migrateListOverridesToCanonical(w.overrides)) typoNestedBatch = true;
                if (w.type === 'editbox' && this._migrateEditboxOverridesToCanonical(w.overrides)) typoNestedBatch = true;
                if (w.type === 'clock' && this._migrateClockOverridesToCanonical(w.overrides)) typoNestedBatch = true;
                if (w.type === 'label' && this._migrateLabelWidgetTypographyOverridesToCanonical(w.overrides)) typoNestedBatch = true;
                if (this._migrateWidgetTypographyBindingsAndAux(w)) typoNestedBatch = true;
            });
            if (typoNestedBatch) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Typography: nested overrides, bindings, and color correction');
            }
        }

        // ====================================================================
        // MIGRATION BATCH: < 1.9.3
        // Text widget: global Vertical Spacing → per-role typography blockSpacing
        // ====================================================================
        if (this.compareVersions(originalVersion, '1.9.3') < 0) {
            let textBlockSpaceChanged = false;
            if (migratedData.master && typeof migratedData.master === 'object'
                    && this._migrateTextMdBlockSpacingMaster(migratedData.master)) {
                textBlockSpaceChanged = true;
            }
            this._forEachWidget(migratedData, (w) => {
                if (!w || w.type !== 'text' || !w.overrides) return;
                if (this._migrateTextWidgetOverridesBlockSpacing(w.overrides)) {
                    textBlockSpaceChanged = true;
                }
            });
            if (textBlockSpaceChanged) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Text: per-role vertical spacing');
            }
        }

        // ====================================================================
        // MIGRATION BATCH: < 1.9.4
        // Forward-heal orphaned flat typography bindings / overrides / aux keys on 1.9.0–1.9.3 saves.
        // ====================================================================
        if (this.compareVersions(originalVersion, '1.9.4') < 0) {
            let typoHeal194 = false;
            this._forEachWidget(migratedData, (w) => {
                if (this._healWidgetTypographyForward(w, migratedData.master)) typoHeal194 = true;
            });
            if (typoHeal194) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Typography and icon colors: heal nested bindings and color correction keys');
            }
        }

        // ====================================================================
        // IDEMPOTENT HEALS: < 1.9.0 only
        // Heals incomplete saves from the 1.9.0 development cycle. Dashboards
        // saved at 1.9.0+ must never re-run these (runtime + data-config cover defaults).
        // ====================================================================
        if (dashboardPredates190) {

        // Icon: legacy flat keys on instances (master defaults handled in batch above).
        let iconHeal = false;
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'icon') return;
            if (w.overrides && this._migrateIconWidgetOverridesToCanonical(w.overrides)) iconHeal = true;
            if (w.overrides && this._migrateIconWidgetDualSlotsAndColors(w.overrides, migratedData.master)) iconHeal = true;
            if (w.bindings && this._migrateIconWidgetBindingsFlatToNested(w.bindings)) iconHeal = true;
        });
        if (iconHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Icon: nested typography and icons heal');
        }

        // Slider: flat caption/value typography → nested (idempotent; heals 1.9.0 saves with legacy keys)
        let sliderTypoHeal = false;
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'slider') return;
            if (w.overrides && this._migrateSliderOverridesToCanonical(w.overrides)) sliderTypoHeal = true;
            if (w.bindings && this._migrateSliderBindingsFlatToNested(w.bindings)) sliderTypoHeal = true;
        });
        if (sliderTypoHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Slider: nested typography heal');
        }

        let lightGridHeal = false;
        if (migratedData.master && typeof migratedData.master === 'object') {
            const m = migratedData.master;
            if (Object.prototype.hasOwnProperty.call(m, 'lgRowGap') && !Object.prototype.hasOwnProperty.call(m, 'lgItemSpacing')) {
                m.lgItemSpacing = m.lgRowGap;
                delete m.lgRowGap;
                lightGridHeal = true;
            }
        }
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'lightgrid') return;
            if (w.overrides && this._migrateLightGridOverridesToCanonical(w.overrides, migratedData.master)) lightGridHeal = true;
            if (w.bindings && this._migrateLightGridBindingsFlatToNested(w.bindings)) lightGridHeal = true;
        });
        if (lightGridHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Light grid: nested typography and icons heal');
        }

        let listHeal = false;
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'list') return;
            if (w.overrides && this._migrateListOverridesToCanonical(w.overrides)) listHeal = true;
            if (w.overrides && this._healListWidgetIconOverrides(w.overrides)) listHeal = true;
            if (this._migrateWidgetTypographyBindingsAndAux(w)) listHeal = true;
        });
        if (listHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('List: nested typography and icons heal');
        }

        let editboxHeal = false;
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'editbox') return;
            if (w.overrides && this._migrateEditboxOverridesToCanonical(w.overrides)) editboxHeal = true;
        });
        if (editboxHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Edit box: nested typography heal');
        }

        let containerHeal = false;
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'empty') return;
            if (w.overrides && this._migrateContainerOverridesToCanonical(w.overrides)) containerHeal = true;
        });
        if (containerHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Container: nested typography heal');
        }

        let batteryHeal = false;
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'battery') return;
            if (w.overrides && this._migrateWidgetLabelTypographyOverridesToCanonical(w.overrides)) batteryHeal = true;
        });
        if (batteryHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Battery: nested typography heal');
        }

        let graphHeal = false;
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'graph') return;
            if (w.overrides && this._migrateGraphAxisTypographySplitV110Overrides(w.overrides)) graphHeal = true;
            if (w.overrides && this._migrateGraphOverridesToCanonical(w.overrides)) graphHeal = true;
        });
        if (graphHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Graph: nested typography heal');
        }

        // Switch / Button: legacy flat icon geometry → nested `icons.on` (size / offsets).
        let switchIconGeometryHeal = false;
        this._forEachSwitchWidget(migratedData, (w) => {
            if (!w.overrides) return;
            if (this._migrateSwitchLegacyFlatIconGeometryToNested(w.overrides)) switchIconGeometryHeal = true;
        });
        if (switchIconGeometryHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Switch / Button: icon size and offsets nested under Icon (On)');
        }

        // Switch / Button: icons.off inherits identity from icons.on (sparse storage); idempotent on load/re-save.
        let switchOffIconHeal = false;
        this._forEachWidget(migratedData, function (w) {
            if (w.type !== 'switch' || !w.overrides) return;
            const o = w.overrides;
            const prevSnap = (o.icons && o.icons.off && typeof o.icons.off === 'object')
                ? JSON.stringify(o.icons.off)
                : '{}';
            if (typeof SwitchWidget !== 'undefined' && SwitchWidget.ensureSwitchIcons) {
                SwitchWidget.ensureSwitchIcons(o);
            }
            const nextSnap = (o.icons && o.icons.off && typeof o.icons.off === 'object')
                ? JSON.stringify(o.icons.off)
                : '{}';
            if (prevSnap !== nextSnap) switchOffIconHeal = true;
        });
        if (switchOffIconHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Switch / Button: off icon inherits from on (sparse)');
        }

        // Button / Image-only: legacy icon-less widgets must not pick up 1.9.0 factory Icon (On) on disk or at runtime.
        let switchButtonNoIconHeal = false;
        this._forEachSwitchWidget(migratedData, (w) => {
            if (!w.overrides) return;
            if (this._migrateSwitchButtonPreserveNoIconFromV190(w.overrides)) switchButtonNoIconHeal = true;
        });
        if (switchButtonNoIconHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Button: no factory icon on legacy icon-less widgets heal');
        }

        // Gauge: legacy iconY → iconOffY (idempotent; also heals 1.9.0 saves that still carried iconY)
        let gaugeIconYHeal = false;
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'gauge' || !w.overrides || w.overrides.iconY === undefined) return;
            const o = w.overrides;
            if (o.iconOffY === undefined || o.iconOffY === null || o.iconOffY === '') {
                o.iconOffY = o.iconY;
            }
            delete o.iconY;
            gaugeIconYHeal = true;
        });
        if (gaugeIconYHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Gauge: icon vertical offset key');
        }

        // Gauge: empty legacy icon class / nested builtin → showIcon false
        let gaugeShowIconHeal = false;
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'gauge' || !w.overrides) return;
            const o = w.overrides;
            if (o.showIcon === false) return;
            if (this._gaugeLegacyIconExplicitlyEmpty(o)) {
                o.showIcon = false;
                gaugeShowIconHeal = true;
            }
        });
        if (gaugeShowIconHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Gauge: show icon from empty legacy icon');
        }

        // Gauge: style-specific text position + caption alignment (round vs horizontal)
        let gaugeStyleLayoutHeal = false;
        const masterForGauge = migratedData.master && typeof migratedData.master === 'object' ? migratedData.master : {};
        if (this._migrateGaugeMasterStyleSpecificDefaults(masterForGauge)) {
            gaugeStyleLayoutHeal = true;
        }
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'gauge' || !w.overrides) return;
            if (this._migrateGaugeStyleSpecificLayoutAndCaption(w.overrides, masterForGauge)) {
                gaugeStyleLayoutHeal = true;
            }
        });
        if (gaugeStyleLayoutHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Gauge: style-specific text position and caption alignment');
        }

        let gaugeGapHeal = false;
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'gauge' || !w.overrides) return;
            if (this._migrateGaugeStyleSpecificGap(w.overrides, masterForGauge)) {
                gaugeGapHeal = true;
            }
        });
        if (gaugeGapHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Gauge: gap key for style (none/horizontal)');
        }

        // Gauge: clearer display-format key names (+ nested master.widgetDefaults merges); idempotent heal
        let gaugeNumberFormatHeal = false;
        if (migratedData.master && typeof migratedData.master === 'object') {
            if (this._migrateGaugeMasterNumberFormatKeys(migratedData.master)) gaugeNumberFormatHeal = true;
        }
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'gauge' || !w.overrides) return;
            if (this._migrateGaugeOverridesNumberFormatKeys(w.overrides)) gaugeNumberFormatHeal = true;
        });
        if (gaugeNumberFormatHeal) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Gauge: display-format property names');
        }

        // Gauge: drop redundant icons.on / flat icon keys that only repeat master (reset / Def)
        let gaugeIconPrune = false;
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'gauge' || !w.overrides) return;
            if (typeof GaugeWidget !== 'undefined'
                    && GaugeWidget.pruneIconOverridesMatchingMaster(w.overrides, masterForGauge)) {
                gaugeIconPrune = true;
            }
        });
        if (gaugeIconPrune) {
            hasChanges = true;
        }

        // Gauge master: global Icon widget defaultIconSize → gauge defaultGaugeIconSize (default 80)
        if (migratedData.master && typeof migratedData.master === 'object') {
            const m = migratedData.master;
            if (m.defaultGaugeIconSize === undefined || m.defaultGaugeIconSize === null || m.defaultGaugeIconSize === '') {
                if (m.defaultIconSize !== undefined && m.defaultIconSize !== null && m.defaultIconSize !== '') {
                    m.defaultGaugeIconSize = m.defaultIconSize;
                } else {
                    m.defaultGaugeIconSize = 80;
                }
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Gauge: default icon size from global');
            }
        }

        // Gauge master: icon style defaults (heal mistaken instance flat keys on master + fill missing defaults)
        if (migratedData.master && typeof migratedData.master === 'object') {
            const m = migratedData.master;
            let gaugeMasterIconChanged = false;
            const copyMasterIconIfUnset = (fromKey, toKey) => {
                if (m[toKey] !== undefined && m[toKey] !== null && m[toKey] !== '') return;
                if (m[fromKey] === undefined || m[fromKey] === null || m[fromKey] === '') return;
                m[toKey] = m[fromKey];
                gaugeMasterIconChanged = true;
            };
            copyMasterIconIfUnset('iconSourceOn', 'defaultGaugeIconSource');
            copyMasterIconIfUnset('iconOn', 'defaultGaugeIconOn');
            copyMasterIconIfUnset('iconWeightOn', 'defaultGaugeIconWeight');
            copyMasterIconIfUnset('imgOn', 'defaultGaugeIconCustomUrl');
            if (m.defaultGaugeIconTintImage === undefined || m.defaultGaugeIconTintImage === null) {
                if (m.colorizeOn !== undefined) {
                    m.defaultGaugeIconTintImage = m.colorizeOn === true;
                    gaugeMasterIconChanged = true;
                }
            }
            const gaugeIconMasterDefaults = {
                defaultGaugeIconSource: 'phosphor',
                defaultGaugeIconOn: 'ph-thermometer-simple',
                defaultGaugeIconWeight: 'fill',
                defaultGaugeIconCustomUrl: '',
                defaultGaugeIconTintImage: false
            };
            Object.keys(gaugeIconMasterDefaults).forEach((k) => {
                if (m[k] !== undefined && m[k] !== null && (k === 'defaultGaugeIconTintImage' || m[k] !== '')) return;
                m[k] = gaugeIconMasterDefaults[k];
                gaugeMasterIconChanged = true;
            });
            if (gaugeMasterIconChanged) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Gauge: master default icon style');
            }
        }

        } // end IDEMPOTENT HEALS: < 1.9.0 only

        // Graph: split axis typography (X base / Y inherit); idempotent for 1.10.0 dev saves
        let graphAxisTypoSplit = false;
        if (migratedData.master && this._migrateGraphAxisTypographySplitV110Master(migratedData.master)) {
            graphAxisTypoSplit = true;
        }
        this._forEachWidget(migratedData, (w) => {
            if (w.type !== 'graph' || !w.overrides) return;
            if (this._migrateGraphAxisTypographySplitV110Overrides(w.overrides)) graphAxisTypoSplit = true;
        });
        if (graphAxisTypoSplit) {
            hasChanges = true;
            semanticMigrationApplied = true;
            addChangeLabel('Graph: split axis typography (X base / Y inherit)');
        }

        // Canonical nested `master` for JSON + load pipeline: `dashboard.loadDashboardData`
        // calls `expandMasterToFlat`, which only reads subdivisions (`connection`, `theme.colors`, …).
        // Leaving a post-legacy flat merged object without re-nesting drops almost all globals on load.
        // Silent for UI — no bullet in Dashboard Upgraded (see dashboard.loadDashboardData).
        // Graph bag first: the round trip below drops pre-2.2 graph color keys.
        const graphBagPreNormalize = this._graphMasterBagForMigration(migratedData);
        if (typeof MasterLayout !== 'undefined' && typeof MasterLayout.normalizeMasterToNested === 'function') {
            MasterLayout.normalizeMasterToNested(migratedData);
        }

        // ====================================================================
        // MIGRATION BATCH: < 2.0.0
        // Responsive Columns refactor & V2 nested save format
        // ====================================================================
        if (this.compareVersions(originalVersion, '2.0.0') < 0 || hasLegacyResponsiveLayout) {
            if (this._migrateResponsiveLayoutV2(migratedData)) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Responsive Columns: nested widget layout settings (isolate from fixed/scale)');
            }
        }

        // Split gauge/slider track outline keys (if old shared ones still exist)
        if (migratedData.master && typeof migratedData.master === 'object') {
            const m = migratedData.master;
            let splitChanged = false;
            
            // Note: we don't migrate defaultTrackOutlineWidth to 0, only map if its not undefined
            if (m.defaultTrackOutlineWidth !== undefined) {
                if (m.defaultGaugeTrackOutlineWidth === undefined) m.defaultGaugeTrackOutlineWidth = m.defaultTrackOutlineWidth;
                if (m.defaultSliderTrackOutlineWidth === undefined) m.defaultSliderTrackOutlineWidth = m.defaultTrackOutlineWidth;
                delete m.defaultTrackOutlineWidth;
                splitChanged = true;
            }
            if (m.defaultTrackOutlineColor !== undefined) {
                if (m.defaultGaugeTrackOutlineColor === undefined) m.defaultGaugeTrackOutlineColor = m.defaultTrackOutlineColor;
                if (m.defaultSliderTrackOutlineColor === undefined) m.defaultSliderTrackOutlineColor = m.defaultTrackOutlineColor;
                delete m.defaultTrackOutlineColor;
                splitChanged = true;
            }
            if (splitChanged) {
                hasChanges = true;
            }
        }

        // 2.0 nested label-based save format: master buckets, widget overrides, bindings, junk strip.
        if (this.compareVersions(originalVersion, '2.0.0') < 0) {
            if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.convertDashboardToV2 === 'function') {
                const beforeV2 = this._stableJsonStringify(migratedData);
                const converted = SaveFormatV2.convertDashboardToV2(migratedData);
                if (converted && typeof converted === 'object') {
                    migratedData = converted;
                }
                if (this._stableJsonStringify(migratedData) !== beforeV2) {
                    hasChanges = true;
                    semanticMigrationApplied = true;
                    addChangeLabel('Save format: nested label-based keys (2.0)');
                }
            }
        }

        if (this.compareVersions(originalVersion, '2.3.0') < 0 || hasLegacyGraphSeriesShape) {
            let graphChanged = false;
            const usedGraphGlobals = {};
            this._forEachWidget(migratedData, (w) => {
                if (w && w.type === 'graph' && this._migrateGraphScaleKeys(w)) graphChanged = true;
                if (this._migrateGraphWidgetToSeries(w, graphBagPreNormalize, migratedData, usedGraphGlobals)) graphChanged = true;
            });
            if (migratedData.globalBindings && typeof migratedData.globalBindings === 'object') {
                Object.keys(usedGraphGlobals).forEach((key) => {
                    if (migratedData.globalBindings[key] === undefined) return;
                    delete migratedData.globalBindings[key];
                    graphChanged = true;
                });
                const gb = migratedData.globalBindings;
                if (gb.defaultGraphAutoMin !== undefined) {
                    if (gb.defaultGraphDynamicFloor === undefined) gb.defaultGraphDynamicFloor = gb.defaultGraphAutoMin;
                    delete gb.defaultGraphAutoMin;
                    graphChanged = true;
                }
                if (gb.defaultGraphAutoMax !== undefined) {
                    if (gb.defaultGraphDynamicCeiling === undefined) gb.defaultGraphDynamicCeiling = gb.defaultGraphAutoMax;
                    delete gb.defaultGraphAutoMax;
                    graphChanged = true;
                }
                if (gb.defaultGraphPointValuesInterval !== undefined) {
                    if (gb.defaultGraphPointValuesTimeWidth === undefined) gb.defaultGraphPointValuesTimeWidth = gb.defaultGraphPointValuesInterval;
                    delete gb.defaultGraphPointValuesInterval;
                    graphChanged = true;
                }
            }
            let masterGraphBag = this._graphMasterBag(migratedData);
            if (!masterGraphBag && graphBagPreNormalize && (graphBagPreNormalize.fill === false || graphBagPreNormalize.defaultGraphFill === false || (graphBagPreNormalize.fillOpacity != null && graphBagPreNormalize.fillOpacity !== '') || (graphBagPreNormalize.defaultGraphFillOpacity != null && graphBagPreNormalize.defaultGraphFillOpacity !== ''))) {
                if (!migratedData.master || typeof migratedData.master !== 'object') migratedData.master = {};
                if (!migratedData.master.widgetDefaults || typeof migratedData.master.widgetDefaults !== 'object') migratedData.master.widgetDefaults = {};
                if (!migratedData.master.widgetDefaults.graph || typeof migratedData.master.widgetDefaults.graph !== 'object') migratedData.master.widgetDefaults.graph = {};
                masterGraphBag = migratedData.master.widgetDefaults.graph;
            }
            if (this._migrateGraphMasterSeriesDefaults(masterGraphBag, graphBagPreNormalize)) graphChanged = true;
            if (graphChanged) {
                hasChanges = true;
                semanticMigrationApplied = true;
                addChangeLabel('Graph: multi-series shape, Dynamic Floor & Dynamic Ceiling (2.3.0)');
            }
        }

        if (migratedData.master && typeof migratedData.master === 'object') {
            const m = migratedData.master;
            let masterScaleChanged = false;
            const masterPairs = [
                { from: 'defaultGraphAutoMin', to: 'defaultGraphDynamicFloor' },
                { from: 'defaultGraphAutoMax', to: 'defaultGraphDynamicCeiling' },
                { from: 'defaultGraphPointValuesInterval', to: 'defaultGraphPointValuesTimeWidth' }
            ];
            const suffixes = this.TYPOGRAPHY_AUX_SUFFIXES;
            for (let p = 0; p < masterPairs.length; p++) {
                const pair = masterPairs[p];
                for (let s = 0; s < suffixes.length; s++) {
                    const fromKey = pair.from + suffixes[s];
                    const toKey = pair.to + suffixes[s];
                    if (Object.prototype.hasOwnProperty.call(m, fromKey)) {
                        if (!Object.prototype.hasOwnProperty.call(m, toKey)) {
                            m[toKey] = m[fromKey];
                        }
                        delete m[fromKey];
                        masterScaleChanged = true;
                    }
                }
            }
            if (m.defaultGraphAutoMin !== undefined) {
                if (m.defaultGraphDynamicFloor === undefined) m.defaultGraphDynamicFloor = m.defaultGraphAutoMin;
                delete m.defaultGraphAutoMin;
                masterScaleChanged = true;
            }
            if (m.defaultGraphAutoMax !== undefined) {
                if (m.defaultGraphDynamicCeiling === undefined) m.defaultGraphDynamicCeiling = m.defaultGraphAutoMax;
                delete m.defaultGraphAutoMax;
                masterScaleChanged = true;
            }
            if (m.defaultGraphAnimation === 'draw') {
                m.defaultGraphAnimation = 'morph';
                masterScaleChanged = true;
            }
            if (m.defaultGraphPointValuesInterval !== undefined) {
                const oldVal = Number(m.defaultGraphPointValuesInterval);
                if (m.defaultGraphPointValuesTimeWidth === undefined) {
                    m.defaultGraphPointValuesTimeWidth = Math.max(1, Math.round((oldVal > 0 ? oldVal : 1) * 48));
                }
                if (m.defaultGraphPointValuesStep === undefined) {
                    m.defaultGraphPointValuesStep = Math.max(1, Math.round(oldVal >= 1 ? oldVal : 1));
                }
                delete m.defaultGraphPointValuesInterval;
                masterScaleChanged = true;
            }
            if (m.widgetDefaults && m.widgetDefaults.graph && typeof m.widgetDefaults.graph === 'object') {
                const gDef = m.widgetDefaults.graph;
                for (let s = 0; s < suffixes.length; s++) {
                    const fromKey = 'pointValuesInterval' + suffixes[s];
                    const toKey = 'pointValuesTimeWidth' + suffixes[s];
                    if (Object.prototype.hasOwnProperty.call(gDef, fromKey)) {
                        if (!Object.prototype.hasOwnProperty.call(gDef, toKey)) {
                            gDef[toKey] = gDef[fromKey];
                        }
                        delete gDef[fromKey];
                        masterScaleChanged = true;
                    }
                }
                if (gDef.pointValuesInterval !== undefined) {
                    const oldVal = Number(gDef.pointValuesInterval);
                    if (gDef.pointValuesTimeWidth === undefined) {
                        gDef.pointValuesTimeWidth = Math.max(1, Math.round((oldVal > 0 ? oldVal : 1) * 48));
                    }
                    if (gDef.pointValuesStep === undefined) {
                        gDef.pointValuesStep = Math.max(1, Math.round(oldVal >= 1 ? oldVal : 1));
                    }
                    delete gDef.pointValuesInterval;
                    masterScaleChanged = true;
                }
            }
            const masterDroppedColorKeys = [
                'lineColor', 'fillColor', 'negativeFillColor', 'fill', 'fillOpacity', 'barColor', 'pointColor', 'linearTimeScale',
                'graphLineCol', 'graphFillCol', 'graphNegFillColor', 'defaultGraphFill', 'defaultGraphFillOpacity',
                'defaultGraphBarColor', 'defaultGraphPointColor', 'defaultGraphLinearTimeScale'
            ];
            if (this._dropKeysWithCorrections(m, masterDroppedColorKeys)) {
                masterScaleChanged = true;
            }
            if (masterScaleChanged) {
                hasChanges = true;
                addChangeLabel('Graph: Dynamic Floor and Dynamic Ceiling master settings (2.3.0)');
            }
        }

        const dataActuallyChanged = this._stableJsonStringify(migratedData) !== baselineSnapshot;
        hasChanges = dataActuallyChanged;
        semanticMigrationApplied = appliedChangeLabels.length > 0;

        if (dataActuallyChanged) {
            migratedData.version = targetVersion;
        }

        return {
            migrated: semanticMigrationApplied,
            dataMutated: hasChanges,
            originalVersion: originalVersion,
            newVersion: targetVersion,
            appliedChangeLabels: appliedChangeLabels,
            data: migratedData
        };
    }
};
