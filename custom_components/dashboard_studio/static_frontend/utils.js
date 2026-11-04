const SVGUtils = {
    polarToCartesian: function (centerX, centerY, radius, angleInDegrees) { const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0; return { x: centerX + (radius * Math.cos(angleInRadians)), y: centerY + (radius * Math.sin(angleInRadians)) }; },
    describeArc: function (x, y, radius, startAngle, endAngle) { const start = this.polarToCartesian(x, y, radius, endAngle); const end = this.polarToCartesian(x, y, radius, startAngle); const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"; return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" "); }
};

/** Boot/hot-path logs: set `window.DS_DEBUG = true` in the console to enable. */
function dsDebug() {
    if (window.DS_DEBUG !== true) return;
    console.log.apply(console, arguments);
}

const Utils = {
    applyExtensionIgnoreAttrs: function (el) {
        if (!el || !el.setAttribute) return;
        el.setAttribute('autocomplete', 'off');
        el.setAttribute('data-mp-ignore', 'true');
        el.setAttribute('data-lpignore', 'true');
        el.setAttribute('data-1p-ignore', 'true');
    },
    setCssVarIfChanged: function (el, name, value) {
        if (!el || !el.style || !name) return;
        const next = (value === undefined || value === null) ? '' : String(value);
        let store = el._dsCssVars;
        if (!store) {
            store = {};
            el._dsCssVars = store;
        }
        if (store[name] === next) return;
        store[name] = next;
        if (next === '') el.style.removeProperty(name);
        else el.style.setProperty(name, next);
    }
};

/**
 * Comma-separated page spec: singles (e.g. 4) and inclusive ranges (e.g. 7-12 or 12-7).
 * Invalid tokens are ignored for membership; empty or all-invalid means visible on all pages.
 */
const WidgetPageSpec = (function () {
    const RANGE_RE = /^(\d+)\s*-\s*(\d+)$/;
    const SINGLE_RE = /^(\d+)$/;

    function parseSegment(trimmed) {
        if (!trimmed) return null;
        let m = trimmed.match(RANGE_RE);
        if (m) {
            const a = parseInt(m[1], 10);
            const b = parseInt(m[2], 10);
            if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
            return { kind: 'range', lo: Math.min(a, b), hi: Math.max(a, b) };
        }
        m = trimmed.match(SINGLE_RE);
        if (m) {
            const n = parseInt(m[1], 10);
            if (!Number.isFinite(n) || n <= 0) return null;
            return { kind: 'single', n };
        }
        return null;
    }

    return {
        coversPage: function (raw, pageNum) {
            const page = Math.max(1, parseInt(pageNum, 10) || 1);
            const pieces = String(raw == null ? '' : raw).split(',');
            let anyValid = false;
            for (let i = 0; i < pieces.length; i++) {
                const p = parseSegment(pieces[i].trim());
                if (!p) continue;
                anyValid = true;
                if (p.kind === 'single') {
                    if (p.n === page) return true;
                } else if (page >= p.lo && page <= p.hi) {
                    return true;
                }
            }
            return !anyValid;
        },

        minPage: function (raw) {
            let min = Infinity;
            const pieces = String(raw == null ? '' : raw).split(',');
            for (let i = 0; i < pieces.length; i++) {
                const p = parseSegment(pieces[i].trim());
                if (!p) continue;
                if (p.kind === 'single') min = Math.min(min, p.n);
                else min = Math.min(min, p.lo, p.hi);
            }
            return Number.isFinite(min) ? min : 1;
        },

        /** Highest page index referenced by valid segments; 0 if none (caller may treat as no contribution). */
        maxPageInSpec: function (raw) {
            let max = 0;
            const pieces = String(raw == null ? '' : raw).split(',');
            for (let i = 0; i < pieces.length; i++) {
                const p = parseSegment(pieces[i].trim());
                if (!p) continue;
                if (p.kind === 'single') max = Math.max(max, p.n);
                else max = Math.max(max, p.lo, p.hi);
            }
            return max;
        },

        shiftForInsert: function (raw, insertAt) {
            const at = parseInt(insertAt, 10);
            if (!Number.isFinite(at) || at <= 0) return String(raw == null ? '' : raw);
            const pieces = String(raw == null ? '' : raw).split(',');
            const out = [];
            for (let i = 0; i < pieces.length; i++) {
                const trimmed = pieces[i].trim();
                if (!trimmed) {
                    out.push('');
                    continue;
                }
                const p = parseSegment(trimmed);
                if (!p) {
                    out.push(trimmed);
                    continue;
                }
                if (p.kind === 'single') {
                    const n = p.n >= at ? p.n + 1 : p.n;
                    out.push(String(n));
                } else {
                    const lo = p.lo >= at ? p.lo + 1 : p.lo;
                    const hi = p.hi >= at ? p.hi + 1 : p.hi;
                    out.push(`${lo}-${hi}`);
                }
            }
            return out.join(', ');
        },

        shiftForDelete: function (raw, deleteAt) {
            const at = parseInt(deleteAt, 10);
            if (!Number.isFinite(at) || at <= 0) return String(raw == null ? '' : raw);
            const pieces = String(raw == null ? '' : raw).split(',');
            const out = [];
            for (let i = 0; i < pieces.length; i++) {
                const trimmed = pieces[i].trim();
                if (!trimmed) {
                    out.push('');
                    continue;
                }
                const p = parseSegment(trimmed);
                if (!p) {
                    out.push(trimmed);
                    continue;
                }
                if (p.kind === 'single') {
                    const n = p.n > at ? p.n - 1 : p.n;
                    out.push(String(n));
                } else {
                    const lo = p.lo > at ? p.lo - 1 : p.lo;
                    const hi = p.hi > at ? p.hi - 1 : p.hi;
                    out.push(`${lo}-${hi}`);
                }
            }
            return out.join(', ');
        }
    };
})();

/**
 * Editor-only font dropdown list: base palette plus custom Google fonts from MASTER_SETTINGS.
 * Schemas keep options: window.AVAILABLE_FONTS; JSON-cloned schema breaks reference equality, so
 * isBuiltinFontPalette also matches a snapshot array equal to AVAILABLE_FONTS.
 */
const FontOptions = {
    isBuiltinFontPalette: function (resolvedOptions) {
        const ref = typeof window !== 'undefined' ? window.AVAILABLE_FONTS : null;
        if (!ref || !Array.isArray(ref)) return false;
        if (resolvedOptions === ref) return true;
        if (!Array.isArray(resolvedOptions) || resolvedOptions.length !== ref.length) return false;
        for (let i = 0; i < ref.length; i++) {
            if (resolvedOptions[i] !== ref[i]) return false;
        }
        return true;
    },

    getEditorSelectOptions: function () {
        const combined = [...(typeof window !== 'undefined' && window.BASE_FONTS ? window.BASE_FONTS : [])];
        const custom = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.customFonts) ? MASTER_SETTINGS.customFonts : [];
        if (Array.isArray(custom)) {
            custom.forEach(function (cf) {
                if (cf) {
                    const formatted = '\'' + cf + '\', sans-serif';
                    if (combined.indexOf(formatted) === -1) combined.push(formatted);
                }
            });
        }
        return combined;
    }
};

// Safari 12 compatibility: provide a nullish-coalescing equivalent (replaces `??`).
function __nullish(value, fallback) {
    return value === null || value === undefined ? fallback : value;
}

(function () {
    // Safari 12 does not support `gap` for flexbox. We detect support once and
    // provide CSS-based spacing fallbacks using margins.
    try {
        var html = document && document.documentElement;
        if (!html || !html.classList || !document.body) return;

        // If already decided (or running in a browser with support), do nothing.
        if (html.classList.contains('no-flex-gap')) return;

        var test = document.createElement('div');
        test.style.display = 'flex';
        test.style.flexDirection = 'row';
        test.style.gap = '10px';
        test.style.position = 'absolute';
        test.style.left = '-9999px';
        test.style.top = '-9999px';

        var a = document.createElement('div');
        a.style.width = '10px';
        a.style.height = '1px';
        var b = document.createElement('div');
        b.style.width = '10px';
        b.style.height = '1px';

        test.appendChild(a);
        test.appendChild(b);
        document.body.appendChild(test);

        var rectA = a.getBoundingClientRect();
        var rectB = b.getBoundingClientRect();
        document.body.removeChild(test);

        // When flex-gap works, rectB.left - rectA.right should be close to the gap.
        var computedGap = rectB.left - rectA.right;
        if (!(computedGap > 5)) {
            html.classList.add('no-flex-gap');
        }
    } catch (e) {
        // If detection fails, prefer leaving layout as-is.
    }
})();

/**
 * Keyboard selection for dialog action buttons.
 * The default button is marked when a dialog opens. Left/Right (and Up/Down)
 * move between buttons. Enter runs the selected button.
 * Viewer-safe: no optional chaining or nullish coalescing.
 */
const DialogButtonKeys = (function () {
    var DECISION_SELECTOR = [
        '.ds-dialog-footer button',
        '.modal-footer button',
        '.cd-choices button',
        '.dashboard-dialog-actions button',
        '#modal-save-content > button'
    ].join(', ');
    var TOOLBAR_SELECTOR = [
        '.gallery-toolbar-row-actions button',
        '.audio-library-bulk button',
        '.gallery-preview-actions button'
    ].join(', ');
    var MODAL_SELECTOR = [
        '#driver-offline-warning.show',
        '.ds-dialog-backdrop.show',
        '.ds-dialog-host-backdrop.show',
        '#file-modal.show',
        '#gallery-modal.show',
        '#audio-gallery-modal.show',
        '#reset-canvas-wizard-modal.show',
        '#widget-preset-picker-modal.show',
        '#icon-modal.open'
    ].join(', ');
    var WATCH_IDS = [
        'custom-dialog',
        'driver-offline-warning',
        'file-modal',
        'gallery-modal',
        'audio-gallery-modal',
        'reset-canvas-wizard-modal',
        'widget-preset-picker-modal',
        'icon-modal'
    ];

    var state = {
        root: null,
        selected: null,
        buttons: [],
        hasDecision: false,
        didAutoFocus: false,
        focusing: false,
        scheduled: false
    };
    var observer = null;

    function tagName(el) {
        return (el && el.tagName) ? el.tagName.toLowerCase() : '';
    }

    function isForeignOverlayTarget(el) {
        if (!el || !el.closest) return false;
        if (el.closest('.ds-color-picker-panel')) return true;
        if (el.closest('.ds-editor-menu')) return true;
        return false;
    }

    function isEditableTarget(el) {
        if (!el || el === document.body || el === document.documentElement) return false;
        var tag = tagName(el);
        if (tag === 'textarea' || tag === 'select') return true;
        if (el.isContentEditable) return true;
        if (tag === 'input') {
            var type = String(el.type || 'text').toLowerCase();
            if (type === 'button' || type === 'submit' || type === 'checkbox' || type === 'radio' || type === 'file' || type === 'range' || type === 'color' || type === 'reset' || type === 'hidden') {
                return false;
            }
            return true;
        }
        return false;
    }

    function inputSubmitsDialog(el, root) {
        if (!el || !root || tagName(el) !== 'input') return false;
        if (root.id === 'custom-dialog') return true;
        if (el.id === 'save-filename') return true;
        return false;
    }

    function isVisibleControl(el, root) {
        if (!el || el.disabled) return false;
        if (el.hidden) return false;
        if (el.getAttribute && el.getAttribute('aria-disabled') === 'true') return false;
        if (el.classList && (el.classList.contains('is-hidden') || el.classList.contains('is-disabled') || el.classList.contains('pointer-events-none'))) {
            return false;
        }
        var node = el;
        while (node && node !== root && node !== document.documentElement) {
            if (node.hidden) return false;
            if (node.classList && node.classList.contains('is-hidden')) return false;
            var cs = window.getComputedStyle(node);
            if (!cs || cs.display === 'none' || cs.visibility === 'hidden') return false;
            node = node.parentElement;
        }
        return true;
    }

    function isActionable(btn, root) {
        if (!isVisibleControl(btn, root)) return false;
        if (btn.classList && btn.classList.contains('ds-dialog-close')) return false;
        return true;
    }

    function pushButtons(out, list, root) {
        if (!list) return;
        var i;
        for (i = 0; i < list.length; i++) {
            var btn = list[i];
            if (!isActionable(btn, root)) continue;
            if (out.indexOf(btn) === -1) out.push(btn);
        }
    }

    function collect(root) {
        var decision = [];
        var buttons = [];
        pushButtons(decision, root.querySelectorAll(DECISION_SELECTOR), root);
        pushButtons(buttons, decision, root);
        var toolbar = [];
        pushButtons(toolbar, root.querySelectorAll(TOOLBAR_SELECTOR), root);
        pushButtons(buttons, toolbar, root);
        if (!decision.length && !toolbar.length) {
            var closeBtn = root.querySelector('.ds-dialog-close');
            if (closeBtn && isVisibleControl(closeBtn, root) && !hasTextEntry(root)) {
                decision.push(closeBtn);
                buttons.push(closeBtn);
            }
        }
        return { buttons: buttons, hasDecision: decision.length > 0 };
    }

    function pickDefault(buttons) {
        var i;
        var lastPrimary = null;
        var confirmBtn = null;
        var firstChoice = null;
        for (i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            if (btn.classList.contains('primary')) lastPrimary = btn;
            if (btn.classList.contains('dashboard-dialog-btn-confirm')) confirmBtn = btn;
            if (!firstChoice && btn.closest && btn.closest('.cd-choices')) firstChoice = btn;
        }
        if (lastPrimary) return lastPrimary;
        if (confirmBtn) return confirmBtn;
        if (firstChoice) return firstChoice;
        return buttons.length ? buttons[buttons.length - 1] : null;
    }

    function hasTextEntry(root) {
        var fields = root.querySelectorAll('input, textarea');
        var i;
        for (i = 0; i < fields.length; i++) {
            var el = fields[i];
            if (!isVisibleControl(el, root)) continue;
            if (tagName(el) === 'textarea') return true;
            var type = String(el.type || 'text').toLowerCase();
            if (type === 'hidden' || type === 'checkbox' || type === 'radio' || type === 'button' || type === 'submit' || type === 'file' || type === 'range' || type === 'color' || type === 'reset') {
                continue;
            }
            return true;
        }
        return false;
    }

    function hasInitialTextField(root) {
        return hasTextEntry(root);
    }

    function clearMarks() {
        var marked = document.querySelectorAll('.is-kb-selected');
        var i;
        for (i = 0; i < marked.length; i++) marked[i].classList.remove('is-kb-selected');
    }

    function markSelected(btn) {
        clearMarks();
        state.selected = btn || null;
        if (btn) btn.classList.add('is-kb-selected');
    }

    function focusEl(el) {
        if (!el || typeof el.focus !== 'function') return;
        state.focusing = true;
        try {
            el.focus({ preventScroll: true });
        } catch (err) {
            try { el.focus(); } catch (err2) { /* ignore */ }
        }
        state.focusing = false;
    }

    function isShown(el) {
        return !!(el && el.classList && el.classList.contains('show'));
    }

    function pickHighest(nodes) {
        var best = null;
        var bestZ = -1;
        var i;
        for (i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            var z = parseInt(window.getComputedStyle(el).zIndex, 10);
            if (isNaN(z)) z = 0;
            if (!best || z > bestZ || z === bestZ) {
                best = el;
                bestZ = z;
            }
        }
        return best;
    }

    function topDialog() {
        var custom = document.getElementById('custom-dialog');
        if (isShown(custom)) return custom;
        var nodes = document.querySelectorAll(MODAL_SELECTOR);
        var best = pickHighest(nodes);
        if (best) return best;
        var dash = document.getElementById('dashboard-dialog-root');
        if (dash && dash.parentNode && !(dash.classList && dash.classList.contains('is-preview'))) return dash;
        return null;
    }

    function refresh() {
        var root = topDialog();
        if (!root) {
            clearMarks();
            state.root = null;
            state.selected = null;
            state.buttons = [];
            state.hasDecision = false;
            state.didAutoFocus = false;
            return;
        }
        var opened = state.root !== root;
        if (opened) {
            state.root = root;
            state.selected = null;
            state.didAutoFocus = false;
        }
        var pack = collect(root);
        state.buttons = pack.buttons;
        state.hasDecision = pack.hasDecision;
        if (state.selected && state.buttons.indexOf(state.selected) === -1) state.selected = null;
        if (!state.selected && state.buttons.length) state.selected = pickDefault(state.buttons);
        if (state.hasDecision && state.selected) {
            markSelected(state.selected);
        } else if (state.selected && document.activeElement === state.selected) {
            markSelected(state.selected);
        } else {
            clearMarks();
            if (!state.hasDecision) state.selected = state.buttons.length ? pickDefault(state.buttons) : null;
        }
        if (!state.didAutoFocus && state.hasDecision && state.selected) {
            state.didAutoFocus = true;
            if (!hasInitialTextField(root)) {
                var active = document.activeElement;
                var typing = active && root.contains(active) && isEditableTarget(active);
                if (!typing) focusEl(state.selected);
            }
        }
    }

    function schedule() {
        if (state.scheduled) return;
        state.scheduled = true;
        var raf = window.requestAnimationFrame || function (fn) { setTimeout(fn, 16); };
        raf(function () {
            state.scheduled = false;
            refresh();
        });
    }

    function isArrowKey(e) {
        if (!e) return '';
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') return e.key;
        if (e.keyCode === 37) return 'ArrowLeft';
        if (e.keyCode === 38) return 'ArrowUp';
        if (e.keyCode === 39) return 'ArrowRight';
        if (e.keyCode === 40) return 'ArrowDown';
        return '';
    }

    function isEnterKey(e) {
        return !!(e && (e.key === 'Enter' || e.keyCode === 13));
    }

    function isTabKey(e) {
        return !!(e && (e.key === 'Tab' || e.keyCode === 9));
    }

    function focusables(root) {
        var nodes = root.querySelectorAll('button, input, select, textarea, a[href], [tabindex]');
        var out = [];
        var i;
        for (i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            if (el.tabIndex < 0) continue;
            if (!isVisibleControl(el, root)) continue;
            var tag = tagName(el);
            if (tag === 'input' && String(el.type || '').toLowerCase() === 'hidden') continue;
            if (tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'a') {
                out.push(el);
            } else if (el.getAttribute('tabindex') !== null) {
                out.push(el);
            }
        }
        return out;
    }

    function activate(e, btn) {
        if (!btn || btn.disabled) return;
        e.preventDefault();
        e.stopPropagation();
        btn.click();
    }

    function onKeyUp(e) {
        if (!isEnterKey(e) || !state.root || !state.buttons) return;
        var target = e.target;
        if (target && state.buttons.indexOf(target) !== -1) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    function onFocusIn(e) {
        if (state.focusing) return;
        var root = topDialog();
        if (!root || !e.target || !root.contains(e.target)) return;
        if (!state.buttons || state.root !== root) refresh();
        if (state.buttons && state.buttons.indexOf(e.target) !== -1) {
            markSelected(e.target);
        }
    }

    function onKey(e) {
        if (!e || isForeignOverlayTarget(e.target)) return;
        var arrow = isArrowKey(e);
        var enter = isEnterKey(e);
        var tab = isTabKey(e);
        if (!arrow && !enter && !tab) return;
        refresh();
        if (!state.root) return;

        if (tab) {
            var list = focusables(state.root);
            if (!list.length) return;
            e.preventDefault();
            e.stopPropagation();
            var cur = document.activeElement;
            var idx = list.indexOf(cur);
            var dir = e.shiftKey ? -1 : 1;
            var next;
            if (idx === -1) {
                next = (state.selected && list.indexOf(state.selected) !== -1)
                    ? state.selected
                    : (e.shiftKey ? list[list.length - 1] : list[0]);
            } else {
                next = list[(idx + dir + list.length) % list.length];
            }
            focusEl(next);
            if (state.buttons.indexOf(next) !== -1) markSelected(next);
            return;
        }

        if (arrow) {
            if (e.altKey || e.ctrlKey || e.metaKey) return;
            if (!state.buttons || state.buttons.length < 2) return;
            var arrowTarget = e.target;
            if (isEditableTarget(arrowTarget)) return;
            if (arrowTarget && tagName(arrowTarget) === 'button' && state.root.contains(arrowTarget) && state.buttons.indexOf(arrowTarget) === -1) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            var from = state.buttons.indexOf(state.selected);
            if (from < 0 && arrowTarget && state.buttons.indexOf(arrowTarget) !== -1) from = state.buttons.indexOf(arrowTarget);
            if (from < 0) from = 0;
            var step = (arrow === 'ArrowLeft' || arrow === 'ArrowUp') ? -1 : 1;
            var moved = state.buttons[(from + step + state.buttons.length) % state.buttons.length];
            markSelected(moved);
            focusEl(moved);
            return;
        }

        if (!enter || e.repeat || e.altKey || !state.hasDecision || !state.selected) return;
        var target = e.target;
        var ctrl = !!(e.ctrlKey || e.metaKey);
        if (target && tagName(target) === 'textarea') {
            if (!ctrl || e.shiftKey) return;
            activate(e, pickDefault(state.buttons) || state.selected);
            return;
        }
        if (ctrl || e.shiftKey) return;
        if (target && state.buttons.indexOf(target) !== -1) {
            activate(e, target);
            return;
        }
        if (target && tagName(target) === 'button' && state.root.contains(target)) return;
        if (isEditableTarget(target)) {
            if (inputSubmitsDialog(target, state.root)) activate(e, state.selected);
            return;
        }
        activate(e, state.selected);
    }

    function watchNode(el) {
        if (!el || !observer || el._dsKbWatch) return;
        el._dsKbWatch = true;
        observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    }

    function onMutations(mutations) {
        var i;
        var j;
        for (i = 0; i < mutations.length; i++) {
            var rec = mutations[i];
            if (rec.type === 'attributes') {
                if (typeof DialogDragManager !== 'undefined' && rec.target) {
                    var clsName = rec.target.className || '';
                    if (clsName.indexOf('show') !== -1 || clsName.indexOf('open') !== -1) {
                        DialogDragManager.onDialogShow(rec.target);
                    } else {
                        DialogDragManager.onDialogClose(rec.target);
                    }
                }
                schedule();
                continue;
            }
            var added = rec.addedNodes;
            if (!added) continue;
            for (j = 0; j < added.length; j++) {
                var n = added[j];
                if (!n || n.nodeType !== 1) continue;
                if (typeof DialogDragManager !== 'undefined') {
                    DialogDragManager.bindDialog(n);
                }
                var cls = n.classList;
                if (n.id === 'dashboard-dialog-root' || (cls && (cls.contains('ds-dialog-backdrop') || cls.contains('ds-dialog-host-backdrop')))) {
                    watchNode(n);
                    schedule();
                }
            }
        }
    }

    function install() {
        if (!document.body || observer) return;
        observer = new MutationObserver(onMutations);
        var i;
        for (i = 0; i < WATCH_IDS.length; i++) watchNode(document.getElementById(WATCH_IDS[i]));
        observer.observe(document.body, { childList: true });
        var canvas = document.getElementById('dashboard-canvas');
        if (canvas) observer.observe(canvas, { childList: true });
        var dash = document.getElementById('dashboard-dialog-root');
        if (dash) watchNode(dash);
        if (typeof DialogDragManager !== 'undefined') {
            DialogDragManager.init();
        }
        document.addEventListener('keydown', onKey, true);
        document.addEventListener('keyup', onKeyUp, true);
        document.addEventListener('focusin', onFocusIn, true);
    }

    if (document.body) install();
    else document.addEventListener('DOMContentLoaded', install);

    return { refresh: refresh };
})();

/**
 * Shared draggable and resizable dialog controller for Dashboard Studio.
 * Supports titlebar dragging for all modals, and corner resizing for gallery dialogs.
 * Bounds are session-only in memory (never localStorage), so dialogs always open centered on page reload.
 */
var DialogDragManager = (function () {
    var sessionBounds = Object.create(null);
    var RESIZABLE_DIALOGS = {
        'gallery-modal': { minW: 480, minH: 340 },
        'audio-gallery-modal': { minW: 440, minH: 320 },
        'icon-modal': { minW: 480, minH: 340 },
        'reset-canvas-wizard-modal': { minW: 560, minH: 380 },
        'file-modal': { minW: 480, minH: 320 }
    };

    var DRAGGABLE_MODAL_IDS = [
        'custom-dialog',
        'driver-offline-warning',
        'file-modal',
        'gallery-modal',
        'audio-gallery-modal',
        'reset-canvas-wizard-modal',
        'icon-modal'
    ];

    function resetPanelPosition(panel) {
        if (!panel) return;
        panel.style.position = '';
        panel.style.left = '';
        panel.style.top = '';
        panel.style.right = '';
        panel.style.bottom = '';
        panel.style.margin = '';
        panel.style.transform = '';
    }

    function resetPanelSize(panel) {
        if (!panel) return;
        panel.style.width = '';
        panel.style.height = '';
        panel.style.maxWidth = '';
        panel.style.maxHeight = '';
    }

    function getModalRoot(panel) {
        if (!panel) return null;
        var cur = panel;
        while (cur && cur !== document.body) {
            if (cur.id && (cur.id in RESIZABLE_DIALOGS || DRAGGABLE_MODAL_IDS.indexOf(cur.id) !== -1)) {
                return cur;
            }
            if (cur.classList && (cur.classList.contains('ds-dialog-backdrop') || cur.classList.contains('ds-dialog-host-backdrop'))) {
                return cur;
            }
            cur = cur.parentElement;
        }
        return panel.parentElement || panel;
    }

    function applySessionBounds(panel, id, opts) {
        if (!panel || !id) return;
        var b = sessionBounds[id];
        if (!b) {
            resetPanelPosition(panel);
            resetPanelSize(panel);
            return;
        }
        var isResizable = !!(opts || (id in RESIZABLE_DIALOGS));
        var minW = (opts && opts.minW) || 320;
        var minH = (opts && opts.minH) || 240;
        var maxW = Math.max(minW, window.innerWidth - 16);
        var maxH = Math.max(minH, window.innerHeight - 16);
        var w = Math.min(Math.max(b.w, minW), maxW);
        var h = Math.min(Math.max(b.h, minH), maxH);
        var maxX = Math.max(0, window.innerWidth - 80);
        var maxY = Math.max(0, window.innerHeight - 48);
        var x = Math.min(Math.max(b.left, 0), maxX);
        var y = Math.min(Math.max(b.top, 0), maxY);
        if (x + w > window.innerWidth - 8) x = Math.max(0, window.innerWidth - w - 8);
        if (y + h > window.innerHeight - 8) y = Math.max(0, window.innerHeight - h - 8);

        panel.style.position = 'fixed';
        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
        if (isResizable && b.resized) {
            panel.style.width = w + 'px';
            panel.style.height = h + 'px';
            panel.style.maxWidth = 'none';
            panel.style.maxHeight = 'none';
        } else {
            panel.style.width = '';
            panel.style.height = '';
            panel.style.maxWidth = '';
            panel.style.maxHeight = '';
        }
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        panel.style.margin = '0';
        panel.style.transform = 'none';
    }

    function bindDialog(root) {
        if (!root || root.nodeType !== 1) return;
        var modal = root;
        var panel = null;
        if (modal.classList && (modal.classList.contains('modal-content') || modal.classList.contains('cd-box') || modal.classList.contains('icon-browser') || modal.classList.contains('ds-dialog'))) {
            panel = modal;
            modal = getModalRoot(panel);
        } else {
            panel = modal.querySelector('.modal-content, .cd-box, .icon-browser, .ds-dialog');
        }
        if (!panel) return;
        if (panel._dsDragBound) return;
        if (modal && modal.id === 'widget-preset-picker-modal') return;
        if (panel.classList && panel.classList.contains('ds-dialog-host-panel')) return;

        var header = panel.querySelector('.modal-header, .ds-dialog-header, .ib-header');
        if (!header) return;

        if (typeof PointerDrag === 'undefined' || typeof PointerDrag.bind !== 'function') {
            setTimeout(function () { bindDialog(root); }, 50);
            return;
        }

        panel._dsDragBound = true;
        header.style.touchAction = 'none';

        var modalId = (modal && modal.id) ? modal.id : '';
        var isResizable = modalId && (modalId in RESIZABLE_DIALOGS);
        var resizableOpts = isResizable ? RESIZABLE_DIALOGS[modalId] : null;

        var dragCtx = null;
        PointerDrag.bind(header, {
            raf: false,
            shouldStart: function (e) {
                if (!panel) return false;
                var t = e.target;
                if (t && t.closest) {
                    if (t.closest('button, a, input, textarea, select, label, .ds-dialog-close, [role="button"], .rcw-step-dots')) {
                        return false;
                    }
                }
                return true;
            },
            onDown: function (e) {
                var r = panel.getBoundingClientRect();
                if (!panel.style.width) {
                    panel.style.width = Math.round(r.width) + 'px';
                }
                if (isResizable && !panel.style.height) {
                    panel.style.height = Math.round(r.height) + 'px';
                }
                panel.style.position = 'fixed';
                panel.style.left = r.left + 'px';
                panel.style.top = r.top + 'px';
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
                panel.style.margin = '0';
                panel.style.transform = 'none';
                dragCtx = { dx: e.clientX - r.left, dy: e.clientY - r.top };
                return dragCtx;
            },
            onMove: function (ev) {
                if (!dragCtx || !panel) return;
                var x = ev.clientX - dragCtx.dx;
                var y = ev.clientY - dragCtx.dy;
                var maxX = Math.max(0, window.innerWidth - 80);
                var maxY = Math.max(0, window.innerHeight - 48);
                if (x < 0) x = 0;
                if (y < 0) y = 0;
                if (x > maxX) x = maxX;
                if (y > maxY) y = maxY;
                panel.style.left = x + 'px';
                panel.style.top = y + 'px';
            },
            onUp: function () {
                dragCtx = null;
                if (modalId) {
                    var r = panel.getBoundingClientRect();
                    var prev = sessionBounds[modalId] || {};
                    sessionBounds[modalId] = {
                        left: Math.round(r.left),
                        top: Math.round(r.top),
                        w: Math.round(r.width),
                        h: Math.round(r.height),
                        resized: !!prev.resized
                    };
                }
            }
        });

        if (isResizable) {
            var handle = panel.querySelector('.wpp-resize, .ds-dialog-resize');
            if (!handle) {
                handle = document.createElement('div');
                handle.className = 'wpp-resize ds-dialog-resize';
                handle.title = 'Resize';
                handle.setAttribute('aria-hidden', 'true');
                panel.appendChild(handle);
            }
            handle.style.touchAction = 'none';

            var resizeCtx = null;
            PointerDrag.bind(handle, {
                raf: false,
                onDown: function (e) {
                    var r = panel.getBoundingClientRect();
                    panel.style.position = 'fixed';
                    panel.style.left = r.left + 'px';
                    panel.style.top = r.top + 'px';
                    panel.style.right = 'auto';
                    panel.style.bottom = 'auto';
                    panel.style.margin = '0';
                    panel.style.transform = 'none';
                    panel.style.maxWidth = 'none';
                    panel.style.maxHeight = 'none';
                    var minW = resizableOpts.minW || 440;
                    var minH = resizableOpts.minH || 320;
                    resizeCtx = {
                        startW: r.width,
                        startH: r.height,
                        startX: e.clientX,
                        startY: e.clientY,
                        left: r.left,
                        top: r.top,
                        minW: minW,
                        minH: minH
                    };
                    return resizeCtx;
                },
                onMove: function (ev) {
                    if (!resizeCtx || !panel) return;
                    var w = resizeCtx.startW + (ev.clientX - resizeCtx.startX);
                    var h = resizeCtx.startH + (ev.clientY - resizeCtx.startY);
                    var maxW = Math.max(resizeCtx.minW, window.innerWidth - 16);
                    var maxH = Math.max(resizeCtx.minH, window.innerHeight - 16);
                    w = Math.min(Math.max(w, resizeCtx.minW), maxW);
                    h = Math.min(Math.max(h, resizeCtx.minH), maxH);
                    if (resizeCtx.left + w > window.innerWidth - 8) {
                        w = Math.max(resizeCtx.minW, window.innerWidth - resizeCtx.left - 8);
                    }
                    if (resizeCtx.top + h > window.innerHeight - 8) {
                        h = Math.max(resizeCtx.minH, window.innerHeight - resizeCtx.top - 8);
                    }
                    panel.style.width = Math.round(w) + 'px';
                    panel.style.height = Math.round(h) + 'px';
                },
                onUp: function () {
                    resizeCtx = null;
                    if (modalId) {
                        var r = panel.getBoundingClientRect();
                        sessionBounds[modalId] = {
                            left: Math.round(r.left),
                            top: Math.round(r.top),
                            w: Math.round(r.width),
                            h: Math.round(r.height),
                            resized: true
                        };
                    }
                }
            });
        }
    }

    function init() {
        var i;
        for (i = 0; i < DRAGGABLE_MODAL_IDS.length; i++) {
            var el = document.getElementById(DRAGGABLE_MODAL_IDS[i]);
            if (el) bindDialog(el);
        }

        window.addEventListener('resize', function () {
            var openPanels = document.querySelectorAll('.show .modal-content, .show .cd-box, .open .icon-browser, .show .ds-dialog');
            for (var k = 0; k < openPanels.length; k++) {
                var p = openPanels[k];
                if (p.style.position === 'fixed' && p.style.left) {
                    var left = parseFloat(p.style.left) || 0;
                    var top = parseFloat(p.style.top) || 0;
                    var maxX = Math.max(0, window.innerWidth - 80);
                    var maxY = Math.max(0, window.innerHeight - 48);
                    if (left > maxX) p.style.left = maxX + 'px';
                    if (top > maxY) p.style.top = maxY + 'px';
                    if (p.offsetWidth > window.innerWidth - 16) p.style.width = Math.max(320, window.innerWidth - 16) + 'px';
                    if (p.offsetHeight > window.innerHeight - 16) p.style.height = Math.max(240, window.innerHeight - 16) + 'px';
                }
            }
        });
    }

    function onDialogShow(modalEl) {
        if (!modalEl) return;
        var id = modalEl.id;
        var panel = modalEl.querySelector('.modal-content, .cd-box, .icon-browser, .ds-dialog');
        if (!panel) return;
        if (panel.classList && panel.classList.contains('ds-dialog-host-panel')) return;
        if (id === 'widget-preset-picker-modal') return;
        if (!panel._dsDragBound) bindDialog(modalEl);

        if (id && sessionBounds[id]) {
            applySessionBounds(panel, id, RESIZABLE_DIALOGS[id]);
        } else {
            resetPanelPosition(panel);
            resetPanelSize(panel);
        }
    }

    function onDialogClose(modalEl) {
        if (!modalEl) return;
        var id = modalEl.id;
        var panel = modalEl.querySelector('.modal-content, .cd-box, .icon-browser, .ds-dialog');
        if (!panel) return;
        if (panel.classList && panel.classList.contains('ds-dialog-host-panel')) return;
        if (id === 'widget-preset-picker-modal') return;
        if (!id || !sessionBounds[id]) {
            resetPanelPosition(panel);
            resetPanelSize(panel);
        }
    }

    return {
        init: init,
        bindDialog: bindDialog,
        onDialogShow: onDialogShow,
        onDialogClose: onDialogClose,
        resetPanelPosition: resetPanelPosition,
        resetPanelSize: resetPanelSize
    };
})();

window.DialogDragManager = DialogDragManager;

/**
 * Shared selection helper for Image and Audio galleries.
 * Handles single-select, Ctrl/Cmd-select, and Shift-range select with persistent anchor.
 */
var GallerySelection = {
    updateUi: function (gallery) {
        if (!gallery) return;
        if (typeof gallery.syncSelectionUi === 'function') {
            gallery.syncSelectionUi();
        } else if (typeof gallery.render === 'function') {
            gallery.render();
        }
        if (typeof gallery.updateActionButtons === 'function') {
            gallery.updateActionButtons();
        }
    },

    selectSingle: function (gallery, name, index, filterFn) {
        if (!gallery || !gallery.selected) return;
        if (filterFn && !filterFn(name)) return;
        gallery.selected.clear();
        gallery.selected.add(name);
        gallery.lastAnchorIndex = typeof index === 'number' ? index : -1;
        GallerySelection.updateUi(gallery);
    },

    toggleOne: function (gallery, name, index, filterFn) {
        if (!gallery || !gallery.selected) return;
        if (filterFn && !filterFn(name)) return;
        if (gallery.selected.has(name)) {
            gallery.selected.delete(name);
        } else {
            gallery.selected.add(name);
        }
        gallery.lastAnchorIndex = typeof index === 'number' ? index : -1;
        GallerySelection.updateUi(gallery);
    },

    selectRange: function (gallery, endIndex, filterFn) {
        if (!gallery || !gallery.selected || typeof gallery.getVisibleFiles !== 'function') return;
        var visible = gallery.getVisibleFiles() || [];
        var end = visible[endIndex];
        if (!end) return;

        var anchor = typeof gallery.lastAnchorIndex === 'number' ? gallery.lastAnchorIndex : -1;
        if (anchor < 0 || anchor >= visible.length) {
            gallery.selected.clear();
            if (!filterFn || filterFn(end)) {
                gallery.selected.add(end.name);
            }
            gallery.lastAnchorIndex = endIndex;
            GallerySelection.updateUi(gallery);
            return;
        }

        var startIdx = Math.min(anchor, endIndex);
        var endIdx = Math.max(anchor, endIndex);

        gallery.selected.clear();
        for (var i = startIdx; i <= endIdx; i++) {
            var file = visible[i];
            if (file && (!filterFn || filterFn(file))) {
                gallery.selected.add(file.name);
            }
        }
        GallerySelection.updateUi(gallery);
    },

    selectAll: function (gallery, filterFn) {
        if (!gallery || !gallery.selected || typeof gallery.getVisibleFiles !== 'function') return;
        var visible = gallery.getVisibleFiles() || [];
        for (var i = 0; i < visible.length; i++) {
            var file = visible[i];
            if (file && (!filterFn || filterFn(file))) {
                gallery.selected.add(file.name);
            }
        }
        GallerySelection.updateUi(gallery);
    },

    clear: function (gallery) {
        if (!gallery || !gallery.selected) return;
        gallery.selected.clear();
        gallery.lastAnchorIndex = -1;
        GallerySelection.updateUi(gallery);
    },

    handleItemClick: function (gallery, event, name, index, filterFn) {
        if (!gallery || !event) return;
        if (filterFn && !filterFn(name)) return;

        if (event.shiftKey) {
            GallerySelection.selectRange(gallery, index, filterFn);
            return;
        }

        if (event.ctrlKey || event.metaKey) {
            GallerySelection.toggleOne(gallery, name, index, filterFn);
            return;
        }

        GallerySelection.selectSingle(gallery, name, index, filterFn);
    }
};

window.GallerySelection = GallerySelection;

const CustomDialog = {
    _resolve: null,

    // Shows a simple alert with an OK button
    alert: function (message, title = "System Message", options = {}) {
        return new Promise((resolve) => {
            this._show(title, message, 'alert', resolve, "", options || {});
        });
    },

    // Shows a confirmation dialog with OK/Cancel
    confirm: function (message, title = "Confirmation Required") {
        return new Promise((resolve) => {
            this._show(title, message, 'confirm', resolve);
        });
    },

    // Shows a confirmation dialog with custom button labels
    confirmWithLabels: function (message, title = "Confirmation Required", okLabel = "Yes", cancelLabel = "No") {
        return new Promise((resolve) => {
            this._show(title, message, 'confirm', resolve, "", { okLabel: okLabel, cancelLabel: cancelLabel });
        });
    },

    // Shows an input dialog. Optional `options.markdownLinkTargetRadios` adds Same tab / New tab radios; OK then resolves `{ url, newTab }` instead of a string.
    // Optional `options.markdownImageFields` adds Width, Height, and Tint; OK then resolves `{ url, tint, width, height }`.
    prompt: function (message, defaultValue = "", title = "Input Required", options) {
        return new Promise((resolve) => {
            this._show(title, message, 'prompt', resolve, defaultValue, options || {});
        });
    },

    // Shows a large code dialog with textarea and optional extra action
    codePrompt: function (message, defaultValue = "", title = "Snippet", options = {}) {
        return new Promise((resolve) => {
            this._show(title, message, 'code', resolve, defaultValue, options);
        });
    },

    /** Batch URL paste dialog for Menu widget (textarea + favicon / title / new-tab options). */
    batchLinks: function (message, defaultValue = "", title = "Batch Add Weblinks", options = {}) {
        return new Promise((resolve) => {
            this._show(title, message, 'batchLinks', resolve, defaultValue, options);
        });
    },

    /**
     * Confirm-style dialog with custom extras. options.buildExtras(extrasEl) fills the body;
     * options.collect(extrasEl) runs on Apply (return false to keep the dialog open).
     */
    form: function (message, title = "Choose", options = {}) {
        return new Promise((resolve) => {
            this._show(title, message, 'form', resolve, "", options);
        });
    },

    // Replace / save as copy / skip — returns 'replace' | 'copy' | 'skip'
    chooseUploadConflict: function (message, title = "File already exists", options = {}) {
        const replaceLabel = options.replaceLabel || "Replace";
        const copyLabel = options.copyLabel || "Save as copy";
        const skipLabel = options.skipLabel || "Skip";
        return new Promise((resolve) => {
            this._show(title, message, 'chooseThree', resolve, "", { replaceLabel, copyLabel, skipLabel });
        });
    },

    /**
     * Pick one option from a vertical list. choices: [{ value: string, label: string }].
     * Resolves to value, or false on cancel.
     */
    chooseOne: function (message, title = "Choose", choices = []) {
        return new Promise((resolve) => {
            this._show(title, message, 'pickOne', resolve, "", { choices: choices || [] });
        });
    },

    _show: function (title, message, type, resolve, defaultValue = "", options = {}) {
        this._resolve = resolve;

        const modal = document.getElementById('custom-dialog');
        const titleEl = document.getElementById('cd-title');
        const titleIconEl = document.getElementById('cd-title-icon');
        const msgEl = document.getElementById('cd-msg');
        const inputEl = document.getElementById('cd-input');
        const textareaEl = document.getElementById('cd-textarea');
        const btnExtra = document.getElementById('cd-btn-extra');
        const btnCancel = document.getElementById('cd-btn-cancel');
        const btnOk = document.getElementById('cd-btn-ok');
        const btnClose = document.getElementById('cd-btn-close');
        const choicesEl = document.getElementById('cd-choices');

        if (!modal) {
            console.error("CustomDialog modal element not found in DOM");
            return resolve(false);
        }

        if (typeof DialogDragManager !== 'undefined') {
            DialogDragManager.resetPanelPosition(modal.querySelector('.cd-box'));
        }

        modal.classList.toggle('mode-code', type === 'code');
        modal.classList.toggle('mode-pick-one', type === 'pickOne');
        modal.classList.toggle('mode-batch-links', type === 'batchLinks');
        modal.classList.toggle('mode-form', type === 'form');
        modal.classList.toggle('mode-choose-three', type === 'chooseThree');

        // Map dialog type to a title icon for visual consistency with other dialogs.
        if (titleIconEl) {
            const iconByType = {
                alert: 'ph-info',
                confirm: 'ph-question',
                prompt: 'ph-pencil-simple-line',
                code: 'ph-code',
                batchLinks: 'ph-link',
                chooseThree: 'ph-warning',
                pickOne: 'ph-list-checks',
                form: 'ph-list-checks'
            };
            const iconName = iconByType[type] || 'ph-info';
            titleIconEl.className = 'ph-bold ' + iconName + ' ds-dialog-title-icon';
        }

        if (btnClose) {
            btnClose.onclick = () => this._close(type === 'prompt' || type === 'code' ? null : false);
        }

        if (choicesEl && type !== 'pickOne') {
            choicesEl.innerHTML = '';
            choicesEl.style.display = 'none';
        }

        // Setup Content
        titleEl.textContent = title;
        if (msgEl) {
            msgEl.className = 'cd-msg';
            if (options && options.messageClassName) {
                msgEl.className += ' ' + String(options.messageClassName);
            }
            if (options && options.allowHtml === true) {
                msgEl.innerHTML = String(message == null ? '' : message);
            } else {
                msgEl.innerHTML = String(message == null ? '' : message).replace(/\n/g, '<br>');
            }
        }

        // Setup Input
        if (type === 'prompt') {
            inputEl.style.display = 'block';
            if (textareaEl) textareaEl.style.display = 'none';
            inputEl.value = defaultValue;
            setTimeout(() => inputEl.focus(), 100); // Focus after render
        } else if (type === 'code' || type === 'batchLinks') {
            inputEl.style.display = 'none';
            if (textareaEl) {
                textareaEl.style.display = 'block';
                textareaEl.value = defaultValue || "";
                textareaEl.readOnly = options.readOnly === true;
                if (type === 'batchLinks') {
                    textareaEl.placeholder = options.placeholder || "https://example.com, My Link\nhttps://other.site";
                } else {
                    textareaEl.placeholder = options.placeholder || "Paste snippet code here...";
                }
                setTimeout(function () { textareaEl.focus(); }, 100);
            }
        } else if (type === 'pickOne') {
            inputEl.style.display = 'none';
            if (textareaEl) textareaEl.style.display = 'none';
            if (choicesEl) {
                choicesEl.innerHTML = '';
                choicesEl.style.display = 'flex';
                const list = options.choices || [];
                const self = this;
                for (let i = 0; i < list.length; i++) {
                    const c = list[i];
                    if (!c || c.value == null) continue;
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'btn-tool ds-dialog-button justify-center';
                    b.textContent = String(c.label != null ? c.label : c.value);
                    const val = c.value;
                    b.onclick = function () {
                        self._close(val);
                    };
                    choicesEl.appendChild(b);
                }
            }
        } else {
            inputEl.style.display = 'none';
            if (textareaEl) textareaEl.style.display = 'none';
        }

        const extrasEl = document.getElementById('cd-prompt-extras');
        if (extrasEl) {
            while (extrasEl.firstChild) {
                extrasEl.removeChild(extrasEl.firstChild);
            }
            if (type === 'prompt' && options && options.markdownLinkTargetRadios === true) {
                extrasEl.style.display = 'block';
                const fieldset = document.createElement('fieldset');
                fieldset.className = 'cd-markdown-link-target-fieldset';
                const legend = document.createElement('legend');
                legend.textContent = 'Open Link In';
                fieldset.appendChild(legend);
                const rows = document.createElement('div');
                rows.className = 'cd-markdown-link-target-rows';
                const idSame = 'cd-markdown-link-sametab';
                const idNew = 'cd-markdown-link-newtab';
                const name = 'cdMarkdownLinkTab';
                const labelSame = document.createElement('label');
                const radioSame = document.createElement('input');
                radioSame.type = 'radio';
                radioSame.name = name;
                radioSame.id = idSame;
                radioSame.value = 'same';
                radioSame.checked = true;
                labelSame.setAttribute('for', idSame);
                labelSame.appendChild(radioSame);
                labelSame.appendChild(document.createTextNode('Same tab'));
                const labelNew = document.createElement('label');
                const radioNew = document.createElement('input');
                radioNew.type = 'radio';
                radioNew.name = name;
                radioNew.id = idNew;
                radioNew.value = 'new';
                labelNew.setAttribute('for', idNew);
                labelNew.appendChild(radioNew);
                labelNew.appendChild(document.createTextNode('New tab'));
                rows.appendChild(labelSame);
                rows.appendChild(labelNew);
                fieldset.appendChild(rows);
                extrasEl.appendChild(fieldset);
            } else if (type === 'prompt' && options && options.markdownImageFields === true) {
                extrasEl.style.display = 'block';
                extrasEl.className = 'cd-prompt-extras cd-markdown-image-fields';
                this._markdownImageDialogTint = '';

                const widthRow = document.createElement('div');
                widthRow.className = 'cd-markdown-image-field-row';
                const widthLabel = document.createElement('label');
                widthLabel.textContent = 'Width (px, optional)';
                widthLabel.setAttribute('for', 'cd-markdown-image-width');
                const widthInput = document.createElement('input');
                widthInput.type = 'number';
                widthInput.id = 'cd-markdown-image-width';
                widthInput.className = 'control-input';
                widthInput.min = '0';
                widthInput.placeholder = 'Auto';
                widthRow.appendChild(widthLabel);
                widthRow.appendChild(widthInput);

                const heightRow = document.createElement('div');
                heightRow.className = 'cd-markdown-image-field-row';
                const heightLabel = document.createElement('label');
                heightLabel.textContent = 'Height (px, optional)';
                heightLabel.setAttribute('for', 'cd-markdown-image-height');
                const heightInput = document.createElement('input');
                heightInput.type = 'number';
                heightInput.id = 'cd-markdown-image-height';
                heightInput.className = 'control-input';
                heightInput.min = '0';
                heightInput.placeholder = 'Auto';
                heightRow.appendChild(heightLabel);
                heightRow.appendChild(heightInput);

                const tintRow = document.createElement('div');
                tintRow.className = 'cd-markdown-image-field-row';
                const tintLabel = document.createElement('label');
                tintLabel.textContent = 'Tint (optional)';
                const tintMount = document.createElement('div');
                tintMount.className = 'cd-markdown-image-tint-mount';
                tintRow.appendChild(tintLabel);
                tintRow.appendChild(tintMount);

                const selfDialog = this;
                if (typeof EditorColorPicker !== 'undefined' && typeof EditorColorPicker.attach === 'function') {
                    selfDialog._markdownImageDialogPicker = EditorColorPicker.attach({
                        mountCard: tintMount,
                        allowThemeTokens: true,
                        positionMode: 'anchor',
                        zIndex: 10060,
                        getRaw: function () {
                            return selfDialog._markdownImageDialogTint || '';
                        },
                        setValue: function (val) {
                            selfDialog._markdownImageDialogTint = val == null ? '' : String(val);
                        },
                        onClear: function () {
                            selfDialog._markdownImageDialogTint = '';
                        }
                    });
                } else {
                    selfDialog._markdownImageDialogPicker = null;
                    const tintFallback = document.createElement('input');
                    tintFallback.type = 'text';
                    tintFallback.id = 'cd-markdown-image-tint-fallback';
                    tintFallback.className = 'control-input';
                    tintFallback.placeholder = '#hex or @token';
                    tintMount.appendChild(tintFallback);
                }

                extrasEl.appendChild(widthRow);
                extrasEl.appendChild(heightRow);
                extrasEl.appendChild(tintRow);
            } else if (type === 'form' && typeof options.buildExtras === 'function') {
                extrasEl.style.display = 'block';
                extrasEl.className = 'cd-prompt-extras';
                options.buildExtras(extrasEl);
            } else if (type === 'batchLinks') {
                extrasEl.style.display = 'block';
                const fieldset = document.createElement('fieldset');
                fieldset.className = 'cd-batch-links-options';
                const legend = document.createElement('legend');
                legend.textContent = 'Options';
                fieldset.appendChild(legend);
                const rows = document.createElement('div');
                rows.className = 'cd-batch-links-option-rows';
                const batchCheckboxDefs = [
                    { id: 'cd-batch-links-favicon', label: 'Use favicon from site', checked: true },
                    { id: 'cd-batch-links-usetitle', label: 'Use title from site if not provided', checked: true },
                    { id: 'cd-batch-links-newtab', label: 'Open in new tab', checked: true }
                ];
                for (let bi = 0; bi < batchCheckboxDefs.length; bi++) {
                    const def = batchCheckboxDefs[bi];
                    const lbl = document.createElement('label');
                    lbl.setAttribute('for', def.id);
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.id = def.id;
                    cb.checked = def.checked !== false;
                    lbl.appendChild(cb);
                    lbl.appendChild(document.createTextNode(def.label));
                    rows.appendChild(lbl);
                }
                fieldset.appendChild(rows);
                extrasEl.appendChild(fieldset);
            } else {
                extrasEl.style.display = 'none';
            }
        }

        if (btnExtra) {
            btnExtra.style.display = 'none';
            btnExtra.onclick = null;
            btnExtra.disabled = false;
        }

        // Setup Buttons
        if (type === 'alert') {
            btnCancel.style.display = 'none';
            btnOk.className = "btn-tool ds-dialog-button primary";
            btnOk.textContent = 'OK';
            btnOk.onclick = () => this._close(true);
        } else {
            btnCancel.style.display = options.hideCancel === true ? 'none' : '';
            btnOk.className = "btn-tool ds-dialog-button primary";

            if (type === 'confirm') {
                btnOk.textContent = String(options.okLabel || 'Yes');
                btnCancel.textContent = String(options.cancelLabel || 'No');
                btnOk.onclick = () => this._close(true);
                btnCancel.onclick = () => this._close(false);
            } else if (type === 'code') {
                btnOk.textContent = String(options.okLabel || 'OK');
                btnCancel.textContent = String(options.cancelLabel || 'Cancel');
                btnOk.onclick = () => this._close({
                    action: 'ok',
                    value: textareaEl ? textareaEl.value : ''
                });

                if (btnExtra && options.extraLabel) {
                    btnExtra.style.display = 'block';
                    btnExtra.textContent = String(options.extraLabel);
                    btnExtra.className = String(options.extraClassName || 'btn-tool ds-dialog-button');
                    btnExtra.onclick = async () => {
                        if (typeof options.onExtra === 'function') {
                            await options.onExtra(textareaEl ? textareaEl.value : '', btnExtra);
                        }
                        if (options.closeOnExtra !== false) {
                            this._close({
                                action: 'extra',
                                value: textareaEl ? textareaEl.value : ''
                            });
                        }
                    };
                }
                btnCancel.onclick = () => this._close(false);
            } else if (type === 'batchLinks') {
                btnOk.textContent = String(options.okLabel || 'Add Links');
                btnCancel.textContent = String(options.cancelLabel || 'Cancel');
                btnOk.onclick = () => {
                    const favEl = document.getElementById('cd-batch-links-favicon');
                    const titleElOpt = document.getElementById('cd-batch-links-usetitle');
                    const tabEl = document.getElementById('cd-batch-links-newtab');
                    this._close({
                        action: 'ok',
                        text: textareaEl ? textareaEl.value : '',
                        favicon: !!(favEl && favEl.checked),
                        useTitle: !!(titleElOpt && titleElOpt.checked),
                        newTab: !!(tabEl && tabEl.checked)
                    });
                };
                btnCancel.onclick = () => this._close(false);
            } else if (type === 'chooseThree') {
                if (btnExtra) {
                    btnExtra.style.display = '';
                    btnExtra.textContent = String(options.copyLabel || 'Save as copy');
                    btnExtra.className = "btn-tool ds-dialog-button";
                    btnExtra.onclick = () => this._close('copy');
                }
                btnOk.textContent = String(options.replaceLabel || 'Replace');
                btnCancel.textContent = String(options.skipLabel || 'Skip');
                btnOk.className = "btn-tool ds-dialog-button danger";
                btnCancel.className = "btn-tool ds-dialog-button";
                btnOk.onclick = () => this._close('replace');
                btnCancel.onclick = () => this._close('skip');
            } else if (type === 'form') {
                btnOk.style.display = '';
                btnOk.textContent = String(options.okLabel || 'Apply');
                btnCancel.textContent = String(options.cancelLabel || 'Cancel');
                btnOk.onclick = () => {
                    if (typeof options.collect !== 'function') {
                        this._close(true);
                        return;
                    }
                    const collected = options.collect(extrasEl);
                    if (collected === false) return;
                    this._close(collected);
                };
                btnCancel.onclick = () => this._close(false);
            } else if (type === 'pickOne') {
                btnOk.style.display = 'none';
                btnCancel.textContent = 'Cancel';
                btnOk.onclick = null;
                btnCancel.onclick = () => this._close(false);
            } else if (type === 'prompt' && options && options.markdownLinkTargetRadios === true) {
                btnOk.style.display = '';
                btnOk.textContent = 'OK';
                btnCancel.textContent = 'Cancel';
                btnOk.onclick = () => {
                    const ntEl = document.getElementById('cd-markdown-link-newtab');
                    const nt = !!(ntEl && ntEl.checked);
                    this._close({ url: inputEl.value, newTab: nt });
                };
                btnCancel.onclick = () => this._close(false);
            } else if (type === 'prompt' && options && options.markdownImageFields === true) {
                btnOk.style.display = '';
                btnOk.textContent = 'OK';
                btnCancel.textContent = 'Cancel';
                btnOk.onclick = () => {
                    const wEl = document.getElementById('cd-markdown-image-width');
                    const hEl = document.getElementById('cd-markdown-image-height');
                    const tintFallback = document.getElementById('cd-markdown-image-tint-fallback');
                    let tint = this._markdownImageDialogTint || '';
                    if (tintFallback) tint = tintFallback.value;
                    const widthRaw = wEl ? wEl.value : '';
                    const heightRaw = hEl ? hEl.value : '';
                    const width = widthRaw !== '' ? parseFloat(widthRaw) : null;
                    const height = heightRaw !== '' ? parseFloat(heightRaw) : null;
                    this._close({
                        url: inputEl.value,
                        tint: tint,
                        width: Number.isFinite(width) && width > 0 ? width : null,
                        height: Number.isFinite(height) && height > 0 ? height : null
                    });
                };
                btnCancel.onclick = () => this._close(false);
            } else {
                btnOk.style.display = '';
                btnOk.textContent = 'OK';
                btnCancel.textContent = 'Cancel';
                btnOk.onclick = () => this._close(inputEl.value);
                btnCancel.onclick = () => this._close(false);
            }
        }

        inputEl.onkeydown = (e) => {
            if (e.key === 'Escape') btnCancel.click();
        };
        if (textareaEl) {
            textareaEl.onkeydown = (e) => {
                if (e.key === 'Escape') btnCancel.click();
            };
        }

        modal.classList.add('show');
        if (typeof DialogButtonKeys !== 'undefined' && DialogButtonKeys.refresh) DialogButtonKeys.refresh();
    },

    _close: function (result) {
        const modal = document.getElementById('custom-dialog');
        if (typeof DialogDragManager !== 'undefined') {
            DialogDragManager.resetPanelPosition(modal ? modal.querySelector('.cd-box') : null);
        }
        modal.classList.remove('mode-code');
        modal.classList.remove('mode-pick-one');
        modal.classList.remove('mode-batch-links');
        modal.classList.remove('mode-form');
        modal.classList.remove('mode-choose-three');
        modal.classList.remove('show');

        const choicesEl = document.getElementById('cd-choices');
        if (choicesEl) {
            choicesEl.innerHTML = '';
            choicesEl.style.display = 'none';
        }
        const extrasCleanup = document.getElementById('cd-prompt-extras');
        if (extrasCleanup) {
            while (extrasCleanup.firstChild) {
                extrasCleanup.removeChild(extrasCleanup.firstChild);
            }
            extrasCleanup.style.display = 'none';
            extrasCleanup.className = 'cd-prompt-extras';
        }
        if (this._markdownImageDialogPicker && typeof this._markdownImageDialogPicker.destroy === 'function') {
            this._markdownImageDialogPicker.destroy();
        }
        this._markdownImageDialogPicker = null;
        this._markdownImageDialogTint = null;
        const btnOk = document.getElementById('cd-btn-ok');
        if (btnOk) {
            btnOk.style.display = '';
            btnOk.disabled = false;
        }

        // Use a specialized return for prompt cancellation (null) vs confirmation
        if (this._resolve) {
            this._resolve(result);
            this._resolve = null;
        }
    }
};

/** Same-tab vs new-tab navigation for widgets (switch, menu, etc.). Text widget uses markdown `^` + `target="_blank"`. */
const UrlNavigation = {
    composeUrl: function (prefix, middle, suffix) {
        const mid = middle == null ? '' : String(middle);
        return String(prefix == null ? '' : prefix)
            + encodeURIComponent(mid)
            + String(suffix == null ? '' : suffix);
    },
    openUrl: function (url, openInNewTab) {
        const u = String(url == null ? '' : url).trim();
        if (!u) return;
        if (/^help:\/\//i.test(u)) {
            if (typeof HelpSystem !== 'undefined' && typeof HelpSystem.openHelpUrl === 'function') {
                HelpSystem.openHelpUrl(u);
            }
            return;
        }
        window.open(u, openInNewTab === true ? '_blank' : '_self');
    },
    openComposedUrl: function (prefix, middle, suffix, openInNewTab) {
        const u = UrlNavigation.composeUrl(prefix, middle, suffix).trim();
        if (!u) return;
        UrlNavigation.openUrl(u, openInNewTab);
    }
};

/** Favicon URL resolution via Google's S2 favicon service (domain-based, no CORS issues for <img>). */
const UrlFavicon = (function () {
    const cacheByHost = {};
    const GOOGLE_FAVICON_BASE = 'https://s2.googleusercontent.com/s2/favicons';
    const DEFAULT_SIZE = 128;

    function hostnameFromPageUrl(raw) {
        let s = String(raw == null ? '' : raw).trim();
        if (!s) return '';
        if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) {
            s = 'https://' + s;
        }
        try {
            return String(new URL(s).hostname || '');
        } catch (_e) {
            return '';
        }
    }

    function googleFaviconUrl(hostname, size) {
        const host = String(hostname || '').trim();
        if (!host) return '';
        const sz = size || DEFAULT_SIZE;
        return GOOGLE_FAVICON_BASE + '?domain=' + encodeURIComponent(host) + '&sz=' + sz;
    }

    return {
        resolveFaviconUrl: function (pageUrl) {
            const hostname = hostnameFromPageUrl(pageUrl);
            if (!hostname) return '';
            if (Object.prototype.hasOwnProperty.call(cacheByHost, hostname)) {
                return cacheByHost[hostname];
            }
            const fav = googleFaviconUrl(hostname, DEFAULT_SIZE);
            cacheByHost[hostname] = fav;
            var cKeys = Object.keys(cacheByHost);
            if (cKeys.length > 200) delete cacheByHost[cKeys[0]];
            return fav;
        }
    };
})();

/** Page title lookup for Batch Add Weblinks. Tries multiple sources and returns the first non-empty title. */
const UrlPageTitle = (function () {
    const PROXY_TIMEOUT_MS = 12000;
    const SERVER_TIMEOUT_MS = 12000;

    function isHomeyDriver() {
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        return String(M.dataDriver || '').toLowerCase() === 'homey' || String(M.dataDriver || '').toLowerCase() === 'homeassistant';
    }

    function normalizeTitle(raw) {
        return String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
    }

    function decodeEntities(s) {
        return String(s == null ? '' : s)
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&nbsp;/g, ' ');
    }

    function readTitleFromHtmlDocument(doc) {
        if (!doc) return '';
        const ogEl = doc.querySelector('meta[property="og:title"]');
        if (ogEl) {
            const c = ogEl.getAttribute('content');
            if (c) return c;
        }
        const twEl = doc.querySelector('meta[name="twitter:title"]');
        if (twEl) {
            const c = twEl.getAttribute('content');
            if (c) return c;
        }
        const titleEl = doc.querySelector('title');
        if (titleEl && titleEl.innerText) return titleEl.innerText;
        const h1 = doc.querySelector('h1');
        if (h1 && h1.innerText) return h1.innerText;
        return '';
    }

    function readTitleFromRawHtml(html) {
        const text = String(html == null ? '' : html);
        const ogM = text.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i)
            || text.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]*property=["']og:title["'][^>]*>/i);
        if (ogM && ogM[1]) return ogM[1];
        const twM = text.match(/<meta[^>]+name=["']twitter:title["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i)
            || text.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]*name=["']twitter:title["'][^>]*>/i);
        if (twM && twM[1]) return twM[1];
        const tagM = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (tagM && tagM[1]) return tagM[1];
        return '';
    }

    function fetchViaHomeyServer(pageUrl) {
        const url = String(pageUrl == null ? '' : pageUrl).trim();
        if (!url) return Promise.resolve('');
        let apiPath = 'url-page-title?url=' + encodeURIComponent(url);
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._authenticatedAssetUrl === 'function') {
            apiPath = Dashboard._authenticatedAssetUrl(apiPath);
        }
        if (apiPath.indexOf('/') !== 0) {
            apiPath = '/' + apiPath;
        }
        const serverPromise = fetch(apiPath, { method: 'GET', credentials: 'same-origin' })
            .then(function (res) {
                if (!res || !res.ok) return '';
                return res.json();
            })
            .then(function (data) {
                if (data && data.title) return normalizeTitle(decodeEntities(data.title));
                return '';
            })
            .catch(function () { return ''; });
        const timeoutPromise = new Promise(function (resolve) {
            setTimeout(function () { resolve(''); }, SERVER_TIMEOUT_MS);
        });
        return Promise.race([serverPromise, timeoutPromise]);
    }

    function fetchOneProxyEndpoint(endpoint, pageUrl) {
        const targetUrl = encodeURIComponent(pageUrl);
        const requestUrl = endpoint.url.replace('__TARGET__', targetUrl);
        let timeoutId = null;
        const fetchOpts = { method: 'GET' };
        if (typeof AbortController !== 'undefined') {
            const controller = new AbortController();
            fetchOpts.signal = controller.signal;
            timeoutId = setTimeout(function () { controller.abort(); }, PROXY_TIMEOUT_MS);
        }
        const fetchPromise = fetch(requestUrl, fetchOpts).then(function (response) {
            if (timeoutId) clearTimeout(timeoutId);
            if (!response || !response.ok) return '';
            if (endpoint.type === 'api') {
                return response.json().then(function (data) {
                    if (data && data.status === 'success' && data.data && data.data.title) {
                        return normalizeTitle(decodeEntities(data.data.title));
                    }
                    if (data && data.data && data.data.title) {
                        return normalizeTitle(decodeEntities(data.data.title));
                    }
                    return '';
                });
            }
            return response.text().then(function (htmlContent) {
                let fetchedTitle = '';
                if (typeof DOMParser !== 'undefined') {
                    try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(htmlContent, 'text/html');
                        fetchedTitle = readTitleFromHtmlDocument(doc);
                    } catch (_e) {
                        fetchedTitle = '';
                    }
                }
                if (!fetchedTitle) fetchedTitle = readTitleFromRawHtml(htmlContent);
                return fetchedTitle ? normalizeTitle(decodeEntities(fetchedTitle)) : '';
            });
        }).catch(function () {
            if (timeoutId) clearTimeout(timeoutId);
            return '';
        });
        if (typeof AbortController !== 'undefined') {
            return fetchPromise;
        }
        const timeoutPromise = new Promise(function (resolve) {
            setTimeout(function () { resolve(''); }, PROXY_TIMEOUT_MS);
        });
        return Promise.race([fetchPromise, timeoutPromise]);
    }

    function getProxyEndpoints() {
        return [
            { url: 'https://api.microlink.io/?url=__TARGET__', type: 'api' },
            { url: 'https://api.allorigins.win/raw?url=__TARGET__', type: 'html' },
            { url: 'https://corsproxy.io/?url=__TARGET__', type: 'html' },
            { url: 'https://thingproxy.freeboard.io/fetch/__TARGET__', type: 'html' }
        ];
    }

    function fetchViaPublicProxy(pageUrl) {
        const url = String(pageUrl == null ? '' : pageUrl).trim();
        if (!url) return Promise.resolve('');
        const endpoints = getProxyEndpoints();
        function tryNext(index) {
            if (index >= endpoints.length) return Promise.resolve('');
            return fetchOneProxyEndpoint(endpoints[index], url).then(function (title) {
                if (title) return title;
                return tryNext(index + 1);
            });
        }
        return tryNext(0);
    }

    function runChain(sources) {
        function tryNext(index) {
            if (index >= sources.length) return Promise.resolve('');
            const fn = sources[index];
            if (typeof fn !== 'function') return tryNext(index + 1);
            return Promise.resolve()
                .then(function () { return fn(); })
                .then(function (title) {
                    if (title) return title;
                    return tryNext(index + 1);
                })
                .catch(function () { return tryNext(index + 1); });
        }
        return tryNext(0);
    }

    return {
        isHomeyDriver: isHomeyDriver,
        fetchViaHomeyServer: fetchViaHomeyServer,
        fetchViaPublicProxy: fetchViaPublicProxy,
        fetchWebsiteTitle: function (pageUrl) {
            const url = String(pageUrl == null ? '' : pageUrl).trim();
            if (!url) return Promise.resolve('');
            const proxyFn = function () { return fetchViaPublicProxy(url); };
            if (isHomeyDriver()) {
                const serverFn = function () { return fetchViaHomeyServer(url); };
                return runChain([proxyFn, serverFn, proxyFn]);
            }
            return runChain([proxyFn]);
        }
    };
})();

const UIUtils = {
    createAccessLevelTag: function (getable, setable, verboseLabel = false, isFlow = false, isLocal = false) {
        let label = "Unknown";
        let shortLabel = "?";
        let bgColor = "#334155";

        if (isLocal) {
            label = "Local Topic"; shortLabel = "L"; bgColor = "#0284c7";
        } else if (isFlow) {
            label = "Flow Topic"; shortLabel = "F"; bgColor = "#8b5cf6";
        } else if (getable && setable) {
            label = "Read / Write"; shortLabel = "RW"; bgColor = "#059669";
        } else if (!getable && setable) {
            label = "Write Only"; shortLabel = "W"; bgColor = "#0891b2";
        } else if (getable && !setable) {
            label = "Read Only"; shortLabel = "R"; bgColor = "#d97706";
        }

        const display = verboseLabel ? label : shortLabel;
        const svgW = verboseLabel ? Math.round(display.length * 5.5 + 12) : 20;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="13" style="vertical-align:middle;margin-left:0.25rem;flex-shrink:0;color:white;" title="${label}"><rect width="${svgW}" height="13" rx="2" fill="${bgColor}"/><text x="${svgW / 2}" y="6.5" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-size="7" font-family="sans-serif" font-weight="700" letter-spacing="0.5">${display}</text></svg>`;
    }
};

const DashboardMathUtils = {
    // Calculates a clean, deduplicated set of axis ticks from data boundaries.
    // Returns { ticks: [{value, isPriority}], renderMin, renderMax, tickStep }.
    // Pixel/angle-level collision detection is left to each caller.
    calculateTicks(rawMin, rawMax, baseline, targetTickCount, roundingMode) {
        let renderMin = rawMin;
        let renderMax = rawMax;
        let tickStep = 1;
        const n = Math.max(1, targetTickCount);

        if (roundingMode === 'strict') {
            renderMin = Math.floor(renderMin);
            renderMax = Math.ceil(renderMax);
            tickStep = Math.max(1, Math.round((renderMax - renderMin) / n));
        } else if (roundingMode === 'smart') {
            const range = renderMax - renderMin;
            if (range > 0) {
                const rawStep = range / n;
                const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
                const normalized = rawStep / mag;
                let stepFactor = 10;
                if (normalized <= 1.5) stepFactor = 1;
                else if (normalized <= 3) stepFactor = 2;
                else if (normalized <= 7) stepFactor = 5;
                tickStep = stepFactor * mag;
                renderMin = Math.floor(renderMin / tickStep) * tickStep;
                renderMax = Math.ceil(renderMax / tickStep) * tickStep;
            }
        } else {
            tickStep = (renderMax - renderMin) / Math.max(1, n);
        }

        const effectiveBaseline = Math.max(renderMin, Math.min(renderMax, baseline));

        if (renderMax === renderMin) {
            renderMax = renderMin + 1;
            if (roundingMode === 'exact') tickStep = 1 / Math.max(1, n);
        }

        if (tickStep <= 0 || !isFinite(tickStep)) tickStep = 1;

        // Build ticks outward from the baseline anchor in both directions
        let rawTicks = [];
        let val = effectiveBaseline;
        let iter = 0;
        while (val <= renderMax + tickStep * 0.001 && iter++ < 1000) {
            if (val >= renderMin - tickStep * 0.001) rawTicks.push(val);
            val += tickStep;
        }
        val = effectiveBaseline - tickStep;
        iter = 0;
        while (val >= renderMin - tickStep * 0.001 && iter++ < 1000) {
            if (val <= renderMax + tickStep * 0.001) rawTicks.push(val);
            val -= tickStep;
        }

        // Guarantee min, max, and baseline are always represented
        if (!rawTicks.some(t => Math.abs(t - renderMin) < 0.0001)) rawTicks.push(renderMin);
        if (!rawTicks.some(t => Math.abs(t - renderMax) < 0.0001)) rawTicks.push(renderMax);
        if (!rawTicks.some(t => Math.abs(t - effectiveBaseline) < 0.0001)) rawTicks.push(effectiveBaseline);

        rawTicks.sort((a, b) => a - b);
        // Drop values too close to their neighbour to prevent doubled lines/labels
        rawTicks = rawTicks.filter((v, i, arr) => i === 0 || Math.abs(v - arr[i - 1]) > tickStep * 0.01);

        const ticks = rawTicks.map(t => ({
            value: t,
            isPriority:
                Math.abs(t - renderMin) < 0.0001 ||
                Math.abs(t - renderMax) < 0.0001 ||
                Math.abs(t - effectiveBaseline) < 0.0001
        }));

        return { ticks, renderMin, renderMax, tickStep };
    },

    /**
     * Graph value axis. Smart mode scores [1, 2, 5] x 10^k steps and returns only
     * ticks that sit on that step, counted from the baseline when one is set.
     * Gauge keeps calculateTicks.
     */
    calculateNiceTicks(rawMin, rawMax, options) {
        const opt = options || {};
        const mode = opt.roundingMode || 'smart';
        let dataMin = Number(rawMin);
        let dataMax = Number(rawMax);
        if (!isFinite(dataMin)) dataMin = 0;
        if (!isFinite(dataMax)) dataMax = 0;
        if (dataMax < dataMin) {
            const swap = dataMin;
            dataMin = dataMax;
            dataMax = swap;
        }

        const headroom = Math.max(0, Number(opt.headroomPct) || 0) / 100;
        const lockMin = (opt.lockMin != null && isFinite(Number(opt.lockMin))) ? Number(opt.lockMin) : null;
        const lockMax = (opt.lockMax != null && isFinite(Number(opt.lockMax))) ? Number(opt.lockMax) : null;
        const baselineActive = opt.baselineActive === true && opt.baseline != null && isFinite(Number(opt.baseline));
        const baseline = baselineActive ? Number(opt.baseline) : null;
        const clampMinToZero = opt.clampMinToZero === true && lockMin == null;

        let min = lockMin != null ? lockMin : dataMin;
        let max = lockMax != null ? lockMax : dataMax;
        if (max < min) {
            if (lockMin != null && lockMax == null) max = min;
            else if (lockMax != null && lockMin == null) min = max;
        }

        if (clampMinToZero && dataMin >= 0) {
            min = 0;
            if (lockMax == null) {
                const top = dataMax > 0 ? dataMax : 1;
                max = top + (top - min) * headroom;
            }
        } else if (max === min) {
            const pad = Math.abs(min) > 0 ? Math.abs(min) * 0.1 : 1;
            if (lockMin == null) min = min - (clampMinToZero ? 0 : pad);
            if (lockMax == null) max = max + pad;
            if (clampMinToZero && min < 0) min = 0;
            if (!(max > min) && lockMax == null) max = min + 1;
        } else if (headroom > 0) {
            const pad = (max - min) * headroom;
            if (lockMin == null && !(clampMinToZero && min === 0)) min -= pad;
            if (lockMax == null) max += pad;
            if (clampMinToZero && min < 0) min = 0;
        }

        if (!(max > min)) {
            if (lockMax == null) max = min + 1;
            else if (lockMin == null) min = max - 1;
        }

        const decimalsPref = (opt.decimals != null && isFinite(Number(opt.decimals)))
            ? Math.max(0, Math.floor(Number(opt.decimals)))
            : null;
        const targetIntervals = Math.max(1, Math.floor(Number(opt.targetIntervals) || 4));
        const minIntervals = Math.max(1, Math.floor(Number(opt.minIntervals) || (mode === 'smart' ? 3 : 1)));
        const maxIntervals = Math.max(minIntervals, Math.floor(Number(opt.maxIntervals) || (mode === 'smart' ? 8 : 12)));

        function decimalsForStep(step) {
            if (!(step > 0) || !isFinite(step)) return 0;
            let d = 0;
            let x = step;
            while (d < 8 && Math.abs(x - Math.round(x)) > 1e-6 * Math.max(1, Math.abs(x))) {
                x = x * 10;
                d++;
            }
            return d;
        }

        function snapTo(v, step) {
            const d = decimalsForStep(step);
            const f = Math.pow(10, d);
            return Math.round(v * f) / f;
        }

        function pack(niceMin, niceMax, step, intervals) {
            const ticks = [];
            const d = mode === 'smart' ? decimalsForStep(step) : (decimalsPref != null ? decimalsPref : decimalsForStep(step));
            for (let k = 0; k <= intervals; k++) {
                ticks.push(snapTo(niceMin + k * step, step));
            }
            return {
                ticks: ticks,
                renderMin: ticks[0],
                renderMax: ticks[ticks.length - 1],
                tickStep: step,
                decimals: d
            };
        }

        if (mode === 'exact') {
            const intervals = Math.max(1, targetIntervals);
            const step = (max - min) / intervals;
            const minStepDec = (step > 0 && step < 1) ? Math.max(0, Math.ceil(-Math.log10(step) + 1e-9)) : 0;
            const d = decimalsPref != null ? decimalsPref : minStepDec;
            const ticks = [];
            for (let k = 0; k <= intervals; k++) {
                ticks.push(snapTo(min + k * step, step));
            }
            return {
                ticks: ticks,
                renderMin: ticks[0],
                renderMax: ticks[ticks.length - 1],
                tickStep: step,
                decimals: d
            };
        }

        if (mode === 'strict') {
            if (lockMin == null) min = Math.floor(min);
            if (lockMax == null) max = Math.ceil(max);
            if (!(max > min)) max = min + 1;
            const anchor = baselineActive ? baseline : min;
            let step = Math.max(1, Math.round((max - min) / Math.max(1, targetIntervals)));
            if (baselineActive) {
                const span = Math.abs(max - min);
                step = Math.max(1, Math.round(span / Math.max(1, targetIntervals)));
            }
            const eps = step * 1e-6;
            let k0 = Math.floor((min - anchor) / step + 1e-8);
            let k1 = Math.ceil((max - anchor) / step - 1e-8);
            if (k1 <= k0) k1 = k0 + 1;
            let niceMin = anchor + k0 * step;
            let niceMax = anchor + k1 * step;
            if (lockMin != null && niceMin < lockMin - eps) {
                k0 = Math.ceil((lockMin - anchor) / step - 1e-8);
                niceMin = anchor + k0 * step;
            }
            if (lockMax != null && niceMax > lockMax + eps) {
                k1 = Math.floor((lockMax - anchor) / step + 1e-8);
                niceMax = anchor + k1 * step;
            }
            if (!(niceMax > niceMin)) {
                niceMin = min;
                niceMax = max;
                step = Math.max(1, niceMax - niceMin);
                return pack(niceMin, niceMax, step, 1);
            }
            return pack(niceMin, niceMax, step, Math.max(1, Math.round((niceMax - niceMin) / step)));
        }

        let anchor = min;
        if (baselineActive) anchor = baseline;
        else if (min <= 0 && max >= 0) anchor = 0;

        const span = Math.max(max - min, 1e-9);
        const rough = span / Math.max(1, targetIntervals);
        const mag = Math.pow(10, Math.floor(Math.log10(rough)));
        const factors = [1, 2, 5];
        const steps = [];
        for (let e = -3; e <= 4; e++) {
            const m = mag * Math.pow(10, e);
            if (!(m > 0) || !isFinite(m)) continue;
            for (let f = 0; f < factors.length; f++) steps.push(factors[f] * m);
        }

        if (mode === 'smart' && (lockMin != null || lockMax != null)) {
            const effMin = lockMin != null ? lockMin : min;
            const effMax = lockMax != null ? lockMax : max;
            const effSpan = Math.max(effMax - effMin, 1e-9);
            const effAnchor = (effMin <= 0 && effMax >= 0)
                ? 0
                : (baselineActive && baseline >= effMin && baseline <= effMax ? baseline : 0);

            let dualBest = null;
            for (let i = 0; i < steps.length; i++) {
                const sVal = steps[i];
                if (!(sVal > 0) || !isFinite(sVal)) continue;
                const k0 = Math.ceil((effMin - effAnchor) / sVal - 1e-8);
                const k1 = Math.floor((effMax - effAnchor) / sVal + 1e-8);
                if (k1 < k0) continue;
                const intervals = k1 - k0;
                const count = intervals + 1;
                if (count < 2 || count > (maxIntervals + 2)) continue;
                const firstTick = effAnchor + k0 * sVal;
                const lastTick = effAnchor + k1 * sVal;
                const white = Math.max(0, (firstTick - effMin) + (effMax - lastTick)) / effSpan;
                const penalty = 0.04 * Math.abs(intervals - targetIntervals);
                const score = white + penalty;
                if (!dualBest || score < dualBest.score - 1e-9) {
                    dualBest = { step: sVal, k0: k0, k1: k1, score: score };
                }
            }
            if (!dualBest) {
                for (let i = 0; i < steps.length; i++) {
                    const sVal = steps[i];
                    if (!(sVal > 0) || !isFinite(sVal)) continue;
                    const k0 = Math.ceil((effMin - effAnchor) / sVal - 1e-8);
                    const k1 = Math.floor((effMax - effAnchor) / sVal + 1e-8);
                    if (k1 < k0) continue;
                    const intervals = k1 - k0;
                    const score = 0.04 * Math.abs(intervals - targetIntervals);
                    if (!dualBest || score < dualBest.score) {
                        dualBest = { step: sVal, k0: k0, k1: k1, score: score };
                    }
                }
            }
            if (dualBest) {
                const ticks = [];
                for (let k = dualBest.k0; k <= dualBest.k1; k++) {
                    ticks.push(snapTo(effAnchor + k * dualBest.step, dualBest.step));
                }
                const d = decimalsPref != null ? decimalsPref : decimalsForStep(dualBest.step);
                return {
                    ticks: ticks,
                    renderMin: effMin,
                    renderMax: effMax,
                    tickStep: dualBest.step,
                    decimals: d,
                    edgeMin: lockMin != null ? effMin : null,
                    edgeMax: lockMax != null ? effMax : null
                };
            }
        }

        function scoreStep(step, lo, hi) {
            if (!(step > 0) || !isFinite(step)) return null;
            const eps = Math.max(step * 1e-6, 1e-9);
            let k0 = Math.floor((min - anchor) / step + 1e-8);
            let k1 = Math.ceil((max - anchor) / step - 1e-8);
            if (k1 <= k0) k1 = k0 + 1;
            const niceMin = anchor + k0 * step;
            const niceMax = anchor + k1 * step;
            if (lockMin != null && Math.abs(niceMin - lockMin) > Math.max(eps, Math.abs(lockMin) * 1e-6)) return null;
            if (lockMax != null && Math.abs(niceMax - lockMax) > Math.max(eps, Math.abs(lockMax) * 1e-6)) return null;
            if (niceMin > min + eps || niceMax < max - eps) return null;
            const intervals = k1 - k0;
            if (intervals < lo || intervals > hi) return null;
            const white = Math.max(0, (niceMax - niceMin) - (max - min)) / span;
            const penalty = 0.04 * Math.abs(intervals - targetIntervals);
            return { niceMin: niceMin, niceMax: niceMax, step: step, intervals: intervals, score: white + penalty };
        }

        let best = null;
        for (let i = 0; i < steps.length; i++) {
            const hit = scoreStep(steps[i], minIntervals, maxIntervals);
            if (!hit) continue;
            if (!best || hit.score < best.score - 1e-9 || (Math.abs(hit.score - best.score) <= 1e-9 && hit.intervals < best.intervals)) {
                best = hit;
            }
        }
        if (!best) {
            for (let j = 0; j < steps.length; j++) {
                const hit = scoreStep(steps[j], 1, 24);
                if (!hit) continue;
                hit.score += 0.25;
                if (!best || hit.score < best.score) best = hit;
            }
        }
        if (!best) {
            const intervals = Math.max(1, targetIntervals);
            return pack(min, max, (max - min) / intervals, intervals);
        }
        return pack(best.niceMin, best.niceMax, best.step, best.intervals);
    },

    /** Largest-triangle-three-buckets. threshold under 3, or already small enough, returns a copy. */
    downsampleLttb(points, threshold) {
        const src = points || [];
        const n = src.length;
        const cap = threshold | 0;
        if (n === 0) return [];
        if (cap < 3 || cap >= n) {
            const copy = [];
            for (let i = 0; i < n; i++) copy.push(src[i]);
            return copy;
        }
        const out = new Array(cap);
        out[0] = src[0];
        const bucket = (n - 2) / (cap - 2);
        let a = 0;
        for (let i = 0; i < cap - 2; i++) {
            const avgFrom = Math.floor((i + 1) * bucket) + 1;
            let avgTo = Math.floor((i + 2) * bucket) + 1;
            if (avgTo > n) avgTo = n;
            let avgX = 0;
            let avgY = 0;
            let avgN = 0;
            for (let j = avgFrom; j < avgTo; j++) {
                avgX += src[j].x;
                avgY += src[j].y;
                avgN++;
            }
            if (avgN > 0) {
                avgX /= avgN;
                avgY /= avgN;
            }
            const rangeFrom = Math.floor(i * bucket) + 1;
            let rangeTo = Math.floor((i + 1) * bucket) + 1;
            if (rangeTo > n - 1) rangeTo = n - 1;
            const ax = src[a].x;
            const ay = src[a].y;
            let maxArea = -1;
            let maxIdx = rangeFrom;
            for (let j = rangeFrom; j < rangeTo; j++) {
                const area = Math.abs((ax - avgX) * (src[j].y - ay) - (ax - src[j].x) * (avgY - ay));
                if (area > maxArea) {
                    maxArea = area;
                    maxIdx = j;
                }
            }
            out[i + 1] = src[maxIdx];
            a = maxIdx;
        }
        out[cap - 1] = src[n - 1];
        return out;
    },

    /**
     * Keep the first, last, min, and max sample in each pixel bucket so a step edge is not averaged away.
     */
    downsampleStepped(points, threshold) {
        const src = points || [];
        const n = src.length;
        const cap = threshold | 0;
        if (n === 0) return [];
        if (cap < 2 || cap >= n) {
            const copy = [];
            for (let i = 0; i < n; i++) copy.push(src[i]);
            return copy;
        }
        const out = [];
        const seen = {};
        for (let b = 0; b < cap; b++) {
            const start = Math.floor(b * n / cap);
            const end = Math.floor((b + 1) * n / cap);
            if (end <= start) continue;
            let minI = start;
            let maxI = start;
            for (let i = start + 1; i < end; i++) {
                if (src[i].y < src[minI].y) minI = i;
                if (src[i].y > src[maxI].y) maxI = i;
            }
            const idxs = [start, minI, maxI, end - 1];
            idxs.sort(function (a, b) { return a - b; });
            for (let k = 0; k < idxs.length; k++) {
                const ix = idxs[k];
                if (seen[ix]) continue;
                seen[ix] = true;
                out.push(src[ix]);
            }
        }
        return out;
    },

    /**
     * Split a series where values are missing. When breakOnTime is set, also split a
     * timestamp gap larger than max(3 x median interval, 60 seconds).
     */
    splitSeriesByGaps(points, breakOnTime) {
        const src = points || [];
        const segments = [];
        let cur = [];
        let median = null;
        if (breakOnTime) {
            const dts = [];
            for (let i = 1; i < src.length; i++) {
                const a = src[i - 1];
                const b = src[i];
                if (a && b && a.t != null && b.t != null && b.t > a.t) dts.push(b.t - a.t);
            }
            if (dts.length >= 4) {
                dts.sort(function (a, b) { return a - b; });
                const mid = Math.floor(dts.length / 2);
                median = dts.length % 2 ? dts[mid] : (dts[mid - 1] + dts[mid]) / 2;
            }
        }
        const limit = median == null ? 60000 : Math.max(3 * median, 60000);
        const flush = function () {
            if (cur.length) {
                segments.push(cur);
                cur = [];
            }
        };
        for (let i = 0; i < src.length; i++) {
            const p = src[i];
            const v = p ? p.v : null;
            if (v == null || !isFinite(v)) {
                flush();
                continue;
            }
            if (breakOnTime && cur.length) {
                const prev = cur[cur.length - 1];
                if (prev.t != null && p.t != null && (p.t - prev.t) > limit) flush();
            }
            cur.push(p);
        }
        flush();
        return segments;
    },

    // Centered moving average; null slots stay null and are excluded from neighbor averages.
    smoothSeries(values, windowSize) {
        if (!values || values.length === 0) return values ? values.slice() : [];
        if (windowSize < 2) return values.slice();
        const n = values.length;
        const cap = Math.max(2, Math.floor(n / 2));
        const w = Math.min(windowSize, cap);
        const half = Math.floor(w / 2);
        const out = values.slice();
        for (let i = 0; i < n; i++) {
            const v = values[i];
            if (v === null || v === undefined) {
                out[i] = v;
                continue;
            }
            let sum = 0;
            let count = 0;
            for (let j = Math.max(0, i - half); j <= Math.min(n - 1, i + half); j++) {
                const neighbor = values[j];
                if (neighbor === null || neighbor === undefined) continue;
                sum += neighbor;
                count++;
            }
            out[i] = count > 0 ? sum / count : v;
        }
        return out;
    },

    // Zero-phase bidirectional EMA. Continuous, no thresholds, no integer steps.
    // alpha near 1 = transparent; near 0 = heavy. Quadratic curve keeps low values gentle.
    // Forward pass removes lag; backward pass corrects phase so the trace stays centered.
    smoothSeriesStaged(values, level) {
        if (!values || values.length === 0) return values ? values.slice() : [];
        const lvl = Math.max(0, Math.min(100, Math.floor(Number(level)) || 0));
        if (lvl <= 0) return values.slice();

        const alpha = 1.0 - Math.pow(lvl / 100, 2) * 0.78;
        const n = values.length;

        const fwd = values.slice();
        let prev = null;
        for (let i = 0; i < n; i++) {
            const v = values[i];
            if (v === null || v === undefined) { prev = null; continue; }
            if (prev === null) { prev = v; continue; }
            fwd[i] = alpha * v + (1 - alpha) * prev;
            prev = fwd[i];
        }

        const out = fwd.slice();
        let next = null;
        for (let i = n - 1; i >= 0; i--) {
            const v = fwd[i];
            if (v === null || v === undefined) { next = null; continue; }
            if (next === null) { next = v; continue; }
            out[i] = alpha * v + (1 - alpha) * next;
            next = out[i];
        }
        return out;
    }
};

/** Label tooltip behavior for Menu items and Switch/Button labels (native `title` attribute). */
const LabelHint = {
    DEFAULT_MODE: 'truncated',

    OPTIONS: [
        { value: 'disabled', text: 'Disabled' },
        { value: 'truncated', text: 'When Label Is Truncated' },
        { value: 'always', text: 'Always' }
    ],

    normalizeMode: function (raw, fallback) {
        const fb = fallback || LabelHint.DEFAULT_MODE;
        const m = String(raw == null ? '' : raw).toLowerCase().trim();
        if (m === 'disabled' || m === 'off' || m === 'none') return 'disabled';
        if (m === 'always' || m === 'on') return 'always';
        if (m === 'truncated' || m === 'when_truncated' || m === 'when-truncated') return 'truncated';
        return fb;
    },

    isTruncated: function (element) {
        if (!element) return false;
        if (element.clientWidth <= 0 && element.clientHeight <= 0) return false;
        return element.scrollWidth > element.clientWidth + 1
            || element.scrollHeight > element.clientHeight + 1;
    },

    syncTruncatedHint: function (measureEl, hoverEl, labelText) {
        const hover = hoverEl || measureEl;
        const text = String(labelText == null ? '' : labelText).trim();
        if (!hover || !text) {
            if (hover) hover.removeAttribute('title');
            return;
        }
        if (LabelHint.isTruncated(measureEl || hover)) hover.title = text;
        else hover.removeAttribute('title');
    },

    /**
     * Native title only while the measured text is clipped. Measure on hover so
     * hidden menus are not treated as overflow.
     */
    bindTruncatedHint: function (hoverEl, options) {
        options = options || {};
        if (!hoverEl) return;
        const measureEl = options.measureEl || hoverEl;
        const getText = typeof options.getText === 'function'
            ? options.getText
            : function () {
                if (measureEl && (measureEl.tagName === 'INPUT' || measureEl.tagName === 'TEXTAREA')) {
                    return measureEl.value;
                }
                return (measureEl && measureEl.textContent) || '';
            };
        const sync = function () {
            LabelHint.syncTruncatedHint(measureEl, hoverEl, getText());
        };
        hoverEl._dsTruncHintSync = sync;
        if (!hoverEl._dsTruncHintBound) {
            hoverEl._dsTruncHintBound = true;
            hoverEl.addEventListener('mouseenter', sync);
            hoverEl.addEventListener('focus', sync);
        }
        if (options.immediate === true && typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(function () { requestAnimationFrame(sync); });
        }
    },

    refreshTruncatedHint: function (hoverEl) {
        if (hoverEl && typeof hoverEl._dsTruncHintSync === 'function') hoverEl._dsTruncHintSync();
    },

    clear: function (element) {
        if (element) element.removeAttribute('title');
    },

    apply: function (element, labelText, mode, options) {
        options = options || {};
        const hoverEl = options.hoverTarget || element;
        const measureEl = options.measureTarget || element;
        if (element && element !== hoverEl) LabelHint.clear(element);

        if (!hoverEl) return;
        const normalized = LabelHint.normalizeMode(mode);
        const text = String(labelText == null ? '' : labelText).trim();
        if (!text || normalized === 'disabled') {
            LabelHint.clear(hoverEl);
            return;
        }
        if (normalized === 'always') {
            hoverEl.title = text;
            return;
        }
        LabelHint.clear(hoverEl);
        const run = function () {
            LabelHint.syncTruncatedHint(measureEl, hoverEl, text);
        };
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(function () { requestAnimationFrame(run); });
        } else {
            run();
        }
    }
};
