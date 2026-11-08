window.DASHBOARD_VERSION = "2.4.0";
window.LATEST_MIGRATION_VERSION = "2.4.0";
// Platform build number (Home Assistant publisher stamps this); 0 = no build, shown only in the About box.
window.DASHBOARD_BUILD = 6;

/**
 * Global Session Console Ring Buffer for Diagnostics & Debug Reports.
 * Captures console output from session start without reload persistence.
 */
(function () {
    if (typeof window === 'undefined' || window.DS_CONSOLE_BUFFER) return;

    var MAX_ENTRIES = 500;
    var buffer = [];
    window.DS_CONSOLE_BUFFER = buffer;

    var originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug
    };
    window._dsOriginalConsole = originalConsole;

    var isCapturing = false;

    function safeSerialize(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
        if (arg instanceof Error) {
            return (arg.name || 'Error') + ': ' + (arg.message || '') + (arg.stack ? '\n' + arg.stack : '');
        }
        if (typeof HTMLElement !== 'undefined' && arg instanceof HTMLElement) {
            var tag = (arg.tagName || 'element').toLowerCase();
            var id = arg.id ? ('#' + arg.id) : '';
            var cls = arg.className && typeof arg.className === 'string' ? ('.' + arg.className.trim().split(/\s+/).join('.')) : '';
            return '<' + tag + id + cls + '>';
        }
        if (typeof arg === 'object') {
            try {
                var seen = [];
                var str = JSON.stringify(arg, function (key, val) {
                    if (typeof val === 'object' && val !== null) {
                        if (seen.indexOf(val) !== -1) return '[Circular]';
                        seen.push(val);
                    }
                    return val;
                });
                return str;
            } catch (e) {
                try { return String(arg); } catch (e2) { return '[Object]'; }
            }
        }
        return String(arg);
    }

    function recordEntry(level, args) {
        if (isCapturing) return;
        isCapturing = true;
        try {
            var parts = [];
            for (var i = 0; i < args.length; i++) {
                parts.push(safeSerialize(args[i]));
            }
            var text = parts.join(' ');
            var now = new Date();
            var pad = function (n, len) {
                var s = String(n);
                while (s.length < (len || 2)) s = '0' + s;
                return s;
            };
            var timeStr = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds()) + '.' + pad(now.getMilliseconds(), 3);

            var entry = {
                timestamp: timeStr,
                timeMs: now.getTime(),
                level: level,
                text: text
            };

            buffer.push(entry);
            if (buffer.length > MAX_ENTRIES) {
                buffer.shift();
            }

            if (typeof window.DS_ON_CONSOLE_ENTRY === 'function') {
                try { window.DS_ON_CONSOLE_ENTRY(entry); } catch (e) {}
            }
        } catch (err) {
            // fail-safe: never throw from logger
        } finally {
            isCapturing = false;
        }
    }

    var levels = ['log', 'info', 'warn', 'error', 'debug'];
    for (var j = 0; j < levels.length; j++) {
        (function (lvl) {
            var orig = originalConsole[lvl];
            if (typeof orig !== 'function') return;
            console[lvl] = function () {
                recordEntry(lvl, arguments);
                return orig.apply(console, arguments);
            };
        })(levels[j]);
    }
})();
