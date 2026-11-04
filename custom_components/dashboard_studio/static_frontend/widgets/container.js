// Replaces widgets/container.js when the dashboard URL has test_mode=full.
class ContainerWidget extends BaseWidget {
    static get metadata() {
        return { label: "Container", shortName: "Container", icon: "ph-squares-four", category: "Layout", color_dark: "hsl(0, 80%, 65%)", color_light: "hsl(0, 85%, 35%)", helpSlug: 'container', version: "2.3.1", date: "2026-11-02" };
    }

    static get COMMON_SCHEMA() {
        const schema = JSON.parse(JSON.stringify(BaseWidget.COMMON_SCHEMA));
        // The JSON round-trip drops functions (e.g. visibleWhen). Restore the
        // shared inner glow row so it behaves exactly like the shipped container.
        const innerGlowFields = BaseWidget.getInnerGlowSchemaFields(false);
        const innerGlowByKey = {};
        innerGlowFields.forEach(function (f) { innerGlowByKey[f.key] = f; });
        schema.forEach(function (group) {
            if (group && group.id === 'style_group' && Array.isArray(group.fields)) {
                group.fields = group.fields.map(function (f) {
                    return (f && innerGlowByKey[f.key]) ? innerGlowByKey[f.key] : f;
                });
            }
            if (!group || group.id !== 'meta_group' || !Array.isArray(group.fields)) return;
            group.fields = group.fields.filter(function (f) {
                return f && f.key !== 'deactivated';
            });
            const lockedF = group.fields.find(function (f) { return f && f.key === 'locked'; });
            if (lockedF) lockedF.cols = 12;
        });
        return schema;
    }

    static get CONTAINER_LABEL_LEGACY_TYPO_KEYS() {
        return ['labelFont', 'labelFs', 'labelCol', 'labelCase', 'labelBold', 'labelAlign', 'labelItalic', 'labelOffX', 'labelOffY'];
    }

    static get CONTAINER_LABEL_FLAT_TYPO_KEYS() {
        return ContainerWidget.CONTAINER_LABEL_LEGACY_TYPO_KEYS;
    }

    static applyTypographyNestedToConfig(c) {
        BaseWidget.applyTypographyNestedToConfig(c, [
            ['widgetLabel', 'label']
        ]);
    }

    static getNestedBindingOverlaySpec() {
        return BaseWidget.buildTypographyBindingOverlaySpec([['widgetLabel', 'label']]);
    }

    static fillContainerTypographyResolved(c, M) {
        BaseWidget.fillWidgetLabelTypographyResolved(c, M, 'label');
    }

    static get globalSettings() {
        return {};
    }

    static get basicSettingKeys() {
        return [];
    }

    static get globalSchema() {
        return [];
    }

    getDefaultOverrides() {
        return {
            label: "Container",
            typography: { widgetLabel: {} }
        };
    }

    get config() {
        const c = super.config;
        const getNum = (val, def) => (val !== null && val !== undefined && val !== "") ? val : def;

        ContainerWidget.applyTypographyNestedToConfig(c);
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        ContainerWidget.fillContainerTypographyResolved(c, M);
        BaseWidget.applyNestedBindingOverlay(this, c, ContainerWidget.getNestedBindingOverlaySpec());

        const out = {
            ...c,
            label: c.label || "",
            labelFont: c.labelFont,
            labelFs: getNum(c.labelFs, M.defaultFsLabel != null ? M.defaultFsLabel : 12),
            labelCol: c.labelCol,
            labelCase: c.labelCase,
            labelBold: c.labelBold,
            labelAlign: c.labelAlign,
            labelItalic: c.labelItalic,
            labelOffX: getNum(c.labelOffX, 0),
            labelOffY: getNum(c.labelOffY, 0)
        };

        delete out.typography;

        return out;
    }

    getSchema() {
        const widgetLabelTypo = BaseWidget.getWidgetLabelTypographySchema('label', 'widgetLabel');

        return [
            {
                id: 'ct_label', title: 'Text & Typography', icon: 'ph-text-t',
                fields: [
                    { key: 'label', type: 'text', label: 'Widget Label', cols: 12 },
                    widgetLabelTypo
                ]
            }
        ];
    }

    _buildBaseDOM() {
        const b = super._buildBaseDOM();
        b.innerContent.style.display = 'flex';
        b.innerContent.style.flexDirection = 'column';

        const lbl = document.createElement('div');
        BaseWidget.applyWidgetLabelElementChrome(lbl);

        b.container.prepend(lbl);
        this.lblEl = lbl;

        return b;
    }

    _renderSpecific() {
        const c = this.config;

        this.lblEl.textContent = c.label;
        this.lblEl.style.display = c.label ? 'block' : 'none';

        this.applyTypographyToElement(this.lblEl, 'label', c);
        this.lblEl.style.transform = `translate(${c.labelOffX}px, ${c.labelOffY}px)`;
    }
}


class ShapedContainerWidget extends ContainerWidget {
    static get metadata() {
        return {
            label: "Container",
            shortName: "Container",
            icon: "ph-squares-four",
            category: "Layout",
            color_dark: "hsl(0, 80%, 65%)",
            color_light: "hsl(0, 85%, 35%)",
            helpSlug: 'container',
            version: "2.3.1",
            date: "2026-11-02"
        };
    }

    static get COMMON_SCHEMA() {
        const schema = ContainerWidget.COMMON_SCHEMA;
        for (let i = 0; i < schema.length; i++) {
            const group = schema[i];
            if (!group || group.id !== 'style_group' || !Array.isArray(group.fields)) continue;
            group.fields.push(
                { key: 'customShape', type: 'checkbox', label: 'Custom Shape', cols: 12 },
                {
                    key: 'shapePoints',
                    type: 'point_list',
                    label: 'Corners',
                    cols: 12,
                    widgetRelative: true,
                    pointRadius: true,
                    freeBounds: true,
                    trackActivePoint: true,
                    itemLabel: 'Corner',
                    addLabel: 'Add Corner',
                    minPoints: 3,
                    dependsOn: ['customShape'],
                    visibleWhen: function (values) {
                        return !!(values && values.customShape);
                    }
                }
            );
        }
        return schema;
    }

    static defaultShapePoints() {
        return [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 }
        ];
    }

    /**
     * Closed polygon. Each vertex uses its own radius, or defaultRadius when unset.
     * Setback on an edge is capped at half the edge so neighboring curves cannot cross.
     */
    static buildClosedRoundedPath(points, defaultRadius) {
        const n = points && points.length ? points.length : 0;
        if (n < 3) return '';
        const lens = new Array(n);
        for (let i = 0; i < n; i++) {
            const a = points[i];
            const b = points[(i + 1) % n];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            lens[i] = Math.sqrt(dx * dx + dy * dy) || 0;
        }
        const setback = new Array(n);
        const fallback = defaultRadius > 0 ? defaultRadius : 0;
        for (let i = 0; i < n; i++) {
            const own = points[i].radius;
            let r = (own !== undefined && own !== null && own !== '') ? Number(own) : fallback;
            if (!(r > 0)) r = 0;
            const prevEdge = lens[(i - 1 + n) % n];
            const nextEdge = lens[i];
            setback[i] = Math.min(r, prevEdge / 2, nextEdge / 2);
        }
        let d = '';
        for (let i = 0; i < n; i++) {
            const prev = points[(i - 1 + n) % n];
            const curr = points[i];
            const next = points[(i + 1) % n];
            const r = setback[i];
            const dx1 = curr.x - prev.x;
            const dy1 = curr.y - prev.y;
            const l1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
            const dx2 = next.x - curr.x;
            const dy2 = next.y - curr.y;
            const l2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
            const q1x = ShapedContainerWidget._pathNum(curr.x - (dx1 / l1) * r);
            const q1y = ShapedContainerWidget._pathNum(curr.y - (dy1 / l1) * r);
            const q2x = ShapedContainerWidget._pathNum(curr.x + (dx2 / l2) * r);
            const q2y = ShapedContainerWidget._pathNum(curr.y + (dy2 / l2) * r);
            const cx = ShapedContainerWidget._pathNum(curr.x);
            const cy = ShapedContainerWidget._pathNum(curr.y);
            if (i === 0) d = 'M ' + q1x + ' ' + q1y;
            else d += ' L ' + q1x + ' ' + q1y;
            if (r > 0) d += ' Q ' + cx + ' ' + cy + ' ' + q2x + ' ' + q2y;
            else d += ' L ' + cx + ' ' + cy;
        }
        d += ' Z';
        return d;
    }

    static _pathNum(v) {
        return String(Math.round(v * 100) / 100);
    }

    getDefaultOverrides() {
        const base = ContainerWidget.prototype.getDefaultOverrides.call(this);
        base.label = 'Container';
        base.customShape = false;
        base.shapePoints = ShapedContainerWidget.defaultShapePoints();
        return base;
    }

    _isCustomShapeOn() {
        const b = this.bindings;
        if (b && typeof b.customShape === 'string' && b.customShape !== '') {
            const c = this.config;
            return c.customShape === true || c.customShape === 'true' || c.customShape === 1 || c.customShape === '1';
        }
        return !!(this.overrides && this.overrides.customShape === true);
    }

    _storedShapePoints() {
        const o = this.overrides;
        if (o && Array.isArray(o.shapePoints) && o.shapePoints.length >= 3) return o.shapePoints;
        return ShapedContainerWidget.defaultShapePoints();
    }

    _cloneShapePoints(src) {
        const list = src || [];
        const pts = [];
        for (let i = 0; i < list.length; i++) {
            const pt = list[i] || {};
            const next = {
                x: BaseWidget.toFiniteNumber(pt.x, 0),
                y: BaseWidget.toFiniteNumber(pt.y, 0)
            };
            if (pt.radius !== undefined && pt.radius !== null && pt.radius !== '') {
                next.radius = BaseWidget.toFiniteNumber(pt.radius, 0);
            }
            pts.push(next);
        }
        return pts;
    }

    _resolvedShapePoints() {
        const src = this._storedShapePoints();
        const b = this.bindings || {};
        const live = (typeof Dashboard !== 'undefined' && Dashboard.liveData) ? Dashboard.liveData : null;
        const out = new Array(src.length);
        for (let i = 0; i < src.length; i++) {
            const pt = src[i] || {};
            let x = BaseWidget.toFiniteNumber(pt.x, 0);
            let y = BaseWidget.toFiniteNumber(pt.y, 0);
            let radius = null;
            if (pt.radius !== undefined && pt.radius !== null && pt.radius !== '') {
                radius = BaseWidget.toFiniteNumber(pt.radius, 0);
            }
            if (live) {
                const bX = b['shapePoints_' + i + '_X'];
                const bY = b['shapePoints_' + i + '_Y'];
                const bR = b['shapePoints_' + i + '_R'];
                if (bX && live[bX] !== undefined && live[bX] !== null) {
                    const parsed = parseFloat(live[bX]);
                    if (!isNaN(parsed)) x = parsed;
                }
                if (bY && live[bY] !== undefined && live[bY] !== null) {
                    const parsed = parseFloat(live[bY]);
                    if (!isNaN(parsed)) y = parsed;
                }
                if (bR && live[bR] !== undefined && live[bR] !== null) {
                    const parsed = parseFloat(live[bR]);
                    if (!isNaN(parsed)) radius = parsed;
                }
            }
            out[i] = { x: x, y: y, radius: radius };
        }
        return out;
    }

        _shapeIds() {
        if (this._shapeIdBag) return this._shapeIdBag;
        const safe = String(this.id).replace(/[^a-zA-Z0-9_-]/g, '');
        this._shapeIdBag = {
            grad: 'scg-' + safe,
            clip: 'scc-' + safe,
            mask: 'scm-' + safe,
            maskOut: 'scmo-' + safe,
            glow: 'scw-' + safe,
            inner: 'sci-' + safe
        };
        return this._shapeIdBag;
    }

    _shapeCssColor(col, opacityPercent) {
        const resolved = BaseWidget.resolveCssColor(col);
        const a = (opacityPercent !== undefined && opacityPercent !== null ? opacityPercent : 100) / 100;
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.hexToRgba === 'function') {
            return Dashboard.hexToRgba(resolved, a);
        }
        return resolved || 'transparent';
    }

    _shapeBlurPx(c) {
        if (!c || !c.bgVisible) return 0;
        const opStart = (c.bgOpacityStart !== undefined && c.bgOpacityStart !== null) ? c.bgOpacityStart : 100;
        const opEnd = (c.bgOpacityEnd !== undefined && c.bgOpacityEnd !== null) ? c.bgOpacityEnd : 100;
        if (opStart >= 100 && opEnd >= 100) return 0;
        return BaseWidget.clampNumber(c.bgBlur, 0, 40);
    }

    _ensureShapeDom() {
        if (this._shapeSvg) return;
        const ns = 'http://www.w3.org/2000/svg';
        const ids = this._shapeIds();
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('class', 'shaped-container-svg');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.style.position = 'absolute';
        svg.style.left = '0';
        svg.style.top = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.overflow = 'visible';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '0';

        const defs = document.createElementNS(ns, 'defs');
        const grad = document.createElementNS(ns, 'linearGradient');
        grad.setAttribute('id', ids.grad);
        grad.setAttribute('gradientUnits', 'objectBoundingBox');
        const stop0 = document.createElementNS(ns, 'stop');
        stop0.setAttribute('offset', '0');
        const stop1 = document.createElementNS(ns, 'stop');
        stop1.setAttribute('offset', '1');
        grad.appendChild(stop0);
        grad.appendChild(stop1);

        const clip = document.createElementNS(ns, 'clipPath');
        clip.setAttribute('id', ids.clip);
        clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
        const clipPath = document.createElementNS(ns, 'path');
        clip.appendChild(clipPath);

        const mask = document.createElementNS(ns, 'mask');
        mask.setAttribute('id', ids.mask);
        mask.setAttribute('maskUnits', 'userSpaceOnUse');
        mask.setAttribute('maskContentUnits', 'userSpaceOnUse');
        const maskPath = document.createElementNS(ns, 'path');
        maskPath.setAttribute('fill', '#ffffff');
        mask.appendChild(maskPath);

        // Exterior mask for the glow shadow: white everywhere, black shape punched
        // out. Rect chrome box-shadow only paints outside the box; without this the
        // shadow path sits under the translucent fill and darkens the interior.
        const maskOut = document.createElementNS(ns, 'mask');
        maskOut.setAttribute('id', ids.maskOut);
        maskOut.setAttribute('maskUnits', 'userSpaceOnUse');
        maskOut.setAttribute('maskContentUnits', 'userSpaceOnUse');
        const maskOutRect = document.createElementNS(ns, 'rect');
        maskOutRect.setAttribute('fill', '#ffffff');
        maskOut.appendChild(maskOutRect);
        const maskOutPath = document.createElementNS(ns, 'path');
        maskOutPath.setAttribute('fill', '#000000');
        maskOut.appendChild(maskOutPath);

        const glowFilter = document.createElementNS(ns, 'filter');
        glowFilter.setAttribute('id', ids.glow);
        glowFilter.setAttribute('filterUnits', 'userSpaceOnUse');
        glowFilter.setAttribute('primitiveUnits', 'userSpaceOnUse');
        glowFilter.setAttribute('color-interpolation-filters', 'sRGB');
        const erode = document.createElementNS(ns, 'feMorphology');
        erode.setAttribute('in', 'SourceAlpha');
        erode.setAttribute('operator', 'erode');
        erode.setAttribute('radius', '10');
        erode.setAttribute('result', 'eroded');
        const blur = document.createElementNS(ns, 'feGaussianBlur');
        blur.setAttribute('in', 'eroded');
        blur.setAttribute('result', 'blurred');
        const flood = document.createElementNS(ns, 'feFlood');
        flood.setAttribute('result', 'flood');
        const composite = document.createElementNS(ns, 'feComposite');
        composite.setAttribute('in', 'flood');
        composite.setAttribute('in2', 'blurred');
        composite.setAttribute('operator', 'in');
        glowFilter.appendChild(erode);
        glowFilter.appendChild(blur);
        glowFilter.appendChild(flood);
        glowFilter.appendChild(composite);
        defs.appendChild(glowFilter);

        const innerGlowFilter = document.createElementNS(ns, 'filter');
        innerGlowFilter.setAttribute('id', ids.inner);
        innerGlowFilter.setAttribute('filterUnits', 'userSpaceOnUse');
        innerGlowFilter.setAttribute('primitiveUnits', 'userSpaceOnUse');
        innerGlowFilter.setAttribute('color-interpolation-filters', 'sRGB');
        const innerBlur = document.createElementNS(ns, 'feGaussianBlur');
        innerGlowFilter.appendChild(innerBlur);
        defs.appendChild(innerGlowFilter);

        defs.appendChild(grad);
        defs.appendChild(clip);
        defs.appendChild(mask);
        defs.appendChild(maskOut);
        svg.appendChild(defs);

        const shadowPath = document.createElementNS(ns, 'path');
        shadowPath.setAttribute('fill', '#000000');
        shadowPath.setAttribute('stroke', 'none');
        shadowPath.setAttribute('filter', 'url(#' + ids.glow + ')');
        shadowPath.setAttribute('mask', 'url(#' + ids.maskOut + ')');
        shadowPath.style.display = 'none';
        svg.appendChild(shadowPath);

        const shapePath = document.createElementNS(ns, 'path');
        shapePath.setAttribute('clip-path', 'url(#' + ids.clip + ')');
        shapePath.setAttribute('fill', 'url(#' + ids.grad + ')');
        shapePath.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(shapePath);

        // Inner glow: edge-centered stroke clipped to the shape interior, so only
        // the inner half paints and the blur fades it inward like the rect chrome.
        const innerGlowPath = document.createElementNS(ns, 'path');
        innerGlowPath.setAttribute('clip-path', 'url(#' + ids.clip + ')');
        innerGlowPath.setAttribute('fill', 'none');
        innerGlowPath.setAttribute('stroke-linejoin', 'round');
        innerGlowPath.setAttribute('filter', 'url(#' + ids.inner + ')');
        innerGlowPath.style.display = 'none';
        svg.appendChild(innerGlowPath);

        const editPath = document.createElementNS(ns, 'path');
        editPath.setAttribute('fill', 'none');
        editPath.setAttribute('stroke-linejoin', 'round');
        editPath.setAttribute('stroke-linecap', 'round');
        editPath.setAttribute('pointer-events', 'none');
        editPath.style.display = 'none';
        svg.appendChild(editPath);

        const container = this.elements.container;
        container.insertBefore(svg, container.firstChild);

        const handles = document.createElement('div');
        handles.className = 'shaped-container-handles';
        handles.style.position = 'absolute';
        handles.style.left = '0';
        handles.style.top = '0';
        handles.style.right = '0';
        handles.style.bottom = '0';
        handles.style.zIndex = '901';
        handles.style.pointerEvents = 'none';
        handles.style.display = 'none';
        const handleHost = this.elements.wrapper || container;
        handleHost.appendChild(handles);

        if (this.lblEl) {
            this.lblEl.style.position = 'relative';
            this.lblEl.style.zIndex = '2';
        }

        this._shapeSvg = svg;
        this._shapeGrad = grad;
        this._shapeStop0 = stop0;
        this._shapeStop1 = stop1;
        this._shapeClipPath = clipPath;
        this._shapeMask = mask;
        this._shapeMaskPath = maskPath;
        this._shapeMaskOut = maskOut;
        this._shapeMaskOutRect = maskOutRect;
        this._shapeMaskOutPath = maskOutPath;
        this._shapePath = shapePath;
        this._shapeShadow = shadowPath;
        this._shapeInnerGlow = innerGlowPath;
        this._shapeInnerGlowFilter = innerGlowFilter;
        this._shapeInnerGlowBlur = innerBlur;
        this._shapeGlowFilter = glowFilter;
        this._shapeGlowBlur = blur;
        this._shapeGlowFlood = flood;
        this._shapeEditPath = editPath;
        this._shapeHandleLayer = handles;
    }

    _ensureShapeBlur() {
        if (this._shapeBlur) return;
        const blur = document.createElement('div');
        blur.className = 'shaped-container-blur';
        blur.style.position = 'absolute';
        blur.style.left = '0';
        blur.style.top = '0';
        blur.style.right = '0';
        blur.style.bottom = '0';
        blur.style.pointerEvents = 'none';
        blur.style.zIndex = '0';
        const container = this.elements.container;
        if (this._shapeSvg && this._shapeSvg.parentNode === container) {
            container.insertBefore(blur, this._shapeSvg);
        } else {
            container.insertBefore(blur, container.firstChild);
        }
        this._shapeBlur = blur;
    }

    _removeShapeBlur() {
        if (!this._shapeBlur) return;
        if (this._shapeBlur.parentNode) this._shapeBlur.parentNode.removeChild(this._shapeBlur);
        this._shapeBlur = null;
    }

    _releaseShapeHandleDrags() {
        const layer = this._shapeHandleLayer;
        if (!layer) return;
        const kids = layer.children;
        for (let i = 0; i < kids.length; i++) {
            const h = kids[i];
            if (h._shapeDrag && typeof h._shapeDrag.destroy === 'function') {
                h._shapeDrag.destroy();
                h._shapeDrag = null;
            }
            h.removeAttribute('data-bound-key');
        }
    }

    _teardownCustomShape() {
        if (!this._shapeSvg && !this._shapeBlur && !this._shapeHandleLayer) return;
        this._releaseShapeHandleDrags();
        this._removeShapeBlur();
        if (this._shapeSvg && this._shapeSvg.parentNode) this._shapeSvg.parentNode.removeChild(this._shapeSvg);
        if (this._shapeHandleLayer && this._shapeHandleLayer.parentNode) {
            this._shapeHandleLayer.parentNode.removeChild(this._shapeHandleLayer);
        }
        this._shapeSvg = null;
        this._shapeHandleLayer = null;
        this._shapeGrad = null;
        this._shapeStop0 = null;
        this._shapeStop1 = null;
        this._shapeClipPath = null;
        this._shapeMask = null;
        this._shapeMaskPath = null;
        this._shapeMaskOut = null;
        this._shapeMaskOutRect = null;
        this._shapeMaskOutPath = null;
        this._shapePath = null;
        this._shapeShadow = null;
        this._shapeInnerGlow = null;
        this._shapeInnerGlowFilter = null;
        this._shapeInnerGlowBlur = null;
        this._shapeGlowFilter = null;
        this._shapeGlowBlur = null;
        this._shapeGlowFlood = null;
        this._shapeEditPath = null;
        this._shapeSig = '';
        if (this.lblEl) {
            this.lblEl.style.zIndex = '';
            this.lblEl.style.position = '';
        }
    }

    _clearRectChrome() {
        const el = this.elements;
        if (!el || !el.container) return;
        const cs = el.container.style;
        cs.background = 'transparent';
        cs.border = 'none';
        cs.boxShadow = 'none';
        cs.borderRadius = '0px';
        cs.overflow = 'visible';
        this._syncContainerBackdropBlur(el.container, 0);
    }

    _paintShape(c, pathD, blurPx) {
        const w = BaseWidget.clampNumber(c.width, 1, null);
        const h = BaseWidget.clampNumber(c.height, 1, null);
        const svg = this._shapeSvg;
        const viewBox = '0 0 ' + w + ' ' + h;
        if (svg.getAttribute('viewBox') !== viewBox) svg.setAttribute('viewBox', viewBox);
        this._shapeMask.setAttribute('x', '0');
        this._shapeMask.setAttribute('y', '0');
        this._shapeMask.setAttribute('width', String(w));
        this._shapeMask.setAttribute('height', String(h));
        this._shapeClipPath.setAttribute('d', pathD);
        this._shapeMaskPath.setAttribute('d', pathD);
        this._shapePath.setAttribute('d', pathD);

        if (!c.bgVisible) {
            this._shapePath.setAttribute('fill', 'none');
            this._shapePath.setAttribute('stroke', 'none');
            this._shapePath.setAttribute('stroke-width', '0');
            svg.style.filter = 'none';
            if (this._shapeShadow) this._shapeShadow.style.display = 'none';
            if (this._shapeInnerGlow) this._shapeInnerGlow.style.display = 'none';
            this._removeShapeBlur();
            return;
        }

        const ids = this._shapeIds();
        const angle = BaseWidget.toFiniteNumber(c.bgAngle, 0) * Math.PI / 180;
        const x2 = 0.5 + Math.sin(angle) * 0.5;
        const y2 = 0.5 - Math.cos(angle) * 0.5;
        this._shapeGrad.setAttribute('x1', String(0.5 - Math.sin(angle) * 0.5));
        this._shapeGrad.setAttribute('y1', String(0.5 + Math.cos(angle) * 0.5));
        this._shapeGrad.setAttribute('x2', String(x2));
        this._shapeGrad.setAttribute('y2', String(y2));
        this._shapeStop0.setAttribute('stop-color', this._shapeCssColor(c.bgColStart, c.bgOpacityStart));
        this._shapeStop1.setAttribute('stop-color', this._shapeCssColor(c.bgColEnd, c.bgOpacityEnd));
        this._shapePath.setAttribute('fill', 'url(#' + ids.grad + ')');

        const borderW = BaseWidget.clampNumber(c.borderWidth, 0, null);
        if (borderW > 0) {
            this._shapePath.setAttribute('stroke', this._shapeCssColor(c.borderColor, c.borderOpacity));
            this._shapePath.setAttribute('stroke-width', String(borderW * 2));
        } else {
            this._shapePath.setAttribute('stroke', 'none');
            this._shapePath.setAttribute('stroke-width', '0');
        }

        if (c.glowEnabled) {
            const radius = BaseWidget.clampNumber(c.glowRadius, 0, null);
            const pad = Math.ceil(radius + 24);
            const filter = this._shapeGlowFilter;
            filter.setAttribute('x', String(-pad));
            filter.setAttribute('y', String(-pad));
            filter.setAttribute('width', String(w + pad * 2));
            filter.setAttribute('height', String(h + pad * 2));
            this._shapeGlowBlur.setAttribute('stdDeviation', String(radius / 2));
            const glowColor = BaseWidget.resolveCssColor(c.glowColor) || '#ffffff';
            const glowOpacity = BaseWidget.clampNumber(c.glowOpacity, 0, 100) / 100;
            this._shapeGlowFlood.setAttribute('flood-color', glowColor);
            this._shapeGlowFlood.setAttribute('flood-opacity', String(glowOpacity));
            this._shapeShadow.setAttribute('d', pathD);
            this._shapeMaskOut.setAttribute('x', String(-pad));
            this._shapeMaskOut.setAttribute('y', String(-pad));
            this._shapeMaskOut.setAttribute('width', String(w + pad * 2));
            this._shapeMaskOut.setAttribute('height', String(h + pad * 2));
            this._shapeMaskOutRect.setAttribute('x', String(-pad));
            this._shapeMaskOutRect.setAttribute('y', String(-pad));
            this._shapeMaskOutRect.setAttribute('width', String(w + pad * 2));
            this._shapeMaskOutRect.setAttribute('height', String(h + pad * 2));
            this._shapeMaskOutPath.setAttribute('d', pathD);
            if (this._shapeShadow.style.display !== '') this._shapeShadow.style.display = '';
        } else if (this._shapeShadow.style.display !== 'none') {
            this._shapeShadow.style.display = 'none';
        }

        // Inner glow mirrors the rect chrome (`inset 0 0 <size>`, see
        // BaseWidget.buildInnerGlowBoxShadow): an edge-centered stroke of size/2
        // blurred with sigma size*0.36 reproduces the same peak (~0.5x color at
        // the edge) and falloff, verified against pixel profiles. Hidden at 0.
        const innerSize = BaseWidget.innerGlowSizeOf(c);
        if (innerSize > 0) {
            const igPad = Math.ceil(innerSize * 2);
            const igFilter = this._shapeInnerGlowFilter;
            igFilter.setAttribute('x', String(-igPad));
            igFilter.setAttribute('y', String(-igPad));
            igFilter.setAttribute('width', String(w + igPad * 2));
            igFilter.setAttribute('height', String(h + igPad * 2));
            this._shapeInnerGlowBlur.setAttribute('stdDeviation', String(innerSize * 0.36));
            this._shapeInnerGlow.setAttribute('d', pathD);
            this._shapeInnerGlow.setAttribute('stroke', this._shapeCssColor(c.innerGlowColor || BaseWidget.INNER_GLOW_DEFAULT_COLOR, c.innerGlowOpacity));
            this._shapeInnerGlow.setAttribute('stroke-width', String(innerSize / 2));
            if (this._shapeInnerGlow.style.display !== '') this._shapeInnerGlow.style.display = '';
        } else if (this._shapeInnerGlow.style.display !== 'none') {
            this._shapeInnerGlow.style.display = 'none';
        }
        if (svg.style.filter) svg.style.filter = 'none';

        if (blurPx > 0) {
            this._ensureShapeBlur();
            const blur = this._shapeBlur;
            const next = 'blur(' + blurPx + 'px)';
            if (blur._dsShapeBlur !== next) {
                blur._dsShapeBlur = next;
                blur.style.setProperty('-webkit-backdrop-filter', next);
                blur.style.setProperty('backdrop-filter', next);
            }
            const maskRef = 'url(#' + ids.mask + ')';
            if (blur._dsShapeMask !== maskRef) {
                blur._dsShapeMask = maskRef;
                blur.style.setProperty('-webkit-mask', maskRef);
                blur.style.setProperty('mask', maskRef);
            }
        } else {
            this._removeShapeBlur();
        }
    }

    _shapeHandlesVisible() {
        if (typeof Dashboard === 'undefined' || !Dashboard.isEditMode || Dashboard._holdLivePreviewActive) return false;
        if (!Dashboard.selectedIds || Dashboard.selectedIds.length !== 1) return false;
        if (Dashboard.selectedIds[0] !== this.id) return false;
        if (typeof Dashboard.isWidgetEffectivelyLocked === 'function' && Dashboard.isWidgetEffectivelyLocked(this.id)) return false;
        return true;
    }

    _placementIsFree() {
        if (typeof BaseWidget.isResponsiveMode !== 'function' || !BaseWidget.isResponsiveMode()) return true;
        if (typeof Dashboard === 'undefined' || typeof Dashboard.getWidgetCompositeContext !== 'function') return false;
        const ctx = Dashboard.getWidgetCompositeContext(this.id);
        return !!(ctx && ctx.open);
    }

    _syncShapeModeClass(on) {
        const wrap = this.elements && this.elements.wrapper;
        const box = this.elements && this.elements.container;
        if (wrap) wrap.classList.toggle('shaped-container-on', !!on);
        if (box) box.classList.toggle('shaped-container-on', !!on);
    }

    _canvasPointScale() {
        const scale = (typeof Dashboard !== 'undefined' && Dashboard._editorZoomScale) ? Dashboard._editorZoomScale : 1;
        return scale > 0 ? scale : 1;
    }

    _shapeMetrics() {
        const o = this.overrides || {};
        const M = (typeof MASTER_SETTINGS !== 'undefined') ? MASTER_SETTINGS : {};
        return {
            x: BaseWidget.toFiniteNumber(o.x, BaseWidget.BASE_LAYOUT.x),
            y: BaseWidget.toFiniteNumber(o.y, BaseWidget.BASE_LAYOUT.y),
            width: BaseWidget.resolveInstanceWidth(o, M),
            height: BaseWidget.resolveInstanceHeight(o, M)
        };
    }

    _snapCanvasPair(x, y) {
        const grid = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.snapToGrid && MASTER_SETTINGS.gridSize)
            ? MASTER_SETTINGS.gridSize : 1;
        const g = grid > 0 ? grid : 1;
        return {
            x: Math.round(x / g) * g,
            y: Math.round(y / g) * g
        };
    }

    _pointerToBoxPoint(clientX, clientY) {
        const el = this.elements && this.elements.container;
        const box = this._shapeMetrics();
        const bw = box.width > 0 ? box.width : 1;
        const bh = box.height > 0 ? box.height : 1;
        if (!el || typeof el.getBoundingClientRect !== 'function') {
            return { x: box.x, y: box.y, fx: 0, fy: 0 };
        }
        const rect = el.getBoundingClientRect();
        const canvas = (typeof document !== 'undefined') ? document.getElementById('dashboard-canvas') : null;
        const host = (canvas && typeof canvas.getBoundingClientRect === 'function')
            ? canvas.getBoundingClientRect() : rect;
        const s = this._canvasPointScale();
        const snapped = this._snapCanvasPair((clientX - host.left) / s, (clientY - host.top) / s);
        const sx = host.left + snapped.x * s;
        const sy = host.top + snapped.y * s;
        const fx = (sx - rect.left) / (rect.width || 1);
        const fy = (sy - rect.top) / (rect.height || 1);
        return { x: box.x + fx * bw, y: box.y + fy * bh, fx: fx, fy: fy };
    }

    _fitCanvasPoints(canvasPts) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < canvasPts.length; i++) {
            const p = canvasPts[i];
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }
        let w = maxX - minX;
        let h = maxY - minY;
        if (!(w > 0)) w = 1;
        if (!(h > 0)) h = 1;
        const pts = new Array(canvasPts.length);
        for (let i = 0; i < canvasPts.length; i++) {
            const p = canvasPts[i];
            const next = { x: (p.x - minX) / w, y: (p.y - minY) / h };
            if (p.radius !== undefined && p.radius !== null && p.radius !== '') next.radius = p.radius;
            pts[i] = next;
        }
        return { x: minX, y: minY, width: w, height: h, shapePoints: pts };
    }

    _canvasPointsFromStored() {
        const box = this._shapeMetrics();
        const bw = box.width > 0 ? box.width : 1;
        const bh = box.height > 0 ? box.height : 1;
        const stored = this._cloneShapePoints(this._storedShapePoints());
        const canvas = new Array(stored.length);
        for (let i = 0; i < stored.length; i++) {
            const p = stored[i];
            canvas[i] = { x: box.x + p.x * bw, y: box.y + p.y * bh, radius: p.radius };
        }
        return canvas;
    }

    _shapeGeometryBag() {
        const box = this._shapeMetrics();
        return {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            shapePoints: this._cloneShapePoints(this._storedShapePoints())
        };
    }

    _normalizeStoredShapeBounds() {
        if (this._shapeDragLive || !this._placementIsFree()) return false;
        const stored = this._cloneShapePoints(this._storedShapePoints());
        if (stored.length < 3) return false;
        let minFx = Infinity;
        let minFy = Infinity;
        let maxFx = -Infinity;
        let maxFy = -Infinity;
        for (let i = 0; i < stored.length; i++) {
            const p = stored[i];
            if (p.x < minFx) minFx = p.x;
            if (p.y < minFy) minFy = p.y;
            if (p.x > maxFx) maxFx = p.x;
            if (p.y > maxFy) maxFy = p.y;
        }
        const eps = 0.0001;
        const hugs = minFx >= -eps && minFy >= -eps && maxFx <= 1 + eps && maxFy <= 1 + eps
            && minFx <= eps && minFy <= eps && maxFx >= 1 - eps && maxFy >= 1 - eps;
        if (hugs) return false;
        const box = this._shapeMetrics();
        const fit = this._fitCanvasPoints(this._canvasPointsFromStored());
        if (Math.abs(fit.x - box.x) < 0.05 && Math.abs(fit.y - box.y) < 0.05
            && Math.abs(fit.width - box.width) < 0.05 && Math.abs(fit.height - box.height) < 0.05) {
            return false;
        }
        this.overrides = Object.assign({}, this.overrides, {
            x: fit.x,
            y: fit.y,
            width: fit.width,
            height: fit.height,
            shapePoints: fit.shapePoints
        });
        this._widgetConfigEpoch += 1;
        return true;
    }

    _writeShapePoints(pts) {
        this.overrides = Object.assign({}, this.overrides, { shapePoints: pts });
        this._widgetConfigEpoch += 1;
        this.render();
    }

    _writeShapeGeometry(fit) {
        this.overrides = Object.assign({}, this.overrides, {
            x: fit.x,
            y: fit.y,
            width: fit.width,
            height: fit.height,
            shapePoints: fit.shapePoints
        });
        this._widgetConfigEpoch += 1;
        this.render();
    }

    _setupShapeHandleDrag(handle, index) {
        if (typeof PointerDrag === 'undefined') return;
        if (handle._shapeDrag && typeof handle._shapeDrag.destroy === 'function') {
            handle._shapeDrag.destroy();
        }
        const self = this;
        handle._shapeDrag = PointerDrag.bind(handle, {
            raf: false,
            shouldStart: function () {
                return !!(typeof Dashboard !== 'undefined' && Dashboard.isEditMode);
            },
            onDown: function () {
                self._shapeDragLive = true;
                self._setShapeActiveIndex(index);
                if (typeof Dashboard !== 'undefined' && typeof Dashboard.selectWidget === 'function') {
                    Dashboard.selectWidget(self.id, false, true);
                }
                if (typeof Dashboard !== 'undefined' && typeof Dashboard._beginEditPointerGesture === 'function') {
                    Dashboard._beginEditPointerGesture();
                }
                return {
                    didGeometryChange: false,
                    beforeBag: self._shapeGeometryBag(),
                    canvasPts: self._canvasPointsFromStored()
                };
            },
            onMove: function (em, ctx) {
                if (!ctx) return;
                const hit = self._pointerToBoxPoint(em.clientX, em.clientY);
                if (self._placementIsFree()) {
                    if (!ctx.canvasPts || !ctx.canvasPts[index]) return;
                    if (ctx.canvasPts[index].x === hit.x && ctx.canvasPts[index].y === hit.y) return;
                    ctx.didGeometryChange = true;
                    ctx.canvasPts[index].x = hit.x;
                    ctx.canvasPts[index].y = hit.y;
                    self._writeShapeGeometry(self._fitCanvasPoints(ctx.canvasPts));
                } else {
                    const pts = self._cloneShapePoints(self._storedShapePoints());
                    if (!pts[index]) return;
                    if (pts[index].x === hit.fx && pts[index].y === hit.fy) return;
                    ctx.didGeometryChange = true;
                    pts[index].x = hit.fx;
                    pts[index].y = hit.fy;
                    self._writeShapePoints(pts);
                }
            },
            onUp: function (ev, ctx) {
                self._shapeDragLive = false;
                if (typeof Dashboard !== 'undefined' && typeof Dashboard._endEditPointerGesture === 'function') {
                    Dashboard._endEditPointerGesture();
                }
                self._setShapeActiveIndex(index);
                if (!ctx || !ctx.didGeometryChange) return;
                if (typeof Dashboard !== 'undefined' && Dashboard.markUnsaved) Dashboard.markUnsaved();
                if (typeof Dashboard !== 'undefined' && Dashboard._recordHistoryEntry) {
                    const afterBag = self._shapeGeometryBag();
                    if (!Dashboard._isEqualJson(ctx.beforeBag, afterBag)) {
                        Dashboard._recordHistoryEntry({
                            kind: 'widget-overrides',
                            id: self.id,
                            replace: false,
                            before: ctx.beforeBag,
                            after: afterBag
                        });
                    }
                }
                if (typeof Editor !== 'undefined' && typeof Editor.notifyExternalWidgetChange === 'function') {
                    Editor.notifyExternalWidgetChange(self.id, true);
                }
            }
        });
    }

    _syncShapeHandles(points) {
        const layer = this._shapeHandleLayer;
        if (!layer) return;
        const show = this._shapeHandlesVisible();
        if (!show) {
            if (layer.childElementCount) {
                this._releaseShapeHandleDrags();
                layer.innerHTML = '';
            }
            if (layer.style.display !== 'none') layer.style.display = 'none';
            return;
        }
        if (layer.style.display !== '') layer.style.display = '';
        const kids = layer.children;
        while (kids.length > points.length) {
            const gone = kids[kids.length - 1];
            if (gone._shapeDrag && typeof gone._shapeDrag.destroy === 'function') gone._shapeDrag.destroy();
            layer.removeChild(gone);
        }
        while (kids.length < points.length) {
            const h = document.createElement('div');
            h.className = 'arrow-handle';
            h.style.position = 'absolute';
            h.style.width = '14px';
            h.style.height = '14px';
            h.style.marginLeft = '-7px';
            h.style.marginTop = '-7px';
            h.style.borderRadius = '50%';
            h.style.background = '#22d3ee';
            h.style.border = '2px solid #ffffff';
            h.style.boxSizing = 'border-box';
            h.style.pointerEvents = 'auto';
            h.style.touchAction = 'none';
            h.style.cursor = 'crosshair';
            layer.appendChild(h);
        }
        for (let i = 0; i < points.length; i++) {
            const h = kids[i];
            h.style.left = (points[i].x * 100) + '%';
            h.style.top = (points[i].y * 100) + '%';
            const boundKey = String(i) + '_' + points.length;
            if (h.getAttribute('data-bound-key') !== boundKey) {
                h.setAttribute('data-bound-key', boundKey);
                this._setupShapeHandleDrag(h, i);
            }
        }
        this._paintActiveShapeHandles();
    }

    _paintActiveShapeHandles() {
        const layer = this._shapeHandleLayer;
        if (!layer) return;
        const active = this._shapeActiveIndex;
        const kids = layer.children;
        for (let i = 0; i < kids.length; i++) {
            const h = kids[i];
            const on = i === active;
            h.style.width = on ? '18px' : '14px';
            h.style.height = on ? '18px' : '14px';
            h.style.marginLeft = on ? '-9px' : '-7px';
            h.style.marginTop = on ? '-9px' : '-7px';
            h.style.background = on ? '#ffffff' : '#22d3ee';
            h.style.boxShadow = on ? '0 0 0 3px #22d3ee' : 'none';
            h.style.zIndex = on ? '2' : '1';
        }
    }

    _setShapeActiveIndex(index) {
        const n = parseInt(index, 10);
        this._shapeActiveIndex = isNaN(n) ? -1 : n;
        this._paintActiveShapeHandles();
        this._markActiveShapeRow();
    }

    _markActiveShapeRow() {
        if (typeof document === 'undefined') return;
        if (typeof Editor === 'undefined' || Editor.currentId !== this.id) return;
        const rows = document.querySelectorAll('[data-shape-point]');
        const active = String(this._shapeActiveIndex);
        for (let i = 0; i < rows.length; i++) {
            rows[i].classList.toggle('shape-point-active', rows[i].getAttribute('data-shape-point') === active);
        }
    }

    _editorAccent() {
        let accent = '#06b6d4';
        if (typeof getComputedStyle === 'function' && document.documentElement) {
            const v = getComputedStyle(document.documentElement).getPropertyValue('--ui-accent');
            if (v && String(v).trim()) accent = String(v).trim();
        }
        return accent;
    }

    _syncEditOutline(pathD) {
        const path = this._shapeEditPath;
        if (!path) return;
        const editing = typeof Dashboard !== 'undefined'
            && !!Dashboard.isEditMode
            && !Dashboard._holdLivePreviewActive;
        const selected = editing && Dashboard.selectedIds && Dashboard.selectedIds.indexOf(this.id) !== -1;
        if (!selected) {
            if (path.style.display !== 'none') path.style.display = 'none';
            return;
        }
        if (path.style.display !== '') path.style.display = '';
        path.setAttribute('d', pathD || '');
        path.setAttribute('stroke', this._editorAccent());
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.style.filter = 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.45))';
        if (Dashboard.selectedIds.length > 1) path.setAttribute('stroke-dasharray', '6 4');
        else path.removeAttribute('stroke-dasharray');
    }

    _renderedShapeSize(c) {
        const el = this.elements && this.elements.container;
        let w = BaseWidget.clampNumber(c.width, 1, null);
        let h = BaseWidget.clampNumber(c.height, 1, null);
        if (el && el.offsetWidth > 1 && el.offsetHeight > 1) {
            w = el.offsetWidth;
            h = el.offsetHeight;
        }
        return { width: w, height: h };
    }

    _syncShapeHandleChrome() {
        if (!this._isCustomShapeOn()) return;
        if (!this._shapeHandleLayer && !this._shapeHandlesVisible()) return;
        const pts = this._resolvedShapePoints();
        if (!this._shapeHandleLayer) this._ensureShapeDom();
        this._syncShapeHandles(pts);
        if (this._shapePath) this._syncEditOutline(this._shapePath.getAttribute('d') || '');
    }

    _syncCustomShape(c) {
        this._ensureShapeDom();
        this._clearRectChrome();
        const pts = this._resolvedShapePoints();
        const size = this._renderedShapeSize(c);
        const w = size.width;
        const h = size.height;
        const local = new Array(pts.length);
        for (let i = 0; i < pts.length; i++) {
            local[i] = { x: pts[i].x * w, y: pts[i].y * h, radius: pts[i].radius };
        }
        const pathD = ShapedContainerWidget.buildClosedRoundedPath(local, c.cornerRadius);
        const blurPx = this._shapeBlurPx(c);
        let themeSig = '';
        if (typeof BaseWidget.getThemeColorsSignature === 'function') themeSig = BaseWidget.getThemeColorsSignature();
        const sig = w + '|' + h + '|' + (c.bgVisible ? 1 : 0) + '|' + pathD + '|' + blurPx + '|' +
            c.bgAngle + '|' + c.bgColStart + '|' + c.bgOpacityStart + '|' + c.bgColEnd + '|' + c.bgOpacityEnd + '|' +
            c.borderWidth + '|' + c.borderColor + '|' + c.borderOpacity + '|' +
            (c.glowEnabled ? 1 : 0) + '|' + c.glowColor + '|' + c.glowOpacity + '|' + c.glowRadius + '|' +
            BaseWidget.innerGlowSizeOf(c) + '|' + c.innerGlowColor + '|' + c.innerGlowOpacity + '|' + themeSig;
        if (sig !== this._shapeSig) {
            this._shapeSig = sig;
            this._paintShape(c, pathD, blurPx);
        }
        this._syncEditOutline(pathD);
        this._syncShapeHandles(pts);
    }

    _scheduleShapeInspectorRefresh() {
        if (this._shapeDragLive) return;
        if (typeof Editor === 'undefined' || Editor.currentId !== this.id) return;
        if (typeof Editor.notifyExternalWidgetChange !== 'function') return;
        Editor.notifyExternalWidgetChange(this.id, true);
    }

    _renderSpecific() {
        ContainerWidget.prototype._renderSpecific.call(this);
        const on = this._isCustomShapeOn();
        this._syncShapeModeClass(on);
        if (!on) {
            this._teardownCustomShape();
            return;
        }
        if (this._normalizeStoredShapeBounds()) {
            this._applyWrapperAndContainerGeometry();
            this._syncCustomShape(this.config);
            this._scheduleShapeInspectorRefresh();
            return;
        }
        this._syncCustomShape(this.config);
    }

    _syncEditModeVisuals() {
        BaseWidget.prototype._syncEditModeVisuals.call(this);
        this._syncShapeHandleChrome();
    }

    select() {
        BaseWidget.prototype.select.call(this);
        this._syncShapeHandleChrome();
    }

    deselect() {
        BaseWidget.prototype.deselect.call(this);
        this._syncShapeHandleChrome();
    }
}

WidgetRegistry.register('empty', ShapedContainerWidget);

