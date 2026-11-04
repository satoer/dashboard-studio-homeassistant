(function () {
    const ShareMenu = {
        toggle: function () {
            const dd = document.getElementById('share-dropdown');
            const btn = document.getElementById('btn-share');
            if (!dd || !btn) return;
            if (dd.classList.contains('open')) {
                ShareMenu.close();
                return;
            }
            if (typeof Editor !== 'undefined' && Editor._closeAllDsFixedDropdowns) {
                Editor._closeAllDsFixedDropdowns(dd);
            }
            dd._dsSelectAnchor = btn.parentElement;
            if (typeof Editor !== 'undefined' && Editor._openDsFixedDropdown) {
                Editor._openDsFixedDropdown(dd, btn, true);
            }
            dd.classList.add('open');
            if (typeof Editor !== 'undefined' && Editor._bindDsFixedDropdownOutsideClick) {
                Editor._bindDsFixedDropdownOutsideClick();
            }
        },
        close: function () {
            const dd = document.getElementById('share-dropdown');
            if (dd) {
                dd.classList.remove('open');
                if (typeof Editor !== 'undefined' && Editor._closeDsFixedDropdown) {
                    Editor._closeDsFixedDropdown(dd);
                }
            }
        }
    };
    window.ShareMenu = ShareMenu;

    function syncHomeyMediaButtons() {
        const platformDriver = typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS ? String(MASTER_SETTINGS.dataDriver || '').toLowerCase() : '';
        const activeDriver = typeof DataDriverRegistry !== 'undefined' && DataDriverRegistry.getType ? String(DataDriverRegistry.getType() || '').toLowerCase() : '';
        const platformHomey = platformDriver === 'homey' || platformDriver === 'homeassistant';
        const activeHomey = activeDriver === 'homey' || activeDriver === 'homeassistant';
        const show = (platformHomey || activeHomey) ? 'flex' : 'none';
        const galleryBtn = document.getElementById('btn-gallery');
        const audioBtn = document.getElementById('btn-audio-gallery');
        if (galleryBtn) galleryBtn.style.display = show;
        if (audioBtn) audioBtn.style.display = show;
        const serverGroup = document.getElementById('btn-group-dashboard-server');
        if (serverGroup) {
            const isHa = platformDriver === 'homeassistant' || activeDriver === 'homeassistant';
            const btns = serverGroup.querySelectorAll('button');
            if (btns && btns.length >= 2) {
                const targetName = isHa ? 'Home Assistant' : 'Homey';
                const shortName = isHa ? 'Home Assistant' : 'Homey';
                btns[0].title = 'Save the current dashboard to ' + targetName;
                btns[0].innerHTML = '<i class="ph-bold ph-cloud-arrow-up"></i> Save to ' + shortName;
                btns[1].title = 'Load a dashboard from ' + targetName;
                btns[1].innerHTML = '<i class="ph-bold ph-cloud-arrow-down"></i> Load from ' + shortName;
            }
        }
        if (typeof QuickToolbar !== 'undefined' && typeof QuickToolbar.refresh === 'function') {
            QuickToolbar.refresh();
        }
    }
    window.syncHomeyMediaButtons = syncHomeyMediaButtons;
    window.syncHomeyGalleryButton = syncHomeyMediaButtons;
    // WorkerTimer: a native setInterval gets clamped by browser throttling (background
    // tab, cold-start) so the gallery buttons could lag the active driver; the worker
    // timer keeps them ticking at 1 Hz regardless.
    if (typeof WorkerTimer !== 'undefined' && WorkerTimer && typeof WorkerTimer.setInterval === 'function') {
        WorkerTimer.setInterval(syncHomeyMediaButtons, 1000);
    } else {
        setInterval(syncHomeyMediaButtons, 1000);
    }
    syncHomeyMediaButtons();

    function keepDashboardFileHistoryEnabled() {
        return window.APP_CONFIG && window.APP_CONFIG.defaults && window.APP_CONFIG.defaults.keepDashboardFileHistory !== false;
    }

    function compareFileVersionToApp(fileVersion) {
        const appVer = String(window.DASHBOARD_VERSION || '0.0.0');
        const fVer = String(fileVersion || '1.0.0');
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._compareVersions === 'function') {
            return Dashboard._compareVersions(fVer, appVer);
        }
        if (typeof DashboardMigrator !== 'undefined' && typeof DashboardMigrator.compareVersions === 'function') {
            return DashboardMigrator.compareVersions(fVer, appVer);
        }
        return 0;
    }

    function applyVersionTagClasses(el, fileVersion) {
        if (!el) return;
        el.classList.add('header-tag', 'file-list-version-tag');
        el.textContent = 'v' + String(fileVersion || '1.0.0');
        el.classList.remove('header-tag--older-format');
        if (compareFileVersionToApp(fileVersion) < 0) {
            el.classList.add('header-tag--older-format');
        }
    }

    const ServerFileManager = {
        currentType: null,
        currentAction: null,
        currentWidgetType: null,
        knownFiles: [],
        cachedLoadFiles: [],

        _typeLabel: function (type) {
            if (type === 'dashboards') return 'Dashboard';
            if (type === 'widgetpresets') return 'Widget Preset';
            return 'Theme';
        },

        _filterFilesForCurrentContext: function (files) {
            if (!Array.isArray(files)) return [];
            if (this.currentType !== 'widgetpresets' || !this.currentWidgetType) return files;
            const widgetType = this.currentWidgetType;
            return files.filter(function (f) {
                const type = f.widgetType || String(f.name || '').split('/')[0];
                return String(type) === String(widgetType);
            }).map(function (f) {
                const presetName = f.fileId || f.presetName || String(f.name || '').split('/').slice(1).join('/');
                const label = f.displayName || presetName || f.name;
                return Object.assign({}, f, {
                    name: label,
                    listName: label,
                    fullName: f.name,
                    fileId: presetName
                });
            });
        },

        open: async function (type, action, options) {
            options = options || {};
            if (action === 'load' && !options.skipUnsavedCheck && typeof Dashboard !== 'undefined' && Dashboard.hasUnsavedChanges) {
                const confirmed = await CustomDialog.confirm("You have unsaved changes. Loading a new file will discard them.\n\nContinue?", "Unsaved Changes");
                if (!confirmed) return;
            }

            this.currentType = type;
            this.currentAction = action;
            this.currentWidgetType = null;

            if (type === 'templates' && action === 'load') {
                await CustomDialog.alert('Themes are loaded from the Theme dropdown.', 'Info');
                return;
            }

            if (type === 'widgetpresets') {
                if (action !== 'save') {
                    await CustomDialog.alert('Widget presets are loaded from the Presets dropdown.', 'Info');
                    return;
                }
                const widget = (typeof Dashboard !== 'undefined' && typeof Dashboard._getSelectedWidgetForPreset === 'function')
                    ? Dashboard._getSelectedWidgetForPreset()
                    : null;
                const widgetType = (typeof Dashboard !== 'undefined' && typeof Dashboard._getWidgetTypeByInstance === 'function')
                    ? Dashboard._getWidgetTypeByInstance(widget)
                    : null;
                if (!widget || !widgetType) {
                    await CustomDialog.alert('Select a widget first.', 'Save Widget Preset');
                    return;
                }
                this.currentWidgetType = widgetType;
            }

            const title = `${action === 'save' ? 'Save' : 'Load'} ${this._typeLabel(type)}`;
            document.getElementById('modal-title').innerText = title;

            document.getElementById('modal-save-content').style.display = action === 'save' ? 'block' : 'none';
            document.getElementById('modal-load-content').style.display = action === 'load' ? 'block' : 'none';
            const saveHint = document.getElementById('save-filename-hint');
            if (saveHint) {
                saveHint.style.display = (action === 'save' && type === 'dashboards') ? '' : 'none';
            }
            this._syncTemplatePreviewField(action === 'save' && type === 'templates');
            document.getElementById('file-modal').classList.add('show');

            const loadToolbar = document.getElementById('file-load-toolbar');
            if (loadToolbar) {
                loadToolbar.style.display = action === 'load' ? 'block' : 'none';
            }
            const filterInput = document.getElementById('file-load-filter');
            if (filterInput && action === 'load') {
                filterInput.value = '';
            }

            const provider = DataDriverRegistry.get();
            if (!provider || !provider.getStorageProvider()) {
                const isHa = (typeof DataDriverRegistry !== 'undefined' && DataDriverRegistry.getType && DataDriverRegistry.getType() === 'homeassistant')
                    || (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && MASTER_SETTINGS.dataDriver === 'homeassistant');
                await CustomDialog.alert(isHa ? "Not connected to Home Assistant" : "Not connected to Homey", "Error");
                return;
            }

            document.getElementById('file-list').innerHTML = '<div class="p-4 text-center ds-file-list-empty text-xs">Loading...</div>';
            document.getElementById('save-file-list').innerHTML = '<div class="p-2 text-center ds-file-list-empty text-xs">Loading...</div>';

            try {
                const files = this._filterFilesForCurrentContext(await provider.getStorageProvider().list(type));
                this.knownFiles = files.map(function (f) { return f.name; });
                this.cachedLoadFiles = files;
                this.renderList(files);

                if (action === 'save' && type === 'widgetpresets') {
                    const widget = Dashboard._getSelectedWidgetForPreset();
                    const defaultName = (widget && widget.overrides && widget.overrides.metaName) || (widget && widget.id) || '';
                    document.getElementById('save-filename').value = defaultName;
                } else if (action === 'save' && typeof Dashboard !== 'undefined' && Dashboard.activeFileName) {
                    document.getElementById('save-filename').value = Dashboard.activeFileName;
                } else if (action === 'save') {
                    document.getElementById('save-filename').value = '';
                }

                this._focusActiveNameField();
            } catch (err) {
                console.error(err);
                document.getElementById('file-list').innerHTML = '<div class="p-4 text-center text-xs text-red-500">' + err.message + '</div>';
            }
        },

        onLoadFilterInput: function () {
            if (this.currentAction !== 'load') return;
            this.renderList(this.cachedLoadFiles || []);
        },

        _isEnterKey: function (e) {
            return !!(e && (e.key === 'Enter' || e.keyCode === 13));
        },

        _normalizeFileName: function (name) {
            return String(name || '').trim().replace(/\.json$/i, '');
        },

        _focusActiveNameField: function () {
            if (this.currentAction === 'save') {
                const nameInput = document.getElementById('save-filename');
                if (nameInput) {
                    nameInput.focus();
                    if (typeof nameInput.select === 'function') nameInput.select();
                }
                return;
            }
            if (this.currentAction === 'load') {
                const filterInput = document.getElementById('file-load-filter');
                if (filterInput) filterInput.focus();
            }
        },

        onSaveFilenameKeydown: function (e) {
            if (!this._isEnterKey(e)) return;
            if (this.currentAction !== 'save') return;
            e.preventDefault();
            void this.performSave();
        },

        onLoadFilterKeydown: function (e) {
            if (!this._isEnterKey(e)) return;
            if (this.currentAction !== 'load') return;
            e.preventDefault();
            void this.loadExactNameFromFilter();
        },

        loadExactNameFromFilter: function () {
            if (this.currentAction !== 'load' || this.currentType !== 'dashboards') return;
            const input = document.getElementById('file-load-filter');
            const typed = this._normalizeFileName(input && input.value);
            if (!typed) return;

            const files = this.cachedLoadFiles || [];
            let match = null;
            for (let i = 0; i < files.length; i++) {
                if (this._normalizeFileName(files[i] && files[i].name) === typed) {
                    match = files[i];
                    break;
                }
            }
            if (!match) {
                const lower = typed.toLowerCase();
                for (let i = 0; i < files.length; i++) {
                    if (this._normalizeFileName(files[i] && files[i].name).toLowerCase() === lower) {
                        match = files[i];
                        break;
                    }
                }
            }
            if (match && match.name) this.loadFile(match.name);
        },

        close: function () {
            this._syncTemplatePreviewField(false);
            document.getElementById('file-modal').classList.remove('show');
        },

        _syncTemplatePreviewField: function (visible) {
            const row = document.getElementById('save-template-preview-row');
            const input = document.getElementById('save-template-preview');
            if (row) {
                row.hidden = !visible;
                if (visible) row.removeAttribute('hidden');
                else row.setAttribute('hidden', '');
            }
            if (input && !visible) input.value = '';
            const kindRow = document.getElementById('save-template-kind-row');
            if (kindRow) {
                kindRow.hidden = !visible;
                if (visible) kindRow.removeAttribute('hidden');
                else kindRow.setAttribute('hidden', '');
            }
            if (visible) this._setThemeKindRadio('full');
        },

        _setThemeKindRadio: function (kind) {
            const value = kind === 'adjustment' ? 'adjustment' : 'full';
            const radios = document.querySelectorAll('input[name="save-theme-kind"]');
            for (let i = 0; i < radios.length; i++) {
                radios[i].checked = radios[i].value === value;
            }
        },

        _readThemeKindRadio: function () {
            const checked = document.querySelector('input[name="save-theme-kind"]:checked');
            return checked && checked.value === 'adjustment' ? 'adjustment' : 'full';
        },

        _selectTemplateKind: async function (name) {
            let kind = 'full';
            if (typeof Dashboard !== 'undefined' && typeof Dashboard._fetchUserThemeKind === 'function') {
                try {
                    kind = await Dashboard._fetchUserThemeKind(name);
                } catch (e) {
                    kind = 'full';
                }
            }
            const filename = document.getElementById('save-filename');
            if (filename && filename.value === name) this._setThemeKindRadio(kind);
        },

        renderList: function (files) {
            if (this.currentAction === 'save') {
                this.renderSaveList(files);
            } else {
                this.renderLoadList(files);
            }
        },

        renderSaveList: function (files) {
            const listEl = document.getElementById('save-file-list');
            listEl.innerHTML = '';

            if (files.length === 0) {
                listEl.innerHTML = '<div class="p-4 text-center ds-file-list-empty text-xs">No files found.</div>';
                return;
            }

            const self = this;
            files.forEach(function (f) {
                const isFactory = f.source === 'factory';
                const item = document.createElement('div');
                item.className = 'file-list-item';

                let html = '<div class="flex items-center">\n                        <span class="ds-file-list-name">' + f.name + '</span>\n                        ' + (isFactory ? '<span class="factory-badge"><i class="ph-fill ph-lock-key"></i> Built-in</span>' : '') + '\n                    </div>';

                item.innerHTML = html;
                if (self.currentType === 'templates' && typeof Dashboard !== 'undefined'
                    && typeof Dashboard._getUserThemeKindCache === 'function') {
                    const known = Dashboard._getUserThemeKindCache()[f.name];
                    if (known === 'full' || known === 'adjustment') {
                        const badge = document.createElement('span');
                        badge.className = 'theme-explorer-kind theme-explorer-kind--' + known;
                        badge.textContent = known === 'full' ? 'Full' : 'Adjustment';
                        const row = item.querySelector('.flex');
                        if (row) row.appendChild(badge);
                    }
                }
                item.onclick = function () {
                    document.getElementById('save-filename').value = f.name;
                    if (self.currentType === 'templates') void self._selectTemplateKind(f.name);
                };
                listEl.appendChild(item);
            });
        },

        renderLoadList: function (files) {
            const listEl = document.getElementById('file-list');
            listEl.innerHTML = '';
            if (this.currentType === 'dashboards') {
                this.renderDashboardLoadList(listEl, files);
            }
        },

        renderDashboardLoadList: function (listEl, files) {
            const q = (document.getElementById('file-load-filter') && document.getElementById('file-load-filter').value || '').trim().toLowerCase();
            const filtered = !q ? files : files.filter(function (f) { return f.name && String(f.name).toLowerCase().includes(q); });

            if (filtered.length === 0) {
                listEl.innerHTML = '<div class="p-4 text-center ds-file-list-empty text-xs">No files found.</div>';
                return;
            }

            const self = this;
            const provider = DataDriverRegistry.get();
            const sp = provider && provider.getStorageProvider();
            const keepHistory = keepDashboardFileHistoryEnabled();
            const versionTargets = [];

            filtered.forEach(function (f) {
                const isFactory = f.source === 'factory';
                const snapCount = typeof f.snapshotCount === 'number' ? f.snapshotCount : 0;
                const showChevron = keepHistory && !isFactory && snapCount > 0;

                const wrap = document.createElement('div');
                wrap.className = 'file-list-row-wrap';
                wrap.dataset.basename = f.name;

                const row = document.createElement('div');
                row.className = 'file-list-item-dashboard';

                const chevronSlot = document.createElement('div');
                chevronSlot.className = 'file-list-chevron-slot';
                if (showChevron) {
                    const chevronBtn = document.createElement('button');
                    chevronBtn.type = 'button';
                    chevronBtn.className = 'file-list-chevron-btn';
                    chevronBtn.title = 'Show previous versions';
                    chevronBtn.innerHTML = '<i class="ph-bold ph-caret-right"></i>';
                    chevronBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        self.toggleDashboardHistory(f.name, chevronBtn, panel);
                    });
                    chevronSlot.appendChild(chevronBtn);
                } else {
                    const ph = document.createElement('span');
                    ph.className = 'file-list-chevron-placeholder';
                    ph.setAttribute('aria-hidden', 'true');
                    chevronSlot.appendChild(ph);
                }

                const nameBlock = document.createElement('div');
                nameBlock.className = 'file-list-name-block';
                nameBlock.addEventListener('click', function () {
                    self.loadFile(f.name);
                });

                const nameSpan = document.createElement('span');
                nameSpan.className = 'ds-file-list-name';
                nameSpan.textContent = f.name;
                nameBlock.appendChild(nameSpan);

                const verTag = document.createElement('span');
                verTag.className = 'header-tag file-list-version-tag';
                verTag.style.cssText = 'background: var(--ui-tool-bg); color: var(--ui-accent); border-color: var(--ui-border);';
                verTag.textContent = '…';
                versionTargets.push({ name: f.name, el: verTag });

                const factoryWrap = document.createElement('div');
                factoryWrap.className = 'file-list-factory-wrap';
                if (isFactory) {
                    const badge = document.createElement('span');
                    badge.className = 'factory-badge';
                    badge.textContent = 'Built-in';
                    factoryWrap.appendChild(badge);
                }

                const actionSlot = document.createElement('div');
                actionSlot.className = 'file-list-action-slot';
                if (!isFactory) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.type = 'button';
                    deleteBtn.className = 'btn-tool danger';
                    deleteBtn.title = 'Delete';
                    deleteBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
                    deleteBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        self.deleteFile(f.name);
                    });
                    actionSlot.appendChild(deleteBtn);
                } else {
                    const lockEl = document.createElement('span');
                    lockEl.className = 'file-list-readonly-lock';
                    lockEl.setAttribute('title', 'Read Only');
                    lockEl.setAttribute('aria-label', 'Read Only');
                    lockEl.innerHTML = '<i class="ph-fill ph-lock-key" aria-hidden="true"></i>';
                    actionSlot.appendChild(lockEl);
                }

                row.appendChild(chevronSlot);
                row.appendChild(nameBlock);
                row.appendChild(verTag);
                row.appendChild(factoryWrap);
                row.appendChild(actionSlot);

                const panel = document.createElement('div');
                panel.className = 'file-history-panel';
                const panelInner = document.createElement('div');
                panelInner.className = 'file-history-panel-inner';
                panel.appendChild(panelInner);

                wrap.appendChild(row);
                wrap.appendChild(panel);
                listEl.appendChild(wrap);
            });

            if (sp && typeof sp.peekFileVersion === 'function') {
                versionTargets.forEach(function (t) {
                    sp.peekFileVersion('dashboards', t.name)
                        .then(function (ver) { applyVersionTagClasses(t.el, ver); })
                        .catch(function () { applyVersionTagClasses(t.el, '1.0.0'); });
                });
            } else {
                versionTargets.forEach(function (t) {
                    t.el.textContent = '—';
                });
            }
        },

        toggleDashboardHistory: async function (baseName, chevronBtn, panelEl) {
            const inner = panelEl.querySelector('.file-history-panel-inner');
            if (!inner) return;

            const wasOpen = panelEl.classList.contains('is-open');
            const listRoot = document.getElementById('file-list');
            listRoot.querySelectorAll('.file-history-panel.is-open').forEach(function (p) { p.classList.remove('is-open'); });
            listRoot.querySelectorAll('.file-list-chevron-btn.is-expanded').forEach(function (b) { b.classList.remove('is-expanded'); });

            if (wasOpen) {
                return;
            }

            panelEl.classList.add('is-open');
            chevronBtn.classList.add('is-expanded');

            const provider = DataDriverRegistry.get();
            const sp = provider && provider.getStorageProvider();
            if (!sp || typeof sp.listHistory !== 'function') {
                inner.textContent = 'History not available.';
                return;
            }

            inner.innerHTML = '<div class="ds-file-list-empty text-xs p-1">Loading…</div>';
            try {
                const items = await sp.listHistory('dashboards', baseName);
                this.renderHistoryPanelInner(inner, baseName, items);
            } catch (err) {
                inner.innerHTML = '<div class="text-xs text-red-400 p-1">' + err.message + '</div>';
            }
        },

        renderHistoryPanelInner: function (innerEl, baseName, items) {
            const self = this;
            innerEl.innerHTML = '';

            const toolbar = document.createElement('div');
            toolbar.className = 'file-history-panel-toolbar';

            const label = document.createElement('span');
            label.className = 'control-label';
            label.textContent = 'Previous Versions';
            toolbar.appendChild(label);

            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'btn-tool danger';
            clearBtn.textContent = 'Clear All';
            clearBtn.title = 'Delete all snapshots for this dashboard';
            clearBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                self.clearDashboardHistory(baseName);
            });
            toolbar.appendChild(clearBtn);

            innerEl.appendChild(toolbar);

            const entries = document.createElement('div');
            entries.className = 'file-history-entries';

            const provider = DataDriverRegistry.get();
            const sp = provider && provider.getStorageProvider();

            items.forEach(function (it) {
                const row = document.createElement('div');
                row.className = 'file-history-snapshot-row';

                const meta = document.createElement('div');
                meta.className = 'file-history-snapshot-meta';

                const timeLine = document.createElement('span');
                timeLine.style.color = 'var(--ui-text)';
                try {
                    timeLine.textContent = new Date(it.mtimeMs).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
                } catch (e) {
                    timeLine.textContent = it.name;
                }

                const stemLine = document.createElement('span');
                stemLine.textContent = it.name;
                stemLine.style.opacity = '0.85';

                meta.appendChild(timeLine);
                meta.appendChild(stemLine);

                const trailing = document.createElement('div');
                trailing.className = 'file-history-snapshot-trailing';

                const verTag = document.createElement('span');
                verTag.className = 'header-tag file-list-version-tag';
                verTag.style.cssText = 'background: var(--ui-tool-bg); color: var(--ui-accent); border-color: var(--ui-border);';
                verTag.textContent = '…';

                const dlBtn = document.createElement('button');
                dlBtn.type = 'button';
                dlBtn.className = 'btn-tool';
                dlBtn.title = 'Download snapshot';
                dlBtn.setAttribute('aria-label', 'Download snapshot');
                dlBtn.innerHTML = '<i class="ph-bold ph-download-simple"></i>';
                dlBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    void self.downloadSnapshotJson(it.name);
                });

                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'btn-tool danger';
                delBtn.title = 'Delete snapshot';
                delBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
                delBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.deleteSnapshotAndRefresh(it.name);
                });

                trailing.appendChild(verTag);
                trailing.appendChild(dlBtn);
                trailing.appendChild(delBtn);

                row.appendChild(meta);
                row.appendChild(trailing);

                row.addEventListener('click', function (e) {
                    if (e.target.closest('button')) return;
                    self.loadFile(it.name);
                });

                entries.appendChild(row);

                if (sp && typeof sp.peekFileVersion === 'function') {
                    sp.peekFileVersion('dashboards', it.name)
                        .then(function (ver) { applyVersionTagClasses(verTag, ver); })
                        .catch(function () { applyVersionTagClasses(verTag, '1.0.0'); });
                } else {
                    verTag.textContent = '—';
                }
            });

            innerEl.appendChild(entries);
        },

        clearDashboardHistory: async function (baseName) {
            if (!await CustomDialog.confirm('Delete all saved snapshots for "' + baseName + '"?', 'Clear Snapshots')) return;

            const provider = DataDriverRegistry.get();
            const sp = provider && provider.getStorageProvider();
            if (!sp || typeof sp.clearHistory !== 'function') {
                await CustomDialog.alert('Clear history is not available.', 'Error');
                return;
            }
            try {
                await sp.clearHistory('dashboards', baseName);
                await this.open(this.currentType, this.currentAction, { skipUnsavedCheck: true });
            } catch (err) {
                await CustomDialog.alert('Clear failed: ' + err.message, 'Error');
            }
        },

        deleteSnapshotAndRefresh: async function (snapshotName) {
            if (!await CustomDialog.confirm('Delete snapshot "' + snapshotName + '" permanently?', 'Delete Snapshot')) return;

            const provider = DataDriverRegistry.get();
            try {
                await provider.getStorageProvider().delete(this.currentType, snapshotName);
                await this.open(this.currentType, this.currentAction, { skipUnsavedCheck: true });
            } catch (err) {
                await CustomDialog.alert('Delete failed: ' + err.message, 'Error');
            }
        },

        downloadSnapshotJson: async function (snapshotStem) {
            const provider = DataDriverRegistry.get();
            const sp = provider && provider.getStorageProvider();
            if (!sp || typeof sp.load !== 'function') {
                await CustomDialog.alert('Download is not available.', 'Error');
                return;
            }
            let data;
            try {
                data = await sp.load('dashboards', snapshotStem);
            } catch (err) {
                await CustomDialog.alert('Download failed: ' + (err && err.message ? err.message : String(err)), 'Error');
                return;
            }
            try {
                let filename = String(snapshotStem || 'snapshot');
                if (!filename.toLowerCase().endsWith('.json')) {
                    filename += '.json';
                }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err2) {
                await CustomDialog.alert('Download failed: ' + (err2 && err2.message ? err2.message : String(err2)), 'Error');
            }
        },

        performSave: async function () {
            const nameInput = document.getElementById('save-filename');
            const name = nameInput.value.trim();
            if (!name) return await CustomDialog.alert("Please enter a filename", "Input Required");

            if (this.currentType === 'widgetpresets' && name.indexOf('/') >= 0) {
                return await CustomDialog.alert('Preset name cannot contain "/".', 'Input Required');
            }

            const needsOverwriteConfirm = this.currentType === 'widgetpresets'
                ? (Array.isArray(this.cachedLoadFiles) && this.cachedLoadFiles.some(function (f) {
                    const label = String(f.name || f.displayName || '').trim().toLowerCase();
                    const id = String(f.fileId || '').trim().toLowerCase();
                    const want = name.toLowerCase();
                    return label === want || id === want;
                }))
                : (this.knownFiles.includes(name) &&
                    (this.currentType !== 'dashboards' || !keepDashboardFileHistoryEnabled()));

            if (needsOverwriteConfirm) {
                if (!await CustomDialog.confirm('Overwrite "' + name + '"?', "Overwrite File")) return;
            }

            let data;
            let saveName = name;
            if (this.currentType === 'dashboards') {
                data = Dashboard._serializeDashboard();
            } else if (this.currentType === 'widgetpresets') {
                const widget = Dashboard._getSelectedWidgetForPreset();
                if (!widget || !this.currentWidgetType) {
                    return await CustomDialog.alert('Select a widget first.', 'Save Widget Preset');
                }
                const cached = Array.isArray(this.cachedLoadFiles) ? this.cachedLoadFiles : [];
                const existing = cached.find(function (f) {
                    const label = String(f.name || f.displayName || '').trim().toLowerCase();
                    const id = String(f.fileId || '').trim().toLowerCase();
                    const want = name.toLowerCase();
                    return label === want || id === want;
                });
                const existingIds = cached.map(function (f) { return f.fileId; }).filter(Boolean);
                let fileId = existing && existing.fileId
                    ? existing.fileId
                    : ((typeof WidgetPresetModel !== 'undefined')
                        ? WidgetPresetModel.uniqueSlug(WidgetPresetModel.slugify(name, 'preset'), existingIds)
                        : name.replace(/[^a-zA-Z0-9_-]/g, '') || 'preset');
                data = Dashboard._serializeWidgetPreset(widget, name, {
                    fileId: fileId,
                    existingFileIds: existingIds,
                    preset: (typeof Dashboard._pendingWidgetPresetSave === 'object')
                        ? Dashboard._pendingWidgetPresetSave
                        : null
                });
                Dashboard._pendingWidgetPresetSave = null;
                saveName = this.currentWidgetType + '/' + fileId;
            } else {
                const previewInput = document.getElementById('save-template-preview');
                const previewImage = previewInput ? String(previewInput.value || '').trim() : '';
                const themeKind = this.currentType === 'templates' ? this._readThemeKindRadio() : 'full';
                data = Dashboard._serializeTemplate(name, { previewImage: previewImage, themeKind: themeKind });
            }

            const provider = DataDriverRegistry.get();
            try {
                await provider.getStorageProvider().save(this.currentType, saveName, data);

                if (typeof Dashboard !== 'undefined') {
                    if (this.currentType !== 'widgetpresets') {
                        Dashboard.activeFileName = name;
                    }
                    if (this.currentType === 'dashboards') {
                        Dashboard.hasUnsavedChanges = false;
                    }
                    if (typeof Dashboard.updateFileIndicator === 'function') {
                        Dashboard.updateFileIndicator();
                    }
                }

                await CustomDialog.alert("Saved successfully!", "Success");
                if (this.currentType === 'dashboards' && typeof provider.sendSaveNotification === 'function') {
                    provider.sendSaveNotification(name);
                }
                if (this.currentType === 'templates' && typeof Dashboard !== 'undefined') {
                    if (typeof Dashboard._getUserThemeKindCache === 'function') {
                        Dashboard._getUserThemeKindCache()[name] = this._readThemeKindRadio();
                        Dashboard._cachedUserTemplates = null;
                    }
                    if (typeof Dashboard.refreshTemplateDropdown === 'function') {
                        void Dashboard.refreshTemplateDropdown();
                    }
                }
                if (this.currentType === 'widgetpresets' && typeof Dashboard !== 'undefined' && typeof Dashboard.refreshWidgetPresetDropdown === 'function') {
                    void Dashboard.refreshWidgetPresetDropdown();
                }
                this.close();
            } catch (err) {
                await CustomDialog.alert("Save failed: " + err.message, "Error");
            }
        },

        loadFile: async function (name) {
            if (this.currentType !== 'dashboards') {
                await CustomDialog.alert('Only dashboards can be loaded from this dialog.', 'Info');
                return;
            }
            const provider = DataDriverRegistry.get();

            if (typeof Dashboard !== 'undefined' && typeof Dashboard.showLoading === 'function') {
                Dashboard.showLoading(name);
            }

            try {
                const data = await provider.getStorageProvider().load(this.currentType, name);
                await Dashboard.loadDashboardData(data);
                Dashboard.activeFileName = name.replace(/\.json$/i, '');
                Dashboard.updateFileIndicator();
                if (typeof Dashboard.clearUrlParams === 'function') Dashboard.clearUrlParams();
                this.close();
            } catch (err) {
                await CustomDialog.alert("Load failed: " + err.message, "Error");
            } finally {
                if (typeof Dashboard !== 'undefined' && typeof Dashboard.hideLoading === 'function') {
                    Dashboard.hideLoading();
                }
            }
        },

        deleteFile: async function (name) {
            if (!await CustomDialog.confirm('Delete "' + name + '" permanently?', "Delete File")) return;

            const provider = DataDriverRegistry.get();
            try {
                let deleteName = name;
                if (this.currentType === 'widgetpresets' && this.currentWidgetType) {
                    const cached = Array.isArray(this.cachedLoadFiles) ? this.cachedLoadFiles : [];
                    const match = cached.find(function (f) {
                        return f.name === name || f.displayName === name || f.fileId === name || f.fullName === name;
                    });
                    deleteName = match && match.fullName
                        ? match.fullName
                        : (this.currentWidgetType + '/' + (match && match.fileId ? match.fileId : name));
                }
                await provider.getStorageProvider().delete(this.currentType, deleteName);
                if (this.currentType === 'templates' && typeof Dashboard !== 'undefined' && typeof Dashboard.refreshTemplateDropdown === 'function') {
                    void Dashboard.refreshTemplateDropdown();
                }
                if (this.currentType === 'widgetpresets' && typeof Dashboard !== 'undefined' && typeof Dashboard.refreshWidgetPresetDropdown === 'function') {
                    void Dashboard.refreshWidgetPresetDropdown();
                }
                await this.open(this.currentType, this.currentAction, { skipUnsavedCheck: true });
            } catch (err) {
                await CustomDialog.alert("Delete failed: " + err.message, "Error");
            }
        }
    };

    window.ServerFileManager = ServerFileManager;

    const filterEl = document.getElementById('file-load-filter');
    if (filterEl) {
        filterEl.addEventListener('input', function () {
            ServerFileManager.onLoadFilterInput();
        });
        filterEl.addEventListener('keydown', function (e) {
            ServerFileManager.onLoadFilterKeydown(e);
        });
    }
    const saveNameEl = document.getElementById('save-filename');
    if (saveNameEl) {
        saveNameEl.addEventListener('keydown', function (e) {
            ServerFileManager.onSaveFilenameKeydown(e);
        });
    }
})();
