/**
 * Tools script: Make All Dynamic Values Fixed (lazy-loaded via tools-catalog).
 *
 * Walks widget bindings, group bindings, and dashboard (global) bindings.
 * Each topic link is removed. When that topic has a live value, the setting
 * is set to that value (after the binding's payload formula or value map).
 * Color correction stays on the setting, so it is not baked in.
 * The whole run is one undo step.
 */
(function () {
    const MENU_PROPS = [
        'mode', 'label', 'actionType', 'state', 'outputTopic', 'onPayload', 'offPayload',
        'pageTo', 'urlTo', 'urlNewTab', 'selectionGroup', 'sendOffOnGroupDeselect',
        'iconSourceOn', 'iconOn', 'iconWeightOn', 'imgOn', 'colorizeOn',
        'iconSourceOff', 'iconOff', 'iconWeightOff', 'imgOff', 'colorizeOff',
        'iconColOnOverrideEn', 'iconColOnOverride', 'iconColOffOverrideEn', 'iconColOffOverride',
        'iconSlotAccentOn', 'iconSlotOffsetXOn', 'iconSlotOffsetYOn', 'iconSlotRotationOn', 'iconSize',
        'iconSlotAccentOff', 'iconSlotOffsetXOff', 'iconSlotOffsetYOff', 'iconSlotRotationOff', 'iconSlotSizeOff'
    ];

    const LIGHT_PROPS = [
        'name', 'outputMode', 'state', 'actionType', 'onPayload', 'offPayload',
        'pageTo', 'urlTo', 'urlNewTab',
        'iconSourceOn', 'iconOn', 'iconWeightOn', 'imgOn', 'colorizeOn', 'iconSlotAccentOn',
        'iconSlotOffsetXOn', 'iconSlotOffsetYOn', 'iconSlotRotationOn', 'iconSize'
    ];

    const TRANSFORM_SUFFIXES = ['_bind_formula', '_bind_mapTrue', '_bind_mapFalse', '_bind_transformMode'];

    function pathKey(path) {
        return path.join('\0');
    }

    function cloneJson(value) {
        if (value === null || value === undefined) return value;
        return JSON.parse(JSON.stringify(value));
    }

    function collectLeaves(node, path, out) {
        if (typeof node === 'string') {
            out.push({ path: path.slice(), topic: node });
            return;
        }
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
                path.push(i);
                collectLeaves(node[i], path, out);
                path.pop();
            }
            return;
        }
        const keys = Object.keys(node);
        for (let i = 0; i < keys.length; i++) {
            path.push(keys[i]);
            collectLeaves(node[keys[i]], path, out);
            path.pop();
        }
    }

    function isInternalBinding(path) {
        return path.length === 1 && String(path[0]).indexOf('__') === 0;
    }

    function getDeep(root, path) {
        let cur = root;
        for (let i = 0; i < path.length; i++) {
            if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
            cur = cur[path[i]];
        }
        return cur;
    }

    function setDeep(root, path, value) {
        if (!root || !path || !path.length) return;
        let cur = root;
        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            const next = path[i + 1];
            const nextIsIndex = typeof next === 'number' || (typeof next === 'string' && /^\d+$/.test(String(next)));
            let child = cur[key];
            if (child === null || child === undefined || typeof child !== 'object') {
                child = nextIsIndex ? [] : {};
                cur[key] = child;
            } else if (nextIsIndex && !Array.isArray(child)) {
                child = [];
                cur[key] = child;
            }
            cur = child;
        }
        cur[path[path.length - 1]] = value;
    }

    function indexSchema(widget) {
        const byPath = Object.create(null);
        const checkbox = Object.create(null);
        const empty = { byPath: byPath, checkbox: checkbox };
        if (!widget || typeof widget.getSchema !== 'function') return empty;
        if (typeof Editor === 'undefined' || typeof Editor.bindingPathFromSchemaField !== 'function') return empty;
        let schema = [];
        try {
            schema = widget.getSchema() || [];
        } catch (e) {
            return empty;
        }
        const walk = function (fields) {
            if (!Array.isArray(fields)) return;
            for (let i = 0; i < fields.length; i++) {
                const f = fields[i];
                if (!f) continue;
                if (f.key) {
                    const nested = Editor.bindingPathFromSchemaField(f);
                    if (nested && nested.length) byPath[pathKey(nested)] = f.key;
                    else byPath[String(f.key)] = f.key;
                    if (f.type === 'checkbox') checkbox[f.key] = true;
                }
                if (f.fields) walk(f.fields);
            }
        };
        for (let s = 0; s < schema.length; s++) {
            if (schema[s] && schema[s].fields) walk(schema[s].fields);
        }
        return empty;
    }

    function overlayReverse(widget) {
        const map = Object.create(null);
        const ctor = widget && widget.constructor;
        if (!ctor || typeof ctor.getNestedBindingOverlaySpec !== 'function') return map;
        let spec = [];
        try {
            spec = ctor.getNestedBindingOverlaySpec() || [];
        } catch (e) {
            return map;
        }
        for (let i = 0; i < spec.length; i++) {
            const entry = spec[i];
            if (!entry || !entry.configKey || !entry.path || !entry.path.length) continue;
            map[String(entry.configKey)] = entry.path.slice();
        }
        return map;
    }

    function matchIndexed(path, root, binder, prefix, props) {
        if (!binder || path[0] !== root || path.length < 2) return null;
        const index = path[1];
        const joined = pathKey(path);
        for (let i = 0; i < props.length; i++) {
            const candidate = binder(index, props[i]);
            if (candidate && pathKey(candidate) === joined) return prefix + index + '_' + props[i];
        }
        return null;
    }

    function formulaKeyFor(path, schemaMap) {
        if (path.length === 1) {
            const key = String(path[0]);
            if (schemaMap.byPath[key]) return schemaMap.byPath[key];
            return key;
        }
        const joined = pathKey(path);
        if (schemaMap.byPath[joined]) return schemaMap.byPath[joined];
        if (typeof MenuWidget !== 'undefined' && typeof MenuWidget.menuItemBindingPath === 'function') {
            const menuKey = matchIndexed(path, 'menuItems', MenuWidget.menuItemBindingPath, 'menuItemBind_', MENU_PROPS);
            if (menuKey) return menuKey;
        }
        if (typeof LightGridWidget !== 'undefined' && typeof LightGridWidget.lightItemBindingPath === 'function') {
            const lightKey = matchIndexed(path, 'lightsData', LightGridWidget.lightItemBindingPath, 'lightItemBind_', LIGHT_PROPS);
            if (lightKey) return lightKey;
        }
        return path.join('_');
    }

    function destinationPath(path, flatRedirect) {
        if (!path || !path.length || isInternalBinding(path)) return null;
        if (path.length === 1) {
            const key = String(path[0]);
            const point = key.match(/^customPoints_(\d+)_([XY])$/);
            if (point) return ['customPoints', parseInt(point[1], 10), point[2] === 'X' ? 'x' : 'y'];
            if (flatRedirect[key]) return flatRedirect[key].slice();
        }
        return path.slice();
    }

    function containerRedirectMap() {
        const map = Object.create(null);
        const cmap = (typeof SaveFormatV2 !== 'undefined') ? SaveFormatV2.CONTAINER_FLAT_TO_PATH : null;
        if (!cmap) return map;
        const keys = Object.keys(cmap);
        for (let i = 0; i < keys.length; i++) {
            map[keys[i]] = ['container'].concat(cmap[keys[i]]);
        }
        return map;
    }

    function readLive(topic) {
        if (!topic || typeof Dashboard === 'undefined' || !Dashboard.liveData) return undefined;
        if (Object.prototype.hasOwnProperty.call(Dashboard.liveData, topic)) return Dashboard.liveData[topic];
        const trimmed = String(topic).trim();
        if (trimmed && trimmed !== topic && Object.prototype.hasOwnProperty.call(Dashboard.liveData, trimmed)) {
            return Dashboard.liveData[trimmed];
        }
        return undefined;
    }

    function transformActive(widget, formulaKey) {
        const overrides = (widget && widget.overrides) || {};
        const master = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS) ? MASTER_SETTINGS : {};
        for (let i = 0; i < TRANSFORM_SUFFIXES.length; i++) {
            const key = formulaKey + TRANSFORM_SUFFIXES[i];
            const local = overrides[key];
            if (local !== undefined && local !== null && String(local).trim() !== '') return true;
            const globalVal = master[key];
            if (globalVal !== undefined && globalVal !== null && String(globalVal).trim() !== '') return true;
        }
        return false;
    }

    function neutralizeTransforms(overrides, formulaKey) {
        for (let i = 0; i < TRANSFORM_SUFFIXES.length; i++) {
            overrides[formulaKey + TRANSFORM_SUFFIXES[i]] = '';
        }
    }

    function pathExpectsBoolean(path, formulaKey, checkboxMap, sample) {
        if (typeof sample === 'boolean') return true;
        if (checkboxMap && checkboxMap[formulaKey]) return true;
        const tail = String(path[path.length - 1] || '');
        if (tail === 'state' || tail === 'visible' || tail === 'locked' || tail === 'urlNewTab'
                || tail === 'tintImage' || tail === 'enabled' || tail === 'filled') return true;
        if (formulaKey === 'colorizeOn' || formulaKey === 'colorizeOff' || formulaKey === 'sendOffOnGroupDeselect') return true;
        if (/OverrideEn$/.test(formulaKey)) return true;
        return false;
    }

    function coerceLiveValue(widget, formulaKey, sample, live, forceNumber, forceBool) {
        let value = live;
        if (value !== null && typeof value === 'object') {
            value = cloneJson(value);
        }
        if (widget && typeof widget._applyPayloadTransformsForFormula === 'function') {
            value = widget._applyPayloadTransformsForFormula(formulaKey, value, 0, {});
        }
        if (forceNumber) {
            const n = parseFloat(value);
            if (!isNaN(n)) return n;
        }
        const expectsBool = forceBool
            || (typeof BaseWidget !== 'undefined'
                && BaseWidget._bindingValueExpectsBoolean(widget, formulaKey, sample));
        if (expectsBool && typeof BaseWidget !== 'undefined' && BaseWidget.coerceBindingBoolean) {
            return BaseWidget.coerceBindingBoolean(value);
        }
        if (typeof sample === 'number') {
            const n = (typeof value === 'number') ? value : Number(String(value).trim());
            if (Number.isFinite(n)) return n;
        }
        return value;
    }

    function isPointBinding(path) {
        return path.length === 1 && /^customPoints_\d+_[XY]$/.test(String(path[0]));
    }

    function isVacantBinding(node) {
        if (node === null || node === undefined) return true;
        if (typeof node !== 'object') return false;
        if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
                if (!isVacantBinding(node[i])) return false;
            }
            return true;
        }
        const keys = Object.keys(node);
        for (let i = 0; i < keys.length; i++) {
            if (!isVacantBinding(node[keys[i]])) return false;
        }
        return true;
    }

    function pruneEmptyBindings(node) {
        if (!node || typeof node !== 'object') return node;
        if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
                if (node[i] && typeof node[i] === 'object') {
                    const next = pruneEmptyBindings(node[i]);
                    if (next === undefined) delete node[i];
                    else node[i] = next;
                }
                if (isVacantBinding(node[i])) delete node[i];
            }
            return isVacantBinding(node) ? undefined : node;
        }
        const keys = Object.keys(node);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (node[key] && typeof node[key] === 'object') {
                const next = pruneEmptyBindings(node[key]);
                if (next === undefined) delete node[key];
                else node[key] = next;
            }
        }
        return isVacantBinding(node) ? undefined : node;
    }

    /**
     * Build the next overrides + bindings for one widget. Does not write them.
     * @returns {{ count: number, overrides: object|null, bindings: object|null }}
     */
    function prepareWidget(widget) {
        const empty = { count: 0, overrides: null, bindings: null };
        if (!widget || !widget.bindings || typeof widget.bindings !== 'object') return empty;
        const leaves = [];
        collectLeaves(widget.bindings, [], leaves);
        const userLeaves = [];
        for (let i = 0; i < leaves.length; i++) {
            if (!isInternalBinding(leaves[i].path)) userLeaves.push(leaves[i]);
        }
        if (!userLeaves.length) return empty;

        const overrides = cloneJson(widget.overrides || {});
        const bindings = cloneJson(widget.bindings || {});
        const schemaMap = indexSchema(widget);
        const redirect = containerRedirectMap();
        const fromOverlay = overlayReverse(widget);
        const overlayKeys = Object.keys(fromOverlay);
        for (let i = 0; i < overlayKeys.length; i++) {
            if (!redirect[overlayKeys[i]]) redirect[overlayKeys[i]] = fromOverlay[overlayKeys[i]];
        }

        for (let i = 0; i < userLeaves.length; i++) {
            const leaf = userLeaves[i];
            const formulaKey = formulaKeyFor(leaf.path, schemaMap);
            const dest = destinationPath(leaf.path, redirect);
            const topic = String(leaf.topic || '').trim();
            const live = topic ? readLive(leaf.topic) : undefined;
            if (dest && live !== undefined) {
                const sample = getDeep(overrides, dest);
                const value = coerceLiveValue(
                    widget,
                    formulaKey,
                    sample,
                    live,
                    isPointBinding(leaf.path),
                    pathExpectsBoolean(leaf.path, formulaKey, schemaMap.checkbox, sample)
                );
                setDeep(overrides, dest, value);
                if (leaf.path.length === 1 && pathKey(dest) !== String(leaf.path[0])) {
                    delete overrides[leaf.path[0]];
                }
                if ((leaf.path[0] === 'menuItems' || leaf.path[0] === 'lightsData')
                        && leaf.path.length >= 3 && leaf.path[leaf.path.length - 1] === 'state') {
                    overrides['item_' + leaf.path[1] + '_state'] = value;
                }
                if (transformActive(widget, formulaKey)) neutralizeTransforms(overrides, formulaKey);
            }
            if (typeof BindingsTree !== 'undefined' && typeof BindingsTree.deleteAtPath === 'function') {
                BindingsTree.deleteAtPath(bindings, leaf.path);
            } else if (leaf.path.length === 1) {
                delete bindings[leaf.path[0]];
            }
        }

        const prunedBindings = pruneEmptyBindings(bindings) || {};

        const sameOverrides = (typeof Dashboard !== 'undefined' && Dashboard._isEqualJson)
            ? Dashboard._isEqualJson(widget.overrides || {}, overrides)
            : JSON.stringify(widget.overrides || {}) === JSON.stringify(overrides);
        const sameBindings = (typeof Dashboard !== 'undefined' && Dashboard._isEqualJson)
            ? Dashboard._isEqualJson(widget.bindings || {}, prunedBindings)
            : JSON.stringify(widget.bindings || {}) === JSON.stringify(prunedBindings);

        return {
            count: userLeaves.length,
            overrides: sameOverrides ? null : overrides,
            bindings: sameBindings ? null : prunedBindings
        };
    }

    function prepareGlobals(globalBindings) {
        const src = globalBindings && typeof globalBindings === 'object' ? globalBindings : {};
        const next = {};
        let count = 0;
        const keys = Object.keys(src);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key === 'editorZoom') {
                next[key] = src[key];
                continue;
            }
            if (typeof src[key] === 'string') {
                count++;
                continue;
            }
            next[key] = src[key];
        }
        return { count: count, bindings: count ? next : null };
    }

    function freezeGroups() {
        if (typeof Dashboard === 'undefined' || !Dashboard.groups) return 0;
        const groups = Dashboard.groups;
        const ids = Object.keys(groups);
        let count = 0;
        const touched = [];
        const before = Dashboard._cloneJson ? Dashboard._cloneJson(groups) : cloneJson(groups);
        const beforeSelection = Dashboard._captureSelectionState ? Dashboard._captureSelectionState() : null;

        for (let i = 0; i < ids.length; i++) {
            const gid = ids[i];
            const group = groups[gid];
            if (!group || !group.bindings || typeof group.bindings !== 'object') continue;
            const b = group.bindings;
            let hit = false;
            if (typeof b.visible === 'string') {
                group.visible = Dashboard.isGroupRuntimeVisible(gid);
                hit = true;
                count++;
            }
            if (typeof b.overridePage === 'string') {
                group.overridePage = Dashboard.getGroupEffectiveOverridePageSpecForGroup(gid);
                hit = true;
                count++;
            }
            if (typeof b.dimBackgroundWhenVisible === 'string') {
                group.dimBackgroundWhenVisible = Dashboard._isGroupDimBackdropEffective(gid);
                hit = true;
                count++;
            }
            if (hit) {
                group.bindings = {};
                touched.push(gid);
            }
        }
        if (!count) return 0;

        const after = Dashboard._cloneJson ? Dashboard._cloneJson(groups) : cloneJson(groups);
        if (typeof Dashboard._recordHistoryEntry === 'function') {
            Dashboard._recordHistoryEntry({
                kind: 'groups',
                beforeGroups: before,
                afterGroups: after,
                beforeSelection: beforeSelection,
                afterSelection: Dashboard._captureSelectionState ? Dashboard._captureSelectionState() : beforeSelection
            });
        }
        if (typeof Dashboard.markUnsaved === 'function') Dashboard.markUnsaved();
        if (typeof Dashboard._syncGroupBackdropOverlays === 'function') Dashboard._syncGroupBackdropOverlays();
        for (let i = 0; i < touched.length; i++) {
            if (typeof Dashboard._applySingleGroupVisibility === 'function') {
                Dashboard._applySingleGroupVisibility(touched[i]);
            }
        }
        if (typeof Dashboard._refreshEditorPageIndicator === 'function') Dashboard._refreshEditorPageIndicator();
        return count;
    }

    function applyWidget(widget) {
        const prepared = prepareWidget(widget);
        if (!prepared.count || typeof Dashboard === 'undefined') return 0;
        if (prepared.overrides) Dashboard.updateWidget(widget.id, prepared.overrides, true);
        if (prepared.bindings) Dashboard.updateWidgetBinding(widget.id, prepared.bindings, true);
        return prepared.count;
    }

    function globalPatchDiffers(mapped) {
        const keys = Object.keys(mapped || {});
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const current = (typeof MASTER_SETTINGS !== 'undefined') ? MASTER_SETTINGS[key] : undefined;
            if (typeof Dashboard !== 'undefined' && typeof Dashboard._isEqualJson === 'function') {
                if (!Dashboard._isEqualJson(current, mapped[key])) return true;
            } else if (JSON.stringify(current) !== JSON.stringify(mapped[key])) {
                return true;
            }
        }
        return false;
    }

    function applyGlobals() {
        if (typeof Dashboard === 'undefined') return 0;
        const src = Dashboard.globalBindings || {};
        const prepared = prepareGlobals(src);
        if (!prepared.count || !prepared.bindings) return 0;
        if (typeof Dashboard._patchFromGlobalBindingKey === 'function') {
            const keys = Object.keys(src);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (key === 'editorZoom' || key === 'theme' || typeof src[key] !== 'string') continue;
                const topic = String(src[key] || '').trim();
                if (!topic) continue;
                const live = readLive(src[key]);
                if (live === undefined) continue;
                const mapped = Dashboard._patchFromGlobalBindingKey(key, live);
                if (!mapped || !globalPatchDiffers(mapped)) continue;
                Dashboard.updateGlobal(mapped, true, false);
            }
        }
        Dashboard.updateGlobalBinding(prepared.bindings, true);
        return prepared.count;
    }

    function nextFrame() {
        return new Promise(function (resolve) {
            if (typeof requestAnimationFrame === 'function') requestAnimationFrame(function () { resolve(); });
            else setTimeout(resolve, 16);
        });
    }

    function countLabel(n, one, many) {
        return n + ' ' + (n === 1 ? one : many);
    }

    function buildDialog() {
        const backdrop = document.createElement('div');
        backdrop.className = 'ds-dialog-backdrop show';
        backdrop.id = 'freeze-dyn-backdrop';

        const panel = document.createElement('div');
        panel.className = 'ds-dialog freeze-dyn-dialog';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-labelledby', 'freeze-dyn-title');

        const header = document.createElement('div');
        header.className = 'ds-dialog-header';
        const title = document.createElement('h3');
        title.className = 'ds-dialog-title';
        title.id = 'freeze-dyn-title';
        const icon = document.createElement('i');
        icon.className = 'ph-bold ph-link-break ds-dialog-title-icon';
        const titleText = document.createElement('span');
        titleText.textContent = 'Make All Dynamic Values Fixed';
        title.appendChild(icon);
        title.appendChild(titleText);
        header.appendChild(title);

        const body = document.createElement('div');
        body.className = 'ds-dialog-body';

        const footer = document.createElement('div');
        footer.className = 'ds-dialog-footer';
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-tool ds-dialog-button primary';
        closeBtn.textContent = 'Close';
        closeBtn.hidden = true;
        footer.appendChild(closeBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        backdrop.appendChild(panel);
        document.body.appendChild(backdrop);

        return { backdrop: backdrop, body: body, closeBtn: closeBtn, panel: panel };
    }

    function renderProgress(body, done, total) {
        body.textContent = '';
        const wrap = document.createElement('div');
        wrap.className = 'freeze-dyn-progress';
        const label = document.createElement('div');
        label.className = 'freeze-dyn-status';
        label.textContent = 'Fixing topic links';
        const track = document.createElement('div');
        track.className = 'freeze-dyn-track';
        track.setAttribute('role', 'progressbar');
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', '100');
        const safeTotal = Math.max(0, total);
        const safeDone = Math.max(0, Math.min(safeTotal, done));
        const pct = safeTotal > 0 ? Math.round((safeDone / safeTotal) * 100) : 0;
        track.setAttribute('aria-valuenow', String(pct));
        const fill = document.createElement('div');
        fill.className = 'freeze-dyn-fill';
        fill.style.width = pct + '%';
        track.appendChild(fill);
        const pctEl = document.createElement('div');
        pctEl.className = 'freeze-dyn-percent';
        pctEl.textContent = pct + '%';
        const detail = document.createElement('div');
        detail.className = 'freeze-dyn-detail';
        detail.textContent = safeTotal > 0 ? (safeDone + ' of ' + safeTotal) : 'Starting';
        wrap.appendChild(label);
        wrap.appendChild(track);
        wrap.appendChild(pctEl);
        wrap.appendChild(detail);
        body.appendChild(wrap);
    }

    function renderSummary(body, stats) {
        body.textContent = '';
        const wrap = document.createElement('div');
        wrap.className = 'freeze-dyn-summary';
        const lead = document.createElement('p');
        lead.className = 'freeze-dyn-lead';
        if (!stats.settings) {
            lead.textContent = 'No topic-linked settings were found.';
            wrap.appendChild(lead);
            body.appendChild(wrap);
            return;
        }

        const bits = [];
        if (stats.widgetSettings) bits.push(countLabel(stats.widgetSettings, 'widget setting', 'widget settings'));
        if (stats.groupSettings) bits.push(countLabel(stats.groupSettings, 'group setting', 'group settings'));
        if (stats.dashboardSettings) bits.push(countLabel(stats.dashboardSettings, 'dashboard setting', 'dashboard settings'));
        lead.textContent = 'Fixed ' + countLabel(stats.settings, 'setting', 'settings')
            + (bits.length ? ' (' + bits.join(', ') + ').' : '.');
        wrap.appendChild(lead);

        const warning = document.createElement('div');
        warning.className = 'freeze-dyn-warning';
        const warnIcon = document.createElement('i');
        warnIcon.className = 'ph-bold ph-warning';
        const warnText = document.createElement('div');
        const line1 = document.createElement('p');
        line1.textContent = 'Saving stores these values as they are now. The topic links that were updating them are removed from the dashboard.';
        const line2 = document.createElement('p');
        line2.textContent = 'Undo puts those topic links back.';
        warnText.appendChild(line1);
        warnText.appendChild(line2);
        warning.appendChild(warnIcon);
        warning.appendChild(warnText);
        wrap.appendChild(warning);
        body.appendChild(wrap);
    }

    async function openFreezeDynamicValues() {
        if (typeof Dashboard === 'undefined' || !Dashboard.widgets) {
            if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                await CustomDialog.alert('No dashboard is loaded.', 'Make All Dynamic Values Fixed');
            }
            return;
        }
        if (document.getElementById('freeze-dyn-backdrop')) return;

        const ui = buildDialog();
        let closed = false;
        const close = function () {
            if (closed) return;
            closed = true;
            document.removeEventListener('keydown', onKey);
            if (ui.backdrop.parentNode) ui.backdrop.parentNode.removeChild(ui.backdrop);
        };
        const onKey = function (e) {
            if (e.key === 'Escape' && !ui.closeBtn.hidden) close();
        };
        document.addEventListener('keydown', onKey);
        ui.closeBtn.addEventListener('click', close);
        ui.backdrop.addEventListener('click', function (e) {
            if (e.target === ui.backdrop && !ui.closeBtn.hidden) close();
        });

        const widgetIds = Object.keys(Dashboard.widgets);
        const globalPrepared = prepareGlobals(Dashboard.globalBindings);
        const groupIds = Object.keys(Dashboard.groups || {});
        let groupJobs = 0;
        for (let i = 0; i < groupIds.length; i++) {
            const g = Dashboard.groups[groupIds[i]];
            if (!g || !g.bindings) continue;
            const b = g.bindings;
            if (typeof b.visible === 'string' || typeof b.overridePage === 'string' || typeof b.dimBackgroundWhenVisible === 'string') {
                groupJobs = 1;
                break;
            }
        }
        const jobs = [];
        for (let i = 0; i < widgetIds.length; i++) {
            const id = widgetIds[i];
            const widget = Dashboard.widgets[id];
            if (!widget) continue;
            const leaves = [];
            collectLeaves(widget.bindings || {}, [], leaves);
            let hasUser = false;
            for (let j = 0; j < leaves.length; j++) {
                if (!isInternalBinding(leaves[j].path)) {
                    hasUser = true;
                    break;
                }
            }
            if (!hasUser) continue;
            jobs.push(function () {
                const w = Dashboard.widgets[id];
                if (!w) return { settings: 0, widgetSettings: 0, groupSettings: 0, dashboardSettings: 0 };
                const n = applyWidget(w);
                return { settings: n, widgetSettings: n, groupSettings: 0, dashboardSettings: 0 };
            });
        }
        if (globalPrepared.count) {
            jobs.push(function () {
                const n = applyGlobals();
                return { settings: n, widgetSettings: 0, groupSettings: 0, dashboardSettings: n };
            });
        }
        if (groupJobs) {
            jobs.push(function () {
                const n = freezeGroups();
                return { settings: n, widgetSettings: 0, groupSettings: n, dashboardSettings: 0 };
            });
        }

        const stats = { settings: 0, widgetSettings: 0, groupSettings: 0, dashboardSettings: 0 };
        renderProgress(ui.body, 0, jobs.length);
        await nextFrame();

        if (typeof Editor !== 'undefined' && typeof Editor.flushPendingTextPreview === 'function') {
            Editor.flushPendingTextPreview();
        }

        let failed = null;
        if (jobs.length && typeof Dashboard.beginHistoryAction === 'function') {
            Dashboard.beginHistoryAction('Make all dynamic values fixed');
        }
        try {
            for (let i = 0; i < jobs.length; i++) {
                const part = jobs[i]() || {};
                stats.settings += part.settings || 0;
                stats.widgetSettings += part.widgetSettings || 0;
                stats.groupSettings += part.groupSettings || 0;
                stats.dashboardSettings += part.dashboardSettings || 0;
                renderProgress(ui.body, i + 1, jobs.length);
                await nextFrame();
            }
        } catch (err) {
            failed = err;
        } finally {
            if (typeof Dashboard.commitHistoryAction === 'function') Dashboard.commitHistoryAction();
        }

        try {
            if (typeof Editor !== 'undefined' && Editor.currentId && typeof Editor.loadWidget === 'function') {
                Editor.loadWidget(Editor.currentId);
            }
        } catch (err) {
            if (!failed) failed = err;
        }

        if (closed) return;
        if (failed) {
            ui.body.textContent = '';
            const wrap = document.createElement('div');
            wrap.className = 'freeze-dyn-summary';
            const lead = document.createElement('p');
            lead.className = 'freeze-dyn-lead';
            lead.textContent = 'Stopped early. ' + (failed && failed.message ? failed.message : 'The tool could not finish.');
            wrap.appendChild(lead);
            ui.body.appendChild(wrap);
        } else {
            renderSummary(ui.body, stats);
        }
        ui.closeBtn.hidden = false;
        ui.closeBtn.focus();
    }

    window.FreezeDynamicValues = {
        open: openFreezeDynamicValues,
        prepareWidget: prepareWidget,
        prepareGlobals: prepareGlobals
    };

    if (typeof ToolsRegistry !== 'undefined') {
        ToolsRegistry.register({
            id: 'freeze-dynamic-values',
            label: 'Make All Dynamic Values Fixed',
            icon: 'ph-link-break',
            script: 'scripts/freeze-dynamic-values.js',
            run: function () {
                if (typeof FreezeDynamicValues === 'undefined' || typeof FreezeDynamicValues.open !== 'function') {
                    throw new Error('Make All Dynamic Values Fixed failed to load');
                }
                return FreezeDynamicValues.open();
            }
        });
    }
})();
