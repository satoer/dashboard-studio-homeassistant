class LightGridWidget extends BaseWidget {
    static get metadata() {
        return { label: "Light Grid", shortName: "Lights", icon: "ph-lightbulb", category: "Control", color_dark: "hsl(50, 80%, 65%)", color_light: "hsl(50, 85%, 35%)", version: "2.3.1", date: "2026-11-02" };
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

    /** Default Phosphor class for unset per-light **Icon name** (`icons.on.builtin`). Must stay aligned with editor `iconBuiltinFallback` on `light_list` rows. */
    static get DEFAULT_LIGHT_ITEM_BUILTIN() {
        return 'ph-lightbulb';
    }

    /** Responsive Columns: control panel stacks below the grid inside the same column cell. */
    static isStackedControlPanelMode() {
        return typeof BaseWidget !== 'undefined'
            && BaseWidget.isResponsiveMode && BaseWidget.isResponsiveMode();
    }

    static defaultLightItemIconSlot() {
        const menuBase = (typeof MenuWidget !== 'undefined' && MenuWidget.defaultIconSlot)
            ? MenuWidget.defaultIconSlot()
            : { source: 'phosphor', builtin: '', weight: 'fill', customUrl: '', tintImage: false };
        return { ...menuBase, builtin: LightGridWidget.DEFAULT_LIGHT_ITEM_BUILTIN };
    }

    static ensureLightItemIcons(item) {
        if (!item || typeof item !== 'object') return;
        const def = LightGridWidget.defaultLightItemIconSlot();
        if (!item.icons || typeof item.icons !== 'object') item.icons = {};
        if (!item.icons.on || typeof item.icons.on !== 'object') {
            item.icons.on = { ...def };
        } else {
            const prev = { ...item.icons.on };
            Object.assign(item.icons.on, def);
            Object.assign(item.icons.on, prev);
        }
        LightGridWidget.coalesceLightItemPhosphorBuiltinIfEmpty(item.icons.on);
    }

    /** Per-light slot: persisted `builtin: ''` (from menu-shaped defaults / editor) overwrites merges; coerce back for Phosphor only. */
    static coalesceLightItemPhosphorBuiltinIfEmpty(on) {
        if (!on || typeof on !== 'object') return;
        const curSrc = on.source;
        let source = 'phosphor';
        if (curSrc === 'custom' || curSrc === 'phosphor') source = curSrc;
        else if (String(on.customUrl || '').trim()) source = 'custom';
        if (source !== 'phosphor') return;
        if (String(on.builtin || '').trim() !== '') return;
        on.builtin = LightGridWidget.DEFAULT_LIGHT_ITEM_BUILTIN;
    }

    static expandLightItemIconsToFlat(item) {
        LightGridWidget.ensureLightItemIcons(item);
        const on = item.icons.on;
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const wOn = (on.weight != null && String(on.weight).trim() !== '')
            ? String(on.weight).toLowerCase().trim()
            : 'fill';
        const flat = {
            iconSourceOn: on.source,
            iconOn: on.builtin,
            iconWeightOn: wOn,
            imgOn: on.customUrl,
            colorizeOn: on.tintImage === true,
            iconSlotAccentOn: BaseWidget.resolveIconSlotAccentColor(on, M.defaultIconWidgetAccentColor || M.menuIconAccentOn)
        };
        Object.assign(flat, BaseWidget.flattenIconSlotTransformFlat(on, LightGridWidget.ICON_KEYMAP_ON));
        return flat;
    }

    static applyLightItemIconToWrap(wrap, item, colorCss, widgetConfig) {
        if (!wrap || !item) return;
        const flat = LightGridWidget.expandLightItemIconsToFlat(item);
        if (widgetConfig && widgetConfig.iconColorize === true) {
            flat.colorizeOn = true;
        }
        if (widgetConfig && widgetConfig.deactivated) {
            flat.deactivated = true;
            flat.deactivatedColorAccent = widgetConfig.deactivatedColorAccent;
        }
        const km = LightGridWidget.ICON_KEYMAP_ON;
        const col = colorCss != null ? String(colorCss) : 'currentColor';
        BaseWidget.applyIconStyleToElement(wrap, flat, km, { color: col });
    }

    static get LIGHT_GRID_LABEL_POS_OPTIONS() {
        return [
            { value: 'top_left', text: 'Top Left' },
            { value: 'top_center', text: 'Top Center' },
            { value: 'top_right', text: 'Top Right' },
            { value: 'bottom_left', text: 'Bottom Left' },
            { value: 'bottom_center', text: 'Bottom Center' },
            { value: 'bottom_right', text: 'Bottom Right' }
        ];
    }

    static parseWidgetLabelPosition(labelPos) {
        const raw = String(labelPos || 'top_center').trim();
        const parts = raw.split('_');
        const vertical = parts[0] === 'bottom' ? 'bottom' : 'top';
        let horizontal = 'center';
        if (parts[1] === 'left' || parts[1] === 'right') horizontal = parts[1];
        return { vertical: vertical, horizontal: horizontal };
    }

    static get LIGHT_GRID_ITEM_HEIGHT_AUTO() { return 60; }
    static get LIGHT_GRID_ITEM_SPACING_AUTO() { return 8; }

    static rawLightGridDimension(c, instanceKey, masterKey, legacyInstanceKey, legacyMasterKey) {
        if (c[instanceKey] !== undefined && c[instanceKey] !== null) return c[instanceKey];
        if (legacyInstanceKey && c[legacyInstanceKey] !== undefined && c[legacyInstanceKey] !== null) {
            return c[legacyInstanceKey];
        }
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        if (M[masterKey] !== undefined && M[masterKey] !== null) return M[masterKey];
        if (legacyMasterKey && M[legacyMasterKey] !== undefined && M[legacyMasterKey] !== null) {
            return M[legacyMasterKey];
        }
        return 0;
    }

    static resolveLightGridItemHeight(raw) {
        const n = Number(raw);
        if (!Number.isFinite(n) || n <= 0) return LightGridWidget.LIGHT_GRID_ITEM_HEIGHT_AUTO;
        return BaseWidget.clampNumber(n, 1, null);
    }

    static resolveLightGridItemSpacing(raw) {
        const n = Number(raw);
        if (!Number.isFinite(n) || n <= 0) return LightGridWidget.LIGHT_GRID_ITEM_SPACING_AUTO;
        return BaseWidget.clampNumber(n, 0, null);
    }

    static resolveLightGridItemWidth(raw) {
        const n = Number(raw);
        if (!Number.isFinite(n) || n <= 0) return null;
        return BaseWidget.clampNumber(n, 1, null);
    }

    static get LIGHT_GRID_OUTPUT_MODE_OPTIONS() {
        return [
            { value: 'light', text: 'Light' },
            { value: 'switch', text: 'Switch' }
        ];
    }

    static isSwitchOutputMode(light) {
        return light && String(light.outputMode || 'light').trim().toLowerCase() === 'switch';
    }

    static normalizeLightItemOutputMode(light) {
        if (!light || typeof light !== 'object') return;
        const mode = String(light.outputMode || 'light').trim().toLowerCase();
        light.outputMode = mode === 'switch' ? 'switch' : 'light';
        if (light.outputMode === 'switch') {
            LightGridWidget.ensureLightItemSwitchAction(light);
        }
    }

    static defaultLightItemSwitchAction() {
        return {
            actionType: 'topic',
            onPayload: 'true',
            offPayload: 'false',
            pageTo: 1,
            urlTo: 'https://',
            urlNewTab: false
        };
    }

    static ensureLightItemSwitchAction(light) {
        if (!light || typeof light !== 'object') return;
        if (!light.switchAction || typeof light.switchAction !== 'object') {
            light.switchAction = LightGridWidget.defaultLightItemSwitchAction();
            return;
        }
        const d = LightGridWidget.defaultLightItemSwitchAction();
        if (light.switchAction.actionType == null) light.switchAction.actionType = d.actionType;
        if (light.switchAction.onPayload == null) light.switchAction.onPayload = d.onPayload;
        if (light.switchAction.offPayload == null) light.switchAction.offPayload = d.offPayload;
        if (light.switchAction.pageTo == null) light.switchAction.pageTo = d.pageTo;
        if (light.switchAction.urlTo == null) light.switchAction.urlTo = d.urlTo;
        if (light.switchAction.urlNewTab == null) light.switchAction.urlNewTab = d.urlNewTab;
    }

    static lightItemHasConfiguredTopics(light) {
        return Array.isArray(light && light.topics)
            && light.topics.some((t) => String(t || '').trim() !== '');
    }

    static getSwitchActionTypeOptionsForLight(light) {
        const hasTopics = LightGridWidget.lightItemHasConfiguredTopics(light);
        const pageLabel = hasTopics ? 'Go to Page + Topic' : 'Go to Page';
        const urlLabel = hasTopics ? 'Open URL + Topic' : 'Open URL';
        return [
            { value: 'topic', text: 'Send Topic' },
            { value: 'page', text: pageLabel },
            { value: 'url', text: urlLabel }
        ];
    }

    static parseSwitchPayload(rawValue) {
        if (rawValue === 'true') return true;
        if (rawValue === 'false') return false;
        const numberValue = parseFloat(rawValue);
        if (!isNaN(numberValue) && String(numberValue) === String(rawValue).trim()) return numberValue;
        return rawValue;
    }

    static lightSwitchItemIsOn(light) {
        if (!light || !LightGridWidget.isSwitchOutputMode(light)) return false;
        return light.state === true;
    }

    static getLightSwitchItemState(light) {
        return LightGridWidget.lightSwitchItemIsOn(light);
    }

    static executeLightSwitchAction(light, isActive) {
        if (!light || !LightGridWidget.isSwitchOutputMode(light)) return;
        LightGridWidget.ensureLightItemSwitchAction(light);
        const action = light.switchAction;
        const actionType = String(action.actionType || 'topic').trim();
        const topics = (Array.isArray(light.topics) ? light.topics : [])
            .filter((t) => String(t || '').trim() !== '');
        const payload = LightGridWidget.parseSwitchPayload(
            isActive ? action.onPayload : action.offPayload
        );
        const sendTopics = () => {
            topics.forEach((t) => Dashboard.send(t, payload));
        };

        if (actionType === 'page') {
            if (topics.length) sendTopics();
            Dashboard.updateGlobal({ currentPage: parseInt(action.pageTo || 1, 10) });
            return;
        }
        if (actionType === 'url') {
            if (topics.length) sendTopics();
            const url = String(action.urlTo || '').trim();
            if (url && url !== 'https://') {
                if (typeof UrlNavigation !== 'undefined' && typeof UrlNavigation.openUrl === 'function') {
                    UrlNavigation.openUrl(url, action.urlNewTab === true);
                } else {
                    window.open(url, action.urlNewTab === true ? '_blank' : '_self');
                }
            }
            return;
        }
        sendTopics();
    }

    static indexOfFirstLightOutputMode(lightsData) {
        if (!Array.isArray(lightsData)) return -1;
        for (let i = 0; i < lightsData.length; i++) {
            if (!LightGridWidget.isSwitchOutputMode(lightsData[i])) return i;
        }
        return -1;
    }

    /**
     * Device name for a Unified Light State topic (`Device Name/light_state_json`), not the raw path.
     */
    static lightNameFromTopic(topic) {
        const text = String(topic || '').trim();
        if (!text) return 'New Light';
        const parts = text.split('/').filter(function (p) { return p; });
        let seg = '';
        for (let i = parts.length - 1; i >= 0; i--) {
            if (String(parts[i]).toLowerCase() === 'light_state_json') {
                seg = i > 0 ? parts[i - 1] : '';
                break;
            }
        }
        if (!seg && parts.length) {
            seg = parts[0];
            const transport = { local: 1, homey: 1, sim: 1, mqtt: 1, nodered: 1 };
            if (transport[seg] && parts.length >= 2) seg = parts[parts.length - 2] || seg;
        }
        seg = String(seg).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (!seg) return 'New Light';
        if (/[a-z]/.test(seg) && /[A-Z]/.test(seg)) return seg;
        return seg.replace(/\w\S*/g, function (w) {
            return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        });
    }

    /**
     * On/off, CSS color, and 0-255 brightness from a Unified Light State payload.
     * Shared by grid tiles and the Live Lights picker.
     */
    static liveLightAppearance(rawData) {
        let on = false;
        let cssColor = '';
        let brightness = 255;
        if (rawData && typeof rawData === 'object') {
            on = rawData.state === 'ON' || rawData.state === 'on' || rawData.state === true;
            if (rawData.brightness !== undefined) {
                const n = Number(rawData.brightness);
                if (isFinite(n)) brightness = n;
            }
            if (typeof ColorUtils !== 'undefined' && ColorUtils.parse && ColorUtils.toCss) {
                const parsed = ColorUtils.parse(rawData);
                if (parsed) {
                    if (parsed.v < 50) parsed.v = 100;
                    cssColor = ColorUtils.toCss(parsed);
                } else if (rawData.color_temp !== undefined && ColorUtils.kelvinToHsv && ColorUtils.miredToKelvin) {
                    cssColor = ColorUtils.toCss(ColorUtils.kelvinToHsv(ColorUtils.miredToKelvin(rawData.color_temp), 255));
                } else if (rawData.color && rawData.color.h !== undefined) {
                    cssColor = ColorUtils.toCss({ h: rawData.color.h, s: rawData.color.s, v: 100, a: 1 });
                }
            }
        } else if (rawData === true || rawData === 'ON' || rawData === 'on' || rawData === '1' || parseFloat(rawData) > 0) {
            on = true;
        }
        if (brightness < 0) brightness = 0;
        if (brightness > 255) brightness = 255;
        return { on: on, cssColor: cssColor, brightness: brightness };
    }

    /** Per-row binding path under `bindings.lightsData[index]`. */
    static lightItemBindingPath(index, prop) {
        const base = ['lightsData', index];
        const switchProps = new Set(['actionType', 'onPayload', 'offPayload', 'pageTo', 'urlTo', 'urlNewTab']);
        if (switchProps.has(prop)) {
            return [...base, 'switchAction', prop];
        }
        const iconKeys = BaseWidget.ICON_STYLE_NESTED_PROP_BY_FIELD_KEY;
        if (iconKeys[prop]) {
            return [...base, 'icons', 'on', iconKeys[prop]];
        }
        return [...base, prop];
    }

    _lightItemBound(index, prop, fallback, coerce) {
        const path = LightGridWidget.lightItemBindingPath(index, prop);
        const topic = typeof BindingsTree !== 'undefined'
            ? BindingsTree.getAtPath(this.bindings, path)
            : undefined;
        if (!topic || typeof topic !== 'string' || typeof Dashboard === 'undefined' || !Dashboard.liveData || Dashboard.liveData[topic] === undefined) {
            return fallback;
        }
        let v = Dashboard.liveData[topic];
        v = this._finalizeBindingValue(`lightItemBind_${index}_${prop}`, v);
        if (coerce === 'bool') {
            if (typeof v === 'boolean') return v;
            const s = String(v).toLowerCase().trim();
            return v === true || s === 'true' || s === '1' || s === 'on';
        }
        if (coerce === 'int') {
            const n = parseInt(v, 10);
            return Number.isNaN(n) ? fallback : n;
        }
        if (coerce === 'outputMode') {
            const s = String(v).toLowerCase().trim();
            return s === 'switch' ? 'switch' : 'light';
        }
        if (coerce === 'action') {
            const s = String(v).toLowerCase().trim();
            if (s === 'topic' || s === 'page' || s === 'url') return s;
            return fallback;
        }
        if (prop === 'name') return BaseWidget.displayText(v);
        return v;
    }

    static applyLightItemIconBindingsToNested(copy, index, widget) {
        if (!copy || !widget || typeof widget._lightItemBound !== 'function') return;
        LightGridWidget.ensureLightItemIcons(copy);
        const iFlat = LightGridWidget.expandLightItemIconsToFlat(copy);
        const on = copy.icons.on;
        const km = LightGridWidget.ICON_KEYMAP_ON;
        const defaultSrc = BaseWidget.inferIconStyleSource(iFlat, km);
        const boundSource = widget._lightItemBound(index, km.source, iFlat[km.source] != null && iFlat[km.source] !== '' ? iFlat[km.source] : defaultSrc, null);
        on.source = String(boundSource !== null && boundSource !== undefined ? boundSource : defaultSrc);
        const boundIcon = widget._lightItemBound(index, km.builtin, iFlat[km.builtin], null);
        on.builtin = String(boundIcon !== null && boundIcon !== undefined ? boundIcon : '');
        const boundWeight = widget._lightItemBound(index, km.weight, iFlat[km.weight], null);
        on.weight = String(boundWeight !== null && boundWeight !== undefined ? boundWeight : 'fill').toLowerCase().trim();
        const boundImg = widget._lightItemBound(index, km.customUrl, iFlat[km.customUrl], null);
        on.customUrl = String(boundImg !== null && boundImg !== undefined ? boundImg : '');
        on.tintImage = widget._lightItemBound(index, km.tintImage, iFlat[km.tintImage], 'bool');
        const boundAccent = widget._lightItemBound(index, km.accentColor, iFlat[km.accentColor], null);
        if (boundAccent !== null && boundAccent !== undefined && String(boundAccent).trim() !== '') {
            on.accentColor = String(boundAccent).trim();
        }
        if (km.offsetX) {
            const v = widget._lightItemBound(index, km.offsetX, iFlat[km.offsetX], null);
            if (v !== null && v !== undefined && v !== '') on.offsetX = v;
        }
        if (km.offsetY) {
            const v = widget._lightItemBound(index, km.offsetY, iFlat[km.offsetY], null);
            if (v !== null && v !== undefined && v !== '') on.offsetY = v;
        }
        if (km.rotation) {
            const v = widget._lightItemBound(index, km.rotation, iFlat[km.rotation], null);
            if (v !== null && v !== undefined && v !== '') on.rotation = v;
        }
    }

    /** True when this widget id is in the editor selection (edit mode only). */
    static isWidgetSelectedInEditor(widgetId) {
        if (!Dashboard.isEditMode || widgetId === undefined || widgetId === null) return false;
        const ids = Dashboard.selectedIds;
        if (!ids || !ids.length) return false;
        for (let i = 0; i < ids.length; i++) {
            if (ids[i] === widgetId) return true;
        }
        return false;
    }

    static get TYPOGRAPHY_ROLE_PREFIXES() {
        return [
            ['lightName', 'lgLightName'],
            ['widgetLabel', 'lgWidgetLabel'],
            ['panelTitle', 'lgPanelTitle']
        ];
    }

    static applyTypographyNestedToConfig(c) {
        BaseWidget.applyTypographyNestedToConfig(c, LightGridWidget.TYPOGRAPHY_ROLE_PREFIXES);
    }

    static fillTypographyRoleResolved(c, M, flatPrefix, masterPrefix, defaults) {
        if (!c || !flatPrefix) return;
        const d = defaults || {};
        // Per-widget master typography keys (defaultLg{Role}*) win over role defaults and universal globals.
        const m = (suf) => (masterPrefix ? M[masterPrefix + suf] : undefined);
        const hasStr = (v) => v != null && String(v).trim() !== '';

        const fontKey = flatPrefix + 'Font';
        if (!c[fontKey]) {
            const mf = m('Font');
            c[fontKey] = hasStr(mf) ? mf : (d.font || c.fontFamily || M.fontFamily || "'Inter', sans-serif");
        }
        const fsKey = flatPrefix + 'Fs';
        if (c[fsKey] == null || c[fsKey] === '') {
            const mfs = m('Fs');
            c[fsKey] = mfs != null ? mfs : (d.fontSize != null ? d.fontSize : (M.defaultFsLabel != null ? M.defaultFsLabel : 12));
        }
        const colKey = flatPrefix + 'Col';
        if (!c[colKey]) {
            const mcol = m('Col');
            c[colKey] = hasStr(mcol) ? mcol : (d.color || M.defaultColLabel || '@textMuted');
        }
        const alignKey = flatPrefix + 'Align';
        if (!c[alignKey]) {
            const malign = m('Align');
            c[alignKey] = hasStr(malign) ? malign : (d.align || M.defaultTextAlign || 'center');
        }
        const caseKey = flatPrefix + 'Case';
        if (!c[caseKey]) {
            const mcase = m('Case');
            c[caseKey] = hasStr(mcase) ? mcase : (d.textCase || M.defaultLabelCase || 'uppercase');
        }
        const boldKey = flatPrefix + 'Bold';
        if (c[boldKey] === undefined || c[boldKey] === null) {
            const mbold = m('Bold');
            if (mbold !== undefined && mbold !== null) {
                c[boldKey] = mbold === true;
            } else {
                c[boldKey] = d.bold != null ? !!d.bold : (M.defaultLabelBold === true);
            }
        }
        const offXKey = flatPrefix + 'OffX';
        if (c[offXKey] === undefined || c[offXKey] === null) {
            const moffx = m('OffX');
            c[offXKey] = moffx != null ? moffx : (d.offsetX != null ? d.offsetX : 0);
        }
        const offYKey = flatPrefix + 'OffY';
        if (c[offYKey] === undefined || c[offYKey] === null) {
            const moffy = m('OffY');
            c[offYKey] = moffy != null ? moffy : (d.offsetY != null ? d.offsetY : 0);
        }
    }

    static fillAllTypographyResolved(c, M) {
        LightGridWidget.fillTypographyRoleResolved(c, M, 'lgLightName', 'defaultLgLightName', {
            font: c.lgTileFont || M.lgTileFont,
            fontSize: 14,
            color: M.lgColTileText || '@onSurface',
            align: 'left',
            textCase: 'none',
            bold: c.lgTileFontBold != null ? c.lgTileFontBold : M.lgTileFontBold
        });
        LightGridWidget.fillTypographyRoleResolved(c, M, 'lgWidgetLabel', 'defaultLgWidgetLabel', {
            bold: M.defaultLabelBold
        });
        LightGridWidget.fillTypographyRoleResolved(c, M, 'lgPanelTitle', 'defaultLgPanelTitle', {
            bold: M.defaultLabelBold === true
        });
    }

    static typographyRolesSignature(c) {
        const snap = {};
        LightGridWidget.TYPOGRAPHY_ROLE_PREFIXES.forEach(([, prefix]) => {
            snap[prefix] = {
                Font: c[prefix + 'Font'],
                Fs: c[prefix + 'Fs'],
                Align: c[prefix + 'Align'],
                Case: c[prefix + 'Case'],
                Bold: c[prefix + 'Bold'],
                Col: c[prefix + 'Col'],
                OffX: c[prefix + 'OffX'],
                OffY: c[prefix + 'OffY']
            };
        });
        return snap;
    }

    /** Tile Inner Glow color/opacity leaves show once a width is set (instance or master default). */
    static tileInnerGlowDetailsVisible(values, isGlobal) {
        if (!values) return false;
        const inst = isGlobal === true ? values.lgTileInnerGlow : values.tileInnerGlow;
        const raw = Number(inst !== undefined && inst !== null && inst !== '' ? inst : values.lgTileInnerGlow);
        return Number.isFinite(raw) && raw > 0;
    }

    /**
     * Tile surface chrome: background opacity, outline, backdrop blur, inner
     * glow. Defaults reproduce the previous paint exactly (opaque bg, no
     * border, no shadow, no backdrop sampling). Hover only swaps the
     * background color so the selection ring survives hover transitions.
     */
    _paintTileChrome(dom, c) {
        if (!dom) return;
        dom.style.backgroundColor = BaseWidget.colorAtOpacity(c.colTileBg, c.tileBackgroundOpacity);
        if (c.tileOutlineWidth > 0) {
            dom.style.border = c.tileOutlineWidth + 'px solid ' + BaseWidget.colorAtOpacity(c.tileOutlineColor, c.tileOutlineOpacity);
        } else {
            dom.style.border = '1px solid transparent';
        }
        dom.style.boxShadow = BaseWidget.elementInnerGlowShadow(c.tileInnerGlow, c.tileInnerGlowColor, c.tileInnerGlowOpacity);
        // Frost only behind a translucent tile; at full opacity blur is invisible so it stays off.
        this._syncBackdropBlur(dom, (Number(c.tileBackgroundOpacity) < 100 ? c.tileBlur : 0));
    }

    static buildTypographySchemaGroup(prefix, title, role, options) {
        return BaseWidget.getTypographySchema(prefix, title, {
            nestedTypography: { root: 'typography', role },
            exclude: options.exclude || ['opacity', 'italic'],
            fontDefaultKey: options.fontDefaultKey,
            fontSizeDefaultKey: options.fontSizeDefaultKey || 'defaultFsLabel',
            colorDefaultKey: options.colorDefaultKey || 'defaultColLabel',
            alignDefaultKey: options.alignDefaultKey || 'defaultTextAlign',
            caseDefaultKey: options.caseDefaultKey || 'defaultLabelCase',
            boldDefaultKey: options.boldDefaultKey || 'defaultLabelBold',
            offXDefaultKey: options.offXDefaultKey,
            offYDefaultKey: options.offYDefaultKey
        });
    }

    static getNestedBindingOverlaySpec() {
        return BaseWidget.buildTypographyBindingOverlaySpec(LightGridWidget.TYPOGRAPHY_ROLE_PREFIXES);
    }

    static get globalSettings() {
        return {
            defaultLightGridPresets: [
                { state: "ON", brightness: 255, color_mode: "color_temp", color_temp: 153 },
                { state: "ON", brightness: 255, color_mode: "color_temp", color_temp: 250 },
                { state: "ON", brightness: 255, color_mode: "color_temp", color_temp: 350 },
                { state: "ON", brightness: 255, color_mode: "color_temp", color_temp: 500 },

                { state: "ON", brightness: 255, color_mode: "hs", color: { h: 0, s: 100 } },
                { state: "ON", brightness: 255, color_mode: "hs", color: { h: 30, s: 100 } },
                { state: "ON", brightness: 255, color_mode: "hs", color: { h: 60, s: 100 } },
                { state: "ON", brightness: 255, color_mode: "hs", color: { h: 90, s: 100 } },

                { state: "ON", brightness: 255, color_mode: "hs", color: { h: 120, s: 100 } },
                { state: "ON", brightness: 255, color_mode: "hs", color: { h: 150, s: 100 } },
                { state: "ON", brightness: 255, color_mode: "hs", color: { h: 180, s: 100 } },
                { state: "ON", brightness: 255, color_mode: "hs", color: { h: 210, s: 100 } },

                { state: "ON", brightness: 255, color_mode: "hs", color: { h: 240, s: 100 } },
                { state: "ON", brightness: 255, color_mode: "hs", color: { h: 270, s: 100 } },
                { state: "ON", brightness: 255, color_mode: "hs", color: { h: 300, s: 100 } },
                { state: "ON", brightness: 255, color_mode: "hs", color: { h: 330, s: 100 } }
            ],

            // Preset Grid Defaults
            lgPresetCols: 4,
            lgPresetRows: 4,
            lgPresetGap: 8,
            lgPresetIndicators: true,

            // Grid Structure Defaults (0 = auto)
            lgCols: 1,
            lgItemHeight: 60,
            lgItemWidth: 0,
            lgItemSpacing: 8,

            // Tile Color Defaults
            lgColTileBg: "@surface",
            lgColTileHover: BaseWidget.themeTokenRef('accentSoft'),
            lgTileBackgroundOpacity: 100,
            lgTileOutlineWidth: 0,
            lgTileOutlineColor: "@borderAccent",
            lgTileOutlineOpacity: 100,
            lgTileBlur: 0,
            lgTileInnerGlow: 0,
            lgTileInnerGlowColor: "@borderAccent",
            lgTileInnerGlowOpacity: 100,
            lgColTileText: "@onSurface",
            lgTileFont: "'Inter', sans-serif",
            lgTileFontBold: true,
            lgColToggleOn: "@glow",
            lgColToggleOff: "@accentOff",

            // Grid Icon Defaults
            lgIconSize: 24,
            lgIconColOff: "@icon",
            lgIconColOn: "@glow",

            // Behavior Defaults
            lgUseLightColor: true,
            lgIconColorize: false,

            // Universal Control Panel Defaults
            lgPopoverW: 260,
            lgPopoverH: 360,

            lgAutoDeselect: false,
            lgDeselectTime: 10
        };
    }

    static get basicSettingKeys() {
        return ['lightsData'];
    }

    static get globalSchema() {
        return [
            { key: 'defaultLightGridPresets', type: 'preset_grid', label: 'Global Lighting Presets', cols: 12 },

            { key: 'lgCols', type: 'number', label: 'Columns', cols: 3 },
            { key: 'lgItemHeight', type: 'number', label: 'Item Height (px)', cols: 3 },
            { key: 'lgItemWidth', type: 'number', label: 'Item Width (px)', cols: 3 },
            { key: 'lgItemSpacing', type: 'number', label: 'Item Spacing (px)', cols: 3 },

            { key: 'lgColTileBg', type: 'color', label: 'Tile Background Color', cols: 3 },
            { key: 'lgColTileHover', type: 'color', label: 'Tile Hover Color', cols: 3 },
            { key: 'lgTileBackgroundOpacity', type: 'number', label: 'Tile Background Opacity', cols: 3, min: 0, max: 100 },
            { key: 'lgTileBlur', type: 'number', label: 'Tile Background Blur', cols: 3, min: 0 },
            { key: 'lgTileOutlineWidth', type: 'number', label: 'Tile Outline Width', cols: 4, min: 0, gridColStart: 1 },
            {
                key: 'lgTileOutlineColor', type: 'color', label: 'Tile Outline Color', cols: 4,
                dependsOn: ['lgTileOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('lgTileOutlineWidth')
            },
            {
                key: 'lgTileOutlineOpacity', type: 'number', label: 'Tile Outline Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['lgTileOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('lgTileOutlineWidth')
            },
            { key: 'lgTileInnerGlow', type: 'number', label: 'Tile Inner Glow', cols: 4, min: 0, gridColStart: 1 },
            {
                key: 'lgTileInnerGlowColor', type: 'color', label: 'Tile Inner Glow Color', cols: 4,
                dependsOn: ['lgTileInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('lgTileInnerGlow')
            },
            {
                key: 'lgTileInnerGlowOpacity', type: 'number', label: 'Tile Inner Glow Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['lgTileInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('lgTileInnerGlow')
            },

            { key: 'lgColToggleOn', type: 'color', label: 'Toggle Color (On)', cols: 6 },
            { key: 'lgColToggleOff', type: 'color', label: 'Toggle Color (Off)', cols: 6 },

            { key: 'lgColTileText', type: 'color', label: 'Default Light Name Color', cols: 12, defaultKey: 'defaultColLabel' },

            { key: 'lgIconSize', type: 'number', label: 'Icon Size', cols: 12, gridColStart: 1 },
            { key: 'lgIconColOff', type: 'color', label: 'Icon Color (Off)', cols: 6, gridColStart: 1 },
            { key: 'lgIconColOn', type: 'color', label: 'Icon Color (On)', cols: 6 },

            { key: 'lgUseLightColor', type: 'checkbox', label: 'Use Actual Light Color', cols: 6 },
            { key: 'lgIconColorize', type: 'checkbox', label: 'Mask PNG Images', cols: 6 },

            { key: 'lgPopoverW', type: 'number', label: 'Panel Width', cols: 6 },
            { key: 'lgPopoverH', type: 'number', label: 'Panel Height', cols: 6 },

            { key: 'lgPresetCols', type: 'number', label: 'Preset Columns', cols: 4 },
            { key: 'lgPresetRows', type: 'number', label: 'Preset Rows', cols: 4 },
            { key: 'lgPresetGap', type: 'number', label: 'Preset Gap', cols: 4 },
            { key: 'lgPresetIndicators', type: 'checkbox', label: 'Color/White Indicators', cols: 12 },

            { key: 'lgAutoDeselect', type: 'checkbox', label: 'Auto Deselect', cols: 6 },
            { key: 'lgDeselectTime', type: 'number', label: 'Deselect Time (s)', cols: 6 },

            { type: 'heading', label: 'Text & Typography', cols: 12 },
            LightGridWidget.buildTypographySchemaGroup('defaultLgWidgetLabel', 'Widget Label', 'widgetLabel', {
                exclude: ['opacity', 'italic'],
                fontDefaultKey: 'fontFamily'
            }),
            LightGridWidget.buildTypographySchemaGroup('defaultLgLightName', 'Light name', 'lightName', {
                exclude: ['opacity', 'italic', 'offsetX', 'offsetY'],
                fontDefaultKey: 'lgTileFont',
                colorDefaultKey: 'lgColTileText',
                boldDefaultKey: 'lgTileFontBold'
            }),
            LightGridWidget.buildTypographySchemaGroup('defaultLgPanelTitle', 'Panel title', 'panelTitle', {
                exclude: ['opacity', 'italic'],
                fontDefaultKey: 'fontFamily'
            })
        ];
    }

    static extractPreloadImageUrls(o) {
        if (!o || typeof o !== 'object') return [];
        let lights = o.lightsData;
        if (typeof lights === 'string') {
            try { lights = JSON.parse(lights); } catch (e) { lights = []; }
        }
        if (!Array.isArray(lights)) return [];
        const out = [];
        lights.forEach((light) => {
            if (!light || typeof light !== 'object') return;
            LightGridWidget.ensureLightItemIcons(light);
            const on = light.icons.on;
            if (on && on.source === 'custom') {
                const u = String(on.customUrl || '').trim();
                if (u) out.push(u);
            }
            const leg = typeof light.iconUrl === 'string' ? light.iconUrl.trim() : '';
            if (leg) out.push(leg);
        });
        return out;
    }

    constructor(cid, id, ov, bn) {
        super(cid, id, ov, bn);
        this._wasEditMode = Dashboard.isEditMode;
        this._deselectTimer = null;
        this.isDraggingSlider = false;
        this.currentSliderVal = 255;
        this._lastPStr = "";
        this._syncBindings();
    }

    _clearDeselectTimer() {
        if (this._deselectTimer && typeof WorkerTimer !== 'undefined' && WorkerTimer.clearTimeout) {
            WorkerTimer.clearTimeout(this._deselectTimer);
        } else if (this._deselectTimer) {
            clearTimeout(this._deselectTimer);
        }
        this._deselectTimer = null;
    }

    _requestStackedReflow() {
        if (!LightGridWidget.isStackedControlPanelMode()) return;
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._requestResponsiveReflow === 'function') {
            Dashboard._requestResponsiveReflow(this.id);
        }
    }

    _syncPopoverMount() {
        if (!this.e || !this.e.popover || !this.elements || !this.elements.innerContent) return;
        const stacked = LightGridWidget.isStackedControlPanelMode();
        const modeKey = stacked ? 'stacked' : 'floating';
        if (this._popoverMountMode === modeKey) return;
        this._popoverMountMode = modeKey;

        const popover = this.e.popover;
        if (stacked) {
            popover.classList.add('lg-popover--stacked');
            popover.style.position = '';
            this.elements.innerContent.appendChild(popover);
        } else {
            popover.classList.remove('lg-popover--stacked');
            popover.style.position = 'absolute';
            const canvas = document.getElementById('dashboard-canvas');
            if (canvas) canvas.appendChild(popover);
        }
    }

    _applyStackedLayoutStyles() {
        if (!this.e || !this.elements) return;
        const stacked = LightGridWidget.isStackedControlPanelMode();
        const ic = this.elements.innerContent;
        const layout = this.e.layout;
        const listWrap = this.e.listWrap;

        if (stacked) {
            ic.style.overflow = 'visible';
            ic.style.height = 'auto';
            ic.style.alignItems = 'stretch';
            ic.style.justifyContent = 'flex-start';
            layout.style.flex = '0 0 auto';
            layout.style.height = 'auto';
            listWrap.style.flex = '0 1 auto';
            listWrap.style.height = 'auto';
        } else {
            ic.style.overflow = 'hidden';
            ic.style.height = '100%';
            ic.style.alignItems = 'center';
            ic.style.justifyContent = 'center';
            layout.style.flex = '';
            layout.style.height = '100%';
            listWrap.style.flex = '1';
            listWrap.style.height = '100%';
            listWrap.style.minHeight = '0';
        }
    }

    onRemove() {
        if (this._activeSliderDragCleanup) {
            this._activeSliderDragCleanup();
            this._activeSliderDragCleanup = null;
        }
        if (this.e && this.e.popover && this.e.popover.parentNode) {
            this.e.popover.parentNode.removeChild(this.e.popover);
        }
        this._clearDeselectTimer();
        super.onRemove();
    }

    /**
     * Canvas position of the floating color panel. A new grid keeps the factory
     * offset (280, 0) only in defaults, so the first drag must not treat a missing
     * override as 0 or the panel jumps to the canvas origin.
     */
    _currentPopoverOffset(key) {
        const fallback = key === 'popoverOffX' ? 280 : 0;
        const raw = this.overrides ? this.overrides[key] : undefined;
        if (raw !== undefined && raw !== null && raw !== '') {
            return BaseWidget.toFiniteNumber(raw, fallback);
        }
        const c = this.config;
        if (c && c[key] !== undefined && c[key] !== null && c[key] !== '') {
            return BaseWidget.toFiniteNumber(c[key], fallback);
        }
        return fallback;
    }

    update(payload, replace = false) {
        if (!LightGridWidget.isStackedControlPanelMode()
            && payload.x !== undefined && this.config.x !== undefined && payload.x !== this.config.x) {
            const dx = payload.x - this.config.x;
            const dy = payload.y - this.config.y;
            payload.popoverOffX = this._currentPopoverOffset('popoverOffX') + dx;
            payload.popoverOffY = this._currentPopoverOffset('popoverOffY') + dy;
        }
        super.update(payload, replace);
        this._syncBindings();
    }

    _syncCanvasBoundaryClipping(optX, optY, optW, optH) {
        super._syncCanvasBoundaryClipping(optX, optY, optW, optH);
        if (this.e && this.e.popover && !LightGridWidget.isStackedControlPanelMode()) {
            const c = this.config;
            BaseWidget.syncCompanionCanvasClipping(this.e.popover, this.e.popContainer, c.popoverOffX, c.popoverOffY, c.popoverW, c.popoverH);
        }
    }

    updatePositionSize() {
        if (!LightGridWidget.isStackedControlPanelMode()
            && this._lastGridX !== undefined && this._lastGridY !== undefined) {
            const dx = this.overrides.x - this._lastGridX;
            const dy = this.overrides.y - this._lastGridY;

            if (dx !== 0 || dy !== 0) {
                this.overrides.popoverOffX = this._currentPopoverOffset('popoverOffX') + dx;
                this.overrides.popoverOffY = this._currentPopoverOffset('popoverOffY') + dy;
                if (this.e && this.e.popover) {
                    this.applyPopoverStyles();
                }
            }
        }

        this._lastGridX = this.overrides.x;
        this._lastGridY = this.overrides.y;

        super.updatePositionSize();
    }

    select() {
        super.select();
        if (Dashboard.isEditMode) {
            this.render();
        } else {
            this.applyPopoverStyles();
        }
    }

    deselect() {
        super.deselect();
        if (Dashboard.isEditMode && this.e && this.e.popover) {
            let stillSelected = false;
            const ids = Dashboard.selectedIds;
            if (ids && ids.length) {
                for (let i = 0; i < ids.length; i++) {
                    if (ids[i] === this.id) {
                        stillSelected = true;
                        break;
                    }
                }
            }
            if (!stillSelected && !this.config.alwaysShowPanel) {
                this.e.popover.style.display = 'none';
                this.selectedLightIndex = null;
                this._clearDeselectTimer();
                this._requestStackedReflow();
            }
        }
        this.applyPopoverStyles();
    }

    _syncBindings() {
        const preserved = JSON.parse(JSON.stringify(this.bindings || {}));
        Object.keys(preserved).forEach((k) => {
            if (/^l_\d+_\d+$/.test(k)) delete preserved[k];
        });
        const c = this.config;
        if (c.lightsData && Array.isArray(c.lightsData)) {
            c.lightsData.forEach((light, i) => {
                if (light.topics && Array.isArray(light.topics)) {
                    light.topics.forEach((t, j) => {
                        if (t) preserved[`l_${i}_${j}`] = t;
                    });
                }
            });
        }
        this.bindings = preserved;
    }

    _resetTimeout() {
        this._clearDeselectTimer();
        const c = this.config;
        if (c.autoDeselect && c.deselectTime > 0 && this.selectedLightIndex !== null) {
            const ms = Math.max(0, Math.floor(BaseWidget.toFiniteNumber(c.deselectTime, 0) * 1000));
            const runClose = () => {
                this._deselectTimer = null;
                if (!Dashboard.isEditMode) {
                    this.closePopover();
                }
            };
            if (typeof WorkerTimer !== 'undefined' && WorkerTimer.setTimeout) {
                this._deselectTimer = WorkerTimer.setTimeout(runClose, ms);
            } else {
                this._deselectTimer = setTimeout(runClose, ms);
            }
        }
    }

    static get AUDIO_TRIGGERS() {
        return [
            { key: 'tileOn', label: 'On Tile On' },
            { key: 'tileOff', label: 'On Tile Off' },
            { key: 'panelOpen', label: 'On Panel Open' },
            { key: 'panelClose', label: 'On Panel Close' }
        ];
    }

    getDefaultOverrides() {
        return {
            lightsData: [
                {
                    name: "Living Room",
                    outputMode: 'light',
                    topics: ["living_room/light"],
                    icons: { on: { builtin: 'ph-armchair' } },
                    overridePresets: false,
                    presets: []
                },
                {
                    name: "Kitchen",
                    outputMode: 'light',
                    topics: ["kitchen/light"],
                    icons: { on: { builtin: 'ph-cooking-pot' } },
                    overridePresets: false,
                    presets: []
                }
            ],
            typography: { lightName: {}, widgetLabel: {}, panelTitle: {} },
            previewPopover: true,
            alwaysShowPanel: false,
            popoverOffX: 280,
            popoverOffY: 0,
            audio: (typeof DashboardAudio !== 'undefined' && DashboardAudio.defaultAudio)
                ? DashboardAudio.defaultAudio(LightGridWidget.AUDIO_TRIGGERS)
                : { tileOn: '', tileOff: '', panelOpen: '', panelClose: '' }
        };
    }

    get config() {
        const c = super.config;

        let parsedLights = c.lightsData;
        if (typeof parsedLights === 'string') {
            try { parsedLights = JSON.parse(parsedLights); } catch (e) { parsedLights = []; }
        }

        let basePresets = c.presets || c.defaultLightGridPresets;
        if (Array.isArray(basePresets) && basePresets.every(p => p === null)) {
            basePresets = LightGridWidget.globalSettings.defaultLightGridPresets;
        }

        const cols = Math.max(1, Math.floor(BaseWidget.toFiniteNumber(
            c.cols !== undefined && c.cols !== null ? c.cols
                : (c.columns !== undefined && c.columns !== null ? c.columns : (c.lgCols || 1)),
            1
        )));
        const itemHeight = LightGridWidget.resolveLightGridItemHeight(
            LightGridWidget.rawLightGridDimension(c, 'itemHeight', 'lgItemHeight')
        );
        const itemWidth = LightGridWidget.resolveLightGridItemWidth(
            LightGridWidget.rawLightGridDimension(c, 'itemWidth', 'lgItemWidth')
        );
        const itemSpacing = LightGridWidget.resolveLightGridItemSpacing(
            LightGridWidget.rawLightGridDimension(c, 'itemSpacing', 'lgItemSpacing', 'rowGap', 'lgRowGap')
        );
        const presetCols = Math.max(1, Math.floor(BaseWidget.toFiniteNumber(c.presetCols !== undefined && c.presetCols !== null ? c.presetCols : (c.lgPresetCols || 4), 4)));
        const presetRows = Math.max(1, Math.floor(BaseWidget.toFiniteNumber(c.presetRows !== undefined && c.presetRows !== null ? c.presetRows : (c.lgPresetRows || 4), 4)));
        const presetGap = BaseWidget.clampNumber(c.presetGap !== undefined && c.presetGap !== null ? c.presetGap : (c.lgPresetGap || 8), 0, null);
        const iconSize = BaseWidget.clampNumber(c.iconSize !== undefined && c.iconSize !== null ? c.iconSize : (c.lgIconSize || 24), 1, null);
        const popoverW = BaseWidget.clampNumber(c.popoverW || c.lgPopoverW || 260, 100, null);
        const popoverH = BaseWidget.clampNumber(c.popoverH || c.lgPopoverH || 150, 150, null);
        const popoverOffX = BaseWidget.toFiniteNumber(c.popoverOffX || 0, 0);
        const popoverOffY = BaseWidget.toFiniteNumber(c.popoverOffY || 0, 0);
        const sliderTrackH = BaseWidget.clampNumber(c.sliderTrackH !== undefined && c.sliderTrackH !== null ? c.sliderTrackH : (c.defaultSliderTrackThick || 36), 1, null);
        const sliderFillH = BaseWidget.clampNumber(c.sliderFillH !== undefined && c.sliderFillH !== null ? c.sliderFillH : (c.defaultSliderFillThick || 24), 1, null);
        const sliderThumbSz = BaseWidget.clampNumber(c.sliderThumbSz !== undefined && c.sliderThumbSz !== null ? c.sliderThumbSz : (c.defaultSliderThumbSz || 29), 1, null);

        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        LightGridWidget.applyTypographyNestedToConfig(c);
        LightGridWidget.fillAllTypographyResolved(c, M);
        BaseWidget.applyNestedBindingOverlay(this, c, LightGridWidget.getNestedBindingOverlaySpec());

        const lightsOut = Array.isArray(parsedLights) ? parsedLights.map((light, i) => {
            if (!light || typeof light !== 'object') return light;
            const copy = { ...light };
            LightGridWidget.ensureLightItemIcons(copy);

            const boundName = this._lightItemBound(i, 'name', copy.name != null ? copy.name : '', null);
            copy.name = String(boundName !== null && boundName !== undefined ? boundName : '');

            copy.outputMode = this._lightItemBound(i, 'outputMode', copy.outputMode || 'light', 'outputMode');
            LightGridWidget.normalizeLightItemOutputMode(copy);
            LightGridWidget.applyLightItemIconBindingsToNested(copy, i, this);

            if (LightGridWidget.isSwitchOutputMode(copy)) {
                LightGridWidget.ensureLightItemSwitchAction(copy);
                copy.switchAction = { ...copy.switchAction };
                const sa = copy.switchAction;
                const d = LightGridWidget.defaultLightItemSwitchAction();
                sa.actionType = this._lightItemBound(i, 'actionType', sa.actionType || d.actionType, 'action');
                sa.onPayload = this._lightItemBound(i, 'onPayload', sa.onPayload != null ? sa.onPayload : d.onPayload, null);
                sa.offPayload = this._lightItemBound(i, 'offPayload', sa.offPayload != null ? sa.offPayload : d.offPayload, null);
                const pageFallback = parseInt(sa.pageTo, 10);
                sa.pageTo = this._lightItemBound(i, 'pageTo', Number.isNaN(pageFallback) ? d.pageTo : pageFallback, 'int');
                const urlFallback = sa.urlTo != null ? sa.urlTo : d.urlTo;
                const boundUrl = this._lightItemBound(i, 'urlTo', urlFallback, null);
                sa.urlTo = String(boundUrl !== null && boundUrl !== undefined ? boundUrl : urlFallback);
                sa.urlNewTab = this._lightItemBound(i, 'urlNewTab', sa.urlNewTab === true, 'bool');

                const stPath = LightGridWidget.lightItemBindingPath(i, 'state');
                const stBind = typeof BindingsTree !== 'undefined'
                    ? BindingsTree.getAtPath(this.bindings, stPath)
                    : undefined;
                const hasStateBinding = !!(stBind && typeof stBind === 'string' && String(stBind).trim());
                const stateKey = `item_${i}_state`;
                let fState = copy.state === true;
                if (this.overrides[stateKey] !== undefined) {
                    fState = this.overrides[stateKey] === true;
                }
                if (hasStateBinding) {
                    const opt = this._optimisticItemStates ? this._optimisticItemStates[i] : undefined;
                    fState = opt !== undefined ? opt : this._lightItemBound(i, 'state', fState, 'bool');
                }
                copy.state = fState;
            }

            return copy;
        }) : [];

        const out = {
            ...c,
            lightsData: lightsOut,
            presets: basePresets,

            colTileBg: c.colTileBg || c.tileBackgroundColor || c.lgColTileBg,
            colTileHover: c.colTileHover || c.tileHoverColor || c.lgColTileHover || BaseWidget.themeTokenRef('accentSoft'),
            tileBackgroundOpacity: c.tileBackgroundOpacity !== undefined && c.tileBackgroundOpacity !== null ? c.tileBackgroundOpacity : (c.lgTileBackgroundOpacity !== undefined && c.lgTileBackgroundOpacity !== null ? c.lgTileBackgroundOpacity : 100),
            tileOutlineWidth: c.tileOutlineWidth !== undefined && c.tileOutlineWidth !== null ? c.tileOutlineWidth : (c.lgTileOutlineWidth || 0),
            tileOutlineColor: c.tileOutlineColor || c.lgTileOutlineColor || '@borderAccent',
            tileOutlineOpacity: c.tileOutlineOpacity !== undefined && c.tileOutlineOpacity !== null ? c.tileOutlineOpacity : (c.lgTileOutlineOpacity !== undefined && c.lgTileOutlineOpacity !== null ? c.lgTileOutlineOpacity : 100),
            tileBlur: c.tileBlur !== undefined && c.tileBlur !== null ? c.tileBlur : (c.lgTileBlur || 0),
            tileInnerGlow: c.tileInnerGlow !== undefined && c.tileInnerGlow !== null ? c.tileInnerGlow : (c.lgTileInnerGlow || 0),
            tileInnerGlowColor: c.tileInnerGlowColor || c.lgTileInnerGlowColor || '@borderAccent',
            tileInnerGlowOpacity: c.tileInnerGlowOpacity !== undefined && c.tileInnerGlowOpacity !== null ? c.tileInnerGlowOpacity : (c.lgTileInnerGlowOpacity !== undefined && c.lgTileInnerGlowOpacity !== null ? c.lgTileInnerGlowOpacity : 100),
            colToggleOn: c.colToggleOn || c.toggleColorOn || c.lgColToggleOn,
            colToggleOff: c.colToggleOff || c.toggleColorOff || c.lgColToggleOff,

            iconSize: iconSize,
            iconColOff: c.iconColOff || c.lgIconColOff || M.lgIconColOff || BaseWidget.themeTokenRef('icon'),
            iconColOn: c.iconColOn || c.lgIconColOn || c.colToggleOn || c.lgColToggleOn,
            useLightColor: c.useLightColor !== undefined && c.useLightColor !== null ? c.useLightColor : (c.lgUseLightColor !== undefined ? c.lgUseLightColor : true),
            iconColorize: c.iconColorize !== undefined && c.iconColorize !== null ? c.iconColorize : (c.lgIconColorize || false),

            cols: cols,
            itemHeight: itemHeight,
            itemWidth: itemWidth,
            itemSpacing: itemSpacing,

            presetCols: presetCols,
            presetRows: presetRows,
            presetGap: presetGap,
            presetIndicators: c.presetIndicators !== undefined && c.presetIndicators !== null ? c.presetIndicators : (c.lgPresetIndicators !== undefined ? c.lgPresetIndicators : true),

            autoDeselect: c.autoDeselect !== undefined && c.autoDeselect !== null ? c.autoDeselect : (c.lgAutoDeselect || false),
            deselectTime: BaseWidget.clampNumber(c.deselectTime !== undefined && c.deselectTime !== null ? c.deselectTime : (c.lgDeselectTime !== undefined ? c.lgDeselectTime : 10), 0, null),

            previewPopover: c.previewPopover === true,
            alwaysShowPanel: c.alwaysShowPanel === true,

            popoverW: popoverW,
            popoverH: popoverH,
            popoverOffX: popoverOffX,
            popoverOffY: popoverOffY,

            popoverBgColStart: c.popoverBgColStart || c.bgColStart,
            popoverBgColEnd: c.popoverBgColEnd || c.bgColEnd,
            popoverBgOpacityStart: BaseWidget.clampNumber(c.popoverBgOpacityStart !== undefined && c.popoverBgOpacityStart !== null ? c.popoverBgOpacityStart : (c.bgOpacityStart || 100), 0, 100),
            popoverBgOpacityEnd: BaseWidget.clampNumber(c.popoverBgOpacityEnd !== undefined && c.popoverBgOpacityEnd !== null ? c.popoverBgOpacityEnd : (c.bgOpacityEnd || 100), 0, 100),
            popoverBgAngle: BaseWidget.toFiniteNumber(c.popoverBgAngle !== undefined && c.popoverBgAngle !== null ? c.popoverBgAngle : (c.bgAngle || 145), 145),

            popoverBorderColor: c.popoverBorderColor || c.borderColor,
            popoverBorderWidth: BaseWidget.clampNumber(c.popoverBorderWidth !== undefined && c.popoverBorderWidth !== null ? c.popoverBorderWidth : (c.borderWidth || 1), 0, null),
            popoverBorderOpacity: BaseWidget.clampNumber(c.popoverBorderOpacity !== undefined && c.popoverBorderOpacity !== null ? c.popoverBorderOpacity : (c.borderOpacity || 100), 0, 100),

            popoverCornerRadius: BaseWidget.clampNumber(c.popoverCornerRadius !== undefined && c.popoverCornerRadius !== null ? c.popoverCornerRadius : (c.cornerRadius || 16), 0, null),

            popoverGlowEnabled: c.popoverGlowEnabled !== undefined && c.popoverGlowEnabled !== null ? c.popoverGlowEnabled : (c.glowEnabled || false),
            popoverGlowColor: c.popoverGlowColor || c.glowColor,
            popoverGlowRadius: BaseWidget.clampNumber(c.popoverGlowRadius !== undefined && c.popoverGlowRadius !== null ? c.popoverGlowRadius : (c.glowRadius || 40), 0, null),
            popoverGlowOpacity: BaseWidget.clampNumber(c.popoverGlowOpacity !== undefined && c.popoverGlowOpacity !== null ? c.popoverGlowOpacity : (c.glowOpacity || 50), 0, 100),

            sliderTrackH: sliderTrackH,
            sliderFillH: sliderFillH,
            sliderThumbSz: sliderThumbSz,
            sliderColTrack: c.sliderColTrack || "@border",
            sliderColFill: c.sliderColFill || c.sliderColFill || "@accent",
            sliderColThumb: c.sliderColThumb || c.sliderColThumb || "@thumb",

            label: c.label || "",
            labelPos: c.labelPos || 'top_center'
        };

        [
            'tileFont', 'tileFontBold',
            'labelFont', 'labelFs', 'labelCol', 'labelAlign', 'labelCase', 'labelBold', 'labelOffX', 'labelOffY',
            'panelTitleFont', 'panelTitleFs', 'panelTitleCol', 'panelTitleAlign', 'panelTitleCase',
            'panelTitleBold', 'panelTitleOffX', 'panelTitleOffY',
            'colTileText', 'lgColTileText'
        ].forEach((k) => { delete out[k]; });
        delete out.typography;

        return out;
    }

    getSchema() {
        return [
            {
                id: 'lg_data', title: 'Configured Lights', icon: 'ph-database',
                fields: [
                    { key: 'lightsData', type: 'light_list', label: 'Light Devices', cols: 12 }
                ]
            },
            {
                id: 'lg_layout', title: 'Grid Layout', icon: 'ph-grid-four',
                fields: [
                    { key: 'columns', type: 'number', label: 'Columns', cols: 3, defaultKey: 'lgCols' },
                    {
                        key: 'itemHeight', type: 'number', label: 'Item Height (px)', cols: 3, defaultKey: 'lgItemHeight',
                        hint: '0 = automatic tile height (default 60 px at runtime).'
                    },
                    {
                        key: 'itemWidth', type: 'number', label: 'Item Width (px)', cols: 3, defaultKey: 'lgItemWidth',
                        hint: '0 = flexible width (columns share available space).'
                    },
                    {
                        key: 'itemSpacing', type: 'number', label: 'Item Spacing (px)', cols: 3, defaultKey: 'lgItemSpacing',
                        hint: '0 = automatic spacing (default 8 px at runtime).'
                    }
                ]
            },
            (typeof DashboardAudio !== 'undefined' && DashboardAudio.schemaGroup)
                ? DashboardAudio.schemaGroup('lg_audio', LightGridWidget.AUDIO_TRIGGERS)
                : {
                    id: 'lg_audio', title: 'Audio', icon: 'ph-music-notes',
                    fields: [{ key: 'audio', type: 'audio_trigger_map', cols: 12, triggers: LightGridWidget.AUDIO_TRIGGERS }]
                },
            {
                id: 'lg_style', title: 'Appearance', icon: 'ph-palette',
                fields: [
                    { key: 'tileBackgroundColor', type: 'color', label: 'Tile Background Color', cols: 6, defaultKey: 'lgColTileBg' },
                    { key: 'tileHoverColor', type: 'color', label: 'Tile Hover Color', cols: 6, defaultKey: 'lgColTileHover' },
                    { key: 'tileBackgroundOpacity', type: 'number', min: 0, max: 100, label: 'Tile Background Opacity', cols: 6, defaultKey: 'lgTileBackgroundOpacity' },
                    { key: 'tileBlur', type: 'number', min: 0, label: 'Tile Background Blur', cols: 6, defaultKey: 'lgTileBlur' },
                    { key: 'tileOutlineWidth', type: 'number', min: 0, label: 'Tile Outline Width', cols: 4, gridColStart: 1, defaultKey: 'lgTileOutlineWidth' },
                    {
                        key: 'tileOutlineColor', type: 'color', label: 'Tile Outline Color', cols: 4, defaultKey: 'lgTileOutlineColor',
                        dependsOn: ['tileOutlineWidth', 'lgTileOutlineWidth'],
                        visibleWhen: (values, isGlobal) => BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'tileOutlineWidth', 'lgTileOutlineWidth')
                    },
                    {
                        key: 'tileOutlineOpacity', type: 'number', min: 0, max: 100, label: 'Tile Outline Opacity', cols: 4, defaultKey: 'lgTileOutlineOpacity',
                        dependsOn: ['tileOutlineWidth', 'lgTileOutlineWidth'],
                        visibleWhen: (values, isGlobal) => BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'tileOutlineWidth', 'lgTileOutlineWidth')
                    },
                    { key: 'tileInnerGlow', type: 'number', min: 0, label: 'Tile Inner Glow', cols: 4, gridColStart: 1, defaultKey: 'lgTileInnerGlow' },
                    {
                        key: 'tileInnerGlowColor', type: 'color', label: 'Tile Inner Glow Color', cols: 4, defaultKey: 'lgTileInnerGlowColor',
                        dependsOn: ['tileInnerGlow', 'lgTileInnerGlow'],
                        visibleWhen: (values) => LightGridWidget.tileInnerGlowDetailsVisible(values, false)
                    },
                    {
                        key: 'tileInnerGlowOpacity', type: 'number', min: 0, max: 100, label: 'Tile Inner Glow Opacity', cols: 4, defaultKey: 'lgTileInnerGlowOpacity',
                        dependsOn: ['tileInnerGlow', 'lgTileInnerGlow'],
                        visibleWhen: (values) => LightGridWidget.tileInnerGlowDetailsVisible(values, false)
                    },
                    { key: 'toggleColorOn', type: 'color', label: 'Toggle Color (On)', cols: 6, defaultKey: 'lgColToggleOn' },
                    { key: 'toggleColorOff', type: 'color', label: 'Toggle Color (Off)', cols: 6, defaultKey: 'lgColToggleOff' },
                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }
                ]
            },
            {
                id: 'lg_popover', title: 'Control Panel', icon: 'ph-browsers',
                fields: [
                    { key: 'alwaysShowPanel', type: 'checkbox', label: 'Always Show Panel', cols: 6 },
                    {
                        key: 'previewPopover', type: 'checkbox', label: 'Preview Panel If Selected', cols: 6,
                        visibleWhen: function (values) { return !values.alwaysShowPanel; },
                        dependsOn: ['alwaysShowPanel']
                    },
                    {
                        type: 'spacer', cols: 6,
                        visibleWhen: function (values) { return !!values.alwaysShowPanel; },
                        dependsOn: ['alwaysShowPanel']
                    },

                    {
                        key: 'autoDeselect', type: 'checkbox', label: 'Auto Deselect/Hide', cols: 6, defaultKey: 'lgAutoDeselect',
                        visibleWhen: function (values) { return !values.alwaysShowPanel; }, dependsOn: ['alwaysShowPanel']
                    },
                    {
                        key: 'deselectTime', type: 'number', label: 'Timeout (sec)', cols: 6, defaultKey: 'lgDeselectTime',
                        visibleWhen: function (values) { return !values.alwaysShowPanel; }, dependsOn: ['alwaysShowPanel']
                    },

                    { key: 'popoverOffX', type: 'number', label: 'Position X', cols: 6,
                        visibleWhen: function () {
                            return !(typeof MASTER_SETTINGS !== 'undefined'
                                && MASTER_SETTINGS && MASTER_SETTINGS.layoutMode === 'responsive');
                        },
                        dependsOn: ['layoutMode']
                    },
                    { key: 'popoverOffY', type: 'number', label: 'Position Y', cols: 6,
                        visibleWhen: function () {
                            return !(typeof MASTER_SETTINGS !== 'undefined'
                                && MASTER_SETTINGS && MASTER_SETTINGS.layoutMode === 'responsive');
                        },
                        dependsOn: ['layoutMode']
                    },

                    {
                        key: 'popoverW', type: 'number', label: 'Width', cols: 4, defaultKey: 'lgPopoverW',
                        hint: 'Responsive Columns: panel uses full column width.'
                    },
                    { key: 'popoverH', type: 'number', label: 'Height', cols: 4, defaultKey: 'lgPopoverH' },
                    { key: 'popoverCornerRadius', type: 'number', label: 'Radius', cols: 4, defaultKey: 'defaultCornerRadius' },

                    { key: 'popoverBgColStart', type: 'color', label: 'Background Start', cols: 3 },
                    { key: 'popoverBgOpacityStart', type: 'number', min: 0, max: 100, label: 'Opacity %', cols: 3 },
                    { key: 'popoverBgColEnd', type: 'color', label: 'Background End', cols: 3 },
                    { key: 'popoverBgOpacityEnd', type: 'number', min: 0, max: 100, label: 'Opacity %', cols: 3 },
                    { key: 'popoverBgAngle', type: 'number', label: 'Gradient Angle', cols: 12 },

                    { key: 'popoverBorderColor', type: 'color', label: 'Border Color', cols: 4 },
                    { key: 'popoverBorderWidth', type: 'number', label: 'Border Width', cols: 4 },
                    { key: 'popoverBorderOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 4 },

                    { key: 'popoverGlowEnabled', type: 'checkbox', label: 'Glow', cols: 4 },
                    { key: 'popoverGlowColor', type: 'color', label: 'Glow Color', cols: 4 },
                    { key: 'popoverGlowRadius', type: 'number', label: 'Glow Radius', cols: 4 },

                    { key: 'presetCols', type: 'number', label: 'Preset Columns', cols: 3, defaultKey: 'lgPresetCols' },
                    { key: 'presetRows', type: 'number', label: 'Preset Rows', cols: 3, defaultKey: 'lgPresetRows' },
                    { key: 'presetGap', type: 'number', label: 'Preset Gap', cols: 3, defaultKey: 'lgPresetGap' },
                    { key: 'presetIndicators', type: 'checkbox', label: 'Color/White Indicators', cols: 3, defaultKey: 'lgPresetIndicators' }
                ]
            },
            {
                id: 'lg_pop_slider', title: 'Panel Slider', icon: 'ph-sliders-horizontal',
                fields: [
                    { key: 'sliderTrackH', type: 'number', label: 'Track Height', cols: 4, defaultKey: 'defaultSliderTrackThick' },
                    { key: 'sliderFillH', type: 'number', label: 'Fill Height', cols: 4, defaultKey: 'defaultSliderFillThick' },
                    { key: 'sliderThumbSz', type: 'number', label: 'Thumb Size', cols: 4, defaultKey: 'defaultSliderThumbSz' },

                    { key: 'sliderColFill', type: 'color', label: 'Fill Color', cols: 4, defaultKey: 'sliderColFill' },
                    { key: 'sliderColTrack', type: 'color', label: 'Track Color', cols: 4, defaultKey: 'sliderColTrack' },
                    { key: 'sliderColThumb', type: 'color', label: 'Thumb Color', cols: 4, defaultKey: 'sliderColThumb' }
                ]
            },
            {
                id: 'lg_icon', title: 'Grid Icons', icon: 'ph-star',
                fields: [
                    { key: 'iconSize', type: 'number', label: 'Icon Size', cols: 12, defaultKey: 'lgIconSize' },
                    { key: 'iconColOff', type: 'color', label: 'Icon Color (Off)', cols: 6, defaultKey: 'lgIconColOff' },
                    { key: 'iconColOn', type: 'color', label: 'Icon Color (On)', cols: 6, defaultKey: 'lgIconColOn' },
                    { key: 'useLightColor', type: 'checkbox', label: 'Use Actual Light Color', cols: 12, defaultKey: 'lgUseLightColor' },
                    { key: 'iconColorize', type: 'checkbox', label: 'Mask/Colorize PNG Images', cols: 12, defaultKey: 'lgIconColorize' }
                ]
            },
            {
                id: 'lg_typo', title: 'Text & Typography', icon: 'ph-text-t',
                fields: [
                    { key: 'label', type: 'text', label: 'Widget Label', cols: 12 },
                    {
                        key: 'labelPos', type: 'select', label: 'Widget Label Position',
                        options: LightGridWidget.LIGHT_GRID_LABEL_POS_OPTIONS, cols: 12
                    },
                    LightGridWidget.buildTypographySchemaGroup('lgWidgetLabel', 'Widget Label', 'widgetLabel', {
                        exclude: ['opacity', 'italic'],
                        fontDefaultKey: 'fontFamily'
                    }),
                    LightGridWidget.buildTypographySchemaGroup('lgLightName', 'Light name', 'lightName', {
                        exclude: ['opacity', 'italic', 'offsetX', 'offsetY'],
                        fontDefaultKey: 'lgTileFont',
                        colorDefaultKey: 'lgColTileText',
                        boldDefaultKey: 'lgTileFontBold'
                    }),
                    LightGridWidget.buildTypographySchemaGroup('lgPanelTitle', 'Panel title', 'panelTitle', {
                        exclude: ['opacity', 'italic'],
                        fontDefaultKey: 'fontFamily'
                    })
                ]
            }
        ];
    }

    _updateSliderVisual(val) {
        if (!this.e || !this.e.popSliderFil) return;
        const c = this.config;
        const pct = Math.max(0, Math.min(1, val / 255));

        const gap = Math.max(0, (c.sliderTrackH - c.sliderFillH) / 2);
        const safePad = Math.max(c.sliderThumbSz / 2, gap);

        this.e.popSliderFil.style.width = `calc((${safePad}px + (100% - ${safePad * 2}px) * ${pct}) - ${gap}px)`;
        this.e.popSliderThb.style.left = `calc(${safePad}px + (100% - ${safePad * 2}px) * ${pct})`;
    }

    _buildBaseDOM() {
        const b = super._buildBaseDOM();

        b.container.classList.add('interactive');
        b.innerContent.style.overflow = 'hidden';
        b.innerContent.style.display = 'flex';
        b.innerContent.style.flexDirection = 'column';
        b.innerContent.style.alignItems = 'center';
        b.innerContent.style.justifyContent = 'center';

        const layout = document.createElement('div');
        layout.className = 'lg-layout';
        layout.style.display = 'flex';
        layout.style.alignItems = 'center';
        layout.style.justifyContent = 'center';
        layout.style.width = '100%';
        layout.style.height = '100%';

        const lbl = document.createElement('div');
        lbl.className = 'widget-label';
        lbl.style.letterSpacing = '1px';
        lbl.style.transition = 'all 0.2s';
        lbl.style.flexShrink = '0';
        lbl.style.width = '100%';

        const listWrap = document.createElement('div');
        listWrap.className = 'lg-list-wrap';
        listWrap.style.flex = '1';
        listWrap.style.width = '100%';
        listWrap.style.height = '100%';
        listWrap.style.minHeight = '0';

        // --- DECOUPLED POPOVER CONSTRUCTION ---
        const popover = document.createElement('div');
        popover.id = `lg-popover-${this.id}`;
        popover.className = 'lg-popover';
        popover.style.position = 'absolute';
        popover.style.display = 'none';
        popover.style.zIndex = '1000';
        popover.style.boxSizing = 'border-box';
        popover.style.transition = 'opacity 0.2s, outline 0.2s';

        const popOffCanvasFill = document.createElement('div');
        popOffCanvasFill.className = 'widget-off-canvas-fill';
        popOffCanvasFill.setAttribute('aria-hidden', 'true');
        popover.appendChild(popOffCanvasFill);

        const popContainer = document.createElement('div');
        popContainer.className = 'lg-popover-container';
        popContainer.style.cssText = 'position:relative; width:100%; height:100%; border-radius:inherit; display:flex; flex-direction:column; padding:16px; box-sizing:border-box; overflow:hidden; pointer-events:auto;';

        popContainer.innerHTML = `
            <div class="pop-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; position:relative; z-index:20;">
                <button class="pop-back" style="color:var(--ui-text-muted); background:none; border:none; cursor:pointer; padding:4px; z-index:30;"><i class="ph-bold ph-x text-lg pointer-events-none"></i></button>
                <div class="pop-title" style="letter-spacing:1px; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:0 8px; pointer-events:none;"></div>
                <div class="pop-icon" style="color:var(--ui-accent); font-size:20px; pointer-events:none;"></div>
            </div>
            <div class="pop-slider-c" style="margin-bottom:16px; position:relative; cursor:pointer; width:100%; display:flex; align-items:center; touch-action:none; z-index:30;">
                <div class="pop-slider-trk" style="position:absolute; left:0; top:50%; transform:translateY(-50%); width:100%; border-radius:99px; box-sizing:content-box;"></div>
                <div class="pop-slider-fil" style="position:absolute; left:0; top:50%; transform:translateY(-50%); border-radius:99px; pointer-events:none;"></div>
                <div class="pop-slider-thb" style="position:absolute; top:50%; transform:translate(-50%,-50%); border-radius:50%; box-shadow:0 2px 5px rgba(0,0,0,0.5); pointer-events:none;"></div>
            </div>
            <div class="pop-grid" style="display:grid; flex:1; position:relative; z-index:20;"></div>
            <div class="pop-locked-overlay" style="display:none; position:absolute; inset:0; border-radius:inherit; z-index:100; align-items:center; justify-content:center; pointer-events:none; background:rgba(0,0,0,0.5);">
                <i class="ph-fill ph-lock-key text-white text-3xl drop-shadow-md"></i>
            </div>
        `;
        popover.appendChild(popContainer);

        const handlesHtml = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d => `<div class="resize-handle rh-${d} pop-rh" data-dir="${d}"></div>`).join('');
        popover.insertAdjacentHTML('beforeend', handlesHtml);

        layout.appendChild(lbl);
        layout.appendChild(listWrap);
        b.innerContent.appendChild(layout);

        this.e = {
            layout: layout,
            lbl: lbl,
            listWrap: listWrap,
            popover: popover,
            popContainer: popContainer,
            popOffCanvasFill: popOffCanvasFill,
            popBack: popContainer.querySelector('.pop-back'),
            popTitle: popContainer.querySelector('.pop-title'),
            popIcon: popContainer.querySelector('.pop-icon'),
            popSliderC: popContainer.querySelector('.pop-slider-c'),
            popSliderTrk: popContainer.querySelector('.pop-slider-trk'),
            popSliderFil: popContainer.querySelector('.pop-slider-fil'),
            popSliderThb: popContainer.querySelector('.pop-slider-thb'),
            popGrid: popContainer.querySelector('.pop-grid'),
            popHandles: popover.querySelectorAll('.pop-rh'),
            popLockedOverlay: popContainer.querySelector('.pop-locked-overlay')
        };

        this.selectedLightIndex = null;
        this.lastRenderedConfigStr = "";
        this.tileElements = [];

        let isDraggingPop = false;
        let isResizingPop = false;
        let resizeDir = null;
        const self = this;

        if (typeof PointerDrag !== 'undefined') {
            popover.style.touchAction = 'none';
            PointerDrag.bind(popover, {
                raf: false,
                shouldStart: function () {
                    if (!Dashboard.isEditMode) return false;
                    if (LightGridWidget.isStackedControlPanelMode()) return false;
                    return true;
                },
                onDown: function (e) {
                    self._resetTimeout();
                    if (!Dashboard.selectedIds.includes(self.id)) {
                        Dashboard.selectWidget(self.id, !!(Dashboard._wantsAddToSelection && Dashboard._wantsAddToSelection(e)));
                    }
                    if (Dashboard.selectedIds.length > 1) {
                        Dashboard.handleWidgetMouseDown(e, self.id);
                        return false;
                    }
                    if (self.config && self.config.locked) return false;
                    isResizingPop = e.target.classList.contains('pop-rh');
                    isDraggingPop = !isResizingPop;
                    resizeDir = isResizingPop ? e.target.dataset.dir : null;
                    return {
                        startX: e.clientX,
                        startY: e.clientY,
                        startW: self.config.popoverW,
                        startH: self.config.popoverH,
                        startOffX: self.config.popoverOffX,
                        startOffY: self.config.popoverOffY,
                        beforePopover: {
                            popoverW: self.config.popoverW,
                            popoverH: self.config.popoverH,
                            popoverOffX: self.config.popoverOffX,
                            popoverOffY: self.config.popoverOffY
                        },
                        grid: MASTER_SETTINGS.snapToGrid ? MASTER_SETTINGS.gridSize : 1
                    };
                },
                onMove: function (em, ctx) {
                    if (!ctx) return;
                    const dx = em.clientX - ctx.startX;
                    const dy = em.clientY - ctx.startY;
                    const grid = ctx.grid;
                    if (isDraggingPop) {
                        self.update({
                            popoverOffX: Math.round((ctx.startOffX + dx) / grid) * grid,
                            popoverOffY: Math.round((ctx.startOffY + dy) / grid) * grid
                        });
                    } else if (isResizingPop && resizeDir) {
                        let newW = ctx.startW;
                        let newH = ctx.startH;
                        let newX = ctx.startOffX;
                        let newY = ctx.startOffY;
                        if (resizeDir.includes('e')) newW = ctx.startW + dx;
                        if (resizeDir.includes('w')) { newW = ctx.startW - dx; newX = ctx.startOffX + dx; }
                        if (resizeDir.includes('s')) newH = ctx.startH + dy;
                        if (resizeDir.includes('n')) { newH = ctx.startH - dy; newY = ctx.startOffY + dy; }
                        if (resizeDir.includes('e') || resizeDir.includes('w')) newW = Math.max(100, Math.round(newW / grid) * grid);
                        if (resizeDir.includes('s') || resizeDir.includes('n')) newH = Math.max(150, Math.round(newH / grid) * grid);
                        if (resizeDir.includes('w')) newX = Math.round(newX / grid) * grid;
                        if (resizeDir.includes('n')) newY = Math.round(newY / grid) * grid;
                        self.update({ popoverW: newW, popoverH: newH, popoverOffX: newX, popoverOffY: newY });
                    }
                },
                onUp: function (ev, ctx) {
                    const hadPopoverEdit = isDraggingPop || isResizingPop;
                    isDraggingPop = false;
                    isResizingPop = false;
                    resizeDir = null;
                    if (hadPopoverEdit && ctx && typeof Dashboard !== 'undefined') {
                        const afterPopover = {
                            popoverW: self.overrides.popoverW,
                            popoverH: self.overrides.popoverH,
                            popoverOffX: self.overrides.popoverOffX,
                            popoverOffY: self.overrides.popoverOffY
                        };
                        if (!Dashboard._isEqualJson(ctx.beforePopover, afterPopover) && Dashboard._recordHistoryEntry) {
                            Dashboard._recordHistoryEntry({
                                kind: 'widget-overrides',
                                id: self.id,
                                replace: false,
                                before: ctx.beforePopover,
                                after: afterPopover
                            });
                        }
                        if (!Dashboard._isEqualJson(ctx.beforePopover, afterPopover) && Dashboard.markUnsaved) {
                            Dashboard.markUnsaved();
                        }
                    }
                    if (typeof Editor !== 'undefined' && typeof Editor.notifyExternalWidgetChange === 'function') {
                        Editor.notifyExternalWidgetChange(self.id, true);
                    }
                }
            });
        }

        this.e.popBack.onclick = (e) => {
            e.stopPropagation();
            this.closePopover();
        };

        // --- Custom Div Slider Implementation ---
        const getClientX = (e) => (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;

        const handleSliderMove = (e) => {
            if (!this.isDraggingSlider || Dashboard.isEditMode) return;
            if (e.type === 'touchmove') e.preventDefault();

            this._resetTimeout();
            const rect = this.e.popSliderC.getBoundingClientRect();
            const c = this.config;
            const x = getClientX(e) - rect.left;

            const gap = Math.max(0, (c.sliderTrackH - c.sliderFillH) / 2);
            const safePad = Math.max(c.sliderThumbSz / 2, gap);
            const avail = rect.width - 2 * safePad;

            let pct = (x - safePad) / avail;
            pct = Math.max(0, Math.min(1, pct));

            this.currentSliderVal = Math.round(pct * 255);
            this._updateSliderVisual(this.currentSliderVal);
        };

        const handleSliderUp = (e) => {
            if (this.isDraggingSlider) {
                this.isDraggingSlider = false;
                if (this._activeSliderDragCleanup) {
                    this._activeSliderDragCleanup();
                } else {
                    document.removeEventListener('mousemove', handleSliderMove);
                    document.removeEventListener('mouseup', handleSliderUp);
                    document.removeEventListener('touchmove', handleSliderMove);
                    document.removeEventListener('touchend', handleSliderUp);
                }

                const light = this.config.lightsData[this.selectedLightIndex];
                if (!light || !light.topics) return;
                light.topics.forEach(t => {
                    if (t) Dashboard.send(t, { brightness: this.currentSliderVal });
                });
            }
        };

        const handleSliderDown = (e) => {
            if (Dashboard.isEditMode || this.config.deactivated) return;
            e.stopPropagation();
            if (e.type === 'touchstart') e.preventDefault();
            this.isDraggingSlider = true;
            handleSliderMove(e);

            const removeSliderDrag = () => {
                document.removeEventListener('mousemove', handleSliderMove);
                document.removeEventListener('mouseup', handleSliderUp);
                document.removeEventListener('touchmove', handleSliderMove);
                document.removeEventListener('touchend', handleSliderUp);
                this._activeSliderDragCleanup = null;
            };
            this._activeSliderDragCleanup = removeSliderDrag;

            if (e.type === 'mousedown') {
                document.addEventListener('mousemove', handleSliderMove);
                document.addEventListener('mouseup', handleSliderUp, { once: true });
            } else {
                document.addEventListener('touchmove', handleSliderMove, { passive: false });
                document.addEventListener('touchend', handleSliderUp, { once: true });
            }
        };

        this.e.popSliderC.addEventListener('mousedown', handleSliderDown);
        this.e.popSliderC.addEventListener('touchstart', handleSliderDown, { passive: false });

        return b;
    }

    /**
     * Floating control panel is mounted on the canvas, so hiding the wrapper does
     * not hide it. Page changes skip render(); stash the open display and put it
     * back on return. Stacked panels live inside the wrapper and need nothing.
     */
    syncPageCoverageChrome(onPage) {
        const pop = this.e && this.e.popover;
        if (!pop) return;
        const parent = pop.parentNode;
        if (!parent || parent.id !== 'dashboard-canvas') return;
        if (!onPage) {
            if (pop.style.display !== 'none') {
                this._popoverPageDisplay = pop.style.display;
                pop.style.display = 'none';
            }
            return;
        }
        if (this._popoverPageDisplay) {
            pop.style.display = this._popoverPageDisplay;
            this._popoverPageDisplay = '';
        }
    }

    render() {
        if (Dashboard.isEditMode) {
            const edSel = LightGridWidget.isWidgetSelectedInEditor(this.id);
            if (!edSel && !this.config.alwaysShowPanel) {
                this.selectedLightIndex = null;
            } else if (edSel && !this.config.alwaysShowPanel && !this.config.previewPopover) {
                this.selectedLightIndex = null;
            }
        }
        super.render();
        // Control popover visibility based on parent container rendering state.
        // A real render owns the panel; drop any page-switch stash so it cannot
        // reopen a panel this pass closed.
        if (this.e && this.e.popover) {
            this._popoverPageDisplay = '';
            if (this.elements.wrapper.style.display === 'none') {
                this.e.popover.style.display = 'none';
                if (!this.config.alwaysShowPanel) {
                    this.selectedLightIndex = null;
                } else {
                    this.renderEmptyPopover();
                }
                this._clearDeselectTimer();
            } else {
                // If it is on the current page, make sure the popover visibility matches the selection state
                if (Dashboard.isEditMode && !LightGridWidget.isWidgetSelectedInEditor(this.id) && !this.config.alwaysShowPanel) {
                    this.e.popover.style.display = 'none';
                } else if (this.selectedLightIndex === null) {
                    this.e.popover.style.display = this.config.alwaysShowPanel ? 'flex' : 'none';
                } else {
                    this.e.popover.style.display = 'flex';
                }
            }
        }
    }

    closePopover() {
        const hadSelection = this.selectedLightIndex != null;
        this.selectedLightIndex = null;
        this._clearDeselectTimer();

        if (!this.config.alwaysShowPanel) {
            this.e.popover.style.display = 'none';
        } else {
            this.renderEmptyPopover();
        }
        if (hadSelection && typeof DashboardAudio !== 'undefined') {
            DashboardAudio.playFrom(this.config.audio, 'panelClose');
        }
        this.renderLiveStates();
        this._requestStackedReflow();
    }

    renderEmptyPopover() {
        this.e.popover.style.display = 'flex';
        this.e.popover.style.opacity = '1';
        this.e.popover.style.pointerEvents = 'auto';
        this.e.popTitle.innerText = "No Light Selected";
        this.e.popIcon.innerHTML = '';
        this.e.popGrid.innerHTML = '';
        this.applyPopoverStyles();
    }

    openPopover(index, meta) {
        if (this.config.deactivated) return;
        if (Dashboard.isEditMode && !this.config.alwaysShowPanel) {
            if (!LightGridWidget.isWidgetSelectedInEditor(this.id)) return;
            if (!this.config.previewPopover) return;
        }

        const c = this.config;
        const light = c.lightsData[index];
        if (!light || LightGridWidget.isSwitchOutputMode(light)) return;

        const wasClosed = this.selectedLightIndex == null;
        const suppressIdleReset = meta && meta.suppressIdleReset === true;
        this.selectedLightIndex = index;
        if (wasClosed && typeof DashboardAudio !== 'undefined') {
            DashboardAudio.playFrom(this.config.audio, 'panelOpen');
        }
        if (!suppressIdleReset) {
            this._resetTimeout();
        }

        this.e.popover.style.opacity = '1';
        this.e.popover.style.pointerEvents = 'auto';

        this.e.popTitle.innerText = light.name || "Light";

        this.e.popIcon.innerHTML = '';
        this.e.popIcon.style.width = '20px';
        this.e.popIcon.style.height = '20px';
        this.e.popIcon.style.display = 'flex';
        this.e.popIcon.style.alignItems = 'center';
        this.e.popIcon.style.justifyContent = 'center';
        LightGridWidget.applyLightItemIconToWrap(this.e.popIcon, light, BaseWidget.resolveCssColor(c.iconColOn), c);

        const gridEl = this.e.popGrid;
        gridEl.innerHTML = '';

        const maxPresets = c.presetCols * c.presetRows;
        let presetsToUse = c.presets || [];

        if (light.overridePresets && Array.isArray(light.presets)) {
            presetsToUse = light.presets;
        }

        for (let i = 0; i < maxPresets; i++) {
            const preset = presetsToUse[i];
            const btn = document.createElement('button');
            btn.style.width = '100%';
            btn.style.height = '100%';
            btn.style.borderRadius = '8px';
            btn.style.border = '1px solid var(--ui-border)';
            btn.style.cursor = 'pointer';
            btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            btn.style.transition = 'transform 0.1s, border-color 0.2s';
            btn.style.pointerEvents = 'auto';
            btn.style.position = 'relative';

            if (preset) {
                let cssCol = '#1e293b';
                let mode = preset.color_mode || 'hs';
                const parsed = ColorUtils.parse(preset);
                if (parsed) cssCol = ColorUtils.toCss(parsed);
                btn.style.backgroundColor = cssCol;

                if (c.presetIndicators) {
                    const dot = document.createElement('div');
                    dot.style.position = 'absolute';
                    dot.style.bottom = '4px';
                    dot.style.right = '4px';
                    dot.style.width = '12px';
                    dot.style.height = '12px';
                    dot.style.borderRadius = '50%';
                    dot.style.boxShadow = '0 0 2px rgba(0,0,0,0.5)';
                    if (mode === 'color_temp') {
                        dot.style.background = '#ffffff';
                    } else {
                        dot.style.background = 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)';
                    }
                    btn.appendChild(dot);
                }

                btn.onmousedown = () => { this._resetTimeout(); btn.style.transform = 'scale(0.95)'; };
                btn.onmouseup = () => btn.style.transform = 'scale(1)';
                btn.onmouseleave = () => btn.style.transform = 'scale(1)';

                btn.onclick = (e) => {
                    e.stopPropagation();
                    if (preset && light.topics) {
                        light.topics.forEach(t => {
                            if (t) Dashboard.send(t, preset);
                        });
                    }
                };
            } else {
                btn.style.visibility = 'hidden';
                btn.style.pointerEvents = 'none';
            }

            gridEl.appendChild(btn);
        }

        this.e.popover.style.display = 'flex';
        this.applyPopoverStyles();
        this.renderLiveStates();
        this._requestStackedReflow();
    }

    applyPopoverStyles() {
        const c = this.config;
        const p = this.e.popover;
        const stacked = LightGridWidget.isStackedControlPanelMode();

        this.e.popBack.style.display = c.alwaysShowPanel ? 'none' : 'block';

        if (stacked) {
            p.style.width = '100%';
            p.style.height = `${c.popoverH}px`;
            p.style.left = '';
            p.style.top = '';
            p.style.marginTop = '8px';
            p.style.zIndex = '';
        } else {
            p.style.width = `${c.popoverW}px`;
            p.style.height = `${c.popoverH}px`;
            p.style.left = `${c.popoverOffX}px`;
            p.style.top = `${c.popoverOffY}px`;
            p.style.marginTop = '';
            p.style.zIndex = '1000';
        }
        p.style.borderRadius = `${c.popoverCornerRadius}px`;

        const pCont = this.e.popContainer || p;
        pCont.style.borderRadius = `${c.popoverCornerRadius}px`;

        const start = Dashboard.hexToRgba(BaseWidget.resolveCssColor(c.popoverBgColStart), c.popoverBgOpacityStart / 100);
        const end = Dashboard.hexToRgba(BaseWidget.resolveCssColor(c.popoverBgColEnd), c.popoverBgOpacityEnd / 100);
        pCont.style.background = `linear-gradient(${c.popoverBgAngle}deg, ${start}, ${end})`;

        const bdrCol = Dashboard.hexToRgba(BaseWidget.resolveCssColor(c.popoverBorderColor), c.popoverBorderOpacity / 100);
        pCont.style.border = `${c.popoverBorderWidth}px solid ${bdrCol}`;

        if (c.popoverGlowEnabled) {
            const glowRgba = Dashboard.hexToRgba(BaseWidget.resolveCssColor(c.popoverGlowColor), c.popoverGlowOpacity / 100);
            pCont.style.boxShadow = `0 0 ${c.popoverGlowRadius}px -5px ${glowRgba}`;
        } else if (stacked) {
            pCont.style.boxShadow = 'none';
        } else {
            pCont.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
        }

        if (pCont !== p) {
            p.style.background = 'transparent';
            p.style.border = 'none';
            p.style.boxShadow = 'none';
        }

        if (!stacked) {
            BaseWidget.syncCompanionCanvasClipping(p, this.e.popContainer, c.popoverOffX, c.popoverOffY, c.popoverW, c.popoverH);
        } else {
            BaseWidget.syncCompanionCanvasClipping(p, this.e.popContainer, 0, 0, 0, 0);
        }

        this.applyTypographyToElement(this.e.popTitle, 'lgPanelTitle', c, {});
        this.e.popTitle.style.transform = `translate(${c.lgPanelTitleOffX || 0}px, ${c.lgPanelTitleOffY || 0}px)`;

        this.e.popGrid.style.gridTemplateColumns = `repeat(${c.presetCols}, 1fr)`;
        this.e.popGrid.style.gridTemplateRows = `repeat(${c.presetRows}, 1fr)`;
        this.e.popGrid.style.gap = `${c.presetGap}px`;

        const psc = this.e.popSliderC;
        const pst = this.e.popSliderTrk;
        const psf = this.e.popSliderFil;
        const psth = this.e.popSliderThb;

        psc.style.height = `${Math.max(c.sliderTrackH, c.sliderFillH, c.sliderThumbSz)}px`;

        pst.style.height = `${c.sliderTrackH}px`;
        pst.style.backgroundColor = BaseWidget.resolveCssColor(c.sliderColTrack);

        const gap = Math.max(0, (c.sliderTrackH - c.sliderFillH) / 2);
        psf.style.height = `${c.sliderFillH}px`;
        psf.style.backgroundColor = BaseWidget.resolveCssColor(c.sliderColFill);
        psf.style.left = `${gap}px`;

        psth.style.width = `${c.sliderThumbSz}px`;
        psth.style.height = `${c.sliderThumbSz}px`;
        psth.style.backgroundColor = BaseWidget.resolveCssColor(c.sliderColThumb);

        if (c.locked && Dashboard.isEditMode) {
            if (this.e.popLockedOverlay) {
                this.e.popLockedOverlay.style.display = 'flex';
                this.e.popLockedOverlay.style.pointerEvents = 'auto';
            }
        } else {
            if (this.e.popLockedOverlay) this.e.popLockedOverlay.style.display = 'none';
        }

        if (stacked) {
            p.classList.remove('selected', 'multi-selected', 'is-selected');
            p.style.outline = '';
            p.style.outlineOffset = '';
            p.style.boxShadow = '';
            this.e.popHandles.forEach(h => h.style.display = 'none');
        } else if (Dashboard.isEditMode) {
            const ids = (Array.isArray(Dashboard.selectedIds)) ? Dashboard.selectedIds : [];
            const isSelected = ids.includes(this.id);
            const isSingle = isSelected && ids.length === 1;
            const isMulti = isSelected && ids.length > 1;
            p.classList.toggle('selected', !!isSingle);
            p.classList.toggle('multi-selected', !!isMulti);
            p.classList.toggle('is-selected', !!isSelected);
            p.style.outline = '';
            p.style.outlineOffset = '';
            p.style.boxShadow = '';
            const showHandles = isSingle && !c.locked;
            this.e.popHandles.forEach(h => h.style.display = showHandles ? 'block' : 'none');
        } else {
            p.classList.remove('selected', 'multi-selected', 'is-selected');
            p.style.outline = '';
            p.style.outlineOffset = '';
            p.style.boxShadow = '';
            this.e.popHandles.forEach(h => h.style.display = 'none');
        }
    }

    _renderSpecific() {
        this._syncPopoverMount();
        this._applyStackedLayoutStyles();

        this._lastGridX = this.overrides.x;
        this._lastGridY = this.overrides.y;

        const c = this.config;
        const e = this.e;

        e.lbl.textContent = c.label;
        e.lbl.style.display = c.label ? 'block' : 'none';
        e.lbl.style.margin = '0';
        this.applyTypographyToElement(e.lbl, 'lgWidgetLabel', c, {});
        e.lbl.style.transform = `translate(${c.lgWidgetLabelOffX || 0}px, ${c.lgWidgetLabelOffY || 0}px)`;

        const labelPlacement = LightGridWidget.parseWidgetLabelPosition(c.labelPos);
        e.layout.style.flexDirection = 'column';
        e.lbl.style.marginLeft = '0';
        e.lbl.style.marginRight = '0';
        e.lbl.style.textAlign = labelPlacement.horizontal === 'left'
            ? 'left'
            : (labelPlacement.horizontal === 'right' ? 'right' : 'center');
        if (labelPlacement.vertical === 'top') {
            e.lbl.style.marginBottom = '8px';
            e.lbl.style.marginTop = '0';
            e.layout.insertBefore(e.lbl, e.listWrap);
        } else {
            e.lbl.style.marginTop = '8px';
            e.lbl.style.marginBottom = '0';
            e.layout.appendChild(e.lbl);
        }

        const configStr = JSON.stringify({
            data: c.lightsData, cols: c.cols, gap: c.itemSpacing, height: c.itemHeight, width: c.itemWidth,
            bg: c.colTileBg, hov: c.colTileHover,
            bgOp: c.tileBackgroundOpacity, outW: c.tileOutlineWidth, outC: c.tileOutlineColor, outOp: c.tileOutlineOpacity,
            blur: c.tileBlur, ig: c.tileInnerGlow, igC: c.tileInnerGlowColor, igOp: c.tileInnerGlowOpacity,
            iSize: c.iconSize, iColOn: c.iconColOn, iColOff: c.iconColOff, iMask: c.iconColorize,
            typo: LightGridWidget.typographyRolesSignature(c),
            themeSig: BaseWidget.getThemeColorsSignature()
        });

        if (this.lastRenderedConfigStr !== configStr) {
            this.lastRenderedConfigStr = configStr;
            this.buildGridDOM();
        } else if (this.tileElements && this.tileElements.length) {
            this.tileElements.forEach((tile) => {
                if (tile.textWrap) {
                    this.applyTypographyToElement(tile.textWrap, 'lgLightName', c, {});
                }
            });
        }

        if (Dashboard.isEditMode) {
            this._wasEditMode = true;
            this._clearDeselectTimer();

            if (c.alwaysShowPanel) {
                const firstLightIdx = LightGridWidget.indexOfFirstLightOutputMode(c.lightsData);
                if (firstLightIdx >= 0 && this.selectedLightIndex === null) {
                    this.openPopover(firstLightIdx);
                } else if (this.selectedLightIndex === null) {
                    this.renderEmptyPopover();
                }
            } else if (!LightGridWidget.isWidgetSelectedInEditor(this.id)) {
                this.e.popover.style.display = 'none';
            } else if (c.previewPopover && c.lightsData.length > 0) {
                const firstLightIdx = LightGridWidget.indexOfFirstLightOutputMode(c.lightsData);
                if (firstLightIdx >= 0 && this.selectedLightIndex === null) {
                    this.openPopover(firstLightIdx);
                }
            } else {
                this.e.popover.style.display = 'none';
            }
        } else {
            if (this._wasEditMode) {
                this._wasEditMode = false;
                this.selectedLightIndex = null;
            }
            if (this.selectedLightIndex === null) {
                if (c.alwaysShowPanel) {
                    this.renderEmptyPopover();
                } else {
                    this.e.popover.style.display = 'none';
                }
            }
        }

        if (this.e.popover.style.display !== 'none') {
            this.applyPopoverStyles();
            this._updateSliderVisual(this.currentSliderVal);
        }

        if (this.selectedLightIndex !== null && this.e.popover.style.display !== 'none') {
            const currentLight = c.lightsData[this.selectedLightIndex];
            if (!currentLight || LightGridWidget.isSwitchOutputMode(currentLight)) {
                this.closePopover();
            } else {
            const pStr = JSON.stringify({
                cols: c.presetCols, rows: c.presetRows, gap: c.presetGap,
                presets: c.presets, override: currentLight ? currentLight.presets : null,
                indicators: c.presetIndicators
            });
            if (this._lastPStr !== pStr) {
                this._lastPStr = pStr;
                this.openPopover(this.selectedLightIndex, { suppressIdleReset: true });
            }
            }
        }

        this.renderLiveStates();
    }

    /**
     * Local visual state for a switch tile, shown until its bound state topic delivers
     * the next value. Never written to Dashboard.liveData.
     */
    _setOptimisticItemState(index, isOn) {
        const stTopic = typeof BindingsTree !== 'undefined'
            ? BindingsTree.getAtPath(this.bindings, LightGridWidget.lightItemBindingPath(index, 'state'))
            : undefined;
        if (!this._optimisticItemStates) this._optimisticItemStates = {};
        if (stTopic && typeof stTopic === 'string' && String(stTopic).trim()) {
            this._optimisticItemStates[index] = isOn;
        } else {
            delete this._optimisticItemStates[index];
        }
    }

    onIncomingData(topic, payload, count) {
        if (this._optimisticItemStates && typeof BindingsTree !== 'undefined') {
            Object.keys(this._optimisticItemStates).forEach((key) => {
                const stTopic = BindingsTree.getAtPath(this.bindings, LightGridWidget.lightItemBindingPath(Number(key), 'state'));
                if (stTopic === topic) delete this._optimisticItemStates[key];
            });
        }
        return super.onIncomingData(topic, payload, count);
    }

    toggleLightSwitchItem(light, index) {
        if (Dashboard.isEditMode || this.config.deactivated) return;
        if (!light || !LightGridWidget.isSwitchOutputMode(light)) return;

        const newState = !LightGridWidget.getLightSwitchItemState(light);
        const stateKey = `item_${index}_state`;
        this._setOptimisticItemState(index, newState);
        LightGridWidget.executeLightSwitchAction({ ...light, state: newState }, newState);
        if (typeof DashboardAudio !== 'undefined') {
            DashboardAudio.playFrom(this.config.audio, newState ? 'tileOn' : 'tileOff');
        }
        this.update({ [stateKey]: newState });
    }

    buildGridDOM() {
        const c = this.config;
        this.e.listWrap.innerHTML = '';
        this.tileElements = [];

        this.e.listWrap.style.overflowY = 'auto';
        this.e.listWrap.style.overflowX = 'hidden';
        this.e.listWrap.style.display = 'block';

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        const hasFixedItemWidth = c.itemWidth != null && c.itemWidth > 0;
        grid.style.gridTemplateColumns = hasFixedItemWidth
            ? `repeat(${c.cols}, ${c.itemWidth}px)`
            : `repeat(${c.cols}, 1fr)`;
        grid.style.gap = `${c.itemSpacing}px`;
        grid.style.padding = '8px';

        c.lightsData.forEach((light, index) => {
            const tile = document.createElement('div');

            tile.style.height = `${c.itemHeight}px`;
            if (hasFixedItemWidth) {
                tile.style.width = `${c.itemWidth}px`;
                tile.style.maxWidth = `${c.itemWidth}px`;
            }
            this._paintTileChrome(tile, c);
            tile.style.borderRadius = '12px';
            tile.style.display = 'flex';
            tile.style.alignItems = 'center';
            tile.style.padding = '0 12px';
            tile.style.cursor = 'pointer';
            tile.style.transition = 'background 0.2s, box-shadow 0.2s';
            tile.style.boxSizing = 'border-box';
            tile.style.position = 'relative';
            tile.style.zIndex = '10';

            tile.onmouseenter = () => { if (!Dashboard.isEditMode && !this.config.deactivated) tile.style.backgroundColor = BaseWidget.colorAtOpacity(this.config.colTileHover, this.config.tileBackgroundOpacity); };
            tile.onmousemove = () => { if (!Dashboard.isEditMode && !this.config.deactivated) tile.style.backgroundColor = BaseWidget.colorAtOpacity(this.config.colTileHover, this.config.tileBackgroundOpacity); };
            tile.onmouseleave = () => {
                tile.style.backgroundColor = this.config.deactivated
                    ? BaseWidget.getDeactivatedColor(this.config)
                    : BaseWidget.colorAtOpacity(this.config.colTileBg, this.config.tileBackgroundOpacity);
            };

            tile.onclick = (e) => {
                e.stopPropagation();
                if (Dashboard.isEditMode || this.config.deactivated) return;

                if (LightGridWidget.isSwitchOutputMode(light)) {
                    this.toggleLightSwitchItem(light, index);
                    return;
                }

                if (this.selectedLightIndex === index) {
                    this.closePopover();
                } else {
                    this.openPopover(index);
                }
            };

            const iconWrap = document.createElement('div');
            iconWrap.className = 'tile-icon';
            iconWrap.style.width = `${c.iconSize}px`;
            iconWrap.style.height = `${c.iconSize}px`;
            iconWrap.style.marginRight = '12px';
            iconWrap.style.display = 'flex';
            iconWrap.style.alignItems = 'center';
            iconWrap.style.justifyContent = 'center';
            iconWrap.style.transition = 'color 0.3s, filter 0.3s';
            iconWrap.style.flexShrink = '0';

            iconWrap.innerHTML = '';
            iconWrap.style.fontSize = `${c.iconSize}px`;
            LightGridWidget.applyLightItemIconToWrap(iconWrap, light, BaseWidget.resolveCssColor(c.iconColOff), c);

            const textWrap = document.createElement('div');
            textWrap.style.flex = '1';
            textWrap.style.whiteSpace = 'nowrap';
            textWrap.style.overflow = 'hidden';
            textWrap.style.textOverflow = 'ellipsis';
            textWrap.innerText = light.name || 'Unknown';
            this.applyTypographyToElement(textWrap, 'lgLightName', c, {});

            const toggleWrap = document.createElement('div');
            toggleWrap.className = 'tile-toggle';
            toggleWrap.style.width = '44px';
            toggleWrap.style.height = '24px';
            toggleWrap.style.borderRadius = '12px';
            toggleWrap.style.background = BaseWidget.resolveCssColor(c.colToggleOff);
            toggleWrap.style.position = 'relative';
            toggleWrap.style.transition = 'background 0.3s';
            toggleWrap.style.flexShrink = '0';

            const thumb = document.createElement('div');
            thumb.className = 'tile-thumb';
            thumb.style.width = '18px';
            thumb.style.height = '18px';
            thumb.style.background = '#fff';
            thumb.style.borderRadius = '50%';
            thumb.style.position = 'absolute';
            thumb.style.top = '3px';
            thumb.style.left = '3px';
            thumb.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            toggleWrap.appendChild(thumb);

            toggleWrap.onclick = (e) => {
                e.stopPropagation();
                if (Dashboard.isEditMode || this.config.deactivated) return;

                if (LightGridWidget.isSwitchOutputMode(light)) {
                    this.toggleLightSwitchItem(light, index);
                    return;
                }

                let primaryTopic = light.topics && light.topics.length > 0 ? light.topics[0] : null;
                if (!primaryTopic) return;

                const state = Dashboard.liveData[primaryTopic];
                let isOn = false;

                if (typeof state === 'object' && state !== null) {
                    isOn = state.state === "ON" || state.state === true;
                } else {
                    isOn = state === true || state === "ON" || state === "1" || parseFloat(state) > 0;
                }

                const isJson = primaryTopic.includes('light_state_json') || (typeof state === 'object' && state !== null);
                const newPayload = isJson ? { state: isOn ? "OFF" : "ON" } : !isOn;

                if (typeof DashboardAudio !== 'undefined') {
                    DashboardAudio.playFrom(this.config.audio, isOn ? 'tileOff' : 'tileOn');
                }

                light.topics.forEach(t => {
                    if (t) Dashboard.send(t, newPayload);
                });

                if (this.e.popover.style.display !== 'none' || this.config.alwaysShowPanel) {
                    this.openPopover(index);
                }
            };

            tile.appendChild(iconWrap);
            tile.appendChild(textWrap);
            tile.appendChild(toggleWrap);

            if (c.deactivated) {
                const deactColor = BaseWidget.getDeactivatedColor(c);
                const accentColor = BaseWidget.getDeactivatedColorAccent(c);
                tile.style.backgroundColor = deactColor;
                tile.style.cursor = 'default';
                const tilePe = !Dashboard.isEditMode ? 'none' : '';
                if (tile.style.pointerEvents !== tilePe) tile.style.pointerEvents = tilePe;
                if (toggleWrap.style.pointerEvents !== tilePe) toggleWrap.style.pointerEvents = tilePe;
                textWrap.style.color = accentColor;
                toggleWrap.style.background = deactColor;
                toggleWrap.style.cursor = 'default';
            }
            grid.appendChild(tile);

            this.tileElements.push({
                dom: tile,
                iconWrap: iconWrap,
                textWrap: textWrap,
                toggle: toggleWrap,
                thumb: thumb,
                topics: light.topics || [],
                light: light,
                isSwitchMode: LightGridWidget.isSwitchOutputMode(light)
            });
        });

        this.e.listWrap.appendChild(grid);
    }

    renderLiveStates() {
        const c = this.config;

        if (c.deactivated) {
            this._wasDeactivated = true;
            const deactColor = BaseWidget.getDeactivatedColor(c);
            const accentColor = BaseWidget.getDeactivatedColorAccent(c);
            if (c.label) {
                this.e.lbl.style.display = 'block';
                this.e.lbl.style.color = accentColor;
            } else {
                this.e.lbl.style.display = 'none';
            }
            this.e.popover.style.display = 'none';
            this.tileElements.forEach((tile) => {
                tile.dom.style.backgroundColor = deactColor;
                tile.dom.style.borderColor = 'transparent';
                tile.dom.style.boxShadow = 'none';
                tile.dom.style.cursor = 'default';
                if (tile.textWrap) {
                    tile.textWrap.style.display = '';
                    tile.textWrap.style.color = accentColor;
                }
                if (tile.iconWrap) {
                    tile.iconWrap.style.display = '';
                    tile.iconWrap.style.color = accentColor;
                    tile.iconWrap.style.setProperty('--icon-secondary-color', accentColor);
                    const iTag = tile.iconWrap.querySelector('i, svg');
                    if (iTag) iTag.style.color = accentColor;
                }
                if (tile.toggle) {
                    tile.toggle.style.display = '';
                    tile.toggle.style.background = deactColor;
                }
                if (tile.thumb) {
                    tile.thumb.style.background = accentColor;
                }
            });
            return;
        }

        if (this._wasDeactivated) {
            this._wasDeactivated = false;
            if (c.label) {
                this.applyTypographyToElement(this.e.lbl, 'lgWidgetLabel', c, {});
            }
            this.tileElements.forEach((tile) => {
                this._paintTileChrome(tile.dom, c);
                tile.dom.style.cursor = '';
                if (tile.textWrap) {
                    this.applyTypographyToElement(tile.textWrap, 'lgLightName', c, {});
                }
                if (tile.thumb) {
                    tile.thumb.style.background = '#fff';
                }
            });
        }

        this.tileElements.forEach((tile, index) => {
            const light = tile.light || (c.lightsData && c.lightsData[index]) || null;
            let primaryTopic = tile.topics.length > 0 ? tile.topics[0] : null;
            const rawData = primaryTopic ? Dashboard.liveData[primaryTopic] : null;

            let isOn = false;
            let cssColor = BaseWidget.resolveCssColor(c.colToggleOn);
            let bri = 255;

            if (tile.isSwitchMode && light) {
                isOn = LightGridWidget.lightSwitchItemIsOn(light);
            } else if (rawData) {
                const look = LightGridWidget.liveLightAppearance(rawData);
                isOn = look.on;
                bri = look.brightness;
                if (look.cssColor) cssColor = look.cssColor;
            }

            const tileActiveColor = (!tile.isSwitchMode && c.useLightColor) ? cssColor : BaseWidget.resolveCssColor(c.colToggleOn);

            if (c.deactivated) {
                const deactColor = BaseWidget.getDeactivatedColor(c);
                const accentColor = BaseWidget.getDeactivatedColorAccent(c);
                tile.toggle.style.background = deactColor;
                tile.thumb.style.transform = isOn ? 'translateX(20px)' : 'translateX(0)';
                tile.iconWrap.style.color = accentColor;
                tile.iconWrap.style.filter = 'none';
            } else if (isOn) {
                tile.toggle.style.background = tileActiveColor;
                tile.thumb.style.transform = 'translateX(20px)';
                tile.iconWrap.style.color = BaseWidget.resolveCssColor(
                    (!tile.isSwitchMode && c.useLightColor)
                        ? tileActiveColor
                        : (c.iconColOn !== c.colToggleOn ? c.iconColOn : tileActiveColor)
                );
                tile.iconWrap.style.filter = `drop-shadow(0 0 6px ${tileActiveColor}80)`;
            } else {
                tile.toggle.style.background = BaseWidget.resolveCssColor(c.colToggleOff);
                tile.thumb.style.transform = 'translateX(0)';
                tile.iconWrap.style.color = BaseWidget.resolveCssColor(c.iconColOff);
                tile.iconWrap.style.filter = 'none';
            }

            const tileIg = BaseWidget.elementInnerGlowShadow(c.tileInnerGlow, c.tileInnerGlowColor, c.tileInnerGlowOpacity);
            if (!tile.isSwitchMode && this.selectedLightIndex === index) {
                tile.dom.style.borderColor = tileActiveColor;
                tile.dom.style.boxShadow = tileIg ? (`0 0 10px ${tileActiveColor}40, ` + tileIg) : `0 0 10px ${tileActiveColor}40`;
            } else if (c.tileOutlineWidth > 0) {
                tile.dom.style.borderColor = BaseWidget.colorAtOpacity(c.tileOutlineColor, c.tileOutlineOpacity);
                tile.dom.style.boxShadow = tileIg;
            } else {
                tile.dom.style.borderColor = 'transparent';
                tile.dom.style.boxShadow = 'none';
            }

            if (!tile.isSwitchMode && this.selectedLightIndex === index && this.e.popover.style.display !== 'none') {
                if (!this.isDraggingSlider) {
                    this.currentSliderVal = bri;
                    this._updateSliderVisual(bri);
                }
            }
        });
    }
}

WidgetRegistry.register('lightgrid', LightGridWidget);
