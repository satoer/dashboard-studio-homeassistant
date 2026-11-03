class LabelWidget extends BaseWidget {
    static get metadata() {
        return {
            label: 'Label',
            shortName: 'Label',
            icon: 'ph-text-t',
            category: 'Text',
            color_dark: 'hsl(300, 80%, 65%)',
            color_light: 'hsl(300, 85%, 35%)',
            helpSlug: 'label',
            version: '2.3.1',
            date: '2026-11-02'
        };
    }

    static get COMMON_SCHEMA() {
        const schema = JSON.parse(JSON.stringify(BaseWidget.COMMON_SCHEMA));
        const withoutStyle = schema.filter(function (group) {
            return group && group.id !== 'style_group';
        });
        const layoutGroup = withoutStyle.find(function (group) {
            return group && group.id === 'layout_group';
        });
        if (layoutGroup && Array.isArray(layoutGroup.fields)) {
            layoutGroup.fields.push(
                { key: 'labelWAuto', type: 'checkbox', label: 'Auto Width (Fit to Content)', cols: 6, defaultKey: 'labelDefaultWAuto' },
                { key: 'labelHAuto', type: 'checkbox', label: 'Auto Height (Fit to Content)', cols: 6, defaultKey: 'labelDefaultHAuto' }
            );
        }
        return withoutStyle;
    }

    static get globalSettings() {
        return {
            labelDefaultWAuto: true,
            labelDefaultHAuto: true,
            labelDefaultFont: '',
            labelDefaultFs: 12,
            labelDefaultAlign: 'left',
            labelDefaultCase: 'none',
            labelDefaultBold: false,
            labelDefaultItalic: false,
            labelDefaultCol: '@onSurface',
            labelDefaultOpacity: 100,
            labelDefaultOffX: 0,
            labelDefaultOffY: 0
        };
    }

    static get basicSettingKeys() {
        return [
            'text',
            { key: 'labelFs', cols: 12 }
        ];
    }

    static get globalSchema() {
        return [
            { type: 'heading', label: 'Layout & Dimensions', cols: 12 },
            { key: 'labelDefaultWAuto', type: 'checkbox', label: 'Auto Width (Fit to Content)', cols: 6 },
            { key: 'labelDefaultHAuto', type: 'checkbox', label: 'Auto Height (Fit to Content)', cols: 6 },
            { type: 'heading', label: 'Typography', cols: 12 },
            BaseWidget.getTypographySchema('labelDefault', 'Label', {
                fontDefaultKey: 'fontFamily',
                fontSizeDefaultKey: 'defaultFsLabel',
                alignDefaultKey: 'defaultTextAlign',
                caseDefaultKey: null,
                boldDefaultKey: 'defaultLabelBold',
                italicDefaultKey: 'defaultLabelItalic',
                colorDefaultKey: null,
                opacityDefaultKey: null,
                offXDefaultKey: null,
                offYDefaultKey: null
            })
        ];
    }

    static applyTypographyNestedToConfig(config) {
        BaseWidget.applyTypographyNestedToConfig(config, [['label', 'label']]);
    }

    static get LABEL_TYPO_ROLE_PREFIX_TUPLES() {
        return [['label', 'label']];
    }

    static getNestedBindingOverlaySpec() {
        return BaseWidget.buildTypographyBindingOverlaySpec(LabelWidget.LABEL_TYPO_ROLE_PREFIX_TUPLES);
    }

    getDefaultOverrides() {
        return {
            text: 'Label Text',
            bgVisible: false,
            padding: 12,
            labelWAuto: true,
            labelHAuto: true,
            textVerticalAlign: 'middle',
            textRotation: 0,
            typography: {
                label: {}
            }
        };
    }

    get config() {
        const config = super.config;
        const master = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};

        LabelWidget.applyTypographyNestedToConfig(config);

        config.text = config.text !== undefined && config.text !== null ? String(config.text) : '';

        const hasWAuto = Object.prototype.hasOwnProperty.call(this.overrides, 'labelWAuto');
        const hasHAuto = Object.prototype.hasOwnProperty.call(this.overrides, 'labelHAuto');
        config.labelWAuto = hasWAuto ? this.overrides.labelWAuto === true : master.labelDefaultWAuto !== false;
        config.labelHAuto = hasHAuto ? this.overrides.labelHAuto === true : master.labelDefaultHAuto !== false;

        if (!config.labelFont) config.labelFont = master.labelDefaultFont || master.fontFamily || "'Inter', sans-serif";
        if (config.labelFs === undefined || config.labelFs === null || config.labelFs === '') {
            config.labelFs = master.labelDefaultFs != null ? master.labelDefaultFs : (master.defaultFsLabel != null ? master.defaultFsLabel : 12);
        }
        if (!config.labelCol) config.labelCol = master.labelDefaultCol || '@onSurface';
        if (!config.labelAlign) config.labelAlign = master.labelDefaultAlign || master.defaultTextAlign || 'left';
        const vAlignRaw = String(config.textVerticalAlign !== undefined && config.textVerticalAlign !== null && config.textVerticalAlign !== '' ? config.textVerticalAlign : 'middle').toLowerCase();
        config.textVerticalAlign = (vAlignRaw === 'top' || vAlignRaw === 'middle' || vAlignRaw === 'bottom') ? vAlignRaw : 'middle';
        const rotNum = Number(config.textRotation);
        config.textRotation = Number.isFinite(rotNum) ? rotNum : 0;

        if (!BaseWidget.hasTypographySetting(this.overrides, this.bindings, 'label', 'textTransform', 'labelCase')) {
            config.labelCase = master.labelDefaultCase || 'none';
        }
        if (!BaseWidget.hasTypographySetting(this.overrides, this.bindings, 'label', 'bold', 'labelBold')) {
            config.labelBold = master.labelDefaultBold === true;
        }
        if (!BaseWidget.hasTypographySetting(this.overrides, this.bindings, 'label', 'italic', 'labelItalic')
                && (config.labelItalic === undefined || config.labelItalic === null)) {
            config.labelItalic = master.labelDefaultItalic === true;
        }
        if (config.labelOpacity === undefined || config.labelOpacity === null || config.labelOpacity === '') {
            config.labelOpacity = master.labelDefaultOpacity != null ? master.labelDefaultOpacity : 100;
        }
        if (config.labelOffX === undefined || config.labelOffX === null) config.labelOffX = master.labelDefaultOffX != null ? master.labelDefaultOffX : 0;
        if (config.labelOffY === undefined || config.labelOffY === null) config.labelOffY = master.labelDefaultOffY != null ? master.labelDefaultOffY : 0;

        BaseWidget.applyTypographyBindingOverlay(this, config, LabelWidget.LABEL_TYPO_ROLE_PREFIX_TUPLES);

        return config;
    }

    getSchema() {
        return [
            {
                id: 'label_text_settings',
                title: 'Text Settings',
                icon: 'ph-text-t',
                fields: [
                    { key: 'text', type: 'textarea', label: 'Text', cols: 12 },
                    {
                        key: 'textVerticalAlign',
                        type: 'select',
                        label: 'Vertical Alignment',
                        options: [
                            { value: 'top', text: 'Top' },
                            { value: 'middle', text: 'Middle' },
                            { value: 'bottom', text: 'Bottom' }
                        ],
                        cols: 6,
                        defaultKey: 'defaultTextVerticalAlign'
                    },
                    { key: 'textRotation', type: 'number', label: 'Rotation', min: -360, max: 360, cols: 6, default: 0 }
                ]
            },
            {
                id: 'lbl_appear',
                title: 'Appearance',
                icon: 'ph-palette',
                fields: [
                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }
                ]
            },
            {
                id: 'label_typography_settings',
                title: 'Text & Typography',
                icon: 'ph-text-aa',
                fields: [
                    BaseWidget.getTypographySchema('label', 'Label', {
                        nestedTypography: { root: 'typography', role: 'label' },
                        fontDefaultKey: 'labelDefaultFont',
                        fontDefaultKeyFallback: 'fontFamily',
                        fontSizeDefaultKey: 'labelDefaultFs',
                        alignDefaultKey: 'labelDefaultAlign',
                        boldDefaultKey: 'labelDefaultBold',
                        italicDefaultKey: 'labelDefaultItalic',
                        opacityDefaultKey: 'labelDefaultOpacity',
                        offXDefaultKey: 'labelDefaultOffX',
                        offYDefaultKey: 'labelDefaultOffY',
                        colorDefaultKey: 'labelDefaultCol',
                        caseDefaultKey: 'labelDefaultCase'
                    })
                ]
            }
        ];
    }

    _buildBaseDOM() {
        const base = super._buildBaseDOM();

        base.innerContent.style.display = 'flex';
        base.innerContent.style.flexDirection = 'column';
        base.innerContent.style.justifyContent = 'flex-start';
        base.innerContent.style.alignItems = 'stretch';
        base.innerContent.style.padding = '0';
        base.innerContent.style.overflow = 'hidden';
        base.innerContent.style.minHeight = '0';

        const text = document.createElement('div');
        text.className = 'label-widget-text';
        text.style.display = 'flex';
        text.style.flexDirection = 'column';
        text.style.justifyContent = 'center';
        text.style.alignItems = 'stretch';
        text.style.boxSizing = 'border-box';
        text.style.width = 'fit-content';
        text.style.minWidth = 'max-content';
        text.style.minHeight = '0';

        const textInner = document.createElement('div');
        textInner.className = 'label-widget-text-inner';
        textInner.style.boxSizing = 'border-box';
        textInner.style.width = 'max-content';
        textInner.style.minWidth = 'max-content';
        textInner.style.minHeight = '0';
        textInner.style.whiteSpace = 'pre';

        text.appendChild(textInner);
        base.innerContent.appendChild(text);
        this.txtEl = text;
        this.txtInnerEl = textInner;

        return base;
    }

    getAutoSizeFlags() {
        const config = this.config || {};
        return { wAuto: config.labelWAuto === true, hAuto: config.labelHAuto === true };
    }

    /** Text metrics in design pixels (ignores wrapper stretch and CSS scale). */
    measureFittedContentSize() {
        if (!BaseWidget.allowFixedLayoutAutoSize(this)) return null;
        const textEl = this.txtInnerEl;
        const container = this.elements && this.elements.container;
        if (!textEl || !container) return super.measureFittedContentSize();
        const textW = Math.max(textEl.offsetWidth || 0, textEl.scrollWidth || 0);
        const textH = Math.max(textEl.offsetHeight || 0, textEl.scrollHeight || 0);
        if (textW < 1 && textH < 1) return super.measureFittedContentSize();
        const cs = window.getComputedStyle(container);
        const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
        const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
        const borderX = (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
        const borderY = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
        return {
            width: Math.max(1, Math.round(textW + padX + borderX)),
            height: Math.max(1, Math.round(textH + padY + borderY))
        };
    }

    render() {
        super.render();
        if (!this.elements || !this.elements.container || !this.config) return;
        const config = this.config;
        const usesRespGrid = BaseWidget.usesResponsiveGridLayout(this);
        // Fit-to-content sizing applies in Fixed Resolution, open-group authoring,
        // and Responsive Rescale mode.
        if (config.labelWAuto && BaseWidget.allowFixedLayoutAutoSize(this)) {
            this.elements.container.style.width = 'fit-content';
            this.elements.wrapper.style.width = 'fit-content';
            this.elements.wrapper.style.minWidth = 'fit-content';
        } else if (!usesRespGrid) {
            this.elements.wrapper.style.width = '';
            this.elements.wrapper.style.minWidth = '';
        }
        if (config.labelHAuto && BaseWidget.allowFixedLayoutAutoSize(this)) {
            this.elements.container.style.height = 'fit-content';
            this.elements.wrapper.style.height = 'fit-content';
            this.elements.wrapper.style.minHeight = 'fit-content';
        } else if (!usesRespGrid) {
            this.elements.wrapper.style.height = '';
            this.elements.wrapper.style.minHeight = '';
        }
        this.elements.container.style.borderRadius = '5px';
        this.scheduleFittedAutoSizeCommit();
    }

    updatePositionSize() {
        super.updatePositionSize();
        if (!this.elements || !this.elements.container || !this.config) return;
        const config = this.config;
        const usesRespGrid = BaseWidget.usesResponsiveGridLayout(this);
        if (config.labelWAuto && BaseWidget.allowFixedLayoutAutoSize(this)) {
            this.elements.container.style.width = 'fit-content';
            this.elements.wrapper.style.width = 'fit-content';
            this.elements.wrapper.style.minWidth = 'fit-content';
        } else if (!usesRespGrid) {
            this.elements.wrapper.style.width = '';
            this.elements.wrapper.style.minWidth = '';
        }
        if (config.labelHAuto && BaseWidget.allowFixedLayoutAutoSize(this)) {
            this.elements.container.style.height = 'fit-content';
            this.elements.wrapper.style.height = 'fit-content';
            this.elements.wrapper.style.minHeight = 'fit-content';
        } else if (!usesRespGrid) {
            this.elements.wrapper.style.height = '';
            this.elements.wrapper.style.minHeight = '';
        }
        this.elements.container.style.borderRadius = '5px';
        this.scheduleFittedAutoSizeCommit();
    }

    _applyOverflowBehavior(config) {
        const wrapEl = this.txtEl;
        const textEl = this.txtInnerEl;
        if (!wrapEl || !textEl) return;

        // Auto size must include hidden container padding for label readability.
        let containerPadding = BaseWidget.clampNumber(config.padding, 0, null);
        if (BaseWidget.isResponsiveMode()) {
            const resp = BaseWidget.getResponsiveLayout(this.overrides);
            if (resp && resp.padding !== undefined && resp.padding !== null && Number.isFinite(Number(resp.padding))) {
                containerPadding = BaseWidget.clampNumber(Number(resp.padding), 0, null);
            }
        }
        const wAuto = config.labelWAuto === true;
        const hAuto = config.labelHAuto === true;
        const allowAutoSize = BaseWidget.allowFixedLayoutAutoSize(this);
        const usesRespGrid = BaseWidget.usesResponsiveGridLayout(this);
        const applyWAuto = wAuto && allowAutoSize;
        const applyHAuto = hAuto && allowAutoSize;
        if (applyWAuto) {
            this.elements.container.style.width = 'fit-content';
            this.elements.wrapper.style.width = 'fit-content';
            this.elements.wrapper.style.minWidth = 'fit-content';
        } else {
            if (!usesRespGrid) {
                this.elements.wrapper.style.width = '';
                this.elements.wrapper.style.minWidth = '';
            }
            if (this.elements.container) {
                if (BaseWidget.isResponsiveMode()) {
                    this.elements.container.style.width = '';
                } else {
                    const widthPx = BaseWidget.clampNumber(config.width, 1, null);
                    this.elements.container.style.width = widthPx + 'px';
                }
            }
        }
        if (applyHAuto) {
            this.elements.container.style.height = 'fit-content';
            this.elements.wrapper.style.height = 'fit-content';
            this.elements.wrapper.style.minHeight = 'fit-content';
        } else {
            if (!usesRespGrid) {
                this.elements.wrapper.style.height = '';
                this.elements.wrapper.style.minHeight = '';
            }
            if (this.elements.container) {
                if (BaseWidget.isResponsiveMode()) {
                    this.elements.container.style.height = '';
                } else {
                    const heightPx = BaseWidget.clampNumber(config.height, 1, null);
                    this.elements.container.style.height = heightPx + 'px';
                }
            }
        }

        // Per-axis padding clamp: on a fixed-size axis, never let padding hide the
        // text under itself. Auto axes grow to fit, so the saved padding stays.
        const MIN_AXIS_CONTENT = 4;
        let padHoriz = containerPadding;
        let padVert = containerPadding;
        if (!applyWAuto) {
            const widthPx = BaseWidget.clampNumber(config.width, 1, null);
            const maxPad = Math.max(0, Math.floor((widthPx - MIN_AXIS_CONTENT) / 2));
            if (padHoriz > maxPad) padHoriz = maxPad;
        }
        if (!applyHAuto) {
            let heightPx = BaseWidget.clampNumber(config.height, 1, null);
            if (BaseWidget.isResponsiveMode()) {
                const resp = BaseWidget.getResponsiveLayout(this.overrides);
                const explicitH = (resp && typeof Dashboard !== 'undefined' && typeof Dashboard.explicitResponsiveHeightPx === 'function')
                    ? Dashboard.explicitResponsiveHeightPx(resp)
                    : 0;
                if (explicitH > 0) heightPx = explicitH;
            }
            const maxPad = Math.max(0, Math.floor((heightPx - MIN_AXIS_CONTENT) / 2));
            if (padVert > maxPad) padVert = maxPad;
        }
        this.elements.container.style.padding = padVert + 'px ' + padHoriz + 'px';

        wrapEl.style.width = applyWAuto ? 'fit-content' : '100%';
        wrapEl.style.height = applyHAuto ? 'fit-content' : '100%';
        wrapEl.style.minWidth = applyWAuto ? 'max-content' : '';
        wrapEl.style.whiteSpace = 'pre';
        wrapEl.style.overflow = 'visible';
        wrapEl.style.flexShrink = '0';
        const align = config.labelAlign;
        if (align === 'center') wrapEl.style.alignItems = 'center';
        else if (align === 'right') wrapEl.style.alignItems = 'flex-end';
        else wrapEl.style.alignItems = 'flex-start';

        if (this.elements.innerContent) {
            if (applyWAuto) {
                this.elements.innerContent.style.width = 'fit-content';
                this.elements.innerContent.style.minWidth = 'max-content';
                this.elements.innerContent.style.overflow = 'visible';
            } else {
                this.elements.innerContent.style.width = '100%';
                this.elements.innerContent.style.minWidth = '';
                this.elements.innerContent.style.overflow = 'hidden';
            }
        }

        textEl.style.display = 'block';
        textEl.style.flex = '0 0 auto';
        textEl.style.overflow = 'visible';
        textEl.style.textOverflow = 'clip';
        textEl.style.whiteSpace = 'pre';
        textEl.style.wordBreak = 'normal';
        textEl.style.overflowWrap = 'normal';
        textEl.style.wordWrap = 'normal';
        textEl.style.maxHeight = 'none';
        textEl.style.width = 'max-content';
        textEl.style.minWidth = 'max-content';
        textEl.style.height = 'auto';
        textEl.style.webkitLineClamp = '';
        textEl.style.webkitBoxOrient = '';

        this.scheduleFittedAutoSizeCommit();
    }

    _renderSpecific() {
        const config = this.config;
        const wrapEl = this.txtEl;
        const textEl = this.txtInnerEl;
        if (!wrapEl || !textEl) return;

        textEl.textContent = config.text;
        this.applyTypographyToElement(textEl, 'label', config, {});
        if (config.deactivated) {
            const accentCol = BaseWidget.getDeactivatedColorAccent(config);
            textEl.style.color = accentCol;
        }
        if (config.textVerticalAlign === 'top') {
            wrapEl.style.justifyContent = 'flex-start';
        } else if (config.textVerticalAlign === 'bottom') {
            wrapEl.style.justifyContent = 'flex-end';
        } else {
            wrapEl.style.justifyContent = 'center';
        }
        const baseTransform = textEl.style.transform && textEl.style.transform !== 'none'
            ? textEl.style.transform
            : '';
        if (config.textRotation !== 0) {
            textEl.style.transform = (baseTransform ? (baseTransform + ' ') : '') + 'rotate(' + config.textRotation + 'deg)';
        } else {
            textEl.style.transform = baseTransform || 'none';
        }
        this._applyOverflowBehavior(config);
    }
}

WidgetRegistry.register('label', LabelWidget);

