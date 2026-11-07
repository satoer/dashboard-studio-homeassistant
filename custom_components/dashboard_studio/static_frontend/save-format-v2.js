/**
 * V2 dashboard save format: nested, label-based keys on disk.
 * Runtime MASTER_SETTINGS stays a flat unique-key bag; nest/expand live here.
 * iOS 12: no optional chaining, no nullish assignment.
 */
(function (root) {
    'use strict';

    const TYPO_SUFFIX = {
        Font: 'fontFamily',
        Fs: 'fontSize',
        Align: 'textAlign',
        Case: 'textTransform',
        Bold: 'bold',
        Italic: 'italic',
        Col: 'color',
        ColOff: 'colorOff',
        ColFilled: 'colorFilled',
        Opacity: 'opacity',
        OffX: 'offsetX',
        OffY: 'offsetY',
        Fam: 'fontFamily',
        FamBold: 'bold',
        Size: 'fontSize',
        Color: 'color',
        FontBold: 'bold',
        FontSize: 'fontSize',
        FontColor: 'color'
    };

    const CONTAINER_FLAT_TO_PATH = {
        bgVisible: ['show'],
        bgColStart: ['background', 'startColor'],
        bgOpacityStart: ['background', 'startOpacity'],
        bgColEnd: ['background', 'endColor'],
        bgOpacityEnd: ['background', 'endOpacity'],
        bgAngle: ['background', 'angle'],
        bgBlur: ['background', 'blur'],
        glowEnabled: ['glow', 'enabled'],
        glowColor: ['glow', 'color'],
        glowRadius: ['glow', 'radius'],
        glowOpacity: ['glow', 'opacity'],
        borderColor: ['border', 'color'],
        borderWidth: ['border', 'width'],
        borderOpacity: ['border', 'opacity'],
        cornerRadius: ['border', 'cornerRadius'],
        innerGlow: ['innerGlow', 'size'],
        innerGlowColor: ['innerGlow', 'color'],
        innerGlowOpacity: ['innerGlow', 'opacity']
    };

    const MASTER_CONTAINER_FLAT_TO_PATH = {
        defaultWidth: ['width'],
        defaultHeight: ['height'],
        defaultPadding: ['padding'],
        bgVisible: ['show'],
        bgColStart: ['background', 'startColor'],
        bgOpacityStart: ['background', 'startOpacity'],
        bgColEnd: ['background', 'endColor'],
        bgOpacityEnd: ['background', 'endOpacity'],
        bgAngle: ['background', 'angle'],
        bgBlur: ['background', 'blur'],
        glowEnabled: ['glow', 'enabled'],
        glowColor: ['glow', 'color'],
        glowRadius: ['glow', 'radius'],
        glowOpacity: ['glow', 'opacity'],
        borderColor: ['border', 'color'],
        defaultBorderWidth: ['border', 'width'],
        defaultBorderOpacity: ['border', 'opacity'],
        defaultCornerRadius: ['border', 'cornerRadius'],
        innerGlow: ['innerGlow', 'size'],
        innerGlowColor: ['innerGlow', 'color'],
        innerGlowOpacity: ['innerGlow', 'opacity']
    };

    const CORE_RUNTIME_TO_PATH = {
        dataDriver: ['connection', 'dataDriver'],
        driverSettings: ['connection', 'driverSettings'],
        warnWhenDriverOffline: ['connection', 'warnWhenDriverOffline'],

        editorMode: ['environment', 'editorMode'],
        editorTooltips: ['environment', 'editorTooltips'],
        editorZoom: ['environment', 'editorZoom'],
        resetLookOnThemeApply: ['environment', 'resetLookOnThemeApply'],
        widgetLabelMode: ['environment', 'widgetLabelMode'],
        holdToActivateDuration: ['environment', 'holdToActivateDuration'],
        preloadImagesOnAllPages: ['environment', 'preloadImagesOnAllPages'],
        hideScrollbars: ['environment', 'hideScrollbars'],
        quickToolbar: ['environment', 'quickToolbar'],

        canvasWidth: ['environment', 'canvas', 'width'],
        canvasHeight: ['environment', 'canvas', 'height'],
        canvasPreset: ['environment', 'canvas', 'preset'],
        canvasBg: ['environment', 'canvas', 'background', 'startColor'],
        canvasBgOpacity: ['environment', 'canvas', 'background', 'startOpacity'],
        canvasBgEnd: ['environment', 'canvas', 'background', 'endColor'],
        canvasBgEndOpacity: ['environment', 'canvas', 'background', 'endOpacity'],
        canvasBgType: ['environment', 'canvas', 'background', 'type'],
        canvasBgAngle: ['environment', 'canvas', 'background', 'angle'],
        canvasBgOverlay: ['environment', 'canvas', 'background', 'overlay'],
        canvasImage: ['environment', 'canvas', 'background', 'image'],
        canvasBgSize: ['environment', 'canvas', 'background', 'size'],

        gridSize: ['environment', 'grid', 'size'],
        showGrid: ['environment', 'grid', 'show'],
        snapToGrid: ['environment', 'grid', 'snap'],

        currentPage: ['environment', 'paging', 'currentPage'],
        currentPageOutputTopic: ['environment', 'paging', 'currentPageOutputTopic'],
        inactivityPageEnabled: ['environment', 'paging', 'inactivityPageEnabled'],
        inactivityReturnPage: ['environment', 'paging', 'inactivityReturnPage'],
        inactivityTimeoutSeconds: ['environment', 'paging', 'inactivityTimeoutSeconds'],
        gestureTouchOnly: ['environment', 'gestures', 'touchOnly'],
        swipeLeftEnabled: ['environment', 'gestures', 'swipeLeft', 'enabled'],
        swipeLeftAction: ['environment', 'gestures', 'swipeLeft', 'action'],
        swipeLeftPage: ['environment', 'gestures', 'swipeLeft', 'page'],
        swipeLeftTopic: ['environment', 'gestures', 'swipeLeft', 'topic'],
        swipeLeftPayload: ['environment', 'gestures', 'swipeLeft', 'payload'],

        swipeRightEnabled: ['environment', 'gestures', 'swipeRight', 'enabled'],
        swipeRightAction: ['environment', 'gestures', 'swipeRight', 'action'],
        swipeRightPage: ['environment', 'gestures', 'swipeRight', 'page'],
        swipeRightTopic: ['environment', 'gestures', 'swipeRight', 'topic'],
        swipeRightPayload: ['environment', 'gestures', 'swipeRight', 'payload'],

        swipeUpEnabled: ['environment', 'gestures', 'swipeUp', 'enabled'],
        swipeUpAction: ['environment', 'gestures', 'swipeUp', 'action'],
        swipeUpPage: ['environment', 'gestures', 'swipeUp', 'page'],
        swipeUpTopic: ['environment', 'gestures', 'swipeUp', 'topic'],
        swipeUpPayload: ['environment', 'gestures', 'swipeUp', 'payload'],

        swipeDownEnabled: ['environment', 'gestures', 'swipeDown', 'enabled'],
        swipeDownAction: ['environment', 'gestures', 'swipeDown', 'action'],
        swipeDownPage: ['environment', 'gestures', 'swipeDown', 'page'],
        swipeDownTopic: ['environment', 'gestures', 'swipeDown', 'topic'],
        swipeDownPayload: ['environment', 'gestures', 'swipeDown', 'payload'],

        swipeIgnorePages: ['environment', 'gestures', 'paging', 'ignorePages'],
        swipeWrapAround: ['environment', 'gestures', 'paging', 'wrapAround'],

        theme: ['environment', 'theme'],

        layoutMode: ['environment', 'layout', 'mode'],
        layoutScaleKeepAspect: ['environment', 'layout', 'scale', 'keepAspectRatio'],
        layoutResponsiveColumnCount: ['environment', 'layout', 'responsive', 'columnCount'],
        layoutResponsiveReduceColumnsToFit: ['environment', 'layout', 'responsive', 'reduceColumnsToFit'],
        layoutResponsiveMinSize: ['environment', 'layout', 'responsive', 'minSize'],
        layoutResponsiveMaxSize: ['environment', 'layout', 'responsive', 'maxSize'],
        layoutResponsiveGap: ['environment', 'layout', 'responsive', 'gap'],
        layoutResponsiveAlign: ['environment', 'layout', 'responsive', 'align'],
        layoutResponsiveMinWidgetHeight: ['environment', 'layout', 'responsive', 'minWidgetHeight'],
        layoutResponsivePagePaddingLeft: ['environment', 'layout', 'responsive', 'pagePaddingLeft'],
        layoutResponsivePagePaddingRight: ['environment', 'layout', 'responsive', 'pagePaddingRight'],
        layoutResponsivePagePaddingTop: ['environment', 'layout', 'responsive', 'pagePaddingTop'],
        layoutResponsivePagePaddingBottom: ['environment', 'layout', 'responsive', 'pagePaddingBottom'],

        audioTopicMap: ['environment', 'audio', 'topicMap'],

        fontFamily: ['typography', 'fontFamily'],
        customFonts: ['typography', 'customFonts'],
        defaultTextAlign: ['typography', 'textAlign'],
        defaultTextVerticalAlign: ['typography', 'verticalAlign'],
        defaultFsGeneral: ['typography', 'base', 'fontSize'],
        defaultFsVal: ['typography', 'value', 'fontSize'],
        defaultColVal: ['typography', 'value', 'color'],
        defaultFsUnit: ['typography', 'unit', 'fontSize'],
        defaultFsLabel: ['typography', 'label', 'fontSize'],
        defaultColLabel: ['typography', 'label', 'color'],
        defaultLabelCase: ['typography', 'label', 'textTransform'],
        defaultLabelBold: ['typography', 'label', 'bold'],
        defaultLabelLineHeight: ['typography', 'label', 'lineHeight'],

        themeColors: ['theme', 'colors']
    };

    Object.keys(MASTER_CONTAINER_FLAT_TO_PATH).forEach(function (k) {
        CORE_RUNTIME_TO_PATH[k] = ['container'].concat(MASTER_CONTAINER_FLAT_TO_PATH[k]);
    });

    const WD = {};

    function addWD(type, key, path) {
        WD[key] = [type].concat(path);
    }

    function addTypo(type, prefix, rolePath) {
        Object.keys(TYPO_SUFFIX).forEach(function (suf) {
            addWD(type, prefix + suf, rolePath.concat([TYPO_SUFFIX[suf]]));
        });
    }

    function addIcon(type, prefix, slotPath) {
        addWD(type, prefix + 'Source', slotPath.concat(['source']));
        addWD(type, prefix + 'On', slotPath.concat(['builtin']));
        addWD(type, prefix + 'Builtin', slotPath.concat(['builtin']));
        addWD(type, prefix + 'Weight', slotPath.concat(['weight']));
        addWD(type, prefix + 'CustomUrl', slotPath.concat(['customUrl']));
        addWD(type, prefix + 'TintImage', slotPath.concat(['tintImage']));
        addWD(type, prefix + 'Filled', slotPath.concat(['weight']));
        addWD(type, prefix + 'OnFilled', slotPath.concat(['weight']));
        addWD(type, prefix + 'OffFilled', slotPath.concat(['weight']));
        addWD(type, prefix + 'ColOn', slotPath.concat(['color']));
        addWD(type, prefix + 'ColOff', slotPath.concat(['color']));
        addWD(type, prefix + 'ColHover', slotPath.concat(['hoverColor']));
        addWD(type, prefix + 'AccentOn', slotPath.concat(['accentColor']));
        addWD(type, prefix + 'AccentOff', slotPath.concat(['accentColor']));
        addWD(type, prefix + 'AccentColor', slotPath.concat(['accentColor']));
        addWD(type, prefix + 'Size', slotPath.concat(['size']));
        addWD(type, prefix + 'OffX', slotPath.concat(['offsetX']));
        addWD(type, prefix + 'OffY', slotPath.concat(['offsetY']));
        addWD(type, prefix + 'Color', slotPath.concat(['color']));
    }

    // --- switch ---
    addWD('switch', 'switchColOn', ['backgroundColorOn']);
    addWD('switch', 'switchColOff', ['backgroundColorOff']);
    addWD('switch', 'switchColHover', ['backgroundColorHover']);
    addWD('switch', 'switchColThumb', ['thumbColor']);
    addWD('switch', 'switchColLabel', ['labelColor']);
    addWD('switch', 'defaultSwitchMode', ['mode']);
    addWD('switch', 'defaultSwitchStyle', ['style']);
    addWD('switch', 'defaultSwitchAlign', ['buttonAlignment']);
    addWD('switch', 'defaultSwitchLabelPos', ['buttonLabelPosition']);
    addWD('switch', 'defaultSwitchLabelHint', ['labelHint']);
    addWD('switch', 'defaultSwitchBevel', ['bevel']);
    addWD('switch', 'defaultSwitchScale', ['scale']);
    addWD('switch', 'switchCornerRadius', ['buttonRadius']);
    addWD('switch', 'switchButtonContentInset', ['buttonContentInset']);
    addWD('switch', 'defaultSwitchShowIcon', ['showIcon']);
    addWD('switch', 'switchGlow', ['enableGlow']);
    addWD('switch', 'switchGlowColor', ['glowColor']);
    addWD('switch', 'switchGlowRadius', ['glowRadius']);
    addWD('switch', 'switchOutlineWidth', ['outlineWidth']);
    addWD('switch', 'switchOutlineColor', ['outlineColor']);
    addWD('switch', 'switchBackgroundOpacity', ['backgroundOpacity']);
    addWD('switch', 'switchOutlineOpacity', ['outlineOpacity']);
    addWD('switch', 'switchButtonBlur', ['buttonBlur']);
    addWD('switch', 'switchButtonInnerGlow', ['buttonInnerGlow']);
    addWD('switch', 'switchButtonInnerGlowColor', ['buttonInnerGlowColor']);
    addWD('switch', 'switchButtonInnerGlowOpacity', ['buttonInnerGlowOpacity']);
    addWD('switch', 'switchThumbOutlineWidth', ['thumbOutlineWidth']);
    addWD('switch', 'switchThumbOutlineColor', ['thumbOutlineColor']);
    addWD('switch', 'switchThumbOutlineOpacity', ['thumbOutlineOpacity']);
    addWD('switch', 'switchThumbInnerGlow', ['thumbInnerGlow']);
    addWD('switch', 'switchThumbInnerGlowColor', ['thumbInnerGlowColor']);
    addWD('switch', 'switchThumbInnerGlowOpacity', ['thumbInnerGlowOpacity']);
    addWD('switch', 'defaultSwitchIconSize', ['icons', 'on', 'size']);
    addWD('switch', 'defaultSwitchIconOffX', ['icons', 'on', 'offsetX']);
    addWD('switch', 'defaultSwitchIconOffY', ['icons', 'on', 'offsetY']);
    addWD('switch', 'defaultSwitchIconOn', ['icons', 'on', 'builtin']);
    addWD('switch', 'switchIconColOn', ['icons', 'on', 'color']);
    addWD('switch', 'switchIconColOff', ['icons', 'off', 'color']);
    addWD('switch', 'switchIconColHover', ['icons', 'on', 'hoverColor']);
    addTypo('switch', 'switchButtonOutsideDefault', ['typography', 'buttonLabelOutside']);
    addTypo('switch', 'switchButtonInsideDefault', ['typography', 'buttonLabelInside']);

    // --- menu ---
    addWD('menu', 'menuItemSpacing', ['itemSpacing']);
    addWD('menu', 'menuItemRadius', ['itemCornerRadius']);
    addWD('menu', 'menuIconColOn', ['icons', 'on', 'color']);
    addWD('menu', 'menuIconColOff', ['icons', 'off', 'color']);
    addWD('menu', 'menuIconAccentOn', ['icons', 'on', 'accentColor']);
    addWD('menu', 'menuIconAccentOff', ['icons', 'off', 'accentColor']);
    addWD('menu', 'menuIconSize', ['icons', 'on', 'size']);
    addWD('menu', 'menuItemBgOn', ['itemBackgroundOn']);
    addWD('menu', 'menuItemBgOnOpacity', ['itemBackgroundOnOpacity']);
    addWD('menu', 'menuItemBgOff', ['itemBackgroundOff']);
    addWD('menu', 'menuItemBgOffOpacity', ['itemBackgroundOffOpacity']);
    addWD('menu', 'menuItemBgHover', ['itemBackgroundHover']);
    addWD('menu', 'menuItemBgHoverOpacity', ['itemBackgroundHoverOpacity']);
    addWD('menu', 'menuItemOutlineWidth', ['itemOutlineWidth']);
    addWD('menu', 'menuItemOutlineColor', ['itemOutlineColor']);
    addWD('menu', 'menuItemOutlineOpacity', ['itemOutlineOpacity']);
    addWD('menu', 'menuItemBlur', ['itemBlur']);
    addWD('menu', 'menuItemInnerGlow', ['itemInnerGlow']);
    addWD('menu', 'menuItemInnerGlowColor', ['itemInnerGlowColor']);
    addWD('menu', 'menuItemInnerGlowOpacity', ['itemInnerGlowOpacity']);
    addWD('menu', 'menuSpacerStyle', ['spacerStyle']);
    addWD('menu', 'menuSpacerAmount', ['spacerAmount']);
    addWD('menu', 'menuSpacerColor', ['spacerColor']);
    addWD('menu', 'menuItemColOff', ['itemColorOff']);
    addWD('menu', 'menuDefaultLabelHint', ['labelHint']);
    addTypo('menu', 'menuDefaultItem', ['typography', 'item']);

    // --- label ---
    addWD('label', 'labelDefaultWAuto', ['widthAuto']);
    addWD('label', 'labelDefaultHAuto', ['heightAuto']);
    addTypo('label', 'labelDefault', ['typography', 'widgetLabel']);

    // --- text ---
    addWD('text', 'textMdTextWrap', ['textWrap']);
    addWD('text', 'textMdLinkTarget', ['linkTarget']);
    addWD('text', 'textMdAutoFitText', ['autoFitText']);
    addWD('text', 'textMdOverflowScroll', ['overflowScroll']);
    addWD('text', 'textMdParaBlockSpace', ['paragraphBlockSpace']);
    addWD('text', 'textMdH1BlockSpace', ['h1BlockSpace']);
    addWD('text', 'textMdH2BlockSpace', ['h2BlockSpace']);
    addWD('text', 'textMdH3BlockSpace', ['h3BlockSpace']);
    addWD('text', 'textMdThBlockSpace', ['thBlockSpace']);
    addWD('text', 'textMdTdBlockSpace', ['tdBlockSpace']);
    addWD('text', 'textMdBlockTypographyBlockSpace', ['blockTypographyBlockSpace']);
    addWD('text', 'textMdBlockTypographyLineHeight', ['blockTypographyLineHeight']);
    addWD('text', 'textMdSyncTableColumnWidths', ['syncTableColumnWidths']);
    addWD('text', 'textMdEqualTableColumnWidths', ['equalTableColumnWidths']);
    addWD('text', 'textMdTableColumnWidthPx', ['tableColumnWidth']);
    addWD('text', 'textMdTableStyle', ['tableStyle']);
    addWD('text', 'textMdCalendarWeekStart', ['calendarWeekStart']);
    addWD('text', 'textMdTableBorderRadius', ['tableBorderRadius']);
    addWD('text', 'textMdTableCellPadding', ['tableCellPadding']);
    addWD('text', 'textMdTableBorderColor', ['tableBorderColor']);
    addWD('text', 'textMdTableBorderOpacity', ['tableBorderOpacity']);
    addWD('text', 'textMdSeparatorColor', ['separatorColor']);
    addWD('text', 'textMdSeparatorOpacity', ['separatorOpacity']);
    addWD('text', 'textMdTableHeaderBg', ['tableHeaderBackground']);
    addWD('text', 'textMdTableHeaderBgOpacity', ['tableHeaderBackgroundOpacity']);
    addWD('text', 'textMdTableHeaderAccentBg', ['tableHeaderAccentBackground']);
    addWD('text', 'textMdTableHeaderAccentBgOpacity', ['tableHeaderAccentBackgroundOpacity']);
    addWD('text', 'textMdTableRowBg', ['tableRowBackground']);
    addWD('text', 'textMdTableRowBgOpacity', ['tableRowBackgroundOpacity']);
    addWD('text', 'textMdTableRowAltBg', ['tableRowAltBackground']);
    addWD('text', 'textMdTableRowAltBgOpacity', ['tableRowAltBackgroundOpacity']);
    addWD('text', 'textMdHrColor', ['hrColor']);
    addWD('text', 'textMdHrOpacity', ['hrOpacity']);
    addWD('text', 'textMdIconColor', ['iconColor']);
    addWD('text', 'textMdIconOpacity', ['iconOpacity']);
    addWD('text', 'textMdIconWeight', ['iconWeight']);
    addWD('text', 'textMdIconAccentColor', ['iconAccentColor']);
    addWD('text', 'textMdIconAccentOpacity', ['iconAccentOpacity']);
    addWD('text', 'textMdBlock1Color', ['block1Color']);
    addWD('text', 'textMdBlock2Color', ['block2Color']);
    addWD('text', 'textMdBlock3Color', ['block3Color']);
    addWD('text', 'textMdBlock4Color', ['block4Color']);
    addWD('text', 'textMdCodeCol', ['codeColor']);
    addWD('text', 'textMdCodeBg', ['codeBackground']);
    addWD('text', 'defaultTextContentAnimationOnLiveTopics', ['contentAnimationOnLiveTopics']);
    addTypo('text', 'textMdPara', ['typography', 'paragraph']);
    addTypo('text', 'textMdBlockTypography', ['typography', 'block']);
    addTypo('text', 'textMdH1', ['typography', 'h1']);
    addTypo('text', 'textMdH2', ['typography', 'h2']);
    addTypo('text', 'textMdH3', ['typography', 'h3']);
    addTypo('text', 'textMdTh', ['typography', 'th']);
    addTypo('text', 'textMdTd', ['typography', 'td']);

    // --- gauge ---
    addWD('gauge', 'gaugeCol0', ['startColor']);
    addWD('gauge', 'gaugeCol100', ['endColor']);
    addWD('gauge', 'gaugeColTrack', ['trackColor']);
    addWD('gauge', 'gaugeColVal', ['valueColor']);
    addWD('gauge', 'gaugeColUnit', ['unitColor']);
    addWD('gauge', 'gaugeColIcon', ['icons', 'on', 'color']);
    addWD('gauge', 'gaugeBarGlow', ['barGlow']);
    addWD('gauge', 'defaultGaugeBarThick', ['barThickness']);
    addWD('gauge', 'defaultGaugeTrackThick', ['trackThickness']);
    addWD('gauge', 'defaultGaugeRoundGap', ['roundGap']);
    addWD('gauge', 'defaultGaugeHorizontalGap', ['horizontalGap']);
    addWD('gauge', 'defaultGaugeSizeOffset', ['sizeOffset']);
    addWD('gauge', 'defaultGaugeType', ['barType']);
    addWD('gauge', 'defaultGaugeLayout', ['layoutRound']);
    addWD('gauge', 'defaultGaugeRoundLayout', ['layoutRound']);
    addWD('gauge', 'defaultGaugeHorizontalLayout', ['layoutHorizontal']);
    addWD('gauge', 'defaultGaugeAbbreviateLargeValues', ['abbreviateLargeValues']);
    addWD('gauge', 'defaultGaugeKeepTrailingZeros', ['keepTrailingZeros']);
    addWD('gauge', 'defaultGaugeCustomDisplayRange', ['customDisplayRange']);
    addWD('gauge', 'defaultGaugeDisplayMin', ['displayMin']);
    addWD('gauge', 'defaultGaugeDisplayMax', ['displayMax']);
    addWD('gauge', 'defaultGaugeDisplayDecimalPlaces', ['displayDecimalPlaces']);
    addWD('gauge', 'defaultGaugeDisplayKeepTrailingZeros', ['displayKeepTrailingZeros']);
    addWD('gauge', 'defaultGaugeSolidBarColor', ['solidBarColor']);
    addWD('gauge', 'defaultGaugeBoldVal', ['typography', 'value', 'bold']);
    addWD('gauge', 'defaultGaugeValueFont', ['typography', 'value', 'fontFamily']);
    addWD('gauge', 'defaultGaugeShowIcon', ['showIcon']);
    addWD('gauge', 'defaultGaugeIconSource', ['icons', 'on', 'source']);
    addWD('gauge', 'defaultGaugeIconOn', ['icons', 'on', 'builtin']);
    addWD('gauge', 'defaultGaugeIconWeight', ['icons', 'on', 'weight']);
    addWD('gauge', 'defaultGaugeIconCustomUrl', ['icons', 'on', 'customUrl']);
    addWD('gauge', 'defaultGaugeIconTintImage', ['icons', 'on', 'tintImage']);
    addWD('gauge', 'defaultGaugeIconSize', ['icons', 'on', 'size']);
    addWD('gauge', 'defaultGaugeIconOffX', ['icons', 'on', 'offsetX']);
    addWD('gauge', 'defaultGaugeIconOffY', ['icons', 'on', 'offsetY']);
    addWD('gauge', 'defaultGaugeTrackOutlineWidth', ['trackOutlineWidth']);
    addWD('gauge', 'defaultGaugeTrackOutlineColor', ['trackOutlineColor']);
    addWD('gauge', 'defaultGaugeTrackOpacity', ['trackOpacity']);
    addWD('gauge', 'defaultGaugeTrackOutlineOpacity', ['trackOutlineOpacity']);
    addWD('gauge', 'defaultGaugeTrackBlur', ['trackBlur']);
    addWD('gauge', 'defaultGaugeTrackInnerGlow', ['trackInnerGlow']);
    addWD('gauge', 'defaultGaugeTrackInnerGlowColor', ['trackInnerGlowColor']);
    addWD('gauge', 'defaultGaugeTrackInnerGlowOpacity', ['trackInnerGlowOpacity']);
    addWD('gauge', 'defaultGaugeBarOpacity', ['barOpacity']);
    addWD('gauge', 'defaultGaugeBarOutlineWidth', ['barOutlineWidth']);
    addWD('gauge', 'defaultGaugeBarOutlineColor', ['barOutlineColor']);
    addWD('gauge', 'defaultGaugeBarOutlineOpacity', ['barOutlineOpacity']);
    addWD('gauge', 'defaultGaugeBarInnerGlow', ['barInnerGlow']);
    addWD('gauge', 'defaultGaugeBarInnerGlowColor', ['barInnerGlowColor']);
    addWD('gauge', 'defaultGaugeBarInnerGlowOpacity', ['barInnerGlowOpacity']);
    addWD('gauge', 'defaultGaugeCaptionAlignRound', ['captionAlignRound']);
    addWD('gauge', 'defaultGaugeCaptionAlignHoriz', ['captionAlignHorizontal']);
    addTypo('gauge', 'defaultGaugeCaption', ['typography', 'caption']);
    addTypo('gauge', 'defaultGaugeValue', ['typography', 'value']);
    addTypo('gauge', 'defaultGaugeUnit', ['typography', 'unit']);
    addTypo('gauge', 'defaultGaugeAxis', ['typography', 'axis']);

    // --- slider ---
    addWD('slider', 'sliderColTrack', ['trackColor']);
    addWD('slider', 'sliderColFill', ['fillColor']);
    addWD('slider', 'sliderColThumb', ['thumbColor']);
    addWD('slider', 'sliderColVal', ['valueColor']);
    addWD('slider', 'defaultSliderTrackThick', ['trackThickness']);
    addWD('slider', 'defaultSliderFillThick', ['fillThickness']);
    addWD('slider', 'defaultSliderThumbSz', ['thumbSize']);
    addWD('slider', 'defaultSliderThumbShadow', ['thumbShadow']);
    addWD('slider', 'defaultSliderShowVal', ['showValue']);
    addWD('slider', 'defaultSliderValueLocation', ['valueLocation']);
    addWD('slider', 'defaultSliderLabelLocation', ['labelLocation']);
    addWD('slider', 'defaultSliderVertical', ['vertical']);
    addWD('slider', 'defaultSliderAllowDecimals', ['allowDecimals']);
    addWD('slider', 'defaultSliderStepSize', ['stepSize']);
    addWD('slider', 'defaultSliderCustomDisplayRange', ['customDisplayRange']);
    addWD('slider', 'defaultSliderDisplayMin', ['displayMin']);
    addWD('slider', 'defaultSliderDisplayMax', ['displayMax']);
    addWD('slider', 'defaultSliderDisplayDecimalPlaces', ['displayDecimalPlaces']);
    addWD('slider', 'defaultSliderDisplayKeepTrailingZeros', ['displayKeepTrailingZeros']);
    addWD('slider', 'defaultSliderTrackOutlineWidth', ['trackOutlineWidth']);
    addWD('slider', 'defaultSliderTrackOutlineColor', ['trackOutlineColor']);
    addWD('slider', 'defaultSliderTrackOpacity', ['trackOpacity']);
    addWD('slider', 'defaultSliderTrackOutlineOpacity', ['trackOutlineOpacity']);
    addWD('slider', 'defaultSliderTrackBlur', ['trackBlur']);
    addWD('slider', 'defaultSliderTrackInnerGlow', ['trackInnerGlow']);
    addWD('slider', 'defaultSliderTrackInnerGlowColor', ['trackInnerGlowColor']);
    addWD('slider', 'defaultSliderTrackInnerGlowOpacity', ['trackInnerGlowOpacity']);
    addWD('slider', 'defaultSliderFillOpacity', ['fillOpacity']);
    addWD('slider', 'defaultSliderFillOutlineWidth', ['fillOutlineWidth']);
    addWD('slider', 'defaultSliderFillOutlineColor', ['fillOutlineColor']);
    addWD('slider', 'defaultSliderFillOutlineOpacity', ['fillOutlineOpacity']);
    addWD('slider', 'defaultSliderFillInnerGlow', ['fillInnerGlow']);
    addWD('slider', 'defaultSliderFillInnerGlowColor', ['fillInnerGlowColor']);
    addWD('slider', 'defaultSliderFillInnerGlowOpacity', ['fillInnerGlowOpacity']);
    addWD('slider', 'defaultSliderThumbOutlineWidth', ['thumbOutlineWidth']);
    addWD('slider', 'defaultSliderThumbOutlineColor', ['thumbOutlineColor']);
    addWD('slider', 'defaultSliderThumbOutlineOpacity', ['thumbOutlineOpacity']);
    addWD('slider', 'defaultSliderThumbInnerGlow', ['thumbInnerGlow']);
    addWD('slider', 'defaultSliderThumbInnerGlowColor', ['thumbInnerGlowColor']);
    addWD('slider', 'defaultSliderThumbInnerGlowOpacity', ['thumbInnerGlowOpacity']);
    addTypo('slider', 'defaultSliderVal', ['typography', 'value']);
    addTypo('slider', 'defaultSliderLabel', ['typography', 'caption']);
    addTypo('slider', 'defaultSliderUnit', ['typography', 'unit']);

    // --- battery ---
    addWD('battery', 'battColGood', ['goodColor']);
    addWD('battery', 'battColLow', ['lowColor']);
    addWD('battery', 'battColBorder', ['borderColor']);
    addWD('battery', 'battColEmpty', ['emptyColor']);
    addWD('battery', 'defaultBatteryVertical', ['vertical']);
    addWD('battery', 'defaultBatterySegments', ['segments']);
    addWD('battery', 'defaultBatteryLowThresh', ['lowThreshold']);
    addWD('battery', 'defaultBatteryOutlineWidth', ['outlineWidth']);
    addWD('battery', 'defaultBatteryInnerPad', ['innerPadding']);
    addWD('battery', 'defaultBatteryTerminalSz', ['terminalSize']);

    // --- image ---
    addWD('image', 'defaultImageFit', ['fitContainer']);
    addWD('image', 'defaultImageProp', ['proportional']);
    addWD('image', 'defaultImageScale', ['scale']);
    addWD('image', 'defaultImageOpacity', ['opacity']);
    addWD('image', 'defaultImageFallbackUrl', ['fallbackUrl']);

    // --- icon ---
    addWD('icon', 'iconActive', ['icons', 'on', 'color']);
    addWD('icon', 'iconInactive', ['icons', 'off', 'color']);
    addWD('icon', 'defaultIconFilled', ['filled']);
    addWD('icon', 'defaultIconSize', ['size']);
    addWD('icon', 'defaultIconAnimSpeed', ['animSpeed']);
    addWD('icon', 'defaultIconBlink', ['blink']);
    addWD('icon', 'defaultIconGlowOnActive', ['glowOnActive']);
    addWD('icon', 'defaultIconWidgetSource', ['icons', 'off', 'source']);
    addWD('icon', 'defaultIconWidgetBuiltin', ['icons', 'off', 'builtin']);
    addWD('icon', 'defaultIconWidgetWeight', ['icons', 'off', 'weight']);
    addWD('icon', 'defaultIconWidgetCustomUrl', ['icons', 'off', 'customUrl']);
    addWD('icon', 'defaultIconWidgetTintImage', ['icons', 'off', 'tintImage']);
    addWD('icon', 'defaultIconWidgetAccentColor', ['icons', 'off', 'accentColor']);
    addWD('icon', 'defaultIconWidgetActiveSource', ['icons', 'on', 'source']);
    addWD('icon', 'defaultIconWidgetActiveBuiltin', ['icons', 'on', 'builtin']);
    addWD('icon', 'defaultIconWidgetActiveWeight', ['icons', 'on', 'weight']);
    addWD('icon', 'defaultIconWidgetActiveCustomUrl', ['icons', 'on', 'customUrl']);
    addWD('icon', 'defaultIconWidgetActiveTintImage', ['icons', 'on', 'tintImage']);
    addWD('icon', 'defaultIconWidgetActiveAccentColor', ['icons', 'on', 'accentColor']);
    addTypo('icon', 'defaultIconCaption', ['typography', 'caption']);

    // --- list ---
    addWD('list', 'defaultListShowIcons', ['showIcons']);
    addWD('list', 'defaultListShowTimestamp', ['showTimestamp']);
    addWD('list', 'defaultListMaxLines', ['maxLines']);
    addWD('list', 'defaultListRawMode', ['rawMode']);
    addWD('list', 'defaultListIconSize', ['iconSize']);
    addWD('list', 'defaultListIconColor', ['iconColor']);
    addWD('list', 'defaultListIconGap', ['iconGap']);
    addWD('list', 'defaultListTextColor', ['textColor']);
    addWD('list', 'defaultListFontSize', ['fontSize']);
    addWD('list', 'defaultListGap', ['gap']);
    addWD('list', 'defaultListTextWrap', ['textWrap']);
    addWD('list', 'defaultListLineHeight', ['lineHeight']);
    addWD('list', 'defaultListCase', ['textTransform']);
    addWD('list', 'defaultListFont', ['fontFamily']);
    addWD('list', 'defaultListFontBold', ['bold']);
    addWD('list', 'defaultListTimeSize', ['timeSize']);
    addWD('list', 'defaultListTimeColor', ['timeColor']);
    addWD('list', 'defaultListTimeFormat', ['timeFormat']);
    addWD('list', 'defaultListTime24h', ['time24h']);
    addWD('list', 'defaultListDateFormat', ['dateFormat']);

    // --- lightgrid ---
    addWD('lightgrid', 'defaultLightGridPresets', ['presets']);
    addWD('lightgrid', 'lgPresetCols', ['presetColumns']);
    addWD('lightgrid', 'lgPresetRows', ['presetRows']);
    addWD('lightgrid', 'lgPresetGap', ['presetGap']);
    addWD('lightgrid', 'lgPresetIndicators', ['presetIndicators']);
    addWD('lightgrid', 'lgCols', ['columns']);
    addWD('lightgrid', 'lgItemHeight', ['itemHeight']);
    addWD('lightgrid', 'lgItemWidth', ['itemWidth']);
    addWD('lightgrid', 'lgItemSpacing', ['itemSpacing']);
    addWD('lightgrid', 'lgAutoDeselect', ['autoDeselect']);
    addWD('lightgrid', 'lgDeselectTime', ['deselectTime']);
    addWD('lightgrid', 'lgUseLightColor', ['useLightColor']);
    addWD('lightgrid', 'lgIconSize', ['iconSize']);
    addWD('lightgrid', 'lgIconColOff', ['iconColorOff']);
    addWD('lightgrid', 'lgIconColOn', ['iconColorOn']);
    addWD('lightgrid', 'lgIconColorize', ['iconColorize']);
    addWD('lightgrid', 'lgColTileBg', ['tileBackgroundColor']);
    addWD('lightgrid', 'lgColTileHover', ['tileHoverColor']);
    addWD('lightgrid', 'lgTileBackgroundOpacity', ['tileBackgroundOpacity']);
    addWD('lightgrid', 'lgTileOutlineWidth', ['tileOutlineWidth']);
    addWD('lightgrid', 'lgTileOutlineColor', ['tileOutlineColor']);
    addWD('lightgrid', 'lgTileOutlineOpacity', ['tileOutlineOpacity']);
    addWD('lightgrid', 'lgTileBlur', ['tileBlur']);
    addWD('lightgrid', 'lgTileInnerGlow', ['tileInnerGlow']);
    addWD('lightgrid', 'lgTileInnerGlowColor', ['tileInnerGlowColor']);
    addWD('lightgrid', 'lgTileInnerGlowOpacity', ['tileInnerGlowOpacity']);
    addWD('lightgrid', 'lgColTileText', ['tileTextColor']);
    addWD('lightgrid', 'lgColToggleOn', ['toggleColorOn']);
    addWD('lightgrid', 'lgColToggleOff', ['toggleColorOff']);
    addWD('lightgrid', 'lgTileFont', ['tileFontFamily']);
    addWD('lightgrid', 'lgTileFontBold', ['tileBold']);
    addWD('lightgrid', 'lgPopoverW', ['popoverWidth']);
    addWD('lightgrid', 'lgPopoverH', ['popoverHeight']);
    addTypo('lightgrid', 'defaultLgWidgetLabel', ['typography', 'widgetLabel']);
    addTypo('lightgrid', 'defaultLgLightName', ['typography', 'lightName']);
    addTypo('lightgrid', 'defaultLgPanelTitle', ['typography', 'panelTitle']);

    // --- graph ---
    addWD('graph', 'defaultGraphType', ['chartType']);
    addWD('graph', 'defaultGraphSmoothingAmount', ['smoothingAmount']);
    addWD('graph', 'defaultGraphLineW', ['lineWidth']);
    addWD('graph', 'defaultGraphBarDirection', ['barDirection']);
    addWD('graph', 'defaultGraphBarGroupMode', ['barGroupMode']);
    addWD('graph', 'defaultGraphBarStackGapStep', ['barStackGapStep']);
    addWD('graph', 'defaultGraphPositiveColorOpacity', ['positiveColorOpacity']);
    addWD('graph', 'defaultGraphNegativeColorOpacity', ['negativeColorOpacity']);
    addWD('graph', 'defaultGraphPositiveStartOpacity', ['positiveStartOpacity']);
    addWD('graph', 'defaultGraphPositiveEndOpacity', ['positiveEndOpacity']);
    addWD('graph', 'defaultGraphNegativeStartOpacity', ['negativeStartOpacity']);
    addWD('graph', 'defaultGraphNegativeEndOpacity', ['negativeEndOpacity']);
    addWD('graph', 'defaultGraphBufferMode', ['bufferMode']);
    addWD('graph', 'defaultGraphDurationPreset', ['durationPreset']);
    addWD('graph', 'defaultGraphDurationCustomValue', ['durationCustomValue']);
    addWD('graph', 'defaultGraphDurationCustomUnit', ['durationCustomUnit']);
    addWD('graph', 'defaultGraphFixedTimeWindow', ['fixedTimeWindow']);
    addWD('graph', 'defaultGraphTimelineAdvance', ['timelineAdvance']);
    addWD('graph', 'defaultGraphReverseDirection', ['reverseDirection']);
    addWD('graph', 'defaultGraphLineGaps', ['lineGaps']);
    addWD('graph', 'defaultGraphBarGap', ['barGap']);
    addWD('graph', 'defaultGraphBarRadius', ['barRadius']);
    addWD('graph', 'graphBarOutlineColor', ['barOutlineColor']);
    addWD('graph', 'graphBarOutlineWidth', ['barOutlineWidth']);
    addWD('graph', 'graphNegBarOutlineColor', ['negativeBarOutlineColor']);
    addWD('graph', 'defaultGraphPointShow', ['showPoints']);
    addWD('graph', 'defaultGraphPointSize', ['pointSize']);
    addWD('graph', 'defaultGraphAnimation', ['animation']);
    addWD('graph', 'defaultGraphAnimDuration', ['animationDuration']);
    addWD('graph', 'defaultGraphAnimStreamDuration', ['animationStreamDuration']);
    addWD('graph', 'defaultGraphAnimShimmer', ['animationShimmer']);
    addWD('graph', 'defaultGraphAnimStaggerBars', ['animationStaggerBars']);
    addWD('graph', 'defaultGraphDynamicFloor', ['dynamicFloor', 'autoMin']);
    addWD('graph', 'defaultGraphDynamicCeiling', ['dynamicCeiling', 'autoMax']);
    addWD('graph', 'defaultGraphAutoMin', ['dynamicFloor', 'autoMin']);
    addWD('graph', 'defaultGraphAutoMax', ['dynamicCeiling', 'autoMax']);
    addWD('graph', 'defaultGraphUseBaseline', ['useBaseline']);
    addWD('graph', 'defaultGraphBaselineVal', ['baselineValue']);
    addWD('graph', 'defaultGraphNegMode', ['negativeMode']);
    addWD('graph', 'defaultGraphDecimals', ['decimals']);
    addWD('graph', 'defaultGraphRoundingMode', ['roundingMode']);
    addWD('graph', 'defaultGraphAbbreviateLargeValues', ['abbreviateLargeValues']);
    addWD('graph', 'defaultGraphHeadroom', ['headroom']);
    addWD('graph', 'defaultGraphTextFont', ['typography', 'dataText', 'fontFamily']);
    addWD('graph', 'defaultGraphTextSize', ['typography', 'dataText', 'fontSize']);
    addWD('graph', 'defaultGraphTextColor', ['typography', 'dataText', 'color']);
    addWD('graph', 'defaultGraphTextFontBold', ['typography', 'dataText', 'bold']);
    addWD('graph', 'defaultGraphMaxPoints', ['maxPoints']);
    addWD('graph', 'defaultGraphScrollDir', ['scrollDirection']);
    addWD('graph', 'defaultGraphOffX', ['offsetX']);
    addWD('graph', 'defaultGraphOffY', ['offsetY']);
    addWD('graph', 'defaultGraphShowAxisX', ['showAxisX']);
    addWD('graph', 'defaultGraphTimeFormat', ['timeFormat']);
    addWD('graph', 'defaultGraphTime24h', ['time24h']);
    addWD('graph', 'defaultGraphDateFormat', ['dateFormat']);
    addWD('graph', 'defaultGraphConvertToLocalTime', ['convertToLocalTime']);
    addWD('graph', 'defaultGraphTimeOffset', ['timeOffset']);
    addWD('graph', 'defaultGraphTimezoneConvert', ['timezoneConvert']);
    addWD('graph', 'defaultGraphAxisXRotation', ['typography', 'axisX', 'rotation']);
    addWD('graph', 'defaultGraphAxisYRotation', ['typography', 'axisY', 'rotation']);
    addWD('graph', 'defaultGraphAxisXLabel', ['axisXLabel']);
    addWD('graph', 'defaultGraphAxisYLabel', ['axisYLabel']);
    addWD('graph', 'defaultGraphShowLegend', ['showLegend']);
    addWD('graph', 'defaultGraphLegendPosition', ['legendPosition']);
    addWD('graph', 'defaultGraphLegendLayout', ['legendLayout']);
    addWD('graph', 'defaultGraphLegendSwatch', ['legendSwatch']);
    addWD('graph', 'defaultGraphLegendShowContainer', ['legendShowContainer']);
    addWD('graph', 'defaultGraphLegendAutoSize', ['legendAutoSize']);
    addWD('graph', 'defaultGraphLegendWidth', ['legendWidth']);
    addWD('graph', 'defaultGraphLegendHeight', ['legendHeight']);
    addWD('graph', 'defaultGraphShowAxisY', ['showAxisY']);
    addWD('graph', 'defaultGraphAxisResX', ['axisResolutionX']);
    addWD('graph', 'defaultGraphAxisResY', ['axisResolutionY']);
    addWD('graph', 'defaultGraphAutoAxisResX', ['autoAxisResolutionX']);
    addWD('graph', 'defaultGraphAutoAxisResY', ['autoAxisResolutionY']);
    addWD('graph', 'defaultGraphAxisWidthY', ['axisWidthY']);
    addWD('graph', 'defaultGraphAxisWidthX', ['axisWidthX']);
    addWD('graph', 'defaultGraphAxisOffX', ['axisOffsetX']);
    addWD('graph', 'defaultGraphAxisOffY', ['axisOffsetY']);
    addWD('graph', 'defaultGraphAxisXFont', ['typography', 'axisX', 'fontFamily']);
    addWD('graph', 'defaultGraphAxisXFontSize', ['typography', 'axisX', 'fontSize']);
    addWD('graph', 'defaultGraphAxisXFontColor', ['typography', 'axisX', 'color']);
    addWD('graph', 'defaultGraphAxisXFontBold', ['typography', 'axisX', 'bold']);
    addWD('graph', 'defaultGraphAxisXFontOpacity', ['typography', 'axisX', 'opacity']);
    addWD('graph', 'defaultGraphAxisYFont', ['typography', 'axisY', 'fontFamily']);
    addWD('graph', 'defaultGraphAxisYFontSize', ['typography', 'axisY', 'fontSize']);
    addWD('graph', 'defaultGraphAxisYFontColor', ['typography', 'axisY', 'color']);
    addWD('graph', 'defaultGraphAxisYFontBold', ['typography', 'axisY', 'bold']);
    addWD('graph', 'defaultGraphAxisYFontOpacity', ['typography', 'axisY', 'opacity']);
    addWD('graph', 'defaultGraphAxisXLabelFont', ['typography', 'axisXLabel', 'fontFamily']);
    addWD('graph', 'defaultGraphAxisXLabelFontSize', ['typography', 'axisXLabel', 'fontSize']);
    addWD('graph', 'defaultGraphAxisXLabelFontColor', ['typography', 'axisXLabel', 'color']);
    addWD('graph', 'defaultGraphAxisXLabelFontBold', ['typography', 'axisXLabel', 'bold']);
    addWD('graph', 'defaultGraphAxisXLabelFontOpacity', ['typography', 'axisXLabel', 'opacity']);
    addWD('graph', 'defaultGraphAxisXLabelRotation', ['typography', 'axisXLabel', 'rotation']);
    addWD('graph', 'defaultGraphAxisYLabelFont', ['typography', 'axisYLabel', 'fontFamily']);
    addWD('graph', 'defaultGraphAxisYLabelFontSize', ['typography', 'axisYLabel', 'fontSize']);
    addWD('graph', 'defaultGraphAxisYLabelFontColor', ['typography', 'axisYLabel', 'color']);
    addWD('graph', 'defaultGraphAxisYLabelFontBold', ['typography', 'axisYLabel', 'bold']);
    addWD('graph', 'defaultGraphAxisYLabelFontOpacity', ['typography', 'axisYLabel', 'opacity']);
    addWD('graph', 'defaultGraphAxisYLabelRotation', ['typography', 'axisYLabel', 'rotation']);
    addWD('graph', 'defaultGraphShowPointValues', ['showPointValues']);
    addWD('graph', 'defaultGraphPointValuesHoverOnly', ['pointValuesHoverOnly']);
    addWD('graph', 'defaultGraphPointValuesDistribution', ['pointValuesDistribution']);
    addWD('graph', 'defaultGraphPointValuesTimeWidth', ['pointValuesTimeWidth']);
    addWD('graph', 'defaultGraphPointValuesStep', ['pointValuesStep']);
    addWD('graph', 'defaultGraphAutoPointValuesInterval', ['autoPointValuesInterval']);
    addWD('graph', 'defaultGraphPointValuesDecimals', ['pointValuesDecimals']);
    addWD('graph', 'defaultGraphPointValuesAbbreviate', ['pointValuesAbbreviate']);
    addTypo('graph', 'defaultGraphPointValBar', ['typography', 'pointValueBar']);
    addWD('graph', 'defaultGraphPointValBarInvertYNegative', ['typography', 'pointValueBar', 'invertYNegative']);
    addTypo('graph', 'defaultGraphPointVal', ['typography', 'pointValue']);
    addWD('graph', 'defaultGraphPointValInvertYNegative', ['typography', 'pointValue', 'invertYNegative']);
    addTypo('graph', 'defaultGraphLegendItem', ['typography', 'legendItem']);
    addWD('graph', 'defaultGraphGridHTopShow', ['gridHTopShow']);
    addWD('graph', 'defaultGraphGridHTopCol', ['gridHTopColor']);
    addWD('graph', 'defaultGraphGridHTopW', ['gridHTopWidth']);
    addWD('graph', 'defaultGraphGridHTopOp', ['gridHTopOpacity']);
    addWD('graph', 'defaultGraphGridHBotShow', ['gridHBottomShow']);
    addWD('graph', 'defaultGraphGridHBotCol', ['gridHBottomColor']);
    addWD('graph', 'defaultGraphGridHBotW', ['gridHBottomWidth']);
    addWD('graph', 'defaultGraphGridHBotOp', ['gridHBottomOpacity']);
    addWD('graph', 'defaultGraphGridHBaseShow', ['gridHBaseShow']);
    addWD('graph', 'defaultGraphGridHBaseCol', ['gridHBaseColor']);
    addWD('graph', 'defaultGraphGridHBaseW', ['gridHBaseWidth']);
    addWD('graph', 'defaultGraphGridHBaseOp', ['gridHBaseOpacity']);
    addWD('graph', 'defaultGraphGridHInnerShow', ['gridHInnerShow']);
    addWD('graph', 'defaultGraphGridHInnerCol', ['gridHInnerColor']);
    addWD('graph', 'defaultGraphGridHInnerW', ['gridHInnerWidth']);
    addWD('graph', 'defaultGraphGridHInnerOp', ['gridHInnerOpacity']);
    addWD('graph', 'defaultGraphGridHInnerSpace', ['gridHInnerSpace']);
    addWD('graph', 'defaultGraphGridVShow', ['gridVShow']);
    addWD('graph', 'defaultGraphGridVCol', ['gridVColor']);
    addWD('graph', 'defaultGraphGridVW', ['gridVWidth']);
    addWD('graph', 'defaultGraphGridVOp', ['gridVOpacity']);
    addWD('graph', 'defaultGraphGridVSpace', ['gridVSpace']);
    addWD('graph', 'defaultGraphGridVLeftShow', ['gridVLeftShow']);
    addWD('graph', 'defaultGraphGridVLeftCol', ['gridVLeftColor']);
    addWD('graph', 'defaultGraphGridVLeftW', ['gridVLeftWidth']);
    addWD('graph', 'defaultGraphGridVLeftOp', ['gridVLeftOpacity']);
    addWD('graph', 'defaultGraphGridVRightShow', ['gridVRightShow']);
    addWD('graph', 'defaultGraphGridVRightCol', ['gridVRightColor']);
    addWD('graph', 'defaultGraphGridVRightW', ['gridVRightWidth']);
    addWD('graph', 'defaultGraphGridVRightOp', ['gridVRightOpacity']);
    addWD('graph', 'defaultGraphShowTickX', ['showTickX']);
    addWD('graph', 'defaultGraphShowTickY', ['showTickY']);
    addWD('graph', 'defaultGraphTickXSpacing', ['tickXSpacing']);
    addWD('graph', 'defaultGraphTickYCount', ['tickYCount']);
    addWD('graph', 'defaultGraphTickXSize', ['tickXSize']);
    addWD('graph', 'defaultGraphTickXThickness', ['tickXThickness']);
    addWD('graph', 'defaultGraphTickXColor', ['tickXColor']);
    addWD('graph', 'defaultGraphTickXOffset', ['tickXOffset']);
    addWD('graph', 'defaultGraphTickYSize', ['tickYSize']);
    addWD('graph', 'defaultGraphTickYThickness', ['tickYThickness']);
    addWD('graph', 'defaultGraphTickYColor', ['tickYColor']);
    addWD('graph', 'defaultGraphTickYOffset', ['tickYOffset']);

    // --- clock ---
    addWD('clock', 'clockColTicks', ['tickColor']);
    addWD('clock', 'clockColNumbers', ['numberColor']);
    addWD('clock', 'clockColHour', ['hourColor']);
    addWD('clock', 'clockColMin', ['minuteColor']);
    addWD('clock', 'clockColSec', ['secondColor']);
    addWD('clock', 'defaultClockShowTicks', ['showTicks']);
    addWD('clock', 'defaultClockShowNumbers', ['showNumbers']);
    addWD('clock', 'defaultClockSweep', ['sweep']);
    addWD('clock', 'defaultClockCapSize', ['capSize']);
    addWD('clock', 'defaultClockBackCapSize', ['backCapSize']);
    addWD('clock', 'defaultClockOffset', ['offset']);
    addWD('clock', 'defaultClockNumDist', ['numberDistance']);
    addWD('clock', 'clockHandWidthHour', ['handWidthHour']);
    addWD('clock', 'clockHandLengthHour', ['handLengthHour']);
    addWD('clock', 'clockHandWidthMin', ['handWidthMinute']);
    addWD('clock', 'clockHandLengthMin', ['handLengthMinute']);
    addWD('clock', 'clockHandWidthSec', ['handWidthSecond']);
    addWD('clock', 'clockHandLengthSec', ['handLengthSecond']);
    addWD('clock', 'defaultClockUseSystemTime', ['useSystemTime']);
    addWD('clock', 'defaultClockTimezone', ['timezone']);
    addWD('clock', 'defaultClockDisplayMode', ['displayMode']);
    addWD('clock', 'defaultClockUse12Hour', ['use12Hour']);
    addWD('clock', 'defaultClockFlipUpperColor', ['flipUpperColor']);
    addWD('clock', 'defaultClockFlipLowerColor', ['flipLowerColor']);
    addWD('clock', 'defaultClockFlipCardRadius', ['flipCardRadius']);
    addWD('clock', 'defaultClockFlipSeparator', ['flipSeparator']);
    addWD('clock', 'defaultClockFlipShowLabels', ['flipShowLabels']);
    addWD('clock', 'defaultClockFlipShowSeconds', ['flipShowSeconds']);
    addWD('clock', 'defaultClockTextShowDate', ['textShowDate']);
    addWD('clock', 'defaultClockTextDateSeg0', ['textDateSeg0']);
    addWD('clock', 'defaultClockTextDateSeg1', ['textDateSeg1']);
    addWD('clock', 'defaultClockTextDateSeg2', ['textDateSeg2']);
    addWD('clock', 'defaultClockTextDateSeg3', ['textDateSeg3']);
    addWD('clock', 'defaultClockTextDateSeg4', ['textDateSeg4']);
    addWD('clock', 'defaultClockTextDateSeparator', ['textDateSeparator']);
    addWD('clock', 'defaultClockTextDateLinebreak', ['textDateLinebreak']);
    addWD('clock', 'defaultClockTextShowTime', ['textShowTime']);
    addWD('clock', 'defaultClockTextShowHour', ['textShowHour']);
    addWD('clock', 'defaultClockTextShowMinute', ['textShowMinute']);
    addWD('clock', 'defaultClockTextShowSecond', ['textShowSecond']);
    addWD('clock', 'defaultClockTextSeparator', ['textSeparator']);
    addWD('clock', 'defaultClockTextBlinkSeparator', ['textBlinkSeparator']);
    addWD('clock', 'defaultClockTextLocale', ['textLocale']);
    addTypo('clock', 'defaultClockAnalogNum', ['typography', 'analogNumbers']);
    addTypo('clock', 'defaultClockFlipNum', ['typography', 'flipNumbers']);
    addTypo('clock', 'defaultClockFlipLabel', ['typography', 'flipLabel']);
    addTypo('clock', 'defaultClockFlipAmPm', ['typography', 'flipAmPm']);
    addWD('clock', 'defaultClockNumSize', ['typography', 'analogNumbers', 'fontSize']);
    addWD('clock', 'defaultClockNumColor', ['typography', 'analogNumbers', 'color']);
    addWD('clock', 'defaultClockTimeDateCol', ['typography', 'timeDate', 'color']);
    addWD('clock', 'defaultClockNumFont', ['typography', 'analogNumbers', 'fontFamily']);
    addWD('clock', 'defaultClockNumFontBold', ['typography', 'analogNumbers', 'bold']);

    // --- arrow ---
    addWD('arrow', 'arrowColMain', ['mainColor']);
    addWD('arrow', 'arrowColFlow', ['flowColor']);
    addWD('arrow', 'arrowColFlowRev', ['reverseFlowColor']);
    addWD('arrow', 'arrowColGlow', ['glowColor']);
    addWD('arrow', 'arrowThick', ['thickness']);
    addWD('arrow', 'arrowHeadSz', ['headSize']);
    addWD('arrow', 'arrowLineRadius', ['lineRadius']);
    addWD('arrow', 'arrowHeadRound', ['headRound']);
    addWD('arrow', 'arrowBendRadius', ['bendRadius']);
    addWD('arrow', 'arrowCustomPoints', ['customPoints']);
    addWD('arrow', 'arrowAnimEnabled', ['animationEnabled']);
    addWD('arrow', 'arrowAnimSpeed', ['animationSpeed']);
    addWD('arrow', 'arrowAnimReverse', ['animationReverse']);
    addWD('arrow', 'arrowFlowWidth', ['flowWidth']);
    addWD('arrow', 'arrowGradientWidth', ['gradientWidth']);
    addWD('arrow', 'arrowGlowWidth', ['glowWidth']);
    addWD('arrow', 'arrowGlowOpacity', ['glowOpacity']);

    // --- editbox ---
    addWD('editbox', 'editboxBgColor', ['backgroundColor']);
    addWD('editbox', 'editboxBgOpacity', ['backgroundOpacity']);
    addWD('editbox', 'editboxBorderColor', ['borderColor']);
    addWD('editbox', 'editboxBorderWidth', ['borderWidth']);
    addWD('editbox', 'editboxBorderRadius', ['borderRadius']);
    addWD('editbox', 'editboxEnableFocusColor', ['enableFocusGlow']);
    addWD('editbox', 'editboxFocusColor', ['focusColor']);
    addWD('editbox', 'editboxTextColor', ['typography', 'inputText', 'color']);
    addWD('editbox', 'editboxPlaceholderColor', ['placeholderColor']);
    addWD('editbox', 'editboxFontSize', ['typography', 'inputText', 'fontSize']);
    addWD('editbox', 'editboxFontBold', ['typography', 'inputText', 'bold']);
    addWD('editbox', 'editboxTextPadding', ['textPadding']);
    addWD('editbox', 'editboxInputDefaultAlign', ['typography', 'inputText', 'textAlign']);

    const CLOCK_ALIAS_KEYS = {
        defaultClockNumSize: 'defaultClockAnalogNumFs',
        defaultClockNumColor: 'defaultClockAnalogNumCol',
        defaultClockNumFont: 'defaultClockAnalogNumFont',
        defaultClockNumFontBold: 'defaultClockAnalogNumBold'
    };

    const GRAPH_AXIS_ALIAS_KEYS = {
        defaultGraphAxisFont: 'defaultGraphAxisXFont',
        defaultGraphAxisFontSize: 'defaultGraphAxisXFontSize',
        defaultGraphAxisFontColor: 'defaultGraphAxisXFontColor',
        defaultGraphAxisFontBold: 'defaultGraphAxisXFontBold'
    };

    const JUNK_OVERRIDE_KEYS = [
        '_switchTypographyV2',
        '_switchIconsV2',
        '_switchIconsV3',
        '_layoutResponsiveV2',
        '_menuTypographyV2',
        '_menuIconsV2'
    ];

    const IMAGE_LABEL_TO_TYPO = {
        labelFont: 'fontFamily',
        labelFs: 'fontSize',
        labelCol: 'color',
        labelAlign: 'textAlign',
        labelCase: 'textTransform',
        labelBold: 'bold',
        labelItalic: 'italic',
        labelOffX: 'offsetX',
        labelOffY: 'offsetY',
        labelOpacity: 'opacity'
    };

    const WIDGET_OVERRIDE_RENAME = {
        switch: {
            colOn: 'backgroundColorOn',
            colOff: 'backgroundColorOff',
            colHover: 'backgroundColorHover',
            colThumb: 'thumbColor',
            btnGlow: 'enableGlow',
            btnGlowColor: 'glowColor',
            btnGlowRadius: 'glowRadius',
            btnRadius: 'buttonRadius',
            labelPos: 'buttonLabelPosition'
        },
        arrow: {
            colMain: 'mainColor',
            colFlow: 'flowColor',
            colFlowRev: 'reverseFlowColor',
            colGlow: 'glowColor',
            animEnable: 'animationEnabled',
            animSpeed: 'animationSpeed',
            animReverse: 'animationReverse',
            glowEnable: 'enableGlow'
        },
        battery: {
            colGood: 'goodColor',
            colLow: 'lowColor',
            colBorder: 'borderColor',
            colEmpty: 'emptyColor',
            lowThresh: 'lowThreshold',
            terminalSz: 'terminalSize',
            innerPad: 'innerPadding'
        },
        lightgrid: {
            colTileBg: 'tileBackgroundColor',
            colTileHover: 'tileHoverColor',
            colTileText: 'tileTextColor',
            colToggleOn: 'toggleColorOn',
            colToggleOff: 'toggleColorOff',
            cols: 'columns'
        },
        clock: {
            colTicks: 'tickColor',
            colHour: 'hourColor',
            colMin: 'minuteColor',
            colSec: 'secondColor',
            numDist: 'numberDistance'
        },
        gauge: {
            col0: 'startColor',
            col100: 'endColor',
            colTrack: 'trackColor',
            layoutHoriz: 'layoutHorizontal'
        },
        slider: {
            colTrack: 'trackColor',
            colFill: 'fillColor',
            colThumb: 'thumbColor'
        }
    };

    const INSTANCE_ALIAS_TO_INTERNAL = {
        switch: {
            backgroundColorOn: 'colOn',
            backgroundColorOff: 'colOff',
            backgroundColorHover: 'colHover',
            thumbColor: 'colThumb',
            enableGlow: 'btnGlow',
            glowColor: 'btnGlowColor',
            glowRadius: 'btnGlowRadius',
            buttonRadius: 'btnRadius',
            buttonLabelPosition: 'labelPos'
        },
        arrow: {
            mainColor: 'colMain',
            flowColor: 'colFlow',
            reverseFlowColor: 'colFlowRev',
            glowColor: 'colGlow',
            animationEnabled: 'animEnable',
            animationSpeed: 'animSpeed',
            animationReverse: 'animReverse',
            enableGlow: 'glowEnable'
        },
        battery: {
            goodColor: 'colGood',
            lowColor: 'colLow',
            emptyColor: 'colEmpty',
            lowThreshold: 'lowThresh',
            terminalSize: 'terminalSz',
            innerPadding: 'innerPad'
        },
        lightgrid: {
            tileBackgroundColor: 'colTileBg',
            tileHoverColor: 'colTileHover',
            tileTextColor: 'colTileText',
            toggleColorOn: 'colToggleOn',
            toggleColorOff: 'colToggleOff',
            columns: 'cols'
        },
        clock: {
            tickColor: 'colTicks',
            hourColor: 'colHour',
            minuteColor: 'colMin',
            secondColor: 'colSec',
            numberDistance: 'numDist'
        },
        gauge: {
            startColor: 'col0',
            endColor: 'col100',
            trackColor: 'colTrack',
            layoutHorizontal: 'layoutHoriz'
        },
        slider: {
            trackColor: 'colTrack',
            fillColor: 'colFill',
            thumbColor: 'colThumb'
        }
    };

    const BUCKET_NAMES = {
        connection: true,
        environment: true,
        typography: true,
        container: true,
        theme: true,
        widgetDefaults: true
    };

    const PREFIX_TYPES = [
        ['defaultLightGrid', 'lightgrid'],
        ['defaultSwitch', 'switch'],
        ['defaultGauge', 'gauge'],
        ['defaultSlider', 'slider'],
        ['defaultClock', 'clock'],
        ['defaultGraph', 'graph'],
        ['defaultList', 'list'],
        ['defaultIcon', 'icon'],
        ['defaultImage', 'image'],
        ['defaultBattery', 'battery'],
        ['defaultLg', 'lightgrid'],
        ['defaultText', 'text'],
        ['switch', 'switch'],
        ['menu', 'menu'],
        ['gauge', 'gauge'],
        ['slider', 'slider'],
        ['clock', 'clock'],
        ['graph', 'graph'],
        ['label', 'label'],
        ['textMd', 'text'],
        ['editbox', 'editbox'],
        ['arrow', 'arrow'],
        ['batt', 'battery'],
        ['lg', 'lightgrid']
    ];

    const ABBREV_PAIRS = [
        ['ColOff', 'ColorOff'],
        ['ColOn', 'ColorOn'],
        ['ColHover', 'ColorHover'],
        ['ThumbSz', 'ThumbSize'],
        ['TerminalSz', 'TerminalSize'],
        ['HeadSz', 'HeadSize'],
        ['LowThresh', 'LowThreshold'],
        ['InnerPad', 'InnerPadding'],
        ['OffX', 'OffsetX'],
        ['OffY', 'OffsetY'],
        ['LineW', 'LineWidth'],
        ['BarThick', 'BarThickness'],
        ['TrackThick', 'TrackThickness'],
        ['FillThick', 'FillThickness'],
        ['BgOn', 'BackgroundOn'],
        ['BgOff', 'BackgroundOff'],
        ['BgHover', 'BackgroundHover'],
        ['Bg', 'Background'],
        ['Fs', 'FontSize'],
        ['Sz', 'Size'],
        ['Col', 'Color'],
        ['Anim', 'Animation']
    ];

    function isPlainObject(v) {
        return !!v && typeof v === 'object' && !Array.isArray(v);
    }

    function cloneJson(v) {
        if (v === undefined) return undefined;
        try {
            return JSON.parse(JSON.stringify(v));
        } catch (e) {
            return v;
        }
    }

    function hasAtPath(obj, path) {
        if (!obj || !path || !path.length) return false;
        let cur = obj;
        for (let i = 0; i < path.length; i++) {
            if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return false;
            if (!Object.prototype.hasOwnProperty.call(cur, path[i])) return false;
            cur = cur[path[i]];
        }
        return cur !== undefined && cur !== null;
    }

    function getAtPath(obj, path) {
        if (!obj || !path || !path.length) return undefined;
        let cur = obj;
        for (let i = 0; i < path.length; i++) {
            if (!isPlainObject(cur) && (i < path.length - 1)) return undefined;
            if (cur == null) return undefined;
            cur = cur[path[i]];
        }
        return cur;
    }

    function setAtPath(obj, path, value) {
        if (!obj || !path || !path.length) return;
        let cur = obj;
        for (let i = 0; i < path.length - 1; i++) {
            const k = path[i];
            if (!isPlainObject(cur[k])) cur[k] = {};
            cur = cur[k];
        }
        cur[path[path.length - 1]] = value;
    }

    const DIALOG_BOX_APPEARANCE = {
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
    };

    const DIALOG_BOX_TYPO_PREFIX = {
        dialogBoxText: 'dialogText',
        dialogBoxButtonLabel: 'buttonLabel'
    };

    const DIALOG_BOX_TYPO_SUFFIX = {
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
    };

    const DIALOG_BOX_ICON_PREFIX = {
        dialogBoxIconDialog: 'dialog',
        dialogBoxIconConfirm: 'confirm',
        dialogBoxIconDismiss: 'dismiss'
    };

    const DIALOG_BOX_ICON_SUFFIX = {
        Source: 'source',
        Builtin: 'builtin',
        Weight: 'weight',
        CustomUrl: 'customUrl',
        TintImage: 'tintImage',
        Color: 'color',
        AccentColor: 'accentColor',
        Size: 'size'
    };

    function deleteAtPath(obj, path) {
        if (!obj || !path || !path.length) return;
        let node = obj;
        for (let i = 0; i < path.length - 1; i++) {
            if (!isPlainObject(node[path[i]])) return;
            node = node[path[i]];
        }
        delete node[path[path.length - 1]];
    }

    function pruneEmptyObjects(obj) {
        if (!isPlainObject(obj)) return;
        Object.keys(obj).forEach(function (k) {
            pruneEmptyObjects(obj[k]);
            if (isPlainObject(obj[k]) && Object.keys(obj[k]).length === 0) delete obj[k];
        });
    }

    function correctionParts(key) {
        const m = String(key || '').match(/^(.+)_correct_(en|hue|sat|bri|hue_fixed|sat_fixed|bri_fixed)$/);
        if (!m) return null;
        return { base: m[1], suffix: '_correct_' + m[2] };
    }

    function pathWithCorrection(path, suffix) {
        const out = path.slice();
        out[out.length - 1] = out[out.length - 1] + suffix;
        return out;
    }

    function expandAbbrevRemainder(rest) {
        let s = String(rest || '');
        if (!s) return s;
        s = s.replace(/^default/, '');
        if (s.charAt(0) && s.charAt(0) === s.charAt(0).toUpperCase()) {
            s = s.charAt(0).toLowerCase() + s.slice(1);
        }
        for (let i = 0; i < ABBREV_PAIRS.length; i++) {
            const pair = ABBREV_PAIRS[i];
            if (s.indexOf(pair[0]) !== -1) s = s.split(pair[0]).join(pair[1]);
        }
        return s;
    }

    function fallbackWidgetDefaultPath(key) {
        for (let i = 0; i < PREFIX_TYPES.length; i++) {
            const prefix = PREFIX_TYPES[i][0];
            const type = PREFIX_TYPES[i][1];
            if (key.indexOf(prefix) === 0 && key.length > prefix.length) {
                const rest = key.slice(prefix.length);
                const leaf = expandAbbrevRemainder(rest);
                if (leaf) return [type, leaf];
            }
        }
        return null;
    }

    function lookupRuntimePath(key) {
        const corr = correctionParts(key);
        const base = corr ? corr.base : key;
        let path = CORE_RUNTIME_TO_PATH[base];
        if (path) return corr ? pathWithCorrection(path, corr.suffix) : path.slice();
        path = WD[base];
        if (path) {
            const full = ['widgetDefaults'].concat(path);
            return corr ? pathWithCorrection(full, corr.suffix) : full;
        }
        const fb = fallbackWidgetDefaultPath(base);
        if (fb) {
            const full = ['widgetDefaults'].concat(fb);
            return corr ? pathWithCorrection(full, corr.suffix) : full;
        }
        return null;
    }

    /** Canonical path lookup without the fallback heuristic. Used by the nest
     *  step so unmapped keys stay flat in widgetDefaults (lossless round-trip).
     *  The fallback heuristic is lossy because ABBREV_PAIRS expansion is one-way.
     */
    function lookupCanonicalPath(key) {
        const corr = correctionParts(key);
        const base = corr ? corr.base : key;
        let path = CORE_RUNTIME_TO_PATH[base];
        if (path) return corr ? pathWithCorrection(path, corr.suffix) : path.slice();
        path = WD[base];
        if (path) {
            const full = ['widgetDefaults'].concat(path);
            return corr ? pathWithCorrection(full, corr.suffix) : full;
        }
        return null;
    }

    /** Scan nested master objects for _correct_* suffix siblings of canonical
     *  paths. The WD/CORE walk only reads the base leaf; correction variants
     *  (e.g. startColor_correct_bri) are separate keys in the same parent.
     */
    function recoverCorrectionSiblings(master, bag) {
        function scanParent(parent, leaf, flatKey) {
            if (!isPlainObject(parent)) return;
            Object.keys(parent).forEach(function (k) {
                const m = String(k).match(/^(.+)_correct_(en|hue|sat|bri|hue_fixed|sat_fixed|bri_fixed)$/);
                if (!m || m[1] !== leaf) return;
                const flat = flatKey + '_correct_' + m[2];
                if (bag[flat] === undefined) bag[flat] = cloneJson(parent[k]);
            });
        }
        // CORE_RUNTIME_TO_PATH: environment / container / typography corrections
        Object.keys(CORE_RUNTIME_TO_PATH).forEach(function (rk) {
            const p = CORE_RUNTIME_TO_PATH[rk];
            let parent = master;
            for (let i = 0; i < p.length - 1; i++) {
                if (!isPlainObject(parent)) return;
                parent = parent[p[i]];
            }
            scanParent(parent, p[p.length - 1], rk);
        });
        // WD: widget default corrections
        Object.keys(WD).forEach(function (rk) {
            const p = WD[rk]; // [type, ...rest]
            let parent = master.widgetDefaults;
            for (let i = 0; i < p.length - 1; i++) {
                if (!isPlainObject(parent)) return;
                parent = parent[p[i]];
            }
            scanParent(parent, p[p.length - 1], rk);
        });
    }

    function isV2Master(master) {
        if (!isPlainObject(master)) return false;
        // Sparse themes may store only the buckets they changed (for example
        // theme.colors and container.background.blur) and omit canvas/container
        // background objects. Classic 1.x flat masters keep canvasBg / dataDriver
        // on the root, so those still fail this check.
        if (master.canvasBg !== undefined || master.dataDriver !== undefined) return false;
        if (isPlainObject(master.environment) && (master.environment.canvasBg !== undefined || master.environment.canvasWidth !== undefined || master.environment.gridSize !== undefined || master.environment.canvasPreset !== undefined)) return false;
        if (isPlainObject(master.container) && (master.container.bgVisible !== undefined || master.container.bgColStart !== undefined || master.container.borderColor !== undefined)) return false;
        if (isPlainObject(master.theme) && isPlainObject(master.theme.colors)) return true;
        if (isPlainObject(master.environment)) return true;
        if (isPlainObject(master.container)) return true;
        if (isPlainObject(master.typography)) return true;
        if (isPlainObject(master.widgetDefaults)) return true;
        return false;
    }

    function foldLegacyWidgetDefaultAliases(master) {
        if (!isPlainObject(master) || !isPlainObject(master.widgetDefaults)) return;
        const wd = master.widgetDefaults;
        if (wd.defaultGap !== undefined) {
            if (!isPlainObject(wd.gauge)) wd.gauge = {};
            if (wd.gauge.horizontalGap === undefined) wd.gauge.horizontalGap = wd.defaultGap;
            delete wd.defaultGap;
        }
        if (isPlainObject(wd.gauge) && wd.gauge.layout !== undefined) {
            if (wd.gauge.layoutRound === undefined) wd.gauge.layoutRound = wd.gauge.layout;
            delete wd.gauge.layout;
        }
        if (wd.iconActive !== undefined || wd.iconInactive !== undefined) {
            if (!isPlainObject(wd.icon)) wd.icon = {};
            if (!isPlainObject(wd.icon.icons)) wd.icon.icons = {};
            if (wd.iconActive !== undefined) {
                if (!isPlainObject(wd.icon.icons.on)) wd.icon.icons.on = {};
                if (wd.icon.icons.on.color === undefined) wd.icon.icons.on.color = wd.iconActive;
                delete wd.iconActive;
            }
            if (wd.iconInactive !== undefined) {
                if (!isPlainObject(wd.icon.icons.off)) wd.icon.icons.off = {};
                if (wd.icon.icons.off.color === undefined) wd.icon.icons.off.color = wd.iconInactive;
                delete wd.iconInactive;
            }
        }
    }

    function copyLegacyWidgetDefaultFallbacks(wd, bag) {
        if (!isPlainObject(wd) || !bag) return;
        if (wd.defaultGap !== undefined && bag.defaultGaugeHorizontalGap === undefined) {
            bag.defaultGaugeHorizontalGap = cloneJson(wd.defaultGap);
        }
        if (isPlainObject(wd.gauge) && wd.gauge.layout !== undefined && bag.defaultGaugeRoundLayout === undefined) {
            bag.defaultGaugeRoundLayout = cloneJson(wd.gauge.layout);
        }
        if (wd.iconActive !== undefined && bag.iconActive === undefined) bag.iconActive = cloneJson(wd.iconActive);
        if (wd.iconInactive !== undefined && bag.iconInactive === undefined) bag.iconInactive = cloneJson(wd.iconInactive);
    }

    /** Flat runtime keys still sitting on widgetDefaults (mixed 1.x / early-2.0 saves). */
    function copyFlatWidgetDefaultRuntimeKeys(wid, bag) {
        if (!isPlainObject(wid) || !bag) return;
        Object.keys(wid).forEach(function (k) {
            const v = wid[k];
            if (v === undefined) return;
            if (isPlainObject(v) || Array.isArray(v)) return;
            if (bag[k] === undefined) bag[k] = cloneJson(v);
        });
    }

    function copyDialogBoxFromEnv(env, bag) {
        if (!env) return;
        if (isPlainObject(env.dialogBox)) {
            bag._dialogBoxNested = cloneJson(env.dialogBox);
            return;
        }
        const keys = Object.keys(env);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i].indexOf('dialogBox') === 0) bag[keys[i]] = env[keys[i]];
        }
    }

    function applyRuntimeBagAliases(bag) {
        if (!bag) return;
        Object.keys(CLOCK_ALIAS_KEYS).forEach(function (alias) {
            const canon = CLOCK_ALIAS_KEYS[alias];
            if (bag[alias] !== undefined && bag[canon] === undefined) bag[canon] = bag[alias];
            delete bag[alias];
        });
        Object.keys(GRAPH_AXIS_ALIAS_KEYS).forEach(function (alias) {
            const canon = GRAPH_AXIS_ALIAS_KEYS[alias];
            if (bag[alias] !== undefined && bag[canon] === undefined) bag[canon] = bag[alias];
            delete bag[alias];
        });
        if (bag.defaultTrackOutlineColor !== undefined) {
            if (bag.defaultGaugeTrackOutlineColor === undefined) bag.defaultGaugeTrackOutlineColor = bag.defaultTrackOutlineColor;
            if (bag.defaultSliderTrackOutlineColor === undefined) bag.defaultSliderTrackOutlineColor = bag.defaultTrackOutlineColor;
            delete bag.defaultTrackOutlineColor;
        }
        if (bag.defaultTrackOutlineWidth !== undefined) {
            if (bag.defaultGaugeTrackOutlineWidth === undefined) bag.defaultGaugeTrackOutlineWidth = bag.defaultTrackOutlineWidth;
            if (bag.defaultSliderTrackOutlineWidth === undefined) bag.defaultSliderTrackOutlineWidth = bag.defaultTrackOutlineWidth;
            delete bag.defaultTrackOutlineWidth;
        }
    }

    function flattenMasterToRuntimeBag(master) {
        const bag = {};
        if (!isPlainObject(master)) return bag;

        if (isV2Master(master)) {
            Object.keys(CORE_RUNTIME_TO_PATH).forEach(function (rk) {
                const val = getAtPath(master, CORE_RUNTIME_TO_PATH[rk]);
                if (val !== undefined) bag[rk] = cloneJson(val);
            });
            Object.keys(WD).forEach(function (rk) {
                if (CLOCK_ALIAS_KEYS[rk]) return;
                const val = getAtPath(master.widgetDefaults, WD[rk]);
                if (val !== undefined) bag[rk] = cloneJson(val);
            });
            copyFlatWidgetDefaultRuntimeKeys(master.widgetDefaults, bag);
            copyLegacyWidgetDefaultFallbacks(master.widgetDefaults, bag);
            recoverCorrectionSiblings(master, bag);
            if (master.environment && isPlainObject(master.environment.dialogBox)) {
                bag._dialogBoxNested = cloneJson(master.environment.dialogBox);
            }
            if (master.environment && isPlainObject(master.environment.quickToolbar)) {
                bag.quickToolbar = cloneJson(master.environment.quickToolbar);
            }
            Object.keys(master).forEach(function (k) {
                if (BUCKET_NAMES[k]) return;
                if (bag[k] === undefined) bag[k] = cloneJson(master[k]);
            });
            applyRuntimeBagAliases(bag);
            return bag;
        }

        const conn = isPlainObject(master.connection) ? master.connection : {};
        const env = isPlainObject(master.environment) ? master.environment : master;
        const typo = isPlainObject(master.typography) ? master.typography : {};
        const box = isPlainObject(master.container) ? master.container : {};
        const wid = isPlainObject(master.widgetDefaults) ? master.widgetDefaults : {};

        function assignFlat(src) {
            if (!isPlainObject(src)) return;
            Object.keys(src).forEach(function (k) {
                if (BUCKET_NAMES[k]) return;
                const v = src[k];
                if (k === 'layout' || k === 'audio' || k === 'dialogBox' || k === 'quickToolbar' || k === 'canvas' || k === 'grid' || k === 'paging' || k === 'gestures' || k === 'background' || k === 'glow' || k === 'border' || k === 'innerGlow') return;
                if (isPlainObject(v) && (k === 'theme' || k === 'colors')) return;
                if (v !== undefined) bag[k] = cloneJson(v);
            });
        }

        if (isPlainObject(master.connection) || isPlainObject(master.environment)) {
            assignFlat(conn);
            assignFlat(env);
            assignFlat(typo);
            assignFlat(box);
            const envLayout = isPlainObject(env.layout) ? env.layout : null;
            if (envLayout) {
                if (envLayout.mode !== undefined) bag.layoutMode = envLayout.mode;
                if (envLayout.scale && envLayout.scale.keepAspectRatio !== undefined) {
                    bag.layoutScaleKeepAspect = envLayout.scale.keepAspectRatio;
                }
                const resp = isPlainObject(envLayout.responsive) ? envLayout.responsive : null;
                if (resp) {
                    if (resp.columnCount !== undefined) bag.layoutResponsiveColumnCount = resp.columnCount;
                    if (resp.reduceColumnsToFit !== undefined) bag.layoutResponsiveReduceColumnsToFit = resp.reduceColumnsToFit;
                    if (resp.minSize !== undefined) bag.layoutResponsiveMinSize = resp.minSize;
                    if (resp.maxSize !== undefined) bag.layoutResponsiveMaxSize = resp.maxSize;
                    if (resp.gap !== undefined) bag.layoutResponsiveGap = resp.gap;
                    if (resp.align !== undefined) bag.layoutResponsiveAlign = resp.align;
                    if (resp.minWidgetHeight !== undefined) bag.layoutResponsiveMinWidgetHeight = resp.minWidgetHeight;
                    if (resp.pagePaddingLeft !== undefined) bag.layoutResponsivePagePaddingLeft = resp.pagePaddingLeft;
                    if (resp.pagePaddingRight !== undefined) bag.layoutResponsivePagePaddingRight = resp.pagePaddingRight;
                    if (resp.pagePaddingTop !== undefined) bag.layoutResponsivePagePaddingTop = resp.pagePaddingTop;
                    if (resp.pagePaddingBottom !== undefined) bag.layoutResponsivePagePaddingBottom = resp.pagePaddingBottom;
                }
            }
            if (isPlainObject(env.audio) && Array.isArray(env.audio.topicMap)) {
                bag.audioTopicMap = cloneJson(env.audio.topicMap);
            }
            copyDialogBoxFromEnv(env, bag);
            if (isPlainObject(env.quickToolbar)) bag.quickToolbar = cloneJson(env.quickToolbar);
            if (isPlainObject(env.canvas)) {
                Object.keys(CORE_RUNTIME_TO_PATH).forEach(function (rk) {
                    const p = CORE_RUNTIME_TO_PATH[rk];
                    if (p[1] === 'canvas') {
                        const val = getAtPath(master, p);
                        if (val !== undefined) bag[rk] = cloneJson(val);
                    }
                });
            }
            if (isPlainObject(env.gestures)) {
                Object.keys(CORE_RUNTIME_TO_PATH).forEach(function (rk) {
                    const p = CORE_RUNTIME_TO_PATH[rk];
                    if (p[1] === 'gestures') {
                        const val = getAtPath(master, p);
                        if (val !== undefined) bag[rk] = cloneJson(val);
                    }
                });
            }
            copyFlatWidgetDefaultRuntimeKeys(wid, bag);
            Object.keys(WD).forEach(function (rk) {
                if (CLOCK_ALIAS_KEYS[rk]) return;
                const val = getAtPath(wid, WD[rk]);
                if (val !== undefined) bag[rk] = cloneJson(val);
            });
            copyLegacyWidgetDefaultFallbacks(wid, bag);
        } else {
            assignFlat(master);
        }

        if (master.theme && isPlainObject(master.theme.colors)) {
            bag.themeColors = cloneJson(master.theme.colors);
        } else if (isPlainObject(master.themeColors)) {
            bag.themeColors = cloneJson(master.themeColors);
        }

        applyRuntimeBagAliases(bag);

        return bag;
    }

    function nestRuntimeBagToV2Master(bag, options) {
        const out = {
            connection: {},
            environment: {},
            typography: {},
            container: {},
            theme: { colors: {} },
            widgetDefaults: {}
        };
        if (!isPlainObject(bag)) return out;
        const skipLayoutResponsive = options && options.omitResponsiveIfNotMode;
        Object.keys(bag).forEach(function (key) {
            if (key === '_dialogBoxNested' || key === '_masterLayoutVersion') return;
            if (key.indexOf('dialogBox') === 0) return;
            if (CLOCK_ALIAS_KEYS[key]) return;
            if (GRAPH_AXIS_ALIAS_KEYS[key]) return;
            if (key === 'defaultTrackOutlineColor' || key === 'defaultTrackOutlineWidth') return;
            const val = bag[key];
            if (val === undefined) return;
            if (key === 'defaultGap') {
                if (!isPlainObject(out.widgetDefaults.gauge)) out.widgetDefaults.gauge = {};
                if (out.widgetDefaults.gauge.horizontalGap === undefined) {
                    out.widgetDefaults.gauge.horizontalGap = cloneJson(val);
                }
                return;
            }
            const path = lookupCanonicalPath(key);
            if (path) {
                if (skipLayoutResponsive && path[1] === 'layout' && path[2] === 'responsive' && bag.layoutMode !== 'responsive') {
                    return;
                }
                setAtPath(out, path, cloneJson(val));
                return;
            }
            if (key === 'themeColors' && isPlainObject(val)) {
                out.theme.colors = cloneJson(val);
                return;
            }
            setAtPath(out, ['widgetDefaults', key], cloneJson(val));
        });

        if (isPlainObject(bag._dialogBoxNested)) {
            out.environment.dialogBox = cloneJson(bag._dialogBoxNested);
        }
        foldDialogBoxFromBag(bag, out);

        if (isPlainObject(bag.quickToolbar)) {
            out.environment.quickToolbar = cloneJson(bag.quickToolbar);
        }

        pruneEmptyObjects(out.widgetDefaults);
        pruneEmptyObjects(out.environment);
        pruneEmptyObjects(out.typography);
        pruneEmptyObjects(out.container);
        foldLegacyWidgetDefaultAliases(out);
        return out;
    }

    function foldDialogBoxFromBag(bag, out) {
        const appear = DIALOG_BOX_APPEARANCE;
        const dialogNode = isPlainObject(out.environment.dialogBox) ? out.environment.dialogBox : {};
        let hasDialog = Object.keys(dialogNode).length > 0;
        Object.keys(appear).forEach(function (flatKey) {
            if (bag[flatKey] !== undefined) {
                dialogNode[appear[flatKey]] = cloneJson(bag[flatKey]);
                hasDialog = true;
            }
        });
        const typoPrefix = DIALOG_BOX_TYPO_PREFIX;
        const typoSuffix = DIALOG_BOX_TYPO_SUFFIX;
        const typoNode = isPlainObject(dialogNode.typography) ? dialogNode.typography : {};
        Object.keys(typoPrefix).forEach(function (prefix) {
            const role = isPlainObject(typoNode[typoPrefix[prefix]]) ? typoNode[typoPrefix[prefix]] : {};
            let hasRole = Object.keys(role).length > 0;
            Object.keys(typoSuffix).forEach(function (suffix) {
                const flatKey = prefix + suffix;
                if (bag[flatKey] !== undefined) {
                    role[typoSuffix[suffix]] = cloneJson(bag[flatKey]);
                    hasRole = true;
                    hasDialog = true;
                }
            });
            if (hasRole) typoNode[typoPrefix[prefix]] = role;
        });
        if (Object.keys(typoNode).length > 0) dialogNode.typography = typoNode;
        const iconPrefix = DIALOG_BOX_ICON_PREFIX;
        const iconSuffix = DIALOG_BOX_ICON_SUFFIX;
        const iconNode = isPlainObject(dialogNode.icons) ? dialogNode.icons : {};
        Object.keys(iconPrefix).forEach(function (prefix) {
            const slot = isPlainObject(iconNode[iconPrefix[prefix]]) ? iconNode[iconPrefix[prefix]] : {};
            let hasSlot = Object.keys(slot).length > 0;
            Object.keys(iconSuffix).forEach(function (suffix) {
                const flatKey = prefix + suffix;
                if (bag[flatKey] !== undefined) {
                    slot[iconSuffix[suffix]] = cloneJson(bag[flatKey]);
                    hasSlot = true;
                    hasDialog = true;
                }
            });
            if (hasSlot) iconNode[iconPrefix[prefix]] = slot;
        });
        if (Object.keys(iconNode).length > 0) dialogNode.icons = iconNode;
        if (hasDialog) out.environment.dialogBox = dialogNode;
    }

    function expandV2MasterToRuntime(nested, options) {
        const bag = flattenMasterToRuntimeBag(nested);
        delete bag._dialogBoxNested;
        if (isPlainObject(nested) && isPlainObject(nested.environment) && isPlainObject(nested.environment.dialogBox)) {
            const envDialog = nested.environment.dialogBox;
            const appear = DIALOG_BOX_APPEARANCE;
            Object.keys(appear).forEach(function (flatKey) {
                if (envDialog[appear[flatKey]] !== undefined) bag[flatKey] = cloneJson(envDialog[appear[flatKey]]);
            });
            const typo = envDialog.typography;
            if (isPlainObject(typo)) {
                const prefixes = DIALOG_BOX_TYPO_PREFIX;
                const suffixes = DIALOG_BOX_TYPO_SUFFIX;
                Object.keys(prefixes).forEach(function (prefix) {
                    const role = typo[prefixes[prefix]];
                    if (!isPlainObject(role)) return;
                    Object.keys(suffixes).forEach(function (suffix) {
                        if (role[suffixes[suffix]] !== undefined) bag[prefix + suffix] = cloneJson(role[suffixes[suffix]]);
                    });
                });
            }
            const icons = envDialog.icons;
            if (isPlainObject(icons)) {
                const iconPrefix = DIALOG_BOX_ICON_PREFIX;
                const iconSuffix = DIALOG_BOX_ICON_SUFFIX;
                Object.keys(iconPrefix).forEach(function (prefix) {
                    const slot = icons[iconPrefix[prefix]];
                    if (!isPlainObject(slot)) return;
                    Object.keys(iconSuffix).forEach(function (suffix) {
                        if (slot[iconSuffix[suffix]] !== undefined) bag[prefix + suffix] = cloneJson(slot[iconSuffix[suffix]]);
                    });
                });
            }
        }
        if (isPlainObject(nested) && isPlainObject(nested.environment) && isPlainObject(nested.environment.quickToolbar)) {
            const qtRaw = nested.environment.quickToolbar;
            let qtColumns = parseInt(qtRaw.columns, 10);
            if (!isFinite(qtColumns) || qtColumns < 1) qtColumns = 1;
            if (qtColumns > 12) qtColumns = 12;
            let qtRows = parseInt(qtRaw.rows, 10);
            if (!isFinite(qtRows) || qtRows < 0) qtRows = 0;
            if (qtRows > 12) qtRows = 12;
            let qtX = parseInt(qtRaw.x, 10);
            let qtY = parseInt(qtRaw.y, 10);
            if (!isFinite(qtX)) qtX = 0;
            if (!isFinite(qtY)) qtY = 0;
            let qtVis = 'auto';
            if (qtRaw.visibility === 'always' || qtRaw.visibility === 'never' || qtRaw.visibility === 'auto') {
                qtVis = qtRaw.visibility;
            } else if (qtRaw.enabled === false) {
                qtVis = 'never';
            }
            bag.quickToolbar = {
                visibility: qtVis,
                enabled: qtVis !== 'never',
                mode: qtRaw.mode === 'floating' ? 'floating' : 'docked',
                x: qtX,
                y: qtY,
                columns: qtColumns,
                rows: qtRows
            };
        }
        const fillThemeDefaults = !(options && options.sparseThemeColors);
        if (fillThemeDefaults && typeof MasterLayout !== 'undefined' && typeof MasterLayout.defaultThemeColors === 'function') {
            bag.themeColors = Object.assign({}, MasterLayout.defaultThemeColors(), bag.themeColors || {});
        }
        if (typeof MasterLayout !== 'undefined') bag._masterLayoutVersion = MasterLayout.LAYOUT_VERSION;
        return bag;
    }

    function convertMasterToV2(master, options) {
        const src = cloneJson(master) || {};
        foldLegacyWidgetDefaultAliases(src);
        const bag = flattenMasterToRuntimeBag(src);
        const nested = nestRuntimeBagToV2Master(bag, options || { omitResponsiveIfNotMode: true });
        foldLegacyWidgetDefaultAliases(nested);
        return nested;
    }

    function nestContainerFields(ov) {
        if (!isPlainObject(ov)) return ov;
        let container = isPlainObject(ov.container) ? ov.container : {};
        let changed = false;
        Object.keys(CONTAINER_FLAT_TO_PATH).forEach(function (flat) {
            if (ov[flat] !== undefined) {
                setAtPath(container, CONTAINER_FLAT_TO_PATH[flat], ov[flat]);
                delete ov[flat];
                changed = true;
            }
            Object.keys(ov).forEach(function (k) {
                const parts = correctionParts(k);
                if (!parts || parts.base !== flat) return;
                setAtPath(container, pathWithCorrection(CONTAINER_FLAT_TO_PATH[flat], parts.suffix), ov[k]);
                delete ov[k];
                changed = true;
            });
        });
        if (changed || Object.keys(container).length) ov.container = container;
        return ov;
    }

    function applyRenameMap(ov, map) {
        if (!isPlainObject(ov) || !map) return;
        Object.keys(map).forEach(function (oldKey) {
            const newKey = map[oldKey];
            if (ov[oldKey] !== undefined && ov[newKey] === undefined) {
                ov[newKey] = ov[oldKey];
            }
            delete ov[oldKey];
            Object.keys(ov).forEach(function (k) {
                const parts = correctionParts(k);
                if (!parts || parts.base !== oldKey) return;
                const dest = newKey + parts.suffix;
                if (ov[dest] === undefined) ov[dest] = ov[k];
                delete ov[k];
            });
        });
    }

    function liftImageTypography(ov) {
        if (!isPlainObject(ov)) return;
        const typo = isPlainObject(ov.typography) ? ov.typography : {};
        const role = isPlainObject(typo.widgetLabel) ? typo.widgetLabel : {};
        let lifted = false;
        Object.keys(IMAGE_LABEL_TO_TYPO).forEach(function (flat) {
            if (ov[flat] !== undefined && role[IMAGE_LABEL_TO_TYPO[flat]] === undefined) {
                role[IMAGE_LABEL_TO_TYPO[flat]] = ov[flat];
                lifted = true;
            }
            delete ov[flat];
        });
        if (lifted || Object.keys(role).length) {
            typo.widgetLabel = role;
            ov.typography = typo;
        }
    }

    function liftGaugeIconOffset(ov) {
        if (!isPlainObject(ov)) return;
        const icons = isPlainObject(ov.icons) ? ov.icons : {};
        const on = isPlainObject(icons.on) ? icons.on : {};
        if (ov.iconOffX !== undefined && on.offsetX === undefined) on.offsetX = ov.iconOffX;
        if (ov.iconOffY !== undefined && on.offsetY === undefined) on.offsetY = ov.iconOffY;
        delete ov.iconOffX;
        delete ov.iconOffY;
        if (ov.layout !== undefined) {
            if (ov.layoutRound === undefined && ov.layoutHorizontal === undefined && ov.layoutHoriz === undefined) {
                on._keepLayout = ov.layout;
            }
            if (ov.barType === 'horizontal' || ov.layoutHoriz !== undefined || ov.layoutHorizontal !== undefined) {
                if (ov.layoutHorizontal === undefined && ov.layoutHoriz === undefined) ov.layoutHorizontal = ov.layout;
            } else if (ov.layoutRound === undefined) {
                ov.layoutRound = ov.layout;
            }
            delete ov.layout;
        }
        if (Object.keys(on).length) {
            delete on._keepLayout;
            icons.on = on;
            ov.icons = icons;
        }
    }

    function stripJunkOverrides(ov) {
        if (!isPlainObject(ov)) return ov;
        JUNK_OVERRIDE_KEYS.forEach(function (k) { delete ov[k]; });
        Object.keys(ov).forEach(function (k) {
            if (/^item_\d+_state$/.test(k)) delete ov[k];
            if (/^menuItem_\d+_/.test(k)) delete ov[k];
        });
        if (isPlainObject(ov.icons) && isPlainObject(ov.icons.off) && Object.keys(ov.icons.off).length === 0) {
            delete ov.icons.off;
        }
        if (isPlainObject(ov.icons) && Object.keys(ov.icons).length === 0) delete ov.icons;
        if (isPlainObject(ov.iconColorOverrides)) {
            ['on', 'off'].forEach(function (slot) {
                const s = ov.iconColorOverrides[slot];
                if (isPlainObject(s) && s.enabled === false && (s.color === undefined || Object.keys(s).length <= 2)) {
                    delete ov.iconColorOverrides[slot];
                }
            });
            if (Object.keys(ov.iconColorOverrides).length === 0) delete ov.iconColorOverrides;
        }
        if (isPlainObject(ov.typography)) {
            Object.keys(ov.typography).forEach(function (role) {
                const block = ov.typography[role];
                if (!isPlainObject(block)) return;
                const keys = Object.keys(block);
                const onlyZeroOffset = keys.length > 0 && keys.every(function (k) {
                    return (k === 'offsetX' || k === 'offsetY') && (block[k] === 0 || block[k] === '0');
                });
                if (onlyZeroOffset) delete ov.typography[role];
            });
            if (Object.keys(ov.typography).length === 0) delete ov.typography;
        }
        if (isPlainObject(ov.audio)) {
            const audioKeys = Object.keys(ov.audio);
            const blank = audioKeys.every(function (k) {
                const v = ov.audio[k];
                return v === '' || v == null || (Array.isArray(v) && v.length === 0) || (isPlainObject(v) && Object.keys(v).length === 0);
            });
            if (blank) delete ov.audio;
        }
        stripMenuRowAudio(ov);
        return ov;
    }

    /** Menu rows do not store sounds. Widget clips live on overrides.audio. */
    function stripMenuRowAudio(node) {
        if (!isPlainObject(node) || !Array.isArray(node.menuItems)) return node;
        node.menuItems.forEach(function (item) {
            if (isPlainObject(item) && Object.prototype.hasOwnProperty.call(item, 'audio')) {
                delete item.audio;
            }
        });
        return node;
    }

    function rewriteBindingNode(node, type) {
        if (!isPlainObject(node)) return node;
        const rename = WIDGET_OVERRIDE_RENAME[type] || {};
        const out = {};
        Object.keys(node).forEach(function (k) {
            let dest = k;
            if (CONTAINER_FLAT_TO_PATH[k]) {
                setAtPath(out, ['container'].concat(CONTAINER_FLAT_TO_PATH[k]), node[k]);
                return;
            }
            if (IMAGE_LABEL_TO_TYPO[k] && (type === 'image' || type === 'videostream')) {
                setAtPath(out, ['typography', 'widgetLabel', IMAGE_LABEL_TO_TYPO[k]], node[k]);
                return;
            }
            if (k === 'iconOffX') {
                setAtPath(out, ['icons', 'on', 'offsetX'], node[k]);
                return;
            }
            if (k === 'iconOffY') {
                setAtPath(out, ['icons', 'on', 'offsetY'], node[k]);
                return;
            }
            if (rename[k]) dest = rename[k];
            const v = node[k];
            if (isPlainObject(v) && dest !== k) {
                out[dest] = rewriteBindingNode(v, type);
            } else if (isPlainObject(v)) {
                out[dest] = rewriteBindingNode(v, type);
            } else {
                out[dest] = v;
            }
        });
        return out;
    }

    function convertBindingsToV2(bindings, type) {
        if (!isPlainObject(bindings)) return bindings || {};
        const out = rewriteBindingNode(cloneJson(bindings), type === 'textbox' ? 'list' : type);
        stripMenuRowAudio(out);
        return out;
    }

    function convertOverridesToV2(overrides, type) {
        const ov = cloneJson(overrides) || {};
        if (!isPlainObject(ov)) return {};
        const t = type === 'textbox' ? 'list' : type;
        nestContainerFields(ov);
        applyRenameMap(ov, WIDGET_OVERRIDE_RENAME[t]);
        if (t === 'image' || t === 'videostream') liftImageTypography(ov);
        if (t === 'gauge') liftGaugeIconOffset(ov);
        stripJunkOverrides(ov);
        pruneEmptyObjects(ov);
        return ov;
    }

    function forEachWidgetData(data, fn) {
        if (!isPlainObject(data) || typeof fn !== 'function') return;
        const widgets = isPlainObject(data.widgets) ? data.widgets : {};
        Object.keys(widgets).forEach(function (id) {
            if (widgets[id]) fn(widgets[id], id, 'widgets');
        });
        const groups = isPlainObject(data.groups) ? data.groups : {};
        Object.keys(groups).forEach(function (gid) {
            const g = groups[gid];
            const nested = g && isPlainObject(g.widgets) ? g.widgets : {};
            Object.keys(nested).forEach(function (wid) {
                if (nested[wid]) fn(nested[wid], wid, 'groups');
            });
        });
    }

    function convertDashboardToV2(data) {
        const out = cloneJson(data) || {};
        out.master = convertMasterToV2(out.master);
        forEachWidgetData(out, function (w) {
            const type = w.type === 'textbox' ? 'list' : w.type;
            w.overrides = convertOverridesToV2(w.overrides, type);
            w.bindings = convertBindingsToV2(w.bindings, type);
        });
        out.version = '2.0.0';
        return out;
    }

    function applyContainerNestedToConfig(c) {
        if (!c || !isPlainObject(c.container)) return c;
        const box = c.container;
        if (box.show !== undefined) c.bgVisible = box.show;
        if (box.background) {
            if (box.background.startColor !== undefined) c.bgColStart = box.background.startColor;
            if (box.background.startOpacity !== undefined) c.bgOpacityStart = box.background.startOpacity;
            if (box.background.endColor !== undefined) c.bgColEnd = box.background.endColor;
            if (box.background.endOpacity !== undefined) c.bgOpacityEnd = box.background.endOpacity;
            if (box.background.angle !== undefined) c.bgAngle = box.background.angle;
            if (box.background.blur !== undefined) c.bgBlur = box.background.blur;
        }
        if (box.glow) {
            if (box.glow.enabled !== undefined) c.glowEnabled = box.glow.enabled;
            if (box.glow.color !== undefined) c.glowColor = box.glow.color;
            if (box.glow.radius !== undefined) c.glowRadius = box.glow.radius;
            if (box.glow.opacity !== undefined) c.glowOpacity = box.glow.opacity;
        }
        if (box.border) {
            if (box.border.color !== undefined) c.borderColor = box.border.color;
            if (box.border.width !== undefined) c.borderWidth = box.border.width;
            if (box.border.opacity !== undefined) c.borderOpacity = box.border.opacity;
            if (box.border.cornerRadius !== undefined) c.cornerRadius = box.border.cornerRadius;
        }
        if (box.innerGlow) {
            if (box.innerGlow.size !== undefined) c.innerGlow = box.innerGlow.size;
            if (box.innerGlow.color !== undefined) c.innerGlowColor = box.innerGlow.color;
            if (box.innerGlow.opacity !== undefined) c.innerGlowOpacity = box.innerGlow.opacity;
        }
        if (box.width !== undefined) c.width = box.width;
        if (box.height !== undefined) c.height = box.height;
        if (box.padding !== undefined) c.padding = box.padding;
        // Expand _correct_* siblings from nested container back to flat config keys
        // so the runtime correction system (which reads flat c[key + '_correct_*']) works.
        Object.keys(CONTAINER_FLAT_TO_PATH).forEach(function (flat) {
            const p = CONTAINER_FLAT_TO_PATH[flat];
            let parent = box;
            for (let i = 0; i < p.length - 1; i++) {
                if (!isPlainObject(parent)) return;
                parent = parent[p[i]];
            }
            if (!isPlainObject(parent)) return;
            const leaf = p[p.length - 1];
            Object.keys(parent).forEach(function (k) {
                const m = String(k).match(/^(.+)_correct_(en|hue|sat|bri|hue_fixed|sat_fixed|bri_fixed)$/);
                if (!m || m[1] !== leaf) return;
                c[flat + '_correct_' + m[2]] = parent[k];
            });
        });
        return c;
    }

    function applyInstanceAliasesToConfig(c, type, overwrite) {
        if (!c) return c;
        const t = type === 'textbox' ? 'list' : type;
        const map = INSTANCE_ALIAS_TO_INTERNAL[t];
        if (!map) return c;
        const force = overwrite === true;
        Object.keys(map).forEach(function (neu) {
            const old = map[neu];
            if (c[neu] !== undefined && c[neu] !== null && (force || c[old] === undefined || c[old] === null)) {
                c[old] = c[neu];
            }
            // Also map _correct_* siblings (e.g. mainColor_correct_en -> colMain_correct_en)
            Object.keys(c).forEach(function (k) {
                const parts = correctionParts(k);
                if (!parts || parts.base !== neu) return;
                const dest = old + parts.suffix;
                if (force || c[dest] === undefined) c[dest] = c[k];
            });
        });
        return c;
    }

    const EDITOR_LEAF_TO_MASTER_KEY = {};
    Object.keys(WD).forEach(function (runtimeKey) {
        const p = WD[runtimeKey];
        if (!p || p.length < 2) return;
        const typ = p[0];
        const leaf = p[p.length - 1];
        if (!EDITOR_LEAF_TO_MASTER_KEY[typ]) EDITOR_LEAF_TO_MASTER_KEY[typ] = {};
        const prev = EDITOR_LEAF_TO_MASTER_KEY[typ][leaf];
        if (!prev || p.length < (WD[prev] ? WD[prev].length : 99)) {
            EDITOR_LEAF_TO_MASTER_KEY[typ][leaf] = runtimeKey;
        }
    });

    function lookupMasterDefaultKey(type, editorKey) {
        if (!type || !editorKey) return undefined;
        const t = type === 'textbox' ? 'list' : type;
        const table = EDITOR_LEAF_TO_MASTER_KEY[t];
        return table ? table[editorKey] : undefined;
    }

    function sanitizeOverridesForPersist(overrides, type) {
        return convertOverridesToV2(overrides, type);
    }

    function getDeep(obj, path) {
        return getAtPath(obj, path);
    }

    function setDeep(obj, path, value) {
        setAtPath(obj, path, value);
    }

    const SaveFormatV2 = {
        TYPO_SUFFIX: TYPO_SUFFIX,
        CORE_RUNTIME_TO_PATH: CORE_RUNTIME_TO_PATH,
        WIDGET_DEFAULT_KEY_TO_PATH: WD,
        CONTAINER_FLAT_TO_PATH: CONTAINER_FLAT_TO_PATH,
        WIDGET_OVERRIDE_RENAME: WIDGET_OVERRIDE_RENAME,
        INSTANCE_ALIAS_TO_INTERNAL: INSTANCE_ALIAS_TO_INTERNAL,
        IMAGE_LABEL_TO_TYPO: IMAGE_LABEL_TO_TYPO,
        JUNK_OVERRIDE_KEYS: JUNK_OVERRIDE_KEYS,
        isPlainObject: isPlainObject,
        cloneJson: cloneJson,
        getAtPath: getAtPath,
        hasAtPath: hasAtPath,
        setAtPath: setAtPath,
        getDeep: getDeep,
        setDeep: setDeep,
        isV2Master: isV2Master,
        lookupRuntimePath: lookupRuntimePath,
        flattenMasterToRuntimeBag: flattenMasterToRuntimeBag,
        nestRuntimeBagToV2Master: nestRuntimeBagToV2Master,
        expandV2MasterToRuntime: expandV2MasterToRuntime,
        convertMasterToV2: convertMasterToV2,
        convertOverridesToV2: convertOverridesToV2,
        convertBindingsToV2: convertBindingsToV2,
        convertDashboardToV2: convertDashboardToV2,
        applyContainerNestedToConfig: applyContainerNestedToConfig,
        applyInstanceAliasesToConfig: applyInstanceAliasesToConfig,
        lookupMasterDefaultKey: lookupMasterDefaultKey,
        EDITOR_LEAF_TO_MASTER_KEY: EDITOR_LEAF_TO_MASTER_KEY,
        sanitizeOverridesForPersist: sanitizeOverridesForPersist,
        stripMenuRowAudio: stripMenuRowAudio,
        stripJunkOverrides: stripJunkOverrides,
        forEachWidgetData: forEachWidgetData
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SaveFormatV2;
    }
    root.SaveFormatV2 = SaveFormatV2;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
