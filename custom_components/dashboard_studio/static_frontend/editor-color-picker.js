/**
 * Full-width floating color picker for the editor: HSV sliders + CSS text, optional theme token grid.
 * Depends: ColorUtils, MasterLayout, Dashboard (optional), Editor (optional ensureHex).
 */
(function () {
    'use strict';

    let panelEl = null;
    let activeAnchor = null;
    let activeContext = null;
    const swatchSyncRegistry = new Set();
    let rafSave = null;
    /** True after HSV slider moved without a model commit (release / flush clears). */
    let sliderDraftDirty = false;
    /** Prevents re-entrant slider commits (save / editor reload feedback). */
    let sliderCommitInProgress = false;
    let escHandler = null;
    let outsideHandler = null;
    let outsideTimer = null;

    const MANUAL_COLOR_FORMATS = ['hex', 'rgb', 'hsl'];
    const LS_MANUAL_COLOR_FMT = 'homeyStudio_editorManualColorFormat';

    function normalizeManualColorFormatString(v) {
        let s = String(v || 'hex').toLowerCase();
        if (s === 'rgba') s = 'rgb';
        if (s === 'hsla') s = 'hsl';
        return s;
    }

    function getManualColorFormat() {
        let raw = null;
        try {
            raw = localStorage.getItem(LS_MANUAL_COLOR_FMT);
        } catch (e) { /* ignore */ }
        if (!raw && typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.editorManualColorFormat != null && MASTER_SETTINGS.editorManualColorFormat !== '') {
            raw = String(MASTER_SETTINGS.editorManualColorFormat);
            const migrated = normalizeManualColorFormatString(raw);
            if (MANUAL_COLOR_FORMATS.indexOf(migrated) >= 0) {
                try {
                    localStorage.setItem(LS_MANUAL_COLOR_FMT, migrated);
                } catch (e2) { /* ignore */ }
            }
        }
        const s = normalizeManualColorFormatString(raw || 'hex');
        return MANUAL_COLOR_FORMATS.indexOf(s) >= 0 ? s : 'hex';
    }

    function persistManualColorFormat(fmt) {
        if (MANUAL_COLOR_FORMATS.indexOf(fmt) < 0) return;
        try {
            localStorage.setItem(LS_MANUAL_COLOR_FMT, fmt);
        } catch (e) { /* ignore */ }
    }

    function resolveForDisplay(val) {
        if (typeof Dashboard !== 'undefined' && Dashboard.resolveThemeColorValue) {
            return Dashboard.resolveThemeColorValue(val);
        }
        return val;
    }

    function isTokenRef(val) {
        return typeof MasterLayout !== 'undefined' && MasterLayout.isThemeTokenReference(val);
    }

    function parseTokenKey(val) {
        return MasterLayout.parseThemeTokenReference(val);
    }

    function deepWalkStringsSkipExcludedMaster(obj, visitor, visited) {
        if (obj === null || typeof obj !== 'object') return;
        if (!visited) visited = new WeakSet();
        if (visited.has(obj)) return;
        visited.add(obj);
        if (Array.isArray(obj)) {
            obj.forEach((item) => deepWalkStringsSkipExcludedMaster(item, visitor, visited));
            return;
        }
        Object.keys(obj).forEach((k) => {
            const v = obj[k];
            if (k === 'themeColors' && v !== null && typeof v === 'object' && !Array.isArray(v)) {
                return;
            }
            if (k === 'defaultLightGridPresets') {
                return;
            }
            if (k.indexOf('lg') === 0) {
                return;
            }
            if (typeof v === 'string') visitor(v);
            else if (v !== null && typeof v === 'object') deepWalkStringsSkipExcludedMaster(v, visitor, visited);
        });
    }

    function deepWalkStrings(obj, visitor, visited) {
        if (obj === null || typeof obj !== 'object') return;
        if (!visited) visited = new WeakSet();
        if (visited.has(obj)) return;
        visited.add(obj);
        if (Array.isArray(obj)) {
            obj.forEach((item) => deepWalkStrings(item, visitor, visited));
            return;
        }
        Object.keys(obj).forEach((k) => {
            const v = obj[k];
            if (typeof v === 'string') visitor(v);
            else if (v !== null && typeof v === 'object') deepWalkStrings(v, visitor, visited);
        });
    }

    function getDashboardWidgetRegistryType(widget) {
        if (!widget || typeof WidgetRegistry === 'undefined' || !WidgetRegistry.widgets) return null;
        const ctor = Object.getPrototypeOf(widget).constructor;
        const types = Object.keys(WidgetRegistry.widgets);
        for (let i = 0; i < types.length; i++) {
            if (WidgetRegistry.widgets[types[i]] === ctor) return types[i];
        }
        return null;
    }

    const USED_SWATCH_MAX_COLS = 10;

    /** Row lengths that balance across rows (e.g. 11 → [6, 5]), max USED_SWATCH_MAX_COLS per row. */
    function splitUsedSwatchRowCounts(total) {
        if (total <= 0) return [];
        const numRows = Math.ceil(total / USED_SWATCH_MAX_COLS);
        const counts = [];
        let remaining = total;
        for (let r = 0; r < numRows; r++) {
            const rowsLeft = numRows - r;
            const cnt = Math.ceil(remaining / rowsLeft);
            counts.push(cnt);
            remaining -= cnt;
        }
        return counts;
    }

    function appendUsedSwatchRowPlaceholder(row) {
        const ph = document.createElement('div');
        ph.className = 'ds-color-used-cell-placeholder';
        ph.setAttribute('aria-hidden', 'true');
        row.appendChild(ph);
    }

    function collectUsedDashboardCustomColors() {
        const seen = new Map();
        function tryAdd(str) {
            const t = String(str || '').trim();
            if (!t || isTokenRef(t)) return;
            const p = ColorUtils.parse(t);
            if (!p) return;
            const rgb = ColorUtils.hsvToRgb(p.h, p.s, p.v);
            const key = `${rgb.r},${rgb.g},${rgb.b}`;
            if (!seen.has(key)) {
                seen.set(key, t);
            }
        }
        if (typeof MASTER_SETTINGS !== 'undefined') {
            deepWalkStringsSkipExcludedMaster(MASTER_SETTINGS, tryAdd);
        }
        // Use instance overrides only — not `w.config`. `get config()` merges master settings and
        // resolves @theme tokens to literal hex/rgba for rendering, which would falsely populate
        // "used custom colors" for every widget even when the user never set a custom color.
        if (typeof Dashboard !== 'undefined' && Dashboard.widgets) {
            Object.keys(Dashboard.widgets).forEach((wid) => {
                const w = Dashboard.widgets[wid];
                if (!w || !w.overrides || typeof w.overrides !== 'object') return;
                if (getDashboardWidgetRegistryType(w) === 'lightgrid') return;
                deepWalkStrings(w.overrides, tryAdd);
            });
        }
        return Array.from(seen.values());
    }

    function isValidColorString(str) {
        const t = String(str || '').trim();
        if (!t) return false;
        if (isTokenRef(t)) return true;
        return ColorUtils.parse(t) !== null;
    }

    function hsvFromAny(val) {
        const resolved = resolveForDisplay(val);
        const hsv = ColorUtils.parse(resolved);
        if (hsv) {
            return { h: hsv.h, s: hsv.s, v: hsv.v, a: hsv.a !== undefined ? hsv.a : 1 };
        }
        return { h: 200, s: 50, v: 50, a: 1 };
    }

    function hueGradientCss() {
        return 'linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)';
    }

    function ensurePanel() {
        if (panelEl) return panelEl;
        const p = document.createElement('div');
        p.className = 'ds-color-picker-panel';
        p.style.display = 'none';
        p.setAttribute('role', 'dialog');
        p.setAttribute('aria-label', 'Color picker');

        const tabs = document.createElement('div');
        tabs.className = 'ds-color-picker-tabs';

        const tabCustom = document.createElement('button');
        tabCustom.type = 'button';
        tabCustom.className = 'ds-color-picker-tab ds-color-picker-tab-active';
        tabCustom.setAttribute('role', 'tab');
        tabCustom.setAttribute('aria-selected', 'true');
        tabCustom.dataset.tab = 'custom';
        tabCustom.textContent = 'Custom';

        const tabTheme = document.createElement('button');
        tabTheme.type = 'button';
        tabTheme.className = 'ds-color-picker-tab';
        tabTheme.setAttribute('role', 'tab');
        tabTheme.setAttribute('aria-selected', 'false');
        tabTheme.dataset.tab = 'theme';
        tabTheme.textContent = 'Theme';

        tabs.appendChild(tabCustom);
        tabs.appendChild(tabTheme);

        const body = document.createElement('div');
        body.className = 'ds-color-picker-body';

        const customPane = document.createElement('div');
        customPane.className = 'ds-color-picker-pane';
        customPane.dataset.pane = 'custom';
        customPane.setAttribute('role', 'tabpanel');

        function makeSlider(label) {
            const wrap = document.createElement('div');
            wrap.className = 'ds-color-slider-wrap';
            const lab = document.createElement('div');
            lab.className = 'ds-color-slider-label';
            lab.textContent = label;
            const track = document.createElement('div');
            track.className = 'ds-color-slider-track';
            const inp = document.createElement('input');
            inp.type = 'range';
            inp.className = 'ds-color-slider-input';
            wrap.appendChild(lab);
            wrap.appendChild(track);
            track.appendChild(inp);
            return { wrap, track, inp };
        }

        const hueUi = makeSlider('Color Tone');
        hueUi.inp.min = '0';
        hueUi.inp.max = '360';
        hueUi.inp.step = '1';

        const satUi = makeSlider('Color Intensity');
        satUi.inp.min = '0';
        satUi.inp.max = '100';
        satUi.inp.step = '1';

        const valUi = makeSlider('Brightness');
        valUi.inp.min = '0';
        valUi.inp.max = '100';
        valUi.inp.step = '1';

        hueUi.track.style.background = hueGradientCss();

        const usedSection = document.createElement('div');
        usedSection.className = 'ds-color-used-section';
        usedSection.style.display = 'none';
        const usedLabel = document.createElement('div');
        usedLabel.className = 'ds-color-used-label';
        usedLabel.textContent = 'Used Custom Colors';
        const usedRows = document.createElement('div');
        usedRows.className = 'ds-color-used-rows';
        usedSection.appendChild(usedLabel);
        usedSection.appendChild(usedRows);

        customPane.appendChild(usedSection);
        customPane.appendChild(hueUi.wrap);
        customPane.appendChild(satUi.wrap);
        customPane.appendChild(valUi.wrap);

        const textRow = document.createElement('div');
        textRow.className = 'ds-color-picker-text-row';
        const textLine = document.createElement('div');
        textLine.className = 'ds-color-picker-text-line';
        const textInpWrap = document.createElement('div');
        textInpWrap.className = 'ds-color-picker-text-input-wrap';
        const textInp = document.createElement('input');
        textInp.type = 'text';
        textInp.className = 'ds-color-picker-text-input control-input';
        textInp.placeholder = '#hex, rgb(), hsl(), or @token';
        textInpWrap.appendChild(textInp);

        const formatBar = document.createElement('div');
        formatBar.className = 'ds-color-picker-format-bar';
        formatBar.setAttribute('role', 'group');
        formatBar.setAttribute('aria-label', 'Manual color format');
        const FORMAT_BUTTONS = [
            { id: 'hex', label: 'Hex', title: 'Hex #RRGGBB' },
            { id: 'rgb', label: 'RGB', title: 'rgb( r, g, b )' },
            { id: 'hsl', label: 'HSL', title: 'hsl( h, s%, l% )' }
        ];
        FORMAT_BUTTONS.forEach((def) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ds-color-format-btn';
            btn.dataset.format = def.id;
            btn.textContent = def.label;
            btn.title = def.title;
            btn.setAttribute('aria-pressed', 'false');
            formatBar.appendChild(btn);
        });

        textLine.appendChild(textInpWrap);
        textLine.appendChild(formatBar);
        textRow.appendChild(textLine);

        const warnWrap = document.createElement('div');
        warnWrap.className = 'ds-color-picker-warn';
        warnWrap.style.display = 'none';
        const warnIcon = document.createElement('i');
        warnIcon.className = 'ph ph-warning text-[var(--ui-danger)]';
        warnIcon.title = '';
        const warnTxt = document.createElement('span');
        warnTxt.className = 'ds-color-picker-warn-text';
        warnWrap.appendChild(warnIcon);
        warnWrap.appendChild(warnTxt);
        textRow.appendChild(warnWrap);
        customPane.appendChild(textRow);

        const themePane = document.createElement('div');
        themePane.className = 'ds-color-picker-pane ds-color-picker-pane-hidden';
        themePane.dataset.pane = 'theme';
        themePane.setAttribute('role', 'tabpanel');

        const grid = document.createElement('div');
        grid.className = 'ds-theme-color-grid';

        themePane.appendChild(grid);

        body.appendChild(customPane);
        body.appendChild(themePane);

        const clearFooter = document.createElement('div');
        clearFooter.className = 'ds-color-picker-clear-footer';
        clearFooter.style.display = 'none';
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'ds-color-picker-clear-btn';
        clearBtn.textContent = 'Clear cell background';
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!activeContext || typeof activeContext.onClear !== 'function') return;
            sliderDraftDirty = false;
            activeContext.onClear();
            if (activeContext.getRaw) {
                activeContext.updateAnchorSwatch(activeContext.getRaw());
            } else {
                activeContext.updateAnchorSwatch('');
            }
            if (activeContext.onAfterLocalChange) activeContext.onAfterLocalChange('change');
            closePanel();
        });
        clearFooter.appendChild(clearBtn);

        p.appendChild(tabs);
        p.appendChild(body);
        p.appendChild(clearFooter);

        document.body.appendChild(p);
        panelEl = p;

        const ui = {
            tabCustom,
            tabTheme,
            tabs,
            customPane,
            themePane,
            grid,
            hueInp: hueUi.inp,
            satInp: satUi.inp,
            valInp: valUi.inp,
            satTrack: satUi.track,
            valTrack: valUi.track,
            usedSection,
            usedRows,
            textInp,
            formatBar,
            warnWrap,
            warnTxt,
            clearFooter,
            clearBtn
        };

        function syncFormatButtonStates() {
            const cur = getManualColorFormat();
            ui.formatBar.querySelectorAll('.ds-color-format-btn').forEach((b) => {
                const on = b.dataset.format === cur;
                b.classList.toggle('ds-color-format-btn-active', on);
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        }

        ui.formatBar.querySelectorAll('.ds-color-format-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const fmt = btn.dataset.format;
                if (!fmt) return;
                persistManualColorFormat(fmt);
                syncFormatButtonStates();
                if (!activeContext || !panelEl || panelEl.style.display === 'none') return;
                const raw = activeContext.getRaw();
                if (isTokenRef(String(raw || '').trim())) return;
                const h = parseFloat(ui.hueInp.value) || 0;
                const s = parseFloat(ui.satInp.value) || 0;
                const v = parseFloat(ui.valInp.value) || 0;
                ui.textInp.value = ColorUtils.formatManualColor({ h, s, v, a: 1 }, fmt);
                ui.warnWrap.style.display = 'none';
            });
        });

        function updateSatValTracks() {
            const h = parseFloat(ui.hueInp.value) || 0;
            const s = parseFloat(ui.satInp.value) || 0;
            const v = parseFloat(ui.valInp.value) || 0;
            const left = ColorUtils.toCss({ h, s: 0, v: 100, a: 1 });
            const right = ColorUtils.toCss({ h, s: 100, v: 100, a: 1 });
            ui.satTrack.style.background = `linear-gradient(90deg, ${left}, ${right})`;
            const bright = ColorUtils.toCss({ h, s, v: 100, a: 1 });
            ui.valTrack.style.background = `linear-gradient(90deg, #000000, ${bright})`;
        }

        function cssFromCurrentSliders() {
            const h = parseFloat(ui.hueInp.value) || 0;
            const s = parseFloat(ui.satInp.value) || 0;
            const v = parseFloat(ui.valInp.value) || 0;
            const fmt = getManualColorFormat();
            return ColorUtils.formatManualColor({ h, s, v, a: 1 }, fmt);
        }

        /** Push slider color to MASTER_SETTINGS / widget (full dashboard refresh path). */
        function commitSliderValuesToModel() {
            if (sliderCommitInProgress || !activeContext) return;
            if (rafSave) {
                cancelAnimationFrame(rafSave);
                rafSave = null;
            }
            sliderCommitInProgress = true;
            try {
                const css = cssFromCurrentSliders();
                ui.textInp.value = css;
                ui.warnWrap.style.display = 'none';
                activeContext.setValue(css, true, 'slider');
                const rawAfter = activeContext.getRaw ? activeContext.getRaw() : css;
                activeContext.updateAnchorSwatch(rawAfter !== undefined && rawAfter !== null ? rawAfter : css);
                if (activeContext.onAfterLocalChange) activeContext.onAfterLocalChange('slider');
                sliderDraftDirty = false;
            } finally {
                sliderCommitInProgress = false;
            }
        }

        /** During drag: update panel + anchor swatch only (no setValue / widget re-render). */
        function scheduleSliderLocalPreview() {
            if (rafSave) cancelAnimationFrame(rafSave);
            rafSave = requestAnimationFrame(() => {
                rafSave = null;
                if (!activeContext) return;
                const css = cssFromCurrentSliders();
                ui.textInp.value = css;
                ui.warnWrap.style.display = 'none';
                if (activeContext.previewAnchorSwatch) {
                    activeContext.previewAnchorSwatch(css);
                } else {
                    activeContext.updateAnchorSwatch(css, true);
                }
                sliderDraftDirty = true;
            });
        }

        function bindSliderInput(inp) {
            inp.addEventListener('input', () => {
                updateSatValTracks();
                scheduleSliderLocalPreview();
            });
            inp.addEventListener('pointerup', (e) => {
                if (e.button !== 0) return;
                commitSliderValuesToModel();
            });
            inp.addEventListener('pointercancel', () => {
                commitSliderValuesToModel();
            });
            inp.addEventListener('keyup', (e) => {
                const k = e.key;
                if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
                        || k === 'Home' || k === 'End' || k === 'PageUp' || k === 'PageDown') {
                    commitSliderValuesToModel();
                }
            });
            if (typeof window.PointerEvent !== 'function') {
                inp.addEventListener('change', () => {
                    commitSliderValuesToModel();
                });
            }
        }

        [ui.hueInp, ui.satInp, ui.valInp].forEach(bindSliderInput);

        function applyTextCommit() {
            if (!activeContext) return;
            const t = ui.textInp.value.trim();
            ui.warnWrap.style.display = 'none';
            if (!t) {
                ui.warnWrap.style.display = 'flex';
                ui.warnTxt.textContent = 'Enter a valid color.';
                return;
            }
            if (!isValidColorString(t)) {
                ui.warnWrap.style.display = 'flex';
                ui.warnTxt.textContent = 'This color is not valid.';
                return;
            }
            let saveStr = t;
            if (!isTokenRef(t)) {
                const parsed = ColorUtils.parse(t);
                if (parsed) {
                    saveStr = ColorUtils.formatManualColor(parsed, getManualColorFormat());
                }
            }
            sliderDraftDirty = false;
            activeContext.setValue(saveStr, false, 'text');
            const rawAfter = activeContext.getRaw ? activeContext.getRaw() : saveStr;
            activeContext.updateAnchorSwatch(rawAfter !== undefined && rawAfter !== null ? rawAfter : saveStr);
            if (activeContext.onAfterLocalChange) activeContext.onAfterLocalChange('change');
            if (activeContext.onReloadEditor) activeContext.onReloadEditor();
            closePanel();
        }

        ui.textInp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyTextCommit();
            }
        });
        ui.textInp.addEventListener('blur', () => {
            setTimeout(() => {
                if (!activeContext || !panelEl || panelEl.style.display === 'none') return;
                if (panelEl.contains(document.activeElement)) return;
                const t = ui.textInp.value.trim();
                if (!t) {
                    ui.warnWrap.style.display = 'flex';
                    ui.warnTxt.textContent = 'Enter a valid color.';
                    return;
                }
                if (!isValidColorString(t)) {
                    ui.warnWrap.style.display = 'flex';
                    ui.warnTxt.textContent = 'This color is not valid.';
                    return;
                }
                applyTextCommit();
            }, 0);
        });

        function selectTab(which) {
            const isCustom = which === 'custom';
            ui.tabCustom.classList.toggle('ds-color-picker-tab-active', isCustom);
            ui.tabTheme.classList.toggle('ds-color-picker-tab-active', !isCustom);
            ui.tabCustom.setAttribute('aria-selected', isCustom ? 'true' : 'false');
            ui.tabTheme.setAttribute('aria-selected', !isCustom ? 'true' : 'false');
            ui.customPane.classList.toggle('ds-color-picker-pane-hidden', !isCustom);
            ui.themePane.classList.toggle('ds-color-picker-pane-hidden', isCustom);
        }

        function rebuildUsedCustomSwatches() {
            const list = collectUsedDashboardCustomColors();
            usedRows.innerHTML = '';
            if (list.length === 0) {
                usedSection.style.display = 'none';
                return;
            }
            usedSection.style.display = '';
            const rowCounts = splitUsedSwatchRowCounts(list.length);
            let idx = 0;
            rowCounts.forEach((cnt) => {
                const row = document.createElement('div');
                row.className = 'ds-color-used-row';
                for (let col = 0; col < USED_SWATCH_MAX_COLS; col++) {
                    if (col < cnt) {
                        const literal = list[idx++];
                        const p = ColorUtils.parse(String(literal || '').trim());
                        if (p) {
                            const btn = document.createElement('button');
                            btn.type = 'button';
                            btn.className = 'ds-color-used-swatch';
                            btn.title = literal;
                            btn.style.background = ColorUtils.toCss({ h: p.h, s: p.s, v: p.v, a: 1 });
                            btn.addEventListener('click', (e) => {
                                e.preventDefault();
                                if (!activeContext) return;
                                const fmt = getManualColorFormat();
                                const saveStr = ColorUtils.formatManualColor(
                                    { h: p.h, s: p.s, v: p.v, a: 1 },
                                    fmt
                                );
                                sliderDraftDirty = false;
                                activeContext.setValue(saveStr, true, 'usedSwatch');
                                const rawAfter = activeContext.getRaw ? activeContext.getRaw() : saveStr;
                                activeContext.updateAnchorSwatch(rawAfter !== undefined && rawAfter !== null ? rawAfter : saveStr);
                                ui.hueInp.value = String(Math.round(p.h));
                                ui.satInp.value = String(Math.round(p.s));
                                ui.valInp.value = String(Math.round(p.v));
                                panelEl._updateSatValTracks();
                                ui.textInp.value = saveStr;
                                ui.warnWrap.style.display = 'none';
                                if (activeContext.onAfterLocalChange) {
                                    activeContext.onAfterLocalChange('change');
                                }
                                closePanel();
                            });
                            row.appendChild(btn);
                        } else {
                            appendUsedSwatchRowPlaceholder(row);
                        }
                    } else {
                        appendUsedSwatchRowPlaceholder(row);
                    }
                }
                usedRows.appendChild(row);
            });
        }

        ui.tabCustom.addEventListener('click', () => {
            selectTab('custom');
            if (activeContext) {
                const hsv = hsvFromAny(activeContext.getRaw());
                ui.hueInp.value = String(Math.round(hsv.h));
                ui.satInp.value = String(Math.round(hsv.s));
                ui.valInp.value = String(Math.round(hsv.v));
                panelEl._updateSatValTracks();
                const r = activeContext.getRaw();
                const fmt = getManualColorFormat();
                ui.textInp.value = isTokenRef(r) ? r : ColorUtils.formatManualColor(
                    { h: hsv.h, s: hsv.s, v: hsv.v, a: 1 },
                    fmt
                );
                ui.warnWrap.style.display = 'none';
                rebuildUsedCustomSwatches();
            }
        });
        ui.tabTheme.addEventListener('click', () => {
            if (sliderDraftDirty && activeContext) {
                commitSliderValuesToModel();
            }
            selectTab('theme');
            if (activeContext && panelEl._ui) {
                highlightSelectedToken(panelEl._ui, activeContext.getRaw());
            }
        });

        panelEl._ui = ui;
        panelEl._updateSatValTracks = updateSatValTracks;
        panelEl._selectTab = selectTab;
        panelEl._applyTextCommit = applyTextCommit;
        panelEl._syncFormatButtonStates = syncFormatButtonStates;
        panelEl._rebuildUsedCustomSwatches = rebuildUsedCustomSwatches;
        panelEl._flushPendingSliderDraftIfNeeded = function () {
            if (!sliderDraftDirty || !activeContext) return;
            commitSliderValuesToModel();
        };
        return panelEl;
    }

    function positionPanel(anchor, ctx) {
        const menuWrap = panelEl;
        const context = ctx || activeContext || {};
        const rect = anchor.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 4;
        const spaceAbove = rect.top - 4;
        const menuMaxHeight = window.innerHeight * 0.55;
        const anchorMode = context.positionMode === 'anchor';

        if (context.zIndex != null && context.zIndex !== '') {
            menuWrap.style.zIndex = String(context.zIndex);
        } else if (anchorMode) {
            menuWrap.style.zIndex = '10050';
        } else {
            menuWrap.style.zIndex = '';
        }

        if (anchorMode) {
            const panelWidth = Math.min(300, Math.max(220, window.innerWidth - rect.left - 12));
            menuWrap.style.left = Math.max(8, rect.left) + 'px';
            menuWrap.style.width = panelWidth + 'px';
        } else {
            const editorPanel = document.getElementById('editor-scroll-container');
            const panelRect = editorPanel ? editorPanel.getBoundingClientRect() : rect;
            const sidePad = 8;
            menuWrap.style.left = panelRect.left + sidePad + 'px';
            menuWrap.style.width = Math.max(200, panelRect.width - sidePad * 2) + 'px';
        }

        if (spaceBelow >= Math.min(menuMaxHeight, 120) || spaceBelow >= spaceAbove) {
            menuWrap.style.top = rect.bottom + 4 + 'px';
            menuWrap.style.bottom = 'auto';
            menuWrap.style.maxHeight = Math.max(spaceBelow, 60) + 'px';
        } else {
            menuWrap.style.top = 'auto';
            menuWrap.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
            menuWrap.style.maxHeight = Math.max(spaceAbove, 60) + 'px';
        }
    }

    function buildThemeGrid(ui, allow) {
        ui.grid.innerHTML = '';
        if (!allow || typeof MasterLayout === 'undefined' || !MasterLayout.THEME_TOKEN_DEFS) return;
        MasterLayout.THEME_TOKEN_DEFS.forEach((def) => {
            const cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'ds-theme-color-cell';
            cell.dataset.token = def.key;
            const label = document.createElement('div');
            label.className = 'ds-theme-color-cell-label';
            label.textContent = def.label;
            label.title = def.hint ? `${def.label} — ${def.hint}` : def.label;
            const sw = document.createElement('div');
            sw.className = 'ds-theme-color-swatch';
            const at = '@' + def.key;
            let fill = '#888';
            if (typeof Dashboard !== 'undefined' && Dashboard.resolveThemeColorValue) {
                fill = String(Dashboard.resolveThemeColorValue(at) || '#888');
            } else if (MasterLayout.defaultThemeColors) {
                const d = MasterLayout.defaultThemeColors();
                fill = String(d[def.key] || '#888');
            }
            sw.style.background = fill;
            sw.title = label.title;
            cell.appendChild(label);
            cell.appendChild(sw);
            cell.title = label.title;
            cell.addEventListener('click', () => {
                if (!activeContext) return;
                sliderDraftDirty = false;
                activeContext.setValue(at, false, 'theme');
                activeContext.updateAnchorSwatch(at);
                if (activeContext.onAfterLocalChange) activeContext.onAfterLocalChange('change');
                if (activeContext.onReloadEditor) activeContext.onReloadEditor();
                closePanel();
            });
            ui.grid.appendChild(cell);
        });
        for (let p = 0; p < 2; p++) {
            const ph = document.createElement('div');
            ph.className = 'ds-theme-color-cell-placeholder';
            ph.setAttribute('aria-hidden', 'true');
            ui.grid.appendChild(ph);
        }
    }

    function highlightSelectedToken(ui, raw) {
        const key = isTokenRef(raw) ? parseTokenKey(raw) : null;
        ui.grid.querySelectorAll('.ds-theme-color-cell').forEach((c) => {
            c.classList.toggle('ds-theme-color-cell-selected', key && c.dataset.token === key);
        });
    }

    function openPanel(anchor, ctx) {
        ensurePanel();
        sliderDraftDirty = false;
        activeAnchor = anchor;
        activeContext = ctx;
        const ui = panelEl._ui;

        const allow = !!ctx.allowThemeTokens;
        ui.tabs.style.display = allow ? 'flex' : 'none';
        if (!allow) {
            panelEl._selectTab('custom');
        }

        if (ui.clearFooter) {
            const showClear = typeof ctx.onClear === 'function';
            ui.clearFooter.style.display = showClear ? 'block' : 'none';
        }

        buildThemeGrid(ui, allow);

        if (panelEl._rebuildUsedCustomSwatches) panelEl._rebuildUsedCustomSwatches();

        const raw = ctx.getRaw();
        const hsv = hsvFromAny(raw);
        ui.hueInp.value = String(Math.round(hsv.h));
        ui.satInp.value = String(Math.round(hsv.s));
        ui.valInp.value = String(Math.round(hsv.v));
        panelEl._updateSatValTracks();
        ui.warnWrap.style.display = 'none';

        if (allow && isTokenRef(raw)) {
            panelEl._selectTab('theme');
            ui.textInp.value = raw;
            highlightSelectedToken(ui, raw);
        } else {
            panelEl._selectTab('custom');
            const fmt = getManualColorFormat();
            ui.textInp.value = ColorUtils.parse(resolveForDisplay(raw))
                ? ColorUtils.formatManualColor({ h: hsv.h, s: hsv.s, v: hsv.v, a: 1 }, fmt)
                : String(raw || '');
            highlightSelectedToken(ui, '');
        }

        if (panelEl._syncFormatButtonStates) panelEl._syncFormatButtonStates();

        positionPanel(anchor, ctx);
        panelEl.style.display = 'block';

        escHandler = (e) => {
            if (e.key === 'Escape') closePanel();
        };
        document.addEventListener('keydown', escHandler);

        outsideHandler = (e) => {
            if (!panelEl.contains(e.target) && !anchor.contains(e.target)) {
                closePanel();
            }
        };
        if (outsideTimer) clearTimeout(outsideTimer);
        outsideTimer = setTimeout(() => {
            outsideTimer = null;
            if (outsideHandler) {
                document.addEventListener('mousedown', outsideHandler, true);
            }
        }, 0);

        const onScroll = () => {
            if (panelEl.style.display !== 'none') positionPanel(anchor, ctx);
        };
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);
        panelEl._scrollHandler = onScroll;
    }

    function isPanelOpen() {
        return !!(panelEl && panelEl.style.display !== 'none');
    }

    /** True when target is the open panel or its anchor, and the anchor lives inside ownerContainerEl. */
    function isPanelInteractionInsideOwner(target, ownerContainerEl) {
        if (!target || !ownerContainerEl || !activeAnchor) return false;
        if (!ownerContainerEl.contains(activeAnchor)) return false;
        if (panelEl && panelEl.style.display !== 'none' && panelEl.contains(target)) return true;
        return target === activeAnchor || activeAnchor.contains(target);
    }

    function closePanel() {
        if (panelEl && panelEl._flushPendingSliderDraftIfNeeded) {
            panelEl._flushPendingSliderDraftIfNeeded();
        }
        if (escHandler) {
            document.removeEventListener('keydown', escHandler);
            escHandler = null;
        }
        if (outsideTimer) {
            clearTimeout(outsideTimer);
            outsideTimer = null;
        }
        if (outsideHandler) {
            document.removeEventListener('mousedown', outsideHandler, true);
            outsideHandler = null;
        }
        if (panelEl && panelEl._scrollHandler) {
            window.removeEventListener('scroll', panelEl._scrollHandler, true);
            window.removeEventListener('resize', panelEl._scrollHandler);
            panelEl._scrollHandler = null;
        }
        if (panelEl) panelEl.style.display = 'none';
        activeAnchor = null;
        activeContext = null;
        if (typeof Editor !== 'undefined' && typeof Editor.flushDeferredInspectorReload === 'function') {
            Editor.flushDeferredInspectorReload();
        }
    }

    function refreshThemeAwareUi() {
        swatchSyncRegistry.forEach(function (syncFn) {
            if (typeof syncFn === 'function') syncFn();
        });
        if (!panelEl || panelEl.style.display === 'none') return;
        if (panelEl._ui) {
            const allow = !!(activeContext && activeContext.allowThemeTokens);
            buildThemeGrid(panelEl._ui, allow);
            if (activeContext && typeof activeContext.getRaw === 'function') {
                highlightSelectedToken(panelEl._ui, activeContext.getRaw());
            }
        }
    }

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('ds-theme-changed', function () {
            refreshThemeAwareUi();
        });
    }

    window.EditorColorPicker = {
        /**
         * @param {Object} opts
         * @param {HTMLElement} opts.mountCard - Field card (appends trigger row)
         * @param {function(): string} opts.getRaw
         * @param {function(string, boolean, string=)} opts.setValue - (value, skipEditorReload, commitSource) commitSource: 'slider'|'text'|'theme'|'usedSwatch'
         * @param {boolean} opts.allowThemeTokens
         * @param {function(string)} [opts.onAfterLocalChange] - 'input' | 'change' | 'slider' (slider: save only, keep panel open)
         * @param {function()} [opts.onReloadEditor] - after committed save that reloads schema
         * @param {function()} [opts.onClear] - optional footer action (e.g. Full Markdown editor cell background)
         * @param {string} [opts.positionMode] - 'anchor' positions below the trigger (Full Markdown editor)
         * @param {number|string} [opts.zIndex] - panel stacking order when open
         * @returns {{ row: HTMLElement, sync: function(), destroy: function() }}
         */
        attach: function (opts) {
            const row = document.createElement('div');
            row.className = 'ds-color-picker-trigger-row';

            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = 'ds-color-picker-swatch';

            const caret = document.createElement('button');
            caret.type = 'button';
            caret.className = 'ds-color-picker-caret';
            caret.innerHTML = '<i class="ph-bold ph-caret-down"></i>';

            const triggerMode = opts.triggerMode === 'text' || opts.triggerMode === 'cell' ? opts.triggerMode : '';
            let colorBar = null;
            if (triggerMode) {
                swatch.classList.add('ds-color-picker-swatch--glyph');
                const glyph = document.createElement(triggerMode === 'text' ? 'span' : 'i');
                if (triggerMode === 'text') {
                    glyph.className = 'ds-color-picker-glyph-a';
                    glyph.textContent = 'A';
                } else {
                    glyph.className = 'ph-bold ph-paint-bucket';
                }
                glyph.setAttribute('aria-hidden', 'true');
                colorBar = document.createElement('span');
                colorBar.className = 'ds-color-picker-swatch-bar';
                colorBar.setAttribute('aria-hidden', 'true');
                swatch.appendChild(glyph);
                swatch.appendChild(colorBar);
            }

            function setTitle(title) {
                const t = title || 'Open color picker';
                swatch.title = t;
                caret.title = t;
                swatch.setAttribute('aria-label', t);
                caret.setAttribute('aria-label', t);
            }
            setTitle(opts.triggerTitle);

            const hidden = document.createElement('input');
            hidden.type = 'text';
            hidden.className = 'ds-color-picker-hidden-registry';
            hidden.setAttribute('aria-hidden', 'true');
            hidden.tabIndex = -1;

            row.appendChild(swatch);
            row.appendChild(caret);
            row.appendChild(hidden);

            function updateSwatchDisplay(val) {
                const disp = resolveForDisplay(val);
                const p = ColorUtils.parse(disp);
                let css = 'var(--ui-input-border)';
                if (p) css = ColorUtils.toCss(p);
                else if (typeof disp === 'string' && disp.trim().startsWith('#')) css = disp.trim();
                if (colorBar) colorBar.style.background = css;
                else swatch.style.background = css;
            }

            function syncHiddenRegistry(val) {
                const s = typeof val === 'string' ? val : '';
                if (hidden.value === s) return;
                hidden.value = s;
            }

            /** @param {boolean} [visualOnly] When true, update the trigger swatch only (slider drag preview). */
            function updateAnchorSwatch(val, visualOnly) {
                updateSwatchDisplay(val);
                if (visualOnly) return;
                syncHiddenRegistry(val);
            }

            function previewAnchorSwatch(val) {
                updateSwatchDisplay(val);
            }

            syncFromModel();
            swatchSyncRegistry.add(syncFromModel);

            function syncFromModel() {
                const r = opts.getRaw();
                updateAnchorSwatch(r);
            }

            function toggleOpen() {
                if (panelEl && panelEl.style.display === 'block' && activeAnchor === row) {
                    closePanel();
                    return;
                }
                openPanel(row, {
                    getRaw: opts.getRaw,
                    setValue: opts.setValue,
                    allowThemeTokens: opts.allowThemeTokens,
                    updateAnchorSwatch,
                    previewAnchorSwatch,
                    onAfterLocalChange: opts.onAfterLocalChange,
                    onReloadEditor: opts.onReloadEditor,
                    onClear: opts.onClear,
                    positionMode: opts.positionMode,
                    zIndex: opts.zIndex
                });
            }

            swatch.addEventListener('click', (e) => {
                e.preventDefault();
                toggleOpen();
            });
            caret.addEventListener('click', (e) => {
                e.preventDefault();
                toggleOpen();
            });

            opts.mountCard.appendChild(row);

            const mo = new MutationObserver(() => {
                if (!document.body.contains(row)) {
                    if (activeAnchor === row) closePanel();
                    mo.disconnect();
                }
            });
            mo.observe(document.body, { childList: true, subtree: true });

            return {
                row,
                hiddenInput: hidden,
                sync: syncFromModel,
                setTitle: setTitle,
                destroy: () => {
                    if (activeAnchor === row) closePanel();
                    swatchSyncRegistry.delete(syncFromModel);
                    mo.disconnect();
                    if (row.parentNode) row.parentNode.removeChild(row);
                }
            };
        },

        /** Rebuild “Used custom colors” from current MASTER_SETTINGS + widget overrides (coalesced to one rAF). */
        refreshUsedCustomSwatches: (function () {
            let scheduled = false;
            return function () {
                if (scheduled) return;
                if (sliderDraftDirty && panelEl && panelEl.style.display !== 'none') return;
                scheduled = true;
                requestAnimationFrame(() => {
                    scheduled = false;
                    if (sliderDraftDirty && panelEl && panelEl.style.display !== 'none') return;
                    ensurePanel();
                    if (panelEl && panelEl._rebuildUsedCustomSwatches) {
                        panelEl._rebuildUsedCustomSwatches();
                    }
                });
            };
        })(),

        refreshThemeAwareUi: refreshThemeAwareUi,

        isPanelOpen: isPanelOpen,

        isPanelInteractionInsideOwner: isPanelInteractionInsideOwner
    };
})();
