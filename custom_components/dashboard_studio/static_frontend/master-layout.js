/**
 * Canonical nested dashboard `master` layout (saved JSON) vs flat MASTER_SETTINGS (runtime).
 * Theme tokens: Future_specs/dashboard-theme-color-tokens.md
 */
const MasterLayout = {
    LAYOUT_VERSION: 2,

    /** Editor + save file: theme.colors keys (camelCase). */
    THEME_TOKEN_DEFS: [
        { key: 'background',       label: 'Background',          hint: 'Dashboard canvas backdrop (behind widgets).' },
        { key: 'backgroundAccent', label: 'Background Accent',   hint: 'Canvas gradient companion — lighter or more vivid than the base background.' },
        { key: 'surface',          label: 'Surface',             hint: 'Main background for panels, cards, and containers.' },
        { key: 'surfaceAlt',       label: 'Surface Alternative', hint: 'Secondary background for inset areas, stripes, or grouped blocks.' },
        { key: 'surfaceHover',     label: 'Surface Hover',       hint: 'Background when a surface is hovered or lightly pressed.' },
        { key: 'overlay',          label: 'Overlay',             hint: 'Dim layer over content for modals, drawers, and blocking states.' },
        { key: 'text',             label: 'Text',                hint: 'Primary text and high-importance labels.' },
        { key: 'textMuted',        label: 'Text Muted',          hint: 'Secondary text, captions, and de-emphasized values.' },
        { key: 'onSurface',        label: 'Text On Surface',     hint: 'Text or icons on colored or tinted surfaces.' },
        { key: 'onAccent',         label: 'Text On Accent',      hint: 'Text and icons placed directly on the accent color.' },
        { key: 'accent',           label: 'Accent',              hint: 'Bright primary emphasis: the vivid highlight, active fill, and key series tone.' },
        { key: 'accentSoft',       label: 'Accent Soft',         hint: 'Base primary color — one step calmer than Accent, used for fills and chips.' },
        { key: 'accentSecondary',  label: 'Accent Secondary',    hint: 'Darker companion of the primary accent family.' },
        { key: 'accentOff',        label: 'Accent Off',          hint: 'Inactive/OFF state of an accent-colored control.' },
        { key: 'controlOff',       label: 'Control Off',         hint: 'Track, empty slot, or baseline control chrome.' },
        { key: 'thumb',            label: 'Thumb',               hint: 'Slider thumb, toggle knob, or draggable control fill.' },
        { key: 'border',           label: 'Border',              hint: 'Subtle dividers, hairlines, and inner track fills.' },
        { key: 'borderAccent',     label: 'Border Accent',       hint: 'Stronger hairlines, widget frames, and emphasized chrome lines.' },
        { key: 'icon',             label: 'Icon',                hint: 'Default icon color on normal surfaces.' },
        { key: 'iconAccent',       label: 'Icon Accent',         hint: 'Duotone secondary layer — on dark dashboards a darker mix of Icon toward the canvas; on light dashboards a lighter tint toward white (harmonious with Icon, not a contrasting hue).' },
        { key: 'iconMuted',        label: 'Icon Muted',          hint: 'Inactive, decorative, or low-priority icons.' },
        { key: 'success',          label: 'Success',             hint: 'Positive state, OK, and safe-to-proceed indicators.' },
        { key: 'warning',          label: 'Warning',             hint: 'Caution, attention needed, non-blocking issues.' },
        { key: 'danger',           label: 'Danger',              hint: 'Errors, alarms, and destructive or critical states.' },
        { key: 'glow',             label: 'Glow',                hint: 'Soft outer glow or halo around emphasized elements.' },
        { key: 'link',             label: 'Link',                hint: 'Tappable text links when they should differ from accent.' },
        { key: 'placeholder',      label: 'Placeholder',         hint: 'Input placeholder text and subtle tertiary hints in fields.' },
        { key: 'markerTint1',      label: 'Marker Tint 1',       hint: 'First categorical marker: tags, calendar segments, chips, and other tinted UI blocks.' },
        { key: 'markerTint2',      label: 'Marker Tint 2',       hint: 'Second categorical marker: tags, calendar segments, chips, and other tinted UI blocks.' },
        { key: 'markerTint3',      label: 'Marker Tint 3',       hint: 'Third categorical marker: tags, calendar segments, chips, and other tinted UI blocks.' },
        { key: 'markerTint4',      label: 'Marker Tint 4',       hint: 'Fourth categorical marker: tags, calendar segments, chips, and other tinted UI blocks.' }
    ],

    CONNECTION_KEYS: ['dataDriver', 'driverSettings'],

    ENVIRONMENT_KEYS: [
        'editorMode',
        'editorZoom',
        'quickToolbar',
        'canvasBg', 'canvasBgOpacity', 'canvasBgEnd', 'canvasBgEndOpacity', 'canvasBgType', 'canvasBgAngle',
        'canvasBgOverlay', 'canvasImage', 'canvasBgSize', 'preloadImagesOnAllPages',
        'holdToActivateDuration',
        'canvasPreset', 'canvasWidth', 'canvasHeight',
        'gridSize', 'showGrid', 'snapToGrid', 'hideScrollbars',
        'widgetLabelMode',
        'currentPage', 'currentPageOutputTopic',
        'inactivityPageEnabled', 'inactivityReturnPage', 'inactivityTimeoutSeconds',
        'gestureTouchOnly',
        'swipeLeftEnabled', 'swipeLeftAction', 'swipeLeftPage', 'swipeLeftTopic', 'swipeLeftPayload',
        'swipeRightEnabled', 'swipeRightAction', 'swipeRightPage', 'swipeRightTopic', 'swipeRightPayload',
        'swipeUpEnabled', 'swipeUpAction', 'swipeUpPage', 'swipeUpTopic', 'swipeUpPayload',
        'swipeDownEnabled', 'swipeDownAction', 'swipeDownPage', 'swipeDownTopic', 'swipeDownPayload',
        'swipeIgnorePages', 'swipeWrapAround',
        'theme',
        'audioTopicMap',
        'dialogBoxMessage', 'dialogBoxConfirmLabel', 'dialogBoxDismissLabel',
        'dialogBoxButtonColor', 'dialogBoxButtonRoundness', 'dialogBoxShowButtonIcons', 'dialogBoxShowDialogIcon',
        'dialogBoxAutoButtonSize', 'dialogBoxButtonWidth', 'dialogBoxButtonHeight',
        'dialogBoxBackgroundColor', 'dialogBoxBorderColor', 'dialogBoxBorderWidth', 'dialogBoxBorderOpacity',
        'dialogBoxCornerRadius',
        'dialogBoxAutoDialogSize', 'dialogBoxDialogWidth', 'dialogBoxDialogHeight',
        'dialogBoxCenterDialog', 'dialogBoxDialogX', 'dialogBoxDialogY', 'dialogBoxModalMode',
        'dialogBoxTextFont', 'dialogBoxTextFs', 'dialogBoxTextAlign', 'dialogBoxTextCase',
        'dialogBoxTextBold', 'dialogBoxTextItalic', 'dialogBoxTextCol', 'dialogBoxTextOpacity',
        'dialogBoxTextOffX', 'dialogBoxTextOffY',
        'dialogBoxButtonLabelFont', 'dialogBoxButtonLabelFs', 'dialogBoxButtonLabelAlign', 'dialogBoxButtonLabelCase',
        'dialogBoxButtonLabelBold', 'dialogBoxButtonLabelItalic', 'dialogBoxButtonLabelCol',
        'dialogBoxButtonLabelOpacity', 'dialogBoxButtonLabelOffX', 'dialogBoxButtonLabelOffY',
        'dialogBoxIconDialogSource', 'dialogBoxIconDialogBuiltin', 'dialogBoxIconDialogWeight',
        'dialogBoxIconDialogCustomUrl', 'dialogBoxIconDialogTintImage', 'dialogBoxIconDialogColor',
        'dialogBoxIconDialogAccentColor', 'dialogBoxIconDialogSize',
        'dialogBoxIconConfirmSource', 'dialogBoxIconConfirmBuiltin', 'dialogBoxIconConfirmWeight',
        'dialogBoxIconConfirmCustomUrl', 'dialogBoxIconConfirmTintImage', 'dialogBoxIconConfirmColor',
        'dialogBoxIconConfirmAccentColor', 'dialogBoxIconConfirmSize',
        'dialogBoxIconDismissSource', 'dialogBoxIconDismissBuiltin', 'dialogBoxIconDismissWeight',
        'dialogBoxIconDismissCustomUrl', 'dialogBoxIconDismissTintImage', 'dialogBoxIconDismissColor',
        'dialogBoxIconDismissAccentColor', 'dialogBoxIconDismissSize',
        'layoutMode', 'layoutScaleKeepAspect',
        'layoutResponsiveColumnCount', 'layoutResponsiveReduceColumnsToFit',
        'layoutResponsiveMinSize', 'layoutResponsiveMaxSize',
        'layoutResponsiveGap', 'layoutResponsiveAlign', 'layoutResponsiveMinWidgetHeight',
        'layoutResponsivePagePaddingLeft', 'layoutResponsivePagePaddingRight',
        'layoutResponsivePagePaddingTop', 'layoutResponsivePagePaddingBottom'
    ],

    DIALOG_BOX_APPEARANCE: {
        dialogBoxMessage: 'message',
        dialogBoxConfirmLabel: 'confirmLabel',
        dialogBoxDismissLabel: 'dismissLabel',
        dialogBoxButtonColor: 'buttonColor',
        dialogBoxButtonRoundness: 'buttonRoundness',
        dialogBoxShowButtonIcons: 'showButtonIcons',
        dialogBoxShowDialogIcon: 'showDialogIcon',
        dialogBoxAutoButtonSize: 'autoButtonSize',
        dialogBoxButtonWidth: 'buttonWidth',
        dialogBoxButtonHeight: 'buttonHeight',
        dialogBoxBackgroundColor: 'backgroundColor',
        dialogBoxBorderColor: 'borderColor',
        dialogBoxBorderWidth: 'borderWidth',
        dialogBoxBorderOpacity: 'borderOpacity',
        dialogBoxCornerRadius: 'cornerRadius',
        dialogBoxAutoDialogSize: 'autoDialogSize',
        dialogBoxDialogWidth: 'dialogWidth',
        dialogBoxDialogHeight: 'dialogHeight',
        dialogBoxCenterDialog: 'centerDialog',
        dialogBoxDialogX: 'dialogX',
        dialogBoxDialogY: 'dialogY',
        dialogBoxModalMode: 'modalMode'
    },

    DIALOG_BOX_TYPO_PREFIX: {
        dialogBoxText: 'dialogText',
        dialogBoxButtonLabel: 'buttonLabel'
    },

    DIALOG_BOX_TYPO_SUFFIX: {
        Font: 'fontFamily',
        Fs: 'fontSize',
        Align: 'textAlign',
        Case: 'textTransform',
        Bold: 'bold',
        Italic: 'italic',
        Col: 'color',
        Opacity: 'opacity',
        OffX: 'offsetX',
        OffY: 'offsetY'
    },

    DIALOG_BOX_ICON_PREFIX: {
        dialogBoxIconDialog: 'dialog',
        dialogBoxIconConfirm: 'confirm',
        dialogBoxIconDismiss: 'dismiss'
    },

    DIALOG_BOX_ICON_SUFFIX: {
        Source: 'source',
        Builtin: 'builtin',
        Weight: 'weight',
        CustomUrl: 'customUrl',
        TintImage: 'tintImage',
        Color: 'color',
        AccentColor: 'accentColor',
        Size: 'size'
    },

    TYPOGRAPHY_KEYS: [
        'customFonts', 'fontFamily', 'defaultLabelCase', 'defaultLabelBold', 'defaultTextAlign',
        'defaultColVal', 'defaultColLabel', 'defaultLabelLineHeight', 'defaultTextVerticalAlign',
        'defaultFsGeneral', 'defaultFsVal', 'defaultFsUnit', 'defaultFsLabel'
    ],

    CONTAINER_KEYS: [
        'defaultWidth', 'defaultHeight', 'defaultPadding',
        'bgVisible', 'bgColStart', 'bgOpacityStart', 'bgColEnd', 'bgOpacityEnd', 'bgAngle', 'bgBlur',
        'glowEnabled', 'glowColor', 'glowRadius', 'glowOpacity',
        'innerGlow', 'innerGlowColor', 'innerGlowOpacity',
        'borderColor', 'defaultBorderWidth', 'defaultBorderOpacity', 'defaultCornerRadius'
    ],

    isThemeApplyResetEnvironmentKey: function (key) {
        return key === 'canvasImage' || (typeof key === 'string' && key.indexOf('canvasBg') === 0);
    },

    // Configuration and layout master keys that stay on the current dashboard
    // when a theme is applied (including Reset current look first). Palette,
    // fonts, and chrome still restyle.
    THEME_APPLY_KEEP_CURRENT_KEYS: [
        'defaultTextAlign', 'defaultTextVerticalAlign', 'customFonts',
        'defaultWidth', 'defaultHeight', 'defaultPadding',
        'defaultGraphType', 'defaultGraphMaxPoints', 'defaultGraphScrollDir',
        'defaultGraphDynamicFloor', 'defaultGraphDynamicCeiling',
        'defaultGraphAutoMin', 'defaultGraphAutoMax',
        'defaultGraphUseBaseline', 'defaultGraphBaselineVal', 'defaultGraphNegMode',
        'defaultGraphDecimals', 'defaultGraphRoundingMode', 'defaultGraphHeadroom',
        'defaultGraphShowAxisX', 'defaultGraphShowAxisY',
        'defaultGraphTimeFormat', 'defaultGraphTime24h', 'defaultGraphDateFormat',
        'defaultGraphConvertToLocalTime', 'defaultGraphTimeOffset',
        'defaultGraphTimezoneConvert', 'defaultGraphLinearTimeScale',
        'defaultGraphAutoAxisResX', 'defaultGraphAutoAxisResY',
        'defaultGraphAxisResX', 'defaultGraphAxisResY',
        'defaultGraphAxisWidthX', 'defaultGraphAxisWidthY',
        'defaultGraphAxisOffX', 'defaultGraphAxisOffY',
        'defaultGraphShowPointValues', 'defaultGraphPointValuesHoverOnly',
        'defaultGraphAutoPointValuesInterval', 'defaultGraphPointValuesInterval',
        'defaultGraphPointValuesDecimals', 'defaultGraphPointValuesAbbreviate',
        'defaultGraphShowTickX', 'defaultGraphShowTickY',
        'defaultGraphTickXSpacing', 'defaultGraphTickYCount',
        'defaultClockDisplayMode', 'defaultClockUse12Hour',
        'defaultClockUseSystemTime', 'defaultClockTimezone', 'defaultClockOffset',
        'defaultClockShowTicks', 'defaultClockShowNumbers', 'defaultClockSweep',
        'defaultClockFlipShowLabels', 'defaultClockFlipShowSeconds',
        'defaultClockFlipLocale',
        'defaultClockFlipLabelHour', 'defaultClockFlipLabelMinute', 'defaultClockFlipLabelSecond',
        'defaultClockTextShowTime', 'defaultClockTextShowHour', 'defaultClockTextShowMinute',
        'defaultClockTextShowSecond', 'defaultClockTextShowDate',
        'defaultClockTextSeparator', 'defaultClockTextBlinkSeparator',
        'defaultClockTextDateSeparator', 'defaultClockTextDateLinebreak',
        'defaultClockTextDateSeg0', 'defaultClockTextDateSeg1', 'defaultClockTextDateSeg2',
        'defaultClockTextDateSeg3', 'defaultClockTextDateSeg4',
        'defaultClockTextLocale', 'defaultClockTextWeekPrefix',
        'defaultSwitchMode', 'defaultSwitchStyle', 'defaultSwitchAlign',
        'defaultSwitchLabelPos', 'defaultSwitchLabelHint',
        'defaultSwitchShowIcon', 'defaultSwitchIconOn',
        'defaultSwitchIconOnFilled', 'defaultSwitchIconOffFilled',
        'defaultGaugeType', 'defaultGaugeRoundLayout', 'defaultGaugeHorizontalLayout',
        'defaultGaugeRoundGap', 'defaultGaugeHorizontalGap', 'defaultGaugeSizeOffset',
        'defaultGaugeCaptionAlignRound', 'defaultGaugeCaptionAlignHoriz',
        'defaultGaugeAbbreviateLargeValues', 'defaultGaugeKeepTrailingZeros',
        'defaultGaugeCustomDisplayRange', 'defaultGaugeDisplayMin', 'defaultGaugeDisplayMax',
        'defaultGaugeDisplayDecimalPlaces', 'defaultGaugeDisplayKeepTrailingZeros',
        'defaultGaugeShowIcon', 'defaultGaugeIconSource', 'defaultGaugeIconOn',
        'defaultGaugeIconWeight', 'defaultGaugeIconCustomUrl', 'defaultGaugeIconTintImage',
        'defaultSliderVertical', 'defaultSliderShowVal',
        'defaultSliderValueLocation', 'defaultSliderLabelLocation',
        'defaultSliderAllowDecimals', 'defaultSliderStepSize',
        'defaultSliderCustomDisplayRange', 'defaultSliderDisplayMin', 'defaultSliderDisplayMax',
        'defaultSliderDisplayDecimalPlaces', 'defaultSliderDisplayKeepTrailingZeros',
        'defaultListShowIcons', 'defaultListShowTimestamp', 'defaultListMaxLines',
        'defaultListRawMode', 'defaultListTextWrap',
        'defaultListTimeFormat', 'defaultListTime24h', 'defaultListDateFormat',
        'lgCols', 'lgItemHeight', 'lgItemWidth', 'lgItemSpacing',
        'lgUseLightColor', 'lgAutoDeselect', 'lgDeselectTime',
        'lgPresetCols', 'lgPresetRows', 'lgPresetGap', 'lgPresetIndicators',
        'defaultLightGridPresets', 'lgPopoverW', 'lgPopoverH',
        'defaultImageFit', 'defaultImageProp', 'defaultImageScale', 'defaultImageFallbackUrl',
        'defaultBatteryVertical', 'defaultBatterySegments', 'defaultBatteryLowThresh',
        'labelDefaultWAuto', 'labelDefaultHAuto',
        'textMdTextWrap', 'textMdLinkTarget', 'textMdAutoFitText', 'textMdOverflowScroll',
        'textMdCalendarWeekStart', 'textMdSyncTableColumnWidths', 'textMdEqualTableColumnWidths',
        'textMdTableColumnWidthPx', 'defaultTextContentAnimationOnLiveTopics',
        'defaultIconBlink', 'defaultIconGlowOnActive', 'defaultIconFilled',
        'defaultIconWidgetSource', 'defaultIconWidgetBuiltin', 'defaultIconWidgetWeight',
        'defaultIconWidgetCustomUrl', 'defaultIconWidgetTintImage',
        'defaultIconWidgetActiveSource', 'defaultIconWidgetActiveBuiltin',
        'defaultIconWidgetActiveWeight', 'defaultIconWidgetActiveCustomUrl',
        'defaultIconWidgetActiveTintImage',
        'menuDefaultLabelHint', 'menuSpacerStyle',
        'arrowAnimEnabled', 'arrowAnimSpeed', 'arrowAnimReverse',
        'editboxInputDefaultAlign'
    ],

    themeApplyPreserveSet: function () {
        if (this._themeApplyPreserveSet) return this._themeApplyPreserveSet;
        const skip = new Set(this.CONNECTION_KEYS);
        skip.add('warnWhenDriverOffline');
        skip.add('widgetLabelMode');
        skip.add('resetLookOnThemeApply');
        this.ENVIRONMENT_KEYS.forEach((k) => {
            if (!this.isThemeApplyResetEnvironmentKey(k)) skip.add(k);
        });
        this.THEME_APPLY_KEEP_CURRENT_KEYS.forEach((k) => skip.add(k));
        this._themeApplyPreserveSet = skip;
        return skip;
    },

    omitThemeApplyKeepCurrentKeys: function (payload, storedFlat) {
        if (!payload || typeof payload !== 'object') return payload;
        const skip = this.themeApplyPreserveSet();
        skip.forEach(function (k) {
            delete payload[k];
        });
        return payload;
    },

    pickVisualMasterForThemeApply: function (flat) {
        const skip = this.themeApplyPreserveSet();
        const out = {};
        if (!flat || typeof flat !== 'object') return out;
        Object.keys(flat).forEach((k) => {
            if (skip.has(k)) return;
            const val = flat[k];
            if (val === undefined) return;
            out[k] = val;
        });
        return out;
    },

    // Built-in themes omit keys custom files still dump. Object.assign cannot drop them.
    markThemeApplyLeftoverUnsets: function (payload, current) {
        if (!payload || !current) return payload;
        const preserve = this.themeApplyPreserveSet();
        const hasOwn = Object.prototype.hasOwnProperty;
        Object.keys(current).forEach((k) => {
            if (preserve.has(k) || hasOwn.call(payload, k)) return;
            payload[k] = undefined;
        });
        return payload;
    },

    /** Default theme palette (dark dashboard baseline). */
    defaultThemeColors: function () {
        const o = {};
        this.THEME_TOKEN_DEFS.forEach((d) => {
            o[d.key] = this._DEFAULT_THEME_HEX[d.key] || '#94a3b8';
        });
        return o;
    },

    _DEFAULT_THEME_HEX: {
        background: '#102447',
        backgroundAccent: '#020C1F',
        surface: '#0F2E52',
        surfaceAlt: '#010E26',
        surfaceHover: '#334155',
        overlay: '#0f172a',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        onSurface: '#f8fafc',
        onAccent: '#083344',
        accent: '#67e8f9',
        accentSoft: '#22d3ee',
        accentSecondary: '#06b6d4',
        accentOff: '#1e3a5f',
        controlOff: '#475569',
        thumb: '#ffffff',
        border: '#1E3A5F',
        borderAccent: '#1A3869',
        icon: '#C7D9FF',
        iconAccent: '#233B70',
        iconMuted: '#64748b',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        glow: '#06b6d4',
        link: '#22d3ee',
        placeholder: '#64748b',
        markerTint1: '#b06d7f',
        markerTint2: '#b89f5c',
        markerTint3: '#6f7eb8',
        markerTint4: '#3d9590'
    },

    /** If value equals this legacy literal, migrate to @token. */
    LEGACY_COLOR_TO_TOKEN: function () {
        return {
            canvasBg: { literal: '#1b2232', token: 'background' },
            canvasBgEnd: { literal: '#020617', token: 'backgroundAccent' },
            defaultColVal: { literal: '#ffffff', token: 'text' },
            defaultColLabel: { literal: '#94a3b8', token: 'textMuted' },
            bgColStart: { literal: '#1e293b', token: 'surface' },
            bgColEnd: { literal: '#0f172a', token: 'surfaceAlt' },
            glowColor: { literal: '#06b6d4', token: 'glow' },
            borderColor: { literal: 'rgba(255,255,255,0.1)', token: 'border' },
            switchColOn: { literal: '#22d3ee', token: 'accent' },
            switchColOff: { literal: '#475569', token: 'controlOff' },
            switchColHover: { literal: '#64748b', token: 'iconMuted' },
            switchColThumb: { literal: '#ffffff', token: 'thumb' },
            switchColLabel: { literal: '#94a3b8', token: 'textMuted' },
            switchButtonOutsideDefaultCol: { literal: '#94a3b8', token: 'textMuted' },
            switchButtonOutsideDefaultColOff: { literal: '#94a3b8', token: 'textMuted' },
            switchButtonInsideDefaultCol: { literal: '#94a3b8', token: 'onAccent' },
            switchButtonInsideDefaultColOff: { literal: '#94a3b8', token: 'thumb' },
            switchIconColOn: { literal: '#ffffff', token: 'onAccent' },
            switchIconColOff: { literal: '#94a3b8', token: 'icon' },
            switchIconColHover: { literal: '#ffffff', token: 'text' },
            switchGlowColor: { literal: '#06b6d4', token: 'glow' },
            switchOutlineColor: { literal: '#334155', token: 'border' },
            menuIconColOn: { literal: '#ffffff', token: 'onAccent' },
            menuIconColOff: { literal: '#94a3b8', token: 'icon' },
            menuItemBgOn: { literal: '#0ea5e9', token: 'accentSecondary' },
            menuSpacerColor: { literal: '#334155', token: 'border' },
            menuItemColOff: { literal: '#94a3b8', token: 'textMuted' },
            menuDefaultItemCol: { literal: '#94a3b8', token: 'textMuted' },
            menuDefaultItemColOff: { literal: '#94a3b8', token: 'textMuted' },
            defaultGaugeTrackOutlineColor: { literal: '#334155', token: 'borderAccent' },
        defaultSliderTrackOutlineColor: { literal: '#334155', token: 'borderAccent' },
            defaultListIconColor: { literal: '#94a3b8', token: 'icon' },
            defaultListTextColor: { literal: '#e2e8f0', token: 'text' },
            defaultListTimeColor: { literal: '#94a3b8', token: 'textMuted' },
            lgColTileBg: { literal: '#1e293b', token: 'surface' },
            lgColTileHover: { literal: '#334155', token: 'surfaceHover' },
            lgColTileText: { literal: '#e2e8f0', token: 'text' },
            lgColToggleOn: { literal: '#06b6d4', token: 'accent' },
            lgColToggleOff: { literal: '#475569', token: 'controlOff' },
            defaultGraphAxisXFontColor: { literal: '#94a3b8', token: 'textMuted' },
            gaugeColIcon: { literal: '#94a3b8', token: 'icon' },
            defaultGraphGridHInnerCol: { literal: '#0f172a', token: 'overlay' },
            defaultGraphGridVCol: { literal: '#0f172a', token: 'overlay' },
            editboxFocusColor: { literal: '#22d3ee', token: 'link' },
            arrowColGlow: { literal: '#22d3ee', token: 'accentSoft' },
            clockColBackCap: { literal: '#0f172a', token: 'overlay' }
        };
    },

    _correctionBaseKey: function (key) {
        const m = String(key).match(/^(.+)_correct_(?:en|hue|sat|bri|hue_fixed|sat_fixed|bri_fixed)$/);
        return m ? m[1] : null;
    },

    _bucketForBaseKey: function (baseKey) {
        if (this.CONNECTION_KEYS.includes(baseKey)) return 'connection';
        if (this.ENVIRONMENT_KEYS.includes(baseKey)) return 'environment';
        if (this.TYPOGRAPHY_KEYS.includes(baseKey)) return 'typography';
        if (this.CONTAINER_KEYS.includes(baseKey)) return 'container';
        return 'widgetDefaults';
    },

    isThemeTokenReference: function (val) {
        if (val === undefined || val === null) return false;
        const s = String(val).trim();
        return s.charAt(0) === '@' && /^@[a-zA-Z][a-zA-Z0-9]*$/.test(s);
    },

    parseThemeTokenReference: function (val) {
        if (!this.isThemeTokenReference(val)) return null;
        return String(val).trim().slice(1);
    },

    normalizeColorLiteral: function (val) {
        if (val === undefined || val === null) return '';
        return String(val).trim().replace(/\s+/g, '').toLowerCase();
    },

    _legacyColorMatches: function (key, val) {
        const map = this.LEGACY_COLOR_TO_TOKEN();
        const rule = map[key];
        if (!rule) return null;
        const a = this.normalizeColorLiteral(val);
        const b = this.normalizeColorLiteral(rule.literal);
        if (a === b) return rule.token;
        return null;
    },

    /**
     * Convert plain legacy hex/rgba master values to @token where they match stock defaults.
     */
    migrateFlatColorStringsToTokens: function (flat) {
        if (!flat || typeof flat !== 'object') return false;
        const map = this.LEGACY_COLOR_TO_TOKEN();
        let changed = false;
        Object.keys(map).forEach((key) => {
            if (flat[key] === undefined || flat[key] === null) return;
            if (this.isThemeTokenReference(flat[key])) return;
            const token = this._legacyColorMatches(key, flat[key]);
            if (token) {
                flat[key] = '@' + token;
                changed = true;
            }
        });
        // Extra stock combinations not covered by single-key LEGACY map (same hex used elsewhere with different semantics).
        const extraSemantic = [
            ['canvasBgEnd', '#0f172a', 'surfaceAlt'],
            ['switchButtonInsideDefaultCol', '#0f172a', 'onAccent'],
            ['switchButtonInsideDefaultColOff', '#ffffff', 'thumb'],
            ['switchButtonInsideDefaultColOff', '#44403c', 'thumb'],
            ['switchIconColOff', '#ffffff', 'icon'],
            ['defaultListTimeColor', '#eab308', 'warning'],
            ['gaugeColIcon', '#22d3ee', 'icon'],
            ['defaultGraphGridHInnerCol', '#1e293b', 'surface'],
            ['defaultGraphGridVCol', '#1e293b', 'surface'],
            ['editboxFocusColor', '#06b6d4', 'glow'],
            ['menuItemBgHover', '#22d3ee', 'accentSoft'],
            ['arrowColGlow', '#0ea5e9', 'accentSecondary']
        ];
        extraSemantic.forEach(([key, literal, token]) => {
            if (flat[key] === undefined || flat[key] === null) return;
            if (this.isThemeTokenReference(flat[key])) return;
            if (this.normalizeColorLiteral(flat[key]) !== this.normalizeColorLiteral(literal)) return;
            flat[key] = '@' + token;
            changed = true;
        });
        return changed;
    },

    isLegacyFlatMaster: function (master) {
        if (!master || typeof master !== 'object') return false;
        if (master.connection && master.environment && master.theme && master.typography && master.container) return false;
        return master.dataDriver !== undefined || master.canvasBg !== undefined || master.fontFamily !== undefined;
    },

    isCanonicalNestedMaster: function (master) {
        if (!master || typeof master !== 'object') return false;
        if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.isV2Master === 'function') {
            if (!SaveFormatV2.isV2Master(master)) return false;
        } else {
            if (!master.connection || !master.environment || !master.typography || !master.container) return false;
        }
        if (!master.theme || typeof master.theme !== 'object' || !master.theme.colors) return false;
        const colors = master.theme.colors;
        const need = this.THEME_TOKEN_DEFS.length;
        let n = 0;
        this.THEME_TOKEN_DEFS.forEach((d) => {
            if (colors[d.key] !== undefined && colors[d.key] !== null && String(colors[d.key]).trim() !== '') n++;
        });
        return n >= need && master.widgetDefaults && typeof master.widgetDefaults === 'object';
    },

    /**
     * Flatten nested master to a single object for MASTER_SETTINGS (includes themeColors map).
     * Handles the environment.layout sub-object: expands it to flat layoutMode / layoutScale* /
     * layoutResponsive* keys so the rest of the app can read them from MASTER_SETTINGS directly.
     */
    expandMasterToFlat: function (nested) {
        if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.expandV2MasterToRuntime === 'function') {
            const converted = SaveFormatV2.isV2Master(nested)
                ? nested
                : SaveFormatV2.convertMasterToV2(nested);
            return SaveFormatV2.expandV2MasterToRuntime(converted);
        }
        const flat = {};
        if (!nested || typeof nested !== 'object') {
            flat.themeColors = this.defaultThemeColors();
            return flat;
        }
        const conn = nested.connection && typeof nested.connection === 'object' ? nested.connection : {};
        const env = nested.environment && typeof nested.environment === 'object' ? nested.environment : {};
        const typo = nested.typography && typeof nested.typography === 'object' ? nested.typography : {};
        const box = nested.container && typeof nested.container === 'object' ? nested.container : {};
        const wid = nested.widgetDefaults && typeof nested.widgetDefaults === 'object' ? nested.widgetDefaults : {};

        Object.assign(flat, conn, env, typo, box, wid);

        // Expand environment.layout nested sub-object into flat keys (canonical save format).
        // Flat keys already in env take precedence only when no nested layout object exists.
        const envLayout = (env.layout && typeof env.layout === 'object') ? env.layout : null;
        if (envLayout) {
            if (envLayout.mode !== undefined) flat.layoutMode = envLayout.mode;
            const sc = (envLayout.scale && typeof envLayout.scale === 'object') ? envLayout.scale : null;
            if (sc !== null && sc.keepAspectRatio !== undefined) flat.layoutScaleKeepAspect = sc.keepAspectRatio;
            const resp = (envLayout.responsive && typeof envLayout.responsive === 'object') ? envLayout.responsive : null;
            if (resp !== null) {
                if (resp.columnCount !== undefined) flat.layoutResponsiveColumnCount = resp.columnCount;
                if (resp.reduceColumnsToFit !== undefined) flat.layoutResponsiveReduceColumnsToFit = resp.reduceColumnsToFit;
                if (resp.minSize !== undefined) flat.layoutResponsiveMinSize = resp.minSize;
                if (resp.maxSize !== undefined) flat.layoutResponsiveMaxSize = resp.maxSize;
                if (resp.gap !== undefined) flat.layoutResponsiveGap = resp.gap;
                if (resp.align !== undefined) flat.layoutResponsiveAlign = resp.align;
                if (resp.minWidgetHeight !== undefined) flat.layoutResponsiveMinWidgetHeight = resp.minWidgetHeight;
                if (resp.pagePaddingLeft !== undefined) flat.layoutResponsivePagePaddingLeft = resp.pagePaddingLeft;
                if (resp.pagePaddingRight !== undefined) flat.layoutResponsivePagePaddingRight = resp.pagePaddingRight;
                if (resp.pagePaddingTop !== undefined) flat.layoutResponsivePagePaddingTop = resp.pagePaddingTop;
                if (resp.pagePaddingBottom !== undefined) flat.layoutResponsivePagePaddingBottom = resp.pagePaddingBottom;
            }
            // Remove the raw nested object from flat so MASTER_SETTINGS is clean.
            delete flat.layout;
        }

        const envAudio = (env.audio && typeof env.audio === 'object') ? env.audio : null;
        if (envAudio) {
            if (Array.isArray(envAudio.topicMap)) flat.audioTopicMap = envAudio.topicMap;
            delete flat.audio;
        }

        const envDialog = (env.dialogBox && typeof env.dialogBox === 'object') ? env.dialogBox : null;
        if (envDialog) {
            const appear = this.DIALOG_BOX_APPEARANCE;
            Object.keys(appear).forEach(function (flatKey) {
                const nestKey = appear[flatKey];
                if (envDialog[nestKey] !== undefined) flat[flatKey] = envDialog[nestKey];
            });
            const typo = (envDialog.typography && typeof envDialog.typography === 'object') ? envDialog.typography : null;
            if (typo) {
                const prefixes = this.DIALOG_BOX_TYPO_PREFIX;
                const suffixes = this.DIALOG_BOX_TYPO_SUFFIX;
                Object.keys(prefixes).forEach(function (prefix) {
                    const role = typo[prefixes[prefix]];
                    if (!role || typeof role !== 'object') return;
                    Object.keys(suffixes).forEach(function (suffix) {
                        const nestedProp = suffixes[suffix];
                        if (role[nestedProp] !== undefined) flat[prefix + suffix] = role[nestedProp];
                    });
                });
            }
            const icons = (envDialog.icons && typeof envDialog.icons === 'object') ? envDialog.icons : null;
            if (icons) {
                const iconPrefix = this.DIALOG_BOX_ICON_PREFIX;
                const iconSuffix = this.DIALOG_BOX_ICON_SUFFIX;
                Object.keys(iconPrefix).forEach(function (prefix) {
                    const slot = icons[iconPrefix[prefix]];
                    if (!slot || typeof slot !== 'object') return;
                    Object.keys(iconSuffix).forEach(function (suffix) {
                        const nestedProp = iconSuffix[suffix];
                        if (slot[nestedProp] !== undefined) flat[prefix + suffix] = slot[nestedProp];
                    });
                });
            }
            delete flat.dialogBox;
        }

        const qtRaw = (env.quickToolbar && typeof env.quickToolbar === 'object')
            ? env.quickToolbar
            : (flat.quickToolbar && typeof flat.quickToolbar === 'object' ? flat.quickToolbar : null);
        let qtColumns = qtRaw ? parseInt(qtRaw.columns, 10) : 1;
        if (!Number.isFinite(qtColumns) || qtColumns < 1) qtColumns = 1;
        if (qtColumns > 12) qtColumns = 12;
        let qtRows = qtRaw ? parseInt(qtRaw.rows, 10) : 0;
        if (!Number.isFinite(qtRows) || qtRows < 0) qtRows = 0;
        if (qtRows > 12) qtRows = 12;
        let qtX = qtRaw ? parseInt(qtRaw.x, 10) : 0;
        let qtY = qtRaw ? parseInt(qtRaw.y, 10) : 0;
        if (!Number.isFinite(qtX)) qtX = 0;
        if (!Number.isFinite(qtY)) qtY = 0;
        let qtVis = 'auto';
        if (qtRaw && (qtRaw.visibility === 'always' || qtRaw.visibility === 'never' || qtRaw.visibility === 'auto')) {
            qtVis = qtRaw.visibility;
        } else if (qtRaw && qtRaw.enabled === false) {
            qtVis = 'never';
        }
        flat.quickToolbar = {
            visibility: qtVis,
            enabled: qtVis !== 'never',
            mode: (qtRaw && qtRaw.mode === 'floating') ? 'floating' : 'docked',
            x: qtX,
            y: qtY,
            columns: qtColumns,
            rows: qtRows
        };

        const theme = nested.theme && nested.theme.colors && typeof nested.theme.colors === 'object'
            ? nested.theme.colors
            : null;
        flat.themeColors = theme ? { ...this.defaultThemeColors(), ...theme } : this.defaultThemeColors();

        flat._masterLayoutVersion = this.LAYOUT_VERSION;
        return flat;
    },

    /**
     * Build nested master from flat MASTER_SETTINGS-like object for save.
     */
    nestMasterForSave: function (flat) {
        if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.nestRuntimeBagToV2Master === 'function') {
            const nested = SaveFormatV2.nestRuntimeBagToV2Master(flat || {}, { omitResponsiveIfNotMode: true });
            if (!nested.theme || !nested.theme.colors || typeof nested.theme.colors !== 'object') {
                nested.theme = { colors: this.defaultThemeColors() };
            } else {
                nested.theme.colors = { ...this.defaultThemeColors(), ...nested.theme.colors };
            }
            return nested;
        }
        const out = {
            connection: {},
            environment: {},
            typography: {},
            container: {},
            theme: { colors: {} },
            widgetDefaults: {}
        };

        const themeColors = (flat && flat.themeColors && typeof flat.themeColors === 'object')
            ? { ...flat.themeColors }
            : this.defaultThemeColors();
        out.theme.colors = themeColors;

        const assigned = new Set(['themeColors', '_masterLayoutVersion']);
        const connSet = new Set(this.CONNECTION_KEYS);
        const envSet = new Set(this.ENVIRONMENT_KEYS);
        const typoSet = new Set(this.TYPOGRAPHY_KEYS);
        const boxSet = new Set(this.CONTAINER_KEYS);

        const pick = (dst, key, val) => {
            dst[key] = val;
            assigned.add(key);
        };

        if (!flat || typeof flat !== 'object') return out;

        Object.keys(flat).forEach((key) => {
            if (assigned.has(key)) return;
            const val = flat[key];
            const corrBase = this._correctionBaseKey(key);
            if (corrBase) {
                const bucket = this._bucketForBaseKey(corrBase);
                if (bucket === 'connection') pick(out.connection, key, val);
                else if (bucket === 'environment') pick(out.environment, key, val);
                else if (bucket === 'typography') pick(out.typography, key, val);
                else if (bucket === 'container') pick(out.container, key, val);
                else pick(out.widgetDefaults, key, val);
                return;
            }
            if (connSet.has(key)) pick(out.connection, key, val);
            else if (envSet.has(key)) pick(out.environment, key, val);
            else if (typoSet.has(key)) pick(out.typography, key, val);
            else if (boxSet.has(key)) pick(out.container, key, val);
            else pick(out.widgetDefaults, key, val);
        });

        delete out.widgetDefaults._masterLayoutVersion;

        // Fold flat layout keys from environment into the canonical nested environment.layout shape.
        // Remove them from the flat environment first, then build the sub-object.
        const lm  = out.environment.layoutMode;
        const lka = out.environment.layoutScaleKeepAspect;
        const lcc = out.environment.layoutResponsiveColumnCount;
        const lrf = out.environment.layoutResponsiveReduceColumnsToFit;
        const lmn = out.environment.layoutResponsiveMinSize;
        const lmx = out.environment.layoutResponsiveMaxSize;
        const lg  = out.environment.layoutResponsiveGap;
        const la  = out.environment.layoutResponsiveAlign;
        const lmh = out.environment.layoutResponsiveMinWidgetHeight;
        const lpl = out.environment.layoutResponsivePagePaddingLeft;
        const lpr = out.environment.layoutResponsivePagePaddingRight;
        const lpt = out.environment.layoutResponsivePagePaddingTop;
        const lpb = out.environment.layoutResponsivePagePaddingBottom;
        const hasLayout = lm !== undefined || lka !== undefined || lcc !== undefined || lrf !== undefined
            || lmn !== undefined || lmx !== undefined || lg !== undefined || la !== undefined || lmh !== undefined
            || lpl !== undefined || lpr !== undefined || lpt !== undefined || lpb !== undefined;
        if (hasLayout) {
            delete out.environment.layoutMode;
            delete out.environment.layoutScaleKeepAspect;
            delete out.environment.layoutResponsiveColumnMode;
            delete out.environment.layoutResponsiveColumnCount;
            delete out.environment.layoutResponsiveReduceColumnsToFit;
            delete out.environment.layoutResponsiveMinSize;
            delete out.environment.layoutResponsiveMaxSize;
            delete out.environment.layoutResponsiveGap;
            delete out.environment.layoutResponsiveAlign;
            delete out.environment.layoutResponsiveMinWidgetHeight;
            delete out.environment.layoutResponsivePagePaddingLeft;
            delete out.environment.layoutResponsivePagePaddingRight;
            delete out.environment.layoutResponsivePagePaddingTop;
            delete out.environment.layoutResponsivePagePaddingBottom;
            const layoutNode = {};
            if (lm !== undefined) layoutNode.mode = lm;
            if (lka !== undefined) {
                layoutNode.scale = { keepAspectRatio: lka };
            }
            if (lcc !== undefined || lrf !== undefined || lmn !== undefined || lmx !== undefined || lg !== undefined || la !== undefined || lmh !== undefined
                || lpl !== undefined || lpr !== undefined || lpt !== undefined || lpb !== undefined) {
                const resp = {};
                if (lcc !== undefined) resp.columnCount = lcc;
                if (lrf !== undefined) resp.reduceColumnsToFit = lrf;
                if (lmn !== undefined) resp.minSize = lmn;
                if (lmx !== undefined) resp.maxSize = lmx;
                if (lg !== undefined) resp.gap = lg;
                if (la !== undefined) resp.align = la;
                if (lmh !== undefined) resp.minWidgetHeight = lmh;
                if (lpl !== undefined) resp.pagePaddingLeft = lpl;
                if (lpr !== undefined) resp.pagePaddingRight = lpr;
                if (lpt !== undefined) resp.pagePaddingTop = lpt;
                if (lpb !== undefined) resp.pagePaddingBottom = lpb;
                // Only persist the responsive sub-object for responsive mode so fixed
                // and scale saves stay clean (isolation). The runtime flat values
                // remain in MASTER_SETTINGS for lossless switching back to responsive.
                if (lm === 'responsive') {
                    layoutNode.responsive = resp;
                }
            }
            out.environment.layout = layoutNode;
        }

        if (out.environment.audioTopicMap !== undefined) {
            const topicMap = Array.isArray(out.environment.audioTopicMap)
                ? out.environment.audioTopicMap
                : [];
            delete out.environment.audioTopicMap;
            out.environment.audio = { topicMap: topicMap };
        }

        const appearMap = this.DIALOG_BOX_APPEARANCE;
        const typoPrefix = this.DIALOG_BOX_TYPO_PREFIX;
        const typoSuffix = this.DIALOG_BOX_TYPO_SUFFIX;
        const dialogNode = {};
        let hasDialog = false;
        Object.keys(appearMap).forEach(function (flatKey) {
            if (out.environment[flatKey] !== undefined) {
                dialogNode[appearMap[flatKey]] = out.environment[flatKey];
                delete out.environment[flatKey];
                hasDialog = true;
            }
        });
        const typoNode = {};
        Object.keys(typoPrefix).forEach(function (prefix) {
            const role = {};
            let hasRole = false;
            Object.keys(typoSuffix).forEach(function (suffix) {
                const flatKey = prefix + suffix;
                if (out.environment[flatKey] !== undefined) {
                    role[typoSuffix[suffix]] = out.environment[flatKey];
                    delete out.environment[flatKey];
                    hasRole = true;
                    hasDialog = true;
                }
            });
            if (hasRole) typoNode[typoPrefix[prefix]] = role;
        });
        if (Object.keys(typoNode).length > 0) dialogNode.typography = typoNode;
        const iconPrefix = this.DIALOG_BOX_ICON_PREFIX;
        const iconSuffix = this.DIALOG_BOX_ICON_SUFFIX;
        const iconNode = {};
        Object.keys(iconPrefix).forEach(function (prefix) {
            const slot = {};
            let hasSlot = false;
            Object.keys(iconSuffix).forEach(function (suffix) {
                const flatKey = prefix + suffix;
                if (out.environment[flatKey] !== undefined) {
                    slot[iconSuffix[suffix]] = out.environment[flatKey];
                    delete out.environment[flatKey];
                    hasSlot = true;
                    hasDialog = true;
                }
            });
            if (hasSlot) iconNode[iconPrefix[prefix]] = slot;
        });
        if (Object.keys(iconNode).length > 0) dialogNode.icons = iconNode;
        if (hasDialog) out.environment.dialogBox = dialogNode;

        return out;
    },

    /**
     * Normalize legacy flat master root into nested canonical shape (mutates data.master).
     */
    normalizeMasterToNested: function (data) {
        if (!data || typeof data !== 'object') return false;
        let m = data.master;
        if (!m || typeof m !== 'object') {
            data.master = this.nestMasterForSave({});
            return true;
        }

        if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.convertMasterToV2 === 'function') {
            data.master = SaveFormatV2.convertMasterToV2(m);
            const tc = data.master.theme && data.master.theme.colors ? data.master.theme.colors : {};
            const defaults = this.defaultThemeColors();
            data.master.theme = data.master.theme || { colors: {} };
            data.master.theme.colors = { ...defaults, ...tc };
            this.THEME_TOKEN_DEFS.forEach((d) => {
                if (data.master.theme.colors[d.key] === undefined || data.master.theme.colors[d.key] === null || String(data.master.theme.colors[d.key]).trim() === '') {
                    data.master.theme.colors[d.key] = defaults[d.key];
                }
            });
            return true;
        }

        let changed = false;

        if (this.isLegacyFlatMaster(m)) {
            const flat = { ...m };
            const nested = this.nestMasterForSave(flat);
            data.master = nested;
            m = data.master;
            changed = true;
        }

        if (!this.isCanonicalNestedMaster(m)) {
            let flat = this.expandMasterToFlat(m);
            Object.keys(m).forEach((k) => {
                if (k === 'connection' || k === 'environment' || k === 'theme' || k === 'typography' || k === 'container' || k === 'widgetDefaults') return;
                if (flat[k] === undefined) flat[k] = m[k];
            });
            const reNested = this.nestMasterForSave(flat);
            data.master = reNested;
            changed = true;
        } else {
            const tc = m.theme.colors;
            const defaults = this.defaultThemeColors();
            let fill = false;
            this.THEME_TOKEN_DEFS.forEach((d) => {
                if (tc[d.key] === undefined || tc[d.key] === null || String(tc[d.key]).trim() === '') {
                    tc[d.key] = defaults[d.key];
                    fill = true;
                }
            });
            if (fill) changed = true;
        }

        const flatForTokens = this.expandMasterToFlat(data.master);
        if (this.migrateFlatColorStringsToTokens(flatForTokens)) {
            data.master = this.nestMasterForSave(flatForTokens);
            changed = true;
        }

        return changed;
    }
};

window.MasterLayout = MasterLayout;
