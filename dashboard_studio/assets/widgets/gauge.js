class GaugeWidget extends BaseWidget {
    static get metadata() {
        return { shortName: "Gauge", label: "Gauge", icon: "ph-gauge", category: "Data", color_dark: "hsl(190, 80%, 65%)", color_light: "hsl(190, 85%, 35%)", version: "2.3.1", date: "2026-11-02" };
    }

    static _firstColor() {
        for (let i = 0; i < arguments.length; i++) {
            const v = arguments[i];
            if (v === undefined || v === null || v === '') continue;
            return v;
        }
        return '#888888';
    }

    /** Theme tokens, color objects, and CSS strings become an opaque hex paint color. */
    static _rgbTriple(raw) {
        const fallback = [136, 136, 136];
        let v = raw;
        if (typeof BaseWidget !== 'undefined' && BaseWidget.resolveCssColor) {
            v = BaseWidget.resolveCssColor(raw);
        }
        if (v && typeof v === 'object' && typeof ColorUtils !== 'undefined' && ColorUtils.parse) {
            const hsvObj = ColorUtils.parse(v);
            if (hsvObj) {
                const rgbObj = ColorUtils.hsvToRgb(hsvObj.h, hsvObj.s, hsvObj.v);
                return [rgbObj.r, rgbObj.g, rgbObj.b];
            }
            return fallback;
        }
        if (typeof v !== 'string') return fallback;
        const s = v.trim();
        if (s.charAt(0) === '#') {
            let h = s.slice(1);
            if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
            if (/^[0-9a-fA-F]{6}/.test(h)) {
                return [
                    parseInt(h.substr(0, 2), 16),
                    parseInt(h.substr(2, 2), 16),
                    parseInt(h.substr(4, 2), 16)
                ];
            }
        }
        if (typeof ColorUtils !== 'undefined' && ColorUtils.parse) {
            const hsv = ColorUtils.parse(s);
            if (hsv) {
                const rgb = ColorUtils.hsvToRgb(hsv.h, hsv.s, hsv.v);
                return [rgb.r, rgb.g, rgb.b];
            }
        }
        return fallback;
    }

    static _hexFromRgb(r, g, b) {
        const toHex = function (n) {
            const clamped = Math.max(0, Math.min(255, Math.round(n)));
            const s = clamped.toString(16);
            return s.length === 1 ? '0' + s : s;
        };
        return '#' + toHex(r) + toHex(g) + toHex(b);
    }

    static _paintColor(raw) {
        const rgb = GaugeWidget._rgbTriple(raw);
        return GaugeWidget._hexFromRgb(rgb[0], rgb[1], rgb[2]);
    }

    static _blendColors(a, b) {
        const t1 = GaugeWidget._rgbTriple(a);
        const t2 = GaugeWidget._rgbTriple(b);
        return GaugeWidget._hexFromRgb((t1[0] + t2[0]) / 2, (t1[1] + t2[1]) / 2, (t1[2] + t2[2]) / 2);
    }

    static _lerpColors(a, b, t) {
        const clampT = Math.max(0, Math.min(Number(t), 1));
        const t1 = GaugeWidget._rgbTriple(a);
        const t2 = GaugeWidget._rgbTriple(b);
        return GaugeWidget._hexFromRgb(
            t1[0] + (t2[0] - t1[0]) * clampT,
            t1[1] + (t2[1] - t1[1]) * clampT,
            t1[2] + (t2[2] - t1[2]) * clampT
        );
    }

    /** Sample col0 → colMid (50%) → col100 at normalized position t (0–1). */
    static _sampleGaugeGradientColor(col0, colMid, col100, t) {
        const clampT = Math.max(0, Math.min(Number(t), 1));
        const c0 = GaugeWidget._paintColor(col0);
        const cMid = GaugeWidget._paintColor(colMid);
        const c100 = GaugeWidget._paintColor(col100);
        if (clampT <= 0.5) {
            return GaugeWidget._lerpColors(c0, cMid, clampT * 2);
        }
        return GaugeWidget._lerpColors(cMid, c100, (clampT - 0.5) * 2);
    }

    /**
     * Horizontal bar fill. Baseline maps middle → start/end across the full track,
     * not only across the drawn segment.
     */
    static _barFillCss(c, spec) {
        const op = c && c.barOpacity;
        const paint = function (raw) {
            const hex = GaugeWidget._paintColor(raw);
            if (op === undefined || op === null || Number(op) >= 100) return hex;
            return BaseWidget.colorAtOpacity(hex, op);
        };
        if (!spec) return paint(c && c.colMid);
        if (spec.solid) return paint(spec.solid);
        if (spec.atBaseline) return paint(c.colMid);
        if (spec.baseline) {
            const midR = paint(c.colMid);
            const endR = paint(spec.goingForward ? c.col100 : c.col0);
            if (spec.goingForward) {
                const fullRange = Math.max(0.001, 1 - spec.baselinePct);
                const stop = (fullRange / Math.max(0.001, spec.valuePct - spec.baselinePct) * 100).toFixed(2);
                return 'linear-gradient(90deg, ' + midR + ' 0%, ' + endR + ' ' + stop + '%)';
            }
            const fullRangeBack = Math.max(0.001, spec.baselinePct);
            const stopBack = (fullRangeBack / Math.max(0.001, spec.baselinePct - spec.valuePct) * 100).toFixed(2);
            return 'linear-gradient(270deg, ' + midR + ' 0%, ' + endR + ' ' + stopBack + '%)';
        }
        return 'linear-gradient(90deg, ' + paint(c.col0) + ', '
            + paint(c.colMid) + ' 50%, ' + paint(c.col100) + ')';
    }

    static _setStopColor(stopEl, color) {
        if (!stopEl) return;
        const next = GaugeWidget._paintColor(color);
        if (stopEl.getAttribute('stop-color') !== next) {
            stopEl.setAttribute('stop-color', next);
        }
        if (stopEl.style && stopEl.style.stopColor) stopEl.style.stopColor = '';
    }

    /** Decimal formatting for remapped display values when customDisplayRange is enabled. */
    static resolveGaugeDisplayFormat(c) {
        if (!c || !c.customDisplayRange) {
            return {
                decimalPlaces: Math.max(0, Math.floor(BaseWidget.toFiniteNumber(c.decimalPlaces, 1))),
                keepTrailingZeros: !!c.keepTrailingZeros
            };
        }
        return {
            decimalPlaces: Math.max(0, Math.floor(BaseWidget.toFiniteNumber(c.displayDecimalPlaces, 1))),
            keepTrailingZeros: !!c.displayKeepTrailingZeros
        };
    }

    /** Remap raw value to display range when customDisplayRange is enabled. */
    static mapGaugeDisplayValue(rawValue, c) {
        if (!c || !c.customDisplayRange) return rawValue;
        const min = BaseWidget.toFiniteNumber(c.min, 0);
        const max = BaseWidget.toFiniteNumber(c.max, 100);
        const signedRange = max - min;
        if (Math.abs(signedRange) < 1e-12) {
            return BaseWidget.toFiniteNumber(c.displayMin, 0);
        }
        const t = Math.max(0, Math.min((BaseWidget.toFiniteNumber(rawValue, 0) - min) / signedRange, 1));
        const dMin = BaseWidget.toFiniteNumber(c.displayMin, 0);
        const dMax = BaseWidget.toFiniteNumber(c.displayMax, 100);
        return dMin + t * (dMax - dMin);
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

    /** Master panel flat keys for gauge default icon slot (not instance `icons.on`). */
    static get GAUGE_MASTER_ICON_KEYMAP() {
        return {
            source: 'defaultGaugeIconSource',
            builtin: 'defaultGaugeIconOn',
            weight: 'defaultGaugeIconWeight',
            customUrl: 'defaultGaugeIconCustomUrl',
            tintImage: 'defaultGaugeIconTintImage',
            color: 'gaugeColIcon'
        };
    }

    static defaultIconSlot() {
        if (typeof MenuWidget !== 'undefined' && MenuWidget.defaultIconSlot) {
            return MenuWidget.defaultIconSlot();
        }
        return { source: 'phosphor', builtin: '', weight: 'fill', customUrl: '', tintImage: false };
    }

    static gaugeIconOptionsVisible(values, isGlobal) {
        if (isGlobal) return values.defaultGaugeShowIcon !== false;
        const raw = values.showIcon !== undefined && values.showIcon !== null
            ? values.showIcon
            : values.defaultGaugeShowIcon;
        return raw !== false;
    }

    static attachGaugeIconSectionVisibility(field) {
        if (!field) return;
        const prevVisibleWhen = field.visibleWhen;
        field.visibleWhen = function (values, isGlobal) {
            if (!GaugeWidget.gaugeIconOptionsVisible(values, isGlobal)) return false;
            if (typeof prevVisibleWhen === 'function') return prevVisibleWhen(values, isGlobal);
            return true;
        };
        const dep = ['showIcon', 'defaultGaugeShowIcon'];
        if (Array.isArray(field.dependsOn)) {
            dep.forEach((k) => {
                if (field.dependsOn.indexOf(k) < 0) field.dependsOn.push(k);
            });
        } else {
            field.dependsOn = dep;
        }
        if (field.type === 'icon_style' && Array.isArray(field.fields)) {
            field.fields.forEach((sub) => GaugeWidget.attachGaugeIconSectionVisibility(sub));
        }
    }

    /** True when legacy stored an explicit empty icon (not merely absent overrides). */
    static legacyGaugeIconExplicitlyEmpty(o) {
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
    }

    static defaultGaugeIconSlotFromMaster(M) {
        M = M || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {});
        const slot = GaugeWidget.defaultIconSlot();
        const src = M.defaultGaugeIconSource;
        if (src === 'custom' || src === 'phosphor') slot.source = src;
        const builtin = M.defaultGaugeIconOn;
        if (builtin != null && String(builtin).trim() !== '') slot.builtin = String(builtin).trim();
        const w = M.defaultGaugeIconWeight;
        if (w != null && String(w).trim() !== '') slot.weight = String(w).toLowerCase().trim();
        if (M.defaultGaugeIconCustomUrl != null) slot.customUrl = String(M.defaultGaugeIconCustomUrl);
        if (M.defaultGaugeIconTintImage === true) slot.tintImage = true;
        else if (M.defaultGaugeIconTintImage === false) slot.tintImage = false;
        return slot;
    }

    static ensureGaugeIcons(o) {
        if (!o || typeof o !== 'object') return;
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const def = GaugeWidget.defaultGaugeIconSlotFromMaster(M);
        if (!o.icons || typeof o.icons !== 'object') o.icons = {};
        if (!o.icons.on || typeof o.icons.on !== 'object') {
            o.icons.on = { ...def };
        } else {
            const prev = { ...o.icons.on };
            Object.assign(o.icons.on, def);
            Object.assign(o.icons.on, prev);
        }
    }

    static attachGaugeIconMasterDefaultKeys(group) {
        if (!group || !Array.isArray(group.fields)) return;
        const map = {
            iconSourceOn: 'defaultGaugeIconSource',
            iconOn: 'defaultGaugeIconOn',
            iconWeightOn: 'defaultGaugeIconWeight',
            imgOn: 'defaultGaugeIconCustomUrl',
            colorizeOn: 'defaultGaugeIconTintImage',
            iconSlotColOn: 'gaugeColIcon'
        };
        group.fields.forEach((field) => {
            if (map[field.key]) field.defaultKey = map[field.key];
        });
    }

    static expandGaugeIconsToFlat(o) {
        GaugeWidget.ensureGaugeIcons(o);
        const on = o.icons.on;
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const nz = (v) => v !== undefined && v !== null && String(v).trim() !== '';
        const colFb = o.colIcon || o.gaugeColIcon || M.gaugeColIcon || BaseWidget.themeTokenRef('icon');
        const wOn = (on.weight != null && String(on.weight).trim() !== '')
            ? String(on.weight).toLowerCase().trim()
            : 'fill';
        const flat = {
            iconSourceOn: on.source,
            iconOn: on.builtin,
            iconWeightOn: wOn,
            imgOn: on.customUrl,
            colorizeOn: on.tintImage === true,
            iconSlotColOn: (on && Object.prototype.hasOwnProperty.call(on, 'color') && nz(on.color)) ? on.color : colFb
        };
        flat.iconSlotAccentOn = BaseWidget.resolveIconSlotAccentColor(on, M.menuIconAccentOn);
        Object.assign(flat, BaseWidget.flattenIconSlotTransformFlat(on, GaugeWidget.ICON_KEYMAP_ON));
        return flat;
    }

    static applyIconsNestedToConfig(c) {
        const flat = GaugeWidget.expandGaugeIconsToFlat(c);
        Object.keys(flat).forEach((k) => { c[k] = flat[k]; });
    }

    static applyTypographyNestedToConfig(c) {
        BaseWidget.applyTypographyNestedToConfig(c, [
            ['caption', 'gaugeCaption'],
            ['value', 'gaugeValue'],
            ['unit', 'gaugeUnit'],
            ['axis', 'gaugeAxis']
        ]);
    }

    static getNestedBindingOverlaySpec() {
        const spec = [];
        const km = GaugeWidget.ICON_KEYMAP_ON;
        [
            ['iconSourceOn', 'source'],
            ['iconOn', 'builtin'],
            ['iconWeightOn', 'weight'],
            ['imgOn', 'customUrl'],
            ['colorizeOn', 'tintImage'],
            ['iconSlotColOn', 'color'],
            ['iconSlotAccentOn', 'accentColor'],
            ['iconSlotOffsetXOn', 'offsetX'],
            ['iconSlotOffsetYOn', 'offsetY'],
            ['iconSlotRotationOn', 'rotation']
        ].forEach(([configKey, prop]) => {
            spec.push({ path: ['icons', 'on', prop], configKey });
        });
        return spec.concat(BaseWidget.buildTypographyBindingOverlaySpec([
            ['caption', 'gaugeCaption'],
            ['value', 'gaugeValue'],
            ['unit', 'gaugeUnit'],
            ['axis', 'gaugeAxis']
        ]));
    }

    static fillGaugeTypographyResolved(c, M) {
        const nz = (v) => v != null && String(v).trim() !== '';

        if (!c.gaugeCaptionFont) c.gaugeCaptionFont = c.fontFamily || M.fontFamily || "'Inter', sans-serif";
        if (c.gaugeCaptionFs == null || c.gaugeCaptionFs === '') {
            c.gaugeCaptionFs = M.defaultGaugeCaptionFs != null ? M.defaultGaugeCaptionFs : (M.defaultFsLabel != null ? M.defaultFsLabel : 12);
        }
        if (!c.gaugeCaptionCol) c.gaugeCaptionCol = M.defaultGaugeCaptionCol || M.defaultColLabel || '@textMuted';
        c.gaugeCaptionAlign = GaugeWidget.resolveGaugeCaptionAlign(c, M);
        if (!c.gaugeCaptionCase) c.gaugeCaptionCase = M.defaultGaugeCaptionCase || M.defaultLabelCase || 'uppercase';
        if (c.gaugeCaptionBold === undefined || c.gaugeCaptionBold === null) {
            c.gaugeCaptionBold = M.defaultGaugeCaptionBold === true || M.defaultLabelBold === true;
        }
        if (c.gaugeCaptionItalic === undefined || c.gaugeCaptionItalic === null) {
            c.gaugeCaptionItalic = M.defaultGaugeCaptionItalic === true || M.defaultLabelItalic === true;
        }
        if (c.gaugeCaptionOpacity === undefined || c.gaugeCaptionOpacity === null || c.gaugeCaptionOpacity === '') {
            c.gaugeCaptionOpacity = M.defaultGaugeCaptionOpacity != null ? M.defaultGaugeCaptionOpacity : 100;
        }
        if (c.gaugeCaptionOffX === undefined || c.gaugeCaptionOffX === null) c.gaugeCaptionOffX = M.defaultGaugeCaptionOffX != null ? M.defaultGaugeCaptionOffX : 0;
        if (c.gaugeCaptionOffY === undefined || c.gaugeCaptionOffY === null) c.gaugeCaptionOffY = M.defaultGaugeCaptionOffY != null ? M.defaultGaugeCaptionOffY : 0;

        if (!c.gaugeValueFont) {
            c.gaugeValueFont = nz(M.defaultGaugeValueFont) ? M.defaultGaugeValueFont : (c.fontFamily || M.fontFamily || "'Inter', sans-serif");
        }
        if (c.gaugeValueFs == null || c.gaugeValueFs === '') {
            c.gaugeValueFs = M.defaultGaugeValueFs != null ? M.defaultGaugeValueFs : (M.defaultFsVal != null ? M.defaultFsVal : 48);
        }
        if (!c.gaugeValueCol) c.gaugeValueCol = M.defaultGaugeValueCol || M.gaugeColVal || M.defaultColVal || '@text';
        if (c.gaugeValueBold === undefined || c.gaugeValueBold === null) {
            if (M.defaultGaugeValueBold !== undefined) {
                c.gaugeValueBold = M.defaultGaugeValueBold === true;
            } else {
                c.gaugeValueBold = M.defaultGaugeBoldVal === true;
            }
        }
        if (c.gaugeValueItalic === undefined || c.gaugeValueItalic === null) c.gaugeValueItalic = M.defaultGaugeValueItalic === true;
        if (c.gaugeValueOpacity === undefined || c.gaugeValueOpacity === null || c.gaugeValueOpacity === '') {
            c.gaugeValueOpacity = M.defaultGaugeValueOpacity != null ? M.defaultGaugeValueOpacity : 100;
        }
        if (c.gaugeValueOffX === undefined || c.gaugeValueOffX === null) c.gaugeValueOffX = M.defaultGaugeValueOffX != null ? M.defaultGaugeValueOffX : 0;
        if (c.gaugeValueOffY === undefined || c.gaugeValueOffY === null) c.gaugeValueOffY = M.defaultGaugeValueOffY != null ? M.defaultGaugeValueOffY : 0;

        if (!c.gaugeUnitFont) c.gaugeUnitFont = c.gaugeValueFont || c.fontFamily || M.fontFamily || "'Inter', sans-serif";
        if (c.gaugeUnitFs == null || c.gaugeUnitFs === '') {
            c.gaugeUnitFs = M.defaultGaugeUnitFs != null ? M.defaultGaugeUnitFs : (M.defaultFsUnit != null ? M.defaultFsUnit : 20);
        }
        if (!c.gaugeUnitCol) c.gaugeUnitCol = M.defaultGaugeUnitCol || M.gaugeColUnit || M.defaultColLabel || '@textMuted';
        if (c.gaugeUnitBold === undefined || c.gaugeUnitBold === null) c.gaugeUnitBold = M.defaultGaugeUnitBold === true;
        if (c.gaugeUnitItalic === undefined || c.gaugeUnitItalic === null) c.gaugeUnitItalic = M.defaultGaugeUnitItalic === true;
        if (c.gaugeUnitOpacity === undefined || c.gaugeUnitOpacity === null || c.gaugeUnitOpacity === '') {
            c.gaugeUnitOpacity = M.defaultGaugeUnitOpacity != null ? M.defaultGaugeUnitOpacity : 100;
        }

        if (!c.gaugeAxisFont) c.gaugeAxisFont = c.fontFamily || M.fontFamily || "'Inter', sans-serif";
        if (c.gaugeAxisFs == null || c.gaugeAxisFs === '') {
            c.gaugeAxisFs = M.defaultGaugeAxisFs != null ? M.defaultGaugeAxisFs : 11;
        }
        if (!c.gaugeAxisCol) c.gaugeAxisCol = M.defaultGaugeAxisCol || M.defaultColLabel || '@textMuted';
        if (c.gaugeAxisBold === undefined || c.gaugeAxisBold === null) c.gaugeAxisBold = M.defaultGaugeAxisBold === true;
        if (c.gaugeAxisItalic === undefined || c.gaugeAxisItalic === null) c.gaugeAxisItalic = M.defaultGaugeAxisItalic === true;
        if (c.gaugeAxisOpacity === undefined || c.gaugeAxisOpacity === null || c.gaugeAxisOpacity === '') {
            c.gaugeAxisOpacity = M.defaultGaugeAxisOpacity != null ? M.defaultGaugeAxisOpacity : 100;
        }
    }

    static applyAxisTypographyToSvgText(textEl, c) {
        if (!textEl || !c) return;
        if (c.gaugeAxisFont) textEl.setAttribute('font-family', c.gaugeAxisFont);
        if (c.gaugeAxisFs) textEl.setAttribute('font-size', `${c.gaugeAxisFs}px`);
        textEl.setAttribute('font-weight', c.gaugeAxisBold ? '700' : '400');
        textEl.setAttribute('font-style', c.gaugeAxisItalic ? 'italic' : 'normal');
        let col = BaseWidget.resolveCssColor(c.gaugeAxisCol || '@textMuted');
        let opacity = c.gaugeAxisOpacity !== undefined && c.gaugeAxisOpacity !== null ? Number(c.gaugeAxisOpacity) : 100;
        if (!Number.isFinite(opacity)) opacity = 100;
        if (opacity < 100 && typeof Dashboard !== 'undefined' && typeof Dashboard.hexToRgba === 'function') {
            col = Dashboard.hexToRgba(col, opacity / 100);
        }
        textEl.setAttribute('fill', col);
    }

    static gaugeBarType(values) {
        return values.barType || values.defaultGaugeType || 'round';
    }

    /**
     * Auto Cell Height, and Fixed with Cell Height 0: a round gauge is 133% of
     * the column width so the dial and caption fit. Horizontal and none keep
     * the measured content height. Never shorter than Min Widget Height.
     */
    measureResponsiveIntrinsicHeight() {
        const barType = GaugeWidget.gaugeBarType(this.config || {});
        if (barType !== 'round') return 0;
        return BaseWidget.responsiveAspectCellHeight(this, 1.33);
    }

    /** Track / bar inner-glow and outline color/opacity leaves show once a width is set. */
    static trackInnerGlowDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'trackInnerGlow', 'defaultGaugeTrackInnerGlow');
    }
    static barInnerGlowDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'barInnerGlow', 'defaultGaugeBarInnerGlow');
    }
    static trackOutlineDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'trackOutlineWidth', 'defaultGaugeTrackOutlineWidth');
    }
    static barOutlineDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'barOutlineWidth', 'defaultGaugeBarOutlineWidth');
    }

    static gaugeStyleIsNone(values) {
        return GaugeWidget.gaugeBarType(values) === 'none';
    }

    static gaugeStyleIsHorizontal(values) {
        return GaugeWidget.gaugeBarType(values) === 'horizontal';
    }

    /** Round-only vs horizontal/none (shared gap, text position, caption alignment). */
    static gaugeStyleUsesHorizontalVariant(values) {
        const t = GaugeWidget.gaugeBarType(values);
        return t === 'horizontal' || t === 'none';
    }

    static get LAYOUT_POSITION_OPTIONS() {
        return [
            { value: 'bottom', text: 'Bottom' },
            { value: 'top', text: 'Top' },
            { value: 'left', text: 'Left' },
            { value: 'right', text: 'Right' }
        ];
    }

    static get CAPTION_ALIGN_OPTIONS() {
        return [
            { value: 'left', text: 'Left' },
            { value: 'center', text: 'Center' },
            { value: 'right', text: 'Right' }
        ];
    }

    /** Resolved text position for current bar style (round vs horizontal). */
    static resolveGaugeLayout(c) {
        if (!c || typeof c !== 'object') return 'bottom';
        const barType = GaugeWidget.gaugeBarType(c);
        const legacy = c.layout != null ? c.layout : c.defaultGaugeLayout;
        if (GaugeWidget.gaugeStyleUsesHorizontalVariant({ barType })) {
            return __nullish(c.layoutHorizontal, __nullish(c.layoutHoriz, __nullish(c.defaultGaugeHorizontalLayout, __nullish(legacy, 'right'))));
        }
        return __nullish(c.layoutRound, __nullish(c.defaultGaugeRoundLayout, __nullish(legacy, 'bottom')));
    }

    static resolveGaugeCaptionAlign(c, M) {
        if (!c || typeof c !== 'object') return 'center';
        M = M || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {});
        const barType = GaugeWidget.gaugeBarType(c);
        const fromNested = c.typography && c.typography.caption && c.typography.caption.textAlign != null
            ? c.typography.caption.textAlign
            : undefined;
        const legacy = c.gaugeCaptionAlign != null ? c.gaugeCaptionAlign : (fromNested != null ? fromNested : M.defaultGaugeCaptionAlign);
        if (GaugeWidget.gaugeStyleUsesHorizontalVariant({ barType })) {
            return __nullish(c.gaugeCaptionAlignHoriz, __nullish(c.defaultGaugeCaptionAlignHoriz, __nullish(legacy, 'left')));
        }
        return __nullish(c.gaugeCaptionAlignRound, __nullish(c.defaultGaugeCaptionAlignRound, __nullish(legacy, 'center')));
    }

    static injectStyleSpecificAlignIntoTypographyGroup(group, roundKey, horizKey, roundDefaultKey, horizDefaultKey) {
        if (!group || !Array.isArray(group.fields)) return group;
        const alignRound = {
            key: roundKey,
            type: 'select',
            label: 'Alignment',
            options: GaugeWidget.CAPTION_ALIGN_OPTIONS,
            cols: 4,
            defaultKey: roundDefaultKey
        };
        const alignHoriz = {
            key: horizKey,
            type: 'select',
            label: 'Alignment',
            options: GaugeWidget.CAPTION_ALIGN_OPTIONS,
            cols: 4,
            defaultKey: horizDefaultKey
        };
        GaugeWidget.attachGaugeBarTypeVariantVisibility(alignRound, 'round');
        GaugeWidget.attachGaugeBarTypeVariantVisibility(alignHoriz, 'horizontal');
        let insertAt = 2;
        for (let i = 0; i < group.fields.length; i++) {
            if (group.fields[i].key && String(group.fields[i].key).endsWith('Fs')) {
                insertAt = i + 1;
                break;
            }
        }
        group.fields.splice(insertAt, 0, alignRound, alignHoriz);
        return group;
    }

    static buildGaugeCaptionTypographySchema(isMaster) {
        const prefix = isMaster ? 'defaultGaugeCaption' : 'gaugeCaption';
        const group = BaseWidget.getTypographySchema(prefix, 'Widget Label', {
            exclude: ['align'],
            nestedTypography: isMaster ? undefined : { root: 'typography', role: 'caption' },
            fontDefaultKey: isMaster ? 'fontFamily' : undefined,
            fontDefaultKeyFallback: isMaster ? undefined : 'fontFamily',
            fontSizeDefaultKey: 'defaultGaugeCaptionFs',
            colorDefaultKey: 'defaultGaugeCaptionCol',
            caseDefaultKey: 'defaultGaugeCaptionCase',
            boldDefaultKey: 'defaultGaugeCaptionBold',
            italicDefaultKey: 'defaultGaugeCaptionItalic',
            opacityDefaultKey: 'defaultGaugeCaptionOpacity',
            offXDefaultKey: isMaster ? 'defaultGaugeCaptionOffX' : 'defaultGaugeCaptionOffX',
            offYDefaultKey: isMaster ? 'defaultGaugeCaptionOffY' : 'defaultGaugeCaptionOffY'
        });
        return GaugeWidget.injectStyleSpecificAlignIntoTypographyGroup(
            group,
            isMaster ? 'defaultGaugeCaptionAlignRound' : 'gaugeCaptionAlignRound',
            isMaster ? 'defaultGaugeCaptionAlignHoriz' : 'gaugeCaptionAlignHoriz',
            'defaultGaugeCaptionAlignRound',
            'defaultGaugeCaptionAlignHoriz'
        );
    }

    static attachGaugeBarTypeVariantVisibility(field, variant) {
        if (!field) return;
        const dep = ['barType', 'defaultGaugeType'];
        if (Array.isArray(field.dependsOn)) {
            dep.forEach((k) => { if (field.dependsOn.indexOf(k) < 0) field.dependsOn.push(k); });
        } else {
            field.dependsOn = dep;
        }
        const prev = field.visibleWhen;
        field.visibleWhen = function (values, isGlobal) {
            const horizVariant = GaugeWidget.gaugeStyleUsesHorizontalVariant(values);
            if (variant === 'horizontal' && !horizVariant) return false;
            if (variant === 'round' && horizVariant) return false;
            if (typeof prev === 'function') return prev(values, isGlobal);
            return true;
        };
    }

    static attachGaugeBarStyleSectionVisibility(field, visibleWhenExtra) {
        if (!field) return;
        const dep = ['barType', 'defaultGaugeType'];
        if (Array.isArray(field.dependsOn)) {
            dep.forEach((k) => { if (field.dependsOn.indexOf(k) < 0) field.dependsOn.push(k); });
        } else {
            field.dependsOn = dep;
        }
        const extra = typeof visibleWhenExtra === 'function' ? visibleWhenExtra : null;
        const prev = field.visibleWhen;
        field.visibleWhen = function (values, isGlobal) {
            if (GaugeWidget.gaugeStyleIsNone(values)) return false;
            if (extra && !extra(values, isGlobal)) return false;
            if (typeof prev === 'function') return prev(values, isGlobal);
            return true;
        };
    }

    // --- Global Configuration Injection ---
    static get globalSettings() {
        return {
            gaugeCol0: "@accent",
            gaugeCol100: "@accentSecondary",
            gaugeColTrack: "@border",
            gaugeColVal: "@text",
            gaugeColUnit: "@textMuted",
            gaugeColIcon: BaseWidget.themeTokenRef('icon'),
            gaugeBarGlow: true,

            defaultGaugeBarThick: 12,
            defaultGaugeTrackThick: 16,
            defaultGaugeType: "round",
            defaultGaugeRoundLayout: "bottom",
            defaultGaugeHorizontalLayout: "right",
            defaultGaugeAbbreviateLargeValues: false,
            defaultGaugeKeepTrailingZeros: false,

            defaultGaugeCustomDisplayRange: false,
            defaultGaugeDisplayMin: 0,
            defaultGaugeDisplayMax: 100,
            defaultGaugeDisplayDecimalPlaces: 1,
            defaultGaugeDisplayKeepTrailingZeros: false,
            defaultGaugeSolidBarColor: false,

            defaultGaugeRoundGap: -25,
            defaultGaugeHorizontalGap: 8,

            defaultGaugeTrackOutlineWidth: 0,
            defaultGaugeTrackOutlineColor: "@accent",
            defaultGaugeTrackOpacity: 100,
            defaultGaugeTrackOutlineOpacity: 100,
            defaultGaugeTrackBlur: 0,
            defaultGaugeTrackInnerGlow: 0,
            defaultGaugeTrackInnerGlowColor: "@accent",
            defaultGaugeTrackInnerGlowOpacity: 100,
            defaultGaugeBarOpacity: 100,
            defaultGaugeBarOutlineWidth: 0,
            defaultGaugeBarOutlineColor: "@thumb",
            defaultGaugeBarOutlineOpacity: 100,
            defaultGaugeBarInnerGlow: 0,
            defaultGaugeBarInnerGlowColor: "@thumb",
            defaultGaugeBarInnerGlowOpacity: 100,

            defaultGaugeSizeOffset: 0,

            defaultGaugeShowIcon: true,

            defaultGaugeIconSource: 'phosphor',
            defaultGaugeIconOn: 'ph-thermometer-simple',
            defaultGaugeIconWeight: 'fill',
            defaultGaugeIconCustomUrl: '',
            defaultGaugeIconTintImage: false,

            defaultGaugeIconSize: 80,
            defaultGaugeIconOffX: 0,
            defaultGaugeIconOffY: 0,

            defaultGaugeCaptionFs: 12,
            defaultGaugeCaptionCol: "@textMuted",
            defaultGaugeCaptionAlignRound: "center",
            defaultGaugeCaptionAlignHoriz: "left",
            defaultGaugeCaptionCase: "uppercase",
            defaultGaugeCaptionBold: false,
            defaultGaugeCaptionItalic: false,
            defaultGaugeCaptionOpacity: 100,
            defaultGaugeCaptionOffX: 0,
            defaultGaugeCaptionOffY: 0,

            defaultGaugeValueFont: "",
            defaultGaugeValueFs: 48,
            defaultGaugeValueCol: "@text",
            defaultGaugeValueBold: true,
            defaultGaugeValueItalic: false,
            defaultGaugeValueOpacity: 100,
            defaultGaugeValueOffX: 0,
            defaultGaugeValueOffY: 0,
            defaultGaugeBoldVal: true,

            defaultGaugeUnitFs: 20,
            defaultGaugeUnitCol: "@textMuted",
            defaultGaugeUnitBold: false,
            defaultGaugeUnitItalic: false,
            defaultGaugeUnitOpacity: 100,

            defaultGaugeAxisFs: 11,
            defaultGaugeAxisCol: "@textMuted",
            defaultGaugeAxisBold: false,
            defaultGaugeAxisItalic: false,
            defaultGaugeAxisOpacity: 100
        };
    }

    // --- Global Editor Schema ---
    static masterIconOffsetFields() {
        const sizeField = { key: 'defaultGaugeIconSize', type: 'number', label: 'Default Icon Size', cols: 12 };
        const offXField = { key: 'defaultGaugeIconOffX', type: 'number', label: 'Icon Offset X', cols: 6 };
        const offYField = { key: 'defaultGaugeIconOffY', type: 'number', label: 'Icon Offset Y', cols: 6 };
        GaugeWidget.attachGaugeIconSectionVisibility(sizeField);
        GaugeWidget.attachGaugeIconSectionVisibility(offXField);
        GaugeWidget.attachGaugeIconSectionVisibility(offYField);
        return [sizeField, offXField, offYField];
    }

    static get basicSettingKeys() {
        return [
            { key: 'value', cols: 3 },
            { key: 'min', cols: 3 },
            { key: 'max', cols: 3 },
            { key: 'decimalPlaces', cols: 3 },
            'unit',
            'iconOn'
        ];
    }

    static get globalSchema() {
        const iconKm = { ...GaugeWidget.GAUGE_MASTER_ICON_KEYMAP };
        const iconGroup = BaseWidget.getIconStyleSchema('Icon', iconKm, { exclude: ['hoverColor', 'size'] });
        GaugeWidget.attachGaugeIconSectionVisibility(iconGroup);

        return [
            { type: 'heading', label: 'Layout & Spacing', cols: 12 },
            { key: 'defaultGaugeType', type: 'select', label: 'Style', options: ['round', 'horizontal', 'none'], cols: 6 },
            { key: 'defaultGaugeSizeOffset', type: 'number', label: 'Size Adjustment', cols: 6 },
            {
                key: 'defaultGaugeRoundLayout', type: 'select', label: 'Text Position', options: GaugeWidget.LAYOUT_POSITION_OPTIONS, cols: 6,
                dependsOn: ['defaultGaugeType'],
                visibleWhen: (v) => GaugeWidget.gaugeBarType(v) === 'round'
            },
            {
                key: 'defaultGaugeHorizontalLayout', type: 'select', label: 'Text Position', options: GaugeWidget.LAYOUT_POSITION_OPTIONS, cols: 6,
                dependsOn: ['defaultGaugeType'],
                visibleWhen: (v) => GaugeWidget.gaugeStyleUsesHorizontalVariant(v)
            },
            {
                key: 'defaultGaugeRoundGap', type: 'number', label: 'Round Gap', cols: 12,
                dependsOn: ['defaultGaugeType'],
                visibleWhen: (v) => GaugeWidget.gaugeBarType(v) === 'round'
            },
            {
                key: 'defaultGaugeHorizontalGap', type: 'number', label: 'Horizontal Gap', cols: 12,
                dependsOn: ['defaultGaugeType'],
                visibleWhen: (v) => GaugeWidget.gaugeStyleUsesHorizontalVariant(v)
            },
            {
                key: 'defaultGaugeCustomDisplayRange', type: 'checkbox', label: 'Custom display range', cols: 12
            },
            {
                key: 'defaultGaugeDisplayMin', type: 'number', label: 'Display minimum', cols: 6,
                dependsOn: ['defaultGaugeCustomDisplayRange'],
                visibleWhen: (v) => v.defaultGaugeCustomDisplayRange === true
            },
            {
                key: 'defaultGaugeDisplayMax', type: 'number', label: 'Display maximum', cols: 6,
                dependsOn: ['defaultGaugeCustomDisplayRange'],
                visibleWhen: (v) => v.defaultGaugeCustomDisplayRange === true
            },
            {
                key: 'defaultGaugeDisplayDecimalPlaces', type: 'number', label: 'Decimal Places', cols: 6,
                dependsOn: ['defaultGaugeCustomDisplayRange'],
                visibleWhen: (v) => v.defaultGaugeCustomDisplayRange === true
            },
            {
                key: 'defaultGaugeDisplayKeepTrailingZeros', type: 'checkbox', label: 'Keep Trailing Zeros', cols: 6,
                dependsOn: ['defaultGaugeCustomDisplayRange'],
                visibleWhen: (v) => v.defaultGaugeCustomDisplayRange === true
            },
            { key: 'defaultGaugeAbbreviateLargeValues', type: 'checkbox', label: 'Abbreviate Large Values (k, M)', cols: 6 },
            { key: 'defaultGaugeKeepTrailingZeros', type: 'checkbox', label: 'Keep Trailing Zeros', cols: 6 },

            { type: 'heading', label: 'Track', cols: 12 },
            { key: 'defaultGaugeTrackThick', type: 'number', label: 'Track Width', cols: 12 },
            { key: 'gaugeColTrack', type: 'color', label: 'Track Color', cols: 4, gridColStart: 1 },
            { key: 'defaultGaugeTrackOpacity', type: 'number', label: 'Track Opacity', cols: 4, min: 0, max: 100 },
            { key: 'defaultGaugeTrackBlur', type: 'number', label: 'Track Background Blur', cols: 4, min: 0 },
            { key: 'defaultGaugeTrackOutlineWidth', type: 'number', label: 'Track Outline Width', cols: 4, gridColStart: 1 },
            {
                key: 'defaultGaugeTrackOutlineColor', type: 'color', label: 'Track Outline Color', cols: 4,
                dependsOn: ['defaultGaugeTrackOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('defaultGaugeTrackOutlineWidth')
            },
            {
                key: 'defaultGaugeTrackOutlineOpacity', type: 'number', label: 'Track Outline Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['defaultGaugeTrackOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('defaultGaugeTrackOutlineWidth')
            },
            { key: 'defaultGaugeTrackInnerGlow', type: 'number', label: 'Track Inner Glow', cols: 4, min: 0, gridColStart: 1 },
            {
                key: 'defaultGaugeTrackInnerGlowColor', type: 'color', label: 'Track Inner Glow Color', cols: 4,
                dependsOn: ['defaultGaugeTrackInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('defaultGaugeTrackInnerGlow')
            },
            {
                key: 'defaultGaugeTrackInnerGlowOpacity', type: 'number', label: 'Track Inner Glow Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['defaultGaugeTrackInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('defaultGaugeTrackInnerGlow')
            },

            { type: 'heading', label: 'Bar', cols: 12 },
            { key: 'defaultGaugeBarThick', type: 'number', label: 'Bar Width', cols: 12 },
            { key: 'defaultGaugeBarOpacity', type: 'number', label: 'Bar Opacity', cols: 12, min: 0, max: 100 },
            { key: 'gaugeBarGlow', type: 'checkbox', label: 'Enable Bar Glow', cols: 12 },
            { key: 'gaugeCol0', type: 'color', label: 'Start Color', cols: 6, gridColStart: 1 },
            { key: 'gaugeCol100', type: 'color', label: 'End Color', cols: 6 },
            { key: 'defaultGaugeSolidBarColor', type: 'checkbox', label: 'Solid color at value', cols: 12 },
            { key: 'defaultGaugeBarOutlineWidth', type: 'number', label: 'Bar Outline Width', cols: 4, min: 0, gridColStart: 1 },
            {
                key: 'defaultGaugeBarOutlineColor', type: 'color', label: 'Bar Outline Color', cols: 4,
                dependsOn: ['defaultGaugeBarOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('defaultGaugeBarOutlineWidth')
            },
            {
                key: 'defaultGaugeBarOutlineOpacity', type: 'number', label: 'Bar Outline Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['defaultGaugeBarOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('defaultGaugeBarOutlineWidth')
            },
            { key: 'defaultGaugeBarInnerGlow', type: 'number', label: 'Bar Inner Glow', cols: 4, min: 0, gridColStart: 1 },
            {
                key: 'defaultGaugeBarInnerGlowColor', type: 'color', label: 'Bar Inner Glow Color', cols: 4,
                dependsOn: ['defaultGaugeBarInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('defaultGaugeBarInnerGlow')
            },
            {
                key: 'defaultGaugeBarInnerGlowOpacity', type: 'number', label: 'Bar Inner Glow Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['defaultGaugeBarInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('defaultGaugeBarInnerGlow')
            },

            { type: 'heading', label: 'Icon', cols: 12 },
            { key: 'defaultGaugeShowIcon', type: 'checkbox', label: 'Show Icon', cols: 12 },
            iconGroup,
            ...GaugeWidget.masterIconOffsetFields(),

            { type: 'heading', label: 'Typography', cols: 12 },
            GaugeWidget.buildGaugeCaptionTypographySchema(true),
            BaseWidget.getTypographySchema('defaultGaugeValue', 'Value', {
                exclude: ['align', 'case'],
                fontDefaultKey: 'fontFamily',
                fontSizeDefaultKey: 'defaultGaugeValueFs',
                colorDefaultKey: 'defaultGaugeValueCol',
                boldDefaultKey: 'defaultGaugeValueBold',
                italicDefaultKey: 'defaultGaugeValueItalic',
                opacityDefaultKey: 'defaultGaugeValueOpacity',
                offXDefaultKey: 'defaultGaugeValueOffX',
                offYDefaultKey: 'defaultGaugeValueOffY'
            }),
            BaseWidget.getTypographySchema('defaultGaugeUnit', 'Unit', {
                exclude: ['align', 'case', 'offset'],
                fontDefaultKey: 'fontFamily',
                fontSizeDefaultKey: 'defaultGaugeUnitFs',
                colorDefaultKey: 'defaultGaugeUnitCol',
                boldDefaultKey: 'defaultGaugeUnitBold',
                italicDefaultKey: 'defaultGaugeUnitItalic',
                opacityDefaultKey: 'defaultGaugeUnitOpacity'
            }),
            BaseWidget.getTypographySchema('defaultGaugeAxis', 'Axis Labels', {
                exclude: ['align', 'case', 'offset'],
                fontDefaultKey: 'fontFamily',
                fontSizeDefaultKey: 'defaultGaugeAxisFs',
                colorDefaultKey: 'defaultGaugeAxisCol',
                boldDefaultKey: 'defaultGaugeAxisBold',
                italicDefaultKey: 'defaultGaugeAxisItalic',
                opacityDefaultKey: 'defaultGaugeAxisOpacity'
            })
        ];
    }

    static extractPreloadImageUrls(o) {
        if (!o || typeof o !== 'object') return [];
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const showIcon = o.showIcon !== undefined && o.showIcon !== null ? o.showIcon : (o.defaultGaugeShowIcon !== false);
        if (showIcon === false) return [];
        const def = GaugeWidget.defaultGaugeIconSlotFromMaster(M);
        const icons = o.icons && typeof o.icons === 'object' ? o.icons : {};
        const on = { ...def, ...(icons.on && typeof icons.on === 'object' ? icons.on : {}) };
        if (on.source === 'custom') {
            const u = String(on.customUrl || '').trim();
            return u ? [u] : [];
        }
        return [];
    }

    static get AUDIO_TRIGGERS() {
        return [
            { key: 'valueChange', label: 'On Value Change' }
        ];
    }

    getDefaultOverrides() {
        return {
            min: 0,
            max: 100,
            value: 0,
            decimalPlaces: 1,
            label: "Gauge",
            unit: "",
            typography: { caption: {}, value: {}, unit: {}, axis: {} },
            audio: (typeof DashboardAudio !== 'undefined' && DashboardAudio.defaultAudio)
                ? DashboardAudio.defaultAudio(GaugeWidget.AUDIO_TRIGGERS)
                : { valueChange: '' }
        };
    }

    /** Drop instance icon keys that only repeat master defaults (so reset / (Def) work). */
    static pruneIconOverridesMatchingMaster(o, master) {
        if (!o || typeof o !== 'object') return false;
        const m = master && typeof master === 'object' ? master : {};
        let changed = false;
        const km = GaugeWidget.ICON_KEYMAP_ON;
        if (km) {
            Object.values(km).forEach((flatKey) => {
                if (flatKey && o[flatKey] !== undefined) {
                    delete o[flatKey];
                    changed = true;
                }
            });
            if (o.iconSlotAccentOn !== undefined) {
                delete o.iconSlotAccentOn;
                changed = true;
            }
        }
        if (!o.icons || typeof o.icons !== 'object') return changed;
        if (o.icons.off) {
            delete o.icons.off;
            changed = true;
        }
        const on = o.icons.on;
        if (!on || typeof on !== 'object') {
            if (o.icons && Object.keys(o.icons).length === 0) {
                delete o.icons;
                changed = true;
            }
            return changed;
        }
        const def = GaugeWidget.defaultGaugeIconSlotFromMaster(m);
        const same = (prop) => {
            if (!Object.prototype.hasOwnProperty.call(on, prop)) return false;
            if (prop === 'tintImage') return on.tintImage === def.tintImage;
            return String(on[prop] == null ? '' : on[prop]) === String(def[prop] == null ? '' : def[prop]);
        };
        ['source', 'builtin', 'weight', 'customUrl', 'tintImage'].forEach((prop) => {
            if (same(prop)) {
                delete on[prop];
                changed = true;
            }
        });
        if (Object.prototype.hasOwnProperty.call(on, 'color')) {
            const defCol = m.gaugeColIcon;
            if (String(on.color == null ? '' : on.color) === String(defCol == null ? '' : defCol)) {
                delete on.color;
                changed = true;
            }
        }
        if (Object.keys(on).length === 0) {
            delete o.icons.on;
            changed = true;
        }
        if (o.icons && Object.keys(o.icons).length === 0) {
            delete o.icons;
            changed = true;
        }
        return changed;
    }

    get config() {
        const c = super.config;
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};

        GaugeWidget.applyTypographyNestedToConfig(c);
        GaugeWidget.applyIconsNestedToConfig(c);
        if (c.iconSlotOffsetXOn == null || c.iconSlotOffsetXOn === '') {
            c.iconSlotOffsetXOn = __nullish(c.defaultGaugeIconOffX, 0);
        }
        if (c.iconSlotOffsetYOn == null || c.iconSlotOffsetYOn === '') {
            c.iconSlotOffsetYOn = __nullish(c.defaultGaugeIconOffY, 0);
        }
        BaseWidget.applyNestedBindingOverlay(this, c, GaugeWidget.getNestedBindingOverlaySpec());
        GaugeWidget.fillGaugeTypographyResolved(c, M);

        const barType = c.barType || c.defaultGaugeType || 'round';
        const layout = GaugeWidget.resolveGaugeLayout(c);
        const min = BaseWidget.toFiniteNumber(c.min, 0);
        const max = BaseWidget.toFiniteNumber(c.max, 100);
        const value = BaseWidget.toFiniteNumber(c.value, 0);
        const baselineValue = BaseWidget.toFiniteNumber(c.baselineValue, 0);
        const iconSize = BaseWidget.clampNumber(__nullish(c.iconSize, __nullish(c.defaultGaugeIconSize, 80)), 1, null);
        const gapRound = BaseWidget.toFiniteNumber(__nullish(c.gapRound, __nullish(c.defaultGaugeRoundGap, -25)), -25);
        const gapHoriz = BaseWidget.toFiniteNumber(__nullish(c.gapHoriz, __nullish(c.defaultGaugeHorizontalGap, 8)), 8);
        const barThickness = BaseWidget.clampNumber(__nullish(c.barThickness, __nullish(c.defaultGaugeBarThick, 12)), 0, null);
        const trackThickness = BaseWidget.clampNumber(__nullish(c.trackThickness, __nullish(c.defaultGaugeTrackThick, 16)), 0, null);
        const trackOutlineWidth = BaseWidget.clampNumber(__nullish(c.trackOutlineWidth, __nullish(c.defaultGaugeTrackOutlineWidth, 0)), 0, null);
        const rawDp = (c.decimalPlaces !== undefined && c.decimalPlaces !== null)
            ? c.decimalPlaces
            : ((c.decimals !== undefined && c.decimals !== null) ? c.decimals : 1);
        const decimalPlaces = Math.max(0, Math.floor(BaseWidget.toFiniteNumber(rawDp, 1)));
        const labelCount = Math.max(2, Math.floor(BaseWidget.toFiniteNumber(__nullish(c.labelCount, 5), 5)));
        const axisDecimals = Math.max(0, Math.floor(BaseWidget.toFiniteNumber(c.axisDecimals !== undefined ? c.axisDecimals : 0, 0)));
        const tickMarkLength = BaseWidget.clampNumber(__nullish(c.tickMarkLength, 8), 0, null);
        const tickMarkThickness = BaseWidget.clampNumber(__nullish(c.tickMarkThickness, 1.5), 0, null);
        const rawAbbrevDp = __nullish(
            (c.abbreviatedDecimalPlaces !== undefined && c.abbreviatedDecimalPlaces !== null) ? c.abbreviatedDecimalPlaces : c.shortenDecimals,
            0
        );
        const abbreviatedDecimalPlaces = Math.max(0, Math.floor(BaseWidget.toFiniteNumber(rawAbbrevDp, 0)));
        const startRaw = GaugeWidget._firstColor(c.col0, c.startColor, c.gaugeCol0);
        const endRaw = GaugeWidget._firstColor(c.col100, c.endColor, c.gaugeCol100);
        const midIsSet = c.colMidCustom !== undefined && c.colMidCustom !== null && String(c.colMidCustom).trim() !== '';

        const out = {
            ...c,
            barType: barType,
            layout: layout,
            min,
            max,
            value,
            abbreviateLargeValues: !!__nullish(
                c.abbreviateLargeValues,
                __nullish(c.autoScale, __nullish(c.defaultGaugeAbbreviateLargeValues, __nullish(c.defaultGaugeAutoScale, false)))
            ),
            keepTrailingZeros: !!__nullish(
                c.keepTrailingZeros,
                __nullish(c.fixedDecimalPlaces, __nullish(c.defaultGaugeKeepTrailingZeros, __nullish(c.defaultGaugeFixedDecimalPlaces, false)))
            ),

            col0: startRaw,
            col100: endRaw,
            colMid: midIsSet ? c.colMidCustom : GaugeWidget._blendColors(startRaw, endRaw),
            colTrack: GaugeWidget._firstColor(c.colTrack, c.trackColor, c.gaugeColTrack),

            barGlow: c.barGlow !== undefined ? c.barGlow : c.gaugeBarGlow,
            showIcon: c.showIcon !== undefined && c.showIcon !== null ? c.showIcon : (c.defaultGaugeShowIcon !== false),
            iconSize: iconSize,
            gap: GaugeWidget.gaugeStyleUsesHorizontalVariant({ barType }) ? gapHoriz : gapRound,
            iconOffX: BaseWidget.toFiniteNumber(__nullish(c.iconSlotOffsetXOn, __nullish(c.iconOffX, __nullish(c.defaultGaugeIconOffX, 0))), 0),
            iconOffY: BaseWidget.toFiniteNumber(__nullish(c.iconSlotOffsetYOn, __nullish(c.iconOffY, __nullish(c.defaultGaugeIconOffY, 0))), 0),

            barThickness: barThickness,
            trackThickness: trackThickness,
            trackOutlineWidth: trackOutlineWidth,
            trackOutlineColor: c.trackOutlineColor || c.defaultGaugeTrackOutlineColor || '@accent',
            trackOutlineOpacity: c.trackOutlineOpacity !== undefined && c.trackOutlineOpacity !== null ? c.trackOutlineOpacity : (c.defaultGaugeTrackOutlineOpacity !== undefined && c.defaultGaugeTrackOutlineOpacity !== null ? c.defaultGaugeTrackOutlineOpacity : 100),
            trackOpacity: c.trackOpacity !== undefined && c.trackOpacity !== null ? c.trackOpacity : (c.defaultGaugeTrackOpacity !== undefined && c.defaultGaugeTrackOpacity !== null ? c.defaultGaugeTrackOpacity : 100),
            trackBlur: c.trackBlur !== undefined && c.trackBlur !== null ? c.trackBlur : (c.defaultGaugeTrackBlur || 0),
            trackInnerGlow: c.trackInnerGlow !== undefined && c.trackInnerGlow !== null ? c.trackInnerGlow : (c.defaultGaugeTrackInnerGlow || 0),
            trackInnerGlowColor: c.trackInnerGlowColor || c.defaultGaugeTrackInnerGlowColor || '@accent',
            trackInnerGlowOpacity: c.trackInnerGlowOpacity !== undefined && c.trackInnerGlowOpacity !== null ? c.trackInnerGlowOpacity : (c.defaultGaugeTrackInnerGlowOpacity !== undefined && c.defaultGaugeTrackInnerGlowOpacity !== null ? c.defaultGaugeTrackInnerGlowOpacity : 100),
            barOpacity: c.barOpacity !== undefined && c.barOpacity !== null ? c.barOpacity : (c.defaultGaugeBarOpacity !== undefined && c.defaultGaugeBarOpacity !== null ? c.defaultGaugeBarOpacity : 100),
            barOutlineWidth: c.barOutlineWidth !== undefined && c.barOutlineWidth !== null ? c.barOutlineWidth : (c.defaultGaugeBarOutlineWidth || 0),
            barOutlineColor: c.barOutlineColor || c.defaultGaugeBarOutlineColor || '@thumb',
            barOutlineOpacity: c.barOutlineOpacity !== undefined && c.barOutlineOpacity !== null ? c.barOutlineOpacity : (c.defaultGaugeBarOutlineOpacity !== undefined && c.defaultGaugeBarOutlineOpacity !== null ? c.defaultGaugeBarOutlineOpacity : 100),
            barInnerGlow: c.barInnerGlow !== undefined && c.barInnerGlow !== null ? c.barInnerGlow : (c.defaultGaugeBarInnerGlow || 0),
            barInnerGlowColor: c.barInnerGlowColor || c.defaultGaugeBarInnerGlowColor || '@thumb',
            barInnerGlowOpacity: c.barInnerGlowOpacity !== undefined && c.barInnerGlowOpacity !== null ? c.barInnerGlowOpacity : (c.defaultGaugeBarInnerGlowOpacity !== undefined && c.defaultGaugeBarInnerGlowOpacity !== null ? c.defaultGaugeBarInnerGlowOpacity : 100),

            decimalPlaces: decimalPlaces,
            valueAlignment: c.valueAlignment || (layout === 'left' || layout === 'right' ? 'left' : 'center'),

            label: c.label != null ? String(c.label) : '',
            unit: c.unit != null ? String(c.unit) : '',

            baselineMode: __nullish(c.baselineMode, false),
            baselineValue: baselineValue,

            showLabels: __nullish(c.showLabels, false),
            rotateLabels: __nullish(c.rotateLabels, false),
            showTickMarks: __nullish(c.showTickMarks, false),
            labelCount: labelCount,
            labelOffset: BaseWidget.toFiniteNumber(__nullish(c.labelOffset, 15), 15),
            axisDecimals: axisDecimals,
            axisRoundingMode: c.axisRoundingMode || 'exact',

            tickMarkLength: tickMarkLength,
            tickMarkThickness: tickMarkThickness,
            tickMarkOffset: BaseWidget.toFiniteNumber(__nullish(c.tickMarkOffset, 0), 0),
            tickMarkColor: c.tickMarkColorCustom || c.gaugeAxisCol || M.defaultColLabel || '@textMuted',

            gaugeSizeOffset: BaseWidget.toFiniteNumber(__nullish(c.gaugeSizeOffset, __nullish(c.defaultGaugeSizeOffset, 0)), 0),
            abbreviatedDecimalPlaces: abbreviatedDecimalPlaces,

            customDisplayRange: !!__nullish(c.customDisplayRange, __nullish(c.defaultGaugeCustomDisplayRange, false)),
            displayMin: BaseWidget.toFiniteNumber(
                __nullish(c.displayMin, __nullish(c.defaultGaugeDisplayMin, 0)),
                0
            ),
            displayMax: BaseWidget.toFiniteNumber(
                __nullish(c.displayMax, __nullish(c.defaultGaugeDisplayMax, 100)),
                100
            ),
            displayDecimalPlaces: Math.max(0, Math.floor(BaseWidget.toFiniteNumber(
                __nullish(c.displayDecimalPlaces, __nullish(c.defaultGaugeDisplayDecimalPlaces, 1)),
                1
            ))),
            displayKeepTrailingZeros: !!__nullish(
                c.displayKeepTrailingZeros,
                __nullish(c.defaultGaugeDisplayKeepTrailingZeros, false)
            ),
            solidBarColor: !!__nullish(c.solidBarColor, __nullish(c.defaultGaugeSolidBarColor, false))
        };

        [
            'labelFont', 'labelFs', 'labelCol', 'labelAlign', 'labelCase', 'labelBold', 'labelItalic', 'labelOffX', 'labelOffY',
            'valueFont', 'fsVal', 'colVal', 'valueBold', 'valOffX', 'valOffY',
            'fsUnit', 'colUnit',
            'axisFont', 'axisFontSize', 'axisFontColor', 'axisFontBold',
            'icon', 'iconUrl', 'iconColorize', 'iconFilled', 'colIcon', 'iconY'
        ].forEach((k) => { delete out[k]; });
        delete out.typography;
        delete out.icons;
        ['decimals', 'autoScale', 'shortenDecimals', 'fixedDecimalPlaces'].forEach((k) => { delete out[k]; });
        delete out.defaultGaugeAutoScale;
        delete out.defaultGaugeFixedDecimalPlaces;

        return out;
    }

    getSchema() {
        const iconKm = { ...GaugeWidget.ICON_KEYMAP_ON, color: 'iconSlotColOn' };
        const iconGroup = BaseWidget.getIconStyleSchema('Icon', iconKm, { exclude: ['hoverColor', 'size'] });
        BaseWidget.attachIconsNestedToIconStyleGroup(iconGroup, 'on');
        BaseWidget.attachIconAccentFieldDefaultKeys(iconGroup);
        GaugeWidget.attachGaugeIconMasterDefaultKeys(iconGroup);
        GaugeWidget.attachGaugeIconSectionVisibility(iconGroup);
        const iconSizeField = { key: 'iconSize', type: 'number', label: 'Icon Base Size (px)', cols: 12, defaultKey: 'defaultGaugeIconSize' };
        GaugeWidget.attachGaugeIconSectionVisibility(iconSizeField);

        return [
            {
                id: 'g_data', title: 'Data Configuration', icon: 'ph-database',
                fields: [
                    { key: 'value', type: 'number', label: 'Value', cols: 4 },
                    { key: 'decimalPlaces', type: 'number', label: 'Decimal Places', cols: 4 },
                    {
                        key: 'keepTrailingZeros', type: 'checkbox', label: 'Keep Trailing Zeros', cols: 4,
                        defaultKey: 'defaultGaugeKeepTrailingZeros'
                    },
                    { key: 'min', type: 'number', label: 'Min', cols: 6 },
                    { key: 'max', type: 'number', label: 'Max', cols: 6 },
                    {
                        key: 'customDisplayRange', type: 'checkbox', label: 'Custom display range', cols: 12,
                        defaultKey: 'defaultGaugeCustomDisplayRange'
                    },
                    {
                        key: 'displayMin', type: 'number', label: 'Display minimum', cols: 6,
                        defaultKey: 'defaultGaugeDisplayMin',
                        dependsOn: ['customDisplayRange', 'defaultGaugeCustomDisplayRange'],
                        visibleWhen: (v) => v.customDisplayRange === true
                    },
                    {
                        key: 'displayMax', type: 'number', label: 'Display maximum', cols: 6,
                        defaultKey: 'defaultGaugeDisplayMax',
                        dependsOn: ['customDisplayRange', 'defaultGaugeCustomDisplayRange'],
                        visibleWhen: (v) => v.customDisplayRange === true
                    },
                    {
                        key: 'displayDecimalPlaces', type: 'number', label: 'Decimal Places', cols: 6,
                        defaultKey: 'defaultGaugeDisplayDecimalPlaces',
                        dependsOn: ['customDisplayRange', 'defaultGaugeCustomDisplayRange'],
                        visibleWhen: (v) => v.customDisplayRange === true
                    },
                    {
                        key: 'displayKeepTrailingZeros', type: 'checkbox', label: 'Keep Trailing Zeros', cols: 6,
                        defaultKey: 'defaultGaugeDisplayKeepTrailingZeros',
                        dependsOn: ['customDisplayRange', 'defaultGaugeCustomDisplayRange'],
                        visibleWhen: (v) => v.customDisplayRange === true
                    },
                    { key: 'abbreviateLargeValues', type: 'checkbox', label: 'Abbreviate Large Values (k, M)', cols: 8, defaultKey: 'defaultGaugeAbbreviateLargeValues' },
                    {
                        key: 'abbreviatedDecimalPlaces', type: 'number', label: 'Decimal Places When Abbreviated', cols: 4,
                        dependsOn: ['abbreviateLargeValues', 'defaultGaugeAbbreviateLargeValues'],
                        visibleWhen: (v) => v.abbreviateLargeValues === true
                    }
                ]
            },
            (typeof DashboardAudio !== 'undefined' && DashboardAudio.schemaGroup)
                ? DashboardAudio.schemaGroup('g_audio', GaugeWidget.AUDIO_TRIGGERS)
                : {
                    id: 'g_audio', title: 'Audio', icon: 'ph-music-notes',
                    fields: [{ key: 'audio', type: 'audio_trigger_map', cols: 12, triggers: GaugeWidget.AUDIO_TRIGGERS }]
                },
            {
                id: 'g_style', title: 'Appearance', icon: 'ph-palette',
                fields: (() => {
                    const barHeading = { type: 'heading', label: 'Bar', cols: 12 };
                    const trackHeading = { type: 'heading', label: 'Track', cols: 12 };
                    const baselineHeading = { type: 'heading', label: 'Baseline', cols: 12 };
                    const axisHeading = { type: 'heading', label: 'Axis Labels', cols: 12 };
                    const barThicknessField = { key: 'barThickness', type: 'number', label: 'Bar Width', cols: 4, defaultKey: 'defaultGaugeBarThick' };
                    const trackThicknessField = { key: 'trackThickness', type: 'number', label: 'Track Width', cols: 4, defaultKey: 'defaultGaugeTrackThick' };
                    const gapRoundField = {
                        key: 'gapRound', type: 'number', label: 'Gap', cols: 12, defaultKey: 'defaultGaugeRoundGap',
                        dependsOn: ['barType', 'defaultGaugeType']
                    };
                    const gapHorizField = {
                        key: 'gapHoriz', type: 'number', label: 'Gap', cols: 12, defaultKey: 'defaultGaugeHorizontalGap',
                        dependsOn: ['barType', 'defaultGaugeType']
                    };
                    GaugeWidget.attachGaugeBarTypeVariantVisibility(gapRoundField, 'round');
                    GaugeWidget.attachGaugeBarTypeVariantVisibility(gapHorizField, 'horizontal');
                    const sizeOffsetField = { key: 'gaugeSizeOffset', type: 'number', label: 'Size Adjustment', cols: 6, defaultKey: 'defaultGaugeSizeOffset' };
                    const baselineValueField = { key: 'baselineValue', type: 'number', label: 'Baseline Value', cols: 6, default: 0 };
                    const rotateLabelsField = { key: 'rotateLabels', type: 'checkbox', label: 'Rotate Labels', cols: 6 };
                    const labelCountField = { key: 'labelCount', type: 'number', label: 'Target Tick Count', cols: 4 };
                    const labelOffsetField = { key: 'labelOffset', type: 'number', label: 'Label Offset', cols: 4 };
                    const axisDecimalsField = { key: 'axisDecimals', type: 'number', label: 'Axis Decimal Places', cols: 4 };
                    const axisRoundingField = {
                        key: 'axisRoundingMode', type: 'select', label: 'Scale Mode', options: [
                            { value: 'exact', text: 'Fit Data Range (Exact Min/Max)' },
                            { value: 'smart', text: 'Clean Steps (1, 2, 5...)' },
                            { value: 'strict', text: 'Whole Numbers Only (Counts)' }
                        ], cols: 6
                    };
                    const tickMarkThicknessField = { key: 'tickMarkThickness', type: 'number', label: 'Tick Mark Thickness', cols: 3 };
                    const tickMarkOffsetField = { key: 'tickMarkOffset', type: 'number', label: 'Tick Mark Offset', cols: 3 };
                    const tickMarkColorField = { key: 'tickMarkColorCustom', type: 'color', label: 'Tick Mark Color', cols: 3, defaultKey: 'tickMarkColor' };
                    const col0Field = { key: 'startColor', type: 'color', label: 'Start Color', cols: 4, gridColStart: 1, defaultKey: 'gaugeCol0' };
                    const colMidField = { key: 'colMidCustom', type: 'color', label: 'Middle / Baseline Color (auto)', cols: 4, defaultKey: 'colMid' };
                    const col100Field = { key: 'endColor', type: 'color', label: 'End Color', cols: 4, defaultKey: 'gaugeCol100' };
                    const solidBarColorField = {
                        key: 'solidBarColor', type: 'checkbox', label: 'Solid color at value', cols: 12,
                        defaultKey: 'defaultGaugeSolidBarColor'
                    };
                    const colTrackField = { key: 'trackColor', type: 'color', label: 'Track Color', cols: 4, defaultKey: 'gaugeColTrack' };
                    const trackOpacityField = { key: 'trackOpacity', type: 'number', min: 0, max: 100, label: 'Track Opacity', cols: 4, defaultKey: 'defaultGaugeTrackOpacity' };
                    const trackOutlineColorField = {
                        key: 'trackOutlineColor', type: 'color', label: 'Track Outline Color', cols: 4, defaultKey: 'defaultGaugeTrackOutlineColor',
                        dependsOn: ['trackOutlineWidth', 'defaultGaugeTrackOutlineWidth'],
                        visibleWhen: (values) => GaugeWidget.trackOutlineDetailsVisible(values, false)
                    };
                    const trackOutlineWidthField = { key: 'trackOutlineWidth', type: 'number', label: 'Track Outline Width', cols: 4, gridColStart: 1, defaultKey: 'defaultGaugeTrackOutlineWidth' };
                    const trackOutlineOpacityField = {
                        key: 'trackOutlineOpacity', type: 'number', min: 0, max: 100, label: 'Track Outline Opacity', cols: 4, defaultKey: 'defaultGaugeTrackOutlineOpacity',
                        dependsOn: ['trackOutlineWidth', 'defaultGaugeTrackOutlineWidth'],
                        visibleWhen: (values) => GaugeWidget.trackOutlineDetailsVisible(values, false)
                    };
                    const trackBlurField = { key: 'trackBlur', type: 'number', min: 0, label: 'Background Blur', cols: 12, defaultKey: 'defaultGaugeTrackBlur' };
                    const trackInnerGlowField = { key: 'trackInnerGlow', type: 'number', min: 0, label: 'Track Inner Glow', cols: 4, gridColStart: 1, defaultKey: 'defaultGaugeTrackInnerGlow' };
                    const trackInnerGlowColorField = {
                        key: 'trackInnerGlowColor', type: 'color', label: 'Track Inner Glow Color', cols: 4, defaultKey: 'defaultGaugeTrackInnerGlowColor',
                        dependsOn: ['trackInnerGlow', 'defaultGaugeTrackInnerGlow'],
                        visibleWhen: (values) => GaugeWidget.trackInnerGlowDetailsVisible(values, false)
                    };
                    const trackInnerGlowOpacityField = {
                        key: 'trackInnerGlowOpacity', type: 'number', min: 0, max: 100, label: 'Track Inner Glow Opacity', cols: 4, defaultKey: 'defaultGaugeTrackInnerGlowOpacity',
                        dependsOn: ['trackInnerGlow', 'defaultGaugeTrackInnerGlow'],
                        visibleWhen: (values) => GaugeWidget.trackInnerGlowDetailsVisible(values, false)
                    };
                    const barGlowField = { key: 'barGlow', type: 'checkbox', label: 'Bar Glow', cols: 4, defaultKey: 'gaugeBarGlow' };
                    const barOpacityField = { key: 'barOpacity', type: 'number', min: 0, max: 100, label: 'Bar Opacity', cols: 4, defaultKey: 'defaultGaugeBarOpacity' };
                    const barOutlineWidthField = { key: 'barOutlineWidth', type: 'number', min: 0, label: 'Bar Outline Width', cols: 4, gridColStart: 1, defaultKey: 'defaultGaugeBarOutlineWidth' };
                    const barOutlineColorField = {
                        key: 'barOutlineColor', type: 'color', label: 'Bar Outline Color', cols: 4, defaultKey: 'defaultGaugeBarOutlineColor',
                        dependsOn: ['barOutlineWidth', 'defaultGaugeBarOutlineWidth'],
                        visibleWhen: (values) => GaugeWidget.barOutlineDetailsVisible(values, false)
                    };
                    const barOutlineOpacityField = {
                        key: 'barOutlineOpacity', type: 'number', min: 0, max: 100, label: 'Bar Outline Opacity', cols: 4, defaultKey: 'defaultGaugeBarOutlineOpacity',
                        dependsOn: ['barOutlineWidth', 'defaultGaugeBarOutlineWidth'],
                        visibleWhen: (values) => GaugeWidget.barOutlineDetailsVisible(values, false)
                    };
                    const barInnerGlowField = { key: 'barInnerGlow', type: 'number', min: 0, label: 'Bar Inner Glow', cols: 4, gridColStart: 1, defaultKey: 'defaultGaugeBarInnerGlow' };
                    const barInnerGlowColorField = {
                        key: 'barInnerGlowColor', type: 'color', label: 'Bar Inner Glow Color', cols: 4, defaultKey: 'defaultGaugeBarInnerGlowColor',
                        dependsOn: ['barInnerGlow', 'defaultGaugeBarInnerGlow'],
                        visibleWhen: (values) => GaugeWidget.barInnerGlowDetailsVisible(values, false)
                    };
                    const barInnerGlowOpacityField = {
                        key: 'barInnerGlowOpacity', type: 'number', min: 0, max: 100, label: 'Bar Inner Glow Opacity', cols: 4, defaultKey: 'defaultGaugeBarInnerGlowOpacity',
                        dependsOn: ['barInnerGlow', 'defaultGaugeBarInnerGlow'],
                        visibleWhen: (values) => GaugeWidget.barInnerGlowDetailsVisible(values, false)
                    };

                    GaugeWidget.attachGaugeBarStyleSectionVisibility(barHeading);
                    GaugeWidget.attachGaugeBarStyleSectionVisibility(trackHeading);
                    [barThicknessField, trackThicknessField, sizeOffsetField,
                        col0Field, colMidField, col100Field, solidBarColorField,
                        barOpacityField, barOutlineWidthField, barOutlineColorField, barOutlineOpacityField,
                        barInnerGlowField, barInnerGlowColorField, barInnerGlowOpacityField, barGlowField,
                        colTrackField,
                        trackOpacityField, trackBlurField,
                        trackOutlineColorField, trackOutlineWidthField, trackOutlineOpacityField,
                        trackInnerGlowField, trackInnerGlowColorField, trackInnerGlowOpacityField
                    ].forEach((f) => GaugeWidget.attachGaugeBarStyleSectionVisibility(f));

                    GaugeWidget.attachGaugeBarStyleSectionVisibility(baselineHeading);
                    const baselineModeField = { key: 'baselineMode', type: 'checkbox', label: 'Enable Baseline', cols: 6 };
                    GaugeWidget.attachGaugeBarStyleSectionVisibility(baselineModeField);
                    baselineValueField.dependsOn = ['baselineMode'];
                    GaugeWidget.attachGaugeBarStyleSectionVisibility(baselineValueField, (v) => v.baselineMode === true);

                    GaugeWidget.attachGaugeBarStyleSectionVisibility(axisHeading);
                    const showLabelsField = { key: 'showLabels', type: 'checkbox', label: 'Show Labels', cols: 6 };
                    const showTickMarksField = { key: 'showTickMarks', type: 'checkbox', label: 'Show Tick Marks', cols: 6 };
                    [showLabelsField, showTickMarksField].forEach((f) => GaugeWidget.attachGaugeBarStyleSectionVisibility(f));

                    rotateLabelsField.dependsOn = ['showLabels'];
                    GaugeWidget.attachGaugeBarStyleSectionVisibility(rotateLabelsField, (v) => v.showLabels === true);
                    labelOffsetField.dependsOn = ['showLabels'];
                    GaugeWidget.attachGaugeBarStyleSectionVisibility(labelOffsetField, (v) => v.showLabels === true);
                    axisDecimalsField.dependsOn = ['showLabels'];
                    GaugeWidget.attachGaugeBarStyleSectionVisibility(axisDecimalsField, (v) => v.showLabels === true);
                    axisRoundingField.dependsOn = ['showLabels'];
                    GaugeWidget.attachGaugeBarStyleSectionVisibility(axisRoundingField, (v) => v.showLabels === true);

                    labelCountField.dependsOn = ['showLabels', 'showTickMarks'];
                    GaugeWidget.attachGaugeBarStyleSectionVisibility(labelCountField, (v) => v.showLabels === true || v.showTickMarks === true);

                    const tickMarkLengthField = { key: 'tickMarkLength', type: 'number', label: 'Tick Mark Length', cols: 3 };
                    tickMarkLengthField.dependsOn = ['showTickMarks'];
                    GaugeWidget.attachGaugeBarStyleSectionVisibility(tickMarkLengthField, (v) => v.showTickMarks === true);
                    tickMarkThicknessField.dependsOn = ['showTickMarks'];
                    GaugeWidget.attachGaugeBarStyleSectionVisibility(tickMarkThicknessField, (v) => v.showTickMarks === true);
                    tickMarkOffsetField.dependsOn = ['showTickMarks'];
                    GaugeWidget.attachGaugeBarStyleSectionVisibility(tickMarkOffsetField, (v) => v.showTickMarks === true);
                    tickMarkColorField.dependsOn = ['showTickMarks'];
                    GaugeWidget.attachGaugeBarStyleSectionVisibility(tickMarkColorField, (v) => v.showTickMarks === true);

                    return [
                        { key: 'barType', type: 'select', label: 'Style', options: ['round', 'horizontal', 'none'], cols: 6, defaultKey: 'defaultGaugeType' },
                        sizeOffsetField,
                        gapRoundField,
                        gapHorizField,
                        barHeading,
                        barThicknessField,
                        barOpacityField,
                        barGlowField,
                        col0Field,
                        colMidField,
                        col100Field,
                        solidBarColorField,
                        barOutlineWidthField,
                        barOutlineColorField,
                        barOutlineOpacityField,
                        barInnerGlowField,
                        barInnerGlowColorField,
                        barInnerGlowOpacityField,
                        trackHeading,
                        trackThicknessField,
                        colTrackField,
                        trackOpacityField,
                        trackBlurField,
                        trackOutlineWidthField,
                        trackOutlineColorField,
                        trackOutlineOpacityField,
                        trackInnerGlowField,
                        trackInnerGlowColorField,
                        trackInnerGlowOpacityField,
                        baselineHeading,
                        baselineModeField,
                        baselineValueField,
                        axisHeading,
                        showLabelsField,
                        rotateLabelsField,
                        labelCountField,
                        labelOffsetField,
                        axisDecimalsField,
                        axisRoundingField,
                        showTickMarksField,
                        tickMarkThicknessField,
                        tickMarkLengthField,
                        tickMarkOffsetField,
                        tickMarkColorField,
                        { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                        { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }
                    ];
                })()
            },
            {
                id: 'g_icon', title: 'Icon', icon: 'ph-star',
                fields: [
                    { key: 'showIcon', type: 'checkbox', label: 'Show Icon', cols: 12, defaultKey: 'defaultGaugeShowIcon' },
                    iconGroup,
                    iconSizeField
                ]
            },
            {
                id: 'g_text', title: 'Text & Typography', icon: 'ph-text-t',
                fields: (() => {
                    const layoutRoundField = {
                        key: 'layoutRound', type: 'select', label: 'Text Position', options: GaugeWidget.LAYOUT_POSITION_OPTIONS,
                        cols: 6, defaultKey: 'defaultGaugeRoundLayout'
                    };
                    const layoutHorizField = {
                        key: 'layoutHorizontal', type: 'select', label: 'Text Position', options: GaugeWidget.LAYOUT_POSITION_OPTIONS,
                        cols: 6, defaultKey: 'defaultGaugeHorizontalLayout'
                    };
                    GaugeWidget.attachGaugeBarTypeVariantVisibility(layoutRoundField, 'round');
                    GaugeWidget.attachGaugeBarTypeVariantVisibility(layoutHorizField, 'horizontal');
                    const captionTypographyGroup = GaugeWidget.buildGaugeCaptionTypographySchema(false);

                    return [
                    layoutRoundField,
                    layoutHorizField,
                    { key: 'label', type: 'text', label: 'Widget Label', cols: 6 },
                    { key: 'unit', type: 'text', label: 'Unit Text', cols: 6 },
                    {
                        key: 'valueAlignment', type: 'select', label: 'Value Horizontal Alignment', options: [
                            { value: 'left', text: 'Left' },
                            { value: 'center', text: 'Center' },
                            { value: 'right', text: 'Right' }
                        ], cols: 12,
                        dependsOn: ['layoutRound', 'layoutHorizontal', 'layoutHoriz', 'barType', 'defaultGaugeType', 'defaultGaugeRoundLayout', 'defaultGaugeHorizontalLayout']
                    },
                    captionTypographyGroup,
                    BaseWidget.getTypographySchema('gaugeValue', 'Value', {
                        exclude: ['align', 'case'],
                        nestedTypography: { root: 'typography', role: 'value' },
                        fontDefaultKey: 'defaultGaugeValueFont',
                        fontDefaultKeyFallback: 'fontFamily',
                        fontSizeDefaultKey: 'defaultGaugeValueFs',
                        colorDefaultKey: 'defaultGaugeValueCol',
                        boldDefaultKey: 'defaultGaugeValueBold',
                        italicDefaultKey: 'defaultGaugeValueItalic',
                        opacityDefaultKey: 'defaultGaugeValueOpacity',
                        offXDefaultKey: 'defaultGaugeValueOffX',
                        offYDefaultKey: 'defaultGaugeValueOffY'
                    }),
                    BaseWidget.getTypographySchema('gaugeUnit', 'Unit', {
                        exclude: ['align', 'case', 'offset'],
                        nestedTypography: { root: 'typography', role: 'unit' },
                        fontDefaultKeyFallback: 'fontFamily',
                        fontSizeDefaultKey: 'defaultGaugeUnitFs',
                        colorDefaultKey: 'defaultGaugeUnitCol',
                        boldDefaultKey: 'defaultGaugeUnitBold',
                        italicDefaultKey: 'defaultGaugeUnitItalic',
                        opacityDefaultKey: 'defaultGaugeUnitOpacity'
                    }),
                    BaseWidget.getTypographySchema('gaugeAxis', 'Axis Labels', {
                        exclude: ['align', 'case', 'offset'],
                        nestedTypography: { root: 'typography', role: 'axis' },
                        fontDefaultKeyFallback: 'fontFamily',
                        fontSizeDefaultKey: 'defaultGaugeAxisFs',
                        colorDefaultKey: 'defaultGaugeAxisCol',
                        boldDefaultKey: 'defaultGaugeAxisBold',
                        italicDefaultKey: 'defaultGaugeAxisItalic',
                        opacityDefaultKey: 'defaultGaugeAxisOpacity'
                    })
                    ];
                })()
            }
        ];
    }

    /**
     * Inner-glow filter for a round SVG stroke. CSS inset box-shadow is not
     * available on a stroke, so this inverts the stroke alpha, blurs it, and
     * clips back to the path. Peak and falloff match the horizontal track
     * (`inset 0 0 <size>`, sigma = size * 0.36, same as Container custom shape).
     * Built with createElementNS so Safari 12 gets real SVG filter primitives.
     */
    _fillRoundStrokeInnerGlowFilter(filter) {
        if (!filter) return null;
        const ns = 'http://www.w3.org/2000/svg';
        while (filter.firstChild) filter.removeChild(filter.firstChild);

        const invert = document.createElementNS(ns, 'feComponentTransfer');
        invert.setAttribute('in', 'SourceAlpha');
        invert.setAttribute('result', 'ig-inv');
        const funcA = document.createElementNS(ns, 'feFuncA');
        funcA.setAttribute('type', 'table');
        funcA.setAttribute('tableValues', '1 0');
        invert.appendChild(funcA);

        const blur = document.createElementNS(ns, 'feGaussianBlur');
        blur.setAttribute('in', 'ig-inv');
        blur.setAttribute('result', 'ig-blur');

        const clip = document.createElementNS(ns, 'feComposite');
        clip.setAttribute('in', 'ig-blur');
        clip.setAttribute('in2', 'SourceAlpha');
        clip.setAttribute('operator', 'in');
        clip.setAttribute('result', 'ig-mask');

        const flood = document.createElementNS(ns, 'feFlood');
        flood.setAttribute('result', 'ig-color');

        const colorize = document.createElementNS(ns, 'feComposite');
        colorize.setAttribute('in', 'ig-color');
        colorize.setAttribute('in2', 'ig-mask');
        colorize.setAttribute('operator', 'in');

        filter.appendChild(invert);
        filter.appendChild(blur);
        filter.appendChild(clip);
        filter.appendChild(flood);
        filter.appendChild(colorize);
        return { blur: blur, flood: flood };
    }

    _initRoundInnerGlowFilter() {
        const track = this._fillRoundStrokeInnerGlowFilter(this.els && this.els.roundIgFilter);
        if (track) {
            this.els.roundIgBlur = track.blur;
            this.els.roundIgFlood = track.flood;
        }
        const bar = this._fillRoundStrokeInnerGlowFilter(this.els && this.els.roundBarIgFilter);
        if (bar) {
            this.els.roundBarIgBlur = bar.blur;
            this.els.roundBarIgFlood = bar.flood;
        }
    }

    _tuneRoundInnerGlowFilter(filter, blur, flood, size, color, opacity) {
        if (!filter || !blur || !flood) return;
        const igPad = Math.max(40, Math.ceil(size * 2));
        filter.setAttribute('x', String(-igPad));
        filter.setAttribute('y', String(-igPad));
        filter.setAttribute('width', String(200 + igPad * 2));
        filter.setAttribute('height', String(200 + igPad * 2));
        blur.setAttribute('stdDeviation', String(size * 0.36));
        flood.setAttribute('flood-color', GaugeWidget._paintColor(color));
        const igOp = Math.min(1, Math.max(0, Number(opacity) / 100));
        flood.setAttribute('flood-opacity', String(Number.isFinite(igOp) ? igOp : 1));
    }

    // Fade the path itself. An SVG stroke color does not keep alpha.
    _paintRoundStroke(pathEl, color, opacity) {
        if (!pathEl) return;
        const opaque = GaugeWidget._paintColor(color);
        const opNum = Number(opacity);
        const opStr = (!Number.isFinite(opNum) || opNum >= 100)
            ? '1'
            : String(Math.max(0, Math.min(1, opNum / 100)));
        if (pathEl.getAttribute('stroke') !== opaque) pathEl.setAttribute('stroke', opaque);
        if (pathEl.style.opacity !== opStr) pathEl.style.opacity = opStr;
    }

    // The outline is a thicker copy of the same arc. Punch out the inner stroke
    // so it stays a rim and does not show through a translucent track or bar.
    _ensureRimMask(e, key, maskId) {
        if (!e || e[key]) return e ? e[key] : null;
        const svg = e.roundSvg;
        if (!svg) return null;
        const ns = 'http://www.w3.org/2000/svg';
        let defs = svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS(ns, 'defs');
            svg.insertBefore(defs, svg.firstChild);
        }
        const mask = document.createElementNS(ns, 'mask');
        mask.setAttribute('id', maskId);
        mask.setAttribute('maskUnits', 'userSpaceOnUse');
        mask.setAttribute('maskContentUnits', 'userSpaceOnUse');
        const rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('fill', '#ffffff');
        const hole = document.createElementNS(ns, 'path');
        hole.setAttribute('fill', 'none');
        hole.setAttribute('stroke', '#000000');
        hole.setAttribute('stroke-linecap', 'round');
        mask.appendChild(rect);
        mask.appendChild(hole);
        defs.appendChild(mask);
        e[key] = { mask: mask, rect: rect, hole: hole };
        return e[key];
    }

    _applyRimMask(e, outlineEl, key, maskId, arcPath, innerWidth, pad) {
        if (!outlineEl) return;
        const slot = this._ensureRimMask(e, key, maskId);
        if (!slot) return;
        const inset = Math.max(0, Math.ceil(pad));
        const x = String(-inset);
        const size = String(200 + inset * 2);
        slot.mask.setAttribute('x', x);
        slot.mask.setAttribute('y', x);
        slot.mask.setAttribute('width', size);
        slot.mask.setAttribute('height', size);
        slot.rect.setAttribute('x', x);
        slot.rect.setAttribute('y', x);
        slot.rect.setAttribute('width', size);
        slot.rect.setAttribute('height', size);
        slot.hole.setAttribute('d', arcPath || '');
        slot.hole.setAttribute('stroke-width', String(Math.max(0, Number(innerWidth) || 0)));
        const maskRef = 'url(#' + slot.mask.id + ')';
        if (outlineEl.getAttribute('mask') !== maskRef) outlineEl.setAttribute('mask', maskRef);
    }

    _clearRimMask(outlineEl) {
        if (outlineEl && outlineEl.getAttribute('mask')) outlineEl.removeAttribute('mask');
    }

    _describeScaledArc(cx, cy, rx, ry, startAngle, endAngle) {
        const pt = function (angleDeg) {
            const rad = (angleDeg - 90) * Math.PI / 180;
            return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
        };
        const start = pt(endAngle);
        const end = pt(startAngle);
        const large = (endAngle - startAngle) <= 180 ? '0' : '1';
        return 'M ' + start.x + ' ' + start.y + ' A ' + rx + ' ' + ry + ' 0 ' + large + ' 0 ' + end.x + ' ' + end.y;
    }

    _ensureRoundTrackFrost(e) {
        if (!e || e.roundTrackFrost) return;
        const ns = 'http://www.w3.org/2000/svg';
        const maskId = 'trk-msk-' + this.id;
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('class', 'trk-frost-svg');
        svg.style.position = 'absolute';
        svg.style.left = '0';
        svg.style.top = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.overflow = 'visible';
        svg.style.pointerEvents = 'none';
        const defs = document.createElementNS(ns, 'defs');
        const mask = document.createElementNS(ns, 'mask');
        mask.setAttribute('id', maskId);
        mask.setAttribute('maskUnits', 'userSpaceOnUse');
        mask.setAttribute('maskContentUnits', 'userSpaceOnUse');
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#ffffff');
        path.setAttribute('stroke-linecap', 'round');
        mask.appendChild(path);
        defs.appendChild(mask);
        svg.appendChild(defs);
        const frost = document.createElement('div');
        frost.className = 'trk-frost';
        frost.style.position = 'absolute';
        frost.style.left = '0';
        frost.style.top = '0';
        frost.style.right = '0';
        frost.style.bottom = '0';
        frost.style.pointerEvents = 'none';
        frost.style.display = 'none';
        const vis = e.vis;
        if (vis && e.roundSvg && e.roundSvg.parentNode === vis) {
            vis.insertBefore(svg, e.roundSvg);
            vis.insertBefore(frost, svg);
        } else if (vis) {
            vis.insertBefore(svg, vis.firstChild);
            vis.insertBefore(frost, svg);
        }
        e.roundTrackFrostSvg = svg;
        e.roundTrackMask = mask;
        e.roundTrackMaskPath = path;
        e.roundTrackFrost = frost;
    }

    _hideRoundTrackFrost(e) {
        this._stopRoundTrackFrostFollow();
        const frost = e && e.roundTrackFrost;
        if (!frost) return;
        if (frost.style.display !== 'none') frost.style.display = 'none';
        this._syncBackdropBlur(frost, 0);
    }

    _roundFrostBox(e) {
        const svg = e && e.roundSvg;
        if (!svg || svg.style.display === 'none') return null;
        const w = svg.clientWidth;
        const h = svg.clientHeight;
        if (!(w > 0) || !(h > 0)) return null;
        return { w: w, h: h };
    }

    // Frost only the track ribbon, and only while it is translucent. At 0 the
    // layer is not created, so a default gauge does not sample the backdrop.
    // The mask is in CSS pixels of the SVG viewport (xMidYMid meet).
    _syncRoundTrackFrost(e, active, c, svgR, fromFollow) {
        const blurPx = (active && c && Number(c.trackOpacity) < 100) ? (Number(c.trackBlur) || 0) : 0;
        if (!(blurPx > 0)) {
            this._hideRoundTrackFrost(e);
            return;
        }
        this._frostSnap = {
            trackOpacity: c.trackOpacity,
            trackBlur: c.trackBlur,
            trackThickness: c.trackThickness,
            svgR: svgR
        };
        const box = this._roundFrostBox(e);
        if (!box) {
            if (!fromFollow && this._frostFollowRaf == null && !(this._frostFollowLeft > 0)) {
                this._startRoundTrackFrostFollow();
            }
            return;
        }
        this._ensureRoundTrackFrost(e);
        const path = e.roundTrackMaskPath;
        const mask = e.roundTrackMask;
        if (!path || !mask) {
            this._hideRoundTrackFrost(e);
            return;
        }
        const w = box.w;
        const h = box.h;
        const scale = Math.min(w / 200, h / 200);
        const ox = (w - 200 * scale) / 2;
        const oy = (h - 200 * scale) / 2;
        mask.setAttribute('x', String(ox - 40));
        mask.setAttribute('y', String(oy - 40));
        mask.setAttribute('width', String(200 * scale + 80));
        mask.setAttribute('height', String(200 * scale + 80));
        path.setAttribute('d', this._describeScaledArc(ox + 100 * scale, oy + 100 * scale, svgR * scale, svgR * scale, -130, 130));
        path.setAttribute('stroke-width', String((Number(c.trackThickness) || 0) * scale));
        const frost = e.roundTrackFrost;
        if (frost) {
            const maskRef = 'url(#' + mask.id + ')';
            if (frost._dsTrackMask !== maskRef) {
                frost._dsTrackMask = maskRef;
                frost.style.setProperty('-webkit-mask', maskRef);
                frost.style.setProperty('mask', maskRef);
            }
            if (frost.style.display !== 'block') frost.style.display = 'block';
        }
        this._syncBackdropBlur(frost, blurPx);
        const prev = this._frostPainted;
        const sizeChanged = !prev || prev.w !== w || prev.h !== h;
        this._frostPainted = box;
        if (!fromFollow && sizeChanged) this._startRoundTrackFrostFollow();
    }

    // First layout often finishes after the opening paint. Keep matching the
    // SVG box until it settles, then keep a resize watch where the browser has one.
    _startRoundTrackFrostFollow() {
        const e = this.els;
        if (e && e.roundSvg && typeof ResizeObserver === 'function') {
            if (!this._frostResizeObserver) {
                const self = this;
                this._frostResizeObserver = new ResizeObserver(function () {
                    self._followRoundTrackFrost();
                });
            }
            if (this._frostObserved !== e.roundSvg) {
                this._frostResizeObserver.disconnect();
                this._frostResizeObserver.observe(e.roundSvg);
                this._frostObserved = e.roundSvg;
            }
        }
        this._frostFollowLeft = 16;
        this._queueRoundTrackFrostFollow();
    }

    _queueRoundTrackFrostFollow() {
        if (this._frostFollowRaf != null) return;
        const self = this;
        this._frostFollowRaf = requestAnimationFrame(function () {
            self._frostFollowRaf = null;
            self._followRoundTrackFrost();
        });
    }

    _followRoundTrackFrost() {
        if (this._frostFollowing) return;
        const e = this.els;
        const snap = this._frostSnap;
        if (!e || !snap) return;
        const box = this._roundFrostBox(e);
        const painted = this._frostPainted;
        if (!box) {
            if (this._frostFollowLeft > 0) {
                this._frostFollowLeft -= 1;
                this._queueRoundTrackFrostFollow();
            }
            return;
        }
        if (!painted || box.w !== painted.w || box.h !== painted.h) {
            this._frostFollowing = true;
            this._syncRoundTrackFrost(e, true, snap, snap.svgR, true);
            this._frostFollowing = false;
        }
        if (this._frostFollowLeft > 0) {
            this._frostFollowLeft -= 1;
            this._queueRoundTrackFrostFollow();
        }
    }

    _stopRoundTrackFrostFollow() {
        this._frostSnap = null;
        this._frostPainted = null;
        this._frostFollowLeft = 0;
        if (this._frostFollowRaf != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._frostFollowRaf);
            this._frostFollowRaf = null;
        }
        if (this._trackFrostRaf != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._trackFrostRaf);
            this._trackFrostRaf = null;
        }
        if (this._frostResizeObserver) {
            this._frostResizeObserver.disconnect();
            this._frostResizeObserver = null;
            this._frostObserved = null;
        }
    }

    _hideRoundBarChrome(e) {
        if (e.roundBarOutline) {
            e.roundBarOutline.style.display = 'none';
            this._clearRimMask(e.roundBarOutline);
        }
        if (e.roundBarIg) e.roundBarIg.style.display = 'none';
        if (e.roundDotIg) e.roundDotIg.style.display = 'none';
        if (e.roundProg) e.roundProg.setAttribute('stroke-opacity', '1');
        if (e.roundDot) {
            e.roundDot.setAttribute('stroke', 'none');
            e.roundDot.setAttribute('stroke-width', '0');
            e.roundDot.setAttribute('fill-opacity', '1');
        }
    }

    /**
     * Bar outline, opacity, and inner glow for the round SVG bar. Reads whether
     * the progress arc or the baseline dot is showing so live value updates
     * stay in sync without a second geometry pass.
     */
    _syncRoundBarChrome(e, c) {
        const hasBar = c.barThickness > 0;
        const progOn = hasBar && e.roundProg && e.roundProg.style.display !== 'none';
        const dotOn = hasBar && e.roundDot && e.roundDot.style.display !== 'none';
        if (!hasBar || (!progOn && !dotOn) || c.deactivated) {
            this._hideRoundBarChrome(e);
            return;
        }

        const outW = Number(c.barOutlineWidth) || 0;
        const igSize = Number(c.barInnerGlow) || 0;
        const barOp = Math.min(1, Math.max(0, Number(c.barOpacity) / 100));
        const opAttr = String(Number.isFinite(barOp) ? barOp : 1);
        const outOp = Math.min(1, Math.max(0, Number(c.barOutlineOpacity) / 100));

        if (progOn) {
            e.roundProg.setAttribute('stroke-opacity', opAttr);
            const d = e.roundProg.getAttribute('d') || '';
            if (outW > 0 && e.roundBarOutline) {
                e.roundBarOutline.style.display = 'block';
                e.roundBarOutline.setAttribute('d', d);
                e.roundBarOutline.setAttribute('stroke-width', c.barThickness + (outW * 2));
                e.roundBarOutline.setAttribute('stroke', GaugeWidget._paintColor(c.barOutlineColor));
                e.roundBarOutline.setAttribute('stroke-opacity', String(Number.isFinite(outOp) ? outOp : 1));
                this._applyRimMask(e, e.roundBarOutline, 'roundBarRim', 'bar-rim-' + this.id, d, c.barThickness, c.barThickness + (outW * 2) + 24);
            } else if (e.roundBarOutline) {
                e.roundBarOutline.style.display = 'none';
                this._clearRimMask(e.roundBarOutline);
            }
            if (igSize > 0 && e.roundBarIg) {
                e.roundBarIg.style.display = 'block';
                e.roundBarIg.setAttribute('d', d);
                e.roundBarIg.setAttribute('stroke-width', c.barThickness);
                e.roundBarIg.setAttribute('stroke', '#ffffff');
                e.roundBarIg.setAttribute('stroke-opacity', '1');
                e.roundBarIg.style.filter = 'url(#bar-ig-' + this.id + ')';
                this._tuneRoundInnerGlowFilter(e.roundBarIgFilter, e.roundBarIgBlur, e.roundBarIgFlood, igSize, c.barInnerGlowColor, c.barInnerGlowOpacity);
            } else if (e.roundBarIg) {
                e.roundBarIg.style.display = 'none';
            }
            if (e.roundDotIg) e.roundDotIg.style.display = 'none';
            if (e.roundDot) {
                e.roundDot.setAttribute('stroke', 'none');
                e.roundDot.setAttribute('stroke-width', '0');
                e.roundDot.setAttribute('fill-opacity', '1');
            }
            return;
        }

        if (e.roundBarOutline) {
            e.roundBarOutline.style.display = 'none';
            this._clearRimMask(e.roundBarOutline);
        }
        if (e.roundBarIg) e.roundBarIg.style.display = 'none';
        e.roundDot.setAttribute('fill-opacity', opAttr);
        if (outW > 0) {
            e.roundDot.setAttribute('stroke', GaugeWidget._paintColor(c.barOutlineColor));
            e.roundDot.setAttribute('stroke-width', String(outW * 2));
            e.roundDot.setAttribute('stroke-opacity', String(Number.isFinite(outOp) ? outOp : 1));
        } else {
            e.roundDot.setAttribute('stroke', 'none');
            e.roundDot.setAttribute('stroke-width', '0');
        }
        if (igSize > 0 && e.roundDotIg) {
            e.roundDotIg.style.display = 'block';
            e.roundDotIg.setAttribute('cx', e.roundDot.getAttribute('cx') || '0');
            e.roundDotIg.setAttribute('cy', e.roundDot.getAttribute('cy') || '0');
            e.roundDotIg.setAttribute('r', String(c.barThickness / 2));
            e.roundDotIg.setAttribute('fill', '#ffffff');
            e.roundDotIg.style.filter = 'url(#bar-ig-' + this.id + ')';
            this._tuneRoundInnerGlowFilter(e.roundBarIgFilter, e.roundBarIgBlur, e.roundBarIgFlood, igSize, c.barInnerGlowColor, c.barInnerGlowOpacity);
        } else if (e.roundDotIg) {
            e.roundDotIg.style.display = 'none';
        }
    }

    _syncHorizBarChrome(e, c, hasBar) {
        if (!e.hProg) return;
        if (!hasBar || c.deactivated) {
            e.hProg.style.border = 'none';
            e.hProg.style.boxShadow = 'none';
            return;
        }
        const outW = Number(c.barOutlineWidth) || 0;
        if (outW > 0) {
            e.hProg.style.border = outW + 'px solid ' + BaseWidget.colorAtOpacity(c.barOutlineColor, c.barOutlineOpacity);
        } else {
            e.hProg.style.border = 'none';
        }
        const shadows = [];
        if (c.barGlow && c.glowEnabled) {
            shadows.push('0 0 10px ' + BaseWidget.resolveCssColor(c.glowColor));
        }
        const ig = BaseWidget.elementInnerGlowShadow(c.barInnerGlow, c.barInnerGlowColor, c.barInnerGlowOpacity);
        if (ig) shadows.push(ig);
        e.hProg.style.boxShadow = shadows.length > 0 ? shadows.join(', ') : 'none';
    }

    _buildBaseDOM() {
        const base = super._buildBaseDOM();
        const container = base.innerContent;

        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';

        const gidRound = `g-rnd-${this.id}`;
        const filterId = `glow-${this.id}`;

        container.innerHTML = `
            <div class="vis" style="position:relative;display:flex;align-items:center;justify-content:center;">
                <svg class="rnd" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;">
                    <defs>
                        <linearGradient class="rnd-grad" id="${gidRound}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="200" y2="0">
                            <stop class="stop-0" offset="0%" stop-color="#888888"/>
                            <stop class="stop-50" offset="50%" stop-color="#888888"/>
                            <stop class="stop-100" offset="100%" stop-color="#888888"/>
                        </linearGradient>
                        <filter id="${filterId}" filterUnits="userSpaceOnUse" x="-30" y="-30" width="260" height="260">
                            <feGaussianBlur stdDeviation="3" result="c"/>
                            <feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                        <filter id="ig-${this.id}" class="ig-flt" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB" x="-40" y="-40" width="280" height="280"></filter>
                        <filter id="bar-ig-${this.id}" class="bar-ig-flt" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB" x="-40" y="-40" width="280" height="280"></filter>
                    </defs>
                    <path class="trk-out" fill="none" stroke-linecap="round" style="display:none;"/>
                    <path class="trk" fill="none" stroke-linecap="round"/>
                    <path class="trk-ig" fill="none" stroke="#ffffff" stroke-linecap="round" style="display:none;"/>
                    <path class="prg-out" fill="none" stroke-linecap="round" style="display:none;"/>
                    <path class="prg" fill="none" stroke="url(#${gidRound})" stroke-linecap="round"/>
                    <path class="prg-ig" fill="none" stroke="#ffffff" stroke-linecap="round" style="display:none;"/>
                    <circle class="dot" fill="none" stroke-linecap="round" style="display:none;"/>
                    <circle class="dot-ig" fill="#ffffff" style="display:none;"/>
                    <g class="axis-lbl-grp"></g>
                </svg>
                <div class="icn" style="position:relative;z-index:10;display:flex;align-items:center;justify-content:center;">
                </div>
            </div>
            <div class="cnt" style="display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;min-width:0;">
                <div class="lbl" style="font-weight:600;letter-spacing:0.1em;margin-bottom:0.25rem;width:100%;"></div>
                <div class="grp" style="display:flex;align-items:baseline;line-height:1;white-space:nowrap;">
                    <span class="val"></span>
                    <span class="unit" style="font-weight:500;opacity:0.8;margin-left:2px;"></span>
                </div>
                <div class="hrz" style="width:100%;position:relative;margin-top:0.5rem;display:none;min-width:0;">
                    <div class="htrk" style="width:100%;position:absolute;left:0;border-radius:99px;box-sizing:content-box;"></div>
                    <div class="hprg" style="position:absolute;border-radius:99px;width:0%;box-sizing:content-box;"></div>
                    <div class="haxis" style="position:absolute;width:100%;left:0;pointer-events:none;"></div>
                </div>
            </div>`;
        this.els = {
            vis: container.querySelector('.vis'),
            cnt: container.querySelector('.cnt'),
            roundSvg: container.querySelector('.rnd'),
            roundOutline: container.querySelector('.trk-out'),
            roundTrack: container.querySelector('.trk'),
            roundTrackIg: container.querySelector('.trk-ig'),
            roundIgFilter: container.querySelector('.ig-flt'),
            roundBarOutline: container.querySelector('.prg-out'),
            roundProg: container.querySelector('.prg'),
            roundBarIg: container.querySelector('.prg-ig'),
            roundBarIgFilter: container.querySelector('.bar-ig-flt'),
            roundDot: container.querySelector('.dot'),
            roundDotIg: container.querySelector('.dot-ig'),
            axisLblGrp: container.querySelector('.axis-lbl-grp'),
            iconWrap: container.querySelector('.icn'),
            lbl: container.querySelector('.lbl'),
            grp: container.querySelector('.grp'),
            val: container.querySelector('.val'),
            unit: container.querySelector('.unit'),
            horizBar: container.querySelector('.hrz'),
            hTrack: container.querySelector('.htrk'),
            hProg: container.querySelector('.hprg'),
            hAxis: container.querySelector('.haxis'),
            roundGrad: container.querySelector('.rnd-grad'),
            stopR0: container.querySelector('.rnd-grad .stop-0'),
            stopR50: container.querySelector('.rnd-grad .stop-50'),
            stopR100: container.querySelector('.rnd-grad .stop-100')
        };
        this._initRoundInnerGlowFilter();
        return base;
    }

    _formatDisplayValue(val, decimalPlaces, abbreviateLargeValues, unit, abbreviatedDecimalPlaces, keepTrailingZeros) {
        const u = unit === undefined || unit === null ? '' : unit;
        const sd = abbreviatedDecimalPlaces === undefined || abbreviatedDecimalPlaces === null ? 0 : abbreviatedDecimalPlaces;
        const fixedZeros = keepTrailingZeros === true;
        if (isNaN(val)) return { valText: "---", unitText: u };
        let scaledVal = val;
        let prefix = "";
        if (abbreviateLargeValues) {
            const absVal = Math.abs(val);
            if (absVal >= 1000000) {
                scaledVal = val / 1000000;
                prefix = "M";
            } else if (absVal >= 1000) {
                scaledVal = val / 1000;
                prefix = "k";
            }
        }
        const activeDec = (abbreviateLargeValues && prefix) ? sd : decimalPlaces;
        const roundedStr = scaledVal.toFixed(activeDec);
        const valText = fixedZeros ? roundedStr : parseFloat(roundedStr);
        return {
            valText: valText,
            unitText: prefix + u
        };
    }

    _formatAxisValue(val, axisDecimalPlaces) {
        const c = this.config;
        const displayFormat = GaugeWidget.resolveGaugeDisplayFormat(c);
        const axisDec = c.customDisplayRange ? displayFormat.decimalPlaces : axisDecimalPlaces;
        const keepZeros = c.customDisplayRange ? displayFormat.keepTrailingZeros : c.keepTrailingZeros;
        const formatted = this._formatDisplayValue(
            val, axisDec, c.abbreviateLargeValues, "", c.abbreviatedDecimalPlaces, keepZeros
        );
        return formatted.valText + (c.abbreviateLargeValues ? formatted.unitText : "");
    }

    _buildAxisConfigSignature(c, geomSig, gaugeMin, gaugeRange) {
        return [
            geomSig,
            gaugeMin,
            gaugeRange,
            c.min,
            c.max,
            c.showLabels ? '1' : '0',
            c.showTickMarks ? '1' : '0',
            c.baselineMode ? '1' : '0',
            c.baselineValue,
            c.labelCount,
            c.axisRoundingMode,
            c.gaugeAxisFs,
            c.gaugeAxisFont,
            c.gaugeAxisCol,
            c.gaugeAxisBold ? '1' : '0',
            c.gaugeAxisItalic ? '1' : '0',
            c.gaugeAxisCase,
            c.gaugeAxisOpacity,
            c.gaugeAxisOffX,
            c.gaugeAxisOffY,
            c.tickMarkLength,
            c.tickMarkOffset,
            c.tickMarkColor,
            c.tickMarkThickness,
            c.axisDecimals,
            c.labelOffset,
            c.rotateLabels ? '1' : '0',
            c.customDisplayRange ? '1' : '0',
            c.displayMin,
            c.displayMax,
            c.displayDecimalPlaces,
            c.keepTrailingZeros ? '1' : '0',
            c.abbreviateLargeValues ? '1' : '0',
            c.abbreviatedDecimalPlaces,
            c.deactivated ? '1' : '0',
            c.deactivatedColorAccent,
            BaseWidget.getThemeColorsSignature()
        ].join('\x01');
    }

    // Renders axis labels and optional tick marks for the round (radial) gauge style.
    _renderRadialAxis(c, svgCx, svgCy, svgR, startAngle, totalAngle, gaugeMin, gaugeRange) {
        const grp = this.els.axisLblGrp;
        if (!c.showLabels && !c.showTickMarks) {
            if (grp.firstChild) grp.innerHTML = '';
            this._lastRadialAxisSig = '';
            return;
        }
        if (gaugeRange === 0) {
            if (grp.firstChild) grp.innerHTML = '';
            this._lastRadialAxisSig = '';
            return;
        }

        const radialSig = this._buildAxisConfigSignature(
            c,
            svgCx + ':' + svgCy + ':' + svgR + ':' + startAngle + ':' + totalAngle,
            gaugeMin,
            gaugeRange
        );
        if (this._lastRadialAxisSig === radialSig && grp.firstChild) {
            return;
        }
        this._lastRadialAxisSig = radialSig;
        grp.innerHTML = '';

        const effectiveBaseline = c.baselineMode ? c.baselineValue : gaugeMin;
        const { ticks } = DashboardMathUtils.calculateTicks(
            gaugeMin, gaugeMin + gaugeRange, effectiveBaseline,
            Math.max(1, c.labelCount - 1), c.axisRoundingMode
        );

        // In smart/strict mode calculateTicks may expand bounds beyond the gauge range;
        // filter strictly to the physical arc boundaries before placing any label.
        const gaugeMax = gaugeMin + gaugeRange;
        const inBoundsTicks = ticks.filter(t => t.value >= gaugeMin - 1e-9 && t.value <= gaugeMax + 1e-9);

        // Collision detection uses angular distance (as a fraction of total arc, ~arc-length equivalent)
        const minAngleFraction = (c.gaugeAxisFs * 1.8) / (2 * Math.PI * svgR);
        const placedFractions = [];

        const filtered = [];
        // Priority pass
        for (const t of inBoundsTicks) {
            const frac = Math.max(0, Math.min((t.value - gaugeMin) / gaugeRange, 1));
            if (t.isPriority && !placedFractions.some(pf => Math.abs(pf - frac) < minAngleFraction)) {
                filtered.push(t);
                placedFractions.push(frac);
            }
        }
        // Non-priority pass
        for (const t of inBoundsTicks) {
            const frac = Math.max(0, Math.min((t.value - gaugeMin) / gaugeRange, 1));
            if (!t.isPriority && !placedFractions.some(pf => Math.abs(pf - frac) < minAngleFraction)) {
                filtered.push(t);
                placedFractions.push(frac);
            }
        }

        const halfLen = c.tickMarkLength / 2;

        filtered.forEach(t => {
            const pct = Math.max(0, Math.min((t.value - gaugeMin) / gaugeRange, 1));
            const angleDeg = startAngle + pct * totalAngle;

            if (c.showTickMarks) {
                const innerPt = SVGUtils.polarToCartesian(svgCx, svgCy, svgR + c.tickMarkOffset - halfLen, angleDeg);
                const outerPt = SVGUtils.polarToCartesian(svgCx, svgCy, svgR + c.tickMarkOffset + halfLen, angleDeg);
                const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
                tick.setAttribute('x1', innerPt.x);
                tick.setAttribute('y1', innerPt.y);
                tick.setAttribute('x2', outerPt.x);
                tick.setAttribute('y2', outerPt.y);
                tick.setAttribute('stroke', BaseWidget.resolveCssColor(c.tickMarkColor));
                tick.setAttribute('stroke-width', c.tickMarkThickness);
                tick.setAttribute('stroke-linecap', 'round');
                grp.appendChild(tick);
            }

            if (c.showLabels) {
                const textStr = this._formatAxisValue(
                    GaugeWidget.mapGaugeDisplayValue(t.value, c),
                    c.axisDecimals
                ).toString();
                let adjustedRadius = svgR + c.labelOffset;

                if (!c.rotateLabels) {
                    // Normalize the radial gap for standard rendering to prevent side text from encroaching.
                    // Calculate the ray intersection boundary from the text box center.
                    const angleRad = angleDeg * (Math.PI / 180);
                    // Slightly over-estimate the width (0.75 instead of 0.6) to push side text slightly
                    // further radially to visually match the vertical padding of top text.
                    const estimatedWidth = textStr.length * (c.gaugeAxisFs * 0.75);
                    const estimatedHeight = c.gaugeAxisFs;

                    const absSin = Math.abs(Math.sin(angleRad));
                    const absCos = Math.abs(Math.cos(angleRad));

                    let rayDist = estimatedHeight / 2;
                    if (absSin > 0.001 || absCos > 0.001) {
                        const maxDistX = absSin > 0 ? (estimatedWidth / 2) / absSin : Infinity;
                        const maxDistY = absCos > 0 ? (estimatedHeight / 2) / absCos : Infinity;
                        rayDist = Math.min(maxDistX, maxDistY);
                    }
                    // Retain perfect backward-compatibility by aligning the universal circular gap
                    // to match the top-text gap. Top text visually stays exactly where it was.
                    // If labelOffset is negative, labels are inside, so shift inwards rather than outwards.
                    const correction = rayDist - estimatedHeight / 2;
                    adjustedRadius += (c.labelOffset >= 0 ? 1 : -1) * correction;
                }

                const pt = SVGUtils.polarToCartesian(svgCx, svgCy, adjustedRadius, angleDeg);
                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute('x', pt.x);
                text.setAttribute('y', pt.y);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.textContent = textStr;
                GaugeWidget.applyAxisTypographyToSvgText(text, c);

                if (c.rotateLabels) {
                    // Keep text tangentially aligned rotating around its calculated center
                    text.setAttribute('transform', `rotate(${angleDeg}, ${pt.x}, ${pt.y})`);
                }

                grp.appendChild(text);
            }
        });
    }

    // Renders axis labels and optional tick marks for the horizontal (linear) gauge style.
    _renderLinearAxis(c, trackWidth, gaugeMin, gaugeRange) {
        const container = this.els.hAxis;
        if (!c.showLabels && !c.showTickMarks) {
            if (container.firstChild) container.innerHTML = '';
            this._lastLinearAxisSig = '';
            return;
        }
        if (gaugeRange === 0) {
            if (container.firstChild) container.innerHTML = '';
            this._lastLinearAxisSig = '';
            return;
        }

        const linearSig = this._buildAxisConfigSignature(c, String(trackWidth), gaugeMin, gaugeRange);
        if (this._lastLinearAxisSig === linearSig && container.firstChild) {
            return;
        }
        this._lastLinearAxisSig = linearSig;
        container.innerHTML = '';

        const lo = Math.min(Number(c.min), Number(c.max));
        const hi = Math.max(Number(c.min), Number(c.max));

        const effectiveBaseline = c.baselineMode ? c.baselineValue : gaugeMin;
        const { ticks } = DashboardMathUtils.calculateTicks(
            gaugeMin, gaugeMin + gaugeRange, effectiveBaseline,
            Math.max(1, c.labelCount - 1), c.axisRoundingMode
        );

        // Smart/strict modes may extend ticks beyond the real gauge range; clip to physical bounds.
        const inBoundsTicks = ticks.filter(t => t.value >= lo - 1e-9 && t.value <= hi + 1e-9);

        const labelPadPx = Math.max(2, Math.ceil(c.gaugeAxisFs * 1.25));
        const innerW = Math.max(0, trackWidth - 2 * labelPadPx);
        const fracToAnchorPx = (value) => labelPadPx + ((value - gaugeMin) / gaugeRange) * innerW;

        // Collision: minimum pixel gap between label centres (uses same anchors as rendered ticks)
        const minSpacePx = c.gaugeAxisFs * 2;
        const placedPx = [];

        const filtered = [];
        for (const t of inBoundsTicks) {
            const px = fracToAnchorPx(t.value);
            if (t.isPriority && !placedPx.some(p => Math.abs(p - px) < minSpacePx)) {
                filtered.push({ ...t, px });
                placedPx.push(px);
            }
        }
        for (const t of inBoundsTicks) {
            const px = fracToAnchorPx(t.value);
            if (!t.isPriority && !placedPx.some(p => Math.abs(p - px) < minSpacePx)) {
                filtered.push({ ...t, px });
                placedPx.push(px);
            }
        }

        filtered.forEach(t => {
            const leftPx = `${t.px}px`;

            if (c.showTickMarks) {
                const mark = document.createElement('div');
                mark.style.cssText = `position:absolute;left:${leftPx};transform:translateX(-50%);width:${c.tickMarkThickness}px;height:${c.tickMarkLength}px;background:${BaseWidget.resolveCssColor(c.tickMarkColor)};bottom:calc(100% - ${c.tickMarkOffset}px);`;
                container.appendChild(mark);
            }

            if (c.showLabels) {
                const lbl = document.createElement('div');
                lbl.style.cssText = `position:absolute;left:${leftPx};transform:translateX(-50%);white-space:nowrap;top:calc(100% + ${c.labelOffset}px);`;
                lbl.textContent = this._formatAxisValue(
                    GaugeWidget.mapGaugeDisplayValue(t.value, c),
                    c.axisDecimals
                );
                this.applyTypographyToElement(lbl, 'gaugeAxis', c, {});
                container.appendChild(lbl);
            }
        });
    }

    /**
     * Round bar gradient lives in the same SVG as the arc. Stop colors are presentation
     * attributes: CSS stop-color on a stop inside a zero-size SVG stays at the SVG default
     * (black) until a later layer change, such as selecting the widget in the editor.
     * spec.mode is 'solid' | 'baseline' | 'standard'.
     */
    _applyRoundGradient(c, spec) {
        const e = this.els;
        if (!e || !e.roundProg || !spec) return;
        if (spec.mode === 'solid') {
            const solid = GaugeWidget._paintColor(spec.solidColor);
            if (e.roundProg.getAttribute('stroke') !== solid) {
                e.roundProg.setAttribute('stroke', solid);
            }
            this._roundGradSig = '';
            return;
        }

        let x1 = 0;
        let y1 = 0;
        let x2 = 200;
        let y2 = 0;
        let c0 = c.col0;
        let c50 = c.colMid;
        let c100 = c.col100;
        if (spec.mode === 'baseline') {
            const goingForward = !!spec.goingForward;
            const trackEndAngle = goingForward ? spec.endAngle : spec.startAngle;
            const gradStartPt = SVGUtils.polarToCartesian(100, 100, spec.svgR, spec.baselineAngleDeg);
            const gradEndPt = SVGUtils.polarToCartesian(100, 100, spec.svgR, trackEndAngle);
            x1 = gradStartPt.x;
            y1 = gradStartPt.y;
            x2 = gradEndPt.x;
            y2 = gradEndPt.y;
            const endCol = goingForward ? c.col100 : c.col0;
            const midP = GaugeWidget._paintColor(c.colMid);
            const endP = GaugeWidget._paintColor(endCol);
            c0 = midP;
            c50 = GaugeWidget._blendColors(midP, endP);
            c100 = endP;
        }

        const p0 = GaugeWidget._paintColor(c0);
        const p50 = GaugeWidget._paintColor(c50);
        const p100 = GaugeWidget._paintColor(c100);
        const x1s = String(x1);
        const y1s = String(y1);
        const x2s = String(x2);
        const y2s = String(y2);
        const sig = x1s + '|' + y1s + '|' + x2s + '|' + y2s + '|' + p0 + '|' + p50 + '|' + p100;
        const grad = e.roundGrad;
        if (grad) {
            if (grad.getAttribute('x1') !== x1s) grad.setAttribute('x1', x1s);
            if (grad.getAttribute('y1') !== y1s) grad.setAttribute('y1', y1s);
            if (grad.getAttribute('x2') !== x2s) grad.setAttribute('x2', x2s);
            if (grad.getAttribute('y2') !== y2s) grad.setAttribute('y2', y2s);
        }
        GaugeWidget._setStopColor(e.stopR0, p0);
        GaugeWidget._setStopColor(e.stopR50, p50);
        GaugeWidget._setStopColor(e.stopR100, p100);

        const paint = 'url(#g-rnd-' + this.id + ')';
        if (this._roundGradSig !== sig) {
            this._roundGradSig = sig;
            if (e.roundProg.getAttribute('stroke') === paint) {
                e.roundProg.removeAttribute('stroke');
            }
            e.roundProg.setAttribute('stroke', paint);
        } else if (e.roundProg.getAttribute('stroke') !== paint) {
            e.roundProg.setAttribute('stroke', paint);
        }
    }

    _applyLiveValueUpdate(c) {
        const e = this.els;
        if (!e) return;
        const gaugeMin = parseFloat(c.min);
        const gaugeMax = parseFloat(c.max);
        const gaugeValue = parseFloat(c.value) || 0;
        const denom = (gaugeMax - gaugeMin);
        const valuePct = denom === 0 ? 0 : Math.max(0, Math.min((gaugeValue - gaugeMin) / denom, 1));
        const baselineValueClamped = Math.max(Math.min(gaugeMin, gaugeMax), Math.min(Math.max(gaugeMin, gaugeMax), c.baselineValue));
        const baselinePct = denom === 0 ? 0 : Math.max(0, Math.min((baselineValueClamped - gaugeMin) / denom, 1));
        const solidAtValue = c.solidBarColor
            ? GaugeWidget._sampleGaugeGradientColor(c.col0, c.colMid, c.col100, valuePct)
            : null;
        const isRound = c.barType === 'round';
        const isHoriz = c.barType === 'horizontal';
        const hasTrack = c.trackThickness > 0;
        const hasBar = c.barThickness > 0;

        if (isRound) {
            const svgR = Math.max(10, 85 + c.gaugeSizeOffset);
            const startAngle = -130;
            const endAngle = 130;
            const totalAngle = endAngle - startAngle;

            if (!hasBar) {
                e.roundProg.style.display = 'none';
                e.roundDot.style.display = 'none';
            } else if (c.baselineMode) {
                const baselineAngleDeg = startAngle + baselinePct * totalAngle;
                const valueAngleDeg = startAngle + valuePct * totalAngle;
                const dotThresholdDeg = (c.barThickness / svgR) * (180 / Math.PI);
                const atBaseline = Math.abs(valuePct - baselinePct) * totalAngle < dotThresholdDeg;
                if (atBaseline) {
                    e.roundProg.style.display = 'none';
                    const dotPt = SVGUtils.polarToCartesian(100, 100, svgR, baselineAngleDeg);
                    e.roundDot.setAttribute('cx', dotPt.x);
                    e.roundDot.setAttribute('cy', dotPt.y);
                    e.roundDot.setAttribute('r', c.barThickness / 2);
                    e.roundDot.setAttribute('fill', GaugeWidget._paintColor(c.colMid));
                    e.roundDot.style.display = 'block';
                } else {
                    e.roundDot.style.display = 'none';
                    const arcStartDeg = valuePct >= baselinePct ? baselineAngleDeg : valueAngleDeg;
                    const arcEndDeg = valuePct >= baselinePct ? valueAngleDeg : baselineAngleDeg;
                    e.roundProg.setAttribute('d', SVGUtils.describeArc(100, 100, svgR, arcStartDeg, arcEndDeg));
                    e.roundProg.setAttribute('stroke-width', c.barThickness);
                    e.roundProg.style.display = 'block';
                    if (c.solidBarColor) {
                        this._applyRoundGradient(c, { mode: 'solid', solidColor: solidAtValue });
                    } else {
                        this._applyRoundGradient(c, {
                            mode: 'baseline',
                            goingForward: valuePct >= baselinePct,
                            baselineAngleDeg: baselineAngleDeg,
                            startAngle: startAngle,
                            endAngle: endAngle,
                            svgR: svgR
                        });
                    }
                }
            } else if (valuePct > 0.01) {
                const valEndAngle = startAngle + (valuePct * totalAngle);
                e.roundProg.setAttribute('d', SVGUtils.describeArc(100, 100, svgR, startAngle, valEndAngle));
                e.roundProg.setAttribute('stroke-width', c.barThickness);
                e.roundProg.style.display = 'block';
                if (c.solidBarColor) {
                    this._applyRoundGradient(c, { mode: 'solid', solidColor: solidAtValue });
                } else {
                    this._applyRoundGradient(c, { mode: 'standard' });
                }
                e.roundDot.style.display = 'none';
            } else {
                e.roundProg.style.display = 'none';
                e.roundDot.style.display = 'none';
            }
            this._syncRoundBarChrome(e, c);
        }

        if (isHoriz) {
            const outW = c.trackOutlineWidth || 0;
            let inset = 0;
            if (c.trackThickness > c.barThickness) inset = (c.trackThickness - c.barThickness) / 2;
            const totalInset = inset + outW;

            if (!hasBar) {
                e.hProg.style.display = 'none';
            } else {
                e.hProg.style.display = 'block';
            }

            if (!hasBar) {
                // nothing to update
            } else if (c.baselineMode) {
                const lowPct = Math.min(baselinePct, valuePct);
                const highPct = Math.max(baselinePct, valuePct);
                const widthPct = highPct - lowPct;
                const gaugeRange = Math.abs(gaugeMax - gaugeMin);
                const atBaseline = widthPct * gaugeRange < 0.001;
                const trackDrawW = `calc(100% - ${totalInset * 2}px)`;
                const goingForward = valuePct >= baselinePct;

                if (atBaseline) {
                    this._setStyleIfChanged(e.hProg, 'background', GaugeWidget._barFillCss(c, { atBaseline: true }));
                    this._setStyleIfChanged(e.hProg, 'left', `calc(${totalInset}px + ${trackDrawW} * ${baselinePct} - ${c.barThickness / 2}px)`);
                    this._setStyleIfChanged(e.hProg, 'width', `${c.barThickness}px`);
                } else if (c.solidBarColor) {
                    this._setStyleIfChanged(e.hProg, 'background', GaugeWidget._barFillCss(c, { solid: solidAtValue }));
                    this._setStyleIfChanged(e.hProg, 'left', `calc(${totalInset}px + ${trackDrawW} * ${lowPct})`);
                    this._setStyleIfChanged(e.hProg, 'width', `calc(${trackDrawW} * ${widthPct})`);
                } else {
                    this._setStyleIfChanged(e.hProg, 'background', GaugeWidget._barFillCss(c, {
                        baseline: true,
                        goingForward: goingForward,
                        baselinePct: baselinePct,
                        valuePct: valuePct
                    }));
                    this._setStyleIfChanged(e.hProg, 'left', `calc(${totalInset}px + ${trackDrawW} * ${lowPct})`);
                    this._setStyleIfChanged(e.hProg, 'width', `calc(${trackDrawW} * ${widthPct})`);
                }
            } else {
                this._setStyleIfChanged(e.hProg, 'background', c.solidBarColor
                    ? GaugeWidget._barFillCss(c, { solid: solidAtValue })
                    : GaugeWidget._barFillCss(c, {}));
                this._setStyleIfChanged(e.hProg, 'left', `${totalInset}px`);
                this._setStyleIfChanged(e.hProg, 'width', `calc((100% - ${totalInset * 2}px) * ${valuePct})`);
            }
        }

        const displayFormat = GaugeWidget.resolveGaugeDisplayFormat(c);
        const displayValue = GaugeWidget.mapGaugeDisplayValue(gaugeValue, c);
        const res = this._formatDisplayValue(
            displayValue,
            displayFormat.decimalPlaces,
            c.abbreviateLargeValues,
            c.unit,
            c.abbreviatedDecimalPlaces,
            displayFormat.keepTrailingZeros
        );
        this._setTextContentIfChanged(e.val, res.valText);
        this._setTextContentIfChanged(e.unit, res.unitText);
    }

    onIncomingData(topic, payload, count) {
        if (topic == null || topic === '') return false;
        const hitKeys = this._bindingKeysForTopic(topic);
        if (hitKeys.length === 0) return false;
        return true;
    }

    /**
     * Value-only data ticks update the arc/bar and value text via _applyLiveValueUpdate
     * without rebuilding the radial/linear axis. Any other hit (appearance binding, formula
     * on a non-value key) falls through to the full render.
     */
    onLiveTopicUpdate(topic, payload, count) {
        if (topic == null || topic === '') return false;
        const hitKeys = this._bindingKeysForTopic(topic);
        if (hitKeys.length !== 1 || hitKeys[0] !== 'value') return false;
        if (this.usesFormulaTopic(topic, { value: true })) return false;

        const c = this.config;
        if (typeof DashboardAudio !== 'undefined') {
            if (!this._audioValueStore) this._audioValueStore = {};
            DashboardAudio.observeChange(this._audioValueStore, c.value, function () {
                DashboardAudio.playFrom(c.audio, 'valueChange');
            });
        }
        this._applyLiveValueUpdate(c);
        return true;
    }

    _renderSpecific() {
        const c = this.config;
        const e = this.els;
        const { vis, cnt } = e;

        if (typeof DashboardAudio !== 'undefined') {
            if (!this._audioValueStore) this._audioValueStore = {};
            DashboardAudio.observeChange(this._audioValueStore, c.value, function () {
                DashboardAudio.playFrom(c.audio, 'valueChange');
            });
        }

        // Layout Logic
        this.elements.innerContent.style.flexDirection = 'column';
        cnt.style.margin = '0';
        if (c.layout === 'left') {
            this.elements.innerContent.style.flexDirection = 'row-reverse';
            cnt.style.marginRight = `${c.gap}px`;
            cnt.style.alignItems = 'flex-start';
            vis.style.flex = '0 0 auto'; cnt.style.flex = '1';
        } else if (c.layout === 'right') {
            this.elements.innerContent.style.flexDirection = 'row';
            cnt.style.marginLeft = `${c.gap}px`;
            cnt.style.alignItems = 'flex-start';
            vis.style.flex = '0 0 auto'; cnt.style.flex = '1';
        } else if (c.layout === 'top') {
            this.elements.innerContent.style.flexDirection = 'column-reverse';
            cnt.style.marginBottom = `${c.gap}px`;
            cnt.style.alignItems = 'center';
            vis.style.flex = '1'; cnt.style.flex = '0 0 auto'; cnt.style.width = '100%';
        } else {
            this.elements.innerContent.style.flexDirection = 'column';
            cnt.style.marginTop = `${c.gap}px`;
            cnt.style.alignItems = 'center';
            vis.style.flex = '1'; cnt.style.flex = '0 0 auto'; cnt.style.width = '100%';
        }

        const isRound = c.barType === 'round';
        const isHoriz = c.barType === 'horizontal';
        e.roundSvg.style.display = isRound ? 'block' : 'none';
        const hasTrack = c.trackThickness > 0;
        const hasBar = c.barThickness > 0;

        // Shared gauge math — values are already normalized in config.
        const gaugeMin = c.min;
        const gaugeMax = c.max;
        const gaugeValue = c.value;
        const gaugeRange = Math.abs(gaugeMax - gaugeMin);
        const safeRange = gaugeRange === 0 ? 1 : gaugeRange;
        const signedRange = gaugeMax - gaugeMin;
        const safeSignedRange = signedRange === 0 ? 1 : signedRange;

        // Normalised 0-1 position of value and baseline within the track
        const valuePct = Math.max(0, Math.min((gaugeValue - gaugeMin) / safeSignedRange, 1));
        const baselineValueClamped = Math.max(Math.min(gaugeMin, gaugeMax), Math.min(Math.max(gaugeMin, gaugeMax), c.baselineValue));
        const baselinePct = Math.max(0, Math.min((baselineValueClamped - gaugeMin) / safeSignedRange, 1));
        const solidAtValue = c.solidBarColor
            ? GaugeWidget._sampleGaugeGradientColor(c.col0, c.colMid, c.col100, valuePct)
            : null;

        if (isRound) {
            vis.style.width = '100%';
            e.roundSvg.setAttribute('viewBox', "0 0 200 200");
            const svgR = Math.max(10, 85 + c.gaugeSizeOffset);
            const startAngle = -130;
            const endAngle = 130;
            const totalAngle = endAngle - startAngle;

            // Main Track
            const arcPath = SVGUtils.describeArc(100, 100, svgR, startAngle, endAngle);
            e.roundTrack.setAttribute('d', arcPath);
            e.roundTrack.style.display = hasTrack ? 'block' : 'none';
            if (hasTrack) {
                e.roundTrack.setAttribute('stroke-width', c.trackThickness);
                this._paintRoundStroke(e.roundTrack, c.colTrack, c.trackOpacity);
            }

            // Track Outline. Masked to the rim so it does not fill a translucent track.
            const trackOutW = hasTrack ? (Number(c.trackOutlineWidth) || 0) : 0;
            if (trackOutW > 0) {
                e.roundOutline.style.display = 'block';
                e.roundOutline.setAttribute('d', arcPath);
                e.roundOutline.setAttribute('stroke-width', c.trackThickness + (trackOutW * 2));
                this._paintRoundStroke(e.roundOutline, c.trackOutlineColor, c.trackOutlineOpacity);
                this._applyRimMask(e, e.roundOutline, 'roundTrackRim', 'trk-rim-' + this.id, arcPath, c.trackThickness, c.trackThickness + (trackOutW * 2) + 24);
            } else if (e.roundOutline) {
                e.roundOutline.style.display = 'none';
                this._clearRimMask(e.roundOutline);
            }

            // Track Inner Glow: CSS inset equivalent on the SVG stroke (inner
            // edges of the ribbon, including round caps). Size 0 skips the
            // extra path so the default paint is unchanged.
            const igSize = Number(c.trackInnerGlow) || 0;
            if (hasTrack && igSize > 0 && e.roundTrackIg) {
                e.roundTrackIg.style.display = 'block';
                e.roundTrackIg.setAttribute('d', arcPath);
                e.roundTrackIg.setAttribute('stroke-width', c.trackThickness);
                e.roundTrackIg.setAttribute('stroke', '#ffffff');
                e.roundTrackIg.setAttribute('stroke-opacity', '1');
                e.roundTrackIg.style.filter = 'url(#ig-' + this.id + ')';
                this._tuneRoundInnerGlowFilter(e.roundIgFilter, e.roundIgBlur, e.roundIgFlood, igSize, c.trackInnerGlowColor, c.trackInnerGlowOpacity);
            } else if (e.roundTrackIg) {
                e.roundTrackIg.style.display = 'none';
            }

            if (!hasBar) {
                e.roundProg.style.display = 'none';
                e.roundDot.style.display = 'none';
            } else if (c.baselineMode) {
                const baselineAngleDeg = startAngle + baselinePct * totalAngle;
                const valueAngleDeg = startAngle + valuePct * totalAngle;
                // Keep showing the circle while the arc chord < bar diameter (physics-based threshold)
                const dotThresholdDeg = (c.barThickness / svgR) * (180 / Math.PI);
                const atBaseline = Math.abs(valuePct - baselinePct) * totalAngle < dotThresholdDeg;

                if (atBaseline) {
                    e.roundProg.style.display = 'none';
                    const dotPt = SVGUtils.polarToCartesian(100, 100, svgR, baselineAngleDeg);
                    e.roundDot.setAttribute('cx', dotPt.x);
                    e.roundDot.setAttribute('cy', dotPt.y);
                    e.roundDot.setAttribute('r', c.barThickness / 2);
                    e.roundDot.setAttribute('fill', GaugeWidget._paintColor(c.colMid));
                    e.roundDot.style.display = 'block';
                    e.roundDot.style.filter = (c.barGlow && c.glowEnabled) ? `url(#glow-${this.id})` : 'none';
                } else {
                    e.roundDot.style.display = 'none';

                    let arcStartDeg, arcEndDeg;
                    const goingForward = valuePct >= baselinePct;
                    if (goingForward) {
                        arcStartDeg = baselineAngleDeg;
                        arcEndDeg = valueAngleDeg;
                    } else {
                        arcStartDeg = valueAngleDeg;
                        arcEndDeg = baselineAngleDeg;
                    }

                    e.roundProg.setAttribute('d', SVGUtils.describeArc(100, 100, svgR, arcStartDeg, arcEndDeg));
                    e.roundProg.setAttribute('stroke-width', c.barThickness);
                    e.roundProg.style.display = 'block';
                    e.roundProg.style.filter = (c.barGlow && c.glowEnabled) ? `url(#glow-${this.id})` : 'none';

                    if (c.solidBarColor) {
                        this._applyRoundGradient(c, { mode: 'solid', solidColor: solidAtValue });
                    } else {
                        this._applyRoundGradient(c, {
                            mode: 'baseline',
                            goingForward: goingForward,
                            baselineAngleDeg: baselineAngleDeg,
                            startAngle: startAngle,
                            endAngle: endAngle,
                            svgR: svgR
                        });
                    }
                }
            } else {
                e.roundDot.style.display = 'none';
                if (hasBar && valuePct > 0.01) {
                    const valEndAngle = startAngle + (valuePct * totalAngle);
                    e.roundProg.setAttribute('d', SVGUtils.describeArc(100, 100, svgR, startAngle, valEndAngle));
                    e.roundProg.setAttribute('stroke-width', c.barThickness);
                    e.roundProg.style.display = 'block';
                } else {
                    e.roundProg.style.display = 'none';
                }
                if (c.solidBarColor) {
                    this._applyRoundGradient(c, { mode: 'solid', solidColor: solidAtValue });
                } else {
                    this._applyRoundGradient(c, { mode: 'standard' });
                }
                e.roundProg.style.filter = (c.barGlow && c.glowEnabled) ? `url(#glow-${this.id})` : 'none';
            }

            this._syncRoundBarChrome(e, c);
            this._syncRoundTrackFrost(e, hasTrack && !c.deactivated, c, svgR);

            // Radial axis
            this._renderRadialAxis(c, 100, 100, svgR, startAngle, totalAngle, gaugeMin, safeRange);
        } else {
            vis.style.width = 'auto';
            if (c.layout === 'top' || c.layout === 'bottom') vis.style.flex = '0 0 auto';
            // Clear radial axis when not in round mode
            e.axisLblGrp.innerHTML = '';
            this._hideRoundTrackFrost(e);
        }

        e.horizBar.style.display = isHoriz ? 'block' : 'none';
        if (isHoriz) {
            // Shrink the bar width to create room for labels/ticks that extend outside its bounds.
            // Setting width < 100% rather than using margins, since margins on a width:100% flex child
            // push it outside the parent instead of shrinking it. align-items:center on .cnt centres it.
            const sizeMargin = c.gaugeSizeOffset < 0 ? -c.gaugeSizeOffset : 0;
            e.horizBar.style.width = sizeMargin > 0 ? `calc(100% - ${sizeMargin * 2}px)` : '100%';

            const outW = c.trackOutlineWidth || 0;
            const barOutW = hasBar ? (c.barOutlineWidth || 0) : 0;
            const h = Math.max(c.barThickness + (barOutW * 2), c.trackThickness + (outW * 2));
            e.horizBar.style.height = `${h}px`;

            let inset = 0;
            if (c.trackThickness > c.barThickness) inset = (c.trackThickness - c.barThickness) / 2;

            e.hTrack.style.boxSizing = 'border-box';
            e.hTrack.style.width = '100%';
            e.hTrack.style.display = hasTrack ? 'block' : 'none';
            e.hTrack.style.height = `${c.trackThickness + (outW * 2)}px`;
            e.hTrack.style.top = '50%';
            e.hTrack.style.transform = 'translateY(-50%)';
            e.hTrack.style.backgroundColor = BaseWidget.colorAtOpacity(c.colTrack, c.trackOpacity);
            if (!hasTrack) {
                e.hTrack.style.border = 'none';
            } else if (outW > 0) {
                e.hTrack.style.border = `${outW}px solid ${BaseWidget.colorAtOpacity(c.trackOutlineColor, c.trackOutlineOpacity)}`;
                e.hTrack.style.marginTop = '0';
                e.hTrack.style.marginLeft = '0';
            } else {
                e.hTrack.style.border = 'none';
            }
            e.hTrack.style.boxShadow = BaseWidget.elementInnerGlowShadow(c.trackInnerGlow, c.trackInnerGlowColor, c.trackInnerGlowOpacity);
            // Frost only behind a translucent track; at full opacity blur is invisible so it stays off.
            this._syncBackdropBlur(e.hTrack, (Number(c.trackOpacity) < 100 ? c.trackBlur : 0));

            const totalInset = inset + outW;
            e.hProg.style.display = hasBar ? 'block' : 'none';
            e.hProg.style.height = `${c.barThickness}px`;
            e.hProg.style.top = '50%';
            e.hProg.style.transform = 'translateY(-50%)';
            this._syncHorizBarChrome(e, c, hasBar);
            // Ensure the bar never collapses below a circle in baseline mode
            e.hProg.style.minWidth = (c.baselineMode && hasBar) ? `${c.barThickness}px` : '0';

            if (!hasBar) {
                // nothing to draw
            } else if (c.baselineMode) {
                const lowPct = Math.min(baselinePct, valuePct);
                const highPct = Math.max(baselinePct, valuePct);
                const widthPct = highPct - lowPct;
                const atBaseline = widthPct * gaugeRange < 0.001;
                const trackDrawW = `calc(100% - ${totalInset * 2}px)`;
                const goingForward = valuePct >= baselinePct;

                if (atBaseline) {
                    e.hProg.style.background = GaugeWidget._barFillCss(c, { atBaseline: true });
                    e.hProg.style.left = `calc(${totalInset}px + ${trackDrawW} * ${baselinePct} - ${c.barThickness / 2}px)`;
                    e.hProg.style.width = `${c.barThickness}px`;
                } else if (c.solidBarColor) {
                    e.hProg.style.background = GaugeWidget._barFillCss(c, { solid: solidAtValue });
                    e.hProg.style.left = `calc(${totalInset}px + ${trackDrawW} * ${lowPct})`;
                    e.hProg.style.width = `calc(${trackDrawW} * ${widthPct})`;
                } else {
                    e.hProg.style.background = GaugeWidget._barFillCss(c, {
                        baseline: true,
                        goingForward: goingForward,
                        baselinePct: baselinePct,
                        valuePct: valuePct
                    });
                    e.hProg.style.left = `calc(${totalInset}px + ${trackDrawW} * ${lowPct})`;
                    e.hProg.style.width = `calc(${trackDrawW} * ${widthPct})`;
                }
            } else {
                e.hProg.style.background = c.solidBarColor
                    ? GaugeWidget._barFillCss(c, { solid: solidAtValue })
                    : GaugeWidget._barFillCss(c, {});
                e.hProg.style.left = `${totalInset}px`;
                e.hProg.style.width = `calc((100% - ${totalInset * 2}px) * ${valuePct})`;
            }

            e.hAxis.style.left = `${totalInset}px`;
            e.hAxis.style.width = `calc(100% - ${totalInset * 2}px)`;

            // Linear axis — deferred so we can read the actual post-margin track pixel width
            if (this._linearAxisRaf != null && typeof cancelAnimationFrame === 'function') {
                cancelAnimationFrame(this._linearAxisRaf);
            }
            this._linearAxisRaf = requestAnimationFrame(() => {
                this._linearAxisRaf = null;
                if (!this.elements || !this.elements.wrapper || !e.horizBar) return;
                const trackW = e.horizBar.offsetWidth - totalInset * 2;
                this._renderLinearAxis(c, trackW, gaugeMin, safeRange);
            });
        }

        if (!c.showIcon) {
            e.iconWrap.textContent = '';
            e.iconWrap.style.display = 'none';
            e.iconWrap.style.width = '';
            e.iconWrap.style.height = '';
            e.iconWrap.style.fontSize = '';
            e.iconWrap.style.transform = '';
            e.iconWrap.style.filter = '';
        } else {
            e.iconWrap.style.display = 'flex';
            const iconKm = GaugeWidget.ICON_KEYMAP_ON;
            const iconCol = c.iconSlotColOn || c.gaugeColIcon || BaseWidget.themeTokenRef('icon');
            const iSize = c.iconSize;
            BaseWidget.applyIconStyleToElement(e.iconWrap, c, iconKm, { color: iconCol });
            e.iconWrap.style.fontSize = `${iSize}px`;
            e.iconWrap.style.width = `${iSize}px`;
            e.iconWrap.style.height = `${iSize}px`;
            const iconGlow = BaseWidget.resolveCssColor(iconCol);
            if (e.iconWrap.firstChild) {
                e.iconWrap.style.filter = `drop-shadow(0 0 8px ${iconGlow}60)`;
            } else {
                e.iconWrap.style.filter = '';
            }
        }

        e.lbl.textContent = c.label;
        e.lbl.style.display = c.label ? 'block' : 'none';
        e.lbl.style.width = '100%';
        this.applyTypographyToElement(e.lbl, 'gaugeCaption', c, {});

        const valOffX = c.gaugeValueOffX != null ? c.gaugeValueOffX : 0;
        const valOffY = c.gaugeValueOffY != null ? c.gaugeValueOffY : 0;
        e.grp.style.transform = `translate(${valOffX}px, ${valOffY}px)`;
        if (c.valueAlignment === 'left') {
            e.grp.style.alignSelf = 'flex-start';
        } else if (c.valueAlignment === 'right') {
            e.grp.style.alignSelf = 'flex-end';
        } else {
            e.grp.style.alignSelf = 'center';
        }

        this.applyTypographyToElement(e.val, 'gaugeValue', c, {});
        e.val.style.transform = 'none';
        const valCol = BaseWidget.resolveCssColor(c.gaugeValueCol || '@text');
        e.val.style.textShadow = `0 0 10px ${valCol}40`;

        this.applyTypographyToElement(e.unit, 'gaugeUnit', c, {});
        e.unit.style.transform = 'none';
        e.unit.style.marginLeft = '2px';

        // Scaling logic for central display
        const displayFormat = GaugeWidget.resolveGaugeDisplayFormat(c);
        const displayValue = GaugeWidget.mapGaugeDisplayValue(gaugeValue, c);
        const res = this._formatDisplayValue(
            displayValue,
            displayFormat.decimalPlaces,
            c.abbreviateLargeValues,
            c.unit,
            c.abbreviatedDecimalPlaces,
            displayFormat.keepTrailingZeros
        );
        e.val.textContent = res.valText;
        e.unit.textContent = res.unitText;

        if (c.deactivated) {
            const deactColor = BaseWidget.getDeactivatedColor(c);
            const accentColor = BaseWidget.getDeactivatedColorAccent(c);
            if (isRound) {
                this._paintRoundStroke(e.roundTrack, deactColor, 100);
                this._hideRoundTrackFrost(e);
                e.roundProg.style.display = 'block';
                e.roundProg.setAttribute('stroke', accentColor);
                e.roundProg.style.filter = 'none';
                if (e.roundDot) e.roundDot.style.filter = 'none';
                if (e.roundTrackIg) e.roundTrackIg.style.display = 'none';
                this._hideRoundBarChrome(e);
                if (e.axisLblGrp) {
                    e.axisLblGrp.style.display = 'block';
                    e.axisLblGrp.querySelectorAll('text').forEach(t => t.setAttribute('fill', accentColor));
                }
            } else if (isHoriz) {
                e.hTrack.style.backgroundColor = deactColor;
                e.hTrack.style.display = 'block';
                e.hTrack.style.border = 'none';
                e.hTrack.style.boxShadow = 'none';
                this._syncBackdropBlur(e.hTrack, 0);
                e.hProg.style.display = 'block';
                e.hProg.style.backgroundImage = 'none';
                e.hProg.style.background = accentColor;
                e.hProg.style.backgroundColor = accentColor;
                e.hProg.style.boxShadow = 'none';
                e.hProg.style.border = 'none';
                e.hProg.style.filter = 'none';
                if (e.hLabels) {
                    e.hLabels.style.display = 'flex';
                    e.hLabels.style.color = accentColor;
                }
                if (e.hTicks) {
                    e.hTicks.style.display = 'block';
                    e.hTicks.querySelectorAll('.ds-gauge-tick').forEach(tk => tk.style.backgroundColor = accentColor);
                }
            }
            if (c.label) {
                e.lbl.style.display = 'block';
                e.lbl.style.color = accentColor;
            } else {
                e.lbl.style.display = 'none';
            }
            if (c.showIcon) {
                e.iconWrap.style.display = 'flex';
                const iconNode = e.iconWrap.querySelector('.ds-icon-glyph, i, svg, [data-phosphor-icon]');
                if (iconNode) iconNode.style.color = accentColor;
                e.iconWrap.style.setProperty('--icon-secondary-color', accentColor);
                e.iconWrap.style.filter = 'none';
            } else {
                e.iconWrap.style.display = 'none';
            }
            e.val.style.display = 'block';
            e.val.style.color = accentColor;
            e.val.style.textShadow = 'none';
            e.unit.style.display = 'block';
            e.unit.style.color = accentColor;
            e.unit.style.textShadow = 'none';
        }
    }

    onRemove() {
        if (this._linearAxisRaf != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._linearAxisRaf);
            this._linearAxisRaf = null;
        }
        this._stopRoundTrackFrostFollow();
        super.onRemove();
    }
}

WidgetRegistry.register('gauge', GaugeWidget);
