/**
 * Shared floating workspace dialog host for Tools scripts and large editor UIs.
 * Creates backdrop + glass panel chrome (no editor.html markup). Session-only bounds.
 * Keep CustomDialog for small alerts/confirms.
 */
(function () {
    const hosts = {};
    const sessionBoundsById = Object.create(null);

    function clampPanelRect(left, top, w, h, minW, minH) {
        const minWidth = Math.max(280, minW || 480);
        const minHeight = Math.max(200, minH || 320);
        const maxW = Math.max(minWidth, window.innerWidth - 16);
        const maxH = Math.max(minHeight, window.innerHeight - 16);
        let width = Math.min(Math.max(w, minWidth), maxW);
        let height = Math.min(Math.max(h, minHeight), maxH);
        let x = left;
        let y = top;
        if (x > window.innerWidth - 80) x = window.innerWidth - 80;
        if (y > window.innerHeight - 48) y = window.innerHeight - 48;
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x + width > window.innerWidth - 8) x = Math.max(0, window.innerWidth - width - 8);
        if (y + height > window.innerHeight - 8) y = Math.max(0, window.innerHeight - height - 8);
        return { left: x, top: y, w: width, h: height };
    }

    function defaultBounds(opts) {
        const dw = (opts.defaultSize && opts.defaultSize.w) || Math.min(1100, window.innerWidth * 0.92);
        const dh = (opts.defaultSize && opts.defaultSize.h) || Math.min(window.innerHeight * 0.82, 720);
        const left = Math.max(0, Math.round((window.innerWidth - dw) / 2));
        const top = Math.max(0, Math.round((window.innerHeight - dh) / 2));
        const minW = (opts.minSize && opts.minSize.w) || 640;
        const minH = (opts.minSize && opts.minSize.h) || 420;
        return clampPanelRect(left, top, dw, dh, minW, minH);
    }

    function applyLayout(state) {
        const el = state.panel;
        if (!el) return;
        const minW = (state.opts.minSize && state.opts.minSize.w) || 640;
        const minH = (state.opts.minSize && state.opts.minSize.h) || 420;
        const saved = state.sessionBounds || (state.id ? sessionBoundsById[state.id] : null);
        const bounds = saved
            ? clampPanelRect(saved.left, saved.top, saved.w, saved.h, minW, minH)
            : defaultBounds(state.opts);
        el.style.transform = 'none';
        el.style.left = bounds.left + 'px';
        el.style.top = bounds.top + 'px';
        el.style.width = bounds.w + 'px';
        el.style.height = bounds.h + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.maxHeight = 'none';
    }

    function saveSessionBounds(state) {
        const el = state.panel;
        if (!el || !state) return;
        const r = el.getBoundingClientRect();
        const bounds = {
            left: Math.round(r.left),
            top: Math.round(r.top),
            w: Math.round(r.width),
            h: Math.round(r.height)
        };
        state.sessionBounds = bounds;
        if (state.id) sessionBoundsById[state.id] = bounds;
    }

    function teardownDragResize(state) {
        state._drag = null;
        state._resize = null;
    }

    function bindDragHeader(state, header) {
        if (typeof PointerDrag === 'undefined') return;
        header.style.touchAction = 'none';
        PointerDrag.bind(header, {
            raf: false,
            shouldStart: function (e) {
                if (e.target && e.target.closest) {
                    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return false;
                }
                return !!state.panel;
            },
            onDown: function (e) {
                const el = state.panel;
                const r = el.getBoundingClientRect();
                el.style.transform = 'none';
                el.style.left = r.left + 'px';
                el.style.top = r.top + 'px';
                el.style.width = r.width + 'px';
                el.style.height = r.height + 'px';
                el.style.right = 'auto';
                el.style.bottom = 'auto';
                state._drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
                return { el: el };
            },
            onMove: function (ev, ctx) {
                if (!state._drag || !ctx || !ctx.el) return;
                let x = ev.clientX - state._drag.dx;
                let y = ev.clientY - state._drag.dy;
                const maxX = window.innerWidth - 80;
                const maxY = window.innerHeight - 48;
                if (x < 0) x = 0;
                if (y < 0) y = 0;
                if (x > maxX) x = maxX;
                if (y > maxY) y = maxY;
                ctx.el.style.left = x + 'px';
                ctx.el.style.top = y + 'px';
            },
            onUp: function () {
                teardownDragResize(state);
                saveSessionBounds(state);
            }
        });
    }

    function bindResize(state, handle) {
        if (typeof PointerDrag === 'undefined') return;
        handle.style.touchAction = 'none';
        PointerDrag.bind(handle, {
            raf: false,
            onDown: function (e) {
                const el = state.panel;
                if (!el) return false;
                const r = el.getBoundingClientRect();
                el.style.transform = 'none';
                el.style.left = r.left + 'px';
                el.style.top = r.top + 'px';
                const minW = (state.opts.minSize && state.opts.minSize.w) || 640;
                const minH = (state.opts.minSize && state.opts.minSize.h) || 420;
                state._resize = { startW: r.width, startH: r.height, sx: e.clientX, sy: e.clientY, left: r.left, top: r.top, minW: minW, minH: minH };
                return { el: el };
            },
            onMove: function (ev, ctx) {
                if (!state._resize || !ctx || !ctx.el) return;
                const w = state._resize.startW + (ev.clientX - state._resize.sx);
                const h = state._resize.startH + (ev.clientY - state._resize.sy);
                const clamped = clampPanelRect(
                    parseFloat(ctx.el.style.left) || state._resize.left,
                    parseFloat(ctx.el.style.top) || state._resize.top,
                    w,
                    h,
                    state._resize.minW,
                    state._resize.minH
                );
                ctx.el.style.width = clamped.w + 'px';
                ctx.el.style.height = clamped.h + 'px';
            },
            onUp: function () {
                teardownDragResize(state);
                saveSessionBounds(state);
            }
        });
    }

    function ensureShell(opts) {
        const id = opts.id;
        let state = hosts[id];
        if (state && state.backdrop && document.body.contains(state.backdrop)) {
            state.opts = opts;
            if (sessionBoundsById[id]) state.sessionBounds = sessionBoundsById[id];
            return state;
        }

        const backdrop = document.createElement('div');
        backdrop.id = 'ds-dialog-host-' + id;
        backdrop.className = 'ds-dialog-backdrop ds-dialog-host-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');

        const panel = document.createElement('div');
        panel.className = 'modal-content ds-dialog-host-panel' + (opts.className ? (' ' + opts.className) : '');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');

        const header = document.createElement('div');
        header.className = 'modal-header ds-dialog-host-header';

        const title = document.createElement('h3');
        title.className = 'ds-dialog-title';
        if (opts.icon) {
            const icon = document.createElement('i');
            icon.className = 'ph-bold ' + String(opts.icon) + ' ds-dialog-title-icon';
            title.appendChild(icon);
        }
        const titleSpan = document.createElement('span');
        titleSpan.className = 'ds-dialog-host-title-text';
        titleSpan.textContent = String(opts.title || 'Dialog');
        title.appendChild(titleSpan);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'ds-dialog-close';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.innerHTML = '<i class="ph-bold ph-x"></i>';

        header.appendChild(title);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'modal-body ds-dialog-host-body';

        const footer = document.createElement('div');
        footer.className = 'modal-footer ds-dialog-footer ds-dialog-host-footer';
        footer.hidden = true;

        const resize = document.createElement('div');
        resize.className = 'wpp-resize ds-dialog-host-resize';
        resize.title = 'Resize';

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        panel.appendChild(resize);
        backdrop.appendChild(panel);
        document.body.appendChild(backdrop);

        state = {
            id: id,
            opts: opts,
            backdrop: backdrop,
            panel: panel,
            header: header,
            titleSpan: titleSpan,
            body: body,
            footer: footer,
            closeBtn: closeBtn,
            sessionBounds: sessionBoundsById[id] || null,
            _onClose: null,
            _keydown: null
        };
        hosts[id] = state;

        closeBtn.addEventListener('click', function () {
            void DialogHost.requestClose(id);
        });
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) void DialogHost.requestClose(id);
        });
        bindDragHeader(state, header);
        bindResize(state, resize);

        return state;
    }

    const DialogHost = {
        openFloating: function (options) {
            options = options || {};
            if (!options.id) return null;
            const state = ensureShell(options);
            state.opts = options;
            state._onClose = typeof options.onClose === 'function' ? options.onClose : null;
            if (state.titleSpan) state.titleSpan.textContent = String(options.title || 'Dialog');
            if (options.className) {
                state.panel.className = 'modal-content ds-dialog-host-panel ' + options.className;
            }

            state.body.innerHTML = '';
            state.footer.innerHTML = '';
            state.footer.hidden = true;

            if (typeof options.buildBody === 'function') {
                options.buildBody(state.body, state);
            }
            if (typeof options.buildFooter === 'function') {
                options.buildFooter(state.footer, state);
                state.footer.hidden = state.footer.childNodes.length === 0;
            }

            applyLayout(state);
            state.backdrop.classList.add('show');
            state.backdrop.setAttribute('aria-hidden', 'false');

            if (state._keydown) document.removeEventListener('keydown', state._keydown);
            state._keydown = function (e) {
                if (e.key !== 'Escape') return;
                if (!state.backdrop.classList.contains('show')) return;
                e.stopPropagation();
                if (typeof state.opts.onEscape === 'function') {
                    try {
                        if (state.opts.onEscape(e) === false) return;
                    } catch (err) { /* ignore */ }
                }
                void DialogHost.requestClose(state.id);
            };
            document.addEventListener('keydown', state._keydown);

            if (typeof options.onOpen === 'function') options.onOpen(state);
            return state;
        },

        requestClose: async function (id) {
            const state = hosts[id];
            if (!state || !state.backdrop.classList.contains('show')) return true;
            if (typeof state._onClose === 'function') {
                try {
                    const ok = await state._onClose();
                    if (ok === false) return false;
                } catch (err) {
                    return false;
                }
            }
            DialogHost.close(id);
            return true;
        },

        close: function (id) {
            const state = hosts[id];
            if (!state) return;
            teardownDragResize(state);
            if (state._keydown) {
                document.removeEventListener('keydown', state._keydown);
                state._keydown = null;
            }
            state.backdrop.classList.remove('show');
            state.backdrop.setAttribute('aria-hidden', 'true');
        },

        isOpen: function (id) {
            const state = hosts[id];
            return !!(state && state.backdrop && state.backdrop.classList.contains('show'));
        },

        getBody: function (id) {
            return hosts[id] ? hosts[id].body : null;
        },

        setStatusFooter: function (id, visible) {
            const state = hosts[id];
            if (!state) return;
            state.footer.hidden = !visible;
        }
    };

    window.addEventListener('resize', function () {
        Object.keys(hosts).forEach(function (id) {
            const s = hosts[id];
            if (s && s.backdrop && s.backdrop.classList.contains('show') && s.panel) {
                applyLayout(s);
            }
        });
    });

    window.DialogHost = DialogHost;
})();
