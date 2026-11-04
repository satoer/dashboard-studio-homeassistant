class ArrowWidget extends BaseWidget {
    static get metadata() {
        return { shortName: "Arrow", label: "Arrow / Line", icon: "ph-arrow-right", category: "Graphics", color_dark: "hsl(20, 80%, 65%)", color_light: "hsl(20, 85%, 35%)", version: "2.3.1", date: "2026-11-02" };
    }

    static get globalSettings() {
        return {
            arrowColMain: "@accentSecondary",
            arrowColFlow: "@success",
            arrowColFlowRev: "@danger",
            arrowColGlow: BaseWidget.themeTokenRef('accentSoft'),

            arrowThick: 10,
            arrowHeadSz: 30,
            arrowLineRadius: 5,
            arrowHeadRound: 4,
            arrowBendRadius: 15,
            arrowCustomPoints: [],

            arrowAnimEnabled: true,
            arrowAnimSpeed: 2,
            arrowAnimReverse: false,

            arrowFlowWidth: 0,
            arrowGradientWidth: 100,

            arrowGlowWidth: 15,
            arrowGlowOpacity: 50
        };
    }

    static get basicSettingKeys() {
        return ['mainColor', 'flowColor'];
    }

    static get globalSchema() {
        return [
            { key: 'arrowColMain', type: 'color', label: 'Main Color', cols: 3 },
            { key: 'arrowColFlow', type: 'color', label: 'Flow Color', cols: 3 },
            { key: 'arrowColFlowRev', type: 'color', label: 'Reverse Flow Color', cols: 3 },
            { key: 'arrowColGlow', type: 'color', label: 'Glow Color', cols: 3 },

            { key: 'arrowFlowWidth', type: 'number', label: 'Flow Width (px)', cols: 6 },
            { key: 'arrowGradientWidth', type: 'number', min: 0, max: 100, label: 'Gradient Width (%)', cols: 6 },

            { key: 'arrowThick', type: 'number', label: 'Thickness', cols: 6 },
            { key: 'arrowHeadSz', type: 'number', label: 'Head Size', cols: 6 },

            { key: 'arrowLineRadius', type: 'number', label: 'Line Radius', cols: 6 },
            { key: 'arrowHeadRound', type: 'number', label: 'Head Round', cols: 6 },

            { key: 'arrowAnimEnabled', type: 'checkbox', label: 'Enable Animation', cols: 6 },
            { key: 'arrowAnimSpeed', type: 'number', label: 'Animation Speed (s)', cols: 6 },
            { key: 'arrowAnimReverse', type: 'checkbox', label: 'Reverse Flow Direction', cols: 6 },

            { key: 'arrowGlowWidth', type: 'number', label: 'Glow Width', cols: 6 },
            { key: 'arrowGlowOpacity', type: 'number', min: 0, max: 100, label: 'Glow Opacity', cols: 6 }
        ];
    }

    /**
     * WebKit (iOS / iPadOS / Safari) does not reliably repaint SVG masks animated via CSS
     * or linearGradients animated via SMIL gradientTransform. Those browsers keep a frame
     * ticker. Firefox and Chrome must not: the ticker was invalidating Software WebRender
     * on every frame.
     */
    static maskNeedsJsTick() {
        if (ArrowWidget._maskNeedsJsTick !== null && ArrowWidget._maskNeedsJsTick !== undefined) {
            return ArrowWidget._maskNeedsJsTick;
        }
        const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
        const platform = (typeof navigator !== 'undefined' && navigator.platform) ? navigator.platform : '';
        const maxTouch = (typeof navigator !== 'undefined' && navigator.maxTouchPoints) ? navigator.maxTouchPoints : 0;
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouch > 1);
        const isFirefox = ua.indexOf('Firefox') !== -1 || ua.indexOf('FxiOS') !== -1;
        const isChrome = ua.indexOf('Chrome') !== -1 || ua.indexOf('Chromium') !== -1 || ua.indexOf('CriOS') !== -1 || ua.indexOf('Edg') !== -1;
        const isSafari = ua.indexOf('Safari') !== -1 && !isFirefox && !isChrome;
        ArrowWidget._maskNeedsJsTick = isIOS || isSafari;
        return ArrowWidget._maskNeedsJsTick;
    }

    constructor(cid, id, ov, bn) {
        super(cid, id, ov, bn);
        // Do not reset lineLen/tileLen here, as super() already calls render() which sets them.
        this.animOffset = this.animOffset || 0;
        this.lastTick = this.lastTick || Date.now();
    }

    onRemove() {
        this._unregisterArrowTicker();
        this._stopArrowMotion();
        this._cancelArrowLayoutMeasure();
    }

    pauseForBackground() {
        this._arrowPaused = true;
        this._unregisterArrowTicker();
        this._setArrowMotionPaused(true);
    }

    resumeFromBackground() {
        const wrap = this.elements && this.elements.wrapper;
        if (!wrap || wrap.style.display === 'none') return;
        if (typeof Dashboard !== 'undefined' && Dashboard._pageHidden) return;
        const motion = this._arrowMotion;
        if (!motion || !motion.active) return;
        this._arrowPaused = false;
        const needsTick = ArrowWidget.maskNeedsJsTick();
        if (!needsTick) {
            if (motion.fast) {
                let started = false;
                const anim = this.e && this.e.gradAnim;
                try {
                    if (anim && typeof anim.getStartTime === 'function') {
                        anim.getStartTime();
                        started = true;
                    }
                } catch (err) { started = false; }
                if (!started) this._startGradientMotion(motion);
            } else {
                const scale = Math.round(this._arrowCssUnitScale() * 1000) / 1000;
                if (scale !== motion.scale) {
                    motion.scale = scale;
                    this._startMaskCssMotion(motion);
                }
            }
        }
        this._setArrowMotionPaused(false);
        if (needsTick) this._registerArrowTicker();
    }

    _registerArrowTicker() {
        if (this._arrowTickerOn) return;
        if (typeof Dashboard === 'undefined' || typeof Dashboard.registerTicker !== 'function') return;
        this._arrowTickerOn = true;
        this.lastTick = Date.now();
        Dashboard.registerTicker(this.id, () => this.onTick());
    }

    _unregisterArrowTicker() {
        this._arrowTickerOn = false;
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.unregisterTicker === 'function') {
            Dashboard.unregisterTicker(this.id);
        }
    }

    _setArrowMotionPaused(paused) {
        const svg = this.e && this.e.svg;
        if (svg) {
            if (paused && typeof svg.pauseAnimations === 'function') svg.pauseAnimations();
            else if (!paused && typeof svg.unpauseAnimations === 'function') svg.unpauseAnimations();
        }
        const path = this.e && this.e.maskPath;
        if (path && path.style.animationName && path.style.animationName !== 'none') {
            path.style.animationPlayState = paused ? 'paused' : 'running';
        }
    }

    /**
     * Drop the SMIL node instead of calling endElement().
     * Gecko keeps every beginElement/endElement on a long-lived animateTransform,
     * and a hidden arrow used to stop on every power sample.
     * Already stopped is a no-op so those samples do not touch SMIL again.
     */
    _stopGradientMotion() {
        if (this._gradientMotionStopped) return;
        this._gradientMotionStopped = true;
        const anim = this.e && this.e.gradAnim;
        if (anim && anim.parentNode) anim.parentNode.removeChild(anim);
        if (this.e) this.e.gradAnim = null;
        if (this.e && this.e.grad) this.e.grad.removeAttribute('gradientTransform');
    }

    _stopMaskCssMotion() {
        const path = this.e && this.e.maskPath;
        if (!path || !path.style) return;
        if (path.style.animationName && path.style.animationName !== 'none') {
            path.style.animationName = 'none';
            path.style.animationDuration = '';
            path.style.animationTimingFunction = '';
            path.style.animationIterationCount = '';
            path.style.animationDirection = '';
            path.style.animationPlayState = '';
        }
        if (this.e && this.e.flowLayer) this.e.flowLayer.style.transform = '';
    }

    _stopArrowMotion() {
        this._unregisterArrowTicker();
        this._stopGradientMotion();
        this._stopMaskCssMotion();
        this._arrowMotionRunning = false;
    }

    _arrowCssUnitScale() {
        const svg = this.e && this.e.svg;
        if (!svg || !svg.viewBox || !svg.viewBox.baseVal) return 1;
        const vbW = svg.viewBox.baseVal.width;
        const cssW = svg.clientWidth || 0;
        if (!(vbW > 0) || !(cssW > 0)) return 1;
        return cssW / vbW;
    }

    /**
     * One fresh animateTransform per real start. Replacing the node drops any
     * SMIL interval list. The scroll distance, duration, and gradient stops stay
     * the same, so the flow looks the same.
     */
    _startGradientMotion(motion) {
        const grad = this.e && this.e.grad;
        if (!grad || !motion) return;
        const old = this.e.gradAnim;
        if (old && old.parentNode) old.parentNode.removeChild(old);
        const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        anim.setAttribute('class', 'arrow-grad-anim');
        anim.setAttribute('attributeName', 'gradientTransform');
        anim.setAttribute('type', 'translate');
        anim.setAttribute('repeatCount', 'indefinite');
        anim.setAttribute('begin', 'indefinite');
        const sign = motion.reverse ? -1 : 1;
        const distX = sign * motion.dx * motion.tileLen;
        const distY = sign * motion.dy * motion.tileLen;
        anim.setAttribute('from', '0 0');
        anim.setAttribute('to', distX + ' ' + distY);
        anim.setAttribute('dur', motion.speed + 's');
        grad.appendChild(anim);
        this.e.gradAnim = anim;
        this._gradientMotionStopped = false;
        try {
            if (typeof anim.beginElement === 'function') anim.beginElement();
        } catch (err) { /* beginElement throws if the SVG is detached */ }
    }

    _startMaskCssMotion(motion) {
        const path = this.e && this.e.maskPath;
        if (!path || !path.style || !motion) return;
        const scale = motion.scale > 0 ? motion.scale : 1;
        const span = -motion.tileLen * scale;
        path.style.setProperty('--arrow-flow-span', span + 'px');
        path.style.animationName = 'ds-arrow-flow';
        path.style.animationDuration = motion.speed + 's';
        path.style.animationTimingFunction = 'linear';
        path.style.animationIterationCount = 'infinite';
        path.style.animationDirection = motion.reverse ? 'reverse' : 'normal';
        path.style.animationPlayState = 'running';
        path.removeAttribute('stroke-dashoffset');
    }

    /**
     * Start flow once from the render that already resolved config.
     * On Firefox and Chrome, straight arrows scroll the gradient with SMIL and bent
     * arrows use a CSS dash. WebKit / iOS keeps the ticker for both modes.
     */
    _syncArrowMotion(c) {
        const wrap = this.elements && this.elements.wrapper;
        const hidden = !wrap || wrap.style.display === 'none';
        const pageHidden = typeof Dashboard !== 'undefined' && Dashboard._pageHidden;
        const tileLen = this.tileLen || this.lineLen || 0;
        const want = c && c.animEnable && c.visible !== false && c.opacity !== 0
            && !c.deactivated && tileLen > 0 && c.animSpeed > 0;
        if (!want) {
            this._arrowMotion = { active: false };
            this._arrowMotionSig = '';
            this._stopArrowMotion();
            return;
        }
        // Hidden warmup stays display:none. Do not measure it (that lays the page out).
        // Arm the animation paused so a later unhide can resume without get config.
        const fast = !!this.isFastMode;
        const hold = hidden || pageHidden;
        const needsTick = ArrowWidget.maskNeedsJsTick();
        const scaleKey = (fast || hold || needsTick) ? 1 : Math.round(this._arrowCssUnitScale() * 1000) / 1000;
        const sig = (fast ? 'f' : 'b') + '|' + tileLen + '|' + c.animSpeed + '|' + (c.animReverse ? '1' : '0')
            + '|' + (this._fastDx || 0) + '|' + (this._fastDy || 0) + '|' + scaleKey
            + '|' + (needsTick ? '1' : '0');
        const motion = {
            active: true,
            fast: fast,
            speed: c.animSpeed,
            reverse: !!c.animReverse,
            tileLen: tileLen,
            dx: this._fastDx || 0,
            dy: this._fastDy || 0,
            scale: scaleKey
        };
        this._arrowMotion = motion;
        const same = this._arrowMotionSig === sig && this._arrowMotionRunning;
        if (!same) {
            this._arrowMotionSig = sig;
            this._arrowMotionRunning = true;
            if (needsTick) {
                this._stopGradientMotion();
                this._stopMaskCssMotion();
            } else if (fast) {
                this._stopMaskCssMotion();
                this._unregisterArrowTicker();
                this._startGradientMotion(motion);
            } else {
                this._stopGradientMotion();
                this._unregisterArrowTicker();
                this._startMaskCssMotion(motion);
            }
        }
        if (hold) {
            this._arrowPaused = true;
            this._unregisterArrowTicker();
            this._setArrowMotionPaused(true);
            return;
        }
        this._arrowPaused = false;
        this._setArrowMotionPaused(false);
        if (needsTick) this._registerArrowTicker();
        if (!fast || (typeof Dashboard !== 'undefined' && Dashboard.isEditMode && this.e && this.e.handlesNode && this.e.handlesNode.children.length > 0)) {
            this._scheduleArrowLayoutMeasure();
        }
    }

    _cancelArrowLayoutMeasure() {
        if (this._arrowLayoutRaf && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._arrowLayoutRaf);
        }
        this._arrowLayoutRaf = 0;
    }

    /**
     * The dash length and edit handles are sized from the laid-out cell.
     * Render can run before that cell exists. One frame later, correct them
     * from the cached motion. Do not read config, and do not measure while hidden.
     */
    _scheduleArrowLayoutMeasure() {
        if (this._arrowLayoutRaf) return;
        const self = this;
        const run = function () {
            self._arrowLayoutRaf = 0;
            self._syncArrowLayoutAfterPaint();
        };
        if (typeof requestAnimationFrame === 'function') {
            this._arrowLayoutRaf = requestAnimationFrame(run);
        } else {
            run();
        }
    }

    _syncArrowLayoutAfterPaint() {
        const wrap = this.elements && this.elements.wrapper;
        if (!wrap || wrap.style.display === 'none') return;
        if (typeof Dashboard !== 'undefined' && Dashboard._pageHidden) return;
        const motion = this._arrowMotion;
        if (motion && motion.active && !motion.fast && !ArrowWidget.maskNeedsJsTick()) {
            const scale = Math.round(this._arrowCssUnitScale() * 1000) / 1000;
            if (scale > 0 && scale !== motion.scale) {
                motion.scale = scale;
                this._startMaskCssMotion(motion);
                if (this._arrowMotionSig) {
                    const parts = this._arrowMotionSig.split('|');
                    if (parts.length >= 2) {
                        parts[parts.length - 2] = String(scale);
                        this._arrowMotionSig = parts.join('|');
                    }
                }
            }
        }
        this._syncArrowHandleRadius();
    }

    _syncArrowHandleRadius() {
        if (typeof Dashboard === 'undefined' || !Dashboard.isEditMode) return;
        const e = this.e;
        if (!e || !e.handlesNode || !e.handlesNode.children.length || !e.svg || !e.svg.viewBox || !e.svg.viewBox.baseVal) return;
        const vb = e.svg.viewBox.baseVal;
        if (!(vb.width > 0) || !(vb.height > 0)) return;
        const wrap = this.elements && this.elements.wrapper;
        if (!wrap) return;
        const wrapW = wrap.clientWidth || 0;
        const wrapH = wrap.clientHeight || 0;
        if (!(wrapW > 0) || !(wrapH > 0)) return;
        const fit = Math.min(wrapW / vb.width, wrapH / vb.height);
        const handleR = fit > 0 ? (7 / fit) : 7;
        if (this._arrowHandleR != null && Math.abs(this._arrowHandleR - handleR) < 0.05) return;
        this._arrowHandleR = handleR;
        const kids = e.handlesNode.children;
        const r = String(handleR);
        for (let i = 0; i < kids.length; i++) kids[i].setAttribute('r', r);
    }

    onTick() {
        const now = Date.now();
        const delta = now - this.lastTick;
        this.lastTick = now;
        if (delta > 1000) return;
        if (!this.elements || !this.elements.wrapper || this.elements.wrapper.style.display === 'none') return;
        const motion = this._arrowMotion;
        if (!motion || !motion.active) return;
        const tileLen = motion.tileLen;
        if (!tileLen || motion.speed <= 0) return;

        const pixelsPerSecond = tileLen / motion.speed;
        const direction = motion.reverse ? -1 : 1;
        this.animOffset += direction * pixelsPerSecond * (delta / 1000);
        this.animOffset = ((this.animOffset % tileLen) + tileLen) % tileLen;

        if (motion.fast) {
            if (this.e && this.e.grad) {
                const ox = (motion.dx || 0) * this.animOffset;
                const oy = (motion.dy || 0) * this.animOffset;
                this.e.grad.setAttribute('gradientTransform', 'translate(' + ox + ' ' + oy + ')');
            }
        } else if (this.e && this.e.maskPath) {
            this.e.maskPath.setAttribute('stroke-dashoffset', -this.animOffset);
            // iOS Safari WebKit: animating inside a mask does not repaint the masked layer.
            if (this.e.flowLayer) {
                this._safariToggle = !this._safariToggle;
                this.e.flowLayer.style.transform = this._safariToggle ? 'translateZ(0.0001px)' : 'translateZ(0)';
            }
        }
    }

    getDefaultOverrides() {
        return {
            fromX: 100,
            fromY: 100,
            toX: 300,
            toY: 100
        };
    }

    /**
     * Instance value, else the arrow master default.
     * Shared master keys (container glowColor / glowOpacity) sit on every merged
     * config, so a bare `c.glowColor || arrowColGlow` never reaches the arrow default.
     * A live binding still wins, because super.config has already resolved it onto `c`.
     */
    _arrowOwn(c, instanceKeys, masterKey) {
        const o = this.overrides || {};
        const b = this.bindings || {};
        for (let i = 0; i < instanceKeys.length; i++) {
            const key = instanceKeys[i];
            if (typeof b[key] === 'string' && b[key] !== ''
                    && c[key] !== undefined && c[key] !== null && c[key] !== '') {
                return c[key];
            }
            if (Object.prototype.hasOwnProperty.call(o, key) && o[key] !== undefined && o[key] !== null && o[key] !== '') {
                return o[key];
            }
        }
        if (typeof MASTER_SETTINGS !== 'undefined'
                && MASTER_SETTINGS[masterKey] !== undefined
                && MASTER_SETTINGS[masterKey] !== null
                && MASTER_SETTINGS[masterKey] !== '') {
            return MASTER_SETTINGS[masterKey];
        }
        return '';
    }

    /** Corner points as stored. The config cache does not refresh arrays during a drag. */
    _storedCornerPoints() {
        const o = this.overrides;
        if (o && Array.isArray(o.customPoints)) return o.customPoints;
        return [];
    }

    _arrowPad(c) {
        const glow = (c && c.glowEnable) ? c.glowWidth : 0;
        return Math.max(c.thickness, c.headSize, glow * 2) + 20;
    }

    /**
     * fixed: absolute canvas box (Fixed Resolution, Scale, open group).
     * responsive: CSS grid cell. composite: closed group owns the wrapper rect.
     */
    _arrowPlacementMode() {
        if (typeof BaseWidget === 'undefined' || !BaseWidget.isResponsiveMode()) return 'fixed';
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.getWidgetCompositeContext === 'function') {
            const ctx = Dashboard.getWidgetCompositeContext(this.id);
            if (ctx) return ctx.open ? 'fixed' : 'composite';
        }
        if (BaseWidget.usesResponsiveGridLayout(this.id)) return 'responsive';
        return 'fixed';
    }

    _shiftStoredGeometry(dx, dy) {
        if (!dx && !dy) return;
        const o = this.overrides;
        if (!o) return;
        if (!Number.isFinite(Number(o.fromX))) o.fromX = 100;
        if (!Number.isFinite(Number(o.fromY))) o.fromY = 100;
        if (!Number.isFinite(Number(o.toX))) o.toX = 300;
        if (!Number.isFinite(Number(o.toY))) o.toY = 100;
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._offsetArrowOverrides === 'function') {
            Dashboard._offsetArrowOverrides(o, dx, dy);
        }
        if (!Array.isArray(o.customPoints)) return;
        const next = [];
        for (let i = 0; i < o.customPoints.length; i++) {
            const pt = o.customPoints[i];
            next.push({
                x: BaseWidget.toFiniteNumber(pt && pt.x, 0),
                y: BaseWidget.toFiniteNumber(pt && pt.y, 0)
            });
        }
        o.customPoints = next;
    }

    /**
     * Map a pointer into stored canvas coordinates.
     * The SVG viewBox is the path box, so the element rect (including editor zoom
     * and a responsive cell that is not the design size) converts without a
     * separate canvas scale.
     */
    _clientToArrowCanvas(clientX, clientY) {
        const frame = this._arrowFrame;
        const svg = this.e && this.e.svg;
        if (!frame || !svg || !(frame.width > 0) || !(frame.height > 0)) {
            return { x: clientX, y: clientY };
        }
        const rect = svg.getBoundingClientRect();
        const rw = rect.width || 1;
        const rh = rect.height || 1;
        const fit = Math.min(rw / frame.width, rh / frame.height);
        const scale = fit > 0 ? fit : 1;
        const contentW = frame.width * scale;
        const contentH = frame.height * scale;
        const offX = (rw - contentW) / 2;
        const offY = (rh - contentH) / 2;
        return {
            x: frame.originX + ((clientX - rect.left) - offX) / scale,
            y: frame.originY + ((clientY - rect.top) - offY) / scale
        };
    }

    _snapArrowPoint(x, y) {
        const grid = (MASTER_SETTINGS && MASTER_SETTINGS.snapToGrid && MASTER_SETTINGS.gridSize)
            ? MASTER_SETTINGS.gridSize : 1;
        const g = grid > 0 ? grid : 1;
        return {
            x: Math.round(x / g) * g,
            y: Math.round(y / g) * g
        };
    }

    get config() {
        const c = super.config;
        const fromX = BaseWidget.toFiniteNumber(c.fromX, 100);
        const fromY = BaseWidget.toFiniteNumber(c.fromY, 100);
        const toX = BaseWidget.toFiniteNumber(c.toX, 300);
        const toY = BaseWidget.toFiniteNumber(c.toY, 100);
        const thickness = BaseWidget.clampNumber(c.thickness !== undefined && c.thickness !== null ? c.thickness : c.arrowThick, 1, null);
        const headSize = BaseWidget.clampNumber(c.headSize !== undefined && c.headSize !== null ? c.headSize : c.arrowHeadSz, 0, null);
        const lineRadius = BaseWidget.clampNumber(c.lineRadius !== undefined && c.lineRadius !== null ? c.lineRadius : c.arrowLineRadius, 0, null);
        const pathBendRadius = BaseWidget.clampNumber(c.pathBendRadius !== undefined && c.pathBendRadius !== null ? c.pathBendRadius : c.arrowBendRadius, 0, null);
        const headRound = BaseWidget.clampNumber(c.headRound !== undefined && c.headRound !== null ? c.headRound : c.arrowHeadRound, 0, null);
        const animSpeed = BaseWidget.clampNumber(c.animSpeed !== undefined && c.animSpeed !== null ? c.animSpeed : c.arrowAnimSpeed, 0.1, null);
        const flowWidth = BaseWidget.clampNumber(c.flowWidth !== undefined && c.flowWidth !== null ? c.flowWidth : c.arrowFlowWidth, 0, null);
        const gradientWidth = BaseWidget.clampNumber(c.gradientWidth !== undefined && c.gradientWidth !== null ? c.gradientWidth : c.arrowGradientWidth, 0, 100);
        const glowWidthOwn = this._arrowOwn(c, ['glowWidth'], 'arrowGlowWidth');
        const glowWidth = BaseWidget.clampNumber(glowWidthOwn === '' ? c.arrowGlowWidth : glowWidthOwn, 0, null);
        const glowOpacity = BaseWidget.clampNumber(this._arrowOwn(c, ['glowOpacity'], 'arrowGlowOpacity'), 0, 100);
        const mainColor = this._arrowOwn(c, ['mainColor', 'colMain'], 'arrowColMain') || '@accentSecondary';
        const flowColor = this._arrowOwn(c, ['flowColor', 'colFlow'], 'arrowColFlow') || '@success';
        const reverseFlowColor = this._arrowOwn(c, ['reverseFlowColor', 'colFlowRev'], 'arrowColFlowRev') || '@danger';
        const glowColor = this._arrowOwn(c, ['glowColor', 'colGlow'], 'arrowColGlow') || BaseWidget.themeTokenRef('accentSoft');
        const cornerSource = (this.overrides && Array.isArray(this.overrides.customPoints))
            ? this.overrides.customPoints
            : (Array.isArray(c.arrowCustomPoints) ? c.arrowCustomPoints : []);
        return {
            ...c,
            bgVisible: false,
            padding: 0,
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY,

            mainColor: mainColor,
            flowColor: flowColor,
            reverseFlowColor: reverseFlowColor,
            glowColor: glowColor,
            colMain: mainColor,
            colFlow: flowColor,
            colFlowRev: reverseFlowColor,
            colGlow: glowColor,

            thickness: thickness,
            headSize: headSize,

            lineRadius: lineRadius,
            pathBendRadius: pathBendRadius,
            headRound: headRound,

            animEnable: c.animEnable !== undefined && c.animEnable !== null ? c.animEnable
                : (c.animationEnabled !== undefined && c.animationEnabled !== null ? c.animationEnabled : c.arrowAnimEnabled),
            animSpeed: animSpeed,
            animReverse: c.animReverse !== undefined && c.animReverse !== null ? c.animReverse
                : (c.animationReverse !== undefined && c.animationReverse !== null ? c.animationReverse : c.arrowAnimReverse),

            flowWidth: flowWidth,
            gradientWidth: gradientWidth,

            glowEnable: c.glowEnable !== undefined && c.glowEnable !== null ? c.glowEnable : c.glowEnabled,
            glowWidth: glowWidth,
            glowOpacity: glowOpacity,

            customPoints: cornerSource.map((pt, i) => {
                const bX = this.bindings[`customPoints_${i}_X`];
                const bY = this.bindings[`customPoints_${i}_Y`];
                let lx = BaseWidget.toFiniteNumber(pt && pt.x, fromX), ly = BaseWidget.toFiniteNumber(pt && pt.y, fromY);
                if (bX && typeof Dashboard !== 'undefined' && Dashboard.liveData && Dashboard.liveData[bX] !== undefined) {
                    const parsed = parseFloat(Dashboard.liveData[bX]);
                    if (!isNaN(parsed)) lx = parsed;
                }
                if (bY && typeof Dashboard !== 'undefined' && Dashboard.liveData && Dashboard.liveData[bY] !== undefined) {
                    const parsed = parseFloat(Dashboard.liveData[bY]);
                    if (!isNaN(parsed)) ly = parsed;
                }
                return { x: lx, y: ly };
            })
        };
    }

    getSchema() {
        return [
            {
                id: 'arr_shape', title: 'Shape', icon: 'ph-bezier-curve',
                fields: [
                    { key: 'fromX', type: 'number', label: 'Start X', cols: 3 },
                    { key: 'fromY', type: 'number', label: 'Start Y', cols: 3 },
                    { key: 'toX', type: 'number', label: 'End X', cols: 3 },
                    { key: 'toY', type: 'number', label: 'End Y', cols: 3 },
                    { key: 'customPoints', type: 'point_list', label: 'Corner Points (Warning: Impacts animation performance)', cols: 12 },
                    { key: 'thickness', type: 'number', label: 'Thickness', cols: 6, defaultKey: 'arrowThick' },
                    { key: 'headSize', type: 'number', label: 'Head Size', cols: 6, defaultKey: 'arrowHeadSz' },
                    { key: 'lineRadius', type: 'number', label: 'End Cap Radius', cols: 4, defaultKey: 'arrowLineRadius', min: 0 },
                    { key: 'headRound', type: 'number', label: 'Head Round', cols: 4, defaultKey: 'arrowHeadRound' },
                    { key: 'pathBendRadius', type: 'number', label: 'Corner Radius', cols: 4, defaultKey: 'arrowBendRadius' }
                ]
            },
            {
                id: 'arr_style', title: 'Appearance', icon: 'ph-palette',
                fields: [
                    { key: 'mainColor', type: 'color', label: 'Main Color', cols: 3, defaultKey: 'arrowColMain' },
                    { key: 'flowColor', type: 'color', label: 'Flow Color', cols: 3, defaultKey: 'arrowColFlow' },
                    { key: 'reverseFlowColor', type: 'color', label: 'Reverse Flow Color', cols: 3, defaultKey: 'arrowColFlowRev' },
                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 3, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'flowWidth', type: 'number', label: 'Flow Width (px)', cols: 6, defaultKey: 'arrowFlowWidth' },
                    { key: 'gradientWidth', type: 'number', min: 0, max: 100, label: 'Gradient Width (%)', cols: 6, defaultKey: 'arrowGradientWidth' }
                ]
            },
            {
                id: 'arr_fx', title: 'Animations & Effects', icon: 'ph-sparkle',
                fields: [
                    { key: 'enableGlow', type: 'checkbox', label: 'Glow', cols: 3 },
                    { key: 'glowColor', type: 'color', label: 'Glow Color', cols: 3, defaultKey: 'arrowColGlow' },
                    { key: 'glowWidth', type: 'number', label: 'Glow Width', cols: 3, defaultKey: 'arrowGlowWidth' },
                    { key: 'glowOpacity', type: 'number', min: 0, max: 100, label: 'Glow Opacity', cols: 3, defaultKey: 'arrowGlowOpacity' },
                    { key: 'animationEnabled', type: 'checkbox', label: 'Enable Animation', cols: 4, defaultKey: 'arrowAnimEnabled' },
                    { key: 'animationSpeed', type: 'number', label: 'Animation Speed (s)', cols: 4, step: 0.1, min: 0.1, defaultKey: 'arrowAnimSpeed' },
                    { key: 'animationReverse', type: 'checkbox', label: 'Reverse Flow Direction', cols: 4, defaultKey: 'arrowAnimReverse' }
                ]
            }
        ];
    }

    _buildBaseDOM() {
        const b = super._buildBaseDOM();

        b.innerContent.style.overflow = 'visible';

        const gradAnimMarkup = ArrowWidget.maskNeedsJsTick()
            ? ''
            : '<animateTransform class="arrow-grad-anim" attributeName="gradientTransform" type="translate" from="0 0" to="0 0" dur="2s" repeatCount="indefinite" begin="indefinite"/>';

        b.innerContent.innerHTML = `
            <svg style="position: absolute; overflow: visible; width: 100%; height: 100%; top: 0; left: 0;">
                <defs>
                    <filter id="glow-${this.id}" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <linearGradient id="grad-${this.id}" gradientUnits="userSpaceOnUse" spreadMethod="repeat">
                        <stop offset="0" stop-color="currentColor" stop-opacity="1"/>
                        <stop offset="0.25" stop-color="white" stop-opacity="1"/>
                        <stop offset="0.75" stop-color="white" stop-opacity="1"/>
                        <stop offset="1" stop-color="currentColor" stop-opacity="1"/>
                        ${gradAnimMarkup}
                    </linearGradient>
                    <!-- Used for the animated bendy flow -->
                    <filter id="blur-${this.id}" x="-50%" y="-50%" width="200%" height="200%" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feGaussianBlur stdDeviation="15" />
                    </filter>
                    <mask id="flow-mask-${this.id}" x="-50%" y="-50%" width="200%" height="200%" maskUnits="userSpaceOnUse">
                        <!-- Mask base is black (hide everything) -->
                        <rect x="-50%" y="-50%" width="200%" height="200%" fill="black" />
                        <!-- Flow dash animated over time -->
                        <!-- Using butt linecap prevents the thick mask dashes from artificially ballooning length -->
                        <path class="arrow-mask-path" stroke="white" stroke-linecap="butt" stroke-linejoin="round" fill="none" />
                    </mask>
                </defs>
                <g class="arrow-group">
                    <g class="arrow-static">
                        <path class="arrow-start-cap" />
                        <path class="arrow-end-cap" />
                        <path class="arrow-body" stroke-linejoin="round" stroke-linecap="butt" fill="none" />
                        <polygon class="arrow-head" stroke-linejoin="round" />
                    </g>

                    <g mask="url(#flow-mask-${this.id})" class="arrow-flow-layer">
                        <path class="arrow-start-cap-flow" />
                        <path class="arrow-end-cap-flow" />
                        <path class="arrow-body-flow" stroke-linejoin="round" stroke-linecap="butt" fill="none" />
                        <polygon class="arrow-head-flow" stroke-linejoin="round" />
                    </g>
                </g>
            </svg>
        `;

        this.e = {
            svg: b.innerContent.querySelector('svg'),
            group: b.innerContent.querySelector('.arrow-group'),
            staticGroup: b.innerContent.querySelector('.arrow-static'),
            gradAnim: b.innerContent.querySelector('.arrow-grad-anim'),
            startCap: b.innerContent.querySelector('.arrow-start-cap'),
            endCap: b.innerContent.querySelector('.arrow-end-cap'),
            body: b.innerContent.querySelector('.arrow-body'),
            head: b.innerContent.querySelector('.arrow-head'),
            flowLayer: b.innerContent.querySelector('.arrow-flow-layer'),
            startCapFlow: b.innerContent.querySelector('.arrow-start-cap-flow'),
            endCapFlow: b.innerContent.querySelector('.arrow-end-cap-flow'),
            bodyFlow: b.innerContent.querySelector('.arrow-body-flow'),
            headFlow: b.innerContent.querySelector('.arrow-head-flow'),
            maskPath: b.innerContent.querySelector('.arrow-mask-path'),
            maskBlur: b.innerContent.querySelector(`#blur-${this.id} feGaussianBlur`),
            filter: b.innerContent.querySelector(`#glow-${this.id} feGaussianBlur`),
            grad: b.innerContent.querySelector(`#grad-${this.id}`),
            stops: b.innerContent.querySelectorAll(`#grad-${this.id} stop`)
        };

        const handleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        handleGroup.setAttribute('class', 'arrow-handles');
        this.e.svg.appendChild(handleGroup);
        this.e.handlesNode = handleGroup;

        return b;
    }

    _setupHandleDrag(handle, idxOrType) {
        if (typeof PointerDrag === 'undefined') return;
        const self = this;
        PointerDrag.bind(handle, {
            raf: false,
            shouldStart: function () {
                return !!Dashboard.isEditMode;
            },
            onDown: function () {
                Dashboard.selectWidget(self.id, false, true);
                if (typeof Dashboard._beginEditPointerGesture === 'function') {
                    Dashboard._beginEditPointerGesture();
                }
                return {
                    didGeometryChange: false,
                    beforeGeometry: {
                        fromX: self.overrides.fromX,
                        fromY: self.overrides.fromY,
                        toX: self.overrides.toX,
                        toY: self.overrides.toY,
                        customPoints: JSON.parse(JSON.stringify(self.overrides.customPoints || []))
                    }
                };
            },
            onMove: function (em, ctx) {
                if (!ctx) return;
                const raw = self._clientToArrowCanvas(em.clientX, em.clientY);
                const snapped = self._snapArrowPoint(raw.x, raw.y);
                const mx = snapped.x;
                const my = snapped.y;

                if (idxOrType === 'start') {
                    if (self.overrides.fromX !== mx || self.overrides.fromY !== my) {
                        ctx.didGeometryChange = true;
                        self.update({ fromX: mx, fromY: my });
                    }
                } else if (idxOrType === 'end') {
                    if (self.overrides.toX !== mx || self.overrides.toY !== my) {
                        ctx.didGeometryChange = true;
                        self.update({ toX: mx, toY: my });
                    }
                } else {
                    const src = self._storedCornerPoints();
                    const pts = [];
                    for (let i = 0; i < src.length; i++) {
                        pts.push({
                            x: BaseWidget.toFiniteNumber(src[i] && src[i].x, 0),
                            y: BaseWidget.toFiniteNumber(src[i] && src[i].y, 0)
                        });
                    }
                    if (pts[idxOrType] && (pts[idxOrType].x !== mx || pts[idxOrType].y !== my)) {
                        ctx.didGeometryChange = true;
                        pts[idxOrType].x = mx;
                        pts[idxOrType].y = my;
                        self.update({ customPoints: pts });
                    }
                }
            },
            onUp: function (ev, ctx) {
                if (typeof Dashboard._endEditPointerGesture === 'function') {
                    Dashboard._endEditPointerGesture();
                }
                if (!ctx || !ctx.didGeometryChange) return;
                if (typeof Dashboard !== 'undefined' && Dashboard.markUnsaved) Dashboard.markUnsaved();
                if (typeof Dashboard !== 'undefined' && Dashboard._recordHistoryEntry) {
                    const afterGeometry = {
                        fromX: self.overrides.fromX,
                        fromY: self.overrides.fromY,
                        toX: self.overrides.toX,
                        toY: self.overrides.toY,
                        customPoints: JSON.parse(JSON.stringify(self.overrides.customPoints || []))
                    };
                    if (!Dashboard._isEqualJson(ctx.beforeGeometry, afterGeometry)) {
                        Dashboard._recordHistoryEntry({
                            kind: 'widget-overrides',
                            id: self.id,
                            replace: false,
                            before: ctx.beforeGeometry,
                            after: afterGeometry
                        });
                    }
                }
                if (typeof Editor !== 'undefined' && typeof Editor.notifyExternalWidgetChange === 'function') {
                    Editor.notifyExternalWidgetChange(self.id, true);
                }
            }
        });
    }

    updatePositionSize() {
        // Responsive grid and closed groups place the wrapper themselves.
        // Shifting the path from x/y there warps corners and fights the cell.
        if (this._arrowPlacementMode() === 'fixed') {
            const c = this.config;
            const pad = this._arrowPad(c);
            const o = this.overrides || {};
            let minX = Math.min(
                BaseWidget.toFiniteNumber(o.fromX, c.fromX),
                BaseWidget.toFiniteNumber(o.toX, c.toX)
            );
            let minY = Math.min(
                BaseWidget.toFiniteNumber(o.fromY, c.fromY),
                BaseWidget.toFiniteNumber(o.toY, c.toY)
            );
            const corners = this._storedCornerPoints();
            for (let i = 0; i < corners.length; i++) {
                minX = Math.min(minX, BaseWidget.toFiniteNumber(corners[i] && corners[i].x, minX));
                minY = Math.min(minY, BaseWidget.toFiniteNumber(corners[i] && corners[i].y, minY));
            }
            const dx = BaseWidget.toFiniteNumber(o.x, minX - pad) - (minX - pad);
            const dy = BaseWidget.toFiniteNumber(o.y, minY - pad) - (minY - pad);
            this._shiftStoredGeometry(dx, dy);
        }
        this._renderSpecific();
    }

    /**
     * Fit the path box. Fixed mode pins the wrapper to the canvas origin.
     * Responsive Columns and a closed group leave wrapper placement to the
     * layout pass and draw the same path through a viewBox.
     */
    _applyArrowFrame(minX, minY, w, h) {
        const mode = this._arrowPlacementMode();
        this._arrowFrame = { originX: minX, originY: minY, width: w, height: h };
        this.overrides.x = minX;
        this.overrides.y = minY;
        this.overrides.width = w;
        this.overrides.height = h;

        const svg = this.e && this.e.svg;
        if (svg) {
            const vbStr = '0 0 ' + w + ' ' + h;
            if (svg.getAttribute('viewBox') !== vbStr) svg.setAttribute('viewBox', vbStr);
            if (svg.getAttribute('preserveAspectRatio') !== 'xMidYMid meet') {
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            }
            if (svg.style.overflow !== 'visible') svg.style.overflow = 'visible';
        }

        const s = this.elements.wrapper.style;
        const cs = this.elements.container.style;
        if (mode === 'fixed') {
            if (s.position !== 'absolute') s.position = 'absolute';
            const leftPx = minX + 'px';
            const topPx = minY + 'px';
            if (s.left !== leftPx) s.left = leftPx;
            if (s.top !== topPx) s.top = topPx;
            const wPx = w + 'px';
            const hPx = h + 'px';
            if (s.width !== wPx) s.width = wPx;
            if (s.height !== hPx) s.height = hPx;
            if (cs.width !== wPx) cs.width = wPx;
            if (cs.height !== hPx) cs.height = hPx;
            this._syncCanvasBoundaryClipping(minX, minY, w, h);
        } else if (mode === 'responsive') {
            // Inline left/top beat the grid rule left/top: auto.
            if (s.left !== '') s.left = '';
            if (s.top !== '') s.top = '';
            if (s.position !== '') s.position = '';
            if (s.width !== '') s.width = '';
            if (s.height !== '') s.height = '';
            if (cs.width !== '') cs.width = '';
            if (cs.height !== '') cs.height = '';
        }
        if (svg) {
            if (svg.style.position !== 'absolute') svg.style.position = 'absolute';
            if (svg.style.width !== '100%') svg.style.width = '100%';
            if (svg.style.height !== '100%') svg.style.height = '100%';
            if (svg.style.top !== '0px' && svg.style.top !== '0') svg.style.top = '0';
            if (svg.style.left !== '0px' && svg.style.left !== '0') svg.style.left = '0';
        }
    }

    /**
     * Colors, glow, and the straight-arrow gradient, without rebuilding path geometry.
     * Headless reverse only flips the gradient direction. A head still rebuilds the path.
     */
    _applyArrowPaint(c, colMainR, flowColR) {
        const e = this.e;
        if (!e || !c) return;
        e.body.setAttribute('stroke', colMainR);
        e.startCap.setAttribute('fill', colMainR);
        e.endCap.setAttribute('fill', colMainR);
        e.head.setAttribute('fill', colMainR);
        e.head.setAttribute('stroke', colMainR);

        if (c.deactivated) {
            const deactColor = BaseWidget.getDeactivatedColor(c);
            e.body.setAttribute('stroke', deactColor);
            e.startCap.setAttribute('fill', deactColor);
            e.endCap.setAttribute('fill', deactColor);
            e.head.setAttribute('fill', deactColor);
            e.head.setAttribute('stroke', deactColor);
            if (e.flowLayer) e.flowLayer.style.display = 'none';
            if (e.glowLayer) e.glowLayer.style.display = 'none';
            if (e.group) e.group.style.filter = 'none';
            if (e.staticGroup) e.staticGroup.style.filter = 'none';
            this._arrowMotion = { active: false };
            this._arrowMotionSig = '';
            this._stopArrowMotion();
            return;
        }

        e.bodyFlow.setAttribute('stroke', flowColR);
        e.startCapFlow.setAttribute('fill', flowColR);
        e.endCapFlow.setAttribute('fill', flowColR);
        e.headFlow.setAttribute('fill', flowColR);
        e.headFlow.setAttribute('stroke', flowColR);

        if (c.animEnable && this.isFastMode) {
            e.flowLayer.style.display = 'block';
            e.flowLayer.removeAttribute('mask');
            if (e.maskPath) {
                e.maskPath.style.display = 'none';
                e.maskPath.removeAttribute('filter');
            }
            const gradRef = `url(#grad-${this.id})`;
            e.bodyFlow.setAttribute('stroke', gradRef);
            e.startCapFlow.setAttribute('fill', gradRef);
            e.endCapFlow.setAttribute('fill', gradRef);
            e.headFlow.setAttribute('fill', gradRef);
            e.headFlow.setAttribute('stroke', gradRef);
            const gw = Math.min(1, Math.max(0, (__nullish(c.gradientWidth, 100)) / 100));
            const b = gw * 0.25;
            if (e.stops && e.stops.length >= 4) {
                e.stops[0].setAttribute('stop-color', colMainR);
                e.stops[0].setAttribute('offset', `${0.25 - b}`);
                e.stops[1].setAttribute('stop-color', flowColR);
                e.stops[1].setAttribute('offset', `${0.25 + b}`);
                e.stops[2].setAttribute('stop-color', flowColR);
                e.stops[2].setAttribute('offset', `${0.75 - b}`);
                e.stops[3].setAttribute('stop-color', colMainR);
                e.stops[3].setAttribute('offset', `${0.75 + b}`);
            }
            const fullLen = this._arrowFullLen || 0;
            this.tileLen = c.flowWidth > 0 ? c.flowWidth : fullLen;
            const localPts = this._lastLocalPts;
            if (e.grad && localPts && localPts.length >= 2 && this.tileLen > 0) {
                e.grad.setAttribute('x1', localPts[0].x);
                e.grad.setAttribute('y1', localPts[0].y);
                const gwAngle = Math.atan2(localPts[1].y - localPts[0].y, localPts[1].x - localPts[0].x);
                this._fastDx = Math.cos(gwAngle);
                this._fastDy = Math.sin(gwAngle);
                e.grad.setAttribute('x2', localPts[0].x + this._fastDx * this.tileLen);
                e.grad.setAttribute('y2', localPts[0].y + this._fastDy * this.tileLen);
            }
        } else if (c.animEnable && e.flowLayer) {
            e.flowLayer.style.display = 'block';
        } else if (e.flowLayer) {
            e.flowLayer.style.display = 'none';
        }

        if (e.group) e.group.style.filter = 'none';
        if (c.glowEnable && e.staticGroup && typeof Dashboard !== 'undefined' && Dashboard.hexToRgba) {
            const glowRgba = Dashboard.hexToRgba(BaseWidget.resolveCssColor(c.colGlow), c.glowOpacity / 100);
            e.staticGroup.style.filter = `drop-shadow(0 0 ${c.glowWidth}px ${glowRgba})`;
        } else if (e.staticGroup) {
            e.staticGroup.style.filter = 'none';
        }
    }

    measureResponsiveIntrinsicHeight() {
        const frame = this._arrowFrame;
        if (!frame || !(frame.width > 0) || !(frame.height > 0)) return 0;
        const wrap = this.elements && this.elements.wrapper;
        const cellW = wrap && wrap.clientWidth ? wrap.clientWidth : 0;
        if (!(cellW > 0)) return frame.height;
        return Math.max(1, frame.height * (cellW / frame.width));
    }

    _renderSpecific() {
        const c = this.config;
        const e = this.e;

        const isFastMode = (!c.customPoints || c.customPoints.length === 0);
        this.isFastMode = isFastMode;

        // --- Render Arrow SVG ---
        const pad = Math.max(c.thickness, c.headSize, (c.glowEnable ? c.glowWidth : 0) * 2) + 20;

        const rawPts = [{ x: c.fromX, y: c.fromY }, ...(c.customPoints || []), { x: c.toX, y: c.toY }];
        let minX = rawPts[0].x, minY = rawPts[0].y, maxX = rawPts[0].x, maxY = rawPts[0].y;
        rawPts.forEach(pt => {
            minX = Math.min(minX, pt.x);
            minY = Math.min(minY, pt.y);
            maxX = Math.max(maxX, pt.x);
            maxY = Math.max(maxY, pt.y);
        });

        minX -= pad;
        minY -= pad;
        maxX += pad;
        maxY += pad;

        const w = Math.max(1, maxX - minX);
        const h = Math.max(1, maxY - minY);

        this._applyArrowFrame(minX, minY, w, h);

        const isEditing = typeof Dashboard !== 'undefined' && !!Dashboard.isEditMode;
        if (!c.visible && !isEditing) {
            this._arrowMotion = { active: false };
            this._arrowMotionSig = '';
            this._stopArrowMotion();
            return;
        }

        const localPts = rawPts.map(p => ({ x: p.x - minX, y: p.y - minY }));
        this._lastLocalPts = localPts;
        this._lastFrameW = w;
        this._lastFrameH = h;

        const colMainResolved = BaseWidget.resolveCssColor(c.colMain);
        const colMainR = (typeof colMainResolved === 'string' && colMainResolved.trim() !== '')
            ? colMainResolved
            : 'currentColor';
        const flowColResolved = BaseWidget.resolveCssColor(c.animReverse ? c.colFlowRev : c.colFlow);
        const flowColR = (typeof flowColResolved === 'string' && flowColResolved.trim() !== '')
            ? flowColResolved
            : colMainR;
        const deactKey = c.deactivated ? ('1:' + BaseWidget.getDeactivatedColor(c)) : '0';
        const glowKey = (c.glowEnable && !c.deactivated)
            ? ('1:' + BaseWidget.resolveCssColor(c.colGlow) + ':' + c.glowOpacity + ':' + c.glowWidth)
            : '0';
        let ptsKey = '';
        for (let i = 0; i < rawPts.length; i++) {
            if (i > 0) ptsKey += ';';
            ptsKey += rawPts[i].x + ',' + rawPts[i].y;
        }
        const headAffectsShape = c.headSize > 0;
        const flowKey = String(c.flowWidth) + '|' + String(__nullish(c.gradientWidth, 100));
        const geometrySig = [
            minX, minY, w, h, ptsKey,
            c.thickness, c.headSize, c.lineRadius || 0, c.headRound, c.pathBendRadius || 0,
            headAffectsShape ? (c.animReverse ? 1 : 0) : 0,
            isFastMode ? 'f' : 'b',
            isFastMode ? '' : (flowKey + '|' + (c.animEnable ? 1 : 0))
        ].join('|');
        const paintSig = [
            colMainR, flowColR, deactKey, glowKey,
            c.animEnable ? 1 : 0,
            isFastMode ? (flowKey + '|' + (c.animReverse ? 1 : 0)) : (c.animReverse ? 1 : 0)
        ].join('|');

        if (this._lastGeometrySig === geometrySig && this._lastPaintSig === paintSig) {
            if (c.deactivated) {
                this._arrowMotion = { active: false };
                this._arrowMotionSig = '';
                this._stopArrowMotion();
            } else {
                this._syncArrowMotion(c);
            }
            this._syncArrowHandleChrome();
            return;
        }
        if (this._lastGeometrySig === geometrySig) {
            this._lastPaintSig = paintSig;
            this._applyArrowPaint(c, colMainR, flowColR);
            if (!c.deactivated) this._syncArrowMotion(c);
            this._syncArrowHandleChrome();
            return;
        }
        this._lastGeometrySig = geometrySig;
        this._lastPaintSig = paintSig;
        this._lastHandlesDirty = true;

        // Compute the final segment direction
        const pLast = localPts[localPts.length - 1];
        const pPrev = localPts[localPts.length - 2] || localPts[0];
        const dxLast = pLast.x - pPrev.x;
        const dyLast = pLast.y - pPrev.y;
        const lenLast = Math.sqrt(dxLast * dxLast + dyLast * dyLast) || 1;

        const ux = dxLast / lenLast;
        const uy = dyLast / lenLast;

        const hs = c.headSize;
        const ht = c.thickness;
        const rev = !!c.animReverse;

        const capH = ht / 2;

        // Compute direction vector of the first segment
        const p0 = localPts[0];
        const p1 = localPts[1] || localPts[0];
        const dxFirst = p1.x - p0.x;
        const dyFirst = p1.y - p0.y;
        const lenFirst = Math.sqrt(dxFirst * dxFirst + dyFirst * dyFirst) || 1;
        const uxFirst = dxFirst / lenFirst;
        const uyFirst = dyFirst / lenFirst;

        // When reversed the head sits at the start; shorten that side by hs, the other side by capH.
        // Normal: start side shortens by capH, end side shortens by hs (or capH when headless).
        const startShorten = rev
            ? (hs > 0 ? Math.min(hs, lenFirst / 2) : Math.min(capH, lenFirst / 2))
            : Math.min(capH, lenFirst / 2);
        const endShorten = rev
            ? Math.min(capH, lenLast / 2)
            : (hs > 0 ? hs : Math.min(capH, lenLast / 2));

        const bodyStart = {
            x: p0.x + uxFirst * startShorten,
            y: p0.y + uyFirst * startShorten
        };
        const bodyEnd = {
            x: pLast.x - ux * endShorten,
            y: pLast.y - uy * endShorten
        };

        const bodyPts = [...localPts];
        bodyPts[0] = bodyStart;
        bodyPts[bodyPts.length - 1] = bodyEnd;

        // Curve generator logically rounding corners
        const generateRoundedPath = (points, radius) => {
            if (points.length < 2) return '';
            let d = `M ${points[0].x} ${points[0].y}`;
            for (let i = 1; i < points.length - 1; i++) {
                const p0 = points[i - 1];
                const p1 = points[i];
                const p2 = points[i + 1];

                const dx1 = p1.x - p0.x;
                const dy1 = p1.y - p0.y;
                const l1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;

                const dx2 = p2.x - p1.x;
                const dy2 = p2.y - p1.y;
                const l2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;

                const r = Math.min(radius, l1 / 2, l2 / 2);

                const q1 = {
                    x: p1.x - (dx1 / l1) * r,
                    y: p1.y - (dy1 / l1) * r
                };

                const q2 = {
                    x: p1.x + (dx2 / l2) * r,
                    y: p1.y + (dy2 / l2) * r
                };

                d += ` L ${q1.x} ${q1.y} Q ${p1.x} ${p1.y} ${q2.x} ${q2.y}`;
            }
            d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
            return d;
        };

        const bodyPathStr = generateRoundedPath(bodyPts, c.pathBendRadius || 0);

        // Calculate the full end-to-end vector span of the graphic natively
        let fullLen = 0;
        for (let i = 0; i < localPts.length - 1; i++) {
            fullLen += Math.max(0, Math.hypot(localPts[i + 1].x - localPts[i].x, localPts[i + 1].y - localPts[i].y));
        }

        // Calculate total structural body line length strictly
        let totalLen = 0;
        for (let i = 0; i < bodyPts.length - 1; i++) {
            totalLen += Math.max(0, Math.hypot(bodyPts[i + 1].x - bodyPts[i].x, bodyPts[i + 1].y - bodyPts[i].y));
        }
        this.lineLen = totalLen;
        this._arrowFullLen = fullLen;
        // Tile length anchors against full graphical bounds to accurately span 0-FlowWidth loops
        this.tileLen = c.flowWidth > 0 ? c.flowWidth : fullLen;

        // Apply path data and thickness. Use butt linecap so the start cap rect controls the shape.
        e.body.setAttribute('d', bodyPathStr);
        e.body.setAttribute('stroke-width', ht);
        e.body.setAttribute('stroke-linecap', 'butt');

        e.bodyFlow.setAttribute('d', bodyPathStr);
        e.bodyFlow.setAttribute('stroke-width', ht);
        e.bodyFlow.setAttribute('stroke-linecap', 'butt');

        // End caps: paths with a flat connection edge and parametrically parameterizable round tips.
        const capR = Math.min(Math.max(0, c.lineRadius || 0), capH);

        const transformPt = (x, y, px, py, angleRad) => {
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            return {
                x: px + x * cos - y * sin,
                y: py + x * sin + y * cos
            };
        };

        const getCapPathBaked = (w, h, r, overlapFill, px, py, angleRad) => {
            const xMin = -w - overlapFill; // Extends into the line path by overlapFill pixels
            const xMax = 0;
            const yMin = -h / 2;
            const yMax = h / 2;

            const t = (x, y) => {
                const pt = transformPt(x, y, px, py, angleRad);
                return `${pt.x},${pt.y}`;
            };

            if (r <= 0) {
                return `M ${t(xMin, yMin)} L ${t(xMax, yMin)} L ${t(xMax, yMax)} L ${t(xMin, yMax)} Z`;
            }

            return `M ${t(xMin, yMin)} ` +
                `L ${t(xMax - r, yMin)} ` +
                `A ${r} ${r} 0 0 1 ${t(xMax, yMin + r)} ` +
                `L ${t(xMax, yMax - r)} ` +
                `A ${r} ${r} 0 0 1 ${t(xMax - r, yMax)} ` +
                `L ${t(xMin, yMax)} ` +
                `Z`;
        };

        // Start cap: extends backward from the first point.
        // Hidden when reversed and headSize > 0 (the arrowhead takes its place).
        const sP0 = localPts[0], sP1 = localPts[1] || localPts[0];
        const sDx = sP0.x - sP1.x, sDy = sP0.y - sP1.y;
        const sAngle = Math.atan2(sDy, sDx);
        const startCapPathStr = getCapPathBaked(capH, ht, capR, 1.5, sP0.x, sP0.y, sAngle);

        if (rev && hs > 0) {
            [e.startCap, e.startCapFlow].forEach(el => { el.style.display = 'none'; });
        } else {
            [e.startCap, e.startCapFlow].forEach(el => {
                el.setAttribute('d', startCapPathStr);
                el.removeAttribute('transform');
                el.style.display = 'block';
            });
        }

        // End cap: visible when headSize=0 in normal mode, or always when reversed (head moved to start).
        // The shaft is inset by half the thickness on this side; the cap is what lands on the endpoint.
        const eP0 = localPts[localPts.length - 1], ePrev = localPts[localPts.length - 2] || localPts[0];
        const eDx = eP0.x - ePrev.x, eDy = eP0.y - ePrev.y;
        const eAngle = Math.atan2(eDy, eDx);
        const endCapPathStr = getCapPathBaked(capH, ht, capR, 1.5, eP0.x, eP0.y, eAngle);

        if (!rev && hs > 0) {
            e.endCap.style.display = 'none';
            e.endCapFlow.style.display = 'none';
        } else {
            [e.endCap, e.endCapFlow].forEach(el => {
                el.setAttribute('d', endCapPathStr);
                el.removeAttribute('transform');
                el.style.display = 'block';
            });
        }

        // headRoundness must be declared here so it's accessible in the mask section below
        const headRoundness = c.headRound;

        // Render arrowhead polygon at the start when reversed, otherwise at the end.
        if (hs > 0) {
            e.head.style.display = 'block';
            e.headFlow.style.display = 'block';

            let headAngle, headPivot;
            if (rev) {
                // Point backward along the first segment (opposite of uxFirst/uyFirst)
                headAngle = Math.atan2(-dyFirst, -dxFirst);
                headPivot = bodyStart;
            } else {
                headAngle = Math.atan2(dyLast, dxLast);
                headPivot = bodyEnd;
            }

            const pt1 = transformPt(0, -hs / 2, headPivot.x, headPivot.y, headAngle);
            const pt2 = transformPt(hs, 0, headPivot.x, headPivot.y, headAngle);
            const pt3 = transformPt(0, hs / 2, headPivot.x, headPivot.y, headAngle);
            const headPolygonBaked = `${pt1.x},${pt1.y} ${pt2.x},${pt2.y} ${pt3.x},${pt3.y}`;

            [e.head, e.headFlow].forEach(el => {
                el.setAttribute('points', headPolygonBaked);
                el.removeAttribute('transform');
                el.setAttribute('stroke-width', headRoundness * 2);
                el.setAttribute('stroke-linejoin', 'round');
            });
        } else {
            e.head.style.display = 'none';
            e.headFlow.style.display = 'none';
        }

        // Coloring
        e.body.setAttribute('stroke', colMainR);
        e.startCap.setAttribute('fill', colMainR);
        e.endCap.setAttribute('fill', colMainR);
        e.head.setAttribute('fill', colMainR);
        e.head.setAttribute('stroke', colMainR);

        e.bodyFlow.setAttribute('stroke', flowColR);
        e.startCapFlow.setAttribute('fill', flowColR);
        e.endCapFlow.setAttribute('fill', flowColR);
        e.headFlow.setAttribute('fill', flowColR);
        e.headFlow.setAttribute('stroke', flowColR);

        if (c.deactivated) {
            const deactColor = BaseWidget.getDeactivatedColor(c);
            e.body.setAttribute('stroke', deactColor);
            e.startCap.setAttribute('fill', deactColor);
            e.endCap.setAttribute('fill', deactColor);
            e.head.setAttribute('fill', deactColor);
            e.head.setAttribute('stroke', deactColor);
            e.flowLayer.style.display = 'none';
            if (e.glowLayer) e.glowLayer.style.display = 'none';
            if (e.group) e.group.style.filter = 'none';
            if (e.staticGroup) e.staticGroup.style.filter = 'none';
            this._arrowMotion = { active: false };
            this._arrowMotionSig = '';
            this._stopArrowMotion();
            this._syncArrowHandleChrome();
            return;
        }

        if (c.animEnable) {
            e.flowLayer.style.display = 'block';

            if (this.isFastMode) {
                // Fast Mode: Remove mask entirely, apply linearGradient directly over the elements.
                // The bend blur filter is not used here. Leaving the reference makes
                // Software WebRender keep a gaussian scratch surface on every straight arrow.
                e.flowLayer.removeAttribute('mask');
                e.maskPath.style.display = 'none';
                e.maskPath.removeAttribute('filter');

                const gradRef = `url(#grad-${this.id})`;
                e.bodyFlow.setAttribute('stroke', gradRef);
                e.startCapFlow.setAttribute('fill', gradRef);
                e.endCapFlow.setAttribute('fill', gradRef);
                e.headFlow.setAttribute('fill', gradRef);
                e.headFlow.setAttribute('stroke', gradRef);

                // 4-stop gradient: flowCol always spans the center 50% of the tile.
                // gradientWidth controls only the transition edge width, not the flow band size.
                // At gw=0 the duplicate offsets at 0.25/0.75 produce SVG hard steps (no interpolation).
                const gw = Math.min(1, Math.max(0, (__nullish(c.gradientWidth, 100)) / 100));
                const b = gw * 0.25;
                e.stops[0].setAttribute('stop-color', colMainR);
                e.stops[0].setAttribute('offset', `${0.25 - b}`);
                e.stops[1].setAttribute('stop-color', flowColR);
                e.stops[1].setAttribute('offset', `${0.25 + b}`);
                e.stops[2].setAttribute('stop-color', flowColR);
                e.stops[2].setAttribute('offset', `${0.75 - b}`);
                e.stops[3].setAttribute('stop-color', colMainR);
                e.stops[3].setAttribute('offset', `${0.75 + b}`);

                // Engine Swap: map identical gradient math into the native pipeline 
                e.grad.setAttribute('x1', localPts[0].x);
                e.grad.setAttribute('y1', localPts[0].y);
                const gwAngle = Math.atan2(localPts[1].y - localPts[0].y, localPts[1].x - localPts[0].x);
                this._fastDx = Math.cos(gwAngle);
                this._fastDy = Math.sin(gwAngle);
                e.grad.setAttribute('x2', localPts[0].x + this._fastDx * this.tileLen);
                e.grad.setAttribute('y2', localPts[0].y + this._fastDy * this.tileLen);

            } else {
                // Complex Mode: Use Mask and Gaussian Blurs
                e.flowLayer.setAttribute('mask', `url(#flow-mask-${this.id})`);
                e.maskPath.style.display = 'block';

                const maskPts = [...localPts];
                if (maskPts.length >= 2) {
                    const extLen = Math.ceil(150 / this.tileLen) * this.tileLen; // Extend beyond bounds by at least 150px, aligned to phase

                    const p0 = maskPts[0], p1 = maskPts[1];
                    const d0 = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
                    maskPts.unshift({
                        x: p0.x - ((p1.x - p0.x) / d0) * extLen,
                        y: p0.y - ((p1.y - p0.y) / d0) * extLen
                    });

                    const pL = maskPts[maskPts.length - 1], pLprev = maskPts[maskPts.length - 2];
                    const dL = Math.hypot(pL.x - pLprev.x, pL.y - pLprev.y) || 1;
                    maskPts.push({
                        x: pL.x + ((pL.x - pLprev.x) / dL) * extLen,
                        y: pL.y + ((pL.y - pLprev.y) / dL) * extLen
                    });
                }

                // Mask animation approach makes the flowing line able to bend natively
                const maskPathStr = generateRoundedPath(maskPts, c.pathBendRadius || 0);
                e.maskPath.setAttribute('d', maskPathStr);

                const gw = Math.max(0, Math.min(100, __nullish(c.gradientWidth, 100))) / 100;
                const blurAmount = gw * 15; // Soft 15px blur

                // Critical Performance Optimization: Bypassing Blur filter entirely for 0 width drops hardware GPU load to almost zero.
                if (blurAmount > 0) {
                    e.maskBlur.setAttribute('stdDeviation', blurAmount);
                    e.maskPath.setAttribute('filter', `url(#blur-${this.id})`);
                } else {
                    e.maskPath.removeAttribute('filter');
                }

                // Boost the stroke width drastically enough that the vertical gaussian blur
                // doesn't fade alpha out before the edge of the actual drawn arrow body!
                e.maskPath.setAttribute('stroke-width', Math.max(ht, hs) + headRoundness * 2 + Math.max(10, blurAmount * 4));

                // Dash array: visually defines the tile proportions
                const dashSolid = Math.max(1, this.tileLen / 2);
                const dashGap = Math.max(1, this.tileLen - dashSolid);
                e.maskPath.setAttribute('stroke-dasharray', `${dashSolid} ${dashGap}`);
            }
        } else {
            e.flowLayer.style.display = 'none';
        }

        if (e.group) e.group.style.filter = 'none';
        if (c.glowEnable && e.staticGroup) {
            const glowRgba = Dashboard.hexToRgba(BaseWidget.resolveCssColor(c.colGlow), c.glowOpacity / 100);
            e.staticGroup.style.filter = `drop-shadow(0 0 ${c.glowWidth}px ${glowRgba})`;
        } else if (e.staticGroup) {
            e.staticGroup.style.filter = 'none';
        }
        this._syncArrowMotion(c);
        this._syncArrowHandleChrome();
    }

    _ensureArrowHandles() {
        const e = this.e;
        const localPts = this._lastLocalPts;
        if (!e || !e.handlesNode || !localPts || !localPts.length) return;
        const w = this._lastFrameW || 1;
        const h = this._lastFrameH || 1;
        // Handles live in the same viewBox as the path so they stay on the
        // corners when the cell is a different size from the design box.
        const neededHandles = localPts.length;
        const existingHandles = Array.from(e.handlesNode.children);
        const svgNs = 'http://www.w3.org/2000/svg';

        while (existingHandles.length > neededHandles) {
            e.handlesNode.removeChild(existingHandles.pop());
        }

        while (existingHandles.length < neededHandles) {
            const handleEl = document.createElementNS(svgNs, 'circle');
            handleEl.setAttribute('class', 'arrow-handle');
            handleEl.setAttribute('fill', '#22d3ee');
            handleEl.setAttribute('stroke', '#ffffff');
            handleEl.setAttribute('stroke-width', '2');
            handleEl.setAttribute('vector-effect', 'non-scaling-stroke');
            handleEl.style.cursor = 'crosshair';
            handleEl.style.pointerEvents = 'auto';
            handleEl.style.touchAction = 'none';
            e.handlesNode.appendChild(handleEl);
            existingHandles.push(handleEl);
        }

        const wrapW = this.elements.wrapper ? this.elements.wrapper.clientWidth : 0;
        const wrapH = this.elements.wrapper ? this.elements.wrapper.clientHeight : 0;
        const fit = (wrapW > 0 && wrapH > 0)
            ? Math.min(wrapW / w, wrapH / h)
            : 1;
        const handleR = (fit > 0 ? 7 / fit : 7);
        this._arrowHandleR = handleR;

        existingHandles.forEach((handleEl, idx) => {
            handleEl.setAttribute('cx', String(localPts[idx].x));
            handleEl.setAttribute('cy', String(localPts[idx].y));
            handleEl.setAttribute('r', String(handleR));

            const boundKey = idx + '_' + neededHandles;
            if (handleEl.getAttribute('data-bound-key') !== boundKey) {
                handleEl.setAttribute('data-bound-key', boundKey);
                const newH = handleEl.cloneNode(true);
                e.handlesNode.replaceChild(newH, handleEl);
                existingHandles[idx] = newH;
                const type = idx === 0 ? 'start' : (idx === neededHandles - 1 ? 'end' : idx - 1);
                this._setupHandleDrag(newH, type);
            }
        });
        this._lastHandlesDirty = false;
    }

    _syncArrowHandleChrome() {
        const node = this.e && this.e.handlesNode;
        if (!node) return;
        const editing = typeof Dashboard !== 'undefined'
            && !!Dashboard.isEditMode
            && !Dashboard._holdLivePreviewActive;
        if (editing && (this._lastHandlesDirty || !node.children.length)) {
            this._ensureArrowHandles();
        }
        const selected = editing
            && Dashboard.selectedIds
            && Dashboard.selectedIds.indexOf(this.id) !== -1;
        const display = selected ? '' : 'none';
        const kids = node.children;
        for (let i = 0; i < kids.length; i++) {
            if (kids[i].style.display !== display) kids[i].style.display = display;
        }
    }

    _syncEditModeVisuals() {
        BaseWidget.prototype._syncEditModeVisuals.call(this);
        this._syncArrowHandleChrome();
    }

    select() {
        BaseWidget.prototype.select.call(this);
        this._syncArrowHandleChrome();
    }

    deselect() {
        BaseWidget.prototype.deselect.call(this);
        this._syncArrowHandleChrome();
    }
}

WidgetRegistry.register('arrow', ArrowWidget);
