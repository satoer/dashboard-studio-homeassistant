/**
 * Image Gallery (Homey): upload, list metadata, multi-select, preview, rename.
 * Depends: DataDriverRegistry, CustomDialog, Editor, DOM ids in editor.html
 */
(function () {
    const LS_VIEW = 'dashboardstudio-gallery-view';
    const LS_THUMB_GRID = 'dashboardstudio-gallery-thumb-grid';
    const LS_THUMB_LIST = 'dashboardstudio-gallery-thumb-list';
    const LS_THUMB_LEGACY = 'dashboardstudio-gallery-thumb';

    const BUILT_IN_TAG = 'Built-in';

    function normalizeEntry(f) {
        if (typeof f === 'string') return { name: f, size: 0, mtime: 0, source: 'user' };
        return {
            name: String(f.name || ''),
            size: Number(f.size) || 0,
            mtime: Number(f.mtime) || 0,
            source: f.source === 'factory' ? 'factory' : 'user'
        };
    }

    function isBuiltIn(entry) {
        return !!(entry && entry.source === 'factory');
    }

    function formatBytes(n) {
        const b = Number(n) || 0;
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(2) + ' MB';
    }

    function formatDate(ms) {
        if (!ms) return '—';
        try {
            return new Date(ms).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
            return '—';
        }
    }

    function imageUrl(name) {
        return 'images/' + encodeURIComponent(name);
    }

    function baseNameForAlt(name) {
        if (!name || typeof name !== 'string') return 'Image';
        const dot = name.lastIndexOf('.');
        if (dot <= 0) return name;
        return name.slice(0, dot);
    }

    function uniqueCopyName(originalName, existingNames) {
        const dot = originalName.lastIndexOf('.');
        const base = dot > 0 ? originalName.slice(0, dot) : originalName;
        const ext = dot > 0 ? originalName.slice(dot) : '';
        const set = new Set(existingNames);
        let n = 2;
        let candidate = base + ' (' + n + ')' + ext;
        while (set.has(candidate)) {
            n++;
            candidate = base + ' (' + n + ')' + ext;
        }
        return candidate;
    }

    const ImageGallery = {
        files: [],
        viewMode: 'thumbnails',
        selected: new Set(),
        lastAnchorIndex: -1,
        filterText: '',
        sortValue: 'name-asc',
        previewName: null,
        _thumbSizeRaf: null,
        _onKeyDown: null,
        pickMode: false,
        onPick: null,
        // 'markdown' (default, Text widget editor) or 'url' (URL editboxes).
        pickFormat: 'markdown',

        init: function () {
            const dropArea = document.getElementById('gallery-upload');
            const input = document.getElementById('gallery-input');
            if (!dropArea || !input) return;

            const savedView = localStorage.getItem(LS_VIEW);
            if (savedView === 'list' || savedView === 'thumbnails') this.viewMode = savedView;

            dropArea.addEventListener('click', () => input.click());
            input.addEventListener('change', (e) => {
                this.handleFiles(e.target.files);
                input.value = '';
            });

            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
                dropArea.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            });
            ['dragenter', 'dragover'].forEach((eventName) => {
                dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
            });
            ['dragleave', 'drop'].forEach((eventName) => {
                dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
            });
            dropArea.addEventListener('drop', (e) => this.handleFiles(e.dataTransfer.files), false);

            const viewThumbs = document.getElementById('gallery-view-thumbs');
            const viewList = document.getElementById('gallery-view-list');
            if (viewThumbs) viewThumbs.addEventListener('click', () => this.setViewMode('thumbnails'));
            if (viewList) viewList.addEventListener('click', () => this.setViewMode('list'));

            const search = document.getElementById('gallery-search');
            if (search) search.addEventListener('input', () => {
                this.filterText = search.value.trim().toLowerCase();
                this.render();
            });

            const sortContainer = document.getElementById('gallery-sort-container');
            if (sortContainer && typeof Editor !== 'undefined' && Editor.createCustomSelect) {
                const sortOpts = [
                    {value: 'name-asc', text: 'Name A-Z'},
                    {value: 'name-desc', text: 'Name Z-A'},
                    {value: 'size-desc', text: 'Size largest'},
                    {value: 'size-asc', text: 'Size smallest'},
                    {value: 'mtime-desc', text: 'Newest'},
                    {value: 'mtime-asc', text: 'Oldest'}
                ];
                const sortEl = Editor.createCustomSelect(sortOpts, this.sortValue || 'name-asc');
                sortEl.id = 'gallery-sort';
                sortEl.title = "Sort by name, file size, or modified time";
                
                sortEl.onchange = () => {
                    this.sortValue = sortEl.value;
                    this.render();
                };
                
                sortContainer.innerHTML = '';
                sortContainer.appendChild(sortEl);
                this._sortEl = sortEl;
            }

            const thumbRange = document.getElementById('gallery-thumb-size');
            if (thumbRange) {
                this.migrateLegacyThumbStorage();
                this.syncSliderUi();
                thumbRange.addEventListener('input', () => {
                    const v = parseInt(thumbRange.value, 10);
                    if (this._thumbSizeRaf) cancelAnimationFrame(this._thumbSizeRaf);
                    this._thumbSizeRaf = requestAnimationFrame(() => {
                        this._thumbSizeRaf = null;
                        this.applySizesForCurrentView(v);
                    });
                });
                thumbRange.addEventListener('change', () => {
                    this.persistCurrentThumbSize();
                });
            }

            document.getElementById('gallery-select-all')?.addEventListener('click', () => this.selectAllVisible());
            document.getElementById('gallery-clear-selection')?.addEventListener('click', () => this.clearSelection());
            document.getElementById('gallery-delete-selected')?.addEventListener('click', () => this.deleteSelected());

            document.getElementById('gallery-preview-close')?.addEventListener('click', () => this.closePreview());
            document.getElementById('gallery-preview-backdrop')?.addEventListener('click', () => this.closePreview());
            document.getElementById('gallery-preview-copy')?.addEventListener('click', () => {
                if (this.previewName) this.copyPathForName(this.previewName);
            });
            document.getElementById('gallery-preview-insert')?.addEventListener('click', () => {
                if (this.previewName) this.runPickForName(this.previewName);
            });
            document.getElementById('gallery-preview-download')?.addEventListener('click', () => {
                if (this.previewName) this.downloadOne(this.previewName);
            });
            document.getElementById('gallery-preview-rename')?.addEventListener('click', () => {
                if (this.previewName) this.renameFromPreview();
            });

            this._onKeyDown = (e) => {
                const modal = document.getElementById('gallery-modal');
                if (!modal || !modal.classList.contains('show')) return;
                if (e.key === 'Escape') {
                    if (!document.getElementById('gallery-preview')?.classList.contains('is-hidden')) {
                        this.closePreview();
                        e.preventDefault();
                    }
                }
            };
            document.addEventListener('keydown', this._onKeyDown);

            this.syncViewToggleUi();
        },

        migrateLegacyThumbStorage: function () {
            if (localStorage.getItem(LS_THUMB_GRID)) return;
            const leg = localStorage.getItem(LS_THUMB_LEGACY);
            if (leg) {
                localStorage.setItem(LS_THUMB_GRID, leg);
            }
        },

        persistCurrentThumbSize: function () {
            const range = document.getElementById('gallery-thumb-size');
            if (!range) return;
            const key = this.viewMode === 'list' ? LS_THUMB_LIST : LS_THUMB_GRID;
            localStorage.setItem(key, range.value);
        },

        syncSliderUi: function () {
            const range = document.getElementById('gallery-thumb-size');
            const label = document.getElementById('gallery-thumb-label-text');
            if (!range) return;
            const key = this.viewMode === 'list' ? LS_THUMB_LIST : LS_THUMB_GRID;
            let v = parseInt(localStorage.getItem(key), 10);
            if (isNaN(v) || v < 72 || v > 200) {
                v = 100;
            }
            range.value = String(v);
            if (label) {
                label.textContent = this.viewMode === 'list' ? 'List preview' : 'Thumb size';
            }
            this.applySizesForCurrentView(v);
        },

        applySizesForCurrentView: function (px) {
            const content = document.querySelector('.gallery-modal-content');
            if (!content || isNaN(px)) return;
            if (this.viewMode === 'list') {
                content.style.setProperty('--gallery-list-thumb', px + 'px');
            } else {
                content.style.setProperty('--gallery-thumb-min', px + 'px');
            }
        },

        getProvider: function () {
            const driver = DataDriverRegistry.get();
            if (!driver || typeof driver.getStorageProvider !== 'function') return null;
            return driver.getStorageProvider();
        },

        _markdownImageLineForName: function (name) {
            if (!name) return '';
            const path = '/' + imageUrl(name);
            const alt = baseNameForAlt(name).replace(/[[\]]/g, '');
            return '![' + alt + '](' + path + ')';
        },

        _urlForName: function (name) {
            if (!name) return '';
            return '/' + imageUrl(name);
        },

        // Mirrors the Homey backend saveImage sanitization (app.js): unsafe
        // characters are replaced with '_' so the URL we insert matches the
        // actual stored filename the server writes.
        _sanitizeImageName: function (name) {
            if (!name || typeof name !== 'string') return '';
            return name.replace(/[#?&"'\s]/g, '_');
        },

        _pickPayloadForName: function (name) {
            return this.pickFormat === 'url'
                ? this._urlForName(name)
                : this._markdownImageLineForName(name);
        },

        _insertButtonTitle: function () {
            return this.pickFormat === 'url'
                ? 'Insert image path into the field'
                : 'Insert Markdown image into the text editor';
        },

        _syncPickModeUi: function () {
            const ins = document.getElementById('gallery-preview-insert');
            if (ins) {
                const show = this.pickMode === true;
                if (show) {
                    ins.classList.remove('is-hidden');
                    ins.title = this._insertButtonTitle();
                } else {
                    ins.classList.add('is-hidden');
                }
            }
        },

        open: async function (options) {
            this.pickMode = false;
            this.onPick = null;
            this.pickFormat = 'markdown';
            if (options && typeof options === 'object' && options.pickMode === true) {
                this.pickMode = true;
                if (typeof options.onPick === 'function') {
                    this.onPick = options.onPick;
                }
                if (options.pickFormat === 'url') {
                    this.pickFormat = 'url';
                }
            }
            const driver = DataDriverRegistry.get();
            if (!driver || (DataDriverRegistry.getType() !== 'homey' && DataDriverRegistry.getType() !== 'homeassistant')) {
                if (this.pickMode) {
                    this.pickMode = false;
                    this.onPick = null;
                    this.pickFormat = 'markdown';
                }
                await CustomDialog.alert('Gallery is only available in Homey mode.');
                return;
            }
            document.getElementById('gallery-modal')?.classList.add('show');
            this._syncPickModeUi();
            const search = document.getElementById('gallery-search');
            if (search) {
                search.value = '';
                this.filterText = '';
            }
            if (this._sortEl) {
                this.sortValue = this._sortEl.value;
            }
            this.syncSliderUi();
            await this.loadImages();
        },

        close: function () {
            this.persistCurrentThumbSize();
            this.closePreview();
            document.getElementById('gallery-modal')?.classList.remove('show');
            this.clearSelection();
            this.pickMode = false;
            this.onPick = null;
            this.pickFormat = 'markdown';
            this._syncPickModeUi();
        },

        runPickForName: function (name) {
            if (!name || this.pickMode !== true || typeof this.onPick !== 'function') return;
            const payload = this._pickPayloadForName(name);
            this.onPick(payload);
            this.close();
        },

        closePreview: function () {
            this.previewName = null;
            const prev = document.getElementById('gallery-preview');
            const img = document.getElementById('gallery-preview-image');
            if (prev) {
                prev.classList.add('is-hidden');
                prev.setAttribute('aria-hidden', 'true');
            }
            if (img) img.removeAttribute('src');
        },

        openPreview: function (name) {
            if (!name) return;
            this.previewName = name;
            const prev = document.getElementById('gallery-preview');
            const img = document.getElementById('gallery-preview-image');
            const fn = document.getElementById('gallery-preview-filename');
            const renBtn = document.getElementById('gallery-preview-rename');
            if (img) img.src = imageUrl(name);
            if (fn) fn.textContent = name;
            if (renBtn) {
                renBtn.style.display = this._isBuiltInName(name) ? 'none' : '';
            }
            if (prev) {
                prev.classList.remove('is-hidden');
                prev.setAttribute('aria-hidden', 'false');
            }
        },

        setViewMode: function (mode) {
            this.persistCurrentThumbSize();
            this.viewMode = mode === 'list' ? 'list' : 'thumbnails';
            localStorage.setItem(LS_VIEW, this.viewMode);
            this.syncSliderUi();
            this.syncViewToggleUi();
            this.render();
        },

        syncViewToggleUi: function () {
            const thumbs = document.getElementById('gallery-view-thumbs');
            const list = document.getElementById('gallery-view-list');
            const isThumbs = this.viewMode === 'thumbnails';
            if (thumbs) {
                thumbs.classList.toggle('is-active', isThumbs);
                thumbs.setAttribute('aria-pressed', isThumbs ? 'true' : 'false');
            }
            if (list) {
                list.classList.toggle('is-active', !isThumbs);
                list.setAttribute('aria-pressed', !isThumbs ? 'true' : 'false');
            }
        },

        loadImages: async function () {
            const root = document.getElementById('gallery-items');
            if (!root) return;
            root.innerHTML = '<div class="gallery-loading">Loading…</div>';

            const provider = this.getProvider();
            if (!provider) {
                root.innerHTML = '<div class="gallery-error">Not connected.</div>';
                return;
            }
            try {
                const raw = await provider.listImages();
                this.files = Array.isArray(raw) ? raw.map(normalizeEntry).filter((x) => x.name) : [];
                this.pruneSelection();
                this.updateTotalSize();
                this.render();
            } catch (e) {
                root.innerHTML = '<div class="gallery-error">Error: ' + String(e.message || e) + '</div>';
            }
        },

        updateTotalSize: function () {
            const el = document.getElementById('gallery-total-size');
            if (!el) return;
            const sum = this.files.reduce((a, f) => a + (f.size || 0), 0);
            el.textContent = this.files.length ? formatBytes(sum) + ' · ' + this.files.length + ' file' + (this.files.length === 1 ? '' : 's') : '—';
        },

        getVisibleFiles: function () {
            let list = this.files.slice();
            const q = this.filterText;
            if (q) list = list.filter((f) => f.name.toLowerCase().includes(q));

            const [key, dir] = this.sortValue.split('-');
            const asc = dir === 'asc';
            list.sort((a, b) => {
                let cmp = 0;
                if (key === 'name') cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
                else if (key === 'size') cmp = (a.size || 0) - (b.size || 0);
                else if (key === 'mtime') cmp = (a.mtime || 0) - (b.mtime || 0);
                return asc ? cmp : -cmp;
            });
            return list;
        },

        pruneSelection: function () {
            const names = new Set(this.files.map((f) => f.name));
            for (const n of this.selected) {
                if (!names.has(n)) this.selected.delete(n);
            }
            this.updateActionButtons();
        },

        render: function () {
            const root = document.getElementById('gallery-items');
            if (!root) return;

            const prevScrollTop = root.scrollTop;

            root.classList.remove('gallery-items--thumbnails', 'gallery-items--list');
            root.classList.add(this.viewMode === 'list' ? 'gallery-items--list' : 'gallery-items--thumbnails');

            const visible = this.getVisibleFiles();
            root.innerHTML = '';

            if (visible.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'gallery-empty';
                empty.textContent = this.files.length === 0 ? 'No images yet. Upload above.' : 'No images match your search.';
                root.appendChild(empty);
                this.updateActionButtons();
                return;
            }

            visible.forEach((entry, index) => {
                const item = this.viewMode === 'list'
                    ? this.buildListItem(entry, index)
                    : this.buildThumbItem(entry, index);
                root.appendChild(item);
            });

            root.scrollTop = prevScrollTop;
            this.updateActionButtons();
        },

        syncSelectionUi: function () {
            const root = document.getElementById('gallery-items');
            if (!root) return;
            const items = root.querySelectorAll('.gallery-item');
            items.forEach((item) => {
                const name = item.dataset.name;
                item.classList.toggle('is-selected', !!(name && this.selected.has(name)));
            });
        },

        buildHoverActions: function (name) {
            const bar = document.createElement('div');
            bar.className = 'gallery-item-hover-actions';
            const self = this;

            if (this.pickMode) {
                const insBtn = document.createElement('button');
                insBtn.type = 'button';
                insBtn.className = 'gallery-hover-btn primary';
                insBtn.title = this._insertButtonTitle();
                insBtn.innerHTML = '<i class="ph-bold ph-plus"></i>';
                insBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    self.runPickForName(name);
                });
                bar.appendChild(insBtn);
            }

            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'gallery-hover-btn';
            copyBtn.title = 'Copy path for widgets (/images/…)';
            copyBtn.innerHTML = '<i class="ph-bold ph-copy"></i>';
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.copyPathForName(name);
            });

            const prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'gallery-hover-btn';
            prevBtn.title = 'Preview image';
            prevBtn.innerHTML = '<i class="ph-bold ph-eye"></i>';
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.openPreview(name);
            });

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'gallery-hover-btn danger';
            delBtn.title = 'Delete this image from Homey';
            delBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.deleteOneFile(name);
            });

            bar.appendChild(copyBtn);
            bar.appendChild(prevBtn);
            if (!this._isBuiltInName(name)) {
                bar.appendChild(delBtn);
            }
            return bar;
        },

        buildThumbItem: function (entry, index) {
            const isBuilt = isBuiltIn(entry);
            const item = document.createElement('div');
            item.className = 'gallery-item'
                + (this.selected.has(entry.name) ? ' is-selected' : '')
                + (isBuilt ? ' is-builtin' : '');
            item.tabIndex = 0;
            item.dataset.name = entry.name;

            const wrap = document.createElement('div');
            wrap.className = 'gallery-item-thumb-wrap';
            const img = document.createElement('img');
            img.className = 'gallery-thumb';
            img.loading = 'lazy';
            img.alt = '';
            img.src = imageUrl(entry.name);
            wrap.appendChild(img);
            wrap.appendChild(this.buildHoverActions(entry.name));

            const cap = document.createElement('div');
            cap.className = 'gallery-item-name';
            cap.textContent = entry.name;
            cap.title = entry.name;
            if (isBuilt) {
                const badge = document.createElement('span');
                badge.className = 'factory-badge';
                badge.textContent = BUILT_IN_TAG;
                cap.appendChild(badge);
            }

            item.appendChild(wrap);
            item.appendChild(cap);

            this.bindItemEvents(item, entry.name, index);
            return item;
        },

        buildListItem: function (entry, index) {
            const isBuilt = isBuiltIn(entry);
            const item = document.createElement('div');
            item.className = 'gallery-item'
                + (this.selected.has(entry.name) ? ' is-selected' : '')
                + (isBuilt ? ' is-builtin' : '');
            item.tabIndex = 0;
            item.dataset.name = entry.name;

            const wrap = document.createElement('div');
            wrap.className = 'gallery-item-thumb-wrap';
            const img = document.createElement('img');
            img.className = 'gallery-thumb';
            img.loading = 'lazy';
            img.alt = '';
            img.src = imageUrl(entry.name);
            wrap.appendChild(img);
            wrap.appendChild(this.buildHoverActions(entry.name));

            const meta = document.createElement('div');
            meta.className = 'gallery-item-meta';
            const nameEl = document.createElement('div');
            nameEl.className = 'gallery-item-name';
            nameEl.textContent = entry.name;
            nameEl.title = entry.name;
            if (isBuilt) {
                const badge = document.createElement('span');
                badge.className = 'factory-badge';
                badge.textContent = BUILT_IN_TAG;
                nameEl.appendChild(badge);
            }
            const sizeEl = document.createElement('div');
            sizeEl.className = 'gallery-item-size';
            sizeEl.textContent = formatBytes(entry.size) + ' · ' + formatDate(entry.mtime);
            meta.appendChild(nameEl);
            meta.appendChild(sizeEl);

            item.appendChild(wrap);
            item.appendChild(meta);

            this.bindItemEvents(item, entry.name, index);
            return item;
        },

        _isBuiltInName: function (name) {
            const entry = this.files.find((f) => f.name === name);
            return isBuiltIn(entry);
        },

        isSelectable: function (fileOrName) {
            if (!fileOrName) return false;
            if (typeof fileOrName === 'string') {
                return !this._isBuiltInName(fileOrName);
            }
            return !isBuiltIn(fileOrName);
        },

        bindItemEvents: function (item, name, index) {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.gallery-item-hover-actions')) return;
                GallerySelection.handleItemClick(this, e, name, index, (f) => this.isSelectable(f));
            });

            item.addEventListener('dblclick', (e) => {
                if (e.target.closest('.gallery-item-hover-actions')) return;
                this.openPreview(name);
            });
        },

        toggleOne: function (name) {
            GallerySelection.toggleOne(this, name, undefined, (f) => this.isSelectable(f));
        },

        selectRangeToIndex: function (endIndex) {
            GallerySelection.selectRange(this, endIndex, (f) => this.isSelectable(f));
        },

        selectAllVisible: function () {
            GallerySelection.selectAll(this, (f) => this.isSelectable(f));
        },

        clearSelection: function () {
            GallerySelection.clear(this);
        },

        updateActionButtons: function () {
            const n = this.selected.size;
            const selectableCount = this.getVisibleFiles().filter((f) => !isBuiltIn(f)).length;
            const sa = document.getElementById('gallery-select-all');
            const clr = document.getElementById('gallery-clear-selection');
            const del = document.getElementById('gallery-delete-selected');
            if (sa) sa.disabled = selectableCount === 0;
            if (clr) clr.disabled = n === 0;
            if (del) del.disabled = n === 0;
        },

        copyPathForName: function (name) {
            const val = '/' + imageUrl(name);
            Editor.copyToClipboard(val);
        },

        deleteOneFile: async function (name) {
            if (this._isBuiltInName(name)) {
                await CustomDialog.alert('Built-in images cannot be deleted.', 'Delete blocked');
                return;
            }
            const msg = 'Delete "' + name + '"? This cannot be undone.\n\nWidgets that use this path will show a broken image until you update them.';
            if (!await CustomDialog.confirm(msg, 'Delete image')) return;
            const provider = this.getProvider();
            if (!provider) return;
            try {
                await provider.deleteImage(name);
                if (this.previewName === name) this.closePreview();
                this.selected.delete(name);
                this.files = this.files.filter((f) => f.name !== name);
                this.pruneSelection();
                this.updateTotalSize();
                this.render();
                await this.loadImages();
            } catch (e) {
                await CustomDialog.alert('Failed to delete: ' + (e.message || e), 'Error');
            }
        },

        downloadOne: async function (name) {
            try {
                const res = await fetch(imageUrl(name));
                if (!res.ok) throw new Error('Download failed');
                const blob = await res.blob();
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = name;
                a.click();
                URL.revokeObjectURL(a.href);
            } catch (e) {
                await CustomDialog.alert(String(e.message || e), 'Download failed');
            }
        },

        deleteSelected: async function () {
            const names = Array.from(this.selected).filter((name) => !this._isBuiltInName(name));
            if (names.length === 0) return;
            const msg = 'Delete ' + names.length + ' image(s)? This cannot be undone.\n\nWidgets that use these paths will show broken images until you update them.';
            if (!await CustomDialog.confirm(msg, 'Delete images')) return;
            const provider = this.getProvider();
            if (!provider) return;

            if (provider.deleteImages && names.length > 1) {
                try {
                    await provider.deleteImages(names);
                    this.files = this.files.filter((f) => !names.includes(f.name));
                    for (const n of names) this.selected.delete(n);
                } catch (e) {
                    await CustomDialog.alert('Failed to delete: ' + (e.message || e), 'Error');
                }
            } else {
                for (const name of names) {
                    try {
                        await provider.deleteImage(name);
                        this.files = this.files.filter((f) => f.name !== name);
                        this.selected.delete(name);
                    } catch (e) {
                        await CustomDialog.alert('Failed to delete "' + name + '": ' + (e.message || e), 'Error');
                    }
                }
            }

            if (this.previewName && names.includes(this.previewName)) this.closePreview();
            this.pruneSelection();
            this.updateTotalSize();
            this.render();
            await this.loadImages();
        },

        renameFromPreview: async function () {
            const from = this.previewName;
            if (!from) return;
            if (this._isBuiltInName(from)) {
                await CustomDialog.alert('Built-in images cannot be renamed.', 'Rename blocked');
                return;
            }
            const suggested = await CustomDialog.prompt(
                'New filename (extension must stay the same). Renaming breaks widgets that still use the old path.\n\nCurrent: ' + from,
                from,
                'Rename image'
            );
            if (!suggested || typeof suggested !== 'string') return;
            const to = suggested.trim();
            if (!to || to === from) return;
            const extFrom = from.slice(from.lastIndexOf('.')).toLowerCase();
            const extTo = to.slice(to.lastIndexOf('.')).toLowerCase();
            if (extTo !== extFrom) {
                await CustomDialog.alert('The file extension must stay the same.', 'Rename blocked');
                return;
            }
            const provider = this.getProvider();
            if (!provider.renameImage) {
                await CustomDialog.alert('Rename is not available.', 'Error');
                return;
            }
            try {
                const finalName = await provider.renameImage(from, to);
                this.closePreview();
                this.selected.clear();
                await this.loadImages();
                if (finalName) this.openPreview(finalName);
            } catch (e) {
                await CustomDialog.alert(String(e.message || e), 'Rename failed');
            }
        },

        handleFiles: async function (fileList) {
            if (!fileList || fileList.length === 0) return;
            const provider = this.getProvider();
            if (!provider) {
                await CustomDialog.alert('Not connected.', 'Upload');
                return;
            }

            const arr = Array.from(fileList);
            let autoInserted = false;
            const progressEl = document.getElementById('gallery-upload-progress');
            const showProgress = (text) => {
                if (progressEl) {
                    progressEl.textContent = text;
                    progressEl.classList.remove('is-hidden');
                }
            };
            const hideProgress = () => {
                if (progressEl) progressEl.classList.add('is-hidden');
            };

            for (let i = 0; i < arr.length; i++) {
                const file = arr[i];
                showProgress('Uploading ' + (i + 1) + ' / ' + arr.length + ': ' + file.name);

                const sizeKB = file.size / 1024;
                const sizeMB = sizeKB / 1024;
                if (sizeMB > 8) {
                    await CustomDialog.alert('File too large (' + sizeMB.toFixed(1) + ' MB). Limit is 8MB.\n\n' + file.name, 'Upload blocked');
                    continue;
                }
                if (sizeKB > 600) {
                    const proceed = await CustomDialog.confirm(
                        'File "' + file.name + '" is ' + sizeKB.toFixed(0) + ' KB. Large images slow down dashboards.\n\nContinue anyway?',
                        'Large file warning'
                    );
                    if (!proceed) continue;
                }

                let targetName = file.name;
                const existingNames = this.files.map((f) => f.name);
                if (existingNames.includes(targetName)) {
                    const choice = await CustomDialog.chooseUploadConflict(
                        'An image named "' + targetName + '" already exists.',
                        'File already exists'
                    );
                    if (choice === 'skip' || choice == null) continue;
                    if (choice === 'copy') targetName = uniqueCopyName(file.name, existingNames);
                }

                try {
                    const dataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = () => reject(new Error('Read failed'));
                        reader.readAsDataURL(file);
                    });
                    await provider.saveImage(targetName, dataUrl);
                    const storedName = this._sanitizeImageName(targetName);
                    existingNames.push(storedName);
                    const normalized = normalizeEntry({ name: storedName, size: file.size, mtime: Date.now() });
                    const idx = this.files.findIndex((f) => f.name === storedName);
                    if (idx >= 0) this.files[idx] = normalized;
                    else this.files.push(normalized);

                    // Insertion mode: the first successful upload is injected straight
                    // into the calling target (URL editbox / Markdown editor), then the
                    // gallery closes. Remaining dropped files are ignored to avoid
                    // overwriting the target with a different image. Use the sanitized
                    // stored name so the inserted path resolves on the server.
                    if (this.pickMode === true && typeof this.onPick === 'function' && !autoInserted) {
                        autoInserted = true;
                        hideProgress();
                        this.runPickForName(storedName);
                        return;
                    }
                } catch (err) {
                    await CustomDialog.alert('Upload failed: ' + (err.message || err) + '\n\n' + file.name, 'Error');
                }
            }

            hideProgress();
            await this.loadImages();
        }
    };

    window.ImageGallery = ImageGallery;
    ImageGallery.init();
}());
