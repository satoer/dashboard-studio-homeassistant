class SwitchWidget extends BaseWidget {
    static get metadata() {
        return { label: "Switch / Button", shortName: "Switch", icon: "ph-toggle-left", category: "Control", color_dark: "hsl(220, 80%, 65%)", color_light: "hsl(220, 85%, 35%)", version: "2.3.5", date: "2026-11-07" };
    }

    /** Toggle + Go to Page (+ Topic): mutual exclusion by dashboard page; no manual group ID. */
    static usesImplicitPageNavExclusion(values) {
        const mode = (values && values.mode) || (values && values.defaultSwitchMode) || 'toggle';
        const actionType = (values && values.actionType) || 'topic';
        return mode === 'toggle' && actionType === 'page';
    }

    /** Toggle + Send Topic or Open URL: exclusion uses Selection Group ID. */
    static usesManualSelectionGroup(values) {
        const mode = (values && values.mode) || (values && values.defaultSwitchMode) || 'toggle';
        const actionType = (values && values.actionType) || 'topic';
        return mode === 'toggle' && (actionType === 'topic' || actionType === 'url');
    }

    static resolvedMode(values, isGlobal) {
        if (isGlobal) {
            return String((values && values.defaultSwitchMode) || 'toggle').trim() || 'toggle';
        }
        const raw = values && values.mode;
        if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
            return String(raw).trim();
        }
        const m = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultSwitchMode : 'toggle';
        return String(m || 'toggle').trim() || 'toggle';
    }

    static resolvedStyle(values, isGlobal) {
        if (isGlobal) {
            return String((values && values.defaultSwitchStyle) || 'switch').trim() || 'switch';
        }
        const raw = values && values.style;
        if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
            return String(raw).trim();
        }
        const m = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultSwitchStyle : 'switch';
        return String(m || 'switch').trim() || 'switch';
    }

    static resolvedActionType(values) {
        const raw = values && values.actionType;
        if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
            return String(raw).trim();
        }
        return 'topic';
    }

    static isPushMode(values, isGlobal) {
        return SwitchWidget.resolvedMode(values, isGlobal) === 'push';
    }

    static isPillStyle(values, isGlobal) {
        return SwitchWidget.resolvedStyle(values, isGlobal) === 'switch';
    }

    static isButtonStyle(values, isGlobal) {
        return SwitchWidget.resolvedStyle(values, isGlobal) === 'button';
    }

    static isImageOnlyStyle(values, isGlobal) {
        return SwitchWidget.resolvedStyle(values, isGlobal) === 'image-only';
    }

    static isTextOnlyStyle(values, isGlobal) {
        return SwitchWidget.resolvedStyle(values, isGlobal) === 'text-only';
    }

    static isInvisibleStyle(values, isGlobal) {
        return SwitchWidget.resolvedStyle(values, isGlobal) === 'invisible';
    }

    static isRectFaceStyle(values, isGlobal) {
        const s = SwitchWidget.resolvedStyle(values, isGlobal);
        return s === 'button' || s === 'image-only' || s === 'text-only';
    }

    /** Appearance fields other than Visual Style (hidden for Invisible). */
    static showsSwitchAppearanceDetail(values, isGlobal) {
        return !SwitchWidget.isInvisibleStyle(values, isGlobal);
    }

    /** Background, outline, and bevel editor rows — not Image Only, Text Only, or Invisible. */
    static showsButtonFaceAppearance(values, isGlobal) {
        return !SwitchWidget.isImageOnlyStyle(values, isGlobal)
            && !SwitchWidget.isTextOnlyStyle(values, isGlobal)
            && !SwitchWidget.isInvisibleStyle(values, isGlobal);
    }

    /** Face / thumb inner-glow and outline color/opacity leaves show once a width is set. */
    static buttonInnerGlowDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'buttonInnerGlow', 'switchButtonInnerGlow');
    }
    static thumbInnerGlowDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'thumbInnerGlow', 'switchThumbInnerGlow');
    }
    static outlineDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'outlineWidth', 'switchOutlineWidth');
    }
    static thumbOutlineDetailsVisible(values, isGlobal) {
        return BaseWidget.chromeWidthDetailsVisible(values, isGlobal, 'thumbOutlineWidth', 'switchThumbOutlineWidth');
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

    /** Editor: selection group, Off Value, and State (On/Off) — not push button. On Value stays visible for push. */
    static showSelectionGroupBehaviorFields(values, isGlobal) {
        return !SwitchWidget.isPushMode(values, isGlobal);
    }

    static selectionGroupIdTrimmed(values) {
        return String((values && values.selectionGroup) || '').trim();
    }

    /** Editor: bundled allow-empty + send-off rows under Selection Group ID. */
    static showSelectionGroupSubOptions(values, isGlobal) {
        return SwitchWidget.showSelectionGroupBehaviorFields(values, isGlobal)
            && SwitchWidget.selectionGroupIdTrimmed(values).length > 0;
    }

    /** Activator or peer may participate in mutual exclusion (manual or implicit page nav). */
    static isGroupExclusionAvailable(values) {
        return SwitchWidget.usesImplicitPageNavExclusion(values) || SwitchWidget.usesManualSelectionGroup(values);
    }

    /**
     * Same exclusion set: implicit page-nav with page-nav, or same non-empty manual group (topic/url only).
     * Page mode never matches manual group IDs (stored ID is ignored at runtime for page items).
     */
    static exclusionPeersMatch(activator, peer) {
        if (!SwitchWidget.isGroupExclusionAvailable(peer)) return false;
        const aImp = SwitchWidget.usesImplicitPageNavExclusion(activator);
        const pImp = SwitchWidget.usesImplicitPageNavExclusion(peer);
        if (aImp && pImp) return true;
        if (aImp !== pImp) return false;
        const ak = String((activator && activator.selectionGroup) || '').trim();
        const pk = String((peer && peer.selectionGroup) || '').trim();
        return ak.length > 0 && ak === pk;
    }

    static getActionTypeOptions(values) {
        const hasConfiguredOutputTopic = SwitchWidget.hasConfiguredOutputTopic(values);
        const pageOptionLabel = hasConfiguredOutputTopic ? 'Go to Page + Topic' : 'Go to Page';
        const urlOptionLabel = hasConfiguredOutputTopic ? 'Open URL + Topic' : 'Open URL';
        return [
            { value: 'topic', text: 'Send Topic' },
            { value: 'page', text: pageOptionLabel },
            { value: 'url', text: urlOptionLabel }
        ];
    }

    /** Toggle mode with separate on/off output topics enabled. */
    static useSeparateOnOffTopics(values, isGlobal) {
        return SwitchWidget.showSelectionGroupBehaviorFields(values, isGlobal)
            && values && values.separateOnOffTopics === true;
    }

    /** Primary output topic(s) configured — used for On Click option labels. */
    static hasConfiguredOutputTopic(values) {
        const onTopic = Boolean(String((values && values.outputTopic) || '').trim());
        if (!SwitchWidget.useSeparateOnOffTopics(values, false)) {
            return onTopic;
        }
        const offTopic = Boolean(String((values && values.outputTopicOff) || '').trim());
        return onTopic || offTopic;
    }

    static get HOLD_TO_ACTIVATE_DURATION_DEFAULT() {
        return 1.5;
    }

    static get HOLD_TO_ACTIVATE_DURATION_MIN() {
        return 0.5;
    }

    static get HOLD_TO_ACTIVATE_DURATION_MAX() {
        return 10;
    }

    static resolvedHoldToActivateSeconds() {
        const def = SwitchWidget.HOLD_TO_ACTIVATE_DURATION_DEFAULT;
        const raw = (typeof MASTER_SETTINGS !== 'undefined') ? MASTER_SETTINGS.holdToActivateDuration : def;
        const sec = Number(raw);
        if (!Number.isFinite(sec) || sec <= 0) return def;
        if (sec < SwitchWidget.HOLD_TO_ACTIVATE_DURATION_MIN) return SwitchWidget.HOLD_TO_ACTIVATE_DURATION_MIN;
        if (sec > SwitchWidget.HOLD_TO_ACTIVATE_DURATION_MAX) return SwitchWidget.HOLD_TO_ACTIVATE_DURATION_MAX;
        return sec;
    }

    static resolvedHoldToActivateMs() {
        return Math.round(SwitchWidget.resolvedHoldToActivateSeconds() * 1000);
    }

    static formatHoldToActivateDurationLabel(sec) {
        const n = Math.round(Number(sec) * 10) / 10;
        if (n === 1) return '1 second';
        return String(n) + ' seconds';
    }

    static get HOLD_TO_ACTIVATE_HINT() {
        const label = SwitchWidget.formatHoldToActivateDurationLabel(SwitchWidget.resolvedHoldToActivateSeconds());
        return 'Runs this action after you press and hold the button for ' + label + '.';
    }

    static _armTimeout(fn, ms) {
        if (typeof WorkerTimer !== 'undefined' && typeof WorkerTimer.setTimeout === 'function') {
            return WorkerTimer.setTimeout(fn, ms);
        }
        return setTimeout(fn, ms);
    }

    static _clearArmedTimeout(handle) {
        if (handle == null) return;
        if (typeof WorkerTimer !== 'undefined' && typeof WorkerTimer.clearTimeout === 'function') {
            WorkerTimer.clearTimeout(handle);
            return;
        }
        clearTimeout(handle);
    }

    static extraOutputTopicDefaults() {
        return { topic: '', topicOff: '', onPayload: 'true', offPayload: 'false', holdToActivate: false };
    }

    static normalizeExtraOutputTopics(raw) {
        if (!Array.isArray(raw)) return [];
        return raw.map(function (entry) {
            if (entry == null || typeof entry !== 'object') {
                return SwitchWidget.extraOutputTopicDefaults();
            }
            return {
                topic: entry.topic != null ? String(entry.topic) : '',
                topicOff: entry.topicOff != null ? String(entry.topicOff) : '',
                onPayload: entry.onPayload !== undefined && entry.onPayload !== null ? String(entry.onPayload) : 'true',
                offPayload: entry.offPayload !== undefined && entry.offPayload !== null ? String(entry.offPayload) : 'false',
                holdToActivate: entry.holdToActivate === true
            };
        });
    }

    static hasAnyHoldToActivate(values) {
        if (values && values.holdToActivate === true) return true;
        const extras = SwitchWidget.normalizeExtraOutputTopics(values && values.extraOutputTopics);
        for (let i = 0; i < extras.length; i++) {
            if (extras[i].holdToActivate === true) return true;
        }
        return false;
    }

    static matchesHoldFilter(holdEnabled, filter) {
        if (!filter || filter === 'all') return true;
        if (filter === 'hold') return holdEnabled === true;
        return holdEnabled !== true;
    }

    static get SWITCH_MODE_OPTIONS() {
        return [
            { value: 'toggle', text: 'Toggle Switch' },
            { value: 'push', text: 'Push Button (Momentary)' }
        ];
    }

    static get SWITCH_STYLE_OPTIONS() {
        return [
            { value: 'switch', text: 'Switch (Pill)' },
            { value: 'button', text: 'Button (Rect)' },
            { value: 'image-only', text: 'Image Only' },
            { value: 'text-only', text: 'Text Only' },
            { value: 'invisible', text: 'Invisible' }
        ];
    }

    /** Hide a schema group or field when Visual Style is Invisible. */
    static _hideWhenInvisibleStyle(target) {
        if (!target) return;
        const prevVisibleWhen = target.visibleWhen;
        target.visibleWhen = function (values, isGlobal) {
            if (SwitchWidget.isInvisibleStyle(values, isGlobal)) return false;
            if (typeof prevVisibleWhen === 'function') return prevVisibleWhen(values, isGlobal);
            return true;
        };
        const deps = Array.isArray(target.dependsOn) ? target.dependsOn.slice() : [];
        if (deps.indexOf('style') < 0) deps.push('style');
        if (deps.indexOf('defaultSwitchStyle') < 0) deps.push('defaultSwitchStyle');
        target.dependsOn = deps;
    }

    static get COMMON_SCHEMA() {
        const schema = JSON.parse(JSON.stringify(BaseWidget.COMMON_SCHEMA));
        schema.forEach(function (group) {
            if (!group) return;
            if (group.id === 'style_group') {
                SwitchWidget._hideWhenInvisibleStyle(group);
                return;
            }
            if (group.id !== 'layout_group' || !Array.isArray(group.fields)) return;
            group.fields.forEach(function (field) {
                if (field && field.key === 'padding') SwitchWidget._hideWhenInvisibleStyle(field);
            });
        });
        return schema;
    }

    /**
     * When `showIcon` is not explicitly stored on a widget (`overrides`), pick the implicit default:
     * Pill and Text Only hide the icon; Button and Image Only show it. Master `defaultSwitchShowIcon` only
     * applies to non-pill styles (so global defaults can turn icons off for buttons if desired).
     */
    static resolveImplicitShowIcon(styleKey, masterDefaultSwitchShowIcon) {
        const st = String(styleKey || 'switch').trim() || 'switch';
        if (st === 'switch' || st === 'text-only' || st === 'invisible') return false;
        if (masterDefaultSwitchShowIcon !== undefined && masterDefaultSwitchShowIcon !== null) {
            return masterDefaultSwitchShowIcon === true;
        }
        return true;
    }

    /** Editor: grey out Show Icon while it follows implicit style default (pill only for instances). */
    static showIconCheckboxDisableWhen(values, isGlobal) {
        try {
            if (isGlobal) {
                const stRaw = values && values.defaultSwitchStyle;
                let st = (stRaw !== undefined && stRaw !== null && String(stRaw).trim() !== '')
                    ? String(stRaw).trim()
                    : 'switch';
                if (st !== 'switch' && st !== 'text-only' && st !== 'invisible') return false;
                if (typeof Editor === 'undefined' || typeof Editor._getGlobalFactoryDefault !== 'function'
                        || typeof Editor._valuesDifferForEditor !== 'function') {
                    return false;
                }
                const defVal = Editor._getGlobalFactoryDefault({ key: 'defaultSwitchShowIcon' });
                return !Editor._valuesDifferForEditor(values.defaultSwitchShowIcon, defVal);
            }
            if (typeof Editor === 'undefined' || typeof Dashboard === 'undefined' || !Editor.currentId
                    || Editor.currentId === 'MULTIPLE') return false;
            const wdg = Dashboard.widgets[Editor.currentId];
            if (!wdg || wdg.type !== 'switch') return false;
            const ovr = wdg.overrides || {};
            if (Object.prototype.hasOwnProperty.call(ovr, 'showIcon')) return false;
            const st = values.style || values.defaultSwitchStyle || 'switch';
            return st === 'switch' || st === 'text-only' || st === 'invisible';
        } catch (_eSd) {
            return false;
        }
    }

    static get SWITCH_ALIGN_OPTIONS() {
        return [
            { value: 'flex-start', text: 'Top / Left' },
            { value: 'center', text: 'Center' },
            { value: 'flex-end', text: 'Bottom / Right' },
            { value: 'space-between', text: 'Space Between' }
        ];
    }

    static get SWITCH_LABEL_POS_OPTIONS() {
        return [
            { value: 'top', text: 'Outside Top' },
            { value: 'bottom', text: 'Outside Bottom' },
            { value: 'left', text: 'Outside Left' },
            { value: 'right', text: 'Outside Right' },
            { value: 'inside_top', text: 'Inside Top' },
            { value: 'inside_bottom', text: 'Inside Bottom' },
            { value: 'inside_left', text: 'Inside Left' },
            { value: 'inside_right', text: 'Inside Right' }
        ];
    }

    static get SWITCH_TEXT_ONLY_LABEL_VERTICAL_OPTIONS() {
        return [
            { value: 'top', text: 'Align Top' },
            { value: 'center', text: 'Align Middle' },
            { value: 'bottom', text: 'Align Bottom' }
        ];
    }

    /** Maps Text Only vertical position to flex `justify-content` on the label column. */
    static textOnlyLabelVerticalAlignToJustify(align) {
        const a = String(align || 'center').toLowerCase().trim();
        if (a === 'top') return 'flex-start';
        if (a === 'bottom') return 'flex-end';
        return 'center';
    }

    // --- Global Configuration Injection ---
    static get globalSettings() {
        return {
            defaultSwitchMode: "toggle",
            defaultSwitchStyle: "switch",
            defaultSwitchAlign: "center",
            defaultSwitchLabelPos: "top",
            defaultSwitchLabelHint: "truncated",
            defaultSwitchBevel: false,

            defaultSwitchScale: 1.0,
            switchCornerRadius: 12,
            switchButtonContentInset: 10,
            defaultSwitchIconSize: 24,
            defaultSwitchIconOffX: 0,
            defaultSwitchIconOffY: 0,

            defaultSwitchShowIcon: true,
            defaultSwitchIconOnFilled: true,
            defaultSwitchIconOffFilled: true,
            defaultSwitchIconOn: 'ph-check-fat',

            switchColOn: "@glow",
            switchColOff: "@accentOff",
            switchColHover: "@accent",
            switchColThumb: "@thumb",

            switchColLabel: "@textMuted",

            switchButtonOutsideDefaultFs: 12,
            switchButtonOutsideDefaultAlign: "center",
            switchButtonOutsideDefaultCase: "uppercase",
            switchButtonOutsideDefaultBold: false,
            switchButtonOutsideDefaultItalic: false,
            switchButtonOutsideDefaultCol: "@text",
            switchButtonOutsideDefaultColOff: "@textMuted",
            switchButtonOutsideDefaultOpacity: 100,
            switchButtonOutsideDefaultOffX: 0,
            switchButtonOutsideDefaultOffY: 0,

            switchButtonInsideDefaultFs: 12,
            switchButtonInsideDefaultAlign: "center",
            switchButtonInsideDefaultCase: "capitalize",
            switchButtonInsideDefaultBold: false,
            switchButtonInsideDefaultItalic: false,
            switchButtonInsideDefaultCol: "@onAccent",
            switchButtonInsideDefaultColOff: "@thumb",
            switchButtonInsideDefaultOpacity: 100,
            switchButtonInsideDefaultOffX: 0,
            switchButtonInsideDefaultOffY: 0,

            switchIconColOn: "@onAccent",
            switchIconColOff: "@icon",
            switchIconColHover: "@text",

            switchGlow: true,
            switchGlowColor: "@glow",
            switchGlowRadius: 40,
            switchOutlineWidth: 0,
            switchOutlineColor: "@borderAccent",
            switchBackgroundOpacity: 100,
            switchOutlineOpacity: 100,
            switchButtonBlur: 0,
            switchButtonInnerGlow: 0,
            switchButtonInnerGlowColor: "@borderAccent",
            switchButtonInnerGlowOpacity: 100,
            switchThumbOutlineWidth: 0,
            switchThumbOutlineColor: "@accent",
            switchThumbOutlineOpacity: 100,
            switchThumbInnerGlow: 0,
            switchThumbInnerGlowColor: "@accent",
            switchThumbInnerGlowOpacity: 100
        };
    }

    // --- Global Editor Schema ---
    static get basicSettingKeys() {
        return [
            'mode', 'actionType', 'outputTopic', 'outputTopicOff',
            'onPayload', 'offPayload', 'state', 'pageTo', 'urlTo', 'urlNewTab',
            'iconOn', 'iconOff'
        ];
    }

    static get globalSchema() {
        return [
            { type: 'heading', label: 'Mode & layout', cols: 12 },
            {
                key: 'defaultSwitchMode',
                type: 'select',
                label: 'Mode',
                options: SwitchWidget.SWITCH_MODE_OPTIONS,
                cols: 6
            },
            {
                key: 'defaultSwitchStyle',
                type: 'select',
                label: 'Visual Style',
                options: SwitchWidget.SWITCH_STYLE_OPTIONS,
                cols: 6
            },
            {
                key: 'defaultSwitchAlign',
                type: 'select',
                label: 'Button Alignment',
                options: SwitchWidget.SWITCH_ALIGN_OPTIONS,
                cols: 6
            },
            {
                key: 'defaultSwitchLabelPos',
                type: 'select',
                label: 'Button Label Position',
                options: SwitchWidget.SWITCH_LABEL_POS_OPTIONS,
                cols: 6
            },
            {
                key: 'defaultSwitchLabelHint',
                type: 'select',
                label: 'Label Hint',
                options: SwitchWidget.labelHintOptions,
                cols: 12,
                hint: 'Shows the full button label in a browser tooltip on hover. When Label Is Truncated applies only when the text is cut off or clipped by the layout.'
            },
            { key: 'defaultSwitchBevel', type: 'checkbox', label: '3D Bevel', cols: 12 },

            { type: 'heading', label: 'Size & spacing', cols: 12 },
            { key: 'defaultSwitchScale', type: 'number', label: 'Overall Scale Multiplier', cols: 4, step: 0.1 },
            { key: 'switchCornerRadius', type: 'number', label: 'Button Radius', cols: 4 },
            { key: 'switchButtonContentInset', type: 'number', label: 'Content Inset (px)', cols: 4 },

            { type: 'heading', label: 'Icon', cols: 12 },
            { key: 'defaultSwitchIconOn', type: 'text', label: 'Default Icon Name (On)', cols: 12 },
            { key: 'defaultSwitchIconSize', type: 'number', label: 'Icon Base Size (px)', cols: 4 },
            { key: 'defaultSwitchIconOffX', type: 'number', label: 'Icon Offset X', cols: 4 },
            { key: 'defaultSwitchIconOffY', type: 'number', label: 'Icon Offset Y', cols: 4 },
            {
                key: 'defaultSwitchShowIcon',
                type: 'checkbox',
                label: 'Show Icon',
                cols: 4,
                dependsOn: ['defaultSwitchStyle'],
                hint: 'Ignored for Pill while on (Def). For new Button / Image widgets, set the default here.',
                disableWhen: (values, isGlobal) => SwitchWidget.showIconCheckboxDisableWhen(values, isGlobal === true)
            },
            { key: 'defaultSwitchIconOnFilled', type: 'checkbox', label: 'Filled Icon (On)', cols: 4 },
            { key: 'defaultSwitchIconOffFilled', type: 'checkbox', label: 'Filled Icon (Off)', cols: 4 },

            { type: 'heading', label: 'Button face colors', cols: 12 },
            { key: 'switchColOn', type: 'color', label: 'Background Color (On)', cols: 4 },
            { key: 'switchColOff', type: 'color', label: 'Background Color (Off)', cols: 4 },
            { key: 'switchColHover', type: 'color', label: 'Background Color (Hover)', cols: 4 },
            { key: 'switchBackgroundOpacity', type: 'number', label: 'Background Opacity', cols: 6, min: 0, max: 100 },
            { key: 'switchButtonBlur', type: 'number', label: 'Background Blur', cols: 6, min: 0 },
            { key: 'switchColThumb', type: 'color', label: 'Thumb Color', cols: 12, gridColStart: 1,
                dependsOn: ['defaultSwitchStyle'],
                visibleWhen: (values) => SwitchWidget.isPillStyle(values, true)
            },
            { key: 'switchThumbOutlineWidth', type: 'number', label: 'Thumb Outline Width', cols: 4, min: 0, gridColStart: 1,
                dependsOn: ['defaultSwitchStyle'],
                visibleWhen: (values) => SwitchWidget.isPillStyle(values, true)
            },
            { key: 'switchThumbOutlineColor', type: 'color', label: 'Thumb Outline Color', cols: 4,
                dependsOn: ['defaultSwitchStyle', 'switchThumbOutlineWidth'],
                visibleWhen: (values) => SwitchWidget.isPillStyle(values, true)
                    && SwitchWidget.thumbOutlineDetailsVisible(values, true)
            },
            { key: 'switchThumbOutlineOpacity', type: 'number', label: 'Thumb Outline Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['defaultSwitchStyle', 'switchThumbOutlineWidth'],
                visibleWhen: (values) => SwitchWidget.isPillStyle(values, true)
                    && SwitchWidget.thumbOutlineDetailsVisible(values, true)
            },
            { key: 'switchThumbInnerGlow', type: 'number', label: 'Thumb Inner Glow', cols: 4, min: 0, gridColStart: 1,
                dependsOn: ['defaultSwitchStyle'],
                visibleWhen: (values) => SwitchWidget.isPillStyle(values, true)
            },
            {
                key: 'switchThumbInnerGlowColor', type: 'color', label: 'Thumb Inner Glow Color', cols: 4,
                dependsOn: ['switchThumbInnerGlow', 'defaultSwitchStyle'],
                visibleWhen: (values) => SwitchWidget.isPillStyle(values, true)
                    && SwitchWidget.thumbInnerGlowDetailsVisible(values, true)
            },
            {
                key: 'switchThumbInnerGlowOpacity', type: 'number', label: 'Thumb Inner Glow Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['switchThumbInnerGlow', 'defaultSwitchStyle'],
                visibleWhen: (values) => SwitchWidget.isPillStyle(values, true)
                    && SwitchWidget.thumbInnerGlowDetailsVisible(values, true)
            },

            { type: 'heading', label: 'Icon colors', cols: 12 },
            { key: 'switchIconColOn', type: 'color', label: 'Icon Color (On)', cols: 4 },
            { key: 'switchIconColOff', type: 'color', label: 'Icon Color (Off)', cols: 4 },
            { key: 'switchIconColHover', type: 'color', label: 'Icon Color (Hover)', cols: 4 },

            { type: 'heading', label: 'Effects', cols: 12 },
            { key: 'switchGlow', type: 'checkbox', label: 'Enable Glow', cols: 4 },
            { key: 'switchGlowColor', type: 'color', label: 'Glow Color', cols: 4 },
            { key: 'switchGlowRadius', type: 'number', label: 'Glow Radius', cols: 4 },
            { key: 'switchOutlineWidth', type: 'number', label: 'Outline Width', cols: 4, gridColStart: 1 },
            {
                key: 'switchOutlineColor', type: 'color', label: 'Outline Color', cols: 4,
                dependsOn: ['switchOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('switchOutlineWidth')
            },
            {
                key: 'switchOutlineOpacity', type: 'number', label: 'Outline Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['switchOutlineWidth'],
                visibleWhen: BaseWidget.elementOutlineDetailsVisible('switchOutlineWidth')
            },

            { type: 'heading', label: 'Button inner glow', cols: 12 },
            { key: 'switchButtonInnerGlow', type: 'number', label: 'Inner Glow', cols: 4, min: 0, gridColStart: 1 },
            {
                key: 'switchButtonInnerGlowColor', type: 'color', label: 'Inner Glow Color', cols: 4,
                dependsOn: ['switchButtonInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('switchButtonInnerGlow')
            },
            {
                key: 'switchButtonInnerGlowOpacity', type: 'number', label: 'Inner Glow Opacity', cols: 4, min: 0, max: 100,
                dependsOn: ['switchButtonInnerGlow'],
                visibleWhen: BaseWidget.elementInnerGlowVisible('switchButtonInnerGlow')
            },

            { type: 'heading', label: 'Typography', cols: 12 },
            BaseWidget.getTypographySchema('switchButtonOutsideDefault', 'Outside the Button', {
                dualColor: true,
                dualColorOnDefaultKey: 'defaultColLabel',
                dualColorOffDefaultKey: 'switchColLabel',
                fontDefaultKey: 'fontFamily',
                fontSizeDefaultKey: 'defaultFsLabel',
                alignDefaultKey: 'defaultTextAlign',
                caseDefaultKey: 'defaultLabelCase',
                boldDefaultKey: 'defaultLabelBold',
                italicDefaultKey: 'defaultLabelItalic',
                dualColorOnLabel: 'Outside Label (Switch On)',
                dualColorOffLabel: 'Outside Label (Switch Off)',
                alignLabel: 'Alignment',
                caseLabel: 'Case',
                boldLabel: 'Bold',
                italicLabel: 'Italic',
                offsetXLabel: 'Offset X',
                offsetYLabel: 'Offset Y'
            }),
            BaseWidget.getTypographySchema('switchButtonInsideDefault', 'Inside the Button', {
                dualColor: true,
                dualColorOnDefaultKey: 'switchButtonInsideDefaultCol',
                dualColorOffDefaultKey: 'switchButtonInsideDefaultColOff',
                fontDefaultKey: 'fontFamily',
                fontSizeDefaultKey: 'defaultFsLabel',
                alignDefaultKey: 'defaultTextAlign',
                caseDefaultKey: 'defaultLabelCase',
                boldDefaultKey: 'defaultLabelBold',
                italicDefaultKey: 'defaultLabelItalic',
                dualColorOnLabel: 'Inside Label (Switch On)',
                dualColorOffLabel: 'Inside Label (Switch Off)',
                alignLabel: 'Alignment',
                caseLabel: 'Case',
                boldLabel: 'Bold',
                italicLabel: 'Italic',
                offsetXLabel: 'Offset X',
                offsetYLabel: 'Offset Y'
            })
        ];
    }

    /**
     * True when the button label is laid out inside the control face (not outside top/bottom/left/right).
     */
    static labelPosIsInside(labelPos) {
        return String(labelPos || '').startsWith('inside');
    }

    /**
     * Fills flat `switchButtonOutsideLabel*` / `switchButtonInsideLabel*` from nested merge + master + universal defaults.
     */
    static ensureSwitchButtonLabelTypography(c, flatPrefix, masterPrefix, M) {
        const fontK = `${flatPrefix}Font`;
        const fsK = `${flatPrefix}Fs`;
        const colK = `${flatPrefix}Col`;
        const colOffK = `${flatPrefix}ColOff`;
        const alignK = `${flatPrefix}Align`;
        const caseK = `${flatPrefix}Case`;
        const boldK = `${flatPrefix}Bold`;
        const italicK = `${flatPrefix}Italic`;
        const opK = `${flatPrefix}Opacity`;
        const xK = `${flatPrefix}OffX`;
        const yK = `${flatPrefix}OffY`;
        const m = (suf) => M[masterPrefix + suf];

        if (!c[fontK] || String(c[fontK]).trim() === '') {
            const mf = m('Font');
            c[fontK] = (mf != null && String(mf).trim() !== '')
                ? mf
                : (c.fontFamily || M.fontFamily || "'Inter', sans-serif");
        }
        if (c[fsK] == null || c[fsK] === '') {
            const pick = m('Fs');
            c[fsK] = pick != null ? pick : (M.defaultFsLabel != null ? M.defaultFsLabel : 12);
        }
        if (masterPrefix === 'switchButtonInsideDefault') {
            if (!c[colK]) {
                c[colK] = m('Col') || '@onAccent';
            }
            if (c[colOffK] === undefined || c[colOffK] === null || String(c[colOffK]).trim() === '') {
                c[colOffK] = m('ColOff') || '@thumb';
            }
        } else {
            if (!c[colK]) {
                c[colK] = m('Col') || M.switchColLabel || M.defaultColLabel || '@textMuted';
            }
            if (c[colOffK] === undefined || c[colOffK] === null || String(c[colOffK]).trim() === '') {
                c[colOffK] = m('ColOff') || m('Col') || M.switchColLabel || '@textMuted';
            }
        }
        if (!c[alignK]) {
            c[alignK] = m('Align') || M.defaultTextAlign || 'center';
        }
        if (!c[caseK]) {
            c[caseK] = m('Case') || M.defaultLabelCase || 'uppercase';
        }
        if (c[boldK] === undefined || c[boldK] === null) {
            if (m('Bold') !== undefined && m('Bold') !== null) {
                c[boldK] = m('Bold') === true;
            } else {
                c[boldK] = c.defaultLabelBold === true || M.defaultLabelBold === true;
            }
        }
        if (c[italicK] === undefined || c[italicK] === null) {
            if (m('Italic') !== undefined && m('Italic') !== null) {
                c[italicK] = m('Italic') === true;
            } else {
                c[italicK] = M.defaultLabelItalic === true;
            }
        }
        if (c[opK] === undefined || c[opK] === null || c[opK] === '') {
            const opPick = m('Opacity');
            c[opK] = opPick != null ? opPick : 100;
        }
        if (c[xK] === undefined || c[xK] === null) {
            c[xK] = SwitchWidget.resolveAxisOffset(undefined, m('OffX'));
        }
        if (c[yK] === undefined || c[yK] === null) {
            c[yK] = SwitchWidget.resolveAxisOffset(undefined, m('OffY'));
        }
    }

    /**
     * Flattens overrides.typography.{groupLabel,buttonLabelOutside,buttonLabelInside} onto
     * switchGroupLabel* / switchButtonOutsideLabel* / switchButtonInsideLabel* for applyTypographyToElement and the editor.
     */
    /** Same slot shape as menu rows; applied to widget root `overrides`. */
    static defaultIconSlot() {
        return (typeof MenuWidget !== 'undefined' && MenuWidget.defaultIconSlot)
            ? MenuWidget.defaultIconSlot()
            : { source: 'phosphor', builtin: '', weight: 'fill', customUrl: '', tintImage: false };
    }

    /**
     * Factory / master fallback Phosphor slug for Icon (On) when **`defaultSwitchIconOn`** is unset or blank.
     */
    static get DEFAULT_SWITCH_ICON_ON_BUILTIN() {
        return 'ph-check-fat';
    }

    /**
     * Expose Menu/Switch-style flat keymaps for `editor.js` sibling-slot persistence.
     * When `ICON_KEYMAP_OFF` exists on the widget class, the editor always includes both `icons.on` and `icons.off`
     * in each save patch so shallow `Dashboard.updateWidget` merges never drop sparse `icons.off`.
     */
    static get ICON_KEYMAP_ON() {
        const base = (typeof MenuWidget !== 'undefined' && MenuWidget.ICON_STYLE_KEYMAP_ON)
            ? MenuWidget.ICON_STYLE_KEYMAP_ON
            : {
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
        return { ...base, size: 'iconSize' };
    }

    static get ICON_KEYMAP_OFF() {
        const base = (typeof MenuWidget !== 'undefined' && MenuWidget.ICON_STYLE_KEYMAP_OFF)
            ? MenuWidget.ICON_STYLE_KEYMAP_OFF
            : {
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
        return { ...base, size: 'iconSlotSizeOff', hoverColor: 'iconSlotHoverOff' };
    }

    /**
     * Nested keys on `icons.off` persisted only when the Off slot differs from **Icon (On)** (base).
     * Includes **Image URL** (`customUrl`), **Tint with icon color** (`tintImage`), and **Hover color**
     * so the off icon matches Icon (On) until those keys are set. Slot **color** stays independent.
     */
    static get SWITCH_OFF_ICON_INHERIT_KEYS() {
        return ['source', 'builtin', 'weight', 'customUrl', 'tintImage', 'size', 'offsetX', 'offsetY', 'rotation', 'hoverColor'];
    }

    /**
     * Generic protocol getter checked by `editor.js` `_syncFollowerIconSlotFromLeaderImmediate`.
     * Any widget implementing leader→follower icon inheritance should expose this getter.
     */
    static get ICON_OFF_INHERIT_KEYS() {
        return SwitchWidget.SWITCH_OFF_ICON_INHERIT_KEYS;
    }

    /**
     * Leader/follower wiring for {@link Editor._syncFollowerIconSlotFromLeaderImmediate} after nested icon saves.
     */
    static get INHERIT_EDITOR_ICON_SLOTS() {
        return {
            leaderSlot: 'on',
            followerSlot: 'off',
            inheritKeys: SwitchWidget.SWITCH_OFF_ICON_INHERIT_KEYS,
            followerKeymap: SwitchWidget.ICON_KEYMAP_OFF
        };
    }

    static _normalizeSwitchWeightForCompare(w) {
        const s = w != null ? String(w).toLowerCase().trim() : '';
        return s || 'fill';
    }

    static switchOffIconInheritPropEquals(a, b, prop) {
        if (prop === 'tintImage') return (!!a) === (!!b);
        if (prop === 'size' || prop === 'offsetX' || prop === 'offsetY' || prop === 'rotation') {
            const pickNum = function (v) {
                if (v === undefined || v === null || v === '') return 0;
                const n = typeof v === 'number' ? v : parseFloat(String(v).trim());
                return Number.isFinite(n) ? n : 0;
            };
            return pickNum(a) === pickNum(b);
        }
        if (prop === 'weight') {
            return SwitchWidget._normalizeSwitchWeightForCompare(a) === SwitchWidget._normalizeSwitchWeightForCompare(b);
        }
        if (prop === 'source') {
            const sa = (a === 'custom' || a === 'phosphor') ? a : 'phosphor';
            const sb = (b === 'custom' || b === 'phosphor') ? b : 'phosphor';
            return sa === sb;
        }
        const sa = String(a != null ? a : '').trim();
        const sb = String(b != null ? b : '').trim();
        return sa === sb;
    }

    /**
     * Formerly removed follower keys when equal to the leader for sparse storage.
     * That erased explicit user overrides when the base later matched — inherit via omitted keys only.
     * @returns {boolean} always false (no mutation).
     */
    static pruneSwitchOffIconInheritKeys(_follower, _leader) {
        return false;
    }

    /**
     * After editor assembles icon slots for save, prune `icons.off` so inherit-identical keys are omitted.
     * @param {string} widgetType
     * @param {*} icnIgnored
     * @param {object} iconsPatch - `{ on, off }` with minimal (sparse) stored values.
     * @param {object} [effectiveLeaderOn] - On slot after `ensureSwitchIcons` (with master defaults filled).
     *   When provided, prune compares off values against the real effective On defaults rather than the
     *   sparse stored `on`. Prevents spurious retention of off keys whose value equals the master default
     *   even when that default is not stored on `on` (e.g. weight='regular' from master).
     */
    static buildIconsNestedEditorPatch(widgetType, icnIgnored, iconsPatch, effectiveLeaderOn) {
        if (widgetType !== 'switch' || !iconsPatch || typeof iconsPatch !== 'object') {
            return { icons: iconsPatch };
        }
        const on = iconsPatch.on && typeof iconsPatch.on === 'object' ? iconsPatch.on : {};
        const leaderForPrune = (effectiveLeaderOn && typeof effectiveLeaderOn === 'object') ? effectiveLeaderOn : on;
        const prevOff = iconsPatch.off && typeof iconsPatch.off === 'object' ? iconsPatch.off : {};
        const off = {};
        Object.keys(prevOff).forEach(function (k) {
            off[k] = prevOff[k];
        });
        BaseWidget.stripIconFollowerInheritPlaceholders(off, SwitchWidget.SWITCH_OFF_ICON_INHERIT_KEYS);
        SwitchWidget.pruneSwitchOffIconInheritKeys(off, leaderForPrune);
        const extra = {};
        Object.keys(iconsPatch).forEach(function (k) {
            if (k === 'on' || k === 'off') return;
            extra[k] = iconsPatch[k];
        });
        return { icons: Object.assign({ on: on, off: off }, extra) };
    }

    static extractPreloadImageUrls(o) {
        if (!o || typeof o !== 'object') return [];
        SwitchWidget.ensureSwitchIcons(o);
        const def = SwitchWidget.defaultIconSlot();
        const mergeSlot = (slot) => ({ ...def, ...(slot && typeof slot === 'object' ? slot : {}) });
        const on = mergeSlot(o.icons.on);
        const offEff = BaseWidget.resolveIconFollowerSlotFromLeader(
            o.icons.on,
            o.icons.off,
            SwitchWidget.SWITCH_OFF_ICON_INHERIT_KEYS
        );
        const off = mergeSlot(offEff);
        const out = [];
        if (on.source === 'custom') {
            const u = String(on.customUrl || '').trim();
            if (u) out.push(u);
        }
        if (on.source === 'favicon' && typeof UrlFavicon !== 'undefined' && UrlFavicon && typeof UrlFavicon.resolveFaviconUrl === 'function') {
            const fav = UrlFavicon.resolveFaviconUrl(o.urlTo);
            if (fav) out.push(String(fav).trim());
        }
        if (off.source === 'custom') {
            const u = String(off.customUrl || '').trim();
            if (u) out.push(u);
        }
        if (off.source === 'favicon' && typeof UrlFavicon !== 'undefined' && UrlFavicon && typeof UrlFavicon.resolveFaviconUrl === 'function') {
            const fav = UrlFavicon.resolveFaviconUrl(o.urlTo);
            if (fav) out.push(String(fav).trim());
        }
        const leg1 = typeof o.iconUrl === 'string' ? o.iconUrl.trim() : '';
        const leg2 = typeof o.iconOnUrl === 'string' ? o.iconOnUrl.trim() : '';
        if (leg1) out.push(leg1);
        if (leg2) out.push(leg2);
        return out;
    }

    static ensureSwitchIcons(o) {
        if (!o || typeof o !== 'object') return;
        const base = SwitchWidget.defaultIconSlot();
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const weightFromMasterFilled = function (filled) { return filled === false ? 'regular' : 'fill'; };
        const builtinFromMaster = function () {
            const raw = M.defaultSwitchIconOn;
            if (raw !== undefined && raw !== null && String(raw).trim() !== '') return String(raw).trim();
            return SwitchWidget.DEFAULT_SWITCH_ICON_ON_BUILTIN;
        };
        const iconSlotDefOn = {
            ...base,
            weight: weightFromMasterFilled(M.defaultSwitchIconOnFilled),
            builtin: builtinFromMaster()
        };
        if (!o.icons || typeof o.icons !== 'object') o.icons = {};
        if (!o.icons.on || typeof o.icons.on !== 'object') o.icons.on = { ...iconSlotDefOn };
        else o.icons.on = { ...iconSlotDefOn, ...o.icons.on };
        const prevOff = (!o.icons.off || typeof o.icons.off !== 'object') ? {} : o.icons.off;
        o.icons.off = {};
        Object.keys(prevOff).forEach(function (k) {
            o.icons.off[k] = prevOff[k];
        });
        BaseWidget.stripIconFollowerInheritPlaceholders(o.icons.off, SwitchWidget.SWITCH_OFF_ICON_INHERIT_KEYS);
        SwitchWidget.pruneSwitchOffIconInheritKeys(o.icons.off, o.icons.on);
        const defOn = { enabled: false, color: '@onAccent' };
        const defOff = { enabled: false, color: '@thumb' };
        const prev = o.iconColorOverrides && typeof o.iconColorOverrides === 'object' ? o.iconColorOverrides : {};
        const prevOn = prev.on && typeof prev.on === 'object' ? prev.on : {};
        const prevOffOv = prev.off && typeof prev.off === 'object' ? prev.off : {};
        o.iconColorOverrides = {
            on: { ...defOn, ...prevOn, enabled: prevOn.enabled === true },
            off: { ...defOff, ...prevOffOv, enabled: prevOffOv.enabled === true }
        };
    }

    /** Flat icon props for runtime / applyIconStyleToElement (same keys as menu items). */
    static expandSwitchIconsToFlat(o) {
        SwitchWidget.ensureSwitchIcons(o);
        const on = o.icons.on;
        const offStored = o.icons.off;
        const offEff = BaseWidget.resolveIconFollowerSlotFromLeader(
            on,
            offStored,
            SwitchWidget.SWITCH_OFF_ICON_INHERIT_KEYS
        );
        const ovr = o.iconColorOverrides || {};
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const nz = function (v) { return v !== undefined && v !== null && String(v).trim() !== ''; };
        const colOnFb = o.iconColOn || o.switchIconColOn || M.switchIconColOn || '@onAccent';
        const colOffFb = o.iconColOff || o.switchIconColOff || M.switchIconColOff || '@icon';
        const colHovFb = o.iconColHover || o.switchIconColHover || M.switchIconColHover || '@text';
        const slotColOn = (on && Object.prototype.hasOwnProperty.call(on, 'color') && nz(on.color)) ? on.color : colOnFb;
        const slotHovOn = (on && Object.prototype.hasOwnProperty.call(on, 'hoverColor') && nz(on.hoverColor)) ? on.hoverColor : colHovFb;
        const inheritedHov = (offEff && nz(offEff.hoverColor)) ? offEff.hoverColor : '';
        const slotHovOff = nz(inheritedHov) ? inheritedHov : slotHovOn;
        const slotColOff = (offStored && Object.prototype.hasOwnProperty.call(offStored, 'color') && nz(offStored.color))
            ? offStored.color : colOffFb;
        const slotWeightOn = (on && on.weight != null && String(on.weight).trim() !== '')
            ? String(on.weight).toLowerCase().trim()
            : 'fill';
        const slotWeightOff = (offEff && offEff.weight != null && String(offEff.weight).trim() !== '')
            ? String(offEff.weight).toLowerCase().trim()
            : 'fill';
        const rawSrcOff = offEff ? offEff.source : 'phosphor';
        const coercedSrcOff = (rawSrcOff === 'custom' || rawSrcOff === 'phosphor' || rawSrcOff === 'favicon') ? rawSrcOff : 'phosphor';
        const flat = {
            iconSourceOn: on.source,
            iconOn: on.builtin,
            iconWeightOn: slotWeightOn,
            imgOn: on.customUrl,
            colorizeOn: on.tintImage === true,
            iconSourceOff: coercedSrcOff,
            iconOff: offEff ? offEff.builtin : '',
            iconWeightOff: slotWeightOff,
            imgOff: offEff ? offEff.customUrl : '',
            colorizeOff: offEff && offEff.tintImage === true,
            iconSlotColOn: slotColOn,
            iconSlotHoverOn: slotHovOn,
            iconSlotHoverOff: slotHovOff,
            iconSlotColOff: slotColOff,
            iconColOnOverrideEn: ovr.on && ovr.on.enabled === true,
            iconColOnOverride: (ovr.on && ovr.on.color) || '@onAccent',
            iconColOffOverrideEn: ovr.off && ovr.off.enabled === true,
            iconColOffOverride: (ovr.off && ovr.off.color) || '@icon'
        };
        flat.iconSlotAccentOn = BaseWidget.resolveIconSlotAccentColor(on, M.menuIconAccentOn);
        flat.iconSlotAccentOff = BaseWidget.resolveIconSlotAccentColor(offStored, M.menuIconAccentOff);
        Object.assign(flat, BaseWidget.flattenIconSlotTransformFlat(on, SwitchWidget.ICON_KEYMAP_ON));
        Object.assign(flat, BaseWidget.flattenIconSlotTransformFlat(offEff, SwitchWidget.ICON_KEYMAP_OFF));

        if (!Object.prototype.hasOwnProperty.call(on, 'offsetX')) {
            flat.iconSlotOffsetXOn = SwitchWidget.resolveAxisOffset(o.iconOffX, o.defaultSwitchIconOffX);
        }
        if (!Object.prototype.hasOwnProperty.call(on, 'offsetY')) {
            flat.iconSlotOffsetYOn = SwitchWidget.resolveAxisOffset(o.iconOffY, o.defaultSwitchIconOffY);
        }

        let resolvedIconSize = 24;
        if (on && on.size !== undefined && on.size !== null && String(on.size).trim() !== '') {
            const ns = typeof on.size === 'number' ? on.size : parseFloat(String(on.size).trim());
            if (Number.isFinite(ns) && ns > 0) resolvedIconSize = ns;
        } else if (o.iconSize !== undefined && o.iconSize !== null && String(o.iconSize).trim() !== '') {
            const leg = typeof o.iconSize === 'number' ? o.iconSize : parseFloat(String(o.iconSize).trim());
            if (Number.isFinite(leg) && leg > 0) resolvedIconSize = leg;
        } else {
            const fb = o.defaultSwitchIconSize !== undefined && o.defaultSwitchIconSize !== null
                ? o.defaultSwitchIconSize
                : M.defaultSwitchIconSize;
            const nf = fb !== undefined && fb !== null ? parseFloat(String(fb).trim()) : NaN;
            if (Number.isFinite(nf) && nf > 0) resolvedIconSize = nf;
        }
        flat.iconSize = Math.min(256, Math.max(8, resolvedIconSize));

        const offSzPick = offEff && offEff.size !== undefined && offEff.size !== null && String(offEff.size).trim() !== ''
            ? (typeof offEff.size === 'number' ? offEff.size : parseFloat(String(offEff.size).trim()))
            : NaN;
        flat.iconSlotSizeOff = (Number.isFinite(offSzPick) && offSzPick > 0)
            ? Math.min(256, Math.max(8, offSzPick))
            : flat.iconSize;

        return flat;
    }

    /** Merges nested `icons` onto flat keys used by applyIconStyleToElement. */
    static applyIconsNestedToConfig(c) {
        const flat = SwitchWidget.expandSwitchIconsToFlat(c);
        Object.keys(flat).forEach((k) => { c[k] = flat[k]; });
    }

    /** Numeric axis offset; widget value wins, then global default, then 0. */
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

    /** Non-negative inset (px) for icon/label inside the button face; default 10. */
    static resolveContentInset(override, globalFallback) {
        const pick = (v) => {
            if (v === undefined || v === null || v === '') return null;
            const n = Number(v);
            if (!Number.isFinite(n)) return null;
            return Math.max(0, n);
        };
        const o = pick(override);
        const g = pick(globalFallback);
        return (o !== null && o !== undefined) ? o : ((g !== null && g !== undefined) ? g : 10);
    }

    /** Maps typography Alignment (left/center/right) to flexbox for inside-button layout. */
    static labelAlignToFlexAlign(align) {
        const a = String(align || 'center').toLowerCase();
        if (a === 'left') return 'flex-start';
        if (a === 'right') return 'flex-end';
        return 'center';
    }

    /**
     * Paths under `bindings.icons` / `bindings.typography` / `bindings.iconColorOverrides` → flat `config` keys
     * applied after nested flatten (MQTT overrides static overrides).
     */
    static getNestedBindingOverlaySpec() {
        const spec = [];
        const iconOn = [
            ['iconSourceOn', 'on', 'source'],
            ['iconOn', 'on', 'builtin'],
            ['iconWeightOn', 'on', 'weight'],
            ['imgOn', 'on', 'customUrl'],
            ['colorizeOn', 'on', 'tintImage'],
            ['iconSlotColOn', 'on', 'color'],
            ['iconSlotHoverOn', 'on', 'hoverColor'],
            ['iconSlotAccentOn', 'on', 'accentColor'],
            ['iconSize', 'on', 'size'],
            ['iconSlotOffsetXOn', 'on', 'offsetX'],
            ['iconSlotOffsetYOn', 'on', 'offsetY'],
            ['iconSlotRotationOn', 'on', 'rotation']
        ];
        const iconOff = [
            ['iconSourceOff', 'off', 'source'],
            ['iconOff', 'off', 'builtin'],
            ['iconWeightOff', 'off', 'weight'],
            ['imgOff', 'off', 'customUrl'],
            ['colorizeOff', 'off', 'tintImage'],
            ['iconSlotColOff', 'off', 'color'],
            ['iconSlotHoverOff', 'off', 'hoverColor'],
            ['iconSlotAccentOff', 'off', 'accentColor'],
            ['iconSlotSizeOff', 'off', 'size'],
            ['iconSlotOffsetXOff', 'off', 'offsetX'],
            ['iconSlotOffsetYOff', 'off', 'offsetY'],
            ['iconSlotRotationOff', 'off', 'rotation']
        ];
        iconOn.forEach(([configKey, slot, prop]) => {
            spec.push({ path: ['icons', slot, prop], configKey });
        });
        iconOff.forEach(([configKey, slot, prop]) => {
            spec.push({ path: ['icons', slot, prop], configKey });
        });
        spec.push({ path: ['iconColorOverrides', 'on', 'enabled'], configKey: 'iconColOnOverrideEn' });
        spec.push({ path: ['iconColorOverrides', 'on', 'color'], configKey: 'iconColOnOverride' });
        spec.push({ path: ['iconColorOverrides', 'off', 'enabled'], configKey: 'iconColOffOverrideEn' });
        spec.push({ path: ['iconColorOverrides', 'off', 'color'], configKey: 'iconColOffOverride' });
        return spec.concat(BaseWidget.buildTypographyBindingOverlaySpec([
            ['groupLabel', 'switchGroupLabel'],
            ['buttonLabelOutside', 'switchButtonOutsideLabel'],
            ['buttonLabelInside', 'switchButtonInsideLabel'],
            ['confirmationDialogText', 'dialogBoxText'],
            ['confirmationButtonLabel', 'dialogBoxButtonLabel']
        ], {
            skipWhen: function (role, prop) {
                return role === 'groupLabel' && prop === 'colorOff';
            }
        }));
    }

    static _coerceSwitchOverlayBooleans(c) {
        const nz = (v) => {
            if (typeof v === 'boolean') return v;
            if (typeof v === 'number') return v !== 0;
            const s = String(v).toLowerCase().trim();
            return s === 'true' || s === '1' || s === 'on';
        };
        const keys = ['colorizeOn', 'colorizeOff', 'iconColOnOverrideEn', 'iconColOffOverrideEn'];
        keys.forEach((k) => {
            if (c[k] === undefined) return;
            c[k] = nz(c[k]);
        });
    }

    /**
     * True when Icon (Off) hover is its own value: stored on `icons.off` or bound there.
     * Otherwise the off hover follows Icon (On), including a live On hover topic.
     */
    static switchOffHoverColorIsExplicit(widget) {
        const ov = widget && widget.overrides;
        const off = ov && ov.icons && ov.icons.off;
        if (off && Object.prototype.hasOwnProperty.call(off, 'hoverColor')) {
            const v = off.hoverColor;
            if (v !== undefined && v !== null && String(v).trim() !== '') return true;
        }
        const b = widget && widget.bindings;
        if (!b || typeof BindingsTree === 'undefined' || typeof BindingsTree.getAtPath !== 'function') return false;
        const topic = BindingsTree.getAtPath(b, ['icons', 'off', 'hoverColor']);
        return typeof topic === 'string' && topic.trim() !== '';
    }

    static applyTypographyNestedToConfig(c) {
        BaseWidget.applyTypographyNestedToConfig(c, [
            ['groupLabel', 'switchGroupLabel'],
            ['buttonLabelOutside', 'switchButtonOutsideLabel'],
            ['buttonLabelInside', 'switchButtonInsideLabel'],
            ['confirmationDialogText', 'dialogBoxText'],
            ['confirmationButtonLabel', 'dialogBoxButtonLabel']
        ], {
            skipWhen: function (role, prop) {
                return role === 'groupLabel' && prop === 'colorOff';
            }
        });
    }

    static get AUDIO_TRIGGERS() {
        return [
            { key: 'press', label: 'On Press' },
            { key: 'release', label: 'On Release' },
            { key: 'on', label: 'On Toggle On' },
            { key: 'off', label: 'On Toggle Off' }
        ];
    }

    getDefaultOverrides() {
        const slot = {
            ...SwitchWidget.defaultIconSlot(),
            builtin: SwitchWidget.DEFAULT_SWITCH_ICON_ON_BUILTIN
        };
        return {
            state: false,
            label: '',
            buttonLabel: 'Switch',
            actionType: "topic",
            holdToActivate: false,
            requireConfirmation: false,
            selectionGroup: "",
            sendOffOnGroupDeselect: false,
            separateOnOffTopics: false,
            outputTopic: "",
            outputTopicOff: "",
            pageTo: 1,
            urlTo: "https://",
            urlNewTab: false,
            textOnlyLabelVerticalAlign: 'center',
            onPayload: "true",
            offPayload: "false",
            extraOutputTopics: [],
            audio: (typeof DashboardAudio !== 'undefined' && DashboardAudio.defaultAudio)
                ? DashboardAudio.defaultAudio(SwitchWidget.AUDIO_TRIGGERS)
                : { press: '', release: '', on: '', off: '' },
            icons: { on: { ...slot }, off: {} },
            iconColorOverrides: {
                on: { enabled: false, color: '@onAccent' },
                off: { enabled: false, color: '@thumb' }
            }
        };
    }

    constructor(cid, id, ov, bn) {
        super(cid, id, ov, bn);
    }

    _coerceBooleanState(raw) {
        return BaseWidget.coerceBindingBoolean(raw);
    }

    get config() {
        const c = super.config;
        SwitchWidget.applyTypographyNestedToConfig(c);
        SwitchWidget.applyIconsNestedToConfig(c);
        if (typeof DashboardDialog !== 'undefined' && DashboardDialog.applyNestedToConfig) {
            DashboardDialog.applyNestedToConfig(c, this.overrides);
        }
        BaseWidget.applyNestedBindingOverlay(this, c, SwitchWidget.getNestedBindingOverlaySpec());
        if (this.bindings && this.bindings.confirmationDialog
                && typeof this.bindings.confirmationDialog === 'object'
                && typeof DashboardDialog !== 'undefined'
                && typeof DashboardDialog.applyLiveBindingsToConfig === 'function') {
            DashboardDialog.applyLiveBindingsToConfig(this, c);
        }
        SwitchWidget._coerceSwitchOverlayBooleans(c);
        if (!SwitchWidget.switchOffHoverColorIsExplicit(this)) {
            c.iconSlotHoverOff = c.iconSlotHoverOn;
        }

        let finalState = c.state;

        const currentMode = c.mode || c.defaultSwitchMode || 'toggle';
        const hasStateBinding = Boolean(this.bindings.state && String(this.bindings.state).trim());
        if (hasStateBinding && this._optimisticState !== undefined) finalState = this._optimisticState;
        if (c.actionType === 'page' && currentMode === 'toggle' && !hasStateBinding) {
            const targetPage = parseInt(c.pageTo || 1);
            const currentPage = typeof MASTER_SETTINGS !== 'undefined' ? parseInt(MASTER_SETTINGS.currentPage || 1) : 1;
            finalState = (currentPage === targetPage);
        }

        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const label = c.label != null ? String(c.label) : '';
        const buttonLabel = c.buttonLabel != null ? String(c.buttonLabel) : '';

        if (!c.switchGroupLabelFont) c.switchGroupLabelFont = c.fontFamily || M.fontFamily || "'Inter', sans-serif";
        if (c.switchGroupLabelFs == null || c.switchGroupLabelFs === '') c.switchGroupLabelFs = M.defaultFsLabel != null ? M.defaultFsLabel : 12;
        if (!c.switchGroupLabelCol) c.switchGroupLabelCol = M.defaultColLabel || '@textMuted';
        if (!c.switchGroupLabelAlign) c.switchGroupLabelAlign = BaseWidget.resolveMasterTextAlign(M);
        if (!c.switchGroupLabelCase) c.switchGroupLabelCase = M.defaultLabelCase || 'uppercase';
        if (c.switchGroupLabelBold === undefined || c.switchGroupLabelBold === null) {
            c.switchGroupLabelBold = c.defaultLabelBold === true || M.defaultLabelBold === true;
        }
        if (c.switchGroupLabelItalic === undefined || c.switchGroupLabelItalic === null) c.switchGroupLabelItalic = M.defaultLabelItalic === true;
        if (c.switchGroupLabelOpacity === undefined || c.switchGroupLabelOpacity === null || c.switchGroupLabelOpacity === '') c.switchGroupLabelOpacity = 100;
        if (c.switchGroupLabelOffX === undefined || c.switchGroupLabelOffX === null) c.switchGroupLabelOffX = 0;
        if (c.switchGroupLabelOffY === undefined || c.switchGroupLabelOffY === null) c.switchGroupLabelOffY = 0;

        SwitchWidget.ensureSwitchButtonLabelTypography(c, 'switchButtonOutsideLabel', 'switchButtonOutsideDefault', M);
        SwitchWidget.ensureSwitchButtonLabelTypography(c, 'switchButtonInsideLabel', 'switchButtonInsideDefault', M);

        const resolvedStyle = c.style || c.defaultSwitchStyle || 'switch';
        const hasShowIconOverride = this.overrides && Object.prototype.hasOwnProperty.call(this.overrides, 'showIcon');
        const showIconResolved = hasShowIconOverride
            ? (c.showIcon !== undefined && c.showIcon !== null
                ? this._coerceBooleanState(c.showIcon)
                : SwitchWidget.resolveImplicitShowIcon(resolvedStyle, c.defaultSwitchShowIcon))
            : SwitchWidget.resolveImplicitShowIcon(resolvedStyle, c.defaultSwitchShowIcon);

        const out = {
            ...c,
            state: this._coerceBooleanState(finalState),

            colOn: c.colOn || c.backgroundColorOn || c.switchColOn,
            colOff: c.colOff || c.backgroundColorOff || c.switchColOff,
            colHover: c.colHover || c.backgroundColorHover || c.switchColHover,
            colThumb: c.colThumb || c.thumbColor || c.switchColThumb,

            iconColOn: c.iconColOn || c.switchIconColOn,
            iconColOff: c.iconColOff || c.switchIconColOff,
            iconColHover: c.iconColHover || c.switchIconColHover,

            mode: c.mode || c.defaultSwitchMode || 'toggle',
            style: resolvedStyle,

            bevel: c.bevel !== undefined && c.bevel !== null ? c.bevel : (c.defaultSwitchBevel || false),
            scale: c.scale !== undefined && c.scale !== null ? c.scale : (c.defaultSwitchScale || 1.0),

            showIcon: showIconResolved,
            iconSize: c.iconSize != null && String(c.iconSize).trim() !== '' && Number.isFinite(Number(c.iconSize))
                ? Number(c.iconSize)
                : (c.defaultSwitchIconSize != null ? Number(c.defaultSwitchIconSize) : 24),

            btnGlow: c.btnGlow !== undefined && c.btnGlow !== null ? c.btnGlow : c.switchGlow,
            btnGlowColor: c.btnGlowColor || c.switchGlowColor,
            btnGlowRadius: c.btnGlowRadius !== undefined && c.btnGlowRadius !== null ? c.btnGlowRadius : (c.switchGlowRadius || 40),

            outlineWidth: c.outlineWidth !== undefined && c.outlineWidth !== null ? c.outlineWidth : (c.switchOutlineWidth || 0),
            outlineColor: c.outlineColor || c.switchOutlineColor || '@borderAccent',
            outlineOpacity: c.outlineOpacity !== undefined && c.outlineOpacity !== null ? c.outlineOpacity : (c.switchOutlineOpacity !== undefined && c.switchOutlineOpacity !== null ? c.switchOutlineOpacity : 100),
            backgroundOpacity: c.backgroundOpacity !== undefined && c.backgroundOpacity !== null ? c.backgroundOpacity : (c.switchBackgroundOpacity !== undefined && c.switchBackgroundOpacity !== null ? c.switchBackgroundOpacity : 100),
            buttonBlur: c.buttonBlur !== undefined && c.buttonBlur !== null ? c.buttonBlur : (c.switchButtonBlur || 0),
            buttonInnerGlow: c.buttonInnerGlow !== undefined && c.buttonInnerGlow !== null ? c.buttonInnerGlow : (c.switchButtonInnerGlow || 0),
            buttonInnerGlowColor: c.buttonInnerGlowColor || c.switchButtonInnerGlowColor || '@borderAccent',
            buttonInnerGlowOpacity: c.buttonInnerGlowOpacity !== undefined && c.buttonInnerGlowOpacity !== null ? c.buttonInnerGlowOpacity : (c.switchButtonInnerGlowOpacity !== undefined && c.switchButtonInnerGlowOpacity !== null ? c.switchButtonInnerGlowOpacity : 100),
            thumbOutlineWidth: c.thumbOutlineWidth !== undefined && c.thumbOutlineWidth !== null ? c.thumbOutlineWidth : (c.switchThumbOutlineWidth || 0),
            thumbOutlineColor: c.thumbOutlineColor || c.switchThumbOutlineColor || '@accent',
            thumbOutlineOpacity: c.thumbOutlineOpacity !== undefined && c.thumbOutlineOpacity !== null ? c.thumbOutlineOpacity : (c.switchThumbOutlineOpacity !== undefined && c.switchThumbOutlineOpacity !== null ? c.switchThumbOutlineOpacity : 100),
            thumbInnerGlow: c.thumbInnerGlow !== undefined && c.thumbInnerGlow !== null ? c.thumbInnerGlow : (c.switchThumbInnerGlow || 0),
            thumbInnerGlowColor: c.thumbInnerGlowColor || c.switchThumbInnerGlowColor || '@accent',
            thumbInnerGlowOpacity: c.thumbInnerGlowOpacity !== undefined && c.thumbInnerGlowOpacity !== null ? c.thumbInnerGlowOpacity : (c.switchThumbInnerGlowOpacity !== undefined && c.switchThumbInnerGlowOpacity !== null ? c.switchThumbInnerGlowOpacity : 100),

            btnRadius: c.btnRadius !== undefined && c.btnRadius !== null ? c.btnRadius : (c.switchCornerRadius || 12),

            buttonContentInset: SwitchWidget.resolveContentInset(c.buttonContentInset, c.switchButtonContentInset),

            actionType: c.actionType || "topic",
            holdToActivate: c.holdToActivate === true,
            requireConfirmation: c.requireConfirmation === true,
            previewInEditMode: c.previewInEditMode === true,
            confirmWhenTurningOff: c.confirmWhenTurningOff === true,
            selectionGroup: String(c.selectionGroup || "").trim(),
            sendOffOnGroupDeselect: c.sendOffOnGroupDeselect === true,
            separateOnOffTopics: c.separateOnOffTopics === true,
            outputTopicOff: c.outputTopicOff != null ? String(c.outputTopicOff) : '',
            pageTo: c.pageTo || 1,
            urlTo: c.urlTo || "https://",
            urlNewTab: c.urlNewTab === true,
            onPayload: c.onPayload !== undefined ? c.onPayload : "true",
            offPayload: c.offPayload !== undefined ? c.offPayload : "false",
            extraOutputTopics: SwitchWidget.normalizeExtraOutputTopics(c.extraOutputTopics),

            label,
            buttonLabel,
            buttonLabelHint: SwitchWidget.normalizeLabelHint(
                (c.buttonLabelHint != null && c.buttonLabelHint !== '') ? c.buttonLabelHint : c.defaultSwitchLabelHint
            ),
            textOnlyLabelVerticalAlign: c.textOnlyLabelVerticalAlign || 'center',
            labelPos: c.labelPos || c.buttonLabelPosition || c.defaultSwitchLabelPos || 'top',
            contentAlign: c.contentAlign || c.defaultSwitchAlign || 'center'
        };

        // URL favicon icon source is valid only when this switch opens a URL.
        const urlRaw = out.urlTo != null ? String(out.urlTo).trim() : '';
        const hasUrl = out.actionType === 'url' && urlRaw !== '' && urlRaw !== 'https://';
        if (!hasUrl) {
            if (out.iconSourceOn === 'favicon') out.iconSourceOn = 'phosphor';
            if (out.iconSourceOff === 'favicon') out.iconSourceOff = 'phosphor';
        }

        ['labelFont', 'labelFs', 'labelCol', 'labelAlign', 'labelCase', 'labelBold', 'labelOffX', 'labelOffY'].forEach((k) => { delete out[k]; });
        [
            'switchButtonLabelFont', 'switchButtonLabelFs', 'switchButtonLabelCol', 'switchButtonLabelColOff',
            'switchButtonLabelAlign', 'switchButtonLabelCase', 'switchButtonLabelBold', 'switchButtonLabelItalic',
            'switchButtonLabelOpacity', 'switchButtonLabelOffX', 'switchButtonLabelOffY'
        ].forEach((k) => { delete out[k]; });
        [
            'icon', 'iconUrl', 'iconOnUrl', 'iconColorize'
        ].forEach((k) => { delete out[k]; });
        delete out.icons;
        delete out.iconColorOverrides;
        delete out.typography;
        delete out.confirmationDialog;
        delete out._switchTypographyV2;
        delete out._switchIconsV2;
        delete out._switchIconsV3;
        return out;
    }

    hasPageDependentState() {
        const ov = this.overrides || {};
        const factory = typeof this._getFactoryDefaults === 'function' ? this._getFactoryDefaults() : {};
        const act = ov.actionType != null ? ov.actionType : (factory.actionType || 'topic');
        if (act !== 'page') return false;
        const mode = ov.mode != null ? ov.mode : (factory.mode || 'toggle');
        if (mode === 'push') return false;
        if (this.bindings && this.bindings.state && String(this.bindings.state).trim()) return false;
        return true;
    }

    getSchema() {
        return [
            {
                id: 'sw_behavior', title: 'Data & Behavior', icon: 'ph-lightning',
                fields: [
                    {
                        key: 'mode', type: 'select', label: 'Mode', options: SwitchWidget.SWITCH_MODE_OPTIONS, cols: 6, defaultKey: 'defaultSwitchMode'
                    },
                    {
                        key: 'actionType',
                        type: 'select',
                        label: 'On Click',
                        options: SwitchWidget.getActionTypeOptions(this.config),
                        dynamicOptions: (values) => SwitchWidget.getActionTypeOptions(values),
                        dependsOn: ['outputTopic', 'outputTopicOff', 'separateOnOffTopics', 'mode'],
                        cols: 6
                    },
                    {
                        key: 'holdToActivate',
                        type: 'checkbox',
                        label: 'Hold to Activate',
                        cols: 6,
                        hint: SwitchWidget.HOLD_TO_ACTIVATE_HINT
                    },
                    {
                        key: 'requireConfirmation',
                        type: 'checkbox',
                        label: 'Require Confirmation',
                        cols: 6,
                        dependsOn: ['requireConfirmation'],
                        hint: 'Ask before this button runs its action. Style the prompt in Confirmation Dialog Appearance.'
                    },
                    {
                        key: 'selectionGroup',
                        type: 'selection_group',
                        label: 'Selection Group ID',
                        cols: 12,
                        disableWhen: (values) => !SwitchWidget.usesManualSelectionGroup(values),
                        visibleWhen: (values, isGlobal) => SwitchWidget.showSelectionGroupBehaviorFields(values, isGlobal),
                        dependsOn: ['mode', 'actionType', 'selectionGroup']
                    },
                    {
                        key: 'sendOffOnGroupDeselect',
                        type: 'checkbox',
                        label: 'Send Off When Turned Off by Group',
                        cols: 6,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showSelectionGroupSubOptions(values, isGlobal)
                            && SwitchWidget.isGroupExclusionAvailable(values),
                        dependsOn: ['mode', 'actionType', 'selectionGroup']
                    },
                    {
                        key: 'separateOnOffTopics',
                        type: 'checkbox',
                        label: 'Separate On and Off Topics',
                        cols: 6,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showSelectionGroupBehaviorFields(values, isGlobal),
                        dependsOn: ['mode']
                    },
                    {
                        key: 'outputTopic',
                        type: 'topic',
                        label: 'Output Topic (leave blank to use page/URL only)',
                        cols: 12,
                        visibleWhen: (values, isGlobal) => !SwitchWidget.useSeparateOnOffTopics(values, isGlobal),
                        dependsOn: ['mode', 'actionType', 'separateOnOffTopics']
                    },
                    {
                        key: 'outputTopic',
                        type: 'topic',
                        label: 'On Output Topic',
                        cols: 6,
                        visibleWhen: (values, isGlobal) => SwitchWidget.useSeparateOnOffTopics(values, isGlobal),
                        dependsOn: ['mode', 'actionType', 'separateOnOffTopics']
                    },
                    {
                        key: 'outputTopicOff',
                        type: 'topic',
                        label: 'Off Output Topic',
                        cols: 6,
                        visibleWhen: (values, isGlobal) => SwitchWidget.useSeparateOnOffTopics(values, isGlobal),
                        dependsOn: ['mode', 'actionType', 'separateOnOffTopics']
                    },
                    {
                        key: 'onPayload', type: 'text', label: 'On Value', cols: 6,
                        dependsOn: ['mode', 'separateOnOffTopics']
                    },
                    {
                        key: 'offPayload', type: 'text', label: 'Off Value', cols: 6,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showSelectionGroupBehaviorFields(values, isGlobal),
                        dependsOn: ['mode', 'separateOnOffTopics']
                    },
                    {
                        key: 'pageTo', type: 'number', label: 'Target Page #', cols: 6,
                        visibleWhen: (values) => SwitchWidget.resolvedActionType(values) === 'page',
                        dependsOn: ['actionType', 'mode']
                    },
                    {
                        key: 'urlTo', type: 'text', label: 'Target URL', cols: 6,
                        visibleWhen: (values) => SwitchWidget.resolvedActionType(values) === 'url',
                        dependsOn: ['actionType', 'mode']
                    },
                    {
                        key: 'urlNewTab', type: 'checkbox', label: 'New tab', cols: 6,
                        visibleWhen: (values) => SwitchWidget.resolvedActionType(values) === 'url',
                        dependsOn: ['actionType', 'mode']
                    },
                    {
                        key: 'extraOutputTopics',
                        type: 'extra_output_topic_list',
                        label: 'Additional Output Topics',
                        cols: 12,
                        reactiveContent: true,
                        dependsOn: ['mode', 'actionType', 'urlTo', 'urlNewTab', 'separateOnOffTopics']
                    },
                    {
                        key: 'state', type: 'checkbox', label: 'State (On/Off)', cols: 12,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showSelectionGroupBehaviorFields(values, isGlobal),
                        dependsOn: ['mode']
                    }
                ]
            },
            (typeof DashboardAudio !== 'undefined' && DashboardAudio.schemaGroup)
                ? DashboardAudio.schemaGroup('sw_audio', SwitchWidget.AUDIO_TRIGGERS)
                : {
                    id: 'sw_audio', title: 'Audio', icon: 'ph-music-notes',
                    fields: [{ key: 'audio', type: 'audio_trigger_map', cols: 12, triggers: SwitchWidget.AUDIO_TRIGGERS }]
                },
            {
                id: 'sw_appear', title: 'Appearance', icon: 'ph-palette',
                fields: [
                    {
                        key: 'style', type: 'select', label: 'Visual Style', options: SwitchWidget.SWITCH_STYLE_OPTIONS, cols: 12, defaultKey: 'defaultSwitchStyle'
                    },
                    {
                        key: 'scale', type: 'number', label: 'Overall Scale Multiplier', cols: 4, step: 0.1, defaultKey: 'defaultSwitchScale',
                        gridColStart: 1,
                        dependsOn: ['style'],
                        visibleWhen: (values, isGlobal) => SwitchWidget.showsSwitchAppearanceDetail(values, isGlobal)
                    },
                    {
                        key: 'contentAlign', type: 'select', label: 'Button Alignment', options: SwitchWidget.SWITCH_ALIGN_OPTIONS, cols: 4, defaultKey: 'defaultSwitchAlign',
                        gridColStart: 5, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.isRectFaceStyle(values, isGlobal)
                            && !SwitchWidget.isTextOnlyStyle(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'buttonRadius', type: 'number', label: 'Button Radius', cols: 4, defaultKey: 'switchCornerRadius',
                        gridColStart: 9, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.isButtonStyle(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'bevel', type: 'checkbox', label: '3D Bevel', cols: 4, defaultKey: 'defaultSwitchBevel',
                        gridColStart: 1, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.isButtonStyle(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'buttonContentInset', type: 'number', label: 'Content Inset (px)', cols: 4, defaultKey: 'switchButtonContentInset',
                        gridColStart: 5, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.isRectFaceStyle(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'thumbColor', type: 'color', label: 'Thumb Color', cols: 4, defaultKey: 'switchColThumb',
                        gridColStart: 9, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.isPillStyle(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'thumbOutlineWidth', type: 'number', min: 0, label: 'Thumb Outline Width', cols: 4, defaultKey: 'switchThumbOutlineWidth',
                        visibleWhen: (values, isGlobal) => SwitchWidget.isPillStyle(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'thumbOutlineColor', type: 'color', label: 'Thumb Outline Color', cols: 4, defaultKey: 'switchThumbOutlineColor',
                        visibleWhen: (values, isGlobal) => SwitchWidget.isPillStyle(values, isGlobal)
                            && SwitchWidget.thumbOutlineDetailsVisible(values, isGlobal),
                        dependsOn: ['style', 'thumbOutlineWidth', 'switchThumbOutlineWidth']
                    },
                    {
                        key: 'thumbOutlineOpacity', type: 'number', min: 0, max: 100, label: 'Thumb Outline Opacity', cols: 4, defaultKey: 'switchThumbOutlineOpacity',
                        visibleWhen: (values, isGlobal) => SwitchWidget.isPillStyle(values, isGlobal)
                            && SwitchWidget.thumbOutlineDetailsVisible(values, isGlobal),
                        dependsOn: ['style', 'thumbOutlineWidth', 'switchThumbOutlineWidth']
                    },
                    {
                        key: 'thumbInnerGlow', type: 'number', min: 0, label: 'Thumb Inner Glow', cols: 4, defaultKey: 'switchThumbInnerGlow',
                        visibleWhen: (values, isGlobal) => SwitchWidget.isPillStyle(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'thumbInnerGlowColor', type: 'color', label: 'Thumb Inner Glow Color', cols: 4, defaultKey: 'switchThumbInnerGlowColor',
                        visibleWhen: (values, isGlobal) => SwitchWidget.isPillStyle(values, isGlobal)
                            && SwitchWidget.thumbInnerGlowDetailsVisible(values, isGlobal),
                        dependsOn: ['style', 'thumbInnerGlow', 'switchThumbInnerGlow']
                    },
                    {
                        key: 'thumbInnerGlowOpacity', type: 'number', min: 0, max: 100, label: 'Thumb Inner Glow Opacity', cols: 4, defaultKey: 'switchThumbInnerGlowOpacity',
                        visibleWhen: (values, isGlobal) => SwitchWidget.isPillStyle(values, isGlobal)
                            && SwitchWidget.thumbInnerGlowDetailsVisible(values, isGlobal),
                        dependsOn: ['style', 'thumbInnerGlow', 'switchThumbInnerGlow']
                    },
                    {
                        key: 'backgroundColorOn', type: 'color', label: 'Background Color (On)', cols: 4, defaultKey: 'switchColOn',
                        gridColStart: 1, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showsButtonFaceAppearance(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'backgroundColorOff', type: 'color', label: 'Background Color (Off)', cols: 4, defaultKey: 'switchColOff',
                        gridColStart: 5, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showsButtonFaceAppearance(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'backgroundColorHover', type: 'color', label: 'Background Color (Hover)', cols: 4, defaultKey: 'switchColHover',
                        gridColStart: 9, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showsButtonFaceAppearance(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'backgroundOpacity', type: 'number', min: 0, max: 100, label: 'Background Opacity', cols: 6, defaultKey: 'switchBackgroundOpacity',
                        gridColStart: 1, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showsButtonFaceAppearance(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'buttonBlur', type: 'number', min: 0, label: 'Background Blur', cols: 6, defaultKey: 'switchButtonBlur',
                        gridColStart: 7, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showsButtonFaceAppearance(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'enableGlow', type: 'checkbox', label: 'Enable Glow', cols: 4, defaultKey: 'switchGlow',
                        gridColStart: 1, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.isButtonStyle(values, isGlobal)
                            || SwitchWidget.isImageOnlyStyle(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'glowColor', type: 'color', label: 'Glow Color', cols: 4, defaultKey: 'switchGlowColor',
                        gridColStart: 5, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => (SwitchWidget.isButtonStyle(values, isGlobal)
                            || SwitchWidget.isImageOnlyStyle(values, isGlobal)) && (values.enableGlow === true || values.btnGlow === true || values.switchGlow === true),
                        dependsOn: ['style', 'enableGlow', 'btnGlow', 'switchGlow']
                    },
                    {
                        key: 'btnGlowRadius', type: 'number', label: 'Glow Radius', cols: 4, defaultKey: 'switchGlowRadius',
                        gridColStart: 9, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => (SwitchWidget.isButtonStyle(values, isGlobal)
                            || SwitchWidget.isImageOnlyStyle(values, isGlobal)) && (values.enableGlow === true || values.btnGlow === true || values.switchGlow === true),
                        dependsOn: ['style', 'enableGlow', 'btnGlow', 'switchGlow']
                    },
                    {
                        key: 'outlineWidth', type: 'number', label: 'Outline Width', cols: 4, defaultKey: 'switchOutlineWidth',
                        gridColStart: 1, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showsButtonFaceAppearance(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'outlineColor', type: 'color', label: 'Outline Color', cols: 4, defaultKey: 'switchOutlineColor',
                        gridColStart: 5, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showsButtonFaceAppearance(values, isGlobal)
                            && SwitchWidget.outlineDetailsVisible(values, isGlobal),
                        dependsOn: ['style', 'outlineWidth', 'switchOutlineWidth']
                    },
                    {
                        key: 'outlineOpacity', type: 'number', min: 0, max: 100, label: 'Outline Opacity', cols: 4, defaultKey: 'switchOutlineOpacity',
                        gridColStart: 9, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showsButtonFaceAppearance(values, isGlobal)
                            && SwitchWidget.outlineDetailsVisible(values, isGlobal),
                        dependsOn: ['style', 'outlineWidth', 'switchOutlineWidth']
                    },
                    {
                        key: 'buttonInnerGlow', type: 'number', min: 0, label: 'Inner Glow', cols: 4, defaultKey: 'switchButtonInnerGlow',
                        gridColStart: 1, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showsButtonFaceAppearance(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'buttonInnerGlowColor', type: 'color', label: 'Inner Glow Color', cols: 4, defaultKey: 'switchButtonInnerGlowColor',
                        gridColStart: 5, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showsButtonFaceAppearance(values, isGlobal)
                            && SwitchWidget.buttonInnerGlowDetailsVisible(values, isGlobal),
                        dependsOn: ['style', 'buttonInnerGlow', 'switchButtonInnerGlow']
                    },
                    {
                        key: 'buttonInnerGlowOpacity', type: 'number', min: 0, max: 100, label: 'Inner Glow Opacity', cols: 4, defaultKey: 'switchButtonInnerGlowOpacity',
                        gridColStart: 9, preserveGridSlot: true,
                        visibleWhen: (values, isGlobal) => SwitchWidget.showsButtonFaceAppearance(values, isGlobal)
                            && SwitchWidget.buttonInnerGlowDetailsVisible(values, isGlobal),
                        dependsOn: ['style', 'buttonInnerGlow', 'switchButtonInnerGlow']
                    },
                    {
                        key: 'buttonLabelHint', type: 'select', label: 'Label Hint', cols: 12,
                        defaultKey: 'defaultSwitchLabelHint',
                        options: SwitchWidget.labelHintOptions,
                        hint: 'Shows the full button label in a browser tooltip on hover. When Label Is Truncated applies only when the text is cut off or clipped by the layout.',
                        visibleWhen: (values, isGlobal) => SwitchWidget.showsSwitchAppearanceDetail(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff'
                    },
                    {
                        key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted'
                    }
                ]
            },
            (typeof DashboardDialog !== 'undefined' && DashboardDialog.confirmationSchemaGroup)
                ? DashboardDialog.confirmationSchemaGroup('sw_confirmation_dialog')
                : {
                    id: 'sw_confirmation_dialog',
                    title: 'Confirmation Dialog Appearance',
                    icon: 'ph-warning',
                    visibleWhen: (values) => values.requireConfirmation === true,
                    dependsOn: ['requireConfirmation'],
                    fields: []
                },
            {
                id: 'sw_icon',
                title: 'Icon',
                icon: 'ph-star',
                visibleWhen: (values, isGlobal) => {
                    const btnIcons = typeof DashboardDialog !== 'undefined' && DashboardDialog.showConfirmationButtonIcons
                        ? DashboardDialog.showConfirmationButtonIcons(values)
                        : false;
                    const dialogIcon = typeof DashboardDialog !== 'undefined' && DashboardDialog.showConfirmationDialogIcon
                        ? DashboardDialog.showConfirmationDialogIcon(values)
                        : false;
                    if (btnIcons || dialogIcon) return true;
                    return !SwitchWidget.isTextOnlyStyle(values, isGlobal)
                        && !SwitchWidget.isInvisibleStyle(values, isGlobal);
                },
                dependsOn: ['style', 'requireConfirmation', 'dialogBoxShowButtonIcons', 'dialogBoxShowDialogIcon'],
                fields: (() => {
                    const baseOn = typeof MenuWidget !== 'undefined' ? MenuWidget.ICON_STYLE_KEYMAP_ON : {
                        source: 'iconSourceOn',
                        builtin: 'iconOn',
                        weight: 'iconWeightOn',
                        customUrl: 'imgOn',
                        tintImage: 'colorizeOn'
                    };
                    const baseOff = typeof MenuWidget !== 'undefined' ? MenuWidget.ICON_STYLE_KEYMAP_OFF : {
                        source: 'iconSourceOff',
                        builtin: 'iconOff',
                        weight: 'iconWeightOff',
                        customUrl: 'imgOff',
                        tintImage: 'colorizeOff'
                    };
                    const kmOn = {
                        ...baseOn,
                        color: 'iconSlotColOn',
                        hoverColor: 'iconSlotHoverOn',
                        accentColor: 'iconSlotAccentOn',
                        size: 'iconSize'
                    };
                    const kmOff = {
                        ...baseOff,
                        color: 'iconSlotColOff',
                        hoverColor: 'iconSlotHoverOff',
                        accentColor: 'iconSlotAccentOff',
                        size: 'iconSlotSizeOff'
                    };
                    const gOn = BaseWidget.getIconStyleSchema('Icon (On)', kmOn, {
                        headerSuffix: 'Base Icon Style',
                        pairWeightAndSize: true
                    });
                    const gOff = BaseWidget.getIconStyleSchema('Icon (Off)', kmOff, {
                        pairWeightAndSize: true
                    });
                    BaseWidget.attachIconsNestedToIconStyleGroup(gOn, 'on');
                    BaseWidget.attachIconsNestedToIconStyleGroup(gOff, 'off');
                    BaseWidget.attachIconAccentFieldDefaultKeys(gOn);
                    BaseWidget.attachIconAccentFieldDefaultKeys(gOff);
                    const attachFaviconGate = function (group) {
                        if (!group || !Array.isArray(group.fields)) return;
                        group.fields.forEach(function (fd) {
                            if (!fd || fd.type !== 'select') return;
                            if (fd.key !== 'iconSourceOn' && fd.key !== 'iconSourceOff') return;
                            fd.dependsOn = ['actionType', 'urlTo'];
                            fd.dynamicOptions = function (values) {
                                const opts = [
                                    { value: 'phosphor', text: 'Phosphor icon' },
                                    { value: 'custom', text: 'Custom image' }
                                ];
                                const act = values && values.actionType ? String(values.actionType).trim() : '';
                                const url = values && values.urlTo != null ? String(values.urlTo).trim() : '';
                                const hasUrl = act === 'url' && url !== '' && url !== 'https://';
                                if (hasUrl) {
                                    opts.push({ value: 'favicon', text: 'URL favicon' });
                                }
                                return opts;
                            };
                        });
                    };
                    attachFaviconGate(gOn);
                    attachFaviconGate(gOff);
                    gOn.fields.forEach(function (fd) {
                        if (fd.key === 'iconSize') fd.defaultKey = 'defaultSwitchIconSize';
                    });
                    gOff.fields.forEach(function (fd) {
                        if (fd.key === 'iconSlotSizeOff') fd.defaultKey = 'defaultSwitchIconSize';
                    });
                    const hideFaceIcons = function (values, isGlobal) {
                        return !SwitchWidget.isTextOnlyStyle(values, isGlobal)
                            && !SwitchWidget.isInvisibleStyle(values, isGlobal);
                    };
                    gOn.visibleWhen = hideFaceIcons;
                    gOff.visibleWhen = hideFaceIcons;
                    gOn.dependsOn = ['style'];
                    gOff.dependsOn = ['style'];
                    const iconFields = [
                        {
                            key: 'showIcon',
                            type: 'checkbox',
                            label: 'Show Icon',
                            cols: 12,
                            defaultKey: 'defaultSwitchShowIcon',
                            dependsOn: ['style'],
                            visibleWhen: (values, isGlobal) => !SwitchWidget.isTextOnlyStyle(values, isGlobal)
                                && !SwitchWidget.isInvisibleStyle(values, isGlobal),
                            hint: 'Switch (Pill) / Text Only: icon off by default. Button / Image Only: icon on unless you change defaults.',
                            disableWhen: (values, isGlobal) => SwitchWidget.showIconCheckboxDisableWhen(values, isGlobal === true)
                        },
                        gOn,
                        gOff
                    ];
                    if (typeof DashboardDialog !== 'undefined' && typeof BaseWidget !== 'undefined') {
                        const kmConfirm = DashboardDialog.ICON_KEYMAP_CONFIRM;
                        const kmDismiss = DashboardDialog.ICON_KEYMAP_DISMISS;
                        const kmDialog = DashboardDialog.ICON_KEYMAP_DIALOG;
                        const gConfirm = BaseWidget.getIconStyleSchema('Confirmation Confirm Icon', kmConfirm, {
                            headerSuffix: 'Dialog Button',
                            pairWeightAndSize: true,
                            exclude: ['hoverColor']
                        });
                        const gDismiss = BaseWidget.getIconStyleSchema('Confirmation Dismiss Icon', kmDismiss, {
                            headerSuffix: 'Dialog Button',
                            pairWeightAndSize: true,
                            exclude: ['hoverColor']
                        });
                        const gDialog = BaseWidget.getIconStyleSchema('Confirmation Dialog Icon', kmDialog, {
                            pairWeightAndSize: true,
                            exclude: ['hoverColor']
                        });
                        DashboardDialog.decorateWidgetIconGroup(gConfirm, 'confirmationConfirm');
                        DashboardDialog.decorateWidgetIconGroup(gDismiss, 'confirmationDismiss');
                        DashboardDialog.decorateWidgetIconGroup(gDialog, 'confirmationDialog');
                        const showBtn = function (values) {
                            return DashboardDialog.showConfirmationButtonIcons(values);
                        };
                        const showDlg = function (values) {
                            return DashboardDialog.showConfirmationDialogIcon(values);
                        };
                        gConfirm.visibleWhen = showBtn;
                        gDismiss.visibleWhen = showBtn;
                        gDialog.visibleWhen = showDlg;
                        gConfirm.dependsOn = ['requireConfirmation', 'dialogBoxShowButtonIcons'];
                        gDismiss.dependsOn = ['requireConfirmation', 'dialogBoxShowButtonIcons'];
                        gDialog.dependsOn = ['requireConfirmation', 'dialogBoxShowDialogIcon'];
                        iconFields.push(gDialog, gConfirm, gDismiss);
                    }
                    return iconFields;
                })()
            },
            {
                id: 'sw_label',
                title: 'Text & Typography',
                icon: 'ph-text-t',
                visibleWhen: (values, isGlobal) => !SwitchWidget.isInvisibleStyle(values, isGlobal)
                    || values.requireConfirmation === true,
                dependsOn: ['style', 'requireConfirmation'],
                fields: [
                    {
                        key: 'label', type: 'text', label: 'Widget Label', cols: 12,
                        visibleWhen: (values, isGlobal) => !SwitchWidget.isInvisibleStyle(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'buttonLabel', type: 'text', label: 'Button Label', cols: 12,
                        visibleWhen: (values, isGlobal) => !SwitchWidget.isInvisibleStyle(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'buttonLabelPosition',
                        type: 'select',
                        label: 'Button Label Position',
                        options: SwitchWidget.SWITCH_LABEL_POS_OPTIONS,
                        cols: 12,
                        defaultKey: 'defaultSwitchLabelPos',
                        visibleWhen: (values, isGlobal) => !SwitchWidget.isTextOnlyStyle(values, isGlobal)
                            && !SwitchWidget.isInvisibleStyle(values, isGlobal),
                        dependsOn: ['style']
                    },
                    {
                        key: 'textOnlyLabelVerticalAlign',
                        type: 'select',
                        label: 'Button Label Vertical Position',
                        options: SwitchWidget.SWITCH_TEXT_ONLY_LABEL_VERTICAL_OPTIONS,
                        cols: 12,
                        visibleWhen: (values, isGlobal) => SwitchWidget.isTextOnlyStyle(values, isGlobal),
                        dependsOn: ['style']
                    },
                    BaseWidget.getWidgetLabelTypographySchema('switchGroupLabel', 'groupLabel', {
                        exclude: [],
                        groupVisibleWhen: (values, isGlobal) => !SwitchWidget.isInvisibleStyle(values, isGlobal),
                        groupDependsOn: ['style']
                    }),
                    BaseWidget.getTypographySchema('switchButtonOutsideLabel', 'Button Label (Outside)', {
                        dualColor: true,
                        dualColorOnDefaultKey: 'switchButtonOutsideDefaultCol',
                        dualColorOffDefaultKey: 'switchButtonOutsideDefaultColOff',
                        nestedTypography: { root: 'typography', role: 'buttonLabelOutside' },
                        dualColorOnLabel: 'Outside Label (Switch On)',
                        dualColorOffLabel: 'Outside Label (Switch Off)',
                        alignLabel: 'Button Label Alignment',
                        caseLabel: 'Button Label Case',
                        boldLabel: 'Button Label Bold',
                        italicLabel: 'Button Label Italic',
                        offsetXLabel: 'Button Label Offset X',
                        offsetYLabel: 'Button Label Offset Y',
                        fontDefaultKey: 'switchButtonOutsideDefaultFont',
                        fontDefaultKeyFallback: 'fontFamily',
                        fontSizeDefaultKey: 'switchButtonOutsideDefaultFs',
                        alignDefaultKey: 'switchButtonOutsideDefaultAlign',
                        caseDefaultKey: 'switchButtonOutsideDefaultCase',
                        boldDefaultKey: 'switchButtonOutsideDefaultBold',
                        italicDefaultKey: 'switchButtonOutsideDefaultItalic',
                        opacityDefaultKey: 'switchButtonOutsideDefaultOpacity',
                        offXDefaultKey: 'switchButtonOutsideDefaultOffX',
                        offYDefaultKey: 'switchButtonOutsideDefaultOffY',
                        groupVisibleWhen: (values, isGlobal) => {
                            if (SwitchWidget.isInvisibleStyle(values, isGlobal)) return false;
                            if (SwitchWidget.isTextOnlyStyle(values, isGlobal)) return false;
                            if (isGlobal) {
                                return !SwitchWidget.labelPosIsInside(values.defaultSwitchLabelPos);
                            }
                            return !SwitchWidget.labelPosIsInside(values.buttonLabelPosition || values.labelPos);
                        },
                        groupDependsOn: ['buttonLabelPosition', 'labelPos', 'style', 'defaultSwitchLabelPos', 'defaultSwitchStyle']
                    }),
                    BaseWidget.getTypographySchema('switchButtonInsideLabel', 'Button Label (Inside)', {
                        dualColor: true,
                        dualColorOnDefaultKey: 'switchButtonInsideDefaultCol',
                        dualColorOffDefaultKey: 'switchButtonInsideDefaultColOff',
                        nestedTypography: { root: 'typography', role: 'buttonLabelInside' },
                        dualColorOnLabel: 'Inside Label (Switch On)',
                        dualColorOffLabel: 'Inside Label (Switch Off)',
                        alignLabel: 'Button Label Alignment',
                        caseLabel: 'Button Label Case',
                        boldLabel: 'Button Label Bold',
                        italicLabel: 'Button Label Italic',
                        offsetXLabel: 'Button Label Offset X',
                        offsetYLabel: 'Button Label Offset Y',
                        fontDefaultKey: 'switchButtonInsideDefaultFont',
                        fontDefaultKeyFallback: 'fontFamily',
                        fontSizeDefaultKey: 'switchButtonInsideDefaultFs',
                        alignDefaultKey: 'switchButtonInsideDefaultAlign',
                        caseDefaultKey: 'switchButtonInsideDefaultCase',
                        boldDefaultKey: 'switchButtonInsideDefaultBold',
                        italicDefaultKey: 'switchButtonInsideDefaultItalic',
                        opacityDefaultKey: 'switchButtonInsideDefaultOpacity',
                        offXDefaultKey: 'switchButtonInsideDefaultOffX',
                        offYDefaultKey: 'switchButtonInsideDefaultOffY',
                        groupVisibleWhen: (values, isGlobal) => {
                            if (SwitchWidget.isInvisibleStyle(values, isGlobal)) return false;
                            if (SwitchWidget.isTextOnlyStyle(values, isGlobal)) return true;
                            if (isGlobal) {
                                return SwitchWidget.labelPosIsInside(values.defaultSwitchLabelPos);
                            }
                            return SwitchWidget.labelPosIsInside(values.buttonLabelPosition || values.labelPos);
                        },
                        groupDependsOn: ['buttonLabelPosition', 'labelPos', 'style', 'defaultSwitchLabelPos', 'defaultSwitchStyle']
                    })
                ].concat(
                    (typeof DashboardDialog !== 'undefined' && DashboardDialog.confirmationTypographyGroups)
                        ? DashboardDialog.confirmationTypographyGroups()
                        : []
                )
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

    _useSeparateOnOffTopics() {
        const c = this.config;
        const currentMode = c.mode || c.defaultSwitchMode || 'toggle';
        return currentMode === 'toggle' && c.separateOnOffTopics === true;
    }

    _hasPrimaryTopicForState(isActive) {
        const c = this.config;
        if (this._useSeparateOnOffTopics()) {
            const topic = String(isActive ? (c.outputTopic || '') : (c.outputTopicOff || '')).trim();
            return Boolean(topic);
        }
        return Boolean(String(c.outputTopic || '').trim());
    }

    _sendPrimaryTopicPayload(isActive, requireConfiguredOutputTopic = false) {
        const c = this.config;
        let targetTopic = '';

        if (this._useSeparateOnOffTopics()) {
            targetTopic = String(isActive ? (c.outputTopic || '') : (c.outputTopicOff || '')).trim();
            if (!targetTopic) return;
        } else {
            const configuredOutputTopic = String(c.outputTopic || '').trim();
            targetTopic = configuredOutputTopic || (requireConfiguredOutputTopic ? '' : (c.name || this.id));
            if (!targetTopic) return;
        }

        const payloadValue = isActive ? this._parsePayloadValue(c.onPayload) : this._parsePayloadValue(c.offPayload);
        Dashboard.send(targetTopic, payloadValue);
    }

    _sendExtraOutputTopics(isActive, filter) {
        const c = this.config;
        const currentMode = c.mode || c.defaultSwitchMode || 'toggle';
        if (currentMode === 'push' && !isActive) return;

        const separate = this._useSeparateOnOffTopics();
        const topics = SwitchWidget.normalizeExtraOutputTopics(c.extraOutputTopics);
        const gestureFilter = filter || 'all';
        const self = this;
        topics.forEach(function (entry) {
            if (!SwitchWidget.matchesHoldFilter(entry.holdToActivate === true, gestureFilter)) return;
            let topic = '';
            if (separate) {
                topic = String(isActive ? (entry.topic || '') : (entry.topicOff || '')).trim();
            } else {
                topic = String(entry.topic || '').trim();
            }
            if (!topic) return;
            const rawPayload = isActive ? entry.onPayload : entry.offPayload;
            Dashboard.send(topic, self._parsePayloadValue(rawPayload));
        });
    }

    _sendTopicPayload(isActive, requireConfiguredOutputTopic = false, filter) {
        const gestureFilter = filter || 'all';
        if (SwitchWidget.matchesHoldFilter(this.config.holdToActivate === true, gestureFilter)) {
            this._sendPrimaryTopicPayload(isActive, requireConfiguredOutputTopic);
        }
        this._sendExtraOutputTopics(isActive, gestureFilter);
    }

    _applySelectionGroupExclusion(silent = false) {
        const c = this.config;
        if (!SwitchWidget.isGroupExclusionAvailable(c)) return;
        const implicitPage = SwitchWidget.usesImplicitPageNavExclusion(c);
        const groupKey = String(c.selectionGroup || '').trim();
        if (!implicitPage && !groupKey) return;

        const activePage = Math.max(1, parseInt(String(MASTER_SETTINGS.currentPage || 1), 10) || 1);
        Object.values(Dashboard.widgets || {}).forEach((peer) => {
            if (!peer || peer === this) return;
            
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
                if (!SwitchWidget.exclusionPeersMatch(c, peerConfig)) return;
                if (!peerConfig.state) return;

                peer._setOptimisticState(false);
                peer.update({ state: false });

                if (!silent && peerConfig.sendOffOnGroupDeselect === true) {
                    peer._sendTopicPayload(false, true);
                }
            } else if (typeof MenuWidget !== 'undefined' && peer instanceof MenuWidget) {
                const peerPageRaw = String(peer.config.page != null ? peer.config.page : '1');
                const peerPageSpec = typeof Dashboard.resolveEffectivePageForWidgetId === 'function'
                    ? Dashboard.resolveEffectivePageForWidgetId(peer.id, peerPageRaw)
                    : peerPageRaw;
                const onPage = typeof WidgetPageSpec !== 'undefined'
                    ? WidgetPageSpec.coversPage(peerPageSpec, activePage)
                    : peerPageSpec.split(',').map(p => p.trim()).includes(String(activePage));
                if (onPage) {
                    peer.itemsConfig.forEach((pItem) => {
                        if (!SwitchWidget.exclusionPeersMatch(c, pItem)) return;
                        if (!pItem.state) return;
                        peer.lastInteractions[pItem.index] = Date.now();
                        const pKey = `item_${pItem.index}_state`;
                        const stTopic = typeof BindingsTree !== 'undefined'
                            ? BindingsTree.getAtPath(peer.bindings, MenuWidget.menuItemStateBindingPath(pItem.index))
                            : undefined;
                        if (stTopic) BaseWidget.reflectLocalTopic(stTopic, false);
                        peer.update({ [pKey]: false });
                        if (!silent && pItem.sendOffOnGroupDeselect === true) peer._sendTopicPayload(pItem, false, true);
                    });
                }
            }
        });
    }

    /**
     * Local visual state shown until the bound state topic delivers its next value.
     * Never written to Dashboard.liveData, so input bindings stay read-only.
     */
    _setOptimisticState(isOn) {
        const hasStateBinding = Boolean(this.bindings.state && String(this.bindings.state).trim());
        this._optimisticState = hasStateBinding ? isOn : undefined;
    }

    onIncomingData(topic, payload, count) {
        const stateTopic = this.bindings.state;
        if (stateTopic && topic === stateTopic) this._optimisticState = undefined;
        if (this.config && this.config.deactivated) this.isHovered = false;

        const c = this.config;
        if (!c || c.mode === 'push') return false;

        if (stateTopic && topic === stateTopic) {
            let v = payload;
            if (typeof v !== 'boolean') {
                const s = String(v).toLowerCase().trim();
                v = (v === true || s === 'true' || s === '1' || s === 'on');
            }
            if (v === true) {
                this._applySelectionGroupExclusion(true);
            }
            return true;
        }
        return false;
    }

    executeAction(isActive, filter) {
        if (Dashboard.isEditMode || this.config.deactivated) return;
        const c = this.config;
        const gestureFilter = filter || 'all';
        const primaryOn = SwitchWidget.matchesHoldFilter(c.holdToActivate === true, gestureFilter);

        if (c.actionType === 'page') {
            if (isActive || c.mode === 'toggle') {
                if (primaryOn && this._hasPrimaryTopicForState(isActive)) {
                    this._sendPrimaryTopicPayload(isActive, true);
                }
                this._sendExtraOutputTopics(isActive, gestureFilter);
                if (primaryOn) {
                    Dashboard.updateGlobal({ currentPage: parseInt(c.pageTo) });
                }
            }
            return;
        }

        if (c.actionType === 'url') {
            if (isActive || c.mode === 'toggle') {
                if (primaryOn && this._hasPrimaryTopicForState(isActive)) {
                    this._sendPrimaryTopicPayload(isActive, true);
                }
                this._sendExtraOutputTopics(isActive, gestureFilter);
                if (primaryOn) {
                    if (typeof UrlNavigation !== 'undefined' && typeof UrlNavigation.openUrl === 'function') {
                        UrlNavigation.openUrl(c.urlTo, c.urlNewTab);
                    } else {
                        window.open(c.urlTo, c.urlNewTab === true ? '_blank' : '_self');
                    }
                }
            }
            return;
        }

        if (c.actionType === 'topic') {
            this._sendTopicPayload(isActive, false, gestureFilter);
        }
    }

    toggle(filter) {
        if (this.config.mode === 'push' || this.config.deactivated) return;

        const c = this.config;
        const hasStateBinding = Boolean(this.bindings.state && String(this.bindings.state).trim());
        if (c.actionType === 'page' && !hasStateBinding) {
            const targetPage = parseInt(c.pageTo || 1, 10);
            const cur = typeof MASTER_SETTINGS !== 'undefined' ? parseInt(MASTER_SETTINGS.currentPage || 1, 10) : 1;
            if (cur === targetPage) return;
        }

        const selectionGroupId = String(c.selectionGroup || '').trim();
        if (selectionGroupId && this.config.state === true
            && typeof Dashboard !== 'undefined' && !Dashboard.getSelectionGroupAllowEmpty(selectionGroupId)) {
            return;
        }

        const currentState = this.config.state;
        const newState = !currentState;

        this._runConfirmedAction(newState, function () {
            this._setOptimisticState(newState);

            this.executeAction(newState, filter || 'all');

            if (newState === true) {
                this._applySelectionGroupExclusion(false);
            }

            if (typeof DashboardAudio !== 'undefined') {
                DashboardAudio.playFrom(this.config.audio, newState ? 'on' : 'off');
            }

            this.update({ state: newState });
        }, filter || 'all');
    }

    _runConfirmedAction(intendedOn, runFn, gestureFilter) {
        const self = this;
        const run = function () {
            if (typeof runFn === 'function') runFn.call(self);
        };
        if (typeof DashboardDialog !== 'undefined' && typeof DashboardDialog.confirm === 'function') {
            DashboardDialog.confirm(this, intendedOn, run, gestureFilter);
            return;
        }
        run();
    }

    _syncConfirmationDialogPreview() {
        if (typeof DashboardDialog !== 'undefined' && typeof DashboardDialog.syncPreview === 'function') {
            DashboardDialog.syncPreview(this);
        }
    }

    _setPushVisualState(isDown) {
        if (this.config.mode !== 'push') return;
        if (this.config.state === isDown) return;
        this._setOptimisticState(isDown);
        if (typeof DashboardAudio !== 'undefined') {
            DashboardAudio.playFrom(this.config.audio, isDown ? 'press' : 'release');
        }
        this.update({ state: isDown });
    }

    _holdPressPointerOnButton(clientX, clientY) {
        const btn = this.e && this.e.btn;
        if (!btn || typeof btn.getBoundingClientRect !== 'function') return true;
        const r = btn.getBoundingClientRect();
        const pad = 8;
        return clientX >= (r.left - pad) && clientX <= (r.right + pad)
            && clientY >= (r.top - pad) && clientY <= (r.bottom + pad);
    }

    _clearHoldPressTimer() {
        const hp = this._holdPress;
        if (!hp || !hp.timer) return;
        SwitchWidget._clearArmedTimeout(hp.timer);
        hp.timer = null;
    }

    _detachHoldPressDocumentListeners() {
        const hp = this._holdPress;
        if (!hp) return;
        if (hp.onMouseMove) document.removeEventListener('mousemove', hp.onMouseMove);
        if (hp.onMouseUp) document.removeEventListener('mouseup', hp.onMouseUp);
        if (hp.onTouchMove) document.removeEventListener('touchmove', hp.onTouchMove);
        if (hp.onTouchEnd) document.removeEventListener('touchend', hp.onTouchEnd);
        if (hp.onTouchCancel) document.removeEventListener('touchcancel', hp.onTouchCancel);
        hp.onMouseMove = null;
        hp.onMouseUp = null;
        hp.onTouchMove = null;
        hp.onTouchEnd = null;
        hp.onTouchCancel = null;
    }

    _hasAnyActionForGesture(gestureFilter) {
        const c = this.config;
        if (SwitchWidget.matchesHoldFilter(c.holdToActivate === true, gestureFilter)) {
            return true;
        }
        const topics = SwitchWidget.normalizeExtraOutputTopics(c.extraOutputTopics);
        for (let i = 0; i < topics.length; i++) {
            const entry = topics[i];
            if (SwitchWidget.matchesHoldFilter(entry.holdToActivate === true, gestureFilter)) {
                if (entry.topic || entry.topicOff) return true;
            }
        }
        return false;
    }

    _playActionAudio() {
        if (typeof DashboardAudio === 'undefined' || !this.config || !this.config.audio) return;
        const audio = this.config.audio;
        let key = '';
        if (this.config.mode === 'push') {
            key = audio.press ? 'press' : (audio.on ? 'on' : '');
        } else {
            key = audio.on ? 'on' : (audio.press ? 'press' : (audio.off ? 'off' : ''));
        }
        if (key) {
            DashboardAudio.playFrom(audio, key);
        }
    }

    _dispatchHoldPressGesture(filter) {
        if (Dashboard.isEditMode || this.config.deactivated) return;
        const c = this.config;
        const gestureFilter = filter || 'all';
        if (!this._hasAnyActionForGesture(gestureFilter)) {
            return;
        }
        if (c.mode === 'push') {
            this._runConfirmedAction(true, function () {
                this.executeAction(true, gestureFilter);
                if (gestureFilter === 'hold' && c.holdToActivate !== true) {
                    this._playActionAudio();
                }
            }, gestureFilter);
            return;
        }
        const primaryOn = SwitchWidget.matchesHoldFilter(c.holdToActivate === true, gestureFilter);
        if (primaryOn) {
            this.toggle(gestureFilter);
        } else {
            this._runConfirmedAction(true, function () {
                this._sendExtraOutputTopics(true, gestureFilter);
                this._playActionAudio();
            }, gestureFilter);
        }
    }

    _beginHoldPress(clientX, clientY, fromTouch) {
        if (Dashboard.isEditMode || this.config.deactivated) return;
        if (this._holdPress && this._holdPress.active) return;
        if (!fromTouch && this._holdPress && this._holdPress.ignoreMouseUntil
            && Date.now() < this._holdPress.ignoreMouseUntil) {
            return;
        }

        const hp = {
            active: true,
            holdFired: false,
            cancelled: false,
            fromTouch: fromTouch === true,
            startX: clientX,
            startY: clientY,
            timer: null,
            onMouseMove: null,
            onMouseUp: null,
            onTouchMove: null,
            onTouchEnd: null,
            onTouchCancel: null,
            ignoreMouseUntil: this._holdPress ? this._holdPress.ignoreMouseUntil : 0
        };
        this._holdPress = hp;

        if (SwitchWidget.hasAnyHoldToActivate(this.config)) {
            hp.timer = SwitchWidget._armTimeout(() => {
                hp.timer = null;
                if (!hp.active || hp.cancelled) return;
                hp.holdFired = true;
                if (this.config.mode === 'push') {
                    this._setPushVisualState(true);
                }
                this._dispatchHoldPressGesture('hold');
            }, SwitchWidget.resolvedHoldToActivateMs());
        }

        if (this.config.mode === 'push' && this.config.holdToActivate !== true) {
            this._setPushVisualState(true);
        }

        if (fromTouch) {
            hp.onTouchMove = (e) => {
                if (!hp.active) return;
                const t = e.touches[0] || e.changedTouches[0];
                if (!t) return;
                if (!this._holdPressPointerOnButton(t.clientX, t.clientY)) {
                    this._cancelHoldPress();
                }
            };
            hp.onTouchEnd = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                const t = e && e.changedTouches && e.changedTouches[0];
                this._endHoldPress(t ? t.clientX : hp.startX, t ? t.clientY : hp.startY);
            };
            hp.onTouchCancel = () => this._cancelHoldPress();
            document.addEventListener('touchmove', hp.onTouchMove, { passive: true });
            document.addEventListener('touchend', hp.onTouchEnd, { passive: false });
            document.addEventListener('touchcancel', hp.onTouchCancel);
        } else {
            hp.onMouseMove = (e) => {
                if (!hp.active) return;
                if (!this._holdPressPointerOnButton(e.clientX, e.clientY)) {
                    this._cancelHoldPress();
                }
            };
            hp.onMouseUp = (e) => {
                if (e && e.button !== 0) return;
                this._endHoldPress(e ? e.clientX : hp.startX, e ? e.clientY : hp.startY);
            };
            document.addEventListener('mousemove', hp.onMouseMove);
            document.addEventListener('mouseup', hp.onMouseUp);
        }
    }

    _endHoldPress(clientX, clientY) {
        const hp = this._holdPress;
        if (!hp || !hp.active) return;

        this._clearHoldPressTimer();
        this._detachHoldPressDocumentListeners();
        hp.active = false;

        if (hp.fromTouch) {
            hp.ignoreMouseUntil = Date.now() + 700;
            this.isHovered = false;
        }

        const wasCancelled = hp.cancelled;
        const holdFired = hp.holdFired;
        const stillOnButton = this._holdPressPointerOnButton(clientX, clientY);
        if (wasCancelled || holdFired || !stillOnButton) {
            if (this.config.mode === 'push') {
                this._setPushVisualState(false);
            }
            return;
        }

        const filter = SwitchWidget.hasAnyHoldToActivate(this.config) ? 'tap' : 'all';
        this._dispatchHoldPressGesture(filter);
        if (this.config.mode === 'push') {
            this._setPushVisualState(false);
        }
    }

    _cancelHoldPress() {
        const hp = this._holdPress;
        if (!hp || !hp.active) return;
        hp.cancelled = true;
        this._clearHoldPressTimer();
        this._detachHoldPressDocumentListeners();
        hp.active = false;
        if (hp.fromTouch) {
            hp.ignoreMouseUntil = Date.now() + 700;
            this.isHovered = false;
        }
        if (this.config.mode === 'push') {
            this._setPushVisualState(false);
        }
    }

    onRemove() {
        this._cancelHoldPress();
        if (typeof DashboardDialog !== 'undefined' && DashboardDialog.dismissForWidget) {
            DashboardDialog.dismissForWidget(this.id);
        }
        super.onRemove();
    }

    _buildBaseDOM() {
        const b = super._buildBaseDOM();
        b.container.classList.add('interactive', 'switch-widget-container');
        b.innerContent.style.display = 'flex';
        b.innerContent.style.flexDirection = 'column';
        b.innerContent.style.alignItems = 'stretch';
        b.innerContent.style.justifyContent = 'center';
        b.innerContent.style.touchAction = 'manipulation';

        const groupTitleEl = document.createElement('div');
        BaseWidget.applyWidgetLabelElementChrome(groupTitleEl);
        groupTitleEl.style.display = 'none';

        const layout = document.createElement('div');
        layout.className = 'sw-layout';
        layout.style.display = 'flex';
        layout.style.alignItems = 'center';
        layout.style.justifyContent = 'center';
        layout.style.flex = '1 1 auto';
        layout.style.minHeight = '0';
        layout.style.width = '100%';
        layout.style.height = '100%';
        layout.style.pointerEvents = 'none';

        const lbl = document.createElement('div');
        lbl.className = 'sw-label';

        const btn = document.createElement('div');
        btn.className = 'sw-btn';
        btn.style.position = 'relative';
        btn.style.transition = 'background-color 0.15s, box-shadow 0.15s, filter 0.15s, transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
        btn.style.willChange = 'box-shadow, filter, background-color, transform';
        btn.style.transform = 'translateZ(0)';
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.boxSizing = 'border-box';
        btn.style.flexShrink = '0';

        const content = document.createElement('div');
        content.className = 'sw-content';
        content.style.pointerEvents = 'none';
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'center';
        content.style.width = '100%';
        content.style.height = '100%';
        content.style.boxSizing = 'border-box';
        content.style.zIndex = '1';

        const knob = document.createElement('div');
        knob.className = 'sw-knob';
        knob.style.borderRadius = '50%';
        knob.style.background = 'white';
        knob.style.position = 'absolute';
        knob.style.boxSizing = 'border-box';
        knob.style.zIndex = '2';
        knob.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        knob.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        const iconWrap = document.createElement('div');
        iconWrap.className = 'sw-icon-wrap flex items-center justify-center';
        iconWrap.style.transition = 'color 0.2s';

        btn.appendChild(knob);
        btn.appendChild(content);
        content.appendChild(iconWrap);

        layout.appendChild(lbl);
        layout.appendChild(btn);
        b.innerContent.appendChild(groupTitleEl);
        b.innerContent.appendChild(layout);

        this.e = { groupTitleEl, layout, lbl, btn, knob, content, iconWrap };
        this.isHovered = false;
        this._holdPress = null;

        btn.addEventListener('mousedown', (e) => {
            if (Dashboard.isEditMode || this.config.deactivated) return;
            if (e.button !== 0) return;
            e.stopPropagation();
            this._beginHoldPress(e.clientX, e.clientY, false);
        });
        btn.addEventListener('touchstart', (e) => {
            if (Dashboard.isEditMode || this.config.deactivated) return;
            e.stopPropagation();
            e.preventDefault();
            const t = e.touches[0];
            this._beginHoldPress(t.clientX, t.clientY, true);
        }, { passive: false });
        btn.addEventListener('mouseenter', () => {
            if (Dashboard.isEditMode || this.config.deactivated) return;
            this.isHovered = true;
            this._updateColors();
        });
        btn.addEventListener('mousemove', () => {
            if (this.isHovered || Dashboard.isEditMode || this.config.deactivated) return;
            this.isHovered = true;
            this._updateColors();
        });
        btn.addEventListener('mouseleave', () => {
            if (!this.isHovered) return;
            this.isHovered = false;
            this._updateColors();
        });
        return b;
    }

    _hasTextOnlyButtonLabel(c) {
        return Boolean(String((c && c.buttonLabel) || '').trim());
    }

    /** Restore DOM chrome to the same inline defaults as `_buildBaseDOM` after Text Only / Invisible. */
    _resetSpecialStyleLayoutChrome() {
        const shell = this.elements;
        const e = this.e;
        if (!shell || !e) return;
        shell.container.classList.remove('sw-text-only-mode', 'sw-invisible-mode');

        shell.innerContent.style.display = 'flex';
        shell.innerContent.style.flexDirection = 'column';
        shell.innerContent.style.alignItems = 'stretch';
        shell.innerContent.style.justifyContent = 'center';

        if (e.groupTitleEl && e.groupTitleEl.parentNode !== shell.innerContent) {
            shell.innerContent.insertBefore(e.groupTitleEl, e.layout);
        }

        if (e.btn.parentNode === shell.container) {
            e.layout.appendChild(e.btn);
        }
        if (e.layout.parentNode !== shell.innerContent) {
            shell.innerContent.appendChild(e.layout);
        }

        e.layout.style.display = 'flex';
        e.layout.style.flexDirection = 'row';
        e.layout.style.alignItems = 'center';
        e.layout.style.justifyContent = 'center';
        e.layout.style.flex = '1 1 auto';
        e.layout.style.width = '100%';
        // Legacy WebKit (iOS 12 / Safari 12) does not treat a flex item's main size
        // resolved via flex-growth as "definite" for percentage-height children. With
        // height left auto, `.sw-btn { height: 100% }` (inside-label button style)
        // collapsed to content height. Pin 100% so it resolves against the definite
        // `.widget-content` and the button fills the widget vertically.
        e.layout.style.height = '100%';
        e.layout.style.minHeight = '0';
        e.layout.style.pointerEvents = 'none';

        e.btn.style.position = '';
        e.btn.style.top = '';
        e.btn.style.left = '';
        e.btn.style.right = '';
        e.btn.style.bottom = '';
        e.btn.style.zIndex = '';
        e.btn.style.display = 'flex';
        e.btn.style.flex = '';
        e.btn.style.width = '';
        e.btn.style.height = '';
        e.btn.style.minWidth = '';
        e.btn.style.minHeight = '';
        e.btn.style.maxWidth = '';
        e.btn.style.alignSelf = '';
        e.btn.style.flexShrink = '0';
        e.btn.style.borderRadius = '';

        e.content.style.display = 'flex';
        e.content.style.flexDirection = 'row';
        e.content.style.alignItems = 'center';
        e.content.style.justifyContent = 'center';
        e.content.style.width = '100%';
        e.content.style.height = '100%';
        e.content.style.flex = '';
        e.content.style.minHeight = '';
        e.content.style.boxSizing = 'border-box';

        e.knob.style.display = '';
        e.iconWrap.style.display = '';
        e.lbl.style.display = '';
        e.lbl.style.width = '';
        e.lbl.style.flex = '';
        e.lbl.style.flexGrow = '';
        e.lbl.style.textAlign = '';
        e.lbl.style.margin = '0';

        this._syncInvisibleEditorChrome();
    }

    _syncEditModeVisuals() {
        BaseWidget.prototype._syncEditModeVisuals.call(this);
        this._syncInvisibleEditorChrome(true);
    }

    _syncInvisibleEditorChrome(keepOpacityWhenVisible) {
        const shell = this.elements;
        if (!shell) return;
        if (!SwitchWidget.isInvisibleStyle(this.config, false)) {
            if (!keepOpacityWhenVisible) shell.wrapper.style.opacity = '';
            return;
        }
        if (!Dashboard.isEditMode) {
            shell.wrapper.style.opacity = '';
            return;
        }
        const c = this.config;
        if (c.visible === false) return;
        const selected = shell.wrapper.classList.contains('selected')
            || shell.wrapper.classList.contains('multi-selected');
        shell.wrapper.style.opacity = selected ? '1' : '0.5';
    }

    _applyInvisiblePresentation() {
        const shell = this.elements;
        const e = this.e;
        const c = this.config;
        const invisible = SwitchWidget.isInvisibleStyle(c, false);
        shell.container.classList.toggle('sw-invisible-mode', invisible);
        if (!invisible) return;

        e.knob.style.display = 'none';
        e.iconWrap.textContent = '';
        e.iconWrap.style.display = 'none';
        e.lbl.style.display = 'none';
        if (e.groupTitleEl) e.groupTitleEl.style.display = 'none';

        shell.container.style.background = 'transparent';
        shell.container.style.border = 'none';
        shell.container.style.boxShadow = 'none';

        const deactivated = !!c.deactivated;
        e.btn.style.display = 'flex';
        const invPe = (deactivated && !Dashboard.isEditMode) ? 'none' : 'auto';
        if (e.btn.style.pointerEvents !== invPe) e.btn.style.pointerEvents = invPe;
        e.btn.style.backgroundColor = 'transparent';
        e.btn.style.border = 'none';
        e.btn.style.boxShadow = 'none';
        e.btn.style.filter = 'none';
        e.btn.style.transform = 'translateZ(0)';
        this._syncBackdropBlur(e.btn, 0);
        const invCursor = (deactivated || Dashboard.isEditMode) ? 'default' : 'pointer';
        if (e.btn.style.cursor !== invCursor) e.btn.style.cursor = invCursor;

        this._syncInvisibleEditorChrome();
    }

    _applyTextOnlyPresentation() {
        const c = this.config;
        const e = this.e;
        const textOnly = SwitchWidget.isTextOnlyStyle(c, false);
        e.btn.classList.toggle('sw-text-only', textOnly);
        if (!textOnly) return;

        e.knob.style.display = 'none';
        e.iconWrap.textContent = '';
        e.iconWrap.style.width = '';
        e.iconWrap.style.height = '';
        e.iconWrap.style.fontSize = '';
        e.btn.style.backgroundColor = 'transparent';
        e.btn.style.border = 'none';
        e.btn.style.boxShadow = 'none';
        e.btn.style.filter = 'none';
        e.btn.style.transform = 'translateZ(0)';
        this._syncBackdropBlur(e.btn, 0);

        const hasLabel = this._hasTextOnlyButtonLabel(c);
        if (!hasLabel) {
            e.btn.style.display = 'none';
            e.btn.style.pointerEvents = 'none';
            e.btn.style.cursor = 'default';
            return;
        }

        const deactivated = !!c.deactivated;
        if (e.btn.style.display === 'none') e.btn.style.display = 'flex';
        const toPe = (deactivated && !Dashboard.isEditMode) ? 'none' : 'auto';
        if (e.btn.style.pointerEvents !== toPe) e.btn.style.pointerEvents = toPe;
        const toCursor = (deactivated || Dashboard.isEditMode) ? 'default' : 'pointer';
        if (e.btn.style.cursor !== toCursor) e.btn.style.cursor = toCursor;
    }

    _updateColors() {
        const c = this.config;
        const e = this.e;
        const shell = this.elements;
        if (c.deactivated) {
            this.isHovered = false;
        }
        const isHover = this.isHovered && !Dashboard.isEditMode && !c.deactivated;

        if (SwitchWidget.isInvisibleStyle(c, false)) {
            this._applyInvisiblePresentation();
            return;
        }
        if (shell && shell.container) shell.container.classList.remove('sw-invisible-mode');
        if (SwitchWidget.isTextOnlyStyle(c, false)) {
            this._applyTextOnlyPresentation();
            return;
        }
        e.btn.classList.remove('sw-text-only');

        if (c.deactivated) {
            this.isHovered = false;
            const deactColor = BaseWidget.getDeactivatedColor(c);
            const accentColor = BaseWidget.getDeactivatedColorAccent(c);
            e.btn.style.backgroundColor = deactColor;
            e.btn.style.boxShadow = 'none';
            e.btn.style.filter = 'none';
            this._syncBackdropBlur(e.btn, 0);
            if (c.showIcon) {
                this._refreshSwitchIcon();
                const iconNode = e.iconWrap.querySelector('.ds-icon-glyph, i, svg, [data-phosphor-icon]');
                if (iconNode) iconNode.style.color = accentColor;
                e.iconWrap.style.setProperty('--icon-secondary-color', accentColor);
            } else {
                e.iconWrap.textContent = '';
                e.iconWrap.style.display = 'none';
            }
            return;
        }

        if (c.style === 'image-only') {
            // No face. Background, outline, blur, and inner glow are for the button shape.
            e.btn.style.backgroundColor = 'transparent';
            e.btn.style.border = 'none';
            e.btn.style.boxShadow = 'none';
            e.btn.style.transform = 'translateZ(0)';
            this._syncBackdropBlur(e.btn, 0);
            if (c.showIcon) {
                this._refreshSwitchIcon();
            } else {
                e.iconWrap.textContent = '';
                e.iconWrap.style.width = '';
                e.iconWrap.style.height = '';
                e.iconWrap.style.fontSize = '';
            }
            if (c.btnGlow && (c.state || isHover)) {
                e.btn.style.filter = 'drop-shadow(0 0 ' + c.btnGlowRadius + 'px ' + BaseWidget.resolveCssColor(c.btnGlowColor) + ')';
            } else {
                e.btn.style.filter = 'none';
            }
            return;
        }

        let bgCol = c.state ? c.colOn : c.colOff;
        if (isHover) bgCol = c.colHover;
        e.btn.style.backgroundColor = BaseWidget.colorAtOpacity(bgCol, c.backgroundOpacity);

        if (c.showIcon) {
            this._refreshSwitchIcon();
        } else {
            e.iconWrap.textContent = '';
            e.iconWrap.style.width = '';
            e.iconWrap.style.height = '';
            e.iconWrap.style.fontSize = '';
        }

        if (c.style !== 'switch') {
            const boxShadows = [];

            if (c.bevel) {
                if (c.state) {
                    boxShadows.push('inset 2px 2px 5px rgba(0,0,0,0.5)');
                    boxShadows.push('inset -2px -2px 5px rgba(255,255,255,0.1)');
                    e.btn.style.transform = 'translateY(1px) translateZ(0)';
                } else {
                    boxShadows.push('2px 2px 5px rgba(0,0,0,0.5)');
                    boxShadows.push('inset 1px 1px 2px rgba(255,255,255,0.2)');
                    e.btn.style.transform = 'translateY(0) translateZ(0)';
                }
            } else {
                e.btn.style.transform = 'translateZ(0)';
            }

            if (c.btnGlow && (c.state || isHover)) {
                boxShadows.push('0 0 ' + c.btnGlowRadius + 'px ' + BaseWidget.resolveCssColor(c.btnGlowColor));
            }

            const faceInnerGlow = BaseWidget.elementInnerGlowShadow(c.buttonInnerGlow, c.buttonInnerGlowColor, c.buttonInnerGlowOpacity);
            if (faceInnerGlow) boxShadows.push(faceInnerGlow);

            e.btn.style.filter = 'none';
            e.btn.style.boxShadow = boxShadows.length > 0 ? boxShadows.join(', ') : 'none';
            // Frost only behind a translucent face; at full opacity blur is invisible so it stays off.
            this._syncBackdropBlur(e.btn, (Number(c.backgroundOpacity) < 100 ? c.buttonBlur : 0));
        } else {
            // Pill: same face chrome as the rect button (opacity is already on
            // the fill; outline is applied in layout). Skip bevel and outer glow.
            const faceInnerGlow = BaseWidget.elementInnerGlowShadow(c.buttonInnerGlow, c.buttonInnerGlowColor, c.buttonInnerGlowOpacity);
            e.btn.style.boxShadow = faceInnerGlow || 'none';
            e.btn.style.filter = 'none';
            e.btn.style.transform = 'translateZ(0)';
            this._syncBackdropBlur(e.btn, (Number(c.backgroundOpacity) < 100 ? c.buttonBlur : 0));
        }
    }

    _refreshSwitchIcon() {
        const c = this.config;
        const e = this.e;
        if (!c.showIcon) {
            e.iconWrap.textContent = '';
            e.iconWrap.style.width = '';
            e.iconWrap.style.height = '';
            e.iconWrap.style.fontSize = '';
            return;
        }
        const s = c.scale;
        const rawSz = c.state ? c.iconSize : (c.iconSlotSizeOff !== undefined && c.iconSlotSizeOff !== null && String(c.iconSlotSizeOff).trim() !== ''
            ? c.iconSlotSizeOff
            : c.iconSize);
        const nb = typeof rawSz === 'number' ? rawSz : parseFloat(String(rawSz !== undefined && rawSz !== null ? rawSz : '').trim());
        const basePx = Number.isFinite(nb) && nb > 0 ? nb : (Number(c.iconSize) || 24);
        const iSize = basePx * s;
        e.iconWrap.style.fontSize = `${iSize}px`;
        e.iconWrap.style.width = `${iSize}px`;
        e.iconWrap.style.height = `${iSize}px`;

        const km = { ...(c.state ? SwitchWidget.ICON_KEYMAP_ON : SwitchWidget.ICON_KEYMAP_OFF) };
        delete km.size;

        const baseCol = c.state
            ? (c.iconColOnOverrideEn ? c.iconColOnOverride : c.iconSlotColOn)
            : (c.iconColOffOverrideEn ? c.iconColOffOverride : c.iconSlotColOff);
        const isHover = this.isHovered && !Dashboard.isEditMode && !c.deactivated;
        const hoverCol = c.state ? c.iconSlotHoverOn : (c.iconSlotHoverOff || c.iconSlotHoverOn);

        BaseWidget.applyIconStyleToElement(e.iconWrap, c, km, {
            color: baseCol,
            hoverColor: hoverCol,
            isHovering: isHover,
            targetUrl: (c.actionType === 'url') ? c.urlTo : ''
        });
    }

    _placeChild(node, parent, before) {
        if (!node || !parent) return;
        if (before) {
            if (node.parentNode === parent && node.nextSibling === before) return;
            parent.insertBefore(node, before);
            return;
        }
        if (node.parentNode === parent && node.nextSibling === null) return;
        parent.appendChild(node);
    }

    _renderInvisibleLayout() {
        const shell = this.elements;
        const e = this.e;

        this._resetSpecialStyleLayoutChrome();
        shell.container.classList.remove('sw-text-only-mode');
        shell.container.classList.add('sw-invisible-mode');
        shell.innerContent.style.display = 'none';
        e.layout.style.display = 'none';
        if (e.groupTitleEl) e.groupTitleEl.style.display = 'none';
        e.lbl.style.display = 'none';
        e.iconWrap.style.display = 'none';
        e.knob.style.display = 'none';

        if (e.btn.parentNode !== shell.container) {
            shell.container.appendChild(e.btn);
        }
        e.btn.style.position = 'absolute';
        e.btn.style.top = '0';
        e.btn.style.left = '0';
        e.btn.style.right = '0';
        e.btn.style.bottom = '0';
        e.btn.style.width = '100%';
        e.btn.style.height = '100%';
        e.btn.style.flex = '';
        e.btn.style.minWidth = '';
        e.btn.style.minHeight = '';
        e.btn.style.maxWidth = '';
        e.btn.style.alignSelf = '';
        e.btn.style.flexShrink = '';
        e.btn.style.borderRadius = '0';
        e.btn.style.zIndex = '5';

        this._applyInvisiblePresentation();
    }

    _renderTextOnlyLayout(c) {
        const shell = this.elements;
        const e = this.e;

        this._resetSpecialStyleLayoutChrome();
        shell.container.classList.remove('sw-invisible-mode');
        const hasLabel = this._hasTextOnlyButtonLabel(c);
        const typoPrefix = 'switchButtonInsideLabel';
        const textAlign = String(c.switchButtonInsideLabelAlign || 'center').toLowerCase();
        const verticalJustify = SwitchWidget.textOnlyLabelVerticalAlignToJustify(c.textOnlyLabelVerticalAlign);

        shell.container.classList.add('sw-text-only-mode');
        shell.innerContent.style.justifyContent = 'flex-start';
        shell.innerContent.style.alignItems = 'stretch';

        e.layout.style.display = hasLabel ? 'flex' : 'none';
        e.layout.style.flex = '1 1 auto';
        e.layout.style.width = '100%';
        e.layout.style.height = '';
        e.layout.style.minHeight = '0';
        e.layout.style.alignSelf = 'stretch';
        e.layout.style.alignItems = 'stretch';
        e.layout.style.justifyContent = 'flex-start';
        e.layout.style.flexDirection = 'column';
        if (e.btn.parentNode !== e.layout) e.layout.appendChild(e.btn);

        e.btn.style.flex = '1 1 auto';
        e.btn.style.width = '100%';
        e.btn.style.height = '100%';
        e.btn.style.minWidth = '0';
        e.btn.style.minHeight = '0';
        e.btn.style.maxWidth = '100%';
        e.btn.style.alignSelf = 'stretch';
        e.btn.style.flexShrink = '1';
        e.btn.style.borderRadius = '0';

        e.content.style.boxSizing = 'border-box';
        e.content.style.padding = `${c.buttonContentInset}px`;
        e.content.style.flex = '1 1 auto';
        e.content.style.width = '100%';
        e.content.style.height = '100%';
        e.content.style.minHeight = '0';
        this._placeChild(e.lbl, e.content, null);
        e.content.style.display = 'flex';
        e.content.style.flexDirection = 'column';
        e.content.style.alignItems = 'stretch';
        e.content.style.justifyContent = verticalJustify;

        e.lbl.textContent = c.buttonLabel;
        e.lbl.style.display = hasLabel ? 'block' : 'none';
        e.lbl.style.margin = '0';
        e.lbl.style.pointerEvents = 'none';
        e.lbl.style.transition = 'all 0.2s';
        e.lbl.style.zIndex = '2';
        e.lbl.style.whiteSpace = 'normal';
        e.lbl.style.wordBreak = 'break-word';
        e.lbl.style.width = '100%';
        e.lbl.style.flex = '0 0 auto';
        e.lbl.style.flexGrow = '0';
        e.lbl.style.textAlign = textAlign;

        if (hasLabel) {
            this.applyTypographyToElement(e.lbl, typoPrefix, c, { colorStateOn: c.state });
        }

        this._placeChild(e.iconWrap, e.content, null);
        e.iconWrap.style.margin = '0';
        e.iconWrap.style.display = 'none';

        this._applyTextOnlyPresentation();

        if (c.deactivated) {
            const accentColor = BaseWidget.getDeactivatedColorAccent(c);
            if (hasLabel) {
                e.lbl.style.color = accentColor;
            }
            if (e.groupTitleEl && c.label) {
                e.groupTitleEl.style.color = accentColor;
            }
        }

        this._applyButtonLabelHint(c);
    }

    _applyButtonLabelHint(c) {
        if (!this.e || !this.e.lbl || typeof LabelHint === 'undefined') return;
        const labelText = String(c.buttonLabel || '').trim();
        const hintMode = c.buttonLabelHint;
        const labelInside = SwitchWidget.labelPosIsInside(c.labelPos);

        if (this.e.btn) LabelHint.clear(this.e.btn);

        if (!labelText || hintMode === 'disabled') {
            this.e.lbl.style.pointerEvents = 'none';
            LabelHint.clear(this.e.lbl);
            return;
        }

        const hoverTarget = labelInside ? this.e.btn : this.e.lbl;
        if (!hoverTarget) return;

        if (labelInside) {
            this.e.lbl.style.pointerEvents = 'none';
        } else {
            this.e.lbl.style.pointerEvents = 'auto';
            this.e.lbl.style.cursor = 'default';
        }

        LabelHint.apply(this.e.lbl, labelText, hintMode, {
            hoverTarget: hoverTarget,
            measureTarget: this.e.lbl
        });
    }

    _renderSpecific() {
        const c = this.config;
        const e = this.e;
        const s = c.scale;

        this._syncConfirmationDialogPreview();
        if (typeof DashboardDialog !== 'undefined' && typeof DashboardDialog.refreshOpen === 'function') {
            DashboardDialog.refreshOpen(this);
        }
        this._updateColors();

        if (SwitchWidget.isInvisibleStyle(c, false)) {
            this._renderInvisibleLayout();
            return;
        }

        if (SwitchWidget.isTextOnlyStyle(c, false)) {
            if (e.groupTitleEl) {
                const gt = String(c.label || '');
                e.groupTitleEl.textContent = gt;
                e.groupTitleEl.style.display = gt ? 'block' : 'none';
                if (gt) this.applyTypographyToElement(e.groupTitleEl, 'switchGroupLabel', c, {});
            }
            this._renderTextOnlyLayout(c);
            return;
        }

        this._resetSpecialStyleLayoutChrome();

        const deactivated = !!c.deactivated;
        if (deactivated) {
            this.isHovered = false;
        }
        e.btn.style.display = 'flex';
        const pe = (deactivated && !Dashboard.isEditMode) ? 'none' : 'auto';
        if (e.btn.style.pointerEvents !== pe) e.btn.style.pointerEvents = pe;
        const cursor = (deactivated || Dashboard.isEditMode) ? 'default' : 'pointer';
        if (e.btn.style.cursor !== cursor) e.btn.style.cursor = cursor;
        e.iconWrap.style.display = '';

        if (e.groupTitleEl) {
            const gt = String(c.label || '');
            e.groupTitleEl.textContent = gt;
            e.groupTitleEl.style.display = gt ? 'block' : 'none';
            if (gt) this.applyTypographyToElement(e.groupTitleEl, 'switchGroupLabel', c, {});
        }

        e.content.style.boxSizing = 'border-box';
        e.content.style.padding = `${c.buttonContentInset}px`;

        e.lbl.textContent = c.buttonLabel;
        e.lbl.style.display = c.buttonLabel ? 'block' : 'none';
        e.lbl.style.margin = '0';
        e.lbl.style.pointerEvents = 'none';
        e.lbl.style.transition = 'all 0.2s';
        e.lbl.style.zIndex = '2';
        e.lbl.style.whiteSpace = 'normal';
        e.lbl.style.wordBreak = 'break-word';
        const labelInside = SwitchWidget.labelPosIsInside(c.labelPos);
        const btnTypoPrefix = labelInside ? 'switchButtonInsideLabel' : 'switchButtonOutsideLabel';
        if (c.buttonLabel) {
            this.applyTypographyToElement(e.lbl, btnTypoPrefix, c, { colorStateOn: c.state });
        }

        if (labelInside) {
            this._placeChild(e.lbl, e.content, null);
            e.content.style.display = 'flex';
            const innerAlign = SwitchWidget.labelAlignToFlexAlign(c.switchButtonInsideLabelAlign);

            e.iconWrap.style.margin = '0';

            if (c.buttonLabel) {
                switch (c.labelPos) {
                    case 'inside_bottom':
                        e.content.style.flexDirection = 'column';
                        e.content.style.justifyContent = 'center';
                        e.content.style.alignItems = innerAlign;
                        this._placeChild(e.iconWrap, e.content, e.lbl);
                        e.iconWrap.style.marginBottom = '4px';
                        break;
                    case 'inside_top':
                        e.content.style.flexDirection = 'column';
                        e.content.style.justifyContent = 'center';
                        e.content.style.alignItems = innerAlign;
                        this._placeChild(e.lbl, e.content, e.iconWrap);
                        e.iconWrap.style.marginTop = '4px';
                        break;
                    case 'inside_right':
                        e.content.style.flexDirection = 'row';
                        e.content.style.alignItems = 'center';
                        e.content.style.justifyContent = innerAlign;
                        this._placeChild(e.iconWrap, e.content, e.lbl);
                        e.iconWrap.style.marginRight = '6px';
                        break;
                    case 'inside_left':
                        e.content.style.flexDirection = 'row';
                        e.content.style.alignItems = 'center';
                        e.content.style.justifyContent = innerAlign;
                        this._placeChild(e.lbl, e.content, e.iconWrap);
                        e.iconWrap.style.marginLeft = '6px';
                        break;
                }
            } else {
                e.content.style.flexDirection = 'row';
                e.content.style.alignItems = 'center';
                e.content.style.justifyContent = innerAlign;
                this._placeChild(e.iconWrap, e.content, e.lbl);
            }
        } else {
            this._placeChild(e.lbl, e.layout, null);
            e.content.style.flexDirection = 'row';
            this._placeChild(e.iconWrap, e.content, null);
            e.iconWrap.style.margin = '0';

            e.layout.style.display = 'flex';
            e.layout.style.alignItems = 'center';
            e.layout.style.justifyContent = c.contentAlign;

            switch (c.labelPos) {
                case 'top':
                    e.layout.style.flexDirection = 'column';
                    this._placeChild(e.lbl, e.layout, e.btn);
                    e.lbl.style.marginBottom = '8px';
                    break;
                case 'bottom':
                    e.layout.style.flexDirection = 'column';
                    this._placeChild(e.lbl, e.layout, null);
                    e.lbl.style.marginTop = '8px';
                    break;
                case 'left':
                    e.layout.style.flexDirection = 'row';
                    this._placeChild(e.lbl, e.layout, e.btn);
                    e.lbl.style.marginRight = '12px';
                    break;
                case 'right':
                    e.layout.style.flexDirection = 'row';
                    this._placeChild(e.lbl, e.layout, null);
                    e.lbl.style.marginLeft = '12px';
                    break;
            }
        }

        if (c.outlineWidth > 0 && c.style !== 'image-only') {
            e.btn.style.border = `${c.outlineWidth}px solid ${BaseWidget.colorAtOpacity(c.outlineColor, c.outlineOpacity)}`;
        } else {
            e.btn.style.border = 'none';
        }

        if (c.style === 'switch') {
            const w = 60 * s;
            const h = 32 * s;
            const k = 24 * s;

            e.btn.style.width = `${w}px`;
            e.btn.style.height = `${h}px`;
            e.btn.style.borderRadius = '99px';

            e.knob.style.display = 'block';
            e.knob.style.width = `${k}px`;
            e.knob.style.height = `${k}px`;
            e.knob.style.backgroundColor = BaseWidget.resolveCssColor(c.colThumb);
            const thumbOutW = c.thumbOutlineWidth || 0;
            if (thumbOutW > 0) {
                e.knob.style.border = thumbOutW + 'px solid ' + BaseWidget.colorAtOpacity(c.thumbOutlineColor, c.thumbOutlineOpacity);
            } else {
                e.knob.style.border = 'none';
            }
            const thumbShadows = ['0 2px 4px rgba(0,0,0,0.3)'];
            const thumbIg = BaseWidget.elementInnerGlowShadow(c.thumbInnerGlow, c.thumbInnerGlowColor, c.thumbInnerGlowOpacity);
            if (thumbIg) thumbShadows.push(thumbIg);
            e.knob.style.boxShadow = thumbShadows.join(', ');
            let offset = (h - k) / 2 - c.outlineWidth;
            if (offset < 0) offset = 0;

            e.knob.style.top = '50%';
            e.knob.style.left = `${offset}px`;

            const travel = w - h;
            e.knob.style.transform = `translate(${c.state ? travel : 0}px, -50%)`;

        } else {
            const dim = labelInside ? '100%' : `${80 * s}px`;
            e.btn.style.width = dim;
            e.btn.style.height = dim;
            e.btn.style.borderRadius = `${c.btnRadius}px`;
            e.knob.style.display = 'none';
            e.knob.style.border = 'none';
            e.knob.style.boxShadow = 'none';
        }

        if (c.deactivated) {
            const accentColor = BaseWidget.getDeactivatedColorAccent(c);
            if (c.buttonLabel) {
                e.lbl.style.display = 'block';
                e.lbl.style.color = accentColor;
            } else {
                e.lbl.style.display = 'none';
            }
            if (e.groupTitleEl) {
                if (c.label) {
                    e.groupTitleEl.style.display = 'block';
                    e.groupTitleEl.style.color = accentColor;
                } else {
                    e.groupTitleEl.style.display = 'none';
                }
            }
            if (c.style === 'switch') {
                e.knob.style.display = 'block';
                e.knob.style.backgroundColor = accentColor;
                e.knob.style.boxShadow = 'none';
                e.knob.style.border = 'none';
            }
        }

        this._applyButtonLabelHint(c);
    }

    select() {
        super.select();
        this._syncInvisibleEditorChrome();
        this._syncConfirmationDialogPreview();
    }

    deselect() {
        super.deselect();
        this._syncInvisibleEditorChrome();
        this._syncConfirmationDialogPreview();
    }
}

WidgetRegistry.register('switch', SwitchWidget);
