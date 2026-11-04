/**
 * Worker-backed timers that bypass main-thread setTimeout/setInterval throttling.
 *
 * Why this exists:
 *   Modern browsers (Chrome's Intensive Throttling, Edge battery-saver, etc.) clamp
 *   main-thread timers right after page load, while a tab is partially occluded, while
 *   a native picker is open, and on background tabs. A single setTimeout(fn, 500) can
 *   sit unfired for 10-20 seconds in those windows, which makes anything debounced
 *   on the main thread (text preview, MQTT publishes, live monitors) feel frozen.
 *
 * The worker's own timers are not subject to those throttles, so we route the timing
 * through a shared blob worker and only run the user callback back on the main thread
 * when the worker fires.
 *
 * API mirrors native timers:
 *   const h = WorkerTimer.setTimeout(fn, ms);   WorkerTimer.clearTimeout(h);
 *   const h = WorkerTimer.setInterval(fn, ms);  WorkerTimer.clearInterval(h);
 *
 * Falls back to native setTimeout/setInterval if Worker / Blob / URL are unavailable
 * (extreme sandboxing only). Returned handles are always opaque objects; never store
 * or compare them as numbers.
 */
const WorkerTimer = (function () {
    const nativeSetTimeout = (typeof window !== 'undefined' ? window.setTimeout : setTimeout).bind(typeof window !== 'undefined' ? window : null);
    const nativeClearTimeout = (typeof window !== 'undefined' ? window.clearTimeout : clearTimeout).bind(typeof window !== 'undefined' ? window : null);
    const nativeSetInterval = (typeof window !== 'undefined' ? window.setInterval : setInterval).bind(typeof window !== 'undefined' ? window : null);
    const nativeClearInterval = (typeof window !== 'undefined' ? window.clearInterval : clearInterval).bind(typeof window !== 'undefined' ? window : null);

    const WORKER_SOURCE =
        'var t=new Map();' +
        'self.onmessage=function(e){' +
            'var m=e.data||{};' +
            'if(m.type===\"setTimeout\"){' +
                'var id=m.id;' +
                'var h=setTimeout(function(){t.delete(id);self.postMessage({id:id});},Math.max(0,m.ms|0));' +
                't.set(id,{kind:\"timeout\",h:h});' +
            '}else if(m.type===\"setInterval\"){' +
                'var id2=m.id;' +
                'var h2=setInterval(function(){self.postMessage({id:id2});},Math.max(1,m.ms|0));' +
                't.set(id2,{kind:\"interval\",h:h2});' +
            '}else if(m.type===\"clear\"){' +
                'var rec=t.get(m.id);' +
                'if(rec){if(rec.kind===\"timeout\"){clearTimeout(rec.h);}else{clearInterval(rec.h);}t.delete(m.id);}' +
            '}' +
        '};';

    const state = {
        worker: null,
        workerUrl: null,
        workerUnavailable: false,
        seq: 0,
        callbacks: new Map()
    };

    function ensureWorker() {
        if (state.worker) return state.worker;
        if (state.workerUnavailable) return null;
        if (typeof Worker !== 'function' || typeof Blob !== 'function'
                || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
            state.workerUnavailable = true;
            return null;
        }
        try {
            const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
            state.workerUrl = URL.createObjectURL(blob);
            state.worker = new Worker(state.workerUrl);
            state.worker.onmessage = onWorkerMessage;
            state.worker.onerror = onWorkerError;
            return state.worker;
        } catch (e) {
            console.warn('[WorkerTimer] Worker construction failed, falling back to native timers:', e);
            teardownWorker();
            state.workerUnavailable = true;
            return null;
        }
    }

    function teardownWorker() {
        if (state.worker) {
            try { state.worker.terminate(); } catch (e) { /* ignore */ }
            state.worker = null;
        }
        if (state.workerUrl) {
            try { URL.revokeObjectURL(state.workerUrl); } catch (e) { /* ignore */ }
            state.workerUrl = null;
        }
    }

    function onWorkerMessage(e) {
        const id = e && e.data && e.data.id;
        if (id == null) return;
        const handle = state.callbacks.get(id);
        if (!handle) return;
        if (handle.kind === 'timeout') {
            state.callbacks.delete(id);
        }
        try {
            handle.fn();
        } catch (err) {
            console.error('[WorkerTimer] callback threw:', err);
        }
    }

    function onWorkerError(err) {
        console.warn('[WorkerTimer] Worker error, dropping all worker handles to native fallback:', err);
        const orphaned = Array.from(state.callbacks.values());
        state.callbacks.clear();
        teardownWorker();
        state.workerUnavailable = true;
        // Re-arm any in-flight intervals on native timers so existing callers keep ticking.
        orphaned.forEach((h) => {
            if (h.kind !== 'interval' || typeof h.ms !== 'number') return;
            h.nativeId = nativeSetInterval(h.fn, h.ms);
            h.kind = 'interval-native';
        });
    }

    function scheduleWorker(kind, fn, ms) {
        const worker = ensureWorker();
        const id = ++state.seq;
        const handle = { id, kind, fn, ms };
        if (worker) {
            state.callbacks.set(id, handle);
            worker.postMessage({ type: kind === 'timeout' ? 'setTimeout' : 'setInterval', id, ms });
        } else {
            handle.nativeId = (kind === 'timeout' ? nativeSetTimeout : nativeSetInterval)(fn, ms);
            handle.kind = kind === 'timeout' ? 'timeout-native' : 'interval-native';
        }
        return handle;
    }

    function cancel(handle, expectKindPrefix) {
        if (!handle) return;
        if (typeof handle === 'number') {
            if (expectKindPrefix === 'timeout') nativeClearTimeout(handle);
            else nativeClearInterval(handle);
            return;
        }
        if (typeof handle !== 'object') return;
        if (handle.kind && expectKindPrefix && handle.kind.indexOf(expectKindPrefix) !== 0) return;
        if (handle.nativeId !== undefined) {
            if (handle.kind === 'timeout-native') nativeClearTimeout(handle.nativeId);
            else nativeClearInterval(handle.nativeId);
            handle.nativeId = undefined;
            return;
        }
        if (handle.id !== undefined) {
            state.callbacks.delete(handle.id);
            if (state.worker) {
                try { state.worker.postMessage({ type: 'clear', id: handle.id }); } catch (e) { /* ignore */ }
            }
        }
    }

    return {
        setTimeout: function (fn, ms) {
            if (typeof fn !== 'function') throw new TypeError('WorkerTimer.setTimeout requires a function');
            return scheduleWorker('timeout', fn, Math.max(0, ms | 0));
        },
        clearTimeout: function (handle) {
            cancel(handle, 'timeout');
        },
        setInterval: function (fn, ms) {
            if (typeof fn !== 'function') throw new TypeError('WorkerTimer.setInterval requires a function');
            return scheduleWorker('interval', fn, Math.max(1, ms | 0));
        },
        clearInterval: function (handle) {
            cancel(handle, 'interval');
        }
    };
})();

if (typeof window !== 'undefined') {
    window.WorkerTimer = WorkerTimer;
}
