/**
 * Shared pointer capture for editor drag/resize. One path for mouse, touch, and pen.
 * Listeners attach only while a gesture is captured (no idle document mousemove).
 */
const PointerDrag = (function () {
    function isPrimary(e) {
        if (!e || e.isPrimary === false) return false;
        if (e.pointerType === 'mouse') return e.button === 0;
        return e.button === 0 || e.button === -1;
    }

    function point(e) {
        return { x: e.clientX, y: e.clientY };
    }

    function isCoarse() {
        return !!(typeof document !== 'undefined' && document.body
            && document.body.classList.contains('coarse-pointer'));
    }

    function applyCoarsePointerClass() {
        if (typeof document === 'undefined' || !document.body) return;
        let coarse = false;
        if (typeof window.matchMedia === 'function') {
            try {
                coarse = window.matchMedia('(hover: none)').matches
                    || window.matchMedia('(pointer: coarse)').matches;
            } catch (err) { /* ignore */ }
        }
        document.body.classList.toggle('coarse-pointer', !!coarse);
    }

    function capture(e, el, opts) {
        opts = opts || {};
        if (!el || !e) return { finish: function () { } };
        const pointerId = e.pointerId;
        const useRaf = opts.raf !== false;
        let rafId = null;
        let pending = null;
        let ended = false;
        let lastX = e.clientX;
        let lastY = e.clientY;

        function flushMove() {
            rafId = null;
            const ev = pending;
            pending = null;
            if (!ev || ended) return;
            if (typeof opts.onMove === 'function') opts.onMove(ev);
        }

        function onMove(ev) {
            if (ev.pointerId !== pointerId) return;
            lastX = ev.clientX;
            lastY = ev.clientY;
            if (opts.preventMove !== false) ev.preventDefault();
            if (!useRaf || typeof requestAnimationFrame !== 'function') {
                if (typeof opts.onMove === 'function') opts.onMove(ev);
                return;
            }
            pending = ev;
            if (rafId != null) return;
            rafId = requestAnimationFrame(flushMove);
        }

        function teardown() {
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onUp);
            el.removeEventListener('pointercancel', onUp);
            el.removeEventListener('lostpointercapture', onLost);
            window.removeEventListener('blur', onBlur);
            if (typeof el.releasePointerCapture === 'function') {
                try { el.releasePointerCapture(pointerId); } catch (err) { /* ignore */ }
            }
        }

        function finish(ev) {
            if (ended) return;
            ended = true;
            if (rafId != null && typeof cancelAnimationFrame === 'function') {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            if (pending && typeof opts.onMove === 'function') opts.onMove(pending);
            pending = null;
            teardown();
            const endEv = ev || { clientX: lastX, clientY: lastY, pointerId: pointerId };
            if (typeof opts.onUp === 'function') opts.onUp(endEv);
        }

        function onUp(ev) {
            if (ev.pointerId !== pointerId) return;
            finish(ev);
        }

        function onLost(ev) {
            if (ev.pointerId !== pointerId) return;
            finish(ev);
        }

        function onBlur() {
            finish();
        }

        if (typeof el.setPointerCapture === 'function') {
            try { el.setPointerCapture(pointerId); } catch (err) { /* ignore */ }
        }
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        el.addEventListener('pointercancel', onUp);
        el.addEventListener('lostpointercapture', onLost);
        window.addEventListener('blur', onBlur);

        return { finish: finish };
    }

    function bind(el, opts) {
        opts = opts || {};
        if (!el) return { destroy: function () { } };

        function onDown(e) {
            if (!isPrimary(e)) return;
            if (typeof opts.shouldStart === 'function' && opts.shouldStart(e) === false) return;
            if (opts.stop !== false) e.stopPropagation();
            if (opts.prevent !== false) e.preventDefault();
            const ctx = (typeof opts.onDown === 'function') ? opts.onDown(e) : undefined;
            if (ctx === false) return;
            capture(e, el, {
                raf: opts.raf,
                preventMove: opts.preventMove,
                onMove: function (ev) {
                    if (typeof opts.onMove === 'function') opts.onMove(ev, ctx);
                },
                onUp: function (ev) {
                    if (typeof opts.onUp === 'function') opts.onUp(ev, ctx);
                }
            });
        }

        el.addEventListener('pointerdown', onDown);
        return {
            destroy: function () { el.removeEventListener('pointerdown', onDown); }
        };
    }

    function watchCoarsePointer() {
        applyCoarsePointerClass();
        if (typeof window.matchMedia !== 'function') return;
        try {
            const mq = window.matchMedia('(hover: none), (pointer: coarse)');
            const onChange = function () { applyCoarsePointerClass(); };
            if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
            else if (typeof mq.addListener === 'function') mq.addListener(onChange);
        } catch (err) { /* ignore */ }
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', watchCoarsePointer);
        } else {
            watchCoarsePointer();
        }
    }

    return {
        isPrimary: isPrimary,
        point: point,
        isCoarse: isCoarse,
        applyCoarsePointerClass: applyCoarsePointerClass,
        capture: capture,
        bind: bind
    };
})();

window.PointerDrag = PointerDrag;
