/**
 * Text Widget Markdown Studio: Blocks, Raw Markdown, and Visual page editing.
 * Split is a header toggle that keeps Blocks or Raw beside the formatted page.
 * Depends: Editor, Dashboard, MarkdownTextOps, MarkdownBlockCodec, CustomDialog,
 *          EditorColorPicker, EditorReorder, PointerDrag, ImageGallery, DataDriverRegistry.
 *
 * Note: Dashboard, Editor, CustomDialog, HelpSystem are declared with `const` at the top of
 * their own script files, so they are NOT on `window`. Reference them as bare identifiers.
 */
(function (global) {
    'use strict';

    var LS_BOUNDS = 'dashboardstudio-text-full-editor-bounds-v2';
    var LS_MODE = 'dashboardstudio-text-full-editor-mode';
    var LS_SPLIT = 'dashboardstudio-text-full-editor-split';
    var LS_SPLIT_RATIO = 'dashboardstudio-text-full-editor-split-ratio';
    var LS_SPLIT_SOURCE = 'dashboardstudio-text-full-editor-split-source';
    var LS_LIVE_PREVIEW = 'dashboardstudio-text-full-editor-live-preview';
    var MAX_UNDO = 60;
    var TYPING_CHECKPOINT_MS = 500;

    var BLOCK_GROUPS = [
        {
            title: 'Text & Structure',
            items: [
                { type: 'heading', label: 'Heading', icon: 'ph-text-h' },
                { type: 'text', label: 'Text', icon: 'ph-text-align-left' },
                { type: 'list', label: 'List', icon: 'ph-list-bullets' },
                { type: 'callout', label: 'Callout', icon: 'ph-flag-banner' },
                { type: 'quote', label: 'Quote', icon: 'ph-quotes' },
                { type: 'code', label: 'Code', icon: 'ph-file-code' },
                { type: 'rule', label: 'Divider', icon: 'ph-minus' }
            ]
        },
        {
            title: 'Tables, Media & Data',
            items: [
                { type: 'table', label: 'Table', icon: 'ph-table' },
                { type: 'icon', label: 'Icon', icon: 'ph-star' },
                { type: 'image', label: 'Image', icon: 'ph-image' },
                { type: 'topic', label: 'Topic / Formula', icon: 'ph-brackets-curly' },
                { type: 'link', label: 'Link', icon: 'ph-link' }
            ]
        }
    ];

    var BLOCK_META = {};
    BLOCK_GROUPS.forEach(function (g) {
        g.items.forEach(function (it) {
            BLOCK_META[it.type] = it;
        });
    });

    var CHILD_META = {
        text: { type: 'text', label: 'Text', icon: 'ph-text-align-left' },
        icon: { type: 'icon', label: 'Icon', icon: 'ph-star' },
        topic: { type: 'topic', label: 'Topic / Formula', icon: 'ph-brackets-curly' },
        image: { type: 'image', label: 'Image', icon: 'ph-image' },
        heading: { type: 'heading', label: 'Heading', icon: 'ph-text-h' },
        link: { type: 'link', label: 'Link', icon: 'ph-link' },
        code: { type: 'code', label: 'Code', icon: 'ph-code' },
        callout: { type: 'callout', label: 'Callout', icon: 'ph-flag-banner' }
    };

    var NESTABLE_IN_CELL = {
        text: true, heading: true, callout: true, icon: true,
        image: true, topic: true, link: true, code: true
    };
    var NESTABLE_IN_CALLOUT = {
        text: true, icon: true, image: true, topic: true,
        link: true, code: true
    };

    function canNestBlockType(blockType, containerKind) {
        var t = String(blockType || '');
        if (containerKind === 'callout') return !!NESTABLE_IN_CALLOUT[t];
        if (containerKind === 'cell' || containerKind === 'cell-active') return !!NESTABLE_IN_CELL[t];
        return false;
    }

    function createChildFromPaletteType(paletteType, inCallout) {
        var t = String(paletteType || 'text');
        if (!canNestBlockType(t, inCallout ? 'callout' : 'cell')) return null;
        if (CHILD_META[t]) return MarkdownBlockCodec.createDefaultChildBlock(t);
        return MarkdownBlockCodec.createDefaultChildBlock('text');
    }

    function convertBlockToChildBlock(b, containerKind) {
        if (!b || !canNestBlockType(b.type, containerKind)) return null;
        if (b.type === 'callout') ensureCalloutChildren(b);
        var ch = MarkdownBlockCodec.createDefaultChildBlock(b.type);
        Object.keys(b).forEach(function (k) {
            if (k === 'id' || k === 'type') return;
            if (k === 'children' && Array.isArray(b.children)) {
                ch.children = b.children.map(function (sub) { return Object.assign({}, sub); });
            } else if (b[k] !== undefined) {
                ch[k] = b[k];
            }
        });
        ch.newLine = (b.type === 'heading');
        return ch;
    }

    function summarizeChildItem(ch) {
        if (!ch || !ch.type) return '';
        switch (ch.type) {
            case 'heading': return ('H' + (ch.level || '2') + ': ' + (ch.text || '')).trim();
            case 'icon': return (ch.name || 'ph-star') + (ch.label ? (' · ' + ch.label) : '');
            case 'image': return ch.alt || ch.url || 'Image';
            case 'topic': return ch.mode === 'formula' ? ('=' + (ch.formula || '')) : (ch.path || 'topic');
            case 'link': return ch.label || ch.url || 'Link';
            case 'code': return ch.code || 'code';
            case 'callout':
                var inner = Array.isArray(ch.children) && ch.children.length
                    ? ch.children.map(function (sc) { return sc.text || sc.name || sc.path || ''; }).filter(Boolean).join(' ')
                    : '';
                return inner || ('Block ' + (ch.variant || '1'));
            case 'text':
            default:
                return String(ch.text || '').replace(/\n/g, ' ').trim() || 'Empty text';
        }
    }

    function ensureCellChildren(cell) {
        if (!cell) return [];
        if (Array.isArray(cell.children)) return cell.children;
        // Migrate legacy flat cell object on demand
        var md = MarkdownBlockCodec.cellToMarkdown(cell);
        var migrated = MarkdownBlockCodec.parseCellFromMarkdown(md);
        cell.background = migrated.background || cell.background || '';
        cell.children = migrated.children || [];
        return cell.children;
    }

    function ensureCalloutChildren(calloutBlock) {
        if (!calloutBlock) return [];
        if (Array.isArray(calloutBlock.children)) return calloutBlock.children;
        var out = [];
        if (calloutBlock.icon) out.push(MarkdownBlockCodec.createDefaultChildBlock('icon', calloutBlock.icon));
        if (calloutBlock.text) {
            var ch = MarkdownBlockCodec.createDefaultChildBlock('text', calloutBlock.text);
            ch.bold = !!calloutBlock.bold;
            ch.italic = !!calloutBlock.italic;
            ch.strike = !!calloutBlock.strike;
            out.push(ch);
        }
        calloutBlock.children = out;
        return out;
    }

    var FORMULA_TEMPLATES = [
        { label: 'Threshold If / Else', expr: 'if({{homey/temp}} > 20, "Hot", "Cold")' },
        { label: 'Dynamic Icon (On / Off)', expr: 'if({{device/state}} == "on", ":ph-flame:", ":ph-snowflake:")' },
        { label: 'Round Number (1 decimal)', expr: 'round({{homey/temp}}, 1)' },
        { label: 'Text Contains (Any Case)', expr: 'if(containsanycase({{device/state}}, "on"), "Active", "Standby")' },
        { label: 'Countdown Timer (10 min)', expr: 'countdown("10m", "timer")' }
    ];

    var STARTER_TEMPLATES = [
        {
            label: 'Status Table',
            icon: 'ph-table',
            md: '## :ph-house: Living Room\n\n| Metric | Value |\n| :--- | ---: |\n| Temperature | [cell @accentSoft]{{homey/temp}} |\n| Humidity | 54% |'
        },
        {
            label: 'Room Summary',
            icon: 'ph-article',
            md: '# :ph-sun: Room Overview\n\nEverything is running normally.\n\n[block1::ph-check-circle: All sensors online]'
        },
        {
            label: 'Alert Banner',
            icon: 'ph-warning',
            md: '[blink][block @danger::ph-warning: Attention required][/blink]'
        },
        {
            label: 'Blank Text Block',
            icon: 'ph-text-align-left',
            md: 'New text paragraph'
        }
    ];

    var WEIGHT_OPTIONS = [
        { value: 'default', text: 'Widget Default' },
        { value: 'regular', text: 'Regular' },
        { value: 'thin', text: 'Thin' },
        { value: 'light', text: 'Light' },
        { value: 'bold', text: 'Bold' },
        { value: 'fill', text: 'Fill' },
        { value: 'duotone', text: 'Duotone' }
    ];

    function el(tag, className, textContent) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (textContent !== undefined && textContent !== null) node.textContent = String(textContent);
        return node;
    }

    function escHtml(val) {
        return String(val == null ? '' : val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function cloneData(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function resolveCssColor(spec) {
        if (!spec) return '';
        if (typeof BaseWidget !== 'undefined' && typeof BaseWidget.resolveCssColor === 'function') {
            return BaseWidget.resolveCssColor(spec);
        }
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.resolveThemeColorValue === 'function') {
            return Dashboard.resolveThemeColorValue(spec);
        }
        return spec;
    }

    function getTargetTextWidget() {
        if (typeof TextWidget !== 'undefined' && typeof TextWidget._selectedTextWidget === 'function') {
            return TextWidget._selectedTextWidget();
        }
        if (typeof Dashboard !== 'undefined' && Dashboard.widgets && typeof Editor !== 'undefined' && Editor.currentId) {
            var w = Dashboard.widgets[Editor.currentId];
            if (w && typeof TextWidget !== 'undefined' && w.constructor === TextWidget) return w;
        }
        return null;
    }

    function isHomeyEnv() {
        if (typeof DataDriverRegistry === 'undefined') return false;
        var t = DataDriverRegistry.getType();
        return t === 'homey' || t === 'homeassistant';
    }

    function readPref(key, fallback) {
        try {
            var v = localStorage.getItem(key);
            return v != null ? v : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function savePref(key, val) {
        try {
            localStorage.setItem(key, String(val));
        } catch (e) { /* ignore */ }
    }

    function buildHelpTargetOptions() {
        var opts = [];
        var topics = (typeof HelpSystem !== 'undefined' && Array.isArray(HelpSystem.helpTopics))
            ? HelpSystem.helpTopics
            : (Array.isArray(global.HELP_TOPICS) ? global.HELP_TOPICS : null);
        if (topics && topics.length) {
            topics.forEach(function (t) {
                if (!t || !t.title) return;
                var encTitle = encodeURIComponent(t.title);
                opts.push({ value: encTitle, text: t.title });
                if (Array.isArray(t.widgetSubpages)) {
                    t.widgetSubpages.forEach(function (sub) {
                        if (!sub || !sub.slug) return;
                        opts.push({
                            value: encTitle + '/' + sub.slug,
                            text: t.title + ' / ' + (sub.title || sub.slug)
                        });
                    });
                }
            });
        }
        if (!opts.length) {
            opts = [
                { value: 'Widgets/text', text: 'Widgets / Text' },
                { value: 'Widgets/switch', text: 'Widgets / Switch & Button' },
                { value: 'Widgets/gauge', text: 'Widgets / Gauge' },
                { value: 'Data%20Types%20%26%20Formats/markdown-formatting', text: 'Markdown Formatting Reference' }
            ];
        }
        return opts;
    }

    function getLiveTopicDisplay(topicPath) {
        if (!topicPath || typeof Dashboard === 'undefined' || !Dashboard.liveData) return null;
        if (Object.prototype.hasOwnProperty.call(Dashboard.liveData, topicPath)) {
            var v = Dashboard.liveData[topicPath];
            return v === undefined || v === null ? '' : String(v);
        }
        if (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function') {
            var alt = HomeyTopicAlias.aliasOf(topicPath);
            if (alt && Object.prototype.hasOwnProperty.call(Dashboard.liveData, alt)) {
                var v2 = Dashboard.liveData[alt];
                return v2 === undefined || v2 === null ? '' : String(v2);
            }
        }
        return null;
    }

    function evaluateFormulaPreview(expr) {
        if (!expr) return { ok: false, text: '' };
        if (typeof FormulaEngine === 'undefined' || typeof FormulaEngine.evaluate !== 'function') {
            return { ok: false, text: 'FormulaEngine unavailable' };
        }
        var w = getTargetTextWidget();
        var resolveFn = function (path) {
            if (w && typeof w._tryResolveMarkdownDataPath === 'function') {
                var hit = w._tryResolveMarkdownDataPath(path);
                if (!hit || hit.failed) return { failed: true };
                return typeof FormulaEngine.coerceValue === 'function'
                    ? FormulaEngine.coerceValue(hit.v)
                    : { v: hit.v, type: typeof hit.v === 'number' ? 'number' : 'string' };
            }
            var raw = getLiveTopicDisplay(path);
            if (raw === null) return { failed: true };
            return typeof FormulaEngine.coerceValue === 'function'
                ? FormulaEngine.coerceValue(raw)
                : { v: raw, type: 'string' };
        };
        try {
            var res = FormulaEngine.evaluate(expr, undefined, resolveFn, {
                disallowValue: true,
                countdownContext: (w ? w.id : 'tfe') + '::__preview__'
            });
            if (!res || res.failed) return { ok: false, text: 'Missing topic or invalid formula' };
            return { ok: true, text: res.value == null ? '' : String(res.value) };
        } catch (err) {
            return { ok: false, text: err && err.message ? err.message : 'Formula error' };
        }
    }

    var MODE_TIPS = {
        blocks: {
            title: 'Blocks',
            body: 'Build the page from ready-made pieces.\n• Palette: Drag a heading, table, image, icon, or topic onto the canvas.\n• Inspector: The panel on the right edits the block you select.'
        },
        raw: {
            title: 'Raw',
            body: 'Edit the Markdown source as text.\n• Source: Headings, tables, icons, and topic tokens stay visible as Markdown.\n• Ribbon: Bold, lists, links, and tables insert the matching syntax.'
        },
        preview: {
            title: 'Visual',
            body: 'Edit the page the way it looks on the dashboard.\n• Type: Click the page and write. Headings, lists, and tables stay formatted.\n• Click to change: Icons, images, links, and topic chips open a small editor.'
        },
        split: {
            title: 'Split',
            body: 'Show the formatted page beside Blocks or Raw.\n• Side by side: Blocks or Raw stay on the left, the page on the right. Drag the divider to change the width. A finger works too.\n• Visual: This button stays off, because Visual already fills the window.'
        }
    };

    function applyRichTip(btn, tip) {
        if (!btn || !tip) return;
        btn.setAttribute('data-tip-place', 'above');
        btn.setAttribute('data-tip-title', tip.title);
        btn.setAttribute('data-tip-body', tip.body);
    }

    var TextFullEditor = {
        _root: null,
        _backdropEl: null,
        _opts: null,
        _mode: 'blocks',
        _splitOn: false,
        _splitRatio: 0.5,
        _liveDataPreview: true,
        _isMaximized: false,
        _preMaxBounds: null,

        _markdown: '',
        _blocks: [],
        _selectedBlock: 0,
        _cellRow: 0,
        _cellCol: 0,
        _selectedChildIndex: -1,

        _undo: [],
        _redo: [],
        _typingTimer: null,
        _lastSnapshotKey: '',
        _savedWysiwygRange: null,
        _wysiwygActiveTableInfo: null,
        _isWysiwygTyping: false,
        _wysiwygDebounceTimer: null,

        // DOM references
        _modeBtns: null,
        _splitBtn: null,
        _splitHandle: null,
        _undoBtn: null,
        _redoBtn: null,
        _liveBtn: null,
        _maxBtn: null,
        _toolbarEl: null,
        _tableCtxBar: null,
        _bodyGrid: null,
        _leftPane: null,
        _centerPane: null,
        _blocksStage: null,
        _blockCanvasEl: null,
        _rawStage: null,
        _taWrap: null,
        _textarea: null,
        _previewStage: null,
        _previewRootEl: null,
        _previewCardEl: null,
        _rightPane: null,
        _inspectorEl: null,
        _findBar: null,
        _statusTextEl: null,
        _statsEl: null,
        _fileInput: null,

        // Pickers, reorder controllers & handlers
        _textColorPicker: null,
        _textColorMount: null,
        _ctxCellColorPicker: null,
        _ctxCellColorMount: null,
        _colAlignBtns: null,
        _ctxColAlignBtns: null,
        _blinkMainBtn: null,
        _blinkCaretBtn: null,
        _blinkGroup: null,
        _inspectorColorPickers: [],
        _inspectorReorders: [],
        _canvasReorder: null,
        _activePopover: null,
        _activePopoverCleanup: null,
        _mainInputListener: null,
        _boundCursorHandlers: null,
        _boundKeyHandler: null,
        _drag: null,
        _resize: null,
        _splitDrag: null,
        _boundSplitResize: null,
        _paletteDragType: null,
        _statusTimer: null,

        open: function (opts) {
            if (!opts || typeof opts.getText !== 'function' || typeof opts.setText !== 'function') return;
            if (this._root) this.close();

            this._opts = opts;
            var savedMode = readPref(LS_MODE, 'blocks');
            var legacySplitSource = readPref(LS_SPLIT_SOURCE, 'blocks');
            if (legacySplitSource !== 'raw') legacySplitSource = 'blocks';
            if (savedMode === 'split') {
                this._mode = legacySplitSource;
                this._splitOn = true;
            } else if (savedMode === 'blocks' || savedMode === 'raw' || savedMode === 'preview') {
                this._mode = savedMode;
                this._splitOn = readPref(LS_SPLIT, '0') === '1';
            } else {
                this._mode = 'blocks';
                this._splitOn = false;
            }
            savePref(LS_MODE, this._mode);
            savePref(LS_SPLIT, this._splitOn ? '1' : '0');
            this._splitRatio = this._readSplitRatio();
            this._liveDataPreview = readPref(LS_LIVE_PREVIEW, '1') !== '0';
            this._isMaximized = false;
            this._preMaxBounds = null;

            if (typeof Editor !== 'undefined' && typeof Editor.setFullTextEditorActive === 'function') {
                Editor.setFullTextEditorActive(true);
            }

            this._undo = [];
            this._redo = [];
            this._inspectorColorPickers = [];
            this._inspectorReorders = [];

            var start = opts.getText();
            this._markdown = start == null ? '' : String(start);
            this._blocks = MarkdownBlockCodec.parseMarkdownToBlocks(this._markdown);
            this._selectedBlock = this._blocks.length ? 0 : -1;
            this._cellRow = 0;
            this._cellCol = 0;
            this._selectedChildIndex = -1;
            this._savedWysiwygRange = null;
            this._wysiwygActiveTableInfo = null;
            this._isWysiwygTyping = false;

            this._buildUi();
            this._textarea.value = this._markdown;
            this._lastSnapshotKey = this._snapshotSignature(this._captureSnapshot());

            this._applyModeLayout();
            this._wireMainInputSync();
            this._updateUndoRedoButtons();
            this._updateStatusBar();
            this._updateRawToolbarState();
        },

        close: function () {
            var onClose = this._opts && typeof this._opts.onClose === 'function' ? this._opts.onClose : null;

            if (this._mainInputListener && this._opts && this._opts.mainTextarea) {
                try {
                    this._opts.mainTextarea.removeEventListener('input', this._mainInputListener);
                } catch (e) { /* ignore */ }
            }
            this._mainInputListener = null;

            if (this._typingTimer) {
                clearTimeout(this._typingTimer);
                this._typingTimer = null;
            }
            if (this._wysiwygDebounceTimer) {
                clearTimeout(this._wysiwygDebounceTimer);
                this._wysiwygDebounceTimer = null;
            }
            if (this._statusTimer) {
                clearTimeout(this._statusTimer);
                this._statusTimer = null;
            }

            if (this._root && !this._isMaximized) {
                this._saveBounds(this._root);
            }

            this._closeActivePopover();
            this._cleanupInspectorResources();
            this._destroyCanvasReorder();
            this._teardownRawCursorListeners();

            if (this._textColorPicker && this._textColorPicker.destroy) this._textColorPicker.destroy();
            if (this._ctxCellColorPicker && this._ctxCellColorPicker.destroy) this._ctxCellColorPicker.destroy();
            this._textColorPicker = null;
            this._ctxCellColorPicker = null;

            if (this._boundKeyHandler) {
                document.removeEventListener('keydown', this._boundKeyHandler, true);
                this._boundKeyHandler = null;
            }
            if (this._boundSplitResize) {
                window.removeEventListener('resize', this._boundSplitResize);
                this._boundSplitResize = null;
            }
            document.documentElement.style.cursor = '';

            if (this._root && typeof Editor !== 'undefined' && typeof Editor._cleanupSubtreeDropdowns === 'function') {
                Editor._cleanupSubtreeDropdowns(this._root);
            }

            if (this._backdropEl && this._backdropEl.parentNode) {
                this._backdropEl.parentNode.removeChild(this._backdropEl);
            }
            if (this._root && this._root.parentNode) {
                this._root.parentNode.removeChild(this._root);
            }

            this._backdropEl = null;
            this._root = null;
            this._textarea = null;
            this._opts = null;
            this._drag = null;
            this._resize = null;
            this._splitDrag = null;
            this._splitHandle = null;

            if (typeof Editor !== 'undefined') {
                if (typeof Editor.setFullTextEditorActive === 'function') {
                    Editor.setFullTextEditorActive(false);
                }
                if (typeof Editor.flushPendingTextPreview === 'function') {
                    Editor.flushPendingTextPreview();
                }
            }
            if (onClose) {
                try { onClose(); } catch (e2) { /* ignore */ }
            }
        },

        isOpen: function () {
            return this._root !== null;
        },

        // =====================================================================
        // Bounds & Maximize
        // =====================================================================

        _readBounds: function () {
            var maxW = Math.max(460, window.innerWidth - 32);
            var maxH = Math.max(360, window.innerHeight - 32);
            var defW = Math.min(1080, maxW);
            var defH = Math.min(720, maxH);
            var def = {
                left: Math.max(16, Math.round((window.innerWidth - defW) / 2)),
                top: Math.max(16, Math.round((window.innerHeight - defH) / 2)),
                w: defW,
                h: defH
            };
            try {
                var raw = localStorage.getItem(LS_BOUNDS);
                if (!raw) return def;
                var o = JSON.parse(raw);
                if (typeof o.w === 'number' && o.w >= 460) def.w = Math.min(o.w, maxW);
                if (typeof o.h === 'number' && o.h >= 360) def.h = Math.min(o.h, maxH);
                if (typeof o.left === 'number') def.left = Math.max(8, Math.min(o.left, window.innerWidth - 120));
                if (typeof o.top === 'number') def.top = Math.max(8, Math.min(o.top, window.innerHeight - 80));
            } catch (e) { /* use def */ }
            return def;
        },

        _saveBounds: function (elNode) {
            if (!elNode || this._isMaximized) return;
            try {
                var r = elNode.getBoundingClientRect();
                localStorage.setItem(LS_BOUNDS, JSON.stringify({
                    left: Math.round(r.left),
                    top: Math.round(r.top),
                    w: Math.round(r.width),
                    h: Math.round(r.height)
                }));
            } catch (e) { /* ignore */ }
        },

        _toggleMaximize: function () {
            if (!this._root) return;
            if (!this._isMaximized) {
                var r = this._root.getBoundingClientRect();
                this._preMaxBounds = { left: r.left, top: r.top, w: r.width, h: r.height };
                this._isMaximized = true;
                this._root.style.left = '12px';
                this._root.style.top = '12px';
                this._root.style.width = (window.innerWidth - 24) + 'px';
                this._root.style.height = (window.innerHeight - 24) + 'px';
            } else {
                this._isMaximized = false;
                var b = this._preMaxBounds || this._readBounds();
                this._root.style.left = b.left + 'px';
                this._root.style.top = b.top + 'px';
                this._root.style.width = b.w + 'px';
                this._root.style.height = b.h + 'px';
            }
            this._root.classList.toggle('is-maximized', this._isMaximized);
            if (this._maxBtn) {
                this._maxBtn.innerHTML = '<i class="ph-bold ' + (this._isMaximized ? 'ph-corners-in' : 'ph-corners-out') + '"></i>';
                this._maxBtn.title = this._isMaximized ? 'Restore window size' : 'Maximize window';
            }
            this._updateCompactBreakpoint();
        },

        _updateCompactBreakpoint: function () {
            if (!this._root) return;
            var w = this._root.getBoundingClientRect().width || 0;
            var threshold = (this._mode === 'blocks' && this._isSplitShown()) ? 1040 : 820;
            this._root.classList.toggle('tfe-compact-palette', w > 0 && w < threshold);
            this._applySplitWidth();
        },

        // =====================================================================
        // Window Chrome Construction
        // =====================================================================

        _buildUi: function () {
            var self = this;
            var b = this._readBounds();
            this._backdropEl = el('div', 'text-full-editor-backdrop');
            this._backdropEl.setAttribute('aria-hidden', 'true');
            this._backdropEl.onclick = function () { self.close(); };
            document.body.appendChild(this._backdropEl);

            this._root = el('div', 'text-full-editor tfe-studio');
            this._root.setAttribute('role', 'dialog');
            this._root.setAttribute('aria-label', 'Markdown Studio');
            this._root.style.left = b.left + 'px';
            this._root.style.top = b.top + 'px';
            this._root.style.width = b.w + 'px';
            this._root.style.height = b.h + 'px';

            var header = this._buildHeader();
            this._root.appendChild(header);

            this._toolbarEl = this._buildToolbar();
            this._root.appendChild(this._toolbarEl);

            this._tableCtxBar = this._buildTableContextBar();
            this._root.appendChild(this._tableCtxBar);

            this._buildBody();
            this._root.appendChild(this._bodyGrid);

            var findWrap = el('div', 'text-full-editor-find');
            this._findBar = { wrap: findWrap, findInp: null, repInp: null, caseEl: null };
            this._buildFindBar(findWrap);
            this._root.appendChild(findWrap);

            this._root.appendChild(this._buildFooter());

            var resize = el('div', 'text-full-editor-resize');
            resize.setAttribute('aria-hidden', 'true');
            this._root.appendChild(resize);

            this._fileInput = el('input');
            this._fileInput.type = 'file';
            this._fileInput.accept = '.md,.txt,.markdown,.json,application/json,text/markdown,text/plain';
            this._fileInput.style.display = 'none';
            this._fileInput.addEventListener('change', function (e) {
                var file = e.target.files && e.target.files[0];
                e.target.value = '';
                if (file) void self._importFile(file);
            });
            this._root.appendChild(this._fileInput);

            this._bindDragHeader(header);
            this._bindResize(resize);
            this._bindTaInput();
            this._bindGlobalKeyboard();

            document.body.appendChild(this._root);
            this._updateCompactBreakpoint();
            var selfSplit = this;
            this._boundSplitResize = function () {
                if (!selfSplit._root || selfSplit._splitDrag) return;
                selfSplit._applySplitWidth();
            };
            window.addEventListener('resize', this._boundSplitResize);
        },

        _buildHeader: function () {
            var self = this;
            var header = el('div', 'text-full-editor-header tfe-header');

            var titleWrap = el('div', 'ds-dialog-title tfe-header-title');
            var w = getTargetTextWidget();
            var wName = (w && w.overrides && w.overrides.metaName) ? w.overrides.metaName : (w ? 'Text Widget' : '');
            titleWrap.innerHTML = '<i class="ph-bold ph-text-aa ds-dialog-title-icon"></i><span>Markdown Studio</span>'
                + (wName ? ('<span class="tfe-widget-chip">' + escHtml(wName) + '</span>') : '');

            var modeCluster = el('div', 'tfe-mode-cluster');
            var tabs = el('div', 'ds-trans-segmented tfe-mode-tabs');
            tabs.setAttribute('role', 'tablist');
            tabs.setAttribute('aria-label', 'Editor view');

            var modeDefs = [
                { id: 'blocks', label: 'Blocks', icon: 'ph-squares-four' },
                { id: 'raw', label: 'Raw', icon: 'ph-code' },
                { id: 'preview', label: 'Visual', icon: 'ph-pencil-simple-line' }
            ];
            this._modeBtns = {};
            modeDefs.forEach(function (def) {
                var btn = el('button', 'ds-trans-tab-btn tfe-mode-btn');
                btn.type = 'button';
                btn.dataset.mode = def.id;
                btn.setAttribute('role', 'tab');
                btn.innerHTML = '<i class="ph-bold ' + def.icon + '"></i><span>' + def.label + '</span>';
                applyRichTip(btn, MODE_TIPS[def.id]);
                btn.addEventListener('click', function () {
                    self._setMode(def.id);
                });
                tabs.appendChild(btn);
                self._modeBtns[def.id] = btn;
            });

            this._splitBtn = el('button', 'tfe-hdr-pill-btn tfe-split-toggle');
            this._splitBtn.type = 'button';
            this._splitBtn.innerHTML = '<i class="ph-bold ph-columns"></i><span>Split</span>';
            applyRichTip(this._splitBtn, MODE_TIPS.split);
            this._splitBtn.addEventListener('click', function () {
                self._toggleSplit();
            });
            modeCluster.appendChild(tabs);
            modeCluster.appendChild(this._splitBtn);

            var rightGroup = el('div', 'tfe-header-actions');

            this._undoBtn = el('button', 'tfe-hdr-icon-btn');
            this._undoBtn.type = 'button';
            this._undoBtn.title = 'Undo (Ctrl+Z)';
            this._undoBtn.innerHTML = '<i class="ph-bold ph-arrow-counter-clockwise"></i>';
            this._undoBtn.addEventListener('click', function () { self._doUndo(); });

            this._redoBtn = el('button', 'tfe-hdr-icon-btn');
            this._redoBtn.type = 'button';
            this._redoBtn.title = 'Redo (Ctrl+Y)';
            this._redoBtn.innerHTML = '<i class="ph-bold ph-arrow-clockwise"></i>';
            this._redoBtn.addEventListener('click', function () { self._doRedo(); });

            this._liveBtn = el('button', 'tfe-hdr-pill-btn');
            this._liveBtn.type = 'button';
            this._liveBtn.title = 'Toggle live {{topic}} evaluation in block & preview panes';
            this._liveBtn.innerHTML = '<i class="ph-bold ph-broadcast"></i><span>Live Data</span>';
            this._liveBtn.addEventListener('click', function () {
                self._liveDataPreview = !self._liveDataPreview;
                savePref(LS_LIVE_PREVIEW, self._liveDataPreview ? '1' : '0');
                self._syncLiveBtnState();
                if (!self._blocksStage.hidden) self._renderBlockCanvas();
                self._refreshLivePreviews();
                self._setStatus(self._liveDataPreview ? 'Live topic values enabled.' : 'Showing raw {{topic}} tokens.');
            });
            this._syncLiveBtnState();

            var helpWrap = el('div', 'text-full-editor-help-links');
            if (typeof HelpSystem !== 'undefined' && typeof HelpSystem.createEditorHelpLink === 'function') {
                var hl = (this._opts && this._opts.helpLabelLink) ? this._opts.helpLabelLink : null;
                helpWrap.appendChild(HelpSystem.createEditorHelpLink({
                    linkText: 'Syntax',
                    linkClass: 'ds-help-link',
                    iconPh: 'ph-book-open-text',
                    topic: (hl && hl.topic) ? hl.topic : 'Data Types & Formats',
                    widgetSub: (hl && hl.widgetSub) ? hl.widgetSub : 'markdown-formatting',
                    anchor: (hl && hl.anchor) ? hl.anchor : undefined
                }));
                helpWrap.appendChild(HelpSystem.createEditorHelpLink({
                    linkText: 'Shortcuts',
                    linkClass: 'ds-help-link',
                    iconPh: 'ph-keyboard',
                    topic: 'Widgets',
                    widgetSub: 'text',
                    anchor: 'help-text-full-editor-kbd'
                }));
            }

            this._maxBtn = el('button', 'tfe-hdr-icon-btn');
            this._maxBtn.type = 'button';
            this._maxBtn.title = 'Maximize window';
            this._maxBtn.innerHTML = '<i class="ph-bold ph-corners-out"></i>';
            this._maxBtn.addEventListener('click', function () { self._toggleMaximize(); });

            var closeBtn = el('button', 'ds-dialog-close');
            closeBtn.type = 'button';
            closeBtn.setAttribute('aria-label', 'Close');
            closeBtn.title = 'Close (Esc)';
            closeBtn.innerHTML = '<i class="ph-bold ph-x"></i>';
            closeBtn.onclick = function () { self.close(); };

            rightGroup.appendChild(this._undoBtn);
            rightGroup.appendChild(this._redoBtn);
            rightGroup.appendChild(this._liveBtn);
            if (helpWrap.childNodes.length) rightGroup.appendChild(helpWrap);
            rightGroup.appendChild(this._maxBtn);
            rightGroup.appendChild(closeBtn);

            header.appendChild(titleWrap);
            header.appendChild(modeCluster);
            header.appendChild(rightGroup);
            return header;
        },

        _syncLiveBtnState: function () {
            if (!this._liveBtn) return;
            this._liveBtn.classList.toggle('is-active', this._liveDataPreview);
            this._liveBtn.setAttribute('aria-pressed', this._liveDataPreview ? 'true' : 'false');
        },

        // =====================================================================
        // Shared Raw / Visual Formatting Ribbon & Contextual Table Bar
        // =====================================================================

        _buildToolbar: function () {
            var self = this;
            var tool = el('div', 'text-full-editor-toolbar tfe-raw-toolbar');

            var row1 = el('div', 'text-full-editor-toolbar-row');
            this._addBtn(row1, 'Bold (Ctrl+B)', 'ph-text-b', function () { self._dispatchInlineFormat('bold'); });
            this._addBtn(row1, 'Italic (Ctrl+I)', 'ph-text-italic', function () { self._dispatchInlineFormat('italic'); });
            this._addBtn(row1, 'Strikethrough', 'ph-text-strikethrough', function () { self._dispatchInlineFormat('strike'); });
            this._addTextColorPicker(row1);
            this._addBlinkSplit(row1);
            this._addSep(row1);
            this._addBtn(row1, 'Heading 1', 'ph-text-h-one', function () { self._dispatchHeading(1); });
            this._addBtn(row1, 'Heading 2', 'ph-text-h-two', function () { self._dispatchHeading(2); });
            this._addBtn(row1, 'Heading 3', 'ph-text-h-three', function () { self._dispatchHeading(3); });
            this._addSep(row1);
            this._addBtn(row1, 'Bullet list', 'ph-list-bullets', function () { self._dispatchLines('bullet'); });
            this._addBtn(row1, 'Numbered list', 'ph-list-numbers', function () { self._dispatchLines('ordered'); });
            this._addBtn(row1, 'Blockquote', 'ph-quotes', function () { self._dispatchLines('quote'); });
            this._addBtn(row1, 'Inline code', 'ph-code', function () { self._dispatchInlineFormat('code'); });
            this._addBtn(row1, 'Code block', 'ph-file-code', function () { self._dispatchLines('codeblock'); });
            this._addBtn(row1, 'Block callout', 'ph-flag-banner', function (btn) { self._openBlockPicker(btn); });
            this._addBtn(row1, 'Horizontal divider', 'ph-minus', function () { self._dispatchHr(); });

            var row2 = el('div', 'text-full-editor-toolbar-row tfe-raw-toolbar-row2');
            var inserters = el('div', 'tfe-toolbar-cluster');
            this._addPillBtn(inserters, 'Table', 'ph-table', 'Insert GFM table', function (btn) { self._openTablePicker(btn); });
            this._addPillBtn(inserters, 'Icon', 'ph-star', 'Insert Phosphor icon with weight, size, and tint', function (btn) { self._openIconInserterPopover(btn); });
            this._addPillBtn(inserters, 'Image', 'ph-image', 'Insert image URL with size and tint', function () { self._insertImageUrl(); });
            if (isHomeyEnv()) {
                this._addPillBtn(inserters, 'Gallery', 'ph-images-square', 'Pick image from Homey Image Gallery', function () { self._openGallery(); });
            }
            this._addPillBtn(inserters, 'Link', 'ph-link', 'Insert web link or help:// documentation link (Ctrl+K)', function (btn) { self._openLinkPopover(btn); });
            this._addPillBtn(inserters, 'Topic / Formula', 'ph-brackets-curly', 'Insert live {{topic}} or {{formula}}', function (btn) { self._openTopicFormulaPopover(btn); });

            var utils = el('div', 'tfe-toolbar-cluster tfe-toolbar-utils');
            var nlBtn = this._addPillBtn(utils, '\\n Toggle', 'ph-arrows-in-line-vertical', 'Convert between multiline markdown and single-line \\n escapes', function () { self._toggleSingleLineNewlines(); });
            nlBtn.classList.add('tfe-raw-only-util');
            this._addPillBtn(utils, 'Copy', 'ph-copy', 'Copy markdown to clipboard', function () { void self._copyMarkdown(); });
            var findBtn = this._addPillBtn(utils, 'Find', 'ph-magnifying-glass', 'Find and replace (Ctrl+F)', function () { self._toggleFind(); });
            findBtn.classList.add('tfe-raw-only-util');

            row2.appendChild(inserters);
            row2.appendChild(utils);

            tool.appendChild(row1);
            tool.appendChild(row2);
            return tool;
        },

        _buildTableContextBar: function () {
            var self = this;
            var bar = el('div', 'tfe-table-ctx-bar');
            bar.hidden = true;

            var tag = el('span', 'tfe-table-ctx-tag');
            tag.innerHTML = '<i class="ph-bold ph-table"></i><span>Table</span>';
            bar.appendChild(tag);

            // Cell color picker
            if (typeof EditorColorPicker !== 'undefined' && typeof EditorColorPicker.attach === 'function') {
                var mount = el('div', 'text-full-editor-cell-color-mount');
                mount.title = 'Table cell background color';
                bar.appendChild(mount);
                this._ctxCellColorMount = mount;
                this._ctxCellColorPicker = EditorColorPicker.attach({
                    mountCard: mount,
                    allowThemeTokens: true,
                    positionMode: 'anchor',
                    zIndex: 10060,
                    triggerMode: 'cell',
                    triggerTitle: 'Table cell background',
                    getRaw: function () { return self._getCellColorRaw(); },
                    setValue: function (val) {
                        self._dispatchTableCellBg(val);
                    },
                    onAfterLocalChange: function () { self._updateRawToolbarState(); },
                    onClear: function () {
                        self._dispatchTableCellBg('');
                    }
                });
            }

            // Alignment group
            var alignGrp = el('div', 'text-full-editor-col-align-group');
            alignGrp.setAttribute('role', 'group');
            alignGrp.setAttribute('aria-label', 'Column alignment');
            var specs = [
                { align: 'default', icon: 'ph-dots-three', label: 'Default alignment (---)' },
                { align: 'left', icon: 'ph-text-align-left', label: 'Left align (:---)' },
                { align: 'center', icon: 'ph-text-align-center', label: 'Center align (:---:)' },
                { align: 'right', icon: 'ph-text-align-right', label: 'Right align (---:)' }
            ];
            this._ctxColAlignBtns = {};
            specs.forEach(function (spec) {
                var b = el('button', 'text-full-editor-tb');
                b.type = 'button';
                b.title = spec.label;
                b.innerHTML = '<i class="ph-bold ' + spec.icon + '"></i>';
                b.addEventListener('click', function (e) {
                    e.preventDefault();
                    self._dispatchTableAlign(spec.align);
                });
                alignGrp.appendChild(b);
                self._ctxColAlignBtns[spec.align] = b;
            });
            bar.appendChild(alignGrp);

            this._addSep(bar);
            this._addCtxBtn(bar, '+ Row', 'Insert row below', function () {
                self._dispatchTableStruct('insertRowBelow');
            });
            this._addCtxBtn(bar, '- Row', 'Delete current table row', function () {
                self._dispatchTableStruct('deleteRow');
            });
            this._addCtxBtn(bar, '+ Col', 'Insert column right', function () {
                self._dispatchTableStruct('insertColRight');
            });
            this._addCtxBtn(bar, '- Col', 'Delete current column', function () {
                self._dispatchTableStruct('deleteCol');
            });
            this._addBtn(bar, 'Move column left', 'ph-arrow-left', function () {
                self._dispatchTableStruct('moveColLeft');
            });
            this._addBtn(bar, 'Move column right', 'ph-arrow-right', function () {
                self._dispatchTableStruct('moveColRight');
            });
            var pipesBtn = this._addCtxBtn(bar, 'Align Pipes', 'Cleanly pad table columns in raw markdown', function () {
                self._applyRawOp(function (t, a, b) { return MarkdownTextOps.formatTableAtOffset(t, a, b); });
                self._setStatus('Table columns aligned.');
            });
            pipesBtn.classList.add('tfe-raw-only-util');

            return bar;
        },

        _addCtxBtn: function (parent, label, title, onClick) {
            var b = el('button', 'tfe-ctx-btn', label);
            b.type = 'button';
            b.title = title;
            b.addEventListener('click', function (e) {
                e.preventDefault();
                onClick(b);
            });
            parent.appendChild(b);
            return b;
        },

        _addSep: function (row) {
            var s = el('span', 'text-full-editor-tb-sep');
            s.setAttribute('aria-hidden', 'true');
            row.appendChild(s);
        },

        _addBtn: function (row, label, phIcon, onClick) {
            var b = el('button', 'text-full-editor-tb');
            b.type = 'button';
            b.title = label;
            b.setAttribute('aria-label', label);
            b.innerHTML = '<i class="ph-bold ' + phIcon + '"></i>';
            b.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                onClick(b);
            });
            row.appendChild(b);
            return b;
        },

        _addPillBtn: function (row, label, phIcon, title, onClick) {
            var b = el('button', 'tfe-tb-pill');
            b.type = 'button';
            b.title = title || label;
            b.innerHTML = '<i class="ph-bold ' + phIcon + '"></i><span>' + escHtml(label) + '</span>';
            b.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                onClick(b);
            });
            row.appendChild(b);
            return b;
        },

        // =====================================================================
        // Workspace Body & Footer
        // =====================================================================

        _buildBody: function () {
            this._bodyGrid = el('div', 'tfe-body');

            // Left: Block Palette
            this._leftPane = this._buildPalette();
            this._bodyGrid.appendChild(this._leftPane);

            // Center, inspector, and the formatted page stay on one row.
            // The palette can sit above them when the window is narrow.
            this._workspace = el('div', 'tfe-workspace');

            // Center: holds Blocks Stage and/or Raw Stage
            this._centerPane = el('div', 'tfe-center-pane');

            this._blocksStage = el('div', 'tfe-blocks-stage');
            this._blockCanvasEl = el('div', 'tfe-block-canvas');
            this._blocksStage.appendChild(this._blockCanvasEl);
            this._bindCanvasDragDrop();

            this._rawStage = el('div', 'tfe-raw-stage');
            this._taWrap = el('div', 'text-full-editor-ta-wrap');
            this._textarea = el('textarea', 'text-full-editor-ta');
            this._textarea.spellcheck = true;
            this._textarea.placeholder = 'Write Dashboard Studio Markdown here...\nUse headings (#), tables (| A | B |), icons (:ph-star:), callouts ([block1:Note]), or {{topics}}.';
            this._taWrap.appendChild(this._textarea);
            this._rawStage.appendChild(this._taWrap);

            this._centerPane.appendChild(this._blocksStage);
            this._centerPane.appendChild(this._rawStage);
            this._workspace.appendChild(this._centerPane);

            // Context Inspector (Blocks / Split+Blocks)
            this._rightPane = el('aside', 'tfe-inspector-pane');
            this._rightPane.setAttribute('aria-label', 'Block properties');
            this._inspectorEl = el('div', 'tfe-inspector-body');
            this._rightPane.appendChild(this._inspectorEl);
            this._workspace.appendChild(this._rightPane);

            this._splitHandle = el('div', 'tfe-split-handle');
            this._splitHandle.hidden = true;
            this._splitHandle.tabIndex = 0;
            this._splitHandle.setAttribute('role', 'separator');
            this._splitHandle.setAttribute('aria-orientation', 'vertical');
            this._splitHandle.setAttribute('aria-label', 'Drag to resize the split');
            this._splitHandle.title = 'Drag to resize the split';
            this._splitHandle.appendChild(el('span', 'tfe-split-grip'));
            this._bindSplitResize(this._splitHandle);
            this._workspace.appendChild(this._splitHandle);

            // Formatted page: full width in Visual, right side when Split is on
            this._previewStage = el('div', 'tfe-preview-stage');
            this._previewCardEl = el('div', 'tfe-preview-card');
            this._previewRootEl = el('div', 'text-md-scoped text-md-root tfe-preview-root');
            this._previewRootEl.contentEditable = 'true';
            this._previewRootEl.spellcheck = true;
            this._previewRootEl.setAttribute('aria-label', 'Visual Markdown editor');
            this._previewRootEl.setAttribute('data-placeholder', 'Click to start typing visually, or drag blocks here...');
            this._previewCardEl.appendChild(this._previewRootEl);
            this._previewStage.appendChild(this._previewCardEl);
            this._workspace.appendChild(this._previewStage);
            this._bodyGrid.appendChild(this._workspace);
            this._bindWysiwygEvents();
            this._bindWysiwygDragDrop();
        },

        _buildFooter: function () {
            var self = this;
            var foot = el('div', 'tfe-statusbar');

            var left = el('div', 'tfe-status-left');
            this._statusTextEl = el('span', 'tfe-status-msg', '');
            this._statsEl = el('span', 'tfe-status-stats', '');
            left.appendChild(this._statusTextEl);
            left.appendChild(this._statsEl);

            var right = el('div', 'tfe-status-actions');
            var btnImp = el('button', 'tfe-foot-btn');
            btnImp.type = 'button';
            btnImp.title = 'Import Markdown (.md / .txt) or Designer Project (.json)';
            btnImp.innerHTML = '<i class="ph-bold ph-upload-simple"></i><span>Import</span>';
            btnImp.addEventListener('click', function () {
                if (self._fileInput) self._fileInput.click();
            });

            var btnExp = el('button', 'tfe-foot-btn');
            btnExp.type = 'button';
            btnExp.innerHTML = '<i class="ph-bold ph-download-simple"></i><span>Export .md</span>';
            btnExp.addEventListener('click', function () { self._exportMarkdown(); });

            var btnClr = el('button', 'tfe-foot-btn tfe-foot-btn--danger');
            btnClr.type = 'button';
            btnClr.innerHTML = '<i class="ph-bold ph-trash"></i><span>Clear</span>';
            btnClr.addEventListener('click', function () { void self._clearDocument(); });

            right.appendChild(btnImp);
            right.appendChild(btnExp);
            right.appendChild(btnClr);

            foot.appendChild(left);
            foot.appendChild(right);
            return foot;
        },

        // =====================================================================
        // Mode Switching & Layout
        // =====================================================================

        _isSplitShown: function () {
            return !!this._splitOn && this._mode !== 'preview';
        },

        _readSplitRatio: function () {
            var n = parseFloat(readPref(LS_SPLIT_RATIO, '0.5'));
            if (!(n >= 0.12 && n <= 0.88)) return 0.5;
            return n;
        },

        _splitHandleWidth: function () {
            if (!this._splitHandle || this._splitHandle.hidden) return 0;
            return this._splitHandle.getBoundingClientRect().width || 0;
        },

        _splitFixedWidth: function () {
            var center = this._centerPane;
            if (!center || center.hidden) return 0;
            var top = center.getBoundingClientRect().top;
            var fixed = 0;
            var panes = [this._leftPane, this._rightPane];
            for (var i = 0; i < panes.length; i++) {
                var pane = panes[i];
                if (!pane || pane.hidden) continue;
                var r = pane.getBoundingClientRect();
                if (r.width < 1 || r.height < 1) continue;
                if (Math.abs(r.top - top) > 20) continue;
                fixed += r.width;
            }
            return fixed;
        },

        _splitFlexibleWidth: function () {
            if (!this._bodyGrid) return 0;
            var bodyW = this._bodyGrid.getBoundingClientRect().width || 0;
            return Math.max(0, bodyW - this._splitFixedWidth() - this._splitHandleWidth());
        },

        _clampSplitPreviewPx: function (desired) {
            var flexible = this._splitFlexibleWidth();
            if (flexible < 1) return Math.max(0, desired || 0);
            var minPane = 140;
            var maxPreview = flexible - minPane;
            if (maxPreview < minPane) {
                return Math.max(80, Math.round(flexible * 0.5));
            }
            var px = desired;
            if (px < minPane) px = minPane;
            if (px > maxPreview) px = maxPreview;
            return Math.round(px);
        },

        _setPreviewWidthPx: function (px) {
            if (!this._previewStage) return;
            var n = Math.round(px);
            this._previewStage.style.flex = '0 0 ' + n + 'px';
            this._previewStage.style.width = n + 'px';
        },

        _clearPreviewWidth: function () {
            if (!this._previewStage) return;
            this._previewStage.style.flex = '';
            this._previewStage.style.width = '';
        },

        _rememberSplitRatio: function (previewPx) {
            var flexible = this._splitFlexibleWidth();
            if (flexible < 1) return;
            var ratio = previewPx / flexible;
            if (ratio < 0.12) ratio = 0.12;
            if (ratio > 0.88) ratio = 0.88;
            this._splitRatio = ratio;
            savePref(LS_SPLIT_RATIO, String(Math.round(ratio * 1000) / 1000));
            this._syncSplitAria();
        },

        _syncSplitAria: function () {
            if (!this._splitHandle) return;
            var pct = Math.round((this._splitRatio || 0.5) * 100);
            this._splitHandle.setAttribute('aria-valuemin', '12');
            this._splitHandle.setAttribute('aria-valuemax', '88');
            this._splitHandle.setAttribute('aria-valuenow', String(pct));
        },

        _applySplitWidth: function () {
            if (!this._previewStage) return;
            if (!this._isSplitShown()) {
                this._clearPreviewWidth();
                return;
            }
            var flexible = this._splitFlexibleWidth();
            if (flexible < 1) return;
            var ratio = this._splitRatio;
            if (!(ratio >= 0.12 && ratio <= 0.88)) ratio = 0.5;
            var px = this._clampSplitPreviewPx(flexible * ratio);
            this._setPreviewWidthPx(px);
            this._syncSplitAria();
        },

        _nudgeSplit: function (deltaPreviewPx) {
            if (!this._isSplitShown() || !this._previewStage) return;
            var cur = this._previewStage.getBoundingClientRect().width;
            var next = this._clampSplitPreviewPx(cur + deltaPreviewPx);
            this._setPreviewWidthPx(next);
            this._rememberSplitRatio(next);
        },

        _bindSplitResize: function (handle) {
            var self = this;
            if (!handle) return;
            handle.style.touchAction = 'none';
            handle.addEventListener('keydown', function (e) {
                if (!self._isSplitShown()) return;
                var key = e.key || '';
                if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
                e.preventDefault();
                e.stopPropagation();
                var step = e.shiftKey ? 64 : 28;
                self._nudgeSplit(key === 'ArrowLeft' ? step : -step);
            });
            if (typeof PointerDrag === 'undefined') return;
            PointerDrag.bind(handle, {
                raf: true,
                shouldStart: function () { return self._isSplitShown(); },
                onDown: function (e) {
                    self._splitDrag = {
                        pointerX: e.clientX,
                        startPreview: self._previewStage ? self._previewStage.getBoundingClientRect().width : 0
                    };
                    if (self._root) self._root.classList.add('is-split-dragging');
                    document.documentElement.style.cursor = 'col-resize';
                    return { el: handle };
                },
                onMove: function (ev) {
                    if (!self._splitDrag) return;
                    var delta = self._splitDrag.pointerX - ev.clientX;
                    var next = self._clampSplitPreviewPx(self._splitDrag.startPreview + delta);
                    self._setPreviewWidthPx(next);
                },
                onUp: function () {
                    var px = self._previewStage ? self._previewStage.getBoundingClientRect().width : 0;
                    if (self._root) self._root.classList.remove('is-split-dragging');
                    document.documentElement.style.cursor = '';
                    self._splitDrag = null;
                    if (px > 0) self._rememberSplitRatio(px);
                }
            });
        },

        _setMode: function (nextMode) {
            if (nextMode !== 'blocks' && nextMode !== 'raw' && nextMode !== 'preview') return;
            if (this._mode === nextMode) return;
            this._closeActivePopover();

            if (this._mode === 'raw' && nextMode === 'blocks') {
                this._parseRawIntoBlocks();
            }
            if (this._mode === 'preview') {
                this._wysiwygActiveTableInfo = null;
                this._savedWysiwygRange = null;
            }

            this._mode = nextMode;
            savePref(LS_MODE, nextMode);
            this._applyModeLayout();
        },

        _toggleSplit: function () {
            if (this._mode === 'preview') return;
            this._closeActivePopover();
            this._splitOn = !this._splitOn;
            savePref(LS_SPLIT, this._splitOn ? '1' : '0');
            this._applyModeLayout();
        },

        _parseRawIntoBlocks: function () {
            var raw = this._textarea ? this._textarea.value : this._markdown;
            this._markdown = raw;
            this._blocks = MarkdownBlockCodec.parseMarkdownToBlocks(raw);
            if (this._selectedBlock >= this._blocks.length) {
                this._selectedBlock = this._blocks.length - 1;
            }
            if (this._selectedBlock < 0 && this._blocks.length > 0) {
                this._selectedBlock = 0;
            }
            this._cellRow = 0;
            this._cellCol = 0;
            this._selectedChildIndex = -1;
        },

        _applyModeLayout: function () {
            var self = this;
            var m = this._mode;
            var splitShown = this._isSplitShown();
            var useBlocks = (m === 'blocks');
            var useRaw = (m === 'raw');
            var showPreview = splitShown || (m === 'preview');
            var showRibbon = useRaw || (m === 'preview');

            Object.keys(this._modeBtns).forEach(function (k) {
                var btn = self._modeBtns[k];
                btn.classList.toggle('is-active', k === m);
                btn.setAttribute('aria-selected', k === m ? 'true' : 'false');
                btn.setAttribute('aria-pressed', k === m ? 'true' : 'false');
            });

            if (this._splitBtn) {
                var splitAllowed = (m === 'blocks' || m === 'raw');
                this._splitBtn.classList.toggle('is-active', splitShown);
                this._splitBtn.classList.toggle('is-disabled', !splitAllowed);
                this._splitBtn.setAttribute('aria-pressed', splitShown ? 'true' : 'false');
                this._splitBtn.setAttribute('aria-disabled', splitAllowed ? 'false' : 'true');
            }

            this._toolbarEl.hidden = !showRibbon;
            this._toolbarEl.classList.toggle('is-wysiwyg-ribbon', !useRaw && m === 'preview');
            this._tableCtxBar.classList.toggle('is-wysiwyg-ribbon', !useRaw && m === 'preview');
            this._tableCtxBar.hidden = !showRibbon || !this._isTableContextActive();

            this._leftPane.hidden = !useBlocks;
            this._centerPane.hidden = (!useBlocks && !useRaw);
            this._blocksStage.hidden = !useBlocks;
            this._rawStage.hidden = !useRaw;
            this._previewStage.hidden = !showPreview;
            this._rightPane.hidden = !useBlocks;
            if (this._splitHandle) this._splitHandle.hidden = !splitShown;

            this._root.dataset.mode = splitShown ? 'split' : m;
            this._root.classList.toggle('tfe-mode-blocks', useBlocks && !splitShown);
            this._root.classList.toggle('tfe-mode-split', splitShown);
            this._root.classList.toggle('tfe-mode-raw', useRaw && !splitShown);
            this._root.classList.toggle('tfe-mode-preview', m === 'preview');

            if (!useRaw) {
                if (this._findBar && this._findBar.wrap) this._findBar.wrap.style.display = 'none';
            }

            if (useBlocks) {
                this._renderBlockCanvas();
                this._renderInspector();
            }
            if (useRaw && this._textarea) {
                this._textarea.value = this._markdown;
                this._updateRawToolbarState();
                if (m === 'raw') {
                    setTimeout(function () { if (self._textarea) self._textarea.focus(); }, 0);
                }
            }
            if (showPreview) {
                this._refreshLivePreviews();
                this._updateRawToolbarState();
            }
            this._updateCompactBreakpoint();
            this._updateStatusBar();
        },

        // =====================================================================
        // State Sync, Undo/Redo, & Live Widget Integration
        // =====================================================================

        _captureSnapshot: function () {
            var curMd = this._textarea ? this._textarea.value : this._markdown;
            return {
                markdown: curMd,
                blocksJson: JSON.stringify(this._blocks || []),
                selectedBlock: this._selectedBlock,
                cellRow: this._cellRow,
                cellCol: this._cellCol,
                selectedChildIndex: this._selectedChildIndex,
                selStart: this._textarea ? this._textarea.selectionStart : 0,
                selEnd: this._textarea ? this._textarea.selectionEnd : 0
            };
        },

        _snapshotSignature: function (snap) {
            return snap.markdown + '\x00' + snap.blocksJson;
        },

        _pushUndoState: function () {
            var snap = this._captureSnapshot();
            var sig = this._snapshotSignature(snap);
            if (this._undo.length && this._snapshotSignature(this._undo[this._undo.length - 1]) === sig) {
                return;
            }
            if (this._undo.length >= MAX_UNDO) this._undo.shift();
            this._undo.push(snap);
            this._redo = [];
            this._lastSnapshotKey = sig;
            this._updateUndoRedoButtons();
        },

        _scheduleTypingCheckpoint: function () {
            var self = this;
            if (this._typingTimer) clearTimeout(this._typingTimer);
            this._typingTimer = setTimeout(function () {
                self._typingTimer = null;
                if (!self._root) return;
                var cur = self._captureSnapshot();
                var curSig = self._snapshotSignature(cur);
                if (curSig === self._lastSnapshotKey) return;
                if (self._undo.length >= MAX_UNDO) self._undo.shift();
                // Push previous snapshot stored at _lastSnapshotObj if available
                if (self._lastSnapshotObj) {
                    self._undo.push(self._lastSnapshotObj);
                }
                self._lastSnapshotKey = curSig;
                self._lastSnapshotObj = cur;
                self._redo = [];
                self._updateUndoRedoButtons();
            }, TYPING_CHECKPOINT_MS);
            if (!this._lastSnapshotObj) {
                this._lastSnapshotObj = this._captureSnapshot();
            }
        },

        _restoreSnapshot: function (snap) {
            if (!snap) return;
            this._markdown = snap.markdown || '';
            try {
                this._blocks = JSON.parse(snap.blocksJson || '[]');
            } catch (e) {
                this._blocks = MarkdownBlockCodec.parseMarkdownToBlocks(this._markdown);
            }
            this._selectedBlock = Math.min(snap.selectedBlock != null ? snap.selectedBlock : 0, this._blocks.length - 1);
            this._cellRow = snap.cellRow || 0;
            this._cellCol = snap.cellCol || 0;
            this._selectedChildIndex = snap.selectedChildIndex != null ? snap.selectedChildIndex : -1;
            if (this._textarea) {
                this._textarea.value = this._markdown;
                try {
                    this._textarea.selectionStart = snap.selStart || 0;
                    this._textarea.selectionEnd = snap.selEnd || 0;
                } catch (e2) { /* ignore */ }
            }
            this._lastSnapshotKey = this._snapshotSignature(snap);
            this._lastSnapshotObj = cloneData(snap);
            this._syncToWidget(true);
            this._applyModeLayout();
            this._updateUndoRedoButtons();
        },

        _doUndo: function () {
            if (!this._undo.length) return;
            var cur = this._captureSnapshot();
            this._redo.push(cur);
            var prev = this._undo.pop();
            this._restoreSnapshot(prev);
        },

        _doRedo: function () {
            if (!this._redo.length) return;
            var cur = this._captureSnapshot();
            this._undo.push(cur);
            var next = this._redo.pop();
            this._restoreSnapshot(next);
        },

        _updateUndoRedoButtons: function () {
            if (this._undoBtn) {
                this._undoBtn.disabled = !this._undo.length;
                this._undoBtn.classList.toggle('is-disabled', !this._undo.length);
            }
            if (this._redoBtn) {
                this._redoBtn.disabled = !this._redo.length;
                this._redoBtn.classList.toggle('is-disabled', !this._redo.length);
            }
        },

        _commitBlocksToMarkdown: function (opts) {
            var o = opts || {};
            var md = MarkdownBlockCodec.serializeBlocksToMarkdown(this._blocks);
            this._markdown = md;
            if (this._textarea) this._textarea.value = md;
            this._syncToWidget(!!o.flush);
            if (!o.skipCardUpdate && o.cardIndex != null) {
                this._updateCardPreviewOnly(o.cardIndex);
            } else if (!o.skipCardUpdate) {
                this._renderBlockCanvas();
            }
            if (this._inspectorEl && this._selectedBlock >= 0 && this._selectedChildIndex >= 0) {
                var sumEl = this._inspectorEl.querySelector('.tfe-nested-row.is-active .tfe-nested-summary');
                var sb = this._blocks[this._selectedBlock];
                if (sumEl && sb) {
                    var cList = sb.type === 'callout'
                        ? sb.children
                        : (sb.type === 'table' && sb.rows && sb.rows[this._cellRow] && sb.rows[this._cellRow][this._cellCol] ? sb.rows[this._cellRow][this._cellCol].children : null);
                    if (Array.isArray(cList) && cList[this._selectedChildIndex]) {
                        sumEl.textContent = summarizeChildItem(cList[this._selectedChildIndex]);
                    }
                }
            }
            if (!this._previewStage.hidden) {
                this._refreshLivePreviews();
            }
            this._updateStatusBar();
            this._updateUndoRedoButtons();
        },

        _syncToWidget: function (flush) {
            if (!this._opts) return;
            var val = this._textarea ? this._textarea.value : this._markdown;
            this._markdown = val;
            this._opts.setText(val, { flush: flush === true });
        },

        _wireMainInputSync: function () {
            var self = this;
            if (!this._opts || !this._opts.mainTextarea) return;
            this._mainInputListener = function () {
                if (!self._textarea) return;
                self._markdown = self._opts.mainTextarea.value;
                self._textarea.value = self._markdown;
                if (self._mode === 'blocks') {
                    self._parseRawIntoBlocks();
                    self._renderBlockCanvas();
                    self._renderInspector();
                }
                self._refreshLivePreviews();
                self._updateStatusBar();
            };
            this._opts.mainTextarea.addEventListener('input', this._mainInputListener);
        },

        _setStatus: function (msg) {
            var self = this;
            if (!this._statusTextEl) return;
            this._statusTextEl.textContent = msg || '';
            if (this._statusTimer) clearTimeout(this._statusTimer);
            if (msg) {
                this._statusTimer = setTimeout(function () {
                    self._statusTimer = null;
                    if (self._statusTextEl) self._statusTextEl.textContent = '';
                }, 3200);
            }
        },

        _updateStatusBar: function () {
            if (!this._statsEl) return;
            var md = this._markdown || '';
            var lines = md ? md.split('\n').length : 0;
            var chars = md.length;
            var topicCount = (typeof TextWidget !== 'undefined' && typeof TextWidget.collectMarkdownDataTopicPaths === 'function')
                ? TextWidget.collectMarkdownDataTopicPaths(md).length
                : 0;
            var blkCount = Array.isArray(this._blocks) ? this._blocks.length : 0;
            var parts = [];
            if (this._mode === 'blocks') {
                parts.push(blkCount + (blkCount === 1 ? ' block' : ' blocks'));
            }
            parts.push(lines + (lines === 1 ? ' line' : ' lines'));
            parts.push(chars + ' chars');
            if (topicCount > 0) {
                parts.push(topicCount + (topicCount === 1 ? ' topic' : ' topics'));
            }
            this._statsEl.textContent = parts.join('  \u2022  ');
        },

        // =====================================================================
        // Widget-Scoped Live Preview Pipeline
        // =====================================================================

        _applyWidgetScopeVarsToElement: function (targetEl, widget, config) {
            if (!targetEl) return;
            targetEl.classList.add('text-md-scoped', 'text-md-root');
            targetEl.classList.remove('text-md-global-align', 'text-md-global-case', 'text-md-nowrap');
            if (widget && widget.mdRoot && widget.mdRoot.style) {
                var srcStyle = widget.mdRoot.style;
                for (var i = 0; i < srcStyle.length; i++) {
                    var prop = srcStyle[i];
                    if (prop && (prop.indexOf('--tmd-') === 0 || prop.indexOf('--text-md-') === 0)) {
                        targetEl.style.setProperty(prop, srcStyle.getPropertyValue(prop));
                    }
                }
                if (widget.mdRoot.classList.contains('text-md-global-align')) targetEl.classList.add('text-md-global-align');
                if (widget.mdRoot.classList.contains('text-md-global-case')) targetEl.classList.add('text-md-global-case');
                if (widget.mdRoot.classList.contains('text-md-nowrap')) targetEl.classList.add('text-md-nowrap');
            } else if (config) {
                targetEl.style.setProperty('--tmd-p-col', resolveCssColor(config.textMdParaCol || '@textMuted') || 'var(--ui-text)');
                targetEl.style.setProperty('--tmd-h1-col', resolveCssColor(config.textMdH1Col || '@text') || 'var(--ui-text)');
                targetEl.style.setProperty('--tmd-h2-col', resolveCssColor(config.textMdH2Col || '@text') || 'var(--ui-text)');
                targetEl.style.setProperty('--tmd-h3-col', resolveCssColor(config.textMdH3Col || '@text') || 'var(--ui-text)');
            }
        },

        _syncPreviewContainerChrome: function () {
            var w = getTargetTextWidget();
            var c = w ? w.config : null;
            var card = this._previewCardEl;
            var stage = this._previewStage;
            if (!stage || !card) return;

            var canvasBg = resolveCssColor('@background') || '';
            if (canvasBg) {
                stage.style.setProperty('--tfe-preview-backdrop', canvasBg);
            }

            if (w && c) {
                if (c.showContainer !== false && typeof BaseWidget !== 'undefined' && typeof BaseWidget.applyContainerChromeToElement === 'function') {
                    BaseWidget.applyContainerChromeToElement(card, c);
                } else {
                    card.style.background = resolveCssColor('@surface') || 'var(--surface-bg)';
                    card.style.border = '1px dashed var(--glass-border)';
                    card.style.borderRadius = '12px';
                    card.style.boxShadow = 'none';
                }
                if (c.padding != null) {
                    card.style.padding = Math.max(8, Number(c.padding) || 14) + 'px';
                }
            } else if (canvasBg) {
                card.style.background = resolveCssColor('@surface') || '';
            }
        },

        _renderMarkdownSafeForPreview: function (markdownSource, widget, o) {
            var opts = o || {};
            var isWysiwyg = !!opts.wysiwyg;
            var mdText = (typeof TextWidget !== 'undefined' && TextWidget.expandEscapedNewlines)
                ? TextWidget.expandEscapedNewlines(markdownSource || '')
                : String(markdownSource || '');
            if (!mdText.replace(/\s+/g, '')) return '';

            var phOpts = (widget && typeof widget._getMarkdownPhosphorIconOpts === 'function')
                ? widget._getMarkdownPhosphorIconOpts()
                : { defaultWeight: 'regular' };

            var hasBraces = mdText.indexOf('{{') >= 0;
            if ((isWysiwyg || !this._liveDataPreview) && hasBraces) {
                var tokens = MarkdownBlockCodec.scanDoubleBraces(mdText);
                var replacements = [];
                var tokenized = '';
                var last = 0;
                for (var i = 0; i < tokens.length; i++) {
                    var tok = tokens[i];
                    var inDir = (typeof TextWidget !== 'undefined' && TextWidget._isTokenInsideMarkdownDirectiveParam)
                        ? TextWidget._isTokenInsideMarkdownDirectiveParam(mdText, tok.start)
                        : false;
                    if (inDir) continue;
                    tokenized += mdText.slice(last, tok.start);
                    var key = 'DSTFETOK' + i + 'END';
                    tokenized += key;
                    replacements.push({ key: key, raw: '{{' + tok.inner + '}}' });
                    last = tok.end;
                }
                tokenized += mdText.slice(last);
                if (this._liveDataPreview && widget && typeof widget._resolveMarkdownDynamicPlaceholders === 'function') {
                    tokenized = widget._resolveMarkdownDynamicPlaceholders(tokenized, false, true);
                }
                var html = (typeof TextWidget !== 'undefined' && TextWidget._renderMarkdownFragmentToSafeHtml)
                    ? TextWidget._renderMarkdownFragmentToSafeHtml(tokenized, { phOpts: phOpts, rawForPlainCheck: tokenized })
                    : escHtml(mdText);
                for (var r = 0; r < replacements.length; r++) {
                    var rep = replacements[r];
                    var innerHtml = '';
                    var cls = isWysiwyg
                        ? ('tfe-wysiwyg-token' + (this._liveDataPreview ? ' is-live-eval' : ''))
                        : 'tfe-topic-chip';
                    if (this._liveDataPreview && widget && typeof widget._resolveMarkdownDynamicPlaceholders === 'function') {
                        var resolvedStr = widget._resolveMarkdownDynamicPlaceholders(rep.raw, false, true);
                        if (resolvedStr && resolvedStr.trim()) {
                            innerHtml = (typeof TextWidget !== 'undefined' && TextWidget._renderMarkdownInlineBody)
                                ? TextWidget._sanitizeMarkdownHtml(TextWidget._renderMarkdownInlineBody(resolvedStr, phOpts))
                                : escHtml(resolvedStr);
                        } else {
                            innerHtml = escHtml(rep.raw);
                        }
                    } else {
                        innerHtml = escHtml(rep.raw);
                    }
                    var ceAttr = isWysiwyg ? ' contenteditable="false"' : '';
                    var chipHtml = '<span class="' + cls + '"' + ceAttr + ' data-tfe-token="' + escHtml(rep.raw) + '" title="' + escHtml(rep.raw) + '">' + innerHtml + '</span>';
                    html = html.split(rep.key).join(chipHtml);
                }
                return widget && typeof widget._applyLinkTargetToHtml === 'function'
                    ? widget._applyLinkTargetToHtml(html)
                    : html;
            }

            if (this._liveDataPreview && widget && typeof widget._renderMarkdownToSafeHtml === 'function') {
                return widget._renderMarkdownToSafeHtml(mdText);
            }

            if (typeof TextWidget !== 'undefined' && TextWidget._renderMarkdownFragmentToSafeHtml) {
                var frag = TextWidget._renderMarkdownFragmentToSafeHtml(mdText, { phOpts: phOpts, rawForPlainCheck: mdText });
                return widget && typeof widget._applyLinkTargetToHtml === 'function'
                    ? widget._applyLinkTargetToHtml(frag)
                    : frag;
            }
            return escHtml(mdText);
        },

        _annotateWysiwygElements: function (targetEl, mdSource) {
            if (!targetEl) return;
            var md = (typeof TextWidget !== 'undefined' && TextWidget.expandEscapedNewlines)
                ? TextWidget.expandEscapedNewlines(mdSource || '')
                : String(mdSource || '');

            // Mask fenced code blocks and non-directive {{...}} so regex scans match actual rendered static tokens
            var cleanSrc = md.replace(/```[\s\S]*?```/g, function (m) { return m.replace(/[^\n]/g, ' '); });
            var braceList = MarkdownBlockCodec.scanDoubleBraces(cleanSrc);
            if (braceList.length) {
                var masked = '';
                var prev = 0;
                for (var bi = 0; bi < braceList.length; bi++) {
                    var bt = braceList[bi];
                    masked += cleanSrc.slice(prev, bt.start) + ' ';
                    prev = bt.end;
                }
                cleanSrc = masked + cleanSrc.slice(prev);
            }

            // 1. Annotate static Phosphor icons
            var iconTokens = [];
            var iconRe = /:ph\([^)\n]+\):|:ph-(?:thin|light|bold|fill|duotone)\s+ph-[a-z0-9-]+(?:\|[^:\n\s]+)*:|:ph-[a-z0-9-]+(?:\|[^:\n\s]+)*:/gi;
            var im;
            while ((im = iconRe.exec(cleanSrc)) !== null) {
                iconTokens.push(im[0]);
            }
            var domIcons = targetEl.querySelectorAll('i.text-md-ph-icon');
            var icCursor = 0;
            for (var ii = 0; ii < domIcons.length; ii++) {
                var icEl = domIcons[ii];
                if (icEl.closest && icEl.closest('.tfe-wysiwyg-token')) continue;
                icEl.setAttribute('contenteditable', 'false');
                if (icCursor < iconTokens.length) {
                    icEl.setAttribute('data-tfe-md', iconTokens[icCursor]);
                    icCursor += 1;
                }
            }

            // 2. Annotate static Images
            var imgTokens = [];
            var imgRe = /!\[((?:\\.|[^\]\n\\])*)\]\(([^)\n]+)\)/g;
            var gm;
            while ((gm = imgRe.exec(cleanSrc)) !== null) {
                imgTokens.push(gm[0]);
            }
            var domImgs = targetEl.querySelectorAll('img');
            var igCursor = 0;
            for (var gi = 0; gi < domImgs.length; gi++) {
                var imgEl = domImgs[gi];
                if (imgEl.closest && imgEl.closest('.tfe-wysiwyg-token')) continue;
                if (igCursor < imgTokens.length) {
                    imgEl.setAttribute('data-tfe-md', imgTokens[igCursor]);
                    igCursor += 1;
                }
            }

            // 3. Annotate Tables (headerless flag, column alignments, and per-cell backgrounds)
            var parsedBlocks = MarkdownBlockCodec.parseMarkdownToBlocks(md);
            var tableBlocks = parsedBlocks.filter(function (bk) { return bk && bk.type === 'table'; });
            var domTables = targetEl.querySelectorAll('table');
            for (var ti = 0; ti < domTables.length && ti < tableBlocks.length; ti++) {
                var domTbl = domTables[ti];
                var tblModel = tableBlocks[ti];
                domTbl.dataset.tfeHeaderless = tblModel.headerless ? '1' : '0';
                domTbl.dataset.tfeColAligns = JSON.stringify(tblModel.align || []);
                var hasThead = !!(domTbl.tHead && domTbl.tHead.rows.length);
                for (var ri = 0; ri < domTbl.rows.length; ri++) {
                    var modelRowIdx = hasThead ? ri : (ri + 1);
                    var modelRow = tblModel.rows[modelRowIdx];
                    if (!modelRow) continue;
                    var domRow = domTbl.rows[ri];
                    for (var ci = 0; ci < domRow.cells.length && ci < modelRow.length; ci++) {
                        var mCell = modelRow[ci];
                        if (mCell && mCell.background) {
                            domRow.cells[ci].dataset.tfeCellBg = mCell.background;
                        }
                    }
                }
            }

            // 4. Mark links cleanly so clicking triggers edit instead of leaving page
            var domLinks = targetEl.querySelectorAll('a');
            for (var li = 0; li < domLinks.length; li++) {
                var aEl = domLinks[li];
                if (aEl.getAttribute('target') === '_blank') {
                    aEl.dataset.tfeNewtab = '1';
                }
            }
        },

        _renderPreviewInto: function (targetEl, markdownSource, opts) {
            if (!targetEl) return;
            var o = opts || {};
            var w = getTargetTextWidget();
            var c = w ? w.config : null;

            if (w && typeof w._ensureScopedStyle === 'function') {
                w._ensureScopedStyle();
            } else if (typeof TextWidget !== 'undefined' && TextWidget.prototype && TextWidget.prototype._ensureScopedStyle) {
                TextWidget.prototype._ensureScopedStyle();
            }

            this._applyWidgetScopeVarsToElement(targetEl, w, c);

            var html = this._renderMarkdownSafeForPreview(markdownSource, w, o);
            if (!html) {
                if (o.wysiwyg) {
                    targetEl.innerHTML = '<p><br></p>';
                } else {
                    targetEl.innerHTML = '<div class="tfe-empty-block-hint">' + escHtml(o.emptyHint || 'Empty block') + '</div>';
                }
                return;
            }
            targetEl.innerHTML = html;

            if (o.wysiwyg) {
                this._annotateWysiwygElements(targetEl, markdownSource);
            }

            // Block link navigation inside previews
            var links = targetEl.querySelectorAll('a');
            for (var li = 0; li < links.length; li++) {
                links[li].addEventListener('click', function (ev) { ev.preventDefault(); });
            }

            // Apply table styling & cell backgrounds
            if (w && c && typeof w._applyTableClasses === 'function') {
                w._applyTableClasses(targetEl, c.mdTableStyle, c.mdCalendarWeekStart);
            } else {
                var tbls = targetEl.querySelectorAll('table');
                for (var ti = 0; ti < tbls.length; ti++) {
                    tbls[ti].className = 'text-md-table text-md-table--minimal';
                }
            }
            if (typeof TextWidget !== 'undefined' && TextWidget._mdTableApplyUserColumnLayout) {
                TextWidget._mdTableApplyUserColumnLayout(targetEl, c || {});
            }
            if (typeof TextWidget !== 'undefined' && TextWidget._applyCellBackgroundFromSource) {
                TextWidget._applyCellBackgroundFromSource(targetEl, markdownSource);
            }
            if (typeof MarkdownTextColor !== 'undefined' && MarkdownTextColor.reapplyFromDataAttrs) {
                MarkdownTextColor.reapplyFromDataAttrs(targetEl);
            }
            if (typeof MarkdownImageTint !== 'undefined' && MarkdownImageTint.reapplyFromDataAttrs) {
                MarkdownImageTint.reapplyFromDataAttrs(targetEl);
            }
            // Custom block callout colors
            var customBlks = targetEl.querySelectorAll('.text-md-block-custom[data-text-md-block-color]');
            for (var bi = 0; bi < customBlks.length; bi++) {
                var cb = customBlks[bi];
                var spec = cb.getAttribute('data-text-md-block-color');
                if (typeof TextWidget !== 'undefined' && TextWidget.resolveMarkdownColorWithOpacity) {
                    cb.style.setProperty('--text-md-block-custom-solid', TextWidget.resolveMarkdownColorWithOpacity(spec, 100));
                    cb.style.setProperty('--text-md-block-custom-bg', TextWidget.resolveMarkdownColorWithOpacity(spec, 30));
                    cb.style.setProperty('--text-md-block-custom-border', TextWidget.resolveMarkdownColorWithOpacity(spec, 38));
                }
            }
            // Apply table cell typography from active widget
            if (w && c && typeof w.applyTypographyToElement === 'function') {
                var tds = targetEl.querySelectorAll('td');
                var alignMdTd = typeof TextWidget !== 'undefined' && TextWidget.textMdAlignUsesTableMarkdown(c.textMdTdAlign);
                for (var tdi = 0; tdi < tds.length; tdi++) {
                    w.applyTypographyToElement(tds[tdi], 'textMdTd', c, {
                        skipTextAlign: alignMdTd || !TextWidget.useTypographyAlign(c),
                        skipTextTransform: !TextWidget.useTypographyCase(c)
                    });
                }
                var ths = targetEl.querySelectorAll('th');
                var styleKey = String(c.mdTableStyle || '').trim();
                var filledHdr = TextWidget.mdTableStyleUsesFilledHeader(styleKey);
                var colFilledSet = c.textMdThColFilled != null && String(c.textMdThColFilled).trim() !== '';
                var alignMdTh = TextWidget.textMdAlignUsesTableMarkdown(c.textMdThAlign);
                for (var thi = 0; thi < ths.length; thi++) {
                    var thOpts = {
                        skipTextAlign: alignMdTh || !TextWidget.useTypographyAlign(c),
                        skipTextTransform: !TextWidget.useTypographyCase(c)
                    };
                    if (filledHdr && colFilledSet && (styleKey !== 'side_header' || TextWidget._mdIsSideHeaderCornerTh(ths[thi]))) {
                        thOpts.overrideCol = c.textMdThColFilled;
                    }
                    w.applyTypographyToElement(ths[thi], 'textMdTh', c, thOpts);
                }
            }
            if (typeof MarkdownBlink !== 'undefined') {
                if (MarkdownBlink.reapplyFromDataAttrs) MarkdownBlink.reapplyFromDataAttrs(targetEl);
                if (MarkdownBlink.syncPhase) MarkdownBlink.syncPhase(targetEl);
            }

            // Highlight selected cell if requested (for table cards)
            if (o.highlightCell) {
                var firstTbl = targetEl.querySelector('table');
                if (firstTbl && firstTbl.rows) {
                    var targetRowIdx = o.highlightRow;
                    var hasThead = !!(firstTbl.tHead && firstTbl.tHead.rows.length);
                    var domRowIdx = hasThead ? targetRowIdx : (targetRowIdx - 1);
                    if (domRowIdx >= 0 && domRowIdx < firstTbl.rows.length) {
                        var domRow = firstTbl.rows[domRowIdx];
                        if (domRow && domRow.cells && domRow.cells[o.highlightCol]) {
                            domRow.cells[o.highlightCol].classList.add('tfe-cell-selected');
                        }
                    }
                }
            }
        },

        _refreshLivePreviews: function () {
            if (!this._previewStage || this._previewStage.hidden || !this._previewRootEl) return;
            if (this._isWysiwygTyping) return;
            this._syncPreviewContainerChrome();
            this._renderPreviewInto(this._previewRootEl, this._textarea ? this._textarea.value : this._markdown, {
                wysiwyg: true,
                emptyHint: 'Click to start typing visually, or drag blocks here...'
            });
        },

        // =====================================================================
        // Block Mode: Left Palette
        // =====================================================================

        _buildPalette: function () {
            var self = this;
            var aside = el('aside', 'tfe-palette');
            aside.setAttribute('aria-label', 'Building blocks');

            var hdr = el('div', 'tfe-pane-heading', 'Blocks');
            aside.appendChild(hdr);

            BLOCK_GROUPS.forEach(function (group) {
                var grpEl = el('div', 'tfe-palette-group');
                grpEl.appendChild(el('div', 'tfe-palette-group-title', group.title));
                var list = el('div', 'tfe-palette-list');
                group.items.forEach(function (it) {
                    var btn = el('button', 'tfe-palette-item');
                    btn.type = 'button';
                    btn.draggable = true;
                    btn.dataset.blockType = it.type;
                    btn.innerHTML = '<span class="tfe-palette-ico"><i class="ph-bold ' + it.icon + '"></i></span><span class="tfe-palette-lbl">' + escHtml(it.label) + '</span>';
                    btn.addEventListener('click', function () {
                        var insIdx = self._selectedBlock >= 0 ? self._selectedBlock + 1 : self._blocks.length;
                        self._addBlock(it.type, insIdx);
                    });
                    btn.addEventListener('dragstart', function (ev) {
                        self._paletteDragType = it.type;
                        if (ev.dataTransfer) {
                            ev.dataTransfer.effectAllowed = 'copy';
                            ev.dataTransfer.setData('text/plain', 'tfe-add:' + it.type);
                        }
                    });
                    btn.addEventListener('dragend', function () {
                        self._paletteDragType = null;
                        self._clearPaletteDropIndicators();
                    });
                    list.appendChild(btn);
                });
                grpEl.appendChild(list);
                aside.appendChild(grpEl);
            });

            var tip = el('div', 'tfe-palette-tip', 'Click or drag onto the canvas, or drop directly inside Table cells & Callouts.');
            aside.appendChild(tip);
            return aside;
        },

        // =====================================================================
        // Block Mode: Center Canvas
        // =====================================================================

        _destroyCanvasReorder: function () {
            if (this._canvasReorder && typeof this._canvasReorder.destroy === 'function') {
                this._canvasReorder.destroy();
            }
            this._canvasReorder = null;
        },

        _clearPaletteDropIndicators: function () {
            if (this._blockCanvasEl) {
                var marks = this._blockCanvasEl.querySelectorAll('.tfe-drop-before, .tfe-drop-after, .tfe-drop-over, .tfe-cell-drop-target, .tfe-container-drop-target, .tfe-drop-invalid');
                for (var i = 0; i < marks.length; i++) {
                    marks[i].classList.remove('tfe-drop-before', 'tfe-drop-after', 'tfe-drop-over', 'tfe-cell-drop-target', 'tfe-container-drop-target', 'tfe-drop-invalid');
                }
            }
            if (this._inspectorEl) {
                var imarks = this._inspectorEl.querySelectorAll('.tfe-container-drop-target, .tfe-drop-invalid');
                for (var j = 0; j < imarks.length; j++) {
                    imarks[j].classList.remove('tfe-container-drop-target', 'tfe-drop-invalid');
                }
            }
            if (this._previewRootEl) {
                var pmarks = this._previewRootEl.querySelectorAll('.tfe-cell-drop-target, .tfe-container-drop-target, .tfe-drop-invalid');
                for (var k = 0; k < pmarks.length; k++) {
                    pmarks[k].classList.remove('tfe-cell-drop-target', 'tfe-container-drop-target', 'tfe-drop-invalid');
                }
            }
        },

        _getDraggedPaletteType: function (ev) {
            if (this._paletteDragType) return this._paletteDragType;
            if (ev && ev.dataTransfer && typeof ev.dataTransfer.getData === 'function') {
                try {
                    var txt = ev.dataTransfer.getData('text/plain');
                    if (txt && txt.indexOf('tfe-add:') === 0) return txt.slice(8);
                } catch (e) { /* ignore */ }
            }
            return null;
        },

        _invalidDropMessage: function (blockType, containerLabel) {
            var meta = BLOCK_META[blockType];
            var lbl = meta ? meta.label : (blockType || 'Block');
            return lbl + ' cannot be placed inside a ' + (containerLabel || 'container') + '.';
        },

        _findClosestTableCell: function (tbl, clientX, clientY) {
            if (!tbl || !tbl.querySelectorAll) return null;
            var cells = tbl.querySelectorAll('td, th');
            var best = null;
            var bestDist = Infinity;
            for (var i = 0; i < cells.length; i++) {
                var r = cells[i].getBoundingClientRect();
                if (r.width <= 0 && r.height <= 0) continue;
                var dx = clientX < r.left ? (r.left - clientX) : (clientX > r.right ? (clientX - r.right) : 0);
                var dy = clientY < r.top ? (r.top - clientY) : (clientY > r.bottom ? (clientY - r.bottom) : 0);
                var d = dx * dx + dy * dy;
                if (d === 0) return cells[i];
                if (d < bestDist) {
                    bestDist = d;
                    best = cells[i];
                }
            }
            return best;
        },

        _resolveCanvasDropTargetFromPoint: function (clientX, clientY, targetEl, blockType, excludeCardIdx) {
            var isCanvasDrag = excludeCardIdx >= 0;
            var card = targetEl && targetEl.closest ? targetEl.closest('.tfe-block-card') : null;
            if (!card || !this._blockCanvasEl || !this._blockCanvasEl.contains(card)) {
                return { kind: isCanvasDrag ? 'none' : 'tail' };
            }
            var cIdx = parseInt(card.dataset.blockIndex, 10);
            if (isNaN(cIdx) || cIdx === excludeCardIdx) {
                return { kind: isCanvasDrag ? 'none' : 'tail' };
            }
            var b = this._blocks[cIdx];
            var onHandleOrBar = Boolean(targetEl.closest && targetEl.closest('.tfe-block-handle, .tfe-block-card-bar'));
            var cRect = card.getBoundingClientRect();
            var after = clientY > cRect.top + cRect.height / 2;

            if (onHandleOrBar) {
                return isCanvasDrag ? { kind: 'none' } : { kind: 'card', cardIdx: cIdx, cardEl: card, after: after };
            }

            var nestedStrip = targetEl.closest ? targetEl.closest('.tfe-card-nested-strip') : null;
            if (nestedStrip && !card.contains(nestedStrip)) nestedStrip = null;

            if (b && b.type === 'table') {
                if (nestedStrip) {
                    if (canNestBlockType(blockType, 'cell')) {
                        var sr = nestedStrip.dataset.rowIdx !== undefined ? parseInt(nestedStrip.dataset.rowIdx, 10) : 0;
                        var sc = nestedStrip.dataset.colIdx !== undefined ? parseInt(nestedStrip.dataset.colIdx, 10) : 0;
                        return { kind: 'cell-active', cardIdx: cIdx, rowIdx: sr, colIdx: sc, el: nestedStrip };
                    }
                    return { kind: 'invalid-container', containerLabel: 'Table cell', blockType: blockType, el: nestedStrip };
                }
                var cell = targetEl.closest ? targetEl.closest('td, th') : null;
                if (cell && !card.contains(cell)) cell = null;
                var inBody = Boolean(targetEl.closest && targetEl.closest('.tfe-block-card-body'));
                var edgeBand = Math.min(8, cRect.height * 0.1);
                var nearOuterEdge = (clientY < cRect.top + edgeBand) || (clientY > cRect.bottom - edgeBand);
                if (!cell && inBody && !nearOuterEdge) {
                    var tblInCard = card.querySelector('.tfe-card-preview-render table');
                    if (tblInCard) cell = this._findClosestTableCell(tblInCard, clientX, clientY);
                }
                if (cell) {
                    if (!canNestBlockType(blockType, 'cell')) {
                        return isCanvasDrag
                            ? { kind: 'none' }
                            : { kind: 'invalid-container', containerLabel: 'Table cell', blockType: blockType, el: cell };
                    }
                    var tbl = cell.closest('table');
                    var hasThead = !!(tbl && tbl.tHead && tbl.tHead.rows.length);
                    var domRow = cell.parentElement ? cell.parentElement.rowIndex : 0;
                    return {
                        kind: 'cell',
                        cardIdx: cIdx,
                        cellEl: cell,
                        rowIdx: hasThead ? domRow : (domRow + 1),
                        colIdx: cell.cellIndex || 0
                    };
                }
                if (inBody && !nearOuterEdge) {
                    if (canNestBlockType(blockType, 'cell')) {
                        var tblStrip = card.querySelector('.tfe-card-nested-strip');
                        var defRow = (b.headerless && b.rows && b.rows.length > 1) ? 1 : 0;
                        var useRow = (cIdx === this._selectedBlock) ? this._cellRow : defRow;
                        var useCol = (cIdx === this._selectedBlock) ? this._cellCol : 0;
                        return { kind: 'cell-active', cardIdx: cIdx, rowIdx: useRow, colIdx: useCol, el: tblStrip || card.querySelector('.tfe-block-card-body') || card };
                    }
                    if (!isCanvasDrag) {
                        return { kind: 'invalid-container', containerLabel: 'Table cell', blockType: blockType, el: card.querySelector('.tfe-block-card-body') || card };
                    }
                }
            }

            if (b && b.type === 'callout') {
                if (nestedStrip) {
                    if (canNestBlockType(blockType, 'callout')) {
                        return { kind: 'callout', cardIdx: cIdx, el: nestedStrip };
                    }
                    return { kind: 'invalid-container', containerLabel: 'Callout', blockType: blockType, el: nestedStrip };
                }
                var inCalloutBody = Boolean(targetEl.closest && targetEl.closest('.tfe-block-card-body'));
                var callPad = Math.min(10, cRect.height * 0.14);
                if (inCalloutBody && clientY >= cRect.top + callPad && clientY <= cRect.bottom - callPad) {
                    if (canNestBlockType(blockType, 'callout')) {
                        return { kind: 'callout', cardIdx: cIdx, el: card.querySelector('.tfe-card-nested-strip') || card.querySelector('.tfe-block-card-body') || card };
                    }
                    if (!isCanvasDrag) {
                        return { kind: 'invalid-container', containerLabel: 'Callout', blockType: blockType, el: card.querySelector('.tfe-card-nested-strip') || card.querySelector('.tfe-block-card-body') || card };
                    }
                }
            }

            return isCanvasDrag ? { kind: 'none' } : { kind: 'card', cardIdx: cIdx, cardEl: card, after: after };
        },

        _applyCanvasDropTargetVisual: function (target) {
            if (!target) return;
            if (target.kind === 'cell' && target.cellEl) {
                target.cellEl.classList.add('tfe-cell-drop-target');
            } else if ((target.kind === 'callout' || target.kind === 'cell-active') && target.el) {
                target.el.classList.add('tfe-container-drop-target');
            } else if (target.kind === 'invalid-container' && target.el) {
                target.el.classList.add('tfe-drop-invalid');
            } else if (target.kind === 'card' && target.cardEl) {
                target.cardEl.classList.add(target.after ? 'tfe-drop-after' : 'tfe-drop-before');
            } else if (target.kind === 'tail' && this._blockCanvasEl) {
                var dropEnd = this._blockCanvasEl.querySelector('.tfe-canvas-drop-tail');
                if (dropEnd) dropEnd.classList.add('tfe-drop-over');
            }
        },

        _bindCanvasDragDrop: function () {
            var self = this;
            var canvas = this._blockCanvasEl;
            if (!canvas) return;

            canvas.addEventListener('dragover', function (e) {
                var addType = self._getDraggedPaletteType(e);
                if (!addType) return;
                self._clearPaletteDropIndicators();
                var target = self._resolveCanvasDropTargetFromPoint(e.clientX, e.clientY, e.target, addType, -1);
                if (target.kind === 'invalid-container') {
                    if (e.dataTransfer) {
                        try { e.dataTransfer.dropEffect = 'none'; } catch (err) { /* ignore */ }
                    }
                    self._applyCanvasDropTargetVisual(target);
                    var msg = self._invalidDropMessage(target.blockType, target.containerLabel);
                    if (!self._statusTextEl || self._statusTextEl.textContent !== msg) {
                        self._setStatus(msg);
                    }
                    return;
                }
                e.preventDefault();
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
                self._applyCanvasDropTargetVisual(target);
            });

            canvas.addEventListener('dragleave', function (e) {
                if (!self._paletteDragType) return;
                if (!canvas.contains(e.relatedTarget)) {
                    self._clearPaletteDropIndicators();
                }
            });

            canvas.addEventListener('drop', function (e) {
                var addType = self._getDraggedPaletteType(e);
                if (!addType) return;
                e.preventDefault();
                self._paletteDragType = null;
                var target = self._resolveCanvasDropTargetFromPoint(e.clientX, e.clientY, e.target, addType, -1);
                self._clearPaletteDropIndicators();

                if (target.kind === 'invalid-container') {
                    self._setStatus(self._invalidDropMessage(target.blockType, target.containerLabel));
                    return;
                }
                if (target.kind === 'cell') {
                    self._insertChildIntoTableCell(target.cardIdx, target.rowIdx, target.colIdx, addType);
                } else if (target.kind === 'cell-active') {
                    var r = target.rowIdx !== undefined ? target.rowIdx : self._cellRow;
                    var c = target.colIdx !== undefined ? target.colIdx : self._cellCol;
                    self._insertChildIntoTableCell(target.cardIdx, r, c, addType);
                } else if (target.kind === 'callout') {
                    self._insertChildIntoCallout(target.cardIdx, addType);
                } else if (target.kind === 'card') {
                    self._addBlock(addType, target.cardIdx + (target.after ? 1 : 0));
                } else {
                    self._addBlock(addType, self._blocks.length);
                }
            });
        },

        _insertChildIntoTableCell: function (blkIdx, rowIdx, colIdx, paletteType) {
            var b = this._blocks[blkIdx];
            if (!b || b.type !== 'table' || !Array.isArray(b.rows)) return;
            var ch = createChildFromPaletteType(paletteType, false);
            if (!ch) {
                this._setStatus(this._invalidDropMessage(paletteType, 'Table cell'));
                return;
            }
            var r = Math.max(0, Math.min(b.rows.length - 1, rowIdx || 0));
            var c = Math.max(0, Math.min((b.align ? b.align.length - 1 : 0), colIdx || 0));
            var cell = b.rows[r] && b.rows[r][c];
            if (!cell) return;
            this._pushUndoState();
            var list = ensureCellChildren(cell);
            list.push(ch);
            if (b.headerless && r === 0) b.headerless = false;
            this._selectedBlock = blkIdx;
            this._cellRow = r;
            this._cellCol = c;
            this._selectedChildIndex = list.length - 1;
            this._commitBlocksToMarkdown({ flush: true });
            this._renderInspector();
            this._setStatus('Added nested ' + (CHILD_META[ch.type] ? CHILD_META[ch.type].label : ch.type) + ' to cell.');
        },

        _insertChildIntoCallout: function (blkIdx, paletteType) {
            var b = this._blocks[blkIdx];
            if (!b || b.type !== 'callout') return;
            var ch = createChildFromPaletteType(paletteType, true);
            if (!ch) {
                this._setStatus(this._invalidDropMessage(paletteType, 'Callout'));
                return;
            }
            this._pushUndoState();
            var list = ensureCalloutChildren(b);
            list.push(ch);
            this._selectedBlock = blkIdx;
            this._selectedChildIndex = list.length - 1;
            this._commitBlocksToMarkdown({ flush: true });
            this._renderInspector();
            this._setStatus('Added nested ' + (CHILD_META[ch.type] ? CHILD_META[ch.type].label : ch.type) + ' to callout.');
        },

        _moveCanvasBlockIntoContainer: function (srcIdx, target) {
            var srcBlock = this._blocks[srcIdx];
            if (!srcBlock || !target || target.cardIdx === srcIdx) return false;
            var dstBlock = this._blocks[target.cardIdx];
            if (!dstBlock) return false;
            var containerKind = (target.kind === 'callout') ? 'callout' : 'cell';
            var ch = convertBlockToChildBlock(srcBlock, containerKind);
            if (!ch) return false;

            this._pushUndoState();
            if (containerKind === 'callout' && dstBlock.type === 'callout') {
                var cList = ensureCalloutChildren(dstBlock);
                cList.push(ch);
                this._blocks.splice(srcIdx, 1);
                var nextCallIdx = target.cardIdx > srcIdx ? (target.cardIdx - 1) : target.cardIdx;
                this._selectedBlock = nextCallIdx;
                this._selectedChildIndex = cList.length - 1;
                this._commitBlocksToMarkdown({ flush: true });
                this._renderInspector();
                this._setStatus('Moved ' + (CHILD_META[ch.type] ? CHILD_META[ch.type].label : ch.type) + ' into Callout.');
                return true;
            }
            if (containerKind === 'cell' && dstBlock.type === 'table' && Array.isArray(dstBlock.rows) && dstBlock.rows.length) {
                var defRow = (dstBlock.headerless && dstBlock.rows.length > 1) ? 1 : 0;
                var reqR = target.rowIdx !== undefined ? target.rowIdx : defRow;
                var reqC = target.colIdx !== undefined ? target.colIdx : 0;
                var r = Math.max(0, Math.min(dstBlock.rows.length - 1, reqR));
                var c = Math.max(0, Math.min((dstBlock.align ? dstBlock.align.length - 1 : 0), reqC));
                var cell = dstBlock.rows[r] && dstBlock.rows[r][c];
                if (!cell) return false;
                var tList = ensureCellChildren(cell);
                tList.push(ch);
                if (dstBlock.headerless && r === 0) dstBlock.headerless = false;
                this._blocks.splice(srcIdx, 1);
                var nextTblIdx = target.cardIdx > srcIdx ? (target.cardIdx - 1) : target.cardIdx;
                this._selectedBlock = nextTblIdx;
                this._cellRow = r;
                this._cellCol = c;
                this._selectedChildIndex = tList.length - 1;
                this._commitBlocksToMarkdown({ flush: true });
                this._renderInspector();
                this._setStatus('Moved ' + (CHILD_META[ch.type] ? CHILD_META[ch.type].label : ch.type) + ' into Table cell.');
                return true;
            }
            return false;
        },

        _blockCardSummaryBadge: function (b) {
            if (!b) return '';
            switch (b.type) {
                case 'heading': return 'H' + (b.level || '2');
                case 'table':
                    var r = b.rows ? b.rows.length : 0;
                    var c = b.align ? b.align.length : 0;
                    return c + '\u00d7' + r + (b.headerless ? ' (no header)' : '');
                case 'callout':
                    var cCount = Array.isArray(b.children) ? b.children.length : 0;
                    var vLbl = b.variant === 'custom' ? (b.customColor || 'Custom') : ('Block ' + b.variant);
                    return vLbl + (cCount ? (' \u00b7 ' + cCount + (cCount === 1 ? ' item' : ' items')) : '');
                case 'list': return (b.ordered ? 'Numbered' : 'Bullets') + ' (' + (b.items ? b.items.length : 0) + ')';
                case 'icon': return b.weight && b.weight !== 'default' ? b.weight : 'Icon';
                case 'topic': return b.mode === 'formula' ? 'Formula' : 'Topic';
                case 'link': return b.linkType === 'help' ? 'Help' : 'URL';
                default: return '';
            }
        },

        _renderBlockCanvas: function () {
            var self = this;
            var canvas = this._blockCanvasEl;
            if (!canvas) return;
            this._destroyCanvasReorder();
            canvas.innerHTML = '';

            var previewBackdrop = resolveCssColor('@background') || '';
            var previewSurface = resolveCssColor('@surface') || '';
            if (previewBackdrop) canvas.style.setProperty('--tfe-card-preview-bg', previewSurface || previewBackdrop);

            if (!this._blocks.length) {
                var empty = el('div', 'tfe-canvas-empty');
                empty.innerHTML = '<div class="tfe-canvas-empty-ico"><i class="ph-bold ph-squares-four"></i></div>'
                    + '<div class="tfe-canvas-empty-title">Start building your Text Widget</div>'
                    + '<div class="tfe-canvas-empty-sub">Pick a block from the left palette or start from a quick template:</div>';
                var tmplRow = el('div', 'tfe-starter-grid');
                STARTER_TEMPLATES.forEach(function (tpl) {
                    var tb = el('button', 'tfe-starter-btn');
                    tb.type = 'button';
                    tb.innerHTML = '<i class="ph-bold ' + tpl.icon + '"></i><span>' + escHtml(tpl.label) + '</span>';
                    tb.addEventListener('click', function () {
                        self._pushUndoState();
                        self._blocks = MarkdownBlockCodec.parseMarkdownToBlocks(tpl.md);
                        self._selectedBlock = self._blocks.length ? 0 : -1;
                        self._cellRow = 0;
                        self._cellCol = 0;
                        self._selectedChildIndex = -1;
                        self._commitBlocksToMarkdown({ flush: true });
                        self._renderInspector();
                        self._setStatus('Loaded template: ' + tpl.label);
                    });
                    tmplRow.appendChild(tb);
                });
                empty.appendChild(tmplRow);
                canvas.appendChild(empty);
                return;
            }

            var listEl = el('div', 'tfe-block-list');
            this._blocks.forEach(function (b, idx) {
                listEl.appendChild(self._buildBlockCard(b, idx));
            });
            canvas.appendChild(listEl);

            var tailDrop = el('div', 'tfe-canvas-drop-tail', 'Drop a block here to append at the bottom');
            canvas.appendChild(tailDrop);

            if (typeof EditorReorder !== 'undefined' && typeof EditorReorder.attach === 'function') {
                this._canvasReorder = EditorReorder.attach(listEl, {
                    itemSelector: '.tfe-block-card',
                    handleSelector: '.tfe-block-handle',
                    onDragMove: function (oldIdx, clientX, clientY, dragEl) {
                        self._clearPaletteDropIndicators();
                        var dragged = self._blocks[oldIdx];
                        if (!dragged || !dragEl) return false;
                        var prevPe = dragEl.style.pointerEvents;
                        dragEl.style.pointerEvents = 'none';
                        var under = document.elementFromPoint(clientX, clientY);
                        dragEl.style.pointerEvents = prevPe;
                        var target = self._resolveCanvasDropTargetFromPoint(clientX, clientY, under, dragged.type, oldIdx);
                        if (target.kind === 'cell' || target.kind === 'cell-active' || target.kind === 'callout' || target.kind === 'invalid-container') {
                            self._applyCanvasDropTargetVisual(target);
                            if (target.kind === 'invalid-container') {
                                var msg = self._invalidDropMessage(target.blockType, target.containerLabel);
                                if (!self._statusTextEl || self._statusTextEl.textContent !== msg) {
                                    self._setStatus(msg);
                                }
                            }
                            return true;
                        }
                        return false;
                    },
                    onDragDrop: function (oldIdx, clientX, clientY, dragEl) {
                        self._clearPaletteDropIndicators();
                        var dragged = self._blocks[oldIdx];
                        if (!dragged) return false;
                        var under = null;
                        if (dragEl) {
                            var prevPe = dragEl.style.pointerEvents;
                            dragEl.style.pointerEvents = 'none';
                            under = document.elementFromPoint(clientX, clientY);
                            dragEl.style.pointerEvents = prevPe;
                        } else {
                            under = document.elementFromPoint(clientX, clientY);
                        }
                        var target = self._resolveCanvasDropTargetFromPoint(clientX, clientY, under, dragged.type, oldIdx);
                        if (target.kind === 'cell' || target.kind === 'cell-active' || target.kind === 'callout') {
                            return self._moveCanvasBlockIntoContainer(oldIdx, target);
                        }
                        if (target.kind === 'invalid-container') {
                            self._setStatus(self._invalidDropMessage(target.blockType, target.containerLabel));
                            return true;
                        }
                        return false;
                    },
                    onDragEnd: function () {
                        self._clearPaletteDropIndicators();
                    },
                    onReorder: function (from, to) {
                        self._clearPaletteDropIndicators();
                        self._moveBlock(from, to);
                    }
                });
            }
        },

        _buildBlockCard: function (b, idx) {
            var self = this;
            var meta = BLOCK_META[b.type] || { label: b.type, icon: 'ph-cube' };
            var isSel = idx === this._selectedBlock;
            var card = el('div', 'tfe-block-card' + (isSel ? ' is-selected' : ''));
            card.dataset.blockIndex = String(idx);
            card.dataset.blockType = b.type;

            var handle = el('div', 'tfe-block-handle');
            handle.title = canNestBlockType(b.type, 'cell')
                ? 'Drag to reorder, or drop into a Table cell / Callout'
                : 'Drag to reorder block';
            handle.innerHTML = '<i class="ph-bold ph-dots-six-vertical"></i>';

            var main = el('div', 'tfe-block-card-main');
            var bar = el('div', 'tfe-block-card-bar');
            var badge = this._blockCardSummaryBadge(b);
            var titleGrp = el('div', 'tfe-block-card-title');
            titleGrp.innerHTML = '<i class="ph-bold ' + meta.icon + '"></i><span>' + escHtml(meta.label) + '</span>'
                + '<span class="tfe-block-badge"' + (badge ? '' : ' hidden') + '>' + escHtml(badge) + '</span>';

            var acts = el('div', 'tfe-block-card-acts');
            var btnUp = el('button', 'tfe-card-act');
            btnUp.type = 'button';
            btnUp.title = 'Move up';
            btnUp.disabled = idx === 0;
            btnUp.innerHTML = '<i class="ph-bold ph-arrow-up"></i>';
            btnUp.addEventListener('click', function (e) { e.stopPropagation(); self._moveBlock(idx, idx - 1); });

            var btnDown = el('button', 'tfe-card-act');
            btnDown.type = 'button';
            btnDown.title = 'Move down';
            btnDown.disabled = idx === self._blocks.length - 1;
            btnDown.innerHTML = '<i class="ph-bold ph-arrow-down"></i>';
            btnDown.addEventListener('click', function (e) { e.stopPropagation(); self._moveBlock(idx, idx + 1); });

            var btnDup = el('button', 'tfe-card-act');
            btnDup.type = 'button';
            btnDup.title = 'Duplicate block';
            btnDup.innerHTML = '<i class="ph-bold ph-copy"></i>';
            btnDup.addEventListener('click', function (e) { e.stopPropagation(); self._duplicateBlock(idx); });

            var btnDel = el('button', 'tfe-card-act tfe-card-act--danger');
            btnDel.type = 'button';
            btnDel.title = 'Delete block';
            btnDel.innerHTML = '<i class="ph-bold ph-trash"></i>';
            btnDel.addEventListener('click', function (e) { e.stopPropagation(); self._deleteBlock(idx); });

            acts.appendChild(btnUp);
            acts.appendChild(btnDown);
            acts.appendChild(btnDup);
            acts.appendChild(btnDel);

            bar.appendChild(titleGrp);
            bar.appendChild(acts);

            var body = el('div', 'tfe-block-card-body');
            this._renderCardBody(b, idx, body);

            main.appendChild(bar);
            main.appendChild(body);
            card.appendChild(handle);
            card.appendChild(main);

            card.addEventListener('click', function (e) {
                var chip = e.target.closest('.tfe-card-nested-chip[data-child-idx]');
                if (chip) {
                    e.stopPropagation();
                    var stripEl = chip.closest('.tfe-card-nested-strip');
                    if (b.type === 'table' && stripEl && stripEl.dataset.rowIdx !== undefined) {
                        self._cellRow = parseInt(stripEl.dataset.rowIdx, 10) || 0;
                        self._cellCol = parseInt(stripEl.dataset.colIdx, 10) || 0;
                    }
                    self._selectedChildIndex = parseInt(chip.dataset.childIdx, 10);
                    self._selectBlock(idx, { preserveChild: true });
                    return;
                }
                var cell = e.target.closest('td, th');
                if (cell && b.type === 'table') {
                    var tbl = cell.closest('table');
                    var hasThead = !!(tbl && tbl.tHead && tbl.tHead.rows.length);
                    var domRow = cell.parentElement ? cell.parentElement.rowIndex : 0;
                    var nextRow = hasThead ? domRow : (domRow + 1);
                    var nextCol = cell.cellIndex || 0;
                    if (nextRow !== self._cellRow || nextCol !== self._cellCol || self._selectedBlock !== idx) {
                        self._cellRow = nextRow;
                        self._cellCol = nextCol;
                        self._selectedChildIndex = 0;
                    }
                }
                self._selectBlock(idx, { preserveChild: b.type === 'table' });
            });

            return card;
        },

        _renderCardNestedStrip: function (containerEl, b, idx) {
            var self = this;
            var isSel = idx === this._selectedBlock;
            var list = null;
            var labelPrefix = '';
            var dropKind = '';
            var cellRowIdx = 0;
            var cellColIdx = 0;

            if (b.type === 'callout') {
                list = ensureCalloutChildren(b);
                labelPrefix = 'Nested items';
                dropKind = 'callout';
            } else if (b.type === 'table' && Array.isArray(b.rows) && b.rows.length) {
                var defRow = (b.headerless && b.rows.length > 1) ? 1 : 0;
                cellRowIdx = isSel ? Math.max(0, Math.min(b.rows.length - 1, this._cellRow)) : defRow;
                cellColIdx = isSel ? Math.max(0, Math.min((b.align ? b.align.length - 1 : 0), this._cellCol)) : 0;
                var cell = b.rows[cellRowIdx] && b.rows[cellRowIdx][cellColIdx];
                if (!cell) return;
                list = ensureCellChildren(cell);
                labelPrefix = (cellRowIdx === 0 ? 'Header' : 'Row ' + cellRowIdx) + ' \u00b7 Col ' + (cellColIdx + 1);
                dropKind = 'cell';
            } else {
                return;
            }

            var strip = el('div', 'tfe-card-nested-strip');
            strip.dataset.dropKind = dropKind;
            if (dropKind === 'cell') {
                strip.dataset.rowIdx = String(cellRowIdx);
                strip.dataset.colIdx = String(cellColIdx);
            }

            var lbl = el('span', 'tfe-nested-strip-lbl', labelPrefix + ':');
            strip.appendChild(lbl);

            list.forEach(function (ch, ci) {
                var cm = CHILD_META[ch.type] || { label: ch.type, icon: 'ph-cube' };
                var chipActive = isSel && (self._selectedChildIndex === ci);
                var chip = el('button', 'tfe-card-nested-chip' + (chipActive ? ' is-active' : ''));
                chip.type = 'button';
                chip.dataset.childIdx = String(ci);
                chip.innerHTML = '<i class="ph-bold ' + cm.icon + '"></i><span>' + escHtml(summarizeChildItem(ch) || cm.label) + '</span>';
                strip.appendChild(chip);
            });

            var dropHint = el('span', 'tfe-nested-drop-hint', b.type === 'table' ? '+ Drop block into cell' : '+ Drop block inside');
            strip.appendChild(dropHint);

            containerEl.appendChild(strip);
        },

        _renderCardBody: function (b, idx, bodyEl) {
            bodyEl.innerHTML = '';
            var renderWrap = el('div', 'tfe-card-preview-render text-md-scoped text-md-root');
            bodyEl.appendChild(renderWrap);

            var md = MarkdownBlockCodec.blockToMarkdown(b);
            var isSel = idx === this._selectedBlock;
            var emptyHints = {
                image: 'Enter an image URL in the inspector.',
                icon: 'Pick a Phosphor icon in the inspector.',
                topic: 'Pick a topic or formula in the inspector.',
                link: 'Configure link label and destination.',
                callout: 'Drop items here or edit callout items in the inspector.'
            };
            this._renderPreviewInto(renderWrap, md, {
                emptyHint: emptyHints[b.type] || 'Empty block - edit in properties panel.',
                highlightCell: isSel && b.type === 'table',
                highlightRow: this._cellRow,
                highlightCol: this._cellCol
            });

            if (b.type === 'callout' || b.type === 'table') {
                this._renderCardNestedStrip(bodyEl, b, idx);
            }
        },

        _updateCardPreviewOnly: function (idx) {
            if (!this._blockCanvasEl) return;
            var card = this._blockCanvasEl.querySelector('.tfe-block-card[data-block-index="' + idx + '"]');
            if (!card) return;
            var b = this._blocks[idx];
            if (!b) return;
            var body = card.querySelector('.tfe-block-card-body');
            if (body) this._renderCardBody(b, idx, body);
            var badgeEl = card.querySelector('.tfe-block-badge');
            var badge = this._blockCardSummaryBadge(b);
            if (badgeEl) {
                badgeEl.textContent = badge;
                badgeEl.hidden = !badge;
            }
        },

        _addBlock: function (type, index) {
            this._pushUndoState();
            var idx = typeof index === 'number' ? Math.max(0, Math.min(this._blocks.length, index)) : this._blocks.length;
            this._blocks.splice(idx, 0, MarkdownBlockCodec.createDefaultBlock(type));
            this._selectedBlock = idx;
            this._cellRow = 0;
            this._cellCol = 0;
            this._selectedChildIndex = (type === 'callout' || type === 'table') ? 0 : -1;
            this._commitBlocksToMarkdown({ flush: true });
            this._renderInspector();
            this._scrollCardIntoView(idx);
        },

        _moveBlock: function (from, to) {
            if (from === to || from < 0 || to < 0 || from >= this._blocks.length || to >= this._blocks.length) return;
            this._pushUndoState();
            var moved = this._blocks.splice(from, 1)[0];
            this._blocks.splice(to, 0, moved);
            if (this._selectedBlock === from) this._selectedBlock = to;
            else if (from < this._selectedBlock && to >= this._selectedBlock) this._selectedBlock -= 1;
            else if (from > this._selectedBlock && to <= this._selectedBlock) this._selectedBlock += 1;
            this._commitBlocksToMarkdown({ flush: true });
            this._renderInspector();
        },

        _duplicateBlock: function (idx) {
            if (idx < 0 || idx >= this._blocks.length) return;
            this._pushUndoState();
            var copy = cloneData(this._blocks[idx]);
            copy.id = 'blk_dup_' + Date.now();
            this._blocks.splice(idx + 1, 0, copy);
            this._selectedBlock = idx + 1;
            this._selectedChildIndex = -1;
            this._commitBlocksToMarkdown({ flush: true });
            this._renderInspector();
            this._scrollCardIntoView(idx + 1);
        },

        _deleteBlock: function (idx) {
            if (idx < 0 || idx >= this._blocks.length) return;
            this._pushUndoState();
            this._blocks.splice(idx, 1);
            if (this._blocks.length === 0) {
                this._selectedBlock = -1;
            } else if (this._selectedBlock >= this._blocks.length) {
                this._selectedBlock = this._blocks.length - 1;
            }
            this._cellRow = 0;
            this._cellCol = 0;
            this._selectedChildIndex = -1;
            this._commitBlocksToMarkdown({ flush: true });
            this._renderInspector();
        },

        _selectBlock: function (idx, opts) {
            var o = opts || {};
            var changedBlock = (this._selectedBlock !== idx);
            if (changedBlock) {
                var b = this._blocks[idx];
                if (b && b.type === 'table') {
                    this._cellRow = Math.min(this._cellRow, (b.rows ? b.rows.length - 1 : 0));
                    this._cellCol = Math.min(this._cellCol, (b.align ? b.align.length - 1 : 0));
                    this._selectedChildIndex = 0;
                } else if (b && b.type === 'callout') {
                    this._cellRow = 0;
                    this._cellCol = 0;
                    if (!o.preserveChild) this._selectedChildIndex = 0;
                } else {
                    this._cellRow = 0;
                    this._cellCol = 0;
                    this._selectedChildIndex = -1;
                }
            }
            var prevSel = this._selectedBlock;
            this._selectedBlock = idx;
            if (this._blockCanvasEl) {
                var cards = this._blockCanvasEl.querySelectorAll('.tfe-block-card');
                for (var i = 0; i < cards.length; i++) {
                    var cIdx = parseInt(cards[i].dataset.blockIndex, 10);
                    cards[i].classList.toggle('is-selected', cIdx === idx);
                }
                if (prevSel >= 0 && prevSel !== idx && this._blocks[prevSel] && (this._blocks[prevSel].type === 'table' || this._blocks[prevSel].type === 'callout')) {
                    this._updateCardPreviewOnly(prevSel);
                }
                var blk = this._blocks[idx];
                if (blk && (blk.type === 'table' || blk.type === 'callout')) {
                    this._updateCardPreviewOnly(idx);
                }
            }
            this._renderInspector();
        },

        _scrollCardIntoView: function (idx) {
            if (!this._blockCanvasEl) return;
            var card = this._blockCanvasEl.querySelector('.tfe-block-card[data-block-index="' + idx + '"]');
            if (card && typeof card.scrollIntoView === 'function') {
                card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        },

        // =====================================================================
        // Block Mode: Right Properties Inspector
        // =====================================================================

        _cleanupInspectorResources: function () {
            for (var i = 0; i < this._inspectorColorPickers.length; i++) {
                var p = this._inspectorColorPickers[i];
                if (p && typeof p.destroy === 'function') p.destroy();
            }
            this._inspectorColorPickers = [];
            for (var r = 0; r < this._inspectorReorders.length; r++) {
                var ctrl = this._inspectorReorders[r];
                if (ctrl && typeof ctrl.destroy === 'function') ctrl.destroy();
            }
            this._inspectorReorders = [];
            if (this._inspectorEl && typeof Editor !== 'undefined' && typeof Editor._cleanupSubtreeDropdowns === 'function') {
                Editor._cleanupSubtreeDropdowns(this._inspectorEl);
            }
        },

        _renderInspector: function () {
            var self = this;
            var insp = this._inspectorEl;
            if (!insp) return;
            this._cleanupInspectorResources();
            insp.innerHTML = '';

            var b = (this._selectedBlock >= 0 && this._selectedBlock < this._blocks.length)
                ? this._blocks[this._selectedBlock]
                : null;

            if (!b) {
                var empty = el('div', 'tfe-insp-empty');
                empty.innerHTML = '<i class="ph-bold ph-cursor-click"></i><p>Select a block on the canvas to edit its properties.</p>';
                insp.appendChild(empty);
                return;
            }

            var meta = BLOCK_META[b.type] || { label: b.type, icon: 'ph-cube' };
            var hdr = el('div', 'tfe-insp-header');
            var title = el('div', 'tfe-insp-title');
            title.innerHTML = '<i class="ph-bold ' + meta.icon + '"></i><span>' + escHtml(meta.label) + ' Properties</span>';
            hdr.appendChild(title);
            insp.appendChild(hdr);

            var idx = this._selectedBlock;
            var content = el('div', 'tfe-insp-fields');
            switch (b.type) {
                case 'heading': this._renderHeadingInspector(content, b, idx); break;
                case 'text': this._renderTextInspector(content, b, idx); break;
                case 'list': this._renderListInspector(content, b, idx); break;
                case 'table': this._renderTableInspector(content, b, idx); break;
                case 'callout': this._renderCalloutInspector(content, b, idx); break;
                case 'icon': this._renderIconInspector(content, b, idx); break;
                case 'image': this._renderImageInspector(content, b, idx); break;
                case 'topic': this._renderTopicInspector(content, b, idx); break;
                case 'quote': this._renderQuoteInspector(content, b, idx); break;
                case 'code': this._renderCodeInspector(content, b, idx); break;
                case 'link': this._renderLinkInspector(content, b, idx); break;
                case 'rule':
                    content.appendChild(el('div', 'tfe-insp-note', 'Horizontal divider line (---). Color is controlled under Markdown \u2192 Horizontal Rule Color in the widget settings.'));
                    break;
            }
            insp.appendChild(content);
        },

        // ---- Inspector UI Field Helpers ----

        _inspFieldGroup: function (labelText, controlEl) {
            var grp = el('div', 'tfe-field');
            if (labelText) {
                var lbl = el('label', 'control-label tfe-field-label', labelText);
                grp.appendChild(lbl);
            }
            if (controlEl) grp.appendChild(controlEl);
            return grp;
        },

        _inspTextInput: function (value, placeholder, onInput, opts) {
            var inp = el('input', 'control-input');
            inp.type = (opts && opts.numeric) ? 'number' : 'text';
            if (opts && opts.min !== undefined) inp.min = String(opts.min);
            if (opts && opts.max !== undefined) inp.max = String(opts.max);
            if (opts && opts.step !== undefined) inp.step = String(opts.step);
            inp.placeholder = placeholder || '';
            inp.value = value == null ? '' : String(value);
            inp.addEventListener('input', function () {
                onInput(inp.value);
            });
            return inp;
        },

        _inspTextarea: function (value, placeholder, rows, onInput) {
            var ta = el('textarea', 'control-input tfe-insp-textarea');
            ta.rows = rows || 4;
            ta.placeholder = placeholder || '';
            ta.value = value == null ? '' : String(value);
            ta.addEventListener('input', function () {
                onInput(ta.value);
            });
            return ta;
        },

        _inspColorPicker: function (label, getRaw, setRaw, onAfter) {
            var self = this;
            var wrap = el('div', 'tfe-field');
            if (label) wrap.appendChild(el('label', 'control-label tfe-field-label', label));
            var row = el('div', 'tfe-color-row');
            var mount = el('div', 'tfe-color-mount');
            var clearBtn = el('button', 'tfe-mini-clear-btn', 'Clear');
            clearBtn.type = 'button';

            var syncClear = function () {
                clearBtn.hidden = !getRaw();
            };

            if (typeof EditorColorPicker !== 'undefined' && typeof EditorColorPicker.attach === 'function') {
                var picker = EditorColorPicker.attach({
                    mountCard: mount,
                    allowThemeTokens: true,
                    positionMode: 'anchor',
                    zIndex: 10060,
                    getRaw: function () { return getRaw() || ''; },
                    setValue: function (val) {
                        self._pushUndoState();
                        setRaw(val || '');
                        syncClear();
                        if (onAfter) onAfter();
                    },
                    onClear: function () {
                        self._pushUndoState();
                        setRaw('');
                        syncClear();
                        if (onAfter) onAfter();
                    }
                });
                this._inspectorColorPickers.push(picker);
                clearBtn.addEventListener('click', function () {
                    self._pushUndoState();
                    setRaw('');
                    picker.sync();
                    syncClear();
                    if (onAfter) onAfter();
                });
            } else {
                var fallback = this._inspTextInput(getRaw(), '#hex or @token', function (v) {
                    setRaw(v);
                    syncClear();
                    if (onAfter) onAfter();
                });
                mount.appendChild(fallback);
            }

            syncClear();
            row.appendChild(mount);
            row.appendChild(clearBtn);
            wrap.appendChild(row);
            return wrap;
        },

        _inspToggleChips: function (defs) {
            var row = el('div', 'tfe-chip-row');
            defs.forEach(function (d) {
                var b = el('button', 'tfe-chip-btn' + (d.active ? ' is-active' : ''));
                b.type = 'button';
                if (d.title) b.title = d.title;
                b.setAttribute('aria-pressed', d.active ? 'true' : 'false');
                b.innerHTML = (d.icon ? '<i class="ph-bold ' + d.icon + '"></i>' : '') + '<span>' + escHtml(d.label) + '</span>';
                b.addEventListener('click', function () {
                    d.onToggle();
                });
                row.appendChild(b);
            });
            return row;
        },

        _inspSegmented: function (options, currentVal, onSelect) {
            var seg = el('div', 'tfe-mini-seg tfe-mini-seg--full');
            options.forEach(function (o) {
                var btn = el('button', 'tfe-mini-seg-btn' + (o.value === currentVal ? ' is-active' : ''));
                btn.type = 'button';
                if (o.title) btn.title = o.title;
                btn.innerHTML = (o.icon ? '<i class="ph-bold ' + o.icon + '"></i>' : '') + (o.text ? '<span>' + escHtml(o.text) + '</span>' : '');
                btn.addEventListener('click', function () {
                    onSelect(o.value);
                });
                seg.appendChild(btn);
            });
            return seg;
        },

        _inspSelect: function (options, currentVal, onChange) {
            if (typeof Editor !== 'undefined' && typeof Editor.createCustomSelect === 'function') {
                var sel = Editor.createCustomSelect(options, currentVal);
                sel.onchange = function () {
                    onChange(sel.value);
                };
                return sel;
            }
            var native = el('select', 'control-input');
            options.forEach(function (o) {
                var opt = el('option', '', o.text);
                opt.value = o.value;
                if (o.value === currentVal) opt.selected = true;
                native.appendChild(opt);
            });
            native.addEventListener('change', function () { onChange(native.value); });
            return native;
        },

        /** Unified inline formatting & token inserter bar mounted above text inputs. */
        _buildInlineMiniBar: function (inputEl, onModelCommit, opts) {
            var self = this;
            var o = opts || {};
            var mObj = o.modelObj || null;
            var bar = el('div', 'tfe-inline-bar');

            var applyFn = function (op) {
                self._pushUndoState();
                var t = inputEl.value;
                var a = inputEl.selectionStart != null ? inputEl.selectionStart : t.length;
                var b = inputEl.selectionEnd != null ? inputEl.selectionEnd : t.length;
                var r = op(t, a, b);
                if (!r) return;
                inputEl.value = r.text;
                if (r.start !== undefined && r.end !== undefined) {
                    inputEl.selectionStart = r.start;
                    inputEl.selectionEnd = r.end;
                } else if (r.cursor !== undefined) {
                    inputEl.selectionStart = r.cursor;
                    inputEl.selectionEnd = r.selEnd != null ? r.selEnd : r.cursor;
                }
                onModelCommit(inputEl.value);
                inputEl.focus();
            };

            var addMini = function (icon, tip, fn, active) {
                var b = el('button', 'tfe-inline-btn' + (active ? ' is-active' : ''));
                b.type = 'button';
                b.title = tip;
                b.innerHTML = '<i class="ph-bold ' + icon + '"></i>';
                b.addEventListener('click', function (e) { e.preventDefault(); fn(b); });
                bar.appendChild(b);
                return b;
            };

            var addStyleBtn = function (icon, tip, prop, opFn) {
                var isAct = !!(mObj && mObj[prop]);
                addMini(icon, tip + (mObj ? ' (applies to selection, or toggles whole item when unselected)' : ''), function (btn) {
                    var a = inputEl.selectionStart;
                    var b = inputEl.selectionEnd;
                    if (mObj && (a == null || b == null || a === b)) {
                        self._pushUndoState();
                        mObj[prop] = !mObj[prop];
                        btn.classList.toggle('is-active', !!mObj[prop]);
                        onModelCommit(inputEl.value);
                        return;
                    }
                    applyFn(opFn);
                }, isAct);
            };

            addStyleBtn('ph-text-b', 'Bold', 'bold', function (t, a, b) { return MarkdownTextOps.wrapBold(t, a, b); });
            addStyleBtn('ph-text-italic', 'Italic', 'italic', function (t, a, b) { return MarkdownTextOps.wrapItalic(t, a, b); });
            addStyleBtn('ph-text-strikethrough', 'Strikethrough', 'strike', function (t, a, b) { return MarkdownTextOps.wrapStrikethrough(t, a, b); });
            addMini('ph-code', 'Inline code (`code`)', function () {
                applyFn(function (t, a, b) { return MarkdownTextOps.wrapInlineCode(t, a, b); });
            });
            if (!o.noColor) {
                addMini('ph-palette', 'Color selection ([color @accent]...[/color])', function (btn) {
                    self._openInlineColorPopover(btn, function (colSpec) {
                        applyFn(function (t, a, b) { return MarkdownTextOps.wrapTextColor(t, a, b, colSpec); });
                    });
                });
            }
            addMini('ph-star', 'Insert inline Phosphor icon', function () {
                if (typeof Dashboard === 'undefined' || typeof Dashboard.openIconBrowser !== 'function') return;
                var a = inputEl.selectionStart != null ? inputEl.selectionStart : inputEl.value.length;
                var b = inputEl.selectionEnd != null ? inputEl.selectionEnd : inputEl.value.length;
                Dashboard.openIconBrowser('ph-star', function (iconName) {
                    if (!iconName) return;
                    self._pushUndoState();
                    var r = MarkdownTextOps.insertText(inputEl.value, a, b, ':' + iconName + ':');
                    inputEl.value = r.text;
                    inputEl.selectionStart = r.cursor;
                    inputEl.selectionEnd = r.selEnd;
                    onModelCommit(inputEl.value);
                });
            });
            addMini('ph-brackets-curly', 'Insert {{topic}} at cursor', function (btn) {
                var a = inputEl.selectionStart != null ? inputEl.selectionStart : inputEl.value.length;
                var b = inputEl.selectionEnd != null ? inputEl.selectionEnd : inputEl.value.length;
                self._openInlineTopicPopover(btn, function (topicPath) {
                    self._pushUndoState();
                    var r = MarkdownTextOps.insertText(inputEl.value, a, b, '{{' + topicPath + '}}');
                    inputEl.value = r.text;
                    inputEl.selectionStart = r.cursor;
                    inputEl.selectionEnd = r.selEnd;
                    onModelCommit(inputEl.value);
                });
            });
            if (!o.noLink) {
                addMini('ph-link', 'Insert link at cursor', function (btn) {
                    var a = inputEl.selectionStart != null ? inputEl.selectionStart : inputEl.value.length;
                    var b = inputEl.selectionEnd != null ? inputEl.selectionEnd : inputEl.value.length;
                    self._openLinkPopover(btn, function (url, newTab, lbl) {
                        self._pushUndoState();
                        var r = MarkdownTextOps.insertLink(inputEl.value, a, b, url, newTab, lbl);
                        inputEl.value = r.text;
                        inputEl.selectionStart = r.start;
                        inputEl.selectionEnd = r.end;
                        onModelCommit(inputEl.value);
                    });
                });
            }
            return bar;
        },

        _buildBlinkSection: function (obj, idx, onToggleRefresh) {
            var self = this;
            var wrap = el('div', 'tfe-field-stack');
            wrap.appendChild(this._inspToggleChips([
                {
                    label: 'Blink',
                    icon: 'ph-pulse',
                    active: !!obj.blink,
                    onToggle: function () {
                        self._pushUndoState();
                        obj.blink = !obj.blink;
                        self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                        onToggleRefresh();
                    }
                }
            ]));
            if (obj.blink) {
                wrap.appendChild(this._inspFieldGroup('Blink Cycle (seconds)', this._inspTextInput(
                    obj.blinkSpeed,
                    '1 (0.5 - 8)',
                    function (v) {
                        self._scheduleTypingCheckpoint();
                        obj.blinkSpeed = v;
                        self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
                    },
                    { numeric: true, min: 0.5, max: 8, step: 0.1 }
                )));
            }
            return wrap;
        },

        // ---- Specific Block Inspectors ----

        _renderHeadingInspector: function (parent, b, idx) {
            this._renderHeadingFields(parent, b, idx);
        },

        _renderTextInspector: function (parent, b, idx) {
            this._renderTextFields(parent, b, idx, { rows: 5, label: 'Content' });
        },

        _renderListInspector: function (parent, b, idx) {
            var self = this;
            parent.appendChild(this._inspFieldGroup('List Style', this._inspSegmented([
                { value: 'bullet', text: 'Bullets', icon: 'ph-list-bullets' },
                { value: 'ordered', text: 'Numbered', icon: 'ph-list-numbers' }
            ], b.ordered ? 'ordered' : 'bullet', function (v) {
                self._pushUndoState();
                b.ordered = (v === 'ordered');
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            })));

            var items = Array.isArray(b.items) ? b.items : (b.items = []);
            var listWrap = el('div', 'tfe-list-items');
            items.forEach(function (it, iIdx) {
                var row = el('div', 'tfe-list-item-row');
                var hnd = el('span', 'tfe-list-item-handle');
                hnd.innerHTML = '<i class="ph-bold ph-dots-six-vertical"></i>';
                hnd.title = 'Drag to reorder item';

                var icoBtn = el('button', 'tfe-list-item-ico' + (it.icon ? ' has-icon' : ''));
                icoBtn.type = 'button';
                icoBtn.title = it.icon ? ('Icon: ' + it.icon + ' (click to change, right-click to clear)') : 'Pick optional leading icon';
                icoBtn.innerHTML = it.icon ? ('<i class="ph-bold ' + escHtml(it.icon) + '"></i>') : '<i class="ph-bold ph-star"></i>';
                icoBtn.addEventListener('click', function () {
                    if (typeof Dashboard === 'undefined' || typeof Dashboard.openIconBrowser !== 'function') return;
                    Dashboard.openIconBrowser(it.icon || 'ph-check', function (chosen) {
                        if (!chosen) return;
                        self._pushUndoState();
                        it.icon = chosen;
                        self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                        self._renderInspector();
                    });
                });
                icoBtn.addEventListener('contextmenu', function (e) {
                    e.preventDefault();
                    if (!it.icon) return;
                    self._pushUndoState();
                    it.icon = '';
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                    self._renderInspector();
                });

                var inp = self._inspTextInput(it.text, 'List item text', function (v) {
                    self._scheduleTypingCheckpoint();
                    it.text = v;
                    self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
                });

                var del = el('button', 'tfe-card-act tfe-card-act--danger');
                del.type = 'button';
                del.title = 'Remove item';
                del.disabled = items.length <= 1;
                del.innerHTML = '<i class="ph-bold ph-x"></i>';
                del.addEventListener('click', function () {
                    self._pushUndoState();
                    items.splice(iIdx, 1);
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                    self._renderInspector();
                });

                row.appendChild(hnd);
                row.appendChild(icoBtn);
                row.appendChild(inp);
                row.appendChild(del);
                listWrap.appendChild(row);
            });

            if (typeof EditorReorder !== 'undefined' && typeof EditorReorder.attach === 'function') {
                this._inspectorReorders.push(EditorReorder.attach(listWrap, {
                    itemSelector: '.tfe-list-item-row',
                    handleSelector: '.tfe-list-item-handle',
                    onReorder: function (from, to) {
                        self._pushUndoState();
                        var moved = items.splice(from, 1)[0];
                        items.splice(to, 0, moved);
                        self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                        self._renderInspector();
                    }
                }));
            }

            parent.appendChild(this._inspFieldGroup('Items (' + items.length + ')', listWrap));

            var addItemBtn = el('button', 'btn-tool tfe-full-btn');
            addItemBtn.type = 'button';
            addItemBtn.innerHTML = '<i class="ph-bold ph-plus"></i><span>Add List Item</span>';
            addItemBtn.addEventListener('click', function () {
                self._pushUndoState();
                items.push({ text: 'New item', icon: '', color: '', bold: false, italic: false, strike: false });
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            });
            parent.appendChild(addItemBtn);
        },

        _renderHeadingFields: function (parent, obj, idx) {
            var self = this;
            parent.appendChild(this._inspFieldGroup('Heading Level', this._inspSegmented([
                { value: '1', text: 'H1' },
                { value: '2', text: 'H2' },
                { value: '3', text: 'H3' }
            ], obj.level || '2', function (lvl) {
                self._pushUndoState();
                obj.level = lvl;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            })));

            var inp = this._inspTextInput(obj.text, 'Heading text', function (v) {
                self._scheduleTypingCheckpoint();
                obj.text = v;
                self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
            });
            var textGrp = el('div', 'tfe-field');
            textGrp.appendChild(el('label', 'control-label tfe-field-label', 'Heading Text'));
            textGrp.appendChild(this._buildInlineMiniBar(inp, function (v) {
                obj.text = v;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
            }, { modelObj: obj }));
            textGrp.appendChild(inp);
            parent.appendChild(textGrp);

            parent.appendChild(this._inspColorPicker('Text Color', function () { return obj.color; }, function (v) { obj.color = v; }, function () {
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
            }));

            parent.appendChild(this._buildBlinkSection(obj, idx, function () { self._renderInspector(); }));
        },

        _renderTextFields: function (parent, obj, idx, opts) {
            var self = this;
            var o = opts || {};
            var ta = this._inspTextarea(obj.text, o.placeholder || 'Enter text or inline markdown...', o.rows || 4, function (v) {
                self._scheduleTypingCheckpoint();
                obj.text = v;
                self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
            });
            var textGrp = el('div', 'tfe-field');
            textGrp.appendChild(el('label', 'control-label tfe-field-label', o.label || 'Content'));
            textGrp.appendChild(this._buildInlineMiniBar(ta, function (v) {
                obj.text = v;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
            }, { modelObj: obj, noColor: o.noColor, noLink: o.noLink }));
            textGrp.appendChild(ta);
            parent.appendChild(textGrp);

            if (!o.noColor) {
                parent.appendChild(this._inspColorPicker('Text Color', function () { return obj.color; }, function (v) { obj.color = v; }, function () {
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                }));
            }

            if (!o.noBlink) {
                parent.appendChild(this._buildBlinkSection(obj, idx, function () { self._renderInspector(); }));
            }
        },

        _renderTableInspector: function (parent, b, idx) {
            var self = this;
            if (!Array.isArray(b.rows) || !b.rows.length) {
                b.rows = [[MarkdownBlockCodec.createDefaultCell('Col 1'), MarkdownBlockCodec.createDefaultCell('Col 2')]];
            }
            if (!Array.isArray(b.align) || !b.align.length) {
                b.align = b.rows[0].map(function () { return 'default'; });
            }
            if (this._cellRow < 0 || this._cellRow >= b.rows.length) this._cellRow = 0;
            if (this._cellCol < 0 || this._cellCol >= b.align.length) this._cellCol = 0;

            // Headerless toggle
            var hdrCheckWrap = el('label', 'tfe-checkbox-row');
            var hdrCb = el('input');
            hdrCb.type = 'checkbox';
            hdrCb.checked = !!b.headerless;
            hdrCb.addEventListener('change', function () {
                self._pushUndoState();
                b.headerless = hdrCb.checked;
                if (b.headerless && self._cellRow === 0 && b.rows.length > 1) self._cellRow = 1;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            });
            hdrCheckWrap.appendChild(hdrCb);
            hdrCheckWrap.appendChild(el('span', '', 'Headerless Table (hide header row)'));
            parent.appendChild(hdrCheckWrap);

            // Rows pills (Header + draggable body rows inline)
            var rowList = el('div', 'tfe-table-row-pills');
            var hdrBtn = el('button', 'tfe-row-pill' + (this._cellRow === 0 ? ' is-active' : '') + (b.headerless ? ' is-muted' : ''), b.headerless ? 'Header (Hidden)' : 'Header');
            hdrBtn.type = 'button';
            hdrBtn.addEventListener('click', function () {
                self._cellRow = 0;
                self._selectedChildIndex = 0;
                self._updateCardPreviewOnly(idx);
                self._renderInspector();
            });
            rowList.appendChild(hdrBtn);

            var bodyRowList = el('div', 'tfe-table-body-row-pills');
            for (var r = 1; r < b.rows.length; r++) {
                (function (rIdx) {
                    var rp = el('div', 'tfe-row-pill tfe-row-pill--body' + (rIdx === self._cellRow ? ' is-active' : ''));
                    var dh = el('span', 'tfe-row-pill-drag');
                    dh.innerHTML = '<i class="ph-bold ph-dots-six-vertical"></i>';
                    dh.title = 'Drag to reorder row';
                    var rb = el('button', 'tfe-row-pill-btn', 'Row ' + rIdx);
                    rb.type = 'button';
                    rb.addEventListener('click', function () {
                        self._cellRow = rIdx;
                        self._selectedChildIndex = 0;
                        self._updateCardPreviewOnly(idx);
                        self._renderInspector();
                    });
                    rp.appendChild(dh);
                    rp.appendChild(rb);
                    bodyRowList.appendChild(rp);
                })(r);
            }
            if (typeof EditorReorder !== 'undefined' && typeof EditorReorder.attach === 'function') {
                this._inspectorReorders.push(EditorReorder.attach(bodyRowList, {
                    itemSelector: '.tfe-row-pill--body',
                    handleSelector: '.tfe-row-pill-drag',
                    layout: 'grid',
                    onReorder: function (from, to) {
                        var realFrom = from + 1;
                        var realTo = to + 1;
                        self._pushUndoState();
                        var moved = b.rows.splice(realFrom, 1)[0];
                        b.rows.splice(realTo, 0, moved);
                        if (self._cellRow === realFrom) self._cellRow = realTo;
                        else if (realFrom < self._cellRow && realTo >= self._cellRow) self._cellRow -= 1;
                        else if (realFrom > self._cellRow && realTo <= self._cellRow) self._cellRow += 1;
                        self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                        self._renderInspector();
                    }
                }));
            }
            rowList.appendChild(bodyRowList);
            parent.appendChild(this._inspFieldGroup('Rows', rowList));

            var addUniformBtn = function (rowEl, lbl, icon, tip, disabled, danger, fn) {
                var bt = el('button', 'btn-tool tfe-uniform-btn' + (danger ? ' is-danger' : ''));
                bt.type = 'button';
                bt.disabled = !!disabled;
                if (tip) {
                    bt.title = tip;
                    bt.setAttribute('aria-label', tip);
                }
                bt.innerHTML = (icon ? '<i class="ph-bold ' + icon + '"></i>' : '') + (lbl ? '<span>' + escHtml(lbl) + '</span>' : '');
                bt.addEventListener('click', fn);
                rowEl.appendChild(bt);
            };

            var rowOps = el('div', 'tfe-uniform-btn-row tfe-cols-2');
            addUniformBtn(rowOps, 'Above', 'ph-plus', 'Insert row above selected row', b.rows.length >= 100 || this._cellRow === 0, false, function () {
                self._pushUndoState();
                var newRow = b.align.map(function () { return MarkdownBlockCodec.createDefaultCell(''); });
                b.rows.splice(self._cellRow, 0, newRow);
                self._selectedChildIndex = 0;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            });
            addUniformBtn(rowOps, 'Below', 'ph-plus', 'Insert row below selected row', b.rows.length >= 100, false, function () {
                self._pushUndoState();
                var newRow = b.align.map(function () { return MarkdownBlockCodec.createDefaultCell(''); });
                var insAt = self._cellRow + 1;
                b.rows.splice(insAt, 0, newRow);
                self._cellRow = insAt;
                self._selectedChildIndex = 0;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            });
            addUniformBtn(rowOps, 'Duplicate', 'ph-copy', 'Duplicate selected row', b.rows.length >= 100 || this._cellRow === 0, false, function () {
                self._pushUndoState();
                var copyRow = cloneData(b.rows[self._cellRow]);
                b.rows.splice(self._cellRow + 1, 0, copyRow);
                self._cellRow += 1;
                self._selectedChildIndex = 0;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            });
            addUniformBtn(rowOps, 'Delete', 'ph-trash', 'Delete selected row', this._cellRow === 0 || b.rows.length <= 2, true, function () {
                self._pushUndoState();
                b.rows.splice(self._cellRow, 1);
                self._cellRow = Math.min(self._cellRow, b.rows.length - 1);
                self._selectedChildIndex = 0;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            });
            parent.appendChild(rowOps);

            // Columns
            var colChoices = b.align.map(function (_, ci) {
                var hdrCell = b.rows[0] && b.rows[0][ci];
                var hKids = hdrCell ? ensureCellChildren(hdrCell) : [];
                var hdrSum = hKids.map(summarizeChildItem).filter(Boolean).join(' ').trim();
                var hdrPreview = hdrSum ? (' (' + hdrSum.slice(0, 14) + ')') : '';
                return { value: String(ci), text: 'Column ' + (ci + 1) + hdrPreview };
            });
            parent.appendChild(this._inspFieldGroup('Column', this._inspSelect(colChoices, String(this._cellCol), function (v) {
                self._cellCol = parseInt(v, 10) || 0;
                self._selectedChildIndex = 0;
                self._updateCardPreviewOnly(idx);
                self._renderInspector();
            })));
            parent.appendChild(this._inspFieldGroup('Column Alignment', this._inspSegmented([
                { value: 'default', icon: 'ph-dots-three', title: 'Default (---)' },
                { value: 'left', icon: 'ph-text-align-left', title: 'Left (:---)' },
                { value: 'center', icon: 'ph-text-align-center', title: 'Center (:---:)' },
                { value: 'right', icon: 'ph-text-align-right', title: 'Right (---:)' }
            ], b.align[this._cellCol] || 'default', function (al) {
                self._pushUndoState();
                b.align[self._cellCol] = al;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            })));

            var colOps = el('div', 'tfe-uniform-btn-row tfe-cols-2');
            addUniformBtn(colOps, 'Insert left', 'ph-plus', 'Insert column left', b.align.length >= 20, false, function () {
                self._pushUndoState();
                var insAt = self._cellCol;
                b.align.splice(insAt, 0, 'default');
                b.rows.forEach(function (rw, ri) {
                    rw.splice(insAt, 0, MarkdownBlockCodec.createDefaultCell(ri === 0 ? ('Col ' + b.align.length) : ''));
                });
                self._selectedChildIndex = 0;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            });
            addUniformBtn(colOps, 'Insert right', 'ph-plus', 'Insert column right', b.align.length >= 20, false, function () {
                self._pushUndoState();
                var insAt = self._cellCol + 1;
                b.align.splice(insAt, 0, 'default');
                b.rows.forEach(function (rw, ri) {
                    rw.splice(insAt, 0, MarkdownBlockCodec.createDefaultCell(ri === 0 ? ('Col ' + b.align.length) : ''));
                });
                self._cellCol = insAt;
                self._selectedChildIndex = 0;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            });
            addUniformBtn(colOps, 'Move left', 'ph-arrow-left', 'Move column left', this._cellCol <= 0, false, function () {
                self._pushUndoState();
                var from = self._cellCol;
                var to = from - 1;
                var tmpA = b.align[from]; b.align[from] = b.align[to]; b.align[to] = tmpA;
                b.rows.forEach(function (rw) { var tc = rw[from]; rw[from] = rw[to]; rw[to] = tc; });
                self._cellCol = to;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            });
            addUniformBtn(colOps, 'Move right', 'ph-arrow-right', 'Move column right', this._cellCol >= b.align.length - 1, false, function () {
                self._pushUndoState();
                var from = self._cellCol;
                var to = from + 1;
                var tmpA = b.align[from]; b.align[from] = b.align[to]; b.align[to] = tmpA;
                b.rows.forEach(function (rw) { var tc = rw[from]; rw[from] = rw[to]; rw[to] = tc; });
                self._cellCol = to;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            });
            addUniformBtn(colOps, 'Delete column', 'ph-trash', 'Delete column', b.align.length <= 1, true, function () {
                self._pushUndoState();
                b.align.splice(self._cellCol, 1);
                b.rows.forEach(function (rw) { rw.splice(self._cellCol, 1); });
                self._cellCol = Math.min(self._cellCol, b.align.length - 1);
                self._selectedChildIndex = 0;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            });
            parent.appendChild(colOps);

            // Selected Cell Card
            var cell = b.rows[this._cellRow][this._cellCol];
            ensureCellChildren(cell);
            var cellCard = el('div', 'tfe-subcard');
            var cellTitle = (this._cellRow === 0 ? 'Header' : 'Row ' + this._cellRow) + ' \u00b7 Column ' + (this._cellCol + 1);
            cellCard.appendChild(el('div', 'tfe-subcard-title', 'Selected Cell: ' + cellTitle));

            cellCard.appendChild(this._inspColorPicker('Cell Background', function () { return cell.background; }, function (v) { cell.background = v; }, function () {
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
            }));

            var fillRow = el('div', 'tfe-uniform-btn-row tfe-cols-2');
            addUniformBtn(fillRow, 'Fill Row', '', 'Apply this cell background across the row', false, false, function () {
                self._pushUndoState();
                b.rows[self._cellRow].forEach(function (cItem) { cItem.background = cell.background || ''; });
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
            });
            addUniformBtn(fillRow, 'Fill Column', '', 'Apply this cell background down the column', false, false, function () {
                self._pushUndoState();
                b.rows.forEach(function (rw) { if (rw[self._cellCol]) rw[self._cellCol].background = cell.background || ''; });
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
            });
            cellCard.appendChild(fillRow);

            this._renderNestedChildrenInspector(cellCard, cell, 'cell', idx);
            parent.appendChild(cellCard);
        },

        _renderCalloutInspector: function (parent, b, idx) {
            var self = this;
            var w = getTargetTextWidget();
            var c = w ? w.config : null;
            ensureCalloutChildren(b);

            var varGrid = el('div', 'tfe-callout-var-grid');
            ['1', '2', '3', '4', 'custom'].forEach(function (v) {
                var bt = el('button', 'tfe-callout-var-btn' + (b.variant === v ? ' is-active' : ''));
                bt.type = 'button';
                if (v === 'custom') {
                    bt.innerHTML = '<i class="ph-bold ph-palette"></i><span>Custom</span>';
                } else {
                    var tok = c && c['mdBlock' + v + 'Color'] ? c['mdBlock' + v + 'Color'] : ('@markerTint' + v);
                    var swCol = resolveCssColor(tok) || '#3b82f6';
                    bt.innerHTML = '<span class="tfe-callout-swatch" style="background:' + escHtml(swCol) + '"></span><span>Block ' + v + '</span>';
                }
                bt.addEventListener('click', function () {
                    self._pushUndoState();
                    b.variant = v;
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                    self._renderInspector();
                });
                varGrid.appendChild(bt);
            });
            parent.appendChild(this._inspFieldGroup('Callout Style', varGrid));

            if (b.variant === 'custom') {
                parent.appendChild(this._inspColorPicker('Custom Callout Color', function () { return b.customColor; }, function (v) { b.customColor = v || '@accent'; }, function () {
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                }));
            }

            if (b.variant !== 'custom') {
                parent.appendChild(this._buildBlinkSection(b, idx, function () { self._renderInspector(); }));
            }

            var nestedBox = el('div', 'tfe-subcard');
            nestedBox.appendChild(el('div', 'tfe-subcard-title', 'Callout Nested Items'));
            this._renderNestedChildrenInspector(nestedBox, b, 'callout', idx);
            parent.appendChild(nestedBox);
        },

        _renderNestedChildrenInspector: function (parentEl, containerObj, kind, blkIdx) {
            var self = this;
            var inCallout = (kind === 'callout');
            var children = inCallout ? ensureCalloutChildren(containerObj) : ensureCellChildren(containerObj);

            if (this._selectedChildIndex < 0 && children.length) this._selectedChildIndex = 0;
            if (this._selectedChildIndex >= children.length) this._selectedChildIndex = children.length - 1;

            var allowedTypes = inCallout
                ? ['text', 'icon', 'topic', 'image', 'link', 'code']
                : ['text', 'icon', 'topic', 'image', 'heading', 'link', 'code', 'callout'];

            var listWrap = el('div', 'tfe-nested-list');

            // Accept palette drops directly onto the nested list!
            listWrap.addEventListener('dragover', function (e) {
                var addType = self._getDraggedPaletteType(e);
                if (!addType) return;
                e.stopPropagation();
                listWrap.classList.remove('tfe-container-drop-target', 'tfe-drop-invalid');
                if (!canNestBlockType(addType, inCallout ? 'callout' : 'cell')) {
                    if (e.dataTransfer) {
                        try { e.dataTransfer.dropEffect = 'none'; } catch (err) { /* ignore */ }
                    }
                    listWrap.classList.add('tfe-drop-invalid');
                    var msg = self._invalidDropMessage(addType, inCallout ? 'Callout' : 'Table cell');
                    if (!self._statusTextEl || self._statusTextEl.textContent !== msg) {
                        self._setStatus(msg);
                    }
                    return;
                }
                e.preventDefault();
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
                listWrap.classList.add('tfe-container-drop-target');
            });
            listWrap.addEventListener('dragleave', function (e) {
                if (!listWrap.contains(e.relatedTarget)) {
                    listWrap.classList.remove('tfe-container-drop-target', 'tfe-drop-invalid');
                }
            });
            listWrap.addEventListener('drop', function (e) {
                var addType = self._getDraggedPaletteType(e);
                if (!addType) return;
                listWrap.classList.remove('tfe-container-drop-target', 'tfe-drop-invalid');
                var ch = createChildFromPaletteType(addType, inCallout);
                if (!ch) {
                    e.preventDefault();
                    e.stopPropagation();
                    self._paletteDragType = null;
                    self._clearPaletteDropIndicators();
                    self._setStatus(self._invalidDropMessage(addType, inCallout ? 'Callout' : 'Table cell'));
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                self._paletteDragType = null;
                self._clearPaletteDropIndicators();
                self._pushUndoState();
                children.push(ch);
                self._selectedChildIndex = children.length - 1;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: blkIdx });
                self._renderInspector();
            });

            if (!children.length) {
                listWrap.appendChild(el('div', 'tfe-nested-empty', 'Empty. Click an item below or drag from Blocks palette.'));
            } else {
                children.forEach(function (ch, ci) {
                    var cm = CHILD_META[ch.type] || { label: ch.type, icon: 'ph-cube' };
                    var row = el('div', 'tfe-nested-row' + (ci === self._selectedChildIndex ? ' is-active' : ''));
                    var hnd = el('span', 'tfe-nested-handle');
                    hnd.innerHTML = '<i class="ph-bold ph-dots-six-vertical"></i>';
                    hnd.title = 'Drag to reorder nested item';

                    var mainBtn = el('button', 'tfe-nested-main-btn');
                    mainBtn.type = 'button';
                    mainBtn.innerHTML = '<i class="ph-bold ' + cm.icon + '"></i>'
                        + '<span class="tfe-nested-type">' + escHtml(cm.label) + '</span>'
                        + '<span class="tfe-nested-summary">' + escHtml(summarizeChildItem(ch)) + '</span>';
                    mainBtn.addEventListener('click', function () {
                        self._selectedChildIndex = ci;
                        self._updateCardPreviewOnly(blkIdx);
                        self._renderInspector();
                    });

                    row.appendChild(hnd);
                    row.appendChild(mainBtn);

                    if (ci > 0) {
                        var flowBtn = el('button', 'tfe-nested-flow-btn' + (ch.newLine ? ' is-newline' : ''));
                        flowBtn.type = 'button';
                        flowBtn.title = ch.newLine ? 'Starts on new line (<br>). Click for inline.' : 'Inline next to previous. Click for new line (<br>).';
                        flowBtn.textContent = ch.newLine ? '\u21b5 Line' : '\u2192 Inline';
                        flowBtn.addEventListener('click', function (ev) {
                            ev.stopPropagation();
                            self._pushUndoState();
                            ch.newLine = !ch.newLine;
                            self._commitBlocksToMarkdown({ flush: true, cardIndex: blkIdx });
                            self._renderInspector();
                        });
                        row.appendChild(flowBtn);
                    }

                    var delBtn = el('button', 'tfe-card-act tfe-card-act--danger');
                    delBtn.type = 'button';
                    delBtn.title = 'Remove nested item';
                    delBtn.innerHTML = '<i class="ph-bold ph-x"></i>';
                    delBtn.addEventListener('click', function (ev) {
                        ev.stopPropagation();
                        self._pushUndoState();
                        children.splice(ci, 1);
                        if (self._selectedChildIndex >= children.length) {
                            self._selectedChildIndex = children.length - 1;
                        }
                        self._commitBlocksToMarkdown({ flush: true, cardIndex: blkIdx });
                        self._renderInspector();
                    });
                    row.appendChild(delBtn);

                    listWrap.appendChild(row);
                });

                if (typeof EditorReorder !== 'undefined' && typeof EditorReorder.attach === 'function') {
                    this._inspectorReorders.push(EditorReorder.attach(listWrap, {
                        itemSelector: '.tfe-nested-row',
                        handleSelector: '.tfe-nested-handle',
                        onReorder: function (from, to) {
                            self._pushUndoState();
                            var moved = children.splice(from, 1)[0];
                            children.splice(to, 0, moved);
                            if (self._selectedChildIndex === from) self._selectedChildIndex = to;
                            else if (from < self._selectedChildIndex && to >= self._selectedChildIndex) self._selectedChildIndex -= 1;
                            else if (from > self._selectedChildIndex && to <= self._selectedChildIndex) self._selectedChildIndex += 1;
                            self._commitBlocksToMarkdown({ flush: true, cardIndex: blkIdx });
                            self._renderInspector();
                        }
                    }));
                }
            }

            parentEl.appendChild(this._inspFieldGroup('Nested Items (' + children.length + ')', listWrap));

            var addBar = el('div', 'tfe-uniform-btn-row tfe-cols-2');
            allowedTypes.forEach(function (t) {
                var cm = CHILD_META[t];
                var addLabel = cm.label === 'Topic / Formula' ? 'Topic' : cm.label;
                var bAdd = el('button', 'btn-tool tfe-uniform-btn');
                bAdd.type = 'button';
                bAdd.title = 'Add ' + addLabel;
                bAdd.innerHTML = '<i class="ph-bold ' + cm.icon + '"></i><span>' + escHtml(addLabel) + '</span>';
                bAdd.addEventListener('click', function () {
                    self._pushUndoState();
                    children.push(MarkdownBlockCodec.createDefaultChildBlock(t));
                    self._selectedChildIndex = children.length - 1;
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: blkIdx });
                    self._renderInspector();
                });
                addBar.appendChild(bAdd);
            });
            parentEl.appendChild(addBar);

            var activeChild = (this._selectedChildIndex >= 0 && this._selectedChildIndex < children.length)
                ? children[this._selectedChildIndex]
                : null;
            if (activeChild) {
                var edBox = el('div', 'tfe-nested-editor-box');
                var acMeta = CHILD_META[activeChild.type] || { label: activeChild.type, icon: 'ph-cube' };
                var edTitle = el('div', 'tfe-nested-editor-title');
                edTitle.innerHTML = '<i class="ph-bold ' + acMeta.icon + '"></i><span>Edit ' + escHtml(acMeta.label) + ' #' + (this._selectedChildIndex + 1) + '</span>';
                edBox.appendChild(edTitle);
                this._renderNestedChildFields(edBox, activeChild, kind, blkIdx);
                parentEl.appendChild(edBox);
            }
        },

        _renderNestedChildFields: function (parent, ch, kind, idx) {
            var self = this;
            var inCallout = (kind === 'callout');
            switch (ch.type) {
                case 'heading':
                    this._renderHeadingFields(parent, ch, idx);
                    break;
                case 'icon':
                    this._renderIconFields(parent, ch, idx, {
                        nameKey: 'name', weightKey: 'weight', sizeKey: 'size', tintKey: 'tint', secKey: 'secondary', noLabel: false
                    });
                    break;
                case 'image':
                    this._renderImageFields(parent, ch, idx, {
                        urlKey: 'url', altKey: 'alt', widthKey: 'width', heightKey: 'height', tintKey: 'tint', noLink: inCallout
                    });
                    break;
                case 'topic':
                    this._renderTopicFields(parent, ch, idx, {
                        modeKey: 'mode', pathKey: 'path', formulaKey: 'formula', prefixKey: 'prefix', suffixKey: 'suffix'
                    });
                    break;
                case 'link':
                    this._renderLinkFields(parent, ch, idx, { inCallout: inCallout });
                    break;
                case 'code':
                    parent.appendChild(this._inspFieldGroup('Inline Code', this._inspTextInput(ch.code, 'code snippet', function (v) {
                        self._scheduleTypingCheckpoint();
                        ch.code = v;
                        self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
                    })));
                    break;
                case 'callout': {
                    var w = getTargetTextWidget();
                    var cfg = w ? w.config : null;
                    var varGrid = el('div', 'tfe-callout-var-grid');
                    ['1', '2', '3', '4', 'custom'].forEach(function (v) {
                        var bt = el('button', 'tfe-callout-var-btn' + (ch.variant === v ? ' is-active' : ''));
                        bt.type = 'button';
                        if (v === 'custom') {
                            bt.innerHTML = '<i class="ph-bold ph-palette"></i><span>Custom</span>';
                        } else {
                            var tok = cfg && cfg['mdBlock' + v + 'Color'] ? cfg['mdBlock' + v + 'Color'] : ('@markerTint' + v);
                            var swCol = resolveCssColor(tok) || '#3b82f6';
                            bt.innerHTML = '<span class="tfe-callout-swatch" style="background:' + escHtml(swCol) + '"></span><span>Block ' + v + '</span>';
                        }
                        bt.addEventListener('click', function () {
                            self._pushUndoState();
                            ch.variant = v;
                            self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                            self._renderInspector();
                        });
                        varGrid.appendChild(bt);
                    });
                    parent.appendChild(this._inspFieldGroup('Callout Style', varGrid));
                    if (ch.variant === 'custom') {
                        parent.appendChild(this._inspColorPicker('Custom Callout Color', function () { return ch.customColor; }, function (v) { ch.customColor = v || '@accent'; }, function () {
                            self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                        }));
                    }
                    var callTextChild = (Array.isArray(ch.children) && ch.children.length) ? ch.children[0] : null;
                    if (!callTextChild) {
                        ch.children = [MarkdownBlockCodec.createDefaultChildBlock('text', 'Note')];
                        callTextChild = ch.children[0];
                    }
                    var rawCallStr = MarkdownBlockCodec.serializeInlineChildrenToMarkdown(ch.children, { inCallout: true });
                    var cTa = this._inspTextarea(rawCallStr, 'Callout text or :ph-icon: + {{topic}}...', 2, function (v) {
                        self._scheduleTypingCheckpoint();
                        ch.children = MarkdownBlockCodec.parseInlineChildrenFromMarkdown(v, { inCallout: true });
                        self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
                    });
                    var cGrp = el('div', 'tfe-field');
                    cGrp.appendChild(el('label', 'control-label tfe-field-label', 'Callout Content'));
                    cGrp.appendChild(this._buildInlineMiniBar(cTa, function (v) {
                        ch.children = MarkdownBlockCodec.parseInlineChildrenFromMarkdown(v, { inCallout: true });
                        self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                    }, { noLink: true }));
                    cGrp.appendChild(cTa);
                    parent.appendChild(cGrp);
                    if (ch.variant !== 'custom') {
                        parent.appendChild(this._buildBlinkSection(ch, idx, function () { self._renderInspector(); }));
                    }
                    break;
                }
                case 'text':
                default:
                    this._renderTextFields(parent, ch, idx, {
                        label: inCallout ? 'Callout Text' : 'Cell Text',
                        placeholder: inCallout ? 'Callout text...' : 'Text (Enter = <br>)',
                        rows: 3,
                        noColor: false,
                        noLink: inCallout
                    });
                    break;
            }
        },

        _renderIconFields: function (parent, obj, idx, keys) {
            var self = this;
            var nameKey = keys.nameKey || 'name';
            var weightKey = keys.weightKey || 'weight';
            var sizeKey = keys.sizeKey || 'size';
            var tintKey = keys.tintKey || 'tint';
            var secKey = keys.secKey || 'secondary';

            var pickRow = el('div', 'tfe-icon-pick-row');
            var pickBtn = el('button', 'btn-tool tfe-icon-pick-btn');
            pickBtn.type = 'button';
            var curName = obj[nameKey] || 'ph-star';
            var wCls = (typeof BaseWidget !== 'undefined' && BaseWidget.phosphorWeightClass)
                ? BaseWidget.phosphorWeightClass(obj[weightKey] === 'default' ? 'regular' : obj[weightKey])
                : 'ph-bold';
            pickBtn.innerHTML = '<i class="' + wCls + ' ' + escHtml(curName) + '"></i><span>Browse Icons...</span>';
            pickBtn.addEventListener('click', function () {
                if (typeof Dashboard === 'undefined' || typeof Dashboard.openIconBrowser !== 'function') return;
                Dashboard.openIconBrowser(curName, function (chosen) {
                    if (!chosen) return;
                    self._pushUndoState();
                    obj[nameKey] = chosen;
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                    self._renderInspector();
                });
            });
            pickRow.appendChild(pickBtn);
            parent.appendChild(this._inspFieldGroup('Icon Glyph', pickRow));

            parent.appendChild(this._inspFieldGroup('Icon Slug', this._inspTextInput(obj[nameKey], 'ph-house', function (v) {
                self._scheduleTypingCheckpoint();
                obj[nameKey] = v;
                self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
            })));

            var pair = el('div', 'tfe-pair');
            pair.appendChild(this._inspFieldGroup('Style / Weight', this._inspSelect(WEIGHT_OPTIONS, obj[weightKey] || 'default', function (w) {
                self._pushUndoState();
                obj[weightKey] = w;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            })));
            pair.appendChild(this._inspFieldGroup('Size (px)', this._inspTextInput(obj[sizeKey], 'Auto', function (v) {
                self._scheduleTypingCheckpoint();
                obj[sizeKey] = v;
                self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
            }, { numeric: true, min: 1, max: 4096 })));
            parent.appendChild(pair);

            parent.appendChild(this._inspColorPicker('Icon Tint (Optional)', function () { return obj[tintKey]; }, function (v) { obj[tintKey] = v; }, function () {
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
            }));

            if (obj[weightKey] === 'duotone') {
                parent.appendChild(this._inspColorPicker('Duotone Accent Tint', function () { return obj[secKey]; }, function (v) { obj[secKey] = v; }, function () {
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                }));
            }

            if (!keys.noLabel) {
                parent.appendChild(this._inspFieldGroup('Trailing Label (Optional)', this._inspTextInput(obj.label, 'Optional text beside icon', function (v) {
                    self._scheduleTypingCheckpoint();
                    obj.label = v;
                    self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
                })));
            }
            parent.appendChild(this._buildBlinkSection(obj, idx, function () { self._renderInspector(); }));
        },

        _renderIconInspector: function (parent, b, idx) {
            this._renderIconFields(parent, b, idx, {});
        },

        _renderImageFields: function (parent, obj, idx, keys) {
            var self = this;
            var urlKey = keys.urlKey || 'url';
            var altKey = keys.altKey || 'alt';
            var widthKey = keys.widthKey || 'width';
            var heightKey = keys.heightKey || 'height';
            var tintKey = keys.tintKey || 'tint';

            var urlRow = el('div', 'tfe-url-row');
            var urlInp = this._inspTextInput(obj[urlKey], 'https://... or /images/photo.png', function (v) {
                self._scheduleTypingCheckpoint();
                obj[urlKey] = v;
                self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
            });
            urlRow.appendChild(urlInp);
            if (isHomeyEnv() && typeof ImageGallery !== 'undefined' && typeof ImageGallery.open === 'function') {
                var galBtn = el('button', 'btn-tool btn-tool-icon-only');
                galBtn.type = 'button';
                galBtn.title = 'Pick from Image Gallery';
                galBtn.innerHTML = '<i class="ph-bold ph-images-square"></i>';
                galBtn.addEventListener('click', function () {
                    ImageGallery.open({
                        pickMode: true,
                        pickFormat: 'url',
                        onPick: function (pickedUrl) {
                            if (!pickedUrl) return;
                            self._pushUndoState();
                            obj[urlKey] = pickedUrl;
                            urlInp.value = pickedUrl;
                            self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                        }
                    });
                });
                urlRow.appendChild(galBtn);
            }
            parent.appendChild(this._inspFieldGroup('Image URL', urlRow));

            parent.appendChild(this._inspFieldGroup('Alt Text', this._inspTextInput(obj[altKey], 'Image', function (v) {
                self._scheduleTypingCheckpoint();
                obj[altKey] = v;
                self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
            })));

            var sizePair = el('div', 'tfe-pair');
            sizePair.appendChild(this._inspFieldGroup('Width (px)', this._inspTextInput(obj[widthKey], 'Auto', function (v) {
                self._scheduleTypingCheckpoint();
                obj[widthKey] = v;
                self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
            }, { numeric: true, min: 1, max: 4096 })));
            sizePair.appendChild(this._inspFieldGroup('Height (px)', this._inspTextInput(obj[heightKey], 'Auto', function (v) {
                self._scheduleTypingCheckpoint();
                obj[heightKey] = v;
                self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
            }, { numeric: true, min: 1, max: 4096 })));
            parent.appendChild(sizePair);

            parent.appendChild(this._inspColorPicker('Silhouette Tint (Optional)', function () { return obj[tintKey]; }, function (v) { obj[tintKey] = v; }, function () {
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
            }));

            if (!keys.noLink) {
                parent.appendChild(this._inspFieldGroup('Click Link URL (Optional)', this._inspTextInput(obj.linkUrl, 'https://... (optional)', function (v) {
                    self._scheduleTypingCheckpoint();
                    obj.linkUrl = v;
                    self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
                })));
                var ntWrap = el('label', 'tfe-checkbox-row');
                var ntCb = el('input');
                ntCb.type = 'checkbox';
                ntCb.checked = !!obj.linkNewTab;
                ntCb.addEventListener('change', function () {
                    self._pushUndoState();
                    obj.linkNewTab = ntCb.checked;
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                });
                ntWrap.appendChild(ntCb);
                ntWrap.appendChild(el('span', '', 'Open link in new tab (^)'));
                parent.appendChild(ntWrap);
            }
        },

        _renderImageInspector: function (parent, b, idx) {
            this._renderImageFields(parent, b, idx, {});
        },

        _renderTopicFields: function (parent, obj, idx, keys) {
            var self = this;
            var modeKey = keys.modeKey || 'mode';
            var pathKey = keys.pathKey || 'path';
            var formulaKey = keys.formulaKey || 'formula';
            var prefixKey = keys.prefixKey || 'prefix';
            var suffixKey = keys.suffixKey || 'suffix';
            var curMode = obj[modeKey] === 'formula' ? 'formula' : 'topic';

            parent.appendChild(this._inspFieldGroup('Mode', this._inspSegmented([
                { value: 'topic', text: 'Live Topic', icon: 'ph-broadcast' },
                { value: 'formula', text: 'Payload Formula', icon: 'ph-function' }
            ], curMode, function (m) {
                self._pushUndoState();
                obj[modeKey] = m;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                self._renderInspector();
            })));

            var liveReadout = el('div', 'tfe-live-readout');
            var syncReadout = function () {
                if (curMode === 'topic') {
                    var val = getLiveTopicDisplay(obj[pathKey]);
                    liveReadout.innerHTML = val !== null
                        ? ('<span class="tfe-readout-lbl">Live value:</span> <code>' + escHtml(val) + '</code>')
                        : '<span class="tfe-readout-lbl">Live value:</span> <span class="tfe-readout-muted">No live data yet</span>';
                } else {
                    var ev = evaluateFormulaPreview(obj[formulaKey]);
                    liveReadout.innerHTML = ev.ok
                        ? ('<span class="tfe-readout-lbl">Evaluated:</span> <code>' + escHtml(ev.text) + '</code>')
                        : ('<span class="tfe-readout-lbl">Preview:</span> <span class="tfe-readout-muted">' + escHtml(ev.text) + '</span>');
                }
            };

            if (curMode === 'topic') {
                if (typeof Editor !== 'undefined' && typeof Editor.createTopicDropdown === 'function') {
                    var dd = Editor.createTopicDropdown(obj[pathKey] || '', 'Search topic...', function (val) {
                        self._pushUndoState();
                        obj[pathKey] = val;
                        syncReadout();
                        self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                    }, '', true, false, function (val) {
                        obj[pathKey] = val;
                        syncReadout();
                        self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                    }, { warnWhenEmpty: false });
                    parent.appendChild(this._inspFieldGroup('Topic Path', dd));
                } else {
                    parent.appendChild(this._inspFieldGroup('Topic Path', this._inspTextInput(obj[pathKey], 'homey/temp', function (v) {
                        self._scheduleTypingCheckpoint();
                        obj[pathKey] = v;
                        syncReadout();
                        self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
                    })));
                }
            } else {
                var fTa = this._inspTextarea(obj[formulaKey], 'if({{homey/temp}} > 20, "Hot", "Cold")', 3, function (v) {
                    self._scheduleTypingCheckpoint();
                    obj[formulaKey] = v;
                    syncReadout();
                    self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
                });
                parent.appendChild(this._inspFieldGroup('Formula Expression', fTa));

                if (typeof Editor !== 'undefined' && typeof Editor.createTopicDropdown === 'function') {
                    var insertTopicDd = Editor.createTopicDropdown('', 'Insert {{topic}} into formula...', function (val) {
                        if (!val) return;
                        self._pushUndoState();
                        var p = fTa.selectionStart != null ? fTa.selectionStart : fTa.value.length;
                        var r = MarkdownTextOps.insertText(fTa.value, p, fTa.selectionEnd != null ? fTa.selectionEnd : p, '{{' + val + '}}');
                        fTa.value = r.text;
                        obj[formulaKey] = r.text;
                        syncReadout();
                        self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                    }, '', true, true, null, { warnWhenEmpty: false });
                    parent.appendChild(this._inspFieldGroup('Insert Topic Reference', insertTopicDd));
                }

                var tmplOpts = [{ value: '', text: 'Choose a formula template...' }].concat(FORMULA_TEMPLATES.map(function (t, ti) {
                    return { value: String(ti), text: t.label };
                }));
                parent.appendChild(this._inspFieldGroup('Formula Templates', this._inspSelect(tmplOpts, '', function (ti) {
                    if (ti === '') return;
                    var tpl = FORMULA_TEMPLATES[Number(ti)];
                    if (!tpl) return;
                    self._pushUndoState();
                    fTa.value = tpl.expr;
                    obj[formulaKey] = tpl.expr;
                    syncReadout();
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                })));
            }

            syncReadout();
            parent.appendChild(liveReadout);

            var psPair = el('div', 'tfe-pair');
            psPair.appendChild(this._inspFieldGroup('Prefix', this._inspTextInput(obj[prefixKey], 'e.g. Temp: ', function (v) {
                self._scheduleTypingCheckpoint();
                obj[prefixKey] = v;
                self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
            })));
            psPair.appendChild(this._inspFieldGroup('Suffix', this._inspTextInput(obj[suffixKey], 'e.g.  \u00b0C', function (v) {
                self._scheduleTypingCheckpoint();
                obj[suffixKey] = v;
                self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
            })));
            parent.appendChild(psPair);

            parent.appendChild(this._inspColorPicker('Text Color', function () { return obj.color; }, function (v) { obj.color = v; }, function () {
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
            }));
            parent.appendChild(this._inspFieldGroup('Style', this._inspToggleChips([
                { label: 'Bold', icon: 'ph-text-b', active: !!obj.bold, onToggle: function () { self._pushUndoState(); obj.bold = !obj.bold; self._commitBlocksToMarkdown({ flush: true, cardIndex: idx }); self._renderInspector(); } },
                { label: 'Italic', icon: 'ph-text-italic', active: !!obj.italic, onToggle: function () { self._pushUndoState(); obj.italic = !obj.italic; self._commitBlocksToMarkdown({ flush: true, cardIndex: idx }); self._renderInspector(); } }
            ])));
            parent.appendChild(this._buildBlinkSection(obj, idx, function () { self._renderInspector(); }));
        },

        _renderTopicInspector: function (parent, b, idx) {
            this._renderTopicFields(parent, b, idx, {});
        },

        _renderQuoteInspector: function (parent, b, idx) {
            var self = this;
            var ta = this._inspTextarea(b.text, 'Quoted text...', 4, function (v) {
                self._scheduleTypingCheckpoint();
                b.text = v;
                self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
            });
            var grp = el('div', 'tfe-field');
            grp.appendChild(el('label', 'control-label tfe-field-label', 'Quote Content'));
            grp.appendChild(this._buildInlineMiniBar(ta, function (v) {
                b.text = v;
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
            }));
            grp.appendChild(ta);
            parent.appendChild(grp);
        },

        _renderCodeInspector: function (parent, b, idx) {
            var self = this;
            var ta = this._inspTextarea(b.code, 'Monospace code block...', 6, function (v) {
                self._scheduleTypingCheckpoint();
                b.code = v;
                self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
            });
            ta.classList.add('tfe-mono-input');
            parent.appendChild(this._inspFieldGroup('Code Block', ta));
        },

        _renderLinkFields: function (parent, b, idx, opts) {
            var self = this;
            var o = opts || {};
            if (!o.inCallout) {
                parent.appendChild(this._inspFieldGroup('Link Target Type', this._inspSegmented([
                    { value: 'url', text: 'Web URL', icon: 'ph-globe' },
                    { value: 'help', text: 'In-App Help', icon: 'ph-book-open-text' }
                ], b.linkType || 'url', function (lt) {
                    self._pushUndoState();
                    b.linkType = lt;
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                    self._renderInspector();
                })));
            } else {
                b.linkType = 'url';
            }

            parent.appendChild(this._inspFieldGroup('Link Label', this._inspTextInput(b.label, 'Open Page', function (v) {
                self._scheduleTypingCheckpoint();
                b.label = v;
                self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
            })));

            if (b.linkType === 'help' && !o.inCallout) {
                var helpOpts = buildHelpTargetOptions();
                parent.appendChild(this._inspFieldGroup('Documentation Page', this._inspSelect(helpOpts, b.helpTopic || 'Widgets/text', function (val) {
                    self._pushUndoState();
                    b.helpTopic = val;
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                    self._renderInspector();
                })));
                parent.appendChild(this._inspFieldGroup('Help Path (help://...)', this._inspTextInput(b.helpTopic, 'Widgets/text#section', function (v) {
                    self._scheduleTypingCheckpoint();
                    b.helpTopic = v.replace(/^help:\/\//i, '');
                    self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
                })));
            } else {
                parent.appendChild(this._inspFieldGroup('Destination URL', this._inspTextInput(b.url, 'https://example.com', function (v) {
                    self._scheduleTypingCheckpoint();
                    b.url = v;
                    self._commitBlocksToMarkdown({ flush: false, cardIndex: idx });
                })));
                if (!o.inCallout) {
                    var ntWrap = el('label', 'tfe-checkbox-row');
                    var ntCb = el('input');
                    ntCb.type = 'checkbox';
                    ntCb.checked = !!b.newTab;
                    ntCb.addEventListener('change', function () {
                        self._pushUndoState();
                        b.newTab = ntCb.checked;
                        self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                    });
                    ntWrap.appendChild(ntCb);
                    ntWrap.appendChild(el('span', '', 'Open in new browser tab (^)'));
                    parent.appendChild(ntWrap);
                }
            }

            // Optional leading icon
            var icoRow = el('div', 'tfe-icon-pick-row');
            var pickBtn = el('button', 'btn-tool tfe-icon-pick-btn');
            pickBtn.type = 'button';
            pickBtn.innerHTML = b.icon
                ? ('<i class="ph-bold ' + escHtml(b.icon) + '"></i><span>' + escHtml(b.icon) + '</span>')
                : '<i class="ph-bold ph-star"></i><span>Add Leading Icon</span>';
            pickBtn.addEventListener('click', function () {
                if (typeof Dashboard === 'undefined' || typeof Dashboard.openIconBrowser !== 'function') return;
                Dashboard.openIconBrowser(b.icon || 'ph-arrow-square-out', function (chosen) {
                    if (!chosen) return;
                    self._pushUndoState();
                    b.icon = chosen;
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                    self._renderInspector();
                });
            });
            icoRow.appendChild(pickBtn);
            if (b.icon) {
                var clrIco = el('button', 'tfe-mini-clear-btn', 'Clear');
                clrIco.type = 'button';
                clrIco.addEventListener('click', function () {
                    self._pushUndoState();
                    b.icon = '';
                    self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
                    self._renderInspector();
                });
                icoRow.appendChild(clrIco);
            }
            parent.appendChild(this._inspFieldGroup('Leading Icon (Optional)', icoRow));

            parent.appendChild(this._inspColorPicker('Link Color', function () { return b.color; }, function (v) { b.color = v; }, function () {
                self._commitBlocksToMarkdown({ flush: true, cardIndex: idx });
            }));
            parent.appendChild(this._inspFieldGroup('Style', this._inspToggleChips([
                { label: 'Bold', icon: 'ph-text-b', active: !!b.bold, onToggle: function () { self._pushUndoState(); b.bold = !b.bold; self._commitBlocksToMarkdown({ flush: true, cardIndex: idx }); self._renderInspector(); } }
            ])));
        },

        _renderLinkInspector: function (parent, b, idx) {
            this._renderLinkFields(parent, b, idx, {});
        },

        // =====================================================================
        // Raw & WYSIWYG State, Toolbar Dispatchers, & Popovers
        // =====================================================================

        _bindTaInput: function () {
            var self = this;
            this._textarea.addEventListener('input', function () {
                self._markdown = self._textarea.value;
                self._syncToWidget(false);
                self._scheduleTypingCheckpoint();
                self._updateRawToolbarState();
                self._refreshLivePreviews();
                self._updateStatusBar();
            });
            var handler = function () {
                if (self._isWysiwygActive()) return;
                self._updateRawToolbarState();
            };
            this._boundCursorHandlers = handler;
            this._textarea.addEventListener('keyup', handler, false);
            this._textarea.addEventListener('mouseup', handler, false);
            this._textarea.addEventListener('click', handler, false);
            document.addEventListener('selectionchange', function () {
                if (document.activeElement === self._textarea) {
                    self._updateRawToolbarState();
                } else if (self._previewRootEl && self._root && !self._previewStage.hidden) {
                    var sel = window.getSelection();
                    if (sel && sel.rangeCount && self._previewRootEl.contains(sel.anchorNode)) {
                        self._captureWysiwygSelection();
                        self._updateRawToolbarState();
                    }
                }
            }, false);
        },

        _teardownRawCursorListeners: function () {
            if (this._boundCursorHandlers) {
                if (this._textarea) {
                    try {
                        this._textarea.removeEventListener('keyup', this._boundCursorHandlers, false);
                        this._textarea.removeEventListener('mouseup', this._boundCursorHandlers, false);
                        this._textarea.removeEventListener('click', this._boundCursorHandlers, false);
                    } catch (e) { /* ignore */ }
                }
            }
            this._boundCursorHandlers = null;
        },

        _isWysiwygActive: function () {
            if (this._mode === 'preview') return true;
            if (this._previewStage && !this._previewStage.hidden && this._previewRootEl) {
                if (document.activeElement === this._previewRootEl || this._previewRootEl.contains(document.activeElement)) {
                    return true;
                }
            }
            return false;
        },

        _getWysiwygSelectionRange: function () {
            if (!this._previewRootEl) return null;
            var sel = window.getSelection();
            if (sel && sel.rangeCount) {
                var r = sel.getRangeAt(0);
                if (this._previewRootEl.contains(r.commonAncestorContainer)) {
                    return r;
                }
            }
            if (this._savedWysiwygRange && this._previewRootEl.contains(this._savedWysiwygRange.commonAncestorContainer)) {
                return this._savedWysiwygRange;
            }
            return null;
        },

        _captureWysiwygSelection: function () {
            if (!this._previewRootEl) return;
            var sel = window.getSelection();
            if (sel && sel.rangeCount) {
                var r = sel.getRangeAt(0);
                if (this._previewRootEl.contains(r.commonAncestorContainer)) {
                    this._savedWysiwygRange = r.cloneRange();
                    this._wysiwygActiveTableInfo = this._computeWysiwygTableContext();
                    return;
                }
            }
            this._wysiwygActiveTableInfo = this._computeWysiwygTableContext();
        },

        _restoreWysiwygRange: function () {
            if (!this._previewRootEl) return null;
            this._previewRootEl.focus();
            var r = this._savedWysiwygRange;
            if (r && this._previewRootEl.contains(r.commonAncestorContainer)) {
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(r);
                return r;
            }
            return this._getWysiwygSelectionRange();
        },

        _getWysiwygCellElement: function () {
            var r = this._getWysiwygSelectionRange();
            if (!r) return null;
            var node = r.startContainer;
            var elNode = node && node.nodeType === 1 ? node : (node ? node.parentElement : null);
            var cell = elNode && elNode.closest ? elNode.closest('td, th') : null;
            return (cell && this._previewRootEl && this._previewRootEl.contains(cell)) ? cell : null;
        },

        _computeWysiwygTableContext: function () {
            var cell = this._getWysiwygCellElement();
            if (!cell || !this._previewRootEl) return null;
            var tbl = cell.closest('table');
            if (!tbl || !this._previewRootEl.contains(tbl)) return null;
            var tables = this._previewRootEl.querySelectorAll('table');
            var tblIdx = 0;
            for (var i = 0; i < tables.length; i++) {
                if (tables[i] === tbl) { tblIdx = i; break; }
            }
            var hasThead = !!(tbl.tHead && tbl.tHead.rows.length);
            var domRow = cell.parentElement ? cell.parentElement.rowIndex : 0;
            var modelRow = hasThead ? domRow : (domRow + 1);
            var colIdx = cell.cellIndex || 0;
            var aligns = [];
            try { aligns = JSON.parse(tbl.dataset.tfeColAligns || '[]'); } catch (e) { aligns = []; }
            return {
                tableEl: tbl,
                cellEl: cell,
                tableIdx: tblIdx,
                rowIdx: modelRow,
                colIdx: colIdx,
                align: aligns[colIdx] || cell.getAttribute('data-md-align') || 'default'
            };
        },

        _bindWysiwygEvents: function () {
            var self = this;
            var root = this._previewRootEl;
            if (!root) return;

            root.addEventListener('input', function () {
                if (self._wysiwygDebounceTimer) clearTimeout(self._wysiwygDebounceTimer);
                self._captureWysiwygSelection();
                self._commitWysiwygDomToMarkdown({ flush: false });
            });

            var onCaretMove = function () {
                self._captureWysiwygSelection();
                self._updateRawToolbarState();
            };
            root.addEventListener('keyup', onCaretMove);
            root.addEventListener('mouseup', onCaretMove);
            root.addEventListener('focus', onCaretMove);

            root.addEventListener('click', function (e) {
                var tok = e.target.closest('.tfe-wysiwyg-token');
                if (tok && root.contains(tok)) {
                    e.preventDefault();
                    e.stopPropagation();
                    self._openWysiwygTokenEditorPopover(tok);
                    return;
                }
                var iconEl = e.target.closest('i.text-md-ph-icon');
                if (iconEl && root.contains(iconEl) && !iconEl.closest('.tfe-wysiwyg-token')) {
                    e.preventDefault();
                    e.stopPropagation();
                    self._openWysiwygIconEditorPopover(iconEl);
                    return;
                }
                var imgEl = e.target.closest('img');
                if (imgEl && root.contains(imgEl) && !imgEl.closest('.tfe-wysiwyg-token')) {
                    e.preventDefault();
                    e.stopPropagation();
                    self._openWysiwygImageEditorPopover(imgEl);
                    return;
                }
                var linkEl = e.target.closest('a');
                if (linkEl && root.contains(linkEl) && !linkEl.closest('.tfe-wysiwyg-token')) {
                    e.preventDefault();
                    e.stopPropagation();
                    self._openWysiwygLinkEditorPopover(linkEl);
                    return;
                }
                onCaretMove();
            });
        },

        _bindWysiwygDragDrop: function () {
            var self = this;
            var root = this._previewRootEl;
            if (!root) return;

            var resolvePreviewDrop = function (e, addType) {
                var tbl = e.target && e.target.closest ? e.target.closest('table') : null;
                if (tbl && root.contains(tbl)) {
                    var cell = e.target.closest('td, th');
                    if (!cell || !tbl.contains(cell)) {
                        cell = self._findClosestTableCell(tbl, e.clientX, e.clientY);
                    }
                    if (!canNestBlockType(addType, 'cell')) {
                        return {
                            kind: 'invalid-container',
                            containerLabel: 'Table cell',
                            blockType: addType,
                            el: cell || tbl
                        };
                    }
                    if (cell && root.contains(cell)) {
                        var allTbls = root.querySelectorAll('table');
                        var tIdx = 0;
                        for (var ti = 0; ti < allTbls.length; ti++) {
                            if (allTbls[ti] === tbl) { tIdx = ti; break; }
                        }
                        var hasThead = !!(tbl.tHead && tbl.tHead.rows.length);
                        var domRow = cell.parentElement ? cell.parentElement.rowIndex : 0;
                        return {
                            kind: 'cell',
                            el: cell,
                            tableIdx: tIdx,
                            rowIdx: hasThead ? domRow : (domRow + 1),
                            colIdx: cell.cellIndex || 0
                        };
                    }
                }
                var calloutEl = e.target && e.target.closest ? e.target.closest('.text-md-block') : null;
                if (calloutEl && root.contains(calloutEl) && !calloutEl.closest('table')) {
                    if (!canNestBlockType(addType, 'callout')) {
                        return {
                            kind: 'invalid-container',
                            containerLabel: 'Callout',
                            blockType: addType,
                            el: calloutEl
                        };
                    }
                    var allCallouts = [];
                    var tops = root.querySelectorAll('.text-md-block');
                    for (var ci = 0; ci < tops.length; ci++) {
                        if (!tops[ci].closest('table')) allCallouts.push(tops[ci]);
                    }
                    var cIdx = allCallouts.indexOf(calloutEl);
                    if (cIdx >= 0) {
                        return { kind: 'callout', el: calloutEl, calloutIdx: cIdx };
                    }
                }
                return { kind: 'append' };
            };

            root.addEventListener('dragover', function (e) {
                var addType = self._getDraggedPaletteType(e);
                if (!addType) return;
                self._clearPaletteDropIndicators();
                var hit = resolvePreviewDrop(e, addType);
                if (hit.kind === 'invalid-container') {
                    if (e.dataTransfer) {
                        try { e.dataTransfer.dropEffect = 'none'; } catch (err) { /* ignore */ }
                    }
                    if (hit.el) hit.el.classList.add('tfe-drop-invalid');
                    var msg = self._invalidDropMessage(hit.blockType, hit.containerLabel);
                    if (!self._statusTextEl || self._statusTextEl.textContent !== msg) {
                        self._setStatus(msg);
                    }
                    return;
                }
                e.preventDefault();
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
                if (hit.kind === 'cell') hit.el.classList.add('tfe-cell-drop-target');
                else if (hit.kind === 'callout') hit.el.classList.add('tfe-container-drop-target');
            });

            root.addEventListener('dragleave', function (e) {
                if (!self._paletteDragType) return;
                if (!root.contains(e.relatedTarget)) {
                    self._clearPaletteDropIndicators();
                }
            });

            root.addEventListener('drop', function (e) {
                var addType = self._getDraggedPaletteType(e);
                if (!addType) return;
                e.preventDefault();
                self._paletteDragType = null;
                var hit = resolvePreviewDrop(e, addType);
                self._clearPaletteDropIndicators();

                if (hit.kind === 'invalid-container') {
                    self._setStatus(self._invalidDropMessage(hit.blockType, hit.containerLabel));
                    return;
                }
                if (hit.kind === 'cell') {
                    var blkIdx = self._findBlockIndexByTypeOccurrence('table', hit.tableIdx);
                    if (blkIdx >= 0) {
                        self._insertChildIntoTableCell(blkIdx, hit.rowIdx, hit.colIdx, addType);
                        self._renderBlockCanvas();
                        self._renderInspector();
                    }
                } else if (hit.kind === 'callout') {
                    var cBlkIdx = self._findBlockIndexByTypeOccurrence('callout', hit.calloutIdx);
                    if (cBlkIdx >= 0) {
                        self._insertChildIntoCallout(cBlkIdx, addType);
                        self._renderBlockCanvas();
                        self._renderInspector();
                    }
                } else {
                    self._addBlock(addType, self._blocks.length);
                    self._renderBlockCanvas();
                    self._renderInspector();
                }
            });
        },

        _findBlockIndexByTypeOccurrence: function (type, occIdx) {
            var count = 0;
            for (var i = 0; i < this._blocks.length; i++) {
                if (this._blocks[i] && this._blocks[i].type === type) {
                    if (count === occIdx) return i;
                    count += 1;
                }
            }
            return -1;
        },

        _reconstructIconTokenFromEl: function (elNode) {
            if (!elNode) return '';
            var cached = elNode.getAttribute('data-tfe-md');
            if (cached) return cached;
            var cls = elNode.className ? String(elNode.className).split(/\s+/) : [];
            var weight = '';
            var slug = '';
            for (var i = 0; i < cls.length; i++) {
                var c = cls[i];
                if (c === 'text-md-ph-icon' || !c) continue;
                if (c === 'ph') weight = 'ph';
                else if (/^ph-(thin|light|bold|fill|duotone)$/.test(c)) weight = c;
                else if (/^ph-[a-z0-9-]+$/.test(c)) slug = c;
            }
            if (!slug) return '';
            if (weight && weight !== 'ph') return ':' + weight + ' ' + slug + ':';
            if (weight === 'ph') return ':ph(ph ' + slug + '):';
            return ':' + slug + ':';
        },

        _reconstructImgTokenFromEl: function (imgEl) {
            if (!imgEl) return '';
            var cached = imgEl.getAttribute('data-tfe-md');
            if (cached) return cached;
            var src = imgEl.getAttribute('src') || '';
            var alt = imgEl.getAttribute('alt') || 'Image';
            var w = imgEl.style && imgEl.style.width ? String(parseInt(imgEl.style.width, 10) || '') : '';
            var h = imgEl.style && imgEl.style.height ? String(parseInt(imgEl.style.height, 10) || '') : '';
            var tint = imgEl.getAttribute('data-text-md-img-tint') || '';
            return MarkdownBlockCodec.imageObjToMd({ url: src, alt: alt, width: w, height: h, tint: tint });
        },

        _serializeWysiwygDomToMarkdown: function (rootEl) {
            var self = this;
            if (!rootEl) return '';

            var normTxt = function (s) {
                return String(s || '').replace(/\u200B/g, '').replace(/\u00A0/g, ' ');
            };

            var serInlineNodes = function (nodes, ctx) {
                var out = '';
                for (var i = 0; i < nodes.length; i++) {
                    out += serInline(nodes[i], ctx);
                }
                return out;
            };

            var serInline = function (node, ctx) {
                var o = ctx || {};
                if (!node) return '';
                if (node.nodeType === 3) {
                    var tv = normTxt(node.nodeValue);
                    if (o.inTableCell) {
                        tv = tv.replace(/\r\n?/g, ' ').replace(/\n/g, ' ').replace(/\|/g, '\\|');
                    }
                    return tv;
                }
                if (node.nodeType !== 1) return '';
                var tag = node.tagName.toLowerCase();

                if (tag === 'br') {
                    return o.inTableCell ? '<br>' : '\n';
                }
                if (node.classList && node.classList.contains('tfe-wysiwyg-token')) {
                    return node.getAttribute('data-tfe-token') || '';
                }
                if (tag === 'i' && node.classList && node.classList.contains('text-md-ph-icon')) {
                    return self._reconstructIconTokenFromEl(node);
                }
                if (tag === 'img') {
                    return self._reconstructImgTokenFromEl(node);
                }
                if (node.classList && node.classList.contains('text-md-block')) {
                    var blkInner = serInlineNodes(node.childNodes, { inTableCell: o.inTableCell, inCallout: true }).replace(/^\s+|\s+$/g, '').replace(/\]/g, '&#93;');
                    var customCol = node.getAttribute('data-text-md-block-color');
                    if (node.classList.contains('text-md-block-custom') && customCol) {
                        return '[block ' + customCol + ':' + blkInner + ']';
                    }
                    for (var vi = 1; vi <= 4; vi++) {
                        if (node.classList.contains('text-md-block-' + vi)) {
                            return '[block' + vi + ':' + blkInner + ']';
                        }
                    }
                    return '[block1:' + blkInner + ']';
                }
                if (node.classList && node.classList.contains('text-md-color')) {
                    var cSpec = node.getAttribute('data-text-md-col') || '';
                    var cInner = serInlineNodes(node.childNodes, o);
                    if (!cInner) return '';
                    return cSpec ? ('[color ' + cSpec + ']' + cInner + '[/color]') : cInner;
                }
                if (node.classList && node.classList.contains('text-md-blink')) {
                    var spd = node.getAttribute('data-text-md-blink') || '';
                    var bInner = serInlineNodes(node.childNodes, o);
                    if (!bInner) return '';
                    return '[blink' + (spd && spd !== '1' ? ' ' + spd : '') + ']' + bInner + '[/blink]';
                }

                var inner = serInlineNodes(node.childNodes, o);
                if (tag === 'strong' || tag === 'b') {
                    return inner.replace(/\s+/g, '') ? ('**' + inner + '**') : inner;
                }
                if (tag === 'em' || tag === 'i') {
                    return inner.replace(/\s+/g, '') ? ('*' + inner + '*') : inner;
                }
                if (tag === 's' || tag === 'del' || tag === 'strike') {
                    return inner.replace(/\s+/g, '') ? ('<s>' + inner + '</s>') : inner;
                }
                if (tag === 'code') {
                    return inner ? ('`' + inner + '`') : '';
                }
                if (tag === 'a') {
                    var href = node.getAttribute('href') || '';
                    var nt = (node.dataset && node.dataset.tfeNewtab === '1') || node.getAttribute('target') === '_blank';
                    var suffix = (nt && href.indexOf('help://') !== 0) ? ' ^' : '';
                    return '[' + inner + '](' + href + suffix + ')';
                }
                if (o.inTableCell && (tag === 'h1' || tag === 'h2' || tag === 'h3')) {
                    var lvlNum = parseInt(tag.charAt(1), 10) || 2;
                    return (Array(lvlNum + 1).join('#') + ' ' + inner.replace(/<br>/gi, ' ').trim());
                }
                if (tag === 'div' || tag === 'p') {
                    var sep = o.inTableCell ? '<br>' : '\n';
                    var trimmed = inner.replace(/(?:<br>)+$/i, '').replace(/\n+$/, '');
                    return trimmed ? (sep + trimmed) : '';
                }
                return inner;
            };

            var serTableCell = function (cellEl) {
                var bg = cellEl.dataset && cellEl.dataset.tfeCellBg ? cellEl.dataset.tfeCellBg : '';
                var prefix = bg ? ('[cell ' + bg + ']') : '';
                var parts = [];
                for (var ci = 0; ci < cellEl.childNodes.length; ci++) {
                    var ch = cellEl.childNodes[ci];
                    if (ch.nodeType === 1 && (/^(h1|h2|h3|p|div)$/i.test(ch.tagName) || (ch.classList && ch.classList.contains('text-md-block')))) {
                        var sub = serInline(ch, { inTableCell: true }).replace(/^(?:<br>)+/i, '').replace(/(?:<br>)+$/i, '').trim();
                        if (sub) parts.push({ isBlock: true, txt: sub });
                    } else {
                        var inl = serInline(ch, { inTableCell: true });
                        if (inl) parts.push({ isBlock: false, txt: inl });
                    }
                }
                var joined = '';
                for (var pi = 0; pi < parts.length; pi++) {
                    if (!pi) {
                        joined = parts[pi].txt;
                    } else if (parts[pi].isBlock || (parts[pi - 1].isBlock && parts[pi].txt !== '<br>')) {
                        if (joined && joined.slice(-4).toLowerCase() !== '<br>' && parts[pi].txt.slice(0, 4).toLowerCase() !== '<br>') {
                            joined += '<br>' + parts[pi].txt;
                        } else {
                            joined += parts[pi].txt;
                        }
                    } else {
                        joined += parts[pi].txt;
                    }
                }
                joined = joined.replace(/(?:<br>)+$/i, '').replace(/^(?:<br>)+/i, '').trim();
                return (prefix + joined) || ' ';
            };

            var serBlock = function (node) {
                if (!node) return '';
                if (node.nodeType === 3) {
                    return normTxt(node.nodeValue).trim();
                }
                if (node.nodeType !== 1) return '';
                if (node.classList && node.classList.contains('tfe-empty-block-hint')) return '';
                var tag = node.tagName.toLowerCase();

                if (/^h[1-6]$/.test(tag)) {
                    var lvl = Math.min(3, Math.max(1, parseInt(tag.charAt(1), 10) || 2));
                    var hTxt = serInlineNodes(node.childNodes, {}).replace(/\n/g, ' ').trim();
                    return hTxt ? (Array(lvl + 1).join('#') + ' ' + hTxt) : '';
                }
                if (tag === 'hr') {
                    return '---';
                }
                if (tag === 'blockquote') {
                    var qRaw = [];
                    for (var qi = 0; qi < node.childNodes.length; qi++) {
                        var qc = serBlock(node.childNodes[qi]);
                        if (qc) qRaw.push(qc);
                    }
                    var qStr = (qRaw.length ? qRaw.join('\n') : serInlineNodes(node.childNodes, {})).trim();
                    return qStr.split('\n').map(function (ln) { return '> ' + ln; }).join('\n');
                }
                if (tag === 'pre') {
                    var codeStr = normTxt(node.textContent || '').replace(/\n+$/, '');
                    return '```\n' + codeStr + '\n```';
                }
                if (tag === 'ul' || tag === 'ol') {
                    var ord = (tag === 'ol');
                    var listLines = [];
                    var lis = node.children;
                    var liNum = 0;
                    for (var li = 0; li < lis.length; li++) {
                        if (lis[li].tagName && lis[li].tagName.toLowerCase() === 'li') {
                            liNum += 1;
                            var lt = serInlineNodes(lis[li].childNodes, {}).replace(/\n+$/, '').trim();
                            listLines.push((ord ? (liNum + '. ') : '- ') + lt);
                        }
                    }
                    return listLines.join('\n');
                }
                if (tag === 'table') {
                    var headerless = node.dataset && node.dataset.tfeHeaderless === '1';
                    var storedAligns = [];
                    try { storedAligns = JSON.parse((node.dataset && node.dataset.tfeColAligns) || '[]'); } catch (e) { storedAligns = []; }
                    var rowsOut = [];
                    var hasThead = !!(node.tHead && node.tHead.rows.length);
                    var allRows = node.rows;
                    var maxCols = storedAligns.length || 1;
                    for (var ri = 0; ri < allRows.length; ri++) {
                        if (allRows[ri].cells.length > maxCols) maxCols = allRows[ri].cells.length;
                    }
                    var alignToSep = { default: '---', '': '---', left: ':---', center: ':---:', right: '---:' };

                    var hdrCells = [];
                    if (hasThead) {
                        var hRow = node.tHead.rows[0];
                        for (var hc = 0; hc < maxCols; hc++) {
                            hdrCells.push(hRow.cells[hc] ? serTableCell(hRow.cells[hc]) : ' ');
                            if (!storedAligns[hc] && hRow.cells[hc]) {
                                storedAligns[hc] = hRow.cells[hc].getAttribute('data-md-align') || 'default';
                            }
                        }
                    } else if (headerless) {
                        for (var eh = 0; eh < maxCols; eh++) hdrCells.push(' ');
                    } else if (allRows.length) {
                        var firstR = allRows[0];
                        for (var fc = 0; fc < maxCols; fc++) {
                            hdrCells.push(firstR.cells[fc] ? serTableCell(firstR.cells[fc]) : ' ');
                        }
                    }
                    rowsOut.push('| ' + hdrCells.join(' | ') + ' |');

                    var sepCells = [];
                    for (var sc = 0; sc < maxCols; sc++) {
                        sepCells.push(alignToSep[storedAligns[sc] || 'default'] || '---');
                    }
                    rowsOut.push('| ' + sepCells.join(' | ') + ' |');

                    var bodyStart = hasThead ? 1 : (headerless ? 0 : 1);
                    for (var br = bodyStart; br < allRows.length; br++) {
                        var domBr = allRows[br];
                        var bCells = [];
                        for (var bc = 0; bc < maxCols; bc++) {
                            bCells.push(domBr.cells[bc] ? serTableCell(domBr.cells[bc]) : ' ');
                        }
                        rowsOut.push('| ' + bCells.join(' | ') + ' |');
                    }
                    return rowsOut.join('\n');
                }
                if (node.classList && node.classList.contains('text-md-block')) {
                    return serInline(node, {});
                }
                if (node.classList && node.classList.contains('text-md-blink')) {
                    var bSpd = node.getAttribute('data-text-md-blink') || '';
                    var innerBlks = [];
                    for (var bi = 0; bi < node.childNodes.length; bi++) {
                        var part = serBlock(node.childNodes[bi]);
                        if (part) innerBlks.push(part);
                    }
                    var bodyB = (innerBlks.length ? innerBlks.join('\n') : serInlineNodes(node.childNodes, {})).trim();
                    return bodyB ? ('[blink' + (bSpd && bSpd !== '1' ? ' ' + bSpd : '') + ']' + bodyB + '[/blink]') : '';
                }
                if (tag === 'p' || tag === 'div') {
                    var pTxt = serInlineNodes(node.childNodes, {}).replace(/\n+$/, '');
                    return pTxt.replace(/\s+/g, '') || /!\[|:ph|\{\{/.test(pTxt) ? pTxt : '';
                }
                return serInlineNodes(node.childNodes, {}).trim();
            };

            var blocksOut = [];
            for (var i = 0; i < rootEl.childNodes.length; i++) {
                var bm = serBlock(rootEl.childNodes[i]);
                if (bm) blocksOut.push(bm);
            }
            return blocksOut.join('\n\n');
        },

        _commitWysiwygDomToMarkdown: function (opts) {
            var o = opts || {};
            if (!this._previewRootEl) return;
            var md = this._serializeWysiwygDomToMarkdown(this._previewRootEl);
            this._isWysiwygTyping = !o.rerenderWysiwyg;
            try {
                if (o.pushUndo) {
                    this._pushUndoState();
                } else {
                    this._scheduleTypingCheckpoint();
                }
                this._markdown = md;
                if (this._textarea) this._textarea.value = md;
                this._syncToWidget(!!o.flush);
                this._blocks = MarkdownBlockCodec.parseMarkdownToBlocks(md);
                if (this._mode === 'blocks') {
                    if (this._selectedBlock >= this._blocks.length) {
                        this._selectedBlock = this._blocks.length - 1;
                    }
                    this._renderBlockCanvas();
                    this._renderInspector();
                }
                if (o.rerenderWysiwyg) {
                    this._isWysiwygTyping = false;
                    this._refreshLivePreviews();
                }
                this._updateStatusBar();
                this._updateRawToolbarState();
                this._updateUndoRedoButtons();
            } finally {
                this._isWysiwygTyping = false;
            }
        },

        // ---- Unified Toolbar Dispatchers (Raw + WYSIWYG) ----

        _dispatchInlineFormat: function (kind) {
            if (this._isWysiwygActive()) {
                this._restoreWysiwygRange();
                this._pushUndoState();
                if (kind === 'bold') document.execCommand('bold', false, null);
                else if (kind === 'italic') document.execCommand('italic', false, null);
                else if (kind === 'strike') document.execCommand('strikeThrough', false, null);
                else if (kind === 'code') {
                    var sel = window.getSelection();
                    if (sel && sel.rangeCount) {
                        var r = sel.getRangeAt(0);
                        var anc = r.commonAncestorContainer;
                        var ancCode = (anc && anc.nodeType === 1 ? anc : (anc && anc.parentElement ? anc.parentElement : null));
                        if (ancCode && ancCode.closest) ancCode = ancCode.closest('code');
                        if (ancCode && this._previewRootEl.contains(ancCode)) {
                            var txt = document.createTextNode(ancCode.textContent || '');
                            ancCode.parentNode.replaceChild(txt, ancCode);
                        } else {
                            var cd = document.createElement('code');
                            cd.textContent = r.toString() || 'code';
                            r.deleteContents();
                            r.insertNode(cd);
                            sel.collapseToEnd();
                        }
                    }
                }
                this._commitWysiwygDomToMarkdown({ flush: true });
                return;
            }
            if (kind === 'bold') this._applyOp(function (t, a, b) { return MarkdownTextOps.wrapBold(t, a, b); });
            else if (kind === 'italic') this._applyOp(function (t, a, b) { return MarkdownTextOps.wrapItalic(t, a, b); });
            else if (kind === 'strike') this._applyOp(function (t, a, b) { return MarkdownTextOps.wrapStrikethrough(t, a, b); });
            else if (kind === 'code') this._applyOp(function (t, a, b) { return MarkdownTextOps.wrapInlineCode(t, a, b); });
        },

        _dispatchHeading: function (level) {
            if (this._isWysiwygActive()) {
                this._restoreWysiwygRange();
                this._pushUndoState();
                var r = this._getWysiwygSelectionRange();
                var tagTarget = 'h' + level;
                var node = r ? (r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement) : null;
                var curH = node && node.closest ? node.closest('h1, h2, h3') : null;
                if (curH && curH.tagName.toLowerCase() === tagTarget) {
                    document.execCommand('formatBlock', false, 'p');
                } else {
                    document.execCommand('formatBlock', false, tagTarget);
                }
                this._commitWysiwygDomToMarkdown({ flush: true });
                return;
            }
            this._applyHeading(level);
        },

        _dispatchLines: function (kind) {
            if (this._isWysiwygActive()) {
                this._restoreWysiwygRange();
                this._pushUndoState();
                if (kind === 'bullet') document.execCommand('insertUnorderedList', false, null);
                else if (kind === 'ordered') document.execCommand('insertOrderedList', false, null);
                else if (kind === 'quote') document.execCommand('formatBlock', false, 'blockquote');
                else if (kind === 'codeblock') {
                    var sel = window.getSelection();
                    var r = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
                    var pre = document.createElement('pre');
                    var code = document.createElement('code');
                    code.textContent = (r && r.toString()) ? r.toString() : 'code';
                    pre.appendChild(code);
                    if (r) {
                        r.deleteContents();
                        r.insertNode(pre);
                    } else if (this._previewRootEl) {
                        this._previewRootEl.appendChild(pre);
                    }
                }
                this._commitWysiwygDomToMarkdown({ flush: true });
                return;
            }
            if (kind === 'bullet') this._applyLines(function (s, a, b) { return MarkdownTextOps.toggleBulletList(s, a, b); });
            else if (kind === 'ordered') this._applyLines(function (s, a, b) { return MarkdownTextOps.toggleNumberedList(s, a, b); });
            else if (kind === 'quote') this._applyLines(function (s, a, b) { return MarkdownTextOps.toggleBlockquote(s, a, b); });
            else if (kind === 'codeblock') this._applyOp(function (t, a, b) { return MarkdownTextOps.wrapCodeBlock(t, a, b); });
        },

        _dispatchHr: function () {
            if (this._isWysiwygActive()) {
                this._restoreWysiwygRange();
                this._pushUndoState();
                var r = this._getWysiwygSelectionRange();
                var hr = document.createElement('hr');
                if (r) {
                    r.collapse(false);
                    r.insertNode(hr);
                } else if (this._previewRootEl) {
                    this._previewRootEl.appendChild(hr);
                }
                this._commitWysiwygDomToMarkdown({ flush: true, rerenderWysiwyg: true });
                return;
            }
            this._hr();
        },

        _wrapWysiwygInlineSpan: function (cls, attrName, attrVal) {
            var r = this._restoreWysiwygRange();
            if (!r || r.collapsed) return false;
            this._pushUndoState();
            var span = document.createElement('span');
            span.className = cls;
            if (attrName) span.setAttribute(attrName, attrVal);
            span.appendChild(r.extractContents());
            r.insertNode(span);
            this._commitWysiwygDomToMarkdown({ flush: true, rerenderWysiwyg: true });
            return true;
        },

        _unwrapWysiwygAncestor: function (selector) {
            var r = this._restoreWysiwygRange();
            if (!r) return false;
            var node = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
            var match = node && node.closest ? node.closest(selector) : null;
            if (!match || !this._previewRootEl.contains(match)) return false;
            this._pushUndoState();
            var parent = match.parentNode;
            while (match.firstChild) parent.insertBefore(match.firstChild, match);
            parent.removeChild(match);
            this._commitWysiwygDomToMarkdown({ flush: true, rerenderWysiwyg: true });
            return true;
        },

        _insertWysiwygMarkdownToken: function (mdToken, isBlock) {
            if (!mdToken) return;
            var cur = this._serializeWysiwygDomToMarkdown(this._previewRootEl);
            this._pushUndoState();
            var sep = cur ? (isBlock ? '\n\n' : ' ') : '';
            // If cursor sits inside a specific table cell in WYSIWYG, append directly to that table cell!
            var info = this._wysiwygActiveTableInfo || this._computeWysiwygTableContext();
            var r = this._getWysiwygSelectionRange();
            if (!isBlock && info && info.cellEl && r && this._previewRootEl.contains(r.startContainer)) {
                var ph = document.createTextNode(mdToken);
                r.deleteContents();
                r.insertNode(ph);
                this._commitWysiwygDomToMarkdown({ flush: true, rerenderWysiwyg: true });
                return;
            }
            if (!isBlock && r && this._previewRootEl.contains(r.startContainer)) {
                var tNode = document.createTextNode(mdToken);
                r.deleteContents();
                r.insertNode(tNode);
                this._commitWysiwygDomToMarkdown({ flush: true, rerenderWysiwyg: true });
                return;
            }
            var nextMd = cur + sep + mdToken;
            this._markdown = nextMd;
            if (this._textarea) this._textarea.value = nextMd;
            this._blocks = MarkdownBlockCodec.parseMarkdownToBlocks(nextMd);
            this._syncToWidget(true);
            this._refreshLivePreviews();
            this._updateStatusBar();
            this._updateUndoRedoButtons();
        },

        _dispatchTableCellBg: function (colorSpec) {
            if (this._isWysiwygActive()) {
                var cell = this._getWysiwygCellElement() || (this._wysiwygActiveTableInfo && this._wysiwygActiveTableInfo.cellEl);
                if (!cell) return;
                this._pushUndoState();
                if (colorSpec) cell.dataset.tfeCellBg = colorSpec;
                else delete cell.dataset.tfeCellBg;
                this._commitWysiwygDomToMarkdown({ flush: true, rerenderWysiwyg: true });
                return;
            }
            if (!this._isCellColorToolbarEnabled()) return;
            if (colorSpec) {
                this._applyRawOp(function (t, a, b) { return MarkdownTextOps.applyTableCellBackground(t, a, b, colorSpec); });
            } else {
                this._applyRawOp(function (t, a, b) { return MarkdownTextOps.removeTableCellBackground(t, a, b); });
            }
        },

        _dispatchTableAlign: function (align) {
            if (this._isWysiwygActive()) {
                var info = this._wysiwygActiveTableInfo || this._computeWysiwygTableContext();
                if (!info) return;
                var mdCur = this._serializeWysiwygDomToMarkdown(this._previewRootEl);
                var blks = MarkdownBlockCodec.parseMarkdownToBlocks(mdCur);
                var bIdx = -1, cnt = 0;
                for (var i = 0; i < blks.length; i++) {
                    if (blks[i] && blks[i].type === 'table') { if (cnt === info.tableIdx) { bIdx = i; break; } cnt += 1; }
                }
                if (bIdx < 0) return;
                this._pushUndoState();
                blks[bIdx].align[info.colIdx] = align;
                this._blocks = blks;
                this._commitBlocksToMarkdown({ flush: true });
                this._wysiwygActiveTableInfo = { tableIdx: info.tableIdx, rowIdx: info.rowIdx, colIdx: info.colIdx, align: align };
                this._updateRawToolbarState();
                return;
            }
            this._applyRawOp(function (t, a, bSel) { return MarkdownTextOps.setTableColumnAlign(t, a, bSel, align); });
        },

        _dispatchTableStruct: function (opName) {
            if (this._isWysiwygActive()) {
                var info = this._wysiwygActiveTableInfo || this._computeWysiwygTableContext();
                if (!info) return;
                var mdCur = this._serializeWysiwygDomToMarkdown(this._previewRootEl);
                var blks = MarkdownBlockCodec.parseMarkdownToBlocks(mdCur);
                var bIdx = -1, cnt = 0;
                for (var i = 0; i < blks.length; i++) {
                    if (blks[i] && blks[i].type === 'table') { if (cnt === info.tableIdx) { bIdx = i; break; } cnt += 1; }
                }
                if (bIdx < 0) return;
                var tbl = blks[bIdx];
                this._pushUndoState();
                var r = Math.max(0, Math.min(tbl.rows.length - 1, info.rowIdx));
                var c = Math.max(0, Math.min(tbl.align.length - 1, info.colIdx));

                if (opName === 'insertRowBelow' && tbl.rows.length < 100) {
                    tbl.rows.splice(r + 1, 0, tbl.align.map(function () { return MarkdownBlockCodec.createDefaultCell(''); }));
                    info.rowIdx = r + 1;
                } else if (opName === 'deleteRow' && r > 0 && tbl.rows.length > 2) {
                    tbl.rows.splice(r, 1);
                    info.rowIdx = Math.min(r, tbl.rows.length - 1);
                } else if (opName === 'insertColRight' && tbl.align.length < 20) {
                    var ins = c + 1;
                    tbl.align.splice(ins, 0, 'default');
                    tbl.rows.forEach(function (rw, ri) { rw.splice(ins, 0, MarkdownBlockCodec.createDefaultCell(ri === 0 ? ('Col ' + tbl.align.length) : '')); });
                    info.colIdx = ins;
                } else if (opName === 'deleteCol' && tbl.align.length > 1) {
                    tbl.align.splice(c, 1);
                    tbl.rows.forEach(function (rw) { rw.splice(c, 1); });
                    info.colIdx = Math.min(c, tbl.align.length - 1);
                } else if (opName === 'moveColLeft' && c > 0) {
                    var taL = tbl.align[c]; tbl.align[c] = tbl.align[c - 1]; tbl.align[c - 1] = taL;
                    tbl.rows.forEach(function (rw) { var tc = rw[c]; rw[c] = rw[c - 1]; rw[c - 1] = tc; });
                    info.colIdx = c - 1;
                } else if (opName === 'moveColRight' && c < tbl.align.length - 1) {
                    var taR = tbl.align[c]; tbl.align[c] = tbl.align[c + 1]; tbl.align[c + 1] = taR;
                    tbl.rows.forEach(function (rw) { var tc = rw[c]; rw[c] = rw[c + 1]; rw[c + 1] = tc; });
                    info.colIdx = c + 1;
                }

                this._blocks = blks;
                this._commitBlocksToMarkdown({ flush: true });
                this._updateRawToolbarState();
                return;
            }
            if (opName === 'insertRowBelow') this._applyRawOp(function (t, a, b) { return MarkdownTextOps.insertTableRow(t, a, b, 'below'); });
            else if (opName === 'deleteRow') this._applyRawOp(function (t, a, b) { return MarkdownTextOps.deleteTableRow(t, a, b); });
            else if (opName === 'insertColRight') this._applyRawOp(function (t, a, b) { return MarkdownTextOps.insertTableColumn(t, a, b, 'right'); });
            else if (opName === 'deleteCol') this._applyRawOp(function (t, a, b) { return MarkdownTextOps.deleteTableColumn(t, a, b); });
            else if (opName === 'moveColLeft') this._applyRawOp(function (t, a, b) { return MarkdownTextOps.moveTableColumn(t, a, b, -1); });
            else if (opName === 'moveColRight') this._applyRawOp(function (t, a, b) { return MarkdownTextOps.moveTableColumn(t, a, b, 1); });
        },

        _isTextColorToolbarEnabled: function () {
            if (this._isWysiwygActive()) {
                var r = this._getWysiwygSelectionRange();
                return !!(r && !r.collapsed);
            }
            if (!this._textarea) return false;
            return this._textarea.selectionStart !== this._textarea.selectionEnd;
        },

        _getTextColorRaw: function () {
            if (this._isWysiwygActive()) {
                var r = this._getWysiwygSelectionRange();
                if (!r) return '';
                var node = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
                var sp = node && node.closest ? node.closest('.text-md-color[data-text-md-col]') : null;
                return sp ? (sp.getAttribute('data-text-md-col') || '') : '';
            }
            if (!this._textarea || typeof MarkdownTextOps === 'undefined') return '';
            return MarkdownTextOps.getTextColorAtSelection(
                this._textarea.value,
                this._textarea.selectionStart,
                this._textarea.selectionEnd
            );
        },

        _isCellColorToolbarEnabled: function () {
            if (this._isWysiwygActive()) {
                return !!(this._getWysiwygCellElement() || (this._wysiwygActiveTableInfo && this._wysiwygActiveTableInfo.cellEl));
            }
            if (!this._textarea || typeof MarkdownTextOps === 'undefined') return false;
            return !!MarkdownTextOps.getTableCellContext(
                this._textarea.value,
                this._textarea.selectionStart,
                this._textarea.selectionEnd
            );
        },

        _getCellColorRaw: function () {
            if (this._isWysiwygActive()) {
                var cellEl = this._getWysiwygCellElement() || (this._wysiwygActiveTableInfo && this._wysiwygActiveTableInfo.cellEl);
                return (cellEl && cellEl.dataset && cellEl.dataset.tfeCellBg) ? cellEl.dataset.tfeCellBg : '';
            }
            if (!this._textarea || typeof MarkdownTextOps === 'undefined') return '';
            var ctx = MarkdownTextOps.getTableCellContext(
                this._textarea.value,
                this._textarea.selectionStart,
                this._textarea.selectionEnd
            );
            if (!ctx || typeof MarkdownCellColor === 'undefined') return '';
            var parsed = MarkdownCellColor.parseDirective(ctx.cellText);
            return parsed ? parsed.color : '';
        },

        _isTableContextActive: function () {
            if (this._isWysiwygActive()) {
                return !!(this._getWysiwygCellElement() || this._wysiwygActiveTableInfo);
            }
            if (!this._textarea || typeof MarkdownTextOps === 'undefined') return false;
            return !!MarkdownTextOps.getTableColumnAlign(
                this._textarea.value,
                this._textarea.selectionStart,
                this._textarea.selectionEnd
            );
        },

        _updateRawToolbarState: function () {
            if (!this._root) return;
            var useRaw = (this._mode === 'raw');
            var showRibbon = useRaw || (this._mode === 'preview');

            // Text color & Blink
            var hasSel = this._isTextColorToolbarEnabled();
            if (this._textColorMount) {
                this._textColorMount.classList.toggle('is-disabled', !hasSel);
                this._textColorMount.setAttribute('aria-disabled', hasSel ? 'false' : 'true');
                if (this._textColorPicker && this._textColorPicker.sync) this._textColorPicker.sync();
            }
            if (this._blinkGroup) {
                this._blinkGroup.classList.toggle('is-disabled', !hasSel);
                this._blinkGroup.setAttribute('aria-disabled', hasSel ? 'false' : 'true');
            }
            if (this._blinkMainBtn) {
                this._blinkMainBtn.title = hasSel ? 'Blink selection' : 'Blink (select text first)';
            }
            if (this._blinkCaretBtn) {
                this._blinkCaretBtn.title = hasSel ? 'Blink speed & options' : 'Blink speed (select text first)';
            }

            // Contextual Table Bar
            if (this._tableCtxBar) {
                var inTable = showRibbon && this._isTableContextActive();
                this._tableCtxBar.hidden = !inTable;
                if (inTable) {
                    var inCell = this._isCellColorToolbarEnabled();
                    if (this._ctxCellColorMount) {
                        this._ctxCellColorMount.classList.toggle('is-disabled', !inCell);
                        if (this._ctxCellColorPicker && this._ctxCellColorPicker.sync) this._ctxCellColorPicker.sync();
                    }
                    var curAlign = '';
                    if (this._isWysiwygActive()) {
                        var wInfo = this._wysiwygActiveTableInfo || this._computeWysiwygTableContext();
                        curAlign = wInfo && wInfo.align ? wInfo.align : 'default';
                    } else {
                        var info = MarkdownTextOps.getTableColumnAlign(
                            this._textarea.value,
                            this._textarea.selectionStart,
                            this._textarea.selectionEnd
                        );
                        curAlign = info && info.align ? info.align : '';
                    }
                    if (this._ctxColAlignBtns) {
                        var keys = ['default', 'left', 'center', 'right'];
                        for (var k = 0; k < keys.length; k++) {
                            var btn = this._ctxColAlignBtns[keys[k]];
                            if (!btn) continue;
                            var on = curAlign === keys[k];
                            btn.classList.toggle('is-active', on);
                            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
                        }
                    }
                }
            }
        },

        _addTextColorPicker: function (row) {
            var self = this;
            if (typeof EditorColorPicker === 'undefined' || typeof EditorColorPicker.attach !== 'function') return;
            var mount = el('div', 'text-full-editor-text-color-mount is-disabled');
            mount.setAttribute('aria-disabled', 'true');
            mount.title = 'Text color (select text first)';
            row.appendChild(mount);
            this._textColorMount = mount;

            var picker = EditorColorPicker.attach({
                mountCard: mount,
                allowThemeTokens: true,
                positionMode: 'anchor',
                zIndex: 10060,
                triggerMode: 'text',
                triggerTitle: mount.title,
                getRaw: function () { return self._getTextColorRaw(); },
                setValue: function (val) {
                    if (!self._isTextColorToolbarEnabled()) return;
                    if (self._isWysiwygActive()) {
                        self._wrapWysiwygInlineSpan('text-md-color', 'data-text-md-col', val);
                        return;
                    }
                    self._applyOp(function (t, a, b) { return MarkdownTextOps.wrapTextColor(t, a, b, val); });
                },
                onAfterLocalChange: function () { self._updateRawToolbarState(); },
                onClear: function () {
                    if (!self._isTextColorToolbarEnabled()) return;
                    if (self._isWysiwygActive()) {
                        self._unwrapWysiwygAncestor('.text-md-color');
                        return;
                    }
                    self._applyOp(function (t, a, b) { return MarkdownTextOps.unwrapTextColor(t, a, b); });
                }
            });
            this._textColorPicker = picker;
            var blockOpen = function (e) {
                if (!self._isTextColorToolbarEnabled()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
            picker.row.addEventListener('mousedown', blockOpen, true);
            picker.row.addEventListener('click', blockOpen, true);
        },

        _addBlinkSplit: function (row) {
            var self = this;
            var group = el('div', 'text-full-editor-blink-group is-disabled');
            group.setAttribute('role', 'group');
            group.setAttribute('aria-label', 'Blink');

            var main = el('button', 'text-full-editor-tb text-full-editor-blink-main');
            main.type = 'button';
            main.title = 'Blink (select text first)';
            main.innerHTML = '<i class="ph-bold ph-pulse"></i>';
            main.addEventListener('click', function (e) {
                e.preventDefault();
                if (!self._isTextColorToolbarEnabled()) return;
                if (self._isWysiwygActive()) {
                    self._wrapWysiwygInlineSpan('text-md-blink', 'data-text-md-blink', '1');
                    return;
                }
                self._applyOp(function (t, a, b) { return MarkdownTextOps.wrapBlink(t, a, b, 1); });
            });

            var caret = el('button', 'text-full-editor-tb text-full-editor-blink-caret');
            caret.type = 'button';
            caret.title = 'Blink speed';
            caret.innerHTML = '<i class="ph-bold ph-caret-down"></i>';
            caret.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!self._isTextColorToolbarEnabled()) return;
                self._openBlinkPicker(caret);
            });

            group.appendChild(main);
            group.appendChild(caret);
            row.appendChild(group);
            this._blinkGroup = group;
            this._blinkMainBtn = main;
            this._blinkCaretBtn = caret;
        },

        _applyOp: function (fn) {
            if (!this._textarea) return;
            this._pushUndoState();
            var t = this._textarea.value;
            var a = this._textarea.selectionStart;
            var b = this._textarea.selectionEnd;
            var r = fn(t, a, b);
            if (!r) return;
            this._textarea.value = r.text;
            if (r.start !== undefined && r.end !== undefined) {
                this._textarea.selectionStart = r.start;
                this._textarea.selectionEnd = r.end;
            } else if (r.cursor !== undefined) {
                this._textarea.selectionStart = r.cursor;
                this._textarea.selectionEnd = (r.selEnd !== undefined && r.selEnd !== null) ? r.selEnd : r.cursor;
            }
            this._markdown = this._textarea.value;
            this._blocks = MarkdownBlockCodec.parseMarkdownToBlocks(this._markdown);
            this._syncToWidget(true);
            this._updateRawToolbarState();
            this._refreshLivePreviews();
            this._updateStatusBar();
            this._textarea.focus();
        },

        _applyRawOp: function (fn) {
            this._applyOp(fn);
        },

        _applyLines: function (fn) {
            if (!this._textarea) return;
            this._pushUndoState();
            var n = fn(this._textarea.value, this._textarea.selectionStart, this._textarea.selectionEnd);
            this._textarea.value = n;
            this._markdown = n;
            this._blocks = MarkdownBlockCodec.parseMarkdownToBlocks(n);
            this._syncToWidget(true);
            this._updateRawToolbarState();
            this._refreshLivePreviews();
            this._updateStatusBar();
            this._textarea.focus();
        },

        _applyHeading: function (level) {
            this._applyOp(function (t, a, b) {
                var r = MarkdownTextOps.setHeading(t, a, b, level);
                if (typeof r === 'string') return { text: r, cursor: a, selEnd: b };
                return r;
            });
        },

        _hr: function () {
            this._applyOp(function (t, a) {
                return MarkdownTextOps.insertHorizontalRule(t, a);
            });
        },

        // ---- Unified Floating Popover Manager ----

        _closeActivePopover: function () {
            if (this._activePopoverCleanup) {
                try { this._activePopoverCleanup(); } catch (e) { /* ignore */ }
            }
            this._activePopoverCleanup = null;
            if (this._activePopover && this._activePopover.parentNode) {
                if (typeof Editor !== 'undefined' && typeof Editor._cleanupSubtreeDropdowns === 'function') {
                    Editor._cleanupSubtreeDropdowns(this._activePopover);
                }
                this._activePopover.parentNode.removeChild(this._activePopover);
            }
            this._activePopover = null;
        },

        _mountPopover: function (anchorBtn, pop, extraDestroyFn) {
            var self = this;
            this._closeActivePopover();
            this._root.appendChild(pop);
            this._activePopover = pop;

            var btnRect = anchorBtn.getBoundingClientRect();
            var rootRect = this._root.getBoundingClientRect();
            var popW = pop.offsetWidth || 260;
            var left = btnRect.left - rootRect.left;
            if (left + popW > rootRect.width - 10) {
                left = Math.max(8, rootRect.width - popW - 10);
            }
            var top = btnRect.bottom - rootRect.top + 6;
            if (top + (pop.offsetHeight || 200) > rootRect.height - 10) {
                top = Math.max(8, btnRect.top - rootRect.top - (pop.offsetHeight || 200) - 6);
            }
            pop.style.left = Math.max(8, left) + 'px';
            pop.style.top = top + 'px';

            var onOutside = function (ev) {
                var inside = (typeof Editor !== 'undefined' && typeof Editor.isClickInsidePopupWithPortaledDropdowns === 'function')
                    ? Editor.isClickInsidePopupWithPortaledDropdowns(ev.target, pop, anchorBtn)
                    : (pop.contains(ev.target) || ev.target === anchorBtn || anchorBtn.contains(ev.target));
                if (!inside) {
                    self._closeActivePopover();
                }
            };
            var timer = setTimeout(function () {
                document.addEventListener('mousedown', onOutside, true);
            }, 0);

            this._activePopoverCleanup = function () {
                clearTimeout(timer);
                document.removeEventListener('mousedown', onOutside, true);
                if (typeof extraDestroyFn === 'function') extraDestroyFn();
            };
        },

        // ---- Click-to-Edit Popovers for WYSIWYG Elements ----

        _openWysiwygTokenEditorPopover: function (tokEl) {
            var self = this;
            var raw = tokEl.getAttribute('data-tfe-token') || '';
            var inner = raw.replace(/^\{\{|\}\}$/g, '').trim();
            var isF = MarkdownBlockCodec.looksLikeFormulaExpr(inner);
            var mode = isF ? 'formula' : 'topic';
            var topicPath = isF ? 'homey/temp' : inner;
            var formulaExpr = isF ? inner : FORMULA_TEMPLATES[0].expr;

            var pop = el('div', 'text-full-editor-table-picker tfe-rich-popover tfe-rich-popover--wide');
            pop.appendChild(el('div', 'text-full-editor-table-picker-title', 'Edit Topic / Formula'));

            var topicPane = el('div', 'tfe-field-stack');
            var formulaPane = el('div', 'tfe-field-stack');
            topicPane.hidden = (mode !== 'topic');
            formulaPane.hidden = (mode !== 'formula');

            pop.appendChild(this._inspSegmented([
                { value: 'topic', text: 'Live Topic', icon: 'ph-broadcast' },
                { value: 'formula', text: 'Payload Formula', icon: 'ph-function' }
            ], mode, function (m) {
                mode = m;
                topicPane.hidden = (m !== 'topic');
                formulaPane.hidden = (m !== 'formula');
                pop.querySelectorAll('.tfe-mini-seg-btn').forEach(function (bt, i) {
                    bt.classList.toggle('is-active', (i === 0 && m === 'topic') || (i === 1 && m === 'formula'));
                });
            }));

            if (typeof Editor !== 'undefined' && typeof Editor.createTopicDropdown === 'function') {
                var dd = Editor.createTopicDropdown(topicPath, 'Search topic...', function (v) { topicPath = v; }, '', true, false, function (v) { topicPath = v; }, { warnWhenEmpty: false });
                topicPane.appendChild(this._inspFieldGroup('Topic Path', dd));
            } else {
                topicPane.appendChild(this._inspFieldGroup('Topic Path', this._inspTextInput(topicPath, 'homey/temp', function (v) { topicPath = v; })));
            }
            pop.appendChild(topicPane);

            var fTa = this._inspTextarea(formulaExpr, 'if({{homey/temp}} > 20, "Hot", "Cold")', 3, function (v) { formulaExpr = v; });
            formulaPane.appendChild(this._inspFieldGroup('Formula', fTa));
            pop.appendChild(formulaPane);

            var acts = el('div', 'tfe-btn-pair');
            var btnSave = el('button', 'btn-tool primary tfe-full-btn', 'Update Token');
            btnSave.type = 'button';
            btnSave.addEventListener('click', function () {
                var nextInner = mode === 'formula' ? formulaExpr.trim() : topicPath.trim();
                if (!nextInner) return;
                tokEl.setAttribute('data-tfe-token', '{{' + nextInner + '}}');
                self._commitWysiwygDomToMarkdown({ flush: true, pushUndo: true, rerenderWysiwyg: true });
                self._closeActivePopover();
            });
            var btnDel = el('button', 'btn-tool tfe-full-btn tfe-btn-danger', 'Remove');
            btnDel.type = 'button';
            btnDel.addEventListener('click', function () {
                if (tokEl.parentNode) tokEl.parentNode.removeChild(tokEl);
                self._commitWysiwygDomToMarkdown({ flush: true, pushUndo: true, rerenderWysiwyg: true });
                self._closeActivePopover();
            });
            acts.appendChild(btnSave);
            acts.appendChild(btnDel);
            pop.appendChild(acts);
            this._mountPopover(tokEl, pop);
        },

        _openWysiwygIconEditorPopover: function (iconEl) {
            var self = this;
            var curMd = this._reconstructIconTokenFromEl(iconEl);
            var parsed = MarkdownBlockCodec.parseIconTokenStr(curMd) || { name: 'ph-star', weight: 'default', size: '', tint: '', secondary: '' };
            var state = { name: parsed.name, weight: parsed.weight, size: parsed.size, tint: parsed.tint, secondary: parsed.secondary };
            var pickers = [];

            var pop = el('div', 'text-full-editor-table-picker tfe-rich-popover');
            pop.appendChild(el('div', 'text-full-editor-table-picker-title', 'Edit Phosphor Icon'));

            var pickBtn = el('button', 'btn-tool tfe-full-btn');
            pickBtn.type = 'button';
            var syncBtn = function () {
                var wc = (typeof BaseWidget !== 'undefined' && BaseWidget.phosphorWeightClass)
                    ? BaseWidget.phosphorWeightClass(state.weight === 'default' ? 'regular' : state.weight)
                    : 'ph-bold';
                pickBtn.innerHTML = '<i class="' + wc + ' ' + escHtml(state.name) + '"></i><span>' + escHtml(state.name) + ' (Browse...)</span>';
            };
            syncBtn();
            pickBtn.addEventListener('click', function () {
                if (typeof Dashboard === 'undefined' || typeof Dashboard.openIconBrowser !== 'function') return;
                Dashboard.openIconBrowser(state.name, function (chosen) {
                    if (chosen) { state.name = chosen; syncBtn(); }
                });
            });
            pop.appendChild(pickBtn);

            var pair = el('div', 'tfe-pair');
            pair.appendChild(this._inspFieldGroup('Style', this._inspSelect(WEIGHT_OPTIONS, state.weight, function (w) {
                state.weight = w;
                syncBtn();
                secMount.hidden = (w !== 'duotone');
            })));
            pair.appendChild(this._inspFieldGroup('Size (px)', this._inspTextInput(state.size, 'Auto', function (v) { state.size = v; }, { numeric: true, min: 1, max: 4096 })));
            pop.appendChild(pair);

            var tintMount = el('div', 'tfe-field');
            tintMount.appendChild(el('label', 'control-label tfe-field-label', 'Primary Tint'));
            var secMount = el('div', 'tfe-field');
            secMount.appendChild(el('label', 'control-label tfe-field-label', 'Duotone Secondary'));
            secMount.hidden = (state.weight !== 'duotone');

            if (typeof EditorColorPicker !== 'undefined' && typeof EditorColorPicker.attach === 'function') {
                var m1 = el('div', 'tfe-color-mount');
                pickers.push(EditorColorPicker.attach({
                    mountCard: m1, allowThemeTokens: true, positionMode: 'anchor', zIndex: 10070,
                    getRaw: function () { return state.tint; },
                    setValue: function (v) { state.tint = v || ''; },
                    onClear: function () { state.tint = ''; }
                }));
                tintMount.appendChild(m1);
                var m2 = el('div', 'tfe-color-mount');
                pickers.push(EditorColorPicker.attach({
                    mountCard: m2, allowThemeTokens: true, positionMode: 'anchor', zIndex: 10070,
                    getRaw: function () { return state.secondary; },
                    setValue: function (v) { state.secondary = v || ''; },
                    onClear: function () { state.secondary = ''; }
                }));
                secMount.appendChild(m2);
            }
            pop.appendChild(tintMount);
            pop.appendChild(secMount);

            var acts = el('div', 'tfe-btn-pair');
            var btnSave = el('button', 'btn-tool primary tfe-full-btn', 'Update');
            btnSave.type = 'button';
            btnSave.addEventListener('click', function () {
                var nextTok = MarkdownBlockCodec.iconObjToMd(state);
                if (nextTok) {
                    iconEl.setAttribute('data-tfe-md', nextTok);
                    self._commitWysiwygDomToMarkdown({ flush: true, pushUndo: true, rerenderWysiwyg: true });
                }
                self._closeActivePopover();
            });
            var btnDel = el('button', 'btn-tool tfe-full-btn tfe-btn-danger', 'Remove');
            btnDel.type = 'button';
            btnDel.addEventListener('click', function () {
                if (iconEl.parentNode) iconEl.parentNode.removeChild(iconEl);
                self._commitWysiwygDomToMarkdown({ flush: true, pushUndo: true, rerenderWysiwyg: true });
                self._closeActivePopover();
            });
            acts.appendChild(btnSave);
            acts.appendChild(btnDel);
            pop.appendChild(acts);
            this._mountPopover(iconEl, pop, function () { pickers.forEach(function (p) { if (p && p.destroy) p.destroy(); }); });
        },

        _openWysiwygImageEditorPopover: function (imgEl) {
            var self = this;
            var curMd = this._reconstructImgTokenFromEl(imgEl);
            var parsed = MarkdownBlockCodec.parseImageTokenStr(curMd) || { url: imgEl.getAttribute('src') || '', alt: imgEl.getAttribute('alt') || 'Image', width: '', height: '', tint: '' };
            var state = { url: parsed.url, alt: parsed.alt, width: parsed.width, height: parsed.height, tint: parsed.tint };
            var cp = null;

            var pop = el('div', 'text-full-editor-table-picker tfe-rich-popover');
            pop.appendChild(el('div', 'text-full-editor-table-picker-title', 'Edit Image'));

            var urlRow = el('div', 'tfe-url-row');
            var urlInp = this._inspTextInput(state.url, 'https://...', function (v) { state.url = v; });
            urlRow.appendChild(urlInp);
            if (isHomeyEnv() && typeof ImageGallery !== 'undefined' && typeof ImageGallery.open === 'function') {
                var gBtn = el('button', 'btn-tool btn-tool-icon-only');
                gBtn.type = 'button';
                gBtn.title = 'Pick from Image Gallery';
                gBtn.innerHTML = '<i class="ph-bold ph-images-square"></i>';
                gBtn.addEventListener('click', function () {
                    ImageGallery.open({
                        pickMode: true, pickFormat: 'url',
                        onPick: function (pickedUrl) { if (pickedUrl) { state.url = pickedUrl; urlInp.value = pickedUrl; } }
                    });
                });
                urlRow.appendChild(gBtn);
            }
            pop.appendChild(this._inspFieldGroup('Image URL', urlRow));
            pop.appendChild(this._inspFieldGroup('Alt Text', this._inspTextInput(state.alt, 'Image', function (v) { state.alt = v; })));

            var sPair = el('div', 'tfe-pair');
            sPair.appendChild(this._inspFieldGroup('Width (px)', this._inspTextInput(state.width, 'Auto', function (v) { state.width = v; }, { numeric: true, min: 1, max: 4096 })));
            sPair.appendChild(this._inspFieldGroup('Height (px)', this._inspTextInput(state.height, 'Auto', function (v) { state.height = v; }, { numeric: true, min: 1, max: 4096 })));
            pop.appendChild(sPair);

            if (typeof EditorColorPicker !== 'undefined' && typeof EditorColorPicker.attach === 'function') {
                var tm = el('div', 'tfe-color-mount');
                cp = EditorColorPicker.attach({
                    mountCard: tm, allowThemeTokens: true, positionMode: 'anchor', zIndex: 10070,
                    getRaw: function () { return state.tint; },
                    setValue: function (v) { state.tint = v || ''; },
                    onClear: function () { state.tint = ''; }
                });
                pop.appendChild(this._inspFieldGroup('Silhouette Tint', tm));
            }

            var acts = el('div', 'tfe-btn-pair');
            var btnSave = el('button', 'btn-tool primary tfe-full-btn', 'Update');
            btnSave.type = 'button';
            btnSave.addEventListener('click', function () {
                var nextMd = MarkdownBlockCodec.imageObjToMd(state);
                if (nextMd) {
                    imgEl.setAttribute('data-tfe-md', nextMd);
                    self._commitWysiwygDomToMarkdown({ flush: true, pushUndo: true, rerenderWysiwyg: true });
                }
                self._closeActivePopover();
            });
            var btnDel = el('button', 'btn-tool tfe-full-btn tfe-btn-danger', 'Remove');
            btnDel.type = 'button';
            btnDel.addEventListener('click', function () {
                if (imgEl.parentNode) imgEl.parentNode.removeChild(imgEl);
                self._commitWysiwygDomToMarkdown({ flush: true, pushUndo: true, rerenderWysiwyg: true });
                self._closeActivePopover();
            });
            acts.appendChild(btnSave);
            acts.appendChild(btnDel);
            pop.appendChild(acts);
            this._mountPopover(imgEl, pop, function () { if (cp && cp.destroy) cp.destroy(); });
        },

        _openWysiwygLinkEditorPopover: function (aEl) {
            var self = this;
            var curUrl = aEl.getAttribute('href') || 'https://';
            var curLbl = aEl.textContent || '';
            var curNewTab = aEl.getAttribute('target') === '_blank' || (aEl.dataset && aEl.dataset.tfeNewtab === '1');
            var pop = el('div', 'text-full-editor-table-picker tfe-rich-popover');
            pop.appendChild(el('div', 'text-full-editor-table-picker-title', 'Edit Link'));

            var lblVal = curLbl;
            var urlVal = curUrl;
            var ntVal = curNewTab;

            pop.appendChild(this._inspFieldGroup('Label', this._inspTextInput(lblVal, 'Link text', function (v) { lblVal = v; })));
            pop.appendChild(this._inspFieldGroup('URL or help://', this._inspTextInput(urlVal, 'https://... or help://Widgets/text', function (v) { urlVal = v; })));
            var ntRow = el('label', 'tfe-checkbox-row');
            var ntCb = el('input');
            ntCb.type = 'checkbox';
            ntCb.checked = ntVal;
            ntCb.addEventListener('change', function () { ntVal = ntCb.checked; });
            ntRow.appendChild(ntCb);
            ntRow.appendChild(el('span', '', 'Open in new tab (^)'));
            pop.appendChild(ntRow);

            var acts = el('div', 'tfe-btn-pair');
            var btnSave = el('button', 'btn-tool primary tfe-full-btn', 'Update');
            btnSave.type = 'button';
            btnSave.addEventListener('click', function () {
                aEl.setAttribute('href', urlVal.trim() || 'https://');
                if (!aEl.querySelector('img')) aEl.textContent = lblVal || urlVal;
                if (ntVal && urlVal.indexOf('help://') !== 0) {
                    aEl.setAttribute('target', '_blank');
                    aEl.dataset.tfeNewtab = '1';
                } else {
                    aEl.removeAttribute('target');
                    delete aEl.dataset.tfeNewtab;
                }
                self._commitWysiwygDomToMarkdown({ flush: true, pushUndo: true, rerenderWysiwyg: true });
                self._closeActivePopover();
            });
            var btnDel = el('button', 'btn-tool tfe-full-btn tfe-btn-danger', 'Unlink');
            btnDel.type = 'button';
            btnDel.addEventListener('click', function () {
                var parent = aEl.parentNode;
                while (aEl.firstChild) parent.insertBefore(aEl.firstChild, aEl);
                parent.removeChild(aEl);
                self._commitWysiwygDomToMarkdown({ flush: true, pushUndo: true, rerenderWysiwyg: true });
                self._closeActivePopover();
            });
            acts.appendChild(btnSave);
            acts.appendChild(btnDel);
            pop.appendChild(acts);
            this._mountPopover(aEl, pop);
        },

        _openBlinkPicker: function (anchorBtn) {
            var self = this;
            var pop = el('div', 'text-full-editor-table-picker text-full-editor-blink-picker');
            pop.appendChild(el('div', 'text-full-editor-table-picker-title', 'Blink Speed'));
            var list = el('div', 'text-full-editor-blink-picker-list');
            [
                { scale: 0.5, label: 'Fast (0.5 s)' },
                { scale: 1, label: 'Default (1 s)' },
                { scale: 1.5, label: 'Medium (1.5 s)' },
                { scale: 2, label: 'Slow (2 s)' },
                { scale: 3, label: 'Very Slow (3 s)' }
            ].forEach(function (item) {
                var b = el('button', 'text-full-editor-block-picker-btn', item.label);
                b.type = 'button';
                b.addEventListener('click', function () {
                    if (self._isWysiwygActive()) {
                        self._wrapWysiwygInlineSpan('text-md-blink', 'data-text-md-blink', String(item.scale));
                    } else {
                        self._applyOp(function (t, a, bSel) { return MarkdownTextOps.wrapBlink(t, a, bSel, item.scale); });
                    }
                    self._closeActivePopover();
                });
                list.appendChild(b);
            });
            var clr = el('button', 'text-full-editor-block-picker-btn tfe-btn-danger', 'Remove Blink');
            clr.type = 'button';
            clr.addEventListener('click', function () {
                if (self._isWysiwygActive()) {
                    self._unwrapWysiwygAncestor('.text-md-blink');
                } else {
                    self._applyOp(function (t, a, bSel) { return MarkdownTextOps.unwrapBlink(t, a, bSel); });
                }
                self._closeActivePopover();
            });
            list.appendChild(clr);
            pop.appendChild(list);
            this._mountPopover(anchorBtn, pop);
        },

        _openTablePicker: function (anchorBtn) {
            var self = this;
            var MAX_COLS = 10;
            var MAX_ROWS = 8;
            var pop = el('div', 'text-full-editor-table-picker');
            pop.appendChild(el('div', 'text-full-editor-table-picker-title', 'Insert Table'));
            var grid = el('div', 'text-full-editor-table-picker-grid');
            grid.style.gridTemplateColumns = 'repeat(' + MAX_COLS + ', 18px)';
            grid.style.gridTemplateRows = 'repeat(' + MAX_ROWS + ', 18px)';

            var cells = [];
            for (var r = 0; r < MAX_ROWS; r++) {
                for (var c = 0; c < MAX_COLS; c++) {
                    var cell = el('div', 'text-full-editor-table-picker-cell');
                    cell.dataset.row = String(r);
                    cell.dataset.col = String(c);
                    grid.appendChild(cell);
                    cells.push(cell);
                }
            }
            var readout = el('div', 'text-full-editor-table-picker-readout', 'Hover to pick size');
            var hint = el('div', 'text-full-editor-table-picker-hint');
            hint.innerHTML = '<i class="ph-bold ph-lightbulb"></i> Click to insert. Header row is auto-generated.';

            var highlight = function (nc, nr) {
                for (var i = 0; i < cells.length; i++) {
                    var cr = parseInt(cells[i].dataset.row, 10);
                    var cc = parseInt(cells[i].dataset.col, 10);
                    var on = cr <= nr && cc <= nc;
                    cells[i].classList.toggle('on', on);
                    cells[i].classList.toggle('header', on && cr === 0);
                }
                readout.textContent = (nc >= 0 && nr >= 0) ? ((nc + 1) + ' \u00d7 ' + (nr + 1) + ' (cols \u00d7 rows)') : 'Hover to pick size';
            };

            grid.addEventListener('mousemove', function (e) {
                var cEl = e.target.closest('.text-full-editor-table-picker-cell');
                if (cEl) highlight(parseInt(cEl.dataset.col, 10), parseInt(cEl.dataset.row, 10));
            });
            grid.addEventListener('mouseleave', function () { highlight(-1, -1); });
            grid.addEventListener('click', function (e) {
                var cEl = e.target.closest('.text-full-editor-table-picker-cell');
                if (!cEl) return;
                var cols = parseInt(cEl.dataset.col, 10) + 1;
                var rows = parseInt(cEl.dataset.row, 10) + 1;
                var md = MarkdownTextOps.buildTable(cols, Math.max(1, rows - 1));
                if (self._isWysiwygActive()) {
                    self._insertWysiwygMarkdownToken(md, true);
                } else {
                    self._applyOp(function (t, a) {
                        var pre = (a > 0 && t.charAt(a - 1) !== '\n') ? '\n' : '';
                        return MarkdownTextOps.insertText(t, a, a, pre + md);
                    });
                }
                self._closeActivePopover();
            });

            pop.appendChild(grid);
            pop.appendChild(readout);
            pop.appendChild(hint);
            this._mountPopover(anchorBtn, pop);
        },

        _openBlockPicker: function (anchorBtn) {
            var self = this;
            var pop = el('div', 'text-full-editor-table-picker text-full-editor-block-picker');
            pop.appendChild(el('div', 'text-full-editor-table-picker-title', 'Block Callout'));
            var row = el('div', 'text-full-editor-block-picker-row');
            var w = getTargetTextWidget();
            var cfg = w ? w.config : null;

            var applyWysiwygCallout = function (variantOrCustom) {
                var r = self._restoreWysiwygRange();
                var anc = r ? (r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement) : null;
                var existing = anc && anc.closest ? anc.closest('.text-md-block') : null;
                self._pushUndoState();
                if (existing && self._previewRootEl.contains(existing)) {
                    existing.classList.remove('text-md-block-1', 'text-md-block-2', 'text-md-block-3', 'text-md-block-4', 'text-md-block-custom');
                    if (/^[1-4]$/.test(variantOrCustom)) {
                        existing.classList.add('text-md-block-' + variantOrCustom);
                        existing.removeAttribute('data-text-md-block-color');
                    } else {
                        existing.classList.add('text-md-block-custom');
                        existing.setAttribute('data-text-md-block-color', variantOrCustom);
                    }
                    self._commitWysiwygDomToMarkdown({ flush: true, rerenderWysiwyg: true });
                } else {
                    var txt = (r && !r.collapsed) ? r.toString() : 'Callout message';
                    var md = /^[1-4]$/.test(variantOrCustom)
                        ? ('[block' + variantOrCustom + ':' + txt + ']')
                        : ('[block ' + variantOrCustom + ':' + txt + ']');
                    self._insertWysiwygMarkdownToken(md, true);
                }
            };

            ['1', '2', '3', '4'].forEach(function (n) {
                var b = el('button', 'text-full-editor-block-picker-btn');
                b.type = 'button';
                var tok = cfg && cfg['mdBlock' + n + 'Color'] ? cfg['mdBlock' + n + 'Color'] : ('@markerTint' + n);
                var swCol = resolveCssColor(tok) || '#3b82f6';
                b.innerHTML = '<span class="tfe-callout-swatch" style="background:' + escHtml(swCol) + '"></span><span class="text-full-editor-block-picker-label">Block ' + n + '</span>';
                b.addEventListener('click', function () {
                    if (self._isWysiwygActive()) applyWysiwygCallout(n);
                    else self._applyOp(function (t, a, bSel) { return MarkdownTextOps.wrapBlockCallout(t, a, bSel, n); });
                    self._closeActivePopover();
                });
                row.appendChild(b);
            });
            pop.appendChild(row);

            var customSection = el('div', 'tfe-pop-custom-row');
            var customColor = '@accent';
            var cp = null;
            if (typeof EditorColorPicker !== 'undefined' && typeof EditorColorPicker.attach === 'function') {
                var mount = el('div', 'tfe-color-mount');
                cp = EditorColorPicker.attach({
                    mountCard: mount,
                    allowThemeTokens: true,
                    positionMode: 'anchor',
                    zIndex: 10070,
                    getRaw: function () { return customColor; },
                    setValue: function (v) { customColor = v || '@accent'; }
                });
                var applyCustom = el('button', 'btn-tool primary tfe-pop-apply-btn', 'Wrap Custom');
                applyCustom.type = 'button';
                applyCustom.addEventListener('click', function () {
                    if (self._isWysiwygActive()) applyWysiwygCallout(customColor);
                    else self._applyOp(function (t, a, bSel) { return MarkdownTextOps.wrapBlockCalloutCustom(t, a, bSel, customColor); });
                    self._closeActivePopover();
                });
                customSection.appendChild(mount);
                customSection.appendChild(applyCustom);
                pop.appendChild(customSection);
            }

            this._mountPopover(anchorBtn, pop, function () {
                if (cp && cp.destroy) cp.destroy();
            });
        },

        _openInlineColorPopover: function (anchorBtn, onPickColor) {
            var self = this;
            var pop = el('div', 'text-full-editor-table-picker tfe-rich-popover');
            pop.appendChild(el('div', 'text-full-editor-table-picker-title', 'Text Color'));
            var picked = '@accent';
            var cp = null;
            if (typeof EditorColorPicker !== 'undefined' && typeof EditorColorPicker.attach === 'function') {
                var mount = el('div', 'tfe-color-mount');
                cp = EditorColorPicker.attach({
                    mountCard: mount,
                    allowThemeTokens: true,
                    positionMode: 'anchor',
                    zIndex: 10070,
                    getRaw: function () { return picked; },
                    setValue: function (v) { picked = v || '@accent'; }
                });
                pop.appendChild(mount);
            }
            var apply = el('button', 'btn-tool primary tfe-full-btn', 'Apply Color');
            apply.type = 'button';
            apply.addEventListener('click', function () {
                onPickColor(picked);
                self._closeActivePopover();
            });
            pop.appendChild(apply);
            this._mountPopover(anchorBtn, pop, function () { if (cp && cp.destroy) cp.destroy(); });
        },

        _openInlineTopicPopover: function (anchorBtn, onPickTopic) {
            var self = this;
            var pop = el('div', 'text-full-editor-table-picker tfe-rich-popover');
            pop.appendChild(el('div', 'text-full-editor-table-picker-title', 'Insert Topic'));
            if (typeof Editor !== 'undefined' && typeof Editor.createTopicDropdown === 'function') {
                var dd = Editor.createTopicDropdown('', 'Search topics...', function (val) {
                    if (!val) return;
                    onPickTopic(val);
                    self._closeActivePopover();
                }, '', true, true, null, { warnWhenEmpty: false });
                pop.appendChild(dd);
                setTimeout(function () {
                    var inp = dd.querySelector('input');
                    if (inp) inp.focus();
                }, 0);
            }
            this._mountPopover(anchorBtn, pop);
        },

        _openIconInserterPopover: function (anchorBtn) {
            var self = this;
            var pop = el('div', 'text-full-editor-table-picker tfe-rich-popover');
            pop.appendChild(el('div', 'text-full-editor-table-picker-title', 'Insert Phosphor Icon'));

            var state = { name: 'ph-star', weight: 'default', size: '', tint: '', secondary: '' };
            var pickPickers = [];

            var pickBtn = el('button', 'btn-tool tfe-full-btn');
            pickBtn.type = 'button';
            var syncBtn = function () {
                var wc = (typeof BaseWidget !== 'undefined' && BaseWidget.phosphorWeightClass)
                    ? BaseWidget.phosphorWeightClass(state.weight === 'default' ? 'regular' : state.weight)
                    : 'ph-bold';
                pickBtn.innerHTML = '<i class="' + wc + ' ' + escHtml(state.name) + '"></i><span>' + escHtml(state.name) + ' (Browse...)</span>';
            };
            syncBtn();
            pickBtn.addEventListener('click', function () {
                if (typeof Dashboard === 'undefined' || typeof Dashboard.openIconBrowser !== 'function') return;
                Dashboard.openIconBrowser(state.name, function (chosen) {
                    if (chosen) {
                        state.name = chosen;
                        syncBtn();
                    }
                });
            });
            pop.appendChild(pickBtn);

            var pair = el('div', 'tfe-pair');
            pair.appendChild(this._inspFieldGroup('Style', this._inspSelect(WEIGHT_OPTIONS, state.weight, function (w) {
                state.weight = w;
                syncBtn();
                secMount.hidden = (w !== 'duotone');
            })));
            pair.appendChild(this._inspFieldGroup('Size (px)', this._inspTextInput('', 'Auto', function (v) { state.size = v; }, { numeric: true, min: 1, max: 4096 })));
            pop.appendChild(pair);

            var tintMount = el('div', 'tfe-field');
            tintMount.appendChild(el('label', 'control-label tfe-field-label', 'Primary Tint (Optional)'));
            var secMount = el('div', 'tfe-field');
            secMount.appendChild(el('label', 'control-label tfe-field-label', 'Duotone Secondary Tint'));
            secMount.hidden = true;

            if (typeof EditorColorPicker !== 'undefined' && typeof EditorColorPicker.attach === 'function') {
                var m1 = el('div', 'tfe-color-mount');
                pickPickers.push(EditorColorPicker.attach({
                    mountCard: m1, allowThemeTokens: true, positionMode: 'anchor', zIndex: 10070,
                    getRaw: function () { return state.tint; },
                    setValue: function (v) { state.tint = v || ''; },
                    onClear: function () { state.tint = ''; }
                }));
                tintMount.appendChild(m1);
                var m2 = el('div', 'tfe-color-mount');
                pickPickers.push(EditorColorPicker.attach({
                    mountCard: m2, allowThemeTokens: true, positionMode: 'anchor', zIndex: 10070,
                    getRaw: function () { return state.secondary; },
                    setValue: function (v) { state.secondary = v || ''; },
                    onClear: function () { state.secondary = ''; }
                }));
                secMount.appendChild(m2);
            }
            pop.appendChild(tintMount);
            pop.appendChild(secMount);

            var insBtn = el('button', 'btn-tool primary tfe-full-btn', 'Insert Icon Token');
            insBtn.type = 'button';
            insBtn.addEventListener('click', function () {
                var tok = MarkdownBlockCodec.iconObjToMd(state);
                if (tok) {
                    if (self._isWysiwygActive()) self._insertWysiwygMarkdownToken(tok, false);
                    else self._applyOp(function (t, a, b) { return MarkdownTextOps.insertText(t, a, b, tok); });
                }
                self._closeActivePopover();
            });
            pop.appendChild(insBtn);

            this._mountPopover(anchorBtn, pop, function () {
                pickPickers.forEach(function (p) { if (p && p.destroy) p.destroy(); });
            });
        },

        _openLinkPopover: function (anchorBtn, customInsertCb) {
            var self = this;
            var pop = el('div', 'text-full-editor-table-picker tfe-rich-popover');
            pop.appendChild(el('div', 'text-full-editor-table-picker-title', 'Insert Link'));

            var linkType = 'url';
            var urlVal = 'https://';
            var helpVal = 'Widgets/text';
            var labelVal = '';
            var newTab = true;

            var urlWrap = el('div', 'tfe-field-stack');
            var helpWrap = el('div', 'tfe-field-stack');
            helpWrap.hidden = true;

            pop.appendChild(this._inspSegmented([
                { value: 'url', text: 'Web URL', icon: 'ph-globe' },
                { value: 'help', text: 'In-App Help', icon: 'ph-book-open-text' }
            ], 'url', function (mode) {
                linkType = mode;
                urlWrap.hidden = (mode !== 'url');
                helpWrap.hidden = (mode !== 'help');
                pop.querySelectorAll('.tfe-mini-seg-btn').forEach(function (bt, i) {
                    bt.classList.toggle('is-active', (i === 0 && mode === 'url') || (i === 1 && mode === 'help'));
                });
            }));

            var lblInp = this._inspTextInput('', 'Link text (uses selection if empty)', function (v) { labelVal = v; });
            pop.appendChild(this._inspFieldGroup('Label', lblInp));

            var urlInp = this._inspTextInput(urlVal, 'https://example.com', function (v) { urlVal = v; });
            urlWrap.appendChild(this._inspFieldGroup('URL', urlInp));
            var ntRow = el('label', 'tfe-checkbox-row');
            var ntCb = el('input');
            ntCb.type = 'checkbox';
            ntCb.checked = true;
            ntCb.addEventListener('change', function () { newTab = ntCb.checked; });
            ntRow.appendChild(ntCb);
            ntRow.appendChild(el('span', '', 'Open in new tab (^)'));
            urlWrap.appendChild(ntRow);
            pop.appendChild(urlWrap);

            var helpOpts = buildHelpTargetOptions();
            helpWrap.appendChild(this._inspFieldGroup('Help Topic', this._inspSelect(helpOpts, helpVal, function (v) {
                helpVal = v;
                helpInp.value = v;
            })));
            var helpInp = this._inspTextInput(helpVal, 'Widgets/text#section', function (v) {
                helpVal = v.replace(/^help:\/\//i, '');
            });
            helpWrap.appendChild(this._inspFieldGroup('Help Path', helpInp));
            pop.appendChild(helpWrap);

            var insBtn = el('button', 'btn-tool primary tfe-full-btn', 'Insert Link');
            insBtn.type = 'button';
            insBtn.addEventListener('click', function () {
                var finalUrl = linkType === 'help' ? ('help://' + helpVal.trim()) : urlVal.trim();
                var finalTab = linkType === 'help' ? false : newTab;
                if (!finalUrl) return;
                if (typeof customInsertCb === 'function') {
                    customInsertCb(finalUrl, finalTab, labelVal);
                } else if (self._isWysiwygActive()) {
                    var r = self._getWysiwygSelectionRange();
                    var selTxt = (r && !r.collapsed) ? r.toString() : '';
                    var lbl = (labelVal || selTxt || finalUrl).replace(/[\[\]]/g, '');
                    self._insertWysiwygMarkdownToken('[' + lbl + '](' + finalUrl + (finalTab ? ' ^' : '') + ')', false);
                } else {
                    self._applyOp(function (t, a, b) {
                        return MarkdownTextOps.insertLink(t, a, b, finalUrl, finalTab, labelVal);
                    });
                }
                self._closeActivePopover();
            });
            pop.appendChild(insBtn);

            this._mountPopover(anchorBtn, pop);
            setTimeout(function () { urlInp.focus(); }, 0);
        },

        _openTopicFormulaPopover: function (anchorBtn) {
            var self = this;
            var pop = el('div', 'text-full-editor-table-picker tfe-rich-popover tfe-rich-popover--wide');
            pop.appendChild(el('div', 'text-full-editor-table-picker-title', 'Insert Live Topic or Formula'));

            var topicPane = el('div', 'tfe-field-stack');
            var formulaPane = el('div', 'tfe-field-stack');
            formulaPane.hidden = true;

            pop.appendChild(this._inspSegmented([
                { value: 'topic', text: 'Live Topic', icon: 'ph-broadcast' },
                { value: 'formula', text: 'Payload Formula', icon: 'ph-function' }
            ], 'topic', function (m) {
                topicPane.hidden = (m !== 'topic');
                formulaPane.hidden = (m !== 'formula');
                pop.querySelectorAll('.tfe-mini-seg-btn').forEach(function (bt, i) {
                    bt.classList.toggle('is-active', (i === 0 && m === 'topic') || (i === 1 && m === 'formula'));
                });
            }));

            var insertToken = function (tok) {
                if (self._isWysiwygActive()) self._insertWysiwygMarkdownToken(tok, false);
                else self._applyOp(function (t, a, b) { return MarkdownTextOps.insertText(t, a, b, tok); });
            };

            if (typeof Editor !== 'undefined' && typeof Editor.createTopicDropdown === 'function') {
                var dd = Editor.createTopicDropdown('', 'Search topics to insert...', function (val) {
                    if (!val) return;
                    insertToken('{{' + val + '}}');
                    self._closeActivePopover();
                }, '', true, true, null, { warnWhenEmpty: false });
                topicPane.appendChild(this._inspFieldGroup('Pick Topic', dd));
                setTimeout(function () {
                    var inp = dd.querySelector('input');
                    if (inp) inp.focus();
                }, 0);
            }
            pop.appendChild(topicPane);

            var fExpr = FORMULA_TEMPLATES[0].expr;
            var fTa = this._inspTextarea(fExpr, 'if({{homey/temp}} > 20, "Hot", "Cold")', 3, function (v) { fExpr = v; });
            var tmplOpts = FORMULA_TEMPLATES.map(function (t, ti) { return { value: String(ti), text: t.label }; });
            formulaPane.appendChild(this._inspFieldGroup('Template', this._inspSelect(tmplOpts, '0', function (ti) {
                var tpl = FORMULA_TEMPLATES[Number(ti)];
                if (tpl) { fExpr = tpl.expr; fTa.value = tpl.expr; }
            })));
            formulaPane.appendChild(this._inspFieldGroup('Formula', fTa));

            if (typeof Editor !== 'undefined' && typeof Editor.createTopicDropdown === 'function') {
                var fTopicDd = Editor.createTopicDropdown('', 'Insert {{topic}} into formula...', function (val) {
                    if (!val) return;
                    var p = fTa.selectionStart != null ? fTa.selectionStart : fTa.value.length;
                    var r = MarkdownTextOps.insertText(fTa.value, p, fTa.selectionEnd != null ? fTa.selectionEnd : p, '{{' + val + '}}');
                    fTa.value = r.text;
                    fExpr = r.text;
                }, '', true, true, null, { warnWhenEmpty: false });
                formulaPane.appendChild(this._inspFieldGroup('Add Topic to Formula', fTopicDd));
            }
            var insFBtn = el('button', 'btn-tool primary tfe-full-btn', 'Insert {{Formula}}');
            insFBtn.type = 'button';
            insFBtn.addEventListener('click', function () {
                var clean = fExpr.trim();
                if (clean) insertToken('{{' + clean + '}}');
                self._closeActivePopover();
            });
            formulaPane.appendChild(insFBtn);
            pop.appendChild(formulaPane);

            this._mountPopover(anchorBtn, pop);
        },

        _insertImageUrl: function () {
            var self = this;
            if (typeof CustomDialog === 'undefined' || typeof CustomDialog.prompt !== 'function') return;
            void CustomDialog.prompt('Image URL', '', 'Insert image', { markdownImageFields: true }).then(function (result) {
                if (!self._root || !result || typeof result !== 'object') return;
                var url = result.url != null ? String(result.url).trim() : '';
                if (!url.length) return;
                var md = MarkdownBlockCodec.imageObjToMd({
                    url: url,
                    alt: 'Image',
                    width: result.width > 0 ? String(result.width) : '',
                    height: result.height > 0 ? String(result.height) : '',
                    tint: result.tint || ''
                });
                if (self._isWysiwygActive()) {
                    self._insertWysiwygMarkdownToken(md, false);
                } else {
                    self._applyOp(function (t, a, b) { return MarkdownTextOps.insertText(t, a, b, md); });
                }
            });
        },

        _openGallery: function () {
            var self = this;
            if (typeof ImageGallery === 'undefined' || typeof ImageGallery.open !== 'function') return;
            ImageGallery.open({
                pickMode: true,
                pickFormat: 'markdown',
                onPick: function (markdownLine) {
                    if (!self._root || !markdownLine) return;
                    if (self._isWysiwygActive()) {
                        self._insertWysiwygMarkdownToken(markdownLine.trim(), false);
                        return;
                    }
                    self._applyOp(function (t, a, b) {
                        var pre = (a > 0 && t.charAt(a - 1) !== '\n') ? '\n' : '';
                        var post = (markdownLine.slice(-1) !== '\n') ? '\n' : '';
                        return MarkdownTextOps.insertText(t, a, b, pre + markdownLine + post);
                    });
                }
            });
        },

        // =====================================================================
        // Utilities: Single-line \n toggle, Copy, Import, Export, Clear, Find
        // =====================================================================

        _toggleSingleLineNewlines: function () {
            if (!this._textarea) return;
            var cur = this._textarea.value;
            this._pushUndoState();
            var next;
            if (cur.indexOf('\n') >= 0) {
                next = cur.replace(/\r\n?/g, '\n').split('\n').join('\\n');
                this._setStatus('Collapsed newlines into literal \\n.');
            } else {
                next = cur.split('\\n').join('\n');
                this._setStatus('Expanded literal \\n into multiline lines.');
            }
            this._textarea.value = next;
            this._markdown = next;
            this._blocks = MarkdownBlockCodec.parseMarkdownToBlocks(next);
            this._syncToWidget(true);
            this._refreshLivePreviews();
            this._updateStatusBar();
            this._textarea.focus();
        },

        _copyMarkdown: async function () {
            var val = this._textarea ? this._textarea.value : this._markdown;
            if (!val) {
                this._setStatus('Nothing to copy.');
                return;
            }
            try {
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    await navigator.clipboard.writeText(val);
                    this._setStatus('Markdown copied to clipboard.');
                    return;
                }
            } catch (e) { /* fallback below */ }
            var tmp = el('textarea');
            tmp.value = val;
            tmp.style.position = 'fixed';
            tmp.style.opacity = '0';
            document.body.appendChild(tmp);
            tmp.select();
            try {
                document.execCommand('copy');
                this._setStatus('Markdown copied to clipboard.');
            } catch (e2) {
                this._setStatus('Copy failed - use Ctrl+C in Raw mode.');
            }
            document.body.removeChild(tmp);
        },

        _importFile: async function (file) {
            try {
                var raw = (await file.text()).replace(/^\uFEFF/, '');
                var nextMd = raw;
                var lower = file.name.toLowerCase();
                if (lower.slice(-5) === '.json') {
                    var parsed = JSON.parse(raw);
                    if (parsed && parsed.version === 1 && Array.isArray(parsed.blocks)) {
                        // Support importing proof-of-concept Designer JSON files seamlessly
                        var mapped = parsed.blocks.map(function (pb) {
                            if (!pb || !pb.type) return MarkdownBlockCodec.createDefaultBlock('text');
                            if (pb.type === 'rule') return { id: 'imp_' + Math.random(), type: 'rule' };
                            if (pb.type === 'heading') {
                                return {
                                    id: 'imp_' + Math.random(), type: 'heading',
                                    level: pb.level || '2', text: pb.text || '', color: pb.color || '',
                                    bold: false, italic: false, strike: false, blink: false, blinkSpeed: ''
                                };
                            }
                            if (pb.type === 'callout') {
                                return {
                                    id: 'imp_' + Math.random(), type: 'callout',
                                    variant: pb.variant || '1', customColor: '@accent',
                                    children: pb.text ? [MarkdownBlockCodec.createDefaultChildBlock('text', pb.text)] : [],
                                    blink: false, blinkSpeed: ''
                                };
                            }
                            if (pb.type === 'topic') {
                                return {
                                    id: 'imp_' + Math.random(), type: 'topic', mode: 'topic',
                                    path: pb.path || '', formula: '', prefix: '', suffix: '',
                                    color: '', bold: false, italic: false, blink: false, blinkSpeed: ''
                                };
                            }
                            if (pb.type === 'image') {
                                return {
                                    id: 'imp_' + Math.random(), type: 'image',
                                    url: pb.url || '', alt: pb.alt || 'Image', width: pb.width || '',
                                    height: pb.height || '', tint: pb.tint || '', linkUrl: '', linkNewTab: false
                                };
                            }
                            if (pb.type === 'icon') {
                                return {
                                    id: 'imp_' + Math.random(), type: 'icon',
                                    name: pb.name ? ('ph-' + String(pb.name).replace(/^ph-/, '')) : 'ph-star',
                                    weight: pb.weight || 'default', size: pb.size || '',
                                    tint: pb.tint || '', secondary: pb.secondary || '', label: '', blink: false, blinkSpeed: ''
                                };
                            }
                            if (pb.type === 'table' && Array.isArray(pb.rows)) {
                                return {
                                    id: 'imp_' + Math.random(), type: 'table', headerless: false,
                                    align: (pb.align || []).map(function (a) { return a || 'default'; }),
                                    rows: pb.rows.map(function (rw) {
                                        return (rw || []).map(function (cell) {
                                            var nc = MarkdownBlockCodec.createDefaultCell('');
                                            nc.background = cell.background || '';
                                            if (cell.type === 'topic') {
                                                var tc = MarkdownBlockCodec.createDefaultChildBlock('topic', cell.path || '');
                                                nc.children = [tc];
                                            } else if (cell.type === 'image') {
                                                var im = MarkdownBlockCodec.createDefaultChildBlock('image', cell.url || '');
                                                im.alt = cell.alt || 'Image';
                                                im.width = cell.width || '';
                                                im.height = cell.height || '';
                                                im.tint = cell.tint || '';
                                                nc.children = [im];
                                            } else if (cell.type === 'icon') {
                                                var ic = MarkdownBlockCodec.createDefaultChildBlock('icon', cell.name || 'ph-star');
                                                ic.weight = cell.weight || 'default';
                                                ic.size = cell.size || '';
                                                ic.tint = cell.tint || '';
                                                ic.secondary = cell.secondary || '';
                                                nc.children = [ic];
                                            } else if (cell.text) {
                                                nc.children = [MarkdownBlockCodec.createDefaultChildBlock('text', cell.text)];
                                            }
                                            return nc;
                                        });
                                    })
                                };
                            }
                            if (pb.list === 'ordered' || pb.list === 'unordered') {
                                return {
                                    id: 'imp_' + Math.random(), type: 'list', ordered: pb.list === 'ordered',
                                    items: String(pb.text || '').split('\n').filter(Boolean).map(function (ln) {
                                        return { text: ln, icon: '', color: pb.color || '', bold: !!pb.bold, italic: !!pb.italic, strike: !!pb.strike };
                                    })
                                };
                            }
                            return {
                                id: 'imp_' + Math.random(), type: 'text',
                                text: pb.text || '', color: pb.color || '', bold: !!pb.bold,
                                italic: !!pb.italic, strike: !!pb.strike, blink: !!pb.blink, blinkSpeed: pb.speed || ''
                            };
                        });
                        nextMd = MarkdownBlockCodec.serializeBlocksToMarkdown(mapped);
                    } else {
                        throw new Error('JSON file is not a recognized Markdown Designer file.');
                    }
                }
                this._pushUndoState();
                this._markdown = nextMd;
                if (this._textarea) this._textarea.value = nextMd;
                this._blocks = MarkdownBlockCodec.parseMarkdownToBlocks(nextMd);
                this._selectedBlock = this._blocks.length ? 0 : -1;
                this._cellRow = 0;
                this._cellCol = 0;
                this._selectedChildIndex = -1;
                this._syncToWidget(true);
                this._applyModeLayout();
                this._setStatus('Imported ' + file.name);
            } catch (err) {
                this._setStatus('Import failed: ' + (err && err.message ? err.message : 'Invalid file'));
            }
        },

        _exportMarkdown: function () {
            var val = this._textarea ? this._textarea.value : this._markdown;
            if (!val) {
                this._setStatus('Nothing to export.');
                return;
            }
            var w = getTargetTextWidget();
            var rawName = (w && w.overrides && w.overrides.metaName) ? w.overrides.metaName : 'text-widget';
            var filename = rawName.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '-') || 'text-widget';
            var url = URL.createObjectURL(new Blob([val], { type: 'text/markdown;charset=utf-8' }));
            var a = document.createElement('a');
            a.href = url;
            a.download = filename + '.md';
            a.click();
            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
            this._setStatus('Downloaded ' + filename + '.md');
        },

        _clearDocument: async function () {
            if (!this._markdown && !this._blocks.length) return;
            var ok = (typeof CustomDialog !== 'undefined' && typeof CustomDialog.confirm === 'function')
                ? await CustomDialog.confirm('Clear all Markdown content in this widget?', 'Markdown Studio')
                : window.confirm('Clear all Markdown content in this widget?');
            if (!ok) return;
            this._pushUndoState();
            this._markdown = '';
            this._blocks = [];
            this._selectedBlock = -1;
            this._cellRow = 0;
            this._cellCol = 0;
            this._selectedChildIndex = -1;
            if (this._textarea) this._textarea.value = '';
            this._syncToWidget(true);
            this._applyModeLayout();
            this._setStatus('Cleared content.');
        },

        // ---- Find & Replace ----

        _buildFindBar: function (wrap) {
            var self = this;
            wrap.style.display = 'none';
            var f1 = el('input', 'text-full-editor-find-input');
            f1.type = 'text';
            f1.placeholder = 'Find';
            var f2 = el('input', 'text-full-editor-find-input');
            f2.type = 'text';
            f2.placeholder = 'Replace with';
            var caseCb = el('input');
            caseCb.type = 'checkbox';
            caseCb.id = 'text-full-editor-case-cb';
            var caseLb = el('label', 'text-full-editor-find-case');
            caseLb.setAttribute('for', 'text-full-editor-case-cb');
            caseLb.appendChild(caseCb);
            caseLb.appendChild(document.createTextNode(' Aa'));

            var btnF = el('button', 'text-full-editor-find-btn');
            btnF.type = 'button';
            btnF.innerHTML = '<i class="ph-bold ph-caret-down"></i> Next';
            var btnR1 = el('button', 'text-full-editor-find-btn', 'Replace');
            btnR1.type = 'button';
            var btnRAll = el('button', 'text-full-editor-find-btn primary', 'Replace all');
            btnRAll.type = 'button';

            this._findBar.findInp = f1;
            this._findBar.repInp = f2;
            this._findBar.caseEl = caseCb;

            btnF.onclick = function () { self._findNext(); };
            btnR1.onclick = function () { self._replaceOne(); };
            btnRAll.onclick = function () { self._replaceAll(); };

            wrap.appendChild(f1);
            wrap.appendChild(f2);
            wrap.appendChild(caseLb);
            wrap.appendChild(btnF);
            wrap.appendChild(btnR1);
            wrap.appendChild(btnRAll);
        },

        _toggleFind: function () {
            if (!this._findBar || !this._findBar.wrap) return;
            var w = this._findBar.wrap;
            var open = w.style.display === 'none';
            w.style.display = open ? 'flex' : 'none';
            if (open && this._findBar.findInp) this._findBar.findInp.focus();
        },

        _findNext: function () {
            if (!this._findBar || !this._findBar.findInp || !this._textarea) return;
            var find = this._findBar.findInp.value || '';
            if (!find) return;
            var t = this._textarea.value;
            var from = this._textarea.selectionEnd;
            var c = this._findBar.caseEl && this._findBar.caseEl.checked;
            var idx;
            if (c) {
                idx = t.indexOf(find, from);
                if (idx < 0) idx = t.indexOf(find, 0);
            } else {
                var lowT = t.toLowerCase();
                var lowF = find.toLowerCase();
                idx = lowT.indexOf(lowF, from);
                if (idx < 0) idx = lowT.indexOf(lowF, 0);
            }
            if (idx < 0) {
                this._setStatus('No matches found.');
                this._textarea.focus();
                return;
            }
            this._textarea.selectionStart = idx;
            this._textarea.selectionEnd = idx + find.length;
            this._textarea.focus();
        },

        _replaceOne: function () {
            if (!this._findBar || !this._findBar.findInp || !this._textarea) return;
            var find = this._findBar.findInp.value || '';
            if (!find) return;
            var rep = this._findBar.repInp.value || '';
            var t = this._textarea.value;
            var a = this._textarea.selectionStart;
            var b = this._textarea.selectionEnd;
            var sel = t.slice(a, b);
            var c = this._findBar.caseEl.checked;
            var match = c ? (sel === find) : (sel.toLowerCase() === find.toLowerCase());
            if (!match) {
                this._findNext();
                return;
            }
            this._pushUndoState();
            this._textarea.value = t.slice(0, a) + rep + t.slice(b);
            this._textarea.selectionStart = a + rep.length;
            this._textarea.selectionEnd = a + rep.length;
            this._markdown = this._textarea.value;
            this._blocks = MarkdownBlockCodec.parseMarkdownToBlocks(this._markdown);
            this._syncToWidget(true);
            this._refreshLivePreviews();
            this._updateStatusBar();
            this._textarea.focus();
        },

        _replaceAll: function () {
            if (!this._findBar || !this._findBar.findInp || !this._textarea) return;
            var find = this._findBar.findInp.value || '';
            if (!find) return;
            var rep = (this._findBar.repInp && this._findBar.repInp.value) || '';
            var t = this._textarea.value;
            var c = this._findBar.caseEl && this._findBar.caseEl.checked;
            this._pushUndoState();
            var n;
            if (c) {
                n = t.split(find).join(rep);
            } else {
                var esc = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                n = t.replace(new RegExp(esc, 'gi'), function () { return rep; });
            }
            this._textarea.value = n;
            this._markdown = n;
            this._blocks = MarkdownBlockCodec.parseMarkdownToBlocks(n);
            this._syncToWidget(true);
            this._refreshLivePreviews();
            this._updateStatusBar();
            this._textarea.focus();
        },

        // =====================================================================
        // Drag Header, Resize Corner, & Keyboard Shortcuts
        // =====================================================================

        _bindDragHeader: function (header) {
            var self = this;
            var rootEl = this._root;
            if (typeof PointerDrag === 'undefined') return;
            header.style.touchAction = 'none';
            PointerDrag.bind(header, {
                raf: false,
                shouldStart: function (e) {
                    if (self._isMaximized) return false;
                    if (e.target && e.target.closest && (e.target.closest('button') || e.target.closest('a'))) {
                        return false;
                    }
                    return !!rootEl;
                },
                onDown: function (e) {
                    var r = rootEl.getBoundingClientRect();
                    self._drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
                    return { el: rootEl };
                },
                onMove: function (ev) {
                    if (!self._drag || !rootEl) return;
                    var x = Math.max(0, Math.min(window.innerWidth - 100, ev.clientX - self._drag.dx));
                    var y = Math.max(0, Math.min(window.innerHeight - 48, ev.clientY - self._drag.dy));
                    rootEl.style.left = x + 'px';
                    rootEl.style.top = y + 'px';
                    rootEl.style.right = 'auto';
                    rootEl.style.bottom = 'auto';
                },
                onUp: function () {
                    self._drag = null;
                    if (rootEl) self._saveBounds(rootEl);
                }
            });
        },

        _bindResize: function (handle) {
            var self = this;
            var rootEl = this._root;
            if (typeof PointerDrag === 'undefined') return;
            handle.style.touchAction = 'none';
            PointerDrag.bind(handle, {
                raf: false,
                shouldStart: function () { return !self._isMaximized; },
                onDown: function (e) {
                    var r = rootEl.getBoundingClientRect();
                    self._resize = { startW: r.width, startH: r.height, sx: e.clientX, sy: e.clientY };
                    return { el: rootEl };
                },
                onMove: function (ev) {
                    if (!self._resize || !rootEl) return;
                    var w = Math.max(460, Math.min(window.innerWidth - 20, self._resize.startW + (ev.clientX - self._resize.sx)));
                    var h = Math.max(360, Math.min(window.innerHeight - 20, self._resize.startH + (ev.clientY - self._resize.sy)));
                    rootEl.style.width = w + 'px';
                    rootEl.style.height = h + 'px';
                    self._updateCompactBreakpoint();
                },
                onUp: function () {
                    self._resize = null;
                    if (rootEl) self._saveBounds(rootEl);
                }
            });
        },

        _bindGlobalKeyboard: function () {
            var self = this;
            this._boundKeyHandler = function (e) {
                if (!self._root) return;
                // Do not intercept Escape when a child modal (Icon Browser, Gallery, CustomDialog) is open on top
                var iconModal = document.getElementById('icon-modal');
                var galModal = document.getElementById('gallery-modal');
                var cdModal = document.getElementById('custom-dialog');
                if ((iconModal && iconModal.classList.contains('open'))
                    || (galModal && galModal.classList.contains('show'))
                    || (cdModal && cdModal.classList.contains('show'))) {
                    return;
                }

                var isMac = navigator.platform && navigator.platform.indexOf('Mac') >= 0;
                var mod = isMac ? e.metaKey : e.ctrlKey;
                var k = (e.key || '').toLowerCase();
                var inRawTa = document.activeElement === self._textarea;
                var inWysiwyg = !!(self._previewRootEl && (document.activeElement === self._previewRootEl || self._previewRootEl.contains(document.activeElement)));
                var inAnyInput = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

                if (e.key === 'Escape') {
                    if (self._activePopover) {
                        e.preventDefault();
                        self._closeActivePopover();
                    } else if (self._findBar && self._findBar.wrap && self._findBar.wrap.style.display !== 'none') {
                        e.preventDefault();
                        self._findBar.wrap.style.display = 'none';
                    } else if (typeof EditorColorPicker === 'undefined' || !EditorColorPicker.isPanelOpen || !EditorColorPicker.isPanelOpen()) {
                        e.preventDefault();
                        self.close();
                    }
                    return;
                }

                if ((inRawTa || inWysiwyg) && mod) {
                    if (k === 'b') {
                        e.preventDefault();
                        self._dispatchInlineFormat('bold');
                    } else if (k === 'i') {
                        e.preventDefault();
                        self._dispatchInlineFormat('italic');
                    } else if (k === 'k') {
                        e.preventDefault();
                        var linkBtn = self._toolbarEl && self._toolbarEl.querySelector('[title*="Ctrl+K"]');
                        if (linkBtn) self._openLinkPopover(linkBtn);
                    } else if (k === 'f' && inRawTa) {
                        e.preventDefault();
                        if (self._findBar && self._findBar.wrap && self._findBar.wrap.style.display === 'none') {
                            self._toggleFind();
                        } else if (self._findBar && self._findBar.findInp) {
                            self._findBar.findInp.focus();
                        }
                    } else if (k === 'z' && !e.shiftKey) {
                        if (self._undo.length) {
                            e.preventDefault();
                            self._doUndo();
                        }
                    } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
                        if (self._redo.length) {
                            e.preventDefault();
                            self._doRedo();
                        }
                    }
                    return;
                }

                if (!inAnyInput && mod) {
                    if (k === 'z' && !e.shiftKey) {
                        if (self._undo.length) {
                            e.preventDefault();
                            self._doUndo();
                        }
                    } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
                        if (self._redo.length) {
                            e.preventDefault();
                            self._doRedo();
                        }
                    }
                }
            };
            document.addEventListener('keydown', this._boundKeyHandler, true);
        }
    };

    global.TextFullEditor = TextFullEditor;
})(typeof window !== 'undefined' ? window : this);
