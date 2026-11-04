/**
 * Editor-only Dashboard APIs (icon browser, FAB auto-hide).
 * Loaded via EDITOR_TAIL — never on viewer.html — to keep viewer parse weight down.
 * Patches methods onto the shared Dashboard object after dashboard.js has loaded.
 */
(function () {
    if (typeof Dashboard === 'undefined') {
        console.error('[dashboard-editor-api] Dashboard is not defined');
        return;
    }

    Object.assign(Dashboard, {
        iconCallback: null,
        ibState: {
            filtered: [],
            toRender: 0,
            batchSize: 100,
            scrollListener: null,
            loading: false,
            iconsData: null
        },

        openIconBrowser: async function (current, cb) {
            this.iconCallback = cb;
            const grid = document.getElementById('ib-grid');
            if (!grid) {
                console.warn('[Dashboard] openIconBrowser: #ib-grid not found');
                return;
            }

            if (!this.ibState.iconsData && this.ibState.loading) {
                return;
            }

            grid.innerHTML = '';

            if (!this.ibState.iconsData) {
                this.ibState.loading = true;
                grid.innerHTML = '<div class="ds-file-list-empty col-span-full">Loading icon library...</div>';
                document.getElementById('icon-modal').classList.add('open');

                try {
                    const res = await fetch('data-phosphor-icons.json');
                    if (!res.ok) throw new Error("File not found or failed to load");
                    this.ibState.iconsData = await res.json();

                    this.ibState.iconsData.forEach(ic => {
                        const parts = [ic.name];
                        if (ic.categories) parts.push(...ic.categories);
                        if (ic.tags) parts.push(...ic.tags);
                        ic._searchStr = parts.join(" ").toLowerCase();
                    });
                } catch (err) {
                    console.error("[Dashboard] Icon list load error:", err);
                    grid.innerHTML = `<div class="text-xs text-red-500 text-center w-full py-4 col-span-full">Failed to load icons: ${err.message}</div>`;
                    this.ibState.loading = false;
                    return;
                }
                this.ibState.loading = false;
                grid.innerHTML = '';
            }

            if (this.ibState.scrollListener) {
                grid.removeEventListener('scroll', this.ibState.scrollListener);
            }

            this.ibState.scrollListener = () => {
                if (grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 50) {
                    this._renderIconBatch();
                }
            };
            grid.addEventListener('scroll', this.ibState.scrollListener);

            this.filterIcons('');
            document.getElementById('ib-search').value = '';
            document.getElementById('icon-modal').classList.add('open');
            document.getElementById('ib-search').focus();
        },

        filterIcons: function (query) {
            const grid = document.getElementById('ib-grid');
            grid.innerHTML = '';
            grid.scrollTop = 0;
            const q = (query || '').trim().toLowerCase();

            if (!this.ibState.iconsData) {
                this.ibState.filtered = [];
            } else if (!q) {
                this.ibState.filtered = this.ibState.iconsData;
            } else {
                this.ibState.filtered = this.ibState.iconsData.filter(i => i._searchStr.includes(q));
            }

            this.ibState.toRender = 0;

            if (this.ibState.filtered.length === 0 && this.ibState.iconsData) {
                grid.innerHTML = '<div class="ds-file-list-empty col-span-full">No matching icons found.</div>';
            } else {
                this._renderIconBatch();
            }
        },

        _renderIconBatch: function () {
            const grid = document.getElementById('ib-grid');
            if (this.ibState.toRender >= this.ibState.filtered.length) return;

            const endIdx = Math.min(this.ibState.toRender + this.ibState.batchSize, this.ibState.filtered.length);
            const batch = this.ibState.filtered.slice(this.ibState.toRender, endIdx);

            batch.forEach(iconObj => {
                const iconName = "ph-" + iconObj.name;
                const el = document.createElement('div');
                el.className = 'ib-item';
                el.innerHTML = `<i class="ph ${iconName}"></i><span>${iconObj.name}</span>`;
                el.onclick = () => {
                    if (this.iconCallback) this.iconCallback(iconName);
                    document.getElementById('icon-modal').classList.remove('open');
                };
                grid.appendChild(el);
            });

            this.ibState.toRender = endIdx;

            requestAnimationFrame(() => {
                if (grid.scrollHeight <= grid.clientHeight && this.ibState.toRender < this.ibState.filtered.length) {
                    this._renderIconBatch();
                }
            });
        },

        /**
         * Hold the edit button on screen. A guide pointer uses this so the
         * cogwheel stays visible for the hint even when the pointer is still.
         */
        pinFabVisible: function (pinned) {
            const fab = document.getElementById('fab-mode-switch');
            this._fabPinned = !!pinned;
            if (!fab || fab.style.display === 'none') return;
            if (this._fabPinned) {
                if (this.fabTimer) {
                    if (typeof WorkerTimer !== 'undefined' && WorkerTimer.clearTimeout) WorkerTimer.clearTimeout(this.fabTimer);
                    else clearTimeout(this.fabTimer);
                    this.fabTimer = null;
                }
                fab.style.opacity = '1';
                fab.style.pointerEvents = 'auto';
                return;
            }
            if (typeof this._fabResetTimer === 'function') this._fabResetTimer();
        },

        initFabAutoHiding: function () {
            const fab = document.getElementById('fab-mode-switch');
            if (!fab) return;

            if (window.APP_CONFIG && window.APP_CONFIG.defaults && window.APP_CONFIG.defaults.hideEditor) {
                fab.style.display = 'none';
                return;
            }

            const resetTimer = () => {
                fab.style.opacity = '1';
                fab.style.pointerEvents = 'auto';
                if (this.fabTimer) {
                    if (typeof WorkerTimer !== 'undefined' && WorkerTimer.clearTimeout) WorkerTimer.clearTimeout(this.fabTimer);
                    else clearTimeout(this.fabTimer);
                    this.fabTimer = null;
                }
                if (this._fabPinned) return;
                const hideFab = () => {
                    if (this._fabPinned) return;
                    fab.style.opacity = '0';
                    fab.style.pointerEvents = 'none';
                };
                if (typeof WorkerTimer !== 'undefined' && WorkerTimer.setTimeout) {
                    this.fabTimer = WorkerTimer.setTimeout(hideFab, 10000);
                } else {
                    this.fabTimer = setTimeout(hideFab, 10000);
                }
            };
            this._fabResetTimer = resetTimer;
            window.addEventListener('mousemove', resetTimer);
            window.addEventListener('mousedown', resetTimer);
            window.addEventListener('keydown', resetTimer);
            window.addEventListener('touchstart', resetTimer);
            resetTimer();
        }
    });
})();
