/**
 * Theme Preset Editor (Tools): multi-column settings grid for built-in + user themes.
 * Lazy-loaded via tools-catalog. Depends: DialogHost, WidgetPresetModel, Dashboard,
 * Editor, MasterLayout, SaveFormatV2, DashboardMigrator.
 *
 * File shape: { version, name, themeKind: 'full' | 'adjustment', master, previewImage? }
 * Full themes replace the whole look on apply (resetLook); Adjustment themes only
 * overlay their stored values. Both kinds store the same sparse shape; the kind
 * only changes apply semantics. Save from the current look stores blue-outline
 * master settings only (including keep-current keys such as Background Blur).
 */
(function () {
    const HOST_ID = 'theme-preset-editor';

    /** Master schema groups that are not look and never become theme rows. */
    function skipGroupIds() {
        if (typeof Dashboard !== 'undefined' && Dashboard.THEME_SURFACE_SKIP_GROUPS) {
            return Dashboard.THEME_SURFACE_SKIP_GROUPS;
        }
        return {
            m_conn: true,
            m_editor: true,
            m_audio: true,
            m_dialog_box: true,
            m_dse: true,
            driver_specifics: true
        };
    }

    function skipFieldTypes() {
        if (typeof Dashboard !== 'undefined' && Dashboard.THEME_SURFACE_SKIP_FIELD_TYPES) {
            return Dashboard.THEME_SURFACE_SKIP_FIELD_TYPES;
        }
        return {
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
        };
    }

    function skipFieldKeys() {
        if (typeof Dashboard !== 'undefined' && Dashboard.THEME_SURFACE_SKIP_KEYS) {
            return Dashboard.THEME_SURFACE_SKIP_KEYS;
        }
        return { theme: true };
    }

    function cloneJson(value) {
        if (typeof WidgetPresetModel !== 'undefined' && typeof WidgetPresetModel.cloneJson === 'function') {
            return WidgetPresetModel.cloneJson(value);
        }
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

    function getAtPath(obj, path) {
        return WidgetPresetModel.getAtPath(obj, path);
    }

    function setAtPath(obj, path, value) {
        WidgetPresetModel.setAtPath(obj, path, value);
    }

    function hasAtPath(obj, path) {
        return WidgetPresetModel.hasAtPath(obj, path);
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

    const ThemePresetEditor = {
        _catalog: { builtin: [], user: [] },
        _checkedKeys: {},
        _working: {},
        _tree: [],
        _leaves: [],
        _filter: '',
        _rowMode: 'included',
        _selection: [],
        _anchorCell: null,
        _status: '',
        _statusWarn: false,
        _root: null,
        _currentColumns: [],
        _colorPickers: [],
        _newCounter: 0,
        _bulkLoading: false,

        open: async function () {
            if (typeof DialogHost === 'undefined') throw new Error('DialogHost unavailable');
            if (typeof WidgetPresetModel === 'undefined') throw new Error('WidgetPresetModel unavailable');

            this._catalog = { builtin: [], user: [] };
            this._checkedKeys = {};
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
            this._newCounter = 0;
            this._bulkLoading = false;

            const self = this;
            DialogHost.openFloating({
                id: HOST_ID,
                title: 'Theme Preset Editor',
                icon: 'ph-palette',
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
                    ? await CustomDialog.confirm('Discard unsaved theme edits?', 'Theme Preset Editor')
                    : window.confirm('Discard unsaved theme edits?');
                if (!ok) return false;
            }
            this._teardown();
            return true;
        },

        _teardown: function () {
            this._destroyColorPickers();
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

        /** Same gate as widget preset Save: Homey file storage + showServerButtons. */
        _canPersistThemes: function () {
            const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
            return !!(driver && driver.supportsFileStorage
                && typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ui && APP_CONFIG.ui.showServerButtons);
        },

        _buildShell: function (body) {
            body.innerHTML = '';
            const root = document.createElement('div');
            root.className = 'wpe-root';
            root.innerHTML = [
                '<div class="wpe-columns">',
                '  <div class="wpe-col-side">',
                '    <div class="wpe-toolbar-type">',
                '      <label class="wpe-label">Themes</label>',
                '      <div class="wpe-side-actions" id="tpe-new-actions"></div>',
                '    </div>',
                '    <aside class="wpe-sidebar" id="tpe-sidebar"></aside>',
                '  </div>',
                '  <div class="wpe-col-main">',
                '    <div class="wpe-toolbar-main">',
                '      <div class="wpe-toolbar-filter">',
                '        <label class="wpe-label">Filter Settings</label>',
                '        <input type="text" class="control-input wpe-filter" id="tpe-filter" placeholder="Search settings..." />',
                '      </div>',
                '      <div class="wpe-toolbar-modes" id="tpe-mode-group" role="group" aria-label="Row mode">',
                '        <button type="button" class="btn-tool wpe-mode-btn" data-tpe-mode="all">All</button>',
                '        <button type="button" class="btn-tool wpe-mode-btn is-active" data-tpe-mode="included">Included</button>',
                '        <button type="button" class="btn-tool wpe-mode-btn" data-tpe-mode="differing">Differing</button>',
                '      </div>',
                '    </div>',
                '    <section class="wpe-grid-wrap" id="tpe-grid-wrap">',
                '      <div class="wpe-empty" id="tpe-empty">Check one or more themes on the left to edit them side by side.</div>',
                '      <div class="wpe-grid-scroll" id="tpe-grid-scroll" hidden></div>',
                '      <div class="tpe-progress" id="tpe-progress" hidden>',
                '        <div class="tpe-progress-label" id="tpe-progress-label">Loading...</div>',
                '        <div class="tpe-progress-track"><div class="tpe-progress-fill" id="tpe-progress-fill"></div></div>',
                '      </div>',
                '    </section>',
                '  </div>',
                '</div>',
                '<div class="wpe-statusbar">',
                '  <div class="wpe-status" id="tpe-status" role="status"></div>',
                '  <button type="button" class="btn-tool ds-dialog-button primary" id="tpe-btn-save-all" hidden disabled title="Save all modified My Themes">',
                '    <i class="ph-bold ph-floppy-disk"></i><span>Save All</span>',
                '  </button>',
                '</div>'
            ].join('');
            body.appendChild(root);
            this._root = root;

            const filter = root.querySelector('#tpe-filter');
            if (filter) {
                filter.addEventListener('input', () => {
                    this._filter = filter.value || '';
                    this._renderGrid();
                });
            }
            root.querySelectorAll('#tpe-mode-group .wpe-mode-btn').forEach((btn) => {
                btn.addEventListener('click', () => {
                    this._rowMode = btn.getAttribute('data-tpe-mode') || 'all';
                    root.querySelectorAll('#tpe-mode-group .wpe-mode-btn').forEach((b) => {
                        b.classList.toggle('is-active', b === btn);
                    });
                    this._renderGrid();
                });
            });
            const saveAllBtn = root.querySelector('#tpe-btn-save-all');
            if (saveAllBtn) {
                const canPersist = this._canPersistThemes();
                saveAllBtn.hidden = !canPersist;
                if (canPersist) {
                    saveAllBtn.addEventListener('click', () => { void this._saveAll(); });
                }
            }

            this._buildNewActions();
            root.addEventListener('keydown', (e) => this._onKeyDown(e));
            root.tabIndex = -1;
        },

        _buildNewActions: function () {
            const wrap = this._root && this._root.querySelector('#tpe-new-actions');
            if (!wrap) return;
            wrap.innerHTML = '';
            const mkBtn = (icon, title, onClick) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn-tool btn-tool-icon-only wpe-side-action';
                btn.title = title;
                btn.setAttribute('aria-label', title);
                btn.innerHTML = '<i class="ph-bold ' + icon + '"></i>';
                btn.addEventListener('click', onClick);
                wrap.appendChild(btn);
                return btn;
            };
            mkBtn('ph-plus', 'New theme from the current look', () => { void this._newFromCurrentLook(); });
            mkBtn('ph-folder-open', 'Import a theme file', () => { void this._importFile(); });
        },

        _bootstrap: async function () {
            if (typeof WidgetScriptLoader !== 'undefined' && typeof WidgetScriptLoader.ensureTemplatesScript === 'function') {
                try { await WidgetScriptLoader.ensureTemplatesScript(); } catch (e) { /* catalog still loads user themes */ }
            }
            this._rebuildSchema();
            await this._loadCatalog();
            this._renderSidebar();
            this._renderGrid();
            this._setStatus('Check themes on the left to edit them side by side.');
        },

        /**
         * Theme rows are the effective theme surface: every global master field that
         * is not connection / editor / audio / dialog chrome. Keep-current apply keys
         * (Background Blur, widget layout defaults, etc.) stay visible so they can
         * be stored when they differ from factory.
         */
        _rebuildSchema: function () {
            this._tree = [];
            this._leaves = [];
            if (typeof Editor === 'undefined' || typeof Editor.composeDashboardGlobalMasterSchema !== 'function') {
                this._setStatus('Editor schema unavailable.', true);
                return;
            }
            const groups = Editor.composeDashboardGlobalMasterSchema();
            const skipGroups = skipGroupIds();
            const tree = [];
            (groups || []).forEach((group) => {
                if (!group || skipGroups[group.id]) return;
                const children = [];
                this._collectLeaves(group.fields || [], children);
                if (!children.length) return;
                tree.push({
                    kind: 'branch',
                    id: 'group:' + (group.id || group.title || 'settings'),
                    label: group.title || group.id,
                    icon: group.icon || 'ph-folder',
                    children: children
                });
            });
            this._tree = tree;
            const leaves = [];
            const walk = (nodes) => {
                (nodes || []).forEach((node) => {
                    if (!node) return;
                    if (node.kind === 'leaf') leaves.push(node);
                    else if (node.children) walk(node.children);
                });
            };
            walk(tree);
            this._leaves = leaves;
        },

        _collectLeaves: function (fields, out) {
            if (!Array.isArray(fields)) return;
            const skipTypes = skipFieldTypes();
            fields.forEach((field) => {
                if (!field || skipTypes[field.type]) return;
                if (field.type === 'column_split' && Array.isArray(field.columns)) {
                    field.columns.forEach((col) => {
                        const children = [];
                        this._collectLeaves((col && col.fields) || [], children);
                        if (children.length) {
                            out.push({
                                kind: 'branch',
                                id: 'nest:column:' + ((col && col.title) || 'Column'),
                                label: (col && col.title) || 'Column',
                                children: children
                            });
                        }
                    });
                    return;
                }
                if ((field.type === 'typography' || field.type === 'icon_style') && Array.isArray(field.fields)) {
                    const children = [];
                    this._collectLeaves(field.fields, children);
                    if (children.length) {
                        out.push({
                            kind: 'branch',
                            id: 'nest:' + (field.key || field.label || field.type),
                            label: field.label || field.type,
                            children: children
                        });
                    }
                    return;
                }
                const leaf = this._leafForField(field);
                if (leaf) out.push(leaf);
            });
        },

        _leafForField: function (field) {
            if (!field || !field.key) return null;
            if (skipFieldKeys()[field.key]) return null;
            if (String(field.key).indexOf('dialogBox') === 0) return null;
            let flatKey = field.key;
            let token = null;
            if (String(field.key).indexOf('themeSlot_') === 0) {
                token = String(field.key).slice('themeSlot_'.length);
                if (!token) return null;
                flatKey = 'themeColors';
            }
            return {
                kind: 'leaf',
                id: token ? ('themeColors.' + token) : flatKey,
                label: field.label || field.key,
                path: token ? ['themeColors', token] : [flatKey],
                field: field,
                flatKey: flatKey,
                token: token,
                blob: !!(typeof WidgetPresetModel !== 'undefined'
                    && WidgetPresetModel.BLOB_FIELD_TYPES[field.type])
            };
        },

        /** Expand a stored theme record to a flat runtime-shaped bag (sparse-safe read). */
        _flatFromRecord: function (record) {
            const migrated = (typeof DashboardMigrator !== 'undefined' && typeof DashboardMigrator.migrateTheme === 'function')
                ? DashboardMigrator.migrateTheme(record)
                : record;
            const master = (migrated && migrated.master) || {};
            let flat = {};
            if (typeof SaveFormatV2 !== 'undefined') {
                if (typeof SaveFormatV2.isV2Master === 'function' && SaveFormatV2.isV2Master(master)
                    && typeof SaveFormatV2.expandV2MasterToRuntime === 'function') {
                    flat = SaveFormatV2.expandV2MasterToRuntime(master) || {};
                } else if (typeof SaveFormatV2.convertMasterToV2 === 'function'
                    && typeof SaveFormatV2.expandV2MasterToRuntime === 'function') {
                    flat = SaveFormatV2.expandV2MasterToRuntime(SaveFormatV2.convertMasterToV2(master)) || {};
                }
            }
            if (!flat || typeof flat !== 'object') flat = {};
            return { flat: flat, master: master, migrated: migrated };
        },

        /** Which schema rows does this raw nested master actually store? */
        _includedFromMaster: function (master) {
            const included = {};
            if (!master || typeof master !== 'object') return included;
            this._leaves.forEach((leaf) => {
                if (leaf.token) {
                    if (master.theme && master.theme.colors
                        && Object.prototype.hasOwnProperty.call(master.theme.colors, leaf.token)) {
                        included[leaf.id] = true;
                    }
                    return;
                }
                let path = null;
                if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.lookupRuntimePath === 'function') {
                    try { path = SaveFormatV2.lookupRuntimePath(leaf.flatKey); } catch (e) { path = null; }
                }
                if (!path) {
                    if (Object.prototype.hasOwnProperty.call(master, leaf.flatKey)) included[leaf.id] = true;
                    return;
                }
                // Unmapped flat keys nest verbatim under widgetDefaults; the lookup
                // fallback heuristic may point elsewhere, so check both locations.
                if (hasAtPath(master, path)) {
                    included[leaf.id] = true;
                } else if (master.widgetDefaults
                    && Object.prototype.hasOwnProperty.call(master.widgetDefaults, leaf.flatKey)) {
                    included[leaf.id] = true;
                }
            });
            return included;
        },

        _loadCatalog: async function () {
            this._catalog = { builtin: [], user: [] };
            if (typeof Dashboard === 'undefined') return;
            const themesCatalog = (typeof PRESET_THEMES !== 'undefined' && PRESET_THEMES)
                ? PRESET_THEMES
                : ((typeof PRESET_TEMPLATES !== 'undefined' && PRESET_TEMPLATES) ? PRESET_TEMPLATES : null);
            if (themesCatalog) {
                const keys = Object.keys(themesCatalog).sort((a, b) => {
                    const na = String((themesCatalog[a] && themesCatalog[a].name) || a).toLowerCase();
                    const nb = String((themesCatalog[b] && themesCatalog[b].name) || b).toLowerCase();
                    return na.localeCompare(nb);
                });
                this._catalog.builtin = keys.map((key) => ({
                    key: 'builtin:' + key,
                    kind: 'builtin',
                    name: (themesCatalog[key] && themesCatalog[key].name) || key,
                    themeKey: key,
                    themeKind: Dashboard._themeKindOf(themesCatalog[key], true)
                }));
            }
            if (typeof Dashboard._loadUserTemplates === 'function') {
                try {
                    const names = await Dashboard._loadUserTemplates();
                    this._catalog.user = (names || []).map((t) => {
                        const nm = t && t.name ? String(t.name) : String(t || '');
                        return {
                            key: 'user:' + nm,
                            kind: 'user',
                            name: nm,
                            themeKey: 'user:' + nm,
                            themeKind: (t && t.kind) || Dashboard._themeKindOf(null, false)
                        };
                    });
                } catch (e) { /* sidebar shows built-ins only */ }
            }
        },

        _renderSidebar: function () {
            const sidebar = this._root && this._root.querySelector('#tpe-sidebar');
            if (!sidebar) return;
            sidebar.innerHTML = '';

            const canPersist = this._canPersistThemes();
            const actions = document.createElement('div');
            actions.className = 'wpe-side-actions';

            const mkAction = (icon, title, onClick) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn-tool btn-tool-icon-only wpe-side-action';
                btn.title = title;
                btn.setAttribute('aria-label', title);
                btn.innerHTML = '<i class="ph-bold ' + icon + '"></i>';
                btn.addEventListener('click', onClick);
                actions.appendChild(btn);
                return btn;
            };
            mkAction('ph-checks', 'Select all themes', () => { void this._setAllChecked(true); });
            mkAction('ph-square', 'Select none', () => { void this._setAllChecked(false); });
            let duplicateBtn = null;
            let deleteBtn = null;
            if (canPersist) {
                duplicateBtn = mkAction('ph-copy', 'Duplicate selected themes to My Themes', () => { void this._duplicateSelected(); });
                duplicateBtn.id = 'tpe-btn-duplicate-selected';
                deleteBtn = mkAction('ph-trash', 'Delete selected My Themes', () => { void this._deleteSelected(); });
                deleteBtn.id = 'tpe-btn-delete-selected';
                deleteBtn.classList.add('danger');
            }
            sidebar.appendChild(actions);

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
            renderGroup('My Themes', this._catalog.user);
            renderGroup('Built-in Themes', this._catalog.builtin);
            this._syncSidebarActionButtons();
        },

        _checkedEntries: function () {
            const all = (this._catalog.user || []).concat(this._catalog.builtin || []);
            return all.filter((entry) => !!this._checkedKeys[entry.key]);
        },

        _syncSidebarActionButtons: function () {
            const dupBtn = this._root && this._root.querySelector('#tpe-btn-duplicate-selected');
            if (dupBtn) {
                const checked = this._checkedEntries();
                const disabled = checked.length === 0;
                dupBtn.disabled = disabled;
                dupBtn.classList.toggle('is-disabled', disabled);
                dupBtn.title = disabled
                    ? 'Duplicate selected themes to My Themes (none selected)'
                    : ('Duplicate ' + checked.length + ' selected theme' + (checked.length === 1 ? '' : 's') + ' to My Themes');
            }
            const delBtn = this._root && this._root.querySelector('#tpe-btn-delete-selected');
            if (delBtn) {
                const mine = this._checkedEntries().filter((e) => e.kind === 'user' && String(e.key).indexOf('new:') !== 0);
                const disabled = mine.length === 0;
                delBtn.disabled = disabled;
                delBtn.classList.toggle('is-disabled', disabled);
                delBtn.title = disabled
                    ? 'Delete selected My Themes (none selected)'
                    : ('Delete ' + mine.length + ' selected My Theme' + (mine.length === 1 ? '' : 's'));
            }
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
                void this._toggleEntry(entry, check.checked);
            });

            const label = document.createElement('span');
            label.className = 'wpe-side-label';
            const work = this._working[entry.key];
            const labelText = (work && work.name) || entry.name || '';
            label.textContent = labelText;
            label.title = labelText;

            const badge = document.createElement('span');
            badge.className = 'wpe-side-badge';
            badge.textContent = entry.kind === 'builtin' ? 'Built-in' : 'My';

            const kindBadge = document.createElement('span');
            kindBadge.className = 'theme-explorer-kind theme-explorer-kind--' + (((work && work.themeKind) || entry.themeKind) === 'full' ? 'full' : 'adjustment');
            kindBadge.textContent = (((work && work.themeKind) || entry.themeKind) === 'full' ? 'Full' : 'Adjustment');

            row.appendChild(check);
            row.appendChild(label);
            row.appendChild(kindBadge);
            row.appendChild(badge);
            block.appendChild(row);

            if (this._checkedKeys[entry.key]) {
                const count = work ? Object.keys(work.included || {}).length : (entry.valueCount != null ? entry.valueCount : 0);
                const hint = document.createElement('div');
                hint.className = 'wpe-side-empty';
                hint.textContent = work ? (count + ' value' + (count === 1 ? '' : 's')) : 'Loading...';
                block.appendChild(hint);
            }
            return block;
        },

        _setAllChecked: async function (checked) {
            if (this._bulkLoading) return;
            const all = (this._catalog.user || []).concat(this._catalog.builtin || []);
            if (!all.length) return;

            if (!checked) {
                const dirtyCount = all.filter((e) => (
                    this._checkedKeys[e.key] && this._working[e.key] && this._working[e.key].dirty
                )).length;
                if (dirtyCount > 0) {
                    const ok = typeof CustomDialog !== 'undefined'
                        ? await CustomDialog.confirm(
                            'Uncheck all themes and discard edits to ' + dirtyCount + ' theme' + (dirtyCount === 1 ? '' : 's') + '?',
                            'Theme Preset Editor')
                        : window.confirm('Discard edits?');
                    if (!ok) return;
                }
                this._catalog.user = (this._catalog.user || []).filter((u) => u.kind !== 'new');
                all.forEach((entry) => {
                    delete this._checkedKeys[entry.key];
                    delete this._working[entry.key];
                });
                this._selection = [];
                this._anchorCell = null;
                this._renderSidebar();
                this._renderGrid();
                this._refreshStatus();
                this._setStatus('All themes cleared.');
                return;
            }

            this._bulkLoading = true;
            try {
                all.forEach((entry) => { this._checkedKeys[entry.key] = true; });
                this._renderSidebar();
                const missing = all.filter((entry) => !this._working[entry.key]);
                if (!missing.length) {
                    this._renderGrid();
                    this._refreshStatus();
                    this._setStatus('All themes selected.');
                    return;
                }
                this._showProgress('Loading themes...');
                let failed = 0;
                for (let i = 0; i < missing.length; i++) {
                    if (!this._root) return;
                    this._updateProgress(i, missing.length, 'Loading theme ' + (i + 1) + ' of ' + missing.length + '...');
                    try {
                        await this._ensureWorking(missing[i]);
                    } catch (err) {
                        failed += 1;
                        delete this._checkedKeys[missing[i].key];
                        delete this._working[missing[i].key];
                    }
                    await this._nextPaint();
                }
                if (!this._root) return;
                this._updateProgress(missing.length, missing.length, 'Building grid...');
                await this._nextPaint();
                this._hideProgress();
                this._renderSidebar();
                this._renderGrid();
                this._refreshStatus();
                if (failed > 0) {
                    this._setStatus('Selected all themes. ' + failed + ' theme' + (failed === 1 ? '' : 's') + ' failed to load.', true);
                } else {
                    this._setStatus('All themes selected.');
                }
            } finally {
                this._bulkLoading = false;
                this._hideProgress();
            }
        },

        /** Yield so the browser can paint the progress bar between bulk loads. */
        _nextPaint: function () {
            return new Promise((resolve) => {
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(() => resolve());
                } else {
                    setTimeout(resolve, 0);
                }
            });
        },

        _showProgress: function (label) {
            if (!this._root) return;
            const overlay = this._root.querySelector('#tpe-progress');
            const labelEl = this._root.querySelector('#tpe-progress-label');
            const fill = this._root.querySelector('#tpe-progress-fill');
            if (!overlay) return;
            overlay.hidden = false;
            if (labelEl) labelEl.textContent = label || 'Loading...';
            if (fill) fill.style.width = '0%';
        },

        _updateProgress: function (done, total, label) {
            if (!this._root) return;
            const labelEl = this._root.querySelector('#tpe-progress-label');
            const fill = this._root.querySelector('#tpe-progress-fill');
            if (labelEl && label) labelEl.textContent = label;
            if (fill) {
                const pct = total > 0 ? Math.max(0, Math.min(100, (done / total) * 100)) : 0;
                fill.style.width = pct.toFixed(1) + '%';
            }
        },

        _hideProgress: function () {
            if (!this._root) return;
            const overlay = this._root.querySelector('#tpe-progress');
            if (overlay) overlay.hidden = true;
        },

        _toggleEntry: async function (entry, checked) {
            if (this._bulkLoading) {
                this._setStatus('Please wait until all themes are loaded.', true);
                this._renderSidebar();
                return;
            }
            if (!checked) {
                if (this._working[entry.key] && this._working[entry.key].dirty) {
                    const ok = typeof CustomDialog !== 'undefined'
                        ? await CustomDialog.confirm('Uncheck and discard edits to "' + entry.name + '"?', 'Theme Preset Editor')
                        : window.confirm('Discard edits?');
                    if (!ok) {
                        this._renderSidebar();
                        return;
                    }
                }
                const work = this._working[entry.key];
                if (work && work.kind === 'new') {
                    this._catalog.user = (this._catalog.user || []).filter((u) => u.key !== entry.key);
                }
                delete this._checkedKeys[entry.key];
                if (!work || work.kind !== 'new') {
                    delete this._working[entry.key];
                }
                this._selection = this._selection.filter((c) => c.workingKey !== entry.key);
                this._renderSidebar();
                this._renderGrid();
                this._refreshStatus();
                return;
            }
            this._checkedKeys[entry.key] = true;
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
                this._setStatus('Failed to load theme: ' + (err && err.message ? err.message : String(err)), true);
            }
        },

        _ensureWorking: async function (entry) {
            if (this._working[entry.key]) return this._working[entry.key];
            const record = await Dashboard.fetchThemeFile(entry.themeKey);
            if (!record || typeof record !== 'object') throw new Error('Invalid theme file');
            const conv = this._flatFromRecord(record);
            const work = {
                key: entry.key,
                kind: entry.kind,
                name: entry.name,
                fileId: entry.name,
                fullName: entry.kind === 'user' ? entry.name : null,
                themeKey: entry.themeKey,
                themeKind: (conv.migrated && conv.migrated.themeKind) || record.themeKind
                    || Dashboard._themeKindOf(record, entry.kind === 'builtin'),
                flat: conv.flat,
                included: this._includedFromMaster(conv.master),
                rawDialog: conv.master && conv.master.environment && conv.master.environment.dialogBox
                    ? cloneJson(conv.master.environment.dialogBox) : null,
                rawAudio: conv.master && conv.master.environment && conv.master.environment.audio
                    ? cloneJson(conv.master.environment.audio) : null,
                previewImage: (conv.migrated && conv.migrated.previewImage) || record.previewImage || '',
                dirty: false
            };
            if (work.themeKind !== 'adjustment') work.themeKind = 'full';
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

        _leafValue: function (work, leaf) {
            if (!work || !leaf) return undefined;
            if (leaf.token) {
                const colors = work.flat && work.flat.themeColors;
                if (colors && Object.prototype.hasOwnProperty.call(colors, leaf.token)) return colors[leaf.token];
                return undefined;
            }
            return work.flat ? work.flat[leaf.flatKey] : undefined;
        },

        _ghostValue: function (leaf) {
            if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS) {
                if (leaf.token) {
                    const colors = MASTER_SETTINGS.themeColors;
                    if (colors && colors[leaf.token] !== undefined) return colors[leaf.token];
                    if (typeof MasterLayout !== 'undefined' && typeof MasterLayout.defaultThemeColors === 'function') {
                        const defaults = MasterLayout.defaultThemeColors();
                        if (defaults && defaults[leaf.token] !== undefined) return defaults[leaf.token];
                    }
                } else if (MASTER_SETTINGS[leaf.flatKey] !== undefined) {
                    return MASTER_SETTINGS[leaf.flatKey];
                }
            }
            if (leaf.field && Object.prototype.hasOwnProperty.call(leaf.field, 'default')
                && leaf.field.default !== undefined) {
                return cloneJson(leaf.field.default);
            }
            if (leaf.field && leaf.field.type === 'checkbox') return false;
            if (leaf.field && leaf.field.type === 'number') return 0;
            return '';
        },

        _renderGrid: function () {
            this._destroyColorPickers();
            const empty = this._root && this._root.querySelector('#tpe-empty');
            const scroll = this._root && this._root.querySelector('#tpe-grid-scroll');
            if (!empty || !scroll) return;

            const prevTop = scroll.scrollTop;
            const prevLeft = scroll.scrollLeft;

            const columns = this._checkedWorkingList();
            if (!columns.length) {
                empty.hidden = false;
                scroll.hidden = true;
                scroll.innerHTML = '';
                this._currentColumns = [];
                return;
            }
            empty.hidden = true;
            scroll.hidden = false;
            this._currentColumns = columns.map((work) => ({ workingKey: work.key, work: work }));

            const visibleLeaves = this._getVisibleLeaves(columns);
            const table = document.createElement('div');
            table.className = 'wpe-table';
            table.style.setProperty('--wpe-cols', String(Math.max(1, columns.length)));

            this._buildHeaderRow(columns, table);
            this._buildBody(visibleLeaves, columns, table);
            this._buildFooterRow(columns, table);

            scroll.innerHTML = '';
            scroll.appendChild(table);
            scroll.scrollTop = prevTop;
            scroll.scrollLeft = prevLeft;
            this._paintSelection();
        },

        _getVisibleLeaves: function (columns) {
            const filter = String(this._filter || '').trim().toLowerCase();
            const mode = this._rowMode || 'all';
            const out = [];
            const pushBranch = (nodes, section, sectionId) => {
                (nodes || []).forEach((node) => {
                    if (!node) return;
                    if (node.kind === 'branch') {
                        pushBranch(node.children || [], node.label || section, node.id || sectionId);
                        return;
                    }
                    if (filter) {
                        const hay = ((node.label || '') + ' ' + (node.id || '')).toLowerCase();
                        if (hay.indexOf(filter) < 0) return;
                    }
                    if (mode === 'included') {
                        const anyIncluded = columns.some((work) => !!(work.included && work.included[node.id]));
                        if (!anyIncluded) return;
                    }
                    if (mode === 'differing') {
                        const vals = columns.map((work) => (
                            (work.included && work.included[node.id]) ? this._leafValue(work, node) : undefined
                        ));
                        let differ = false;
                        for (let i = 1; i < vals.length; i++) {
                            if (!valuesEqual(vals[0], vals[i])) { differ = true; break; }
                        }
                        if (!differ) return;
                    }
                    out.push({ leaf: node, section: section || '', sectionId: sectionId || '' });
                });
            };
            pushBranch(this._tree, '', '');
            return out;
        },

        _buildHeaderRow: function (columns, table) {
            const headRow = document.createElement('div');
            headRow.className = 'wpe-row wpe-row-groups';
            const corner = document.createElement('div');
            corner.className = 'wpe-corner wpe-sticky-col';
            corner.textContent = 'Setting';
            headRow.appendChild(corner);

            columns.forEach((work) => {
                const cell = document.createElement('div');
                cell.className = 'wpe-group-head';
                cell.dataset.workingKey = work.key;

                const title = document.createElement('div');
                title.className = 'wpe-group-title';
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.className = 'control-input wpe-name-input';
                nameInput.value = work.name || '';
                nameInput.title = 'Theme name';
                nameInput.addEventListener('change', () => {
                    const ok = WidgetPresetModel.validateDisplayName(nameInput.value);
                    if (!ok.ok) {
                        this._setStatus(ok.error || 'Invalid name', true);
                        nameInput.value = work.name || '';
                        return;
                    }
                    work.name = ok.name;
                    this._syncCatalogEntryName(work);
                    this._markDirty(work);
                    this._renderSidebar();
                });
                title.appendChild(nameInput);

                const kindSelect = document.createElement('select');
                kindSelect.className = 'control-input wpe-kind-select';
                kindSelect.title = 'Full themes replace the whole look. Adjustment themes only overlay their stored values.';
                [['full', 'Full Theme'], ['adjustment', 'Adjustment Theme']].forEach(([value, text]) => {
                    const o = document.createElement('option');
                    o.value = value;
                    o.textContent = text;
                    kindSelect.appendChild(o);
                });
                kindSelect.value = work.themeKind === 'full' ? 'full' : 'adjustment';
                kindSelect.addEventListener('change', () => {
                    work.themeKind = kindSelect.value === 'full' ? 'full' : 'adjustment';
                    this._markDirty(work);
                    this._renderSidebar();
                    this._refreshStatus();
                });

                const thumb = document.createElement('img');
                thumb.className = 'wpe-theme-thumb';
                thumb.alt = '';
                if (work.previewImage) {
                    thumb.src = work.previewImage;
                    thumb.onerror = function () { thumb.remove(); };
                } else {
                    thumb.hidden = true;
                }

                const actions = document.createElement('div');
                actions.className = 'wpe-group-actions';
                const applyBtn = document.createElement('button');
                applyBtn.type = 'button';
                applyBtn.className = 'btn-tool btn-tool-icon-only';
                applyBtn.title = 'Apply this theme to the dashboard';
                applyBtn.innerHTML = '<i class="ph-bold ph-play"></i>';
                applyBtn.addEventListener('click', () => { void this._applyWork(work); });
                actions.appendChild(applyBtn);
                if (work.dirty) {
                    const dirty = document.createElement('span');
                    dirty.className = 'wpe-dirty-dot';
                    dirty.title = 'Unsaved changes';
                    actions.appendChild(dirty);
                }

                cell.appendChild(title);
                cell.appendChild(kindSelect);
                if (!thumb.hidden) cell.appendChild(thumb);
                cell.appendChild(actions);
                headRow.appendChild(cell);
            });
            table.appendChild(headRow);
        },

        /** Widget default groups store a color tag plus "Defaults" as HTML. */
        _setSectionLabel: function (el, label) {
            const text = String(label || '');
            if (text.indexOf('widget-registry-type-tag') >= 0) {
                el.innerHTML = text;
            } else {
                el.textContent = text;
            }
        },

        _buildSectionRow: function (label, sectionId, columnCount) {
            const sec = document.createElement('div');
            sec.className = 'wpe-row wpe-row-section';
            const lab = document.createElement('div');
            lab.className = 'wpe-section-label wpe-sticky-col';

            const text = document.createElement('span');
            text.className = 'wpe-section-label-text';
            this._setSectionLabel(text, label);
            lab.appendChild(text);

            if (sectionId) {
                const selectBtn = document.createElement('button');
                selectBtn.type = 'button';
                selectBtn.className = 'btn-tool btn-tool-icon-only wpe-row-select';
                selectBtn.title = 'Select all settings in this section';
                selectBtn.setAttribute('aria-label', selectBtn.title);
                selectBtn.innerHTML = '<i class="ph-bold ph-checks"></i>';
                selectBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this._setSectionIncluded(sectionId, true);
                });

                const clearBtn = document.createElement('button');
                clearBtn.type = 'button';
                clearBtn.className = 'btn-tool btn-tool-icon-only wpe-row-select';
                clearBtn.title = 'Deselect all settings in this section';
                clearBtn.setAttribute('aria-label', clearBtn.title);
                clearBtn.innerHTML = '<i class="ph-bold ph-square"></i>';
                clearBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this._setSectionIncluded(sectionId, false);
                });

                lab.appendChild(selectBtn);
                lab.appendChild(clearBtn);
            }

            sec.appendChild(lab);
            for (let i = 0; i < columnCount; i++) {
                const filler = document.createElement('div');
                filler.className = 'wpe-section-fill';
                sec.appendChild(filler);
            }
            return sec;
        },

        _findBranch: function (nodes, id) {
            const list = nodes || [];
            for (let i = 0; i < list.length; i++) {
                const node = list[i];
                if (!node) continue;
                if (node.kind === 'branch' && node.id === id) return node;
                if (node.children) {
                    const found = this._findBranch(node.children, id);
                    if (found) return found;
                }
            }
            return null;
        },

        _branchLeaves: function (branch) {
            const leaves = [];
            const walk = (nodes) => {
                (nodes || []).forEach((node) => {
                    if (!node) return;
                    if (node.kind === 'leaf') leaves.push(node);
                    else if (node.children) walk(node.children);
                });
            };
            walk(branch && branch.children);
            return leaves;
        },

        /** Include or exclude every setting in a section, across the open themes. */
        _setSectionIncluded: function (sectionId, included) {
            const columns = this._checkedWorkingList();
            if (!columns.length) {
                this._setStatus('Check a theme first.', true);
                return;
            }
            const branch = this._findBranch(this._tree, sectionId);
            const leaves = this._branchLeaves(branch);
            if (!leaves.length) return;
            columns.forEach((work) => {
                if (!work.included) work.included = {};
                leaves.forEach((leaf) => {
                    if (included) {
                        if (!work.included[leaf.id]) {
                            const ghost = this._ghostValue(leaf);
                            this._setLeafValue(work, leaf, ghost === undefined ? null : cloneJson(ghost));
                        }
                    } else if (work.included[leaf.id]) {
                        delete work.included[leaf.id];
                    }
                });
                work.dirty = true;
            });
            this._renderGrid();
            this._setStatus((included ? 'Selected' : 'Deselected') + ' ' + leaves.length
                + ' setting' + (leaves.length === 1 ? '' : 's') + ' in this section.');
        },

        _buildBody: function (visibleLeaves, columns, table) {
            let lastSection = null;
            visibleLeaves.forEach((item) => {
                const leaf = item.leaf;
                if (item.section && item.section !== lastSection) {
                    lastSection = item.section;
                    table.appendChild(this._buildSectionRow(item.section, item.sectionId, columns.length));
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

                const vals = columns.map((work) => (
                    (work.included && work.included[leaf.id]) ? this._leafValue(work, leaf) : undefined
                ));
                let differ = false;
                if (columns.length > 1) {
                    for (let i = 1; i < vals.length; i++) {
                        if (!valuesEqual(vals[0], vals[i])) { differ = true; break; }
                    }
                }
                columns.forEach((work, ci) => {
                    row.appendChild(this._buildCell(work, leaf, differ && !valuesEqual(vals[0], vals[ci])));
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

        _buildFooterRow: function (columns, table) {
            const row = document.createElement('div');
            row.className = 'wpe-row wpe-row-footer';
            const corner = document.createElement('div');
            corner.className = 'wpe-corner wpe-sticky-col';
            corner.textContent = '';
            row.appendChild(corner);

            columns.forEach((work) => {
                const cell = document.createElement('div');
                cell.className = 'wpe-group-footer';
                cell.style.gridColumn = 'span 1';

                if ((work.kind === 'user' || work.kind === 'new') && this._canPersistThemes()) {
                    const saveBtn = document.createElement('button');
                    saveBtn.type = 'button';
                    saveBtn.className = 'btn-tool ds-dialog-button primary';
                    saveBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i><span>Save</span>';
                    saveBtn.addEventListener('click', () => { void this._saveWork(work); });
                    cell.appendChild(saveBtn);
                } else if (work.kind === 'builtin' && this._canPersistThemes()) {
                    const saveMyBtn = document.createElement('button');
                    saveMyBtn.type = 'button';
                    saveMyBtn.className = 'btn-tool ds-dialog-button primary';
                    saveMyBtn.title = 'Save a copy under My Themes';
                    saveMyBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i><span>To My Themes</span>';
                    saveMyBtn.addEventListener('click', () => { void this._saveCopyToUser(work); });
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

        _buildCell: function (work, leaf, highlightDiffer) {
            const cell = document.createElement('div');
            cell.className = 'wpe-cell' + (highlightDiffer ? ' is-differ' : '');
            cell.dataset.workingKey = work.key;
            cell.dataset.pathKey = leaf.id;
            cell.dataset.fieldType = fieldTypeKey(leaf.field);
            if (this._isSelected(work.key, leaf.id)) {
                cell.classList.add('is-selected');
            }

            const included = !!(work.included && work.included[leaf.id]);
            const check = document.createElement('input');
            check.type = 'checkbox';
            check.className = 'wpe-include';
            check.checked = included;
            check.title = 'Include in theme';
            check.addEventListener('click', (e) => e.stopPropagation());
            check.addEventListener('change', () => {
                this._setInclude(work, leaf, check.checked);
            });

            const editorWrap = document.createElement('div');
            editorWrap.className = 'wpe-cell-editor' + (included ? '' : ' is-disabled');
            const value = included ? this._leafValue(work, leaf) : this._ghostValue(leaf);
            editorWrap.appendChild(this._createValueControl(work, leaf, value, included));

            cell.appendChild(check);
            cell.appendChild(editorWrap);

            cell.addEventListener('mousedown', (e) => {
                const interactive = e.target && e.target.closest
                    && e.target.closest(
                        'input, select, textarea, button, a, .ds-checkbox-row, .ds-color-picker-trigger-row'
                    );
                if (interactive) {
                    const already = this._isSelected(work.key, leaf.id);
                    if (already && this._selection.length > 1 && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                        e.stopPropagation();
                        return;
                    }
                    if (already && !e.shiftKey && !e.ctrlKey && !e.metaKey) return;
                }
                this._onCellPointer(e, work, leaf);
            });
            return cell;
        },

        _createValueControl: function (work, leaf, value, included) {
            const field = leaf.field || {};
            const type = field.type || 'text';
            const self = this;

            const applyValue = (next, opts) => {
                opts = opts || {};
                const typeKey = fieldTypeKey(leaf.field);
                let targets = self._selection.length
                    ? self._selection.filter((c) => c.fieldType === typeKey)
                    : [];
                const selfSel = { workingKey: work.key, pathKey: leaf.id, fieldType: typeKey };
                if (!targets.length) {
                    targets = [selfSel];
                } else if (!targets.some((c) => c.workingKey === selfSel.workingKey && c.pathKey === selfSel.pathKey)) {
                    targets = targets.concat([selfSel]);
                }
                targets.forEach((sel) => {
                    const targetWork = self._working[sel.workingKey];
                    if (!targetWork) return;
                    const targetLeaf = self._leaves.find((l) => l.id === sel.pathKey) || leaf;
                    if (!targetLeaf) return;
                    self._setLeafValue(targetWork, targetLeaf, cloneJson(next));
                    self._markDirty(targetWork);
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
                if (field.min !== undefined) input.min = field.min;
                if (field.max !== undefined) input.max = field.max;
                if (field.step !== undefined) input.step = field.step;
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
                const strVal = value == null ? '' : String(value);
                select.value = strVal;
                if (select.value !== strVal && strVal !== '') {
                    const o = document.createElement('option');
                    o.value = strVal;
                    o.textContent = strVal;
                    select.appendChild(o);
                    select.value = strVal;
                }
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
                        allowThemeTokens: false,
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

            if (leaf.blob) {
                const wrap = document.createElement('div');
                wrap.className = 'wpe-blob-wrap';
                const summary = document.createElement('span');
                summary.className = 'wpe-blob-summary';
                summary.textContent = formatBlobSummary(value);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn-tool';
                btn.textContent = 'Edit...';
                btn.disabled = !included;
                btn.addEventListener('click', async () => {
                    const raw = JSON.stringify(value == null ? {} : value, null, 2);
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

        _setLeafValue: function (work, leaf, value) {
            if (!work.flat || typeof work.flat !== 'object') work.flat = {};
            if (leaf.token) {
                if (!work.flat.themeColors || typeof work.flat.themeColors !== 'object') {
                    work.flat.themeColors = {};
                }
                work.flat.themeColors[leaf.token] = value;
            } else {
                work.flat[leaf.flatKey] = value;
            }
            if (!work.included) work.included = {};
            work.included[leaf.id] = true;
        },

        _setInclude: function (work, leaf, included) {
            const typeKey = fieldTypeKey(leaf.field);
            let selection = this._selection.length
                ? this._selection.filter((c) => c.fieldType === typeKey)
                : [];
            const selfSel = { workingKey: work.key, pathKey: leaf.id, fieldType: typeKey };
            if (!selection.length) {
                selection = [selfSel];
            } else if (!selection.some((c) => c.workingKey === selfSel.workingKey && c.pathKey === selfSel.pathKey)) {
                selection = selection.concat([selfSel]);
            }
            selection.forEach((sel) => {
                const targetWork = this._working[sel.workingKey];
                if (!targetWork) return;
                const targetLeaf = this._leaves.find((l) => l.id === sel.pathKey) || leaf;
                if (!targetLeaf || fieldTypeKey(targetLeaf.field) !== typeKey) return;
                if (!targetWork.included) targetWork.included = {};
                if (included) {
                    if (!targetWork.included[targetLeaf.id]) {
                        const ghost = this._ghostValue(targetLeaf);
                        this._setLeafValue(targetWork, targetLeaf, ghost === undefined ? null : cloneJson(ghost));
                    }
                } else {
                    delete targetWork.included[targetLeaf.id];
                }
                this._markDirty(targetWork);
            });
            if (selection.length > 1) {
                this._setStatus((included ? 'Included' : 'Excluded') + ' ' + selection.length + ' cells.');
            }
            this._renderGrid();
            this._refreshStatus();
        },

        _isSelected: function (workingKey, pathKey) {
            return this._selection.some((c) => c.workingKey === workingKey && c.pathKey === pathKey);
        },

        _onCellPointer: function (e, work, leaf) {
            if (e.button !== 0) return;
            const type = fieldTypeKey(leaf.field);
            const cell = { workingKey: work.key, pathKey: leaf.id, fieldType: type };

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
                const columns = this._currentColumns.map((c) => c.workingKey);
                const aIdx = columns.indexOf(this._anchorCell.workingKey);
                const bIdx = columns.indexOf(cell.workingKey);
                if (aIdx < 0 || bIdx < 0) return;
                const lo = Math.min(aIdx, bIdx);
                const hi = Math.max(aIdx, bIdx);
                this._selection = columns.slice(lo, hi + 1).map((workingKey) => ({
                    workingKey: workingKey,
                    pathKey: leaf.id,
                    fieldType: type
                }));
                this._setStatus(this._selection.length + ' cells selected (' + type + '). Toggle Include or edit any selected cell to apply to all.');
                this._paintSelection();
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                if (this._selection.length && this._selection[0].fieldType !== type) {
                    this._selection = [cell];
                    this._anchorCell = cell;
                    this._setStatus('Selection cleared: different value type. Selected 1 ' + type + ' cell.');
                } else {
                    const idx = this._selection.findIndex((c) => c.workingKey === cell.workingKey && c.pathKey === cell.pathKey);
                    if (idx >= 0) this._selection.splice(idx, 1);
                    else this._selection.push(cell);
                    this._anchorCell = cell;
                    this._setStatus(this._selection.length + ' cells selected (' + type + ').'
                        + (this._selection.length > 1 ? ' Toggle Include or edit any selected cell to apply to all.' : ''));
                }
                this._paintSelection();
                return;
            }

            this._selection = [cell];
            this._anchorCell = cell;
            this._paintSelection();
            this._refreshStatus();
        },

        _selectEntireRow: function (leaf, columns) {
            if (!leaf || !columns || !columns.length) return;
            const allSelected = columns.every((work) => this._isSelected(work.key, leaf.id));
            if (allSelected) {
                const keys = columns.map((work) => work.key);
                this._selection = this._selection.filter((sel) => (
                    sel.pathKey !== leaf.id || keys.indexOf(sel.workingKey) < 0
                ));
                this._anchorCell = this._selection[0] || null;
                this._paintSelection();
                this._setStatus(this._selection.length ? (this._selection.length + ' cells still selected.') : 'Row deselected.');
                return;
            }
            const type = fieldTypeKey(leaf.field);
            this._selection = columns.map((work) => ({ workingKey: work.key, pathKey: leaf.id, fieldType: type }));
            this._anchorCell = this._selection[0] || null;
            this._paintSelection();
            this._setStatus(this._selection.length + ' cells selected (' + type + '). Toggle Include or edit any selected cell to apply to all.');
            if (this._root && typeof this._root.focus === 'function') {
                try { this._root.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
            }
        },

        _paintSelection: function () {
            if (!this._root) return;
            this._root.querySelectorAll('.wpe-cell.is-selected').forEach((el) => el.classList.remove('is-selected'));
            this._selection.forEach((sel) => {
                const el = this._root.querySelector(
                    '.wpe-cell[data-working-key="' + this._cssEscape(sel.workingKey) + '"][data-path-key="' + this._cssEscape(sel.pathKey) + '"]'
                );
                if (el) el.classList.add('is-selected');
            });
            const columns = this._currentColumns || [];
            this._root.querySelectorAll('.wpe-row-select').forEach((btn) => {
                const pathKey = btn.dataset.pathKey || '';
                let active = pathKey !== '' && columns.length > 0;
                if (active) {
                    for (let i = 0; i < columns.length; i++) {
                        if (!this._isSelected(columns[i].workingKey, pathKey)) { active = false; break; }
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
                    if (!work || !work.included) return;
                    delete work.included[sel.pathKey];
                    this._markDirty(work);
                });
                this._renderGrid();
                this._setStatus('Excluded ' + this._selection.length + ' cells from themes.');
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
                const leaf = this._leaves.find((l) => l.id === first.pathKey);
                if (!work || !leaf) return;
                const currentlyOn = !!(work.included && work.included[leaf.id]);
                this._setInclude(work, leaf, !currentlyOn);
            }
        },

        _cssEscape: function (value) {
            const s = String(value == null ? '' : value);
            if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(s);
            return s.replace(/["\\]/g, '\\$&');
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

        _markDirty: function (work) {
            if (!work) return;
            work.dirty = true;
            this._refreshStatus();
        },

        _setStatus: function (msg, warn) {
            this._status = String(msg || '');
            this._statusWarn = !!warn;
            const el = this._root && this._root.querySelector('#tpe-status');
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
                if (work && work.dirty && (work.kind === 'user' || work.kind === 'new')
                    && this._checkedKeys[work.key]) out.push(work);
            }
            return out;
        },

        /** Move a work record to a new map key after save-as / rename. */
        _rekeyWork: function (work, newKey) {
            const oldKey = work.key;
            if (oldKey === newKey) return;
            delete this._working[oldKey];
            delete this._checkedKeys[oldKey];
            work.key = newKey;
            this._working[newKey] = work;
            this._checkedKeys[newKey] = true;
            this._selection.forEach((sel) => {
                if (sel.workingKey === oldKey) sel.workingKey = newKey;
            });
            if (this._anchorCell && this._anchorCell.workingKey === oldKey) {
                this._anchorCell.workingKey = newKey;
            }
        },

        _syncSaveAllButton: function () {
            const btn = this._root && this._root.querySelector('#tpe-btn-save-all');
            if (!btn) return;
            if (!this._canPersistThemes()) {
                btn.hidden = true;
                return;
            }
            btn.hidden = false;
            const dirtyUser = this._dirtyUserWorks();
            btn.disabled = dirtyUser.length === 0;
            btn.classList.toggle('is-disabled', dirtyUser.length === 0);
            btn.setAttribute('aria-disabled', dirtyUser.length === 0 ? 'true' : 'false');
            btn.title = dirtyUser.length
                ? ('Save ' + dirtyUser.length + ' modified My Theme' + (dirtyUser.length === 1 ? '' : 's'))
                : 'No modified My Themes to save';
        },

        _refreshStatus: function () {
            const dirtyCount = Object.keys(this._working).filter((k) => this._working[k].dirty).length;
            const dirtyUser = this._dirtyUserWorks().length;
            const sel = this._selection.length;
            const canPersist = this._canPersistThemes();
            const parts = [];
            if (sel) {
                const type = this._selection[0] ? this._selection[0].fieldType : '';
                parts.push(sel + ' cell' + (sel === 1 ? '' : 's') + ' selected' + (type ? (' (' + type + ')') : ''));
                if (sel > 1) parts.push('edit Include or a value to apply to all');
            }
            if (dirtyCount) parts.push(dirtyCount + ' theme' + (dirtyCount === 1 ? '' : 's') + ' modified');
            if (canPersist && dirtyUser) parts.push(dirtyUser + ' can Save All');
            const factoryDirty = Object.keys(this._working).some((k) => this._working[k].dirty && this._working[k].kind === 'builtin');
            if (factoryDirty) {
                parts.push(canPersist
                    ? 'Built-in edits need Export or Save to My Themes'
                    : 'Built-in edits need Export (My Themes require Homey)');
            }
            this._setStatus(parts.length ? parts.join(' · ') : 'Ready.');
        },

        _syncCatalogEntryName: function (work) {
            if (!work || !work.key || !work.name) return;
            const all = (this._catalog.user || []).concat(this._catalog.builtin || []);
            const entry = all.find((e) => e.key === work.key);
            if (entry) entry.name = work.name;
        },

        _myThemeNames: function (excludeKey) {
            const names = [];
            (this._catalog.user || []).forEach((entry) => {
                if (excludeKey && entry.key === excludeKey) return;
                const work = this._working[entry.key];
                const label = (work && work.name) || entry.name;
                if (label) names.push(label);
            });
            return names;
        },

        /**
         * Sparse nested master for save/apply: only included rows. Dialog chrome
         * and audio maps the editor never shows are carried over untouched from
         * the source file.
         */
        _buildNestedMaster: function (work) {
            const bag = {};
            this._leaves.forEach((leaf) => {
                if (!work.included || !work.included[leaf.id]) return;
                const value = this._leafValue(work, leaf);
                if (value === undefined) return;
                if (leaf.token) {
                    if (!bag.themeColors || typeof bag.themeColors !== 'object') bag.themeColors = {};
                    bag.themeColors[leaf.token] = cloneJson(value);
                } else {
                    bag[leaf.flatKey] = cloneJson(value);
                }
            });
            const nested = (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.nestRuntimeBagToV2Master === 'function')
                ? SaveFormatV2.nestRuntimeBagToV2Master(bag, { omitResponsiveIfNotMode: true })
                : { environment: {}, typography: {}, container: {}, theme: { colors: {} }, widgetDefaults: {} };
            const finalized = (typeof Dashboard !== 'undefined' && typeof Dashboard._finalizeThemeNestedMaster === 'function')
                ? Dashboard._finalizeThemeNestedMaster(nested)
                : nested;
            if (work.rawDialog) {
                if (!finalized.environment || typeof finalized.environment !== 'object') finalized.environment = {};
                finalized.environment.dialogBox = cloneJson(work.rawDialog);
            }
            if (work.rawAudio) {
                if (!finalized.environment || typeof finalized.environment !== 'object') finalized.environment = {};
                finalized.environment.audio = cloneJson(work.rawAudio);
            }
            return finalized;
        },

        _buildFileData: function (work, name, themeKind, previewImage) {
            const data = {
                version: (typeof window !== 'undefined' && window.DASHBOARD_VERSION) ? String(window.DASHBOARD_VERSION) : '2.0.0',
                name: name,
                themeKind: themeKind === 'adjustment' ? 'adjustment' : 'full',
                master: this._buildNestedMaster(work)
            };
            const preview = String(previewImage != null ? previewImage : (work.previewImage || '')).trim();
            if (preview) data.previewImage = preview;
            return data;
        },

        /** Name + kind + preview dialog used for Save to My Themes, New, Duplicate, Import. */
        _promptSaveAs: async function (defaults) {
            defaults = defaults || {};
            if (typeof Dashboard === 'undefined' || typeof Dashboard.promptThemeSaveAs !== 'function') {
                const name = window.prompt('Save theme as:', defaults.name || 'Theme');
                if (!name) return null;
                return { name: String(name).trim(), themeKind: defaults.themeKind || 'full', previewImage: defaults.previewImage || '', exists: false };
            }
            const existing = (this._catalog.user || []).map((entry) => {
                const work = this._working[entry.key];
                return {
                    name: (work && work.name) || entry.name || '',
                    kind: (work && work.themeKind) || entry.themeKind || 'full'
                };
            }).filter((item) => !!item.name);
            return Dashboard.promptThemeSaveAs({
                title: 'Save Theme',
                okLabel: 'Save',
                name: defaults.name || '',
                themeKind: defaults.themeKind || 'full',
                previewImage: defaults.previewImage || '',
                existing: existing,
                forbidExisting: true
            });
        },

        _saveAll: async function () {
            if (!this._canPersistThemes()) return;
            const dirtyUser = this._dirtyUserWorks();
            if (!dirtyUser.length) {
                this._setStatus('No modified My Themes to save.');
                return;
            }
            let saved = 0;
            let failed = 0;
            for (let i = 0; i < dirtyUser.length; i++) {
                const ok = await this._saveWork(dirtyUser[i], { quiet: true });
                if (ok) saved += 1;
                else failed += 1;
            }
            await this._loadCatalog();
            this._renderSidebar();
            this._renderGrid();
            if (failed) {
                this._setStatus('Saved ' + saved + ', failed ' + failed + '.', true);
            } else {
                this._setStatus('Saved all ' + saved + ' My Theme' + (saved === 1 ? '' : 's') + '.');
            }
            this._refreshStatus();
        },

        /** Save a My Theme (or a New theme, which prompts for name + kind first). */
        _saveWork: async function (work, options) {
            options = options || {};
            if (!this._canPersistThemes()) {
                this._setStatus('Saving themes requires Homey.', true);
                return false;
            }
            if (work.kind !== 'user' && work.kind !== 'new') return false;

            let targetName = work.kind === 'user' ? work.fullName : null;
            if (work.kind === 'new' || !targetName) {
                const picked = await this._promptSaveAs({
                    name: work.name,
                    themeKind: work.themeKind,
                    previewImage: work.previewImage
                });
                if (!picked) return false;
                targetName = picked.name;
                work.name = picked.name;
                work.themeKind = picked.themeKind;
                work.previewImage = picked.previewImage || '';
            } else if (work.name !== targetName) {
                const others = this._myThemeNames(work.key);
                if (WidgetPresetModel.isDisplayNameTaken(work.name, others)) {
                    this._setStatus('A theme named "' + work.name + '" already exists.', true);
                    return false;
                }
                const renamed = await this._renameUserFile(work, targetName, work.name);
                if (!renamed) return false;
                targetName = work.name;
            }

            const data = this._buildFileData(work, targetName, work.themeKind, work.previewImage);
            const ok = await Dashboard.saveUserThemeFile(targetName, data);
            if (!ok) return false;
            work.dirty = false;
            work.kind = 'user';
            work.fullName = targetName;
            work.fileId = targetName;
            work.themeKey = 'user:' + targetName;
            this._rekeyWork(work, 'user:' + targetName);
            if (!options.quiet) {
                await this._loadCatalog();
                this._renderSidebar();
                this._renderGrid();
                this._setStatus('Saved "' + targetName + '".');
                this._refreshStatus();
            } else {
                await this._loadCatalog();
            }
            return true;
        },

        _renameUserFile: async function (work, oldName, newName) {
            const data = this._buildFileData(work, newName, work.themeKind, work.previewImage);
            const ok = await Dashboard.saveUserThemeFile(newName, data);
            if (!ok) return false;
            await Dashboard.deleteUserThemeFile(oldName);
            work.fullName = newName;
            work.fileId = newName;
            work.themeKey = 'user:' + newName;
            this._rekeyWork(work, 'user:' + newName);
            return true;
        },

        _saveCopyToUser: async function (work) {
            if (!this._canPersistThemes()) {
                this._setStatus('Saving to My Themes requires Homey.', true);
                return;
            }
            const picked = await this._promptSaveAs({
                name: work.name,
                themeKind: work.themeKind,
                previewImage: work.previewImage
            });
            if (!picked) return;
            const data = this._buildFileData(work, picked.name, picked.themeKind, picked.previewImage);
            const ok = await Dashboard.saveUserThemeFile(picked.name, data);
            if (!ok) return;
            await this._loadCatalog();
            const entry = this._catalog.user.find((u) => u.name === picked.name);
            if (entry) {
                this._checkedKeys[entry.key] = true;
                this._working[entry.key] = {
                    key: entry.key,
                    kind: 'user',
                    name: entry.name,
                    fileId: entry.name,
                    fullName: entry.name,
                    themeKey: entry.themeKey,
                    themeKind: picked.themeKind,
                    flat: cloneJson(work.flat),
                    included: cloneJson(work.included),
                    rawDialog: cloneJson(work.rawDialog),
                    rawAudio: cloneJson(work.rawAudio),
                    previewImage: picked.previewImage || '',
                    dirty: false
                };
            }
            this._renderSidebar();
            this._renderGrid();
            this._setStatus('Saved to My Themes as "' + picked.name + '".');
        },

        _duplicateSelected: async function () {
            if (!this._canPersistThemes()) {
                this._setStatus('Duplicating themes requires Homey.', true);
                return;
            }
            const checked = this._checkedEntries();
            if (!checked.length) {
                this._setStatus('No themes selected to duplicate.');
                return;
            }
            const names = this._myThemeNames();
            let created = 0;
            let failed = 0;
            const createdNames = [];
            for (let i = 0; i < checked.length; i++) {
                try {
                    const work = await this._ensureWorking(checked[i]);
                    const displayName = WidgetPresetModel.uniqueDisplayName(work.name || 'Theme', names);
                    names.push(displayName);
                    const data = this._buildFileData(work, displayName, work.themeKind, work.previewImage);
                    const ok = await Dashboard.saveUserThemeFile(displayName, data);
                    if (ok) {
                        created += 1;
                        createdNames.push(displayName);
                    } else {
                        failed += 1;
                    }
                } catch (err) {
                    failed += 1;
                }
            }
            await this._loadCatalog();
            createdNames.forEach((displayName) => {
                const entry = this._catalog.user.find((u) => u.name === displayName);
                if (entry) this._checkedKeys[entry.key] = true;
            });
            this._renderSidebar();
            this._renderGrid();
            if (!created) this._setStatus('Could not duplicate the selected themes.', true);
            else if (failed) this._setStatus('Duplicated ' + created + ', failed ' + failed + '.', true);
            else this._setStatus(created === 1 ? 'Duplicated to My Themes.' : ('Duplicated ' + created + ' themes.'));
        },

        _deleteSelected: async function () {
            if (!this._canPersistThemes()) return;
            const mine = this._checkedEntries().filter((e) => e.kind === 'user' && String(e.key).indexOf('new:') !== 0);
            const fresh = this._checkedEntries().filter((e) => String(e.key).indexOf('new:') === 0);
            fresh.forEach((e) => {
                delete this._checkedKeys[e.key];
                delete this._working[e.key];
            });
            if (!mine.length) {
                if (fresh.length) {
                    this._renderSidebar();
                    this._renderGrid();
                    this._setStatus('Discarded unsaved new themes.');
                } else {
                    this._setStatus('No My Themes selected to delete.');
                }
                return;
            }
            const msg = mine.length === 1
                ? ('Delete "' + mine[0].name + '" permanently?')
                : ('Delete ' + mine.length + ' My Themes permanently?');
            const ok = typeof CustomDialog !== 'undefined'
                ? await CustomDialog.confirm(msg, mine.length === 1 ? 'Delete Theme' : 'Delete Themes')
                : window.confirm(msg);
            if (!ok) return;
            let deleted = 0;
            let failed = 0;
            for (let i = 0; i < mine.length; i++) {
                const done = await Dashboard.deleteUserThemeFile(mine[i].name);
                if (done) {
                    deleted += 1;
                    delete this._checkedKeys[mine[i].key];
                    delete this._working[mine[i].key];
                } else {
                    failed += 1;
                }
            }
            await this._loadCatalog();
            this._renderSidebar();
            this._renderGrid();
            if (failed) this._setStatus('Deleted ' + deleted + ', failed ' + failed + '.', true);
            else this._setStatus('Deleted ' + deleted + ' My Theme' + (deleted === 1 ? '' : 's') + '.');
        },

        _newFromCurrentLook: async function () {
            this._newCounter += 1;
            const name = 'Untitled ' + this._newCounter;
            const key = 'new:' + this._newCounter + ':' + Date.now();
            const flat = {};
            const included = {};
            if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS) {
                this._leaves.forEach((leaf) => {
                    const value = this._leafValue({ flat: MASTER_SETTINGS }, leaf);
                    if (value === undefined) return;
                    const isSet = (typeof Dashboard !== 'undefined' && typeof Dashboard._isThemeSurfaceFieldSet === 'function')
                        ? Dashboard._isThemeSurfaceFieldSet(leaf.field)
                        : (typeof Editor !== 'undefined' && typeof Editor.isGlobalMasterFieldSet === 'function'
                            ? Editor.isGlobalMasterFieldSet(leaf.field, MASTER_SETTINGS)
                            : true);
                    if (!isSet) return;
                    if (leaf.token) {
                        if (!flat.themeColors || typeof flat.themeColors !== 'object') flat.themeColors = {};
                        flat.themeColors[leaf.token] = cloneJson(value);
                    } else {
                        flat[leaf.flatKey] = cloneJson(value);
                    }
                    included[leaf.id] = true;
                });
            }
            const work = {
                key: key,
                kind: 'new',
                name: name,
                fileId: null,
                fullName: null,
                themeKey: null,
                themeKind: 'full',
                flat: flat,
                included: included,
                rawDialog: null,
                previewImage: '',
                dirty: true
            };
            this._catalog.user.unshift({ key: key, kind: 'new', name: name, themeKey: null, themeKind: 'full' });
            this._checkedKeys[key] = true;
            this._working[key] = work;
            this._renderSidebar();
            this._renderGrid();
            this._setStatus('New theme "' + name + '" captures changed settings (blue outline). Include more rows if needed, then Save.');
        },

        _importFile: async function () {
            const picker = document.createElement('input');
            picker.type = 'file';
            picker.accept = '.json,application/json';
            const chosen = await new Promise((resolve) => {
                picker.addEventListener('change', () => resolve(picker.files && picker.files[0] ? picker.files[0] : null), { once: true });
                picker.click();
            });
            if (!chosen) return;
            let parsed = null;
            try {
                parsed = JSON.parse(await chosen.text());
            } catch (err) {
                this._setStatus('Import failed: file is not valid JSON.', true);
                return;
            }
            if (!parsed || typeof parsed !== 'object' || !(parsed.master || parsed.settings)) {
                this._setStatus('Import failed: not a theme file (missing master or settings).', true);
                return;
            }
            const conv = this._flatFromRecord(parsed);
            this._newCounter += 1;
            const fallbackName = String(chosen.name || 'Imported').replace(/\.json$/i, '');
            const name = (conv.migrated && conv.migrated.name) || parsed.name || fallbackName || ('Imported ' + this._newCounter);
            const kind = (conv.migrated && conv.migrated.themeKind) || parsed.themeKind || 'full';
            const key = 'new:import:' + Date.now();
            const work = {
                key: key,
                kind: 'new',
                name: name,
                fileId: null,
                fullName: null,
                themeKey: null,
                themeKind: kind === 'adjustment' ? 'adjustment' : 'full',
                flat: conv.flat,
                included: this._includedFromMaster(conv.master),
                rawDialog: conv.master && conv.master.environment && conv.master.environment.dialogBox
                    ? cloneJson(conv.master.environment.dialogBox) : null,
                rawAudio: conv.master && conv.master.environment && conv.master.environment.audio
                    ? cloneJson(conv.master.environment.audio) : null,
                previewImage: (conv.migrated && conv.migrated.previewImage) || parsed.previewImage || '',
                dirty: true
            };
            this._catalog.user.unshift({ key: key, kind: 'new', name: name, themeKey: null, themeKind: work.themeKind });
            this._checkedKeys[key] = true;
            this._working[key] = work;
            this._renderSidebar();
            this._renderGrid();
            this._setStatus('Imported "' + name + '". Review the values, then Save.');
        },

        _exportWork: function (work) {
            const data = this._buildFileData(work, work.name || 'theme', work.themeKind, work.previewImage);
            if (typeof Dashboard !== 'undefined' && Dashboard.exportThemeFileLocal) {
                Dashboard.exportThemeFileLocal(data, work.name);
                this._setStatus('Exported "' + (work.name || 'theme') + '".');
            }
        },

        _applyWork: async function (work) {
            if (typeof Dashboard === 'undefined' || typeof Dashboard._applyThemeSettings !== 'function') return;
            const nested = this._buildNestedMaster(work);
            Dashboard._applyThemeSettings(nested, { resetLook: work.themeKind === 'full' });
            if (typeof Dashboard.markUnsaved === 'function') Dashboard.markUnsaved();
            if (typeof Editor !== 'undefined' && Editor.currentId === 'GLOBAL_SETTINGS'
                && typeof Editor.loadWidget === 'function') {
                Editor.loadWidget('GLOBAL_SETTINGS');
            }
            this._setStatus('Applied "' + (work.name || 'theme') + '" (' + (work.themeKind === 'full' ? 'Full' : 'Adjustment') + ').');
        }
    };

    window.ThemePresetEditor = ThemePresetEditor;

    if (typeof ToolsRegistry !== 'undefined') {
        ToolsRegistry.register({
            id: 'theme-preset-editor',
            label: 'Theme Preset Editor',
            icon: 'ph-palette',
            script: 'scripts/theme-preset-editor.js',
            run: function () {
                return ThemePresetEditor.open();
            }
        });
    }
})();
