/**
 * Reset Canvas Wizard - multi-step dialog for Editor Mode, Layout Mode, Theme, and live widgets.
 * Resolves { action: 'apply'|'skip'|'cancel', editorMode, layoutMode, themeKey, widgets }.
 *
 * Add future screens by appending to STEPS (id must match data-rcw-step on a section).
 * Step dots / "Step X of Y" / Next vs Create Dashboard update from STEPS automatically.
 */
const ResetCanvasWizard = {
    /** Ordered wizard screens. Last step always uses Create Dashboard as the primary action. */
    STEPS: [
        { id: 'editor' },
        { id: 'layout' },
        { id: 'theme' },
        { id: 'populate' }
    ],

    /** Default canvas: iPad Air 10.9" landscape. */
    DEFAULT_CANVAS: { preset: '1180,820', width: 1180, height: 820 },

    _resolve: null,
    _openPromise: null,
    _boundKeydown: null,
    _topicGate: false,
    _helpParked: false,
    _helpObserver: null,
    _sizeSelect: null,
    _sizeSelectMode: null,
    _platformSelect: null,
    _themeGrid: null,
    _galleryThemeSnapshot: null,
    _galleryThemeSeq: 0,
    stepIndex: 0,
    editorMode: 'advanced',
    layoutMode: 'fixed',
    themeKey: 'default_dark',

    open: function () {
        const self = this;
        if (self._openPromise) {
            if (self._helpParked) self._resumeAfterHelp();
            return self._openPromise;
        }
        self._openPromise = new Promise((resolve) => {
            self._resolve = function (result) {
                self._openPromise = null;
                resolve(result);
            };
            self._resetChoices();
            self._bindUi();
            const modal = document.getElementById('reset-canvas-wizard-modal');
            if (!modal) {
                const finish = self._resolve;
                self._resolve = null;
                self._openPromise = null;
                finish(self._result('cancel', []));
                return;
            }
            if (!self._hasSelectableTopics()) {
                self._showTopicGate();
                return;
            }
            self._beginWizard();
        });
        return self._openPromise;
    },

    _resetChoices: function () {
        const canvas = this.DEFAULT_CANVAS;
        this.stepIndex = 0;
        this.editorMode = 'advanced';
        this.layoutMode = 'fixed';
        this.themeKey = 'default_dark';
        this.platform = this._defaultPlatform();
        this._platformTouched = false;
        this._topicGate = false;
        this._sizeState = {
            fixed: { preset: canvas.preset, width: canvas.width, height: canvas.height },
            scale: { preset: canvas.preset, width: canvas.width, height: canvas.height },
            responsive: { preset: '1920', width: 1920, height: 1080 }
        };
    },

    _driverType: function () {
        if (typeof DataDriverRegistry !== 'undefined' && typeof DataDriverRegistry.getType === 'function') {
            const current = DataDriverRegistry.getType();
            if (current) return String(current);
        }
        if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && MASTER_SETTINGS.dataDriver) {
            return String(MASTER_SETTINGS.dataDriver);
        }
        return 'homey';
    },

    /**
     * Device, sensor, variable, flow, and mood topics. Homey flow-card events,
     * insights, and local loopback are dashboard traffic, not selectable sources.
     */
    _isTransportTopic: function (topic) {
        const t = String(topic || '');
        if (!t) return true;
        if (t.indexOf('local/') === 0) return true;
        if (t.indexOf('homey/event/') === 0) return true;
        if (t.indexOf('homey/insight/') === 0) return true;
        return false;
    },

    _collectKnownTopics: function () {
        const topics = Object.create(null);
        function add(topic) {
            if (topic == null || topic === '') return;
            topics[String(topic)] = true;
        }
        if (typeof Dashboard !== 'undefined' && Dashboard.liveData) {
            Object.keys(Dashboard.liveData).forEach(add);
        }
        if (typeof Dashboard !== 'undefined' && Dashboard.topicMeta) {
            Object.keys(Dashboard.topicMeta).forEach(add);
        }
        const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        if (driver && driver.seenTopics && typeof driver.seenTopics.forEach === 'function') {
            driver.seenTopics.forEach(function (_row, topic) { add(topic); });
        }
        if (driver && driver.topicMap && typeof driver.topicMap.forEach === 'function') {
            driver.topicMap.forEach(function (_row, topic) { add(topic); });
        }
        return topics;
    },

    _hasSelectableTopics: function () {
        const topics = this._collectKnownTopics();
        const names = Object.keys(topics);
        const bareEvents = Object.create(null);
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            if (name.indexOf('homey/event/') === 0) bareEvents[name.slice(12)] = true;
            else if (name.indexOf('homey/insight/') === 0) bareEvents[name.slice(14)] = true;
        }
        const homey = this._driverType() === 'homey' || this._driverType() === 'homeassistant';
        for (let j = 0; j < names.length; j++) {
            const topic = names[j];
            if (this._isTransportTopic(topic)) continue;
            if (bareEvents[topic]) continue;
            const meta = (typeof Dashboard !== 'undefined' && Dashboard.topicMeta) ? Dashboard.topicMeta[topic] : null;
            if (meta && meta.deviceId === 'dashboardstudio') continue;
            if (meta && (meta.deviceId || meta.capabilityId || meta.isVariable || meta.isFlow || meta.isMood)) return true;
            if (!homey) return true;
            if (topic.indexOf('/') !== -1) return true;
        }
        return false;
    },

    _showModal: function () {
        const modal = document.getElementById('reset-canvas-wizard-modal');
        if (!modal) return null;
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        this._armKeydown();
        return modal;
    },

    _armKeydown: function () {
        if (this._boundKeydown) return;
        const self = this;
        this._boundKeydown = function (e) {
            if (e.key !== 'Escape') return;
            if (self._helpParked) return;
            e.preventDefault();
            self._close('cancel');
        };
        document.addEventListener('keydown', this._boundKeydown);
    },

    _showTopicGate: function () {
        this._topicGate = true;
        const content = document.querySelector('#reset-canvas-wizard-modal .rcw-modal-content');
        if (content) content.classList.add('is-topic-gate');
        const gate = document.getElementById('rcw-topic-gate');
        if (gate) {
            gate.hidden = false;
            gate.removeAttribute('hidden');
        }
        this._fillTopicGateCopy();
        const ignoreBtn = document.getElementById('rcw-btn-gate-ignore');
        const okBtn = document.getElementById('rcw-btn-gate-ok');
        if (ignoreBtn) {
            ignoreBtn.hidden = false;
            ignoreBtn.removeAttribute('hidden');
        }
        if (okBtn) {
            okBtn.hidden = false;
            okBtn.removeAttribute('hidden');
        }
        this._showModal();
        if (okBtn && typeof okBtn.focus === 'function') okBtn.focus();
    },

    _fillTopicGateCopy: function () {
        const homey = this._driverType() === 'homey' || this._driverType() === 'homeassistant';
        const title = document.getElementById('rcw-topic-gate-title');
        const lead = document.getElementById('rcw-topic-gate-lead');
        const detail = document.getElementById('rcw-topic-gate-detail');
        const link = document.getElementById('rcw-topic-gate-link');
        const linkLabel = document.getElementById('rcw-topic-gate-link-label');
        if (title) title.textContent = homey ? 'Enable Capabilities First' : 'No Live Topics Yet';
        if (lead) {
            lead.textContent = homey
                ? 'Activate a couple of capabilities first so you can select pre-made widgets.'
                : 'No live topics have arrived yet, so pre-made widgets are not available.';
        }
        if (detail) {
            detail.textContent = homey
                ? (this._driverType() === 'homeassistant'
                    ? 'In Home Assistant, open the Dashboard Studio Configuration panel and enable the entity capabilities you want on the dashboard.'
                    : 'In the Homey app, open Settings, then Dashboard Studio, then Configuration. Expand a device and enable the capabilities you want on the dashboard.')
                : 'Connect your data source and wait until sensor or device values show up. You can also continue and build the canvas by hand.';
        }
        if (link) {
            link.setAttribute('href', homey
                ? 'help://Connecting%20Widgets%20%26%20Data%20%28Topics%29#homey-enabling-capabilities-homey-pro'
                : 'help://Connecting%20Widgets%20%26%20Data%20%28Topics%29');
        }
        if (linkLabel) linkLabel.textContent = homey ? 'How to enable capabilities' : 'Connecting widgets and data';
    },

    _hideTopicGate: function () {
        this._topicGate = false;
        const content = document.querySelector('#reset-canvas-wizard-modal .rcw-modal-content');
        if (content) content.classList.remove('is-topic-gate');
        const gate = document.getElementById('rcw-topic-gate');
        if (gate) {
            gate.hidden = true;
            gate.setAttribute('hidden', '');
        }
        ['rcw-btn-gate-ignore', 'rcw-btn-gate-ok'].forEach(function (id) {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.hidden = true;
            btn.setAttribute('hidden', '');
        });
    },

    _beginWizard: function () {
        this._hideTopicGate();
        this._showModal();
        this._syncUi();
        const primaryBtn = document.getElementById('rcw-btn-primary');
        if (primaryBtn && typeof primaryBtn.focus === 'function') primaryBtn.focus();
    },

    _parkForHelp: function () {
        const panel = document.getElementById('help-panel');
        if (!panel || this._helpObserver) return;
        const self = this;
        const hideModal = function () {
            if (self._helpParked) return;
            self._helpParked = true;
            const modal = document.getElementById('reset-canvas-wizard-modal');
            if (modal) modal.classList.remove('show');
        };
        if (panel.classList.contains('open')) hideModal();
        this._helpObserver = new MutationObserver(function () {
            if (panel.classList.contains('open')) hideModal();
            else if (self._helpParked) self._resumeAfterHelp();
        });
        this._helpObserver.observe(panel, { attributes: true, attributeFilter: ['class'] });
        setTimeout(function () {
            if (self._helpParked || !self._topicGate) return;
            self._clearHelpPark();
        }, 4000);
    },

    _resumeAfterHelp: function () {
        if (this._helpObserver) {
            this._helpObserver.disconnect();
            this._helpObserver = null;
        }
        this._helpParked = false;
        if (typeof this._resolve !== 'function') return;
        const modal = document.getElementById('reset-canvas-wizard-modal');
        if (modal) {
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
        }
    },

    _clearHelpPark: function () {
        if (this._helpObserver) {
            this._helpObserver.disconnect();
            this._helpObserver = null;
        }
        this._helpParked = false;
    },

    _bindUi: function () {
        if (this._uiBound) return;
        this._uiBound = true;

        const modal = document.getElementById('reset-canvas-wizard-modal');
        const closeBtn = document.getElementById('rcw-btn-close');
        const cancelBtn = document.getElementById('rcw-btn-cancel');
        const skipBtn = document.getElementById('rcw-btn-skip');
        const backBtn = document.getElementById('rcw-btn-back');
        const primaryBtn = document.getElementById('rcw-btn-primary');
        const gateOk = document.getElementById('rcw-btn-gate-ok');
        const gateIgnore = document.getElementById('rcw-btn-gate-ignore');
        const widthInput = document.getElementById('rcw-size-width');
        const heightInput = document.getElementById('rcw-size-height');

        if (closeBtn) closeBtn.addEventListener('click', () => this._close('cancel'));
        if (cancelBtn) cancelBtn.addEventListener('click', () => this._close('cancel'));
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                this.editorMode = 'advanced';
                this.layoutMode = 'fixed';
                this.themeKey = 'default_dark';
                this._close('skip');
            });
        }
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.stepIndex > 0) {
                    this.stepIndex -= 1;
                    this._syncUi();
                }
            });
        }
        if (gateOk) gateOk.addEventListener('click', () => this._close('cancel'));
        if (gateIgnore) gateIgnore.addEventListener('click', () => this._beginWizard());
        if (widthInput) {
            widthInput.addEventListener('input', () => this._writeCustomSize('width', widthInput.value));
            widthInput.addEventListener('blur', () => this._commitCustomSize('width', widthInput));
        }
        if (heightInput) {
            heightInput.addEventListener('input', () => this._writeCustomSize('height', heightInput.value));
            heightInput.addEventListener('blur', () => this._commitCustomSize('height', heightInput));
        }
        document.addEventListener('click', (e) => {
            const link = e.target && e.target.closest ? e.target.closest('#rcw-topic-gate-link') : null;
            if (!link || !this._topicGate) return;
            e.preventDefault();
            const href = link.getAttribute('href');
            const opened = (typeof HelpSystem !== 'undefined' && typeof HelpSystem.openHelpUrl === 'function')
                ? HelpSystem.openHelpUrl(href)
                : false;
            if (opened) this._parkForHelp();
        }, true);

        if (primaryBtn) {
            primaryBtn.addEventListener('click', () => {
                if (this._isLastStep()) {
                    var specs = [];
                    if (this._currentStepId() === 'populate'
                        && typeof AutoWidgetGallery !== 'undefined'
                        && typeof AutoWidgetGallery.collectSpecs === 'function') {
                        specs = AutoWidgetGallery.collectSpecs() || [];
                    }
                    this._close('apply', specs);
                    return;
                }
                this.stepIndex += 1;
                this._syncUi();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this._close('cancel');
            });
        }

        document.querySelectorAll('[data-rcw-editor]').forEach((card) => {
            card.addEventListener('click', () => {
                const mode = card.getAttribute('data-rcw-editor');
                if (mode === 'basic' || mode === 'advanced') {
                    this.editorMode = mode;
                    this._syncCards();
                }
            });
        });

        document.querySelectorAll('[data-rcw-layout]').forEach((card) => {
            card.addEventListener('click', () => {
                const mode = card.getAttribute('data-rcw-layout');
                if (mode === 'fixed' || mode === 'scale' || mode === 'responsive') {
                    this.layoutMode = mode;
                    this._coerceScaleSize();
                    this._syncCards();
                }
            });
        });
    },

    _mountThemeStep: function () {
        const host = document.getElementById('rcw-theme-explorer');
        if (!host || typeof ThemeExplorer === 'undefined' || typeof ThemeExplorer.mountGrid !== 'function') {
            return;
        }
        if (this._themeGrid) return;
        const self = this;
        this._themeGrid = ThemeExplorer.mountGrid(host, {
            selectedKey: this.themeKey || 'default_dark',
            livePreview: false,
            onSelect: function (entry) {
                if (entry && entry.key) self.themeKey = entry.key;
            }
        });
    },

    _stepCount: function () {
        return Array.isArray(this.STEPS) ? this.STEPS.length : 0;
    },

    _isLastStep: function () {
        const total = this._stepCount();
        return total > 0 && this.stepIndex >= total - 1;
    },

    _currentStepId: function () {
        const step = this.STEPS[this.stepIndex];
        return step && step.id ? step.id : null;
    },

    _syncUi: function () {
        const total = this._stepCount();
        if (total < 1) return;
        if (this.stepIndex < 0) this.stepIndex = 0;
        if (this.stepIndex > total - 1) this.stepIndex = total - 1;

        const currentId = this._currentStepId();
        document.querySelectorAll('[data-rcw-step]').forEach((section) => {
            const isActive = section.getAttribute('data-rcw-step') === currentId;
            section.hidden = !isActive;
            section.classList.toggle('is-active', isActive);
            if (isActive) {
                section.removeAttribute('hidden');
            } else {
                section.setAttribute('hidden', '');
            }
        });

        const content = document.querySelector('#reset-canvas-wizard-modal .rcw-modal-content');
        if (content) {
            content.classList.toggle('is-theme-step', currentId === 'theme');
            content.classList.toggle('is-gallery-step', currentId === 'populate');
        }

        const counter = document.getElementById('rcw-step-counter');
        if (counter) {
            counter.textContent = 'Step ' + (this.stepIndex + 1) + ' of ' + total;
        }

        const dotsHost = document.getElementById('rcw-step-dots');
        if (dotsHost) {
            dotsHost.innerHTML = '';
            for (let i = 0; i < total; i++) {
                const dot = document.createElement('span');
                dot.className = 'rcw-step-dot' + (i <= this.stepIndex ? ' is-active' : '');
                dotsHost.appendChild(dot);
            }
        }

        const backBtn = document.getElementById('rcw-btn-back');
        if (backBtn) {
            const showBack = this.stepIndex > 0;
            backBtn.hidden = !showBack;
            if (showBack) backBtn.removeAttribute('hidden');
            else backBtn.setAttribute('hidden', '');
        }

        const primaryIcon = document.getElementById('rcw-btn-primary-icon');
        const isLast = this._isLastStep();
        if (primaryIcon) {
            primaryIcon.hidden = isLast;
            if (isLast) primaryIcon.setAttribute('hidden', '');
            else primaryIcon.removeAttribute('hidden');
        }
        this._syncPrimaryLabel();

        this._syncCards();
        if (currentId === 'theme') this._mountThemeStep();
        if (currentId === 'populate') this._mountGalleryStep();
        else {
            this._pauseGalleryStep();
            this._restoreGalleryThemePreview();
        }
    },

    _syncCards: function () {
        document.querySelectorAll('[data-rcw-editor]').forEach((card) => {
            const selected = card.getAttribute('data-rcw-editor') === this.editorMode;
            card.classList.toggle('is-selected', selected);
            card.setAttribute('aria-checked', selected ? 'true' : 'false');
        });
        document.querySelectorAll('[data-rcw-layout]').forEach((card) => {
            const selected = card.getAttribute('data-rcw-layout') === this.layoutMode;
            card.classList.toggle('is-selected', selected);
            card.setAttribute('aria-checked', selected ? 'true' : 'false');
        });
        this._syncSizePanel();
        if (this._themeGrid && typeof ThemeExplorer !== 'undefined' && typeof ThemeExplorer.setSelectedKey === 'function') {
            ThemeExplorer.setSelectedKey(this._themeGrid, this.themeKey);
        }
    },

    _syncPrimaryLabel: function () {
        const label = document.getElementById('rcw-btn-primary-label');
        const skip = document.getElementById('rcw-btn-skip');
        const isPopulate = this._currentStepId() === 'populate';
        if (skip) {
            skip.hidden = isPopulate;
            if (isPopulate) skip.setAttribute('hidden', '');
            else skip.removeAttribute('hidden');
        }
        if (!label) return;
        if (!this._isLastStep()) {
            label.textContent = 'Next';
            return;
        }
        if (!isPopulate) {
            label.textContent = 'Create Dashboard';
            return;
        }
        var count = 0;
        if (typeof AutoWidgetGallery !== 'undefined' && typeof AutoWidgetGallery.selectedCount === 'function') {
            count = AutoWidgetGallery.selectedCount() || 0;
        }
        label.textContent = count > 0 ? ('Create Dashboard (+' + count + ' Widgets)') : 'Create Dashboard';
    },

    _cloneMasterSettings: function () {
        if (typeof MASTER_SETTINGS === 'undefined' || !MASTER_SETTINGS) return null;
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._cloneJson === 'function') {
            const cloned = Dashboard._cloneJson(MASTER_SETTINGS);
            if (cloned) return cloned;
        }
        try {
            return JSON.parse(JSON.stringify(MASTER_SETTINGS));
        } catch (e) {
            return null;
        }
    },

    _writeGalleryThemeSnapshot: function (snapshot) {
        if (!snapshot || typeof MASTER_SETTINGS === 'undefined' || !MASTER_SETTINGS) return;
        if (MASTER_SETTINGS.editorZoom !== undefined) snapshot.editorZoom = MASTER_SETTINGS.editorZoom;
        Object.keys(MASTER_SETTINGS).forEach(function (key) {
            if (!Object.prototype.hasOwnProperty.call(snapshot, key)) delete MASTER_SETTINGS[key];
        });
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.updateGlobal === 'function') {
            Dashboard.updateGlobal(snapshot, true, true);
        }
        if (typeof ThemeManager !== 'undefined' && typeof ThemeManager.syncFromDashboard === 'function') {
            ThemeManager.syncFromDashboard();
        }
    },

    _applyGalleryThemePreview: async function () {
        if (this._galleryThemeSnapshot) return true;
        const snapshot = this._cloneMasterSettings();
        if (!snapshot) return false;
        this._galleryThemeSnapshot = snapshot;
        const seq = (this._galleryThemeSeq = (this._galleryThemeSeq || 0) + 1);
        if (typeof ThemeExplorer !== 'undefined' && typeof ThemeExplorer.applyKey === 'function') {
            await ThemeExplorer.applyKey(this.themeKey || 'default_dark', {
                isSystem: true,
                skipEditorReload: true
            });
        }
        if (seq !== this._galleryThemeSeq || this._currentStepId() !== 'populate') {
            if (this._galleryThemeSnapshot === snapshot) this._galleryThemeSnapshot = null;
            this._writeGalleryThemeSnapshot(snapshot);
            return false;
        }
        if (typeof ThemeManager !== 'undefined' && typeof ThemeManager.syncFromDashboard === 'function') {
            ThemeManager.syncFromDashboard();
        }
        return true;
    },

    _restoreGalleryThemePreview: function (keepChosenPlatform) {
        this._galleryThemeSeq = (this._galleryThemeSeq || 0) + 1;
        const snapshot = this._galleryThemeSnapshot;
        this._galleryThemeSnapshot = null;
        if (!snapshot) return;
        if (keepChosenPlatform && this._platformTouched && this.platform) {
            snapshot.dataDriver = this.platform;
        }
        this._writeGalleryThemeSnapshot(snapshot);
        const wanted = snapshot.dataDriver;
        const live = this._driverType();
        if (wanted && String(live).toLowerCase() !== String(wanted).toLowerCase()
            && typeof Dashboard !== 'undefined' && typeof Dashboard.updateGlobal === 'function') {
            Dashboard.updateGlobal({ dataDriver: wanted }, true, false);
        }
    },

    _lockedPlatform: function () {
        if (window.APP_CONFIG && window.APP_CONFIG.defaults && window.APP_CONFIG.defaults.lockedPlatform) {
            return String(window.APP_CONFIG.defaults.lockedPlatform).toLowerCase();
        }
        return '';
    },

    _platformChoices: function () {
        const locked = this._lockedPlatform();
        if (locked) return [{ value: locked, text: this._platformLabel(locked) }];
        if (window.APP_CONFIG && window.APP_CONFIG.ui && window.APP_CONFIG.ui.showDataConnection === false) {
            return [];
        }
        let hidden = [];
        if (window.APP_CONFIG && window.APP_CONFIG.ui && window.APP_CONFIG.ui.hiddenDrivers) {
            hidden = window.APP_CONFIG.ui.hiddenDrivers;
            if (!Array.isArray(hidden)) hidden = [hidden];
        }
        const all = [
            { value: 'homey', text: 'Homey' },
            { value: 'homeassistant', text: 'Home Assistant' },
            { value: 'nodered', text: 'Node-RED' },
            { value: 'simulation', text: 'Simulation' },
            { value: 'mqtt', text: 'MQTT' }
        ];
        return all.filter(function (opt) { return hidden.indexOf(opt.value) === -1; });
    },

    _platformLabel: function (value) {
        const key = String(value || '').toLowerCase();
        if (key === 'homey') return 'Homey';
        if (key === 'homeassistant') return 'Home Assistant';
        if (key === 'nodered') return 'Node-RED';
        if (key === 'simulation') return 'Simulation';
        if (key === 'mqtt') return 'MQTT';
        return key || 'Homey';
    },

    _defaultPlatform: function () {
        const locked = this._lockedPlatform();
        if (locked) return locked;
        const choices = this._platformChoices();
        for (let i = 0; i < choices.length; i++) {
            if (choices[i].value === 'homey') return 'homey';
        }
        return choices.length ? choices[0].value : 'homey';
    },

    _mountPlatformSelect: function () {
        const host = document.getElementById('rcw-platform-select');
        const row = document.getElementById('rcw-platform-row');
        if (!host) return;
        const choices = this._platformChoices();
        const show = choices.length > 0 && !this._lockedPlatform()
            && !(window.APP_CONFIG && window.APP_CONFIG.ui && window.APP_CONFIG.ui.showDataConnection === false);
        if (row) row.hidden = !show;
        if (!show) return;
        if (!this.platform) this.platform = this._defaultPlatform();
        if (this._platformSelect) {
            this._platformSelect.value = this.platform;
            return;
        }
        if (typeof Editor === 'undefined' || typeof Editor.createCustomSelect !== 'function') return;
        const select = Editor.createCustomSelect(choices, this.platform);
        const self = this;
        select.onchange = function () {
            const next = String(select.value || 'homey');
            if (next === self.platform) return;
            self.platform = next;
            self._platformTouched = true;
            self._applyPopulatePlatform(next);
        };
        host.appendChild(select);
        this._platformSelect = select;
    },

    _applyPopulatePlatform: function (type) {
        const next = String(type || 'homey');
        if (typeof Dashboard === 'undefined' || typeof Dashboard.updateGlobal !== 'function') return;
        if (String(this._driverType()).toLowerCase() === next.toLowerCase()) return;
        Dashboard.updateGlobal({ dataDriver: next }, true, false);
    },

    _mountGalleryStep: function () {
        const host = document.getElementById('rcw-auto-gallery');
        if (!host) return;
        const self = this;
        const start = async function () {
            if (self._currentStepId() !== 'populate') return;
            const themed = await self._applyGalleryThemePreview();
            if (!themed || self._currentStepId() !== 'populate') return;
            if (typeof AutoWidgetGallery === 'undefined' || typeof AutoWidgetGallery.resume !== 'function') return;
            self._mountPlatformSelect();
            if (self._platformChoices().length) {
                self._platformTouched = true;
                self._applyPopulatePlatform(self.platform || 'homey');
            }
            AutoWidgetGallery.resume(host, {
                mode: 'wizard',
                hideUsed: false,
                onCount: function () { self._syncPrimaryLabel(); }
            });
            self._syncPrimaryLabel();
        };
        if (typeof AutoWidgetGallery !== 'undefined' && typeof AutoWidgetGallery.resume === 'function') {
            void start();
            return;
        }
        const spec = (typeof ToolsRegistry !== 'undefined') ? ToolsRegistry.get('auto-widget-gallery') : null;
        if (!spec || typeof ToolsMenu === 'undefined' || typeof ToolsMenu._ensureScript !== 'function') return;
        ToolsMenu._ensureScript(spec).then(function () { void start(); }).catch(function () { /* gallery stays empty */ });
    },

    _pauseGalleryStep: function () {
        if (typeof AutoWidgetGallery !== 'undefined' && typeof AutoWidgetGallery.pause === 'function') {
            AutoWidgetGallery.pause();
        }
    },

    _resolutionSourceOptions: function () {
        if (this._resolutionSourceCache) return this._resolutionSourceCache;
        let options = [];
        if (typeof MASTER_SCHEMA !== 'undefined' && Array.isArray(MASTER_SCHEMA)) {
            for (let i = 0; i < MASTER_SCHEMA.length; i++) {
                const fields = MASTER_SCHEMA[i] && MASTER_SCHEMA[i].fields;
                if (!fields) continue;
                for (let j = 0; j < fields.length; j++) {
                    if (fields[j] && fields[j].key === 'canvasPreset' && Array.isArray(fields[j].options)) {
                        options = fields[j].options;
                    }
                }
            }
        }
        this._resolutionSourceCache = options;
        return options;
    },

    _resolutionSizeOptions: function (includeUnlimited) {
        const specials = [];
        if (includeUnlimited) specials.push({ value: '0,0', text: 'Unlimited' });
        specials.push({ value: 'custom', text: 'Custom' });
        const groups = [
            { title: 'Monitors', items: [] },
            { title: 'iPhone', items: [] },
            { title: 'iPad', items: [] },
            { title: 'Android', items: [] }
        ];
        const source = this._resolutionSourceOptions();
        for (let i = 0; i < source.length; i++) {
            const option = source[i];
            if (!option || option.value === '0,0') continue;
            const text = String(option.text || option.value || '');
            let bucket = groups[3];
            if (text.indexOf('Monitor') === 0) bucket = groups[0];
            else if (text.indexOf('iPhone') === 0) bucket = groups[1];
            else if (text.indexOf('iPad') === 0) bucket = groups[2];
            bucket.items.push({ value: String(option.value), text: text });
        }
        let out = specials.slice();
        for (let g = 0; g < groups.length; g++) {
            if (!groups[g].items.length) continue;
            out.push({ isHeader: true, text: groups[g].title });
            out = out.concat(groups[g].items);
        }
        return out;
    },

    _responsiveSizeOptions: function () {
        return [
            { value: '0', text: 'Unlimited' },
            { value: 'custom', text: 'Custom' },
            { isHeader: true, text: 'Presets' },
            { value: '390', text: 'Phone (390)' },
            { value: '430', text: 'Large Phone (430)' },
            { value: '820', text: 'Tablet Portrait (820)' },
            { value: '1180', text: 'iPad Air 10.9" Landscape (1180)' },
            { value: '1280', text: 'Laptop (1280)' },
            { value: '1920', text: 'Full HD (1920)' },
            { value: '2560', text: 'QHD (2560)' },
            { value: '3840', text: '4K (3840)' }
        ];
    },

    _responsivePair: function (widthValue) {
        const pairs = {
            '390': [390, 844],
            '430': [430, 932],
            '820': [820, 1180],
            '1180': [1180, 820],
            '1280': [1280, 800],
            '1920': [1920, 1080],
            '2560': [2560, 1440],
            '3840': [3840, 2160]
        };
        const pair = pairs[String(widthValue)];
        if (pair) return pair;
        const width = parseInt(widthValue, 10);
        return [isFinite(width) && width > 0 ? width : 1180, 820];
    },

    _activeSizeState: function () {
        const mode = (this.layoutMode === 'scale' || this.layoutMode === 'responsive') ? this.layoutMode : 'fixed';
        if (!this._sizeState) this._resetChoices();
        return { mode: mode, state: this._sizeState[mode] };
    },

    _coerceScaleSize: function () {
        if (this.layoutMode !== 'scale' || !this._sizeState) return;
        const state = this._sizeState.scale;
        if (state.preset === '0,0' || (!(state.width > 0) && state.preset !== 'custom')) {
            const canvas = this.DEFAULT_CANVAS;
            state.preset = canvas.preset;
            state.width = canvas.width;
            state.height = canvas.height;
        }
    },

    _applySizePreset: function (value) {
        const active = this._activeSizeState();
        const mode = active.mode;
        const state = active.state;
        if (!state) return;
        if (value === 'custom') {
            if (!(state.width > 0)) state.width = this.DEFAULT_CANVAS.width;
            if (mode !== 'responsive' && !(state.height > 0)) state.height = this.DEFAULT_CANVAS.height;
            state.preset = 'custom';
        } else if (mode === 'responsive') {
            if (value === '0') {
                state.preset = '0';
                state.width = 0;
                state.height = 0;
            } else {
                const pair = this._responsivePair(value);
                state.preset = String(value);
                state.width = pair[0];
                state.height = pair[1];
            }
        } else if (value === '0,0') {
            state.preset = '0,0';
            state.width = 0;
            state.height = 0;
        } else {
            const parts = String(value).split(',');
            const w = parseInt(parts[0], 10);
            const h = parseInt(parts[1], 10);
            if (isFinite(w) && isFinite(h)) {
                state.preset = String(value);
                state.width = w;
                state.height = h;
            }
        }
        this._syncSizePanel();
    },

    _writeCustomSize: function (axis, raw) {
        const active = this._activeSizeState();
        const state = active.state;
        if (!state) return;
        const n = parseInt(raw, 10);
        if (!isFinite(n) || n < 1) return;
        state.preset = 'custom';
        if (axis === 'height' && active.mode !== 'responsive') state.height = n;
        else state.width = n;
        if (this._sizeSelect && this._sizeSelect.value !== 'custom') this._sizeSelect.value = 'custom';
        const readout = document.getElementById('rcw-size-readout');
        if (readout) readout.textContent = this._sizeReadout(active.mode, state);
    },

    _commitCustomSize: function (axis, input) {
        const active = this._activeSizeState();
        const state = active.state;
        if (!state || !input || state.preset !== 'custom') return;
        const n = parseInt(input.value, 10);
        if (isFinite(n) && n > 0) return;
        const fallback = axis === 'height' ? (state.height > 0 ? state.height : this.DEFAULT_CANVAS.height) : (state.width > 0 ? state.width : this.DEFAULT_CANVAS.width);
        if (axis === 'height') state.height = fallback;
        else state.width = fallback;
        input.value = String(fallback);
        const readout = document.getElementById('rcw-size-readout');
        if (readout) readout.textContent = this._sizeReadout(active.mode, state);
    },

    _sizeReadout: function (mode, state) {
        if (!state) return '';
        if (mode === 'responsive') {
            if (state.preset === '0' || !(state.width > 0)) return 'Fills the screen';
            return state.width + ' px';
        }
        if (state.preset === '0,0' || (!(state.width > 0) && !(state.height > 0))) return 'Fills the window';
        return state.width + ' × ' + state.height;
    },

    _ensureSizeSelect: function (options, value) {
        if (this._sizeSelect) return;
        const host = document.getElementById('rcw-size-select');
        if (!host || typeof Editor === 'undefined' || typeof Editor.createCustomSelect !== 'function') return;
        const self = this;
        const select = Editor.createCustomSelect(options, value);
        select.onchange = function () {
            self._applySizePreset(select.value);
        };
        host.appendChild(select);
        this._sizeSelect = select;
        this._sizeSelectMode = null;
    },

    _syncSizePanel: function () {
        if (!this._sizeState) this._resetChoices();
        this._coerceScaleSize();
        const active = this._activeSizeState();
        const mode = active.mode;
        const state = active.state;
        const label = document.getElementById('rcw-size-label');
        const hint = document.getElementById('rcw-size-hint');
        const readout = document.getElementById('rcw-size-readout');
        const custom = document.getElementById('rcw-size-custom');
        const heightField = document.getElementById('rcw-size-height-field');
        const widthInput = document.getElementById('rcw-size-width');
        const heightInput = document.getElementById('rcw-size-height');
        if (label) {
            label.textContent = mode === 'responsive' ? 'Max Width' : (mode === 'scale' ? 'Design Resolution' : 'Resolution');
        }
        if (hint) {
            if (mode === 'responsive') {
                hint.textContent = 'The page stays at most this wide and shrinks on smaller windows. Unlimited fills the screen.';
            } else if (mode === 'scale') {
                hint.textContent = 'Design at this size. The layout scales to fill the screen and keeps its shape.';
            } else {
                hint.textContent = 'Pick a screen size for the canvas. Unlimited lets the canvas fill the window.';
            }
        }
        const options = mode === 'responsive' ? this._responsiveSizeOptions() : this._resolutionSizeOptions(mode !== 'scale');
        this._ensureSizeSelect(options, state.preset);
        if (this._sizeSelect) {
            if (this._sizeSelectMode !== mode && typeof this._sizeSelect.setOptions === 'function') {
                this._sizeSelect.setOptions(options);
                this._sizeSelectMode = mode;
            }
            this._sizeSelect.value = state.preset;
        }
        const showCustom = state.preset === 'custom';
        if (custom) {
            custom.classList.toggle('is-width-only', mode === 'responsive');
            custom.hidden = !showCustom;
            if (showCustom) custom.removeAttribute('hidden');
            else custom.setAttribute('hidden', '');
        }
        if (heightField) {
            const showHeight = mode !== 'responsive';
            heightField.hidden = !showHeight;
            if (showHeight) heightField.removeAttribute('hidden');
            else heightField.setAttribute('hidden', '');
        }
        if (widthInput && document.activeElement !== widthInput) {
            widthInput.value = state.width > 0 ? String(state.width) : '';
        }
        if (heightInput && document.activeElement !== heightInput) {
            heightInput.value = state.height > 0 ? String(state.height) : '';
        }
        if (readout) readout.textContent = this._sizeReadout(mode, state);
    },

    _canvasResult: function () {
        if (!this._sizeState) this._resetChoices();
        this._coerceScaleSize();
        const active = this._activeSizeState();
        const mode = active.mode;
        const state = active.state;
        let w = Math.max(0, parseInt(state.width, 10) || 0);
        let h = Math.max(0, parseInt(state.height, 10) || 0);
        if (mode === 'responsive' && (state.preset === '0' || w < 1)) {
            return { canvasPreset: '0,0', canvasWidth: 0, canvasHeight: 0 };
        }
        if (mode !== 'responsive' && (state.preset === '0,0' || (w < 1 && h < 1))) {
            return { canvasPreset: '0,0', canvasWidth: 0, canvasHeight: 0 };
        }
        if (mode === 'responsive' && state.preset !== 'custom') {
            const pair = this._responsivePair(state.preset);
            return { canvasPreset: pair[0] + ',' + pair[1], canvasWidth: pair[0], canvasHeight: pair[1] };
        }
        if (mode === 'responsive') {
            if (w < 1) w = this.DEFAULT_CANVAS.width;
            return { canvasPreset: w + ',0', canvasWidth: w, canvasHeight: 0 };
        }
        if (mode === 'scale' && (w < 1 || h < 1)) {
            w = this.DEFAULT_CANVAS.width;
            h = this.DEFAULT_CANVAS.height;
        }
        return { canvasPreset: w + ',' + h, canvasWidth: w, canvasHeight: h };
    },

    _close: function (action, widgets) {
        const modal = document.getElementById('reset-canvas-wizard-modal');
        if (modal) {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
        }
        if (this._boundKeydown) {
            document.removeEventListener('keydown', this._boundKeydown);
            this._boundKeydown = null;
        }
        this._clearHelpPark();
        this._hideTopicGate();
        if (typeof Editor !== 'undefined' && typeof Editor._closeAllDsFixedDropdowns === 'function') {
            Editor._closeAllDsFixedDropdowns();
        }
        if (this._themeGrid && typeof ThemeExplorer !== 'undefined' && typeof ThemeExplorer.unmountGrid === 'function') {
            ThemeExplorer.unmountGrid(this._themeGrid);
            this._themeGrid = null;
        }
        const content = document.querySelector('#reset-canvas-wizard-modal .rcw-modal-content');
        if (content) {
            content.classList.remove('is-theme-step');
            content.classList.remove('is-gallery-step');
        }
        if (typeof AutoWidgetGallery !== 'undefined' && typeof AutoWidgetGallery.destroy === 'function') {
            AutoWidgetGallery.destroy();
        }
        this._restoreGalleryThemePreview(action === 'apply');
        const resolve = this._resolve;
        this._resolve = null;
        const specs = (action === 'apply' && widgets && widgets.length) ? widgets : [];
        if (typeof resolve === 'function') resolve(this._result(action, specs));
    },

    _result: function (action, widgets) {
        const canvas = this._canvasResult();
        return {
            action: action || 'cancel',
            editorMode: this.editorMode === 'advanced' ? 'advanced' : 'basic',
            layoutMode: (this.layoutMode === 'scale' || this.layoutMode === 'responsive')
                ? this.layoutMode
                : 'fixed',
            themeKey: this.themeKey || 'default_dark',
            dataDriver: this._platformTouched ? (this.platform || 'homey') : undefined,
            canvasPreset: canvas.canvasPreset,
            canvasWidth: canvas.canvasWidth,
            canvasHeight: canvas.canvasHeight,
            widgets: widgets || []
        };
    }
};

window.ResetCanvasWizard = ResetCanvasWizard;
