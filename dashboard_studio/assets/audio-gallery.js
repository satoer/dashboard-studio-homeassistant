/**
 * Audio Gallery (Homey): upload, list library (including Built-in clips), inline play, rename/delete.
 * List-native player - play each track from its row (no separate player overlay).
 * Depends: DataDriverRegistry, CustomDialog, Editor, DOM ids in editor.html
 */
(function () {
    const MAX_MB = 15;
    const WARN_MB = 3;
    const VALID_EXT = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm', '.flac'];
    const LS_LOOP = 'dashboardstudio-audio-gallery-loop';
    const LS_VOLUME = 'dashboardstudio-audio-gallery-volume';
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
        if (!ms) return '-';
        try {
            return new Date(ms).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
            return '-';
        }
    }

    function formatDuration(sec) {
        if (!isFinite(sec) || sec < 0) return '--:--';
        const s = Math.floor(sec % 60);
        const m = Math.floor(sec / 60) % 60;
        const h = Math.floor(sec / 3600);
        const pad = (n) => (n < 10 ? '0' : '') + n;
        if (h > 0) return h + ':' + pad(m) + ':' + pad(s);
        return m + ':' + pad(s);
    }

    function audioUrl(name) {
        return 'audio/' + encodeURIComponent(name);
    }

    function extOf(name) {
        const dot = name.lastIndexOf('.');
        return dot >= 0 ? name.slice(dot).toLowerCase() : '';
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

    const AudioGallery = {
        files: [],
        selected: new Set(),
        lastAnchorIndex: -1,
        filterText: '',
        sortValue: 'name-asc',
        pickMode: false,
        onPick: null,
        durationCache: Object.create(null),
        _audio: null,
        _activeName: null,
        _seeking: false,
        _wasPlayingBeforeSeek: false,
        _onKeyDown: null,
        _sortEl: null,
        _loop: false,
        _volume: 0.8,

        init: function () {
            const dropArea = document.getElementById('audio-gallery-upload');
            const input = document.getElementById('audio-gallery-input');
            if (!dropArea || !input) return;

            this._loadPrefs();

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

            const search = document.getElementById('audio-gallery-search');
            if (search) {
                search.addEventListener('input', () => {
                    this.filterText = search.value.trim().toLowerCase();
                    this.render();
                });
            }

            const sortContainer = document.getElementById('audio-gallery-sort-container');
            if (sortContainer && typeof Editor !== 'undefined' && Editor.createCustomSelect) {
                const sortOpts = [
                    { value: 'name-asc', text: 'Name A-Z' },
                    { value: 'name-desc', text: 'Name Z-A' },
                    { value: 'size-desc', text: 'Size largest' },
                    { value: 'size-asc', text: 'Size smallest' },
                    { value: 'mtime-desc', text: 'Newest' },
                    { value: 'mtime-asc', text: 'Oldest' },
                    { value: 'duration-desc', text: 'Longest' },
                    { value: 'duration-asc', text: 'Shortest' }
                ];
                const sortEl = Editor.createCustomSelect(sortOpts, this.sortValue || 'name-asc');
                sortEl.id = 'audio-gallery-sort';
                sortEl.title = 'Sort library';
                sortEl.onchange = () => {
                    this.sortValue = sortEl.value;
                    this.render();
                };
                sortContainer.innerHTML = '';
                sortContainer.appendChild(sortEl);
                this._sortEl = sortEl;
            }

            document.getElementById('audio-gallery-select-all')?.addEventListener('click', () => this.selectAllVisible());
            document.getElementById('audio-gallery-clear-selection')?.addEventListener('click', () => this.clearSelection());
            document.getElementById('audio-gallery-delete-selected')?.addEventListener('click', () => this.deleteSelected());
            document.getElementById('audio-gallery-loop')?.addEventListener('click', () => this.toggleLoop());
            document.getElementById('audio-gallery-mute')?.addEventListener('click', () => this.toggleMute());

            const vol = document.getElementById('audio-gallery-volume');
            if (vol) {
                vol.value = String(Math.round(this._volume * 100));
                vol.addEventListener('input', () => {
                    this._volume = Math.max(0, Math.min(1, (parseFloat(vol.value) || 0) / 100));
                    localStorage.setItem(LS_VOLUME, String(this._volume));
                    if (this._audio) {
                        this._audio.volume = this._volume;
                        if (this._volume > 0) this._audio.muted = false;
                    }
                    this._syncMuteUi();
                });
            }

            this._ensureAudioElement();
            this._syncLoopUi();
            this._syncMuteUi();

            this._onKeyDown = (e) => {
                const modal = document.getElementById('audio-gallery-modal');
                if (!modal || !modal.classList.contains('show')) return;
                const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
                if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
                if (e.key === ' ' || e.code === 'Space') {
                    e.preventDefault();
                    if (this._activeName) this.togglePlay(this._activeName);
                }
            };
            document.addEventListener('keydown', this._onKeyDown);
        },

        _loadPrefs: function () {
            const loop = localStorage.getItem(LS_LOOP);
            this._loop = loop === '1';
            const vol = parseFloat(localStorage.getItem(LS_VOLUME));
            if (isFinite(vol) && vol >= 0 && vol <= 1) this._volume = vol;
        },

        _ensureAudioElement: function () {
            if (this._audio) return this._audio;
            const audio = new Audio();
            audio.preload = 'metadata';
            audio.addEventListener('timeupdate', () => {
                if (!this._seeking) this._syncActiveRowUi();
            });
            audio.addEventListener('loadedmetadata', () => {
                if (this._activeName) {
                    this.durationCache[this._activeName] = audio.duration;
                    this._syncActiveRowUi();
                    this._refreshDurationLabels();
                }
            });
            audio.addEventListener('ended', () => {
                this._syncActiveRowUi();
                this._refreshPlayButtons();
            });
            audio.addEventListener('play', () => this._refreshPlayButtons());
            audio.addEventListener('pause', () => this._refreshPlayButtons());
            this._audio = audio;
            return audio;
        },

        getProvider: function () {
            const driver = DataDriverRegistry.get();
            if (!driver || typeof driver.getStorageProvider !== 'function') return null;
            return driver.getStorageProvider();
        },

        _urlForName: function (name) {
            if (!name) return '';
            return '/' + audioUrl(name);
        },

        _sanitizeAudioName: function (name) {
            if (!name || typeof name !== 'string') return '';
            return name.replace(/[#?&"'\s]/g, '_');
        },

        open: async function (options) {
            this.pickMode = false;
            this.onPick = null;
            if (options && typeof options === 'object' && options.pickMode === true) {
                this.pickMode = true;
                if (typeof options.onPick === 'function') this.onPick = options.onPick;
            }
            if (!DataDriverRegistry.get() || (DataDriverRegistry.getType() !== 'homey' && DataDriverRegistry.getType() !== 'homeassistant')) {
                this.pickMode = false;
                this.onPick = null;
                await CustomDialog.alert('Audio Gallery is only available in Homey mode.');
                return;
            }
            document.getElementById('audio-gallery-modal')?.classList.add('show');
            const search = document.getElementById('audio-gallery-search');
            if (search) {
                search.value = '';
                this.filterText = '';
            }
            if (this._sortEl) this.sortValue = this._sortEl.value;
            await this.loadAudio();
        },

        close: function () {
            this.stopPlayback(true);
            document.getElementById('audio-gallery-modal')?.classList.remove('show');
            this.clearSelection();
            this.pickMode = false;
            this.onPick = null;
        },

        runPickForName: function (name) {
            if (!name || this.pickMode !== true || typeof this.onPick !== 'function') return;
            this.onPick(this._urlForName(name));
            this.close();
        },

        togglePlay: function (name) {
            if (!name) return;
            const audio = this._ensureAudioElement();
            if (this._activeName === name) {
                if (audio.paused) audio.play().catch(() => {});
                else audio.pause();
                this._syncActiveRowUi();
                this._refreshPlayButtons();
                return;
            }
            this.playTrack(name);
        },

        playTrack: function (name) {
            if (!name) return;
            const audio = this._ensureAudioElement();
            const prev = this._activeName;
            this._activeName = name;
            audio.loop = this._loop;
            audio.volume = this._volume;
            audio.muted = this._volume === 0;
            audio.src = audioUrl(name);
            audio.load();
            audio.play().catch(() => {});
            if (prev && prev !== name) this.render();
            else {
                this._syncActiveRowUi();
                this._refreshPlayButtons();
            }
            this.probeDuration(name);
        },

        stopPlayback: function (clearSrc) {
            const audio = this._audio;
            if (audio) {
                audio.pause();
                try { audio.currentTime = 0; } catch (e) { /* ignore */ }
                if (clearSrc) {
                    audio.removeAttribute('src');
                    audio.load();
                    this._activeName = null;
                }
            }
            this._syncActiveRowUi();
            this._refreshPlayButtons();
        },

        toggleLoop: function () {
            this._loop = !this._loop;
            localStorage.setItem(LS_LOOP, this._loop ? '1' : '0');
            if (this._audio) this._audio.loop = this._loop;
            this._syncLoopUi();
        },

        toggleMute: function () {
            const audio = this._ensureAudioElement();
            audio.muted = !audio.muted;
            this._syncMuteUi();
        },

        _syncLoopUi: function () {
            const btn = document.getElementById('audio-gallery-loop');
            if (!btn) return;
            btn.classList.toggle('is-active', this._loop);
            btn.setAttribute('aria-pressed', this._loop ? 'true' : 'false');
            btn.title = this._loop ? 'Loop on' : 'Loop off';
        },

        _syncMuteUi: function () {
            const btn = document.getElementById('audio-gallery-mute');
            const audio = this._audio;
            if (!btn) return;
            const muted = !!(audio && (audio.muted || this._volume === 0));
            btn.classList.toggle('is-active', muted);
            btn.innerHTML = muted
                ? '<i class="ph-bold ph-speaker-slash"></i>'
                : '<i class="ph-bold ph-speaker-high"></i>';
            btn.title = muted ? 'Unmute' : 'Mute';
        },

        probeDuration: function (name) {
            if (!name || this.durationCache[name]) return;
            const probe = new Audio();
            probe.preload = 'metadata';
            probe.src = audioUrl(name);
            probe.addEventListener('loadedmetadata', () => {
                if (isFinite(probe.duration) && probe.duration > 0) {
                    this.durationCache[name] = probe.duration;
                    this._refreshDurationLabels();
                    if (String(this.sortValue || '').startsWith('duration')) this.render();
                }
            }, { once: true });
        },

        loadAudio: async function () {
            const root = document.getElementById('audio-gallery-items');
            if (!root) return;
            root.innerHTML = '<div class="audio-library-status">Loading…</div>';

            const provider = this.getProvider();
            if (!provider || typeof provider.listAudio !== 'function') {
                root.innerHTML = '<div class="audio-library-status is-error">Not connected.</div>';
                return;
            }
            try {
                const raw = await provider.listAudio();
                this.files = Array.isArray(raw) ? raw.map(normalizeEntry).filter((x) => x.name) : [];
                this.pruneSelection();
                this.updateTotalSize();
                this.render();
                this.files.forEach((f) => this.probeDuration(f.name));
            } catch (e) {
                root.innerHTML = '<div class="audio-library-status is-error">Error: ' + String(e.message || e) + '</div>';
            }
        },

        updateTotalSize: function () {
            const el = document.getElementById('audio-gallery-total-size');
            if (!el) return;
            const userSum = this.files.reduce((a, f) => a + (isBuiltIn(f) ? 0 : (f.size || 0)), 0);
            const n = this.files.length;
            el.textContent = n
                ? n + ' track' + (n === 1 ? '' : 's') + (userSum > 0 ? ' · ' + formatBytes(userSum) : '')
                : 'No tracks';
        },

        getVisibleFiles: function () {
            let list = this.files.slice();
            const q = this.filterText;
            if (q) list = list.filter((f) => f.name.toLowerCase().includes(q));

            const [key, dir] = String(this.sortValue || 'name-asc').split('-');
            const asc = dir === 'asc';
            list.sort((a, b) => {
                let cmp = 0;
                if (key === 'name') cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
                else if (key === 'size') cmp = (a.size || 0) - (b.size || 0);
                else if (key === 'mtime') cmp = (a.mtime || 0) - (b.mtime || 0);
                else if (key === 'duration') {
                    cmp = (this.durationCache[a.name] || 0) - (this.durationCache[b.name] || 0);
                }
                return asc ? cmp : -cmp;
            });
            return list;
        },

        pruneSelection: function () {
            const names = new Set(this.files.filter((f) => !isBuiltIn(f)).map((f) => f.name));
            for (const n of this.selected) {
                if (!names.has(n)) this.selected.delete(n);
            }
            this.updateActionButtons();
        },

        render: function () {
            const root = document.getElementById('audio-gallery-items');
            if (!root) return;

            const prevScrollTop = root.scrollTop;

            const visible = this.getVisibleFiles();
            root.innerHTML = '';

            if (visible.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'audio-library-status';
                empty.textContent = this.files.length === 0
                    ? 'No audio yet. Upload above to build your library.'
                    : 'No tracks match your search.';
                root.appendChild(empty);
                this.updateActionButtons();
                return;
            }

            visible.forEach((entry, index) => {
                root.appendChild(this.buildTrackRow(entry, index));
            });

            root.scrollTop = prevScrollTop;
            this.updateActionButtons();
            this._syncActiveRowUi();
            this._refreshPlayButtons();
        },

        syncSelectionUi: function () {
            const root = document.getElementById('audio-gallery-items');
            if (!root) return;
            const rows = root.querySelectorAll('.audio-library-track');
            rows.forEach((row) => {
                const name = row.dataset.name;
                const isSel = !!(name && this.selected.has(name));
                row.classList.toggle('is-selected', isSel);
                const cb = row.querySelector('.audio-library-select');
                if (cb) cb.checked = isSel;
            });
        },

        buildTrackRow: function (entry, index) {
            const row = document.createElement('div');
            const builtIn = isBuiltIn(entry);
            const isActive = entry.name === this._activeName;
            const isPlaying = isActive && this._audio && !this._audio.paused;
            row.className = 'audio-library-track'
                + (this.selected.has(entry.name) ? ' is-selected' : '')
                + (isActive ? ' is-active' : '')
                + (isPlaying ? ' is-playing' : '')
                + (builtIn ? ' is-builtin' : '');
            row.dataset.name = entry.name;
            row.setAttribute('role', 'listitem');

            if (builtIn) {
                const lock = document.createElement('span');
                lock.className = 'audio-library-readonly';
                lock.title = BUILT_IN_TAG;
                lock.setAttribute('aria-label', BUILT_IN_TAG);
                lock.innerHTML = '<i class="ph-fill ph-lock-key"></i>';
                row.appendChild(lock);
            } else {
                const select = document.createElement('input');
                select.type = 'checkbox';
                select.className = 'ds-checkbox audio-library-select';
                select.checked = this.selected.has(entry.name);
                select.title = 'Select for bulk delete';
                select.addEventListener('click', (e) => e.stopPropagation());
                select.addEventListener('change', (e) => {
                    e.stopPropagation();
                    GallerySelection.toggleOne(this, entry.name, index, (f) => this.isSelectable(f));
                });
                row.appendChild(select);
            }

            const playBtn = document.createElement('button');
            playBtn.type = 'button';
            playBtn.className = 'audio-library-play';
            playBtn.title = 'Play / Pause';
            playBtn.innerHTML = '<i class="ph-fill ph-play"></i>';
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePlay(entry.name);
            });

            const main = document.createElement('div');
            main.className = 'audio-library-track-main';

            const titleRow = document.createElement('div');
            titleRow.className = 'audio-library-track-title-row';
            const nameWrap = document.createElement('div');
            nameWrap.className = 'audio-library-track-name-wrap';
            const nameEl = document.createElement('div');
            nameEl.className = 'audio-library-track-name';
            nameEl.textContent = entry.name;
            nameEl.title = entry.name;
            nameWrap.appendChild(nameEl);
            if (builtIn) {
                const badge = document.createElement('span');
                badge.className = 'factory-badge';
                badge.textContent = BUILT_IN_TAG;
                nameWrap.appendChild(badge);
            }
            const durEl = document.createElement('div');
            durEl.className = 'audio-library-track-duration';
            durEl.dataset.durationFor = entry.name;
            durEl.textContent = this.durationCache[entry.name]
                ? formatDuration(this.durationCache[entry.name])
                : '--:--';
            titleRow.appendChild(nameWrap);
            titleRow.appendChild(durEl);

            const meta = document.createElement('div');
            meta.className = 'audio-library-track-meta';
            meta.textContent = formatBytes(entry.size) + ' · ' + formatDate(entry.mtime)
                + (extOf(entry.name) ? ' · ' + extOf(entry.name).slice(1).toUpperCase() : '');

            main.appendChild(titleRow);
            main.appendChild(meta);

            if (isActive) {
                main.appendChild(this.buildInlineTransport(entry.name));
            }

            const actions = document.createElement('div');
            actions.className = 'audio-library-track-actions';

            if (this.pickMode) {
                actions.appendChild(this._actionBtn('ph-plus', 'Insert path', 'primary', () => this.runPickForName(entry.name)));
            }
            actions.appendChild(this._actionBtn('ph-copy', 'Copy path (/audio/…)', '', () => this.copyPathForName(entry.name)));
            actions.appendChild(this._actionBtn('ph-download-simple', 'Download', '', () => this.downloadOne(entry.name)));
            if (!builtIn) {
                actions.appendChild(this._actionBtn('ph-pencil-simple', 'Rename', '', () => this.renameOne(entry.name)));
                actions.appendChild(this._actionBtn('ph-trash', 'Delete', 'danger', () => this.deleteOneFile(entry.name)));
            }

            row.appendChild(playBtn);
            row.appendChild(main);
            row.appendChild(actions);

            row.addEventListener('click', (e) => {
                if (builtIn) return;
                if (e.target.closest('button, input, .audio-library-inline')) return;
                GallerySelection.handleItemClick(this, e, entry.name, index, (f) => this.isSelectable(f));
            });

            row.addEventListener('dblclick', (e) => {
                if (e.target.closest('button, input, .audio-library-inline')) return;
                this.togglePlay(entry.name);
            });

            return row;
        },

        buildInlineTransport: function (name) {
            const wrap = document.createElement('div');
            wrap.className = 'audio-library-inline';
            wrap.addEventListener('click', (e) => e.stopPropagation());

            const timeCur = document.createElement('span');
            timeCur.className = 'audio-library-time';
            timeCur.dataset.role = 'current';
            timeCur.textContent = '0:00';

            const seek = document.createElement('input');
            seek.type = 'range';
            seek.className = 'audio-library-seek';
            seek.min = '0';
            seek.max = '0';
            seek.step = '0.01';
            seek.value = '0';
            seek.title = 'Seek';
            seek.addEventListener('pointerdown', () => {
                this._seeking = true;
                this._wasPlayingBeforeSeek = !!(this._audio && !this._audio.paused);
            });
            seek.addEventListener('input', () => {
                timeCur.textContent = formatDuration(parseFloat(seek.value) || 0);
            });
            const endSeek = () => {
                if (!this._seeking || !this._audio || this._activeName !== name) {
                    this._seeking = false;
                    return;
                }
                try { this._audio.currentTime = parseFloat(seek.value) || 0; } catch (e) { /* ignore */ }
                this._seeking = false;
                if (this._wasPlayingBeforeSeek) this._audio.play().catch(() => {});
                this._syncActiveRowUi();
            };
            seek.addEventListener('pointerup', endSeek);
            seek.addEventListener('change', endSeek);

            const timeTot = document.createElement('span');
            timeTot.className = 'audio-library-time';
            timeTot.dataset.role = 'total';
            timeTot.textContent = this.durationCache[name]
                ? formatDuration(this.durationCache[name])
                : '--:--';

            const stopBtn = document.createElement('button');
            stopBtn.type = 'button';
            stopBtn.className = 'btn-tool audio-library-stop';
            stopBtn.title = 'Stop';
            stopBtn.innerHTML = '<i class="ph-bold ph-stop"></i>';
            stopBtn.addEventListener('click', () => this.stopPlayback(false));

            wrap.appendChild(timeCur);
            wrap.appendChild(seek);
            wrap.appendChild(timeTot);
            wrap.appendChild(stopBtn);
            return wrap;
        },

        _actionBtn: function (icon, title, extraClass, onClick) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-tool audio-library-action' + (extraClass ? ' ' + extraClass : '');
            btn.title = title;
            btn.innerHTML = '<i class="ph-bold ' + icon + '"></i>';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onClick();
            });
            return btn;
        },

        _syncActiveRowUi: function () {
            const root = document.getElementById('audio-gallery-items');
            if (!root || !this._activeName) return;
            let row = null;
            root.querySelectorAll('.audio-library-track').forEach((el) => {
                if (el.dataset.name === this._activeName) row = el;
            });
            if (!row) return;

            const audio = this._audio;
            const playing = !!(audio && !audio.paused);
            row.classList.toggle('is-playing', playing);

            let inline = row.querySelector('.audio-library-inline');
            if (!inline) {
                const main = row.querySelector('.audio-library-track-main');
                if (main) {
                    inline = this.buildInlineTransport(this._activeName);
                    main.appendChild(inline);
                }
            }
            if (!inline || this._seeking) return;

            const seek = inline.querySelector('.audio-library-seek');
            const cur = inline.querySelector('[data-role="current"]');
            const tot = inline.querySelector('[data-role="total"]');
            const duration = audio && isFinite(audio.duration) ? audio.duration
                : (this.durationCache[this._activeName] || 0);
            if (seek) {
                seek.max = String(duration || 0);
                seek.value = String(audio ? (audio.currentTime || 0) : 0);
            }
            if (cur) cur.textContent = formatDuration(audio ? audio.currentTime : 0);
            if (tot) tot.textContent = formatDuration(duration);
        },

        _refreshPlayButtons: function () {
            const root = document.getElementById('audio-gallery-items');
            if (!root) return;
            root.querySelectorAll('.audio-library-track').forEach((row) => {
                const name = row.dataset.name;
                const isActive = name === this._activeName;
                const isPlaying = isActive && this._audio && !this._audio.paused;
                row.classList.toggle('is-active', isActive);
                row.classList.toggle('is-playing', isPlaying);
                const icon = row.querySelector('.audio-library-play i');
                if (icon) {
                    icon.className = isPlaying ? 'ph-fill ph-pause' : 'ph-fill ph-play';
                }
                if (!isActive) {
                    const inline = row.querySelector('.audio-library-inline');
                    if (inline) inline.remove();
                }
            });
        },

        _refreshDurationLabels: function () {
            const root = document.getElementById('audio-gallery-items');
            if (!root) return;
            root.querySelectorAll('[data-duration-for]').forEach((el) => {
                const name = el.getAttribute('data-duration-for');
                const d = name && this.durationCache[name];
                if (d) el.textContent = formatDuration(d);
            });
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
            const sa = document.getElementById('audio-gallery-select-all');
            const clr = document.getElementById('audio-gallery-clear-selection');
            const del = document.getElementById('audio-gallery-delete-selected');
            if (sa) sa.disabled = selectableCount === 0;
            if (clr) clr.disabled = n === 0;
            if (del) del.disabled = n === 0;
        },

        copyPathForName: function (name) {
            Editor.copyToClipboard('/' + audioUrl(name));
        },

        deleteOneFile: async function (name) {
            if (this._isBuiltInName(name)) {
                await CustomDialog.alert('Built-in audio cannot be deleted.', 'Delete blocked');
                return;
            }
            const msg = 'Delete "' + name + '"? This cannot be undone.';
            if (!await CustomDialog.confirm(msg, 'Delete audio')) return;
            const provider = this.getProvider();
            if (!provider) return;
            try {
                await provider.deleteAudio(name);
                if (this._activeName === name) this.stopPlayback(true);
                this.selected.delete(name);
                this.files = this.files.filter((f) => f.name !== name);
                delete this.durationCache[name];
                this.pruneSelection();
                this.updateTotalSize();
                this.render();
                await this.loadAudio();
            } catch (e) {
                await CustomDialog.alert('Failed to delete: ' + (e.message || e), 'Error');
            }
        },

        downloadOne: async function (name) {
            try {
                const res = await fetch(audioUrl(name));
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
            if (!await CustomDialog.confirm('Delete ' + names.length + ' audio file(s)? This cannot be undone.', 'Delete audio')) return;
            const provider = this.getProvider();
            if (!provider) return;

            if (provider.deleteAudioFiles && names.length > 1) {
                try {
                    await provider.deleteAudioFiles(names);
                    this.files = this.files.filter((f) => !names.includes(f.name));
                    for (const n of names) {
                        delete this.durationCache[n];
                        this.selected.delete(n);
                    }
                } catch (e) {
                    await CustomDialog.alert('Failed to delete: ' + (e.message || e), 'Error');
                }
            } else {
                for (const name of names) {
                    try {
                        await provider.deleteAudio(name);
                        this.files = this.files.filter((f) => f.name !== name);
                        delete this.durationCache[name];
                        this.selected.delete(name);
                    } catch (e) {
                        await CustomDialog.alert('Failed to delete "' + name + '": ' + (e.message || e), 'Error');
                    }
                }
            }

            if (this._activeName && names.includes(this._activeName)) this.stopPlayback(true);
            this.pruneSelection();
            this.updateTotalSize();
            this.render();
            await this.loadAudio();
        },

        renameOne: async function (from) {
            if (!from) return;
            if (this._isBuiltInName(from)) {
                await CustomDialog.alert('Built-in audio cannot be renamed.', 'Rename blocked');
                return;
            }
            const suggested = await CustomDialog.prompt(
                'New filename (extension must stay the same).\n\nCurrent: ' + from,
                from,
                'Rename audio'
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
            if (!provider.renameAudio) {
                await CustomDialog.alert('Rename is not available.', 'Error');
                return;
            }
            try {
                const wasPlaying = this._activeName === from && this._audio && !this._audio.paused;
                const finalName = await provider.renameAudio(from, to);
                if (this.durationCache[from] != null) {
                    this.durationCache[finalName] = this.durationCache[from];
                    delete this.durationCache[from];
                }
                if (this._activeName === from) {
                    this.stopPlayback(true);
                }
                this.selected.clear();
                await this.loadAudio();
                if (finalName && wasPlaying) this.playTrack(finalName);
            } catch (e) {
                await CustomDialog.alert(String(e.message || e), 'Rename failed');
            }
        },

        handleFiles: async function (fileList) {
            if (!fileList || fileList.length === 0) return;
            const provider = this.getProvider();
            if (!provider || typeof provider.saveAudio !== 'function') {
                await CustomDialog.alert('Not connected.', 'Upload');
                return;
            }

            const arr = Array.from(fileList);
            let autoInserted = false;
            const progressEl = document.getElementById('audio-gallery-upload-progress');
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

                const ext = extOf(file.name);
                if (VALID_EXT.indexOf(ext) < 0) {
                    await CustomDialog.alert(
                        'Unsupported format: ' + file.name + '\n\nAllowed: mp3, wav, ogg, m4a, aac, webm, flac.',
                        'Upload blocked'
                    );
                    continue;
                }

                const sizeMB = file.size / 1048576;
                if (sizeMB > MAX_MB) {
                    await CustomDialog.alert(
                        'File too large (' + sizeMB.toFixed(1) + ' MB). Limit is ' + MAX_MB + 'MB.\n\n' + file.name,
                        'Upload blocked'
                    );
                    continue;
                }
                if (sizeMB > WARN_MB) {
                    const proceed = await CustomDialog.confirm(
                        'File "' + file.name + '" is ' + sizeMB.toFixed(1) + ' MB. Large audio files use Homey storage quickly.\n\nContinue anyway?',
                        'Large file warning'
                    );
                    if (!proceed) continue;
                }

                let targetName = file.name;
                const existingNames = this.files.map((f) => f.name);
                if (existingNames.includes(targetName)) {
                    const choice = await CustomDialog.chooseUploadConflict(
                        'An audio file named "' + targetName + '" already exists.',
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
                    await provider.saveAudio(targetName, dataUrl);
                    const storedName = this._sanitizeAudioName(targetName);
                    existingNames.push(storedName);
                    const normalized = normalizeEntry({ name: storedName, size: file.size, mtime: Date.now() });
                    const idx = this.files.findIndex((f) => f.name === storedName);
                    if (idx >= 0) this.files[idx] = normalized;
                    else this.files.push(normalized);

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
            await this.loadAudio();
        }
    };

    window.AudioGallery = AudioGallery;
    AudioGallery.init();
}());
