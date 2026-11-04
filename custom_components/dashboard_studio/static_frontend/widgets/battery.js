class BatteryWidget extends BaseWidget {
    static get metadata() {
        return { shortName: "Battery", label: "Battery", icon: "ph-battery-charging", category: "Data", color_dark: "hsl(130, 80%, 65%)", color_light: "hsl(130, 85%, 35%)", version: "2.3.1", date: "2026-11-02" };
    }

    static get BATTERY_LABEL_LEGACY_TYPO_KEYS() {
        return ['labelFont', 'labelFs', 'labelCol', 'labelCase', 'labelBold', 'labelAlign', 'labelItalic', 'labelOffX', 'labelOffY'];
    }

    static applyTypographyNestedToConfig(c) {
        BaseWidget.applyTypographyNestedToConfig(c, [
            ['widgetLabel', 'label']
        ]);
    }

    static getNestedBindingOverlaySpec() {
        return BaseWidget.buildTypographyBindingOverlaySpec([['widgetLabel', 'label']]);
    }

    static fillBatteryTypographyResolved(c, M) {
        BaseWidget.fillWidgetLabelTypographyResolved(c, M, 'label');
    }

    static get globalSettings() {
        return {
            battColGood: "@success",
            battColLow: "@danger",
            battColBorder: "@controlOff",
            battColEmpty: "@borderAccent",

            defaultBatteryVertical: false,
            defaultBatterySegments: 0,
            defaultBatteryLowThresh: 20,

            defaultBatteryOutlineWidth: 4,
            defaultBatteryInnerPad: 4,
            defaultBatteryTerminalSz: 10
        };
    }

    static get basicSettingKeys() {
        return ['value', 'charging', 'lowThreshold'];
    }

    static get globalSchema() {
        return [
            { type: 'heading', label: 'Data & Behavior', cols: 12 },
            { key: 'defaultBatteryVertical', type: 'checkbox', label: 'Default Vertical', cols: 12 },
            { key: 'defaultBatterySegments', type: 'number', label: 'Default Segments', cols: 6 },
            { key: 'defaultBatteryLowThresh', type: 'number', label: 'Default Low Threshold', cols: 6 },

            { type: 'heading', label: 'Appearance', cols: 12 },
            { key: 'battColGood', type: 'color', label: 'Good Color', cols: 6 },
            { key: 'battColLow', type: 'color', label: 'Low Color', cols: 6 },
            { key: 'battColBorder', type: 'color', label: 'Border Color', cols: 6 },
            { key: 'battColEmpty', type: 'color', label: 'Empty Color', cols: 6 },

            { key: 'defaultBatteryOutlineWidth', type: 'number', label: 'Outline Width', cols: 4 },
            { key: 'defaultBatteryInnerPad', type: 'number', label: 'Inner Padding', cols: 4 },
            { key: 'defaultBatteryTerminalSz', type: 'number', label: 'Terminal Size', cols: 4 }
        ];
    }

    static get AUDIO_TRIGGERS() {
        return [
            { key: 'full', label: 'On Full' },
            { key: 'empty', label: 'On Empty' },
            { key: 'charging', label: 'On Charging' },
            { key: 'stopCharging', label: 'On Stop Charging' }
        ];
    }

    getDefaultOverrides() {
        return {
            value: 75,
            charging: false,
            label: "",
            typography: { widgetLabel: {} },
            audio: (typeof DashboardAudio !== 'undefined' && DashboardAudio.defaultAudio)
                ? DashboardAudio.defaultAudio(BatteryWidget.AUDIO_TRIGGERS)
                : { full: '', empty: '', charging: '', stopCharging: '' }
        };
    }

    get config() {
        const c = super.config;
        const getNum = (val, def) => (val !== null && val !== undefined && val !== "") ? val : def;

        BatteryWidget.applyTypographyNestedToConfig(c);
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        BatteryWidget.fillBatteryTypographyResolved(c, M);
        BaseWidget.applyNestedBindingOverlay(this, c, BatteryWidget.getNestedBindingOverlaySpec());

        const out = {
            ...c,
            colGood: c.colGood || c.goodColor || c.battColGood,
            colLow: c.colLow || c.lowColor || c.battColLow,
            colBorder: c.colBorder || (this.overrides && this.overrides.borderColor) || c.battColBorder,
            colEmpty: c.colEmpty || c.emptyColor || c.battColEmpty,

            vertical: c.vertical !== undefined && c.vertical !== null ? c.vertical : c.defaultBatteryVertical,
            segments: c.segments !== undefined && c.segments !== null ? c.segments : c.defaultBatterySegments,
            lowThresh: c.lowThresh !== undefined && c.lowThresh !== null ? c.lowThresh
                : (c.lowThreshold !== undefined && c.lowThreshold !== null ? c.lowThreshold : c.defaultBatteryLowThresh),

            outlineWidth: getNum(c.outlineWidth, c.defaultBatteryOutlineWidth || 4),
            innerPadding: getNum(c.innerPadding, c.defaultBatteryInnerPad || 4),
            terminalSize: getNum(c.terminalSize, c.defaultBatteryTerminalSz || 10),

            label: c.label || "",
            labelFont: c.labelFont,
            labelFs: getNum(c.labelFs, M.defaultFsLabel != null ? M.defaultFsLabel : 12),
            labelCol: c.labelCol,
            labelCase: c.labelCase,
            labelBold: c.labelBold,
            labelAlign: c.labelAlign,
            labelItalic: c.labelItalic,
            labelOffX: getNum(c.labelOffX, 0),
            labelOffY: getNum(c.labelOffY, 0)
        };

        delete out.typography;

        return out;
    }

    getSchema() {
        const widgetLabelTypo = BaseWidget.getWidgetLabelTypographySchema('label', 'widgetLabel');

        return [
            {
                id: 'batt_behavior', title: 'Data & Behavior', icon: 'ph-lightning',
                fields: [
                    { key: 'value', type: 'number', label: '% Value', cols: 4 },
                    { key: 'charging', type: 'checkbox', label: 'Charging State', cols: 4 },
                    { key: 'lowThreshold', type: 'number', label: 'Low Threshold', cols: 4, defaultKey: 'defaultBatteryLowThresh' }
                ]
            },
            (typeof DashboardAudio !== 'undefined' && DashboardAudio.schemaGroup)
                ? DashboardAudio.schemaGroup('batt_audio', BatteryWidget.AUDIO_TRIGGERS)
                : {
                    id: 'batt_audio', title: 'Audio', icon: 'ph-music-notes',
                    fields: [{ key: 'audio', type: 'audio_trigger_map', cols: 12, triggers: BatteryWidget.AUDIO_TRIGGERS }]
                },
            {
                id: 'batt_style', title: 'Appearance', icon: 'ph-palette',
                fields: [
                    { key: 'vertical', type: 'checkbox', label: 'Vertical Mode', cols: 6, defaultKey: 'defaultBatteryVertical' },
                    { key: 'segments', type: 'number', label: 'Segments (0=Solid)', cols: 6, defaultKey: 'defaultBatterySegments' },

                    { key: 'goodColor', type: 'color', label: 'Good Color', cols: 3, defaultKey: 'battColGood' },
                    { key: 'lowColor', type: 'color', label: 'Low Color', cols: 3, defaultKey: 'battColLow' },
                    { key: 'borderColor', type: 'color', label: 'Border Color', cols: 3, defaultKey: 'battColBorder' },
                    { key: 'emptyColor', type: 'color', label: 'Empty Color', cols: 3, defaultKey: 'battColEmpty' },

                    { key: 'outlineWidth', type: 'number', label: 'Outline Width', cols: 4, defaultKey: 'defaultBatteryOutlineWidth' },
                    { key: 'innerPadding', type: 'number', label: 'Inner Padding', cols: 4, defaultKey: 'defaultBatteryInnerPad' },
                    { key: 'terminalSize', type: 'number', label: 'Terminal Size', cols: 4, defaultKey: 'defaultBatteryTerminalSz' },
                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }
                ]
            },
            {
                id: 'batt_label', title: 'Text & Typography', icon: 'ph-text-t',
                fields: [
                    { key: 'label', type: 'text', label: 'Widget Label', cols: 12 },
                    widgetLabelTypo
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
        lbl.style.fontWeight = '600';
        lbl.style.letterSpacing = '1px';
        lbl.style.flexShrink = '0';
        b.innerContent.appendChild(lbl);
        this.lblEl = lbl;

        const gfx = document.createElement('div');
        gfx.style.flex = '1';
        gfx.style.display = 'flex';
        gfx.style.alignItems = 'center';
        gfx.style.justifyContent = 'center';
        gfx.style.width = '100%';
        b.innerContent.appendChild(gfx);

        gfx.innerHTML = `
            <div class="bb" style="border:4px solid;border-radius:8px;padding:4px;position:relative;display:flex;">
                <div class="bf" style="background:#22c55e;border-radius:2px;transition:all 0.3s;"></div>
                <div class="bn" style="background:currentColor;position:absolute;"></div>
                <i class="ph-fill ph-lightning" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;display:none;"></i>
            </div>`;

        this.e = {
            b: gfx.querySelector('.bb'),
            f: gfx.querySelector('.bf'),
            n: gfx.querySelector('.bn'),
            i: gfx.querySelector('i')
        };

        return b;
    }

    _renderSpecific() {
        const c = this.config;
        const e = this.e;

        if (typeof DashboardAudio !== 'undefined') {
            if (!this._audioValueStore) this._audioValueStore = {};
            if (!this._audioChargingStore) this._audioChargingStore = {};
            const audio = c.audio;
            DashboardAudio.observeThresholdCross(
                this._audioValueStore,
                c.value,
                100,
                0,
                function () { DashboardAudio.playFrom(audio, 'full'); },
                function () { DashboardAudio.playFrom(audio, 'empty'); }
            );
            DashboardAudio.observeEdge(
                this._audioChargingStore,
                !!c.charging,
                function () { DashboardAudio.playFrom(audio, 'charging'); },
                function () { DashboardAudio.playFrom(audio, 'stopCharging'); }
            );
        }

        this.lblEl.textContent = c.label;
        this.lblEl.style.display = c.label ? 'block' : 'none';
        this.applyTypographyToElement(this.lblEl, 'label', c);
        this.lblEl.style.transform = `translate(${c.labelOffX}px, ${c.labelOffY}px)`;

        const labelH = c.label ? (c.labelFs + 10) : 0;
        const availH = Math.max(0, c.height - (c.padding * 2) - labelH);
        const availW = Math.max(0, c.width - (c.padding * 2));
        const v = c.vertical;

        const termOffset = c.terminalSize + c.outlineWidth;
        let w, h;

        if (v) {
            let maxH = Math.max(0, availH - termOffset);
            let maxW = availW;

            h = maxH;
            w = h / 2.5;

            if (w > maxW) {
                w = maxW;
                h = w * 2.5;
            }
        } else {
            let maxW = Math.max(0, availW - termOffset);
            let maxH = availH;

            w = maxW;
            h = w / 2.5;

            if (h > maxH) {
                h = maxH;
                w = h * 2.5;
            }
        }

        e.b.style.width = `${w}px`;
        e.b.style.height = `${h}px`;
        e.b.style.flexDirection = v ? 'column-reverse' : 'row';
        e.b.style.borderColor = BaseWidget.resolveCssColor(c.colBorder);
        e.b.style.color = BaseWidget.resolveCssColor(c.colBorder);
        e.b.style.borderWidth = `${c.outlineWidth}px`;
        e.b.style.padding = `${c.innerPadding}px`;

        if (v) {
            e.n.style.width = '40%';
            e.n.style.height = `${c.terminalSize}px`;
            e.n.style.top = `-${termOffset}px`;
            e.n.style.left = '30%';
            e.n.style.right = 'auto';
            e.b.style.transform = `translateY(${termOffset / 2}px)`;
        } else {
            e.n.style.width = `${c.terminalSize}px`;
            e.n.style.height = '40%';
            e.n.style.right = `-${termOffset}px`;
            e.n.style.top = '30%';
            e.n.style.left = 'auto';
            e.b.style.transform = `translateX(-${termOffset / 2}px)`;
        }

        const col = BaseWidget.resolveCssColor(c.value <= c.lowThresh ? c.colLow : c.colGood);
        const p = Math.max(0, Math.min(c.value, 100));
        const segCount = c.segments > 0 ? (c.segments | 0) : 0;

        if (segCount > 0) {
            e.f.style.backgroundColor = 'transparent';
            e.f.style.width = '100%';
            e.f.style.height = '100%';
            e.f.style.display = 'flex';
            e.f.style.flexDirection = v ? 'column-reverse' : 'row';
            const noFlexGap = document && document.documentElement &&
                document.documentElement.classList &&
                document.documentElement.classList.contains('no-flex-gap');

            e.f.style.gap = noFlexGap ? '' : '2px';

            const fs = Math.ceil((p / 100) * segCount);
            const emptyCol = BaseWidget.resolveCssColor(c.colEmpty);
            if (e.f.children.length !== segCount) {
                e.f.innerHTML = '';
                for (let i = 0; i < segCount; i++) {
                    const s = document.createElement('div');
                    s.style.flex = '1';
                    s.style.borderRadius = '1px';
                    e.f.appendChild(s);
                }
            }
            for (let i = 0; i < segCount; i++) {
                const s = e.f.children[i];
                s.style.backgroundColor = (i < fs) ? col : emptyCol;
                s.style.opacity = (i < fs) ? 1 : 0.3;

                if (noFlexGap) {
                    if (v) {
                        s.style.marginBottom = (i > 0) ? '2px' : '';
                        s.style.marginLeft = '';
                    } else {
                        s.style.marginLeft = (i > 0) ? '2px' : '';
                        s.style.marginBottom = '';
                    }
                } else {
                    s.style.marginBottom = '';
                    s.style.marginLeft = '';
                }
            }
        } else {
            if (e.f.children.length > 0) e.f.innerHTML = '';
            e.f.style.display = '';
            e.f.style.backgroundColor = col;
            if (v) {
                e.f.style.width = '100%';
                e.f.style.height = `${p}%`;
            } else {
                e.f.style.width = `${p}%`;
                e.f.style.height = '100%';
            }
        }

        e.i.style.display = c.charging ? 'block' : 'none';
        e.i.style.fontSize = `${Math.min(w, h) * 0.6}px`;

        if (c.deactivated) {
            const deactColor = BaseWidget.getDeactivatedColor(c);
            const accentColor = BaseWidget.getDeactivatedColorAccent(c);
            e.b.style.borderColor = deactColor;
            e.b.style.color = deactColor;
            e.n.style.backgroundColor = deactColor;
            e.f.style.backgroundColor = 'transparent';
            if (c.segments > 0) {
                const fs = Math.ceil((p / 100) * c.segments);
                e.f.querySelectorAll('div').forEach((s, i) => {
                    if (i < fs) {
                        s.style.backgroundColor = accentColor;
                        s.style.opacity = '1';
                        s.style.visibility = 'visible';
                    } else {
                        s.style.backgroundColor = 'transparent';
                        s.style.opacity = '0';
                        s.style.visibility = 'hidden';
                    }
                });
            } else {
                e.f.style.backgroundColor = accentColor;
            }
            if (c.charging) {
                e.i.style.display = 'block';
                e.i.style.color = accentColor;
            }
            if (c.label) {
                this.lblEl.style.display = 'block';
                this.lblEl.style.color = accentColor;
            } else {
                this.lblEl.style.display = 'none';
            }
        }
    }
}

WidgetRegistry.register('battery', BatteryWidget);
