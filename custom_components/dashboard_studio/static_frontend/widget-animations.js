/**
 * WidgetAnimations — shared content-swap animation registry and runtime helpers.
 * Loaded after widget-base.js. Widgets opt in via getAnimationSlot(slot) + swap().
 */
var WidgetAnimations = (function () {
    'use strict';

    var META_NONE = 'none';
    var META_RANDOM = 'random';
    var RESERVED_IDS = { none: true, random: true };

    var _registry = {};
    var _registryOrder = [];
    var _stylesInjected = false;
    var _activeSwaps = 0;

    function _getTargetSwapSession(target) {
        if (!target) return null;
        return target._waSwapSession || null;
    }

    function _releaseStageMedia(stageEl) {
        if (!stageEl || !stageEl.querySelectorAll) return;
        var imgs = stageEl.querySelectorAll('img');
        var i;
        for (i = 0; i < imgs.length; i++) {
            imgs[i].onload = null;
            imgs[i].onerror = null;
            imgs[i].removeAttribute('src');
        }
    }

    function _removeSwapStages(host) {
        if (!host || !host.querySelectorAll) return;
        var stages = host.querySelectorAll('.wa-swap-stage');
        var i;
        for (i = stages.length - 1; i >= 0; i--) {
            _releaseStageMedia(stages[i]);
            if (stages[i].parentNode) stages[i].parentNode.removeChild(stages[i]);
        }
    }

    /** Worker-backed timer for swap completion: native `setTimeout` gets throttled (cold-start, background tab),
     *  which strands the swap stage on top of a hidden target and freezes inline live updates. */
    function _scheduleSwapTimer(fn, ms) {
        if (typeof WorkerTimer !== 'undefined' && typeof WorkerTimer.setTimeout === 'function') {
            return WorkerTimer.setTimeout(fn, ms);
        }
        return setTimeout(fn, ms);
    }

    function _cancelSwapTimer(handle) {
        if (handle == null) return;
        if (typeof WorkerTimer !== 'undefined' && typeof WorkerTimer.clearTimeout === 'function') {
            WorkerTimer.clearTimeout(handle);
            return;
        }
        clearTimeout(handle);
    }

    /**
     * Cancel an in-flight swap on this target and restore visibility.
     * Required when a new swap starts before the previous timeout completes.
     */
    function cancelTargetSwap(target) {
        var session = _getTargetSwapSession(target);
        if (!session) return;
        if (session.timerId != null) _cancelSwapTimer(session.timerId);
        if (session.rafId != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(session.rafId);
            session.rafId = null;
        }
        if (session.stage) {
            _releaseStageMedia(session.stage);
            if (session.stage.parentNode) {
                session.stage.parentNode.removeChild(session.stage);
            }
        } else if (session.host) {
            _removeSwapStages(session.host);
        }
        if (session.target) {
            _clearLayerClasses(session.target);
            session.target.style.visibility = session.restoreVisibility || '';
            session.target.style.removeProperty('--wa-duration');
            session.target.style.removeProperty('--wa-dir');
            session.target._waSwapSession = null;
        }
        _activeSwaps = Math.max(0, _activeSwaps - 1);
        if (typeof session.onCancel === 'function') {
            var cancelCb = session.onCancel;
            session.onCancel = null;
            cancelCb();
        }
    }

    function isTargetSwapActive(target) {
        return !!_getTargetSwapSession(target);
    }

    function releaseTargetVisible(target, host) {
        var session = _getTargetSwapSession(target);
        if (session && session.host) host = host || session.host;
        cancelTargetSwap(target);
        if (host) _removeSwapStages(host);
        if (target && target.style && target.style.visibility === 'hidden') {
            target.style.visibility = '';
        }
    }

    /** Remove orphan swap stages and restore a target that is no longer in an active swap session. */
    function purgeSwapArtifacts(host, target) {
        if (target && _getTargetSwapSession(target)) {
            cancelTargetSwap(target);
        }
        if (host) _removeSwapStages(host);
        if (target) {
            _clearLayerClasses(target);
            if (target.style && target.style.visibility === 'hidden') {
                target.style.visibility = '';
            }
        }
    }

    var _SHARED_LAYER_CSS = [
        '.wa-swap-host{position:relative;overflow:hidden}',
        '.wa-swap-stage{position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:50}',
        '.wa-swap-layer-shell{position:absolute;left:0;width:100%;max-height:100%;box-sizing:border-box;overflow:hidden;pointer-events:none}',
        '.wa-swap-layer{width:100%;box-sizing:border-box;visibility:hidden;opacity:0}',
        '.wa-swap-layer.wa-swap-entering,.wa-swap-layer.wa-swap-exiting{visibility:visible;animation-duration:var(--wa-duration,1s);animation-fill-mode:both;animation-timing-function:cubic-bezier(0.4,0,0.2,1)}',
        '.wa-swap-layer.wa-swap-entering{z-index:20}',
        '.wa-swap-layer.wa-swap-exiting{z-index:5}'
    ].join('');

    function _isReservedId(id) {
        return RESERVED_IDS[id] === true;
    }

    function _clampDuration(val, fallback) {
        var n = Number(val);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(0.1, n);
    }

    function _slotKeys(slot) {
        var s = String(slot || 'content');
        return {
            animation: s + 'Animation',
            duration: s + 'AnimationDuration'
        };
    }

    function _matchesAllowed(entry, allowed) {
        if (!allowed) return true;
        var ids = allowed.ids;
        var cats = allowed.categories;
        var hasIds = ids && ids.length;
        var hasCats = cats && cats.length;
        if (!hasIds && !hasCats) return true;
        if (hasIds && ids.indexOf(entry.id) !== -1) return true;
        if (hasCats && cats.indexOf(entry.category) !== -1) return true;
        return false;
    }

    function _listAnimations(allowed) {
        var out = [];
        var i;
        for (i = 0; i < _registryOrder.length; i++) {
            var id = _registryOrder[i];
            var entry = _registry[id];
            if (entry && _matchesAllowed(entry, allowed)) {
                out.push(entry);
            }
        }
        return out;
    }

    function _resolveAnimationId(animation, allowed) {
        var anim = animation != null ? String(animation) : META_NONE;
        if (anim === META_NONE || anim === '') return META_NONE;
        if (anim === META_RANDOM) {
            var pool = _listAnimations(allowed);
            if (!pool.length) return 'cross-fade';
            var idx = Math.floor(Math.random() * pool.length);
            return pool[idx].id;
        }
        if (_registry[anim]) return anim;
        return META_NONE;
    }

    function _ensureStyles() {
        if (_stylesInjected || typeof document === 'undefined') return;
        var cssParts = [_SHARED_LAYER_CSS];
        var i;
        for (i = 0; i < _registryOrder.length; i++) {
            var entry = _registry[_registryOrder[i]];
            if (entry && entry.css) cssParts.push(entry.css);
        }
        var el = document.createElement('style');
        el.setAttribute('data-widget-animations', '1');
        el.textContent = cssParts.join('\n');
        document.head.appendChild(el);
        _stylesInjected = true;
    }

    function _prepareHost(host, needs3D) {
        if (!host) return;
        var pos = host.style.position;
        if (!pos || pos === 'static') host.style.position = 'relative';
        host.style.overflow = 'hidden';
        if (needs3D) {
            host.style.perspective = '1500px';
            host.style.transformStyle = 'preserve-3d';
        }
    }

    function _clearLayerClasses(el) {
        if (!el || !el.classList) return;
        el.classList.remove('wa-swap-entering', 'wa-swap-exiting', 'wa-swap-current', 'wa-swap-layer');
        var i;
        for (i = 0; i < _registryOrder.length; i++) {
            var entry = _registry[_registryOrder[i]];
            if (entry) {
                el.classList.remove(entry.enterClass, entry.exitClass);
            }
        }
    }

    function _alignModeFromHost(host) {
        if (!host) return 'top';
        if (host.getAttribute) {
            var cachedAlign = host.getAttribute('data-wa-align');
            if (cachedAlign === 'bottom' || cachedAlign === 'middle' || cachedAlign === 'top') {
                return cachedAlign;
            }
        }
        var jc = host.style.justifyContent;
        if ((!jc || jc === '') && typeof window !== 'undefined' && window.getComputedStyle) {
            jc = window.getComputedStyle(host).justifyContent;
        }
        jc = String(jc || 'flex-start');
        if (jc === 'flex-end' || jc === 'end') return 'bottom';
        if (jc === 'center') return 'middle';
        return 'top';
    }

    function _applyShellAlign(shell, alignMode, zIndex) {
        shell.style.position = 'absolute';
        shell.style.left = '0';
        shell.style.width = '100%';
        shell.style.maxHeight = '100%';
        shell.style.boxSizing = 'border-box';
        shell.style.overflow = 'hidden';
        shell.style.pointerEvents = 'none';
        if (zIndex != null) shell.style.zIndex = String(zIndex);
        shell.style.display = '';
        shell.style.flexDirection = '';
        shell.style.justifyContent = '';
        shell.style.alignItems = '';
        if (alignMode === 'bottom') {
            shell.style.top = '';
            shell.style.bottom = '0';
        } else if (alignMode === 'middle') {
            shell.style.top = '0';
            shell.style.bottom = '0';
            shell.style.display = 'flex';
            shell.style.flexDirection = 'column';
            shell.style.justifyContent = 'center';
        } else {
            shell.style.top = '0';
            shell.style.bottom = '';
        }
    }

    function _wrapAlignedLayer(contentEl, alignMode, zIndex) {
        var shell = document.createElement('div');
        shell.className = 'wa-swap-layer-shell';
        _applyShellAlign(shell, alignMode, zIndex);
        shell.appendChild(contentEl);
        return shell;
    }

    function _createSwapStage(host) {
        var stage = document.createElement('div');
        stage.className = 'wa-swap-stage';
        host.appendChild(stage);
        return stage;
    }

    /**
     * Coordinates content-swap for one target: overlap cancel, rapid-update coalesce,
     * defer-first burst frame (no flash before transition). Widget supplies applyLive /
     * commitDeferred hooks for DOM + post-apply styling.
     *
     * @param {object} [options]
     * @param {number} [options.coalesceMs=80] Delay before playing after burst updates (ms).
     * @returns {object} Coordinator API (notifyContentChange, scheduleFlush, dispose, …).
     */
    function createContentSwap(options) {
        options = options || {};
        var coalesceMs = options.coalesceMs != null ? options.coalesceMs : 80;
        var state = {
            burstExitSnapshot: null,
            deferredCommit: null,
            debounceTimer: null,
            pending: null
        };

        function clearFlushTimer() {
            if (!state.debounceTimer) return;
            if (typeof WorkerTimer !== 'undefined' && WorkerTimer.clearTimeout) {
                WorkerTimer.clearTimeout(state.debounceTimer);
            } else {
                clearTimeout(state.debounceTimer);
            }
            state.debounceTimer = null;
        }

        function scheduleFlushTimer(fn, ms) {
            if (typeof WorkerTimer !== 'undefined' && WorkerTimer.setTimeout) {
                return WorkerTimer.setTimeout(fn, ms);
            }
            return setTimeout(fn, ms);
        }

        function clearCoordinatorState(runCommit) {
            var commit = state.deferredCommit;
            state.pending = null;
            state.burstExitSnapshot = null;
            state.deferredCommit = null;
            if (runCommit === true && typeof commit === 'function') commit();
        }

        function isDeferred() {
            return state.deferredCommit != null;
        }

        function isPending() {
            return !!(state.pending || state.debounceTimer || state.burstExitSnapshot);
        }

        function dispose(target) {
            clearFlushTimer();
            clearCoordinatorState(false);
            if (target) cancelTargetSwap(target);
        }

        function releaseIfIdle(target) {
            if (!isPending() && target && !isTargetSwapActive(target)) {
                releaseTargetVisible(target);
            }
        }

        /**
         * @param {object} ctx host, target, animation, duration, allowed
         * @param {object} change isFirstPaint, applyLive(), commitDeferred()
         * @returns {boolean} true when animation scheduling started (skip immediate DOM on target)
         */
        function notifyContentChange(ctx, change) {
            change = change || {};
            if (!ctx || !ctx.target) return false;
            var anim = ctx.animation != null ? String(ctx.animation) : META_NONE;
            if (anim === META_NONE || anim === '') return false;
            if (change.isFirstPaint) return false;

            if (isTargetSwapActive(ctx.target)) {
                cancelTargetSwap(ctx.target);
                ctx.target.style.visibility = '';
            }

            var isFirstOfBurst = !state.debounceTimer && !state.burstExitSnapshot;
            if (isFirstOfBurst) {
                state.burstExitSnapshot = ctx.target.cloneNode(true);
                state.deferredCommit = change.commitDeferred || null;
            } else {
                if (typeof change.applyLive === 'function') change.applyLive();
                state.deferredCommit = null;
            }

            state.pending = {
                host: ctx.host,
                target: ctx.target,
                animation: anim,
                duration: ctx.duration,
                allowed: ctx.allowed
            };
            return true;
        }

        function scheduleFlush() {
            if (!state.pending) {
                if (state.deferredCommit || state.burstExitSnapshot) {
                    clearCoordinatorState(true);
                }
                return;
            }
            var target = state.pending.target;
            if (target) {
                cancelTargetSwap(target);
                target.style.visibility = '';
            }
            var isBurstContinuation = !!state.debounceTimer;
            var delay = isBurstContinuation ? coalesceMs : 0;
            clearFlushTimer();
            if (delay === 0) {
                flush();
                return;
            }
            state.debounceTimer = scheduleFlushTimer(function () {
                state.debounceTimer = null;
                flush();
            }, delay);
        }

        function flush() {
            var pending = state.pending;
            if (!pending || !pending.target) {
                clearCoordinatorState(true);
                return;
            }
            var target = pending.target;
            var exitSnapshot = state.burstExitSnapshot;
            var commit = state.deferredCommit;
            var swapDone = options.onSwapDone;
            state.pending = null;
            state.burstExitSnapshot = null;
            state.deferredCommit = null;
            if (typeof commit === 'function') commit();
            if (!exitSnapshot) return;

            swap({
                host: pending.host,
                target: target,
                animation: pending.animation,
                duration: pending.duration,
                allowed: pending.allowed,
                exitContent: exitSnapshot,
                enterContent: target.cloneNode(true),
                onDone: typeof swapDone === 'function' ? swapDone : undefined
            });
        }

        return {
            notifyContentChange: notifyContentChange,
            scheduleFlush: scheduleFlush,
            flush: flush,
            dispose: dispose,
            releaseIfIdle: releaseIfIdle,
            isDeferred: isDeferred,
            isPending: isPending
        };
    }

    function register(spec) {
        if (!spec || !spec.id) return;
        var id = String(spec.id);
        if (_isReservedId(id)) {
            console.warn('[WidgetAnimations] Cannot register reserved id:', id);
            return;
        }
        if (_registry[id]) {
            console.warn('[WidgetAnimations] Duplicate animation id:', id);
            return;
        }
        _registry[id] = {
            id: id,
            label: spec.label || id,
            category: spec.category || 'default',
            enterClass: spec.enterClass || ('wa-enter-' + id),
            exitClass: spec.exitClass || ('wa-exit-' + id),
            css: spec.css || '',
            hostRequires3D: spec.hostRequires3D === true
        };
        _registryOrder.push(id);
        _stylesInjected = false;
    }

    function getSchemaGroup(opts) {
        opts = opts || {};
        var slot = opts.slot || 'content';
        var keys = _slotKeys(slot);
        var keyAnim = opts.keyAnimation || keys.animation;
        var keyDur = opts.keyDuration || keys.duration;
        var allowed = opts.allowed;
        var durDef = opts.durationDefault != null ? opts.durationDefault : 1.0;
        var durMin = opts.durationMin != null ? opts.durationMin : 0.1;
        var durStep = opts.durationStep != null ? opts.durationStep : 0.1;
        var groupId = opts.groupId || ('wa_anim_' + slot);

        var options = [
            { value: META_NONE, text: 'None' },
            { value: META_RANDOM, text: 'Random' }
        ];
        var list = _listAnimations(allowed);
        var j;
        for (j = 0; j < list.length; j++) {
            options.push({ value: list[j].id, text: list[j].label });
        }

        function animActive(values) {
            if (!values) return false;
            var v = values[keyAnim];
            return v != null && String(v) !== '' && String(v) !== META_NONE;
        }

        var durDependsOn = [keyAnim];
        if (Array.isArray(opts.durationDependsOn)) {
            for (var di = 0; di < opts.durationDependsOn.length; di++) {
                durDependsOn.push(opts.durationDependsOn[di]);
            }
        }
        var durField = {
            key: keyDur,
            type: 'number',
            label: 'Duration (s)',
            min: durMin,
            step: durStep,
            default: durDef,
            cols: 12,
            dependsOn: durDependsOn,
            visibleWhen: animActive
        };
        if (opts.durationMax != null) {
            durField.max = opts.durationMax;
        }

        return {
            id: groupId,
            title: opts.title || 'Animations & Effects',
            icon: opts.icon || 'ph-sparkle',
            fields: [
                {
                    key: keyAnim,
                    type: 'select',
                    label: 'Animation',
                    cols: 12,
                    options: options,
                    default: META_NONE,
                    previewAnimationOnChange: true,
                    animationSlot: slot
                },
                durField,
                {
                    type: 'action_button',
                    label: 'Preview',
                    cols: 12,
                    previewAnimationSlot: slot,
                    dependsOn: [keyAnim],
                    visibleWhen: animActive
                }
            ]
        };
    }

    function _mountSwapLayers(opts, exitContent, enterContent) {
        var host = opts.host || (opts.target && opts.target.parentNode);
        var target = opts.target;
        var entry = opts._resolvedEntry;
        var duration = _clampDuration(opts.duration, 1.0);
        var direction = opts.direction != null && Number(opts.direction) < 0 ? -1 : 1;
        var durMs = Math.round(duration * 1000) + 50;

        cancelTargetSwap(target);

        _prepareHost(host, entry.hostRequires3D);

        var alignMode = _alignModeFromHost(host);
        var restoreVisibility = target.style.visibility === 'hidden' ? '' : target.style.visibility;

        exitContent.setAttribute('aria-hidden', 'true');
        enterContent.setAttribute('aria-hidden', 'true');

        _clearLayerClasses(exitContent);
        _clearLayerClasses(enterContent);

        exitContent.classList.add('wa-swap-layer', 'wa-swap-exiting');
        enterContent.classList.add('wa-swap-layer', 'wa-swap-entering');
        exitContent.style.setProperty('--wa-duration', duration + 's');
        exitContent.style.setProperty('--wa-dir', String(direction));
        enterContent.style.setProperty('--wa-duration', duration + 's');
        enterContent.style.setProperty('--wa-dir', String(direction));

        target.style.visibility = 'hidden';

        var stage = _createSwapStage(host);
        stage.appendChild(_wrapAlignedLayer(exitContent, alignMode, 5));
        stage.appendChild(_wrapAlignedLayer(enterContent, alignMode, 20));

        void exitContent.offsetWidth;

        exitContent.classList.add(entry.exitClass);
        enterContent.classList.add(entry.enterClass);

        var session = {
            target: target,
            host: host,
            stage: stage,
            timerId: null,
            rafId: null,
            restoreVisibility: restoreVisibility,
            onCancel: typeof opts.onCancel === 'function' ? opts.onCancel : null
        };
        target._waSwapSession = session;
        _activeSwaps += 1;

        function finalizeSwap() {
            session.rafId = null;
            session.onCancel = null;
            if (stage.parentNode) stage.parentNode.removeChild(stage);
            _releaseStageMedia(stage);
            if (target._waSwapSession !== session) return;
            _clearLayerClasses(target);
            target.style.visibility = session.restoreVisibility || '';
            target.style.removeProperty('--wa-duration');
            target.style.removeProperty('--wa-dir');
            target._waSwapSession = null;
            _activeSwaps = Math.max(0, _activeSwaps - 1);
            if (typeof opts.onDone === 'function') opts.onDone();
        }

        session.timerId = _scheduleSwapTimer(function () {
            session.timerId = null;
            if (target._waSwapSession !== session) {
                if (stage.parentNode) stage.parentNode.removeChild(stage);
                _releaseStageMedia(stage);
                return;
            }
            target.style.visibility = session.restoreVisibility || '';
            if (typeof requestAnimationFrame === 'function') {
                session.rafId = requestAnimationFrame(function () {
                    if (target._waSwapSession !== session) return;
                    session.rafId = requestAnimationFrame(finalizeSwap);
                });
            } else {
                finalizeSwap();
            }
        }, durMs);
    }

    function swap(opts) {
        if (!opts || !opts.target) {
            if (typeof opts.apply === 'function') opts.apply();
            return;
        }
        var animation = opts.animation != null ? String(opts.animation) : META_NONE;
        if (animation === META_NONE || animation === '') {
            if (typeof opts.apply === 'function') opts.apply();
            return;
        }

        var resolvedId = _resolveAnimationId(animation, opts.allowed);
        if (resolvedId === META_NONE) {
            if (typeof opts.apply === 'function') opts.apply();
            return;
        }

        var entry = _registry[resolvedId];
        if (!entry) {
            if (typeof opts.apply === 'function') opts.apply();
            return;
        }

        _ensureStyles();

        opts._resolvedEntry = entry;

        if (opts.exitContent && opts.enterContent) {
            _mountSwapLayers(opts, opts.exitContent, opts.enterContent);
            return;
        }

        var target = opts.target;
        var exitContent = target.cloneNode(true);
        if (typeof opts.apply === 'function') opts.apply();
        var enterContent = target.cloneNode(true);
        _mountSwapLayers(opts, exitContent, enterContent);
    }

    function previewOnce(widget, slot) {
        if (!widget || typeof widget.getAnimationSlot !== 'function') return;
        var spec = widget.getAnimationSlot(slot);
        if (!spec) return;
        if (typeof spec.preview === 'function') {
            spec.preview();
            return;
        }
        if (!spec.target) return;
        var anim = spec.animation != null ? String(spec.animation) : META_NONE;
        if (anim === META_NONE || anim === '') return;

        var runPreview = function () {
            var target = spec.target;
            swap({
                host: spec.host,
                target: target,
                animation: anim,
                duration: spec.duration,
                direction: 1,
                allowed: spec.allowed,
                exitContent: target.cloneNode(true),
                enterContent: target.cloneNode(true)
            });
        };

        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(function () {
                requestAnimationFrame(runPreview);
            });
        } else {
            setTimeout(runPreview, 0);
        }
    }

    function normalizeConfig(c, slot) {
        if (!c) return;
        var keys = _slotKeys(slot || 'content');
        var animKey = keys.animation;
        var durKey = keys.duration;
        var anim = c[animKey];
        c[animKey] = (typeof anim === 'string' && anim) ? anim : META_NONE;
        c[durKey] = _clampDuration(c[durKey], 1.0);
    }

    /* --- Register content-swap transitions (from Example_code/transistions.html) --- */

    register({
        id: 'cross-fade',
        label: '1. Cross Fade',
        category: 'content-swap',
        enterClass: 'wa-enter-cross-fade',
        exitClass: 'wa-exit-cross-fade',
        css: '@keyframes wa-en-cross-fade{0%{opacity:0}100%{opacity:1}}@keyframes wa-ex-cross-fade{0%{opacity:1}100%{opacity:0}}.wa-enter-cross-fade{animation-name:wa-en-cross-fade}.wa-exit-cross-fade{animation-name:wa-ex-cross-fade}'
    });

    register({
        id: 'flip-y',
        label: '2. 3D Flip Y',
        category: 'content-swap',
        hostRequires3D: true,
        enterClass: 'wa-enter-flip-y',
        exitClass: 'wa-exit-flip-y',
        css: '@keyframes wa-en-flip-y{0%{transform:rotateX(calc(90deg * var(--wa-dir)));opacity:0}100%{transform:rotateX(0);opacity:1}}@keyframes wa-ex-flip-y{0%{transform:rotateX(0);opacity:1}100%{transform:rotateX(calc(-90deg * var(--wa-dir)));opacity:0}}.wa-enter-flip-y{animation-name:wa-en-flip-y}.wa-exit-flip-y{animation-name:wa-ex-flip-y}'
    });

    register({
        id: 'black-hole',
        label: '3. Black Hole',
        category: 'content-swap',
        enterClass: 'wa-enter-black-hole',
        exitClass: 'wa-exit-black-hole',
        css: '@keyframes wa-en-black-hole{0%{transform:scale(2) translateY(50%);opacity:0;filter:blur(20px) contrast(200%)}100%{transform:scale(1) translateY(0);opacity:1;filter:blur(0) contrast(100%)}}@keyframes wa-ex-black-hole{0%{transform:scale(1) translateY(0);opacity:1;filter:blur(0) contrast(100%)}100%{transform:scale(0) translateY(-50%);opacity:0;filter:blur(20px) contrast(200%)}}.wa-enter-black-hole{animation-name:wa-en-black-hole}.wa-exit-black-hole{animation-name:wa-ex-black-hole}'
    });

    register({
        id: 'book-fold',
        label: '4. Book Fold',
        category: 'content-swap',
        hostRequires3D: true,
        enterClass: 'wa-enter-book-fold',
        exitClass: 'wa-exit-book-fold',
        css: '@keyframes wa-en-book-fold{0%{transform:rotateY(calc(-90deg * var(--wa-dir)));transform-origin:left;opacity:0}100%{transform:rotateY(0);transform-origin:left;opacity:1}}@keyframes wa-ex-book-fold{0%{transform:rotateY(0);transform-origin:right;opacity:1}100%{transform:rotateY(calc(90deg * var(--wa-dir)));transform-origin:right;opacity:0}}.wa-enter-book-fold{animation-name:wa-en-book-fold}.wa-exit-book-fold{animation-name:wa-ex-book-fold}'
    });

    register({
        id: 'p-fold',
        label: '5. Perspective Fold',
        category: 'content-swap',
        hostRequires3D: true,
        enterClass: 'wa-enter-p-fold',
        exitClass: 'wa-exit-p-fold',
        css: '@keyframes wa-en-p-fold{0%{transform:rotateY(calc(-90deg * var(--wa-dir)));transform-origin:calc(50% + (50% * var(--wa-dir))) 50%;opacity:0}100%{transform:rotateY(0);opacity:1}}@keyframes wa-ex-p-fold{0%{transform:rotateY(0);opacity:1}100%{transform:rotateY(calc(90deg * var(--wa-dir)));transform-origin:calc(50% - (50% * var(--wa-dir))) 50%;opacity:0}}.wa-enter-p-fold{animation-name:wa-en-p-fold}.wa-exit-p-fold{animation-name:wa-ex-p-fold}'
    });

    register({
        id: 'slide-h',
        label: '6. Slide Horizontal',
        category: 'content-swap',
        enterClass: 'wa-enter-slide-h',
        exitClass: 'wa-exit-slide-h',
        css: '@keyframes wa-en-slide-h{0%{transform:translateX(calc(100% * var(--wa-dir)));opacity:0}100%{transform:translateX(0);opacity:1}}@keyframes wa-ex-slide-h{0%{transform:translateX(0);opacity:1}100%{transform:translateX(calc(-100% * var(--wa-dir)));opacity:0}}.wa-enter-slide-h{animation-name:wa-en-slide-h}.wa-exit-slide-h{animation-name:wa-ex-slide-h}'
    });

    register({
        id: 'slide-v',
        label: '7. Slide Vertical',
        category: 'content-swap',
        enterClass: 'wa-enter-slide-v',
        exitClass: 'wa-exit-slide-v',
        css: '@keyframes wa-en-slide-v{0%{transform:translateY(calc(100% * var(--wa-dir)));opacity:0}100%{transform:translateY(0);opacity:1}}@keyframes wa-ex-slide-v{0%{transform:translateY(0);opacity:1}100%{transform:translateY(calc(-100% * var(--wa-dir)));opacity:0}}.wa-enter-slide-v{animation-name:wa-en-slide-v}.wa-exit-slide-v{animation-name:wa-ex-slide-v}'
    });

    register({
        id: 'zoom-fade',
        label: '8. Zoom Fade',
        category: 'content-swap',
        enterClass: 'wa-enter-zoom-fade',
        exitClass: 'wa-exit-zoom-fade',
        css: '@keyframes wa-en-zoom-fade{0%{transform:scale(1.2);opacity:0}100%{transform:scale(1);opacity:1}}@keyframes wa-ex-zoom-fade{0%{transform:scale(1);opacity:1}100%{transform:scale(0.8);opacity:0}}.wa-enter-zoom-fade{animation-name:wa-en-zoom-fade}.wa-exit-zoom-fade{animation-name:wa-ex-zoom-fade}'
    });

    register({
        id: 'zoom-out-in',
        label: '9. Zoom out - in',
        category: 'content-swap',
        enterClass: 'wa-enter-zoom-out-in',
        exitClass: 'wa-exit-zoom-out-in',
        css: '@keyframes wa-en-zoom-out-in{0%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:1}}@keyframes wa-ex-zoom-out-in{0%{transform:scale(1);opacity:1}100%{transform:scale(0);opacity:0}}.wa-enter-zoom-out-in{animation-name:wa-en-zoom-out-in}.wa-exit-zoom-out-in{animation-name:wa-ex-zoom-out-in}'
    });

    register({
        id: 'zoom-in-out',
        label: '10. Zoom in - out',
        category: 'content-swap',
        enterClass: 'wa-enter-zoom-in-out',
        exitClass: 'wa-exit-zoom-in-out',
        css: '@keyframes wa-en-zoom-in-out{0%{transform:scale(3);opacity:0}100%{transform:scale(1);opacity:1}}@keyframes wa-ex-zoom-in-out{0%{transform:scale(1);opacity:1}100%{transform:scale(3);opacity:0}}.wa-enter-zoom-in-out{animation-name:wa-en-zoom-in-out}.wa-exit-zoom-in-out{animation-name:wa-ex-zoom-in-out}'
    });

    register({
        id: 'drop-bounce',
        label: '11. Drop Bounce',
        category: 'content-swap',
        enterClass: 'wa-enter-drop-bounce',
        exitClass: 'wa-exit-drop-bounce',
        css: '@keyframes wa-en-drop-bounce{0%{transform:translateY(-100%);opacity:0}50%{transform:translateY(10%);opacity:1}75%{transform:translateY(-5%)}100%{transform:translateY(0);opacity:1}}@keyframes wa-ex-drop-bounce{0%{transform:translateY(0);opacity:1}100%{transform:translateY(100%);opacity:0}}.wa-enter-drop-bounce{animation-name:wa-en-drop-bounce}.wa-exit-drop-bounce{animation-name:wa-ex-drop-bounce}'
    });

    register({
        id: 'rise-bounce',
        label: '12. Rise Bounce',
        category: 'content-swap',
        enterClass: 'wa-enter-rise-bounce',
        exitClass: 'wa-exit-rise-bounce',
        css: '@keyframes wa-en-rise-bounce{0%{transform:translateY(100%);opacity:0}50%{transform:translateY(-10%);opacity:1}75%{transform:translateY(5%)}100%{transform:translateY(0);opacity:1}}@keyframes wa-ex-rise-bounce{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-100%);opacity:0}}.wa-enter-rise-bounce{animation-name:wa-en-rise-bounce}.wa-exit-rise-bounce{animation-name:wa-ex-rise-bounce}'
    });

    register({
        id: 'blur-slide-v',
        label: '13. Blur Slide Vertical',
        category: 'content-swap',
        enterClass: 'wa-enter-blur-slide-v',
        exitClass: 'wa-exit-blur-slide-v',
        css: '@keyframes wa-en-blur-slide-v{0%{transform:translateY(calc(50% * var(--wa-dir)));opacity:0;filter:blur(20px)}100%{transform:translateY(0);opacity:1;filter:blur(0)}}@keyframes wa-ex-blur-slide-v{0%{transform:translateY(0);opacity:1;filter:blur(0)}100%{transform:translateY(calc(-50% * var(--wa-dir)));opacity:0;filter:blur(20px)}}.wa-enter-blur-slide-v{animation-name:wa-en-blur-slide-v}.wa-exit-blur-slide-v{animation-name:wa-ex-blur-slide-v}'
    });

    register({
        id: 'cube-h',
        label: '14. Cube Horizontal',
        category: 'content-swap',
        hostRequires3D: true,
        enterClass: 'wa-enter-cube-h',
        exitClass: 'wa-exit-cube-h',
        css: '@keyframes wa-en-cube-h{0%{transform:rotateY(calc(90deg * var(--wa-dir))) translateZ(500px);opacity:0}100%{transform:rotateY(0) translateZ(0);opacity:1}}@keyframes wa-ex-cube-h{0%{transform:rotateY(0) translateZ(0);opacity:1}100%{transform:rotateY(calc(-90deg * var(--wa-dir))) translateZ(500px);opacity:0}}.wa-enter-cube-h{animation-name:wa-en-cube-h}.wa-exit-cube-h{animation-name:wa-ex-cube-h}'
    });

    register({
        id: 'cube-v',
        label: '15. Cube Vertical',
        category: 'content-swap',
        hostRequires3D: true,
        enterClass: 'wa-enter-cube-v',
        exitClass: 'wa-exit-cube-v',
        css: '@keyframes wa-en-cube-v{0%{transform:rotateX(calc(90deg * var(--wa-dir))) translateZ(500px);opacity:0}100%{transform:rotateX(0) translateZ(0);opacity:1}}@keyframes wa-ex-cube-v{0%{transform:rotateX(0) translateZ(0);opacity:1}100%{transform:rotateX(calc(-90deg * var(--wa-dir))) translateZ(500px);opacity:0}}.wa-enter-cube-v{animation-name:wa-en-cube-v}.wa-exit-cube-v{animation-name:wa-ex-cube-v}'
    });

    register({
        id: 'push-away',
        label: '16. Push Away',
        category: 'content-swap',
        hostRequires3D: true,
        enterClass: 'wa-enter-push-away',
        exitClass: 'wa-exit-push-away',
        css: '@keyframes wa-en-push-away{0%{transform:scale(0.5) translateZ(-500px);opacity:0}100%{transform:scale(1) translateZ(0);opacity:1}}@keyframes wa-ex-push-away{0%{transform:scale(1) translateZ(0);opacity:1}100%{transform:scale(1.5) translateZ(500px);opacity:0}}.wa-enter-push-away{animation-name:wa-en-push-away}.wa-exit-push-away{animation-name:wa-ex-push-away}'
    });

    register({
        id: 'pull-fwd',
        label: '17. Pull Forward',
        category: 'content-swap',
        hostRequires3D: true,
        enterClass: 'wa-enter-pull-fwd',
        exitClass: 'wa-exit-pull-fwd',
        css: '@keyframes wa-en-pull-fwd{0%{transform:scale(2) translateZ(500px);opacity:0}100%{transform:scale(1) translateZ(0);opacity:1}}@keyframes wa-ex-pull-fwd{0%{transform:scale(1) translateZ(0);opacity:1}100%{transform:scale(0.5) translateZ(-500px);opacity:0}}.wa-enter-pull-fwd{animation-name:wa-en-pull-fwd}.wa-exit-pull-fwd{animation-name:wa-ex-pull-fwd}'
    });

    return {
        META_NONE: META_NONE,
        META_RANDOM: META_RANDOM,
        register: register,
        getSchemaGroup: getSchemaGroup,
        swap: swap,
        createContentSwap: createContentSwap,
        previewOnce: previewOnce,
        cancelTargetSwap: cancelTargetSwap,
        isTargetSwapActive: isTargetSwapActive,
        releaseTargetVisible: releaseTargetVisible,
        purgeSwapArtifacts: purgeSwapArtifacts,
        normalizeConfig: normalizeConfig,
        listAnimations: _listAnimations,
        resolveAnimationId: _resolveAnimationId
    };
})();
