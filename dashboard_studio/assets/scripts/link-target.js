/**
 * Tools script: bulk link target (lazy-loaded via tools-catalog).
 *
 * One Tools menu item opens a dialog: New Tab or Same Tab, plus a type tree of
 * widgets that have configurable URL / markdown links (all checked by default).
 * Type rows reuse the Widget Preset Picker checkbox/twisty markup (wpp-*).
 *
 *  - Switch / Button (mode url) and Edit box (Open URL): flat `overrides.urlNewTab`.
 *  - Menu: per row `overrides.menuItems[i].urlNewTab`.
 *  - Light grid: per light `overrides.lightsData[i].switchAction.urlNewTab`.
 *  - Text widget: markdown link destinations use a trailing ` ^` marker for new tab
 *    (see TextWidget._preprocessMarkdownNewTabLinks). We add or strip that marker on
 *    every inline `[label](url)` link (images are left untouched), and set `mdLinkTarget`.
 *
 * Changes go through Dashboard.updateWidget so each affected widget records one undo
 * history entry, re-renders, and marks the dashboard unsaved.
 */
(function () {
    function widgetType(widget) {
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._getWidgetTypeByInstance === 'function') {
            return Dashboard._getWidgetTypeByInstance(widget);
        }
        const reg = (typeof WidgetRegistry !== 'undefined') ? WidgetRegistry.widgets : null;
        if (!reg) return null;
        const keys = Object.keys(reg);
        for (let i = 0; i < keys.length; i++) {
            if (widget instanceof reg[keys[i]]) return keys[i];
        }
        return null;
    }

    function deepClone(value) {
        if (value === null || value === undefined) return value;
        return JSON.parse(JSON.stringify(value));
    }

    function overrideChanged(widget, key, newValue) {
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._isEqualJson === 'function') {
            return !Dashboard._isEqualJson(widget.overrides[key], newValue);
        }
        return JSON.stringify(widget.overrides[key]) !== JSON.stringify(newValue);
    }

    // Toggle the trailing ` ^` marker on every inline markdown link (not images).
    // Reuses TextWidget's bracket/paren scanners so edge cases match the renderer.
    function transformMarkdownLinks(md, wantNewTab) {
        if (typeof TextWidget === 'undefined') return { text: md, changed: 0 };
        const s = String(md == null ? '' : md);
        if (!s.length) return { text: md, changed: 0 };

        let pos = 0;
        let out = '';
        let changed = 0;
        while (pos < s.length) {
            const linkCloseBracket = s.indexOf('](', pos);
            if (linkCloseBracket < 0) {
                out += s.slice(pos);
                break;
            }
            const labelOpen = TextWidget._findMarkdownLinkLabelOpenBracket(s, linkCloseBracket);
            if (labelOpen < 0) {
                out += s.slice(pos, linkCloseBracket + 2);
                pos = linkCloseBracket + 2;
                continue;
            }
            const isImage = labelOpen > 0 && s.charAt(labelOpen - 1) === '!';
            if (isImage) {
                out += s.slice(pos, linkCloseBracket + 2);
                pos = linkCloseBracket + 2;
                continue;
            }
            const destStart = linkCloseBracket + 2;
            const destClose = TextWidget._findMarkdownInlineLinkCloseParen(s, destStart);
            if (destClose < 0) {
                out += s.slice(pos, linkCloseBracket + 2);
                pos = linkCloseBracket + 2;
                continue;
            }
            const rawDest = s.slice(destStart, destClose);
            const tail = rawDest.match(/\s*\^[\s\u00a0]*$/);
            const hasMarker = !!tail;
            let newDest = rawDest;

            if (wantNewTab) {
                if (!hasMarker) {
                    const core = rawDest.replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, '');
                    if (core.length) {
                        newDest = core + ' ^';
                        changed++;
                    }
                }
            } else if (hasMarker) {
                const core = rawDest.slice(0, rawDest.length - tail[0].length).replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, '');
                if (core.length) {
                    newDest = core;
                    changed++;
                }
            }

            out += s.slice(pos, destStart) + newDest + s.slice(destClose);
            pos = destClose + 1;
        }
        return { text: out, changed: changed };
    }

    function applyLinkTarget(wantNewTab, widgetIds) {
        if (typeof Dashboard === 'undefined' || !Dashboard.widgets) {
            if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                CustomDialog.alert('No dashboard is loaded.', 'Tools');
            }
            return;
        }
        if (typeof Editor !== 'undefined' && typeof Editor.flushPendingTextPreview === 'function') {
            Editor.flushPendingTextPreview();
        }

        const allowed = (widgetIds && typeof widgetIds.has === 'function') ? widgetIds : null;
        let widgetsChanged = 0;
        let linksChanged = 0;
        const ids = Object.keys(Dashboard.widgets);

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            if (allowed && !allowed.has(id)) continue;
            const w = Dashboard.widgets[id];
            if (!w || !w.overrides) continue;
            const type = widgetType(w);
            if (!type) continue;

            let patch = null;
            let localLinks = 0;

            if (type === 'switch' || type === 'editbox') {
                const cur = w.overrides.urlNewTab === true;
                if (cur !== wantNewTab) {
                    patch = { urlNewTab: wantNewTab };
                    localLinks = 1;
                }
            } else if (type === 'menu') {
                const items = w.overrides.menuItems;
                if (Array.isArray(items) && items.length) {
                    const clone = deepClone(items);
                    for (let j = 0; j < clone.length; j++) {
                        if (!clone[j]) continue;
                        const cur = clone[j].urlNewTab === true;
                        if (cur !== wantNewTab) {
                            clone[j].urlNewTab = wantNewTab;
                            localLinks++;
                        }
                    }
                    if (localLinks > 0) patch = { menuItems: clone };
                }
            } else if (type === 'lightgrid') {
                const lights = w.overrides.lightsData;
                if (Array.isArray(lights) && lights.length) {
                    const clone = deepClone(lights);
                    for (let j = 0; j < clone.length; j++) {
                        if (!clone[j]) continue;
                        const action = clone[j].switchAction;
                        if (!action) continue;
                        const cur = action.urlNewTab === true;
                        if (cur !== wantNewTab) {
                            action.urlNewTab = wantNewTab;
                            localLinks++;
                        }
                    }
                    if (localLinks > 0) patch = { lightsData: clone };
                }
            } else if (type === 'text') {
                // Toggle the per-link ` ^` markers AND set the widget-level Link Open Behavior so
                // the new dropdown stays in sync with the bulk action ('new' / 'current' tab).
                const desiredMode = wantNewTab ? 'new' : 'current';
                const result = transformMarkdownLinks(w.overrides.text, wantNewTab);
                patch = {};
                if (result.changed > 0) {
                    patch.text = result.text;
                    localLinks = result.changed;
                }
                if ((w.overrides.mdLinkTarget || 'markdown') !== desiredMode) {
                    patch.mdLinkTarget = desiredMode;
                    if (localLinks === 0) localLinks = 1;
                }
                if (!Object.keys(patch).length) patch = null;
            }

            if (!patch) continue;
            let anyChanged = false;
            const patchKeys = Object.keys(patch);
            for (let pk = 0; pk < patchKeys.length; pk++) {
                if (overrideChanged(w, patchKeys[pk], patch[patchKeys[pk]])) {
                    anyChanged = true;
                    break;
                }
            }
            if (!anyChanged) continue;
            Dashboard.updateWidget(id, patch, false);
            widgetsChanged++;
            linksChanged += localLinks;
        }

        if (typeof Editor !== 'undefined' && Editor.currentId && Dashboard.widgets[Editor.currentId]
            && typeof Editor.loadWidget === 'function') {
            Editor.loadWidget(Editor.currentId);
        }

        const target = wantNewTab ? 'a new tab' : 'the same tab';
        if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
            if (widgetsChanged > 0) {
                CustomDialog.alert(
                    'Updated ' + widgetsChanged + ' widget' + (widgetsChanged === 1 ? '' : 's') +
                    ' (' + linksChanged + ' link' + (linksChanged === 1 ? '' : 's') +
                    ' now open in ' + target + ').',
                    'Tools'
                );
            } else {
                CustomDialog.alert('No link settings found to change.', 'Tools');
            }
        }
    }

    const LINK_WIDGET_TYPES = { switch: true, editbox: true, menu: true, lightgrid: true, text: true };

    function collectLinkWidgets() {
        const rows = [];
        if (typeof Dashboard === 'undefined' || !Dashboard.widgets) return rows;
        const ids = Object.keys(Dashboard.widgets);
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const w = Dashboard.widgets[id];
            if (!w) continue;
            const type = widgetType(w);
            if (!type || !LINK_WIDGET_TYPES[type]) continue;
            const name = (w.overrides && w.overrides.metaName != null)
                ? String(w.overrides.metaName)
                : String(id);
            rows.push({ id: id, type: type, name: name });
        }
        rows.sort(function (a, b) {
            const typeCmp = String(a.type).localeCompare(String(b.type));
            if (typeCmp !== 0) return typeCmp;
            return String(a.name).localeCompare(String(b.name));
        });
        return rows;
    }

    function widgetTypeLabel(type) {
        const wClass = (typeof WidgetRegistry !== 'undefined' && WidgetRegistry.widgets)
            ? WidgetRegistry.widgets[type]
            : null;
        if (wClass && wClass.metadata && wClass.metadata.label) return String(wClass.metadata.label);
        return String(type);
    }

    function groupLinkWidgets(widgets) {
        const map = {};
        for (let i = 0; i < widgets.length; i++) {
            const row = widgets[i];
            if (!map[row.type]) map[row.type] = [];
            map[row.type].push(row);
        }
        return Object.keys(map).sort(function (a, b) {
            return widgetTypeLabel(a).localeCompare(widgetTypeLabel(b));
        }).map(function (type) {
            return { type: type, widgets: map[type] };
        });
    }

    function checkStateFromBtn(btn) {
        const aria = btn.getAttribute('aria-checked');
        if (aria === 'true') return 'all';
        if (aria === 'mixed') return 'some';
        return 'none';
    }

    function applyCheckState(btn, state) {
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
    }

    function renderCheck(state, onToggle) {
        const btn = document.createElement('button');
        btn.type = 'button';
        applyCheckState(btn, state);
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            onToggle(checkStateFromBtn(btn) !== 'all');
        });
        return btn;
    }

    function setLeavesChecked(leafBtns, on) {
        for (let i = 0; i < leafBtns.length; i++) {
            applyCheckState(leafBtns[i], on ? 'all' : 'none');
        }
    }

    function typeTagHtml(type) {
        if (typeof WidgetRegistry !== 'undefined' && typeof WidgetRegistry.getWidgetTagHtml === 'function') {
            return WidgetRegistry.getWidgetTagHtml(type, true);
        }
        return '';
    }

    function buildLinkTargetExtras(extrasEl, widgets) {
        extrasEl.className = 'cd-prompt-extras cd-link-target-extras';

        const modeField = document.createElement('fieldset');
        modeField.className = 'cd-markdown-link-target-fieldset';
        const modeLegend = document.createElement('legend');
        modeLegend.textContent = 'Open Links In';
        modeField.appendChild(modeLegend);
        const modeRows = document.createElement('div');
        modeRows.className = 'cd-markdown-link-target-rows';
        const name = 'cdLinkOpenBehavior';
        const modes = [
            { id: 'cd-link-target-new', value: 'new', label: 'New Tab', checked: true },
            { id: 'cd-link-target-same', value: 'same', label: 'Same Tab', checked: false }
        ];
        for (let m = 0; m < modes.length; m++) {
            const def = modes[m];
            const lbl = document.createElement('label');
            lbl.setAttribute('for', def.id);
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = name;
            radio.id = def.id;
            radio.value = def.value;
            radio.checked = def.checked;
            lbl.appendChild(radio);
            lbl.appendChild(document.createTextNode(def.label));
            modeRows.appendChild(lbl);
        }
        modeField.appendChild(modeRows);
        extrasEl.appendChild(modeField);

        const listField = document.createElement('fieldset');
        listField.className = 'cd-markdown-link-target-fieldset';
        const listLegend = document.createElement('legend');
        listLegend.textContent = 'Widgets';
        listField.appendChild(listLegend);

        const groups = [];
        const grouped = groupLinkWidgets(widgets);
        const btnOk = document.getElementById('cd-btn-ok');
        let selectAllBtn = null;

        const allLeafBtns = function () {
            const out = [];
            for (let g = 0; g < groups.length; g++) {
                const leaves = groups[g].leafBtns;
                for (let i = 0; i < leaves.length; i++) out.push(leaves[i]);
            }
            return out;
        };

        const syncTree = function () {
            let total = 0;
            let on = 0;
            for (let g = 0; g < groups.length; g++) {
                const leaves = groups[g].leafBtns;
                let gon = 0;
                for (let i = 0; i < leaves.length; i++) {
                    total++;
                    if (checkStateFromBtn(leaves[i]) === 'all') {
                        on++;
                        gon++;
                    }
                }
                const st = gon === 0 ? 'none' : (gon === leaves.length ? 'all' : 'some');
                applyCheckState(groups[g].typeBtn, st);
            }
            if (selectAllBtn) {
                const allSt = on === 0 ? 'none' : (on === total ? 'all' : 'some');
                applyCheckState(selectAllBtn, allSt);
            }
            if (btnOk) btnOk.disabled = on === 0;
        };

        const selectAllRow = document.createElement('div');
        selectAllRow.className = 'wpp-row';
        const selectAllSpacer = document.createElement('span');
        selectAllSpacer.className = 'wpp-twisty-spacer';
        selectAllBtn = renderCheck('all', function (wantOn) {
            setLeavesChecked(allLeafBtns(), wantOn);
            syncTree();
        });
        const selectAllLabel = document.createElement('span');
        selectAllLabel.className = 'wpp-label';
        selectAllLabel.textContent = 'Select All';
        selectAllRow.appendChild(selectAllSpacer);
        selectAllRow.appendChild(selectAllBtn);
        selectAllRow.appendChild(selectAllLabel);
        selectAllRow.addEventListener('click', function () {
            setLeavesChecked(allLeafBtns(), checkStateFromBtn(selectAllBtn) !== 'all');
            syncTree();
        });

        const tree = document.createElement('div');
        tree.className = 'wpp-tree ds-scroll-box';
        tree.setAttribute('role', 'group');
        tree.setAttribute('aria-label', 'Widgets');
        tree.appendChild(selectAllRow);

        for (let g = 0; g < grouped.length; g++) {
            const group = grouped[g];
            const wrap = document.createElement('div');
            wrap.className = 'wpp-branch';

            const row = document.createElement('div');
            row.className = 'wpp-row';
            row.style.setProperty('--wpp-depth', '0');

            const kids = document.createElement('div');
            kids.className = 'wpp-children';
            kids.hidden = true;

            const twisty = document.createElement('button');
            twisty.type = 'button';
            twisty.className = 'wpp-twisty is-collapsed';
            twisty.innerHTML = '<i class="ph-bold ph-caret-down"></i>';
            twisty.title = 'Expand';
            twisty.addEventListener('click', function (e) {
                e.stopPropagation();
                const collapsed = !kids.hidden;
                kids.hidden = collapsed;
                twisty.classList.toggle('is-collapsed', collapsed);
                twisty.title = collapsed ? 'Expand' : 'Collapse';
            });

            const leafBtns = [];
            const typeBtn = renderCheck('all', function (wantOn) {
                setLeavesChecked(leafBtns, wantOn);
                syncTree();
            });

            const label = document.createElement('span');
            label.className = 'wpp-label';
            const tagHtml = typeTagHtml(group.type);
            if (tagHtml) label.innerHTML = tagHtml;
            else label.textContent = widgetTypeLabel(group.type);

            const badge = document.createElement('span');
            badge.className = 'wpp-badge wpp-badge--default';
            badge.textContent = String(group.widgets.length);

            row.appendChild(twisty);
            row.appendChild(typeBtn);
            row.appendChild(label);
            row.appendChild(badge);
            row.addEventListener('click', function () {
                setLeavesChecked(leafBtns, checkStateFromBtn(typeBtn) !== 'all');
                syncTree();
            });
            wrap.appendChild(row);

            for (let i = 0; i < group.widgets.length; i++) {
                const item = group.widgets[i];
                const leaf = document.createElement('div');
                leaf.className = 'wpp-row wpp-row--leaf';
                leaf.style.setProperty('--wpp-depth', '1');

                const spacer = document.createElement('span');
                spacer.className = 'wpp-twisty-spacer';

                const leafBtn = renderCheck('all', function (wantOn) {
                    applyCheckState(leafBtn, wantOn ? 'all' : 'none');
                    syncTree();
                });
                leafBtn.dataset.widgetId = item.id;

                const leafLabel = document.createElement('span');
                leafLabel.className = 'wpp-label';
                leafLabel.textContent = item.name;
                leafLabel.title = item.name;

                leaf.appendChild(spacer);
                leaf.appendChild(leafBtn);
                leaf.appendChild(leafLabel);
                leaf.addEventListener('click', function () {
                    applyCheckState(leafBtn, checkStateFromBtn(leafBtn) !== 'all' ? 'all' : 'none');
                    syncTree();
                });
                kids.appendChild(leaf);
                leafBtns.push(leafBtn);
            }

            wrap.appendChild(kids);
            tree.appendChild(wrap);
            groups.push({ typeBtn: typeBtn, leafBtns: leafBtns });
        }

        listField.appendChild(tree);
        extrasEl.appendChild(listField);
        syncTree();
    }

    function collectLinkTargetForm() {
        const newEl = document.getElementById('cd-link-target-new');
        const wantNewTab = !!(newEl && newEl.checked);
        const boxes = document.querySelectorAll('#custom-dialog .wpp-check[data-widget-id]');
        const ids = [];
        for (let i = 0; i < boxes.length; i++) {
            if (checkStateFromBtn(boxes[i]) === 'all') ids.push(boxes[i].dataset.widgetId);
        }
        if (!ids.length) return false;
        return { wantNewTab: wantNewTab, ids: ids };
    }

    async function openLinkTargetDialog() {
        if (typeof Dashboard === 'undefined' || !Dashboard.widgets) {
            if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                await CustomDialog.alert('No dashboard is loaded.', 'Tools');
            }
            return;
        }
        const widgets = collectLinkWidgets();
        if (!widgets.length) {
            if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                await CustomDialog.alert('No widgets with link settings found.', 'Set Link Open Behavior');
            }
            return;
        }
        if (typeof CustomDialog === 'undefined' || typeof CustomDialog.form !== 'function') {
            applyLinkTarget(true);
            return;
        }
        const result = await CustomDialog.form(
            'Choose how links open. Expand a type to pick individual widgets.',
            'Set Link Open Behavior',
            {
                okLabel: 'Apply',
                buildExtras: function (extrasEl) {
                    buildLinkTargetExtras(extrasEl, widgets);
                },
                collect: collectLinkTargetForm
            }
        );
        if (!result || !result.ids || !result.ids.length) return;
        applyLinkTarget(result.wantNewTab, new Set(result.ids));
    }

    window.LinkTargetTool = {
        open: openLinkTargetDialog
    };

    if (typeof ToolsRegistry !== 'undefined') {
        ToolsRegistry.register({
            id: 'link-open-behavior',
            label: 'Set Link Open Behavior',
            icon: 'ph-arrow-square-out',
            script: 'scripts/link-target.js',
            run: function () {
                return LinkTargetTool.open();
            }
        });
    }
})();
