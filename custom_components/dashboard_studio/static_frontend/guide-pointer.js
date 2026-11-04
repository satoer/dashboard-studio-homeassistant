/**
 * Reusable on-screen pointer. The arrow and the label occupy separate layout
 * cells, so the arrow can aim any direction without covering the text.
 *
 * Short form: an element id, the sentence, and how long it stays (ms).
 *   GuidePointer.show('btn-reset-canvas', 'Press here.', 10000)
 *   GuidePointer.show('#fab-mode-switch', 'Press this to open the editor.', 10000)
 *
 * Full form:
 *   GuidePointer.show({
 *     target: Element | id | CSS selector | function(): Element,
 *     text: string,
 *     duration: 5000,   // or timeout. 0 stays until dismiss
 *     direction: 'auto' | 'up' | 'down' | 'left' | 'right'
 *               | 'up-left' | 'up-right' | 'down-left' | 'down-right',
 *     highlight: true,  // ring around the target
 *     gap: 14,          // px between the arrow tip and the target edge
 *     id: 'once-key',   // shown at most once per page load
 *     ensureVisible: true,  // scroll the target into view before aiming
 *     dismissOnTargetClick: true,
 *     onShow: function () {},
 *     onHide: function () {}
 *   })
 *
 * direction is the way the arrow points, toward the target. The label sits on
 * the opposite side. 'auto' (the default) tries every side and keeps the one
 * that fits on screen. Returns a dismiss function.
 */
const GuidePointer = (function () {
    // Filled arrow points right. The tip sits inside the viewBox so a CSS
    // rotation cannot swing the graphic out of its cell and into the label.
    const TIP_FX = 56 / 64;
    const TIP_FY = 32 / 64;
    const ARROW_SVG = '<svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">'
        + '<path fill="currentColor" d="M10 28H34V16L56 32L34 48V36H10Z"/>'
        + '</svg>';

    // rot: degrees, SVG tip (local +X) aims this way.
    // ax/ay: point on the target the tip approaches (0 = start edge, 1 = end edge).
    // axis/arrowFirst: label and arrow stay in separate cells.
    const DIRECTIONS = {
        right: { rot: 0, axis: 'row', arrowFirst: false, ax: 0, ay: 0.5 },
        left: { rot: 180, axis: 'row', arrowFirst: true, ax: 1, ay: 0.5 },
        down: { rot: 90, axis: 'column', arrowFirst: false, ax: 0.5, ay: 0 },
        up: { rot: 270, axis: 'column', arrowFirst: true, ax: 0.5, ay: 1 },
        'down-right': { rot: 45, axis: 'grid', arrowFirst: false, ax: 0, ay: 0 },
        'down-left': { rot: 135, axis: 'grid', arrowFirst: false, ax: 1, ay: 0 },
        'up-left': { rot: 225, axis: 'grid', arrowFirst: false, ax: 1, ay: 1 },
        'up-right': { rot: 315, axis: 'grid', arrowFirst: false, ax: 0, ay: 1 }
    };

    const _used = {};
    const _live = [];

    function resolveTarget(target) {
        if (!target || typeof document === 'undefined') return null;
        if (typeof target === 'function') {
            try {
                return target() || null;
            } catch (e) {
                return null;
            }
        }
        if (typeof target === 'string') {
            const raw = target.trim();
            if (!raw) return null;
            const first = raw.charAt(0);
            if (first === '#' || first === '.' || first === '[' || raw.indexOf(' ') !== -1) {
                return document.querySelector(raw);
            }
            return document.getElementById(raw) || document.querySelector(raw);
        }
        if (target.nodeType === 1) return target;
        return null;
    }

    function roomFor(rect, name) {
        const vw = window.innerWidth || 0;
        const vh = window.innerHeight || 0;
        const spaceLeft = rect.left;
        const spaceRight = vw - rect.right;
        const spaceUp = rect.top;
        const spaceDown = vh - rect.bottom;
        let room = 0;
        if (name === 'right') room = spaceLeft;
        else if (name === 'left') room = spaceRight;
        else if (name === 'down') room = spaceUp;
        else if (name === 'up') room = spaceDown;
        else if (name === 'down-right') room = Math.min(spaceLeft, spaceUp);
        else if (name === 'down-left') room = Math.min(spaceRight, spaceUp);
        else if (name === 'up-right') room = Math.min(spaceLeft, spaceDown);
        else if (name === 'up-left') room = Math.min(spaceRight, spaceDown);
        // Cardinal aim stays preferred when the room is similar. Diagonals win
        // when the straight side is actually tight (a target in a corner).
        if (name.indexOf('-') !== -1) room = room * 0.92;
        return room;
    }

    function candidateDirs(preferred, rect) {
        const names = Object.keys(DIRECTIONS);
        names.sort(function (a, b) { return roomFor(rect, b) - roomFor(rect, a); });
        if (preferred && DIRECTIONS[preferred]) {
            const rest = [];
            for (let i = 0; i < names.length; i++) {
                if (names[i] !== preferred) rest.push(names[i]);
            }
            return [preferred].concat(rest);
        }
        return names;
    }

    function overflowOf(box) {
        const m = 8;
        const vw = window.innerWidth || 0;
        const vh = window.innerHeight || 0;
        let n = 0;
        if (box.left < m) n += m - box.left;
        if (box.top < m) n += m - box.top;
        if (box.right > vw - m) n += box.right - (vw - m);
        if (box.bottom > vh - m) n += box.bottom - (vh - m);
        return n;
    }

    function tipLocal(arrow, rotDeg) {
        const w = arrow.offsetWidth;
        const h = arrow.offsetHeight;
        const cx = arrow.offsetLeft + w / 2;
        const cy = arrow.offsetTop + h / 2;
        const vx = (arrow.offsetLeft + w * TIP_FX) - cx;
        const vy = (arrow.offsetTop + h * TIP_FY) - cy;
        const rad = rotDeg * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return {
            x: cx + vx * cos - vy * sin,
            y: cy + vx * sin + vy * cos
        };
    }

    function applyDir(session, name) {
        const spec = DIRECTIONS[name];
        session.el.setAttribute('data-dir', name);
        session.el.setAttribute('data-axis', spec.axis);
        session.el.setAttribute('data-arrow-first', spec.arrowFirst ? '1' : '0');
        session.arrow.style.setProperty('--gp-rot', spec.rot + 'deg');
        session.dirName = name;
    }

    function place(session, name) {
        const target = session.targetEl;
        if (!target || !session.el) return null;
        const rect = target.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) return null;
        applyDir(session, name);
        const spec = DIRECTIONS[name];
        const rad = spec.rot * Math.PI / 180;
        const anchorX = rect.left + rect.width * spec.ax - Math.cos(rad) * session.gap;
        const anchorY = rect.top + rect.height * spec.ay - Math.sin(rad) * session.gap;
        const tip = tipLocal(session.arrow, spec.rot);
        const box = session.el.getBoundingClientRect();
        const curLeft = parseFloat(session.el.style.left);
        const curTop = parseFloat(session.el.style.top);
        session.el.style.left = ((isFinite(curLeft) ? curLeft : 0) + (anchorX - (box.left + tip.x))) + 'px';
        session.el.style.top = ((isFinite(curTop) ? curTop : 0) + (anchorY - (box.top + tip.y))) + 'px';
        placeHighlight(session, rect);
        return session.el.getBoundingClientRect();
    }

    /** Ring tracks the target. It is not part of the arrow layout, so it cannot cover the label. */
    function placeHighlight(session, rect) {
        const ring = session.highlight;
        if (!ring || !rect) return;
        const pad = 6;
        ring.style.left = (rect.left - pad) + 'px';
        ring.style.top = (rect.top - pad) + 'px';
        ring.style.width = (rect.width + pad * 2) + 'px';
        ring.style.height = (rect.height + pad * 2) + 'px';
        let radius = '0.75rem';
        try {
            const cs = window.getComputedStyle(session.targetEl);
            if (cs && cs.borderTopLeftRadius && cs.borderTopLeftRadius !== '0px') radius = cs.borderTopLeftRadius;
        } catch (e) { /* keep the fallback */ }
        ring.style.borderRadius = radius;
    }

    function clampIntoView(el) {
        const m = 8;
        const box = el.getBoundingClientRect();
        const vw = window.innerWidth || 0;
        const vh = window.innerHeight || 0;
        let dx = 0;
        let dy = 0;
        if (box.left < m) dx = m - box.left;
        else if (box.right > vw - m) dx = (vw - m) - box.right;
        if (box.top < m) dy = m - box.top;
        else if (box.bottom > vh - m) dy = (vh - m) - box.bottom;
        if (!dx && !dy) return;
        const curLeft = parseFloat(el.style.left);
        const curTop = parseFloat(el.style.top);
        if (dx) el.style.left = ((isFinite(curLeft) ? curLeft : 0) + dx) + 'px';
        if (dy) el.style.top = ((isFinite(curTop) ? curTop : 0) + dy) + 'px';
    }

    function chooseAndPlace(session) {
        const rect = session.targetEl.getBoundingClientRect();
        const dirs = candidateDirs(session.preferred, rect);
        let bestName = null;
        let bestOver = Infinity;
        for (let i = 0; i < dirs.length; i++) {
            const box = place(session, dirs[i]);
            if (!box) continue;
            const over = overflowOf(box);
            if (over < bestOver) {
                bestOver = over;
                bestName = dirs[i];
            }
            if (over < 1) break;
            if (session.preferred && dirs[i] === session.preferred && over <= 8) break;
        }
        if (!bestName) return false;
        const placed = place(session, bestName);
        if (placed && overflowOf(placed) > 0) clampIntoView(session.el);
        return true;
    }

    function build(text) {
        const el = document.createElement('div');
        el.className = 'gp';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        const label = document.createElement('div');
        label.className = 'gp-label';
        label.textContent = text == null ? '' : String(text);
        const arrow = document.createElement('span');
        arrow.className = 'gp-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.innerHTML = ARROW_SVG;
        el.appendChild(label);
        el.appendChild(arrow);
        el.style.left = '0px';
        el.style.top = '0px';
        document.body.appendChild(el);
        return { el: el, label: label, arrow: arrow };
    }

    function buildHighlight() {
        const ring = document.createElement('div');
        ring.className = 'gp-highlight';
        ring.setAttribute('aria-hidden', 'true');
        document.body.appendChild(ring);
        return ring;
    }

    function removeFromLive(session) {
        const idx = _live.indexOf(session);
        if (idx !== -1) _live.splice(idx, 1);
    }

    function createSession(opts) {
        const built = build(opts.text);
        const session = {
            id: opts.id ? String(opts.id) : '',
            opts: opts,
            el: built.el,
            label: built.label,
            arrow: built.arrow,
            highlight: opts.highlight === false ? null : buildHighlight(),
            targetEl: null,
            dirName: null,
            preferred: (opts.direction && opts.direction !== 'auto' && DIRECTIONS[opts.direction]) ? opts.direction : '',
            gap: (opts.gap === undefined || opts.gap === null || !isFinite(Number(opts.gap))) ? 14 : Number(opts.gap),
            shown: false,
            dead: false,
            _hid: false,
            _scrolled: false,
            _wait: null,
            _hideTimer: null,
            _removeTimer: null,
            _raf: 0,
            _onTrack: null,
            _onDown: null
        };
        if (session.id) built.el.setAttribute('data-gp-id', session.id);
        _live.push(session);
        return session;
    }

    function finishHide(session) {
        if (session._hid) return;
        session._hid = true;
        if (session.shown && typeof session.opts.onHide === 'function') {
            try { session.opts.onHide(); } catch (e) { /* caller */ }
        }
    }

    function dismissSession(session) {
        if (!session || session.dead) return;
        session.dead = true;
        if (session._wait) {
            clearInterval(session._wait);
            session._wait = null;
        }
        if (session._hideTimer) {
            clearTimeout(session._hideTimer);
            session._hideTimer = null;
        }
        if (session._raf) {
            cancelAnimationFrame(session._raf);
            session._raf = 0;
        }
        if (session._onTrack) {
            window.removeEventListener('resize', session._onTrack);
            window.removeEventListener('scroll', session._onTrack, true);
            session._onTrack = null;
        }
        if (session._onDown) {
            window.removeEventListener('pointerdown', session._onDown, true);
            session._onDown = null;
        }
        removeFromLive(session);
        const el = session.el;
        if (!el) {
            finishHide(session);
            return;
        }
        const ring = session.highlight;
        if (!session.shown) {
            if (el.parentNode) el.parentNode.removeChild(el);
            if (ring && ring.parentNode) ring.parentNode.removeChild(ring);
            session.el = null;
            session.highlight = null;
            return;
        }
        finishHide(session);
        session.shown = false;
        el.classList.remove('is-in');
        el.classList.add('is-out');
        if (ring) {
            ring.classList.remove('is-in');
            ring.classList.add('is-out');
        }
        session._removeTimer = setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
            if (ring && ring.parentNode) ring.parentNode.removeChild(ring);
            session.el = null;
            session.highlight = null;
        }, 280);
    }

    function bindTracking(session) {
        session._onTrack = function () {
            if (session.dead || !session.shown || !session.dirName || session._raf) return;
            session._raf = requestAnimationFrame(function () {
                session._raf = 0;
                if (session.dead || !session.shown || !session.dirName) return;
                const el = resolveTarget(session.opts.target);
                if (!el) return;
                session.targetEl = el;
                const box = place(session, session.dirName);
                if (box && overflowOf(box) > 0) clampIntoView(session.el);
            });
        };
        window.addEventListener('resize', session._onTrack);
        window.addEventListener('scroll', session._onTrack, true);
        if (session.opts.dismissOnTargetClick !== false) {
            session._onDown = function (e) {
                if (session.dead || !session.shown) return;
                const t = session.targetEl;
                if (!t) return;
                const node = e.target;
                if (node === t || (t.contains && t.contains(node))) dismissSession(session);
            };
            window.addEventListener('pointerdown', session._onDown, true);
        }
    }

    function reveal(session) {
        if (session.dead) return;
        const ok = chooseAndPlace(session);
        if (!ok) {
            dismissSession(session);
            return;
        }
        session.shown = true;
        session.el.classList.add('is-in');
        if (session.highlight) session.highlight.classList.add('is-in');
        bindTracking(session);
        if (typeof session.opts.onShow === 'function') {
            try { session.opts.onShow(); } catch (e) { /* caller */ }
        }
        let duration = session.opts.duration;
        if (duration === undefined || duration === null) duration = 5000;
        duration = Number(duration);
        if (!isFinite(duration) || duration < 0) duration = 5000;
        if (duration > 0) {
            session._hideTimer = setTimeout(function () { dismissSession(session); }, duration);
        }
    }

    function watchUntilStable(session) {
        let last = null;
        let stable = 0;
        let tries = 0;
        session._wait = setInterval(function () {
            if (session.dead) return;
            tries += 1;
            const el = resolveTarget(session.opts.target);
            session.targetEl = el;
            if (!el || !el.getBoundingClientRect) {
                if (tries > 40) {
                    clearInterval(session._wait);
                    session._wait = null;
                    dismissSession(session);
                }
                return;
            }
            const r = el.getBoundingClientRect();
            if (session.opts.ensureVisible !== false && !session._scrolled && r.width > 2 && r.height > 2) {
                session._scrolled = true;
                try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (err) { /* ignore */ }
                last = null;
                stable = 0;
                return;
            }
            const sized = r.width > 2 && r.height > 2;
            const same = !!(last && Math.abs(last.w - r.width) < 0.5 && Math.abs(last.h - r.height) < 0.5
                && Math.abs(last.l - r.left) < 0.5 && Math.abs(last.t - r.top) < 0.5);
            if (sized && same) {
                stable += 1;
                if (stable >= 2) {
                    clearInterval(session._wait);
                    session._wait = null;
                    reveal(session);
                    return;
                }
            } else {
                stable = 0;
            }
            last = { w: r.width, h: r.height, l: r.left, t: r.top };
            if (tries > 40) {
                clearInterval(session._wait);
                session._wait = null;
                if (sized) reveal(session);
                else dismissSession(session);
            }
        }, 50);
    }

    function normalizeShow(args) {
        const first = args[0];
        if (typeof first === 'string' || (first && first.nodeType === 1)) {
            const opts = { target: first, text: args[1] };
            if (args[2] !== undefined) opts.duration = args[2];
            return opts;
        }
        const opts = first || {};
        if ((opts.duration === undefined || opts.duration === null) && opts.timeout !== undefined) {
            opts.duration = opts.timeout;
        }
        return opts;
    }

    return {
        show: function () {
            const opts = normalizeShow(arguments);
            const id = opts.id ? String(opts.id) : '';
            if (id && _used[id]) return function () {};
            if (id) _used[id] = true;
            if (typeof document === 'undefined' || !document.body) return function () {};
            const session = createSession(opts);
            watchUntilStable(session);
            return function () { dismissSession(session); };
        },

        dismiss: function (id) {
            if (!id) return;
            const key = String(id);
            for (let i = _live.length - 1; i >= 0; i--) {
                if (_live[i].id === key) dismissSession(_live[i]);
            }
        }
    };
})();

/**
 * First-run hints for a page load that opened demo.json.
 * In-memory only: a reload is required before they can appear again.
 */
const DemoOnboarding = {
    _booted: false,
    _armed: false,
    _resetUsed: false,

    onBoot: function (loadedName) {
        if (this._booted) return;
        this._booted = true;
        if (loadedName !== 'demo.json') return;
        if (window.IS_VIEWER) return;
        const defaults = window.APP_CONFIG && window.APP_CONFIG.defaults;
        if (defaults && defaults.hideEditor) return;
        this._armed = true;
        if (document.body && document.body.classList.contains('edit-mode')) {
            this._showReset();
            return;
        }
        this._showOpen();
    },

    onEditorOpened: function () {
        if (!this._armed || this._resetUsed) return;
        if (typeof GuidePointer !== 'undefined') GuidePointer.dismiss('demo-open-editor');
        this._showReset();
    },

    _showOpen: function () {
        GuidePointer.show({
            id: 'demo-open-editor',
            target: '#fab-mode-switch',
            text: 'Press this to open the editor.',
            direction: 'auto',
            duration: 10000,
            gap: 16,
            onShow: function () {
                if (typeof Dashboard !== 'undefined' && typeof Dashboard.pinFabVisible === 'function') {
                    Dashboard.pinFabVisible(true);
                }
            },
            onHide: function () {
                if (typeof Dashboard !== 'undefined' && typeof Dashboard.pinFabVisible === 'function') {
                    Dashboard.pinFabVisible(false);
                }
            }
        });
    },

    _showReset: function () {
        if (this._resetUsed) return;
        this._resetUsed = true;
        GuidePointer.show({
            id: 'demo-reset-canvas',
            target: '#btn-reset-canvas',
            text: 'Press here to create your first dashboard!',
            direction: 'auto',
            duration: 10000,
            gap: 16,
            ensureVisible: true
        });
    }
};
