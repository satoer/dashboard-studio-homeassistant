/**
 * Theme Explorer - reusable preview grid for built-in and user themes.
 * DialogHost live preview (Apply / Cancel) and Reset Canvas Wizard selection (no live apply).
 */
(function () {
    const HOST_ID = 'theme-explorer';
    const PLACEHOLDER = 'images/theme-preview/placeholder.jpg';

    function cloneJson(value) {
        if (value === undefined) return undefined;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            return value;
        }
    }

    function hasPreviewPath(value) {
        return typeof value === 'string' && value.trim() !== '';
    }

    function trimPath(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function themeRecordSettings(record) {
        if (!record || typeof record !== 'object') return null;
        const migrated = (typeof DashboardMigrator !== 'undefined' && typeof DashboardMigrator.migrateTheme === 'function')
            ? DashboardMigrator.migrateTheme(record)
            : record;
        if (migrated && migrated.master) return migrated.master;
        if (migrated && migrated.settings) return migrated.settings;
        if (record.master) return record.master;
        if (record.settings) return record.settings;
        return null;
    }

    function themeKindOf(record) {
        if (record && (record.themeKind === 'full' || record.themeKind === 'adjustment')) {
            return record.themeKind;
        }
        return 'full';
    }

    function getPresetThemes() {
        if (typeof PRESET_THEMES !== 'undefined') return PRESET_THEMES;
        if (typeof PRESET_TEMPLATES !== 'undefined') return PRESET_TEMPLATES;
        return null;
    }

    function builtinEntry(key) {
        const catalog = getPresetThemes();
        if (!catalog || !catalog[key]) return null;
        const tpl = catalog[key];
        return {
            key: key,
            name: tpl.name || key,
            group: 'builtin',
            kind: themeKindOf(tpl),
            previewImage: tpl.previewImage || '',
            settings: themeRecordSettings(tpl)
        };
    }

    async function loadUserEntry(name) {
        const entry = {
            key: 'user:' + name,
            name: name,
            group: 'user',
            kind: 'full',
            previewImage: '',
            settings: null
        };
        const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        const provider = driver && typeof driver.getStorageProvider === 'function' ? driver.getStorageProvider() : null;
        if (!provider || typeof provider.load !== 'function') return entry;
        try {
            const data = await provider.load('templates', name);
            if (data) {
                entry.kind = themeKindOf(data);
                entry.previewImage = data.previewImage || '';
                entry.settings = themeRecordSettings(data);
                if (typeof Dashboard !== 'undefined' && typeof Dashboard._getUserThemeKindCache === 'function') {
                    Dashboard._getUserThemeKindCache()[name] = entry.kind;
                }
            }
        } catch (e) { /* placeholder card */ }
        return entry;
    }

    function readDropdownSelection() {
        const wrapper = document.getElementById('template-select-wrapper');
        const labelEl = document.getElementById('template-select-label');
        return {
            key: wrapper && wrapper.dataset ? (wrapper.dataset.value || '') : '',
            label: labelEl ? (labelEl.textContent || '') : ''
        };
    }

    function reloadOpenInspector() {
        if (typeof Editor === 'undefined' || !Editor.currentId) return;
        if (Editor.currentId === 'GLOBAL_SETTINGS' && typeof Editor.loadWidget === 'function') {
            Editor.loadWidget('GLOBAL_SETTINGS');
            return;
        }
        if (Editor.currentId !== 'MULTIPLE' && typeof Editor.notifyExternalWidgetChange === 'function'
            && typeof Dashboard !== 'undefined' && Dashboard.widgets && Dashboard.widgets[Editor.currentId]) {
            Editor.notifyExternalWidgetChange(Editor.currentId, true);
        }
    }

    const ThemeExplorer = {
        PLACEHOLDER: PLACEHOLDER,
        _grids: [],
        _dialog: null,

        resolvePreviewUrl: function (entry) {
            if (entry && hasPreviewPath(entry.previewImage)) return trimPath(entry.previewImage);
            return PLACEHOLDER;
        },

        collectCatalog: async function () {
            const builtin = [];
            const catalog = getPresetThemes();
            if (catalog) {
                Object.keys(catalog).forEach(function (key) {
                    const entry = builtinEntry(key);
                    if (entry) builtin.push(entry);
                });
            }
            let user = [];
            if (typeof Dashboard !== 'undefined' && typeof Dashboard._loadUserTemplates === 'function') {
                try {
                    const names = await Dashboard._loadUserTemplates();
                    const jobs = (names || []).map(function (t) {
                        return loadUserEntry(t && t.name ? t.name : String(t || ''));
                    });
                    user = await Promise.all(jobs);
                    user = user.filter(function (entry) { return entry && entry.name; });
                } catch (e) {
                    user = [];
                }
            }
            return { user: user, builtin: builtin };
        },

        applyEntry: async function (entry, opts) {
            opts = opts || {};
            if (!entry) return false;
            let settings = entry.settings;
            if (!settings && entry.key && entry.key.indexOf('user:') === 0) {
                const loaded = await loadUserEntry(entry.key.slice(5));
                settings = loaded.settings;
                entry.settings = settings;
                if (!entry.previewImage) entry.previewImage = loaded.previewImage;
            }
            if (!settings && entry.key) {
                const builtin = builtinEntry(entry.key);
                if (builtin) settings = builtin.settings;
            }
            if (!settings || typeof Dashboard === 'undefined' || typeof Dashboard.updateGlobal !== 'function') {
                return false;
            }
            const skipEditorReload = opts.skipEditorReload !== false;
            const isSystem = opts.isSystem !== false;
            const kind = entry.kind
                || ((typeof Dashboard !== 'undefined' && typeof Dashboard._themeKindOf === 'function')
                    ? Dashboard._themeKindOf(entry.record || null)
                    : 'full');
            entry.kind = kind;
            const payload = (typeof Dashboard._themeApplyPayload === 'function')
                ? Dashboard._themeApplyPayload(settings, { resetLook: kind === 'full' || opts.resetLook === true })
                : settings;
            if (typeof Dashboard.resetThemeHueShift === 'function') Dashboard.resetThemeHueShift();
            Dashboard.updateGlobal(payload, skipEditorReload, isSystem);
            if (typeof MASTER_SETTINGS !== 'undefined') {
                MASTER_SETTINGS.theme = entry.key;
            }
            if (typeof Dashboard !== 'undefined' && typeof Dashboard._syncThemeInspectorField === 'function') {
                Dashboard._syncThemeInspectorField(entry.key);
            }
            if (opts.updateDropdown && typeof Dashboard._setTemplateDropdownValue === 'function') {
                Dashboard._setTemplateDropdownValue(entry.key, entry.name);
            }
            return true;
        },

        applyKey: async function (key, opts) {
            opts = opts || {};
            if (!key) return false;
            let entry = null;
            if (key.indexOf('user:') === 0) {
                entry = await loadUserEntry(key.slice(5));
            } else {
                entry = builtinEntry(key);
            }
            if (!entry) return false;
            return this.applyEntry(entry, opts);
        },

        mountGrid: function (container, options) {
            options = options || {};
            if (!container) return null;
            this.unmountGrid(container);
            const state = {
                container: container,
                options: options,
                selectedKey: options.selectedKey || '',
                catalog: options.catalog || null,
                destroyed: false
            };
            container.classList.add('theme-explorer-root');
            container.innerHTML = '<div class="theme-explorer-status">Loading themes...</div>';
            this._grids.push(state);
            const render = function () {
                if (state.destroyed) return;
                ThemeExplorer._renderGrid(state);
            };
            if (state.catalog) {
                render();
            } else {
                void this.collectCatalog().then(function (catalog) {
                    state.catalog = catalog;
                    render();
                });
            }
            return state;
        },

        unmountGrid: function (stateOrContainer) {
            const container = stateOrContainer && stateOrContainer.container
                ? stateOrContainer.container
                : stateOrContainer;
            const next = [];
            for (let i = 0; i < this._grids.length; i++) {
                const state = this._grids[i];
                if (state.container === container || state === stateOrContainer) {
                    state.destroyed = true;
                    if (state.container) {
                        state.container.innerHTML = '';
                        state.container.classList.remove('theme-explorer-root');
                    }
                } else {
                    next.push(state);
                }
            }
            this._grids = next;
        },

        setSelectedKey: function (state, key) {
            if (!state) return;
            state.selectedKey = key || '';
            this._paintSelected(state);
        },

        _renderGrid: function (state) {
            const container = state.container;
            const catalog = state.catalog || { user: [], builtin: [] };
            container.innerHTML = '';

            const scroll = document.createElement('div');
            scroll.className = 'theme-explorer-scroll';

            const user = catalog.user || [];
            const builtin = catalog.builtin || [];
            const userFull = user.filter(function (e) { return (e.kind || 'full') === 'full'; });
            const userAdj = user.filter(function (e) { return (e.kind || 'full') !== 'full'; });
            const builtinFull = builtin.filter(function (e) { return (e.kind || 'full') === 'full'; });
            const builtinAdj = builtin.filter(function (e) { return (e.kind || 'full') !== 'full'; });
            if (userFull.length > 0) {
                scroll.appendChild(this._buildGroup('My Full Themes', userFull, state));
            }
            if (userAdj.length > 0) {
                scroll.appendChild(this._buildGroup('My Adjustment Themes', userAdj, state));
            }
            if (builtinFull.length > 0) {
                scroll.appendChild(this._buildGroup(
                    (user.length > 0 ? 'Built-in Full Themes' : 'Full Themes'), builtinFull, state));
            }
            if (builtinAdj.length > 0) {
                scroll.appendChild(this._buildGroup('Built-in Adjustment Themes', builtinAdj, state));
            }
            if (user.length === 0 && builtin.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'theme-explorer-status';
                empty.textContent = 'No themes available.';
                scroll.appendChild(empty);
            }
            container.appendChild(scroll);
            this._paintSelected(state);
        },

        _buildGroup: function (title, entries, state) {
            const group = document.createElement('section');
            group.className = 'theme-explorer-group';

            const heading = document.createElement('h3');
            heading.className = 'theme-explorer-group-title';
            heading.textContent = title;
            group.appendChild(heading);

            const grid = document.createElement('div');
            grid.className = 'theme-explorer-grid';
            for (let i = 0; i < entries.length; i++) {
                grid.appendChild(this._buildCard(entries[i], state));
            }
            group.appendChild(grid);
            return group;
        },

        _buildCard: function (entry, state) {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'theme-explorer-card';
            card.setAttribute('data-theme-key', entry.key);
            card.setAttribute('role', 'option');
            card.setAttribute('aria-selected', 'false');
            card.title = entry.name || entry.key;

            const thumb = document.createElement('span');
            thumb.className = 'theme-explorer-thumb';

            const img = document.createElement('img');
            img.className = 'theme-explorer-thumb-img';
            img.alt = '';
            const hasPreview = hasPreviewPath(entry.previewImage);
            img.src = hasPreview ? trimPath(entry.previewImage) : PLACEHOLDER;

            const overlay = document.createElement('span');
            overlay.className = 'theme-explorer-no-preview';
            overlay.textContent = 'No preview';
            if (hasPreview) overlay.hidden = true;

            img.onerror = function () {
                if (img.getAttribute('data-fallback') === '1') return;
                img.setAttribute('data-fallback', '1');
                img.src = PLACEHOLDER;
                overlay.hidden = false;
            };

            thumb.appendChild(img);
            thumb.appendChild(overlay);

            const name = document.createElement('span');
            name.className = 'theme-explorer-name';
            name.textContent = entry.name || entry.key;

            const kind = document.createElement('span');
            kind.className = 'theme-explorer-kind theme-explorer-kind--' + ((entry.kind || 'full') === 'full' ? 'full' : 'adjustment');
            kind.textContent = (entry.kind || 'full') === 'full' ? 'Full' : 'Adjustment';

            card.appendChild(thumb);
            card.appendChild(name);
            card.appendChild(kind);
            card.addEventListener('click', function () {
                ThemeExplorer._select(state, entry);
            });
            return card;
        },

        _paintSelected: function (state) {
            if (!state || !state.container) return;
            const cards = state.container.querySelectorAll('[data-theme-key]');
            for (let i = 0; i < cards.length; i++) {
                const selected = cards[i].getAttribute('data-theme-key') === state.selectedKey;
                cards[i].classList.toggle('is-selected', selected);
                cards[i].setAttribute('aria-selected', selected ? 'true' : 'false');
            }
        },

        _select: function (state, entry) {
            if (!state || !entry) return;
            state.selectedKey = entry.key;
            this._paintSelected(state);
            if (typeof state.options.onSelect === 'function') {
                state.options.onSelect(entry, state);
            }
            if (typeof state.options.livePreviewApply === 'function') {
                void state.options.livePreviewApply(entry, state);
            } else if (state.options.livePreview) {
                void this.applyEntry(entry, {
                    preview: true,
                    isSystem: true,
                    skipEditorReload: true,
                    resetLook: !!state.options.resetLook
                });
            }
        },

        openDialog: function () {
            if (typeof DialogHost === 'undefined' || typeof DialogHost.openFloating !== 'function') {
                if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                    void CustomDialog.alert('Theme Explorer is unavailable.', 'Theme Explorer');
                }
                return;
            }
            if (this._dialog && this._dialog.open) {
                return;
            }

            const dropdown = readDropdownSelection();
            const snapshotSettings = (typeof Dashboard !== 'undefined' && typeof Dashboard._cloneJson === 'function')
                ? Dashboard._cloneJson(typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {})
                : cloneJson(typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {});
            const session = {
                open: true,
                committed: false,
                snapshotSettings: snapshotSettings,
                snapshotKey: dropdown.key,
                snapshotLabel: dropdown.label,
                snapshotUnsaved: !!(typeof Dashboard !== 'undefined' && Dashboard.hasUnsavedChanges),
                selectedKey: dropdown.key || '',
                selectedEntry: null,
                resetLookFirst: false,
                didPreview: false,
                grid: null
            };
            this._dialog = session;

            const self = this;
            DialogHost.openFloating({
                id: HOST_ID,
                title: 'Theme Explorer',
                icon: 'ph-squares-four',
                className: 'theme-explorer-dialog',
                defaultSize: {
                    w: Math.min(1100, window.innerWidth * 0.92),
                    h: Math.min(720, window.innerHeight * 0.84)
                },
                minSize: { w: 560, h: 380 },
                buildBody: function (body) {
                    const host = document.createElement('div');
                    host.id = 'theme-explorer-dialog-grid';
                    host.className = 'theme-explorer-dialog-host';
                    body.appendChild(host);
                    session.grid = ThemeExplorer.mountGrid(host, {
                        selectedKey: session.selectedKey,
                        livePreview: true,
                        onSelect: function (entry) {
                            session.selectedKey = entry.key;
                            session.selectedEntry = entry;
                        },
                        livePreviewApply: function () {
                            void self._previewSession(session);
                        }
                    });
                },
                buildFooter: function (footer) {
                    footer.classList.add('theme-explorer-footer');

                    const start = document.createElement('div');
                    start.className = 'theme-explorer-footer-start';

                    const resetLabel = document.createElement('label');
                    resetLabel.className = 'theme-explorer-reset-look';
                    resetLabel.title = 'Restores this dashboard\'s original colors, fonts, and widget chrome, then applies this theme. Connection, layout, and widget configuration stay as they are. Full themes always replace the current look; Adjustment themes only overlay their stored values.';

                    const resetInput = document.createElement('input');
                    resetInput.type = 'checkbox';
                    resetInput.className = 'ds-checkbox';
                    resetInput.checked = false;
                    resetInput.setAttribute('aria-label', 'Reset current look first');

                    const resetText = document.createElement('span');
                    resetText.className = 'theme-explorer-reset-look-text';
                    resetText.textContent = 'Reset current look first';

                    resetLabel.appendChild(resetInput);
                    resetLabel.appendChild(resetText);
                    resetInput.addEventListener('change', function () {
                        session.resetLookFirst = resetInput.checked === true;
                        void self._previewSession(session);
                    });
                    start.appendChild(resetLabel);

                    const actions = document.createElement('div');
                    actions.className = 'theme-explorer-footer-actions';
                    const cancelBtn = document.createElement('button');
                    cancelBtn.type = 'button';
                    cancelBtn.className = 'btn-tool ds-dialog-button';
                    cancelBtn.textContent = 'Cancel';
                    cancelBtn.addEventListener('click', function () {
                        void DialogHost.requestClose(HOST_ID);
                    });
                    const applyBtn = document.createElement('button');
                    applyBtn.type = 'button';
                    applyBtn.className = 'btn-tool ds-dialog-button primary';
                    applyBtn.textContent = 'Apply Theme';
                    applyBtn.addEventListener('click', function () {
                        self._commitDialog();
                    });
                    actions.appendChild(cancelBtn);
                    actions.appendChild(applyBtn);
                    footer.appendChild(start);
                    footer.appendChild(actions);
                },
                onClose: function () {
                    if (session.committed) {
                        self._teardownDialog();
                        return true;
                    }
                    if (session.didPreview) self._restoreSnapshot(session);
                    self._teardownDialog();
                    return true;
                }
            });
        },

        _commitDialog: function () {
            const session = this._dialog;
            if (!session || session.committed) return;
            session.committed = true;
            let changed = session.selectedKey && session.selectedKey !== session.snapshotKey;
            if (!changed && typeof Dashboard !== 'undefined' && typeof Dashboard._isEqualJson === 'function'
                && session.snapshotSettings && typeof MASTER_SETTINGS !== 'undefined') {
                const live = Dashboard._cloneJson(MASTER_SETTINGS);
                const snap = Dashboard._cloneJson(session.snapshotSettings);
                if (live) delete live.editorZoom;
                if (snap) delete snap.editorZoom;
                changed = !Dashboard._isEqualJson(live, snap);
            }
            if (changed && typeof Dashboard !== 'undefined') {
                if (typeof Dashboard.markUnsaved === 'function') Dashboard.markUnsaved();
                if (session.selectedEntry && typeof Dashboard._setTemplateDropdownValue === 'function') {
                    Dashboard._setTemplateDropdownValue(session.selectedEntry.key, session.selectedEntry.name);
                }
            }
            reloadOpenInspector();
            if (typeof DialogHost !== 'undefined') DialogHost.close(HOST_ID);
            this._teardownDialog();
        },

        _writeSnapshotMaster: function (session) {
            if (!session || !session.snapshotSettings) return;
            if (typeof MASTER_SETTINGS !== 'undefined') {
                session.snapshotSettings.editorZoom = MASTER_SETTINGS.editorZoom;
            }
            if (typeof MASTER_SETTINGS !== 'undefined') {
                Object.keys(MASTER_SETTINGS).forEach(function (key) {
                    if (!Object.prototype.hasOwnProperty.call(session.snapshotSettings, key)) {
                        delete MASTER_SETTINGS[key];
                    }
                });
            }
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.updateGlobal === 'function') {
                Dashboard.updateGlobal(session.snapshotSettings, true, true);
            }
        },

        _previewSession: async function (session) {
            if (!session || session.committed) return;
            this._writeSnapshotMaster(session);
            const key = session.selectedKey;
            if (!key) return;
            let kindReset = false;
            if (session.selectedEntry && session.selectedEntry.kind) {
                kindReset = session.selectedEntry.kind === 'full';
            } else if (typeof Dashboard !== 'undefined' && typeof Dashboard.isFullThemeKey === 'function') {
                kindReset = await Dashboard.isFullThemeKey(key);
            }
            const applied = await this.applyKey(key, {
                preview: true,
                isSystem: true,
                skipEditorReload: true,
                resetLook: session.resetLookFirst === true || kindReset
            });
            if (applied) session.didPreview = true;
        },

        _restoreSnapshot: function (session) {
            if (!session || !session.snapshotSettings) return;
            this._writeSnapshotMaster(session);
            if (typeof Dashboard !== 'undefined' && typeof Dashboard._setTemplateDropdownValue === 'function') {
                Dashboard._setTemplateDropdownValue(session.snapshotKey, session.snapshotLabel || 'Select Theme...');
            }
            if (typeof Dashboard !== 'undefined') {
                Dashboard.hasUnsavedChanges = !!session.snapshotUnsaved;
                if (typeof Dashboard.updateFileIndicator === 'function') Dashboard.updateFileIndicator();
            }
            reloadOpenInspector();
        },

        _teardownDialog: function () {
            const session = this._dialog;
            if (session && session.grid) this.unmountGrid(session.grid);
            this._dialog = null;
        }
    };

    window.ThemeExplorer = ThemeExplorer;
})();
