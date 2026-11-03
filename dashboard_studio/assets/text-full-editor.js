/**
 * Draggable, resizable full Markdown editor for the Text widget (native textarea).
 * Depends: Editor, Dashboard, MarkdownTextOps, CustomDialog, ImageGallery (pick), DataDriverRegistry.
 *
 * Note: Dashboard, Editor, CustomDialog, HelpSystem are declared with `const` at the top of
 * their own script files, so they are NOT on `window`. We therefore reference them as bare
 * identifiers (which resolve through the shared classic-script scope), not via `global.X`.
 */
(function (global) {
    var LS_BOUNDS = 'dashboardstudio-text-full-editor-bounds';
    var MAX_UNDO = 50;
    var TYPING_CHECKPOINT_MS = 550;

    var TextFullEditor = {
        _root: null,
        _editorDimEl: null,
        _textarea: null,
        _taWrap: null,
        _opts: null,
        _undo: [],
        _redo: [],
        _typingTimer: null,
        _lastSnapshot: '',
        _mainInputListener: null,
        _boundDocMove: null,
        _boundDocUp: null,
        _drag: null,
        _resize: null,
        _findBar: null,
        _cellColorPicker: null,
        _cellColorMount: null,
        _textColorPicker: null,
        _textColorMount: null,
        _boundCellColorTaHandlers: null,
        _colAlignGroup: null,
        _colAlignBtns: null,

        open: function (opts) {
            if (!opts || typeof opts.getText !== 'function' || typeof opts.setText !== 'function') return;
            if (this._root) {
                this.close();
            }
            this._opts = opts;
            if (typeof Editor !== 'undefined' && typeof Editor.setFullTextEditorActive === 'function') {
                Editor.setFullTextEditorActive(true);
            }
            this._undo = [];
            this._redo = [];
            this._buildUi();
            var start = this._opts.getText();
            if (start === null || start === undefined) start = '';
            this._textarea.value = String(start);
            this._lastSnapshot = this._textarea.value;
            this._syncToWidget(false);
            this._wireMainInputSync();
            this._textarea.focus();
            this._updateTableToolbarState();
            this._updateTextColorToolbarState();
        },

        close: function () {
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
            if (this._tablePickerTimer) {
                clearTimeout(this._tablePickerTimer);
                this._tablePickerTimer = null;
            }
            if (this._blockPickerTimer) {
                clearTimeout(this._blockPickerTimer);
                this._blockPickerTimer = null;
            }
            if (this._blinkPickerTimer) {
                clearTimeout(this._blinkPickerTimer);
                this._blinkPickerTimer = null;
            }
            if (this._tablePickerOutside) {
                try { document.removeEventListener('mousedown', this._tablePickerOutside, true); } catch (e) { /* ignore */ }
                this._tablePickerOutside = null;
            }
            if (this._blockPickerOutside) {
                try { document.removeEventListener('mousedown', this._blockPickerOutside, true); } catch (e) { /* ignore */ }
                this._blockPickerOutside = null;
            }
            if (this._blinkPickerOutside) {
                try { document.removeEventListener('mousedown', this._blinkPickerOutside, true); } catch (e) { /* ignore */ }
                this._blinkPickerOutside = null;
            }
            this._teardownCellColorPicker();
            this._teardownTextColorPicker();
            this._teardownDragResize();
            if (this._editorDimEl && this._editorDimEl.parentNode) {
                this._editorDimEl.parentNode.removeChild(this._editorDimEl);
            }
            if (this._root && this._root.parentNode) {
                this._root.parentNode.removeChild(this._root);
            }
            this._editorDimEl = null;
            this._root = null;
            this._textarea = null;
            this._taWrap = null;
            this._opts = null;
            this._findBar = null;
            this._colAlignGroup = null;
            this._colAlignBtns = null;
            this._blinkGroup = null;
            this._blinkMainBtn = null;
            this._blinkCaretBtn = null;
            if (typeof Editor !== 'undefined') {
                if (typeof Editor.setFullTextEditorActive === 'function') {
                    Editor.setFullTextEditorActive(false);
                }
                if (typeof Editor.flushPendingTextPreview === 'function') {
                    Editor.flushPendingTextPreview();
                }
            }
            if (this._opts && typeof this._opts.onClose === 'function') {
                try {
                    this._opts.onClose();
                } catch (e) { /* ignore */ }
            }
        },

        isOpen: function () {
            return this._root !== null;
        },

        _wireMainInputSync: function () {
            var self = this;
            if (!this._opts || !this._opts.mainTextarea) return;
            this._mainInputListener = function () {
                if (!self._textarea) return;
                self._textarea.value = self._opts.mainTextarea.value;
                self._lastSnapshot = self._textarea.value;
            };
            this._opts.mainTextarea.addEventListener('input', this._mainInputListener);
        },

        _readBounds: function () {
            var def = { left: 40, top: 80, w: 720, h: 520 };
            try {
                var raw = localStorage.getItem(LS_BOUNDS);
                if (!raw) return def;
                var o = JSON.parse(raw);
                if (typeof o.w === 'number' && o.w >= 320) def.w = o.w;
                if (typeof o.h === 'number' && o.h >= 240) def.h = o.h;
                if (typeof o.left === 'number') def.left = o.left;
                if (typeof o.top === 'number') def.top = o.top;
            } catch (e) { /* use def */ }
            return def;
        },

        _saveBounds: function (el) {
            try {
                var r = el.getBoundingClientRect();
                var o = { left: r.left, top: r.top, w: r.width, h: r.height };
                localStorage.setItem(LS_BOUNDS, JSON.stringify(o));
            } catch (e) { /* ignore */ }
        },

        _buildUi: function () {
            var self = this;
            var b = this._readBounds();
            var edPanel = document.getElementById('editor-panel');
            if (edPanel) {
                this._editorDimEl = document.createElement('div');
                this._editorDimEl.className = 'text-full-editor-editor-dim';
                this._editorDimEl.setAttribute('aria-hidden', 'true');
                this._editorDimEl.onclick = function () { self.close(); };
                edPanel.appendChild(this._editorDimEl);
            }
            this._root = document.createElement('div');
            this._root.className = 'text-full-editor';
            this._root.setAttribute('role', 'dialog');
            this._root.setAttribute('aria-label', 'Full text editor');
            this._root.style.left = b.left + 'px';
            this._root.style.top = b.top + 'px';
            this._root.style.width = b.w + 'px';
            this._root.style.height = b.h + 'px';

            var header = document.createElement('div');
            header.className = 'text-full-editor-header';

            var title = document.createElement('div');
            title.className = 'ds-dialog-title';
            title.innerHTML = '<i class="ph-bold ph-text-aa ds-dialog-title-icon"></i><span>Markdown editor</span>';

            var helpWrap = document.createElement('div');
            helpWrap.className = 'text-full-editor-help-links';
            if (typeof HelpSystem !== 'undefined' && typeof HelpSystem.createEditorHelpLink === 'function') {
                var hl = (this._opts && this._opts.helpLabelLink) ? this._opts.helpLabelLink : null;
                helpWrap.appendChild(HelpSystem.createEditorHelpLink({
                    linkText: (hl && hl.linkText) ? hl.linkText : 'Markdown Formatting Reference',
                    linkClass: 'ds-help-link',
                    iconPh: 'ph-book-open-text',
                    topic: (hl && hl.topic) ? hl.topic : 'Data Types & Formats',
                    widgetSub: (hl && hl.widgetSub) ? hl.widgetSub : 'markdown-formatting',
                    anchor: (hl && hl.anchor) ? hl.anchor : undefined
                }));
                helpWrap.appendChild(HelpSystem.createEditorHelpLink({
                    linkText: 'Keyboard',
                    linkClass: 'ds-help-link',
                    iconPh: 'ph-keyboard',
                    topic: 'Widgets',
                    widgetSub: 'text',
                    anchor: 'help-text-full-editor-kbd'
                }));
            }

            var closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'ds-dialog-close';
            closeBtn.setAttribute('aria-label', 'Close');
            closeBtn.title = 'Close (Esc)';
            closeBtn.innerHTML = '<i class="ph-bold ph-x"></i>';
            closeBtn.onclick = function () { self.close(); };

            header.appendChild(title);
            if (helpWrap.childNodes.length) {
                header.appendChild(helpWrap);
            }
            header.appendChild(closeBtn);
            this._root.appendChild(header);

            var tool = document.createElement('div');
            tool.className = 'text-full-editor-toolbar';
            this._addToolRow1(tool);
            this._addToolRow2(tool);
            this._root.appendChild(tool);

            this._taWrap = document.createElement('div');
            this._taWrap.className = 'text-full-editor-ta-wrap';
            this._textarea = document.createElement('textarea');
            this._textarea.className = 'text-full-editor-ta';
            this._textarea.spellcheck = true;
            this._textarea.placeholder = 'Start writing markdown…';
            this._taWrap.appendChild(this._textarea);
            this._root.appendChild(this._taWrap);

            var findWrap = document.createElement('div');
            findWrap.className = 'text-full-editor-find';
            this._findBar = { wrap: findWrap, findInp: null, repInp: null, caseEl: null };
            this._buildFindBar(findWrap);
            this._root.appendChild(findWrap);

            var resize = document.createElement('div');
            resize.className = 'text-full-editor-resize';
            resize.setAttribute('aria-hidden', 'true');
            this._root.appendChild(resize);

            this._bindDragHeader(header);
            this._bindResize(resize);
            this._bindTaInput();
            this._bindKeyboard();

            document.body.appendChild(this._root);
        },

        _addToolRow1: function (parent) {
            var self = this;
            var row = document.createElement('div');
            row.className = 'text-full-editor-toolbar-row';
            this._addBtn(row, 'Bold', 'ph-text-b', function () { self._applyOp(function (t, a, b) { return MarkdownTextOps.wrapBold(t, a, b); }); });
            this._addBtn(row, 'Italic', 'ph-text-italic', function () { self._applyOp(function (t, a, b) { return MarkdownTextOps.wrapItalic(t, a, b); }); });
            self._addTextColorPicker(row);
            self._addBlinkSplit(row);
            this._addSep(row);
            this._addBtn(row, 'H1', 'ph-text-h-one', function () { self._applyHeading(1); });
            this._addBtn(row, 'H2', 'ph-text-h-two', function () { self._applyHeading(2); });
            this._addBtn(row, 'H3', 'ph-text-h-three', function () { self._applyHeading(3); });
            this._addSep(row);
            this._addBtn(row, 'Inline code', 'ph-code', function () { self._applyOp(function (t, a, b) { return MarkdownTextOps.wrapInlineCode(t, a, b); }); });
            this._addBtn(row, 'Code block', 'ph-file-code', function () { self._applyOp(function (t, a, b) { return MarkdownTextOps.wrapCodeBlock(t, a, b); }); });
            this._addBtn(row, 'Quote', 'ph-quotes', function () { self._applyLines(function (s, a, b) { return MarkdownTextOps.toggleBlockquote(s, a, b); }); });
            this._addBtn(row, 'Block callout', 'ph-flag-banner', function (btn) { self._openBlockPicker(btn); });
            parent.appendChild(row);
        },

        _addToolRow2: function (parent) {
            var self = this;
            var row = document.createElement('div');
            row.className = 'text-full-editor-toolbar-row';
            this._addBtn(row, 'Bullet list', 'ph-list-bullets', function () { self._applyLines(function (s, a, b) { return MarkdownTextOps.toggleBulletList(s, a, b); }); });
            this._addBtn(row, 'Numbered list', 'ph-list-numbers', function () { self._applyLines(function (s, a, b) { return MarkdownTextOps.toggleNumberedList(s, a, b); }); });
            this._addBtn(row, 'Horizontal rule', 'ph-minus', function () { self._hr(); });
            this._addBtn(row, 'Insert table', 'ph-table', function (btn) { self._openTablePicker(btn); });
            self._addCellColorPicker(row);
            self._addColumnAlignGroup(row);
            this._addSep(row);
            this._addBtn(row, 'Link', 'ph-link', function () { self._insertLink(); });
            this._addBtn(row, 'Image URL', 'ph-image', function () { self._insertImageUrl(); });
            if (this._isHomey()) {
                this._addBtn(row, 'Image Gallery', 'ph-images-square', function () { self._openGallery(); });
            }
            this._addBtn(row, 'Insert icon', 'ph-star', function () { self._openIcon(); });
            this._addBtn(row, 'Insert topic', 'ph-tree-structure', function () { self._openTopicInserter(); });
            this._addSep(row);
            this._addBtn(row, 'Find & replace', 'ph-magnifying-glass', function () { self._toggleFind(); });
            parent.appendChild(row);
        },

        _addSep: function (row) {
            var s = document.createElement('span');
            s.className = 'text-full-editor-tb-sep';
            s.setAttribute('aria-hidden', 'true');
            row.appendChild(s);
        },

        _isHomey: function () {
            if (typeof DataDriverRegistry === 'undefined') return false;
            return DataDriverRegistry.getType() === 'homey' || DataDriverRegistry.getType() === 'homeassistant';
        },

        _addBtn: function (row, label, phIcon, onClick) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'text-full-editor-tb';
            b.title = label;
            b.setAttribute('aria-label', label);
            var icon = document.createElement('i');
            icon.className = 'ph-bold ' + phIcon;
            icon.style.pointerEvents = 'none';
            b.appendChild(icon);
            b.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                try { onClick(b); } catch (err) {
                    console.error('[TextFullEditor] toolbar action failed:', label, err);
                }
            });
            row.appendChild(b);
        },

        _bindDragHeader: function (header) {
            var self = this;
            var el = this._root;
            if (typeof PointerDrag === 'undefined') return;
            header.style.touchAction = 'none';
            PointerDrag.bind(header, {
                raf: false,
                shouldStart: function (e) {
                    if (e.target && e.target.closest) {
                        if (e.target.closest('button') || e.target.closest('a')) return false;
                    }
                    return !!el;
                },
                onDown: function (e) {
                    var r = el.getBoundingClientRect();
                    self._drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
                    return { el: el };
                },
                onMove: function (ev) {
                    if (!self._drag || !el) return;
                    var x = ev.clientX - self._drag.dx;
                    var y = ev.clientY - self._drag.dy;
                    var maxX = window.innerWidth - 80;
                    var maxY = window.innerHeight - 48;
                    if (x < 0) x = 0;
                    if (y < 0) y = 0;
                    if (x > maxX) x = maxX;
                    if (y > maxY) y = maxY;
                    el.style.left = x + 'px';
                    el.style.top = y + 'px';
                    el.style.right = 'auto';
                    el.style.bottom = 'auto';
                },
                onUp: function () {
                    self._drag = null;
                    if (el) self._saveBounds(el);
                }
            });
        },

        _teardownDragResize: function () {
            this._drag = null;
            this._resize = null;
        },

        _bindResize: function (handle) {
            var self = this;
            var el = this._root;
            if (typeof PointerDrag === 'undefined') return;
            handle.style.touchAction = 'none';
            PointerDrag.bind(handle, {
                raf: false,
                onDown: function (e) {
                    var r = el.getBoundingClientRect();
                    self._resize = { startW: r.width, startH: r.height, sx: e.clientX, sy: e.clientY };
                    return { el: el };
                },
                onMove: function (ev) {
                    if (!self._resize || !el) return;
                    var w = self._resize.startW + (ev.clientX - self._resize.sx);
                    var h = self._resize.startH + (ev.clientY - self._resize.sy);
                    if (w < 320) w = 320;
                    if (h < 200) h = 200;
                    if (w > window.innerWidth - 20) w = window.innerWidth - 20;
                    if (h > window.innerHeight - 20) h = window.innerHeight - 20;
                    el.style.width = w + 'px';
                    el.style.height = h + 'px';
                },
                onUp: function () {
                    self._resize = null;
                    if (el) self._saveBounds(el);
                }
            });
        },

        _bindTaInput: function () {
            var self = this;
            this._textarea.addEventListener('input', function () {
                self._syncToWidget(false);
                self._scheduleTypingCheckpoint();
                self._updateTableToolbarState();
                self._updateTextColorToolbarState();
            });
            this._bindCellColorCursorListeners();
        },

        _bindCellColorCursorListeners: function () {
            var self = this;
            this._teardownCellColorCursorListeners();
            if (!this._textarea) return;
            var handler = function () {
                self._updateTableToolbarState();
                self._updateTextColorToolbarState();
            };
            this._boundCellColorTaHandlers = handler;
            this._textarea.addEventListener('keyup', handler, false);
            this._textarea.addEventListener('mouseup', handler, false);
            this._textarea.addEventListener('click', handler, false);
            document.addEventListener('selectionchange', handler, false);
        },

        _teardownCellColorCursorListeners: function () {
            if (this._boundCellColorTaHandlers) {
                if (this._textarea) {
                    try {
                        this._textarea.removeEventListener('keyup', this._boundCellColorTaHandlers, false);
                        this._textarea.removeEventListener('mouseup', this._boundCellColorTaHandlers, false);
                        this._textarea.removeEventListener('click', this._boundCellColorTaHandlers, false);
                    } catch (e) { /* ignore */ }
                }
                try {
                    document.removeEventListener('selectionchange', this._boundCellColorTaHandlers, false);
                } catch (e2) { /* ignore */ }
            }
            this._boundCellColorTaHandlers = null;
        },

        _teardownCellColorPicker: function () {
            this._teardownCellColorCursorListeners();
            if (this._cellColorPicker && typeof this._cellColorPicker.destroy === 'function') {
                this._cellColorPicker.destroy();
            }
            this._cellColorPicker = null;
            this._cellColorMount = null;
        },

        _teardownTextColorPicker: function () {
            if (this._textColorPicker && typeof this._textColorPicker.destroy === 'function') {
                this._textColorPicker.destroy();
            }
            this._textColorPicker = null;
            this._textColorMount = null;
        },

        _getCellColorRaw: function () {
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

        _isCellColorToolbarEnabled: function () {
            if (!this._textarea || typeof MarkdownTextOps === 'undefined') return false;
            return !!MarkdownTextOps.getTableCellContext(
                this._textarea.value,
                this._textarea.selectionStart,
                this._textarea.selectionEnd
            );
        },

        _updateCellColorToolbarState: function () {
            if (!this._cellColorMount) return;
            var enabled = this._isCellColorToolbarEnabled();
            if (enabled) {
                this._cellColorMount.classList.remove('is-disabled');
                this._cellColorMount.setAttribute('aria-disabled', 'false');
            } else {
                this._cellColorMount.classList.add('is-disabled');
                this._cellColorMount.setAttribute('aria-disabled', 'true');
            }
            this._setColorTriggerTitle(
                this._cellColorPicker,
                this._cellColorMount,
                enabled
                    ? 'Table cell background'
                    : 'Table cell background. Place the cursor in a table cell.'
            );
            if (this._cellColorPicker && typeof this._cellColorPicker.sync === 'function') {
                this._cellColorPicker.sync();
            }
        },

        _getTextColorRaw: function () {
            if (!this._textarea || typeof MarkdownTextOps === 'undefined') return '';
            return MarkdownTextOps.getTextColorAtSelection(
                this._textarea.value,
                this._textarea.selectionStart,
                this._textarea.selectionEnd
            );
        },

        _isTextColorToolbarEnabled: function () {
            if (!this._textarea) return false;
            return this._textarea.selectionStart !== this._textarea.selectionEnd;
        },

        _updateTextColorToolbarState: function () {
            if (this._textColorMount) {
                var enabled = this._isTextColorToolbarEnabled();
                if (enabled) {
                    this._textColorMount.classList.remove('is-disabled');
                    this._textColorMount.setAttribute('aria-disabled', 'false');
                } else {
                    this._textColorMount.classList.add('is-disabled');
                    this._textColorMount.setAttribute('aria-disabled', 'true');
                }
                this._setColorTriggerTitle(
                    this._textColorPicker,
                    this._textColorMount,
                    enabled ? 'Text color' : 'Text color. Select text first.'
                );
                if (this._textColorPicker && typeof this._textColorPicker.sync === 'function') {
                    this._textColorPicker.sync();
                }
            }
            this._updateBlinkToolbarState();
        },

        _setColorTriggerTitle: function (picker, mount, title) {
            if (mount) {
                mount.title = title;
                mount.setAttribute('aria-label', title);
            }
            if (picker && typeof picker.setTitle === 'function') picker.setTitle(title);
        },

        _addTextColorPicker: function (row) {
            var self = this;
            if (typeof EditorColorPicker === 'undefined' || typeof EditorColorPicker.attach !== 'function') {
                return;
            }
            var mount = document.createElement('div');
            mount.className = 'text-full-editor-text-color-mount is-disabled';
            mount.setAttribute('aria-disabled', 'true');
            mount.title = 'Text color. Select text first.';
            mount.setAttribute('aria-label', mount.title);
            row.appendChild(mount);
            this._textColorMount = mount;

            var picker = EditorColorPicker.attach({
                mountCard: mount,
                allowThemeTokens: true,
                positionMode: 'anchor',
                zIndex: 10050,
                triggerMode: 'text',
                triggerTitle: mount.title,
                getRaw: function () {
                    return self._getTextColorRaw();
                },
                setValue: function (val) {
                    if (!self._isTextColorToolbarEnabled()) return;
                    self._pushUndoState();
                    var t = self._textarea.value;
                    var a = self._textarea.selectionStart;
                    var b = self._textarea.selectionEnd;
                    var r = MarkdownTextOps.wrapTextColor(t, a, b, val);
                    self._textarea.value = r.text;
                    self._textarea.selectionStart = r.cursor;
                    self._textarea.selectionEnd = r.selEnd;
                    self._syncToWidget(true);
                    self._updateTextColorToolbarState();
                },
                onAfterLocalChange: function () {
                    self._updateTextColorToolbarState();
                },
                onClear: function () {
                    if (!self._isTextColorToolbarEnabled()) return;
                    self._pushUndoState();
                    var t = self._textarea.value;
                    var a = self._textarea.selectionStart;
                    var b = self._textarea.selectionEnd;
                    var r = MarkdownTextOps.unwrapTextColor(t, a, b);
                    self._textarea.value = r.text;
                    self._textarea.selectionStart = r.cursor;
                    self._textarea.selectionEnd = r.selEnd;
                    self._syncToWidget(true);
                    self._updateTextColorToolbarState();
                }
            });

            this._textColorPicker = picker;
            this._blockColorPickerWhenInactive(picker, function () {
                return self._isTextColorToolbarEnabled();
            });
        },

        _isBlinkToolbarEnabled: function () {
            return this._isTextColorToolbarEnabled();
        },

        _updateBlinkToolbarState: function () {
            if (!this._blinkGroup) return;
            var enabled = this._isBlinkToolbarEnabled();
            if (enabled) {
                this._blinkGroup.classList.remove('is-disabled');
                this._blinkGroup.setAttribute('aria-disabled', 'false');
            } else {
                this._blinkGroup.classList.add('is-disabled');
                this._blinkGroup.setAttribute('aria-disabled', 'true');
            }
            if (this._blinkMainBtn) {
                this._blinkMainBtn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
                var blinkTip = enabled ? 'Blink' : 'Blink. Select text first.';
                this._blinkMainBtn.title = blinkTip;
                this._blinkMainBtn.setAttribute('aria-label', blinkTip);
            }
            if (this._blinkCaretBtn) {
                this._blinkCaretBtn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
                var speedTip = enabled ? 'Blink speed' : 'Blink speed. Select text first.';
                this._blinkCaretBtn.title = speedTip;
                this._blinkCaretBtn.setAttribute('aria-label', speedTip);
            }
        },

        _applyBlink: function (scale) {
            if (!this._isBlinkToolbarEnabled()) return;
            if (typeof MarkdownTextOps === 'undefined' || typeof MarkdownTextOps.wrapBlink !== 'function') return;
            this._applyOp(function (t, a, b) {
                return MarkdownTextOps.wrapBlink(t, a, b, scale);
            });
        },

        _addBlinkSplit: function (row) {
            var self = this;
            var group = document.createElement('div');
            group.className = 'text-full-editor-blink-group is-disabled';
            group.setAttribute('role', 'group');
            group.setAttribute('aria-label', 'Blink');
            group.setAttribute('aria-disabled', 'true');

            var main = document.createElement('button');
            main.type = 'button';
            main.className = 'text-full-editor-tb text-full-editor-blink-main';
            main.title = 'Blink. Select text first.';
            main.setAttribute('aria-label', main.title);
            main.setAttribute('aria-disabled', 'true');
            var mainIcon = document.createElement('i');
            mainIcon.className = 'ph-bold ph-pulse';
            mainIcon.style.pointerEvents = 'none';
            main.appendChild(mainIcon);
            main.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self._applyBlink(1);
            });

            var caret = document.createElement('button');
            caret.type = 'button';
            caret.className = 'text-full-editor-tb text-full-editor-blink-caret';
            caret.title = 'Blink speed. Select text first.';
            caret.setAttribute('aria-label', caret.title);
            caret.setAttribute('aria-haspopup', 'true');
            caret.setAttribute('aria-disabled', 'true');
            var caretIcon = document.createElement('i');
            caretIcon.className = 'ph-bold ph-caret-down';
            caretIcon.style.pointerEvents = 'none';
            caret.appendChild(caretIcon);
            caret.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!self._isBlinkToolbarEnabled()) return;
                self._openBlinkPicker(caret);
            });

            group.appendChild(main);
            group.appendChild(caret);
            row.appendChild(group);
            this._blinkGroup = group;
            this._blinkMainBtn = main;
            this._blinkCaretBtn = caret;
        },

        _openBlinkPicker: function (anchorBtn) {
            var self = this;
            if (!anchorBtn || !this._root) return;
            if (typeof MarkdownTextOps === 'undefined' || typeof MarkdownTextOps.wrapBlink !== 'function') return;

            var existing = this._root.querySelector('.text-full-editor-blink-picker');
            if (existing) {
                existing.parentNode.removeChild(existing);
                return;
            }

            var pop = document.createElement('div');
            pop.className = 'text-full-editor-table-picker text-full-editor-blink-picker';

            var title = document.createElement('div');
            title.className = 'text-full-editor-table-picker-title';
            title.textContent = 'Blink speed';

            var list = document.createElement('div');
            list.className = 'text-full-editor-blink-picker-list';

            var items = [
                { scale: 0.5, label: 'Fast (0.5 s)' },
                { scale: 1, label: 'Default (1 s)' },
                { scale: 1.5, label: 'Medium (1.5 s)' },
                { scale: 2, label: 'Slow (2 s)' },
                { scale: 3, label: 'Very Slow (3 s)' }
            ];
            var i = 0;
            for (i = 0; i < items.length; i++) {
                (function (item) {
                    var b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'text-full-editor-block-picker-btn';
                    b.textContent = item.label;
                    b.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self._applyBlink(item.scale);
                        if (pop.parentNode) pop.parentNode.removeChild(pop);
                        if (self._blinkPickerOutside) {
                            document.removeEventListener('mousedown', self._blinkPickerOutside, true);
                            self._blinkPickerOutside = null;
                        }
                    });
                    list.appendChild(b);
                })(items[i]);
            }

            pop.appendChild(title);
            pop.appendChild(list);
            this._root.appendChild(pop);

            var btnRect = anchorBtn.getBoundingClientRect();
            var rootRect = this._root.getBoundingClientRect();
            var left = btnRect.left - rootRect.left;
            var top = btnRect.bottom - rootRect.top + 4;
            pop.style.left = Math.max(6, left) + 'px';
            pop.style.top = top + 'px';

            var onOutside = function (ev) {
                if (!pop.contains(ev.target) && ev.target !== anchorBtn && !anchorBtn.contains(ev.target)) {
                    if (pop.parentNode) pop.parentNode.removeChild(pop);
                    document.removeEventListener('mousedown', onOutside, true);
                    self._blinkPickerOutside = null;
                }
            };
            this._blinkPickerOutside = onOutside;
            if (this._blinkPickerTimer) clearTimeout(this._blinkPickerTimer);
            this._blinkPickerTimer = setTimeout(function () {
                self._blinkPickerTimer = null;
                if (self._blinkPickerOutside) {
                    document.addEventListener('mousedown', self._blinkPickerOutside, true);
                }
            }, 0);
        },

        _addCellColorPicker: function (row) {
            var self = this;
            if (typeof EditorColorPicker === 'undefined' || typeof EditorColorPicker.attach !== 'function') {
                return;
            }
            var mount = document.createElement('div');
            mount.className = 'text-full-editor-cell-color-mount is-disabled';
            mount.setAttribute('aria-disabled', 'true');
            mount.title = 'Table cell background. Place the cursor in a table cell.';
            mount.setAttribute('aria-label', mount.title);
            row.appendChild(mount);
            this._cellColorMount = mount;

            var picker = EditorColorPicker.attach({
                mountCard: mount,
                allowThemeTokens: true,
                positionMode: 'anchor',
                zIndex: 10050,
                triggerMode: 'cell',
                triggerTitle: mount.title,
                getRaw: function () {
                    return self._getCellColorRaw();
                },
                setValue: function (val) {
                    if (!self._isCellColorToolbarEnabled()) return;
                    self._pushUndoState();
                    var t = self._textarea.value;
                    var a = self._textarea.selectionStart;
                    var b = self._textarea.selectionEnd;
                    var r = MarkdownTextOps.applyTableCellBackground(t, a, b, val);
                    self._textarea.value = r.text;
                    self._textarea.selectionStart = r.cursor;
                    self._textarea.selectionEnd = r.selEnd;
                    self._syncToWidget(true);
                    self._updateTableToolbarState();
                },
                onAfterLocalChange: function () {
                    self._updateTableToolbarState();
                },
                onClear: function () {
                    if (!self._isCellColorToolbarEnabled()) return;
                    self._pushUndoState();
                    var t = self._textarea.value;
                    var a = self._textarea.selectionStart;
                    var b = self._textarea.selectionEnd;
                    var r = MarkdownTextOps.removeTableCellBackground(t, a, b);
                    self._textarea.value = r.text;
                    self._textarea.selectionStart = r.cursor;
                    self._textarea.selectionEnd = r.selEnd;
                    self._syncToWidget(true);
                    self._updateTableToolbarState();
                }
            });

            this._cellColorPicker = picker;
            this._blockColorPickerWhenInactive(picker, function () {
                return self._isCellColorToolbarEnabled();
            });
        },

        _blockColorPickerWhenInactive: function (picker, isEnabled) {
            if (!picker || !picker.row || typeof isEnabled !== 'function') return;
            var blockOpen = function (e) {
                if (!isEnabled()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
            picker.row.addEventListener('mousedown', blockOpen, true);
            picker.row.addEventListener('click', blockOpen, true);
        },

        _updateTableToolbarState: function () {
            this._updateCellColorToolbarState();
            this._updateColumnAlignToolbarState();
        },

        _isColumnAlignToolbarEnabled: function () {
            if (!this._textarea || typeof MarkdownTextOps === 'undefined' || !MarkdownTextOps.getTableColumnAlign) {
                return false;
            }
            return !!MarkdownTextOps.getTableColumnAlign(
                this._textarea.value,
                this._textarea.selectionStart,
                this._textarea.selectionEnd
            );
        },

        _getColumnAlignCurrent: function () {
            if (!this._textarea || typeof MarkdownTextOps === 'undefined' || !MarkdownTextOps.getTableColumnAlign) {
                return '';
            }
            var info = MarkdownTextOps.getTableColumnAlign(
                this._textarea.value,
                this._textarea.selectionStart,
                this._textarea.selectionEnd
            );
            return info && info.align ? info.align : '';
        },

        _updateColumnAlignToolbarState: function () {
            if (!this._colAlignGroup || !this._colAlignBtns) return;
            var enabled = this._isColumnAlignToolbarEnabled();
            var current = enabled ? this._getColumnAlignCurrent() : '';
            if (enabled) {
                this._colAlignGroup.classList.remove('is-disabled');
                this._colAlignGroup.setAttribute('aria-disabled', 'false');
            } else {
                this._colAlignGroup.classList.add('is-disabled');
                this._colAlignGroup.setAttribute('aria-disabled', 'true');
            }
            var keys = ['default', 'left', 'center', 'right'];
            var k = 0;
            for (k = 0; k < keys.length; k++) {
                var btn = this._colAlignBtns[keys[k]];
                if (!btn) continue;
                btn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
                var baseTip = btn.getAttribute('data-tip') || '';
                var tip = enabled ? baseTip : (baseTip + '. Place the cursor in a table.');
                btn.title = tip;
                btn.setAttribute('aria-label', tip);
                var on = enabled && current === keys[k];
                if (on) {
                    btn.classList.add('is-active');
                    btn.setAttribute('aria-pressed', 'true');
                } else {
                    btn.classList.remove('is-active');
                    btn.setAttribute('aria-pressed', 'false');
                }
            }
        },

        _applyColumnAlign: function (align) {
            if (!this._isColumnAlignToolbarEnabled()) return;
            this._applyOp(function (t, a, b) {
                return MarkdownTextOps.setTableColumnAlign(t, a, b, align);
            });
        },

        _addColumnAlignGroup: function (row) {
            var self = this;
            var group = document.createElement('div');
            group.className = 'text-full-editor-col-align-group is-disabled';
            group.setAttribute('role', 'group');
            group.setAttribute('aria-label', 'Column alignment');
            group.setAttribute('aria-disabled', 'true');
            group.title = 'Column alignment (place the cursor in a table)';

            var specs = [
                { align: 'default', icon: 'ph-dots-three', label: 'Default (---)' },
                { align: 'left', icon: 'ph-text-align-left', label: 'Left aligned (:---)' },
                { align: 'center', icon: 'ph-text-align-center', label: 'Center aligned (:---:)' },
                { align: 'right', icon: 'ph-text-align-right', label: 'Right aligned (---:)' }
            ];
            var btns = {};
            var i = 0;
            for (i = 0; i < specs.length; i++) {
                (function (spec) {
                    var b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'text-full-editor-tb';
                    b.setAttribute('aria-label', spec.label);
                    b.setAttribute('aria-pressed', 'false');
                    b.setAttribute('aria-disabled', 'true');
                    b.setAttribute('data-tip', spec.label);
                    b.title = spec.label + '. Place the cursor in a table.';
                    var icon = document.createElement('i');
                    icon.className = 'ph-bold ' + spec.icon;
                    icon.style.pointerEvents = 'none';
                    b.appendChild(icon);
                    b.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!self._isColumnAlignToolbarEnabled()) return;
                        self._applyColumnAlign(spec.align);
                    });
                    group.appendChild(b);
                    btns[spec.align] = b;
                })(specs[i]);
            }
            row.appendChild(group);
            this._colAlignGroup = group;
            this._colAlignBtns = btns;
        },

        _scheduleTypingCheckpoint: function () {
            var self = this;
            if (this._typingTimer) clearTimeout(this._typingTimer);
            this._typingTimer = setTimeout(function () {
                self._typingTimer = null;
                if (!self._textarea) return;
                var v = self._textarea.value;
                if (v === self._lastSnapshot) return;
                if (self._undo.length < MAX_UNDO) {
                    self._undo.push(self._lastSnapshot);
                } else {
                    self._undo.shift();
                    self._undo.push(self._lastSnapshot);
                }
                self._lastSnapshot = v;
                self._redo = [];
            }, TYPING_CHECKPOINT_MS);
        },

        _pushUndoState: function () {
            if (!this._textarea) return;
            var v = this._textarea.value;
            if (this._undo.length < MAX_UNDO) {
                this._undo.push(v);
            } else {
                this._undo.shift();
                this._undo.push(v);
            }
            this._redo = [];
        },

        _syncToWidget: function (opt) {
            if (!this._opts) return;
            var f = (opt && opt.flush === true) || opt === true;
            this._opts.setText(this._textarea.value, { flush: f });
        },

        _applyOp: function (fn) {
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
                var end = (r.selEnd !== undefined && r.selEnd !== null) ? r.selEnd : r.cursor;
                this._textarea.selectionStart = r.cursor;
                this._textarea.selectionEnd = end;
            }
            this._syncToWidget(true);
            this._updateTableToolbarState();
            this._updateTextColorToolbarState();
            this._textarea.focus();
        },

        _applyLines: function (fn) {
            this._pushUndoState();
            var t = this._textarea.value;
            var a = this._textarea.selectionStart;
            var b = this._textarea.selectionEnd;
            var n = fn(t, a, b);
            this._textarea.value = n;
            this._syncToWidget(true);
            this._textarea.focus();
        },

        _applyHeading: function (level) {
            this._pushUndoState();
            var t = this._textarea.value;
            var a = this._textarea.selectionStart;
            var b = this._textarea.selectionEnd;
            var r = MarkdownTextOps.setHeading(t, a, b, level);
            if (r && typeof r === 'object') {
                this._textarea.value = r.text;
                if (r.cursor !== undefined) {
                    var end = (r.selEnd !== undefined && r.selEnd !== null) ? r.selEnd : r.cursor;
                    this._textarea.selectionStart = r.cursor;
                    this._textarea.selectionEnd = end;
                }
            } else {
                this._textarea.value = r;
            }
            this._syncToWidget(true);
            this._updateTableToolbarState();
            this._updateTextColorToolbarState();
            this._textarea.focus();
        },

        _hr: function () {
            this._applyOp(function (t, a, b) {
                return MarkdownTextOps.insertHorizontalRule(t, a);
            });
        },

        _openTablePicker: function (anchorBtn) {
            var self = this;
            if (!anchorBtn || !this._root) return;

            var existing = this._root.querySelector('.text-full-editor-table-picker');
            if (existing) {
                existing.parentNode.removeChild(existing);
                return;
            }

            var MAX_COLS = 10;
            var MAX_ROWS = 8;
            var selC = 0;
            var selR = 0;

            var pop = document.createElement('div');
            pop.className = 'text-full-editor-table-picker';

            var title = document.createElement('div');
            title.className = 'text-full-editor-table-picker-title';
            title.textContent = 'Insert table';

            var grid = document.createElement('div');
            grid.className = 'text-full-editor-table-picker-grid';
            grid.style.gridTemplateColumns = 'repeat(' + MAX_COLS + ', 18px)';
            grid.style.gridTemplateRows = 'repeat(' + MAX_ROWS + ', 18px)';

            var cells = [];
            for (var r = 0; r < MAX_ROWS; r++) {
                for (var c = 0; c < MAX_COLS; c++) {
                    var cell = document.createElement('div');
                    cell.className = 'text-full-editor-table-picker-cell';
                    cell.dataset.row = String(r);
                    cell.dataset.col = String(c);
                    grid.appendChild(cell);
                    cells.push(cell);
                }
            }

            var readout = document.createElement('div');
            readout.className = 'text-full-editor-table-picker-readout';
            readout.textContent = 'Hover to pick size';

            var hint = document.createElement('div');
            hint.className = 'text-full-editor-table-picker-hint';
            hint.innerHTML = '<i class="ph-bold ph-lightbulb"></i> Click to insert. Header row is auto-generated.';

            function highlight(nc, nr) {
                for (var i = 0; i < cells.length; i++) {
                    var cr = parseInt(cells[i].dataset.row, 10);
                    var cc = parseInt(cells[i].dataset.col, 10);
                    var on = cr <= nr && cc <= nc;
                    cells[i].classList.toggle('on', on);
                    cells[i].classList.toggle('header', on && cr === 0);
                }
                if (nc >= 0 && nr >= 0) {
                    readout.textContent = (nc + 1) + ' × ' + (nr + 1) + '  (cols × rows incl. header)';
                } else {
                    readout.textContent = 'Hover to pick size';
                }
            }

            grid.addEventListener('mousemove', function (e) {
                var el = e.target.closest('.text-full-editor-table-picker-cell');
                if (!el) return;
                selC = parseInt(el.dataset.col, 10);
                selR = parseInt(el.dataset.row, 10);
                highlight(selC, selR);
            });

            grid.addEventListener('mouseleave', function () {
                highlight(-1, -1);
            });

            grid.addEventListener('click', function (e) {
                var el = e.target.closest('.text-full-editor-table-picker-cell');
                if (!el) return;
                var cCount = parseInt(el.dataset.col, 10) + 1;
                var rCount = parseInt(el.dataset.row, 10) + 1;
                self._insertTable(cCount, Math.max(1, rCount - 1));
                if (pop.parentNode) pop.parentNode.removeChild(pop);
                self._tablePickerOutside = null;
            });

            pop.appendChild(title);
            pop.appendChild(grid);
            pop.appendChild(readout);
            pop.appendChild(hint);
            this._root.appendChild(pop);

            var btnRect = anchorBtn.getBoundingClientRect();
            var rootRect = this._root.getBoundingClientRect();
            var left = btnRect.left - rootRect.left;
            var top = btnRect.bottom - rootRect.top + 4;
            pop.style.left = Math.max(6, left) + 'px';
            pop.style.top = top + 'px';

            var onOutside = function (ev) {
                if (!pop.contains(ev.target) && ev.target !== anchorBtn && !anchorBtn.contains(ev.target)) {
                    if (pop.parentNode) pop.parentNode.removeChild(pop);
                    document.removeEventListener('mousedown', onOutside, true);
                    self._tablePickerOutside = null;
                }
            };
            this._tablePickerOutside = onOutside;
            if (this._tablePickerTimer) clearTimeout(this._tablePickerTimer);
            this._tablePickerTimer = setTimeout(function () {
                self._tablePickerTimer = null;
                if (self._tablePickerOutside) {
                    document.addEventListener('mousedown', self._tablePickerOutside, true);
                }
            }, 0);
        },

        _openBlockPicker: function (anchorBtn) {
            var self = this;
            if (!anchorBtn || !this._root) return;
            if (typeof MarkdownTextOps === 'undefined' || typeof MarkdownTextOps.wrapBlockCallout !== 'function') return;

            var existing = this._root.querySelector('.text-full-editor-block-picker');
            if (existing) {
                existing.parentNode.removeChild(existing);
                return;
            }

            var pop = document.createElement('div');
            pop.className = 'text-full-editor-table-picker text-full-editor-block-picker';

            var title = document.createElement('div');
            title.className = 'text-full-editor-table-picker-title';
            title.textContent = 'Block callout';

            var row = document.createElement('div');
            row.className = 'text-full-editor-block-picker-row';

            function makeBtn(n) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'text-full-editor-block-picker-btn';
                b.setAttribute('aria-label', 'Block ' + n);
                b.title = 'Wrap as [block' + n + ':…]';
                b.innerHTML = '<span class="text-full-editor-block-picker-num">' + n + '</span><span class="text-full-editor-block-picker-label">Block ' + n + '</span>';
                b.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    self._applyOp(function (t, a, bSel) { return MarkdownTextOps.wrapBlockCallout(t, a, bSel, n); });
                    if (pop.parentNode) pop.parentNode.removeChild(pop);
                    if (self._blockPickerOutside) {
                        document.removeEventListener('mousedown', self._blockPickerOutside, true);
                        self._blockPickerOutside = null;
                    }
                });
                return b;
            }

            row.appendChild(makeBtn(1));
            row.appendChild(makeBtn(2));
            row.appendChild(makeBtn(3));
            row.appendChild(makeBtn(4));

            var hint = document.createElement('div');
            hint.className = 'text-full-editor-table-picker-hint';
            hint.innerHTML = '<i class="ph-bold ph-lightbulb"></i> Wraps the selected text in <code>[blockN:…]</code>.';

            pop.appendChild(title);
            pop.appendChild(row);
            pop.appendChild(hint);
            this._root.appendChild(pop);

            var btnRect = anchorBtn.getBoundingClientRect();
            var rootRect = this._root.getBoundingClientRect();
            var left = btnRect.left - rootRect.left;
            var top = btnRect.bottom - rootRect.top + 4;
            pop.style.left = Math.max(6, left) + 'px';
            pop.style.top = top + 'px';

            var onOutside = function (ev) {
                if (!pop.contains(ev.target) && ev.target !== anchorBtn && !anchorBtn.contains(ev.target)) {
                    if (pop.parentNode) pop.parentNode.removeChild(pop);
                    document.removeEventListener('mousedown', onOutside, true);
                    self._blockPickerOutside = null;
                }
            };
            this._blockPickerOutside = onOutside;
            if (this._blockPickerTimer) clearTimeout(this._blockPickerTimer);
            this._blockPickerTimer = setTimeout(function () {
                self._blockPickerTimer = null;
                if (self._blockPickerOutside) {
                    document.addEventListener('mousedown', self._blockPickerOutside, true);
                }
            }, 0);
        },

        _insertTable: function (cols, dataRows) {
            if (!this._textarea) return;
            this._pushUndoState();
            var md = MarkdownTextOps.buildTable(cols, dataRows);
            var t = this._textarea.value;
            var p = this._textarea.selectionStart;
            var prefix = (p > 0 && t.charAt(p - 1) !== '\n') ? '\n' : '';
            var ins = prefix + md;
            var r = MarkdownTextOps.insertText(t, p, p, ins);
            this._textarea.value = r.text;
            this._textarea.selectionStart = r.cursor;
            this._textarea.selectionEnd = r.selEnd;
            this._syncToWidget({ flush: true });
            this._textarea.focus();
        },

        _insertLink: function () {
            var self = this;
            if (typeof CustomDialog === 'undefined' || typeof CustomDialog.prompt !== 'function') return;
            void CustomDialog.prompt('Link URL (https://...)', 'https://', 'Insert link', { markdownLinkTargetRadios: true }).then(function (result) {
                if (!self._textarea) return;
                if (result === false || result === null || result === undefined) return;
                var urlTrim = '';
                var newTab = false;
                if (typeof result === 'object' && result.url !== undefined && result.url !== null) {
                    urlTrim = String(result.url).trim();
                    newTab = result.newTab === true;
                } else if (typeof result === 'string') {
                    urlTrim = result.trim();
                }
                if (!urlTrim) return;
                self._pushUndoState();
                var t = self._textarea.value;
                var a = self._textarea.selectionStart;
                var b = self._textarea.selectionEnd;
                var r = MarkdownTextOps.insertLink(t, a, b, urlTrim, newTab);
                self._textarea.value = r.text;
                self._textarea.selectionStart = r.start;
                self._textarea.selectionEnd = r.end;
                self._syncToWidget(true);
                self._textarea.focus();
            });
        },

        _insertImageUrl: function () {
            var self = this;
            if (typeof CustomDialog === 'undefined' || typeof CustomDialog.prompt !== 'function') return;
            void CustomDialog.prompt('Image URL', '', 'Insert image', { markdownImageFields: true }).then(function (result) {
                if (!self._textarea) return;
                if (!result || typeof result !== 'object') return;
                var url = result.url != null ? String(result.url).trim() : '';
                if (!url.length) return;
                var alt = self._composeImageAltLabel('Image', result);
                self._insertImageWithAlt(url, alt);
            });
        },

        _composeImageAltLabel: function (baseLabel, fields) {
            var label = baseLabel || 'Image';
            var tokens = [];
            var w = fields && fields.width != null && !isNaN(fields.width) && fields.width > 0 ? fields.width : null;
            var h = fields && fields.height != null && !isNaN(fields.height) && fields.height > 0 ? fields.height : null;
            if (w != null && h != null) tokens.push(String(w) + 'x' + String(h));
            else if (w != null) tokens.push(String(w));
            else if (h != null) tokens.push('x' + String(h));
            var tint = fields && fields.tint != null ? String(fields.tint).trim() : '';
            if (tint.length) {
                var validated = tint;
                if (typeof MarkdownColorSpec !== 'undefined' && MarkdownColorSpec.validateColorSpec) {
                    validated = MarkdownColorSpec.validateColorSpec(tint);
                } else if (typeof MarkdownImageTint !== 'undefined' && MarkdownImageTint.validateColorSpec) {
                    validated = MarkdownImageTint.validateColorSpec(tint);
                }
                if (validated) tokens.push(validated);
            }
            if (!tokens.length) return label;
            return label + '|' + tokens.join('|');
        },

        _insertImageWithAlt: function (url, alt) {
            this._pushUndoState();
            var t = this._textarea.value;
            var a = this._textarea.selectionStart;
            var b = this._textarea.selectionEnd;
            var al = alt || 'Image';
            var r = MarkdownTextOps.insertImage(t, a, b, url, al);
            this._textarea.value = r.text;
            this._textarea.selectionStart = r.start;
            this._textarea.selectionEnd = r.selEnd;
            this._syncToWidget(true);
            this._textarea.focus();
        },

        _openGallery: function () {
            var self = this;
            if (typeof ImageGallery === 'undefined' || typeof ImageGallery.open !== 'function') {
                console.warn('[TextFullEditor] ImageGallery unavailable');
                return;
            }
            ImageGallery.open({
                pickMode: true,
                pickFormat: 'markdown',
                onPick: function (markdownLine) {
                    if (!self._textarea) return;
                    self._pushUndoState();
                    var t = self._textarea.value;
                    var p = self._textarea.selectionStart;
                    var ins = markdownLine || '';
                    if (p > 0 && t.charAt(p - 1) !== '\n') {
                        ins = '\n' + ins;
                    }
                    if (ins.length > 0 && ins.charAt(ins.length - 1) !== '\n') {
                        ins = ins + '\n';
                    }
                    var r = MarkdownTextOps.insertText(t, p, p, ins);
                    self._textarea.value = r.text;
                    self._textarea.selectionStart = r.cursor;
                    self._textarea.selectionEnd = r.selEnd;
                    self._syncToWidget(true);
                    self._textarea.focus();
                }
            });
        },

        _openIcon: function () {
            var self = this;
            if (typeof Dashboard === 'undefined' || typeof Dashboard.openIconBrowser !== 'function') {
                console.warn('[TextFullEditor] Dashboard.openIconBrowser unavailable');
                return;
            }
            var done = function (iconName) {
                if (!self._textarea || !iconName) {
                    if (self._textarea) {
                        requestAnimationFrame(function () { self._textarea.focus(); });
                    }
                    return;
                }
                self._pushUndoState();
                var token = ':' + iconName + ':';
                var t = self._textarea.value;
                var p = self._textarea.selectionStart;
                var r = MarkdownTextOps.insertText(t, p, p, token);
                self._textarea.value = r.text;
                self._textarea.selectionStart = r.cursor;
                self._textarea.selectionEnd = r.selEnd;
                self._syncToWidget({ flush: true });
                requestAnimationFrame(function () {
                    if (self._textarea) {
                        self._textarea.focus();
                    }
                });
            };
            try {
                var ret = Dashboard.openIconBrowser('ph-star', done);
                if (ret && typeof ret.then === 'function') {
                    ret.catch(function (err) {
                        console.error('[TextFullEditor] openIconBrowser failed:', err);
                    });
                }
            } catch (err) {
                console.error('[TextFullEditor] openIconBrowser threw:', err);
            }
        },

        _openTopicInserter: function () {
            var self = this;
            if (typeof Editor === 'undefined' || typeof Editor.createTopicDropdown !== 'function') {
                console.warn('[TextFullEditor] Editor.createTopicDropdown unavailable');
                return;
            }
            var existing = this._root.querySelector('.text-full-editor-topic-wrap');
            if (existing) {
                var inpEx = existing.querySelector('input');
                if (inpEx) setTimeout(function () { inpEx.focus(); }, 0);
                return;
            }

            var host = document.createElement('div');
            host.className = 'text-full-editor-topic-wrap';
            var lbl = document.createElement('div');
            lbl.className = 'text-full-editor-topic-label';
            lbl.innerHTML = '<i class="ph-bold ph-tree-structure"></i> Pick a topic to insert as <code>{{topic}}</code>';
            var row = document.createElement('div');
            row.className = 'text-full-editor-topic-row';
            var dd = Editor.createTopicDropdown('', 'Search topics…', function (val) {
                if (!val || !self._textarea) return;
                self._pushUndoState();
                var ins = '{{' + val + '}}';
                var t = self._textarea.value;
                var p = self._textarea.selectionStart;
                var r = MarkdownTextOps.insertText(t, p, p, ins);
                self._textarea.value = r.text;
                self._textarea.selectionStart = r.cursor;
                self._textarea.selectionEnd = r.selEnd;
                self._syncToWidget({ flush: true });
                if (host.parentNode) {
                    host.parentNode.removeChild(host);
                }
                self._textarea.focus();
            }, '', true, true);
            row.appendChild(dd);
            var applyClose = document.createElement('button');
            applyClose.type = 'button';
            applyClose.className = 'ds-dialog-close';
            applyClose.innerHTML = '<i class="ph-bold ph-x"></i>';
            applyClose.title = 'Cancel';
            applyClose.addEventListener('click', function (e) {
                e.preventDefault();
                if (host.parentNode) host.parentNode.removeChild(host);
            });
            row.appendChild(applyClose);
            host.appendChild(lbl);
            host.appendChild(row);
            var anchor = this._taWrap || this._textarea;
            if (anchor && anchor.parentNode) {
                anchor.parentNode.insertBefore(host, anchor);
            } else {
                this._root.appendChild(host);
            }
            var inp = dd.querySelector('input');
            if (inp) {
                setTimeout(function () { inp.focus(); }, 0);
            }
        },

        _buildFindBar: function (wrap) {
            var self = this;
            wrap.style.display = 'none';
            var f1 = document.createElement('input');
            f1.type = 'text';
            f1.className = 'text-full-editor-find-input';
            f1.placeholder = 'Find';
            var f2 = document.createElement('input');
            f2.type = 'text';
            f2.className = 'text-full-editor-find-input';
            f2.placeholder = 'Replace with';
            var caseCb = document.createElement('input');
            caseCb.type = 'checkbox';
            caseCb.id = 'text-full-editor-case-cb';
            var caseLb = document.createElement('label');
            caseLb.className = 'text-full-editor-find-case';
            caseLb.setAttribute('for', 'text-full-editor-case-cb');
            caseLb.appendChild(caseCb);
            caseLb.appendChild(document.createTextNode(' Aa'));

            var btnF = document.createElement('button');
            btnF.type = 'button';
            btnF.className = 'text-full-editor-find-btn';
            btnF.innerHTML = '<i class="ph-bold ph-caret-down"></i> Next';
            var btnR1 = document.createElement('button');
            btnR1.type = 'button';
            btnR1.className = 'text-full-editor-find-btn';
            btnR1.textContent = 'Replace';
            var btnRAll = document.createElement('button');
            btnRAll.type = 'button';
            btnRAll.className = 'text-full-editor-find-btn primary';
            btnRAll.textContent = 'Replace all';

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
            w.style.display = w.style.display === 'none' ? 'flex' : 'none';
        },

        _findNext: function () {
            if (!this._findBar || !this._findBar.findInp) return;
            var find = this._findBar.findInp.value || '';
            if (!find) return;
            var t = this._textarea.value;
            var from = this._textarea.selectionEnd;
            var c = this._findBar.caseEl && this._findBar.caseEl.checked;
            var idx;
            if (c) {
                idx = t.indexOf(find, from);
                if (idx < 0) {
                    idx = t.indexOf(find, 0);
                }
            } else {
                var lowT = t.toLowerCase();
                var lowF = find.toLowerCase();
                idx = lowT.indexOf(lowF, from);
                if (idx < 0) {
                    idx = lowT.indexOf(lowF, 0);
                }
            }
            if (idx < 0) {
                this._textarea.focus();
                return;
            }
            this._textarea.selectionStart = idx;
            this._textarea.selectionEnd = idx + find.length;
            this._textarea.focus();
        },

        _replaceOne: function () {
            var find = this._findBar.findInp.value || '';
            if (!find) return;
            var rep = this._findBar.repInp.value || '';
            var t = this._textarea.value;
            var a = this._textarea.selectionStart;
            var b = this._textarea.selectionEnd;
            var sel = t.slice(a, b);
            var c = this._findBar.caseEl.checked;
            var match = false;
            if (c) {
                match = (sel === find);
            } else {
                match = (sel.toLowerCase() === find.toLowerCase());
            }
            if (!match) {
                this._findNext();
                return;
            }
            this._pushUndoState();
            var n = t.slice(0, a) + rep + t.slice(b);
            this._textarea.value = n;
            this._textarea.selectionStart = a + rep.length;
            this._textarea.selectionEnd = a + rep.length;
            this._syncToWidget(true);
            this._textarea.focus();
        },

        _replaceAll: function () {
            if (!this._findBar || !this._findBar.findInp) return;
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
                var re = new RegExp(esc, 'gi');
                n = t.replace(re, function () { return rep; });
            }
            this._textarea.value = n;
            this._syncToWidget(true);
            this._textarea.focus();
        },

        _bindKeyboard: function () {
            var self = this;
            this._textarea.addEventListener('keydown', function (e) {
                var isMac = navigator.platform && navigator.platform.indexOf('Mac') >= 0;
                var mod = isMac ? e.metaKey : e.ctrlKey;
                if (mod && e.key === 'b') {
                    e.preventDefault();
                    self._applyOp(function (t, a, b) { return MarkdownTextOps.wrapBold(t, a, b); });
                } else if (mod && e.key === 'i') {
                    e.preventDefault();
                    self._applyOp(function (t, a, b) { return MarkdownTextOps.wrapItalic(t, a, b); });
                } else if (mod && e.key === 'k') {
                    e.preventDefault();
                    self._insertLink();
                } else if (mod && e.key === 'z' && !e.shiftKey) {
                    if (self._undo.length) {
                        e.preventDefault();
                        self._doUndo();
                    }
                } else if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                    e.preventDefault();
                    self._doRedo();
                } else if (e.key === 'Escape') {
                    if (self._findBar && self._findBar.wrap && self._findBar.wrap.style.display !== 'none') {
                        self._findBar.wrap.style.display = 'none';
                    } else {
                        self.close();
                    }
                }
            });
        },

        _doUndo: function () {
            if (!this._undo.length) return;
            var prev = this._undo.pop();
            this._redo.push(this._textarea.value);
            this._textarea.value = prev;
            this._lastSnapshot = prev;
            this._syncToWidget({ flush: true });
        },

        _doRedo: function () {
            if (!this._redo.length) return;
            var n = this._redo.pop();
            this._undo.push(this._textarea.value);
            this._textarea.value = n;
            this._lastSnapshot = n;
            this._syncToWidget({ flush: true });
        }
    };

    global.TextFullEditor = TextFullEditor;
})(typeof window !== 'undefined' ? window : this);
