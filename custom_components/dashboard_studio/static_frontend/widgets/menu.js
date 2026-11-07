class MenuWidget extends BaseWidget {
    static get metadata() {
        return { label: "Menu", shortName: "Menu", icon: "ph-list", category: "Layout", color_dark: "hsl(280, 80%, 65%)", color_light: "hsl(280, 85%, 35%)", version: "2.3.5", date: "2026-11-07" };
    }

    /** Keys for BaseWidget.getIconStyleSchema / applyIconStyleToElement (on state). */
    static get ICON_STYLE_KEYMAP_ON() {
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

    /** Keys for off state. */
    static get ICON_STYLE_KEYMAP_OFF() {
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

    static defaultIconSlot() {
        return {
            source: 'phosphor',
            builtin: '',
            weight: 'fill',
            customUrl: '',
            tintImage: false
        };
    }

    /**
     * Sparse `icons.off` only stores keys that differ from **Icon (On)** for these props (same pattern as Switch).
     * Off keeps its own accent, offsets, rotation, size, etc.
     */
    static get MENU_ITEM_OFF_ICON_INHERIT_KEYS() {
        return ['source', 'builtin', 'weight', 'customUrl', 'tintImage'];
    }

    /** Inherit via omitted keys only — do not delete follower keys that match the leader (explicit overrides). */
    static pruneMenuItemOffIconInheritKeys(_follower, _leader) {
        return false;
    }

    /**
     * Read nested `icons.off[prop]` or inherit from `icons.on` when absent / placeholder (editor + logic).
     */
    static readMenuItemOffInheritNested(item, prop) {
        MenuWidget.ensureMenuItemIcons(item);
        const F = item.icons.off && typeof item.icons.off === 'object' ? item.icons.off : {};
        const L = item.icons.on && typeof item.icons.on === 'object' ? item.icons.on : {};
        if (Object.prototype.hasOwnProperty.call(F, prop)
                && !BaseWidget.followerIconInheritPlaceholder(prop, F[prop])) {
            return F[prop];
        }
        return L[prop];
    }

    /** Write nested off prop, then strip placeholders + prune vs On (keeps `icons.off` sparse). */
    static writeMenuItemOffInheritNested(item, prop, val) {
        MenuWidget.ensureMenuItemIcons(item);
        if (!item.icons.off || typeof item.icons.off !== 'object') item.icons.off = {};
        item.icons.off[prop] = val;
        BaseWidget.stripIconFollowerInheritPlaceholders(item.icons.off, MenuWidget.MENU_ITEM_OFF_ICON_INHERIT_KEYS);
        MenuWidget.pruneMenuItemOffIconInheritKeys(item.icons.off, item.icons.on);
    }

    /** Effective off slot for flatten / visibility / header preview (inherit identity from On). */
    static resolveMenuItemOffIconSlotForFlatten(item) {
        MenuWidget.ensureMenuItemIcons(item);
        const on = item.icons.on && typeof item.icons.on === 'object' ? item.icons.on : {};
        const off = item.icons.off && typeof item.icons.off === 'object' ? item.icons.off : {};
        return BaseWidget.resolveIconFollowerSlotFromLeader(
            on, off, MenuWidget.MENU_ITEM_OFF_ICON_INHERIT_KEYS);
    }

    /**
     * `null` = not a menu off sparse flat key. `true` / `false` = `icons.off` locally owns the nested prop.
     */
    static menuItemOffFlatPropIsLocallyOverridden(item, flatProp) {
        const map = {
            iconSourceOff: 'source',
            iconOff: 'builtin',
            iconWeightOff: 'weight',
            imgOff: 'customUrl',
            colorizeOff: 'tintImage'
        };
        const nested = map[flatProp];
        if (!nested) return null;
        MenuWidget.ensureMenuItemIcons(item);
        const st = item.icons.off;
        if (!st || typeof st !== 'object') return false;
        if (!Object.prototype.hasOwnProperty.call(st, nested)) return false;
        return !BaseWidget.followerIconInheritPlaceholder(nested, st[nested]);
    }

    /**
     * Ensures each menu row has full default merge on `icons.on` only; `icons.off` stays sparse (follows On for {@link MENU_ITEM_OFF_ICON_INHERIT_KEYS}).
     */
    static ensureMenuItemIcons(item) {
        if (!item || typeof item !== 'object') return;
        const def = MenuWidget.defaultIconSlot();
        if (!item.icons || typeof item.icons !== 'object') item.icons = {};
        if (!item.icons.on || typeof item.icons.on !== 'object') {
            item.icons.on = { ...def };
        } else {
            const prev = { ...item.icons.on };
            Object.assign(item.icons.on, def);
            Object.assign(item.icons.on, prev);
        }
        const prevStoredOffSlot = (!item.icons.off || typeof item.icons.off !== 'object') ? {} : { ...item.icons.off };
        item.icons.off = {};
        Object.keys(prevStoredOffSlot).forEach((k) => {
            item.icons.off[k] = prevStoredOffSlot[k];
        });
        BaseWidget.stripIconFollowerInheritPlaceholders(item.icons.off, MenuWidget.MENU_ITEM_OFF_ICON_INHERIT_KEYS);
        MenuWidget.pruneMenuItemOffIconInheritKeys(item.icons.off, item.icons.on);
        const defOn = { enabled: false, color: '@onAccent' };
        const defOff = { enabled: false, color: '@icon' };
        const prev = item.iconColorOverrides && typeof item.iconColorOverrides === 'object' ? item.iconColorOverrides : {};
        const prevOn = prev.on && typeof prev.on === 'object' ? prev.on : {};
        const prevOff = prev.off && typeof prev.off === 'object' ? prev.off : {};
        item.iconColorOverrides = {
            on: { ...defOn, ...prevOn, enabled: prevOn.enabled === true },
            off: { ...defOff, ...prevOff, enabled: prevOff.enabled === true }
        };
    }

    /** Flat icon props for runtime / applyIconStyleToElement (binding prop names unchanged). */
    static expandMenuItemIconsToFlat(item) {
        MenuWidget.ensureMenuItemIcons(item);
        const on = item.icons.on;
        const offStored = item.icons.off;
        const offEff = MenuWidget.resolveMenuItemOffIconSlotForFlatten(item);
        const ovr = item.iconColorOverrides || {};
        const wOn = (on.weight != null && String(on.weight).trim() !== '')
            ? String(on.weight).toLowerCase().trim()
            : 'fill';
        const wOff = (offEff.weight != null && String(offEff.weight).trim() !== '')
            ? String(offEff.weight).toLowerCase().trim()
            : 'fill';
        const rawSrcOff = offEff ? offEff.source : 'phosphor';
        const coercedSrcOff = (rawSrcOff === 'custom' || rawSrcOff === 'phosphor' || rawSrcOff === 'favicon') ? rawSrcOff : 'phosphor';
        const flat = {
            iconSourceOn: on.source,
            iconOn: on.builtin,
            iconWeightOn: wOn,
            imgOn: on.customUrl,
            colorizeOn: on.tintImage === true,
            iconSourceOff: coercedSrcOff,
            iconOff: offEff ? offEff.builtin : '',
            iconWeightOff: wOff,
            imgOff: offEff ? offEff.customUrl : '',
            colorizeOff: offEff && offEff.tintImage === true,
            iconColOnOverrideEn: ovr.on && ovr.on.enabled === true,
            iconColOnOverride: (ovr.on && ovr.on.color) || '@onAccent',
            iconColOffOverrideEn: ovr.off && ovr.off.enabled === true,
            iconColOffOverride: (ovr.off && ovr.off.color) || '@icon'
        };
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        flat.iconSlotAccentOn = BaseWidget.resolveIconSlotAccentColor(on, M.menuIconAccentOn);
        flat.iconSlotAccentOff = BaseWidget.resolveIconSlotAccentColor(offStored, M.menuIconAccentOff);
        Object.assign(flat, BaseWidget.flattenIconSlotTransformFlat(on, MenuWidget.ICON_STYLE_KEYMAP_ON));
        Object.assign(flat, BaseWidget.flattenIconSlotTransformFlat(offStored, MenuWidget.ICON_STYLE_KEYMAP_OFF));
        return flat;
    }

    static extractPreloadImageUrls(o) {
        if (!o || typeof o !== 'object') return [];
        const items = Array.isArray(o.menuItems) ? o.menuItems : [];
        const def = MenuWidget.defaultIconSlot();
        const mergeSlot = (slot) => ({ ...def, ...(slot && typeof slot === 'object' ? slot : {}) });
        const out = [];
        items.forEach((item) => {
            if (!item || typeof item !== 'object') return;
            MenuWidget.ensureMenuItemIcons(item);
            const icons = item.icons && typeof item.icons === 'object' ? item.icons : {};
            const on = mergeSlot(icons.on);
            const offEff = MenuWidget.resolveMenuItemOffIconSlotForFlatten(item);
            if (on.source === 'custom') {
                const u = String(on.customUrl || '').trim();
                if (u) out.push(u);
            }
            if (on.source === 'favicon' && item.actionType === 'url'
                && typeof UrlFavicon !== 'undefined' && UrlFavicon && typeof UrlFavicon.resolveFaviconUrl === 'function') {
                const fav = UrlFavicon.resolveFaviconUrl(item.urlTo);
                if (fav) out.push(String(fav).trim());
            }
            if (offEff.source === 'custom') {
                const u = String(offEff.customUrl || '').trim();
                if (u) out.push(u);
            }
            if (offEff.source === 'favicon' && item.actionType === 'url'
                && typeof UrlFavicon !== 'undefined' && UrlFavicon && typeof UrlFavicon.resolveFaviconUrl === 'function') {
                const fav = UrlFavicon.resolveFaviconUrl(item.urlTo);
                if (fav) out.push(String(fav).trim());
            }
        });
        return out;
    }

    static get COMMON_SCHEMA() {
        // Deep-clone to avoid mutating the shared BaseWidget schema object across calls.
        const schema = JSON.parse(JSON.stringify(BaseWidget.COMMON_SCHEMA));
        const layoutGroup = schema.find(g => g.id === 'layout_group');
        if (layoutGroup) {
            layoutGroup.fields.push(
                { key: 'menuWAuto', type: 'checkbox', label: 'Auto Width (Fit to Content)', cols: 6 },
                { key: 'menuHAuto', type: 'checkbox', label: 'Auto Height (Fit to Content)', cols: 6 }
            );
        }
        return schema;
    }

    /** Item Inner Glow color/opacity leaves show once a width is set (instance or master default). */
    static itemInnerGlowDetailsVisible(values, isGlobal) {
        if (!values) return false;
        const inst = isGlobal === true ? values.menuItemInnerGlow : values.itemInnerGlow;
        const raw = Number(inst !== undefined && inst !== null && inst !== '' ? inst : values.menuItemInnerGlow);
        return Number.isFinite(raw) && raw > 0;
    }

    /** Combines a CSS color with a 0–100 opacity factor; preserves embedded alpha in rgba when opacity is 100. */
    static resolveItemBackgroundColor(color, opacityPercent) {        const opRaw = opacityPercent !== undefined && opacityPercent !== null ? Number(opacityPercent) : 100;
        const op = Number.isFinite(opRaw) ? Math.max(0, Math.min(100, opRaw)) : 100;
        const raw = color == null ? '' : String(color).trim();
        if (!raw || raw.toLowerCase() === 'transparent') return 'transparent';
        const resolved = BaseWidget.resolveCssColor(raw);
        const hsv = ColorUtils.parse(resolved);
        if (!hsv) return resolved;
        const baseA = (hsv.a !== undefined && hsv.a !== null) ? hsv.a : 1;
        hsv.a = Math.max(0, Math.min(1, baseA * (op / 100)));
        return ColorUtils.toCss(hsv);
    }

    /** True when the CSS color is fully invisible (transparent keyword, missing, or alpha ≤ 0). */
    static isTransparentCssColor(color) {
        const raw = color == null ? '' : String(color).trim();
        if (!raw || raw.toLowerCase() === 'transparent') return true;
        const hsv = ColorUtils.parse(raw);
        if (!hsv) return false;
        const baseA = (hsv.a !== undefined && hsv.a !== null) ? hsv.a : 1;
        return baseA <= 0;
    }

    /**
     * If the color string carries alpha (e.g. rgba), returns opaque rgb + embedded alpha 0–1.
     * Used so the hover opacity slider matches what you see (opaque hex + separate opacity vs rgba alpha).
     */
    static foldEmbeddedAlphaFromHoverColor(color) {
        const raw = color == null ? '' : String(color).trim();
        if (!raw || raw.toLowerCase() === 'transparent') return null;
        const hsv = ColorUtils.parse(raw);
        if (!hsv) return null;
        const baseA = (hsv.a !== undefined && hsv.a !== null) ? hsv.a : 1;
        if (baseA >= 1 || baseA <= 0) return null;
        const rgb = ColorUtils.hsvToRgb(hsv.h, hsv.s, hsv.v);
        const opaqueCss = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        return { opaqueCss, embedded: baseA };
    }

    /** Default hover opacity % when the hover color has no embedded alpha (opaque hex/rgb). */
    static inferOpaqueHoverOpacityFallback(color) {
        const raw = color == null ? '' : String(color).trim();
        if (!raw || raw.toLowerCase() === 'transparent') return 100;
        const hsv = ColorUtils.parse(raw);
        if (!hsv) return 10;
        const baseA = (hsv.a !== undefined && hsv.a !== null) ? hsv.a : 1;
        if (baseA < 1) return 100;
        return 10;
    }

    /**
     * Folds rgba hover into rgb + opacity for the global settings editor (mutates a shallow copy of master only).
     */
    static normalizeHoverGlobalsForEditor(values) {
        if (!values || typeof values !== 'object') return;
        const rawHover = values.menuItemBgHover;
        const fold = MenuWidget.foldEmbeddedAlphaFromHoverColor(rawHover);
        if (!fold) return;
        values.menuItemBgHover = fold.opaqueCss;
        const multFrom = (v) => {
            if (v === undefined || v === null || v === '') return 100;
            const n = Number(v);
            return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 100;
        };
        const mult = multFrom(values.menuItemBgHoverOpacity);
        values.menuItemBgHoverOpacity = Math.max(0, Math.min(100, Math.round(fold.embedded * mult)));
    }

    static resolveAxisOffset(override, globalFallback) {
        const pick = (v) => {
            if (v === undefined || v === null || v === '') return null;
            const n = Number(v);
            return Number.isFinite(n) ? n : null;
        };
        const o = pick(override);
        const g = pick(globalFallback);
        return (o !== null && o !== undefined) ? o : ((g !== null && g !== undefined) ? g : 0);
    }

    /** Shared Label Hint select options (see `LabelHint` in utils.js). */
    static get labelHintOptions() {
        return (typeof LabelHint !== 'undefined' && LabelHint.OPTIONS)
            ? LabelHint.OPTIONS
            : [
                { value: 'disabled', text: 'Disabled' },
                { value: 'truncated', text: 'When Label Is Truncated' },
                { value: 'always', text: 'Always' }
            ];
    }

    static normalizeLabelHint(raw, fallback) {
        if (typeof LabelHint !== 'undefined' && LabelHint.normalizeMode) {
            return LabelHint.normalizeMode(raw, fallback);
        }
        return fallback || 'truncated';
    }

    static get globalSettings() {
        return {
            menuItemSpacing: 4,
            menuItemRadius: 8,
            menuIconColOn: BaseWidget.themeTokenRef('onAccent'),
            menuIconColOff: BaseWidget.themeTokenRef('icon'),
            menuIconAccentOn: BaseWidget.themeTokenRef('iconAccent'),
            menuIconAccentOff: BaseWidget.themeTokenRef('iconAccent'),
            menuIconSize: 24,
            menuItemBgOn: "@glow",
            menuItemBgOnOpacity: 100,
            menuItemBgOff: BaseWidget.themeTokenRef('accentOff'),
            // Off items default to the Accent Off token (same off color as Switch and Light
            // Grid). Opacity factory is 100 so it shows without a second step; the
            // transparent keyword still hides the background at any opacity.
            menuItemBgOffOpacity: 100,
            menuItemBgHover: BaseWidget.themeTokenRef('accent'),
            menuItemBgHoverOpacity: 10,
            menuItemOutlineWidth: 0,
            menuItemOutlineColor: "@borderAccent",
            menuItemOutlineOpacity: 100,
            menuItemBlur: 0,
            menuItemInnerGlow: 0,
            menuItemInnerGlowColor: "@borderAccent",
            menuItemInnerGlowOpacity: 100,
            menuSpacerStyle: "line",
            menuSpacerAmount: 5,
            menuSpacerColor: "@border",
            menuItemColOff: "@textMuted",

            menuDefaultItemFs: 12,
            menuDefaultItemAlign: "left",
            menuDefaultItemCase: "none",
            menuDefaultItemBold: false,
            menuDefaultItemItalic: false,
            menuDefaultItemCol: "@surfaceAlt",
            menuDefaultItemColOff: "@textMuted",
            menuDefaultItemOpacity: 100,
            menuDefaultItemOffX: 0,
            menuDefaultItemOffY: 0,
            menuDefaultLabelHint: 'truncated'
        };
    }

    static get basicSettingKeys() {
        return ['menuItems', 'menuTriggerTopic', 'menuStatusTopic', 'menuCloseMethod'];
    }

    static get globalSchema() {
        return [
            { type: 'heading', label: 'Layout & spacing', cols: 12 },
            { key: 'menuItemSpacing', type: 'number', label: 'Item Spacing (px)', cols: 6 },
            { key: 'menuItemRadius', type: 'number', label: 'Item Corner Radius', cols: 6 },
            {
                key: 'menuDefaultLabelHint', type: 'select', label: 'Label Hint', cols: 12,
                options: MenuWidget.labelHintOptions,
                hint: 'Shows the full menu item label in a browser tooltip on hover. When Label Is Truncated applies only when the text is cut off with an ellipsis or clipped by the layout.'
            },

            { type: 'heading', label: 'Icon', cols: 12 },
            { key: 'menuIconColOn', type: 'color', label: 'Icon Color (On)', cols: 3 },
            { key: 'menuIconColOff', type: 'color', label: 'Icon Color (Off)', cols: 3 },
            { key: 'menuIconAccentOn', type: 'color', label: 'Icon Accent (On)', cols: 3 },
            { key: 'menuIconAccentOff', type: 'color', label: 'Icon Accent (Off)', cols: 3 },
            { key: 'menuIconSize', type: 'number', label: 'Icon Base Size (px)', cols: 12 },

            { type: 'heading', label: 'Item backgrounds', cols: 12 },
            { key: 'menuItemBgOn', type: 'color', label: 'Item Background (On)', cols: 6, gridColStart: 1 },
            { key: 'menuItemBgOnOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6 },
            { key: 'menuItemBgOff', type: 'color', label: 'Item Background (Off)', cols: 6, gridColStart: 1 },
            { key: 'menuItemBgOffOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6 },
            { key: 'menuItemBgHover', type: 'color', label: 'Item Background (Hover)', cols: 6, gridColStart: 1 },
            { key: 'menuItemBgHoverOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6 },
            { key: 'menuItemBlur', type: 'number', min: 0, label: 'Item Background Blur', cols: 12, gridColStart: 1 },
            { key: 'menuItemOutlineWidth', type: 'number', min: 0, label: 'Item Outline Width', cols: 4, gridColStart: 1 },
            {
                key: 'menuItemOutlineColor', type: 'color', label: 'Item Outline Color', cols: 4,
                dependsOn: ['menuItemOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('menuItemOutlineWidth')
            },
            {
                key: 'menuItemOutlineOpacity', type: 'number', min: 0, max: 100, label: 'Item Outline Opacity', cols: 4,
                dependsOn: ['menuItemOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('menuItemOutlineWidth')
            },
            { key: 'menuItemInnerGlow', type: 'number', min: 0, label: 'Item Inner Glow', cols: 4, gridColStart: 1 },
            {
                key: 'menuItemInnerGlowColor', type: 'color', label: 'Item Inner Glow Color', cols: 4,
                dependsOn: ['menuItemInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('menuItemInnerGlow')
            },
            {
                key: 'menuItemInnerGlowOpacity', type: 'number', min: 0, max: 100, label: 'Item Inner Glow Opacity', cols: 4,
                dependsOn: ['menuItemInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('menuItemInnerGlow')
            },

            { type: 'heading', label: 'Separator', cols: 12 },
            { key: 'menuSpacerStyle', type: 'select', label: 'Line in separator items', options: [{ value: 'empty', text: 'Gap only' }, { value: 'line', text: 'Gap with line' }], cols: 4 },
            { key: 'menuSpacerAmount', type: 'number', label: 'Separator gap (px)', cols: 4 },
            { key: 'menuSpacerColor', type: 'color', label: 'Separator line color', cols: 4 },

            { type: 'heading', label: 'Typography', cols: 12 },
            BaseWidget.getTypographySchema('menuDefaultItem', 'Menu Item', {
                dualColor: true,
                dualColorOnDefaultKey: 'defaultColLabel',
                dualColorOffDefaultKey: 'menuDefaultItemColOff',
                dualColorOnLabel: 'Font Color (On)',
                dualColorOffLabel: 'Font Color (Off)',
                alignLabel: 'Menu Item Alignment',
                caseLabel: 'Menu Item Case',
                boldLabel: 'Menu Item Bold',
                italicLabel: 'Menu Item Italic',
                offsetXLabel: 'Menu Item Offset X',
                offsetYLabel: 'Menu Item Offset Y',
                fontDefaultKey: 'fontFamily',
                fontSizeDefaultKey: 'defaultFsLabel',
                alignDefaultKey: 'defaultTextAlign',
                caseDefaultKey: 'defaultLabelCase',
                boldDefaultKey: 'defaultLabelBold',
                italicDefaultKey: 'defaultLabelItalic',
                opacityDefaultKey: null,
                offXDefaultKey: null,
                offYDefaultKey: null
            })
        ];
    }

    /**
     * Flattens overrides.typography.{groupLabel,menuItem} onto runtime flat keys (menuLabel*, menuItem*)
     * so applyTypographyToElement and the editor merged `values` keep working.
     */
    static applyTypographyNestedToConfig(c) {
        BaseWidget.applyTypographyNestedToConfig(c, [
            ['groupLabel', 'menuLabel'],
            ['menuItem', 'menuItem']
        ], {
            skipWhen: function (role, prop) {
                return role === 'groupLabel' && prop === 'colorOff';
            }
        });
    }

    /** Maps stored mode `spacer` to `separator`. */
    static normalizeItemMode(mode) {
        const m = String(mode == null ? 'push' : mode).toLowerCase();
        if (m === 'spacer') return 'separator';
        if (m === 'push' || m === 'toggle' || m === 'separator') return m;
        return 'push';
    }

    /** `left` | `right` | `top` | `bottom` for icon vs label layout. */
    static normalizeMenuIconLoc(loc) {
        const m = String(loc == null ? 'left' : loc).toLowerCase();
        if (m === 'right' || m === 'top' || m === 'bottom') return m;
        return 'left';
    }

    static getActionTypeOptions(values = {}, prefix = "") {
        const hasTopic = Boolean(String(values[`${prefix}outputTopic`] || "").trim());
        const pageOptionLabel = hasTopic ? 'Go to Page + Topic' : 'Go to Page';
        const urlOptionLabel = hasTopic ? 'Open URL + Topic' : 'Open URL';
        return [
            { value: 'topic', text: 'Send Topic' },
            { value: 'page', text: pageOptionLabel },
            { value: 'url', text: urlOptionLabel }
        ];
    }

    static get AUDIO_TRIGGERS() {
        return [
            { key: 'open', label: 'Menu Open' },
            { key: 'select', label: 'On Item Select' },
            { key: 'toggleOn', label: 'On Item Toggle On' },
            { key: 'toggleOff', label: 'On Item Toggle Off' },
            {
                key: 'close',
                label: 'Menu Close',
                labelFor: function (values) {
                    return MenuWidget.menuCloseAudioLabel(values);
                }
            }
        ];
    }

    static itemSoundKeys() {
        return ['select', 'toggleOn', 'toggleOff'];
    }

    static hasConfiguredItemSound(audio) {
        if (!audio || typeof audio !== 'object') return false;
        const keys = MenuWidget.itemSoundKeys();
        for (let i = 0; i < keys.length; i++) {
            const v = audio[keys[i]];
            if (v != null && String(v).trim() !== '') return true;
        }
        return false;
    }

    /** Dropdown / slide menus whose Close Method closes after a selection. */
    static menuClosesAfterSelection(values) {
        const v = values || {};
        if (String(v.menuStyle || 'static') === 'static') return false;
        const method = String(v.menuCloseMethod || 'toggle');
        return method === 'toggle' || method === 'always';
    }

    static menuCloseAudioLabel(values) {
        if (MenuWidget.menuClosesAfterSelection(values) && MenuWidget.hasConfiguredItemSound(values && values.audio)) {
            return 'Menu Close (skipped when an item sound plays)';
        }
        return 'Menu Close';
    }

    /** Drop retired per-row sound maps so they cannot be saved or played. */
    static stripItemAudio(overrides) {
        if (!overrides || !Array.isArray(overrides.menuItems)) return;
        overrides.menuItems.forEach(function (item) {
            if (item && typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, 'audio')) {
                delete item.audio;
            }
        });
    }

    static stripItemAudioBindings(bindings) {
        if (!bindings || !Array.isArray(bindings.menuItems)) return;
        bindings.menuItems.forEach(function (row) {
            if (row && typeof row === 'object' && Object.prototype.hasOwnProperty.call(row, 'audio')) {
                delete row.audio;
            }
        });
    }

    getDefaultOverrides() {
        const slot = MenuWidget.defaultIconSlot();
        const row = (label) => ({
            label,
            mode: 'push',
            actionType: 'topic',
            state: false,
            selectionGroup: '',
            sendOffOnGroupDeselect: false,
            urlNewTab: false,
            icons: { on: { ...slot }, off: {} },
            iconColorOverrides: {
                on: { enabled: false, color: '@surfaceAlt' },
                off: { enabled: false, color: '@text' }
            }
        });
        return {
            label: '',
            menuItems: [row('Item 1'), row('Item 2')],
            menuWAuto: false,
            menuHAuto: true,
            menuLayout: 'vertical',
            menuStyle: 'static',
            menuTriggerTopic: "",
            menuStatusTopic: "",
            menuCloseMethod: "toggle",
            menuIconLoc: 'left',
            menuSeparatorShowLine: true,
            menuSeparatorGap: 5,
            audio: (typeof DashboardAudio !== 'undefined' && DashboardAudio.defaultAudio)
                ? DashboardAudio.defaultAudio(MenuWidget.AUDIO_TRIGGERS)
                : { open: '', select: '', toggleOn: '', toggleOff: '', close: '' }
        };
    }

    constructor(cid, id, ov, bn) {
        MenuWidget.stripItemAudio(ov);
        MenuWidget.stripItemAudioBindings(bn);
        super(cid, id, ov, bn);
        this.isOpen = false;
        this.lastInteractions = {};
        this._animateNextOpen = false;
        this._syncBindings();
    }

    update(payload, replace = false) {
        super.update(payload, replace);
        MenuWidget.stripItemAudio(this.overrides);
        this._syncBindings();
    }

    updateBindings(payload, replace = false) {
        super.updateBindings(payload, replace);
        MenuWidget.stripItemAudioBindings(this.bindings);
        this._syncBindings();
    }

    // Registers the trigger topic as an auxiliary binding so the data driver can dispatch to it.
    _syncBindings() {
        const c = this.config;
        if (c.menuStyle !== 'static' && c.menuTriggerTopic) {
            this.bindings['__trigger'] = c.menuTriggerTopic;
        } else {
            delete this.bindings['__trigger'];
        }
        this.notifyBindingsMutated();
    }

    /** Per-row binding path under `bindings.menuItems[index]` (v1.6+ nested shape). */
    static menuItemBindingPath(index, prop) {
        const base = ['menuItems', index];
        if (prop === 'iconColOnOverride') return [...base, 'iconColorOverrides', 'on', 'color'];
        if (prop === 'iconColOnOverrideEn') return [...base, 'iconColorOverrides', 'on', 'enabled'];
        if (prop === 'iconColOffOverride') return [...base, 'iconColorOverrides', 'off', 'color'];
        if (prop === 'iconColOffOverrideEn') return [...base, 'iconColorOverrides', 'off', 'enabled'];
        const iconKeys = BaseWidget.ICON_STYLE_NESTED_PROP_BY_FIELD_KEY;
        if (iconKeys[prop]) {
            const slot = BaseWidget.MENU_ICON_OFF_SLOT_FIELD_KEYS.has(prop) ? 'off' : 'on';
            return [...base, 'icons', slot, iconKeys[prop]];
        }
        return [...base, prop];
    }

    static menuItemStateBindingPath(index) {
        return ['menuItems', index, 'state'];
    }

    /**
     * Local visual state for a menu item, shown until its bound state topic delivers
     * the next value. Never written to Dashboard.liveData.
     */
    _setOptimisticItemState(index, isOn) {
        const stTopic = typeof BindingsTree !== 'undefined'
            ? BindingsTree.getAtPath(this.bindings, MenuWidget.menuItemStateBindingPath(index))
            : undefined;
        if (!this._optimisticItemStates) this._optimisticItemStates = {};
        if (stTopic && typeof stTopic === 'string' && String(stTopic).trim()) {
            this._optimisticItemStates[index] = isOn;
        } else {
            delete this._optimisticItemStates[index];
        }
    }

    _menuItemBound(index, prop, fallback, coerce) {
        const path = MenuWidget.menuItemBindingPath(index, prop);
        const topic = typeof BindingsTree !== 'undefined'
            ? BindingsTree.getAtPath(this.bindings, path)
            : undefined;
        if (!topic || typeof topic !== 'string' || typeof Dashboard === 'undefined' || !Dashboard.liveData || Dashboard.liveData[topic] === undefined) {
            return fallback;
        }
        let v = Dashboard.liveData[topic];
        v = this._finalizeBindingValue(`menuItemBind_${index}_${prop}`, v);
        if (coerce === 'bool') {
            if (typeof v === 'boolean') return v;
            const s = String(v).toLowerCase().trim();
            return v === true || s === 'true' || s === '1' || s === 'on';
        }
        if (coerce === 'int') {
            const n = parseInt(v, 10);
            return Number.isNaN(n) ? fallback : n;
        }
        if (coerce === 'mode') {
            const s = String(v).toLowerCase().trim();
            if (s === 'spacer' || s === 'separator') return 'separator';
            if (s === 'push' || s === 'toggle') return s;
            return MenuWidget.normalizeItemMode(fallback);
        }
        if (coerce === 'action') {
            const s = String(v).toLowerCase().trim();
            if (s === 'topic' || s === 'page' || s === 'url') return s;
            return fallback;
        }
        if (prop === 'label') return BaseWidget.displayText(v);
        return v;
    }

    get config() {
        if (!this.lastInteractions) this.lastInteractions = {};

        const c = super.config;
        MenuWidget.applyTypographyNestedToConfig(c);
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const nz = (v) => v != null && String(v).trim() !== '';

        c.label = c.label != null ? String(c.label) : '';

        // Normalize layout mode (tolerate unknown values safely).
        const rawLayout = String(c.menuLayout == null ? 'vertical' : c.menuLayout).toLowerCase().trim();
        c.menuLayout = (rawLayout === 'horizontal' || rawLayout === 'grid') ? rawLayout : 'vertical';

        BaseWidget.fillWidgetLabelTypographyResolved(c, M, 'menuLabel', { resolveOpacity: true });

        if (!c.menuItemFont) {
            c.menuItemFont = nz(M.menuDefaultItemFont) ? M.menuDefaultItemFont
                : (nz(M.menuItemFont) ? M.menuItemFont : (c.fontFamily || M.fontFamily || "'Inter', sans-serif"));
        }
        if (c.menuItemFs == null || c.menuItemFs === '') {
            const fsI = M.menuDefaultItemFs != null ? M.menuDefaultItemFs : (M.menuItemFs != null ? M.menuItemFs : M.defaultFsLabel);
            c.menuItemFs = fsI != null ? fsI : 12;
        }

        const nestedMenuItem = this.overrides.typography && this.overrides.typography.menuItem;
        const hasNestedItemColor = nestedMenuItem && Object.prototype.hasOwnProperty.call(nestedMenuItem, 'color');
        const hasNestedItemColorOff = nestedMenuItem && Object.prototype.hasOwnProperty.call(nestedMenuItem, 'colorOff');
        const hasFlatMenuItemCol = Object.prototype.hasOwnProperty.call(this.overrides, 'menuItemCol')
            && this.overrides.menuItemCol !== undefined && this.overrides.menuItemCol !== null;
        const hasFlatMenuItemColOff = Object.prototype.hasOwnProperty.call(this.overrides, 'menuItemColOff')
            && this.overrides.menuItemColOff !== undefined && this.overrides.menuItemColOff !== null;

        if (!hasNestedItemColor && !hasFlatMenuItemCol) {
            c.menuItemCol = nz(M.menuDefaultItemCol) ? M.menuDefaultItemCol
                : (nz(M.menuItemCol) ? M.menuItemCol : (M.defaultColLabel || '@textMuted'));
        } else if (!nz(c.menuItemCol)) {
            c.menuItemCol = nz(M.menuDefaultItemCol) ? M.menuDefaultItemCol
                : (nz(M.menuItemCol) ? M.menuItemCol : (M.defaultColLabel || '@textMuted'));
        }

        if (!hasNestedItemColorOff && !hasFlatMenuItemColOff) {
            c.menuItemColOff = nz(M.menuDefaultItemColOff) ? M.menuDefaultItemColOff
                : (nz(M.menuItemColOff) ? M.menuItemColOff : '');
            if (!nz(c.menuItemColOff)) {
                c.menuItemColOff = nz(M.menuDefaultItemCol) ? M.menuDefaultItemCol : (c.menuItemCol || '@textMuted');
            }
        } else if (!nz(c.menuItemColOff)) {
            c.menuItemColOff = nz(M.menuDefaultItemColOff) ? M.menuDefaultItemColOff
                : (nz(M.menuItemColOff) ? M.menuItemColOff : (nz(M.menuDefaultItemCol) ? M.menuDefaultItemCol : (c.menuItemCol || '@textMuted')));
        }
        if (!c.menuItemAlign) {
            c.menuItemAlign = M.menuDefaultItemAlign || M.menuItemAlign || M.defaultTextAlign || 'left';
        }
        if (c.menuItemCase === undefined || c.menuItemCase === null || String(c.menuItemCase).trim() === '') {
            const cs = (M.menuDefaultItemCase !== null && M.menuDefaultItemCase !== undefined)
                ? M.menuDefaultItemCase
                : M.menuItemCase;
            if (cs !== undefined && cs !== null && String(cs).trim() !== '') {
                c.menuItemCase = cs;
            }
        }
        if (c.menuItemBold === undefined || c.menuItemBold === null) {
            if (M.menuDefaultItemBold !== undefined && M.menuDefaultItemBold !== null) {
                c.menuItemBold = M.menuDefaultItemBold === true;
            } else if (M.menuItemBold !== undefined && M.menuItemBold !== null) {
                c.menuItemBold = M.menuItemBold === true;
            } else {
                c.menuItemBold = M.defaultLabelBold === true;
            }
        }
        if (c.menuItemItalic === undefined || c.menuItemItalic === null) {
            if (M.menuDefaultItemItalic !== undefined && M.menuDefaultItemItalic !== null) {
                c.menuItemItalic = M.menuDefaultItemItalic === true;
            } else if (M.menuItemItalic !== undefined && M.menuItemItalic !== null) {
                c.menuItemItalic = M.menuItemItalic === true;
            } else {
                c.menuItemItalic = M.defaultLabelItalic === true;
            }
        }
        if (c.menuItemOpacity === undefined || c.menuItemOpacity === null || c.menuItemOpacity === '') {
            const opI = M.menuDefaultItemOpacity != null ? M.menuDefaultItemOpacity : M.menuItemOpacity;
            c.menuItemOpacity = opI != null ? opI : 100;
        }
        if (c.menuItemOffX === undefined || c.menuItemOffX === null) {
            const ix = M.menuDefaultItemOffX !== undefined && M.menuDefaultItemOffX !== null ? M.menuDefaultItemOffX : M.menuItemOffX;
            c.menuItemOffX = MenuWidget.resolveAxisOffset(undefined, ix);
        }
        if (c.menuItemOffY === undefined || c.menuItemOffY === null) {
            const iy = M.menuDefaultItemOffY !== undefined && M.menuDefaultItemOffY !== null ? M.menuDefaultItemOffY : M.menuItemOffY;
            c.menuItemOffY = MenuWidget.resolveAxisOffset(undefined, iy);
        }
        Object.keys(c).forEach(k => {
            if (/^menuItem_\d+_/.test(k)) delete c[k];
        });
        c.menuItems = Array.isArray(c.menuItems) ? c.menuItems : [];
        c.menuWAuto = c.menuWAuto === true;
        c.menuHAuto = c.menuHAuto === true;

        // Resolve item visual properties against global defaults.
        // This is essential: the schema uses per-widget overrides with global fallbacks via defaultKey,
        // but the runtime config must resolve them explicitly so _renderSpecific gets concrete values.
        c.itemBgOn        = c.itemBgOn        || c.menuItemBgOn    || '@glow';
        c.itemBgOff       = c.itemBgOff       || c.menuItemBgOff   || 'transparent';
        c.itemBgHover     = c.itemBgHover     || c.menuItemBgHover || BaseWidget.themeTokenRef('accent');
        const pickBgOpacity = (local, globalKey, fallback) => {
            if (local !== undefined && local !== null && local !== '') {
                const n = Number(local);
                return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : fallback;
            }
            const g = c[globalKey];
            if (g !== undefined && g !== null && g !== '') {
                const n = Number(g);
                if (!Number.isFinite(n)) return fallback;
                let clamped = Math.max(0, Math.min(100, n));
                // Global default was 100% while off color is transparent; normalize so inherited + reset match the real appearance.
                if (globalKey === 'menuItemBgOffOpacity' && clamped === 100 && MenuWidget.isTransparentCssColor(c.itemBgOff)) {
                    return 0;
                }
                return clamped;
            }
            return fallback;
        };
        c.itemBgOnOpacity = pickBgOpacity(c.itemBgOnOpacity, 'menuItemBgOnOpacity', 100);
        // Off defaults to 0% when the resolved color is invisible so the editor matches "transparent"; solid off colors default to 100% if no opacity is stored.
        const offOpacityFallback = MenuWidget.isTransparentCssColor(c.itemBgOff) ? 0 : 100;
        c.itemBgOffOpacity = pickBgOpacity(c.itemBgOffOpacity, 'menuItemBgOffOpacity', offOpacityFallback);
        const hoverFold = MenuWidget.foldEmbeddedAlphaFromHoverColor(c.itemBgHover);
        if (hoverFold) {
            c.itemBgHover = hoverFold.opaqueCss;
            const multFrom = (v) => {
                if (v === undefined || v === null || v === '') return 100;
                const n = Number(v);
                return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 100;
            };
            let mult = 100;
            if (c.itemBgHoverOpacity !== undefined && c.itemBgHoverOpacity !== null && c.itemBgHoverOpacity !== '') {
                mult = multFrom(c.itemBgHoverOpacity);
            } else if (c.menuItemBgHoverOpacity !== undefined && c.menuItemBgHoverOpacity !== null && c.menuItemBgHoverOpacity !== '') {
                mult = multFrom(c.menuItemBgHoverOpacity);
            }
            c.itemBgHoverOpacity = Math.max(0, Math.min(100, Math.round(hoverFold.embedded * mult)));
        } else {
            c.itemBgHoverOpacity = pickBgOpacity(
                c.itemBgHoverOpacity,
                'menuItemBgHoverOpacity',
                MenuWidget.inferOpaqueHoverOpacityFallback(c.itemBgHover)
            );
        }
        // Item surface chrome: outline + blur + inner glow (background opacities above are reused as-is).
        c.itemOutlineWidth = c.itemOutlineWidth !== undefined && c.itemOutlineWidth !== null && c.itemOutlineWidth !== '' ? Number(c.itemOutlineWidth) : (c.menuItemOutlineWidth || 0);
        c.itemOutlineColor = c.itemOutlineColor || c.menuItemOutlineColor || '@borderAccent';
        c.itemOutlineOpacity = pickBgOpacity(c.itemOutlineOpacity, 'menuItemOutlineOpacity', 100);
        c.itemBlur = c.itemBlur !== undefined && c.itemBlur !== null && c.itemBlur !== '' ? Number(c.itemBlur) : (c.menuItemBlur || 0);
        c.itemInnerGlow = c.itemInnerGlow !== undefined && c.itemInnerGlow !== null && c.itemInnerGlow !== '' ? Number(c.itemInnerGlow) : (c.menuItemInnerGlow || 0);
        c.itemInnerGlowColor = c.itemInnerGlowColor || c.menuItemInnerGlowColor || '@borderAccent';
        c.itemInnerGlowOpacity = pickBgOpacity(c.itemInnerGlowOpacity, 'menuItemInnerGlowOpacity', 100);
        c.iconColOn       = c.iconColOn       || c.menuIconColOn   || BaseWidget.themeTokenRef('onAccent');
        c.iconColOff      = c.iconColOff      || c.menuIconColOff  || BaseWidget.themeTokenRef('icon');
        c.iconAccentOn    = c.iconAccentOn    || c.menuIconAccentOn   || BaseWidget.themeTokenRef('iconAccent');
        c.iconAccentOff   = c.iconAccentOff   || c.menuIconAccentOff  || BaseWidget.themeTokenRef('iconAccent');
        c.iconSize        = c.iconSize        || c.menuIconSize    || 24;
        c.itemSpacing     = (c.itemSpacing     != null) ? c.itemSpacing     : (c.menuItemSpacing || 4);
        c.itemCornerRadius= (c.itemCornerRadius != null) ? c.itemCornerRadius : (c.menuItemRadius  || 8);

        const mihNum = Number(c.menuItemHeight);
        if (c.menuItemHeight === '' || c.menuItemHeight === null || c.menuItemHeight === undefined
            || !Number.isFinite(mihNum) || mihNum <= 0) {
            delete c.menuItemHeight;
        } else {
            c.menuItemHeight = mihNum;
        }

        const miwNum = Number(c.menuItemWidth);
        if (c.menuItemWidth === '' || c.menuItemWidth === null || c.menuItemWidth === undefined
            || !Number.isFinite(miwNum) || miwNum <= 0) {
            delete c.menuItemWidth;
        } else {
            c.menuItemWidth = miwNum;
        }

        c.menuIconLoc = MenuWidget.normalizeMenuIconLoc(c.menuIconLoc);
        c.menuLabelHint = MenuWidget.normalizeLabelHint(
            (c.menuLabelHint != null && c.menuLabelHint !== '') ? c.menuLabelHint : c.menuDefaultLabelHint
        );

        const gSpacerStyle = String(c.menuSpacerStyle || 'empty');
        let sepGap = c.menuSeparatorGap;
        if (sepGap == null || sepGap === '') sepGap = c.menuSpacerAmount;
        sepGap = Number(sepGap);
        c.menuSeparatorGap = (Number.isFinite(sepGap) && sepGap >= 0) ? sepGap : 16;
        c.menuSeparatorLineColor = c.menuSeparatorLineColor || c.menuSpacerColor || '@border';
        c.menuSeparatorLineVisible = c.menuSeparatorShowLine === true || (c.menuSeparatorShowLine !== false && gSpacerStyle === 'line');

        this.itemsConfig = [];
        c.menuItems.forEach((item, i) => {
            const stateKey = `item_${i}_state`;
            const stBind = typeof BindingsTree !== 'undefined'
                ? BindingsTree.getAtPath(this.bindings, MenuWidget.menuItemStateBindingPath(i))
                : undefined;
            const hasStateBinding = !!(stBind && typeof stBind === 'string' && String(stBind).trim());

            const mode = MenuWidget.normalizeItemMode(this._menuItemBound(i, 'mode', MenuWidget.normalizeItemMode(item.mode), 'mode'));
            const actionType = this._menuItemBound(i, 'actionType', item.actionType || 'topic', 'action');
            const boundLabel = this._menuItemBound(i, 'label', item.label != null ? item.label : '', null);
            const label = String(boundLabel !== null && boundLabel !== undefined ? boundLabel : '');
            const boundOutputTopic = this._menuItemBound(i, 'outputTopic', item.outputTopic != null ? item.outputTopic : '', null);
            const outputTopic = String(boundOutputTopic !== null && boundOutputTopic !== undefined ? boundOutputTopic : '');
            const onPayload = this._menuItemBound(i, 'onPayload', item.onPayload !== undefined ? item.onPayload : 'true', null);
            const offPayload = this._menuItemBound(i, 'offPayload', item.offPayload !== undefined ? item.offPayload : 'false', null);
            const pageToFallback = (() => {
                const n = parseInt(item.pageTo, 10);
                return Number.isNaN(n) ? 1 : n;
            })();
            const pageTo = this._menuItemBound(i, 'pageTo', pageToFallback, 'int');
            const boundUrlTo = this._menuItemBound(i, 'urlTo', item.urlTo != null ? item.urlTo : 'https://', null);
            const urlTo = String(boundUrlTo !== null && boundUrlTo !== undefined ? boundUrlTo : 'https://');
            const urlNewTab = this._menuItemBound(i, 'urlNewTab', item.urlNewTab === true, 'bool');
            const boundSelectionGroup = this._menuItemBound(i, 'selectionGroup', item.selectionGroup != null ? item.selectionGroup : '', null);
            const selectionGroup = String(boundSelectionGroup !== null && boundSelectionGroup !== undefined ? boundSelectionGroup : '').trim();
            const sendOffOnGroupDeselect = this._menuItemBound(i, 'sendOffOnGroupDeselect', item.sendOffOnGroupDeselect === true, 'bool');
            MenuWidget.ensureMenuItemIcons(item);
            const iFlat = MenuWidget.expandMenuItemIconsToFlat(item);
            const boundIconOn = this._menuItemBound(i, 'iconOn', iFlat.iconOn, null);
            const iconOn = String(boundIconOn !== null && boundIconOn !== undefined ? boundIconOn : '');
            const boundIconOff = this._menuItemBound(i, 'iconOff', iFlat.iconOff, null);
            const iconOff = String(boundIconOff !== null && boundIconOff !== undefined ? boundIconOff : '');
            const boundIconWeightOn = this._menuItemBound(i, 'iconWeightOn', iFlat.iconWeightOn, null);
            const iconWeightOn = String(boundIconWeightOn !== null && boundIconWeightOn !== undefined ? boundIconWeightOn : 'fill').toLowerCase().trim();
            const boundIconWeightOff = this._menuItemBound(i, 'iconWeightOff', iFlat.iconWeightOff, null);
            const iconWeightOff = String(boundIconWeightOff !== null && boundIconWeightOff !== undefined ? boundIconWeightOff : 'fill').toLowerCase().trim();
            const boundImgOn = this._menuItemBound(i, 'imgOn', iFlat.imgOn, null);
            const imgOn = String(boundImgOn !== null && boundImgOn !== undefined ? boundImgOn : '');
            const boundImgOff = this._menuItemBound(i, 'imgOff', iFlat.imgOff, null);
            const imgOff = String(boundImgOff !== null && boundImgOff !== undefined ? boundImgOff : '');
            const colorizeOn = this._menuItemBound(i, 'colorizeOn', iFlat.colorizeOn, 'bool');
            const colorizeOff = this._menuItemBound(i, 'colorizeOff', iFlat.colorizeOff, 'bool');
            const defaultSrcOn = BaseWidget.inferIconStyleSource(iFlat, MenuWidget.ICON_STYLE_KEYMAP_ON);
            const defaultSrcOff = BaseWidget.inferIconStyleSource(iFlat, MenuWidget.ICON_STYLE_KEYMAP_OFF);
            const boundIconSourceOn = this._menuItemBound(i, 'iconSourceOn', iFlat.iconSourceOn != null && iFlat.iconSourceOn !== '' ? iFlat.iconSourceOn : defaultSrcOn, null);
            const iconSourceOn = String(boundIconSourceOn !== null && boundIconSourceOn !== undefined ? boundIconSourceOn : defaultSrcOn);
            const boundIconSourceOff = this._menuItemBound(i, 'iconSourceOff', iFlat.iconSourceOff != null && iFlat.iconSourceOff !== '' ? iFlat.iconSourceOff : defaultSrcOff, null);
            const iconSourceOff = String(boundIconSourceOff !== null && boundIconSourceOff !== undefined ? boundIconSourceOff : defaultSrcOff);

            let fState = item.state === true;
            if (this.overrides[stateKey] !== undefined) {
                fState = this.overrides[stateKey] === true;
            }
            if (hasStateBinding) {
                const opt = this._optimisticItemStates ? this._optimisticItemStates[i] : undefined;
                fState = opt !== undefined ? opt : this._menuItemBound(i, 'state', fState, 'bool');
            } else if (actionType === 'page' && mode === 'toggle') {
                const targetPage = parseInt(pageTo, 10);
                const currentPage = typeof MASTER_SETTINGS !== 'undefined' ? parseInt(MASTER_SETTINGS.currentPage || 1) : 1;
                fState = (currentPage === targetPage);
            }

            const boundIconColOnOverride = this._menuItemBound(i, 'iconColOnOverride', iFlat.iconColOnOverride, null);
            const boundIconColOffOverride = this._menuItemBound(i, 'iconColOffOverride', iFlat.iconColOffOverride, null);
            const rowAccentOn = (iFlat.iconSlotAccentOn != null && String(iFlat.iconSlotAccentOn).trim() !== '')
                ? String(iFlat.iconSlotAccentOn).trim()
                : null;
            const rowAccentOff = (iFlat.iconSlotAccentOff != null && String(iFlat.iconSlotAccentOff).trim() !== '')
                ? String(iFlat.iconSlotAccentOff).trim()
                : null;
            const widgetAccentOn = (c.iconAccentOn != null && String(c.iconAccentOn).trim() !== '')
                ? String(c.iconAccentOn).trim()
                : String(BaseWidget.themeTokenRef('iconAccent'));
            const widgetAccentOff = (c.iconAccentOff != null && String(c.iconAccentOff).trim() !== '')
                ? String(c.iconAccentOff).trim()
                : String(BaseWidget.themeTokenRef('iconAccent'));
            const boundIconSlotAccentOn = this._menuItemBound(
                i,
                'iconSlotAccentOn',
                rowAccentOn != null ? rowAccentOn : widgetAccentOn,
                null
            );
            const boundIconSlotAccentOff = this._menuItemBound(
                i,
                'iconSlotAccentOff',
                rowAccentOff != null ? rowAccentOff : widgetAccentOff,
                null
            );
            const iconSlotAccentOn = boundIconSlotAccentOn !== null && boundIconSlotAccentOn !== undefined ? String(boundIconSlotAccentOn) : '';
            const iconSlotAccentOff = boundIconSlotAccentOff !== null && boundIconSlotAccentOff !== undefined ? String(boundIconSlotAccentOff) : '';

            this.itemsConfig.push({
                index: i,
                mode,
                label,
                actionType,
                selectionGroup,
                sendOffOnGroupDeselect,
                outputTopic,
                onPayload,
                offPayload,
                pageTo,
                urlTo,
                urlNewTab: urlNewTab === true,
                state: fState,
                iconSourceOn,
                iconSourceOff,
                iconOn,
                iconOff,
                iconWeightOn,
                iconWeightOff,
                iconSlotAccentOn,
                iconSlotAccentOff,
                imgOn,
                imgOff,
                colorizeOn,
                colorizeOff,
                iconColOnOverrideEn: this._menuItemBound(i, 'iconColOnOverrideEn', iFlat.iconColOnOverrideEn, 'bool'),
                iconColOnOverride: String(boundIconColOnOverride !== null && boundIconColOnOverride !== undefined ? boundIconColOnOverride : '@surfaceAlt'),
                iconColOffOverrideEn: this._menuItemBound(i, 'iconColOffOverrideEn', iFlat.iconColOffOverrideEn, 'bool'),
                iconColOffOverride: String(boundIconColOffOverride !== null && boundIconColOffOverride !== undefined ? boundIconColOffOverride : '@text')
            });
        });

        return c;
    }

    hasPageDependentState() {
        const ov = this.overrides || {};
        const items = Array.isArray(ov.menuItems) ? ov.menuItems : (this.itemsConfig || []);
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item) continue;
            const act = item.actionType || 'topic';
            const mode = typeof MenuWidget.normalizeItemMode === 'function'
                ? MenuWidget.normalizeItemMode(item.mode)
                : (item.mode || 'toggle');
            const stBind = (typeof BindingsTree !== 'undefined' && this.bindings)
                ? BindingsTree.getAtPath(this.bindings, MenuWidget.menuItemStateBindingPath(i))
                : undefined;
            const hasStateBinding = !!(stBind && typeof stBind === 'string' && String(stBind).trim());
            if (act === 'page' && mode === 'toggle' && !hasStateBinding) {
                return true;
            }
        }
        return false;
    }

    getSchema() {
        return [
            {
                id: 'menu_behavior', title: 'Menu Behavior', icon: 'ph-list',
                fields: [
                    { key: 'menuLayout', type: 'select', label: 'Layout Direction', options: [{value:'vertical', text:'Vertical'}, {value:'horizontal', text:'Horizontal'}, {value:'grid', text:'Horizontal & Vertical'}], cols: 12 },
                    { key: 'menuStyle', type: 'select', label: 'Menu Slide Style', options: [
                        {value:'static', text:'Static (Always visible)'},
                        {value:'snap', text:'Instant (no slide)'},
                        {value:'dropdown', text:'Dropdown Menu'},
                        {value:'dropup', text:'Dropup Menu'},
                        {value:'slide_left', text:'Slide Left Panel'},
                        {value:'slide_right', text:'Slide Right Panel'}
                    ], cols: 12 },
                    { key: 'menuTriggerTopic', type: 'topic', label: 'Trigger Activation Topic (true = open / false = close)', cols: 12,
                      dependsOn: ['menuStyle'], visibleWhen: (v) => v.menuStyle !== 'static' },
                    { key: 'menuStatusTopic', type: 'topic', label: 'Output Status Topic (published on load and when the menu opens/closes)', cols: 12 },
                    { key: 'menuCloseMethod', type: 'select', label: 'Close Method', options: [
                        {value:'never', text:'Never close automatically'},
                        {value:'toggle', text:'Close after selection except toggle items'},
                        {value:'always', text:'Always automatically close'}
                    ], cols: 12, dependsOn: ['menuStyle'], visibleWhen: (v) => v.menuStyle !== 'static' }
                ]
            },
            {
                id: 'menu_items_group', title: 'Menu Items', icon: 'ph-list-bullets',
                fields: [
                    { key: 'menuItems', type: 'menu_list', label: 'Menu Items', cols: 12 }
                ]
            },
            {
                id: 'menu_audio', title: 'Audio', icon: 'ph-music-notes',
                fields: [{
                    key: 'audio',
                    type: 'audio_trigger_map',
                    cols: 12,
                    triggers: MenuWidget.AUDIO_TRIGGERS,
                    reactiveContent: true,
                    dependsOn: ['menuCloseMethod', 'menuStyle', 'audio']
                }]
            },
            {
                id: 'menu_appear', title: 'Appearance', icon: 'ph-palette',
                fields: [
                    { key: 'menuIconLoc', type: 'select', label: 'Icon Location', options: [
                        { value: 'left', text: 'Left' },
                        { value: 'right', text: 'Right' },
                        { value: 'top', text: 'Top' },
                        { value: 'bottom', text: 'Bottom' }
                    ], cols: 6 },
                    {
                        key: 'menuLabelHint', type: 'select', label: 'Label Hint', cols: 6,
                        defaultKey: 'menuDefaultLabelHint',
                        options: MenuWidget.labelHintOptions,
                        hint: 'Shows the full menu item label in a browser tooltip on hover. When Label Is Truncated applies only when the text is cut off with an ellipsis or clipped by the layout.'
                    },
                    { key: 'menuItemWidth', type: 'number', label: 'Menu Item Width (px, 0 = Auto)', cols: 3, min: 0, default: 0 },
                    { key: 'menuItemHeight', type: 'number', label: 'Menu Item Height (px, 0 = Auto)', cols: 3, min: 0, default: 0 },
                    { key: 'itemSpacing', type: 'number', label: 'Item Spacing (px)', cols: 3, defaultKey: 'menuItemSpacing' },
                    { key: 'itemCornerRadius', type: 'number', label: 'Item Corner Radius', cols: 3, defaultKey: 'menuItemRadius' },
                    { key: 'itemBgOn', type: 'color', label: 'Item Background (On)', cols: 3, defaultKey: 'menuItemBgOn' },
                    { key: 'itemBgOnOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 3, defaultKey: 'menuItemBgOnOpacity' },
                    { key: 'itemBgOff', type: 'color', label: 'Item Background (Off)', cols: 3, defaultKey: 'menuItemBgOff' },
                    { key: 'itemBgOffOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 3, defaultKey: 'menuItemBgOffOpacity' },
                    { key: 'itemBgHover', type: 'color', label: 'Item Background (Hover)', cols: 4, defaultKey: 'menuItemBgHover' },
                    { key: 'itemBgHoverOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 4, defaultKey: 'menuItemBgHoverOpacity' },
                    { key: 'itemBlur', type: 'number', min: 0, label: 'Background Blur', cols: 4, defaultKey: 'menuItemBlur' },
                    { key: 'itemOutlineWidth', type: 'number', min: 0, label: 'Item Outline Width', cols: 4, defaultKey: 'menuItemOutlineWidth', gridColStart: 1 },
                    {
                        key: 'itemOutlineColor', type: 'color', label: 'Item Outline Color', cols: 4, defaultKey: 'menuItemOutlineColor',
                        dependsOn: ['itemOutlineWidth', 'menuItemOutlineWidth'],
                        visibleWhen: (values, isGlobal) => BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'itemOutlineWidth', 'menuItemOutlineWidth')
                    },
                    {
                        key: 'itemOutlineOpacity', type: 'number', min: 0, max: 100, label: 'Item Outline Opacity', cols: 4, defaultKey: 'menuItemOutlineOpacity',
                        dependsOn: ['itemOutlineWidth', 'menuItemOutlineWidth'],
                        visibleWhen: (values, isGlobal) => BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'itemOutlineWidth', 'menuItemOutlineWidth')
                    },
                    { key: 'itemInnerGlow', type: 'number', min: 0, label: 'Item Inner Glow', cols: 4, defaultKey: 'menuItemInnerGlow', gridColStart: 1 },
                    {
                        key: 'itemInnerGlowColor', type: 'color', label: 'Item Inner Glow Color', cols: 4, defaultKey: 'menuItemInnerGlowColor',
                        dependsOn: ['itemInnerGlow', 'menuItemInnerGlow'],
                        visibleWhen: (values) => MenuWidget.itemInnerGlowDetailsVisible(values, false)
                    },
                    {
                        key: 'itemInnerGlowOpacity', type: 'number', min: 0, max: 100, label: 'Item Inner Glow Opacity', cols: 4, defaultKey: 'menuItemInnerGlowOpacity',
                        dependsOn: ['itemInnerGlow', 'menuItemInnerGlow'],
                        visibleWhen: (values) => MenuWidget.itemInnerGlowDetailsVisible(values, false)
                    },
                    { key: 'iconColOn', type: 'color', label: 'Icon Color (On)', cols: 3, defaultKey: 'menuIconColOn' },
                    { key: 'iconColOff', type: 'color', label: 'Icon Color (Off)', cols: 3, defaultKey: 'menuIconColOff' },
                    { key: 'iconAccentOn', type: 'color', label: 'Icon Accent (On)', cols: 3, defaultKey: 'menuIconAccentOn' },
                    { key: 'iconAccentOff', type: 'color', label: 'Icon Accent (Off)', cols: 3, defaultKey: 'menuIconAccentOff' },
                    { key: 'iconSize', type: 'number', label: 'Icon Base Size', cols: 12, defaultKey: 'menuIconSize' },
                    { key: 'menuSeparatorShowLine', type: 'checkbox', label: 'Line in separator items', cols: 4 },
                    { key: 'menuSeparatorLineColor', type: 'color', label: 'Separator line color', cols: 4, defaultKey: 'menuSpacerColor' },
                    { key: 'menuSeparatorGap', type: 'number', label: 'Separator gap (px)', cols: 4, defaultKey: 'menuSpacerAmount' },
                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }
                ]
            },
            {
                id: 'menu_text', title: 'Text & Typography', icon: 'ph-text-t',
                fields: [
                    { key: 'label', type: 'text', label: 'Widget Label', cols: 12 },
                    BaseWidget.getWidgetLabelTypographySchema('menuLabel', 'groupLabel', { exclude: [] }),
                    BaseWidget.getTypographySchema('menuItem', 'Menu Item', {
                        dualColor: true,
                        dualColorOnDefaultKey: 'menuDefaultItemCol',
                        dualColorOffDefaultKey: 'menuDefaultItemColOff',
                        nestedTypography: { root: 'typography', role: 'menuItem' },
                        dualColorOnLabel: 'Font Color (On)',
                        dualColorOffLabel: 'Font Color (Off)',
                        alignLabel: 'Menu Item Alignment',
                        caseLabel: 'Menu Item Case',
                        boldLabel: 'Menu Item Bold',
                        italicLabel: 'Menu Item Italic',
                        offsetXLabel: 'Menu Item Offset X',
                        offsetYLabel: 'Menu Item Offset Y',
                        fontDefaultKey: 'menuDefaultItemFont',
                        fontDefaultKeyFallback: 'fontFamily',
                        fontSizeDefaultKey: 'menuDefaultItemFs',
                        alignDefaultKey: 'menuDefaultItemAlign',
                        caseDefaultKey: 'menuDefaultItemCase',
                        boldDefaultKey: 'menuDefaultItemBold',
                        italicDefaultKey: 'menuDefaultItemItalic',
                        opacityDefaultKey: 'menuDefaultItemOpacity',
                        offXDefaultKey: 'menuDefaultItemOffX',
                        offYDefaultKey: 'menuDefaultItemOffY'
                    })
                ]
            }
        ];
    }

    _parsePayloadValue(rawValue) {
        if (rawValue === 'true') return true;
        if (rawValue === 'false') return false;
        const numberValue = parseFloat(rawValue);
        if (!isNaN(numberValue) && String(numberValue) === rawValue) return numberValue;
        return rawValue;
    }

    _itemHasConfiguredIcon(itemConf) {
        if (!itemConf || itemConf.mode === 'separator') return false;
        const nz = (s) => String(s || '').trim();
        const onKm = MenuWidget.ICON_STYLE_KEYMAP_ON;
        const offKm = MenuWidget.ICON_STYLE_KEYMAP_OFF;
        const onSrc = BaseWidget.inferIconStyleSource(itemConf, onKm);
        const offSrc = BaseWidget.inferIconStyleSource(itemConf, offKm);
        const hasFaviconUrl = itemConf.actionType === 'url' && nz(itemConf.urlTo) && String(itemConf.urlTo).trim() !== 'https://';
        const faviconOnHas = onSrc === 'favicon' && hasFaviconUrl;
        const faviconOffHas = offSrc === 'favicon' && hasFaviconUrl;
        const onHas = (onSrc === 'custom' && nz(itemConf.imgOn)) || (onSrc === 'phosphor' && nz(itemConf.iconOn));
        const offHas = (offSrc === 'custom' && nz(itemConf.imgOff)) || (offSrc === 'phosphor' && nz(itemConf.iconOff));
        return onHas || offHas || faviconOnHas || faviconOffHas;
    }

    _sendTopicPayload(itemConfig, isActive, requireConfiguredOutputTopic = false) {
        const configuredOutputTopic = String(itemConfig.outputTopic || '').trim();
        const targetTopic = configuredOutputTopic || (requireConfiguredOutputTopic ? "" : (this.config.name || this.id));
        if (!targetTopic) return;
        const payloadValue = isActive ? this._parsePayloadValue(itemConfig.onPayload) : this._parsePayloadValue(itemConfig.offPayload);
        Dashboard.send(targetTopic, payloadValue);
    }

    _applySelectionGroupExclusion(itemConfig, silent = false) {
        if (itemConfig.mode !== 'toggle') return;
        if (typeof SwitchWidget === 'undefined'
            || !SwitchWidget.isGroupExclusionAvailable
            || !SwitchWidget.isGroupExclusionAvailable(itemConfig)) return;
        const implicitPage = SwitchWidget.usesImplicitPageNavExclusion(itemConfig);
        const groupKey = String(itemConfig.selectionGroup || '').trim();
        if (!implicitPage && !groupKey) return;

        const activePage = Math.max(1, parseInt(String(MASTER_SETTINGS.currentPage || 1), 10) || 1);
        Object.values(Dashboard.widgets || {}).forEach((peer) => {
            if (!peer) return;

            if (peer instanceof SwitchWidget) {
                const peerConfig = peer.config;
                const peerPageRaw = String(peerConfig.page != null ? peerConfig.page : '1');
                const peerPageSpec = typeof Dashboard.resolveEffectivePageForWidgetId === 'function'
                    ? Dashboard.resolveEffectivePageForWidgetId(peer.id, peerPageRaw)
                    : peerPageRaw;
                if (typeof WidgetPageSpec !== 'undefined') {
                    if (!WidgetPageSpec.coversPage(peerPageSpec, activePage)) return;
                } else if (!peerPageSpec.split(',').map(p => p.trim()).includes(String(activePage))) {
                    return;
                }
                if (!SwitchWidget.exclusionPeersMatch(itemConfig, peerConfig)) return;
                if (!peerConfig.state) return;
                peer.lastInteraction = Date.now();
                peer._setOptimisticState(false);
                peer.update({ state: false });
                if (!silent && peerConfig.sendOffOnGroupDeselect === true) peer._sendTopicPayload(false, true);
            } else if (peer instanceof MenuWidget) {
                const peerPageRaw = String(peer.config.page != null ? peer.config.page : '1');
                const peerPageSpec = typeof Dashboard.resolveEffectivePageForWidgetId === 'function'
                    ? Dashboard.resolveEffectivePageForWidgetId(peer.id, peerPageRaw)
                    : peerPageRaw;
                const onPage = typeof WidgetPageSpec !== 'undefined'
                    ? WidgetPageSpec.coversPage(peerPageSpec, activePage)
                    : peerPageSpec.split(',').map(p => p.trim()).includes(String(activePage));
                if (onPage) {
                    peer.itemsConfig.forEach((pItem) => {
                        if (peer === this && pItem.index === itemConfig.index) return;
                        if (!SwitchWidget.exclusionPeersMatch(itemConfig, pItem)) return;
                        if (!pItem.state) return;
                        peer.lastInteractions[pItem.index] = Date.now();
                        const pKey = `item_${pItem.index}_state`;
                        peer._setOptimisticItemState(pItem.index, false);
                        peer.update({ [pKey]: false });
                        if (!silent && pItem.sendOffOnGroupDeselect === true) peer._sendTopicPayload(pItem, false, true);
                    });
                }
            }
        });
    }

    _configuredAudioUrl(config, key) {
        const audio = config && config.audio;
        if (!audio || !key) return '';
        const url = audio[key];
        if (url == null) return '';
        return String(url).trim();
    }

    /** Plays a widget clip when one is set. Returns true when a clip is configured. */
    _playConfiguredAudio(config, key) {
        if (!this._configuredAudioUrl(config, key) || typeof DashboardAudio === 'undefined') return false;
        DashboardAudio.playFrom(config.audio, key);
        return true;
    }

    closeMenu(opts) {
        if (this.isOpen) {
            this.isOpen = false;
            this._animateNextOpen = false;
            this._renderSpecific();
            this._emitMenuStatusPayload(false);
            const suppressCloseAudio = opts && opts.suppressCloseAudio === true;
            if (!suppressCloseAudio && typeof DashboardAudio !== 'undefined') {
                DashboardAudio.playFrom(this.config.audio, 'close');
            }
        }
    }

    /** Output Status Topic: update liveData + bound widgets; publish only when the data driver is connected. */
    _emitMenuStatusPayload(payload) {
        const topic = String(this.config.menuStatusTopic || '').trim();
        if (!topic) return;
        Dashboard.applyLocalTopicPayload(topic, payload);
        if (Dashboard._dataDriverConnected) {
            Dashboard.send(topic, payload);
        }
    }

    executeAction(itemConfig, isActive, soundKey) {
        if (Dashboard.isEditMode) return;
        const c = this.config;
        const configuredOutputTopic = String(itemConfig.outputTopic || '').trim();

        if (itemConfig.actionType === 'page') {
            if (isActive || itemConfig.mode === 'toggle') {
                if (configuredOutputTopic) this._sendTopicPayload(itemConfig, isActive, true);
                Dashboard.updateGlobal({ currentPage: parseInt(itemConfig.pageTo) });
            }
        } else if (itemConfig.actionType === 'url') {
            if (isActive || itemConfig.mode === 'toggle') {
                if (configuredOutputTopic) this._sendTopicPayload(itemConfig, isActive, true);
                if (typeof UrlNavigation !== 'undefined' && typeof UrlNavigation.openUrl === 'function') {
                    UrlNavigation.openUrl(itemConfig.urlTo, itemConfig.urlNewTab);
                } else {
                    window.open(itemConfig.urlTo, itemConfig.urlNewTab === true ? '_blank' : '_self');
                }
            }
        } else if (itemConfig.actionType === 'topic') {
            this._sendTopicPayload(itemConfig, isActive, false);
        }

        const playedItemSound = soundKey ? this._playConfiguredAudio(c, soundKey) : false;
        const suppressCloseAudio = playedItemSound === true;
        if (c.menuCloseMethod === 'always') {
            this.closeMenu({ suppressCloseAudio: suppressCloseAudio });
        } else if (c.menuCloseMethod === 'toggle') {
            if (itemConfig.mode !== 'toggle') this.closeMenu({ suppressCloseAudio: suppressCloseAudio });
        }
    }

    toggleItem(itemIdx) {
        if (this.config.deactivated) return;
        const itemConfig = this.itemsConfig[itemIdx];
        if (itemConfig.mode === 'push' || itemConfig.mode === 'separator') return;

        const stRoot = typeof BindingsTree !== 'undefined'
            ? BindingsTree.getAtPath(this.bindings, MenuWidget.menuItemStateBindingPath(itemIdx))
            : undefined;
        const hasStateBinding = Boolean(stRoot && typeof stRoot === 'string' && String(stRoot).trim());
        if (itemConfig.actionType === 'page' && !hasStateBinding) {
            const targetPage = parseInt(itemConfig.pageTo || 1, 10);
            const cur = typeof MASTER_SETTINGS !== 'undefined' ? parseInt(MASTER_SETTINGS.currentPage || 1, 10) : 1;
            if (cur === targetPage) return;
        }

        const selGroupId = String(itemConfig.selectionGroup || '').trim();
        if (selGroupId && itemConfig.state === true
            && typeof Dashboard !== 'undefined' && !Dashboard.getSelectionGroupAllowEmpty(selGroupId)) {
            return;
        }

        const newState = !itemConfig.state;
        this.lastInteractions[itemIdx] = Date.now();
        const stateKey = `item_${itemIdx}_state`;
        this._setOptimisticItemState(itemIdx, newState);
        // executeAction first: loopback updates liveData before this.update() calls render().
        this.executeAction(itemConfig, newState, newState ? 'toggleOn' : 'toggleOff');
        if (newState === true) this._applySelectionGroupExclusion(itemConfig, false);
        this.update({ [stateKey]: newState });
    }

    pressItem(itemIdx, isDown) {
        if (this.config.deactivated) return;
        const itemConfig = this.itemsConfig[itemIdx];
        if (itemConfig.mode !== 'push') return;

        this.lastInteractions[itemIdx] = Date.now();
        const stateKey = `item_${itemIdx}_state`;
        this._setOptimisticItemState(itemIdx, isDown);
        // executeAction before update() so loopback populates liveData before render().
        if (isDown) this.executeAction(itemConfig, true, 'select');
        this.update({ [stateKey]: isDown });
    }

    publishOutputStatusTopic() {
        if (typeof Dashboard !== 'undefined' && Dashboard.isEditMode) return;
        const c = this.config;
        const payload = c.menuStyle === 'static' ? true : !!this.isOpen;
        this._emitMenuStatusPayload(payload);
    }

    onIncomingData(topic, payload, count) {
        const c = this.config;
        let visualRefreshNeeded = false;
        if (c.menuStyle !== 'static' && this.bindings['__trigger'] && topic === this.bindings['__trigger']) {
            const val = String(payload).toLowerCase().trim();
            const shouldOpen = (val === 'true' || val === '1' || val === 'on');
            if (shouldOpen !== this.isOpen) {
                this.isOpen = shouldOpen;
                // Animate only when transitioning closed -> open in viewer mode.
                this._animateNextOpen = shouldOpen && !Dashboard.isEditMode;
                this._emitMenuStatusPayload(this.isOpen ? true : false);
                if (typeof DashboardAudio !== 'undefined') {
                    DashboardAudio.playFrom(this.config.audio, shouldOpen ? 'open' : 'close');
                }
                visualRefreshNeeded = true;
            }
        }

        if (this.itemsConfig && Array.isArray(this.itemsConfig)) {
            this.itemsConfig.forEach((item, i) => {
                const path = MenuWidget.menuItemBindingPath(i, 'state');
                const stTopic = typeof BindingsTree !== 'undefined' ? BindingsTree.getAtPath(this.bindings, path) : null;
                if (stTopic && topic === stTopic && this._optimisticItemStates) {
                    delete this._optimisticItemStates[i];
                }
                if (item.mode !== 'toggle') return;
                if (stTopic && topic === stTopic) {
                    let v = payload;
                    if (typeof v !== 'boolean') {
                        const s = String(v).toLowerCase().trim();
                        v = (v === true || s === 'true' || s === '1' || s === 'on');
                    }
                    if (v === true) {
                        this._applySelectionGroupExclusion(item, true);
                    }
                    visualRefreshNeeded = true;
                }
            });
        }

        if (visualRefreshNeeded) return true;
        return typeof BindingsTree !== 'undefined' && BindingsTree.widgetWantsTopic(this, topic);
    }

    _buildBaseDOM() {
        const b = super._buildBaseDOM();

        // Required for click events to reach menu items in view mode.
        b.container.classList.add('interactive');

        const layoutWrap = document.createElement('div');
        layoutWrap.className = 'menu-layout';
        layoutWrap.style.display = 'flex';

        b.innerContent.style.display = 'flex';
        b.innerContent.style.flexDirection = 'column';

        const groupTitleEl = document.createElement('div');
        BaseWidget.applyWidgetLabelElementChrome(groupTitleEl);
        groupTitleEl.style.display = 'none';

        b.innerContent.appendChild(groupTitleEl);
        b.innerContent.appendChild(layoutWrap);
        this.e = { layoutWrap, groupTitleEl };
        this.itemElements = [];

        return b;
    }

    getAutoSizeFlags() {
        const c = this.config || {};
        return { wAuto: c.menuWAuto === true, hAuto: c.menuHAuto === true };
    }

    measureFittedContentSize() {
        const e = this.e;
        const container = this.elements && this.elements.container;
        if (!e || !e.layoutWrap || !container) return super.measureFittedContentSize();
        const lw = e.layoutWrap;
        const title = e.groupTitleEl;
        const titleH = (title && title.style.display !== 'none')
            ? Math.max(title.offsetHeight || 0, title.scrollHeight || 0) : 0;
        const contentW = Math.max(lw.offsetWidth || 0, lw.scrollWidth || 0);
        const contentH = Math.max(lw.offsetHeight || 0, lw.scrollHeight || 0) + titleH;
        if (contentW < 1 && contentH < 1) return super.measureFittedContentSize();
        const cs = window.getComputedStyle(container);
        const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
        const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
        const borderX = (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
        const borderY = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
        return {
            width: Math.max(1, Math.round(contentW + padX + borderX)),
            height: Math.max(1, Math.round(contentH + padY + borderY))
        };
    }

    render() {
        super.render();
        if (!this.elements || !this.elements.container || !this.config) return;
        const c = this.config;

        // Fit-to-content uses fixed-layout auto sizing; allowed in Fixed Resolution,
        // open-group authoring, and Responsive Columns when Scale Mode is Rescale.
        if (c.menuWAuto && BaseWidget.allowFixedLayoutAutoSize(this)) {
            this.elements.container.style.width = 'fit-content';
            this.elements.wrapper.style.width = 'fit-content';
            this.elements.wrapper.style.minWidth = 'fit-content';
        }
        if (c.menuHAuto && BaseWidget.allowFixedLayoutAutoSize(this)) {
            this.elements.container.style.height = 'fit-content';
            this.elements.wrapper.style.height = 'fit-content';
            this.elements.wrapper.style.minHeight = 'fit-content';
        }
        this.scheduleFittedAutoSizeCommit();
    }

    updatePositionSize() {
        super.updatePositionSize();
        if (!this.elements || !this.elements.wrapper || !this.config) return;

        const c = this.config;
        if (c.menuWAuto && BaseWidget.allowFixedLayoutAutoSize(this)) {
            this.elements.container.style.width = 'fit-content';
            this.elements.wrapper.style.width = 'fit-content';
            this.elements.wrapper.style.minWidth = 'fit-content';
        }
        if (c.menuHAuto && BaseWidget.allowFixedLayoutAutoSize(this)) {
            this.elements.container.style.height = 'fit-content';
            this.elements.wrapper.style.height = 'fit-content';
            this.elements.wrapper.style.minHeight = 'fit-content';
        }
        this.scheduleFittedAutoSizeCommit();
    }

    static collapsedClipForStyle(style) {
        if (style === 'dropup') return 'inset(100% 0 0 0)';
        if (style === 'slide_left') return 'inset(0 0 0 100%)';
        if (style === 'slide_right') return 'inset(0 100% 0 0)';
        return 'inset(0 0 100% 0)';
    }

    /**
     * Edit Mode does not re-render widgets. Panel clip, opacity, and item opacity
     * are applied here so a menu painted closed in the viewer becomes visible
     * when editing starts, and collapses again when editing stops.
     */
    _applyMenuPanelChrome() {
        const shell = this.elements;
        if (!shell || !shell.container) return;
        const c = this.config;
        const editing = typeof Dashboard !== 'undefined'
            && !!Dashboard.isEditMode
            && !Dashboard._holdLivePreviewActive;
        const style = c.menuStyle || 'static';
        const open = !!this.isOpen;
        const show = style === 'static' || open || editing;
        const container = shell.container;

        container.style.transition = 'none';
        if (style !== 'static' && style !== 'snap' && !show) {
            const collapsed = MenuWidget.collapsedClipForStyle(style);
            container.style.clipPath = collapsed;
            container.style.WebkitClipPath = collapsed;
            container.style.opacity = '0';
        } else {
            container.style.clipPath = 'none';
            container.style.WebkitClipPath = 'none';
            container.style.opacity = (style === 'snap' && !show) ? '0' : '1';
        }

        const items = this.itemElements;
        if (items && items.length && style !== 'static') {
            for (let i = 0; i < items.length; i++) {
                const wrap = items[i];
                if (!wrap || !wrap.style) continue;
                wrap.style.transition = 'background-color 0.2s';
                if (style === 'snap') {
                    wrap.style.transform = 'translate(0px, 0px)';
                    if (!open && !editing) wrap.style.opacity = '0';
                    else if (editing && !open) wrap.style.opacity = '0.5';
                    else wrap.style.opacity = '1';
                } else if (show) {
                    wrap.style.opacity = '1';
                    wrap.style.transform = 'translate(0px, 0px)';
                } else {
                    wrap.style.opacity = '0';
                }
            }
        }

        this._applyWrapperPointerPolicy(show);
    }

    _syncEditModeVisuals() {
        BaseWidget.prototype._syncEditModeVisuals.call(this);
        this._applyMenuPanelChrome();
    }

    _buildMenuRenderSignature(c) {
        if (this._hasAnyPayloadFormula()) return null;
        const parts = [
            this._renderInputsEpochSig(),
            this.isOpen ? '1' : '0',
            c.label || '',
            c.deactivated ? '1' : '0',
            c.menuStyle || '',
            c.menuLayout || '',
            BaseWidget.getThemeColorsSignature()
        ];
        const items = this.itemsConfig || [];
        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            parts.push(
                it.mode + '\x02' + it.label + '\x02' + (it.state ? '1' : '0') + '\x02'
                + it.actionType + '\x02' + it.pageTo + '\x02' + it.urlTo + '\x02'
                + it.iconSourceOn + '\x02' + it.iconSourceOff + '\x02'
                + it.iconOn + '\x02' + it.iconOff + '\x02'
                + it.iconWeightOn + '\x02' + it.iconWeightOff + '\x02'
                + it.iconSlotAccentOn + '\x02' + it.iconSlotAccentOff + '\x02'
                + it.imgOn + '\x02' + it.imgOff + '\x02'
                + (it.colorizeOn ? '1' : '0') + '\x02' + (it.colorizeOff ? '1' : '0') + '\x02'
                + (it.iconColOnOverrideEn ? it.iconColOnOverride : '') + '\x02'
                + (it.iconColOffOverrideEn ? it.iconColOffOverride : '')
            );
        }
        return parts.join('\x01');
    }

    _renderSpecific() {
        const c = this.config;
        const e = this.e;

        const inEdit = typeof Dashboard !== 'undefined' && Dashboard.isEditMode;
        const menuSig = (!inEdit && !this._animateNextOpen) ? this._buildMenuRenderSignature(c) : null;
        if (menuSig !== null && menuSig === this._lastMenuRenderSig && e.layoutWrap.childElementCount > 0) {
            return;
        }
        this._lastMenuRenderSig = menuSig;

        if (typeof LabelHint !== 'undefined' && typeof LabelHint.clearSubtree === 'function') {
            LabelHint.clearSubtree(e.layoutWrap);
        }
        e.layoutWrap.innerHTML = '';
        this.itemElements = [];

        if (e.groupTitleEl) {
            const titleText = c.label || '';
            e.groupTitleEl.textContent = titleText;
            e.groupTitleEl.style.display = titleText ? 'block' : 'none';
            if (titleText) {
                this.applyTypographyToElement(e.groupTitleEl, 'menuLabel', c, {});
                if (c.deactivated) {
                    const accentColor = BaseWidget.getDeactivatedColorAccent(c);
                    e.groupTitleEl.style.color = accentColor;
                }
            }
        }

        const isGridWrap = c.menuLayout === 'grid';
        const isHorizontalLike = c.menuLayout === 'horizontal' || isGridWrap;
        const hasFixedItemWidth = c.menuItemWidth != null && Number(c.menuItemWidth) > 0;
        const hasFixedItemHeight = c.menuItemHeight != null && Number(c.menuItemHeight) > 0;
        const noFlexGap = document && document.documentElement &&
            document.documentElement.classList &&
            document.documentElement.classList.contains('no-flex-gap');
        const spacing = Number(c.itemSpacing) || 0;
        // Safari 12 supports CSS Grid gap, not flex gap. Fixed-width grid menus keep
        // Item Spacing by switching to grid on those engines (demo page 4).
        const useGridGapFallback = noFlexGap && isGridWrap && hasFixedItemWidth;

        e.layoutWrap.style.marginTop = '';
        e.layoutWrap.style.marginLeft = '';
        e.layoutWrap.style.gridTemplateColumns = '';
        e.layoutWrap.style.gridGap = '';
        e.layoutWrap.style.justifyContent = '';

        if (useGridGapFallback) {
            e.layoutWrap.style.display = 'grid';
            e.layoutWrap.style.flexDirection = '';
            e.layoutWrap.style.flexWrap = '';
            e.layoutWrap.style.width = c.menuWAuto ? 'fit-content' : '100%';
            e.layoutWrap.style.height = c.menuHAuto ? 'fit-content' : '100%';
            e.layoutWrap.style.gridTemplateColumns = `repeat(auto-fill, ${Number(c.menuItemWidth)}px)`;
            e.layoutWrap.style.gap = `${spacing}px`;
            e.layoutWrap.style.gridGap = `${spacing}px`;
            e.layoutWrap.style.alignItems = 'flex-start';
            e.layoutWrap.style.alignContent = 'flex-start';
            e.layoutWrap.style.justifyContent = 'flex-start';
        } else {
            e.layoutWrap.style.display = 'flex';
            e.layoutWrap.style.width = c.menuWAuto ? 'fit-content' : '100%';
            e.layoutWrap.style.height = c.menuHAuto ? 'fit-content' : '100%';
            e.layoutWrap.style.flexDirection = isHorizontalLike ? 'row' : 'column';
            e.layoutWrap.style.flexWrap = isGridWrap ? 'wrap' : 'nowrap';
            if (isGridWrap) {
                e.layoutWrap.style.alignItems = 'flex-start';
                e.layoutWrap.style.alignContent = 'flex-start';
            } else if (c.menuLayout === 'horizontal') {
                e.layoutWrap.style.alignItems = 'stretch';
                e.layoutWrap.style.alignContent = '';
            } else {
                e.layoutWrap.style.alignItems = '';
                e.layoutWrap.style.alignContent = '';
            }
            e.layoutWrap.style.gap = noFlexGap ? '' : `${spacing}px`;
            if (noFlexGap && isGridWrap && spacing > 0) {
                e.layoutWrap.style.marginTop = `-${spacing}px`;
                e.layoutWrap.style.marginLeft = `-${spacing}px`;
                if (!c.menuWAuto) {
                    e.layoutWrap.style.width = `calc(100% + ${spacing}px)`;
                }
            }
        }

        const usesSlideMotion = c.menuStyle !== 'static' && c.menuStyle !== 'snap';
        const shouldAnimateIn = usesSlideMotion && (this._animateNextOpen || Dashboard.isEditMode);

        // --- Container clip-path expand animation ---
        // Applied to elements.container so the resize handles on elements.wrapper are never clipped.
        // Hit testing goes through _applyWrapperPointerPolicy so a closed menu's view-mode
        // pass-through cannot stick as an inline style after Edit Mode is turned back on.
        let acceptHitsWhenNotEditing = true;
        if (c.menuStyle === 'snap') {
            this.elements.container.style.transition = 'none';
            this.elements.container.style.clipPath = 'none';
            this.elements.container.style.WebkitClipPath = 'none';
            const showPanel = this.isOpen || Dashboard.isEditMode;
            if (showPanel) {
                this.elements.container.style.opacity = '1';
            } else {
                this.elements.container.style.opacity = '0';
            }
            acceptHitsWhenNotEditing = !!showPanel;
        } else if (c.menuStyle !== 'static') {
            // `inset(0)` clips box-shadow (glow) on the same element; `none` matches edit mode and keeps glow visible when open.
            let expandedClip = 'none';
            let collapsedClip = 'inset(0 0 100% 0)';
            switch (c.menuStyle) {
                case 'dropdown':    collapsedClip = 'inset(0 0 100% 0)'; break;
                case 'dropup':      collapsedClip = 'inset(100% 0 0 0)'; break;
                case 'slide_left':  collapsedClip = 'inset(0 0 0 100%)'; break;
                case 'slide_right': collapsedClip = 'inset(0 100% 0 0)'; break;
            }

            if (Dashboard.isEditMode || shouldAnimateIn) {
                // Force it to start collapsed so it visually animates open,
                // but use 'none' as the final state in edit mode so it doesn't clip the bounding box.
                this.elements.container.style.transition = 'none';
                this.elements.container.style.clipPath = collapsedClip;
                this.elements.container.style.WebkitClipPath = collapsedClip;
                this.elements.container.style.opacity = '0';
                
                // Force a synchronous layout calculation so the browser actually paints the collapsed state
                void this.elements.container.offsetHeight;
                
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this.elements.container.style.transition = 'clip-path 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease';
                        this.elements.container.style.clipPath = expandedClip;
                        this.elements.container.style.WebkitClipPath = expandedClip;
                        this.elements.container.style.opacity = '1';
                    });
                });
                acceptHitsWhenNotEditing = true;
            } else if (this.isOpen) {
                this.elements.container.style.clipPath = expandedClip;
                this.elements.container.style.WebkitClipPath = expandedClip;
                this.elements.container.style.opacity = '1';
                acceptHitsWhenNotEditing = true;
            } else {
                this.elements.container.style.clipPath = collapsedClip;
                this.elements.container.style.WebkitClipPath = collapsedClip;
                this.elements.container.style.opacity = '0';
                acceptHitsWhenNotEditing = false;
            }
        } else {
            this.elements.container.style.clipPath = 'none';
            this.elements.container.style.WebkitClipPath = 'none';
            this.elements.container.style.opacity = '1';
            acceptHitsWhenNotEditing = true;
        }
        this._applyWrapperPointerPolicy(acceptHitsWhenNotEditing);

        // Stagger direction mirrors the expanding edge.
        // Vertical: dropdown = top-first (no reverse), dropup = bottom-first (reverse).
        // Horizontal: slide_left = right-first (reverse), slide_right = left-first (no reverse).
        const reverseStagger = isHorizontalLike
            ? (c.menuStyle === 'slide_left')
            : (c.menuStyle === 'dropup');

        const isVerticalMenu = !isHorizontalLike;
        let anyItemHasConfiguredIcon = false;
        if (isVerticalMenu) {
            for (let i = 0; i < this.itemsConfig.length; i++) {
                if (this._itemHasConfiguredIcon(this.itemsConfig[i])) {
                    anyItemHasConfiguredIcon = true;
                    break;
                }
            }
        }
        const itemTextAlign = String(c.menuItemAlign || MASTER_SETTINGS.defaultTextAlign || 'left').toLowerCase();
        const bgOnResolved = MenuWidget.resolveItemBackgroundColor(c.itemBgOn, c.itemBgOnOpacity);
        const bgOffResolved = MenuWidget.resolveItemBackgroundColor(c.itemBgOff, c.itemBgOffOpacity);
        const bgHoverResolved = MenuWidget.resolveItemBackgroundColor(c.itemBgHover, c.itemBgHoverOpacity);
        // Item surface chrome, computed once per render: outline, inner glow, and
        // blur (blur only frosts when at least one item background is translucent).
        const itemOutlineCss = c.itemOutlineWidth > 0
            ? (c.itemOutlineWidth + 'px solid ' + BaseWidget.colorAtOpacity(c.itemOutlineColor, c.itemOutlineOpacity))
            : '';
        const itemInnerGlowCss = BaseWidget.elementInnerGlowShadow(c.itemInnerGlow, c.itemInnerGlowColor, c.itemInnerGlowOpacity);
        const itemBgTranslucent = Number(c.itemBgOnOpacity) < 100 || Number(c.itemBgOffOpacity) < 100 || Number(c.itemBgHoverOpacity) < 100;
        const itemBlurPx = itemBgTranslucent ? c.itemBlur : 0;
        const iconLoc = c.menuIconLoc;
        const iconRowLayout = iconLoc === 'left' || iconLoc === 'right';
        const iconOnLeft = iconLoc === 'left';
        const iconTextOppositeSides = iconRowLayout
            && ((iconOnLeft && itemTextAlign === 'right') || (!iconOnLeft && itemTextAlign === 'left'));
        const useGhostIconColumn = isVerticalMenu && anyItemHasConfiguredIcon && !iconTextOppositeSides;

        const applyItemSpacingFallback = (el) => {
            if (!noFlexGap || !(spacing > 0) || useGridGapFallback) return;
            if (isGridWrap) {
                el.style.marginTop = `${spacing}px`;
                el.style.marginLeft = `${spacing}px`;
                return;
            }
            if (e.layoutWrap.childElementCount === 0) return;
            if (c.menuLayout === 'horizontal') el.style.marginLeft = `${spacing}px`;
            else el.style.marginTop = `${spacing}px`;
        };

        const nonSeparatorCount = this.itemsConfig.filter(ic => ic.mode !== 'separator').length;
        let nonSeparatorRenderedCount = 0;

        this.itemsConfig.forEach((itemConf) => {
            const wrap = document.createElement('div');

            if (itemConf.mode === 'separator') {
                wrap.className = 'flex items-center justify-center flex-shrink-0';
                const amt = c.menuSeparatorGap;
                const isHorizontalSeparator = c.menuLayout === 'horizontal';
                if (isHorizontalSeparator) {
                    wrap.style.width = `${amt}px`;
                    wrap.style.minWidth = `${amt}px`;
                    wrap.style.alignSelf = 'stretch';
                    wrap.style.height = '';
                    wrap.style.minHeight = '0';
                    if (hasFixedItemHeight) {
                        wrap.style.minHeight = `${c.menuItemHeight}px`;
                    }
                } else {
                    wrap.style.height = `${amt}px`;
                    wrap.style.width = '100%';
                }
                if (isGridWrap) {
                    wrap.style.flexBasis = '100%';
                    wrap.style.maxWidth = '100%';
                    if (useGridGapFallback) wrap.style.gridColumn = '1 / -1';
                }
                if (c.menuSeparatorLineVisible === true) {
                    const line = document.createElement('div');
                    line.style.backgroundColor = BaseWidget.resolveCssColor(c.menuSeparatorLineColor);
                    line.style.flexShrink = '0';
                    if (isHorizontalSeparator) {
                        line.style.width = '1px';
                        line.style.height = '80%';
                        line.style.minHeight = '1px';
                    } else {
                        line.style.width = '80%';
                        line.style.height = '1px';
                        line.style.minWidth = '1px';
                    }
                    wrap.appendChild(line);
                }
                applyItemSpacingFallback(wrap);
                e.layoutWrap.appendChild(wrap);
                return;
            }

            wrap.className = noFlexGap
                ? 'menu-item flex items-center relative select-none cursor-pointer box-border p-2'
                : 'menu-item flex items-center relative select-none cursor-pointer box-border p-2 gap-2';
            wrap.style.borderRadius = `${c.itemCornerRadius}px`;
            wrap.style.border = itemOutlineCss;
            wrap.style.boxShadow = itemInnerGlowCss;
            this._syncBackdropBlur(wrap, itemBlurPx);
            if (iconLoc === 'top' || iconLoc === 'bottom') {
                wrap.style.flexDirection = 'column';
            } else if (iconLoc === 'right') {
                wrap.style.flexDirection = 'row-reverse';
            } else {
                wrap.style.flexDirection = 'row';
            }

            if (hasFixedItemWidth) {
                wrap.style.width = `${c.menuItemWidth}px`;
                wrap.style.maxWidth = `${c.menuItemWidth}px`;
            }

            if (hasFixedItemHeight) {
                wrap.style.height = `${c.menuItemHeight}px`;
            }
            if (hasFixedItemHeight || hasFixedItemWidth) {
                wrap.style.flex = 'none';
            } else if (isGridWrap) {
                wrap.style.flex = '0 1 auto';
            } else {
                wrap.style.flex = '1 1 auto';
            }

            wrap.style.backgroundColor = itemConf.state ? bgOnResolved : bgOffResolved;

            const iconCol = itemConf.state
                ? (itemConf.iconColOnOverrideEn ? itemConf.iconColOnOverride : c.iconColOn)
                : (itemConf.iconColOffOverrideEn ? itemConf.iconColOffOverride : c.iconColOff);

            const slotKm = itemConf.state ? MenuWidget.ICON_STYLE_KEYMAP_ON : MenuWidget.ICON_STYLE_KEYMAP_OFF;
            const slotHasIcon = (() => {
                const src = BaseWidget.inferIconStyleSource(itemConf, slotKm);
                if (src === 'favicon') {
                    const u = String(itemConf.urlTo || '').trim();
                    return itemConf.actionType === 'url' && u !== '' && u !== 'https://';
                }
                if (src === 'custom') return String(itemConf[slotKm.customUrl] || '').trim().length > 0;
                return String(itemConf[slotKm.builtin] || '').trim().length > 0;
            })();

            const reserveIconColumn = slotHasIcon
                || (isVerticalMenu && (this._itemHasConfiguredIcon(itemConf) || useGhostIconColumn));

            let iconWrap = null;
            if (reserveIconColumn) {
                iconWrap = document.createElement('div');
                iconWrap.className = 'flex items-center justify-center shrink-0';
                iconWrap.style.fontSize = `${c.iconSize}px`;
                iconWrap.style.color = BaseWidget.resolveCssColor(iconCol);
                iconWrap.style.width = `${c.iconSize}px`;
                iconWrap.style.height = `${c.iconSize}px`;

                BaseWidget.applyIconStyleToElement(iconWrap, itemConf, slotKm, {
                    color: iconCol,
                    targetUrl: (itemConf.actionType === 'url') ? itemConf.urlTo : ''
                });
            }

            const labelDiv = document.createElement('div');
            labelDiv.textContent = itemConf.label;
            this.applyTypographyToElement(labelDiv, 'menuItem', c, { colorStateOn: itemConf.state });
            const colIcon = iconLoc === 'top' || iconLoc === 'bottom';
            labelDiv.className = colIcon
                ? 'flex-1 w-full min-w-0 min-h-0 whitespace-nowrap overflow-hidden text-ellipsis'
                : 'flex-1 whitespace-nowrap overflow-hidden text-ellipsis';
            labelDiv.style.minWidth = '0';
            if (isHorizontalLike && !itemConf.label) labelDiv.style.display = 'none';

            if (iconLoc === 'bottom') {
                if (itemConf.label) wrap.appendChild(labelDiv);
                if (iconWrap) wrap.appendChild(iconWrap);
            } else if (iconLoc === 'top') {
                if (iconWrap) wrap.appendChild(iconWrap);
                if (itemConf.label) wrap.appendChild(labelDiv);
            } else {
                if (iconWrap) wrap.appendChild(iconWrap);
                if (itemConf.label) wrap.appendChild(labelDiv);
            }

            if (noFlexGap && wrap.childElementCount > 1) {
                const spaced = wrap.children[1];
                if (iconLoc === 'top' || iconLoc === 'bottom') {
                    spaced.style.marginTop = '0.5rem';
                } else if (iconLoc === 'right') {
                    spaced.style.marginRight = '0.5rem';
                } else {
                    spaced.style.marginLeft = '0.5rem';
                }
            }

            // Hover state
            wrap.addEventListener('mouseenter', () => {
                if (Dashboard.isEditMode || c.deactivated) return;
                wrap.style.backgroundColor = bgHoverResolved;
            });
            wrap.addEventListener('mousemove', () => {
                if (Dashboard.isEditMode || c.deactivated) return;
                wrap.style.backgroundColor = bgHoverResolved;
            });
            wrap.addEventListener('mouseleave', () => {
                wrap.style.backgroundColor = c.deactivated
                    ? BaseWidget.getDeactivatedColor(c)
                    : (itemConf.state ? bgOnResolved : bgOffResolved);
            });

            if (c.deactivated) {
                const deactColor = BaseWidget.getDeactivatedColor(c);
                const accentColor = BaseWidget.getDeactivatedColorAccent(c);
                wrap.style.backgroundColor = deactColor;
                wrap.style.cursor = 'default';
                const wrapPe = !Dashboard.isEditMode ? 'none' : '';
                if (wrap.style.pointerEvents !== wrapPe) wrap.style.pointerEvents = wrapPe;
                labelDiv.style.color = accentColor;
                if (iconWrap) {
                    iconWrap.style.color = accentColor;
                    iconWrap.style.setProperty('--icon-secondary-color', accentColor);
                    const iTag = iconWrap.querySelector('i, svg');
                    if (iTag) iTag.style.color = accentColor;
                }
            }

            // Interaction
            const itemIdx = itemConf.index;
            wrap.addEventListener('mousedown', (ev) => {
                if (Dashboard.isEditMode || c.deactivated) return;
                ev.stopPropagation();
                if (itemConf.mode === 'push') {
                    this.pressItem(itemIdx, true);
                    document.addEventListener('mouseup', () => this.pressItem(itemIdx, false), { once: true });
                } else {
                    this.toggleItem(itemIdx);
                }
            });

            let touchStartX, touchStartY;
            wrap.addEventListener('touchstart', (ev) => {
                if (Dashboard.isEditMode || c.deactivated) return;
                ev.stopPropagation();
                touchStartX = ev.touches[0].clientX;
                touchStartY = ev.touches[0].clientY;
                if (itemConf.mode === 'push') {
                    ev.preventDefault();
                    this.pressItem(itemIdx, true);
                }
            }, { passive: false });

            wrap.addEventListener('touchend', (ev) => {
                if (Dashboard.isEditMode || c.deactivated) return;
                ev.stopPropagation();
                if (itemConf.mode === 'push') {
                    ev.preventDefault();
                    this.pressItem(itemIdx, false);
                } else {
                    const endX = ev.changedTouches[0].clientX;
                    const endY = ev.changedTouches[0].clientY;
                    const dist = Math.sqrt(Math.pow(endX - touchStartX, 2) + Math.pow(endY - touchStartY, 2));
                    if (dist < 10) { ev.preventDefault(); this.toggleItem(itemIdx); }
                }
            });

            applyItemSpacingFallback(wrap);
            e.layoutWrap.appendChild(wrap);
            this.itemElements.push(wrap);

            if (itemConf.label && typeof LabelHint !== 'undefined') {
                LabelHint.apply(labelDiv, itemConf.label, c.menuLabelHint, {
                    hoverTarget: wrap,
                    measureTarget: labelDiv
                });
            }

            // --- Staggered item reveal animation ---
            // Elements are inserted with their start state (opacity 0, offset), then advanced
            // to their final state in the next two animation frames so CSS transitions fire correctly.
            if (c.menuStyle === 'snap') {
                wrap.style.transition = 'background-color 0.2s';
                wrap.style.transform = 'translate(0px, 0px)';
                if (!this.isOpen && !Dashboard.isEditMode) {
                    wrap.style.opacity = '0';
                } else if (Dashboard.isEditMode && !this.isOpen) {
                    wrap.style.opacity = '0.5';
                } else {
                    wrap.style.opacity = '1';
                }
            } else if (c.menuStyle !== 'static') {
                // Start item fade/slide with the panel (not after clip-path ends); small offset so the first paint is the collapsed panel.
                const itemRevealBaseDelayS = shouldAnimateIn ? 0.04 : 0;
                const seqIdx = reverseStagger ? (nonSeparatorCount - 1 - nonSeparatorRenderedCount) : nonSeparatorRenderedCount;
                const delay = itemRevealBaseDelayS + (seqIdx * 0.08);

                let txOff = '0px', tyOff = '0px';
                if (isHorizontalLike) {
                    txOff = (c.menuStyle === 'slide_left') ? '10px' : '-10px';
                } else {
                    tyOff = (c.menuStyle === 'dropup') ? '10px' : '-10px';
                }

                if (shouldAnimateIn) {
                    wrap.style.opacity = '0';
                    wrap.style.transform = `translate(${txOff}, ${tyOff})`;
                    
                    // Force synchronous layout calculation for reliable start states
                    void wrap.offsetHeight;
                    
                    wrap.style.transition = `opacity 0.3s ease ${delay}s, transform 0.3s cubic-bezier(0.16,1,0.3,1) ${delay}s, background-color 0.2s`;
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            wrap.style.opacity = '1';
                            wrap.style.transform = 'translate(0px, 0px)';
                        });
                    });
                } else if (this.isOpen && !Dashboard.isEditMode) {
                    wrap.style.opacity = '1';
                    wrap.style.transform = 'translate(0px, 0px)';
                    wrap.style.transition = 'background-color 0.2s';
                } else {
                    wrap.style.transition = 'background-color 0.2s';
                    wrap.style.opacity = Dashboard.isEditMode ? '0.5' : '0';
                    wrap.style.transform = `translate(${txOff}, ${tyOff})`;
                }
            } else {
                wrap.style.transition = 'background-color 0.2s';
            }

            nonSeparatorRenderedCount++;
        });

        this._wasRenderedOpen = this.isOpen;
        this._animateNextOpen = false;
        this.scheduleFittedAutoSizeCommit();
    }
}

WidgetRegistry.register("menu", MenuWidget);
