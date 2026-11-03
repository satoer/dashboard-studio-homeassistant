/**
 * Text widget Text Scroll: continuous Loop / Bounce / Reset motion of the
 * markdown block. Safari 12: no optional chaining or nullish coalescing.
 *
 * None costs nothing (no track, clone, observer, or timers). Motion is a CSS
 * transform on the compositor. Script only measures when content, fonts,
 * frame size, or settings change.
 */
(function (global) {
    var DIR_NONE = 'none';
    var DIR_H = 'horizontal';
    var DIR_V = 'vertical';
    var MOTION_LOOP = 'loop';
    var MOTION_BOUNCE = 'bounce';
    var MOTION_RESET = 'reset';

    var SPEED_DEFAULT = 50;
    var SPEED_MIN = 10;
    var SPEED_MAX = 300;
    var GAP_DEFAULT = 48;
    var HOLD_DEFAULT = 1;
    var FADE_DEFAULT = 0.2;
    var EPS = 1;
    var SIZE_SNAP = 2;

    var CSS_ID = 'ds-text-scroll-css';
    var PAUSED_CLASS = 'is-paused';
    var DRAG_CLASS = 'ds-edit-dragging';
    var TRACK_CLASS = 'text-scroll-track';
    var CLONE_CLASS = 'text-scroll-clone';
    var GAP_CLASS = 'text-scroll-gap';

    var stylesInjected = false;

    var SHARED_CSS = [
        '.' + TRACK_CLASS + '{display:flex;flex-wrap:nowrap;align-items:flex-start;box-sizing:border-box;overflow:visible;transform:translate3d(0,0,0);will-change:transform}',
        '.' + TRACK_CLASS + '.' + PAUSED_CLASS + '{animation-play-state:paused}',
        '#dashboard-canvas.' + DRAG_CLASS + ' .' + TRACK_CLASS + '{animation-play-state:paused}',
        '.' + GAP_CLASS + '{flex:none;pointer-events:none}',
        '.' + CLONE_CLASS + '{flex:none}',
        '@keyframes ds-text-scroll-neg-x{from{transform:translate3d(0,0,0)}to{transform:translate3d(-100%,0,0)}}',
        '@keyframes ds-text-scroll-pos-x{from{transform:translate3d(0,0,0)}to{transform:translate3d(100%,0,0)}}',
        '@keyframes ds-text-scroll-neg-y{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,-100%,0)}}',
        '@keyframes ds-text-scroll-pos-y{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,100%,0)}}',
        '@keyframes ds-text-scroll-fade-out{from{opacity:1}to{opacity:0}}',
        '@keyframes ds-text-scroll-fade-in{from{opacity:0}to{opacity:1}}',
        '@media (prefers-reduced-motion:reduce){.' + TRACK_CLASS + '{animation:none;transform:none;opacity:1}}'
    ].join('');

    function ensureStyles() {
        if (stylesInjected || typeof document === 'undefined') return;
        var el = document.getElementById(CSS_ID);
        if (!el) {
            el = document.createElement('style');
            el.id = CSS_ID;
            el.textContent = SHARED_CSS;
            document.head.appendChild(el);
        }
        stylesInjected = true;
    }

    function clampNum(raw, def, min, max) {
        var n = parseFloat(String(raw == null ? '' : raw));
        if (isNaN(n) || !isFinite(n)) n = def;
        if (n < min) n = min;
        if (max != null && n > max) n = max;
        return n;
    }

    function normalizeDir(raw) {
        var v = raw != null ? String(raw) : DIR_NONE;
        if (v === DIR_H || v === DIR_V) return v;
        return DIR_NONE;
    }

    function normalizeMotion(raw) {
        var v = raw != null ? String(raw) : MOTION_LOOP;
        if (v === MOTION_BOUNCE || v === MOTION_RESET) return v;
        return MOTION_LOOP;
    }

    function isActiveDir(dir) {
        return dir === DIR_H || dir === DIR_V;
    }

    function prefersReducedMotion() {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        try {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches === true;
        } catch (e) {
            return false;
        }
    }

    function canvasEl() {
        return typeof document !== 'undefined' ? document.getElementById('dashboard-canvas') : null;
    }

    function isEditDragging() {
        var canvas = canvasEl();
        return !!(canvas && canvas.classList && canvas.classList.contains(DRAG_CLASS));
    }

    function isSwapActive(root) {
        return typeof WidgetAnimations !== 'undefined'
            && typeof WidgetAnimations.isTargetSwapActive === 'function'
            && WidgetAnimations.isTargetSwapActive(root);
    }

    function isEffectivelyPaused(widget) {
        var st = widget && widget._textScroll;
        if (st && st.paused) return true;
        if (isEditDragging()) return true;
        if (widget && isSwapActive(widget.mdRoot)) return true;
        return false;
    }

    function clearHoldTimer(st) {
        if (!st) return;
        if (st.holdTimer) {
            clearTimeout(st.holdTimer);
            st.holdTimer = 0;
        }
    }

    function contentSigOf(widget) {
        return widget && widget._cachedContentSig != null ? String(widget._cachedContentSig) : '';
    }

    function vAlignOf(c) {
        if (typeof TextWidget !== 'undefined' && typeof TextWidget._effectiveTextVerticalAlign === 'function') {
            return TextWidget._effectiveTextVerticalAlign(c, 'middle');
        }
        return (c && c.textVerticalAlign) ? c.textVerticalAlign : 'middle';
    }

    function hAlignOf(c) {
        if (!c) return 'left';
        if (typeof TextWidget !== 'undefined' && typeof TextWidget.useTypographyAlign === 'function'
            && TextWidget.useTypographyAlign(c)) {
            return 'left';
        }
        var a = c.textAlign;
        if (a === 'center' || a === 'right') return a;
        return 'left';
    }

    function flexAlign(align, axisIsVertical) {
        if (axisIsVertical) {
            if (align === 'bottom') return 'flex-end';
            if (align === 'middle' || align === 'center') return 'center';
            return 'flex-start';
        }
        if (align === 'right') return 'flex-end';
        if (align === 'center') return 'center';
        return 'flex-start';
    }

    function applyHostAlign(host, dir, c, moving) {
        if (!host || !host.style) return;
        host.style.display = 'flex';
        if (dir === DIR_H) {
            host.style.flexDirection = 'row';
            host.style.alignItems = flexAlign(vAlignOf(c), true);
            host.style.justifyContent = moving ? 'flex-start' : flexAlign(hAlignOf(c), false);
        } else {
            host.style.flexDirection = 'column';
            host.style.alignItems = flexAlign(hAlignOf(c), false);
            host.style.justifyContent = moving ? 'flex-start' : flexAlign(vAlignOf(c), true);
        }
    }

    function hasPercentTables(root) {
        return !!(root && root.querySelector && root.querySelector('table'));
    }

    function snapPx(n) {
        if (!n || n < 0) return 0;
        return Math.round(n / SIZE_SNAP) * SIZE_SNAP;
    }

    function nearPx(a, b) {
        return Math.abs((a || 0) - (b || 0)) < SIZE_SNAP;
    }

    function setFitContentWidth(el) {
        el.style.width = '-webkit-fit-content';
        el.style.width = 'fit-content';
    }

    /**
     * Horizontal measure: wrap-off uses max-content. Wrap-on shrinks to the text and
     * caps at the frame so Bounce/Reset still have slack when the copy is smaller
     * than the widget. Tables with width 100% stay sized to the frame.
     */
    function applyRootMeasureStyles(root, dir, wrapOn, frameW) {
        if (!root || !root.style) return;
        root.style.flex = 'none';
        root.style.flexShrink = '0';
        root.style.height = 'auto';
        root.style.maxHeight = 'none';
        root.style.minHeight = '0';
        root.style.display = '';
        root.style.flexDirection = '';
        root.style.justifyContent = '';
        if (dir === DIR_H) {
            var fw = frameW > 0 ? frameW : 0;
            if (hasPercentTables(root)) {
                root.style.width = fw + 'px';
                root.style.maxWidth = fw + 'px';
                root.style.minWidth = '0';
            } else if (wrapOn) {
                root.style.minWidth = '0';
                root.style.maxWidth = fw > 0 ? (fw + 'px') : 'none';
                setFitContentWidth(root);
            } else {
                root.style.width = 'max-content';
                root.style.maxWidth = 'none';
                root.style.minWidth = '0';
            }
        } else {
            root.style.width = '100%';
            root.style.maxWidth = '';
            root.style.minWidth = '';
        }
    }

    function lockRootTravelWidth(root, dir, wrapOn, contentW, frameW) {
        if (dir !== DIR_H || !root || !root.style || !(contentW > 0) || hasPercentTables(root)) return;
        var w = contentW;
        if (wrapOn && frameW > 0 && w > frameW) w = frameW;
        root.style.width = w + 'px';
        root.style.maxWidth = wrapOn && frameW > 0 ? (frameW + 'px') : 'none';
        root.style.minWidth = w + 'px';
    }

    function measureBox(el) {
        return {
            w: Math.max(el.scrollWidth || 0, el.offsetWidth || 0),
            h: Math.max(el.scrollHeight || 0, el.offsetHeight || 0)
        };
    }

    function keyframeName(dir, negative) {
        if (dir === DIR_H) return negative ? 'ds-text-scroll-neg-x' : 'ds-text-scroll-pos-x';
        return negative ? 'ds-text-scroll-neg-y' : 'ds-text-scroll-pos-y';
    }

    function travelDuration(travel, speed) {
        var px = travel > 0 ? travel : 0;
        var sp = speed > 0 ? speed : SPEED_DEFAULT;
        var sec = px / sp;
        if (sec < 0.05) sec = 0.05;
        return sec;
    }

    function applyCssAnimation(track, opts) {
        if (!track || !track.style) return;
        track.style.animationName = opts.name;
        track.style.animationDuration = String(opts.duration) + 's';
        track.style.animationTimingFunction = 'linear';
        track.style.animationDelay = String(opts.delay || 0) + 's';
        track.style.animationIterationCount = opts.iterations || '1';
        track.style.animationDirection = opts.direction || 'normal';
        track.style.animationFillMode = opts.fill || 'none';
    }

    function stopTrackAnimation(track) {
        if (!track || !track.style) return;
        track.style.animationName = 'none';
        track.style.animationDuration = '0s';
        track.style.animationDelay = '0s';
        track.style.animationIterationCount = '1';
        track.style.animationDirection = 'normal';
        track.style.animationFillMode = 'none';
        track.style.opacity = '1';
        track.style.transform = 'translate3d(0,0,0)';
    }

    function freezeTravelTransform(track, dir, negative) {
        if (!track || !track.style) return;
        var x = '0';
        var y = '0';
        if (dir === DIR_H) x = negative ? '-100%' : '100%';
        else y = negative ? '-100%' : '100%';
        track.style.animationName = 'none';
        track.style.transform = 'translate3d(' + x + ',' + y + ',0)';
    }

    function sizeTrack(track, dir, travel) {
        if (dir === DIR_H) {
            track.style.width = travel + 'px';
            track.style.height = 'auto';
            track.style.minWidth = travel + 'px';
            track.style.minHeight = '0';
        } else {
            track.style.width = '100%';
            track.style.height = travel + 'px';
            track.style.minWidth = '0';
            track.style.minHeight = travel + 'px';
        }
    }

    function clearTrackSize(track) {
        track.style.width = '';
        track.style.height = '';
        track.style.minWidth = '';
        track.style.minHeight = '';
    }

    function ensureTrack(widget) {
        var host = widget.mdScrollHost;
        var root = widget.mdRoot;
        var st = widget._textScroll;
        if (!host || !root) return null;
        if (!st) {
            st = widget._textScroll = {
                track: null,
                gap: null,
                clone: null,
                observer: null,
                holdTimer: 0,
                phase: '',
                sig: '',
                paused: false,
                animBound: null
            };
        }
        var track = st.track;
        if (!track || !track.parentNode) {
            track = document.createElement('div');
            track.className = TRACK_CLASS;
            host.appendChild(track);
            st.track = track;
            st.animBound = function (ev) { onTrackAnimationEnd(widget, ev); };
            track.addEventListener('animationend', st.animBound, false);
        }
        if (root.parentNode !== track) {
            track.insertBefore(root, track.firstChild);
        }
        if (st.observer) return st;
        if (typeof ResizeObserver !== 'undefined') {
            st.observer = new ResizeObserver(function () {
                scheduleSync(widget);
            });
            st.observer.observe(host);
        }
        return st;
    }

    function removeCloneAndGap(st) {
        if (!st) return;
        if (st.clone && st.clone.parentNode) st.clone.parentNode.removeChild(st.clone);
        st.clone = null;
        if (st.gap && st.gap.parentNode) st.gap.parentNode.removeChild(st.gap);
        st.gap = null;
    }

    function buildLoopCopies(st, root, dir, gapPx) {
        removeCloneAndGap(st);
        var gap = document.createElement('div');
        gap.className = GAP_CLASS;
        gap.setAttribute('aria-hidden', 'true');
        sizeGap(gap, dir, gapPx);
        var clone = root.cloneNode(true);
        clone.className = (root.className || '') + ' ' + CLONE_CLASS;
        clone.setAttribute('aria-hidden', 'true');
        st.track.appendChild(gap);
        st.track.appendChild(clone);
        st.gap = gap;
        st.clone = clone;
    }

    function sizeGap(gap, dir, gapPx) {
        if (dir === DIR_H) {
            gap.style.width = gapPx + 'px';
            gap.style.height = '1px';
        } else {
            gap.style.width = '1px';
            gap.style.height = gapPx + 'px';
        }
    }

    function teardown(widget) {
        if (!widget) return;
        if (widget._textScrollRaf && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(widget._textScrollRaf);
        }
        widget._textScrollRaf = 0;
        widget._textScrollZeroFrameTries = 0;
        var st = widget._textScroll;
        if (!st) return;
        clearHoldTimer(st);
        if (st.observer) {
            st.observer.disconnect();
            st.observer = null;
        }
        var host = widget.mdScrollHost;
        var root = widget.mdRoot;
        var track = st.track;
        if (track && st.animBound) {
            track.removeEventListener('animationend', st.animBound, false);
        }
        removeCloneAndGap(st);
        if (root && host && root.parentNode !== host) {
            if (track && track.parentNode === host) {
                host.insertBefore(root, track);
            } else {
                host.appendChild(root);
            }
        }
        if (root && root.style) {
            root.style.maxWidth = '';
            root.style.minWidth = '';
            root.style.width = '';
            root.style.flexShrink = '';
        }
        if (track && track.parentNode) track.parentNode.removeChild(track);
        widget._textScroll = null;
    }

    function idleInFrame(widget, st, dir, c) {
        removeCloneAndGap(st);
        stopTrackAnimation(st.track);
        clearTrackSize(st.track);
        st.track.style.willChange = '';
        var host = widget.mdScrollHost;
        var fw = host && host.clientWidth ? host.clientWidth : 0;
        applyRootMeasureStyles(widget.mdRoot, dir, c.mdTextWrap !== false, fw);
        if (widget.mdRoot) {
            var idleBox = measureBox(widget.mdRoot);
            lockRootTravelWidth(widget.mdRoot, dir, c.mdTextWrap !== false, idleBox.w, fw);
        }
        applyHostAlign(widget.mdScrollHost, dir, c, false);
        st.phase = 'idle';
    }

    function startLoopOrBounce(widget, spec) {
        var st = widget._textScroll;
        var track = st.track;
        sizeTrack(track, spec.dir, spec.travel);
        track.style.opacity = '1';
        track.style.transform = '';
        track.style.willChange = 'transform';
        var direction = 'normal';
        var delay = 0;
        var fill = 'none';
        if (spec.motion === MOTION_BOUNCE) {
            direction = spec.reverse ? 'alternate-reverse' : 'alternate';
        } else if (spec.motion === MOTION_LOOP) {
            direction = spec.reverse ? 'reverse' : 'normal';
            if (spec.hold > 0) {
                delay = spec.hold;
                fill = 'backwards';
            }
        } else if (spec.hold > 0) {
            delay = spec.hold;
            fill = 'backwards';
        }
        applyCssAnimation(track, {
            name: spec.kf,
            duration: spec.duration,
            delay: delay,
            iterations: 'infinite',
            direction: direction,
            fill: fill
        });
        st.phase = spec.motion;
    }

    function startResetTravel(widget, spec) {
        var st = widget._textScroll;
        var track = st.track;
        sizeTrack(track, spec.dir, spec.travel);
        track.style.opacity = '1';
        track.style.transform = '';
        track.style.willChange = 'transform';
        applyCssAnimation(track, {
            name: spec.kf,
            duration: spec.duration,
            delay: 0,
            iterations: '1',
            direction: 'normal',
            fill: 'forwards'
        });
        st.phase = 'travel';
        st.resetSpec = spec;
    }

    function startResetHold(widget) {
        var st = widget._textScroll;
        if (!st || !st.resetSpec) return;
        var delay = Math.max(0, st.resetSpec.hold) * 1000;
        st.phase = 'hold';
        clearHoldTimer(st);
        function fire() {
            if (!widget._textScroll || widget._textScroll !== st) return;
            if (isEffectivelyPaused(widget)) {
                st.holdTimer = setTimeout(fire, 80);
                return;
            }
            st.holdTimer = 0;
            startResetFadeOut(widget);
        }
        st.holdTimer = setTimeout(fire, delay);
    }

    function startResetFadeOut(widget) {
        var st = widget._textScroll;
        if (!st || !st.resetSpec || !st.track) return;
        var spec = st.resetSpec;
        freezeTravelTransform(st.track, spec.dir, spec.negative);
        if (spec.fade < 0.01) {
            startResetFadeIn(widget);
            return;
        }
        st.phase = 'fadeOut';
        applyCssAnimation(st.track, {
            name: 'ds-text-scroll-fade-out',
            duration: spec.fade,
            fill: 'forwards'
        });
    }

    function startResetFadeIn(widget) {
        var st = widget._textScroll;
        if (!st || !st.resetSpec || !st.track) return;
        var spec = st.resetSpec;
        stopTrackAnimation(st.track);
        sizeTrack(st.track, spec.dir, spec.travel);
        if (spec.fade < 0.01) {
            st.track.style.opacity = '1';
            startResetTravel(widget, spec);
            return;
        }
        st.track.style.opacity = '0';
        st.phase = 'fadeIn';
        applyCssAnimation(st.track, {
            name: 'ds-text-scroll-fade-in',
            duration: spec.fade,
            fill: 'forwards'
        });
    }

    function onTrackAnimationEnd(widget, ev) {
        var st = widget._textScroll;
        if (!st || !ev || ev.target !== st.track) return;
        var name = ev.animationName || '';
        if (st.phase === 'travel' && name.indexOf('ds-text-scroll-') === 0 && name.indexOf('fade') === -1) {
            startResetHold(widget);
            return;
        }
        if (st.phase === 'fadeOut' && name === 'ds-text-scroll-fade-out') {
            startResetFadeIn(widget);
            return;
        }
        if (st.phase === 'fadeIn' && name === 'ds-text-scroll-fade-in') {
            startResetTravel(widget, st.resetSpec);
        }
    }

    function computeTravel(dir, overflow, content, frame) {
        var contentSize = dir === DIR_H ? content.w : content.h;
        var frameSize = dir === DIR_H ? frame.w : frame.h;
        var slack = frameSize - contentSize;
        var overflowAmt = contentSize - frameSize;
        var travel;
        var negative;
        if (overflow) {
            travel = overflowAmt;
            negative = true;
        } else {
            travel = slack;
            negative = false;
        }
        if (travel < EPS) travel = 0;
        return { travel: travel, negative: negative };
    }

    function loopSpacer(contentSize, frameSize, gapPx) {
        var gap = gapPx > 0 ? gapPx : 0;
        var exitPad = frameSize > contentSize ? (frameSize - contentSize) : 0;
        return gap + exitPad;
    }

    function loopTravel(contentSize, spacer) {
        return contentSize + spacer;
    }

    function refreshLoopClone(st, root, dir, contentW) {
        if (!st || !st.clone || !root) return;
        st.clone.innerHTML = root.innerHTML;
        if (dir === DIR_H && contentW > 0) {
            st.clone.style.width = contentW + 'px';
            st.clone.style.maxWidth = 'none';
            st.clone.style.flex = 'none';
            st.clone.style.flexShrink = '0';
        }
    }

    function applyMotion(widget, c, dir, motion) {
        var st = ensureTrack(widget);
        if (!st) return;
        var host = widget.mdScrollHost;
        var root = widget.mdRoot;
        var wrapOn = c.mdTextWrap !== false;
        var overflowOnly = c.textScrollOverflowOnly !== false;
        var reverse = c.textScrollReverse === true;
        var speed = c.textScrollSpeed;
        var gapPx = c.textScrollGap;
        var hold = c.textScrollHold;
        var fade = c.textScrollFade;

        st.track.style.flexDirection = dir === DIR_H ? 'row' : 'column';

        var frame = { w: host.clientWidth || 0, h: host.clientHeight || 0 };
        applyRootMeasureStyles(root, dir, wrapOn, frame.w);
        var content = measureBox(root);
        if (st.lastContentW && nearPx(content.w, st.lastContentW)) content.w = st.lastContentW;
        if (st.lastContentH && nearPx(content.h, st.lastContentH)) content.h = st.lastContentH;
        if (st.lastFrameW && nearPx(frame.w, st.lastFrameW)) frame.w = st.lastFrameW;
        if (st.lastFrameH && nearPx(frame.h, st.lastFrameH)) frame.h = st.lastFrameH;

        var overflow = dir === DIR_H
            ? content.w > (frame.w + EPS)
            : content.h > (frame.h + EPS);
        var reduced = prefersReducedMotion();
        var sitStill = reduced || (overflowOnly && !overflow)
            || frame.w < EPS || frame.h < EPS;
        if (frame.w < EPS || frame.h < EPS) {
            if (!widget._textScrollZeroFrameTries) widget._textScrollZeroFrameTries = 0;
            if (widget._textScrollZeroFrameTries < 2) {
                widget._textScrollZeroFrameTries += 1;
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(function () { scheduleSync(widget); });
                }
            }
        } else {
            widget._textScrollZeroFrameTries = 0;
        }

        var travel = 0;
        var negative = true;
        var spacer = gapPx > 0 ? gapPx : 0;
        if (!sitStill) {
            if (motion === MOTION_LOOP) {
                var contentSize = dir === DIR_H ? content.w : content.h;
                var frameSize = dir === DIR_H ? frame.w : frame.h;
                spacer = loopSpacer(contentSize, frameSize, gapPx);
                travel = loopTravel(contentSize, spacer);
                negative = true;
            } else {
                var t = computeTravel(dir, overflow, content, frame);
                travel = t.travel;
                if (motion === MOTION_BOUNCE) {
                    negative = t.negative;
                } else {
                    negative = reverse ? !t.negative : t.negative;
                }
            }
        }
        if (travel < EPS) sitStill = true;

        var htmlSig = contentSigOf(widget);
        var layoutSig = [
            dir, motion, speed, reverse ? '1' : '0', overflowOnly ? '1' : '0',
            wrapOn ? 'w' : 'n', gapPx, hold, fade,
            vAlignOf(c), hAlignOf(c),
            snapPx(frame.w), snapPx(frame.h),
            snapPx(content.w), snapPx(content.h),
            snapPx(travel), sitStill ? 'i' : 'm',
            reduced ? 'r' : ''
        ].join('\x01');

        if (st.layoutSig === layoutSig && st.track) {
            if (st.htmlSig !== htmlSig) {
                st.htmlSig = htmlSig;
                if (motion === MOTION_LOOP && !sitStill) {
                    refreshLoopClone(st, root, dir, content.w);
                }
            }
            return;
        }
        st.layoutSig = layoutSig;
        st.htmlSig = htmlSig;
        st.lastContentW = content.w;
        st.lastContentH = content.h;
        st.lastFrameW = frame.w;
        st.lastFrameH = frame.h;

        applyHostAlign(host, dir, c, !sitStill);
        clearHoldTimer(st);
        stopTrackAnimation(st.track);
        clearTrackSize(st.track);

        if (dir === DIR_H) {
            if (overflow && content.w > 0 && !hasPercentTables(root)) {
                root.style.width = content.w + 'px';
                root.style.maxWidth = 'none';
                root.style.minWidth = content.w + 'px';
            } else {
                applyRootMeasureStyles(root, dir, wrapOn, frame.w);
                lockRootTravelWidth(root, dir, wrapOn, content.w, frame.w);
            }
        }

        if (sitStill) {
            idleInFrame(widget, st, dir, c);
            return;
        }

        var spec = {
            dir: dir,
            motion: motion,
            travel: travel,
            duration: travelDuration(travel, speed),
            hold: hold,
            fade: fade,
            reverse: reverse,
            negative: negative,
            kf: keyframeName(dir, negative)
        };

        if (motion === MOTION_LOOP) {
            buildLoopCopies(st, root, dir, spacer);
            if (st.clone && dir === DIR_H) {
                st.clone.style.width = (hasPercentTables(root) ? frame.w : content.w) + 'px';
                st.clone.style.maxWidth = hasPercentTables(root) ? (frame.w + 'px') : 'none';
                st.clone.style.flex = 'none';
                st.clone.style.flexShrink = '0';
            }
            startLoopOrBounce(widget, spec);
            return;
        }

        removeCloneAndGap(st);
        if (motion === MOTION_BOUNCE) {
            startLoopOrBounce(widget, spec);
            return;
        }
        startResetTravel(widget, spec);
    }

    function isHidden(widget) {
        var wrap = widget && widget.elements && widget.elements.wrapper;
        return !wrap || wrap.style.display === 'none';
    }

    function sync(widget, c) {
        if (!widget) return;
        if (isHidden(widget)) {
            teardown(widget);
            return;
        }
        c = c || widget.config;
        var dir = c ? normalizeDir(c.textScroll) : DIR_NONE;
        if (!isActiveDir(dir) || !c) {
            teardown(widget);
            return;
        }
        ensureStyles();
        var host = widget.mdScrollHost;
        var root = widget.mdRoot;
        if (!host || !root) {
            teardown(widget);
            return;
        }
        if (isSwapActive(root)) {
            var stPause = widget._textScroll;
            if (stPause && stPause.track) stPause.track.classList.add(PAUSED_CLASS);
            return;
        }
        applyMotion(widget, c, dir, normalizeMotion(c.textScrollMotion));
        if (widget._textScroll && widget._textScroll.track) {
            if (widget._textScroll.paused) {
                widget._textScroll.track.classList.add(PAUSED_CLASS);
            } else {
                widget._textScroll.track.classList.remove(PAUSED_CLASS);
            }
        }
    }

    function scheduleSync(widget) {
        if (!widget) return;
        if (isHidden(widget)) {
            teardown(widget);
            return;
        }
        if (widget._textScrollRaf) return;
        if (typeof requestAnimationFrame !== 'function') {
            sync(widget, widget.config);
            return;
        }
        widget._textScrollRaf = requestAnimationFrame(function () {
            widget._textScrollRaf = 0;
            sync(widget, widget.config);
        });
    }

    function pause(widget) {
        if (!widget) return;
        var st = widget._textScroll;
        if (!st) return;
        st.paused = true;
        if (st.track) st.track.classList.add(PAUSED_CLASS);
    }

    function resume(widget) {
        if (!widget) return;
        var st = widget._textScroll;
        if (!st) return;
        st.paused = false;
        if (st.track) st.track.classList.remove(PAUSED_CLASS);
    }

    function normalizeConfig(c) {
        if (!c) return c;
        c.textScroll = normalizeDir(c.textScroll);
        c.textScrollMotion = normalizeMotion(c.textScrollMotion);
        c.textScrollSpeed = clampNum(c.textScrollSpeed, SPEED_DEFAULT, SPEED_MIN, SPEED_MAX);
        c.textScrollReverse = c.textScrollReverse === true;
        c.textScrollOverflowOnly = c.textScrollOverflowOnly !== false;
        c.textScrollGap = clampNum(c.textScrollGap, GAP_DEFAULT, 0, 2000);
        c.textScrollHold = clampNum(c.textScrollHold, HOLD_DEFAULT, 0, 60);
        c.textScrollFade = clampNum(c.textScrollFade, FADE_DEFAULT, 0, 5);
        return c;
    }

    function isActive(c) {
        return !!(c && isActiveDir(normalizeDir(c.textScroll)));
    }

    global.TextScroll = {
        DIR_NONE: DIR_NONE,
        DIR_HORIZONTAL: DIR_H,
        DIR_VERTICAL: DIR_V,
        MOTION_LOOP: MOTION_LOOP,
        MOTION_BOUNCE: MOTION_BOUNCE,
        MOTION_RESET: MOTION_RESET,
        SPEED_DEFAULT: SPEED_DEFAULT,
        SPEED_MIN: SPEED_MIN,
        SPEED_MAX: SPEED_MAX,
        GAP_DEFAULT: GAP_DEFAULT,
        HOLD_DEFAULT: HOLD_DEFAULT,
        FADE_DEFAULT: FADE_DEFAULT,
        isActive: isActive,
        normalizeDir: normalizeDir,
        normalizeMotion: normalizeMotion,
        normalizeConfig: normalizeConfig,
        sync: sync,
        scheduleSync: scheduleSync,
        teardown: teardown,
        pause: pause,
        resume: resume
    };
})(typeof window !== 'undefined' ? window : this);
