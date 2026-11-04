/**
 * Widget preset Save/Export picker: dual names, Presets tree, settings selection.
 * Depends: WidgetPresetModel, CustomDialog, Dashboard, EditorReorder.
 */
window.WidgetPresetPicker = {
    _resolve: null,
    _tree: null,
    _checked: null,
    _collapsed: null,
    _mode: 'changed',
    _action: 'export',
    _widget: null,
    _filter: '',
    _existing: null,
    _expandedMains: null,
    _selectedFullName: null,
    _selectedVariantId: null,
    _fileCache: null,
    _reorderControllers: null,
    _listenersBound: false,
    _boundKeydown: null,
    _drag: null,
    _resize: null,
    _boundDocMove: null,
    _boundDocUp: null,
    /** Session-only last position/size (not persisted across page reloads). */
    _sessionBounds: null,
    _nameCombo: null,
    _subCombo: null,

    _ensureBound: function () {
        if (this._listenersBound) return;
        const modal = document.getElementById('widget-preset-picker-modal');
        if (!modal) return;

        const appendBtn = document.getElementById('wpp-btn-append');
        const matchPresetBtn = document.getElementById('wpp-btn-match-preset');
        const filterInput = document.getElementById('wpp-filter');
        const content = modal.querySelector('.wpp-modal-content');
        const header = content ? content.querySelector('.modal-header') : null;
        const resizeHandle = document.getElementById('wpp-resize-handle');

        if (appendBtn) appendBtn.onclick = () => { void this._appendFromDisk(); };
        if (matchPresetBtn) matchPresetBtn.onclick = () => { void this._matchSelectedPresetChecks(); };
        const selectNoneBtn = document.getElementById('wpp-btn-select-none');
        const selectAllBtn = document.getElementById('wpp-btn-select-all');
        if (selectNoneBtn) selectNoneBtn.onclick = () => { this._selectAllChecks(false); };
        if (selectAllBtn) selectAllBtn.onclick = () => { this._selectAllChecks(true); };

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close(null);
        });

        document.querySelectorAll('#wpp-mode-group .wpp-mode-option').forEach((btn) => {
            btn.addEventListener('click', () => {
                this._setMode(btn.getAttribute('data-wpp-mode'));
            });
        });

        if (filterInput) {
            filterInput.addEventListener('input', () => {
                this._filter = filterInput.value || '';
                this._renderBody();
            });
        }

        this._ensureNameComboboxes();

        if (header) this._bindDragHeader(header);
        if (resizeHandle) this._bindResize(resizeHandle);
        try {
            localStorage.removeItem('dashboardstudio-widget-preset-picker-bounds');
        } catch (e) { /* ignore */ }

        this._boundKeydown = (e) => {
            if (e.key !== 'Escape') return;
            const el = document.getElementById('widget-preset-picker-modal');
            if (!el || !el.classList.contains('show')) return;
            this.close(null);
        };
        document.addEventListener('keydown', this._boundKeydown);

        this._listenersBound = true;
    },

    _bindChromeButtons: function () {
        const self = this;
        const closeBtn = document.getElementById('wpp-btn-close');
        const cancelBtn = document.getElementById('wpp-btn-cancel');
        const confirmBtn = document.getElementById('wpp-btn-confirm');
        if (closeBtn) closeBtn.onclick = function () { self.close(null); };
        if (cancelBtn) cancelBtn.onclick = function () { self.close(null); };
        if (confirmBtn) confirmBtn.onclick = function () { void self.confirm(); };
    },

    _saveSessionBounds: function (el) {
        if (!el) return;
        const r = el.getBoundingClientRect();
        this._sessionBounds = {
            left: Math.round(r.left),
            top: Math.round(r.top),
            w: Math.round(r.width),
            h: Math.round(r.height)
        };
    },

    _clampPanelRect: function (left, top, w, h) {
        const maxW = Math.max(320, window.innerWidth - 16);
        const maxH = Math.max(240, window.innerHeight - 16);
        let width = Math.min(Math.max(w, 320), maxW);
        let height = Math.min(Math.max(h, 280), maxH);
        let x = left;
        let y = top;
        if (x > window.innerWidth - 80) x = window.innerWidth - 80;
        if (y > window.innerHeight - 48) y = window.innerHeight - 48;
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x + width > window.innerWidth - 8) x = Math.max(0, window.innerWidth - width - 8);
        if (y + height > window.innerHeight - 8) y = Math.max(0, window.innerHeight - height - 8);
        return { left: x, top: y, w: width, h: height };
    },

    _getPanelEl: function () {
        const modal = document.getElementById('widget-preset-picker-modal');
        return modal ? modal.querySelector('.wpp-modal-content') : null;
    },

    _defaultPanelBounds: function () {
        const w = Math.min(36 * 16, window.innerWidth * 0.94);
        const h = Math.min(window.innerHeight * 0.72, 44 * 16);
        const left = Math.max(0, Math.round((window.innerWidth - w) / 2));
        const top = Math.max(0, Math.round((window.innerHeight - h) / 2));
        return this._clampPanelRect(left, top, w, h);
    },

    _applyPanelLayout: function () {
        const el = this._getPanelEl();
        if (!el) return;
        const bounds = this._sessionBounds
            ? this._clampPanelRect(
                this._sessionBounds.left,
                this._sessionBounds.top,
                this._sessionBounds.w,
                this._sessionBounds.h
            )
            : this._defaultPanelBounds();
        el.style.transform = 'none';
        el.style.left = bounds.left + 'px';
        el.style.top = bounds.top + 'px';
        el.style.width = bounds.w + 'px';
        el.style.height = bounds.h + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.maxHeight = 'none';
    },

    _bindDragHeader: function (header) {
        const self = this;
        if (typeof PointerDrag === 'undefined') return;
        header.style.touchAction = 'none';
        PointerDrag.bind(header, {
            raf: false,
            shouldStart: function (e) {
                if (e.target && e.target.closest) {
                    if (e.target.closest('button, a, input, label, .ds-dialog-close')) return false;
                }
                return !!self._getPanelEl();
            },
            onDown: function (e) {
                const el = self._getPanelEl();
                const r = el.getBoundingClientRect();
                el.style.transform = 'none';
                el.style.left = r.left + 'px';
                el.style.top = r.top + 'px';
                el.style.width = r.width + 'px';
                el.style.height = r.height + 'px';
                el.style.right = 'auto';
                el.style.bottom = 'auto';
                self._drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
                return { el: el };
            },
            onMove: function (ev, ctx) {
                if (!self._drag || !ctx || !ctx.el) return;
                let x = ev.clientX - self._drag.dx;
                let y = ev.clientY - self._drag.dy;
                const maxX = window.innerWidth - 80;
                const maxY = window.innerHeight - 48;
                if (x < 0) x = 0;
                if (y < 0) y = 0;
                if (x > maxX) x = maxX;
                if (y > maxY) y = maxY;
                ctx.el.style.left = x + 'px';
                ctx.el.style.top = y + 'px';
            },
            onUp: function (ev, ctx) {
                self._drag = null;
                if (ctx && ctx.el) self._saveSessionBounds(ctx.el);
            }
        });
    },

    _bindResize: function (handle) {
        const self = this;
        if (typeof PointerDrag === 'undefined') return;
        handle.style.touchAction = 'none';
        PointerDrag.bind(handle, {
            raf: false,
            onDown: function (e) {
                const el = self._getPanelEl();
                if (!el) return false;
                const r = el.getBoundingClientRect();
                el.style.transform = 'none';
                el.style.left = r.left + 'px';
                el.style.top = r.top + 'px';
                self._resize = { startW: r.width, startH: r.height, sx: e.clientX, sy: e.clientY, left: r.left, top: r.top };
                return { el: el };
            },
            onMove: function (ev, ctx) {
                if (!self._resize || !ctx || !ctx.el) return;
                const w = self._resize.startW + (ev.clientX - self._resize.sx);
                const h = self._resize.startH + (ev.clientY - self._resize.sy);
                const clamped = self._clampPanelRect(
                    parseFloat(ctx.el.style.left) || self._resize.left,
                    parseFloat(ctx.el.style.top) || self._resize.top,
                    w,
                    h
                );
                ctx.el.style.width = clamped.w + 'px';
                ctx.el.style.height = clamped.h + 'px';
            },
            onUp: function (ev, ctx) {
                self._resize = null;
                if (ctx && ctx.el) self._saveSessionBounds(ctx.el);
            }
        });
    },

    _teardownDragResize: function () {
        this._drag = null;
        this._resize = null;
    },

    open: function (options) {
        options = options || {};
        const widget = options.widget;
        if (!widget || typeof WidgetPresetModel === 'undefined') {
            return Promise.resolve(null);
        }

        this._ensureBound();
        this._bindChromeButtons();
        this._destroyReorders();

        this._widget = widget;
        this._action = options.action === 'save' ? 'save' : 'export';
        this._mode = 'changed';
        this._filter = '';
        this._existing = [];
        this._expandedMains = {};
        this._selectedFullName = null;
        this._selectedVariantId = null;
        this._fileCache = {};
        this._exportWorkingKey = 'export:working';
        this._tree = WidgetPresetModel.buildTree(widget);
        this._checked = {};
        this._collapsed = {};
        WidgetPresetModel.collectChangedPathKeys(this._tree).forEach((k) => {
            this._checked[k] = true;
        });
        this._tree.forEach((branch) => {
            if (branch && branch.id) this._collapsed[branch.id] = false;
        });

        return new Promise((resolve) => {
            this._resolve = resolve;
            this._render();
            const modal = document.getElementById('widget-preset-picker-modal');
            if (!modal) {
                console.error('widget-preset-picker-modal not found');
                resolve(null);
                return;
            }
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
            this._applyPanelLayout();
            const nameInput = document.getElementById('wpp-name');
            const defaultName = options.defaultName
                || (widget.overrides && widget.overrides.metaName)
                || widget.id
                || 'Preset';
            if (this._subCombo) this._subCombo.setValue('');
            else {
                const subInput = document.getElementById('wpp-sub-name');
                if (subInput) subInput.value = '';
            }
            if (this._nameCombo) this._nameCombo.setValue(defaultName);
            else if (nameInput) nameInput.value = defaultName;
            if (nameInput) {
                nameInput._wppSkipFocusMenu = true;
                nameInput.focus();
                nameInput.select();
            }
            this._updateConfirmButton();
            void this._loadExistingPresets();
        });
    },

    close: function (result) {
        const modal = document.getElementById('widget-preset-picker-modal');
        if (modal) {
            modal.classList.remove('show');
            modal.classList.remove('wpp-expanded');
            modal.setAttribute('aria-hidden', 'true');
        }
        try { this._hideNameComboboxMenus(); } catch (e) { /* ignore */ }
        try { this._teardownDragResize(); } catch (e) { /* ignore */ }
        try { this._destroyReorders(); } catch (e) { /* ignore */ }
        const panel = this._getPanelEl();
        if (panel) {
            panel.style.left = '';
            panel.style.top = '';
            panel.style.width = '';
            panel.style.height = '';
            panel.style.transform = '';
            panel.style.right = '';
            panel.style.bottom = '';
            panel.style.maxHeight = '';
        }
        const resolve = this._resolve;
        this._resolve = null;
        this._widget = null;
        this._tree = null;
        this._existing = null;
        this._fileCache = null;
        if (typeof resolve === 'function') resolve(result || null);
    },

    _destroyReorders: function () {
        if (!Array.isArray(this._reorderControllers)) {
            this._reorderControllers = [];
            return;
        }
        this._reorderControllers.forEach((c) => {
            if (c && typeof c.destroy === 'function') c.destroy();
        });
        this._reorderControllers = [];
    },

    _hideNameComboboxMenus: function () {
        if (this._nameCombo && typeof this._nameCombo.hide === 'function') this._nameCombo.hide();
        if (this._subCombo && typeof this._subCombo.hide === 'function') this._subCombo.hide();
    },

    /**
     * Visible label from mixed API values. Never assign booleans to textContent
     * (element.textContent = false renders the word "false").
     */
    _labelText: function () {
        for (let i = 0; i < arguments.length; i++) {
            const v = arguments[i];
            if (typeof v === 'number' && isFinite(v)) return String(v);
            if (typeof v !== 'string') continue;
            const s = v.trim();
            if (!s) continue;
            if (s === 'false' || s === 'true' || s === 'undefined' || s === 'null') continue;
            return s;
        }
        return '';
    },

    _entryLabel: function (entry) {
        if (!entry || typeof entry !== 'object') return '';
        const direct = this._labelText(entry.displayName, entry.name, entry.fileId, entry.presetName);
        if (direct) return direct;
        if (typeof entry.fullName === 'string' && entry.fullName.trim()) {
            const parts = entry.fullName.split('/');
            return this._labelText(parts[parts.length - 1], entry.fullName);
        }
        return '';
    },

    _currentMainName: function () {
        const nameInput = document.getElementById('wpp-name');
        return nameInput ? String(nameInput.value || '').trim() : '';
    },

    _currentSubName: function () {
        const subInput = document.getElementById('wpp-sub-name');
        return subInput ? String(subInput.value || '').trim() : '';
    },

    _mainNameChoices: function () {
        const entries = Array.isArray(this._existing) ? this._existing : [];
        const names = [];
        const seen = {};
        entries.forEach((e) => {
            const n = this._entryLabel(e);
            if (!n) return;
            const key = n.toLowerCase();
            if (seen[key]) return;
            seen[key] = true;
            names.push(n);
        });
        return names;
    },

    _subNameChoices: function () {
        const entry = this._findExistingByMainName(this._currentMainName());
        if (!entry || !this._fileCache) return [];
        const file = this._fileCache[entry.fullName];
        if (!file || !Array.isArray(file.variants)) return [];
        return file.variants.map((v) => this._labelText(v && v.name, v && v.id)).filter(Boolean);
    },

    _prefetchSubChoicesForCurrentMain: async function () {
        const entry = this._findExistingByMainName(this._currentMainName());
        if (!entry) return;
        await this._getCachedFile(entry);
        if (this._subCombo && typeof this._subCombo.refresh === 'function') this._subCombo.refresh();
    },

    _refreshNameComboboxMenus: function () {
        if (this._nameCombo && typeof this._nameCombo.refresh === 'function') this._nameCombo.refresh();
        if (this._subCombo && typeof this._subCombo.refresh === 'function') this._subCombo.refresh();
    },

    _ensureNameComboboxes: function () {
        const nameInput = document.getElementById('wpp-name');
        const subInput = document.getElementById('wpp-sub-name');
        if (!this._nameCombo && nameInput) {
            this._nameCombo = this._attachFilteredCombobox(nameInput, {
                emptyText: 'No matching presets',
                getChoices: () => this._mainNameChoices(),
                onInput: () => {
                    this._syncExistingSelection();
                    this._updateConfirmButton();
                    void this._prefetchSubChoicesForCurrentMain();
                },
                onCommit: (name, opts) => {
                    void this._onMainNameCommit(name, opts);
                }
            });
        }
        if (!this._subCombo && subInput) {
            this._subCombo = this._attachFilteredCombobox(subInput, {
                emptyText: 'No matching subs',
                getChoices: () => this._subNameChoices(),
                onInput: () => {
                    this._syncExistingSelection();
                    this._updateConfirmButton();
                },
                onCommit: (name) => {
                    void this._onSubNameCommit(name);
                }
            });
        }
    },

    /**
     * Type-or-pick combobox on an existing input (caret + filtered menu).
     * Caret / focus lists every choice. Typing filters. New names are allowed.
     */
    _attachFilteredCombobox: function (input, spec) {
        spec = spec || {};
        if (!input || input._wppComboAttached) return null;
        input._wppComboAttached = true;
        const wrap = input.closest('.wpp-name-combobox') || input.parentElement;
        let lastCommitted = String(input.value || '').trim();
        let filterActive = false;

        const caret = document.createElement('i');
        caret.className = 'ph-bold ph-caret-down bound-topic-caret wpp-name-caret';
        caret.setAttribute('aria-hidden', 'true');

        const menuWrap = document.createElement('div');
        menuWrap.className = 'ds-editor-menu bound-topic-menu wpp-name-combobox-menu';
        menuWrap.style.cssText = 'display:none; position:fixed; z-index:10050;';

        const hideMenu = () => { menuWrap.style.display = 'none'; };

        const allChoices = () => {
            try {
                return typeof spec.getChoices === 'function' ? (spec.getChoices() || []) : [];
            } catch (e) {
                return [];
            }
        };

        const renderMenu = (filterStr) => {
            menuWrap.innerHTML = '';
            const rawChoices = allChoices();
            const unfiltered = Array.isArray(rawChoices)
                ? rawChoices.map((c) => this._labelText(c)).filter(Boolean)
                : [];
            let choices = unfiltered;
            if (filterStr) {
                const lower = String(filterStr).toLowerCase();
                const filtered = unfiltered.filter((c) => c.toLowerCase().includes(lower));
                if (filtered.length > 0) choices = filtered;
            }
            if (choices.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'ds-editor-menu-empty';
                empty.textContent = spec.emptyText || 'Type a new name';
                menuWrap.appendChild(empty);
                return;
            }
            choices.forEach((id) => {
                const item = document.createElement('div');
                item.className = 'ds-editor-menu-item truncate';
                item.textContent = id;
                if (typeof Editor !== 'undefined' && typeof Editor._bindOverflowTitle === 'function') {
                    Editor._bindOverflowTitle(item, item, function () { return id; });
                }
                item.onmousedown = (e) => {
                    e.preventDefault();
                    input.value = id;
                    lastCommitted = id;
                    hideMenu();
                    const result = typeof spec.onCommit === 'function'
                        ? spec.onCommit(id, { picked: true })
                        : null;
                    Promise.resolve(result).then(() => { input.blur(); });
                };
                menuWrap.appendChild(item);
            });
        };

        const positionMenu = () => {
            if (typeof Editor !== 'undefined' && typeof Editor._positionFixedDropdownBelowInput === 'function') {
                Editor._positionFixedDropdownBelowInput(menuWrap, input, true);
            }
            const cap = 12 * 16;
            const current = parseFloat(menuWrap.style.maxHeight) || cap;
            menuWrap.style.maxHeight = Math.min(current, cap) + 'px';
        };

        const showMenu = (useFilter) => {
            filterActive = !!useFilter;
            if (!document.body.contains(menuWrap)) document.body.appendChild(menuWrap);
            renderMenu(filterActive ? input.value : '');
            positionMenu();
            menuWrap.style.display = 'block';
        };

        const applyCommitIfChanged = (opts) => {
            const t = String(input.value || '').trim();
            input.value = t;
            if (t === lastCommitted) return;
            lastCommitted = t;
            if (typeof spec.onCommit === 'function') spec.onCommit(t, opts || {});
        };

        input.addEventListener('input', () => {
            showMenu(true);
            if (typeof spec.onInput === 'function') spec.onInput(input.value);
        });
        input.addEventListener('focus', () => {
            if (input._wppSkipFocusMenu) {
                input._wppSkipFocusMenu = false;
                return;
            }
            showMenu(false);
        });
        input.addEventListener('blur', () => {
            setTimeout(() => {
                hideMenu();
                applyCommitIfChanged();
            }, 150);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyCommitIfChanged();
                input.blur();
            }
        });

        const onScroll = () => {
            if (menuWrap.style.display !== 'none') positionMenu();
        };
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);

        caret.onmousedown = (e) => e.preventDefault();
        caret.onclick = () => {
            if (menuWrap.style.display === 'none') {
                if (document.activeElement === input) showMenu(false);
                else input.focus();
            } else {
                hideMenu();
            }
        };
        if (wrap) wrap.appendChild(caret);
        if (typeof Editor !== 'undefined' && typeof Editor._bindOverflowTitle === 'function') {
            Editor._bindOverflowTitle(input, input, function () { return input.value; });
        }

        return {
            hide: hideMenu,
            refresh: () => {
                if (menuWrap.style.display === 'none') return;
                renderMenu(filterActive ? input.value : '');
                positionMenu();
            },
            setValue: (v) => {
                const t = String(v || '').trim();
                lastCommitted = t;
                input.value = t;
            }
        };
    },

    _onMainNameCommit: async function (name, opts) {
        opts = opts || {};
        const entry = this._findExistingByMainName(name);
        if (!entry) {
            this._selectedFullName = null;
            this._selectedVariantId = null;
            this._syncExistingSelection();
            this._updateConfirmButton();
            this._updateMatchPresetButton();
            return;
        }
        const mainChanged = this._selectedFullName !== entry.fullName;
        this._selectedFullName = entry.fullName;
        if (opts.picked && mainChanged) {
            this._selectedVariantId = null;
            if (this._subCombo) this._subCombo.setValue('');
        }
        if ((entry.variantCount || 1) > 1) this._expandedMains[entry.fullName] = true;
        await this._getCachedFile(entry);
        if (opts.picked && (entry.variantCount || 1) > 1) this._renderExistingList();
        else {
            this._syncExistingSelection();
            this._updateConfirmButton();
            this._updateMatchPresetButton();
        }
    },

    _onSubNameCommit: async function (name) {
        const entry = this._findExistingByMainName(this._currentMainName());
        if (!entry) {
            this._selectedVariantId = null;
            this._syncExistingSelection();
            this._updateConfirmButton();
            this._updateMatchPresetButton();
            return;
        }
        this._selectedFullName = entry.fullName;
        const file = await this._getCachedFile(entry);
        const sub = String(name || '').trim();
        if (file && sub && typeof WidgetPresetModel !== 'undefined') {
            const idx = WidgetPresetModel.findVariantIndexByName(file, sub);
            this._selectedVariantId = idx >= 0 ? file.variants[idx].id : null;
            if (idx >= 0 && (entry.variantCount || 1) > 1) {
                this._expandedMains[entry.fullName] = true;
                this._renderExistingList();
                return;
            }
        } else {
            this._selectedVariantId = null;
        }
        this._syncExistingSelection();
        this._updateConfirmButton();
        this._updateMatchPresetButton();
    },

    _findExistingByMainName: function (mainName) {
        const n = String(mainName || '').trim().toLowerCase();
        if (!n || !Array.isArray(this._existing)) return null;
        for (let i = 0; i < this._existing.length; i++) {
            const e = this._existing[i];
            if (e && this._entryLabel(e).toLowerCase() === n) return e;
        }
        return null;
    },

    _isExportWorkingEntry: function (entry) {
        return !!(entry && (entry.source === 'export' || entry.fullName === this._exportWorkingKey));
    },

    _syncAppendButton: function () {
        const appendWrap = document.getElementById('wpp-append-wrap');
        if (!appendWrap) return;
        appendWrap.hidden = this._action !== 'export';
    },

    _loadExistingPresets: async function () {
        const wrap = document.getElementById('wpp-existing-wrap');
        const listEl = document.getElementById('wpp-existing-list');
        const hintEl = document.getElementById('wpp-existing-hint');
        if (!wrap || !listEl) return;

        this._syncAppendButton();

        if (this._action === 'export') {
            // Export: only show Presets list when an existing file was loaded via Append.
            const working = this._fileCache[this._exportWorkingKey];
            if (!working || !Array.isArray(working.variants) || working.variants.length === 0) {
                wrap.hidden = true;
                this._existing = [];
                listEl.innerHTML = '';
                this._updateConfirmButton();
                return;
            }
            this._existing = [{
                name: this._labelText(working.name, working.id),
                displayName: this._labelText(working.name, working.id),
                fileId: this._labelText(working.id, working.name),
                fullName: this._exportWorkingKey,
                variantCount: working.variants.length,
                source: 'export'
            }];
            wrap.hidden = false;
            this._expandedMains[this._exportWorkingKey] = working.variants.length > 1;
            this._renderExistingList();
            this._syncExistingSelection();
            this._updateConfirmButton();
            void this._prefetchSubChoicesForCurrentMain();
            this._refreshNameComboboxMenus();
            return;
        }

        // Homey Save
        wrap.hidden = false;
        listEl.innerHTML = '<div class="p-2 text-center ds-file-list-empty text-xs">Loading...</div>';
        if (hintEl) hintEl.textContent = 'Loading...';

        let entries = [];
        try {
            const widgetType = (typeof Dashboard !== 'undefined' && typeof Dashboard._getWidgetTypeByInstance === 'function')
                ? Dashboard._getWidgetTypeByInstance(this._widget)
                : null;
            if (widgetType && typeof Dashboard._loadUserWidgetPresets === 'function') {
                const user = await Dashboard._loadUserWidgetPresets(widgetType);
                entries = Array.isArray(user) ? user.slice() : [];
            }
        } catch (e) {
            entries = [];
        }

        if (this._action !== 'save') return;
        this._existing = entries;
        this._renderExistingList();
        this._syncExistingSelection();
        this._updateConfirmButton();
        void this._prefetchSubChoicesForCurrentMain();
        this._refreshNameComboboxMenus();
    },

    _appendFromDisk: async function () {
        if (this._action !== 'export') return;
        if (typeof StorageRegistry === 'undefined') {
            await CustomDialog.alert('Local file storage is not available.', 'Error');
            return;
        }
        try {
            const result = await StorageRegistry.get('local').load('widgetpreset');
            const data = result.data || result;
            const widgetType = (typeof Dashboard !== 'undefined' && typeof Dashboard._getWidgetTypeByInstance === 'function')
                ? Dashboard._getWidgetTypeByInstance(this._widget)
                : null;
            const normalized = (typeof Dashboard !== 'undefined' && typeof Dashboard._normalizeWidgetPresetData === 'function')
                ? Dashboard._normalizeWidgetPresetData(data)
                : WidgetPresetModel.normalizePreset(data);
            if (!normalized || !Array.isArray(normalized.variants) || normalized.variants.length === 0) {
                await CustomDialog.alert('Invalid preset file format. Expected a multi-variant preset file.', 'Error');
                return;
            }
            if (normalized.widgetType && widgetType && String(normalized.widgetType) !== String(widgetType)) {
                await CustomDialog.alert(
                    'This preset is for widget type "' + normalized.widgetType + '", but the selected widget is "' + widgetType + '".',
                    'Preset Type Mismatch'
                );
                return;
            }
            this._fileCache[this._exportWorkingKey] = normalized;
            this._selectedFullName = this._exportWorkingKey;
            this._selectedVariantId = null;
            this._setNameFields(normalized.name || '', '');
            this._expandedMains[this._exportWorkingKey] = normalized.variants.length > 1;
            await this._loadExistingPresets();
        } catch (err) {
            if (err) await CustomDialog.alert(err.message || String(err), 'Import Error');
        }
    },

    _getCachedFile: async function (entry) {
        if (!entry || !entry.fullName) return null;
        if (this._fileCache[entry.fullName]) return this._fileCache[entry.fullName];
        if (this._isExportWorkingEntry(entry)) return null;
        if (typeof Dashboard === 'undefined' || typeof Dashboard._loadUserWidgetPresetFile !== 'function') return null;
        const file = await Dashboard._loadUserWidgetPresetFile(entry.fullName);
        if (file) this._fileCache[entry.fullName] = file;
        return file;
    },

    _persistEntryFile: async function (entry, file) {
        if (this._isExportWorkingEntry(entry)) {
            this._fileCache[entry.fullName] = file;
            entry.displayName = file.name;
            entry.name = file.name;
            entry.variantCount = file.variants.length;
            entry.fileId = file.id;
            return true;
        }
        if (typeof Dashboard === 'undefined' || typeof Dashboard.saveUserWidgetPresetFile !== 'function') {
            await CustomDialog.alert('Server unavailable', 'Error');
            return false;
        }
        return Dashboard.saveUserWidgetPresetFile(entry.fullName, file);
    },

    _setNameFields: function (mainName, subName) {
        if (this._nameCombo) this._nameCombo.setValue(mainName || '');
        else {
            const nameInput = document.getElementById('wpp-name');
            if (nameInput) nameInput.value = mainName || '';
        }
        if (this._subCombo) this._subCombo.setValue(subName || '');
        else {
            const subInput = document.getElementById('wpp-sub-name');
            if (subInput) subInput.value = subName || '';
        }
        void this._prefetchSubChoicesForCurrentMain();
        this._syncExistingSelection();
        this._updateConfirmButton();
        this._updateMatchPresetButton();
    },

    _renderExistingList: function () {
        this._destroyReorders();
        const listEl = document.getElementById('wpp-existing-list');
        const hintEl = document.getElementById('wpp-existing-hint');
        const wrap = document.getElementById('wpp-existing-wrap');
        if (!listEl || !wrap) return;

        const entries = Array.isArray(this._existing) ? this._existing : [];
        if (this._action === 'export' && entries.length === 0) {
            wrap.hidden = true;
            return;
        }
        if (this._action !== 'save' && this._action !== 'export') {
            wrap.hidden = true;
            return;
        }

        wrap.hidden = false;
        listEl.innerHTML = '';

        if (entries.length === 0) {
            listEl.innerHTML = '<div class="p-2 text-center ds-file-list-empty text-xs">No saved presets yet. Type a new name above.</div>';
            if (hintEl) hintEl.textContent = 'New preset';
            return;
        }

        if (hintEl) {
            hintEl.textContent = this._action === 'export'
                ? 'Edit subs, then Export'
                : 'Click a row to target overwrite';
        }

        entries.forEach((entry) => {
            const row = this._buildMainRow(entry);
            if (row) listEl.appendChild(row);
        });

        this._syncExistingSelection();
    },

    _buildMainRow: function (entry) {
        const label = this._entryLabel(entry);
        if (!label) return null;
        const block = document.createElement('div');
        block.className = 'wpp-preset-block';
        if (typeof entry.fullName === 'string' && entry.fullName) block.dataset.fullName = entry.fullName;

        const row = document.createElement('div');
        row.className = 'wpp-preset-row wpp-preset-row--main';
        row.setAttribute('role', 'treeitem');

        const multi = (entry.variantCount || 1) > 1;
        const expanded = !!this._expandedMains[entry.fullName];

        const twisty = document.createElement('button');
        twisty.type = 'button';
        twisty.className = 'wpp-preset-twisty' + (expanded ? '' : ' is-collapsed');
        twisty.innerHTML = '<i class="ph-bold ph-caret-down"></i>';
        twisty.title = expanded ? 'Collapse' : 'Expand';
        twisty.hidden = !multi;
        if (!multi) {
            const spacer = document.createElement('span');
            spacer.className = 'wpp-preset-twisty-spacer';
            row.appendChild(spacer);
        } else {
            twisty.onclick = (e) => {
                e.stopPropagation();
                void this._toggleExpand(entry);
            };
            row.appendChild(twisty);
        }

        const nameEl = document.createElement('span');
        nameEl.className = 'wpp-preset-row-name';
        nameEl.textContent = label;
        row.appendChild(nameEl);

        if (multi) {
            const count = document.createElement('span');
            count.className = 'wpp-preset-row-count';
            count.textContent = String(entry.variantCount);
            row.appendChild(count);
        }

        const actions = document.createElement('div');
        actions.className = 'wpp-preset-row-actions';
        if (this._action === 'save') {
            actions.appendChild(this._toolBtn('ph-download-simple', 'Export', (e) => {
                e.stopPropagation();
                void this._exportMain(entry);
            }));
        }
        actions.appendChild(this._toolBtn('ph-pencil-simple', 'Rename', (e) => {
            e.stopPropagation();
            void this._renameMain(entry);
        }));
        actions.appendChild(this._toolBtn('ph-trash', 'Delete', (e) => {
            e.stopPropagation();
            void this._deleteMain(entry);
        }, true));
        row.appendChild(actions);

        row.onclick = () => {
            if (multi) {
                void this._toggleExpand(entry, true);
                return;
            }
            this._selectedFullName = entry.fullName;
            this._selectedVariantId = null;
            this._setNameFields(label, '');
        };

        block.appendChild(row);

        const kids = document.createElement('div');
        kids.className = 'wpp-preset-subs';
        if (typeof entry.fullName === 'string' && entry.fullName) kids.dataset.fullName = entry.fullName;
        kids.hidden = !multi || !expanded;
        block.appendChild(kids);

        if (multi && expanded) {
            void this._fillSubRows(entry, kids);
        }

        return block;
    },

    _toolBtn: function (icon, title, onClick, danger) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-tool btn-tool-icon-only wpp-preset-action' + (danger ? ' wpp-preset-action--danger' : '');
        btn.title = title;
        btn.innerHTML = '<i class="ph-bold ' + icon + '"></i>';
        btn.onclick = onClick;
        return btn;
    },

    _toggleExpand: async function (entry, forceOpen) {
        const was = !!this._expandedMains[entry.fullName];
        const next = forceOpen ? true : !was;
        this._expandedMains[entry.fullName] = next;
        this._renderExistingList();
    },

    _fillSubRows: async function (entry, host) {
        host.innerHTML = '<div class="p-2 text-center ds-file-list-empty text-xs">Loading...</div>';
        const file = await this._getCachedFile(entry);
        if (!file || !Array.isArray(file.variants)) {
            host.innerHTML = '<div class="p-2 text-center ds-file-list-empty text-xs">Could not load variants.</div>';
            return;
        }
        entry.variantCount = file.variants.length;
        host.innerHTML = '';

        file.variants.forEach((v) => {
            const row = document.createElement('div');
            row.className = 'wpp-preset-row wpp-preset-row--sub ds-reorder-item';
            row.dataset.variantId = typeof v.id === 'string' ? v.id : '';

            if (typeof EditorReorder !== 'undefined' && typeof EditorReorder.createDragHandle === 'function') {
                row.appendChild(EditorReorder.createDragHandle());
            }

            const nameEl = document.createElement('span');
            nameEl.className = 'wpp-preset-row-name';
            nameEl.textContent = this._labelText(v.name, v.id) || 'Sub-preset';
            row.appendChild(nameEl);

            const actions = document.createElement('div');
            actions.className = 'wpp-preset-row-actions';
            actions.appendChild(this._toolBtn('ph-pencil-simple', 'Rename', (e) => {
                e.stopPropagation();
                void this._renameSub(entry, v);
            }));
            actions.appendChild(this._toolBtn('ph-trash', 'Delete', (e) => {
                e.stopPropagation();
                void this._deleteSub(entry, v);
            }, true));
            row.appendChild(actions);

            row.onclick = () => {
                this._selectedFullName = entry.fullName;
                this._selectedVariantId = v.id;
                this._setNameFields(this._labelText(file.name) || this._entryLabel(entry), this._labelText(v.name, v.id));
            };
            host.appendChild(row);
        });

        if (typeof EditorReorder !== 'undefined' && typeof EditorReorder.attach === 'function') {
            const ctrl = EditorReorder.attach(host, {
                itemSelector: '.wpp-preset-row--sub',
                onReorder: (from, to) => {
                    void this._reorderSubs(entry, from, to);
                }
            });
            if (!this._reorderControllers) this._reorderControllers = [];
            this._reorderControllers.push(ctrl);
        }

        this._syncExistingSelection();
    },

    _exportMain: async function (entry) {
        const file = await this._getCachedFile(entry);
        if (!file) {
            await CustomDialog.alert('Could not load preset for export.', 'Export');
            return;
        }
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.exportWidgetPresetFileLocal === 'function') {
            Dashboard.exportWidgetPresetFileLocal(file, file.name || this._entryLabel(entry));
        }
    },

    _renameMain: async function (entry) {
        const current = this._entryLabel(entry);
        const next = await CustomDialog.prompt('Rename preset:', current, 'Rename Preset');
        if (next == null) return;
        const ok = WidgetPresetModel.validateDisplayName(next);
        if (!ok.ok) {
            await CustomDialog.alert(ok.error, 'Rename Preset');
            return;
        }
        if (this._isExportWorkingEntry(entry)) {
            const file = this._fileCache[entry.fullName];
            if (!file) return;
            file.name = ok.name;
            await this._persistEntryFile(entry, file);
            this._renderExistingList();
            this._updateConfirmButton();
            return;
        }
        const saved = await Dashboard.renameUserWidgetPresetDisplayName(entry.fullName, ok.name);
        if (!saved) return;
        entry.displayName = ok.name;
        entry.name = ok.name;
        if (this._fileCache[entry.fullName]) this._fileCache[entry.fullName].name = ok.name;
        this._renderExistingList();
        this._updateConfirmButton();
    },

    _deleteMain: async function (entry) {
        if (this._isExportWorkingEntry(entry)) {
            if (!await CustomDialog.confirm(
                'Remove the loaded preset from this export dialog?',
                'Clear Preset'
            )) return;
            delete this._fileCache[entry.fullName];
            delete this._expandedMains[entry.fullName];
            this._selectedFullName = null;
            this._selectedVariantId = null;
            await this._loadExistingPresets();
            return;
        }
        const ok = await Dashboard.deleteUserWidgetPreset(entry.fullName, this._entryLabel(entry));
        if (!ok) return;
        delete this._fileCache[entry.fullName];
        delete this._expandedMains[entry.fullName];
        await this._loadExistingPresets();
    },

    _renameSub: async function (entry, variant) {
        const file = await this._getCachedFile(entry);
        if (!file) return;
        const next = await CustomDialog.prompt('Rename sub-preset:', variant.name || '', 'Rename Sub-Preset');
        if (next == null) return;
        const ok = WidgetPresetModel.validateDisplayName(next);
        if (!ok.ok) {
            await CustomDialog.alert(ok.error, 'Rename Sub-Preset');
            return;
        }
        const clash = WidgetPresetModel.findVariantIndexByName(file, ok.name);
        const selfIdx = WidgetPresetModel.findVariantIndexById(file, variant.id);
        if (clash >= 0 && clash !== selfIdx) {
            await CustomDialog.alert('A sub-preset with that name already exists.', 'Rename Sub-Preset');
            return;
        }
        if (WidgetPresetModel.isDefaultVariantName(ok.name)) {
            const otherDefault = file.variants.some((v, i) => i !== selfIdx && WidgetPresetModel.isDefaultVariantName(v.name));
            if (otherDefault) {
                await CustomDialog.alert('Only one sub-preset may be named "default".', 'Rename Sub-Preset');
                return;
            }
        }
        if (selfIdx < 0) return;
        file.variants[selfIdx].name = ok.name;
        const saved = await this._persistEntryFile(entry, file);
        if (!saved) return;
        entry.variantCount = file.variants.length;
        this._renderExistingList();
    },

    _deleteSub: async function (entry, variant) {
        const file = await this._getCachedFile(entry);
        if (!file) return;
        if (!await CustomDialog.confirm(
            'Delete sub-preset "' + (variant.name || variant.id) + '"?',
            'Delete Sub-Preset'
        )) return;

        const idx = WidgetPresetModel.findVariantIndexById(file, variant.id);
        if (idx < 0) return;
        file.variants.splice(idx, 1);

        if (file.variants.length === 0) {
            if (this._isExportWorkingEntry(entry)) {
                delete this._fileCache[entry.fullName];
                delete this._expandedMains[entry.fullName];
                await this._loadExistingPresets();
                return;
            }
            await Dashboard.deleteUserWidgetPreset(entry.fullName, this._entryLabel(entry), { skipConfirm: true });
            delete this._fileCache[entry.fullName];
            await this._loadExistingPresets();
            return;
        }

        const saved = await this._persistEntryFile(entry, file);
        if (!saved) return;
        entry.variantCount = file.variants.length;
        if (file.variants.length < 2) this._expandedMains[entry.fullName] = false;
        this._renderExistingList();
    },

    _reorderSubs: async function (entry, from, to) {
        const file = this._fileCache[entry.fullName];
        if (!file || !Array.isArray(file.variants)) return;
        if (from === to || from < 0 || to < 0 || from >= file.variants.length || to >= file.variants.length) return;
        const moved = file.variants.splice(from, 1)[0];
        file.variants.splice(to, 0, moved);
        await this._persistEntryFile(entry, file);
        this._renderExistingList();
    },

    _resolveOverwriteTarget: function () {
        const main = this._currentMainName();
        const sub = this._currentSubName();
        const entry = this._findExistingByMainName(main);
        if (!entry) {
            return { exists: false, overwrite: false, entry: null };
        }
        const cached = this._fileCache[entry.fullName];
        if (!sub) {
            if ((entry.variantCount || 1) > 1) {
                return { exists: true, overwrite: false, entry: entry, needSub: true };
            }
            return { exists: true, overwrite: true, entry: entry };
        }
        if (cached) {
            const idx = WidgetPresetModel.findVariantIndexByName(cached, sub);
            return { exists: true, overwrite: idx >= 0, entry: entry, variantIndex: idx };
        }
        // Guess from selection
        if (this._selectedFullName === entry.fullName && this._selectedVariantId) {
            return { exists: true, overwrite: true, entry: entry };
        }
        return { exists: true, overwrite: false, entry: entry, maybeAppend: true };
    },

    _syncExistingSelection: function () {
        const listEl = document.getElementById('wpp-existing-list');
        const hintEl = document.getElementById('wpp-existing-hint');
        if (!listEl) return;
        const main = this._currentMainName().toLowerCase();
        const sub = this._currentSubName().toLowerCase();
        const target = this._resolveOverwriteTarget();

        listEl.querySelectorAll('.wpp-preset-row').forEach((row) => {
            row.classList.remove('is-selected');
        });

        if (target.entry) {
            let block = null;
            listEl.querySelectorAll('.wpp-preset-block').forEach((el) => {
                if (el.dataset.fullName === target.entry.fullName) block = el;
            });
            if (block) {
                if (sub) {
                    const subs = block.querySelectorAll('.wpp-preset-row--sub');
                    let matched = false;
                    subs.forEach((row) => {
                        const nameEl = row.querySelector('.wpp-preset-row-name');
                        const n = nameEl ? String(nameEl.textContent || '').trim().toLowerCase() : '';
                        if (n === sub) {
                            row.classList.add('is-selected');
                            matched = true;
                        }
                    });
                    if (!matched) {
                        const mainRow = block.querySelector('.wpp-preset-row--main');
                        if (mainRow) mainRow.classList.add('is-selected');
                    }
                } else {
                    const mainRow = block.querySelector('.wpp-preset-row--main');
                    if (mainRow) mainRow.classList.add('is-selected');
                }
            }
        }

        if (hintEl && (this._action === 'save' || this._action === 'export')) {
            if (!this._existing || this._existing.length === 0) {
                hintEl.textContent = this._action === 'export' ? '' : 'New preset';
            } else if (target.needSub) {
                hintEl.textContent = 'Select or enter a sub name';
            } else if (target.overwrite) {
                hintEl.textContent = this._action === 'export' ? 'Will overwrite selected sub on export' : 'Will overwrite selected preset';
            } else if (target.exists && sub) {
                hintEl.textContent = this._action === 'export' ? 'Will append a new sub on export' : 'Will add a new sub-preset';
            } else if (target.exists) {
                hintEl.textContent = this._action === 'export' ? 'Will overwrite on export' : 'Will overwrite selected preset';
            } else if (main) {
                hintEl.textContent = 'New preset';
            } else {
                hintEl.textContent = this._action === 'export' ? 'Edit subs, then Export' : 'Click a row to target overwrite';
            }
        }
        this._updateMatchPresetButton();
    },

    _updateConfirmButton: function () {
        const confirmBtn = document.getElementById('wpp-btn-confirm');
        if (!confirmBtn) return;
        if (this._action === 'export') {
            const working = this._fileCache && this._fileCache[this._exportWorkingKey];
            const target = working ? this._resolveOverwriteTarget() : { overwrite: false };
            if (working && target.overwrite) {
                confirmBtn.innerHTML = '<i class="ph-bold ph-arrows-clockwise"></i> Overwrite & Export';
            } else if (working && target.exists && this._currentSubName()) {
                confirmBtn.innerHTML = '<i class="ph-bold ph-plus"></i> Append & Export';
            } else {
                confirmBtn.innerHTML = '<i class="ph-bold ph-download-simple"></i> Export';
            }
            confirmBtn.classList.add('primary');
            return;
        }
        const overwrite = this._resolveOverwriteTarget().overwrite;
        if (overwrite) {
            confirmBtn.innerHTML = '<i class="ph-bold ph-arrows-clockwise"></i> Overwrite';
        } else {
            confirmBtn.innerHTML = '<i class="ph-bold ph-cloud-arrow-up"></i> Save';
        }
        confirmBtn.classList.add('primary');
    },

    _setMode: function (mode) {
        this._mode = mode === 'custom' ? 'custom' : 'changed';
        if (this._mode === 'changed') {
            this._checked = {};
            WidgetPresetModel.collectChangedPathKeys(this._tree).forEach((k) => {
                this._checked[k] = true;
            });
        }
        this._renderBody();
        this._updateCount();
        this._updateMatchPresetButton();
    },

    /**
     * Resolve settings blob for the Presets-list selection (main + optional sub).
     * Returns null when nothing usable is selected.
     */
    _getSelectedPresetSettings: async function () {
        let entry = null;
        if (this._selectedFullName && Array.isArray(this._existing)) {
            for (let i = 0; i < this._existing.length; i++) {
                if (this._existing[i] && this._existing[i].fullName === this._selectedFullName) {
                    entry = this._existing[i];
                    break;
                }
            }
        }
        if (!entry) {
            entry = this._findExistingByMainName(this._currentMainName());
        }
        if (!entry) return null;

        const file = await this._getCachedFile(entry);
        if (!file || !Array.isArray(file.variants) || file.variants.length === 0) return null;

        let idx = -1;
        if (this._selectedVariantId) {
            idx = WidgetPresetModel.findVariantIndexById(file, this._selectedVariantId);
        }
        if (idx < 0) {
            const sub = this._currentSubName();
            if (sub) idx = WidgetPresetModel.findVariantIndexByName(file, sub);
        }
        if (idx < 0 && file.variants.length === 1) idx = 0;
        if (idx < 0) return null;

        const settings = file.variants[idx] && file.variants[idx].settings;
        if (!settings || typeof settings !== 'object') return null;
        return settings;
    },

    _hasSelectablePresetTarget: function () {
        if (this._selectedFullName) {
            // Multi-variant mains need a sub pick; single-variant mains are enough.
            if (this._selectedVariantId) return true;
            const entry = (this._existing || []).find((e) => e && e.fullName === this._selectedFullName);
            if (entry && (entry.variantCount || 1) <= 1) return true;
            // Name fields may already point at a sub
            if (this._currentSubName()) return true;
            return false;
        }
        const byName = this._findExistingByMainName(this._currentMainName());
        if (!byName) return false;
        if ((byName.variantCount || 1) <= 1) return true;
        return !!this._currentSubName();
    },

    _updateMatchPresetButton: function () {
        const btn = document.getElementById('wpp-btn-match-preset');
        if (!btn) return;
        const enabled = this._mode === 'custom' && this._hasSelectablePresetTarget();
        btn.disabled = !enabled;
        btn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
        btn.classList.toggle('is-disabled', !enabled);
    },

    _selectAllChecks: function (wantOn) {
        if (this._mode !== 'custom') return;
        this._checked = {};
        if (wantOn) {
            WidgetPresetModel.walkLeaves(this._tree, (leaf) => {
                if (leaf && leaf.id) this._checked[leaf.id] = true;
            });
        }
        this._renderBody();
        this._updateCount();
        this._updateMatchPresetButton();
    },

    _matchSelectedPresetChecks: async function () {
        if (this._mode !== 'custom') return;
        if (!this._hasSelectablePresetTarget()) return;

        const settings = await this._getSelectedPresetSettings();
        if (!settings) {
            await CustomDialog.alert(
                'Select a preset (and a sub-preset when needed) in the Presets list above.',
                'No Preset Selected'
            );
            this._updateMatchPresetButton();
            return;
        }

        const keys = WidgetPresetModel.collectPathKeysPresentInSettings(this._tree, settings);
        this._checked = {};
        keys.forEach((k) => { this._checked[k] = true; });
        this._renderBody();
        this._updateCount();
        this._updateMatchPresetButton();
    },

    _leafCount: function () {
        let n = 0;
        WidgetPresetModel.walkLeaves(this._tree, () => { n += 1; });
        return n;
    },

    _checkedCount: function () {
        if (this._mode === 'changed') {
            return WidgetPresetModel.collectChangedPathKeys(this._tree).length;
        }
        let n = 0;
        Object.keys(this._checked || {}).forEach((k) => {
            if (this._checked[k]) n += 1;
        });
        return n;
    },

    _updateCount: function () {
        const el = document.getElementById('wpp-count');
        if (!el) return;
        const checked = this._checkedCount();
        const total = this._leafCount();
        el.textContent = checked + ' of ' + total + ' setting' + (total === 1 ? '' : 's') + ' selected';
    },

    _branchState: function (node) {
        const leaves = [];
        WidgetPresetModel.walkLeaves([node], (leaf) => { leaves.push(leaf); });
        if (leaves.length === 0) return 'none';
        let on = 0;
        leaves.forEach((leaf) => {
            if (this._checked[leaf.id]) on += 1;
        });
        if (on === 0) return 'none';
        if (on === leaves.length) return 'all';
        return 'some';
    },

    _setBranchChecked: function (node, checked) {
        WidgetPresetModel.walkLeaves([node], (leaf) => {
            if (checked) this._checked[leaf.id] = true;
            else delete this._checked[leaf.id];
        });
    },

    _matchesFilter: function (node) {
        const q = String(this._filter || '').trim().toLowerCase();
        if (!q) return true;
        if (String(node.label || '').toLowerCase().indexOf(q) >= 0) return true;
        if (node.kind === 'branch' && Array.isArray(node.children)) {
            return node.children.some((child) => this._matchesFilter(child));
        }
        return false;
    },

    _renderCheckbox: function (state, onToggle) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wpp-check' + (state === 'all' ? ' is-checked' : '') + (state === 'some' ? ' is-indeterminate' : '');
        btn.setAttribute('aria-checked', state === 'all' ? 'true' : (state === 'some' ? 'mixed' : 'false'));
        btn.title = state === 'all' ? 'Uncheck' : 'Check';
        if (state === 'all') {
            btn.innerHTML = '<i class="ph-bold ph-check"></i>';
        } else if (state === 'some') {
            btn.innerHTML = '<i class="ph-bold ph-minus"></i>';
        } else {
            btn.innerHTML = '';
        }
        btn.onclick = (e) => {
            e.stopPropagation();
            onToggle(state !== 'all');
        };
        return btn;
    },

    _renderNode: function (node, depth) {
        if (!this._matchesFilter(node)) return null;

        if (node.kind === 'branch') {
            const wrap = document.createElement('div');
            wrap.className = 'wpp-branch';
            wrap.style.setProperty('--wpp-depth', String(depth || 0));

            const row = document.createElement('div');
            row.className = 'wpp-row wpp-row--branch';

            const collapsed = this._collapsed[node.id] === true;
            const twisty = document.createElement('button');
            twisty.type = 'button';
            twisty.className = 'wpp-twisty' + (collapsed ? ' is-collapsed' : '');
            twisty.innerHTML = '<i class="ph-bold ph-caret-down"></i>';
            twisty.title = collapsed ? 'Expand' : 'Collapse';
            twisty.onclick = (e) => {
                e.stopPropagation();
                this._collapsed[node.id] = !collapsed;
                this._renderBody();
            };

            const state = this._mode === 'custom' ? this._branchState(node) : 'all';
            const check = this._renderCheckbox(this._mode === 'custom' ? state : 'all', (wantOn) => {
                if (this._mode !== 'custom') return;
                this._setBranchChecked(node, wantOn);
                this._renderBody();
                this._updateCount();
            });
            if (this._mode !== 'custom') {
                check.disabled = true;
                check.classList.add('is-readonly');
            }

            const label = document.createElement('span');
            label.className = 'wpp-label';
            if (node.icon) {
                label.innerHTML = '<i class="ph ' + node.icon + ' wpp-group-icon"></i>';
            }
            const text = document.createElement('span');
            text.textContent = node.label || '';
            label.appendChild(text);

            row.appendChild(twisty);
            row.appendChild(check);
            row.appendChild(label);
            row.onclick = () => {
                if (this._mode !== 'custom') return;
                this._setBranchChecked(node, state !== 'all');
                this._renderBody();
                this._updateCount();
            };
            wrap.appendChild(row);

            if (!collapsed) {
                const kids = document.createElement('div');
                kids.className = 'wpp-children';
                (node.children || []).forEach((child) => {
                    const el = this._renderNode(child, (depth || 0) + 1);
                    if (el) kids.appendChild(el);
                });
                wrap.appendChild(kids);
            }
            return wrap;
        }

        const row = document.createElement('div');
        row.className = 'wpp-row wpp-row--leaf' + (node.changed ? ' is-changed' : '');
        row.style.setProperty('--wpp-depth', String(depth || 0));

        const spacer = document.createElement('span');
        spacer.className = 'wpp-twisty-spacer';

        const on = this._mode === 'changed' ? !!node.changed : !!this._checked[node.id];
        const check = this._renderCheckbox(on ? 'all' : 'none', (wantOn) => {
            if (this._mode !== 'custom') return;
            if (wantOn) this._checked[node.id] = true;
            else delete this._checked[node.id];
            this._renderBody();
            this._updateCount();
        });
        if (this._mode !== 'custom') {
            check.disabled = true;
            check.classList.add('is-readonly');
        }

        const label = document.createElement('span');
        label.className = 'wpp-label';
        label.textContent = node.label || node.id;

        const badge = document.createElement('span');
        badge.className = 'wpp-badge' + (node.changed ? ' wpp-badge--changed' : ' wpp-badge--default');
        badge.textContent = node.changed ? 'Changed' : 'Default';

        row.appendChild(spacer);
        row.appendChild(check);
        row.appendChild(label);
        row.appendChild(badge);
        row.onclick = () => {
            if (this._mode !== 'custom') return;
            if (this._checked[node.id]) delete this._checked[node.id];
            else this._checked[node.id] = true;
            this._renderBody();
            this._updateCount();
        };
        return row;
    },

    _renderBody: function () {
        const treeHost = document.getElementById('wpp-tree');
        const customPanel = document.getElementById('wpp-custom-panel');
        const modal = document.getElementById('widget-preset-picker-modal');
        if (!treeHost || !customPanel) return;

        const isCustom = this._mode === 'custom';
        customPanel.hidden = !isCustom;
        if (modal) modal.classList.toggle('wpp-expanded', isCustom);

        document.querySelectorAll('#wpp-mode-group .wpp-mode-option').forEach((btn) => {
            const mode = btn.getAttribute('data-wpp-mode');
            const selected = mode === this._mode;
            btn.classList.toggle('is-selected', selected);
            btn.setAttribute('aria-checked', selected ? 'true' : 'false');
        });

        treeHost.innerHTML = '';
        if (!isCustom) {
            this._updateMatchPresetButton();
            return;
        }

        if (!this._tree || this._tree.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'wpp-empty';
            empty.textContent = 'No preset-eligible settings for this widget.';
            treeHost.appendChild(empty);
            this._updateMatchPresetButton();
            return;
        }

        let any = false;
        this._tree.forEach((branch) => {
            const el = this._renderNode(branch, 0);
            if (el) {
                any = true;
                treeHost.appendChild(el);
            }
        });
        if (!any) {
            const empty = document.createElement('div');
            empty.className = 'wpp-empty';
            empty.textContent = 'No settings match this filter.';
            treeHost.appendChild(empty);
        }
        this._updateMatchPresetButton();
    },

    _render: function () {
        const titleEl = document.getElementById('wpp-title');
        if (titleEl) {
            titleEl.textContent = this._action === 'save' ? 'Save Widget Preset' : 'Export Widget Preset';
        }

        this._syncAppendButton();
        const existingWrap = document.getElementById('wpp-existing-wrap');
        if (existingWrap && this._action === 'save') existingWrap.hidden = false;
        if (existingWrap && this._action === 'export') {
            const working = this._fileCache && this._fileCache[this._exportWorkingKey];
            existingWrap.hidden = !working;
        }

        const filterInput = document.getElementById('wpp-filter');
        if (filterInput) filterInput.value = this._filter;

        this._updateConfirmButton();
        this._renderBody();
        this._updateCount();
        this._updateMatchPresetButton();
    },

    confirm: async function () {
        const nameInput = document.getElementById('wpp-name');
        const subInput = document.getElementById('wpp-sub-name');
        let mainName = nameInput ? String(nameInput.value || '').trim() : '';
        let subName = subInput ? String(subInput.value || '').trim() : '';

        const mainOk = WidgetPresetModel.validateDisplayName(mainName);
        if (!mainOk.ok) {
            await CustomDialog.alert(mainOk.error || 'Please enter a preset name.', 'Name Required');
            if (nameInput) nameInput.focus();
            return;
        }
        mainName = mainOk.name;

        if (subName) {
            const subOk = WidgetPresetModel.validateDisplayName(subName);
            if (!subOk.ok) {
                await CustomDialog.alert(subOk.error, 'Name Required');
                if (subInput) subInput.focus();
                return;
            }
            subName = subOk.name;
        }

        let checkedKeys;
        if (this._mode === 'changed') {
            checkedKeys = WidgetPresetModel.collectChangedPathKeys(this._tree);
        } else {
            checkedKeys = Object.keys(this._checked).filter((k) => this._checked[k]);
        }

        if (checkedKeys.length === 0) {
            const ok = await CustomDialog.confirm(
                'No settings are selected. Save an empty preset anyway?',
                'Empty Preset'
            );
            if (!ok) return;
        }

        const settings = WidgetPresetModel.serializeSettings(this._widget, this._tree, checkedKeys);

        if (this._action === 'export') {
            const working = this._fileCache[this._exportWorkingKey];
            if (working) {
                if (!subName && working.variants.length > 1) {
                    await CustomDialog.alert(
                        'This preset has sub-presets. Select or enter a sub name to overwrite or add one.',
                        'Sub Name Required'
                    );
                    if (subInput) subInput.focus();
                    return;
                }
                const merged = WidgetPresetModel.mergeIntoExisting(
                    working,
                    mainName || working.name,
                    subName,
                    settings,
                    { fileId: working.id, updateMainName: !!mainName }
                );
                if (merged.error) {
                    await CustomDialog.alert(merged.error, 'Export Preset');
                    return;
                }
                if (mainName) merged.preset.name = mainName;
                this.close({
                    name: merged.preset.name,
                    subName: subName,
                    fileId: merged.preset.id,
                    preset: merged.preset,
                    action: this._action,
                    overwrite: !!merged.overwrite,
                    appended: !!merged.created
                });
                return;
            }

            const preset = WidgetPresetModel.buildPresetFile(
                this._widget,
                mainName,
                subName,
                this._tree,
                checkedKeys,
                { existingFileIds: [] }
            );
            this.close({
                name: mainName,
                subName: subName,
                fileId: preset.id,
                preset: preset,
                action: this._action,
                overwrite: false
            });
            return;
        }

        // Homey Save
        const existingEntry = this._findExistingByMainName(mainName);
        if (!existingEntry) {
            const existingIds = (this._existing || []).map((e) => e.fileId);
            const preset = WidgetPresetModel.buildPresetFile(
                this._widget,
                mainName,
                subName,
                this._tree,
                checkedKeys,
                { existingFileIds: existingIds }
            );
            this.close({
                name: mainName,
                subName: subName,
                fileId: preset.id,
                preset: preset,
                action: this._action,
                overwrite: false,
                appended: false
            });
            return;
        }

        let existingFile = this._fileCache[existingEntry.fullName];
        if (!existingFile) {
            existingFile = await this._getCachedFile(existingEntry);
        }
        if (!existingFile) {
            await CustomDialog.alert('Could not load the existing preset file.', 'Error');
            return;
        }

        if (!subName && existingFile.variants.length > 1) {
            await CustomDialog.alert(
                'This preset has sub-presets. Select or enter a sub name to overwrite or add one.',
                'Sub Name Required'
            );
            if (subInput) subInput.focus();
            return;
        }

        const merged = WidgetPresetModel.mergeIntoExisting(
            existingFile,
            mainName,
            subName,
            settings,
            { fileId: existingEntry.fileId }
        );
        if (merged.error) {
            await CustomDialog.alert(merged.error, 'Save Preset');
            return;
        }

        this.close({
            name: mainName,
            subName: subName,
            fileId: existingEntry.fileId || merged.preset.id,
            preset: merged.preset,
            action: this._action,
            overwrite: !!merged.overwrite,
            appended: !!merged.created
        });
    }
};
