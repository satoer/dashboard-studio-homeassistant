/**
 * Editor Quick Toolbar: docked slide-out + floating palette.
 * Prefs live on MASTER_SETTINGS.quickToolbar and must not mark the dashboard dirty.
 */
const QuickToolbar = {
    DEFAULTS: { visibility: 'auto', enabled: true, mode: 'docked', x: 0, y: 0, columns: 1, rows: 0 },
    GAP_PX: 4,
    PAD_PX: 6,
    MAX_COLUMNS: 12,
    HANDLE_SIZE_PX: 18,
    _host: null,
    _clip: null,
    _dockRow: null,
    _shell: null,
    _grid: null,
    _handle: null,
    _flyout: null,
    _buttons: {},
    _pageHost: null,
    _pageCluster: null,
    _pageSep: null,
    _pageSignature: '',
    _toolsVisible: true,
    _initialized: false,
    _extended: false,
    _observer: null,
    _scrollFallback: null,
    _measureToolsVisibility: null,
    _drag: null,
    _resize: null,
    _boundDocMove: null,
    _boundDocUp: null,
    _hideTimer: null,
    _loadSyncTimer: null,
    _flyoutOpen: false,
    _ignoreResizeUntilUp: false,
    _activeRows: 0,
    _windowResizeBound: false,
    _windowGestureBound: false,

    init: function () {
        if (this._initialized) return;
        if (window.IS_VIEWER === true) return;
        const host = document.getElementById('quick-toolbar-host');
        if (!host) return;
        this._host = host;
        host.hidden = false;
        host.removeAttribute('hidden');
        this._buildDom();
        this._bindScrollObserver();
        this._bindWindow();
        this._initialized = true;
    },

    getPrefs: function () {
        const raw = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.quickToolbar
            && typeof MASTER_SETTINGS.quickToolbar === 'object')
            ? MASTER_SETTINGS.quickToolbar
            : null;
        return this.normalizePrefs(raw);
    },

    normalizePrefs: function (raw) {
        const src = (raw && typeof raw === 'object') ? raw : {};
        let columns = parseInt(src.columns, 10);
        if (!Number.isFinite(columns) || columns < 1) columns = 1;
        if (columns > this.MAX_COLUMNS) columns = this.MAX_COLUMNS;
        let rows = parseInt(src.rows, 10);
        if (!Number.isFinite(rows) || rows < 0) rows = 0;
        if (rows > this.MAX_COLUMNS) rows = this.MAX_COLUMNS;
        let x = parseInt(src.x, 10);
        let y = parseInt(src.y, 10);
        if (!Number.isFinite(x)) x = 0;
        if (!Number.isFinite(y)) y = 0;
        const visibility = this.normalizeVisibility(src);
        return {
            visibility: visibility,
            enabled: visibility !== 'never',
            mode: src.mode === 'floating' ? 'floating' : 'docked',
            x: x,
            y: y,
            columns: columns,
            rows: rows
        };
    },

    normalizeVisibility: function (raw) {
        const src = (raw && typeof raw === 'object') ? raw : {};
        if (src.visibility === 'always' || src.visibility === 'never' || src.visibility === 'auto') {
            return src.visibility;
        }
        if (src.enabled === false) return 'never';
        return 'auto';
    },

    apply: function () {
        if (!this._initialized) this.init();
        if (!this._initialized) return;
        this._applyLayout();
    },

    refresh: function () {
        if (!this._initialized) this.init();
        if (!this._initialized) return;
        this._syncPlatformButtons();
        this._syncActionEnablement();
        this._syncGroupButtons();
        this._syncPageButtons();
        this.syncEditToggles();
        this._applyLayout();
    },

    syncEnvironmentControl: function () {
        if (typeof Editor === 'undefined' || !Editor.fieldRegistry) return;
        const vis = this.getPrefs().visibility;
        const visReg = Editor.fieldRegistry.quickToolbarVisibility;
        if (visReg && visReg.inputEl && visReg.inputEl.value !== vis) {
            visReg.inputEl.value = vis;
        }
    },

    syncEnvironmentCheckbox: function () {
        this.syncEnvironmentControl();
    },

    _buildDom: function () {
        const host = this._host;
        host.innerHTML = '';

        const clip = document.createElement('div');
        clip.id = 'quick-toolbar-clip';
        clip.className = 'quick-toolbar-clip';
        host.appendChild(clip);
        this._clip = clip;

        const shell = document.createElement('div');
        shell.id = 'quick-toolbar-shell';
        shell.className = 'quick-toolbar-shell is-docked is-retracted';
        shell.setAttribute('role', 'toolbar');
        shell.setAttribute('aria-label', 'Quick Toolbar');
        this._shell = shell;

        const handle = document.createElement('div');
        handle.className = 'quick-toolbar-drag-handle';
        handle.setAttribute('aria-label', 'Move Quick Toolbar');
        handle.title = 'Drag to move';
        handle.innerHTML = '<i class="ph-bold ph-dots-six-vertical" aria-hidden="true"></i>';
        this._handle = handle;
        shell.appendChild(handle);

        const grid = document.createElement('div');
        grid.className = 'quick-toolbar-grid';
        this._grid = grid;
        shell.appendChild(grid);

        const sides = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
        for (let i = 0; i < sides.length; i++) {
            const h = document.createElement('div');
            h.className = 'quick-toolbar-resize quick-toolbar-resize-' + sides[i];
            h.setAttribute('data-corner', sides[i]);
            h.setAttribute('aria-hidden', 'true');
            h.title = 'Drag to resize';
            shell.appendChild(h);
            this._bindResizeHandle(h, sides[i]);
        }

        const east = document.createElement('div');
        east.className = 'quick-toolbar-resize quick-toolbar-resize-east';
        east.setAttribute('data-corner', 'east');
        east.setAttribute('aria-hidden', 'true');
        east.title = 'Drag to add columns';
        this._eastHandle = east;
        this._bindResizeHandle(east, 'east');

        const dockRow = document.createElement('div');
        dockRow.className = 'quick-toolbar-dock-row';
        this._dockRow = dockRow;
        this._fillGrid();
        dockRow.appendChild(shell);
        dockRow.appendChild(east);
        clip.appendChild(dockRow);
        if (typeof Dashboard !== 'undefined' && Dashboard._editModeLaneResizeObserver) {
            Dashboard._editModeLaneResizeObserver.observe(shell);
        }
        this._bindDragHandle(handle);
        this._bindFlyoutDismiss();
    },

    _fillGrid: function () {
        const grid = this._grid;
        grid.innerHTML = '';
        this._buttons = {};

        this._addMetaButtons(this._addCluster(grid));
        this._addSep(grid);
        this._addInsertButton(this._addCluster(grid));
        this._addSep(grid);
        this._addAssetButtons(this._addCluster(grid));
        this._addSep(grid);
        this._addHistoryButtons(this._addCluster(grid));
        this._addSep(grid);
        this._addGroupButtons(this._addCluster(grid));
        this._pageSep = this._addSep(grid);
        this._pageSep.classList.add('quick-toolbar-page-sep', 'quick-toolbar-hidden');
        this._pageCluster = this._addCluster(grid);
        this._pageCluster.classList.add('quick-toolbar-page-cluster', 'quick-toolbar-hidden');
        this._pageAnchor = this._pageCluster;
        this.syncEditToggles();
    },

    _addCluster: function (grid) {
        const cluster = document.createElement('div');
        cluster.className = 'quick-toolbar-cluster';
        grid.appendChild(cluster);
        return cluster;
    },

    _addSep: function (grid) {
        const sep = document.createElement('span');
        sep.className = 'quick-toolbar-sep';
        sep.setAttribute('aria-hidden', 'true');
        grid.appendChild(sep);
        return sep;
    },

    _makeButton: function (id, label, iconClass, onClick, extraClass) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'qt-btn-' + id;
        btn.className = 'btn-tool btn-tool-icon-only' + (extraClass ? ' ' + extraClass : '');
        btn.title = label;
        btn.setAttribute('aria-label', label);
        const icon = document.createElement('i');
        icon.className = 'ph-bold ' + iconClass;
        icon.setAttribute('aria-hidden', 'true');
        btn.appendChild(icon);
        btn.addEventListener('mousedown', function (e) {
            e.stopPropagation();
        });
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (btn.classList.contains('is-disabled') || btn.classList.contains('pointer-events-none')) return;
            onClick(btn, e);
        });
        this._buttons[id] = btn;
        return btn;
    },

    _addMetaButtons: function (grid) {
        const self = this;
        grid.appendChild(this._makeButton('hide', 'Hide Quick Toolbar', 'ph-x', function () {
            if (typeof Dashboard !== 'undefined' && Dashboard.setQuickToolbarPrefs) {
                Dashboard.setQuickToolbarPrefs({ visibility: 'never' });
            }
        }));
        grid.appendChild(this._makeButton('popout', 'Pop out Quick Toolbar', 'ph-arrow-square-out', function () {
            self._togglePopout();
        }));
    },

    _addAssetButtons: function (grid) {
        grid.appendChild(this._makeButton('media', 'Image Gallery', 'ph-images-square', function () {
            if (typeof ImageGallery !== 'undefined' && ImageGallery.open) ImageGallery.open();
        }));
        grid.appendChild(this._makeButton('audio', 'Audio Gallery', 'ph-music-notes', function () {
            if (typeof AudioGallery !== 'undefined' && AudioGallery.open) AudioGallery.open();
        }));
        grid.appendChild(this._makeButton('saveHomey', 'Save to Homey', 'ph-cloud-arrow-up', function () {
            if (typeof ServerFileManager !== 'undefined') ServerFileManager.open('dashboards', 'save');
        }));
        grid.appendChild(this._makeButton('loadHomey', 'Load from Homey', 'ph-cloud-arrow-down', function () {
            if (typeof ServerFileManager !== 'undefined') ServerFileManager.open('dashboards', 'load');
        }));
        grid.appendChild(this._makeButton('export', 'Export Dashboard', 'ph-download-simple', function () {
            if (typeof Dashboard !== 'undefined') Dashboard.exportDashboardLocal();
        }));
        grid.appendChild(this._makeButton('import', 'Import Dashboard', 'ph-folder-open', function () {
            if (typeof Dashboard !== 'undefined') Dashboard.importDashboardLocal();
        }));
        grid.appendChild(this._makeButton('reset', 'Reset Canvas', 'ph-trash', function () {
            if (typeof Dashboard !== 'undefined') Dashboard.resetDashboard();
        }, 'danger'));
    },

    _addHistoryButtons: function (grid) {
        grid.appendChild(this._makeButton('undo', 'Undo', 'ph-arrow-counter-clockwise', function () {
            if (typeof Dashboard !== 'undefined') Dashboard.undo();
        }));
        grid.appendChild(this._makeButton('redo', 'Redo', 'ph-arrow-clockwise', function () {
            if (typeof Dashboard !== 'undefined') Dashboard.redo();
        }));
        grid.appendChild(this._makeButton('cut', 'Cut', 'ph-scissors', function () {
            if (typeof Dashboard !== 'undefined') Dashboard.cutSelectionToClipboard();
        }));
        grid.appendChild(this._makeButton('copy', 'Copy', 'ph-copy', function () {
            if (typeof Dashboard !== 'undefined') Dashboard.copySelectionToClipboard();
        }));
        grid.appendChild(this._makeButton('paste', 'Paste', 'ph-clipboard-text', function () {
            if (typeof Dashboard !== 'undefined') Dashboard.pasteFromClipboard();
        }));
        grid.appendChild(this._makeButton('addToSelection', 'Add to selection', 'ph-selection-plus', function () {
            if (typeof Dashboard !== 'undefined') Dashboard.setEditAddToSelection(!Dashboard._editAddToSelection);
        }));
        grid.appendChild(this._makeButton('selectBehind', 'Select behind', 'ph-stack', function () {
            if (typeof Dashboard !== 'undefined') Dashboard.armEditSelectBehind(!Dashboard._editSelectBehind);
        }));
    },

    _setBtnPressed: function (id, pressed) {
        const btn = this._buttons[id];
        if (!btn) return;
        const on = !!pressed;
        btn.classList.toggle('is-pressed', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    },

    syncEditToggles: function () {
        const D = typeof Dashboard !== 'undefined' ? Dashboard : null;
        this._setBtnPressed('addToSelection', !!(D && D._editAddToSelection));
        this._setBtnPressed('selectBehind', !!(D && D._editSelectBehind));
    },

    _addGroupButtons: function (grid) {
        grid.appendChild(this._makeButton('group', 'Group', 'ph-stack-simple', function () {
            if (typeof Dashboard !== 'undefined') Dashboard.groupPrimaryToolbarAction();
        }));
        grid.appendChild(this._makeButton('ungroup', 'Ungroup', 'ph-stack-minus', function () {
            if (typeof Dashboard !== 'undefined') Dashboard.ungroupSelectedWidgets();
        }, 'danger'));
        grid.appendChild(this._makeButton('openGroup', 'Open Group', 'ph-arrows-out-simple', function () {
            if (typeof Dashboard !== 'undefined') Dashboard.toggleOpenSelectedGroupView();
        }));
    },

    _addInsertButton: function (grid) {
        const self = this;
        const btn = this._makeButton('insert', 'Insert Widget', 'ph-plus-circle', function (insertBtn) {
            self._toggleFlyout(insertBtn);
        }, 'primary');
        btn.setAttribute('aria-haspopup', 'menu');
        btn.setAttribute('aria-expanded', 'false');
        grid.appendChild(btn);
    },

    _setBtnEnabled: function (id, enabled) {
        const btn = this._buttons[id];
        if (!btn) return;
        const on = !!enabled;
        btn.classList.toggle('is-disabled', !on);
        btn.classList.remove('opacity-50', 'pointer-events-none');
        if (on) btn.removeAttribute('aria-disabled');
        else btn.setAttribute('aria-disabled', 'true');
    },

    _mirrorPrimary: function (id, primaryId) {
        const src = document.getElementById(primaryId);
        if (!src) {
            this._setBtnEnabled(id, false);
            return;
        }
        const disabled = src.classList.contains('pointer-events-none')
            || src.classList.contains('is-disabled')
            || src.getAttribute('aria-disabled') === 'true';
        this._setBtnEnabled(id, !disabled);
    },

    _syncActionEnablement: function () {
        this._mirrorPrimary('undo', 'toolbar-btn-undo');
        this._mirrorPrimary('redo', 'toolbar-btn-redo');
        this._mirrorPrimary('cut', 'toolbar-btn-cut');
        this._mirrorPrimary('copy', 'toolbar-btn-copy');
        this._mirrorPrimary('paste', 'toolbar-btn-paste');
    },

    _syncGroupButtons: function () {
        const D = typeof Dashboard !== 'undefined' ? Dashboard : null;
        const groupBtn = this._buttons.group;
        const ungroupBtn = this._buttons.ungroup;
        const openBtn = this._buttons.openGroup;
        if (!D || !groupBtn || !ungroupBtn || !openBtn) return;

        const isExactGroupSelection = !!(D.selectedGroupId && D._isSelectionExactlyGroup && D._isSelectionExactlyGroup(D.selectedGroupId));
        const hasMultiSelection = D.selectedIds && D.selectedIds.length > 1;
        const isGroupOpen = !!D.openedGroupId;
        const hasExactGroup = !!D.selectedGroupId;
        const activeGroupId = D.selectedGroupId || D.openedGroupId;
        const hasActionableGroup = !!(activeGroupId && D.groups && D.groups[activeGroupId]);
        const isGroupLocked = hasActionableGroup && D.groups[activeGroupId].locked === true;
        const openedMemberIds = isGroupOpen && D.getGroupMemberIds ? D.getGroupMemberIds(D.openedGroupId) : [];
        const selectedInOpenGroup = isGroupOpen && D.getEffectiveSelectionIds
            ? D.getEffectiveSelectionIds().filter(function (id) { return openedMemberIds.indexOf(id) !== -1; })
            : [];
        const hasRemoveFromSelection = selectedInOpenGroup.length > 0;
        const openGroupLocked = isGroupOpen && D.groups[D.openedGroupId] && D.groups[D.openedGroupId].locked === true;
        const showGroupBtn = hasMultiSelection && !isGroupOpen;
        const groupDisabled = isExactGroupSelection;
        const showGroupPrimary = isGroupOpen || showGroupBtn;
        const groupPrimaryDisabled = isGroupOpen
            ? (!hasRemoveFromSelection || openGroupLocked)
            : groupDisabled;
        const showUngroupOpen = hasMultiSelection || hasExactGroup || isGroupOpen;
        const canUngroupOpen = hasActionableGroup && (hasExactGroup || isGroupOpen);
        const ungroupOpenDisabled = !canUngroupOpen || isGroupLocked;
        const isOpened = isGroupOpen && D.openedGroupId === activeGroupId;

        this._setBtnEnabled('group', showGroupPrimary && !groupPrimaryDisabled);
        this._setBtnEnabled('ungroup', showUngroupOpen && !ungroupOpenDisabled);
        this._setBtnEnabled('openGroup', showUngroupOpen && !ungroupOpenDisabled);

        const groupIcon = groupBtn.querySelector('i');
        if (isGroupOpen) {
            groupBtn.title = 'Remove the selected widgets from this open group';
            groupBtn.setAttribute('aria-label', 'Remove From Group');
            if (groupIcon) groupIcon.className = 'ph-bold ph-arrow-bend-up-left';
        } else {
            groupBtn.title = 'Create a new group, or add widgets to an existing group in the same selection';
            groupBtn.setAttribute('aria-label', 'Group');
            if (groupIcon) groupIcon.className = 'ph-bold ph-stack-simple';
        }

        const openIcon = openBtn.querySelector('i');
        if (isOpened) {
            openBtn.title = 'Close focus mode and return to normal group selection';
            openBtn.setAttribute('aria-label', 'Close Group');
            if (openIcon) openIcon.className = 'ph-bold ph-arrows-in-simple';
        } else {
            openBtn.title = 'Open focus mode to edit widgets inside the selected group';
            openBtn.setAttribute('aria-label', 'Open Group');
            if (openIcon) openIcon.className = 'ph-bold ph-arrows-out-simple';
        }
    },

    _syncPlatformButtons: function () {
        const ui = (window.APP_CONFIG && window.APP_CONFIG.ui) ? window.APP_CONFIG.ui : {};
        const platformDriver = typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS ? String(MASTER_SETTINGS.dataDriver || '').toLowerCase() : '';
        const activeDriver = typeof DataDriverRegistry !== 'undefined' && DataDriverRegistry.getType ? String(DataDriverRegistry.getType() || '').toLowerCase() : '';
        const platformHomey = platformDriver === 'homey' || platformDriver === 'homeassistant';
        const activeHomey = typeof DataDriverRegistry !== 'undefined' && DataDriverRegistry.getType
            ? (activeDriver === 'homey' || activeDriver === 'homeassistant')
            : false;
        const showGallery = platformHomey || activeHomey;
        const driver = typeof DataDriverRegistry !== 'undefined' ? DataDriverRegistry.get() : null;
        const supportsStorage = driver ? !!driver.supportsFileStorage : false;
        const showServer = supportsStorage && !!ui.showServerButtons;
        const showLocal = ui.showLocalButtons !== false;

        this._setBtnHidden('media', !showGallery);
        this._setBtnHidden('audio', !showGallery);
        this._setBtnHidden('saveHomey', !showServer);
        this._setBtnHidden('loadHomey', !showServer);
        const isHa = platformDriver === 'homeassistant' || activeDriver === 'homeassistant';
        if (this._buttons.saveHomey) {
            const saveLabel = isHa ? 'Save to Home Assistant' : 'Save to Homey';
            this._buttons.saveHomey.title = saveLabel;
            this._buttons.saveHomey.setAttribute('aria-label', saveLabel);
        }
        if (this._buttons.loadHomey) {
            const loadLabel = isHa ? 'Load from Home Assistant' : 'Load from Homey';
            this._buttons.loadHomey.title = loadLabel;
            this._buttons.loadHomey.setAttribute('aria-label', loadLabel);
        }
        this._setBtnHidden('export', !showLocal);
        this._setBtnHidden('import', !showLocal);
    },

    _setBtnHidden: function (id, hidden) {
        const btn = this._buttons[id];
        if (!btn) return;
        btn.classList.toggle('quick-toolbar-hidden', !!hidden);
        if (hidden) btn.setAttribute('aria-hidden', 'true');
        else btn.removeAttribute('aria-hidden');
    },

    _syncPageButtons: function () {
        if (!this._grid || !this._pageCluster) return;
        const pages = (typeof Dashboard !== 'undefined' && Dashboard._getPagesWithWidgets)
            ? Dashboard._getPagesWithWidgets()
            : [];
        const signature = pages.join(',');
        const currentPage = Math.max(1, Number(typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.currentPage : 1) || 1);
        if (signature !== this._pageSignature) {
            this._pageSignature = signature;
            this._pageCluster.innerHTML = '';
            const hasPages = pages.length > 0;
            if (this._pageSep) this._pageSep.classList.toggle('quick-toolbar-hidden', !hasPages);
            this._pageCluster.classList.toggle('quick-toolbar-hidden', !hasPages);
            if (hasPages) {
                pages.forEach(function (page) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'btn-tool btn-tool-icon-only quick-toolbar-page';
                    btn.textContent = String(page);
                    btn.title = 'Go to page ' + page;
                    btn.setAttribute('aria-label', 'Go to page ' + page);
                    btn.setAttribute('data-page', String(page));
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (typeof Dashboard !== 'undefined') Dashboard.updateGlobal({ currentPage: page });
                    });
                    this._pageCluster.appendChild(btn);
                }, this);
            }
        }
        const chips = this._pageCluster.querySelectorAll('.quick-toolbar-page');
        for (let i = 0; i < chips.length; i++) {
            const p = parseInt(chips[i].getAttribute('data-page'), 10);
            chips[i].classList.toggle('primary', p === currentPage);
            chips[i].setAttribute('aria-current', p === currentPage ? 'page' : 'false');
        }
    },

    _isEditMode: function () {
        return typeof Dashboard !== 'undefined' && !!Dashboard.isEditMode;
    },

    _shouldShow: function () {
        if (!this._isEditMode()) return false;
        const prefs = this.getPrefs();
        if (prefs.visibility === 'never') return false;
        if (prefs.mode === 'floating') return true;
        if (prefs.visibility === 'always') return true;
        return !this._toolsVisible;
    },

    _togglePopout: function () {
        this._finishGesture();
        this._ignoreResizeUntilUp = true;
        const prefs = this.getPrefs();
        const toFloating = prefs.mode !== 'floating';
        const pos = (prefs.x === 0 && prefs.y === 0) ? this._defaultFloatingPosition() : { x: prefs.x, y: prefs.y };
        if (typeof Dashboard === 'undefined' || !Dashboard.setQuickToolbarPrefs) return;
        if (toFloating) {
            Dashboard.setQuickToolbarPrefs({ mode: 'floating', x: pos.x, y: pos.y });
        } else {
            Dashboard.setQuickToolbarPrefs({ mode: 'docked' });
        }
        this._ignoreResizeUntilUp = false;
        this._syncResizeHandles(toFloating, this._shouldShow());
    },

    _defaultFloatingPosition: function () {
        const editor = document.getElementById('editor-panel');
        let x = 16;
        let y = 16;
        if (editor) {
            const r = editor.getBoundingClientRect();
            x = Math.round(r.right + 8);
            y = Math.round(r.top);
        }
        return this._clampPosition(x, y);
    },

    _buttonSize: function () {
        const btn = this._grid ? this._grid.querySelector('.btn-tool:not(.quick-toolbar-hidden)') : null;
        if (btn) {
            const w = btn.getBoundingClientRect().width;
            if (w > 0) return w;
        }
        return 36;
    },

    _syncResizeHandles: function (floating, show) {
        const host = this._host;
        if (!host) return;
        const resizeHandles = host.querySelectorAll('.quick-toolbar-resize');
        const allow = !this._ignoreResizeUntilUp;
        for (let i = 0; i < resizeHandles.length; i++) {
            const corner = resizeHandles[i].getAttribute('data-corner');
            const showHandle = allow && (floating
                ? (corner !== 'east')
                : (show && corner === 'east'));
            resizeHandles[i].classList.toggle('is-visible', showHandle);
        }
    },

    _applyLayout: function () {
        const prefs = this.getPrefs();
        const shell = this._shell;
        const clip = this._clip;
        const host = this._host;
        if (!shell || !clip || !host) return;

        const floating = prefs.mode === 'floating' && prefs.visibility !== 'never' && this._isEditMode();
        const visuallyFloating = shell.classList.contains('is-floating');
        const liveGesture = !!(this._drag || this._resize);
        if (liveGesture && floating === visuallyFloating) {
            if (this._resize && this._resize.dockedEast && !floating) this._syncClipToEditor();
            return;
        }
        if (liveGesture) this._endGesture(false);

        const pop = this._buttons.popout;
        if (pop) {
            const icon = pop.querySelector('i');
            if (prefs.mode === 'floating') {
                pop.title = 'Dock Quick Toolbar';
                pop.setAttribute('aria-label', 'Dock Quick Toolbar');
                if (icon) icon.className = 'ph-bold ph-arrow-line-left';
            } else {
                pop.title = 'Pop out Quick Toolbar';
                pop.setAttribute('aria-label', 'Pop out Quick Toolbar');
                if (icon) icon.className = 'ph-bold ph-arrow-square-out';
            }
        }

        const columns = Math.max(1, prefs.columns || 1);
        const savedRows = parseInt(prefs.rows, 10);
        const rows = (Number.isFinite(savedRows) && savedRows > 0) ? this._clampTracks(savedRows) : 0;
        const show = this._shouldShow();
        if (this._handle) this._handle.classList.toggle('is-visible', floating);
        const landscape = this._syncLandscape(floating, columns, rows);
        const tracks = landscape
            ? Math.max(1, this._activeRows || 1)
            : columns;
        this._applyTrackTemplate(landscape, tracks);

        if (floating) {
            shell.classList.add('is-floating');
            shell.classList.remove('is-docked', 'is-retracted', 'is-extended');
            if (shell.parentNode !== host) host.appendChild(shell);
            clip.classList.remove('is-open', 'is-scrollable');
            clip.style.visibility = 'hidden';
            clip.style.pointerEvents = 'none';
            clip.style.display = 'none';
            this._clearClipInlineBox();
            shell.style.height = '';
            shell.style.maxHeight = '';
            shell.style.margin = '';
            const pos = this._clampPosition(prefs.x || 0, prefs.y || 0);
            if (pos.x === 0 && pos.y === 0) {
                const def = this._defaultFloatingPosition();
                shell.style.left = def.x + 'px';
                shell.style.top = def.y + 'px';
            } else {
                shell.style.left = pos.x + 'px';
                shell.style.top = pos.y + 'px';
            }
            shell.style.transform = 'none';
            shell.style.visibility = show ? 'visible' : 'hidden';
            shell.style.pointerEvents = show ? '' : 'none';
            this._syncResizeHandles(true, show);
            host.setAttribute('aria-hidden', show ? 'false' : 'true');
            if (!show) this._closeFlyout();
            else if (this._flyoutOpen) this._positionFlyout(this._buttons.insert, this._flyout);
            if (typeof Dashboard !== 'undefined' && typeof Dashboard._syncEditModeDashboardLane === 'function') {
                Dashboard._syncEditModeDashboardLane();
            }
            return;
        }

        const dockRow = this._dockRow;
        if (dockRow && shell.parentNode !== dockRow) {
            dockRow.insertBefore(shell, this._eastHandle || null);
        }
        clip.style.display = '';
        this._clearClipInlineBox();
        shell.style.left = '';
        shell.style.top = '';
        shell.style.transform = '';
        shell.classList.remove('is-floating');
        shell.classList.add('is-docked');
        this._syncClipToEditor();

        if (show) {
            this._extendDocked();
            if (this._flyoutOpen) this._positionFlyout(this._buttons.insert, this._flyout);
        } else {
            this._retractDocked();
            this._closeFlyout();
        }
        this._syncResizeHandles(false, show);
        host.setAttribute('aria-hidden', show ? 'false' : 'true');
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._syncEditModeDashboardLane === 'function') {
            Dashboard._syncEditModeDashboardLane();
        }
    },

    _clearClipInlineBox: function () {
        const clip = this._clip;
        if (!clip) return;
        clip.style.top = '';
        clip.style.left = '';
        clip.style.height = '';
        clip.style.width = '';
        clip.style.maxHeight = '';
        clip.style.padding = '';
        clip.style.overflow = '';
    },

    _syncClipToEditor: function () {
        const shell = this._shell;
        if (!shell) return;
        this._clearClipInlineBox();
        shell.style.height = '';
        shell.style.maxHeight = '';
        shell.style.margin = '';
    },

    _extendDocked: function () {
        const shell = this._shell;
        const clip = this._clip;
        if (!shell || !clip) return;
        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }
        clip.style.visibility = 'visible';
        clip.classList.add('is-open');
        shell.style.visibility = 'visible';
        shell.style.pointerEvents = 'auto';
        clip.style.pointerEvents = 'none';
        shell.classList.remove('is-retracted');
        shell.classList.add('is-extended');
        this._extended = true;
        this._syncClipToEditor();
    },

    _retractDocked: function () {
        const shell = this._shell;
        const clip = this._clip;
        if (!shell || !clip) return;
        shell.classList.remove('is-extended');
        shell.classList.add('is-retracted');
        shell.style.pointerEvents = 'none';
        clip.style.pointerEvents = 'none';
        this._extended = false;
        const self = this;
        if (this._hideTimer) clearTimeout(this._hideTimer);
        this._hideTimer = setTimeout(function () {
            if (self._extended) return;
            if (self._clip) {
                self._clip.classList.remove('is-open');
                self._clip.style.visibility = 'hidden';
                self._clip.style.pointerEvents = 'none';
            }
            if (self._shell && !self._shell.classList.contains('is-floating')) {
                self._shell.style.visibility = 'hidden';
            }
        }, 300);
    },

    _bindScrollObserver: function () {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
        if (this._scrollFallback && this._scrollFallback.root && this._scrollFallback.fn) {
            this._scrollFallback.root.removeEventListener('scroll', this._scrollFallback.fn, false);
            this._scrollFallback = null;
        }
        this._measureToolsVisibility = null;
        const root = document.getElementById('editor-scroll-container');
        const target = document.getElementById('editor-universal-actions')
            || document.getElementById('editor-tools');
        if (!root || !target) return;
        const self = this;
        const applyIntersecting = function (isIntersecting) {
            const next = !!isIntersecting;
            if (self._toolsVisible === next) return;
            self._toolsVisible = next;
            const prefs = self.getPrefs();
            if (prefs.mode === 'floating' || prefs.visibility !== 'auto') return;
            self._applyLayout();
        };
        const measure = function () {
            const rootRect = root.getBoundingClientRect();
            const tRect = target.getBoundingClientRect();
            const stillBelowClipTop = tRect.top > rootRect.top + 1;
            applyIntersecting(stillBelowClipTop);
        };
        this._measureToolsVisibility = measure;
        if (typeof IntersectionObserver === 'function') {
            this._observer = new IntersectionObserver(function () {
                measure();
            }, {
                root: root,
                threshold: [0, 0.01, 0.25, 0.5, 0.75, 0.99, 1],
                rootMargin: '0px 0px 8192px 0px'
            });
            this._observer.observe(target);
            measure();
            return;
        }
        root.addEventListener('scroll', measure, false);
        this._scrollFallback = { root: root, fn: measure };
        measure();
    },

    _bindWindow: function () {
        if (this._windowResizeBound) return;
        this._windowResizeBound = true;
        const self = this;
        window.addEventListener('resize', function () {
            if (self._measureToolsVisibility) self._measureToolsVisibility();
            self._applyLayout();
        });
        if (!this._windowGestureBound) {
            this._windowGestureBound = true;
            const finish = function () {
                const wasIgnore = self._ignoreResizeUntilUp;
                self._ignoreResizeUntilUp = false;
                if (self._drag || self._resize) {
                    self._finishGesture();
                    return;
                }
                if (wasIgnore) self._applyLayout();
            };
            window.addEventListener('pointerup', finish, true);
            window.addEventListener('blur', function () {
                if (!self._drag && !self._resize) return;
                self._finishGesture();
            });
        }
        const editor = document.getElementById('editor-panel');
        if (editor) {
            let isEditorTransitioning = false;
            editor.addEventListener('transitionstart', function (e) {
                const prop = e && e.propertyName ? e.propertyName : '';
                if (prop === 'width' || prop === 'height' || prop === 'opacity') {
                    isEditorTransitioning = true;
                }
            });
            editor.addEventListener('transitionend', function (e) {
                const prop = e && e.propertyName ? e.propertyName : '';
                if (prop && prop !== 'width' && prop !== 'height' && prop !== 'opacity') return;
                isEditorTransitioning = false;
                self._applyLayout();
            });
            editor.addEventListener('transitioncancel', function () {
                isEditorTransitioning = false;
            });
            if (typeof ResizeObserver === 'function') {
                let roRaf = null;
                this._editorObserver = new ResizeObserver(function () {
                    if (isEditorTransitioning) return;
                    if (roRaf) return;
                    roRaf = requestAnimationFrame(function () {
                        roRaf = null;
                        if (isEditorTransitioning) return;
                        if (self._measureToolsVisibility) self._measureToolsVisibility();
                        if (self._drag || self._resize) {
                            self._syncClipToEditor();
                            return;
                        }
                        self._applyLayout();
                    });
                });
                this._editorObserver.observe(editor);
            }
        }
    },

    resetAfterLoad: function () {
        this._endGesture(false);
        this._pageSignature = '';
        this._closeFlyout();
        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }
        if (this._loadSyncTimer) {
            clearTimeout(this._loadSyncTimer);
            this._loadSyncTimer = null;
        }
        if (this._shell) {
            this._shell.style.pointerEvents = '';
            this._shell.style.visibility = '';
        }
        if (this._clip) {
            this._clip.style.pointerEvents = '';
            this._clip.style.visibility = '';
        }
        this._bindScrollObserver();
        this.refresh();
        const self = this;
        requestAnimationFrame(function () {
            self.refresh();
        });
        this._loadSyncTimer = setTimeout(function () {
            self._loadSyncTimer = null;
            self.refresh();
        }, 350);
    },

    _clampPosition: function (x, y) {
        const shell = this._shell;
        let w = 48;
        let h = 48;
        if (shell) {
            const r = shell.getBoundingClientRect();
            if (r.width > 0) w = r.width;
            if (r.height > 0) h = r.height;
        }
        const maxX = Math.max(0, window.innerWidth - w);
        const maxY = Math.max(0, window.innerHeight - h);
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x > maxX) x = maxX;
        if (y > maxY) y = maxY;
        return { x: Math.round(x), y: Math.round(y) };
    },

    _endGesture: function (persist) {
        const drag = this._drag;
        const rs = this._resize;
        const shell = this._shell;
        let patch = null;
        if (persist && (drag || rs) && shell) {
            if (rs) {
                const cols = rs.liveCols ? rs.liveCols : this.getPrefs().columns;
                const rows = rs.liveRows !== undefined && rs.liveRows !== null
                    ? rs.liveRows
                    : this.getPrefs().rows;
                if (rs.dockedEast) {
                    patch = { columns: cols };
                } else {
                    const r2 = shell.getBoundingClientRect();
                    patch = { x: r2.left, y: r2.top, columns: cols, rows: rows };
                }
            } else if (drag) {
                const r2 = shell.getBoundingClientRect();
                patch = { x: r2.left, y: r2.top };
            }
        }
        this._unbindDoc();
        this._drag = null;
        this._resize = null;
        return patch;
    },

    _finishGesture: function () {
        if (!this._drag && !this._resize) return;
        const patch = this._endGesture(true);
        if (patch && typeof Dashboard !== 'undefined' && Dashboard.setQuickToolbarPrefs) {
            Dashboard.setQuickToolbarPrefs(patch);
            return;
        }
        this._applyLayout();
    },

    _bindDragHandle: function (handle) {
        const self = this;
        if (typeof PointerDrag === 'undefined') return;
        PointerDrag.bind(handle, {
            raf: false,
            shouldStart: function () {
                return self.getPrefs().mode === 'floating';
            },
            onDown: function (e) {
                self._finishGesture();
                const el = self._shell;
                const r = el.getBoundingClientRect();
                self._drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
                return { el: el };
            },
            onMove: function (ev, ctx) {
                if (!self._drag || !ctx || !ctx.el) return;
                const pos = self._clampPosition(ev.clientX - self._drag.dx, ev.clientY - self._drag.dy);
                ctx.el.style.left = pos.x + 'px';
                ctx.el.style.top = pos.y + 'px';
            },
            onUp: function () {
                self._finishGesture();
            }
        });
    },

    _unbindDoc: function () {
        this._boundDocMove = null;
        this._boundDocUp = null;
    },

    _visibleButtonCount: function () {
        if (!this._grid) return 1;
        const nodes = this._grid.querySelectorAll('.btn-tool');
        let n = 0;
        for (let i = 0; i < nodes.length; i++) {
            if (!nodes[i].classList.contains('quick-toolbar-hidden')) n += 1;
        }
        return Math.max(1, n);
    },

    _clusterVisibleCount: function (cluster) {
        if (!cluster || cluster.classList.contains('quick-toolbar-hidden')) return 0;
        const btns = cluster.querySelectorAll('.btn-tool');
        let n = 0;
        for (let i = 0; i < btns.length; i++) {
            if (!btns[i].classList.contains('quick-toolbar-hidden')) n += 1;
        }
        return n;
    },

    _clampTracks: function (value) {
        let n = parseInt(value, 10);
        if (!Number.isFinite(n) || n < 1) n = 1;
        const max = Math.min(this.MAX_COLUMNS, this._visibleButtonCount());
        if (n > max) n = max;
        return n;
    },

    _handleExtraPx: function () {
        return this.HANDLE_SIZE_PX + this.GAP_PX;
    },

    _clusterMetrics: function () {
        const clusters = this._grid ? this._grid.querySelectorAll('.quick-toolbar-cluster') : [];
        const seps = this._grid ? this._grid.querySelectorAll('.quick-toolbar-sep') : [];
        const counts = [];
        for (let i = 0; i < clusters.length; i++) {
            const n = this._clusterVisibleCount(clusters[i]);
            if (n > 0) counts.push(n);
        }
        let sepCount = 0;
        for (let i = 0; i < seps.length; i++) {
            if (!seps[i].classList.contains('quick-toolbar-hidden')) sepCount += 1;
        }
        return { counts: counts, sepCount: sepCount };
    },

    _estimatePortraitSize: function (cols) {
        const n = this._clampTracks(cols);
        const btn = this._buttonSize();
        const gap = this.GAP_PX;
        const pad = this.PAD_PX * 2;
        const handleH = this._handleExtraPx();
        const metrics = this._clusterMetrics();
        let clustersH = 0;
        for (let i = 0; i < metrics.counts.length; i++) {
            const rows = Math.ceil(metrics.counts[i] / n);
            clustersH += rows * btn + Math.max(0, rows - 1) * gap;
        }
        const items = metrics.counts.length + metrics.sepCount;
        const flexGaps = Math.max(0, items - 1) * gap;
        const sepH = metrics.sepCount * 5;
        return {
            w: pad + n * btn + Math.max(0, n - 1) * gap,
            h: pad + handleH + clustersH + flexGaps + sepH
        };
    },

    _estimateLandscapeSize: function (rows) {
        const n = this._clampTracks(rows);
        const btn = this._buttonSize();
        const gap = this.GAP_PX;
        const pad = this.PAD_PX * 2;
        const handleW = this._handleExtraPx();
        const metrics = this._clusterMetrics();
        let clustersW = 0;
        let maxH = 0;
        for (let i = 0; i < metrics.counts.length; i++) {
            const count = metrics.counts[i];
            const usedRows = Math.min(n, count);
            const usedCols = Math.ceil(count / n);
            clustersW += usedCols * btn + Math.max(0, usedCols - 1) * gap;
            const h = usedRows * btn + Math.max(0, usedRows - 1) * gap;
            if (h > maxH) maxH = h;
        }
        const items = metrics.counts.length + metrics.sepCount;
        const flexGaps = Math.max(0, items - 1) * gap;
        const sepW = metrics.sepCount * 5;
        return {
            w: pad + handleW + clustersW + flexGaps + sepW,
            h: pad + maxH
        };
    },

    _rowsFromPortraitHeight: function (cols) {
        const pt = this._estimatePortraitSize(cols);
        const btn = this._buttonSize();
        const cell = btn + this.GAP_PX;
        const inner = Math.max(btn, pt.h - this.PAD_PX * 2 - this._handleExtraPx());
        return this._clampTracks(Math.round(inner / cell));
    },

    _fitLandscapeRows: function (cols, rows) {
        let n = this._clampTracks(rows || 1);
        while (n > 1) {
            const ls = this._estimateLandscapeSize(n);
            const pt = this._estimatePortraitSize(cols);
            if (ls.w >= ls.h) return n;
            if (ls.w <= pt.w) return n;
            n -= 1;
        }
        return n;
    },

    _shouldUseLandscape: function (floating, cols, rows) {
        if (!floating || !this._grid) return false;
        const already = this._grid.classList.contains('is-landscape');
        if (already) {
            const track = rows > 0 ? rows : this._rowsFromPortraitHeight(cols);
            const ls = this._estimateLandscapeSize(track);
            return ls.w >= ls.h;
        }
        const pt = this._estimatePortraitSize(cols);
        if (pt.w <= pt.h) return false;
        const base = rows > 0 ? rows : this._rowsFromPortraitHeight(cols);
        const fitted = this._fitLandscapeRows(cols, base);
        const ls = this._estimateLandscapeSize(fitted);
        return ls.w >= ls.h;
    },

    _setHandleOrientation: function (landscape) {
        const handle = this._handle;
        if (!handle) return;
        const icon = handle.querySelector('i');
        if (icon) {
            icon.className = landscape ? 'ph-bold ph-dots-six' : 'ph-bold ph-dots-six-vertical';
        }
    },

    _applyTrackTemplate: function (landscape, tracks) {
        if (!this._grid) return;
        const n = this._clampTracks(tracks);
        const size = 'repeat(' + n + ', var(--control-height, 2.25rem))';
        const auto = 'var(--control-height, 2.25rem)';
        const clusters = this._grid.querySelectorAll('.quick-toolbar-cluster');
        for (let i = 0; i < clusters.length; i++) {
            if (landscape) {
                clusters[i].style.gridTemplateColumns = '';
                clusters[i].style.gridTemplateRows = size;
                clusters[i].style.gridAutoFlow = 'column';
                clusters[i].style.gridAutoColumns = auto;
            } else {
                clusters[i].style.gridTemplateRows = '';
                clusters[i].style.gridAutoFlow = '';
                clusters[i].style.gridAutoColumns = '';
                clusters[i].style.gridTemplateColumns = size;
            }
        }
    },

    _syncLandscape: function (floating, cols, rows) {
        const grid = this._grid;
        const shell = this._shell;
        if (!grid || !shell) return false;
        const use = this._shouldUseLandscape(floating, cols, rows);
        grid.classList.toggle('is-landscape', use);
        shell.classList.toggle('is-landscape', use);
        this._setHandleOrientation(use);
        let activeRows = this._clampTracks(rows || 1);
        if (use) {
            const base = rows > 0 ? rows : this._rowsFromPortraitHeight(cols);
            activeRows = this._fitLandscapeRows(cols, base);
        }
        this._activeRows = use ? activeRows : 0;
        return use;
    },

    _columnsFromDrag: function (rs, ev) {
        const corner = rs.corner;
        const fromEast = corner === 'ne' || corner === 'se' || corner === 'e' || corner === 'east';
        const fromWest = corner === 'nw' || corner === 'sw' || corner === 'w';
        const fromNorth = corner === 'n' || corner === 'nw' || corner === 'ne';
        const fromSouth = corner === 's' || corner === 'sw' || corner === 'se';
        const pad = this.PAD_PX * 2;
        const gap = this.GAP_PX;
        const cell = rs.cell;
        const handleExtra = this._handleExtraPx();
        let width = rs.startW;
        let height = rs.startH;
        if (fromEast) width = rs.startW + (ev.clientX - rs.sx);
        else if (fromWest) width = rs.startW - (ev.clientX - rs.sx);
        if (fromNorth) height = rs.startH - (ev.clientY - rs.sy);
        else if (fromSouth) height = rs.startH + (ev.clientY - rs.sy);
        if (width < cell) width = cell;
        if (height < cell) height = cell;

        let cols = rs.startCols;
        let rows = rs.startRows > 0 ? rs.startRows : 1;
        let landscape = !!rs.startLandscape;

        if (fromEast || fromWest) {
            cols = this._clampTracks(Math.round((width - pad + gap) / cell));
            if (landscape) {
                const innerW = Math.max(cell, width - pad - handleExtra);
                const colTracks = Math.max(1, Math.round(innerW / cell));
                rows = this._clampTracks(Math.ceil(this._visibleButtonCount() / colTracks));
            }
        } else {
            if (landscape) {
                const inner = Math.max(cell, height - pad);
                rows = this._clampTracks(Math.round(inner / cell));
            } else {
                const inner = Math.max(cell, height - pad - handleExtra);
                const rowTracks = Math.max(1, Math.round(inner / cell));
                cols = this._clampTracks(Math.ceil(this._visibleButtonCount() / rowTracks));
            }
        }

        if (!rs.dockedEast) {
            if (height > width) {
                landscape = false;
                cols = this._clampTracks(Math.round((width - pad + gap) / cell));
            } else if (landscape) {
                const ls = this._estimateLandscapeSize(rows);
                if (ls.h > ls.w) {
                    landscape = false;
                    cols = this._clampTracks(Math.round((width - pad + gap) / cell));
                }
            } else {
                const pt = this._estimatePortraitSize(cols);
                if (pt.w > pt.h) {
                    const candidate = this._clampTracks(Math.round((height - pad - handleExtra) / cell));
                    const fitted = this._fitLandscapeRows(cols, candidate);
                    const ls = this._estimateLandscapeSize(fitted);
                    if (ls.w >= ls.h) {
                        landscape = true;
                        rows = fitted;
                    }
                }
            }
        } else {
            landscape = false;
        }

        return {
            cols: cols,
            rows: rows,
            landscape: landscape,
            fromEast: fromEast,
            fromWest: fromWest,
            fromNorth: fromNorth,
            fromSouth: fromSouth
        };
    },

    _bindResizeHandle: function (handle, corner) {
        const self = this;
        if (typeof PointerDrag === 'undefined') return;
        PointerDrag.bind(handle, {
            raf: false,
            shouldStart: function (e) {
                const prefs = self.getPrefs();
                const isEast = corner === 'east';
                const dockedEast = isEast && prefs.mode !== 'floating';
                const floatingResize = !isEast && prefs.mode === 'floating';
                if (!dockedEast && !floatingResize) return false;
                if (self._ignoreResizeUntilUp) return false;
                if (e.target && e.target.closest && e.target.closest('.btn-tool')) return false;
                return true;
            },
            onDown: function (e) {
                self._finishGesture();
                const prefs = self.getPrefs();
                const isEast = corner === 'east';
                const dockedEast = isEast && prefs.mode !== 'floating';
                const el = self._shell;
                const r = el.getBoundingClientRect();
                const btn = self._buttonSize();
                const cell = btn + self.GAP_PX;
                self._resize = {
                    corner: corner,
                    dockedEast: dockedEast,
                    startX: r.left,
                    startY: r.top,
                    startW: r.width,
                    startH: r.height,
                    startCols: prefs.columns,
                    startRows: prefs.rows > 0 ? prefs.rows : (self._activeRows || 1),
                    startLandscape: !!(self._grid && self._grid.classList.contains('is-landscape')),
                    cell: cell,
                    right: r.right,
                    bottom: r.bottom,
                    sx: e.clientX,
                    sy: e.clientY
                };
                return { el: el };
            },
            onMove: function (ev, ctx) {
                if (!self._resize || !ctx || !ctx.el) return;
                const el = ctx.el;
                const rs = self._resize;
                const drag = self._columnsFromDrag(rs, ev);
                self._applyTrackTemplate(drag.landscape, drag.landscape ? drag.rows : drag.cols);
                if (self._grid) self._grid.classList.toggle('is-landscape', drag.landscape);
                el.classList.toggle('is-landscape', drag.landscape);
                self._setHandleOrientation(drag.landscape);
                rs.liveCols = drag.cols;
                rs.liveRows = drag.rows;
                rs.liveLandscape = drag.landscape;
                self._activeRows = drag.landscape ? drag.rows : 0;
                if (rs.dockedEast) {
                    self._syncClipToEditor();
                    return;
                }
                const nr = el.getBoundingClientRect();
                let nx = rs.startX;
                let ny = rs.startY;
                if (drag.fromWest) nx = rs.right - nr.width;
                if (drag.fromNorth) ny = rs.bottom - nr.height;
                const pos = self._clampPosition(nx, ny);
                el.style.left = pos.x + 'px';
                el.style.top = pos.y + 'px';
            },
            onUp: function () {
                self._finishGesture();
            }
        });
    },

    _toggleFlyout: function (btn) {
        if (this._flyoutOpen) {
            this._closeFlyout();
            return;
        }
        this._openFlyout(btn);
    },

    _openFlyout: function (btn) {
        this._closeFlyout();
        if (typeof WidgetRegistry === 'undefined' || !WidgetRegistry.widgets) return;
        const fly = document.createElement('div');
        fly.className = 'quick-toolbar-flyout ds-editor-menu';
        fly.setAttribute('role', 'menu');
        fly.setAttribute('aria-label', 'Insert Widget');
        const heading = document.createElement('div');
        heading.className = 'ds-editor-menu-header quick-toolbar-flyout-heading';
        heading.textContent = 'Insert Widget';
        fly.appendChild(heading);
        const sortedTypes = Object.keys(WidgetRegistry.widgets).sort(function (a, b) {
            const wClassA = WidgetRegistry.widgets[a];
            const wClassB = WidgetRegistry.widgets[b];
            const labelA = (wClassA.metadata && wClassA.metadata.label ? wClassA.metadata.label : a).toLowerCase();
            const labelB = (wClassB.metadata && wClassB.metadata.label ? wClassB.metadata.label : b).toLowerCase();
            return labelA.localeCompare(labelB);
        });
        const self = this;
        sortedTypes.forEach(function (type) {
            if (typeof Dashboard !== 'undefined' && Dashboard.isWidgetHidden(type)) return;
            const wClass = WidgetRegistry.widgets[type];
            const meta = wClass.metadata || { label: type };
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'ds-editor-menu-item quick-toolbar-flyout-item';
            item.setAttribute('role', 'menuitem');
            const iconName = meta.icon || 'ph-plus';
            item.innerHTML = '<i class="ph-bold ' + iconName + '" aria-hidden="true"></i>'
                + (WidgetRegistry.getWidgetTagHtml ? WidgetRegistry.getWidgetTagHtml(type, true) : ('<span>' + meta.label + '</span>'));
            item.addEventListener('mousedown', function (e) { e.preventDefault(); });
            item.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self._closeFlyout();
                if (typeof Dashboard !== 'undefined' && Dashboard.addWidgetByType) {
                    Dashboard.addWidgetByType(type);
                }
            });
            fly.appendChild(item);
        });
        document.body.appendChild(fly);
        this._flyout = fly;
        this._flyoutOpen = true;
        if (this._buttons.insert) this._buttons.insert.setAttribute('aria-expanded', 'true');
        this._positionFlyout(btn, fly);
        requestAnimationFrame(function () {
            if (self._flyout === fly) fly.classList.add('is-open');
        });
    },

    _positionFlyout: function (btn, fly) {
        if (!fly) return;
        const shell = this._shell;
        const anchor = shell || btn;
        if (!anchor) return;
        const r = (btn || anchor).getBoundingClientRect();
        const shellR = shell ? shell.getBoundingClientRect() : r;
        const fw = fly.offsetWidth || 220;
        const fh = fly.offsetHeight || 200;
        let left = Math.round(shellR.right + 6);
        let top = Math.round(r.top);
        if (left + fw > window.innerWidth - 8) left = Math.round(shellR.left - fw - 6);
        if (left < 8) left = 8;
        if (top + fh > window.innerHeight - 8) top = Math.round(window.innerHeight - fh - 8);
        if (top < 8) top = 8;
        fly.style.left = left + 'px';
        fly.style.top = top + 'px';
    },

    _closeFlyout: function () {
        if (this._flyout && this._flyout.parentNode) this._flyout.parentNode.removeChild(this._flyout);
        this._flyout = null;
        this._flyoutOpen = false;
        if (this._buttons.insert) this._buttons.insert.setAttribute('aria-expanded', 'false');
    },

    _bindFlyoutDismiss: function () {
        const self = this;
        document.addEventListener('mousedown', function (e) {
            if (!self._flyoutOpen || !self._flyout) return;
            if (self._flyout.contains(e.target)) return;
            if (self._buttons.insert && (self._buttons.insert === e.target || self._buttons.insert.contains(e.target))) return;
            self._closeFlyout();
        }, true);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && self._flyoutOpen) self._closeFlyout();
        }, true);
    }
};

window.QuickToolbar = QuickToolbar;
