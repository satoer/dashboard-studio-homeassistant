window._dsDropdownCleanups = window._dsDropdownCleanups || [];

const Editor = {
    currentId: null,
    container: null,
    select: null,
    panelStates: {},

    /**
     * Replaces native <select> elements with a fully styled custom DOM structure.
     * Polyfills .value, .disabled, and .innerHTML equivalent methods.
     */
    createCustomSelect: function(optionsArray, currentValue) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ds-select-wrapper flex-1';
        
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'control-input ds-select-btn';
        
        const labelEl = document.createElement('span');
        btn.appendChild(labelEl);
        
        const iconEl = document.createElement('i');
        iconEl.className = 'ph-bold ph-caret-down';
        btn.appendChild(iconEl);
        
        const menu = document.createElement('div');
        menu.className = 'ds-select-menu hidden';
        
        let internalValue = currentValue;
        
        const renderMenu = () => {
            menu.innerHTML = '';
            let labelText = "Select...";
            let matchFound = false;
            
            (optionsArray || []).forEach(o => {
                if (typeof o === 'object' && o !== null && o.isHeader) {
                    const hdr = document.createElement('div');
                    hdr.className = 'ds-select-group';
                    hdr.textContent = o.text || '';
                    menu.appendChild(hdr);
                    return;
                }
                const optVal = (typeof o === 'object' && o !== null && o.value !== undefined) ? o.value : o;
                const optText = (typeof o === 'object' && o !== null && o.value !== undefined) ? (o.text || o.value) : o;
                
                const optEl = document.createElement('div');
                optEl.className = 'ds-select-opt';
                // eslint-disable-next-line eqeqeq
                if (optVal == internalValue) {
                    optEl.classList.add('selected');
                    labelText = optText;
                    matchFound = true;
                }
                optEl.textContent = optText;
                Editor._bindOverflowTitle(optEl, optEl, function () { return String(optText); });
                optEl.onmousedown = (e) => { e.preventDefault(); };
                optEl.onclick = (e) => {
                    e.stopPropagation();
                    Editor._closeDsFixedDropdown(menu);
                    if (internalValue !== optVal) {
                        internalValue = optVal;
                        renderMenu();
                        if (typeof wrapper.onchange === 'function') {
                            wrapper.onchange({ target: wrapper });
                        }
                        wrapper.dispatchEvent(new Event('input', { bubbles: true }));
                        wrapper.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                };
                menu.appendChild(optEl);
            });
            
            if (!matchFound && internalValue !== undefined && internalValue !== null && internalValue !== '') {
                labelText = internalValue;
            }
            labelEl.textContent = labelText;
            Editor._bindOverflowTitle(btn, labelEl, function () { return labelEl.textContent; });
        };
        
        renderMenu();
        
        menu._dsSelectAnchor = wrapper;

        btn.onclick = (e) => {
            e.stopPropagation();
            Editor._toggleDsFixedDropdown(menu, btn, true);
        };

        Editor._bindDsFixedDropdownOutsideClick();

        // Close a portaled menu when the inspector list that owns this select is redrawn.
        // Subtree cleanup also drops the sweep entry so the closure does not keep the menu alive.
        let selectCleaned = false;
        const cleanupSelectDropdown = function () {
            if (selectCleaned) return;
            selectCleaned = true;
            Editor._closeDsFixedDropdown(menu);
        };
        wrapper._dsCleanup = function () {
            cleanupSelectDropdown();
            if (window._dsDropdownCleanups) {
                const at = window._dsDropdownCleanups.indexOf(cleanupSelectDropdown);
                if (at >= 0) window._dsDropdownCleanups.splice(at, 1);
            }
        };
        window._dsDropdownCleanups.push(cleanupSelectDropdown);

        wrapper.appendChild(btn);
        wrapper.appendChild(menu);
        
        Object.defineProperty(wrapper, 'value', {
            get: () => internalValue,
            set: (val) => {
                internalValue = val;
                renderMenu();
            }
        });
        
        Object.defineProperty(wrapper, 'disabled', {
            get: () => btn.disabled,
            set: (val) => {
                btn.disabled = !!val;
                if (val) btn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
                else btn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
            }
        });

        // Add method to update options dynamically
        wrapper.setOptions = (newOpts) => {
            optionsArray = newOpts;
            renderMenu();
        };
        
        return wrapper;
    },

    _bindOverflowTitle: function (hoverEl, measureEl, getText) {
        if (typeof LabelHint === 'undefined' || typeof LabelHint.bindTruncatedHint !== 'function') return;
        LabelHint.bindTruncatedHint(hoverEl, {
            measureEl: measureEl || hoverEl,
            getText: getText
        });
    },
    monitorInterval: null,
    fieldRegistry: {},
    /** @type {Array<function(): boolean|void>|null} Callbacks return false when unmounted (pruned on next sync). */
    _selectionGroupAllowSyncers: null,
    currentValuesSnapshot: null,
    _reactiveMeta: null,
    _reactiveRefreshTimer: null,
    _externalRefreshTimer: null,
    /** Debounced full inspector remount when merged `widget.config` may change derived controls (inherit / mirror). */
    _inspectorMergedConfigReloadTimer: null,
    _themeRefreshBound: false,
    _isEditorDrivenUpdate: false,
    _masterDefaultSnapshot: (function () {
        const raw = (typeof MASTER_SETTINGS === 'object' && MASTER_SETTINGS) ? MASTER_SETTINGS : {};
        let snap;
        try {
            snap = JSON.parse(JSON.stringify(raw));
        } catch (e) {
            snap = { ...raw };
        }
        if (!snap.themeColors && typeof MasterLayout !== 'undefined' && typeof MasterLayout.defaultThemeColors === 'function') {
            snap.themeColors = MasterLayout.defaultThemeColors();
        }
        if (!snap.driverSettings || typeof snap.driverSettings !== 'object') {
            snap.driverSettings = {};
        }
        return snap;
    })(),
    /** Set when the full-screen Markdown editor is open (kept for hooks / future use). */
    _fullTextEditorActive: false,
    /**
     * Trailing throttle for long text fields (Text widget, etc.): coalesces every keystroke
     * inside `intervalMs` into one Dashboard.updateWidget call. Backed by WorkerTimer so
     * the first refresh isn't delayed 10-20 s by Chrome's main-thread setTimeout throttling
     * during the cold-start window.
     *   { handle, widgetId, key, value }
     */
    _textPreviewDebounce: null,

    setFullTextEditorActive: function (on) {
        this._fullTextEditorActive = !!on;
    },

    _runDropdownCleanups: function () {
        if (window._dsDropdownCleanups && window._dsDropdownCleanups.length > 0) {
            window._dsDropdownCleanups.forEach(cb => cb());
            window._dsDropdownCleanups = [];
        }
    },

    /** Drop portaled topic, picklist, and custom-select menus owned by controls inside `rootEl` before that subtree is wiped. */
    _cleanupSubtreeDropdowns: function (rootEl) {
        if (!rootEl || typeof rootEl.querySelectorAll !== 'function') return;
        const nodes = rootEl.querySelectorAll('.bound-topic-wrap, .ds-select-wrapper');
        for (let i = 0; i < nodes.length; i++) {
            const el = nodes[i];
            if (el && typeof el._dsCleanup === 'function') el._dsCleanup();
        }
        if (rootEl.classList
                && (rootEl.classList.contains('bound-topic-wrap') || rootEl.classList.contains('ds-select-wrapper'))
                && typeof rootEl._dsCleanup === 'function') {
            rootEl._dsCleanup();
        }
    },

    _queueWidgetTextFieldPreview: function (widgetId, key, value, baseDebounceMs) {
        const self = this;
        const intervalMs = Math.max(150, Math.min(2000, typeof baseDebounceMs === 'number' ? baseDebounceMs : 500));
        if (!this._textPreviewDebounce) {
            this._textPreviewDebounce = { handle: null, widgetId: null, key: null, value: undefined };
        }
        const d = this._textPreviewDebounce;
        if (d.handle && (d.widgetId !== widgetId || d.key !== key)) {
            this.flushPendingTextPreview();
            return this._queueWidgetTextFieldPreview(widgetId, key, value, baseDebounceMs);
        }
        d.widgetId = widgetId;
        d.key = key;
        d.value = value;
        if (!d.handle) {
            d.handle = WorkerTimer.setTimeout(function () {
                d.handle = null;
                self._applyPendingTextFieldPreview();
            }, intervalMs);
        }
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.markUnsaved === 'function') {
            Dashboard.markUnsaved();
        }
    },

    _clearPendingTextPreviewTimer: function (d) {
        if (!d || !d.handle) return;
        WorkerTimer.clearTimeout(d.handle);
        d.handle = null;
    },

    _applyPendingTextFieldPreview: function () {
        if (!this._textPreviewDebounce) return;
        const d = this._textPreviewDebounce;
        this._clearPendingTextPreviewTimer(d);
        const id = d.widgetId;
        const k = d.key;
        const v = d.value;
        if (!id || !k || !Dashboard.widgets || !Dashboard.widgets[id]) return;
        const patch = {};
        patch[k] = v;
        this._isEditorDrivenUpdate = true;
        try {
            Dashboard.updateWidget(id, patch);
        } finally {
            this._isEditorDrivenUpdate = false;
        }
    },

    /** Apply pending debounced text to widget overrides; call before serialize, widget switch, or when canvas must be current. */
    flushPendingTextPreview: function () {
        if (!this._textPreviewDebounce) return;
        const d = this._textPreviewDebounce;
        this._clearPendingTextPreviewTimer(d);
        const id = d.widgetId;
        const k = d.key;
        const v = d.value;
        this._textPreviewDebounce = null;
        if (!id || !k || !Dashboard.widgets || !Dashboard.widgets[id]) return;
        const w = Dashboard.widgets[id];
        const cur = w.overrides ? w.overrides[k] : undefined;
        if (cur === v) return;
        const patch = {};
        patch[k] = v;
        this._isEditorDrivenUpdate = true;
        try {
            Dashboard.updateWidget(id, patch);
        } finally {
            this._isEditorDrivenUpdate = false;
        }
    },

    /** Shared by topic dropdown and filtered picklists: fixed menu below editor panel, aligned to input. */
    _invokeSelectionGroupAllowEmptySync: function () {
        const arr = this._selectionGroupAllowSyncers;
        if (!arr || !arr.length) return;
        const kept = [];
        for (let i = 0; i < arr.length; i++) {
            try {
                const fn = arr[i];
                if (typeof fn !== 'function') continue;
                if (fn() !== false) kept.push(fn);
            } catch (e) { /* drop dead callback */ }
        }
        this._selectionGroupAllowSyncers = kept;
    },

    _positionFixedDropdownBelowInput: function (menuWrap, inp, alignToInput) {
        const rect = inp.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 4;
        const spaceAbove = rect.top - 4;
        const menuMaxHeight = window.innerHeight * 0.4;
        if (menuWrap.classList && (menuWrap.classList.contains('share-dropdown') || menuWrap.classList.contains('tools-dropdown'))) {
            menuWrap.style.left = 'auto';
            menuWrap.style.right = (window.innerWidth - rect.right) + 'px';
            menuWrap.style.width = 'auto';
            menuWrap.style.minWidth = '180px';
            menuWrap.style.maxWidth = '240px';
        } else if (alignToInput === true) {
            menuWrap.style.left = rect.left + 'px';
            menuWrap.style.right = 'auto';
            menuWrap.style.width = Math.max(rect.width, 120) + 'px';
        } else {
            const editorPanel = document.getElementById('editor-scroll-container');
            const panelRect = editorPanel ? editorPanel.getBoundingClientRect() : rect;
            const sidePad = 8;
            menuWrap.style.left = (panelRect.left + sidePad) + 'px';
            menuWrap.style.width = (panelRect.width - sidePad * 2) + 'px';
        }

        if (spaceBelow >= Math.min(menuMaxHeight, 120) || spaceBelow >= spaceAbove) {
            menuWrap.style.top = (rect.bottom + 4) + 'px';
            menuWrap.style.bottom = 'auto';
            menuWrap.style.maxHeight = Math.max(spaceBelow, 60) + 'px';
        } else {
            menuWrap.style.top = 'auto';
            menuWrap.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
            menuWrap.style.maxHeight = Math.max(spaceAbove, 60) + 'px';
        }
    },

    _initDsDropdownPortalHome: function (menuEl) {
        if (!menuEl._dsPortalHome) {
            menuEl._dsPortalHome = { parent: null, next: null };
        }
    },

    _restoreDsDropdownPortal: function (menuEl) {
        if (!menuEl._dsPortalHome || !menuEl._dsPortalHome.parent) {
            if (menuEl.parentElement === document.body) {
                document.body.removeChild(menuEl);
            }
            return;
        }
        const home = menuEl._dsPortalHome;
        if (!document.body.contains(home.parent)) {
            // Home parent is no longer in the document DOM tree; remove menuEl to avoid orphaned nodes
            if (menuEl.parentElement === document.body) {
                document.body.removeChild(menuEl);
            }
            return;
        }
        if (home.next && home.next.parentNode === home.parent) {
            home.parent.insertBefore(menuEl, home.next);
        } else {
            home.parent.appendChild(menuEl);
        }
    },

    _bindDsDropdownReposition: function (menuEl, anchorEl, alignToInput) {
        if (menuEl._dsRepositionHandler) return;
        const handler = function () {
            if (!menuEl.classList.contains('ds-dropdown-fixed')) return;
            Editor._positionFixedDropdownBelowInput(menuEl, anchorEl, alignToInput === true);
        };
        menuEl._dsRepositionHandler = handler;
        window.addEventListener('scroll', handler, true);
        window.addEventListener('resize', handler);
    },

    _unbindDsDropdownReposition: function (menuEl) {
        if (!menuEl._dsRepositionHandler) return;
        window.removeEventListener('scroll', menuEl._dsRepositionHandler, true);
        window.removeEventListener('resize', menuEl._dsRepositionHandler);
        menuEl._dsRepositionHandler = null;
    },

    _closeDsFixedDropdown: function (menuEl) {
        if (!menuEl) return;
        if (!menuEl.classList.contains('share-dropdown') && !menuEl.classList.contains('tools-dropdown')) {
            menuEl.classList.add('hidden');
        }
        menuEl.classList.remove('ds-dropdown-fixed');
        menuEl.style.position = '';
        menuEl.style.zIndex = '';
        menuEl.style.top = '';
        menuEl.style.bottom = '';
        menuEl.style.left = '';
        menuEl.style.right = '';
        menuEl.style.width = '';
        menuEl.style.minWidth = '';
        menuEl.style.maxWidth = '';
        menuEl.style.maxHeight = '';
        Editor._unbindDsDropdownReposition(menuEl);
        Editor._restoreDsDropdownPortal(menuEl);
    },

    _closeAllDsFixedDropdowns: function (exceptMenu) {
        document.querySelectorAll('.ds-dropdown-fixed').forEach(function (m) {
            if (m === exceptMenu) return;
            if (m.classList.contains('share-dropdown') && typeof ShareMenu !== 'undefined') {
                ShareMenu.close();
            } else if (m.classList.contains('tools-dropdown') && typeof ToolsMenu !== 'undefined') {
                ToolsMenu.close();
            } else {
                Editor._closeDsFixedDropdown(m);
            }
        });
    },

    _openDsFixedDropdown: function (menuEl, anchorEl, alignToInput) {
        Editor._initDsDropdownPortalHome(menuEl);
        const anchorWrap = anchorEl.closest('.ds-select-wrapper') || anchorEl.closest('.relative') || anchorEl.parentElement;
        menuEl._dsSelectAnchor = anchorWrap;
        menuEl._dsDropdownAnchorBtn = anchorEl;

        const home = menuEl._dsPortalHome;
        if (!home.parent && menuEl.parentElement && menuEl.parentElement !== document.body) {
            home.parent = menuEl.parentElement;
            home.next = menuEl.nextSibling;
        }
        if (menuEl.parentElement !== document.body) {
            document.body.appendChild(menuEl);
        }

        menuEl.classList.remove('hidden');
        menuEl.classList.add('ds-dropdown-fixed');
        menuEl.style.position = 'fixed';
        menuEl.style.zIndex = '10050';
        Editor._positionFixedDropdownBelowInput(menuEl, anchorEl, alignToInput === true);
        Editor._bindDsDropdownReposition(menuEl, anchorEl, alignToInput === true);
    },

    _toggleDsFixedDropdown: function (menuEl, anchorEl, alignToInput) {
        const isOpen = !menuEl.classList.contains('hidden');
        if (isOpen) {
            Editor._closeDsFixedDropdown(menuEl);
        } else {
            Editor._closeAllDsFixedDropdowns(menuEl);
            Editor._openDsFixedDropdown(menuEl, anchorEl, alignToInput);
        }
    },

    _isDsDropdownClickOutside: function (menuEl, target) {
        if (menuEl.contains(target)) return false;
        const anchor = menuEl._dsSelectAnchor;
        if (anchor && anchor.contains(target)) return false;
        if (!anchor && menuEl.previousElementSibling && menuEl.previousElementSibling.contains(target)) return false;
        return true;
    },

    /** Popup outside-click guard: includes portaled .ds-dropdown-fixed menus and bound-topic menus anchored inside popupEl. */
    isClickInsidePopupWithPortaledDropdowns: function (target, popupEl, anchorBtn) {
        if (!target) return false;
        if (popupEl && popupEl.contains(target)) return true;
        if (anchorBtn && (target === anchorBtn || anchorBtn.contains(target))) return true;
        let node = target;
        while (node) {
            if (node.classList) {
                if (node.classList.contains('ds-dropdown-fixed')) {
                    const anchor = node._dsSelectAnchor;
                    if (anchor && popupEl && popupEl.contains(anchor)) return true;
                }
                if (node.classList.contains('bound-topic-menu')) {
                    const topicAnchor = node._dsTopicDropdownAnchor;
                    if (topicAnchor && popupEl && popupEl.contains(topicAnchor)) return true;
                }
                if (node.id === 'icon-modal' && node.classList.contains('open')) return true;
            }
            node = node.parentElement;
        }
        if (typeof EditorColorPicker !== 'undefined'
                && typeof EditorColorPicker.isPanelInteractionInsideOwner === 'function'
                && popupEl
                && EditorColorPicker.isPanelInteractionInsideOwner(target, popupEl)) {
            return true;
        }
        return false;
    },

    setBindAuxHighlight: function (btn, active, invalid) {
        if (!btn) return;
        if (invalid) {
            btn.classList.add('btn-bind-invalid');
            btn.classList.remove('btn-bind-highlight');
            return;
        }
        btn.classList.remove('btn-bind-invalid');
        if (active) {
            btn.classList.add('btn-bind-highlight');
        } else {
            btn.classList.remove('btn-bind-highlight');
        }
    },

    _bindDsFixedDropdownOutsideClick: function () {
        if (window._dsFixedDropdownsClickBound) return;
        window._dsFixedDropdownsClickBound = true;
        document.addEventListener('click', function (e) {
            document.querySelectorAll('.ds-dropdown-fixed').forEach(function (m) {
                if (!Editor._isDsDropdownClickOutside(m, e.target)) return;
                if (m.classList.contains('share-dropdown') && typeof ShareMenu !== 'undefined') {
                    ShareMenu.close();
                } else if (m.classList.contains('tools-dropdown') && typeof ToolsMenu !== 'undefined') {
                    ToolsMenu.close();
                } else {
                    Editor._closeDsFixedDropdown(m);
                }
            });
        });
    },

    createTopicDropdown: function (currentVal, placeholder, onChangeCallback, extraClasses, alignMenuToInput, commitPickOnly, onConfirmed) {
        if (typeof extraClasses !== 'string') {
            extraClasses = '';
        }
        const alignToInput = alignMenuToInput === true;
        const onCommitPickOnly = commitPickOnly === true;
        const wrap = document.createElement('div');
        wrap.className = `relative flex items-center w-full bound-topic-wrap ${extraClasses}`;

        const linkIcon = document.createElement('i');
        linkIcon.className = 'ph-bold ph-link bound-topic-link-icon absolute left-2 pointer-events-none z-10 text-[11px] opacity-80';

        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'control-input bound-topic bound-topic-text font-mono text-xs pr-7 pl-6 w-full';
        // Add specific class for rounded override if passed in extraClasses
        if (extraClasses.includes('rounded-r-none')) inp.classList.add('rounded-r-none');
        inp.placeholder = placeholder || 'msg.topic';
        inp.value = currentVal || '';

        const ddIcon = document.createElement('i');
        ddIcon.className = 'ph-bold ph-caret-down bound-topic-caret absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer transition-colors z-[1001]';

        const menuWrap = document.createElement('div');
        menuWrap.className = 'ds-editor-menu bound-topic-menu';
        menuWrap.style.cssText = 'display:none; position:fixed; max-height:40vh; z-index:10050;';

        const renderMenu = (filterStr = '') => {
            menuWrap.innerHTML = '';
            let topics = [];
            if (Dashboard.liveData) {
                topics = Object.keys(Dashboard.liveData).filter(t => {
                    return !(typeof Dashboard.isLegacyHomeyTopic === 'function' && Dashboard.isLegacyHomeyTopic(t));
                }).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
            }

            if (filterStr) {
                const lower = filterStr.toLowerCase();
                topics = topics.filter(t => t.toLowerCase().includes(lower));
            }

            if (topics.length === 0) {
                menuWrap.innerHTML = '<div class="ds-editor-menu-empty">No matching topics</div>';
            } else {
                topics.forEach(t => {
                    const item = document.createElement('div');
                    item.className = 'ds-editor-menu-item bound-topic-text font-mono truncate flex items-center justify-between';

                    let meta = null;
                    if (typeof Dashboard !== 'undefined' && Dashboard.topicMeta && Dashboard.topicMeta[t]) {
                        meta = Dashboard.topicMeta[t];
                    }

                    let tagHtml = '';
                    const isLocal = t.startsWith('local/');
                    if (isLocal) {
                        tagHtml = UIUtils.createAccessLevelTag(true, true, false, false, true);
                    } else if (meta && typeof meta.getable !== 'undefined' && typeof meta.setable !== 'undefined') {
                        tagHtml = UIUtils.createAccessLevelTag(meta.getable, meta.setable);
                    } else if (meta && meta.isVariable) {
                        tagHtml = UIUtils.createAccessLevelTag(true, !!meta.setable);
                    } else if (meta && meta.isFlow) {
                        tagHtml = UIUtils.createAccessLevelTag(meta.capabilityId === 'enabled', meta.capabilityId !== 'enabled');
                    } else if (meta && meta.isMood) {
                        tagHtml = UIUtils.createAccessLevelTag(false, true);
                    } else {
                        tagHtml = UIUtils.createAccessLevelTag(false, false, false, true);
                    }
                    let html = `${tagHtml}<span class="truncate">${t}</span>`;
                    item.innerHTML = html;
                    const nameSpan = item.querySelector('span.truncate');
                    Editor._bindOverflowTitle(item, nameSpan || item, function () { return t; });

                    item.onmousedown = (e) => {
                        e.preventDefault(); // maintain focus flow
                        inp.value = t;
                        onChangeCallback(t);
                        hideMenu();
                        inp.blur();
                    };
                    menuWrap.appendChild(item);
                });
            }
        };

        const positionMenu = () => {
            Editor._positionFixedDropdownBelowInput(menuWrap, inp, alignToInput);
        };

        let isDisambiguating = false;

        const showMenu = () => {
            isDisambiguating = false;
            if (!document.body.contains(menuWrap)) document.body.appendChild(menuWrap);
            renderMenu(inp.value);
            positionMenu();
            menuWrap.style.display = 'block';
        };

        const hideMenu = () => {
            isDisambiguating = false;
            menuWrap.style.display = 'none';
        };

        menuWrap._dsTopicDropdownAnchor = wrap;

        const onScroll = () => { if (menuWrap.style.display !== 'none') positionMenu(); };

        const showDisambiguationMenu = (queryStr, candidates) => {
            isDisambiguating = true;
            menuWrap.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'px-2.5 py-1.5 text-[11px] font-semibold border-b border-white/10 flex items-center justify-between text-muted-foreground select-none';
            header.innerHTML = '<span>Select topic for &ldquo;' + UIUtils.escapeHtml(queryStr) + '&rdquo;</span><span class="text-[10px] opacity-70">' + candidates.length + ' matches</span>';
            menuWrap.appendChild(header);

            candidates.forEach(cand => {
                const item = document.createElement('div');
                item.className = 'ds-editor-menu-item bound-topic-text font-mono truncate flex items-center justify-between gap-2 py-1.5 px-2.5 cursor-pointer';

                let badgeColor = 'bg-blue-500/20 text-blue-300';
                if (cand.type === 'variable') badgeColor = 'bg-amber-500/20 text-amber-300';
                else if (cand.type === 'event') badgeColor = 'bg-emerald-500/20 text-emerald-300';
                else if (cand.type === 'mood') badgeColor = 'bg-purple-500/20 text-purple-300';
                else if (cand.type === 'flow') badgeColor = 'bg-sky-500/20 text-sky-300';
                else if (cand.type === 'insight') badgeColor = 'bg-teal-500/20 text-teal-300';

                const left = document.createElement('div');
                left.className = 'flex items-center gap-1.5 min-w-0';
                left.innerHTML = '<span class="text-[9px] uppercase font-bold tracking-wider px-1 py-0.5 rounded ' + badgeColor + ' inline-flex items-center gap-1"><i class="ph-bold ' + cand.icon + '"></i> ' + cand.badge + '</span><span class="truncate font-sans font-medium text-xs text-foreground/90">' + UIUtils.escapeHtml(cand.title) + '</span>';

                const right = document.createElement('span');
                right.className = 'text-[10px] text-muted-foreground font-mono truncate opacity-80';
                right.textContent = cand.topic;

                item.appendChild(left);
                item.appendChild(right);

                item.onmousedown = (e) => {
                    e.preventDefault();
                    inp.value = cand.topic;
                    onChangeCallback(cand.topic);
                    if (typeof onConfirmed === 'function') onConfirmed(cand.topic);
                    hideMenu();
                    inp.blur();
                };
                menuWrap.appendChild(item);
            });

            const keepItem = document.createElement('div');
            keepItem.className = 'ds-editor-menu-item text-[11px] italic text-muted-foreground border-t border-white/10 py-1.5 px-2.5 flex items-center gap-1.5 cursor-pointer select-none';
            keepItem.innerHTML = '<i class="ph-bold ph-pencil-simple"></i> Keep as typed: &ldquo;' + UIUtils.escapeHtml(queryStr) + '&rdquo;';
            keepItem.onmousedown = (e) => {
                e.preventDefault();
                inp.value = queryStr;
                onChangeCallback(queryStr);
                if (typeof onConfirmed === 'function') onConfirmed(queryStr);
                hideMenu();
                inp.blur();
            };
            menuWrap.appendChild(keepItem);

            if (!document.body.contains(menuWrap)) document.body.appendChild(menuWrap);
            positionMenu();
            menuWrap.style.display = 'block';
        };

        const processTopicCommit = (rawVal) => {
            const val = String(rawVal || '').trim();
            if (!val) {
                if (typeof onConfirmed === 'function') onConfirmed('');
                return;
            }

            if (typeof HomeyTopicResolver !== 'undefined') {
                const res = HomeyTopicResolver.findCandidates(val);
                if (res.isLocal || res.exact) {
                    if (typeof onConfirmed === 'function') onConfirmed(val);
                    return;
                }
                if (res.candidates && res.candidates.length === 1) {
                    const canonical = res.candidates[0].topic;
                    if (canonical && canonical !== val) {
                        inp.value = canonical;
                        onChangeCallback(canonical);
                        if (typeof onConfirmed === 'function') onConfirmed(canonical);
                        return;
                    }
                } else if (res.candidates && res.candidates.length > 1) {
                    showDisambiguationMenu(val, res.candidates);
                    return;
                }
            }

            if (typeof onConfirmed === 'function') onConfirmed(val);
        };

        inp.addEventListener('input', (e) => {
            renderMenu(e.target.value);
            if (!onCommitPickOnly) onChangeCallback(e.target.value);
        });

        inp.addEventListener('focus', () => { showMenu(); });

        inp.addEventListener('blur', () => {
            setTimeout(() => {
                if (!isDisambiguating) hideMenu();
            }, 180);
            processTopicCommit(inp.value);
        });

        inp.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const t = String(inp.value || '').trim();
            if (onCommitPickOnly) {
                onChangeCallback(t);
            }
            hideMenu();
            processTopicCommit(t);
            inp.blur();
        });

        const onDocClick = (e) => {
            if (menuWrap.style.display === 'none') return;
            if (wrap.contains(e.target) || menuWrap.contains(e.target)) return;
            hideMenu();
        };
        document.addEventListener('pointerdown', onDocClick, true);

        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);

        // Clean up body-appended menu and listeners explicitly. Idempotent so a list rerender
        // and the later loadWidget sweep can both run. Subtree cleanup also drops the sweep entry
        // so a detached menu is not retained by the cleanup list.
        let topicDropdownCleaned = false;
        const cleanupTopicDropdown = () => {
            if (topicDropdownCleaned) return;
            topicDropdownCleaned = true;
            hideMenu();
            document.removeEventListener('pointerdown', onDocClick, true);
            if (menuWrap.parentNode) menuWrap.parentNode.removeChild(menuWrap);
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onScroll);
        };
        wrap._dsCleanup = function () {
            cleanupTopicDropdown();
            if (window._dsDropdownCleanups) {
                const at = window._dsDropdownCleanups.indexOf(cleanupTopicDropdown);
                if (at >= 0) window._dsDropdownCleanups.splice(at, 1);
            }
        };
        window._dsDropdownCleanups.push(cleanupTopicDropdown);

        ddIcon.onmousedown = (e) => e.preventDefault();
        ddIcon.onclick = () => {
            if (menuWrap.style.display === 'none') {
                inp.focus();
            } else {
                inp.blur();
            }
        };

        wrap.appendChild(linkIcon);
        wrap.appendChild(inp);
        wrap.appendChild(ddIcon);
        Editor._bindOverflowTitle(inp, inp, function () { return inp.value; });

        return wrap;
    },

    /**
     * Shared Output Topics editor panel (Light Grid per-light topics + Switch extra output topics).
     * @param {HTMLElement} container
     * @param {{ mode?: 'simple'|'withPayloads', entries: Array, onChange: (list: Array, persistImmediate?: boolean) => void, addButtonLabel?: string, headerLabel?: string, switchMode?: string, separateOnOffTopics?: boolean, showHoldToActivate?: boolean }} options
     * @returns {{ rerender: function }}
     */
    renderOutputTopicsPanel: function (container, options) {
        const panelMode = options.mode || 'simple';
        const entries = options.entries;
        const onChange = options.onChange;
        const addButtonLabel = options.addButtonLabel || 'Add Topic';
        const headerLabelBase = options.headerLabel || 'Output Topics';
        const withPayloads = panelMode === 'withPayloads';
        const topicTipType = options.tooltipWidgetType || Editor._inspectorTooltipWidgetType(false);
        const topicTipPrefix = options.tooltipPrefix || 'extra';
        const stampTopicTip = (el, suffix) => {
            if (!el || !suffix) return;
            el.setAttribute('data-editor-tooltip', topicTipPrefix + '.' + suffix);
            Editor._stampTooltipWidgetType(el, topicTipType);
        };

        const render = () => {
            // Read mode flags per render: callers mutate `options` and call rerender() when the
            // switch mode or separate on/off topics setting changes.
            const switchMode = options.switchMode || 'toggle';
            const isPush = switchMode === 'push';
            const separateOnOffTopics = withPayloads && !isPush && options.separateOnOffTopics === true;
            const showHoldToActivate = withPayloads && options.showHoldToActivate === true;
            const onSplit = typeof options.onSplit === 'function' ? options.onSplit : null;

            Editor._cleanupSubtreeDropdowns(container);
            container.innerHTML = '';
            container.className = 'flex flex-col gap-2 p-2 rounded';
            container.style.backgroundColor = 'var(--ui-header-bg)';
            container.style.border = '1px solid var(--ui-border)';

            const list = Array.isArray(entries) ? entries : [];

            const ensurePayloadEntry = (idx) => {
                if (!list[idx] || typeof list[idx] !== 'object') {
                    list[idx] = (typeof SwitchWidget !== 'undefined' && typeof SwitchWidget.extraOutputTopicDefaults === 'function')
                        ? SwitchWidget.extraOutputTopicDefaults()
                        : { topic: '', topicOff: '', onPayload: 'true', offPayload: 'false', holdToActivate: false };
                }
                return list[idx];
            };
            const tHeader = document.createElement('div');
            tHeader.className = 'control-label flex justify-between items-center';
            tHeader.style.color = 'var(--ui-text-muted)';
            tHeader.innerHTML = '<span>' + headerLabelBase + ' (' + list.length + ')</span>';
            stampTopicTip(tHeader, 'header');
            container.appendChild(tHeader);

            list.forEach((entry, tIdx) => {
                const entryWrap = document.createElement('div');
                entryWrap.className = withPayloads
                    ? 'flex flex-col gap-2 mb-2 pb-2 editor-divider-b last:border-0 last:pb-0 last:mb-0'
                    : 'flex w-full mb-1';

                const tDel = document.createElement('button');
                tDel.className = 'btn-tool danger w-8 px-0 flex-shrink-0 rounded-l-none border-l-0';
                tDel.title = 'Remove Topic';
                tDel.innerHTML = '<i class="ph-bold ph-trash"></i>';
                tDel.onclick = () => {
                    list.splice(tIdx, 1);
                    onChange(list, false);
                    render();
                };

                if (withPayloads) {
                    const topicRowOuter = document.createElement('div');
                    topicRowOuter.className = 'flex w-full items-end gap-0';

                    if (separateOnOffTopics) {
                        const topicGrid = document.createElement('div');
                        topicGrid.className = 'grid grid-cols-12 gap-2 flex-1 min-w-0';

                        const mkTopicCol = (labelText, propKey) => {
                            const col = document.createElement('div');
                            col.className = 'col-span-6 flex flex-col gap-1';
                            const lbl = document.createElement('label');
                            lbl.className = 'control-label';
                            lbl.textContent = labelText;
                            stampTopicTip(lbl, propKey === 'topicOff' ? 'offTopic' : 'onTopic');
                            const cur = list[tIdx] || {};
                            const topicVal = cur[propKey] != null ? String(cur[propKey]) : '';
                            const dd = Editor.createTopicDropdown(topicVal, 'Select topic...', (val) => {
                                ensurePayloadEntry(tIdx)[propKey] = val;
                                onChange(list, true);
                            });
                            col.appendChild(lbl);
                            col.appendChild(dd);
                            return col;
                        };

                        topicGrid.appendChild(mkTopicCol('On Output Topic', 'topic'));
                        topicGrid.appendChild(mkTopicCol('Off Output Topic', 'topicOff'));
                        topicRowOuter.appendChild(topicGrid);
                        topicRowOuter.appendChild(tDel);
                    } else {
                        const topicLblRow = document.createElement('label');
                        topicLblRow.className = 'control-label';
                        topicLblRow.textContent = 'Output Topic';
                        stampTopicTip(topicLblRow, 'topic');

                        const tRowWrap = document.createElement('div');
                        tRowWrap.className = 'flex w-full flex-1 min-w-0';

                        const topicStr = (entry && entry.topic != null) ? String(entry.topic) : '';
                        const tRow = Editor.createTopicDropdown(topicStr || '', 'Select topic...', (val) => {
                            ensurePayloadEntry(tIdx).topic = val;
                            onChange(list, true);
                        }, 'rounded-r-none');

                        tRowWrap.appendChild(tRow);
                        tRowWrap.appendChild(tDel);

                        entryWrap.appendChild(topicLblRow);
                        entryWrap.appendChild(tRowWrap);
                    }

                    if (separateOnOffTopics) {
                        entryWrap.appendChild(topicRowOuter);
                    }

                    const payloadRow = document.createElement('div');
                    payloadRow.className = 'grid grid-cols-12 gap-2';

                    const mkPayloadField = (labelText, propKey, cols) => {
                        const col = document.createElement('div');
                        col.className = 'col-span-' + cols + ' flex flex-col gap-1';
                        const lbl = document.createElement('label');
                        lbl.className = 'control-label';
                        lbl.textContent = labelText;
                        stampTopicTip(lbl, propKey === 'onPayload' ? 'onValue' : 'offValue');
                        const inp = document.createElement('input');
                        inp.type = 'text';
                        inp.className = 'control-input w-full text-xs';
                        const cur = list[tIdx] || {};
                        inp.value = cur[propKey] != null ? String(cur[propKey]) : (propKey === 'onPayload' ? 'true' : 'false');
                        inp.oninput = (e) => {
                            ensurePayloadEntry(tIdx)[propKey] = e.target.value;
                            onChange(list, true);
                        };
                        col.appendChild(lbl);
                        col.appendChild(inp);
                        return col;
                    };

                    payloadRow.appendChild(mkPayloadField('On Value', 'onPayload', isPush ? 12 : 6));
                    if (!isPush) {
                        payloadRow.appendChild(mkPayloadField('Off Value', 'offPayload', 6));
                    }
                    entryWrap.appendChild(payloadRow);

                    if (showHoldToActivate) {
                        const holdHint = (typeof SwitchWidget !== 'undefined' && SwitchWidget.HOLD_TO_ACTIVATE_HINT)
                            ? SwitchWidget.HOLD_TO_ACTIVATE_HINT
                            : 'Runs this action after you press and hold the button for the Hold to Activate duration.';
                        const holdCol = document.createElement('div');
                        holdCol.className = 'flex flex-col gap-1';
                        const holdLbl = document.createElement('label');
                        holdLbl.className = 'control-label';
                        holdLbl.textContent = 'Hold to Activate';
                        holdLbl.title = holdHint;
                        stampTopicTip(holdLbl, 'hold');
                        const holdChecked = !!(list[tIdx] && list[tIdx].holdToActivate === true);
                        const holdRow = Editor.createToggleStyleCheckboxRow(holdChecked, (checked) => {
                            ensurePayloadEntry(tIdx).holdToActivate = checked === true;
                            onChange(list, true);
                        }, { title: holdHint });
                        holdCol.appendChild(holdLbl);
                        holdCol.appendChild(holdRow.wrap);
                        entryWrap.appendChild(holdCol);
                    }
                } else {
                    let topicStr = entry != null ? String(entry) : '';
                    const tRowWrap = document.createElement('div');
                    tRowWrap.className = 'flex w-full';

                    const tRow = Editor.createTopicDropdown(topicStr || '', 'Select topic...', (val) => {
                        list[tIdx] = val;
                        onChange(list, true);
                    }, 'rounded-r-none');

                    tRowWrap.appendChild(tRow);
                    if (onSplit && list.length > 1 && topicStr.trim()) {
                        const tSplit = document.createElement('button');
                        tSplit.type = 'button';
                        tSplit.className = 'btn-tool w-8 px-0 flex-shrink-0 rounded-none border-l-0';
                        tSplit.title = 'Split into Its Own Device';
                        tSplit.setAttribute('aria-label', 'Split into Its Own Device');
                        tSplit.innerHTML = '<i class="ph-bold ph-arrow-square-out"></i>';
                        tSplit.onclick = (e) => {
                            e.stopPropagation();
                            onSplit(tIdx);
                        };
                        tRowWrap.appendChild(tSplit);
                    }
                    tRowWrap.appendChild(tDel);
                    entryWrap.appendChild(tRowWrap);
                }

                container.appendChild(entryWrap);
            });

            const tAdd = document.createElement('button');
            tAdd.className = 'btn-tool text-[10px] py-1 mt-1 w-full justify-center bound-topic-text';
            tAdd.innerHTML = '<i class="ph-bold ph-plus"></i> ' + addButtonLabel;
            tAdd.onclick = () => {
                if (withPayloads) {
                    const blank = (typeof SwitchWidget !== 'undefined' && typeof SwitchWidget.extraOutputTopicDefaults === 'function')
                        ? SwitchWidget.extraOutputTopicDefaults()
                        : { topic: '', topicOff: '', onPayload: 'true', offPayload: 'false', holdToActivate: false };
                    list.push(blank);
                } else {
                    list.push('');
                }
                onChange(list, false);
                render();
            };
            container.appendChild(tAdd);
        };

        render();
        return { rerender: render };
    },

    /**
     * Filterable combobox: typing filters the menu only; value commits on list pick, Enter, or blur.
     * @param {{ value?: string, placeholder?: string, getChoices: () => string[], onCommit: (trimmed: string) => void, extraClasses?: string }} options
     */
    createFilteredPicklistDropdown: function (options) {
        const {
            value = '',
            placeholder = 'Selection group id…',
            getChoices,
            onCommit,
            extraClasses = ''
        } = options;
        if (typeof getChoices !== 'function' || typeof onCommit !== 'function') {
            throw new Error('createFilteredPicklistDropdown: getChoices and onCommit required');
        }

        const wrap = document.createElement('div');
        wrap.className = `relative flex items-center w-full bound-topic-wrap bound-picklist-wrap ${extraClasses}`;

        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'control-input bound-topic-text font-mono text-xs pr-7 pl-3 w-full';
        if (extraClasses.includes('rounded-r-none')) inp.classList.add('rounded-r-none');
        inp.placeholder = placeholder;
        inp.value = String(value || '').trim();

        let lastCommitted = inp.value.trim();

        const ddIcon = document.createElement('i');
        ddIcon.className = 'ph-bold ph-caret-down bound-topic-caret absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer transition-colors z-[1001]';

        const menuWrap = document.createElement('div');
        menuWrap.className = 'ds-editor-menu bound-topic-menu';
        menuWrap.style.cssText = 'display:none; position:fixed; max-height:40vh; z-index:10050;';

        const applyCommitIfChanged = () => {
            const t = inp.value.trim();
            if (t === lastCommitted) return;
            lastCommitted = t;
            inp.value = t;
            onCommit(t);
        };

        const renderMenu = (filterStr = '') => {
            menuWrap.innerHTML = '';
            let choices = [];
            try {
                choices = getChoices() || [];
            } catch (e) {
                choices = [];
            }
            if (filterStr) {
                const lower = filterStr.toLowerCase();
                choices = choices.filter((c) => String(c).toLowerCase().includes(lower));
            }
            if (choices.length === 0) {
                menuWrap.innerHTML = '<div class="ds-editor-menu-empty">No matching ids</div>';
            } else {
                choices.forEach((t) => {
                    const id = String(t);
                    const item = document.createElement('div');
                    item.className = 'ds-editor-menu-item bound-topic-text font-mono truncate';
                    item.textContent = id;
                    Editor._bindOverflowTitle(item, item, function () { return id; });
                    item.onmousedown = (e) => {
                        e.preventDefault();
                        inp.value = id;
                        lastCommitted = id;
                        onCommit(id);
                        hideMenu();
                        inp.blur();
                    };
                    menuWrap.appendChild(item);
                });
            }
        };

        const positionMenu = () => {
            Editor._positionFixedDropdownBelowInput(menuWrap, inp);
        };

        const showMenu = () => {
            if (!document.body.contains(menuWrap)) document.body.appendChild(menuWrap);
            renderMenu(inp.value);
            positionMenu();
            menuWrap.style.display = 'block';
        };

        const hideMenu = () => { menuWrap.style.display = 'none'; };

        const onScroll = () => { if (menuWrap.style.display !== 'none') positionMenu(); };

        inp.addEventListener('input', () => {
            renderMenu(inp.value);
        });

        inp.addEventListener('focus', () => { showMenu(); });

        inp.addEventListener('blur', () => {
            setTimeout(() => {
                hideMenu();
                applyCommitIfChanged();
            }, 150);
        });

        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyCommitIfChanged();
                inp.blur();
            }
        });

        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);

        let picklistCleaned = false;
        const cleanupPicklistDropdown = () => {
            if (picklistCleaned) return;
            picklistCleaned = true;
            hideMenu();
            if (menuWrap.parentNode) menuWrap.parentNode.removeChild(menuWrap);
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onScroll);
        };
        wrap._dsCleanup = function () {
            cleanupPicklistDropdown();
            if (window._dsDropdownCleanups) {
                const at = window._dsDropdownCleanups.indexOf(cleanupPicklistDropdown);
                if (at >= 0) window._dsDropdownCleanups.splice(at, 1);
            }
        };
        window._dsDropdownCleanups.push(cleanupPicklistDropdown);

        ddIcon.onmousedown = (e) => e.preventDefault();
        ddIcon.onclick = () => {
            if (menuWrap.style.display === 'none') {
                inp.focus();
            } else {
                inp.blur();
            }
        };

        wrap.appendChild(inp);
        wrap.appendChild(ddIcon);
        Editor._bindOverflowTitle(inp, inp, function () { return inp.value; });

        return {
            wrap,
            input: inp,
            getCommittedValue: () => lastCommitted,
            setCommittedValue: (v) => {
                const t = String(v || '').trim();
                lastCommitted = t;
                inp.value = t;
            }
        };
    },

    /**
     * Filtered group-id combobox + dashboard-level "Allow empty selection" toggle (Switch + Menu item).
     */
    renderSelectionGroupPicklistAndAllowEmpty: function (parent, options) {
        const {
            initialId = '',
            onCommitId,
            inputClassName = '',
            secondaryCheckboxes = null,
            hideOptionRowsWhenNoId = false
        } = options;
        if (typeof onCommitId !== 'function') {
            throw new Error('renderSelectionGroupPicklistAndAllowEmpty: onCommitId required');
        }

        // Mutable: callers drive it from sibling schema fields through `setDisabled`.
        let disabled = options.disabled === true;
        let pick = null;
        let allowBlock = null;
        let optionBlock = null;
        const syncAllow = () => {
            if (!pick || !allowBlock) return;
            const id = pick.getCommittedValue();
            if (hideOptionRowsWhenNoId && optionBlock) {
                optionBlock.style.display = id ? '' : 'none';
            }
            if (hideOptionRowsWhenNoId && !id) {
                return;
            }
            const aInp = allowBlock.input;
            aInp.disabled = !id || disabled;
            aInp.checked = id ? Dashboard.getSelectionGroupAllowEmpty(id) : false;
            const st = allowBlock.wrap.querySelector('span.ml-2');
            if (st) st.textContent = aInp.checked ? 'Enabled' : 'Disabled';
            if (!hideOptionRowsWhenNoId) {
                allowBlock.wrap.style.opacity = (!id || disabled) ? '0.45' : '';
                allowBlock.wrap.style.pointerEvents = (!id || disabled) ? 'none' : '';
            } else {
                allowBlock.wrap.style.opacity = disabled ? '0.45' : '';
                allowBlock.wrap.style.pointerEvents = disabled ? 'none' : '';
            }
        };

        pick = Editor.createFilteredPicklistDropdown({
            value: initialId,
            placeholder: 'Type or pick group id…',
            getChoices: () => (typeof Dashboard !== 'undefined' && typeof Dashboard.getSelectionGroupIdsForPicker === 'function'
                ? Dashboard.getSelectionGroupIdsForPicker()
                : []),
            onCommit: (trimmed) => {
                onCommitId(trimmed);
                syncAllow();
            },
            extraClasses: ''
        });
        if (inputClassName) pick.input.classList.add(...inputClassName.split(/\s+/).filter(Boolean));
        if (disabled) pick.input.disabled = true;

        allowBlock = Editor.createToggleStyleCheckboxRow(
            Dashboard.getSelectionGroupAllowEmpty(String(initialId || '').trim()),
            (on) => {
                const id = pick.getCommittedValue();
                if (!id) return;
                Dashboard.setSelectionGroupAllowEmpty(id, on);
            },
            { title: 'When enabled, an item in this group can be turned off by tapping it again while active.' }
        );

        parent.appendChild(pick.wrap);

        const secondaryList = Array.isArray(secondaryCheckboxes)
            ? secondaryCheckboxes.filter((spec) => spec && spec.label)
            : [];
        const columnCount = 1 + secondaryList.length;
        const gridColsClass = columnCount > 1 ? 'grid grid-cols-2 gap-x-2 w-full' : 'grid grid-cols-1 w-full';

        optionBlock = document.createElement('div');
        optionBlock.className = 'flex flex-col gap-1 w-full';

        const labelRow = document.createElement('div');
        labelRow.className = gridColsClass;

        const controlRow = document.createElement('div');
        controlRow.className = `${gridColsClass} items-start`;

        const allowLabelCell = document.createElement('div');
        allowLabelCell.className = 'min-w-0';
        const allowLbl = document.createElement('div');
        allowLbl.className = 'control-label leading-snug';
        allowLbl.textContent = 'Allow empty selection';
        allowLbl.setAttribute('data-editor-tooltip', 'selection.allowEmpty');
        allowLabelCell.appendChild(allowLbl);
        labelRow.appendChild(allowLabelCell);

        const allowControlCell = document.createElement('div');
        allowControlCell.className = 'min-w-0';
        allowControlCell.appendChild(allowBlock.wrap);
        controlRow.appendChild(allowControlCell);

        const secondaryRefs = [];
        secondaryList.forEach((spec) => {
            const lblCell = document.createElement('div');
            lblCell.className = 'min-w-0';
            const lbl = document.createElement('div');
            lbl.className = 'control-label leading-snug';
            lbl.textContent = spec.label;
            if (spec.tooltipKey) lbl.setAttribute('data-editor-tooltip', spec.tooltipKey);
            lblCell.appendChild(lbl);
            labelRow.appendChild(lblCell);

            const ctrlCell = document.createElement('div');
            ctrlCell.className = 'min-w-0';
            const row = Editor.createToggleStyleCheckboxRow(
                Editor.ensureBool(spec.initialChecked),
                typeof spec.onChange === 'function' ? spec.onChange : () => {},
                { title: spec.title || '' }
            );
            ctrlCell.appendChild(row.wrap);
            controlRow.appendChild(ctrlCell);
            secondaryRefs.push({ col: ctrlCell, labelCell: lblCell, wrap: row.wrap, input: row.input });
        });

        /** Keep the label and control rows on the same column count as the visible secondaries. */
        const applyOptionColumns = () => {
            let visibleSecondaries = 0;
            for (let i = 0; i < secondaryRefs.length; i++) {
                if (secondaryRefs[i].labelCell.style.display !== 'none') visibleSecondaries += 1;
            }
            const cls = visibleSecondaries > 0 ? 'grid grid-cols-2 gap-x-2 w-full' : 'grid grid-cols-1 w-full';
            if (labelRow.className !== cls) labelRow.className = cls;
            const ctrlCls = `${cls} items-start`;
            if (controlRow.className !== ctrlCls) controlRow.className = ctrlCls;
        };

        const setSecondaryVisible = (index, visible) => {
            const ref = secondaryRefs[index];
            if (!ref) return;
            const next = visible ? '' : 'none';
            if (ref.labelCell.style.display === next) return;
            ref.labelCell.style.display = next;
            ref.col.style.display = next;
            applyOptionColumns();
        };

        secondaryList.forEach((spec, i) => {
            if (spec.visible === false) setSecondaryVisible(i, false);
        });

        optionBlock.appendChild(labelRow);
        optionBlock.appendChild(controlRow);
        parent.appendChild(optionBlock);

        const syncSelf = () => {
            if (!allowBlock || !allowBlock.wrap || !document.body.contains(allowBlock.wrap)) {
                return false;
            }
            syncAllow();
            return true;
        };
        Editor._selectionGroupAllowSyncers = Editor._selectionGroupAllowSyncers || [];
        Editor._selectionGroupAllowSyncers.push(syncSelf);

        syncAllow();

        return {
            picklist: pick,
            syncAllowEmpty: syncAllow,
            allowInput: allowBlock.input,
            secondaryRefs,
            setSecondaryVisible,
            setDisabled: (next) => {
                const flag = next === true;
                if (flag === disabled) return;
                disabled = flag;
                pick.input.disabled = flag;
                syncAllow();
            }
        };
    },

    /** Legacy flat key pattern; migrator reads this shape for pre-1.6 dashboards. */
    menuItemBindingKey: function (index, prop) {
        return `menuItem_${index}_${prop}`;
    },

    /** Widget schema field → nested binding path (switch/menu typography & icons). */
    bindingPathFromSchemaField: function (f) {
        if (!f) return null;
        if (f.typographyNested) {
            return ['typography', f.typographyNested.role, f.typographyNested.prop];
        }
        if (f.iconsNested) {
            return [f.iconsNested.root, f.iconsNested.slot, f.iconsNested.prop];
        }
        if (f.iconColorOverridesNested) {
            return ['iconColorOverrides', f.iconColorOverridesNested.slot, f.iconColorOverridesNested.prop];
        }
        if (f.layoutNested) {
            return ['layout', 'responsive', f.layoutNested.prop];
        }
        if (f.containerNested && f.containerNested.path && f.containerNested.path.length) {
            return ['container'].concat(f.containerNested.path);
        }
        if (f.objectNested && f.objectNested.root && f.objectNested.prop) {
            return [f.objectNested.root, f.objectNested.prop];
        }
        return null;
    },

    /** Remove nested + flat icon override keys and optional binding for one icon-style field reset. */
    _applyIconsNestedReset: function (widget, f, freshOverrides) {
        if (!widget || !f || !f.iconsNested || !freshOverrides) return;
        const icn = f.iconsNested;
        const ctor = Object.getPrototypeOf(widget).constructor;
        const iconsRoot = { ...(freshOverrides[icn.root] || {}) };
        const slotObj = { ...(iconsRoot[icn.slot] || {}) };
        delete slotObj[icn.prop];
        if (Object.keys(slotObj).length === 0) delete iconsRoot[icn.slot];
        else iconsRoot[icn.slot] = slotObj;
        if (Object.keys(iconsRoot).length === 0) delete freshOverrides[icn.root];
        else freshOverrides[icn.root] = iconsRoot;
        delete freshOverrides[f.key];
        let km = null;
        if (typeof ctor.resolveIconKeymapForEditorSlot === 'function') {
            km = ctor.resolveIconKeymapForEditorSlot(icn.slot);
        }
        if (!km) {
            km = icn.slot === 'off' && ctor.ICON_KEYMAP_OFF
                ? ctor.ICON_KEYMAP_OFF
                : (ctor.ICON_KEYMAP_ON || null);
        }
        if (km && typeof km === 'object') {
            Object.values(km).forEach((flatKey) => {
                if (flatKey) delete freshOverrides[flatKey];
            });
        }
        if (icn.slot === 'on' && freshOverrides.iconSlotAccentOn !== undefined) {
            delete freshOverrides.iconSlotAccentOn;
        }
        const bindPath = Editor.bindingPathFromSchemaField(f);
        if (bindPath && widget.bindings && typeof BindingsTree !== 'undefined') {
            const b = JSON.parse(JSON.stringify(widget.bindings || {}));
            BindingsTree.deleteAtPath(b, bindPath);
            Dashboard.updateWidgetBinding(widget.id, b, true);
        }
    },

    /**
     * Build `icons` payload for widgets with root `icons.on` / `icons.off`. Shallow `{ ...overrides, ...patch }`
     * replaces the whole `icons` object — classes that expose `ICON_KEYMAP_OFF` (`switch`, `icon`, …) must always send
     * both slots so sparse follower storage is not erased when editing Icon (On) only (`rules/widgetbible.md` Part B §4.4).
     *
     * Saves **minimal** slots — only keys the user has explicitly set, plus the one being changed.
     * No `ensure*Icons` defaults are written to disk; those are applied at render time. For switch, an
     * `effectiveLeaderOn` (with master defaults) is derived separately so pruning compares against the correct
     * effective On values even when `icons.on` itself stores nothing for a given key.
     */
    buildWidgetIconsNestedPatch: function (widget, icn, val) {
        if (!widget || !icn || !icn.root) return null;
        const cloneSlot = function (s) {
            if (!s || typeof s !== 'object') return {};
            try { return JSON.parse(JSON.stringify(s)); } catch (eCl) { return { ...s }; }
        };
        let prevRoot = {};
        try {
            const raw = widget.overrides[icn.root];
            prevRoot = raw && typeof raw === 'object' ? JSON.parse(JSON.stringify(raw)) : {};
        } catch (eIc) {
            prevRoot = { ...(widget.overrides[icn.root] || {}) };
        }

        // Resolve widget type via instanceof — widget.type is not a property on instances.
        const ctor = Object.getPrototypeOf(widget).constructor;
        const isListWidget = typeof ListWidget !== 'undefined' && widget instanceof ListWidget;
        const isSwitchWidget = typeof SwitchWidget !== 'undefined' && widget instanceof SwitchWidget;
        const isIconWidget = typeof IconWidget !== 'undefined' && widget instanceof IconWidget;

        if (isListWidget) {
            const slotNames = ListWidget.LIST_ICON_SLOT_NAMES || ['row', 'checkboxOn', 'checkboxOff'];
            const iconsPatch = {};
            slotNames.forEach(function (slotName) {
                iconsPatch[slotName] = cloneSlot(prevRoot[slotName]);
            });
            if (!iconsPatch[icn.slot] || typeof iconsPatch[icn.slot] !== 'object') {
                iconsPatch[icn.slot] = {};
            }
            iconsPatch[icn.slot][icn.prop] = val;
            if (ListWidget.buildIconsNestedEditorPatch) {
                const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
                const leaderForPrune = {
                    ...ListWidget.defaultListCheckboxOnIconSlotFromMaster(M),
                    ...(iconsPatch.checkboxOn || {})
                };
                return ListWidget.buildIconsNestedEditorPatch('list', icn, iconsPatch, leaderForPrune);
            }
            return { icons: iconsPatch };
        }

        // Minimal clone — no default keys injected; ensure*Icons fills defaults at render time.
        const on = cloneSlot(prevRoot.on);
        const off = cloneSlot(prevRoot.off);
        if (icn.slot === 'on') on[icn.prop] = val;
        else if (icn.slot === 'off') off[icn.prop] = val;
        const iconsPatch = { on };
        const hasOffKeymap = ctor && ctor.ICON_KEYMAP_OFF !== undefined;
        if (icn.slot === 'off' || Object.keys(prevRoot.off || {}).length > 0 || hasOffKeymap) {
            iconsPatch.off = off;
        }
        if (isSwitchWidget) {
            Object.keys(prevRoot).forEach(function (slotName) {
                if (slotName === 'on' || slotName === 'off') return;
                iconsPatch[slotName] = cloneSlot(prevRoot[slotName]);
            });
            if (icn.slot !== 'on' && icn.slot !== 'off') {
                if (!iconsPatch[icn.slot] || typeof iconsPatch[icn.slot] !== 'object') {
                    iconsPatch[icn.slot] = {};
                }
                iconsPatch[icn.slot][icn.prop] = val;
            }
        }
        if (isIconWidget && IconWidget.buildIconsNestedEditorPatch) {
            return IconWidget.buildIconsNestedEditorPatch('icon', icn, iconsPatch);
        }
        if (isSwitchWidget && SwitchWidget.buildIconsNestedEditorPatch) {
            // Derive master-aware effective On so the sparse-off prune compares against real defaults
            // (e.g. master weight='regular' ≠ 'fill', so off.weight='regular' is correctly pruned).
            const envForPrune = { icons: { on: { ...on } } };
            SwitchWidget.ensureSwitchIcons(envForPrune);
            return SwitchWidget.buildIconsNestedEditorPatch('switch', icn, iconsPatch, envForPrune.icons.on);
        }
        return { icons: iconsPatch };
    },

    /**
     * Build `typography` payload for nested typography saves. Graph widgets opt in to
     * `buildTypographyNestedEditorPatch` for sparse axisY follower pruning.
     */
    buildWidgetTypographyNestedPatch: function (widget, tn, val) {
        if (!widget || !tn || tn.root !== 'typography') return null;
        const cloneSlot = function (s) {
            if (!s || typeof s !== 'object') return {};
            try { return JSON.parse(JSON.stringify(s)); } catch (eCl) { return { ...s }; }
        };
        let prevRoot = {};
        try {
            const raw = widget.overrides.typography;
            prevRoot = raw && typeof raw === 'object' ? JSON.parse(JSON.stringify(raw)) : {};
        } catch (eTy) {
            prevRoot = { ...(widget.overrides.typography || {}) };
        }
        const typ = {};
        Object.keys(prevRoot).forEach(function (role) {
            typ[role] = cloneSlot(prevRoot[role]);
        });
        if (!typ[tn.role] || typeof typ[tn.role] !== 'object') typ[tn.role] = {};
        typ[tn.role][tn.prop] = val;

        const isGraphWidget = typeof GraphWidget !== 'undefined' && widget instanceof GraphWidget;
        if (isGraphWidget && GraphWidget.buildTypographyNestedEditorPatch) {
            return GraphWidget.buildTypographyNestedEditorPatch('graph', typ);
        }
        return { typography: typ };
    },

    /**
     * Build a `layout.responsive` patch for a Responsive Layout & Dimensions field.
     * Deep-merges with the existing nested blob so editing one field never drops
     * sibling responsive settings. Structural isolation: this path never touches
     * fixed-mode `x/y/width/height`.
     */
    buildWidgetLayoutNestedPatch: function (widget, ln, val) {
        if (!widget || !ln || !ln.prop) return null;
        const cloneResp = function (r) {
            if (!r || typeof r !== 'object') return {};
            try { return JSON.parse(JSON.stringify(r)); } catch (eCl) { return { ...r }; }
        };
        let prevLayout = {};
        try {
            const raw = widget.overrides.layout;
            prevLayout = raw && typeof raw === 'object' ? JSON.parse(JSON.stringify(raw)) : {};
        } catch (eLay) {
            prevLayout = { ...(widget.overrides.layout || {}) };
        }
        const resp = cloneResp(prevLayout.responsive);
        if (ln.prop === 'scaleMode') {
            if (val === 'rescale') resp.scaleMode = 'rescale';
            else delete resp.scaleMode;
        } else {
            resp[ln.prop] = val;
        }
        if (ln.prop === 'cellHeightMode') delete resp.heightMode;
        if (ln.prop === 'cellHeight') delete resp.height;
        prevLayout.responsive = resp;
        return { layout: prevLayout };
    },

    buildWidgetContainerNestedPatch: function (widget, spec, val) {
        if (!widget || !spec || !spec.path || !spec.path.length) return null;
        let prev = {};
        try {
            const raw = widget.overrides.container;
            prev = raw && typeof raw === 'object' ? JSON.parse(JSON.stringify(raw)) : {};
        } catch (eBox) {
            prev = { ...(widget.overrides.container || {}) };
        }
        if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.setAtPath === 'function') {
            SaveFormatV2.setAtPath(prev, spec.path, val);
        } else {
            prev[spec.path[0]] = val;
        }
        return { container: prev };
    },

    buildWidgetObjectNestedPatch: function (widget, spec, val) {
        if (!widget || !spec || !spec.root || !spec.prop) return null;
        let prev = {};
        try {
            const raw = widget.overrides[spec.root];
            prev = raw && typeof raw === 'object' ? JSON.parse(JSON.stringify(raw)) : {};
        } catch (eObj) {
            prev = { ...(widget.overrides[spec.root] || {}) };
        }
        prev[spec.prop] = val;
        const patch = {};
        patch[spec.root] = prev;
        return patch;
    },

    /** Remap `bindings.lightsData` when light rows are reordered or deleted. */
    remapLightItemBindings: function (bindings, arrBefore, arrAfter) {
        const next = JSON.parse(JSON.stringify(bindings || {}));
        const oldRows = Array.isArray(next.lightsData) ? next.lightsData : [];
        const oldToNew = {};
        arrAfter.forEach((it, ni) => {
            const oi = arrBefore.indexOf(it);
            if (oi >= 0) oldToNew[oi] = ni;
        });
        const newRows = [];
        Object.keys(oldToNew).forEach((oiStr) => {
            const oi = parseInt(oiStr, 10);
            const ni = oldToNew[oi];
            const src = oldRows[oi];
            if (src !== undefined && src !== null && typeof src === 'object') {
                newRows[ni] = JSON.parse(JSON.stringify(src));
            }
        });
        next.lightsData = newRows;
        return next;
    },

    /** Remap `bindings.series` when graph series rows are reordered or deleted. */
    remapGraphSeriesBindings: function (bindings, arrBefore, arrAfter) {
        const next = JSON.parse(JSON.stringify(bindings || {}));
        const oldRows = Array.isArray(next.series) ? next.series : [];
        const oldToNew = {};
        arrAfter.forEach((it, ni) => {
            const oi = arrBefore.indexOf(it);
            if (oi >= 0) oldToNew[oi] = ni;
        });
        const newRows = [];
        Object.keys(oldToNew).forEach((oiStr) => {
            const oi = parseInt(oiStr, 10);
            const ni = oldToNew[oi];
            const src = oldRows[oi];
            if (src !== undefined && src !== null && typeof src === 'object') {
                newRows[ni] = JSON.parse(JSON.stringify(src));
            }
        });
        next.series = newRows;
        return next;
    },

    /** Duplicate `bindings.series` row after `index`. */
    duplicateGraphSeriesBindingsAt: function (bindings, index) {
        const next = JSON.parse(JSON.stringify(bindings || {}));
        const rows = Array.isArray(next.series) ? next.series.slice() : [];
        while (rows.length <= index) rows.push(null);
        const src = rows[index];
        const dup = (src && typeof src === 'object') ? JSON.parse(JSON.stringify(src)) : {};
        rows.splice(index + 1, 0, dup);
        next.series = rows;
        return next;
    },

    graphSeriesBindSyntheticField: function (seriesId, prop, fieldType, label) {
        const p = prop || 'data';
        const type = fieldType || (p === 'data' ? 'text' : 'color');
        const lab = label || (p === 'data' ? 'Data' : p);
        return { key: 'graphSeries_' + seriesId + '_' + p, type: type, label: lab };
    },

    _getGraphSeriesBindFallbackFromMerged: function (values, fieldKey) {
        const propPattern = (typeof GraphWidget !== 'undefined' && typeof GraphWidget.seriesBindPropPattern === 'function')
            ? GraphWidget.seriesBindPropPattern()
            : 'data|name|visible|positiveColor|positiveColorOpacity|negativeColor|negativeColorOpacity|positiveFillColor|negativeFillColor|pointColor|positiveOutlineColor|negativeOutlineColor|lineWidth|positiveStartOpacity|positiveEndOpacity|negativeStartOpacity|negativeEndOpacity|valueMultiplier';
        const m = typeof fieldKey === 'string'
            ? fieldKey.match(new RegExp('^graphSeries_(.+)_(' + propPattern + ')$'))
            : null;
        if (!m || !values || !Array.isArray(values.series)) return undefined;
        const id = m[1];
        const prop = m[2];
        for (let i = 0; i < values.series.length; i++) {
            const row = values.series[i];
            if (row && row.id === id) return row[prop];
        }
        return undefined;
    },

    /** Remap `bindings.menuItems` when menu rows are reordered or deleted (v1.6+). */
    remapMenuItemBindings: function (bindings, arrBefore, arrAfter) {
        const next = JSON.parse(JSON.stringify(bindings || {}));
        const oldRows = Array.isArray(next.menuItems) ? next.menuItems : [];
        const oldToNew = {};
        arrAfter.forEach((it, ni) => {
            const oi = arrBefore.indexOf(it);
            if (oi >= 0) oldToNew[oi] = ni;
        });
        const newRows = [];
        Object.keys(oldToNew).forEach((oiStr) => {
            const oi = parseInt(oiStr, 10);
            const ni = oldToNew[oi];
            const src = oldRows[oi];
            if (src !== undefined && src !== null && typeof src === 'object') {
                newRows[ni] = JSON.parse(JSON.stringify(src));
            }
        });
        next.menuItems = newRows;
        return next;
    },

    /** Duplicate `bindings.menuItems` row after `insertAfterIndex` (v1.6+). */
    duplicateMenuItemBindingsAt: function (bindings, insertAfterIndex) {
        const next = JSON.parse(JSON.stringify(bindings || {}));
        const rows = Array.isArray(next.menuItems) ? [...next.menuItems] : [];
        while (rows.length <= insertAfterIndex) rows.push(null);
        const src = rows[insertAfterIndex];
        const dup = (src && typeof src === 'object') ? JSON.parse(JSON.stringify(src)) : {};
        rows.splice(insertAfterIndex + 1, 0, dup);
        next.menuItems = rows;
        return next;
    },

    /** Full overrides after inserting a duplicate menu row (item_*_state indices + menuItems array). */
    duplicateMenuItemOverridesAt: function (overrides, insertAfterIndex, newMenuItems) {
        const base = { ...(overrides || {}) };
        base.menuItems = newMenuItems;
        const byIndex = {};
        Object.keys(base).forEach(k => {
            const m = k.match(/^item_(\d+)_state$/);
            if (!m) return;
            byIndex[parseInt(m[1], 10)] = base[k];
            delete base[k];
        });
        const idxList = Object.keys(byIndex).map(Number).filter(n => !Number.isNaN(n));
        const maxIdx = idxList.length ? Math.max.apply(null, idxList) : -1;
        for (let i = maxIdx; i > insertAfterIndex; i--) {
            if (byIndex[i] !== undefined) {
                byIndex[i + 1] = byIndex[i];
                delete byIndex[i];
            }
        }
        if (byIndex[insertAfterIndex] !== undefined) {
            byIndex[insertAfterIndex + 1] = byIndex[insertAfterIndex];
        }
        Object.keys(byIndex).forEach(iStr => {
            base[`item_${iStr}_state`] = byIndex[iStr];
        });
        return base;
    },

    /**
     * Index stored after `prefix`. Menu icon keys also keep an `_on` / `_off` slot suffix.
     * @returns {{ index: number, suffix: string }|null}
     */
    _parseIndexedPanelState: function (key, prefix, allowSlotSuffix) {
        if (typeof key !== 'string' || key.indexOf(prefix) !== 0) return null;
        let idxStr = key.slice(prefix.length);
        let suffix = '';
        if (allowSlotSuffix) {
            if (idxStr.slice(-4) === '_off') {
                suffix = '_off';
                idxStr = idxStr.slice(0, -4);
            } else if (idxStr.slice(-3) === '_on') {
                suffix = '_on';
                idxStr = idxStr.slice(0, -3);
            }
        }
        if (!/^\d+$/.test(idxStr)) return null;
        return { index: parseInt(idxStr, 10), suffix: suffix };
    },

    /**
     * Move list-row and inner icon slideout collapse flags onto the new row indexes.
     * `mapIndex(oldIndex)` returns the new index, or undefined when that row was removed.
     */
    _remapIndexedPanelStates: function (widgetId, listFieldKey, mapIndex) {
        const specs = [
            { prefix: `list_row_ui_${widgetId}_${listFieldKey}_`, allowSlot: false }
        ];
        if (listFieldKey === 'menuItems') {
            specs.push({ prefix: `menu_icon_style_${widgetId}_`, allowSlot: true });
        } else if (listFieldKey === 'lightsData') {
            specs.push({ prefix: `lg_light_icon_${widgetId}_`, allowSlot: false });
        }
        const nextEntries = {};
        const self = this;
        Object.keys(this.panelStates).forEach(function (k) {
            for (let s = 0; s < specs.length; s++) {
                const spec = specs[s];
                const parsed = self._parseIndexedPanelState(k, spec.prefix, spec.allowSlot);
                if (!parsed) continue;
                const stored = self.panelStates[k];
                delete self.panelStates[k];
                const ni = mapIndex(parsed.index);
                if (ni === undefined || ni === null) return;
                nextEntries[spec.prefix + ni + parsed.suffix] = stored;
                return;
            }
        });
        Object.keys(nextEntries).forEach(function (k) {
            self.panelStates[k] = nextEntries[k];
        });
    },

    remapEditorListRowCollapseStatesAfterMenuInsert: function (widgetId, listFieldKey, insertAfterIndex) {
        this._remapIndexedPanelStates(widgetId, listFieldKey, function (oi) {
            return oi <= insertAfterIndex ? oi : oi + 1;
        });
    },

    /**
     * Stable panelStates key for collapsible list rows (menu items, lights, …). Values survive loadWidget;
     * use remapEditorListRowCollapseStates after reorder/delete (same identity map as remapMenuItemBindings).
     */
    editorListRowCollapseKey: function (widgetId, listFieldKey, index) {
        return `list_row_ui_${widgetId}_${listFieldKey}_${index}`;
    },

    remapEditorListRowCollapseStates: function (widgetId, listFieldKey, arrBefore, arrAfter) {
        const oldToNew = {};
        arrAfter.forEach((it, ni) => {
            const oi = arrBefore.indexOf(it);
            if (oi >= 0) oldToNew[oi] = ni;
        });
        this._remapIndexedPanelStates(widgetId, listFieldKey, function (oi) {
            return oldToNew[oi];
        });
    },

    /**
     * Persist expand/collapse across loadWidget. panelStates[stateKey] === true means expanded (content visible).
     */
    attachPersistedEditorCollapse: function (stateKey, headerEl, contentEl, chevronEl, opts) {
        opts = opts || {};
        const expandInnerSlideoutGroups = () => {
            if (!contentEl || typeof contentEl.querySelectorAll !== 'function') return;
            contentEl.querySelectorAll(':scope > .control-group.collapsed').forEach(function (g) {
                g.classList.remove('collapsed');
            });
        };
        const apply = (expanded) => {
            const card = headerEl && headerEl.parentElement;
            if (expanded) {
                contentEl.classList.remove('hidden');
                expandInnerSlideoutGroups();
                headerEl.classList.add('active');
                if (card && card.classList) card.classList.remove('editor-collapse-card--closed');
                if (chevronEl) {
                    chevronEl.classList.add('rotate-180');
                    if (opts.chevronAccent) chevronEl.style.color = opts.chevronAccent;
                }
            } else {
                contentEl.classList.add('hidden');
                headerEl.classList.remove('active');
                if (card && card.classList) card.classList.add('editor-collapse-card--closed');
                if (contentEl && typeof contentEl.querySelectorAll === 'function') {
                    contentEl.querySelectorAll('.ds-dropdown-fixed').forEach(function (m) {
                        Editor._closeDsFixedDropdown(m);
                    });
                }
                if (chevronEl) {
                    chevronEl.classList.remove('rotate-180');
                    chevronEl.style.color = '';
                }
            }
        };
        apply(this.panelStates[stateKey] === true);
        headerEl.addEventListener('click', () => {
            const willExpand = contentEl.classList.contains('hidden');
            this.panelStates[stateKey] = willExpand;
            apply(willExpand);
        });
    },

    /**
     * Primary title plus one muted suffix. Base and the rest of the suffix share
     * the same color, so a leader reads "Base Typography" the way an icon leader
     * reads "Base Icon Style".
     * @returns {HTMLElement} the primary title span
     */
    fillEditorCollapseTitle: function (titleBlock, primaryText, suffixText) {
        titleBlock.textContent = '';
        const titlePrimary = document.createElement('span');
        titlePrimary.className = 'truncate text-xs font-bold text-[var(--ui-text)] tracking-wide';
        titlePrimary.textContent = primaryText || '';
        const titleMuted = document.createElement('span');
        titleMuted.className = 'flex-shrink-0 text-xs font-bold text-[var(--ui-text-muted)] tracking-wide';
        titleMuted.textContent = '\u00a0' + (suffixText || '');
        titleBlock.appendChild(titlePrimary);
        titleBlock.appendChild(titleMuted);
        return titlePrimary;
    },

    /**
     * Shared collapsible shell for Icon Style groups (switch `icon_style` schema + menu_list row blocks).
     * @param {HTMLElement} mountParent
     * @param {object} options
     * @param {string} options.titleLabel
     * @param {string} [options.headerSuffix] - Muted trailing segment after `titleLabel` (default **`Icon Style`**).
     * @param {string} options.collapseStateKey
     * @param {string} options.contentClassName - full class list for body (must include editor-collapse-content)
     * @param {string} [options.outerWrapperClassName] - optional wrapper around the card (e.g. menu row span)
     * @param {string} [options.cardClassName]
     * @param {object} [options.chevronOpts] - passed to attachPersistedEditorCollapse
     * @returns {{ wrapOuter: HTMLElement|null, wrapCard: HTMLElement, subGrid: HTMLElement, previewSlot: HTMLElement, headerBtn: HTMLElement, chevron: HTMLElement }}
     */
    createIconStyleCollapsibleSection: function (mountParent, options) {
        const titleLabel = options.titleLabel || '';
        const collapseKey = options.collapseStateKey;
        const chevronOpts = options.chevronOpts !== undefined ? options.chevronOpts : { chevronAccent: 'var(--ui-accent)' };

        let wrapOuter = null;
        let cardParent = mountParent;
        if (options.outerWrapperClassName) {
            wrapOuter = document.createElement('div');
            wrapOuter.className = options.outerWrapperClassName;
            mountParent.appendChild(wrapOuter);
            cardParent = wrapOuter;
        }

        const wrapCard = document.createElement('div');
        wrapCard.className = options.cardClassName || 'editor-collapse-card editor-collapse-card--closed mt-1 w-full';

        const btn = document.createElement('div');
        btn.className = 'editor-collapse-header gap-4';
        if (options.tooltipKey) btn.setAttribute('data-editor-tooltip', options.tooltipKey);
        if (options.widgetType) btn.setAttribute('data-widget-type', options.widgetType);

        const previewSlot = document.createElement('span');
        previewSlot.className = 'flex-shrink-0 w-8 h-8 flex items-center justify-center pointer-events-none text-[var(--ui-accent)]';

        const titleBlock = document.createElement('div');
        titleBlock.className = 'flex items-center gap-2 min-w-0 flex-1 pointer-events-none truncate';
        const rawSuffix = options.headerSuffix;
        const suffix = (rawSuffix !== undefined && rawSuffix !== null && String(rawSuffix).trim() !== '')
            ? String(rawSuffix).trim()
            : 'Icon Style';
        this.fillEditorCollapseTitle(titleBlock, String(titleLabel || ''), suffix);

        const chevron = document.createElement('i');
        chevron.className = 'ph-bold ph-caret-down text-[var(--ui-text-muted)] transition-transform duration-200 flex-shrink-0';

        btn.appendChild(previewSlot);
        btn.appendChild(titleBlock);
        btn.appendChild(chevron);

        const subGrid = document.createElement('div');
        subGrid.className = options.contentClassName || 'editor-collapse-content hidden flex flex-col gap-3';

        this.attachPersistedEditorCollapse(collapseKey, btn, subGrid, chevron, chevronOpts);

        wrapCard.appendChild(btn);
        wrapCard.appendChild(subGrid);
        cardParent.appendChild(wrapCard);

        return { wrapOuter, wrapCard, subGrid, previewSlot, headerBtn: btn, chevron };
    },

    /**
     * True when an Icon Style shape value should be treated as inherit (unset), not as a chosen glyph.
     * Empty string is inherit so headers can paint defaultKey / leader-slot icons.
     */
    _isIconStylePreviewShapeBlank: function (logical, value) {
        if (logical === 'tintImage') return value !== true && value !== false;
        return value === undefined || value === null || String(value).trim() === '';
    },

    _iconStyleKeyMapsMatch: function (a, b) {
        return !!(a && b && a.source && b.source && a.source === b.source && a.builtin === b.builtin);
    },

    _schemaContainsIconStyleKeyMap: function (nodes, keyMap) {
        if (!nodes || !keyMap) return false;
        const list = Array.isArray(nodes) ? nodes : (nodes.fields ? nodes.fields : null);
        if (!list) return false;
        for (let i = 0; i < list.length; i++) {
            const n = list[i];
            if (!n) continue;
            if (n.type === 'icon_style' && this._iconStyleKeyMapsMatch(n.iconStyleKeyMap, keyMap)) return true;
            if (Array.isArray(n.fields) && this._schemaContainsIconStyleKeyMap(n.fields, keyMap)) return true;
        }
        return false;
    },

    _leaderKeymapFromIconSpec: function (ctor, spec) {
        if (!spec) return null;
        if (spec.leaderKeymap) return spec.leaderKeymap;
        if (!ctor) return null;
        const slot = spec.leaderSlot;
        if (slot === 'on' && ctor.ICON_KEYMAP_ON) return ctor.ICON_KEYMAP_ON;
        if (slot === 'off' && ctor.ICON_KEYMAP_OFF) return ctor.ICON_KEYMAP_OFF;
        if (slot === 'checkboxOn' && ctor.ICON_KEYMAP_CHECKBOX_ON) return ctor.ICON_KEYMAP_CHECKBOX_ON;
        return null;
    },

    /**
     * Leader/follower Icon Style wiring for header previews.
     * Instance inspectors use the selected widget only. Master inspectors only use a widget class
     * whose globalSchema actually owns this keymap (avoids Switch Off keys colliding with Icon Default).
     */
    _findFollowerIconSlotSpec: function (followerKm, isGlobal) {
        if (!followerKm || !followerKm.source) return null;
        const self = this;
        const consider = function (ctor) {
            if (!ctor || !ctor.INHERIT_EDITOR_ICON_SLOTS) return null;
            const spec = ctor.INHERIT_EDITOR_ICON_SLOTS;
            if (!self._iconStyleKeyMapsMatch(spec.followerKeymap, followerKm)) return null;
            if (isGlobal && !self._schemaContainsIconStyleKeyMap(ctor.globalSchema, followerKm)) return null;
            const leaderKm = self._leaderKeymapFromIconSpec(ctor, spec);
            if (!leaderKm) return null;
            return { inheritKeys: spec.inheritKeys, leaderKeymap: leaderKm };
        };
        if (!isGlobal && this.currentId && typeof Dashboard !== 'undefined' && Dashboard.widgets) {
            const widget = Dashboard.widgets[this.currentId];
            if (widget) return consider(Object.getPrototypeOf(widget).constructor);
            return null;
        }
        if (typeof WidgetRegistry === 'undefined' || !WidgetRegistry.widgets) return null;
        const types = Object.keys(WidgetRegistry.widgets);
        for (let i = 0; i < types.length; i++) {
            const hit = consider(WidgetRegistry.widgets[types[i]]);
            if (hit) return hit;
        }
        return null;
    },

    _fieldDefForIconStylePreview: function (flatKey, fields) {
        if (Array.isArray(fields)) {
            for (let i = 0; i < fields.length; i++) {
                if (fields[i] && fields[i].key === flatKey) return fields[i];
            }
        }
        const reg = this.fieldRegistry && this.fieldRegistry[flatKey];
        return (reg && reg.fieldDef) ? reg.fieldDef : null;
    },

    _liveIconStylePreviewValue: function (flatKey, logical) {
        const reg = this.fieldRegistry && this.fieldRegistry[flatKey];
        if (!reg || !reg.inputEl) return undefined;
        const el = reg.inputEl;
        const live = (el.type === 'checkbox') ? el.checked : el.value;
        if (this._isIconStylePreviewShapeBlank(logical, live)) return undefined;
        return live;
    },

    _inheritIconStylePreviewValue: function (logical, field, merged) {
        if (!field) return undefined;
        const keys = [];
        if (field.defaultKey) keys.push(field.defaultKey);
        if (field.defaultKeyFallback) keys.push(field.defaultKeyFallback);
        const bags = [merged];
        if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS) bags.push(MASTER_SETTINGS);
        if (typeof DataConfig !== 'undefined' && DataConfig) bags.push(DataConfig);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            for (let b = 0; b < bags.length; b++) {
                const bag = bags[b];
                if (!bag || bag[key] === undefined || bag[key] === null) continue;
                if (!this._isIconStylePreviewShapeBlank(logical, bag[key])) return bag[key];
            }
        }
        return undefined;
    },

    _fillMissingIconPreviewFromLeader: function (previewMerged, followerKm, previewKeyMap, isGlobal) {
        const spec = this._findFollowerIconSlotSpec(followerKm, isGlobal === true);
        if (!spec || !spec.leaderKeymap || !spec.inheritKeys) return;
        const self = this;
        spec.inheritKeys.forEach(function (logical) {
            if (!previewKeyMap[logical]) return;
            const followerKey = followerKm[logical];
            if (!followerKey) return;
            if (!self._isIconStylePreviewShapeBlank(logical, previewMerged[followerKey])) return;
            const leaderKey = spec.leaderKeymap[logical];
            if (!leaderKey) return;
            let value = previewMerged[leaderKey];
            if (self._isIconStylePreviewShapeBlank(logical, value)) {
                const live = self._liveIconStylePreviewValue(leaderKey, logical);
                if (!self._isIconStylePreviewShapeBlank(logical, live)) value = live;
            }
            if (self._isIconStylePreviewShapeBlank(logical, value)) {
                const leaderField = self._fieldDefForIconStylePreview(leaderKey, null);
                value = self._inheritIconStylePreviewValue(logical, leaderField, previewMerged);
            }
            if (!self._isIconStylePreviewShapeBlank(logical, value)) previewMerged[followerKey] = value;
        });
    },

    /**
     * Paints the collapsible header icon preview (shared by `icon_style` / switch and menu_list row blocks).
     * Uses source/builtin/weight/customUrl/tint only - fixed tray size - not slot size, offsets, rotation, or slot colors.
     * Resolves empty inherit the same way inspector fields do (defaultKey, live input, leader slot).
     * @param {HTMLElement} previewSlot
     * @param {object} keyMap - same as BaseWidget.applyIconStyleToElement
     * @param {function(): object} getFlatValues - merged flat icon keys for one slot (or full widget merge for switch)
     * @param {string} [colorCss] - defaults to var(--ui-accent)
     * @param {object} [options] - `{ isGlobal, fields }`
     */
    fillIconStyleHeaderPreview: function (previewSlot, keyMap, getFlatValues, colorCss, options) {
        if (!previewSlot || !keyMap || typeof getFlatValues !== 'function') return;
        const opts = options || {};
        const merged = getFlatValues() || {};
        previewSlot.innerHTML = '';
        previewSlot.style.width = '';
        previewSlot.style.height = '';
        const HEADER_PREVIEW_SHAPE_KEYS = ['source', 'builtin', 'weight', 'customUrl', 'tintImage'];
        const previewKeyMap = {};
        HEADER_PREVIEW_SHAPE_KEYS.forEach((k) => {
            if (keyMap[k]) previewKeyMap[k] = keyMap[k];
        });
        const previewMerged = {};
        const self = this;
        Object.keys(previewKeyMap).forEach((logical) => {
            const flatKey = previewKeyMap[logical];
            if (!flatKey) return;
            let value;
            if (Object.prototype.hasOwnProperty.call(merged, flatKey)
                    && !self._isIconStylePreviewShapeBlank(logical, merged[flatKey])) {
                value = merged[flatKey];
            }
            const live = self._liveIconStylePreviewValue(flatKey, logical);
            if (!self._isIconStylePreviewShapeBlank(logical, live)) value = live;
            if (self._isIconStylePreviewShapeBlank(logical, value)) {
                const field = self._fieldDefForIconStylePreview(flatKey, opts.fields);
                value = self._inheritIconStylePreviewValue(logical, field, merged);
            }
            if (!self._isIconStylePreviewShapeBlank(logical, value)) previewMerged[flatKey] = value;
        });
        this._fillMissingIconPreviewFromLeader(previewMerged, keyMap, previewKeyMap, opts.isGlobal === true);
        const pw = document.createElement('div');
        pw.className = 'w-full h-full flex items-center justify-center overflow-hidden text-[18px]';
        BaseWidget.applyIconStyleToElement(pw, previewMerged, previewKeyMap, {
            color: colorCss != null ? String(colorCss) : 'var(--ui-accent)'
        });
        previewSlot.appendChild(pw);
    },

    /** menu_list row header: preview active (on) icon — Phosphor or custom image. */
    menuItemListTitleHtml: function (item) {
        const rawLab = item.mode === 'separator' ? 'Separator' : (item.label || 'Menu Item');
        const lab = Editor._escapeControlLabel(rawLab);
        if (typeof MenuWidget !== 'undefined') MenuWidget.ensureMenuItemIcons(item);
        const on = (item.icons && item.icons.on) || {};
        const shim = { iconSourceOn: on.source, imgOn: on.customUrl, iconOn: on.builtin };
        const km = { source: 'iconSourceOn', customUrl: 'imgOn' };
        const source = BaseWidget.inferIconStyleSource(shim, km);
        if (source === 'custom') {
            const url = String(on.customUrl || '').trim();
            if (url) {
                const safe = Editor._escapeControlLabel(url);
                return '<img src="' + safe + '" alt="" class="w-4 h-4 object-contain inline-block align-middle rounded-sm" /> <span class="truncate align-middle">' + lab + '</span>';
            }
        }
        const ic = Editor._escapeControlLabel(String(on.builtin || '').trim());
        if (ic) {
            const w = Editor._escapeControlLabel(BaseWidget.phosphorWeightClass(on.weight));
            return '<i class="' + w + ' ' + ic + ' text-[var(--ui-accent)] text-base"></i> <span class="truncate">' + lab + '</span>';
        }
        return '<span class="truncate">' + lab + '</span>';
    },

    lightItemListTitleHtml: function (item) {
        const lab = Editor._escapeControlLabel(item.name || 'New Light');
        if (typeof LightGridWidget !== 'undefined') LightGridWidget.ensureLightItemIcons(item);
        const on = (item.icons && item.icons.on) || {};
        const shim = { iconSourceOn: on.source, imgOn: on.customUrl, iconOn: on.builtin };
        const km = { source: 'iconSourceOn', customUrl: 'imgOn' };
        const source = BaseWidget.inferIconStyleSource(shim, km);
        if (source === 'custom') {
            const url = String(on.customUrl || '').trim();
            if (url) {
                const safe = Editor._escapeControlLabel(url);
                return '<img src="' + safe + '" alt="" class="w-4 h-4 object-contain inline-block align-middle rounded-sm" /> <span class="truncate align-middle">' + lab + '</span>';
            }
        }
        const ic = Editor._escapeControlLabel(String(on.builtin || '').trim());
        if (ic) {
            const w = Editor._escapeControlLabel(BaseWidget.phosphorWeightClass(on.weight));
            return '<i class="' + w + ' ' + ic + ' text-[var(--ui-accent)] text-base"></i> <span class="truncate">' + lab + '</span>';
        }
        return '<span class="truncate">' + lab + '</span>';
    },

    /**
     * Basic-mode Phosphor icon name field (no Icon Style collapsible). Same control as Switch/Button
     * `icon_input` in Basic Settings. Writes `item.icons[slot].builtin` and sets `source` to phosphor.
     * @param {HTMLElement} grid
     * @param {object} ctx - same shape as `_renderMenuItemIconStyleBlock` (subset)
     */
    _renderSimplePhosphorIconPicker: function (grid, ctx) {
        const {
            item, label, keyMap, attachBindHeader, sv: ctxSv, setTitleSpan, iconSlot, iconBuiltinFallback
        } = ctx;
        const iconNamePlaceholder = (typeof iconBuiltinFallback === 'string' && iconBuiltinFallback.trim() !== '')
            ? iconBuiltinFallback.trim()
            : 'ph-check';
        const iconNameEmptyGlyph = (typeof iconBuiltinFallback === 'string' && iconBuiltinFallback.trim() !== '')
            ? iconBuiltinFallback.trim()
            : 'ph-star';
        const slotName = iconSlot === 'off' ? 'off' : 'on';
        if (typeof ctx.ensureItemIcons === 'function') {
            ctx.ensureItemIcons(item);
        } else if (typeof MenuWidget !== 'undefined') {
            MenuWidget.ensureMenuItemIcons(item);
        }
        if (!item.icons || typeof item.icons !== 'object' || !item.icons[slotName]) return;
        const slot = item.icons[slotName];
        const builtinKey = keyMap && keyMap.builtin ? keyMap.builtin : 'iconOn';
        const nestedPropByField = BaseWidget.ICON_STYLE_NESTED_PROP_BY_FIELD_KEY;
        const sprop = nestedPropByField[builtinKey] || 'builtin';
        const rowSv = typeof ctxSv === 'function' ? ctxSv : function () {};

        const wrap = document.createElement('div');
        wrap.className = (typeof ctx.outerWrapperClassName === 'string' && ctx.outerWrapperClassName.trim() !== '')
            ? ctx.outerWrapperClassName
            : 'col-span-12 grp-nonspacer flex flex-col gap-1';

        const bh = typeof attachBindHeader === 'function'
            ? attachBindHeader(wrap, label || 'Icon', builtinKey)
            : { isBound: false };

        if (bh.isBound) {
            wrap.appendChild(Editor.createTopicDropdown(bh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, bh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
            grid.appendChild(wrap);
            return;
        }

        const rowWrap = document.createElement('div');
        rowWrap.className = 'flex gap-1 items-center';
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'control-input rounded-r-none mi-iconname';
        inp.placeholder = iconNamePlaceholder;
        const icRead = slot[sprop];
        inp.value = icRead != null ? String(icRead) : '';
        const bbtn = document.createElement('button');
        bbtn.className = 'btn-tool w-10 flex-shrink-0 rounded-l-none border-l-0';
        const syncBtn = () => {
            let wv = 'fill';
            const fv = slot.weight;
            if (fv != null && String(fv).trim() !== '') wv = String(fv).toLowerCase().trim();
            bbtn.innerHTML = '<i class="' + BaseWidget.phosphorWeightClass(wv) + ' ' + (inp.value || iconNameEmptyGlyph) + ' text-lg"></i>';
        };
        const commitBuiltin = (iconClass) => {
            slot.source = 'phosphor';
            slot[sprop] = iconClass;
            inp.value = iconClass;
            syncBtn();
            if (typeof setTitleSpan === 'function') setTitleSpan();
            rowSv();
        };
        syncBtn();
        bbtn.onclick = () => {
            if (typeof Dashboard.openIconBrowser === 'function') {
                Dashboard.openIconBrowser((slot[sprop] || iconNameEmptyGlyph), (iconClass) => {
                    commitBuiltin(iconClass);
                });
            }
        };
        inp.oninput = (e) => {
            commitBuiltin(e.target.value);
        };
        rowWrap.appendChild(inp);
        rowWrap.appendChild(bbtn);
        wrap.appendChild(rowWrap);
        grid.appendChild(wrap);
    },

    /**
     * Collapsible Icon Style block for menu_list rows. Field defs from BaseWidget.getIconStyleFieldDefinitions.
     * Reads/writes item.icons[on|off] using legacy fd.key names as slot property map.
     * @param {object} ctx
     * @param {string} [ctx.headerSuffix] - muted slideout suffix after ctx.label (default **`Icon Style`**).
     * @param {string} [ctx.iconBuiltinFallback] - when set, placeholder / empty-glyph preview / icon browser seed for **Icon name** (else `ph-check` placeholder + `ph-star` fallback).
     */
    _renderMenuItemIconStyleBlock: function (grid, ctx) {
        const {
            item, label, keyMap, attachBindHeader, sv: ctxSv, currentBindings, collapseKey, setTitleSpan, iconSlot,
            headerSuffix, menuOffInheritsIconOn, registerOffInheritedRefresh, afterLeaderInheritSave,
            iconBuiltinFallback
        } = ctx;
        const iconNamePlaceholder = (typeof iconBuiltinFallback === 'string' && iconBuiltinFallback.trim() !== '')
            ? iconBuiltinFallback.trim()
            : 'ph-check';
        const iconNameEmptyGlyph = (typeof iconBuiltinFallback === 'string' && iconBuiltinFallback.trim() !== '')
            ? iconBuiltinFallback.trim()
            : 'ph-star';
        const slotName = iconSlot === 'off' ? 'off' : 'on';
        if (typeof ctx.ensureItemIcons === 'function') {
            ctx.ensureItemIcons(item);
        } else if (typeof MenuWidget !== 'undefined') {
            MenuWidget.ensureMenuItemIcons(item);
        }
        const slot = item.icons[slotName];

        const useMenuOffSparse = menuOffInheritsIconOn === true && typeof MenuWidget !== 'undefined' && slotName === 'off';
        const offInheritDomRefreshers = [];
        const readSlotNested = function (prop) {
            if (useMenuOffSparse && MenuWidget.MENU_ITEM_OFF_ICON_INHERIT_KEYS.indexOf(prop) >= 0) {
                return MenuWidget.readMenuItemOffInheritNested(item, prop);
            }
            return slot[prop];
        };
        const writeSlotNested = function (prop, val) {
            if (useMenuOffSparse && MenuWidget.MENU_ITEM_OFF_ICON_INHERIT_KEYS.indexOf(prop) >= 0) {
                MenuWidget.writeMenuItemOffInheritNested(item, prop, val);
                return;
            }
            slot[prop] = val;
        };

        const innerSvBase = typeof ctxSv === 'function' ? ctxSv : function () {};
        const rowSv = function () {
            innerSvBase();
            if (slotName === 'on' && typeof afterLeaderInheritSave === 'function') {
                afterLeaderInheritSave();
            }
        };

        const nestedPropByField = BaseWidget.ICON_STYLE_NESTED_PROP_BY_FIELD_KEY;

        const nestedForDepsPreview = () => {
            if (useMenuOffSparse) return MenuWidget.resolveMenuItemOffIconSlotForFlatten(item);
            return slot;
        };

        const depValues = () => BaseWidget.flattenNestedIconSlotToKeyMap(nestedForDepsPreview(), keyMap);

        const fieldExclude = Array.isArray(ctx.fieldExclude)
            ? ctx.fieldExclude
            : ['color', 'hoverColor', 'size', 'accentColor'];
        const fields = BaseWidget.getIconStyleFieldDefinitions(keyMap, { exclude: fieldExclude });
        const fieldWraps = new Map();

        const outerWrap = (typeof ctx.outerWrapperClassName === 'string' && ctx.outerWrapperClassName.trim() !== '')
            ? ctx.outerWrapperClassName
            : 'col-span-2 grp-nonspacer flex flex-col gap-1';
        const { subGrid, previewSlot } = this.createIconStyleCollapsibleSection(grid, {
            titleLabel: label,
            headerSuffix: headerSuffix,
            collapseStateKey: collapseKey,
            outerWrapperClassName: outerWrap,
            cardClassName: 'editor-collapse-card editor-collapse-card--closed mt-1 w-full',
            contentClassName: 'editor-collapse-content hidden grid grid-cols-12 gap-x-2 gap-y-3 w-full',
            chevronOpts: { chevronAccent: 'var(--ui-accent)' }
        });

        const applyPreview = () => {
            const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
            const masterAccent = ctx.masterAccentFallback != null
                ? ctx.masterAccentFallback
                : (keyMap.accentColor === 'iconSlotAccentOff' ? M.menuIconAccentOff : M.menuIconAccentOn);
            const nest = nestedForDepsPreview();
            const flat = BaseWidget.flattenNestedIconSlotToKeyMap(nest, keyMap, masterAccent);
            Editor.fillIconStyleHeaderPreview(previewSlot, keyMap, () => flat);
        };

        const updateFieldVisibility = () => {
            const dv = depValues();
            fields.forEach((fd) => {
                const wrapEl = fieldWraps.get(fd.key);
                if (!wrapEl) return;
                wrapEl.style.display = this._isFieldVisible(fd, dv, false) ? '' : 'none';
            });
            if (subGrid) Editor.equalizeInspectorGrid(subGrid);
        };

        let syncPhosphorIconBtn = null;

        fields.forEach((fd) => {
            const w = document.createElement('div');
            w.className = `col-span-${fd.cols || 12} flex flex-col justify-end`;
            Editor._applyEditorFieldGridColumn(w, fd);
            w.dataset.fieldKey = fd.key || '';
            fieldWraps.set(fd.key, w);
            w.style.display = this._isFieldVisible(fd, depValues(), false) ? '' : 'none';

            const col = document.createElement('div');
            col.className = 'flex flex-col gap-1 w-full';
            const bh = attachBindHeader(col, fd.label, fd.key);
            const sprop = nestedPropByField[fd.key];
            const leafInheritsFromOnSlot = !!(useMenuOffSparse && sprop !== undefined && sprop !== null
                && MenuWidget.MENU_ITEM_OFF_ICON_INHERIT_KEYS.indexOf(sprop) >= 0);

            if (fd.type === 'select') {
                if (bh.isBound) {
                    col.appendChild(Editor.createTopicDropdown(bh.topicAt || '', 'msg.topic', (val) => {
                        const patch = {};
                        BindingsTree.setAtPath(patch, bh.bindPath, val);
                        Dashboard.updateWidgetBinding(this.currentId, patch);
                    }));
                } else if (fd.key === keyMap.source) {
                    const rawSel = readSlotNested(sprop);
                    const hasUrlForFavicon = function () {
                        try {
                            if (!item || item.actionType !== 'url') return false;
                            const u = String(item.urlTo != null ? item.urlTo : '').trim();
                            return u !== '' && u !== 'https://';
                        } catch (_eHu) {
                            return false;
                        }
                    };
                    const normalizeSrc = (v) => (v === 'custom' || v === 'phosphor' || v === 'favicon') ? v : 'phosphor';
                    let effectiveSrc = normalizeSrc(rawSel);
                    if (effectiveSrc === 'favicon' && !hasUrlForFavicon()) {
                        effectiveSrc = 'phosphor';
                    }
                    if (!leafInheritsFromOnSlot && effectiveSrc !== rawSel) slot[sprop] = effectiveSrc;
                    const allowFavicon = hasUrlForFavicon();
                    const baseOpts = fd.options || [];
                    const opts = baseOpts.filter((o) => (o && o.value !== 'favicon') || allowFavicon);
                    const sel = Editor.createCustomSelect(opts, effectiveSrc);
                    sel._baseIconSourceOptions = baseOpts;
                    sel.classList.add('mi-iconsrc');
                    sel.onchange = (e) => {
                        writeSlotNested(sprop, e.target.value);
                        updateFieldVisibility();
                        applyPreview();
                        if (setTitleSpan) setTitleSpan();
                        if (syncPhosphorIconBtn) syncPhosphorIconBtn();
                        rowSv();
                    };
                    col.appendChild(sel);
                    if (leafInheritsFromOnSlot && typeof registerOffInheritedRefresh === 'function') {
                        offInheritDomRefreshers.push(() => {
                            const r = readSlotNested(sprop);
                            const nr = normalizeSrc(r);
                            sel.value = (nr === 'favicon' && !hasUrlForFavicon()) ? 'phosphor' : nr;
                        });
                    }
                } else {
                    const rawV = readSlotNested(sprop);
                    let effective = rawV != null && String(rawV).trim() !== '' ? String(rawV).toLowerCase().trim() : 'fill';
                    const optList = fd.options || [];
                    let match = false;
                    for (let oi = 0; oi < optList.length; oi++) {
                        if (optList[oi].value === effective) { match = true; break; }
                    }
                    if (!match) effective = 'fill';
                    if (!leafInheritsFromOnSlot && effective !== rawV) slot[sprop] = effective;
                    const sel = Editor.createCustomSelect(optList, effective);
                    sel.classList.add('mi-iconstyle');
                    sel.onchange = (e) => {
                        writeSlotNested(sprop, e.target.value);
                        updateFieldVisibility();
                        applyPreview();
                        if (setTitleSpan) setTitleSpan();
                        if (syncPhosphorIconBtn) syncPhosphorIconBtn();
                        rowSv();
                    };
                    col.appendChild(sel);
                    if (leafInheritsFromOnSlot && typeof registerOffInheritedRefresh === 'function') {
                        offInheritDomRefreshers.push(() => {
                            const r = readSlotNested(sprop);
                            let wf = r != null && String(r).trim() !== '' ? String(r).toLowerCase().trim() : 'fill';
                            let mf = false;
                            for (let oi = 0; oi < optList.length; oi++) {
                                if (optList[oi].value === wf) { mf = true; break; }
                            }
                            if (!mf) wf = 'fill';
                            sel.value = wf;
                        });
                    }
                }
            } else if (fd.type === 'icon_input') {
                if (bh.isBound) {
                    col.appendChild(Editor.createTopicDropdown(bh.topicAt || '', 'msg.topic', (val) => {
                        const patch = {};
                        BindingsTree.setAtPath(patch, bh.bindPath, val);
                        Dashboard.updateWidgetBinding(this.currentId, patch);
                    }));
                } else {
                    const rowWrap = document.createElement('div');
                    rowWrap.className = 'flex gap-1 items-center';
                    const inp = document.createElement('input');
                    inp.type = 'text';
                    inp.className = 'control-input rounded-r-none mi-iconname';
                    inp.placeholder = iconNamePlaceholder;
                    const icRead = readSlotNested(sprop);
                    inp.value = icRead != null ? String(icRead) : '';
                    const bbtn = document.createElement('button');
                    bbtn.className = 'btn-tool w-10 flex-shrink-0 rounded-l-none border-l-0';
                    const weightKey = fd.weightFieldKey;
                    const weightProp = weightKey ? nestedPropByField[weightKey] : null;
                    const syncBtn = () => {
                        let wv = 'fill';
                        if (weightProp) {
                            const fv = readSlotNested(weightProp);
                            if (fv != null && String(fv).trim() !== '') wv = String(fv).toLowerCase().trim();
                        }
                        bbtn.innerHTML = '<i class="' + BaseWidget.phosphorWeightClass(wv) + ' ' + (inp.value || iconNameEmptyGlyph) + ' text-lg"></i>';
                    };
                    syncBtn();
                    bbtn.onclick = () => {
                        if (typeof Dashboard.openIconBrowser === 'function') {
                            Dashboard.openIconBrowser((readSlotNested(sprop) || iconNameEmptyGlyph), (iconClass) => {
                                writeSlotNested(sprop, iconClass);
                                inp.value = iconClass;
                                syncBtn();
                                applyPreview();
                                if (setTitleSpan) setTitleSpan();
                                rowSv();
                            });
                        }
                    };
                    inp.oninput = (e) => {
                        writeSlotNested(sprop, e.target.value);
                        syncBtn();
                        applyPreview();
                        if (setTitleSpan) setTitleSpan();
                        rowSv();
                    };
                    syncPhosphorIconBtn = syncBtn;
                    rowWrap.appendChild(inp);
                    rowWrap.appendChild(bbtn);
                    col.appendChild(rowWrap);
                    if (leafInheritsFromOnSlot && typeof registerOffInheritedRefresh === 'function') {
                        offInheritDomRefreshers.push(() => {
                            const v = readSlotNested(sprop);
                            inp.value = v != null ? String(v) : '';
                            syncBtn();
                        });
                    }
                }
            } else if (fd.type === 'checkbox') {
                if (bh.isBound) {
                    col.appendChild(Editor.createTopicDropdown(bh.topicAt || '', 'msg.topic', (val) => {
                        const patch = {};
                        BindingsTree.setAtPath(patch, bh.bindPath, val);
                        Dashboard.updateWidgetBinding(this.currentId, patch);
                    }));
                } else {
                    const row = document.createElement('div');
                    row.className = 'flex items-center gap-2';
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.className = 'ds-checkbox mi-iconfilled';
                    cb.checked = readSlotNested(sprop) === true;
                    const lb = document.createElement('label');
                    lb.className = 'text-[10px] editor-muted-text';
                    lb.textContent = fd.label;
                    row.appendChild(cb);
                    row.appendChild(lb);
                    col.appendChild(row);
                    cb.onchange = (e) => {
                        writeSlotNested(sprop, e.target.checked);
                        updateFieldVisibility();
                        applyPreview();
                        if (syncPhosphorIconBtn) syncPhosphorIconBtn();
                        if (setTitleSpan) setTitleSpan();
                        rowSv();
                    };
                    if (leafInheritsFromOnSlot && typeof registerOffInheritedRefresh === 'function') {
                        offInheritDomRefreshers.push(() => {
                            cb.checked = readSlotNested(sprop) === true;
                        });
                    }
                }
            } else if (fd.type === 'text') {
                if (bh.isBound) {
                    col.appendChild(Editor.createTopicDropdown(bh.topicAt || '', 'msg.topic', (val) => {
                        const patch = {};
                        BindingsTree.setAtPath(patch, bh.bindPath, val);
                        Dashboard.updateWidgetBinding(this.currentId, patch);
                    }));
                } else {
                    const inp = document.createElement('input');
                    inp.type = 'text';
                    inp.className = 'control-input mi-imgurl';
                    const rs = readSlotNested(sprop);
                    inp.value = rs != null ? String(rs) : '';
                    inp.oninput = (e) => {
                        writeSlotNested(sprop, e.target.value);
                        applyPreview();
                        if (setTitleSpan) setTitleSpan();
                        rowSv();
                    };

                    if (fd.imagePicker === true && Editor.isImageGalleryAvailable()) {
                        inp.classList.add('rounded-r-none');
                        const galleryBtn = Editor.createImageGalleryPickerButton(inp);
                        const row = document.createElement('div');
                        row.className = 'flex gap-1';
                        row.appendChild(inp);
                        row.appendChild(galleryBtn);
                        col.appendChild(row);
                    } else {
                        col.appendChild(inp);
                    }

                    if (leafInheritsFromOnSlot && typeof registerOffInheritedRefresh === 'function') {
                        offInheritDomRefreshers.push(() => {
                            const v = readSlotNested(sprop);
                            inp.value = v != null ? String(v) : '';
                        });
                    }
                }
            } else if (fd.type === 'color') {
                if (bh.isBound) {
                    col.appendChild(Editor.createTopicDropdown(bh.topicAt || '', 'msg.topic', (val) => {
                        const patch = {};
                        BindingsTree.setAtPath(patch, bh.bindPath, val);
                        Dashboard.updateWidgetBinding(this.currentId, patch);
                    }));
                } else {
                    const inp = document.createElement('input');
                    inp.type = 'color';
                    inp.className = 'control-input p-0 cursor-pointer';
                    inp.value = this.ensureHex(slot[sprop] || '#ffffff');
                    inp.addEventListener('input', (e) => {
                        slot[sprop] = e.target.value;
                        applyPreview();
                        rowSv();
                    });
                    col.appendChild(inp);
                }
            } else if (fd.type === 'number') {
                if (bh.isBound) {
                    col.appendChild(Editor.createTopicDropdown(bh.topicAt || '', 'msg.topic', (val) => {
                        const patch = {};
                        BindingsTree.setAtPath(patch, bh.bindPath, val);
                        Dashboard.updateWidgetBinding(this.currentId, patch);
                    }));
                } else {
                    const inp = document.createElement('input');
                    inp.type = 'number';
                    inp.className = 'control-input mi-iconsize';
                    if (fd.min !== undefined) inp.min = fd.min;
                    if (fd.max !== undefined) inp.max = fd.max;
                    inp.value = slot[sprop] !== undefined && slot[sprop] !== null ? slot[sprop] : '';
                    inp.addEventListener('change', (e) => {
                        let v = parseFloat(e.target.value);
                        if (!Number.isFinite(v)) v = fd.min !== undefined ? fd.min : 0;
                        if (fd.min !== undefined && v < fd.min) { v = fd.min; inp.value = v; }
                        if (fd.max !== undefined && v > fd.max) { v = fd.max; inp.value = v; }
                        slot[sprop] = v;
                        applyPreview();
                        rowSv();
                    });
                    inp.addEventListener('input', (e) => {
                        const v = parseFloat(e.target.value);
                        if (Number.isFinite(v)) {
                            slot[sprop] = v;
                            applyPreview();
                        }
                    });
                    col.appendChild(inp);
                }
            }

            w.appendChild(col);
            subGrid.appendChild(w);
        });

        Editor.equalizeInspectorGrid(subGrid);

        if (typeof registerOffInheritedRefresh === 'function' && useMenuOffSparse && offInheritDomRefreshers.length > 0) {
            registerOffInheritedRefresh(() => {
                offInheritDomRefreshers.forEach((fnSyncDom) => { fnSyncDom(); });
                updateFieldVisibility();
                applyPreview();
                if (typeof setTitleSpan === 'function') setTitleSpan();
            });
        }

        applyPreview();
    },

    _renderLightItemEditorGrid: function (content, light, lIdx, arr, f, currentBindings, isGlobal, saveValue, setLightTitleSpan, onSplitTopic, rerenderList) {
        if (typeof LightGridWidget !== 'undefined') {
            LightGridWidget.ensureLightItemIcons(light);
            LightGridWidget.normalizeLightItemOutputMode(light);
            LightGridWidget.ensureLightItemSwitchAction(light);
        }
        if (!light.topics || !Array.isArray(light.topics)) light.topics = [];
        const switchAction = light.switchAction;

        const LIGHT_LI_ICON_BINDING = new Set([
            'iconSourceOn', 'iconOn', 'iconWeightOn', 'imgOn', 'colorizeOn', 'iconSlotAccentOn',
            'iconSlotOffsetXOn', 'iconSlotOffsetYOn', 'iconSlotRotationOn'
        ]);
        const LIGHT_LI_DEF = {
            name: 'New Light',
            outputMode: 'light',
            state: false,
            actionType: 'topic',
            onPayload: 'true',
            offPayload: 'false',
            pageTo: 1,
            urlTo: 'https://',
            urlNewTab: false,
            iconSourceOn: 'phosphor',
            iconOn: '',
            iconWeightOn: 'fill',
            imgOn: '',
            colorizeOn: false
        };
        const canBindLI = MASTER_SETTINGS.dataDriver && !isGlobal;
        const lightItemBindPath = (prop) => (
            typeof LightGridWidget !== 'undefined' && typeof BindingsTree !== 'undefined'
                ? LightGridWidget.lightItemBindingPath(lIdx, prop)
                : null
        );
        const getLightItemFlatForBinding = (prop) => {
            if (typeof LightGridWidget === 'undefined') return light[prop];
            LightGridWidget.ensureLightItemIcons(light);
            const xf = LightGridWidget.expandLightItemIconsToFlat(light);
            if (Object.prototype.hasOwnProperty.call(xf, prop)) return xf[prop];
            return light[prop];
        };
        const setLightItemIconBindingDefault = (prop, val) => {
            if (typeof LightGridWidget === 'undefined') return;
            LightGridWidget.ensureLightItemIcons(light);
            const nestedProp = BaseWidget.ICON_STYLE_NESTED_PROP_BY_FIELD_KEY[prop];
            if (nestedProp) light.icons.on[nestedProp] = val;
        };
        const lightSwitchProp = (prop) => {
            LightGridWidget.ensureLightItemSwitchAction(light);
            return light.switchAction[prop];
        };
        const setLightSwitchProp = (prop, val) => {
            LightGridWidget.ensureLightItemSwitchAction(light);
            light.switchAction[prop] = val;
        };
        const attachBindHeader = (col, labelText, prop, tooltipKey) => {
            const bindPath = lightItemBindPath(prop);
            let topicAt = '';
            let isBound = false;
            if (bindPath && currentBindings) {
                const t = BindingsTree.getAtPath(currentBindings, bindPath);
                isBound = t !== undefined;
                topicAt = isBound ? String(t) : '';
            }
            const headerRow = document.createElement('div');
            headerRow.className = 'control-header-row';
            const lbl = document.createElement('span');
            lbl.className = 'control-label';
            lbl.textContent = labelText;
            const lightTipKey = tooltipKey || prop;
            if (lightTipKey) {
                lbl.setAttribute('data-editor-tooltip', lightTipKey);
                this._stampTooltipWidgetType(lbl, this._inspectorTooltipWidgetType(false));
            }
            headerRow.appendChild(lbl);
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'control-header-actions' + (isBound ? ' control-header-actions--pinned' : '');
            const switchProps = new Set(['actionType', 'onPayload', 'offPayload', 'pageTo', 'urlTo', 'urlNewTab']);
            const defVal = LIGHT_LI_DEF[prop];
            const liIsSet = () => {
                if (LIGHT_LI_ICON_BINDING.has(prop)) {
                    const cur = getLightItemFlatForBinding(prop);
                    if (typeof defVal === 'boolean') return cur !== defVal;
                    return String(cur) !== String(defVal);
                }
                if (switchProps.has(prop)) {
                    if (!(prop in light.switchAction) || light.switchAction[prop] === undefined || light.switchAction[prop] === null) return false;
                    if (typeof defVal === 'boolean') return light.switchAction[prop] !== defVal;
                    return String(light.switchAction[prop]) !== String(defVal);
                }
                if (!(prop in light) || light[prop] === undefined || light[prop] === null) return false;
                if (typeof defVal === 'boolean') return light[prop] !== defVal;
                return String(light[prop]) !== String(defVal);
            };
            if (canBindLI) {
                if (!isBound) {
                    const resetIcon = document.createElement('i');
                    resetIcon.className = 'ph-bold ph-arrow-counter-clockwise btn-reset text-xs editor-muted-text cursor-pointer transition-colors';
                    resetIcon.title = 'Reset to Default';
                    this._setResetIdle(resetIcon, !liIsSet());
                    resetIcon.onclick = (e) => {
                        e.stopPropagation();
                        if (LIGHT_LI_ICON_BINDING.has(prop)) {
                            setLightItemIconBindingDefault(prop, defVal);
                        } else if (switchProps.has(prop)) {
                            setLightSwitchProp(prop, defVal);
                        } else {
                            light[prop] = defVal;
                        }
                        if (prop === 'state') {
                            Dashboard.updateWidget(this.currentId, { [`item_${lIdx}_state`]: !!defVal }, false);
                        }
                        saveValue(arr, true);
                        if (typeof rerenderList === 'function') rerenderList();
                        else this.loadWidget(this.currentId);
                    };
                    controlsDiv.appendChild(resetIcon);
                }
                const bindBtn = document.createElement('button');
                bindBtn.className = isBound ? 'btn-bind active transition-colors' : 'btn-bind transition-colors';
                bindBtn.title = isBound ? 'Unlink Topic' : 'Link to Topic';
                bindBtn.innerHTML = '<i class="ph ' + (isBound ? 'ph-link-break' : 'ph-link') + ' text-xs"></i>';
                bindBtn.onclick = (e) => {
                    e.stopPropagation();
                    const w = Dashboard.widgets[this.currentId];
                    if (!bindPath) return;
                    if (isBound) {
                        const b = JSON.parse(JSON.stringify((w && w.bindings) || {}));
                        BindingsTree.deleteAtPath(b, bindPath);
                        Dashboard.updateWidgetBinding(this.currentId, b, true);
                        if (w) {
                            const synKey = `lightItemBind_${lIdx}_${prop}`;
                            const co = { ...w.overrides };
                            let ovrChanged = false;
                            if (co[synKey + '_bind_mapTrue'] !== undefined) {
                                delete co[synKey + '_bind_mapTrue'];
                                ovrChanged = true;
                            }
                            if (co[synKey + '_bind_mapFalse'] !== undefined) {
                                delete co[synKey + '_bind_mapFalse'];
                                ovrChanged = true;
                            }
                            if (co[synKey + '_bind_formula'] !== undefined) {
                                delete co[synKey + '_bind_formula'];
                                ovrChanged = true;
                            }
                            if (co[synKey + '_bind_transformMode'] !== undefined) {
                                delete co[synKey + '_bind_transformMode'];
                                ovrChanged = true;
                            }
                            if (ovrChanged) Dashboard.updateWidget(this.currentId, co, true);
                        }
                    } else {
                        const patch = {};
                        BindingsTree.setAtPath(patch, bindPath, '');
                        Dashboard.updateWidgetBinding(this.currentId, patch);
                    }
                    this.loadWidget(this.currentId);
                };
                controlsDiv.appendChild(bindBtn);
                if (isBound) {
                    const synField = this.lightItemBindSyntheticField(lIdx, prop, labelText);
                    const wCur = Dashboard.widgets[this.currentId];
                    const ovrLi = wCur ? (wCur.overrides || {}) : {};
                    const bindOptsBtnLi = document.createElement('button');
                    const mapActiveLi = this.hasBindingMapActiveForField(synField, ovrLi, false);
                    const invalidLi = this.hasBindingFormulaInvalidForField(synField, ovrLi, false);
                    bindOptsBtnLi.className = 'btn-bind';
                    Editor.setBindAuxHighlight(bindOptsBtnLi, mapActiveLi, invalidLi);
                    bindOptsBtnLi.title = 'Binding Options';
                    bindOptsBtnLi.innerHTML = '<i class="ph-bold ' + this.getBindingOptionsIconPh(synField, ovrLi, false) + ' text-xs"></i>';
                    bindOptsBtnLi.onclick = (e2) => {
                        e2.stopPropagation();
                        this.openBindingOptionsPopup(synField, bindOptsBtnLi, false);
                    };
                    controlsDiv.appendChild(bindOptsBtnLi);
                }
            }
            this._appendHeaderActions(headerRow, controlsDiv);
            col.appendChild(headerRow);
            return { bindPath, isBound, topicAt };
        };

        const nameModeRow = document.createElement('div');
        nameModeRow.className = 'grid grid-cols-2 gap-2';

        const nameCol = document.createElement('div');
        nameCol.className = 'flex flex-col gap-1';
        const nameBh = attachBindHeader(nameCol, 'Name', 'name', 'row.name');
        if (nameBh.isBound) {
            nameCol.appendChild(Editor.createTopicDropdown(nameBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, nameBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const nameInp = document.createElement('input');
            nameInp.className = 'control-input w-full text-xs';
            nameInp.placeholder = 'Light Name';
            nameInp.value = light.name || '';
            nameInp.oninput = (e) => {
                light.name = e.target.value;
                saveValue(arr, true);
                setLightTitleSpan();
            };
            nameCol.appendChild(nameInp);
        }

        const modeCol = document.createElement('div');
        modeCol.className = 'flex flex-col gap-1';
        const modeBh = attachBindHeader(modeCol, 'Output Mode', 'outputMode', 'row.outputMode');
        if (modeBh.isBound) {
            modeCol.appendChild(Editor.createTopicDropdown(modeBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, modeBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const outputModeSel = Editor.createCustomSelect(
                LightGridWidget.LIGHT_GRID_OUTPUT_MODE_OPTIONS,
                light.outputMode || 'light'
            );
            outputModeSel.className += ' w-full text-xs';
            outputModeSel.onchange = () => {
                light.outputMode = outputModeSel.value;
                LightGridWidget.normalizeLightItemOutputMode(light);
                saveValue(arr, true);
                updateOutputModeUi();
            };
            modeCol.appendChild(outputModeSel);
        }

        nameModeRow.appendChild(nameCol);
        nameModeRow.appendChild(modeCol);
        content.appendChild(nameModeRow);

        const iconGrid = document.createElement('div');
        iconGrid.className = 'grid grid-cols-12 gap-2 w-full';
        content.appendChild(iconGrid);

        const wid = this.currentId;
        const lgKm = {
            source: 'iconSourceOn',
            builtin: 'iconOn',
            weight: 'iconWeightOn',
            customUrl: 'imgOn',
            tintImage: 'colorizeOn',
            accentColor: 'iconSlotAccentOn'
        };
        const Mlg = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const lgIconCtx = {
            item: light,
            label: 'Icon',
            keyMap: lgKm,
            attachBindHeader: attachBindHeader,
            sv: () => saveValue(arr, true),
            currentBindings: currentBindings,
            collapseKey: `lg_light_icon_${wid}_${lIdx}`,
            setTitleSpan: setLightTitleSpan,
            iconSlot: 'on',
            iconBuiltinFallback: (typeof LightGridWidget !== 'undefined' && LightGridWidget.DEFAULT_LIGHT_ITEM_BUILTIN)
                ? LightGridWidget.DEFAULT_LIGHT_ITEM_BUILTIN
                : 'ph-lightbulb',
            ensureItemIcons: (it) => {
                if (typeof LightGridWidget !== 'undefined') LightGridWidget.ensureLightItemIcons(it);
            },
            fieldExclude: ['color', 'hoverColor', 'size'],
            masterAccentFallback: Mlg.defaultIconWidgetAccentColor || Mlg.menuIconAccentOn,
            outerWrapperClassName: 'col-span-12 grp-nonspacer flex flex-col gap-1'
        };
        if (this.getEffectiveUiMode(this.currentId) === 'basic') {
            this._renderSimplePhosphorIconPicker(iconGrid, lgIconCtx);
        } else {
            this._renderMenuItemIconStyleBlock(iconGrid, lgIconCtx);
        }

        const topicsContainer = document.createElement('div');
        const refreshSwitchActionLabels = () => {
            if (!selSwitchAction || typeof selSwitchAction.setOptions !== 'function') return;
            const cur = selSwitchAction.value;
            const opts = LightGridWidget.getSwitchActionTypeOptionsForLight(light);
            selSwitchAction.setOptions(opts);
            const nextVal = opts.some((o) => o.value === cur) ? cur : 'topic';
            selSwitchAction.value = nextVal;
            if (switchAction.actionType !== nextVal) switchAction.actionType = nextVal;
            refreshSwitchActionVisibility();
        };
        Editor.renderOutputTopicsPanel(topicsContainer, {
            mode: 'simple',
            entries: light.topics,
            headerLabel: 'Output Topics',
            addButtonLabel: 'Add Topic',
            tooltipPrefix: 'row.topics',
            onSplit: typeof onSplitTopic === 'function' ? onSplitTopic : null,
            onChange: (list, persistImmediate) => {
                light.topics = list;
                saveValue(arr, persistImmediate === true);
                refreshSwitchActionLabels();
            }
        });
        content.appendChild(topicsContainer);

        const switchActionWrap = document.createElement('div');
        switchActionWrap.className = 'flex flex-col gap-3 border-t editor-hairline pt-2';

        let selSwitchAction = null;
        const refreshSwitchActionVisibility = () => {
            const act = String(switchAction.actionType || 'topic').trim();
            switchPageRow.style.display = act === 'page' ? '' : 'none';
            switchUrlRow.style.display = act === 'url' ? '' : 'none';
        };

        const switchClickCol = document.createElement('div');
        switchClickCol.className = 'flex flex-col gap-1';
        const clickBh = attachBindHeader(switchClickCol, 'On Click', 'actionType', 'row.actionType');
        if (clickBh.isBound) {
            switchClickCol.appendChild(Editor.createTopicDropdown(clickBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, clickBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            selSwitchAction = Editor.createCustomSelect(
                LightGridWidget.getSwitchActionTypeOptionsForLight(light),
                switchAction.actionType || 'topic'
            );
            selSwitchAction.className += ' w-full text-xs';
            selSwitchAction.onchange = () => {
                switchAction.actionType = selSwitchAction.value;
                saveValue(arr, true);
                refreshSwitchActionVisibility();
            };
            switchClickCol.appendChild(selSwitchAction);
        }

        const switchClickRow = document.createElement('div');
        switchClickRow.className = 'grid grid-cols-1 gap-2';
        switchClickRow.appendChild(switchClickCol);

        const switchPayloadRow = document.createElement('div');
        switchPayloadRow.className = 'grid grid-cols-2 gap-2';

        const onPayloadCol = document.createElement('div');
        onPayloadCol.className = 'flex flex-col gap-1';
        const onBh = attachBindHeader(onPayloadCol, 'On Value', 'onPayload', 'row.onPayload');
        if (onBh.isBound) {
            onPayloadCol.appendChild(Editor.createTopicDropdown(onBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, onBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const onPayloadInp = document.createElement('input');
            onPayloadInp.className = 'control-input w-full text-xs';
            onPayloadInp.value = switchAction.onPayload != null ? String(switchAction.onPayload) : 'true';
            onPayloadInp.oninput = (e) => {
                switchAction.onPayload = e.target.value;
                saveValue(arr, true);
            };
            onPayloadCol.appendChild(onPayloadInp);
        }

        const offPayloadCol = document.createElement('div');
        offPayloadCol.className = 'flex flex-col gap-1';
        const offBh = attachBindHeader(offPayloadCol, 'Off Value', 'offPayload', 'row.offPayload');
        if (offBh.isBound) {
            offPayloadCol.appendChild(Editor.createTopicDropdown(offBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, offBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const offPayloadInp = document.createElement('input');
            offPayloadInp.className = 'control-input w-full text-xs';
            offPayloadInp.value = switchAction.offPayload != null ? String(switchAction.offPayload) : 'false';
            offPayloadInp.oninput = (e) => {
                switchAction.offPayload = e.target.value;
                saveValue(arr, true);
            };
            offPayloadCol.appendChild(offPayloadInp);
        }

        switchPayloadRow.appendChild(onPayloadCol);
        switchPayloadRow.appendChild(offPayloadCol);

        const switchStateRow = document.createElement('div');
        switchStateRow.className = 'grid grid-cols-1 gap-2';
        const stateCol = document.createElement('div');
        stateCol.className = 'flex flex-col gap-1';
        const stateBh = attachBindHeader(stateCol, 'State (On/Off)', 'state', 'row.state');
        if (light.state !== true) light.state = false;
        if (stateBh.isBound) {
            stateCol.appendChild(Editor.createTopicDropdown(stateBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, stateBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const switchStateCheckbox = Editor.createToggleStyleCheckboxRow(light.state === true, (on) => {
                light.state = on;
                saveValue(arr, true);
            });
            stateCol.appendChild(switchStateCheckbox.wrap);
        }
        switchStateRow.appendChild(stateCol);

        const switchPageRow = document.createElement('div');
        switchPageRow.className = 'grid grid-cols-2 gap-2';
        const pageCol = document.createElement('div');
        pageCol.className = 'flex flex-col gap-1';
        const pageBh = attachBindHeader(pageCol, 'Target Page #', 'pageTo', 'row.pageTo');
        if (pageBh.isBound) {
            pageCol.appendChild(Editor.createTopicDropdown(pageBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, pageBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const pageToInp = document.createElement('input');
            pageToInp.type = 'number';
            pageToInp.className = 'control-input w-full text-xs';
            pageToInp.value = switchAction.pageTo != null ? switchAction.pageTo : 1;
            pageToInp.oninput = (e) => {
                switchAction.pageTo = parseInt(e.target.value, 10) || 1;
                saveValue(arr, true);
            };
            pageCol.appendChild(pageToInp);
        }
        switchPageRow.appendChild(pageCol);

        const switchUrlRow = document.createElement('div');
        switchUrlRow.className = 'grid grid-cols-2 gap-2';
        const urlCol = document.createElement('div');
        urlCol.className = 'flex flex-col gap-1';
        const urlBh = attachBindHeader(urlCol, 'Target URL', 'urlTo', 'row.urlTo');
        if (urlBh.isBound) {
            urlCol.appendChild(Editor.createTopicDropdown(urlBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, urlBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const urlToInp = document.createElement('input');
            urlToInp.type = 'text';
            urlToInp.className = 'control-input w-full text-xs';
            urlToInp.value = switchAction.urlTo || '';
            urlToInp.oninput = (e) => {
                switchAction.urlTo = e.target.value;
                saveValue(arr, true);
            };
            urlCol.appendChild(urlToInp);
        }

        const urlNewTabCol = document.createElement('div');
        urlNewTabCol.className = 'flex flex-col gap-1';
        const urlNewTabBh = attachBindHeader(urlNewTabCol, 'New tab', 'urlNewTab', 'row.urlNewTab');
        if (urlNewTabBh.isBound) {
            urlNewTabCol.appendChild(Editor.createTopicDropdown(urlNewTabBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, urlNewTabBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const urlNewTabRow = Editor.createToggleStyleCheckboxRow(
                switchAction.urlNewTab === true,
                (on) => {
                    switchAction.urlNewTab = on;
                    saveValue(arr, true);
                }
            );
            urlNewTabCol.appendChild(urlNewTabRow.wrap);
        }

        switchUrlRow.appendChild(urlCol);
        switchUrlRow.appendChild(urlNewTabCol);

        switchActionWrap.appendChild(switchClickRow);
        switchActionWrap.appendChild(switchPayloadRow);
        switchActionWrap.appendChild(switchStateRow);
        switchActionWrap.appendChild(switchPageRow);
        switchActionWrap.appendChild(switchUrlRow);
        refreshSwitchActionVisibility();
        content.appendChild(switchActionWrap);

        const presetWrap = document.createElement('div');
        presetWrap.className = 'mt-2 border-t editor-hairline pt-2';

        const overrideHeader = document.createElement('div');
        overrideHeader.className = 'flex justify-between items-center mb-2';
        const overrideLbl = document.createElement('span');
        overrideLbl.className = 'control-label';
        overrideLbl.innerText = 'Color Presets';
        overrideLbl.setAttribute('data-editor-tooltip', 'row.colorPresets');
        this._stampTooltipWidgetType(overrideLbl, this._inspectorTooltipWidgetType(false));
        const overrideToggleWrap = document.createElement('div');
        overrideToggleWrap.className = 'flex items-center gap-2';
        const overrideToggleLbl = document.createElement('span');
        overrideToggleLbl.className = 'editor-muted-text text-[10px] uppercase';
        overrideToggleLbl.innerText = 'Override Master';
        overrideToggleLbl.setAttribute('data-editor-tooltip', 'row.overridePresets');
        this._stampTooltipWidgetType(overrideToggleLbl, this._inspectorTooltipWidgetType(false));
        const overrideCheck = document.createElement('input');
        overrideCheck.type = 'checkbox';
        overrideCheck.checked = light.overridePresets === true;
        overrideCheck.className = 'ds-checkbox';
        overrideToggleWrap.appendChild(overrideToggleLbl);
        overrideToggleWrap.appendChild(overrideCheck);
        overrideHeader.appendChild(overrideLbl);
        overrideHeader.appendChild(overrideToggleWrap);
        presetWrap.appendChild(overrideHeader);

        const dynamicGridContainer = document.createElement('div');
        presetWrap.appendChild(dynamicGridContainer);

        const renderDynamicGrid = () => {
            dynamicGridContainer.innerHTML = '';
            if (light.overridePresets) {
                let pArr = Array.isArray(light.presets) && light.presets.length > 0
                    ? [...light.presets]
                    : JSON.parse(JSON.stringify(MASTER_SETTINGS.defaultLightGridPresets || []));
                const gridObj = Editor.createDynamicPresetGrid(pArr, (newArr) => {
                    light.presets = newArr;
                    saveValue(arr, true);
                });
                dynamicGridContainer.appendChild(gridObj.wrap);
            } else {
                const notice = document.createElement('div');
                notice.className = 'text-[10px] italic p-2 rounded text-center';
                notice.style.color = 'var(--ui-text-muted)';
                notice.style.backgroundColor = 'var(--ui-header-bg)';
                notice.style.border = '1px solid var(--ui-border)';
                notice.innerText = 'Using Global Master Presets';
                dynamicGridContainer.appendChild(notice);
            }
        };

        overrideCheck.onchange = (e) => {
            light.overridePresets = e.target.checked;
            if (light.overridePresets && (!light.presets || light.presets.length === 0)) {
                light.presets = JSON.parse(JSON.stringify(MASTER_SETTINGS.defaultLightGridPresets || []));
            }
            saveValue(arr, true);
            renderDynamicGrid();
        };

        renderDynamicGrid();
        content.appendChild(presetWrap);

        const updateOutputModeUi = () => {
            const isSwitch = LightGridWidget.isSwitchOutputMode(light);
            presetWrap.style.display = isSwitch ? 'none' : '';
            switchActionWrap.style.display = isSwitch ? '' : 'none';
            if (isSwitch) refreshSwitchActionLabels();
        };
        updateOutputModeUi();
    },

    _renderMenuItemEditorGrid: function (content, item, lIdx, arr, f, currentBindings, isGlobal, saveValue, titleSpan, rerenderList) {
        if (typeof MenuWidget !== 'undefined') MenuWidget.ensureMenuItemIcons(item);
        const bindField = (key, def) => { if (item[key] === undefined) item[key] = def; };
        bindField('mode', 'push'); bindField('label', 'Menu Item'); bindField('actionType', 'topic');
        bindField('state', false);
        bindField('outputTopic', ''); bindField('onPayload', 'true'); bindField('offPayload', 'false');
        bindField('pageTo', 1); bindField('urlTo', 'https://'); bindField('urlNewTab', false);

        const MENU_MI_ICON_BINDING = new Set([
            'iconSourceOn', 'iconOn', 'iconWeightOn', 'imgOn', 'colorizeOn',
            'iconSourceOff', 'iconOff', 'iconWeightOff', 'imgOff', 'colorizeOff',
            'iconColOnOverrideEn', 'iconColOnOverride', 'iconColOffOverrideEn', 'iconColOffOverride'
        ]);

        const MENU_OFF_ICON_FLAT_INHERIT_RESET = new Set([
            'iconSourceOff', 'iconOff', 'iconWeightOff', 'imgOff', 'colorizeOff'
        ]);

        const getMenuItemFlatForBinding = (prop) => {
            if (typeof MenuWidget === 'undefined') return item[prop];
            MenuWidget.ensureMenuItemIcons(item);
            const xf = MenuWidget.expandMenuItemIconsToFlat(item);
            if (Object.prototype.hasOwnProperty.call(xf, prop)) return xf[prop];
            return item[prop];
        };

        const setMenuItemIconBindingDefault = (prop, val) => {
            if (typeof MenuWidget === 'undefined') return;
            MenuWidget.ensureMenuItemIcons(item);
            if (prop === 'iconColOnOverrideEn') { item.iconColorOverrides.on.enabled = val; return; }
            if (prop === 'iconColOnOverride') { item.iconColorOverrides.on.color = val; return; }
            if (prop === 'iconColOffOverrideEn') { item.iconColorOverrides.off.enabled = val; return; }
            if (prop === 'iconColOffOverride') { item.iconColorOverrides.off.color = val; return; }
            if (MENU_OFF_ICON_FLAT_INHERIT_RESET.has(prop)) {
                const nestedPropClear = BaseWidget.ICON_STYLE_NESTED_PROP_BY_FIELD_KEY[prop];
                if (!item.icons) item.icons = {};
                if (!item.icons.off || typeof item.icons.off !== 'object') item.icons.off = {};
                if (nestedPropClear) delete item.icons.off[nestedPropClear];
                MenuWidget.ensureMenuItemIcons(item);
                return;
            }
            const nestedProp = BaseWidget.ICON_STYLE_NESTED_PROP_BY_FIELD_KEY[prop];
            if (nestedProp) {
                const slotKey = BaseWidget.MENU_ICON_OFF_SLOT_FIELD_KEYS.has(prop) ? 'off' : 'on';
                item.icons[slotKey][nestedProp] = val;
            }
        };

        const MENU_MI_DEF = {
            mode: 'push', label: 'Menu Item', actionType: 'topic', state: false, outputTopic: '',
            onPayload: 'true', offPayload: 'false', pageTo: 1, urlTo: 'https://', urlNewTab: false,
            selectionGroup: '', sendOffOnGroupDeselect: false,
            iconSourceOn: 'phosphor', iconSourceOff: 'phosphor',
            iconOn: '', iconOff: '', iconWeightOn: 'fill', iconWeightOff: 'fill',
            imgOn: '', imgOff: '', colorizeOn: false, colorizeOff: false,
            iconColOnOverrideEn: false, iconColOnOverride: '#ffffff',
            iconColOffOverrideEn: false, iconColOffOverride: '#94a3b8'
        };
        const canBindMI = MASTER_SETTINGS.dataDriver && !isGlobal;
        const menuItemBindPath = (prop) => (
            typeof MenuWidget !== 'undefined' && typeof BindingsTree !== 'undefined'
                ? MenuWidget.menuItemBindingPath(lIdx, prop)
                : null
        );
        const attachBindHeader = (col, labelText, prop, tooltipKey) => {
            const bindPath = menuItemBindPath(prop);
            let topicAt = '';
            let isBound = false;
            if (bindPath && currentBindings) {
                const t = BindingsTree.getAtPath(currentBindings, bindPath);
                // Match schema fields: '' is an active binding slot (topic picker step), same as nestedTopicVal !== undefined.
                isBound = t !== undefined;
                topicAt = isBound ? String(t) : '';
            }
            const headerRow = document.createElement('div');
            headerRow.className = 'control-header-row';
            const lbl = document.createElement('span');
            lbl.className = 'control-label';
            lbl.textContent = labelText;
            const menuTipKey = tooltipKey || prop;
            if (menuTipKey) {
                lbl.setAttribute('data-editor-tooltip', menuTipKey);
                this._stampTooltipWidgetType(lbl, this._inspectorTooltipWidgetType(false));
            }
            headerRow.appendChild(lbl);
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'control-header-actions' + (isBound ? ' control-header-actions--pinned' : '');
            const defVal = MENU_MI_DEF[prop];
            const miIsSet = () => {
                if (MENU_MI_ICON_BINDING.has(prop)) {
                    const sparseInheritNeutral = typeof MenuWidget !== 'undefined'
                        ? MenuWidget.menuItemOffFlatPropIsLocallyOverridden(item, prop)
                        : null;
                    if (sparseInheritNeutral === false) return false;
                    const cur = getMenuItemFlatForBinding(prop);
                    if (typeof defVal === 'boolean') return cur !== defVal;
                    return String(cur) !== String(defVal);
                }
                if (!(prop in item) || item[prop] === undefined || item[prop] === null) return false;
                if (typeof defVal === 'boolean') return item[prop] !== defVal;
                return String(item[prop]) !== String(defVal);
            };
            if (canBindMI) {
                if (!isBound) {
                    const resetIcon = document.createElement('i');
                    resetIcon.className = 'ph-bold ph-arrow-counter-clockwise btn-reset text-xs editor-muted-text cursor-pointer transition-colors';
                    resetIcon.title = 'Reset to Default';
                    this._setResetIdle(resetIcon, !miIsSet());
                    resetIcon.onclick = (e) => {
                        e.stopPropagation();
                        if (MENU_MI_ICON_BINDING.has(prop)) {
                            setMenuItemIconBindingDefault(prop, defVal);
                        } else {
                            item[prop] = defVal;
                        }
                        if (prop === 'state') {
                            Dashboard.updateWidget(this.currentId, { [`item_${lIdx}_state`]: !!defVal }, false);
                        }
                        saveValue(arr, true);
                        if (typeof rerenderList === 'function') rerenderList();
                        else this.loadWidget(this.currentId);
                    };
                    controlsDiv.appendChild(resetIcon);
                }
                const bindBtn = document.createElement('button');
                bindBtn.className = isBound ? 'btn-bind active transition-colors' : 'btn-bind transition-colors';
                bindBtn.title = isBound ? 'Unlink Topic' : 'Link to Topic';
                bindBtn.innerHTML = '<i class="ph ' + (isBound ? 'ph-link-break' : 'ph-link') + ' text-xs"></i>';
                bindBtn.onclick = (e) => {
                    e.stopPropagation();
                    const w = Dashboard.widgets[this.currentId];
                    if (!bindPath) return;
                    if (isBound) {
                        const b = JSON.parse(JSON.stringify((w && w.bindings) || {}));
                        BindingsTree.deleteAtPath(b, bindPath);
                        Dashboard.updateWidgetBinding(this.currentId, b, true);
                        if (w) {
                            const synKey = `menuItemBind_${lIdx}_${prop}`;
                            const co = { ...w.overrides };
                            let ovrChanged = false;
                            if (co[synKey + '_bind_mapTrue'] !== undefined) {
                                delete co[synKey + '_bind_mapTrue'];
                                ovrChanged = true;
                            }
                            if (co[synKey + '_bind_mapFalse'] !== undefined) {
                                delete co[synKey + '_bind_mapFalse'];
                                ovrChanged = true;
                            }
                            if (co[synKey + '_bind_formula'] !== undefined) {
                                delete co[synKey + '_bind_formula'];
                                ovrChanged = true;
                            }
                            if (co[synKey + '_bind_transformMode'] !== undefined) {
                                delete co[synKey + '_bind_transformMode'];
                                ovrChanged = true;
                            }
                            if (ovrChanged) Dashboard.updateWidget(this.currentId, co, true);
                        }
                    } else {
                        const patch = {};
                        BindingsTree.setAtPath(patch, bindPath, '');
                        Dashboard.updateWidgetBinding(this.currentId, patch);
                    }
                    this.loadWidget(this.currentId);
                };
                controlsDiv.appendChild(bindBtn);
                if (isBound) {
                    const synField = this.menuItemBindSyntheticField(lIdx, prop, labelText);
                    const wCur = Dashboard.widgets[this.currentId];
                    const ovrMi = wCur ? (wCur.overrides || {}) : {};
                    const bindOptsBtnMi = document.createElement('button');
                    const mapActiveMi = this.hasBindingMapActiveForField(synField, ovrMi, false);
                    const invalidMi = this.hasBindingFormulaInvalidForField(synField, ovrMi, false);
                    bindOptsBtnMi.className = 'btn-bind';
                    Editor.setBindAuxHighlight(bindOptsBtnMi, mapActiveMi, invalidMi);
                    bindOptsBtnMi.title = 'Binding Options';
                    bindOptsBtnMi.innerHTML = '<i class="ph-bold ' + this.getBindingOptionsIconPh(synField, ovrMi, false) + ' text-xs"></i>';
                    bindOptsBtnMi.onclick = (e2) => {
                        e2.stopPropagation();
                        this.openBindingOptionsPopup(synField, bindOptsBtnMi, false);
                    };
                    controlsDiv.appendChild(bindOptsBtnMi);
                }
            }
            this._appendHeaderActions(headerRow, controlsDiv);
            col.appendChild(headerRow);
            return { bindPath, isBound, topicAt };
        };

        const sv = () => { saveValue(arr, true); };
        const svStructural = () => { saveValue(arr, true); this._handleFieldDependencyChange(f.key, 'change'); };

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-2 gap-2';
        content.appendChild(grid);

        let selMode = null;
        let selAction = null;

        const modeCol = document.createElement('div');
        modeCol.className = 'flex flex-col gap-1 col-span-2';
        const modeBh = attachBindHeader(modeCol, 'Mode', 'mode', 'row.mode');
        if (modeBh.isBound) {
            modeCol.appendChild(Editor.createTopicDropdown(modeBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, modeBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const modeOptions = [{value: 'push', text: 'Push Button'}, {value: 'toggle', text: 'Toggle Switch'}, {value: 'separator', text: 'Separator'}];
            selMode = Editor.createCustomSelect(modeOptions, item.mode || 'push');
            selMode.classList.add('mi-mode');
            modeCol.appendChild(selMode);
        }
        grid.appendChild(modeCol);

        const labelCol = document.createElement('div');
        labelCol.className = 'flex flex-col gap-1 col-span-2 grp-nonspacer';
        const labelBh = attachBindHeader(labelCol, 'Label', 'label', 'row.label');
        if (labelBh.isBound) {
            labelCol.appendChild(Editor.createTopicDropdown(labelBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, labelBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'control-input mi-label';
            inp.value = item.label || '';
            labelCol.appendChild(inp);
        }
        grid.appendChild(labelCol);

        const actionCol = document.createElement('div');
        actionCol.className = 'flex flex-col gap-1 col-span-2 grp-nonspacer';
        const actBh = attachBindHeader(actionCol, 'On Click Action', 'actionType', 'row.actionType');
        if (actBh.isBound) {
            actionCol.appendChild(Editor.createTopicDropdown(actBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, actBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const actionOptions = [{value: 'topic', text: 'Send Topic'}, {value: 'page', text: 'Go to Page'}, {value: 'url', text: 'Open URL'}];
            selAction = Editor.createCustomSelect(actionOptions, item.actionType || 'topic');
            selAction.classList.add('mi-action');
            actionCol.appendChild(selAction);
        }
        grid.appendChild(actionCol);

        const pageCol = document.createElement('div');
        pageCol.className = 'flex flex-col gap-1 col-span-2 grp-page hidden';
        const pageBh = attachBindHeader(pageCol, 'Target Page #', 'pageTo', 'row.pageTo');
        if (pageBh.isBound) {
            pageCol.appendChild(Editor.createTopicDropdown(pageBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, pageBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const inp = document.createElement('input');
            inp.type = 'number';
            inp.className = 'control-input mi-pageto';
            inp.value = item.pageTo;
            pageCol.appendChild(inp);
        }
        grid.appendChild(pageCol);

        const urlCol = document.createElement('div');
        urlCol.className = 'flex flex-col gap-1 col-span-1 grp-url hidden';
        const urlBh = attachBindHeader(urlCol, 'Target URL', 'urlTo', 'row.urlTo');
        if (urlBh.isBound) {
            urlCol.appendChild(Editor.createTopicDropdown(urlBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, urlBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'control-input mi-urlto';
            inp.value = item.urlTo || '';
            urlCol.appendChild(inp);
        }
        grid.appendChild(urlCol);

        const urlNewTabCol = document.createElement('div');
        urlNewTabCol.className = 'flex flex-col gap-1 col-span-1 grp-url hidden';
        const urlNewTabBh = attachBindHeader(urlNewTabCol, 'New tab', 'urlNewTab', 'row.urlNewTab');
        if (urlNewTabBh.isBound) {
            urlNewTabCol.appendChild(Editor.createTopicDropdown(urlNewTabBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, urlNewTabBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const urlNewTabRow = Editor.createToggleStyleCheckboxRow(!!item.urlNewTab, (on) => {
                item.urlNewTab = on;
                sv();
            });
            urlNewTabCol.appendChild(urlNewTabRow.wrap);
        }
        grid.appendChild(urlNewTabCol);

        const selGrpWrap = document.createElement('div');
        selGrpWrap.className = 'flex flex-col gap-1 col-span-2 grp-toggle hidden editor-section-divider pt-2 mt-1';

        const sgHeadWrap = document.createElement('div');
        sgHeadWrap.className = 'flex flex-col gap-1 w-full';
        const sgBh = attachBindHeader(sgHeadWrap, 'Selection Group ID', 'selectionGroup', 'row.selectionGroup');

        const sendHeadWrap = document.createElement('div');
        sendHeadWrap.className = 'flex flex-col gap-1 w-full';
        const sendBh = attachBindHeader(sendHeadWrap, 'Send Off When Turned Off by Group', 'sendOffOnGroupDeselect', 'row.sendOffOnGroupDeselect');

        let sendOffCheckbox = null;
        let sendOffRowWrap = null;

        if (sgBh.isBound) {
            sgHeadWrap.appendChild(Editor.createTopicDropdown(sgBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, sgBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
            selGrpWrap.appendChild(sgHeadWrap);
            sendHeadWrap.style.display = '';
            if (sendBh.isBound) {
                sendHeadWrap.appendChild(Editor.createTopicDropdown(sendBh.topicAt || '', 'msg.topic', (val) => {
                    const patch = {};
                    BindingsTree.setAtPath(patch, sendBh.bindPath, val);
                    Dashboard.updateWidgetBinding(this.currentId, patch);
                }));
            } else {
                const row = Editor.createToggleStyleCheckboxRow(!!item.sendOffOnGroupDeselect, (on) => {
                    item.sendOffOnGroupDeselect = on;
                    sv();
                });
                sendOffRowWrap = row.wrap;
                sendOffCheckbox = row.input;
                sendHeadWrap.appendChild(row.wrap);
            }
            selGrpWrap.appendChild(sendHeadWrap);
        } else {
            const sgBody = document.createElement('div');
            sgBody.className = 'flex flex-col gap-2 w-full';
            const sgOpts = {
                initialId: item.selectionGroup || '',
                inputClassName: 'control-input mi-selgrp',
                onCommitId: (trimmed) => {
                    item.selectionGroup = trimmed;
                    if (trimmed) Dashboard.ensureSelectionGroupEntry(trimmed);
                    sv();
                }
            };
            if (!sendBh.isBound) {
                sgOpts.secondaryCheckboxes = [{
                    label: 'Send Off When Turned Off by Group',
                    tooltipKey: 'row.sendOffOnGroupDeselect',
                    initialChecked: !!item.sendOffOnGroupDeselect,
                    onChange: (on) => {
                        item.sendOffOnGroupDeselect = on;
                        sv();
                    }
                }];
                const sendLblEl = sendHeadWrap.querySelector('.control-label');
                if (sendLblEl) sendLblEl.style.display = 'none';
            }
            const sgUi = Editor.renderSelectionGroupPicklistAndAllowEmpty(sgBody, sgOpts);
            sgHeadWrap.appendChild(sgBody);
            selGrpWrap.appendChild(sgHeadWrap);
            if (!sendBh.isBound && sgUi.secondaryRefs && sgUi.secondaryRefs[0]) {
                sendOffRowWrap = sgUi.secondaryRefs[0].wrap;
                sendOffCheckbox = sgUi.secondaryRefs[0].input;
            }
            if (sendBh.isBound) {
                sendHeadWrap.appendChild(Editor.createTopicDropdown(sendBh.topicAt || '', 'msg.topic', (val) => {
                    const patch = {};
                    BindingsTree.setAtPath(patch, sendBh.bindPath, val);
                    Dashboard.updateWidgetBinding(this.currentId, patch);
                }));
            }
            selGrpWrap.appendChild(sendHeadWrap);
        }
        grid.appendChild(selGrpWrap);

        const topicOuter = document.createElement('div');
        topicOuter.className = 'flex flex-col gap-1 col-span-2 grp-topic';
        const outTopicH = attachBindHeader(topicOuter, 'Output Topic (leave blank to use page/URL only)', 'outputTopic', 'row.outputTopic');
        const topicWrap = document.createElement('div');
        topicWrap.className = 'mi-topic-wrap';
        const outBound = !!outTopicH.isBound;
        if (outBound) {
            topicWrap.appendChild(Editor.createTopicDropdown(outTopicH.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, outTopicH.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            topicWrap.appendChild(Editor.createTopicDropdown(item.outputTopic || '', 'Select topic...', (val) => {
                item.outputTopic = val;
                updateActionLabels();
                sv();
            }));
        }
        topicOuter.appendChild(topicWrap);
        grid.appendChild(topicOuter);

        const onCol = document.createElement('div');
        onCol.className = 'flex flex-col gap-1 col-span-1 grp-topic';
        const onBh = attachBindHeader(onCol, 'On Value', 'onPayload', 'row.onPayload');
        if (onBh.isBound) {
            onCol.appendChild(Editor.createTopicDropdown(onBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, onBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'control-input mi-onp';
            inp.value = item.onPayload;
            inp.oninput = (e) => { item.onPayload = e.target.value; sv(); };
            onCol.appendChild(inp);
        }
        grid.appendChild(onCol);

        const offCol = document.createElement('div');
        offCol.className = 'flex flex-col gap-1 col-span-1 grp-topic';
        const offBh = attachBindHeader(offCol, 'Off Value', 'offPayload', 'row.offPayload');
        if (offBh.isBound) {
            offCol.appendChild(Editor.createTopicDropdown(offBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, offBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'control-input mi-offp';
            inp.value = item.offPayload;
            inp.oninput = (e) => { item.offPayload = e.target.value; sv(); };
            offCol.appendChild(inp);
        }
        grid.appendChild(offCol);

        const stateTooltip = 'Initial on/off when the item state is not bound to a topic. When bound, the topic drives state.';
        const stateCol = document.createElement('div');
        stateCol.className = 'flex flex-col gap-1 col-span-2 grp-toggle hidden editor-section-divider py-2 mt-1';
        stateCol.title = stateTooltip;
        const stBh = attachBindHeader(stateCol, 'State (On/Off)', 'state', 'row.state');
        if (stBh.isBound) {
            stateCol.appendChild(Editor.createTopicDropdown(stBh.topicAt || '', 'msg.topic', (val) => {
                const patch = {};
                BindingsTree.setAtPath(patch, stBh.bindPath, val);
                Dashboard.updateWidgetBinding(this.currentId, patch);
            }));
        } else {
            const wdg = Dashboard.widgets[this.currentId];
            const ovKey = `item_${lIdx}_state`;
            let initialState = item.state === true;
            if (wdg && wdg.overrides && wdg.overrides[ovKey] !== undefined && wdg.overrides[ovKey] !== null) {
                initialState = wdg.overrides[ovKey] === true;
            }
            const row = Editor.createToggleStyleCheckboxRow(initialState, (on) => {
                item.state = on;
                Dashboard.updateWidget(this.currentId, { [ovKey]: on }, false);
                sv();
            }, { title: stateTooltip });
            stateCol.appendChild(row.wrap);
        }
        grid.appendChild(stateCol);

        const divSep = document.createElement('div');
        divSep.className = 'col-span-2 editor-divider-b my-1 grp-nonspacer';
        grid.appendChild(divSep);

        const wid = this.currentId;
        const collapseOn = `menu_icon_style_${wid}_${lIdx}_on`;
        const collapseOff = `menu_icon_style_${wid}_${lIdx}_off`;
        const keyMapOn = {
            source: 'iconSourceOn',
            builtin: 'iconOn',
            weight: 'iconWeightOn',
            customUrl: 'imgOn',
            tintImage: 'colorizeOn',
            accentColor: 'iconSlotAccentOn'
        };
        const keyMapOff = {
            source: 'iconSourceOff',
            builtin: 'iconOff',
            weight: 'iconWeightOff',
            customUrl: 'imgOff',
            tintImage: 'colorizeOff',
            accentColor: 'iconSlotAccentOff'
        };

        const setTitleSpan = () => {
            titleSpan.innerHTML = Editor.menuItemListTitleHtml(item);
        };

        const menuOffInheritedDomSyncers = [];

        this._renderMenuItemIconStyleBlock(grid, {
            item,
            label: 'Icon (On)',
            keyMap: keyMapOn,
            attachBindHeader,
            sv,
            currentBindings,
            collapseKey: collapseOn,
            setTitleSpan,
            iconSlot: 'on',
            headerSuffix: 'Base Icon Style',
            afterLeaderInheritSave: () => {
                menuOffInheritedDomSyncers.forEach(function (sx) { sx(); });
            }
        });
        this._renderMenuItemIconStyleBlock(grid, {
            item,
            label: 'Icon (Off)',
            keyMap: keyMapOff,
            attachBindHeader,
            sv,
            currentBindings,
            collapseKey: collapseOff,
            setTitleSpan,
            iconSlot: 'off',
            menuOffInheritsIconOn: true,
            registerOffInheritedRefresh: function (fnReg) {
                menuOffInheritedDomSyncers.push(fnReg);
            }
        });

        const grpNonspacer = grid.querySelectorAll('.grp-nonspacer');
        const grpPage = grid.querySelector('.grp-page');
        const grpUrlAll = grid.querySelectorAll('.grp-url');
        const grpToggle = grid.querySelectorAll('.grp-toggle');

        const getModeVal = () => (selMode ? selMode.value : (item.mode || 'push'));
        const getActionVal = () => (selAction ? selAction.value : (item.actionType || 'topic'));

        const syncMenuItemIconSourceFaviconOption = () => {
            try {
                const rawUrl = String(item.urlTo != null ? item.urlTo : '').trim();
                const allowFavicon = getActionVal() === 'url' && rawUrl !== '' && rawUrl !== 'https://';
                const srcSelects = content.querySelectorAll('.ds-select-wrapper.mi-iconsrc');
                srcSelects.forEach(function (sel) {
                    if (!sel || typeof sel.setOptions !== 'function') return;
                    const baseOpts = Array.isArray(sel._baseIconSourceOptions)
                        ? sel._baseIconSourceOptions
                        : [
                            { value: 'phosphor', text: 'Phosphor icon' },
                            { value: 'custom', text: 'Custom image' },
                            { value: 'favicon', text: 'URL favicon' }
                        ];
                    const nextOpts = baseOpts.filter(function (o) {
                        return (o && o.value !== 'favicon') || allowFavicon;
                    });
                    sel.setOptions(nextOpts);
                    if (!allowFavicon && String(sel.value || '').trim() === 'favicon') {
                        sel.value = 'phosphor';
                        if (typeof sel.onchange === 'function') sel.onchange({ target: sel });
                    }
                });
            } catch (_eFaviconOpt) {
                // ignore
            }
        };

        const updateActionLabels = () => {
            if (!selAction || typeof selAction.setOptions !== 'function') return;
            const hasTopic = Boolean(String(item.outputTopic || '').trim());
            selAction.setOptions([
                { value: 'topic', text: 'Send Topic' },
                { value: 'page', text: hasTopic ? 'Go to Page + Topic' : 'Go to Page' },
                { value: 'url', text: hasTopic ? 'Open URL + Topic' : 'Open URL' }
            ]);
        };

        const updateVisibility = () => {
            const isSeparator = getModeVal() === 'separator';
            const isToggle = getModeVal() === 'toggle';
            const pageImplicitGroup = isToggle && getActionVal() === 'page';
            const rowBehavior = { mode: getModeVal(), actionType: getActionVal() };
            const groupExcl = typeof SwitchWidget === 'undefined'
                || SwitchWidget.isGroupExclusionAvailable(rowBehavior);
            grpNonspacer.forEach(el => { el.style.display = isSeparator ? 'none' : 'flex'; });
            grpToggle.forEach(el => { el.style.display = isToggle && !isSeparator ? 'flex' : 'none'; });
            grid.querySelectorAll('.grp-topic').forEach(el => { el.style.display = isSeparator ? 'none' : 'flex'; });
            if (!isSeparator) {
                const showPage = getActionVal() === 'page';
                const showUrl = getActionVal() === 'url';
                if (grpPage) grpPage.style.display = showPage ? 'flex' : 'none';
                grpUrlAll.forEach(function (el) {
                    el.style.display = showUrl ? 'flex' : 'none';
                });
            } else {
                if (grpPage) grpPage.style.display = 'none';
                grpUrlAll.forEach(function (el) { el.style.display = 'none'; });
            }
            const sgInp = grid.querySelector('.mi-selgrp');
            if (sgInp) {
                sgInp.disabled = pageImplicitGroup;
                sgInp.placeholder = pageImplicitGroup ? 'Implicit: same dashboard page' : 'e.g. menu_tabs';
                sgInp.title = pageImplicitGroup
                    ? 'Go to Page toggles on this dashboard page share one group automatically. No ID needed.'
                    : '';
            }
            selGrpWrap.title = pageImplicitGroup
                ? 'Selection Group ID is not used for Go to Page. All such toggles on this page are one group.'
                : '';
            const sendOffDimmed = isToggle && !isSeparator && !groupExcl;
            if (sendOffRowWrap) {
                sendOffRowWrap.style.opacity = sendOffDimmed ? '0.45' : '';
                sendOffRowWrap.style.pointerEvents = sendOffDimmed ? 'none' : '';
            }
            if (sendOffCheckbox) sendOffCheckbox.disabled = sendOffDimmed;
            updateActionLabels();
            syncMenuItemIconSourceFaviconOption();
        };
        updateVisibility();

        if (selMode) {
            selMode.onchange = (e) => {
                item.mode = e.target.value;
                if (e.target.value !== 'toggle') {
                    item.sendOffOnGroupDeselect = false;
                    if (sendOffCheckbox) {
                        sendOffCheckbox.checked = false;
                        sendOffCheckbox.dispatchEvent(new Event('change'));
                    }
                }
                updateVisibility();
                svStructural();
                setTitleSpan();
            };
        }
        const elLabel = content.querySelector('.mi-label');
        if (elLabel) {
            elLabel.oninput = (e) => { item.label = e.target.value; sv(); if (getModeVal() !== 'separator') setTitleSpan(); };
        }
        if (selAction) {
            selAction.onchange = (e) => {
                item.actionType = e.target.value;
                if (e.target.value === 'page') item.selectionGroup = '';
                const rb = { mode: getModeVal(), actionType: e.target.value };
                if (typeof SwitchWidget !== 'undefined' && !SwitchWidget.isGroupExclusionAvailable(rb)) {
                    item.sendOffOnGroupDeselect = false;
                    if (sendOffCheckbox) {
                        sendOffCheckbox.checked = false;
                        sendOffCheckbox.dispatchEvent(new Event('change'));
                    }
                }
                updateVisibility();
                svStructural();
            };
        }
        const elPage = content.querySelector('.mi-pageto');
        if (elPage) elPage.oninput = (e) => { item.pageTo = e.target.value; sv(); };
        const elUrl = content.querySelector('.mi-urlto');
        if (elUrl) elUrl.oninput = (e) => { item.urlTo = e.target.value; sv(); syncMenuItemIconSourceFaviconOption(); };
        const urlNewTabInp = urlNewTabCol.querySelector('input[type="checkbox"]');
        if (urlNewTabInp && !urlNewTabBh.isBound) {
            urlNewTabInp.classList.add('mi-urlnewtab');
        }
    },

    init: function (widgetsMap) {
        this.container = document.getElementById('editor-content');
        this.selectWrap = document.getElementById('editor-select-widget-wrap');

        // Note: The custom dropdown is fully built inside refreshDropdown()


        this.refreshDropdown(widgetsMap);
        this.updateToolbarState();
        this.applyUiModeChrome();
        this.colorPickerControllers = [];
        if (typeof EditorTooltip !== 'undefined' && typeof EditorTooltip.init === 'function') {
            EditorTooltip.init();
        }
        if (!this._themeRefreshBound && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            this._themeRefreshBound = true;
            window.addEventListener('ds-theme-changed', () => {
                if (typeof Dashboard === 'undefined' || !Dashboard.isEditMode || !this.currentId || this.currentId === 'MULTIPLE') return;
                if (this.currentId === 'GLOBAL_SETTINGS') this.renderGlobalEditor();
                else if (Dashboard.widgets && Dashboard.widgets[this.currentId]) {
                    this.refreshVisibleColorPickers();
                    this.notifyExternalWidgetChange(this.currentId, true);
                }
            });
        }

        if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
            const self = this;
            const prewarm = function () {
                if (typeof Dashboard !== 'undefined' && !Dashboard.isEditMode && (!self.currentId || self.currentId === 'GLOBAL_SETTINGS')) {
                    self.loadWidget('GLOBAL_SETTINGS');
                }
            };
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(prewarm, { timeout: 1500 });
            } else {
                setTimeout(prewarm, 800);
            }
        }
    },

    /** Normalize editor UI mode. Missing / unknown values default to advanced. */
    normalizeUiMode: function (mode) {
        return mode === 'basic' ? 'basic' : 'advanced';
    },

    /** Dashboard-persisted editor complexity: `basic` | `advanced`. */
    getUiMode: function () {
        const raw = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS)
            ? MASTER_SETTINGS.editorMode
            : null;
        return this.normalizeUiMode(raw);
    },

    /** Per-widget override of the global editor mode: `default` | `force_advanced` | `force_basic`. */
    getWidgetEditorModeOverride: function (widgetId) {
        if (!widgetId || widgetId === 'GLOBAL_SETTINGS' || widgetId === 'MULTIPLE') return 'default';
        const w = (typeof Dashboard !== 'undefined' && Dashboard.widgets) ? Dashboard.widgets[widgetId] : null;
        if (!w || !w.overrides) return 'default';
        const v = w.overrides.editorModeOverride;
        return (v === 'force_advanced' || v === 'force_basic') ? v : 'default';
    },

    /** Effective editor mode for a widget (global mode + per-widget override). */
    getEffectiveUiMode: function (widgetId) {
        const globalMode = this.getUiMode();
        const override = this.getWidgetEditorModeOverride(widgetId);
        if (override === 'force_advanced') return 'advanced';
        if (override === 'force_basic') return 'basic';
        return globalMode;
    },

    /**
     * Schema / toolbar gate for Basic vs Advanced.
     * Untagged meta (no `editorTier`) is treated as advanced.
     * Tags: `basic` | `both` | `advanced`.
     * `isGlobal` selects the global mode; otherwise the effective mode for the current widget.
     */
    editorTierAllows: function (meta, isGlobal) {
        const tier = meta && meta.editorTier;
        const mode = isGlobal ? this.getUiMode() : this.getEffectiveUiMode(this.currentId);
        if (tier === 'both') return true;
        if (tier === 'basic') return mode === 'basic';
        return mode === 'advanced';
    },

    /**
     * Show / hide toolbar controls marked `data-editor-tier="advanced"`.
     * Preserves each node's prior inline display so intentional `display:none`
     * (e.g. Homey-only template Save) is restored when leaving Basic.
     */
    applyUiModeChrome: function () {
        const isAdvanced = this.getUiMode() === 'advanced';
        if (typeof document === 'undefined' || !document.querySelectorAll) return;
        document.querySelectorAll('[data-editor-tier="advanced"]').forEach(function (el) {
            if (!isAdvanced) {
                if (el.dataset.editorTierDisplay === undefined) {
                    el.dataset.editorTierDisplay = el.style.display || '';
                }
                el.style.display = 'none';
                return;
            }
            if (el.dataset.editorTierDisplay !== undefined) {
                el.style.display = el.dataset.editorTierDisplay;
                delete el.dataset.editorTierDisplay;
            }
        });
    },

    /**
     * While the shared color picker panel is open, defer inspector rebuilds so nested icon/typography
     * saves do not destroy the active picker. Reload runs once when the panel closes.
     */
    _shouldDeferInspectorReloadForOpenColorPicker: function () {
        return typeof EditorColorPicker !== 'undefined'
            && typeof EditorColorPicker.isPanelOpen === 'function'
            && EditorColorPicker.isPanelOpen();
    },

    _queueDeferredInspectorReload: function (widgetId) {
        if (widgetId === 'GLOBAL_SETTINGS') {
            this._deferredInspectorReloadGlobal = true;
            return;
        }
        if (!widgetId || widgetId === 'MULTIPLE') return;
        this._deferredInspectorReloadWidgetId = widgetId;
    },

    flushDeferredInspectorReload: function () {
        if (this._deferredInspectorReloadGlobal) {
            this._deferredInspectorReloadGlobal = false;
            this.renderGlobalEditor();
            return;
        }
        const widgetId = this._deferredInspectorReloadWidgetId;
        this._deferredInspectorReloadWidgetId = null;
        if (!widgetId) return;
        this._scheduleInspectorMergedConfigReload(widgetId);
    },

    _maybeNotifyInspectorMergedConfigMayHaveChanged: function (widgetId, patch, replaceWholeOverrides, colorCommitSource) {
        this.notifyInspectorMergedConfigMayHaveChanged(widgetId, patch, replaceWholeOverrides);
    },

    _attachColorPicker: function (opts) {
        if (typeof EditorColorPicker === 'undefined' || typeof EditorColorPicker.attach !== 'function') {
            return null;
        }
        const attachOpts = Object.assign({}, opts || {});
        const fieldKey = attachOpts.fieldKey;
        const chromeFn = attachOpts.onFieldChromeUpdate;
        const userAfter = attachOpts.onAfterLocalChange;
        const skipRegistry = attachOpts.skipControllerRegistry === true;
        delete attachOpts.fieldKey;
        delete attachOpts.onFieldChromeUpdate;
        delete attachOpts.skipControllerRegistry;

        attachOpts.onAfterLocalChange = function (phase) {
            if (typeof chromeFn === 'function') chromeFn();
            if (typeof userAfter === 'function') userAfter(phase);
            if (phase === 'slider') return;
            if (fieldKey) Editor._handleFieldDependencyChange(fieldKey, phase);
        };

        const ctrl = EditorColorPicker.attach(attachOpts);
        if (ctrl && this.colorPickerControllers && !skipRegistry) {
            this.colorPickerControllers.push(ctrl);
        }
        return ctrl;
    },

    _destroyColorPickers: function () {
        if (!this.colorPickerControllers || this.colorPickerControllers.length === 0) {
            this.colorPickerControllers = [];
            return;
        }
        const keep = [];
        for (let i = 0; i < this.colorPickerControllers.length; i++) {
            const c = this.colorPickerControllers[i];
            const row = c && c.row;
            const inInspector = row && this.container && this.container.contains(row);
            if (inInspector) {
                try {
                    if (c && typeof c.destroy === 'function') c.destroy();
                } catch (e) { /* ignore */ }
            } else if (c) {
                keep.push(c);
            }
        }
        this.colorPickerControllers = keep;
    },

    _isUnsetInspectorValue: function (value) {
        return value === undefined || value === null;
    },

    _lookupDefaultKeyValue: function (values, defaultKey) {
        if (!defaultKey) return undefined;
        if (values && !this._isUnsetInspectorValue(values[defaultKey])) return values[defaultKey];
        if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS
                && !this._isUnsetInspectorValue(MASTER_SETTINGS[defaultKey])) {
            return MASTER_SETTINGS[defaultKey];
        }
        if (typeof DataConfig !== 'undefined' && DataConfig
                && !this._isUnsetInspectorValue(DataConfig[defaultKey])) {
            return DataConfig[defaultKey];
        }
        return undefined;
    },

    /**
     * Copy master `defaultKey` values onto unset instance keys so `visibleWhen` /
     * `condition` / `disableWhen` see the same effective value the checkbox already shows.
     * Leader-slot defaultKeys (Y axis following X) need a second pass.
     */
    _applySchemaDefaultKeyFallbacks: function (values, schema) {
        if (!values || typeof values !== 'object') return values;
        const fields = [];
        const walk = (field) => {
            if (!field || typeof field !== 'object') return;
            if (field.key && (field.defaultKey || field.defaultKeyFallback)) fields.push(field);
            if (Array.isArray(field.fields)) field.fields.forEach(walk);
            if (field.type === 'column_split' && Array.isArray(field.columns)) {
                field.columns.forEach(function (col) {
                    if (col && Array.isArray(col.fields)) col.fields.forEach(walk);
                });
            }
        };
        (schema || []).forEach((group) => {
            if (group && Array.isArray(group.fields)) group.fields.forEach(walk);
        });
        const applyOnce = () => {
            fields.forEach((field) => {
                if (!this._isUnsetInspectorValue(values[field.key])) return;
                let next = this._lookupDefaultKeyValue(values, field.defaultKey);
                if (this._isUnsetInspectorValue(next)) {
                    next = this._lookupDefaultKeyValue(values, field.defaultKeyFallback);
                }
                if (!this._isUnsetInspectorValue(next)) values[field.key] = next;
            });
        };
        applyOnce();
        applyOnce();
        return values;
    },

    _prepareReactiveContext: function (schema, values, isGlobal = false) {
        this.fieldRegistry = {};
        this.groupRegistry = {};
        if (!isGlobal && values && typeof values === 'object') {
            this._applySchemaDefaultKeyFallbacks(values, schema);
        }
        this.currentValuesSnapshot = { ...(values || {}) };

        const dependencyKeys = new Set();
        let hasReactiveFields = false;
        let hasWildcardDependencies = false;

        const scanField = (field) => {
            if (!field || typeof field !== 'object') return;
            const isReactiveField =
                typeof field.condition === 'function' ||
                typeof field.visibleWhen === 'function' ||
                typeof field.disableWhen === 'function' ||
                typeof field.dynamicLabel === 'function' ||
                typeof field.dynamicOptions === 'function' ||
                typeof field.dynamicItems === 'function' ||
                field.reactiveContent === true ||
                (Array.isArray(field.dependsOn) && field.dependsOn.length > 0);

            if (isReactiveField) {
                hasReactiveFields = true;
                if (Array.isArray(field.dependsOn) && field.dependsOn.length > 0) {
                    field.dependsOn.forEach(depKey => dependencyKeys.add(depKey));
                } else {
                    hasWildcardDependencies = true;
                }
            }

            if (field.type === 'column_split' && Array.isArray(field.columns)) {
                field.columns.forEach(function (col) {
                    if (col && Array.isArray(col.fields)) col.fields.forEach(scanField);
                });
            }
            if ((field.type === 'typography' || field.type === 'icon_style') && Array.isArray(field.fields)) {
                field.fields.forEach(scanField);
            }
        };

        (schema || []).forEach(group => {
            if (group && typeof group.visibleWhen === 'function') {
                hasReactiveFields = true;
                if (Array.isArray(group.dependsOn) && group.dependsOn.length > 0) {
                    group.dependsOn.forEach((depKey) => dependencyKeys.add(depKey));
                } else {
                    hasWildcardDependencies = true;
                }
            }
            (group.fields || []).forEach(scanField);
        });

        this._reactiveMeta = {
            isGlobal: !!isGlobal,
            hasReactiveFields,
            hasWildcardDependencies,
            dependencyKeys
        };
    },

    _setSnapshotValue: function (key, value) {
        if (!this.currentValuesSnapshot || key === undefined || key === null) return;
        this.currentValuesSnapshot[key] = value;
    },

    _cloneJsonSafe: function (obj, fallback) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            return fallback;
        }
    },

    _ensureMasterDefaultsSnapshot: function () {
        if (this._masterDefaultSnapshot) return this._masterDefaultSnapshot;
        const raw = (typeof MASTER_SETTINGS === 'object' && MASTER_SETTINGS) ? MASTER_SETTINGS : {};
        const snap = this._cloneJsonSafe(raw, { ...raw });
        if (!snap.themeColors && typeof MasterLayout !== 'undefined' && typeof MasterLayout.defaultThemeColors === 'function') {
            snap.themeColors = MasterLayout.defaultThemeColors();
        } else if (snap.themeColors) {
            snap.themeColors = this._cloneJsonSafe(snap.themeColors, { ...snap.themeColors });
        }
        snap.driverSettings = this._cloneJsonSafe(snap.driverSettings || {}, {});
        this._masterDefaultSnapshot = snap;
        return this._masterDefaultSnapshot;
    },

    _isCurrentDriverSettingKey: function (key) {
        if (!key || typeof DataDriverRegistry === 'undefined' || !DataDriverRegistry.drivers) return false;
        const currentDriverKey = MASTER_SETTINGS.dataDriver || 'nodered';
        const DriverClass = DataDriverRegistry.drivers[currentDriverKey];
        return !!(DriverClass && Array.isArray(DriverClass.schema) && DriverClass.schema.some((s) => s && s.key === key));
    },

    _getGlobalFactoryDefault: function (f) {
        if (!f) return undefined;
        if (f.themeColorToken && typeof MasterLayout !== 'undefined' && typeof MasterLayout.defaultThemeColors === 'function') {
            const defs = MasterLayout.defaultThemeColors();
            return defs ? defs[f.themeColorToken] : undefined;
        }
        if (this._isCurrentDriverSettingKey(f.key)) {
            const currentDriverKey = MASTER_SETTINGS.dataDriver || 'nodered';
            const DriverClass = (typeof DataDriverRegistry !== 'undefined' && DataDriverRegistry.drivers)
                ? DataDriverRegistry.drivers[currentDriverKey]
                : null;
            if (DriverClass && Array.isArray(DriverClass.schema)) {
                const match = DriverClass.schema.find((s) => s && s.key === f.key);
                if (match && Object.prototype.hasOwnProperty.call(match, 'default')) {
                    return match.default;
                }
            }
            const snap = this._ensureMasterDefaultsSnapshot();
            return snap && snap.driverSettings ? snap.driverSettings[f.key] : undefined;
        }
        const snap = this._ensureMasterDefaultsSnapshot();
        if (snap && Object.prototype.hasOwnProperty.call(snap, f.key)) {
            return snap[f.key];
        }
        if (Object.prototype.hasOwnProperty.call(f, 'default')) {
            return f.default;
        }
        if (Object.prototype.hasOwnProperty.call(f, 'defaultValue')) {
            return f.defaultValue;
        }
        return undefined;
    },

    _valuesDifferForEditor: function (a, b) {
        if (a === b) return false;
        const aObj = a !== null && typeof a === 'object';
        const bObj = b !== null && typeof b === 'object';
        if (aObj || bObj) {
            const sa = this._cloneJsonSafe(a, null);
            const sb = this._cloneJsonSafe(b, null);
            if (sa === null || sb === null) return String(a) !== String(b);
            return JSON.stringify(sa) !== JSON.stringify(sb);
        }
        return String(a) !== String(b);
    },

    /**
     * Same test as the master-settings blue outline: current value differs from
     * the factory snapshot (or the field default when the snapshot has no key).
     */
    isGlobalMasterFieldSet: function (f, values) {
        if (!f) return false;
        const src = values && typeof values === 'object' ? values : (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {});
        if (f.key === 'quickToolbarVisibility') {
            const qt = src.quickToolbar || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.quickToolbar : null);
            const vis = (typeof QuickToolbar !== 'undefined' && QuickToolbar.normalizeVisibility)
                ? QuickToolbar.normalizeVisibility(qt)
                : (qt && qt.visibility ? qt.visibility : 'auto');
            return vis !== 'auto';
        }
        let curVal;
        if (f.themeColorToken) {
            const tc = src.themeColors || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.themeColors : {}) || {};
            curVal = tc[f.themeColorToken];
        } else if (this._isCurrentDriverSettingKey(f.key)) {
            const ds = src.driverSettings || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.driverSettings : {}) || {};
            curVal = ds[f.key];
        } else {
            curVal = src[f.key];
        }
        return this._valuesDifferForEditor(curVal, this._getGlobalFactoryDefault(f));
    },

    _collectSchemaSettingKeys: function (schemaGroups) {
        const out = [];
        const seen = {};
        const walkField = (f) => {
            if (!f || typeof f !== 'object') return;
            if (f.key && typeof f.key === 'string' && f.key.charAt(0) !== '_') {
                if (!seen[f.key]) {
                    seen[f.key] = true;
                    out.push(f.key);
                }
            }
            if (Array.isArray(f.fields)) {
                f.fields.forEach(walkField);
            }
        };
        (schemaGroups || []).forEach((g) => {
            if (!g || !Array.isArray(g.fields)) return;
            g.fields.forEach(walkField);
        });
        return out;
    },

    /**
     * Field visibility = behavioral rules AND editor tier.
     * Untagged fields inherit `group.editorTier` when present; otherwise omitted = advanced.
     * (Basic icon names are cloned into Basic Settings via `basicSettingKeys`, not whole Icon slideouts.)
     */
    _isFieldVisible: function (field, values, isGlobal, group) {
        const tierMeta = (field && field.editorTier != null)
            ? field
            : (group && group.editorTier != null ? group : field);
        if (!this.editorTierAllows(tierMeta, isGlobal)) return false;
        const conditionOk = (typeof field.condition === 'function') ? !!field.condition(values, isGlobal) : true;
        const visibleWhenOk = (typeof field.visibleWhen === 'function') ? !!field.visibleWhen(values, isGlobal) : true;
        return conditionOk && visibleWhenOk;
    },

    /** Apply explicit 12-column grid placement (`gridColStart` = 1-based column index).
     * The start is kept as a row-break hint for the equal-width rule (see
     * `equalizeInspectorGrid`); the visual column is redistributed so every
     * visible cell in the row shares the same width. */
    _applyEditorFieldGridColumn: function (wrapperEl, fieldDef) {
        if (!wrapperEl || !fieldDef) return;
        Editor._storeEqCellMeta(wrapperEl, fieldDef);
        const start = fieldDef.gridColStart != null ? Number(fieldDef.gridColStart) : NaN;
        if (Number.isFinite(start) && start >= 1) {
            wrapperEl.style.gridColumn = `${start} / span ${fieldDef.cols || 12}`;
        }
    },

    /** Total columns for inspector grids. Every equalized row sums to this. */
    EQ_COLS_TOTAL: 12,

    /**
     * Inspector equal-width rule (DRY, central).
     *
     * `cols` on a schema field only declares row membership (which fields share
     * a 12-column row). Visual widths are computed here so every visible cell in
     * the same row gets the same width. Hidden cells (`display: none`,
     * `visibility: hidden`, `spacer` fillers) collapse and never reserve space;
     * the remaining cells expand to fill the row.
     *
     * Exception (opt-in, none in use today): set `fixedCols: 1-12` on a field to
     * keep that width, or `equalize: false` to keep its authored `cols`. Fixed
     * cells are subtracted first; the flexible remainder is split equally.
     */
    _storeEqCellMeta: function (el, fieldDef) {
        if (!el || !el.dataset) return;
        const f = fieldDef || {};
        if (el.dataset.eqOrig == null) {
            const rawCols = (f.cols != null) ? Number(f.cols) : NaN;
            const live = Editor._gridChildColSpan(el);
            const span = (Number.isFinite(rawCols) && rawCols >= 1 && rawCols <= 12) ? rawCols : live;
            el.dataset.eqOrig = String(span);
        }
        if (f.gridColStart != null && el.dataset.eqStart == null) {
            el.dataset.eqStart = String(f.gridColStart);
        }
        if (f.fixedCols != null) {
            const fixed = Number(f.fixedCols);
            if (Number.isFinite(fixed) && fixed >= 1 && fixed <= 12) el.dataset.eqFixed = String(fixed);
        } else if (f.equalize === false) {
            el.dataset.eqOptOut = '1';
        }
        if (f.type != null) el.dataset.eqType = String(f.type);
        if (f.key != null && el.dataset.fieldKey == null) el.dataset.fieldKey = String(f.key);
    },

    _eqOrigSpan: function (el) {
        if (el && el.dataset && el.dataset.eqOrig != null) {
            const n = parseInt(el.dataset.eqOrig, 10);
            if (Number.isFinite(n) && n >= 1 && n <= 12) return n;
        }
        return Editor._gridChildColSpan(el);
    },

    _eqOrigRowStart: function (el) {
        if (el && el.dataset && el.dataset.eqStart != null) {
            const n = parseInt(el.dataset.eqStart, 10);
            if (Number.isFinite(n) && n >= 1) return n;
        }
        if (el && el.style && el.style.gridColumn) {
            const m = String(el.style.gridColumn).match(/^(\d+)\s*\//);
            if (m) return parseInt(m[1], 10) || 0;
        }
        return 0;
    },

    _eqIsHidden: function (el) {
        if (!el || !el.style) return false;
        if (el.style.display === 'none') return true;
        if (el.style.visibility === 'hidden') return true;
        if (el.dataset && el.dataset.eqType === 'spacer') return true;
        return false;
    },

    _eqFixedSpan: function (el) {
        if (!el || !el.dataset) return 0;
        if (el.dataset.eqFixed != null) {
            const n = parseInt(el.dataset.eqFixed, 10);
            if (Number.isFinite(n) && n >= 1 && n <= 12) return n;
        }
        if (el.dataset.eqOptOut === '1') return Editor._eqOrigSpan(el);
        return 0;
    },

    /** Column span for a rendered inspector grid cell (class `col-span-N` or inline `gridColumn`). */
    _gridChildColSpan: function (el) {
        if (!el || !el.style) return 12;
        const inline = el.style.gridColumn;
        if (inline) {
            const spanMatch = String(inline).match(/span\s+(\d+)/i);
            if (spanMatch) return parseInt(spanMatch[1], 10) || 12;
        }
        const cls = typeof el.className === 'string' ? el.className : '';
        const classMatch = cls.match(/col-span-(\d+)/);
        return classMatch ? (parseInt(classMatch[1], 10) || 12) : 12;
    },

    /** Group direct grid children into logical 12-column rows (field order).
     * Uses stored equalizer hints (`eqOrig`/`eqStart`) so regrouping stays stable
     * after visual spans are redistributed. Falls back to live spans for grids
     * built without `_storeEqCellMeta` (hand-built rows). */
    _groupSchemaGridChildrenIntoRows: function (children) {
        const rows = [];
        let row = [];
        let colsUsed = 0;
        (children || []).forEach(function (el) {
            if (Editor._eqIsHidden(el)) return;
            const span = (el && el.dataset && el.dataset.eqOrig != null)
                ? Editor._eqOrigSpan(el)
                : Editor._gridChildColSpan(el);
            const start = Editor._eqOrigRowStart(el);
            const explicitRowStart = (start === 1);
            if (colsUsed > 0 && (explicitRowStart || (colsUsed + span > 12))) {
                rows.push(row);
                row = [];
                colsUsed = 0;
            }
            row.push(el);
            colsUsed += span;
            if (colsUsed >= 12) {
                rows.push(row);
                row = [];
                colsUsed = 0;
            }
        });
        if (row.length) rows.push(row);
        return rows;
    },

    /** Replace the `col-span-N` class only when the span actually changes
     * (avoids needless style recalc on every reactive refresh). */
    _setEqCellSpan: function (el, span) {
        if (!el || !el.classList) return;
        const next = Math.max(1, Math.min(12, span | 0));
        const classes = el.classList;
        let cur = 0;
        for (let i = 0; i < classes.length; i++) {
            const name = classes[i];
            if (name.indexOf('col-span-') === 0) {
                cur = parseInt(name.slice(9), 10) || 0;
                if (cur === next) return;
                classes.replace(name, 'col-span-' + next);
                el.dataset.eqCur = String(next);
                return;
            }
        }
        el.classList.add('col-span-' + next);
        el.dataset.eqCur = String(next);
    },

    /**
     * Equalize one 12-column inspector grid: every visible cell in the same
     * logical row shares the same width. Hidden cells and `spacer` fillers
     * collapse (`display: none`) and never reserve space. Cells with
     * `fixedCols` (or `equalize: false`) keep their width; the flexible
     * remainder is split equally (remainder +1 goes to leading cells).
     * Explicit `gridColumn` starts are cleared for equalized cells so
     * auto-placement packs the redistributed row without gaps.
     * Pure class/style string work, no layout reads, safe per keystroke.
     */
    equalizeInspectorGrid: function (gridEl) {
        if (!gridEl || !gridEl.children || !gridEl.children.length) return;
        const children = Array.from(gridEl.children);
        // Backfill hints for hand-built rows that bypassed `_storeEqCellMeta`.
        for (let i = 0; i < children.length; i++) {
            const el = children[i];
            if (el && el.dataset && el.dataset.eqOrig == null) {
                el.dataset.eqOrig = String(Editor._gridChildColSpan(el));
                if (el.style && el.style.gridColumn && el.dataset.eqStart == null) {
                    const m = String(el.style.gridColumn).match(/^(\d+)\s*\//);
                    if (m) el.dataset.eqStart = String(m[1]);
                }
            }
            if (el && el.style && Editor._eqIsHidden(el)) {
                if (el.style.display !== 'none') el.style.display = 'none';
                if (el.style.visibility === 'hidden') el.style.visibility = '';
                if (el.style.pointerEvents === 'none' && el.getAttribute('data-preserve-grid-slot') === 'true') {
                    el.style.pointerEvents = '';
                }
            }
        }
        const rows = Editor._groupSchemaGridChildrenIntoRows(children);
        for (let r = 0; r < rows.length; r++) {
            const rowEls = rows[r];
            if (!rowEls || !rowEls.length) continue;
            // Collapse legacy `visibility: hidden` placeholders and spacers so
            // hidden settings never occupy an empty slot.
            const visible = [];
            for (let i = 0; i < rowEls.length; i++) {
                const el = rowEls[i];
                if (!el || !el.style) continue;
                if (Editor._eqIsHidden(el)) {
                    if (el.style.display !== 'none') el.style.display = 'none';
                    if (el.style.visibility === 'hidden') el.style.visibility = '';
                    if (el.style.pointerEvents === 'none' && el.getAttribute('data-preserve-grid-slot') === 'true') {
                        el.style.pointerEvents = '';
                    }
                    continue;
                }
                visible.push(el);
            }
            if (!visible.length) continue;
            if (visible.length === 1 && rowEls.length === 1) {
                const fixedSingleton = Editor._eqFixedSpan(visible[0]);
                if (fixedSingleton > 0) {
                    Editor._setEqCellSpan(visible[0], fixedSingleton);
                    if (visible[0].style.gridColumn) visible[0].style.gridColumn = '';
                    continue;
                }
                // Full-width singletons (headings, textareas): enforce 12, clear start.
                Editor._setEqCellSpan(visible[0], 12);
                if (visible[0].style.gridColumn) visible[0].style.gridColumn = '';
                continue;
            }
            let fixedTotal = 0;
            const flex = [];
            for (let i = 0; i < visible.length; i++) {
                const fixed = Editor._eqFixedSpan(visible[i]);
                if (fixed > 0) fixedTotal += fixed;
                else flex.push(visible[i]);
            }
            // Apply fixed widths first (auto-packed: clears explicit starts so the
            // redistributed row packs without gaps).
            for (let i = 0; i < visible.length; i++) {
                const fixed = Editor._eqFixedSpan(visible[i]);
                if (fixed > 0) {
                    Editor._setEqCellSpan(visible[i], fixed);
                    if (visible[i].style.gridColumn) visible[i].style.gridColumn = '';
                }
            }
            if (!flex.length) {
                for (let i = 0; i < visible.length; i++) {
                    if (visible[i].style.gridColumn) visible[i].style.gridColumn = '';
                }
                continue;
            }
            let remaining = Editor.EQ_COLS_TOTAL - fixedTotal;
            if (remaining < flex.length) remaining = flex.length;
            if (remaining > 12) remaining = 12;
            const base = Math.floor(remaining / flex.length);
            const extra = remaining % flex.length;
            for (let i = 0; i < flex.length; i++) {
                Editor._setEqCellSpan(flex[i], base + (i < extra ? 1 : 0));
                if (flex[i].style.gridColumn) flex[i].style.gridColumn = '';
            }
        }
    },

    /**
     * Collapse fully-hidden rows (so row gaps disappear) and equalize the rest.
     * Replaces the old placeholder-preserving pass: hidden settings collapse and
     * siblings expand. Keeps the historic name for callers.
     */
    compactSchemaInspectorGrid: function (gridEl) {
        Editor.equalizeInspectorGrid(gridEl);
    },

    /** Run {@link compactSchemaInspectorGrid} on all widget/global inspector field grids.
     * Covers every 12-column grid in the inspector (schema grids, icon-style
     * collapse grids, nested rows): one rule for all rows. Single query + single
     * pass per grid keeps reactive refreshes cheap. */
    compactSchemaInspectorGrids: function (rootEl) {
        if (!rootEl || typeof rootEl.querySelectorAll !== 'function') return;
        rootEl.querySelectorAll('.grid.grid-cols-12').forEach(function (grid) {
            Editor.compactSchemaInspectorGrid(grid);
        });
    },

    _resolveFieldLabel: function (field, values, isGlobal) {
        if (typeof field.dynamicLabel === 'function') {
            const dynamicLabel = field.dynamicLabel(values, isGlobal);
            if (dynamicLabel !== undefined && dynamicLabel !== null) return String(dynamicLabel);
        }
        return field.label;
    },

    /** Escape plain text for safe innerHTML in control labels (dynamic labels may contain & etc.). */
    _escapeControlLabel: function (s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    _resolveFieldOptions: function (field, values, isGlobal) {
        let options = field.options;
        if (typeof field.dynamicOptions === 'function') {
            const dynamicOptions = field.dynamicOptions(values, isGlobal);
            if (Array.isArray(dynamicOptions)) options = dynamicOptions;
        }
        if (typeof FontOptions !== 'undefined' && FontOptions.isBuiltinFontPalette(options)) {
            return FontOptions.getEditorSelectOptions();
        }
        return options;
    },

    /** Cheap identity for a resolved option list so reactive refreshes skip unchanged dropdown rebuilds. */
    _schemaOptionsSignature: function (options) {
        if (!Array.isArray(options)) return '';
        let sig = String(options.length);
        for (let i = 0; i < options.length; i++) {
            const o = options[i] || {};
            sig += '\u0001' + (o.value != null ? o.value : '') + '\u0002' + (o.text != null ? o.text : '');
        }
        return sig;
    },

    _shouldRunReactiveRefresh: function (changedKey) {
        if (!this._reactiveMeta || !this._reactiveMeta.hasReactiveFields) return false;
        if (this._reactiveMeta.hasWildcardDependencies) return true;
        return this._reactiveMeta.dependencyKeys.has(changedKey);
    },

    /**
     * When a direction change only affects the built-in value, show that value
     * without writing it into the widget. An explicit rotation stays put.
     */
    _syncUnsetResolvedFieldValue: function (f, reg, values, isGlobal) {
        if (!f || !reg || !reg.inputEl) return;
        let next;
        if (!isGlobal && f.typographyNested) {
            if (!this.currentId || typeof Dashboard === 'undefined' || !Dashboard.widgets) return;
            const widget = Dashboard.widgets[this.currentId];
            if (!widget) return;
            const tn = f.typographyNested;
            const block = widget.overrides && widget.overrides.typography && widget.overrides.typography[tn.role];
            if (block && Object.prototype.hasOwnProperty.call(block, tn.prop)
                    && block[tn.prop] !== null && block[tn.prop] !== undefined && block[tn.prop] !== '') {
                return;
            }
            const cfg = widget.config;
            if (!cfg || cfg[f.key] == null || cfg[f.key] === '') return;
            next = cfg[f.key];
        } else if (isGlobal && typeof f.displayValue === 'function') {
            next = f.displayValue(values ? values[f.key] : undefined, values, true);
        } else {
            return;
        }
        if (next === undefined || next === null) return;
        if (String(reg.inputEl.value) !== String(next)) reg.inputEl.value = String(next);
    },

    _refreshReactiveInspector: function (changedKey) {
        if (!this.currentId || this.currentId === 'MULTIPLE') return;
        const isGlobal = (this.currentId === 'GLOBAL_SETTINGS');
        const values = this.currentValuesSnapshot || {};

        if (this.groupRegistry) {
            const groupIds = Object.keys(this.groupRegistry);
            for (let i = 0; i < groupIds.length; i++) {
                const entry = this.groupRegistry[groupIds[i]];
                if (!entry || !entry.groupEl || !entry.groupDef) continue;
                if (typeof entry.groupDef.visibleWhen === 'function') {
                    const nextGroupDisplay = entry.groupDef.visibleWhen(values, isGlobal) ? '' : 'none';
                    if (entry.groupEl.style.display !== nextGroupDisplay) {
                        entry.groupEl.style.display = nextGroupDisplay;
                    }
                }
            }
        }

        if (this.fieldRegistry) {
            const fieldKeys = Object.keys(this.fieldRegistry);
            for (let i = 0; i < fieldKeys.length; i++) {
                const reg = this.fieldRegistry[fieldKeys[i]];
                if (!reg || !reg.wrapperEl || !reg.fieldDef) continue;
                const f = reg.fieldDef;
                const grpEntry = (this.groupRegistry && reg.groupId) ? this.groupRegistry[reg.groupId] : null;
                const grpDef = grpEntry ? grpEntry.groupDef : null;

                const isVis = this._isFieldVisible(f, values, isGlobal, grpDef);
                const wrapStyle = reg.wrapperEl.style;
                // Equal-width rule: hidden settings collapse (`display: none`) and
                // never reserve an empty slot. `preserveGridSlot` is deprecated
                // (kept in schemas for compat) and behaves like a normal hide so
                // siblings expand to share the row.
                const nextDisplay = isVis ? '' : 'none';
                if (wrapStyle.display !== nextDisplay) wrapStyle.display = nextDisplay;
                if (wrapStyle.visibility !== '') wrapStyle.visibility = '';
                if (wrapStyle.pointerEvents !== '') wrapStyle.pointerEvents = '';

                if (typeof f.disableWhen === 'function') {
                    const nextDisabled = !!f.disableWhen(values, isGlobal);
                    if (reg.inputEl) {
                        if (typeof reg.inputEl.setDisabled === 'function') {
                            reg.inputEl.setDisabled(nextDisabled);
                        } else if (reg.inputEl.disabled !== nextDisabled) {
                            reg.inputEl.disabled = nextDisabled;
                        }
                    }
                    if (reg.wrapperEl) {
                        const targetOpacity = nextDisabled ? '0.5' : '';
                        if (reg.wrapperEl.style.opacity !== targetOpacity) {
                            reg.wrapperEl.style.opacity = targetOpacity;
                        }
                        const interactiveEls = reg.wrapperEl.querySelectorAll('input, select, textarea, button');
                        interactiveEls.forEach(function (el) {
                            if (el.disabled !== nextDisabled) {
                                el.disabled = nextDisabled;
                            }
                        });
                        const resetIcon = reg.wrapperEl.querySelector('.btn-reset');
                        if (resetIcon) {
                            resetIcon.style.pointerEvents = nextDisabled ? 'none' : '';
                        }
                    }
                }

                if (typeof f.dynamicOptions === 'function' && reg.inputEl && typeof reg.inputEl.setOptions === 'function') {
                    const nextOpts = this._resolveFieldOptions(f, values, isGlobal);
                    const nextOptsSig = this._schemaOptionsSignature(nextOpts);
                    if (nextOptsSig !== reg._optionsSignature) {
                        reg._optionsSignature = nextOptsSig;
                        reg.inputEl.setOptions(nextOpts);
                    }
                }

                if (typeof f.dynamicLabel === 'function' && reg.labelEl) {
                    const nextLabel = f.dynamicLabel(values, isGlobal);
                    if (nextLabel !== undefined && nextLabel !== null) {
                        const nextLabelStr = String(nextLabel);
                        if (reg.labelEl.textContent !== nextLabelStr) reg.labelEl.textContent = nextLabelStr;
                    }
                }

                if (f.syncResolvedWhenUnset && reg.inputEl) {
                    this._syncUnsetResolvedFieldValue(f, reg, values, isGlobal);
                }

                // Composite controls whose *content* (not just visibility) derives from sibling values:
                // dynamic row lists, output topic panels, icon previews. Each hook diffs its own
                // signature first and returns without touching the DOM when nothing changed.
                if (isVis && typeof reg.syncDynamicContent === 'function') {
                    reg.syncDynamicContent(values, isGlobal);
                }
            }
        }

        if (this.container) {
            Editor.compactSchemaInspectorGrids(this.container);
        }
    },

    /**
     * Recount custom table columns from the latest topic value.
     * In-place only: visibility and the column list. Does not rebuild the inspector or save widths.
     */
    refreshTextCustomColumnFields: function () {
        if (!Dashboard.isEditMode) return;
        if (!this.currentId || this.currentId === 'MULTIPLE' || this.currentId === 'GLOBAL_SETTINGS') return;
        this._refreshReactiveInspector('text');
    },

    /** After the Text Content topic is confirmed, count columns in that topic's current value. */
    _recountTextColumnsAfterTopicConfirm: function (topic) {
        const t = String(topic || '').trim();
        if (!t || !Dashboard.isEditMode) return;
        const widget = Dashboard.widgets[this.currentId];
        if (!widget || typeof TextWidget === 'undefined' || widget.constructor !== TextWidget) return;
        const modeRaw = widget.overrides ? widget.overrides.mdTableColumnWidthMode : '';
        if (TextWidget.normalizeTableColumnWidthMode(modeRaw) !== TextWidget.TABLE_COLUMN_WIDTH_MODE_CUSTOM) return;
        this.refreshTextCustomColumnFields();
    },

    _handleFieldDependencyChange: function (changedKey, changeType = 'change', forceReload = false) {
        if (!this.currentId || this.currentId === 'MULTIPLE') return;
        if (!forceReload && !this._shouldRunReactiveRefresh(changedKey)) return;

        if (forceReload) {
            if (this._shouldDeferInspectorReloadForOpenColorPicker()) {
                this._queueDeferredInspectorReload(this.currentId);
                return;
            }
            this.loadWidget(this.currentId);
            return;
        }

        const updateReactive = () => {
            if (!this.currentId || this.currentId === 'MULTIPLE') return;
            this._refreshReactiveInspector(changedKey);
        };

        if (changeType === 'input') {
            if (this._reactiveRefreshTimer) {
                if (typeof WorkerTimer !== 'undefined' && WorkerTimer.clearTimeout) WorkerTimer.clearTimeout(this._reactiveRefreshTimer);
                else clearTimeout(this._reactiveRefreshTimer);
            }
            if (typeof WorkerTimer !== 'undefined' && WorkerTimer.setTimeout) {
                this._reactiveRefreshTimer = WorkerTimer.setTimeout(updateReactive, 40);
            } else {
                this._reactiveRefreshTimer = setTimeout(updateReactive, 40);
            }
        } else {
            updateReactive();
        }
    },

    notifyExternalWidgetChange: function (widgetId, immediate = false) {
        if (!widgetId || this.currentId !== widgetId) return;
        if (this._isEditorDrivenUpdate) return;
        if (!Dashboard.isEditMode) return;

        const reload = () => {
            if (this.currentId === widgetId) this.loadWidget(widgetId);
        };

        if (immediate) {
            reload();
            return;
        }

        if (this._externalRefreshTimer) {
            if (typeof WorkerTimer !== 'undefined' && WorkerTimer.clearTimeout) WorkerTimer.clearTimeout(this._externalRefreshTimer);
            else clearTimeout(this._externalRefreshTimer);
        }
        if (typeof WorkerTimer !== 'undefined' && WorkerTimer.setTimeout) {
            this._externalRefreshTimer = WorkerTimer.setTimeout(reload, 80);
        } else {
            this._externalRefreshTimer = setTimeout(reload, 80);
        }
    },

    /**
     * True when patches from the inspector materially change blobs that derive other inspector fields'
     * display values (`widget.config` merge), including icon follower inheritance and icon mirror toggles.
     */
    widgetOverridesPatchTouchesMergedConfigBlobs: function (patch) {
        return false;
    },

    /**
     * After `Dashboard.updateWidget` from the inspector: rebuild the inspector from fresh merged config when
     * nested blobs changed or the whole overrides object was replaced. Coalesced so rapid commits become one reload.
     */
    notifyInspectorMergedConfigMayHaveChanged: function (widgetId, patch, replaceWholeOverrides) {
        if (!widgetId || widgetId !== this.currentId || this.currentId === 'MULTIPLE') return;
        if (!Dashboard.isEditMode) return;

        let needReload = replaceWholeOverrides === true;
        if (!needReload && patch && this.widgetOverridesPatchTouchesMergedConfigBlobs(patch)) {
            needReload = true;
        }
        if (!needReload) return;

        if (this._shouldDeferInspectorReloadForOpenColorPicker()) {
            this._queueDeferredInspectorReload(widgetId);
            return;
        }
        if (document.getElementById('bind-opts-popup')) {
            this._queueDeferredInspectorReload(widgetId);
            return;
        }

        this._scheduleInspectorMergedConfigReload(widgetId);
    },

    _scheduleInspectorMergedConfigReload: function (widgetId) {
        if (typeof WorkerTimer !== 'undefined' && WorkerTimer.clearTimeout) {
            if (this._inspectorMergedConfigReloadTimer) {
                WorkerTimer.clearTimeout(this._inspectorMergedConfigReloadTimer);
                this._inspectorMergedConfigReloadTimer = null;
            }
        } else if (this._inspectorMergedConfigReloadTimer) {
            clearTimeout(this._inspectorMergedConfigReloadTimer);
            this._inspectorMergedConfigReloadTimer = null;
        }

        const runReload = () => {
            Editor._inspectorMergedConfigReloadTimer = null;
            if (!Dashboard.isEditMode) return;
            const wid = Editor.currentId;
            if (!wid || wid === 'MULTIPLE' || wid !== widgetId) return;
            if (!Dashboard.widgets[wid]) return;
            Editor.loadWidget(wid);
        };

        if (typeof WorkerTimer !== 'undefined' && WorkerTimer.setTimeout) {
            this._inspectorMergedConfigReloadTimer = WorkerTimer.setTimeout(runReload, 80);
        } else {
            this._inspectorMergedConfigReloadTimer = setTimeout(runReload, 80);
        }
    },

    /**
     * After saving a nested icon field on the leader slot, immediately refresh inherited fields on the
     * follower slot + optional slideout preview (no wait for debounced `loadWidget`).
     *
     * Widgets opt in via `static get INHERIT_EDITOR_ICON_SLOTS()`:
     * `{ leaderSlot, followerSlot, inheritKeys, followerKeymap }` (e.g. Switch: on→off, Icon: off→on).
     *
     * Legacy Switch without the getter still uses `ICON_OFF_INHERIT_KEYS` + leader `on`.
     */
    _syncFollowerIconSlotFromLeaderImmediate: function (widget, icn, ctor) {
        if (!widget || !icn || icn.root !== 'icons') return;
        let spec = ctor && ctor.INHERIT_EDITOR_ICON_SLOTS;
        if (!spec && ctor && (ctor.ICON_OFF_INHERIT_KEYS || ctor.SWITCH_OFF_ICON_INHERIT_KEYS) && icn.slot === 'on') {
            spec = {
                leaderSlot: 'on',
                followerSlot: 'off',
                inheritKeys: ctor.ICON_OFF_INHERIT_KEYS || ctor.SWITCH_OFF_ICON_INHERIT_KEYS,
                followerKeymap: ctor.ICON_KEYMAP_OFF
            };
        }
        if (!spec || icn.slot !== spec.leaderSlot) return;
        const inheritKeys = spec.inheritKeys;
        const followerKm = spec.followerKeymap;
        const followerSlot = spec.followerSlot;
        if (!inheritKeys || !followerKm || !followerSlot || !inheritKeys.includes(icn.prop)) return;
        const effectiveConfig = widget.config;
        const iconsRoot = widget.overrides && widget.overrides.icons ? widget.overrides.icons : {};
        const followerStored = (iconsRoot && iconsRoot[followerSlot] && typeof iconsRoot[followerSlot] === 'object')
            ? iconsRoot[followerSlot] : {};
        inheritKeys.forEach((logicalKey) => {
            const followerOwns = Object.prototype.hasOwnProperty.call(followerStored, logicalKey)
                && !BaseWidget.followerIconInheritPlaceholder(logicalKey, followerStored[logicalKey]);
            if (followerOwns) return;
            const flatKey = followerKm[logicalKey];
            if (!flatKey) return;
            const newVal = effectiveConfig[flatKey];
            if (newVal === undefined) return;
            this._setSnapshotValue(flatKey, newVal);
            const reg = this.fieldRegistry && this.fieldRegistry[flatKey];
            if (reg && reg.inputEl) {
                const el = reg.inputEl;
                const sv = String(newVal !== undefined && newVal !== null ? newVal : '');
                if (el.tagName === 'SELECT') el.value = sv;
                else if (el.type === 'checkbox') {
                    el.checked = newVal === true;
                    if (typeof el._syncCheckboxRowChrome === 'function') el._syncCheckboxRowChrome();
                } else {
                    el.value = sv;
                    if (typeof el._syncIconInputBtn === 'function') el._syncIconInputBtn();
                }
            }
            if (reg && typeof reg.colorPickerSync === 'function') reg.colorPickerSync();
        });
        if (Editor._iconStylePreviewCallbacks) {
            const cb = Editor._iconStylePreviewCallbacks[followerKm.source];
            if (typeof cb === 'function') cb();
        }
    },

    /**
     * After saving a nested typography field on the leader role, immediately refresh inherited
     * fields on the follower role (no wait for debounced `loadWidget`).
     *
     * Widgets opt in via `static get INHERIT_EDITOR_TYPOGRAPHY_SLOTS()`:
     * one slot, or an array of `{ leaderRole, followerRole, inheritProps, followerPrefix, leaderPrefix }`.
     */
    _syncFollowerTypographyFromLeaderImmediate: function (widget, tn, ctor) {
        if (!widget || !tn || tn.root !== 'typography') return;
        const raw = ctor && ctor.INHERIT_EDITOR_TYPOGRAPHY_SLOTS;
        if (!raw) return;
        const specs = Array.isArray(raw) ? raw : [raw];
        const propToSuffix = {
            fontFamily: 'Font',
            fontSize: 'FontSize',
            color: 'FontColor',
            bold: 'FontBold',
            opacity: 'FontOpacity'
        };
        const effectiveConfig = widget.config;
        const typRoot = widget.overrides && widget.overrides.typography ? widget.overrides.typography : {};
        for (let si = 0; si < specs.length; si++) {
            const spec = specs[si];
            if (!spec || tn.role !== spec.leaderRole) continue;
            const inheritProps = spec.inheritProps;
            if (!inheritProps || !inheritProps.includes(tn.prop)) continue;
            const followerStored = (typRoot[spec.followerRole] && typeof typRoot[spec.followerRole] === 'object')
                ? typRoot[spec.followerRole] : {};
            inheritProps.forEach((prop) => {
                if (Object.prototype.hasOwnProperty.call(followerStored, prop)) return;
                const suffix = propToSuffix[prop];
                if (!suffix || !spec.followerPrefix) return;
                const flatKey = spec.followerPrefix + suffix;
                const newVal = effectiveConfig[flatKey];
                if (newVal === undefined) return;
                this._setSnapshotValue(flatKey, newVal);
                const reg = this.fieldRegistry && this.fieldRegistry[flatKey];
                if (reg && reg.inputEl) {
                    const el = reg.inputEl;
                    const sv = String(newVal !== undefined && newVal !== null ? newVal : '');
                    if (el.tagName === 'SELECT') el.value = sv;
                    else if (el.type === 'checkbox') {
                        el.checked = newVal === true;
                        if (typeof el._syncCheckboxRowChrome === 'function') el._syncCheckboxRowChrome();
                    } else el.value = sv;
                }
                if (reg && typeof reg.colorPickerSync === 'function') reg.colorPickerSync();
            });
        }
    },

    refreshVisibleColorPickers: function () {
        const reg = this.fieldRegistry || {};
        Object.keys(reg).forEach((k) => {
            const entry = reg[k];
            if (entry && typeof entry.colorPickerSync === 'function') {
                entry.colorPickerSync();
            }
        });
        if (typeof EditorColorPicker !== 'undefined' && typeof EditorColorPicker.refreshThemeAwareUi === 'function') {
            EditorColorPicker.refreshThemeAwareUi();
        }
    },

    /** Commits any pending dirty text/number input to the current widget before the editor panel is torn down. */
    _flushActiveInput: function () {
        if (!this.container || !this.currentId || this.currentId === 'MULTIPLE' || this.currentId === 'GLOBAL_SETTINGS') return;
        const active = document.activeElement;
        if (!active || !this.container.contains(active)) return;
        const tag = active.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
        const type = (active.type || '').toLowerCase();
        if (type === 'color' || type === 'checkbox' || type === 'radio') return;
        active.blur();
    },

    _dropdownWidgetLocked: function (w) {
        if (!w) return false;
        const bindings = w.bindings;
        if (bindings && typeof bindings.locked === 'string' && bindings.locked !== '') {
            return !!(w.config && w.config.locked);
        }
        const ov = w.overrides;
        if (ov && Object.prototype.hasOwnProperty.call(ov, 'locked')) return ov.locked === true;
        return false;
    },

    _getDropdownLabelHtml: function (id, widgetsMap) {
        if (!widgetsMap && typeof Dashboard !== 'undefined') widgetsMap = Dashboard.widgets;
        if (!widgetsMap) widgetsMap = {};

        if (id === 'GLOBAL_SETTINGS' || !id) {
            return '<span>⚙️ Dashboard Settings</span>';
        }

        if (id === 'MULTIPLE') {
            const count = (typeof Dashboard !== 'undefined' && Dashboard.selectedIds) ? Dashboard.selectedIds.length : 0;
            return '<span style="font-size:0.6rem; background:hsla(0,0%,50%,0.15); color:hsl(0,0%,65%); border:1px solid hsla(0,0%,50%,0.3); padding:2px 6px; border-radius:4px; margin-right:8px; vertical-align:middle; text-transform:uppercase; letter-spacing:0.05em; font-weight:600; display:inline-block; flex-shrink:0;">Multi</span><span class="truncate min-w-0">Multiple Items (' + count + ')</span>';
        }

        const isGroupOption = typeof id === 'string' && id.indexOf('GROUP:') === 0;
        const activeGroupId = isGroupOption ? id.slice(6) : (id === null && typeof Dashboard !== 'undefined' ? Dashboard.selectedGroupId : null);
        if (isGroupOption || (activeGroupId && typeof Dashboard !== 'undefined' && Dashboard.groups && Dashboard.groups[activeGroupId])) {
            const gid = isGroupOption ? id.slice(6) : activeGroupId;
            const groupsMap = (typeof Dashboard !== 'undefined' && Dashboard.groups) ? Dashboard.groups : {};
            const group = groupsMap[gid];
            if (group) {
                const lockHtml = group.locked ? '<span style="font-size:0.6rem; background:color-mix(in srgb, red 15%, transparent); color:red; border:1px solid color-mix(in srgb, red 30%, transparent); padding:2px 4px; border-radius:4px; margin-right:4px; vertical-align:middle; display:inline-block; flex-shrink:0;"><i class="ph-bold ph-lock-key"></i></span>' : '';
                const jumpPage = (typeof Dashboard !== 'undefined' && typeof Dashboard.getGroupSelectTargetPage === 'function')
                    ? Dashboard.getGroupSelectTargetPage(group.id || gid)
                    : null;
                const pageLabel = (jumpPage !== null && jumpPage !== undefined) ? jumpPage : (group.minPage != null ? group.minPage : Math.max(1, parseInt(String(typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.currentPage != null ? MASTER_SETTINGS.currentPage : 1), 10) || 1));
                const pageTagHtml = '<span class="header-tag flex-shrink-0 mr-2">P' + pageLabel + '</span>';
                const memberCount = (typeof Dashboard !== 'undefined' && Dashboard.selectedIds && Dashboard.selectedGroupId === gid)
                    ? Dashboard.selectedIds.length
                    : (typeof Dashboard !== 'undefined' && typeof Dashboard.getGroupMemberIds === 'function' ? Dashboard.getGroupMemberIds(gid).length : (group.memberCount || 0));
                return lockHtml + '<span style="font-size:0.6rem; background:hsla(195,95%,45%,0.2); color:hsl(190,95%,70%); border:1px solid hsla(195,95%,45%,0.4); padding:2px 6px; border-radius:4px; margin-right:8px; vertical-align:middle; text-transform:uppercase; letter-spacing:0.05em; font-weight:600; display:inline-block; flex-shrink:0;">Group</span>' + pageTagHtml + '<span class="truncate min-w-0">' + Editor._escapeControlLabel(group.name || gid) + ' (' + memberCount + ')</span>';
            }
        }

        const w = widgetsMap[id];
        if (!w) {
            return '<span>⚙️ Dashboard Settings</span>';
        }

        const name = (w.overrides && w.overrides.metaName) ? w.overrides.metaName : id;
        let type = "Widget";

            if (window.WidgetRegistry && typeof WidgetRegistry.getTypeKeyForClass === 'function') {
                const foundType = WidgetRegistry.getTypeKeyForClass(w.constructor);
                if (foundType) type = foundType;
            }

        let humanName = type;
        if (window.WidgetRegistry && WidgetRegistry.widgets[type] && WidgetRegistry.widgets[type].metadata) {
            humanName = WidgetRegistry.widgets[type].metadata.label || type;
        }

        let cleanName = name;
        const escapedType = type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedLabel = humanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const typeRegex = new RegExp('^(?:New\\s+)?(?:' + escapedType + '|' + escapedLabel + ')\\b(?:\\s*[-:]?\\s*)?', 'i');

        if (typeRegex.test(cleanName)) {
            const stripped = cleanName.replace(typeRegex, '').trim();
            if (stripped.length > 0) {
                cleanName = stripped;
            }
        }

        const isLocked = this._dropdownWidgetLocked(w);
        const lockHtml = isLocked ? '<span style="font-size:0.6rem; background:color-mix(in srgb, red 15%, transparent); color:red; border:1px solid color-mix(in srgb, red 30%, transparent); padding:2px 4px; border-radius:4px; margin-right:4px; vertical-align:middle; display:inline-block; flex-shrink:0;"><i class="ph-bold ph-lock-key"></i></span>' : '';
        const tagHtml = window.WidgetRegistry ? window.WidgetRegistry.getWidgetTagHtml(type) : '<span>' + Editor._escapeControlLabel(type) + '</span>';
        const escapedTitle = Editor._escapeControlLabel(name);
        const safeCleanName = Editor._escapeControlLabel(cleanName);
        return lockHtml + tagHtml + '<span class="truncate min-w-0" title="' + escapedTitle + '">' + safeCleanName + '</span>';
    },

    syncDropdownSelection: function (id) {
        const wrap = this.selectWrap;
        if (!wrap || !this._customSelect || !this._customSelect.menu || !this._customSelect.btn || this._dropdownNeedsRebuild || this._customSelect.menu.children.length <= 1) {
            this.refreshDropdown();
            return;
        }

        const effectiveId = (id === null || id === undefined) ? 'GLOBAL_SETTINGS' : id;
        const label = this._customSelect.btn.querySelector('#custom-select-label');
        if (label) {
            label.innerHTML = this._getDropdownLabelHtml(effectiveId);
        }

        const menu = this._customSelect.menu;
        const activeItems = menu.querySelectorAll('.ds-editor-menu-item.is-active');
        for (let i = 0; i < activeItems.length; i++) {
            activeItems[i].classList.remove('is-active');
        }

        let targetId = effectiveId;
        if (typeof Dashboard !== 'undefined' && Dashboard.selectedGroupId) {
            targetId = 'GROUP:' + Dashboard.selectedGroupId;
        } else if (effectiveId !== 'MULTIPLE' && effectiveId !== 'GLOBAL_SETTINGS' && typeof Dashboard !== 'undefined' && Dashboard.widgets && !Dashboard.widgets[effectiveId]) {
            targetId = 'GLOBAL_SETTINGS';
        }

        if (targetId && targetId !== 'MULTIPLE') {
            const targetItem = menu.querySelector('[data-dropdown-id="' + targetId + '"]');
            if (targetItem) {
                targetItem.classList.add('is-active');
            }
        }
    },

    refreshDropdown: function (widgetsMap) {
        this._dropdownNeedsRebuild = false;
        if (!widgetsMap && typeof Dashboard !== 'undefined') widgetsMap = Dashboard.widgets;
        if (!widgetsMap) widgetsMap = {};
        const wrap = this.selectWrap;
        if (!wrap) return;

        if (!this._customSelect) {
            this._customSelect = document.createElement('div');
            this._customSelect.className = 'relative w-full z-50';

            const btn = document.createElement('div');
            btn.className = 'control-input w-full flex items-center justify-between cursor-pointer select-none';
            btn.innerHTML = '<div id="custom-select-label" class="flex items-center min-w-0 flex-1 overflow-hidden whitespace-nowrap"></div><i class="ph-bold ph-caret-down editor-muted-text ml-2"></i>';
            this._customSelect.btn = btn;

            const menu = document.createElement('div');
            menu.className = 'absolute top-full mt-2 left-0 w-full ds-editor-menu max-h-64 hidden z-[2000]';
            this._customSelect.menu = menu;

            menu._dsSelectAnchor = this._customSelect;

            btn.onclick = (e) => {
                e.stopPropagation();
                Editor._toggleDsFixedDropdown(menu, btn, true);
            };

            Editor._bindDsFixedDropdownOutsideClick();

            this._customSelect.appendChild(btn);
            this._customSelect.appendChild(menu);
            wrap.innerHTML = '';
            wrap.appendChild(this._customSelect);
            const closedLabel = btn.querySelector('#custom-select-label');
            this._bindOverflowTitle(btn, closedLabel, function () {
                return closedLabel ? closedLabel.textContent : '';
            });
        }

        const menu = this._customSelect.menu;
        menu.innerHTML = '';
        const groupsMap = (typeof Dashboard !== 'undefined' && Dashboard.groups) ? Dashboard.groups : {};
        const openedGroupId = typeof Dashboard !== 'undefined' ? Dashboard.openedGroupId : null;
        const selectedGroupId = typeof Dashboard !== 'undefined' ? Dashboard.selectedGroupId : null;

        const addOption = (id, html) => {
            const item = document.createElement('div');
            item.className = 'ds-editor-menu-item truncate flex items-center';
            item.setAttribute('data-dropdown-id', id);

            const isGroupOption = typeof id === 'string' && id.indexOf('GROUP:') === 0;
            const optionGroupId = isGroupOption ? id.slice(6) : null;
            const isActiveGroupOption = isGroupOption && Dashboard.selectedGroupId === optionGroupId;
            if (this.currentId === id || isActiveGroupOption || (id === 'GLOBAL_SETTINGS' && (!this.currentId || !widgetsMap[this.currentId]))) {
                item.classList.add('is-active');
                const label = this._customSelect.btn.querySelector('#custom-select-label');
                if (label) label.innerHTML = html;
            }

            item.innerHTML = html;
            Editor._bindOverflowTitle(item, item, function () { return item.textContent; });
            item.onmousedown = (e) => { e.preventDefault(); };
            item.onclick = (e) => {
                e.stopPropagation();
                Editor._closeDsFixedDropdown(menu);
                if (id === 'GLOBAL_SETTINGS') {
                    Dashboard.selectWidget(null);
                } else if (typeof id === 'string' && id.indexOf('GROUP:') === 0) {
                    const groupId = id.slice(6);
                    Dashboard.selectGroup(groupId);
                } else if (id !== 'MULTIPLE') {
                    Dashboard.selectWidget(id, false, false);
                }
            };
            menu.appendChild(item);
        };

        const globalHtml = this._getDropdownLabelHtml('GLOBAL_SETTINGS', widgetsMap);
        if (this.currentId === 'GLOBAL_SETTINGS' || !this.currentId || (this.currentId !== 'MULTIPLE' && !widgetsMap[this.currentId])) {
            const label = this._customSelect.btn.querySelector('#custom-select-label');
            if (label) label.innerHTML = globalHtml;
        }

        addOption('GLOBAL_SETTINGS', globalHtml);

        let groupsArray = Object.keys(groupsMap).map(groupId => {
            const group = groupsMap[groupId];
            const members = typeof Dashboard.getGroupMemberIds === 'function' ? Dashboard.getGroupMemberIds(groupId) : [];
            if (members.length < 2) return null;
            if (openedGroupId && groupId !== openedGroupId) return null;
            const minPage = members.reduce((acc, widgetId) => {
                const widget = widgetsMap[widgetId];
                if (!widget || !widget.overrides) return acc;
                const rawPage = widget.overrides.page || '1';
                const pageSpec = (typeof Dashboard !== 'undefined' && typeof Dashboard.resolveEffectivePageForWidgetId === 'function')
                    ? Dashboard.resolveEffectivePageForWidgetId(widgetId, rawPage)
                    : rawPage;
                const page = typeof WidgetPageSpec !== 'undefined'
                    ? WidgetPageSpec.minPage(pageSpec)
                    : (() => {
                        const pageList = String(widget.overrides.page || '1').split(',').map(p => parseInt(p.trim(), 10)).filter(p => !isNaN(p));
                        return pageList.length ? Math.min(...pageList) : 1;
                    })();
                return Math.min(acc, page);
            }, Number.POSITIVE_INFINITY);
            return {
                id: groupId,
                name: String(group.name || groupId),
                memberCount: members.length,
                minPage: Number.isFinite(minPage) ? minPage : 1,
                locked: group.locked === true
            };
        }).filter(Boolean);

        groupsArray.sort((a, b) => {
            if (a.minPage !== b.minPage) return a.minPage - b.minPage;
            return a.name.localeCompare(b.name);
        });

        if (groupsArray.length > 0) {
            const spc = document.createElement('div');
            spc.className = 'ds-editor-menu-header';
            spc.innerText = 'Groups';
            menu.appendChild(spc);
        }

        groupsArray.forEach(group => {
            const html = this._getDropdownLabelHtml('GROUP:' + group.id, widgetsMap);
            addOption('GROUP:' + group.id, html);
        });

        let widgetsArray = Object.keys(widgetsMap).map(id => {
            const w = widgetsMap[id];
            const group = typeof Dashboard.getGroupByWidgetId === 'function' ? Dashboard.getGroupByWidgetId(id) : null;
            if (openedGroupId && (!group || group.id !== openedGroupId)) return null;
            if (!openedGroupId && group) return null;
            const name = (w.overrides && w.overrides.metaName) ? w.overrides.metaName : id;
            let type = "Widget";

            if (window.WidgetRegistry && typeof WidgetRegistry.getTypeKeyForClass === 'function') {
                const foundType = WidgetRegistry.getTypeKeyForClass(w.constructor);
                if (foundType) {
                    type = foundType;
                }
            }

            let humanName = type;
            if (window.WidgetRegistry && WidgetRegistry.widgets[type] && WidgetRegistry.widgets[type].metadata) {
                humanName = WidgetRegistry.widgets[type].metadata.label || type;
            }

            let cleanName = name;
            const escapedType = type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const escapedLabel = humanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const typeRegex = new RegExp(`^(?:New\\s+)?(?:${escapedType}|${escapedLabel})\\b(?:\\s*[-:]?\\s*)?`, 'i');

            if (typeRegex.test(cleanName)) {
                let stripped = cleanName.replace(typeRegex, '').trim();
                if (stripped.length > 0) {
                    cleanName = stripped;
                }
            }

            let rawPage = (w.overrides && w.overrides.page) || '1';
            let pageStr = String((typeof Dashboard !== 'undefined' && typeof Dashboard.resolveEffectivePageForWidgetId === 'function')
                ? Dashboard.resolveEffectivePageForWidgetId(id, rawPage)
                : rawPage);
            let minPage = typeof WidgetPageSpec !== 'undefined'
                ? WidgetPageSpec.minPage(pageStr)
                : (() => {
                    const pages = pageStr.split(',').map(p => parseInt(p.trim(), 10)).filter(p => !isNaN(p));
                    return pages.length > 0 ? Math.min(...pages) : 1;
                })();
            let isLocked = this._dropdownWidgetLocked(w);

            return { id, name: cleanName, type, minPage, originalName: name, isLocked };
        }).filter(Boolean);

        widgetsArray.sort((a, b) => {
            if (a.minPage !== b.minPage) return a.minPage - b.minPage;
            if (a.type.toLowerCase() !== b.type.toLowerCase()) {
                const wClassA = window.WidgetRegistry ? WidgetRegistry.widgets[a.type] : null;
                const wClassB = window.WidgetRegistry ? WidgetRegistry.widgets[b.type] : null;
                const labelA = wClassA && wClassA.metadata && wClassA.metadata.label ? wClassA.metadata.label : a.type;
                const labelB = wClassB && wClassB.metadata && wClassB.metadata.label ? wClassB.metadata.label : b.type;
                return labelA.toLowerCase().localeCompare(labelB.toLowerCase());
            }
            return a.name.localeCompare(b.name);
        });

        let currentPage = null;
        widgetsArray.forEach(w => {
            if (w.minPage !== currentPage) {
                currentPage = w.minPage;
                const spc = document.createElement('div');
                spc.className = 'ds-editor-menu-header';
                spc.innerText = `Page ${currentPage}`;
                menu.appendChild(spc);
            }
            const html = this._getDropdownLabelHtml(w.id, widgetsMap);
            addOption(w.id, html);
        });

        if (selectedGroupId && groupsMap[selectedGroupId]) {
            const label = this._customSelect.btn.querySelector('#custom-select-label');
            if (label) label.innerHTML = this._getDropdownLabelHtml('GROUP:' + selectedGroupId, widgetsMap);
        } else if (this.currentId === 'MULTIPLE') {
            const label = this._customSelect.btn.querySelector('#custom-select-label');
            if (label) label.innerHTML = this._getDropdownLabelHtml('MULTIPLE', widgetsMap);
        } else if (this.currentId && widgetsMap[this.currentId]) {
            const label = this._customSelect.btn.querySelector('#custom-select-label');
            if (label) label.innerHTML = this._getDropdownLabelHtml(this.currentId, widgetsMap);
        }
    },

    _setChromeDisabled: function (el, disabled) {
        if (!el) return;
        const on = !!disabled;
        el.classList.toggle('is-disabled', on);
        el.classList.remove('opacity-50', 'pointer-events-none');
        if (on) el.setAttribute('aria-disabled', 'true');
        else el.removeAttribute('aria-disabled');
    },

    updateToolbarState: function () {
        const buttons = document.querySelectorAll('.requires-selection');
        const unlockedButtons = document.querySelectorAll('.requires-unlocked');
        const lockBtn = document.getElementById('toolbar-btn-lock');
        
        const hasSelection = this.currentId && this.currentId !== 'GLOBAL_SETTINGS';
        let hasLocked = false;

        if (hasSelection) {
            const idsToCheck = this.currentId === 'MULTIPLE' ? Dashboard.selectedIds : [this.currentId];
            hasLocked = idsToCheck.some(id => typeof Dashboard.isWidgetEffectivelyLocked === 'function'
                ? Dashboard.isWidgetEffectivelyLocked(id)
                : (Dashboard.widgets[id] && Dashboard.widgets[id].config && Dashboard.widgets[id].config.locked));
            if (!hasLocked && Dashboard.selectedGroupId && Dashboard.groups && Dashboard.groups[Dashboard.selectedGroupId]) {
                hasLocked = Dashboard.groups[Dashboard.selectedGroupId].locked === true;
            }
        }

        buttons.forEach(btn => {
            this._setChromeDisabled(btn, !hasSelection);
        });

        unlockedButtons.forEach(btn => {
            this._setChromeDisabled(btn, !(hasSelection && !hasLocked));
        });

        if (lockBtn) {
            if (hasLocked) {
                lockBtn.classList.add('is-locked-active');
                lockBtn.innerHTML = '<i class="ph-fill ph-lock-key"></i>';
            } else {
                lockBtn.classList.remove('is-locked-active');
                lockBtn.innerHTML = '<i class="ph-bold ph-lock-key"></i>';
            }
        }

        if (typeof Dashboard !== 'undefined' && typeof Dashboard._updateUniversalActionButtons === 'function') {
            Dashboard._updateUniversalActionButtons();
        }
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._refreshHistoryUiState === 'function') {
            Dashboard._refreshHistoryUiState();
        }
    },

    loadWidget: function (id) {
        Editor._closeAllDsFixedDropdowns();
        const existingBindPopup = document.getElementById('bind-opts-popup');
        if (existingBindPopup && typeof existingBindPopup._editorTearDown === 'function') {
            existingBindPopup._editorTearDown();
        }
        this.flushPendingTextPreview();
        this._flushActiveInput();
        this._destroyColorPickers();
        if (this.monitorInterval) {
            WorkerTimer.clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        if (this._reactiveRefreshTimer) {
            if (typeof WorkerTimer !== 'undefined' && WorkerTimer.clearTimeout) {
                WorkerTimer.clearTimeout(this._reactiveRefreshTimer);
            } else {
                clearTimeout(this._reactiveRefreshTimer);
            }
            this._reactiveRefreshTimer = null;
        }
        if (this._externalRefreshTimer) {
            if (typeof WorkerTimer !== 'undefined' && WorkerTimer.clearTimeout) {
                WorkerTimer.clearTimeout(this._externalRefreshTimer);
            } else {
                clearTimeout(this._externalRefreshTimer);
            }
            this._externalRefreshTimer = null;
        }
        if (this._inspectorMergedConfigReloadTimer) {
            if (typeof WorkerTimer !== 'undefined' && WorkerTimer.clearTimeout) {
                WorkerTimer.clearTimeout(this._inspectorMergedConfigReloadTimer);
            } else {
                clearTimeout(this._inspectorMergedConfigReloadTimer);
            }
            this._inspectorMergedConfigReloadTimer = null;
        }

        this.currentId = id;
        this.syncDropdownSelection(id);
        this.updateToolbarState();

        this._runDropdownCleanups();
        if (!this.container) {
            this.container = document.getElementById('editor-content');
        }
        if (!this.container) return;
        this.container.innerHTML = '';
        this.fieldRegistry = {};
        this.groupRegistry = {};
        this._selectionGroupAllowSyncers = [];
        this.currentValuesSnapshot = null;
        this._reactiveMeta = null;

        if (id === 'GLOBAL_SETTINGS') {
            this.renderGlobalEditor();
            return;
        }

        if (id === 'MULTIPLE') {
            this.renderMultiSelectionEditor();
            return;
        }

        const widget = Dashboard.widgets[id];
        if (!widget) return;

        try {
            const schema = this._buildWidgetInspectorSchema(widget);
            const mergedValues = this._buildMergedStaticValues(widget);
            this._prepareReactiveContext(schema, mergedValues, false);
            this.renderSchema(schema, mergedValues, widget.overrides, widget.bindings);
        } catch (err) {
            console.error('[Editor] Failed to render widget settings:', err);
        }
    },

    /**
     * Build the per-widget inspector schema. In Responsive Columns layout mode the
     * fixed-mode `Layout & Dimensions` group (x/y/width/height) is replaced by the
     * `Responsive Layout & Dimensions` group whose fields read/write the nested
     * `overrides.layout.responsive` blob via `layoutNested`. Widget-specific extras
     * on `layout_group` (for example Menu auto width/height) are kept and shown when
     * Scale Mode is Rescale alongside Widget Width and Widget Height.
     */
    _buildWidgetInspectorSchema: function (widget) {
        const BaseClass = Object.getPrototypeOf(widget).constructor;
        const common = BaseClass.COMMON_SCHEMA || BaseWidget.COMMON_SCHEMA;
        const schema = [...common, ...widget.getSchema()];
        this._swapLayoutGroupForResponsive(schema, widget.id);
        const basicGroup = this.buildBasicSettingsGroup(widget);
        if (basicGroup) {
            let insertAt = 0;
            for (let i = 0; i < schema.length; i++) {
                if (schema[i] && schema[i].id === 'meta_group') {
                    insertAt = i + 1;
                    break;
                }
            }
            schema.splice(insertAt, 0, basicGroup);
        }
        this._moveAudioGroupsLast(schema);
        return schema;
    },

    /**
     * Widget Audio is the last inspector slideout on every widget.
     * Groups come from DashboardAudio.schemaGroup (title Audio, icon ph-music-notes).
     */
    _moveAudioGroupsLast: function (schema) {
        if (!Array.isArray(schema) || schema.length < 2) return schema;
        const audioGroups = [];
        const rest = [];
        for (let i = 0; i < schema.length; i++) {
            const group = schema[i];
            if (group && group.title === 'Audio' && group.icon === 'ph-music-notes') {
                audioGroups.push(group);
            } else {
                rest.push(group);
            }
        }
        if (!audioGroups.length) return schema;
        schema.length = 0;
        Array.prototype.push.apply(schema, rest);
        Array.prototype.push.apply(schema, audioGroups);
        return schema;
    },

    /** Fixed / Scale geometry for Basic Settings (no padding). */
    _basicFixedGeometryFields: function () {
        return [
            { key: 'x', type: 'number', label: 'X', cols: 3, editorTier: 'both' },
            { key: 'y', type: 'number', label: 'Y', cols: 3, editorTier: 'both' },
            { key: 'width', type: 'number', label: 'Width', cols: 3, defaultKey: 'defaultWidth', editorTier: 'both' },
            { key: 'height', type: 'number', label: 'Height', cols: 3, defaultKey: 'defaultHeight', editorTier: 'both' }
        ];
    },

    /**
     * Layout-mode-aware geometry for Basic Settings.
     * Fixed / Scale: X/Y/Width/Height.
     * Responsive: empty - the Responsive Layout & Dimensions slideout is shown instead.
     */
    _getBasicGeometryFields: function (widgetId) {
        const mode = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && MASTER_SETTINGS.layoutMode)
            ? MASTER_SETTINGS.layoutMode : 'fixed';
        const isCompositeAuthoring = widgetId && typeof Dashboard !== 'undefined'
            && typeof Dashboard.isWidgetCompositeAuthoring === 'function'
            && Dashboard.isWidgetCompositeAuthoring(widgetId);
        if (mode === 'responsive' && !isCompositeAuthoring) {
            return [];
        }
        return this._basicFixedGeometryFields();
    },

    /**
     * Normalize `basicSettingKeys` entries: string key, or `{ key, cols, label }` for Basic-only layout.
     * Advanced schema field defs stay unchanged; cols/label overrides apply only to the Basic Settings clone.
     */
    _normalizeBasicSettingSpecs: function (keys) {
        const out = [];
        (keys || []).forEach(function (entry) {
            if (typeof entry === 'string' && entry) {
                out.push({ key: entry });
                return;
            }
            if (entry && typeof entry === 'object' && typeof entry.key === 'string' && entry.key) {
                out.push(entry);
            }
        });
        return out;
    },

    /** AND-compose visibility predicates (used when lifting nested fields into Basic Settings). */
    _composeVisibleWhen: function (fns) {
        const list = (fns || []).filter(function (fn) { return typeof fn === 'function'; });
        if (!list.length) return undefined;
        if (list.length === 1) return list[0];
        return function (values, isGlobal) {
            for (let i = 0; i < list.length; i++) {
                if (!list[i](values, isGlobal)) return false;
            }
            return true;
        };
    },

    /** Merge dependsOn lists without duplicates (order preserved). */
    _mergeDependsOn: function (lists) {
        const out = [];
        const seen = Object.create(null);
        (lists || []).forEach(function (arr) {
            (arr || []).forEach(function (k) {
                if (!k || seen[k]) return;
                seen[k] = true;
                out.push(k);
            });
        });
        return out.length ? out : undefined;
    },

    /** Nearest `icon_style` ancestor label (slideout section title, e.g. **Icon (On)**). */
    _iconStyleLabelFromAncestors: function (ancestors) {
        for (let i = (ancestors || []).length - 1; i >= 0; i--) {
            const a = ancestors[i];
            if (a && a.type === 'icon_style' && a.label) return String(a.label);
        }
        return null;
    },

    /**
     * Collect field defs from schema groups by key (preserves duplicate keys, e.g. Switch topics).
     * Nested fields keep ancestor `visibleWhen` / `dependsOn`. `icon_input` clones use the parent
     * `icon_style` label (not "Icon name") so Basic Settings match the Icon slideout title.
     */
    _collectSchemaFieldsByKeys: function (schemaGroups, keys) {
        const flat = [];
        const walk = function (fields, ancestors) {
            (fields || []).forEach(function (f) {
                if (!f) return;
                if (f.key) flat.push({ field: f, ancestors: ancestors });
                if (Array.isArray(f.fields)) walk(f.fields, ancestors.concat([f]));
            });
        };
        (schemaGroups || []).forEach(function (g) {
            if (g && Array.isArray(g.fields)) walk(g.fields, [g]);
        });
        const self = this;
        const out = [];
        this._normalizeBasicSettingSpecs(keys).forEach(function (spec) {
            flat.forEach(function (entry) {
                const f = entry.field;
                if (f.key !== spec.key) return;
                const clone = Object.assign({}, f, { editorTier: 'both' });
                if (spec.cols != null) clone.cols = spec.cols;
                if (spec.label != null && String(spec.label).trim() !== '') {
                    clone.label = String(spec.label);
                } else if (f.type === 'icon_input') {
                    const styleLabel = self._iconStyleLabelFromAncestors(entry.ancestors);
                    if (styleLabel) clone.label = styleLabel;
                }
                const visFns = [];
                (entry.ancestors || []).forEach(function (a) {
                    if (a && typeof a.visibleWhen === 'function') visFns.push(a.visibleWhen);
                });
                if (typeof f.visibleWhen === 'function') visFns.push(f.visibleWhen);
                const composedVis = self._composeVisibleWhen(visFns);
                if (composedVis) clone.visibleWhen = composedVis;
                const depLists = (entry.ancestors || []).map(function (a) {
                    return a && a.dependsOn;
                });
                depLists.push(f.dependsOn);
                const mergedDep = self._mergeDependsOn(depLists);
                if (mergedDep) clone.dependsOn = mergedDep;
                out.push(clone);
            });
        });
        return out;
    },

    /**
     * COMMON **Show Container** (`bgVisible`) clone for Basic Settings.
     * Omitted when the widget schema has no Container Style (e.g. Label).
     * Full-width row so later half-width keys (e.g. Default State + Blink) can share the next row.
     */
    _findShowContainerBasicField: function (schemaGroups) {
        const picked = this._collectSchemaFieldsByKeys(schemaGroups, [{ key: 'bgVisible', cols: 12 }]);
        return picked.length ? picked[0] : null;
    },

    /**
     * First schema text field titled **Widget Label** (key varies: `label` vs Slider `widgetLabel`).
     * Cloned for Basic Settings: full-width row, ancestor visibility preserved.
     */
    _findWidgetLabelBasicField: function (schemaGroups) {
        let found = null;
        const walk = (fields, ancestors) => {
            if (found) return;
            (fields || []).forEach((f) => {
                if (found || !f) return;
                if (f.type === 'text' && f.label === 'Widget Label' && f.key) {
                    found = { field: f, ancestors: ancestors };
                    return;
                }
                if (Array.isArray(f.fields)) walk(f.fields, ancestors.concat([f]));
            });
        };
        (schemaGroups || []).forEach((g) => {
            if (g && Array.isArray(g.fields)) walk(g.fields, [g]);
        });
        if (!found) return null;
        const f = found.field;
        const clone = Object.assign({}, f, { editorTier: 'both', cols: 12 });
        const visFns = [];
        (found.ancestors || []).forEach((a) => {
            if (a && typeof a.visibleWhen === 'function') visFns.push(a.visibleWhen);
        });
        if (typeof f.visibleWhen === 'function') visFns.push(f.visibleWhen);
        const composedVis = this._composeVisibleWhen(visFns);
        if (composedVis) clone.visibleWhen = composedVis;
        const depLists = (found.ancestors || []).map((a) => a && a.dependsOn);
        depLists.push(f.dependsOn);
        const mergedDep = this._mergeDependsOn(depLists);
        if (mergedDep) clone.dependsOn = mergedDep;
        return clone;
    },

    /**
     * Basic-only slideout: shared geometry, optional Widget Label (full row under geometry),
     * optional Show Container (`bgVisible`) under the label, then fields listed on the
     * widget's `basicSettingKeys`. Field defs are picked from COMMON_SCHEMA + `getSchema()`
     * (no duplicate definitions).
     */
    buildBasicSettingsGroup: function (widget) {
        if (!widget) return null;
        const ctor = widget.constructor;
        let keys = [];
        if (ctor) {
            if (typeof ctor.basicSettingKeys === 'function') {
                keys = ctor.basicSettingKeys() || [];
            } else if (Array.isArray(ctor.basicSettingKeys)) {
                keys = ctor.basicSettingKeys;
            }
        }
        const BaseClass = Object.getPrototypeOf(widget).constructor;
        const common = (BaseClass && BaseClass.COMMON_SCHEMA)
            ? BaseClass.COMMON_SCHEMA
            : ((typeof BaseWidget !== 'undefined' && BaseWidget.COMMON_SCHEMA) ? BaseWidget.COMMON_SCHEMA : []);
        const widgetSchema = typeof widget.getSchema === 'function' ? widget.getSchema() : [];
        const schemaGroups = [].concat(common || [], widgetSchema || []);
        const geometry = this._getBasicGeometryFields(widget.id);
        const widgetLabel = this._findWidgetLabelBasicField(schemaGroups);
        const showContainer = this._findShowContainerBasicField(schemaGroups);
        const skipKeys = Object.create(null);
        if (widgetLabel && widgetLabel.key) skipKeys[widgetLabel.key] = true;
        if (showContainer && showContainer.key) skipKeys[showContainer.key] = true;
        const keysWithoutInjected = Object.keys(skipKeys).length
            ? (keys || []).filter((entry) => {
                const k = typeof entry === 'string' ? entry : (entry && entry.key);
                return !skipKeys[k];
            })
            : keys;
        const picked = this._collectSchemaFieldsByKeys(schemaGroups, keysWithoutInjected);
        const fields = geometry
            .concat(widgetLabel ? [widgetLabel] : [])
            .concat(showContainer ? [showContainer] : [])
            .concat(picked);
        return {
            id: 'basic_settings',
            title: 'Basic Settings',
            icon: 'ph-sliders-horizontal',
            editorTier: 'basic',
            fields: fields
        };
    },

    /** Standard fixed-layout keys on `layout_group`; widget-specific extras are preserved for Rescale mode. */
    _fixedLayoutGroupStandardKeys: function () {
        return { x: true, y: true, width: true, height: true, padding: true };
    },

    /** Wrap a layout_group extra field so it only shows when Scale Mode is Rescale. */
    _responsiveRescaleLayoutExtraField: function (field) {
        if (!field || !field.key) return field;
        const prevVisible = field.visibleWhen;
        const prevDeps = Array.isArray(field.dependsOn) ? field.dependsOn.slice() : [];
        if (prevDeps.indexOf('responsiveScaleMode') < 0) prevDeps.push('responsiveScaleMode');
        const wrapped = Object.assign({}, field, {
            dependsOn: prevDeps,
            visibleWhen: function (values, isGlobal) {
                if (values.responsiveScaleMode !== 'rescale') return false;
                if (typeof prevVisible === 'function') return prevVisible(values, isGlobal);
                return true;
            }
        });
        return wrapped;
    },

    /** Fields for the Responsive Layout & Dimensions slideout (nested `layout.responsive`). */
    _responsiveLayoutGroupFields: function (layoutExtras) {
        const self = this;
        const rescaleOnly = function (values) {
            return values.responsiveScaleMode === 'rescale';
        };
        const fields = [
            {
                key: 'responsiveScaleMode', type: 'select', label: 'Scale Mode', cols: 12, noBind: true,
                layoutNested: { prop: 'scaleMode' },
                options: [
                    { value: 'resize', text: 'Resize' },
                    { value: 'rescale', text: 'Rescale' }
                ],
                default: 'resize',
                hint: 'Resize: the container grows with the grid cell and content reflows. Rescale: the inner content scales proportionally from Widget Width and Widget Height (same as Layout & Dimensions in Fixed Resolution).'
            },
            {
                key: 'width', type: 'number', label: 'Widget Width', cols: 6, defaultKey: 'defaultWidth',
                visibleWhen: rescaleOnly, dependsOn: ['responsiveScaleMode'],
                hint: 'Design width before scaling. Same key as Width in Fixed Resolution Layout & Dimensions.'
            },
            {
                key: 'height', type: 'number', label: 'Widget Height', cols: 6, defaultKey: 'defaultHeight',
                visibleWhen: rescaleOnly, dependsOn: ['responsiveScaleMode'],
                hint: 'Design height before scaling. Same key as Height in Fixed Resolution Layout & Dimensions.'
            }
        ];
        const fixedCellHeightOnly = function (values) {
            return values.responsiveCellHeightMode === 'fixed';
        };
        const fillCellHeightOnly = function (values) {
            return values.responsiveCellHeightMode === 'fill';
        };
        if (Array.isArray(layoutExtras) && layoutExtras.length > 0) {
            layoutExtras.forEach(function (extra) {
                fields.push(self._responsiveRescaleLayoutExtraField(extra));
            });
        }
        fields.push(
            { key: 'responsiveOrder', type: 'number', label: 'Order', cols: 6, noBind: true, layoutNested: { prop: 'order' }, hint: 'Lower numbers come first in the grid.' },
            { key: 'responsiveColumnSpan', type: 'number', label: 'Column Span', cols: 6, min: 1, max: 24, default: 1, noBind: true, layoutNested: { prop: 'columnSpan' } },
            { key: 'responsivePreferredColumn', type: 'number', label: 'Preferred Column', cols: 6, min: 0, default: 0, noBind: true, layoutNested: { prop: 'preferredColumn' }, hint: '0 = auto-place. A preference, not a fixed position: when Reduce Columns to Fit has dropped that column, the widget auto-places instead.' },
            {
                key: 'responsiveCellHeightMode', type: 'select', label: 'Cell Height Mode', cols: 6, noBind: true,
                layoutNested: { prop: 'cellHeightMode' },
                options: [
                    { value: 'auto', text: 'Auto' },
                    { value: 'fixed', text: 'Fixed' },
                    { value: 'fill', text: 'Fill' }
                ],
                default: 'auto',
                hint: 'Auto sizes the cell to its content (Min Widget Height is the floor). Fixed uses the Cell Height you type. Fill uses the free space down to the next widget that shares any of its columns. When this widget is last in those columns, the cell stays at Min Height. Extra content stays inside the cell (turn on Scroll Overflow Content for Text).'
            },
            {
                key: 'responsiveCellHeight', type: 'number', label: 'Cell Height', cols: 6, min: 1, default: 0, noBind: true,
                layoutNested: { prop: 'cellHeight' },
                visibleWhen: fixedCellHeightOnly, dependsOn: ['responsiveCellHeightMode'],
                hint: 'Fixed height of this widget\'s grid cell in pixels.'
            },
            {
                key: 'responsiveMinHeight', type: 'number', label: 'Min Height', cols: 6, min: 0, noBind: true,
                layoutNested: { prop: 'minHeight' },
                defaultKey: 'layoutResponsiveMinWidgetHeight',
                visibleWhen: fillCellHeightOnly, dependsOn: ['responsiveCellHeightMode'],
                hint: 'Floor for this Fill cell in pixels. When this widget is last in its columns, the cell stays at this height. Defaults to Min Widget Height.'
            },
            {
                key: 'responsivePadding', type: 'number', label: 'Padding', cols: 6, min: 0,
                defaultKey: 'defaultPadding', noBind: true, layoutNested: { prop: 'padding' },
                editorTier: 'advanced'
            }
        );
        return fields;
    },

    _swapLayoutGroupForResponsive: function (schema, widgetId) {
        if (!Array.isArray(schema)) return schema;
        const mode = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && MASTER_SETTINGS.layoutMode)
            ? MASTER_SETTINGS.layoutMode : 'fixed';
        if (mode !== 'responsive') return schema;
        if (widgetId && typeof Dashboard.isWidgetCompositeAuthoring === 'function'
            && Dashboard.isWidgetCompositeAuthoring(widgetId)) {
            return schema;
        }
        schema.forEach((group) => {
            if (!group || group.id !== 'layout_group') return;
            const standardKeys = this._fixedLayoutGroupStandardKeys();
            const originalFields = Array.isArray(group.fields) ? group.fields : [];
            const layoutExtras = originalFields
                .filter(function (f) { return f && f.key && !standardKeys[f.key]; })
                .map(function (f) { return Object.assign({}, f); });
            let paddingField = null;
            originalFields.forEach(function (f) {
                if (f && f.key === 'padding') paddingField = f;
            });
            const prevVisible = group.visibleWhen;
            group.title = 'Responsive Layout & Dimensions';
            group.editorTier = 'both';
            group.fields = this._responsiveLayoutGroupFields(layoutExtras);
            if (paddingField && typeof paddingField.visibleWhen === 'function' && Array.isArray(group.fields)) {
                group.fields.forEach(function (field) {
                    if (!field || field.key !== 'responsivePadding') return;
                    const prevPadVisible = paddingField.visibleWhen;
                    const prevFieldVisible = field.visibleWhen;
                    field.visibleWhen = function (values, isGlobal) {
                        if (!prevPadVisible(values, isGlobal)) return false;
                        if (typeof prevFieldVisible === 'function') return prevFieldVisible(values, isGlobal);
                        return true;
                    };
                    const deps = Array.isArray(field.dependsOn) ? field.dependsOn.slice() : [];
                    const padDeps = Array.isArray(paddingField.dependsOn) ? paddingField.dependsOn : [];
                    padDeps.forEach(function (d) {
                        if (deps.indexOf(d) < 0) deps.push(d);
                    });
                    field.dependsOn = deps;
                });
            }
            group.visibleWhen = function (values, isGlobal) {
                if (isGlobal) return false;
                if (typeof prevVisible === 'function') return prevVisible(values, isGlobal);
                return true;
            };
            const deps = Array.isArray(group.dependsOn) ? group.dependsOn.slice() : [];
            if (deps.indexOf('layoutMode') < 0) deps.push('layoutMode');
            group.dependsOn = deps;
        });
        return schema;
    },

    renderMultiSelectionEditor: function () {
        this._destroyColorPickers();
        const count = Dashboard.selectedIds.length;
        const groupId = Dashboard.selectedGroupId;
        const activeGroup = groupId && Dashboard.groups ? Dashboard.groups[groupId] : null;
        const isOpen = !!(activeGroup && Dashboard.openedGroupId === groupId);
        const lockDisabled = activeGroup && activeGroup.locked === true ? 'disabled' : '';
        const nameInputDisabledClass = activeGroup && activeGroup.locked === true ? 'opacity-60 cursor-not-allowed' : '';

        if (activeGroup) {
            this._runDropdownCleanups();
            this.container.innerHTML = '';
            const root = document.createElement('div');
            root.className = 'editor-hero-panel';

            const hero = document.createElement('div');
            hero.className = 'mb-6';
            const heroIcon = document.createElement('i');
            heroIcon.className = 'ph-duotone ph-stack-simple editor-hero-icon text-5xl mb-3';
            hero.appendChild(heroIcon);
            const heroTitle = document.createElement('h3');
            heroTitle.className = 'text-white font-bold text-lg mb-2';
            heroTitle.textContent = 'Group Selected';
            hero.appendChild(heroTitle);
            const heroText = document.createElement('p');
            heroText.className = 'editor-muted-text text-sm';
            const openHint = isOpen ? 'Group view is open.' : 'Click Open Group to edit members individually.';
            heroText.textContent = String(count) + ' widgets in "' + String(activeGroup.name || '') + '". ' + openHint;
            hero.appendChild(heroText);
            root.appendChild(hero);

            const cg = document.createElement('div');
            cg.className = 'control-group text-left';
            const optGid = 'group_multi_options';
            if (this.panelStates[optGid] === undefined) this.panelStates[optGid] = false;
            if (this.panelStates[optGid]) cg.classList.add('collapsed');
            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'section-title';
            sectionTitle.innerHTML = '<i class="ph-bold ph-sliders-horizontal"></i> Options <i class="ph-bold ph-caret-down chevron"></i>';
            sectionTitle.onclick = () => {
                const collapsed = cg.classList.toggle('collapsed');
                this.panelStates[optGid] = collapsed;
            };
            cg.appendChild(sectionTitle);

            const groupContent = document.createElement('div');
            groupContent.className = 'group-content';
            const innerPanel = document.createElement('div');
            innerPanel.className = 'editor-inner-panel text-left';
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-12 gap-x-2 gap-y-3';

            const nameWrap = document.createElement('div');
            nameWrap.className = 'col-span-12 flex flex-col justify-end';
            const nameHeader = document.createElement('div');
            nameHeader.className = 'control-header-row';
            const nameLbl = document.createElement('span');
            nameLbl.className = 'control-label';
            nameLbl.textContent = 'Group Name';
            nameLbl.setAttribute('data-editor-tooltip', 'group.name');
            nameHeader.appendChild(nameLbl);
            nameWrap.appendChild(nameHeader);
            const groupNameInput = document.createElement('input');
            groupNameInput.id = 'group-name-input';
            groupNameInput.className = 'control-input w-full ' + nameInputDisabledClass;
            groupNameInput.type = 'text';
            if (lockDisabled) groupNameInput.setAttribute('disabled', 'disabled');
            groupNameInput.value = String(activeGroup.name || '');
            groupNameInput.addEventListener('change', (e) => {
                Dashboard.renameGroup(groupId, e.target.value);
            });
            groupNameInput.addEventListener('blur', (e) => {
                Dashboard.renameGroup(groupId, e.target.value);
            });
            nameWrap.appendChild(groupNameInput);
            grid.appendChild(nameWrap);

            const lockWrap = document.createElement('div');
            lockWrap.className = 'col-span-12 flex flex-col justify-end';
            const lockLabel = document.createElement('label');
            lockLabel.className = 'flex items-center gap-2 text-xs mt-1';
            const groupLockInput = document.createElement('input');
            groupLockInput.id = 'group-lock-input';
            groupLockInput.type = 'checkbox';
            groupLockInput.checked = activeGroup.locked === true;
            if (lockDisabled) groupLockInput.setAttribute('disabled', 'disabled');
            groupLockInput.addEventListener('change', (e) => {
                Dashboard.setGroupLocked(groupId, e.target.checked);
            });
            const lockSpan = document.createElement('span');
            lockSpan.textContent = 'Group Locked';
            lockLabel.setAttribute('data-editor-tooltip', 'group.locked');
            lockLabel.appendChild(groupLockInput);
            lockLabel.appendChild(lockSpan);
            lockWrap.appendChild(lockLabel);
            grid.appendChild(lockWrap);

            const visWrap = document.createElement('div');
            visWrap.className = 'col-span-12 flex flex-col justify-end';
            const visHeader = document.createElement('div');
            visHeader.className = 'control-header-row';
            const visLbl = document.createElement('span');
            visLbl.className = 'control-label';
            visLbl.textContent = 'Visibility';
            visLbl.setAttribute('data-editor-tooltip', 'group.visible');
            visLbl.title = 'When disabled, the group is hidden in dashboard view. Optional MQTT topic overrides this value.';
            visHeader.appendChild(visLbl);
            const visControls = document.createElement('div');
            const canBindVis = MASTER_SETTINGS.dataDriver;
            const gBindings = activeGroup.bindings && typeof activeGroup.bindings === 'object' ? activeGroup.bindings : {};
            const visIsBound = Object.prototype.hasOwnProperty.call(gBindings, 'visible');
            visControls.className = 'control-header-actions' + (visIsBound ? ' control-header-actions--pinned' : '');
            if (canBindVis) {
                const bindBtn = document.createElement('button');
                if (visIsBound) {
                    bindBtn.className = 'btn-bind active transition-colors';
                } else {
                    bindBtn.className = 'btn-bind transition-colors';
                }
                bindBtn.title = visIsBound ? 'Unlink Topic' : 'Link to Topic';
                bindBtn.innerHTML = '<i class="ph ' + (visIsBound ? 'ph-link-break' : 'ph-link') + ' text-xs"></i>';
                if (activeGroup.locked === true) {
                    bindBtn.setAttribute('disabled', 'disabled');
                    bindBtn.classList.add('opacity-50', 'pointer-events-none');
                }
                bindBtn.onclick = () => {
                    if (activeGroup.locked === true) return;
                    if (visIsBound) {
                        const gb = JSON.parse(JSON.stringify((Dashboard.groups[groupId] && Dashboard.groups[groupId].bindings) || {}));
                        if (typeof BindingsTree !== 'undefined') BindingsTree.deleteAtPath(gb, ['visible']);
                        else delete gb.visible;
                        Dashboard.updateGroupBindingsForGroup(groupId, gb, true);
                    } else {
                        Dashboard.updateGroupBindingsForGroup(groupId, { visible: '' });
                    }
                    Editor.loadWidget('MULTIPLE');
                };
                visControls.appendChild(bindBtn);
            }
            this._appendHeaderActions(visHeader, visControls);
            visWrap.appendChild(visHeader);

            if (visIsBound) {
                const topicWrap = this.createTopicDropdown(String(gBindings.visible || ''), 'msg.topic', (val) => {
                    Dashboard.updateGroupBindingsForGroup(groupId, { visible: val });
                });
                if (activeGroup.locked === true) {
                    const ti = topicWrap.querySelector('input');
                    if (ti) ti.setAttribute('disabled', 'disabled');
                }
                visWrap.appendChild(topicWrap);
            } else {
                const visToggle = this.createToggleStyleCheckboxRow(activeGroup.visible !== false, (checked) => {
                    Dashboard.setGroupVisible(groupId, checked);
                }, { title: 'Show or hide this entire group on the dashboard (view mode).' });
                if (activeGroup.locked === true) visToggle.input.disabled = true;
                visWrap.appendChild(visToggle.wrap);
            }
            grid.appendChild(visWrap);

            const pageOvWrap = document.createElement('div');
            pageOvWrap.className = 'col-span-12 flex flex-col justify-end';
            const pageOvHeader = document.createElement('div');
            pageOvHeader.className = 'control-header-row';
            const pageOvLbl = document.createElement('span');
            pageOvLbl.className = 'control-label';
            pageOvLbl.textContent = 'Override Page(s)';
            pageOvLbl.setAttribute('data-editor-tooltip', 'group.overridePage');
            pageOvLbl.title = 'When set, all widgets in this group use this page spec for visibility only (comma-separated pages and ranges, same as Page(s) on a widget). Stored widget page values are not changed.';
            pageOvHeader.appendChild(pageOvLbl);
            const pageOvControls = document.createElement('div');
            const pageOvIsBound = Object.prototype.hasOwnProperty.call(gBindings, 'overridePage');
            pageOvControls.className = 'control-header-actions' + (pageOvIsBound ? ' control-header-actions--pinned' : '');
            if (canBindVis) {
                const pageBindBtn = document.createElement('button');
                pageBindBtn.className = pageOvIsBound ? 'btn-bind active transition-colors' : 'btn-bind transition-colors';
                pageBindBtn.title = pageOvIsBound ? 'Unlink Topic' : 'Link to Topic';
                pageBindBtn.innerHTML = '<i class="ph ' + (pageOvIsBound ? 'ph-link-break' : 'ph-link') + ' text-xs"></i>';
                if (activeGroup.locked === true) {
                    pageBindBtn.setAttribute('disabled', 'disabled');
                    pageBindBtn.classList.add('opacity-50', 'pointer-events-none');
                }
                pageBindBtn.onclick = () => {
                    if (activeGroup.locked === true) return;
                    if (pageOvIsBound) {
                        const gb = JSON.parse(JSON.stringify((Dashboard.groups[groupId] && Dashboard.groups[groupId].bindings) || {}));
                        if (typeof BindingsTree !== 'undefined') BindingsTree.deleteAtPath(gb, ['overridePage']);
                        else delete gb.overridePage;
                        Dashboard.updateGroupBindingsForGroup(groupId, gb, true);
                    } else {
                        Dashboard.updateGroupBindingsForGroup(groupId, { overridePage: '' });
                    }
                    Editor.loadWidget('MULTIPLE');
                };
                pageOvControls.appendChild(pageBindBtn);
            }
            this._appendHeaderActions(pageOvHeader, pageOvControls);
            pageOvWrap.appendChild(pageOvHeader);
            if (pageOvIsBound) {
                const pageTopicWrap = this.createTopicDropdown(String(gBindings.overridePage || ''), 'msg.topic', (val) => {
                    Dashboard.updateGroupBindingsForGroup(groupId, { overridePage: val });
                });
                if (activeGroup.locked === true) {
                    const pti = pageTopicWrap.querySelector('input');
                    if (pti) pti.setAttribute('disabled', 'disabled');
                }
                pageOvWrap.appendChild(pageTopicWrap);
            } else {
                const pageOvInput = document.createElement('input');
                pageOvInput.id = 'group-override-page-input';
                pageOvInput.type = 'text';
                pageOvInput.className = 'control-input w-full ' + nameInputDisabledClass;
                pageOvInput.placeholder = '1,2,5-8';
                pageOvInput.value = String(activeGroup.overridePage == null ? '' : activeGroup.overridePage);
                if (lockDisabled) pageOvInput.setAttribute('disabled', 'disabled');
                const commitOverridePage = () => {
                    Dashboard.setGroupOverridePage(groupId, pageOvInput.value);
                };
                pageOvInput.addEventListener('change', commitOverridePage);
                pageOvInput.addEventListener('blur', commitOverridePage);
                pageOvWrap.appendChild(pageOvInput);
            }
            grid.appendChild(pageOvWrap);

            const dimWrap = document.createElement('div');
            dimWrap.className = 'col-span-12 flex flex-col justify-end';
            const dimHeader = document.createElement('div');
            dimHeader.className = 'control-header-row';
            const dimLbl = document.createElement('span');
            dimLbl.className = 'control-label';
            dimLbl.textContent = 'Blur Background When Visible';
            dimLbl.setAttribute('data-editor-tooltip', 'group.dimBackground');
            dimLbl.title = 'View mode only: frosted overlay over the rest of the page, blocks interaction behind the group, and stacks this group above other widgets.';
            dimHeader.appendChild(dimLbl);
            const dimControls = document.createElement('div');
            const dimIsBound = Object.prototype.hasOwnProperty.call(gBindings, 'dimBackgroundWhenVisible');
            dimControls.className = 'control-header-actions' + (dimIsBound ? ' control-header-actions--pinned' : '');
            if (canBindVis) {
                const dimBindBtn = document.createElement('button');
                dimBindBtn.className = dimIsBound ? 'btn-bind active transition-colors' : 'btn-bind transition-colors';
                dimBindBtn.title = dimIsBound ? 'Unlink Topic' : 'Link to Topic';
                dimBindBtn.innerHTML = '<i class="ph ' + (dimIsBound ? 'ph-link-break' : 'ph-link') + ' text-xs"></i>';
                if (activeGroup.locked === true) {
                    dimBindBtn.setAttribute('disabled', 'disabled');
                    dimBindBtn.classList.add('opacity-50', 'pointer-events-none');
                }
                dimBindBtn.onclick = () => {
                    if (activeGroup.locked === true) return;
                    if (dimIsBound) {
                        const gb = JSON.parse(JSON.stringify((Dashboard.groups[groupId] && Dashboard.groups[groupId].bindings) || {}));
                        if (typeof BindingsTree !== 'undefined') BindingsTree.deleteAtPath(gb, ['dimBackgroundWhenVisible']);
                        else delete gb.dimBackgroundWhenVisible;
                        Dashboard.updateGroupBindingsForGroup(groupId, gb, true);
                    } else {
                        Dashboard.updateGroupBindingsForGroup(groupId, { dimBackgroundWhenVisible: '' });
                    }
                    Editor.loadWidget('MULTIPLE');
                };
                dimControls.appendChild(dimBindBtn);
            }
            this._appendHeaderActions(dimHeader, dimControls);
            dimWrap.appendChild(dimHeader);
            if (dimIsBound) {
                const dimTopicWrap = this.createTopicDropdown(String(gBindings.dimBackgroundWhenVisible || ''), 'msg.topic', (val) => {
                    Dashboard.updateGroupBindingsForGroup(groupId, { dimBackgroundWhenVisible: val });
                });
                if (activeGroup.locked === true) {
                    const dti = dimTopicWrap.querySelector('input');
                    if (dti) dti.setAttribute('disabled', 'disabled');
                }
                dimWrap.appendChild(dimTopicWrap);
            } else {
                const dimToggle = this.createToggleStyleCheckboxRow(activeGroup.dimBackgroundWhenVisible === true, (checked) => {
                    Dashboard.setGroupDimBackgroundWhenVisible(groupId, checked);
                }, { title: 'View mode only: blur and block the rest of the page; group appears on top.' });
                if (activeGroup.locked === true) dimToggle.input.disabled = true;
                dimWrap.appendChild(dimToggle.wrap);
            }
            grid.appendChild(dimWrap);

            innerPanel.appendChild(grid);
            groupContent.appendChild(innerPanel);
            cg.appendChild(groupContent);
            root.appendChild(cg);

            // Responsive Columns only: a closed group is a composite grid item, so it
            // gets the same Responsive Layout & Dimensions slideout as a regular widget.
            if (!isOpen && typeof Dashboard !== 'undefined' && typeof Dashboard._isResponsiveLayoutMode === 'function' && Dashboard._isResponsiveLayoutMode()) {
                this._renderGroupResponsiveLayoutSlideout(groupId, root, lockDisabled);
            }

            this.container.appendChild(root);
            return;
        }

        this.container.innerHTML = `
            <div class="editor-hero-panel">
                <i class="ph-duotone ph-stack-simple editor-hero-icon text-5xl mb-3"></i>
                <h3 class="font-bold text-lg mb-2">${count} Widgets Selected</h3>
                <p class="editor-muted-text text-sm mb-6">You can move these widgets together by dragging them on the canvas.</p>
                <div class="editor-inner-panel text-left">
                    <strong class="control-label block mb-2">Available Bulk Actions</strong>
                    <ul class="space-y-2">
                        <li class="flex items-center gap-2"><i class="ph-bold ph-arrows-out-cardinal bound-topic-text"></i> Drag to move together</li>
                        <li class="flex items-center gap-2"><i class="ph-bold ph-arrow-square-out text-success"></i> Move to another page via Toolbar</li>
                        <li class="flex items-center gap-2"><i class="ph-bold ph-trash text-danger"></i> Delete via Toolbar or <kbd class="editor-kbd">Del</kbd></li>
                        <li class="flex items-center gap-2"><i class="ph-bold ph-stack-plus"></i> Duplicate via Toolbar or <kbd class="editor-kbd">Ctrl+D</kbd></li>
                        <li class="flex items-center gap-2"><i class="ph-bold ph-stack bound-topic-text"></i> Adjust Z-Index via Toolbar</li>
                        <li class="flex items-center gap-2"><i class="ph-bold ph-palette"></i> Reset colors via Toolbar</li>
                    </ul>
                </div>
            </div>
        `;
    },

    /**
     * Responsive Layout & Dimensions slideout for a closed group (Responsive Columns
     * only). The group is a composite grid item, so it mirrors the per-widget
     * responsive layout fields, reading/writing group.layout.responsive.
     */
    _renderGroupResponsiveLayoutSlideout: function (groupId, root, lockDisabled) {
        const resp = (typeof Dashboard !== 'undefined' && typeof Dashboard.getGroupResponsiveLayout === 'function')
            ? (Dashboard.getGroupResponsiveLayout(groupId) || {}) : {};
        const defaultPadding = (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultPadding : 0) || 0;
        const masterMinWidgetH = (typeof MASTER_SETTINGS !== 'undefined')
            ? Number(MASTER_SETTINGS.layoutResponsiveMinWidgetHeight) : NaN;
        const defaultFillMinH = Number.isFinite(masterMinWidgetH) ? masterMinWidgetH : 250;

        const heightMode = (typeof Dashboard !== 'undefined' && typeof Dashboard.resolveResponsiveHeightMode === 'function')
            ? Dashboard.resolveResponsiveHeightMode(resp)
            : 'auto';

        const fields = [
            {
                prop: 'scaleMode', label: 'Scale Mode', cols: 12, kind: 'select', def: 'resize',
                options: [
                    { value: 'resize', text: 'Resize' },
                    { value: 'rescale', text: 'Rescale' }
                ],
                hint: 'Resize: member containers stretch with the grid cell. Rescale: the group layout scales uniformly from the center, keeping the design aspect ratio. Member containers keep their native borders, corner radius, glow and padding; only the inner content scales (same as an individual Rescale widget).'
            },
            { prop: 'order', label: 'Order', cols: 6, min: null, max: null, def: null, hint: 'Lower numbers come first in the grid.' },
            { prop: 'columnSpan', label: 'Column Span', cols: 6, min: 1, max: 24, def: 1, hint: null },
            { prop: 'preferredColumn', label: 'Preferred Column', cols: 6, min: 0, max: null, def: 0, hint: '0 = auto-place. A preference, not a fixed position: when Reduce Columns to Fit has dropped that column, the group auto-places instead.' },
            {
                prop: 'cellHeightMode', label: 'Cell Height Mode', cols: 6, kind: 'select', def: 'auto',
                options: [
                    { value: 'auto', text: 'Auto' },
                    { value: 'fixed', text: 'Fixed' },
                    { value: 'fill', text: 'Fill' }
                ],
                hint: 'Auto sizes the cell to the group design aspect ratio. Fixed uses the Cell Height you type. Fill uses the free space down to the next widget that shares any of its columns. When this group is last in those columns, the cell stays at Min Height.'
            },
            { prop: 'cellHeight', label: 'Cell Height', cols: 6, min: 1, max: null, def: 0, hint: 'Fixed height of this group\'s grid cell in pixels.', visibleWhenFixed: true },
            {
                prop: 'minHeight', label: 'Min Height', cols: 6, min: 0, max: null,
                def: defaultFillMinH,
                hint: 'Floor for this Fill cell in pixels. When this group is last in its columns, the cell stays at this height. Defaults to Min Widget Height.',
                visibleWhenFill: true
            },
            { prop: 'padding', label: 'Padding', cols: 6, min: 0, max: null, def: defaultPadding, hint: null }
        ];

        const cg = document.createElement('div');
        cg.className = 'control-group text-left';
        const gid = 'group_responsive_layout';
        if (this.panelStates[gid] === undefined) this.panelStates[gid] = false;
        if (this.panelStates[gid]) cg.classList.add('collapsed');
        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'section-title';
        sectionTitle.innerHTML = '<i class="ph-bold ph-arrows-out"></i> Responsive Layout &amp; Dimensions <i class="ph-bold ph-caret-down chevron"></i>';
        sectionTitle.onclick = () => {
            const collapsed = cg.classList.toggle('collapsed');
            this.panelStates[gid] = collapsed;
        };
        cg.appendChild(sectionTitle);

        const content = document.createElement('div');
        content.className = 'group-content';
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-12 gap-x-2 gap-y-3';

        const heightWraps = [];
        const minHeightWraps = [];
        const syncHeightVisibility = function (mode) {
            heightWraps.forEach(function (el) {
                el.style.display = mode === 'fixed' ? '' : 'none';
            });
            minHeightWraps.forEach(function (el) {
                el.style.display = mode === 'fill' ? '' : 'none';
            });
            Editor.equalizeInspectorGrid(grid);
        };

        fields.forEach(function (f) {
            const wrap = document.createElement('div');
            wrap.className = 'col-span-' + f.cols + ' flex flex-col justify-end';
            wrap.dataset.eqOrig = String(f.cols || 12);
            const lbl = document.createElement('span');
            lbl.className = 'control-label';
            lbl.textContent = f.label;
            if (f.hint) lbl.title = f.hint;
            const groupLayoutTip = {
                scaleMode: 'responsiveScaleMode',
                order: 'responsiveOrder',
                columnSpan: 'responsiveColumnSpan',
                preferredColumn: 'responsivePreferredColumn',
                cellHeightMode: 'responsiveCellHeightMode',
                cellHeight: 'responsiveCellHeight',
                minHeight: 'responsiveMinHeight',
                padding: 'responsivePadding'
            };
            if (groupLayoutTip[f.prop]) lbl.setAttribute('data-editor-tooltip', groupLayoutTip[f.prop]);
            wrap.appendChild(lbl);
            let input;
            if (f.kind === 'select') {
                const opts = Array.isArray(f.options) ? f.options : [];
                let initialVal = resp[f.prop];
                if (f.prop === 'scaleMode') {
                    initialVal = (resp[f.prop] === 'rescale') ? 'rescale' : 'resize';
                } else if (f.prop === 'cellHeightMode') {
                    initialVal = heightMode;
                }
                input = Editor.createCustomSelect(opts, initialVal);
                input.classList.add('w-full');
                if (f.prop === 'scaleMode') {
                    const commitSelect = function () {
                        const v = input.value === 'rescale' ? 'rescale' : 'resize';
                        if (v === 'resize') {
                            Dashboard.updateGroupLayout(groupId, f.prop, undefined);
                        } else {
                            Dashboard.updateGroupLayout(groupId, f.prop, v);
                        }
                    };
                    input.addEventListener('change', commitSelect);
                } else if (f.prop === 'cellHeightMode') {
                    const commitSelect = function () {
                        const v = input.value;
                        const mode = (v === 'fixed' || v === 'fill' || v === 'auto') ? v : 'auto';
                        Dashboard.updateGroupLayout(groupId, f.prop, mode);
                        syncHeightVisibility(mode);
                    };
                    input.addEventListener('change', commitSelect);
                }
            } else {
                input = document.createElement('input');
                input.type = 'number';
                input.className = 'control-input w-full';
                if (f.min !== null) input.min = f.min;
                if (f.max !== null) input.max = f.max;
                let rawVal = resp[f.prop];
                if ((rawVal === undefined || rawVal === null || rawVal === '') && f.prop === 'cellHeight'
                        && resp.height !== undefined && resp.height !== null && resp.height !== '') {
                    rawVal = resp.height;
                }
                input.value = (rawVal !== undefined && rawVal !== null && rawVal !== '') ? rawVal : (f.def !== null ? f.def : '');
                const commit = function () {
                    let v = input.value;
                    if (v === '' || v === null) {
                        Dashboard.updateGroupLayout(groupId, f.prop, undefined);
                        return;
                    }
                    let n = Number(v);
                    if (!Number.isFinite(n)) return;
                    if (f.min !== null && n < f.min) n = f.min;
                    if (f.max !== null && n > f.max) n = f.max;
                    Dashboard.updateGroupLayout(groupId, f.prop, n);
                };
                input.addEventListener('change', commit);
                input.addEventListener('blur', commit);
            }
            if (lockDisabled) input.disabled = true;
            wrap.appendChild(input);
            if (f.visibleWhenFixed) heightWraps.push(wrap);
            if (f.visibleWhenFill) minHeightWraps.push(wrap);
            grid.appendChild(wrap);
        });
        syncHeightVisibility(heightMode);

        content.appendChild(grid);
        cg.appendChild(content);
        root.appendChild(cg);
    },

    /**
     * Deep-ish clone of schema groups that keeps field callbacks (visibleWhen, dependsOn, etc.).
     * JSON.stringify drops functions, which made Layout Mode visibility rules inert.
     */
    _cloneSchemaPreservingFunctions: function (schema) {
        const cloneField = function (field) {
            if (!field || typeof field !== 'object') return field;
            const out = Object.assign({}, field);
            if (Array.isArray(field.fields)) {
                out.fields = field.fields.map(cloneField);
            }
            if (Array.isArray(field.options)) {
                out.options = field.options.map(function (opt) {
                    return (opt && typeof opt === 'object') ? Object.assign({}, opt) : opt;
                });
            }
            if (Array.isArray(field.dependsOn)) {
                out.dependsOn = field.dependsOn.slice();
            }
            return out;
        };
        return (schema || []).map(function (group) {
            if (!group || typeof group !== 'object') return group;
            const out = Object.assign({}, group);
            if (Array.isArray(group.fields)) {
                out.fields = group.fields.map(cloneField);
            }
            if (Array.isArray(group.dependsOn)) {
                out.dependsOn = group.dependsOn.slice();
            }
            return out;
        });
    },

    /**
     * Ordered global settings groups: Platform Connection, driver (no live monitor), Data Stream Explorer,
     * Editor Environment, Dashboard Environment, Theme Colors, Typography, Container Style, then per-widget defaults.
     */
    composeDashboardGlobalMasterSchema: function () {
        const masterSchema = this._cloneSchemaPreservingFunctions(MASTER_SCHEMA);

        let shouldHideConnection = false;
        if (window.APP_CONFIG && window.APP_CONFIG.defaults && window.APP_CONFIG.defaults.lockedPlatform) {
            shouldHideConnection = true;
        } else if (window.APP_CONFIG && window.APP_CONFIG.ui && window.APP_CONFIG.ui.showDataConnection === false) {
            shouldHideConnection = true;
        }

        if (shouldHideConnection) {
            const connIndex = masterSchema.findIndex(g => g.id === 'm_conn');
            if (connIndex > -1) {
                masterSchema.splice(connIndex, 1);
            }
        }

        if (window.APP_CONFIG && window.APP_CONFIG.ui && window.APP_CONFIG.ui.hiddenDrivers) {
            let hidden = window.APP_CONFIG.ui.hiddenDrivers;
            if (!Array.isArray(hidden)) hidden = [hidden];

            const connGroup = masterSchema.find(g => g.id === 'm_conn');
            if (connGroup && connGroup.fields) {
                const driverField = connGroup.fields.find(f => f.key === 'dataDriver');
                if (driverField && driverField.options) {
                    driverField.options = driverField.options.filter(opt => {
                        const val = (typeof opt === 'object' && opt !== null) ? opt.value : opt;
                        return !hidden.includes(val);
                    });
                }
            }
        }

        const currentDriverKey = MASTER_SETTINGS.dataDriver || 'nodered';
        const DriverClass = DataDriverRegistry.drivers[currentDriverKey];
        const explorerFields = [];
        const driverConnFields = [];
        if (DriverClass && Array.isArray(DriverClass.schema)) {
            DriverClass.schema.forEach((s) => {
                if (s.type === 'topic_monitor') explorerFields.push(s);
                else driverConnFields.push(s);
            });
        }
        const driverLabel = DriverClass ? `${DriverClass.metadata.label} Settings` : 'Driver Settings';

        const connIndex = masterSchema.findIndex(g => g.id === 'm_conn');
        const insertBase = (connIndex > -1) ? connIndex + 1 : 0;
        let offset = 0;
        if (driverConnFields.length > 0) {
            masterSchema.splice(insertBase + offset, 0, {
                id: 'driver_specifics',
                title: driverLabel,
                icon: 'ph-sliders',
                editorTier: 'both',
                fields: driverConnFields.map(function (f) {
                    return Object.assign({}, f, { editorTier: f.editorTier || 'both' });
                })
            });
            offset++;
        }
        if (explorerFields.length > 0) {
            masterSchema.splice(insertBase + offset, 0, {
                id: 'm_dse',
                title: 'Data Stream Explorer',
                icon: 'ph-broadcast',
                editorTier: 'both',
                fields: explorerFields.map(function (f) {
                    return Object.assign({}, f, { editorTier: f.editorTier || 'both' });
                })
            });
            offset++;
        }

        const canvasIndex = masterSchema.findIndex(g => g.id === 'm_canvas');
        if (canvasIndex > -1 && Array.isArray(masterSchema[canvasIndex].fields)) {
            masterSchema[canvasIndex].fields.push({
                type: 'widget_defaults_toolbar',
                key: '_widget_defaults_toolbar',
                cols: 12,
                editorTier: 'advanced'
            });
        }
        if (typeof MasterLayout !== 'undefined' && MasterLayout.THEME_TOKEN_DEFS && canvasIndex > -1) {
            const tokenOrder = [
                'background', 'backgroundAccent',
                'surface', 'surfaceAlt',
                'surfaceHover', 'overlay',
                'text', 'textMuted',
                'onSurface', 'onAccent',
                'accent', 'accentSoft',
                'accentSecondary', 'accentOff',
                'controlOff', 'thumb',
                'border', 'borderAccent',
                'icon', 'iconAccent',
                'iconMuted', 'placeholder',
                'success', 'warning',
                'danger', 'glow',
                'markerTint1', 'markerTint2',
                'markerTint3', 'markerTint4',
                'link'
            ];
            const defMap = {};
            MasterLayout.THEME_TOKEN_DEFS.forEach(function (d) { defMap[d.key] = d; });
            const orderedDefs = [];
            tokenOrder.forEach(function (k) {
                if (defMap[k]) {
                    orderedDefs.push(defMap[k]);
                    delete defMap[k];
                }
            });
            Object.keys(defMap).forEach(function (k) { orderedDefs.push(defMap[k]); });

            const themeFields = orderedDefs.map(function (d) {
                return {
                    key: 'themeSlot_' + d.key,
                    type: 'color',
                    label: d.label,
                    cols: 6,
                    fixedCols: 6,
                    themeColorToken: d.key,
                    hint: d.hint,
                    editorTier: 'both'
                };
            });
            masterSchema.splice(canvasIndex + 1, 0, {
                id: 'm_theme',
                title: 'Theme Colors',
                icon: 'ph-palette',
                editorTier: 'both',
                fields: [
                    ...themeFields,
                    {
                        type: 'theme_toolbar',
                        key: '_theme_toolbar',
                        cols: 12,
                        editorTier: 'advanced'
                    }
                ]
            });
        }

        const boxIndex = masterSchema.findIndex(function (g) { return g && g.id === 'm_box'; });
        if (boxIndex > -1 && typeof DashboardDialog !== 'undefined' && DashboardDialog.masterSchemaGroup) {
            masterSchema.splice(boxIndex + 1, 0, DashboardDialog.masterSchemaGroup());
        }

        const bothGroupIds = { m_conn: true, m_editor: true, m_canvas: true, m_theme: true, m_dse: true, driver_specifics: true, m_dialog_box: true };
        masterSchema.forEach(function (group) {
            if (group && bothGroupIds[group.id]) group.editorTier = 'both';
        });

        const pluginSchemas = WidgetRegistry.getGlobalSchema();
        return [...masterSchema, ...pluginSchemas];
    },

    renderGlobalEditor: function () {
        this._destroyColorPickers();
        this._runDropdownCleanups();
        if (this.container) this.container.innerHTML = '';
        const fullSchema = this.composeDashboardGlobalMasterSchema();
        const displayValues = {
            ...MASTER_SETTINGS,
            ...MASTER_SETTINGS.driverSettings,
            themeColors: { ...(MASTER_SETTINGS.themeColors || {}) }
        };
        if (typeof MenuWidget !== 'undefined' && MenuWidget.normalizeHoverGlobalsForEditor) {
            MenuWidget.normalizeHoverGlobalsForEditor(displayValues);
        }
        this._prepareReactiveContext(fullSchema, displayValues, true);
        this.renderSchema(fullSchema, displayValues, displayValues, Dashboard.globalBindings, true);
    },

    toggleAllGroups: function () {
        const allGroups = document.querySelectorAll('.control-group');
        if (allGroups.length === 0) return;

        const topLevelGroups = Array.from(allGroups).filter(function (g) {
            return !(g.closest && g.closest('.editor-collapse-content'));
        });
        if (topLevelGroups.length === 0) return;

        const firstCollapsed = topLevelGroups[0].classList.contains('collapsed');
        const newState = !firstCollapsed;

        let currentSchema;
        if (this.currentId === 'GLOBAL_SETTINGS') {
            currentSchema = this.composeDashboardGlobalMasterSchema();
        } else if (this.currentId === 'MULTIPLE') {
            currentSchema = [];
        } else {
            currentSchema = this._buildWidgetInspectorSchema(Dashboard.widgets[this.currentId]);
        }

        currentSchema.forEach((group, index) => {
            const gid = group.id || `g_${index}`;
            this.panelStates[gid] = newState;
        });

        topLevelGroups.forEach(function (g) {
            if (newState) g.classList.add('collapsed');
            else g.classList.remove('collapsed');
        });

        Object.keys(this.panelStates).forEach(function (k) {
            if (k.startsWith('typo_ui_') || k.startsWith('icon_style_ui_') || k.startsWith('list_row_ui_')) return;
            if (k.startsWith('typo_fields_') || k.startsWith('icon_style_fields_')) return;
            this.panelStates[k] = newState;
        }, this);
    },

    copyToClipboard: function (text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            return new Promise((resolve, reject) => {
                try {
                    let textArea = document.createElement("textarea");
                    textArea.value = text;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-9999px";
                    textArea.style.top = "0";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    if (successful) resolve();
                    else reject(new Error("execCommand failed"));
                } catch (err) {
                    reject(err);
                }
            });
        }
    },

    // Image/Audio galleries live on Homey. Match the toolbar Homey buttons:
    // selected platform *or* the live driver type (so pickers appear as soon as
    // Homey is chosen, not only after the registry handshake).
    _isHomeyPlatformActive: function () {
        const platformHomey = typeof MASTER_SETTINGS !== 'undefined'
            && MASTER_SETTINGS
            && (String(MASTER_SETTINGS.dataDriver || '').toLowerCase() === 'homey' || String(MASTER_SETTINGS.dataDriver || '').toLowerCase() === 'homeassistant');
        const activeHomey = typeof DataDriverRegistry !== 'undefined'
            && typeof DataDriverRegistry.getType === 'function'
            && (DataDriverRegistry.getType() === 'homey' || DataDriverRegistry.getType() === 'homeassistant');
        return !!(platformHomey || activeHomey);
    },

    isImageGalleryAvailable: function () {
        return this._isHomeyPlatformActive();
    },

    // Builds the inline gallery icon appended inside an image URL editbox.
    // Reuses the same inline-button styling as the Phosphor icon picker button
    // (see icon_input branch) so the two pickers stay visually identical.
    // `inputEl` receives the picked URL; both `input` and `change` are dispatched
    // so the value flows through whichever save listener the host field uses.
    createImageGalleryPickerButton: function (inputEl) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-tool w-10 flex-shrink-0 rounded-l-none border-l-0';
        btn.title = 'Pick an image from the Image Gallery';
        btn.innerHTML = '<i class="ph-bold ph-images-square text-lg"></i>';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof ImageGallery === 'undefined' || typeof ImageGallery.open !== 'function') return;
            if (!Editor.isImageGalleryAvailable()) return;
            ImageGallery.open({
                pickMode: true,
                pickFormat: 'url',
                onPick: function (url) {
                    if (!inputEl || !url) return;
                    inputEl.value = url;
                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                    requestAnimationFrame(() => { inputEl.focus(); });
                }
            });
        });
        return btn;
    },

    isAudioGalleryAvailable: function () {
        return this._isHomeyPlatformActive();
    },

    createAudioGalleryPickerButton: function (inputEl) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-tool w-10 flex-shrink-0 rounded-l-none border-l-0';
        btn.title = 'Pick audio from the Audio Gallery';
        btn.innerHTML = '<i class="ph-bold ph-music-notes text-lg"></i>';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof AudioGallery === 'undefined' || typeof AudioGallery.open !== 'function') return;
            if (!Editor.isAudioGalleryAvailable()) return;
            AudioGallery.open({
                pickMode: true,
                onPick: function (url) {
                    if (!inputEl || !url) return;
                    inputEl.value = url;
                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                    requestAnimationFrame(() => { inputEl.focus(); });
                }
            });
        });
        return btn;
    },

    /** Shared audio URL row: text input + optional Homey Audio Gallery picker. */
    createAudioUrlFieldRow: function (value, onCommit) {
        const row = document.createElement('div');
        row.className = 'flex gap-1 w-full';
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'control-input w-full text-xs';
        inp.placeholder = '/audio/file.mp3';
        inp.value = value != null ? String(value) : '';
        const commit = () => {
            if (typeof onCommit === 'function') onCommit(inp.value);
        };
        inp.addEventListener('change', commit);
        inp.addEventListener('blur', commit);
        if (Editor.isAudioGalleryAvailable()) {
            inp.classList.add('rounded-r-none');
            row.appendChild(inp);
            row.appendChild(Editor.createAudioGalleryPickerButton(inp));
        } else {
            row.appendChild(inp);
        }
        return { row, input: inp };
    },

    ensureHex: function (colorStr) {
        if (!colorStr) return "#000000";
        if (typeof colorStr !== 'string') return "#000000";

        colorStr = colorStr.trim();
        if (colorStr.startsWith('#')) {
            if (colorStr.length === 4) {
                return "#" + colorStr[1] + colorStr[1] + colorStr[2] + colorStr[2] + colorStr[3] + colorStr[3];
            }
            return colorStr.substring(0, 7);
        }

        if (colorStr.startsWith('rgb')) {
            const rgb = colorStr.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                const r = parseInt(rgb[0]).toString(16).padStart(2, '0');
                const g = parseInt(rgb[1]).toString(16).padStart(2, '0');
                const b = parseInt(rgb[2]).toString(16).padStart(2, '0');
                return `#${r}${g}${b}`;
            }
        }

        return "#000000";
    },

    ensureBool: function (val) {
        if (val === true || val === 'true' || val === 1 || val === '1') return true;
        return false;
    },

    /** Hide the reset glyph until the field leaves its default (keeps the hover chip empty-free). */
    _setResetIdle: function (resetIcon, idle) {
        if (!resetIcon) return;
        resetIcon.classList.toggle('is-idle', !!idle);
    },

    /** Mount bind/reset chip only when it has at least one control. */
    _appendHeaderActions: function (headerRow, actionsEl) {
        if (!headerRow || !actionsEl || !actionsEl.childElementCount) return;
        headerRow.appendChild(actionsEl);
    },

    /** Accent outline + reset chrome when a field leaves its default value. */
    _markFieldAsCustom: function (wrapperEl, resetIcon) {
        if (wrapperEl) wrapperEl.classList.add('field-is-set');
        this._setResetIdle(resetIcon, false);
    },

    /**
     * Wrap an inspector control shell in `.field-control` so `.field-is-set` can target
     * a stable selector (bound fields skip the ring via not adding `.field-is-set`).
     */
    _ensureFieldControl: function (el) {
        if (!el) return null;
        if (el.classList && el.classList.contains('field-control')) return el;
        const parent = el.parentNode;
        const shell = document.createElement('div');
        shell.className = 'field-control';
        if (parent) parent.replaceChild(shell, el);
        shell.appendChild(el);
        return shell;
    },

    /** Shallow merge of master + widget factory defaults + instance overrides (no live binding overlay). */
    _buildMergedStaticValues: function (widget) {
        let factory = {};
        if (widget && typeof widget.getDefaultOverrides === 'function') {
            try {
                factory = widget.getDefaultOverrides() || {};
            } catch (eFac) {
                factory = {};
            }
        }
        const ov = widget && widget.overrides ? widget.overrides : {};
        let c;
        if (typeof BaseWidget !== 'undefined' && typeof BaseWidget.mergeStaticConfigLayers === 'function') {
            c = BaseWidget.mergeStaticConfigLayers(MASTER_SETTINGS, factory, ov);
        } else {
            c = {};
            let k;
            for (k in MASTER_SETTINGS) {
                if (Object.prototype.hasOwnProperty.call(MASTER_SETTINGS, k)) {
                    c[k] = MASTER_SETTINGS[k];
                }
            }
            Object.keys(factory).forEach(function (key) {
                if (factory[key] !== undefined && factory[key] !== null) c[key] = factory[key];
            });
            Object.keys(ov).forEach(function (key) {
                if (ov[key] !== undefined && ov[key] !== null) c[key] = ov[key];
            });
        }
        if (widget) {
            Editor._flattenNestedOverridesIntoMerged(c, c, widget, false);
        }
        return c;
    },

    /**
     * Writes nested typography / icons / iconColorOverrides from widget overrides onto flat keys in `c`.
     * When `applyLiveBindingOverlay` is true, bound nested topics overwrite flat keys (runtime preview).
     * Binding fallback resolution passes false so Default Value stays the stored static fallback.
     */
    _flattenNestedOverridesIntoMerged: function (c, o, widget, applyLiveBindingOverlay) {
        if (!widget || !o || typeof o !== 'object') return;
        const ctor = widget.constructor;
        if (o.typography && typeof o.typography === 'object' && Object.keys(o.typography).length > 0
                && typeof ctor.applyTypographyNestedToConfig === 'function') {
            let typCopy;
            try {
                typCopy = JSON.parse(JSON.stringify(o.typography));
            } catch (e) {
                typCopy = { ...o.typography };
            }
            const bag = { ...c, typography: typCopy };
            ctor.applyTypographyNestedToConfig(bag);
            Object.keys(bag).forEach(function (key) {
                if (key === 'typography') return;
                if (bag[key] !== undefined) c[key] = bag[key];
            });
        }
        if (o.icons && typeof o.icons === 'object' && Object.keys(o.icons).length > 0
                && typeof ctor.applyIconsNestedToConfig === 'function') {
            let iconsCopy;
            try {
                iconsCopy = JSON.parse(JSON.stringify(o.icons));
            } catch (e) {
                iconsCopy = { ...o.icons };
            }
            const bag = { ...c, icons: iconsCopy };
            ctor.applyIconsNestedToConfig(bag);
            Object.keys(bag).forEach(function (key) {
                if (key === 'icons') return;
                if (bag[key] !== undefined) c[key] = bag[key];
            });
        }
        if (o.container && typeof o.container === 'object' && Object.keys(o.container).length > 0
                && typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.applyContainerNestedToConfig === 'function') {
            let containerCopy;
            try {
                containerCopy = JSON.parse(JSON.stringify(o.container));
            } catch (eBox) {
                containerCopy = { ...o.container };
            }
            const bag = { ...c, container: containerCopy };
            SaveFormatV2.applyContainerNestedToConfig(bag);
            Object.keys(bag).forEach(function (key) {
                if (key === 'container') return;
                if (bag[key] !== undefined) c[key] = bag[key];
            });
        }
        // Responsive Layout & Dimensions: flatten `overrides.layout.responsive` onto
        // the runtime flat keys the editor schema reads (responsiveOrder/ColumnSpan/
        // CellHeight/PreferredColumn). Source of truth stays the nested blob; this
        // only projects it for editor display and binding-fallback resolution.
        if (o.layout && o.layout.responsive && typeof o.layout.responsive === 'object') {
            const resp = o.layout.responsive;
            if (resp.order !== undefined && resp.order !== null) c.responsiveOrder = resp.order;
            if (resp.columnSpan !== undefined && resp.columnSpan !== null) c.responsiveColumnSpan = resp.columnSpan;
            if (resp.cellHeight !== undefined && resp.cellHeight !== null) c.responsiveCellHeight = resp.cellHeight;
            else if (resp.height !== undefined && resp.height !== null) c.responsiveCellHeight = resp.height;
            if (resp.preferredColumn !== undefined && resp.preferredColumn !== null) c.responsivePreferredColumn = resp.preferredColumn;
            if (resp.padding !== undefined && resp.padding !== null) c.responsivePadding = resp.padding;
            if (resp.minHeight !== undefined && resp.minHeight !== null) c.responsiveMinHeight = resp.minHeight;
            if (resp.scaleMode !== undefined && resp.scaleMode !== null) c.responsiveScaleMode = resp.scaleMode;
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.resolveResponsiveHeightMode === 'function') {
                c.responsiveCellHeightMode = Dashboard.resolveResponsiveHeightMode(resp);
            } else {
                const rawMode = (resp.cellHeightMode !== undefined && resp.cellHeightMode !== null && resp.cellHeightMode !== '')
                    ? resp.cellHeightMode : resp.heightMode;
                if (rawMode === 'fill' || rawMode === 'fixed' || rawMode === 'auto') {
                    c.responsiveCellHeightMode = rawMode;
                } else {
                    const h = Number(resp.cellHeight != null ? resp.cellHeight : resp.height);
                    c.responsiveCellHeightMode = (Number.isFinite(h) && h > 0) ? 'fixed' : 'auto';
                }
            }
        }
        if (applyLiveBindingOverlay === true && typeof SaveFormatV2 !== 'undefined' && SaveFormatV2.CONTAINER_FLAT_TO_PATH
                && widget.bindings && typeof widget.bindings === 'object') {
            const cmap = SaveFormatV2.CONTAINER_FLAT_TO_PATH;
            Object.keys(cmap).forEach(function (flat) {
                const path = ['container'].concat(cmap[flat]);
                let topic = (typeof BindingsTree !== 'undefined' && typeof BindingsTree.getAtPath === 'function')
                    ? BindingsTree.getAtPath(widget.bindings, path)
                    : undefined;
                if (typeof topic !== 'string' || topic === '') {
                    topic = widget.bindings[flat];
                }
                if (typeof topic !== 'string' || topic === '') return;
                if (typeof Dashboard !== 'undefined' && Dashboard.liveData
                        && Dashboard.liveData[topic] !== undefined) {
                    let value = Dashboard.liveData[topic];
                    if (typeof widget._finalizeBindingValue === 'function') {
                        value = widget._finalizeBindingValue(flat, value);
                    }
                    c[flat] = value;
                }
            });
        }
        if (typeof ctor.getNestedBindingOverlaySpec !== 'function' || typeof BindingsTree === 'undefined'
                || typeof BindingsTree.getAtPath !== 'function') {
            return;
        }
        if (applyLiveBindingOverlay !== true) return;
        const spec = ctor.getNestedBindingOverlaySpec();
        if (!Array.isArray(spec)) return;
        const bindings = widget.bindings && typeof widget.bindings === 'object' ? widget.bindings : null;
        if (!bindings) return;
        spec.forEach(function (entry) {
            const path = entry.path;
            if (!path || path.length < 2) return;
            const root = path[0];
            if (root !== 'icons' && root !== 'iconColorOverrides' && root !== 'typography') return;
            let topic = BindingsTree.getAtPath(bindings, path);
            if (typeof topic !== 'string' || topic === '') {
                topic = bindings[entry.configKey];
            }
            if (typeof topic !== 'string' || topic === '') return;
            if (typeof Dashboard !== 'undefined' && Dashboard.liveData
                    && Dashboard.liveData[topic] !== undefined) {
                let value = Dashboard.liveData[topic];
                if (typeof widget._finalizeBindingValue === 'function') {
                    value = widget._finalizeBindingValue(entry.configKey, value);
                }
                c[entry.configKey] = value;
            }
        });
    },

    /** Effective static value for light row synthetic binding field keys `lightItemBind_<idx>_<prop>`. */
    _getLightItemBindFallbackFromMerged: function (values, fieldKey) {
        const m = typeof fieldKey === 'string' ? fieldKey.match(/^lightItemBind_(\d+)_(.+)$/) : null;
        if (!m) return undefined;
        const idx = parseInt(m[1], 10);
        const p = m[2];
        if (p === 'state') {
            const sk = `item_${idx}_state`;
            if (Object.prototype.hasOwnProperty.call(values, sk)) return values[sk];
        }
        const lights = values.lightsData;
        if (!Array.isArray(lights) || !lights[idx]) return undefined;
        const light = lights[idx];
        const switchProps = new Set(['actionType', 'onPayload', 'offPayload', 'pageTo', 'urlTo', 'urlNewTab']);
        if (switchProps.has(p)) {
            const sa = light.switchAction || {};
            return sa[p];
        }
        return light[p];
    },

    /**
     * Schema-like field for Binding Options popup on light_list row bindable props.
     */
    lightItemBindSyntheticField: function (lIdx, prop, labelText) {
        const key = `lightItemBind_${lIdx}_${prop}`;
        if (prop === 'state' || prop === 'urlNewTab' || prop === 'colorizeOn') {
            return { key, type: 'checkbox', label: labelText };
        }
        if (prop === 'outputMode') {
            return {
                key, type: 'select', label: labelText,
                options: [
                    { value: 'light', text: 'Light' },
                    { value: 'switch', text: 'Switch' }
                ]
            };
        }
        if (prop === 'actionType') {
            return {
                key, type: 'select', label: labelText,
                options: [
                    { value: 'topic', text: 'Send Topic' },
                    { value: 'page', text: 'Go to Page' },
                    { value: 'url', text: 'Open URL' }
                ]
            };
        }
        if (prop === 'pageTo') {
            return { key, type: 'number', label: labelText, min: 1 };
        }
        if (prop === 'iconSourceOn') {
            return {
                key, type: 'select', label: labelText,
                options: [
                    { value: 'phosphor', text: 'Phosphor icon' },
                    { value: 'custom', text: 'Custom image' }
                ]
            };
        }
        if (prop === 'iconOn') {
            return { key, type: 'icon_input', label: labelText };
        }
        return { key, type: 'text', label: labelText };
    },

    /** Effective static value for menu row synthetic binding field keys `menuItemBind_<idx>_<prop>`. */
    _getMenuItemBindFallbackFromMerged: function (values, fieldKey) {
        const m = typeof fieldKey === 'string' ? fieldKey.match(/^menuItemBind_(\d+)_(.+)$/) : null;
        if (!m) return undefined;
        const idx = parseInt(m[1], 10);
        const p = m[2];
        if (p === 'state') {
            const sk = `item_${idx}_state`;
            if (Object.prototype.hasOwnProperty.call(values, sk)) return values[sk];
        }
        const items = values.menuItems;
        if (!Array.isArray(items) || !items[idx]) return undefined;
        return items[idx][p];
    },

    /**
     * Schema-like field for Binding Options popup on menu_list row bindable props.
     */
    menuItemBindSyntheticField: function (lIdx, prop, labelText) {
        const key = `menuItemBind_${lIdx}_${prop}`;
        const checkboxProps = new Set([
            'state', 'colorizeOn', 'colorizeOff',
            'iconColOnOverrideEn', 'iconColOffOverrideEn', 'sendOffOnGroupDeselect'
        ]);
        if (checkboxProps.has(prop)) {
            return { key, type: 'checkbox', label: labelText };
        }
        if (prop === 'mode') {
            return {
                key, type: 'select', label: labelText,
                options: [
                    { value: 'push', text: 'Push Button' },
                    { value: 'toggle', text: 'Toggle Switch' },
                    { value: 'separator', text: 'Separator' }
                ]
            };
        }
        if (prop === 'actionType') {
            return {
                key, type: 'select', label: labelText,
                options: [
                    { value: 'topic', text: 'Send Topic' },
                    { value: 'page', text: 'Go to Page' },
                    { value: 'url', text: 'Open URL' }
                ]
            };
        }
        if (prop === 'pageTo') {
            return { key, type: 'number', label: labelText, min: 1 };
        }
        if (prop === 'iconSourceOn' || prop === 'iconSourceOff') {
            return {
                key, type: 'select', label: labelText,
                options: [
                    { value: 'phosphor', text: 'Phosphor icon' },
                    { value: 'custom', text: 'Custom image' }
                ]
            };
        }
        if (prop === 'iconOn' || prop === 'iconOff') {
            return { key, type: 'icon_input', label: labelText };
        }
        if (prop === 'iconColOnOverride' || prop === 'iconColOffOverride') {
            return { key, type: 'color', label: labelText };
        }
        return { key, type: 'text', label: labelText };
    },

    _hasInstanceFieldOverride: function (f, overrides, isGlobal) {
        if (!f) return false;
        if (isGlobal) return this.isGlobalMasterFieldSet(f, overrides);
        if (!overrides || typeof overrides !== 'object') return false;
        if (f.typographyNested) {
            const tn = f.typographyNested;
            const block = overrides.typography && overrides.typography[tn.role];
            return !!(block && Object.prototype.hasOwnProperty.call(block, tn.prop));
        }
        if (f.iconsNested) {
            const icn = f.iconsNested;
            const rootObj = overrides[icn.root];
            const block = rootObj && rootObj[icn.slot];
            return !!(block && Object.prototype.hasOwnProperty.call(block, icn.prop));
        }
        if (f.iconColorOverridesNested) {
            const io = f.iconColorOverridesNested;
            const block = overrides.iconColorOverrides && overrides.iconColorOverrides[io.slot];
            return !!(block && Object.prototype.hasOwnProperty.call(block, io.prop));
        }
        if (f.layoutNested) {
            const ln = f.layoutNested;
            const block = overrides.layout && overrides.layout.responsive;
            let isSet = !!(block && Object.prototype.hasOwnProperty.call(block, ln.prop));
            if (!isSet && ln.prop === 'cellHeightMode' && block
                    && Object.prototype.hasOwnProperty.call(block, 'heightMode')) {
                isSet = true;
            }
            if (!isSet && ln.prop === 'cellHeight' && block
                    && Object.prototype.hasOwnProperty.call(block, 'height')) {
                isSet = true;
            }
            return isSet;
        }
        if (f.containerNested && f.containerNested.path && typeof SaveFormatV2 !== 'undefined'
                && typeof SaveFormatV2.hasAtPath === 'function') {
            return SaveFormatV2.hasAtPath(overrides.container, f.containerNested.path);
        }
        if (f.objectNested && f.objectNested.root) {
            const on = f.objectNested;
            const block = overrides[on.root];
            return !!(block && Object.prototype.hasOwnProperty.call(block, on.prop));
        }
        if (f.key === 'editorModeOverride') {
            return overrides.editorModeOverride === 'force_advanced'
                || overrides.editorModeOverride === 'force_basic';
        }
        if (!f.key) return false;
        return Object.prototype.hasOwnProperty.call(overrides, f.key)
            && overrides[f.key] !== null
            && overrides[f.key] !== undefined;
    },

    /** Keep `currentValuesSnapshot[root]` aligned with the blob just written, so visibleWhen reads the live nested value. */
    _syncObjectNestedSnapshot: function (root, blob) {
        if (!this.currentValuesSnapshot || !root) return;
        if (!blob || typeof blob !== 'object') {
            delete this.currentValuesSnapshot[root];
            return;
        }
        let copy;
        try {
            copy = JSON.parse(JSON.stringify(blob));
        } catch (eCopy) {
            copy = Object.assign({}, blob);
        }
        this.currentValuesSnapshot[root] = copy;
    },

    /**
     * After a schema reset has already been written: refresh the control in place.
     * Composite fields with no registered input still rebuild the inspector.
     */
    _finishInspectorFieldReset: function (f, fieldWrap, resetIcon, freshOverrides) {
        const widget = (this.currentId && typeof Dashboard !== 'undefined' && Dashboard.widgets)
            ? Dashboard.widgets[this.currentId]
            : null;
        const overrides = (widget && widget.overrides) ? widget.overrides : (freshOverrides || {});
        if (f && f.objectNested && f.objectNested.root) {
            this._syncObjectNestedSnapshot(f.objectNested.root, overrides[f.objectNested.root]);
        }
        const merged = widget ? this._buildMergedStaticValues(widget) : {};
        const fallbackVal = this._resolveInspectorFieldRawValue(f, merged, overrides, false, merged);
        this._setSnapshotValue(f && f.key, fallbackVal);
        const reg = (this.fieldRegistry && f && f.key) ? this.fieldRegistry[f.key] : null;
        const canSync = !!(reg && (reg.inputEl || (typeof reg.colorPickerSync === 'function')));
        if (!canSync) {
            this._handleFieldDependencyChange(f.key, 'change', true);
            return;
        }
        if (fieldWrap) fieldWrap.classList.remove('field-is-set');
        this._setResetIdle(resetIcon, true);
        if (reg.inputEl && f.type !== 'color') {
            if (reg.inputEl.type === 'checkbox') {
                reg.inputEl.checked = this.ensureBool(fallbackVal);
                if (typeof reg.inputEl._syncCheckboxRowChrome === 'function') reg.inputEl._syncCheckboxRowChrome();
            } else {
                reg.inputEl.value = (fallbackVal !== undefined && fallbackVal !== null) ? fallbackVal : '';
                if (typeof reg.inputEl._syncIconInputBtn === 'function') reg.inputEl._syncIconInputBtn();
            }
        }
        if (typeof reg.colorPickerSync === 'function') reg.colorPickerSync();
        if (widget && f) {
            const ctorW = Object.getPrototypeOf(widget).constructor;
            if (f.iconsNested) {
                this._syncFollowerIconSlotFromLeaderImmediate(widget, f.iconsNested, ctorW);
                const previews = Editor._iconStylePreviewCallbacks;
                if (previews) {
                    Object.keys(previews).forEach(function (previewKey) {
                        if (typeof previews[previewKey] === 'function') previews[previewKey]();
                    });
                }
            }
            if (f.typographyNested) {
                this._syncFollowerTypographyFromLeaderImmediate(widget, f.typographyNested, ctorW);
            }
        }
        this._handleFieldDependencyChange(f.key, 'change', false);
    },

    /**
     * Finite number for an inspector field, or undefined when the bag holds a non-number
     * (empty string, null, or a colliding master key such as a background size word).
     */
    _finiteInspectorNumber: function (value) {
        if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
        if (typeof value === 'string' && String(value).trim() !== '') {
            const n = parseFloat(value);
            if (Number.isFinite(n)) return n;
        }
        return undefined;
    },

    /** True when a live topic is bound to this field, so widget.config may already be the payload. */
    _fieldHasLiveBinding: function (widget, f) {
        const b = widget && widget.bindings;
        if (!b || !f || !f.key) return false;
        if (typeof b[f.key] === 'string' && b[f.key] !== '') return true;
        if (typeof BindingsTree === 'undefined' || typeof BindingsTree.getAtPath !== 'function') return false;
        let path = null;
        if (f.typographyNested && f.typographyNested.root && f.typographyNested.role) {
            path = [f.typographyNested.root, f.typographyNested.role, f.typographyNested.prop];
        } else if (f.iconsNested && f.iconsNested.root && f.iconsNested.slot) {
            path = [f.iconsNested.root, f.iconsNested.slot, f.iconsNested.prop];
        } else if (f.iconColorOverridesNested && f.iconColorOverridesNested.slot) {
            path = ['iconColorOverrides', f.iconColorOverridesNested.slot, f.iconColorOverridesNested.prop];
        } else if (f.containerNested && f.containerNested.path) {
            path = ['container'].concat(f.containerNested.path);
        } else if (f.layoutNested && f.layoutNested.prop) {
            path = ['layout', 'responsive', f.layoutNested.prop];
        } else if (f.objectNested && f.objectNested.root) {
            path = [f.objectNested.root, f.objectNested.prop];
        }
        if (!path) return false;
        const topic = BindingsTree.getAtPath(b, path);
        return typeof topic === 'string' && topic !== '';
    },

    /**
     * One `widget.config` per selection epoch. Widgets already cache the flatten;
     * this only keeps that object so each empty inspector field does not ask again.
     * Not used on the render loop.
     */
    _cachedWidgetConfigForInspector: function (widget) {
        if (!widget || this._runtimeGapResolving) return null;
        const wEpoch = widget._widgetConfigEpoch || 0;
        const gEpoch = (typeof Dashboard !== 'undefined' && Dashboard._globalConfigEpoch) || 0;
        const hit = this._runtimeGapCache;
        if (hit && hit.widget === widget && hit.wEpoch === wEpoch && hit.gEpoch === gEpoch) {
            return hit.bag;
        }
        this._runtimeGapResolving = true;
        let bag = null;
        try {
            bag = widget.config || null;
        } catch (eGap) {
            bag = null;
        }
        this._runtimeGapResolving = false;
        this._runtimeGapCache = { widget: widget, wEpoch: wEpoch, gEpoch: gEpoch, bag: bag };
        return bag;
    },

    /**
     * Concrete value the widget already uses when the override is missing
     * (Icon Size 80, Blink Speed 1, typography Offset 0, and the same pattern on other widgets).
     * Skips live-bound keys so a topic payload is not shown as the stored default.
     */
    _runtimeGapValueForField: function (f) {
        if (!f || !f.key || !this.currentId || this.currentId === 'GLOBAL_SETTINGS' || this.currentId === 'MULTIPLE') {
            return undefined;
        }
        if (typeof Dashboard === 'undefined' || !Dashboard.widgets) return undefined;
        const widget = Dashboard.widgets[this.currentId];
        if (!widget || this._fieldHasLiveBinding(widget, f)) return undefined;
        const gap = this._cachedWidgetConfigForInspector(widget);
        if (!gap || !Object.prototype.hasOwnProperty.call(gap, f.key)) return undefined;
        const gv = gap[f.key];
        if (gv === undefined || gv === null || gv === '') return undefined;
        if (f.type === 'number') return this._finiteInspectorNumber(gv);
        if (f.type === 'checkbox') return (typeof gv === 'boolean') ? gv : undefined;
        if (f.type === 'select' || f.type === 'icon_input') {
            if (typeof gv === 'string' || typeof gv === 'number' || typeof gv === 'boolean') return gv;
        }
        return undefined;
    },

    /**
     * Static value for inspector inputs and binding fallbacks.
     * Local override, then defaultKey / factory / schema default.
     * If that chain is still empty, use the number, checkbox, or select the widget
     * config already resolved for this key. One cached config read per selection.
     */
    _resolveInspectorFieldRawValue: function (f, values, overrides, isGlobal, mergedStatic) {
        if (!f) return undefined;

        const bag = (!isGlobal && mergedStatic) ? mergedStatic : values;
        let rawValue;

        if (isGlobal && f.key === 'quickToolbarVisibility') {
            const qt = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.quickToolbar : null;
            if (typeof QuickToolbar !== 'undefined' && QuickToolbar.normalizeVisibility) {
                return QuickToolbar.normalizeVisibility(qt);
            }
            if (qt && qt.visibility) return qt.visibility;
            return (qt && qt.enabled === false) ? 'never' : 'auto';
        }
        if (!isGlobal && f.key && f.key.indexOf('graphSeries_') === 0) {
            rawValue = this._getGraphSeriesBindFallbackFromMerged(bag, f.key);
        } else if (!isGlobal && f.key && f.key.indexOf('menuItemBind_') === 0) {
            rawValue = this._getMenuItemBindFallbackFromMerged(bag, f.key);
        } else if (!isGlobal && f.key && f.key.indexOf('lightItemBind_') === 0) {
            rawValue = this._getLightItemBindFallbackFromMerged(bag, f.key);
        } else if (!isGlobal && f.typographyNested) {
            const tn = f.typographyNested;
            const block = overrides && overrides.typography && overrides.typography[tn.role];
            if (block && Object.prototype.hasOwnProperty.call(block, tn.prop)
                    && block[tn.prop] !== null && block[tn.prop] !== undefined) {
                rawValue = block[tn.prop];
            } else {
                rawValue = bag[f.key];
                if ((rawValue === undefined || rawValue === null) && f.defaultKey) {
                    if (bag[f.defaultKey] !== undefined) {
                        rawValue = bag[f.defaultKey];
                    } else if (typeof DataConfig !== 'undefined' && DataConfig[f.defaultKey] !== undefined) {
                        rawValue = DataConfig[f.defaultKey];
                    }
                }
            }
        } else if (!isGlobal && f.iconsNested) {
            const icn = f.iconsNested;
            const rootObj = overrides && icn.root ? overrides[icn.root] : null;
            const block = rootObj && rootObj[icn.slot];
            if (block && Object.prototype.hasOwnProperty.call(block, icn.prop)
                    && block[icn.prop] !== null && block[icn.prop] !== undefined) {
                rawValue = block[icn.prop];
            } else {
                rawValue = bag[f.key];
                if ((rawValue === undefined || rawValue === null) && f.defaultKey) {
                    if (bag[f.defaultKey] !== undefined) {
                        rawValue = bag[f.defaultKey];
                    } else if (typeof DataConfig !== 'undefined' && DataConfig[f.defaultKey] !== undefined) {
                        rawValue = DataConfig[f.defaultKey];
                    }
                }
            }
        } else if (!isGlobal && f.iconColorOverridesNested) {
            const io = f.iconColorOverridesNested;
            const block = overrides && overrides.iconColorOverrides && overrides.iconColorOverrides[io.slot];
            if (block && Object.prototype.hasOwnProperty.call(block, io.prop)
                    && block[io.prop] !== null && block[io.prop] !== undefined) {
                rawValue = block[io.prop];
            } else {
                rawValue = bag[f.key];
                if ((rawValue === undefined || rawValue === null) && f.defaultKey) {
                    if (bag[f.defaultKey] !== undefined) {
                        rawValue = bag[f.defaultKey];
                    } else if (typeof DataConfig !== 'undefined' && DataConfig[f.defaultKey] !== undefined) {
                        rawValue = DataConfig[f.defaultKey];
                    }
                }
            }
        } else if (!isGlobal && f.layoutNested) {
            const ln = f.layoutNested;
            const block = overrides && overrides.layout && overrides.layout.responsive;
            if (ln.prop === 'cellHeightMode') {
                rawValue = (typeof Dashboard !== 'undefined' && typeof Dashboard.resolveResponsiveHeightMode === 'function')
                    ? Dashboard.resolveResponsiveHeightMode(block || {})
                    : 'auto';
            } else if (ln.prop === 'cellHeight') {
                if (typeof Dashboard !== 'undefined' && typeof Dashboard.responsiveCellHeightPx === 'function') {
                    const n = Dashboard.responsiveCellHeightPx(block || {});
                    rawValue = Number.isFinite(n) ? n : bag[f.key];
                } else if (block && block.cellHeight !== undefined && block.cellHeight !== null) {
                    rawValue = block.cellHeight;
                } else if (block && block.height !== undefined && block.height !== null) {
                    rawValue = block.height;
                } else {
                    rawValue = bag[f.key];
                }
            } else if (ln.prop === 'minHeight') {
                if (block && block.minHeight !== undefined && block.minHeight !== null && block.minHeight !== '') {
                    rawValue = block.minHeight;
                } else {
                    rawValue = this._lookupDefaultKeyValue(bag, f.defaultKey);
                }
            } else if (block && Object.prototype.hasOwnProperty.call(block, ln.prop)
                    && block[ln.prop] !== null && block[ln.prop] !== undefined) {
                rawValue = block[ln.prop];
            } else {
                rawValue = bag[f.key];
                if ((rawValue === undefined || rawValue === null) && f.defaultKey) {
                    if (bag[f.defaultKey] !== undefined) {
                        rawValue = bag[f.defaultKey];
                    } else if (typeof DataConfig !== 'undefined' && DataConfig[f.defaultKey] !== undefined) {
                        rawValue = DataConfig[f.defaultKey];
                    }
                }
            }
        } else if (!isGlobal && f.containerNested && f.containerNested.path) {
            const cpath = f.containerNested.path;
            if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.hasAtPath === 'function'
                    && SaveFormatV2.hasAtPath(overrides && overrides.container, cpath)) {
                rawValue = SaveFormatV2.getAtPath(overrides.container, cpath);
            } else {
                rawValue = bag[f.key];
                if ((rawValue === undefined || rawValue === null) && f.defaultKey) {
                    if (bag[f.defaultKey] !== undefined) {
                        rawValue = bag[f.defaultKey];
                    } else if (typeof DataConfig !== 'undefined' && DataConfig[f.defaultKey] !== undefined) {
                        rawValue = DataConfig[f.defaultKey];
                    }
                }
            }
        } else if (!isGlobal && f.objectNested) {
            const on = f.objectNested;
            const block = overrides && overrides[on.root];
            if (block && Object.prototype.hasOwnProperty.call(block, on.prop)
                    && block[on.prop] !== null && block[on.prop] !== undefined) {
                rawValue = block[on.prop];
            } else {
                rawValue = bag[f.key];
                if ((rawValue === undefined || rawValue === null) && f.defaultKey) {
                    if (bag[f.defaultKey] !== undefined) {
                        rawValue = bag[f.defaultKey];
                    } else if (typeof DataConfig !== 'undefined' && DataConfig[f.defaultKey] !== undefined) {
                        rawValue = DataConfig[f.defaultKey];
                    }
                }
            }
        } else if (!isGlobal && this._hasInstanceFieldOverride(f, overrides || {})) {
            rawValue = overrides[f.key];
        } else if (!isGlobal && f.defaultKey) {
            rawValue = bag[f.key];
            if (rawValue === undefined || rawValue === null) {
                if (bag[f.defaultKey] !== undefined) {
                    rawValue = bag[f.defaultKey];
                } else if (typeof DataConfig !== 'undefined' && DataConfig[f.defaultKey] !== undefined) {
                    rawValue = DataConfig[f.defaultKey];
                }
            }
        } else {
            rawValue = values[f.key];
            if ((rawValue === undefined || rawValue === null) && f.defaultKey) {
                if (bag[f.defaultKey] !== undefined) {
                    rawValue = bag[f.defaultKey];
                } else if (typeof DataConfig !== 'undefined' && DataConfig[f.defaultKey] !== undefined) {
                    rawValue = DataConfig[f.defaultKey];
                }
            }
        }

        if (f.themeColorToken && typeof MasterLayout !== 'undefined') {
            const tc = bag.themeColors || MASTER_SETTINGS.themeColors || {};
            rawValue = tc[f.themeColorToken];
            if (rawValue === undefined || rawValue === null || rawValue === '') {
                rawValue = MasterLayout.defaultThemeColors()[f.themeColorToken];
            }
        }
        if ((rawValue === undefined || rawValue === null) && f.defaultKeyFallback) {
            if (bag[f.defaultKeyFallback] !== undefined) {
                rawValue = bag[f.defaultKeyFallback];
            } else if (typeof DataConfig !== 'undefined' && DataConfig[f.defaultKeyFallback] !== undefined) {
                rawValue = DataConfig[f.defaultKeyFallback];
            }
        }
        if ((rawValue === undefined || rawValue === null) && !isGlobal && this.currentId
                && typeof Dashboard !== 'undefined' && Dashboard.widgets && Dashboard.widgets[this.currentId]) {
            const wdg = Dashboard.widgets[this.currentId];
            if (wdg && typeof wdg.getDefaultOverrides === 'function') {
                try {
                    const fd = wdg.getDefaultOverrides() || {};
                    if (Object.prototype.hasOwnProperty.call(fd, f.key)
                            && fd[f.key] !== null && fd[f.key] !== undefined) {
                        rawValue = fd[f.key];
                    }
                } catch (eFd) { /* ignore */ }
            }
        }
        if (f.key === 'widgetLabelMode' && (rawValue === undefined || rawValue === null)) {
            if (typeof bag.showWidgetLabels === 'boolean') {
                rawValue = bag.showWidgetLabels ? 'always' : 'hide';
            } else {
                rawValue = 'hover';
            }
        }
        if ((rawValue === undefined || rawValue === null) && Object.prototype.hasOwnProperty.call(f, 'default')) {
            rawValue = f.default;
        }
        if (!isGlobal && (f.type === 'number' || f.type === 'checkbox' || f.type === 'select' || f.type === 'icon_input')) {
            let needsRuntimeGap = rawValue === undefined || rawValue === null;
            if (!needsRuntimeGap && f.type === 'number'
                    && (rawValue === '' || this._finiteInspectorNumber(rawValue) === undefined)) {
                needsRuntimeGap = true;
            }
            if (!needsRuntimeGap && f.type === 'icon_input' && rawValue === '') {
                needsRuntimeGap = true;
            }
            if (needsRuntimeGap) {
                const filled = this._runtimeGapValueForField(f);
                if (filled !== undefined) rawValue = filled;
            }
        }
        if (typeof f.displayValue === 'function') {
            const shown = f.displayValue(rawValue, values, isGlobal);
            if (shown !== undefined && shown !== null) rawValue = shown;
        }
        return rawValue;
    },

    /** Effective static value used when a bound topic has no live payload (same merge order as resolveValue without live data). */
    getBindingFallbackRaw: function (f, isGlobal) {
        let rawValue;
        if (isGlobal) {
            rawValue = this._resolveInspectorFieldRawValue(f, MASTER_SETTINGS, MASTER_SETTINGS, true, null);
        } else {
            const w = Dashboard.widgets[this.currentId];
            if (!w) return undefined;
            const merged = this._buildMergedStaticValues(w);
            rawValue = this._resolveInspectorFieldRawValue(f, merged, w.overrides || {}, false, merged);
        }
        if (rawValue === undefined || rawValue === null) {
            const schemaDefault = this._getGlobalFactoryDefault(f);
            if (schemaDefault !== undefined) rawValue = schemaDefault;
        }
        if (!isGlobal && f && f.key === 'responsiveOrder' && (rawValue === undefined || rawValue === null)
                && this.currentId && typeof Dashboard !== 'undefined'
                && typeof Dashboard.resolveResponsiveWidgetOrder === 'function') {
            rawValue = Dashboard.resolveResponsiveWidgetOrder(this.currentId);
        }
        return rawValue;
    },

    /** Hex or CSS string for Binding Options Default Value swatch (resolves @theme refs for display). */
    resolveBindingDefaultDisplayRaw: function (f, rawValue) {
        if (rawValue === undefined || rawValue === null || rawValue === '') return '';
        let raw = String(rawValue);
        if (f && f.themeColorToken) {
            return raw;
        }
        if (f && f.editThemeLiteralWhenRefMatchesToken && typeof MasterLayout !== 'undefined'
                && typeof MasterLayout.isThemeTokenReference === 'function'
                && MasterLayout.isThemeTokenReference(raw)) {
            const tok = MasterLayout.parseThemeTokenReference(raw);
            if (tok) {
                const tc = MASTER_SETTINGS.themeColors || MasterLayout.defaultThemeColors();
                if (tc[tok] !== undefined && tc[tok] !== null && tc[tok] !== '') {
                    return String(tc[tok]);
                }
                const def = MasterLayout.defaultThemeColors()[tok];
                if (def !== undefined && def !== null) return String(def);
            }
        }
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.resolveThemeColorValue === 'function') {
            const resolved = Dashboard.resolveThemeColorValue(raw);
            if (resolved !== undefined && resolved !== null && resolved !== '') {
                return String(resolved);
            }
        }
        return raw;
    },

    hasBindingMapActiveForField: function (f, overrides, isGlobal) {
        let mt;
        let mf;
        if (isGlobal) {
            mt = MASTER_SETTINGS[f.key + '_bind_mapTrue'];
            mf = MASTER_SETTINGS[f.key + '_bind_mapFalse'];
        } else {
            mt = overrides[f.key + '_bind_mapTrue'];
            if (mt === undefined || mt === null) {
                mt = MASTER_SETTINGS[f.key + '_bind_mapTrue'];
            }
            mf = overrides[f.key + '_bind_mapFalse'];
            if (mf === undefined || mf === null) {
                mf = MASTER_SETTINGS[f.key + '_bind_mapFalse'];
            }
        }
        const ts = (typeof mt === 'string') ? mt.trim() : '';
        const fs = (typeof mf === 'string') ? mf.trim() : '';
        if (ts !== '' || fs !== '') return true;

        let formula;
        if (isGlobal) {
            formula = MASTER_SETTINGS[f.key + '_bind_formula'];
        } else {
            formula = overrides[f.key + '_bind_formula'];
            if (formula === undefined || formula === null) {
                formula = MASTER_SETTINGS[f.key + '_bind_formula'];
            }
        }
        const fStr = (typeof formula === 'string') ? formula.trim() : '';
        if (fStr !== '') {
            if (typeof FormulaEngine !== 'undefined' && typeof FormulaEngine.isDefaultFormula === 'function') {
                if (!FormulaEngine.isDefaultFormula(fStr)) return true;
            } else if (fStr.toLowerCase() !== 'value') {
                return true;
            }
        }

        if (f && f.type === 'color') {
            let correctEn;
            if (isGlobal) {
                correctEn = MASTER_SETTINGS[f.key + '_correct_en'];
            } else {
                correctEn = overrides[f.key + '_correct_en'];
                if (correctEn === undefined || correctEn === null) {
                    correctEn = MASTER_SETTINGS[f.key + '_correct_en'];
                }
            }
            if (correctEn === true) return true;
        }

        return false;
    },

    getBindingOptionsIconPh: function (fieldDef, overrides, isGlobal) {
        return 'ph-faders';
    },

    hasBindingFormulaInvalidForField: function (f, overrides, isGlobal) {
        if (typeof FormulaEngine === 'undefined' || typeof FormulaEngine.validate !== 'function') return false;
        let formula;
        if (isGlobal) {
            formula = MASTER_SETTINGS[f.key + '_bind_formula'];
        } else {
            formula = overrides[f.key + '_bind_formula'];
            if (formula === undefined || formula === null) {
                formula = MASTER_SETTINGS[f.key + '_bind_formula'];
            }
        }
        const fStr = (typeof formula === 'string') ? formula.trim() : '';
        if (fStr === '') return false;
        if (typeof FormulaEngine.isDefaultFormula === 'function' && FormulaEngine.isDefaultFormula(fStr)) return false;
        const v = FormulaEngine.validate(fStr);
        return !v.ok;
    },

    positionEditorPopupNearAnchor: function (popup, anchorBtn, options) {
        popup.style.position = 'fixed';
        const pad = (options && options.pad !== undefined) ? options.pad : 10;
        const gap = (options && options.gap !== undefined) ? options.gap : 5;
        const rect = anchorBtn.getBoundingClientRect();
        const popupWidth = popup.offsetWidth || ((options && options.fallbackWidth) ? options.fallbackWidth : 260);
        const popupHeight = popup.offsetHeight || ((options && options.fallbackHeight) ? options.fallbackHeight : 200);

        let left = rect.left + (rect.width / 2) - (popupWidth / 2);
        left = Math.max(pad, Math.min(window.innerWidth - popupWidth - pad, left));

        let top = rect.bottom + gap;
        if (top + popupHeight > window.innerHeight - pad) {
            top = rect.top - popupHeight - gap;
        }
        const maxTop = Math.max(pad, window.innerHeight - popupHeight - pad);
        top = Math.max(pad, Math.min(maxTop, top));

        const nextTop = Math.round(top) + 'px';
        const nextLeft = Math.round(left) + 'px';
        if (popup.style.top !== nextTop) popup.style.top = nextTop;
        if (popup.style.left !== nextLeft) popup.style.left = nextLeft;
    },

    getBindingTransformMode: function (f, overrides, isGlobal) {
        let mode;
        if (isGlobal) {
            mode = MASTER_SETTINGS[f.key + '_bind_transformMode'];
        } else {
            mode = overrides[f.key + '_bind_transformMode'];
            if (mode === undefined || mode === null) {
                mode = MASTER_SETTINGS[f.key + '_bind_transformMode'];
            }
        }
        if (mode === 'numericFormula') return 'numericFormula';
        return 'stringMap';
    },

    appendBindingFormulaSection: function (parentEl, opts) {
        const self = this;
        const getFormula = opts.getFormula;
        const applyFormulaPayload = opts.applyFormulaPayload;
        const presets = opts.presets || [];
        const hintText = opts.hintText || '';
        let formulaFieldApi = null;

        if (opts.sectionTitle) {
            const formulaTitle = document.createElement('div');
            formulaTitle.className = 'control-label mb-1 mt-1';
            const helpLink = opts.sectionHelpLink || {
                linkText: 'Formula syntax reference',
                topic: 'Data Types & Formats',
                widgetSub: 'binding-options-formulas',
                anchor: 'help-formula-syntax-reference'
            };
            if (helpLink && typeof HelpSystem !== 'undefined' && typeof HelpSystem.appendEditorLabelWithHelpLink === 'function') {
                HelpSystem.appendEditorLabelWithHelpLink(formulaTitle, opts.sectionTitle, helpLink);
            } else {
                formulaTitle.textContent = opts.sectionTitle;
            }
            parentEl.appendChild(formulaTitle);
        }

        const formulaField = (typeof FormulaEngine !== 'undefined' && FormulaEngine.createFormulaInput)
            ? FormulaEngine.createFormulaInput(getFormula(), function (val) {
                applyFormulaPayload(val);
            })
            : null;

        if (formulaField) {
            parentEl.appendChild(formulaField.element);
            formulaFieldApi = formulaField;
        } else {
            const formulaInp = document.createElement('input');
            formulaInp.type = 'text';
            formulaInp.className = 'control-input w-full text-xs ds-formula-input';
            formulaInp.value = getFormula();
            formulaInp.placeholder = 'e.g. value * -1';
            parentEl.appendChild(formulaInp);
            formulaFieldApi = {
                getValue: function () { return formulaInp.value || ''; },
                setValue: function (v) { formulaInp.value = v; },
                insertValueAtCaret: function () { formulaInp.value = (formulaInp.value || '') + 'value'; },
                insertTopicAtCaret: function (path) {
                    if (!path) return;
                    formulaInp.value = (formulaInp.value || '') + '{{' + path + '}}';
                },
                insertTextAtCaret: function (text) {
                    if (!text) return;
                    formulaInp.value = (formulaInp.value || '') + text;
                },
                setInvalid: function () {}
            };
        }

        const insertRow = document.createElement('button');
        insertRow.type = 'button';
        insertRow.className = 'flex items-center gap-1.5 text-xs editor-muted-text editor-text-hover mb-0 mt-1 px-0 py-0.5 bg-transparent border-0 cursor-pointer w-full text-left';
        insertRow.title = 'Insert Value';
        insertRow.innerHTML = '<i class="ph-bold ph-tag text-xs flex-shrink-0"></i><span>Insert Value</span>';
        insertRow.onclick = function (e) {
            e.stopPropagation();
            if (typeof formulaFieldApi.saveCaret === 'function') formulaFieldApi.saveCaret();
            formulaFieldApi.insertValueAtCaret();
            applyFormulaPayload(formulaFieldApi.getValue());
        };
        parentEl.appendChild(insertRow);

        const insertTopicRow = document.createElement('button');
        insertTopicRow.type = 'button';
        insertTopicRow.className = 'flex items-center gap-1.5 text-xs editor-muted-text editor-text-hover mb-0 mt-0.5 px-0 py-0.5 bg-transparent border-0 cursor-pointer w-full text-left';
        insertTopicRow.title = 'Insert Topic';
        insertTopicRow.innerHTML = '<i class="ph-bold ph-tree-structure text-xs flex-shrink-0"></i><span>Insert Topic</span>';
        insertTopicRow.onclick = function (e) {
            e.stopPropagation();
            if (typeof formulaFieldApi.saveCaret === 'function') formulaFieldApi.saveCaret();
            if (typeof Editor === 'undefined' || typeof Editor.createTopicDropdown !== 'function') return;
            let existing = parentEl.querySelector('.ds-formula-topic-wrap');
            if (existing) {
                const inpEx = existing.querySelector('input');
                if (inpEx) setTimeout(function () { inpEx.focus(); }, 0);
                return;
            }
            const host = document.createElement('div');
            host.className = 'ds-formula-topic-wrap';
            const lbl = document.createElement('div');
            lbl.className = 'ds-formula-topic-label';
            lbl.innerHTML = '<i class="ph-bold ph-tree-structure"></i> Pick a topic to insert as <code>{{topic}}</code>';
            const row = document.createElement('div');
            row.className = 'flex gap-1 items-center';
            const dd = Editor.createTopicDropdown('', 'Search topics…', function (val) {
                if (!val) return;
                if (typeof formulaFieldApi.insertTopicAtCaret === 'function') {
                    formulaFieldApi.insertTopicAtCaret(val);
                }
                applyFormulaPayload(formulaFieldApi.getValue());
                if (formulaField && formulaField.element) formulaField.element.focus();
            }, '', true, true);
            row.appendChild(dd);
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'btn-tool w-8 flex-shrink-0';
            closeBtn.innerHTML = '<i class="ph-bold ph-x"></i>';
            closeBtn.title = 'Cancel';
            closeBtn.onclick = function (ev) {
                ev.stopPropagation();
                Editor._cleanupSubtreeDropdowns(host);
                if (host.parentNode) host.parentNode.removeChild(host);
            };
            row.appendChild(closeBtn);
            host.appendChild(lbl);
            host.appendChild(row);
            parentEl.insertBefore(host, insertTopicRow);
            const inpDd = host.querySelector('input');
            if (inpDd) setTimeout(function () { inpDd.focus(); }, 0);
        };
        parentEl.appendChild(insertTopicRow);

        if (opts.showInsertIcon && typeof Dashboard !== 'undefined'
                && typeof Dashboard.openIconBrowser === 'function') {
            const insertIconRow = document.createElement('button');
            insertIconRow.type = 'button';
            insertIconRow.className = 'flex items-center gap-1.5 text-xs editor-muted-text editor-text-hover mb-0 mt-0.5 px-0 py-0.5 bg-transparent border-0 cursor-pointer w-full text-left';
            insertIconRow.title = 'Insert Icon';
            insertIconRow.innerHTML = '<i class="ph-bold ph-star text-xs flex-shrink-0"></i><span>Insert Icon</span>';
            insertIconRow.onclick = function (e) {
                e.stopPropagation();
                if (typeof formulaFieldApi.saveCaret === 'function') formulaFieldApi.saveCaret();
                Dashboard.openIconBrowser('ph-star', function (iconClass) {
                    if (!iconClass) return;
                    const literal = '"' + String(iconClass).replace(/"/g, '') + '"';
                    if (typeof formulaFieldApi.insertTextAtCaret === 'function') {
                        formulaFieldApi.insertTextAtCaret(literal);
                    }
                    applyFormulaPayload(formulaFieldApi.getValue());
                    if (formulaField && formulaField.element) formulaField.element.focus();
                });
            };
            parentEl.appendChild(insertIconRow);
        }

        if (opts.showInsertColor && typeof EditorColorPicker !== 'undefined') {
            const insertColorRow = document.createElement('button');
            insertColorRow.type = 'button';
            insertColorRow.className = 'flex items-center gap-1.5 text-xs editor-muted-text editor-text-hover mb-0 mt-0.5 px-0 py-0.5 bg-transparent border-0 cursor-pointer w-full text-left';
            insertColorRow.title = 'Insert Color';
            insertColorRow.innerHTML = '<i class="ph-bold ph-palette text-xs flex-shrink-0"></i><span>Insert Color</span>';
            insertColorRow.onclick = function (e) {
                e.stopPropagation();
                if (typeof formulaFieldApi.saveCaret === 'function') formulaFieldApi.saveCaret();
                let existing = parentEl.querySelector('.ds-formula-color-wrap');
                if (existing) {
                    const sw = existing.querySelector('.ds-color-picker-swatch');
                    if (sw) setTimeout(function () { sw.click(); }, 0);
                    return;
                }
                let formulaInsertColorRaw = '#ffffff';
                const host = document.createElement('div');
                host.className = 'ds-formula-color-wrap';
                const lbl = document.createElement('div');
                lbl.className = 'ds-formula-color-label';
                lbl.innerHTML = '<i class="ph-bold ph-palette"></i> Pick a color to insert at the cursor (<code>#hex</code> or <code>@token</code>)';
                const row = document.createElement('div');
                row.className = 'flex gap-1 items-center';
                const colorCard = document.createElement('div');
                colorCard.className = 'flex-1 min-w-0';
                const closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.className = 'btn-tool w-8 flex-shrink-0';
                closeBtn.innerHTML = '<i class="ph-bold ph-x"></i>';
                closeBtn.title = 'Cancel';
                let insertColorCtrl = null;
                const destroyInsertColorCtrl = function () {
                    if (insertColorCtrl && typeof insertColorCtrl.destroy === 'function') {
                        try { insertColorCtrl.destroy(); } catch (eCol) {}
                    }
                    insertColorCtrl = null;
                };
                closeBtn.onclick = function (ev) {
                    ev.stopPropagation();
                    destroyInsertColorCtrl();
                    if (host.parentNode) host.parentNode.removeChild(host);
                };
                const formulaLiteralFromPick = function (val) {
                    if (!val || typeof val !== 'string') return '';
                    const t = val.trim();
                    if (t === '') return '';
                    if (typeof MasterLayout !== 'undefined' && typeof MasterLayout.isThemeTokenReference === 'function'
                            && MasterLayout.isThemeTokenReference(t)) {
                        return t;
                    }
                    if (typeof ColorUtils !== 'undefined' && ColorUtils.parse && ColorUtils.formatManualColor) {
                        const parsed = ColorUtils.parse(t);
                        if (parsed) {
                            return ColorUtils.formatManualColor(parsed, 'hex').toLowerCase();
                        }
                    }
                    if (t.charAt(0) === '#') return t.toLowerCase();
                    return t;
                };
                insertColorCtrl = self._attachColorPicker({
                    mountCard: colorCard,
                    getRaw: function () { return formulaInsertColorRaw; },
                    skipControllerRegistry: true,
                    allowThemeTokens: typeof MasterLayout !== 'undefined',
                    setValue: function (val) {
                        if (!val || typeof val !== 'string') return;
                        const insertVal = formulaLiteralFromPick(val);
                        if (insertVal === '') return;
                        formulaInsertColorRaw = insertVal;
                        if (typeof formulaFieldApi.insertTextAtCaret === 'function') {
                            formulaFieldApi.insertTextAtCaret(insertVal);
                        }
                        applyFormulaPayload(formulaFieldApi.getValue());
                        if (formulaField && formulaField.element) formulaField.element.focus();
                    },
                    onAfterLocalChange: function () {},
                    onReloadEditor: function () {}
                });
                if (insertColorCtrl) {
                    if (!parentEl._dsColorCtrls) parentEl._dsColorCtrls = [];
                    parentEl._dsColorCtrls.push(insertColorCtrl);
                }
                row.appendChild(colorCard);
                row.appendChild(closeBtn);
                host.appendChild(lbl);
                host.appendChild(row);
                parentEl.insertBefore(host, insertColorRow);
            };
            parentEl.appendChild(insertColorRow);
        }

        if (presets.length) {
            const presetWrap = document.createElement('div');
            presetWrap.className = 'ds-formula-presets';
            presets.forEach(function (preset) {
                const presetBtn = document.createElement('button');
                presetBtn.type = 'button';
                presetBtn.className = 'ds-formula-preset-btn';
                const presetHint = preset.hint || preset.label;
                presetBtn.title = preset.label + ': ' + presetHint;
                presetBtn.innerHTML = '<i class="ph-bold ph-function ds-formula-preset-icon"></i>'
                    + '<span class="ds-formula-preset-text">'
                    + '<span class="ds-formula-preset-label">' + preset.label + '</span>'
                    + '<span class="ds-formula-preset-hint">' + presetHint + '</span>'
                    + '</span>';
                presetBtn.onclick = function (e) {
                    e.stopPropagation();
                    formulaFieldApi.setValue(preset.formula);
                    applyFormulaPayload(formulaFieldApi.getValue());
                };
                presetWrap.appendChild(presetBtn);
            });
            parentEl.appendChild(presetWrap);
        }

        if (hintText) {
            const formulaHint = document.createElement('div');
            formulaHint.className = 'text-[9px] editor-muted-text italic mt-1';
            formulaHint.textContent = hintText;
            parentEl.appendChild(formulaHint);
        }

        return formulaFieldApi;
    },

    appendColorCorrectionSection: function (parentEl, opts) {
        const propKey = opts.propKey;
        const isGlobal = opts.isGlobal === true;
        const onAfterUpdate = typeof opts.onAfterUpdate === 'function' ? opts.onAfterUpdate : null;
        const self = this;

        let settingsSource;
        if (isGlobal) {
            settingsSource = MASTER_SETTINGS;
        } else {
            const widget = Dashboard.widgets[self.currentId];
            if (!widget) return;
            settingsSource = widget.overrides;
        }

        const en = settingsSource[propKey + '_correct_en'] === true;
        const hue = settingsSource[propKey + '_correct_hue'] || 0;
        const sat = settingsSource[propKey + '_correct_sat'] !== undefined ? settingsSource[propKey + '_correct_sat'] : 100;
        const bri = settingsSource[propKey + '_correct_bri'] !== undefined ? settingsSource[propKey + '_correct_bri'] : 100;

        const hueFixed = settingsSource[propKey + '_correct_hue_fixed'] === true;
        const satFixed = settingsSource[propKey + '_correct_sat_fixed'] === true;
        const briFixed = settingsSource[propKey + '_correct_bri_fixed'] === true;

        if (opts.sectionTitle) {
            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'control-label mb-1 mt-2';
            sectionTitle.textContent = opts.sectionTitle;
            parentEl.appendChild(sectionTitle);
        }

        const update = function (payload) {
            const prefixedPayload = {};
            Object.keys(payload).forEach(function (k) {
                prefixedPayload[propKey + '_' + k] = payload[k];
            });

            self._isEditorDrivenUpdate = true;
            try {
                if (isGlobal) {
                    Dashboard.updateGlobal(prefixedPayload, true);
                } else {
                    Dashboard.updateWidget(self.currentId, prefixedPayload);
                }
            } finally {
                self._isEditorDrivenUpdate = false;
            }

            if (onAfterUpdate) onAfterUpdate();
        };

        const enRow = document.createElement('div');
        enRow.className = 'flex items-center gap-2 mb-3 text-xs editor-muted-text';
        const enableCheck = document.createElement('input');
        enableCheck.type = 'checkbox';
        enableCheck.checked = en;
        enableCheck.onchange = function (e) {
            update({ 'correct_en': e.target.checked });
        };
        enRow.appendChild(enableCheck);
        const enLbl = document.createElement('label');
        enLbl.innerText = 'Apply Corrections';
        enRow.appendChild(enLbl);
        parentEl.appendChild(enRow);

        const createControlRow = function (label, valKey, fixedKey, isFixed, currentVal, isHue) {
            const wrapper = document.createElement('div');
            wrapper.className = 'cc-row mb-2';

            const topRow = document.createElement('div');
            topRow.className = 'flex justify-between items-center mb-1';

            const title = document.createElement('span');
            title.className = 'control-label';
            title.innerText = label;

            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'flex editor-surface rounded border editor-hairline p-0.5';

            const btnAdj = document.createElement('button');
            const btnFix = document.createElement('button');

            const btnClass = 'text-[9px] px-1.5 py-0.5 rounded transition-colors';
            const activeClass = 'editor-segment-active text-white font-bold shadow-sm';
            const inactiveClass = 'editor-muted-text editor-text-hover';

            btnAdj.className = btnClass + ' ' + (!isFixed ? activeClass : inactiveClass);
            btnAdj.innerText = 'Adj';

            btnFix.className = btnClass + ' ' + (isFixed ? activeClass : inactiveClass);
            btnFix.innerText = 'Fix';

            const botRow = document.createElement('div');
            botRow.className = 'flex items-center gap-2';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'flex-1';

            const valDisplay = document.createElement('span');
            valDisplay.className = 'cc-val text-[10px] w-8 text-right';
            valDisplay.innerText = currentVal + (isHue ? '°' : '%');

            const updateToggleUI = function (fixed) {
                btnAdj.className = btnClass + ' ' + (!fixed ? activeClass : inactiveClass);
                btnFix.className = btnClass + ' ' + (fixed ? activeClass : inactiveClass);

                let min;
                let max;
                if (isHue) {
                    min = fixed ? 0 : -180;
                    max = fixed ? 360 : 180;
                } else {
                    min = 0;
                    max = fixed ? 100 : 200;
                }

                slider.min = min;
                slider.max = max;

                let newVal = parseFloat(slider.value);
                if (newVal < min) newVal = min;
                if (newVal > max) newVal = max;

                slider.value = newVal;
                valDisplay.innerText = newVal + (isHue ? '°' : '%');

                return newVal;
            };

            btnAdj.onclick = function () {
                const newVal = updateToggleUI(false);
                update({ [fixedKey]: false, [valKey]: newVal });
            };
            btnFix.onclick = function () {
                const newVal = updateToggleUI(true);
                update({ [fixedKey]: true, [valKey]: newVal });
            };

            if (isHue) {
                slider.min = isFixed ? 0 : -180;
                slider.max = isFixed ? 360 : 180;
            } else {
                slider.min = 0;
                slider.max = isFixed ? 100 : 200;
            }
            slider.value = currentVal;

            slider.oninput = function (e) {
                if (!enableCheck.checked) {
                    enableCheck.checked = true;
                    update({ 'correct_en': true });
                }
                const v = parseFloat(e.target.value);
                valDisplay.innerText = v + (isHue ? '°' : '%');
                update({ [valKey]: v });
            };

            toggleContainer.appendChild(btnAdj);
            toggleContainer.appendChild(btnFix);

            topRow.appendChild(title);
            topRow.appendChild(toggleContainer);
            wrapper.appendChild(topRow);

            botRow.appendChild(slider);
            botRow.appendChild(valDisplay);
            wrapper.appendChild(botRow);

            return wrapper;
        };

        parentEl.appendChild(createControlRow('Color Tone', 'correct_hue', 'correct_hue_fixed', hueFixed, hue, true));
        parentEl.appendChild(createControlRow('Color Intensity', 'correct_sat', 'correct_sat_fixed', satFixed, sat, false));
        parentEl.appendChild(createControlRow('Brightness', 'correct_bri', 'correct_bri_fixed', briFixed, bri, false));
    },

    /**
     * Checkbox row used by schema fields (typography, etc.) and menu item toggles: slate card + Enabled/Disabled text.
     * @returns {{ wrap: HTMLElement, input: HTMLInputElement }}
     */
    createToggleStyleCheckboxRow: function (checked, onChange, options = {}) {
        const title = options.title;
        const wrap = document.createElement('div');
        wrap.className = 'ds-checkbox-row';
        if (title) wrap.title = title;
        const inp = document.createElement('input');
        inp.type = 'checkbox';
        inp.className = 'ds-checkbox';
        inp.checked = this.ensureBool(checked);
        if (title) inp.title = title;
        const status = document.createElement('span');
        status.className = 'ds-checkbox-row__status';
        const syncStatus = () => {
            const label = inp.checked ? 'Enabled' : 'Disabled';
            status.textContent = label;
            status.title = label;
            if (!title) wrap.title = label;
            wrap.classList.toggle('is-checked', !!inp.checked);
        };
        inp._syncCheckboxRowChrome = syncStatus;
        syncStatus();
        wrap.onclick = (e) => {
            if (inp.disabled) return;
            if (e.target !== inp) {
                inp.checked = !inp.checked;
                inp.dispatchEvent(new Event('change'));
            }
        };
        inp.addEventListener('change', () => {
            syncStatus();
            onChange(inp.checked);
        });
        wrap.appendChild(inp);
        wrap.appendChild(status);
        return { wrap, input: inp };
    },

    _applySwatchVisual: function (btn, preset) {
        let cssCol = '#1e293b';
        let mode = 'hs';
        if (preset) {
            mode = preset.color_mode || 'hs';
            const parsed = ColorUtils.parse(preset);
            if (parsed) cssCol = ColorUtils.toCss(parsed);
        }
        btn.style.backgroundColor = cssCol;
        btn.innerHTML = '';

        if (preset) {
            const dot = document.createElement('div');
            dot.style.position = 'absolute';
            dot.style.bottom = '4px';
            dot.style.right = '4px';
            dot.style.width = '12px';
            dot.style.height = '12px';
            dot.style.borderRadius = '50%';
            dot.style.boxShadow = '0 0 2px rgba(0,0,0,0.5)';
            if (mode === 'color_temp') {
                dot.style.background = '#ffffff';
            } else {
                dot.style.background = 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)';
            }
            btn.appendChild(dot);
        }
    },

    createDynamicPresetGrid: function (presetArr, onChange) {
        const wrap = document.createElement('div');
        wrap.className = 'w-full mt-2 flex flex-col gap-2';

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-4 gap-2 w-full';
        wrap.appendChild(grid);

        let presetReorderController = null;

        const renderGrid = () => {
            if (presetReorderController && typeof presetReorderController.destroy === 'function') {
                presetReorderController.destroy();
                presetReorderController = null;
            }
            grid.innerHTML = '';

            presetArr.forEach((preset, i) => {
                const itemWrap = document.createElement('div');
                itemWrap.className = 'relative group aspect-square ds-reorder-item';

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'w-full h-full rounded border editor-hairline shadow-sm cursor-pointer editor-border-accent-hover transition-all flex items-center justify-center relative overflow-hidden';

                this._applySwatchVisual(btn, preset);

                btn.onclick = (e) => {
                    e.stopPropagation();
                    const currentIndex = Array.from(grid.children).indexOf(itemWrap);
                    this.openPresetEditorPopup(currentIndex, presetArr, btn, (newArr) => {
                        presetArr = newArr;
                        onChange(presetArr);
                        renderGrid();
                    });
                };

                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow shadow-black/50 z-10 hover:bg-red-400';
                delBtn.innerHTML = '<i class="ph-bold ph-x"></i>';
                delBtn.title = "Remove Color";
                delBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
                delBtn.addEventListener('mousedown', (e) => { e.stopPropagation(); });
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    const currentIndex = Array.from(grid.children).indexOf(itemWrap);
                    presetArr.splice(currentIndex, 1);
                    onChange(presetArr);
                    renderGrid();
                };

                let gridGrip = null;
                if (typeof EditorReorder !== 'undefined' && typeof EditorReorder.createGridDragHandle === 'function') {
                    gridGrip = EditorReorder.createGridDragHandle();
                } else if (typeof EditorReorder !== 'undefined' && typeof EditorReorder.createDragHandle === 'function') {
                    gridGrip = EditorReorder.createDragHandle();
                    gridGrip.classList.add('ds-reorder-handle--grid');
                }

                itemWrap.appendChild(btn);
                if (gridGrip) itemWrap.appendChild(gridGrip);
                itemWrap.appendChild(delBtn);
                grid.appendChild(itemWrap);
            });

            if (typeof EditorReorder !== 'undefined' && typeof EditorReorder.attach === 'function') {
                presetReorderController = EditorReorder.attach(grid, {
                    layout: 'grid',
                    itemSelector: '.ds-reorder-item',
                    onReorder: (from, to) => {
                        const item = presetArr.splice(from, 1)[0];
                        presetArr.splice(to, 0, item);
                        onChange(presetArr);
                        renderGrid();
                    }
                });
            }
        };

        renderGrid();

        const addBtn = document.createElement('button');
        addBtn.className = 'btn-tool text-[10px] py-1 w-full justify-center bound-topic-text';
        addBtn.innerHTML = '<i class="ph-bold ph-plus"></i> Add Color';
        addBtn.onclick = () => {
            const randHue = Math.floor(Math.random() * 360);
            presetArr.push({ state: "ON", brightness: 255, color_mode: "hs", color: { h: randHue, s: 100 } });
            onChange(presetArr);
            renderGrid();
        };
        wrap.appendChild(addBtn);

        return { wrap, renderGrid };
    },

    /**
     * Registry type for a live widget instance. Instances do not store `.type`
     * (that key exists on saved JSON only).
     */
    _tooltipWidgetTypeFromInstance: function (widget) {
        if (!widget) return null;
        if (typeof WidgetRegistry !== 'undefined' && typeof WidgetRegistry.getTypeKeyForClass === 'function') {
            const found = WidgetRegistry.getTypeKeyForClass(widget.constructor);
            if (found) return found;
        }
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._getWidgetTypeByInstance === 'function') {
            return Dashboard._getWidgetTypeByInstance(widget) || null;
        }
        return null;
    },

    /**
     * Widget type used to look up inspector tips (`menu.menuLayout`).
     * Dashboard Settings groups (`global_menu`) stamp `_tooltipWidgetType` for the group,
     * including nested typography and icon slideouts rendered while that stamp is active.
     */
    _inspectorTooltipWidgetType: function (isGlobal) {
        if (!isGlobal && this.currentId && typeof Dashboard !== 'undefined' && Dashboard.widgets) {
            const fromInstance = this._tooltipWidgetTypeFromInstance(Dashboard.widgets[this.currentId]);
            if (fromInstance) return fromInstance;
        }
        return this._tooltipWidgetType || null;
    },

    _stampTooltipWidgetType: function (el, widgetType) {
        if (el && widgetType) el.setAttribute('data-widget-type', widgetType);
    },

    renderSchema: function (schema, values, overrides, bindings = {}, isGlobal = false) {
        if (typeof EditorTooltip !== 'undefined' && typeof EditorTooltip.syncState === 'function') {
            EditorTooltip.syncState();
        }
        const currentBindings = isGlobal ? Dashboard.globalBindings : (bindings || {});
        let mergedStatic = null;
        if (!isGlobal && this.currentId && Dashboard.widgets[this.currentId]) {
            mergedStatic = this._buildMergedStaticValues(Dashboard.widgets[this.currentId]);
        }

        const editorFieldIsBound = (fieldDef) => {
            if (isGlobal || !fieldDef) return false;
            const canBind = MASTER_SETTINGS.dataDriver && !fieldDef.noBind &&
                !['heading', 'list', 'font_list', 'preset_grid', 'driver_stats', 'topic_monitor', 'color_correction', 'topic', 'typography', 'icon_style', 'menu_list', 'light_list', 'graph_series_list', 'extra_output_topic_list', 'audio_topic_map', 'audio_trigger_map', 'theme_toolbar', 'widget_presets'].includes(fieldDef.type);
            if (!canBind) return false;
            const bindPath = (typeof BindingsTree !== 'undefined')
                ? Editor.bindingPathFromSchemaField(fieldDef)
                : null;
            if (bindPath && currentBindings) {
                return BindingsTree.getAtPath(currentBindings, bindPath) !== undefined;
            }
            return currentBindings && currentBindings[fieldDef.key] !== undefined;
        };

        schema.forEach((group, index) => {
            const gid = group.id || `g_${index}`;

            if (!isGlobal && values && values.locked === true && gid !== 'meta_group') {
                return;
            }

            if (!this.editorTierAllows(group, isGlobal)) {
                return;
            }

            const prevTooltipWidgetType = this._tooltipWidgetType;
            let stampedGlobalTooltipType = false;
            if (isGlobal && gid.indexOf('global_') === 0) {
                this._tooltipWidgetType = gid.slice('global_'.length);
                stampedGlobalTooltipType = true;
            }

            const g = document.createElement('div');
            g.className = 'control-group';
            g.dataset.groupId = gid;

            const isGroupVisible = (typeof group.visibleWhen === 'function')
                ? !!group.visibleWhen(values, isGlobal)
                : true;
            if (!isGroupVisible) {
                g.style.display = 'none';
            }
            if (!this.groupRegistry) this.groupRegistry = {};
            this.groupRegistry[gid] = {
                groupEl: g,
                groupDef: group
            };

            if (this.panelStates[gid] === undefined) {
                this.panelStates[gid] = group.defaultExpanded === true ? false : (index > 0);
            }
            if (this.panelStates[gid]) g.classList.add('collapsed');

            const title = document.createElement('div');
            title.className = 'section-title';

            let displayTitle = group.title;
            if (group.fields && group.fields.some(f => f.type === 'topic_monitor')) {
                displayTitle = "Data Stream Explorer";
            }

            title.innerHTML = `<i class="ph-bold ${group.icon}"></i> ${displayTitle} <i class="ph-bold ph-caret-down chevron"></i>`;

            title.onclick = () => {
                const isCollapsed = g.classList.toggle('collapsed');
                this.panelStates[gid] = isCollapsed;
            };
            if (group.title === '') {
                title.style.display = 'none';
                g.classList.add('collapsed'); // start open basically, since we toggle wrapper
                g.style.marginBottom = '0';
                g.style.border = 'none';
                g.style.backgroundColor = 'transparent';
                this.panelStates[gid] = false;
                g.classList.remove('collapsed');
            }
            g.appendChild(title);

            const content = document.createElement('div');
            content.className = 'group-content';
            if (group.title === '') {
                content.style.padding = '0';
            }
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-12 gap-x-2 gap-y-3';

            const bundledFieldSkip = new Set();

            group.fields.forEach((f, fi) => {
                if (bundledFieldSkip.has(f.key)) {
                    return;
                }
                const isFieldVis = this._isFieldVisible(f, values, isGlobal, group);
                const isConditionallyDisabled = typeof f.disableWhen === 'function' ? !!f.disableWhen(values, isGlobal) : false;

                const w = document.createElement('div');
                w.className = `col-span-${f.cols} flex flex-col justify-end`;
                this._applyEditorFieldGridColumn(w, f);
                w.dataset.fieldKey = f.key || '';
                this._stampTooltipWidgetType(w, this._inspectorTooltipWidgetType(isGlobal));
                // Deprecated `preserveGridSlot` collapses like any hidden field so
                // it never reserves an empty slot (see equalizeInspectorGrid).
                if (f.preserveGridSlot === true) w.setAttribute('data-preserve-grid-slot', 'true');
                if (!isFieldVis || f.type === 'spacer') w.style.display = 'none';

                const fKey = f.key || (`__anon_${gid}_${fi}`);
                if (!this.fieldRegistry) this.fieldRegistry = {};
                this.fieldRegistry[fKey] = {
                    wrapperEl: w,
                    fieldDef: f,
                    groupId: gid
                };

                if (f.type === 'heading') {
                    const hd = document.createElement('div');
                    hd.className = 'editor-schema-heading' + (f.headingClass ? (' ' + f.headingClass) : '');
                    let initLabel = f.label;
                    if (typeof f.dynamicLabel === 'function') {
                        const dyn = f.dynamicLabel(values, isGlobal);
                        if (dyn !== undefined && dyn !== null) initLabel = String(dyn);
                    }
                    hd.textContent = initLabel;
                    w.classList.replace(`col-span-${f.cols}`, 'col-span-12');
                    w.appendChild(hd);
                    if (this.fieldRegistry && this.fieldRegistry[fKey]) {
                        this.fieldRegistry[fKey].labelEl = hd;
                    }
                    grid.appendChild(w);
                    return;
                }

                if (f.type === 'spacer') {
                    w.className = `col-span-${f.cols} min-h-[1px]`;
                    w.setAttribute('aria-hidden', 'true');
                    grid.appendChild(w);
                    return;
                }

                if (f.type === 'column_split') {
                    w.classList.replace('col-span-' + f.cols, 'col-span-12');
                    delete w.dataset.fieldKey;
                    const split = document.createElement('div');
                    split.className = 'editor-column-split';
                    const columns = Array.isArray(f.columns) ? f.columns : [];
                    const bodies = [];
                    const colTrackers = [];
                    columns.forEach(function (col) {
                        const colEl = document.createElement('div');
                        colEl.className = 'editor-column-split-col';
                        const titleEl = document.createElement('div');
                        titleEl.className = 'editor-column-split-title';
                        const resolveTitle = function (vals, global) {
                            if (!col) return '';
                            if (typeof col.dynamicTitle === 'function') return col.dynamicTitle(vals, global);
                            if (typeof col.title === 'function') return col.title(vals, global);
                            return col.title || '';
                        };
                        titleEl.textContent = resolveTitle(values, isGlobal);
                        colTrackers.push({ el: titleEl, resolve: resolveTitle });
                        const body = document.createElement('div');
                        body.className = 'editor-column-split-body';
                        colEl.appendChild(titleEl);
                        colEl.appendChild(body);
                        split.appendChild(colEl);
                        bodies.push({
                            body: body,
                            fields: (col && Array.isArray(col.fields)) ? col.fields : []
                        });
                    });
                    w.appendChild(split);
                    if (this.fieldRegistry && this.fieldRegistry[fKey]) {
                        this.fieldRegistry[fKey].syncDynamicContent = function (vals, global) {
                            colTrackers.forEach(function (trk) {
                                const nextTitle = trk.resolve(vals, global);
                                if (trk.el.textContent !== nextTitle) trk.el.textContent = nextTitle;
                            });
                        };
                    }
                    grid.appendChild(w);
                    const oldContainer = this.container;
                    try {
                        for (let ci = 0; ci < bodies.length; ci++) {
                            this.container = bodies[ci].body;
                            this.renderSchema([{
                                id: 'column_split_' + gid + '_' + fi + '_' + ci,
                                title: '',
                                icon: '',
                                editorTier: group.editorTier,
                                fields: bodies[ci].fields
                            }], values, overrides, bindings, isGlobal);
                        }
                    } finally {
                        this.container = oldContainer;
                    }
                    return;
                }

                if (f.type === 'action_button') {
                    w.className = `col-span-${f.cols} flex flex-col gap-1`;
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'btn-tool w-full justify-center';
                    btn.textContent = f.label || 'Action';
                    if (f.title) btn.title = f.title;
                    btn.onclick = () => {
                        this._flushActiveInput();
                        if (typeof f.onClick === 'function' && !isGlobal && this.currentId) {
                            const widget = Dashboard.widgets[this.currentId];
                            if (widget) f.onClick(widget);
                            return;
                        }
                        if (f.previewAnimationSlot && !isGlobal && this.currentId
                            && typeof WidgetAnimations !== 'undefined'
                            && typeof WidgetAnimations.previewOnce === 'function') {
                            const widget = Dashboard.widgets[this.currentId];
                            if (widget) WidgetAnimations.previewOnce(widget, f.previewAnimationSlot);
                        }
                    };
                    w.appendChild(btn);
                    grid.appendChild(w);
                    return;
                }

                if (f.type === 'theme_toolbar') {
                    w.className = 'col-span-12 flex flex-col gap-2 pt-3 mt-1 border-t editor-hairline';
                    // Theme corrections reuse the Edit Mode Zoom slider styling.
                    // Hue, Contrast, and Brightness derive from one baseline, so
                    // clipped colors come back when the sliders return to center.
                    // The sliders are never saved: saving keeps the colors on
                    // screen, and loading a theme parks all three at center.
                    const wrap = document.createElement('div');
                    wrap.className = 'theme-hue-shift editor-zoom';
                    const head = document.createElement('div');
                    head.className = 'editor-zoom-head theme-correction-head';
                    const title = document.createElement('div');
                    title.className = 'toolbar-label';
                    title.textContent = 'Theme Corrections';
                    title.setAttribute('data-editor-tooltip', 'theme-corrections');
                    const resetBtn = document.createElement('button');
                    resetBtn.type = 'button';
                    resetBtn.id = 'theme-hue-shift-reset';
                    resetBtn.className = 'btn-tool btn-tool-icon-only';
                    resetBtn.setAttribute('data-editor-tooltip', 'theme-corrections-reset');
                    resetBtn.title = 'Reset Color Tone, Intensity, Contrast, and Brightness to center';
                    resetBtn.setAttribute('aria-label', 'Reset Color Tone, Intensity, Contrast, and Brightness to center');
                    resetBtn.disabled = true;
                    resetBtn.innerHTML = '<i class="ph-bold ph-arrow-counter-clockwise"></i>';
                    resetBtn.onclick = function () { Dashboard.resetThemeHueShiftFromButton(); };
                    head.appendChild(title);
                    head.appendChild(resetBtn);
                    wrap.appendChild(head);

                    const corrections = (typeof Dashboard !== 'undefined') ? Dashboard : null;
                    const hueNow = (corrections && typeof corrections._normalizeThemeHueShift === 'function')
                        ? String(corrections._normalizeThemeHueShift(corrections._themeHueShift))
                        : '0';
                    const satNow = (corrections && typeof corrections._normalizeThemeBrightness === 'function')
                        ? String(corrections._normalizeThemeBrightness(corrections._themeSaturationShift))
                        : '100';
                    const briNow = (corrections && typeof corrections._normalizeThemeBrightness === 'function')
                        ? String(corrections._normalizeThemeBrightness(corrections._themeBrightnessShift))
                        : '100';
                    const contrastNow = (corrections && typeof corrections._normalizeThemeBrightness === 'function')
                        ? String(corrections._normalizeThemeBrightness(corrections._themeContrastShift))
                        : '100';

                    const addSliderRow = function (spec) {
                        const row = document.createElement('div');
                        row.className = 'editor-zoom-track-row';
                        const name = document.createElement('label');
                        name.className = 'toolbar-label theme-correction-name';
                        name.setAttribute('for', spec.id);
                        name.textContent = spec.name;
                        if (spec.tooltipKey) {
                            name.setAttribute('data-editor-tooltip', spec.tooltipKey);
                        }
                        const input = document.createElement('input');
                        input.type = 'range';
                        input.id = spec.id;
                        input.className = 'editor-zoom-slider';
                        if (spec.tooltipKey) {
                            input.setAttribute('data-editor-tooltip', spec.tooltipKey);
                        }
                        input.min = spec.min;
                        input.max = spec.max;
                        input.step = '1';
                        // type=range sanitizes an empty value against the default
                        // 0..100 range before min/max are assigned. Set value after.
                        input.value = spec.value;
                        input.setAttribute('aria-label', spec.aria);
                        input.title = spec.title;
                        input.oninput = function () { Dashboard.setThemeCorrectionsFromSlider(); };
                        input.onchange = function () { Dashboard.commitThemeCorrectionsFromSlider(); };
                        const readout = document.createElement('output');
                        readout.className = 'editor-zoom-readout theme-correction-readout';
                        readout.id = spec.readoutId;
                        readout.setAttribute('for', spec.id);
                        row.appendChild(name);
                        row.appendChild(input);
                        row.appendChild(readout);
                        wrap.appendChild(row);
                        return { input: input, readout: readout };
                    };

                    const hue = addSliderRow({
                        name: 'Color Tone',
                        id: 'theme-hue-shift-slider',
                        readoutId: 'theme-hue-shift-readout',
                        tooltipKey: 'theme-color-tone',
                        min: '-180',
                        max: '180',
                        value: hueNow,
                        aria: 'Color Tone, 0 degrees in the center keeps the current palette',
                        title: 'Rotates every Theme Color around the color wheel, from -180 to +180 degrees. 0 keeps the current palette.'
                    });
                    const saturation = addSliderRow({
                        name: 'Color Intensity',
                        id: 'theme-saturation-shift-slider',
                        readoutId: 'theme-saturation-shift-readout',
                        tooltipKey: 'theme-color-intensity',
                        min: '0',
                        max: '200',
                        value: satNow,
                        aria: 'Color Intensity, 100 percent in the center keeps the current palette',
                        title: 'Scales the color saturation of every Theme Color from 0% to 200%. 100% keeps the current palette. Colors that desaturate come back when the slider returns toward 100%.'
                    });
                    const brightness = addSliderRow({
                        name: 'Brightness',
                        id: 'theme-brightness-shift-slider',
                        readoutId: 'theme-brightness-shift-readout',
                        tooltipKey: 'theme-brightness',
                        min: '0',
                        max: '200',
                        value: briNow,
                        aria: 'Brightness, 100 percent in the center keeps the current palette',
                        title: 'Scales the brightness of every Theme Color from 0% to 200%. 100% keeps the current palette. Colors that clip at the bright end come back when the slider returns toward 100%.'
                    });
                    const contrast = addSliderRow({
                        name: 'Contrast',
                        id: 'theme-contrast-shift-slider',
                        readoutId: 'theme-contrast-shift-readout',
                        tooltipKey: 'theme-contrast',
                        min: '0',
                        max: '200',
                        value: contrastNow,
                        aria: 'Contrast, 100 percent in the center keeps the current palette',
                        title: 'Spreads dark Theme Colors darker and light Theme Colors lighter, from 0% to 200%. 100% keeps the current palette. Colors that clip at the high end come back when the slider returns toward 100%.'
                    });
                    w.appendChild(wrap);
                    if (corrections) {
                        corrections._themeHueShiftInput = hue.input;
                        corrections._themeHueShiftReadout = hue.readout;
                        corrections._themeSaturationInput = saturation.input;
                        corrections._themeSaturationReadout = saturation.readout;
                        corrections._themeBrightnessInput = brightness.input;
                        corrections._themeBrightnessReadout = brightness.readout;
                        corrections._themeContrastInput = contrast.input;
                        corrections._themeContrastReadout = contrast.readout;
                        corrections._themeHueShiftReset = resetBtn;
                        if (typeof corrections._syncThemeHueShiftControl === 'function') {
                            corrections._syncThemeHueShiftControl();
                        }
                    }
                    const row = document.createElement('div');
                    row.className = 'flex flex-wrap gap-2 items-stretch';
                    const syncBtn = document.createElement('button');
                    syncBtn.type = 'button';
                    syncBtn.className = 'btn-tool flex-1 min-w-[10rem] justify-center';
                    syncBtn.setAttribute('data-editor-tooltip', 'theme-reset-defaults-to-theme');
                    syncBtn.textContent = 'Reset all widget default colors to theme colors';
                    syncBtn.title = 'Reset widget default colors to match the factory theme file (@ tokens). Does not change per-widget overrides.';
                    syncBtn.onclick = () => {
                        if (typeof Dashboard !== 'undefined' && typeof Dashboard.resetGlobalDefaultColorsToFactoryTokens === 'function') {
                            void Dashboard.resetGlobalDefaultColorsToFactoryTokens();
                        }
                    };
                    row.appendChild(syncBtn);
                    w.appendChild(row);
                    grid.appendChild(w);
                    return;
                }

                if (f.type === 'widget_presets') {
                    if (isGlobal) {
                        return;
                    }
                    // gap-3 matches field grid gap-y-3 (NAME → LOCKED); avoid toolbar-template-row margin-bottom.
                    w.className = 'col-span-12 flex flex-col gap-3 mb-2';

                    const label = document.createElement('label');
                    label.className = 'control-label';
                    label.textContent = 'Presets';
                    label.setAttribute('data-editor-tooltip', 'widget-presets');
                    w.appendChild(label);

                    // Main row stays full width; sub-preset dropdown stacks below when multi-variant.
                    const selectStack = document.createElement('div');
                    selectStack.className = 'flex flex-col gap-2';
                    selectStack.id = 'widget-preset-select-stack';

                    const selectRow = document.createElement('div');
                    selectRow.className = 'flex items-stretch gap-2';
                    selectRow.id = 'widget-preset-select-row';

                    const prevBtn = document.createElement('button');
                    prevBtn.type = 'button';
                    prevBtn.className = 'btn-tool btn-tool-icon-only';
                    prevBtn.setAttribute('data-editor-tooltip', 'widget-presets-prev');
                    prevBtn.title = 'Load the previous main preset in the list';
                    prevBtn.innerHTML = '<i class="ph-bold ph-caret-left"></i>';
                    prevBtn.onclick = () => {
                        if (typeof Dashboard !== 'undefined' && typeof Dashboard.prevWidgetPreset === 'function') {
                            void Dashboard.prevWidgetPreset();
                        }
                    };

                    const wrapper = document.createElement('div');
                    wrapper.className = 'ds-select-wrapper flex-1 min-w-0';
                    wrapper.id = 'widget-preset-select-wrapper';

                    const btn = document.createElement('button');
                    btn.id = 'widget-preset-select-btn';
                    btn.className = 'control-input ds-select-btn h-full';
                    btn.setAttribute('data-editor-tooltip', 'widget-presets-menu');
                    btn.type = 'button';
                    btn.innerHTML = '<span id="widget-preset-select-label" class="editor-muted-text">Select Preset...</span><i class="ph-bold ph-caret-down"></i>';

                    const menu = document.createElement('div');
                    menu.id = 'widget-preset-select-menu';
                    menu.className = 'ds-select-menu hidden';
                    menu._dsSelectAnchor = wrapper;

                    btn.onclick = (e) => {
                        e.stopPropagation();
                        if (menu.classList.contains('hidden')) {
                            const afterRefresh = () => {
                                if (typeof Dashboard._paintWidgetPresetDropdownLabels === 'function') {
                                    Dashboard._paintWidgetPresetDropdownLabels();
                                }
                                if (this._toggleDsFixedDropdown) {
                                    this._toggleDsFixedDropdown(menu, btn, true);
                                } else {
                                    menu.classList.remove('hidden');
                                }
                            };
                            if (typeof Dashboard.refreshWidgetPresetDropdown === 'function') {
                                void Dashboard.refreshWidgetPresetDropdown().then(afterRefresh);
                            } else {
                                afterRefresh();
                            }
                        } else if (this._closeDsFixedDropdown) {
                            this._closeDsFixedDropdown(menu);
                        } else {
                            menu.classList.add('hidden');
                        }
                    };

                    const subRow = document.createElement('div');
                    subRow.className = 'flex items-stretch gap-2';
                    subRow.id = 'widget-preset-sub-select-row';
                    subRow.hidden = true;
                    subRow.style.display = 'none';

                    const subPrevBtn = document.createElement('button');
                    subPrevBtn.type = 'button';
                    subPrevBtn.className = 'btn-tool btn-tool-icon-only';
                    subPrevBtn.setAttribute('data-editor-tooltip', 'widget-presets-sub-prev');
                    subPrevBtn.title = 'Load the previous sub-preset';
                    subPrevBtn.innerHTML = '<i class="ph-bold ph-caret-left"></i>';
                    subPrevBtn.onclick = () => {
                        if (typeof Dashboard !== 'undefined' && typeof Dashboard.prevWidgetPresetVariant === 'function') {
                            Dashboard.prevWidgetPresetVariant();
                        }
                    };

                    const subWrapper = document.createElement('div');
                    subWrapper.className = 'ds-select-wrapper flex-1 min-w-0';
                    subWrapper.id = 'widget-preset-sub-select-wrapper';

                    const subBtn = document.createElement('button');
                    subBtn.id = 'widget-preset-sub-select-btn';
                    subBtn.className = 'control-input ds-select-btn h-full';
                    subBtn.setAttribute('data-editor-tooltip', 'widget-presets-sub-menu');
                    subBtn.type = 'button';
                    subBtn.innerHTML = '<span id="widget-preset-sub-select-label" class="editor-muted-text">Sub...</span><i class="ph-bold ph-caret-down"></i>';

                    const subMenu = document.createElement('div');
                    subMenu.id = 'widget-preset-sub-select-menu';
                    subMenu.className = 'ds-select-menu hidden';
                    subMenu._dsSelectAnchor = subWrapper;

                    subBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (subMenu.classList.contains('hidden')) {
                            if (typeof Dashboard !== 'undefined' && typeof Dashboard.refreshWidgetPresetSubDropdown === 'function') {
                                Dashboard.refreshWidgetPresetSubDropdown();
                            }
                            if (this._toggleDsFixedDropdown) {
                                this._toggleDsFixedDropdown(subMenu, subBtn, true);
                            } else {
                                subMenu.classList.remove('hidden');
                            }
                        } else if (this._closeDsFixedDropdown) {
                            this._closeDsFixedDropdown(subMenu);
                        } else {
                            subMenu.classList.add('hidden');
                        }
                    };

                    if (this._bindDsFixedDropdownOutsideClick) {
                        this._bindDsFixedDropdownOutsideClick();
                    }

                    const nextBtn = document.createElement('button');
                    nextBtn.type = 'button';
                    nextBtn.className = 'btn-tool btn-tool-icon-only';
                    nextBtn.setAttribute('data-editor-tooltip', 'widget-presets-next');
                    nextBtn.title = 'Load the next main preset in the list';
                    nextBtn.innerHTML = '<i class="ph-bold ph-caret-right"></i>';
                    nextBtn.onclick = () => {
                        if (typeof Dashboard !== 'undefined' && typeof Dashboard.nextWidgetPreset === 'function') {
                            void Dashboard.nextWidgetPreset();
                        }
                    };

                    const subNextBtn = document.createElement('button');
                    subNextBtn.type = 'button';
                    subNextBtn.className = 'btn-tool btn-tool-icon-only';
                    subNextBtn.setAttribute('data-editor-tooltip', 'widget-presets-sub-next');
                    subNextBtn.title = 'Load the next sub-preset';
                    subNextBtn.innerHTML = '<i class="ph-bold ph-caret-right"></i>';
                    subNextBtn.onclick = () => {
                        if (typeof Dashboard !== 'undefined' && typeof Dashboard.nextWidgetPresetVariant === 'function') {
                            Dashboard.nextWidgetPresetVariant();
                        }
                    };

                    wrapper.appendChild(btn);
                    wrapper.appendChild(menu);
                    subWrapper.appendChild(subBtn);
                    subWrapper.appendChild(subMenu);
                    this._bindOverflowTitle(btn, document.getElementById('widget-preset-select-label'), function () {
                        const el = document.getElementById('widget-preset-select-label');
                        return el ? el.textContent : '';
                    });
                    this._bindOverflowTitle(subBtn, document.getElementById('widget-preset-sub-select-label'), function () {
                        const el = document.getElementById('widget-preset-sub-select-label');
                        return el ? el.textContent : '';
                    });
                    selectRow.appendChild(prevBtn);
                    selectRow.appendChild(wrapper);
                    selectRow.appendChild(nextBtn);
                    subRow.appendChild(subPrevBtn);
                    subRow.appendChild(subWrapper);
                    subRow.appendChild(subNextBtn);
                    selectStack.appendChild(selectRow);
                    selectStack.appendChild(subRow);
                    w.appendChild(selectStack);

                    if (this.getEffectiveUiMode(this.currentId) === 'advanced') {
                        // Equal buttons; gap-2 matches field grid gap-x-2.
                        const actionRow = document.createElement('div');
                        actionRow.className = 'flex gap-2';

                        const showServer = (() => {
                            const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
                            return !!(driver && driver.supportsFileStorage
                                && typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ui && APP_CONFIG.ui.showServerButtons);
                        })();

                        if (showServer) {
                            const saveBtn = document.createElement('button');
                            saveBtn.type = 'button';
                            saveBtn.className = 'btn-tool flex-1';
                            saveBtn.setAttribute('data-editor-tooltip', 'widget-presets-save');
                            saveBtn.title = 'Save current widget settings as a preset on Homey';
                            saveBtn.innerHTML = '<i class="ph-bold ph-cloud-arrow-up"></i> Save';
                            saveBtn.onclick = () => {
                                if (typeof Dashboard !== 'undefined' && typeof Dashboard.saveWidgetPresetToServer === 'function') {
                                    void Dashboard.saveWidgetPresetToServer();
                                }
                            };
                            actionRow.appendChild(saveBtn);
                        }

                        const exportBtn = document.createElement('button');
                        exportBtn.type = 'button';
                        exportBtn.className = 'btn-tool flex-1';
                        exportBtn.setAttribute('data-editor-tooltip', 'widget-presets-export');
                        exportBtn.title = 'Export current widget settings as a local preset file';
                        exportBtn.innerHTML = '<i class="ph-bold ph-download-simple"></i> Export';
                        exportBtn.onclick = () => {
                            if (typeof Dashboard !== 'undefined' && typeof Dashboard.exportWidgetPresetLocal === 'function') {
                                void Dashboard.exportWidgetPresetLocal();
                            }
                        };
                        const importBtn = document.createElement('button');
                        importBtn.type = 'button';
                        importBtn.className = 'btn-tool flex-1';
                        importBtn.setAttribute('data-editor-tooltip', 'widget-presets-import');
                        importBtn.title = 'Import a widget preset from a local file';
                        importBtn.innerHTML = '<i class="ph-bold ph-folder-open"></i> Import';
                        importBtn.onclick = () => {
                            if (typeof Dashboard !== 'undefined' && typeof Dashboard.importWidgetPresetLocal === 'function') {
                                void Dashboard.importWidgetPresetLocal();
                            }
                        };
                        actionRow.appendChild(exportBtn);
                        actionRow.appendChild(importBtn);
                        w.appendChild(actionRow);

                        const resetBtn = document.createElement('button');
                        resetBtn.type = 'button';
                        resetBtn.className = 'btn-tool w-full justify-center';
                        resetBtn.setAttribute('data-editor-tooltip', 'widget-presets-reset');
                        resetBtn.title = 'Reset style and behavior settings on this widget to defaults';
                        resetBtn.textContent = 'Reset to Default';
                        resetBtn.onclick = () => {
                            if (typeof Dashboard !== 'undefined' && typeof Dashboard.resetWidgetToDefault === 'function') {
                                void Dashboard.resetWidgetToDefault();
                            }
                        };
                        w.appendChild(resetBtn);
                    }

                    grid.appendChild(w);
                    if (typeof Dashboard.refreshWidgetPresetDropdown === 'function') {
                        void Dashboard.refreshWidgetPresetDropdown().then(() => {
                            if (typeof Dashboard._paintWidgetPresetDropdownLabels === 'function') {
                                Dashboard._paintWidgetPresetDropdownLabels();
                            }
                        });
                    }
                    return;
                }

                if (f.type === 'widget_defaults_toolbar') {
                    w.className = 'col-span-12 flex flex-col gap-2 pt-3 mt-1 border-t editor-hairline';
                    const row = document.createElement('div');
                    row.className = 'flex flex-wrap gap-2 items-stretch';
                    const resetBtn = document.createElement('button');
                    resetBtn.type = 'button';
                    resetBtn.className = 'btn-tool flex-1 min-w-[10rem] justify-center';
                    resetBtn.setAttribute('data-editor-tooltip', 'widget-defaults-reset');
                    resetBtn.textContent = 'Reset all widget default settings';
                    resetBtn.title = 'Restore all widget master defaults. Does not change Platform, Dashboard Environment, or driver/simulation settings.';
                    resetBtn.onclick = () => {
                        if (typeof Dashboard === 'undefined' || typeof Dashboard.updateGlobal !== 'function') return;
                        const runReset = () => {
                            const pluginSchemas = WidgetRegistry.getGlobalSchema();
                            const widgetKeys = this._collectSchemaSettingKeys(pluginSchemas);
                            if (!widgetKeys.length) return;
                            const snap = this._ensureMasterDefaultsSnapshot();
                            const payload = {};
                            widgetKeys.forEach((k) => {
                                if (Object.prototype.hasOwnProperty.call(snap, k)) {
                                    payload[k] = snap[k];
                                }
                            });
                            if (Object.keys(payload).length === 0) return;
                            Dashboard.updateGlobal(payload, false);
                        };
                        const message = 'Reset all widget default settings to factory defaults? Dashboard Environment, Platform, and driver/simulation settings are not changed.';
                        if (typeof CustomDialog !== 'undefined' && typeof CustomDialog.confirm === 'function') {
                            void CustomDialog.confirm(message, 'Reset Widget Defaults').then(function (ok) {
                                if (ok) runReset();
                            });
                            return;
                        }
                        runReset();
                    };
                    row.appendChild(resetBtn);
                    w.appendChild(row);
                    grid.appendChild(w);
                    return;
                }

                if (f.type === 'driver_stats') {
                    const statsBox = document.createElement('div');
                    statsBox.className = 'editor-surface-inset rounded p-2 text-xs font-mono editor-muted-text border editor-hairline grid grid-cols-2 gap-2';

                    const createStat = (lbl, id) => `
                        <div>
                            <div class="text-[9px] uppercase tracking-wider editor-muted-text">${lbl}</div>
                            <div id="${id}" class="editor-accent-text font-bold">--</div>
                        </div>`;

                    statsBox.innerHTML =
                        createStat('Messages', 'stat-msgs') +
                        createStat('Uptime', 'stat-time') +
                        `<div class="col-span-2 border-t editor-hairline pt-1 mt-1">
                             <div class="text-[9px] uppercase tracking-wider editor-muted-text">Last Topic</div>
                              <div id="stat-last" class="text-white truncate">--</div>
                        </div>`;

                    const updateStats = () => {
                        if (g.classList.contains('collapsed')) return;

                        const driver = DataDriverRegistry.get();
                        if (driver && driver.stats) {
                            const mEl = document.getElementById('stat-msgs');
                            const tEl = document.getElementById('stat-time');
                            const lEl = document.getElementById('stat-last');

                            if (mEl) mEl.textContent = driver.stats.msgCount.toLocaleString();
                            if (lEl) lEl.textContent = driver.stats.lastTopic || '--';
                            if (tEl && driver.stats.connectedSince) {
                                const diff = Math.floor((Date.now() - driver.stats.connectedSince) / 1000);
                                const mins = Math.floor(diff / 60);
                                const secs = diff % 60;
                                tEl.textContent = `${mins}m ${secs}s`;
                            }
                        }
                    };
                    // WorkerTimer: keeps the uptime counter ticking through the cold-start throttling window.
                    const statsHandle = WorkerTimer.setInterval(updateStats, 1000);
                    window._dsDropdownCleanups.push(() => {
                        WorkerTimer.clearInterval(statsHandle);
                    });
                    updateStats();
                    w.appendChild(statsBox);
                    grid.appendChild(w);
                    return;
                }

                if (f.type === 'topic_monitor') {
                    const galleryBtn = document.createElement('button');
                    galleryBtn.type = 'button';
                    galleryBtn.className = 'btn-tool w-full mb-2 justify-center';
                    galleryBtn.innerHTML = '<i class="ph-bold ph-squares-four"></i><span>Auto-Widget Gallery</span>';
                    galleryBtn.title = 'Generate and batch-add live widgets from incoming data streams.';
                    galleryBtn.setAttribute('data-editor-tooltip', 'topic-monitor-dialog');
                    galleryBtn.addEventListener('click', function () {
                        if (typeof ToolsMenu === 'undefined' || typeof ToolsRegistry === 'undefined') return;
                        var spec = ToolsRegistry.get('auto-widget-gallery');
                        if (!spec) return;
                        void ToolsMenu._runSpec(spec).catch(function (err) {
                            var msg = err && err.message ? err.message : String(err);
                            if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                                CustomDialog.alert('Tool failed: ' + msg, 'Error');
                            }
                        });
                    });

                    const wrapper = document.createElement('div');
                    wrapper.className = 'editor-surface-inset rounded border editor-hairline flex flex-col overflow-hidden relative';
                    wrapper.style.height = '300px';

                    const toolbar = document.createElement('div');
                    toolbar.className = 'editor-surface p-2 border-b editor-hairline flex gap-2 items-center';

                    const filterInput = document.createElement('input');
                    filterInput.className = 'control-input text-xs py-1 px-2 h-6 flex-1';
                    filterInput.placeholder = 'Filter topics...';
                    filterInput.setAttribute('data-editor-tooltip', 'topic-monitor-filter');

                    const clearBtn = document.createElement('button');
                    clearBtn.className = 'btn-tool w-6 h-6 p-0 flex items-center justify-center';
                    clearBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
                    clearBtn.setAttribute('data-editor-tooltip', 'topic-monitor-clear');
                    clearBtn.title = "Clear History";

                    const pauseBadge = document.createElement('div');
                    pauseBadge.className = 'absolute top-10 right-4 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-lg pointer-events-none opacity-0 transition-opacity z-10';
                    pauseBadge.innerText = "PAUSED (HOVERING)";
                    wrapper.appendChild(pauseBadge);

                    toolbar.appendChild(filterInput);
                    toolbar.appendChild(clearBtn);
                    wrapper.appendChild(toolbar);

                    const list = document.createElement('div');
                    list.className = 'overflow-y-auto flex-1 p-0 scrollbar-thin min-h-0';
                    wrapper.appendChild(list);

                    const copyAllBar = document.createElement('div');
                    copyAllBar.className = 'editor-surface border-t editor-hairline p-2 flex-shrink-0 flex gap-2 items-center';
                    const copyAllBtn = document.createElement('button');
                    copyAllBtn.type = 'button';
                    copyAllBtn.className = 'btn-tool flex-1 justify-center text-xs';
                    copyAllBtn.setAttribute('data-editor-tooltip', 'topic-monitor-copy-all');
                    copyAllBtn.innerHTML = '<i class="ph-bold ph-copy"></i><span>Copy All Topic Names</span>';
                    copyAllBtn.title = 'Copy all known topic names to the clipboard, one per line';
                    const syncCopyAllEnabled = function () {
                        const d = DataDriverRegistry.get();
                        const n = d && d.seenTopics ? d.seenTopics.size : 0;
                        copyAllBtn.disabled = n === 0;
                        if (n === 0) {
                            copyAllBtn.classList.add('opacity-50', 'cursor-not-allowed');
                        } else {
                            copyAllBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                        }
                    };
                    copyAllBtn.onclick = function () {
                        const d = DataDriverRegistry.get();
                        if (!d || !d.seenTopics || d.seenTopics.size === 0) {
                            return;
                        }
                        const names = Array.from(d.seenTopics.keys());
                        names.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
                        const text = names.join('\n');
                        Editor.copyToClipboard(text).then(function () {
                            copyAllBtn.innerHTML = '<i class="ph-bold ph-check text-green-500"></i><span>Copied</span>';
                            setTimeout(function () {
                                copyAllBtn.innerHTML = '<i class="ph-bold ph-copy"></i><span>Copy All Topic Names</span>';
                            }, 1000);
                        }).catch(function (err) {
                            if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                                void CustomDialog.alert('Copy failed: ' + err, 'Copy Failed');
                            }
                        });
                    };

                    const advExplorerBtn = document.createElement('button');
                    advExplorerBtn.type = 'button';
                    advExplorerBtn.className = 'btn-tool flex-1 justify-center text-xs';
                    advExplorerBtn.setAttribute('data-editor-tooltip', 'topic-monitor-advanced-explorer');
                    advExplorerBtn.innerHTML = '<i class="ph-bold ph-chart-pie-slice"></i><span>Advanced Explorer</span>';
                    advExplorerBtn.title = 'Open Overview & Topic Intelligence in About & Dashboard Statistics';
                    advExplorerBtn.onclick = function () {
                        if (typeof DashboardStatistics !== 'undefined' && typeof DashboardStatistics.open === 'function') {
                            DashboardStatistics.open('overview');
                        } else if (typeof ToolsMenu !== 'undefined' && typeof ToolsRegistry !== 'undefined') {
                            var spec = ToolsRegistry.get('dashboard-statistics');
                            if (spec) {
                                void ToolsMenu._runSpec(spec).then(function () {
                                    if (typeof DashboardStatistics !== 'undefined' && typeof DashboardStatistics.open === 'function') {
                                        DashboardStatistics.open('overview');
                                    }
                                });
                            }
                        }
                    };

                    copyAllBar.appendChild(copyAllBtn);
                    copyAllBar.appendChild(advExplorerBtn);
                    wrapper.appendChild(copyAllBar);
                    syncCopyAllEnabled();

                    const driver = DataDriverRegistry.get();
                    let lastRenderTime = 0;
                    let lastMaxTimestamp;
                    let isHovering = false;

                    wrapper.addEventListener('mouseenter', () => {
                        isHovering = true;
                        pauseBadge.style.opacity = '1';
                    });
                    wrapper.addEventListener('mouseleave', () => {
                        isHovering = false;
                        pauseBadge.style.opacity = '0';
                    });

                    clearBtn.onclick = () => {
                        if (driver && driver.seenTopics) {
                            driver.seenTopics.clear();
                            if (driver.stats) driver.stats.msgCount = 0;
                            list.innerHTML = '<div class="p-4 text-center text-xs editor-muted-text italic">History Cleared</div>';
                            syncCopyAllEnabled();
                        }
                    };

                    const updateList = (forceUpdate = false) => {
                        if (g.classList.contains('collapsed')) return;
                        if (isHovering && !forceUpdate) return;
                        if (!driver || !driver.seenTopics) return;

                        const now = Date.now();
                        if (!forceUpdate && now - lastRenderTime < 250) return;
                        
                        let currentMaxTimestamp = 0;
                        for (const data of driver.seenTopics.values()) {
                            if (data.timestamp > currentMaxTimestamp) currentMaxTimestamp = data.timestamp;
                        }
                        // Only force full DOM rebuild if a new message arrived or it's forced
                        if (!forceUpdate && typeof lastMaxTimestamp !== 'undefined' && currentMaxTimestamp === lastMaxTimestamp) {
                            return;
                        }
                        lastMaxTimestamp = currentMaxTimestamp;
                        lastRenderTime = now;
                        
                        const filter = filterInput.value.toLowerCase();
                        list.innerHTML = '';

                        const entries = Array.from(driver.seenTopics.entries())
                            .sort((a, b) => b[1].timestamp - a[1].timestamp);

                        if (entries.length === 0) {
                            list.innerHTML = '<div class="p-4 text-center text-xs editor-muted-text italic">Waiting for messages...</div>';
                            syncCopyAllEnabled();
                            return;
                        }

                        let renderedCount = 0;
                        for (let i = 0; i < entries.length; i++) {
                            const [topic, data] = entries[i];
                            if (filter && !topic.toLowerCase().includes(filter)) continue;
                            if (renderedCount >= 150) {
                                const overflowRow = document.createElement('div');
                                overflowRow.className = 'p-2 text-center text-xs editor-muted-text italic border-t editor-hairline editor-surface';
                                overflowRow.innerText = `+ ${entries.length - i} more topics hidden. Use filter to find them.`;
                                list.appendChild(overflowRow);
                                break;
                            }
                            renderedCount++;

                            let rawString = "";
                            if (data.payload === undefined) {
                                rawString = "undefined";
                            } else if (data.payload === null) {
                                rawString = "null";
                            } else if (typeof data.payload === 'object') {
                                try {
                                    rawString = JSON.stringify(data.payload);
                                } catch (e) {
                                    rawString = "[Unparsable Object]";
                                }
                            } else {
                                rawString = String(data.payload);
                            }

                            let fullValue = rawString.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                            let valDisplay = fullValue;

                            if (valDisplay.length > 50) valDisplay = valDisplay.substring(0, 50) + '...';

                            const row = document.createElement('div');
                            row.className = 'group flex items-center justify-between p-2 border-b editor-hairline editor-surface-hover transition-colors';

                            const info = document.createElement('div');
                            info.className = 'min-w-0 flex-1 mr-2';

                            let meta = null;
                            if (typeof Dashboard !== 'undefined' && Dashboard.topicMeta && Dashboard.topicMeta[topic]) {
                                meta = Dashboard.topicMeta[topic];
                            }
                            let tagHtml = '';
                            const isLocal = topic.startsWith('local/');
                            if (isLocal) {
                                tagHtml = UIUtils.createAccessLevelTag(true, true, false, false, true);
                            } else if (meta && typeof meta.getable !== 'undefined' && typeof meta.setable !== 'undefined') {
                                tagHtml = UIUtils.createAccessLevelTag(meta.getable, meta.setable);
                            } else if (meta && meta.isVariable) {
                                tagHtml = UIUtils.createAccessLevelTag(true, !!meta.setable);
                            } else if (meta && meta.isFlow) {
                                tagHtml = UIUtils.createAccessLevelTag(meta.capabilityId === 'enabled', meta.capabilityId !== 'enabled');
                            } else if (meta && meta.isMood) {
                                tagHtml = UIUtils.createAccessLevelTag(false, true);
                            } else {
                                tagHtml = UIUtils.createAccessLevelTag(false, false, false, true);
                            }

                            info.innerHTML = `
                                <div class="flex items-center gap-2">
                                    ${tagHtml}
                                    <div class="text-xs font-mono editor-accent-text font-bold truncate select-all" title="${topic}">${topic}</div>
                                    <div class="text-[9px] px-1 rounded editor-surface-raised editor-muted-text">${data.count}</div>
                                </div>
                                <div class="text-[10px] font-mono editor-muted-text truncate mt-0.5" title='${fullValue.replace(/'/g, "&#39;")}'>${valDisplay}</div>
                            `;

                            const actions = document.createElement('div');
                            actions.className = 'flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity';

                            const btnTopic = document.createElement('button');
                            btnTopic.className = 'btn-tool editor-muted-text editor-text-hover';
                            btnTopic.title = "Copy Topic Name";
                            btnTopic.innerHTML = '<i class="ph-bold ph-tag"></i>';
                            btnTopic.onclick = () => {
                                Editor.copyToClipboard(topic).then(() => {
                                    btnTopic.innerHTML = '<i class="ph-bold ph-check text-green-500"></i>';
                                    setTimeout(() => btnTopic.innerHTML = '<i class="ph-bold ph-tag"></i>', 1000);
                                }).catch(err => {
                                    if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                                        void CustomDialog.alert('Copy failed: ' + err, 'Copy Failed');
                                    }
                                });
                            };

                            const btnValue = document.createElement('button');
                            btnValue.className = 'btn-tool editor-muted-text editor-accent-hover';
                            btnValue.title = "Copy Raw Value";
                            btnValue.innerHTML = '<i class="ph-bold ph-brackets-curly"></i>';
                            btnValue.onclick = () => {
                                Editor.copyToClipboard(rawString).then(() => {
                                    btnValue.innerHTML = '<i class="ph-bold ph-check text-green-500"></i>';
                                    setTimeout(() => btnValue.innerHTML = '<i class="ph-bold ph-brackets-curly"></i>', 1000);
                                }).catch(err => {
                                    if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                                        void CustomDialog.alert('Copy failed: ' + err, 'Copy Failed');
                                    }
                                });
                            };

                            actions.appendChild(btnTopic);
                            actions.appendChild(btnValue);
                            row.appendChild(info);
                            row.appendChild(actions);
                            list.appendChild(row);
                        }
                        if (entries.length > 150) {
                            const overflowRow = document.createElement('div');
                            overflowRow.className = 'p-2 text-center text-xs editor-muted-text italic border-t editor-hairline editor-surface';
                            overflowRow.innerText = `+ ${entries.length - 150} more topics hidden. Use filter to find them.`;
                            list.appendChild(overflowRow);
                        }
                        syncCopyAllEnabled();
                    };

                    filterInput.addEventListener('input', () => updateList(true));

                    // WorkerTimer: live monitor must keep ticking right after page load (Chrome
                    // throttles main-thread setInterval below 1 Hz during cold-start window).
                    this.monitorInterval = WorkerTimer.setInterval(() => updateList(false), 250);
                    w.appendChild(galleryBtn);
                    w.appendChild(wrapper);
                    grid.appendChild(w);
                    return;
                }

                let labelText = this._resolveFieldLabel(f, values, isGlobal);
                const isSet = this._hasInstanceFieldOverride(f, isGlobal ? values : (overrides || {}), isGlobal);

                const canBind = MASTER_SETTINGS.dataDriver && !f.noBind &&
                    !['heading', 'list', 'font_list', 'preset_grid', 'driver_stats', 'topic_monitor', 'color_correction', 'topic', 'typography', 'icon_style', 'menu_list', 'light_list', 'graph_series_list', 'extra_output_topic_list', 'audio_topic_map', 'audio_trigger_map', 'widget_presets'].includes(f.type);

                const bindPath = (!isGlobal && typeof BindingsTree !== 'undefined')
                    ? Editor.bindingPathFromSchemaField(f)
                    : null;
                let nestedTopicVal;
                if (bindPath && currentBindings) {
                    nestedTopicVal = BindingsTree.getAtPath(currentBindings, bindPath);
                }
                // Nested: same “slot taken” rule as flat keys — presence at path counts, including '' (topic picker step).
                const isBound = canBind && (
                    bindPath
                        ? nestedTopicVal !== undefined
                        : (currentBindings && currentBindings[f.key] !== undefined)
                );

                if (isSet && !isBound) w.classList.add('field-is-set');

                const headerRow = document.createElement('div');
                headerRow.className = 'control-header-row';

                const curWidgetType = this._inspectorTooltipWidgetType(isGlobal);

                const lblSpan = document.createElement('span');
                lblSpan.className = 'control-label';
                if (f.key) lblSpan.setAttribute('data-editor-tooltip', f.key);
                if (curWidgetType) lblSpan.setAttribute('data-widget-type', curWidgetType);
                if (f.labelHelpLink && typeof HelpSystem !== 'undefined' && typeof HelpSystem.appendEditorLabelWithHelpLink === 'function') {
                    lblSpan.textContent = '';
                    HelpSystem.appendEditorLabelWithHelpLink(lblSpan, labelText, {
                        linkText: f.labelHelpLink.linkText || 'Help',
                        topic: f.labelHelpLink.topic,
                        widgetSub: f.labelHelpLink.widgetSub,
                        anchor: f.labelHelpLink.anchor
                    });
                } else if (f.labelExternalLink && typeof f.labelExternalLink.href === 'string' && f.labelExternalLink.href) {
                    lblSpan.textContent = '';
                    lblSpan.appendChild(document.createTextNode(labelText + ' ('));
                    const extA = document.createElement('a');
                    extA.href = f.labelExternalLink.href;
                    extA.className = 'editor-label-help-link';
                    extA.target = '_blank';
                    extA.rel = 'noopener noreferrer';
                    extA.textContent = f.labelExternalLink.linkText || 'Link';
                    lblSpan.appendChild(extA);
                    lblSpan.appendChild(document.createTextNode(')'));
                } else {
                    lblSpan.innerHTML = Editor._escapeControlLabel(labelText);
                }
                if (f.hint) lblSpan.title = f.hint;
                headerRow.appendChild(lblSpan);
                if (this.fieldRegistry && this.fieldRegistry[fKey]) {
                    this.fieldRegistry[fKey].labelEl = lblSpan;
                }

                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'control-header-actions' + (isBound ? ' control-header-actions--pinned' : '');

                let resetIcon = null;
                const canResetGlobal = isGlobal && f.key && !isBound && gid !== 'm_conn'
                    && !['heading', 'spacer', 'theme_toolbar', 'driver_stats', 'topic_monitor', 'menu_list', 'widget_presets'].includes(f.type);
                if ((!isGlobal && f.key !== 'metaName' && !isBound) || canResetGlobal) {
                    resetIcon = document.createElement('i');
                    resetIcon.className = 'ph-bold ph-arrow-counter-clockwise btn-reset text-xs editor-muted-text cursor-pointer transition-colors';
                    resetIcon.title = "Reset to Default";
                    this._setResetIdle(resetIcon, !isSet);

                    resetIcon.onclick = () => {
                        if (isGlobal) {
                            if (f.key === 'quickToolbarVisibility') {
                                if (typeof Dashboard !== 'undefined' && typeof Dashboard.setQuickToolbarPrefs === 'function') {
                                    Dashboard.setQuickToolbarPrefs({ visibility: 'auto' });
                                }
                                this._setSnapshotValue(f.key, 'auto');
                                if (w) w.classList.remove('field-is-set');
                                this._setResetIdle(resetIcon, true);
                                const qtReg = this.fieldRegistry && this.fieldRegistry[f.key];
                                if (qtReg && qtReg.inputEl) qtReg.inputEl.value = 'auto';
                                return;
                            }
                            let globalDefault = this._getGlobalFactoryDefault(f);
                            if (f && f.key === 'widgetLabelMode' && (globalDefault === undefined || globalDefault === null)) {
                                globalDefault = 'hover';
                            }
                            if (f && f.themeColorToken) {
                                const tc = { ...(MASTER_SETTINGS.themeColors || {}) };
                                tc[f.themeColorToken] = globalDefault;
                                Dashboard.updateGlobal({ themeColors: tc }, false);
                                this._setSnapshotValue(f.key, globalDefault);
                                return;
                            }
                            if (this._isCurrentDriverSettingKey(f.key)) {
                                const ds = { ...(MASTER_SETTINGS.driverSettings || {}) };
                                if (globalDefault === undefined) delete ds[f.key];
                                else ds[f.key] = globalDefault;
                                Dashboard.updateGlobal({ driverSettings: ds }, false);
                                this._setSnapshotValue(f.key, globalDefault);
                                return;
                            }
                            const payload = {};
                            payload[f.key] = globalDefault;
                            Dashboard.updateGlobal(payload, false);
                            this._setSnapshotValue(f.key, globalDefault);
                            return;
                        }
                        const widget = Dashboard.widgets[this.currentId];
                        if (widget) {
                            const freshOverrides = { ...widget.overrides };
                            if (!isGlobal && f.typographyNested) {
                                const tn = f.typographyNested;
                                const typ = { ...(freshOverrides.typography || {}) };
                                const roleObj = { ...(typ[tn.role] || {}) };
                                delete roleObj[tn.prop];
                                if (Object.keys(roleObj).length === 0) delete typ[tn.role];
                                else typ[tn.role] = roleObj;
                                if (Object.keys(typ).length === 0) delete freshOverrides.typography;
                                else freshOverrides.typography = typ;
                                delete freshOverrides[f.key];
                            } else if (!isGlobal && f.iconsNested) {
                                Editor._applyIconsNestedReset(widget, f, freshOverrides);
                            } else if (!isGlobal && f.iconColorOverridesNested) {
                                const io = f.iconColorOverridesNested;
                                const prev = { ...(freshOverrides.iconColorOverrides || {}) };
                                const slotObj = { ...(prev[io.slot] || {}) };
                                delete slotObj[io.prop];
                                if (Object.keys(slotObj).length === 0) delete prev[io.slot];
                                else prev[io.slot] = slotObj;
                                if (Object.keys(prev).length === 0) delete freshOverrides.iconColorOverrides;
                                else freshOverrides.iconColorOverrides = prev;
                                delete freshOverrides[f.key];
                            } else if (!isGlobal && f.layoutNested) {
                                const ln = f.layoutNested;
                                const layout = { ...(freshOverrides.layout || {}) };
                                const resp = { ...(layout.responsive || {}) };
                                delete resp[ln.prop];
                                if (ln.prop === 'cellHeightMode') delete resp.heightMode;
                                if (ln.prop === 'cellHeight') delete resp.height;
                                if (Object.keys(resp).length === 0) delete layout.responsive;
                                else layout.responsive = resp;
                                if (Object.keys(layout).length === 0) delete freshOverrides.layout;
                                else freshOverrides.layout = layout;
                                delete freshOverrides[f.key];
                            } else if (!isGlobal && f.containerNested && f.containerNested.path) {
                                const cpath = f.containerNested.path;
                                const box = JSON.parse(JSON.stringify(freshOverrides.container || {}));
                                if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.getAtPath === 'function') {
                                    const parentPath = cpath.slice(0, -1);
                                    const leaf = cpath[cpath.length - 1];
                                    const parent = parentPath.length ? SaveFormatV2.getAtPath(box, parentPath) : box;
                                    if (parent && typeof parent === 'object') {
                                        delete parent[leaf];
                                        delete parent[leaf + '_correct_en'];
                                        delete parent[leaf + '_correct_hue'];
                                        delete parent[leaf + '_correct_sat'];
                                        delete parent[leaf + '_correct_bri'];
                                        delete parent[leaf + '_correct_hue_fixed'];
                                        delete parent[leaf + '_correct_sat_fixed'];
                                        delete parent[leaf + '_correct_bri_fixed'];
                                    }
                                }
                                freshOverrides.container = box;
                                delete freshOverrides[f.key];
                            } else if (!isGlobal && f.objectNested) {
                                const on = f.objectNested;
                                const blob = { ...(freshOverrides[on.root] || {}) };
                                delete blob[on.prop];
                                if (Object.keys(blob).length === 0) delete freshOverrides[on.root];
                                else freshOverrides[on.root] = blob;
                                delete freshOverrides[f.key];
                            } else {
                                delete freshOverrides[f.key];
                            }

                            if (f.type === 'color') {
                                delete freshOverrides[f.key + '_correct_en'];
                                delete freshOverrides[f.key + '_correct_hue'];
                                delete freshOverrides[f.key + '_correct_sat'];
                                delete freshOverrides[f.key + '_correct_bri'];
                                delete freshOverrides[f.key + '_correct_hue_fixed'];
                                delete freshOverrides[f.key + '_correct_sat_fixed'];
                                delete freshOverrides[f.key + '_correct_bri_fixed'];
                            }
                            delete freshOverrides[f.key + '_bind_mapTrue'];
                            delete freshOverrides[f.key + '_bind_mapFalse'];
                            delete freshOverrides[f.key + '_bind_formula'];
                            delete freshOverrides[f.key + '_bind_transformMode'];

                            Dashboard.updateWidget(this.currentId, freshOverrides, true);
                            this._finishInspectorFieldReset(f, w, resetIcon, freshOverrides);
                        }
                    };
                    controlsDiv.appendChild(resetIcon);
                }

                if (isBound) {
                    const bindOptsBtn = document.createElement('button');
                    const mapActive = this.hasBindingMapActiveForField(f, overrides, isGlobal);
                    const formulaInvalid = this.hasBindingFormulaInvalidForField(f, overrides, isGlobal);
                    bindOptsBtn.className = 'btn-bind';
                    Editor.setBindAuxHighlight(bindOptsBtn, mapActive, formulaInvalid);
                    bindOptsBtn.title = 'Binding Options';
                    bindOptsBtn.innerHTML = '<i class="ph-bold ' + this.getBindingOptionsIconPh(f, overrides, isGlobal) + ' text-xs"></i>';
                    bindOptsBtn.onclick = (e) => {
                        e.stopPropagation();
                        this.openBindingOptionsPopup(f, bindOptsBtn, isGlobal);
                    };
                    controlsDiv.appendChild(bindOptsBtn);
                }

                if (canBind) {
                    const bindBtn = document.createElement('button');
                    if (isBound) {
                        bindBtn.className = 'btn-bind active transition-colors';
                    } else {
                        bindBtn.className = 'btn-bind transition-colors';
                    }
                    bindBtn.title = isBound ? "Unlink Topic" : "Link to Topic";
                    bindBtn.innerHTML = `<i class="ph ${isBound ? 'ph-link-break' : 'ph-link'} text-xs"></i>`;

                    bindBtn.onclick = () => {
                        if (isBound) {
                            if (bindPath) {
                                if (isGlobal) {
                                    const gb = JSON.parse(JSON.stringify(Dashboard.globalBindings || {}));
                                    BindingsTree.deleteAtPath(gb, bindPath);
                                    Dashboard.updateGlobalBinding(gb, true);
                                } else {
                                    const w = Dashboard.widgets[this.currentId];
                                    const b = JSON.parse(JSON.stringify((w && w.bindings) || {}));
                                    BindingsTree.deleteAtPath(b, bindPath);
                                    Dashboard.updateWidgetBinding(this.currentId, b, true);
                                }
                            } else {
                                const newB = { ...currentBindings };
                                delete newB[f.key];
                                if (isGlobal) Dashboard.updateGlobalBinding(newB, true);
                                else Dashboard.updateWidgetBinding(this.currentId, newB, true);
                            }

                            if (f.type === 'color' && !f.themeColorToken) {
                                const suffixes = [
                                    '_correct_en',
                                    '_correct_hue', '_correct_sat', '_correct_bri',
                                    '_correct_hue_fixed', '_correct_sat_fixed', '_correct_bri_fixed'
                                ];

                                if (isGlobal) {
                                    const resetPayload = {};
                                    suffixes.forEach(s => resetPayload[f.key + s] = false);
                                    resetPayload[f.key + '_correct_en'] = false;
                                    Dashboard.updateGlobal(resetPayload, true);
                                } else {
                                    const widget = Dashboard.widgets[this.currentId];
                                    if (widget) {
                                        const cleanOverrides = { ...widget.overrides };
                                        let changed = false;
                                        suffixes.forEach(s => {
                                            if (cleanOverrides[f.key + s] !== undefined) {
                                                delete cleanOverrides[f.key + s];
                                                changed = true;
                                            }
                                        });
                                        if (changed) {
                                            Dashboard.updateWidget(this.currentId, cleanOverrides, true);
                                        }
                                    }
                                }
                            }

                            const bindMapPayload = {};
                            bindMapPayload[f.key + '_bind_mapTrue'] = '';
                            bindMapPayload[f.key + '_bind_mapFalse'] = '';
                            bindMapPayload[f.key + '_bind_formula'] = '';
                            bindMapPayload[f.key + '_bind_transformMode'] = '';
                            if (isGlobal) {
                                Dashboard.updateGlobal(bindMapPayload, true);
                            } else {
                                const wUn = Dashboard.widgets[this.currentId];
                                if (wUn) {
                                    const co = { ...wUn.overrides };
                                    let ch = false;
                                    if (co[f.key + '_bind_mapTrue'] !== undefined) {
                                        delete co[f.key + '_bind_mapTrue'];
                                        ch = true;
                                    }
                                    if (co[f.key + '_bind_mapFalse'] !== undefined) {
                                        delete co[f.key + '_bind_mapFalse'];
                                        ch = true;
                                    }
                                    if (co[f.key + '_bind_formula'] !== undefined) {
                                        delete co[f.key + '_bind_formula'];
                                        ch = true;
                                    }
                                    if (co[f.key + '_bind_transformMode'] !== undefined) {
                                        delete co[f.key + '_bind_transformMode'];
                                        ch = true;
                                    }
                                    if (ch) {
                                        Dashboard.updateWidget(this.currentId, co, true);
                                    }
                                }
                            }
                        } else {
                            if (bindPath) {
                                const patch = {};
                                BindingsTree.setAtPath(patch, bindPath, '');
                                if (isGlobal) Dashboard.updateGlobalBinding(patch);
                                else Dashboard.updateWidgetBinding(this.currentId, patch);
                            } else if (isGlobal) {
                                Dashboard.updateGlobalBinding({ [f.key]: "" });
                            } else {
                                Dashboard.updateWidgetBinding(this.currentId, { [f.key]: "" });
                            }
                        }
                        this.loadWidget(this.currentId);
                    };
                    controlsDiv.appendChild(bindBtn);
                }

                this._appendHeaderActions(headerRow, controlsDiv);
                w.appendChild(headerRow);

                const saveValue = (val, skipReload = false, changedKey = f.key, colorCommitSource = null) => {
                    this._isEditorDrivenUpdate = true;
                    try {
                        if (isGlobal) {
                            if (f.key === 'quickToolbarVisibility') {
                                if (typeof Dashboard !== 'undefined' && typeof Dashboard.setQuickToolbarPrefs === 'function') {
                                    Dashboard.setQuickToolbarPrefs({ visibility: val });
                                }
                                this._setSnapshotValue(changedKey, val);
                                return;
                            }
                            if (f.themeColorToken && typeof MasterLayout !== 'undefined') {
                                const tc = { ...(MASTER_SETTINGS.themeColors || MasterLayout.defaultThemeColors()) };
                                tc[f.themeColorToken] = val;
                                Dashboard.updateGlobal({ themeColors: tc }, skipReload);
                                this._setSnapshotValue(changedKey, val);
                                return;
                            }
                            if (f.type === 'color' && f.editThemeLiteralWhenRefMatchesToken && typeof MasterLayout !== 'undefined'
                                    && !f.themeColorToken) {
                                const tok = f.editThemeLiteralWhenRefMatchesToken;
                                const expectedRef = '@' + tok;
                                const prev = MASTER_SETTINGS[f.key];
                                if (String(prev).trim() === expectedRef && !MasterLayout.isThemeTokenReference(val)) {
                                    const editLinkedTheme = colorCommitSource === 'slider' || colorCommitSource === 'usedSwatch';
                                    if (editLinkedTheme) {
                                        const tc = { ...(MASTER_SETTINGS.themeColors || MasterLayout.defaultThemeColors()) };
                                        tc[tok] = val;
                                        Dashboard.updateGlobal({ themeColors: tc }, skipReload);
                                        this._setSnapshotValue(changedKey, expectedRef);
                                        const slotKey = 'themeSlot_' + tok;
                                        const reg = this.fieldRegistry[slotKey];
                                        if (reg && typeof reg.colorPickerSync === 'function') {
                                            reg.colorPickerSync();
                                        }
                                        return;
                                    }
                                }
                            }
                            const currentDriverKey = MASTER_SETTINGS.dataDriver || 'nodered';
                            const DriverClass = DataDriverRegistry.drivers[currentDriverKey];
                            const isDriverSetting = DriverClass && Array.isArray(DriverClass.schema) && DriverClass.schema.some(s => s.key === f.key);

                            if (isDriverSetting) {
                                const newDriverSettings = {
                                    ...MASTER_SETTINGS.driverSettings,
                                    [f.key]: val
                                };
                                Dashboard.updateGlobal({ driverSettings: newDriverSettings }, skipReload);
                            } else {
                                Dashboard.updateGlobal({ [f.key]: val }, skipReload);
                            }
                        } else {
                            if (f.typographyNested) {
                                const wdg = Dashboard.widgets[this.currentId];
                                if (wdg) {
                                    const tn = f.typographyNested;
                                    const widgetPatch = Editor.buildWidgetTypographyNestedPatch(wdg, tn, val);
                                    if (widgetPatch) {
                                        Dashboard.updateWidget(this.currentId, widgetPatch);
                                        const ctorW = Object.getPrototypeOf(wdg).constructor;
                                        this._syncFollowerTypographyFromLeaderImmediate(wdg, tn, ctorW);
                                        Editor._maybeNotifyInspectorMergedConfigMayHaveChanged(
                                            this.currentId, widgetPatch, false, colorCommitSource
                                        );
                                    }
                                }
                            } else if (f.iconsNested) {
                                const wdg = Dashboard.widgets[this.currentId];
                                if (wdg) {
                                    const icn = f.iconsNested;
                                    const widgetPatch = Editor.buildWidgetIconsNestedPatch(wdg, icn, val);
                                    if (widgetPatch) {
                                        Dashboard.updateWidget(this.currentId, widgetPatch);
                                        const ctorW = Object.getPrototypeOf(wdg).constructor;
                                        this._syncFollowerIconSlotFromLeaderImmediate(wdg, icn, ctorW);
                                        Editor._maybeNotifyInspectorMergedConfigMayHaveChanged(
                                            this.currentId, widgetPatch, false, colorCommitSource
                                        );
                                    }
                                }
                            } else if (f.iconColorOverridesNested) {
                                const wdg = Dashboard.widgets[this.currentId];
                                if (wdg) {
                                    const io = f.iconColorOverridesNested;
                                    const prev = wdg.overrides.iconColorOverrides || {};
                                    const defOn = { enabled: false, color: '#ffffff' };
                                    const defOff = { enabled: false, color: '@thumb' };
                                    const on = { ...defOn, ...(prev.on && typeof prev.on === 'object' ? prev.on : {}) };
                                    const off = { ...defOff, ...(prev.off && typeof prev.off === 'object' ? prev.off : {}) };
                                    if (io.slot === 'on') on[io.prop] = val;
                                    else off[io.prop] = val;
                                    const iccPatch = { iconColorOverrides: { on: on, off: off } };
                                    Dashboard.updateWidget(this.currentId, iccPatch);
                                    Editor._maybeNotifyInspectorMergedConfigMayHaveChanged(
                                        this.currentId, iccPatch, false, colorCommitSource
                                    );
                                }
                            } else if (f.layoutNested) {
                                const wdg = Dashboard.widgets[this.currentId];
                                if (wdg) {
                                    const ln = f.layoutNested;
                                    const widgetPatch = Editor.buildWidgetLayoutNestedPatch(wdg, ln, val);
                                    if (widgetPatch) {
                                        Dashboard.updateWidget(this.currentId, widgetPatch);
                                        Editor._maybeNotifyInspectorMergedConfigMayHaveChanged(
                                            this.currentId, widgetPatch, false, colorCommitSource
                                        );
                                    }
                                }
                            } else if (f.containerNested) {
                                const wdg = Dashboard.widgets[this.currentId];
                                if (wdg) {
                                    const widgetPatch = Editor.buildWidgetContainerNestedPatch(wdg, f.containerNested, val);
                                    if (widgetPatch) {
                                        Dashboard.updateWidget(this.currentId, widgetPatch);
                                        Editor._maybeNotifyInspectorMergedConfigMayHaveChanged(
                                            this.currentId, widgetPatch, false, colorCommitSource
                                        );
                                    }
                                }
                            } else if (f.objectNested) {
                                const wdg = Dashboard.widgets[this.currentId];
                                if (wdg) {
                                    const widgetPatch = Editor.buildWidgetObjectNestedPatch(wdg, f.objectNested, val);
                                    if (widgetPatch) {
                                        Dashboard.updateWidget(this.currentId, widgetPatch);
                                        this._syncObjectNestedSnapshot(f.objectNested.root, widgetPatch[f.objectNested.root]);
                                        Editor._maybeNotifyInspectorMergedConfigMayHaveChanged(
                                            this.currentId, widgetPatch, false, colorCommitSource
                                        );
                                    }
                                }
                            } else {
                                if (typeof f.widgetTextPreviewDebounceMs === 'number' && f.widgetTextPreviewDebounceMs > 0 && this.currentId) {
                                    this._queueWidgetTextFieldPreview(this.currentId, f.key, val, f.widgetTextPreviewDebounceMs);
                                } else {
                                    const simplePatch = {};
                                    simplePatch[f.key] = val;
                                    Dashboard.updateWidget(this.currentId, simplePatch);
                                }
                            }
                            if (changedKey === 'itemCount') {
                                setTimeout(() => {
                                    if (this.currentId && Dashboard.widgets && Dashboard.widgets[this.currentId]) {
                                        this.loadWidget(this.currentId);
                                    }
                                }, 100);
                            }
                        }
                        this._setSnapshotValue(changedKey, val);
                    } finally {
                        this._isEditorDrivenUpdate = false;
                        if (f.type === 'color' && typeof EditorColorPicker !== 'undefined'
                                && typeof EditorColorPicker.refreshUsedCustomSwatches === 'function') {
                            EditorColorPicker.refreshUsedCustomSwatches();
                        }
                    }
                };

                let inp;
                let skipAppendColorPickerInput = false;
                let textareaPanelMount = null;
                let imagePickerMount = null;

                let rawValue = this._resolveInspectorFieldRawValue(f, values, overrides, isGlobal, mergedStatic);
                if (rawValue === undefined || rawValue === null) {
                    const schemaDefault = this._getGlobalFactoryDefault(f);
                    if (schemaDefault !== undefined) rawValue = schemaDefault;
                }
                if (!isGlobal && f.key === 'responsiveOrder' && (rawValue === undefined || rawValue === null) && this.currentId
                        && typeof Dashboard !== 'undefined' && typeof Dashboard.resolveResponsiveWidgetOrder === 'function') {
                    rawValue = Dashboard.resolveResponsiveWidgetOrder(this.currentId);
                }

                if (isBound) {
                    const topicCur = bindPath
                        ? String(BindingsTree.getAtPath(currentBindings, bindPath) || '')
                        : String((currentBindings && currentBindings[f.key]) || '');
                    const confirmTextTopic = (!isGlobal && !bindPath && f.key === 'text')
                        ? (topic) => { this._recountTextColumnsAfterTopicConfirm(topic); }
                        : undefined;
                    const wrap = this.createTopicDropdown(topicCur, 'msg.topic', (val) => {
                        if (bindPath) {
                            const patch = {};
                            BindingsTree.setAtPath(patch, bindPath, val);
                            if (isGlobal) Dashboard.updateGlobalBinding(patch);
                            else Dashboard.updateWidgetBinding(this.currentId, patch);
                        } else if (isGlobal) {
                            Dashboard.updateGlobalBinding({ [f.key]: val });
                        } else {
                            Dashboard.updateWidgetBinding(this.currentId, { [f.key]: val });
                        }
                    }, '', false, false, confirmTextTopic);
                    if (f.key && this.fieldRegistry[f.key]) this.fieldRegistry[f.key].inputEl = wrap.querySelector('input');
                    w.appendChild(this._ensureFieldControl(wrap));
                } else {
                    if (f.type === 'select') {
                        const resolvedOptions = this._resolveFieldOptions(f, values, isGlobal);
                        if (typeof f.dynamicOptions === 'function' && f.key && this.fieldRegistry[f.key]) {
                            this.fieldRegistry[f.key]._optionsSignature = Editor._schemaOptionsSignature(resolvedOptions);
                        }

                        inp = Editor.createCustomSelect(resolvedOptions, rawValue);
                        inp.addEventListener('change', (e) => {
                            saveValue(e.target.value, true);
                            this._markFieldAsCustom(w, resetIcon);

                            if (f.previewAnimationOnChange && f.animationSlot && !isGlobal && this.currentId
                                && typeof WidgetAnimations !== 'undefined'
                                && typeof WidgetAnimations.previewOnce === 'function') {
                                const previewWidget = Dashboard.widgets[this.currentId];
                                if (previewWidget) {
                                    setTimeout(function () {
                                        WidgetAnimations.previewOnce(previewWidget, f.animationSlot);
                                    }, 0);
                                }
                            }

                            if (f.key === 'layoutMode' && e.target.value === 'responsive') {
                                if (typeof Dashboard.seedResponsiveOrderFromFixedPositions === 'function') {
                                    Dashboard.seedResponsiveOrderFromFixedPositions();
                                }
                                // Keep the current Resolution preset / canvas width. The
                                // responsive grid lives inside that width and only drops
                                // below it when the window is narrower than the resolution.
                            }
                            if (isGlobal && f.key === 'layoutMode') {
                                requestAnimationFrame(function () {
                                    Editor.renderGlobalEditor();
                                });
                            }

                            if (f.key === 'canvasPreset') {
                                const parts = e.target.value.split(',');
                                if (parts.length === 2) {
                                    const w = parseInt(parts[0]);
                                    const h = parseInt(parts[1]);
                                    if (!isNaN(w) && !isNaN(h)) {
                                        Dashboard.updateGlobal({ canvasWidth: w, canvasHeight: h });
                                    }
                                }
                            }
                            if (!isGlobal && f.key === 'actionType' && e.target.value === 'page' && this.currentId) {
                                const sw = Dashboard.widgets[this.currentId];
                                if (sw && sw.constructor && sw.constructor.name === 'SwitchWidget') {
                                    this._isEditorDrivenUpdate = true;
                                    try {
                                        Dashboard.updateWidget(this.currentId, { selectionGroup: '' });
                                        this._setSnapshotValue('selectionGroup', '');
                                    } finally {
                                        this._isEditorDrivenUpdate = false;
                                    }
                                }
                            }
                            if (f.key !== 'dataDriver') {
                                this._handleFieldDependencyChange(f.key, 'change');
                            }
                        });
                    } else if (f.type === 'font_list') {
                        const wrap = document.createElement('div');
                        wrap.className = 'w-full flex flex-col gap-2 mt-1 col-span-12';

                        let arr = Array.isArray(rawValue) ? [...rawValue] : [];

                        const renderList = () => {
                            wrap.innerHTML = '';
                            arr.forEach((fontName, idx) => {
                                const row = document.createElement('div');
                                row.className = 'flex items-center w-full relative mb-1';

                                const fInp = document.createElement('input');
                                fInp.type = 'text';
                                fInp.className = 'control-input editor-accent-text font-mono text-xs editor-surface-inset editor-hairline pr-7 pl-3 w-full rounded-r-none';
                                fInp.placeholder = 'e.g. Pacifico';
                                fInp.value = fontName || '';

                                const statusIcon = document.createElement('i');
                                statusIcon.className = 'ph-bold ph-check absolute right-10 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none transition-opacity';
                                statusIcon.style.opacity = fontName ? '1' : '0';

                                fInp.onchange = async (e) => {
                                    // Normalize: Google Fonts family names use spaces, not '+'.
                                    // The css2 API treats '+' as a space, so a literal '+' would
                                    // validate but save a name that never matches the loaded @font-face.
                                    const val = e.target.value.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim();
                                    fInp.value = val;
                                    if (!val) {
                                        arr[idx] = '';
                                        const cleaned = arr.filter(v => v !== '');
                                        saveValue(cleaned, true);
                                        if (window.Dashboard && Dashboard.loadFonts) Dashboard.loadFonts(cleaned);
                                        renderList();
                                        return;
                                    }

                                    statusIcon.className = 'ph-bold ph-spinner animate-spin absolute right-10 top-1/2 -translate-y-1/2 editor-accent-text pointer-events-none';
                                    statusIcon.style.opacity = '1';

                                    try {
                                        const url = `https://fonts.googleapis.com/css2?family=${val.replace(/ /g, '+')}&display=swap`;
                                        const res = await fetch(url);
                                        if (res.ok) {
                                            arr[idx] = val;
                                            statusIcon.className = 'ph-bold ph-check absolute right-10 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none';
                                            const cleaned = arr.filter(v => v !== '');
                                            saveValue(cleaned, true);
                                            // Force re-render of Editor to update all dropdowns
                                            if (window.Dashboard && Dashboard.loadFonts) Dashboard.loadFonts(cleaned);
                                            setTimeout(() => this.loadWidget(this.currentId), 100);
                                        } else {
                                            statusIcon.className = 'ph-bold ph-warning absolute right-10 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none';
                                            CustomDialog.alert(`Could not find font '${val}'. Check spelling on fonts.google.com.`, "Font Validation Error");
                                            fInp.value = fontName; // Revert to last known good
                                        }
                                    } catch (err) {
                                        statusIcon.className = 'ph-bold ph-warning absolute right-10 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none';
                                        CustomDialog.alert(
                                            `Could not validate font '${val}'.\n\n` +
                                            `Make sure you are using the exact system name. On fonts.google.com:\n` +
                                            `1. Check the URL of the font's page (e.g., .../specimen/Noto+Sans+JP).\n` +
                                            `2. Look at the very last part of the URL after specimen/: Noto+Sans+JP.\n` +
                                            `3. Replace the plus signs (+) with spaces.\n\n` +
                                            `This will almost always give you the exact programmatic name of the font: Noto Sans JP.`,
                                            "Font Not Found / Invalid Name"
                                        );
                                        fInp.value = fontName;
                                    }
                                };

                                const fDel = document.createElement('button');
                                fDel.className = 'btn-tool danger w-8 px-0 flex-shrink-0 rounded-l-none border-l-0';
                                fDel.title = "Remove Font";
                                fDel.innerHTML = '<i class="ph-bold ph-trash"></i>';
                                fDel.onclick = () => {
                                    arr.splice(idx, 1);
                                    const cleaned = arr.filter(v => v !== '');
                                    saveValue(cleaned, true);
                                    if (window.Dashboard && Dashboard.loadFonts) Dashboard.loadFonts(cleaned);
                                    renderList();
                                    setTimeout(() => this.loadWidget(this.currentId), 100);
                                };

                                row.appendChild(fInp);
                                row.appendChild(statusIcon);
                                row.appendChild(fDel);
                                wrap.appendChild(row);
                            });

                            const fAdd = document.createElement('button');
                            fAdd.className = 'btn-tool text-[10px] py-1 mt-1 border editor-hairline w-full justify-center editor-accent-text editor-accent-hover';
                            fAdd.innerHTML = '<i class="ph-bold ph-plus"></i> Add Google Font';
                            fAdd.onclick = () => {
                                arr.push('');
                                renderList();
                            };
                            wrap.appendChild(fAdd);
                        };

                        renderList();
                        w.classList.replace(`col-span-${f.cols}`, 'col-span-12');
                        w.appendChild(wrap);
                        grid.appendChild(w);
                        return;

                    } else if (f.type === 'typography') {
                        headerRow.style.display = 'none'; // Hide generic label, we use a sleek block

                        const typoStateKey = `typo_ui_${isGlobal ? 'global' : this.currentId}_${f.key || 'typo'}`;
                        const typoGroupId = `typo_fields_${isGlobal ? 'global' : this.currentId}_${f.key || 'typo'}`;

                        const wrapCard = document.createElement('div');
                        wrapCard.className = 'editor-collapse-card editor-collapse-card--closed mt-1 col-span-12';

                        const btn = document.createElement('div');
                        btn.className = 'editor-collapse-header';
                        if (f.key) btn.setAttribute('data-editor-tooltip', f.key);
                        if (curWidgetType) btn.setAttribute('data-widget-type', curWidgetType);

                        const typoIcon = document.createElement('i');
                        typoIcon.className = 'ph-fill ph-text-t mr-3 flex-shrink-0 text-[var(--ui-accent)] text-lg pointer-events-none';

                        const titleBlock = document.createElement('div');
                        titleBlock.className = 'flex items-center gap-2 min-w-0 flex-1 pointer-events-none truncate';
                        const rawTypoSuffix = f.typographyHeaderSuffix;
                        const defaultTypoSuffix = (typeof BaseWidget !== 'undefined' && BaseWidget.TYPOGRAPHY_HEADER_SUFFIX)
                            ? BaseWidget.TYPOGRAPHY_HEADER_SUFFIX
                            : 'Typography';
                        const typoSuffix = (rawTypoSuffix !== undefined && rawTypoSuffix !== null && String(rawTypoSuffix).trim() !== '')
                            ? String(rawTypoSuffix).trim()
                            : defaultTypoSuffix;
                        const titlePrimary = this.fillEditorCollapseTitle(
                            titleBlock,
                            (typeof f.dynamicLabel === 'function' ? f.dynamicLabel(values, isGlobal) : f.label) || '',
                            typoSuffix
                        );
                        if (this.fieldRegistry && this.fieldRegistry[fKey]) {
                            this.fieldRegistry[fKey].labelEl = titlePrimary;
                        }

                        const chevron = document.createElement('i');
                        chevron.className = 'ph-bold ph-caret-down text-[var(--ui-text-muted)] transition-transform duration-200 flex-shrink-0';

                        btn.appendChild(typoIcon);
                        btn.appendChild(titleBlock);
                        btn.appendChild(chevron);
                        
                        const subGrid = document.createElement('div');
                        subGrid.className = 'editor-collapse-content hidden flex flex-col gap-3';

                        this.attachPersistedEditorCollapse(typoStateKey, btn, subGrid, chevron, { chevronAccent: 'var(--ui-accent)' });

                        w.classList.replace(`col-span-${f.cols}`, 'col-span-12');
                        wrapCard.appendChild(btn);
                        wrapCard.appendChild(subGrid);
                        w.appendChild(wrapCard);
                        grid.appendChild(w);

                        const oldContainer = this.container;
                        this.container = subGrid;
                        try {
                            this.renderSchema([{
                                id: typoGroupId, title: '', icon: '',
                                editorTier: f.editorTier != null ? f.editorTier : group.editorTier,
                                fields: f.fields || []
                            }], values, overrides, bindings, isGlobal);
                        } finally {
                            this.container = oldContainer;
                        }
                        return;

                    } else if (f.type === 'icon_style') {
                        headerRow.style.display = 'none';

                        const km = f.iconStyleKeyMap || {};
                        const iconStateKey = `icon_style_ui_${isGlobal ? 'global' : this.currentId}_${f.key || 'icon'}`;
                        const iconGroupId = `icon_style_fields_${isGlobal ? 'global' : this.currentId}_${f.key || 'icon'}`;

                        w.classList.replace(`col-span-${f.cols}`, 'col-span-12');

                        const { subGrid, previewSlot } = this.createIconStyleCollapsibleSection(w, {
                            titleLabel: f.label || '',
                            headerSuffix: f.iconStyleHeaderSuffix,
                            collapseStateKey: iconStateKey,
                            tooltipKey: f.key,
                            widgetType: curWidgetType,
                            cardClassName: 'editor-collapse-card editor-collapse-card--closed mt-1 w-full',
                            contentClassName: 'editor-collapse-content hidden flex flex-col gap-3',
                            chevronOpts: { chevronAccent: 'var(--ui-accent)' }
                        });

                        grid.appendChild(w);

                        const oldContainer = this.container;
                        this.container = subGrid;
                        try {
                            this.renderSchema([{
                                id: iconGroupId, title: '', icon: '',
                                editorTier: f.editorTier != null ? f.editorTier : group.editorTier,
                                fields: f.fields || []
                            }], values, overrides, bindings, isGlobal);
                        } finally {
                            this.container = oldContainer;
                        }

                        const applyIconHeaderPreview = () => {
                            Editor.fillIconStyleHeaderPreview(previewSlot, km, () => ({
                                ...(values || {}),
                                ...(this.currentValuesSnapshot || {})
                            }), null, {
                                isGlobal: isGlobal === true,
                                fields: f.fields || []
                            });
                        };
                        applyIconHeaderPreview();
                        // Register so _syncFollowerIconSlotFromLeaderImmediate can refresh the Off preview instantly.
                        if (!Editor._iconStylePreviewCallbacks) Editor._iconStylePreviewCallbacks = {};
                        Editor._iconStylePreviewCallbacks[km.source || ('__' + (f.key || 'icon'))] = applyIconHeaderPreview;
                        const watchKeys = [km.source, km.builtin, km.weight, km.customUrl, km.tintImage].filter(Boolean);
                        watchKeys.forEach((wk) => {
                            const reg = this.fieldRegistry[wk];
                            if (reg && reg.inputEl) {
                                reg.inputEl.addEventListener('input', applyIconHeaderPreview);
                                reg.inputEl.addEventListener('change', applyIconHeaderPreview);
                            }
                        });

                        return;

                    } else if (f.type === 'mode_toggle') {
                        // Button-styled checkbox: toggles this widget's editor mode override.
                        // Global basic -> "Show Advanced Settings" (force_advanced).
                        // Global advanced -> "Force Basic Settings" (force_basic).
                        headerRow.style.display = 'none';
                        const globalMode = this.getUiMode();
                        const forceValue = globalMode === 'basic' ? 'force_advanced' : 'force_basic';
                        const isActive = rawValue === forceValue;
                        const label = globalMode === 'basic' ? 'Show Advanced Settings' : 'Force Basic Settings';
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'btn-tool w-full justify-center' + (isActive ? ' primary' : '');
                        btn.textContent = label;
                        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                        btn.title = isActive
                            ? 'Revert this widget to the dashboard editor mode.'
                            : (globalMode === 'basic'
                                ? 'Show all advanced settings for this widget only.'
                                : 'Show only basic settings for this widget only.');
                        btn.onclick = () => {
                            if (isActive) {
                                // Off = follow dashboard editor mode: drop the stored override.
                                const widget = Dashboard.widgets[this.currentId];
                                if (widget) {
                                    const freshOverrides = { ...widget.overrides };
                                    delete freshOverrides.editorModeOverride;
                                    Dashboard.updateWidget(this.currentId, freshOverrides, true);
                                }
                            } else {
                                saveValue(forceValue);
                            }
                            if (this.currentId && this.currentId !== 'MULTIPLE') {
                                this.loadWidget(this.currentId);
                            }
                        };
                        w.appendChild(this._ensureFieldControl(btn));
                        grid.appendChild(w);
                        return;

                    } else if (f.type === 'checkbox') {
                        const { wrap, input } = this.createToggleStyleCheckboxRow(rawValue, (checked) => {
                            saveValue(checked, true);
                            let isNowCustom = false;
                            if (isGlobal) {
                                const defVal = this._getGlobalFactoryDefault(f);
                                isNowCustom = this._valuesDifferForEditor(checked, defVal);
                            } else {
                                const curWidget = Dashboard.widgets[this.currentId];
                                isNowCustom = !!(curWidget && this._hasInstanceFieldOverride(f, curWidget.overrides || {}, false));
                            }
                            if (isNowCustom) {
                                this._markFieldAsCustom(w, resetIcon);
                            } else {
                                if (w) w.classList.remove('field-is-set');
                                this._setResetIdle(resetIcon, true);
                            }
                            if (!isGlobal && f.key === 'locked' && this.currentId && this.currentId !== 'MULTIPLE') {
                                this.updateToolbarState();
                                this.loadWidget(this.currentId);
                            } else {
                                this._handleFieldDependencyChange(f.key, 'change');
                            }
                        }, f.hint ? { title: f.hint } : {});
                        inp = input;
                        if (f.key && this.fieldRegistry[f.key]) this.fieldRegistry[f.key].inputEl = inp;
                        w.appendChild(this._ensureFieldControl(wrap));
                        grid.appendChild(w);
                        return;
                    } else if (f.type === 'icon_input') {
                        const wrap = document.createElement('div');
                        wrap.className = 'flex gap-1';
                        inp = document.createElement('input');
                        inp.type = 'text';
                        inp.className = 'control-input rounded-r-none';
                        inp.value = rawValue || "";
                        const weightKey = f.weightFieldKey || null;
                        const iconPhClassFromValues = (cls, vals) => {
                            const bag = vals || values;
                            let w = 'fill';
                            if (weightKey && bag[weightKey] != null && String(bag[weightKey]).trim() !== '') {
                                w = String(bag[weightKey]).toLowerCase().trim();
                            }
                            return `${BaseWidget.phosphorWeightClass(w)} ${cls || 'ph-star'} text-lg`;
                        };

                        const btn = document.createElement('button');
                        btn.className = 'btn-tool w-10 flex-shrink-0 rounded-l-none border-l-0';
                        const btnIcon = document.createElement('i');
                        btn.appendChild(btnIcon);

                        const syncBtnIcon = (vals) => {
                            const nextClass = iconPhClassFromValues(inp.value, vals);
                            if (btnIcon.className !== nextClass) btnIcon.className = nextClass;
                        };

                        inp.addEventListener('change', (e) => {
                            saveValue(e.target.value);
                            syncBtnIcon();
                            this._handleFieldDependencyChange(f.key, 'change');
                        });
                        inp.addEventListener('input', () => {
                            syncBtnIcon();
                            this._markFieldAsCustom(w, resetIcon);
                        });
                        btn.onclick = () => {
                            Dashboard.openIconBrowser(inp.value || 'ph-star', (newIcon) => {
                                inp.value = newIcon;
                                syncBtnIcon();
                                inp.dispatchEvent(new Event('change'));
                                this._markFieldAsCustom(w, resetIcon);
                            });
                        };
                        syncBtnIcon();
                        inp._syncIconInputBtn = function () { syncBtnIcon(); };
                        wrap.appendChild(inp); wrap.appendChild(btn);
                        const iconInputReg = f.key ? this.fieldRegistry[f.key] : null;
                        if (iconInputReg) {
                            iconInputReg.inputEl = inp;
                            // The preview glyph renders in the weight selected by the sibling Style field.
                            if (weightKey) iconInputReg.syncDynamicContent = (vals) => syncBtnIcon(vals);
                        }
                        w.appendChild(this._ensureFieldControl(wrap));
                        grid.appendChild(w);
                        return;
                    } else if (f.type === 'textarea') {
                        inp = document.createElement('textarea');
                        inp.className = 'control-input';
                        inp.style.fontFamily = "'JetBrains Mono', monospace";
                        inp.value = (rawValue !== undefined && rawValue !== null) ? rawValue : "";
                        inp.addEventListener('input', (e) => {
                            saveValue(e.target.value, true);
                            if (f.deferDependencyUntilBlur !== true) {
                                this._handleFieldDependencyChange(f.key, 'input');
                            }
                            this._markFieldAsCustom(w, resetIcon);
                        });
                        if (f.deferDependencyUntilBlur === true) {
                            inp.addEventListener('blur', () => {
                                this._handleFieldDependencyChange(f.key, 'change');
                            });
                        }
                        if (f.fullMarkdownEditor) {
                            const col = document.createElement('div');
                            col.className = 'w-full flex flex-col gap-2';
                            col.appendChild(inp);
                            const feRow = document.createElement('div');
                            feRow.className = 'flex justify-start';
                            const feBtn = document.createElement('button');
                            feBtn.type = 'button';
                            feBtn.className = 'btn-tool primary text-xs';
                            feBtn.textContent = 'Full editor';
                            const self = this;
                            const sv = saveValue;
                            feBtn.onclick = function () {
                                if (typeof TextFullEditor === 'undefined' || typeof TextFullEditor.open !== 'function') {
                                    if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                                        void CustomDialog.alert('Full editor is not available.', 'Editor');
                                    }
                                    return;
                                }
                                TextFullEditor.open({
                                    getText: function () { return inp.value; },
                                    setText: function (v, meta) {
                                        inp.value = v;
                                        if (meta && meta.flush && typeof Editor.flushPendingTextPreview === 'function') {
                                            Editor.flushPendingTextPreview();
                                        }
                                        sv(v, true);
                                    },
                                    onClose: function () {
                                        if (f.deferDependencyUntilBlur === true) {
                                            self._handleFieldDependencyChange(f.key, 'change');
                                        }
                                    },
                                    mainTextarea: inp,
                                    fieldKey: f.key,
                                    helpLabelLink: f.labelHelpLink || null
                                });
                            };
                            feRow.appendChild(feBtn);
                            col.appendChild(feRow);
                            textareaPanelMount = col;
                        }
                    } else if (f.type === 'dynamic_number_list') {
                        const wrap = document.createElement('div');
                        wrap.className = 'w-full grid grid-cols-4 gap-2';
                        const listReg = f.key ? this.fieldRegistry[f.key] : null;

                        const resolveItems = (vals, ig) => (typeof f.dynamicItems === 'function')
                            ? (f.dynamicItems(vals, ig) || [])
                            : [];

                        // Row set identity: count plus labels. Cheap enough to evaluate on every
                        // reactive pass and stable while the user types values into the rows.
                        const itemsSignature = (items) => {
                            let sig = String(items.length);
                            for (let n = 0; n < items.length; n++) {
                                const it = items[n];
                                sig += '\u0001' + ((it && it.label != null) ? it.label : '');
                            }
                            return sig;
                        };

                        const renderRows = (items) => {
                            wrap.textContent = '';
                            const storedRaw = (this.currentValuesSnapshot && this.currentValuesSnapshot[f.key] !== undefined)
                                ? this.currentValuesSnapshot[f.key]
                                : rawValue;
                            const storedObj = (storedRaw && typeof storedRaw === 'object') ? storedRaw : {};
                            const columns = Array.isArray(storedObj.columns) ? storedObj.columns.slice() : [];
                            for (let idx = 0; idx < items.length; idx++) {
                                const item = items[idx] || {};
                                const row = document.createElement('div');
                                row.className = 'w-full min-w-0 flex flex-col gap-1';
                                const rowLabel = document.createElement('label');
                                rowLabel.className = 'control-label';
                                rowLabel.textContent = item.label || ('Column ' + (idx + 1));
                                if (f.key) {
                                    rowLabel.setAttribute('data-editor-tooltip', f.key);
                                    this._stampTooltipWidgetType(rowLabel, this._inspectorTooltipWidgetType(isGlobal));
                                }
                                const rowInput = document.createElement('input');
                                rowInput.type = 'number';
                                rowInput.className = 'control-input';
                                rowInput.min = String(item.min != null ? item.min : 0);
                                const init = parseInt(String(item.value != null ? item.value : 0), 10);
                                const safeInit = isNaN(init) || init < 0 ? 0 : init;
                                rowInput.value = String(safeInit);
                                // Keep the persisted array dense so newly added columns never save as holes.
                                if (columns[idx] === undefined || columns[idx] === null) columns[idx] = safeInit;
                                const rowIndex = idx;
                                rowInput.addEventListener('input', (e) => {
                                    const rawNum = parseInt(String(e.target.value), 10);
                                    columns[rowIndex] = isNaN(rawNum) || rawNum < 0 ? 0 : rawNum;
                                    saveValue({ columns: columns.slice(0, items.length) }, true);
                                    this._markFieldAsCustom(w, resetIcon);
                                });
                                row.appendChild(rowLabel);
                                row.appendChild(rowInput);
                                wrap.appendChild(row);
                            }
                        };

                        const initialItems = resolveItems(values, isGlobal);
                        renderRows(initialItems);
                        if (listReg) {
                            listReg._dynamicListSignature = itemsSignature(initialItems);
                            // Rows depend on sibling values (mode + source text), so rebuild them in
                            // place instead of relying on a full inspector reload.
                            listReg.syncDynamicContent = (vals, ig) => {
                                const nextItems = resolveItems(vals, ig);
                                const sig = itemsSignature(nextItems);
                                if (sig === listReg._dynamicListSignature) return;
                                listReg._dynamicListSignature = sig;
                                renderRows(nextItems);
                                // Drop widths past the visible count (detected table, or Amount of Columns
                                // once the user has stored it). Leave a longer saved list alone when the
                                // count field is still at its unset default.
                                const storedRaw = (this.currentValuesSnapshot && this.currentValuesSnapshot[f.key] !== undefined)
                                    ? this.currentValuesSnapshot[f.key]
                                    : rawValue;
                                const storedObj = (storedRaw && typeof storedRaw === 'object') ? storedRaw : {};
                                const storedCols = Array.isArray(storedObj.columns) ? storedObj.columns : [];
                                if (storedCols.length <= nextItems.length) return;
                                const textSrc = (vals && vals.text) ? vals.text : '';
                                const detected = (typeof TextWidget !== 'undefined' && typeof TextWidget.getMaxMarkdownTableColumnCount === 'function')
                                    ? TextWidget.getMaxMarkdownTableColumnCount(textSrc)
                                    : 0;
                                const widget = (typeof Dashboard !== 'undefined') ? Dashboard.widgets[this.currentId] : null;
                                // A live topic table only changes how many spinners are shown.
                                if (!(detected > 0) && widget && typeof widget.liveMarkdownTableColumnCount === 'function'
                                        && widget.liveMarkdownTableColumnCount(textSrc) > 0) {
                                    return;
                                }
                                const manualSet = !!(widget && widget.overrides
                                    && Object.prototype.hasOwnProperty.call(widget.overrides, 'mdTableCustomColumnCount'));
                                if (nextItems.length === 0 && detected <= 0 && !manualSet) return;
                                const next = [];
                                for (let i = 0; i < nextItems.length; i++) {
                                    const n = parseInt(String(storedCols[i]), 10);
                                    next.push(isNaN(n) || n < 0 ? 0 : n);
                                }
                                saveValue({ columns: next }, true);
                            };
                        }
                        w.appendChild(wrap);
                        grid.appendChild(w);
                        return;
                    } else if (f.type === 'topic') {
                        const rawStr = (rawValue !== undefined && rawValue !== null) ? rawValue : "";
                        const wrap = this.createTopicDropdown(rawStr, 'Select topic...', (val) => {
                            saveValue(val, true);
                            this._markFieldAsCustom(w, resetIcon);
                        });
                        const topicInp = wrap.querySelector('input');
                        topicInp.addEventListener('blur', () => {
                            // `dependsOn` refresh after commit only; per-keypress reload would steal focus (e.g. Switch outputTopic → actionType).
                            this._handleFieldDependencyChange(f.key, 'change');
                        });
                        if (f.key && this.fieldRegistry[f.key]) this.fieldRegistry[f.key].inputEl = topicInp;
                        w.appendChild(this._ensureFieldControl(wrap));
                        grid.appendChild(w);
                        return;
                    } else if (f.type === 'preset_grid') {
                        let presetArr = Array.isArray(rawValue) ? [...rawValue] : JSON.parse(JSON.stringify(MASTER_SETTINGS.defaultLightGridPresets || []));
                        const gridObj = this.createDynamicPresetGrid(presetArr, (newArr) => {
                            saveValue(newArr, true);
                        });
                        w.appendChild(gridObj.wrap);
                        grid.appendChild(w);
                        return;
                    } else if (f.type === 'extra_output_topic_list') {
                        const wrap = document.createElement('div');
                        wrap.className = 'w-full flex flex-col gap-2 col-span-12';

                        let arr = Array.isArray(rawValue) ? rawValue.slice() : [];
                        if (typeof rawValue === 'string') {
                            try { arr = JSON.parse(rawValue); } catch (e) { arr = []; }
                        }
                        if (!Array.isArray(arr)) arr = [];
                        if (typeof SwitchWidget !== 'undefined' && typeof SwitchWidget.normalizeExtraOutputTopics === 'function') {
                            arr = SwitchWidget.normalizeExtraOutputTopics(arr);
                        }

                        const topicsContainer = document.createElement('div');
                        wrap.appendChild(topicsContainer);

                        const resolveSwitchMode = (vals) => vals.mode || vals.defaultSwitchMode || 'toggle';
                        const resolveSeparateTopics = (vals, ig) => typeof SwitchWidget !== 'undefined'
                            && typeof SwitchWidget.useSeparateOnOffTopics === 'function'
                            && SwitchWidget.useSeparateOnOffTopics(vals, ig) === true;
                        const topicsPanelOptions = {
                            mode: 'withPayloads',
                            entries: arr,
                            switchMode: resolveSwitchMode(values),
                            separateOnOffTopics: resolveSeparateTopics(values, isGlobal),
                            showHoldToActivate: true,
                            headerLabel: 'Additional Output Topics',
                            addButtonLabel: 'Add Output topic',
                            tooltipPrefix: 'extra',
                            onChange: (list, persistImmediate) => {
                                const normalized = (typeof SwitchWidget !== 'undefined' && typeof SwitchWidget.normalizeExtraOutputTopics === 'function')
                                    ? SwitchWidget.normalizeExtraOutputTopics(list)
                                    : list;
                                saveValue(normalized, persistImmediate === true);
                                this._markFieldAsCustom(w, resetIcon);
                                this._handleFieldDependencyChange(f.key, 'change');
                            }
                        };
                        const topicsPanel = Editor.renderOutputTopicsPanel(topicsContainer, topicsPanelOptions);
                        const topicsReg = f.key ? this.fieldRegistry[f.key] : null;
                        if (topicsReg) {
                            // Push mode drops the Off Value column and separate on/off topics swaps the
                            // topic row layout, so the rows must follow those sibling fields.
                            topicsReg.syncDynamicContent = (vals, ig) => {
                                const nextMode = resolveSwitchMode(vals);
                                const nextSeparate = resolveSeparateTopics(vals, ig);
                                if (nextMode === topicsPanelOptions.switchMode
                                    && nextSeparate === topicsPanelOptions.separateOnOffTopics) return;
                                topicsPanelOptions.switchMode = nextMode;
                                topicsPanelOptions.separateOnOffTopics = nextSeparate;
                                topicsPanel.rerender();
                            };
                        }

                        w.classList.replace(`col-span-${f.cols}`, 'col-span-12');
                        w.appendChild(wrap);
                        grid.appendChild(w);
                        return;
                    } else if (f.type === 'audio_topic_map') {
                        const wrap = document.createElement('div');
                        wrap.className = 'w-full flex flex-col gap-2 col-span-12';
                        let arr = typeof DashboardAudio !== 'undefined' && DashboardAudio.normalizeTopicMap
                            ? DashboardAudio.normalizeTopicMap(rawValue)
                            : (Array.isArray(rawValue) ? rawValue.slice() : []);

                        const listRoot = document.createElement('div');
                        wrap.appendChild(listRoot);

                        const renderMap = () => {
                            Editor._cleanupSubtreeDropdowns(listRoot);
                            listRoot.innerHTML = '';

                            arr.forEach((row, idx) => {
                                const card = document.createElement('div');
                                card.className = 'flex flex-col gap-2 p-2 rounded editor-divider-b';
                                card.style.backgroundColor = 'var(--ui-header-bg)';
                                card.style.border = '1px solid var(--ui-border)';

                                const topicLbl = document.createElement('label');
                                topicLbl.className = 'control-label';
                                topicLbl.textContent = 'Topic';
                                topicLbl.setAttribute('data-editor-tooltip', 'audioTopic');
                                this._stampTooltipWidgetType(topicLbl, this._inspectorTooltipWidgetType(isGlobal));
                                const topicRow = document.createElement('div');
                                topicRow.className = 'flex w-full';
                                const dd = Editor.createTopicDropdown(row.topic || '', 'Select topic...', (val) => {
                                    arr[idx].topic = val;
                                    saveValue(arr.slice(), true);
                                    this._markFieldAsCustom(w, resetIcon);
                                }, 'rounded-r-none');
                                const del = document.createElement('button');
                                del.type = 'button';
                                del.className = 'btn-tool danger w-8 px-0 flex-shrink-0 rounded-l-none border-l-0';
                                del.title = 'Remove';
                                del.innerHTML = '<i class="ph-bold ph-trash"></i>';
                                del.onclick = () => {
                                    arr.splice(idx, 1);
                                    saveValue(arr.slice(), true);
                                    this._markFieldAsCustom(w, resetIcon);
                                    renderMap();
                                };
                                topicRow.appendChild(dd);
                                topicRow.appendChild(del);

                                const urlLbl = document.createElement('label');
                                urlLbl.className = 'control-label';
                                urlLbl.textContent = 'Audio URL';
                                urlLbl.setAttribute('data-editor-tooltip', 'audioUrl');
                                this._stampTooltipWidgetType(urlLbl, this._inspectorTooltipWidgetType(isGlobal));
                                const urlField = Editor.createAudioUrlFieldRow(row.url || '', (val) => {
                                    arr[idx].url = val;
                                    saveValue(arr.slice(), true);
                                    this._markFieldAsCustom(w, resetIcon);
                                });

                                card.appendChild(topicLbl);
                                card.appendChild(topicRow);
                                card.appendChild(urlLbl);
                                card.appendChild(urlField.row);
                                listRoot.appendChild(card);
                            });

                            const addBtn = document.createElement('button');
                            addBtn.type = 'button';
                            addBtn.className = 'btn-tool primary w-full justify-center py-2 mt-2';
                            addBtn.innerHTML = '<i class="ph-bold ph-plus"></i> Add Topic Audio';
                            addBtn.onclick = () => {
                                arr.push({ topic: '', url: '' });
                                // skipReload: empty draft rows must stay in the local list; a full
                                // inspector reload would race renderMap and look like a no-op.
                                saveValue(arr.slice(), true);
                                this._markFieldAsCustom(w, resetIcon);
                                renderMap();
                            };
                            listRoot.appendChild(addBtn);
                        };
                        renderMap();

                        if (f.hint) {
                            const hint = document.createElement('div');
                            hint.className = 'text-xs opacity-70 mt-1';
                            hint.textContent = f.hint;
                            wrap.appendChild(hint);
                        }

                        w.classList.replace(`col-span-${f.cols}`, 'col-span-12');
                        w.appendChild(wrap);
                        grid.appendChild(w);
                        return;
                    } else if (f.type === 'audio_trigger_map') {
                        const wrap = document.createElement('div');
                        wrap.className = 'w-full flex flex-col gap-2 col-span-12';
                        const triggers = Array.isArray(f.triggers) ? f.triggers : [];
                        let audioObj = (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue))
                            ? { ...rawValue }
                            : {};
                        triggers.forEach((t) => {
                            if (t && t.key && audioObj[t.key] === undefined) audioObj[t.key] = '';
                        });

                        const labelByKey = {};
                        const resolveAudioTriggerLabel = (trigger, vals) => {
                            if (trigger && typeof trigger.labelFor === 'function') {
                                const next = trigger.labelFor(vals || {});
                                if (next !== undefined && next !== null && String(next) !== '') return String(next);
                            }
                            return (trigger && (trigger.label || trigger.key)) || '';
                        };
                        triggers.forEach((t) => {
                            if (!t || !t.key) return;
                            const rowWrap = document.createElement('div');
                            rowWrap.className = 'flex flex-col gap-1';
                            const lbl = document.createElement('label');
                            lbl.className = 'control-label';
                            lbl.textContent = resolveAudioTriggerLabel(t, values);
                            if (t.key) {
                                lbl.setAttribute('data-editor-tooltip', t.key);
                                this._stampTooltipWidgetType(lbl, this._inspectorTooltipWidgetType(isGlobal));
                            }
                            labelByKey[t.key] = lbl;
                            const urlField = Editor.createAudioUrlFieldRow(audioObj[t.key] || '', (val) => {
                                audioObj = { ...audioObj, [t.key]: val };
                                saveValue(audioObj, true);
                                this._markFieldAsCustom(w, resetIcon);
                                this._handleFieldDependencyChange(f.key, 'change');
                            });
                            rowWrap.appendChild(lbl);
                            rowWrap.appendChild(urlField.row);
                            wrap.appendChild(rowWrap);
                        });
                        const audioReg = f.key ? this.fieldRegistry[f.key] : null;
                        if (audioReg) {
                            audioReg.syncDynamicContent = (vals) => {
                                triggers.forEach((t) => {
                                    if (!t || !t.key || !labelByKey[t.key]) return;
                                    const next = resolveAudioTriggerLabel(t, vals);
                                    if (labelByKey[t.key].textContent !== next) labelByKey[t.key].textContent = next;
                                });
                            };
                        }

                        w.classList.replace(`col-span-${f.cols}`, 'col-span-12');
                        w.appendChild(wrap);
                        grid.appendChild(w);
                        return;
                    } else if (f.type === 'light_list') {
                        const wrap = document.createElement('div');
                        wrap.className = 'w-full flex flex-col gap-2 mt-2 col-span-12';

                        let arr = Array.isArray(rawValue) ? [...rawValue] : [];
                        if (typeof rawValue === 'string') {
                            try { arr = JSON.parse(rawValue); } catch (e) { arr = []; }
                        }

                        let lightListReorder = null;
                        const selectedLights = new Set();
                        const editorSelf = this;
                        let renderList = function () {};

                        const ensureLightGridPicker = () => {
                            const ready = (typeof WidgetScriptLoader !== 'undefined' && typeof WidgetScriptLoader.whenEditorStackReady === 'function')
                                ? WidgetScriptLoader.whenEditorStackReady()
                                : Promise.resolve();
                            return ready.then(() => {
                                if (typeof LightGridPicker !== 'undefined' && typeof LightGridPicker.open === 'function') return;
                                if (typeof WidgetScriptLoader === 'undefined' || typeof WidgetScriptLoader.loadScript !== 'function') {
                                    throw new Error('Script loader unavailable');
                                }
                                return WidgetScriptLoader.loadScript('scripts/light-grid-picker.js');
                            });
                        };

                        const commitLightList = (arrBefore) => {
                            const wdg = Dashboard.widgets[editorSelf.currentId];
                            const newB = Editor.remapLightItemBindings((wdg && wdg.bindings) || {}, arrBefore, arr);
                            Dashboard.updateWidgetBinding(editorSelf.currentId, newB, true);
                            editorSelf.remapEditorListRowCollapseStates(editorSelf.currentId, f.key, arrBefore, arr);
                            saveValue(arr, true);
                            renderList();
                            editorSelf._handleFieldDependencyChange(f.key, 'change');
                        };

                        const blankLightDevice = () => ({
                            name: 'New Light',
                            outputMode: 'light',
                            topics: [],
                            icons: { on: {} },
                            overridePresets: false,
                            presets: []
                        });

                        renderList = () => {
                            if (lightListReorder) {
                                lightListReorder.destroy();
                                lightListReorder = null;
                            }
                            Editor._cleanupSubtreeDropdowns(wrap);
                            const stillSelected = [];
                            arr.forEach((light) => {
                                if (selectedLights.has(light)) stillSelected.push(light);
                            });
                            selectedLights.clear();
                            stillSelected.forEach((light) => selectedLights.add(light));

                            wrap.innerHTML = '';
                            const listRoot = document.createElement('div');
                            listRoot.className = 'flex flex-col gap-2';

                            arr.forEach((light, lIdx) => {
                                if (!light.topics || !Array.isArray(light.topics)) {
                                    light.topics = [];
                                }

                                const card = document.createElement('div');
                                card.className = 'editor-collapse-card editor-collapse-card--closed ds-reorder-item';

                                const head = document.createElement('div');
                                head.className = 'editor-collapse-header';

                                const dragHandle = (typeof EditorReorder !== 'undefined' && typeof EditorReorder.createDragHandle === 'function')
                                    ? EditorReorder.createDragHandle()
                                    : (() => {
                                        const h = document.createElement('span');
                                        h.className = 'ds-reorder-handle';
                                        h.innerHTML = '<i class="ph-bold ph-dots-six-vertical"></i>';
                                        h.addEventListener('click', (e) => e.stopPropagation());
                                        return h;
                                    })();

                                const titleSpan = document.createElement('span');
                                titleSpan.className = 'text-xs font-bold text-[var(--ui-text)] flex items-center gap-2 pointer-events-none truncate flex-1 min-w-0';

                                const setLightTitleSpan = () => {
                                    titleSpan.innerHTML = Editor.lightItemListTitleHtml(light);
                                };
                                setLightTitleSpan();

                                const headActions = document.createElement('div');
                                headActions.className = 'flex items-center gap-2 shrink-0';

                                const selectBox = document.createElement('input');
                                selectBox.type = 'checkbox';
                                selectBox.className = 'ds-checkbox lg-device-check';
                                selectBox.title = 'Select for Combine';
                                selectBox.setAttribute('aria-label', 'Select for Combine');
                                selectBox.checked = selectedLights.has(light);
                                const stopHeadToggle = (e) => e.stopPropagation();
                                selectBox.addEventListener('pointerdown', stopHeadToggle);
                                selectBox.addEventListener('click', stopHeadToggle);
                                selectBox.addEventListener('change', () => {
                                    if (selectBox.checked) selectedLights.add(light);
                                    else selectedLights.delete(light);
                                    syncCombineBar();
                                });

                                const toggleIcon = document.createElement('i');
                                toggleIcon.className = 'ph-bold ph-caret-down text-[var(--ui-text-muted)] transition-transform';
                                const delBtn = document.createElement('button');
                                delBtn.type = 'button';
                                delBtn.className = 'text-danger text-sm p-1 z-10';
                                delBtn.title = 'Delete light device';
                                delBtn.setAttribute('aria-label', 'Delete light device');
                                delBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
                                delBtn.onclick = (e) => {
                                    e.stopPropagation();
                                    const ix = arr.indexOf(light);
                                    if (ix < 0) return;
                                    const arrBefore = arr.slice();
                                    selectedLights.delete(light);
                                    arr.splice(ix, 1);
                                    commitLightList(arrBefore);
                                };

                                headActions.appendChild(selectBox);
                                headActions.appendChild(delBtn);
                                headActions.appendChild(toggleIcon);
                                head.appendChild(dragHandle);
                                head.appendChild(titleSpan);
                                head.appendChild(headActions);
                                card.appendChild(head);

                                const content = document.createElement('div');
                                content.className = 'editor-collapse-content hidden flex flex-col gap-3';

                                const lightRowCollapseKey = this.editorListRowCollapseKey(this.currentId, f.key, lIdx);
                                this.attachPersistedEditorCollapse(lightRowCollapseKey, head, content, toggleIcon, {});

                                this._renderLightItemEditorGrid(
                                    content, light, lIdx, arr, f, currentBindings, isGlobal, saveValue, setLightTitleSpan,
                                    (tIdx) => {
                                        const topics = light.topics || [];
                                        if (topics.length < 2) return;
                                        const rawTopic = topics[tIdx];
                                        const key = String(rawTopic == null ? '' : rawTopic).trim();
                                        if (!key) return;
                                        const arrBefore = arr.slice();
                                        topics.splice(tIdx, 1);
                                        const name = (typeof LightGridWidget !== 'undefined' && typeof LightGridWidget.lightNameFromTopic === 'function')
                                            ? LightGridWidget.lightNameFromTopic(key)
                                            : 'New Light';
                                        const created = blankLightDevice();
                                        created.name = name;
                                        created.topics = [key];
                                        const ix = arr.indexOf(light);
                                        arr.splice(ix < 0 ? arr.length : ix + 1, 0, created);
                                        commitLightList(arrBefore);
                                    },
                                    function () { renderList(); }
                                );

                                card.appendChild(content);
                                listRoot.appendChild(card);
                            });

                            wrap.appendChild(listRoot);

                            const combineBar = document.createElement('div');
                            combineBar.className = 'lg-combine-bar';
                            combineBar.style.display = 'none';
                            const combineBtn = document.createElement('button');
                            combineBtn.type = 'button';
                            combineBtn.className = 'btn-tool w-full justify-center py-2';
                            combineBtn.innerHTML = '<i class="ph-bold ph-unite"></i> Combine';
                            combineBtn.onclick = () => {
                                const chosen = [];
                                arr.forEach((light) => {
                                    if (selectedLights.has(light)) chosen.push(light);
                                });
                                if (chosen.length < 2) return;
                                ensureLightGridPicker().then(() => {
                                    if (typeof LightGridPicker === 'undefined' || typeof LightGridPicker.openCombine !== 'function') return;
                                    LightGridPicker.openCombine(chosen, (target) => {
                                        if (!target || chosen.indexOf(target) < 0) return;
                                        const arrBefore = arr.slice();
                                        if (!Array.isArray(target.topics)) target.topics = [];
                                        chosen.forEach((other) => {
                                            if (other === target || !Array.isArray(other.topics)) return;
                                            other.topics.forEach((t) => {
                                                const key = String(t == null ? '' : t).trim();
                                                if (!key) return;
                                                let exists = false;
                                                for (let i = 0; i < target.topics.length; i++) {
                                                    if (String(target.topics[i] == null ? '' : target.topics[i]).trim() === key) {
                                                        exists = true;
                                                        break;
                                                    }
                                                }
                                                if (!exists) target.topics.push(key);
                                            });
                                        });
                                        for (let i = arr.length - 1; i >= 0; i--) {
                                            if (arr[i] !== target && selectedLights.has(arr[i])) arr.splice(i, 1);
                                        }
                                        selectedLights.clear();
                                        selectedLights.add(target);
                                        commitLightList(arrBefore);
                                    });
                                }).catch((err) => {
                                    console.error('[Editor] Combine light devices failed:', err);
                                });
                            };
                            combineBar.appendChild(combineBtn);

                            const syncCombineBar = () => {
                                const n = selectedLights.size;
                                if (n >= 2) {
                                    combineBar.style.display = '';
                                    combineBtn.innerHTML = '<i class="ph-bold ph-unite"></i> Combine (' + n + ')';
                                } else {
                                    combineBar.style.display = 'none';
                                }
                            };
                            syncCombineBar();
                            wrap.appendChild(combineBar);

                            const actionRow = document.createElement('div');
                            actionRow.className = 'lg-light-actions grid grid-cols-2 gap-2 mt-2';

                            const addBtn = document.createElement('button');
                            addBtn.type = 'button';
                            addBtn.className = 'btn-tool primary w-full justify-center py-2';
                            addBtn.innerHTML = '<i class="ph-bold ph-plus"></i> Add Light Device';
                            addBtn.onclick = () => {
                                const arrBefore = arr.slice();
                                arr.push(blankLightDevice());
                                commitLightList(arrBefore);
                            };

                            const pickBtn = document.createElement('button');
                            pickBtn.type = 'button';
                            pickBtn.className = 'btn-tool w-full justify-center py-2';
                            pickBtn.innerHTML = '<i class="ph-bold ph-lightbulb"></i> Pick Live Lights';
                            pickBtn.onclick = () => {
                                ensureLightGridPicker().then(() => {
                                    if (typeof LightGridPicker === 'undefined' || typeof LightGridPicker.open !== 'function') return;
                                    LightGridPicker.open({
                                        devices: arr,
                                        onApply: (arrBefore) => commitLightList(arrBefore)
                                    });
                                }).catch((err) => {
                                    console.error('[Editor] Live Lights picker failed to open:', err);
                                });
                            };

                            actionRow.appendChild(addBtn);
                            actionRow.appendChild(pickBtn);
                            wrap.appendChild(actionRow);

                            if (typeof EditorReorder !== 'undefined' && typeof EditorReorder.attach === 'function') {
                                lightListReorder = EditorReorder.attach(listRoot, {
                                    onReorder: (from, to) => {
                                        const arrBefore = arr.slice();
                                        const moved = arr.splice(from, 1)[0];
                                        arr.splice(to, 0, moved);
                                        commitLightList(arrBefore);
                                    }
                                });
                            }
                        };

                        renderList();
                        w.classList.replace(`col-span-${f.cols}`, 'col-span-12');
                        w.appendChild(wrap);
                        grid.appendChild(w);
                        return;
                                        } else if (f.type === 'graph_series_list') {
                        const wrap = document.createElement('div');
                        wrap.className = 'w-full flex flex-col gap-2 mt-2 col-span-12';
                        let arr = Array.isArray(rawValue) ? rawValue.slice() : [];
                        if (typeof rawValue === 'string') {
                            try { arr = JSON.parse(rawValue); } catch (e) { arr = []; }
                        }
                        if (!Array.isArray(arr)) arr = [];
                        const seriesPickers = [];
                        let seriesReorder = null;

                        const ensureGraphDataPicker = () => {
                            const p1 = (typeof AutoWidgetGallery !== 'undefined')
                                ? Promise.resolve()
                                : WidgetScriptLoader.loadScript('scripts/auto-widget-gallery.js');
                            const p2 = (typeof GraphDataPicker !== 'undefined' && typeof GraphDataPicker.open === 'function')
                                ? Promise.resolve()
                                : WidgetScriptLoader.loadScript('scripts/graph-data-picker.js');
                            return Promise.all([p1, p2]);
                        };

                        const destroySeriesPickers = () => {
                            for (let pi = 0; pi < seriesPickers.length; pi++) {
                                const ctrl = seriesPickers[pi];
                                try { if (ctrl && typeof ctrl.destroy === 'function') ctrl.destroy(); } catch (e) { /* ignore */ }
                                if (this.colorPickerControllers) {
                                    const at = this.colorPickerControllers.indexOf(ctrl);
                                    if (at >= 0) this.colorPickerControllers.splice(at, 1);
                                }
                            }
                            seriesPickers.length = 0;
                        };

                        const formulaSuffixes = ['_bind_formula', '_bind_transformMode', '_bind_mapTrue', '_bind_mapFalse'];
                        const seriesAuxSuffixes = formulaSuffixes.concat([
                            '_correct_en', '_correct_hue', '_correct_sat', '_correct_bri',
                            '_correct_hue_fixed', '_correct_sat_fixed', '_correct_bri_fixed'
                        ]);
                        const rewriteSeriesAux = (next, fromId, toId, remove) => {
                            if (!fromId) return;
                            const fromPrefix = 'graphSeries_' + fromId + '_';
                            Object.keys(next).forEach((k) => {
                                if (k.indexOf(fromPrefix) !== 0) return;
                                if (toId) {
                                    const dest = 'graphSeries_' + toId + '_' + k.slice(fromPrefix.length);
                                    if (next[dest] === undefined) next[dest] = next[k];
                                }
                                if (remove) delete next[k];
                            });
                        };
                        const commitSeries = (nextArr, extra) => {
                            const wdg = Dashboard.widgets[this.currentId];
                            const next = JSON.parse(JSON.stringify((wdg && wdg.overrides) || {}));
                            next.series = nextArr;
                            if (extra && extra.copyFormulaFrom && extra.copyFormulaTo) {
                                rewriteSeriesAux(next, extra.copyFormulaFrom, extra.copyFormulaTo, false);
                            }
                            if (extra && extra.removeId) {
                                rewriteSeriesAux(next, extra.removeId, null, true);
                            }
                            this._isEditorDrivenUpdate = true;
                            try {
                                Dashboard.updateWidget(this.currentId, next, true);
                                this._setSnapshotValue(f.key, nextArr);
                            } finally {
                                this._isEditorDrivenUpdate = false;
                            }
                        };

                        const topicAt = (index) => {
                            const wdg = Dashboard.widgets[this.currentId];
                            const tree = (wdg && wdg.bindings) || {};
                            return BindingsTree.getAtPath(tree, ['series', index, 'data']);
                        };
                        const propTopic = (index, prop) => {
                            const wdg = Dashboard.widgets[this.currentId];
                            const tree = (wdg && wdg.bindings) || {};
                            return BindingsTree.getAtPath(tree, ['series', index, prop]);
                        };

                        const friendlyName = (topic) => {
                            if (typeof GraphWidget === 'undefined' || typeof GraphWidget.seriesNameFromTopic !== 'function') return '';
                            if (typeof topic !== 'string') return '';
                            const raw = topic.trim();
                            if (!raw || raw.indexOf('{{') >= 0 || raw.indexOf(',') >= 0) return '';
                            return GraphWidget.seriesNameFromTopic(raw);
                        };

                        let seriesChartType = 'line';
                        const seriesColorLabel = (role) => {
                            const bar = seriesChartType === 'bar';
                            if (role === 'positive') return bar ? 'Positive Bar Color' : 'Positive Line Color';
                            return bar ? 'Negative Bar Color' : 'Negative Line Color';
                        };
                        const seriesOpacityLabel = (role) => {
                            const bar = seriesChartType === 'bar';
                            if (role === 'positive') return bar ? 'Positive Bar Opacity' : 'Positive Line Opacity';
                            return bar ? 'Negative Bar Opacity' : 'Negative Line Opacity';
                        };
                        const syncSeriesModes = (vals) => {
                            const type = (vals && (vals.type || vals.defaultGraphType)) || 'line';
                            seriesChartType = type;
                            const line = type === 'line' || type === 'smooth' || type === 'stepped';
                            const bar = type === 'bar';
                            let pointsOn = false;
                            if (vals && vals.showPoints === true) pointsOn = true;
                            else if (vals && (vals.showPoints === undefined || vals.showPoints === null) && vals.defaultGraphPointShow === true) pointsOn = true;
                            wrap.querySelectorAll('[data-series-mode]').forEach((el) => {
                                const mode = el.getAttribute('data-series-mode');
                                let show = false;
                                if (mode === 'line' || mode === 'fill') show = line;
                                else if (mode === 'bar') show = bar;
                                else if (mode === 'point') show = line && pointsOn;
                                else if (mode === 'stroke') show = line || bar;
                                el.style.display = show ? '' : 'none';
                            });
                            wrap.querySelectorAll('[data-series-color]').forEach((el) => {
                                const lab = el.querySelector('.control-label');
                                if (lab) lab.textContent = seriesColorLabel(el.getAttribute('data-series-color'));
                            });
                            wrap.querySelectorAll('[data-series-opacity]').forEach((el) => {
                                const lab = el.querySelector('.control-label');
                                if (lab) lab.textContent = seriesOpacityLabel(el.getAttribute('data-series-opacity'));
                            });
                            seriesPickers.forEach(function (p) {
                                if (p && typeof p.sync === 'function') p.sync();
                            });
                        };

                        const renderList = () => {
                            if (seriesReorder) {
                                seriesReorder.destroy();
                                seriesReorder = null;
                            }
                            destroySeriesPickers();
                            Editor._cleanupSubtreeDropdowns(wrap);
                            wrap.innerHTML = '';
                            if (!arr.length && typeof GraphWidget !== 'undefined') {
                                arr.push(GraphWidget.createSeries(0));
                                saveValue(arr, true);
                            }

                            let namesChanged = false;
                            arr.forEach((item, i) => {
                                if (!item || typeof item !== 'object') return;
                                if (item.nameLocked === true) return;
                                const friendly = friendlyName(topicAt(i));
                                if (friendly && item.name !== friendly) {
                                    item.name = friendly;
                                    namesChanged = true;
                                }
                            });

                            const listRoot = document.createElement('div');
                            listRoot.className = 'flex flex-col gap-2';

                            const makeRow = (mode) => {
                                const r = document.createElement('div');
                                r.className = 'grid grid-cols-12 gap-x-2 gap-y-3';
                                if (mode) r.setAttribute('data-series-mode', mode);
                                return r;
                            };
                            const seriesPropBindButtons = (item, index, prop, fieldType, labelText) => {
                                const resolveLabel = () => (typeof labelText === 'function' ? labelText() : labelText);
                                const bindBtns = document.createElement('div');
                                bindBtns.className = 'flex items-center gap-1';
                                const boundTopic = propTopic(index, prop);
                                const isBound = typeof boundTopic === 'string';
                                const bindBtn = document.createElement('button');
                                bindBtn.type = 'button';
                                bindBtn.className = isBound ? 'btn-bind active transition-colors' : 'btn-bind transition-colors';
                                bindBtn.title = isBound ? 'Unlink Topic' : 'Link to Topic';
                                bindBtn.innerHTML = '<i class="ph ' + (isBound ? 'ph-link-break' : 'ph-link') + ' text-xs"></i>';
                                bindBtn.onclick = (e) => {
                                    e.stopPropagation();
                                    const wdg = Dashboard.widgets[this.currentId];
                                    const b = JSON.parse(JSON.stringify((wdg && wdg.bindings) || {}));
                                    if (isBound) {
                                        BindingsTree.deleteAtPath(b, ['series', index, prop]);
                                        Dashboard.updateWidgetBinding(this.currentId, b, true);
                                        if (wdg && item.id) {
                                            const co = JSON.parse(JSON.stringify(wdg.overrides || {}));
                                            let changed = false;
                                            seriesAuxSuffixes.forEach((suf) => {
                                                const k = 'graphSeries_' + item.id + '_' + prop + suf;
                                                if (co[k] !== undefined) {
                                                    delete co[k];
                                                    changed = true;
                                                }
                                            });
                                            if (changed) {
                                                this._isEditorDrivenUpdate = true;
                                                try { Dashboard.updateWidget(this.currentId, co, true); }
                                                finally { this._isEditorDrivenUpdate = false; }
                                            }
                                        }
                                    } else {
                                        const patch = {};
                                        BindingsTree.setAtPath(patch, ['series', index, prop], '');
                                        Dashboard.updateWidgetBinding(this.currentId, patch);
                                    }
                                    renderList();
                                };
                                bindBtns.appendChild(bindBtn);
                                if (isBound && item.id) {
                                    const synField = this.graphSeriesBindSyntheticField(item.id, prop, fieldType, resolveLabel());
                                    const wCur = Dashboard.widgets[this.currentId];
                                    const ovr = wCur ? (wCur.overrides || {}) : {};
                                    const optsBtn = document.createElement('button');
                                    optsBtn.type = 'button';
                                    optsBtn.className = 'btn-bind';
                                    const mapActive = this.hasBindingMapActiveForField(synField, ovr, false);
                                    const invalid = this.hasBindingFormulaInvalidForField(synField, ovr, false);
                                    Editor.setBindAuxHighlight(optsBtn, mapActive, invalid);
                                    optsBtn.title = 'Binding Options';
                                    optsBtn.innerHTML = '<i class="ph-bold ' + this.getBindingOptionsIconPh(synField, ovr, false) + ' text-xs"></i>';
                                    optsBtn.onclick = (ev) => {
                                        ev.stopPropagation();
                                        const liveField = this.graphSeriesBindSyntheticField(item.id, prop, fieldType, resolveLabel());
                                        this.openBindingOptionsPopup(liveField, optsBtn, false);
                                    };
                                    bindBtns.appendChild(optsBtn);
                                }
                                return bindBtns;
                            };
                            const seriesFieldDefault = (key, index, item) => {
                                const M = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS) ? MASTER_SETTINGS : {};
                                if (key === 'valueMultiplier') return 0;
                                if (key === 'lineWidth') return M.defaultGraphLineW != null ? M.defaultGraphLineW : 2;
                                if (key === 'positiveColorOpacity') return M.defaultGraphPositiveColorOpacity != null ? M.defaultGraphPositiveColorOpacity : 100;
                                if (key === 'negativeColorOpacity') return M.defaultGraphNegativeColorOpacity != null ? M.defaultGraphNegativeColorOpacity : 100;
                                if (key === 'positiveStartOpacity') return M.defaultGraphPositiveStartOpacity != null ? M.defaultGraphPositiveStartOpacity : 40;
                                if (key === 'positiveEndOpacity') return M.defaultGraphPositiveEndOpacity != null ? M.defaultGraphPositiveEndOpacity : 0;
                                if (key === 'negativeStartOpacity') {
                                    if (M.defaultGraphNegativeStartOpacity != null) return M.defaultGraphNegativeStartOpacity;
                                    return M.defaultGraphPositiveStartOpacity != null ? M.defaultGraphPositiveStartOpacity : 40;
                                }
                                if (key === 'negativeEndOpacity') return M.defaultGraphNegativeEndOpacity != null ? M.defaultGraphNegativeEndOpacity : 0;
                                if (key === 'positiveColor') {
                                    return (typeof GraphWidget !== 'undefined') ? GraphWidget.markerTintForIndex(index || 0) : '';
                                }
                                if (key === 'negativeColor') {
                                    if (item && item.negativeColor) return item.negativeColor;
                                    if (item && item.positiveColor) return item.positiveColor;
                                    return (typeof GraphWidget !== 'undefined') ? GraphWidget.markerTintForIndex(index || 0) : '';
                                }
                                if (key === 'positiveFillColor') {
                                    if (item && item.positiveColor) return item.positiveColor;
                                    return (typeof GraphWidget !== 'undefined') ? GraphWidget.markerTintForIndex(index || 0) : '';
                                }
                                if (key === 'negativeFillColor') {
                                    if (item && item.negativeColor) return item.negativeColor;
                                    if (item && item.positiveColor) return item.positiveColor;
                                    return (typeof GraphWidget !== 'undefined') ? GraphWidget.markerTintForIndex(index || 0) : '';
                                }
                                if (key === 'pointColor') {
                                    if (item && item.positiveColor) return item.positiveColor;
                                    return (typeof GraphWidget !== 'undefined') ? GraphWidget.markerTintForIndex(index || 0) : '';
                                }
                                if (key === 'positiveOutlineColor') return M.graphBarOutlineColor || 'transparent';
                                if (key === 'negativeOutlineColor') return M.graphNegBarOutlineColor || M.graphBarOutlineColor || 'transparent';
                                return '';
                            };
                            const isSeriesPropCustom = (item, prop, index) => {
                                if (!item || prop == null) return false;
                                const val = item[prop];
                                if (val === undefined || val === null || val === '') return false;
                                if (prop === 'visible') return item.visible === false;
                                if (prop === 'data') return val != null && val !== '';
                                if (prop === 'name') {
                                    const defaultName = 'Graph ' + ((index || 0) + 1);
                                    return item.nameLocked === true && val !== defaultName;
                                }
                                const def = seriesFieldDefault(prop, index, item);
                                if (def !== '' && def !== null && def !== undefined && isFinite(Number(def)) && isFinite(Number(val))) {
                                    return Number(val) !== Number(def);
                                }
                                if (def !== '' && def !== null && def !== undefined) {
                                    return String(val).toLowerCase() !== String(def).toLowerCase();
                                }
                                return true;
                            };
                            const makeCell = (span, label, control, mode, bind, hint) => {
                                const box = document.createElement('div');
                                box.className = 'col-span-' + span + ' flex flex-col justify-end min-w-0';
                                if (mode) box.setAttribute('data-series-mode', mode);
                                const head = document.createElement('div');
                                head.className = 'control-header-row';
                                const lab = document.createElement('span');
                                lab.className = 'control-label';
                                lab.textContent = label;
                                if (hint) lab.title = hint;
                                if (bind && bind.prop) {
                                    lab.setAttribute('data-editor-tooltip', 'series.' + bind.prop);
                                    this._stampTooltipWidgetType(lab, 'graph');
                                }
                                head.appendChild(lab);
                                let resetIcon = null;
                                let bound = false;
                                if (bind) {
                                    bound = typeof propTopic(bind.index, bind.prop) === 'string';
                                    const actions = seriesPropBindButtons(bind.item, bind.index, bind.prop, bind.fieldType, bind.labelFor || label);
                                    actions.className = 'control-header-actions' + (bound ? ' control-header-actions--pinned' : '');
                                    if (!bound) {
                                        resetIcon = document.createElement('i');
                                        resetIcon.className = 'ph-bold ph-arrow-counter-clockwise btn-reset text-xs editor-muted-text cursor-pointer transition-colors';
                                        resetIcon.title = 'Reset to Default';
                                        const isCustom = isSeriesPropCustom(bind.item, bind.prop, bind.index);
                                        this._setResetIdle(resetIcon, !isCustom);
                                        resetIcon.onclick = (ev) => {
                                            ev.stopPropagation();
                                            if (bind.item && bind.prop) {
                                                if (bind.prop === 'name') {
                                                    bind.item.nameLocked = false;
                                                    bind.item.name = 'Graph ' + ((bind.index || 0) + 1);
                                                } else {
                                                    delete bind.item[bind.prop];
                                                }
                                            }
                                            saveValue(arr, true);
                                            renderList();
                                        };
                                        actions.insertBefore(resetIcon, actions.firstChild);
                                    }
                                    head.appendChild(actions);
                                }
                                const isCustomInit = bind && !bound && isSeriesPropCustom(bind.item, bind.prop, bind.index);
                                if (isCustomInit) box.classList.add('field-is-set');

                                box.appendChild(head);
                                const fieldControl = this._ensureFieldControl(control);
                                if (fieldControl) box.appendChild(fieldControl);
                                else box.appendChild(control);

                                const updateState = () => {
                                    if (!bind) return;
                                    const custom = isSeriesPropCustom(bind.item, bind.prop, bind.index);
                                    if (resetIcon) this._setResetIdle(resetIcon, !custom);
                                    if (custom && !bound) box.classList.add('field-is-set');
                                    else box.classList.remove('field-is-set');
                                };
                                box._updateCustomState = updateState;
                                if (control) control._onCustomChange = updateState;
                                box.addEventListener('change', updateState);

                                return box;
                            };
                            const topicControl = (index, prop) => {
                                const bound = propTopic(index, prop);
                                return Editor.createTopicDropdown(bound || '', 'Select topic...', (val) => {
                                    const patch = {};
                                    BindingsTree.setAtPath(patch, ['series', index, prop], val);
                                    Dashboard.updateWidgetBinding(this.currentId, patch);
                                });
                            };
                            const numInput = (item, key, min, max, index) => {
                                if (typeof propTopic(index, key) === 'string') return topicControl(index, key);
                                const inp = document.createElement('input');
                                inp.type = 'number';
                                inp.className = 'control-input';
                                if (min != null) inp.min = String(min);
                                if (max != null) inp.max = String(max);
                                const fallback = seriesFieldDefault(key, index, item);
                                const hasOwn = item[key] != null && item[key] !== '';
                                const shown = hasOwn ? item[key] : fallback;
                                if (shown != null && shown !== '') inp.value = String(shown);
                                inp.addEventListener('change', () => {
                                    const fallbackNow = seriesFieldDefault(key, index, item);
                                    if (inp.value === '') {
                                        delete item[key];
                                        if (fallbackNow != null && fallbackNow !== '') inp.value = String(fallbackNow);
                                    } else {
                                        let n = parseFloat(inp.value);
                                        if (!isFinite(n)) n = (fallbackNow != null && fallbackNow !== '' && isFinite(Number(fallbackNow))) ? Number(fallbackNow) : 0;
                                        if (min != null && n < min) n = min;
                                        if (max != null && n > max) n = max;
                                        if (fallbackNow != null && fallbackNow !== '' && n === Number(fallbackNow)) delete item[key];
                                        else item[key] = n;
                                        inp.value = String(n);
                                    }
                                    saveValue(arr, true);
                                    if (typeof inp._onCustomChange === 'function') inp._onCustomChange();
                                });
                                return inp;
                            };
                            const colorMount = (item, key, index) => {
                                if (typeof propTopic(index, key) === 'string') return topicControl(index, key);
                                const holder = document.createElement('div');
                                const picker = this._attachColorPicker({
                                    mountCard: holder,
                                    getRaw: () => {
                                        if (item[key] != null && item[key] !== '') return String(item[key]);
                                        const fallback = seriesFieldDefault(key, index, item);
                                        return fallback != null ? String(fallback) : '';
                                    },
                                    setValue: (val) => {
                                        const fallback = seriesFieldDefault(key, index, item);
                                        if (val == null || val === '' || (fallback && String(val).toLowerCase() === String(fallback).toLowerCase())) {
                                            delete item[key];
                                        } else {
                                            item[key] = val;
                                        }
                                        saveValue(arr, true);
                                        if (typeof holder._onCustomChange === 'function') holder._onCustomChange();
                                        if (key === 'positiveColor' || key === 'negativeColor') {
                                            seriesPickers.forEach(function (p) {
                                                if (p && typeof p.sync === 'function') p.sync();
                                            });
                                        }
                                    },
                                    onFieldChromeUpdate: () => {
                                        if (typeof holder._onCustomChange === 'function') holder._onCustomChange();
                                    },
                                    allowThemeTokens: typeof MasterLayout !== 'undefined'
                                });
                                if (picker) {
                                    seriesPickers.push(picker);
                                    if (picker.row) this._ensureFieldControl(picker.row);
                                }
                                return holder;
                            };
                            const bindSpec = (item, index, prop, fieldType, labelFor) => ({ item: item, index: index, prop: prop, fieldType: fieldType, labelFor: labelFor });

                            arr.forEach((item, lIdx) => {
                                if (!item || typeof item !== 'object') return;
                                if (!item.id && typeof GraphWidget !== 'undefined') item.id = GraphWidget.createSeriesId();
                                const card = document.createElement('div');
                                card.className = 'editor-collapse-card editor-collapse-card--closed ds-reorder-item';

                                const head = document.createElement('div');
                                head.className = 'editor-collapse-header';
                                const dragHandle = (typeof EditorReorder !== 'undefined' && typeof EditorReorder.createDragHandle === 'function')
                                    ? EditorReorder.createDragHandle()
                                    : (() => {
                                        const h = document.createElement('span');
                                        h.className = 'ds-reorder-handle';
                                        h.innerHTML = '<i class="ph-bold ph-dots-six-vertical"></i>';
                                        h.addEventListener('click', (e) => e.stopPropagation());
                                        return h;
                                    })();
                                const titleSpan = document.createElement('span');
                                titleSpan.className = 'text-xs font-bold text-[var(--ui-text)] flex items-center gap-2 pointer-events-none truncate flex-1 min-w-0';
                                titleSpan.textContent = item.name || ('Graph ' + (lIdx + 1));

                                const headActions = document.createElement('div');
                                headActions.className = 'flex items-center gap-2 shrink-0';
                                const toggleIcon = document.createElement('i');
                                toggleIcon.className = 'ph-bold ph-caret-down text-[var(--ui-text-muted)] transition-transform';

                                const dupBtn = document.createElement('button');
                                dupBtn.type = 'button';
                                dupBtn.className = 'text-[var(--ui-text-muted)] hover:text-[var(--ui-accent)] text-sm p-1 z-10';
                                dupBtn.title = 'Duplicate series';
                                dupBtn.setAttribute('aria-label', 'Duplicate series');
                                dupBtn.innerHTML = '<i class="ph-bold ph-copy"></i>';
                                dupBtn.onclick = (e) => {
                                    e.stopPropagation();
                                    const ix = arr.indexOf(item);
                                    if (ix < 0 || typeof GraphWidget === 'undefined') return;
                                    let copy;
                                    try { copy = JSON.parse(JSON.stringify(item)); } catch (err) { return; }
                                    const oldId = item.id;
                                    copy.id = GraphWidget.createSeriesId();
                                    copy.name = (copy.name || 'Graph') + ' Copy';
                                    copy.nameLocked = true;
                                    arr.splice(ix + 1, 0, copy);
                                    const wdg = Dashboard.widgets[this.currentId];
                                    const newB = Editor.duplicateGraphSeriesBindingsAt((wdg && wdg.bindings) || {}, ix);
                                    Dashboard.updateWidgetBinding(this.currentId, newB, true);
                                    Editor.remapEditorListRowCollapseStatesAfterMenuInsert(this.currentId, f.key, ix);
                                    commitSeries(arr, { copyFormulaFrom: oldId, copyFormulaTo: copy.id });
                                    renderList();
                                };

                                const delBtn = document.createElement('button');
                                delBtn.type = 'button';
                                delBtn.className = 'text-danger text-sm p-1 z-10';
                                delBtn.title = arr.length <= 1 ? 'A graph keeps at least one series' : 'Delete series';
                                delBtn.setAttribute('aria-label', 'Delete series');
                                delBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
                                if (arr.length <= 1) delBtn.disabled = true;
                                delBtn.onclick = (e) => {
                                    e.stopPropagation();
                                    if (arr.length <= 1) return;
                                    const ix = arr.indexOf(item);
                                    if (ix < 0) return;
                                    const arrBefore = arr.slice();
                                    const removedId = item.id;
                                    arr.splice(ix, 1);
                                    const wdg = Dashboard.widgets[this.currentId];
                                    const newB = Editor.remapGraphSeriesBindings((wdg && wdg.bindings) || {}, arrBefore, arr);
                                    Dashboard.updateWidgetBinding(this.currentId, newB, true);
                                    this.remapEditorListRowCollapseStates(this.currentId, f.key, arrBefore, arr);
                                    commitSeries(arr, { removeId: removedId });
                                    renderList();
                                };

                                headActions.appendChild(dupBtn);
                                headActions.appendChild(delBtn);
                                headActions.appendChild(toggleIcon);
                                head.appendChild(dragHandle);
                                head.appendChild(titleSpan);
                                head.appendChild(headActions);
                                card.appendChild(head);

                                const content = document.createElement('div');
                                content.className = 'editor-collapse-content hidden flex flex-col gap-3';
                                const collapseKey = this.editorListRowCollapseKey(this.currentId, f.key, lIdx);
                                if (lIdx === 0 && this.panelStates[collapseKey] === undefined) this.panelStates[collapseKey] = true;
                                this.attachPersistedEditorCollapse(collapseKey, head, content, toggleIcon, {});

                                const nameRow = makeRow();
                                let nameControl;
                                if (typeof propTopic(lIdx, 'name') === 'string') {
                                    nameControl = topicControl(lIdx, 'name');
                                } else {
                                    const nameInput = document.createElement('input');
                                    nameInput.type = 'text';
                                    nameInput.className = 'control-input';
                                    nameInput.value = item.name || '';
                                    nameInput.addEventListener('change', () => {
                                        const text = nameInput.value.trim();
                                        if (!text) {
                                            item.nameLocked = false;
                                            const friendly = friendlyName(topicAt(arr.indexOf(item))) || ('Graph ' + (arr.indexOf(item) + 1));
                                            item.name = friendly;
                                            nameInput.value = friendly;
                                        } else {
                                            item.name = nameInput.value;
                                            item.nameLocked = true;
                                        }
                                        titleSpan.textContent = item.name;
                                        saveValue(arr, true);
                                        if (typeof nameInput._onCustomChange === 'function') nameInput._onCustomChange();
                                    });
                                    nameControl = nameInput;
                                }
                                nameRow.appendChild(makeCell(8, 'Name', nameControl, null, bindSpec(item, lIdx, 'name', 'text')));
                                let showControl;
                                if (typeof propTopic(lIdx, 'visible') === 'string') {
                                    showControl = topicControl(lIdx, 'visible');
                                } else {
                                    const showBox = this.createToggleStyleCheckboxRow(item.visible !== false, (checked) => {
                                        item.visible = checked === true;
                                        saveValue(arr, true);
                                        if (typeof showBox.wrap._onCustomChange === 'function') showBox.wrap._onCustomChange();
                                    });
                                    showControl = showBox.wrap;
                                }
                                nameRow.appendChild(makeCell(4, 'Show Graph', showControl, null, bindSpec(item, lIdx, 'visible', 'checkbox')));
                                content.appendChild(nameRow);

                                const dataRow = makeRow();
                                const bindPath = ['series', lIdx, 'data'];
                                const boundTopic = topicAt(lIdx);
                                const isBound = typeof boundTopic === 'string';
                                let dataControl;
                                if (isBound) {
                                    dataControl = Editor.createTopicDropdown(boundTopic || '', 'Select topic...', (val) => {
                                        const patch = {};
                                        BindingsTree.setAtPath(patch, bindPath, val);
                                        Dashboard.updateWidgetBinding(this.currentId, patch);
                                        if (item.nameLocked !== true) {
                                            const friendly = friendlyName(val);
                                            if (friendly) {
                                                item.name = friendly;
                                                titleSpan.textContent = friendly;
                                                saveValue(arr, true);
                                            }
                                        }
                                    });
                                } else {
                                    const dataInput = document.createElement('input');
                                    dataInput.type = 'text';
                                    dataInput.className = 'control-input';
                                    dataInput.placeholder = 'Topic, JSON, or CSV';
                                    dataInput.value = item.data != null ? String(item.data) : '';
                                    dataInput.addEventListener('change', () => {
                                        item.data = dataInput.value;
                                        saveValue(arr, true);
                                        if (typeof dataInput._onCustomChange === 'function') dataInput._onCustomChange();
                                    });
                                    dataControl = dataInput;
                                }
                                dataRow.appendChild(makeCell(12, 'Data', dataControl, null, bindSpec(item, lIdx, 'data', 'text')));
                                content.appendChild(dataRow);

                                const multRow = makeRow();
                                multRow.appendChild(makeCell(
                                    3,
                                    'Value Multiplier',
                                    numInput(item, 'valueMultiplier', null, null, lIdx),
                                    null,
                                    bindSpec(item, lIdx, 'valueMultiplier', 'number'),
                                    '0 leaves the value unchanged. Any other number multiplies every sample.'
                                ));
                                content.appendChild(multRow);

                                const posRow = makeRow('stroke');
                                const posColor = makeCell(6, seriesColorLabel('positive'), colorMount(item, 'positiveColor', lIdx), null, bindSpec(item, lIdx, 'positiveColor', 'color', () => seriesColorLabel('positive')));
                                const posOp = makeCell(6, seriesOpacityLabel('positive'), numInput(item, 'positiveColorOpacity', 0, 100, lIdx), null, bindSpec(item, lIdx, 'positiveColorOpacity', 'number', () => seriesOpacityLabel('positive')));
                                posColor.setAttribute('data-series-color', 'positive');
                                posOp.setAttribute('data-series-opacity', 'positive');
                                posRow.appendChild(posColor);
                                posRow.appendChild(posOp);
                                content.appendChild(posRow);

                                const negRow = makeRow('stroke');
                                const negColor = makeCell(6, seriesColorLabel('negative'), colorMount(item, 'negativeColor', lIdx), null, bindSpec(item, lIdx, 'negativeColor', 'color', () => seriesColorLabel('negative')));
                                const negOp = makeCell(6, seriesOpacityLabel('negative'), numInput(item, 'negativeColorOpacity', 0, 100, lIdx), null, bindSpec(item, lIdx, 'negativeColorOpacity', 'number', () => seriesOpacityLabel('negative')));
                                negColor.setAttribute('data-series-color', 'negative');
                                negOp.setAttribute('data-series-opacity', 'negative');
                                negRow.appendChild(negColor);
                                negRow.appendChild(negOp);
                                content.appendChild(negRow);

                                const lineRow = makeRow('line');
                                lineRow.appendChild(makeCell(6, 'Line Width', numInput(item, 'lineWidth', 0, null, lIdx), 'line', bindSpec(item, lIdx, 'lineWidth', 'number')));
                                lineRow.appendChild(makeCell(6, 'Point Color', colorMount(item, 'pointColor', lIdx), 'point', bindSpec(item, lIdx, 'pointColor', 'color')));
                                content.appendChild(lineRow);

                                const fillPos = makeRow('fill');
                                fillPos.appendChild(makeCell(4, 'Positive Fill Color', colorMount(item, 'positiveFillColor', lIdx), null, bindSpec(item, lIdx, 'positiveFillColor', 'color')));
                                fillPos.appendChild(makeCell(4, 'Positive Start Opacity', numInput(item, 'positiveStartOpacity', 0, 100, lIdx), null, bindSpec(item, lIdx, 'positiveStartOpacity', 'number')));
                                fillPos.appendChild(makeCell(4, 'Positive End Opacity', numInput(item, 'positiveEndOpacity', 0, 100, lIdx), null, bindSpec(item, lIdx, 'positiveEndOpacity', 'number')));
                                content.appendChild(fillPos);

                                const fillNeg = makeRow('fill');
                                fillNeg.appendChild(makeCell(4, 'Negative Fill Color', colorMount(item, 'negativeFillColor', lIdx), null, bindSpec(item, lIdx, 'negativeFillColor', 'color')));
                                fillNeg.appendChild(makeCell(4, 'Negative Start Opacity', numInput(item, 'negativeStartOpacity', 0, 100, lIdx), null, bindSpec(item, lIdx, 'negativeStartOpacity', 'number')));
                                fillNeg.appendChild(makeCell(4, 'Negative End Opacity', numInput(item, 'negativeEndOpacity', 0, 100, lIdx), null, bindSpec(item, lIdx, 'negativeEndOpacity', 'number')));
                                content.appendChild(fillNeg);

                                const outlineRow = makeRow('bar');
                                outlineRow.appendChild(makeCell(6, 'Positive Outline Color', colorMount(item, 'positiveOutlineColor', lIdx), null, bindSpec(item, lIdx, 'positiveOutlineColor', 'color')));
                                outlineRow.appendChild(makeCell(6, 'Negative Outline Color', colorMount(item, 'negativeOutlineColor', lIdx), null, bindSpec(item, lIdx, 'negativeOutlineColor', 'color')));
                                content.appendChild(outlineRow);

                                card.appendChild(content);
                                listRoot.appendChild(card);
                            });

                            wrap.appendChild(listRoot);
                            const actionRow = document.createElement('div');
                            actionRow.className = 'grid grid-cols-2 gap-2 mt-2';

                            const addBtn = document.createElement('button');
                            addBtn.type = 'button';
                            addBtn.className = 'btn-tool primary w-full justify-center py-2';
                            addBtn.innerHTML = '<i class="ph-bold ph-plus"></i> Add Graph';
                            addBtn.onclick = () => {
                                if (typeof GraphWidget === 'undefined') return;
                                arr.push(GraphWidget.createSeries(arr.length));
                                saveValue(arr, true);
                                renderList();
                            };

                            const pickBtn = document.createElement('button');
                            pickBtn.type = 'button';
                            pickBtn.className = 'btn-tool w-full justify-center py-2';
                            pickBtn.innerHTML = '<i class="ph-bold ph-chart-line"></i> Pick Live Values';
                            pickBtn.onclick = () => {
                                ensureGraphDataPicker().then(() => {
                                    if (typeof GraphDataPicker === 'undefined' || typeof GraphDataPicker.open !== 'function') return;
                                    GraphDataPicker.open({
                                        widgetId: this.currentId,
                                        series: arr,
                                        onApply: () => {
                                            const wdg = Dashboard.widgets[this.currentId];
                                            if (wdg && wdg.overrides && Array.isArray(wdg.overrides.series)) {
                                                arr = wdg.overrides.series;
                                                this._setSnapshotValue(f.key, arr);
                                            }
                                            renderList();
                                        }
                                    });
                                }).catch((err) => {
                                    console.error('[Editor] Live Values picker failed to open:', err);
                                });
                            };

                            actionRow.appendChild(addBtn);
                            actionRow.appendChild(pickBtn);
                            wrap.appendChild(actionRow);

                            if (typeof EditorReorder !== 'undefined' && typeof EditorReorder.attach === 'function') {
                                seriesReorder = EditorReorder.attach(listRoot, {
                                    onReorder: (from, to) => {
                                        const arrBefore = arr.slice();
                                        const moved = arr.splice(from, 1)[0];
                                        arr.splice(to, 0, moved);
                                        const wdg = Dashboard.widgets[this.currentId];
                                        const newB = Editor.remapGraphSeriesBindings((wdg && wdg.bindings) || {}, arrBefore, arr);
                                        Dashboard.updateWidgetBinding(this.currentId, newB, true);
                                        this.remapEditorListRowCollapseStates(this.currentId, f.key, arrBefore, arr);
                                        saveValue(arr, true);
                                        renderList();
                                    }
                                });
                            }
                            syncSeriesModes(this.currentValuesSnapshot || values);
                            if (namesChanged) saveValue(arr, true);
                        };

                        renderList();
                        if (f.key && this.fieldRegistry[f.key]) {
                            this.fieldRegistry[f.key].syncDynamicContent = (vals) => syncSeriesModes(vals);
                        }
                        const seriesSpan = 'col-span-' + (f.cols || 12);
                        if (w.classList.contains(seriesSpan)) w.classList.replace(seriesSpan, 'col-span-12');
                        else w.classList.add('col-span-12');
                        w.appendChild(wrap);
                        grid.appendChild(w);
                        return;
                    } else if (f.type === 'menu_list') {
                        const wrap = document.createElement('div');
                        wrap.className = 'w-full flex flex-col gap-2 mt-2 col-span-12';
                        let arr = Array.isArray(rawValue) ? [...rawValue] : [];
                        if (typeof rawValue === 'string') {
                            try { arr = JSON.parse(rawValue); } catch (e) { arr = []; }
                        }

                        let menuListReorder = null;

                        const renderList = () => {
                            if (menuListReorder) {
                                menuListReorder.destroy();
                                menuListReorder = null;
                            }
                            Editor._cleanupSubtreeDropdowns(wrap);
                            wrap.innerHTML = '';
                            const listRoot = document.createElement('div');
                            listRoot.className = 'flex flex-col gap-2';

                            arr.forEach((item, lIdx) => {
                                if (item.mode === 'spacer') item.mode = 'separator';
                                const card = document.createElement('div');
                                card.className = 'editor-collapse-card editor-collapse-card--closed ds-reorder-item';

                                const head = document.createElement('div');
                                head.className = 'editor-collapse-header';

                                const dragHandle = (typeof EditorReorder !== 'undefined' && typeof EditorReorder.createDragHandle === 'function')
                                    ? EditorReorder.createDragHandle()
                                    : (() => {
                                        const h = document.createElement('span');
                                        h.className = 'ds-reorder-handle';
                                        h.innerHTML = '<i class="ph-bold ph-dots-six-vertical"></i>';
                                        h.addEventListener('click', (e) => e.stopPropagation());
                                        return h;
                                    })();

                                const titleSpan = document.createElement('span');
                                titleSpan.className = 'text-xs font-bold text-[var(--ui-text)] flex items-center gap-2 pointer-events-none truncate flex-1 min-w-0';
                                titleSpan.innerHTML = Editor.menuItemListTitleHtml(item);

                                const headActions = document.createElement('div');
                                headActions.className = 'flex items-center gap-2 shrink-0';
                                const toggleIcon = document.createElement('i');
                                toggleIcon.className = 'ph-bold ph-caret-down text-[var(--ui-text-muted)] transition-transform';
                                const dupBtn = document.createElement('button');
                                dupBtn.type = 'button';
                                dupBtn.className = 'text-[var(--ui-text-muted)] hover:text-[var(--ui-accent)] text-sm p-1 z-10';
                                dupBtn.title = 'Duplicate menu item';
                                dupBtn.setAttribute('aria-label', 'Duplicate menu item');
                                dupBtn.innerHTML = '<i class="ph-bold ph-copy"></i>';
                                dupBtn.onclick = (e) => {
                                    e.stopPropagation();
                                    const ix = arr.indexOf(item);
                                    if (ix < 0) return;
                                    let parsedDup;
                                    try {
                                        parsedDup = JSON.parse(JSON.stringify(item));
                                    } catch (err) {
                                        return;
                                    }
                                    arr.splice(ix + 1, 0, parsedDup);
                                    const w = Dashboard.widgets[this.currentId];
                                    const newB = Editor.duplicateMenuItemBindingsAt((w && w.bindings) || {}, ix);
                                    const newOvs = Editor.duplicateMenuItemOverridesAt((w && w.overrides) || {}, ix, arr);
                                    Editor.remapEditorListRowCollapseStatesAfterMenuInsert(this.currentId, f.key, ix);
                                    Dashboard.updateWidgetBinding(this.currentId, newB, true);
                                    this._isEditorDrivenUpdate = true;
                                    try {
                                        Dashboard.updateWidget(this.currentId, newOvs, true);
                                        Editor.notifyInspectorMergedConfigMayHaveChanged(this.currentId, null, true);
                                        this._setSnapshotValue(f.key, arr);
                                    } finally {
                                        this._isEditorDrivenUpdate = false;
                                    }
                                    renderList();
                                    this._handleFieldDependencyChange(f.key, 'change');
                                };
                                const delBtn = document.createElement('button');
                                delBtn.type = 'button';
                                delBtn.className = 'text-danger text-sm p-1 z-10';
                                delBtn.title = 'Delete menu item';
                                delBtn.setAttribute('aria-label', 'Delete menu item');
                                delBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
                                delBtn.onclick = (e) => {
                                    e.stopPropagation();
                                    const ix = arr.indexOf(item);
                                    if (ix < 0) return;
                                    const arrBefore = [...arr];
                                    arr.splice(ix, 1);
                                    const w = Dashboard.widgets[this.currentId];
                                    const newB = Editor.remapMenuItemBindings((w && w.bindings) || {}, arrBefore, arr);
                                    Dashboard.updateWidgetBinding(this.currentId, newB, true);
                                    this.remapEditorListRowCollapseStates(this.currentId, f.key, arrBefore, arr);
                                    saveValue(arr, true);
                                    renderList();
                                    this._handleFieldDependencyChange(f.key, 'change');
                                };

                                headActions.appendChild(dupBtn);
                                headActions.appendChild(delBtn);
                                headActions.appendChild(toggleIcon);
                                head.appendChild(dragHandle);
                                head.appendChild(titleSpan);
                                head.appendChild(headActions);
                                card.appendChild(head);

                                const content = document.createElement('div');
                                content.className = 'editor-collapse-content hidden flex flex-col gap-3';
                                const menuRowCollapseKey = this.editorListRowCollapseKey(this.currentId, f.key, lIdx);
                                this.attachPersistedEditorCollapse(menuRowCollapseKey, head, content, toggleIcon, {});

                                this._renderMenuItemEditorGrid(content, item, lIdx, arr, f, currentBindings, isGlobal, saveValue, titleSpan, function () { renderList(); });

                                card.appendChild(content);
                                listRoot.appendChild(card);
                            });

                            wrap.appendChild(listRoot);

                            const addBtn = document.createElement('button');
                            addBtn.className = 'btn-tool primary w-full justify-center py-2 mt-2';
                            addBtn.innerHTML = '<i class="ph-bold ph-plus"></i> Add Menu Item';
                            addBtn.onclick = () => {
                                const slot = (typeof MenuWidget !== 'undefined' && MenuWidget.defaultIconSlot)
                                    ? MenuWidget.defaultIconSlot()
                                    : { source: 'phosphor', builtin: '', weight: 'fill', customUrl: '', tintImage: false };
                                arr.push({
                                    label: 'New Item',
                                    mode: 'push',
                                    actionType: 'topic',
                                    icons: { on: { ...slot }, off: { ...slot } },
                                    iconColorOverrides: {
                                        on: { enabled: false, color: '#ffffff' },
                                        off: { enabled: false, color: '#94a3b8' }
                                    }
                                });
                                saveValue(arr);
                                renderList();
                                this._handleFieldDependencyChange(f.key, 'change');
                            };
                            wrap.appendChild(addBtn);

                            const batchBtn = document.createElement('button');
                            batchBtn.type = 'button';
                            batchBtn.className = 'btn-tool w-full justify-center py-2';
                            batchBtn.innerHTML = '<i class="ph-bold ph-link"></i> Batch Add Weblinks';
                            batchBtn.onclick = () => {
                                this.openBatchWeblinksDialog(arr, saveValue, renderList, f);
                            };
                            wrap.appendChild(batchBtn);

                            if (typeof EditorReorder !== 'undefined' && typeof EditorReorder.attach === 'function') {
                                menuListReorder = EditorReorder.attach(listRoot, {
                                    onReorder: (from, to) => {
                                        const arrBefore = [...arr];
                                        const moved = arr.splice(from, 1)[0];
                                        arr.splice(to, 0, moved);
                                        const w = Dashboard.widgets[this.currentId];
                                        const newB = Editor.remapMenuItemBindings((w && w.bindings) || {}, arrBefore, arr);
                                        Dashboard.updateWidgetBinding(this.currentId, newB, true);
                                        this.remapEditorListRowCollapseStates(this.currentId, f.key, arrBefore, arr);
                                        saveValue(arr, true);
                                        this._handleFieldDependencyChange(f.key, 'change');
                                        renderList();
                                    }
                                });
                            }
                        };

                        renderList();
                        w.classList.replace(`col-span-${f.cols}`, 'col-span-12');
                        w.appendChild(wrap);
                        grid.appendChild(w);
                        return;
                    } else if (f.type === 'point_list') {
                        const wrap = document.createElement('div');
                        wrap.className = 'w-full flex flex-col gap-2 mt-2 col-span-12';

                        let arr = Array.isArray(rawValue) ? [...rawValue] : [];
                        if (typeof rawValue === 'string') {
                            try { arr = JSON.parse(rawValue); } catch (e) { arr = []; }
                        }

                        const widgetRelative = !!f.widgetRelative;
                        const pointRadius = !!f.pointRadius;
                        const freeBounds = !!f.freeBounds;
                        const trackActive = !!f.trackActivePoint;
                        const itemLabel = f.itemLabel || 'Point';
                        const addLabel = f.addLabel || 'Add Point';
                        const minPoints = (f.minPoints > 0) ? f.minPoints : 0;

                        const shapeBox = () => {
                            const wdg = (this.currentId && Dashboard.widgets) ? Dashboard.widgets[this.currentId] : null;
                            const cfg = wdg && wdg.config ? wdg.config : null;
                            const width = (cfg && cfg.width > 0) ? cfg.width : 1;
                            const height = (cfg && cfg.height > 0) ? cfg.height : 1;
                            const x = cfg ? (Number(cfg.x) || 0) : 0;
                            const y = cfg ? (Number(cfg.y) || 0) : 0;
                            return { x: x, y: y, width: width, height: height };
                        };
                        const snapCanvas = (v) => {
                            const grid = (MASTER_SETTINGS && MASTER_SETTINGS.snapToGrid && MASTER_SETTINGS.gridSize)
                                ? MASTER_SETTINGS.gridSize : 1;
                            const g = grid > 0 ? grid : 1;
                            return Math.round(v / g) * g;
                        };
                        const localToFrac = (local, origin, size) => {
                            const span = size > 0 ? size : 1;
                            let snapped = snapCanvas(origin + local);
                            if (!freeBounds) {
                                const min = origin;
                                const max = origin + span;
                                if (snapped < min) snapped = min;
                                if (snapped > max) snapped = max;
                            }
                            return (snapped - origin) / span;
                        };
                        const fracToLocal = (frac, size) => {
                            const n = Number(frac);
                            const safe = Number.isFinite(n) ? n : 0;
                            return Math.round(safe * size);
                        };
                        const inheritedCornerRadius = () => {
                            const wdg = (this.currentId && Dashboard.widgets) ? Dashboard.widgets[this.currentId] : null;
                            const cfg = wdg && wdg.config ? wdg.config : null;
                            const n = cfg ? Number(cfg.cornerRadius) : 0;
                            return Number.isFinite(n) ? n : 0;
                        };

                        const renderList = () => {
                            Editor._cleanupSubtreeDropdowns(wrap);
                            wrap.innerHTML = '';
                            const box = widgetRelative ? shapeBox() : null;
                            const inheritedRadius = pointRadius ? inheritedCornerRadius() : 0;
                            arr.forEach((point, pIdx) => {
                                const row = document.createElement('div');
                                const shapeWidget = (!isGlobal && this.currentId && Dashboard.widgets)
                                    ? Dashboard.widgets[this.currentId] : null;
                                const rowActive = trackActive && shapeWidget && shapeWidget._shapeActiveIndex === pIdx;
                                row.className = 'w-full editor-surface p-2 rounded border editor-hairline relative mb-1'
                                    + (rowActive ? ' shape-point-active' : '');
                                if (trackActive) {
                                    row.setAttribute('data-shape-point', String(pIdx));
                                    row.addEventListener('pointerdown', () => {
                                        const wdg = Dashboard.widgets && Dashboard.widgets[this.currentId];
                                        if (wdg && typeof wdg._setShapeActiveIndex === 'function') {
                                            wdg._setShapeActiveIndex(pIdx);
                                        }
                                    });
                                }

                                const headerWrap = document.createElement('div');
                                headerWrap.className = 'flex justify-between items-center mb-2';

                                const idxLabel = document.createElement('div');
                                idxLabel.className = 'text-[10px] uppercase font-bold editor-muted-text select-none';
                                idxLabel.innerText = itemLabel + ' ' + (pIdx + 1);
                                headerWrap.appendChild(idxLabel);

                                const delBtn = document.createElement('button');
                                delBtn.className = 'btn-tool danger w-6 h-6 px-0 flex-shrink-0 flex items-center justify-center';
                                delBtn.title = 'Remove ' + itemLabel;
                                delBtn.innerHTML = '<i class="ph-bold ph-trash text-sm"></i>';
                                if (minPoints > 0 && arr.length <= minPoints) delBtn.style.display = 'none';
                                delBtn.onclick = () => {
                                    if (minPoints > 0 && arr.length <= minPoints) return;
                                    const newB = { ...currentBindings };

                                    // Remove bindings for the deleted index
                                    delete newB[`${f.key}_${pIdx}_X`];
                                    delete newB[`${f.key}_${pIdx}_Y`];
                                    if (pointRadius) delete newB[`${f.key}_${pIdx}_R`];

                                    // Shift bindings for subsequent indices down by 1
                                    for (let i = pIdx + 1; i < arr.length; i++) {
                                        if (newB[`${f.key}_${i}_X`] !== undefined) {
                                            newB[`${f.key}_${i - 1}_X`] = newB[`${f.key}_${i}_X`];
                                            delete newB[`${f.key}_${i}_X`];
                                        }
                                        if (newB[`${f.key}_${i}_Y`] !== undefined) {
                                            newB[`${f.key}_${i - 1}_Y`] = newB[`${f.key}_${i}_Y`];
                                            delete newB[`${f.key}_${i}_Y`];
                                        }
                                        if (pointRadius && newB[`${f.key}_${i}_R`] !== undefined) {
                                            newB[`${f.key}_${i - 1}_R`] = newB[`${f.key}_${i}_R`];
                                            delete newB[`${f.key}_${i}_R`];
                                        }
                                    }

                                    arr.splice(pIdx, 1);
                                    if (trackActive && !isGlobal && this.currentId && Dashboard.widgets) {
                                        const wdg = Dashboard.widgets[this.currentId];
                                        if (wdg && wdg._shapeActiveIndex != null) {
                                            if (wdg._shapeActiveIndex === pIdx) {
                                                wdg._shapeActiveIndex = Math.max(0, Math.min(pIdx, arr.length - 1));
                                            } else if (wdg._shapeActiveIndex > pIdx) {
                                                wdg._shapeActiveIndex -= 1;
                                            }
                                        }
                                    }
                                    saveValue(arr);

                                    if (isGlobal) Dashboard.updateGlobalBinding(newB, true);
                                    else Dashboard.updateWidgetBinding(this.currentId, newB, true);

                                    renderList();
                            this._handleFieldDependencyChange(f.key, 'change');
                                };
                                headerWrap.appendChild(delBtn);
                                row.appendChild(headerWrap);

                                const colsWrap = document.createElement('div');
                                colsWrap.className = 'flex w-full gap-2';

                                const createCoordinateField = (coord, ptKey, bindKeySuffix, onChangeVal, extra) => {
                                    const col = document.createElement('div');
                                    col.className = 'flex flex-col flex-1 gap-1';

                                    const isBound = currentBindings && currentBindings[bindKeySuffix] !== undefined;

                                    const headerRow = document.createElement('div');
                                    headerRow.className = 'control-header-row';

                                    const lblSpan = document.createElement('span');
                                    lblSpan.className = 'control-label';
                                    lblSpan.innerText = ptKey;
                                    headerRow.appendChild(lblSpan);

                                    const coordControlsDiv = document.createElement('div');
                                    const controlsDiv = coordControlsDiv;
                                    coordControlsDiv.className = 'control-header-actions' + (isBound ? ' control-header-actions--pinned' : '');

                                    if (canBind) {
                                        const bindBtn = document.createElement('button');
                                        if (isBound) {
                                            bindBtn.className = 'btn-bind active transition-colors';
                                        } else {
                                            bindBtn.className = 'btn-bind transition-colors';
                                        }
                                        bindBtn.title = isBound ? "Unlink Topic" : "Link to Topic";
                                        bindBtn.innerHTML = `<i class="ph ${isBound ? 'ph-link-break' : 'ph-link'} text-xs"></i>`;
                                        bindBtn.onclick = () => {
                                            const newB = { ...currentBindings };
                                            if (isBound) delete newB[bindKeySuffix];
                                            else newB[bindKeySuffix] = "";

                                            if (isGlobal) Dashboard.updateGlobalBinding(newB, true);
                                            else Dashboard.updateWidgetBinding(this.currentId, newB, true);
                                            this.loadWidget(this.currentId);
                                        };
                                        controlsDiv.appendChild(bindBtn);
                                    }
                                    if (extra && typeof extra.onReset === 'function') {
                                        const resetIcon = document.createElement('i');
                                        resetIcon.className = 'ph-bold ph-arrow-counter-clockwise btn-reset text-xs editor-muted-text cursor-pointer transition-colors';
                                        resetIcon.title = 'Reset to Default';
                                        this._setResetIdle(resetIcon, !extra.resetActive);
                                        resetIcon.onclick = (ev) => {
                                            ev.preventDefault();
                                            ev.stopPropagation();
                                            extra.onReset();
                                        };
                                        controlsDiv.appendChild(resetIcon);
                                    }
                                    this._appendHeaderActions(headerRow, controlsDiv);
                                    col.appendChild(headerRow);

                                    if (isBound) {
                                        const wrap = Editor.createTopicDropdown(currentBindings[bindKeySuffix] || '', 'msg.topic', (val) => {
                                            if (isGlobal) Dashboard.updateGlobalBinding({ [bindKeySuffix]: val });
                                            else Dashboard.updateWidgetBinding(this.currentId, { [bindKeySuffix]: val });
                                        });
                                        col.appendChild(wrap);
                                    } else {
                                        const inp = document.createElement('input');
                                        inp.type = 'number';
                                        inp.className = 'control-input text-xs w-full';
                                        inp.placeholder = (extra && extra.placeholder != null) ? String(extra.placeholder) : ptKey;
                                        if (extra && extra.allowEmpty && (coord === undefined || coord === null || coord === '')) {
                                            inp.value = '';
                                        } else {
                                            inp.value = coord !== undefined ? coord : 0;
                                        }
                                        if (extra && extra.min != null) inp.min = String(extra.min);
                                        inp.onchange = (e) => {
                                            if (extra && extra.allowEmpty && String(e.target.value).trim() === '') {
                                                onChangeVal(null);
                                                return;
                                            }
                                            onChangeVal(parseFloat(e.target.value) || 0);
                                        };
                                        col.appendChild(inp);
                                    }
                                    return col;
                                };

                                const displayX = widgetRelative ? fracToLocal(point.x, box.width) : point.x;
                                const displayY = widgetRelative ? fracToLocal(point.y, box.height) : point.y;
                                const xCol = createCoordinateField(displayX, 'X', `${f.key}_${pIdx}_X`, (val) => {
                                    arr[pIdx].x = widgetRelative ? localToFrac(val, box.x, box.width) : val;
                                    saveValue(arr);
                                    this._handleFieldDependencyChange(f.key, 'change');
                                });
                                const yCol = createCoordinateField(displayY, 'Y', `${f.key}_${pIdx}_Y`, (val) => {
                                    arr[pIdx].y = widgetRelative ? localToFrac(val, box.y, box.height) : val;
                                    saveValue(arr);
                                    this._handleFieldDependencyChange(f.key, 'change');
                                });

                                colsWrap.appendChild(xCol);
                                colsWrap.appendChild(yCol);
                                row.appendChild(colsWrap);

                                if (pointRadius) {
                                    const hasRadius = point.radius !== undefined && point.radius !== null && point.radius !== '';
                                    const radiusCol = createCoordinateField(
                                        hasRadius ? point.radius : undefined,
                                        'Corner Radius',
                                        `${f.key}_${pIdx}_R`,
                                        (val) => {
                                            if (val === null) delete arr[pIdx].radius;
                                            else arr[pIdx].radius = Math.max(0, val);
                                            saveValue(arr);
                                            renderList();
                                            this._handleFieldDependencyChange(f.key, 'change');
                                        },
                                        {
                                            placeholder: inheritedRadius,
                                            allowEmpty: true,
                                            min: 0,
                                            resetActive: hasRadius,
                                            onReset: () => {
                                                delete arr[pIdx].radius;
                                                saveValue(arr);
                                                renderList();
                                                this._handleFieldDependencyChange(f.key, 'change');
                                            }
                                        }
                                    );
                                    const radiusWrap = document.createElement('div');
                                    radiusWrap.className = 'w-full mt-2';
                                    radiusWrap.appendChild(radiusCol);
                                    row.appendChild(radiusWrap);
                                }

                                wrap.appendChild(row);
                            });

                            const addBtn = document.createElement('button');
                            addBtn.className = 'btn-tool py-1 mt-1 border editor-hairline w-full justify-center editor-accent-text editor-accent-hover text-xs';
                            addBtn.innerHTML = '<i class="ph-bold ph-plus"></i> ' + addLabel;
                            addBtn.onclick = () => {
                                const wdg = (!isGlobal && this.currentId && Dashboard.widgets) ? Dashboard.widgets[this.currentId] : null;
                                const hasSelected = trackActive && wdg && Number.isInteger(wdg._shapeActiveIndex)
                                    && wdg._shapeActiveIndex >= 0 && wdg._shapeActiveIndex < arr.length;
                                const selectedIndex = hasSelected ? wdg._shapeActiveIndex : -1;
                                const insertIndex = (selectedIndex >= 0) ? selectedIndex + 1 : arr.length;

                                if (widgetRelative) {
                                    const b = shapeBox();
                                    let fx = 0.5;
                                    let fy = 0.5;
                                    if (arr.length >= 2) {
                                        const curr = (selectedIndex >= 0) ? arr[selectedIndex] : arr[arr.length - 1];
                                        const next = (selectedIndex >= 0) ? arr[(selectedIndex + 1) % arr.length] : arr[0];
                                        fx = (Number(curr.x) + Number(next.x)) / 2;
                                        fy = (Number(curr.y) + Number(next.y)) / 2;
                                    } else if (arr.length === 1) {
                                        fx = Number(arr[0].x);
                                        fy = Number(arr[0].y);
                                    }
                                    arr.splice(insertIndex, 0, {
                                        x: localToFrac(fx * b.width, b.x, b.width),
                                        y: localToFrac(fy * b.height, b.y, b.height)
                                    });
                                } else {
                                    let newX = 200, newY = 200;
                                    if (selectedIndex >= 0) {
                                        if (selectedIndex < arr.length - 1) {
                                            newX = (Number(arr[selectedIndex].x) + Number(arr[selectedIndex + 1].x)) / 2;
                                            newY = (Number(arr[selectedIndex].y) + Number(arr[selectedIndex + 1].y)) / 2;
                                        } else {
                                            newX = Number(arr[selectedIndex].x) + 50;
                                            newY = Number(arr[selectedIndex].y);
                                        }
                                    } else if (arr.length > 0) {
                                        newX = arr[arr.length - 1].x + 50;
                                        newY = arr[arr.length - 1].y;
                                    } else if (this.currentId && Dashboard.widgets[this.currentId]) {
                                        const wBase = Dashboard.widgets[this.currentId].config;
                                        newX = (wBase.fromX + wBase.toX) / 2 || 200;
                                        newY = (wBase.fromY + wBase.toY) / 2 || 200;
                                    }
                                    arr.splice(insertIndex, 0, { x: newX, y: newY });
                                }

                                if (currentBindings && insertIndex < arr.length) {
                                    let bindingsChanged = false;
                                    const newB = { ...currentBindings };
                                    for (let i = arr.length - 2; i >= insertIndex; i--) {
                                        if (newB[`${f.key}_${i}_X`] !== undefined) {
                                            newB[`${f.key}_${i + 1}_X`] = newB[`${f.key}_${i}_X`];
                                            delete newB[`${f.key}_${i}_X`];
                                            bindingsChanged = true;
                                        }
                                        if (newB[`${f.key}_${i}_Y`] !== undefined) {
                                            newB[`${f.key}_${i + 1}_Y`] = newB[`${f.key}_${i}_Y`];
                                            delete newB[`${f.key}_${i}_Y`];
                                            bindingsChanged = true;
                                        }
                                        if (pointRadius && newB[`${f.key}_${i}_R`] !== undefined) {
                                            newB[`${f.key}_${i + 1}_R`] = newB[`${f.key}_${i}_R`];
                                            delete newB[`${f.key}_${i}_R`];
                                            bindingsChanged = true;
                                        }
                                    }
                                    if (bindingsChanged) {
                                        if (isGlobal) Dashboard.updateGlobalBinding(newB, true);
                                        else Dashboard.updateWidgetBinding(this.currentId, newB, true);
                                    }
                                }

                                if (trackActive && wdg) {
                                    wdg._shapeActiveIndex = insertIndex;
                                }
                                saveValue(arr);
                                renderList();
                                this._handleFieldDependencyChange(f.key, 'change');
                            };
                            wrap.appendChild(addBtn);
                        };

                        renderList();
                        w.classList.replace(`col-span-${f.cols}`, 'col-span-12');
                        w.appendChild(wrap);
                        grid.appendChild(w);
                        return;
                    } else if (f.type === 'selection_group') {
                        const sendOffF = group.fields[fi + 1];
                        // Bundle regardless of current visibility: the checkbox lives inside the
                        // picklist card either way, and `setSecondaryVisible` follows its `visibleWhen`.
                        const bundleSendOff = !!(sendOffF && sendOffF.key === 'sendOffOnGroupDeselect' && sendOffF.type === 'checkbox'
                            && !editorFieldIsBound(sendOffF));
                        if (bundleSendOff) {
                            bundledFieldSkip.add(sendOffF.key);
                        }
                        const sendOffVisible = bundleSendOff && this._isFieldVisible(sendOffF, values, isGlobal, group);

                        const sgDisabled = typeof f.disableWhen === 'function' ? !!f.disableWhen(values, isGlobal) : false;

                        const initial = String(rawValue || '').trim();
                        let sendOffRaw = bundleSendOff ? values[sendOffF.key] : undefined;
                        if (bundleSendOff && (sendOffRaw === undefined || sendOffRaw === null) && sendOffF.defaultKey) {
                            if (values[sendOffF.defaultKey] !== undefined) {
                                sendOffRaw = values[sendOffF.defaultKey];
                            } else if (typeof DataConfig !== 'undefined' && DataConfig[sendOffF.defaultKey] !== undefined) {
                                sendOffRaw = DataConfig[sendOffF.defaultKey];
                            }
                        }

                        const body = document.createElement('div');
                        body.className = 'flex flex-col gap-2 w-full';
                        const sgOpts = {
                            initialId: initial,
                            disabled: sgDisabled,
                            hideOptionRowsWhenNoId: true,
                            onCommitId: (trimmed) => {
                                saveValue(trimmed, true);
                                if (trimmed) Dashboard.ensureSelectionGroupEntry(trimmed);
                                this._handleFieldDependencyChange(f.key, 'change');
                            }
                        };
                        if (bundleSendOff) {
                            sgOpts.secondaryCheckboxes = [{
                                label: sendOffF.label || 'Send Off When Turned Off by Group',
                                tooltipKey: sendOffF.key || 'sendOffOnGroupDeselect',
                                initialChecked: Editor.ensureBool(sendOffRaw),
                                visible: sendOffVisible,
                                onChange: (checked) => {
                                    this._isEditorDrivenUpdate = true;
                                    try {
                                        Dashboard.updateWidget(this.currentId, { [sendOffF.key]: checked });
                                        this._setSnapshotValue(sendOffF.key, checked);
                                    } finally {
                                        this._isEditorDrivenUpdate = false;
                                    }
                                    this._handleFieldDependencyChange(sendOffF.key, 'change');
                                }
                            }];
                        }
                        const sgUi = Editor.renderSelectionGroupPicklistAndAllowEmpty(body, sgOpts);
                        w.appendChild(body);
                        const sgReg = f.key ? this.fieldRegistry[f.key] : null;
                        if (sgReg) {
                            sgReg.inputEl = sgUi.picklist.input;
                            // The picklist owns the bundled checkbox and the allow-empty row, so both
                            // follow their sibling fields from here instead of through the field loop.
                            sgReg.syncDynamicContent = (vals, ig) => {
                                if (typeof f.disableWhen === 'function') {
                                    sgUi.setDisabled(!!f.disableWhen(vals, ig));
                                }
                                if (bundleSendOff) {
                                    sgUi.setSecondaryVisible(0, this._isFieldVisible(sendOffF, vals, ig, group));
                                }
                            };
                        }
                        if (bundleSendOff && sendOffF.key) {
                            // No standalone wrapper: the reactive field loop must not hide the
                            // selection group card on this entry's behalf.
                            this.fieldRegistry[sendOffF.key] = {
                                wrapperEl: null,
                                fieldDef: sendOffF,
                                groupId: gid,
                                inputEl: sgUi.secondaryRefs && sgUi.secondaryRefs[0] ? sgUi.secondaryRefs[0].input : null
                            };
                        }
                        w.classList.replace(`col-span-${f.cols}`, 'col-span-12');
                        grid.appendChild(w);
                        return;
                    } else {
                        if (f.type === 'color' && typeof EditorColorPicker !== 'undefined') {
                            const getLiveColorRaw = () => {
                                if (f.themeColorToken && typeof MasterLayout !== 'undefined') {
                                    const tc = MASTER_SETTINGS.themeColors || MasterLayout.defaultThemeColors();
                                    let v = tc[f.themeColorToken];
                                    if (v === undefined || v === null || v === '') {
                                        v = MasterLayout.defaultThemeColors()[f.themeColorToken];
                                    }
                                    return v === undefined || v === null ? '' : String(v);
                                }
                                let v;
                                if (isGlobal) {
                                    v = this._resolveInspectorFieldRawValue(f, MASTER_SETTINGS, MASTER_SETTINGS, true, null);
                                } else {
                                    const inst = Dashboard.widgets[this.currentId];
                                    if (!inst) return '';
                                    const merged = this._buildMergedStaticValues(inst);
                                    v = this._resolveInspectorFieldRawValue(f, merged, inst.overrides || {}, false, merged);
                                }
                                if (v === undefined || v === null) {
                                    const schemaDefault = this._getGlobalFactoryDefault(f);
                                    if (schemaDefault !== undefined) v = schemaDefault;
                                }
                                if ((v === undefined || v === null) && f.defaultKeyFallback) {
                                    if (isGlobal) {
                                        if (MASTER_SETTINGS[f.defaultKeyFallback] !== undefined) v = MASTER_SETTINGS[f.defaultKeyFallback];
                                        else if (typeof DataConfig !== 'undefined' && DataConfig[f.defaultKeyFallback] !== undefined) {
                                            v = DataConfig[f.defaultKeyFallback];
                                        }
                                    } else {
                                        const inst = Dashboard.widgets[this.currentId];
                                        const bag = inst && inst.config;
                                        if (bag && bag[f.defaultKeyFallback] !== undefined) v = bag[f.defaultKeyFallback];
                                        else if (typeof DataConfig !== 'undefined' && DataConfig[f.defaultKeyFallback] !== undefined) {
                                            v = DataConfig[f.defaultKeyFallback];
                                        }
                                    }
                                }
                                if ((v === undefined || v === null || v === '') && Object.prototype.hasOwnProperty.call(f, 'default')) {
                                    v = f.default;
                                }
                                return v === undefined || v === null ? '' : String(v);
                            };
                            const allowThemeTokens = !f.themeColorToken && typeof MasterLayout !== 'undefined';
                            const picker = this._attachColorPicker({
                                mountCard: w,
                                getRaw: getLiveColorRaw,
                                setValue: (val, skipReload, commitSource) => saveValue(val, skipReload, f.key, commitSource),
                                allowThemeTokens,
                                fieldKey: f.key,
                                onFieldChromeUpdate: () => {
                                    this._markFieldAsCustom(w, resetIcon);
                                },
                                onReloadEditor: () => {
                                    this._handleFieldDependencyChange(f.key, 'change');
                                }
                            });
                            inp = picker.hiddenInput;
                            skipAppendColorPickerInput = true;
                            if (picker && picker.row) this._ensureFieldControl(picker.row);
                            if (f.key && this.fieldRegistry[f.key]) {
                                this.fieldRegistry[f.key].colorPickerSync = picker.sync;
                            }
                        } else {
                            inp = document.createElement('input');
                            inp.type = f.type;

                            if (f.type === 'color') {
                                inp.className = 'control-input p-0 cursor-pointer';
                            } else {
                                inp.className = 'control-input';
                            }

                            if (f.type === 'number') {
                                if (f.min !== undefined) inp.min = f.min;
                                if (f.max !== undefined) inp.max = f.max;
                                if (f.step !== undefined) inp.step = f.step;
                            }

                            if (f.type === 'color') {
                                const displayForPicker = (typeof Dashboard !== 'undefined' && Dashboard.resolveThemeColorValue)
                                    ? Dashboard.resolveThemeColorValue(rawValue)
                                    : rawValue;
                                inp.value = this.ensureHex(displayForPicker);
                                inp.addEventListener('input', (e) => {
                                    saveValue(e.target.value, true);
                                    this._handleFieldDependencyChange(f.key, 'input');
                                    this._markFieldAsCustom(w, resetIcon);
                                });
                            } else {
                                inp.value = (rawValue !== undefined && rawValue !== null) ? rawValue : "";
                            }

                            inp.addEventListener('change', (e) => {
                                let v = e.target.value;
                                if (f.type === 'number') {
                                    v = parseFloat(v);
                                    if (!Number.isFinite(v)) v = 0;
                                    if (f.min !== undefined && v < f.min) { v = f.min; inp.value = v; }
                                    if (f.max !== undefined && v > f.max) { v = f.max; inp.value = v; }
                                }

                                saveValue(v, true);
                                this._handleFieldDependencyChange(f.key, 'change');
                                this._markFieldAsCustom(w, resetIcon);
                            });

                            if (f.imagePicker === true && Editor.isImageGalleryAvailable()) {
                                inp.classList.add('rounded-r-none');
                                const galleryBtn = Editor.createImageGalleryPickerButton(inp);
                                const row = document.createElement('div');
                                row.className = 'flex gap-1';
                                row.appendChild(inp);
                                row.appendChild(galleryBtn);
                                imagePickerMount = row;
                            } else if (f.audioPicker === true && Editor.isAudioGalleryAvailable()) {
                                inp.classList.add('rounded-r-none');
                                const galleryBtn = Editor.createAudioGalleryPickerButton(inp);
                                const row = document.createElement('div');
                                row.className = 'flex gap-1';
                                row.appendChild(inp);
                                row.appendChild(galleryBtn);
                                imagePickerMount = row;
                            }
                        }
                    }
                }

                if (!isBound) {
                    if (this.fieldRegistry && this.fieldRegistry[fKey]) this.fieldRegistry[fKey].inputEl = inp;
                    if (!skipAppendColorPickerInput) {
                        const mountEl = textareaPanelMount || imagePickerMount || inp;
                        if (mountEl) w.appendChild(this._ensureFieldControl(mountEl));
                    }
                    grid.appendChild(w);
                } else {
                    grid.appendChild(w);
                }

                if (isConditionallyDisabled) {
                    w.style.opacity = '0.5';
                    const inputs = w.querySelectorAll('input, select, textarea, button');
                    inputs.forEach(el => el.disabled = true);
                    const resetIcon = w.querySelector('.btn-reset');
                    if (resetIcon) resetIcon.style.pointerEvents = 'none';
                }
            });
            content.appendChild(grid);
            g.appendChild(content);
            this.container.appendChild(g);
            if (stampedGlobalTooltipType) this._tooltipWidgetType = prevTooltipWidgetType;
        });

        Editor.compactSchemaInspectorGrids(this.container);

        if (!isGlobal && values && values.locked === true) {
            const wrappers = this.container.querySelectorAll('[data-field-key]');
            wrappers.forEach(wrap => {
                const key = wrap.dataset.fieldKey;
                if (key && key !== 'locked') {
                    wrap.style.opacity = '0.5';
                    wrap.style.pointerEvents = 'none';
                    wrap.style.userSelect = 'none';
                    const inputs = wrap.querySelectorAll('input, select, textarea, button');
                    inputs.forEach(el => el.disabled = true);
                }
            });
        }

        const dynamicInputs = this.container.querySelectorAll('input, select, textarea');
        dynamicInputs.forEach(function (el) { Utils.applyExtensionIgnoreAttrs(el); });
    },

    /** Split one batch-weblinks line on the first comma only: url, optional title. */
    parseBatchWeblinksLine: function (line) {
        const raw = String(line == null ? '' : line).trim();
        if (!raw) return null;
        const commaIdx = raw.indexOf(',');
        let urlPart = '';
        let titlePart = '';
        if (commaIdx >= 0) {
            urlPart = raw.slice(0, commaIdx).trim();
            titlePart = raw.slice(commaIdx + 1).trim();
        } else {
            urlPart = raw;
        }
        const url = Editor.normalizeBatchWeblinksUrl(urlPart);
        if (!url) return null;
        return { url: url, title: titlePart };
    },

    parseBatchWeblinksText: function (text) {
        const lines = String(text == null ? '' : text).split(/\r?\n/);
        const out = [];
        for (let i = 0; i < lines.length; i++) {
            const row = Editor.parseBatchWeblinksLine(lines[i]);
            if (row) out.push(row);
        }
        return out;
    },

    normalizeBatchWeblinksUrl: function (raw) {
        let s = String(raw == null ? '' : raw).trim();
        if (!s) return '';
        if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) {
            s = 'https://' + s;
        }
        try {
            const u = new URL(s);
            if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
            return u.href;
        } catch (_e) {
            return '';
        }
    },

    fetchBatchWeblinksPageTitle: function (pageUrl) {
        if (typeof UrlPageTitle !== 'undefined' && typeof UrlPageTitle.fetchWebsiteTitle === 'function') {
            return UrlPageTitle.fetchWebsiteTitle(pageUrl);
        }
        return Promise.resolve('');
    },

    /** Refresh menu canvas + inspector list after in-place menuItems label updates (keeps `arr` references stable). */
    refreshBatchWeblinksMenuItemsUi: function (editorSelf, arr, saveValue, renderList, f, options) {
        const opts = options || {};
        saveValue(arr, true);
        renderList();
        const wid = editorSelf.currentId;
        if (wid && typeof Dashboard !== 'undefined' && Dashboard.widgets[wid]) {
            Dashboard.widgets[wid].render();
        }
        if (opts.reloadInspector === true && wid) {
            editorSelf.loadWidget(wid);
        }
        editorSelf._handleFieldDependencyChange(f.key, 'change');
    },

    showBatchWeblinksProgress: function (completed, total, currentUrl) {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) return;
        const card = overlay.querySelector('.ds-loading-card');
        if (!card) return;
        let panel = document.getElementById('batch-weblinks-progress-panel');
        const spinner = card.querySelector('.ds-loading-spinner');
        const defaultText = document.getElementById('loading-overlay-text');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'batch-weblinks-progress-panel';
            panel.className = 'batch-weblinks-progress-panel';
            panel.innerHTML =
                '<div class="batch-weblinks-progress-title">Fetching Page Titles</div>' +
                '<div class="batch-weblinks-progress-bar-track"><div class="batch-weblinks-progress-bar-fill"></div></div>' +
                '<div class="batch-weblinks-progress-percent"></div>' +
                '<div class="batch-weblinks-progress-url"></div>';
            card.appendChild(panel);
        }
        if (spinner) spinner.style.display = 'none';
        if (defaultText) defaultText.style.display = 'none';
        const safeTotal = Math.max(0, Number(total) || 0);
        const safeDone = Math.max(0, Math.min(safeTotal, Number(completed) || 0));
        const pct = safeTotal > 0 ? Math.round((safeDone / safeTotal) * 100) : 0;
        const fill = panel.querySelector('.batch-weblinks-progress-bar-fill');
        const pctEl = panel.querySelector('.batch-weblinks-progress-percent');
        const urlEl = panel.querySelector('.batch-weblinks-progress-url');
        if (fill) fill.style.width = pct + '%';
        if (pctEl) pctEl.textContent = safeDone + ' / ' + safeTotal + ' (' + pct + '%)';
        if (urlEl) {
            const label = String(currentUrl == null ? '' : currentUrl).trim();
            urlEl.textContent = label;
            urlEl.title = label;
        }
        overlay.classList.add('show');
    },

    hideBatchWeblinksProgress: function () {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.remove('show');
        const panel = document.getElementById('batch-weblinks-progress-panel');
        if (panel) panel.remove();
        const card = overlay ? overlay.querySelector('.ds-loading-card') : null;
        if (card) {
            const spinner = card.querySelector('.ds-loading-spinner');
            if (spinner) spinner.style.display = '';
        }
        const defaultText = document.getElementById('loading-overlay-text');
        if (defaultText) defaultText.style.display = '';
    },

    /** Derive a fallback label from a URL's domain, without the TLD (e.g. https://www.facebook.com -> "facebook"). */
    labelFromUrlDomain: function (pageUrl) {
        const raw = String(pageUrl == null ? '' : pageUrl).trim();
        if (!raw) return '';
        let host = '';
        try {
            const u = new URL(raw);
            host = String(u.hostname || '').toLowerCase();
        } catch (_e) {
            const m = raw.match(/^(?:https?:\/\/)?([^\/?#]+)/i);
            host = m ? m[1].toLowerCase() : '';
        }
        if (!host) return '';
        let domain = host;
        const lastDot = domain.lastIndexOf('.');
        if (lastDot > 0) {
            const secondLastDot = domain.lastIndexOf('.', lastDot - 1);
            const tld = domain.slice(lastDot + 1);
            const isCommonTwoPartTld = /^(co|com|org|net|gov|edu|ac|go|or|ne)\.[a-z]{2,3}$/.test(domain.slice(secondLastDot + 1));
            if (isCommonTwoPartTld && secondLastDot > 0) {
                domain = domain.slice(0, secondLastDot);
            } else {
                domain = domain.slice(0, lastDot);
            }
        }
        const parts = domain.split('.');
        let label = parts[parts.length - 1] || domain;
        if (!label) label = domain;
        label = label.replace(/[^a-z0-9_-]/g, '');
        return label;
    },

    runBatchWeblinksTitleFetches: async function (editorSelf, titleFetchQueue, arr, saveValue, renderList, f) {
        const total = titleFetchQueue.length;
        if (!total) return;
        Editor.showBatchWeblinksProgress(0, total, titleFetchQueue[0].url);
        for (let i = 0; i < total; i++) {
            const entry = titleFetchQueue[i];
            Editor.showBatchWeblinksProgress(i, total, entry.url);
            let title = await Editor.fetchBatchWeblinksPageTitle(entry.url);
            if (!title) title = Editor.labelFromUrlDomain(entry.url);
            if (title && entry.arrIndex >= 0 && entry.arrIndex < arr.length && arr[entry.arrIndex]) {
                arr[entry.arrIndex].label = title;
                Editor.refreshBatchWeblinksMenuItemsUi(editorSelf, arr, saveValue, renderList, f, { reloadInspector: false });
            }
            Editor.showBatchWeblinksProgress(i + 1, total, entry.url);
        }
        Editor.hideBatchWeblinksProgress();
        Editor.refreshBatchWeblinksMenuItemsUi(editorSelf, arr, saveValue, renderList, f, { reloadInspector: true });
    },

    openBatchWeblinksDialog: async function (arr, saveValue, renderList, f) {
        if (typeof CustomDialog === 'undefined' || typeof CustomDialog.batchLinks !== 'function') return;
        const self = this;
        const msg = 'Enter one URL per line. Optionally add a comma and a label after the URL.\n\nExample:\nhttps://www.facebook.com, Facebook';
        const result = await CustomDialog.batchLinks(msg, '', 'Batch Add Weblinks', {
            placeholder: 'https://example.com, My Link\nhttps://other.site'
        });
        if (!result || result.action !== 'ok') return;

        const parsed = Editor.parseBatchWeblinksText(result.text);
        if (!parsed.length) {
            if (typeof CustomDialog.alert === 'function') {
                await CustomDialog.alert('No valid URLs found. Enter one URL per line.', 'Batch Add Weblinks');
            }
            return;
        }

        const slot = (typeof MenuWidget !== 'undefined' && MenuWidget.defaultIconSlot)
            ? MenuWidget.defaultIconSlot()
            : { source: 'phosphor', builtin: '', weight: 'fill', customUrl: '', tintImage: false };
        const useFavicon = result.favicon === true;
        const useTitle = result.useTitle === true;
        const newTab = result.newTab === true;
        const iconSource = useFavicon ? 'favicon' : 'phosphor';

        const titleFetchQueue = [];
        for (let i = 0; i < parsed.length; i++) {
            const row = parsed[i];
            const item = {
                label: row.title || '',
                mode: 'push',
                actionType: 'url',
                urlTo: row.url,
                urlNewTab: newTab,
                state: false,
                icons: { on: Object.assign({}, slot, { source: iconSource }), off: {} },
                iconColorOverrides: {
                    on: { enabled: false, color: '#ffffff' },
                    off: { enabled: false, color: '#94a3b8' }
                }
            };
            arr.push(item);
            if (useTitle && !row.title) {
                titleFetchQueue.push({ arrIndex: arr.length - 1, url: row.url });
            }
        }

        saveValue(arr);
        renderList();
        self._handleFieldDependencyChange(f.key, 'change');

        if (!titleFetchQueue.length) return;
        void Editor.runBatchWeblinksTitleFetches(self, titleFetchQueue, arr, saveValue, renderList, f);
    },

    openPresetEditorPopup: function (index, currentArr, anchorBtn, onSaveCallback) {
        const existing = document.getElementById('preset-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'preset-popup';
        popup.className = 'color-correction-popup show';
        popup.style.width = '240px';
        popup.style.zIndex = '5001';

        const newArr = JSON.parse(JSON.stringify(currentArr));
        let curVal = newArr[index];

        if (!curVal) {
            curVal = { state: "ON", brightness: 255, color_mode: "hs", color: { h: 0, s: 100 } };
        }

        let mode = curVal.color_mode || 'hs';
        // Safari 12 does not support optional chaining (`?.`).
        // Keep original truthy/falsy semantics of `x || fallback`.
        let h = (curVal.color && curVal.color.h !== undefined ? curVal.color.h : undefined) || 0;
        let s = (curVal.color && curVal.color.s !== undefined ? curVal.color.s : undefined) || 100;
        let ct = curVal.color_temp || 300;
        let bri = curVal.brightness !== undefined ? curVal.brightness : 255;

        const updateData = () => {
            if (mode === 'hs') {
                newArr[index] = { state: "ON", brightness: bri, color_mode: "hs", color: { h: h, s: s } };
            } else {
                newArr[index] = { state: "ON", brightness: bri, color_mode: "color_temp", color_temp: ct };
            }

            Editor._applySwatchVisual(anchorBtn, newArr[index]);
            onSaveCallback(newArr);
        };

        const header = document.createElement('div');
        header.className = 'cc-header';
        header.innerHTML = `<span>Edit Color</span>`;
        const closeBtn = document.createElement('i');
        closeBtn.className = 'ph-bold ph-x cc-close';
        closeBtn.onclick = () => popup.remove();
        header.appendChild(closeBtn);
        popup.appendChild(header);

        const modeRow = document.createElement('div');
        modeRow.className = 'flex gap-1 mb-3 p-1 editor-surface rounded border editor-hairline';
        const btnColor = document.createElement('button');
        btnColor.className = `flex-1 py-1 text-[10px] font-bold rounded transition-colors ${mode === 'hs' ? 'editor-segment-active text-white shadow-sm' : 'editor-muted-text editor-text-hover'}`;
        btnColor.innerText = "Color";

        const btnWhite = document.createElement('button');
        btnWhite.className = `flex-1 py-1 text-[10px] font-bold rounded transition-colors ${mode === 'color_temp' ? 'editor-segment-active text-white shadow-sm' : 'editor-muted-text editor-text-hover'}`;
        btnWhite.innerText = "White";

        modeRow.appendChild(btnColor);
        modeRow.appendChild(btnWhite);
        popup.appendChild(modeRow);

        const controlsDiv = document.createElement('div');
        popup.appendChild(controlsDiv);

        const createSliderRow = (lbl, min, max, val, onChange, unit) => {
            const wrap = document.createElement('div');
            wrap.className = 'cc-row mb-2';
            wrap.innerHTML = `<span class="text-[10px] uppercase font-bold editor-muted-text mb-1">${lbl}</span>`;

            const bot = document.createElement('div');
            bot.className = 'flex items-center gap-2';

            const sl = document.createElement('input');
            sl.type = 'range'; sl.className = 'flex-1';
            sl.min = min; sl.max = max; sl.value = val;

            const vd = document.createElement('span');
            vd.className = 'cc-val text-[10px] w-8 text-right';
            vd.innerText = val + unit;

            sl.oninput = (e) => {
                const v = parseInt(e.target.value);
                vd.innerText = v + unit;
                onChange(v);
            };

            bot.appendChild(sl); bot.appendChild(vd);
            wrap.appendChild(bot);
            return wrap;
        };

        const renderControls = () => {
            controlsDiv.innerHTML = '';

            if (mode === 'hs') {
                controlsDiv.appendChild(createSliderRow('Color Tone', 0, 360, h, (v) => { h = v; updateData(); }, '°'));
                controlsDiv.appendChild(createSliderRow('Color Intensity', 0, 100, s, (v) => { s = v; updateData(); }, '%'));
            } else {
                controlsDiv.appendChild(createSliderRow('Temp (Cold \u2192 Warm)', 153, 500, ct, (v) => { ct = v; updateData(); }, ''));
            }

            const hr = document.createElement('div');
            hr.className = 'w-full h-px editor-surface-raised my-2';
            controlsDiv.appendChild(hr);

            controlsDiv.appendChild(createSliderRow('Brightness', 0, 255, bri, (v) => { bri = v; updateData(); }, ''));
        };

        btnColor.onclick = () => {
            mode = 'hs';
            btnColor.className = 'flex-1 py-1 text-[10px] font-bold rounded editor-segment-active text-white shadow-sm';
            btnWhite.className = 'flex-1 py-1 text-[10px] font-bold rounded editor-muted-text editor-text-hover';
            renderControls();
            updateData();
        };
        btnWhite.onclick = () => {
            mode = 'color_temp';
            btnWhite.className = 'flex-1 py-1 text-[10px] font-bold rounded editor-segment-active text-white shadow-sm';
            btnColor.className = 'flex-1 py-1 text-[10px] font-bold rounded editor-muted-text editor-text-hover';
            renderControls();
            updateData();
        };

        renderControls();
        document.body.appendChild(popup);

        const rect = anchorBtn.getBoundingClientRect();
        let left = rect.right + 15;
        let top = rect.top - 50;

        if (left + 260 > window.innerWidth) left = rect.left - 260;
        if (top + 220 > window.innerHeight) top = window.innerHeight - 230;

        popup.style.top = top + 'px';
        popup.style.left = left + 'px';

        const closeHandler = (e) => {
            if (!popup.contains(e.target) && e.target !== anchorBtn && !anchorBtn.contains(e.target)) {
                popup.remove();
                document.removeEventListener('mousedown', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler), 100);
    },

    openBindingOptionsPopup: function (f, anchorBtn, isGlobal) {
        const existing = document.getElementById('bind-opts-popup');
        if (existing) {
            if (typeof existing._editorTearDown === 'function') {
                existing._editorTearDown();
            } else {
                existing.remove();
            }
        }

        const self = this;
        const optionValues = isGlobal
            ? MASTER_SETTINGS
            : (function () {
                const w = Dashboard.widgets[self.currentId];
                if (!w) return MASTER_SETTINGS;
                return self._buildMergedStaticValues(w);
            })();

        const syncAnchorMapVisual = function () {
            let ovr = {};
            if (!isGlobal && Dashboard.widgets[self.currentId]) {
                ovr = Dashboard.widgets[self.currentId].overrides || {};
            }
            const mapActive = self.hasBindingMapActiveForField(f, ovr, isGlobal);
            const formulaInvalid = self.hasBindingFormulaInvalidForField(f, ovr, isGlobal);
            Editor.setBindAuxHighlight(anchorBtn, mapActive, formulaInvalid);
        };

        const applyMapPayload = function (trueStr, falseStr) {
            const tTrim = (trueStr && String(trueStr).trim()) ? String(trueStr).trim() : '';
            const fTrim = (falseStr && String(falseStr).trim()) ? String(falseStr).trim() : '';
            if (isGlobal) {
                const pl = {};
                pl[f.key + '_bind_mapTrue'] = tTrim;
                pl[f.key + '_bind_mapFalse'] = fTrim;
                Dashboard.updateGlobal(pl, true);
            } else {
                const w = Dashboard.widgets[self.currentId];
                if (!w) return;
                const next = {};
                let k;
                for (k in w.overrides) {
                    if (Object.prototype.hasOwnProperty.call(w.overrides, k)) {
                        next[k] = w.overrides[k];
                    }
                }
                if (tTrim === '') {
                    delete next[f.key + '_bind_mapTrue'];
                } else {
                    next[f.key + '_bind_mapTrue'] = tTrim;
                }
                if (fTrim === '') {
                    delete next[f.key + '_bind_mapFalse'];
                } else {
                    next[f.key + '_bind_mapFalse'] = fTrim;
                }
                Dashboard.updateWidget(self.currentId, next, true);
            }
            syncAnchorMapVisual();
        };

        const applyFormulaPayload = function (formulaStr) {
            let norm = '';
            if (typeof FormulaEngine !== 'undefined') {
                norm = FormulaEngine.normalize(formulaStr);
                if (typeof FormulaEngine.isDefaultFormula === 'function' && FormulaEngine.isDefaultFormula(norm)) {
                    norm = '';
                }
            } else {
                norm = (formulaStr && String(formulaStr).trim()) ? String(formulaStr).trim() : '';
            }
            if (isGlobal) {
                const pl = {};
                pl[f.key + '_bind_formula'] = norm;
                Dashboard.updateGlobal(pl, true);
            } else {
                const w = Dashboard.widgets[self.currentId];
                if (!w) return;
                const next = {};
                let k;
                for (k in w.overrides) {
                    if (Object.prototype.hasOwnProperty.call(w.overrides, k)) {
                        next[k] = w.overrides[k];
                    }
                }
                if (norm === '') {
                    delete next[f.key + '_bind_formula'];
                } else {
                    next[f.key + '_bind_formula'] = norm;
                }
                Dashboard.updateWidget(self.currentId, next, true);
            }
            syncAnchorMapVisual();
        };

        const applyTransformModePayload = function (mode) {
            const nextMode = (mode === 'numericFormula') ? 'numericFormula' : 'stringMap';
            if (isGlobal) {
                const pl = {};
                pl[f.key + '_bind_transformMode'] = nextMode;
                if (nextMode === 'numericFormula') {
                    pl[f.key + '_bind_mapTrue'] = '';
                    pl[f.key + '_bind_mapFalse'] = '';
                } else {
                    pl[f.key + '_bind_formula'] = '';
                }
                Dashboard.updateGlobal(pl, true);
            } else {
                const w = Dashboard.widgets[self.currentId];
                if (!w) return;
                const next = {};
                let k;
                for (k in w.overrides) {
                    if (Object.prototype.hasOwnProperty.call(w.overrides, k)) {
                        next[k] = w.overrides[k];
                    }
                }
                next[f.key + '_bind_transformMode'] = nextMode;
                if (nextMode === 'numericFormula') {
                    delete next[f.key + '_bind_mapTrue'];
                    delete next[f.key + '_bind_mapFalse'];
                } else {
                    delete next[f.key + '_bind_formula'];
                }
                Dashboard.updateWidget(self.currentId, next, true);
            }
            syncAnchorMapVisual();
        };

        const popup = document.createElement('div');
        popup.id = 'bind-opts-popup';
        popup.className = 'color-correction-popup show';
        popup.style.width = (f.type === 'color' || f.type === 'icon_input') ? '280px' : '260px';

        let mapPairInputs = null;
        let formulaFieldApi = null;
        let checkboxTransformMode = 'stringMap';

        const header = document.createElement('div');
        header.className = 'cc-header';
        header.innerHTML = '<span>Binding Options</span>';
        const closeBtn = document.createElement('i');
        closeBtn.className = 'ph-bold ph-x cc-close';
        header.appendChild(closeBtn);
        popup.appendChild(header);

        const defLabel = document.createElement('div');
        defLabel.className = 'text-[10px] uppercase font-bold editor-muted-text mb-1';
        defLabel.textContent = 'Default Value';
        popup.appendChild(defLabel);

        const defWrap = document.createElement('div');
        defWrap.className = 'mb-3';
        popup.appendChild(defWrap);

        const rawVal = this.getBindingFallbackRaw(f, isGlobal);

        // Merges into widget.overrides. The third param of Dashboard.updateWidget is `replace` (replace all
        // overrides), not "skip editor reload" — that flag exists only on updateGlobal. skipReload in commitDefault applies to updateGlobal only.
        const mergeWidgetOverridePatch = function (patch, colorCommitSource) {
            Dashboard.updateWidget(self.currentId, patch);
            Editor._maybeNotifyInspectorMergedConfigMayHaveChanged(
                self.currentId, patch, false, colorCommitSource
            );
        };

        const commitDefault = function (val, skipReload, colorCommitSource) {
            if (skipReload === undefined || skipReload === null) skipReload = true;
            self._isEditorDrivenUpdate = true;
            try {
                if (isGlobal) {
                    if (f.themeColorToken && typeof MasterLayout !== 'undefined') {
                        const tc = { ...(MASTER_SETTINGS.themeColors || MasterLayout.defaultThemeColors()) };
                        tc[f.themeColorToken] = val;
                        Dashboard.updateGlobal({ themeColors: tc }, skipReload);
                        self._setSnapshotValue(f.key, val);
                        return;
                    }
                    if (f.type === 'color' && f.editThemeLiteralWhenRefMatchesToken && typeof MasterLayout !== 'undefined'
                            && !f.themeColorToken) {
                        const tok = f.editThemeLiteralWhenRefMatchesToken;
                        const expectedRef = '@' + tok;
                        const prev = MASTER_SETTINGS[f.key];
                        if (String(prev).trim() === expectedRef && !MasterLayout.isThemeTokenReference(val)) {
                            const editLinkedTheme = colorCommitSource === 'slider' || colorCommitSource === 'usedSwatch';
                            if (editLinkedTheme) {
                                const tc2 = { ...(MASTER_SETTINGS.themeColors || MasterLayout.defaultThemeColors()) };
                                tc2[tok] = val;
                                Dashboard.updateGlobal({ themeColors: tc2 }, skipReload);
                                self._setSnapshotValue(f.key, expectedRef);
                                const slotKey = 'themeSlot_' + tok;
                                const reg = self.fieldRegistry[slotKey];
                                if (reg && typeof reg.colorPickerSync === 'function') {
                                    reg.colorPickerSync();
                                }
                                return;
                            }
                        }
                    }
                    const currentDriverKey = MASTER_SETTINGS.dataDriver || 'nodered';
                    const DriverClass = DataDriverRegistry.drivers[currentDriverKey];
                    const isDriverSetting = DriverClass && Array.isArray(DriverClass.schema) && DriverClass.schema.some(function (s) { return s.key === f.key; });

                    if (isDriverSetting) {
                        const newDriverSettings = {
                            ...(MASTER_SETTINGS.driverSettings || {}),
                            [f.key]: val
                        };
                        Dashboard.updateGlobal({ driverSettings: newDriverSettings }, skipReload);
                    } else {
                        Dashboard.updateGlobal({ [f.key]: val }, skipReload);
                    }
                } else {
                    const w = Dashboard.widgets[self.currentId];
                    if (!w) return;
                    if (f.key && f.key.indexOf('menuItemBind_') === 0) {
                        const mm = f.key.match(/^menuItemBind_(\d+)_(.+)$/);
                        if (mm) {
                            const idx = parseInt(mm[1], 10);
                            const p = mm[2];
                            let srcItems = Array.isArray(w.overrides.menuItems)
                                ? w.overrides.menuItems
                                : (w.config && Array.isArray(w.config.menuItems) ? w.config.menuItems : []);
                            let menuItems;
                            try {
                                menuItems = JSON.parse(JSON.stringify(srcItems));
                            } catch (e) {
                                menuItems = srcItems.map(function (row) { return { ...row }; });
                            }
                            if (!menuItems[idx]) return;
                            if (p === 'state') {
                                menuItems[idx].state = !!val;
                                mergeWidgetOverridePatch({
                                    menuItems,
                                    [`item_${idx}_state`]: !!val
                                }, colorCommitSource);
                            } else {
                                menuItems[idx][p] = val;
                                mergeWidgetOverridePatch({ menuItems }, colorCommitSource);
                            }
                        }
                    } else if (f.typographyNested) {
                        const tn = f.typographyNested;
                        const widgetPatch = Editor.buildWidgetTypographyNestedPatch(w, tn, val);
                        if (widgetPatch) {
                            mergeWidgetOverridePatch(widgetPatch, colorCommitSource);
                            const ctorW = Object.getPrototypeOf(w).constructor;
                            self._syncFollowerTypographyFromLeaderImmediate(w, tn, ctorW);
                        }
                    } else if (f.iconsNested) {
                        const icn = f.iconsNested;
                        const widgetPatch = Editor.buildWidgetIconsNestedPatch(w, icn, val);
                        if (widgetPatch) {
                            mergeWidgetOverridePatch(widgetPatch, colorCommitSource);
                            const ctorW = Object.getPrototypeOf(w).constructor;
                            self._syncFollowerIconSlotFromLeaderImmediate(w, icn, ctorW);
                        }
                    } else if (f.iconColorOverridesNested) {
                        const io = f.iconColorOverridesNested;
                        const prev = w.overrides.iconColorOverrides || {};
                        const defOn = { enabled: false, color: '#ffffff' };
                        const defOff = { enabled: false, color: '@thumb' };
                        const on = { ...defOn, ...(prev.on && typeof prev.on === 'object' ? prev.on : {}) };
                        const off = { ...defOff, ...(prev.off && typeof prev.off === 'object' ? prev.off : {}) };
                        if (io.slot === 'on') on[io.prop] = val;
                        else off[io.prop] = val;
                        mergeWidgetOverridePatch({ iconColorOverrides: { on, off } }, colorCommitSource);
                    } else if (f.containerNested) {
                        const widgetPatch = Editor.buildWidgetContainerNestedPatch(w, f.containerNested, val);
                        if (widgetPatch) mergeWidgetOverridePatch(widgetPatch, colorCommitSource);
                    } else if (f.objectNested) {
                        const widgetPatch = Editor.buildWidgetObjectNestedPatch(w, f.objectNested, val);
                        if (widgetPatch) {
                            mergeWidgetOverridePatch(widgetPatch, colorCommitSource);
                            self._syncObjectNestedSnapshot(f.objectNested.root, widgetPatch[f.objectNested.root]);
                        }
                    } else {
                        mergeWidgetOverridePatch({ [f.key]: val }, colorCommitSource);
                    }
                }
                self._setSnapshotValue(f.key, val);
            } finally {
                self._isEditorDrivenUpdate = false;
                if (f.type === 'color' && typeof EditorColorPicker !== 'undefined'
                        && typeof EditorColorPicker.refreshUsedCustomSwatches === 'function') {
                    EditorColorPicker.refreshUsedCustomSwatches();
                }
            }
        };

        if (f.type === 'checkbox') {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-2 text-xs editor-muted-text';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = this.ensureBool(rawVal);
            cb.onchange = function (e) {
                commitDefault(e.target.checked, true, null);
            };
            row.appendChild(cb);
            const lb = document.createElement('label');
            lb.textContent = 'When topic has no value, use this state';
            row.appendChild(lb);
            defWrap.appendChild(row);
        } else if (f.type === 'color' && typeof EditorColorPicker !== 'undefined') {
            const colorCard = document.createElement('div');
            colorCard.className = 'w-full';
            defWrap.appendChild(colorCard);
            let bindingFallbackRaw = rawVal;
            let bindOptsColorPicker = null;
            const syncBindingDefaultDisplay = function () {
                bindingFallbackRaw = self.getBindingFallbackRaw(f, isGlobal);
                if (bindOptsColorPicker && typeof bindOptsColorPicker.sync === 'function') {
                    bindOptsColorPicker.sync();
                }
            };
            const getLiveColorRaw = function () {
                return bindingFallbackRaw !== undefined && bindingFallbackRaw !== null ? String(bindingFallbackRaw) : '';
            };
            const allowThemeTokens = !f.themeColorToken && typeof MasterLayout !== 'undefined';
            bindOptsColorPicker = this._attachColorPicker({
                mountCard: colorCard,
                getRaw: getLiveColorRaw,
                skipControllerRegistry: true,
                setValue: function (val, skipReload, commitSource) {
                    commitDefault(val, true, commitSource);
                    syncBindingDefaultDisplay();
                },
                allowThemeTokens: allowThemeTokens,
                onAfterLocalChange: function () {},
                onReloadEditor: function () {}
            });
            if (bindOptsColorPicker) {
                if (!popup._dsColorCtrls) popup._dsColorCtrls = [];
                popup._dsColorCtrls.push(bindOptsColorPicker);
            }
        } else if (f.type === 'select') {
            const resolved = this._resolveFieldOptions(f, optionValues, isGlobal) || [];
            const sel = Editor.createCustomSelect(resolved, rawVal);
            sel.onchange = function (e) {
                commitDefault(e.target.value, true, null);
            };
            defWrap.appendChild(sel);
        } else if (f.type === 'icon_input') {
            const wrap = document.createElement('div');
            wrap.className = 'flex gap-1';
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'control-input rounded-r-none';
            inp.value = (rawVal === undefined || rawVal === null) ? '' : String(rawVal);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-tool w-10 flex-shrink-0 rounded-l-none border-l-0';
            const syncBtnIcon = function () {
                const cls = inp.value || 'ph-star';
                const weightClass = (typeof BaseWidget !== 'undefined' && BaseWidget.phosphorWeightClass)
                    ? BaseWidget.phosphorWeightClass('fill')
                    : 'ph-fill';
                btn.innerHTML = '<i class="' + weightClass + ' ' + cls + ' text-lg"></i>';
            };
            inp.onchange = function (e) {
                commitDefault(e.target.value, true, null);
                syncBtnIcon();
            };
            inp.addEventListener('input', syncBtnIcon);
            btn.onclick = function (e) {
                e.stopPropagation();
                if (typeof Dashboard === 'undefined' || typeof Dashboard.openIconBrowser !== 'function') return;
                Dashboard.openIconBrowser(inp.value || 'ph-star', function (newIcon) {
                    inp.value = newIcon;
                    syncBtnIcon();
                    commitDefault(newIcon, true, null);
                });
            };
            syncBtnIcon();
            wrap.appendChild(inp);
            wrap.appendChild(btn);
            defWrap.appendChild(wrap);
        } else if (f.type === 'color') {
            const inp = document.createElement('input');
            inp.className = 'control-input p-0 cursor-pointer';
            inp.type = 'color';
            const displayForPicker = (typeof Dashboard !== 'undefined' && Dashboard.resolveThemeColorValue)
                ? Dashboard.resolveThemeColorValue(rawVal)
                : rawVal;
            inp.value = this.ensureHex(displayForPicker);
            inp.addEventListener('input', function (e) {
                commitDefault(e.target.value, true, null);
            });
            defWrap.appendChild(inp);
        } else {
            const inp = document.createElement('input');
            inp.className = 'control-input w-full';
            inp.type = (f.type === 'number') ? 'number' : 'text';
            if (f.type === 'number') {
                if (f.min !== undefined) inp.min = f.min;
                if (f.max !== undefined) inp.max = f.max;
                if (f.step !== undefined) inp.step = f.step;
            }
            inp.value = (rawVal === undefined || rawVal === null) ? '' : rawVal;
            inp.onchange = function (e) {
                let v = e.target.value;
                if (f.type === 'number') {
                    v = parseFloat(v);
                    if (isNaN(v)) v = 0;
                }
                commitDefault(v, true, null);
            };
            defWrap.appendChild(inp);
        }

        if (f.type === 'text' || f.type === 'textarea' || f.type === 'icon_input') {
            const getFormulaText = function () {
                let fm;
                if (isGlobal) {
                    fm = MASTER_SETTINGS[f.key + '_bind_formula'];
                } else {
                    const w = Dashboard.widgets[self.currentId];
                    const o = w ? (w.overrides || {}) : {};
                    fm = o[f.key + '_bind_formula'];
                }
                return (fm === undefined || fm === null) ? '' : String(fm);
            };
            const isIconName = f.type === 'icon_input';
            let textPresets = [];
            if (typeof FormulaEngine !== 'undefined') {
                if (isIconName) {
                    textPresets = FormulaEngine.ICON_PRESETS || FormulaEngine.TEXT_PRESETS || [];
                } else {
                    textPresets = FormulaEngine.TEXT_PRESETS || [];
                }
            }
            formulaFieldApi = self.appendBindingFormulaSection(popup, {
                sectionTitle: 'Payload Formula',
                getFormula: getFormulaText,
                applyFormulaPayload: applyFormulaPayload,
                presets: textPresets,
                showInsertIcon: isIconName,
                hintText: isIconName
                    ? 'Incoming payload is Value. Return a Phosphor icon class as a quoted string, e.g. if(value >= 50, "ph-thermometer-hot", "ph-thermometer-cold"). Compare strings with == and != (case-insensitive). contains(value, "ON") matches that exact case. containsanycase(value, "ON") ignores case. Insert Icon adds a quoted class at the cursor. Insert Topic adds {{topic}} references.'
                    : 'Incoming payload is Value. Return text with quoted strings, e.g. if(value >= 50, "yes", "no"). Compare strings with == and != (case-insensitive). contains(value, "ON") matches that exact case. containsanycase(value, "ON") ignores case. Insert Topic adds {{topic}} references.'
            });
        }

        if (f.type === 'color') {
            const getFormulaColor = function () {
                let fm;
                if (isGlobal) {
                    fm = MASTER_SETTINGS[f.key + '_bind_formula'];
                } else {
                    const w = Dashboard.widgets[self.currentId];
                    const o = w ? (w.overrides || {}) : {};
                    fm = o[f.key + '_bind_formula'];
                }
                return (fm === undefined || fm === null) ? '' : String(fm);
            };
            const colorPresets = (typeof FormulaEngine !== 'undefined' && FormulaEngine.COLOR_PRESETS)
                ? FormulaEngine.COLOR_PRESETS
                : [];
            formulaFieldApi = self.appendBindingFormulaSection(popup, {
                sectionTitle: 'Payload Formula',
                getFormula: getFormulaColor,
                applyFormulaPayload: applyFormulaPayload,
                presets: colorPresets,
                showInsertColor: true,
                hintText: 'Return a color with hex literals (#121345) or @theme tokens (@warning), e.g. if(value >= 50, @warning, @danger). Use Insert Color to add #hex or @tokens at the cursor. The formula runs first, then Color Adjustments apply below. Use == and != for color/token equality. contains(value, "ON") matches that exact case. containsanycase(value, "ON") ignores case.'
            });
            self.appendColorCorrectionSection(popup, {
                propKey: f.key,
                isGlobal: isGlobal,
                sectionTitle: 'Color Adjustments',
                onAfterUpdate: syncAnchorMapVisual
            });
        }

        if (f.type === 'checkbox') {
            let popupOvr = {};
            if (!isGlobal && Dashboard.widgets[self.currentId]) {
                popupOvr = Dashboard.widgets[self.currentId].overrides || {};
            }
            checkboxTransformMode = self.getBindingTransformMode(f, popupOvr, isGlobal);

            const modeTitle = document.createElement('div');
            modeTitle.className = 'text-[10px] uppercase font-bold editor-muted-text mb-1 mt-2';
            modeTitle.textContent = 'Transform Mode';
            popup.appendChild(modeTitle);

            const modeWrap = document.createElement('div');
            modeWrap.className = 'mb-2 ds-transform-mode-select';
            const modeSelect = Editor.createCustomSelect([
                { value: 'stringMap', text: 'Boolean Payload Mapping' },
                { value: 'numericFormula', text: 'Numeric Payload Formula' }
            ], checkboxTransformMode);
            modeSelect.onchange = function (e) {
                checkboxTransformMode = e.target.value;
                applyTransformModePayload(checkboxTransformMode);
                if (checkboxTransformMode === 'numericFormula') {
                    inT.value = '';
                    inF.value = '';
                } else if (formulaFieldApi && typeof formulaFieldApi.setValue === 'function') {
                    formulaFieldApi.setValue('');
                }
                syncTransformPanels();
            };
            modeWrap.appendChild(modeSelect);
            popup.appendChild(modeWrap);

            const mapPanel = document.createElement('div');
            mapPanel.className = 'ds-bind-map-panel';
            popup.appendChild(mapPanel);

            const getMapPair = function () {
                let mt;
                let mf;
                if (isGlobal) {
                    mt = MASTER_SETTINGS[f.key + '_bind_mapTrue'];
                    mf = MASTER_SETTINGS[f.key + '_bind_mapFalse'];
                } else {
                    const w = Dashboard.widgets[self.currentId];
                    const o = w ? (w.overrides || {}) : {};
                    mt = o[f.key + '_bind_mapTrue'];
                    mf = o[f.key + '_bind_mapFalse'];
                }
                return {
                    t: (mt === undefined || mt === null) ? '' : String(mt),
                    f: (mf === undefined || mf === null) ? '' : String(mf)
                };
            };
            const pair0 = getMapPair();

            const rowT = document.createElement('div');
            rowT.className = 'mb-2';
            const lt = document.createElement('label');
            lt.className = 'block text-[10px] editor-muted-text mb-0.5';
            lt.textContent = 'Custom True Value';
            const inT = document.createElement('input');
            inT.type = 'text';
            inT.className = 'control-input w-full text-xs';
            inT.value = pair0.t;
            inT.placeholder = 'e.g. Washing';
            rowT.appendChild(lt);
            rowT.appendChild(inT);
            mapPanel.appendChild(rowT);

            const rowF = document.createElement('div');
            rowF.className = 'mb-2';
            const lf = document.createElement('label');
            lf.className = 'block text-[10px] editor-muted-text mb-0.5';
            lf.textContent = 'Custom False Value';
            const inF = document.createElement('input');
            inF.type = 'text';
            inF.className = 'control-input w-full text-xs';
            inF.value = pair0.f;
            inF.placeholder = 'e.g. Drying';
            rowF.appendChild(lf);
            rowF.appendChild(inF);
            mapPanel.appendChild(rowF);

            mapPairInputs = { inT, inF };

            const invertRow = document.createElement('button');
            invertRow.type = 'button';
            invertRow.className = 'flex items-center gap-1.5 text-xs editor-muted-text editor-text-hover mb-2 px-0 py-1 bg-transparent border-0 cursor-pointer w-full text-left';
            invertRow.title = 'Invert values';
            invertRow.innerHTML = '<i class="ph-bold ph-selection-inverse text-xs flex-shrink-0"></i><span>Invert values</span>';
            invertRow.onclick = function (e) {
                e.stopPropagation();
                const curT = inT.value;
                const curF = inF.value;
                const tTrim = String(curT).trim();
                const fTrim = String(curF).trim();
                const bothEmpty = tTrim === '' && fTrim === '';
                const isPresetInvert = tTrim.toLowerCase() === 'false' && fTrim.toLowerCase() === 'true';
                if (bothEmpty) {
                    inT.value = 'False';
                    inF.value = 'True';
                    applyMapPayload('False', 'True');
                } else if (isPresetInvert) {
                    inT.value = '';
                    inF.value = '';
                    applyMapPayload('', '');
                } else {
                    inT.value = fTrim;
                    inF.value = tTrim;
                    applyMapPayload(fTrim, tTrim);
                }
            };
            mapPanel.appendChild(invertRow);

            const syncMaps = function () {
                applyMapPayload(inT.value, inF.value);
            };
            inT.onchange = syncMaps;
            inF.onchange = syncMaps;

            const mapHint = document.createElement('div');
            mapHint.className = 'text-[9px] editor-muted-text italic';
            mapHint.textContent = 'Case-insensitive match: a set value maps to that state. A blank field is a wildcard — any other payload maps to the opposite state. If both values are set and the payload matches neither, normal binding rules apply.';
            mapPanel.appendChild(mapHint);

            const formulaPanel = document.createElement('div');
            formulaPanel.className = 'ds-bind-formula-panel';
            popup.appendChild(formulaPanel);

            const getFormula = function () {
                let fm;
                if (isGlobal) {
                    fm = MASTER_SETTINGS[f.key + '_bind_formula'];
                } else {
                    const w = Dashboard.widgets[self.currentId];
                    const o = w ? (w.overrides || {}) : {};
                    fm = o[f.key + '_bind_formula'];
                }
                return (fm === undefined || fm === null) ? '' : String(fm);
            };

            const boolPresets = (typeof FormulaEngine !== 'undefined' && FormulaEngine.BOOLEAN_PRESETS)
                ? FormulaEngine.BOOLEAN_PRESETS
                : [];
            formulaFieldApi = self.appendBindingFormulaSection(formulaPanel, {
                sectionTitle: 'Payload Formula',
                getFormula: getFormula,
                applyFormulaPayload: applyFormulaPayload,
                presets: boolPresets,
                hintText: 'Numeric payload is Value. Referenced topics use Insert Topic. Boolean true/false (case-insensitive) coerce to 1/0. Result is coerced to 0 or 1 for this boolean field. contains(value, "ON") and containsanycase(value, "ON") also run on a sentence and return 1 or 0. Other non-numeric payloads are left unchanged.'
            });

            const syncTransformPanels = function () {
                const isFormula = checkboxTransformMode === 'numericFormula';
                mapPanel.style.display = isFormula ? 'none' : '';
                formulaPanel.style.display = isFormula ? '' : 'none';
            };
            syncTransformPanels();
        }

        if (f.type === 'number') {
            const getFormulaNum = function () {
                let fm;
                if (isGlobal) {
                    fm = MASTER_SETTINGS[f.key + '_bind_formula'];
                } else {
                    const w = Dashboard.widgets[self.currentId];
                    const o = w ? (w.overrides || {}) : {};
                    fm = o[f.key + '_bind_formula'];
                }
                return (fm === undefined || fm === null) ? '' : String(fm);
            };

            const numPresets = (typeof FormulaEngine !== 'undefined' && FormulaEngine.PRESETS)
                ? FormulaEngine.PRESETS
                : [];
            formulaFieldApi = self.appendBindingFormulaSection(popup, {
                sectionTitle: 'Payload Formula',
                getFormula: getFormulaNum,
                applyFormulaPayload: applyFormulaPayload,
                presets: numPresets,
                hintText: 'Incoming payload is Value. Use Insert Topic for {{topic}} references. Boolean true/false coerce to 1/0. Uses + - * /, round, min, max, abs, if(), and/or/not/xor/nor, contains(), and containsanycase().'
            });
        }

        document.body.appendChild(popup);

        this.positionEditorPopupNearAnchor(popup, anchorBtn, { fallbackWidth: (f.type === 'color') ? 280 : 260 });

        let resizeObserver = null;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(function () {
                if (popup && popup.isConnected) {
                    self.positionEditorPopupNearAnchor(popup, anchorBtn, { fallbackWidth: (f.type === 'color') ? 280 : 260 });
                }
            });
            resizeObserver.observe(popup);
        }

        const closeHandler = function (e) {
            if (!self.isClickInsidePopupWithPortaledDropdowns(e.target, popup, anchorBtn)) {
                tearDown();
            }
        };
        const keyHandler = function (e) {
            if (e.key === 'Escape') {
                const iconModal = document.getElementById('icon-modal');
                if (iconModal && iconModal.classList.contains('open')) {
                    iconModal.classList.remove('open');
                    e.stopPropagation();
                    return;
                }
                tearDown();
            }
        };

        const tearDown = function () {
            if (resizeObserver) {
                resizeObserver.disconnect();
                resizeObserver = null;
            }
            Editor._cleanupSubtreeDropdowns(popup);
            const destroyHostColorCtrls = function (el) {
                if (!el || !el._dsColorCtrls || !el._dsColorCtrls.length) return;
                el._dsColorCtrls.forEach(function (ctrl) {
                    if (ctrl && typeof ctrl.destroy === 'function') {
                        try { ctrl.destroy(); } catch (eCtrl) {}
                    }
                });
                el._dsColorCtrls = [];
            };
            destroyHostColorCtrls(popup);
            if (popup.querySelectorAll) {
                popup.querySelectorAll('*').forEach(destroyHostColorCtrls);
            }
            let warnDuplicate = false;
            let warnInvalidFormula = false;
            let invalidFormulaText = '';
            let invalidFormulaError = '';
            if (f.type === 'checkbox' && checkboxTransformMode === 'stringMap' && mapPairInputs) {
                applyMapPayload(mapPairInputs.inT.value, mapPairInputs.inF.value);
                const t = String(mapPairInputs.inT.value || '').trim();
                const ff = String(mapPairInputs.inF.value || '').trim();
                warnDuplicate = t !== '' && ff !== '' && t.toLowerCase() === ff.toLowerCase();
            }
            if (formulaFieldApi && (f.type === 'number'
                    || f.type === 'text' || f.type === 'textarea' || f.type === 'color'
                    || f.type === 'icon_input'
                    || (f.type === 'checkbox' && checkboxTransformMode === 'numericFormula'))) {
                const fVal = formulaFieldApi.getValue();
                if (typeof FormulaEngine !== 'undefined') {
                    const v = FormulaEngine.validate(fVal);
                    if (fVal.trim() !== '' && !v.ok) {
                        warnInvalidFormula = true;
                        invalidFormulaText = fVal;
                        invalidFormulaError = (v && v.error) ? v.error : '';
                    } else {
                        applyFormulaPayload(fVal);
                    }
                } else {
                    applyFormulaPayload(fVal);
                }
            }
            document.removeEventListener('mousedown', closeHandler, true);
            document.removeEventListener('keydown', keyHandler);
            popup._editorTearDown = null;
            popup.remove();
            if (typeof Editor.flushDeferredInspectorReload === 'function') {
                Editor.flushDeferredInspectorReload();
            }
            if (warnDuplicate && typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                void CustomDialog.alert(
                    'Custom True and Custom False are identical; boolean mapping may not work as expected.',
                    'Boolean Payload Mapping'
                );
            }
            if (warnInvalidFormula && typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                const esc = function (s) {
                    return String(s == null ? '' : s)
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                };
                const widgetDisplayName = isGlobal
                    ? 'Master Settings'
                    : (Dashboard.widgets[self.currentId] && Dashboard.widgets[self.currentId].name) || (self.currentId || 'widget');
                const settingLabel = f.label || f.key || 'setting';
                let msg = 'The Payload Formula for "' + esc(settingLabel) + '" on "' + esc(widgetDisplayName)
                    + '" is invalid and will not be applied.';
                if (invalidFormulaText) msg += '\nFormula: ' + esc(invalidFormulaText);
                if (invalidFormulaError) msg += '\nError: ' + esc(invalidFormulaError);
                void CustomDialog.alert(msg, 'Payload Formula');
            }
        };

        popup._editorTearDown = tearDown;
        closeBtn.onclick = function () { tearDown(); };

        setTimeout(function () {
            document.addEventListener('mousedown', closeHandler, true);
            document.addEventListener('keydown', keyHandler);
        }, 100);
    }
};

if (typeof window !== 'undefined') {
    window.Editor = Editor;
}