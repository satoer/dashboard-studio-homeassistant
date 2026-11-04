class EditBoxWidget extends BaseWidget {
    static get metadata() {
        return { label: "Edit Box / Input", shortName: "Edit Box", icon: "ph-textbox", category: "Text", color_dark: "hsl(280, 80%, 65%)", color_light: "hsl(280, 85%, 35%)", version: "2.3.1", date: "2026-11-02" };
    }

    static get EDITBOX_INPUT_LEGACY_TYPO_KEYS() {
        return ['fontFamily', 'fontBold', 'textColor', 'fontSize', 'textAlign'];
    }

    static get EDITBOX_LABEL_LEGACY_TYPO_KEYS() {
        return ['labelFont', 'labelFs', 'labelCol', 'labelCase', 'labelBold', 'labelOffX', 'labelOffY'];
    }

    static get EDITBOX_INPUT_FLAT_TYPO_KEYS() {
        return [
            'editboxInputFont', 'editboxInputFs', 'editboxInputAlign', 'editboxInputBold',
            'editboxInputCol', 'editboxInputItalic'
        ];
    }

    static get EDITBOX_LABEL_FLAT_TYPO_KEYS() {
        return [
            'editboxLabelFont', 'editboxLabelFs', 'editboxLabelCol', 'editboxLabelCase',
            'editboxLabelBold', 'editboxLabelItalic', 'editboxLabelAlign',
            'editboxLabelOffX', 'editboxLabelOffY'
        ];
    }

    static applyTypographyNestedToConfig(c) {
        BaseWidget.applyTypographyNestedToConfig(c, [
            ['inputText', 'editboxInput'],
            ['widgetLabel', 'editboxLabel']
        ]);
    }

    static getNestedBindingOverlaySpec() {
        return BaseWidget.buildTypographyBindingOverlaySpec([
            ['inputText', 'editboxInput'],
            ['widgetLabel', 'editboxLabel']
        ]);
    }

    static fillEditboxTypographyResolved(c, M) {
        if (!c.editboxInputCol) c.editboxInputCol = M.editboxInputCol || M.editboxTextColor || '@text';
        if (c.editboxInputBold === undefined || c.editboxInputBold === null) {
            const masterInputBold = M.editboxInputBold !== undefined && M.editboxInputBold !== null
                ? M.editboxInputBold === true
                : M.editboxFontBold === true;
            c.editboxInputBold = masterInputBold;
        }
        if (!c.editboxInputAlign) {
            c.editboxInputAlign = M.editboxInputAlign || M.editboxInputDefaultAlign || 'left';
        }
        if (!c.editboxInputFont) {
            c.editboxInputFont = M.editboxInputFont || c.globalFontFamily || M.fontFamily || "'Inter', sans-serif";
        }
        if (c.editboxInputFs == null || c.editboxInputFs === '') {
            const masterFs = M.editboxInputFs != null && M.editboxInputFs !== ''
                ? M.editboxInputFs
                : M.editboxFontSize;
            c.editboxInputFs = masterFs != null ? masterFs : 14;
        }
        if (c.editboxInputItalic === undefined || c.editboxInputItalic === null) {
            c.editboxInputItalic = M.defaultLabelItalic === true;
        }
        if (!c.placeholderColor) c.placeholderColor = M.editboxPlaceholderColor || '@placeholder';

        if (!c.editboxLabelFont) {
            c.editboxLabelFont = c.editboxInputFont || c.globalFontFamily || M.fontFamily || "'Inter', sans-serif";
        }
        if (c.editboxLabelFs == null || c.editboxLabelFs === '') {
            c.editboxLabelFs = M.defaultFsLabel != null ? M.defaultFsLabel : 12;
        }
        if (!c.editboxLabelCol) c.editboxLabelCol = M.defaultColLabel || '@textMuted';
        if (!c.editboxLabelCase) c.editboxLabelCase = M.defaultLabelCase || 'uppercase';
        if (c.editboxLabelBold === undefined || c.editboxLabelBold === null) {
            c.editboxLabelBold = M.defaultLabelBold === true;
        }
        if (!c.editboxLabelAlign) {
            c.editboxLabelAlign = M.defaultTextAlign || 'center';
        }
        if (c.editboxLabelItalic === undefined || c.editboxLabelItalic === null) {
            c.editboxLabelItalic = M.defaultLabelItalic === true;
        }
        if (c.editboxLabelOffX === undefined || c.editboxLabelOffX === null) {
            c.editboxLabelOffX = 0;
        }
        if (c.editboxLabelOffY === undefined || c.editboxLabelOffY === null) {
            c.editboxLabelOffY = 0;
        }
    }

    static get globalSettings() {
        return {
            editboxBgColor: "@surface",
            editboxBgOpacity: 100,
            editboxBorderColor: "@accentSecondary",
            editboxBorderWidth: 1,
            editboxBorderRadius: 8,
            editboxEnableFocusColor: true,
            editboxFocusColor: BaseWidget.themeTokenRef('link'),

            editboxTextColor: "@text",
            editboxPlaceholderColor: "@placeholder",
            editboxFontSize: 14,
            editboxFontBold: false,
            editboxTextPadding: 8,

            editboxInputDefaultAlign: 'left'
        };
    }

    static get globalSchema() {
        const inputTextTypoMaster = BaseWidget.getTypographySchema('editboxInput', 'Input Text', {
            exclude: ['opacity', 'colorOff', 'offset', 'case'],
            fontDefaultKey: 'fontFamily',
            fontSizeDefaultKey: 'editboxFontSize',
            colorDefaultKey: 'editboxTextColor',
            boldDefaultKey: 'editboxFontBold',
            italicDefaultKey: 'defaultLabelItalic',
            alignDefaultKey: 'editboxInputDefaultAlign',
            extraFieldsInsert: 'afterColor',
            extraFields: [
                { key: 'editboxPlaceholderColor', type: 'color', label: 'Placeholder Color', cols: 6 },
                { key: 'editboxTextPadding', type: 'number', label: 'Text Padding', cols: 6 }
            ]
        });

        return [
            { type: 'heading', label: 'Appearance', cols: 12 },
            { key: 'editboxBgColor', type: 'color', label: 'Background Color', cols: 6 },
            { key: 'editboxBgOpacity', type: 'number', label: 'Background Opacity', min: 0, max: 100, cols: 6 },
            { key: 'editboxBorderColor', type: 'color', label: 'Border Color', cols: 6 },
            { key: 'editboxBorderWidth', type: 'number', label: 'Border Width', cols: 6 },
            { key: 'editboxBorderRadius', type: 'number', label: 'Border Radius', cols: 6 },
            { key: 'editboxEnableFocusColor', type: 'checkbox', label: 'Enable Focus Glow', cols: 6 },
            { key: 'editboxFocusColor', type: 'color', label: 'Focus / Glow Color', cols: 6 },

            { type: 'heading', label: 'Typography', cols: 12 },
            inputTextTypoMaster
        ];
    }

    getDefaultOverrides() {
        return {
            inputMode: "single",
            sendBehavior: "keyboard",
            outputTopic: "",
            triggerTopic: "",
            urlPrefix: "",
            urlSuffix: "",
            urlNewTab: false,
            clearOnSend: true,
            customPlaceholder: "",

            bgColor: null,
            bgOpacity: null,
            borderColor: null,
            borderWidth: null,
            borderRadius: null,
            focusColor: null,

            textPadding: null,
            placeholderColor: null,

            label: "",
            typography: { inputText: {}, widgetLabel: {} }
        };
    }

    get config() {
        const c = super.config;
        const getNum = (val, def) => (val !== null && val !== undefined && val !== "") ? val : def;

        EditBoxWidget.applyTypographyNestedToConfig(c);
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        EditBoxWidget.fillEditboxTypographyResolved(c, M);
        BaseWidget.applyNestedBindingOverlay(this, c, EditBoxWidget.getNestedBindingOverlaySpec());

        const out = {
            ...c,
            inputMode: c.inputMode || "single",
            sendBehavior: c.sendBehavior || "keyboard",
            outputTopic: c.outputTopic || "",
            triggerTopic: c.triggerTopic || "",
            urlPrefix: c.urlPrefix != null ? String(c.urlPrefix) : "",
            urlSuffix: c.urlSuffix != null ? String(c.urlSuffix) : "",
            urlNewTab: c.urlNewTab === true,
            clearOnSend: c.clearOnSend !== undefined ? c.clearOnSend : true,
            customPlaceholder: c.customPlaceholder || "",

            bgColor: c.bgColor || c.editboxBgColor,
            bgOpacity: getNum(c.bgOpacity, c.editboxBgOpacity),
            borderColor: c.borderColor || c.editboxBorderColor,
            borderWidth: getNum(c.borderWidth, c.editboxBorderWidth),
            borderRadius: getNum(c.borderRadius, c.editboxBorderRadius),

            enableFocusColor: getNum(c.enableFocusColor, c.editboxEnableFocusColor !== undefined ? c.editboxEnableFocusColor : true),
            focusColor: c.focusColor || c.editboxFocusColor || BaseWidget.themeTokenRef('link'),

            editboxInputFont: c.editboxInputFont,
            editboxInputBold: c.editboxInputBold,
            editboxInputCol: c.editboxInputCol,
            editboxInputFs: getNum(c.editboxInputFs, c.editboxFontSize),
            editboxInputAlign: c.editboxInputAlign,
            editboxInputItalic: c.editboxInputItalic,
            placeholderColor: c.placeholderColor,
            textPadding: getNum(c.textPadding, c.editboxTextPadding),

            label: c.label || "",
            editboxLabelFont: c.editboxLabelFont,
            editboxLabelFs: getNum(c.editboxLabelFs, c.defaultFsLabel || 12),
            editboxLabelCol: c.editboxLabelCol,
            editboxLabelCase: c.editboxLabelCase,
            editboxLabelBold: c.editboxLabelBold,
            editboxLabelAlign: c.editboxLabelAlign,
            editboxLabelItalic: c.editboxLabelItalic,
            editboxLabelOffX: getNum(c.editboxLabelOffX, 0),
            editboxLabelOffY: getNum(c.editboxLabelOffY, 0)
        };

        EditBoxWidget.EDITBOX_INPUT_LEGACY_TYPO_KEYS.forEach((k) => { delete out[k]; });
        EditBoxWidget.EDITBOX_LABEL_LEGACY_TYPO_KEYS.forEach((k) => { delete out[k]; });
        delete out.textAlign;
        delete out.typography;

        return out;
    }

    constructor(cid, id, ov, bn) {
        super(cid, id, ov, bn);
        this.debounceTimer = null;
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
    }

    getSchema() {
        const inputTextTypo = BaseWidget.getTypographySchema('editboxInput', 'Input Text', {
            exclude: ['opacity', 'colorOff', 'offset'],
            nestedTypography: { root: 'typography', role: 'inputText' },
            fontDefaultKey: 'fontFamily',
            fontSizeDefaultKey: 'editboxFontSize',
            colorDefaultKey: 'editboxTextColor',
            boldDefaultKey: 'editboxFontBold',
            italicDefaultKey: 'defaultLabelItalic',
            alignDefaultKey: 'editboxInputDefaultAlign',
            extraFieldsInsert: 'afterColor',
            extraFields: [
                {
                    key: 'placeholderColor', type: 'color', label: 'Placeholder Color', cols: 6,
                    defaultKey: 'editboxPlaceholderColor'
                },
                {
                    key: 'textPadding', type: 'number', label: 'Text Padding', cols: 6,
                    defaultKey: 'editboxTextPadding'
                }
            ]
        });

        const widgetLabelTypo = BaseWidget.getTypographySchema('editboxLabel', 'Widget Label', {
            exclude: ['opacity', 'colorOff'],
            nestedTypography: { root: 'typography', role: 'widgetLabel' },
            fontDefaultKeyFallback: 'editboxInputFont',
            fontSizeDefaultKey: 'defaultFsLabel',
            colorDefaultKey: 'defaultColLabel',
            alignDefaultKey: 'defaultTextAlign',
            alignLabel: 'Horizontal Alignment',
            caseDefaultKey: 'defaultLabelCase',
            caseLabel: 'Label Case',
            caseOptions: [
                { value: 'uppercase', text: 'UPPERCASE' },
                { value: 'capitalize', text: 'Capitalize' },
                { value: 'lowercase', text: 'lowercase' },
                { value: 'none', text: 'None' }
            ],
            boldDefaultKey: 'defaultLabelBold',
            italicDefaultKey: 'defaultLabelItalic'
        });

        return [
            {
                id: 'eb_behavior', title: 'Data & Behavior', icon: 'ph-lightning',
                fields: [
                    {
                        key: 'inputMode', type: 'select', label: 'Input Mode', options: [
                            { value: 'single', text: 'Single Line' },
                            { value: 'multi', text: 'Multi-Line' }
                        ], cols: 6
                    },
                    {
                        key: 'sendBehavior', type: 'select', label: 'Send Behavior', options: [
                            { value: 'live', text: 'Live (On Type)' },
                            { value: 'keyboard', text: 'Keyboard (Enter)' },
                            { value: 'keyboardExit', text: 'Keyboard (Enter) & Exit' },
                            { value: 'trigger', text: 'Trigger Topic' },
                            { value: 'openUrl', text: 'Open URL' }
                        ], cols: 6
                    },
                    {
                        key: 'outputTopic', type: 'topic', label: 'Output Topic', cols: 12,
                        visibleWhen: (values) => values.sendBehavior !== 'openUrl',
                        dependsOn: ['sendBehavior']
                    },
                    {
                        key: 'triggerTopic', type: 'topic', label: 'Trigger Topic', cols: 12
                    },
                    {
                        key: 'urlPrefix', type: 'text', label: 'Prefix URL', cols: 6,
                        visibleWhen: (values) => values.sendBehavior === 'openUrl',
                        dependsOn: ['sendBehavior']
                    },
                    {
                        key: 'urlSuffix', type: 'text', label: 'Suffix URL', cols: 6,
                        visibleWhen: (values) => values.sendBehavior === 'openUrl',
                        dependsOn: ['sendBehavior']
                    },
                    {
                        key: 'urlNewTab', type: 'checkbox', label: 'New tab', cols: 6,
                        visibleWhen: (values) => values.sendBehavior === 'openUrl',
                        dependsOn: ['sendBehavior']
                    },
                    { key: 'clearOnSend', type: 'checkbox', label: 'Clear on Send', cols: 6 },
                    { key: 'customPlaceholder', type: 'text', label: 'Custom Placeholder', cols: 12 }
                ]
            },
            {
                id: 'eb_appear', title: 'Appearance', icon: 'ph-palette',
                fields: [
                    { key: 'bgColor', type: 'color', label: 'Background Color', cols: 6, defaultKey: 'editboxBgColor' },
                    { key: 'bgOpacity', type: 'number', label: 'Background Opacity', min: 0, max: 100, cols: 6, defaultKey: 'editboxBgOpacity' },
                    { key: 'borderColor', type: 'color', label: 'Border Color', cols: 4, defaultKey: 'editboxBorderColor' },
                    { key: 'borderWidth', type: 'number', label: 'Border Width', cols: 4, defaultKey: 'editboxBorderWidth' },
                    { key: 'borderRadius', type: 'number', label: 'Border Radius', cols: 4, defaultKey: 'editboxBorderRadius' },
                    { key: 'enableFocusColor', type: 'checkbox', label: 'Enable Focus Glow', cols: 6, defaultKey: 'editboxEnableFocusColor' },
                    { key: 'focusColor', type: 'color', label: 'Focus Glow Color', cols: 6, defaultKey: 'editboxFocusColor' },
                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }
                ]
            },
            {
                id: 'eb_text', title: 'Text & Typography', icon: 'ph-text-t',
                fields: [
                    { key: 'label', type: 'text', label: 'Widget Label', cols: 12 },
                    widgetLabelTypo,
                    inputTextTypo
                ]
            }
        ];
    }

    _buildBaseDOM() {
        const b = super._buildBaseDOM();
        b.container.classList.add('interactive');
        b.innerContent.style.display = 'flex';
        b.innerContent.style.width = '100%';
        b.innerContent.style.height = '100%';
        b.innerContent.style.pointerEvents = 'auto';

        this.lbl = document.createElement('div');
        this.lbl.className = 'eb-label';
        this.lbl.style.marginBottom = '8px';
        this.lbl.style.flexShrink = '0';
        this.lbl.style.pointerEvents = 'none';

        this.inputContainer = document.createElement('div');
        this.inputContainer.className = 'eb-input-host';
        b.innerContent.appendChild(this.inputContainer);

        this.inputEl = null;

        this.debounceTimer = null;
        this.lastTriggerState = undefined;
        this._lastSentPayload = undefined;

        b.innerContent.addEventListener('mousedown', (e) => {
            if (!Dashboard.isEditMode && !this.config.deactivated) {
                e.stopPropagation();
            }
        });

        b.innerContent.addEventListener('touchstart', (e) => {
            if (!Dashboard.isEditMode && !this.config.deactivated) {
                e.stopPropagation();
            }
        }, { passive: false });

        return b;
    }

    _sendPayload() {
        if (!this.inputEl || this.config.deactivated) return;
        const c = this.config;
        const payload = this.inputEl.value;

        if (c.sendBehavior === 'openUrl') {
            if (typeof UrlNavigation !== 'undefined' && typeof UrlNavigation.openComposedUrl === 'function') {
                UrlNavigation.openComposedUrl(c.urlPrefix, payload, c.urlSuffix, c.urlNewTab);
            } else if (typeof UrlNavigation !== 'undefined' && typeof UrlNavigation.openUrl === 'function') {
                UrlNavigation.openUrl(UrlNavigation.composeUrl(c.urlPrefix, payload, c.urlSuffix), c.urlNewTab);
            } else {
                const url = String(c.urlPrefix || '') + payload + String(c.urlSuffix || '');
                window.open(url.trim(), c.urlNewTab === true ? '_blank' : '_self');
            }
        } else {
            const outTopic = c.outputTopic || c.name || this.id;
            Dashboard.send(outTopic, payload);
        }

        this._lastSentPayload = payload;

        if (c.clearOnSend) {
            this.inputEl.value = "";
            this._lastSentPayload = "";
        }
    }

    static sendBehaviorUsesEnterKey(sendBehavior) {
        return sendBehavior === 'keyboard' || sendBehavior === 'keyboardExit' || sendBehavior === 'openUrl';
    }

    _handleInput(e) {
        if (Dashboard.isEditMode || this.config.deactivated) return;
        const c = this.config;

        if (c.sendBehavior === 'live') {
            if (this.debounceTimer) WorkerTimer.clearTimeout(this.debounceTimer);
            this.debounceTimer = WorkerTimer.setTimeout(() => {
                this.debounceTimer = null;
                this._sendPayload();
            }, 300);
        }
    }

    _handleKeyDown(e) {
        if (Dashboard.isEditMode || this.config.deactivated) return;
        const c = this.config;

        if (EditBoxWidget.sendBehaviorUsesEnterKey(c.sendBehavior)) {
            if (c.inputMode === 'single') {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this._sendPayload();
                }
            } else if (c.inputMode === 'multi') {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this._sendPayload();
                }
            }
        }
    }

    _handleBlur() {
        if (Dashboard.isEditMode || this.config.deactivated) return;
        const c = this.config;
        if (c.sendBehavior !== 'keyboardExit' || !this.inputEl) return;
        const payload = this.inputEl.value;
        if (payload === this._lastSentPayload) return;
        this._sendPayload();
    }

    onRemove() {
        if (this.debounceTimer) {
            WorkerTimer.clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }

    /** Place the label and input host without detaching an input that is already in the widget. */
    _syncMountedFields(el, showLabel) {
        const label = this.lbl;
        const host = this.inputContainer;
        if (!el || !label || !host) return;
        if (showLabel) {
            const before = (host.parentNode === el) ? host : null;
            if (label.parentNode !== el || label.nextSibling !== before) {
                el.insertBefore(label, before);
            }
        } else if (label.parentNode) {
            label.parentNode.removeChild(label);
        }
        if (host.parentNode !== el) el.appendChild(host);
    }

    _renderSpecific() {
        const c = this.config;
        const el = this.elements.innerContent;

        this.lbl.textContent = c.label;
        this.lbl.style.display = c.label ? 'block' : 'none';
        this.lbl.style.margin = '0 0 8px 0';
        this.applyTypographyToElement(this.lbl, 'editboxLabel', c);
        this.lbl.style.transform = `translate(${c.editboxLabelOffX}px, ${c.editboxLabelOffY}px)`;

        el.style.flexDirection = 'column';
        el.style.alignItems = 'stretch';

        // Leave the input host mounted. Removing it blurs the field on every live repaint.
        this._syncMountedFields(el, !!c.label);

        const requiredTag = c.inputMode === 'multi' ? 'textarea' : 'input';

        if (!this.inputEl || this.inputEl.tagName.toLowerCase() !== requiredTag) {
            this.inputContainer.innerHTML = '';
            this.inputEl = document.createElement(requiredTag);

            if (requiredTag === 'input') {
                this.inputEl.type = 'text';
            }

            this.inputEl.className = 'eb-input';
            Utils.applyExtensionIgnoreAttrs(this.inputEl);
            this.inputEl.addEventListener('input', (e) => this._handleInput(e));
            this.inputEl.addEventListener('keydown', (e) => this._handleKeyDown(e));
            this.inputEl.addEventListener('blur', () => this._handleBlur());

            this.inputContainer.appendChild(this.inputEl);
        }

        const deactivated = !!c.deactivated;
        const deactColor = deactivated ? BaseWidget.getDeactivatedColor(c) : null;
        const accentColor = deactivated ? BaseWidget.getDeactivatedColorAccent(c) : null;
        const bgRgba = deactivated
            ? 'transparent'
            : Dashboard.hexToRgba(BaseWidget.resolveCssColor(c.bgColor), c.bgOpacity / 100);
        const bdrCol = deactivated
            ? deactColor
            : Dashboard.hexToRgba(BaseWidget.resolveCssColor(c.borderColor), 1.0);
        const borderW = deactivated ? Math.max(1, c.borderWidth || 1) : c.borderWidth;
        const textCol = deactivated ? accentColor : BaseWidget.resolveCssColor(c.editboxInputCol);
        const host = this.inputContainer;
        Utils.setCssVarIfChanged(host, '--eb-bg', bgRgba);
        Utils.setCssVarIfChanged(host, '--eb-border', borderW + 'px solid ' + bdrCol);
        Utils.setCssVarIfChanged(host, '--eb-radius', (c.borderRadius || 0) + 'px');
        Utils.setCssVarIfChanged(host, '--eb-color', textCol);
        Utils.setCssVarIfChanged(host, '--eb-font', c.editboxInputFont || 'inherit');
        Utils.setCssVarIfChanged(host, '--eb-weight', c.editboxInputBold ? '700' : '400');
        Utils.setCssVarIfChanged(host, '--eb-style', c.editboxInputItalic ? 'italic' : 'normal');
        Utils.setCssVarIfChanged(host, '--eb-size', (c.editboxInputFs || 14) + 'px');
        Utils.setCssVarIfChanged(host, '--eb-align', c.editboxInputAlign || 'left');
        Utils.setCssVarIfChanged(host, '--eb-pad', (c.textPadding || 0) + 'px');

        this._applyEditModeInputLock();
        this.inputEl.disabled = deactivated;
        this.inputEl.tabIndex = deactivated ? -1 : 0;
        host.classList.toggle('eb-is-deactivated', deactivated);

        let phText = c.customPlaceholder;
        if (deactivated) {
            phText = '';
        } else if (!phText) {
            if (c.sendBehavior === 'trigger') {
                phText = "Waiting for trigger...";
            } else if (c.sendBehavior === 'openUrl') {
                const triggerHint = c.triggerTopic ? ' or wait for trigger' : '';
                phText = c.inputMode === 'single'
                    ? `Press Enter${triggerHint} to open URL`
                    : `Press Enter${triggerHint} to open URL (Shift+Enter for newline)`;
            } else if (EditBoxWidget.sendBehaviorUsesEnterKey(c.sendBehavior)) {
                const exitHint = c.sendBehavior === 'keyboardExit' ? ' or leave the field' : '';
                phText = c.inputMode === 'single'
                    ? `Press Enter${exitHint} to send`
                    : `Press Enter${exitHint} to send (Shift+Enter for newline)`;
            } else {
                phText = c.inputMode === 'single' ? "Type to send..." : "Type to send... (Shift+Enter for newline)";
            }
        }
        if (this.inputEl.placeholder !== phText) this.inputEl.placeholder = phText;

        const focusCol = BaseWidget.resolveCssColor(c.focusColor);
        Utils.setCssVarIfChanged(host, '--eb-focus-col', c.enableFocusColor ? focusCol : 'transparent');
        Utils.setCssVarIfChanged(host, '--eb-focus-shadow', c.enableFocusColor ? `0 0 5px ${focusCol}` : 'none');
        Utils.setCssVarIfChanged(host, '--eb-placeholder', BaseWidget.resolveCssColor(c.placeholderColor));

        if (c.label && deactivated) {
            this.lbl.style.color = accentColor;
        }
    }

    _applyEditModeInputLock() {
        if (!this.inputEl) return;
        const editing = typeof Dashboard !== 'undefined'
            && !!Dashboard.isEditMode
            && !Dashboard._holdLivePreviewActive;
        this.inputEl.readOnly = editing;
        if (this.inputContainer) this.inputContainer.classList.toggle('eb-is-readonly', editing);
    }

    _syncEditModeVisuals() {
        BaseWidget.prototype._syncEditModeVisuals.call(this);
        this._applyEditModeInputLock();
    }

    onIncomingData(topic, payload, count) {
        const c = this.config;
        if (c.triggerTopic && topic === c.triggerTopic && !Dashboard.isEditMode) {
            if (this.inputEl && this.inputEl.value !== "") {
                this._sendPayload();
            }
            return true;
        }
        return false;
    }

    updateBindings(payload, replace = false) {
        super.updateBindings(payload, replace);
    }
}

WidgetRegistry.register('editbox', EditBoxWidget);