// Code defaults from data-config.js, captured before any dashboard load mutates MASTER_SETTINGS.
const MASTER_CODE_DEFAULTS = (function () {
    const raw = (typeof MASTER_SETTINGS === 'object' && MASTER_SETTINGS) ? MASTER_SETTINGS : {};
    try {
        return JSON.parse(JSON.stringify(raw));
    } catch (e) {
        return Object.assign({}, raw);
    }
})();

const Dashboard = {
    widgets: {},
    liveData: Object.create(null),
    globalBindings: {},
    isEditMode: false,
    _holdLivePreviewActive: false,
    _holdLivePreviewKeepEditor: false,
    dragState: null,
    _editPointerGestureDepth: 0,
    _editPointerGesturePrevUserSelect: '',
    _editPointerCapture: null,
    _editAddToSelection: false,
    _editSelectBehind: false,
    selectedIds: [],
    _prevVisualSelectedIds: [],
    groups: {},
    selectedGroupId: null,
    _prevVisualGroupId: null,
    openedGroupId: null,
    lasso: null,
    loopCallbacks: new Map(),
    fabTimer: null,
    hasUnsavedChanges: false,
    /** Edit-mode view scale (1 = 100%). Viewer and live preview stay at 1. */
    _editorZoomScale: 1,
    _domCache: {},
    _driverOfflineSessionActive: false,
    _driverOfflineWarningDismissed: false,
    _driverOfflineWarningTimer: null,
    _driverOfflineWarningDelayMs: 2000,
    _pendingOfflineWarningDriverLabel: '',
    _pendingOfflineWarningStatusText: '',
    _driverHasConnectedOnce: false,
    _dataDriverConnected: false,
    _menuOutputStatusSyncTimer: null,
    _lastLiveResyncAt: 0,
    _liveResyncVisibilityTimer: null,
    internalSnippetClipboard: null,
    /** @type {Object.<string, number>|null} Built during _syncGroupBackdropOverlays; absolute z-index for modal group members (view mode). */
    _groupModalAbsZByWidgetId: null,
    /** Per manual selection group id: { allowEmptySelection: boolean }. Missing id implies allowEmptySelection false. */
    selectionGroups: {},
    history: {
        undoStack: [],
        redoStack: [],
        maxSteps: 20,
        pendingAction: null
    },
    isApplyingHistory: false,
    _editorPageIndicatorEditing: false,
    _dirtyWidgetIds: new Set(),
    _dirtyWidgetFlushScheduled: false,

    isWidgetHidden: function (type) {
        if (!window.APP_CONFIG || !window.APP_CONFIG.ui || !Array.isArray(window.APP_CONFIG.ui.hiddenWidgets)) return false;
        if (new URLSearchParams(window.location.search).get('test_mode') === 'full') return false;
        return window.APP_CONFIG.ui.hiddenWidgets.includes(type);
    },

    init: function () {
        this.showLoading("System");
        // WidgetScriptLoader already ran ConfigLoader.load() before handing off on both the viewer
        // and the editor path, so a second config/settings fetch here would only delay first paint.
        const preload = window.__DS_BOOT_PRELOAD__;
        if (preload && preload.appConfig && window.APP_CONFIG) {
            this._start();
            return;
        }
        ConfigLoader.load().then(() => {
            this._start();
        });
    },

    _start: function () {
        const isViewer = window.IS_VIEWER === true;
        if (isViewer) {
            document.body.classList.add('viewer-mode');
            this._hideDriverOfflineWarning();
        }

        if (document.getElementById('app-version') && window.DASHBOARD_VERSION) {
            document.getElementById('app-version').innerText = `v${window.DASHBOARD_VERSION}`;
        }

        if (window.APP_CONFIG && window.APP_CONFIG.defaults && window.APP_CONFIG.defaults.dataDriver) {
            MASTER_SETTINGS.dataDriver = window.APP_CONFIG.defaults.dataDriver;
        }
        if (window.APP_CONFIG && window.APP_CONFIG.ui && typeof window.APP_CONFIG.ui.warnWhenDriverOffline === 'boolean') {
            MASTER_SETTINGS.warnWhenDriverOffline = window.APP_CONFIG.ui.warnWhenDriverOffline;
        }

        const pluginSettings = WidgetRegistry.getGlobalSettings();
        Object.assign(MASTER_SETTINGS, pluginSettings);

        if (typeof MasterLayout !== 'undefined' && (!MASTER_SETTINGS.themeColors || typeof MASTER_SETTINGS.themeColors !== 'object')) {
            MASTER_SETTINGS.themeColors = MasterLayout.defaultThemeColors();
        }

        this._captureNativeVisualMaster();

        this.selectedIds = [];
        this._resetGroupState();
        this.selectionGroups = {};

        // Fonts are loaded once at the end of loadDashboardData (every boot path goes through
        // it); requesting them here would hit the Google Fonts CDN twice with a stale font set.

        if (!isViewer) {
            this.populateAddWidgetMenu();
            this.initTemplateDropdown();

            Editor.init(this.widgets);
            this._updateUniversalActionButtons();
            this._refreshHistoryUiState();
            this._refreshEditorPageIndicator();
            this._bindEditorPageIndicatorEditor();
            if (typeof QuickToolbar !== 'undefined' && typeof QuickToolbar.init === 'function') {
                QuickToolbar.init();
            }
        }

        this.updateGlobal(MASTER_SETTINGS, false, true);
        if (typeof DashboardDialog !== 'undefined' && typeof DashboardDialog.ensureMasterDefaults === 'function') {
            DashboardDialog.ensureMasterDefaults();
        }

        this._initEditModeDashboardLaneSync();
        if (!isViewer) {
            this.applyUIConfig();
            this.updateViewerUrlIndicator();
        }

        this.loadStartupConfig();

        this.bindEvents();

        if (!isViewer) {
            this.initFabAutoHiding();
        }

        // Data driver is intentionally NOT initialized here. Booting the default driver
        // before the dashboard JSON is parsed means the wrong driver can connect (e.g.
        // Homey loads socket.io) only to be torn down moments later when loadDashboardData
        // discovers the dashboard wants a different driver - delaying first data by 300ms to 2s.
        // loadDashboardData() owns driver lifecycle via ensureDataDriver() once MASTER_SETTINGS
        // reflects the loaded dashboard.

        this.loop();
    },

    showLoading: function (name) {
        const overlay = document.getElementById('loading-overlay');
        const textEl = document.getElementById('loading-overlay-text');
        if (overlay && textEl) {
            const displayName = name ? name.replace('.json', '') : 'Dashboard';
            textEl.innerText = `Loading ${displayName}...`;
            overlay.classList.add('show');
        }
        this._syncInactivityPageWatch();
        this._syncGestureControls();
    },

    hideLoading: function () {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.remove('show');
        if (document.body) document.body.classList.remove('ds-loading');
        this._syncInactivityPageWatch();
        this._syncGestureControls();
    },

    markUnsaved: function () {
        if (!this.isEditMode) return;
        if (!this.hasUnsavedChanges) {
            this.hasUnsavedChanges = true;
        }
        this.updateFileIndicator();
    },

    /**
     * Editor layout prefs for the Quick Toolbar. Never marks unsaved, never records history.
     */
    setQuickToolbarPrefs: function (patch) {
        const current = (typeof QuickToolbar !== 'undefined' && QuickToolbar.normalizePrefs)
            ? QuickToolbar.normalizePrefs(MASTER_SETTINGS.quickToolbar)
            : { visibility: 'auto', enabled: true, mode: 'docked', x: 0, y: 0, columns: 1, rows: 0 };
        const src = (patch && typeof patch === 'object') ? patch : {};
        let visibility = current.visibility;
        if (src.visibility !== undefined) {
            visibility = src.visibility;
        } else if (src.enabled !== undefined) {
            visibility = src.enabled ? (current.visibility === 'never' ? 'auto' : current.visibility) : 'never';
        }
        const next = {
            visibility: visibility,
            enabled: visibility !== 'never',
            mode: src.mode !== undefined
                ? (src.mode === 'floating' ? 'floating' : 'docked')
                : current.mode,
            x: src.x !== undefined ? src.x : current.x,
            y: src.y !== undefined ? src.y : current.y,
            columns: src.columns !== undefined ? src.columns : current.columns,
            rows: src.rows !== undefined ? src.rows : current.rows
        };
        const normalized = (typeof QuickToolbar !== 'undefined' && QuickToolbar.normalizePrefs)
            ? QuickToolbar.normalizePrefs(next)
            : next;
        MASTER_SETTINGS.quickToolbar = normalized;
        if (typeof QuickToolbar !== 'undefined') {
            if ((src.mode !== undefined || src.visibility !== undefined || src.enabled !== undefined)
                && (QuickToolbar._drag || QuickToolbar._resize)
                && typeof QuickToolbar._finishGesture === 'function') {
                QuickToolbar._finishGesture();
            }
            if (typeof QuickToolbar.refresh === 'function') QuickToolbar.refresh();
            if (typeof QuickToolbar.syncEnvironmentCheckbox === 'function') QuickToolbar.syncEnvironmentCheckbox();
        }
        if (typeof this._syncEditModeDashboardLane === 'function') this._syncEditModeDashboardLane();
    },

    /**
     * Edit-mode canvas scale (percent). Persisted on save, never marks unsaved,
     * never records history, and cannot be driven by a topic binding.
     */
    _normalizeEditorZoom: function (raw) {
        if (raw === undefined || raw === null || raw === '') return 100;
        const n = Math.round(Number(raw));
        if (!isFinite(n)) return 100;
        if (n < 20) return 20;
        if (n > 200) return 200;
        return n;
    },

    /**
     * Slider 0-200 with 100% at the midpoint.
     * Left half: 200% down to 100%. Right half: 100% down to 20%.
     */
    _percentFromEditorZoomSlider: function (sliderVal) {
        const n = Number(sliderVal);
        if (!isFinite(n)) return 100;
        if (n <= 100) return this._normalizeEditorZoom(200 - n);
        return this._normalizeEditorZoom(100 - (n - 100) * 0.8);
    },

    _sliderFromEditorZoom: function (percent) {
        const p = this._normalizeEditorZoom(percent);
        let slider = (p >= 100) ? (200 - p) : (100 + ((100 - p) / 0.8));
        if (!isFinite(slider)) slider = 100;
        slider = Math.round(slider);
        if (slider < 0) slider = 0;
        if (slider > 200) slider = 200;
        return String(slider);
    },

    _dropEditorZoomBinding: function () {
        if (!this.globalBindings) return;
        if (Object.prototype.hasOwnProperty.call(this.globalBindings, 'editorZoom')) {
            delete this.globalBindings.editorZoom;
        }
    },

    _isEditorZoomTransformActive: function () {
        if (window.IS_VIEWER === true) return false;
        if (!this.isEditMode || this._holdLivePreviewActive) return false;
        return true;
    },

    _canvasPointerScale: function () {
        const s = this._editorZoomScale;
        if (typeof s === 'number' && s > 0 && s !== 1) return s;
        return 1;
    },

    setEditorZoom: function (percent) {
        const next = this._normalizeEditorZoom(percent);
        MASTER_SETTINGS.editorZoom = next;
        this._dropEditorZoomBinding();
        this._syncEditorZoomControls(true);
        this._scheduleEditorZoomApply();
    },

    setEditorZoomFromSlider: function (input) {
        if (!input) return;
        MASTER_SETTINGS.editorZoom = this._percentFromEditorZoomSlider(input.value);
        this._dropEditorZoomBinding();
        this._syncEditorZoomControls(false);
        this._scheduleEditorZoomApply();
    },

    _scheduleEditorZoomApply: function () {
        const self = this;
        if (self._editorZoomRaf) return;
        const run = function () {
            self._editorZoomRaf = 0;
            self._applyEditorZoom();
        };
        if (typeof requestAnimationFrame === 'function') {
            self._editorZoomRaf = requestAnimationFrame(run);
        } else {
            run();
        }
    },

    _syncEditorZoomControls: function (writeSlider) {
        const percent = this._normalizeEditorZoom(MASTER_SETTINGS.editorZoom);
        const readout = document.getElementById('editor-zoom-readout');
        if (readout && readout.textContent !== (percent + '%')) {
            readout.textContent = percent + '%';
        }
        const resetBtn = document.getElementById('editor-zoom-reset');
        if (resetBtn) {
            const atDefault = percent === 100;
            if (resetBtn.disabled !== atDefault) resetBtn.disabled = atDefault;
        }
        const input = document.getElementById('editor-zoom-slider');
        if (!input) return;
        if (writeSlider) {
            const sliderVal = this._sliderFromEditorZoom(percent);
            if (input.value !== sliderVal) input.value = sliderVal;
        }
        this._paintRangeSliderFill(input, 0, 200);
        const now = String(percent);
        if (input.getAttribute('aria-valuenow') !== now) input.setAttribute('aria-valuenow', now);
        const text = percent + '%';
        if (input.getAttribute('aria-valuetext') !== text) input.setAttribute('aria-valuetext', text);
    },

    _installEditorZoomFromSettings: function () {
        this._dropEditorZoomBinding();
        const percent = this._normalizeEditorZoom(MASTER_SETTINGS.editorZoom);
        MASTER_SETTINGS.editorZoom = percent;
        this._syncEditorZoomControls(true);
        this._applyEditorZoom();
    },

    _ensureEditorZoomHost: function (canvas) {
        let host = document.getElementById('dashboard-editor-zoom-host');
        if (host && canvas.parentNode === host) return host;
        if (host && host.parentNode) host.parentNode.removeChild(host);
        host = document.createElement('div');
        host.id = 'dashboard-editor-zoom-host';
        canvas.parentNode.insertBefore(host, canvas);
        host.appendChild(canvas);
        return host;
    },

    _pinEditorZoomCanvasBox: function (canvas) {
        const mode = (MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) ? MASTER_SETTINGS.layoutMode : 'fixed';
        if (canvas.style.transition !== 'none') canvas.style.transition = 'none';
        if (mode === 'responsive') {
            const avail = this._responsiveAvailableWidth();
            const w = Math.round(avail > 0 ? avail : canvas.offsetWidth);
            if (w > 0) {
                const wPx = w + 'px';
                if (canvas.style.width !== wPx) {
                    canvas.style.width = wPx;
                    this._editorZoomWidthOverride = true;
                }
            }
            // min-height: 100% resolves against the zoom host. Above 100% the host is
            // taller than the grid, the canvas stretches to it, and the next sync
            // multiplies that height again.
            if (canvas.style.minHeight !== '0px') {
                canvas.style.minHeight = '0px';
                this._editorZoomMinHeightOverride = true;
            }
            return;
        }
        if (!/px$/.test(canvas.style.width || '')) {
            const w = canvas.offsetWidth;
            if (w > 0) {
                canvas.style.width = w + 'px';
                this._editorZoomWidthOverride = true;
            }
        }
        if (!/px$/.test(canvas.style.height || '')) {
            const h = canvas.offsetHeight;
            if (h > 0) {
                canvas.style.height = h + 'px';
                this._editorZoomHeightOverride = true;
            }
        }
    },

    _syncEditorZoomHostBox: function (canvas) {
        const host = document.getElementById('dashboard-editor-zoom-host');
        if (!host || !canvas) return;
        const scale = this._editorZoomScale;
        if (!(scale > 0) || scale === 1) return;
        const hostW = Math.max(1, Math.round(canvas.offsetWidth * scale));
        const hostH = Math.max(1, Math.round(canvas.offsetHeight * scale));
        if (this._editorZoomHostW !== hostW) {
            host.style.width = hostW + 'px';
            this._editorZoomHostW = hostW;
        }
        if (this._editorZoomHostH !== hostH) {
            host.style.height = hostH + 'px';
            this._editorZoomHostH = hostH;
        }
    },

    _clearEditorZoomHost: function () {
        const canvas = document.getElementById('dashboard-canvas');
        const host = document.getElementById('dashboard-editor-zoom-host');
        if (canvas) {
            canvas.classList.remove('editor-zoom-active');
            if (this._editorZoomOwnsTransform) {
                canvas.style.transform = '';
                canvas.style.transformOrigin = '';
                this._editorZoomOwnsTransform = false;
            }
            if (canvas.style.transition === 'none') canvas.style.transition = '';
            if (this._editorZoomMarginSaved) {
                canvas.style.marginLeft = this._editorZoomSavedMarginLeft || '';
                canvas.style.marginRight = this._editorZoomSavedMarginRight || '';
                this._editorZoomMarginSaved = false;
                this._editorZoomSavedMarginLeft = '';
                this._editorZoomSavedMarginRight = '';
            }
            if (this._editorZoomWidthOverride || this._editorZoomHeightOverride) {
                const mode = (MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) ? MASTER_SETTINGS.layoutMode : 'fixed';
                const cache = this._domCache || {};
                if (this._editorZoomWidthOverride) {
                    if (mode === 'responsive') canvas.style.width = cache.width || '100%';
                    else if (cache.width) canvas.style.width = cache.width;
                }
                if (this._editorZoomHeightOverride) {
                    if (mode === 'responsive') canvas.style.height = cache.height || 'auto';
                    else if (cache.height) canvas.style.height = cache.height;
                }
                this._editorZoomWidthOverride = false;
                this._editorZoomHeightOverride = false;
            }
            if (this._editorZoomMinHeightOverride) {
                canvas.style.minHeight = '';
                this._editorZoomMinHeightOverride = false;
            }
        }
        if (host && canvas && host.contains(canvas) && host.parentNode) {
            host.parentNode.insertBefore(canvas, host);
        }
        if (host && host.parentNode) host.parentNode.removeChild(host);
        this._editorZoomHostW = 0;
        this._editorZoomHostH = 0;
    },

    /**
     * Scale the edit canvas with a CSS transform. Widget layout stays in design pixels.
     * At 100%, and outside edit mode, this leaves the canvas untouched.
     */
    _applyEditorZoom: function () {
        if (this._editorZoomApplying) return;
        const canvas = document.getElementById('dashboard-canvas');
        if (!canvas) return;
        this._editorZoomApplying = true;
        try {
            const active = this._isEditorZoomTransformActive();
            const percent = this._normalizeEditorZoom(MASTER_SETTINGS.editorZoom);
            const scale = (active && percent !== 100) ? (percent / 100) : 1;
            this._editorZoomScale = scale;
            if (scale === 1) {
                if (this._editorZoomOwnsTransform || document.getElementById('dashboard-editor-zoom-host')) {
                    this._clearEditorZoomHost();
                    this._syncEditModeDashboardLane();
                }
                return;
            }

            this._pinEditorZoomCanvasBox(canvas);
            const host = this._ensureEditorZoomHost(canvas);
            if (!host.classList.contains('is-active')) host.classList.add('is-active');
            if (!canvas.classList.contains('editor-zoom-active')) canvas.classList.add('editor-zoom-active');

            if (!this._editorZoomMarginSaved) {
                this._editorZoomSavedMarginLeft = canvas.style.marginLeft || '';
                this._editorZoomSavedMarginRight = canvas.style.marginRight || '';
                this._editorZoomMarginSaved = true;
            }
            if (host.style.marginLeft !== this._editorZoomSavedMarginLeft) {
                host.style.marginLeft = this._editorZoomSavedMarginLeft;
            }
            if (host.style.marginRight !== this._editorZoomSavedMarginRight) {
                host.style.marginRight = this._editorZoomSavedMarginRight;
            }
            if (canvas.style.marginLeft !== '0px' && canvas.style.marginLeft !== '0') {
                canvas.style.marginLeft = '0';
            }
            if (canvas.style.marginRight !== '0px' && canvas.style.marginRight !== '0') {
                canvas.style.marginRight = '0';
            }

            this._syncEditorZoomHostBox(canvas);
            const transform = 'scale(' + scale + ')';
            if (canvas.style.transformOrigin !== '0px 0px' && canvas.style.transformOrigin !== '0 0') {
                canvas.style.transformOrigin = '0 0';
            }
            if (canvas.style.transform !== transform) canvas.style.transform = transform;
            this._editorZoomOwnsTransform = true;
            this._syncEditModeDashboardLane();
        } finally {
            this._editorZoomApplying = false;
        }
    },

    _markWidgetDirty: function (widgetOrId) {
        if (widgetOrId === undefined || widgetOrId === null) return;
        const id = typeof widgetOrId === 'string' ? widgetOrId : widgetOrId.id;
        if (typeof id !== 'string' || id === '') return;
        this._dirtyWidgetIds.add(id);
    },

    _markAllWidgetsDirty: function () {
        Object.keys(this.widgets || {}).forEach((id) => {
            this._dirtyWidgetIds.add(id);
        });
    },

    _CANVAS_ONLY_GLOBAL_KEYS: {
        canvasBg: true, canvasBgEnd: true, canvasBgOpacity: true, canvasBgEndOpacity: true,
        canvasBgType: true, canvasBgAngle: true, canvasImage: true, canvasBgOverlay: true,
        canvasBgSize: true, hideScrollbars: true, showGrid: true, gridSize: true,
        gridColor: true, gridOpacity: true, currentPageOutputTopic: true,
        warnWhenDriverOffline: true, preloadImagesOnAllPages: true,
        holdToActivateDuration: true,
        inactivityPageEnabled: true, inactivityReturnPage: true, inactivityTimeoutSeconds: true,
        dataDriver: true, driverSettings: true,
        snapToGrid: true, widgetLabelMode: true, editorMode: true,
        quickToolbar: true, quickToolbarVisibility: true, editorZoom: true, canvasPreset: true,
        audioTopicMap: true, layoutScaleKeepAspect: true,
        theme: true
    },

    _SHARED_CHROME_GLOBAL_KEYS: {
        themeColors: true, fontFamily: true, defaultFsLabel: true, defaultColLabel: true,
        defaultCornerRadius: true, defaultPadding: true, defaultBorderWidth: true,
        defaultBorderOpacity: true, glowRadius: true, glowOpacity: true, glowColor: true,
        innerGlow: true, innerGlowColor: true, innerGlowOpacity: true,
        bgColStart: true, bgColEnd: true, bgBlur: true, borderColor: true, defaultWidth: true,
        defaultHeight: true, defaultLabelCase: true, defaultLabelBold: true,
        defaultLabelItalic: true, defaultTextAlign: true, layoutMode: true,
        canvasWidth: true, canvasHeight: true
    },

    _GLOBAL_KEY_TYPE_PREFIXES: [
        { prefix: 'defaultGauge', type: 'gauge' },
        { prefix: 'defaultClock', type: 'clock' },
        { prefix: 'defaultSlider', type: 'slider' },
        { prefix: 'defaultIconWidget', type: 'icon' },
        { prefix: 'defaultList', type: 'list' },
        { prefix: 'defaultGraph', type: 'graph' },
        { prefix: 'graph', type: 'graph' },
        { prefix: 'defaultBattery', type: 'battery' },
        { prefix: 'defaultArrow', type: 'arrow' },
        { prefix: 'arrow', type: 'arrow' },
        { prefix: 'gauge', type: 'gauge' },
        { prefix: 'clock', type: 'clock' },
        { prefix: 'batt', type: 'battery' },
        { prefix: 'defaultImage', type: 'image' },
        { prefix: 'defaultTextContentAnimation', type: 'text' },
        { prefix: 'textMd', type: 'text' },
        { prefix: 'menuDefault', type: 'menu' },
        { prefix: 'menuItem', type: 'menu' },
        { prefix: 'defaultSwitch', type: 'switch' },
        { prefix: 'switch', type: 'switch' },
        { prefix: 'lg', type: 'lightgrid' }
    ],

    _widgetTypeOf: function (w) {
        if (!w || typeof WidgetRegistry === 'undefined' || !WidgetRegistry.widgets) return null;
        const map = WidgetRegistry.widgets;
        const types = Object.keys(map);
        for (let i = 0; i < types.length; i++) {
            const Cls = map[types[i]];
            if (typeof Cls === 'function' && w instanceof Cls) return types[i];
        }
        return null;
    },

    _globalKeyWidgetType: function (key) {
        const prefixes = this._GLOBAL_KEY_TYPE_PREFIXES;
        for (let i = 0; i < prefixes.length; i++) {
            if (key.indexOf(prefixes[i].prefix) === 0) return prefixes[i].type;
        }
        return null;
    },

    _globalDirtyPlan: function (keys) {
        const list = Array.isArray(keys) ? keys : [];
        if (list.length === 0) return { mode: 'none', loadFonts: false };
        let loadFonts = false;
        const types = {};
        let unknown = false;
        for (let i = 0; i < list.length; i++) {
            const k = list[i];
            if (this._CANVAS_ONLY_GLOBAL_KEYS[k]) continue;
            if (k.indexOf('dialogBox') === 0 || k.indexOf('layoutResponsive') === 0) continue;
            if (k === 'currentPage') continue;
            if (this._SHARED_CHROME_GLOBAL_KEYS[k] || k === 'themeColors') {
                return { mode: 'all', loadFonts: true, visual: true };
            }
            if (k === 'fontFamily' || k.indexOf('Font') !== -1 || k.indexOf('Fam') !== -1) loadFonts = true;
            const t = this._globalKeyWidgetType(k);
            if (t) types[t] = true;
            else unknown = true;
        }
        if (unknown) return { mode: 'all', loadFonts: true };
        const typeList = Object.keys(types);
        if (typeList.length === 0) return { mode: 'none', loadFonts: loadFonts };
        return { mode: 'types', types: typeList, loadFonts: loadFonts };
    },

    _markWidgetsDirtyByTypes: function (types) {
        if (!types || types.length === 0) return;
        const want = {};
        for (let i = 0; i < types.length; i++) want[types[i]] = true;
        const widgets = this.widgets || {};
        const ids = Object.keys(widgets);
        for (let i = 0; i < ids.length; i++) {
            const w = widgets[ids[i]];
            const t = this._widgetTypeOf(w);
            if (t && want[t]) this._markWidgetDirty(w);
        }
    },

    /**
     * True when the viewer should keep this painted widget hidden.
     * Uses the display recorded at the last paint. Falls back to sparse overrides
     * only when that paint did not record one, so this stays off `get config`.
     */
    _paintedWidgetStaysHidden: function (w) {
        if (!w) return false;
        if (w._viewerPageDisplay === 'none') return true;
        if (w._viewerPageDisplay === 'block') return false;
        return !this._sparseWidgetChrome(w).visible;
    },

    /**
     * Show a widget that already has on-page DOM. Skips render() so a page change
     * does not rebuild every switch, label, and container. Visibility off stays
     * hidden; that decision was recorded on the widget at the last paint.
     */
    _showPaintedWidget: function (w) {
        const wrapper = w && w.elements && w.elements.wrapper;
        if (!wrapper) return;
        if (typeof this.isWidgetHiddenByGroupRuntime === 'function' && this.isWidgetHiddenByGroupRuntime(w.id)) {
            if (wrapper.style.display !== 'none') wrapper.style.display = 'none';
            return;
        }
        if (this._paintedWidgetStaysHidden(w)) {
            if (wrapper.style.display !== 'none') wrapper.style.display = 'none';
            return;
        }
        if (wrapper.style.display !== 'block') wrapper.style.display = 'block';
        if (typeof w.resumeFromBackground === 'function') w.resumeFromBackground();
    },

    /** Hide or restore chrome that lives outside the wrapper (no render, no config). */
    _syncWidgetPageChrome: function (w, onPage) {
        if (w && typeof w.syncPageCoverageChrome === 'function') w.syncPageCoverageChrome(!!onPage);
    },

    _cancelOffPageWarmup: function () {
        if (this._offPageWarmTimer) {
            clearTimeout(this._offPageWarmTimer);
            this._offPageWarmTimer = null;
        }
        this._offPageWarmRender = false;
    },

    /**
     * Current page is built during load. Other pages are filled in short idle slices
     * so the first visit can unhide them. Each slice hides the widget again before
     * returning, so nothing off-page is painted.
     */
    _scheduleOffPageWarmup: function () {
        this._cancelOffPageWarmup();
        this._offPageWarmQueue = this._buildOffPageWarmQueue();
        this._offPageWarmIndex = 0;
        if (!this._offPageWarmQueue.length) return;
        const self = this;
        this._offPageWarmTimer = setTimeout(function () {
            self._offPageWarmTimer = null;
            self._stepOffPageWarmup();
        }, 280);
    },

    _offPageWidgetNeedsWarm: function (id, w) {
        if (!w || w._offPageWarmSkipped || typeof w.render !== 'function') return false;
        if (!w.elements || !w.elements.wrapper) return false;
        if (w._onPagePainted && !w._hiddenContentStale) return false;
        if (typeof w.hasPageDependentState === 'function' && w.hasPageDependentState()) return false;
        if (typeof w._canSkipOffPageRender === 'function' && !w._canSkipOffPageRender()) return false;
        if (typeof this._widgetCoversActivePage === 'function' && this._widgetCoversActivePage(id, w)) return false;
        return true;
    },

    _buildOffPageWarmQueue: function () {
        const active = Math.max(1, parseInt(String(MASTER_SETTINGS && MASTER_SETTINGS.currentPage != null ? MASTER_SETTINGS.currentPage : 1), 10) || 1);
        const widgets = this.widgets || {};
        const ids = Object.keys(widgets);
        const ranked = [];
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const w = widgets[id];
            if (!this._offPageWidgetNeedsWarm(id, w)) continue;
            const raw = w.overrides && w.overrides.page != null ? w.overrides.page : '1';
            const page = (typeof WidgetPageSpec !== 'undefined' && typeof WidgetPageSpec.minPage === 'function')
                ? (parseInt(WidgetPageSpec.minPage(raw), 10) || 1)
                : (parseInt(String(raw), 10) || 1);
            ranked.push({ id: id, dist: Math.abs(page - active) });
        }
        ranked.sort(function (a, b) {
            if (a.dist !== b.dist) return a.dist - b.dist;
            return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
        });
        const queue = [];
        for (let j = 0; j < ranked.length; j++) queue.push(ranked[j].id);
        return queue;
    },

    _stepOffPageWarmup: function () {
        const queue = this._offPageWarmQueue || [];
        const widgets = this.widgets || {};
        const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        let index = this._offPageWarmIndex || 0;
        while (index < queue.length) {
            const id = queue[index];
            index += 1;
            const w = widgets[id];
            if (!this._offPageWidgetNeedsWarm(id, w)) continue;
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            if ((now - start) >= 10 && index > (this._offPageWarmIndex || 0) + 1) {
                index -= 1;
                break;
            }
            this._offPageWarmRender = true;
            try {
                w.render();
            } catch (err) {
                console.error('[Dashboard] Off-page warm failed:', id, err);
            }
            this._offPageWarmRender = false;
            const wrapper = w.elements && w.elements.wrapper;
            if (wrapper && wrapper.style.display !== 'none') wrapper.style.display = 'none';
            if (typeof w.pauseForBackground === 'function') w.pauseForBackground();
            this._syncWidgetPageChrome(w, false);
            if (!w._onPagePainted) w._offPageWarmSkipped = true;
        }
        this._offPageWarmIndex = index;
        if (index >= queue.length) return;
        const self = this;
        this._offPageWarmTimer = setTimeout(function () {
            self._offPageWarmTimer = null;
            self._stepOffPageWarmup();
        }, 48);
    },

    _flushDirtyWidgets: function (forceAtomic) {
        this._dirtyWidgetFlushScheduled = false;
        if (!this._dirtyWidgetIds || this._dirtyWidgetIds.size === 0) return;
        // Page reveals, responsive measure, and visual chrome (theme colors) must finish
        // in one turn so the browser paints once. Live data flushes yield so a click can
        // run between widgets.
        const atomic = forceAtomic === true || this._responsiveLayoutSyncRunning === true;
        const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const budgetMs = 14;
        const ids = Array.from(this._dirtyWidgetIds);
        this._dirtyWidgetIds.clear();
        let hasPageMovement = false;
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const widget = this.widgets && this.widgets[id];
            if (widget && typeof widget.render === 'function') {
                const isOnPage = (typeof this._widgetCoversActivePage === 'function')
                    ? this._widgetCoversActivePage(id, widget)
                    : true;
                if (!isOnPage) {
                    if (widget._onPagePainted) widget._hiddenContentStale = true;
                    if (widget.elements && widget.elements.wrapper && widget.elements.wrapper.style.display !== 'none') {
                        widget.elements.wrapper.style.display = 'none';
                        hasPageMovement = true;
                        if (typeof widget._syncEditLabelDisplay === 'function') widget._syncEditLabelDisplay();
                    }
                    if (typeof widget.pauseForBackground === 'function') widget.pauseForBackground();
                    this._syncWidgetPageChrome(widget, false);
                } else {
                    const wasHidden = widget.elements && widget.elements.wrapper && widget.elements.wrapper.style.display === 'none';
                    try {
                        widget.render();
                        const isNowHidden = widget.elements && widget.elements.wrapper && widget.elements.wrapper.style.display === 'none';
                        if (wasHidden !== isNowHidden) {
                            hasPageMovement = true;
                            if (wasHidden && !isNowHidden) {
                                if (typeof widget.resumeFromBackground === 'function') widget.resumeFromBackground();
                                this._syncWidgetPageChrome(widget, true);
                            } else if (!wasHidden && isNowHidden) {
                                if (typeof widget.pauseForBackground === 'function') widget.pauseForBackground();
                                this._syncWidgetPageChrome(widget, false);
                            }
                        }
                    } catch (err) {
                        console.error('[Dashboard] Widget render failed:', id, err);
                    }
                }
            }
            if (!atomic && (i + 1) < ids.length) {
                const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                if ((now - start) >= budgetMs) {
                    for (let j = i + 1; j < ids.length; j++) this._dirtyWidgetIds.add(ids[j]);
                    this._scheduleDirtyWidgetFlush();
                    return;
                }
            }
        }
        if (hasPageMovement && this._isResponsiveLayoutMode && this._isResponsiveLayoutMode()
                && typeof this._requestResponsiveReflow === 'function') {
            this._requestResponsiveReflow();
        }
    },

    _scheduleDirtyWidgetFlush: function () {
        if (this._dirtyWidgetFlushScheduled) return;
        this._dirtyWidgetFlushScheduled = true;
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => this._flushDirtyWidgets());
        } else {
            this._flushDirtyWidgets();
        }
    },

    /**
     * Theme colors and other shared chrome paint the visible page in one turn.
     * Hidden pages are only marked stale here. Idle warmup refreshes them afterward
     * so the next visit can unhide. Live topic flushes stay on the 14ms slice.
     */
    _scheduleVisualChromeFlush: function () {
        if (this._visualChromeFlushScheduled) return;
        this._visualChromeFlushScheduled = true;
        const self = this;
        const run = function () {
            self._visualChromeFlushScheduled = false;
            const hadDirty = !!(self._dirtyWidgetIds && self._dirtyWidgetIds.size > 0);
            self._flushDirtyWidgets(true);
            if (hadDirty) self._scheduleOffPageWarmup();
        };
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(run);
        } else {
            run();
        }
    },

    /** Lazily built reverse index: topic -> Set of widget ids (see BaseWidget.getStaticTopicInterests). */
    invalidateTopicIndex: function () {
        this._topicWidgetIndex = null;
        this._dynamicTopicWidgetIds = null;
        this._duplicatePayloadWidgetIds = null;
    },

    /**
     * True when `next` would change which widgets list `topic`'s markdown `{{tokens}}`.
     * The index must already exist. Plain values with no braces do not rebuild it.
     */
    _markdownTopicIndexNeedsRebuild: function (topic, previous, next) {
        if (!this._topicWidgetIndex || topic == null || topic === '') return false;
        const subs = this._topicWidgetIndex.get(topic);
        if (!subs || subs.size === 0) return false;
        let stale = false;
        subs.forEach((id) => {
            if (stale) return;
            const w = this.widgets[id];
            if (!w || typeof w.liveMarkdownTopicsDependOn !== 'function' || !w.liveMarkdownTopicsDependOn(topic)) return;
            if (typeof w.markdownTopicSignatureForPayload !== 'function') return;
            if (w.markdownTopicSignatureForPayload(previous) !== w.markdownTopicSignatureForPayload(next)) stale = true;
        });
        return stale;
    },

    _ensureTopicIndex: function () {
        if (this._topicWidgetIndex) return;
        const index = new Map();
        const dynamicIds = [];
        const duplicateIds = [];
        const rawAdd = function (topic, id) {
            if (topic == null || topic === '') return;
            let set = index.get(topic);
            if (!set) {
                set = new Set();
                index.set(topic, set);
            }
            set.add(id);
        };
        const add = function (topic, id) {
            rawAdd(topic, id);
            const alias = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function')
                ? HomeyTopicAlias.aliasOf(topic)
                : null;
            if (alias) rawAdd(alias, id);
        };
        Object.values(this.widgets || {}).forEach((w) => {
            if (!w) return;
            if (typeof w.getStaticTopicInterests === 'function') {
                w.getStaticTopicInterests().forEach((t) => add(t, w.id));
            }
            if (typeof w.collectLiveMarkdownTopicPaths === 'function') {
                const livePaths = w.collectLiveMarkdownTopicPaths();
                if (livePaths && livePaths.length) {
                    for (let li = 0; li < livePaths.length; li++) add(livePaths[li], w.id);
                }
            }
            if (typeof w.hasDynamicTopicInterests === 'function' && w.hasDynamicTopicInterests()) {
                dynamicIds.push(w.id);
            }
            if (typeof w.wantsDuplicateTopicPayloads === 'function' && w.wantsDuplicateTopicPayloads()) {
                duplicateIds.push(w.id);
            }
        });
        this._topicWidgetIndex = index;
        this._dynamicTopicWidgetIds = dynamicIds;
        this._duplicatePayloadWidgetIds = duplicateIds;
    },

    /**
     * Widgets interested in `topic`: O(subscribers) via the reverse index.
     * Live markdown `{{topic}}` tokens are part of that index. The dynamic list is only
     * for widgets whose interests still cannot be indexed. Matching must not call `get config`.
     */
    _widgetIdsForTopic: function (topic) {
        this._ensureTopicIndex();
        const ids = [];
        const seen = new Set();
        const subs = this._topicWidgetIndex.get(topic);
        if (subs) {
            subs.forEach((id) => {
                seen.add(id);
                ids.push(id);
            });
        }
        const altTopic = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function')
            ? HomeyTopicAlias.aliasOf(topic)
            : null;
        if (altTopic) {
            const altSubs = this._topicWidgetIndex.get(altTopic);
            if (altSubs) {
                altSubs.forEach((id) => {
                    if (!seen.has(id)) {
                        seen.add(id);
                        ids.push(id);
                    }
                });
            }
        }
        for (let i = 0; i < this._dynamicTopicWidgetIds.length; i++) {
            const id = this._dynamicTopicWidgetIds[i];
            if (seen.has(id)) continue;
            const w = this.widgets[id];
            if (!w) continue;
            if (typeof BindingsTree !== 'undefined' && (BindingsTree.widgetWantsTopic(w, topic) || (altTopic && BindingsTree.widgetWantsTopic(w, altTopic)))) {
                seen.add(id);
                ids.push(id);
            }
        }
        return ids;
    },

    _applyLiveUpdateToWidget: function (w, topic, payload, count, skipTargeted) {
        if (!w) return;
        try {
            if (!skipTargeted && typeof w.onLiveTopicUpdate === 'function'
                    && w.onLiveTopicUpdate(topic, payload, count) === true) {
                return;
            }
            if (typeof w.onIncomingData === 'function') {
                w.onIncomingData(topic, payload, count);
            }
            this._markWidgetDirty(w);
        } catch (err) {
            console.error('[Dashboard] Widget live update failed:', w.id, err);
        }
    },

    _dispatchIncomingTopicToWidgets: function (topic, payload, count) {
        const ids = this._widgetIdsForTopic(topic);
        for (let i = 0; i < ids.length; i++) {
            this._applyLiveUpdateToWidget(this.widgets[ids[i]], topic, payload, count, false);
        }
        this._scheduleDirtyWidgetFlush();
    },

    _getViewerSecurityToken: function () {
        const cfg = window.APP_CONFIG;
        if (cfg && cfg.requireToken && cfg.securityToken) {
            return String(cfg.securityToken);
        }
        try {
            const urlToken = new URL(window.location.href).searchParams.get('token');
            if (urlToken) return urlToken;
        } catch (e) { }
        return null;
    },

    _authenticatedAssetUrl: function (relativePath) {
        const token = this._getViewerSecurityToken();
        if (!token) return relativePath;
        const sep = relativePath.indexOf('?') >= 0 ? '&' : '?';
        return relativePath + sep + 'token=' + encodeURIComponent(token);
    },

    mergeLocationQuery: function (queryHref) {
        const url = new URL(window.location.href);
        const raw = String(queryHref || '');
        const qs = raw.startsWith('?') ? raw.slice(1) : raw;
        if (!qs) return url.toString();
        const incoming = new URLSearchParams(qs);
        incoming.forEach(function (value, key) {
            url.searchParams.set(key, value);
        });
        return url.toString();
    },

    buildViewerUrl: function () {
        const host = window.location.host || 'localhost';
        const protocol = window.location.protocol || 'http:';
        const params = new URLSearchParams();
        const name = this.activeFileName;
        if (name) {
            params.set('dashboard', name);
        }
        const token = this._getViewerSecurityToken();
        if (token) {
            params.set('token', token);
        }
        const qs = params.toString();
        const path = '/viewer.html' + (qs ? '?' + qs : '');
        return {
            href: protocol + '//' + host + path,
            display: host + path
        };
    },

    updateViewerUrlIndicator: function () {
        const linkEl = document.getElementById('dashboard-viewer-url-link');
        if (!linkEl) return;
        const copyBtn = document.getElementById('btn-copy-viewer-url');
        const fieldEl = linkEl.closest ? linkEl.closest('.dashboard-viewer-url-field') : null;

        if (!this.activeFileName) {
            linkEl.removeAttribute('href');
            linkEl.textContent = 'Save page first';
            linkEl.title = 'Save the page first to generate a viewer URL';
            linkEl.setAttribute('aria-disabled', 'true');
            if (copyBtn) {
                copyBtn.disabled = true;
                copyBtn.title = 'Save the page first to copy viewer URL';
            }
            if (fieldEl) {
                fieldEl.classList.add('is-disabled');
            }
            return;
        }

        if (fieldEl) {
            fieldEl.classList.remove('is-disabled');
        }
        if (copyBtn) {
            copyBtn.disabled = false;
            copyBtn.title = 'Copy viewer URL';
        }
        linkEl.removeAttribute('aria-disabled');
        const url = this.buildViewerUrl();
        linkEl.href = url.href;
        linkEl.textContent = url.display;
        linkEl.title = url.href;
    },

    copyViewerUrlToClipboard: async function () {
        if (!this.activeFileName) {
            if (typeof CustomDialog !== 'undefined') {
                await CustomDialog.alert('Please save the page first to copy the viewer URL.', 'Save Required');
            }
            return;
        }
        const btn = document.getElementById('btn-copy-viewer-url');
        const icon = btn ? btn.querySelector('i') : null;
        const url = this.buildViewerUrl();
        try {
            await this._copyTextToSystemClipboard(url.href);
            if (icon) {
                const prevClass = icon.className;
                icon.className = 'ph-bold ph-check text-green-500';
                setTimeout(function () {
                    icon.className = prevClass;
                }, 1500);
            }
        } catch (e) {
            if (typeof CustomDialog !== 'undefined') {
                await CustomDialog.alert('Copy failed. Select the URL and copy manually.', 'Copy Failed');
            }
        }
    },

    updateFileIndicator: function () {
        const nameEl = document.getElementById('dashboard-filename-text');
        const tagEl  = document.getElementById('dashboard-file-tag');
        if (!nameEl || !tagEl) return;

        const name  = this.activeFileName || null;
        const dirty = this.hasUnsavedChanges;

        nameEl.textContent = name || 'Untitled';

        if (!name && !dirty) {
            tagEl.textContent = '';
            tagEl.className   = 'header-tag file-status-tag hidden';
        } else if (!name && dirty) {
            tagEl.textContent = 'Draft';
            tagEl.className   = 'header-tag file-status-tag tag-draft';
        } else if (name && dirty) {
            tagEl.textContent = 'Edited';
            tagEl.className   = 'header-tag file-status-tag tag-edited';
        } else {
            tagEl.textContent = 'Saved';
            tagEl.className   = 'header-tag file-status-tag tag-saved';
        }

        this.updateViewerUrlIndicator();
    },

    hasUndo: function () {
        return (this.history.undoStack || []).length > 0;
    },

    hasRedo: function () {
        return (this.history.redoStack || []).length > 0;
    },

    _cloneJson: function (value) {
        if (value === undefined) return undefined;
        return JSON.parse(JSON.stringify(value));
    },

    _pickObjectKeys: function (source, keys) {
        const out = {};
        (keys || []).forEach(key => {
            out[key] = this._cloneJson(source ? source[key] : undefined);
        });
        return out;
    },

    _isEqualJson: function (a, b) {
        return this._isSameLivePayload(a, b);
    },

    _getWidgetTypeByInstance: function (widget) {
        if (!widget) return null;
        return Object.keys(WidgetRegistry.widgets).find(key => widget instanceof WidgetRegistry.widgets[key]) || null;
    },

    _masterBaselineForWidgetMerge: function (data) {
        const plugin = WidgetRegistry.getGlobalSettings();
        let fromFile = {};
        if (data && data.master && typeof MasterLayout !== 'undefined' && typeof MasterLayout.expandMasterToFlat === 'function') {
            fromFile = MasterLayout.expandMasterToFlat(data.master);
        } else if (data && data.master && typeof data.master === 'object') {
            fromFile = { ...data.master };
        }
        return { ...plugin, ...fromFile };
    },

    _collectDashboardImageUrls: function (data) {
        try {
            const set = new Set();
            const master = data && data.master;
            let canvasImage = '';
            if (master && typeof master === 'object') {
                if (typeof master.canvasImage === 'string') canvasImage = master.canvasImage;
                else if (master.environment && typeof master.environment.canvasImage === 'string') {
                    canvasImage = master.environment.canvasImage;
                }
            }
            if (canvasImage) {
                const t = canvasImage.trim();
                if (t) set.add(t);
            }
            const masterBaseline = this._masterBaselineForWidgetMerge(data);
            const addFromRecord = (wData, widgetId) => {
                if (!wData || typeof wData !== 'object') return;
                let type = wData.type;
                if (type === 'textbox') type = 'list';
                const o = wData.overrides;
                if (!o || typeof o !== 'object') return;
                if (this.isWidgetHidden(type)) return;
                const WidgetClass = WidgetRegistry.get(type);
                const forExtract = WidgetClass
                    ? BaseWidget.buildMergedOverridesForSeed(WidgetClass, widgetId, o, masterBaseline)
                    : o;
                WidgetRegistry.collectPreloadImageUrlsFromOverrides(type, forExtract).forEach(u => set.add(u));
            };
            if (data.widgets && typeof data.widgets === 'object') {
                Object.keys(data.widgets).forEach(k => addFromRecord(data.widgets[k], k));
            }
            if (data.groups && typeof data.groups === 'object') {
                Object.keys(data.groups).forEach(gid => {
                    const g = data.groups[gid];
                    if (!g || typeof g !== 'object' || !g.widgets || typeof g.widgets !== 'object') return;
                    Object.keys(g.widgets).forEach(wid => addFromRecord(g.widgets[wid], wid));
                });
            }
            return Array.from(set);
        } catch (err) {
            console.warn('[Dashboard] collect image URLs failed:', err);
            return [];
        }
    },

    _collectDashboardImageUrlsFromWidgets: function () {
        try {
            const set = new Set();
            const bg = MASTER_SETTINGS && typeof MASTER_SETTINGS.canvasImage === 'string'
                ? MASTER_SETTINGS.canvasImage.trim()
                : '';
            if (bg) set.add(bg);
            Object.keys(this.widgets || {}).forEach(id => {
                const widget = this.widgets[id];
                if (!widget) return;
                const type = this._getWidgetTypeByInstance(widget);
                if (!type) return;
                const o = widget.overrides;
                if (!o || typeof o !== 'object') return;
                WidgetRegistry.collectPreloadImageUrlsFromOverrides(type, o).forEach(u => set.add(u));
            });
            return Array.from(set);
        } catch (err) {
            console.warn('[Dashboard] collect image URLs from widgets failed:', err);
            return [];
        }
    },

    _preloadImageUrl: function (url) {
        return new Promise((resolve) => {
            if (typeof url !== 'string') {
                resolve();
                return;
            }
            const trimmed = url.trim();
            if (!trimmed) {
                resolve();
                return;
            }
            try {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve();
                img.src = trimmed;
            } catch (e) {
                resolve();
            }
        });
    },

    _runDashboardImagePreload: function (urls) {
        if (MASTER_SETTINGS.preloadImagesOnAllPages !== true) return;
        if (!urls || urls.length === 0) return;
        const self = this;
        const concurrency = 5;
        let index = 0;
        const runBatch = () => {
            if (index >= urls.length) return;
            const batch = urls.slice(index, index + concurrency);
            index += batch.length;
            Promise.all(batch.map(u => self._preloadImageUrl(u))).then(runBatch).catch(() => runBatch());
        };
        runBatch();
    },

    _offsetArrowOverrides: function (overrides, dx, dy) {
        if (!overrides || typeof overrides !== 'object') return;
        let ddx = Number(dx);
        let ddy = Number(dy);
        if (!Number.isFinite(ddx)) ddx = 0;
        if (!Number.isFinite(ddy)) ddy = 0;
        if (ddx === 0 && ddy === 0) return;

        if (Number.isFinite(Number(overrides.fromX))) overrides.fromX = Number(overrides.fromX) + ddx;
        if (Number.isFinite(Number(overrides.fromY))) overrides.fromY = Number(overrides.fromY) + ddy;
        if (Number.isFinite(Number(overrides.toX))) overrides.toX = Number(overrides.toX) + ddx;
        if (Number.isFinite(Number(overrides.toY))) overrides.toY = Number(overrides.toY) + ddy;

        const pts = overrides.customPoints;
        if (!Array.isArray(pts) || pts.length === 0) return;
        overrides.customPoints = pts.map(pt => {
            if (!pt || typeof pt !== 'object') return pt;
            const out = { ...pt };
            if (Number.isFinite(Number(out.x))) out.x = Number(out.x) + ddx;
            if (Number.isFinite(Number(out.y))) out.y = Number(out.y) + ddy;
            if (out._rawX !== undefined && Number.isFinite(Number(out._rawX))) out._rawX = Number(out._rawX) + ddx;
            if (out._rawY !== undefined && Number.isFinite(Number(out._rawY))) out._rawY = Number(out._rawY) + ddy;
            return out;
        });
    },

    _serializeWidgetById: function (id) {
        const widget = this.widgets[id];
        if (!widget) return null;
        const type = this._getWidgetTypeByInstance(widget);
        if (!type) return null;
        return {
            id: id,
            type: type,
            overrides: this._overridesForPersist(type, id, widget.overrides || {}),
            bindings: this._persistBindings(widget.bindings || {})
        };
    },

    _persistBindings: function (bindings) {
        const out = this._cloneJson(bindings || {}) || {};
        if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.stripMenuRowAudio === 'function') {
            SaveFormatV2.stripMenuRowAudio(out);
        }
        return this._cleanObject(out);
    },

    _restoreWidgetState: function (state) {
        if (!state || !state.id || !state.type) return;
        if (this.widgets[state.id]) {
            this.widgets[state.id].destroy();
            delete this.widgets[state.id];
        }
        this.createWidget(state.type, state.id, this._cloneJson(state.overrides || {}), this._cloneJson(state.bindings || {}), true);
    },

    _deleteWidgetById: function (id) {
        if (!this.widgets[id]) return;
        this.widgets[id].destroy();
        delete this.widgets[id];
    },

    _setEditorToolDisabled: function (el, disabled) {
        if (!el) return;
        if (typeof Editor !== 'undefined' && typeof Editor._setChromeDisabled === 'function') {
            Editor._setChromeDisabled(el, disabled);
            return;
        }
        const on = !!disabled;
        el.classList.toggle('is-disabled', on);
        el.classList.remove('opacity-50', 'pointer-events-none');
        if (on) el.setAttribute('aria-disabled', 'true');
        else el.removeAttribute('aria-disabled');
    },

    _refreshHistoryUiState: function () {
        this._setEditorToolDisabled(document.getElementById('toolbar-btn-undo'), !this.hasUndo());
        this._setEditorToolDisabled(document.getElementById('toolbar-btn-redo'), !this.hasRedo());
        if (typeof QuickToolbar !== 'undefined' && typeof QuickToolbar.refresh === 'function') {
            QuickToolbar.refresh();
        }
    },

    _compareVersions: function (left, right) {
        if (typeof DashboardMigrator !== 'undefined' && typeof DashboardMigrator.compareVersions === 'function') {
            return DashboardMigrator.compareVersions(String(left || '0.0.0'), String(right || '0.0.0'));
        }
        const parts1 = String(left || '0.0.0').split('.').map(Number);
        const parts2 = String(right || '0.0.0').split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            const a = Number.isFinite(parts1[i]) ? parts1[i] : 0;
            const b = Number.isFinite(parts2[i]) ? parts2[i] : 0;
            if (a < b) return -1;
            if (a > b) return 1;
        }
        return 0;
    },

    _isTextInputTarget: function (target) {
        if (!target) return false;
        if (target.isContentEditable) return true;
        const tagName = target.tagName ? target.tagName.toUpperCase() : '';
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) return true;
        return typeof target.closest === 'function' && !!target.closest('[contenteditable="true"]');
    },

    _isBackquoteKey: function (e) {
        return e && e.code === 'Backquote';
    },

    _isEditToggleShortcut: function (e) {
        if (!e || e.altKey || e.shiftKey) return false;
        return (e.ctrlKey || e.metaKey) && String(e.key || '').toLowerCase() === 'e';
    },

    _isSaveShortcut: function (e) {
        if (!e || e.altKey || e.shiftKey) return false;
        return (e.ctrlKey || e.metaKey) && String(e.key || '').toLowerCase() === 's';
    },

    _isHomeyPlatform: function () {
        const d = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS)
            ? String(MASTER_SETTINGS.dataDriver || '').toLowerCase()
            : '';
        const platformHomey = d === 'homey' || d === 'homeassistant';
        const activeType = (typeof DataDriverRegistry !== 'undefined' && typeof DataDriverRegistry.getType === 'function')
            ? DataDriverRegistry.getType()
            : '';
        const activeHomey = activeType === 'homey' || activeType === 'homeassistant';
        return !!(platformHomey || activeHomey);
    },

    /**
     * The editor boots with only the widget types this dashboard uses; the rest arrive in a
     * background batch that also completes the master defaults. Writing a file before that lands
     * would serialize from a partial registry, so the save entry points wait on it. The batch is
     * normally finished long before a save, and served from cache it costs nothing to await.
     */
    _whenEditorStackReady: function () {
        if (typeof WidgetScriptLoader === 'undefined'
            || typeof WidgetScriptLoader.whenEditorStackReady !== 'function') {
            return Promise.resolve();
        }
        return WidgetScriptLoader.whenEditorStackReady();
    },

    /**
     * Reconciles the parts of the editor that were built from a partial widget registry once the
     * background batch has registered the remaining types.
     */
    onEditorStackReady: function () {
        if (window.IS_VIEWER === true) return;

        // Fill in factory defaults for types that were not loaded yet, without touching any value
        // the dashboard file already supplied.
        if (typeof WidgetRegistry !== 'undefined' && typeof WidgetRegistry.getGlobalSettings === 'function') {
            const pluginSettings = WidgetRegistry.getGlobalSettings();
            Object.keys(pluginSettings).forEach(function (key) {
                if (!(key in MASTER_SETTINGS)) MASTER_SETTINGS[key] = pluginSettings[key];
            });
        }

        this.populateAddWidgetMenu();
        this.initTemplateDropdown();

        if (typeof Editor !== 'undefined' && Editor.currentId === 'GLOBAL_SETTINGS'
            && typeof Editor.loadWidget === 'function') {
            Editor.loadWidget('GLOBAL_SETTINGS');
        }
    },

    /**
     * A dashboard file and the widget classes only carry the keys they set. After a load,
     * put back any code default that neither of those supplied so the master inspector
     * matches the factory snapshot instead of showing every omitted setting as changed.
     */
    _restoreMissingMasterCodeDefaults: function () {
        const snap = MASTER_CODE_DEFAULTS;
        if (!snap) return;
        const keys = Object.keys(snap);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (Object.prototype.hasOwnProperty.call(MASTER_SETTINGS, key)) continue;
            const val = snap[key];
            if (val !== null && typeof val === 'object') {
                try {
                    MASTER_SETTINGS[key] = JSON.parse(JSON.stringify(val));
                } catch (e) {
                    MASTER_SETTINGS[key] = Array.isArray(val) ? val.slice() : Object.assign({}, val);
                }
            } else {
                MASTER_SETTINGS[key] = val;
            }
        }
    },

    _openSaveOrExportDialog: async function () {
        await this._whenEditorStackReady();
        if (this._isHomeyPlatform() && typeof ServerFileManager !== 'undefined'
            && typeof ServerFileManager.open === 'function') {
            void ServerFileManager.open('dashboards', 'save');
            return;
        }
        this.exportDashboardLocal();
    },

    _isBlockingOverlayOpen: function () {
        const iconModal = document.getElementById('icon-modal');
        if (iconModal && iconModal.classList.contains('open')) return true;
        const galleryModal = document.getElementById('gallery-modal');
        if (galleryModal && galleryModal.classList.contains('show')) return true;
        const fileModal = document.getElementById('file-modal');
        if (fileModal && fileModal.classList.contains('show')) return true;
        const customDialog = document.getElementById('custom-dialog');
        if (customDialog && customDialog.classList.contains('show')) return true;
        if (typeof TextFullEditor !== 'undefined' && typeof TextFullEditor.isOpen === 'function' && TextFullEditor.isOpen()) {
            return true;
        }
        return false;
    },

    _clearEditGestures: function () {
        this._setDragState(null);
        this.lasso = null;
        while (this._editPointerGestureDepth > 0) {
            this._endEditPointerGesture();
        }
    },

    _setDragState: function (state) {
        this.dragState = state;
        const canvas = document.getElementById('dashboard-canvas');
        if (!canvas || !canvas.classList) return;
        if (state) {
            if (!canvas.classList.contains('ds-edit-dragging')) {
                canvas.classList.add('ds-edit-dragging');
            }
        } else if (canvas.classList.contains('ds-edit-dragging')) {
            canvas.classList.remove('ds-edit-dragging');
        }
    },

    _applyEditModeVisuals: function () {
        const keepEditorLayout = this._holdLivePreviewActive && this._holdLivePreviewKeepEditor;
        document.body.classList.toggle('edit-mode', this.isEditMode || keepEditorLayout);
        document.body.classList.toggle('hold-live-preview', this._holdLivePreviewActive);
        document.body.classList.toggle('hold-live-keep-editor', keepEditorLayout);
        this._syncGroupBackdropOverlays();
        if (MASTER_SETTINGS && MASTER_SETTINGS.layoutMode === 'scale') {
            this._applyLayoutMode();
        } else {
            this._applyEditorZoom();
        }
        const activePage = Math.max(1, parseInt(String(MASTER_SETTINGS.currentPage != null ? MASTER_SETTINGS.currentPage : 1), 10) || 1);
        const widgets = this.widgets || {};
        const widgetKeys = Object.keys(widgets);
        for (let i = 0; i < widgetKeys.length; i++) {
            const w = widgets[widgetKeys[i]];
            if (!w) continue;
            const isOnPage = (typeof this._widgetCoversActivePage === 'function')
                ? this._widgetCoversActivePage(w.id, w)
                : true;
            if (isOnPage) {
                if (typeof w._syncEditModeVisuals === 'function') {
                    w._syncEditModeVisuals();
                } else {
                    w.render();
                }
            }
        }
        this._updateUniversalActionButtons();
        this._syncEditModeDashboardLane();
        if (typeof QuickToolbar !== 'undefined' && typeof QuickToolbar.apply === 'function') {
            QuickToolbar.apply();
        }
    },

    _readEditorGutterPx: function () {
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--editor-gutter');
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : 16;
    },

    _readEditorPanelWidthPx: function () {
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--editor-panel-width');
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 400;
    },

    _clearEditModeDashboardLaneInsets: function () {
        const root = document.documentElement;
        root.style.removeProperty('--dashboard-stage-pad-left');
        root.style.removeProperty('--dashboard-stage-pad-right');
        document.body.classList.remove('dashboard-canvas-overscan');
        document.body.classList.remove('dashboard-canvas-under-editor');
        document.body.classList.remove('dashboard-canvas-under-help');
        document.body.classList.remove('dashboard-canvas-overflow-y');
        this._editModeLaneLastPadLeft = '';
        this._editModeLaneLastPadRight = '';
        this._editModeLaneLastScroll = undefined;
        this._editModeLaneLastScrollY = undefined;
        this._laneYLock = false;
        this._laneYLockCanvasH = undefined;
        this._laneYLockEdit = undefined;
        this._laneYUserMoved = false;
    },

    /**
     * Screen X where a docked Quick Toolbar ends, including its resize strip.
     * Uses layout width, so auto-hide (slide in and out) does not change the number.
     * Never Visible and a floating toolbar reserve nothing.
     */
    _editModeToolbarClearEdge: function (wrapper) {
        if (typeof QuickToolbar === 'undefined' || !QuickToolbar.getPrefs) return 0;
        const prefs = QuickToolbar.getPrefs();
        if (!prefs || prefs.visibility === 'never' || prefs.mode === 'floating') return 0;
        if (prefs.visibility !== 'always' && prefs.visibility !== 'auto') return 0;
        const shell = document.getElementById('quick-toolbar-shell');
        const clip = document.getElementById('quick-toolbar-clip');
        if (!shell || !clip) return 0;
        const shellW = shell.offsetWidth;
        if (!(shellW > 0)) return 0;
        const origin = wrapper.getBoundingClientRect().left;
        const clipLeft = clip.getBoundingClientRect().left - origin;
        if (!isFinite(clipLeft)) return 0;
        return Math.round(clipLeft + shellW + 10);
    },

    /**
     * Place the fixed canvas in the unused space.
     * Edit mode: center in the gap between editor and help; overflow slides under
     * help first, then under the editor; when the canvas is wider than the window
     * it stays centered so both sides clip equally.
     * When that resting place still sits under the editor or a docked Quick Toolbar,
     * extra scroll room lets the canvas slide right until its left edge clears them.
     * The resting crop does not move. Toolbar auto-hide does not change that room.
     * Viewer / live: same horizontal centering with no editor or help lanes.
     * A canvas taller than the window is parked in the vertical middle once.
     * After that the scroll position is left alone, including when iPad Safari
     * resizes the visual viewport as the toolbar shows and hides.
     */
    _syncEditModeDashboardLane: function () {
        const body = document.body;
        const root = document.documentElement;
        const wrapper = document.getElementById('dashboard-wrapper');
        const canvas = document.getElementById('dashboard-canvas');

        if (!wrapper || !canvas) {
            this._clearEditModeDashboardLaneInsets();
            return;
        }

        const canvasWidthSetting = Number(MASTER_SETTINGS.canvasWidth) || 0;
        const layoutMode = (MASTER_SETTINGS.layoutMode || 'fixed');
        if (canvasWidthSetting <= 0 || layoutMode === 'responsive' || layoutMode === 'scale') {
            this._clearEditModeDashboardLaneInsets();
            return;
        }

        const isEdit = body.classList.contains('edit-mode');
        let editorLane = 0;
        let helpLane = 0;
        let clearEdge = 0;
        if (isEdit) {
            const gutter = this._readEditorGutterPx();
            const editor = document.getElementById('editor-panel');
            let editorW = editor ? editor.offsetWidth : 0;
            if (!(editorW > 0)) editorW = this._readEditorPanelWidthPx();
            editorLane = editorW + gutter * 2;
            clearEdge = editorLane;
            if (editor && editor.offsetWidth > 0) {
                const origin = wrapper.getBoundingClientRect().left;
                const editorRect = editor.getBoundingClientRect();
                const inset = editorRect.left - origin;
                const edge = (editorRect.right - origin) + (inset > 0 ? inset : 0);
                if (edge > clearEdge) clearEdge = edge;
            }
            const toolbarEdge = this._editModeToolbarClearEdge(wrapper);
            if (toolbarEdge > clearEdge) clearEdge = toolbarEdge;
            if (body.classList.contains('help-open')) {
                const helpRaw = getComputedStyle(root).getPropertyValue('--help-panel-active-width');
                const helpW = parseFloat(helpRaw) || 0;
                helpLane = helpW + gutter * 2;
            }
        }

        const viewportW = wrapper.clientWidth;
        if (!(viewportW > 0)) return;

        const canvasW = (isEdit && this._editorZoomScale > 0 && this._editorZoomScale !== 1)
            ? (canvasWidthSetting * this._editorZoomScale)
            : canvasWidthSetting;
        const remaining = viewportW - editorLane - helpLane;
        let left = editorLane + (remaining - canvasW) / 2;
        if (left < editorLane) left = editorLane;
        if (left + canvasW > viewportW) left = viewportW - canvasW;

        const overscan = left < 0;
        const visualLeft = overscan ? ((viewportW - canvasW) / 2) : left;
        let padLeftPx = overscan ? 0 : Math.max(0, left);
        let padRightPx = overscan ? 0 : Math.max(0, viewportW - left - canvasW);
        let targetScrollX = overscan ? Math.max(0, (canvasW - viewportW) / 2) : 0;
        // Scroll already stops when a canvas edge meets the window. Anything still
        // under the editor cannot move further right. Pad by that shortfall and
        // park the scroll so the resting frame stays put.
        if (clearEdge > 0) {
            const minScreenX = overscan ? 0 : visualLeft;
            if (minScreenX < clearEdge) {
                const clearance = clearEdge - minScreenX;
                padLeftPx += clearance;
                targetScrollX += clearance;
            }
        }
        const padLeft = padLeftPx + 'px';
        const padRight = padRightPx + 'px';
        const canvasH = Number(MASTER_SETTINGS.canvasHeight) || 0;
        const viewportH = wrapper.clientHeight;
        // Tall fixed canvases must start at the top of the stage. align-items:center
        // overflows upward, and WebKit will not scroll to that top, so the parked
        // offset is the bottom of the reachable range.
        const canvasOverflowY = canvasH > 0 && viewportH > 0 && canvasH > viewportH;
        if (body.classList.contains('dashboard-canvas-overflow-y') !== canvasOverflowY) {
            body.classList.toggle('dashboard-canvas-overflow-y', canvasOverflowY);
        }
        const targetScrollY = (!isEdit && canvasOverflowY)
            ? Math.max(0, (canvasH - viewportH) / 2)
            : (isEdit ? undefined : 0);
        // Park vertical scroll once per canvas height and edit/viewer switch.
        // Later visualViewport resizes (iPad toolbar) must not write scrollTop again.
        const lockStale = this._laneYLockCanvasH !== canvasH || this._laneYLockEdit !== isEdit;
        if (lockStale) {
            this._laneYLock = false;
            this._laneYUserMoved = false;
        }
        let applyScrollY;
        if (isEdit || !(viewportH > 0)) {
            applyScrollY = undefined;
        } else if (this._laneYLock) {
            applyScrollY = undefined;
        } else {
            applyScrollY = targetScrollY;
            this._laneYLock = true;
            this._laneYLockCanvasH = canvasH;
            this._laneYLockEdit = isEdit;
        }
        const wasOverscan = body.classList.contains('dashboard-canvas-overscan');
        // Once vertical scroll is parked, a viewport-only change (iPad toolbar)
        // must not enter the write path. Assigning scrollLeft during a touch
        // scroll cancels the gesture.
        const verticalSettled = applyScrollY === undefined && this._laneYLock === true;

        if (!overscan && !wasOverscan
            && this._editModeLaneLastPadLeft === padLeft
            && this._editModeLaneLastPadRight === padRight
            && this._editModeLaneLastScroll === targetScrollX
            && (verticalSettled || this._editModeLaneLastScrollY === targetScrollY)) {
            return;
        }

        const prevParkedScroll = this._editModeLaneLastScroll;
        const prevPadPx = parseFloat(this._editModeLaneLastPadLeft);
        root.style.setProperty('--dashboard-stage-pad-left', padLeft);
        root.style.setProperty('--dashboard-stage-pad-right', padRight);
        this._editModeLaneLastPadLeft = padLeft;
        this._editModeLaneLastPadRight = padRight;
        this._editModeLaneLastScroll = targetScrollX;
        this._editModeLaneLastScrollY = targetScrollY;
        body.classList.toggle('dashboard-canvas-overscan', overscan);
        body.classList.remove('dashboard-canvas-under-editor');

        let applyScrollX = targetScrollX;
        if (prevParkedScroll !== undefined && wrapper.scrollLeft !== prevParkedScroll && isFinite(prevPadPx)) {
            applyScrollX = wrapper.scrollLeft + (padLeftPx - prevPadPx);
            if (applyScrollX < 0) applyScrollX = 0;
        }
        const self = this;
        const applyScroll = function () {
            if (wrapper.scrollLeft !== applyScrollX) wrapper.scrollLeft = applyScrollX;
            if (applyScrollY !== undefined && !self._laneYUserMoved && wrapper.scrollTop !== applyScrollY) {
                wrapper.scrollTop = applyScrollY;
            }
        };
        applyScroll();
        if (targetScrollX > 0 || overscan || wasOverscan || applyScrollY !== undefined) {
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(applyScroll);
            }
        }
    },

    _initEditModeDashboardLaneSync: function () {
        if (this._editModeLaneSyncBound) return;
        this._editModeLaneSyncBound = true;
        const self = this;
        const onSync = function () {
            if (self._editorZoomApplying) return;
            if (self._editorZoomScale !== 1) self._applyEditorZoom();
            else self._syncEditModeDashboardLane();
        };
        window.addEventListener('resize', onSync);
        if (window.visualViewport && typeof window.visualViewport.addEventListener === 'function') {
            window.visualViewport.addEventListener('resize', onSync);
        }
        const scrollWrapper = document.getElementById('dashboard-wrapper');
        if (scrollWrapper) {
            const markUserScroll = function () {
                if (self._laneYLock) self._laneYUserMoved = true;
            };
            scrollWrapper.addEventListener('wheel', markUserScroll, { passive: true });
            scrollWrapper.addEventListener('touchmove', markUserScroll, { passive: true });
        }
        if (typeof ResizeObserver !== 'undefined') {
            this._editModeLaneResizeObserver = new ResizeObserver(onSync);
            const wrapper = document.getElementById('dashboard-wrapper');
            const canvas = document.getElementById('dashboard-canvas');
            const editor = document.getElementById('editor-panel');
            if (wrapper) this._editModeLaneResizeObserver.observe(wrapper);
            if (canvas) this._editModeLaneResizeObserver.observe(canvas);
            if (editor) this._editModeLaneResizeObserver.observe(editor);
            const toolbarShell = document.getElementById('quick-toolbar-shell');
            if (toolbarShell) this._editModeLaneResizeObserver.observe(toolbarShell);
        }
    },

    enterHoldLivePreview: function (options) {
        if (window.IS_VIEWER === true) return;
        if (!this.isEditMode || this._holdLivePreviewActive) return;
        if (this._isBlockingOverlayOpen()) return;
        const keepEditor = !!(options && options.keepEditor);
        this._holdLivePreviewActive = true;
        this._holdLivePreviewKeepEditor = keepEditor;
        this._clearEditGestures();
        this.isEditMode = false;
        this._applyEditModeVisuals();
        this._syncInactivityPageWatch();
        this._syncGestureControls();
    },

    exitHoldLivePreview: function () {
        if (!this._holdLivePreviewActive) return;
        this._holdLivePreviewActive = false;
        this._holdLivePreviewKeepEditor = false;
        this.isEditMode = true;
        if (typeof DashboardDialog !== 'undefined' && DashboardDialog.dismiss) {
            DashboardDialog.dismiss();
        }
        this._applyEditModeVisuals();
        this._syncInactivityPageWatch();
        this._syncGestureControls();
    },

    _widgetMatchesPage: function (widgetPayload, pageNumber) {
        const overrides = (widgetPayload && widgetPayload.overrides) ? widgetPayload.overrides : {};
        if (typeof WidgetPageSpec !== 'undefined') {
            return WidgetPageSpec.coversPage(overrides.page, pageNumber);
        }
        const tokens = String(overrides.page || '')
            .split(',')
            .map(token => parseInt(String(token).trim(), 10))
            .filter(page => Number.isFinite(page) && page > 0)
            .map(page => String(page));
        const uniq = [...new Set(tokens)];
        if (uniq.length === 0) return true;
        return uniq.includes(String(pageNumber));
    },

    _generateUniqueWidgetId: function (type, reservedIds = new Set()) {
        const safeType = String(type || 'widget').replace(/[^a-zA-Z0-9_]/g, '') || 'widget';
        let candidate = '';
        let attempts = 0;
        do {
            candidate = `${safeType}_${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
            attempts += 1;
        } while ((this.widgets[candidate] || reservedIds.has(candidate)) && attempts < 2000);
        return candidate;
    },

    _buildClipboardSnippet: function () {
        const selectedIds = this.getEffectiveSelectionIds();
        if (selectedIds.length === 0) return null;

        const sourcePage = Math.max(1, Number(MASTER_SETTINGS.currentPage) || 1);
        const snippet = {
            snippetHeader: 'Dashboard Studio Snippet',
            snippetType: 'widget-snippet',
            snippetFormatVersion: 1,
            version: window.DASHBOARD_VERSION || '1.1.4',
            source: {
                dashboardName: this.activeFileName || 'Untitled',
                page: sourcePage,
                createdAt: new Date().toISOString()
            },
            master: {
                currentPage: sourcePage
            },
            widgets: {}
        };

        const selectedSet = new Set(selectedIds);
        const exportedGroupWidgetIds = new Set();
        Object.keys(this.groups || {}).forEach(groupId => {
            const sourceGroup = this.groups[groupId];
            if (!sourceGroup) return;
            const memberIds = this.getGroupMemberIds(groupId);
            if (memberIds.length < 2) return;
            const isGroupFullySelected = memberIds.every(id => selectedSet.has(id));
            if (!isGroupFullySelected) return;

            const nestedWidgets = {};
            memberIds.forEach(id => {
                const serialized = this._serializeWidgetById(id);
                if (!serialized) return;
                nestedWidgets[id] = {
                    type: serialized.type,
                    overrides: this._cleanObject(this._cloneJson(serialized.overrides || {})),
                    bindings: this._cleanObject(this._cloneJson(serialized.bindings || {}))
                };
            });
            if (Object.keys(nestedWidgets).length < 2) return;

            if (!snippet.groups) snippet.groups = {};
            snippet.groups[sourceGroup.id] = {
                id: sourceGroup.id,
                name: String(sourceGroup.name || sourceGroup.id),
                locked: sourceGroup.locked === true,
                visible: sourceGroup.visible !== false,
                bindings: this._cleanObject(this._cloneJson(this._sanitizeGroupBindingsForStorage(sourceGroup.bindings))),
                overridePage: this._normalizeGroupOverridePage(sourceGroup.overridePage),
                dimBackgroundWhenVisible: sourceGroup.dimBackgroundWhenVisible === true,
                widgets: nestedWidgets
            };
            const extras = this._groupExtrasForStorage(sourceGroup);
            if (extras.layout) snippet.groups[sourceGroup.id].layout = extras.layout;
            if (extras.composite) snippet.groups[sourceGroup.id].composite = extras.composite;
            memberIds.forEach(id => exportedGroupWidgetIds.add(id));
        });

        selectedIds.forEach(id => {
            const serialized = this._serializeWidgetById(id);
            if (!serialized) return;
            if (exportedGroupWidgetIds.has(id)) return;
            snippet.widgets[id] = {
                type: serialized.type,
                overrides: this._cleanObject(this._cloneJson(serialized.overrides || {})),
                bindings: this._cleanObject(this._cloneJson(serialized.bindings || {}))
            };
        });

        if (Object.keys(snippet.widgets).length === 0 && (!snippet.groups || Object.keys(snippet.groups).length === 0)) {
            return null;
        }

        const snippetGroupIds = this.collectSelectionGroupIdsFromSerializedDashboard(snippet);
        if (snippetGroupIds.size > 0) {
            snippet.selectionGroups = {};
            snippetGroupIds.forEach((id) => {
                snippet.selectionGroups[id] = {
                    allowEmptySelection: this.getSelectionGroupAllowEmpty(id)
                };
            });
        }

        return snippet;
    },

    _parseClipboardSnippet: function (rawSnippet) {
        if (rawSnippet === undefined || rawSnippet === null || rawSnippet === '') {
            return { ok: false, reason: 'Snippet is empty.' };
        }

        let data;
        if (typeof rawSnippet === 'object') {
            data = this._cloneJson(rawSnippet);
        } else {
            const trimmed = String(rawSnippet).trim();
            if (!trimmed) return { ok: false, reason: 'Snippet is empty.' };
            try {
                data = JSON.parse(trimmed);
            } catch (err) {
                // Allow pasted snippets wrapped in markdown/code fences by extracting JSON object block.
                const startIdx = trimmed.indexOf('{');
                const endIdx = trimmed.lastIndexOf('}');
                if (startIdx !== -1 && endIdx > startIdx) {
                    const candidate = trimmed.slice(startIdx, endIdx + 1);
                    try {
                        data = JSON.parse(candidate);
                    } catch (nestedErr) {
                        return { ok: false, reason: 'Snippet is not valid JSON.' };
                    }
                } else {
                    return { ok: false, reason: 'Snippet is not valid JSON.' };
                }
            }
        }

        if (!data || typeof data !== 'object') {
            return { ok: false, reason: 'Snippet data is not a valid object.' };
        }
        if (data.snippetHeader !== 'Dashboard Studio Snippet') {
            return { ok: false, reason: 'This file/text is not a Dashboard Studio Snippet.' };
        }

        const hasWidgets = data.widgets && typeof data.widgets === 'object' && Object.keys(data.widgets).length > 0;
        const hasGroups = data.groups && typeof data.groups === 'object' && Object.keys(data.groups).length > 0;
        if (!hasWidgets && !hasGroups) {
            return { ok: false, reason: 'Snippet does not contain any widgets to paste.' };
        }

        return { ok: true, data: data };
    },

    _hasInternalSnippetClipboard: function () {
        return !!(this.internalSnippetClipboard && this.internalSnippetClipboard.snippetHeader === 'Dashboard Studio Snippet');
    },

    _setInternalSnippetClipboard: function (snippet) {
        this.internalSnippetClipboard = this._cloneJson(snippet);
        this._updateUniversalActionButtons();
    },

    _copyTextToSystemClipboard: async function (text) {
        if (typeof Editor !== 'undefined' && typeof Editor.copyToClipboard === 'function') {
            await Editor.copyToClipboard(text);
            return true;
        }
        if (navigator.clipboard && window.isSecureContext && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text);
            return true;
        }
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!successful) throw new Error('copy failed');
        return true;
    },

    copySelectionToClipboard: async function () {
        if (!this.isEditMode) return false;
        const snippet = this._buildClipboardSnippet();
        if (!snippet) {
            await CustomDialog.alert('Select at least one widget before copying.', 'Nothing Selected');
            return false;
        }
        this._setInternalSnippetClipboard(snippet);
        return true;
    },

    cutSelectionToClipboard: async function () {
        if (!this.isEditMode) return false;
        const selection = this.getEffectiveSelectionIds();
        if (selection.length === 0) {
            await CustomDialog.alert('Select at least one widget before cutting.', 'Nothing Selected');
            return false;
        }

        const hasLocked = selection.some(id => this.isWidgetEffectivelyLocked(id));
        if (hasLocked) {
            await CustomDialog.alert('Cannot cut locked widgets. Unlock the selection first.', 'Action Blocked');
            return false;
        }

        const copied = await this.copySelectionToClipboard();
        if (!copied) return false;
        this.removeSelectedWidget();
        return true;
    },

    pasteFromClipboard: async function () {
        if (!this.isEditMode) return;
        if (!this._hasInternalSnippetClipboard()) {
            await CustomDialog.alert('Internal snippet clipboard is empty.\n\nCopy a widget selection first, or use Import Snippet.', 'Nothing To Paste');
            return;
        }
        await this._pasteSnippetData(this.internalSnippetClipboard);
    },

    exportSnippetLocal: async function () {
        if (!this.isEditMode) return;
        const snippet = this._buildClipboardSnippet();
        if (!snippet) {
            await CustomDialog.alert('Select at least one widget before exporting.', 'Nothing Selected');
            return;
        }
        this._setInternalSnippetClipboard(snippet);
        const snippetText = JSON.stringify(snippet, null, 2);
        await CustomDialog.codePrompt(
            'Copy and share this Dashboard Studio Snippet code.',
            snippetText,
            'Export Snippet',
            {
                readOnly: true,
                okLabel: 'Close',
                hideCancel: true,
                extraLabel: 'Copy',
                extraClassName: 'btn-tool ds-dialog-button primary justify-center',
                closeOnExtra: false,
                onExtra: async (value, buttonEl) => {
                    try {
                        await this._copyTextToSystemClipboard(value);
                        if (buttonEl) {
                            buttonEl.textContent = 'Copied';
                            buttonEl.disabled = true;
                            buttonEl.className = 'btn-tool ds-dialog-button justify-center opacity-50 pointer-events-none';
                        }
                    } catch (err) {
                        await CustomDialog.alert('Copy failed. Select the code and copy manually with Ctrl/Cmd+C.', 'Copy Failed');
                    }
                }
            }
        );
    },

    importSnippetLocal: async function () {
        if (!this.isEditMode) return;
        const dialogResult = await CustomDialog.codePrompt(
            'Paste a Dashboard Studio Snippet below and press Import.',
            '',
            'Import Snippet',
            {
                readOnly: false,
                okLabel: 'Import',
                cancelLabel: 'Cancel',
                placeholder: 'Paste Dashboard Studio Snippet JSON here...'
            }
        );
        if (!dialogResult || dialogResult.action !== 'ok') return;

        const parsed = this._parseClipboardSnippet(dialogResult.value || '');
        if (!parsed.ok) {
            await CustomDialog.alert(parsed.reason, 'Import Failed');
            return;
        }
        this._setInternalSnippetClipboard(parsed.data);
        await this._pasteSnippetData(parsed.data);
    },

    _pasteSnippetText: async function (snippetText) {
        const parsed = this._parseClipboardSnippet(snippetText);
        if (!parsed.ok) {
            await CustomDialog.alert(parsed.reason, 'Paste Failed');
            return;
        }
        await this._pasteSnippetData(parsed.data);
    },

    _pasteSnippetData: async function (snippetData) {
        const sourceData = this._cloneJson(snippetData);
        const parsed = this._parseClipboardSnippet(sourceData);
        if (!parsed.ok) {
            await CustomDialog.alert(parsed.reason, 'Paste Failed');
            return;
        }

        let workingData = parsed.data;
        const sourceVersion = String(workingData.version || '1.0.0');
        const targetVersion = String(window.DASHBOARD_VERSION || '1.1.4');
        const isOlderSnippet = this._compareVersions(sourceVersion, targetVersion) < 0;
        const isNewerSnippet = this._compareVersions(sourceVersion, targetVersion) > 0;

        if (isOlderSnippet && typeof DashboardMigrator !== 'undefined') {
            const migrationResult = typeof DashboardMigrator.migrateSnippet === 'function'
                ? DashboardMigrator.migrateSnippet(workingData)
                : DashboardMigrator.migrate(workingData);
            workingData = migrationResult && migrationResult.data ? migrationResult.data : workingData;
        }

        const pendingWidgets = [];
        Object.entries(workingData.widgets || {}).forEach(([id, widgetData]) => {
            pendingWidgets.push({ sourceId: id, widgetData: widgetData, sourceGroupId: null });
        });
        Object.entries(workingData.groups || {}).forEach(([groupId, groupData]) => {
            const nested = groupData && groupData.widgets && typeof groupData.widgets === 'object' ? groupData.widgets : {};
            Object.entries(nested).forEach(([id, widgetData]) => {
                pendingWidgets.push({ sourceId: id, widgetData: widgetData, sourceGroupId: groupId });
            });
        });

        if (pendingWidgets.length === 0) {
            await CustomDialog.alert('Snippet does not contain any widgets that can be pasted.', 'Paste Failed');
            return;
        }

        const currentPage = Math.max(1, Number(MASTER_SETTINGS.currentPage) || 1);
        let matchingPageCount = 0;
        let mismatchingPageCount = 0;
        pendingWidgets.forEach(item => {
            if (this._widgetMatchesPage(item.widgetData, currentPage)) matchingPageCount += 1;
            else mismatchingPageCount += 1;
        });

        let forceCurrentPage = false;
        if (mismatchingPageCount > 0) {
            const allMismatch = matchingPageCount === 0;
            const message = allMismatch
                ? `These ${pendingWidgets.length} pasted widget(s) are not configured for Page ${currentPage}, so they will not be visible right away.\n\nChoose "Set To Current Page" to make them appear now, or "Paste As-Is" to keep original page settings.`
                : `${mismatchingPageCount} of ${pendingWidgets.length} pasted widget(s) are not configured for Page ${currentPage}.\n\nChoose "Set To Current Page" to make all pasted widgets visible now, or "Paste As-Is" to keep original page settings.`;
            forceCurrentPage = await CustomDialog.confirmWithLabels(message, 'Page Visibility', 'Set To Current Page', 'Paste As-Is');
        }

        const beforeSelection = this._captureSelectionState();
        const beforeGroups = this._cloneJson(this.groups || {});
        const reservedIds = new Set(Object.keys(this.widgets || {}));
        const sourceToNewId = {};
        const createdIds = [];
        const createdGroups = {};
        const skippedUnknownTypes = [];
        const gridStep = Math.max(1, Number(MASTER_SETTINGS.gridSize) || 20);

        pendingWidgets.forEach(item => {
            const widgetData = item.widgetData && typeof item.widgetData === 'object' ? item.widgetData : null;
            if (!widgetData) return;

            const rawType = String(widgetData.type || '').trim();
            const normalizedType = rawType === 'textbox' ? 'list' : rawType;
            if (!normalizedType || !WidgetRegistry.get(normalizedType) || this.isWidgetHidden(normalizedType)) {
                if (rawType) skippedUnknownTypes.push(rawType);
                return;
            }

            const newId = this._generateUniqueWidgetId(normalizedType, reservedIds);
            if (!newId) return;
            reservedIds.add(newId);

            const overrides = this._cloneJson(widgetData.overrides || {});
            const bindings = this._cloneJson(widgetData.bindings || {});

            if (Number.isFinite(Number(overrides.x))) overrides.x = Number(overrides.x) + gridStep;
            if (Number.isFinite(Number(overrides.y))) overrides.y = Number(overrides.y) + gridStep;
            if (normalizedType === 'arrow') this._offsetArrowOverrides(overrides, gridStep, gridStep);
            if (normalizedType === 'graph' && typeof GraphWidget !== 'undefined') {
                GraphWidget.shiftFloatingLegend(overrides, gridStep, gridStep);
            }
            if (forceCurrentPage) overrides.page = String(currentPage);

            this.createWidget(normalizedType, newId, overrides, bindings, true);
            sourceToNewId[item.sourceId] = newId;
            createdIds.push(newId);
        });

        if (createdIds.length === 0) {
            const unknownCount = skippedUnknownTypes.length;
            if (unknownCount > 0) {
                const uniqueUnknown = [...new Set(skippedUnknownTypes)].join(', ');
                await CustomDialog.alert(`Snippet could not be pasted because widget type(s) are not available here: ${uniqueUnknown}.`, 'Paste Failed');
            } else {
                await CustomDialog.alert('No widgets could be pasted from this snippet.', 'Paste Failed');
            }
            return;
        }

        this._recenterWidgetsIfOutsideCanvas(createdIds, gridStep);

        Object.entries(workingData.groups || {}).forEach(([groupId, groupData]) => {
            const nested = groupData && groupData.widgets && typeof groupData.widgets === 'object' ? groupData.widgets : {};
            const newMemberIds = Object.keys(nested)
                .map(sourceId => sourceToNewId[sourceId])
                .filter(id => !!id && this.widgets[id]);
            if (newMemberIds.length < 2) return;

            const newGroupId = this._generateGroupId();
            const newGroupObj = {
                id: newGroupId,
                name: this._ensureUniqueGroupName(String((groupData && groupData.name) || groupId || 'Group')),
                locked: !!(groupData && groupData.locked === true),
                visible: !groupData || groupData.visible !== false,
                bindings: this._sanitizeGroupBindingsForStorage(groupData && groupData.bindings),
                overridePage: this._normalizeGroupOverridePage(groupData && groupData.overridePage),
                dimBackgroundWhenVisible: !!(groupData && groupData.dimBackgroundWhenVisible === true),
                widgets: newMemberIds.reduce(function (acc, id) { acc[id] = true; return acc; }, {})
            };
            const extras = this._groupExtrasForStorage(groupData);
            if (extras.layout) newGroupObj.layout = extras.layout;
            if (extras.composite) newGroupObj.composite = extras.composite;
            createdGroups[newGroupId] = newGroupObj;
        });

        Object.assign(this.groups, createdGroups);
        if (this.openedGroupId) {
            this._attachCreatedWidgetsToOpenedGroup(createdIds);
        }
        this._normalizeGroups();

        this._rerenderWidgetsEditorVisibility(createdIds);
        this.refreshAllGroupsVisibility();
        this._refreshEditorPageIndicator();

        if (workingData.selectionGroups && typeof workingData.selectionGroups === 'object') {
            this.mergeSelectionGroupsFromSnippet(workingData.selectionGroups);
        }

        if (this.isEditMode && typeof Editor !== 'undefined') {
            Editor.refreshDropdown(this.widgets);
        }
        this.selectWidget(createdIds, false, true);
        this.markUnsaved();

        const createdWidgets = createdIds
            .map(id => this._serializeWidgetById(id))
            .filter(Boolean);
        this._recordHistoryEntry({
            kind: 'widgets-delete-restore',
            beforeWidgets: [],
            afterWidgets: createdWidgets,
            beforeDeletedIds: [],
            afterDeletedIds: createdIds,
            beforeGroups: beforeGroups,
            afterGroups: this._cloneJson(this.groups || {}),
            beforeSelection: beforeSelection,
            afterSelection: this._captureSelectionState()
        });

        let statusMessage = '';
        if (skippedUnknownTypes.length > 0) {
            const uniqueUnknown = [...new Set(skippedUnknownTypes)];
            statusMessage += `Skipped ${skippedUnknownTypes.length} unsupported widget(s): ${uniqueUnknown.join(', ')}.`;
        }
        if (isOlderSnippet) {
            statusMessage += `${statusMessage ? '\n\n' : ''}This snippet was created in Dashboard Studio v${sourceVersion}. It was gently updated for v${targetVersion}. Please quickly review the pasted widgets to confirm everything looks as expected.`;
        }
        if (isNewerSnippet) {
            statusMessage += `${statusMessage ? '\n\n' : ''}This snippet was created in a newer Dashboard Studio version (v${sourceVersion}). Some settings may not be available in v${targetVersion}.`;
        }

        if (statusMessage) {
            await CustomDialog.alert(statusMessage, 'Snippet Pasted');
        }
    },

    _getMaxDashboardPage: function () {
        // Pages are inferred from widget overrides. We allow editor navigation
        // one extra page beyond the highest used page so the user can add
        // a new (currently empty) page.
        let maxUsedPage = 1;
        Object.values(this.widgets || {}).forEach(widget => {
            if (!widget) return;
            const raw = (widget.overrides && widget.overrides.page != null) ? widget.overrides.page : '1';
            const pageSpec = (typeof this.resolveEffectivePageForWidgetId === 'function')
                ? this.resolveEffectivePageForWidgetId(widget.id, raw)
                : raw;
            if (pageSpec !== undefined && pageSpec !== null && pageSpec !== '') {
                if (typeof WidgetPageSpec !== 'undefined' && typeof WidgetPageSpec.maxPageInSpec === 'function') {
                    const m = WidgetPageSpec.maxPageInSpec(pageSpec);
                    if (m > maxUsedPage) maxUsedPage = m;
                } else {
                    String(pageSpec).split(',').forEach(token => {
                        const parsed = parseInt(String(token).trim(), 10);
                        if (!isNaN(parsed) && parsed > maxUsedPage) maxUsedPage = parsed;
                    });
                }
            }
            const pageToRaw = widget.overrides && widget.overrides.pageTo;
            if (pageToRaw !== undefined && pageToRaw !== null) {
                const parsedPageTo = parseInt(String(pageToRaw).trim(), 10);
                if (!isNaN(parsedPageTo) && parsedPageTo > maxUsedPage) maxUsedPage = parsedPageTo;
            }
        });
        Object.keys(this.groups || {}).forEach((gid) => {
            const g = this.groups[gid];
            if (!g) return;
            const spec = typeof this.getGroupEffectiveOverridePageSpecForGroup === 'function'
                ? this.getGroupEffectiveOverridePageSpecForGroup(gid)
                : '';
            if (!spec) return;
            if (typeof WidgetPageSpec !== 'undefined' && typeof WidgetPageSpec.maxPageInSpec === 'function') {
                const m = WidgetPageSpec.maxPageInSpec(spec);
                if (m > maxUsedPage) maxUsedPage = m;
            }
        });
        return maxUsedPage + 1;
    },

    _getPagesWithWidgets: function () {
        const found = {};
        const addSpec = function (raw) {
            const pieces = String(raw == null || raw === '' ? '1' : raw).split(',');
            let any = false;
            pieces.forEach(function (token) {
                const t = String(token).trim();
                const range = t.match(/^(\d+)\s*-\s*(\d+)$/);
                if (range) {
                    any = true;
                    let lo = parseInt(range[1], 10);
                    let hi = parseInt(range[2], 10);
                    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return;
                    if (lo > hi) {
                        const tmp = lo;
                        lo = hi;
                        hi = tmp;
                    }
                    for (let p = lo; p <= hi; p++) found[p] = true;
                    return;
                }
                const n = parseInt(t, 10);
                if (!isNaN(n) && n > 0) {
                    any = true;
                    found[n] = true;
                }
            });
            if (!any) found[1] = true;
        };
        Object.keys(this.widgets || {}).forEach((id) => {
            const widget = this.widgets[id];
            if (!widget) return;
            const raw = widget.overrides && widget.overrides.page != null ? widget.overrides.page : '1';
            const spec = (typeof this.resolveEffectivePageForWidgetId === 'function')
                ? this.resolveEffectivePageForWidgetId(id, raw)
                : raw;
            addSpec(spec);
        });
        return Object.keys(found).map(function (k) { return parseInt(k, 10); })
            .filter(function (n) { return Number.isFinite(n) && n > 0; })
            .sort(function (a, b) { return a - b; });
    },

    _canvasDimensionPx: function (val) {
        const n = Number(val);
        if (!Number.isFinite(n) || n <= 0) return 0;
        return n;
    },

    _isCanvasAutoWidth: function () {
        return this._canvasDimensionPx(MASTER_SETTINGS.canvasWidth) <= 0;
    },

    _isCanvasAutoHeight: function () {
        return this._canvasDimensionPx(MASTER_SETTINGS.canvasHeight) <= 0;
    },

    _syncAllWidgetsCanvasClipping: function () {
        if (!this.isEditMode || !this.widgets) return;
        const keys = Object.keys(this.widgets);
        for (let i = 0; i < keys.length; i++) {
            const w = this.widgets[keys[i]];
            if (w && typeof w._syncCanvasBoundaryClipping === "function") {
                w._syncCanvasBoundaryClipping();
            }
        }
    },

    _syncCanvasStageAutoClasses: function () {
        const stage = document.getElementById('dashboard-stage');
        if (!stage) return;
        stage.classList.toggle('dashboard-stage-auto-width', this._isCanvasAutoWidth());
        stage.classList.toggle('dashboard-stage-auto-height', this._isCanvasAutoHeight());
    },

    /**
     * Apply the active layout mode to the canvas and viewport:
     *   fixed      - no-op (standard absolute layout).
     *   scale      - CSS transform: scale() on #dashboard-canvas to fit viewport;
     *                full-screen background on wrapper/stage.
     *   responsive - CSS layout engine on #dashboard-canvas.
     */
    _ensureScaleHost: function () {
        const stage = document.getElementById('dashboard-stage');
        const canvas = document.getElementById('dashboard-canvas');
        if (!stage || !canvas) return null;
        let host = document.getElementById('dashboard-scale-host');
        if (!host) {
            host = document.createElement('div');
            host.id = 'dashboard-scale-host';
            stage.insertBefore(host, canvas);
            host.appendChild(canvas);
        }
        return host;
    },

    _resetScaleHost: function () {
        const host = document.getElementById('dashboard-scale-host');
        const canvas = document.getElementById('dashboard-canvas');
        if (!host || !canvas) return;
        host.classList.remove('dashboard-scale-host-active');
        host.style.width = '';
        host.style.height = '';
        host.style.overflow = '';
        canvas.style.transform = '';
        canvas.style.transformOrigin = '';
        if (host.contains(canvas) && host.parentNode) {
            host.parentNode.insertBefore(canvas, host);
            host.parentNode.removeChild(host);
        }
    },

    _syncFullPageBackground: function (sourceCanvas) {
        const canvas = sourceCanvas || document.getElementById('dashboard-canvas');
        const wrapper = document.getElementById('dashboard-wrapper');
        const stage = document.getElementById('dashboard-stage');
        if (!canvas) return;
        const bgColor = canvas.style.backgroundColor;
        const bgImage = canvas.style.backgroundImage;
        const bgSize = canvas.style.backgroundSize;
        const bgRepeat = canvas.style.backgroundRepeat;
        const bgPosition = canvas.style.backgroundPosition || 'center';
        [wrapper, stage].forEach(function (el) {
            if (!el) return;
            el.style.backgroundColor = bgColor;
            el.style.backgroundImage = bgImage;
            el.style.backgroundSize = bgSize || 'cover';
            el.style.backgroundRepeat = bgRepeat || 'no-repeat';
            el.style.backgroundPosition = bgPosition;
        });
    },

    /**
     * Responsive Columns: paint Background Color 1 and 2 on the viewport-sized
     * wrapper. The stage and canvas grow with the page, so a gradient on them
     * stretches over the full scroll height and the visible window stays the
     * center color. The canvas stays transparent so gaps and the area outside
     * the columns show the wrapper. Intended colors stay in _domCache.
     */
    _paintResponsiveViewportBackground: function () {
        const cache = this._domCache || {};
        const wrapper = document.getElementById('dashboard-wrapper');
        const stage = document.getElementById('dashboard-stage');
        const canvas = document.getElementById('dashboard-canvas');
        if (!wrapper) return;
        const bgColor = cache.bgColor || '';
        const bgImage = cache.bgImage || '';
        wrapper.style.backgroundColor = bgColor;
        wrapper.style.backgroundImage = bgImage;
        wrapper.style.backgroundSize = cache.bgSize || 'cover';
        wrapper.style.backgroundRepeat = cache.bgRepeat || 'no-repeat';
        wrapper.style.backgroundPosition = 'center';
        if (stage) {
            stage.style.backgroundColor = 'transparent';
            stage.style.backgroundImage = 'none';
            stage.style.backgroundSize = '';
            stage.style.backgroundRepeat = '';
            stage.style.backgroundPosition = '';
        }
        if (canvas) {
            if (canvas.style.backgroundColor !== 'transparent') canvas.style.backgroundColor = 'transparent';
            if (canvas.style.backgroundImage !== 'none') canvas.style.backgroundImage = 'none';
        }
    },

    _restoreCanvasBackgroundFromCache: function (canvas) {
        const cache = this._domCache;
        if (!canvas || !cache || !cache.bgColor) return;
        if (canvas.style.backgroundColor !== cache.bgColor) canvas.style.backgroundColor = cache.bgColor;
        const img = cache.bgImage || '';
        if ((canvas.style.backgroundImage || '') !== img) canvas.style.backgroundImage = img;
        if (cache.bgSize && canvas.style.backgroundSize !== cache.bgSize) canvas.style.backgroundSize = cache.bgSize;
        if (cache.bgRepeat && canvas.style.backgroundRepeat !== cache.bgRepeat) canvas.style.backgroundRepeat = cache.bgRepeat;
    },

    _clearFullPageBackground: function () {
        const wrapper = document.getElementById('dashboard-wrapper');
        const stage = document.getElementById('dashboard-stage');
        [wrapper, stage].forEach(function (el) {
            if (!el) return;
            el.style.backgroundColor = '';
            el.style.backgroundImage = '';
            el.style.backgroundSize = '';
            el.style.backgroundRepeat = '';
            el.style.backgroundPosition = '';
        });
    },

    _responsiveLegacyEngineClassList: function () {
        return ['grid-autofit', 'fixed-columns', 'flex', 'masonry', 'subgrid', 'bento'];
    },

    _responsiveColumnCount: function () {
        const columns = parseInt(MASTER_SETTINGS.layoutResponsiveColumnCount, 10);
        return Math.max(1, Math.min(24, (Number.isFinite(columns) && columns > 0) ? columns : 6));
    },

    /** Stage content width the canvas may occupy (inside page padding, capped by Width). */
    _responsiveAvailableWidth: function () {
        const stage = document.getElementById('dashboard-stage');
        if (stage) {
            const cs = getComputedStyle(stage);
            const padLeft = parseFloat(cs.paddingLeft) || 0;
            const padRight = parseFloat(cs.paddingRight) || 0;
            let avail = stage.clientWidth - padLeft - padRight;
            const cap = this._canvasDimensionPx(MASTER_SETTINGS.canvasWidth);
            if (cap > 0 && cap < avail) avail = cap;
            return Math.max(0, avail);
        }
        const canvas = document.getElementById('dashboard-canvas');
        return canvas ? canvas.clientWidth : 0;
    },

    /**
     * Row-track metrics for Responsive Columns masonry packing. The canvas uses a
     * small fixed row track (Row Unit); each widget spans as many rows as its content
     * needs so widgets in the same column pack tightly with no cross-column gaps.
     * Returns { rowUnit, gap, minWidgetHeight, minRows, stride } where stride is the
     * per-row height including the row gap, and minRows is the row span that covers
     * the Min Widget Height floor.
     */
    responsiveRowMetrics: function () {
        const rowUnit = 4;
        const gap = Math.max(0, Number(MASTER_SETTINGS.layoutResponsiveGap) || 10);
        const minWidgetHeightRaw = Number(MASTER_SETTINGS.layoutResponsiveMinWidgetHeight);
        const minWidgetHeight = (Number.isFinite(minWidgetHeightRaw) && minWidgetHeightRaw >= 0) ? minWidgetHeightRaw : 120;
        const stride = rowUnit + gap;
        const minRows = Math.max(1, Math.ceil((minWidgetHeight + gap) / stride));
        return { rowUnit: rowUnit, gap: gap, minWidgetHeight: minWidgetHeight, minRows: minRows, stride: stride };
    },

    /**
     * Cell Height Mode for a responsive layout blob. Explicit `cellHeightMode`
     * (`auto` | `fixed` | `fill`) wins, then legacy `heightMode`. When both are
     * missing, `cellHeight` or legacy `height` above 0 is treated as Fixed so
     * existing dashboards keep a typed pixel height without a migrator.
     * Everything else is Auto.
     */
    resolveResponsiveHeightMode: function (resp) {
        const raw = resp && ((resp.cellHeightMode !== undefined && resp.cellHeightMode !== null && resp.cellHeightMode !== '')
            ? resp.cellHeightMode : resp.heightMode);
        if (raw === 'fill' || raw === 'fixed' || raw === 'auto') return raw;
        const h = this.responsiveCellHeightPx(resp);
        if (Number.isFinite(h) && h > 0) return 'fixed';
        return 'auto';
    },

    /** Saved Cell Height in px (`cellHeight`, else legacy `height`). */
    responsiveCellHeightPx: function (resp) {
        if (!resp || typeof resp !== 'object') return NaN;
        if (resp.cellHeight !== undefined && resp.cellHeight !== null && resp.cellHeight !== '') {
            const n = Number(resp.cellHeight);
            if (Number.isFinite(n)) return n;
        }
        if (resp.height !== undefined && resp.height !== null && resp.height !== '') {
            const n = Number(resp.height);
            if (Number.isFinite(n)) return n;
        }
        return NaN;
    },

    /** Pixel Cell Height when mode is Fixed, else 0 (Auto / Fill measure like Auto). */
    explicitResponsiveHeightPx: function (resp) {
        if (this.resolveResponsiveHeightMode(resp) !== 'fixed') return 0;
        const h = this.responsiveCellHeightPx(resp);
        return (Number.isFinite(h) && h > 0) ? h : 0;
    },

    /** Pixel cell height that a masonry row span occupies (inverse of span-from-height). */
    responsiveCellHeightForRowSpan: function (rowSpan) {
        const m = this.responsiveRowMetrics();
        const n = Math.max(1, Number(rowSpan) || 1);
        return Math.max(0, n * m.stride - m.gap);
    },

    _responsivePagePaddingSide: function (raw, fallback) {
        const n = Number(raw);
        return Number.isFinite(n) ? Math.max(0, n) : fallback;
    },

    _responsivePagePadding: function () {
        const def = 20;
        return {
            left: this._responsivePagePaddingSide(MASTER_SETTINGS.layoutResponsivePagePaddingLeft, def),
            right: this._responsivePagePaddingSide(MASTER_SETTINGS.layoutResponsivePagePaddingRight, def),
            top: this._responsivePagePaddingSide(MASTER_SETTINGS.layoutResponsivePagePaddingTop, def),
            bottom: this._responsivePagePaddingSide(MASTER_SETTINGS.layoutResponsivePagePaddingBottom, def)
        };
    },

    /** Row span for a closed composite cell; never applies Environment Min Widget Height. */
    responsiveCompositeRowSpanFor: function (cellHeight, userRowSpanFloor, explicitGroupHeight) {
        const m = this.responsiveRowMetrics();
        let base = 0;
        if (Number.isFinite(explicitGroupHeight) && explicitGroupHeight > 0) {
            base = explicitGroupHeight;
        } else if (Number.isFinite(cellHeight) && cellHeight > 0) {
            base = cellHeight;
        }
        let n = Math.ceil((base + m.gap) / m.stride);
        if (!Number.isFinite(n) || n < 1) n = 1;
        if (Number.isFinite(userRowSpanFloor) && userRowSpanFloor > n) n = userRowSpanFloor;
        return n;
    },

    /**
     * Row span for a widget given an explicit Fixed Cell Height (0 = Auto / Fill),
     * the already-measured intrinsic content height (read with the container at
     * height:auto so content-fill widgets like clock/graph collapse to 0), and the
     * widget's fixed override height as a fallback for content-less widgets. Priority:
     * Fixed Height -> measured intrinsic content -> designed height -> 0. Content
     * widgets (intrinsic > 0) grow to fit their content; content-less canvas/SVG
     * widgets (intrinsic = 0) fall back to their designed fixed height instead of the
     * Min Widget Height floor. Clamped to minRows and to the user's Row Span floor.
     */
    responsiveRowSpanFor: function (explicitHeight, intrinsicHeight, userRowSpanFloor, fixedHeight) {
        const m = this.responsiveRowMetrics();
        const hasExplicitHeight = Number.isFinite(explicitHeight) && explicitHeight > 0;
        let base;
        if (hasExplicitHeight) {
            base = explicitHeight;
        } else if (Number.isFinite(intrinsicHeight) && intrinsicHeight > 0) {
            base = intrinsicHeight;
        } else {
            base = (Number.isFinite(fixedHeight) && fixedHeight > 0) ? fixedHeight : 0;
        }
        let n = Math.ceil((base + m.gap) / m.stride);
        if (!Number.isFinite(n) || n < 1) n = 1;
        if (!hasExplicitHeight && n < m.minRows) n = m.minRows;
        if (Number.isFinite(userRowSpanFloor) && userRowSpanFloor > n) n = userRowSpanFloor;
        return n;
    },

    /**
     * Fill Min Height in px: widget/group `minHeight` override, else master
     * Min Widget Height. Used as the pack floor and as the last-in-column size.
     */
    responsiveFillMinHeightPx: function (resp) {
        if (resp && resp.minHeight !== undefined && resp.minHeight !== null && resp.minHeight !== '') {
            const n = Number(resp.minHeight);
            if (Number.isFinite(n) && n >= 0) return n;
        }
        const m = this.responsiveRowMetrics();
        return m.minWidgetHeight;
    },

    /**
     * Initial masonry span for Fill: Min Height (override or Min Widget Height).
     * Content height must not reserve tracks, or a tall Fill widget pushes the next
     * overlapping widget down and leaves a hole in the other columns. Stretch
     * happens after placement.
     */
    responsiveFillPackRowSpan: function (resp) {
        const m = this.responsiveRowMetrics();
        const px = this.responsiveFillMinHeightPx(resp);
        const userRowSpan = parseInt(resp && resp.rowSpan, 10);
        let n = Math.ceil((px + m.gap) / m.stride);
        if (!Number.isFinite(n) || n < 1) n = 1;
        if (Number.isFinite(userRowSpan) && userRowSpan > n) n = userRowSpan;
        return n;
    },

    /**
     * Effective column count for the current viewport. Saved Column Count is the
     * maximum. When Reduce Columns to Fit is on, N drops so Min Column Width still
     * fits. The saved Column Count is never written back.
     */
    currentResponsiveColumnCount: function () {
        const requested = this._responsiveColumnCount();
        if (MASTER_SETTINGS.layoutResponsiveReduceColumnsToFit !== true) return requested;
        const availW = this._responsiveAvailableWidth();
        if (availW <= 0) return requested;
        const minSzRaw = Number(MASTER_SETTINGS.layoutResponsiveMinSize);
        const minSz = (Number.isFinite(minSzRaw) && minSzRaw >= 1) ? minSzRaw : 150;
        const gap = Math.max(0, Number(MASTER_SETTINGS.layoutResponsiveGap) || 10);
        const fit = Math.max(1, Math.floor((availW + gap) / (minSz + gap)));
        return Math.min(requested, fit);
    },

    _syncResponsiveColumnCountVars: function (canvas) {
        const el = canvas || document.getElementById('dashboard-canvas');
        if (!el) return;
        el.style.setProperty('--responsive-col-count', String(this.currentResponsiveColumnCount()));
    },

    /**
     * Resolve a widget/group Preferred Column against the columns actually available.
     * The whole span must fit: Preferred Column 2 with Column Span 2 on a 2-column
     * grid would otherwise become `2 / span 2` and create an implicit third track
     * that squeezes into leftover space. Returns 0 (auto-place) when the start
     * column is gone or the span would overflow.
     */
    responsivePreferredColumn: function (rawPrefCol, rawSpan) {
        const prefCol = (rawPrefCol !== undefined && rawPrefCol !== null)
            ? parseInt(rawPrefCol, 10) : 0;
        if (!Number.isFinite(prefCol) || prefCol <= 0) return 0;
        const available = this.currentResponsiveColumnCount();
        if (available <= 0 || prefCol > available) return 0;
        const span = Math.max(1, parseInt(rawSpan, 10) || 1);
        const usedSpan = Math.min(span, available);
        if (prefCol + usedSpan - 1 > available) return 0;
        return prefCol;
    },

    clampResponsiveColumnSpan: function (rawSpan) {
        const span = Math.max(1, parseInt(rawSpan, 10) || 1);
        return Math.min(span, this.currentResponsiveColumnCount());
    },

    /**
     * Write explicit CSS grid lines. Column/row starts are optional: omit them
     * (first frame before the masonry placement pass) and the browser auto-places.
     */
    _writeResponsiveGridLines: function (el, colStart, span, rowStart, rowSpan) {
        if (!el) return;
        const colSpan = (Number.isFinite(span) && span >= 1) ? span : 1;
        const targetCol = (Number.isFinite(colStart) && colStart > 0)
            ? (colStart + ' / span ' + colSpan)
            : ('span ' + colSpan);
        if (el.style.gridColumn !== targetCol) {
            el.style.gridColumn = targetCol;
        }
        if (!Number.isFinite(rowSpan) || rowSpan < 1) return;
        const targetRow = (Number.isFinite(rowStart) && rowStart >= 1)
            ? (rowStart + ' / span ' + rowSpan)
            : ('span ' + rowSpan);
        if (el.style.gridRow !== targetRow) {
            el.style.gridRow = targetRow;
        }
    },

    /**
     * When Preferred Column is 0 (auto-place), bias column choice toward the widget's
     * fixed-layout x coordinate so migrated dashboards keep their column intent.
     */
    _inferResponsiveColumnFromX: function (widget, span, columnCount, canvasWidth) {
        if (!widget || columnCount <= 0 || canvasWidth <= 0) return 1;
        const x = Number(widget.overrides && widget.overrides.x);
        if (!Number.isFinite(x) || x < 0) return 1;
        const gap = Math.max(0, Number(MASTER_SETTINGS.layoutResponsiveGap) || 10);
        const totalGap = gap * Math.max(0, columnCount - 1);
        const colWidth = (canvasWidth - totalGap) / columnCount;
        if (!Number.isFinite(colWidth) || colWidth <= 0) return 1;
        const stride = colWidth + gap;
        let start = Math.floor(x / stride) + 1;
        start = Math.max(1, Math.min(start, columnCount - span + 1));
        return start;
    },

    _maxResponsiveColumnNextRow: function (columnNextRow, colStart, span) {
        let max = 1;
        for (let c = colStart; c < colStart + span; c++) {
            const next = columnNextRow[c] || 1;
            if (next > max) max = next;
        }
        return max;
    },

    /** Pick the leftmost column window with the lowest next-free row; tie-break toward hintCol. */
    _findAutoResponsiveColumnStart: function (columnNextRow, span, columnCount, hintCol) {
        let bestCol = 1;
        let bestRow = Infinity;
        const maxStart = Math.max(1, columnCount - span + 1);
        for (let c = 1; c <= maxStart; c++) {
            const row = this._maxResponsiveColumnNextRow(columnNextRow, c, span);
            if (row < bestRow) {
                bestRow = row;
                bestCol = c;
            } else if (row === bestRow && Number.isFinite(hintCol) && hintCol > 0) {
                if (Math.abs(c - hintCol) < Math.abs(bestCol - hintCol)) bestCol = c;
            }
        }
        return bestCol;
    },

    _responsivePlacementRowSpan: function (item) {
        if (item.kind === 'widget') {
            const w = item.widget;
            if (w && Number.isFinite(w._responsiveRowSpan) && w._responsiveRowSpan >= 1) return w._responsiveRowSpan;
            return 1;
        }
        if (item.wrapper && Number.isFinite(item.wrapper._responsiveRowSpan) && item.wrapper._responsiveRowSpan >= 1) {
            return item.wrapper._responsiveRowSpan;
        }
        const gs = item.wrapper && item.wrapper.style ? (item.wrapper.style.gridRow || '') : '';
        const m = /span\s+(\d+)/i.exec(gs);
        const n = m ? parseInt(m[1], 10) : NaN;
        return (Number.isFinite(n) && n >= 1) ? n : 1;
    },

    /**
     * Visibility and z-index from saved overrides. Does not touch `get config`.
     * Missing z-index uses the factory default (10).
     */
    _sparseWidgetChrome: function (widget) {
        const ov = widget && widget.overrides ? widget.overrides : {};
        let z = 10;
        if (ov.zIndex !== undefined && ov.zIndex !== null && ov.zIndex !== '') {
            const parsed = parseInt(String(ov.zIndex), 10);
            if (!isNaN(parsed)) z = parsed;
        }
        return {
            visible: ov.visible !== false,
            z: z
        };
    },

    _widgetCoversActivePage: function (widgetId, widget) {
        const activePage = Math.max(1, parseInt(String(MASTER_SETTINGS.currentPage != null ? MASTER_SETTINGS.currentPage : 1), 10) || 1);
        const rawPage = (widget && widget.overrides && widget.overrides.page != null)
            ? widget.overrides.page
            : '1';
        const pageSpec = (typeof this.resolveEffectivePageForWidgetId === 'function')
            ? this.resolveEffectivePageForWidgetId(widgetId, rawPage)
            : rawPage;
        if (typeof WidgetPageSpec !== 'undefined') {
            return WidgetPageSpec.coversPage(pageSpec, activePage);
        }
        const pages = String(pageSpec).split(',').map(function (p) { return p.trim(); });
        return pages.indexOf(String(activePage)) !== -1;
    },

    _collectResponsiveGridPlacementItems: function () {
        const self = this;
        const items = [];
        Object.keys(this.widgets || {}).forEach(function (id) {
            const w = self.widgets[id];
            if (!w || !w.elements || !w.elements.wrapper) return;
            if (typeof BaseWidget !== 'undefined' && !BaseWidget.usesResponsiveGridLayout(id)) return;
            if (typeof self.getWidgetCompositeContext === 'function' && self.getWidgetCompositeContext(id)) return;
            if (w.elements.wrapper.style.display === 'none') return;
            if (!self._widgetCoversActivePage(id, w)) return;
            items.push({
                kind: 'widget',
                id: id,
                order: self.resolveResponsiveWidgetOrder(id),
                wrapper: w.elements.wrapper,
                widget: w
            });
        });
        Object.keys(this.groups || {}).forEach(function (gid) {
            if (self._isGroupCompositeOpen(gid)) return;
            const memberIds = self.getGroupMemberIds(gid);
            if (!memberIds || memberIds.length < 2) return;
            const wrapper = document.getElementById('group-composite-' + gid);
            if (!wrapper || wrapper.style.display === 'none') return;
            items.push({
                kind: 'group',
                id: gid,
                groupId: gid,
                order: self.resolveResponsiveGroupOrder(gid),
                wrapper: wrapper
            });
        });
        items.sort(function (a, b) {
            if (a.order !== b.order) return a.order - b.order;
            return String(a.id).localeCompare(String(b.id));
        });
        return items;
    },

    /**
     * Explicit per-column masonry placement. CSS grid auto-placement (even with dense)
     * does not reliably top-align widgets in separate columns when Order and multi-column
     * spans interact; this pass tracks the next free row in each column and sets explicit
     * grid-column / grid-row start lines after row spans are measured.
     */
    _assignResponsiveGridPlacement: function () {
        const activeMode = (MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) ? MASTER_SETTINGS.layoutMode : 'fixed';
        if (activeMode !== 'responsive') return;
        const columnCount = this.currentResponsiveColumnCount();
        if (columnCount <= 0) return;
        const canvas = document.getElementById('dashboard-canvas');
        const canvasWidth = canvas ? canvas.clientWidth : 0;

        const columnNextRow = new Array(columnCount + 1);
        for (let i = 0; i < columnNextRow.length; i++) columnNextRow[i] = 1;

        const items = this._collectResponsiveGridPlacementItems();
        const self = this;
        items.forEach(function (item) {
            let resp = {};
            if (item.kind === 'widget') {
                resp = (typeof BaseWidget !== 'undefined' && BaseWidget.getResponsiveLayout)
                    ? (BaseWidget.getResponsiveLayout(item.widget.overrides) || {})
                    : {};
            } else {
                resp = self.getGroupResponsiveLayout(item.groupId) || {};
            }

            const rawSpan = (resp.columnSpan !== undefined && resp.columnSpan !== null)
                ? parseInt(resp.columnSpan, 10) : 1;
            let span = Number.isFinite(rawSpan) && rawSpan > 0 ? rawSpan : 1;
            span = self.clampResponsiveColumnSpan(span);

            let colStart = self.responsivePreferredColumn(resp.preferredColumn, span);
            if (colStart <= 0) {
                const hintCol = (item.kind === 'widget')
                    ? self._inferResponsiveColumnFromX(item.widget, span, columnCount, canvasWidth)
                    : 1;
                colStart = self._findAutoResponsiveColumnStart(columnNextRow, span, columnCount, hintCol);
            } else {
                colStart = Math.max(1, Math.min(colStart, columnCount - span + 1));
            }

            const rowStart = self._maxResponsiveColumnNextRow(columnNextRow, colStart, span);
            const rowSpan = self._responsivePlacementRowSpan(item);
            self._writeResponsiveGridLines(item.wrapper, colStart, span, rowStart, rowSpan);

            if (item.kind === 'widget' && item.widget) {
                item.widget._responsiveRowStart = rowStart;
                item.widget._responsiveColStart = colStart;
                item.widget._responsiveColumnSpan = span;
                item.widget._responsiveRowSpan = rowSpan;
            } else if (item.wrapper) {
                item.wrapper._responsiveRowStart = rowStart;
                item.wrapper._responsiveColStart = colStart;
                item.wrapper._responsiveColumnSpan = span;
                item.wrapper._responsiveRowSpan = rowSpan;
            }

            const nextRow = rowStart + rowSpan;
            for (let c = colStart; c < colStart + span; c++) {
                columnNextRow[c] = nextRow;
            }
        });
        this._applyResponsiveFillRowSpans();
    },

    _responsiveLayoutForPlacementItem: function (item) {
        if (!item) return {};
        if (item.kind === 'widget') {
            return (typeof BaseWidget !== 'undefined' && BaseWidget.getResponsiveLayout)
                ? (BaseWidget.getResponsiveLayout(item.widget && item.widget.overrides) || {})
                : {};
        }
        return this.getGroupResponsiveLayout(item.groupId) || {};
    },

    _responsiveItemGridBox: function (item) {
        const host = (item && item.kind === 'widget' && item.widget) ? item.widget : (item && item.wrapper);
        if (!host) return null;
        const rowStart = Number(host._responsiveRowStart);
        const colStart = Number(host._responsiveColStart);
        const colSpanRaw = Number(host._responsiveColumnSpan);
        const rowSpan = this._responsivePlacementRowSpan(item);
        if (!Number.isFinite(rowStart) || rowStart < 1) return null;
        if (!Number.isFinite(colStart) || colStart < 1) return null;
        return {
            rowStart: rowStart,
            colStart: colStart,
            colSpan: (Number.isFinite(colSpanRaw) && colSpanRaw >= 1) ? colSpanRaw : 1,
            rowSpan: (Number.isFinite(rowSpan) && rowSpan >= 1) ? rowSpan : 1
        };
    },

    _responsiveColumnsOverlap: function (aStart, aSpan, bStart, bSpan) {
        return aStart < (bStart + bSpan) && bStart < (aStart + aSpan);
    },

    /**
     * After masonry placement, stretch Fill cells down to the next widget that
     * shares any column. Integer math only. Fill packed at Min Height, so
     * this never re-measures content (that would recreate the content-height gap).
     */
    _applyResponsiveFillRowSpans: function () {
        const activeMode = (MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) ? MASTER_SETTINGS.layoutMode : 'fixed';
        if (activeMode !== 'responsive') return;
        const items = this._collectResponsiveGridPlacementItems();
        if (!items.length) return;
        const self = this;
        const boxes = [];
        for (let i = 0; i < items.length; i++) {
            boxes.push(self._responsiveItemGridBox(items[i]));
        }
        for (let i = 0; i < items.length; i++) {
            const box = boxes[i];
            if (!box) continue;
            const resp = self._responsiveLayoutForPlacementItem(items[i]);
            if (self.resolveResponsiveHeightMode(resp) !== 'fill') continue;
            const myEnd = box.rowStart + box.rowSpan;
            let nextStart = Infinity;
            for (let j = 0; j < items.length; j++) {
                if (j === i) continue;
                const other = boxes[j];
                if (!other) continue;
                if (other.rowStart < myEnd) continue;
                if (!self._responsiveColumnsOverlap(box.colStart, box.colSpan, other.colStart, other.colSpan)) continue;
                if (other.rowStart < nextStart) nextStart = other.rowStart;
            }
            if (!Number.isFinite(nextStart) || nextStart === Infinity) continue;
            const newSpan = nextStart - box.rowStart;
            if (!Number.isFinite(newSpan) || newSpan <= box.rowSpan) continue;
            const item = items[i];
            self._writeResponsiveGridLines(item.wrapper, box.colStart, box.colSpan, box.rowStart, newSpan);
            if (item.kind === 'widget' && item.widget) {
                item.widget._responsiveRowSpan = newSpan;
            } else if (item.wrapper) {
                item.wrapper._responsiveRowSpan = newSpan;
            }
            if (item.kind === 'group' && item.groupId) {
                const cellH = self.responsiveCellHeightForRowSpan(newSpan);
                const wrapper = item.wrapper;
                const comp = self._resolveGroupCompositeLayout(item.groupId);
                if (wrapper && comp) {
                    self._reflowGroupComposite(item.groupId, wrapper, comp, { lockSpan: true, cellH: cellH });
                }
            }
        }
    },

    /**
     * Seed `overrides.layout.responsive.order` for every widget that is missing
     * the nested responsive blob, using the current fixed y-then-x reading order.
     * Fixed x/y/width/height are never modified. Called when switching to
     * responsive mode so the grid order matches the prior visual layout.
     */
    seedResponsiveOrderFromFixedPositions: function () {
        const ids = Object.keys(this.widgets).sort(function (a, b) {
            const wa = Dashboard.widgets[a];
            const wb = Dashboard.widgets[b];
            const ya = wa && wa.overrides ? Number(wa.overrides.y) : NaN;
            const yb = wb && wb.overrides ? Number(wb.overrides.y) : NaN;
            if (Number.isFinite(ya) && Number.isFinite(yb) && ya !== yb) return ya - yb;
            const xa = wa && wa.overrides ? Number(wa.overrides.x) : NaN;
            const xb = wb && wb.overrides ? Number(wb.overrides.x) : NaN;
            if (Number.isFinite(xa) && Number.isFinite(xb) && xa !== xb) return xa - xb;
            return String(a).localeCompare(String(b));
        });
        ids.forEach(function (id, idx) {
            const w = Dashboard.widgets[id];
            if (!w || !w.overrides || typeof w.overrides !== 'object') return;
            const layout = (w.overrides.layout && typeof w.overrides.layout === 'object')
                ? { ...w.overrides.layout } : {};
            const resp = (layout.responsive && typeof layout.responsive === 'object')
                ? { ...layout.responsive } : {};
            if (resp.order !== undefined && resp.order !== null) return;
            resp.order = idx + 1;
            if (resp.columnSpan === undefined) resp.columnSpan = 1;
            if (resp.rowSpan === undefined) resp.rowSpan = 1;
            if (resp.cellHeight === undefined && resp.height === undefined) resp.cellHeight = 0;
            if (resp.preferredColumn === undefined) resp.preferredColumn = 0;
            if (resp.hidden === undefined) resp.hidden = false;
            layout.responsive = resp;
            w.overrides.layout = layout;
        });
    },

    _getFallbackResponsiveOrderMap: function () {
        if (this._fallbackResponsiveOrderMap) return this._fallbackResponsiveOrderMap;
        const map = {};
        const self = this;
        const ids = Object.keys(this.widgets || {}).sort(function (a, b) {
            const wa = self.widgets[a];
            const wb = self.widgets[b];
            const la = (typeof BaseWidget !== 'undefined' && BaseWidget.getResponsiveLayout)
                ? BaseWidget.getResponsiveLayout(wa && wa.overrides) : null;
            const lb = (typeof BaseWidget !== 'undefined' && BaseWidget.getResponsiveLayout)
                ? BaseWidget.getResponsiveLayout(wb && wb.overrides) : null;
            const oa = la && la.order !== null && Number.isFinite(la.order) ? la.order : null;
            const ob = lb && lb.order !== null && Number.isFinite(lb.order) ? lb.order : null;
            if (oa !== null && ob !== null && oa !== ob) return oa - ob;
            if (oa !== null && ob === null) return -1;
            if (oa === null && ob !== null) return 1;
            const ya = wa && wa.overrides ? Number(wa.overrides.y) : NaN;
            const yb = wb && wb.overrides ? Number(wb.overrides.y) : NaN;
            if (Number.isFinite(ya) && Number.isFinite(yb) && ya !== yb) return ya - yb;
            const xa = wa && wa.overrides ? Number(wa.overrides.x) : NaN;
            const xb = wb && wb.overrides ? Number(wb.overrides.x) : NaN;
            if (Number.isFinite(xa) && Number.isFinite(xb) && xa !== xb) return xa - xb;
            return String(a).localeCompare(String(b));
        });
        for (let i = 0; i < ids.length; i++) {
            map[ids[i]] = i + 1;
        }
        this._fallbackResponsiveOrderMap = map;
        return map;
    },

    /** Effective sort order for responsive layout when no nested order is set. */
    resolveResponsiveWidgetOrder: function (widgetId) {
        const target = this.widgets[widgetId];
        if (!target) return 1;
        const respLayout = (typeof BaseWidget !== 'undefined' && BaseWidget.getResponsiveLayout)
            ? BaseWidget.getResponsiveLayout(target.overrides)
            : null;
        if (respLayout && respLayout.order !== null && Number.isFinite(respLayout.order)) {
            return respLayout.order;
        }

        const map = this._getFallbackResponsiveOrderMap();
        const fallback = map ? map[widgetId] : null;
        return (Number.isFinite(fallback) && fallback > 0) ? fallback : 1;
    },

    _hasLayoutAffectingKey: function (keys) {
        if (!Array.isArray(keys) || keys.length === 0) return true;
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (k === 'layoutMode' || k === 'canvasWidth' || k === 'canvasHeight') return true;
            if (k.indexOf('layoutResponsive') === 0 || k.indexOf('layoutScale') === 0) return true;
        }
        return false;
    },

    _applyLayoutMode: function () {
        const canvas = document.getElementById('dashboard-canvas');
        const stage  = document.getElementById('dashboard-stage');
        const wrapper = document.getElementById('dashboard-wrapper');
        if (!canvas) return;

        this._clearEditorZoomHost();

        const mode = (MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) ? MASTER_SETTINGS.layoutMode : 'fixed';
        const legacyEngines = this._responsiveLegacyEngineClassList();

        canvas.classList.remove('layout-mode-scale', 'layout-mode-responsive');
        legacyEngines.forEach(function (eng) {
            canvas.classList.remove('layout-engine-' + eng);
        });
        // Dead classes retained only for one-pass cleanup of older saves.
        canvas.classList.remove('layout-responsive-max-capped');
        ['start', 'center', 'end', 'stretch'].forEach(function (a) {
            canvas.classList.remove('layout-responsive-align-' + a);
        });

        this._resetScaleHost();
        this._clearFullPageBackground();
        if (wrapper) wrapper.classList.remove('dashboard-wrapper-scale-view', 'dashboard-wrapper-responsive-mode');
        if (stage) {
            stage.classList.remove('dashboard-stage-scale-mode', 'dashboard-stage-responsive-mode');
            stage.style.removeProperty('justify-content');
            stage.style.removeProperty('--responsive-page-padding-top');
            stage.style.removeProperty('--responsive-page-padding-right');
            stage.style.removeProperty('--responsive-page-padding-bottom');
            stage.style.removeProperty('--responsive-page-padding-left');
        }

        canvas.style.removeProperty('--responsive-min');
        canvas.style.removeProperty('--responsive-max');
        canvas.style.removeProperty('--responsive-col-count');
        canvas.style.removeProperty('--responsive-gap');
        canvas.style.removeProperty('--responsive-align');
        canvas.style.removeProperty('--responsive-min-widget-height');
        canvas.style.removeProperty('--responsive-row-unit');
        // Drop the responsive max-width cap and reset the height/width domCache so the
        // canvas-sync block re-applies fixed/scale dimensions cleanly.
        canvas.style.removeProperty('max-width');
        // Clear responsive Column Alignment auto-margins so non-responsive modes use
        // their default canvas margins.
        canvas.style.removeProperty('margin-left');
        canvas.style.removeProperty('margin-right');
        if (this._domCache) {
            this._domCache.maxWidth = '';
        }

        if (mode !== 'responsive') {
            this._responsiveLastAppliedCanvasWidth = undefined;
            this._teardownAllGroupComposites();
            this._cancelResponsiveLayoutTimers();
        }

        if (mode !== 'responsive') {
            this._restoreCanvasBackgroundFromCache(canvas);
        }

        if (mode === 'scale') {
            this._applyScaleMode(canvas, stage, wrapper);
        } else if (mode === 'responsive') {
            canvas.classList.add('layout-mode-responsive');
            if (stage) stage.classList.add('dashboard-stage-responsive-mode');
            if (wrapper) wrapper.classList.add('dashboard-wrapper-responsive-mode');
            this._applyResponsiveMode(canvas);
        }
        this._applyEditorZoom();
    },

    /**
     * Scale-to-fit mode: scale the canvas to fill the viewport (viewer/live preview only).
     * Background always fills the full page; transform is skipped in edit mode.
     */
    _applyScaleMode: function (canvas, stage, wrapper) {
        if (!canvas) return;
        this._syncFullPageBackground(canvas);

        if (this.isEditMode) {
            return;
        }

        canvas.classList.add('layout-mode-scale');

        const canvasW = this._canvasDimensionPx(MASTER_SETTINGS.canvasWidth);
        const canvasH = this._canvasDimensionPx(MASTER_SETTINGS.canvasHeight);
        if (canvasW <= 0 || canvasH <= 0) return;

        const availW = wrapper ? wrapper.clientWidth : window.innerWidth;
        const availH = wrapper ? wrapper.clientHeight : window.innerHeight;
        if (availW <= 0 || availH <= 0) return;

        const keepAspect = MASTER_SETTINGS.layoutScaleKeepAspect !== false;
        let scaleX;
        let scaleY;
        let hostW;
        let hostH;
        if (keepAspect) {
            const uniform = Math.min(availW / canvasW, availH / canvasH);
            scaleX = uniform;
            scaleY = uniform;
            hostW = canvasW * uniform;
            hostH = canvasH * uniform;
        } else {
            scaleX = availW / canvasW;
            scaleY = availH / canvasH;
            hostW = availW;
            hostH = availH;
        }

        const host = this._ensureScaleHost();
        if (host) {
            host.classList.add('dashboard-scale-host-active');
            host.style.width = hostW + 'px';
            host.style.height = hostH + 'px';
            host.style.overflow = 'hidden';
        }

        canvas.style.width = canvasW + 'px';
        canvas.style.height = canvasH + 'px';
        canvas.style.transformOrigin = 'top left';
        canvas.style.transform = 'scale(' + scaleX + ', ' + scaleY + ')';

        if (wrapper) wrapper.classList.add('dashboard-wrapper-scale-view');
        if (stage) stage.classList.add('dashboard-stage-scale-mode');

        this._initScaleResizeListener();
    },

    /** Attach a resize listener so scale mode recalculates on viewport changes. */
    _initScaleResizeListener: function () {
        if (this._scaleResizeBound) return;
        this._scaleResizeBound = true;
        const self = this;
        const onResize = function () {
            const m = (MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) ? MASTER_SETTINGS.layoutMode : 'fixed';
            if (m !== 'scale') return;
            const cv = document.getElementById('dashboard-canvas');
            const st = document.getElementById('dashboard-stage');
            const wr = document.getElementById('dashboard-wrapper');
            if (cv) self._applyScaleMode(cv, st, wr);
        };
        window.addEventListener('resize', onResize);
        if (typeof ResizeObserver !== 'undefined') {
            const wrapper = document.getElementById('dashboard-wrapper');
            if (wrapper) {
                this._scaleResizeObserver = new ResizeObserver(onResize);
                this._scaleResizeObserver.observe(wrapper);
            }
        }
    },

    /**
     * Responsive Layout Strategy: the single owner of responsive-mode DOM on
     * #dashboard-canvas. Sets CSS custom properties, then runs a synchronous
     * layout pass so widgets remeasure their grid cell width.
     */
    _applyResponsiveMode: function (canvas) {
        if (!canvas) return;

        const minSzRaw = Number(MASTER_SETTINGS.layoutResponsiveMinSize);
        const minSz = (Number.isFinite(minSzRaw) && minSzRaw >= 1) ? minSzRaw : 150;
        const maxSz = Math.max(0, Number(MASTER_SETTINGS.layoutResponsiveMaxSize) || 0);
        const gap = Math.max(0, Number(MASTER_SETTINGS.layoutResponsiveGap) || 10);
        const minWidgetHRaw = Number(MASTER_SETTINGS.layoutResponsiveMinWidgetHeight);
        const minWidgetH = (Number.isFinite(minWidgetHRaw) && minWidgetHRaw >= 0) ? minWidgetHRaw : 120;
        const align = MASTER_SETTINGS.layoutResponsiveAlign || 'center';
        const canvasW = this._canvasDimensionPx(MASTER_SETTINGS.canvasWidth);

        canvas.style.setProperty('--responsive-min', minSz + 'px');
        canvas.style.setProperty('--responsive-max', maxSz > 0 ? (maxSz + 'px') : '1fr');
        this._syncResponsiveColumnCountVars(canvas);
        canvas.style.setProperty('--responsive-gap', gap + 'px');
        canvas.style.setProperty('--responsive-align', align);
        canvas.style.setProperty('--responsive-min-widget-height', minWidgetH + 'px');
        const rowMetrics = this.responsiveRowMetrics();
        canvas.style.setProperty('--responsive-row-unit', rowMetrics.rowUnit + 'px');

        // Width, when configured (> 0), is enforced as the maximum pixel width of the
        // page container (upper bound only, no minimum). The canvas is width:100% so it
        // shrinks fluidly with the viewport and never exceeds the configured width; the
        // leftover space when the window is wider is distributed by Column Alignment.
        // Set after _applyLayoutMode's cleanup so the cap survives mode application.
        const maxWidthPx = (canvasW > 0) ? (canvasW + 'px') : '';
        canvas.style.maxWidth = maxWidthPx;
        this._domCache.maxWidth = maxWidthPx;

        // Position the page container within the viewport per Column Alignment when a
        // specific width is configured. The canvas is width:100% capped by max-width;
        // alignment is applied via canvas auto-margins instead of stage flex
        // justify-content so that when the canvas overflows the stage (Min Column Width
        // wider than the viewport) the overflow stays left-anchored and reachable via
        // the wrapper scrollbar - flex justify-content center/end would clip the left
        // side of overflowing content, making it unreachable by scroll.
        const stage = document.getElementById('dashboard-stage');
        if (stage) {
            stage.style.justifyContent = 'flex-start';
            let marginLeft = '0';
            let marginRight = '0';
            if (align === 'center') { marginLeft = 'auto'; marginRight = 'auto'; }
            else if (align === 'end') { marginLeft = 'auto'; marginRight = '0'; }
            canvas.style.marginLeft = marginLeft;
            canvas.style.marginRight = marginRight;
            const pad = this._responsivePagePadding();
            stage.style.setProperty('--responsive-page-padding-top', pad.top + 'px');
            stage.style.setProperty('--responsive-page-padding-right', pad.right + 'px');
            stage.style.setProperty('--responsive-page-padding-bottom', pad.bottom + 'px');
            stage.style.setProperty('--responsive-page-padding-left', pad.left + 'px');
        }

        // Size the environment gradient to the viewable area (the wrapper), including
        // when Width is 0 and the canvas itself fills the window.
        this._paintResponsiveViewportBackground();

        this._markAllWidgetsDirty();
        this._initResponsiveCanvasWidthWatcher();
        this._renderAllGroupComposites();
        this._scheduleResponsiveInitialSettlePass();
        const self = this;
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(function () { self._runResponsiveLayoutSync(true); });
        } else {
            this._runResponsiveLayoutSync(true);
        }
    },

    /** Clear per-widget responsive measurement caches (row span, cell size). */
    _resetResponsiveWidgetCaches: function () {
        this._fallbackResponsiveOrderMap = null;
        const self = this;
        Object.keys(this.widgets || {}).forEach(function (id) {
            const w = self.widgets[id];
            if (!w) return;
            w._responsiveRowSpan = undefined;
            w._responsiveRowStart = undefined;
            w._responsiveColStart = undefined;
            w._responsiveColumnSpan = undefined;
            w._responsiveOrder = undefined;
            w._responsivePreferredCol = undefined;
            w._effectiveLayoutWidth = undefined;
            w._effectiveLayoutHeight = undefined;
        });
    },

    /**
     * Synchronous responsive layout pass: render every dirty widget at the current
     * column width, measure intrinsic heights, set masonry row spans, then remeasure
     * cell-sized content (graph canvas, clock face). Used on initial apply and when
     * the canvas column width has settled after a resize.
     */
    _runResponsiveLayoutSync: function (recordCanvasWidth) {
        const activeMode = (MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) ? MASTER_SETTINGS.layoutMode : 'fixed';
        if (activeMode !== 'responsive') return;
        if (this._responsiveLayoutSyncRunning) return;
        this._responsiveLayoutSyncRunning = true;
        const self = this;
        try {
            this._syncResponsiveColumnCountVars();
            this._flushDirtyWidgets();
            this._runResponsiveReflowPass(true, null);
            this._reflowAllGroupComposites();
            this._assignResponsiveGridPlacement();
            this._runResponsiveRemeasurePass();
            if (recordCanvasWidth) {
                const canvas = document.getElementById('dashboard-canvas');
                if (canvas) {
                    self._responsiveLastAppliedCanvasWidth = Math.round(canvas.offsetWidth);
                }
            }
        } finally {
            this._responsiveLayoutSyncRunning = false;
        }
    },

    /**
     * Fired after the canvas column width stops changing. Re-runs the full synchronous
     * layout pass when the settled width differs from the last applied width.
     */
    _onResponsiveCanvasWidthChanged: function () {
        const canvas = document.getElementById('dashboard-canvas');
        if (!canvas) return;
        if ((MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) !== 'responsive') return;
        const width = Math.round(canvas.offsetWidth);
        if (this._editorZoomScale !== 1) this._syncEditorZoomHostBox(canvas);
        if (width <= 0) return;
        if (width === this._responsiveLastAppliedCanvasWidth) return;
        this._resetResponsiveWidgetCaches();
        this._markAllWidgetsDirty();
        this._runResponsiveLayoutSync(true);
    },

    /**
     * One-shot deferred re-measure pass scheduled from `_applyResponsiveMode`. The
     * initial synchronous pass measures intrinsic heights in the first frame after
     * apply, but async content (images, fonts, late MQTT data) changes a widget's
     * height after that pass and no width change occurs to retrigger the watcher, so
     * the masonry spans stay wrong until a manual viewport resize. This schedules the
     * SAME sequence a resize runs (reset caches + re-dirty + full sync) once shortly
     * after apply, using WorkerTimer so cold-load main-thread timer throttling cannot
     * delay it. No-op if the mode has switched away by the time it fires. The height
     * change it produces does not loop the watcher (which only reacts to width).
     */
    _scheduleResponsiveInitialSettlePass: function () {
        const self = this;
        const SETTLE_MS = 350;
        const hasWorkerTimer = (typeof WorkerTimer !== 'undefined'
            && WorkerTimer && typeof WorkerTimer.setTimeout === 'function');
        const run = function () {
            self._responsiveInitialSettleTimer = null;
            if ((MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) !== 'responsive') return;
            self._resetResponsiveWidgetCaches();
            self._markAllWidgetsDirty();
            self._runResponsiveLayoutSync(true);
        };
        if (self._responsiveInitialSettleTimer) {
            (hasWorkerTimer ? WorkerTimer.clearTimeout : clearTimeout)(self._responsiveInitialSettleTimer);
        }
        self._responsiveInitialSettleTimer = hasWorkerTimer
            ? WorkerTimer.setTimeout(run, SETTLE_MS)
            : setTimeout(run, SETTLE_MS);
    },

    _cancelResponsiveInitialSettlePass: function () {
        if (!this._responsiveInitialSettleTimer) return;
        this._clearWorkerOrWindowTimeout(this._responsiveInitialSettleTimer);
        this._responsiveInitialSettleTimer = null;
    },

    /**
     * WorkerTimer handles are not window timer ids. Clear with the same API that armed them.
     */
    _clearWorkerOrWindowTimeout: function (handle) {
        if (!handle) return;
        if (typeof WorkerTimer !== 'undefined' && WorkerTimer
                && typeof WorkerTimer.setTimeout === 'function'
                && typeof WorkerTimer.clearTimeout === 'function') {
            WorkerTimer.clearTimeout(handle);
        } else {
            clearTimeout(handle);
        }
    },

    /** Composite retry, responsive settle, and canvas-width settle. Safe when leaving Responsive. */
    _cancelResponsiveLayoutTimers: function () {
        if (typeof this._clearCompositeLayoutTimer === 'function') this._clearCompositeLayoutTimer();
        this._cancelResponsiveInitialSettlePass();
        if (this._responsiveCanvasWidthSettleTimer) {
            this._clearWorkerOrWindowTimeout(this._responsiveCanvasWidthSettleTimer);
            this._responsiveCanvasWidthSettleTimer = null;
        }
    },

    /**
     * Previous-dashboard timers must not fire after a new file replaces widgets.
     * Menu and page-output publishes are viewer-only; Edit Mode load does not clear them itself.
     */
    _cancelStaleSessionTimers: function () {
        this._cancelResponsiveLayoutTimers();
        if (this._menuOutputStatusSyncTimer) {
            this._clearWorkerOrWindowTimeout(this._menuOutputStatusSyncTimer);
            this._menuOutputStatusSyncTimer = null;
        }
        if (this._currentPageOutputTopicTimer) {
            this._clearWorkerOrWindowTimeout(this._currentPageOutputTopicTimer);
            this._currentPageOutputTopicTimer = null;
        }
    },

    /**
     * Watch #dashboard-canvas column width via ResizeObserver (works in iframes and
     * edit mode where window "resize" does not fire). Any size notification resets a
     * settle timer; when the width is stable for SETTLE_MS we read offsetWidth
     * (layout width, ignoring edit-zoom transform) and run a full layout sync only if that width changed.
     *
     * The settle debounce MUST use WorkerTimer (worker-thread timer), not main-thread
     * setTimeout: on Windows + Firefox the main-thread timer queue is starved during /
     * after the modal window-resize loop, so a plain setTimeout(fn, 250) armed when
     * resizing stops can sit unfired for ~28s (the ResizeObserver still fires on time,
     * but the trailing relayout never runs until much later). Worker timers are not
     * subject to that throttling, so the relayout fires promptly after the drag ends.
     */
    _initResponsiveCanvasWidthWatcher: function () {
        if (this._responsiveCanvasWidthWatcher || this._responsiveCanvasWidthWatcherFallback) return;
        const canvas = document.getElementById('dashboard-canvas');
        if (!canvas) return;

        const self = this;
        const SETTLE_MS = 200;
        const hasWorkerTimer = (typeof WorkerTimer !== 'undefined'
            && WorkerTimer && typeof WorkerTimer.setTimeout === 'function');
        const settleSet = hasWorkerTimer
            ? function (fn) { return WorkerTimer.setTimeout(fn, SETTLE_MS); }
            : function (fn) { return setTimeout(fn, SETTLE_MS); };
        const settleClear = hasWorkerTimer
            ? function (h) { WorkerTimer.clearTimeout(h); }
            : function (h) { clearTimeout(h); };

        const scheduleWidthCheck = function () {
            if ((MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) !== 'responsive') return;
            if (self._responsiveCanvasWidthSettleTimer) {
                settleClear(self._responsiveCanvasWidthSettleTimer);
            }
            self._responsiveCanvasWidthSettleTimer = settleSet(function () {
                self._responsiveCanvasWidthSettleTimer = null;
                self._onResponsiveCanvasWidthChanged();
            });
        };

        if (typeof ResizeObserver !== 'undefined') {
            this._responsiveCanvasWidthWatcher = new ResizeObserver(function () {
                scheduleWidthCheck();
            });
            this._responsiveCanvasWidthWatcher.observe(canvas);
        } else {
            window.addEventListener('resize', scheduleWidthCheck);
            this._responsiveCanvasWidthWatcherFallback = true;
        }
    },

    /**
     * After widgets are added or removed, re-pack Responsive Columns so empty
     * grid cells do not linger until the next editor open/close.
     */
    _requestResponsiveLayoutAfterStructureChange: function () {
        if (typeof this._isResponsiveLayoutMode !== 'function' || !this._isResponsiveLayoutMode()) return;
        this._requestResponsiveReflow();
    },

    /**
     * Masonry row-span reflow for Responsive Columns. The canvas uses a small fixed row
     * track; each widget must reserve enough rows to cover its content so widgets in the
     * same column pack directly beneath the one above with no cross-column gap. The span
     * is computed from the widget's INTRINSIC content height (container temporarily set
     * to height:auto so content-fill widgets like the clock collapse to 0 and fall back
     * to the widget's fixed designed height, then the Min Widget Height floor). The graph
     * reports its column width instead, so the canvas bitmap cannot stretch the cell.
     * Measuring the stretched height instead caused the old assign -> content fills ->
     * scrollHeight grows -> span grows loop. Full-pass callers (_runResponsiveLayoutSync on initial
     * apply and after canvas width settles) flush every widget first so JS-sized content
     * is already laid out at the new column width when measured; the trailing remeasure
     * re-renders any widget whose cell height changed once its span settles.
     * Runs rAF-debounced for single-widget updates (after render). Full sync pass is
     * used for initial apply and canvas width settle (see _initResponsiveCanvasWidthWatcher).
     */
    _requestResponsiveReflow: function (widgetId) {
        if (this._responsiveLayoutSyncRunning) return;
        // Composite group members do not reflow individually; route to the composite reflow.
        if (widgetId && typeof this.getWidgetCompositeContext === 'function') {
            const ctx = this.getWidgetCompositeContext(widgetId);
            if (ctx) {
                if (ctx.open) return; // authoring canvas is fixed-size, no masonry reflow
                this._requestGroupCompositeReflow(ctx.groupId);
                return;
            }
        }
        if (widgetId) {
            if (!this._responsiveReflowDirty) this._responsiveReflowDirty = {};
            this._responsiveReflowDirty[widgetId] = true;
        } else {
            this._responsiveReflowFullPass = true;
        }
        if (this._responsiveReflowScheduled) return;
        this._responsiveReflowScheduled = true;
        const self = this;
        const run = function () {
            self._responsiveReflowScheduled = false;
            const fullPass = self._responsiveReflowFullPass;
            const dirty = self._responsiveReflowDirty;
            self._responsiveReflowFullPass = false;
            self._responsiveReflowDirty = null;
            const anyPlacementChanged = self._runResponsiveReflowPass(fullPass, dirty);
            if (fullPass || anyPlacementChanged) {
                self._reflowAllGroupComposites();
                self._assignResponsiveGridPlacement();
                self._runResponsiveRemeasurePass();
            }
        };
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(run);
        } else {
            run();
        }
    },

    /**
     * Measurement pass: reserve enough small row tracks to cover each widget's INTRINSIC
     * content height (container temporarily set to height:auto so content-fill widgets
     * like the clock collapse to 0 and use the fixed designed-height fallback; the graph
     * reports half its column width), breaking
     * the old assign -> content fills -> scrollHeight grows -> span grows loop. fullPass
     * measures every widget; otherwise only the ids flagged in `dirty` (per-widget reflow
     * after a single widget rendered). Synchronous: callers force the render first.
     */
    _runResponsiveReflowPass: function (fullPass, dirty) {
        const activeMode = (MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) ? MASTER_SETTINGS.layoutMode : 'fixed';
        if (activeMode !== 'responsive') return false;
        const self = this;
        const getResp = (typeof BaseWidget !== 'undefined' && BaseWidget.getResponsiveLayout)
            ? BaseWidget.getResponsiveLayout : null;
        let anyPlacementChanged = false;
        const itemsToMeasure = [];
        const widgetKeys = Object.keys(self.widgets || {});

        for (let i = 0; i < widgetKeys.length; i++) {
            const id = widgetKeys[i];
            if (!fullPass && (!dirty || !dirty[id])) continue;
            const w = self.widgets[id];
            if (!w || !w.elements || !w.elements.wrapper || !w.elements.container) continue;
            if (w.elements.wrapper.style.display === 'none') {
                if (w._responsiveRowStart !== undefined || w._responsiveColStart !== undefined || w._responsiveRowSpan !== undefined) {
                    w._responsiveRowStart = undefined;
                    w._responsiveColStart = undefined;
                    w._responsiveRowSpan = undefined;
                    w._responsiveColumnSpan = undefined;
                    w.elements.wrapper.style.gridColumn = '';
                    w.elements.wrapper.style.gridRow = '';
                    anyPlacementChanged = true;
                }
                continue;
            }
            if (typeof self.getWidgetCompositeContext === 'function' && self.getWidgetCompositeContext(id)) continue;
            const resp = getResp ? (getResp(w.overrides) || {}) : (w.overrides && w.overrides.layout && w.overrides.layout.responsive) || {};

            if (self.resolveResponsiveHeightMode(resp) === 'fill') {
                const fillSpan = self.responsiveFillPackRowSpan(resp);
                if (w._responsiveRowSpan !== fillSpan) {
                    w._responsiveRowSpan = fillSpan;
                    anyPlacementChanged = true;
                }
                continue;
            }

            const explicitHeight = self.explicitResponsiveHeightPx(resp);
            let intrinsic = 0;
            let needsDom = false;

            if (BaseWidget.widgetUsesResponsiveRescale(w)) {
                const designH = BaseWidget.clampNumber(w.config && w.config.height, 1, null);
                const cellW = w.elements.wrapper.offsetWidth || 0;
                const cellH = w.elements.wrapper.offsetHeight || 0;
                const scale = self._responsiveWidgetScaleFactor(w, cellW, cellH);
                if (Number.isFinite(explicitHeight) && explicitHeight > 0) {
                    intrinsic = explicitHeight;
                } else if (designH > 0 && scale > 0) {
                    intrinsic = designH * scale;
                } else {
                    intrinsic = designH;
                }
            } else if (!(Number.isFinite(explicitHeight) && explicitHeight > 0)) {
                if (typeof w.measureResponsiveIntrinsicHeight === 'function') {
                    try {
                        intrinsic = Number(w.measureResponsiveIntrinsicHeight()) || 0;
                    } catch (errM) {
                        intrinsic = 0;
                    }
                }
                if (!(intrinsic > 0)) {
                    needsDom = true;
                }
            }

            itemsToMeasure.push({
                widget: w,
                resp: resp,
                explicitHeight: explicitHeight,
                intrinsic: intrinsic,
                needsDom: needsDom
            });
        }

        // Phase 1: Batch DOM writes for intrinsic auto-measurements
        for (let i = 0; i < itemsToMeasure.length; i++) {
            const item = itemsToMeasure[i];
            if (!item.needsDom) continue;
            const w = item.widget;
            const cs = w.elements.container.style;
            const ic = w.elements.innerContent;
            item.cs = cs;
            item.ic = ic;
            item.prevHeight = cs.height;
            item.prevIcOverflow = ic ? ic.style.overflow : null;
            cs.height = 'auto';
            if (ic) ic.style.overflow = 'visible';
        }

        // Phase 2: Batch DOM reads (single synchronous reflow across all widgets)
        for (let i = 0; i < itemsToMeasure.length; i++) {
            const item = itemsToMeasure[i];
            if (!item.needsDom) continue;
            const w = item.widget;
            try {
                const visible = w.elements.container.offsetHeight || 0;
                const full = w.elements.container.scrollHeight || 0;
                item.intrinsic = Math.max(visible, full);
            } catch (err) {
                item.intrinsic = 0;
            }
        }

        // Phase 3: Batch DOM restores
        for (let i = 0; i < itemsToMeasure.length; i++) {
            const item = itemsToMeasure[i];
            if (!item.needsDom) continue;
            if (item.ic) item.ic.style.overflow = item.prevIcOverflow;
            item.cs.height = item.prevHeight;
        }

        // Phase 4: Compute row spans and detect placement changes
        for (let i = 0; i < itemsToMeasure.length; i++) {
            const item = itemsToMeasure[i];
            const w = item.widget;
            const resp = item.resp;
            const userRowSpan = parseInt(resp.rowSpan, 10);
            const floor = Number.isFinite(userRowSpan) && userRowSpan > 0 ? userRowSpan : 0;
            const fixedHeight = (w.config && Number.isFinite(Number(w.config.height))) ? Number(w.config.height) : 0;
            const n = self.responsiveRowSpanFor(item.explicitHeight, item.intrinsic, floor, fixedHeight);

            const rawColSpan = (resp.columnSpan !== undefined && resp.columnSpan !== null)
                ? parseInt(resp.columnSpan, 10) : 1;
            let colSpan = Number.isFinite(rawColSpan) && rawColSpan > 0 ? rawColSpan : 1;
            if (typeof self.clampResponsiveColumnSpan === 'function') {
                colSpan = self.clampResponsiveColumnSpan(colSpan);
            }

            const userOrder = (resp.order !== undefined && resp.order !== null && Number.isFinite(resp.order)) ? resp.order : null;
            const userPrefCol = (resp.preferredColumn !== undefined && resp.preferredColumn !== null) ? Number(resp.preferredColumn) : 0;

            const placementChanged = (w._responsiveRowSpan !== n)
                || (w._responsiveColumnSpan !== colSpan)
                || (w._responsiveOrder !== userOrder)
                || (w._responsivePreferredCol !== userPrefCol);

            if (placementChanged) {
                w._responsiveRowSpan = n;
                w._responsiveColumnSpan = colSpan;
                w._responsiveOrder = userOrder;
                w._responsivePreferredCol = userPrefCol;
                anyPlacementChanged = true;

                let colStart = w._responsiveColStart;
                if (!(Number.isFinite(colStart) && colStart > 0)
                        && typeof self.responsivePreferredColumn === 'function') {
                    colStart = self.responsivePreferredColumn(resp.preferredColumn, colSpan);
                }
                self._writeResponsiveGridLines(
                    w.elements.wrapper,
                    colStart,
                    colSpan,
                    w._responsiveRowStart,
                    n
                );
            }
        }

        return anyPlacementChanged;
    },

    /**
     * Remeasure pass: re-run a widget's specific renderer when its measured grid-cell
     * width or height changed since the last render (clock face, graph canvas, slider
     * track size against the real cell). Cheap no-op when nothing moved. Synchronous.
     */
    _runResponsiveRemeasurePass: function () {
        const activeMode = (MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) ? MASTER_SETTINGS.layoutMode : 'fixed';
        if (activeMode !== 'responsive') return;
        const self = this;
        const widgetKeys = Object.keys(self.widgets || {});
        const toRemeasure = [];

        // Phase 1: Batch layout reads without modifying DOM
        for (let i = 0; i < widgetKeys.length; i++) {
            const id = widgetKeys[i];
            const w = self.widgets[id];
            if (!w || !w.elements || !w.elements.wrapper) continue;
            if (typeof self.getWidgetCompositeContext === 'function') {
                const ctx = self.getWidgetCompositeContext(id);
                if (ctx && !ctx.open) continue;
            }
            const el = w.elements;
            const measuredW = el.wrapper.offsetWidth || (el.container ? el.container.offsetWidth : 0) || 0;
            const measuredH = el.wrapper.offsetHeight || (el.container ? el.container.offsetHeight : 0) || 0;
            toRemeasure.push({ w: w, id: id, measuredW: measuredW, measuredH: measuredH });
        }

        // Phase 2: Batch render updates after all layout reads complete
        for (let i = 0; i < toRemeasure.length; i++) {
            const item = toRemeasure[i];
            const w = item.w;
            if (BaseWidget.widgetUsesResponsiveRescale(w)) {
                self._syncResponsiveWidgetScale(w);
                continue;
            }
            let changed = false;
            if (item.measuredW > 0 && item.measuredW !== w._effectiveLayoutWidth) {
                w._effectiveLayoutWidth = item.measuredW;
                changed = true;
            }
            if (item.measuredH > 0 && item.measuredH !== w._effectiveLayoutHeight) {
                w._effectiveLayoutHeight = item.measuredH;
                changed = true;
            }
            if (changed && typeof w._renderSpecific === 'function') {
                try {
                    w._renderSpecific();
                } catch (err) {
                    console.error('Responsive remeasure crashed for ' + item.id + ':', err);
                }
            }
        }
    },

    _getCanvasBounds: function () {
        const canvasEl = document.getElementById('dashboard-canvas');
        let canvasWidth = this._canvasDimensionPx(MASTER_SETTINGS.canvasWidth);
        let canvasHeight = this._canvasDimensionPx(MASTER_SETTINGS.canvasHeight);
        if (canvasEl) {
            if (canvasWidth <= 0) canvasWidth = canvasEl.clientWidth || canvasEl.offsetWidth || 0;
            if (canvasHeight <= 0) canvasHeight = canvasEl.clientHeight || canvasEl.offsetHeight || 0;
        }
        return { width: canvasWidth, height: canvasHeight };
    },

    _recenterWidgetsIfOutsideCanvas: function (widgetIds, gridStep = 1) {
        if (!Array.isArray(widgetIds) || widgetIds.length === 0) return;
        const bounds = this._getCanvasBounds();
        if (bounds.width <= 0 || bounds.height <= 0) return;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let hasOutside = false;

        widgetIds.forEach(id => {
            const widget = this.widgets[id];
            if (!widget || !widget.overrides) return;
            const width = BaseWidget.resolveInstanceWidth(widget.overrides);
            const height = BaseWidget.resolveInstanceHeight(widget.overrides);
            const x = Number(widget.overrides.x);
            const y = Number(widget.overrides.y);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + width);
            maxY = Math.max(maxY, y + height);
            if (x < 0 || y < 0 || (x + width) > bounds.width || (y + height) > bounds.height) {
                hasOutside = true;
            }
        });

        if (!hasOutside || !Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return;

        let deltaX = (bounds.width / 2) - ((minX + maxX) / 2);
        let deltaY = (bounds.height / 2) - ((minY + maxY) / 2);
        const safeGrid = Math.max(1, Number(gridStep) || 1);
        deltaX = Math.round(deltaX / safeGrid) * safeGrid;
        deltaY = Math.round(deltaY / safeGrid) * safeGrid;

        widgetIds.forEach(id => {
            const widget = this.widgets[id];
            if (!widget || !widget.overrides) return;
            const x = Number(widget.overrides.x);
            const y = Number(widget.overrides.y);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;
            widget.overrides.x = x + deltaX;
            widget.overrides.y = y + deltaY;
            if (this._getWidgetTypeByInstance(widget) === 'arrow') {
                widget.updatePositionSize();
            } else {
                widget.render();
            }
        });
    },

    _refreshEditorPageIndicator: function () {
        const label = document.getElementById('editor-page-indicator');
        const headerPage = document.getElementById('header-page-indicator');
        const prevBtn = document.getElementById('editor-page-prev');
        const nextBtn = document.getElementById('editor-page-next');
        if (!label || !prevBtn || !nextBtn) return;

        const currentPage = Math.max(1, Number(MASTER_SETTINGS.currentPage) || 1);
        const maxPage = this._getMaxDashboardPage();
        const pageText = `Page ${currentPage}`;
        if (!this._editorPageIndicatorEditing) {
            label.textContent = pageText;
        }
        if (headerPage) headerPage.textContent = `P${currentPage}`;

        const canGoPrev = currentPage > 1;
        const canGoNext = currentPage < maxPage;
        prevBtn.classList.toggle('opacity-50', !canGoPrev);
        prevBtn.classList.toggle('pointer-events-none', !canGoPrev);
        nextBtn.classList.toggle('opacity-50', !canGoNext);
        nextBtn.classList.toggle('pointer-events-none', !canGoNext);
        if (typeof QuickToolbar !== 'undefined' && typeof QuickToolbar.refresh === 'function') {
            QuickToolbar.refresh();
        }
    },

    _bindEditorPageIndicatorEditor: function () {
        const label = document.getElementById('editor-page-indicator');
        if (!label || label.getAttribute('data-page-edit-bound') === '1') return;
        label.setAttribute('data-page-edit-bound', '1');
        label.classList.add('cursor-pointer');
        label.setAttribute('title', 'Current dashboard page (click to type a page number)');

        const self = this;
        label.addEventListener('click', function () {
            if (label.querySelector('input')) return;
            const currentPage = Math.max(1, Number(MASTER_SETTINGS.currentPage) || 1);
            self._editorPageIndicatorEditing = true;
            label.textContent = '';
            const input = document.createElement('input');
            input.type = 'text';
            input.inputMode = 'numeric';
            input.className = 'editor-page-indicator-input';
            input.setAttribute('aria-label', 'Dashboard page number');
            input.value = String(currentPage);
            label.appendChild(input);
            input.focus();
            input.select();

            function finish(applyParsed) {
                if (!input.parentNode || input.parentNode !== label) return;
                self._editorPageIndicatorEditing = false;
                if (applyParsed) {
                    const rawVal = String(input.value).trim();
                    const num = parseInt(rawVal, 10);
                    const maxPage = self._getMaxDashboardPage();
                    if (Number.isFinite(num) && !isNaN(num)) {
                        const clamped = Math.max(1, Math.min(maxPage, num));
                        const prev = Math.max(1, Number(MASTER_SETTINGS.currentPage) || 1);
                        if (clamped !== prev) {
                            self.updateGlobal({ currentPage: clamped });
                        }
                    }
                }
                label.removeChild(input);
                self._refreshEditorPageIndicator();
            }

            function onBlur() {
                finish(true);
            }
            input.addEventListener('blur', onBlur);
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    input.blur();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    input.removeEventListener('blur', onBlur);
                    self._editorPageIndicatorEditing = false;
                    if (input.parentNode === label) label.removeChild(input);
                    self._refreshEditorPageIndicator();
                }
            });
        });
    },

    stepEditorPage: function (delta) {
        const step = Number(delta);
        if (!Number.isFinite(step) || step === 0) return;
        const currentPage = Math.max(1, Number(MASTER_SETTINGS.currentPage) || 1);
        const maxPage = this._getMaxDashboardPage();
        const targetPage = Math.max(1, Math.min(maxPage, currentPage + step));
        if (targetPage === currentPage) return;
        this.updateGlobal({ currentPage: targetPage });
    },

    beginHistoryAction: function (label = '') {
        if (this.isApplyingHistory) return;
        this.history.pendingAction = {
            label: label,
            entries: []
        };
    },

    _recordHistoryEntry: function (entry) {
        if (!entry || this.isApplyingHistory) return;
        const pending = this.history.pendingAction;
        if (pending && Array.isArray(pending.entries)) {
            pending.entries.push(entry);
            return;
        }
        this._pushUndoEntry(entry);
    },

    commitHistoryAction: function () {
        if (this.isApplyingHistory) return;
        const pending = this.history.pendingAction;
        this.history.pendingAction = null;
        if (!pending || !Array.isArray(pending.entries) || pending.entries.length === 0) return;
        if (pending.entries.length === 1) {
            this._pushUndoEntry(pending.entries[0]);
            return;
        }
        this._pushUndoEntry({
            kind: 'batch',
            label: pending.label || 'Batch',
            entries: pending.entries
        });
    },

    cancelHistoryAction: function () {
        this.history.pendingAction = null;
    },

    clearHistory: function () {
        this.history.undoStack = [];
        this.history.redoStack = [];
        this.history.pendingAction = null;
        this._refreshHistoryUiState();
    },

    _pushUndoEntry: function (entry) {
        if (!entry) return;
        this.history.undoStack.push(entry);
        if (this.history.undoStack.length > this.history.maxSteps) {
            this.history.undoStack.shift();
        }
        this.history.redoStack = [];
        this._refreshHistoryUiState();
    },

    _applySelectionState: function (selectionState) {
        if (!selectionState) return;
        this.selectedIds = this._sanitizeSelectionIds(selectionState.selectedIds || []);
        this.selectedGroupId = selectionState.selectedGroupId || null;
        this.openedGroupId = selectionState.openedGroupId || null;
        this._syncSelectedGroupFromSelection();
        this._applySelectionVisualState();
        if (typeof Editor !== 'undefined') {
            if (this.selectedIds.length === 0) {
                Editor.currentId = 'GLOBAL_SETTINGS';
                Editor.loadWidget('GLOBAL_SETTINGS');
            } else if (this.selectedIds.length === 1) {
                Editor.currentId = this.selectedIds[0];
                Editor.loadWidget(this.selectedIds[0]);
            } else {
                Editor.currentId = 'MULTIPLE';
                Editor.loadWidget('MULTIPLE');
            }
            Editor.updateToolbarState();
        }
    },

    _captureSelectionState: function () {
        return {
            selectedIds: this._cloneJson(this.selectedIds || []),
            selectedGroupId: this.selectedGroupId || null,
            openedGroupId: this.openedGroupId || null
        };
    },

    _applyHistoryEntry: function (entry, direction) {
        if (!entry) return;
        if (entry.kind === 'batch') {
            const inner = direction === 'undo' ? [...entry.entries].reverse() : entry.entries;
            inner.forEach(subEntry => this._applyHistoryEntry(subEntry, direction));
            return;
        }

        if (entry.kind === 'widget-overrides') {
            const payloadSrc = direction === 'undo' ? entry.before : entry.after;
            if (!payloadSrc || !this.widgets[entry.id]) return;
            const replace = entry.replace === true;
            const payload = this._cloneJson(payloadSrc);
            const widget = this.widgets[entry.id];
            // Arrow endpoints live in canvas space; move-drag history only stores x/y. Without shifting
            // geometry, undo/redo restores x/y but _renderSpecific snaps the wrapper back to the old bbox.
            if (!replace && this._getWidgetTypeByInstance(widget) === 'arrow') {
                const keys = Object.keys(payload);
                const layoutPosOnly = keys.length > 0 && keys.every(k => k === 'x' || k === 'y');
                if (layoutPosOnly) {
                    const wov = widget.overrides || {};
                    const curX = Number(wov.x);
                    const curY = Number(wov.y);
                    const nextX = payload.x !== undefined ? Number(payload.x) : curX;
                    const nextY = payload.y !== undefined ? Number(payload.y) : curY;
                    const dx = (Number.isFinite(nextX) ? nextX : 0) - (Number.isFinite(curX) ? curX : 0);
                    const dy = (Number.isFinite(nextY) ? nextY : 0) - (Number.isFinite(curY) ? curY : 0);
                    if (dx !== 0 || dy !== 0) {
                        const mergedPatch = { ...payload };
                        if (Number.isFinite(Number(wov.fromX))) mergedPatch.fromX = Number(wov.fromX);
                        if (Number.isFinite(Number(wov.fromY))) mergedPatch.fromY = Number(wov.fromY);
                        if (Number.isFinite(Number(wov.toX))) mergedPatch.toX = Number(wov.toX);
                        if (Number.isFinite(Number(wov.toY))) mergedPatch.toY = Number(wov.toY);
                        if (Array.isArray(wov.customPoints) && wov.customPoints.length > 0) {
                            mergedPatch.customPoints = this._cloneJson(wov.customPoints);
                        }
                        this._offsetArrowOverrides(mergedPatch, dx, dy);
                        this.updateWidget(entry.id, mergedPatch, false);
                        return;
                    }
                }
            }
            this.updateWidget(entry.id, payload, replace);
            if (entry.appliedPresetBefore !== undefined || entry.appliedPresetAfter !== undefined) {
                const rec = direction === 'undo' ? entry.appliedPresetBefore : entry.appliedPresetAfter;
                this._applyAppliedPresetRec(entry.id, rec);
            }
            return;
        }

        if (entry.kind === 'widget-bindings') {
            const payload = direction === 'undo' ? entry.before : entry.after;
            if (!payload || !this.widgets[entry.id]) return;
            this.updateWidgetBinding(entry.id, this._cloneJson(payload), entry.replace === true);
            return;
        }

        if (entry.kind === 'global-settings') {
            const payload = direction === 'undo' ? entry.before : entry.after;
            if (!payload) return;
            this.updateGlobal(this._pickObjectKeys(payload, Object.keys(payload)), true, false);
            return;
        }

        if (entry.kind === 'global-bindings') {
            const payload = direction === 'undo' ? entry.before : entry.after;
            if (!payload) return;
            this.updateGlobalBinding(this._cloneJson(payload), entry.replace === true);
            return;
        }

        if (entry.kind === 'widget-create-delete') {
            const targetState = direction === 'undo' ? entry.beforeWidget : entry.afterWidget;
            if (targetState) {
                this._restoreWidgetState(targetState);
            } else if (entry.widgetId) {
                this._deleteWidgetById(entry.widgetId);
            }
            if (entry.beforeGroups && direction === 'undo') this.groups = this._cloneJson(entry.beforeGroups);
            if (entry.afterGroups && direction === 'redo') this.groups = this._cloneJson(entry.afterGroups);
            this.cleanupInvalidGroups();
            const targetSelection = direction === 'undo' ? entry.beforeSelection : entry.afterSelection;
            this._applySelectionState(targetSelection);
            this._requestResponsiveLayoutAfterStructureChange();
            return;
        }

        if (entry.kind === 'widgets-delete-restore') {
            const restoreWidgets = direction === 'undo' ? entry.beforeWidgets : entry.afterWidgets;
            const removeIds = direction === 'undo' ? entry.afterDeletedIds : entry.beforeDeletedIds;
            (removeIds || []).forEach(id => this._deleteWidgetById(id));
            (restoreWidgets || []).forEach(state => this._restoreWidgetState(state));
            if (direction === 'undo' && entry.beforeGroups) this.groups = this._cloneJson(entry.beforeGroups);
            if (direction === 'redo' && entry.afterGroups) this.groups = this._cloneJson(entry.afterGroups);
            this.cleanupInvalidGroups();
            const targetSelection = direction === 'undo' ? entry.beforeSelection : entry.afterSelection;
            this._applySelectionState(targetSelection);
            this._requestResponsiveLayoutAfterStructureChange();
            return;
        }

        if (entry.kind === 'groups') {
            this.groups = this._cloneJson(direction === 'undo' ? entry.beforeGroups : entry.afterGroups) || {};
            this.cleanupInvalidGroups();
            const targetSelection = direction === 'undo' ? entry.beforeSelection : entry.afterSelection;
            this._applySelectionState(targetSelection);
            Object.values(this.widgets).forEach(w => w.render());
            return;
        }
    },

    undo: function () {
        if (!this.hasUndo()) return;
        const entry = this.history.undoStack.pop();
        this.isApplyingHistory = true;
        try {
            this._applyHistoryEntry(entry, 'undo');
            this.history.redoStack.push(entry);
            if (this.history.redoStack.length > this.history.maxSteps) {
                this.history.redoStack.shift();
            }
            this.loadFonts();
            this.markUnsaved();
        } finally {
            this.isApplyingHistory = false;
            this._refreshHistoryUiState();
            this._refreshEditorPageIndicator();
        }
    },

    redo: function () {
        if (!this.hasRedo()) return;
        const entry = this.history.redoStack.pop();
        this.isApplyingHistory = true;
        try {
            this._applyHistoryEntry(entry, 'redo');
            this.history.undoStack.push(entry);
            if (this.history.undoStack.length > this.history.maxSteps) {
                this.history.undoStack.shift();
            }
            this.loadFonts();
            this.markUnsaved();
        } finally {
            this.isApplyingHistory = false;
            this._refreshHistoryUiState();
            this._refreshEditorPageIndicator();
        }
    },

    _isOfflineWarningEnabled: function () {
        if (typeof MASTER_SETTINGS.warnWhenDriverOffline === 'boolean') return MASTER_SETTINGS.warnWhenDriverOffline;
        if (!window.APP_CONFIG || !window.APP_CONFIG.ui) return false;
        return window.APP_CONFIG.ui.warnWhenDriverOffline === true;
    },

    _clearDriverOfflineWarningTimer: function () {
        if (this._driverOfflineWarningTimer) {
            clearTimeout(this._driverOfflineWarningTimer);
            this._driverOfflineWarningTimer = null;
        }
    },

    _scheduleDriverOfflineWarning: function (driverLabel, statusText) {
        const modal = document.getElementById('driver-offline-warning');
        if (modal && modal.classList.contains('show')) {
            this._showDriverOfflineWarning(driverLabel, statusText);
            return;
        }
        this._pendingOfflineWarningDriverLabel = driverLabel;
        this._pendingOfflineWarningStatusText = statusText;
        if (this._driverOfflineWarningTimer) return;
        const self = this;
        const delayMs = (typeof this._driverOfflineWarningDelayMs === 'number') ? this._driverOfflineWarningDelayMs : 2000;
        this._driverOfflineWarningTimer = setTimeout(function () {
            self._driverOfflineWarningTimer = null;
            if (!self._driverHasConnectedOnce || self._driverOfflineWarningDismissed || self._dataDriverConnected) return;
            self._showDriverOfflineWarning(self._pendingOfflineWarningDriverLabel, self._pendingOfflineWarningStatusText);
        }, delayMs);
    },

    _showDriverOfflineWarning: function (driverLabel, statusText) {
        const modal = document.getElementById('driver-offline-warning');
        const msgEl = document.getElementById('driver-offline-warning-message');
        if (!modal || !msgEl) return;

        const safeDriverLabel = String(driverLabel || 'active').trim() || 'active';
        const safeStatus = String(statusText || '').trim();
        const statusSuffix = safeStatus ? ` Current status: ${safeStatus}.` : '';
        msgEl.textContent = `Connection to the ${safeDriverLabel} driver is temporarily unavailable. Dashboard Studio will keep trying to reconnect automatically.${statusSuffix}`;

        if (!modal.classList.contains('show')) {
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
        }
    },

    _hideDriverOfflineWarning: function (dismissedByUser = false) {
        this._clearDriverOfflineWarningTimer();
        if (dismissedByUser && this._driverOfflineSessionActive) {
            this._driverOfflineWarningDismissed = true;
        }
        const modal = document.getElementById('driver-offline-warning');
        if (!modal) return;
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    },

    applyUIConfig: function () {
        const ui = window.APP_CONFIG.ui;

        const dashLocal = document.getElementById('btn-group-dashboard-local');
        const tplLocal = document.getElementById('btn-group-template-local');

        if (dashLocal) dashLocal.style.display = ui.showLocalButtons ? 'grid' : 'none';
        if (tplLocal) tplLocal.style.display = ui.showLocalButtons ? 'flex' : 'none';

        this.updateStorageUI();
    },

    updateStorageUI: function () {
        const driver = DataDriverRegistry.get();
        const supportsStorage = driver ? driver.supportsFileStorage : false;

        const showServer = supportsStorage && window.APP_CONFIG.ui.showServerButtons;

        const dashServer = document.getElementById('btn-group-dashboard-server');
        const tplServer = document.getElementById('btn-group-template-server');

        if (dashServer) dashServer.style.display = showServer ? 'grid' : 'none';
        if (tplServer) tplServer.style.display = showServer ? 'flex' : 'none';
        if (typeof QuickToolbar !== 'undefined' && typeof QuickToolbar.refresh === 'function') {
            QuickToolbar.refresh();
        }
    },

    // Memory-Friendly Smart Font Scanner
    loadFonts: function (forceFonts = null) {
        const activeFonts = new Set();

        const addFamily = (s) => {
            if (s && typeof s === 'string' && s.trim()) activeFonts.add(s.trim());
        };

        const isFontFamilyKey = (k) => k === 'fontFamily' || k.endsWith('Font') || k.endsWith('Fam');

        if (forceFonts && Array.isArray(forceFonts)) {
            forceFonts.forEach(f => {
                if (f && typeof f === 'string' && f.trim()) addFamily(`'${f.trim()}', sans-serif`);
            });
        }

        const customArr = Array.isArray(MASTER_SETTINGS.customFonts) ? MASTER_SETTINGS.customFonts : [];
        customArr.forEach(cf => {
            if (cf && typeof cf === 'string' && cf.trim()) addFamily(`'${cf.trim()}', sans-serif`);
        });

        const collectFromBag = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            Object.keys(obj).forEach((k) => {
                if (!isFontFamilyKey(k)) return;
                const v = obj[k];
                if (typeof v === 'string') addFamily(v);
            });
            const typo = obj.typography;
            if (!typo || typeof typo !== 'object') return;
            Object.keys(typo).forEach((role) => {
                const block = typo[role];
                if (!block || typeof block !== 'object') return;
                if (typeof block.fontFamily === 'string') addFamily(block.fontFamily);
            });
        };

        collectFromBag(MASTER_SETTINGS);

        const factoryFontsByType = {};
        Object.values(this.widgets).forEach((w) => {
            if (!w) return;
            collectFromBag(w.overrides);
            let type = null;
            if (typeof WidgetRegistry !== 'undefined' && typeof WidgetRegistry.getTypeKeyForClass === 'function') {
                type = WidgetRegistry.getTypeKeyForClass(w.constructor);
            }
            if (!type || factoryFontsByType[type]) return;
            factoryFontsByType[type] = true;
            let factory = {};
            if (typeof w._getFactoryDefaults === 'function') {
                factory = w._getFactoryDefaults();
            } else if (typeof w.getDefaultOverrides === 'function') {
                try {
                    factory = w.getDefaultOverrides() || {};
                } catch (eFac) {
                    factory = {};
                }
            }
            collectFromBag(factory);
        });

        if (activeFonts.size === 0) return;

        const fontsToLoad = Array.from(activeFonts).map(f => {
            let name = f.split(',')[0].replace(/['"]/g, '').trim();
            return name.replace(/ /g, '+') + ":wght@300;400;500;600;700";
        });

        const fontQuery = Array.from(new Set(fontsToLoad)).join('&family=');
        const url = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;

        let link = document.getElementById('dynamic-fonts');
        if (!link) {
            link = document.createElement('link');
            link.id = 'dynamic-fonts';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        if (link.href !== url) {
            link.href = url;
            console.log(`[Dashboard] Loaded active fonts: ${Array.from(new Set(fontsToLoad)).length}`);
        }
    },

    populateAddWidgetMenu: function () {
        const wrap = document.getElementById('add-widget-type-wrap');
        if (!wrap) return;

        wrap.innerHTML = '';

        const customSelect = document.createElement('div');
        customSelect.className = 'relative w-full z-50';

        const btn = document.createElement('div');
        btn.className = 'control-input w-full flex items-center justify-between cursor-pointer select-none';
        btn.innerHTML = '<div id="add-select-label" class="flex items-center min-w-0 flex-1 overflow-hidden whitespace-nowrap"></div><i class="ph-bold ph-caret-down editor-muted-text ml-2"></i>';

        const menu = document.createElement('div');
        menu.className = 'absolute top-full mt-2 left-0 w-full ds-editor-menu max-h-64 hidden z-[2000]';

        menu._dsSelectAnchor = customSelect;

        btn.onclick = (e) => {
            e.stopPropagation();
            if (typeof Editor !== 'undefined' && Editor._toggleDsFixedDropdown) {
                Editor._toggleDsFixedDropdown(menu, btn, true);
            } else {
                menu.classList.toggle('hidden');
            }
        };

        if (typeof Editor !== 'undefined' && Editor._bindDsFixedDropdownOutsideClick) {
            Editor._bindDsFixedDropdownOutsideClick();
        }

        const sortedTypes = Object.keys(WidgetRegistry.widgets).sort((a, b) => {
            const wClassA = WidgetRegistry.widgets[a];
            const wClassB = WidgetRegistry.widgets[b];
            const labelA = (wClassA.metadata && wClassA.metadata.label ? wClassA.metadata.label : a).toLowerCase();
            const labelB = (wClassB.metadata && wClassB.metadata.label ? wClassB.metadata.label : b).toLowerCase();
            return labelA.localeCompare(labelB);
        });
        let firstType = null;

        sortedTypes.forEach(type => {
            if (this.isWidgetHidden(type)) return;
            if (!firstType) firstType = type;
            const wClass = WidgetRegistry.widgets[type];
            const meta = wClass.metadata || { label: type };

            const item = document.createElement('div');
            item.className = 'ds-editor-menu-item truncate flex items-center';

            const tagHtml = window.WidgetRegistry ? window.WidgetRegistry.getWidgetTagHtml(type, true) : `<span>${meta.label}</span>`;
            item.innerHTML = tagHtml;
            if (typeof Editor !== 'undefined' && typeof Editor._bindOverflowTitle === 'function') {
                Editor._bindOverflowTitle(item, item, function () { return item.textContent; });
            }

            item.onmousedown = (e) => { e.preventDefault(); };
            item.onclick = (e) => {
                e.stopPropagation();
                if (typeof Editor !== 'undefined' && Editor._closeDsFixedDropdown) {
                    Editor._closeDsFixedDropdown(menu);
                } else {
                    menu.classList.add('hidden');
                }
                wrap.dataset.value = type;
                btn.querySelector('#add-select-label').innerHTML = tagHtml;
            };
            menu.appendChild(item);
        });

        if (firstType) {
            wrap.dataset.value = firstType;
            const initialTag = window.WidgetRegistry ? window.WidgetRegistry.getWidgetTagHtml(firstType, true) : `<span>${firstType}</span>`;
            btn.querySelector('#add-select-label').innerHTML = initialTag;
        }

        customSelect.appendChild(btn);
        customSelect.appendChild(menu);
        wrap.appendChild(customSelect);
        const addLabel = btn.querySelector('#add-select-label');
        if (typeof Editor !== 'undefined' && typeof Editor._bindOverflowTitle === 'function') {
            Editor._bindOverflowTitle(btn, addLabel, function () {
                return addLabel ? addLabel.textContent : '';
            });
        }
    },

    _getPresetThemes: function () {
        if (typeof PRESET_THEMES !== 'undefined') return PRESET_THEMES;
        if (typeof PRESET_TEMPLATES !== 'undefined') return PRESET_TEMPLATES;
        return null;
    },

    initTemplateDropdown: function () {
        const wrapper = document.getElementById('template-select-wrapper');
        const btn = document.getElementById('template-select-btn');
        const menu = document.getElementById('template-select-menu');

        if (!wrapper || !btn || !menu || !this._getPresetThemes()) return;

        menu._dsSelectAnchor = wrapper;

        btn.onclick = (e) => {
            e.stopPropagation();
            if (menu.classList.contains('hidden')) {
                void this.refreshTemplateDropdown().then(() => {
                    if (typeof Editor !== 'undefined' && Editor._toggleDsFixedDropdown) {
                        Editor._toggleDsFixedDropdown(menu, btn, true);
                    } else {
                        menu.classList.remove('hidden');
                    }
                });
            } else {
                if (typeof Editor !== 'undefined' && Editor._closeDsFixedDropdown) {
                    Editor._closeDsFixedDropdown(menu);
                } else {
                    menu.classList.add('hidden');
                }
            }
        };

        if (typeof Editor !== 'undefined' && Editor._bindDsFixedDropdownOutsideClick) {
            Editor._bindDsFixedDropdownOutsideClick();
        }

        const templateBtn = document.getElementById('template-select-btn');
        const templateLabel = document.getElementById('template-select-label');
        if (templateBtn && typeof Editor !== 'undefined' && typeof Editor._bindOverflowTitle === 'function') {
            Editor._bindOverflowTitle(templateBtn, templateLabel, function () {
                const el = document.getElementById('template-select-label');
                return el ? el.textContent : '';
            });
        }

        void this.refreshTemplateDropdown();

        const currentThemeKey = (wrapper && wrapper.dataset && wrapper.dataset.value)
            || (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.theme);
        if (currentThemeKey) {
            this._syncThemeDropdownAndInspector(currentThemeKey);
        }
    },

    refreshTemplateDropdown: async function () {
        const menu = document.getElementById('template-select-menu');
        const presetThemes = this._getPresetThemes();
        if (!menu || !presetThemes) return;
        menu.innerHTML = '';

        const closeMenu = () => {
            if (typeof Editor !== 'undefined' && Editor._closeDsFixedDropdown) {
                Editor._closeDsFixedDropdown(menu);
            } else {
                menu.classList.add('hidden');
            }
        };

        const addGroupHeader = (title) => {
            const hdr = document.createElement('div');
            hdr.className = 'ds-select-group';
            hdr.textContent = title;
            menu.appendChild(hdr);
        };

        const addOption = (key, name, onDelete) => {
            const opt = document.createElement('div');
            opt.className = 'ds-select-opt';
            opt.dataset.value = key;
            opt.onmousedown = (e) => { e.preventDefault(); };

            const label = document.createElement('span');
            label.className = 'ds-select-opt-label';
            label.textContent = name;
            opt.appendChild(label);

            if (typeof onDelete === 'function') {
                this._appendDsSelectDeleteButton(opt, onDelete);
            }

            if (typeof Editor !== 'undefined' && typeof Editor._bindOverflowTitle === 'function') {
                Editor._bindOverflowTitle(opt, label, function () { return label.textContent; });
            }

            opt.onclick = (e) => {
                e.stopPropagation();
                closeMenu();
                Dashboard.loadTemplate(key);
            };
            menu.appendChild(opt);
        };

        const userTemplates = await this._loadUserTemplates();
        const keys = [];
        const userFull = userTemplates.filter((t) => (t.kind || this.THEME_KIND_FULL) === this.THEME_KIND_FULL);
        const userAdj = userTemplates.filter((t) => (t.kind || this.THEME_KIND_FULL) !== this.THEME_KIND_FULL);
        const builtinKeys = Object.keys(presetThemes);
        const builtinFull = builtinKeys.filter((k) => this._builtinThemeKind(k) === this.THEME_KIND_FULL);
        const builtinAdj = builtinKeys.filter((k) => this._builtinThemeKind(k) !== this.THEME_KIND_FULL);
        const addUserGroup = (title, list) => {
            if (!list.length) return;
            addGroupHeader(title);
            list.forEach((t) => {
                const key = 'user:' + t.name;
                addOption(key, t.name, () => this.deleteUserTemplate(t.name));
                keys.push(key);
            });
        };
        addUserGroup('My Full Themes', userFull);
        addUserGroup('My Adjustment Themes', userAdj);
        const addBuiltinGroup = (title, list) => {
            if (!list.length) return;
            addGroupHeader(title);
            list.forEach((key) => {
                addOption(key, presetThemes[key].name);
                keys.push(key);
            });
        };
        addBuiltinGroup(userTemplates.length > 0 ? 'Built-in Full Themes' : 'Full Themes', builtinFull);
        addBuiltinGroup('Built-in Adjustment Themes', builtinAdj);

        this._templateKeySequence = keys;
    },

    getThemeSelectOptions: function () {
        const options = [];
        const user = this._cachedUserTemplates || [];
        const self = this;
        const pushUserGroup = (title, list) => {
            if (!list.length) return;
            options.push({ isHeader: true, text: title });
            for (let i = 0; i < list.length; i++) {
                options.push({ value: 'user:' + list[i].name, text: list[i].name });
            }
        };
        pushUserGroup('My Full Themes', user.filter((t) => self.isFullThemeKeyCached('user:' + t.name)));
        pushUserGroup('My Adjustment Themes', user.filter((t) => !self.isFullThemeKeyCached('user:' + t.name)));
        const presetThemes = this._getPresetThemes();
        if (presetThemes) {
            const keys = Object.keys(presetThemes);
            const pushBuiltinGroup = (title, list) => {
                if (!list.length) return;
                options.push({ isHeader: true, text: title });
                for (let i = 0; i < list.length; i++) {
                    const k = list[i];
                    options.push({ value: k, text: (presetThemes[k] && presetThemes[k].name) ? presetThemes[k].name : k });
                }
            };
            pushBuiltinGroup(
                user.length > 0 ? 'Built-in Full Themes' : 'Full Themes',
                keys.filter((k) => self._builtinThemeKind(k) === self.THEME_KIND_FULL)
            );
            pushBuiltinGroup(
                'Built-in Adjustment Themes',
                keys.filter((k) => self._builtinThemeKind(k) !== self.THEME_KIND_FULL)
            );
        }
        return options;
    },

    /**
     * Resolves an incoming topic payload to a valid theme key.
     * Matches built-in themes (key, display name, slug) and user themes (case-insensitive, slug).
     * Returns matching key string (e.g. 'default_dark', 'user:MyTheme') or null if no match.
     */
    resolveThemeKey: function (val) {
        if (val === null || val === undefined) return null;
        let str = '';
        if (typeof val === 'object') {
            str = val.theme || val.template || val.value || val.val || val.name || val.id || val.text || val.payload || '';
        } else {
            str = String(val);
        }
        str = str.trim();
        if ((str.indexOf('"') === 0 && str.lastIndexOf('"') === str.length - 1 && str.length >= 2) ||
            (str.indexOf("'") === 0 && str.lastIndexOf("'") === str.length - 1 && str.length >= 2)) {
            str = str.slice(1, -1).trim();
        }
        if (str.indexOf('{') === 0 && str.lastIndexOf('}') === str.length - 1) {
            try {
                const parsed = JSON.parse(str);
                if (parsed && typeof parsed === 'object') {
                    const inner = parsed.theme || parsed.template || parsed.value || parsed.val || parsed.name || parsed.id || parsed.text || parsed.payload;
                    if (inner) str = String(inner).trim();
                }
            } catch (e) {}
        }
        if (!str) return null;

        const normalize = function (s) {
            return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        };

        const rawLower = str.toLowerCase();
        let isExplicitUser = false;
        let userCandidate = str;
        if (rawLower.indexOf('user:') === 0) {
            userCandidate = str.slice(5).trim();
            isExplicitUser = true;
        }

        const normCandidate = normalize(userCandidate);
        if (!normCandidate) return null;

        const userList = this._cachedUserTemplates || [];
        for (let i = 0; i < userList.length; i++) {
            const uName = String(userList[i].name || '').trim();
            if (uName === userCandidate || normalize(uName) === normCandidate) {
                return 'user:' + uName;
            }
        }
        if (isExplicitUser) return null;

        const presetThemes = this._getPresetThemes();
        if (presetThemes) {
            if (presetThemes[str]) return str;

            const keys = Object.keys(presetThemes);

            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                if (k.toLowerCase() === rawLower) return k;
                const tName = String(presetThemes[k].name || '').trim();
                if (tName && tName.toLowerCase() === rawLower) return k;
            }

            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                if (normalize(k) === normCandidate) return k;
                const tName = String(presetThemes[k].name || '').trim();
                if (tName && normalize(tName) === normCandidate) return k;
            }
        }

        return null;
    },

    /**
     * Applies a theme dynamically from an incoming topic payload.
     * If payload matches a theme, switches theme cleanly. If not, does nothing.
     */
    applyThemeFromTopicPayload: async function (value) {
        if (!this._getPresetThemes()) {
            if (typeof WidgetScriptLoader !== 'undefined') {
                if (typeof WidgetScriptLoader.ensureThemesScript === 'function') {
                    await WidgetScriptLoader.ensureThemesScript();
                } else if (typeof WidgetScriptLoader.ensureTemplatesScript === 'function') {
                    await WidgetScriptLoader.ensureTemplatesScript();
                }
            }
        }
        if (!this._cachedUserTemplates) {
            await this._loadUserTemplates();
        }
        const matchedKey = this.resolveThemeKey(value);
        if (!matchedKey) {
            console.warn('[Dashboard] Dynamic theme: topic payload did not match any known theme:', value);
            return;
        }
        console.log('[Dashboard] Dynamic theme switching to:', matchedKey, '(from payload:', value, ')');
        if (matchedKey.indexOf('user:') === 0) {
            await this.loadUserTemplate(matchedKey.slice(5), { isSystem: true, skipMarkUnsaved: true });
        } else {
            this.loadTemplate(matchedKey, { isSystem: true, skipMarkUnsaved: true });
        }
    },

    THEME_KIND_FULL: 'full',
    THEME_KIND_ADJUSTMENT: 'adjustment',

    /** Master schema groups that are not look and never become theme rows or save keys. */
    THEME_SURFACE_SKIP_GROUPS: {
        m_conn: true,
        m_editor: true,
        m_audio: true,
        m_dialog_box: true,
        m_dse: true,
        driver_specifics: true
    },

    THEME_SURFACE_SKIP_FIELD_TYPES: {
        heading: true,
        spacer: true,
        widget_presets: true,
        theme_toolbar: true,
        widget_defaults_toolbar: true,
        driver_stats: true,
        topic_monitor: true,
        color_correction: true,
        font_list: true,
        audio_topic_map: true,
        audio_trigger_map: true
    },

    /** Identity / paging / canvas size: never stored on a theme even if edited. */
    THEME_SURFACE_SKIP_KEYS: {
        theme: true,
        currentPage: true,
        currentPageOutputTopic: true,
        canvasWidth: true,
        canvasHeight: true,
        canvasPreset: true,
        resetLookOnThemeApply: true
    },

    /** Memo of user theme kinds by file name. Invalidated on theme save/delete. */
    _userThemeKindCache: null,

    /**
     * Normalize a theme kind. A theme without a stored kind (all themes saved
     * before kinds existed) is a Full theme: it replaces the whole look.
     * Adjustment is always an explicit opt-in at save time.
     */
    _themeKindOf: function (record) {
        if (record && (record.themeKind === 'full' || record.themeKind === 'adjustment')) {
            return record.themeKind;
        }
        return this.THEME_KIND_FULL;
    },

    _getUserThemeKindCache: function () {
        if (!this._userThemeKindCache) this._userThemeKindCache = {};
        return this._userThemeKindCache;
    },

    _invalidateUserThemeKind: function (name) {
        const cache = this._getUserThemeKindCache();
        if (name) delete cache[String(name)];
        else this._userThemeKindCache = {};
    },

    /**
     * Kind of one saved user theme. Cached so dropdowns and the explorer do
     * not re-read the file on every open. Falls back to Adjustment (overlay).
     */
    _fetchUserThemeKind: async function (name) {
        const key = String(name || '');
        if (!key) return this.THEME_KIND_FULL;
        const cache = this._getUserThemeKindCache();
        if (cache[key]) return cache[key];
        let kind = this.THEME_KIND_FULL;
        try {
            const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
            const provider = driver && (typeof driver.getStorageProvider === 'function') ? driver.getStorageProvider() : null;
            if (provider && typeof provider.load === 'function') {
                const data = await provider.load('templates', key);
                kind = this._themeKindOf(data, false);
            }
        } catch (e) { /* overlay fallback */ }
        cache[key] = kind;
        return kind;
    },

    /** Kind of a built-in theme key. Built-ins without a stored kind are Full. */
    _builtinThemeKind: function (templateKey) {
        const presetThemes = this._getPresetThemes();
        if (presetThemes && presetThemes[templateKey]) {
            return this._themeKindOf(presetThemes[templateKey], true);
        }
        return this.THEME_KIND_FULL;
    },

    /**
     * Whether applying this theme key replaces the whole look (Full) or only
     * overlays its stored values (Adjustment). Accepts 'user:Name' or built-in keys.
     */
    isFullThemeKey: async function (themeKey) {
        if (typeof themeKey === 'string' && themeKey.indexOf('user:') === 0) {
            return (await this._fetchUserThemeKind(themeKey.slice(5))) === this.THEME_KIND_FULL;
        }
        return this._builtinThemeKind(themeKey) === this.THEME_KIND_FULL;
    },

    /** Sync variant for already-cached keys (dropdowns, inspector selects). */
    isFullThemeKeyCached: function (themeKey) {
        if (typeof themeKey === 'string' && themeKey.indexOf('user:') === 0) {
            const cache = this._getUserThemeKindCache();
            const kind = cache[themeKey.slice(5)] || this.THEME_KIND_FULL;
            return kind === this.THEME_KIND_FULL;
        }
        return this._builtinThemeKind(themeKey) === this.THEME_KIND_FULL;
    },

    _loadUserTemplates: async function () {
        const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        if (!driver || (DataDriverRegistry.getType() !== 'homey' && DataDriverRegistry.getType() !== 'homeassistant')) {
            this._cachedUserTemplates = this._cachedUserTemplates || [];
            return this._cachedUserTemplates;
        }
        const provider = (typeof driver.getStorageProvider === 'function') ? driver.getStorageProvider() : null;
        if (!provider || typeof provider.list !== 'function') {
            this._cachedUserTemplates = this._cachedUserTemplates || [];
            return this._cachedUserTemplates;
        }
        try {
            const list = await provider.list('templates');
            if (!Array.isArray(list)) {
                this._cachedUserTemplates = this._cachedUserTemplates || [];
                return this._cachedUserTemplates;
            }
            const user = [];
            for (let i = 0; i < list.length; i++) {
                const f = list[i];
                if (!f || !f.name) continue;
                if (f.source === 'factory') continue;
                user.push({ name: String(f.name) });
            }
            user.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
            const self = this;
            const cache = this._getUserThemeKindCache();
            const missing = user.filter(function (t) { return !cache[t.name]; });
            if (missing.length > 0) {
                const kinds = await Promise.all(missing.map(function (t) { return self._fetchUserThemeKind(t.name); }));
                missing.forEach(function (t, i) { t.kind = kinds[i]; });
            }
            user.forEach(function (t) {
                if (!t.kind) t.kind = cache[t.name] || self.THEME_KIND_FULL;
            });
            this._cachedUserTemplates = user;
            return user;
        } catch (e) {
            this._cachedUserTemplates = this._cachedUserTemplates || [];
            return this._cachedUserTemplates;
        }
    },

    deleteUserTemplate: async function (name) {
        const displayName = String(name || '');
        if (!displayName) return;
        if (!await CustomDialog.confirm('Delete "' + displayName + '" permanently?', 'Delete Theme')) return;
        const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        const provider = driver && typeof driver.getStorageProvider === 'function' ? driver.getStorageProvider() : null;
        if (!provider || typeof provider.delete !== 'function') {
            await CustomDialog.alert('Server unavailable', 'Error');
            return;
        }
        try {
            await provider.delete('templates', displayName);
            this._invalidateUserThemeKind(displayName);
            this._cachedUserTemplates = (this._cachedUserTemplates || []).filter(function (t) {
                return t && t.name !== displayName;
            });
            const wrapper = document.getElementById('template-select-wrapper');
            if (wrapper && wrapper.dataset.value === ('user:' + displayName)) {
                this._setTemplateDropdownValue('', 'Select Theme...');
            }
            if (MASTER_SETTINGS.theme === ('user:' + displayName)) {
                MASTER_SETTINGS.theme = 'default_dark';
                this._syncThemeInspectorField('default_dark');
            }
            await this.refreshTemplateDropdown();
            if (typeof Editor !== 'undefined' && Editor.currentId === 'GLOBAL_SETTINGS' && Editor.fieldRegistry && Editor.fieldRegistry['theme']) {
                const reg = Editor.fieldRegistry['theme'];
                if (reg.inputEl && typeof reg.inputEl.setOptions === 'function') {
                    reg.inputEl.setOptions(this.getThemeSelectOptions());
                }
            }
        } catch (err) {
            await CustomDialog.alert('Delete failed: ' + (err && err.message ? err.message : String(err)), 'Error');
        }
    },

    _resetGroupState: function () {
        this.groups = {};
        this.selectedGroupId = null;
        this.openedGroupId = null;
        // Group frames are DOM, not part of `this.groups`. A Responsive Columns
        // dashboard leaves them on the canvas when the group map is cleared first
        // (Reset Canvas, open another file). They sit in front of empty canvas
        // and swallow the drag that starts the selection rectangle.
        this._purgeOrphanGroupCompositeShells();
    },

    _generateGroupId: function () {
        return `group_${Date.now().toString(36)}_${Math.floor(Math.random() * 10000).toString(36)}`;
    },

    _sanitizeSelectionIds: function (ids = []) {
        const unique = [];
        ids.forEach(id => {
            if (this.widgets[id] && !unique.includes(id)) {
                unique.push(id);
            }
        });
        return unique;
    },

    /**
     * Clears cached liveData entries for topics referenced by a group's bindings (visibility, override pages, dim layer).
     * Called when a group is removed so runtime does not keep stale values for orphaned topics.
     */
    _purgeLiveDataTopicsForGroupBindings: function (group) {
        if (!group || typeof group.bindings !== 'object' || !group.bindings) return;
        const b = group.bindings;
        const keys = ['visible', 'overridePage', 'dimBackgroundWhenVisible'];
        for (let i = 0; i < keys.length; i++) {
            const topic = typeof b[keys[i]] === 'string' ? b[keys[i]].trim() : '';
            if (topic !== '' && this.liveData && Object.prototype.hasOwnProperty.call(this.liveData, topic)) {
                delete this.liveData[topic];
            }
        }
    },

    _normalizeGroups: function () {
        const prevGroups = this.groups || {};
        const prevGroupIds = Object.keys(prevGroups);
        const nextGroups = {};
        const claimedWidgets = new Set();

        Object.keys(this.groups || {}).forEach(groupId => {
            const group = this.groups[groupId];
            if (!group || typeof group !== 'object') return;

            const rawWidgets = (group.widgets && typeof group.widgets === 'object') ? group.widgets : {};
            const validWidgetIds = Object.keys(rawWidgets).filter(widgetId => {
                if (!this.widgets[widgetId]) return false;
                if (claimedWidgets.has(widgetId)) return false;
                claimedWidgets.add(widgetId);
                return true;
            });
            if (validWidgetIds.length < 2) return;

            const nestedWidgets = {};
            validWidgetIds.forEach(widgetId => {
                nestedWidgets[widgetId] = true;
            });

            const next = {
                id: groupId,
                name: String(group.name || `Group ${Object.keys(nextGroups).length + 1}`),
                locked: group.locked === true,
                visible: group.visible !== false,
                bindings: this._sanitizeGroupBindingsForStorage(group.bindings),
                overridePage: typeof group.overridePage === 'string' ? group.overridePage.trim() : '',
                dimBackgroundWhenVisible: group.dimBackgroundWhenVisible === true,
                widgets: nestedWidgets
            };
            const extras = this._groupExtrasForStorage(group);
            if (extras.layout) next.layout = extras.layout;
            if (extras.composite) next.composite = extras.composite;
            nextGroups[groupId] = next;
        });

        const nextIds = {};
        Object.keys(nextGroups).forEach((gid) => {
            nextIds[gid] = true;
        });
        for (let pi = 0; pi < prevGroupIds.length; pi++) {
            const gid = prevGroupIds[pi];
            if (nextIds[gid]) continue;
            this._purgeLiveDataTopicsForGroupBindings(prevGroups[gid]);
            if (this._isResponsiveLayoutMode()) {
                this._teardownGroupComposite(gid);
            }
        }

        this.groups = nextGroups;

        if (this.selectedGroupId && !this.groups[this.selectedGroupId]) {
            this.selectedGroupId = null;
        }
        if (this.openedGroupId && !this.groups[this.openedGroupId]) {
            this.openedGroupId = null;
        }
    },

    /* =========================================================
       Group Composite (Responsive Columns only)
       A group acts as a single responsive grid item. Members are
       positioned by their fixed x/y/width/height inside a design
       space (group.composite) and stretched into the group's cell.
       Fixed Resolution / Scale mode never touches this path.
       ========================================================= */

    _isResponsiveLayoutMode: function () {
        return (MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) === 'responsive';
    },

    /**
     * Responsive Columns: a click on the page gutter (outside the Width cap,
     * for example 1920) should open Dashboard Settings.
     * The wrapper fills the viewport underneath the editor. Hit-testing must use
     * the event target, not the pointer coordinates: portaled dropdowns, the color
     * picker, and topic menus are drawn above that wrapper and are not gutter clicks.
     */
    _isResponsiveOutsideCanvasPointer: function (e) {
        if (!e || !this._isResponsiveLayoutMode()) return false;
        const canvas = document.getElementById('dashboard-canvas');
        const wrapper = document.getElementById('dashboard-wrapper');
        if (!canvas || !wrapper) return false;
        const target = e.target;
        if (!target || target.nodeType !== 1 || !target.closest) return false;
        if (!wrapper.contains(target)) return false;
        if (target.closest('#editor-panel, #help-panel, #quick-toolbar-host, .dashboard-dialog-root, #custom-dialog, #reset-canvas-wizard-modal, .awg-dialog, .ds-dropdown-fixed, .ds-select-menu, .bound-topic-menu, .ds-color-picker-panel, #icon-modal')) return false;
        if (target.closest('.widget-wrapper, .resize-handle, .group-composite-wrapper')) return false;
        const rect = canvas.getBoundingClientRect();
        let left = rect.left;
        let right = rect.right;
        const cap = this._canvasDimensionPx(MASTER_SETTINGS.canvasWidth);
        if (cap > 0 && rect.width > cap + 1) {
            const inset = (rect.width - cap) / 2;
            left = rect.left + inset;
            right = left + cap;
        }
        return e.clientX < left || e.clientX > right || e.clientY < rect.top || e.clientY > rect.bottom;
    },

    /** Lasso (drag-to-select) on the main canvas; disabled in Responsive Columns except open group authoring. */
    _isCanvasLassoAllowed: function (lassoRoot) {
        if (lassoRoot) return true;
        return !this._isResponsiveLayoutMode();
    },

    /**
     * True when a pointerdown should start the selection rectangle (or deselect).
     * Widget chrome handles itself. Empty canvas, and any non-widget canvas child
     * such as a leftover group frame, counts as background.
     */
    _isCanvasBackgroundPointerTarget: function (e, canvas) {
        if (!e || !canvas) return false;
        const target = e.target;
        if (!target || target.nodeType !== 1) return false;
        if (target === canvas) return true;
        if (typeof target.closest !== 'function') return false;
        if (!canvas.contains(target)) return false;
        if (target.closest('.widget-wrapper')) return false;
        if (target.closest('.dashboard-dialog-root')) return false;
        if (target.closest('.resize-handle')) return false;
        if (target.closest('button, input, textarea, select, a')) return false;
        return true;
    },

    /** Clean a group `layout.responsive` blob for storage; drop non-canonical keys. */
    _normalizeGroupLayout: function (layout) {
        if (!layout || typeof layout !== 'object') return undefined;
        const src = (layout.responsive && typeof layout.responsive === 'object') ? layout.responsive : layout;
        const num = function (v) {
            return (v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v))) ? Number(v) : undefined;
        };
        const out = {};
        const keys = ['order', 'columnSpan', 'preferredColumn', 'rowSpan', 'padding', 'minHeight'];
        for (let i = 0; i < keys.length; i++) {
            const v = num(src[keys[i]]);
            if (v !== undefined) out[keys[i]] = v;
        }
        const cellH = num(src.cellHeight !== undefined && src.cellHeight !== null && src.cellHeight !== ''
            ? src.cellHeight : src.height);
        if (cellH !== undefined) out.cellHeight = cellH;
        if (typeof src.scaleMode === 'string' && src.scaleMode === 'rescale') {
            out.scaleMode = 'rescale';
        }
        const modeRaw = (typeof src.cellHeightMode === 'string' && src.cellHeightMode)
            ? src.cellHeightMode
            : src.heightMode;
        if (modeRaw === 'auto' || modeRaw === 'fixed' || modeRaw === 'fill') {
            out.cellHeightMode = modeRaw;
        }
        if (Object.keys(out).length === 0) return undefined;
        return { responsive: out };
    },

    /** Read a group's Responsive Columns scale mode (`resize` default, `rescale` optional). */
    getGroupScaleMode: function (groupId) {
        const resp = this.getGroupResponsiveLayout(groupId) || {};
        return (typeof BaseWidget !== 'undefined' && BaseWidget.normalizeResponsiveScaleMode)
            ? BaseWidget.normalizeResponsiveScaleMode(resp.scaleMode)
            : (resp.scaleMode === 'rescale' ? 'rescale' : 'resize');
    },

    /**
     * Compute uniform scale for a responsive rescale widget from its grid cell and
     * fixed design dimensions. Returns 1 when not in rescale mode or size is unknown.
     */
    _responsiveWidgetScaleFactor: function (widget, cellW, cellH) {
        if (!widget || !BaseWidget.widgetUsesResponsiveRescale(widget)) return 1;
        const c = widget.config || {};
        const pad = BaseWidget.clampNumber(c.padding, 0, null);
        const designW = BaseWidget.clampNumber(c.width, 1, null);
        const designH = BaseWidget.clampNumber(c.height, 1, null);
        const designInnerW = Math.max(1, designW - (pad * 2));
        const designInnerH = Math.max(1, designH - (pad * 2));
        if (!cellW || cellW <= 0 || !designW || designW <= 0) return 1;
        const availW = Math.max(1, cellW - (pad * 2));
        let scale = availW / designInnerW;
        if (cellH > 0 && designInnerH > 0) {
            const availH = Math.max(1, cellH - (pad * 2));
            scale = Math.min(scale, availH / designInnerH);
        }
        return scale > 0 ? scale : 1;
    },

    /** Scale widget inner content only; container chrome keeps pixel borders, radius, and glow. */
    _syncResponsiveWidgetScale: function (widget) {
        if (!widget || !widget.elements || !widget.elements.wrapper || !widget.elements.container) return;
        const wrapper = widget.elements.wrapper;
        const container = widget.elements.container;
        const viewport = widget.elements.scaleViewport;
        const inner = widget.elements.innerContent;
        if (!inner) return;
        const resetViewport = function () {
            if (!viewport) return;
            viewport.style.display = '';
            viewport.style.alignItems = '';
            viewport.style.justifyContent = '';
            viewport.style.overflow = '';
            viewport.style.borderRadius = '';
        };
        if (!BaseWidget.widgetUsesResponsiveRescale(widget)) {
            if (widget._responsiveScaleFactor !== 1) {
                container.style.transform = '';
                inner.style.transform = '';
                inner.style.transformOrigin = '';
                inner.style.width = '100%';
                inner.style.height = '100%';
                resetViewport();
                widget._responsiveScaleFactor = 1;
            }
            return;
        }
        const c = widget.config || {};
        const pad = BaseWidget.clampNumber(c.padding, 0, null);
        const designW = BaseWidget.clampNumber(c.width, 1, null);
        const designH = BaseWidget.clampNumber(c.height, 1, null);
        const designInnerW = Math.max(1, designW - (pad * 2));
        const designInnerH = Math.max(1, designH - (pad * 2));
        const wrapperW = wrapper.offsetWidth || 0;
        const wrapperH = wrapper.offsetHeight || 0;
        const scale = this._responsiveWidgetScaleFactor(widget, wrapperW, wrapperH);
        inner.style.width = designInnerW + 'px';
        inner.style.height = designInnerH + 'px';
        inner.style.transformOrigin = 'center center';
        inner.style.transform = scale === 1 ? '' : ('scale(' + scale + ')');
        if (viewport) {
            viewport.style.display = 'flex';
            viewport.style.alignItems = 'center';
            viewport.style.justifyContent = 'center';
            viewport.style.overflow = 'hidden';
            const borderW = BaseWidget.clampNumber(c.borderWidth, 0, null);
            const innerRadius = Math.max(0, BaseWidget.clampNumber(c.cornerRadius, 0, null) - borderW);
            viewport.style.borderRadius = innerRadius + 'px';
        }
        widget._responsiveScaleFactor = scale;
    },

    /** Clean a group `composite` design-space blob for storage. */
    _normalizeGroupComposite: function (composite) {
        if (!composite || typeof composite !== 'object') return undefined;
        const num = function (v, d) {
            return (v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v))) ? Number(v) : d;
        };
        const designWidth = Math.max(0, num(composite.designWidth, 0));
        const designHeight = Math.max(0, num(composite.designHeight, 0));
        const originX = num(composite.originX, 0);
        const originY = num(composite.originY, 0);
        if (designWidth <= 0 && designHeight <= 0 && originX === 0 && originY === 0) return undefined;
        return { designWidth: designWidth, designHeight: designHeight, originX: originX, originY: originY };
    },

    /** Extract cleaned layout + composite extras from a raw group object. */
    _groupExtrasForStorage: function (group) {
        if (!group || typeof group !== 'object') return {};
        const out = {};
        const layout = this._normalizeGroupLayout(group.layout);
        if (layout) out.layout = layout;
        const composite = this._normalizeGroupComposite(group.composite);
        if (composite) out.composite = composite;
        return out;
    },

    /** Read a group's nested Responsive Layout blob, mirroring BaseWidget.getResponsiveLayout. */
    getGroupResponsiveLayout: function (groupId) {
        if (!this._isResponsiveLayoutMode()) return null;
        const group = this.groups && this.groups[groupId];
        if (!group || !group.layout || typeof group.layout !== 'object') return null;
        const resp = group.layout.responsive;
        return (resp && typeof resp === 'object') ? resp : null;
    },

    /** Resolve a group's composite design space, seeding it from members when missing. */
    getGroupComposite: function (groupId, autoSeed) {
        const group = this.groups && this.groups[groupId];
        if (!group) return null;
        if (!group.composite && autoSeed) this._seedGroupComposite(groupId);
        const comp = group.composite;
        if (!comp) return null;
        return {
            designWidth: Math.max(1, Number(comp.designWidth) || 1),
            designHeight: Math.max(1, Number(comp.designHeight) || 1),
            originX: Number(comp.originX) || 0,
            originY: Number(comp.originY) || 0
        };
    },

    /**
     * Fresh composite outline for layout (closed groups only): always derived from
     * current member fixed coordinates, persisted back to group.composite.
     */
    _resolveGroupCompositeLayout: function (groupId) {
        if (this._isGroupCompositeOpen(groupId)) return null;
        const group = this.groups && this.groups[groupId];
        if (!group) return null;
        const bounds = this._computeGroupCompositeBounds(groupId);
        group.composite = bounds;
        return bounds;
    },

    _refreshAllGroupCompositeBounds: function () {
        if (!this._isResponsiveLayoutMode()) return;
        const self = this;
        Object.keys(this.groups || {}).forEach(function (gid) {
            if (self._isGroupCompositeOpen(gid)) return;
            self._resolveGroupCompositeLayout(gid);
        });
    },

    /**
     * Composite membership context for a widget, or null when the widget is not a
     * composite member in Responsive Columns. `open` is true while the group is in
     * focus/authoring mode.
     */
    getWidgetCompositeContext: function (widgetId) {
        if (!this._isResponsiveLayoutMode()) return null;
        const group = this.getGroupByWidgetId(widgetId);
        if (!group) return null;
        return { groupId: group.id, open: this.openedGroupId === group.id };
    },

    /** True when a widget is being edited inside an open group (fixed-pixel authoring). */
    isWidgetCompositeAuthoring: function (widgetId) {
        const ctx = this.getWidgetCompositeContext(widgetId);
        return !!(ctx && ctx.open);
    },

    /** Write a single prop into group.layout.responsive and re-render the composite. */
    updateGroupLayout: function (groupId, prop, value) {
        const group = this.groups && this.groups[groupId];
        if (!group) return;
        const beforeGroups = this._cloneJson(this.groups || {});
        if (!group.layout || typeof group.layout !== 'object') group.layout = {};
        if (!group.layout.responsive || typeof group.layout.responsive !== 'object') group.layout.responsive = {};
        if (value === undefined || value === null || value === '') {
            delete group.layout.responsive[prop];
        } else {
            group.layout.responsive[prop] = value;
        }
        if (prop === 'cellHeightMode') delete group.layout.responsive.heightMode;
        if (prop === 'cellHeight') delete group.layout.responsive.height;
        if (Object.keys(group.layout.responsive).length === 0) delete group.layout.responsive;
        if (group.layout && Object.keys(group.layout).length === 0) delete group.layout;
        this.markUnsaved();
        if (this._isResponsiveLayoutMode()) {
            this._renderGroupComposite(groupId);
            this._requestResponsiveReflow();
        }
        this._recordHistoryEntry({
            kind: 'groups',
            beforeGroups: beforeGroups,
            afterGroups: this._cloneJson(this.groups || {}),
            beforeSelection: this._captureSelectionState(),
            afterSelection: this._captureSelectionState()
        });
    },

    /**
     * True when a widget's container/background contributes to the composite outline.
     * Widgets with the container background disabled (Container Style -> Background off)
     * are overlays and are excluded from the outline calculation.
     */
    _widgetContributesToCompositeBounds: function (w) {
        if (!w || !w.overrides) return true;
        const o = w.overrides.bgVisible;
        if (o !== undefined && o !== null && o !== '') return o !== false;
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        if (M.bgVisible !== undefined && M.bgVisible !== null) return M.bgVisible !== false;
        return true;
    },

    /**
     * Compute the composite outline (design space) from the bounding box of members
     * whose container background is enabled. Background-disabled members are overlays
     * and do not expand the outline. Falls back to all members when every member has
     * its background disabled. Never mutates member coordinates.
     */
    _computeGroupCompositeBounds: function (groupId) {
        const memberIds = this.getGroupMemberIds(groupId);
        let visible = [];
        for (let i = 0; i < memberIds.length; i++) {
            const w = this.widgets[memberIds[i]];
            if (!w || !w.overrides) continue;
            if (this._widgetContributesToCompositeBounds(w)) visible.push(w);
        }
        const pool = visible.length > 0 ? visible : memberIds.map(id => this.widgets[id]).filter(Boolean);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < pool.length; i++) {
            const w = pool[i];
            const x = BaseWidget.toFiniteNumber(w.overrides.x, 0);
            const y = BaseWidget.toFiniteNumber(w.overrides.y, 0);
            const width = BaseWidget.resolveInstanceWidth(w.overrides);
            const height = BaseWidget.resolveInstanceHeight(w.overrides);
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x + width > maxX) maxX = x + width;
            if (y + height > maxY) maxY = y + height;
        }
        if (!Number.isFinite(minX)) { minX = 0; minY = 0; maxX = 1; maxY = 1; }
        return {
            designWidth: Math.max(1, maxX - minX),
            designHeight: Math.max(1, maxY - minY),
            originX: minX,
            originY: minY
        };
    },

    /**
     * Seed group.composite from the bounding box of background-enabled members. Never
     * mutates member coordinates; the outline's top-left becomes the design origin.
     */
    _seedGroupComposite: function (groupId) {
        const group = this.groups && this.groups[groupId];
        if (!group) return null;
        const memberIds = this.getGroupMemberIds(groupId);
        if (memberIds.length === 0) return group.composite || null;
        group.composite = this._computeGroupCompositeBounds(groupId);
        return group.composite;
    },

    /**
     * Write Auto Width / Auto Height fitted boxes into member Width / Height
     * while the group is still open, so close-layout uses the content size.
     */
    _commitAutoSizedGroupMembers: function (groupId) {
        const memberIds = this.getGroupMemberIds(groupId);
        for (let i = 0; i < memberIds.length; i++) {
            const w = this.widgets[memberIds[i]];
            if (w && typeof w.flushFittedAutoSize === 'function') w.flushFittedAutoSize();
        }
    },

    /**
     * Recompute the composite outline after authoring edits. Called on group close:
     * the outline is the bounding box of background-enabled member containers.
     */
    _recomputeGroupCompositeBounds: function (groupId) {
        const group = this.groups && this.groups[groupId];
        if (!group) return;
        const memberIds = this.getGroupMemberIds(groupId);
        if (memberIds.length === 0) return;
        group.composite = this._computeGroupCompositeBounds(groupId);
    },

    /** Resolve a composite group's grid order (explicit, else min member order). */
    resolveResponsiveGroupOrder: function (groupId) {
        const resp = this.getGroupResponsiveLayout(groupId) || {};
        if (resp.order !== undefined && resp.order !== null && Number.isFinite(Number(resp.order))) {
            return parseInt(resp.order, 10);
        }
        const memberIds = this.getGroupMemberIds(groupId);
        let minOrder = Infinity;
        for (let i = 0; i < memberIds.length; i++) {
            const w = this.widgets[memberIds[i]];
            const r = BaseWidget.getResponsiveLayout(w && w.overrides) || {};
            if (r.order !== undefined && r.order !== null && Number.isFinite(Number(r.order))) {
                const o = parseInt(r.order, 10);
                if (o < minOrder) minOrder = o;
            }
        }
        return Number.isFinite(minOrder) ? minOrder : 0;
    },

    /** True when the group is currently in focus/authoring mode. */
    _isGroupCompositeOpen: function (groupId) {
        return !!groupId && this.openedGroupId === groupId;
    },

    /** Strip composite-member absolute layout so the widget can rejoin the responsive grid. */
    _clearCompositeMemberWrapperStyles: function (widget) {
        if (!widget || !widget.elements || !widget.elements.wrapper) return;
        const s = widget.elements.wrapper.style;
        const cs = widget.elements.container.style;
        s.position = '';
        s.left = '';
        s.top = '';
        s.width = '';
        s.height = '';
        s.minHeight = '0';
        s.maxHeight = 'none';
        cs.width = '';
        cs.height = '';
        widget._effectiveLayoutWidth = undefined;
        widget._effectiveLayoutHeight = undefined;
        widget._responsiveRowSpan = undefined;
        widget._responsiveRowStart = undefined;
        widget._responsiveColStart = undefined;
        widget._responsiveColumnSpan = undefined;
        if (widget.elements.wrapper.classList) {
            widget.elements.wrapper.classList.remove('responsive-scale-mode');
        }
        if (typeof this._syncResponsiveWidgetScale === 'function') {
            this._syncResponsiveWidgetScale(widget);
        }
    },

    /** Move widgets out of a composite stage back onto the canvas root. */
    _releaseWidgetsFromCompositeStage: function (widgetIds) {
        if (!this._isResponsiveLayoutMode() || !Array.isArray(widgetIds) || widgetIds.length === 0) return;
        const canvas = document.getElementById('dashboard-canvas');
        if (!canvas) return;
        for (let i = 0; i < widgetIds.length; i++) {
            const w = this.widgets[widgetIds[i]];
            if (!w || !w.elements || !w.elements.wrapper) continue;
            const parent = w.elements.wrapper.parentNode;
            if (!parent || !parent.classList) continue;
            const inComposite = parent.classList.contains('group-composite-stage')
                || parent.classList.contains('group-composite-design-layer');
            if (!inComposite) continue;
            canvas.appendChild(w.elements.wrapper);
            w.root = canvas;
            this._clearCompositeMemberWrapperStyles(w);
        }
    },

    /** Remove a group's composite wrapper and return members to the canvas root. */
    _teardownGroupComposite: function (groupId) {
        const wrapper = document.getElementById('group-composite-' + groupId);
        if (!wrapper) return [];
        const stage = wrapper.querySelector('.group-composite-stage');
        const canvas = document.getElementById('dashboard-canvas');
        const moved = [];
        if (stage) {
            const wrappers = stage.querySelectorAll('.widget-wrapper');
            for (let ci = 0; ci < wrappers.length; ci++) {
                const child = wrappers[ci];
                if (canvas) {
                    canvas.appendChild(child);
                    const id = child.dataset.id;
                    const w = (typeof Dashboard !== 'undefined') ? Dashboard.widgets[id] : null;
                    if (w) {
                        w.root = canvas;
                        if (typeof Dashboard._clearCompositeMemberWrapperStyles === 'function') {
                            Dashboard._clearCompositeMemberWrapperStyles(w);
                        }
                        moved.push(w);
                    }
                }
            }
            const designLayer = stage.querySelector('.group-composite-design-layer');
            if (designLayer && designLayer.parentNode) designLayer.parentNode.removeChild(designLayer);
        }
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        delete wrapper._compositeLayout;
        return moved;
    },

    _teardownAllGroupComposites: function () {
        const self = this;
        Object.keys(this.groups || {}).forEach(function (gid) { self._teardownGroupComposite(gid); });
        this._purgeOrphanGroupCompositeShells();
    },

    /**
     * Remove group-composite frames that are no longer backed by `this.groups`.
     * Live member widgets are returned to the canvas first so a frame cannot
     * take them with it.
     */
    _purgeOrphanGroupCompositeShells: function () {
        const canvas = document.getElementById('dashboard-canvas');
        if (!canvas) return;
        const nodes = canvas.querySelectorAll('.group-composite-wrapper');
        for (let i = nodes.length - 1; i >= 0; i--) {
            const wrapper = nodes[i];
            const gid = wrapper.dataset ? wrapper.dataset.groupId : '';
            if (gid && this.groups && this.groups[gid]) continue;
            const members = wrapper.querySelectorAll('.widget-wrapper');
            for (let mi = 0; mi < members.length; mi++) {
                const child = members[mi];
                canvas.appendChild(child);
                const id = child.dataset ? child.dataset.id : '';
                const w = (id && this.widgets) ? this.widgets[id] : null;
                if (w) {
                    w.root = canvas;
                    this._clearCompositeMemberWrapperStyles(w);
                }
            }
            if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        }
        if (!this.openedGroupId || !this._isResponsiveLayoutMode()) {
            canvas.classList.remove('composite-group-open');
            if (canvas.dataset) delete canvas.dataset.openCompositeGroup;
        }
    },

    /** Apply the group's responsive grid placement (order/columnSpan/preferredColumn) to its wrapper. */
    _applyGroupCompositeGeometry: function (wrapper, groupId) {
        const resp = this.getGroupResponsiveLayout(groupId) || {};
        const s = wrapper.style;
        const order = this.resolveResponsiveGroupOrder(groupId);
        s.order = String(order);

        const rawSpan = (resp.columnSpan !== undefined && resp.columnSpan !== null) ? parseInt(resp.columnSpan, 10) : 1;
        let span = Number.isFinite(rawSpan) && rawSpan > 0 ? rawSpan : 1;
        if (typeof this.clampResponsiveColumnSpan === 'function') {
            span = this.clampResponsiveColumnSpan(span);
        }
        const prefCol = (typeof this.responsivePreferredColumn === 'function')
            ? this.responsivePreferredColumn(resp.preferredColumn, span)
            : 0;
        let colStart = prefCol;
        if (!(Number.isFinite(colStart) && colStart > 0)
                && Number.isFinite(wrapper._responsiveColStart) && wrapper._responsiveColStart > 0) {
            colStart = wrapper._responsiveColStart;
        }
        this._writeResponsiveGridLines(
            wrapper,
            colStart,
            span,
            wrapper._responsiveRowStart,
            wrapper._responsiveRowSpan
        );
    },

    /**
     * Authoring canvas size for an open composite group: a large fixed-pixel area that
     * fits all members with margin, falling back to the configured Fixed canvas size,
     * then to generous defaults. This mirrors the Fixed Resolution editing experience.
     */
    _getCompositeAuthoringSize: function (groupId) {
        const configuredW = this._canvasDimensionPx(MASTER_SETTINGS.canvasWidth);
        const configuredH = this._canvasDimensionPx(MASTER_SETTINGS.canvasHeight);
        let w = configuredW > 0 ? configuredW : 0;
        let h = configuredH > 0 ? configuredH : 0;
        const memberIds = this.getGroupMemberIds(groupId);
        for (let i = 0; i < memberIds.length; i++) {
            const wd = this.widgets[memberIds[i]];
            if (!wd || !wd.overrides) continue;
            const x = BaseWidget.toFiniteNumber(wd.overrides.x, 0);
            const y = BaseWidget.toFiniteNumber(wd.overrides.y, 0);
            const width = BaseWidget.resolveInstanceWidth(wd.overrides);
            const height = BaseWidget.resolveInstanceHeight(wd.overrides);
            if (x + width + 80 > w) w = x + width + 80;
            if (y + height + 80 > h) h = y + height + 80;
        }
        return { width: Math.max(1200, w), height: Math.max(800, h) };
    },

    /**
     * Ensure a group's composite wrapper + stage exist, reparent members into the
     * stage, and apply grid placement. Positioning happens in the reflow pass once
     * the grid has assigned the wrapper a column width. No-op outside responsive mode.
     */
    _renderGroupComposite: function (groupId) {
        if (!this._isResponsiveLayoutMode()) return;
        const group = this.groups && this.groups[groupId];
        if (!group) return;
        const memberIds = this.getGroupMemberIds(groupId);
        if (memberIds.length < 2) {
            const released = this._teardownGroupComposite(groupId);
            for (let i = 0; i < released.length; i++) {
                if (released[i] && typeof released[i].render === 'function') released[i].render();
            }
            return;
        }

        const isOpen = this._isGroupCompositeOpen(groupId);
        const comp = isOpen
            ? (this.getGroupComposite(groupId, true) || { designWidth: 1, designHeight: 1, originX: 0, originY: 0 })
            : (this._resolveGroupCompositeLayout(groupId) || { designWidth: 1, designHeight: 1, originX: 0, originY: 0 });
        const canvas = document.getElementById('dashboard-canvas');
        if (!canvas) return;

        let wrapper = document.getElementById('group-composite-' + groupId);
        let stage;
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'group-composite-' + groupId;
            wrapper.className = 'group-composite-wrapper';
            wrapper.dataset.groupId = groupId;
            stage = document.createElement('div');
            stage.className = 'group-composite-stage';
            wrapper.appendChild(stage);
            canvas.appendChild(wrapper);
        } else {
            stage = wrapper.querySelector('.group-composite-stage');
        }

        wrapper.classList.toggle('composite-authoring', isOpen);
        wrapper.classList.toggle('composite-rescale-mode', !isOpen && this.getGroupScaleMode(groupId) === 'rescale');
        wrapper.dataset.designWidth = comp.designWidth;
        wrapper.dataset.designHeight = comp.designHeight;

        if (isOpen) {
            // Free-form authoring canvas (like Fixed Resolution): a large fixed-pixel
            // area sized to fit all members. Other canvas items are hidden via
            // .composite-group-open on #dashboard-canvas while focus mode is active.
            const authoring = this._getCompositeAuthoringSize(groupId);
            if (wrapper.parentNode === canvas && canvas.firstChild !== wrapper) {
                canvas.insertBefore(wrapper, canvas.firstChild);
            }
            wrapper.style.position = 'relative';
            wrapper.style.width = authoring.width + 'px';
            wrapper.style.maxWidth = '100%';
            wrapper.style.height = authoring.height + 'px';
            wrapper.style.minHeight = authoring.height + 'px';
            wrapper.style.margin = '0 auto';
            wrapper.style.gridColumn = '1 / -1';
            wrapper.style.order = '-999';
            const authorRows = this.responsiveRowSpanFor(authoring.height, 0, 0, 0);
            wrapper.style.gridRow = 'span ' + authorRows;
            const stageEl = wrapper.querySelector('.group-composite-stage');
            if (stageEl) {
                stageEl.style.position = 'relative';
                stageEl.style.inset = '';
                stageEl.style.width = '100%';
                stageEl.style.height = '100%';
            }
        } else {
            wrapper.style.position = 'relative';
            wrapper.style.width = '';
            wrapper.style.maxWidth = '';
            wrapper.style.height = '';
            wrapper.style.minHeight = '';
            wrapper.style.margin = '';
            wrapper.style.order = '';
            const stageEl = wrapper.querySelector('.group-composite-stage');
            if (stageEl) {
                stageEl.style.position = '';
                stageEl.style.inset = '';
                stageEl.style.width = '';
                stageEl.style.height = '';
            }
            this._applyGroupCompositeGeometry(wrapper, groupId);
        }

        // Reparent members into the stage (idempotent).
        for (let i = 0; i < memberIds.length; i++) {
            const w = this.widgets[memberIds[i]];
            if (!w || !w.elements || !w.elements.wrapper) continue;
            if (w.elements.wrapper.parentNode !== stage) {
                stage.appendChild(w.elements.wrapper);
                w.root = stage;
            }
        }

        // Behavioral visibility on the wrapper as a whole.
        this._applyGroupCompositeVisibility(groupId, wrapper);

        if (!isOpen) {
            if (!this._reflowGroupComposite(groupId, wrapper, comp)) {
                this._scheduleGroupCompositeLayoutPass(0);
            }
        } else {
            this._renderGroupCompositeMembers(groupId, comp);
        }
        this._syncResponsiveCompositeAuthoringShell();
    },

    /**
     * While a group is open in Responsive Columns edit mode, hide every other canvas
     * item so focus mode matches Fixed Resolution (only the group's members show).
     */
    _syncResponsiveCompositeAuthoringShell: function () {
        const canvas = document.getElementById('dashboard-canvas');
        if (!canvas) return;
        const open = !!(this.isEditMode && this._isResponsiveLayoutMode() && this.openedGroupId);
        canvas.classList.toggle('composite-group-open', open);
        if (open) {
            canvas.dataset.openCompositeGroup = this.openedGroupId;
        } else {
            delete canvas.dataset.openCompositeGroup;
        }
    },

    /** Helper to set position avoiding repeated string writes. */
    _applyGroupCompositeVisibility: function (groupId, wrapper) {
        const group = this.groups && this.groups[groupId];
        if (!group) return;
        // Page visibility: the composite shows only when the group's effective page
        // covers the current page (group overridePage, else first member page).
        const activePage = Math.max(1, parseInt(String(MASTER_SETTINGS.currentPage != null ? MASTER_SETTINGS.currentPage : 1), 10) || 1);
        const memberIds = this.getGroupMemberIds(groupId);
        let onPage = true;
        if (memberIds.length > 0) {
            const firstW = this.widgets[memberIds[0]];
            const rawPage = (firstW && firstW.overrides && firstW.overrides.page != null) ? firstW.overrides.page : '1';
            const pageStr = typeof this.resolveEffectivePageForWidgetId === 'function'
                ? this.resolveEffectivePageForWidgetId(memberIds[0], rawPage)
                : rawPage;
            onPage = (typeof WidgetPageSpec !== 'undefined')
                ? WidgetPageSpec.coversPage(pageStr, activePage)
                : String(pageStr).split(',').map(function (p) { return p.trim(); }).includes(String(activePage));
        }
        if (!onPage) {
            wrapper.style.display = 'none';
            return;
        }
        const hiddenRuntime = (!this.isEditMode) && !this.isGroupRuntimeVisible(groupId);
        if (hiddenRuntime) {
            wrapper.style.display = 'none';
            return;
        }
        wrapper.style.display = '';
        if (this.isEditMode && group.visible === false) {
            wrapper.style.opacity = '0.5';
        } else {
            wrapper.style.opacity = '';
        }
    },

    /**
     * Measure the wrapper's grid column width, compute the composite cell height
     * (explicit group Height, else aspect-preserved from the design space), set the
     * masonry row span, then position members by their design fractions.
     * Returns false when the wrapper has no column width yet (caller may retry).
     */
    _reflowGroupComposite: function (groupId, wrapper, comp, options) {
        if (!wrapper) return false;
        if (!comp) comp = this._resolveGroupCompositeLayout(groupId);
        if (!comp) return false;
        const opts = options && typeof options === 'object' ? options : {};
        const resp = this.getGroupResponsiveLayout(groupId) || {};
        const cellW = wrapper.offsetWidth || 0;
        if (cellW <= 0) return false;
        const explicitHeight = this.explicitResponsiveHeightPx(resp);
        let cellH;
        let n;
        if (opts.lockSpan) {
            n = Number(wrapper._responsiveRowSpan);
            if (!Number.isFinite(n) || n < 1) n = 1;
            wrapper._responsiveRowSpan = n;
            if (Number.isFinite(opts.cellH) && opts.cellH > 0) {
                cellH = opts.cellH;
            } else {
                cellH = this.responsiveCellHeightForRowSpan(n);
            }
        } else if (this.resolveResponsiveHeightMode(resp) === 'fill') {
            n = this.responsiveFillPackRowSpan(resp);
            wrapper._responsiveRowSpan = n;
            cellH = this.responsiveCellHeightForRowSpan(n);
        } else {
            if (Number.isFinite(explicitHeight) && explicitHeight > 0) {
                cellH = explicitHeight;
            } else {
                cellH = cellW * (comp.designHeight / comp.designWidth);
            }
            const userRowSpan = parseInt(resp.rowSpan, 10);
            const floor = Number.isFinite(userRowSpan) && userRowSpan > 0 ? userRowSpan : 0;
            n = this.responsiveCompositeRowSpanFor(cellH, floor, explicitHeight);
            wrapper._responsiveRowSpan = n;
        }
        const rawSpan = (resp.columnSpan !== undefined && resp.columnSpan !== null) ? parseInt(resp.columnSpan, 10) : 1;
        let span = Number.isFinite(rawSpan) && rawSpan > 0 ? rawSpan : 1;
        if (typeof this.clampResponsiveColumnSpan === 'function') {
            span = this.clampResponsiveColumnSpan(span);
        }
        let colStart = wrapper._responsiveColStart;
        if (!(Number.isFinite(colStart) && colStart > 0)
                && typeof this.responsivePreferredColumn === 'function') {
            colStart = this.responsivePreferredColumn(resp.preferredColumn, span);
        }
        this._writeResponsiveGridLines(wrapper, colStart, span, wrapper._responsiveRowStart, n);
        const pad = (resp.padding !== undefined && resp.padding !== null && Number.isFinite(Number(resp.padding)))
            ? Math.max(0, Number(resp.padding))
            : 0;
        const stage = wrapper.querySelector('.group-composite-stage');
        const scaleMode = this.getGroupScaleMode(groupId);
        const rescale = scaleMode === 'rescale';
        if (stage) {
            stage.style.boxSizing = 'border-box';
            stage.style.padding = pad > 0 ? (pad + 'px') : '';
        }
        const padTotal = pad * 2;
        const innerW = Math.max(1, cellW - padTotal);
        const innerH = Math.max(1, cellH - padTotal);
        wrapper._compositeLayout = {
            originX: comp.originX,
            originY: comp.originY,
            designWidth: comp.designWidth,
            designHeight: comp.designHeight,
            cellW: innerW,
            cellH: innerH,
            scaleMode: scaleMode
        };
        if (rescale) {
            const layer = this._ensureCompositeDesignLayer(stage, comp);
            this._reparentCompositeMembersForScaleMode(stage, layer, groupId, true);
            this._positionGroupCompositeMembersDesign(groupId, layer, comp);
            wrapper._compositeLayout.groupScale = this._syncGroupCompositeDesignLayerScale(layer, comp, innerW, innerH);
            const memberIds = this.getGroupMemberIds(groupId);
            for (let i = 0; i < memberIds.length; i++) {
                const mw = this.widgets[memberIds[i]];
                if (mw) this._syncResponsiveWidgetScale(mw);
            }
        } else {
            this._reparentCompositeMembersForScaleMode(stage, null, groupId, false);
            if (stage) {
                stage.style.display = '';
                stage.style.alignItems = '';
                stage.style.justifyContent = '';
                stage.style.overflow = '';
                stage.style.transform = '';
                stage.style.transformOrigin = '';
            }
            this._positionGroupCompositeMembers(groupId, wrapper, comp, innerW, innerH);
            this._remeasureGroupCompositeMembers(groupId, innerW, innerH);
        }
        return true;
    },

    /** Re-draw cell-sized widget content (graph, clock, slider) after composite scaling. */
    _remeasureGroupCompositeMembers: function (groupId, cellW, cellH) {
        const memberIds = this.getGroupMemberIds(groupId);
        for (let i = 0; i < memberIds.length; i++) {
            const w = this.widgets[memberIds[i]];
            if (!w || !w.elements || !w.elements.wrapper) continue;
            const mw = w.elements.wrapper.offsetWidth || 0;
            const mh = w.elements.wrapper.offsetHeight || 0;
            if (mw > 0) w._effectiveLayoutWidth = mw;
            if (mh > 0) w._effectiveLayoutHeight = mh;
            if (typeof w._renderSpecific === 'function') {
                try {
                    w._renderSpecific();
                } catch (err) {
                    console.error('Composite remeasure crashed for ' + memberIds[i] + ':', err);
                }
            }
        }
    },

    /** Re-apply scaled member positions from the last composite layout pass (after render). */
    _syncCompositeMemberLayout: function (widgetId) {
        const ctx = this.getWidgetCompositeContext(widgetId);
        if (!ctx || ctx.open) return;
        const wrapper = document.getElementById('group-composite-' + ctx.groupId);
        if (!wrapper) return;
        const w = this.widgets[widgetId];
        if (!w || !w.elements || !w.elements.wrapper) return;
        let layout = wrapper._compositeLayout;
        if (!layout) {
            const cellW = wrapper.offsetWidth || 0;
            if (cellW <= 0) {
                this._scheduleGroupCompositeLayoutPass(0);
                return;
            }
            const comp = this._resolveGroupCompositeLayout(ctx.groupId);
            if (!comp) return;
            const resp = this.getGroupResponsiveLayout(ctx.groupId) || {};
            const explicitHeight = this.explicitResponsiveHeightPx(resp);
            let cellH;
            if (Number.isFinite(explicitHeight) && explicitHeight > 0) {
                cellH = explicitHeight;
            } else {
                cellH = cellW * (comp.designHeight / comp.designWidth);
            }
            const pad = (resp.padding !== undefined && resp.padding !== null && Number.isFinite(Number(resp.padding)))
                ? Math.max(0, Number(resp.padding))
                : 0;
            const padTotal = pad * 2;
            layout = {
                originX: comp.originX,
                originY: comp.originY,
                designWidth: comp.designWidth,
                designHeight: comp.designHeight,
                cellW: Math.max(1, cellW - padTotal),
                cellH: Math.max(1, cellH - padTotal),
                scaleMode: this.getGroupScaleMode(ctx.groupId)
            };
        }
        const comp = {
            originX: layout.originX,
            originY: layout.originY,
            designWidth: layout.designWidth,
            designHeight: layout.designHeight
        };
        const groupRescale = layout.scaleMode === 'rescale';
        if (groupRescale) {
            const stage = wrapper.querySelector('.group-composite-stage');
            let layer = stage ? stage.querySelector('.group-composite-design-layer') : null;
            if (stage && !layer) {
                layer = this._ensureCompositeDesignLayer(stage, comp);
                this._reparentCompositeMembersForScaleMode(stage, layer, ctx.groupId, true);
            }
            this._applyCompositeMemberDesignRect(w, comp);
            if (layer) {
                layout.groupScale = this._syncGroupCompositeDesignLayerScale(layer, comp, layout.cellW, layout.cellH);
                wrapper._compositeLayout = layout;
            }
            this._syncResponsiveWidgetScale(w);
        } else {
            this._applyCompositeMemberScreenRect(w, comp, layout.cellW, layout.cellH);
            if (BaseWidget.widgetUsesResponsiveRescale(w)) {
                this._syncResponsiveWidgetScale(w);
            }
        }
    },

    /** Design-space viewport inside the composite stage for group Rescale mode. */
    _ensureCompositeDesignLayer: function (stage, comp) {
        if (!stage || !comp) return null;
        let layer = stage.querySelector('.group-composite-design-layer');
        if (!layer) {
            layer = document.createElement('div');
            layer.className = 'group-composite-design-layer';
            stage.appendChild(layer);
        }
        const designW = Math.max(1, Number(comp.designWidth) || 1);
        const designH = Math.max(1, Number(comp.designHeight) || 1);
        layer.style.position = 'relative';
        layer.style.width = designW + 'px';
        layer.style.height = designH + 'px';
        layer.style.flexShrink = '0';
        layer.style.transformOrigin = 'center center';
        stage.style.display = 'flex';
        stage.style.alignItems = 'center';
        stage.style.justifyContent = 'center';
        stage.style.overflow = 'hidden';
        stage.style.transform = '';
        stage.style.transformOrigin = '';
        return layer;
    },

    /** Move member wrappers between stage and the design layer when toggling group Rescale. */
    _reparentCompositeMembersForScaleMode: function (stage, layer, groupId, rescale) {
        if (!stage) return;
        const memberIds = this.getGroupMemberIds(groupId);
        const target = rescale ? layer : stage;
        if (!target) return;
        for (let i = 0; i < memberIds.length; i++) {
            const w = this.widgets[memberIds[i]];
            if (!w || !w.elements || !w.elements.wrapper) continue;
            if (w.elements.wrapper.parentNode !== target) {
                target.appendChild(w.elements.wrapper);
            }
        }
        if (!rescale) {
            const existing = stage.querySelector('.group-composite-design-layer');
            if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        }
    },

    /**
     * Uniform scale for a closed composite group in Rescale mode. The design layer
     * is flex-centered in the stage (the grid cell); transform-origin center scales
     * from the middle of the group widget, not each member individually.
     */
    _syncGroupCompositeDesignLayerScale: function (layer, comp, innerW, innerH) {
        if (!layer || !comp) return 1;
        const designW = Math.max(1, Number(comp.designWidth) || 1);
        const designH = Math.max(1, Number(comp.designHeight) || 1);
        const availW = Math.max(1, Number(innerW) || 1);
        const availH = Math.max(1, Number(innerH) || 1);
        let scale = Math.min(availW / designW, availH / designH);
        if (!Number.isFinite(scale) || scale <= 0) scale = 1;
        layer.style.transform = scale === 1 ? '' : ('scale(' + scale + ')');
        return scale;
    },

    /** Map one member's fixed design rect into the composite design layer (group Rescale). */
    _applyCompositeMemberDesignRect: function (w, comp) {
        if (!w || !w.elements || !w.elements.wrapper) return;
        const s = w.elements.wrapper.style;
        const x = BaseWidget.toFiniteNumber(w.overrides.x, comp.originX) - comp.originX;
        const y = BaseWidget.toFiniteNumber(w.overrides.y, comp.originY) - comp.originY;
        const width = BaseWidget.resolveInstanceWidth(w.overrides);
        const height = BaseWidget.resolveInstanceHeight(w.overrides);
        s.position = 'absolute';
        s.left = x + 'px';
        s.top = y + 'px';
        s.width = width + 'px';
        s.height = height + 'px';
        s.minHeight = '0';
        s.maxHeight = 'none';
    },

    /** Set each member wrapper's absolute left/top/width/height in design space (group Rescale). */
    _positionGroupCompositeMembersDesign: function (groupId, layer, comp) {
        if (!layer) return;
        const memberIds = this.getGroupMemberIds(groupId);
        for (let i = 0; i < memberIds.length; i++) {
            const w = this.widgets[memberIds[i]];
            if (!w) continue;
            this._applyCompositeMemberDesignRect(w, comp);
        }
    },

    /** Map one member's fixed design rect into the composite cell (stretched fractions). */
    _applyCompositeMemberScreenRect: function (w, comp, cellW, cellH) {
        if (!w || !w.elements || !w.elements.wrapper) return;
        const s = w.elements.wrapper.style;
        const x = BaseWidget.toFiniteNumber(w.overrides.x, comp.originX) - comp.originX;
        const y = BaseWidget.toFiniteNumber(w.overrides.y, comp.originY) - comp.originY;
        const width = BaseWidget.resolveInstanceWidth(w.overrides);
        const height = BaseWidget.resolveInstanceHeight(w.overrides);
        const fx = comp.designWidth > 0 ? x / comp.designWidth : 0;
        const fy = comp.designHeight > 0 ? y / comp.designHeight : 0;
        const fw = comp.designWidth > 0 ? width / comp.designWidth : 0;
        const fh = comp.designHeight > 0 ? height / comp.designHeight : 0;
        s.position = 'absolute';
        s.left = (fx * cellW) + 'px';
        s.top = (fy * cellH) + 'px';
        s.width = (fw * cellW) + 'px';
        s.height = (fh * cellH) + 'px';
        s.minHeight = '0';
        s.maxHeight = 'none';
    },

    /** Set each member wrapper's absolute left/top/width/height from design fractions. */
    _positionGroupCompositeMembers: function (groupId, wrapper, comp, cellW, cellH) {
        const memberIds = this.getGroupMemberIds(groupId);
        for (let i = 0; i < memberIds.length; i++) {
            const w = this.widgets[memberIds[i]];
            if (!w) continue;
            this._applyCompositeMemberScreenRect(w, comp, cellW, cellH);
        }
    },

    /** Authoring mode: members render their own fixed design geometry; just trigger renders. */
    _renderGroupCompositeMembers: function (groupId, comp) {
        const memberIds = this.getGroupMemberIds(groupId);
        for (let i = 0; i < memberIds.length; i++) {
            const w = this.widgets[memberIds[i]];
            if (w && typeof w.render === 'function') w.render();
        }
    },

    /** Render or refresh every group composite (responsive mode only). */
    _renderAllGroupComposites: function () {
        if (!this._isResponsiveLayoutMode()) { this._teardownAllGroupComposites(); return; }
        const self = this;
        Object.keys(this.groups || {}).forEach(function (gid) { self._renderGroupComposite(gid); });
    },

    /** Reflow every closed composite wrapper after a responsive reflow pass. */
    _reflowAllGroupComposites: function () {
        if (!this._isResponsiveLayoutMode()) return;
        let pending = false;
        const self = this;
        Object.keys(this.groups || {}).forEach(function (gid) {
            if (self._isGroupCompositeOpen(gid)) return;
            const wrapper = document.getElementById('group-composite-' + gid);
            if (!wrapper) return;
            const comp = self._resolveGroupCompositeLayout(gid);
            if (!comp) return;
            if (!self._reflowGroupComposite(gid, wrapper, comp)) pending = true;
        });
        if (pending) this._scheduleGroupCompositeLayoutPass(0);
    },

    _clearCompositeLayoutTimer: function () {
        const handle = this._compositeLayoutTimer;
        this._compositeLayoutTimer = null;
        if (!handle) return;
        if (typeof WorkerTimer !== 'undefined' && WorkerTimer && typeof WorkerTimer.clearTimeout === 'function') {
            WorkerTimer.clearTimeout(handle);
        } else {
            clearTimeout(handle);
        }
    },

    _compositeLayoutTimerSet: function (fn, ms) {
        this._clearCompositeLayoutTimer();
        if (typeof WorkerTimer !== 'undefined' && WorkerTimer && typeof WorkerTimer.setTimeout === 'function') {
            this._compositeLayoutTimer = WorkerTimer.setTimeout(fn, ms);
        } else {
            this._compositeLayoutTimer = setTimeout(fn, ms);
        }
    },

    /**
     * Retry composite reflow until every closed wrapper has a column width or attempts
     * are exhausted. Uses WorkerTimer (not main-thread setTimeout/rAF) so the pass
     * is not starved on cold load the way the responsive resize fix documented.
     */
    _scheduleGroupCompositeLayoutPass: function (attempt) {
        if (!this._isResponsiveLayoutMode()) return;
        const maxAttempts = 24;
        const delayMs = 50;
        const self = this;
        const runAttempt = function () {
            if (!self._isResponsiveLayoutMode()) return;
            let pending = false;
            Object.keys(self.groups || {}).forEach(function (gid) {
                if (self._isGroupCompositeOpen(gid)) return;
                const wrapper = document.getElementById('group-composite-' + gid);
                if (!wrapper) return;
                const comp = self._resolveGroupCompositeLayout(gid);
                if (!comp) return;
                if (!self._reflowGroupComposite(gid, wrapper, comp)) pending = true;
            });
            const nextAttempt = Number.isFinite(attempt) ? attempt + 1 : 1;
            if (pending && nextAttempt < maxAttempts) {
                self._scheduleGroupCompositeLayoutPass(nextAttempt);
                return;
            }
            if (!pending) {
                self._assignResponsiveGridPlacement();
                if (!self._responsiveLayoutSyncRunning) {
                    self._runResponsiveRemeasurePass();
                }
            }
        };
        const nextAttempt = Number.isFinite(attempt) ? attempt : 0;
        if (nextAttempt === 0) {
            runAttempt();
            return;
        }
        this._compositeLayoutTimerSet(runAttempt, delayMs);
    },

    /** Schedule a composite reflow for a group (rAF-debounced, single pass). */
    _requestGroupCompositeReflow: function (groupId) {
        if (!this._isResponsiveLayoutMode()) return;
        if (!this._compositeReflowDirty) this._compositeReflowDirty = {};
        if (groupId) this._compositeReflowDirty[groupId] = true;
        if (this._compositeReflowScheduled) return;
        this._compositeReflowScheduled = true;
        const self = this;
        const run = function () {
            self._compositeReflowScheduled = false;
            const dirty = self._compositeReflowDirty;
            self._compositeReflowDirty = null;
            const ids = dirty ? Object.keys(dirty) : Object.keys(self.groups || {});
            ids.forEach(function (gid) {
                if (self._isGroupCompositeOpen(gid)) return;
                const wrapper = document.getElementById('group-composite-' + gid);
                if (!wrapper) return;
                const comp = self._resolveGroupCompositeLayout(gid);
                if (!comp) return;
                if (!self._reflowGroupComposite(gid, wrapper, comp)) {
                    self._scheduleGroupCompositeLayoutPass(0);
                }
            });
            self._assignResponsiveGridPlacement();
            if (!self._responsiveLayoutSyncRunning) {
                self._runResponsiveRemeasurePass();
            }
        };
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(run);
        } else {
            run();
        }
    },

    _ensureUniqueGroupName: function (requestedName, excludedGroupId = null) {
        const base = String(requestedName || '').trim() || 'New Group';
        const taken = new Set();
        Object.keys(this.groups || {}).forEach(groupId => {
            if (groupId === excludedGroupId) return;
            const name = String((this.groups[groupId] && this.groups[groupId].name) || '').trim().toLowerCase();
            if (name) taken.add(name);
        });

        if (!taken.has(base.toLowerCase())) return base;

        let suffix = 2;
        let candidate = `${base} (${suffix})`;
        while (taken.has(candidate.toLowerCase())) {
            suffix += 1;
            candidate = `${base} (${suffix})`;
        }
        return candidate;
    },

    getGroupByWidgetId: function (widgetId) {
        for (const groupId of Object.keys(this.groups || {})) {
            const group = this.groups[groupId];
            if (group && group.widgets && group.widgets[widgetId]) {
                return group;
            }
        }
        return null;
    },

    getGroupMemberIds: function (groupId) {
        const group = this.groups[groupId];
        if (!group) return [];
        return this._sanitizeSelectionIds(Object.keys(group.widgets || {}));
    },

    _normalizeGroupOverridePage: function (raw) {
        return String(raw == null ? '' : raw).trim();
    },

    _normalizeGroupOverridePageFromPayload: function (payload) {
        if (payload === null || payload === undefined) return '';
        if (typeof payload === 'object') {
            if (payload && Object.prototype.hasOwnProperty.call(payload, 'page')) {
                return this._normalizeGroupOverridePage(payload.page);
            }
            if (payload && Object.prototype.hasOwnProperty.call(payload, 'value')) {
                return this._normalizeGroupOverridePageFromPayload(payload.value);
            }
            return '';
        }
        return this._normalizeGroupOverridePage(payload);
    },

    _hasLiveDataWithAlias: function (topic) {
        if (!topic || !this.liveData) return null;
        if (Object.prototype.hasOwnProperty.call(this.liveData, topic)) return topic;
        const alt = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function')
            ? HomeyTopicAlias.aliasOf(topic)
            : null;
        if (alt && Object.prototype.hasOwnProperty.call(this.liveData, alt)) return alt;
        return null;
    },

    getGroupEffectiveOverridePageSpecForGroup: function (groupId) {
        const group = this.groups && this.groups[groupId];
        if (!group) return '';
        const bindings = group.bindings && typeof group.bindings === 'object' ? group.bindings : null;
        const topic = bindings && typeof bindings.overridePage === 'string' ? bindings.overridePage.trim() : '';
        if (topic !== '') {
            const matched = this._hasLiveDataWithAlias(topic);
            if (matched) {
                return this._normalizeGroupOverridePageFromPayload(this.liveData[matched]);
            }
        }
        return this._normalizeGroupOverridePage(group.overridePage);
    },

    getGroupPageOverrideForWidget: function (widgetId) {
        const group = this.getGroupByWidgetId(widgetId);
        if (!group || !group.id) return '';
        return this.getGroupEffectiveOverridePageSpecForGroup(group.id);
    },

    resolveEffectivePageForWidgetId: function (widgetId, fallbackPage) {
        const ov = this.getGroupPageOverrideForWidget(widgetId);
        if (ov !== '') return ov;
        const widget = this.widgets && this.widgets[widgetId];
        if (widget) {
            const b = widget.bindings;
            const topic = (b && typeof b.page === 'string') ? b.page.trim() : '';
            if (topic !== '') {
                const matched = this._hasLiveDataWithAlias(topic);
                if (matched) {
                    let liveVal;
                    if (typeof widget.resolveValue === 'function') {
                        liveVal = widget.resolveValue('page', fallbackPage);
                    } else {
                        liveVal = this.liveData[matched];
                    }
                    const norm = this._normalizeGroupOverridePageFromPayload(liveVal);
                    if (norm !== '') return norm;
                }
            }
        }
        if (fallbackPage === null || fallbackPage === undefined) return '1';
        return String(fallbackPage);
    },

    _isGroupDimBackdropEffective: function (groupId) {
        const group = this.groups && this.groups[groupId];
        if (!group) return false;
        const bindings = group.bindings && typeof group.bindings === 'object' ? group.bindings : null;
        const topic = bindings && typeof bindings.dimBackgroundWhenVisible === 'string' ? bindings.dimBackgroundWhenVisible.trim() : '';
        if (topic !== '') {
            const matched = this._hasLiveDataWithAlias(topic);
            if (matched) {
                return this._coercePayloadToVisibleBoolean(this.liveData[matched]);
            }
        }
        return group.dimBackgroundWhenVisible === true;
    },

    getGroupModalAbsoluteZForWidget: function (widgetId) {
        if (!this._groupModalAbsZByWidgetId || typeof this._groupModalAbsZByWidgetId !== 'object') return null;
        if (!Object.prototype.hasOwnProperty.call(this._groupModalAbsZByWidgetId, widgetId)) return null;
        const z = this._groupModalAbsZByWidgetId[widgetId];
        if (typeof z !== 'number' || isNaN(z)) return null;
        return String(z);
    },

    _isWidgetInteractiveForPointer: function (widget) {
        if (!widget || !widget.elements || !widget.elements.container) return false;
        return widget.elements.container.classList.contains('interactive');
    },

    /** Stable modal stacking: zIndex asc, then decorative widgets, then interactive controls on top. */
    _sortModalWidgetIdsForBackdrop: function (modalIds) {
        const self = this;
        return modalIds.slice().sort(function (a, b) {
            const wa = self.widgets[a];
            const wb = self.widgets[b];
            const za = wa ? self._sparseWidgetChrome(wa).z : 0;
            const zb = wb ? self._sparseWidgetChrome(wb).z : 0;
            const ownA = isNaN(za) ? 0 : za;
            const ownB = isNaN(zb) ? 0 : zb;
            if (ownA !== ownB) return ownA - ownB;
            const ia = self._isWidgetInteractiveForPointer(wa);
            const ib = self._isWidgetInteractiveForPointer(wb);
            if (ia !== ib) return ia ? 1 : -1;
            const elA = document.getElementById('widget-' + a);
            const elB = document.getElementById('widget-' + b);
            if (elA && elB && elA !== elB) {
                const pos = elA.compareDocumentPosition(elB);
                if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
                if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            }
            return String(a).localeCompare(String(b));
        });
    },

    _syncGroupBackdropOverlays: function () {
        const canvas = document.getElementById('dashboard-canvas');
        const existing = document.getElementById('dashboard-group-dim-overlay');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        this._groupModalAbsZByWidgetId = null;

        if (this.isEditMode || !canvas) return;

        const modalSet = {};
        const addGroupMembersIfDim = (gid) => {
            if (!this._isGroupDimBackdropEffective(gid)) return;
            if (!this.isGroupRuntimeVisible(gid)) return;
            const mids = this.getGroupMemberIds(gid);
            for (let i = 0; i < mids.length; i++) {
                const wid = mids[i];
                const w = this.widgets[wid];
                if (!w) continue;
                if (!this._sparseWidgetChrome(w).visible) continue;
                if (!this._widgetCoversActivePage(wid, w)) continue;
                modalSet[wid] = true;
            }
        };
        Object.keys(this.groups || {}).forEach(addGroupMembersIfDim);

        const modalIds = this._sortModalWidgetIdsForBackdrop(Object.keys(modalSet));
        if (modalIds.length === 0) return;

        let maxZ = 0;
        Object.keys(this.widgets || {}).forEach((wid) => {
            if (modalSet[wid]) return;
            const w = this.widgets[wid];
            if (!w) return;
            if (!this._widgetCoversActivePage(wid, w)) return;
            const z = this._sparseWidgetChrome(w).z;
            if (z > maxZ) maxZ = z;
        });

        const overlayZ = maxZ + 1;
        const baseModalZ = maxZ + 2;
        const map = {};
        for (let i = 0; i < modalIds.length; i++) {
            const wid = modalIds[i];
            const w = this.widgets[wid];
            if (!w) continue;
            map[wid] = baseModalZ + this._sparseWidgetChrome(w).z + i;
        }
        this._groupModalAbsZByWidgetId = map;

        const overlay = document.createElement('div');
        overlay.id = 'dashboard-group-dim-overlay';
        overlay.className = 'dashboard-group-dim-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.style.position = 'absolute';
        overlay.style.left = '0';
        overlay.style.top = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = String(overlayZ);
        overlay.style.pointerEvents = 'auto';
        overlay.style.boxSizing = 'border-box';
        canvas.appendChild(overlay);
    },

    _sanitizeGroupBindingsForStorage: function (b) {
        if (!b || typeof b !== 'object') return {};
        const out = {};
        if (typeof b.visible === 'string') out.visible = b.visible;
        if (typeof b.overridePage === 'string') out.overridePage = b.overridePage;
        if (typeof b.dimBackgroundWhenVisible === 'string') out.dimBackgroundWhenVisible = b.dimBackgroundWhenVisible;
        return out;
    },

    _coercePayloadToVisibleBoolean: function (payload) {
        if (payload === true) return true;
        if (payload === false) return false;
        if (typeof payload === 'number') {
            if (payload === 0 || isNaN(payload)) return false;
            return true;
        }
        if (payload === null || payload === undefined) return true;
        if (typeof payload === 'object') {
            if (payload && Object.prototype.hasOwnProperty.call(payload, 'value')) {
                return this._coercePayloadToVisibleBoolean(payload.value);
            }
            if (payload && Object.prototype.hasOwnProperty.call(payload, 'state')) {
                return this._coercePayloadToVisibleBoolean(payload.state);
            }
            return true;
        }
        const s = String(payload).trim().toLowerCase();
        if (s === '' || s === 'false' || s === '0' || s === 'off' || s === 'no' || s === 'hidden' || s === 'hide') return false;
        if (s === 'true' || s === '1' || s === 'on' || s === 'yes' || s === 'shown' || s === 'show') return true;
        return true;
    },

    isGroupRuntimeVisible: function (groupId) {
        const group = this.groups && this.groups[groupId];
        if (!group) return true;
        const bindings = group.bindings && typeof group.bindings === 'object' ? group.bindings : null;
        const topic = bindings && typeof bindings.visible === 'string' ? bindings.visible.trim() : '';
        if (topic !== '') {
            const matched = this._hasLiveDataWithAlias(topic);
            if (matched) {
                return this._coercePayloadToVisibleBoolean(this.liveData[matched]);
            }
        }
        return group.visible !== false;
    },

    isWidgetHiddenByGroupRuntime: function (widgetId) {
        if (this.isEditMode) return false;
        const group = this.getGroupByWidgetId(widgetId);
        if (!group || !group.id) return false;
        // In Responsive Columns the composite wrapper hides as a whole; members must
        // not be hidden individually or the wrapper would render an empty stage.
        if (this._isResponsiveLayoutMode()) return false;
        return !this.isGroupRuntimeVisible(group.id);
    },

    _scheduleGroupVisibility: function (groupId) {
        if (!groupId) return;
        if (!this._pendingGroupVisibilityIds) this._pendingGroupVisibilityIds = {};
        this._pendingGroupVisibilityIds[groupId] = true;
        if (this._groupVisibilityScheduled) return;
        this._groupVisibilityScheduled = true;
        const self = this;
        const run = function () {
            self._groupVisibilityScheduled = false;
            const ids = self._pendingGroupVisibilityIds || {};
            self._pendingGroupVisibilityIds = {};
            self._syncGroupBackdropOverlays();
            const keys = Object.keys(ids);
            for (let i = 0; i < keys.length; i++) {
                self._applySingleGroupVisibility(keys[i]);
            }
        };
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
        else run();
    },

    _applySingleGroupVisibility: function (groupId) {
        if (this._isResponsiveLayoutMode()) {
            this._renderGroupComposite(groupId);
            this._requestResponsiveReflow();
            return;
        }
        const ids = this.getGroupMemberIds(groupId);
        for (let i = 0; i < ids.length; i++) {
            const w = this.widgets[ids[i]];
            if (w && typeof w.render === 'function') w.render();
        }
    },

    refreshAllGroupsVisibility: function () {
        if (this._isResponsiveLayoutMode()) {
            this._renderAllGroupComposites();
            this._requestResponsiveReflow();
            return;
        }
        const seen = {};
        const gkeys = Object.keys(this.groups || {});
        for (let i = 0; i < gkeys.length; i++) {
            const ids = this.getGroupMemberIds(gkeys[i]);
            for (let j = 0; j < ids.length; j++) seen[ids[j]] = true;
        }
        Object.keys(seen).forEach((id) => {
            const w = this.widgets[id];
            if (!w || typeof w.render !== 'function') return;
            if (typeof this._widgetCoversActivePage === 'function' && !this._widgetCoversActivePage(id, w)) {
                if (w.elements && w.elements.wrapper && w.elements.wrapper.style.display !== 'none') {
                    w.elements.wrapper.style.display = 'none';
                    if (typeof w._syncEditLabelDisplay === 'function') w._syncEditLabelDisplay();
                    if (typeof w.pauseForBackground === 'function') w.pauseForBackground();
                }
                this._syncWidgetPageChrome(w, false);
                return;
            }
            w.render();
        });
    },

    _isSelectionExactlyGroup: function (groupId) {
        if (!groupId || !this.groups[groupId]) return false;
        const members = this.getGroupMemberIds(groupId);
        const selected = this._sanitizeSelectionIds(this.selectedIds);
        if (members.length === 0 || members.length !== selected.length) return false;
        return members.every(id => selected.includes(id));
    },

    _syncSelectedGroupFromSelection: function () {
        this.selectedIds = this._sanitizeSelectionIds(this.selectedIds);
        this.selectedGroupId = null;
        if (this.selectedIds.length < 2) return;

        Object.keys(this.groups || {}).some(groupId => {
            if (this._isSelectionExactlyGroup(groupId)) {
                this.selectedGroupId = groupId;
                return true;
            }
            return false;
        });
    },

    getEffectiveSelectionIds: function () {
        return this._sanitizeSelectionIds(this.selectedIds);
    },

    isWidgetVisibleInEditor: function (widgetId) {
        if (widgetId && String(widgetId).indexOf('awgprev_') === 0) return true;
        if (!this.isEditMode || !this.openedGroupId) return true;
        const members = this.getGroupMemberIds(this.openedGroupId);
        return members.includes(widgetId);
    },

    /** After group membership changes, new widgets may have rendered once while still "outside" the opened group (display:none). */
    _rerenderWidgetsEditorVisibility: function (ids) {
        if (!this.isEditMode || !Array.isArray(ids)) return;
        ids.forEach(id => {
            const w = this.widgets[id];
            if (w && typeof w.render === 'function') w.render();
        });
    },

    /** While a group is open in the editor, pasted or newly added widgets join that group (snippet paste and Add Widget). */
    _attachCreatedWidgetsToOpenedGroup: function (createdIds) {
        const groupId = this.openedGroupId;
        if (!groupId || !this.groups || !this.groups[groupId]) return;
        const host = this.groups[groupId];
        if (!host.widgets || typeof host.widgets !== 'object') host.widgets = {};
        createdIds.forEach(id => {
            if (!this.widgets[id]) return;
            Object.keys(this.groups || {}).forEach(gid => {
                if (gid === groupId) return;
                const g = this.groups[gid];
                if (g && g.widgets && g.widgets[id]) delete g.widgets[id];
            });
            host.widgets[id] = true;
        });
    },

    _groupChromeSignature: function (group) {
        if (!group) return '';
        return (group.locked === true ? '1' : '0') + '|' +
            (group.visible !== false ? '1' : '0') + '|' +
            String(group.overridePage || '');
    },

    _groupContainingWidget: function (groups, widgetId) {
        const gids = Object.keys(groups || {});
        for (let i = 0; i < gids.length; i++) {
            const group = groups[gids[i]];
            if (group && group.widgets && group.widgets[widgetId]) return group;
        }
        return null;
    },

    /**
     * Repaint widgets whose group membership or lock/page chrome changed.
     * Skips the rest of the dashboard; off-page render guards stay inside render().
     */
    _renderWidgetsTouchedByGroupChange: function (beforeGroups) {
        const before = beforeGroups || {};
        const after = this.groups || {};
        const ids = {};
        const collect = function (groups) {
            const gids = Object.keys(groups || {});
            for (let i = 0; i < gids.length; i++) {
                const widgets = groups[gids[i]] && groups[gids[i]].widgets;
                if (!widgets) continue;
                const wids = Object.keys(widgets);
                for (let j = 0; j < wids.length; j++) ids[wids[j]] = true;
            }
        };
        collect(before);
        collect(after);
        const widgetIds = Object.keys(ids);
        for (let i = 0; i < widgetIds.length; i++) {
            const id = widgetIds[i];
            const beforeGroup = this._groupContainingWidget(before, id);
            const afterGroup = this._groupContainingWidget(after, id);
            const beforeId = beforeGroup && beforeGroup.id ? beforeGroup.id : '';
            const afterId = afterGroup && afterGroup.id ? afterGroup.id : '';
            if (beforeId === afterId && this._groupChromeSignature(beforeGroup) === this._groupChromeSignature(afterGroup)) {
                continue;
            }
            const w = this.widgets[id];
            if (w && typeof w.render === 'function') w.render();
        }
    },

    isWidgetEffectivelyLocked: function (widgetId) {
        const widget = this.widgets[widgetId];
        if (!widget) return false;
        const bindings = widget.bindings;
        const lockedBound = bindings && typeof bindings.locked === 'string' && bindings.locked !== '';
        if (lockedBound && typeof widget.resolveValue === 'function') {
            if (widget.resolveValue('locked', false)) return true;
        } else if (widget.overrides && widget.overrides.locked === true) {
            return true;
        }
        const groups = this.groups || {};
        const groupKeys = Object.keys(groups);
        for (let i = 0; i < groupKeys.length; i++) {
            const group = groups[groupKeys[i]];
            if (group && group.locked === true && group.widgets && group.widgets[widgetId]) {
                return true;
            }
        }
        return false;
    },

    _applySelectionVisualState: function (forceFull) {
        if (forceFull) {
            const allGroups = this.groups || {};
            const gids = Object.keys(allGroups);
            for (let i = 0; i < gids.length; i++) {
                const wrap = document.getElementById('group-composite-' + gids[i]);
                if (wrap) wrap.classList.remove('composite-selected');
            }

            const allWidgets = this.widgets || {};
            const wkeys = Object.keys(allWidgets);
            for (let i = 0; i < wkeys.length; i++) {
                const w = allWidgets[wkeys[i]];
                if (w) {
                    w.deselect();
                    if (w.elements && w.elements.wrapper) {
                        w.elements.wrapper.classList.remove('multi-selected');
                        w.elements.wrapper.classList.remove('group-selected');
                    }
                }
            }
            this._prevVisualSelectedIds = [];
            this._prevVisualGroupId = null;
        }

        if (this._prevVisualGroupId && this._prevVisualGroupId !== this.selectedGroupId) {
            const prevWrap = document.getElementById('group-composite-' + this._prevVisualGroupId);
            if (prevWrap) prevWrap.classList.remove('composite-selected');
        }

        if (this.selectedGroupId && this._isResponsiveLayoutMode() && !this.openedGroupId) {
            const wrap = document.getElementById('group-composite-' + this.selectedGroupId);
            if (wrap) wrap.classList.add('composite-selected');
        }
        this._prevVisualGroupId = this.selectedGroupId || null;

        const prevIds = this._prevVisualSelectedIds || [];
        const currentIds = this.selectedIds || [];
        const currentSet = new Set(currentIds);

        for (let i = 0; i < prevIds.length; i++) {
            const pid = prevIds[i];
            if (!currentSet.has(pid)) {
                const w = this.widgets[pid];
                if (w) {
                    w.deselect();
                    if (w.elements && w.elements.wrapper) {
                        w.elements.wrapper.classList.remove('multi-selected');
                        w.elements.wrapper.classList.remove('group-selected');
                    }
                }
            }
        }

        const isMulti = currentIds.length > 1;
        const hasGroup = !!this.selectedGroupId;
        for (let i = 0; i < currentIds.length; i++) {
            const sid = currentIds[i];
            const widget = this.widgets[sid];
            if (!widget) continue;
            const ctx = typeof this.getWidgetCompositeContext === 'function' ? this.getWidgetCompositeContext(sid) : null;
            if (ctx && !ctx.open) continue;
            widget.select();
            if (widget.elements && widget.elements.wrapper) {
                if (isMulti) {
                    widget.elements.wrapper.classList.add('multi-selected');
                } else {
                    widget.elements.wrapper.classList.remove('multi-selected');
                }
                if (hasGroup) {
                    widget.elements.wrapper.classList.add('group-selected');
                } else {
                    widget.elements.wrapper.classList.remove('group-selected');
                }
            }
        }

        this._prevVisualSelectedIds = currentIds.slice();
    },

    _updateUniversalActionButtons: function () {
        const btnCopy = document.getElementById('toolbar-btn-copy');
        const btnCut = document.getElementById('toolbar-btn-cut');
        const btnPaste = document.getElementById('toolbar-btn-paste');
        const btnExportSnippet = document.getElementById('share-export-snippet');
        const btnImportSnippet = document.getElementById('share-import-snippet');
        const btnGroup = document.getElementById('btn-group-create');
        const btnUngroup = document.getElementById('btn-group-ungroup');
        const btnOpen = document.getElementById('btn-group-open');
        const groupRow = document.getElementById('universal-group-row');
        const hasSelection = this.getEffectiveSelectionIds().length > 0;
        const canPaste = this._hasInternalSnippetClipboard();
        const canCut = hasSelection && !this.getEffectiveSelectionIds().some(id => this.isWidgetEffectivelyLocked(id));
        this._setEditorToolDisabled(btnCopy, !hasSelection);
        this._setEditorToolDisabled(btnCut, !canCut);
        this._setEditorToolDisabled(btnExportSnippet, !hasSelection);
        this._setEditorToolDisabled(btnPaste, !canPaste);
        if (btnImportSnippet) {
            this._setEditorToolDisabled(btnImportSnippet, false);
        }
        if (!btnGroup || !btnUngroup || !btnOpen) {
            if (typeof QuickToolbar !== 'undefined' && typeof QuickToolbar.refresh === 'function') {
                QuickToolbar.refresh();
            }
            return;
        }

        const isExactGroupSelection = !!(this.selectedGroupId && this._isSelectionExactlyGroup(this.selectedGroupId));
        const hasMultiSelection = this.selectedIds.length > 1;
        const isGroupOpen = !!this.openedGroupId;
        const hasExactGroup = !!this.selectedGroupId;
        const activeGroupId = this.selectedGroupId || this.openedGroupId;
        const hasActionableGroup = !!(activeGroupId && this.groups[activeGroupId]);
        const isGroupLocked = hasActionableGroup && this.groups[activeGroupId].locked === true;
        const openedMemberIds = isGroupOpen ? this.getGroupMemberIds(this.openedGroupId) : [];
        const selectedInOpenGroup = isGroupOpen
            ? this.getEffectiveSelectionIds().filter((id) => openedMemberIds.includes(id))
            : [];
        const hasRemoveFromSelection = selectedInOpenGroup.length > 0;
        const openGroupLocked = isGroupOpen && this.groups[this.openedGroupId] && this.groups[this.openedGroupId].locked === true;

        const showGroupBtn = hasMultiSelection && !isGroupOpen;
        const groupDisabled = isExactGroupSelection;
        const showGroupPrimary = isGroupOpen || showGroupBtn;
        const groupPrimaryDisabled = isGroupOpen
            ? (!hasRemoveFromSelection || openGroupLocked)
            : groupDisabled;
        const showUngroupOpen = hasMultiSelection || hasExactGroup || isGroupOpen;
        const canUngroupOpen = hasActionableGroup && (hasExactGroup || isGroupOpen);
        const ungroupOpenDisabled = !canUngroupOpen || isGroupLocked;
        const isOpened = isGroupOpen && this.openedGroupId === activeGroupId;

        btnGroup.classList.toggle('hidden', !showGroupPrimary);
        btnGroup.classList.toggle('opacity-50', groupPrimaryDisabled);
        btnGroup.classList.toggle('pointer-events-none', groupPrimaryDisabled);
        if (isGroupOpen) {
            btnGroup.innerHTML = '<i class="ph-bold ph-arrow-bend-up-left text-amber-400"></i> Remove From Group';
            btnGroup.title = 'Remove the selected widgets from this open group (ungroups when all or all but one member are selected)';
        } else {
            btnGroup.innerHTML = '<i class="ph-bold ph-stack-simple bound-topic-text"></i> Group';
            btnGroup.title = 'Create a new group, or add widgets to an existing group in the same selection';
        }
        btnUngroup.classList.toggle('hidden', !showUngroupOpen);
        btnOpen.classList.toggle('hidden', !showUngroupOpen);
        btnOpen.innerHTML = isOpened
            ? '<i class="ph-bold ph-arrows-in-simple text-amber-400"></i> Close Group'
            : '<i class="ph-bold ph-arrows-out-simple bound-topic-text"></i> Open Group';
        btnOpen.title = isOpened
            ? 'Close focus mode and return to normal group selection'
            : 'Open focus mode to edit widgets inside the selected group';
        btnUngroup.classList.toggle('opacity-50', ungroupOpenDisabled);
        btnUngroup.classList.toggle('pointer-events-none', ungroupOpenDisabled);
        btnOpen.classList.toggle('opacity-50', ungroupOpenDisabled);
        btnOpen.classList.toggle('pointer-events-none', ungroupOpenDisabled);
        if (groupRow) {
            const showGroupRow = showGroupPrimary || showUngroupOpen;
            groupRow.classList.toggle('hidden', !showGroupRow);
        }
        if (typeof QuickToolbar !== 'undefined' && typeof QuickToolbar.refresh === 'function') {
            QuickToolbar.refresh();
        }
    },

    groupPrimaryToolbarAction: function () {
        if (this.openedGroupId) {
            this.removeSelectedWidgetsFromOpenedGroup();
            return;
        }
        this.groupSelectedWidgets();
    },

    getGroupSelectTargetPage: function (groupId) {
        const ids = this.getGroupMemberIds(groupId);
        if (ids.length < 2) return null;
        const currentPage = Math.max(1, parseInt(String(MASTER_SETTINGS.currentPage != null ? MASTER_SETTINGS.currentPage : 1), 10) || 1);
        let anyCovers = false;
        let groupMin = Number.POSITIVE_INFINITY;
        for (let i = 0; i < ids.length; i++) {
            const wid = ids[i];
            const widget = this.widgets[wid];
            if (!widget || !widget.overrides) continue;
            const raw = widget.overrides.page != null ? widget.overrides.page : '1';
            const pageStr = typeof this.resolveEffectivePageForWidgetId === 'function'
                ? this.resolveEffectivePageForWidgetId(wid, raw)
                : raw;
            if (typeof WidgetPageSpec !== 'undefined') {
                if (WidgetPageSpec.coversPage(pageStr, currentPage)) anyCovers = true;
                groupMin = Math.min(groupMin, WidgetPageSpec.minPage(pageStr));
            } else {
                const parsed = String(pageStr).split(',').map(function (p) { return parseInt(p.trim(), 10); }).filter(function (p) { return !isNaN(p); });
                const pages = parsed.length > 0 ? parsed : [1];
                if (pages.indexOf(currentPage) !== -1) anyCovers = true;
                groupMin = Math.min(groupMin, pages.length > 0 ? Math.min.apply(null, pages) : 1);
            }
        }
        if (!Number.isFinite(groupMin)) groupMin = 1;
        if (anyCovers) return currentPage;
        return groupMin;
    },

    _syncCurrentPageForGroupSelection: function (groupId) {
        const ids = this.getGroupMemberIds(groupId);
        if (ids.length < 2) return;
        const currentPage = Math.max(1, parseInt(String(MASTER_SETTINGS.currentPage != null ? MASTER_SETTINGS.currentPage : 1), 10) || 1);
        const target = this.getGroupSelectTargetPage(groupId);
        if (target === null || target === currentPage) return;
        this.updateGlobal({ currentPage: target });
    },

    selectGroup: function (groupId, forceOpenMode = false) {
        const group = this.groups[groupId];
        if (!group) return;
        const ids = this.getGroupMemberIds(groupId);
        if (ids.length < 2) return;
        this.selectedIds = ids;
        this.selectedGroupId = groupId;
        if (forceOpenMode) this.openedGroupId = groupId;
        this._syncCurrentPageForGroupSelection(groupId);
        this._applySelectionVisualState();
        if (typeof Editor !== 'undefined' && Editor.loadWidget) {
            Editor.currentId = 'MULTIPLE';
            Editor.loadWidget('MULTIPLE');
        }
        this._updateUniversalActionButtons();
        if (typeof Editor !== 'undefined' && Editor.updateToolbarState) Editor.updateToolbarState();
    },

    _getDistinctGroupIdsInWidgetSelection: function (widgetIds) {
        const seen = {};
        const order = [];
        for (let i = 0; i < widgetIds.length; i++) {
            const g = this.getGroupByWidgetId(widgetIds[i]);
            if (!g || !g.id) continue;
            if (seen[g.id]) continue;
            seen[g.id] = true;
            order.push(g.id);
        }
        order.sort((a, b) => {
            const na = String((this.groups[a] && this.groups[a].name) || a).toLowerCase();
            const nb = String((this.groups[b] && this.groups[b].name) || b).toLowerCase();
            if (na < nb) return -1;
            if (na > nb) return 1;
            return 0;
        });
        return order;
    },

    _getGroupMergeBlockingReason: function (targetGroupId, widgetIds) {
        const host = this.groups && this.groups[targetGroupId];
        if (!host) return 'Group not found.';
        const hostWidgets = host.widgets && typeof host.widgets === 'object' ? host.widgets : {};
        let hasOutsider = false;
        for (let o = 0; o < widgetIds.length; o++) {
            const wo = widgetIds[o];
            if (!hostWidgets[wo]) {
                hasOutsider = true;
                break;
            }
        }
        if (host.locked === true && hasOutsider) {
            return 'Unlock group "' + String(host.name || targetGroupId) + '" before adding widgets.';
        }
        for (let i = 0; i < widgetIds.length; i++) {
            const wid = widgetIds[i];
            if (!this.widgets[wid]) continue;
            if (this.isWidgetEffectivelyLocked(wid)) {
                const cur = this.getGroupByWidgetId(wid);
                const inTarget = cur && cur.id === targetGroupId;
                if (!inTarget) {
                    return 'Unlock the selection before changing group membership (a widget or its group is locked).';
                }
            }
            const curG = this.getGroupByWidgetId(wid);
            if (curG && curG.id !== targetGroupId && curG.locked === true) {
                return 'Unlock group "' + String(curG.name || curG.id) + '" before moving widgets out of it.';
            }
        }
        return '';
    },

    _mergeSelectionIntoGroup: async function (targetGroupId, selectedWidgetIds) {
        const blockReason = this._getGroupMergeBlockingReason(targetGroupId, selectedWidgetIds);
        if (blockReason) {
            await CustomDialog.alert(blockReason, 'Cannot Merge Group');
            return;
        }
        const beforeGroups = this._cloneJson(this.groups || {});
        const beforeSelection = this._captureSelectionState();
        const host = this.groups[targetGroupId];
        if (!host.widgets || typeof host.widgets !== 'object') host.widgets = {};
        for (let i = 0; i < selectedWidgetIds.length; i++) {
            const wid = selectedWidgetIds[i];
            if (!this.widgets[wid]) continue;
            Object.keys(this.groups || {}).forEach((gid) => {
                const g = this.groups[gid];
                if (g && g.widgets && g.widgets[wid]) delete g.widgets[wid];
            });
            host.widgets[wid] = true;
        }
        this._normalizeGroups();
        this.selectGroup(targetGroupId);
        if (typeof Editor !== 'undefined') Editor.refreshDropdown(this.widgets);
        this._syncGroupBackdropOverlays();
        this._renderWidgetsTouchedByGroupChange(beforeGroups);
        this.refreshAllGroupsVisibility();
        this._refreshEditorPageIndicator();
        this._updateUniversalActionButtons();
        this.markUnsaved();
        this._recordHistoryEntry({
            kind: 'groups',
            beforeGroups: beforeGroups,
            afterGroups: this._cloneJson(this.groups || {}),
            beforeSelection: beforeSelection,
            afterSelection: this._captureSelectionState()
        });
    },

    createGroupFromSelection: async function () {
        const selectedWidgetIds = this.getEffectiveSelectionIds();
        if (selectedWidgetIds.length < 2) return;
        if (this.openedGroupId) return;

        const distinctGroupIds = this._getDistinctGroupIdsInWidgetSelection(selectedWidgetIds);
        let targetGroupId = null;
        if (distinctGroupIds.length === 1) {
            targetGroupId = distinctGroupIds[0];
        } else if (distinctGroupIds.length > 1) {
            const choices = distinctGroupIds.map((gid) => ({
                value: gid,
                label: String((this.groups[gid] && this.groups[gid].name) || gid)
            }));
            const chosen = await CustomDialog.chooseOne(
                'Multiple groups are in this selection. Which group should keep its settings (visibility, Override Page(s), Blur Background When Visible)? All selected widgets will join that group.',
                'Keep Group Settings',
                choices
            );
            if (!chosen) return;
            targetGroupId = chosen;
        }

        if (targetGroupId) {
            await this._mergeSelectionIntoGroup(targetGroupId, selectedWidgetIds);
            return;
        }

        const beforeGroups = this._cloneJson(this.groups || {});
        const beforeSelection = this._captureSelectionState();

        const proposedName = this._ensureUniqueGroupName(`Group ${Object.keys(this.groups || {}).length + 1}`);
        const input = await CustomDialog.prompt("Enter a name for the new group:", proposedName, "Create Group");
        if (!input) return;
        const trimmed = String(input).trim();
        if (!trimmed) {
            await CustomDialog.alert("Group name cannot be empty.", "Invalid Group Name");
            return;
        }

        const groupId = this._generateGroupId();
        selectedWidgetIds.forEach(widgetId => {
            const previousGroup = this.getGroupByWidgetId(widgetId);
            if (!previousGroup) return;
            if (previousGroup.widgets) {
                delete previousGroup.widgets[widgetId];
            }
        });
        const nestedWidgets = {};
        selectedWidgetIds.forEach(widgetId => {
            nestedWidgets[widgetId] = true;
        });
        this.groups[groupId] = {
            id: groupId,
            name: this._ensureUniqueGroupName(trimmed),
            locked: false,
            visible: true,
            bindings: {},
            overridePage: '',
            dimBackgroundWhenVisible: false,
            widgets: nestedWidgets
        };
        if (this._isResponsiveLayoutMode()) {
            this._seedGroupComposite(groupId);
        }
        this._normalizeGroups();
        this.selectGroup(groupId);
        if (typeof Editor !== 'undefined') Editor.refreshDropdown(this.widgets);
        this._renderWidgetsTouchedByGroupChange(beforeGroups);
        this.refreshAllGroupsVisibility();
        this._syncGroupBackdropOverlays();
        this._refreshEditorPageIndicator();
        this._updateUniversalActionButtons();
        this.markUnsaved();
        this._recordHistoryEntry({
            kind: 'groups',
            beforeGroups: beforeGroups,
            afterGroups: this._cloneJson(this.groups || {}),
            beforeSelection: beforeSelection,
            afterSelection: this._captureSelectionState()
        });
    },

    renameGroup: function (groupId, requestedName) {
        const group = this.groups[groupId];
        if (!group) return;
        const beforeGroups = this._cloneJson(this.groups || {});
        const beforeSelection = this._captureSelectionState();
        const trimmed = String(requestedName || '').trim();
        if (!trimmed) return;
        const uniqueName = this._ensureUniqueGroupName(trimmed, groupId);
        if (group.name === uniqueName) return;
        group.name = uniqueName;
        if (typeof Editor !== 'undefined') {
            Editor.refreshDropdown(this.widgets);
            if (Editor.currentId === 'MULTIPLE') Editor.loadWidget('MULTIPLE');
        }
        this.markUnsaved();
        this._recordHistoryEntry({
            kind: 'groups',
            beforeGroups: beforeGroups,
            afterGroups: this._cloneJson(this.groups || {}),
            beforeSelection: beforeSelection,
            afterSelection: this._captureSelectionState()
        });
    },

    setGroupLocked: function (groupId, locked) {
        const group = this.groups[groupId];
        if (!group) return;
        const beforeGroups = this._cloneJson(this.groups || {});
        const beforeSelection = this._captureSelectionState();
        const nextLocked = locked === true;
        if (group.locked === nextLocked) return;
        group.locked = nextLocked;
        this._renderWidgetsTouchedByGroupChange(beforeGroups);
        if (typeof Editor !== 'undefined') {
            Editor.updateToolbarState();
            if (Editor.currentId === 'MULTIPLE') Editor.loadWidget('MULTIPLE');
        }
        this.markUnsaved();
        this._recordHistoryEntry({
            kind: 'groups',
            beforeGroups: beforeGroups,
            afterGroups: this._cloneJson(this.groups || {}),
            beforeSelection: beforeSelection,
            afterSelection: this._captureSelectionState()
        });
    },

    setGroupVisible: function (groupId, visible) {
        const group = this.groups[groupId];
        if (!group) return;
        const next = visible !== false;
        if (group.visible === next) return;
        const beforeGroups = this._cloneJson(this.groups || {});
        const beforeSelection = this._captureSelectionState();
        group.visible = next;
        this._syncGroupBackdropOverlays();
        this._applySingleGroupVisibility(groupId);
        if (typeof Editor !== 'undefined') {
            Editor.updateToolbarState();
            if (Editor.currentId === 'MULTIPLE') Editor.loadWidget('MULTIPLE');
        }
        this.markUnsaved();
        this._recordHistoryEntry({
            kind: 'groups',
            beforeGroups: beforeGroups,
            afterGroups: this._cloneJson(this.groups || {}),
            beforeSelection: beforeSelection,
            afterSelection: this._captureSelectionState()
        });
    },

    updateGroupBindingsForGroup: function (groupId, patch, replace) {
        const group = this.groups[groupId];
        if (!group) return;
        const beforeGroups = this._cloneJson(this.groups || {});
        const beforeSelection = this._captureSelectionState();
        let next;
        if (replace === true) {
            next = patch && typeof patch === 'object' ? patch : {};
        } else {
            next = typeof BindingsTree !== 'undefined'
                ? BindingsTree.deepMergeBindings(JSON.parse(JSON.stringify(group.bindings || {})), patch)
                : Object.assign({}, group.bindings || {}, patch);
        }
        group.bindings = this._sanitizeGroupBindingsForStorage(next);
        this._refreshEditorPageIndicator();
        this._syncGroupBackdropOverlays();
        this._applySingleGroupVisibility(groupId);
        if (typeof Editor !== 'undefined') {
            Editor.updateToolbarState();
        }
        this.markUnsaved();
        this._recordHistoryEntry({
            kind: 'groups',
            beforeGroups: beforeGroups,
            afterGroups: this._cloneJson(this.groups || {}),
            beforeSelection: beforeSelection,
            afterSelection: this._captureSelectionState()
        });
    },

    setGroupOverridePage: function (groupId, raw) {
        const group = this.groups[groupId];
        if (!group) return;
        const next = this._normalizeGroupOverridePage(raw);
        const prev = this._normalizeGroupOverridePage(group.overridePage);
        if (next === prev) return;
        const beforeGroups = this._cloneJson(this.groups || {});
        const beforeSelection = this._captureSelectionState();
        group.overridePage = next;
        this._refreshEditorPageIndicator();
        this._syncGroupBackdropOverlays();
        this._applySingleGroupVisibility(groupId);
        if (typeof Editor !== 'undefined') {
            Editor.updateToolbarState();
        }
        this.markUnsaved();
        this._recordHistoryEntry({
            kind: 'groups',
            beforeGroups: beforeGroups,
            afterGroups: this._cloneJson(this.groups || {}),
            beforeSelection: beforeSelection,
            afterSelection: this._captureSelectionState()
        });
    },

    setGroupDimBackgroundWhenVisible: function (groupId, enabled) {
        const group = this.groups[groupId];
        if (!group) return;
        const next = enabled === true;
        if (group.dimBackgroundWhenVisible === next) return;
        const beforeGroups = this._cloneJson(this.groups || {});
        const beforeSelection = this._captureSelectionState();
        group.dimBackgroundWhenVisible = next;
        this._refreshEditorPageIndicator();
        this._syncGroupBackdropOverlays();
        this._applySingleGroupVisibility(groupId);
        if (typeof Editor !== 'undefined') {
            Editor.updateToolbarState();
        }
        this.markUnsaved();
        this._recordHistoryEntry({
            kind: 'groups',
            beforeGroups: beforeGroups,
            afterGroups: this._cloneJson(this.groups || {}),
            beforeSelection: beforeSelection,
            afterSelection: this._captureSelectionState()
        });
    },

    toggleSelectedGroupLock: function () {
        const activeGroupId = this.selectedGroupId || this.openedGroupId;
        if (!activeGroupId || !this.groups[activeGroupId]) return;
        this.setGroupLocked(activeGroupId, !this.groups[activeGroupId].locked);
    },

    removeSelectedWidgetsFromOpenedGroup: function () {
        const groupId = this.openedGroupId;
        if (!groupId || !this.groups[groupId]) return;
        const group = this.groups[groupId];
        if (group.locked === true) return;

        const memberIds = this.getGroupMemberIds(groupId);
        const selectedInGroup = this.getEffectiveSelectionIds().filter((id) => memberIds.includes(id));
        if (selectedInGroup.length === 0) return;

        if (selectedInGroup.length >= memberIds.length - 1) {
            this.selectedIds = selectedInGroup.slice();
            this._syncSelectedGroupFromSelection();
            this.ungroupSelectedGroup();
            return;
        }

        const beforeGroups = this._cloneJson(this.groups || {});
        const beforeSelection = this._captureSelectionState();

        selectedInGroup.forEach((widgetId) => {
            if (group.widgets && group.widgets[widgetId]) delete group.widgets[widgetId];
        });
        if (this._isResponsiveLayoutMode()) {
            this._releaseWidgetsFromCompositeStage(selectedInGroup);
        }
        this._normalizeGroups();

        if (!this.groups[groupId]) {
            this.openedGroupId = null;
            if (this._isResponsiveLayoutMode()) {
                this._syncResponsiveCompositeAuthoringShell();
            }
        } else if (this._isResponsiveLayoutMode()) {
            this._renderGroupComposite(groupId);
        }

        this.selectedIds = this.selectedIds.filter((id) => !selectedInGroup.includes(id));
        this._syncSelectedGroupFromSelection();
        this._applySelectionVisualState();
        selectedInGroup.forEach((id) => {
            const w = this.widgets[id];
            if (w && typeof w.render === 'function') w.render();
        });
        if (this._isResponsiveLayoutMode()) {
            selectedInGroup.forEach((id) => this._requestResponsiveReflow(id));
            if (this.groups[groupId]) this._requestGroupCompositeReflow(groupId);
        }
        if (typeof Editor !== 'undefined') {
            Editor.refreshDropdown(this.widgets);
            if (this.selectedIds.length === 1) {
                Editor.loadWidget(this.selectedIds[0]);
            } else if (this.selectedIds.length > 1) {
                Editor.loadWidget('MULTIPLE');
            } else {
                Editor.loadWidget('GLOBAL_SETTINGS');
            }
        }
        this._updateUniversalActionButtons();
        this.markUnsaved();
        this._recordHistoryEntry({
            kind: 'groups',
            beforeGroups: beforeGroups,
            afterGroups: this._cloneJson(this.groups || {}),
            beforeSelection: beforeSelection,
            afterSelection: this._captureSelectionState()
        });
    },

    ungroupSelectedGroup: function () {
        const activeGroupId = this.selectedGroupId || this.openedGroupId;
        if (!activeGroupId || !this.groups[activeGroupId]) return;
        if (this.groups[activeGroupId].locked === true) return;
        const beforeGroups = this._cloneJson(this.groups || {});
        const beforeSelection = this._captureSelectionState();
        const ids = this.getGroupMemberIds(activeGroupId);
        const removedGroup = this.groups[activeGroupId];
        this._purgeLiveDataTopicsForGroupBindings(removedGroup);
        if (this._isResponsiveLayoutMode()) {
            this._syncResponsiveCompositeAuthoringShell();
            this._teardownGroupComposite(activeGroupId);
        }
        delete this.groups[activeGroupId];
        this._normalizeGroups();
        this.selectedIds = ids;
        this.selectedGroupId = null;
        this.openedGroupId = null;
        this._applySelectionVisualState();
        ids.forEach((id) => {
            const w = this.widgets[id];
            if (w && typeof w.render === 'function') w.render();
        });
        if (this._isResponsiveLayoutMode()) {
            ids.forEach((id) => this._requestResponsiveReflow(id));
        }
        if (typeof Editor !== 'undefined') {
            Editor.refreshDropdown(this.widgets);
            Editor.loadWidget(ids.length > 1 ? 'MULTIPLE' : (ids[0] || 'GLOBAL_SETTINGS'));
        }
        this._updateUniversalActionButtons();
        this.markUnsaved();
        this._recordHistoryEntry({
            kind: 'groups',
            beforeGroups: beforeGroups,
            afterGroups: this._cloneJson(this.groups || {}),
            beforeSelection: beforeSelection,
            afterSelection: this._captureSelectionState()
        });
    },

    _closeOpenedGroupForPageChange: function () {
        const groupId = this.openedGroupId;
        if (!groupId || !this.groups[groupId]) return false;
        this.openedGroupId = null;
        this.selectedGroupId = groupId;
        this.selectedIds = this.getGroupMemberIds(groupId);
        this._applySelectionVisualState();
        if (this._isResponsiveLayoutMode()) {
            this._syncResponsiveCompositeAuthoringShell();
            this._renderGroupComposite(groupId);
            Object.values(this.widgets).forEach(function (w) {
                if (w && typeof w.render === 'function') w.render();
            });
            this._scheduleGroupCompositeLayoutPass(0);
        }
        if (typeof Editor !== 'undefined') {
            Editor.refreshDropdown(this.widgets);
            Editor.loadWidget('MULTIPLE');
        }
        this._updateUniversalActionButtons();
        return true;
    },

    toggleOpenSelectedGroup: function () {
        const activeGroupId = this.selectedGroupId || this.openedGroupId;
        if (!activeGroupId || !this.groups[activeGroupId]) return;
        if (this.groups[activeGroupId].locked === true) return;
        const wasOpened = this.openedGroupId === activeGroupId;
        if (!wasOpened) {
            if (!this.selectedGroupId || !this._isSelectionExactlyGroup(this.selectedGroupId)) return;
        }
        if (wasOpened && this._isResponsiveLayoutMode()) {
            this._commitAutoSizedGroupMembers(activeGroupId);
        }
        this.openedGroupId = wasOpened ? null : activeGroupId;
        if (wasOpened) {
            // Closing authoring mode: bake the design bounds from the edited members.
            if (this._isResponsiveLayoutMode()) this._recomputeGroupCompositeBounds(activeGroupId);
            this.selectedGroupId = activeGroupId;
            this.selectedIds = this.getGroupMemberIds(activeGroupId);
            this._applySelectionVisualState();
        } else {
            this.selectedIds = [];
            this.selectedGroupId = null;
            this._applySelectionVisualState();
            this._syncCurrentPageForGroupSelection(activeGroupId);
        }
        if (this._isResponsiveLayoutMode()) {
            this._renderGroupComposite(activeGroupId);
            this._syncResponsiveCompositeAuthoringShell();
            Object.values(this.widgets).forEach(function (w) {
                if (w && typeof w.render === 'function') w.render();
            });
            if (wasOpened) {
                this._scheduleGroupCompositeLayoutPass(0);
            }
        } else {
            Object.values(this.widgets).forEach(w => w.render());
        }
        if (typeof Editor !== 'undefined') {
            Editor.refreshDropdown(this.widgets);
            if (wasOpened) {
                Editor.loadWidget('MULTIPLE');
            } else if (this.openedGroupId) {
                Editor.loadWidget('GLOBAL_SETTINGS');
            } else if (this.selectedIds.length === 1) {
                Editor.loadWidget(this.selectedIds[0]);
            } else if (this.selectedIds.length > 1) {
                Editor.loadWidget('MULTIPLE');
            } else {
                Editor.loadWidget('GLOBAL_SETTINGS');
            }
        }
        this._updateUniversalActionButtons();
    },

    _normalizeSelectionGroupEntry(entry) {
        return { allowEmptySelection: !!(entry && typeof entry === 'object' && entry.allowEmptySelection === true) };
    },

    _collectSelectionGroupIdsFromOverridesForType(type, overrides) {
        const set = new Set();
        if (!overrides || typeof overrides !== 'object') return set;
        const sg = String(overrides.selectionGroup || '').trim();
        if (sg) set.add(sg);
        if (type === 'menu' && Array.isArray(overrides.menuItems)) {
            overrides.menuItems.forEach((item) => {
                if (item && typeof item === 'object') {
                    const s = String(item.selectionGroup || '').trim();
                    if (s) set.add(s);
                }
            });
        }
        return set;
    },

    collectSelectionGroupIdsFromSerializedDashboard(data) {
        const set = new Set();
        const walk = (widgetsObj) => {
            if (!widgetsObj || typeof widgetsObj !== 'object') return;
            Object.values(widgetsObj).forEach((wd) => {
                if (!wd || typeof wd !== 'object') return;
                let t = String(wd.type || '').trim();
                if (t === 'textbox') t = 'list';
                this._collectSelectionGroupIdsFromOverridesForType(t, wd.overrides || {}).forEach((x) => set.add(x));
            });
        };
        if (data.widgets) walk(data.widgets);
        if (data.groups && typeof data.groups === 'object') {
            Object.values(data.groups).forEach((g) => {
                if (g && g.widgets) walk(g.widgets);
            });
        }
        return set;
    },

    collectSelectionGroupIdsFromLiveDashboard() {
        const set = new Set();
        Object.values(this.widgets || {}).forEach((w) => {
            if (!w || !w.overrides) return;
            const type = Object.keys(WidgetRegistry.widgets || {}).find((key) => w instanceof WidgetRegistry.widgets[key]);
            if (!type) return;
            this._collectSelectionGroupIdsFromOverridesForType(type, w.overrides).forEach((x) => set.add(x));
        });
        return set;
    },

    /**
     * Load selectionGroups from saved JSON and ensure every referenced group id has a registry entry (default off).
     * Does not mark unsaved.
     */
    _applySelectionGroupsFromData(data) {
        this.selectionGroups = {};
        const raw = data && data.selectionGroups;
        if (raw && typeof raw === 'object') {
            Object.keys(raw).forEach((k) => {
                const id = String(k).trim();
                if (!id) return;
                this.selectionGroups[id] = this._normalizeSelectionGroupEntry(raw[k]);
            });
        }
        const refIds = this.collectSelectionGroupIdsFromSerializedDashboard(data);
        refIds.forEach((id) => {
            if (!this.selectionGroups[id]) {
                this.selectionGroups[id] = { allowEmptySelection: false };
            }
        });
    },

    ensureSelectionGroupEntry(id, silent) {
        const k = String(id || '').trim();
        if (!k) return;
        if (!this.selectionGroups[k]) {
            this.selectionGroups[k] = { allowEmptySelection: false };
            if (!silent) this.markUnsaved();
        }
    },

    getSelectionGroupAllowEmpty(id) {
        const k = String(id || '').trim();
        if (!k) return false;
        const e = this.selectionGroups[k];
        return !!(e && e.allowEmptySelection === true);
    },

    setSelectionGroupAllowEmpty(id, allow) {
        const k = String(id || '').trim();
        if (!k) return;
        if (!this.selectionGroups[k]) {
            this.selectionGroups[k] = { allowEmptySelection: false };
        }
        const next = allow === true;
        if (this.selectionGroups[k].allowEmptySelection === next) return;
        this.selectionGroups[k].allowEmptySelection = next;
        this.markUnsaved();
        try {
            window.dispatchEvent(new CustomEvent('ds-selection-group-allow-empty', { detail: { id: k, allowEmpty: next } }));
        } catch (e) { /* ignore */ }
        if (typeof Editor !== 'undefined' && typeof Editor._invokeSelectionGroupAllowEmptySync === 'function') {
            Editor._invokeSelectionGroupAllowEmptySync();
        }
    },

    getSelectionGroupIdsForPicker() {
        const reg = Object.keys(this.selectionGroups || {});
        const used = this.collectSelectionGroupIdsFromLiveDashboard();
        const all = new Set([...reg, ...used]);
        return [...all].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    },

    /**
     * Merge snippet selectionGroups into the live dashboard. Snippet value wins for allowEmptySelection per id.
     */
    mergeSelectionGroupsFromSnippet(snippetGroups) {
        if (!snippetGroups || typeof snippetGroups !== 'object') return;
        Object.keys(snippetGroups).forEach((k) => {
            const id = String(k).trim();
            if (!id) return;
            const entry = snippetGroups[k];
            const allow = !!(entry && typeof entry === 'object' && entry.allowEmptySelection === true);
            this.selectionGroups[id] = { allowEmptySelection: allow };
        });
        this.markUnsaved();
    },

    cleanupInvalidGroups: function () {
        const before = this._cloneJson(this.groups || {});
        this._normalizeGroups();
        if (!this._isEqualJson(before, this.groups || {}) && typeof Editor !== 'undefined') {
            Editor.refreshDropdown(this.widgets);
        }
    },

    createWidget: function (type, id, config, bindings = {}, skipEditorUpdate = false) {
        if (type === 'textbox') type = 'list';

        const WidgetClass = WidgetRegistry.get(type);
        if (WidgetClass) {
            this.widgets[id] = new WidgetClass('dashboard-canvas', id, config, bindings);
            this.invalidateTopicIndex();

            if (!skipEditorUpdate) {
                this.loadFonts();
            }

            if (this.isEditMode && !skipEditorUpdate && this.openedGroupId && this.groups[this.openedGroupId]) {
                this._attachCreatedWidgetsToOpenedGroup([id]);
                if (Object.keys(this.groups || {}).length > 0) this._normalizeGroups();
                this._rerenderWidgetsEditorVisibility([id]);
                this.refreshAllGroupsVisibility();
            }

            if (this.isEditMode && !skipEditorUpdate) {
                Editor.refreshDropdown(this.widgets);
                this.selectWidget(id);
                this.markUnsaved();
                this._refreshEditorPageIndicator();
            }
        } else {
            console.error(`Unknown widget type: ${type}`);
        }
    },

    removeSelectedWidget: function () {
        const selectedIds = this.getEffectiveSelectionIds();
        if (selectedIds.length > 0) {
            const beforeSelection = this._captureSelectionState();
            const beforeGroups = this._cloneJson(this.groups || {});
            const beforeWidgets = selectedIds.map(id => this._serializeWidgetById(id)).filter(Boolean);
            selectedIds.forEach(id => {
                if (!this.widgets[id]) return;
                this.widgets[id].destroy();
                delete this.widgets[id];
            });
            this.cleanupInvalidGroups();
            this.selectWidget(null);
            Editor.refreshDropdown(this.widgets);
            this.loadFonts();
            this.markUnsaved();
            this._refreshEditorPageIndicator();
            this._recordHistoryEntry({
                kind: 'widgets-delete-restore',
                beforeWidgets: beforeWidgets,
                afterWidgets: [],
                beforeDeletedIds: selectedIds,
                afterDeletedIds: selectedIds,
                beforeGroups: beforeGroups,
                afterGroups: this._cloneJson(this.groups || {}),
                beforeSelection: beforeSelection,
                afterSelection: this._captureSelectionState()
            });
            this._requestResponsiveLayoutAfterStructureChange();
        }
    },

    moveSelectedWidgets: async function () {
        const selectedIds = this.getEffectiveSelectionIds();
        if (selectedIds.length === 0) return;
        const beforeSelection = this._captureSelectionState();
        const pageBeforeById = {};
        selectedIds.forEach(id => {
            if (!this.widgets[id]) return;
            pageBeforeById[id] = this.widgets[id].overrides.page;
        });

        const currentPages = String(MASTER_SETTINGS.currentPage || 1);
        const name = selectedIds.length > 1 ? `${selectedIds.length} widgets` : "the selected widget";

        const destination = await CustomDialog.prompt(`Move ${name} to page(s):\n(e.g., 2 or 1,3 or 5-8)`, currentPages, "Move Widget");
        if (!destination) return;

        const cleanDest = destination.replace(/[^0-9,\-\s]/g, '').trim();
        if (!cleanDest) {
            await CustomDialog.alert("Please enter a valid page number (e.g., 1, 2, 3)", "Invalid Input");
            return;
        }

        selectedIds.forEach(id => {
            const widget = this.widgets[id];
            if (widget) {
                widget.overrides.page = cleanDest;
                widget.render(); // This will automatically hide it if moved off the current page
            }
        });

        // The widgets are no longer on this page, so we deselect them
        this.selectWidget(null);
        if (typeof Editor !== 'undefined') {
            Editor.refreshDropdown(this.widgets);
        }
        this.markUnsaved();
        this._refreshEditorPageIndicator();
        const patchEntries = [];
        selectedIds.forEach(id => {
            if (!this.widgets[id]) return;
            const beforePage = pageBeforeById[id];
            const afterPage = this.widgets[id].overrides.page;
            if (beforePage === afterPage) return;
            patchEntries.push({
                kind: 'widget-overrides',
                id: id,
                replace: false,
                before: { page: beforePage },
                after: { page: afterPage }
            });
        });
        if (patchEntries.length > 0) {
            if (patchEntries.length === 1) {
                this._recordHistoryEntry(patchEntries[0]);
            } else {
                this._recordHistoryEntry({
                    kind: 'batch',
                    label: 'Move Widget To Page',
                    entries: patchEntries
                });
            }
        }
    },

    insertPage: async function () {
        const beforePageState = {};
        Object.values(this.widgets).forEach(w => {
            beforePageState[w.id] = {
                page: w.overrides.page,
                pageTo: w.overrides.pageTo
            };
        });
        const currentPageBefore = MASTER_SETTINGS.currentPage;
        const defaultDest = String(MASTER_SETTINGS.currentPage || 1);
        const input = await CustomDialog.prompt(`Insert a new empty page at index:\n(This will shift all widgets on this page and above +1)`, defaultDest, "Insert Page");
        if (!input) return;

        const targetPage = parseInt(input.trim());
        if (isNaN(targetPage) || targetPage <= 0) {
            await CustomDialog.alert("Please enter a valid positive page number.", "Invalid Input");
            return;
        }

        let widgetsUpdated = 0;
        Object.values(this.widgets).forEach(w => {
            let changed = false;

            if (w.overrides.actionType === 'page' && w.overrides.pageTo !== undefined) {
                const destPage = parseInt(w.overrides.pageTo);
                if (!isNaN(destPage) && destPage >= targetPage) {
                    w.overrides.pageTo = destPage + 1;
                    changed = true;
                }
            }

            if (w.overrides.page) {
                if (typeof WidgetPageSpec !== 'undefined') {
                    const next = WidgetPageSpec.shiftForInsert(w.overrides.page, targetPage);
                    if (next !== String(w.overrides.page)) {
                        w.overrides.page = next;
                        changed = true;
                    }
                } else {
                    const pages = String(w.overrides.page).split(',').map(p => p.trim());
                    let pageStrChanged = false;
                    for (let i = 0; i < pages.length; i++) {
                        const pNum = parseInt(pages[i], 10);
                        if (!isNaN(pNum) && pNum >= targetPage) {
                            pages[i] = (pNum + 1).toString();
                            pageStrChanged = true;
                            changed = true;
                        }
                    }
                    if (pageStrChanged) w.overrides.page = pages.join(', ');
                }
            }

            if (changed) {
                w.render();
                widgetsUpdated++;
            }
        });

        if (MASTER_SETTINGS.currentPage >= targetPage) {
            this.updateGlobal({ currentPage: Object.values(this.widgets).length ? MASTER_SETTINGS.currentPage + 1 : targetPage });
        }

        this.selectWidget(null);
        this.markUnsaved();
        this._refreshEditorPageIndicator();
        const patchEntries = [];
        Object.values(this.widgets).forEach(w => {
            const before = beforePageState[w.id] || {};
            const after = { page: w.overrides.page, pageTo: w.overrides.pageTo };
            const beforePatch = {};
            const afterPatch = {};
            if (before.page !== after.page) {
                beforePatch.page = before.page;
                afterPatch.page = after.page;
            }
            if (before.pageTo !== after.pageTo) {
                beforePatch.pageTo = before.pageTo;
                afterPatch.pageTo = after.pageTo;
            }
            if (Object.keys(afterPatch).length > 0) {
                patchEntries.push({
                    kind: 'widget-overrides',
                    id: w.id,
                    replace: false,
                    before: beforePatch,
                    after: afterPatch
                });
            }
        });
        if (currentPageBefore !== MASTER_SETTINGS.currentPage) {
            patchEntries.push({
                kind: 'global-settings',
                before: { currentPage: currentPageBefore },
                after: { currentPage: MASTER_SETTINGS.currentPage }
            });
        }
        if (patchEntries.length === 1) {
            this._recordHistoryEntry(patchEntries[0]);
        } else if (patchEntries.length > 1) {
            this._recordHistoryEntry({
                kind: 'batch',
                label: 'Insert Page',
                entries: patchEntries
            });
        }
        const notification = typeof parent.Homey !== 'undefined' ? '' : ` (${widgetsUpdated} widgets shifted)`;
        await CustomDialog.alert(`Page successfully inserted at index ${targetPage}.` + notification, "Page Inserted");
    },

    deletePage: async function () {
        const beforePageState = {};
        Object.values(this.widgets).forEach(w => {
            beforePageState[w.id] = {
                page: w.overrides.page,
                pageTo: w.overrides.pageTo
            };
        });
        const currentPageBefore = MASTER_SETTINGS.currentPage;
        const defaultDest = String(MASTER_SETTINGS.currentPage || 1);
        const input = await CustomDialog.prompt(`Delete empty page at index:\n(This will shift all widgets above this page -1)`, defaultDest, "Delete Page");
        if (!input) return;

        const targetPage = parseInt(input.trim());
        if (isNaN(targetPage) || targetPage <= 0) {
            await CustomDialog.alert("Please enter a valid positive page number.", "Invalid Input");
            return;
        }

        // Phase 1: Verify the page is completely empty
        const blockingWidgets = [];
        Object.values(this.widgets).forEach(w => {
            if (!w.overrides.page) return;
            let blocks = false;
            if (typeof WidgetPageSpec !== 'undefined') {
                blocks = WidgetPageSpec.coversPage(w.overrides.page, targetPage);
            } else {
                const pages = String(w.overrides.page).split(',').map(p => parseInt(p.trim(), 10));
                blocks = pages.includes(targetPage);
            }
            if (blocks) blockingWidgets.push(w.overrides.metaName || w.id);
        });

        if (blockingWidgets.length > 0) {
            await CustomDialog.alert(`Cannot delete page ${targetPage}!\n\nIt contains ${blockingWidgets.length} widget(s). Move or delete them first to prevent homeless widgets.`, "Action Blocked");
            return;
        }

        // Phase 2: Shift all widgets flowing ABOVE the deleted boundary down by 1
        let widgetsUpdated = 0;
        Object.values(this.widgets).forEach(w => {
            let changed = false;

            if (w.overrides.actionType === 'page' && w.overrides.pageTo !== undefined) {
                const destPage = parseInt(w.overrides.pageTo);
                if (!isNaN(destPage) && destPage > targetPage) {
                    w.overrides.pageTo = destPage - 1;
                    changed = true;
                } else if (!isNaN(destPage) && destPage === targetPage) {
                    w.overrides.pageTo = 1; // Safely default fallback to page 1
                    changed = true;
                }
            }

            if (w.overrides.page) {
                if (typeof WidgetPageSpec !== 'undefined') {
                    const next = WidgetPageSpec.shiftForDelete(w.overrides.page, targetPage);
                    if (next !== String(w.overrides.page)) {
                        w.overrides.page = next;
                        changed = true;
                    }
                } else {
                    const pages = String(w.overrides.page).split(',').map(p => p.trim());
                    let pageStrChanged = false;
                    for (let i = 0; i < pages.length; i++) {
                        const pNum = parseInt(pages[i], 10);
                        if (!isNaN(pNum) && pNum > targetPage) {
                            pages[i] = (pNum - 1).toString();
                            pageStrChanged = true;
                            changed = true;
                        }
                    }
                    if (pageStrChanged) w.overrides.page = pages.join(', ');
                }
            }

            if (changed) {
                w.render();
                widgetsUpdated++;
            }
        });

        if (MASTER_SETTINGS.currentPage > targetPage) {
            this.updateGlobal({ currentPage: MASTER_SETTINGS.currentPage - 1 });
        }

        this.selectWidget(null);
        this.markUnsaved();
        this._refreshEditorPageIndicator();
        const patchEntries = [];
        Object.values(this.widgets).forEach(w => {
            const before = beforePageState[w.id] || {};
            const after = { page: w.overrides.page, pageTo: w.overrides.pageTo };
            const beforePatch = {};
            const afterPatch = {};
            if (before.page !== after.page) {
                beforePatch.page = before.page;
                afterPatch.page = after.page;
            }
            if (before.pageTo !== after.pageTo) {
                beforePatch.pageTo = before.pageTo;
                afterPatch.pageTo = after.pageTo;
            }
            if (Object.keys(afterPatch).length > 0) {
                patchEntries.push({
                    kind: 'widget-overrides',
                    id: w.id,
                    replace: false,
                    before: beforePatch,
                    after: afterPatch
                });
            }
        });
        if (currentPageBefore !== MASTER_SETTINGS.currentPage) {
            patchEntries.push({
                kind: 'global-settings',
                before: { currentPage: currentPageBefore },
                after: { currentPage: MASTER_SETTINGS.currentPage }
            });
        }
        if (patchEntries.length === 1) {
            this._recordHistoryEntry(patchEntries[0]);
        } else if (patchEntries.length > 1) {
            this._recordHistoryEntry({
                kind: 'batch',
                label: 'Delete Page',
                entries: patchEntries
            });
        }
        if (widgetsUpdated > 0) {
            await CustomDialog.alert(`Page ${targetPage} deleted.\nShifted ${widgetsUpdated} widgets down by 1.`, "Page Deleted");
        }
    },

    duplicateWidget: function () {
        const sourceSelection = this.getEffectiveSelectionIds();
        if (sourceSelection.length === 0) return;
        const gridStep = Math.max(1, Number(MASTER_SETTINGS.gridSize) || 20);
        const dupOffset = gridStep * 2;
        const beforeSelection = this._captureSelectionState();
        const beforeGroups = this._cloneJson(this.groups || {});
        const newSelection = [];
        const idMap = {};
        const sourceSelectionSet = new Set(sourceSelection);

        sourceSelection.forEach(id => {
            if (!this.widgets[id]) return;
            const source = this.widgets[id];
            const type = Object.keys(WidgetRegistry.widgets).find(key => source instanceof WidgetRegistry.widgets[key]);
            if (!type) return;

            const newId = type + '_' + Date.now().toString().slice(-4) + Math.floor(Math.random() * 1000);
            const newOverrides = JSON.parse(JSON.stringify(source.overrides));
            const newBindings = JSON.parse(JSON.stringify(source.bindings));

            if (Number.isFinite(Number(newOverrides.x))) newOverrides.x = Number(newOverrides.x) + dupOffset;
            if (Number.isFinite(Number(newOverrides.y))) newOverrides.y = Number(newOverrides.y) + dupOffset;
            if (type === 'arrow') this._offsetArrowOverrides(newOverrides, dupOffset, dupOffset);

            let humanName = type;
            if (window.WidgetRegistry && window.WidgetRegistry.widgets[type] && window.WidgetRegistry.widgets[type].metadata) {
                humanName = window.WidgetRegistry.widgets[type].metadata.label || type;
            }
            newOverrides.metaName = (newOverrides.metaName || humanName) + " (Copy)";

            this.createWidget(type, newId, newOverrides, newBindings, true);
            newSelection.push(newId);
            idMap[id] = newId;
        });

        // Duplicate group memberships for every group whose *all* member widgets are part of the source selection.
        // This fixes cases where duplicating multiple groups (or a group + extra widgets) would otherwise create
        // ungrouped duplicates because group recreation only worked for a single exact-match group selection.
        const sourceGroupIdsFullyDuplicated = new Set();
        const groupsToDuplicate = Object.keys(this.groups || {}).map(groupId => this.groups[groupId]).filter(Boolean);
        groupsToDuplicate.forEach(sourceGroup => {
            const sourceGroupId = sourceGroup.id;
            const members = this.getGroupMemberIds(sourceGroupId);
            if (members.length < 2) return;
            if (!members.every(memberId => sourceSelectionSet.has(memberId))) return;
            if (!members.every(memberId => idMap[memberId])) return;

            sourceGroupIdsFullyDuplicated.add(sourceGroupId);
            const newGroupId = this._generateGroupId();
            const newMemberIds = members.map(memberId => idMap[memberId]).filter(Boolean);
            this.groups[newGroupId] = {
                id: newGroupId,
                name: this._ensureUniqueGroupName(`${sourceGroup.name} (Copy)`),
                locked: sourceGroup.locked === true,
                visible: sourceGroup.visible !== false,
                bindings: this._sanitizeGroupBindingsForStorage(
                    sourceGroup.bindings && typeof sourceGroup.bindings === 'object'
                        ? JSON.parse(JSON.stringify(sourceGroup.bindings))
                        : {}
                ),
                overridePage: this._normalizeGroupOverridePage(sourceGroup.overridePage),
                dimBackgroundWhenVisible: sourceGroup.dimBackgroundWhenVisible === true,
                widgets: newMemberIds.reduce(function (acc, id) { acc[id] = true; return acc; }, {})
            };
            const extras = this._groupExtrasForStorage(sourceGroup);
            if (extras.layout) this.groups[newGroupId].layout = extras.layout;
            if (extras.composite) this.groups[newGroupId].composite = extras.composite;
        });

        // When only some members are duplicated (e.g. one widget inside an opened group), keep copies in the same group.
        // Skip groups that were fully duplicated above (those copies already live in a new parallel group).
        Object.keys(idMap).forEach(sourceId => {
            const newId = idMap[sourceId];
            if (!newId || !this.widgets[newId]) return;
            const hostGroup = this.getGroupByWidgetId(sourceId);
            if (!hostGroup || !hostGroup.id) return;
            if (sourceGroupIdsFullyDuplicated.has(hostGroup.id)) return;
            if (!hostGroup.widgets || typeof hostGroup.widgets !== 'object') hostGroup.widgets = {};
            hostGroup.widgets[newId] = true;
        });
        if (Object.keys(this.groups || {}).length > 0) this._normalizeGroups();

        this._rerenderWidgetsEditorVisibility(newSelection);
        this.refreshAllGroupsVisibility();
        this._refreshEditorPageIndicator();

        if (this.isEditMode) {
            Editor.refreshDropdown(this.widgets);
        }
        this.selectWidget(newSelection, false, true);
        this.markUnsaved();
        const createdWidgets = newSelection.map(id => this._serializeWidgetById(id)).filter(Boolean);
        if (createdWidgets.length > 0) {
            this._recordHistoryEntry({
                kind: 'widgets-delete-restore',
                beforeWidgets: [],
                afterWidgets: createdWidgets,
                beforeDeletedIds: [],
                afterDeletedIds: newSelection,
                beforeGroups: beforeGroups,
                afterGroups: this._cloneJson(this.groups || {}),
                beforeSelection: beforeSelection,
                afterSelection: this._captureSelectionState()
            });
        }
    },

    addWidgetFromUI: function () {
        const wrap = document.getElementById('add-widget-type-wrap');
        const type = wrap ? wrap.dataset.value : null;
        if (!type) return;
        this.addWidgetByType(type);
    },

    addWidgetByType: function (type) {
        if (!type) return;
        const beforeSelection = this._captureSelectionState();
        const beforeGroups = this._cloneJson(this.groups || {});
        const id = type + '_' + Date.now().toString().slice(-4);

        let cw = this._canvasDimensionPx(MASTER_SETTINGS.canvasWidth);
        let ch = this._canvasDimensionPx(MASTER_SETTINGS.canvasHeight);

        const canvasEl = document.getElementById('dashboard-canvas');
        if (cw <= 0 && canvasEl) cw = canvasEl.offsetWidth;
        if (ch <= 0 && canvasEl) ch = canvasEl.offsetHeight;

        const ww = MASTER_SETTINGS.defaultWidth || 260;
        const wh = MASTER_SETTINGS.defaultHeight || 300;

        let nx = (cw / 2) - (ww / 2);
        let ny = (ch / 2) - (wh / 2);

        if (MASTER_SETTINGS.snapToGrid) {
            const gs = MASTER_SETTINGS.gridSize || 20;
            nx = Math.round(nx / gs) * gs;
            ny = Math.round(ny / gs) * gs;
        }

        nx = Math.max(0, nx);
        ny = Math.max(0, ny);

        let humanName = type;
        if (window.WidgetRegistry && window.WidgetRegistry.widgets[type] && window.WidgetRegistry.widgets[type].metadata) {
            humanName = window.WidgetRegistry.widgets[type].metadata.label || type;
        }

        const baseOverrides = {
            x: nx,
            y: ny,
            page: MASTER_SETTINGS.currentPage || 1,
            metaName: 'New ' + humanName
        };
        if ((MASTER_SETTINGS.layoutMode || 'fixed') === 'responsive') {
            let maxOrder = 0;
            Object.values(this.widgets).forEach(function (w) {
                const rl = (typeof BaseWidget !== 'undefined' && BaseWidget.getResponsiveLayout)
                    ? BaseWidget.getResponsiveLayout(w.overrides) : null;
                const o = rl && rl.order !== null ? parseInt(rl.order, 10) : NaN;
                if (Number.isFinite(o) && o > maxOrder) maxOrder = o;
            });
            baseOverrides.layout = {
                responsive: {
                    order: maxOrder + 1,
                    columnSpan: 1,
                    rowSpan: 1,
                    cellHeight: 0,
                    preferredColumn: 0,
                    hidden: false
                }
            };
        }

        this.createWidget(type, id, baseOverrides);
        const createdWidget = this._serializeWidgetById(id);
        if (createdWidget) {
            this._recordHistoryEntry({
                kind: 'widget-create-delete',
                widgetId: id,
                beforeWidget: null,
                afterWidget: createdWidget,
                beforeGroups: beforeGroups,
                afterGroups: this._cloneJson(this.groups || {}),
                beforeSelection: beforeSelection,
                afterSelection: this._captureSelectionState()
            });
        }
    },

    groupSelectedWidgets: async function () {
        await this.createGroupFromSelection();
    },

    ungroupSelectedWidgets: function () {
        this.ungroupSelectedGroup();
    },

    toggleOpenSelectedGroupView: function () {
        this.toggleOpenSelectedGroup();
    },

    selectWidget: function (idOrArray, multi = false, forceArray = false) {
        if (idOrArray === 'GLOBAL_SETTINGS' || !idOrArray) {
            this.selectedIds = [];
            this.selectedGroupId = null;
        } else if (forceArray && Array.isArray(idOrArray)) {
            this.selectedIds = this._sanitizeSelectionIds(idOrArray);
        } else if (multi) {
            const clickedGroup = this.openedGroupId ? null : this.getGroupByWidgetId(idOrArray);
            if (clickedGroup) {
                const groupWidgetIds = this.getGroupMemberIds(clickedGroup.id);
                const allSelected = groupWidgetIds.every(id => this.selectedIds.includes(id));
                if (allSelected) {
                    this.selectedIds = this.selectedIds.filter(id => !groupWidgetIds.includes(id));
                } else {
                    groupWidgetIds.forEach(id => {
                        if (!this.selectedIds.includes(id)) this.selectedIds.push(id);
                    });
                }
            } else {
                const idx = this.selectedIds.indexOf(idOrArray);
                if (idx > -1) this.selectedIds.splice(idx, 1);
                else this.selectedIds.push(idOrArray);
            }
        } else {
            const clickedGroup = this.openedGroupId ? null : this.getGroupByWidgetId(idOrArray);
            if (clickedGroup) {
                this.selectedIds = this.getGroupMemberIds(clickedGroup.id);
                this.selectedGroupId = clickedGroup.id;
            } else if (!this.selectedIds.includes(idOrArray) || this.selectedIds.length !== 1) {
                this.selectedIds = [idOrArray];
                this.selectedGroupId = null;
            }
        }

        this._syncSelectedGroupFromSelection();
        this._applySelectionVisualState();
        this._updateUniversalActionButtons();

        if (this.selectedIds.length === 1 && this.widgets[this.selectedIds[0]]) {
            const w = this.widgets[this.selectedIds[0]];
            const currentPage = Math.max(1, parseInt(String(MASTER_SETTINGS.currentPage || 1), 10) || 1);
            const pageStr = typeof this.resolveEffectivePageForWidgetId === 'function'
                ? this.resolveEffectivePageForWidgetId(w.id, w.overrides && w.overrides.page != null ? w.overrides.page : '1')
                : (w.overrides && w.overrides.page != null ? w.overrides.page : '1');
            if (pageStr) {
                if (typeof WidgetPageSpec !== 'undefined') {
                    if (!WidgetPageSpec.coversPage(pageStr, currentPage)) {
                        this.updateGlobal({ currentPage: WidgetPageSpec.minPage(pageStr) });
                    }
                } else {
                    const parsed = String(pageStr).split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
                    const pages = parsed.length > 0 ? parsed : [1];
                    if (!pages.includes(currentPage)) {
                        this.updateGlobal({ currentPage: pages[0] });
                    }
                }
            }
        }

        if (this.isEditMode) {
            if (this.selectedIds.length === 1) {
                if (typeof Editor !== 'undefined' && Editor.loadWidget) Editor.loadWidget(this.selectedIds[0]);
            } else if (this.selectedIds.length > 1) {
                if (typeof Editor !== 'undefined' && Editor.loadWidget) Editor.loadWidget('MULTIPLE');
            } else {
                if (typeof Editor !== 'undefined' && Editor.loadWidget) Editor.loadWidget('GLOBAL_SETTINGS');
            }
            if (typeof Editor !== 'undefined' && Editor.updateToolbarState) Editor.updateToolbarState();
        }
    },

    _hasFontPropertyChange: function (obj) {
        if (!obj || typeof obj !== 'object') return false;
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (k === 'fontFamily' || k.indexOf('Font') !== -1 || k.indexOf('Fam') !== -1) return true;
            if (typeof obj[k] === 'object' && obj[k] !== null && this._hasFontPropertyChange(obj[k])) return true;
        }
        return false;
    },

    /**
     * Apply a patch to a widget's `overrides`.
     * @param {string} id Widget id.
     * @param {Object} payload Key/value pairs to apply.
     * @param {boolean} [replace=false] If true, widget `overrides` become `payload` only (full replace).
     *   If false (default), shallow-merge `payload` into existing `overrides`. Do not confuse with
     *   `updateGlobal`'s second argument (skip editor reload).
     */
    updateWidget: function (id, payload, replace = false) {
        if (this.widgets[id]) {
            const widget = this.widgets[id];
            const trackHistory = !this.isApplyingHistory;
            const before = trackHistory
                ? (replace ? this._cloneJson(widget.overrides || {}) : this._pickObjectKeys(widget.overrides || {}, Object.keys(payload || {})))
                : null;
            widget.update(payload, replace);
            if (trackHistory) {
                const after = replace
                    ? this._cloneJson(widget.overrides || {})
                    : this._pickObjectKeys(widget.overrides || {}, Object.keys(payload || {}));
                if (!this._isEqualJson(before, after)) {
                    this._recordHistoryEntry({
                        kind: 'widget-overrides',
                        id: id,
                        replace: replace === true,
                        before: before,
                        after: after
                    });
                }
            }
            if (replace === true || this._hasFontPropertyChange(payload)) {
                this.loadFonts();
            }
            this.markUnsaved();
            this._syncAppliedPresetAfterOverridesChange(id);
        }
    },

    updateWidgetBinding: function (id, payload, replace = false) {
        if (this.widgets[id]) {
            const widget = this.widgets[id];
            const trackHistory = !this.isApplyingHistory;
            const payloadKeys = Object.keys(payload || {});
            const payloadHasNested = !replace && payloadKeys.some((k) => {
                const v = payload[k];
                return v !== null && typeof v === 'object';
            });
            const before = trackHistory
                ? (replace || payloadHasNested
                    ? this._cloneJson(widget.bindings || {})
                    : this._pickObjectKeys(widget.bindings || {}, payloadKeys))
                : null;
            widget.updateBindings(payload, replace);
            if (trackHistory) {
                const after = replace || payloadHasNested
                    ? this._cloneJson(widget.bindings || {})
                    : this._pickObjectKeys(widget.bindings || {}, payloadKeys);
                if (!this._isEqualJson(before, after)) {
                    this._recordHistoryEntry({
                        kind: 'widget-bindings',
                        id: id,
                        replace: replace === true,
                        before: before,
                        after: after
                    });
                }
            }
            this.markUnsaved();
        }
    },

    resolveThemeColorValue: function (val) {
        if (typeof MasterLayout === 'undefined' || !MasterLayout.parseThemeTokenReference) return val;
        const token = MasterLayout.parseThemeTokenReference(val);
        if (!token) return val;
        const tc = MASTER_SETTINGS.themeColors;
        if (tc && typeof tc === 'object' && tc[token] !== undefined && tc[token] !== null) {
            return tc[token];
        }
        return val;
    },

    resolveColor: function (key, alphaMultiplier = 1) {
        let val = MASTER_SETTINGS[key];
        val = this.resolveThemeColorValue(val);

        if (typeof val === 'object' && val !== null) {
            const parsed = ColorUtils.parse(val);
            if (parsed) val = ColorUtils.toCss(parsed);
        }

        if (MASTER_SETTINGS[key + '_correct_en'] === true) {
            const corrections = {
                hue: MASTER_SETTINGS[key + '_correct_hue'] || 0,
                sat: MASTER_SETTINGS[key + '_correct_sat'] !== undefined ? MASTER_SETTINGS[key + '_correct_sat'] : 100,
                bri: MASTER_SETTINGS[key + '_correct_bri'] !== undefined ? MASTER_SETTINGS[key + '_correct_bri'] : 100,
                hue_fixed: MASTER_SETTINGS[key + '_correct_hue_fixed'] === true,
                sat_fixed: MASTER_SETTINGS[key + '_correct_sat_fixed'] === true,
                bri_fixed: MASTER_SETTINGS[key + '_correct_bri_fixed'] === true
            };
            val = ColorUtils.adjust(val, corrections);
        }

        return this.hexToRgba(val, alphaMultiplier);
    },

    _isDataDriverPlatformSwitch: function (keys, isSystem) {
        return !isSystem && keys.length === 1 && keys[0] === 'dataDriver';
    },

    /** Auto editor chrome follows Color 1. Forced Light and Dark ignore this. */
    _syncEditorChromeTheme: function (keys) {
        if (typeof ThemeManager === 'undefined' || typeof ThemeManager.syncFromDashboard !== 'function') return;
        if (!keys || !keys.length) return;
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (k === 'theme' || k === 'themeColors' || (typeof k === 'string' && k.indexOf('canvasBg') === 0)) {
                ThemeManager.syncFromDashboard();
                return;
            }
        }
    },

    /**
     * First switch onto Responsive Columns adopts the factory defaults when the
     * dashboard still has the previous stock numbers (4 columns, 250px floors, 1180 width).
     * A value the user already changed is left alone.
     */
    _fillResponsiveStockDefaults: function (payload) {
        const defs = (typeof MASTER_CODE_DEFAULTS === 'object' && MASTER_CODE_DEFAULTS) ? MASTER_CODE_DEFAULTS : {};
        if (payload.layoutResponsiveColumnCount === undefined && Number(MASTER_SETTINGS.layoutResponsiveColumnCount) === 4) {
            payload.layoutResponsiveColumnCount = defs.layoutResponsiveColumnCount != null ? defs.layoutResponsiveColumnCount : 6;
        }
        if (payload.layoutResponsiveMinSize === undefined && Number(MASTER_SETTINGS.layoutResponsiveMinSize) === 250) {
            payload.layoutResponsiveMinSize = defs.layoutResponsiveMinSize != null ? defs.layoutResponsiveMinSize : 150;
        }
        if (payload.layoutResponsiveMinWidgetHeight === undefined && Number(MASTER_SETTINGS.layoutResponsiveMinWidgetHeight) === 250) {
            payload.layoutResponsiveMinWidgetHeight = defs.layoutResponsiveMinWidgetHeight != null ? defs.layoutResponsiveMinWidgetHeight : 120;
        }
        if (payload.canvasWidth === undefined && Number(MASTER_SETTINGS.canvasWidth) === 1180) {
            payload.canvasWidth = 1920;
        }
    },

    /**
     * CSS color a master key paints as, after theme-token resolution and that
     * key's color correction. Null when the value is not a color.
     */
    _resolvedGlobalColorCss: function (key, value, useCorrections) {
        if (value === undefined || value === null || value === '') return null;
        let val = value;
        if (typeof this.resolveThemeColorValue === 'function') {
            val = this.resolveThemeColorValue(val);
        }
        if (typeof ColorUtils === 'undefined' || !ColorUtils.parse || !ColorUtils.toCss) return null;
        let css = null;
        if (typeof val === 'object') {
            const parsed = ColorUtils.parse(val);
            if (!parsed) return null;
            css = ColorUtils.toCss(parsed);
        } else if (typeof val === 'string') {
            const parsed = ColorUtils.parse(val);
            if (parsed) css = ColorUtils.toCss(parsed);
            else if (val.charAt(0) === '@') css = val;
            else return null;
        } else {
            return null;
        }
        if (useCorrections && typeof MASTER_SETTINGS !== 'undefined'
            && MASTER_SETTINGS[key + '_correct_en'] === true && ColorUtils.adjust) {
            css = ColorUtils.adjust(css, {
                hue: MASTER_SETTINGS[key + '_correct_hue'] || 0,
                sat: MASTER_SETTINGS[key + '_correct_sat'] !== undefined ? MASTER_SETTINGS[key + '_correct_sat'] : 100,
                bri: MASTER_SETTINGS[key + '_correct_bri'] !== undefined ? MASTER_SETTINGS[key + '_correct_bri'] : 100,
                hue_fixed: MASTER_SETTINGS[key + '_correct_hue_fixed'] === true,
                sat_fixed: MASTER_SETTINGS[key + '_correct_sat_fixed'] === true,
                bri_fixed: MASTER_SETTINGS[key + '_correct_bri_fixed'] === true
            });
        }
        return css == null ? null : String(css);
    },

    _themeColorsPaintSame: function (current, incoming) {
        if (!current || !incoming || typeof current !== 'object' || typeof incoming !== 'object') return false;
        const aKeys = Object.keys(incoming);
        const bKeys = Object.keys(current);
        if (aKeys.length !== bKeys.length) return false;
        for (let i = 0; i < aKeys.length; i++) {
            const token = aKeys[i];
            if (!Object.prototype.hasOwnProperty.call(current, token)) return false;
            if (this._isSameLivePayload(current[token], incoming[token])) continue;
            const nextCss = this._resolvedGlobalColorCss(token, incoming[token], false);
            const curCss = this._resolvedGlobalColorCss(token, current[token], false);
            if (nextCss == null || curCss == null || nextCss !== curCss) return false;
        }
        return true;
    },

    /**
     * Live global bindings often resend a light-state object whose brightness
     * changed while color correction pins the painted result. Those keys must
     * not bump the config epoch or repaint every widget.
     */
    _stripUnchangedGlobalPatch: function (payload) {
        if (!payload || typeof MASTER_SETTINGS === 'undefined') return payload;
        const keys = Object.keys(payload);
        const next = {};
        let kept = 0;
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            const incoming = payload[k];
            const current = MASTER_SETTINGS[k];
            if (k === 'themeColors' && incoming && typeof incoming === 'object' && current && typeof current === 'object') {
                if (this._isSameLivePayload(current, incoming) || this._themeColorsPaintSame(current, incoming)) continue;
                next[k] = incoming;
                kept++;
                continue;
            }
            if (this._isSameLivePayload(current, incoming)) continue;
            const nextCss = this._resolvedGlobalColorCss(k, incoming, true);
            if (nextCss != null) {
                const curCss = this._resolvedGlobalColorCss(k, current, true);
                if (curCss != null && curCss === nextCss) continue;
            }
            next[k] = incoming;
            kept++;
        }
        return kept ? next : null;
    },

    updateGlobal: function (payload, skipEditorReload = false, isSystem = false) {
        if (isSystem && payload) {
            payload = this._stripUnchangedGlobalPatch(payload);
            if (!payload) return;
        }
        if (!isSystem && payload && payload.layoutMode === 'responsive' && MASTER_SETTINGS.layoutMode !== 'responsive') {
            this._fillResponsiveStockDefaults(payload);
        }
        const keys = Object.keys(payload || {});
        const isPlatformSwitch = this._isDataDriverPlatformSwitch(keys, isSystem);
        const trackHistory = !this.isApplyingHistory && !isSystem && keys.length > 0;
        const before = trackHistory ? this._pickObjectKeys(MASTER_SETTINGS, keys) : null;
        const prevPreloadImages = MASTER_SETTINGS.preloadImagesOnAllPages;
        const prevCurrentPage = MASTER_SETTINGS.currentPage;
        let hasUnset = false;
        for (let i = 0; i < keys.length; i++) {
            if (payload[keys[i]] === undefined) {
                hasUnset = true;
                break;
            }
        }
        if (hasUnset) {
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                if (payload[k] === undefined) delete MASTER_SETTINGS[k];
                else MASTER_SETTINGS[k] = payload[k];
            }
        } else {
            Object.assign(MASTER_SETTINGS, payload);
        }
        // Theme corrections (hue and brightness) are editor-only and never saved.
        // Any themeColors write that did not come from those sliders parks both
        // back at center (manual edits, theme loads, dashboard loads), so the
        // next drag re-baselines cleanly.
        if (keys.indexOf('themeColors') !== -1 && !this._applyingThemeHueShift) {
            this.resetThemeHueShift();
        }
        this._syncEditorChromeTheme(keys);
        if (typeof EditorTooltip !== 'undefined' && typeof EditorTooltip.syncState === 'function') {
            EditorTooltip.syncState();
        }
        // Render-input generation for widget-level rebuild-skip signatures.
        this._globalConfigEpoch = (this._globalConfigEpoch || 0) + 1;

        // Master payload formulas feed widget topic-interest sets; drop caches when they change.
        if (keys.some((k) => k.indexOf('_bind_formula') !== -1)) {
            Object.values(this.widgets || {}).forEach((w) => {
                if (w) w._staticTopicInterests = null;
            });
            this.invalidateTopicIndex();
        }

        if (keys.includes('editorMode') && typeof Editor !== 'undefined'
            && typeof Editor.applyUiModeChrome === 'function') {
            Editor.applyUiModeChrome();
        }

        if (keys.includes('audioTopicMap') && typeof DashboardAudio !== 'undefined'
            && typeof DashboardAudio.rebuildTopicIndex === 'function') {
            DashboardAudio.rebuildTopicIndex();
        }

        if (keys.includes('inactivityPageEnabled') || keys.includes('inactivityReturnPage') || keys.includes('inactivityTimeoutSeconds')) {
            this._syncInactivityPageWatch();
        this._syncGestureControls();
        }

        if (keys.some(function (k) { return k.indexOf('swipe') === 0 || k === 'gestureTouchOnly'; })) {
            this._syncGestureControls();
        }

        if (keys.includes('theme') && payload.theme) {
            this._syncThemeDropdownAndInspector(payload.theme);
            if (!isSystem && !this._isApplyingTheme) {
                this._isApplyingTheme = true;
                try {
                    if (typeof payload.theme === 'string' && payload.theme.indexOf('user:') === 0) {
                        void this.loadUserTemplate(payload.theme.slice(5));
                    } else {
                        this.loadTemplate(payload.theme);
                    }
                } finally {
                    this._isApplyingTheme = false;
                }
            }
        }

        const preloadTurnedOn = keys.includes('preloadImagesOnAllPages')
            && MASTER_SETTINGS.preloadImagesOnAllPages === true
            && prevPreloadImages !== true
            && !isSystem;
        if (preloadTurnedOn) {
            void this._runDashboardImagePreload(this._collectDashboardImageUrlsFromWidgets());
        }

        const isOnlyPageChange = keys.length === 1 && keys[0] === 'currentPage';
        const hasCurrentPageChange = keys.includes('currentPage');

        if (trackHistory && !isOnlyPageChange) {
            const after = this._pickObjectKeys(MASTER_SETTINGS, keys);
            if (!this._isEqualJson(before, after)) {
                this._recordHistoryEntry({
                    kind: 'global-settings',
                    before: before,
                    after: after
                });
            }
        }

        if (!isSystem && !isOnlyPageChange) {
            this.markUnsaved();
        }
        if (hasCurrentPageChange) {
            const pageChanged = String(prevCurrentPage) !== String(MASTER_SETTINGS.currentPage);
            if (pageChanged && typeof DashboardDialog !== 'undefined' && DashboardDialog.dismiss) {
                DashboardDialog.dismiss();
            }
            if (
                pageChanged
                && this.isEditMode
                && this.openedGroupId
                && !this.isApplyingHistory
                && !isSystem
            ) {
                this._closeOpenedGroupForPageChange();
            }
            this._refreshEditorPageIndicator();

            if (pageChanged) {
                const widgetIds = Object.keys(this.widgets || {});
                let selectedWidgetKept = false;
                for (let i = 0; i < widgetIds.length; i++) {
                    const wid = widgetIds[i];
                    const w = this.widgets[wid];
                    if (!w || !w.elements || !w.elements.wrapper) continue;
                    const onTarget = (typeof this._widgetCoversActivePage === 'function')
                        ? this._widgetCoversActivePage(wid, w)
                        : true;
                    const isPageDependent = (typeof w.hasPageDependentState === 'function')
                        ? w.hasPageDependentState()
                        : false;

                    if (!onTarget) {
                        if (w.elements.wrapper.style.display !== 'none') {
                            w.elements.wrapper.style.display = 'none';
                            if (typeof w._syncEditLabelDisplay === 'function') w._syncEditLabelDisplay();
                        }
                        if (typeof w.pauseForBackground === 'function') w.pauseForBackground();
                        if (isPageDependent) {
                            w._hiddenContentStale = true;
                        }
                        this._syncWidgetPageChrome(w, false);
                    } else if (!this.isEditMode && w._onPagePainted && !w._hiddenContentStale && !isPageDependent) {
                        this._showPaintedWidget(w);
                        this._syncWidgetPageChrome(w, w.elements.wrapper.style.display !== 'none');
                    } else {
                        this._markWidgetDirty(wid);
                        if (typeof w.resumeFromBackground === 'function') w.resumeFromBackground();
                    }
                    if (onTarget && typeof Editor !== 'undefined' && (Editor.currentId === wid || (Array.isArray(this.selectedIds) && this.selectedIds.indexOf(wid) !== -1))) {
                        selectedWidgetKept = true;
                    }
                }
                this._flushDirtyWidgets(true);
                this._syncCountdownHeartbeatTimer();
                this._tickCountdownWidgets();
                if (this._isResponsiveLayoutMode && this._isResponsiveLayoutMode()) {
                    this._requestResponsiveReflow();
                }

                if (this.isEditMode && typeof Editor !== 'undefined' && Editor.currentId && Editor.currentId !== 'GLOBAL_SETTINGS' && Editor.currentId !== 'MULTIPLE') {
                    if (!selectedWidgetKept) {
                        this.selectWidget(null);
                    }
                }
            }
        }

        if (!this.isEditMode && (keys.includes('currentPage') || keys.includes('currentPageOutputTopic'))) {
            this.scheduleCurrentPageOutputTopicPublish();
        }

        if (keys.includes('currentPage')) {
            this._notifyPageChanged(MASTER_SETTINGS.currentPage);
        }

        // Driver lifecycle for user-initiated changes (editor). Dashboard-load paths
        // pass isSystem=true and are handled centrally by loadDashboardData →
        // ensureDataDriver, which avoids redundant re-inits and stale-old-driver work.
        // Platform switches defer ensureDataDriver to the end (same order as loadDashboardData)
        // so connect is not competing with a full widget flush + inspector rebuild.
        if (!isSystem && !isPlatformSwitch) {
            if (payload.dataDriver) {
                this.ensureDataDriver();
            }
            else if (payload.driverSettings) {
                const currentDriver = DataDriverRegistry.get();
                if (currentDriver && typeof currentDriver.updateSettings === 'function') {
                    currentDriver.updateSettings(payload.driverSettings);
                }
            }
        }

        const canvas = document.getElementById('dashboard-canvas');
        let bgStyle = "";

        const op1 = MASTER_SETTINGS.canvasBgOpacity !== undefined ? MASTER_SETTINGS.canvasBgOpacity : 100;
        const op2 = MASTER_SETTINGS.canvasBgEndOpacity !== undefined ? MASTER_SETTINGS.canvasBgEndOpacity : 100;

        const c1 = this.resolveColor('canvasBg', op1 / 100);
        const c2 = this.resolveColor('canvasBgEnd', op2 / 100);

        const type = MASTER_SETTINGS.canvasBgType || 'flat';
        const angle = MASTER_SETTINGS.canvasBgAngle !== undefined ? MASTER_SETTINGS.canvasBgAngle : 135;

        let targetBgColor = c1;

        if (type !== 'flat') {
            if (type === 'linear') {
                bgStyle = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
            } else if (type === 'linear_mirror') {
                bgStyle = `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 50%, ${c1} 100%)`;
            } else if (type === 'radial') {
                bgStyle = `radial-gradient(circle at center, ${c1}, ${c2})`;
            }
        }

        let targetBgImage = bgStyle;
        let targetBgSize = 'auto';
        let targetBgRepeat = 'repeat';

        if (MASTER_SETTINGS.canvasImage) {
            const img = `url(${MASTER_SETTINGS.canvasImage})`;
            if (bgStyle) {
                if (MASTER_SETTINGS.canvasBgOverlay) {
                    targetBgImage = `${bgStyle}, ${img}`;
                } else {
                    targetBgImage = `${img}, ${bgStyle}`;
                }
            } else {
                targetBgImage = img;
            }

            const size = MASTER_SETTINGS.canvasBgSize || 'cover';
            if (size === 'tile') {
                targetBgSize = 'auto';
                targetBgRepeat = 'repeat';
            } else {
                targetBgSize = size;
                targetBgRepeat = 'no-repeat';
            }
        }

        const canvasW = this._canvasDimensionPx(MASTER_SETTINGS.canvasWidth);
        const canvasH = this._canvasDimensionPx(MASTER_SETTINGS.canvasHeight);
        const activeLayoutMode = MASTER_SETTINGS.layoutMode || 'fixed';
        let targetWidth = (canvasW > 0) ? (canvasW + 'px') : '100%';
        let targetHeight = (canvasH > 0) ? (canvasH + 'px') : '100%';
        if (activeLayoutMode === 'responsive') {
            // Width is owned by _applyResponsiveMode as a max-width cap (upper bound
            // only, no minimum) so the canvas shrinks fluidly and never exceeds the
            // configured width. Height is ignored in responsive mode (treated as 0 /
            // unlimited) so the grid grows with its content and the canvas background
            // covers the full scrollable area.
            targetWidth = '100%';
            targetHeight = 'auto';
        }

        if (this._domCache.bgColor !== targetBgColor) { canvas.style.backgroundColor = targetBgColor; this._domCache.bgColor = targetBgColor; }
        if (this._domCache.bgImage !== targetBgImage) { canvas.style.backgroundImage = targetBgImage; this._domCache.bgImage = targetBgImage; }
        if (this._domCache.bgSize !== targetBgSize) { canvas.style.backgroundSize = targetBgSize; this._domCache.bgSize = targetBgSize; }
        if (this._domCache.bgRepeat !== targetBgRepeat) { canvas.style.backgroundRepeat = targetBgRepeat; this._domCache.bgRepeat = targetBgRepeat; }

        if (payload.canvasWidth !== undefined || payload.canvasHeight !== undefined || this._domCache.width !== targetWidth || this._domCache.height !== targetHeight) {
            canvas.style.width = targetWidth;
            this._domCache.width = targetWidth;
            canvas.style.height = targetHeight;
            this._domCache.height = targetHeight;
            this._syncAllWidgetsCanvasClipping();
        }

        this._syncCanvasStageAutoClasses();
        if (this._hasLayoutAffectingKey(keys)) {
            this._applyLayoutMode();
        } else if (activeLayoutMode === 'responsive') {
            this._paintResponsiveViewportBackground();
        }

        const hideScroll = !!MASTER_SETTINGS.hideScrollbars;
        if (this._domCache.hideScroll !== hideScroll) {
            document.body.style.overflow = hideScroll ? 'hidden' : '';
            document.documentElement.style.overflow = hideScroll ? 'hidden' : '';
            const wrapper = document.getElementById('dashboard-wrapper');
            if (wrapper) {
                wrapper.style.overflow = hideScroll ? 'hidden' : '';
            }
            this._domCache.hideScroll = hideScroll;
        }

        this.updateCanvasGrid();
        this._syncEditModeDashboardLane();

        if (!isPlatformSwitch) {
            const dirtyPlan = this._globalDirtyPlan(keys);
            if (dirtyPlan.loadFonts) this.loadFonts();
            this._syncGroupBackdropOverlays();
            if (dirtyPlan.mode === 'all') {
                this._markAllWidgetsDirty();
                const hasWidgets = Object.keys(this.widgets || {}).length > 0;
                if (dirtyPlan.visual && hasWidgets) this._scheduleVisualChromeFlush();
                else this._scheduleDirtyWidgetFlush();
            } else if (dirtyPlan.mode === 'types') {
                this._markWidgetsDirtyByTypes(dirtyPlan.types);
                this._scheduleDirtyWidgetFlush();
            }
        }

        if (isPlatformSwitch) {
            this.ensureDataDriver();
            this.updateStorageUI();
            if (typeof window.syncHomeyGalleryButton === 'function') window.syncHomeyGalleryButton();
        }

        if (typeof Editor !== 'undefined' && !isOnlyPageChange) {
            // The platform list saves with skipEditorReload so the open dropdown is not
            // destroyed mid-change. The settings sections still have to rebuild: Homey
            // App Settings and Data Stream Explorer are composed from the active driver.
            if (isPlatformSwitch && Editor.currentId === 'GLOBAL_SETTINGS') {
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        if (typeof Editor !== 'undefined' && Editor.currentId === 'GLOBAL_SETTINGS') {
                            Editor.loadWidget('GLOBAL_SETTINGS');
                        }
                    });
                });
            } else if (!skipEditorReload && Editor.currentId === 'GLOBAL_SETTINGS') {
                Editor.loadWidget('GLOBAL_SETTINGS');
            } else if (!skipEditorReload && Editor.currentId && Editor.currentId !== 'MULTIPLE' && this.widgets[Editor.currentId]) {
                if (typeof Editor.refreshVisibleColorPickers === 'function') {
                    Editor.refreshVisibleColorPickers();
                }
                Editor.notifyExternalWidgetChange(Editor.currentId, true);
            }
        }
    },

    updateGlobalBinding: function (payload, replace = false) {
        const keys = Object.keys(payload || {});
        const trackHistory = !this.isApplyingHistory && keys.length > 0;
        const before = trackHistory
            ? (replace ? this._cloneJson(this.globalBindings || {}) : this._pickObjectKeys(this.globalBindings || {}, keys))
            : null;
        if (replace) {
            this.globalBindings = payload;
        } else {
            this.globalBindings = { ...this.globalBindings, ...payload };
        }

        if (trackHistory) {
            const after = replace
                ? this._cloneJson(this.globalBindings || {})
                : this._pickObjectKeys(this.globalBindings || {}, keys);
            if (!this._isEqualJson(before, after)) {
                this._recordHistoryEntry({
                    kind: 'global-bindings',
                    replace: replace === true,
                    before: before,
                    after: after
                });
            }
        }

        this.markUnsaved();

        let mergedPatch = null;
        Object.keys(payload).forEach(key => {
            if (key === 'editorZoom') return;
            const rawTopic = payload[key];
            const topic = String(rawTopic || '').trim();
            let liveVal = this.liveData[rawTopic];
            if (liveVal === undefined && topic) liveVal = this.liveData[topic];
            if (liveVal !== undefined) {
                mergedPatch = this._mergeGlobalBindingPatch(mergedPatch, key, liveVal);
            }
        });
        if (mergedPatch && Object.keys(mergedPatch).length > 0) {
            this.updateGlobal(mergedPatch, true, true);
        }
    },

    updateCanvasGrid: function () {
        const c = document.getElementById('dashboard-canvas');
        if (!c) return;
        const show = !!MASTER_SETTINGS.showGrid;
        const size = MASTER_SETTINGS.gridSize || 20;

        if (this._domCache.gridSize !== size) {
            this._domCache.gridSize = size;
            document.documentElement.style.setProperty('--grid-dot-size', size + 'px');
            c.style.setProperty('--grid-size', size + 'px');
            let s = document.getElementById('grid-style');
            if (!s) {
                s = document.createElement('style');
                s.id = 'grid-style';
                document.head.appendChild(s);
            }
            s.innerHTML = '#dashboard-canvas::after { background-size: ' + size + 'px ' + size + 'px; }';
        }

        if (this._domCache.gridShow !== show) {
            this._domCache.gridShow = show;
            if (show) {
                c.classList.add('show-grid');
            } else {
                c.classList.remove('show-grid');
            }
        }
    },

    _captureNativeVisualMaster: function () {
        if (typeof MasterLayout === 'undefined' || typeof MasterLayout.pickVisualMasterForThemeApply !== 'function') {
            this._nativeVisualMasterJson = '';
            return;
        }
        this._nativeVisualMasterJson = JSON.stringify(MasterLayout.pickVisualMasterForThemeApply(MASTER_SETTINGS));
    },

    _themeApplyPayload: function (settings, options) {
        if (!settings || typeof settings !== 'object') return settings;
        options = options || {};
        let flat = settings;
        if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.convertMasterToV2 === 'function'
                && typeof SaveFormatV2.expandV2MasterToRuntime === 'function') {
            const nested = SaveFormatV2.isV2Master(settings)
                ? settings
                : SaveFormatV2.convertMasterToV2(settings);
            flat = SaveFormatV2.expandV2MasterToRuntime(nested, { sparseThemeColors: true });
        } else if (settings.connection || settings.environment || settings.typography || settings.container || settings.widgetDefaults) {
            if (typeof MasterLayout !== 'undefined' && typeof MasterLayout.expandMasterToFlat === 'function') {
                flat = MasterLayout.expandMasterToFlat(settings);
            }
        }
        const resetLook = options.resetLook === true;
        const storedFlat = this._cloneJson(flat) || {};
        if (flat.themeColors && typeof flat.themeColors === 'object') {
            const colorBase = resetLook
                ? ((typeof MasterLayout !== 'undefined' && typeof MasterLayout.defaultThemeColors === 'function')
                    ? MasterLayout.defaultThemeColors()
                    : {})
                : this._cloneJson((MASTER_SETTINGS && MASTER_SETTINGS.themeColors) || {});
            flat.themeColors = Object.assign({}, colorBase || {}, flat.themeColors);
        }
        const payload = (resetLook && this._nativeVisualMasterJson)
            ? Object.assign(JSON.parse(this._nativeVisualMasterJson), flat)
            : Object.assign({}, flat);
        delete payload.resetLookOnThemeApply;
        if (typeof MasterLayout !== 'undefined'
            && typeof MasterLayout.omitThemeApplyKeepCurrentKeys === 'function') {
            MasterLayout.omitThemeApplyKeepCurrentKeys(payload, storedFlat);
        } else {
            delete payload.defaultTextAlign;
        }
        if (resetLook && this._nativeVisualMasterJson
            && typeof MasterLayout !== 'undefined'
            && typeof MasterLayout.markThemeApplyLeftoverUnsets === 'function') {
            MasterLayout.markThemeApplyLeftoverUnsets(payload, MASTER_SETTINGS);
        }
        return payload;
    },

    /**
     * Theme corrections (editor-only, never saved).
     * _themeHueShift is degrees (-180..180, 0 keeps hue).
     * _themeContrastShift and _themeBrightnessShift are percent (0..200, 100 keeps the palette).
     * _themeCorrectionBase is the unclipped palette all three sliders derive from,
     * so a color clipped at the high end comes back when a slider returns to center.
     * _themeCorrectionGestureBefore is the on-screen palette at the start of
     * the current drag, used as the undo "before" when the slider is released.
     */
    _themeHueShift: 0,
    _themeSaturationShift: 100,
    _themeContrastShift: 100,
    _themeBrightnessShift: 100,
    _themeCorrectionBase: null,
    _themeCorrectionGestureBefore: null,
    _applyingThemeHueShift: false,
    _themeHueShiftInput: null,
    _themeHueShiftReadout: null,
    _themeSaturationInput: null,
    _themeSaturationReadout: null,
    _themeBrightnessInput: null,
    _themeBrightnessReadout: null,
    _themeContrastInput: null,
    _themeContrastReadout: null,
    _themeHueShiftReset: null,

    /**
     * Shared range-slider paint used by Edit Mode Zoom and Theme Corrections.
     * Fill and thumb always derive from the element's own min/max/value,
     * so the track can never disagree with the thumb position.
     */
    _paintRangeSliderFill: function (input, min, max) {
        if (!input || !input.style) return;
        const lo = Number(min !== undefined ? min : input.min);
        const hi = Number(max !== undefined ? max : input.max);
        const v = Number(input.value);
        let pct = 50;
        if (isFinite(lo) && isFinite(hi) && hi > lo && isFinite(v)) {
            pct = ((v - lo) / (hi - lo)) * 100;
        }
        const fillText = (isFinite(pct) ? pct.toFixed(2) : '50') + '%';
        if (input.style.getPropertyValue('--editor-zoom-fill') !== fillText) {
            input.style.setProperty('--editor-zoom-fill', fillText);
        }
    },

    _themeHueShiftNodes: function () {
        let input = null;
        let readout = null;
        let saturationInput = null;
        let saturationReadout = null;
        let brightnessInput = null;
        let brightnessReadout = null;
        let contrastInput = null;
        let contrastReadout = null;
        let resetBtn = null;
        const storedInput = this._themeHueShiftInput;
        const storedReadout = this._themeHueShiftReadout;
        const storedSaturation = this._themeSaturationInput;
        const storedSaturationReadout = this._themeSaturationReadout;
        const storedBrightness = this._themeBrightnessInput;
        const storedBrightnessReadout = this._themeBrightnessReadout;
        const storedContrast = this._themeContrastInput;
        const storedContrastReadout = this._themeContrastReadout;
        const storedReset = this._themeHueShiftReset;
        if (storedInput && storedInput.isConnected) input = storedInput;
        if (storedReadout && storedReadout.isConnected) readout = storedReadout;
        if (storedSaturation && storedSaturation.isConnected) saturationInput = storedSaturation;
        if (storedSaturationReadout && storedSaturationReadout.isConnected) saturationReadout = storedSaturationReadout;
        if (storedBrightness && storedBrightness.isConnected) brightnessInput = storedBrightness;
        if (storedBrightnessReadout && storedBrightnessReadout.isConnected) brightnessReadout = storedBrightnessReadout;
        if (storedContrast && storedContrast.isConnected) contrastInput = storedContrast;
        if (storedContrastReadout && storedContrastReadout.isConnected) contrastReadout = storedContrastReadout;
        if (storedReset && storedReset.isConnected) resetBtn = storedReset;
        if (typeof document !== 'undefined') {
            if (!input) input = document.getElementById('theme-hue-shift-slider');
            if (!readout) readout = document.getElementById('theme-hue-shift-readout');
            if (!saturationInput) saturationInput = document.getElementById('theme-saturation-shift-slider');
            if (!saturationReadout) saturationReadout = document.getElementById('theme-saturation-shift-readout');
            if (!brightnessInput) brightnessInput = document.getElementById('theme-brightness-shift-slider');
            if (!brightnessReadout) brightnessReadout = document.getElementById('theme-brightness-shift-readout');
            if (!contrastInput) contrastInput = document.getElementById('theme-contrast-shift-slider');
            if (!contrastReadout) contrastReadout = document.getElementById('theme-contrast-shift-readout');
            if (!resetBtn) resetBtn = document.getElementById('theme-hue-shift-reset');
        }
        // The inspector builds these controls, syncs them, then inserts them.
        // Until that insert, the nodes are detached, so a document lookup misses
        // them and a range would keep the browser default (right of center).
        if (!input && storedInput) input = storedInput;
        if (!readout && storedReadout) readout = storedReadout;
        if (!saturationInput && storedSaturation) saturationInput = storedSaturation;
        if (!saturationReadout && storedSaturationReadout) saturationReadout = storedSaturationReadout;
        if (!brightnessInput && storedBrightness) brightnessInput = storedBrightness;
        if (!brightnessReadout && storedBrightnessReadout) brightnessReadout = storedBrightnessReadout;
        if (!contrastInput && storedContrast) contrastInput = storedContrast;
        if (!contrastReadout && storedContrastReadout) contrastReadout = storedContrastReadout;
        if (!resetBtn && storedReset) resetBtn = storedReset;
        return {
            input: input,
            readout: readout,
            saturationInput: saturationInput,
            saturationReadout: saturationReadout,
            brightnessInput: brightnessInput,
            brightnessReadout: brightnessReadout,
            contrastInput: contrastInput,
            contrastReadout: contrastReadout,
            resetBtn: resetBtn
        };
    },

    resetThemeHueShift: function () {
        this._themeHueShift = 0;
        this._themeSaturationShift = 100;
        this._themeContrastShift = 100;
        this._themeBrightnessShift = 100;
        this._themeCorrectionBase = null;
        this._themeCorrectionGestureBefore = null;
        this._syncThemeHueShiftControl();
    },

    _normalizeThemeHueShift: function (raw) {
        const n = Math.round(Number(raw));
        if (!isFinite(n)) return 0;
        if (n < -180) return -180;
        if (n > 180) return 180;
        return n;
    },

    _themeHueShiftLabel: function (deg) {
        const shift = this._normalizeThemeHueShift(deg);
        if (shift > 0) return '+' + shift + '°';
        return shift + '°';
    },

    _normalizeThemeBrightness: function (raw) {
        const n = Math.round(Number(raw));
        if (!isFinite(n)) return 100;
        if (n < 0) return 0;
        if (n > 200) return 200;
        return n;
    },

    _themeBrightnessLabel: function (pct) {
        return this._normalizeThemeBrightness(pct) + '%';
    },

    _themeCorrectionsAtCenter: function (hueDeg, satPct, brightnessPct, contrastPct) {
        return this._normalizeThemeHueShift(hueDeg) === 0
            && this._normalizeThemeBrightness(satPct) === 100
            && this._normalizeThemeBrightness(brightnessPct) === 100
            && this._normalizeThemeBrightness(contrastPct) === 100;
    },

    _syncThemePercentSlider: function (input, readout, pct) {
        if (input) {
            const sliderVal = String(pct);
            if (input.value !== sliderVal) input.value = sliderVal;
            this._paintRangeSliderFill(input, 0, 200);
            const now = this._normalizeThemeBrightness(input.value);
            const valNow = String(now);
            if (input.getAttribute('aria-valuenow') !== valNow) input.setAttribute('aria-valuenow', valNow);
            const text = this._themeBrightnessLabel(now);
            if (input.getAttribute('aria-valuetext') !== text) input.setAttribute('aria-valuetext', text);
        }
        if (readout) {
            const label = this._themeBrightnessLabel(input ? input.value : pct);
            if (readout.textContent !== label) readout.textContent = label;
        }
    },

    _syncThemeHueShiftControl: function () {
        const nodes = this._themeHueShiftNodes();
        const shift = this._normalizeThemeHueShift(this._themeHueShift);
        const sat = this._normalizeThemeBrightness(this._themeSaturationShift);
        const brightness = this._normalizeThemeBrightness(this._themeBrightnessShift);
        const contrast = this._normalizeThemeBrightness(this._themeContrastShift);
        const input = nodes.input;
        if (input) {
            const sliderVal = String(shift);
            if (input.value !== sliderVal) input.value = sliderVal;
            this._paintRangeSliderFill(input, -180, 180);
            const now = this._normalizeThemeHueShift(input.value);
            const valNow = String(now);
            if (input.getAttribute('aria-valuenow') !== valNow) input.setAttribute('aria-valuenow', valNow);
            const text = this._themeHueShiftLabel(now);
            if (input.getAttribute('aria-valuetext') !== text) input.setAttribute('aria-valuetext', text);
        }
        if (nodes.readout) {
            const label = this._themeHueShiftLabel(input ? input.value : shift);
            if (nodes.readout.textContent !== label) nodes.readout.textContent = label;
        }
        this._syncThemePercentSlider(nodes.saturationInput, nodes.saturationReadout, sat);
        this._syncThemePercentSlider(nodes.brightnessInput, nodes.brightnessReadout, brightness);
        this._syncThemePercentSlider(nodes.contrastInput, nodes.contrastReadout, contrast);
        if (nodes.resetBtn) {
            const hueNow = input ? input.value : shift;
            const satNow = nodes.saturationInput ? nodes.saturationInput.value : sat;
            const briNow = nodes.brightnessInput ? nodes.brightnessInput.value : brightness;
            const contrastNow = nodes.contrastInput ? nodes.contrastInput.value : contrast;
            const atDefault = this._themeCorrectionsAtCenter(hueNow, satNow, briNow, contrastNow);
            if (nodes.resetBtn.disabled !== atDefault) nodes.resetBtn.disabled = atDefault;
        }
    },

    /** Reset button: all four sliders back to center, which restores the baseline palette. */
    resetThemeHueShiftFromButton: function () {
        const nodes = this._themeHueShiftNodes();
        const input = nodes.input;
        const saturationInput = nodes.saturationInput;
        const brightnessInput = nodes.brightnessInput;
        const contrastInput = nodes.contrastInput;
        if (input && input.value !== '0') input.value = '0';
        if (saturationInput && saturationInput.value !== '100') saturationInput.value = '100';
        if (brightnessInput && brightnessInput.value !== '100') brightnessInput.value = '100';
        if (contrastInput && contrastInput.value !== '100') contrastInput.value = '100';
        this._themeHueShift = 0;
        this._themeSaturationShift = 100;
        this._themeBrightnessShift = 100;
        this._themeContrastShift = 100;
        this.commitThemeCorrectionsFromSlider();
    },

    /**
     * Hue, then saturation, then contrast expanding from the brightness center.
     * Starts from original hex; identity returns original string so unshifted colors never drift.
     */
    _shiftHexThemeCorrection: function (value, hueDeg, satPct, brightnessPct, contrastPct) {
        const hue = hueDeg || 0;
        const sat = satPct === undefined || satPct === null ? 100 : satPct;
        const bri = brightnessPct === undefined || brightnessPct === null ? 100 : brightnessPct;
        const contrast = contrastPct === undefined || contrastPct === null ? 100 : contrastPct;
        if (typeof value !== 'string') return value;
        if (hue === 0 && sat === 100 && bri === 100 && contrast === 100) return value;
        const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(value.trim());
        if (!m) return value;
        let hex = m[1];
        if (hex.length === 3) {
            hex = hex.split('').map(function (c) { return c + c; }).join('');
        }
        let alpha = '';
        if (hex.length === 8) {
            alpha = hex.slice(6, 8);
            hex = hex.slice(0, 6);
        }
        if (typeof ColorUtils === 'undefined' || typeof ColorUtils.rgbToHsv !== 'function'
            || typeof ColorUtils.hsvToRgb !== 'function') return value;
        const hsv = ColorUtils.rgbToHsv(
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16));
        if (!hsv) return value;
        const applyHue = hue !== 0 && hsv.s > 0;
        const applySat = sat !== 100 && hsv.s > 0;
        const applyContrast = contrast !== 100;
        const applyBri = bri !== 100;
        if (!applyHue && !applySat && !applyContrast && !applyBri) return value;
        let h = hsv.h;
        if (applyHue) {
            h = (hsv.h + hue) % 360;
            if (h < 0) h += 360;
        }
        let s = hsv.s;
        if (applySat) {
            s = s * (sat / 100);
            if (s < 0) s = 0;
            else if (s > 100) s = 100;
        }
        let v = hsv.v;
        if (applyContrast || applyBri) {
            const center = 50 * (bri / 100);
            v = center + (v - 50) * (contrast / 100);
            if (v < 0) v = 0;
            else if (v > 100) v = 100;
        }
        const rgb = ColorUtils.hsvToRgb(h, s, v);
        const toHex = function (n) {
            const channel = Math.max(0, Math.min(255, Math.round(n)));
            return (channel < 16 ? '0' : '') + channel.toString(16);
        };
        return '#' + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b) + alpha;
    },

    _deriveThemeCorrectionColors: function (colors, hueDeg, satPct, brightnessPct, contrastPct) {
        const hue = this._normalizeThemeHueShift(hueDeg);
        const sat = this._normalizeThemeBrightness(satPct);
        const bri = this._normalizeThemeBrightness(brightnessPct);
        const contrast = this._normalizeThemeBrightness(contrastPct);
        if (!colors || typeof colors !== 'object') return {};
        if (hue === 0 && sat === 100 && bri === 100 && contrast === 100) return this._cloneJson(colors);
        const out = {};
        const keys = Object.keys(colors);
        for (let i = 0; i < keys.length; i++) {
            out[keys[i]] = this._shiftHexThemeCorrection(colors[keys[i]], hue, sat, bri, contrast);
        }
        return out;
    },

    _readThemeCorrectionSliders: function () {
        const nodes = this._themeHueShiftNodes();
        if (nodes.input) this._themeHueShift = this._normalizeThemeHueShift(nodes.input.value);
        if (nodes.saturationInput) this._themeSaturationShift = this._normalizeThemeBrightness(nodes.saturationInput.value);
        if (nodes.brightnessInput) this._themeBrightnessShift = this._normalizeThemeBrightness(nodes.brightnessInput.value);
        if (nodes.contrastInput) this._themeContrastShift = this._normalizeThemeBrightness(nodes.contrastInput.value);
    },

    /** Live preview while either Theme corrections slider moves (no history, no rebuild). */
    setThemeCorrectionsFromSlider: function () {
        this._readThemeCorrectionSliders();
        const current = MASTER_SETTINGS.themeColors || {};
        if (!this._themeCorrectionGestureBefore) {
            this._themeCorrectionGestureBefore = this._cloneJson(current);
        }
        if (!this._themeCorrectionBase) {
            this._themeCorrectionBase = this._cloneJson(current);
        }
        const next = this._deriveThemeCorrectionColors(
            this._themeCorrectionBase,
            this._themeHueShift,
            this._themeSaturationShift,
            this._themeBrightnessShift,
            this._themeContrastShift
        );
        this._applyingThemeHueShift = true;
        try {
            this.updateGlobal({ themeColors: next }, true, true);
        } finally {
            this._applyingThemeHueShift = false;
        }
        this._syncThemeHueShiftControl();
        if (typeof Editor !== 'undefined') {
            if (typeof MasterLayout !== 'undefined' && MasterLayout.THEME_TOKEN_DEFS) {
                const defs = MasterLayout.THEME_TOKEN_DEFS;
                for (let i = 0; i < defs.length; i++) {
                    Editor._setSnapshotValue('themeSlot_' + defs[i].key, next[defs[i].key]);
                }
            }
            if (typeof Editor.refreshVisibleColorPickers === 'function') Editor.refreshVisibleColorPickers();
        }
    },

    /** Commits the drag as one undo step and marks the dashboard unsaved. */
    commitThemeCorrectionsFromSlider: function () {
        this.setThemeCorrectionsFromSlider();
        const before = this._themeCorrectionGestureBefore;
        this._themeCorrectionGestureBefore = null;
        if (!before) return;
        const current = this._cloneJson(MASTER_SETTINGS.themeColors || {});
        if (typeof this._isEqualJson === 'function' && this._isEqualJson({ c: before }, { c: current })) return;
        this._recordHistoryEntry({ kind: 'global-settings', before: { themeColors: before }, after: { themeColors: current } });
        if (typeof this.markUnsaved === 'function') this.markUnsaved();
    },

    _applyThemeSettings: function (settings, opts) {
        if (!settings || typeof settings !== 'object') return;
        this.resetThemeHueShift();
        const isSystem = opts && opts.isSystem === true;
        this.updateGlobal(this._themeApplyPayload(settings, opts), false, isSystem);
    },

    loadTemplate: function (templateKey, opts) {
        opts = opts || {};
        const isSystem = opts.isSystem === true;
        if (typeof templateKey === 'string' && templateKey.indexOf('user:') === 0) {
            return this.loadUserTemplate(templateKey.slice(5), opts);
        }
        const presetThemes = this._getPresetThemes();
        if (!presetThemes || !presetThemes[templateKey]) return;
        const tpl = presetThemes[templateKey];
        const migrated = (typeof DashboardMigrator !== 'undefined' && typeof DashboardMigrator.migrateTheme === 'function')
            ? DashboardMigrator.migrateTheme(tpl)
            : tpl;
        const master = migrated && migrated.master ? migrated.master : tpl.master;
        MASTER_SETTINGS.theme = templateKey;
        // Full themes start from the factory visual master so a key set by the
        // previous theme cannot remain when this theme omits it. Adjustment
        // themes stay overlay-only unless Reset current look first is checked.
        const applyOpts = Object.assign({}, opts, {
            resetLook: this._builtinThemeKind(templateKey) === this.THEME_KIND_FULL || opts.resetLook === true
        });
        this._applyThemeSettings(master || tpl.settings, applyOpts);
        this._setTemplateDropdownValue(templateKey, tpl.name);
        this._syncThemeInspectorField(templateKey);
        if (!isSystem && opts.skipMarkUnsaved !== true) {
            this.markUnsaved();
        }
    },

    loadUserTemplate: async function (name, opts) {
        opts = opts || {};
        const isSystem = opts.isSystem === true;
        const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        const provider = driver && (typeof driver.getStorageProvider === 'function') ? driver.getStorageProvider() : null;
        if (!provider || typeof provider.load !== 'function') return;

        if (!isSystem) this.showLoading(name);
        try {
            const data = await provider.load('templates', name);
            if (data && (data.master || data.settings)) {
                const migrated = (typeof DashboardMigrator !== 'undefined' && typeof DashboardMigrator.migrateTheme === 'function')
                    ? DashboardMigrator.migrateTheme(data)
                    : data;
                this._getUserThemeKindCache()[name] = this._themeKindOf(migrated, false);
                MASTER_SETTINGS.theme = 'user:' + name;
                const userApplyOpts = Object.assign({}, opts, {
                    resetLook: this._themeKindOf(migrated, false) === this.THEME_KIND_FULL
                        || opts.resetLook === true
                });
                this._applyThemeSettings(migrated.master || data.settings, userApplyOpts);
                this._setTemplateDropdownValue('user:' + name, name);
                this._syncThemeInspectorField('user:' + name);
                if (!isSystem && opts.skipMarkUnsaved !== true) {
                    this.markUnsaved();
                }
            } else if (!isSystem && typeof CustomDialog !== 'undefined') {
                CustomDialog.alert('Invalid theme file format.', 'Error');
            }
        } catch (e) {
            if (!isSystem && typeof CustomDialog !== 'undefined') {
                CustomDialog.alert('Failed to load theme: ' + (e && e.message ? e.message : e), 'Error');
            }
        } finally {
            if (!isSystem) this.hideLoading();
        }
    },

    _syncThemeDropdownAndInspector: function (themeKey) {
        if (!themeKey) return;
        let displayName = themeKey;
        const presetThemes = this._getPresetThemes();
        if (typeof themeKey === 'string' && themeKey.indexOf('user:') === 0) {
            displayName = themeKey.slice(5);
        } else if (presetThemes && presetThemes[themeKey]) {
            displayName = presetThemes[themeKey].name || themeKey;
        }
        this._setTemplateDropdownValue(themeKey, displayName);
        this._syncThemeInspectorField(themeKey);
    },

    _syncThemeInspectorField: function (themeKey) {
        if (typeof Editor !== 'undefined' && Editor.currentId === 'GLOBAL_SETTINGS') {
            const isBound = Dashboard.globalBindings && Dashboard.globalBindings['theme'];
            if (isBound) return;
            if (Editor.fieldRegistry && Editor.fieldRegistry['theme']) {
                const reg = Editor.fieldRegistry['theme'];
                if (reg.inputEl && reg.inputEl.value !== themeKey) {
                    reg.inputEl.value = themeKey;
                }
            }
            if (typeof Editor._setSnapshotValue === 'function') {
                Editor._setSnapshotValue('theme', themeKey);
            }
        }
    },

    _setTemplateDropdownValue: function (key, label) {
        const wrapper = document.getElementById('template-select-wrapper');
        const labelEl = document.getElementById('template-select-label');
        if (wrapper && labelEl) {
            wrapper.dataset.value = key || '';
            labelEl.textContent = label || 'Select Theme...';
            labelEl.style.color = key ? 'var(--ui-text)' : 'var(--ui-text-muted)';
        }
    },

    _appendDsSelectDeleteButton: function (opt, onDelete) {
        if (!opt || typeof onDelete !== 'function') return;
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-tool danger ds-select-opt-delete';
        delBtn.title = 'Delete';
        delBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
        delBtn.onmousedown = function (e) { e.preventDefault(); e.stopPropagation(); };
        delBtn.onclick = function (e) {
            e.stopPropagation();
            e.preventDefault();
            void onDelete();
        };
        opt.appendChild(delBtn);
    },

    _getStepThemeKeySequence: function () {
        const self = this;
        let pool = this._templateKeySequence;
        if (!pool || !pool.length) {
            const presetThemes = this._getPresetThemes();
            pool = presetThemes ? Object.keys(presetThemes) : [];
        }
        return pool.filter(function (k) {
            return self.isFullThemeKeyCached(k);
        });
    },

    prevTemplate: function () {
        const keys = this._getStepThemeKeySequence();
        if (keys.length === 0) return;
        const wrapper = document.getElementById('template-select-wrapper');
        let idx = keys.indexOf(wrapper ? (wrapper.dataset.value || '') : '');
        let newIdx = idx - 1;
        if (newIdx < 0) newIdx = keys.length - 1;
        this.loadTemplate(keys[newIdx]);
    },

    nextTemplate: function () {
        const keys = this._getStepThemeKeySequence();
        if (keys.length === 0) return;
        const wrapper = document.getElementById('template-select-wrapper');
        let idx = keys.indexOf(wrapper ? (wrapper.dataset.value || '') : '');
        let newIdx = idx + 1;
        if (newIdx >= keys.length) newIdx = 0;
        this.loadTemplate(keys[newIdx]);
    },

    _cleanObject: function (obj) {
        if (!obj) return {};
        const cleaned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] !== null && obj[key] !== undefined) {
                cleaned[key] = obj[key];
            }
        }
        return cleaned;
    },

    /**
     * Persist instance override keys that are actually stored on the widget.
     * Presence means the user (or an identity field such as page/x/y) set the value,
     * even when it equals the factory or master default. Factory defaults are not
     * copied into overrides at construction, so equal-to-default keys are not stripped.
     */
    _overridesForPersist: function (type, id, fullOverrides) {
        if (!fullOverrides || typeof fullOverrides !== 'object') return {};
        let t = type;
        if (t === 'textbox') t = 'list';
        const WidgetClass = WidgetRegistry.get(t);
        if (!WidgetClass || this.isWidgetHidden(t)) {
            return this._cleanObject(this._cloneJson(fullOverrides));
        }
        const out = {};
        Object.keys(fullOverrides).forEach((k) => {
            const v = fullOverrides[k];
            if (v === undefined) return;
            if (k === 'editorModeOverride' && v !== 'force_advanced' && v !== 'force_basic') return;
            out[k] = v;
        });
        if (t === 'text' && out.mdTableCustomColumnWidths && typeof out.mdTableCustomColumnWidths === 'object') {
            const rawCols = Array.isArray(out.mdTableCustomColumnWidths.columns) ? out.mdTableCustomColumnWidths.columns : [];
            const textSrc = out.text || fullOverrides.text || '';
            const detectedCols = (typeof TextWidget !== 'undefined' && typeof TextWidget.getMaxMarkdownTableColumnCount === 'function')
                ? TextWidget.getMaxMarkdownTableColumnCount(textSrc)
                : 0;
            // A detected table owns the column count. Amount of Columns applies only when none is found,
            // and only after the user has stored that setting (absent means leave saved widths alone).
            const hasManualCount = Object.prototype.hasOwnProperty.call(out, 'mdTableCustomColumnCount');
            let maxCols = detectedCols;
            let trimCols = detectedCols > 0;
            if (!trimCols && hasManualCount && typeof TextWidget !== 'undefined' && typeof TextWidget._coerceNonNegativeInt === 'function') {
                maxCols = TextWidget._coerceNonNegativeInt(out.mdTableCustomColumnCount);
                trimCols = true;
            }
            if (trimCols) {
                const trimmed = [];
                for (let i = 0; i < maxCols; i++) {
                    const n = parseInt(String(rawCols[i]), 10);
                    trimmed.push(isNaN(n) || n < 0 ? 0 : n);
                }
                out.mdTableCustomColumnWidths = { columns: trimmed };
            }
        }
        if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.sanitizeOverridesForPersist === 'function') {
            return SaveFormatV2.sanitizeOverridesForPersist(out, t);
        }
        return this._cleanObject(out);
    },

    /**
     * Theme surface leaves: every master / widget-default inspector field except
     * connection, editor, audio, dialog chrome, and dashboard identity keys.
     * Keep-current apply keys (for example Background Blur) stay on the surface
     * so a blue-outline change can be stored and applied.
     */
    collectThemeSurfaceLeaves: function () {
        const skipGroups = this.THEME_SURFACE_SKIP_GROUPS || {};
        const skipTypes = this.THEME_SURFACE_SKIP_FIELD_TYPES || {};
        const skipKeys = this.THEME_SURFACE_SKIP_KEYS || {};
        const leaves = [];
        const walkFields = function (fields) {
            if (!Array.isArray(fields)) return;
            fields.forEach(function (field) {
                if (!field || skipTypes[field.type]) return;
                if (field.type === 'column_split' && Array.isArray(field.columns)) {
                    field.columns.forEach(function (col) {
                        walkFields(col && col.fields);
                    });
                    return;
                }
                if ((field.type === 'typography' || field.type === 'icon_style') && Array.isArray(field.fields)) {
                    walkFields(field.fields);
                    return;
                }
                if (!field.key || skipKeys[field.key]) return;
                if (String(field.key).indexOf('dialogBox') === 0) return;
                let flatKey = field.key;
                let token = null;
                if (String(field.key).indexOf('themeSlot_') === 0) {
                    token = String(field.key).slice('themeSlot_'.length);
                    if (!token) return;
                    flatKey = 'themeColors';
                }
                leaves.push({
                    kind: 'leaf',
                    id: token ? ('themeColors.' + token) : flatKey,
                    label: field.label || field.key,
                    path: token ? ['themeColors', token] : [flatKey],
                    field: field,
                    flatKey: flatKey,
                    token: token
                });
            });
        };
        let groups = [];
        if (typeof Editor !== 'undefined' && typeof Editor.composeDashboardGlobalMasterSchema === 'function') {
            groups = Editor.composeDashboardGlobalMasterSchema() || [];
        }
        groups.forEach(function (group) {
            if (!group || skipGroups[group.id]) return;
            walkFields(group.fields);
        });
        return leaves;
    },

    _themeSurfaceFieldValue: function (field) {
        if (!field || typeof MASTER_SETTINGS === 'undefined' || !MASTER_SETTINGS) return undefined;
        if (field.themeColorToken) {
            const tc = MASTER_SETTINGS.themeColors;
            return tc && tc[field.themeColorToken] !== undefined ? tc[field.themeColorToken] : undefined;
        }
        return MASTER_SETTINGS[field.key];
    },

    _isThemeSurfaceFieldSet: function (field) {
        if (!field) return false;
        if (typeof Editor !== 'undefined' && typeof Editor.isGlobalMasterFieldSet === 'function') {
            return Editor.isGlobalMasterFieldSet(field, MASTER_SETTINGS);
        }
        const cur = this._themeSurfaceFieldValue(field);
        if (cur === undefined) return false;
        if (Object.prototype.hasOwnProperty.call(field, 'default')) {
            return String(cur) !== String(field.default);
        }
        return true;
    },

    _copyDifferingThemeCorrectionKeys: function (bag) {
        if (!bag || typeof MASTER_SETTINGS === 'undefined' || !MASTER_SETTINGS) return;
        const snap = (typeof Editor !== 'undefined' && typeof Editor._ensureMasterDefaultsSnapshot === 'function')
            ? Editor._ensureMasterDefaultsSnapshot()
            : null;
        const differ = (typeof Editor !== 'undefined' && typeof Editor._valuesDifferForEditor === 'function')
            ? function (a, b) { return Editor._valuesDifferForEditor(a, b); }
            : function (a, b) { return a !== b; };
        Object.keys(MASTER_SETTINGS).forEach(function (key) {
            if (key.indexOf('_correct_') === -1) return;
            const cur = MASTER_SETTINGS[key];
            if (cur === undefined) return;
            const def = snap && Object.prototype.hasOwnProperty.call(snap, key) ? snap[key] : undefined;
            if (def === undefined) {
                if (key.indexOf('_correct_en') === -1 || cur !== true) return;
            } else if (!differ(cur, def)) {
                return;
            }
            bag[key] = cur;
        });
    },

    _finalizeThemeNestedMaster: function (nested) {
        if (!nested || typeof nested !== 'object') return {};
        if (nested.connection) delete nested.connection;
        if (nested.environment && nested.environment.canvas) {
            delete nested.environment.canvas.width;
            delete nested.environment.canvas.height;
        }
        if (nested.environment && nested.environment.grid) {
            delete nested.environment.grid.show;
        }
        if (nested.environment) delete nested.environment.resetLookOnThemeApply;
        const prune = function (obj) {
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
            Object.keys(obj).forEach(function (k) {
                prune(obj[k]);
                if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k]) && Object.keys(obj[k]).length === 0) {
                    delete obj[k];
                }
            });
        };
        prune(nested);
        return nested;
    },

    /**
     * Sparse nested master for a theme file: only inspector fields that currently
     * have a blue outline (differ from the factory snapshot).
     */
    _buildSparseThemeMasterFromCurrentLook: function () {
        const bag = {};
        const leaves = this.collectThemeSurfaceLeaves();
        const self = this;
        leaves.forEach(function (leaf) {
            if (!leaf || !self._isThemeSurfaceFieldSet(leaf.field)) return;
            const value = self._themeSurfaceFieldValue(leaf.field);
            if (value === undefined) return;
            if (leaf.token) {
                if (!bag.themeColors || typeof bag.themeColors !== 'object') bag.themeColors = {};
                bag.themeColors[leaf.token] = self._cloneJson(value);
            } else {
                bag[leaf.flatKey] = self._cloneJson(value);
            }
        });
        this._copyDifferingThemeCorrectionKeys(bag);
        const nested = (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.nestRuntimeBagToV2Master === 'function')
            ? SaveFormatV2.nestRuntimeBagToV2Master(bag, { omitResponsiveIfNotMode: true })
            : {};
        return this._finalizeThemeNestedMaster(nested);
    },

    _serializeTemplate: function (name, options) {
        options = options || {};
        const nested = this._buildSparseThemeMasterFromCurrentLook();
        const templateData = {
            version: (typeof window !== 'undefined' && window.DASHBOARD_VERSION) ? window.DASHBOARD_VERSION : '2.0.0',
            name: name,
            themeKind: options.themeKind === 'adjustment' ? 'adjustment' : 'full',
            master: nested
        };
        const previewImage = typeof options.previewImage === 'string' ? options.previewImage.trim() : '';
        if (previewImage) templateData.previewImage = previewImage;
        return templateData;
    },

    _widgetPresetExcludedKeys: new Set([
        'metaName', 'locked', 'visible', 'page', 'zIndex', 'x', 'y', 'editorModeOverride', 'series', 'data'
    ]),

    /**
     * Shared Save/Export Theme dialog: name, Full/Adjustment type, optional
     * preview image, and a clickable list of existing themes. Used by the editor
     * toolbar buttons and the Theme Preset Editor (Tools).
     * options: { title, okLabel, name, themeKind, previewImage,
     *            existing: [{ name, kind }], forbidExisting }
     * Resolves { name, themeKind, previewImage, exists } or null on cancel.
     */
    promptThemeSaveAs: async function (options) {
        options = options || {};
        const fallbackKind = options.themeKind === 'adjustment' ? 'adjustment' : 'full';
        if (typeof CustomDialog === 'undefined' || typeof CustomDialog.form !== 'function') {
            const name = (typeof CustomDialog !== 'undefined' && CustomDialog.prompt)
                ? await CustomDialog.prompt('Theme name:', options.name || 'New Theme', options.title || 'Save Theme')
                : null;
            if (!name) return null;
            return { name: String(name).trim(), themeKind: fallbackKind, previewImage: '', exists: false };
        }
        let existing = Array.isArray(options.existing) ? options.existing : null;
        if (!existing && typeof this._loadUserTemplates === 'function') {
            try {
                const listed = await this._loadUserTemplates();
                existing = (listed || []).map(function (t) {
                    return { name: t && t.name ? String(t.name) : String(t || ''), kind: (t && t.kind) || 'full' };
                });
            } catch (e) {
                existing = [];
            }
        }
        if (!existing) existing = [];
        return CustomDialog.form(
            'Full themes replace the whole look when applied. Adjustment themes only overlay their stored values.',
            options.title || 'Save Theme',
            {
                okLabel: options.okLabel || 'Save',
                buildExtras: function (extrasEl) {
                    extrasEl.className = 'cd-prompt-extras cd-link-target-extras';
                    const wrap = document.createElement('div');
                    wrap.className = 'cd-theme-save-wrap';

                    const nameLabel = document.createElement('label');
                    nameLabel.className = 'cd-theme-save-label';
                    nameLabel.textContent = 'Theme Name';
                    const nameInput = document.createElement('input');
                    nameInput.type = 'text';
                    nameInput.id = 'cd-theme-save-name';
                    nameInput.className = 'control-input';
                    nameInput.value = options.name || '';
                    wrap.appendChild(nameLabel);
                    wrap.appendChild(nameInput);

                    const kindField = document.createElement('fieldset');
                    kindField.className = 'cd-markdown-link-target-fieldset';
                    const kindLegend = document.createElement('legend');
                    kindLegend.textContent = 'Theme Type';
                    kindField.appendChild(kindLegend);
                    const kindRows = document.createElement('div');
                    kindRows.className = 'cd-markdown-link-target-rows';
                    [['full', 'Full Theme - replaces the whole look'],
                        ['adjustment', 'Adjustment Theme - overlays stored values only']].forEach(function (pair) {
                        const value = pair[0];
                        const text = pair[1];
                        const lbl = document.createElement('label');
                        lbl.setAttribute('for', 'cd-theme-kind-' + value);
                        const radio = document.createElement('input');
                        radio.type = 'radio';
                        radio.name = 'cdThemeKind';
                        radio.id = 'cd-theme-kind-' + value;
                        radio.value = value;
                        radio.checked = fallbackKind === value;
                        lbl.appendChild(radio);
                        lbl.appendChild(document.createTextNode(text));
                        kindRows.appendChild(lbl);
                    });
                    kindField.appendChild(kindRows);
                    wrap.appendChild(kindField);

                    const previewLabel = document.createElement('label');
                    previewLabel.className = 'cd-theme-save-label';
                    previewLabel.textContent = 'Preview Image (Optional)';
                    const previewInput = document.createElement('input');
                    previewInput.type = 'text';
                    previewInput.id = 'cd-theme-save-preview';
                    previewInput.className = 'control-input';
                    previewInput.placeholder = 'images/theme-preview/my_theme.jpg';
                    previewInput.value = options.previewImage || '';
                    wrap.appendChild(previewLabel);
                    wrap.appendChild(previewInput);
                    const previewHint = document.createElement('div');
                    previewHint.className = 'cd-theme-save-hint';
                    previewHint.textContent = 'Optional path to a preview image. Leave empty to show a placeholder.';
                    wrap.appendChild(previewHint);

                    if (existing.length > 0) {
                        const listLabel = document.createElement('label');
                        listLabel.className = 'cd-theme-save-label';
                        listLabel.textContent = 'Existing Themes';
                        wrap.appendChild(listLabel);
                        const list = document.createElement('div');
                        list.className = 'cd-theme-existing-list ds-scroll-box';
                        existing.forEach(function (item) {
                            if (!item || !item.name) return;
                            const row = document.createElement('button');
                            row.type = 'button';
                            row.className = 'cd-theme-existing-item';
                            const label = document.createElement('span');
                            label.className = 'cd-theme-existing-name';
                            label.textContent = item.name;
                            row.appendChild(label);
                            const badge = document.createElement('span');
                            badge.className = 'theme-explorer-kind theme-explorer-kind--' + (item.kind === 'full' ? 'full' : 'adjustment');
                            badge.textContent = item.kind === 'full' ? 'Full' : 'Adjustment';
                            row.appendChild(badge);
                            row.addEventListener('click', function () {
                                nameInput.value = item.name;
                                const err = document.getElementById('cd-theme-save-error');
                                if (err) err.textContent = '';
                                try { nameInput.focus(); } catch (e) { /* ignore */ }
                            });
                            list.appendChild(row);
                        });
                        wrap.appendChild(list);
                    }

                    const error = document.createElement('div');
                    error.id = 'cd-theme-save-error';
                    error.className = 'wpe-status is-warn';
                    error.setAttribute('role', 'alert');
                    wrap.appendChild(error);

                    extrasEl.appendChild(wrap);
                    setTimeout(function () {
                        try { nameInput.focus(); nameInput.select(); } catch (e) { /* ignore */ }
                    }, 50);
                },
                collect: function () {
                    const nameEl = document.getElementById('cd-theme-save-name');
                    const previewEl = document.getElementById('cd-theme-save-preview');
                    const kindEl = document.querySelector('input[name="cdThemeKind"]:checked');
                    const errorEl = document.getElementById('cd-theme-save-error');
                    const fail = function (msg) {
                        if (errorEl) errorEl.textContent = msg;
                        return false;
                    };
                    const raw = nameEl ? String(nameEl.value || '').trim() : '';
                    if (!raw) return fail('Name is required.');
                    if (raw.indexOf('/') >= 0) return fail('Name cannot contain "/".');
                    const taken = existing.some(function (item) {
                        return item && String(item.name || '').trim().toLowerCase() === raw.toLowerCase();
                    });
                    if (taken && options.forbidExisting) {
                        return fail('A theme named "' + raw + '" already exists.');
                    }
                    return {
                        name: raw,
                        themeKind: kindEl && kindEl.value === 'full' ? 'full' : 'adjustment',
                        previewImage: previewEl ? String(previewEl.value || '').trim() : '',
                        exists: taken
                    };
                }
            }
        ).then(function (result) {
            return result || null;
        });
    },

    // Reset keeps size in addition to identity/placement (1A still allows width/height in presets).
    _widgetPresetResetExcludedKeys: new Set([
        'metaName', 'locked', 'visible', 'page', 'zIndex', 'x', 'y', 'width', 'height', 'editorModeOverride', 'series', 'data'
    ]),

    _widgetPresetsManifestCache: null,
    _widgetPresetKeySequence: null,
    _widgetPresetEntryMap: null,
    _activeWidgetPresetKey: '',
    _activeWidgetPresetLabel: '',
    _activeWidgetPresetWidgetId: null,
    _activeWidgetPresetFile: null,
    _activeWidgetPresetVariantId: '',
    _activeWidgetPresetVariantLabel: '',
    /** Per-widget last applied preset (session only). Cleared when a preset-eligible setting changes. */
    _appliedPresetByWidgetId: null,
    _applyingWidgetPreset: false,

    _getSelectedWidgetForPreset: function () {
        if (typeof Editor === 'undefined' || !Editor.currentId) return null;
        const widget = this.widgets[Editor.currentId];
        return widget || null;
    },

    /** Visible preset name. Never stringify booleans (textContent = false renders "false"). */
    _coercePresetLabel: function (value, fallback) {
        const pick = (v) => {
            if (typeof v === 'number' && isFinite(v)) return String(v);
            if (typeof v !== 'string') return '';
            const s = v.trim();
            if (!s || s === 'false' || s === 'true' || s === 'undefined' || s === 'null') return '';
            return s;
        };
        return pick(value) || pick(fallback) || '';
    },

    _widgetPresetFingerprint: function (widget) {
        try {
            return JSON.stringify(this._stripWidgetPresetExcludedKeys(widget && widget.overrides));
        } catch (e) {
            return '';
        }
    },

    _rememberAppliedPreset: function (widgetId) {
        if (!widgetId) return;
        if (!this._appliedPresetByWidgetId) this._appliedPresetByWidgetId = {};
        if (!this._activeWidgetPresetKey && !this._activeWidgetPresetFile) {
            delete this._appliedPresetByWidgetId[widgetId];
            return;
        }
        const widget = this.widgets[widgetId];
        this._appliedPresetByWidgetId[widgetId] = {
            key: this._activeWidgetPresetKey || '',
            label: this._activeWidgetPresetLabel || '',
            variantId: this._activeWidgetPresetVariantId || '',
            variantLabel: this._activeWidgetPresetVariantLabel || '',
            file: this._activeWidgetPresetFile,
            snapshot: widget ? this._widgetPresetFingerprint(widget) : ''
        };
    },

    _captureAppliedPresetRec: function (widgetId) {
        const rec = this._appliedPresetByWidgetId && widgetId
            ? this._appliedPresetByWidgetId[widgetId]
            : null;
        return rec ? this._cloneJson(rec) : null;
    },

    _applyAppliedPresetRec: function (widgetId, rec) {
        if (!widgetId) return;
        if (!this._appliedPresetByWidgetId) this._appliedPresetByWidgetId = {};
        if (!rec) delete this._appliedPresetByWidgetId[widgetId];
        else this._appliedPresetByWidgetId[widgetId] = this._cloneJson(rec);
        this._restoreAppliedPreset(widgetId);
        this._paintWidgetPresetDropdownLabels();
    },

    _recordWidgetOverridesReplace: function (widgetId, beforeOverrides, afterOverrides, beforePreset, afterPreset) {
        if (!widgetId || this.isApplyingHistory) return;
        if (this._isEqualJson(beforeOverrides, afterOverrides)) return;
        this._recordHistoryEntry({
            kind: 'widget-overrides',
            id: widgetId,
            replace: true,
            before: beforeOverrides,
            after: afterOverrides,
            appliedPresetBefore: beforePreset,
            appliedPresetAfter: afterPreset
        });
    },

    _restoreAppliedPreset: function (widgetId) {
        const rec = this._appliedPresetByWidgetId && widgetId
            ? this._appliedPresetByWidgetId[widgetId]
            : null;
        const widget = widgetId ? this.widgets[widgetId] : null;
        const snapshotOk = !!(rec && rec.snapshot && widget
            && this._widgetPresetFingerprint(widget) === rec.snapshot);
        if (!snapshotOk) {
            if (widgetId && this._appliedPresetByWidgetId) delete this._appliedPresetByWidgetId[widgetId];
            this._activeWidgetPresetKey = '';
            this._activeWidgetPresetLabel = '';
            this._activeWidgetPresetVariantId = '';
            this._activeWidgetPresetVariantLabel = '';
            this._activeWidgetPresetFile = null;
            this._activeWidgetPresetWidgetId = widgetId || null;
            return;
        }
        this._activeWidgetPresetKey = rec.key || '';
        this._activeWidgetPresetLabel = rec.label || '';
        this._activeWidgetPresetVariantId = rec.variantId || '';
        this._activeWidgetPresetVariantLabel = rec.variantLabel || '';
        this._activeWidgetPresetFile = rec.file || null;
        this._activeWidgetPresetWidgetId = widgetId;
    },

    _syncActivePresetToSelectedWidget: function () {
        if (this._applyingWidgetPreset) return;
        const widget = this._getSelectedWidgetForPreset();
        const nextId = widget ? widget.id : null;
        if (this._activeWidgetPresetWidgetId === nextId) {
            if (!nextId || !this._appliedPresetByWidgetId || !this._appliedPresetByWidgetId[nextId]) return;
            const rec = this._appliedPresetByWidgetId[nextId];
            if (rec.snapshot && this._widgetPresetFingerprint(widget) === rec.snapshot) return;
            delete this._appliedPresetByWidgetId[nextId];
            this._activeWidgetPresetKey = '';
            this._activeWidgetPresetLabel = '';
            this._activeWidgetPresetVariantId = '';
            this._activeWidgetPresetVariantLabel = '';
            this._activeWidgetPresetFile = null;
            return;
        }
        if (this._activeWidgetPresetWidgetId) this._rememberAppliedPreset(this._activeWidgetPresetWidgetId);
        this._restoreAppliedPreset(nextId);
    },

    _syncAppliedPresetAfterOverridesChange: function (widgetId) {
        if (!widgetId || this.isApplyingHistory || this._applyingWidgetPreset) return;
        const rec = this._appliedPresetByWidgetId && this._appliedPresetByWidgetId[widgetId];
        if (!rec || !rec.snapshot) return;
        const widget = this.widgets[widgetId];
        if (!widget) return;
        if (this._widgetPresetFingerprint(widget) === rec.snapshot) return;
        delete this._appliedPresetByWidgetId[widgetId];
        if (this._activeWidgetPresetWidgetId === widgetId) {
            this._activeWidgetPresetKey = '';
            this._activeWidgetPresetLabel = '';
            this._activeWidgetPresetVariantId = '';
            this._activeWidgetPresetVariantLabel = '';
            this._activeWidgetPresetFile = null;
            this._paintWidgetPresetDropdownLabels();
        }
    },

    _stripWidgetPresetExcludedKeys: function (overrides) {
        const out = this._cleanObject(this._cloneJson(overrides || {}));
        this._widgetPresetExcludedKeys.forEach((key) => {
            delete out[key];
        });
        return out;
    },

    _deepMergePresetSettings: function (target, source) {
        if (!target || typeof target !== 'object' || !source || typeof source !== 'object') return;
        Object.keys(source).forEach((key) => {
            if (this._widgetPresetExcludedKeys.has(key)) return;
            const sv = source[key];
            if (sv !== null && typeof sv === 'object' && !Array.isArray(sv)
                && target[key] !== null && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                this._deepMergePresetSettings(target[key], sv);
            } else {
                target[key] = this._cloneJson(sv);
            }
        });
    },

    _serializeWidgetPreset: function (widget, name, options) {
        options = options || {};
        const widgetType = this._getWidgetTypeByInstance(widget);
        if (options.preset && typeof options.preset === 'object') {
            if (typeof WidgetPresetModel !== 'undefined' && typeof WidgetPresetModel.normalizePreset === 'function') {
                return WidgetPresetModel.normalizePreset(options.preset, {
                    widgetType: options.preset.widgetType || widgetType,
                    fileId: options.fileId
                });
            }
            return options.preset;
        }
        if (typeof WidgetPresetModel !== 'undefined' && options.useSelectionModel !== false) {
            const tree = WidgetPresetModel.buildTree(widget);
            const checked = options.checkedPathKeys
                || WidgetPresetModel.collectChangedPathKeys(tree);
            return WidgetPresetModel.buildPresetFile(
                widget,
                name,
                options.subName || '',
                tree,
                checked,
                { fileId: options.fileId, existingFileIds: options.existingFileIds }
            );
        }
        const settings = this._stripWidgetPresetExcludedKeys(widget && widget.overrides);
        if (typeof WidgetPresetModel !== 'undefined') {
            return WidgetPresetModel.normalizePreset({
                name: String(name || 'Preset'),
                widgetType: widgetType || '',
                version: window.DASHBOARD_VERSION || '2.0.0',
                variants: [{ id: 'default', name: 'default', settings: settings }]
            }, { fileId: options.fileId });
        }
        return {
            id: String(name || 'preset'),
            name: String(name || 'Preset'),
            widgetType: widgetType || '',
            version: window.DASHBOARD_VERSION || '2.0.0',
            variants: [{ id: 'default', name: 'default', settings: settings }]
        };
    },

    _migrateWidgetPresetData: function (preset) {
        if (!preset || typeof preset !== 'object') return preset;
        if (typeof DashboardMigrator !== 'undefined' && typeof DashboardMigrator.migrateWidgetPreset === 'function') {
            return DashboardMigrator.migrateWidgetPreset(preset);
        }
        if (typeof WidgetPresetModel !== 'undefined' && typeof WidgetPresetModel.normalizePreset === 'function') {
            return WidgetPresetModel.normalizePreset(preset);
        }
        if (!preset.version) {
            preset.version = window.DASHBOARD_VERSION || '2.0.0';
        }
        return preset;
    },

    _normalizeWidgetPresetData: function (raw, options) {
        if (!raw || typeof raw !== 'object') return null;
        let data = raw;
        if (typeof WidgetPresetModel !== 'undefined' && typeof WidgetPresetModel.normalizePreset === 'function') {
            data = WidgetPresetModel.normalizePreset(raw, options || {});
            if (!data) return null;
        } else if (!Array.isArray(raw.variants) || raw.variants.length === 0) {
            return null;
        }
        return this._migrateWidgetPresetData(data);
    },

    _refreshWidgetAfterPresetChange: function (widget) {
        if (!widget) return;
        if (typeof widget.notifyOverridesMutated === 'function') {
            widget.notifyOverridesMutated();
        } else if (typeof widget._widgetConfigEpoch === 'number') {
            widget._widgetConfigEpoch += 1;
        }
        if (typeof widget.render === 'function') widget.render();
        if (typeof widget.updatePositionSize === 'function') widget.updatePositionSize();
        if (typeof Editor !== 'undefined' && Editor.currentId === widget.id && typeof Editor.loadWidget === 'function') {
            Editor.loadWidget(widget.id);
        }
        this.markUnsaved();
    },

    /**
     * Apply one variant's settings from a multi-variant preset file.
     * options.variantIndex / options.variantId select which variant (default: first).
     */
    _applyWidgetPreset: function (widget, presetFile, options) {
        options = options || {};
        if (!widget || !presetFile || typeof presetFile !== 'object') return false;

        const migrated = this._normalizeWidgetPresetData(this._cloneJson(presetFile));
        if (!migrated || !Array.isArray(migrated.variants) || migrated.variants.length === 0) {
            CustomDialog.alert('Invalid preset file format.', 'Error');
            return false;
        }

        const widgetType = this._getWidgetTypeByInstance(widget);
        if (migrated.widgetType && widgetType && String(migrated.widgetType) !== String(widgetType)) {
            CustomDialog.alert(
                'This preset is for widget type "' + migrated.widgetType + '", but the selected widget is "' + widgetType + '".',
                'Preset Type Mismatch'
            );
            return false;
        }

        let idx = 0;
        if (options.variantId != null) {
            const found = typeof WidgetPresetModel !== 'undefined'
                ? WidgetPresetModel.findVariantIndexById(migrated, options.variantId)
                : -1;
            if (found >= 0) idx = found;
        } else if (typeof options.variantIndex === 'number' && options.variantIndex >= 0) {
            idx = Math.min(options.variantIndex, migrated.variants.length - 1);
        }
        const settings = migrated.variants[idx] && migrated.variants[idx].settings;
        if (!settings || typeof settings !== 'object') {
            CustomDialog.alert('Invalid preset file format.', 'Error');
            return false;
        }

        this._activeWidgetPresetFile = migrated;
        this._activeWidgetPresetVariantId = (typeof migrated.variants[idx].id === 'string')
            ? migrated.variants[idx].id
            : '';
        this._activeWidgetPresetVariantLabel = this._coercePresetLabel(
            migrated.variants[idx].name,
            migrated.variants[idx].id
        );
        const appliedLabel = this._coercePresetLabel(migrated.name, this._activeWidgetPresetLabel);
        if (appliedLabel) this._activeWidgetPresetLabel = appliedLabel;

        if (!widget.overrides || typeof widget.overrides !== 'object') {
            widget.overrides = {};
        }
        const beforeOverrides = this._cloneJson(widget.overrides);
        const beforePreset = this._captureAppliedPresetRec(widget.id);
        this._applyingWidgetPreset = true;
        try {
            this._deepMergePresetSettings(widget.overrides, this._stripWidgetPresetExcludedKeys(settings));
            this._activeWidgetPresetWidgetId = widget.id;
            this._refreshWidgetAfterPresetChange(widget);
            this._rememberAppliedPreset(widget.id);
            this._paintWidgetPresetDropdownLabels();
            this._recordWidgetOverridesReplace(
                widget.id,
                beforeOverrides,
                this._cloneJson(widget.overrides),
                beforePreset,
                this._captureAppliedPresetRec(widget.id)
            );
        } finally {
            this._applyingWidgetPreset = false;
        }
        return true;
    },

    _openWidgetPresetPicker: async function (action) {
        const widget = this._getSelectedWidgetForPreset();
        if (!widget) {
            await CustomDialog.alert('Select a widget first.', action === 'save' ? 'Save Preset' : 'Export Preset');
            return null;
        }
        if (typeof WidgetPresetPicker === 'undefined' || typeof WidgetPresetPicker.open !== 'function') {
            await CustomDialog.alert('Preset picker is not available.', 'Error');
            return null;
        }
        return WidgetPresetPicker.open({
            action: action,
            widget: widget,
            defaultName: (widget.overrides && widget.overrides.metaName) || widget.id || 'Preset'
        });
    },

    _getWidgetPresetStorageProvider: function () {
        const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        return driver && typeof driver.getStorageProvider === 'function' ? driver.getStorageProvider() : null;
    },

    saveWidgetPresetToServer: async function () {
        const picked = await this._openWidgetPresetPicker('save');
        if (!picked || !picked.preset) return;

        const provider = this._getWidgetPresetStorageProvider();
        if (!provider || typeof provider.save !== 'function') {
            await CustomDialog.alert('Server unavailable', 'Error');
            return;
        }

        const widgetType = picked.preset.widgetType || this._getWidgetTypeByInstance(this._getSelectedWidgetForPreset());
        const fileId = picked.fileId || picked.preset.id;
        const fullName = widgetType + '/' + fileId;

        try {
            await provider.save('widgetpresets', fullName, picked.preset);
            const msg = picked.overwrite
                ? 'Preset overwritten.'
                : (picked.appended ? 'Sub-preset added.' : 'Saved successfully!');
            await CustomDialog.alert(msg, 'Success');

            // Keep inspector selection in sync with the saved file (new subs must appear immediately).
            const normalized = this._normalizeWidgetPresetData(picked.preset, { fileId: fileId });
            const activeKey = 'user:' + fullName;
            if (normalized) {
                this._activeWidgetPresetKey = activeKey;
                this._activeWidgetPresetLabel = this._coercePresetLabel(normalized.name, picked.name || fileId);
                this._activeWidgetPresetFile = normalized;
                const selected = this._getSelectedWidgetForPreset();
                this._activeWidgetPresetWidgetId = selected ? selected.id : this._activeWidgetPresetWidgetId;
                let vi = -1;
                if (typeof WidgetPresetModel !== 'undefined' && this._activeWidgetPresetVariantId) {
                    vi = WidgetPresetModel.findVariantIndexById(normalized, this._activeWidgetPresetVariantId);
                }
                if (picked.appended && normalized.variants.length > 0) {
                    const last = normalized.variants[normalized.variants.length - 1];
                    this._activeWidgetPresetVariantId = last.id || '';
                    this._activeWidgetPresetVariantLabel = this._coercePresetLabel(last.name, last.id);
                } else if (vi >= 0) {
                    this._activeWidgetPresetVariantLabel = this._coercePresetLabel(
                        normalized.variants[vi].name,
                        normalized.variants[vi].id
                    );
                } else {
                    const first = normalized.variants[0];
                    this._activeWidgetPresetVariantId = first ? first.id : '';
                    this._activeWidgetPresetVariantLabel = first
                        ? this._coercePresetLabel(first.name, first.id)
                        : '';
                }
                if (selected) this._rememberAppliedPreset(selected.id);
            }
            await this.refreshWidgetPresetDropdown();
            this._paintWidgetPresetDropdownLabels();
        } catch (err) {
            await CustomDialog.alert('Save failed: ' + (err && err.message ? err.message : String(err)), 'Error');
        }
    },

    exportWidgetPresetLocal: async function () {
        const picked = await this._openWidgetPresetPicker('export');
        if (!picked || !picked.preset) return;
        this.exportWidgetPresetFileLocal(picked.preset, picked.name || picked.fileId);
    },

    /** Download filename from the preset display name (slugified). Falls back to hint, then id. */
    _widgetPresetExportFileName: function (preset, fileNameHint) {
        const displayName = (preset && typeof preset.name === 'string') ? preset.name.trim() : '';
        const hint = (fileNameHint != null && String(fileNameHint).trim() !== '') ? String(fileNameHint).trim() : '';
        const id = (preset && typeof preset.id === 'string') ? preset.id.trim() : '';
        const raw = displayName || hint || id || 'preset';
        if (typeof WidgetPresetModel !== 'undefined' && typeof WidgetPresetModel.slugify === 'function') {
            return WidgetPresetModel.slugify(raw, 'preset');
        }
        return String(raw).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') || 'preset';
    },

    exportWidgetPresetFileLocal: function (preset, fileNameHint) {
        if (!preset || typeof preset !== 'object') return;
        const normalized = this._normalizeWidgetPresetData(preset) || preset;
        const name = this._widgetPresetExportFileName(normalized, fileNameHint);
        StorageRegistry.get('local').save('widgetpreset', name, normalized);
    },

    /**
     * Theme file helpers for the Theme Preset Editor (Tools). Filenames are the
     * display name slugified, matching the widget preset export convention.
     */
    _themeExportFileName: function (data, fileNameHint) {
        const displayName = (data && typeof data.name === 'string') ? data.name.trim() : '';
        const hint = (fileNameHint != null && String(fileNameHint).trim() !== '') ? String(fileNameHint).trim() : '';
        const raw = displayName || hint || 'theme';
        if (typeof WidgetPresetModel !== 'undefined' && typeof WidgetPresetModel.slugify === 'function') {
            return WidgetPresetModel.slugify(raw, 'theme');
        }
        return String(raw).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') || 'theme';
    },

    exportThemeFileLocal: function (data, fileNameHint) {
        if (!data || typeof data !== 'object') return;
        const name = this._themeExportFileName(data, fileNameHint);
        StorageRegistry.get('local').save('template', name, data);
    },

    /** Persist a theme file object under My Themes. Refreshes theme pickers. */
    saveUserThemeFile: async function (name, data) {
        const displayName = String(name || '');
        if (!displayName) return false;
        const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        const provider = driver && (typeof driver.getStorageProvider === 'function') ? driver.getStorageProvider() : null;
        if (!provider || typeof provider.save !== 'function') {
            if (typeof CustomDialog !== 'undefined') await CustomDialog.alert('Server unavailable', 'Error');
            return false;
        }
        try {
            await provider.save('templates', displayName, data);
            this._getUserThemeKindCache()[displayName] = this._themeKindOf(data, false);
            this._cachedUserTemplates = null;
            await this.refreshTemplateDropdown();
            if (typeof Editor !== 'undefined' && Editor.currentId === 'GLOBAL_SETTINGS' && Editor.fieldRegistry && Editor.fieldRegistry['theme']) {
                const reg = Editor.fieldRegistry['theme'];
                if (reg.inputEl && typeof reg.inputEl.setOptions === 'function') {
                    reg.inputEl.setOptions(this.getThemeSelectOptions());
                }
            }
            return true;
        } catch (err) {
            if (typeof CustomDialog !== 'undefined') {
                await CustomDialog.alert('Save failed: ' + (err && err.message ? err.message : String(err)), 'Error');
            }
            return false;
        }
    },

    /** Delete one My Theme without prompting (the caller confirms). */
    deleteUserThemeFile: async function (name) {
        const displayName = String(name || '');
        if (!displayName) return false;
        const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        const provider = driver && (typeof driver.getStorageProvider === 'function') ? driver.getStorageProvider() : null;
        if (!provider || typeof provider.delete !== 'function') return false;
        try {
            await provider.delete('templates', displayName);
            this._invalidateUserThemeKind(displayName);
            this._cachedUserTemplates = null;
            await this.refreshTemplateDropdown();
            return true;
        } catch (e) {
            return false;
        }
    },

    /** Load one raw theme file object (built-in or user) without applying it. */
    fetchThemeFile: async function (key) {
        if (typeof key === 'string' && key.indexOf('user:') === 0) {
            const name = key.slice(5);
            const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
            const provider = driver && (typeof driver.getStorageProvider === 'function') ? driver.getStorageProvider() : null;
            if (!provider || typeof provider.load !== 'function') return null;
            try {
                return await provider.load('templates', name);
            } catch (e) {
                return null;
            }
        }
        if (!this._getPresetThemes()) {
            if (typeof WidgetScriptLoader !== 'undefined') {
                if (typeof WidgetScriptLoader.ensureThemesScript === 'function') {
                    await WidgetScriptLoader.ensureThemesScript();
                } else if (typeof WidgetScriptLoader.ensureTemplatesScript === 'function') {
                    await WidgetScriptLoader.ensureTemplatesScript();
                }
            }
        }
        const presetThemes = this._getPresetThemes();
        if (presetThemes && presetThemes[key]) {
            return this._cloneJson(presetThemes[key]);
        }
        return null;
    },

    importWidgetPresetLocal: function () {
        const widget = this._getSelectedWidgetForPreset();
        if (!widget) {
            CustomDialog.alert('Select a widget first.', 'Import Preset');
            return;
        }
        StorageRegistry.get('local').load('widgetpreset')
            .then(async (result) => {
                const data = result.data || result;
                if (!data || typeof data !== 'object') {
                    await CustomDialog.alert('Invalid preset file format.', 'Error');
                    return;
                }
                const normalized = this._normalizeWidgetPresetData(data);
                if (!normalized || !Array.isArray(normalized.variants) || normalized.variants.length === 0) {
                    await CustomDialog.alert('Invalid preset file format.', 'Error');
                    return;
                }
                let variantIndex = 0;
                if (normalized.variants.length > 1) {
                    const choices = normalized.variants.map((v, i) => ({
                        value: String(i),
                        label: String(v.name || v.id || ('Variant ' + (i + 1)))
                    }));
                    const picked = await CustomDialog.chooseOne(
                        'This file has multiple sub-presets. Which one should be applied?',
                        'Choose Sub-Preset',
                        choices
                    );
                    if (picked === false || picked == null) return;
                    variantIndex = parseInt(picked, 10);
                    if (isNaN(variantIndex) || variantIndex < 0) variantIndex = 0;
                }
                this._applyWidgetPreset(widget, normalized, { variantIndex: variantIndex });
            })
            .catch((err) => {
                if (err) CustomDialog.alert(err.message, 'Import Error');
            });
    },

    _loadWidgetPresetsManifest: async function () {
        if (this._widgetPresetsManifestCache) return this._widgetPresetsManifestCache;
        try {
            const res = await fetch(this._authenticatedAssetUrl('widgets/presets/presets-manifest.json'));
            if (!res.ok) {
                this._widgetPresetsManifestCache = {};
                return this._widgetPresetsManifestCache;
            }
            const data = await res.json();
            this._widgetPresetsManifestCache = (data && typeof data === 'object') ? data : {};
        } catch (e) {
            this._widgetPresetsManifestCache = {};
        }
        return this._widgetPresetsManifestCache;
    },

    _loadUserWidgetPresets: async function (widgetType) {
        if (!widgetType) return [];
        const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        if (!driver || (DataDriverRegistry.getType() !== 'homey' && DataDriverRegistry.getType() !== 'homeassistant')) return [];
        const provider = (typeof driver.getStorageProvider === 'function') ? driver.getStorageProvider() : null;
        if (!provider || typeof provider.list !== 'function') return [];
        try {
            const list = await provider.list('widgetpresets');
            if (!Array.isArray(list)) return [];
            const user = [];
            for (let i = 0; i < list.length; i++) {
                const f = list[i];
                if (!f || !f.name) continue;
                if (f.source === 'factory') continue;
                const type = f.widgetType || String(f.name).split('/')[0];
                const fileIdRaw = f.fileId || f.presetName || String(f.name).split('/').slice(1).join('/');
                const fileId = typeof fileIdRaw === 'string' ? fileIdRaw.trim() : String(fileIdRaw || '');
                if (String(type) !== String(widgetType) || !fileId) continue;
                const displayRaw = typeof f.displayName === 'string' ? f.displayName.trim() : '';
                const coerced = !displayRaw || displayRaw === 'false' || displayRaw === 'true'
                    || displayRaw === 'undefined' || displayRaw === 'null';
                const label = coerced ? fileId : displayRaw;
                user.push({
                    name: label,
                    fileId: fileId,
                    fullName: String(f.name),
                    variantCount: typeof f.variantCount === 'number' ? f.variantCount : 1,
                    displayName: label
                });
            }
            user.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
            return user;
        } catch (e) {
            return [];
        }
    },

    _loadUserWidgetPresetFile: async function (fullName) {
        const provider = this._getWidgetPresetStorageProvider();
        if (!provider || typeof provider.load !== 'function') return null;
        try {
            const data = await provider.load('widgetpresets', fullName);
            return this._normalizeWidgetPresetData(data, {
                fileId: String(fullName || '').split('/').slice(1).join('/')
            });
        } catch (e) {
            return null;
        }
    },

    _setWidgetPresetDropdownValue: function (key, label, options) {
        options = options || {};
        const widget = this._getSelectedWidgetForPreset();
        this._activeWidgetPresetKey = key || '';
        this._activeWidgetPresetLabel = key ? this._coercePresetLabel(label) : '';
        this._activeWidgetPresetWidgetId = widget ? widget.id : null;
        if (options.clearVariant) {
            this._activeWidgetPresetVariantId = '';
            this._activeWidgetPresetVariantLabel = '';
            this._activeWidgetPresetFile = null;
        }
        if (widget) {
            if (key) this._rememberAppliedPreset(widget.id);
            else if (this._appliedPresetByWidgetId) delete this._appliedPresetByWidgetId[widget.id];
        }
        this._paintWidgetPresetDropdownLabels();
    },

    /** Write current main/sub selection onto inspector DOM (safe after loadWidget rebuild). */
    _paintWidgetPresetDropdownLabels: function () {
        this._syncActivePresetToSelectedWidget();
        const wrapper = document.getElementById('widget-preset-select-wrapper');
        const labelEl = document.getElementById('widget-preset-select-label');
        const file = this._activeWidgetPresetFile;
        const mainLabel = this._coercePresetLabel(
            this._activeWidgetPresetLabel,
            this._coercePresetLabel(file && file.name, file && file.id)
        );
        const hasMain = !!(this._activeWidgetPresetKey || file);
        if (wrapper) wrapper.dataset.value = this._activeWidgetPresetKey || '';
        if (labelEl) {
            if (hasMain && mainLabel) {
                labelEl.textContent = mainLabel;
                labelEl.classList.remove('editor-muted-text');
            } else if (hasMain) {
                const key = this._activeWidgetPresetKey || '';
                const fromKey = key.indexOf('/') >= 0 ? key.split('/').pop() : key.replace(/^user:|^builtin:/, '');
                labelEl.textContent = this._coercePresetLabel(fromKey) || 'Preset';
                labelEl.classList.remove('editor-muted-text');
            } else {
                labelEl.textContent = 'Select Preset...';
                labelEl.classList.add('editor-muted-text');
            }
        }
        this._syncWidgetPresetSubDropdownVisibility();
    },

    _syncWidgetPresetSubDropdownVisibility: function () {
        const subWrapper = document.getElementById('widget-preset-sub-select-wrapper');
        const subRow = document.getElementById('widget-preset-sub-select-row');
        const file = this._activeWidgetPresetFile;
        const multi = !!(file && Array.isArray(file.variants) && file.variants.length > 1);
        if (subRow) {
            subRow.hidden = !multi;
            subRow.style.display = multi ? 'flex' : 'none';
        }
        if (subWrapper) subWrapper.hidden = !multi;

        const subLabel = document.getElementById('widget-preset-sub-select-label');
        if (subLabel && subWrapper) {
            if (multi) {
                const label = this._coercePresetLabel(
                    this._activeWidgetPresetVariantLabel,
                    file.variants[0] && file.variants[0].name
                ) || 'Sub...';
                subLabel.textContent = label;
                subLabel.classList.remove('editor-muted-text');
                subWrapper.dataset.value = this._activeWidgetPresetVariantId
                    || (file.variants[0] && file.variants[0].id)
                    || '';
            } else {
                subLabel.textContent = 'Sub...';
                subLabel.classList.add('editor-muted-text');
                subWrapper.dataset.value = '';
            }
        }
    },

    refreshWidgetPresetSubDropdown: function () {
        const menu = document.getElementById('widget-preset-sub-select-menu');
        if (!menu) return;
        menu.innerHTML = '';
        const file = this._activeWidgetPresetFile;
        if (!file || !Array.isArray(file.variants) || file.variants.length < 2) return;

        const closeMenu = () => {
            if (typeof Editor !== 'undefined' && Editor._closeDsFixedDropdown) {
                Editor._closeDsFixedDropdown(menu);
            } else {
                menu.classList.add('hidden');
            }
        };

        file.variants.forEach((v) => {
            const opt = document.createElement('div');
            opt.className = 'ds-select-opt';
            opt.dataset.value = v.id;
            opt.onmousedown = (e) => { e.preventDefault(); };
            const label = document.createElement('span');
            label.className = 'ds-select-opt-label';
            label.textContent = this._coercePresetLabel(v.name, v.id) || 'Sub-preset';
            opt.appendChild(label);
            if (typeof Editor !== 'undefined' && typeof Editor._bindOverflowTitle === 'function') {
                Editor._bindOverflowTitle(opt, label, function () { return label.textContent; });
            }
            opt.onclick = (e) => {
                e.stopPropagation();
                closeMenu();
                void this.applyWidgetPresetVariant(v.id);
            };
            menu.appendChild(opt);
        });
    },

    applyWidgetPresetVariant: async function (variantId) {
        const widget = this._getSelectedWidgetForPreset();
        const file = this._activeWidgetPresetFile;
        if (!widget || !file) return;
        this._applyWidgetPreset(widget, file, { variantId: variantId });
    },

    refreshWidgetPresetDropdown: async function () {
        const menu = document.getElementById('widget-preset-select-menu');
        if (!menu) return;

        const widget = this._getSelectedWidgetForPreset();
        const widgetType = this._getWidgetTypeByInstance(widget);
        this._syncActivePresetToSelectedWidget();
        const previousKey = this._activeWidgetPresetKey || '';
        menu.innerHTML = '';
        this._widgetPresetKeySequence = [];
        this._widgetPresetEntryMap = {};

        if (!widget || !widgetType) {
            this._paintWidgetPresetDropdownLabels();
            return;
        }

        const closeMenu = () => {
            if (typeof Editor !== 'undefined' && Editor._closeDsFixedDropdown) {
                Editor._closeDsFixedDropdown(menu);
            } else {
                menu.classList.add('hidden');
            }
        };

        const addGroupHeader = (title) => {
            const hdr = document.createElement('div');
            hdr.className = 'ds-select-group';
            hdr.textContent = title;
            menu.appendChild(hdr);
        };

        const addOption = (key, name, entry, onDelete) => {
            this._widgetPresetEntryMap[key] = entry;
            this._widgetPresetKeySequence.push(key);
            const opt = document.createElement('div');
            opt.className = 'ds-select-opt';
            opt.dataset.value = key;
            opt.onmousedown = (e) => { e.preventDefault(); };

            const label = document.createElement('span');
            label.className = 'ds-select-opt-label';
            label.textContent = name;
            opt.appendChild(label);

            if (typeof onDelete === 'function') {
                this._appendDsSelectDeleteButton(opt, onDelete);
            }

            if (typeof Editor !== 'undefined' && typeof Editor._bindOverflowTitle === 'function') {
                Editor._bindOverflowTitle(opt, label, function () { return label.textContent; });
            }

            opt.onclick = (e) => {
                e.stopPropagation();
                closeMenu();
                void this.loadWidgetPresetByKey(key);
            };
            menu.appendChild(opt);
        };

        const userPresets = await this._loadUserWidgetPresets(widgetType);
        if (userPresets.length > 0) {
            addGroupHeader('My Presets');
            userPresets.forEach((p) => {
                const label = this._coercePresetLabel(p.name, p.fileId);
                addOption('user:' + p.fullName, label, {
                    kind: 'user',
                    name: label,
                    fullName: p.fullName,
                    fileId: p.fileId,
                    variantCount: p.variantCount,
                    widgetType
                }, () => this.deleteUserWidgetPreset(p.fullName, label));
            });
            addGroupHeader('Built-in Presets');
        }

        const manifest = await this._loadWidgetPresetsManifest();
        const builtIns = Array.isArray(manifest[widgetType]) ? manifest[widgetType].slice() : [];
        builtIns.sort((a, b) => String(a.name || a.id || '').localeCompare(String(b.name || b.id || ''), undefined, { sensitivity: 'base' }));
        builtIns.forEach((entry) => {
            const id = entry.id || String(entry.file || '').replace(/\.json$/i, '');
            const name = this._coercePresetLabel(entry.name, id);
            const file = entry.file || (id + '.json');
            addOption('builtin:' + id, name, {
                kind: 'builtin',
                name,
                file,
                fileId: id,
                variantCount: typeof entry.variantCount === 'number' ? entry.variantCount : 1,
                widgetType
            });
        });

        if (this._widgetPresetKeySequence.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'ds-select-opt';
            empty.style.color = 'var(--ui-text-muted)';
            empty.textContent = 'No presets available';
            menu.appendChild(empty);
            if (!previousKey) {
                this._setWidgetPresetDropdownValue('', 'Select Preset...', { clearVariant: true });
            } else {
                this._paintWidgetPresetDropdownLabels();
            }
            return;
        }

        if (previousKey && this._widgetPresetEntryMap[previousKey]) {
            const entry = this._widgetPresetEntryMap[previousKey];
            this._activeWidgetPresetKey = previousKey;
            const listLabel = this._coercePresetLabel(entry.name, entry.fileId);
            if (listLabel) this._activeWidgetPresetLabel = listLabel;
            else this._activeWidgetPresetLabel = this._coercePresetLabel(
                this._activeWidgetPresetLabel,
                this._activeWidgetPresetFile && this._activeWidgetPresetFile.name
            );
            this._paintWidgetPresetDropdownLabels();
        } else if (previousKey) {
            // Keep selection even if the list momentarily omitted the key.
            this._paintWidgetPresetDropdownLabels();
        } else {
            this._setWidgetPresetDropdownValue('', 'Select Preset...', { clearVariant: true });
        }
    },

    loadWidgetPresetByKey: async function (key) {
        const entry = this._widgetPresetEntryMap && this._widgetPresetEntryMap[key];
        if (!entry) return;
        this._activeWidgetPresetKey = key;
        this._activeWidgetPresetLabel = this._coercePresetLabel(entry.name, entry.fileId);
        this._activeWidgetPresetWidgetId = (this._getSelectedWidgetForPreset() || {}).id || null;
        this._paintWidgetPresetDropdownLabels();
        if (entry.kind === 'user') {
            await this.loadWidgetPresetFromServer(entry.fullName);
            return;
        }
        await this.loadBuiltInWidgetPreset(entry.widgetType, entry.file);
    },

    deleteUserWidgetPreset: async function (fullName, displayName, options) {
        options = options || {};
        const name = String(fullName || '');
        if (!name) return false;
        const label = String(displayName || name.split('/').pop() || name);
        if (!options.skipConfirm) {
            if (!await CustomDialog.confirm(
                'Delete "' + label + '" and all of its sub-presets permanently?',
                'Delete Preset'
            )) return false;
        }
        const provider = this._getWidgetPresetStorageProvider();
        if (!provider || typeof provider.delete !== 'function') {
            await CustomDialog.alert('Server unavailable', 'Error');
            return false;
        }
        try {
            await provider.delete('widgetpresets', name);
            if (this._activeWidgetPresetKey === ('user:' + name)) {
                this._setWidgetPresetDropdownValue('', 'Select Preset...', { clearVariant: true });
            }
            await this.refreshWidgetPresetDropdown();
            return true;
        } catch (err) {
            await CustomDialog.alert('Delete failed: ' + (err && err.message ? err.message : String(err)), 'Error');
            return false;
        }
    },

    renameUserWidgetPresetDisplayName: async function (fullName, newDisplayName) {
        const provider = this._getWidgetPresetStorageProvider();
        if (!provider || typeof provider.load !== 'function' || typeof provider.save !== 'function') {
            await CustomDialog.alert('Server unavailable', 'Error');
            return false;
        }
        const ok = typeof WidgetPresetModel !== 'undefined'
            ? WidgetPresetModel.validateDisplayName(newDisplayName)
            : { ok: !!String(newDisplayName || '').trim(), name: String(newDisplayName || '').trim() };
        if (!ok.ok) {
            await CustomDialog.alert(ok.error || 'Invalid name.', 'Rename Preset');
            return false;
        }
        try {
            const raw = await provider.load('widgetpresets', fullName);
            const preset = this._normalizeWidgetPresetData(raw, {
                fileId: String(fullName).split('/').slice(1).join('/')
            });
            if (!preset) {
                await CustomDialog.alert('Could not load preset.', 'Error');
                return false;
            }
            const widgetType = String(fullName || '').split('/')[0];
            if (widgetType && typeof WidgetPresetModel.isDisplayNameTaken === 'function') {
                const user = await this._loadUserWidgetPresets(widgetType);
                const taken = (user || [])
                    .filter((p) => p && p.fullName !== fullName)
                    .map((p) => p.name || p.displayName);
                if (WidgetPresetModel.isDisplayNameTaken(ok.name, taken)) {
                    await CustomDialog.alert('A My Preset named "' + ok.name + '" already exists.', 'Rename Preset');
                    return false;
                }
            }
            preset.name = ok.name;
            await provider.save('widgetpresets', fullName, preset);
            if (this._activeWidgetPresetKey === ('user:' + fullName)) {
                this._activeWidgetPresetLabel = ok.name;
                this._setWidgetPresetDropdownValue(this._activeWidgetPresetKey, ok.name);
                if (this._activeWidgetPresetFile) this._activeWidgetPresetFile.name = ok.name;
            }
            await this.refreshWidgetPresetDropdown();
            return true;
        } catch (err) {
            await CustomDialog.alert('Rename failed: ' + (err && err.message ? err.message : String(err)), 'Error');
            return false;
        }
    },

    saveUserWidgetPresetFile: async function (fullName, preset) {
        const provider = this._getWidgetPresetStorageProvider();
        if (!provider || typeof provider.save !== 'function') {
            await CustomDialog.alert('Server unavailable', 'Error');
            return false;
        }
        try {
            await provider.save('widgetpresets', fullName, preset);
            await this.refreshWidgetPresetDropdown();
            return true;
        } catch (err) {
            await CustomDialog.alert('Save failed: ' + (err && err.message ? err.message : String(err)), 'Error');
            return false;
        }
    },

    prevWidgetPreset: async function () {
        await this.refreshWidgetPresetDropdown();
        const keys = this._widgetPresetKeySequence || [];
        if (keys.length === 0) return;
        const wrapper = document.getElementById('widget-preset-select-wrapper');
        let idx = keys.indexOf(wrapper ? (wrapper.dataset.value || '') : '');
        let newIdx = idx - 1;
        if (newIdx < 0) newIdx = keys.length - 1;
        await this.loadWidgetPresetByKey(keys[newIdx]);
    },

    nextWidgetPreset: async function () {
        await this.refreshWidgetPresetDropdown();
        const keys = this._widgetPresetKeySequence || [];
        if (keys.length === 0) return;
        const wrapper = document.getElementById('widget-preset-select-wrapper');
        let idx = keys.indexOf(wrapper ? (wrapper.dataset.value || '') : '');
        let newIdx = idx + 1;
        if (newIdx >= keys.length) newIdx = 0;
        await this.loadWidgetPresetByKey(keys[newIdx]);
    },

    _stepWidgetPresetVariant: function (delta) {
        const file = this._activeWidgetPresetFile;
        const variants = (file && Array.isArray(file.variants)) ? file.variants : [];
        if (variants.length < 2) return;
        const subWrapper = document.getElementById('widget-preset-sub-select-wrapper');
        const currentId = this._activeWidgetPresetVariantId
            || (subWrapper ? (subWrapper.dataset.value || '') : '')
            || (variants[0] && variants[0].id)
            || '';
        let idx = -1;
        for (let i = 0; i < variants.length; i++) {
            if (String(variants[i].id) === String(currentId)) {
                idx = i;
                break;
            }
        }
        if (idx < 0) idx = 0;
        let nextIdx = idx + delta;
        if (nextIdx < 0) nextIdx = variants.length - 1;
        if (nextIdx >= variants.length) nextIdx = 0;
        const target = variants[nextIdx];
        if (!target) return;
        if (target.id != null && String(target.id) !== '') {
            void this.applyWidgetPresetVariant(target.id);
            return;
        }
        const widget = this._getSelectedWidgetForPreset();
        if (widget) this._applyWidgetPreset(widget, file, { variantIndex: nextIdx });
    },

    prevWidgetPresetVariant: function () {
        this._stepWidgetPresetVariant(-1);
    },

    nextWidgetPresetVariant: function () {
        this._stepWidgetPresetVariant(1);
    },

    /** Fetch + normalize a built-in preset file without applying it to a widget. */
    fetchBuiltInWidgetPresetFile: async function (widgetType, file) {
        const safeType = String(widgetType || '').replace(/[^a-zA-Z0-9_-]/g, '');
        const safeFile = String(file || '').replace(/[^a-zA-Z0-9_.-]/g, '');
        if (!safeType || !safeFile) return null;
        const res = await fetch(this._authenticatedAssetUrl('widgets/presets/' + safeType + '/' + safeFile));
        if (!res.ok) throw new Error('Preset not found');
        const data = await res.json();
        return this._normalizeWidgetPresetData(data, {
            fileId: safeFile.replace(/\.json$/i, ''),
            widgetType: safeType
        });
    },

    loadBuiltInWidgetPreset: async function (widgetType, file) {
        const widget = this._getSelectedWidgetForPreset();
        if (!widget) return;
        try {
            const normalized = await this.fetchBuiltInWidgetPresetFile(widgetType, file);
            if (!normalized) return;
            this._applyWidgetPreset(widget, normalized, { variantIndex: 0 });
        } catch (err) {
            CustomDialog.alert('Failed to load preset: ' + (err && err.message ? err.message : String(err)), 'Error');
        }
    },

    loadWidgetPresetFromServer: async function (fullName) {
        const widget = this._getSelectedWidgetForPreset();
        if (!widget) return;
        const provider = this._getWidgetPresetStorageProvider();
        if (!provider || typeof provider.load !== 'function') {
            await CustomDialog.alert('Server unavailable', 'Error');
            return;
        }
        try {
            const data = await provider.load('widgetpresets', fullName);
            const normalized = this._normalizeWidgetPresetData(data, {
                fileId: String(fullName).split('/').slice(1).join('/')
            });
            this._applyWidgetPreset(widget, normalized, { variantIndex: 0 });
        } catch (err) {
            await CustomDialog.alert('Failed to load preset: ' + (err && err.message ? err.message : String(err)), 'Error');
        }
    },

    resetWidgetToDefault: async function () {
        const widget = this._getSelectedWidgetForPreset();
        if (!widget) {
            await CustomDialog.alert('Select a widget first.', 'Reset Widget');
            return;
        }
        const confirmed = await CustomDialog.confirm(
            'Reset style and behavior settings on this widget to defaults? Name, position, size, page, visibility, lock, and bindings are kept.',
            'Reset to Default'
        );
        if (!confirmed) return;
        if (!widget.overrides || typeof widget.overrides !== 'object') {
            widget.overrides = {};
        }
        const beforeOverrides = this._cloneJson(widget.overrides);
        const beforePreset = this._captureAppliedPresetRec(widget.id);
        Object.keys(widget.overrides).forEach((key) => {
            if (!this._widgetPresetResetExcludedKeys.has(key)) {
                delete widget.overrides[key];
            }
        });
        this._setWidgetPresetDropdownValue('', 'Select Preset...', { clearVariant: true });
        this._refreshWidgetAfterPresetChange(widget);
        this._recordWidgetOverridesReplace(
            widget.id,
            beforeOverrides,
            this._cloneJson(widget.overrides),
            beforePreset,
            this._captureAppliedPresetRec(widget.id)
        );
    },

    exportTemplateLocal: async function () {
        const currentKind = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS
            && this.isFullThemeKeyCached(MASTER_SETTINGS.theme)) ? 'full' : 'adjustment';
        const picked = await this.promptThemeSaveAs({
            title: 'Export Theme',
            okLabel: 'Export',
            name: this.activeFileName || 'New Theme',
            themeKind: currentKind
        });
        if (!picked) return;

        this.activeFileName = picked.name;
        const data = this._serializeTemplate(picked.name, {
            themeKind: picked.themeKind,
            previewImage: picked.previewImage
        });
        StorageRegistry.get('local').save('template', picked.name, data);
    },

    importTemplateLocal: function () {
        StorageRegistry.get('local').load('template')
            .then(result => {
                // Handle new local-provider signature { data, filename }
                const data = result.data || result;
                const filename = result.filename ? result.filename.replace(/\.json$/i, '') : null;

                if (data.master || data.settings) {
                    const migrated = (typeof DashboardMigrator !== 'undefined' && typeof DashboardMigrator.migrateTheme === 'function')
                        ? DashboardMigrator.migrateTheme(data)
                        : data;
                    this._applyThemeSettings(migrated.master || data.settings);
                    if (filename) this.activeFileName = filename;
                    this.markUnsaved();
                } else {
                    CustomDialog.alert("Invalid theme file format.", "Error");
                }
            })
            .catch(err => {
                if (err) CustomDialog.alert(err.message, "Import Error");
            });
    },

    saveTemplateToServer: async function () {
        const currentKind = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS
            && this.isFullThemeKeyCached(MASTER_SETTINGS.theme)) ? 'full' : 'adjustment';
        const picked = await this.promptThemeSaveAs({
            title: 'Save Theme',
            okLabel: 'Save',
            name: this.activeFileName || 'New Theme',
            themeKind: currentKind
        });
        if (!picked) return;
        if (picked.exists) {
            const ok = await CustomDialog.confirm('Overwrite "' + picked.name + '"?', 'Save Theme');
            if (!ok) return;
        }

        const data = this._serializeTemplate(picked.name, {
            themeKind: picked.themeKind,
            previewImage: picked.previewImage
        });
        const provider = StorageRegistry.get('server');
        if (!provider) { await CustomDialog.alert("Server unavailable", "Error"); return; }

        provider.save('template', picked.name, data)
            .then(() => {
                this.activeFileName = picked.name;
                this._getUserThemeKindCache()[picked.name] = picked.themeKind;
                this._cachedUserTemplates = null;
                void this.refreshTemplateDropdown();
                CustomDialog.alert(`Theme '${picked.name}' saved!`, "Success");
            })
            .catch(err => CustomDialog.alert(`Save failed: ${err.message}`, "Error"));
    },

    openTemplateFromServer: async function () {
        const provider = StorageRegistry.get('server');
        if (!provider) { await CustomDialog.alert("Server unavailable", "Error"); return; }

        provider.list('template')
            .then(async list => {
                if (!list || list.length === 0) { await CustomDialog.alert("No themes found.", "Info"); return; }
                let msg = "Available Themes:\n";
                list.forEach((item, i) => msg += `${i + 1}. ${item.name}\n`);
                msg += "\nEnter number to load:";

                const selection = await CustomDialog.prompt(msg, "", "Load Theme");
                if (!selection) return;

                const idx = parseInt(selection) - 1;
                if (!isNaN(idx) && list[idx]) {
                    const nameToLoad = list[idx].id || list[idx].name;
                    this.showLoading(nameToLoad);
                    provider.load('template', nameToLoad)
                        .then(data => {
                            if (data && (data.master || data.settings)) {
                                const migrated = (typeof DashboardMigrator !== 'undefined' && typeof DashboardMigrator.migrateTheme === 'function')
                                    ? DashboardMigrator.migrateTheme(data)
                                    : data;
                                this._applyThemeSettings(migrated.master || data.settings);
                                this.activeFileName = nameToLoad.replace(/\.json$/i, '');
                                this.markUnsaved();
                            }
                        })
                        .finally(() => this.hideLoading());
                }
            })
            .catch(err => console.error(err));
    },

    _serializeDashboard: function () {
        if (typeof Editor !== 'undefined' && typeof Editor.flushPendingTextPreview === 'function') {
            Editor.flushPendingTextPreview();
        }
        const nestedMaster = (typeof MasterLayout !== 'undefined' && typeof MasterLayout.nestMasterForSave === 'function')
            ? MasterLayout.nestMasterForSave(MASTER_SETTINGS)
            : MASTER_SETTINGS;
        const data = {
            version: window.DASHBOARD_VERSION || "1.1.4",
            master: this._cleanObject(nestedMaster),
            globalBindings: this._cleanObject(this.globalBindings),
            widgets: {}
        };
        this.cleanupInvalidGroups();
        const groupedWidgetIds = new Set();

        if (Object.keys(this.groups || {}).length > 0) {
            data.groups = {};
            Object.keys(this.groups).forEach(groupId => {
                const group = this.groups[groupId];
                const groupWidgetIds = this.getGroupMemberIds(groupId);
                if (groupWidgetIds.length < 2) return;

                const nestedWidgets = {};
                groupWidgetIds.forEach(widgetId => {
                    const widget = this.widgets[widgetId];
                    if (!widget) return;
                    const type = Object.keys(WidgetRegistry.widgets).find(key => widget instanceof WidgetRegistry.widgets[key]);
                    if (!type) return;
                    nestedWidgets[widgetId] = {
                        type: type,
                        overrides: this._overridesForPersist(type, widgetId, widget.overrides || {}),
                        bindings: this._persistBindings(widget.bindings)
                    };
                    groupedWidgetIds.add(widgetId);
                });
                if (Object.keys(nestedWidgets).length < 2) return;

                data.groups[groupId] = {
                    id: groupId,
                    name: String(group.name || groupId),
                    locked: group.locked === true,
                    visible: group.visible !== false,
                    bindings: this._cleanObject(this._cloneJson(this._sanitizeGroupBindingsForStorage(group.bindings))),
                    overridePage: this._normalizeGroupOverridePage(group.overridePage),
                    dimBackgroundWhenVisible: group.dimBackgroundWhenVisible === true,
                    widgets: nestedWidgets
                };
                const extras = this._groupExtrasForStorage(group);
                if (extras.layout) data.groups[groupId].layout = extras.layout;
                if (extras.composite) data.groups[groupId].composite = extras.composite;
            });
            if (Object.keys(data.groups).length === 0) {
                delete data.groups;
            }
        }

        Object.keys(this.widgets).forEach(k => {
            if (groupedWidgetIds.has(k)) return;
            const w = this.widgets[k];
            const type = Object.keys(WidgetRegistry.widgets).find(key => w instanceof WidgetRegistry.widgets[key]);
            if (type) {
                data.widgets[k] = {
                    type: type,
                    overrides: this._overridesForPersist(type, k, w.overrides || {}),
                    bindings: this._persistBindings(w.bindings)
                };
            }
        });

        const usedGroupIds = this.collectSelectionGroupIdsFromLiveDashboard();
        const prunedGroups = {};
        usedGroupIds.forEach((id) => {
            prunedGroups[id] = {
                allowEmptySelection: this.getSelectionGroupAllowEmpty(id)
            };
        });
        this.selectionGroups = prunedGroups;
        data.selectionGroups = this._cleanObject(prunedGroups);
        if (Object.keys(data.selectionGroups).length === 0) {
            delete data.selectionGroups;
        }

        return data;
    },

    exportDashboardLocal: async function () {
        await this._whenEditorStackReady();
        const data = this._serializeDashboard();
        const exportName = this.activeFileName || 'dashboard';
        StorageRegistry.get('local').save('dashboard', exportName, data);
        this.hasUnsavedChanges = false;
        this.updateFileIndicator();
    },

    importDashboardLocal: async function () {
        if (this.hasUnsavedChanges) {
            const confirmed = await CustomDialog.confirm("Unsaved changes will be lost by importing.\n\nContinue?", "Import Dashboard");
            if (!confirmed) return;
        }

        StorageRegistry.get('local').load('dashboard')
            .then(result => {
                // Handle new local-provider signature { data, filename }
                const data = result.data || result;
                const filename = result.filename ? result.filename.replace(/\.json$/i, '') : null;

                if ((data.settings || data.master) && !data.widgets) {
                    CustomDialog.alert("This appears to be a Theme, not a Dashboard.", "Warning");
                    return;
                }
                this.showLoading(filename || "Importing...");
                const dash = this;
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        void (async function () {
                            try {
                                await dash.loadDashboardData(data);
                                if (filename) dash.activeFileName = filename;
                                dash.updateFileIndicator();
                                dash.clearUrlParams();
                            } catch (e) {
                                console.error("Error loading dashboard data:", e);
                                CustomDialog.alert("Failed to load dashboard data.", "Error");
                            } finally {
                                dash.hideLoading();
                            }
                        })();
                    });
                });
            })
            .catch(err => {
                if (err) CustomDialog.alert(err.message, "Import Error");
            });
    },

    saveDashboardToServer: async function () {
        const defaultName = this.activeFileName || "New Dashboard";
        const name = await CustomDialog.prompt("Save Dashboard to Server (Name):", defaultName, "Save Dashboard");
        if (!name) return;

        await this._whenEditorStackReady();
        const data = this._serializeDashboard();
        const provider = StorageRegistry.get('server');
        if (!provider) { await CustomDialog.alert("Server storage not available.", "Error"); return; }

        provider.save('dashboard', name, data)
            .then(() => {
                this.activeFileName = name;
                this.hasUnsavedChanges = false;
                this.updateFileIndicator();
                CustomDialog.alert(`Dashboard '${name}' saved to server!`, "Success");
            })
            .catch(err => CustomDialog.alert(`Save failed: ${err.message}`, "Error"));
    },

    openDashboardFromServer: async function () {
        const provider = StorageRegistry.get('server');
        if (!provider) { await CustomDialog.alert("Server storage not available.", "Error"); return; }

        provider.list('dashboard')
            .then(async list => {
                if (!list || list.length === 0) {
                    await CustomDialog.alert("No dashboards found on server.", "Info");
                    return;
                }

                let msg = "Available Dashboards:\n";
                list.forEach((item, i) => msg += `${i + 1}. ${item.name}\n`);
                msg += "\nEnter number to load:";

                const selection = await CustomDialog.prompt(msg, "", "Load Dashboard");
                if (!selection) return;

                const idx = parseInt(selection) - 1;

                if (!isNaN(idx) && list[idx]) {
                    const nameToLoad = list[idx].name || list[idx].id;
                    this.showLoading(nameToLoad);
                    provider.load('dashboard', nameToLoad)
                        .then(data => {
                            if (data) {
                                const dash = this;
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        void (async function () {
                                            try {
                                                await dash.loadDashboardData(data);
                                                dash.activeFileName = nameToLoad.replace(/\.json$/i, '');
                                                dash.clearUrlParams();
                                            } catch (e) {
                                                console.error("Error loading dashboard data:", e);
                                                CustomDialog.alert("Failed to load dashboard data.", "Error");
                                            } finally {
                                                dash.hideLoading();
                                            }
                                        })();
                                    });
                                });
                            } else {
                                this.hideLoading();
                            }
                        })
                        .catch(err => {
                            console.error("Load Error:", err);
                            this.hideLoading();
                        });
                }
            })
            .catch(err => console.error("Server Open Error:", err));
    },

    loadDashboardData: async function (rawData) {
        const loadStart = performance.now();
        this.lastLoadedRawData = rawData;
        this.clearHistory();
        this._cancelStaleSessionTimers();
        // Demand-loaded runtime pieces: widget scripts / markdown for types this file uses
        // (viewer boots lean, and remote reload or file open can introduce new types), and
        // migrator.js (~230 KB) only when the file actually needs upgrading.
        if (typeof WidgetScriptLoader !== 'undefined') {
            const lateJobs = [WidgetScriptLoader.ensureRuntimeForData(rawData)];
            if (typeof DashboardMigrator === 'undefined' && WidgetScriptLoader.needsMigration(rawData)) {
                lateJobs.push(WidgetScriptLoader.ensureMigratorScript());
            }
            await Promise.all(lateJobs).catch((e) => {
                console.error('[Dashboard] Late script load failed, loading file as-is:', e);
            });
        }
        const migrationResult = typeof DashboardMigrator !== 'undefined'
            ? DashboardMigrator.migrate(rawData)
            : { migrated: false, dataMutated: false, data: rawData };

        const data = migrationResult.data;

        // Only semantic migrations (real schema upgrades) mark the dashboard dirty on load.
        // Silent in-memory fixes (e.g. master normalization) must not show Draft/Edited or block switching files.
        if (migrationResult.migrated === true) {
            this.hasUnsavedChanges = true;
            this.updateFileIndicator();
        } else {
            this.hasUnsavedChanges = false;
            this.updateFileIndicator();
        }

        const sourceVersion = String(data.version || '1.0.0');
        const targetVersion = String(window.DASHBOARD_VERSION || '1.1.4');
        const isNewerDashboard = this._compareVersions(sourceVersion, targetVersion) > 0;

        if (migrationResult.migrated) {
            this.hideLoading();
            const esc = function (s) {
                return String(s == null ? '' : s)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            };
            const labels = Array.isArray(migrationResult.appliedChangeLabels) ? migrationResult.appliedChangeLabels : [];
            const bulletList = labels.length
                ? `<ul>${labels.map((label) => `<li>${esc(label)}</li>`).join('')}</ul>`
                : '';
            const msg = `This dashboard was created in an older version (v${esc(migrationResult.originalVersion)}).<br><br>` +
                `It has been automatically upgraded to v${esc(migrationResult.newVersion)} to ensure compatibility with the latest features.` +
                (bulletList ? `<br>${bulletList}` : '') +
                `<br>Please save this dashboard to permanently apply these updates.`;
            await CustomDialog.alert(msg, "Dashboard Upgraded", {
                allowHtml: true,
                messageClassName: 'migration-details'
            });
        }
        if (isNewerDashboard) {
            this.hideLoading();
            await CustomDialog.alert(`This dashboard was created in a newer Dashboard Studio version (v${sourceVersion}). Some settings may not be available in v${targetVersion}.`, "Newer Version");
        }

        const dashboardImageUrlsForPreload = this._collectDashboardImageUrls(data);

        // Clear out existing MASTER_SETTINGS to prevent property leakage across loads
        const pluginSettings = WidgetRegistry.getGlobalSettings();
        const currentDriver = MASTER_SETTINGS.dataDriver;
        const currentDriverSettings = MASTER_SETTINGS.driverSettings;

        Object.keys(MASTER_SETTINGS).forEach(key => delete MASTER_SETTINGS[key]);
        Object.assign(MASTER_SETTINGS, pluginSettings);

        // Preserve driver connectivity across loads
        MASTER_SETTINGS.dataDriver = currentDriver;
        MASTER_SETTINGS.driverSettings = currentDriverSettings;

        const targetDriver = (data && data.master && data.master.connection && data.master.connection.dataDriver)
            || pluginSettings.dataDriver;
        if (currentDriver && targetDriver && currentDriver !== targetDriver) {
            this.liveData = Object.create(null);
            this._longestTopicWidth = 300;
        }

        // Destroy old widgets before applying global settings to prevent useless N*M re-renders of soon-to-be-deleted widgets
        this._cancelOffPageWarmup();
        this._cancelStaleSessionTimers();
        Object.values(this.widgets).forEach(w => w.destroy());
        this.widgets = {};
        this._resetGroupState();
        this._pruneLiveDataIfExceeded();
        if (this.topicMeta) this.topicMeta = {};

        // Install new globalBindings BEFORE updateGlobal / ensureDataDriver so the first
        // synchronous driver tick (fired by connect() or updateSettings() inside the
        // same sync frame) binds live topic values onto MASTER_SETTINGS correctly.
        // Clearing first prevents stale bindings from the previous dashboard leaking in.
        this.globalBindings = (data.globalBindings && typeof data.globalBindings === 'object')
            ? data.globalBindings
            : {};

        if (data.master && typeof data.master === 'object') {
            if (typeof MasterLayout !== 'undefined' && typeof MasterLayout.expandMasterToFlat === 'function') {
                const flatMaster = MasterLayout.expandMasterToFlat(data.master);
                this.updateGlobal(flatMaster, false, true);
            } else {
                this.updateGlobal(data.master, false, true);
            }
        } else if (typeof MasterLayout !== 'undefined' && typeof MasterLayout.defaultThemeColors === 'function') {
            MASTER_SETTINGS.themeColors = MasterLayout.defaultThemeColors();
        }
        this.resetThemeHueShift();
        if (typeof DashboardDialog !== 'undefined' && typeof DashboardDialog.ensureMasterDefaults === 'function') {
            DashboardDialog.ensureMasterDefaults();
        }
        delete MASTER_SETTINGS.resetLookOnThemeApply;
        this._restoreMissingMasterCodeDefaults();
        this._syncInactivityPageWatch();
        this._syncGestureControls();
        this._applyStartupPageChoice();

        this._applySelectionGroupsFromData(data);

        // Reconcile the live driver with the dashboard's desired driver. For simulation
        // this runs a synchronous first tick so Dashboard.liveData is populated BEFORE
        // widgets are instantiated below - no empty first render, no setTimeout gap.
        this.ensureDataDriver();

        if (data.widgets) {
            Object.keys(data.widgets).forEach(k => {
                const wData = data.widgets[k];
                let type = wData.type;
                if (type === 'textbox') type = 'list';

                if (this.isWidgetHidden(type)) {
                    console.warn(`Skipping hidden widget type: ${type}`);
                    return;
                }

                if (WidgetRegistry.get(type)) {
                    this.createWidget(type, k, wData.overrides, wData.bindings || {}, true);
                } else {
                    console.warn(`Skipping unknown widget type: ${type}`);
                }
            });
        }

        if (data.groups && typeof data.groups === 'object') {
            Object.keys(data.groups).forEach(groupId => {
                const groupData = data.groups[groupId];
                if (!groupData || typeof groupData !== 'object') return;
                const nestedWidgets = (groupData.widgets && typeof groupData.widgets === 'object') ? { ...groupData.widgets } : {};
                if (Object.keys(nestedWidgets).length === 0 && Array.isArray(groupData.memberIds)) {
                    groupData.memberIds.forEach(widgetId => {
                        if (typeof widgetId !== 'string' || !widgetId) return;
                        if (!data.widgets || !data.widgets[widgetId]) return;
                        nestedWidgets[widgetId] = data.widgets[widgetId];
                        delete data.widgets[widgetId];
                    });
                }
                const groupWidgetMap = {};

                Object.keys(nestedWidgets).forEach(widgetId => {
                    const widgetData = nestedWidgets[widgetId];
                    if (!widgetData || typeof widgetData !== 'object') return;
                    let type = widgetData.type;
                    if (type === 'textbox') type = 'list';
                    if (this.isWidgetHidden(type)) return;
                    if (!WidgetRegistry.get(type)) return;
                    this.createWidget(type, widgetId, widgetData.overrides, widgetData.bindings || {}, true);
                    groupWidgetMap[widgetId] = true;
                });

                const loadedGroup = {
                    id: groupId,
                    name: String(groupData.name || groupId),
                    locked: groupData.locked === true,
                    visible: groupData.visible !== false,
                    bindings: this._sanitizeGroupBindingsForStorage(groupData.bindings),
                    overridePage: this._normalizeGroupOverridePage(groupData.overridePage),
                    dimBackgroundWhenVisible: !!(groupData && groupData.dimBackgroundWhenVisible === true),
                    widgets: groupWidgetMap
                };
                const extras = this._groupExtrasForStorage(groupData);
                if (extras.layout) loadedGroup.layout = extras.layout;
                if (extras.composite) loadedGroup.composite = extras.composite;
                this.groups[groupId] = loadedGroup;
            });
            this._normalizeGroups();
            if (this._isResponsiveLayoutMode()) {
                this._refreshAllGroupCompositeBounds();
            }
        }

        this.loadFonts();

        if (this.isEditMode) {
            Editor.refreshDropdown(this.widgets);
        }
        this.selectWidget(null);
        this._refreshEditorPageIndicator();

        this.scheduleMenuOutputStatusSync();
        this.scheduleCurrentPageOutputTopicPublish();

        // Modal z-index map must exist before group-member renders, otherwise dim overlay stacks above the group.
        this._syncGroupBackdropOverlays();
        this.refreshAllGroupsVisibility();

        if (this._isResponsiveLayoutMode()) {
            this._refreshAllGroupCompositeBounds();
            this._renderAllGroupComposites();
            const self = this;
            this._compositeLayoutTimerSet(function () {
                self._runResponsiveLayoutSync(true);
            }, 50);
        }

        void this._runDashboardImagePreload(dashboardImageUrlsForPreload);

        this.hydrateWidgetsFromLiveData();

        if (typeof DashboardAudio !== 'undefined' && typeof DashboardAudio.notifyDashboardReady === 'function') {
            DashboardAudio.notifyDashboardReady();
        }

        if (typeof QuickToolbar !== 'undefined' && typeof QuickToolbar.resetAfterLoad === 'function') {
            QuickToolbar.resetAfterLoad();
        }

        this._installEditorZoomFromSettings();

        this.lastDashboardLoadDurationMs = Math.round((performance.now() - loadStart) * 100) / 100;
        if (typeof PerfTester === 'undefined') {
            this.lastLoadedRawData = null;
        }
        this._scheduleOffPageWarmup();
    },

    resetDashboard: async function () {
        if (this.hasUnsavedChanges) {
            const proceed = await CustomDialog.confirm(
                "This dashboard has unsaved changes. Resetting the canvas will discard those changes permanently. Are you sure you want to continue?",
                "Unsaved Changes"
            );
            if (!proceed) return;
        }

        let wizardResult = { action: 'skip', editorMode: 'advanced', layoutMode: 'fixed', themeKey: 'default_dark' };
        if (typeof ResetCanvasWizard !== 'undefined' && typeof ResetCanvasWizard.open === 'function') {
            wizardResult = await ResetCanvasWizard.open();
        }
        if (!wizardResult || wizardResult.action === 'cancel') {
            return;
        }

        const editorMode = wizardResult.editorMode === 'advanced' ? 'advanced' : 'basic';
        const layoutMode = (wizardResult.layoutMode === 'scale' || wizardResult.layoutMode === 'responsive')
            ? wizardResult.layoutMode
            : 'fixed';
        const themeKey = wizardResult.themeKey || 'default_dark';

        this.showLoading("Built-in");

        try {
            const res = await fetch(this._authenticatedAssetUrl('dashboards/factorydefault.json'));
            if (res.ok) {
                const data = await res.json();
                await this.loadDashboardData(data);
            } else {
                console.warn("[Dashboard] dashboards/factorydefault.json not found, loading empty state.");
                await this.loadDashboardData({ master: {}, globalBindings: {}, widgets: {} });
            }
        } catch (e) {
            console.error("[Dashboard] Error fetching factorydefault.json:", e);
            await this.loadDashboardData({ master: {}, globalBindings: {}, widgets: {} });
        }

        if (typeof ThemeExplorer !== 'undefined' && typeof ThemeExplorer.applyKey === 'function') {
            const applied = await ThemeExplorer.applyKey(themeKey, { isSystem: true, skipEditorReload: true, updateDropdown: true });
            if (!applied && themeKey !== 'default_dark') {
                await ThemeExplorer.applyKey('default_dark', { isSystem: true, skipEditorReload: true, updateDropdown: true });
            }
        } else if (typeof this.loadTemplate === 'function') {
            this.loadTemplate(themeKey);
        }

        const globalPatch = { editorMode: editorMode, layoutMode: layoutMode };
        if (layoutMode === 'responsive') {
            const defs = (typeof MASTER_CODE_DEFAULTS === 'object' && MASTER_CODE_DEFAULTS) ? MASTER_CODE_DEFAULTS : {};
            globalPatch.layoutResponsiveColumnCount = defs.layoutResponsiveColumnCount;
            globalPatch.layoutResponsiveMinSize = defs.layoutResponsiveMinSize;
            globalPatch.layoutResponsiveMinWidgetHeight = defs.layoutResponsiveMinWidgetHeight;
            if (wizardResult.action !== 'apply') globalPatch.canvasWidth = 1920;
        }
        if (wizardResult.action === 'apply') {
            const canvasWidth = Number(wizardResult.canvasWidth);
            const canvasHeight = Number(wizardResult.canvasHeight);
            if (isFinite(canvasWidth)) globalPatch.canvasWidth = canvasWidth;
            if (isFinite(canvasHeight)) globalPatch.canvasHeight = canvasHeight;
            if (wizardResult.canvasPreset) globalPatch.canvasPreset = wizardResult.canvasPreset;
        }
        this.updateGlobal(globalPatch, false, true);
        if (wizardResult.dataDriver) {
            const liveDriver = (typeof DataDriverRegistry !== 'undefined' && typeof DataDriverRegistry.getType === 'function')
                ? DataDriverRegistry.getType()
                : MASTER_SETTINGS.dataDriver;
            if (String(liveDriver || '').toLowerCase() !== String(wizardResult.dataDriver).toLowerCase()) {
                this.updateGlobal({ dataDriver: wizardResult.dataDriver }, true, false);
            }
        }
        if (typeof Editor !== 'undefined' && typeof Editor.applyUiModeChrome === 'function') {
            Editor.applyUiModeChrome();
        }

        this.hasUnsavedChanges = false;
        this.activeFileName = null;
        this.updateFileIndicator();
        var gallerySpecs = (wizardResult && wizardResult.widgets && wizardResult.widgets.length)
            ? wizardResult.widgets
            : null;
        if (gallerySpecs && typeof AutoWidgetGallery !== 'undefined' && typeof AutoWidgetGallery.place === 'function') {
            try {
                AutoWidgetGallery.place(gallerySpecs);
            } catch (galleryErr) {
                console.error('[Dashboard] Auto-Widget Gallery placement failed:', galleryErr);
            }
        }
        this.hideLoading();
        this.clearUrlParams();
    },

    clearUrlParams: function () {
        if (window.history && window.history.replaceState) {
            const url = new URL(window.location.href);
            const token = url.searchParams.get('token');
            const testMode = url.searchParams.get('test_mode');
            const newUrl = new URL(window.location.origin + window.location.pathname);
            if (token) {
                newUrl.searchParams.set('token', token);
            }
            if (testMode === 'full' || testMode === 'performance') {
                newUrl.searchParams.set('test_mode', testMode);
            }
            window.history.replaceState({}, document.title, newUrl.toString());
        }
    },

    resetWidgetColors: async function () {
        if (!await CustomDialog.confirm("Reset ALL widget colors to defaults?", "Reset Colors")) return;

        Object.values(this.widgets).forEach(w => {
            const common = BaseWidget.COMMON_SCHEMA || [];
            const specific = w.getSchema() || [];
            const fullSchema = [...common, ...specific];

            const colorKeys = [];
            fullSchema.forEach(group => {
                if (group.fields) {
                    group.fields.forEach(field => {
                        if (field.type === 'color') {
                            colorKeys.push(field.key);
                        }
                    });
                }
            });

            let modified = false;
            colorKeys.forEach(key => {
                if (w.overrides.hasOwnProperty(key)) {
                    delete w.overrides[key];
                    modified = true;
                }
            });
            if (modified) {
                w.update(w.overrides, true);
            }
        });

        this.markUnsaved();
        if (typeof Editor !== 'undefined' && Editor.currentId && Editor.currentId !== 'MULTIPLE' && this.widgets[Editor.currentId]) {
            Editor.loadWidget(Editor.currentId);
        }
    },

    /**
     * Copy color-like string values from dashboards/factorydefault.json (nested master, expanded flat)
     * onto existing MASTER_SETTINGS keys; aligns globals/widget defaults with factory @tokens.
     */
    resetGlobalDefaultColorsToFactoryTokens: async function () {
        if (!await CustomDialog.confirm(
            'Replace global master color values (environment, typography, container, and widget default color fields) with those from factorydefault.json? Per-widget instance overrides are not changed.',
            'Reset all widget default colors to theme colors'
        )) return;

        try {
            const res = await fetch(this._authenticatedAssetUrl('dashboards/factorydefault.json'));
            if (!res.ok) throw new Error(res.statusText || String(res.status));
            const data = await res.json();
            const master = data && data.master;
            if (!master || typeof master !== 'object') {
                throw new Error('factorydefault.json: missing master');
            }
            if (typeof MasterLayout === 'undefined' || typeof MasterLayout.expandMasterToFlat !== 'function') {
                throw new Error('MasterLayout.expandMasterToFlat unavailable');
            }

            const canon = MasterLayout.expandMasterToFlat(master);
            const skipRoot = new Set(['themeColors', '_masterLayoutVersion']);
            const payload = {};

            Object.keys(canon).forEach((key) => {
                if (skipRoot.has(key)) return;
                if (!Object.prototype.hasOwnProperty.call(MASTER_SETTINGS, key)) return;
                const val = canon[key];
                if (typeof val !== 'string') return;
                const t = String(val).trim();
                if (!t) return;
                if (MasterLayout.isThemeTokenReference(t)) {
                    payload[key] = val;
                    return;
                }
                if (typeof ColorUtils !== 'undefined' && ColorUtils.parse(t)) {
                    payload[key] = val;
                }
            });

            if (Object.keys(payload).length === 0) {
                await CustomDialog.alert('No overlapping color fields found to update.', 'Reset master colors');
                return;
            }

            this.updateGlobal(payload, false, false);

            if (typeof EditorColorPicker !== 'undefined' && typeof EditorColorPicker.refreshUsedCustomSwatches === 'function') {
                EditorColorPicker.refreshUsedCustomSwatches();
            }
        } catch (e) {
            console.error('[Dashboard] resetGlobalDefaultColorsToFactoryTokens:', e);
            await CustomDialog.alert(String(e && e.message ? e.message : e), 'Reset master colors');
        }
    },

    resetSelectedWidgetColors: async function () {
        if (this.selectedIds.length === 0) return;

        if (!await CustomDialog.confirm("Reset colors for selected widget(s) to defaults?", "Reset Colors")) return;

        let anyModified = false;
        this.selectedIds.forEach(id => {
            const w = this.widgets[id];
            if (!w) return;
            const common = BaseWidget.COMMON_SCHEMA || [];
            const specific = w.getSchema() || [];
            const fullSchema = [...common, ...specific];

            const colorKeys = [];
            fullSchema.forEach(group => {
                if (group.fields) {
                    group.fields.forEach(field => {
                        if (field.type === 'color') {
                            colorKeys.push(field.key);
                        }
                    });
                }
            });

            let modified = false;
            colorKeys.forEach(key => {
                if (w.overrides.hasOwnProperty(key)) {
                    delete w.overrides[key];
                    modified = true;
                    anyModified = true;
                }
            });

            if (modified) {
                w.update(w.overrides, true);
            }
        });

        if (anyModified) {
            if (typeof Editor !== 'undefined' && Editor.currentId !== 'MULTIPLE') Editor.loadWidget(Editor.currentId);
            this.markUnsaved();
        }
    },

    loadStartupConfig: function () {
        let explicitConfig;
        let configName;
        let pageOverride;
        let templateOverride;
        if (typeof WidgetScriptLoader !== 'undefined' && typeof WidgetScriptLoader.resolveStartupConfigName === 'function') {
            const resolved = WidgetScriptLoader.resolveStartupConfigName();
            explicitConfig = resolved.explicitConfig;
            configName = resolved.configName;
            pageOverride = resolved.pageOverride;
            templateOverride = resolved.templateOverride;
        } else {
            const params = new URLSearchParams(window.location.search);
            explicitConfig = params.get('dashboard') || params.get('cfg');
            configName = explicitConfig || 'dashboard';
            if (!configName.toLowerCase().endsWith('.json')) {
                configName += '.json';
            }
            pageOverride = params.get('page');
            templateOverride = params.get('template') || params.get('theme');
        }

        this.showLoading(configName);

        const applyLoadedData = async (data, loadedName) => {
            const finishStartup = () => {
                this.hideLoading();
                if (typeof DemoOnboarding !== 'undefined' && typeof DemoOnboarding.onBoot === 'function') {
                    DemoOnboarding.onBoot(loadedName);
                }
            };
            await this.loadDashboardData(data);
            this.initialDashboardLoadDurationMs = this.lastDashboardLoadDurationMs;
            console.log(`[Dashboard] Successfully loaded: dashboards/${loadedName}`);

            this.resyncHomeyLiveData({
                announceLoad: true,
                dashboardName: loadedName.replace(/\.json$/i, '')
            });

            // Don't set active file name to 'factorydefault' or 'demo.json' if falling back from missing explicitly requested dashboard
            // But DO set it to the requested config if we successfully loaded it
            if (loadedName === configName && configName !== 'factorydefault.json' && configName !== 'empty_state') {
                this.activeFileName = loadedName.replace(/\.json$/i, '');
            }

            // loadDashboardData already refreshed the tag while activeFileName was still unset; refresh after name is known.
            this.updateFileIndicator();

            if (pageOverride) {
                const p = parseInt(pageOverride);
                if (!isNaN(p)) {
                    this.updateGlobal({ currentPage: p });
                }
            }

            if (templateOverride) {
                let keyToLoad = null;
                const presetThemes = this._getPresetThemes();
                if (presetThemes) {
                    if (presetThemes[templateOverride]) {
                        keyToLoad = templateOverride;
                    } else {
                        keyToLoad = Object.keys(presetThemes).find(k =>
                            presetThemes[k].name === templateOverride ||
                            presetThemes[k].name.toLowerCase() === templateOverride.toLowerCase()
                        );
                    }
                    if (!keyToLoad) {
                        const slug = templateOverride.toLowerCase().replace(/\s+/g, '_');
                        if (presetThemes[slug]) keyToLoad = slug;
                    }
                }

                if (keyToLoad) {
                    this.loadTemplate(keyToLoad);
                    finishStartup();
                } else {
                    let tplFile = templateOverride;
                    if (!tplFile.toLowerCase().endsWith('.json')) tplFile += '.json';

                    console.log(`[Dashboard] Attempting to load theme file: templates/${tplFile}`);
                    try {
                        const tplUrl = this._authenticatedAssetUrl(`templates/${tplFile}`);
                        const res = (typeof ConfigLoader !== 'undefined' && typeof ConfigLoader.fetchWithRetry === 'function')
                            ? await ConfigLoader.fetchWithRetry(tplUrl)
                            : await fetch(tplUrl);
                        if (!res.ok) throw new Error("Theme file not found");
                        const tplData = await res.json();
                        if (tplData.master || tplData.settings) {
                            const migrated = (typeof DashboardMigrator !== 'undefined' && typeof DashboardMigrator.migrateTheme === 'function')
                                ? DashboardMigrator.migrateTheme(tplData)
                                : tplData;
                            this._applyThemeSettings(migrated.master || tplData.settings);
                            this.activeFileName = tplFile.replace(/\.json$/i, '');
                            console.log(`[Dashboard] Loaded theme file: ${tplFile}`);
                        }
                    } catch (err) {
                        console.warn(`[Dashboard] Could not load template '${templateOverride}':`, err.message);
                    } finally {
                        finishStartup();
                    }
                }
            } else {
                finishStartup();
            }
        };

        const fetchJson = (relativePath) => {
            const url = this._authenticatedAssetUrl(relativePath);
            const req = (typeof ConfigLoader !== 'undefined' && typeof ConfigLoader.fetchWithRetry === 'function')
                ? ConfigLoader.fetchWithRetry(url)
                : fetch(url);
            return req.then(response => {
                if (!response.ok) throw new Error("Config not found");
                return response.json();
            });
        };

        const attemptLoad = (filename) => {
            if (typeof dsDebug === 'function') dsDebug('[Dashboard] Attempting to load: dashboards/' + filename);
            return fetchJson('dashboards/' + filename);
        };

        const loadFallbackWidgets = () => {
            return attemptLoad('factorydefault.json')
                .then(data => applyLoadedData(data, 'factorydefault.json'))
                .catch(err => {
                    console.warn("[Dashboard] factorydefault.json not found, loading completely empty state.");
                    return applyLoadedData({ master: {}, globalBindings: {}, widgets: {} }, 'empty_state');
                });
        };

        const reportLoadFailure = (err) => {
            console.error("Dashboard failed to load:", err);
            this.hideLoading();
            const transient = typeof ConfigLoader !== 'undefined'
                && typeof ConfigLoader.isTransientFetchError === 'function'
                && ConfigLoader.isTransientFetchError(err);
            const msg = transient
                ? 'The browser refused the dashboard file after you returned with the Back button. Reload to try again.'
                : ('Critical Error loading dashboard:\n' + (err && err.message ? err.message : String(err)));
            if (transient && typeof CustomDialog !== 'undefined' && typeof CustomDialog.confirmWithLabels === 'function') {
                CustomDialog.confirmWithLabels(msg, 'Load Error', 'Reload', 'Close').then(function (ok) {
                    if (ok) window.location.reload();
                });
                return;
            }
            CustomDialog.alert(msg, transient ? 'Load Error' : 'Error');
        };

        // WidgetScriptLoader already fetched the dashboard JSON (same fallback chain as below)
        // and handed it over via the preload; re-fetching it would double the startup
        // round-trips. Consume once, then fall through to fetching on later calls.
        const preload = window.__DS_BOOT_PRELOAD__;
        if (preload && preload.data) {
            window.__DS_BOOT_PRELOAD__ = null;
            if (preload.missingExplicit) {
                CustomDialog.alert(`Could not load dashboard: ${configName}\n\nFalling back to empty state.`, "Load Error");
            }
            Promise.resolve(applyLoadedData(preload.data, preload.loadedName || configName))
                .catch(err => reportLoadFailure(err));
            return;
        }

        attemptLoad(configName)
            .then(data => applyLoadedData(data, configName))
            .catch(err => {
                if (err.message === "Config not found") {
                    console.warn(`[Dashboard] Configuration file 'dashboards/${configName}' not found.`);

                    if (explicitConfig) {
                        this.hideLoading();
                        CustomDialog.alert(`Could not load dashboard: ${configName}\n\nFalling back to empty state.`, "Load Error");
                        loadFallbackWidgets();
                    } else if (configName === 'dashboard.json') {
                        return attemptLoad('demo.json')
                            .then(demoData => applyLoadedData(demoData, 'demo.json'))
                            .catch(demoErr => {
                                console.warn("[Dashboard] Fallback 'dashboards/demo.json' also not found.");
                                this.hideLoading();
                                return loadFallbackWidgets();
                            });
                    } else {
                        this.hideLoading();
                        loadFallbackWidgets();
                    }
                } else {
                    reportLoadFailure(err);
                }
            });
    },

    _beginEditPointerGesture: function () {
        if (this._editPointerGestureDepth === 0) {
            this._editPointerGesturePrevUserSelect = document.body.style.userSelect || '';
            document.body.style.userSelect = 'none';
        }
        this._editPointerGestureDepth += 1;
    },

    _endEditPointerGesture: function () {
        if (this._editPointerGestureDepth <= 0) return;
        this._editPointerGestureDepth -= 1;
        if (this._editPointerGestureDepth === 0) {
            document.body.style.userSelect = this._editPointerGesturePrevUserSelect;
            this._editPointerGesturePrevUserSelect = '';
        }
    },

    _wantsAddToSelection: function (e) {
        return !!(e && e.shiftKey) || !!this._editAddToSelection;
    },

    _wantsSelectBehind: function (e) {
        if (this._wantsAddToSelection(e)) return false;
        const middle = e && e.button === 1;
        const altLeft = e && (e.button === 0 || e.pointerType !== 'mouse') && e.altKey;
        return !!(middle || altLeft || this._editSelectBehind);
    },

    _consumeSelectBehind: function () {
        if (!this._editSelectBehind) return;
        this._editSelectBehind = false;
        if (typeof QuickToolbar !== 'undefined' && QuickToolbar.syncEditToggles) {
            QuickToolbar.syncEditToggles();
        }
    },

    setEditAddToSelection: function (on) {
        this._editAddToSelection = !!on;
        if (this._editAddToSelection) this._editSelectBehind = false;
        if (typeof QuickToolbar !== 'undefined' && QuickToolbar.syncEditToggles) {
            QuickToolbar.syncEditToggles();
        }
    },

    armEditSelectBehind: function (on) {
        this._editSelectBehind = !!on;
        if (typeof QuickToolbar !== 'undefined' && QuickToolbar.syncEditToggles) {
            QuickToolbar.syncEditToggles();
        }
    },

    _startEditPointerCapture: function (e, el) {
        if (!el || typeof PointerDrag === 'undefined' || typeof PointerDrag.capture !== 'function') return;
        const self = this;
        this._editPointerCapture = PointerDrag.capture(e, el, {
            raf: false,
            onMove: function (ev) { self.handleMouseMove(ev); },
            onUp: function (ev) {
                self._editPointerCapture = null;
                self.handleMouseUp(ev);
            }
        });
    },

    _finishEditPointerGesture: function () {
        if (this._editPointerCapture && typeof this._editPointerCapture.finish === 'function') {
            this._editPointerCapture.finish();
            this._editPointerCapture = null;
            return;
        }
        this.handleMouseUp({ clientX: 0, clientY: 0 });
    },

    bindEvents: function () {
        window.addEventListener('blur', () => this._finishEditPointerGesture());

        document.addEventListener('selectstart', (e) => {
            if (!this.isEditMode) return;
            if (!this.dragState && !this.lasso) return;
            const canvas = document.getElementById('dashboard-canvas');
            if (canvas && canvas.contains(e.target)) e.preventDefault();
        }, true);

        document.addEventListener('dragstart', (e) => {
            if (!this.isEditMode) return;
            const canvas = document.getElementById('dashboard-canvas');
            if (canvas && canvas.contains(e.target)) e.preventDefault();
        }, true);
        document.addEventListener('keydown', (e) => {
            if (window.IS_VIEWER === true) return;

            if (!this._isTextInputTarget(e.target) && !this._isBlockingOverlayOpen()) {
                if (this._isEditToggleShortcut(e)) {
                    e.preventDefault();
                    this.toggleEditMode();
                    return;
                }
            }

            if (!this.isEditMode) return;

            if (this._isSaveShortcut(e)) {
                e.preventDefault();
                if (!this._isBlockingOverlayOpen()) this._openSaveOrExportDialog();
                return;
            }
            if (!this._isTextInputTarget(e.target) && !this._isBlockingOverlayOpen()) {
                if (this._isBackquoteKey(e) && !e.repeat && !e.altKey) {
                    e.preventDefault();
                    this.enterHoldLivePreview({ keepEditor: !!(e.ctrlKey || e.metaKey) });
                    return;
                }
            }

            if (this._isTextInputTarget(e.target)) return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) this.redo();
                else this.undo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                this.redo();
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                if (this.getEffectiveSelectionIds().length > 0) {
                    e.preventDefault();
                    this.copySelectionToClipboard();
                }
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
                if (this.getEffectiveSelectionIds().length > 0) {
                    e.preventDefault();
                    this.cutSelectionToClipboard();
                }
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                this.pasteFromClipboard();
                return;
            }

            if (this.selectedIds.length > 0) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    this.removeSelectedWidget();
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                    e.preventDefault();
                    this.duplicateWidget();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (window.IS_VIEWER === true) return;
            if (this._isBackquoteKey(e)) {
                this.exitHoldLivePreview();
                return;
            }
            if (this._holdLivePreviewActive && this._holdLivePreviewKeepEditor
                && (e.key === 'Control' || e.key === 'Meta')) {
                this.exitHoldLivePreview();
            }
        });

        window.addEventListener('blur', () => {
            this.exitHoldLivePreview();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.exitHoldLivePreview();
                this._setPageHidden(true);
                return;
            }
            this._setPageHidden(false);
            if (document.visibilityState !== 'visible') return;
            if (this._liveResyncVisibilityTimer) {
                clearTimeout(this._liveResyncVisibilityTimer);
                this._liveResyncVisibilityTimer = null;
            }
            this._liveResyncVisibilityTimer = setTimeout(() => {
                this._liveResyncVisibilityTimer = null;
                this.resyncHomeyLiveData({ throttled: true, resume: true });
            }, 300);
        });
        window.addEventListener('pageshow', (e) => {
            if (!e || !e.persisted) return;
            this._setPageHidden(false);
            this.resyncHomeyLiveData({ announceLoad: true, resume: true });
        });

        const canvas = document.getElementById('dashboard-canvas');
        if (canvas) {
            canvas.addEventListener('pointerdown', (e) => {
                if (!this.isEditMode) return;
                if (!this._isCanvasBackgroundPointerTarget(e, canvas)) return;
                let lassoRoot = null;
                if (this._isResponsiveLayoutMode() && this.openedGroupId && e.target && e.target.closest) {
                    lassoRoot = e.target.closest('.group-composite-stage');
                }
                this.handleCanvasMouseDown(e, lassoRoot);
            });

            // Handle clicks on the empty area outside the canvas to deselect (open Global Settings)
            let currentWrap = canvas.parentElement;
            while (currentWrap) {
                currentWrap.addEventListener('pointerdown', (e) => {
                    if (this.isEditMode && e.target === e.currentTarget && !this._wantsAddToSelection(e)) {
                        this.selectWidget(null);
                    }
                });
                if (currentWrap.tagName === 'BODY') break;
                currentWrap = currentWrap.parentElement;
            }
            document.addEventListener('pointerdown', (e) => {
                if (!this.isEditMode || this._wantsAddToSelection(e)) return;
                if (e.button !== 0) return;
                if (!this._isResponsiveOutsideCanvasPointer(e)) return;
                this.selectWidget(null);
                e.stopPropagation();
            }, true);
        }

        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    },

    handleCanvasMouseDown: function (e, lassoRoot) {
        if (!this.isEditMode) return;
        const canvasEl = document.getElementById('dashboard-canvas');
        if (!lassoRoot && !this._isCanvasBackgroundPointerTarget(e, canvasEl)) return;
        if (!this._isCanvasLassoAllowed(lassoRoot)) {
            if (!this._wantsAddToSelection(e)) this.selectWidget(null);
            return;
        }
        if (typeof PointerDrag !== 'undefined' && !PointerDrag.isPrimary(e) && e.button !== 0) return;
        e.preventDefault();
        this._beginEditPointerGesture();

        if (!this._wantsAddToSelection(e)) {
            this.selectWidget(null);
        }

        const root = lassoRoot || document.getElementById('dashboard-canvas');
        if (!root) return;
        const rect = root.getBoundingClientRect();
        const scale = this._canvasPointerScale();

        this.lasso = {
            startX: (e.clientX - rect.left) / scale,
            startY: (e.clientY - rect.top) / scale,
            root: root,
            addToSelection: this._wantsAddToSelection(e),
            el: document.createElement('div')
        };

        this.lasso.el.className = 'lasso-selection';
        this.lasso.el.style.position = 'absolute';
        this.lasso.el.style.border = '1px dashed #0ea5e9';
        this.lasso.el.style.backgroundColor = 'rgba(14, 165, 233, 0.1)';
        this.lasso.el.style.zIndex = '9999';
        this.lasso.el.style.left = this.lasso.startX + 'px';
        this.lasso.el.style.top = this.lasso.startY + 'px';
        this.lasso.el.style.width = '0px';
        this.lasso.el.style.height = '0px';
        this.lasso.el.style.pointerEvents = 'none';

        root.appendChild(this.lasso.el);
        this._startEditPointerCapture(e, root);
    },

    handleCanvasMouseMove: function (e) {
        if (!this.lasso) return;
        const root = this.lasso.root || document.getElementById('dashboard-canvas');
        const rect = root.getBoundingClientRect();
        const scale = this._canvasPointerScale();

        let currentX = (e.clientX - rect.left) / scale;
        let currentY = (e.clientY - rect.top) / scale;

        currentX = Math.max(0, Math.min(currentX, rect.width / scale));
        currentY = Math.max(0, Math.min(currentY, rect.height / scale));

        const minX = Math.min(this.lasso.startX, currentX);
        const minY = Math.min(this.lasso.startY, currentY);
        const width = Math.abs(currentX - this.lasso.startX);
        const height = Math.abs(currentY - this.lasso.startY);

        this.lasso.el.style.left = minX + 'px';
        this.lasso.el.style.top = minY + 'px';
        this.lasso.el.style.width = width + 'px';
        this.lasso.el.style.height = height + 'px';
    },

    handleCanvasMouseUp: function (e) {
        if (!this.lasso) return;
        const root = this.lasso.root || document.getElementById('dashboard-canvas');
        const rect = root.getBoundingClientRect();
        const scale = this._canvasPointerScale();

        let currentX = (e.clientX - rect.left) / scale;
        let currentY = (e.clientY - rect.top) / scale;

        const minX = Math.min(this.lasso.startX, currentX);
        const minY = Math.min(this.lasso.startY, currentY);
        const maxX = Math.max(this.lasso.startX, currentX);
        const maxY = Math.max(this.lasso.startY, currentY);

        const newSelection = (this.lasso.addToSelection || (e && e.shiftKey)) ? [...this.selectedIds] : [];

        Object.keys(this.widgets).forEach(id => {
            const w = this.widgets[id];
            if (!this.isWidgetVisibleInEditor(id)) return;
            if (!this._widgetCoversActivePage(id, w)) return;

            const wx1 = w.overrides.x;
            const wy1 = w.overrides.y;
            const wx2 = wx1 + BaseWidget.resolveInstanceWidth(w.overrides);
            const wy2 = wy1 + BaseWidget.resolveInstanceHeight(w.overrides);

            if (wx1 < maxX && wx2 > minX && wy1 < maxY && wy2 > minY) {
                if (!newSelection.includes(id)) newSelection.push(id);
            }
        });

        this.selectWidget(newSelection, false, true);

        if (this.lasso.el && this.lasso.el.parentNode === root) {
            root.removeChild(this.lasso.el);
        }
        this.lasso = null;
    },

    _getWidgetIdsAtPoint: function (clientX, clientY) {
        const entries = [];

        Object.keys(this.widgets).forEach(widgetId => {
            const widget = this.widgets[widgetId];
            if (!widget || !widget.elements || !widget.elements.wrapper) return;
            if (!this.isWidgetVisibleInEditor(widgetId)) return;

            const wrapper = widget.elements.wrapper;
            const rect = wrapper.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;

            const isInside =
                clientX >= rect.left &&
                clientX <= rect.right &&
                clientY >= rect.top &&
                clientY <= rect.bottom;
            if (!isInside) return;

            let domOrder = 0;
            const parent = wrapper.parentElement;
            if (parent && parent.children) {
                domOrder = Array.prototype.indexOf.call(parent.children, wrapper);
            }

            entries.push({
                id: widgetId,
                zIndex: this._getWidgetZIndex(widget),
                domOrder: domOrder
            });
        });

        entries.sort((a, b) => {
            if (a.zIndex === b.zIndex) return b.domOrder - a.domOrder;
            return b.zIndex - a.zIndex;
        });

        return entries.map(entry => entry.id);
    },

    /**
     * A closed group selects as one object. Overlapping members are one
     * middle-click step, otherwise the pointer stays on the top member and
     * the next step re-selects that same group.
     */
    _buildSelectBehindLayers: function (overlapIds) {
        const layers = [];
        const seenGroup = {};
        const collapseGroups = !this.openedGroupId;
        for (let i = 0; i < overlapIds.length; i++) {
            const id = overlapIds[i];
            if (collapseGroups) {
                const group = this.getGroupByWidgetId(id);
                if (group && group.id) {
                    if (seenGroup[group.id]) continue;
                    seenGroup[group.id] = true;
                    layers.push({ kind: 'group', groupId: group.id, id: id });
                    continue;
                }
            }
            layers.push({ kind: 'widget', id: id });
        }
        return layers;
    },

    _indexOfSelectBehindLayer: function (layers, widgetId) {
        if (!widgetId || !layers || !layers.length) return -1;
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (layer.id === widgetId) return i;
            if (layer.kind === 'group' && layer.groupId && this.groups) {
                const group = this.groups[layer.groupId];
                if (group && group.widgets && group.widgets[widgetId]) return i;
            }
        }
        return -1;
    },

    _selectBehindLayerIsCurrent: function (layer) {
        if (!layer) return false;
        if (layer.kind === 'group') return layer.groupId === this.selectedGroupId;
        return this.selectedIds.length === 1 && this.selectedIds[0] === layer.id;
    },

    _selectWidgetBehindAtPoint: function (clientX, clientY, fallbackWidgetId) {
        const overlapIds = this._getWidgetIdsAtPoint(clientX, clientY);
        if (overlapIds.length < 2) return false;

        const layers = this._buildSelectBehindLayers(overlapIds);
        if (!layers || layers.length < 2) return false;

        let currentIndex = -1;
        if (this.selectedIds.length === 1) {
            currentIndex = this._indexOfSelectBehindLayer(layers, this.selectedIds[0]);
        }
        if (currentIndex < 0 && this.selectedGroupId) {
            for (let i = 0; i < layers.length; i++) {
                if (layers[i].kind === 'group' && layers[i].groupId === this.selectedGroupId) {
                    currentIndex = i;
                    break;
                }
            }
        }
        if (currentIndex < 0) {
            currentIndex = this._indexOfSelectBehindLayer(layers, fallbackWidgetId);
        }
        if (currentIndex < 0) currentIndex = 0;

        for (let step = 1; step <= layers.length; step++) {
            const layer = layers[(currentIndex + step) % layers.length];
            if (!layer || !layer.id) continue;
            if (this._selectBehindLayerIsCurrent(layer)) continue;
            this.selectWidget(layer.id, false);
            return true;
        }
        return false;
    },

    _beginWidgetDragFromPointer: function (e, id, widget, compositeAuthoring) {
        if (e.target.classList.contains('resize-handle')) {
            if (this.selectedIds.length > 1) this.selectWidget(id, false);
            const resizeState = {
                mode: 'resize',
                id: id,
                dir: e.target.dataset.dir,
                startX: e.clientX,
                startY: e.clientY,
                startW: BaseWidget.resolveInstanceWidth(widget.overrides),
                startH: BaseWidget.resolveInstanceHeight(widget.overrides),
                startXPos: widget.overrides.x,
                startYPos: widget.overrides.y,
                startLegendOffX: widget.overrides.legendOffX,
                startLegendOffY: widget.overrides.legendOffY
            };
            if (compositeAuthoring) resizeState.compositeAuthoring = true;
            this._setDragState(resizeState);
        } else {
            const items = this.selectedIds.map(sid => {
                const w = this.widgets[sid];
                if (!w) return null;
                let startW;
                let startH;
                if (!compositeAuthoring && w.elements && w.elements.wrapper) {
                    startW = w.elements.wrapper.offsetWidth;
                    startH = w.elements.wrapper.offsetHeight;
                } else {
                    startW = BaseWidget.resolveInstanceWidth(w.overrides);
                    startH = BaseWidget.resolveInstanceHeight(w.overrides);
                }
                return {
                    id: sid,
                    startXPos: w.overrides.x,
                    startYPos: w.overrides.y,
                    startWidth: startW,
                    startHeight: startH,
                    startLegendOffX: w.overrides.legendOffX,
                    startLegendOffY: w.overrides.legendOffY
                };
            }).filter(Boolean);
            const moveState = {
                mode: 'move',
                primaryId: id,
                items: items,
                startX: e.clientX,
                startY: e.clientY,
                groupMinStartX: items.length ? Math.min(...items.map(item => item.startXPos)) : 0,
                groupMinStartY: items.length ? Math.min(...items.map(item => item.startYPos)) : 0,
                groupMaxStartX: items.length ? Math.max(...items.map(item => item.startXPos + item.startWidth)) : 0,
                groupMaxStartY: items.length ? Math.max(...items.map(item => item.startYPos + item.startHeight)) : 0
            };
            if (compositeAuthoring) moveState.compositeAuthoring = true;
            this._setDragState(moveState);
        }
        this._startEditPointerCapture(e, (widget.elements && widget.elements.wrapper) || e.currentTarget);
    },

    handleWidgetMouseDown: function (e, id) {
        if (!this.isEditMode) return;
        if (e && e.target && typeof e.target.closest === 'function' && e.target.closest('.widget-edit-label__help')) {
            return;
        }
        e.stopPropagation();

        // Drag and resize are disabled in responsive mode; only selection is allowed.
        // Exception: a member of an open composite group is in fixed-pixel authoring
        // mode and can be dragged/resized inside the group's design canvas.
        if ((MASTER_SETTINGS.layoutMode || 'fixed') === 'responsive') {
            const ctx = typeof this.getWidgetCompositeContext === 'function' ? this.getWidgetCompositeContext(id) : null;
            if (!ctx || !ctx.open) {
                if (this._wantsSelectBehind(e)) {
                    e.preventDefault();
                    this._selectWidgetBehindAtPoint(e.clientX, e.clientY, id);
                    this._consumeSelectBehind();
                    return;
                }
                if (this._wantsAddToSelection(e)) {
                    this.selectWidget(id, true);
                } else if (!this.selectedIds.includes(id) || this.selectedIds.length !== 1) {
                    this.selectWidget(id, false);
                }
                return;
            }
            if (this._wantsSelectBehind(e)) {
                e.preventDefault();
                this._selectWidgetBehindAtPoint(e.clientX, e.clientY, id);
                this._consumeSelectBehind();
                return;
            }
            if (this._wantsAddToSelection(e)) {
                this.selectWidget(id, true);
            } else if (!this.selectedIds.includes(id)) {
                this.selectWidget(id, false);
            }
            if (!this.selectedIds.includes(id)) return;
            const widget0 = this.widgets[id];
            if (widget0 && this.isWidgetEffectivelyLocked(id)) return;
            if (typeof PointerDrag !== 'undefined' && !PointerDrag.isPrimary(e) && e.button !== 0) return;
            e.preventDefault();
            this._beginEditPointerGesture();
            this._beginWidgetDragFromPointer(e, id, widget0, true);
            return;
        }

        if (this._wantsSelectBehind(e)) {
            e.preventDefault();
            this._selectWidgetBehindAtPoint(e.clientX, e.clientY, id);
            this._consumeSelectBehind();
            return;
        }

        if (this._wantsAddToSelection(e)) {
            this.selectWidget(id, true);
        } else if (!this.selectedIds.includes(id)) {
            this.selectWidget(id, false);
        }

        if (!this.selectedIds.includes(id)) return;

        const widget = this.widgets[id];
        if (!widget) return;

        if (this.isWidgetEffectivelyLocked(id)) {
            return;
        }

        if (typeof PointerDrag !== 'undefined' && !PointerDrag.isPrimary(e) && e.button !== 0) return;
        e.preventDefault();
        this._beginEditPointerGesture();
        this._beginWidgetDragFromPointer(e, id, widget, false);
    },

    handleMouseMove: function (e) {
        if (this.lasso) {
            this.handleCanvasMouseMove(e);
            return;
        }

        if (!this.dragState) return;

        if (!this._rafDragPending) {
            this._rafDragPending = true;
            this._dragEventCache = { clientX: e.clientX, clientY: e.clientY };
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(() => this._processDragFrame());
            } else {
                this._processDragFrame();
            }
        } else {
            this._dragEventCache = { clientX: e.clientX, clientY: e.clientY };
        }
    },

    _processDragFrame: function () {
        this._rafDragPending = false;
        if (!this.dragState || !this._dragEventCache) return;

        const clientX = this._dragEventCache.clientX;
        const clientY = this._dragEventCache.clientY;

        const rawGrid = Number(MASTER_SETTINGS.gridSize) || 1;
        const grid = Math.max(1, rawGrid);
        const scale = this._canvasPointerScale();
        const deltaX = (clientX - this.dragState.startX) / scale;
        const deltaY = (clientY - this.dragState.startY) / scale;

        if (this.dragState.mode === 'move') {
            let appliedDeltaX = deltaX;
            let appliedDeltaY = deltaY;

            if (MASTER_SETTINGS.snapToGrid) {
                const snappedGroupX = Math.round((this.dragState.groupMinStartX + deltaX) / grid) * grid;
                const snappedGroupY = Math.round((this.dragState.groupMinStartY + deltaY) / grid) * grid;
                appliedDeltaX = snappedGroupX - this.dragState.groupMinStartX;
                appliedDeltaY = snappedGroupY - this.dragState.groupMinStartY;
            }

            if (this.dragState.compositeAuthoring && this.openedGroupId) {
                const authoring = this._getCompositeAuthoringSize(this.openedGroupId);
                const boundsW = authoring.width;
                const boundsH = authoring.height;
                if (boundsW > 0 && boundsH > 0) {
                    const buffer = 20;
                    const groupWidth = this.dragState.groupMaxStartX - this.dragState.groupMinStartX;
                    const groupHeight = this.dragState.groupMaxStartY - this.dragState.groupMinStartY;

                    const minDeltaX = -buffer - this.dragState.groupMinStartX;
                    const maxDeltaX = boundsW - groupWidth + buffer - this.dragState.groupMinStartX;
                    const minDeltaY = -buffer - this.dragState.groupMinStartY;
                    const maxDeltaY = boundsH - groupHeight + buffer - this.dragState.groupMinStartY;

                    appliedDeltaX = Math.max(minDeltaX, Math.min(appliedDeltaX, maxDeltaX));
                    appliedDeltaY = Math.max(minDeltaY, Math.min(appliedDeltaY, maxDeltaY));
                }
            }

            this.dragState.items.forEach(item => {
                const widget = this.widgets[item.id];
                if (!widget) return;

                const newX = item.startXPos + appliedDeltaX;
                const newY = item.startYPos + appliedDeltaY;

                widget.overrides.x = newX;
                widget.overrides.y = newY;
                widget.updatePositionSize();
            });
        } else if (this.dragState.mode === 'resize') {
            const { id, startXPos, startYPos, startW, startH, dir } = this.dragState;
            const widget = this.widgets[id];
            if (!widget) return;

            let newW = startW, newH = startH, newX = startXPos, newY = startYPos;
            if (dir.includes('e')) newW = startW + deltaX;
            if (dir.includes('w')) { newW = startW - deltaX; newX = startXPos + deltaX; }
            if (dir.includes('s')) newH = startH + deltaY;
            if (dir.includes('n')) { newH = startH - deltaY; newY = startYPos + deltaY; }

            if (MASTER_SETTINGS && MASTER_SETTINGS.snapToGrid) {
                if (dir.includes('e') || dir.includes('w')) newW = Math.max(grid, Math.round(newW / grid) * grid);
                if (dir.includes('s') || dir.includes('n')) newH = Math.max(grid, Math.round(newH / grid) * grid);
                if (dir.includes('w')) newX = Math.round(newX / grid) * grid;
                if (dir.includes('n')) newY = Math.round(newY / grid) * grid;
            } else {
                if (dir.includes('e') || dir.includes('w')) newW = Math.max(1, Math.round(newW));
                if (dir.includes('s') || dir.includes('n')) newH = Math.max(1, Math.round(newH));
                if (dir.includes('w')) newX = (startXPos + startW) - newW;
                if (dir.includes('n')) newY = (startYPos + startH) - newH;
            }

            widget.overrides.width = newW;
            widget.overrides.height = newH;
            widget.overrides.x = newX;
            widget.overrides.y = newY;
            widget.updatePositionSize();
        }
    },

    handleMouseUp: function (e) {
        if (this.lasso) {
            this.handleCanvasMouseUp(e);
        } else if (this.dragState) {
            if (this.dragState.mode === 'move') {
                const patchEntries = [];
                this.dragState.items.forEach(item => {
                    if (this.widgets[item.id]) {
                        this.widgets[item.id].render();
                        const widget = this.widgets[item.id];
                        const before = { x: item.startXPos, y: item.startYPos };
                        const after = { x: widget.overrides.x, y: widget.overrides.y };
                        if (widget.overrides.legendPosition === 'floating'
                            && (item.startLegendOffX !== widget.overrides.legendOffX || item.startLegendOffY !== widget.overrides.legendOffY)) {
                            before.legendOffX = item.startLegendOffX != null ? item.startLegendOffX : null;
                            before.legendOffY = item.startLegendOffY != null ? item.startLegendOffY : null;
                            after.legendOffX = widget.overrides.legendOffX;
                            after.legendOffY = widget.overrides.legendOffY;
                        }
                        if (!this._isEqualJson(before, after)) {
                            patchEntries.push({
                                kind: 'widget-overrides',
                                id: item.id,
                                replace: false,
                                before: before,
                                after: after
                            });
                        }
                    }
                });
                if (typeof Editor !== 'undefined' && Editor.currentId !== 'MULTIPLE' && this.dragState.items.length === 1) {
                    if (Editor.loadWidget) Editor.loadWidget(this.dragState.items[0].id);
                }
                this.markUnsaved();
                if (patchEntries.length === 1) {
                    this._recordHistoryEntry(patchEntries[0]);
                } else if (patchEntries.length > 1) {
                    this._recordHistoryEntry({
                        kind: 'batch',
                        label: 'Move Widgets',
                        entries: patchEntries
                    });
                }

                const deltaX = Math.abs(e.clientX - this.dragState.startX);
                const deltaY = Math.abs(e.clientY - this.dragState.startY);
                if (deltaX < 3 && deltaY < 3 && !this._wantsAddToSelection(e) && this.selectedIds.length > 1 && !this.selectedGroupId) {
                    if (this.dragState.primaryId) {
                        this.selectWidget(this.dragState.primaryId, false);
                    }
                }
            } else if (this.dragState.mode === 'resize') {
                const id = this.dragState.id;
                if (this.widgets[id]) {
                    const before = {
                        x: this.dragState.startXPos,
                        y: this.dragState.startYPos,
                        width: this.dragState.startW,
                        height: this.dragState.startH
                    };
                    const after = {
                        x: this.widgets[id].overrides.x,
                        y: this.widgets[id].overrides.y,
                        width: this.widgets[id].overrides.width,
                        height: this.widgets[id].overrides.height
                    };
                    if (this.widgets[id].overrides.legendPosition === 'floating'
                        && (this.dragState.startLegendOffX !== this.widgets[id].overrides.legendOffX
                            || this.dragState.startLegendOffY !== this.widgets[id].overrides.legendOffY)) {
                        before.legendOffX = this.dragState.startLegendOffX != null ? this.dragState.startLegendOffX : null;
                        before.legendOffY = this.dragState.startLegendOffY != null ? this.dragState.startLegendOffY : null;
                        after.legendOffX = this.widgets[id].overrides.legendOffX;
                        after.legendOffY = this.widgets[id].overrides.legendOffY;
                    }
                    this.widgets[id].render();
                    if (typeof Editor !== 'undefined' && Editor.currentId === id && Editor.loadWidget) Editor.loadWidget(id);
                    this.markUnsaved();
                    if (!this._isEqualJson(before, after)) {
                        this._recordHistoryEntry({
                            kind: 'widget-overrides',
                            id: id,
                            replace: false,
                            before: before,
                            after: after
                        });
                    }
                }
            }
            this._setDragState(null);
        }

        if (!this.dragState && !this.lasso) {
            this._endEditPointerGesture();
        }
    },

    toggleWidgetLock: function () {
        const selectedIds = this.getEffectiveSelectionIds();
        if (selectedIds.length === 0) return;

        if (this.selectedGroupId && this._isSelectionExactlyGroup(this.selectedGroupId)) {
            this.toggleSelectedGroupLock();
            return;
        }
        
        let allLocked = true;
        selectedIds.forEach(id => {
            if (this.widgets[id] && (!this.widgets[id].config || !this.widgets[id].config.locked)) {
                allLocked = false;
            }
        });

        const newLockState = !allLocked;
        this.beginHistoryAction('Toggle Widget Lock');

        selectedIds.forEach(id => {
            if (this.widgets[id]) {
                const cur = this.widgets[id].overrides || {};
                const newSettings = { ...cur, locked: newLockState };
                this.updateWidget(id, newSettings, true);
            }
        });
        this.commitHistoryAction();

        if (typeof Editor !== 'undefined') {
            if (Editor.currentId !== 'MULTIPLE' && Editor.loadWidget) {
                Editor.loadWidget(Editor.currentId);
            } else {
                Editor.updateToolbarState();
            }
        }
        
        this.markUnsaved();
    },

    _getWidgetZIndex: function (widget) {
        if (!widget) return 10;
        const bindings = widget.bindings;
        if (!(bindings && typeof bindings.zIndex === 'string' && bindings.zIndex !== '')) {
            return this._sparseWidgetChrome(widget).z;
        }
        const rawZIndex = (typeof widget.resolveValue === 'function')
            ? widget.resolveValue('zIndex', 10)
            : 10;
        if (rawZIndex === null || rawZIndex === undefined || rawZIndex === '') return 10;
        const parsedZIndex = Number(rawZIndex);
        return Number.isFinite(parsedZIndex) ? parsedZIndex : 10;
    },

    _getSelectedWidgetsByDepth: function (direction = 'asc') {
        const selectedOrder = new Map(this.selectedIds.map((id, index) => [id, index]));

        return this.selectedIds
            .map(id => ({ id, widget: this.widgets[id] }))
            .filter(entry => !!entry.widget)
            .sort((a, b) => {
                const zA = this._getWidgetZIndex(a.widget);
                const zB = this._getWidgetZIndex(b.widget);
                if (zA === zB) {
                    return __nullish(selectedOrder.get(a.id), 0) - __nullish(selectedOrder.get(b.id), 0);
                }
                return direction === 'desc' ? zB - zA : zA - zB;
            });
    },

    bringToFront: function () {
        if (this.selectedIds.length === 0) return;
        const selectedWidgets = this._getSelectedWidgetsByDepth('desc');
        this.beginHistoryAction('Bring To Front');
        selectedWidgets.forEach(({ widget }) => {
            this.updateWidget(widget.id, { zIndex: this._getWidgetZIndex(widget) + 1 });
        });
        this.commitHistoryAction();
        if (typeof Editor !== 'undefined' && Editor.currentId !== 'MULTIPLE' && Editor.loadWidget) Editor.loadWidget(Editor.currentId);
        this.markUnsaved();
    },

    sendToBack: function () {
        if (this.selectedIds.length === 0) return;
        const selectedWidgets = this._getSelectedWidgetsByDepth('asc');
        this.beginHistoryAction('Send To Back');
        selectedWidgets.forEach(({ widget }) => {
            this.updateWidget(widget.id, { zIndex: this._getWidgetZIndex(widget) - 1 });
        });
        this.commitHistoryAction();
        if (typeof Editor !== 'undefined' && Editor.currentId !== 'MULTIPLE' && Editor.loadWidget) Editor.loadWidget(Editor.currentId);
        this.markUnsaved();
    },

    initFabAutoHiding: function () {
        const fab = document.getElementById('fab-mode-switch');
        if (!fab) return;

        if (window.APP_CONFIG && window.APP_CONFIG.defaults && window.APP_CONFIG.defaults.hideEditor) {
            fab.style.display = 'none';
            return;
        }

        const resetTimer = () => {
            fab.style.opacity = '1';
            fab.style.pointerEvents = 'auto';
            if (this.fabTimer) {
                if (typeof WorkerTimer !== 'undefined' && WorkerTimer.clearTimeout) WorkerTimer.clearTimeout(this.fabTimer);
                else clearTimeout(this.fabTimer);
            }
            const hideFab = () => {
                fab.style.opacity = '0';
                fab.style.pointerEvents = 'none';
            };
            if (typeof WorkerTimer !== 'undefined' && WorkerTimer.setTimeout) {
                this.fabTimer = WorkerTimer.setTimeout(hideFab, 10000);
            } else {
                this.fabTimer = setTimeout(hideFab, 10000);
            }
        };
        this._fabResetTimer = resetTimer;
        if (!this._fabActivityHandler) {
            let lastMove = 0;
            this._fabActivityHandler = (e) => {
                const now = Date.now();
                if (e && e.type === 'mousemove' && now - lastMove < 500) return;
                lastMove = now;
                if (typeof this._fabResetTimer === 'function') this._fabResetTimer();
            };
            window.addEventListener('mousemove', this._fabActivityHandler);
            window.addEventListener('mousedown', this._fabActivityHandler);
            window.addEventListener('keydown', this._fabActivityHandler);
            window.addEventListener('touchstart', this._fabActivityHandler);
        }
        resetTimer();
    },

    hexToRgba: function (hex, alpha) {
        if (!hex) return 'transparent';

        let colorObj = null;
        if (typeof hex === 'object') {
            colorObj = ColorUtils.parse(hex);
        } else if (typeof hex === 'string') {
            colorObj = ColorUtils.parse(hex);
        }

        if (colorObj) {
            if (alpha !== undefined) colorObj.a = alpha;
            return ColorUtils.toCss(colorObj);
        }

        return 'transparent';
    },

    /**
     * Reconcile the live data driver with MASTER_SETTINGS.dataDriver.
     *   - If no driver is active, or the active driver's type differs from the desired one,
     *     we (re)initialize, which tears down the old instance and creates a fresh one.
     *   - If the desired driver is already active, we hot-reload its settings so any
     *     driverSettings change carried by the dashboard is applied without a disconnect.
     *
     * This is the single entry-point for driver lifecycle during dashboard loads. It keeps
     * first-data latency minimal: the simulation driver's connect() fires a synchronous tick,
     * so by the time widgets are instantiated Dashboard.liveData is already populated.
     */
    ensureDataDriver: function () {
        const desiredType = MASTER_SETTINGS.dataDriver;
        const currentType = DataDriverRegistry.getType();
        if (!desiredType) {
            if (typeof window.syncHomeyGalleryButton === 'function') window.syncHomeyGalleryButton();
            return;
        }

        if (currentType !== desiredType) {
            this.initDataDriver();
            if (typeof window.syncHomeyGalleryButton === 'function') window.syncHomeyGalleryButton();
            return;
        }

        const driver = DataDriverRegistry.get();
        if (driver && typeof driver.updateSettings === 'function' && MASTER_SETTINGS.driverSettings) {
            driver.updateSettings(MASTER_SETTINGS.driverSettings);
        }
        if (typeof window.syncHomeyGalleryButton === 'function') window.syncHomeyGalleryButton();
    },

    initDataDriver: function () {
        this._hideDriverOfflineWarning();
        this._driverOfflineSessionActive = false;
        this._driverOfflineWarningDismissed = false;
        this._driverHasConnectedOnce = false;
        let driverType = MASTER_SETTINGS.dataDriver || 'homey';
        if (window.APP_CONFIG && window.APP_CONFIG.environment === 'homeassistant' && driverType === 'homey') {
            driverType = 'homeassistant';
            MASTER_SETTINGS.dataDriver = 'homeassistant';
        }

        if (window.APP_CONFIG && window.APP_CONFIG.defaults && window.APP_CONFIG.defaults.lockedPlatform) {
            driverType = window.APP_CONFIG.defaults.lockedPlatform;
            MASTER_SETTINGS.dataDriver = driverType;
            console.log(`[Dashboard] Platform Locked to: ${driverType}`);
        } else if (window.APP_CONFIG && window.APP_CONFIG.ui && window.APP_CONFIG.ui.hiddenDrivers) {
            let hidden = window.APP_CONFIG.ui.hiddenDrivers;
            if (!Array.isArray(hidden)) hidden = [hidden];
            const typeKey = String(driverType || '').toLowerCase();
            let isHidden = false;
            for (let hi = 0; hi < hidden.length; hi++) {
                if (String(hidden[hi] || '').toLowerCase() === typeKey) {
                    isHidden = true;
                    break;
                }
            }
            if (isHidden) {
                const fallback = (window.APP_CONFIG.defaults && window.APP_CONFIG.defaults.dataDriver)
                    ? window.APP_CONFIG.defaults.dataDriver
                    : 'simulation';
                driverType = fallback;
                MASTER_SETTINGS.dataDriver = driverType;
            }
        }

        if (!MASTER_SETTINGS.driverSettings) MASTER_SETTINGS.driverSettings = {};

        const DriverClass = DataDriverRegistry.drivers[driverType];
        if (DriverClass && DriverClass.schema) {
            DriverClass.schema.forEach(field => {
                if (MASTER_SETTINGS.driverSettings[field.key] === undefined && field.default !== undefined) {
                    MASTER_SETTINGS.driverSettings[field.key] = field.default;
                }
            });
        }

        const driverSettings = MASTER_SETTINGS.driverSettings;
        console.log(`[Dashboard] Initializing Data Driver: ${driverType}`);
        this.liveData = Object.create(null);
        this.topicMeta = {};

        const driver = DataDriverRegistry.init(driverType, driverSettings);

        this.updateStorageUI();
        if (typeof window.syncHomeyGalleryButton === 'function') window.syncHomeyGalleryButton();

        if (!driver) return;
        driver.onMessage((topic, payload) => {
            this.applyLocalTopicPayload(topic, payload, driver);
        });

        driver.onStatusChange((isConnected, statusText) => {
            this._dataDriverConnected = !!isConnected;
            const driverLabel = (DriverClass && DriverClass.metadata && DriverClass.metadata.label) ? DriverClass.metadata.label : String(driverType).toUpperCase();
            const el = document.getElementById('nr-status');
            if (el) {
                // Glass status cluster: keep dot + label; colors come from CSS state classes.
                const shortDriver = ({
                    homey: 'Homey',
                    homeassistant: 'HA',
                    mqtt: 'MQTT',
                    nodered: 'Node-RED',
                    simulation: 'Sim'
                })[driverType] || String(driverType || 'Driver');
                let labelText;
                let stateClass;
                let titleText;
                if (driverType === 'simulation') {
                    labelText = 'Sim';
                    stateClass = 'is-simulation';
                    titleText = isConnected ? 'Simulation mode' : `Disconnected - ${driverLabel}`;
                } else if (isConnected) {
                    labelText = shortDriver;
                    stateClass = 'is-connected';
                    titleText = `Connected - ${driverLabel}`;
                } else {
                    labelText = 'Offline';
                    stateClass = 'is-disconnected';
                    titleText = `Disconnected - ${driverLabel}`;
                }
                el.className = `header-status-connection ${stateClass}`;
                el.removeAttribute('style');
                el.title = titleText;
                let labelEl = el.querySelector('.header-status-connection-label');
                if (!labelEl) {
                    el.textContent = '';
                    const dot = document.createElement('span');
                    dot.className = 'header-status-dot';
                    dot.setAttribute('aria-hidden', 'true');
                    labelEl = document.createElement('span');
                    labelEl.className = 'header-status-connection-label';
                    el.appendChild(dot);
                    el.appendChild(labelEl);
                }
                labelEl.textContent = labelText;
            }

            if (this._isOfflineWarningEnabled()) {
                if (isConnected) {
                    this._driverHasConnectedOnce = true;
                    this._driverOfflineSessionActive = false;
                    this._driverOfflineWarningDismissed = false;
                    this._hideDriverOfflineWarning();
                } else {
                    if (!this._driverOfflineSessionActive) {
                        this._driverOfflineSessionActive = true;
                        this._driverOfflineWarningDismissed = false;
                    }
                    if (this._driverHasConnectedOnce && !this._driverOfflineWarningDismissed) {
                        this._scheduleDriverOfflineWarning(driverLabel, statusText);
                    }
                }
            } else {
                this._driverOfflineSessionActive = false;
                this._driverOfflineWarningDismissed = false;
                this._hideDriverOfflineWarning();
            }

            const topStatusLabel = document.getElementById('status');
            const topStatusDot = document.getElementById('status-dot');

            if (topStatusLabel && topStatusDot) {
                if (driverType === 'simulation') {
                    topStatusLabel.innerText = 'Simulating';
                    topStatusLabel.className = 'text-xs font-mono text-purple-400';
                    topStatusDot.className = 'w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]';
                } else if (isConnected) {
                    topStatusLabel.innerText = 'Connected';
                    topStatusLabel.className = 'text-xs font-mono text-green-400';
                    topStatusDot.className = 'w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]';
                } else {
                    topStatusLabel.innerText = 'Disconnected';
                    topStatusLabel.className = 'text-xs font-mono text-red-500';
                    topStatusDot.className = 'w-2 h-2 rounded-full bg-red-500 shadow-none';
                }
            }

            if (isConnected) {
                this.scheduleMenuOutputStatusSync();
                this.scheduleCurrentPageOutputTopicPublish();
            }
        });

        driver.connect();
    },

    /**
     * Map global binding keys to an updateGlobal payload. Theme editor fields use `themeSlot_<token>` keys;
     * inbound values must update `themeColors[token]`, not a flat MASTER_SETTINGS property.
     */
    _patchFromGlobalBindingKey: function (settingKey, value) {
        const sk = String(settingKey || '');
        if (sk === 'editorZoom') return null;
        if (sk === 'theme') {
            void this.applyThemeFromTopicPayload(value);
            return {};
        }
        const prefix = 'themeSlot_';
        if (sk.indexOf(prefix) !== 0) {
            return { [sk]: value };
        }
        const token = sk.slice(prefix.length);
        if (typeof MasterLayout === 'undefined' || !MasterLayout.defaultThemeColors) {
            return { [sk]: value };
        }
        const defs = MasterLayout.defaultThemeColors();
        if (!Object.prototype.hasOwnProperty.call(defs, token)) {
            return { [sk]: value };
        }
        const tc = { ...(MASTER_SETTINGS.themeColors || MasterLayout.defaultThemeColors()) };
        tc[token] = value;
        return { themeColors: tc };
    },

    _mergeGlobalBindingPatch: function (targetPatch, settingKey, value) {
        const patch = this._patchFromGlobalBindingKey(settingKey, value);
        if (!patch) return targetPatch;
        const keys = Object.keys(patch);
        if (keys.length === 0) return targetPatch;
        if (!targetPatch) targetPatch = {};
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (k === 'themeColors' && patch.themeColors && typeof patch.themeColors === 'object') {
                if (!targetPatch.themeColors) {
                    targetPatch.themeColors = { ...patch.themeColors };
                } else {
                    const sk = String(settingKey || '');
                    const prefix = 'themeSlot_';
                    if (sk.indexOf(prefix) === 0) {
                        const token = sk.slice(prefix.length);
                        targetPatch.themeColors[token] = patch.themeColors[token];
                    } else {
                        Object.assign(targetPatch.themeColors, patch.themeColors);
                    }
                }
            } else {
                targetPatch[k] = patch[k];
            }
        }
        return targetPatch;
    },

    /**
     * Deep equality guard for live topic payloads.
     * Fast-path primitives, then recurse plain objects/arrays.
     */
    _isSameLivePayload: function (a, b, depth) {
        if (Object.is(a, b)) return true;
        const d = depth || 0;
        if (d > 8) return false;
        if (a == null || b == null) return false;
        if (typeof a !== 'object' || typeof b !== 'object') return false;
        if (Array.isArray(a) !== Array.isArray(b)) return false;

        if (Array.isArray(a)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!this._isSameLivePayload(a[i], b[i], d + 1)) return false;
            }
            return true;
        }

        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) return false;

        for (let i = 0; i < aKeys.length; i++) {
            const key = aKeys[i];
            if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
            if (!this._isSameLivePayload(a[key], b[key], d + 1)) return false;
        }
        return true;
    },

    /**
     * Group visibility, widget onIncomingData + dirty flush, and globalBindings for one topic.
     * Runs only for changed payloads; duplicates go through _dispatchDuplicateTopicToWidgets.
     */
    /**
     * Editor-only listeners (Live Lights picker). Empty set is a single null check.
     * Not used by the viewer render path.
     */
    addLiveTopicListener: function (fn) {
        if (typeof fn !== 'function') return;
        if (!this._liveTopicListeners) this._liveTopicListeners = new Set();
        this._liveTopicListeners.add(fn);
    },

    removeLiveTopicListener: function (fn) {
        if (!this._liveTopicListeners) return;
        this._liveTopicListeners.delete(fn);
        if (this._liveTopicListeners.size === 0) this._liveTopicListeners = null;
    },

    _emitLiveTopicListeners: function (topic, payload) {
        const set = this._liveTopicListeners;
        if (!set || set.size === 0) return;
        set.forEach(function (fn) {
            try {
                fn(topic, payload);
            } catch (err) {
                console.error('[Dashboard] Live topic listener failed:', err);
            }
        });
    },

    _notifyLiveTopicObservers: function (topic, payload, driverInstance) {
        if (this._liveTopicListeners) this._emitLiveTopicListeners(topic, payload);
        const driver = driverInstance || DataDriverRegistry.get();
        const topicData = driver && driver.seenTopics ? driver.seenTopics.get(topic) : null;
        const count = topicData ? topicData.count : 0;

        const altTopic = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function')
            ? HomeyTopicAlias.aliasOf(topic)
            : null;
        const matchesTopic = function (t) {
            if (!t) return false;
            return t === topic || (altTopic !== null && t === altTopic);
        };

        let pageNeedsRefresh = false;
        Object.keys(this.groups || {}).forEach((gid) => {
            const g = this.groups[gid];
            if (!g || !g.bindings || typeof g.bindings !== 'object') return;
            const b = g.bindings;
            const visT = typeof b.visible === 'string' ? b.visible.trim() : '';
            const pageT = typeof b.overridePage === 'string' ? b.overridePage.trim() : '';
            const dimT = typeof b.dimBackgroundWhenVisible === 'string' ? b.dimBackgroundWhenVisible.trim() : '';
            if (pageT && matchesTopic(pageT)) pageNeedsRefresh = true;
            if ((visT && matchesTopic(visT)) || (pageT && matchesTopic(pageT)) || (dimT && matchesTopic(dimT))) {
                this._refreshEditorPageIndicator();
                this._scheduleGroupVisibility(gid);
            }
        });
        if (!pageNeedsRefresh && this.isEditMode && this.widgets) {
            const widgetKeys = Object.keys(this.widgets);
            for (let wi = 0; wi < widgetKeys.length; wi++) {
                const w = this.widgets[widgetKeys[wi]];
                if (w && w.bindings && typeof w.bindings.page === 'string' && matchesTopic(w.bindings.page.trim())) {
                    pageNeedsRefresh = true;
                    break;
                }
            }
            if (pageNeedsRefresh) {
                this._refreshEditorPageIndicator();
            }
        }

        this._dispatchIncomingTopicToWidgets(topic, payload, count);

        const trimmedTopic = String(topic || '').trim();
        const trimmedAltTopic = altTopic ? String(altTopic).trim() : null;
        let mergedPatch = null;
        Object.keys(this.globalBindings || {}).forEach(settingKey => {
            if (settingKey === 'editorZoom') return;
            const bound = String(this.globalBindings[settingKey] || '').trim();
            if (bound && (matchesTopic(bound) || bound === trimmedTopic || (trimmedAltTopic !== null && bound === trimmedAltTopic))) {
                mergedPatch = this._mergeGlobalBindingPatch(mergedPatch, settingKey, payload);
            }
        });
        if (mergedPatch && Object.keys(mergedPatch).length > 0) {
            this.updateGlobal(mergedPatch, true, true);
        }
    },

    /** Duplicate (deep-equal) payloads only reach widgets with event semantics (see wantsDuplicateTopicPayloads). */
    _dispatchDuplicateTopicToWidgets: function (topic, payload, driver) {
        this._ensureTopicIndex();
        if (!this._duplicatePayloadWidgetIds || this._duplicatePayloadWidgetIds.length === 0) return;
        const topicData = driver && driver.seenTopics ? driver.seenTopics.get(topic) : null;
        const count = topicData ? topicData.count : 0;
        const ids = this._widgetIdsForTopic(topic);
        for (let i = 0; i < ids.length; i++) {
            const w = this.widgets[ids[i]];
            if (!w || typeof w.wantsDuplicateTopicPayloads !== 'function' || !w.wantsDuplicateTopicPayloads()) continue;
            this._applyLiveUpdateToWidget(w, topic, payload, count, true);
        }
        this._scheduleDirtyWidgetFlush();
    },

    /**
     * Re-apply Dashboard.liveData to widgets/groups/globalBindings without a network round-trip.
     * Used after widgets are created (cache may have arrived earlier) and on page resume.
     */
    hydrateWidgetsFromLiveData: function () {
        const live = this.liveData;
        if (!live || typeof live !== 'object') return;
        const map = new Map();
        Object.keys(live).forEach((topic) => {
            if (topic == null || topic === '') return;
            map.set(topic, live[topic]);
        });
        if (map.size === 0) return;
        this._replayingLiveData = true;
        try {
            this.applyLocalTopicPayloadBatch(map);
        } finally {
            this._replayingLiveData = false;
        }
    },

    /**
     * Homey live-data resync: optional Dashboard Loaded Flow announce, request_state_sync, local hydrate.
     * @param {{ announceLoad?: boolean, dashboardName?: string, throttled?: boolean, resume?: boolean }} [opts]
     *   `resume` routes through the driver's connection check, needed after a back/forward-cache restore
     *   where the socket can look connected while its transport is already dead.
     */
    resyncHomeyLiveData: function (opts) {
        opts = opts || {};
        const driverType = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.getType() : null;
        if (driverType && driverType !== 'homey' && driverType !== 'homeassistant') {
            this.hydrateWidgetsFromLiveData();
            return;
        }

        if (opts.throttled) {
            const now = Date.now();
            if (this._lastLiveResyncAt && (now - this._lastLiveResyncAt) < 2000) return;
        }
        this._lastLiveResyncAt = Date.now();

        const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        const rawName = opts.dashboardName || this.activeFileName;
        const name = rawName ? String(rawName).replace(/\.json$/i, '') : null;
        const activePage = Math.max(1, parseInt(String(typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.currentPage != null ? MASTER_SETTINGS.currentPage : 1), 10) || 1);

        if (opts.resume && driver && typeof driver.resumeConnection === 'function') {
            if (opts.announceLoad && name) {
                this._lastNotifiedPage = activePage;
                this._lastNotifiedDashboard = name;
            }
            driver.resumeConnection(opts.announceLoad ? name : null, activePage);
        } else {
            if (opts.announceLoad && name && driver && typeof driver.sendLoadNotification === 'function') {
                this._lastNotifiedPage = activePage;
                this._lastNotifiedDashboard = name;
                driver.sendLoadNotification(name, activePage);
            }
            if (driver && typeof driver.requestStateSync === 'function') {
                driver.requestStateSync();
            }
        }

        this.hydrateWidgetsFromLiveData();
        this.scheduleMenuOutputStatusSync();
        this.scheduleCurrentPageOutputTopicPublish();
    },

    isLegacyHomeyTopic: function (topic) {
        if (!topic || typeof topic !== 'string') return false;
        const canonical = HomeyTopicAlias.canonicalOf(topic);
        return !!(canonical && this.liveData && this.liveData[canonical] !== undefined);
    },

    /** Inbound path + local reflection: liveData, bound widgets, globalBindings (driver optional for seenTopics count). */
    applyLocalTopicPayload: function (topic, payload, driverInstance) {
        if (topic == null || topic === '') return;
        const driver = driverInstance || DataDriverRegistry.get();
        if (this._isSameLivePayload(this.liveData[topic], payload)) {
            // Unchanged value: group visibility and globalBindings are idempotent and widgets
            // already display it, so skip the full observer pass (Homey state-sync replays and
            // retained MQTT echoes previously re-rendered every bound widget for nothing).
            if (this._liveTopicListeners) this._emitLiveTopicListeners(topic, payload);
            this._dispatchDuplicateTopicToWidgets(topic, payload, driver);
            return;
        }
        const previousPayload = this.liveData[topic];
        const markdownIndexStale = this._markdownTopicIndexNeedsRebuild(topic, previousPayload, payload);
        const isNew = previousPayload === undefined;
        this.liveData[topic] = payload;
        const altTopic = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function')
            ? HomeyTopicAlias.aliasOf(topic)
            : null;
        if (altTopic) this.liveData[altTopic] = payload;
        if (markdownIndexStale) this.invalidateTopicIndex();

        if (isNew) {
            const w = Math.max(300, String(topic).length * 7.5 + 50);
            if (!this._longestTopicWidth) this._longestTopicWidth = 300;
            if (w > this._longestTopicWidth) {
                this._longestTopicWidth = w;
                document.documentElement.style.setProperty('--longest-topic-width', w + 'px');
            }
            if (Object.keys(this.liveData).length > 2500) {
                this._pruneLiveDataIfExceeded();
            }
        }

        this._notifyLiveTopicObservers(topic, payload, driver);
        if (typeof DashboardAudio !== 'undefined' && typeof DashboardAudio.onTopicPayload === 'function') {
            DashboardAudio.onTopicPayload(topic);
        }
    },

    /**
     * Apply many topic updates in one pass (one widget iteration). Used by the simulation driver where one tick
     * updates dozens of topics; sequential applyLocalTopicPayload would be O(topics × widgets) per tick.
     */
    applyLocalTopicPayloadBatch: function (topicPayloadMap, driverInstance) {
        if (!topicPayloadMap || topicPayloadMap.size === 0) return;
        const driver = driverInstance || DataDriverRegistry.get();
        const updatedTopics = new Map();
        const unchangedTopics = new Map();
        let markdownIndexStale = false;

        topicPayloadMap.forEach((payload, topic) => {
            if (topic == null || topic === '') return;
            if (this._isSameLivePayload(this.liveData[topic], payload)) {
                unchangedTopics.set(topic, payload);
                return;
            }

            const previousPayload = this.liveData[topic];
            if (!markdownIndexStale && this._markdownTopicIndexNeedsRebuild(topic, previousPayload, payload)) {
                markdownIndexStale = true;
            }
            const isNew = previousPayload === undefined;
            this.liveData[topic] = payload;
            const altTopic = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function')
                ? HomeyTopicAlias.aliasOf(topic)
                : null;
            if (altTopic) this.liveData[altTopic] = payload;
            updatedTopics.set(topic, payload);

            if (isNew) {
                const w = Math.max(300, String(topic).length * 7.5 + 50);
                if (!this._longestTopicWidth) this._longestTopicWidth = 300;
                if (w > this._longestTopicWidth) {
                    this._longestTopicWidth = w;
                    document.documentElement.style.setProperty('--longest-topic-width', w + 'px');
                }
            }
        });

        if (updatedTopics.size === 0 && unchangedTopics.size === 0) return;
        if (markdownIndexStale) this.invalidateTopicIndex();

        if (this._liveTopicListeners) {
            topicPayloadMap.forEach((payload, topic) => {
                if (topic != null && topic !== '') {
                    this._emitLiveTopicListeners(topic, payload);
                }
            });
        }

        // Groups and globalBindings are value-driven; unchanged payloads cannot affect them.
        const topicTouched = function (t) {
            if (!t) return false;
            if (updatedTopics.has(t)) return true;
            const alt = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function')
                ? HomeyTopicAlias.aliasOf(t)
                : null;
            return !!(alt && updatedTopics.has(alt));
        };

        let pageNeedsRefresh = false;
        Object.keys(this.groups || {}).forEach((gid) => {
            const g = this.groups[gid];
            if (!g || !g.bindings || typeof g.bindings !== 'object') return;
            const b = g.bindings;
            const visT = typeof b.visible === 'string' ? b.visible.trim() : '';
            const pageT = typeof b.overridePage === 'string' ? b.overridePage.trim() : '';
            const dimT = typeof b.dimBackgroundWhenVisible === 'string' ? b.dimBackgroundWhenVisible.trim() : '';
            if (pageT && topicTouched(pageT)) pageNeedsRefresh = true;
            if ((visT && topicTouched(visT)) || (pageT && topicTouched(pageT)) || (dimT && topicTouched(dimT))) {
                this._refreshEditorPageIndicator();
                this._scheduleGroupVisibility(gid);
            }
        });
        if (!pageNeedsRefresh && this.isEditMode && this.widgets) {
            const widgetKeys = Object.keys(this.widgets);
            for (let wi = 0; wi < widgetKeys.length; wi++) {
                const w = this.widgets[widgetKeys[wi]];
                if (w && w.bindings && typeof w.bindings.page === 'string' && topicTouched(w.bindings.page.trim())) {
                    pageNeedsRefresh = true;
                    break;
                }
            }
            if (pageNeedsRefresh) {
                this._refreshEditorPageIndicator();
            }
        }

        const dispatchForMap = (m, duplicatesOnly) => {
            m.forEach((payload, t) => {
                const ids = this._widgetIdsForTopic(t);
                for (let i = 0; i < ids.length; i++) {
                    const w = this.widgets[ids[i]];
                    if (!w) continue;
                    if (duplicatesOnly
                            && (typeof w.wantsDuplicateTopicPayloads !== 'function' || !w.wantsDuplicateTopicPayloads())) {
                        continue;
                    }
                    const topicData = driver && driver.seenTopics ? driver.seenTopics.get(t) : null;
                    const count = topicData ? topicData.count : 0;
                    this._applyLiveUpdateToWidget(w, t, payload, count, duplicatesOnly);
                }
            });
        };
        dispatchForMap(updatedTopics, false);
        this._ensureTopicIndex();
        if (this._duplicatePayloadWidgetIds && this._duplicatePayloadWidgetIds.length > 0) {
            dispatchForMap(unchangedTopics, true);
        }
        this._scheduleDirtyWidgetFlush();

        let mergedPatch = null;
        Object.keys(this.globalBindings || {}).forEach(settingKey => {
            if (settingKey === 'editorZoom') return;
            const rawBound = this.globalBindings[settingKey];
            const t = String(rawBound || '').trim();
            if (!t) return;
            let val;
            const alt = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function')
                ? HomeyTopicAlias.aliasOf(t)
                : null;
            if (updatedTopics.has(rawBound)) {
                val = updatedTopics.get(rawBound);
            } else if (updatedTopics.has(t)) {
                val = updatedTopics.get(t);
            } else if (alt && updatedTopics.has(alt)) {
                val = updatedTopics.get(alt);
            } else {
                updatedTopics.forEach((v, key) => {
                    const tk = String(key || '').trim();
                    if (tk === t || (alt && tk === alt)) val = v;
                });
            }
            if (val !== undefined) {
                mergedPatch = this._mergeGlobalBindingPatch(mergedPatch, settingKey, val);
            }
        });
        if (mergedPatch && Object.keys(mergedPatch).length > 0) {
            this.updateGlobal(mergedPatch, true, true);
        }

        if (typeof DashboardAudio !== 'undefined' && typeof DashboardAudio.onTopicPayload === 'function') {
            updatedTopics.forEach((_payload, t) => DashboardAudio.onTopicPayload(t));
        }
        if (this.liveData && Object.keys(this.liveData).length > 2500) {
            this._pruneLiveDataIfExceeded();
        }
    },

    _rememberPruneTopic: function (activeTopics, topic) {
        if (topic == null || topic === '') return;
        const t = String(topic).trim();
        if (!t) return;
        activeTopics.add(t);
        if (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function') {
            const alt = HomeyTopicAlias.aliasOf(t);
            if (alt) activeTopics.add(alt);
        }
    },

    /**
     * Bounded collection guard: prunes stale unreferenced topics when dynamic topic keys exceed 2500.
     */
    _pruneLiveDataIfExceeded: function () {
        if (!this.liveData) {
            this.liveData = Object.create(null);
            return;
        }
        const keys = Object.keys(this.liveData);
        if (keys.length <= 2500) return;
        const activeTopics = new Set();
        const self = this;
        Object.values(this.widgets || {}).forEach((w) => {
            if (!w) return;
            const interests = (typeof w.getStaticTopicInterests === 'function')
                ? w.getStaticTopicInterests()
                : (w._staticTopicInterests || null);
            if (interests) {
                interests.forEach((t) => { self._rememberPruneTopic(activeTopics, t); });
            }
            if (typeof w.collectLiveMarkdownTopicPaths === 'function') {
                const livePaths = w.collectLiveMarkdownTopicPaths();
                if (livePaths && livePaths.length) {
                    for (let li = 0; li < livePaths.length; li++) {
                        self._rememberPruneTopic(activeTopics, livePaths[li]);
                    }
                }
            }
        });
        if (this.globalBindings) {
            Object.keys(this.globalBindings).forEach((k) => {
                const b = this.globalBindings[k];
                if (typeof b === 'string') self._rememberPruneTopic(activeTopics, b);
                else if (b && b.topic) self._rememberPruneTopic(activeTopics, b.topic);
            });
        }
        const groups = this.groups || {};
        const groupIds = Object.keys(groups);
        const groupBindKeys = ['visible', 'overridePage', 'dimBackgroundWhenVisible'];
        for (let gi = 0; gi < groupIds.length; gi++) {
            const bindings = groups[groupIds[gi]] && groups[groupIds[gi]].bindings;
            if (!bindings) continue;
            for (let bk = 0; bk < groupBindKeys.length; bk++) {
                const topic = bindings[groupBindKeys[bk]];
                if (typeof topic === 'string') self._rememberPruneTopic(activeTopics, topic);
            }
        }
        let audioRows = (typeof MASTER_SETTINGS !== 'undefined') ? MASTER_SETTINGS.audioTopicMap : null;
        if (typeof audioRows === 'string') {
            try { audioRows = JSON.parse(audioRows); } catch (e) { audioRows = null; }
        }
        if (Array.isArray(audioRows)) {
            for (let ai = 0; ai < audioRows.length; ai++) {
                const row = audioRows[ai];
                if (row && row.topic) self._rememberPruneTopic(activeTopics, row.topic);
            }
        }
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (!activeTopics.has(k)) {
                delete this.liveData[k];
            }
        }
    },

    /**
     * Debounced after load or reconnect so menus republish Output Status (see MenuWidget.publishOutputStatusTopic).
     * Uses WorkerTimer because cold-start setTimeout throttling can otherwise stall the publish 10-20 s.
     */
    scheduleMenuOutputStatusSync: function () {
        if (this.isEditMode) return;
        if (this._menuOutputStatusSyncTimer) WorkerTimer.clearTimeout(this._menuOutputStatusSyncTimer);
        this._menuOutputStatusSyncTimer = WorkerTimer.setTimeout(() => {
            this._menuOutputStatusSyncTimer = null;
            this.publishMenuOutputStatusTopics();
        }, 160);
    },

    /**
     * Notifies the active data driver (e.g. Homey) of the active page index with deduplication.
     */
    _notifyPageChanged: function (page) {
        var dashName = this.activeFileName;
        if (!dashName) return;
        var cleanName = String(dashName).replace(/\.json$/i, '');
        var pageNum = Math.max(1, parseInt(String(page != null ? page : 1), 10) || 1);
        if (this._lastNotifiedPage === pageNum && this._lastNotifiedDashboard === cleanName) return;
        this._lastNotifiedPage = pageNum;
        this._lastNotifiedDashboard = cleanName;
        var driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        if (driver && typeof driver.sendPageNotification === 'function') {
            driver.sendPageNotification(cleanName, pageNum);
        }
    },

    /**
     * Publish active page to MASTER_SETTINGS.currentPageOutputTopic (view mode).
     * - `local/…` fires immediately: in-browser loopback, no network cost, and avoids
     *   debounce-reset starvation when a single user action triggers a chain of
     *   updateGlobal calls (slider → globalBinding → updateGlobal → schedule again).
     * - Non-local topics use a 160 ms trailing debounce to coalesce rapid page changes
     *   and avoid hammering MQTT/Homey transport.
     * Runs after dashboard load, driver reconnect, page changes, or when the output topic setting changes.
     */
    scheduleCurrentPageOutputTopicPublish: function () {
        if (this.isEditMode) return;
        const topic = String(MASTER_SETTINGS.currentPageOutputTopic || '').trim();
        if (topic.startsWith('local/')) {
            if (this._currentPageOutputTopicTimer) {
                WorkerTimer.clearTimeout(this._currentPageOutputTopicTimer);
                this._currentPageOutputTopicTimer = null;
            }
            this.publishCurrentPageOutputTopic();
            return;
        }
        // WorkerTimer: load-time/page-change publishes must not be stalled by cold-start throttling.
        if (this._currentPageOutputTopicTimer) WorkerTimer.clearTimeout(this._currentPageOutputTopicTimer);
        this._currentPageOutputTopicTimer = WorkerTimer.setTimeout(() => {
            this._currentPageOutputTopicTimer = null;
            this.publishCurrentPageOutputTopic();
        }, 160);
    },

    /**
     * Publishes the current dashboard page index (1-based string) to currentPageOutputTopic when set.
     * `local/…` uses driver loopback and must not be gated on transport (socket/MQTT) connect.
     */
    publishCurrentPageOutputTopic: function () {
        if (this.isEditMode) return;
        const driver = DataDriverRegistry.get();
        if (!driver) return;
        const topic = String(MASTER_SETTINGS.currentPageOutputTopic || '').trim();
        if (!topic) return;
        const isLocalLoopback = topic.startsWith('local/');
        if (!isLocalLoopback && !this._dataDriverConnected) return;
        const page = Math.max(1, parseInt(String(MASTER_SETTINGS.currentPage), 10) || 1);
        this.send(topic, String(page));
    },

    send: function (topic, payload) {
        const driver = DataDriverRegistry.get();
        if (driver) {
            driver.publish(topic, payload);
        } else {
            console.warn("Cannot send message: No Data Driver active");
        }
    },

    /** Invokes MenuWidget.publishOutputStatusTopic on each menu (after load or driver connect). */
    publishMenuOutputStatusTopics: function () {
        if (this.isEditMode) return;
        Object.values(this.widgets || {}).forEach((w) => {
            if (w && typeof w.publishOutputStatusTopic === 'function') w.publishOutputStatusTopic();
        });
    },

    iconCallback: null,
    ibState: {
        filtered: [],
        toRender: 0,
        batchSize: 100,
        scrollListener: null,
        loading: false,
        iconsData: null
    },

    openIconBrowser: async function (current, cb) {
        this.iconCallback = cb;
        const grid = document.getElementById('ib-grid');
        if (!grid) {
            console.warn('[Dashboard] openIconBrowser: #ib-grid not found');
            return;
        }

        if (!this.ibState.iconsData && this.ibState.loading) {
            return;
        }

        grid.innerHTML = '';

        if (!this.ibState.iconsData) {
            this.ibState.loading = true;
            grid.innerHTML = '<div class="ds-file-list-empty col-span-full">Loading icon library...</div>';
            document.getElementById('icon-modal').classList.add('open');

            try {
                const res = await fetch('data-phosphor-icons.json');
                if (!res.ok) throw new Error("File not found or failed to load");
                this.ibState.iconsData = await res.json();

                // Pre-calculate search strings for performance (name + categories + tags)
                this.ibState.iconsData.forEach(ic => {
                    const parts = [ic.name];
                    if (ic.categories) parts.push(...ic.categories);
                    if (ic.tags) parts.push(...ic.tags);
                    ic._searchStr = parts.join(" ").toLowerCase();
                });
            } catch (err) {
                console.error("[Dashboard] Icon list load error:", err);
                grid.innerHTML = `<div class="text-xs text-red-500 text-center w-full py-4 col-span-full">Failed to load icons: ${err.message}</div>`;
                this.ibState.loading = false;
                return;
            }
            this.ibState.loading = false;
            grid.innerHTML = ''; // Clear loading text
        }

        // Remove existing listener if any
        if (this.ibState.scrollListener) {
            grid.removeEventListener('scroll', this.ibState.scrollListener);
        }

        this.ibState.scrollListener = () => {
            if (grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 50) {
                this._renderIconBatch();
            }
        };
        grid.addEventListener('scroll', this.ibState.scrollListener);

        this.filterIcons('');
        document.getElementById('ib-search').value = '';
        document.getElementById('icon-modal').classList.add('open');
        document.getElementById('ib-search').focus();
    },

    filterIcons: function (query) {
        const grid = document.getElementById('ib-grid');
        grid.innerHTML = '';
        grid.scrollTop = 0; // Reset scroll position on new search
        const q = (query || '').trim().toLowerCase();

        if (!this.ibState.iconsData) {
            this.ibState.filtered = [];
        } else if (!q) {
            this.ibState.filtered = this.ibState.iconsData;
        } else {
            this.ibState.filtered = this.ibState.iconsData.filter(i => i._searchStr.includes(q));
        }

        this.ibState.toRender = 0;

        if (this.ibState.filtered.length === 0 && this.ibState.iconsData) {
            grid.innerHTML = '<div class="ds-file-list-empty col-span-full">No matching icons found.</div>';
        } else {
            this._renderIconBatch();
        }
    },

    _renderIconBatch: function () {
        const grid = document.getElementById('ib-grid');
        if (this.ibState.toRender >= this.ibState.filtered.length) return; // All rendered

        const endIdx = Math.min(this.ibState.toRender + this.ibState.batchSize, this.ibState.filtered.length);
        const batch = this.ibState.filtered.slice(this.ibState.toRender, endIdx);

        batch.forEach(iconObj => {
            const iconName = "ph-" + iconObj.name;
            const el = document.createElement('div');
            el.className = 'ib-item';
            el.innerHTML = `<i class="ph ${iconName}"></i><span>${iconObj.name}</span>`;
            el.onclick = () => {
                if (this.iconCallback) this.iconCallback(iconName);
                document.getElementById('icon-modal').classList.remove('open');
            };
            grid.appendChild(el);
        });

        this.ibState.toRender = endIdx;

        // Auto-fill: if we haven't rendered enough to trigger a scrollbar, load another batch
        requestAnimationFrame(() => {
            if (grid.scrollHeight <= grid.clientHeight && this.ibState.toRender < this.ibState.filtered.length) {
                this._renderIconBatch();
            }
        });
    },

    _loopRafId: null,
    _pageHidden: false,

    _setPageHidden: function (hidden) {
        hidden = !!hidden;
        if (this._pageHidden === hidden) {
            if (!hidden) {
                const driver = typeof DataDriverRegistry !== 'undefined' ? DataDriverRegistry.get() : null;
                if (driver && typeof driver.resumeConnection === 'function') {
                    driver.resumeConnection();
                }
            }
            return;
        }
        this._pageHidden = hidden;
        const widgets = this.widgets || {};
        const ids = Object.keys(widgets);
        if (hidden) {
            if (this._loopRafId && typeof cancelAnimationFrame === 'function') {
                cancelAnimationFrame(this._loopRafId);
            }
            this._loopRafId = null;
            for (let i = 0; i < ids.length; i++) {
                const w = widgets[ids[i]];
                if (w && typeof w.pauseForBackground === 'function') w.pauseForBackground();
            }
            const driver = typeof DataDriverRegistry !== 'undefined' ? DataDriverRegistry.get() : null;
            if (driver && typeof driver.pauseForBackground === 'function') driver.pauseForBackground();
        } else {
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                const w = widgets[id];
                if (!w) continue;
                const isOnPage = (typeof this._widgetCoversActivePage === 'function')
                    ? this._widgetCoversActivePage(id, w)
                    : (w.elements && w.elements.wrapper && w.elements.wrapper.style.display !== 'none');
                if (isOnPage) {
                    if (typeof w.resumeFromBackground === 'function') w.resumeFromBackground();
                    this._syncWidgetPageChrome(w, true);
                } else {
                    if (typeof w.pauseForBackground === 'function') w.pauseForBackground();
                    this._syncWidgetPageChrome(w, false);
                }
            }
            const driver = typeof DataDriverRegistry !== 'undefined' ? DataDriverRegistry.get() : null;
            if (driver && typeof driver.resumeFromBackground === 'function') driver.resumeFromBackground();
            if (driver && typeof driver.resumeConnection === 'function') {
                driver.resumeConnection();
            }
            if (this.loopCallbacks.size > 0 && !this._loopRafId) {
                this._loopRafId = requestAnimationFrame(() => this.loop());
            }
            this._tickCountdownWidgets();
        }
        this._syncCountdownHeartbeatTimer();
    },

    _countdownWidgetIds: new Set(),
    _countdownHeartbeatTimer: null,
    _countdownHeartbeatUsesWorker: false,

    registerCountdownWidget: function (id) {
        if (!id) return;
        this._countdownWidgetIds.add(String(id));
        this._syncCountdownHeartbeatTimer();
    },

    unregisterCountdownWidget: function (id) {
        if (!id) return;
        this._countdownWidgetIds.delete(String(id));
        this._syncCountdownHeartbeatTimer();
    },

    _syncCountdownHeartbeatTimer: function () {
        const shouldRun = !this._pageHidden && this._countdownWidgetIds && this._countdownWidgetIds.size > 0;
        if (!shouldRun) {
            if (this._countdownHeartbeatTimer !== null) {
                if (this._countdownHeartbeatUsesWorker && typeof WorkerTimer !== 'undefined' && WorkerTimer && typeof WorkerTimer.clearInterval === 'function') {
                    WorkerTimer.clearInterval(this._countdownHeartbeatTimer);
                } else {
                    clearInterval(this._countdownHeartbeatTimer);
                }
                this._countdownHeartbeatTimer = null;
                this._countdownHeartbeatUsesWorker = false;
            }
            return;
        }
        if (this._countdownHeartbeatTimer !== null) return;
        const self = this;
        const tickFn = function () {
            self._tickCountdownWidgets();
        };
        if (typeof WorkerTimer !== 'undefined' && WorkerTimer && typeof WorkerTimer.setInterval === 'function') {
            this._countdownHeartbeatUsesWorker = true;
            this._countdownHeartbeatTimer = WorkerTimer.setInterval(tickFn, 1000);
        } else {
            this._countdownHeartbeatUsesWorker = false;
            this._countdownHeartbeatTimer = setInterval(tickFn, 1000);
        }
    },

    _tickCountdownWidgets: function () {
        if (this._pageHidden || !this._countdownWidgetIds || this._countdownWidgetIds.size === 0) {
            this._syncCountdownHeartbeatTimer();
            return;
        }
        const ids = Array.from(this._countdownWidgetIds);
        for (let i = 0; i < ids.length; i++) {
            const wid = ids[i];
            const w = this.widgets && this.widgets[wid];
            if (!w) {
                this._countdownWidgetIds.delete(wid);
                continue;
            }
            const onPage = (typeof this._widgetCoversActivePage === 'function')
                ? this._widgetCoversActivePage(wid, w)
                : true;
            if (!onPage) continue;
            try {
                if (typeof w.tickCountdowns === 'function') {
                    w.tickCountdowns();
                } else {
                    w.render();
                }
            } catch (err) {
                console.error('[Dashboard] Countdown tick failed for', wid, err);
            }
        }
        this._syncCountdownHeartbeatTimer();
    },

    registerTicker: function (id, cb) { 
        this.loopCallbacks.set(id, cb); 
        if (!this._pageHidden && !this._loopRafId) {
            this._loopRafId = requestAnimationFrame(() => this.loop());
        }
    },
    unregisterTicker: function (id) { 
        this.loopCallbacks.delete(id); 
    },

    loop: function () {
        this._loopRafId = null;
        if (this._pageHidden || this.loopCallbacks.size === 0) return;
        const self = this;
        this.loopCallbacks.forEach(function (cb, id) {
            try {
                cb();
            } catch (err) {
                console.error('[Dashboard] Ticker callback failed for', id, err);
            }
        });
        if (!self._pageHidden && self.loopCallbacks.size > 0 && !self._loopRafId) {
            self._loopRafId = requestAnimationFrame(function () { self.loop(); });
        }
    },

    toggleEditMode: function () {
        if (this._holdLivePreviewActive) {
            this.exitHoldLivePreview();
            return;
        }

        this.isEditMode = !this.isEditMode;
        if (typeof DashboardDialog !== 'undefined' && DashboardDialog.dismiss) {
            DashboardDialog.dismiss();
        }

        if (!this.isEditMode) {
            this._clearEditGestures();
            this.openedGroupId = null;
            if (typeof Editor !== 'undefined' && typeof Editor._closeAllDsFixedDropdowns === 'function') {
                Editor._closeAllDsFixedDropdowns();
            }
            this.selectWidget(null);
        } else {
            if (typeof Editor !== 'undefined' && typeof Editor.loadWidget === 'function') {
                const targetId = (this.selectedIds && this.selectedIds.length === 1)
                    ? this.selectedIds[0]
                    : (this.selectedIds && this.selectedIds.length > 1 ? 'MULTIPLE' : 'GLOBAL_SETTINGS');
                if (Editor.currentId !== targetId) {
                    Editor.loadWidget(targetId);
                }
            }
        }
        this._applyEditModeVisuals();
        this._syncInactivityPageWatch();
        this._syncGestureControls();
        if (this.isEditMode && typeof DemoOnboarding !== 'undefined' && typeof DemoOnboarding.onEditorOpened === 'function') {
            DemoOnboarding.onEditorOpened();
        }
    },

    /**
     * Page number from the dashboard URL (?page=), or null when the query is absent.
     * Same parse as the startup loader so a bookmark and a fresh load agree.
     */
    _requestedPageFromUrl: function () {
        if (typeof window === 'undefined' || !window.location) return null;
        var raw = null;
        try {
            raw = new URLSearchParams(window.location.search).get('page');
        } catch (e) {
            return null;
        }
        if (raw == null || raw === '') return null;
        var n = parseInt(raw, 10);
        if (isNaN(n)) return null;
        return n;
    },

    /**
     * On each dashboard load, open Landing Page when that feature is on.
     * A URL page= query opens that page and leaves the saved Active Page unused.
     * Assigned before widgets are created so the first paint is already correct.
     */
    _applyStartupPageChoice: function () {
        var urlPage = this._requestedPageFromUrl();
        if (urlPage != null) {
            MASTER_SETTINGS.currentPage = urlPage;
            return;
        }
        if (!this._inactivityFeatureEnabled()) return;
        MASTER_SETTINGS.currentPage = this._inactivityReturnPageNumber();
    },

    /**
     * Viewer idle return. One deadline timer. Activity only stores a timestamp.
     * Pointer travel and hover are not listened for. A held press keeps the
     * deadline open until release, without move events.
     */
    _inactivityFeatureEnabled: function () {
        return !!(MASTER_SETTINGS && MASTER_SETTINGS.inactivityPageEnabled === true);
    },

    _inactivityTimeoutSeconds: function () {
        var raw = Number(MASTER_SETTINGS && MASTER_SETTINGS.inactivityTimeoutSeconds);
        if (!isFinite(raw)) return 60;
        return Math.max(0, Math.min(86400, Math.round(raw)));
    },

    _inactivityTimeoutEnabled: function () {
        return this._inactivityFeatureEnabled() && this._inactivityTimeoutSeconds() > 0;
    },

    _inactivityRuntimeBlocked: function () {
        if (this.isEditMode || this._holdLivePreviewActive) return true;
        var overlay = (typeof document !== 'undefined') ? document.getElementById('loading-overlay') : null;
        if (overlay && overlay.classList.contains('show')) return true;
        return false;
    },

    _inactivityTimeoutMs: function () {
        var sec = this._inactivityTimeoutSeconds();
        if (sec < 1) sec = 60;
        return sec * 1000;
    },

    _inactivityReturnPageNumber: function () {
        var raw = parseInt(String(MASTER_SETTINGS && MASTER_SETTINGS.inactivityReturnPage != null ? MASTER_SETTINGS.inactivityReturnPage : 1), 10);
        if (!isFinite(raw) || raw < 1) return 1;
        return raw;
    },

    _ensureInactivityHandlers: function () {
        if (this._inactivityOnUserEvent) return;
        var self = this;
        this._inactivityOnUserEvent = function (e) { self._onInactivityUserEvent(e); };
        this._inactivityOnVisibility = function () { self._onInactivityVisibility(); };
        this._inactivityOnBlur = function () { self._inactivityContactCount = 0; };
        this._inactivityListenerOpts = { capture: true, passive: true };
        var names = ['keydown', 'wheel', 'input'];
        if (typeof window.PointerEvent === 'function') {
            names.push('pointerdown', 'pointerup', 'pointercancel');
        } else {
            names.push('mousedown', 'mouseup', 'touchstart', 'touchend', 'touchcancel');
        }
        this._inactivityEventNames = names;
    },

    _installInactivityListeners: function () {
        if (this._inactivityListenersOn || typeof document === 'undefined') return;
        this._ensureInactivityHandlers();
        var names = this._inactivityEventNames;
        var opts = this._inactivityListenerOpts;
        var handler = this._inactivityOnUserEvent;
        for (var i = 0; i < names.length; i++) {
            document.addEventListener(names[i], handler, opts);
        }
        window.addEventListener('blur', this._inactivityOnBlur, false);
        this._inactivityListenersOn = true;
    },

    _removeInactivityListeners: function () {
        if (!this._inactivityListenersOn || typeof document === 'undefined') return;
        var names = this._inactivityEventNames || [];
        var handler = this._inactivityOnUserEvent;
        for (var i = 0; i < names.length; i++) {
            document.removeEventListener(names[i], handler, true);
        }
        window.removeEventListener('blur', this._inactivityOnBlur, false);
        this._inactivityListenersOn = false;
        this._inactivityContactCount = 0;
    },

    _onInactivityUserEvent: function (e) {
        if (!e || e.isTrusted === false || !this._inactivityWatchRunning) return;
        var type = e.type;
        var count = this._inactivityContactCount || 0;
        if (type === 'pointerdown' || type === 'mousedown') {
            count += 1;
        } else if (type === 'pointerup' || type === 'pointercancel' || type === 'mouseup') {
            count -= 1;
        } else if (type === 'touchstart') {
            count += (e.changedTouches && e.changedTouches.length) ? e.changedTouches.length : 1;
        } else if (type === 'touchend' || type === 'touchcancel') {
            count -= (e.changedTouches && e.changedTouches.length) ? e.changedTouches.length : 1;
        }
        if (count < 0) count = 0;
        this._inactivityContactCount = count;
        this._inactivityLastAt = Date.now();
    },

    _clearInactivityTimer: function () {
        if (this._inactivityTimer) {
            clearTimeout(this._inactivityTimer);
            this._inactivityTimer = null;
        }
    },

    _armInactivityTimer: function () {
        this._clearInactivityTimer();
        if (!this._inactivityWatchRunning || !this._inactivityTimeoutEnabled()) return;
        var timeoutMs = this._inactivityTimeoutMs();
        var elapsed = Date.now() - (this._inactivityLastAt || Date.now());
        var remain = timeoutMs - elapsed;
        if (remain < 50) remain = 50;
        var self = this;
        this._inactivityTimer = setTimeout(function () {
            self._onInactivityTimer();
        }, remain);
    },

    _onInactivityVisibility: function () {
        if (typeof document !== 'undefined' && document.hidden) return;
        if (!this._inactivityWatchRunning) {
            this._syncInactivityPageWatch();
        this._syncGestureControls();
            return;
        }
        this._onInactivityTimer();
    },

    _onInactivityTimer: function () {
        this._clearInactivityTimer();
        if (!this._inactivityWatchRunning || !this._inactivityTimeoutEnabled()) return;
        if ((this._inactivityContactCount || 0) > 0) {
            this._inactivityLastAt = Date.now();
            this._armInactivityTimer();
            return;
        }
        var timeoutMs = this._inactivityTimeoutMs();
        var elapsed = Date.now() - (this._inactivityLastAt || 0);
        if (elapsed < timeoutMs) {
            this._armInactivityTimer();
            return;
        }
        var target = this._inactivityReturnPageNumber();
        var current = Math.max(1, parseInt(String(MASTER_SETTINGS.currentPage != null ? MASTER_SETTINGS.currentPage : 1), 10) || 1);
        this._inactivityLastAt = Date.now();
        if (target !== current) {
            this.updateGlobal({ currentPage: target });
        }
        if (this._inactivityWatchRunning) this._armInactivityTimer();
    },

    _syncInactivityPageWatch: function () {
        var timerEnabled = this._inactivityTimeoutEnabled();
        this._ensureInactivityHandlers();
        if (timerEnabled && !this._inactivityVisibilityOn && typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this._inactivityOnVisibility, false);
            this._inactivityVisibilityOn = true;
        } else if (!timerEnabled && this._inactivityVisibilityOn && typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this._inactivityOnVisibility, false);
            this._inactivityVisibilityOn = false;
        }
        var run = timerEnabled && !this._inactivityRuntimeBlocked();
        var blockedByEdit = !!(this.isEditMode || this._holdLivePreviewActive);
        if (run) {
            if (!this._inactivityListenersOn) this._installInactivityListeners();
            if (this._inactivityHeldForEdit || !this._inactivityWatchRunning) {
                this._inactivityLastAt = Date.now();
                this._inactivityContactCount = 0;
            }
            this._inactivityHeldForEdit = false;
            this._inactivityWatchRunning = true;
            this._armInactivityTimer();
            return;
        }
        if (blockedByEdit) this._inactivityHeldForEdit = true;
        this._inactivityWatchRunning = false;
        this._inactivityContactCount = 0;
        this._clearInactivityTimer();
        if (this._inactivityListenersOn) this._removeInactivityListeners();
    },

    _gestureControlsFeatureEnabled: function () {
        if (!MASTER_SETTINGS) return false;
        return !!(
            MASTER_SETTINGS.swipeLeftEnabled ||
            MASTER_SETTINGS.swipeRightEnabled ||
            MASTER_SETTINGS.swipeUpEnabled ||
            MASTER_SETTINGS.swipeDownEnabled
        );
    },

    _syncGestureControls: function () {
        var enabled = this._gestureControlsFeatureEnabled();
        var isViewerActive = !this.isEditMode && !this._holdLivePreviewActive;
        if (typeof document !== 'undefined') {
            if (document.body) {
                document.body.classList.toggle('gestures-enabled', enabled && isViewerActive);
            }
            if (document.documentElement) {
                document.documentElement.classList.toggle('gestures-enabled', enabled && isViewerActive);
            }
        }
        if (enabled && isViewerActive) {
            this._installGestureListeners();
        } else {
            this._removeGestureListeners();
        }
    },

    _ensureGestureHandlers: function () {
        if (this._gestureHandlersReady) return;
        var self = this;
        this._onGestureTouchStart = function (e) { self._handleGestureTouchStart(e); };
        this._onGestureTouchMove = function (e) { self._handleGestureTouchMove(e); };
        this._onGestureTouchEnd = function (e) { self._handleGestureTouchEnd(e); };
        this._onGestureMouseDown = function (e) { self._handleGestureMouseDown(e); };
        this._onGestureMouseMove = function (e) { self._handleGestureMouseMove(e); };
        this._onGestureMouseUp = function (e) { self._handleGestureMouseUp(e); };
        this._gestureHandlersReady = true;
    },

    _installGestureListeners: function () {
        if (this._gestureListenersOn || typeof document === 'undefined') return;
        this._ensureGestureHandlers();
        document.addEventListener('touchstart', this._onGestureTouchStart, { passive: true });
        document.addEventListener('touchmove', this._onGestureTouchMove, { passive: false });
        document.addEventListener('touchend', this._onGestureTouchEnd, { passive: true });
        document.addEventListener('touchcancel', this._onGestureTouchEnd, { passive: true });

        document.addEventListener('mousedown', this._onGestureMouseDown, false);
        document.addEventListener('mousemove', this._onGestureMouseMove, false);
        document.addEventListener('mouseup', this._onGestureMouseUp, false);
        this._gestureListenersOn = true;
    },

    _removeGestureListeners: function () {
        if (!this._gestureListenersOn || typeof document === 'undefined') return;
        document.removeEventListener('touchstart', this._onGestureTouchStart, { passive: true });
        document.removeEventListener('touchmove', this._onGestureTouchMove, false);
        document.removeEventListener('touchend', this._onGestureTouchEnd, { passive: true });
        document.removeEventListener('touchcancel', this._onGestureTouchEnd, { passive: true });

        document.removeEventListener('mousedown', this._onGestureMouseDown, false);
        document.removeEventListener('mousemove', this._onGestureMouseMove, false);
        document.removeEventListener('mouseup', this._onGestureMouseUp, false);
        this._gestureListenersOn = false;
        this._gestureTouchState = null;
        this._gestureMouseState = null;
    },

    _isInteractiveGestureTarget: function (target) {
        if (!target) return false;

        // 1. Native form controls
        if (typeof target.closest === 'function') {
            if (target.closest('input, textarea, select, option, button, [data-prevent-swipe]')) {
                return true;
            }
        }

        // 2. Widget-specific interactive elements: O(1) instance lookup via Dashboard.widgets
        var wrap = (typeof target.closest === 'function') ? target.closest('.widget-wrapper') : null;
        if (wrap && wrap.dataset && wrap.dataset.id) {
            var wid = wrap.dataset.id;
            var widget = (typeof Dashboard !== 'undefined' && Dashboard.widgets) ? Dashboard.widgets[wid] : null;
            if (widget) {
                var type = widget.type;
                // Slider widget: interactive continuous drag control
                if (type === 'slider') {
                    return true;
                }
                // Switch / Pill buttons: button, knob, or interactive switch layout
                if (type === 'switch') {
                    if (typeof target.closest === 'function' && target.closest('.sw-btn, .sw-knob, .sw-layout')) {
                        return true;
                    }
                }
                // Light Grid: tile buttons, panel sliders, and controls
                if (type === 'lightgrid') {
                    if (typeof target.closest === 'function' && target.closest('.lg-tile, .lg-slider, .lg-panel, .lg-header-btn')) {
                        return true;
                    }
                }
                // Menu: menu items
                if (type === 'menu') {
                    if (typeof target.closest === 'function' && target.closest('.menu-item, .ds-menu-item, .menu-dropdown')) {
                        return true;
                    }
                }
                // Text widget: only prevent swipe if it actually has active scrollbars!
                if (type === 'text') {
                    var scrollHost = wrap.querySelector('.text-md-scroll-host');
                    if (scrollHost) {
                        if (scrollHost.scrollHeight > scrollHost.clientHeight + 2 ||
                            scrollHost.scrollWidth > scrollHost.clientWidth + 2) {
                            return true;
                        }
                    }
                }
                // List / Log widget: prevent swipe if scrollable items exist
                if (type === 'list' || type === 'textbox') {
                    var listEl = wrap.querySelector('.tb-list') || wrap.querySelector('.widget-content');
                    if (listEl && listEl.scrollHeight > listEl.clientHeight + 2) {
                        return true;
                    }
                }
            }
        }

        // 3. Fallback for widget control classes even if wrap lookup is unavailable
        if (typeof target.closest === 'function') {
            if (target.closest('.trk-c, .sl-layout, .sl-body, .sw-btn, .sw-knob, .lg-tile, .lg-slider, .menu-item')) {
                return true;
            }
        }

        // 4. Any general scrollable container in the DOM (e.g. dialogs, popups)
        var el = target;
        while (el && el !== document.body && el !== document.documentElement) {
            if (el.scrollHeight > el.clientHeight + 4) {
                var overflowY = (window.getComputedStyle && typeof window.getComputedStyle === 'function')
                    ? window.getComputedStyle(el).overflowY
                    : (el.style ? el.style.overflowY : '');
                if (overflowY === 'auto' || overflowY === 'scroll') {
                    return true;
                }
            }
            el = el.parentElement;
        }

        return false;
    },

    _handleGestureTouchStart: function (e) {
        if (this.isEditMode || this._holdLivePreviewActive) return;
        if (!e || !e.touches || e.touches.length !== 1) {
            this._gestureTouchState = null;
            return;
        }
        if (this._isInteractiveGestureTarget(e.target)) {
            this._gestureTouchState = null;
            return;
        }
        this._gestureTouchState = {
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            startTime: Date.now(),
            isSwipingHoriz: false
        };
    },

    _handleGestureTouchMove: function (e) {
        if (!this._gestureTouchState || !e || !e.touches || e.touches.length !== 1) return;
        var dx = e.touches[0].clientX - this._gestureTouchState.startX;
        var dy = e.touches[0].clientY - this._gestureTouchState.startY;
        var absX = Math.abs(dx);
        var absY = Math.abs(dy);
        if (absX > 6 && absX > absY) {
            this._gestureTouchState.isSwipingHoriz = true;
            if (e.cancelable && typeof e.preventDefault === 'function') {
                e.preventDefault();
            }
        }
    },

    _handleGestureTouchEnd: function (e) {
        if (!this._gestureTouchState || !e) return;
        var touch = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
        if (!touch) {
            this._gestureTouchState = null;
            return;
        }
        var state = this._gestureTouchState;
        this._gestureTouchState = null;
        var dx = touch.clientX - state.startX;
        var dy = touch.clientY - state.startY;
        var elapsed = Date.now() - state.startTime;
        this._processGestureEnd(dx, dy, elapsed);
    },

    _handleGestureMouseDown: function (e) {
        if (this.isEditMode || this._holdLivePreviewActive) return;
        if (MASTER_SETTINGS && MASTER_SETTINGS.gestureTouchOnly !== false) return;
        if (!e || e.button !== 0) return;
        if (this._isInteractiveGestureTarget(e.target)) {
            this._gestureMouseState = null;
            return;
        }
        this._gestureMouseState = {
            startX: e.clientX,
            startY: e.clientY,
            startTime: Date.now()
        };
    },

    _handleGestureMouseMove: function (e) {
        if (!this._gestureMouseState || !e) return;
        var dx = e.clientX - this._gestureMouseState.startX;
        var dy = e.clientY - this._gestureMouseState.startY;
        if (Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            if (e.cancelable && typeof e.preventDefault === 'function') {
                e.preventDefault();
            }
        }
    },

    _handleGestureMouseUp: function (e) {
        if (!this._gestureMouseState || !e) return;
        var state = this._gestureMouseState;
        this._gestureMouseState = null;
        var dx = e.clientX - state.startX;
        var dy = e.clientY - state.startY;
        var elapsed = Date.now() - state.startTime;
        this._processGestureEnd(dx, dy, elapsed);
    },

    _processGestureEnd: function (deltaX, deltaY, elapsed) {
        if (elapsed > 800 || elapsed < 50) return;
        var now = Date.now();
        if (this._gestureCooldownUntil && now < this._gestureCooldownUntil) return;
        var absX = Math.abs(deltaX);
        var absY = Math.abs(deltaY);
        var minDistance = 50;

        var dir = null;
        if (absX >= minDistance && absX >= absY * 1.5) {
            dir = deltaX < 0 ? 'swipeLeft' : 'swipeRight';
        } else if (absY >= minDistance && absY >= absX * 1.5) {
            dir = deltaY < 0 ? 'swipeUp' : 'swipeDown';
        }
        if (!dir) return;

        this._gestureCooldownUntil = now + 350;
        this._executeGestureAction(dir);
    },

    _executeGestureAction: function (direction) {
        if (!MASTER_SETTINGS || !MASTER_SETTINGS[direction + 'Enabled']) return;
        var defaultAction = (direction === 'swipeLeft') ? 'next_page'
            : (direction === 'swipeRight' ? 'prev_page' : 'topic');
        var action = MASTER_SETTINGS[direction + 'Action'] || defaultAction;

        if (action === 'next_page') {
            this._navigateSwipePage(1);
        } else if (action === 'prev_page') {
            this._navigateSwipePage(-1);
        } else if (action === 'specific_page') {
            var page = parseInt(String(MASTER_SETTINGS[direction + 'Page']), 10);
            if (Number.isFinite(page) && page > 0) {
                var current = Math.max(1, parseInt(String(MASTER_SETTINGS.currentPage != null ? MASTER_SETTINGS.currentPage : 1), 10) || 1);
                if (page !== current) {
                    this.updateGlobal({ currentPage: page });
                }
            }
        } else if (action === 'topic') {
            var topic = String(MASTER_SETTINGS[direction + 'Topic'] || '').trim();
            if (topic) {
                var payload = String(MASTER_SETTINGS[direction + 'Payload'] != null ? MASTER_SETTINGS[direction + 'Payload'] : '');
                this.send(topic, payload);
            }
        }
    },

    _navigateSwipePage: function (step) {
        var allPages = typeof this._getPagesWithWidgets === 'function' ? this._getPagesWithWidgets() : [1];
        if (!allPages || !allPages.length) allPages = [1];
        var ignored = this._parseIgnoredSwipePages(MASTER_SETTINGS && MASTER_SETTINGS.swipeIgnorePages);
        var eligible = allPages.filter(function (p) {
            return !ignored[p];
        });
        if (!eligible.length) eligible = allPages;

        var current = Math.max(1, parseInt(String(MASTER_SETTINGS && MASTER_SETTINGS.currentPage != null ? MASTER_SETTINGS.currentPage : 1), 10) || 1);
        var wrapAround = !!(MASTER_SETTINGS && MASTER_SETTINGS.swipeWrapAround === true);
        var target = null;

        if (step > 0) {
            for (var i = 0; i < eligible.length; i++) {
                if (eligible[i] > current) {
                    target = eligible[i];
                    break;
                }
            }
            if (target === null && wrapAround) {
                target = eligible[0];
            }
        } else {
            for (var j = eligible.length - 1; j >= 0; j--) {
                if (eligible[j] < current) {
                    target = eligible[j];
                    break;
                }
            }
            if (target === null && wrapAround) {
                target = eligible[eligible.length - 1];
            }
        }

        if (target !== null && target !== current) {
            this.updateGlobal({ currentPage: target });
        }
    },

    _parseIgnoredSwipePages: function (raw) {
        var out = {};
        if (!raw || typeof raw !== 'string') return out;
        var parts = raw.split(',');
        for (var i = 0; i < parts.length; i++) {
            var t = parts[i].trim();
            if (!t) continue;
            var range = t.match(/^(\d+)\s*-\s*(\d+)$/);
            if (range) {
                var lo = parseInt(range[1], 10);
                var hi = parseInt(range[2], 10);
                if (Number.isFinite(lo) && Number.isFinite(hi)) {
                    if (lo > hi) { var tmp = lo; lo = hi; hi = tmp; }
                    for (var p = lo; p <= hi; p++) {
                        out[p] = true;
                    }
                }
                continue;
            }
            var n = parseInt(t, 10);
            if (Number.isFinite(n) && n > 0) {
                out[n] = true;
            }
        }
        return out;
    }
};

if (typeof window !== 'undefined') {
    window.Dashboard = Dashboard;
}