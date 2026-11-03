/**
 * Widget Preset Editor (Tools): multi-column settings grid for factory + user presets.
 * Lazy-loaded via tools-catalog. Depends: DialogHost, WidgetPresetModel, Dashboard, Editor.
 */
(function () {
    const HOST_ID = 'widget-preset-editor';
    const PROBE_HOST_ID = 'wpe-schema-probe';

    function cloneJson(value) {
        if (value === undefined) return undefined;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            return value;
        }
    }

    function valuesEqual(a, b) {
        if (a === b) return true;
        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch (e) {
            return false;
        }
    }

    function fieldTypeKey(field) {
        if (!field) return 'unknown';
        const t = String(field.type || 'text');
        if (typeof WidgetPresetModel !== 'undefined' && WidgetPresetModel.BLOB_FIELD_TYPES[t]) {
            return 'blob:' + t;
        }
        return t;
    }

    function formatBlobSummary(value) {
        if (value == null) return '(empty)';
        if (Array.isArray(value)) return value.length + ' item' + (value.length === 1 ? '' : 's');
        if (typeof value === 'object') return Object.keys(value).length + ' keys';
        return String(value).slice(0, 40);
    }

    const WidgetPresetEditor = {
        _widgetType: null,
        _catalog: { builtin: [], user: [] },
        _checkedKeys: {},
        _expandedKeys: {},
        _working: {},
        _tree: [],
        _leaves: [],
        _filter: '',
        _rowMode: 'included',
        _selection: [],
        _anchorCell: null,
        _status: '',
        _statusWarn: false,
        _probeWidget: null,
        _root: null,
        _reorderControllers: [],

        open: async function () {
            if (typeof DialogHost === 'undefined') {
                throw new Error('DialogHost unavailable');
            }
            if (typeof WidgetPresetModel === 'undefined') {
                throw new Error('WidgetPresetModel unavailable');
            }

            this._widgetType = null;
            this._catalog = { builtin: [], user: [] };
            this._checkedKeys = {};
            this._expandedKeys = {};
            this._working = {};
            this._tree = [];
            this._leaves = [];
            this._filter = '';
            this._rowMode = 'included';
            this._selection = [];
            this._anchorCell = null;
            this._currentColumns = [];
            this._colorPickers = [];
            this._status = '';
            this._statusWarn = false;

            const self = this;
            DialogHost.openFloating({
                id: HOST_ID,
                title: 'Widget Preset Editor',
                icon: 'ph-table',
                className: 'wpe-dialog',
                defaultSize: { w: Math.min(1200, window.innerWidth * 0.94), h: Math.min(780, window.innerHeight * 0.88) },
                minSize: { w: 720, h: 480 },
                buildBody: function (body) {
                    self._buildShell(body);
                },
                onClose: function () {
                    return self._confirmClose();
                },
                onEscape: function () {
                    if (self._selection.length) {
                        self._selection = [];
                        self._anchorCell = null;
                        self._paintSelection();
                        self._setStatus('Selection cleared.');
                        return false;
                    }
                    return true;
                },
                onOpen: function () {
                    void self._bootstrap();
                }
            });
        },

        _confirmClose: async function () {
            if (this._anyDirty()) {
                const ok = typeof CustomDialog !== 'undefined'
                    ? await CustomDialog.confirm('Discard unsaved preset edits?', 'Widget Preset Editor')
                    : window.confirm('Discard unsaved preset edits?');
                if (!ok) return false;
            }
            this._teardown();
            return true;
        },

        _teardown: function () {
            this._destroyColorPickers();
            this._destroyReorders();
            this._destroyProbe();
            this._root = null;
            this._currentColumns = [];
            this._selection = [];
            this._anchorCell = null;
            this._status = '';
            this._statusWarn = false;
        },

        _anyDirty: function () {
            const keys = Object.keys(this._working);
            for (let i = 0; i < keys.length; i++) {
                if (this._working[keys[i]] && this._working[keys[i]].dirty) return true;
            }
            return false;
        },

        _buildShell: function (body) {
            body.innerHTML = '';
            const root = document.createElement('div');
            root.className = 'wpe-root';
            root.innerHTML = [
                '<div class="wpe-columns">',
                '  <div class="wpe-col-side">',
                '    <div class="wpe-toolbar-type">',
                '      <label class="wpe-label">Widget Type</label>',
                '      <div class="wpe-type-wrap" id="wpe-type-wrap"></div>',
                '    </div>',
                '    <aside class="wpe-sidebar" id="wpe-sidebar"></aside>',
                '  </div>',
                '  <div class="wpe-col-main">',
                '    <div class="wpe-toolbar-main">',
                '      <div class="wpe-toolbar-filter">',
                '        <label class="wpe-label">Filter Settings</label>',
                '        <input type="text" class="control-input wpe-filter" id="wpe-filter" placeholder="Search settings..." />',
                '      </div>',
                '      <div class="wpe-toolbar-modes" id="wpe-mode-group" role="group" aria-label="Row mode">',
                '        <button type="button" class="btn-tool wpe-mode-btn" data-wpe-mode="all">All</button>',
                '        <button type="button" class="btn-tool wpe-mode-btn is-active" data-wpe-mode="included">Included</button>',
                '        <button type="button" class="btn-tool wpe-mode-btn" data-wpe-mode="differing">Differing</button>',
                '      </div>',
                '    </div>',
                '    <section class="wpe-grid-wrap" id="wpe-grid-wrap">',
                '      <div class="wpe-empty" id="wpe-empty">Select a widget type, then check one or more presets.</div>',
                '      <div class="wpe-grid-scroll" id="wpe-grid-scroll" hidden></div>',
                '    </section>',
                '  </div>',
                '</div>',
                '<div class="wpe-statusbar">',
                '  <div class="wpe-status" id="wpe-status" role="status"></div>',
                '  <button type="button" class="btn-tool ds-dialog-button primary" id="wpe-btn-save-all" hidden disabled title="Save all modified My Presets">',
                '    <i class="ph-bold ph-floppy-disk"></i><span>Save All</span>',
                '  </button>',
                '</div>'
            ].join('');
            body.appendChild(root);
            this._root = root;

            const filter = root.querySelector('#wpe-filter');
            if (filter) {
                filter.addEventListener('input', () => {
                    this._filter = filter.value || '';
                    this._renderGrid();
                });
            }
            root.querySelectorAll('#wpe-mode-group .wpe-mode-btn').forEach((btn) => {
                btn.addEventListener('click', () => {
                    this._rowMode = btn.getAttribute('data-wpe-mode') || 'all';
                    root.querySelectorAll('#wpe-mode-group .wpe-mode-btn').forEach((b) => {
                        b.classList.toggle('is-active', b === btn);
                    });
                    this._renderGrid();
                });
            });
            const saveAllBtn = root.querySelector('#wpe-btn-save-all');
            if (saveAllBtn) {
                const canPersist = this._canPersistPresets();
                saveAllBtn.hidden = !canPersist;
                if (canPersist) {
                    saveAllBtn.addEventListener('click', () => { void this._saveAll(); });
                }
            }

            root.addEventListener('keydown', (e) => this._onKeyDown(e));
            root.tabIndex = -1;
            this._populateTypePicker();
        },

        /** Same gate as inspector preset Save: Homey file storage + showServerButtons. */
        _canPersistPresets: function () {
            const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
            return !!(driver && driver.supportsFileStorage
                && typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ui && APP_CONFIG.ui.showServerButtons);
        },

        _populateTypePicker: function () {
            const wrap = this._root && this._root.querySelector('#wpe-type-wrap');
            if (!wrap || typeof WidgetRegistry === 'undefined') return;
            wrap.innerHTML = '';

            const customSelect = document.createElement('div');
            customSelect.className = 'relative w-full z-50';

            const btn = document.createElement('div');
            btn.className = 'control-input w-full flex items-center justify-between cursor-pointer select-none';
            btn.innerHTML = '<div id="wpe-type-label" class="flex items-center min-w-0 flex-1 overflow-hidden whitespace-nowrap"></div><i class="ph-bold ph-caret-down editor-muted-text ml-2"></i>';

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

            const sortedTypes = Object.keys(WidgetRegistry.widgets || {}).sort((a, b) => {
                const wA = WidgetRegistry.widgets[a];
                const wB = WidgetRegistry.widgets[b];
                const labelA = (wA.metadata && wA.metadata.label ? wA.metadata.label : a).toLowerCase();
                const labelB = (wB.metadata && wB.metadata.label ? wB.metadata.label : b).toLowerCase();
                return labelA.localeCompare(labelB);
            });

            let firstType = null;
            sortedTypes.forEach((type) => {
                if (typeof Dashboard !== 'undefined' && Dashboard.isWidgetHidden && Dashboard.isWidgetHidden(type)) return;
                if (!firstType) firstType = type;
                const wClass = WidgetRegistry.widgets[type];
                const meta = wClass.metadata || { label: type };
                const item = document.createElement('div');
                item.className = 'ds-editor-menu-item truncate flex items-center';
                const tagHtml = WidgetRegistry.getWidgetTagHtml
                    ? WidgetRegistry.getWidgetTagHtml(type, true)
                    : ('<span>' + meta.label + '</span>');
                item.innerHTML = tagHtml;
                item.onmousedown = (e) => { e.preventDefault(); };
                item.onclick = (e) => {
                    e.stopPropagation();
                    if (typeof Editor !== 'undefined' && Editor._closeDsFixedDropdown) {
                        Editor._closeDsFixedDropdown(menu);
                    } else {
                        menu.classList.add('hidden');
                    }
                    wrap.dataset.value = type;
                    btn.querySelector('#wpe-type-label').innerHTML = tagHtml;
                    void this._setWidgetType(type);
                };
                menu.appendChild(item);
            });

            if (firstType) {
                wrap.dataset.value = firstType;
                const initialTag = WidgetRegistry.getWidgetTagHtml
                    ? WidgetRegistry.getWidgetTagHtml(firstType, true)
                    : ('<span>' + firstType + '</span>');
                btn.querySelector('#wpe-type-label').innerHTML = initialTag;
            }

            customSelect.appendChild(btn);
            customSelect.appendChild(menu);
            wrap.appendChild(customSelect);
        },

        _bootstrap: async function () {
            const wrap = this._root && this._root.querySelector('#wpe-type-wrap');
            const type = wrap && wrap.dataset.value;
            if (type) await this._setWidgetType(type);
            this._setStatus('Select presets on the left to edit columns.');
        },

        _setWidgetType: async function (type) {
            if (this._anyDirty()) {
                const ok = typeof CustomDialog !== 'undefined'
                    ? await CustomDialog.confirm('Switch widget type and discard unsaved edits?', 'Widget Preset Editor')
                    : window.confirm('Switch widget type and discard unsaved edits?');
                if (!ok) {
                    const wrap = this._root.querySelector('#wpe-type-wrap');
                    if (wrap) wrap.dataset.value = this._widgetType || '';
                    return;
                }
            }
            this._widgetType = type;
            this._checkedKeys = {};
            this._expandedKeys = {};
            this._working = {};
            this._selection = [];
            this._anchorCell = null;
            await this._rebuildSchema(type);
            await this._loadCatalog(type);
            this._renderSidebar();
            this._renderGrid();
            this._setStatus('Loaded presets for ' + type + '.');
        },

        _destroyProbe: function () {
            if (this._probeWidget && typeof this._probeWidget.destroy === 'function') {
                try { this._probeWidget.destroy(); } catch (e) { /* ignore */ }
            }
            this._probeWidget = null;
            const host = document.getElementById(PROBE_HOST_ID);
            if (host) host.innerHTML = '';
        },

        _ensureProbeHost: function () {
            let host = document.getElementById(PROBE_HOST_ID);
            if (!host) {
                host = document.createElement('div');
                host.id = PROBE_HOST_ID;
                host.setAttribute('aria-hidden', 'true');
                host.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none;';
                document.body.appendChild(host);
            }
            return host;
        },

        _rebuildSchema: async function (type) {
            this._destroyProbe();
            this._tree = [];
            this._leaves = [];
            if (!type || typeof WidgetRegistry === 'undefined') return;
            const WidgetClass = WidgetRegistry.get ? WidgetRegistry.get(type) : WidgetRegistry.widgets[type];
            if (!WidgetClass) return;
            this._ensureProbeHost();
            try {
                this._probeWidget = new WidgetClass(PROBE_HOST_ID, '__wpe_probe__', {}, {});
            } catch (err) {
                this._setStatus('Could not build settings schema: ' + (err && err.message ? err.message : String(err)), true);
                return;
            }
            this._tree = WidgetPresetModel.buildTree(this._probeWidget) || [];
            this._leaves = [];
            WidgetPresetModel.walkLeaves(this._tree, (leaf) => {
                this._leaves.push(leaf);
            });
            if (this._leaves.length > 80) {
                this._rowMode = 'included';
                if (this._root) {
                    this._root.querySelectorAll('#wpe-mode-group .wpe-mode-btn').forEach((b) => {
                        b.classList.toggle('is-active', b.getAttribute('data-wpe-mode') === 'included');
                    });
                }
            }
        },

        _loadCatalog: async function (widgetType) {
            this._catalog = { builtin: [], user: [] };
            if (!widgetType || typeof Dashboard === 'undefined') return;
            const manifest = await Dashboard._loadWidgetPresetsManifest();
            const builtIns = Array.isArray(manifest[widgetType]) ? manifest[widgetType].slice() : [];
            builtIns.sort((a, b) => String(a.name || a.id || '').localeCompare(String(b.name || b.id || ''), undefined, { sensitivity: 'base' }));
            this._catalog.builtin = builtIns.map((entry) => {
                const id = entry.id || String(entry.file || '').replace(/\.json$/i, '');
                return {
                    key: 'builtin:' + id,
                    kind: 'builtin',
                    name: entry.name || id,
                    file: entry.file || (id + '.json'),
                    fileId: id,
                    variantCount: typeof entry.variantCount === 'number' ? entry.variantCount : 1,
                    widgetType: widgetType
                };
            });
            const user = await Dashboard._loadUserWidgetPresets(widgetType);
            this._catalog.user = user.map((p) => ({
                key: 'user:' + p.fullName,
                kind: 'user',
                name: p.name,
                fullName: p.fullName,
                fileId: p.fileId,
                variantCount: p.variantCount,
                widgetType: widgetType
            }));
        },

        _renderSidebar: function () {
            const sidebar = this._root && this._root.querySelector('#wpe-sidebar');
            if (!sidebar) return;
            sidebar.innerHTML = '';

            const canPersist = this._canPersistPresets();
            const actions = document.createElement('div');
            actions.className = 'wpe-side-actions';

            const selectAllBtn = document.createElement('button');
            selectAllBtn.type = 'button';
            selectAllBtn.className = 'btn-tool btn-tool-icon-only wpe-side-action';
            selectAllBtn.title = 'Select all presets';
            selectAllBtn.setAttribute('aria-label', 'Select all presets');
            selectAllBtn.innerHTML = '<i class="ph-bold ph-checks"></i>';
            selectAllBtn.addEventListener('click', () => { void this._setAllPresetsChecked(true); });

            const selectNoneBtn = document.createElement('button');
            selectNoneBtn.type = 'button';
            selectNoneBtn.className = 'btn-tool btn-tool-icon-only wpe-side-action';
            selectNoneBtn.title = 'Select none';
            selectNoneBtn.setAttribute('aria-label', 'Select none');
            selectNoneBtn.innerHTML = '<i class="ph-bold ph-square"></i>';
            selectNoneBtn.addEventListener('click', () => { void this._setAllPresetsChecked(false); });

            actions.appendChild(selectAllBtn);
            actions.appendChild(selectNoneBtn);

            if (canPersist) {
                const duplicateBtn = document.createElement('button');
                duplicateBtn.type = 'button';
                duplicateBtn.id = 'wpe-btn-duplicate-selected';
                duplicateBtn.className = 'btn-tool btn-tool-icon-only wpe-side-action';
                duplicateBtn.innerHTML = '<i class="ph-bold ph-copy"></i>';
                duplicateBtn.addEventListener('click', () => { void this._duplicateSelectedPresets(); });
                actions.appendChild(duplicateBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.id = 'wpe-btn-delete-selected';
                deleteBtn.className = 'btn-tool btn-tool-icon-only wpe-side-action danger';
                deleteBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
                deleteBtn.addEventListener('click', () => { void this._deleteSelectedPresets(); });
                actions.appendChild(deleteBtn);
            }

            sidebar.appendChild(actions);
            this._syncSidebarActionButtons();

            const renderGroup = (title, items) => {
                const hdr = document.createElement('div');
                hdr.className = 'wpe-side-group-title';
                hdr.textContent = title;
                sidebar.appendChild(hdr);
                if (!items.length) {
                    const empty = document.createElement('div');
                    empty.className = 'wpe-side-empty';
                    empty.textContent = 'None';
                    sidebar.appendChild(empty);
                    return;
                }
                items.forEach((entry) => {
                    sidebar.appendChild(this._buildSidebarItem(entry));
                });
            };

            renderGroup('My Presets', this._catalog.user);
            renderGroup('Built-in Presets', this._catalog.builtin);
        },

        _checkedSidebarEntries: function () {
            const all = (this._catalog.user || []).concat(this._catalog.builtin || []);
            return all.filter((entry) => !!this._checkedKeys[entry.key]);
        },

        _syncSidebarActionButtons: function () {
            this._syncDeleteSelectedButton();
            this._syncDuplicateSelectedButton();
        },

        _syncDuplicateSelectedButton: function () {
            const btn = this._root && this._root.querySelector('#wpe-btn-duplicate-selected');
            if (!btn) return;
            const checked = this._checkedSidebarEntries();
            const disabled = checked.length === 0;
            btn.disabled = disabled;
            btn.classList.toggle('is-disabled', disabled);
            btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
            if (disabled) {
                btn.title = 'Duplicate selected presets to My Presets (none selected)';
                btn.setAttribute('aria-label', btn.title);
            } else {
                btn.title = 'Duplicate ' + checked.length + ' selected preset'
                    + (checked.length === 1 ? '' : 's') + ' to My Presets';
                btn.setAttribute('aria-label', btn.title);
            }
        },

        _syncDeleteSelectedButton: function () {
            const btn = this._root && this._root.querySelector('#wpe-btn-delete-selected');
            if (!btn) return;
            const checked = this._checkedSidebarEntries();
            const userCount = checked.filter((e) => e.kind === 'user').length;
            const disabled = userCount === 0;
            btn.disabled = disabled;
            btn.classList.toggle('is-disabled', disabled);
            btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
            if (disabled) {
                btn.title = 'Delete selected My Presets (none selected)';
                btn.setAttribute('aria-label', 'Delete selected My Presets (none selected)');
            } else {
                btn.title = 'Delete ' + userCount + ' selected My Preset' + (userCount === 1 ? '' : 's');
                btn.setAttribute('aria-label', btn.title);
            }
        },

        _displayNameForEntry: function (entry) {
            if (!entry) return '';
            const work = this._working && this._working[entry.key];
            const fromWork = work && ((work.preset && work.preset.name) || work.name);
            return fromWork || entry.name || '';
        },

        _syncCatalogEntryName: function (work) {
            if (!work || !work.key) return;
            const label = (work.preset && work.preset.name) || work.name;
            if (!label) return;
            const all = (this._catalog.user || []).concat(this._catalog.builtin || []);
            const entry = all.find((e) => e.key === work.key);
            if (entry) entry.name = label;
        },

        _myPresetDisplayNames: function (excludeKey) {
            const names = [];
            (this._catalog.user || []).forEach((entry) => {
                if (excludeKey && entry.key === excludeKey) return;
                const label = this._displayNameForEntry(entry);
                if (label) names.push(label);
            });
            return names;
        },

        _duplicatePresetWork: async function (work, nameBag, idBag) {
            if (!this._canPersistPresets() || !work || !work.preset) return null;
            const names = nameBag || this._myPresetDisplayNames();
            const ids = idBag || (this._catalog.user || []).map((u) => u.fileId);
            const displayName = WidgetPresetModel.uniqueDisplayName(
                work.preset.name || work.name || 'Preset',
                names
            );
            const fileId = WidgetPresetModel.uniqueSlug(
                WidgetPresetModel.slugify(displayName, 'preset'),
                ids
            );
            const preset = cloneJson(work.preset);
            preset.id = fileId;
            preset.name = displayName;
            preset.widgetType = work.widgetType;
            const fullName = work.widgetType + '/' + fileId;
            const saved = await Dashboard.saveUserWidgetPresetFile(fullName, preset);
            if (!saved) return null;
            names.push(displayName);
            ids.push(fileId);
            return { fullName: fullName, name: displayName, fileId: fileId, preset: preset };
        },

        _duplicateOnePreset: async function (work) {
            if (!this._canPersistPresets()) {
                this._setStatus('Duplicating presets requires Homey.', true);
                return;
            }
            const copy = await this._duplicatePresetWork(work);
            if (!copy) {
                this._setStatus('Could not duplicate this preset.', true);
                return;
            }
            await this._loadCatalog(this._widgetType);
            const entry = this._catalog.user.find((u) => u.fullName === copy.fullName);
            if (entry) {
                this._checkedKeys[entry.key] = true;
                this._expandedKeys[entry.key] = true;
                this._working[entry.key] = {
                    key: entry.key,
                    kind: 'user',
                    name: entry.name,
                    fileId: entry.fileId,
                    fullName: entry.fullName,
                    widgetType: entry.widgetType,
                    preset: cloneJson(copy.preset),
                    dirty: false
                };
            }
            this._renderSidebar();
            this._renderGrid();
            this._setStatus('Duplicated as "' + copy.name + '".');
        },

        _duplicateSelectedPresets: async function () {
            if (!this._canPersistPresets()) {
                this._setStatus('Duplicating presets requires Homey.', true);
                return;
            }
            const checked = this._checkedSidebarEntries();
            if (!checked.length) {
                this._setStatus('No presets selected to duplicate.');
                return;
            }
            const names = this._myPresetDisplayNames();
            const ids = (this._catalog.user || []).map((u) => u.fileId);
            const created = [];
            let failed = 0;
            for (let i = 0; i < checked.length; i++) {
                const entry = checked[i];
                try {
                    const work = await this._ensureWorking(entry);
                    const copy = await this._duplicatePresetWork(work, names, ids);
                    if (copy) created.push(copy);
                    else failed += 1;
                } catch (err) {
                    failed += 1;
                }
            }
            await this._loadCatalog(this._widgetType);
            created.forEach((copy) => {
                const entry = this._catalog.user.find((u) => u.fullName === copy.fullName);
                if (!entry) return;
                this._checkedKeys[entry.key] = true;
                this._expandedKeys[entry.key] = true;
                this._working[entry.key] = {
                    key: entry.key,
                    kind: 'user',
                    name: entry.name,
                    fileId: entry.fileId,
                    fullName: entry.fullName,
                    widgetType: entry.widgetType,
                    preset: cloneJson(copy.preset),
                    dirty: false
                };
            });
            this._renderSidebar();
            this._renderGrid();
            if (!created.length) {
                this._setStatus('Could not duplicate the selected presets.', true);
            } else if (failed) {
                this._setStatus('Duplicated ' + created.length + ', failed ' + failed + '.', true);
            } else if (created.length === 1) {
                this._setStatus('Duplicated as "' + created[0].name + '".');
            } else {
                this._setStatus('Duplicated ' + created.length + ' presets.');
            }
        },

        _deleteSelectedPresets: async function () {
            if (!this._canPersistPresets()) return;
            const checked = this._checkedSidebarEntries();
            const users = checked.filter((e) => e.kind === 'user');
            const builtins = checked.filter((e) => e.kind === 'builtin');
            if (!users.length) {
                this._setStatus('No My Presets selected to delete.');
                return;
            }

            let msg;
            if (users.length === 1 && builtins.length === 0) {
                msg = 'Delete "' + users[0].name + '" and all of its sub-presets permanently?';
            } else if (builtins.length > 0) {
                msg = 'Delete ' + users.length + ' My Preset' + (users.length === 1 ? '' : 's')
                    + ' permanently? Selected Built-in presets are ignored and will not be deleted.';
            } else {
                msg = 'Delete ' + users.length + ' My Presets permanently?';
            }

            const ok = typeof CustomDialog !== 'undefined'
                ? await CustomDialog.confirm(msg, users.length === 1 ? 'Delete Preset' : 'Delete Presets')
                : window.confirm(msg);
            if (!ok) return;

            let deleted = 0;
            let failed = 0;
            for (let i = 0; i < users.length; i++) {
                const entry = users[i];
                const work = this._working[entry.key];
                const fullName = (work && work.fullName) || entry.fullName;
                const label = (work && (work.preset.name || work.name)) || entry.name;
                const done = await Dashboard.deleteUserWidgetPreset(fullName, label, { skipConfirm: true });
                if (done) {
                    deleted += 1;
                    delete this._checkedKeys[entry.key];
                    delete this._working[entry.key];
                    delete this._expandedKeys[entry.key];
                } else {
                    failed += 1;
                }
            }

            await this._loadCatalog(this._widgetType);
            this._renderSidebar();
            this._renderGrid();
            if (failed) {
                this._setStatus('Deleted ' + deleted + ', failed ' + failed + '.', true);
            } else {
                this._setStatus('Deleted ' + deleted + ' My Preset' + (deleted === 1 ? '' : 's') + '.');
            }
        },

        _setAllPresetsChecked: async function (checked) {
            const all = (this._catalog.user || []).concat(this._catalog.builtin || []);
            if (!all.length) return;
            for (let i = 0; i < all.length; i++) {
                const entry = all[i];
                const isOn = !!this._checkedKeys[entry.key];
                if (checked && !isOn) {
                    await this._togglePreset(entry, true);
                } else if (!checked && isOn) {
                    await this._togglePreset(entry, false);
                }
            }
            this._setStatus(checked ? 'All presets selected.' : 'All presets cleared.');
        },

        _buildSidebarItem: function (entry) {
            const block = document.createElement('div');
            block.className = 'wpe-side-item' + (this._checkedKeys[entry.key] ? ' is-checked' : '');

            const row = document.createElement('div');
            row.className = 'wpe-side-row';

            const check = document.createElement('input');
            check.type = 'checkbox';
            check.className = 'wpe-side-check';
            check.checked = !!this._checkedKeys[entry.key];
            check.addEventListener('change', () => {
                void this._togglePreset(entry, check.checked);
            });

            const expandBtn = document.createElement('button');
            expandBtn.type = 'button';
            expandBtn.className = 'wpe-side-expand';
            const expanded = !!this._expandedKeys[entry.key];
            expandBtn.innerHTML = '<i class="ph-bold ' + (expanded ? 'ph-caret-down' : 'ph-caret-right') + '"></i>';
            expandBtn.addEventListener('click', () => {
                this._expandedKeys[entry.key] = !this._expandedKeys[entry.key];
                this._renderSidebar();
            });

            const label = document.createElement('span');
            label.className = 'wpe-side-label';
            const labelText = this._displayNameForEntry(entry);
            label.textContent = labelText;
            label.title = labelText;

            const badge = document.createElement('span');
            badge.className = 'wpe-side-badge';
            badge.textContent = entry.kind === 'builtin' ? 'Built-in' : 'My';

            row.appendChild(check);
            row.appendChild(expandBtn);
            row.appendChild(label);
            row.appendChild(badge);
            block.appendChild(row);

            if (expanded) {
                const work = this._working[entry.key];
                const variants = work && work.preset && work.preset.variants
                    ? work.preset.variants
                    : [];
                const list = document.createElement('div');
                list.className = 'wpe-side-variants';
                if (!variants.length) {
                    const hint = document.createElement('div');
                    hint.className = 'wpe-side-empty';
                    hint.textContent = check.checked ? 'Loading…' : (entry.variantCount + ' sub-preset(s)');
                    list.appendChild(hint);
                } else {
                    variants.forEach((v) => {
                        const vr = document.createElement('div');
                        vr.className = 'wpe-side-variant';
                        vr.textContent = v.name || v.id;
                        list.appendChild(vr);
                    });
                }
                block.appendChild(list);
            }
            return block;
        },

        _togglePreset: async function (entry, checked) {
            if (!checked) {
                if (this._working[entry.key] && this._working[entry.key].dirty) {
                    const ok = typeof CustomDialog !== 'undefined'
                        ? await CustomDialog.confirm('Uncheck and discard edits to "' + entry.name + '"?', 'Widget Preset Editor')
                        : window.confirm('Discard edits?');
                    if (!ok) {
                        this._renderSidebar();
                        return;
                    }
                }
                delete this._checkedKeys[entry.key];
                delete this._working[entry.key];
                this._selection = this._selection.filter((c) => c.workingKey !== entry.key);
                this._renderSidebar();
                this._renderGrid();
                this._refreshStatus();
                return;
            }

            this._checkedKeys[entry.key] = true;
            this._expandedKeys[entry.key] = true;
            this._renderSidebar();
            try {
                await this._ensureWorking(entry);
                this._renderSidebar();
                this._renderGrid();
                this._refreshStatus();
            } catch (err) {
                delete this._checkedKeys[entry.key];
                delete this._working[entry.key];
                this._renderSidebar();
                this._renderGrid();
                this._setStatus('Failed to load preset: ' + (err && err.message ? err.message : String(err)), true);
            }
        },

        _ensureWorking: async function (entry) {
            if (this._working[entry.key]) return this._working[entry.key];
            let preset = null;
            if (entry.kind === 'builtin') {
                preset = await Dashboard.fetchBuiltInWidgetPresetFile(entry.widgetType, entry.file);
            } else {
                preset = await Dashboard._loadUserWidgetPresetFile(entry.fullName);
            }
            if (!preset) throw new Error('Invalid preset file');
            const work = {
                key: entry.key,
                kind: entry.kind,
                name: entry.name,
                fileId: entry.fileId,
                fullName: entry.fullName || null,
                file: entry.file || null,
                widgetType: entry.widgetType,
                preset: cloneJson(preset),
                dirty: false
            };
            this._working[entry.key] = work;
            return work;
        },

        _checkedWorkingList: function () {
            const order = this._catalog.user.concat(this._catalog.builtin);
            const out = [];
            order.forEach((entry) => {
                if (!this._checkedKeys[entry.key]) return;
                const work = this._working[entry.key];
                if (work) out.push(work);
            });
            return out;
        },

        _renderGrid: function () {
            this._destroyColorPickers();
            this._destroyReorders();
            const empty = this._root && this._root.querySelector('#wpe-empty');
            const scroll = this._root && this._root.querySelector('#wpe-grid-scroll');
            if (!empty || !scroll) return;

            const prevTop = scroll.scrollTop;
            const prevLeft = scroll.scrollLeft;

            const groups = this._checkedWorkingList();
            if (!groups.length) {
                empty.hidden = false;
                scroll.hidden = true;
                scroll.innerHTML = '';
                this._currentColumns = [];
                return;
            }
            empty.hidden = true;
            scroll.hidden = false;

            const columns = [];
            groups.forEach((work) => {
                (work.preset.variants || []).forEach((variant, vi) => {
                    columns.push({
                        workingKey: work.key,
                        work: work,
                        variant: variant,
                        variantIndex: vi,
                        colId: work.key + '::' + variant.id
                    });
                });
            });
            this._currentColumns = columns;

            const visibleLeaves = this._getVisibleLeaves(columns);
            const table = document.createElement('div');
            table.className = 'wpe-table';
            table.style.setProperty('--wpe-cols', String(Math.max(1, columns.length)));

            this._buildHeaderRows(groups, columns, table);
            this._buildBody(visibleLeaves, columns, table);
            this._buildFooterRow(groups, columns, table);

            scroll.innerHTML = '';
            scroll.appendChild(table);
            scroll.scrollTop = prevTop;
            scroll.scrollLeft = prevLeft;
            this._paintSelection();
        },

        _isEntireRowSelected: function (leaf, columns) {
            if (!leaf || !columns || !columns.length) return false;
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i];
                if (!this._isSelected(col.workingKey, col.variant.id, leaf.id)) return false;
            }
            return true;
        },

        _selectEntireRow: function (leaf, columns) {
            if (!leaf || !columns || !columns.length) return;
            if (this._isEntireRowSelected(leaf, columns)) {
                const pathKey = leaf.id;
                this._selection = this._selection.filter((sel) => {
                    if (sel.pathKey !== pathKey) return true;
                    return !columns.some((col) => (
                        col.workingKey === sel.workingKey && col.variant.id === sel.variantId
                    ));
                });
                this._anchorCell = this._selection[0] || null;
                this._paintSelection();
                this._setStatus(this._selection.length
                    ? (this._selection.length + ' cells still selected.')
                    : 'Row deselected.');
                return;
            }
            const type = fieldTypeKey(leaf.field);
            this._selection = columns.map((col) => ({
                workingKey: col.workingKey,
                variantId: col.variant.id,
                pathKey: leaf.id,
                fieldType: type,
                colId: col.colId
            }));
            this._anchorCell = this._selection[0] || null;
            this._paintSelection();
            this._setStatus(
                this._selection.length + ' cells selected (' + type + '). '
                + 'Toggle Include or edit any selected cell to apply to all.'
            );
            if (this._root && typeof this._root.focus === 'function') {
                try { this._root.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
            }
        },

        _getVisibleLeaves: function (columns) {
            const filter = String(this._filter || '').trim().toLowerCase();
            const mode = this._rowMode || 'all';
            const out = [];
            const pushBranch = (nodes, section) => {
                (nodes || []).forEach((node) => {
                    if (!node) return;
                    if (node.kind === 'branch') {
                        pushBranch(node.children || [], node.label || section);
                        return;
                    }
                    if (filter) {
                        const hay = ((node.label || '') + ' ' + (node.id || '')).toLowerCase();
                        if (hay.indexOf(filter) < 0) return;
                    }
                    if (mode === 'included') {
                        const anyIncluded = columns.some((col) => WidgetPresetModel.hasAtPath(col.variant.settings, node.path));
                        if (!anyIncluded) return;
                    }
                    if (mode === 'differing') {
                        const vals = columns.map((col) => {
                            if (!WidgetPresetModel.hasAtPath(col.variant.settings, node.path)) return undefined;
                            return WidgetPresetModel.getAtPath(col.variant.settings, node.path);
                        });
                        let differ = false;
                        for (let i = 1; i < vals.length; i++) {
                            if (!valuesEqual(vals[0], vals[i])) { differ = true; break; }
                        }
                        if (!differ) return;
                    }
                    out.push({ leaf: node, section: section || '' });
                });
            };
            pushBranch(this._tree, '');
            return out;
        },

        _buildHeaderRows: function (groups, columns, table) {
            const groupRow = document.createElement('div');
            groupRow.className = 'wpe-row wpe-row-groups';
            const corner = document.createElement('div');
            corner.className = 'wpe-corner wpe-sticky-col';
            corner.textContent = 'Setting';
            groupRow.appendChild(corner);

            groups.forEach((work) => {
                const span = (work.preset.variants || []).length || 1;
                const cell = document.createElement('div');
                cell.className = 'wpe-group-head';
                cell.style.gridColumn = 'span ' + span;
                cell.dataset.workingKey = work.key;

                const title = document.createElement('div');
                title.className = 'wpe-group-title';
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.className = 'control-input wpe-name-input';
                nameInput.value = work.preset.name || work.name || '';
                nameInput.title = 'Preset name';
                nameInput.addEventListener('change', () => {
                    const ok = WidgetPresetModel.validateDisplayName(nameInput.value);
                    if (!ok.ok) {
                        this._setStatus(ok.error || 'Invalid name', true);
                        nameInput.value = work.preset.name || '';
                        return;
                    }
                    if (work.kind === 'user'
                        && WidgetPresetModel.isDisplayNameTaken(ok.name, this._myPresetDisplayNames(work.key))) {
                        this._setStatus('A My Preset named "' + ok.name + '" already exists.', true);
                        nameInput.value = work.preset.name || '';
                        return;
                    }
                    work.preset.name = ok.name;
                    work.name = ok.name;
                    this._syncCatalogEntryName(work);
                    this._markDirty(work);
                    this._renderSidebar();
                });
                title.appendChild(nameInput);

                const actions = document.createElement('div');
                actions.className = 'wpe-group-actions';
                const addBtn = document.createElement('button');
                addBtn.type = 'button';
                addBtn.className = 'btn-tool btn-tool-icon-only';
                addBtn.title = 'Add sub-preset';
                addBtn.innerHTML = '<i class="ph-bold ph-plus"></i>';
                addBtn.addEventListener('click', () => { void this._addVariant(work); });
                actions.appendChild(addBtn);

                const canPersist = this._canPersistPresets();
                if (canPersist) {
                    const dupBtn = document.createElement('button');
                    dupBtn.type = 'button';
                    dupBtn.className = 'btn-tool btn-tool-icon-only';
                    dupBtn.title = work.kind === 'builtin' ? 'Duplicate to My Presets' : 'Duplicate preset';
                    dupBtn.setAttribute('aria-label', dupBtn.title);
                    dupBtn.innerHTML = '<i class="ph-bold ph-copy"></i>';
                    dupBtn.addEventListener('click', () => { void this._duplicateOnePreset(work); });
                    actions.appendChild(dupBtn);
                }
                if (work.kind === 'user' && canPersist) {
                    const delBtn = document.createElement('button');
                    delBtn.type = 'button';
                    delBtn.className = 'btn-tool btn-tool-icon-only danger';
                    delBtn.title = 'Delete My Preset';
                    delBtn.setAttribute('aria-label', 'Delete My Preset');
                    delBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
                    delBtn.addEventListener('click', () => { void this._deleteUserPreset(work); });
                    actions.appendChild(delBtn);
                }

                if (work.dirty) {
                    const dirty = document.createElement('span');
                    dirty.className = 'wpe-dirty-dot';
                    dirty.title = 'Unsaved changes';
                    actions.appendChild(dirty);
                }

                cell.appendChild(title);
                cell.appendChild(actions);
                groupRow.appendChild(cell);
            });
            table.appendChild(groupRow);

            const varRow = document.createElement('div');
            varRow.className = 'wpe-row wpe-row-variants';
            const corner2 = document.createElement('div');
            corner2.className = 'wpe-corner wpe-sticky-col wpe-corner-sub';
            corner2.textContent = '';
            varRow.appendChild(corner2);

            columns.forEach((col) => {
                const cell = document.createElement('div');
                cell.className = 'wpe-variant-head';
                cell.dataset.workingKey = col.workingKey;
                cell.dataset.variantId = col.variant.id;
                cell.dataset.colId = col.colId;

                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.className = 'control-input wpe-variant-name';
                nameInput.value = col.variant.name || col.variant.id || '';
                nameInput.addEventListener('change', () => {
                    const ok = WidgetPresetModel.validateDisplayName(nameInput.value);
                    if (!ok.ok) {
                        this._setStatus(ok.error || 'Invalid name', true);
                        nameInput.value = col.variant.name || '';
                        return;
                    }
                    const others = (col.work.preset.variants || [])
                        .filter((_, i) => i !== col.variantIndex)
                        .map((v) => v.name);
                    if (WidgetPresetModel.isDisplayNameTaken(ok.name, others)) {
                        this._setStatus('A sub-preset named "' + ok.name + '" already exists.', true);
                        nameInput.value = col.variant.name || '';
                        return;
                    }
                    col.variant.name = ok.name;
                    this._markDirty(col.work);
                    this._renderSidebar();
                });

                const tools = document.createElement('div');
                tools.className = 'wpe-variant-tools';
                const moveLeft = document.createElement('button');
                moveLeft.type = 'button';
                moveLeft.className = 'btn-tool btn-tool-icon-only';
                moveLeft.title = 'Move sub-preset left';
                moveLeft.disabled = col.variantIndex <= 0;
                moveLeft.innerHTML = '<i class="ph-bold ph-caret-left"></i>';
                moveLeft.addEventListener('click', () => {
                    this._moveVariant(col.work, col.variantIndex, col.variantIndex - 1);
                });
                const moveRight = document.createElement('button');
                moveRight.type = 'button';
                moveRight.className = 'btn-tool btn-tool-icon-only';
                moveRight.title = 'Move sub-preset right';
                moveRight.disabled = col.variantIndex >= (col.work.preset.variants.length - 1);
                moveRight.innerHTML = '<i class="ph-bold ph-caret-right"></i>';
                moveRight.addEventListener('click', () => {
                    this._moveVariant(col.work, col.variantIndex, col.variantIndex + 1);
                });
                const dup = document.createElement('button');
                dup.type = 'button';
                dup.className = 'btn-tool btn-tool-icon-only';
                dup.title = 'Duplicate sub-preset';
                dup.innerHTML = '<i class="ph-bold ph-copy"></i>';
                dup.addEventListener('click', () => { void this._duplicateVariant(col.work, col.variantIndex); });
                const del = document.createElement('button');
                del.type = 'button';
                del.className = 'btn-tool btn-tool-icon-only';
                del.title = 'Delete sub-preset';
                del.innerHTML = '<i class="ph-bold ph-trash"></i>';
                del.addEventListener('click', () => { void this._deleteVariant(col.work, col.variantIndex); });
                tools.appendChild(moveLeft);
                tools.appendChild(moveRight);
                tools.appendChild(dup);
                tools.appendChild(del);

                cell.appendChild(nameInput);
                cell.appendChild(tools);
                varRow.appendChild(cell);
            });
            table.appendChild(varRow);
        },

        _buildBody: function (visibleLeaves, columns, table) {
            let lastSection = null;

            visibleLeaves.forEach((item) => {
                const leaf = item.leaf;
                if (item.section && item.section !== lastSection) {
                    lastSection = item.section;
                    const sec = document.createElement('div');
                    sec.className = 'wpe-row wpe-row-section';
                    const lab = document.createElement('div');
                    lab.className = 'wpe-section-label wpe-sticky-col';
                    lab.textContent = item.section;
                    sec.appendChild(lab);
                    columns.forEach(() => {
                        const filler = document.createElement('div');
                        filler.className = 'wpe-section-fill';
                        sec.appendChild(filler);
                    });
                    table.appendChild(sec);
                }

                const row = document.createElement('div');
                row.className = 'wpe-row wpe-row-setting';
                const labelCell = document.createElement('div');
                labelCell.className = 'wpe-setting-label wpe-sticky-col';
                labelCell.title = leaf.id;

                const labelText = document.createElement('span');
                labelText.className = 'wpe-setting-label-text';
                labelText.textContent = leaf.label || leaf.id;

                const selectBtn = document.createElement('button');
                selectBtn.type = 'button';
                selectBtn.className = 'btn-tool btn-tool-icon-only wpe-row-select';
                selectBtn.dataset.pathKey = leaf.id;
                selectBtn.title = 'Select entire row';
                selectBtn.setAttribute('aria-label', 'Select entire row');
                selectBtn.setAttribute('aria-pressed', 'false');
                selectBtn.innerHTML = '<i class="ph-bold ph-selection-all"></i>';
                selectBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this._selectEntireRow(leaf, columns);
                });

                labelCell.appendChild(labelText);
                labelCell.appendChild(selectBtn);
                row.appendChild(labelCell);

                const vals = columns.map((col) => {
                    const included = WidgetPresetModel.hasAtPath(col.variant.settings, leaf.path);
                    return included ? WidgetPresetModel.getAtPath(col.variant.settings, leaf.path) : undefined;
                });
                let differ = false;
                if (columns.length > 1) {
                    for (let i = 1; i < vals.length; i++) {
                        if (!valuesEqual(vals[0], vals[i])) { differ = true; break; }
                    }
                }

                columns.forEach((col, ci) => {
                    row.appendChild(this._buildCell(col, leaf, differ && !valuesEqual(vals[0], vals[ci])));
                });
                table.appendChild(row);
            });

            if (!visibleLeaves.length) {
                const empty = document.createElement('div');
                empty.className = 'wpe-grid-hint';
                empty.textContent = 'No settings match the current filter or row mode.';
                table.appendChild(empty);
            }
        },

        _buildFooterRow: function (groups, columns, table) {
            const row = document.createElement('div');
            row.className = 'wpe-row wpe-row-footer';
            const corner = document.createElement('div');
            corner.className = 'wpe-corner wpe-sticky-col';
            corner.textContent = '';
            row.appendChild(corner);

            groups.forEach((work) => {
                const span = (work.preset.variants || []).length || 1;
                const cell = document.createElement('div');
                cell.className = 'wpe-group-footer';
                cell.style.gridColumn = 'span ' + span;

                if (work.kind === 'user') {
                    if (this._canPersistPresets()) {
                        const saveBtn = document.createElement('button');
                        saveBtn.type = 'button';
                        saveBtn.className = 'btn-tool ds-dialog-button primary';
                        saveBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i><span>Save</span>';
                        saveBtn.addEventListener('click', () => { void this._saveWork(work); });
                        cell.appendChild(saveBtn);
                    }
                } else if (this._canPersistPresets()) {
                    const saveMyBtn = document.createElement('button');
                    saveMyBtn.type = 'button';
                    saveMyBtn.className = 'btn-tool ds-dialog-button primary';
                    saveMyBtn.title = 'Save a copy under My Presets';
                    saveMyBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i><span>To My Presets</span>';
                    saveMyBtn.addEventListener('click', () => { void this._duplicateToUser(work); });
                    cell.appendChild(saveMyBtn);
                }

                const exportBtn = document.createElement('button');
                exportBtn.type = 'button';
                exportBtn.className = 'btn-tool ds-dialog-button';
                exportBtn.innerHTML = '<i class="ph-bold ph-download-simple"></i><span>Export</span>';
                exportBtn.addEventListener('click', () => { this._exportWork(work); });
                cell.appendChild(exportBtn);

                row.appendChild(cell);
            });
            table.appendChild(row);
        },

        _buildCell: function (col, leaf, highlightDiffer) {
            const cell = document.createElement('div');
            cell.className = 'wpe-cell' + (highlightDiffer ? ' is-differ' : '');
            cell.dataset.workingKey = col.workingKey;
            cell.dataset.variantId = col.variant.id;
            cell.dataset.pathKey = leaf.id;
            cell.dataset.fieldType = fieldTypeKey(leaf.field);
            if (this._isSelected(col.workingKey, col.variant.id, leaf.id)) {
                cell.classList.add('is-selected');
            }

            const included = WidgetPresetModel.hasAtPath(col.variant.settings, leaf.path);
            const check = document.createElement('input');
            check.type = 'checkbox';
            check.className = 'wpe-include';
            check.checked = included;
            check.title = 'Include in preset';
            check.addEventListener('click', (e) => e.stopPropagation());
            check.addEventListener('change', () => {
                this._setInclude(col, leaf, check.checked);
            });

            const editorWrap = document.createElement('div');
            editorWrap.className = 'wpe-cell-editor' + (included ? '' : ' is-disabled');
            const value = included
                ? WidgetPresetModel.getAtPath(col.variant.settings, leaf.path)
                : this._ghostValue(leaf);
            editorWrap.appendChild(this._createValueControl(col, leaf, value, included));

            cell.appendChild(check);
            cell.appendChild(editorWrap);

            cell.addEventListener('mousedown', (e) => {
                const interactive = e.target && e.target.closest
                    && e.target.closest(
                        'input, select, textarea, button, a, .ds-checkbox-row, .ds-color-picker-trigger-row'
                    );
                if (interactive) {
                    // Keep multi-selection when editing / toggling include on an already-selected cell.
                    const already = this._isSelected(col.workingKey, col.variant.id, leaf.id);
                    if (already && this._selection.length > 1 && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                        e.stopPropagation();
                        return;
                    }
                    if (already && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                        return;
                    }
                }
                this._onCellPointer(e, col, leaf, cell);
            });
            return cell;
        },

        _ghostValue: function (leaf) {
            if (!this._probeWidget) return undefined;
            const merged = typeof Editor !== 'undefined' && Editor._buildMergedStaticValues
                ? Editor._buildMergedStaticValues(this._probeWidget)
                : {};
            return WidgetPresetModel.resolveFieldValue(leaf.field, {}, merged);
        },

        _createValueControl: function (col, leaf, value, included) {
            const field = leaf.field || {};
            const type = field.type || 'text';
            const self = this;

            const applyValue = (next, opts) => {
                opts = opts || {};
                const typeKey = fieldTypeKey(leaf.field);
                let targets = self._selection.length
                    ? self._selection.filter((c) => c.fieldType === typeKey)
                    : [];
                const selfSel = {
                    workingKey: col.workingKey,
                    variantId: col.variant.id,
                    pathKey: leaf.id,
                    fieldType: typeKey
                };
                if (!targets.length) {
                    targets = [selfSel];
                } else if (!targets.some((c) => c.workingKey === selfSel.workingKey
                    && c.variantId === selfSel.variantId && c.pathKey === selfSel.pathKey)) {
                    targets = targets.concat([selfSel]);
                }
                targets.forEach((sel) => {
                    const work = self._working[sel.workingKey];
                    if (!work) return;
                    const variant = (work.preset.variants || []).find((v) => v.id === sel.variantId);
                    if (!variant) return;
                    const targetLeaf = self._leaves.find((l) => l.id === sel.pathKey) || leaf;
                    if (!targetLeaf) return;
                    WidgetPresetModel.setAtPath(variant.settings, targetLeaf.path, cloneJson(next));
                    self._markDirty(work);
                });
                if (targets.length > 1) {
                    self._setStatus('Applied value to ' + targets.length + ' cells.');
                    if (!opts.deferRender) self._renderGrid();
                } else {
                    self._refreshStatus();
                }
            };

            if (type === 'checkbox') {
                if (typeof Editor !== 'undefined' && typeof Editor.createToggleStyleCheckboxRow === 'function') {
                    const { wrap, input } = Editor.createToggleStyleCheckboxRow(!!value, (checked) => {
                        applyValue(!!checked);
                    });
                    input.disabled = !included;
                    wrap.classList.toggle('is-disabled', !included);
                    return wrap;
                }
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = !!value;
                input.disabled = !included;
                input.addEventListener('change', () => applyValue(!!input.checked));
                return input;
            }

            if (type === 'number') {
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'control-input wpe-input';
                input.value = value == null || value === '' ? '' : String(value);
                input.disabled = !included;
                input.addEventListener('change', () => {
                    const n = parseFloat(input.value);
                    applyValue(isNaN(n) ? 0 : n);
                });
                return input;
            }

            if (type === 'select' || type === 'radio' || type === 'mode_toggle') {
                const select = document.createElement('select');
                select.className = 'control-input wpe-input';
                select.disabled = !included;
                const opts = Array.isArray(field.options) ? field.options : [];
                opts.forEach((opt) => {
                    const o = document.createElement('option');
                    if (opt && typeof opt === 'object') {
                        o.value = String(opt.value);
                        o.textContent = String(opt.label != null ? opt.label : opt.value);
                    } else {
                        o.value = String(opt);
                        o.textContent = String(opt);
                    }
                    select.appendChild(o);
                });
                select.value = value == null ? '' : String(value);
                select.addEventListener('change', () => applyValue(select.value));
                return select;
            }

            if (type === 'color') {
                const wrap = document.createElement('div');
                wrap.className = 'wpe-color-mount';
                let liveRaw = value == null ? '' : String(value);
                if (typeof Editor !== 'undefined' && typeof Editor._attachColorPicker === 'function') {
                    const ctrl = Editor._attachColorPicker({
                        mountCard: wrap,
                        getRaw: () => liveRaw,
                        setValue: (val, skipReload) => {
                            liveRaw = val == null ? '' : String(val);
                            applyValue(liveRaw, { deferRender: !!skipReload });
                        },
                        allowThemeTokens: typeof MasterLayout !== 'undefined',
                        skipControllerRegistry: true,
                        zIndex: 10050
                    });
                    if (ctrl) {
                        if (!self._colorPickers) self._colorPickers = [];
                        self._colorPickers.push(ctrl);
                    }
                    return wrap;
                }
                const text = document.createElement('input');
                text.type = 'text';
                text.className = 'control-input wpe-input';
                text.value = liveRaw;
                text.disabled = !included;
                text.addEventListener('change', () => applyValue(text.value));
                wrap.appendChild(text);
                return wrap;
            }

            if (leaf.blob || (typeof WidgetPresetModel !== 'undefined' && WidgetPresetModel.BLOB_FIELD_TYPES[type])) {
                const wrap = document.createElement('div');
                wrap.className = 'wpe-blob-wrap';
                const summary = document.createElement('span');
                summary.className = 'wpe-blob-summary';
                summary.textContent = formatBlobSummary(value);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn-tool';
                btn.textContent = 'Edit…';
                btn.disabled = !included;
                btn.addEventListener('click', async () => {
                    const raw = JSON.stringify(value == null ? (Array.isArray(value) ? [] : {}) : value, null, 2);
                    const next = await CustomDialog.codePrompt(
                        'Edit JSON for ' + (leaf.label || leaf.id),
                        raw,
                        'Edit Setting'
                    );
                    if (next === false || next == null) return;
                    try {
                        const parsed = JSON.parse(next);
                        applyValue(parsed);
                        self._renderGrid();
                    } catch (err) {
                        self._setStatus('Invalid JSON: ' + (err && err.message ? err.message : String(err)), true);
                    }
                });
                wrap.appendChild(summary);
                wrap.appendChild(btn);
                return wrap;
            }

            if (type === 'textarea') {
                const input = document.createElement('textarea');
                input.className = 'control-input wpe-input wpe-textarea';
                input.rows = 2;
                input.value = value == null ? '' : String(value);
                input.disabled = !included;
                input.addEventListener('change', () => applyValue(input.value));
                return input;
            }

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'control-input wpe-input';
            input.value = value == null ? '' : String(value);
            input.disabled = !included;
            input.addEventListener('change', () => applyValue(input.value));
            return input;
        },

        _setInclude: function (col, leaf, included) {
            const typeKey = fieldTypeKey(leaf.field);
            let selection = this._selection.length
                ? this._selection.filter((c) => c.fieldType === typeKey)
                : [];
            const selfSel = {
                workingKey: col.workingKey,
                variantId: col.variant.id,
                pathKey: leaf.id,
                fieldType: typeKey
            };
            if (!selection.length) {
                selection = [selfSel];
            } else if (!selection.some((c) => c.workingKey === selfSel.workingKey
                && c.variantId === selfSel.variantId && c.pathKey === selfSel.pathKey)) {
                selection = selection.concat([selfSel]);
            }

            selection.forEach((sel) => {
                const work = this._working[sel.workingKey];
                if (!work) return;
                const variant = (work.preset.variants || []).find((v) => v.id === sel.variantId);
                if (!variant) return;
                const targetLeaf = this._leaves.find((l) => l.id === sel.pathKey) || leaf;
                if (!targetLeaf || fieldTypeKey(targetLeaf.field) !== typeKey) return;
                if (included) {
                    if (!WidgetPresetModel.hasAtPath(variant.settings, targetLeaf.path)) {
                        const ghost = this._ghostValue(targetLeaf);
                        WidgetPresetModel.setAtPath(
                            variant.settings,
                            targetLeaf.path,
                            ghost === undefined ? null : cloneJson(ghost)
                        );
                    }
                } else {
                    WidgetPresetModel.deleteAtPath(variant.settings, targetLeaf.path);
                }
                this._markDirty(work);
            });
            if (selection.length > 1) {
                this._setStatus((included ? 'Included' : 'Excluded') + ' ' + selection.length + ' cells.');
            }
            this._renderGrid();
            this._refreshStatus();
        },

        _isSelected: function (workingKey, variantId, pathKey) {
            return this._selection.some((c) => c.workingKey === workingKey && c.variantId === variantId && c.pathKey === pathKey);
        },

        _onCellPointer: function (e, col, leaf, cellEl) {
            if (e.button !== 0) return;
            const type = fieldTypeKey(leaf.field);
            const cell = {
                workingKey: col.workingKey,
                variantId: col.variant.id,
                pathKey: leaf.id,
                fieldType: type,
                colId: col.colId
            };

            if (e.shiftKey) {
                if (!this._anchorCell || this._anchorCell.pathKey !== leaf.id) {
                    this._setStatus('Shift-select only works within the same settings row.', true);
                    return;
                }
                if (this._anchorCell.fieldType !== type) {
                    this._selection = [];
                    this._setStatus('Cannot select a range across different value types.', true);
                    this._paintSelection();
                    return;
                }
                const columns = [];
                this._checkedWorkingList().forEach((work) => {
                    (work.preset.variants || []).forEach((variant) => {
                        columns.push({ workingKey: work.key, variantId: variant.id, colId: work.key + '::' + variant.id });
                    });
                });
                const aIdx = columns.findIndex((c) => c.colId === this._anchorCell.colId);
                const bIdx = columns.findIndex((c) => c.colId === cell.colId);
                if (aIdx < 0 || bIdx < 0) return;
                const lo = Math.min(aIdx, bIdx);
                const hi = Math.max(aIdx, bIdx);
                const slice = columns.slice(lo, hi + 1);
                this._selection = slice.map((c) => ({
                    workingKey: c.workingKey,
                    variantId: c.variantId,
                    pathKey: leaf.id,
                    fieldType: type,
                    colId: c.colId
                }));
                this._setStatus(
                    this._selection.length + ' cells selected (' + type + '). '
                    + 'Toggle Include or edit any selected cell to apply to all.'
                );
                this._paintSelection();
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                if (this._selection.length && this._selection[0].fieldType !== type) {
                    this._selection = [cell];
                    this._anchorCell = cell;
                    this._setStatus('Selection cleared: different value type. Selected 1 ' + type + ' cell.');
                } else {
                    const idx = this._selection.findIndex((c) => c.workingKey === cell.workingKey && c.variantId === cell.variantId && c.pathKey === cell.pathKey);
                    if (idx >= 0) this._selection.splice(idx, 1);
                    else this._selection.push(cell);
                    this._anchorCell = cell;
                    this._setStatus(
                        this._selection.length + ' cells selected (' + type + '). '
                        + (this._selection.length > 1
                            ? 'Toggle Include or edit any selected cell to apply to all.'
                            : '')
                    );
                }
                this._paintSelection();
                return;
            }

            this._selection = [cell];
            this._anchorCell = cell;
            this._paintSelection();
            this._refreshStatus();
        },

        _paintSelection: function () {
            if (!this._root) return;
            this._root.querySelectorAll('.wpe-cell.is-selected').forEach((el) => el.classList.remove('is-selected'));
            this._selection.forEach((sel) => {
                const el = this._root.querySelector(
                    '.wpe-cell[data-working-key="' + this._cssEscape(sel.workingKey) + '"][data-variant-id="' + this._cssEscape(sel.variantId) + '"][data-path-key="' + this._cssEscape(sel.pathKey) + '"]'
                );
                if (el) el.classList.add('is-selected');
            });

            const columns = this._currentColumns || [];
            this._root.querySelectorAll('.wpe-row-select').forEach((btn) => {
                const pathKey = btn.dataset.pathKey || '';
                let active = false;
                if (pathKey && columns.length) {
                    active = true;
                    for (let i = 0; i < columns.length; i++) {
                        const col = columns[i];
                        if (!this._isSelected(col.workingKey, col.variant.id, pathKey)) {
                            active = false;
                            break;
                        }
                    }
                }
                btn.classList.toggle('is-active', active);
                btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                btn.title = active ? 'Deselect entire row' : 'Select entire row';
                btn.setAttribute('aria-label', active ? 'Deselect entire row' : 'Select entire row');
            });
        },

        _onKeyDown: function (e) {
            if (e.key === 'Escape') {
                if (this._selection.length) {
                    e.stopPropagation();
                    this._selection = [];
                    this._anchorCell = null;
                    this._paintSelection();
                    this._setStatus('Selection cleared.');
                }
                return;
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && this._selection.length) {
                const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
                if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
                if (e.target && e.target.closest
                    && e.target.closest('.ds-checkbox-row, .ds-color-picker-trigger-row, .ds-color-picker-panel')) {
                    return;
                }
                e.preventDefault();
                this._selection.forEach((sel) => {
                    const work = this._working[sel.workingKey];
                    if (!work) return;
                    const variant = (work.preset.variants || []).find((v) => v.id === sel.variantId);
                    const leaf = this._leaves.find((l) => l.id === sel.pathKey);
                    if (!variant || !leaf) return;
                    WidgetPresetModel.deleteAtPath(variant.settings, leaf.path);
                    this._markDirty(work);
                });
                this._renderGrid();
                this._setStatus('Excluded ' + this._selection.length + ' cells from presets.');
                return;
            }
            if (e.key === ' ' && this._selection.length) {
                const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
                if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') return;
                if (e.target && e.target.closest
                    && e.target.closest('.ds-checkbox-row, .ds-color-picker-trigger-row, .ds-color-picker-panel')) {
                    return;
                }
                e.preventDefault();
                const first = this._selection[0];
                const work = this._working[first.workingKey];
                const variant = work && (work.preset.variants || []).find((v) => v.id === first.variantId);
                const leaf = this._leaves.find((l) => l.id === first.pathKey);
                if (!work || !variant || !leaf) return;
                const currentlyOn = WidgetPresetModel.hasAtPath(variant.settings, leaf.path);
                this._setInclude(
                    { workingKey: first.workingKey, work: work, variant: variant, variantId: first.variantId },
                    leaf,
                    !currentlyOn
                );
            }
        },

        _cssEscape: function (value) {
            const s = String(value == null ? '' : value);
            if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(s);
            return s.replace(/["\\]/g, '\\$&');
        },

        _moveVariant: function (work, from, to) {
            if (!work || !work.preset || !Array.isArray(work.preset.variants)) return;
            const list = work.preset.variants;
            if (from < 0 || to < 0 || from >= list.length || to >= list.length || from === to) return;
            const moved = list.splice(from, 1)[0];
            list.splice(to, 0, moved);
            this._markDirty(work);
            this._renderSidebar();
            this._renderGrid();
        },

        _destroyColorPickers: function () {
            const list = this._colorPickers || [];
            this._colorPickers = [];
            list.forEach((ctrl) => {
                try {
                    if (ctrl && typeof ctrl.destroy === 'function') ctrl.destroy();
                } catch (e) { /* ignore */ }
            });
        },

        _destroyReorders: function () {
            this._reorderControllers = [];
        },

        _markDirty: function (work) {
            if (!work) return;
            work.dirty = true;
            this._refreshStatus();
        },

        _setStatus: function (msg, warn) {
            this._status = String(msg || '');
            this._statusWarn = !!warn;
            const el = this._root && this._root.querySelector('#wpe-status');
            if (!el) return;
            el.textContent = this._status;
            el.classList.toggle('is-warn', this._statusWarn);
            this._syncSaveAllButton();
        },

        _dirtyUserWorks: function () {
            const out = [];
            const keys = Object.keys(this._working);
            for (let i = 0; i < keys.length; i++) {
                const work = this._working[keys[i]];
                if (work && work.dirty && work.kind === 'user') out.push(work);
            }
            return out;
        },

        _syncSaveAllButton: function () {
            const btn = this._root && this._root.querySelector('#wpe-btn-save-all');
            if (!btn) return;
            if (!this._canPersistPresets()) {
                btn.hidden = true;
                return;
            }
            btn.hidden = false;
            const dirtyUser = this._dirtyUserWorks();
            btn.disabled = dirtyUser.length === 0;
            btn.classList.toggle('is-disabled', dirtyUser.length === 0);
            btn.setAttribute('aria-disabled', dirtyUser.length === 0 ? 'true' : 'false');
            btn.title = dirtyUser.length
                ? ('Save ' + dirtyUser.length + ' modified My Preset' + (dirtyUser.length === 1 ? '' : 's'))
                : 'No modified My Presets to save';
        },

        _refreshStatus: function () {
            const dirtyCount = Object.keys(this._working).filter((k) => this._working[k].dirty).length;
            const dirtyUser = this._dirtyUserWorks().length;
            const sel = this._selection.length;
            const canPersist = this._canPersistPresets();
            const parts = [];
            if (sel) {
                const type = this._selection[0] ? this._selection[0].fieldType : '';
                parts.push(sel + ' cell' + (sel === 1 ? '' : 's') + ' selected' + (type ? (' (' + type + ')') : ''));
                if (sel > 1) parts.push('edit Include or a value to apply to all');
            }
            if (dirtyCount) parts.push(dirtyCount + ' preset' + (dirtyCount === 1 ? '' : 's') + ' modified');
            if (canPersist && dirtyUser) parts.push(dirtyUser + ' can Save All');
            const factoryDirty = Object.keys(this._working).some((k) => this._working[k].dirty && this._working[k].kind === 'builtin');
            if (factoryDirty) {
                parts.push(canPersist
                    ? 'Built-in edits need Export or Save to My Presets'
                    : 'Built-in edits need Export (My Presets require Homey)');
            }
            this._setStatus(parts.length ? parts.join(' · ') : 'Ready.');
        },

        _saveAll: async function () {
            if (!this._canPersistPresets()) return;
            const dirtyUser = this._dirtyUserWorks();
            if (!dirtyUser.length) {
                this._setStatus('No modified My Presets to save.');
                return;
            }
            let saved = 0;
            let failed = 0;
            for (let i = 0; i < dirtyUser.length; i++) {
                const ok = await this._saveWork(dirtyUser[i], { quiet: true });
                if (ok) saved += 1;
                else failed += 1;
            }
            await this._loadCatalog(this._widgetType);
            this._renderSidebar();
            this._renderGrid();
            if (failed) {
                this._setStatus('Saved ' + saved + ', failed ' + failed + '.', true);
            } else {
                this._setStatus('Saved all ' + saved + ' My Preset' + (saved === 1 ? '' : 's') + '.');
            }
            this._refreshStatus();
        },

        _addVariant: async function (work) {
            const name = typeof CustomDialog !== 'undefined'
                ? await CustomDialog.prompt('Sub-preset name:', 'variant', 'Add Sub-Preset')
                : window.prompt('Sub-preset name:', 'variant');
            if (!name) return;
            const ok = WidgetPresetModel.validateDisplayName(name);
            if (!ok.ok) {
                this._setStatus(ok.error || 'Invalid name', true);
                return;
            }
            const existingNames = (work.preset.variants || []).map((v) => v.name);
            const displayName = WidgetPresetModel.isDisplayNameTaken(ok.name, existingNames)
                ? WidgetPresetModel.uniqueDisplayName(ok.name, existingNames)
                : ok.name;
            const ids = (work.preset.variants || []).map((v) => v.id);
            const id = WidgetPresetModel.uniqueSlug(WidgetPresetModel.slugify(displayName, 'variant'), ids);
            work.preset.variants.push({ id: id, name: displayName, settings: {} });
            this._markDirty(work);
            this._renderSidebar();
            this._renderGrid();
        },

        _duplicateVariant: async function (work, index) {
            const src = work.preset.variants[index];
            if (!src) return;
            const ids = work.preset.variants.map((v) => v.id);
            const names = work.preset.variants.map((v) => v.name);
            const baseName = WidgetPresetModel.uniqueDisplayName(
                String(src.name || src.id || 'variant'),
                names
            );
            const id = WidgetPresetModel.uniqueSlug(WidgetPresetModel.slugify(baseName, 'variant'), ids);
            work.preset.variants.splice(index + 1, 0, {
                id: id,
                name: baseName,
                settings: cloneJson(src.settings || {})
            });
            this._markDirty(work);
            this._renderSidebar();
            this._renderGrid();
        },

        _deleteVariant: async function (work, index) {
            if (!work.preset.variants || work.preset.variants.length <= 1) {
                this._setStatus('A preset must keep at least one sub-preset.', true);
                return;
            }
            const v = work.preset.variants[index];
            const ok = typeof CustomDialog !== 'undefined'
                ? await CustomDialog.confirm('Delete sub-preset "' + (v.name || v.id) + '"?', 'Delete Sub-Preset')
                : window.confirm('Delete sub-preset?');
            if (!ok) return;
            work.preset.variants.splice(index, 1);
            this._markDirty(work);
            this._renderSidebar();
            this._renderGrid();
        },

        _saveWork: async function (work, options) {
            options = options || {};
            if (work.kind !== 'user' || !this._canPersistPresets()) return false;
            const fullName = work.fullName || (work.widgetType + '/' + work.fileId);
            const preset = cloneJson(work.preset);
            const ok = await Dashboard.saveUserWidgetPresetFile(fullName, preset);
            if (ok) {
                work.dirty = false;
                work.preset = preset;
                if (!options.quiet) {
                    this._setStatus('Saved "' + (preset.name || fullName) + '".');
                    await this._loadCatalog(this._widgetType);
                    this._renderSidebar();
                    this._renderGrid();
                    this._refreshStatus();
                }
                return true;
            }
            return false;
        },

        _exportWork: function (work) {
            const preset = cloneJson(work.preset);
            if (typeof Dashboard !== 'undefined' && Dashboard.exportWidgetPresetFileLocal) {
                Dashboard.exportWidgetPresetFileLocal(preset, preset.name || work.name);
                this._setStatus('Exported "' + (preset.name || preset.id) + '".');
            }
        },

        _duplicateToUser: async function (work) {
            if (!this._canPersistPresets()) {
                this._setStatus('Saving to My Presets requires Homey.', true);
                return;
            }
            const name = typeof CustomDialog !== 'undefined'
                ? await CustomDialog.prompt('Save as My Preset name:', work.preset.name || work.name || 'Preset', 'Save to My Presets')
                : window.prompt('Save as My Preset name:', work.preset.name || 'Preset');
            if (!name) return;
            const ok = WidgetPresetModel.validateDisplayName(name);
            if (!ok.ok) {
                this._setStatus(ok.error || 'Invalid name', true);
                return;
            }
            let displayName = ok.name;
            if (WidgetPresetModel.isDisplayNameTaken(displayName, this._myPresetDisplayNames())) {
                displayName = WidgetPresetModel.uniqueDisplayName(displayName, this._myPresetDisplayNames());
            }
            const existingIds = this._catalog.user.map((u) => u.fileId);
            const fileId = WidgetPresetModel.uniqueSlug(WidgetPresetModel.slugify(displayName, 'preset'), existingIds);
            const preset = cloneJson(work.preset);
            preset.id = fileId;
            preset.name = displayName;
            preset.widgetType = work.widgetType;
            const fullName = work.widgetType + '/' + fileId;
            const saved = await Dashboard.saveUserWidgetPresetFile(fullName, preset);
            if (!saved) return;
            await this._loadCatalog(this._widgetType);
            const entry = this._catalog.user.find((u) => u.fullName === fullName);
            if (entry) {
                this._checkedKeys[entry.key] = true;
                this._expandedKeys[entry.key] = true;
                this._working[entry.key] = {
                    key: entry.key,
                    kind: 'user',
                    name: entry.name,
                    fileId: entry.fileId,
                    fullName: entry.fullName,
                    widgetType: entry.widgetType,
                    preset: cloneJson(preset),
                    dirty: false
                };
            }
            this._renderSidebar();
            this._renderGrid();
            if (displayName !== ok.name) {
                this._setStatus('Saved to My Presets as "' + displayName + '" because "' + ok.name + '" already exists.');
            } else {
                this._setStatus('Saved to My Presets as "' + displayName + '".');
            }
        },

        _deleteUserPreset: async function (work) {
            if (work.kind !== 'user' || !work.fullName || !this._canPersistPresets()) return;
            const deleted = await Dashboard.deleteUserWidgetPreset(work.fullName, work.preset.name || work.name);
            if (!deleted) return;
            delete this._checkedKeys[work.key];
            delete this._working[work.key];
            await this._loadCatalog(this._widgetType);
            this._renderSidebar();
            this._renderGrid();
            this._setStatus('Deleted My Preset.');
        }
    };

    window.WidgetPresetEditor = WidgetPresetEditor;

    if (typeof ToolsRegistry !== 'undefined') {
        ToolsRegistry.register({
            id: 'widget-preset-editor',
            label: 'Widget Preset Editor',
            icon: 'ph-table',
            script: 'scripts/widget-preset-editor.js',
            run: function () {
                return WidgetPresetEditor.open();
            }
        });
    }
})();
