// Inject styles for help components dynamically
if (!document.querySelector('link[href*="help.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    // Use relative path logic. Assuming help-content.js is inside assets/help/
    const isStandalone = window.location.pathname.endsWith('help-edit.html');
    link.href = isStandalone ? 'help.css' : 'help/help.css';
    document.head.appendChild(link);
}

const HelpSystem = {
    container: null,
    isOpen: false,
    savedWidth: 900,
    activeHelpPageIndex: -1,
    activeWidgetSubSlug: null,
    helpTopics: null,
    markdownSettings: null,
    _clickInterceptorRegistered: false,
    _appHelpUrlClicksBound: false,
    _purifyHelpUriHookInstalled: false,
    _navStack: [],
    _navCursor: -1,
    _navSilent: false,
    _navKeyBound: false,
    _NAV_STACK_MAX: 40,
    _searchIndex: null,
    _searchQuery: '',
    _searchViewOpen: false,
    _searchDebounceTimer: null,
    _searchActiveRow: 0,
    _searchUiBound: false,
    _searchKeysBound: false,
    _SEARCH_DEBOUNCE_MS: 80,

    _camelToKebab: function (key) {
        return String(key).replace(/[A-Z]/g, function (ch) { return '-' + ch.toLowerCase(); });
    },

    _getDefaultMarkdownSettings: function () {
        const defs = typeof window !== 'undefined' ? window.HELP_MARKDOWN_SETTINGS_DEFAULTS : null;
        return defs ? JSON.parse(JSON.stringify(defs)) : {};
    },

    _mergeMarkdownSettings: function (userSettings) {
        const defaults = this._getDefaultMarkdownSettings();
        const merged = JSON.parse(JSON.stringify(defaults));
        if (!userSettings || typeof userSettings !== 'object') return merged;
        Object.keys(userSettings).forEach(function (feature) {
            const userFeat = userSettings[feature];
            if (!userFeat || typeof userFeat !== 'object' || Array.isArray(userFeat)) return;
            merged[feature] = Object.assign({}, merged[feature] || {}, userFeat);
        });
        return merged;
    },

    _applyMarkdownSettings: function () {
        const root = document.getElementById('help-content-body');
        if (!root) return;
        const settings = this.markdownSettings || this._getDefaultMarkdownSettings();
        Object.keys(settings).forEach(function (feature) {
            const feat = settings[feature];
            if (!feat || typeof feat !== 'object' || Array.isArray(feat)) return;
            Object.keys(feat).forEach(function (prop) {
                const value = feat[prop];
                if (value === undefined || value === null || value === '') return;
                root.style.setProperty(
                    '--help-md-' + feature + '-' + HelpSystem._camelToKebab(prop),
                    String(value)
                );
            });
        });
    },

    _ensurePurifyHelpUriHook: function () {
        if (this._purifyHelpUriHookInstalled) return;
        const P = typeof window !== 'undefined' ? window.DOMPurify : null;
        if (!P || typeof P.addHook !== 'function') return;
        this._purifyHelpUriHookInstalled = true;
        P.addHook('uponSanitizeAttribute', function (node, data) {
            if (!data || !data.attrName) return;
            if (data.attrName === 'class') {
                data.forceKeepAttr = true;
                return;
            }
            if (data.attrName !== 'href' || data.attrValue == null) return;
            const href = String(data.attrValue);
            if (href.startsWith('help://') || href.startsWith('?') || href.startsWith('#')) {
                data.forceKeepAttr = true;
            }
        });
    },

    init: function () {
        this.container = document.getElementById('help-panel');
        if (!this.container) return Promise.resolve();

        this.initResize();
        this._bindHelpNavKeys();
        this._bindHelpSearchUi();

        const contentEl = document.getElementById('help-content-body');
        if (contentEl && !this._clickInterceptorRegistered) {
            this._clickInterceptorRegistered = true;
            contentEl.addEventListener('click', (e) => {
                const a = e.target.closest('a');
                if (a) {
                    const href = a.getAttribute('href');
                    if (href) {
                        if (/^help:\/\//i.test(href)) {
                            e.preventDefault();
                            this.openHelpUrl(href);
                        } else if (href.startsWith('#')) {
                            e.preventDefault();
                            this.scrollTo(href.slice(1));
                        } else if (href.startsWith('?')) {
                            e.preventDefault();
                            if (typeof Dashboard !== 'undefined' && typeof Dashboard.mergeLocationQuery === 'function') {
                                window.history.pushState(null, '', Dashboard.mergeLocationQuery(href));
                                Dashboard.loadStartupConfig();
                            } else {
                                const base = window.location.pathname || '/';
                                window.open(base + href, '_blank');
                            }
                        }
                    }
                }
            });
        }

        this._ensurePurifyHelpUriHook();
        this._bindAppHelpUrlClicks();

        return this.loadHelpData().then(() => {
            this.renderTOC();
            this.showPage(0);
        });
    },

    loadHelpData: function () {
        if (this.helpTopics) {
            return Promise.resolve(this.helpTopics);
        }
        return fetch('help/help-content.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to load help/help-content.json");
                }
                return response.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    this.helpTopics = this._normalizeHelpTopics(data);
                    this.markdownSettings = this._mergeMarkdownSettings(null);
                } else {
                    this.helpTopics = this._normalizeHelpTopics(Array.isArray(data.topics) ? data.topics : []);
                    this.markdownSettings = this._mergeMarkdownSettings(data.markdownSettings);
                }
                window.HELP_TOPICS = this.helpTopics;
                this._buildSearchIndex();
                this._applyMarkdownSettings();
                return this.helpTopics;
            })
            .catch(err => {
                console.error("Error loading help content:", err);
                this.helpTopics = [];
                this.markdownSettings = this._getDefaultMarkdownSettings();
                window.HELP_TOPICS = [];
                this._buildSearchIndex();
                return [];
            });
    },

    getMaxHelpPanelWidth: function () {
        const editor = document.getElementById('editor-panel');
        const editorW = (editor && window.innerWidth > 1200) ? Math.round(editor.getBoundingClientRect().width) : 0;
        const gutter = (typeof Dashboard !== 'undefined' && typeof Dashboard._readEditorGutterPx === 'function')
            ? Dashboard._readEditorGutterPx()
            : 16;
        const raw = window.innerWidth - editorW - gutter * 4;
        return Math.max(350, raw);
    },

    clampHelpPanelWidthToViewport: function () {
        if (!this.container || !this.isOpen || window.innerWidth <= 768) return;
        const maxW = this.getMaxHelpPanelWidth();
        const current = parseInt(this.container.style.width, 10);
        if (!Number.isFinite(current) || current <= maxW) return;
        this.container.style.width = `${maxW}px`;
        this.savedWidth = maxW;
        this._syncHelpLaneToDocument();
    },

    /**
     * Drive dashboard stage padding from the help panel: body.help-open and
     * --help-panel-active-width (panel width only; gutters are added in CSS).
     * Below 1200px help is a slide-over overlay, so the canvas is not inset.
     */
    _syncHelpLaneToDocument: function () {
        const open = !!(this.isOpen && this.container);
        const overlay = window.innerWidth <= 1200;
        const body = document.body;
        body.classList.toggle('help-open', open && !overlay);
        body.classList.toggle('help-panel-resizing', !!(open && this.container && this.container.classList.contains('resizing')));

        let widthPx = 0;
        if (open && !overlay) {
            const inline = parseInt(this.container.style.width, 10);
            if (Number.isFinite(inline) && inline > 0) {
                widthPx = inline;
            } else {
                widthPx = Math.round(this.container.getBoundingClientRect().width) || 0;
            }
        }
        document.documentElement.style.setProperty('--help-panel-active-width', widthPx + 'px');

        const btn = document.getElementById('btn-help');
        if (btn) {
            btn.setAttribute('aria-pressed', this.isOpen ? 'true' : 'false');
            btn.classList.toggle('is-active', !!this.isOpen);
        }

        if (typeof Dashboard !== 'undefined' && typeof Dashboard._syncEditModeDashboardLane === 'function') {
            Dashboard._syncEditModeDashboardLane();
        }
    },

    _normalizeHelpTopics: function (topics) {
        if (!Array.isArray(topics)) return topics;
        topics.forEach(function (topic) {
            if (!topic || typeof topic !== 'object') return;
            if (topic.helpSubpages && topic.helpSubpages.length && (!topic.widgetSubpages || !topic.widgetSubpages.length)) {
                topic.widgetSubpages = topic.helpSubpages;
            }
            delete topic.helpSubpages;
        });
        return topics;
    },

    _topicSubpages: function (topic) {
        if (!topic || typeof topic !== 'object') return [];
        const list = topic.widgetSubpages;
        return Array.isArray(list) ? list : [];
    },

    _overviewNavTitle: function (topic) {
        const title = topic && topic.overviewTitle;
        return (typeof title === 'string' && title.trim()) ? title.trim() : 'Overview';
    },

    toggle: function () {
        if (!this.container) {
            this.init().then(() => {
                this._performToggle();
            });
        } else {
            this.loadHelpData().then(() => {
                this._performToggle();
            });
        }
    },

    _performToggle: function () {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this._bindHelpSearchUi();
            this.container.classList.add('open');
            if (window.innerWidth > 768) {
                const maxW = this.getMaxHelpPanelWidth();
                const defaultW = window.innerWidth <= 1200 ? Math.min(600, maxW) : 900;
                const targetW = this.savedWidth || defaultW;
                const w = Math.max(350, Math.min(targetW, maxW));
                this.container.style.width = `${w}px`;
                this.savedWidth = w;
            } else {
                this.container.style.width = '';
            }
        } else {
            this.container.classList.remove('open');
            this.container.style.width = '';
        }
        this._syncHelpLaneToDocument();
    },

    scrollTo: function (id) {
        const el = this._findHelpAnchorElement(id) || document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    /** Panel width slide uses 0.3s in editor.css; wait slightly longer as fallback. */
    _HELP_PANEL_OPEN_MS: 320,

    /** Opens the help panel when closed; resolves after the slide-in transition settles. */
    _ensurePanelOpen: function () {
        const self = this;
        return new Promise(function (resolve) {
            const container = self.container;
            if (!container) {
                resolve();
                return;
            }
            if (self.isOpen) {
                requestAnimationFrame(function () {
                    requestAnimationFrame(resolve);
                });
                return;
            }
            self._performToggle();
            let settled = false;
            const finish = function () {
                if (settled) return;
                settled = true;
                container.removeEventListener('transitionend', onTransitionEnd);
                resolve();
            };
            const onTransitionEnd = function (e) {
                if (e.target !== container) return;
                if (e.propertyName === 'width' || e.propertyName === 'transform') {
                    finish();
                }
            };
            container.addEventListener('transitionend', onTransitionEnd);
            window.setTimeout(finish, self._HELP_PANEL_OPEN_MS);
        });
    },

    _scrollToAnchorAfterRender: function (anchorId) {
        if (!anchorId) return;
        const self = this;
        const attempt = function (triesLeft) {
            requestAnimationFrame(function () {
                const el = self._findHelpAnchorElement(anchorId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    return;
                }
                if (triesLeft > 0) attempt(triesLeft - 1);
            });
        };
        attempt(8);
    },

    initResize: function () {
        const handle = document.getElementById('help-resize-handle');
        if (!handle) return;

        handle.style.touchAction = 'none';
        const self = this;
        let isTouchDragging = false;

        const getClientX = function (e) {
            if (e.touches && e.touches.length > 0) return e.touches[0].clientX;
            if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
            return e.clientX;
        };

        const startResize = function (clientX) {
            self.container.classList.add('resizing');
            self._syncHelpLaneToDocument();
            return {
                startX: clientX,
                startWidth: parseInt(document.defaultView.getComputedStyle(self.container).width, 10)
            };
        };

        const moveResize = function (clientX, ctx) {
            if (!ctx) return;
            const maxW = self.getMaxHelpPanelWidth();
            const newWidth = ctx.startWidth + (ctx.startX - clientX);
            const clamped = Math.max(350, Math.min(maxW, newWidth));
            self.container.style.width = `${clamped}px`;
            self.savedWidth = clamped;
            self._syncHelpLaneToDocument();
        };

        const endResize = function () {
            self.container.classList.remove('resizing');
            self._syncHelpLaneToDocument();
        };

        if (typeof PointerDrag !== 'undefined') {
            PointerDrag.bind(handle, {
                raf: true,
                shouldStart: function () {
                    if (isTouchDragging) return false;
                    return window.innerWidth > 768;
                },
                onDown: function (e) {
                    return startResize(getClientX(e));
                },
                onMove: function (e, ctx) {
                    moveResize(getClientX(e), ctx);
                },
                onUp: function () {
                    endResize();
                }
            });
        }

        let activeTouchCtx = null;
        let touchRafId = null;
        let pendingTouchClientX = null;

        const flushTouchMove = function () {
            touchRafId = null;
            if (activeTouchCtx && pendingTouchClientX != null) {
                moveResize(pendingTouchClientX, activeTouchCtx);
            }
        };

        const onTouchMove = function (ev) {
            if (!activeTouchCtx || !ev.touches || ev.touches.length === 0) return;
            ev.preventDefault();
            pendingTouchClientX = ev.touches[0].clientX;
            if (touchRafId == null) {
                touchRafId = requestAnimationFrame(flushTouchMove);
            }
        };

        const onTouchEnd = function () {
            if (touchRafId != null) {
                cancelAnimationFrame(touchRafId);
                touchRafId = null;
            }
            if (activeTouchCtx && pendingTouchClientX != null) {
                moveResize(pendingTouchClientX, activeTouchCtx);
            }
            activeTouchCtx = null;
            pendingTouchClientX = null;
            isTouchDragging = false;
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchEnd);
            endResize();
        };

        handle.addEventListener('touchstart', function (e) {
            if (window.innerWidth <= 768) return;
            if (!e.touches || e.touches.length !== 1) return;
            e.preventDefault();
            e.stopPropagation();
            isTouchDragging = true;
            activeTouchCtx = startResize(e.touches[0].clientX);
            window.addEventListener('touchmove', onTouchMove, { passive: false });
            window.addEventListener('touchend', onTouchEnd);
            window.addEventListener('touchcancel', onTouchEnd);
        }, { passive: false });

        if (!this._helpViewportResizeBound) {
            this._helpViewportResizeBound = true;
            window.addEventListener('resize', function () {
                self.clampHelpPanelWidthToViewport();
                self._syncHelpLaneToDocument();
            });
        }
    },

    _syncTocWidgetDrawers: function (activeIndex) {
        const self = this;
        document.querySelectorAll('.help-toc-entry').forEach(function (entry, idx) {
            const drawer = entry.querySelector('.help-toc-widget-drawer');
            if (!drawer) return;
            if (idx === activeIndex) drawer.classList.add('open');
            else drawer.classList.remove('open');
            drawer.querySelectorAll('.help-toc-widget-subitem').forEach(function (sub) {
                const raw = sub.getAttribute('data-widget-slug') || '';
                const isOverview = raw === '';
                const on = isOverview ? !self.activeWidgetSubSlug : self.activeWidgetSubSlug === raw;
                sub.classList.toggle('active', on && idx === activeIndex);
            });
        });
    },

    _getTopicMarkdown: function (topic, widgetSubSlug) {
        if (!topic || typeof topic !== 'object') return '';
        const subpages = this._topicSubpages(topic);
        let mdSrc = typeof topic.content === 'string' ? topic.content : '';
        if (subpages.length && widgetSubSlug) {
            const sp = subpages.find(function (s) { return s.slug === widgetSubSlug; });
            if (sp && typeof sp.content === 'string') mdSrc = sp.content;
        }
        return mdSrc;
    },

    _getBodyHtmlForTopic: function (topic) {
        return this.renderMarkdown(this._getTopicMarkdown(topic, this.activeWidgetSubSlug));
    },

    _escapeHelpText: function (value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    _navLocation: function (index, slug, anchor) {
        return {
            type: 'topic',
            index: index,
            slug: slug || null,
            anchor: anchor || null
        };
    },

    _navSearchLocation: function (query, scrollTop) {
        return {
            type: 'search',
            index: this.activeHelpPageIndex,
            slug: this.activeWidgetSubSlug || null,
            anchor: null,
            query: query || '',
            scrollTop: typeof scrollTop === 'number' ? scrollTop : 0
        };
    },

    _navEquals: function (a, b) {
        if (!a || !b) return false;
        const aSearch = a.type === 'search';
        const bSearch = b.type === 'search';
        if (aSearch || bSearch) {
            return aSearch && bSearch && String(a.query || '') === String(b.query || '');
        }
        return a.index === b.index
            && (a.slug || null) === (b.slug || null)
            && (a.anchor || null) === (b.anchor || null);
    },

    _navEntryLabel: function (entry) {
        if (!entry) return 'Help';
        if (entry.type === 'search') {
            const q = String(entry.query || '').trim();
            return q ? ('Search: ' + q) : 'Search results';
        }
        if (!this.helpTopics) return 'Help';
        const topic = this.helpTopics[entry.index];
        if (!topic) return 'Help';
        if (entry.slug) {
            const subpages = this._topicSubpages(topic);
            const sp = subpages.find(function (s) { return s.slug === entry.slug; });
            if (sp && sp.title) return sp.title;
        }
        return topic.title || 'Help';
    },

    _recordHelpHistory: function (entry, options) {
        options = options || {};
        if (options.skipHistory || this._navSilent) {
            if (this._navCursor < 0 && entry) {
                this._navStack = [entry];
                this._navCursor = 0;
            }
            this._syncNavChrome();
            return;
        }
        const current = this._navStack[this._navCursor];
        if (this._navEquals(current, entry)) {
            this._syncNavChrome();
            return;
        }
        if (this._navCursor < 0) {
            this._navStack = [entry];
            this._navCursor = 0;
        } else {
            this._navStack = this._navStack.slice(0, this._navCursor + 1);
            this._navStack.push(entry);
            if (this._navStack.length > this._NAV_STACK_MAX) this._navStack.shift();
            this._navCursor = this._navStack.length - 1;
        }
        this._syncNavChrome();
    },

    _syncNavChrome: function () {
        const backBtn = document.getElementById('help-nav-back');
        const fwdBtn = document.getElementById('help-nav-forward');
        this._bindHelpNavKeys();
        const canBack = this._navCursor > 0;
        const canFwd = this._navCursor >= 0 && this._navCursor < this._navStack.length - 1;
        if (backBtn) {
            backBtn.disabled = !canBack;
            backBtn.setAttribute('aria-disabled', canBack ? 'false' : 'true');
            const prev = canBack ? this._navStack[this._navCursor - 1] : null;
            backBtn.title = prev ? ('Back to ' + this._navEntryLabel(prev)) : 'Previous topic';
            backBtn.setAttribute('aria-label', backBtn.title);
        }
        if (fwdBtn) {
            fwdBtn.disabled = !canFwd;
            fwdBtn.setAttribute('aria-disabled', canFwd ? 'false' : 'true');
            const next = canFwd ? this._navStack[this._navCursor + 1] : null;
            fwdBtn.title = next ? ('Forward to ' + this._navEntryLabel(next)) : 'Next topic';
            fwdBtn.setAttribute('aria-label', fwdBtn.title);
        }
        this._renderHeaderBreadcrumb();
    },

    _renderHeaderBreadcrumb: function () {
        const nav = document.getElementById('help-header-breadcrumb');
        if (!nav || !this.helpTopics) return;
        if (this._searchViewOpen) {
            nav.innerHTML = '<span class="help-bc-current">Search</span>';
            return;
        }
        const topic = this.helpTopics[this.activeHelpPageIndex];
        if (!topic) {
            nav.innerHTML = '';
            return;
        }
        const slug = this.activeWidgetSubSlug;
        const subpages = this._topicSubpages(topic);
        const sub = slug
            ? subpages.find(function (s) { return s.slug === slug; })
            : null;
        const parts = [];
        if (sub) {
            const idx = this.activeHelpPageIndex;
            parts.push(
                '<button type="button" class="help-bc-link" title="'
                + this._escapeHelpText(topic.title)
                + '" onclick="HelpSystem.showPage(' + idx + ', { widgetSubSlug: null })">'
                + this._escapeHelpText(topic.title)
                + '</button>'
            );
            parts.push('<i class="ph-bold ph-caret-right" aria-hidden="true"></i>');
            const cleanSubTitle = String(sub.title || '').replace(/\[badge\s*:\s*[^\]]+\]/gi, '').trim();
            parts.push('<span class="help-bc-current">' + this._escapeHelpText(cleanSubTitle) + '</span>');
        } else {
            parts.push('<span class="help-bc-current">' + this._escapeHelpText(topic.title) + '</span>');
        }
        nav.innerHTML = parts.join('');
    },

    historyBack: function () {
        if (this._navCursor <= 0) return;
        this._navCursor -= 1;
        this._restoreNavEntry(this._navStack[this._navCursor]);
    },

    historyForward: function () {
        if (this._navCursor < 0 || this._navCursor >= this._navStack.length - 1) return;
        this._navCursor += 1;
        this._restoreNavEntry(this._navStack[this._navCursor]);
    },

    _restoreNavEntry: function (entry) {
        if (!entry) return;
        this._navSilent = true;
        if (entry.type === 'search') {
            this._searchQuery = String(entry.query || '');
            this._syncSearchInputFromState();
            this._openSearchView({ skipHistory: true, scrollTop: entry.scrollTop || 0 });
        } else {
            this._leaveSearchViewKeepQuery();
            this.showPage(entry.index, {
                widgetSubSlug: entry.slug,
                skipHistory: true,
                anchor: entry.anchor
            });
        }
        this._navSilent = false;
        this._syncNavChrome();
    },

    _bindHelpNavKeys: function () {
        if (this._navKeyBound) return;
        this._navKeyBound = true;
        const self = this;
        document.addEventListener('keydown', function (e) {
            if (!self.isOpen && !(self.container && self.container.classList.contains('open'))) return;
            if (!e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) return;
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            const target = e.target;
            if (target && target.closest && target.closest('input, textarea, select, [contenteditable="true"]')) return;
            if (e.key === 'ArrowLeft') {
                if (self._navCursor <= 0) return;
                self.historyBack();
            } else {
                if (self._navCursor < 0 || self._navCursor >= self._navStack.length - 1) return;
                self.historyForward();
            }
            e.preventDefault();
        });
    },

    _stripHelpSearchMarkup: function (text, options) {
        options = options || {};
        let out = String(text == null ? '' : text);
        out = out.replace(/:ph-[a-z0-9\-]+(?:\s+[a-z0-9\-]+)*:/gi, '');
        if (options.keepBadgeText) {
            out = out.replace(/\[badge\s*:\s*([^\]]+)\]/gi, ' $1');
        } else {
            out = out.replace(/\[badge\s*:\s*[^\]]+\]/gi, '');
        }
        out = out.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        out = out.replace(/`([^`]+)`/g, '$1');
        out = out.replace(/\*\*([^*]+)\*\*/g, '$1');
        out = out.replace(/\*([^*]+)\*/g, '$1');
        return out.replace(/\s+/g, ' ').trim();
    },

    _plainTextFromHelpMarkdown: function (markdown) {
        let out = String(markdown == null ? '' : markdown);
        out = out.replace(/:::\s*code-block[^\n]*\n/gi, '\n');
        out = out.replace(/^:::\s*.*$/gm, ' ');
        out = out.replace(/!\[[^\]]*\]\([^)]+\)/g, ' ');
        out = out.replace(/<br\s*\/?>/gi, ' ');
        out = out.replace(/<\/?kbd>/gi, ' ');
        out = out.replace(/<\/?[a-z][^>]*>/gi, ' ');
        out = out.replace(/\|/g, ' ');
        out = out.replace(/^#{1,6}\s+/gm, '');
        return this._stripHelpSearchMarkup(out);
    },

    _splitHelpSearchSections: function (markdown) {
        const lines = String(markdown || '').split('\n');
        const used = {};
        const sections = [];
        let current = { title: '', anchor: null, lines: [] };
        const self = this;
        const flush = function () {
            const bodyPlain = self._plainTextFromHelpMarkdown(current.lines.join('\n'));
            if (!current.title && !bodyPlain) return;
            sections.push({
                title: current.title,
                anchor: current.anchor,
                bodyPlain: bodyPlain
            });
        };
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                const display = this._stripHelpSearchMarkup(match[2]);
                if (display) {
                    const anchorSource = this._stripHelpSearchMarkup(match[2], { keepBadgeText: true });
                    const slug = this._slugifyHelpAnchor(anchorSource || display);
                    if (slug) {
                        flush();
                        let id = slug;
                        let n = 1;
                        while (used[id]) {
                            n += 1;
                            id = slug + '-' + n;
                        }
                        used[id] = true;
                        current = { title: display, anchor: id, lines: [] };
                        continue;
                    }
                }
            }
            current.lines.push(lines[i]);
        }
        flush();
        return sections;
    },

    _helpSearchHaystack: function (parts) {
        const bits = [];
        for (let i = 0; i < parts.length; i++) {
            const value = String(parts[i] == null ? '' : parts[i]).trim().toLowerCase();
            if (value) bits.push(value);
        }
        return bits.join(' ');
    },

    _pushSearchIndexRecord: function (record) {
        if (!this._searchIndex) this._searchIndex = [];
        record.seq = this._searchIndex.length;
        this._searchIndex.push(record);
    },

    _indexHelpPageContent: function (options) {
        const markdown = typeof options.content === 'string' ? options.content : '';
        const sections = this._splitHelpSearchSections(markdown);
        let leadBody = '';
        let headingStart = 0;
        if (sections.length && !sections[0].title) {
            leadBody = sections[0].bodyPlain;
            headingStart = 1;
        }
        this._pushSearchIndexRecord({
            kind: options.kind,
            topicIndex: options.topicIndex,
            slug: options.slug,
            anchor: null,
            icon: options.icon,
            topicIcon: options.topicIcon,
            topicTitle: options.topicTitle,
            pageTitle: options.pageTitle,
            headingTitle: '',
            bodyText: leadBody,
            haystack: this._helpSearchHaystack([options.pageTitle, leadBody])
        });
        for (let i = headingStart; i < sections.length; i++) {
            const section = sections[i];
            this._pushSearchIndexRecord({
                kind: 'heading',
                topicIndex: options.topicIndex,
                slug: options.slug,
                anchor: section.anchor,
                icon: 'ph-text-align-left',
                topicIcon: options.topicIcon,
                topicTitle: options.topicTitle,
                pageTitle: options.pageTitle,
                headingTitle: section.title,
                bodyText: section.bodyPlain,
                haystack: this._helpSearchHaystack([section.title, section.bodyPlain])
            });
        }
    },

    _buildSearchIndex: function () {
        this._searchIndex = [];
        const topics = Array.isArray(this.helpTopics) ? this.helpTopics : [];
        const self = this;
        topics.forEach(function (topic, topicIndex) {
            if (!topic || typeof topic !== 'object') return;
            const topicTitle = String(topic.title || '').trim();
            const topicIcon = topic.icon || 'ph-book-open-text';
            self._indexHelpPageContent({
                kind: 'topic',
                topicIndex: topicIndex,
                slug: null,
                icon: 'ph-book-open',
                topicIcon: topicIcon,
                topicTitle: topicTitle,
                pageTitle: topicTitle,
                content: topic.content
            });
            const subpages = self._topicSubpages(topic);
            subpages.forEach(function (sp) {
                if (!sp || typeof sp !== 'object') return;
                const pageTitle = String(sp.title || '').trim();
                self._indexHelpPageContent({
                    kind: 'subpage',
                    topicIndex: topicIndex,
                    slug: sp.slug || null,
                    icon: sp.icon || 'ph-square',
                    topicIcon: topicIcon,
                    topicTitle: topicTitle,
                    pageTitle: pageTitle,
                    content: sp.content
                });
            });
        });
    },

    _parseSearchTokens: function (query) {
        return String(query || '').toLowerCase().trim().split(/\s+/).filter(function (tok) {
            return tok.length > 0;
        });
    },

    _searchTitleText: function (hit) {
        return String(hit.headingTitle || hit.pageTitle || '').toLowerCase();
    },

    _searchTokensAllInText: function (text, tokens) {
        const hay = String(text || '').toLowerCase();
        for (let t = 0; t < tokens.length; t++) {
            if (hay.indexOf(tokens[t]) === -1) return false;
        }
        return tokens.length > 0;
    },

    _searchHitRank: function (hit, tokens) {
        const title = this._searchTitleText(hit);
        const joined = tokens.join(' ');
        if (joined && title === joined) return 0;
        if (joined && title.indexOf(joined) === 0) return 1;
        if (tokens.length === 1 && title.indexOf(tokens[0]) === 0) return 1;
        if (this._searchTokensAllInText(title, tokens)) return 2;
        return 3;
    },

    _filterSearchHits: function (query) {
        const tokens = this._parseSearchTokens(query);
        if (!tokens.length || !this._searchIndex) return [];
        const hits = [];
        for (let i = 0; i < this._searchIndex.length; i++) {
            const rec = this._searchIndex[i];
            let ok = true;
            for (let t = 0; t < tokens.length; t++) {
                if (rec.haystack.indexOf(tokens[t]) === -1) {
                    ok = false;
                    break;
                }
            }
            if (ok) hits.push(rec);
        }
        return hits;
    },

    _groupSearchHits: function (hits, tokens) {
        const groups = [];
        const byTopic = {};
        for (let i = 0; i < hits.length; i++) {
            const hit = hits[i];
            const key = String(hit.topicIndex);
            if (!byTopic[key]) {
                byTopic[key] = {
                    topicIndex: hit.topicIndex,
                    topicTitle: hit.topicTitle,
                    topicIcon: hit.topicIcon,
                    hits: []
                };
                groups.push(byTopic[key]);
            }
            byTopic[key].hits.push(hit);
        }
        const self = this;
        groups.forEach(function (group) {
            group.hits.sort(function (a, b) {
                const ra = self._searchHitRank(a, tokens);
                const rb = self._searchHitRank(b, tokens);
                if (ra !== rb) return ra - rb;
                return a.seq - b.seq;
            });
        });
        return groups;
    },

    _highlightSearchText: function (text, tokens) {
        const raw = String(text == null ? '' : text);
        if (!raw) return '';
        if (!tokens || !tokens.length) return this._escapeHelpText(raw);
        const lower = raw.toLowerCase();
        const ranges = [];
        for (let t = 0; t < tokens.length; t++) {
            const tok = tokens[t];
            if (!tok) continue;
            let pos = 0;
            while (pos < lower.length) {
                const found = lower.indexOf(tok, pos);
                if (found < 0) break;
                ranges.push({ start: found, end: found + tok.length });
                pos = found + tok.length;
            }
        }
        if (!ranges.length) return this._escapeHelpText(raw);
        ranges.sort(function (a, b) { return a.start - b.start; });
        const merged = [];
        for (let r = 0; r < ranges.length; r++) {
            const cur = ranges[r];
            const last = merged.length ? merged[merged.length - 1] : null;
            if (last && cur.start <= last.end) {
                if (cur.end > last.end) last.end = cur.end;
            } else {
                merged.push({ start: cur.start, end: cur.end });
            }
        }
        let html = '';
        let cursor = 0;
        for (let m = 0; m < merged.length; m++) {
            const range = merged[m];
            if (range.start > cursor) {
                html += this._escapeHelpText(raw.slice(cursor, range.start));
            }
            html += '<mark class="help-search-mark">' + this._escapeHelpText(raw.slice(range.start, range.end)) + '</mark>';
            cursor = range.end;
        }
        if (cursor < raw.length) html += this._escapeHelpText(raw.slice(cursor));
        return html;
    },

    _searchSnippetText: function (hit, tokens) {
        if (!tokens || !tokens.length) return '';
        if (this._searchTokensAllInText(this._searchTitleText(hit), tokens)) return '';
        const body = String(hit.bodyText || '');
        if (!body) return '';
        const lower = body.toLowerCase();
        let first = -1;
        let firstLen = 0;
        for (let t = 0; t < tokens.length; t++) {
            const tok = tokens[t];
            if (!tok) continue;
            const found = lower.indexOf(tok);
            if (found < 0) continue;
            if (first < 0 || found < first) {
                first = found;
                firstLen = tok.length;
            }
        }
        if (first < 0) return '';
        const radius = 56;
        let start = first - radius;
        if (start < 0) start = 0;
        let end = first + firstLen + radius;
        if (end > body.length) end = body.length;
        if (start > 0) {
            const space = body.lastIndexOf(' ', start);
            if (space >= 0 && start - space < 24) start = space + 1;
        }
        if (end < body.length) {
            const space = body.indexOf(' ', end);
            if (space >= 0 && space - end < 24) end = space;
        }
        let snippet = body.slice(start, end).trim();
        if (!snippet) return '';
        if (start > 0) snippet = '... ' + snippet;
        if (end < body.length) snippet = snippet + ' ...';
        return snippet;
    },

    _searchRowPath: function (hit) {
        if (hit.kind === 'topic') return hit.topicTitle || '';
        if (hit.pageTitle && hit.pageTitle !== hit.topicTitle) {
            return hit.topicTitle + ' / ' + hit.pageTitle;
        }
        return hit.topicTitle || '';
    },

    _searchRowTitle: function (hit) {
        if (hit.kind === 'heading') return hit.headingTitle || hit.pageTitle;
        return hit.pageTitle || hit.topicTitle;
    },

    _searchRowIconClass: function (hit) {
        const icon = hit.icon || 'ph-circle';
        return icon.indexOf('ph ') === 0 ? icon : ('ph ' + icon);
    },

    _bindHelpSearchUi: function () {
        const input = document.getElementById('help-search-input');
        if (!input) return;
        if (this._searchUiBound) {
            this._syncSearchClearButton();
            return;
        }
        this._searchUiBound = true;
        const self = this;
        const content = document.getElementById('help-content-body');
        if (content) {
            content.addEventListener('click', function (e) {
                const row = e.target.closest ? e.target.closest('.help-search-row') : null;
                if (!row || !content.contains(row)) return;
                e.preventDefault();
                self._openSearchHitFromRow(row);
            });
            content.addEventListener('mousemove', function (e) {
                const row = e.target.closest ? e.target.closest('.help-search-row') : null;
                if (!row || !content.contains(row)) return;
                const rows = content.querySelectorAll('.help-search-row');
                for (let i = 0; i < rows.length; i++) {
                    if (rows[i] === row) {
                        self._setSearchActiveRow(i, false);
                        break;
                    }
                }
            });
        }
        this._bindHelpSearchKeys();
        this._syncSearchClearButton();
    },

    _bindHelpSearchKeys: function () {
        if (this._searchKeysBound) return;
        this._searchKeysBound = true;
        const self = this;
        document.addEventListener('keydown', function (e) {
            if (!self.isOpen && !(self.container && self.container.classList.contains('open'))) return;
            const target = e.target;
            const inField = !!(target && target.closest && target.closest('input, textarea, select, [contenteditable="true"]'));
            if (e.key === 'Escape') {
                if (!self._searchViewOpen && !self._searchQuery) return;
                if (inField && target && target.id !== 'help-search-input') return;
                e.preventDefault();
                if (self._searchQuery || self._searchViewOpen) {
                    self.clearHelpSearch();
                } else if (target && target.id === 'help-search-input') {
                    target.blur();
                }
                return;
            }
            if (e.key === '/' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                if (inField) return;
                e.preventDefault();
                self.focusHelpSearch();
                return;
            }
            if (!self._searchViewOpen) return;
            if (inField) return;
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                self._onHelpSearchListKey(e);
            }
        });
    },

    onHelpSearchInput: function () {
        const input = document.getElementById('help-search-input');
        this._searchQuery = input ? input.value : '';
        this._syncSearchClearButton();
        if (this._searchDebounceTimer) {
            window.clearTimeout(this._searchDebounceTimer);
            this._searchDebounceTimer = null;
        }
        this._applyHelpSearchQuery();
    },

    onHelpSearchKey: function (e) {
        if (!e) return;
        if (e.key === 'Escape') return;
        if (e.key === 'Enter') {
            e.preventDefault();
            if (this._searchViewOpen) {
                this._onHelpSearchListKey(e);
            } else {
                this._applyHelpSearchQuery();
            }
            return;
        }
        if (!this._searchViewOpen) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            this._onHelpSearchListKey(e);
        }
    },

    _applyHelpSearchQuery: function () {
        const trimmed = String(this._searchQuery || '').trim();
        if (!trimmed) {
            this._closeSearchViewRestoreTopic();
            return;
        }
        try {
            if (!this._searchIndex || !this._searchIndex.length) this._buildSearchIndex();
            this._openSearchView({});
        } catch (err) {
            console.error('Help search failed:', err);
        }
    },

    _syncSearchInputFromState: function () {
        const input = document.getElementById('help-search-input');
        if (input && input.value !== this._searchQuery) {
            input.value = this._searchQuery;
        }
        this._syncSearchClearButton();
    },

    _syncSearchClearButton: function () {
        const clearBtn = document.getElementById('help-search-clear');
        if (!clearBtn) return;
        const has = String(this._searchQuery || '').length > 0;
        if (has) {
            clearBtn.removeAttribute('hidden');
            clearBtn.classList.add('is-visible');
        } else {
            clearBtn.setAttribute('hidden', '');
            clearBtn.classList.remove('is-visible');
        }
    },

    _setSearchPanelOpen: function (open) {
        const panel = this.container || document.getElementById('help-panel');
        if (!panel) return;
        if (open) panel.classList.add('help-search-open');
        else panel.classList.remove('help-search-open');
    },

    _leaveSearchViewKeepQuery: function () {
        if (!this._searchViewOpen) {
            this._setSearchPanelOpen(false);
            return;
        }
        this._captureSearchScroll();
        this._searchViewOpen = false;
        this._setSearchPanelOpen(false);
    },

    _captureSearchScroll: function () {
        if (!this._searchViewOpen) return;
        const current = this._navStack[this._navCursor];
        if (!current || current.type !== 'search') return;
        const content = document.getElementById('help-content-body');
        current.scrollTop = content ? content.scrollTop : 0;
        current.query = this._searchQuery;
    },

    _recordSearchHistory: function (query, options) {
        options = options || {};
        if (options.skipHistory || this._navSilent) {
            const current = this._navStack[this._navCursor];
            if (current && current.type === 'search') {
                current.query = query;
            }
            this._syncNavChrome();
            return;
        }
        const content = document.getElementById('help-content-body');
        const scrollTop = content && this._searchViewOpen ? content.scrollTop : 0;
        const entry = this._navSearchLocation(query, scrollTop);
        const current = this._navStack[this._navCursor];
        if (current && current.type === 'search') {
            current.query = query;
            current.scrollTop = scrollTop;
            this._syncNavChrome();
            return;
        }
        const prev = this._navCursor > 0 ? this._navStack[this._navCursor - 1] : null;
        if (current && current.type !== 'search' && prev && prev.type === 'search') {
            prev.query = query;
            this._navStack = this._navStack.slice(0, this._navCursor);
            this._navCursor = this._navStack.length - 1;
            this._syncNavChrome();
            return;
        }
        this._recordHelpHistory(entry);
    },

    _openSearchView: function (options) {
        options = options || {};
        this._searchViewOpen = true;
        this._setSearchPanelOpen(true);
        this._searchActiveRow = 0;
        this._renderSearchResults();
        const content = document.getElementById('help-content-body');
        if (content) {
            content.scrollTop = typeof options.scrollTop === 'number' ? options.scrollTop : 0;
        }
        this._recordSearchHistory(this._searchQuery, { skipHistory: !!options.skipHistory });
        this._syncNavChrome();
    },

    _closeSearchViewRestoreTopic: function () {
        const wasSearch = this._searchViewOpen
            || (this._navStack[this._navCursor] && this._navStack[this._navCursor].type === 'search');
        this._searchQuery = '';
        this._syncSearchInputFromState();
        this._searchViewOpen = false;
        this._setSearchPanelOpen(false);
        if (!wasSearch) {
            this._syncNavChrome();
            return;
        }
        const current = this._navStack[this._navCursor];
        if (current && current.type === 'search') {
            this._navStack = this._navStack.slice(0, this._navCursor);
            this._navCursor = this._navStack.length - 1;
        }
        const prev = this._navCursor >= 0 ? this._navStack[this._navCursor] : null;
        if (prev && prev.type !== 'search') {
            this._restoreNavEntry(prev);
        } else {
            const idx = this.activeHelpPageIndex >= 0 ? this.activeHelpPageIndex : 0;
            this.showPage(idx, {
                widgetSubSlug: this.activeWidgetSubSlug,
                skipHistory: true
            });
            this._syncNavChrome();
        }
    },

    clearHelpSearch: function () {
        if (this._searchDebounceTimer) {
            window.clearTimeout(this._searchDebounceTimer);
            this._searchDebounceTimer = null;
        }
        this._closeSearchViewRestoreTopic();
        const input = document.getElementById('help-search-input');
        if (input) input.focus();
    },

    focusHelpSearch: function () {
        const input = document.getElementById('help-search-input');
        if (!input) return;
        input.focus();
        if (typeof input.select === 'function') input.select();
    },

    _formatSearchMeta: function (hitCount, topicCount) {
        const matches = hitCount === 1 ? '1 match' : (hitCount + ' matches');
        const topics = topicCount === 1 ? '1 topic' : (topicCount + ' topics');
        return matches + ' in ' + topics;
    },

    _renderSearchResults: function () {
        const content = document.getElementById('help-content-body');
        if (!content) return;
        const tokens = this._parseSearchTokens(this._searchQuery);
        const hits = this._filterSearchHits(this._searchQuery);
        const groups = this._groupSearchHits(hits, tokens);
        let html = '<div class="help-search-results fade-in">';
        html += '<header class="help-search-results-header">';
        html += '<h2 class="help-section-title">Search Results</h2>';
        if (hits.length) {
            html += '<p class="help-search-results-meta">' + this._escapeHelpText(this._formatSearchMeta(hits.length, groups.length)) + '</p>';
        }
        html += '</header>';
        if (!hits.length) {
            html += '<div class="help-search-empty">';
            html += '<i class="ph ph-magnifying-glass" aria-hidden="true"></i>';
            html += '<p class="help-search-empty-title">No matching sections</p>';
            html += '<p class="help-search-empty-hint">Try another word from a topic, heading, or the text on a page.</p>';
            html += '</div>';
        } else {
            html += '<div class="help-search-groups" role="list">';
            let rowIndex = 0;
            for (let g = 0; g < groups.length; g++) {
                const group = groups[g];
                html += '<section class="help-search-group">';
                html += '<header class="help-search-group-header">';
                html += '<span class="help-search-group-icon"><i class="ph ' + this._escapeHelpText(group.topicIcon || 'ph-book-open-text') + '" aria-hidden="true"></i></span>';
                html += '<h3>' + this._escapeHelpText(group.topicTitle) + '</h3>';
                html += '<span class="help-search-count-pill">' + group.hits.length + '</span>';
                html += '</header>';
                html += '<div class="help-search-group-rows">';
                for (let h = 0; h < group.hits.length; h++) {
                    const hit = group.hits[h];
                    const title = this._searchRowTitle(hit);
                    const path = this._searchRowPath(hit);
                    const active = rowIndex === this._searchActiveRow ? ' is-active' : '';
                    html += '<button type="button" class="help-search-row' + active + '" role="listitem"';
                    html += ' data-row-index="' + rowIndex + '"';
                    html += ' data-topic-index="' + hit.topicIndex + '"';
                    html += ' data-slug="' + this._escapeHelpText(hit.slug || '') + '"';
                    html += ' data-anchor="' + this._escapeHelpText(hit.anchor || '') + '"';
                    html += '>';
                    html += '<i class="' + this._escapeHelpText(this._searchRowIconClass(hit)) + ' help-search-row-icon" aria-hidden="true"></i>';
                    html += '<span class="help-search-row-text">';
                    html += '<span class="help-search-row-title">' + this._highlightSearchText(title, tokens) + '</span>';
                    const snippet = this._searchSnippetText(hit, tokens);
                    if (snippet) {
                        html += '<span class="help-search-row-snippet">' + this._highlightSearchText(snippet, tokens) + '</span>';
                    }
                    html += '<span class="help-search-row-path">' + this._escapeHelpText(path) + '</span>';
                    html += '</span>';
                    html += '</button>';
                    rowIndex += 1;
                }
                html += '</div></section>';
            }
            html += '</div>';
        }
        html += '</div>';
        content.innerHTML = html;
        if (hits.length) this._setSearchActiveRow(this._searchActiveRow, false);
        else content.scrollTop = 0;
    },

    _helpSearchRows: function () {
        const content = document.getElementById('help-content-body');
        if (!content) return [];
        return content.querySelectorAll('.help-search-row');
    },

    _setSearchActiveRow: function (index, scrollIntoView) {
        const rows = this._helpSearchRows();
        if (!rows.length) {
            this._searchActiveRow = 0;
            return;
        }
        let next = index;
        if (next < 0) next = 0;
        if (next >= rows.length) next = rows.length - 1;
        this._searchActiveRow = next;
        for (let i = 0; i < rows.length; i++) {
            if (i === next) rows[i].classList.add('is-active');
            else rows[i].classList.remove('is-active');
        }
        if (scrollIntoView && rows[next] && typeof rows[next].scrollIntoView === 'function') {
            rows[next].scrollIntoView({ block: 'nearest' });
        }
    },

    _onHelpSearchListKey: function (e) {
        const rows = this._helpSearchRows();
        if (!rows.length) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this._setSearchActiveRow(this._searchActiveRow + 1, true);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this._setSearchActiveRow(this._searchActiveRow - 1, true);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this._openSearchHitFromRow(rows[this._searchActiveRow] || rows[0]);
        }
    },

    _openSearchHitFromRow: function (row) {
        if (!row) return;
        const topicIndex = parseInt(row.getAttribute('data-topic-index'), 10);
        if (!Number.isFinite(topicIndex)) return;
        const slugRaw = row.getAttribute('data-slug') || '';
        const anchorRaw = row.getAttribute('data-anchor') || '';
        this._captureSearchScroll();
        this._leaveSearchViewKeepQuery();
        this.showPage(topicIndex, {
            widgetSubSlug: slugRaw || null,
            anchor: anchorRaw || null
        });
    },

    _buildTitleBlock: function (topic) {
        const slug = this.activeWidgetSubSlug;
        const subpages = this._topicSubpages(topic);
        const sub = slug && subpages.length
            ? subpages.find(function (s) { return s.slug === slug; })
            : null;
        const icon = (sub && sub.icon) || topic.icon;
        const title = (sub && sub.title) || topic.title;
        const renderedTitle = this._preprocessBadges(title);
        let html = '<h2 class="help-section-title help-title-row">';
        html += `<span class="help-section-title-text"><i class="ph ${icon}"></i> ${renderedTitle}</span>`;
        html += '<span class="help-title-actions">';
        html += '<button type="button" class="help-copy-markdown-btn" title="Copy topic markdown" aria-label="Copy topic markdown" onclick="HelpSystem.copyTopicMarkdown(this)"><i class="ph ph-copy" aria-hidden="true"></i></button>';
        html += '</span></h2>';
        return html;
    },

    getDocsPageParts: function (topic, widgetSubSlug) {
        const subpages = this._topicSubpages(topic);
        const hasNav = subpages.length > 0;
        let slug = widgetSubSlug || null;
        if (hasNav && slug && !subpages.some(function (s) { return s.slug === slug; })) {
            slug = null;
        }
        let bodyMd = this._getTopicMarkdown(topic, slug);
        let breadcrumb = '';
        if (hasNav && slug) {
            const sp = subpages.find(function (s) { return s.slug === slug; });
            if (sp) breadcrumb = sp.title;
        }
        const bodyHtml = this.renderMarkdown(bodyMd);
        const subnavItems = hasNav
            ? [{ slug: null, title: this._overviewNavTitle(topic), icon: 'ph-book-open' }].concat(
                subpages.map(function (s) {
                    return { slug: s.slug, title: s.title, icon: s.icon || 'ph-square' };
                })
            )
            : [];
        return {
            hasWidgetNav: hasNav,
            topic: topic,
            widgetSubSlug: slug,
            headerIcon: topic.icon,
            headerTitle: topic.title,
            breadcrumb: breadcrumb,
            bodyHtml: bodyHtml,
            subnavItems: subnavItems
        };
    },

    renderTOC: function () {
        const toc = document.getElementById('help-toc');
        if (!toc) return;
        toc.innerHTML = '';
        const self = this;

        this.helpTopics.forEach(function (topic, index) {
            const entry = document.createElement('div');
            entry.className = 'help-toc-entry';

            const tocItem = document.createElement('div');
            tocItem.className = 'help-toc-item';
            tocItem.innerHTML = `<i class="ph ${topic.icon}"></i> <span>${topic.title}</span>`;
            tocItem.onclick = function () {
                self._leaveSearchViewKeepQuery();
                self.showPage(index);
            };
            entry.appendChild(tocItem);

            const topicSubpages = self._topicSubpages(topic);
            if (topicSubpages.length) {
                const drawer = document.createElement('div');
                drawer.className = 'help-toc-widget-drawer';
                drawer.setAttribute('role', 'group');
                drawer.setAttribute('aria-label', topic.subpagesAriaLabel || 'Help sections');
                const drawerInner = document.createElement('div');
                drawerInner.className = 'help-toc-widget-drawer-inner';

                const addSub = function (slug, title, icon) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'help-toc-widget-subitem';
                    btn.setAttribute('data-widget-slug', slug == null ? '' : slug);
                    btn.innerHTML = `<i class="ph ${icon || 'ph-circle'}"></i><span>${self._preprocessBadges(title)}</span>`;
                    btn.onclick = function (e) {
                        e.stopPropagation();
                        self._leaveSearchViewKeepQuery();
                        self.showWidgetSubpage(slug == null ? null : slug, index);
                    };
                    drawerInner.appendChild(btn);
                };

                addSub(null, self._overviewNavTitle(topic), 'ph-book-open');
                topicSubpages.forEach(function (sp) {
                    addSub(sp.slug, sp.title, sp.icon);
                });
                drawer.appendChild(drawerInner);
                entry.appendChild(drawer);
            }

            toc.appendChild(entry);
        });
    },

    showPage: function (index, options) {
        options = options || {};
        const content = document.getElementById('help-content-body');
        if (!this.helpTopics) return;
        const topic = this.helpTopics[index];
        if (!topic || !content) return;

        if (!options.fromSearchRestore) {
            this._leaveSearchViewKeepQuery();
        }

        if (options.widgetSubSlug !== undefined) {
            this.activeWidgetSubSlug = options.widgetSubSlug || null;
        } else if (this.activeHelpPageIndex !== index) {
            this.activeWidgetSubSlug = null;
        }
        this.activeHelpPageIndex = index;

        document.querySelectorAll('.help-toc-entry').forEach(function (entry, idx) {
            const item = entry.querySelector('.help-toc-item');
            if (!item) return;
            if (idx === index) item.classList.add('active');
            else item.classList.remove('active');
        });

        this._syncTocWidgetDrawers(index);

        this._applyMarkdownSettings();

        const bodyHtml = this._getBodyHtmlForTopic(topic);
        let html = this._buildTitleBlock(topic);
        html += `<div class="help-section-body fade-in">${bodyHtml}</div>`;

        const ver = window.DASHBOARD_VERSION || "?.??";
        html += `<div class="help-footer"><p>Dashboard Studio v${ver}</p></div>`;

        content.innerHTML = html;
        this.postProcessHelpDom(content);
        if (!options.preserveScroll) {
            content.scrollTop = 0;
        }
        if (options.anchor) {
            this._scrollToAnchorAfterRender(options.anchor);
        }

        const skipHistory = !!(options.skipHistory || options.preserveScroll);
        this._recordHelpHistory(
            this._navLocation(index, this.activeWidgetSubSlug, options.anchor || null),
            { skipHistory: skipHistory }
        );
    },

    showWidgetSubpage: function (slug, topicIndex) {
        const idx = typeof topicIndex === 'number' ? topicIndex : this.activeHelpPageIndex;
        if (idx < 0) return;
        this.showPage(idx, { widgetSubSlug: slug });
    },

    goToPage: function (titleOrIndex, widgetSubSlug, anchorId) {
        const self = this;
        const performGoTo = function () {
            let index = self._findTopicIndex(titleOrIndex);
            let slug = widgetSubSlug;

            if (index < 0 && typeof self._resolveAliasTarget === 'function') {
                const aliasMatch = self._resolveAliasTarget(titleOrIndex, widgetSubSlug);
                if (aliasMatch) {
                    index = aliasMatch.topicIndex;
                    if (aliasMatch.widgetSubSlug) {
                        slug = aliasMatch.widgetSubSlug;
                    }
                }
            }

            if (index < 0) {
                console.warn("Help Page not found:", titleOrIndex);
                return;
            }

            if (slug) {
                slug = self._resolveSubpageSlug(self.helpTopics[index], slug);
            }

            self._ensurePanelOpen().then(function () {
                const opts = {};
                if (widgetSubSlug !== undefined || slug !== undefined) {
                    opts.widgetSubSlug = slug || null;
                }
                if (anchorId) opts.anchor = anchorId;
                self.showPage(index, opts);
            });
        };

        if (!this.container) {
            this.init().then(performGoTo);
        } else {
            this.loadHelpData().then(performGoTo);
        }
    },

    /**
     * Open help from the editor (Binding Options, field labels, Full editor, etc.).
     * Waits for the panel slide-in before rendering and scrolling to anchor.
     * @param {{ topic: string, widgetSub?: string|null, anchor?: string|null }} spec
     */
    openFromEditorSpec: function (spec) {
        if (!spec || !spec.topic) return;
        this.goToPage(spec.topic, spec.widgetSub, spec.anchor);
    },

    /** Registry type → Widgets help slug when they differ (Container is registered as `empty`). */
    _WIDGET_HELP_SLUG_ALIASES: { empty: 'container' },

    /** Tooltip links written against retired topic titles. */
    _LEGACY_HELP_TOPICS: {
        overview: 'Welcome & Introduction',
        appearance: 'Styling & Layering'
    },

    /**
     * Help slug for a widget registry type, or null when that type has no Widgets subpage.
     * When help JSON is not loaded yet, aliases and metadata.helpSlug are used; types with
     * no known page (experimental Video Stream) return null so the canvas button stays hidden.
     * @param {string} widgetType
     * @returns {string|null}
     */
    resolveWidgetHelpSlug: function (widgetType) {
        const type = String(widgetType || '').trim();
        if (!type) return null;

        let candidate = type;
        const wClass = (typeof WidgetRegistry !== 'undefined' && WidgetRegistry.widgets)
            ? WidgetRegistry.widgets[type]
            : null;
        const fromMeta = wClass && wClass.metadata && wClass.metadata.helpSlug;
        if (fromMeta) {
            candidate = String(fromMeta);
        } else if (this._WIDGET_HELP_SLUG_ALIASES[type]) {
            candidate = this._WIDGET_HELP_SLUG_ALIASES[type];
        }

        if (Array.isArray(this.helpTopics) && this.helpTopics.length) {
            const widgetsTopic = this.helpTopics.find(function (t) { return t && t.title === 'Widgets'; });
            const subs = this._topicSubpages(widgetsTopic);
            if (!subs.some(function (s) { return s && s.slug === candidate; })) return null;
            return candidate;
        }

        if (type === 'videostream') return null;
        return candidate;
    },

    /** Open the Widgets help subpage for a registry type (creates/opens the help panel). */
    openWidgetHelp: function (widgetType) {
        const self = this;
        const run = function () {
            const slug = self.resolveWidgetHelpSlug(widgetType);
            if (!slug) return;
            self.goToPage('Widgets', slug);
        };
        if (!this.helpTopics) this.loadHelpData().then(run);
        else run();
    },

    /**
     * Clickable help link for editor UI (label suffix, dialogs, toolbars).
     * @param {{ linkText: string, topic: string, widgetSub?: string|null, anchor?: string|null, linkClass?: string, iconPh?: string }} spec
     * @returns {HTMLAnchorElement}
     */
    createEditorHelpLink: function (spec) {
        spec = spec || {};
        const helpA = document.createElement('a');
        helpA.href = '#';
        helpA.className = spec.linkClass || 'editor-label-help-link';
        const label = spec.linkText || 'Help';
        if (spec.iconPh) {
            helpA.innerHTML = '<i class="ph-bold ' + spec.iconPh + '"></i> ' + label;
        } else {
            helpA.textContent = label;
        }
        const self = this;
        helpA.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            self.openFromEditorSpec({
                topic: spec.topic,
                widgetSub: spec.widgetSub,
                anchor: spec.anchor
            });
        };
        return helpA;
    },

    /** Renders `prefixText (linkText)` with a help anchor inside parentEl. */
    appendEditorLabelWithHelpLink: function (parentEl, prefixText, spec) {
        if (!parentEl) return;
        if (!spec || !spec.topic) {
            parentEl.textContent = prefixText;
            return;
        }
        parentEl.appendChild(document.createTextNode(prefixText + ' ('));
        parentEl.appendChild(this.createEditorHelpLink(spec));
        parentEl.appendChild(document.createTextNode(')'));
    },

    _copyTextToClipboard: function (text, onSuccess, onError) {
        const done = typeof onSuccess === 'function' ? onSuccess : function () {};
        const fail = typeof onError === 'function' ? onError : function () {};

        function legacyCopy() {
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.setAttribute('readonly', '');
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                textArea.setSelectionRange(0, text.length);
                const copied = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (copied) done();
                else fail();
            } catch (err) {
                fail(err);
            }
        }

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(text).then(done).catch(function () { legacyCopy(); });
            return;
        }
        legacyCopy();
    },

    _showCopyButtonSuccess: function (btn, successHtml) {
        if (!btn) return;
        const originalHTML = btn.innerHTML;
        const originalColor = btn.style.color;
        const originalBorder = btn.style.borderColor;
        btn.innerHTML = successHtml;
        btn.classList.add('help-copy-btn-copied');
        btn.style.color = '#22c55e';
        btn.style.borderColor = '#22c55e';
        window.setTimeout(function () {
            btn.innerHTML = originalHTML;
            btn.classList.remove('help-copy-btn-copied');
            btn.style.color = originalColor;
            btn.style.borderColor = originalBorder;
        }, 2000);
    },

    copyTopicMarkdown: function (btn) {
        const topic = this.helpTopics && this.activeHelpPageIndex >= 0
            ? this.helpTopics[this.activeHelpPageIndex]
            : null;
        if (!topic) return;
        const markdown = this._getTopicMarkdown(topic, this.activeWidgetSubSlug);
        if (!markdown) return;
        const self = this;
        this._copyTextToClipboard(markdown, function () {
            self._showCopyButtonSuccess(btn, '<i class="ph-bold ph-check" aria-hidden="true"></i>');
        });
    },

    copyCode: function (btn, codeId) {
        const codeEl = document.getElementById(codeId);
        if (!codeEl) return;

        const text = codeEl.innerText || codeEl.textContent;
        const self = this;
        this._copyTextToClipboard(text, function () {
            self._showCopyButtonSuccess(btn, '<i class="ph-bold ph-check"></i> Copied!');
        });
    },

    _normalizeHelpBlockFences: function (src) {
        if (src === undefined || src === null) return '';
        return src
            .replace(/^[ \t]+(:::[ \t]*(?:alert|lead|grid|details|access-legend|code-block|p)\b[^\n]*)$/gm, '$1')
            .replace(/^[ \t]+(:::[ \t]*)$/gm, '$1');
    },

    renderMarkdown: function (raw) {
        if (typeof raw !== 'string') return '';
        const Md = typeof window !== 'undefined' ? window.markdownit : null;
        const md = Md ? Md({ html: true, linkify: false, breaks: true }) : null;
        
        let pre = this._preprocessHelpPhosphorIcons(raw);

        pre = this._stripStyleBlocks(pre);
        pre = this._normalizeHelpDialectMarkdown(pre);
        pre = this._normalizeHelpBlockFences(pre);
        pre = this._preprocessImages(pre);
        pre = this._preprocessCodeBlocks(pre);
        pre = this._preprocessLead(pre);
        pre = this._preprocessAccessLegend(pre);
        pre = this._preprocessGrid(pre);
        pre = this._preprocessButton(pre);
        pre = this._preprocessAnchoredParagraphs(pre);
        pre = this._preprocessAlerts(pre);
        pre = this._preprocessDetails(pre);
        pre = this._preprocessBadges(pre);
        pre = this._preprocessAccessBadges(pre);
        pre = this._preprocessKbd(pre);
        pre = this._preprocessMuted(pre);
        pre = this._preprocessNewTabLinks(pre);
        pre = this._preprocessHelpLinks(pre);
        pre = this._normalizeHelpListMarkdown(pre);

        let html = '';
        if (md) {
            html = md.render(pre);
        } else {
            const esc = String(pre)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
            html = esc.length ? '<p>' + esc.replace(/\r\n/g, '\n').split('\n').join('<br>') + '</p>' : '';
        }

        html = this._unwrapListItemParagraphs(html);
        return this._sanitizeHelpMarkdownHtml(html);
    },

    renderMarkdownInline: function (raw) {
        if (typeof raw !== 'string') return '';
        const Md = typeof window !== 'undefined' ? window.markdownit : null;
        const md = Md ? Md({ html: true, linkify: false, breaks: true }) : null;
        
        let         pre = this._preprocessHelpPhosphorIcons(raw);

        pre = this._preprocessBadges(pre);
        pre = this._preprocessAccessBadges(pre);
        pre = this._preprocessKbd(pre);
        pre = this._preprocessMuted(pre);
        pre = this._preprocessNewTabLinks(pre);

        let html = '';
        if (md) {
            html = md.renderInline(pre);
        } else {
            html = pre;
        }

        return this._sanitizeHelpMarkdownHtml(html);
    },

    _mapOutsideBackticks: function (src, fn) {
        if (src === undefined || src === null) return '';
        const parts = String(src).split(/(`[^`]*`)/g);
        return parts.map(function (part) {
            return part.startsWith('`') ? part : fn(part);
        }).join('');
    },

    _preprocessHelpPhosphorIcons: function (src) {
        const prepared = this._preprocessKbd(src);
        return this._mapOutsideBackticks(prepared, function (part) {
            let out = part;
            if (typeof TextWidget !== 'undefined' && TextWidget && typeof TextWidget._preprocessPhosphorIcons === 'function') {
                out = TextWidget._preprocessPhosphorIcons(out, { defaultWeight: 'bold' });
            }
            out = out.replace(/:ph-bold\s+([^:\n]+?):/gi, '<i class="ph-bold $1"></i>');
            out = out.replace(/:ph\s+([^:\n]+?):/gi, '<i class="ph $1"></i>');
            out = out.replace(/:ph-([a-z0-9\-]+):/gi, '<i class="ph ph-$1"></i>');
            return out;
        });
    },

    _normalizeHelpDialectMarkdown: function (src) {
        if (src === undefined || src === null) return '';
        return src
            .replace(/^[ \t]+(:::[ \t])/gm, '$1')
            .replace(/^[ \t]+(<(?:h[1-6]|p|div|span|table|ul|ol|li|hr)\b)/gm, '$1')
            .replace(/^[ \t]+$/gm, '');
    },

    _isHelpListMarkerLine: function (line) {
        if (!line || /^\s*$/.test(line)) return false;
        return /^(\* |-|\+ |\d+\. )/.test(line.trimStart());
    },

    _normalizeHelpListMarkdown: function (src) {
        if (src === undefined || src === null) return '';
        const lines = src.split('\n');
        const rebuilt = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (/^\s*$/.test(line)) {
                let j = i + 1;
                while (j < lines.length && /^\s*$/.test(lines[j])) j++;
                const prev = rebuilt.length ? rebuilt[rebuilt.length - 1] : '';
                const next = j < lines.length ? lines[j] : '';
                if (this._isHelpListMarkerLine(prev) && this._isHelpListMarkerLine(next)) {
                    continue;
                }
            }
            let prevContent = rebuilt.length ? rebuilt[rebuilt.length - 1] : '';
            if (/^[ \t]{4,}/.test(line) && !this._isHelpListMarkerLine(line)) {
                let prevIdx = rebuilt.length - 1;
                while (prevIdx >= 0 && /^\s*$/.test(rebuilt[prevIdx])) prevIdx--;
                const prev = prevIdx >= 0 ? rebuilt[prevIdx] : '';
                if (/^(\* |-|\+ |\d+\. )/.test(prev.trimStart()) || /^[ \t]{4,}/.test(prev) || /\*\*\d+\./.test(prev)) {
                    const trimmed = line.trim();
                    if (trimmed) {
                        rebuilt[prevIdx] = prev + (prev.trim().endsWith(':') ? ' ' : '  \n') + trimmed;
                        continue;
                    }
                }
            }
            if (this._isHelpListMarkerLine(line) && !/^\s*$/.test(prevContent) && !this._isHelpListMarkerLine(prevContent) && !/^[ \t]{2,}/.test(line)) {
                rebuilt.push('');
            }
            rebuilt.push(line);
        }
        return rebuilt.join('\n');
    },

    _preprocessHelpLinks: function (src) {
        if (src === undefined || src === null) return '';
        let out = src;
        out = out.replace(/\[([^\]]+)\]\(help:\/\/([^)\s]+)\)/gi, (match, label, path) => {
            return `<a href="help://${path}">${label}</a>`;
        });
        out = out.replace(/\[([^\]]+)\]\((\?[^)\s]+)\)/gi, (match, label, query) => {
            return `<a href="${query}">${label}</a>`;
        });
        return out;
    },

    _stripStyleBlocks: function (src) {
        if (src === undefined || src === null) return '';
        return src.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    },

    _preprocessImages: function (src) {
        if (src === undefined || src === null) return '';
        return src
            .replace(/!\[header:\s*([^\]]*)\]\(([^)]+)\)/gi, '\n\n<img src="$2" class="help-img-header" alt="$1">\n\n')
            .replace(/!\[content:\s*([^\]]*)\]\(([^)]+)\)/gi, '\n\n<img src="$2" class="help-img-content" alt="$1">\n\n');
    },

    _preprocessAnchoredParagraphs: function (src) {
        if (src === undefined || src === null) return '';
        const self = this;
        return src.replace(/:::\s*p\s+#([a-z0-9\-]+)\n([\s\S]*?)\n:::/g, (match, id, inner) => {
            let innerHtml = self._renderHelpFragment(inner.trim());
            innerHtml = innerHtml.replace(/<\/?p>/gi, '');
            return `<p id="${id}">${innerHtml}</p>\n\n`;
        });
    },

    _unwrapListItemParagraphs: function (html) {
        if (!html) return '';
        let prev = '';
        let next = html;
        while (next !== prev) {
            prev = next;
            next = next.replace(/<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>/gi, '<li>$1</li>');
        }
        return next;
    },

    _renderHelpFragment: function (raw) {
        if (typeof raw !== 'string' || !raw.trim()) return '';
        let pre = this._preprocessHelpPhosphorIcons(raw);
        pre = this._preprocessBadges(pre);
        pre = this._preprocessAccessBadges(pre);
        pre = this._preprocessKbd(pre);
        pre = this._preprocessMuted(pre);
        pre = this._preprocessNewTabLinks(pre);
        const Md = typeof window !== 'undefined' ? window.markdownit : null;
        const md = Md ? Md({ html: true, linkify: false, breaks: true }) : null;
        const html = md ? md.render(pre) : pre;
        return this._sanitizeHelpMarkdownHtml(html);
    },

    _preprocessKbd: function (src) {
        if (src === undefined || src === null) return '';
        const toKbdHtml = (text) => {
            const safe = String(text).trim().replace(/`/g, '&#96;');
            return `<kbd>${safe}</kbd>`;
        };
        let out = src.replace(/\[kbd\s*:\s*([^\]]+)\]/gi, (match, text) => toKbdHtml(text));
        out = out.replace(/<kbd>([^<]*)<\/kbd>/gi, (match, text) => toKbdHtml(text));
        return out;
    },

    _preprocessMuted: function (src) {
        if (src === undefined || src === null) return '';
        return src.replace(/\[muted\s*:\s*([^\]]+)\]/gi, (match, text) => {
            return `<span style="color:var(--ui-text-muted); font-size:0.9em;">${text.trim()}</span>`;
        });
    },

    _preprocessLead: function (src) {
        if (src === undefined || src === null) return '';
        return src.replace(/:::\s*lead\n([\s\S]*?)\n:::/g, (match, inner) => {
            const innerHtml = this.renderMarkdown(inner.trim());
            let html = innerHtml.trim();
            if (html.startsWith('<p>')) {
                html = '<p class="lead">' + html.slice(3);
            } else {
                html = `<p class="lead">${html}</p>`;
            }
            return html + '\n\n';
        });
    },

    _preprocessGrid: function (src) {
        if (src === undefined || src === null) return '';
        return src.replace(/:::\s*grid\n([\s\S]*?)\n:::/g, (match, inner) => {
            const lines = inner.trim().split('\n');
            let html = '<div class="help-grid">\n';
            let currentItemHtml = '';
            let currentButtonHtml = '<div></div>';

            const flushItem = () => {
                if (currentItemHtml.trim()) {
                    const renderedHtml = this.renderMarkdown(currentItemHtml.trim());
                    html += `  <div class="help-grid-row">\n    ${currentButtonHtml}\n    <div>${renderedHtml}</div>\n  </div>\n`;
                }
                currentItemHtml = '';
                currentButtonHtml = '<div></div>';
            };

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                if (line.trim().startsWith('* ')) {
                    flushItem();
                    line = line.replace(/^\s*\*\s*/, ''); // Remove bullet
                    const btnMatch = line.match(/^\[button\s+([^\]]+)\]\s*/i);
                    if (btnMatch) {
                        const iconClasses = btnMatch[1].trim().split(/\s+/).map(c => c.startsWith('ph-') ? c : 'ph-' + c).join(' ');
                        currentButtonHtml = `<div><button class="btn-tool"><i class="ph ${iconClasses}"></i></button></div>`;
                        line = line.slice(btnMatch[0].length);
                    }
                    currentItemHtml += line + '\n';
                } else {
                    currentItemHtml += line + '\n';
                }
            }
            flushItem();
            html += '</div>\n\n';
            return html;
        });
    },

    _preprocessButton: function (src) {
        if (src === undefined || src === null) return '';
        return src.replace(/\[button\s+([^\]]+)\]/gi, (match, icons) => {
            const iconClasses = icons.trim().split(/\s+/).map(c => c.startsWith('ph-') ? c : 'ph-' + c).join(' ');
            return `<button class="btn-tool"><i class="ph ${iconClasses}"></i></button>`;
        });
    },

    _preprocessAccessLegend: function (src) {
        if (src === undefined || src === null) return '';
        return src.replace(/:::\s*access-legend\n([\s\S]*?)\n:::/g, (match, inner) => {
            const lines = inner.trim().split('\n');
            let html = '<div class="help-access-legend">';
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const rowMatch = line.match(/^\*\s*\[access\s*:\s*(R|W|RW|L|F)\]\s*(.*)$/i);
                if (rowMatch) {
                    const type = rowMatch[1];
                    const text = rowMatch[2];
                    const renderedText = this.renderMarkdownInline(text);
                    html += `<div class="help-access-row"><span class="help-access-badge-wrap">[access: ${type}]</span><span>${renderedText}</span></div>`;
                }
            }
            html += '</div>\n\n';
            return html;
        });
    },

    _flattenAlertBodyHtml: function (html) {
        if (!html) return '';
        let flat = html.trim();
        flat = flat.replace(/<\/p>\s*<p>/gi, '<br>');
        flat = flat.replace(/^<p>([\s\S]*?)<\/p>$/i, '$1');
        return flat;
    },

    _preprocessAlerts: function (src) {
        if (src === undefined || src === null) return '';
        const self = this;
        return src.replace(/^[ \t]*:::[ \t]*alert[ \t]+([a-z\-]+)[ \t]+([a-z0-9\-]+)[ \t]*\n([\s\S]*?)\n[ \t]*:::[ \t]*(?=\n|$)/gm, (match, type, icon, inner) => {
            const innerHtml = self._flattenAlertBodyHtml(self._renderHelpFragment(inner.trim()));
            return `<div class="help-alert ${type}"><i class="ph ph-${icon}"></i><div>${innerHtml}</div></div>\n\n`;
        });
    },

    _preprocessDetails: function (src) {
        if (src === undefined || src === null) return '';
        return src.replace(/:::\s*details\s+([^\n]+)\n([\s\S]*?)\n:::/g, (match, title, inner) => {
            const innerHtml = this.renderMarkdown(inner.trim());
            return `<details class="help-details"><summary class="help-summary"><i class="ph-bold ph-caret-right"></i> ${title.trim()}</summary><div class="help-details-content">${innerHtml}</div></details>\n\n`;
        });
    },

    _preprocessCodeBlocks: function (src) {
        if (src === undefined || src === null) return '';
        return src.replace(/:::\s*code-block(?:[ \t]+([^\n#]+))?(?:#([a-z0-9\-]+))?\n([\s\S]*?)\n:::/g, (match, title, id, inner) => {
            const idAttr = id ? ` id="${id.trim()}"` : '';
            const titleHtml = title ? `<div class="code-header">${title.trim()}</div>` : '';
            let content = inner.trim();
            let descHtml = '';
            
            const descMatch = content.match(/^Description:\s*([^\n]+)/i);
            if (descMatch) {
                descHtml = `<p class="code-desc">${descMatch[1].trim()}</p>`;
                content = content.slice(descMatch[0].length).trim();
            }
            
            const escaped = content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/`/g, '&#96;')
                .replace(/\n/g, '&#10;');
            return `<div class="code-block"${idAttr}>${titleHtml}${descHtml}<pre style="margin: 0; padding: 0; background: transparent; border: none;"><code>${escaped}</code></pre></div>\n\n`;
        });
    },

    _preprocessBadges: function (src) {
        if (src === undefined || src === null) return '';
        return src.replace(/\[badge\s*:\s*([^\]]+)\]/gi, (match, text) => {
            return `<span class="homey-badge">${text.trim()}</span>`;
        });
    },

    _preprocessAccessBadges: function (src) {
        if (src === undefined || src === null) return '';
        const badges = {
            'R':  { width: 20, fill: '#d97706', text: 'R' },
            'W':  { width: 20, fill: '#0891b2', text: 'W' },
            'RW': { width: 22, fill: '#059669', text: 'RW' },
            'L':  { width: 20, fill: '#0284c7', text: 'L' },
            'F':  { width: 20, fill: '#8b5cf6', text: 'F' }
        };
        return src.replace(/\[access\s*:\s*(R|W|RW|L|F)\]/gi, (match, type) => {
            const b = badges[type.toUpperCase()];
            if (!b) return match;
            return `<svg class="help-access-badge" xmlns="http://www.w3.org/2000/svg" width="${b.width}" height="13" style="vertical-align:middle;display:inline-block;" aria-hidden="true"><rect width="${b.width}" height="13" rx="2" fill="${b.fill}"/><text x="${b.width / 2}" y="6.5" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-size="7" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="700" letter-spacing="0.5">${b.text}</text></svg>`;
        });
    },

    _preprocessNewTabLinks: function (src) {
        if (src === undefined || src === null) return '';
        return this._mapOutsideBackticks(src, function (part) {
            return part.replace(/\[([^\]]+)\]\(([^)]+)\s+\^\)/gi, function (match, label, url) {
                return `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${label}</a>`;
            });
        });
    },

    _sanitizeHelpMarkdownHtml: function (html) {
        const P = typeof window !== 'undefined' ? window.DOMPurify : null;
        if (!P || typeof P.sanitize !== 'function') return html;
        this._ensurePurifyHelpUriHook();
        const allowedTags = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'strong', 'em', 's', 'i', 'br',
            'ul', 'ol', 'li', 'img', 'a', 'code', 'pre', 'blockquote', 'details', 'summary', 'kbd', 'svg', 'rect', 'text', 'button'
        ];
        return P.sanitize(html, {
            ALLOWED_TAGS: allowedTags,
            ALLOWED_ATTR: ['class', 'style', 'src', 'alt', 'title', 'href', 'target', 'rel', 'role', 'aria-label', 'onclick', 'id', 'width', 'height', 'fill', 'rx', 'x', 'y', 'stroke', 'stroke-width', 'text-anchor', 'dominant-baseline', 'font-size', 'font-family', 'font-weight', 'letter-spacing'],
            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|help):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
        });
    },

    postProcessHelpDom: function (containerEl) {
        if (!containerEl) return;

        containerEl.querySelectorAll('.help-section-body table').forEach(function (table) {
            table.classList.add('help-table');
        });

        const pres = containerEl.querySelectorAll('pre');
        pres.forEach((pre, index) => {
            if (pre.closest('.code-block')) return;
            const codeEl = pre.querySelector('code');
            if (!codeEl) return;

            const codeId = `help-code-block-${index}`;
            codeEl.id = codeId;

            if (pre.parentElement && !pre.parentElement.classList.contains('code-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'code-wrapper';
                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(pre);

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'code-copy-btn';
                btn.innerHTML = '<i class="ph-bold ph-copy"></i> Copy';
                btn.onclick = function () {
                    HelpSystem.copyCode(btn, codeId);
                };
                wrapper.appendChild(btn);
            }
        });
        
        const codeBlocks = containerEl.querySelectorAll('.code-block');
        codeBlocks.forEach((block, index) => {
            const codeEl = block.querySelector('code');
            if (!codeEl) return;
            const codeId = codeEl.id || `help-custom-code-block-${index}`;
            codeEl.id = codeId;

            if (!block.querySelector('.code-copy-btn')) {
                block.style.position = 'relative';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'code-copy-btn';
                btn.innerHTML = '<i class="ph-bold ph-copy"></i> Copy';
                btn.onclick = function () {
                    HelpSystem.copyCode(btn, codeId);
                };
                block.appendChild(btn);
            }
        });

        this._ensureHeadingAnchors(containerEl);
        if (!this._isHelpEditorPreview()) this._enhanceHelpCodeFrames(containerEl);
        else this._injectHelpEditorLinkCopyTools(containerEl);
    },

    _isHelpEditorPreview: function () {
        return !!(document.body && document.body.classList.contains('he-help-editor'));
    },

    _encodeHelpUriPart: function (value) {
        return encodeURIComponent(String(value == null ? '' : value));
    },

    /** Canonical help:// location for the page currently shown in the preview. */
    _buildHelpLocationHref: function (anchorId) {
        if (!this.helpTopics || this.activeHelpPageIndex < 0) return '';
        const topic = this.helpTopics[this.activeHelpPageIndex];
        if (!topic || !topic.title) return '';
        let href = 'help://' + this._encodeHelpUriPart(topic.title);
        if (this.activeWidgetSubSlug) href += '/' + this._encodeHelpUriPart(this.activeWidgetSubSlug);
        if (anchorId) {
            const id = String(anchorId).replace(/^#/, '');
            if (id) href += '#' + this._encodeHelpUriPart(id);
        }
        return href;
    },

    _helpEditorHeadingLabel: function (heading) {
        if (!heading) return '';
        const source = heading.querySelector('.help-section-title-text') || heading;
        const clone = source.cloneNode(true);
        const extras = clone.querySelectorAll('i, svg, button, .he-help-link-tools, .help-title-actions');
        for (let i = 0; i < extras.length; i++) extras[i].parentNode.removeChild(extras[i]);
        return String(clone.textContent || '').replace(/\s+/g, ' ').trim();
    },

    _helpEditorMarkdownLink: function (label, href) {
        const text = String(label || '').replace(/\[/g, '(').replace(/\]/g, ')');
        return '[' + text + '](' + href + ')';
    },

    _createHelpEditorLinkTools: function (heading, isTitle) {
        const href = this._buildHelpLocationHref(isTitle ? null : heading.id);
        const label = this._helpEditorHeadingLabel(heading);
        const md = this._helpEditorMarkdownLink(label, href);
        const tools = document.createElement('div');
        tools.className = 'he-help-link-tools';

        const makeBtn = function (copyText, title, iconClass, caption) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'he-help-copy-link-btn';
            btn.title = title;
            btn.setAttribute('aria-label', title);
            btn.setAttribute('data-copy', copyText);
            btn.innerHTML = '<i class="' + iconClass + '" aria-hidden="true"></i><span>' + caption + '</span>';
            btn.addEventListener('click', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                const text = btn.getAttribute('data-copy') || '';
                if (!text) return;
                HelpSystem._copyTextToClipboard(text, function () {
                    HelpSystem._showCopyButtonSuccess(btn, '<i class="ph-bold ph-check" aria-hidden="true"></i><span>Copied</span>');
                });
            });
            return btn;
        };

        tools.appendChild(makeBtn(href, 'Copy help URL', 'ph-bold ph-link', 'URL'));
        tools.appendChild(makeBtn(md, 'Copy markdown link', 'ph-bold ph-text-aa', 'MD'));
        return tools;
    },

    _wrapHelpEditorHeading: function (heading, isTitle) {
        if (!heading || heading.closest('.he-help-heading-anchor')) return;
        const parent = heading.parentNode;
        if (!parent) return;
        const wrap = document.createElement('div');
        wrap.className = 'he-help-heading-anchor' + (isTitle ? ' is-page-title' : '');
        parent.insertBefore(wrap, heading);
        wrap.appendChild(this._createHelpEditorLinkTools(heading, isTitle));
        wrap.appendChild(heading);
    },

    _injectHelpEditorLinkCopyTools: function (containerEl) {
        if (!this._isHelpEditorPreview() || !containerEl) return;
        const title = containerEl.querySelector('.help-section-title');
        if (title) this._wrapHelpEditorHeading(title, true);
        const body = containerEl.querySelector('.help-section-body');
        if (!body) return;
        const headings = body.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (let i = 0; i < headings.length; i++) {
            const heading = headings[i];
            if (heading.closest('pre, .code-block, .help-code-frame, table')) continue;
            this._wrapHelpEditorHeading(heading, false);
        }
    },

    _countHelpCodeLines: function (codeEl) {
        const raw = (codeEl.textContent || '').replace(/\s+$/g, '');
        if (!raw) return 1;
        return raw.split('\n').length;
    },

    _measureHelpCodeCollapsedHeight: function (codeEl) {
        const cs = window.getComputedStyle(codeEl);
        const fontSize = parseFloat(cs.fontSize) || 14;
        let lineHeight = parseFloat(cs.lineHeight);
        if (!lineHeight || Number.isNaN(lineHeight)) lineHeight = fontSize * 1.6;
        const padTop = parseFloat(cs.paddingTop) || 0;
        const padBottom = parseFloat(cs.paddingBottom) || 0;
        return {
            collapsedHeight: Math.ceil(lineHeight * 20 + padTop + padBottom),
            minHeight: Math.ceil(lineHeight * 6 + padTop + padBottom)
        };
    },

    _ensureHelpCodeToolbar: function (frame) {
        const header = frame.querySelector('.code-header');
        let toolbar = frame.querySelector('.help-code-toolbar');
        if (toolbar) return toolbar;
        toolbar = document.createElement('div');
        toolbar.className = 'help-code-toolbar';
        if (header) {
            if (!header.querySelector('.code-header-label')) {
                const label = document.createElement('span');
                label.className = 'code-header-label';
                while (header.firstChild) label.appendChild(header.firstChild);
                header.appendChild(label);
            }
            header.classList.add('has-code-actions');
            header.appendChild(toolbar);
        } else {
            const body = frame.querySelector('.help-code-body');
            frame.insertBefore(toolbar, body || frame.firstChild);
        }
        return toolbar;
    },

    _setHelpCodeExpanded: function (frame, expanded) {
        const body = frame.querySelector('.help-code-body');
        const btn = frame.querySelector('.help-code-expand-btn');
        frame.classList.toggle('is-expanded', !!expanded);
        if (body) {
            body.style.height = '';
            if (expanded) {
                body.style.removeProperty('--help-code-body-height');
            } else if (frame._helpCodeCollapsedHeight) {
                body.style.setProperty('--help-code-body-height', frame._helpCodeCollapsedHeight + 'px');
            }
        }
        if (!btn) return;
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        btn.title = expanded ? 'Show 20 lines' : 'Show full code';
        btn.innerHTML = expanded
            ? '<i class="ph-bold ph-arrows-in-simple"></i> Collapse'
            : '<i class="ph-bold ph-arrows-out-simple"></i> Expand';
    },

    _bindHelpCodeResize: function (frame, body, handle) {
        handle.addEventListener('pointerdown', function (event) {
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            const minH = frame._helpCodeMinHeight || 80;
            const startY = event.clientY;
            const startH = body.getBoundingClientRect().height;
            const codeEl = body.querySelector('code');
            const fullH = codeEl ? Math.max(codeEl.scrollHeight, codeEl.offsetHeight) : startH;
            const expandBtn = frame.querySelector('.help-code-expand-btn');
            frame.classList.add('is-resizing');
            frame.classList.remove('is-expanded');
            document.body.classList.add('help-code-resizing');
            if (expandBtn) {
                expandBtn.setAttribute('aria-expanded', 'false');
                expandBtn.title = 'Show full code';
                expandBtn.innerHTML = '<i class="ph-bold ph-arrows-out-simple"></i> Expand';
            }
            if (handle.setPointerCapture) handle.setPointerCapture(event.pointerId);
            const onMove = function (moveEvent) {
                const next = Math.round(Math.min(fullH, Math.max(minH, startH + (moveEvent.clientY - startY))));
                body.style.height = next + 'px';
            };
            const onUp = function () {
                frame.classList.remove('is-resizing');
                document.body.classList.remove('help-code-resizing');
                handle.removeEventListener('pointermove', onMove);
                handle.removeEventListener('pointerup', onUp);
                handle.removeEventListener('pointercancel', onUp);
            };
            handle.addEventListener('pointermove', onMove);
            handle.addEventListener('pointerup', onUp);
            handle.addEventListener('pointercancel', onUp);
        });
    },

    _enhanceHelpCodeFrames: function (containerEl) {
        const self = this;
        const frames = containerEl.querySelectorAll('.code-block, .code-wrapper');
        frames.forEach(function (frame) {
            const pre = frame.querySelector('pre');
            const codeEl = pre && pre.querySelector('code');
            if (!pre || !codeEl) return;

            let body = frame.querySelector('.help-code-body');
            if (!body) {
                body = document.createElement('div');
                body.className = 'help-code-body';
                pre.parentNode.insertBefore(body, pre);
                body.appendChild(pre);
            }
            frame.classList.add('help-code-frame');

            const lineCount = self._countHelpCodeLines(codeEl);
            if (lineCount <= 20) return;

            const metrics = self._measureHelpCodeCollapsedHeight(codeEl);
            frame._helpCodeCollapsedHeight = metrics.collapsedHeight;
            frame._helpCodeMinHeight = metrics.minHeight;
            frame.classList.add('is-collapsible');
            body.style.setProperty('--help-code-body-height', metrics.collapsedHeight + 'px');

            const toolbar = self._ensureHelpCodeToolbar(frame);
            const copyBtn = frame.querySelector('.code-copy-btn');
            if (copyBtn && copyBtn.parentElement !== toolbar) toolbar.appendChild(copyBtn);

            let expandBtn = toolbar.querySelector('.help-code-expand-btn');
            if (!expandBtn) {
                expandBtn = document.createElement('button');
                expandBtn.type = 'button';
                expandBtn.className = 'help-code-expand-btn';
                expandBtn.addEventListener('click', function () {
                    self._setHelpCodeExpanded(frame, !frame.classList.contains('is-expanded'));
                });
                toolbar.appendChild(expandBtn);
            }
            self._setHelpCodeExpanded(frame, false);

            let handle = frame.querySelector('.help-code-resize');
            if (!handle) {
                handle = document.createElement('div');
                handle.className = 'help-code-resize';
                handle.title = 'Drag to resize';
                handle.setAttribute('aria-hidden', 'true');
                frame.appendChild(handle);
                self._bindHelpCodeResize(frame, body, handle);
            }
        });
    },

    _decodeHelpUriPart: function (value) {
        const raw = String(value == null ? '' : value);
        try {
            return decodeURIComponent(raw.replace(/\+/g, '%20'));
        } catch (_e) {
            return raw.replace(/\+/g, ' ');
        }
    },

    _normalizeHelpTitle: function (value) {
        return this._decodeHelpUriPart(value).replace(/\s+/g, ' ').trim().toLowerCase();
    },

    _findTopicIndex: function (titleOrIndex) {
        if (!this.helpTopics) return -1;
        if (typeof titleOrIndex === 'number') return titleOrIndex;
        const want = this._normalizeHelpTitle(titleOrIndex);
        if (!want) return -1;
        let index = this.helpTopics.findIndex(function (t) { return t.title === titleOrIndex; });
        if (index >= 0) return index;
        index = this.helpTopics.findIndex(function (t) {
            return HelpSystem._normalizeHelpTitle(t.title) === want;
        });
        if (index >= 0) return index;
        const alias = this._LEGACY_HELP_TOPICS && this._LEGACY_HELP_TOPICS[want];
        if (!alias) return -1;
        const aliasWant = this._normalizeHelpTitle(alias);
        return this.helpTopics.findIndex(function (t) {
            return HelpSystem._normalizeHelpTitle(t.title) === aliasWant;
        });
    },

    _resolveSubpageSlug: function (topic, widgetSubSlug) {
        if (widgetSubSlug == null || widgetSubSlug === '') return widgetSubSlug;
        const subs = this._topicSubpages(topic);
        const exact = subs.find(function (s) { return s.slug === widgetSubSlug; });
        if (exact) return exact.slug;
        const want = this._normalizeHelpTitle(widgetSubSlug);
        const fuzzy = subs.find(function (s) {
            return HelpSystem._normalizeHelpTitle(s.slug) === want
                || HelpSystem._normalizeHelpTitle(s.title) === want;
        });
        return fuzzy ? fuzzy.slug : widgetSubSlug;
    },

    _parseAliasString: function (str) {
        if (!str) return null;
        let raw = String(str).trim();
        const httpMatch = raw.match(/^https?:\/\/[^/]+\/[^?]*\?(.*)$/i);
        if (httpMatch) raw = '?' + httpMatch[1];
        if (raw.indexOf('?') === 0) {
            try {
                const queryPart = raw.slice(1).split('#')[0];
                const params = new URLSearchParams(queryPart);
                const doc = params.get('docs');
                const widget = params.get('widget');
                if (doc) return { topic: doc, subpage: widget || null };
            } catch (e) {}
        }
        const helpMatch = raw.match(/^help:\/\/([^#?]+)/i);
        if (helpMatch) {
            const pathParts = helpMatch[1].split('/').map(decodeURIComponent);
            return { topic: pathParts[0] || null, subpage: pathParts[1] || null };
        }
        const slashIdx = raw.indexOf('/');
        if (slashIdx >= 0) {
            return { topic: raw.slice(0, slashIdx).trim(), subpage: raw.slice(slashIdx + 1).trim() };
        }
        return { topic: raw, subpage: null };
    },

    _matchAlias: function (entry, wantTopic, wantSubpage) {
        if (!entry || !wantTopic) return false;
        const parsed = this._parseAliasString(entry);
        if (!parsed || !parsed.topic) return false;
        const normEntryTopic = this._normalizeHelpTitle(parsed.topic);
        const normWantTopic = this._normalizeHelpTitle(wantTopic);
        if (normEntryTopic !== normWantTopic) return false;
        if (parsed.subpage) {
            if (!wantSubpage) return false;
            return this._normalizeHelpTitle(parsed.subpage) === this._normalizeHelpTitle(wantSubpage);
        }
        return true;
    },

    _resolveAliasTarget: function (titleOrQuery, optSubpage) {
        if (!this.helpTopics || !titleOrQuery) return null;
        const parsed = this._parseAliasString(titleOrQuery);
        const wantTopic = parsed ? parsed.topic : titleOrQuery;
        const wantSubpage = (parsed && parsed.subpage) ? parsed.subpage : optSubpage;
        if (!wantTopic) return null;

        const self = this;
        for (let i = 0; i < this.helpTopics.length; i++) {
            const topic = this.helpTopics[i];
            const topicAliases = topic.alternativeUrls || topic.aliases || [];
            for (let a = 0; a < topicAliases.length; a++) {
                if (self._matchAlias(topicAliases[a], wantTopic, wantSubpage)) {
                    return { topicIndex: i, topic: topic, widgetSubSlug: null };
                }
            }
            const subs = this._topicSubpages(topic);
            for (let s = 0; s < subs.length; s++) {
                const sub = subs[s];
                const subAliases = sub.alternativeUrls || sub.aliases || [];
                for (let b = 0; b < subAliases.length; b++) {
                    if (self._matchAlias(subAliases[b], wantTopic, wantSubpage)) {
                        return { topicIndex: i, topic: topic, widgetSubSlug: sub.slug };
                    }
                }
            }
        }
        return null;
    },

    _slugifyHelpAnchor: function (text) {
        return String(text == null ? '' : text)
            .replace(/[''`´]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    _ensureHeadingAnchors: function (containerEl) {
        if (!containerEl) return;
        const used = {};
        const existing = containerEl.querySelectorAll('[id]');
        for (let i = 0; i < existing.length; i++) {
            const id = existing[i].id;
            if (id) used[id] = true;
        }
        const headings = containerEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (let h = 0; h < headings.length; h++) {
            const heading = headings[h];
            if (heading.id) continue;
            const slug = this._slugifyHelpAnchor(heading.textContent);
            if (!slug) continue;
            let id = slug;
            let n = 1;
            while (used[id]) {
                n += 1;
                id = slug + '-' + n;
            }
            heading.id = id;
            used[id] = true;
        }
    },

    _findHelpAnchorElement: function (anchorId) {
        const root = document.getElementById('help-content-body');
        if (!root || !anchorId) return null;
        const decoded = this._decodeHelpUriPart(String(anchorId).replace(/^#/, '')).trim();
        if (!decoded) return null;

        const nodes = root.querySelectorAll('[id]');
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === decoded) return nodes[i];
        }
        if (decoded.indexOf('help-') !== 0) {
            const prefixed = 'help-' + decoded;
            for (let j = 0; j < nodes.length; j++) {
                if (nodes[j].id === prefixed) return nodes[j];
            }
        }

        const wantSlug = this._slugifyHelpAnchor(decoded);
        if (wantSlug) {
            const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');
            for (let k = 0; k < headings.length; k++) {
                const heading = headings[k];
                const headingSlug = this._slugifyHelpAnchor(heading.textContent);
                if (headingSlug === wantSlug) return heading;
                if (heading.id && this._slugifyHelpAnchor(heading.id) === wantSlug) return heading;
            }
            const stepMatch = wantSlug.match(/^step-(\d+)(?:-|$)/);
            if (stepMatch) {
                const stepId = 'help-step-' + stepMatch[1];
                for (let m = 0; m < nodes.length; m++) {
                    if (nodes[m].id === stepId) return nodes[m];
                }
                for (let n = 0; n < headings.length; n++) {
                    const hs = this._slugifyHelpAnchor(headings[n].textContent);
                    if (hs === 'step-' + stepMatch[1] || hs.indexOf('step-' + stepMatch[1] + '-') === 0) {
                        return headings[n];
                    }
                }
            }
        }
        return null;
    },

    _bindAppHelpUrlClicks: function () {
        if (this._appHelpUrlClicksBound) return;
        if (typeof document === 'undefined' || !document.addEventListener) return;
        this._appHelpUrlClicksBound = true;
        const self = this;
        document.addEventListener('click', function (e) {
            if (!e || e.button !== 0) return;
            const target = e.target;
            if (!target || typeof target.closest !== 'function') return;
            const a = target.closest('a[href]');
            if (!a) return;
            const href = a.getAttribute('href');
            if (!href || !/^help:\/\//i.test(String(href).trim())) return;
            e.preventDefault();
            e.stopPropagation();
            self.openHelpUrl(href);
        }, true);
    },

    parseHelpUrl: function (urlStr) {
        const raw = String(urlStr == null ? '' : urlStr).trim();
        const match = raw.match(/^help:\/\/(.*)$/i);
        if (!match) return null;
        const url = match[1];
        const hashIdx = url.indexOf('#');
        let anchor = null;
        let path = url;
        if (hashIdx >= 0) {
            anchor = this._decodeHelpUriPart(url.slice(hashIdx + 1));
            if (!anchor) anchor = null;
            path = url.slice(0, hashIdx);
        }
        path = this._decodeHelpUriPart(path).replace(/^\/+/, '');
        if (!path) return null;
        const slashIdx = path.indexOf('/');
        let topic = path;
        let subpage = null;
        if (slashIdx >= 0) {
            topic = path.slice(0, slashIdx);
            subpage = this._decodeHelpUriPart(path.slice(slashIdx + 1));
            if (!subpage) subpage = null;
        }
        if (!topic) return null;
        return { topic: topic, subpage: subpage, anchor: anchor };
    },

    openHelpUrl: function (urlStr) {
        const parsed = this.parseHelpUrl(urlStr);
        if (!parsed || !parsed.topic) return false;
        this.goToPage(parsed.topic, parsed.subpage, parsed.anchor);
        return true;
    }
};

window.HelpSystem = HelpSystem;
window.helpLink = (target) => `HelpSystem.goToPage('${target}')`;
HelpSystem._ensurePurifyHelpUriHook();
HelpSystem._bindAppHelpUrlClicks();