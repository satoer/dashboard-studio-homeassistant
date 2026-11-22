/**
 * Editor page manager.
 * Drafts names, order, inserts, and deletes. Nothing is written until Apply.
 * Page records live on the dashboard root as a sparse `pages` tree so a widget
 * spec such as 1-10000 never becomes thousands of saved entries.
 */
(function (global) {
    'use strict';

    const PageManager = {
        _open: false,
        _rows: [],
        _oldCount: 0,
        _beforePages: null,
        _reorder: null,
        _uid: 1,
        _backdrop: null,
        _onKey: null,
        _applying: false,

        open: function () {
            if (this._open) return;
            if (typeof Dashboard === 'undefined') return;
            this._rows = this._captureRows();
            this._oldCount = this._rows.length;
            this._beforePages = Dashboard._cloneJson(Dashboard.pages || {});
            this._open = true;
            this._ensureShell();
            this._paint();
            this._backdrop.classList.add('show');
            this._backdrop.setAttribute('aria-hidden', 'false');
            const self = this;
            this._onKey = function (e) {
                if (!self._open || e.key !== 'Escape') return;
                const cd = document.getElementById('custom-dialog');
                if (cd && cd.classList.contains('show')) return;
                e.preventDefault();
                self.close();
            };
            document.addEventListener('keydown', this._onKey);
        },

        close: function () {
            if (!this._open) return;
            this._open = false;
            this._applying = false;
            if (this._reorder) {
                this._reorder.destroy();
                this._reorder = null;
            }
            if (this._onKey) {
                document.removeEventListener('keydown', this._onKey);
                this._onKey = null;
            }
            if (this._backdrop) {
                this._backdrop.classList.remove('show');
                this._backdrop.setAttribute('aria-hidden', 'true');
            }
            this._rows = [];
        },

        _captureRows: function () {
            const dash = Dashboard;
            let count = typeof dash._contentPageMax === 'function' ? dash._contentPageMax() : 1;
            const cur = Math.max(1, parseInt(MASTER_SETTINGS.currentPage, 10) || 1);
            const cap = typeof dash._catalogCap === 'function' ? dash._catalogCap() : 200;
            if (cur > count && cur <= cap) count = cur;
            if (count < 1) count = 1;
            const tree = dash.pages || {};
            const rows = [];
            for (let p = 1; p <= count; p++) {
                const rec = tree[String(p)] && typeof tree[String(p)] === 'object' ? tree[String(p)] : {};
                const names = typeof dash._pagePlacementNames === 'function' ? dash._pagePlacementNames(p) : [];
                rows.push({
                    uid: this._uid++,
                    origin: p,
                    name: rec.name ? String(rec.name) : '',
                    autoLabel: 'Page ' + p,
                    widgetCount: names.length,
                    occupied: names.length > 0,
                    settings: this._settingsWithoutName(rec)
                });
            }
            return rows;
        },

        _settingsWithoutName: function (rec) {
            const out = {};
            if (!rec || typeof rec !== 'object') return out;
            Object.keys(rec).forEach(function (k) {
                if (k === 'name' || rec[k] === undefined) return;
                out[k] = Dashboard._cloneJson(rec[k]);
            });
            return out;
        },

        _ensureShell: function () {
            if (this._backdrop && document.body.contains(this._backdrop)) return;
            const backdrop = document.createElement('div');
            backdrop.id = 'page-manager-modal';
            backdrop.className = 'ds-dialog-backdrop';
            backdrop.setAttribute('aria-hidden', 'true');

            const panel = document.createElement('div');
            panel.className = 'modal-content pm-panel';
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-modal', 'true');
            panel.setAttribute('aria-labelledby', 'pm-title');

            const header = document.createElement('div');
            header.className = 'modal-header';
            const title = document.createElement('h3');
            title.className = 'ds-dialog-title';
            title.id = 'pm-title';
            title.innerHTML = '<i class="ph-bold ph-files ds-dialog-title-icon"></i><span>Page Manager</span>';
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'ds-dialog-close';
            closeBtn.title = 'Close';
            closeBtn.setAttribute('aria-label', 'Close');
            closeBtn.innerHTML = '<i class="ph-bold ph-x"></i>';
            header.appendChild(title);
            header.appendChild(closeBtn);

            const body = document.createElement('div');
            body.className = 'modal-body pm-body';
            body.id = 'pm-body';

            const footer = document.createElement('div');
            footer.className = 'modal-footer ds-dialog-footer';
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn-tool ds-dialog-button';
            cancelBtn.textContent = 'Cancel';
            const applyBtn = document.createElement('button');
            applyBtn.type = 'button';
            applyBtn.className = 'btn-tool ds-dialog-button primary';
            applyBtn.id = 'pm-apply';
            applyBtn.textContent = 'Apply';
            footer.appendChild(cancelBtn);
            footer.appendChild(applyBtn);

            panel.appendChild(header);
            panel.appendChild(body);
            panel.appendChild(footer);
            backdrop.appendChild(panel);
            document.body.appendChild(backdrop);

            const self = this;
            closeBtn.addEventListener('click', function () { self.close(); });
            cancelBtn.addEventListener('click', function () { self.close(); });
            applyBtn.addEventListener('click', function () { void self._apply(); });
            backdrop.addEventListener('click', function (e) {
                if (e.target === backdrop) self.close();
            });
            this._backdrop = backdrop;
        },

        _paint: function () {
            if (this._reorder) {
                this._reorder.destroy();
                this._reorder = null;
            }
            const body = document.getElementById('pm-body');
            if (!body) return;
            body.innerHTML = '';

            const intro = document.createElement('p');
            intro.className = 'pm-intro';
            intro.textContent = 'Drag a page to a new position. An empty name keeps the label it had when you opened this dialog. Nothing is saved until you press Apply.';
            body.appendChild(intro);

            const list = document.createElement('div');
            list.className = 'pm-list';
            list.id = 'pm-list';

            const self = this;
            this._rows.forEach(function (row, index) {
                list.appendChild(self._buildRow(row, index));
            });
            body.appendChild(list);

            if (typeof EditorReorder !== 'undefined' && typeof EditorReorder.attach === 'function') {
                this._reorder = EditorReorder.attach(list, {
                    onReorder: function (from, to) {
                        const moved = self._rows.splice(from, 1)[0];
                        self._rows.splice(to, 0, moved);
                        self._paint();
                    }
                });
            }
        },

        _buildRow: function (row, index) {
            const pageNum = index + 1;
            const el = document.createElement('div');
            el.className = 'pm-row ds-reorder-item';
            el.setAttribute('data-uid', String(row.uid));

            const handle = (typeof EditorReorder !== 'undefined' && typeof EditorReorder.createDragHandle === 'function')
                ? EditorReorder.createDragHandle()
                : (function () {
                    const h = document.createElement('span');
                    h.className = 'ds-reorder-handle';
                    h.innerHTML = '<i class="ph-bold ph-dots-six-vertical"></i>';
                    return h;
                })();

            const badge = document.createElement('span');
            badge.className = 'pm-index';
            badge.textContent = String(pageNum);

            const name = document.createElement('input');
            name.type = 'text';
            name.className = 'control-input pm-name';
            name.value = row.name || '';
            name.placeholder = row.autoLabel || ('Page ' + pageNum);
            name.setAttribute('aria-label', 'Name for ' + (row.autoLabel || ('page ' + pageNum)));
            name.setAttribute('autocomplete', 'off');
            name.addEventListener('input', function () {
                row.name = name.value;
            });

            const count = document.createElement('span');
            count.className = 'pm-count';
            if (row.widgetCount > 0) {
                count.textContent = row.widgetCount === 1 ? '1 widget' : (row.widgetCount + ' widgets');
            } else {
                count.textContent = 'Empty';
            }

            const insertBtn = document.createElement('button');
            insertBtn.type = 'button';
            insertBtn.className = 'btn-tool btn-tool-icon-only';
            insertBtn.title = 'Insert a blank page below';
            insertBtn.setAttribute('aria-label', 'Insert a blank page below');
            insertBtn.innerHTML = '<i class="ph-bold ph-plus"></i>';

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn-tool btn-tool-icon-only danger';
            deleteBtn.innerHTML = '<i class="ph-bold ph-trash"></i>';
            const canDelete = this._rows.length > 1;
            deleteBtn.disabled = !canDelete;
            deleteBtn.title = canDelete ? 'Delete this page' : 'A dashboard keeps at least one page.';
            deleteBtn.setAttribute('aria-label', deleteBtn.title);

            const self = this;
            insertBtn.addEventListener('click', function () {
                self._rows.splice(index + 1, 0, {
                    uid: self._uid++,
                    origin: null,
                    name: '',
                    autoLabel: 'New page',
                    widgetCount: 0,
                    occupied: false,
                    settings: {}
                });
                self._paint();
            });
            deleteBtn.addEventListener('click', function () {
                void self._deleteRow(row);
            });

            el.appendChild(handle);
            el.appendChild(badge);
            el.appendChild(name);
            el.appendChild(count);
            el.appendChild(insertBtn);
            el.appendChild(deleteBtn);
            return el;
        },

        _deleteRow: async function (row) {
            if (this._rows.length <= 1) return;
            const at = this._rows.indexOf(row);
            if (at < 0) return;
            if (row.origin != null) {
                const report = this._deletionReport(row.origin);
                const affected = report.remove.length + report.alter.length + report.keep.length;
                if (affected) {
                    const ok = await this._askDelete(report);
                    if (ok !== true) return;
                    if (this._rows.indexOf(row) < 0) return;
                }
            }
            const idx = this._rows.indexOf(row);
            if (idx < 0) return;
            this._rows.splice(idx, 1);
            this._paint();
        },

        _widgetTitle: function (id) {
            const w = Dashboard.widgets && Dashboard.widgets[id];
            const name = w && w.overrides && w.overrides.metaName ? String(w.overrides.metaName).trim() : '';
            return name || id;
        },

        _placement: function (id) {
            const dash = Dashboard;
            const w = dash.widgets && dash.widgets[id];
            if (!w) return null;
            const group = (typeof dash.getGroupPageOverrideForWidget === 'function')
                ? dash.getGroupPageOverrideForWidget(id)
                : '';
            if (group) return { spec: String(group), topic: false };
            const b = w.bindings;
            const topic = !!(b && typeof b.page === 'string' && b.page.trim());
            const pageVal = w.overrides ? w.overrides.page : null;
            // A blank spec means every page. A missing spec means page 1.
            const raw = (pageVal == null) ? '1' : String(pageVal).trim();
            if (topic && typeof dash.resolveEffectivePageForWidgetId === 'function') {
                const live = dash.resolveEffectivePageForWidgetId(id, raw || '1');
                return { spec: String(live || raw || '1'), topic: true };
            }
            return { spec: raw, topic: false };
        },

        /** Origins removed by the current draft. `extraOrigin` is included before its row is dropped. */
        _dropSet: function (extraOrigin) {
            const keep = Object.create(null);
            this._rows.forEach(function (row) {
                if (row.origin != null) keep[row.origin] = true;
            });
            if (extraOrigin != null) delete keep[extraOrigin];
            const drop = Object.create(null);
            for (let n = 1; n <= this._oldCount; n++) {
                if (!keep[n]) drop[n] = true;
            }
            return drop;
        },

        /**
         * Page spec after the given page numbers are removed, without renumbering the rest.
         * Returns null when nothing of this spec would remain.
         */
        _specDropping: function (spec, dropSet) {
            const text = String(spec == null ? '' : spec).trim();
            if (!text || typeof WidgetPageSpec === 'undefined') return text;
            const keys = Object.keys(dropSet || {});
            if (!keys.length) return text;
            let hit = false;
            let survivor = false;
            if (typeof WidgetPageSpec.forEachListedPage === 'function') {
                WidgetPageSpec.forEachListedPage(text, function (n) {
                    if (dropSet[n]) hit = true;
                    else survivor = true;
                });
            }
            const wide = typeof WidgetPageSpec.hasWideRange === 'function' && WidgetPageSpec.hasWideRange(text);
            if (wide && typeof WidgetPageSpec.coversPage === 'function') {
                for (let i = 0; i < keys.length; i++) {
                    const n = parseInt(keys[i], 10);
                    if (WidgetPageSpec.coversPage(text, n)) {
                        hit = true;
                        survivor = true;
                        break;
                    }
                }
            }
            if (!hit) return text;
            if (!survivor && !wide) return null;
            let oldEnd = 1;
            for (let i = 0; i < keys.length; i++) {
                const n = parseInt(keys[i], 10);
                if (n > oldEnd) oldEnd = n;
            }
            return WidgetPageSpec.remap(text, function (n) {
                return dropSet[n] ? null : n;
            }, oldEnd, 0);
        },

        _specHitsPage: function (spec, pageNum) {
            const text = String(spec == null ? '' : spec).trim();
            const page = parseInt(pageNum, 10);
            if (!text || !Number.isFinite(page) || typeof WidgetPageSpec === 'undefined') return false;
            if (typeof WidgetPageSpec.listedCovers === 'function' && WidgetPageSpec.listedCovers(text, page)) return true;
            if (typeof WidgetPageSpec.hasWideRange === 'function' && WidgetPageSpec.hasWideRange(text)
                && typeof WidgetPageSpec.coversPage === 'function' && WidgetPageSpec.coversPage(text, page)) return true;
            return false;
        },

        _deletionReport: function (origin) {
            const prior = this._dropSet(null);
            const next = this._dropSet(origin);
            const report = { remove: [], alter: [], keep: [] };
            const self = this;
            Object.keys(Dashboard.widgets || {}).forEach(function (id) {
                const place = self._placement(id);
                if (!place || !place.spec) return;
                const before = self._specDropping(place.spec, prior);
                if (before == null) return;
                if (!self._specHitsPage(before, origin)) return;
                const title = self._widgetTitle(id);
                if (place.topic) {
                    report.keep.push({ title: title, line: title + ': stays because its page comes from a topic' });
                    return;
                }
                const after = self._specDropping(place.spec, next);
                if (after == null) {
                    report.remove.push({ title: title, line: title });
                    return;
                }
                if (after !== before) {
                    report.alter.push({ title: title, line: title + ': ' + before + ' becomes ' + after });
                }
            });
            const byTitle = function (a, b) { return a.title.localeCompare(b.title); };
            report.remove.sort(byTitle);
            report.alter.sort(byTitle);
            report.keep.sort(byTitle);
            return report;
        },

        _askDelete: function (report) {
            if (typeof CustomDialog === 'undefined' || typeof CustomDialog.form !== 'function') {
                return Promise.resolve(false);
            }
            const parts = [];
            if (report.remove.length) parts.push('Widgets that live only on this page will be deleted.');
            if (report.alter.length) parts.push('Widgets that also use other pages will keep those pages.');
            if (report.keep.length) parts.push('Widgets whose page comes from a topic will stay.');
            parts.push('Nothing changes until you press Apply.');
            return CustomDialog.form(
                parts.join(' '),
                'Delete Page',
                {
                    okLabel: 'Delete Page',
                    cancelLabel: 'Cancel',
                    buildExtras: function (extras) {
                        function addSection(heading, items) {
                            if (!items.length) return;
                            const head = document.createElement('div');
                            head.className = 'pm-delete-head';
                            head.textContent = heading;
                            const list = document.createElement('div');
                            list.className = 'pm-relink-list';
                            items.forEach(function (item) {
                                const row = document.createElement('div');
                                row.className = 'pm-relink-row';
                                row.textContent = item.line;
                                list.appendChild(row);
                            });
                            extras.appendChild(head);
                            extras.appendChild(list);
                        }
                        addSection('Removed', report.remove);
                        addSection('Page list changed', report.alter);
                        addSection('Left in place', report.keep);
                    },
                    collect: function () { return true; }
                }
            ).then(function (result) {
                return result === true;
            });
        },

        _widgetsRemovedByPlan: function (plan) {
            const drop = Object.create(null);
            for (let n = 1; n <= plan.oldCount; n++) {
                if (!plan.seen[n]) drop[n] = true;
            }
            if (!Object.keys(drop).length) return [];
            const ids = [];
            const self = this;
            Object.keys(Dashboard.widgets || {}).forEach(function (id) {
                const place = self._placement(id);
                if (!place || place.topic || !place.spec) return;
                if (self._specDropping(place.spec, drop) == null) ids.push(id);
            });
            return ids;
        },

        _structureChanged: function () {
            if (this._rows.length !== this._oldCount) return true;
            for (let i = 0; i < this._rows.length; i++) {
                if (this._rows[i].origin !== i + 1) return true;
            }
            return false;
        },

        _treeFromRows: function (rows) {
            const raw = {};
            rows.forEach(function (row, i) {
                const num = i + 1;
                const rec = PageManager._settingsWithoutName(row.settings);
                const name = String(row.name || '').trim();
                const auto = String(row.autoLabel || '').trim();
                if (name && name !== auto) rec.name = name;
                raw[String(num)] = rec;
            });
            return Dashboard._normalizePagesTree(raw);
        },

        _mapForRows: function (rows, oldCount) {
            const oldToNew = Object.create(null);
            const seen = Object.create(null);
            rows.forEach(function (row, i) {
                if (row.origin == null) return;
                oldToNew[row.origin] = i + 1;
                seen[row.origin] = true;
            });
            const delta = rows.length - oldCount;
            function mapPage(n) {
                const v = parseInt(n, 10);
                if (!Number.isFinite(v) || v <= 0) return null;
                if (oldToNew[v] != null) return oldToNew[v];
                if (v > oldCount) return v + delta;
                return null;
            }
            return { mapPage: mapPage, delta: delta, oldCount: oldCount, seen: seen };
        },

        _apply: async function () {
            if (this._applying) return;
            const dash = Dashboard;
            const rows = this._rows;
            const nextTree = this._treeFromRows(rows);
            const moved = this._structureChanged();
            const renamed = !dash._isEqualJson(this._beforePages, nextTree);
            if (!moved && !renamed) {
                this.close();
                return;
            }

            const plan = this._mapForRows(rows, this._oldCount);
            let relink = false;
            if (moved) {
                const influences = this._collectInfluences(plan, rows);
                if (influences.length) {
                    relink = await this._askRelink(influences);
                    if (relink == null) return;
                }
            }

            this._applying = true;
            const applyBtn = document.getElementById('pm-apply');
            if (applyBtn) applyBtn.disabled = true;
            try {
                this._commitArrangement(rows, plan, nextTree, relink === true);
            } finally {
                this._applying = false;
                if (applyBtn) applyBtn.disabled = false;
            }
            this.close();
        },

        _collectInfluences: function (plan, rows) {
            const items = [];
            const self = this;
            Dashboard._eachStoredPageTarget(function (pageNum, desc) {
                const mapped = plan.mapPage(pageNum);
                if (mapped === pageNum) return;
                items.push({
                    title: desc.name ? (desc.name + ', ' + desc.detail) : desc.detail,
                    from: pageNum,
                    to: mapped,
                    removed: mapped == null,
                    identityName: self._identityName(rows, pageNum)
                });
            });
            const ignore = MASTER_SETTINGS && typeof MASTER_SETTINGS.swipeIgnorePages === 'string'
                ? MASTER_SETTINGS.swipeIgnorePages
                : '';
            if (ignore.trim() && typeof WidgetPageSpec !== 'undefined' && typeof WidgetPageSpec.remap === 'function') {
                const next = WidgetPageSpec.remap(ignore, plan.mapPage, plan.oldCount, plan.delta);
                if (next !== String(ignore)) {
                    items.push({
                        title: 'Swipe ignored pages',
                        specFrom: String(ignore),
                        specTo: next,
                        spec: true
                    });
                }
            }
            return items;
        },

        _identityName: function (rows, origin) {
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].origin !== origin) continue;
                const typed = String(rows[i].name || '').trim();
                const auto = String(rows[i].autoLabel || '').trim();
                if (typed && typed !== auto) return typed;
                return auto || ('Page ' + rows[i].origin);
            }
            return '';
        },

        _askRelink: function (items) {
            if (typeof CustomDialog === 'undefined' || typeof CustomDialog.form !== 'function') {
                return Promise.resolve(false);
            }
            const lines = items.map(function (item) {
                if (item.spec) {
                    return item.title + ': ' + item.specFrom + ' becomes ' + item.specTo;
                }
                if (item.removed) {
                    return item.title + ': page ' + item.from + ' was removed. Relink sends it to page 1.';
                }
                const fromLabel = Dashboard._pageDisplayName(item.from);
                const toLabel = item.identityName || Dashboard._pageDisplayName(item.to);
                return item.title + ': page ' + item.from + ' (' + fromLabel + ') moves to page ' + item.to + ' (' + toLabel + ')';
            });
            return CustomDialog.form(
                'These controls open a page by number. The pages moved, so those numbers now open different pages. Relink them so each control still opens the same page?',
                'Relink Page Targets',
                {
                    okLabel: 'Relink',
                    cancelLabel: 'Keep Numbers',
                    buildExtras: function (extras) {
                        const list = document.createElement('div');
                        list.className = 'pm-relink-list';
                        lines.forEach(function (line) {
                            const row = document.createElement('div');
                            row.className = 'pm-relink-row';
                            row.textContent = line;
                            list.appendChild(row);
                        });
                        extras.appendChild(list);
                    },
                    collect: function () { return true; }
                }
            ).then(function (result) {
                if (result === true) return true;
                return false;
            });
        },

        _commitArrangement: function (rows, plan, nextTree, relink) {
            const dash = Dashboard;
            const mapPage = plan.mapPage;
            dash.beginHistoryAction('Arrange Pages');

            const removed = this._widgetsRemovedByPlan(plan);
            if (removed.length) {
                const beforeSelection = dash._captureSelectionState();
                const beforeGroups = dash._cloneJson(dash.groups || {});
                const beforeWidgets = removed.map(function (id) { return dash._serializeWidgetById(id); }).filter(Boolean);
                removed.forEach(function (id) { dash._deleteWidgetById(id); });
                dash.cleanupInvalidGroups();
                dash.selectWidget(null);
                dash._recordHistoryEntry({
                    kind: 'widgets-delete-restore',
                    beforeWidgets: beforeWidgets,
                    afterWidgets: [],
                    beforeDeletedIds: removed,
                    afterDeletedIds: removed.slice(),
                    beforeGroups: beforeGroups,
                    afterGroups: dash._cloneJson(dash.groups || {}),
                    beforeSelection: beforeSelection,
                    afterSelection: dash._captureSelectionState()
                });
                if (typeof dash.loadFonts === 'function') dash.loadFonts();
            }

            Object.keys(dash.widgets || {}).forEach(function (id) {
                const w = dash.widgets[id];
                if (!w || !w.overrides) return;
                const patch = PageManager._arrangementPatch(w.overrides, mapPage, plan.oldCount, plan.delta, relink);
                if (Object.keys(patch).length) dash.updateWidget(id, patch, false);
            });

            Object.keys(dash.groups || {}).forEach(function (gid) {
                const g = dash.groups[gid];
                if (!g || g.overridePage == null || String(g.overridePage).trim() === '') return;
                const next = WidgetPageSpec.remap(String(g.overridePage), mapPage, plan.oldCount, plan.delta);
                if (next !== String(g.overridePage)) dash.setGroupOverridePage(gid, next);
            });

            const gpatch = {};
            const cur = Math.max(1, parseInt(MASTER_SETTINGS.currentPage, 10) || 1);
            let nextCur = mapPage(cur);
            if (nextCur == null) nextCur = Math.max(1, Math.min(cur, rows.length));
            if (nextCur !== cur) gpatch.currentPage = nextCur;
            if (relink) this._shiftMasterLinks(gpatch, function (raw) {
                return WidgetPageSpec.remap(String(raw), mapPage, plan.oldCount, plan.delta);
            }, function (n) {
                const v = parseInt(n, 10);
                if (!Number.isFinite(v) || v <= 0) return null;
                const mapped = mapPage(v);
                return mapped == null ? 1 : mapped;
            });
            if (Object.keys(gpatch).length) dash.updateGlobal(gpatch);

            const beforePages = dash._cloneJson(dash.pages || {});
            if (!dash._isEqualJson(beforePages, nextTree)) {
                dash.pages = nextTree;
                dash._recordHistoryEntry({
                    kind: 'dashboard-pages',
                    before: beforePages,
                    after: dash._cloneJson(nextTree)
                });
            }

            dash.commitHistoryAction();
            dash.selectWidget(null);
            dash.markUnsaved();
            dash._refreshEditorPageIndicator();
            if (typeof Editor !== 'undefined' && typeof Editor.refreshDropdown === 'function') {
                Editor.refreshDropdown(dash.widgets);
            }
            if (typeof dash.refreshAllGroupsVisibility === 'function') dash.refreshAllGroupsVisibility();
        },

        _shiftOverridePatch: function (ov, specShift, numShift, relink) {
            const patch = {};
            const had = ov.page != null && String(ov.page) !== '' ? String(ov.page) : null;
            const source = had == null ? '1' : had;
            const nextPage = specShift(source);
            if (nextPage !== source) patch.page = nextPage;

            if (relink && ov.actionType === 'page') {
                const n = parseInt(ov.pageTo, 10);
                const dest = numShift(n);
                if (dest != null && dest !== n) patch.pageTo = dest;
            }
            if (relink && Array.isArray(ov.menuItems)) {
                let changed = false;
                const items = ov.menuItems.map(function (item) {
                    if (!item || item.actionType !== 'page') return item;
                    const n = parseInt(item.pageTo, 10);
                    const dest = numShift(n);
                    if (dest == null || dest === n) return item;
                    changed = true;
                    const copy = Object.assign({}, item);
                    copy.pageTo = dest;
                    return copy;
                });
                if (changed) patch.menuItems = items;
            }
            if (relink && Array.isArray(ov.lightsData)) {
                let changed = false;
                const lights = ov.lightsData.map(function (light) {
                    if (!light) return light;
                    const sa = light.switchAction;
                    if (String(light.outputMode || 'light') !== 'switch' || !sa || sa.actionType !== 'page') return light;
                    const n = parseInt(sa.pageTo, 10);
                    const dest = numShift(n);
                    if (dest == null || dest === n) return light;
                    changed = true;
                    const copy = Object.assign({}, light);
                    copy.switchAction = Object.assign({}, sa, { pageTo: dest });
                    return copy;
                });
                if (changed) patch.lightsData = lights;
            }
            return patch;
        },

        _arrangementPatch: function (ov, mapPage, oldCount, delta, relink) {
            const specShift = function (raw) {
                return WidgetPageSpec.remap(String(raw), mapPage, oldCount, delta);
            };
            const numShift = function (n) {
                const v = parseInt(n, 10);
                if (!Number.isFinite(v) || v <= 0) return null;
                const mapped = mapPage(v);
                return mapped == null ? 1 : mapped;
            };
            return this._shiftOverridePatch(ov, specShift, numShift, relink);
        },

        _shiftMasterLinks: function (gpatch, specShift, numShift) {
            if (!MASTER_SETTINGS) return;
            const keys = ['inactivityReturnPage', 'swipeLeftPage', 'swipeRightPage', 'swipeUpPage', 'swipeDownPage'];
            keys.forEach(function (key) {
                if (MASTER_SETTINGS[key] == null || MASTER_SETTINGS[key] === '') return;
                const n = parseInt(MASTER_SETTINGS[key], 10);
                const dest = numShift(n);
                if (dest != null && dest !== n) gpatch[key] = dest;
            });
            if (typeof MASTER_SETTINGS.swipeIgnorePages === 'string' && MASTER_SETTINGS.swipeIgnorePages.trim()) {
                const next = specShift(MASTER_SETTINGS.swipeIgnorePages);
                if (next !== String(MASTER_SETTINGS.swipeIgnorePages)) gpatch.swipeIgnorePages = next;
            }
        }
    };

    global.PageManager = PageManager;
})(typeof window !== 'undefined' ? window : this);
