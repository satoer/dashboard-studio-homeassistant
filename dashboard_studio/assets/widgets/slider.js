class SliderWidget extends BaseWidget {
    static get metadata() {
        return { label: "Slider", shortName: "Slider", icon: "ph-sliders-horizontal", category: "Control", color_dark: "hsl(240, 80%, 65%)", color_light: "hsl(240, 85%, 35%)", version: "2.3.1", date: "2026-11-02" };
    }

    /** Remap raw slider value to display range when customDisplayRange is enabled (MQTT/output unchanged). */
    static mapSliderDisplayValue(rawValue, c) {
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

    /** Format slider value readout; uses display-range decimals when customDisplayRange is enabled. */
    static formatSliderDisplayValue(rawValue, c) {
        const displayValue = SliderWidget.mapSliderDisplayValue(rawValue, c);
        if (c.customDisplayRange) {
            const decimals = Math.max(0, Math.floor(BaseWidget.toFiniteNumber(c.displayDecimalPlaces, 1)));
            const roundedStr = Number(displayValue).toFixed(decimals);
            return c.displayKeepTrailingZeros ? roundedStr : String(parseFloat(roundedStr));
        }
        const step = c.allowDecimals ? c.stepSize : 1;
        const decimals = c.allowDecimals ? (String(step).split('.')[1] || '').length : 0;
        return Number(displayValue).toFixed(decimals);
    }

    /** Decimal places used by the on-slider value readout. */
    static sliderDisplayDecimalPlaces(c) {
        if (!c) return 0;
        if (c.customDisplayRange) {
            return Math.max(0, Math.floor(BaseWidget.toFiniteNumber(c.displayDecimalPlaces, 1)));
        }
        const step = c.allowDecimals ? c.stepSize : 1;
        return c.allowDecimals ? (String(step).split('.')[1] || '').length : 0;
    }

    /**
     * Worst-case readout strings for a fixed left/right column: formatted min, formatted max,
     * and an 8-digit probe so narrower glyphs (e.g. "111") do not undersize the column.
     */
    static sliderValueWidthSamples(c) {
        const formattedMin = SliderWidget.formatSliderDisplayValue(c.min, c);
        const formattedMax = SliderWidget.formatSliderDisplayValue(c.max, c);
        const lo = BaseWidget.toFiniteNumber(SliderWidget.mapSliderDisplayValue(c.min, c), 0);
        const hi = BaseWidget.toFiniteNumber(SliderWidget.mapSliderDisplayValue(c.max, c), 0);
        const mag = Math.max(Math.abs(lo), Math.abs(hi));
        const decimals = SliderWidget.sliderDisplayDecimalPlaces(c);
        const intDigits = Math.max(1, String(Math.floor(mag + 1e-12)).length);
        let probe = ((lo < 0 || hi < 0) ? '-' : '') + '8'.repeat(intDigits);
        if (decimals > 0) probe += '.' + '8'.repeat(decimals);
        const samples = [formattedMin, formattedMax, probe];
        return samples.filter((s, i) => s != null && s !== '' && samples.indexOf(s) === i);
    }

    static sliderFractionsEnabled(values, isGlobal) {
        if (isGlobal) return values.defaultSliderAllowDecimals === true;
        const raw = values.allowDecimals !== undefined && values.allowDecimals !== null
            ? values.allowDecimals
            : values.defaultSliderAllowDecimals;
        return raw === true;
    }

    /** Track / fill / thumb inner-glow and outline color/opacity leaves show once a width is set. */
    static trackInnerGlowDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'trackInnerGlow', 'defaultSliderTrackInnerGlow');
    }
    static fillInnerGlowDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'fillInnerGlow', 'defaultSliderFillInnerGlow');
    }
    static thumbInnerGlowDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'thumbInnerGlow', 'defaultSliderThumbInnerGlow');
    }
    static trackOutlineDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'trackOutlineWidth', 'defaultSliderTrackOutlineWidth');
    }
    static fillOutlineDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'fillOutlineWidth', 'defaultSliderFillOutlineWidth');
    }
    static thumbOutlineDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'thumbOutlineWidth', 'defaultSliderThumbOutlineWidth');
    }

    static attachSliderFractionStepVisibility(field) {
        if (!field) return;
        const prevVisibleWhen = field.visibleWhen;
        field.visibleWhen = function (values, isGlobal) {
            if (!SliderWidget.sliderFractionsEnabled(values, isGlobal)) return false;
            if (typeof prevVisibleWhen === 'function') return prevVisibleWhen(values, isGlobal);
            return true;
        };
        const dep = ['allowDecimals', 'defaultSliderAllowDecimals'];
        if (Array.isArray(field.dependsOn)) {
            dep.forEach((k) => {
                if (field.dependsOn.indexOf(k) < 0) field.dependsOn.push(k);
            });
        } else {
            field.dependsOn = dep;
        }
    }

    static sliderValueOptionsVisible(values, isGlobal) {
        if (isGlobal) return values.defaultSliderShowVal !== false;
        const raw = values.showVal !== undefined && values.showVal !== null
            ? values.showVal
            : values.defaultSliderShowVal;
        return raw !== false;
    }

    static get VALUE_LOCATION_OPTIONS() {
        return [
            { value: 'middle', text: 'Middle' },
            { value: 'top', text: 'Top' },
            { value: 'bottom', text: 'Bottom' },
            { value: 'left', text: 'Left' },
            { value: 'right', text: 'Right' }
        ];
    }

    static normalizeValueLocation(raw) {
        const s = String(raw == null ? 'middle' : raw).trim().toLowerCase();
        if (s === 'middle' || s === 'top' || s === 'bottom' || s === 'left' || s === 'right') return s;
        return 'middle';
    }

    static get LABEL_LOCATION_OPTIONS() {
        return [
            { value: 'top', text: 'Top' },
            { value: 'bottom', text: 'Bottom' },
            { value: 'left', text: 'Left' },
            { value: 'right', text: 'Right' }
        ];
    }

    static normalizeLabelLocation(raw) {
        const s = String(raw == null ? 'top' : raw).trim().toLowerCase();
        if (s === 'top' || s === 'bottom' || s === 'left' || s === 'right') return s;
        return 'top';
    }

    static sliderLabelLocationVisible(values, isGlobal) {
        if (isGlobal) return true;
        const raw = values && values.label != null ? String(values.label) : '';
        return raw.trim() !== '';
    }

    static attachSliderLabelLocationVisibility(field) {
        if (!field) return;
        const prevVisibleWhen = field.visibleWhen;
        field.visibleWhen = function (values, isGlobal) {
            if (!SliderWidget.sliderLabelLocationVisible(values, isGlobal)) return false;
            if (typeof prevVisibleWhen === 'function') return prevVisibleWhen(values, isGlobal);
            return true;
        };
        const dep = ['label'];
        if (Array.isArray(field.dependsOn)) {
            dep.forEach((k) => {
                if (field.dependsOn.indexOf(k) < 0) field.dependsOn.push(k);
            });
        } else {
            field.dependsOn = dep;
        }
    }

    static attachSliderValueSectionVisibility(field) {
        if (!field) return;
        const prevVisibleWhen = field.visibleWhen;
        field.visibleWhen = function (values, isGlobal) {
            if (!SliderWidget.sliderValueOptionsVisible(values, isGlobal)) return false;
            if (typeof prevVisibleWhen === 'function') return prevVisibleWhen(values, isGlobal);
            return true;
        };
        const dep = ['showVal', 'defaultSliderShowVal'];
        if (Array.isArray(field.dependsOn)) {
            dep.forEach((k) => {
                if (field.dependsOn.indexOf(k) < 0) field.dependsOn.push(k);
            });
        } else {
            field.dependsOn = dep;
        }
        if (field.type === 'typography' && Array.isArray(field.fields)) {
            field.fields.forEach((sub) => SliderWidget.attachSliderValueSectionVisibility(sub));
        }
    }

    static applyTypographyNestedToConfig(c) {
        BaseWidget.applyTypographyNestedToConfig(c, [
            ['widgetLabel', 'sliderWidgetLabel'],
            ['caption', 'sliderCaption'],
            ['value', 'sliderValue'],
            ['unit', 'sliderUnit']
        ]);
    }

    static getNestedBindingOverlaySpec() {
        return BaseWidget.buildTypographyBindingOverlaySpec([
            ['widgetLabel', 'sliderWidgetLabel'],
            ['caption', 'sliderCaption'],
            ['value', 'sliderValue'],
            ['unit', 'sliderUnit']
        ]);
    }

    static fillSliderTypographyResolved(c, M) {
        BaseWidget.fillWidgetLabelTypographyResolved(c, M, 'sliderWidgetLabel');

        if (!c.sliderCaptionFont) c.sliderCaptionFont = c.fontFamily || M.fontFamily || "'Inter', sans-serif";
        if (c.sliderCaptionFs == null || c.sliderCaptionFs === '') {
            c.sliderCaptionFs = M.defaultFsLabel != null ? M.defaultFsLabel : 12;
        }
        if (!c.sliderCaptionCol) c.sliderCaptionCol = M.defaultColLabel || '@textMuted';
        if (!c.sliderCaptionCase) c.sliderCaptionCase = M.defaultLabelCase || 'uppercase';
        if (c.sliderCaptionBold === undefined || c.sliderCaptionBold === null) {
            c.sliderCaptionBold = M.defaultLabelBold === true;
        }
        if (c.sliderCaptionOffX === undefined || c.sliderCaptionOffX === null) {
            c.sliderCaptionOffX = M.defaultSliderLabelOffX != null ? M.defaultSliderLabelOffX : 0;
        }
        if (c.sliderCaptionOffY === undefined || c.sliderCaptionOffY === null) {
            c.sliderCaptionOffY = M.defaultSliderLabelOffY != null ? M.defaultSliderLabelOffY : 0;
        }

        if (!c.sliderValueFont) {
            c.sliderValueFont = M.defaultSliderValFam || c.fontFamily || M.fontFamily || "'Inter', sans-serif";
        }
        if (c.sliderValueFs == null || c.sliderValueFs === '') {
            c.sliderValueFs = M.defaultSliderValFs != null ? M.defaultSliderValFs : 10;
        }
        if (!c.sliderValueCol) c.sliderValueCol = M.sliderColVal || '@text';
        if (!c.sliderValueAlign) c.sliderValueAlign = M.defaultSliderValAlign || 'center';
        if (c.sliderValueBold === undefined || c.sliderValueBold === null) {
            c.sliderValueBold = M.defaultSliderValFamBold === true;
        }
        if (c.sliderValueOffX === undefined || c.sliderValueOffX === null) {
            c.sliderValueOffX = M.defaultSliderValOffX != null ? M.defaultSliderValOffX : 0;
        }
        if (c.sliderValueOffY === undefined || c.sliderValueOffY === null) {
            c.sliderValueOffY = M.defaultSliderValOffY != null ? M.defaultSliderValOffY : 0;
        }

        if (!c.sliderUnitFont) {
            c.sliderUnitFont = c.sliderValueFont || c.fontFamily || M.fontFamily || "'Inter', sans-serif";
        }
        if (c.sliderUnitFs == null || c.sliderUnitFs === '') {
            c.sliderUnitFs = M.defaultSliderUnitFs != null ? M.defaultSliderUnitFs : (M.defaultFsUnit != null ? M.defaultFsUnit : 20);
        }
        if (!c.sliderUnitCol) {
            c.sliderUnitCol = M.defaultSliderUnitCol || M.sliderColVal || '@textMuted';
        }
        if (c.sliderUnitBold === undefined || c.sliderUnitBold === null) {
            c.sliderUnitBold = M.defaultSliderUnitBold === true;
        }
        if (c.sliderUnitItalic === undefined || c.sliderUnitItalic === null) {
            c.sliderUnitItalic = M.defaultSliderUnitItalic === true;
        }
        if (c.sliderUnitOpacity === undefined || c.sliderUnitOpacity === null || c.sliderUnitOpacity === '') {
            c.sliderUnitOpacity = M.defaultSliderUnitOpacity != null ? M.defaultSliderUnitOpacity : 100;
        }
    }

    static get globalSettings() {
        return {
            sliderColTrack: "@border",
            sliderColFill: "@accent",
            sliderColThumb: "@thumb",
            sliderColVal: "@text",

            defaultSliderTrackThick: 36,
            defaultSliderFillThick: 24,
            defaultSliderThumbSz: 29,
            defaultSliderThumbShadow: true,

            defaultSliderShowVal: true,
            defaultSliderValueLocation: "middle",
            defaultSliderLabelLocation: "top",
            defaultSliderValOffX: 0,
            defaultSliderValOffY: 0,
            defaultSliderValFs: 10,
            defaultSliderValAlign: "center",
            defaultSliderValFam: "'Inter', sans-serif",
            defaultSliderValFamBold: false,

            defaultSliderLabelOffX: 0,
            defaultSliderLabelOffY: 0,

            defaultSliderVertical: false,
            defaultSliderAllowDecimals: false,
            defaultSliderStepSize: 0.1,

            defaultSliderCustomDisplayRange: false,
            defaultSliderDisplayMin: 0,
            defaultSliderDisplayMax: 100,
            defaultSliderDisplayDecimalPlaces: 1,
            defaultSliderDisplayKeepTrailingZeros: false,

            defaultSliderUnitFs: 20,
            defaultSliderUnitCol: "@textMuted",
            defaultSliderUnitBold: false,
            defaultSliderUnitItalic: false,
            defaultSliderUnitOpacity: 100,

            defaultSliderTrackOutlineWidth: 0,
            defaultSliderTrackOutlineColor: "@accent",
            defaultSliderTrackOpacity: 100,
            defaultSliderTrackOutlineOpacity: 100,
            defaultSliderTrackBlur: 0,
            defaultSliderTrackInnerGlow: 0,
            defaultSliderTrackInnerGlowColor: "@accent",
            defaultSliderTrackInnerGlowOpacity: 100,
            defaultSliderFillOpacity: 100,
            defaultSliderFillOutlineWidth: 0,
            defaultSliderFillOutlineColor: "@thumb",
            defaultSliderFillOutlineOpacity: 100,
            defaultSliderFillInnerGlow: 0,
            defaultSliderFillInnerGlowColor: "@thumb",
            defaultSliderFillInnerGlowOpacity: 100,
            defaultSliderThumbOutlineWidth: 0,
            defaultSliderThumbOutlineColor: "@accent",
            defaultSliderThumbOutlineOpacity: 100,
            defaultSliderThumbInnerGlow: 0,
            defaultSliderThumbInnerGlowColor: "@accent",
            defaultSliderThumbInnerGlowOpacity: 100
        };
    }

    static get basicSettingKeys() {
        return [
            { key: 'value', cols: 4 },
            { key: 'min', cols: 4 },
            { key: 'max', cols: 4 },
            'unit', 'outputTopic', 'sendValueMode', 'allowDecimals', 'stepSize'
        ];
    }

    static get globalSchema() {
        return [
            { key: 'defaultSliderVertical', type: 'checkbox', label: 'Vertical Mode', cols: 12 },
            { key: 'defaultSliderAllowDecimals', type: 'checkbox', label: 'Allow Fractions', cols: 12 },
            (() => {
                const stepField = {
                    key: 'defaultSliderStepSize', type: 'number', step: 0.01, label: 'Fraction Step', cols: 12,
                    dependsOn: ['defaultSliderAllowDecimals']
                };
                SliderWidget.attachSliderFractionStepVisibility(stepField);
                return stepField;
            })(),
            {
                key: 'defaultSliderCustomDisplayRange', type: 'checkbox', label: 'Custom display range', cols: 12
            },
            {
                key: 'defaultSliderDisplayMin', type: 'number', label: 'Display minimum', cols: 6,
                dependsOn: ['defaultSliderCustomDisplayRange'],
                visibleWhen: (v) => v.defaultSliderCustomDisplayRange === true
            },
            {
                key: 'defaultSliderDisplayMax', type: 'number', label: 'Display maximum', cols: 6,
                dependsOn: ['defaultSliderCustomDisplayRange'],
                visibleWhen: (v) => v.defaultSliderCustomDisplayRange === true
            },
            {
                key: 'defaultSliderDisplayDecimalPlaces', type: 'number', label: 'Decimal Places', cols: 6,
                dependsOn: ['defaultSliderCustomDisplayRange'],
                visibleWhen: (v) => v.defaultSliderCustomDisplayRange === true
            },
            {
                key: 'defaultSliderDisplayKeepTrailingZeros', type: 'checkbox', label: 'Keep Trailing Zeros', cols: 6,
                dependsOn: ['defaultSliderCustomDisplayRange'],
                visibleWhen: (v) => v.defaultSliderCustomDisplayRange === true
            },

            { type: 'heading', label: 'Track', cols: 12 },
            { key: 'defaultSliderTrackThick', type: 'number', label: 'Track Height', cols: 12 },
            { key: 'sliderColTrack', type: 'color', label: 'Track Color', cols: 4, gridColStart: 1 },
            { key: 'defaultSliderTrackOpacity', type: 'number', label: 'Track Opacity', cols: 4, min: 0, max: 100 },
            { key: 'defaultSliderTrackBlur', type: 'number', label: 'Track Background Blur', cols: 4, min: 0 },
            { key: 'defaultSliderTrackOutlineWidth', type: 'number', label: 'Track Outline Width', cols: 4, gridColStart: 1 },
            {
                key: 'defaultSliderTrackOutlineColor', type: 'color', label: 'Track Outline Color', cols: 4,
                dependsOn: ['defaultSliderTrackOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('defaultSliderTrackOutlineWidth')
            },
            {
                key: 'defaultSliderTrackOutlineOpacity', type: 'number', label: 'Track Outline Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['defaultSliderTrackOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('defaultSliderTrackOutlineWidth')
            },
            { key: 'defaultSliderTrackInnerGlow', type: 'number', label: 'Track Inner Glow', cols: 4, min: 0, gridColStart: 1 },
            {
                key: 'defaultSliderTrackInnerGlowColor', type: 'color', label: 'Track Inner Glow Color', cols: 4,
                dependsOn: ['defaultSliderTrackInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('defaultSliderTrackInnerGlow')
            },
            {
                key: 'defaultSliderTrackInnerGlowOpacity', type: 'number', label: 'Track Inner Glow Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['defaultSliderTrackInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('defaultSliderTrackInnerGlow')
            },

            { type: 'heading', label: 'Fill', cols: 12 },
            { key: 'defaultSliderFillThick', type: 'number', label: 'Fill Height', cols: 12 },
            { key: 'sliderColFill', type: 'color', label: 'Fill Color', cols: 6, gridColStart: 1 },
            { key: 'defaultSliderFillOpacity', type: 'number', label: 'Fill Opacity', cols: 6, min: 0, max: 100 },
            { key: 'defaultSliderFillOutlineWidth', type: 'number', label: 'Fill Outline Width', cols: 4, min: 0, gridColStart: 1 },
            {
                key: 'defaultSliderFillOutlineColor', type: 'color', label: 'Fill Outline Color', cols: 4,
                dependsOn: ['defaultSliderFillOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('defaultSliderFillOutlineWidth')
            },
            {
                key: 'defaultSliderFillOutlineOpacity', type: 'number', label: 'Fill Outline Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['defaultSliderFillOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('defaultSliderFillOutlineWidth')
            },
            { key: 'defaultSliderFillInnerGlow', type: 'number', label: 'Fill Inner Glow', cols: 4, min: 0, gridColStart: 1 },
            {
                key: 'defaultSliderFillInnerGlowColor', type: 'color', label: 'Fill Inner Glow Color', cols: 4,
                dependsOn: ['defaultSliderFillInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('defaultSliderFillInnerGlow')
            },
            {
                key: 'defaultSliderFillInnerGlowOpacity', type: 'number', label: 'Fill Inner Glow Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['defaultSliderFillInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('defaultSliderFillInnerGlow')
            },

            { type: 'heading', label: 'Thumb', cols: 12 },
            { key: 'defaultSliderThumbSz', type: 'number', label: 'Thumb Size', cols: 12 },
            { key: 'sliderColThumb', type: 'color', label: 'Thumb Color', cols: 12 },
            { key: 'defaultSliderThumbShadow', type: 'checkbox', label: 'Thumb Shadow', cols: 12 },
            { key: 'defaultSliderThumbOutlineWidth', type: 'number', label: 'Thumb Outline Width', cols: 4, min: 0, gridColStart: 1 },
            {
                key: 'defaultSliderThumbOutlineColor', type: 'color', label: 'Thumb Outline Color', cols: 4,
                dependsOn: ['defaultSliderThumbOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('defaultSliderThumbOutlineWidth')
            },
            {
                key: 'defaultSliderThumbOutlineOpacity', type: 'number', label: 'Thumb Outline Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['defaultSliderThumbOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('defaultSliderThumbOutlineWidth')
            },
            { key: 'defaultSliderThumbInnerGlow', type: 'number', label: 'Thumb Inner Glow', cols: 4, min: 0, gridColStart: 1 },
            {
                key: 'defaultSliderThumbInnerGlowColor', type: 'color', label: 'Thumb Inner Glow Color', cols: 4,
                dependsOn: ['defaultSliderThumbInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('defaultSliderThumbInnerGlow')
            },
            {
                key: 'defaultSliderThumbInnerGlowOpacity', type: 'number', label: 'Thumb Inner Glow Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['defaultSliderThumbInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('defaultSliderThumbInnerGlow')
            },

            { type: 'heading', label: 'Text & Typography', cols: 12 },
            { key: 'defaultSliderShowVal', type: 'checkbox', label: 'Show Value', cols: 12 },
            (() => {
                const locField = {
                    key: 'defaultSliderValueLocation', type: 'select', label: 'Value Location', cols: 12,
                    options: SliderWidget.VALUE_LOCATION_OPTIONS
                };
                SliderWidget.attachSliderValueSectionVisibility(locField);
                return locField;
            })(),
            BaseWidget.getWidgetLabelTypographySchema('defaultSliderWidgetLabel', 'widgetLabel'),
            BaseWidget.getTypographySchema('defaultSliderCaption', 'Slider Label', {
                exclude: ['align', 'opacity', 'italic'],
                fontDefaultKey: 'fontFamily',
                fontSizeDefaultKey: 'defaultFsLabel',
                colorDefaultKey: 'defaultColLabel',
                caseDefaultKey: 'defaultLabelCase',
                boldDefaultKey: 'defaultLabelBold',
                offXDefaultKey: 'defaultSliderLabelOffX',
                offYDefaultKey: 'defaultSliderLabelOffY'
            }),
            {
                key: 'defaultSliderLabelLocation', type: 'select', label: 'Slider Label Location', cols: 12,
                options: SliderWidget.LABEL_LOCATION_OPTIONS
            },
            (() => {
                const valueTypoMaster = BaseWidget.getTypographySchema('defaultSliderValue', 'Value', {
                    exclude: ['case', 'opacity', 'italic'],
                    fontDefaultKey: 'defaultSliderValFam',
                    fontSizeDefaultKey: 'defaultSliderValFs',
                    colorDefaultKey: 'sliderColVal',
                    alignDefaultKey: 'defaultSliderValAlign',
                    boldDefaultKey: 'defaultSliderValFamBold',
                    offXDefaultKey: 'defaultSliderValOffX',
                    offYDefaultKey: 'defaultSliderValOffY'
                });
                SliderWidget.attachSliderValueSectionVisibility(valueTypoMaster);
                return valueTypoMaster;
            })(),
            BaseWidget.getTypographySchema('defaultSliderUnit', 'Unit', {
                exclude: ['align', 'case', 'offset'],
                fontDefaultKey: 'fontFamily',
                fontSizeDefaultKey: 'defaultSliderUnitFs',
                colorDefaultKey: 'defaultSliderUnitCol',
                boldDefaultKey: 'defaultSliderUnitBold',
                italicDefaultKey: 'defaultSliderUnitItalic',
                opacityDefaultKey: 'defaultSliderUnitOpacity'
            })
        ];
    }

    static get AUDIO_TRIGGERS() {
        return [
            { key: 'valueSent', label: 'On Value Sent' }
        ];
    }

    getDefaultOverrides() {
        return {
            value: 50,
            min: 0,
            max: 100,

            allowDecimals: null,
            stepSize: null,
            sendValueMode: 'release',

            vertical: null,
            showVal: true,
            valueLocation: null,
            labelLocation: null,

            outputTopic: "",
            widgetLabel: "",
            label: "",
            unit: "",

            customDisplayRange: null,
            displayMin: null,
            displayMax: null,
            displayDecimalPlaces: null,
            displayKeepTrailingZeros: null,

            trackOutlineWidth: null,
            trackOutlineColor: null,
            colThumb: null,
            thumbShadow: null,

            typography: { widgetLabel: {}, caption: {}, value: {}, unit: {} },
            audio: (typeof DashboardAudio !== 'undefined' && DashboardAudio.defaultAudio)
                ? DashboardAudio.defaultAudio(SliderWidget.AUDIO_TRIGGERS)
                : { valueSent: '' }
        };
    }

    constructor(cid, id, ov, bn) {
        super(cid, id, ov, bn);
        this.lastInteraction = 0;
        this._sliderValueWidthCache = null;
    }

    get config() {
        const c = super.config;
        let finalValue = c.value;
        if (this.bindings && this.bindings.value && this._optimisticValue !== undefined) {
            finalValue = this._optimisticValue;
        } else if (this.lastInteraction && (Date.now() - this.lastInteraction < 1000)) {
            if (this.overrides.value !== undefined) {
                finalValue = this.overrides.value;
            }
        }

        const min = BaseWidget.toFiniteNumber(c.min, 0);
        const max = BaseWidget.toFiniteNumber(c.max, 100);
        const value = BaseWidget.toFiniteNumber(finalValue, 0);
        const trackThickness = BaseWidget.clampNumber(__nullish(c.trackThickness, __nullish(c.defaultSliderTrackThick, 24)), 0, null);
        const fillThickness = BaseWidget.clampNumber(__nullish(c.fillThickness, __nullish(c.defaultSliderFillThick, 24)), 0, null);
        const thumbSize = BaseWidget.clampNumber(__nullish(c.thumbSize, __nullish(c.defaultSliderThumbSz, 20)), 1, null);
        const trackOutlineWidth = BaseWidget.clampNumber(c.trackOutlineWidth !== undefined && c.trackOutlineWidth !== null ? c.trackOutlineWidth : (c.defaultSliderTrackOutlineWidth || 0), 0, null);
        const rawStep = BaseWidget.toFiniteNumber(c.stepSize !== undefined && c.stepSize !== null ? c.stepSize : (c.defaultSliderStepSize || 0.1), 0.1);
        const stepSize = rawStep <= 0 ? 0.1 : rawStep;

        SliderWidget.applyTypographyNestedToConfig(c);
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        SliderWidget.fillSliderTypographyResolved(c, M);
        BaseWidget.applyNestedBindingOverlay(this, c, SliderWidget.getNestedBindingOverlaySpec());

        const out = {
            ...c,
            min: min,
            max: max,
            value: value,

            colTrack: c.colTrack || c.trackColor || c.sliderColTrack,
            colFill: c.colFill || c.fillColor || c.sliderColFill,
            colThumb: c.colThumb || c.thumbColor || c.sliderColThumb,

            trackThickness: trackThickness,
            fillThickness: fillThickness,
            thumbSize: thumbSize,
            thumbShadow: c.thumbShadow !== undefined && c.thumbShadow !== null ? c.thumbShadow : c.defaultSliderThumbShadow,

            trackOutlineWidth: trackOutlineWidth,
            trackOutlineColor: c.trackOutlineColor || c.defaultSliderTrackOutlineColor || '@accent',
            trackOutlineOpacity: c.trackOutlineOpacity !== undefined && c.trackOutlineOpacity !== null ? c.trackOutlineOpacity : (c.defaultSliderTrackOutlineOpacity !== undefined && c.defaultSliderTrackOutlineOpacity !== null ? c.defaultSliderTrackOutlineOpacity : 100),
            trackOpacity: c.trackOpacity !== undefined && c.trackOpacity !== null ? c.trackOpacity : (c.defaultSliderTrackOpacity !== undefined && c.defaultSliderTrackOpacity !== null ? c.defaultSliderTrackOpacity : 100),
            trackBlur: c.trackBlur !== undefined && c.trackBlur !== null ? c.trackBlur : (c.defaultSliderTrackBlur || 0),
            trackInnerGlow: c.trackInnerGlow !== undefined && c.trackInnerGlow !== null ? c.trackInnerGlow : (c.defaultSliderTrackInnerGlow || 0),
            trackInnerGlowColor: c.trackInnerGlowColor || c.defaultSliderTrackInnerGlowColor || '@accent',
            trackInnerGlowOpacity: c.trackInnerGlowOpacity !== undefined && c.trackInnerGlowOpacity !== null ? c.trackInnerGlowOpacity : (c.defaultSliderTrackInnerGlowOpacity !== undefined && c.defaultSliderTrackInnerGlowOpacity !== null ? c.defaultSliderTrackInnerGlowOpacity : 100),
            fillOpacity: c.fillOpacity !== undefined && c.fillOpacity !== null ? c.fillOpacity : (c.defaultSliderFillOpacity !== undefined && c.defaultSliderFillOpacity !== null ? c.defaultSliderFillOpacity : 100),
            fillOutlineWidth: c.fillOutlineWidth !== undefined && c.fillOutlineWidth !== null ? c.fillOutlineWidth : (c.defaultSliderFillOutlineWidth || 0),
            fillOutlineColor: c.fillOutlineColor || c.defaultSliderFillOutlineColor || '@thumb',
            fillOutlineOpacity: c.fillOutlineOpacity !== undefined && c.fillOutlineOpacity !== null ? c.fillOutlineOpacity : (c.defaultSliderFillOutlineOpacity !== undefined && c.defaultSliderFillOutlineOpacity !== null ? c.defaultSliderFillOutlineOpacity : 100),
            fillInnerGlow: c.fillInnerGlow !== undefined && c.fillInnerGlow !== null ? c.fillInnerGlow : (c.defaultSliderFillInnerGlow || 0),
            fillInnerGlowColor: c.fillInnerGlowColor || c.defaultSliderFillInnerGlowColor || '@thumb',
            fillInnerGlowOpacity: c.fillInnerGlowOpacity !== undefined && c.fillInnerGlowOpacity !== null ? c.fillInnerGlowOpacity : (c.defaultSliderFillInnerGlowOpacity !== undefined && c.defaultSliderFillInnerGlowOpacity !== null ? c.defaultSliderFillInnerGlowOpacity : 100),
            thumbOutlineWidth: c.thumbOutlineWidth !== undefined && c.thumbOutlineWidth !== null ? c.thumbOutlineWidth : (c.defaultSliderThumbOutlineWidth || 0),
            thumbOutlineColor: c.thumbOutlineColor || c.defaultSliderThumbOutlineColor || '@accent',
            thumbOutlineOpacity: c.thumbOutlineOpacity !== undefined && c.thumbOutlineOpacity !== null ? c.thumbOutlineOpacity : (c.defaultSliderThumbOutlineOpacity !== undefined && c.defaultSliderThumbOutlineOpacity !== null ? c.defaultSliderThumbOutlineOpacity : 100),
            thumbInnerGlow: c.thumbInnerGlow !== undefined && c.thumbInnerGlow !== null ? c.thumbInnerGlow : (c.defaultSliderThumbInnerGlow || 0),
            thumbInnerGlowColor: c.thumbInnerGlowColor || c.defaultSliderThumbInnerGlowColor || '@accent',
            thumbInnerGlowOpacity: c.thumbInnerGlowOpacity !== undefined && c.thumbInnerGlowOpacity !== null ? c.thumbInnerGlowOpacity : (c.defaultSliderThumbInnerGlowOpacity !== undefined && c.defaultSliderThumbInnerGlowOpacity !== null ? c.defaultSliderThumbInnerGlowOpacity : 100),

            vertical: c.vertical !== undefined && c.vertical !== null ? c.vertical : c.defaultSliderVertical,

            allowDecimals: c.allowDecimals !== undefined && c.allowDecimals !== null ? c.allowDecimals : c.defaultSliderAllowDecimals,
            stepSize: stepSize,

            showVal: c.showVal !== undefined && c.showVal !== null ? c.showVal : c.defaultSliderShowVal,
            valueLocation: SliderWidget.normalizeValueLocation(
                __nullish(c.valueLocation, c.defaultSliderValueLocation)
            ),
            labelLocation: SliderWidget.normalizeLabelLocation(
                __nullish(c.labelLocation, c.defaultSliderLabelLocation)
            ),

            widgetLabel: c.widgetLabel != null ? String(c.widgetLabel) : '',
            unit: c.unit != null ? String(c.unit) : '',
            customDisplayRange: !!__nullish(c.customDisplayRange, __nullish(c.defaultSliderCustomDisplayRange, false)),
            displayMin: BaseWidget.toFiniteNumber(
                __nullish(c.displayMin, __nullish(c.defaultSliderDisplayMin, 0)),
                0
            ),
            displayMax: BaseWidget.toFiniteNumber(
                __nullish(c.displayMax, __nullish(c.defaultSliderDisplayMax, 100)),
                100
            ),
            displayDecimalPlaces: Math.max(0, Math.floor(BaseWidget.toFiniteNumber(
                __nullish(c.displayDecimalPlaces, __nullish(c.defaultSliderDisplayDecimalPlaces, 1)),
                1
            ))),
            displayKeepTrailingZeros: !!__nullish(
                c.displayKeepTrailingZeros,
                __nullish(c.defaultSliderDisplayKeepTrailingZeros, false)
            )
        };

        [
            'labelFont', 'labelFs', 'labelCol', 'labelBold', 'labelCase', 'labelOffX', 'labelOffY',
            'valFs', 'valFam', 'valFamBold', 'valAlign', 'colVal', 'valOffX', 'valOffY'
        ].forEach((k) => { delete out[k]; });
        delete out.typography;

        return out;
    }

    getSchema() {
        const widgetLabelTypo = BaseWidget.getWidgetLabelTypographySchema('sliderWidgetLabel', 'widgetLabel');
        const captionTypo = BaseWidget.getTypographySchema('sliderCaption', 'Slider Label', {
            exclude: ['align'],
            nestedTypography: { root: 'typography', role: 'caption' },
            fontDefaultKey: 'fontFamily',
            fontSizeDefaultKey: 'defaultFsLabel',
            colorDefaultKey: 'defaultColLabel',
            caseDefaultKey: 'defaultLabelCase',
            boldDefaultKey: 'defaultLabelBold',
            offXDefaultKey: 'defaultSliderLabelOffX',
            offYDefaultKey: 'defaultSliderLabelOffY'
        });
        const valueTypo = BaseWidget.getTypographySchema('sliderValue', 'Value', {
            exclude: ['case'],
            nestedTypography: { root: 'typography', role: 'value' },
            fontDefaultKey: 'defaultSliderValFam',
            fontSizeDefaultKey: 'defaultSliderValFs',
            colorDefaultKey: 'sliderColVal',
            alignDefaultKey: 'defaultSliderValAlign',
            boldDefaultKey: 'defaultSliderValFamBold',
            offXDefaultKey: 'defaultSliderValOffX',
            offYDefaultKey: 'defaultSliderValOffY'
        });
        SliderWidget.attachSliderValueSectionVisibility(valueTypo);
        const unitTypo = BaseWidget.getTypographySchema('sliderUnit', 'Unit', {
            exclude: ['align', 'case', 'offset'],
            nestedTypography: { root: 'typography', role: 'unit' },
            fontDefaultKeyFallback: 'fontFamily',
            fontSizeDefaultKey: 'defaultSliderUnitFs',
            colorDefaultKey: 'defaultSliderUnitCol',
            boldDefaultKey: 'defaultSliderUnitBold',
            italicDefaultKey: 'defaultSliderUnitItalic',
            opacityDefaultKey: 'defaultSliderUnitOpacity'
        });
        SliderWidget.attachSliderValueSectionVisibility(unitTypo);
        const unitTextField = { key: 'unit', type: 'text', label: 'Unit Text', cols: 12 };
        SliderWidget.attachSliderValueSectionVisibility(unitTextField);
        const valueLocationField = {
            key: 'valueLocation', type: 'select', label: 'Value Location', cols: 12,
            defaultKey: 'defaultSliderValueLocation',
            options: SliderWidget.VALUE_LOCATION_OPTIONS
        };
        SliderWidget.attachSliderValueSectionVisibility(valueLocationField);

        const fractionStepField = {
            key: 'stepSize', type: 'number', step: 0.01, label: 'Fraction Step', cols: 6,
            defaultKey: 'defaultSliderStepSize',
            dependsOn: ['allowDecimals', 'defaultSliderAllowDecimals']
        };
        SliderWidget.attachSliderFractionStepVisibility(fractionStepField);

        return [
            {
                id: 'sl_data', title: 'Data Configuration', icon: 'ph-database',
                fields: [
                    { key: 'value', type: 'number', label: 'Value', cols: 6 },
                    {
                        key: 'sendValueMode', type: 'select', label: 'Send Value', cols: 6,
                        options: [
                            { value: 'release', text: 'Send value on release' },
                            { value: 'movement', text: 'Send value directly on movement' }
                        ]
                    },
                    { key: 'outputTopic', type: 'topic', label: 'Output Topic', cols: 12 },
                    { key: 'min', type: 'number', label: 'Min', cols: 6 },
                    { key: 'max', type: 'number', label: 'Max', cols: 6 },

                    { key: 'allowDecimals', type: 'checkbox', label: 'Fractions', cols: 6, defaultKey: 'defaultSliderAllowDecimals' },
                    fractionStepField,
                    {
                        key: 'customDisplayRange', type: 'checkbox', label: 'Custom display range', cols: 12,
                        defaultKey: 'defaultSliderCustomDisplayRange'
                    },
                    {
                        key: 'displayMin', type: 'number', label: 'Display minimum', cols: 6,
                        defaultKey: 'defaultSliderDisplayMin',
                        dependsOn: ['customDisplayRange', 'defaultSliderCustomDisplayRange'],
                        visibleWhen: (v) => v.customDisplayRange === true
                    },
                    {
                        key: 'displayMax', type: 'number', label: 'Display maximum', cols: 6,
                        defaultKey: 'defaultSliderDisplayMax',
                        dependsOn: ['customDisplayRange', 'defaultSliderCustomDisplayRange'],
                        visibleWhen: (v) => v.customDisplayRange === true
                    },
                    {
                        key: 'displayDecimalPlaces', type: 'number', label: 'Decimal Places', cols: 6,
                        defaultKey: 'defaultSliderDisplayDecimalPlaces',
                        dependsOn: ['customDisplayRange', 'defaultSliderCustomDisplayRange'],
                        visibleWhen: (v) => v.customDisplayRange === true
                    },
                    {
                        key: 'displayKeepTrailingZeros', type: 'checkbox', label: 'Keep Trailing Zeros', cols: 6,
                        defaultKey: 'defaultSliderDisplayKeepTrailingZeros',
                        dependsOn: ['customDisplayRange', 'defaultSliderCustomDisplayRange'],
                        visibleWhen: (v) => v.customDisplayRange === true
                    }
                ]
            },
            (typeof DashboardAudio !== 'undefined' && DashboardAudio.schemaGroup)
                ? DashboardAudio.schemaGroup('sl_audio', SliderWidget.AUDIO_TRIGGERS)
                : {
                    id: 'sl_audio', title: 'Audio', icon: 'ph-music-notes',
                    fields: [{ key: 'audio', type: 'audio_trigger_map', cols: 12, triggers: SliderWidget.AUDIO_TRIGGERS }]
                },
            {
                id: 'sl_style', title: 'Appearance', icon: 'ph-palette',
                fields: [
                    { key: 'vertical', type: 'checkbox', label: 'Vertical', cols: 12, defaultKey: 'defaultSliderVertical' },

                    { type: 'heading', label: 'Track', cols: 12 },
                    { key: 'trackThickness', type: 'number', label: 'Track Height', cols: 3, defaultKey: 'defaultSliderTrackThick' },
                    { key: 'trackColor', type: 'color', label: 'Track Color', cols: 3, defaultKey: 'sliderColTrack' },
                    { key: 'trackOpacity', type: 'number', min: 0, max: 100, label: 'Track Opacity', cols: 3, defaultKey: 'defaultSliderTrackOpacity' },
                    { key: 'trackBlur', type: 'number', min: 0, label: 'Background Blur', cols: 3, defaultKey: 'defaultSliderTrackBlur' },
                    { key: 'trackOutlineWidth', type: 'number', label: 'Track Outline Width', cols: 4, gridColStart: 1, defaultKey: 'defaultSliderTrackOutlineWidth' },
                    {
                        key: 'trackOutlineColor', type: 'color', label: 'Track Outline Color', cols: 4, defaultKey: 'defaultSliderTrackOutlineColor',
                        dependsOn: ['trackOutlineWidth', 'defaultSliderTrackOutlineWidth'],
                        visibleWhen: (values) => SliderWidget.trackOutlineDetailsVisible(values, false)
                    },
                    {
                        key: 'trackOutlineOpacity', type: 'number', min: 0, max: 100, label: 'Track Outline Opacity', cols: 4, defaultKey: 'defaultSliderTrackOutlineOpacity',
                        dependsOn: ['trackOutlineWidth', 'defaultSliderTrackOutlineWidth'],
                        visibleWhen: (values) => SliderWidget.trackOutlineDetailsVisible(values, false)
                    },
                    { key: 'trackInnerGlow', type: 'number', min: 0, label: 'Track Inner Glow', cols: 4, gridColStart: 1, defaultKey: 'defaultSliderTrackInnerGlow' },
                    {
                        key: 'trackInnerGlowColor', type: 'color', label: 'Track Inner Glow Color', cols: 4, defaultKey: 'defaultSliderTrackInnerGlowColor',
                        dependsOn: ['trackInnerGlow', 'defaultSliderTrackInnerGlow'],
                        visibleWhen: (values) => SliderWidget.trackInnerGlowDetailsVisible(values, false)
                    },
                    {
                        key: 'trackInnerGlowOpacity', type: 'number', min: 0, max: 100, label: 'Track Inner Glow Opacity', cols: 4, defaultKey: 'defaultSliderTrackInnerGlowOpacity',
                        dependsOn: ['trackInnerGlow', 'defaultSliderTrackInnerGlow'],
                        visibleWhen: (values) => SliderWidget.trackInnerGlowDetailsVisible(values, false)
                    },

                    { type: 'heading', label: 'Fill', cols: 12 },
                    { key: 'fillThickness', type: 'number', label: 'Fill Height', cols: 4, defaultKey: 'defaultSliderFillThick' },
                    { key: 'fillColor', type: 'color', label: 'Fill Color', cols: 4, defaultKey: 'sliderColFill' },
                    { key: 'fillOpacity', type: 'number', min: 0, max: 100, label: 'Fill Opacity', cols: 4, defaultKey: 'defaultSliderFillOpacity' },
                    { key: 'fillOutlineWidth', type: 'number', min: 0, label: 'Fill Outline Width', cols: 4, gridColStart: 1, defaultKey: 'defaultSliderFillOutlineWidth' },
                    {
                        key: 'fillOutlineColor', type: 'color', label: 'Fill Outline Color', cols: 4, defaultKey: 'defaultSliderFillOutlineColor',
                        dependsOn: ['fillOutlineWidth', 'defaultSliderFillOutlineWidth'],
                        visibleWhen: (values) => SliderWidget.fillOutlineDetailsVisible(values, false)
                    },
                    {
                        key: 'fillOutlineOpacity', type: 'number', min: 0, max: 100, label: 'Fill Outline Opacity', cols: 4, defaultKey: 'defaultSliderFillOutlineOpacity',
                        dependsOn: ['fillOutlineWidth', 'defaultSliderFillOutlineWidth'],
                        visibleWhen: (values) => SliderWidget.fillOutlineDetailsVisible(values, false)
                    },
                    { key: 'fillInnerGlow', type: 'number', min: 0, label: 'Fill Inner Glow', cols: 4, gridColStart: 1, defaultKey: 'defaultSliderFillInnerGlow' },
                    {
                        key: 'fillInnerGlowColor', type: 'color', label: 'Fill Inner Glow Color', cols: 4, defaultKey: 'defaultSliderFillInnerGlowColor',
                        dependsOn: ['fillInnerGlow', 'defaultSliderFillInnerGlow'],
                        visibleWhen: (values) => SliderWidget.fillInnerGlowDetailsVisible(values, false)
                    },
                    {
                        key: 'fillInnerGlowOpacity', type: 'number', min: 0, max: 100, label: 'Fill Inner Glow Opacity', cols: 4, defaultKey: 'defaultSliderFillInnerGlowOpacity',
                        dependsOn: ['fillInnerGlow', 'defaultSliderFillInnerGlow'],
                        visibleWhen: (values) => SliderWidget.fillInnerGlowDetailsVisible(values, false)
                    },

                    { type: 'heading', label: 'Thumb', cols: 12 },
                    { key: 'thumbSize', type: 'number', label: 'Thumb Size', cols: 4, defaultKey: 'defaultSliderThumbSz' },
                    { key: 'thumbColor', type: 'color', label: 'Thumb Color', cols: 4, defaultKey: 'sliderColThumb' },
                    { key: 'thumbShadow', type: 'checkbox', label: 'Thumb Shadow', cols: 4, defaultKey: 'defaultSliderThumbShadow' },
                    { key: 'thumbOutlineWidth', type: 'number', min: 0, label: 'Thumb Outline Width', cols: 4, gridColStart: 1, defaultKey: 'defaultSliderThumbOutlineWidth' },
                    {
                        key: 'thumbOutlineColor', type: 'color', label: 'Thumb Outline Color', cols: 4, defaultKey: 'defaultSliderThumbOutlineColor',
                        dependsOn: ['thumbOutlineWidth', 'defaultSliderThumbOutlineWidth'],
                        visibleWhen: (values) => SliderWidget.thumbOutlineDetailsVisible(values, false)
                    },
                    {
                        key: 'thumbOutlineOpacity', type: 'number', min: 0, max: 100, label: 'Thumb Outline Opacity', cols: 4, defaultKey: 'defaultSliderThumbOutlineOpacity',
                        dependsOn: ['thumbOutlineWidth', 'defaultSliderThumbOutlineWidth'],
                        visibleWhen: (values) => SliderWidget.thumbOutlineDetailsVisible(values, false)
                    },
                    { key: 'thumbInnerGlow', type: 'number', min: 0, label: 'Thumb Inner Glow', cols: 4, gridColStart: 1, defaultKey: 'defaultSliderThumbInnerGlow' },
                    {
                        key: 'thumbInnerGlowColor', type: 'color', label: 'Thumb Inner Glow Color', cols: 4, defaultKey: 'defaultSliderThumbInnerGlowColor',
                        dependsOn: ['thumbInnerGlow', 'defaultSliderThumbInnerGlow'],
                        visibleWhen: (values) => SliderWidget.thumbInnerGlowDetailsVisible(values, false)
                    },
                    {
                        key: 'thumbInnerGlowOpacity', type: 'number', min: 0, max: 100, label: 'Thumb Inner Glow Opacity', cols: 4, defaultKey: 'defaultSliderThumbInnerGlowOpacity',
                        dependsOn: ['thumbInnerGlow', 'defaultSliderThumbInnerGlow'],
                        visibleWhen: (values) => SliderWidget.thumbInnerGlowDetailsVisible(values, false)
                    },
                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }
                ]
            },
            {
                id: 'sl_typo', title: 'Text & Typography', icon: 'ph-text-t',
                fields: [
                    { key: 'widgetLabel', type: 'text', label: 'Widget Label', cols: 12 },
                    { key: 'label', type: 'text', label: 'Slider Label', cols: 12 },
                    (() => {
                        const locField = {
                            key: 'labelLocation', type: 'select', label: 'Slider Label Location', cols: 12,
                            defaultKey: 'defaultSliderLabelLocation',
                            options: SliderWidget.LABEL_LOCATION_OPTIONS
                        };
                        SliderWidget.attachSliderLabelLocationVisibility(locField);
                        return locField;
                    })(),
                    { key: 'showVal', type: 'checkbox', label: 'Show Value', cols: 12, defaultKey: 'defaultSliderShowVal' },
                    unitTextField,
                    valueLocationField,
                    widgetLabelTypo,
                    captionTypo,
                    valueTypo,
                    unitTypo
                ]
            }
        ];
    }

    _buildBaseDOM() {
        const b = super._buildBaseDOM();
        b.container.classList.add('interactive');
        b.innerContent.style.display = 'flex';
        b.innerContent.style.flexDirection = 'column';
        b.innerContent.style.alignItems = 'stretch';
        b.innerContent.style.justifyContent = 'center';

        const widgetLabelEl = document.createElement('div');
        BaseWidget.applyWidgetLabelElementChrome(widgetLabelEl);
        widgetLabelEl.style.display = 'none';
        b.innerContent.appendChild(widgetLabelEl);

        const sliderLayout = document.createElement('div');
        sliderLayout.className = 'sl-layout';
        sliderLayout.style.display = 'flex';
        sliderLayout.style.flexDirection = 'column';
        sliderLayout.style.alignItems = 'center';
        sliderLayout.style.justifyContent = 'center';
        sliderLayout.style.flex = '1 1 auto';
        sliderLayout.style.minHeight = '0';
        sliderLayout.style.width = '100%';

        const makeSlot = (side) => {
            const el = document.createElement('div');
            el.className = 'sl-slot sl-slot-' + side;
            el.style.display = 'none';
            el.style.flex = '0 0 auto';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.minWidth = '0';
            el.style.minHeight = '0';
            el.style.gap = '4px';
            return el;
        };

        const slotTop = makeSlot('top');
        slotTop.style.width = '100%';
        slotTop.style.flexDirection = 'column';
        const slotBottom = makeSlot('bottom');
        slotBottom.style.width = '100%';
        slotBottom.style.flexDirection = 'column';
        const slotLeft = makeSlot('left');
        slotLeft.style.flexDirection = 'row';
        const slotRight = makeSlot('right');
        slotRight.style.flexDirection = 'row';

        const lbl = document.createElement('div');
        lbl.className = 'sl-label';
        lbl.style.letterSpacing = '1px';
        lbl.style.textAlign = 'center';
        lbl.style.flexShrink = '0';
        slotTop.appendChild(lbl);
        slotTop.style.display = 'flex';

        const sliderBody = document.createElement('div');
        sliderBody.className = 'sl-body';
        sliderBody.style.display = 'flex';
        sliderBody.style.flexDirection = 'row';
        sliderBody.style.alignItems = 'center';
        sliderBody.style.justifyContent = 'center';
        sliderBody.style.flex = '1 1 auto';
        sliderBody.style.minHeight = '0';
        sliderBody.style.minWidth = '0';
        sliderBody.style.width = '100%';

        const trkWrap = document.createElement('div');
        trkWrap.className = 'trk-c';
        trkWrap.style.position = 'relative';
        trkWrap.style.cursor = 'pointer';
        trkWrap.style.flex = '0 0 auto';
        trkWrap.style.display = 'flex';
        trkWrap.style.alignItems = 'center';
        trkWrap.style.justifyContent = 'center';
        trkWrap.style.touchAction = 'none';
        sliderBody.appendChild(slotLeft);
        sliderBody.appendChild(trkWrap);
        sliderBody.appendChild(slotRight);
        sliderLayout.appendChild(slotTop);
        sliderLayout.appendChild(sliderBody);
        sliderLayout.appendChild(slotBottom);
        b.innerContent.appendChild(sliderLayout);

        trkWrap.innerHTML = `
            <div class="trk" style="border-radius:99px;background:#334155;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);box-sizing:content-box;"></div>
            <div class="fil" style="position:absolute;border-radius:99px;pointer-events:none;box-sizing:content-box;"></div>
            <div class="thb" style="position:absolute;border-radius:50%;background:white;transform:translate(-50%,-50%);box-shadow:0 2px 5px rgba(0,0,0,0.5);pointer-events:none;box-sizing:border-box;"></div>
            <div class="val" style="position:absolute;color:white;font-weight:bold;pointer-events:none;white-space:nowrap;">
                <span class="val-n"></span><span class="sl-unit" style="margin-left:2px;"></span>
            </div>`;
        this.e = {
            c: trkWrap,
            t: trkWrap.querySelector('.trk'),
            f: trkWrap.querySelector('.fil'),
            th: trkWrap.querySelector('.thb'),
            v: trkWrap.querySelector('.val'),
            vNum: trkWrap.querySelector('.val-n'),
            u: trkWrap.querySelector('.sl-unit'),
            widgetLabelEl: widgetLabelEl,
            layout: sliderLayout,
            body: sliderBody,
            slotTop: slotTop,
            slotBottom: slotBottom,
            slotLeft: slotLeft,
            slotRight: slotRight,
            lbl: lbl
        };

        let isDragging = false;
        let isHovering = false;
        let wheelDebounceSendTimer = null;
        let wheelDebounceSendValue = null;
        let lastSentMoveAt = 0;
        let lastSentMoveValue = null;
        const sendMoveThrottleMs = 100; // ~10 sends/sec
        const wheelStepMultiplier = 10; // Make mousewheel steps feel responsive

        const getClientXY = (e) => {
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        };

        const sendValue = (val, shouldLog = false) => {
            const outTopic = this.config.outputTopic || this.config.name || this.id;
            if (shouldLog) console.log(`[Slider] Sending: ${outTopic} = ${val}`);
            Dashboard.send(outTopic, val);
            if (typeof DashboardAudio !== 'undefined') {
                DashboardAudio.playFrom(this.config.audio, 'valueSent');
            }
        };

        let rafPending = false;
        let pendingMoveValue = null;

        const _applySliderValueUpdate = () => {
            rafPending = false;
            const newVal = pendingMoveValue;
            
            // Bypass full layout rebuild, only update necessary DOM via _renderSpecific
            this.overrides.value = newVal;
            this._renderSpecific();
            
            if (this.bindings.value) {
                this._optimisticValue = newVal;
            }

            const c = this.config;
            if (c.sendValueMode === 'movement') {
                const now = Date.now();
                const shouldSend = now - lastSentMoveAt >= sendMoveThrottleMs;
                if (shouldSend) {
                    lastSentMoveAt = now;
                    lastSentMoveValue = newVal;
                    sendValue(newVal);
                }
            }
        };

        const handleMove = (e) => {
            if (!isDragging || Dashboard.isEditMode) return;
            if (e.type === 'touchmove') e.preventDefault();

            this.lastInteraction = Date.now();
            const rect = this.e.c.getBoundingClientRect();
            const c = this.config;
            const coords = getClientXY(e);
            const outW = c.trackOutlineWidth || 0;
            const gap = Math.max(0, ((c.trackThickness + (outW * 2)) - c.fillThickness) / 2);
            const safePad = Math.max(c.thumbSize / 2, gap);
            const avail = c.vertical ? rect.height - 2 * safePad : rect.width - 2 * safePad;

            let pct;
            if (c.vertical) {
                const y = coords.y - rect.top;
                pct = (rect.height - safePad - y) / avail;
            } else {
                const x = coords.x - rect.left;
                pct = (x - safePad) / avail;
            }

            pct = Math.max(0, Math.min(1, pct));
            const rawVal = c.min + pct * (c.max - c.min);

            // Apply Step Snapping
            let step = c.allowDecimals ? c.stepSize : 1;
            if (step <= 0) step = 1;

            let newVal = Math.round(rawVal / step) * step;

            // Clean up JS floating point errors (e.g., 1.0000000001)
            const decimals = c.allowDecimals ? (String(step).split('.')[1] || '').length : 0;
            newVal = parseFloat(newVal.toFixed(decimals));

            const minBound = Math.min(c.min, c.max);
            const maxBound = Math.max(c.min, c.max);
            newVal = Math.max(minBound, Math.min(maxBound, newVal));

            pendingMoveValue = newVal;
            if (!rafPending) {
                rafPending = true;
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(_applySliderValueUpdate);
                } else {
                    _applySliderValueUpdate();
                }
            }
        };

        const handleUp = (e) => {
            if (isDragging) {
                isDragging = false;
                this.lastInteraction = Date.now();
                if (this._activeDragCleanup) {
                    this._activeDragCleanup();
                } else {
                    document.removeEventListener('mousemove', handleMove);
                    document.removeEventListener('mouseup', handleUp);
                    document.removeEventListener('touchmove', handleMove);
                    document.removeEventListener('touchend', handleUp);
                }

                const c = this.config;
                const finalVal = c.value;
                if (c.sendValueMode === 'release') {
                    sendValue(finalVal, true);
                } else {
                    const now = Date.now();
                    const shouldSend = (
                        now - lastSentMoveAt >= sendMoveThrottleMs ||
                        lastSentMoveValue !== finalVal
                    );
                    if (shouldSend) {
                        lastSentMoveAt = now;
                        lastSentMoveValue = finalVal;
                        sendValue(finalVal);
                    }
                }
            }
        };

        const handleDown = (e) => {
            if (Dashboard.isEditMode || this.config.deactivated) return;
            if (e.type === 'touchstart') e.preventDefault();
            isDragging = true;
            handleMove(e);

            const removeDrag = () => {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleUp);
                this._activeDragCleanup = null;
            };
            this._activeDragCleanup = removeDrag;

            if (e.type === 'mousedown') {
                document.addEventListener('mousemove', handleMove);
                document.addEventListener('mouseup', handleUp, { once: true });
            } else {
                document.addEventListener('touchmove', handleMove, { passive: false });
                document.addEventListener('touchend', handleUp, { once: true });
            }
        };

        const handleWheel = (e) => {
            if (!isHovering || isDragging || Dashboard.isEditMode || this.config.deactivated) return;
            if (Math.abs(e.deltaY) < 0.01) return;
            e.preventDefault();

            const c = this.config;
            let step = c.allowDecimals ? c.stepSize : 1;
            if (step <= 0) step = 1;
            const dir = Math.sign(e.deltaY);
            if (!dir) return;

            const rawVal = Number(c.value) - (dir * step * wheelStepMultiplier);

            let newVal = rawVal;
            let snapped = false;
            if (step > 0) {
                newVal = Math.round(rawVal / step) * step;
                snapped = true;
            }

            const decimals = c.allowDecimals ? (String(step).split('.')[1] || '').length : 0;
            if (snapped) newVal = parseFloat(newVal.toFixed(decimals));

            const minBound = Math.min(c.min, c.max);
            const maxBound = Math.max(c.min, c.max);
            newVal = Math.max(minBound, Math.min(maxBound, newVal));

            if (wheelDebounceSendTimer) WorkerTimer.clearTimeout(wheelDebounceSendTimer);
            wheelDebounceSendValue = newVal;

            this.lastInteraction = Date.now();
            
            pendingMoveValue = newVal;
            if (!rafPending) {
                rafPending = true;
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(_applySliderValueUpdate);
                } else {
                    _applySliderValueUpdate();
                }
            }

            if (c.sendValueMode !== 'movement') {
                // WorkerTimer: release-mode wheel commit must fire even during cold-start throttling.
                wheelDebounceSendTimer = WorkerTimer.setTimeout(() => {
                    wheelDebounceSendTimer = null;
                    this._wheelDebounceSendTimer = null;
                    if (this.config.sendValueMode !== 'release') return;
                    sendValue(wheelDebounceSendValue);
                }, 250);
                this._wheelDebounceSendTimer = wheelDebounceSendTimer;
            }
        };

        this._resetWheelHover = () => { isHovering = false; };
        this.e.c.addEventListener('mouseenter', () => {
            if (this.config.deactivated) return;
            isHovering = true;
        });
        this.e.c.addEventListener('mouseleave', () => {
            isHovering = false;
        });
        this.e.c.addEventListener('mousedown', handleDown);
        this.e.c.addEventListener('touchstart', handleDown, { passive: false });
        this.e.c.addEventListener('wheel', handleWheel, { passive: false });

        return b;
    }

    _slotForLocation(location) {
        if (location === 'top') return this.e.slotTop;
        if (location === 'bottom') return this.e.slotBottom;
        if (location === 'left') return this.e.slotLeft;
        if (location === 'right') return this.e.slotRight;
        return null;
    }

    _styleSliderSlot(slot, location) {
        if (!slot) return;
        let visibleCount = 0;
        for (let i = 0; i < slot.children.length; i++) {
            if (slot.children[i].style.display !== 'none') visibleCount += 1;
        }
        const isRow = location === 'left' || location === 'right';
        slot.style.display = visibleCount ? 'flex' : 'none';
        slot.style.flexDirection = isRow ? 'row' : 'column';
        slot.style.alignItems = 'center';
        slot.style.justifyContent = 'center';
        slot.style.gap = visibleCount > 1 ? '4px' : '0px';
        if (isRow) {
            slot.style.width = '';
        } else {
            slot.style.width = '100%';
        }
    }

    _placeSliderValueElement(location) {
        const val = this.e.v;
        const track = this.e.c;
        if (!val || !track) return;

        if (location === 'middle') {
            if (val.parentNode !== track) track.appendChild(val);
            val.style.position = 'absolute';
            val.style.flex = '';
            val.style.maxWidth = '';
            val.style.maxHeight = '';
            val.style.width = '';
            val.style.overflow = '';
            val.style.boxSizing = '';
            return;
        }

        const slot = this._slotForLocation(location);
        if (!slot) return;
        val.style.position = 'relative';
        val.style.top = 'auto';
        val.style.left = 'auto';
        val.style.right = 'auto';
        val.style.bottom = 'auto';
        val.style.flex = '0 0 auto';
        val.style.pointerEvents = 'none';
        if (val.parentNode !== slot) slot.appendChild(val);
    }

    _syncSliderSlots(labelLoc, valueLoc, hasLabel, showValue, gapPx) {
        const lbl = this.e.lbl;
        const slots = [this.e.slotTop, this.e.slotBottom, this.e.slotLeft, this.e.slotRight];
        const labelSlot = hasLabel ? this._slotForLocation(labelLoc) : this.e.slotTop;
        if (lbl && labelSlot && lbl.parentNode !== labelSlot) labelSlot.appendChild(lbl);

        this._placeSliderValueElement(showValue ? valueLoc : 'middle');

        if (hasLabel && showValue && valueLoc !== 'middle' && valueLoc === labelLoc) {
            const shared = this._slotForLocation(labelLoc);
            if (shared && lbl && this.e.v && this.e.v.parentNode === shared) {
                shared.insertBefore(lbl, this.e.v);
            }
        }

        slots.forEach((slot) => {
            let loc = 'top';
            if (slot === this.e.slotBottom) loc = 'bottom';
            if (slot === this.e.slotLeft) loc = 'left';
            if (slot === this.e.slotRight) loc = 'right';
            this._styleSliderSlot(slot, loc);
        });

        const body = this.e.body;
        if (body) {
            body.style.display = 'flex';
            body.style.flexDirection = 'row';
            body.style.flex = '1 1 auto';
            body.style.minHeight = '0';
            body.style.minWidth = '0';
            body.style.width = '100%';
            body.style.justifyContent = 'center';
            body.style.alignItems = 'center';
            const sideOpen = (this.e.slotLeft && this.e.slotLeft.style.display !== 'none')
                || (this.e.slotRight && this.e.slotRight.style.display !== 'none');
            body.style.gap = sideOpen ? `${gapPx}px` : '0px';
        }

        const layout = this.e.layout;
        if (layout) {
            const stackOpen = (this.e.slotTop && this.e.slotTop.style.display !== 'none')
                || (this.e.slotBottom && this.e.slotBottom.style.display !== 'none');
            layout.style.gap = stackOpen ? `${gapPx}px` : '0px';
        }
    }

    _styleSliderCaption(labelLoc, hasLabel) {
        const lbl = this.e.lbl;
        if (!lbl) return;
        lbl.style.margin = '0';
        lbl.style.flexShrink = '0';
        lbl.style.textAlign = 'center';
        lbl.style.overflow = 'hidden';
        if (!hasLabel) {
            lbl.style.display = 'none';
            return;
        }
        lbl.style.display = 'block';
        if (labelLoc === 'left' || labelLoc === 'right') {
            lbl.style.width = 'auto';
            lbl.style.maxWidth = '';
            lbl.style.whiteSpace = 'nowrap';
            return;
        }
        lbl.style.width = '100%';
        lbl.style.maxWidth = '100%';
        lbl.style.whiteSpace = 'nowrap';
    }

    _measureSliderLabelBox(fallbackW, fallbackH) {
        const lbl = this.e.lbl;
        if (!lbl || lbl.style.display === 'none') return { w: 0, h: 0 };
        const prevWidth = lbl.style.width;
        const prevMax = lbl.style.maxWidth;
        lbl.style.width = 'auto';
        lbl.style.maxWidth = 'none';
        const rect = lbl.getBoundingClientRect();
        lbl.style.width = prevWidth;
        lbl.style.maxWidth = prevMax;
        return {
            w: Math.max(0, Math.ceil(rect.width) || fallbackW),
            h: Math.max(0, Math.ceil(rect.height) || fallbackH)
        };
    }

    _measureSliderValueBox(fallbackW, fallbackH) {
        const val = this.e.v;
        if (!val || val.style.display === 'none') {
            return { w: fallbackW, h: fallbackH };
        }
        const rect = val.getBoundingClientRect();
        return {
            w: Math.max(1, Math.ceil(rect.width) || fallbackW),
            h: Math.max(1, Math.ceil(rect.height) || fallbackH)
        };
    }

    _sliderValueReserveCacheKey(c) {
        const vNum = this.e.vNum;
        const u = this.e.u;
        return [
            c.min, c.max,
            c.customDisplayRange ? 1 : 0,
            c.displayMin, c.displayMax, c.displayDecimalPlaces, c.displayKeepTrailingZeros ? 1 : 0,
            c.allowDecimals ? 1 : 0, c.stepSize,
            c.unit,
            vNum && vNum.style.fontFamily, vNum && vNum.style.fontSize, vNum && vNum.style.fontWeight,
            u && u.style.fontFamily, u && u.style.fontSize, u && u.style.fontWeight, u && u.style.fontStyle,
            u && u.style.display
        ].join('\0');
    }

    _measureSliderValueReserveWidth(c, fallbackW) {
        const val = this.e.v;
        const vNum = this.e.vNum;
        if (!val || !vNum || val.style.display === 'none') return fallbackW;

        const samples = SliderWidget.sliderValueWidthSamples(c);
        const prevText = vNum.textContent;
        const prevWidth = val.style.width;
        const prevFlex = val.style.flex;
        const prevMax = val.style.maxWidth;
        val.style.width = 'auto';
        val.style.flex = '0 0 auto';
        val.style.maxWidth = 'none';

        let maxW = 0;
        for (let i = 0; i < samples.length; i++) {
            vNum.textContent = samples[i];
            const w = val.getBoundingClientRect().width;
            if (w > maxW) maxW = w;
        }

        vNum.textContent = prevText;
        val.style.width = prevWidth;
        val.style.flex = prevFlex;
        val.style.maxWidth = prevMax;
        return Math.max(1, Math.ceil(maxW) || fallbackW);
    }

    _cachedSliderValueReserveWidth(c, fallbackW) {
        const key = this._sliderValueReserveCacheKey(c);
        if (this._sliderValueWidthCache && this._sliderValueWidthCache.key === key) {
            return this._sliderValueWidthCache.w;
        }
        const w = this._measureSliderValueReserveWidth(c, fallbackW);
        this._sliderValueWidthCache = { key, w };
        return w;
    }

    _positionSliderValueReadout(location, valAlign, valOffX, valOffY) {
        const val = this.e.v;
        if (!val) return;

        val.style.textAlign = valAlign || 'center';
        val.style.whiteSpace = 'nowrap';

        if (location === 'middle') {
            val.style.top = '50%';
            val.style.left = '50%';
            val.style.width = '';
            val.style.maxWidth = '';
            val.style.maxHeight = '';
            val.style.overflow = '';
            let anchorX = '-50%';
            if (valAlign === 'left') anchorX = '0%';
            if (valAlign === 'right') anchorX = '-100%';
            val.style.transform = `translate(calc(${anchorX} + ${valOffX}px), calc(-50% + ${valOffY}px))`;
            return;
        }

        val.style.top = 'auto';
        val.style.left = 'auto';
        val.style.transform = `translate(${valOffX}px, ${valOffY}px)`;
    }

    _renderSpecific() {
        const c = this.config;

        if (this.e.widgetLabelEl) {
            const widgetLabelText = c.widgetLabel != null ? String(c.widgetLabel) : '';
            this.e.widgetLabelEl.textContent = widgetLabelText;
            this.e.widgetLabelEl.style.display = widgetLabelText ? 'block' : 'none';
            if (widgetLabelText) {
                this.applyTypographyToElement(this.e.widgetLabelEl, 'sliderWidgetLabel', c);
                this.e.widgetLabelEl.style.transform = `translate(${c.sliderWidgetLabelOffX || 0}px, ${c.sliderWidgetLabelOffY || 0}px)`;
            } else {
                this.e.widgetLabelEl.style.transform = 'none';
            }
        }

        this.e.lbl.textContent = c.label;
        this.applyTypographyToElement(this.e.lbl, 'sliderCaption', c, { skipTextAlign: true });
        this.e.lbl.style.textAlign = 'center';

        const hasTrack = c.trackThickness > 0;
        const hasFill = c.fillThickness > 0;
        const outW = hasTrack ? (c.trackOutlineWidth || 0) : 0;
        const fillOutW = hasFill ? (c.fillOutlineWidth || 0) : 0;
        const totalTrackThick = c.trackThickness + (outW * 2);
        const fillVisual = c.fillThickness + (fillOutW * 2);

        const gap = Math.max(0, (totalTrackThick - c.fillThickness) / 2);
        const safePad = Math.max(c.thumbSize / 2, gap);

        const isResp = (typeof BaseWidget !== 'undefined' && BaseWidget.isResponsiveMode && BaseWidget.isResponsiveMode());
        const innerEl = (this.elements && this.elements.innerContent) ? this.elements.innerContent : null;
        const sliderBoxW = (isResp && innerEl) ? innerEl.clientWidth : 0;
        const sliderBoxH = (isResp && innerEl) ? innerEl.clientHeight : 0;
        const availW = isResp && innerEl
            ? Math.max(0, sliderBoxW)
            : (c.width - (c.padding * 2));
        const widgetLabelFs = BaseWidget.toFiniteNumber(c.sliderWidgetLabelFs, 12);
        const captionFs = BaseWidget.toFiniteNumber(c.sliderCaptionFs, 12);
        const valueFs = BaseWidget.toFiniteNumber(c.sliderValueFs, 10);
        const unitFs = BaseWidget.toFiniteNumber(c.sliderUnitFs, 20);
        const unitStr = c.unit ? String(c.unit).trim() : '';
        const widgetLabelText = c.widgetLabel != null ? String(c.widgetLabel) : '';
        const widgetLabelHeight = widgetLabelText ? (widgetLabelFs + 8) : 0;
        const availH = isResp && innerEl
            ? Math.max(0, sliderBoxH - widgetLabelHeight)
            : (c.height - (c.padding * 2) - widgetLabelHeight);
        const loc = SliderWidget.normalizeValueLocation(c.valueLocation);
        const labelLoc = SliderWidget.normalizeLabelLocation(c.labelLocation);
        const hasLabel = !!(c.label && String(c.label).trim());
        const showValue = c.showVal !== false;
        const layoutLoc = showValue ? loc : 'middle';
        const valueGap = 8;
        const clusterGap = 4;
        const minTrack = 40;
        const estTextW = (valueFs * 3) + (unitStr ? (unitStr.length * unitFs * 0.55) + 6 : 0) + 10;
        const estTextH = Math.max(valueFs, unitStr ? unitFs : 0) + 4;
        const valOffX = BaseWidget.toFiniteNumber(c.sliderValueOffX, 0);
        const valOffY = BaseWidget.toFiniteNumber(c.sliderValueOffY, 0);
        const valAlign = c.sliderValueAlign || 'center';

        this.e.vNum.textContent = SliderWidget.formatSliderDisplayValue(c.value, c);
        this.e.u.textContent = unitStr;
        this.e.u.style.display = unitStr && showValue ? 'inline' : 'none';
        this.e.v.style.display = showValue ? 'block' : 'none';
        this.applyTypographyToElement(this.e.vNum, 'sliderValue', c, { skipTextAlign: true });
        this.e.vNum.style.transform = 'none';
        this.applyTypographyToElement(this.e.u, 'sliderUnit', c, { skipTextAlign: true });
        this.e.u.style.transform = 'none';

        this._styleSliderCaption(hasLabel ? labelLoc : 'top', hasLabel);
        this._syncSliderSlots(hasLabel ? labelLoc : 'top', layoutLoc, hasLabel, showValue, valueGap);
        this._positionSliderValueReadout(layoutLoc, valAlign, valOffX, valOffY);

        const trackCross = Math.max(totalTrackThick, fillVisual, c.thumbSize);
        const valueOnLeft = showValue && loc === 'left';
        const valueOnRight = showValue && loc === 'right';
        const valueOnTop = showValue && loc === 'top';
        const valueOnBottom = showValue && loc === 'bottom';

        let valueW = 0;
        let valueH = 0;
        if (valueOnLeft || valueOnRight) {
            valueW = this._cachedSliderValueReserveWidth(c, estTextW);
        } else if (valueOnTop || valueOnBottom) {
            this.e.v.style.flex = '0 0 auto';
            this.e.v.style.width = '100%';
            this.e.v.style.maxWidth = '100%';
            this.e.v.style.maxHeight = `${Math.max(16, availH - trackCross - valueGap)}px`;
            this.e.v.style.overflow = 'hidden';
            const measured = this._measureSliderValueBox(estTextW, estTextH);
            valueH = measured.h;
        }

        let labelW = 0;
        let labelH = 0;
        if (hasLabel) {
            const measuredLbl = this._measureSliderLabelBox(Math.max(24, captionFs * 4), captionFs + 8);
            labelW = measuredLbl.w;
            labelH = measuredLbl.h || (captionFs + 8);
            if (labelLoc === 'left' || labelLoc === 'right') {
                const sameValue = (labelLoc === 'left' && valueOnLeft) || (labelLoc === 'right' && valueOnRight);
                const oppositeValue = (labelLoc === 'left' && valueOnRight) || (labelLoc === 'right' && valueOnLeft);
                const used = minTrack + valueGap
                    + (sameValue ? valueW + clusterGap : 0)
                    + (oppositeValue ? valueW + valueGap : 0);
                const maxLbl = Math.max(24, availW - used);
                this.e.lbl.style.maxWidth = `${maxLbl}px`;
                labelW = Math.min(labelW, maxLbl);
            }
        }

        if (valueOnLeft || valueOnRight) {
            const sameLabel = (valueOnLeft && hasLabel && labelLoc === 'left')
                || (valueOnRight && hasLabel && labelLoc === 'right');
            const oppositeLabel = (valueOnLeft && hasLabel && labelLoc === 'right')
                || (valueOnRight && hasLabel && labelLoc === 'left');
            const used = minTrack + valueGap
                + (sameLabel ? labelW + clusterGap : 0)
                + (oppositeLabel ? labelW + valueGap : 0);
            valueW = Math.min(valueW, Math.max(24, availW - used));
            this.e.v.style.boxSizing = 'content-box';
            this.e.v.style.flex = `0 0 ${valueW}px`;
            this.e.v.style.width = `${valueW}px`;
            this.e.v.style.maxWidth = `${valueW}px`;
            this.e.v.style.maxHeight = '100%';
            this.e.v.style.overflow = 'hidden';
        }

        const clusterW = (side) => {
            const lab = hasLabel && labelLoc === side;
            const val = showValue && loc === side;
            if (lab && val) return labelW + clusterGap + valueW;
            if (lab) return labelW;
            if (val) return valueW;
            return 0;
        };
        const clusterH = (side) => {
            const lab = hasLabel && labelLoc === side;
            const val = showValue && loc === side;
            if (lab && val) return labelH + clusterGap + valueH;
            if (lab) return labelH;
            if (val) return valueH;
            return 0;
        };

        const leftW = clusterW('left');
        const rightW = clusterW('right');
        const topH = clusterH('top');
        const bottomH = clusterH('bottom');
        const reservedW = (leftW ? leftW + valueGap : 0) + (rightW ? rightW + valueGap : 0);
        const reservedH = (topH ? topH + valueGap : 0) + (bottomH ? bottomH + valueGap : 0);
        const overlayW = Math.max(minTrack, availW - reservedW);
        const overlayH = Math.max(minTrack, availH - reservedH);

        const textHalfW = estTextW / 2;
        const textHalfH = estTextH / 2;
        let textCenterX = valOffX;
        if (valAlign === 'left') textCenterX = valOffX + textHalfW;
        if (valAlign === 'right') textCenterX = valOffX - textHalfW;
        const textCenterY = valOffY;
        const tLeft = textCenterX - textHalfW;
        const tRight = textCenterX + textHalfW;
        const tTop = textCenterY - textHalfH;
        const tBottom = textCenterY + textHalfH;
        const boundX = overlayW / 2;
        const boundY = overlayH / 2;
        const overLeft = Math.max(0, -boundX - tLeft);
        const overRight = Math.max(0, tRight - boundX);
        const overTop = Math.max(0, -boundY - tTop);
        const overBottom = Math.max(0, tBottom - boundY);

        let trackW = overlayW;
        let trackH = overlayH;
        let shiftX = 0;
        let shiftY = 0;

        if (showValue && loc === 'middle') {
            if (overLeft > 0 || overRight > 0) {
                const totalOverX = overLeft + overRight;
                trackW = Math.max(minTrack, overlayW - totalOverX);
                shiftX = (overLeft - overRight) / 2;
            }
            if (overTop > 0 || overBottom > 0) {
                const totalOverY = overTop + overBottom;
                trackH = Math.max(minTrack, overlayH - totalOverY);
                shiftY = (overTop - overBottom) / 2;
            }
        } else if (!c.vertical) {
            trackW = overlayW;
        } else {
            trackH = overlayH;
        }

        this.e.c.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
        this.e.t.style.display = hasTrack ? 'block' : 'none';
        this.e.f.style.display = hasFill ? 'block' : 'none';

        if (!hasTrack) {
            this.e.t.style.border = 'none';
        } else if (outW > 0) {
            this.e.t.style.border = `${outW}px solid ${BaseWidget.colorAtOpacity(c.trackOutlineColor, c.trackOutlineOpacity)}`;
        } else {
            this.e.t.style.border = 'none';
        }
        this.e.t.style.boxShadow = BaseWidget.elementInnerGlowShadow(c.trackInnerGlow, c.trackInnerGlowColor, c.trackInnerGlowOpacity);
        // Frost only behind a translucent track; at full opacity blur is invisible so it stays off.
        this._syncBackdropBlur(this.e.t, (Number(c.trackOpacity) < 100 ? c.trackBlur : 0));

        if (c.vertical) {
            this.e.c.style.width = `${Math.max(totalTrackThick, fillVisual, c.thumbSize)}px`;
            this.e.c.style.height = `${trackH}px`;

            this.e.t.style.width = `${c.trackThickness}px`;
            this.e.t.style.height = '100%';

            this.e.f.style.left = '50%';
            this.e.f.style.transform = 'translateX(-50%)';
            this.e.f.style.width = `${c.fillThickness}px`;
            this.e.f.style.bottom = `${gap}px`;
            this.e.f.style.top = 'auto';
            this.e.th.style.left = '50%';
        } else {
            this.e.c.style.width = `${trackW}px`;
            this.e.c.style.height = `${Math.max(totalTrackThick, fillVisual, c.thumbSize)}px`;

            this.e.t.style.width = '100%';
            this.e.t.style.height = `${c.trackThickness}px`;

            this.e.f.style.top = '50%';
            this.e.f.style.transform = 'translateY(-50%)';
            this.e.f.style.height = `${c.fillThickness}px`;
            this.e.f.style.left = `${gap}px`;
            this.e.th.style.top = '50%';
        }

        let pct = (c.max === c.min) ? 0 : (c.value - c.min) / (c.max - c.min);
        pct = Math.max(0, Math.min(1, pct));
        this.e.t.style.backgroundColor = BaseWidget.colorAtOpacity(c.colTrack, c.trackOpacity);
        this.e.f.style.backgroundColor = BaseWidget.colorAtOpacity(c.colFill, c.fillOpacity);
        if (hasFill && fillOutW > 0) {
            this.e.f.style.border = fillOutW + 'px solid ' + BaseWidget.colorAtOpacity(c.fillOutlineColor, c.fillOutlineOpacity);
        } else {
            this.e.f.style.border = 'none';
        }
        this.e.f.style.boxShadow = BaseWidget.elementInnerGlowShadow(c.fillInnerGlow, c.fillInnerGlowColor, c.fillInnerGlowOpacity) || 'none';
        this.e.th.style.width = `${c.thumbSize}px`;
        this.e.th.style.height = `${c.thumbSize}px`;
        this.e.th.style.backgroundColor = BaseWidget.resolveCssColor(c.colThumb);
        const thumbOutW = c.thumbOutlineWidth || 0;
        if (thumbOutW > 0) {
            this.e.th.style.border = thumbOutW + 'px solid ' + BaseWidget.colorAtOpacity(c.thumbOutlineColor, c.thumbOutlineOpacity);
        } else {
            this.e.th.style.border = 'none';
        }
        const thumbShadows = [];
        const thumbIg = BaseWidget.elementInnerGlowShadow(c.thumbInnerGlow, c.thumbInnerGlowColor, c.thumbInnerGlowOpacity);
        if (thumbIg) thumbShadows.push(thumbIg);
        if (c.thumbShadow) thumbShadows.push('0 2px 5px rgba(0,0,0,0.5)');
        this.e.th.style.boxShadow = thumbShadows.length > 0 ? thumbShadows.join(', ') : 'none';

        if (c.vertical) {
            if (hasFill) this.e.f.style.height = `calc((${safePad}px + (100% - ${safePad * 2}px) * ${pct}) - ${gap}px)`;
            this.e.th.style.top = `calc(${safePad}px + (100% - ${safePad * 2}px) * ${1 - pct})`;
        } else {
            if (hasFill) this.e.f.style.width = `calc((${safePad}px + (100% - ${safePad * 2}px) * ${pct}) - ${gap}px)`;
            this.e.th.style.left = `calc(${safePad}px + (100% - ${safePad * 2}px) * ${pct})`;
        }

        if (c.deactivated) {
            const deactColor = BaseWidget.getDeactivatedColor(c);
            const accentColor = BaseWidget.getDeactivatedColorAccent(c);
            this.e.t.style.display = 'block';
            this.e.t.style.backgroundColor = deactColor;
            if (hasFill) {
                this.e.f.style.display = 'block';
                this.e.f.style.backgroundColor = accentColor;
                this.e.f.style.border = 'none';
                this.e.f.style.boxShadow = 'none';
            }
            this.e.th.style.display = 'block';
            this.e.th.style.backgroundColor = accentColor;
            this.e.th.style.boxShadow = 'none';
            this.e.th.style.border = 'none';
            if (showValue) {
                this.e.v.style.display = 'flex';
                this.e.v.style.color = accentColor;
            }
            if (hasLabel) {
                this.e.lbl.style.display = 'block';
                this.e.lbl.style.color = accentColor;
            }
            if (this.e.widgetLabelEl && c.widgetLabel) {
                this.e.widgetLabelEl.style.display = 'block';
                this.e.widgetLabelEl.style.color = accentColor;
            }
        }
        const deactivated = !!c.deactivated;
        const trkPe = (deactivated && !Dashboard.isEditMode) ? 'none' : 'auto';
        if (this.e.c && this.e.c.style.pointerEvents !== trkPe) this.e.c.style.pointerEvents = trkPe;
        const trkCursor = (deactivated || Dashboard.isEditMode) ? 'default' : 'pointer';
        if (this.e.c && this.e.c.style.cursor !== trkCursor) this.e.c.style.cursor = trkCursor;
        if (isResp && innerEl) this._scheduleSliderLayoutMeasure(sliderBoxW, sliderBoxH);
    }

    /**
     * Track length is taken from the cell during render. If that cell was not
     * laid out yet, measure once more on the next frame and draw again only
     * when the box actually changed.
     */
    _scheduleSliderLayoutMeasure(boxW, boxH) {
        this._sliderBoxW = boxW;
        this._sliderBoxH = boxH;
        if (!this._sliderLayoutFixing) this._sliderLayoutPasses = 0;
        if (this._sliderLayoutRaf) return;
        const self = this;
        const run = function () {
            self._sliderLayoutRaf = 0;
            self._correctSliderLayoutIfNeeded();
        };
        if (typeof requestAnimationFrame === 'function') {
            this._sliderLayoutRaf = requestAnimationFrame(run);
        } else {
            run();
        }
    }

    _correctSliderLayoutIfNeeded() {
        if (this._sliderLayoutFixing) return;
        const wrap = this.elements && this.elements.wrapper;
        if (!wrap || wrap.style.display === 'none') return;
        if (typeof Dashboard !== 'undefined' && Dashboard._pageHidden) return;
        const innerEl = this.elements && this.elements.innerContent;
        if (!innerEl) return;
        const w = innerEl.clientWidth;
        const h = innerEl.clientHeight;
        if (!(w > 0) || !(h > 0)) return;
        if (w === this._sliderBoxW && h === this._sliderBoxH) return;
        if ((this._sliderLayoutPasses || 0) >= 2) return;
        this._sliderLayoutPasses = (this._sliderLayoutPasses || 0) + 1;
        this._sliderLayoutFixing = true;
        try {
            this._renderSpecific();
        } finally {
            this._sliderLayoutFixing = false;
        }
    }

    onIncomingData(topic, payload, count) {
        const valueTopic = this.bindings && this.bindings.value;
        if (valueTopic && topic === valueTopic && !(this.lastInteraction && (Date.now() - this.lastInteraction < 1000))) {
            this._optimisticValue = undefined;
        }
        if (this.config && this.config.deactivated && this._resetWheelHover) {
            this._resetWheelHover();
        }
        return super.onIncomingData(topic, payload, count);
    }

    onRemove() {
        this._resetWheelHover = null;
        if (this._sliderLayoutRaf && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._sliderLayoutRaf);
        }
        this._sliderLayoutRaf = 0;
        if (this._activeDragCleanup) {
            this._activeDragCleanup();
            this._activeDragCleanup = null;
        }
        if (this._wheelDebounceSendTimer && typeof WorkerTimer !== 'undefined') {
            WorkerTimer.clearTimeout(this._wheelDebounceSendTimer);
            this._wheelDebounceSendTimer = null;
        }
        super.onRemove();
    }
}

WidgetRegistry.register('slider', SliderWidget);
