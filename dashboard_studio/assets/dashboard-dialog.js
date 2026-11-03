/**
 * Dashboard Dialog Box: shared canvas overlay, master defaults, and widget Confirmation Dialog schema.
 * View-mode confirmation intercepts widget actions. Master chrome is generic (info dialogs later).
 */
(function () {
    const APPEARANCE_KEYS = [
        ['message', 'dialogBoxMessage', 'Are you sure?'],
        ['confirmLabel', 'dialogBoxConfirmLabel', 'Yes'],
        ['dismissLabel', 'dialogBoxDismissLabel', 'No'],
        ['buttonColor', 'dialogBoxButtonColor', '@accent'],
        ['buttonRoundness', 'dialogBoxButtonRoundness', 12, 'defaultCornerRadius'],
        ['showButtonIcons', 'dialogBoxShowButtonIcons', false],
        ['showDialogIcon', 'dialogBoxShowDialogIcon', true],
        ['autoButtonSize', 'dialogBoxAutoButtonSize', true],
        ['buttonWidth', 'dialogBoxButtonWidth', 120],
        ['buttonHeight', 'dialogBoxButtonHeight', 40],
        ['backgroundColor', 'dialogBoxBackgroundColor', '@surface'],
        ['borderColor', 'dialogBoxBorderColor', '@borderAccent'],
        ['borderWidth', 'dialogBoxBorderWidth', 1, 'defaultBorderWidth'],
        ['borderOpacity', 'dialogBoxBorderOpacity', 100, 'defaultBorderOpacity'],
        ['cornerRadius', 'dialogBoxCornerRadius', 12, 'defaultCornerRadius'],
        ['autoDialogSize', 'dialogBoxAutoDialogSize', true],
        ['dialogWidth', 'dialogBoxDialogWidth', 360],
        ['dialogHeight', 'dialogBoxDialogHeight', 180],
        ['centerDialog', 'dialogBoxCenterDialog', true],
        ['dialogX', 'dialogBoxDialogX', 0],
        ['dialogY', 'dialogBoxDialogY', 0],
        ['modalMode', 'dialogBoxModalMode', true]
    ];

    const OWNED_MASTER_DEFAULTS = {
        dialogBoxMessage: 'Are you sure?',
        dialogBoxConfirmLabel: 'Yes',
        dialogBoxDismissLabel: 'No',
        dialogBoxButtonColor: '@accent',
        dialogBoxShowButtonIcons: false,
        dialogBoxShowDialogIcon: true,
        dialogBoxAutoButtonSize: true,
        dialogBoxButtonWidth: 120,
        dialogBoxButtonHeight: 40,
        dialogBoxBackgroundColor: '@surface',
        dialogBoxBorderColor: '@borderAccent',
        dialogBoxAutoDialogSize: true,
        dialogBoxDialogWidth: 360,
        dialogBoxDialogHeight: 180,
        dialogBoxCenterDialog: true,
        dialogBoxDialogX: 0,
        dialogBoxDialogY: 0,
        dialogBoxModalMode: true,
        dialogBoxIconConfirmSource: 'phosphor',
        dialogBoxIconConfirmBuiltin: 'ph-check',
        dialogBoxIconConfirmWeight: 'bold',
        dialogBoxIconConfirmCustomUrl: '',
        dialogBoxIconConfirmTintImage: false,
        dialogBoxIconConfirmColor: '@onAccent',
        dialogBoxIconConfirmAccentColor: '@iconAccent',
        dialogBoxIconConfirmSize: 18,
        dialogBoxIconDismissSource: 'phosphor',
        dialogBoxIconDismissBuiltin: 'ph-x',
        dialogBoxIconDismissWeight: 'bold',
        dialogBoxIconDismissCustomUrl: '',
        dialogBoxIconDismissTintImage: false,
        dialogBoxIconDismissColor: '@onAccent',
        dialogBoxIconDismissAccentColor: '@iconAccent',
        dialogBoxIconDismissSize: 18,
        dialogBoxIconDialogSize: 50
    };

    const TYPO_ROLES = [
        { nestedRole: 'confirmationDialogText', masterPrefix: 'dialogBoxText', saveRole: 'dialogText' },
        { nestedRole: 'confirmationButtonLabel', masterPrefix: 'dialogBoxButtonLabel', saveRole: 'buttonLabel' }
    ];

    const ICON_KEYMAP_CONFIRM = {
        source: 'iconSourceConfirm',
        builtin: 'iconConfirm',
        weight: 'iconWeightConfirm',
        customUrl: 'imgConfirm',
        tintImage: 'colorizeConfirm',
        color: 'iconSlotColConfirm',
        accentColor: 'iconSlotAccentConfirm',
        size: 'iconSizeConfirm'
    };
    const ICON_KEYMAP_DISMISS = {
        source: 'iconSourceDismiss',
        builtin: 'iconDismiss',
        weight: 'iconWeightDismiss',
        customUrl: 'imgDismiss',
        tintImage: 'colorizeDismiss',
        color: 'iconSlotColDismiss',
        accentColor: 'iconSlotAccentDismiss',
        size: 'iconSizeDismiss'
    };
    const ICON_KEYMAP_DIALOG = {
        source: 'iconSourceDialog',
        builtin: 'iconDialog',
        weight: 'iconWeightDialog',
        customUrl: 'imgDialog',
        tintImage: 'colorizeDialog',
        color: 'iconSlotColDialog',
        accentColor: 'iconSlotAccentDialog',
        size: 'iconSizeDialog'
    };

    const MASTER_ICON_KEYMAP_CONFIRM = {
        source: 'dialogBoxIconConfirmSource',
        builtin: 'dialogBoxIconConfirmBuiltin',
        weight: 'dialogBoxIconConfirmWeight',
        customUrl: 'dialogBoxIconConfirmCustomUrl',
        tintImage: 'dialogBoxIconConfirmTintImage',
        color: 'dialogBoxIconConfirmColor',
        accentColor: 'dialogBoxIconConfirmAccentColor',
        size: 'dialogBoxIconConfirmSize'
    };
    const MASTER_ICON_KEYMAP_DISMISS = {
        source: 'dialogBoxIconDismissSource',
        builtin: 'dialogBoxIconDismissBuiltin',
        weight: 'dialogBoxIconDismissWeight',
        customUrl: 'dialogBoxIconDismissCustomUrl',
        tintImage: 'dialogBoxIconDismissTintImage',
        color: 'dialogBoxIconDismissColor',
        accentColor: 'dialogBoxIconDismissAccentColor',
        size: 'dialogBoxIconDismissSize'
    };
    const MASTER_ICON_KEYMAP_DIALOG = {
        source: 'dialogBoxIconDialogSource',
        builtin: 'dialogBoxIconDialogBuiltin',
        weight: 'dialogBoxIconDialogWeight',
        customUrl: 'dialogBoxIconDialogCustomUrl',
        tintImage: 'dialogBoxIconDialogTintImage',
        color: 'dialogBoxIconDialogColor',
        accentColor: 'dialogBoxIconDialogAccentColor',
        size: 'dialogBoxIconDialogSize'
    };

    const FACTORY_ICON_CONFIRM = { source: 'phosphor', builtin: 'ph-check', weight: 'bold', size: 18, color: '@onAccent' };
    const FACTORY_ICON_DISMISS = { source: 'phosphor', builtin: 'ph-x', weight: 'bold', size: 18, color: '@onAccent' };
    const FACTORY_ICON_DIALOG_SIZE = 50;

    const ICON_NEST_MAPS = {
        confirmationConfirm: {
            iconSourceConfirm: 'source',
            iconConfirm: 'builtin',
            iconWeightConfirm: 'weight',
            imgConfirm: 'customUrl',
            colorizeConfirm: 'tintImage',
            iconSlotColConfirm: 'color',
            iconSlotAccentConfirm: 'accentColor',
            iconSizeConfirm: 'size'
        },
        confirmationDismiss: {
            iconSourceDismiss: 'source',
            iconDismiss: 'builtin',
            iconWeightDismiss: 'weight',
            imgDismiss: 'customUrl',
            colorizeDismiss: 'tintImage',
            iconSlotColDismiss: 'color',
            iconSlotAccentDismiss: 'accentColor',
            iconSizeDismiss: 'size'
        },
        confirmationDialog: {
            iconSourceDialog: 'source',
            iconDialog: 'builtin',
            iconWeightDialog: 'weight',
            imgDialog: 'customUrl',
            colorizeDialog: 'tintImage',
            iconSlotColDialog: 'color',
            iconSlotAccentDialog: 'accentColor',
            iconSizeDialog: 'size'
        }
    };

    const RESIZE_EDGES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

    function masterBag() {
        return (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS) ? MASTER_SETTINGS : {};
    }

    function hasOwn(obj, key) {
        return !!(obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key));
    }

    function isEmptyVal(v) {
        return v === undefined || v === null || v === '';
    }

    function coerceBool(v, fallback) {
        if (v === true || v === false) return v;
        if (v === undefined || v === null || v === '') return fallback === true;
        const s = String(v).toLowerCase().trim();
        if (s === 'true' || s === '1' || s === 'on') return true;
        if (s === 'false' || s === '0' || s === 'off') return false;
        return fallback === true;
    }

    function coerceNumber(v, fallback) {
        if (v === undefined || v === null || v === '') return fallback;
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
    }

    function isResponsiveColumns() {
        return typeof BaseWidget !== 'undefined'
            && typeof BaseWidget.isResponsiveMode === 'function'
            && BaseWidget.isResponsiveMode();
    }

    function pickAppearance(blob, prop, masterKey, fallback, inheritKey) {
        if (hasOwn(blob, prop) && !isEmptyVal(blob[prop])) {
            return blob[prop];
        }
        const M = masterBag();
        if (!isEmptyVal(M[masterKey])) return M[masterKey];
        if (inheritKey && !isEmptyVal(M[inheritKey])) return M[inheritKey];
        return fallback;
    }

    function pickBool(blob, prop, masterKey, fallback) {
        if (hasOwn(blob, prop) && !isEmptyVal(blob[prop])) {
            return coerceBool(blob[prop], fallback);
        }
        const M = masterBag();
        if (hasOwn(M, masterKey) && !isEmptyVal(M[masterKey])) {
            return coerceBool(M[masterKey], fallback);
        }
        return fallback === true;
    }

    function pickNumber(blob, prop, masterKey, fallback, inheritKey) {
        if (hasOwn(blob, prop) && !isEmptyVal(blob[prop])) {
            return coerceNumber(blob[prop], fallback);
        }
        const M = masterBag();
        if (hasOwn(M, masterKey) && !isEmptyVal(M[masterKey])) {
            return coerceNumber(M[masterKey], fallback);
        }
        if (inheritKey && hasOwn(M, inheritKey) && !isEmptyVal(M[inheritKey])) {
            return coerceNumber(M[inheritKey], fallback);
        }
        return fallback;
    }

    function confirmationBlob(widget) {
        const o = widget && widget.overrides;
        const b = o && o.confirmationDialog;
        return (b && typeof b === 'object') ? b : {};
    }

    /**
     * Live topic for one Confirmation Dialog field.
     * Bindings are stored as bindings.confirmationDialog.<prop>, not as flat config keys,
     * so the static blob / master default never see them unless this overlay runs.
     */
    function readLiveConfirmationValue(widget, prop, configKey) {
        if (!widget || typeof BindingsTree === 'undefined' || typeof BindingsTree.getAtPath !== 'function') {
            return undefined;
        }
        if (typeof Dashboard === 'undefined' || !Dashboard.liveData) return undefined;
        const topic = BindingsTree.getAtPath(widget.bindings, ['confirmationDialog', prop]);
        if (typeof topic !== 'string' || topic === '') return undefined;
        if (Dashboard.liveData[topic] === undefined) return undefined;
        let value = Dashboard.liveData[topic];
        if (widget.overrides && typeof widget._finalizeBindingValue === 'function') {
            value = widget._finalizeBindingValue(configKey, value);
        }
        return value;
    }

    function writeLiveConfirmationValue(target, key, value, fallback) {
        if (!target || value === undefined || value === null) return;
        if (typeof fallback === 'boolean') target[key] = coerceBool(value, fallback);
        else if (typeof fallback === 'number') target[key] = coerceNumber(value, fallback);
        else target[key] = value;
    }

    function applyLiveConfirmationBindings(widget, target, useMasterKeys) {
        if (!widget || !target) return;
        const bindings = widget.bindings && widget.bindings.confirmationDialog;
        if (!bindings || typeof bindings !== 'object') return;
        const keyOf = function (row) {
            return useMasterKeys ? row[1] : row[0];
        };
        APPEARANCE_KEYS.forEach(function (row) {
            const live = readLiveConfirmationValue(widget, row[0], row[1]);
            writeLiveConfirmationValue(target, keyOf(row), live, row[2]);
        });
        const liveOff = readLiveConfirmationValue(widget, 'confirmWhenTurningOff', 'confirmWhenTurningOff');
        if (liveOff !== undefined && liveOff !== null) {
            target.confirmWhenTurningOff = coerceBool(liveOff, false);
        }
        const livePreview = readLiveConfirmationValue(widget, 'previewInEditMode', 'previewInEditMode');
        if (livePreview !== undefined && livePreview !== null) {
            target.previewInEditMode = coerceBool(livePreview, false);
        }
        const liveGesture = readLiveConfirmationValue(widget, 'confirmGesture', 'confirmGesture');
        if (typeof liveGesture === 'string'
                && (liveGesture === 'hold' || liveGesture === 'tap' || liveGesture === 'both')) {
            target.confirmGesture = liveGesture;
        }
    }

    function resolvedFlagFromValues(values, blobProp, masterKey, factory) {
        const blob = (values && values.confirmationDialog && typeof values.confirmationDialog === 'object')
            ? values.confirmationDialog
            : {};
        if (hasOwn(blob, blobProp) && !isEmptyVal(blob[blobProp])) {
            return coerceBool(blob[blobProp], factory);
        }
        if (values && hasOwn(values, masterKey) && !isEmptyVal(values[masterKey])) {
            return coerceBool(values[masterKey], factory);
        }
        const M = masterBag();
        if (hasOwn(M, masterKey) && !isEmptyVal(M[masterKey])) {
            return coerceBool(M[masterKey], factory);
        }
        return factory === true;
    }

    function hasIconVal(key, v) {
        if (v === undefined || v === null) return false;
        if (key === 'tintImage') return v === true || v === false;
        if (v === '') return false;
        return true;
    }

    function overlayIconSlot(target, src) {
        if (!src || typeof src !== 'object') return target;
        Object.keys(src).forEach(function (k) {
            if (hasIconVal(k, src[k])) target[k] = src[k];
        });
        return target;
    }

    function iconSlotFromKeyMap(bag, keymap) {
        const out = {};
        if (!bag || !keymap) return out;
        Object.keys(keymap).forEach(function (logical) {
            const flatKey = keymap[logical];
            if (hasIconVal(logical, bag[flatKey])) out[logical] = bag[flatKey];
        });
        return out;
    }

    function inheritDialogIconBase() {
        const M = masterBag();
        return {
            source: M.defaultIconWidgetSource || 'phosphor',
            builtin: M.defaultIconWidgetBuiltin || 'ph-warning',
            weight: M.defaultIconWidgetWeight || 'fill',
            customUrl: M.defaultIconWidgetCustomUrl || '',
            tintImage: M.defaultIconWidgetTintImage === true,
            color: M.iconInactive || '@icon',
            accentColor: M.defaultIconWidgetAccentColor || '@iconAccent',
            size: FACTORY_ICON_DIALOG_SIZE
        };
    }

    function attachObjectNested(fields, isWidget) {
        if (!isWidget || !Array.isArray(fields)) return;
        fields.forEach(function (f) {
            if (!f || !f.objectNestedProp) return;
            f.objectNested = { root: 'confirmationDialog', prop: f.objectNestedProp };
            delete f.objectNestedProp;
        });
    }

    function applyIconFieldDefaults(group, keymap, spec) {
        if (!group || !Array.isArray(group.fields) || !keymap || !spec) return;
        group.fields.forEach(function (f) {
            if (!f) return;
            Object.keys(keymap).forEach(function (logical) {
                if (f.key !== keymap[logical]) return;
                const d = spec[logical];
                if (!d) return;
                if (d.defaultKey) f.defaultKey = d.defaultKey;
                if (d.defaultKeyFallback) f.defaultKeyFallback = d.defaultKeyFallback;
            });
        });
    }

    function attachTypoFallbacks(group, fallbacks) {
        if (!group || !Array.isArray(group.fields) || !fallbacks) return;
        group.fields.forEach(function (f) {
            if (!f || !fallbacks[f.key]) return;
            f.defaultKeyFallback = fallbacks[f.key];
        });
    }

    function appearanceFields(options) {
        const isWidget = options && options.widget === true;
        const label = function (masterLabel, widgetLabel) {
            return isWidget ? widgetLabel : masterLabel;
        };
        const nest = function (prop) {
            return isWidget ? { objectNestedProp: prop } : {};
        };
        const ownedDk = function (key) {
            return isWidget ? { defaultKey: key } : {};
        };
        const inheritDk = function (masterKey, inheritKey) {
            if (isWidget) return { defaultKey: masterKey, defaultKeyFallback: inheritKey };
            return inheritKey ? { defaultKey: inheritKey } : {};
        };
        const reqOn = function (values) {
            return !isWidget || values.requireConfirmation === true;
        };
        const showBtnSize = function (values) {
            if (isWidget && values.requireConfirmation !== true) return false;
            return resolvedFlagFromValues(values, 'autoButtonSize', 'dialogBoxAutoButtonSize', true) !== true;
        };
        const showDlgSize = function (values) {
            if (isWidget && values.requireConfirmation !== true) return false;
            return resolvedFlagFromValues(values, 'autoDialogSize', 'dialogBoxAutoDialogSize', true) !== true;
        };
        const showCenter = function (values) {
            if (isResponsiveColumns()) return false;
            if (isWidget && values.requireConfirmation !== true) return false;
            return true;
        };
        const showPos = function (values) {
            if (isResponsiveColumns()) return false;
            if (isWidget && values.requireConfirmation !== true) return false;
            return resolvedFlagFromValues(values, 'centerDialog', 'dialogBoxCenterDialog', true) !== true;
        };
        const showConfirmOff = function (values) {
            if (!isWidget) return false;
            if (values.requireConfirmation !== true) return false;
            const mode = values.mode || values.defaultSwitchMode || 'toggle';
            return String(mode) === 'toggle';
        };

        // Only show the Confirm With selector when the widget mixes Hold to Activate
        // on and off across its primary output and additional output topics.
        const hasMixedHoldToActivate = function (values) {
            if (!isWidget || !values) return false;
            const flags = [];
            flags.push(values.holdToActivate === true);
            const extras = values.extraOutputTopics;
            if (Array.isArray(extras)) {
                for (let i = 0; i < extras.length; i++) {
                    const e = extras[i];
                    if (e && typeof e === 'object') flags.push(e.holdToActivate === true);
                }
            }
            let hasTrue = false;
            let hasFalse = false;
            for (let i = 0; i < flags.length; i++) {
                if (flags[i]) hasTrue = true;
                else hasFalse = true;
            }
            return hasTrue && hasFalse;
        };

        const showConfirmGesture = function (values) {
            if (!isWidget) return false;
            if (values.requireConfirmation !== true) return false;
            return hasMixedHoldToActivate(values);
        };

        const fields = [];
        if (isWidget) {
            fields.push(Object.assign({
                key: 'previewInEditMode',
                type: 'checkbox',
                label: 'Preview in Edit Mode',
                cols: 12,
                default: false,
                dependsOn: ['requireConfirmation'],
                visibleWhen: reqOn,
                hint: 'Shows the dialog on the canvas while this widget is selected. Confirm and Dismiss do not run the action. Drag to move, or use the handles to resize.'
            }, nest('previewInEditMode')));
        }
        fields.push(Object.assign({
            key: 'dialogBoxMessage',
            type: 'textarea',
            label: label('Message', 'Confirmation Message'),
            cols: 12,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('message'), ownedDk('dialogBoxMessage')));
        fields.push(Object.assign({
            key: 'dialogBoxConfirmLabel',
            type: 'text',
            label: label('Confirm Label', 'Confirmation Confirm Label'),
            cols: 6,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('confirmLabel'), ownedDk('dialogBoxConfirmLabel')));
        fields.push(Object.assign({
            key: 'dialogBoxDismissLabel',
            type: 'text',
            label: label('Dismiss Label', 'Confirmation Dismiss Label'),
            cols: 6,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('dismissLabel'), ownedDk('dialogBoxDismissLabel')));
        if (isWidget) {
            fields.push(Object.assign({
                key: 'confirmWhenTurningOff',
                type: 'checkbox',
                label: 'Confirm When Turning Off',
                cols: 12,
                default: false,
                dependsOn: ['requireConfirmation', 'mode'],
                visibleWhen: showConfirmOff,
                hint: 'When off, turning the switch off runs immediately. When on, both On and Off wait for this dialog.'
            }, nest('confirmWhenTurningOff')));
            fields.push(Object.assign({
                key: 'confirmGesture',
                type: 'select',
                label: 'Confirm With',
                cols: 12,
                default: 'both',
                options: [
                    { value: 'hold', text: 'Hold to Activate' },
                    { value: 'tap', text: 'Tap to Activate' },
                    { value: 'both', text: 'Hold and Tap' }
                ],
                dependsOn: ['requireConfirmation', 'holdToActivate', 'extraOutputTopics'],
                visibleWhen: showConfirmGesture,
                hint: 'Choose which press gesture opens this confirmation dialog. Only visible when some outputs use Hold to Activate and others do not.'
            }, nest('confirmGesture')));
        }
        fields.push(Object.assign({
            key: 'dialogBoxButtonColor',
            type: 'color',
            label: 'Button Color',
            cols: 6,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('buttonColor'), ownedDk('dialogBoxButtonColor')));
        fields.push(Object.assign({
            key: 'dialogBoxButtonRoundness',
            type: 'number',
            label: 'Button Roundness',
            cols: 6,
            min: 0,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('buttonRoundness'), inheritDk('dialogBoxButtonRoundness', 'defaultCornerRadius')));
        fields.push(Object.assign({
            key: 'dialogBoxShowButtonIcons',
            type: 'checkbox',
            label: 'Show Button Icons',
            cols: 6,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('showButtonIcons'), ownedDk('dialogBoxShowButtonIcons')));
        fields.push(Object.assign({
            key: 'dialogBoxShowDialogIcon',
            type: 'checkbox',
            label: 'Show Dialog Icon',
            cols: 6,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('showDialogIcon'), ownedDk('dialogBoxShowDialogIcon')));
        fields.push(Object.assign({
            key: 'dialogBoxAutoButtonSize',
            type: 'checkbox',
            label: 'Auto Button Size',
            cols: 4,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('autoButtonSize'), ownedDk('dialogBoxAutoButtonSize')));
        fields.push(Object.assign({
            key: 'dialogBoxButtonWidth',
            type: 'number',
            label: 'Button Width',
            cols: 4,
            min: 1,
            dependsOn: isWidget ? ['requireConfirmation', 'dialogBoxAutoButtonSize'] : ['dialogBoxAutoButtonSize'],
            visibleWhen: showBtnSize
        }, nest('buttonWidth'), ownedDk('dialogBoxButtonWidth')));
        fields.push(Object.assign({
            key: 'dialogBoxButtonHeight',
            type: 'number',
            label: 'Button Height',
            cols: 4,
            min: 1,
            dependsOn: isWidget ? ['requireConfirmation', 'dialogBoxAutoButtonSize'] : ['dialogBoxAutoButtonSize'],
            visibleWhen: showBtnSize
        }, nest('buttonHeight'), ownedDk('dialogBoxButtonHeight')));
        fields.push(Object.assign({
            key: 'dialogBoxBackgroundColor',
            type: 'color',
            label: 'Background Color',
            cols: 6,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('backgroundColor'), ownedDk('dialogBoxBackgroundColor')));
        fields.push(Object.assign({
            key: 'dialogBoxCornerRadius',
            type: 'number',
            label: 'Corner Radius',
            cols: 6,
            min: 0,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('cornerRadius'), inheritDk('dialogBoxCornerRadius', 'defaultCornerRadius')));
        fields.push(Object.assign({
            key: 'dialogBoxBorderColor',
            type: 'color',
            label: 'Border Color',
            cols: 4,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('borderColor'), ownedDk('dialogBoxBorderColor')));
        fields.push(Object.assign({
            key: 'dialogBoxBorderWidth',
            type: 'number',
            label: 'Border Width',
            cols: 4,
            min: 0,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('borderWidth'), inheritDk('dialogBoxBorderWidth', 'defaultBorderWidth')));
        fields.push(Object.assign({
            key: 'dialogBoxBorderOpacity',
            type: 'number',
            label: 'Border Opacity',
            cols: 4,
            min: 0,
            max: 100,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('borderOpacity'), inheritDk('dialogBoxBorderOpacity', 'defaultBorderOpacity')));
        fields.push(Object.assign({
            key: 'dialogBoxAutoDialogSize',
            type: 'checkbox',
            label: 'Auto Dialog Size',
            cols: 4,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined
        }, nest('autoDialogSize'), ownedDk('dialogBoxAutoDialogSize')));
        fields.push(Object.assign({
            key: 'dialogBoxDialogWidth',
            type: 'number',
            label: 'Dialog Width',
            cols: 4,
            min: 1,
            dependsOn: isWidget ? ['requireConfirmation', 'dialogBoxAutoDialogSize'] : ['dialogBoxAutoDialogSize'],
            visibleWhen: showDlgSize
        }, nest('dialogWidth'), ownedDk('dialogBoxDialogWidth')));
        fields.push(Object.assign({
            key: 'dialogBoxDialogHeight',
            type: 'number',
            label: 'Dialog Height',
            cols: 4,
            min: 1,
            dependsOn: isWidget ? ['requireConfirmation', 'dialogBoxAutoDialogSize'] : ['dialogBoxAutoDialogSize'],
            visibleWhen: showDlgSize
        }, nest('dialogHeight'), ownedDk('dialogBoxDialogHeight')));
        fields.push(Object.assign({
            key: 'dialogBoxCenterDialog',
            type: 'checkbox',
            label: 'Center Dialog',
            cols: 4,
            dependsOn: isWidget ? ['requireConfirmation'] : ['layoutMode'],
            visibleWhen: showCenter
        }, nest('centerDialog'), ownedDk('dialogBoxCenterDialog')));
        fields.push(Object.assign({
            key: 'dialogBoxDialogX',
            type: 'number',
            label: 'Dialog X Position',
            cols: 4,
            dependsOn: isWidget ? ['requireConfirmation', 'dialogBoxCenterDialog'] : ['dialogBoxCenterDialog'],
            visibleWhen: showPos
        }, nest('dialogX'), ownedDk('dialogBoxDialogX')));
        fields.push(Object.assign({
            key: 'dialogBoxDialogY',
            type: 'number',
            label: 'Dialog Y Position',
            cols: 4,
            dependsOn: isWidget ? ['requireConfirmation', 'dialogBoxCenterDialog'] : ['dialogBoxCenterDialog'],
            visibleWhen: showPos
        }, nest('dialogY'), ownedDk('dialogBoxDialogY')));
        fields.push(Object.assign({
            key: 'dialogBoxModalMode',
            type: 'checkbox',
            label: 'Modal Mode',
            cols: 12,
            dependsOn: isWidget ? ['requireConfirmation'] : undefined,
            visibleWhen: isWidget ? reqOn : undefined,
            hint: 'In view mode, locks the canvas behind the dialog and blurs it. Preview in Edit Mode stays interactive so you can still select widgets.'
        }, nest('modalMode'), ownedDk('dialogBoxModalMode')));

        attachObjectNested(fields, isWidget);
        return fields;
    }

    function typographyGroups(options) {
        const isWidget = options && options.widget === true;
        if (typeof BaseWidget === 'undefined' || typeof BaseWidget.getTypographySchema !== 'function') {
            return [];
        }
        const common = {
            fontDefaultKey: isWidget ? 'dialogBoxTextFont' : 'labelDefaultFont',
            fontDefaultKeyFallback: isWidget ? 'labelDefaultFont' : 'fontFamily',
            fontSizeDefaultKey: isWidget ? 'dialogBoxTextFs' : 'labelDefaultFs',
            alignDefaultKey: isWidget ? 'dialogBoxTextAlign' : 'labelDefaultAlign',
            caseDefaultKey: isWidget ? 'dialogBoxTextCase' : 'labelDefaultCase',
            boldDefaultKey: isWidget ? 'dialogBoxTextBold' : 'labelDefaultBold',
            italicDefaultKey: isWidget ? 'dialogBoxTextItalic' : 'labelDefaultItalic',
            colorDefaultKey: isWidget ? 'dialogBoxTextCol' : 'labelDefaultCol',
            opacityDefaultKey: isWidget ? 'dialogBoxTextOpacity' : 'labelDefaultOpacity',
            offXDefaultKey: isWidget ? 'dialogBoxTextOffX' : 'labelDefaultOffX',
            offYDefaultKey: isWidget ? 'dialogBoxTextOffY' : 'labelDefaultOffY'
        };
        const btnCommon = {
            fontDefaultKey: isWidget ? 'dialogBoxButtonLabelFont' : 'switchButtonInsideDefaultFont',
            fontDefaultKeyFallback: 'fontFamily',
            fontSizeDefaultKey: isWidget ? 'dialogBoxButtonLabelFs' : 'switchButtonInsideDefaultFs',
            alignDefaultKey: isWidget ? 'dialogBoxButtonLabelAlign' : 'switchButtonInsideDefaultAlign',
            caseDefaultKey: isWidget ? 'dialogBoxButtonLabelCase' : 'switchButtonInsideDefaultCase',
            boldDefaultKey: isWidget ? 'dialogBoxButtonLabelBold' : 'switchButtonInsideDefaultBold',
            italicDefaultKey: isWidget ? 'dialogBoxButtonLabelItalic' : 'switchButtonInsideDefaultItalic',
            colorDefaultKey: isWidget ? 'dialogBoxButtonLabelCol' : 'switchButtonInsideDefaultCol',
            opacityDefaultKey: isWidget ? 'dialogBoxButtonLabelOpacity' : 'switchButtonInsideDefaultOpacity',
            offXDefaultKey: isWidget ? 'dialogBoxButtonLabelOffX' : 'switchButtonInsideDefaultOffX',
            offYDefaultKey: isWidget ? 'dialogBoxButtonLabelOffY' : 'switchButtonInsideDefaultOffY'
        };
        if (isWidget) {
            common.nestedTypography = { root: 'typography', role: 'confirmationDialogText' };
            common.groupVisibleWhen = function (values) { return values.requireConfirmation === true; };
            common.groupDependsOn = ['requireConfirmation'];
            btnCommon.nestedTypography = { root: 'typography', role: 'confirmationButtonLabel' };
            btnCommon.groupVisibleWhen = function (values) { return values.requireConfirmation === true; };
            btnCommon.groupDependsOn = ['requireConfirmation'];
        }
        const textGroup = BaseWidget.getTypographySchema(
            'dialogBoxText',
            isWidget ? 'Confirmation Dialog Text' : 'Dialog Text',
            common
        );
        const btnGroup = BaseWidget.getTypographySchema(
            'dialogBoxButtonLabel',
            isWidget ? 'Confirmation Button Label' : 'Button Label',
            btnCommon
        );
        if (isWidget) {
            attachTypoFallbacks(textGroup, {
                dialogBoxTextFont: 'labelDefaultFont',
                dialogBoxTextFs: 'labelDefaultFs',
                dialogBoxTextAlign: 'labelDefaultAlign',
                dialogBoxTextCase: 'labelDefaultCase',
                dialogBoxTextBold: 'labelDefaultBold',
                dialogBoxTextItalic: 'labelDefaultItalic',
                dialogBoxTextCol: 'labelDefaultCol',
                dialogBoxTextOpacity: 'labelDefaultOpacity',
                dialogBoxTextOffX: 'labelDefaultOffX',
                dialogBoxTextOffY: 'labelDefaultOffY'
            });
            attachTypoFallbacks(btnGroup, {
                dialogBoxButtonLabelFont: 'fontFamily',
                dialogBoxButtonLabelFs: 'switchButtonInsideDefaultFs',
                dialogBoxButtonLabelAlign: 'switchButtonInsideDefaultAlign',
                dialogBoxButtonLabelCase: 'switchButtonInsideDefaultCase',
                dialogBoxButtonLabelBold: 'switchButtonInsideDefaultBold',
                dialogBoxButtonLabelItalic: 'switchButtonInsideDefaultItalic',
                dialogBoxButtonLabelCol: 'switchButtonInsideDefaultCol',
                dialogBoxButtonLabelOpacity: 'switchButtonInsideDefaultOpacity',
                dialogBoxButtonLabelOffX: 'switchButtonInsideDefaultOffX',
                dialogBoxButtonLabelOffY: 'switchButtonInsideDefaultOffY'
            });
        }
        return [textGroup, btnGroup];
    }

    function masterIconGroups() {
        if (typeof BaseWidget === 'undefined' || typeof BaseWidget.getIconStyleSchema !== 'function') {
            return [];
        }
        const showBtn = function (values) {
            return resolvedFlagFromValues(values, 'showButtonIcons', 'dialogBoxShowButtonIcons', false) === true;
        };
        const showDlg = function (values) {
            return resolvedFlagFromValues(values, 'showDialogIcon', 'dialogBoxShowDialogIcon', true) === true;
        };
        const gDialog = BaseWidget.getIconStyleSchema('Dialog Icon', MASTER_ICON_KEYMAP_DIALOG, {
            pairWeightAndSize: true,
            exclude: ['hoverColor']
        });
        const gConfirm = BaseWidget.getIconStyleSchema('Confirm Icon', MASTER_ICON_KEYMAP_CONFIRM, {
            headerSuffix: 'Dialog Button',
            pairWeightAndSize: true,
            exclude: ['hoverColor']
        });
        const gDismiss = BaseWidget.getIconStyleSchema('Dismiss Icon', MASTER_ICON_KEYMAP_DISMISS, {
            headerSuffix: 'Dialog Button',
            pairWeightAndSize: true,
            exclude: ['hoverColor']
        });
        applyIconFieldDefaults(gDialog, MASTER_ICON_KEYMAP_DIALOG, {
            source: { defaultKey: 'defaultIconWidgetSource' },
            builtin: { defaultKey: 'defaultIconWidgetBuiltin' },
            weight: { defaultKey: 'defaultIconWidgetWeight' },
            customUrl: { defaultKey: 'defaultIconWidgetCustomUrl' },
            tintImage: { defaultKey: 'defaultIconWidgetTintImage' },
            color: { defaultKey: 'iconInactive' },
            accentColor: { defaultKey: 'defaultIconWidgetAccentColor' }
        });
        gDialog.visibleWhen = showDlg;
        gDialog.dependsOn = ['dialogBoxShowDialogIcon'];
        gConfirm.visibleWhen = showBtn;
        gConfirm.dependsOn = ['dialogBoxShowButtonIcons'];
        gDismiss.visibleWhen = showBtn;
        gDismiss.dependsOn = ['dialogBoxShowButtonIcons'];
        return [gDialog, gConfirm, gDismiss];
    }

    const DashboardDialog = {
        ICON_KEYMAP_CONFIRM: ICON_KEYMAP_CONFIRM,
        ICON_KEYMAP_DISMISS: ICON_KEYMAP_DISMISS,
        ICON_KEYMAP_DIALOG: ICON_KEYMAP_DIALOG,
        FACTORY_ICON_CONFIRM: FACTORY_ICON_CONFIRM,
        FACTORY_ICON_DISMISS: FACTORY_ICON_DISMISS,
        TYPO_ROLES: TYPO_ROLES,

        _root: null,
        _mode: null,
        _widgetId: null,
        _runFn: null,
        _onKey: null,
        _previewBinds: null,
        _previewBindWidgetId: null,
        _dragLive: null,

        ensureMasterDefaults: function () {
            const M = masterBag();
            Object.keys(OWNED_MASTER_DEFAULTS).forEach(function (key) {
                if (isEmptyVal(M[key])) M[key] = OWNED_MASTER_DEFAULTS[key];
            });
        },

        factoryAppearance: function () {
            const out = {};
            Object.keys(OWNED_MASTER_DEFAULTS).forEach(function (key) {
                out[key] = OWNED_MASTER_DEFAULTS[key];
            });
            return out;
        },

        resolve: function (widget) {
            const blob = confirmationBlob(widget);
            const resolved = {};
            APPEARANCE_KEYS.forEach(function (row) {
                const prop = row[0];
                const masterKey = row[1];
                const fallback = row[2];
                const inheritKey = row[3];
                if (typeof fallback === 'boolean') {
                    resolved[prop] = pickBool(blob, prop, masterKey, fallback);
                } else if (typeof fallback === 'number') {
                    resolved[prop] = pickNumber(blob, prop, masterKey, fallback, inheritKey);
                } else {
                    resolved[prop] = pickAppearance(blob, prop, masterKey, fallback, inheritKey);
                }
            });
            resolved.previewInEditMode = coerceBool(blob.previewInEditMode, false);
            resolved.confirmWhenTurningOff = coerceBool(blob.confirmWhenTurningOff, false);
            resolved.confirmGesture = (typeof blob.confirmGesture === 'string'
                && (blob.confirmGesture === 'hold' || blob.confirmGesture === 'tap' || blob.confirmGesture === 'both'))
                ? blob.confirmGesture
                : 'both';
            const o = (widget && widget.overrides) || {};
            resolved.requireConfirmation = o.requireConfirmation === true;
            const icons = (o.icons && typeof o.icons === 'object') ? o.icons : {};
            const M = masterBag();
            resolved.iconConfirm = overlayIconSlot(
                overlayIconSlot(Object.assign({}, FACTORY_ICON_CONFIRM), iconSlotFromKeyMap(M, MASTER_ICON_KEYMAP_CONFIRM)),
                icons.confirmationConfirm
            );
            resolved.iconDismiss = overlayIconSlot(
                overlayIconSlot(Object.assign({}, FACTORY_ICON_DISMISS), iconSlotFromKeyMap(M, MASTER_ICON_KEYMAP_DISMISS)),
                icons.confirmationDismiss
            );
            resolved.iconDialog = overlayIconSlot(
                overlayIconSlot(inheritDialogIconBase(), iconSlotFromKeyMap(M, MASTER_ICON_KEYMAP_DIALOG)),
                icons.confirmationDialog
            );
            resolved.typoMessage = DashboardDialog._typoConfig('confirmationDialogText', 'dialogBoxText', o, {
                Font: ['labelDefaultFont', 'fontFamily'],
                Fs: 'labelDefaultFs',
                Align: 'labelDefaultAlign',
                Case: 'labelDefaultCase',
                Bold: 'labelDefaultBold',
                Italic: 'labelDefaultItalic',
                Col: 'labelDefaultCol',
                Opacity: 'labelDefaultOpacity',
                OffX: 'labelDefaultOffX',
                OffY: 'labelDefaultOffY'
            }, {
                Font: "'Inter', sans-serif",
                Fs: 12,
                Align: 'left',
                Case: 'none',
                Bold: false,
                Italic: false,
                Col: '@onSurface',
                Opacity: 100,
                OffX: 0,
                OffY: 0
            });
            resolved.typoButton = DashboardDialog._typoConfig('confirmationButtonLabel', 'dialogBoxButtonLabel', o, {
                Font: 'fontFamily',
                Fs: 'switchButtonInsideDefaultFs',
                Align: 'switchButtonInsideDefaultAlign',
                Case: 'switchButtonInsideDefaultCase',
                Bold: 'switchButtonInsideDefaultBold',
                Italic: 'switchButtonInsideDefaultItalic',
                Col: 'switchButtonInsideDefaultCol',
                Opacity: 'switchButtonInsideDefaultOpacity',
                OffX: 'switchButtonInsideDefaultOffX',
                OffY: 'switchButtonInsideDefaultOffY'
            }, {
                Font: "'Inter', sans-serif",
                Fs: 12,
                Align: 'center',
                Case: 'capitalize',
                Bold: false,
                Italic: false,
                Col: '@onAccent',
                Opacity: 100,
                OffX: 0,
                OffY: 0
            });
            applyLiveConfirmationBindings(widget, resolved, false);
            return resolved;
        },

        /** Copy live Confirmation Dialog bindings onto flat config keys (dialogBoxMessage, flags). */
        applyLiveBindingsToConfig: function (widget, config) {
            applyLiveConfirmationBindings(widget, config, true);
        },

        /** Repaint an open confirm dialog when its widget receives a new topic value. */
        refreshOpen: function (widget) {
            if (!widget || this._mode !== 'confirm' || this._widgetId !== widget.id) return;
            this._paint(widget, { mode: 'confirm' });
        },

        _typoConfig: function (nestedRole, prefix, overrides, inheritKeys, fallbacks) {
            const M = masterBag();
            const c = {};
            const apply = function (nestedProp, suffix) {
                const nested = overrides && overrides.typography && overrides.typography[nestedRole];
                if (nested && hasOwn(nested, nestedProp) && !isEmptyVal(nested[nestedProp])) {
                    c[prefix + suffix] = nested[nestedProp];
                    return;
                }
                const mk = prefix + suffix;
                if (!isEmptyVal(M[mk])) {
                    c[mk] = M[mk];
                    return;
                }
                const inheritRaw = inheritKeys && inheritKeys[suffix];
                const inheritList = Array.isArray(inheritRaw) ? inheritRaw : (inheritRaw ? [inheritRaw] : []);
                for (let i = 0; i < inheritList.length; i++) {
                    const inheritKey = inheritList[i];
                    if (inheritKey && M[inheritKey] !== undefined && M[inheritKey] !== null && M[inheritKey] !== '') {
                        c[mk] = M[inheritKey];
                        return;
                    }
                }
                if (fallbacks && fallbacks[suffix] !== undefined) c[mk] = fallbacks[suffix];
            };
            apply('fontFamily', 'Font');
            apply('fontSize', 'Fs');
            apply('textAlign', 'Align');
            apply('textTransform', 'Case');
            apply('bold', 'Bold');
            apply('italic', 'Italic');
            apply('color', 'Col');
            apply('opacity', 'Opacity');
            apply('offsetX', 'OffX');
            apply('offsetY', 'OffY');
            return c;
        },

        applyNestedToConfig: function (c, overrides) {
            if (!c) return;
            const blob = (overrides && overrides.confirmationDialog && typeof overrides.confirmationDialog === 'object')
                ? overrides.confirmationDialog
                : {};
            APPEARANCE_KEYS.forEach(function (row) {
                const prop = row[0];
                const masterKey = row[1];
                const fallback = row[2];
                if (hasOwn(blob, prop) && !isEmptyVal(blob[prop])) {
                    if (typeof fallback === 'boolean') c[masterKey] = coerceBool(blob[prop], fallback);
                    else if (typeof fallback === 'number') c[masterKey] = coerceNumber(blob[prop], fallback);
                    else c[masterKey] = blob[prop];
                }
            });
            c.previewInEditMode = coerceBool(blob.previewInEditMode, false);
            c.confirmWhenTurningOff = coerceBool(blob.confirmWhenTurningOff, false);
            c.confirmGesture = (typeof blob.confirmGesture === 'string'
                && (blob.confirmGesture === 'hold' || blob.confirmGesture === 'tap' || blob.confirmGesture === 'both'))
                ? blob.confirmGesture
                : 'both';
            const icons = (overrides && overrides.icons && typeof overrides.icons === 'object') ? overrides.icons : {};
            if (typeof BaseWidget !== 'undefined' && BaseWidget.flattenNestedIconSlotToKeyMap) {
                const M = masterBag();
                Object.assign(c, BaseWidget.flattenNestedIconSlotToKeyMap(
                    overlayIconSlot(
                        overlayIconSlot(Object.assign({}, FACTORY_ICON_CONFIRM), iconSlotFromKeyMap(M, MASTER_ICON_KEYMAP_CONFIRM)),
                        icons.confirmationConfirm
                    ),
                    ICON_KEYMAP_CONFIRM
                ));
                Object.assign(c, BaseWidget.flattenNestedIconSlotToKeyMap(
                    overlayIconSlot(
                        overlayIconSlot(Object.assign({}, FACTORY_ICON_DISMISS), iconSlotFromKeyMap(M, MASTER_ICON_KEYMAP_DISMISS)),
                        icons.confirmationDismiss
                    ),
                    ICON_KEYMAP_DISMISS
                ));
                Object.assign(c, BaseWidget.flattenNestedIconSlotToKeyMap(
                    overlayIconSlot(
                        overlayIconSlot(inheritDialogIconBase(), iconSlotFromKeyMap(M, MASTER_ICON_KEYMAP_DIALOG)),
                        icons.confirmationDialog
                    ),
                    ICON_KEYMAP_DIALOG
                ));
            }
        },

        masterSchemaGroup: function () {
            const fields = appearanceFields({ widget: false })
                .concat(masterIconGroups())
                .concat(typographyGroups({ widget: false }));
            return {
                id: 'm_dialog_box',
                title: 'Dialog Box',
                icon: 'ph-chat-teardrop-text',
                editorTier: 'both',
                fields: fields
            };
        },

        confirmationSchemaGroup: function (id) {
            return {
                id: id || 'sw_confirmation_dialog',
                title: 'Confirmation Dialog Appearance',
                icon: 'ph-warning',
                visibleWhen: function (values) {
                    return values.requireConfirmation === true;
                },
                dependsOn: ['requireConfirmation'],
                fields: appearanceFields({ widget: true })
            };
        },

        warningSchemaGroup: function (id) {
            return DashboardDialog.confirmationSchemaGroup(id);
        },

        confirmationTypographyGroups: function () {
            return typographyGroups({ widget: true });
        },

        warningTypographyGroups: function () {
            return DashboardDialog.confirmationTypographyGroups();
        },

        attachConfirmationIconNested: function (group, slotName) {
            if (!group || !Array.isArray(group.fields)) return;
            const map = ICON_NEST_MAPS[slotName];
            if (!map) return;
            group.fields.forEach(function (field) {
                const prop = map[field.key];
                if (prop) field.iconsNested = { root: 'icons', slot: slotName, prop };
            });
        },

        decorateWidgetIconGroup: function (group, slotName) {
            DashboardDialog.attachConfirmationIconNested(group, slotName);
            const masterMap = slotName === 'confirmationDialog'
                ? MASTER_ICON_KEYMAP_DIALOG
                : (slotName === 'confirmationDismiss' ? MASTER_ICON_KEYMAP_DISMISS : MASTER_ICON_KEYMAP_CONFIRM);
            const widgetMap = slotName === 'confirmationDialog'
                ? ICON_KEYMAP_DIALOG
                : (slotName === 'confirmationDismiss' ? ICON_KEYMAP_DISMISS : ICON_KEYMAP_CONFIRM);
            const spec = {};
            Object.keys(widgetMap).forEach(function (logical) {
                spec[logical] = { defaultKey: masterMap[logical] };
            });
            if (slotName === 'confirmationDialog') {
                spec.source.defaultKeyFallback = 'defaultIconWidgetSource';
                spec.builtin.defaultKeyFallback = 'defaultIconWidgetBuiltin';
                spec.weight.defaultKeyFallback = 'defaultIconWidgetWeight';
                spec.customUrl.defaultKeyFallback = 'defaultIconWidgetCustomUrl';
                spec.tintImage.defaultKeyFallback = 'defaultIconWidgetTintImage';
                spec.color.defaultKeyFallback = 'iconInactive';
                spec.accentColor.defaultKeyFallback = 'defaultIconWidgetAccentColor';
            }
            applyIconFieldDefaults(group, widgetMap, spec);
        },

        attachWarningIconNested: function (group, slotName) {
            DashboardDialog.attachConfirmationIconNested(group, slotName);
        },

        showConfirmationButtonIcons: function (values) {
            if (!values || values.requireConfirmation !== true) return false;
            return resolvedFlagFromValues(values, 'showButtonIcons', 'dialogBoxShowButtonIcons', false) === true;
        },

        showConfirmationDialogIcon: function (values) {
            if (!values || values.requireConfirmation !== true) return false;
            return resolvedFlagFromValues(values, 'showDialogIcon', 'dialogBoxShowDialogIcon', true) === true;
        },

        showWarningIcons: function (values) {
            return DashboardDialog.showConfirmationButtonIcons(values);
        },

        confirm: function (widget, intendedOn, runFn, gestureFilter) {
            if (typeof runFn !== 'function') return;
            if (!widget) {
                runFn();
                return;
            }
            const c = widget.config || {};
            if (c.requireConfirmation !== true) {
                runFn();
                return;
            }
            if (intendedOn === false && c.confirmWhenTurningOff !== true) {
                runFn();
                return;
            }
            // When the widget mixes Hold to Activate on/off across outputs, the
            // Confirm With selector lets the user restrict the dialog to a
            // specific gesture. 'both' (or unset) keeps the legacy behavior.
            const gesture = (typeof gestureFilter === 'string') ? gestureFilter : 'all';
            const mode = c.confirmGesture || 'both';
            if (mode === 'hold' && gesture === 'tap') {
                runFn();
                return;
            }
            if (mode === 'tap' && gesture === 'hold') {
                runFn();
                return;
            }
            if (typeof Dashboard !== 'undefined' && Dashboard.isEditMode) {
                return;
            }
            this._openOverlay(widget, { mode: 'confirm', runFn: runFn });
        },

        syncPreview: function (widget) {
            if (typeof Dashboard === 'undefined' || !Dashboard.isEditMode) {
                if (this._mode === 'preview') this.close();
                return;
            }
            if (!widget) return;
            const c = widget.config || {};
            const selected = typeof Editor !== 'undefined' && Editor.currentId === widget.id;
            const want = c.requireConfirmation === true && c.previewInEditMode === true && selected;
            if (!want) {
                if (this._mode === 'preview' && this._widgetId === widget.id) this.close();
                return;
            }
            this._openOverlay(widget, { mode: 'preview' });
        },

        dismiss: function () {
            this.close();
        },

        dismissForWidget: function (widgetId) {
            if (this._widgetId === widgetId) this.close();
        },

        close: function () {
            this._unbindPreviewChrome();
            this._dragLive = null;
            this._detachKey();
            this._runFn = null;
            this._mode = null;
            this._widgetId = null;
            if (this._root && this._root.parentNode) {
                this._root.parentNode.removeChild(this._root);
            }
            this._root = null;
        },

        _openOverlay: function (widget, options) {
            const opts = options || {};
            if (this._mode === 'confirm' && opts.mode === 'confirm') {
                this._runFn = opts.runFn || null;
                this._widgetId = widget.id;
                this._paint(widget, opts);
                return;
            }
            if (this._mode === 'confirm' && opts.mode === 'preview') {
                return;
            }
            this._widgetId = widget.id;
            this._mode = opts.mode || 'confirm';
            this._runFn = opts.runFn || null;
            this._paint(widget, opts);
        },

        _ensureRoot: function () {
            const canvas = document.getElementById('dashboard-canvas');
            if (!canvas) return null;
            if (this._root && this._root.parentNode === canvas) return this._root;
            if (this._root && this._root.parentNode) this._root.parentNode.removeChild(this._root);
            const root = document.createElement('div');
            root.id = 'dashboard-dialog-root';
            root.className = 'dashboard-dialog-root';
            let handleHtml = '';
            RESIZE_EDGES.forEach(function (edge) {
                handleHtml += '<div class="resize-handle rh-' + edge + '" data-dialog-edge="' + edge + '"></div>';
            });
            root.innerHTML =
                '<div class="dashboard-dialog-dim" aria-hidden="true"></div>' +
                '<div class="dashboard-dialog-panel" role="dialog" aria-modal="true">' +
                '<div class="dashboard-dialog-message-row">' +
                '<div class="dashboard-dialog-icon"></div>' +
                '<div class="dashboard-dialog-message"></div>' +
                '</div>' +
                '<div class="dashboard-dialog-actions">' +
                '<button type="button" class="dashboard-dialog-btn dashboard-dialog-btn-dismiss">' +
                '<span class="dashboard-dialog-btn-icon"></span>' +
                '<span class="dashboard-dialog-btn-label"></span>' +
                '</button>' +
                '<button type="button" class="dashboard-dialog-btn dashboard-dialog-btn-confirm">' +
                '<span class="dashboard-dialog-btn-icon"></span>' +
                '<span class="dashboard-dialog-btn-label"></span>' +
                '</button>' +
                '</div>' +
                handleHtml +
                '</div>';
            canvas.appendChild(root);
            this._root = root;
            return root;
        },

        _canvasScale: function () {
            const canvas = document.getElementById('dashboard-canvas');
            if (!canvas) return { x: 1, y: 1, rect: null, canvas: null };
            const rect = canvas.getBoundingClientRect();
            const w = canvas.offsetWidth || 1;
            const h = canvas.offsetHeight || 1;
            return {
                x: (rect.width / w) || 1,
                y: (rect.height / h) || 1,
                rect: rect,
                canvas: canvas
            };
        },

        _panelCanvasBox: function (panel) {
            const scale = this._canvasScale();
            if (!panel || !scale.rect) {
                return { x: 0, y: 0, w: 0, h: 0 };
            }
            const pr = panel.getBoundingClientRect();
            return {
                x: (pr.left - scale.rect.left) / scale.x,
                y: (pr.top - scale.rect.top) / scale.y,
                w: pr.width / scale.x,
                h: pr.height / scale.y
            };
        },

        _canvasBoundsPx: function () {
            const M = masterBag();
            let boundsW = 0;
            let boundsH = 0;
            if (M.canvasWidth > 0 && M.canvasHeight > 0) {
                boundsW = M.canvasWidth;
                boundsH = M.canvasHeight;
            } else {
                const canvas = document.getElementById('dashboard-canvas');
                if (canvas) {
                    boundsW = canvas.offsetWidth;
                    boundsH = canvas.offsetHeight;
                }
            }
            return { w: boundsW, h: boundsH };
        },

        _clampDialogRect: function (x, y, w, h) {
            const bounds = this._canvasBoundsPx();
            const minSize = 80;
            let width = Math.max(minSize, coerceNumber(w, 360));
            let height = Math.max(minSize, coerceNumber(h, 180));
            if (bounds.w > 0) width = Math.min(width, bounds.w);
            if (bounds.h > 0) height = Math.min(height, bounds.h);
            let nx = coerceNumber(x, 0);
            let ny = coerceNumber(y, 0);
            if (bounds.w > 0 && bounds.h > 0) {
                const buffer = 20;
                const minX = -buffer;
                const minY = -buffer;
                const maxX = bounds.w - width + buffer;
                const maxY = bounds.h - height + buffer;
                nx = Math.max(minX, Math.min(nx, maxX));
                ny = Math.max(minY, Math.min(ny, maxY));
            }
            return { x: nx, y: ny, w: width, h: height };
        },

        _applyCenteredPanelSize: function (panel, w, h) {
            if (!panel) return;
            panel.style.width = coerceNumber(w, 360) + 'px';
            panel.style.height = coerceNumber(h, 180) + 'px';
            panel.style.minWidth = '';
            panel.style.maxWidth = '';
            panel.style.left = '50%';
            panel.style.top = '50%';
            panel.style.transform = 'translate(-50%, -50%)';
        },

        _applyPanelGeometry: function (panel, geo) {
            if (!panel || !geo) return;
            const clamped = this._clampDialogRect(geo.x, geo.y, geo.w, geo.h);
            geo.x = clamped.x;
            geo.y = clamped.y;
            geo.w = clamped.w;
            geo.h = clamped.h;
            panel.style.left = clamped.x + 'px';
            panel.style.top = clamped.y + 'px';
            panel.style.transform = 'none';
            panel.style.width = clamped.w + 'px';
            panel.style.height = clamped.h + 'px';
            panel.style.minWidth = '';
            panel.style.maxWidth = '';
        },

        _commitPreviewGeometry: function (widget, patch) {
            if (!widget || !patch || typeof Dashboard === 'undefined' || typeof Dashboard.updateWidget !== 'function') {
                return;
            }
            Dashboard.updateWidget(widget.id, { confirmationDialog: patch });
            if (typeof Editor !== 'undefined' && Editor.currentId === widget.id && typeof Editor.loadWidget === 'function') {
                Editor.loadWidget(widget.id);
            }
        },

        _unbindPreviewChrome: function () {
            const binds = this._previewBinds;
            this._previewBinds = null;
            this._previewBindWidgetId = null;
            if (!binds || !binds.length) return;
            binds.forEach(function (b) {
                if (b && typeof b.destroy === 'function') b.destroy();
            });
        },

        _bindPreviewChrome: function (widget, panel) {
            const self = this;
            this._unbindPreviewChrome();
            if (!panel || typeof PointerDrag === 'undefined' || typeof PointerDrag.bind !== 'function') return;
            const binds = [];
            const lockPosition = isResponsiveColumns();

            if (!lockPosition) {
                binds.push(PointerDrag.bind(panel, {
                    shouldStart: function (e) {
                        const t = e.target;
                        if (!t) return false;
                        if (t.closest && t.closest('.resize-handle')) return false;
                        if (t.closest && t.closest('.dashboard-dialog-btn')) return false;
                        return true;
                    },
                    onDown: function (e) {
                        const box = self._panelCanvasBox(panel);
                        const live = {
                            x: box.x,
                            y: box.y,
                            w: box.w,
                            h: box.h,
                            originClientX: e.clientX,
                            originClientY: e.clientY,
                            startX: box.x,
                            startY: box.y
                        };
                        self._dragLive = live;
                        self._applyPanelGeometry(panel, live);
                        return live;
                    },
                    onMove: function (ev, live) {
                        if (!live) return;
                        const scale = self._canvasScale();
                        live.x = live.startX + (ev.clientX - live.originClientX) / (scale.x || 1);
                        live.y = live.startY + (ev.clientY - live.originClientY) / (scale.y || 1);
                        self._applyPanelGeometry(panel, live);
                    },
                    onUp: function (ev, live) {
                        self._dragLive = null;
                        if (!live) return;
                        self._commitPreviewGeometry(widget, {
                            centerDialog: false,
                            dialogX: Math.round(live.x),
                            dialogY: Math.round(live.y)
                        });
                    }
                }));
            }

            const handles = panel.querySelectorAll('.resize-handle[data-dialog-edge]');
            handles.forEach(function (handle) {
                binds.push(PointerDrag.bind(handle, {
                    onDown: function (e) {
                        const box = self._panelCanvasBox(panel);
                        const live = {
                            x: box.x,
                            y: box.y,
                            w: box.w,
                            h: box.h,
                            edge: handle.getAttribute('data-dialog-edge') || 'se',
                            originClientX: e.clientX,
                            originClientY: e.clientY,
                            startX: box.x,
                            startY: box.y,
                            startW: box.w,
                            startH: box.h,
                            lockPosition: lockPosition
                        };
                        self._dragLive = live;
                        if (lockPosition) self._applyCenteredPanelSize(panel, live.w, live.h);
                        else self._applyPanelGeometry(panel, live);
                        return live;
                    },
                    onMove: function (ev, live) {
                        if (!live) return;
                        const scale = self._canvasScale();
                        const dx = (ev.clientX - live.originClientX) / (scale.x || 1);
                        const dy = (ev.clientY - live.originClientY) / (scale.y || 1);
                        let x = live.startX;
                        let y = live.startY;
                        let w = live.startW;
                        let h = live.startH;
                        const edge = live.edge;
                        if (edge.indexOf('e') !== -1) w = Math.max(80, live.startW + dx);
                        if (edge.indexOf('s') !== -1) h = Math.max(80, live.startH + dy);
                        if (edge.indexOf('w') !== -1) {
                            w = Math.max(80, live.startW - dx);
                            x = live.startX + (live.startW - w);
                        }
                        if (edge.indexOf('n') !== -1) {
                            h = Math.max(80, live.startH - dy);
                            y = live.startY + (live.startH - h);
                        }
                        live.x = x;
                        live.y = y;
                        live.w = w;
                        live.h = h;
                        if (live.lockPosition) {
                            const clamped = self._clampDialogRect(0, 0, live.w, live.h);
                            live.w = clamped.w;
                            live.h = clamped.h;
                            self._applyCenteredPanelSize(panel, live.w, live.h);
                        } else {
                            self._applyPanelGeometry(panel, live);
                        }
                    },
                    onUp: function (ev, live) {
                        self._dragLive = null;
                        if (!live) return;
                        const patch = {
                            autoDialogSize: false,
                            dialogWidth: Math.round(live.w),
                            dialogHeight: Math.round(live.h)
                        };
                        if (!live.lockPosition) {
                            patch.centerDialog = false;
                            patch.dialogX = Math.round(live.x);
                            patch.dialogY = Math.round(live.y);
                        }
                        self._commitPreviewGeometry(widget, patch);
                    }
                }));
            });

            this._previewBinds = binds;
        },

        _paint: function (widget, options) {
            const root = this._ensureRoot();
            if (!root) return;
            if (root.parentNode) root.parentNode.appendChild(root);
            const resolved = this.resolve(widget);
            const preview = (options && options.mode) === 'preview';
            const dim = root.querySelector('.dashboard-dialog-dim');
            const panel = root.querySelector('.dashboard-dialog-panel');
            const msgEl = root.querySelector('.dashboard-dialog-message');
            const iconEl = root.querySelector('.dashboard-dialog-icon');
            const btnDismiss = root.querySelector('.dashboard-dialog-btn-dismiss');
            const btnConfirm = root.querySelector('.dashboard-dialog-btn-confirm');
            if (!dim || !panel || !msgEl || !btnDismiss || !btnConfirm) return;

            if (preview) root.classList.add('is-preview');
            else root.classList.remove('is-preview');
            if (isResponsiveColumns()) root.classList.add('is-position-locked');
            else root.classList.remove('is-position-locked');

            root.style.zIndex = '100000';
            const modal = !preview && resolved.modalMode === true;
            dim.style.display = modal ? 'block' : 'none';
            if (preview) {
                root.style.pointerEvents = 'none';
                dim.style.pointerEvents = 'none';
                panel.style.pointerEvents = 'auto';
            } else {
                root.style.pointerEvents = modal ? 'auto' : 'none';
                dim.style.pointerEvents = modal ? 'auto' : 'none';
                panel.style.pointerEvents = 'auto';
            }

            const bg = (typeof BaseWidget !== 'undefined' && BaseWidget.resolveCssColor)
                ? BaseWidget.resolveCssColor(resolved.backgroundColor)
                : resolved.backgroundColor;
            panel.style.background = bg || 'transparent';

            const radius = coerceNumber(resolved.cornerRadius, 12);
            panel.style.borderRadius = radius + 'px';
            const bw = coerceNumber(resolved.borderWidth, 1);
            const bo = coerceNumber(resolved.borderOpacity, 100);
            let bc = resolved.borderColor;
            if (typeof BaseWidget !== 'undefined' && BaseWidget.resolveCssColor) {
                bc = BaseWidget.resolveCssColor(resolved.borderColor);
            }
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.hexToRgba === 'function') {
                panel.style.border = bw + 'px solid ' + Dashboard.hexToRgba(bc, bo / 100);
            } else {
                panel.style.border = bw + 'px solid ' + (bc || 'transparent');
            }

            const live = this._dragLive;
            const forceCenter = isResponsiveColumns() || resolved.centerDialog === true;
            if (live) {
                if (live.lockPosition) this._applyCenteredPanelSize(panel, live.w, live.h);
                else this._applyPanelGeometry(panel, live);
            } else {
                if (resolved.autoDialogSize === true) {
                    panel.style.width = 'auto';
                    panel.style.height = 'auto';
                    panel.style.minWidth = '240px';
                    panel.style.maxWidth = '80%';
                } else {
                    const size = this._clampDialogRect(0, 0, coerceNumber(resolved.dialogWidth, 360), coerceNumber(resolved.dialogHeight, 180));
                    panel.style.width = size.w + 'px';
                    panel.style.height = size.h + 'px';
                    panel.style.minWidth = '';
                    panel.style.maxWidth = '';
                }

                if (forceCenter) {
                    panel.style.left = '50%';
                    panel.style.top = '50%';
                    panel.style.transform = 'translate(-50%, -50%)';
                } else {
                    let x = coerceNumber(resolved.dialogX, 0);
                    let y = coerceNumber(resolved.dialogY, 0);
                    let w = resolved.autoDialogSize === true ? panel.offsetWidth : coerceNumber(resolved.dialogWidth, 360);
                    let h = resolved.autoDialogSize === true ? panel.offsetHeight : coerceNumber(resolved.dialogHeight, 180);
                    const clamped = this._clampDialogRect(x, y, w || 240, h || 80);
                    panel.style.left = clamped.x + 'px';
                    panel.style.top = clamped.y + 'px';
                    panel.style.transform = 'none';
                }
            }

            this._setText(msgEl, resolved.message);
            if (typeof BaseWidget !== 'undefined' && BaseWidget.prototype.applyTypographyToElement) {
                BaseWidget.prototype.applyTypographyToElement(msgEl, 'dialogBoxText', resolved.typoMessage);
            }

            const showDlgIcon = resolved.showDialogIcon === true;
            if (iconEl) {
                iconEl.style.display = showDlgIcon ? 'inline-flex' : 'none';
                if (showDlgIcon && typeof BaseWidget !== 'undefined' && BaseWidget.applyIconStyleToElement) {
                    const slot = resolved.iconDialog;
                    const flat = BaseWidget.flattenNestedIconSlotToKeyMap(slot, ICON_KEYMAP_DIALOG);
                    BaseWidget.applyIconStyleToElement(iconEl, flat, ICON_KEYMAP_DIALOG, {
                        color: slot.color || '@icon'
                    });
                } else {
                    iconEl.textContent = '';
                }
            }

            this._paintActionButton(btnConfirm, resolved, true);
            this._paintActionButton(btnDismiss, resolved, false);

            const self = this;
            btnConfirm.onclick = preview ? null : function (ev) {
                if (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
                const fn = self._runFn;
                self.close();
                if (typeof fn === 'function') fn();
            };
            btnDismiss.onclick = preview ? null : function (ev) {
                if (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
                self.close();
            };

            this._detachKey();
            if (!preview) {
                this._onKey = function (e) {
                    if (!e || e.key !== 'Escape') return;
                    self.close();
                };
                document.addEventListener('keydown', this._onKey);
                this._unbindPreviewChrome();
            } else if (!this._dragLive) {
                if (!this._previewBinds || this._previewBindWidgetId !== widget.id) {
                    this._bindPreviewChrome(widget, panel);
                    this._previewBindWidgetId = widget.id;
                }
            }
        },

        _paintActionButton: function (btn, resolved, isConfirm) {
            const label = isConfirm ? resolved.confirmLabel : resolved.dismissLabel;
            const labelEl = btn.querySelector('.dashboard-dialog-btn-label');
            const iconEl = btn.querySelector('.dashboard-dialog-btn-icon');
            this._setText(labelEl, label);
            const radius = coerceNumber(resolved.buttonRoundness, 12);
            btn.style.borderRadius = radius + 'px';
            const fill = (typeof BaseWidget !== 'undefined' && BaseWidget.resolveCssColor)
                ? BaseWidget.resolveCssColor(resolved.buttonColor)
                : resolved.buttonColor;
            btn.style.background = fill || '';
            const onAccent = (typeof BaseWidget !== 'undefined' && BaseWidget.resolveCssColor)
                ? BaseWidget.resolveCssColor('@onAccent')
                : '#083344';
            btn.style.color = onAccent || '#fff';
            if (resolved.autoButtonSize !== true) {
                btn.style.width = coerceNumber(resolved.buttonWidth, 120) + 'px';
                btn.style.height = coerceNumber(resolved.buttonHeight, 40) + 'px';
            } else {
                btn.style.width = '';
                btn.style.height = '';
            }
            if (typeof BaseWidget !== 'undefined' && BaseWidget.prototype.applyTypographyToElement) {
                BaseWidget.prototype.applyTypographyToElement(labelEl, 'dialogBoxButtonLabel', resolved.typoButton);
                if (labelEl) labelEl.style.color = onAccent || '#fff';
            }
            const showIcons = resolved.showButtonIcons === true;
            if (iconEl) iconEl.style.display = showIcons ? 'inline-flex' : 'none';
            if (showIcons && iconEl && typeof BaseWidget !== 'undefined' && BaseWidget.applyIconStyleToElement) {
                const slot = isConfirm ? resolved.iconConfirm : resolved.iconDismiss;
                const km = isConfirm ? ICON_KEYMAP_CONFIRM : ICON_KEYMAP_DISMISS;
                const flat = BaseWidget.flattenNestedIconSlotToKeyMap(slot, km);
                const col = slot.color || '@onAccent';
                BaseWidget.applyIconStyleToElement(iconEl, flat, km, {
                    color: col
                });
            } else if (iconEl) {
                iconEl.textContent = '';
            }
        },

        _setText: function (el, value) {
            if (!el) return;
            const next = value == null ? '' : String(value);
            if (el.textContent !== next) el.textContent = next;
        },

        _detachKey: function () {
            if (this._onKey) {
                document.removeEventListener('keydown', this._onKey);
                this._onKey = null;
            }
        }
    };

    window.DashboardDialog = DashboardDialog;
}());
