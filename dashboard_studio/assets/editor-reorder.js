// Shared editor list/grid reorder (pointer events + CSS transform). No Sortable, no setTimeout, no MutationObserver.
(function (global) {
    'use strict';

    const DEFAULT_ITEM_SELECTOR = '.ds-reorder-item';
    const DEFAULT_HANDLE_SELECTOR = '.ds-reorder-handle';
    const DEFAULT_THRESHOLD_PX = 4;

    function parseGapPx(listEl) {
        let g = 0;
        try {
            const cs = global.getComputedStyle(listEl);
            const raw = cs.rowGap || cs.gap || '0';
            const m = String(raw).match(/^([\d.]+)px/);
            if (m) g = parseFloat(m[1]);
        } catch (e) { /* ignore */ }
        return g;
    }

    function snapshotColumnMids(rows) {
        const mids = [];
        for (let i = 0; i < rows.length; i++) {
            const b = rows[i].getBoundingClientRect();
            mids.push(b.top + b.height / 2);
        }
        return mids;
    }

    function snapshotGridRects(rows) {
        const rects = [];
        for (let i = 0; i < rows.length; i++) {
            rects.push(rows[i].getBoundingClientRect());
        }
        return rects;
    }

    /**
     * Insert slot in [0..n] from pointer Y vs row midpoints (layout snapshot; transform does not affect layout boxes).
     */
    function insertIndexFromMids(clientY, mids, n) {
        let target = 0;
        for (let i = 0; i < n; i++) {
            if (clientY >= mids[i]) target = i + 1;
        }
        if (target < 0) target = 0;
        if (target > n) target = n;
        return target;
    }

    /**
     * Target index in array *after* splice(from,1), before splice(to,0,moved).
     * ins = insertion slot in [0..n] in the pre-removal list (gap index).
     */
    function toIndexAfterRemove(oldIndex, ins, n) {
        let to;
        if (ins <= oldIndex) {
            to = ins;
        } else {
            to = ins - 1;
        }
        if (to < 0) to = 0;
        if (to > n - 1) to = n - 1;
        return to;
    }

    function hitTestGridIndex(clientX, clientY, rects, n) {
        for (let i = 0; i < n; i++) {
            const r = rects[i];
            if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
                return i;
            }
        }
        let best = 0;
        let bestD = Infinity;
        for (let j = 0; j < n; j++) {
            const r = rects[j];
            const cx = (r.left + r.right) / 2;
            const cy = (r.top + r.bottom) / 2;
            const dx = clientX - cx;
            const dy = clientY - cy;
            const d = dx * dx + dy * dy;
            if (d < bestD) {
                bestD = d;
                best = j;
            }
        }
        return best;
    }

    /**
     * @param {HTMLElement} listEl
     * @param {{ itemSelector?: string, handleSelector?: string, onReorder: function(number,number), dragMoveThresholdPx?: number, layout?: 'column'|'grid' }} options
     * @returns {{ destroy: function() }}
     */
    function attach(listEl, options) {
        if (!listEl || !options || typeof options.onReorder !== 'function') {
            return { destroy: function () {} };
        }

        const itemSelector = options.itemSelector || DEFAULT_ITEM_SELECTOR;
        const handleSel = options.handleSelector || DEFAULT_HANDLE_SELECTOR;
        const threshold = options.dragMoveThresholdPx != null ? options.dragMoveThresholdPx : DEFAULT_THRESHOLD_PX;
        const layout = options.layout === 'grid' ? 'grid' : 'column';
        const onReorderCb = options.onReorder;

        let dragActive = false;
        let armActive = false;
        let pointerId = null;
        let captureEl = null;
        let rows = [];
        let oldIndex = -1;
        let newIndex = -1;
        let dragEl = null;
        let startClientX = 0;
        let startClientY = 0;
        let mids = [];
        let gridRects = [];
        let gapPx = 0;
        let draggedH = 0;
        let prevUserSelect = '';
        let prevDragZ = '';
        let rafId = null;
        let pendingMove = null;

        function collectRows() {
            const out = [];
            const ch = listEl.children;
            for (let i = 0; i < ch.length; i++) {
                const c = ch[i];
                if (c.nodeType !== 1) continue;
                let ok = false;
                if (typeof c.matches === 'function') {
                    ok = c.matches(itemSelector);
                } else if (typeof c.msMatchesSelector === 'function') {
                    ok = c.msMatchesSelector(itemSelector);
                }
                if (ok) out.push(c);
            }
            return out;
        }

        function clearVisualState() {
            for (let i = 0; i < rows.length; i++) {
                const el = rows[i];
                el.classList.remove('is-dragging', 'is-shifting');
                el.style.transform = '';
                el.style.zIndex = '';
            }
        }

        function applyColumnShifts(dy) {
            const n = rows.length;
            const g = gapPx;
            for (let i = 0; i < n; i++) {
                const el = rows[i];
                if (el === dragEl) {
                    el.style.transform = 'translateY(' + dy + 'px)';
                    continue;
                }
                let shift = 0;
                if (newIndex > oldIndex) {
                    if (i > oldIndex && i <= newIndex) shift = -(draggedH + g);
                } else if (newIndex < oldIndex) {
                    if (i >= newIndex && i < oldIndex) shift = draggedH + g;
                }
                if (shift !== 0) {
                    el.classList.add('is-shifting');
                    el.style.transform = 'translateY(' + shift + 'px)';
                } else {
                    el.classList.remove('is-shifting');
                    el.style.transform = '';
                }
            }
        }

        function applyGridDrag(dx, dy) {
            if (!dragEl) return;
            dragEl.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        }

        function removeArmListeners() {
            listEl.removeEventListener('pointermove', onArmMove);
            listEl.removeEventListener('pointerup', onArmUp);
            listEl.removeEventListener('pointercancel', onArmCancel);
            armActive = false;
        }

        function removeDragListeners() {
            if (!captureEl) return;
            captureEl.removeEventListener('pointermove', onPointerMove);
            captureEl.removeEventListener('pointerup', onPointerUp);
            captureEl.removeEventListener('pointercancel', onPointerCancel);
            captureEl.removeEventListener('lostpointercapture', onLostCapture);
        }

        function abortArmOnly() {
            removeArmListeners();
            if (dragEl) {
                dragEl.classList.remove('is-dragging');
                dragEl.style.zIndex = prevDragZ;
                dragEl.style.transform = '';
            }
            if (typeof document !== 'undefined' && document.body) {
                document.body.style.userSelect = prevUserSelect;
            }
            pointerId = null;
            captureEl = null;
            dragEl = null;
            oldIndex = -1;
            newIndex = -1;
            rows = [];
            mids = [];
            gridRects = [];
        }

        function finishPointerGesture(skipCommit) {
            if (rafId != null && typeof global.cancelAnimationFrame === 'function') {
                global.cancelAnimationFrame(rafId);
                rafId = null;
            }
            pendingMove = null;

            removeArmListeners();
            removeDragListeners();

            if (captureEl && pointerId != null && typeof captureEl.releasePointerCapture === 'function') {
                try {
                    captureEl.releasePointerCapture(pointerId);
                } catch (e) { /* ignore */ }
            }

            if (typeof document !== 'undefined' && document.body) {
                document.body.style.userSelect = prevUserSelect;
            }

            clearVisualState();

            const oi = oldIndex;
            const ni = newIndex;
            const wasDrag = dragActive;

            dragActive = false;
            captureEl = null;
            pointerId = null;
            dragEl = null;
            oldIndex = -1;
            newIndex = -1;
            rows = [];
            mids = [];
            gridRects = [];

            if (wasDrag && !skipCommit && oi >= 0 && ni >= 0 && oi !== ni) {
                onReorderCb(oi, ni);
            }
        }

        function onPointerMove(ev) {
            if (!dragActive || ev.pointerId !== pointerId) return;
            pendingMove = ev;
            if (rafId != null) return;
            if (typeof global.requestAnimationFrame !== 'function') {
                flushMove();
                return;
            }
            rafId = global.requestAnimationFrame(function () {
                rafId = null;
                flushMove();
            });
        }

        function flushMove() {
            const ev = pendingMove;
            if (!dragActive || !ev || ev.pointerId !== pointerId || !dragEl) return;

            const clientX = ev.clientX;
            const clientY = ev.clientY;
            const dx = clientX - startClientX;
            const dy = clientY - startClientY;

            if (layout === 'grid') {
                let j = hitTestGridIndex(clientX, clientY, gridRects, rows.length);
                if (j < 0) j = 0;
                if (j > rows.length - 1) j = rows.length - 1;
                newIndex = j;
                applyGridDrag(dx, dy);
            } else {
                const ins = insertIndexFromMids(clientY, mids, rows.length);
                newIndex = toIndexAfterRemove(oldIndex, ins, rows.length);
                applyColumnShifts(dy);
            }
        }

        function onPointerUp(ev) {
            if (ev.pointerId !== pointerId) return;
            ev.preventDefault();
            finishPointerGesture();
        }

        function onPointerCancel(ev) {
            if (ev.pointerId !== pointerId) return;
            finishPointerGesture();
        }

        function onLostCapture(ev) {
            if (dragActive && ev.pointerId === pointerId) {
                finishPointerGesture();
            }
        }

        function onArmMove(ev) {
            if (!armActive || ev.pointerId !== pointerId) return;
            const rdx = ev.clientX - startClientX;
            const rdy = ev.clientY - startClientY;
            const dist = Math.sqrt(rdx * rdx + rdy * rdy);
            if (dist < threshold) return;

            removeArmListeners();
            dragActive = true;

            if (typeof captureEl.setPointerCapture === 'function') {
                try {
                    captureEl.setPointerCapture(pointerId);
                } catch (e2c) { /* ignore */ }
            }
            captureEl.addEventListener('pointermove', onPointerMove);
            captureEl.addEventListener('pointerup', onPointerUp);
            captureEl.addEventListener('pointercancel', onPointerCancel);
            captureEl.addEventListener('lostpointercapture', onLostCapture);
            onPointerMove(ev);
        }

        function onArmUp(ev) {
            if (ev.pointerId !== pointerId) return;
            if (!dragActive) {
                abortArmOnly();
            }
        }

        function onArmCancel(ev) {
            onArmUp(ev);
        }

        function onPointerDown(ev) {
            if (dragActive || armActive) return;
            if (ev.button !== 0 && ev.pointerType === 'mouse') return;

            const handle = ev.target.closest(handleSel);
            if (!handle || !listEl.contains(handle)) return;

            const row = ev.target.closest(itemSelector);
            if (!row || !listEl.contains(row)) return;
            if (!row.contains(handle)) return;

            rows = collectRows();
            const idx = rows.indexOf(row);
            if (idx < 0) return;

            ev.preventDefault();

            oldIndex = idx;
            newIndex = idx;
            dragEl = row;
            pointerId = ev.pointerId;
            captureEl = row;
            startClientX = ev.clientX;
            startClientY = ev.clientY;

            if (layout === 'grid') {
                gridRects = snapshotGridRects(rows);
            } else {
                mids = snapshotColumnMids(rows);
                gapPx = parseGapPx(listEl);
                draggedH = dragEl.offsetHeight;
            }

            prevUserSelect = '';
            if (typeof document !== 'undefined' && document.body) {
                prevUserSelect = document.body.style.userSelect || '';
                document.body.style.userSelect = 'none';
            }

            prevDragZ = dragEl.style.zIndex || '';
            dragEl.classList.add('is-dragging');
            dragEl.style.zIndex = '5';

            armActive = true;
            listEl.addEventListener('pointermove', onArmMove);
            listEl.addEventListener('pointerup', onArmUp);
            listEl.addEventListener('pointercancel', onArmCancel);
        }

        listEl.addEventListener('pointerdown', onPointerDown);

        return {
            destroy: function () {
                listEl.removeEventListener('pointerdown', onPointerDown);
                if (dragActive) {
                    finishPointerGesture(true);
                } else if (armActive) {
                    abortArmOnly();
                }
            }
        };
    }

    function createDragHandle() {
        const el = document.createElement('span');
        el.className = 'ds-reorder-handle';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '-1');
        el.title = 'Drag to reorder';
        el.setAttribute('aria-label', 'Drag to reorder');
        el.innerHTML = '<i class="ph-bold ph-dots-six-vertical"></i>';
        el.addEventListener('click', function (e) { e.stopPropagation(); });
        return el;
    }

    function createGridDragHandle() {
        const el = document.createElement('span');
        el.className = 'ds-reorder-handle ds-reorder-handle--grid';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '-1');
        el.title = 'Drag to reorder';
        el.setAttribute('aria-label', 'Drag to reorder');
        el.innerHTML = '<i class="ph-bold ph-dots-six-vertical"></i>';
        el.addEventListener('click', function (e) { e.stopPropagation(); });
        return el;
    }

    global.EditorReorder = {
        attach: attach,
        createDragHandle: createDragHandle,
        createGridDragHandle: createGridDragHandle
    };
})(typeof window !== 'undefined' ? window : this);
