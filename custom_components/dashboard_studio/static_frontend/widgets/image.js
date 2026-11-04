class ImageWidget extends BaseWidget {
    static get metadata() {
        return { label: "Image", shortName: "Image", icon: "ph-image", category: "Graphics", color_dark: "hsl(30, 80%, 65%)", color_light: "hsl(30, 85%, 35%)", version: "2.3.3", date: "2026-11-04" };
    }

    static get IMAGE_LABEL_LEGACY_TYPO_KEYS() {
        return ['labelFont', 'labelFs', 'labelCol', 'labelCase', 'labelBold', 'labelAlign', 'labelItalic', 'labelOffX', 'labelOffY'];
    }

    static applyTypographyNestedToConfig(c) {
        BaseWidget.applyTypographyNestedToConfig(c, [
            ['widgetLabel', 'label']
        ]);
    }

    static getNestedBindingOverlaySpec() {
        return BaseWidget.buildTypographyBindingOverlaySpec([['widgetLabel', 'label']]);
    }

    static fillImageTypographyResolved(c, M) {
        BaseWidget.fillWidgetLabelTypographyResolved(c, M, 'label');
    }

    // --- Global Configuration Injection ---
    static get globalSettings() {
        return {
            defaultImageFit: true,
            defaultImageProp: true,
            defaultImageScale: 100,
            defaultImageOpacity: 100,
            defaultImageFallbackUrl: 'images/brokenlink.png'
        };
    }

    // --- Global Editor Schema ---
    static get globalSchema() {
        return [
            { key: 'defaultImageFit', type: 'checkbox', label: 'Default Fit', cols: 6 },
            {
                key: 'defaultImageProp', type: 'checkbox', label: 'Default Proportional', cols: 6,
                condition: (v) => ImageWidget._fitContainerEnabled(v, true),
                dependsOn: ['defaultImageFit']
            },
            {
                key: 'defaultImageScale', type: 'number', label: 'Default Scale %', cols: 6,
                condition: (v) => !ImageWidget._fitContainerEnabled(v, true),
                dependsOn: ['defaultImageFit']
            },
            { key: 'defaultImageOpacity', type: 'number', min: 0, max: 100, label: 'Default Opacity', cols: 6 },
            { key: 'defaultImageFallbackUrl', type: 'text', label: 'Fallback URL', cols: 12, imagePicker: true }
        ];
    }

    static get basicSettingKeys() {
        return [
            'url',
            { key: 'fit', cols: 6 },
            { key: 'proportional', cols: 6 },
            { key: 'scale', cols: 6 }
        ];
    }

    /** Fit Container on (instance `fit` / master `defaultImageFit`). Unset matches the master default (on). */
    static _fitContainerEnabled(values, isGlobal) {
        if (!values || typeof values !== 'object') return true;
        if (isGlobal) {
            if (values.defaultImageFit === false) return false;
            return true;
        }
        if (values.fit === false) return false;
        if (values.fit === true) return true;
        if (values.defaultImageFit === false) return false;
        return true;
    }

    static _resolveEffectiveFallbackUrl(o, masterFallback) {
        if (!o || typeof o !== 'object') return '';
        const primary = typeof o.url === 'string' ? o.url.trim() : '';
        let fb;
        if (Object.prototype.hasOwnProperty.call(o, 'fallbackUrl')) {
            fb = o.fallbackUrl == null ? '' : String(o.fallbackUrl).trim();
        } else {
            const master = masterFallback != null
                ? masterFallback
                : (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultImageFallbackUrl != null
                    ? MASTER_SETTINGS.defaultImageFallbackUrl
                    : __nullish(o.defaultImageFallbackUrl, 'images/brokenlink.png'));
            fb = String(master).trim();
        }
        if (!fb || fb === primary) return '';
        return fb;
    }

    static extractPreloadImageUrls(o) {
        if (!o || typeof o !== 'object') return [];
        const st = o.sourceType || 'url';
        if (st !== 'url') return [];
        const urls = [];
        const u = typeof o.url === 'string' ? o.url.trim() : '';
        if (u) urls.push(u);
        const fb = ImageWidget._resolveEffectiveFallbackUrl(o);
        if (fb && fb !== u) urls.push(fb);
        return urls;
    }

    static _refreshIntervalSeconds(c) {
        if (!c) return 1;
        const v = c.refreshInterval != null ? c.refreshInterval : 1;
        return c.intervalUnit === 'minutes' ? v * 60 : v;
    }

    static _maxAnimationDurationSeconds(c) {
        return Math.max(0.1, ImageWidget._refreshIntervalSeconds(c) - 0.1);
    }

    /** Signature of settings that affect the live-refresh timer (not layout/label). */
    static _liveRefreshConfigSignature(c) {
        if (!c || c.liveRefresh !== true || (c.sourceType || 'url') !== 'url') return '';
        return [
            c.url || '',
            c.refreshInterval,
            c.intervalUnit || 'seconds'
        ].join('\x1e');
    }

    static _buildSvgHtml(svgRaw) {
        if (!svgRaw) return '';
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgRaw, 'image/svg+xml');
        const scripts = doc.getElementsByTagName('script');
        for (let i = scripts.length - 1; i >= 0; i--) {
            scripts[i].parentNode.removeChild(scripts[i]);
        }
        return doc.documentElement.outerHTML;
    }

    static getAnimationSchemaGroup(c) {
        if (typeof WidgetAnimations === 'undefined' || !WidgetAnimations.getSchemaGroup) {
            return { id: 'img_anim_content', title: 'Animations & Effects', icon: 'ph-sparkle', fields: [] };
        }
        const opts = {
            slot: 'content',
            groupId: 'img_anim_content',
            allowed: { categories: ['content-swap'] },
            durationDefault: 1.0,
            durationMin: 0.1,
            durationStep: 0.1,
            durationDependsOn: ['liveRefresh', 'refreshInterval', 'intervalUnit', 'sourceType']
        };
        if (c && c.liveRefresh === true) {
            opts.durationMax = ImageWidget._maxAnimationDurationSeconds(c);
        }
        return WidgetAnimations.getSchemaGroup(opts);
    }

    getDefaultOverrides() {
        return {
            sourceType: "url",
            url: "images/placeholder.jpg",
            svgRaw: "",
            moveX: 0,
            moveY: 0,
            label: "",
            typography: { widgetLabel: {} },
            liveRefresh: false,
            refreshInterval: 1,
            intervalUnit: "seconds"
        };
    }

    get config() {
        const c = super.config;
        ImageWidget.applyTypographyNestedToConfig(c);
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        ImageWidget.fillImageTypographyResolved(c, M);
        BaseWidget.applyNestedBindingOverlay(this, c, ImageWidget.getNestedBindingOverlaySpec());
        const getNum = (val, def) => (val !== null && val !== undefined && val !== "") ? val : def;
        const out = {
            ...c,
            sourceType: c.sourceType || "url",
            url: c.url !== undefined ? c.url : "images/placeholder.jpg",
            fallbackUrl: Object.prototype.hasOwnProperty.call(this.overrides, 'fallbackUrl')
                ? (this.overrides.fallbackUrl == null ? '' : String(this.overrides.fallbackUrl).trim())
                : String(__nullish(c.defaultImageFallbackUrl, 'images/brokenlink.png')).trim(),
            svgRaw: c.svgRaw || "",
            fit: c.fit !== undefined && c.fit !== null ? c.fit : c.defaultImageFit,
            proportional: c.proportional !== undefined && c.proportional !== null ? c.proportional : c.defaultImageProp,
            scale: c.scale !== undefined && c.scale !== null ? c.scale : (c.defaultImageScale || 100),
            opacity: c.opacity !== undefined && c.opacity !== null ? c.opacity : (c.defaultImageOpacity || 100),

            liveRefresh: c.liveRefresh !== undefined && c.liveRefresh !== null ? c.liveRefresh : false,
            refreshInterval: c.refreshInterval !== undefined && c.refreshInterval !== null ? c.refreshInterval : 1,
            intervalUnit: c.intervalUnit || "seconds",

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
        if (typeof WidgetAnimations !== 'undefined' && WidgetAnimations.normalizeConfig) {
            WidgetAnimations.normalizeConfig(out, 'content');
        }
        if (out.liveRefresh === true) {
            const maxDur = ImageWidget._maxAnimationDurationSeconds(out);
            if (out.contentAnimationDuration > maxDur) {
                out.contentAnimationDuration = maxDur;
            }
        }
        return out;
    }

    getSchema() {
        const c = this.config;
        return [
            {
                id: 'img_data', title: 'Data & Source', icon: 'ph-image',
                fields: [
                    {
                        key: 'sourceType', type: 'select', label: 'Source Type', cols: 12,
                        options: [
                            { value: 'url', text: 'URL' },
                            { value: 'svg', text: 'Animated Vector Graphic (SVG)' }
                        ]
                    },
                    { key: 'url', type: 'text', label: 'URL', cols: 12, imagePicker: true, condition: (v) => (v.sourceType || 'url') === 'url', dependsOn: ['sourceType'] },
                    { key: 'fallbackUrl', type: 'text', label: 'Fallback URL', cols: 12, imagePicker: true, condition: (v) => (v.sourceType || 'url') === 'url', dependsOn: ['sourceType'], defaultKey: 'defaultImageFallbackUrl' },
                    { key: 'svgRaw', type: 'textarea', label: 'Raw SVG Code', cols: 12, condition: (v) => v.sourceType === 'svg', dependsOn: ['sourceType'] },
                    { key: 'opacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 12, defaultKey: 'defaultImageOpacity' },
                    { key: 'liveRefresh', type: 'checkbox', label: 'Enable Live Refresh', cols: 4 },
                    { key: 'refreshInterval', type: 'number', label: 'Refresh Interval', cols: 4, min: 0.2, step: 0.1, condition: (v) => v.liveRefresh === true, dependsOn: ['liveRefresh'] },
                    {
                        key: 'intervalUnit', type: 'select', label: 'Interval Unit', cols: 4,
                        options: [
                            { value: 'seconds', text: 'Seconds' },
                            { value: 'minutes', text: 'Minutes' }
                        ],
                        condition: (v) => v.liveRefresh === true,
                        dependsOn: ['liveRefresh']
                    }
                ]
            },
            ImageWidget.getAnimationSchemaGroup(c),
            {
                id: 'img_layout', title: 'Appearance', icon: 'ph-palette',
                fields: [
                    { key: 'fit', type: 'checkbox', label: 'Fit Container', cols: 6, defaultKey: 'defaultImageFit' },
                    {
                        key: 'proportional', type: 'checkbox', label: 'Proportional', cols: 6, defaultKey: 'defaultImageProp',
                        condition: (v, isGlobal) => ImageWidget._fitContainerEnabled(v, isGlobal),
                        dependsOn: ['fit']
                    },
                    {
                        key: 'scale', type: 'number', label: 'Scale %', cols: 6, defaultKey: 'defaultImageScale',
                        condition: (v, isGlobal) => !ImageWidget._fitContainerEnabled(v, isGlobal),
                        dependsOn: ['fit']
                    },
                    { key: 'moveX', type: 'number', label: 'Move X', cols: 6 },
                    { key: 'moveY', type: 'number', label: 'Move Y', cols: 6 },
                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }
                ]
            },
            {
                id: 'img_label', title: 'Text & Typography', icon: 'ph-text-t',
                fields: [
                    { key: 'label', type: 'text', label: 'Widget Label', cols: 12 },
                    BaseWidget.getWidgetLabelTypographySchema('label', 'widgetLabel')
                ]
            }
        ];
    }

    getAnimationSlot(slot) {
        if (slot !== 'content') return null;
        if (!this.e || !this.e.imgWrap) return null;
        const c = this.config;
        const isUrl = (c.sourceType || 'url') === 'url';
        const slotSpec = {
            animation: c.contentAnimation,
            duration: c.contentAnimationDuration,
            allowed: { categories: ['content-swap'] }
        };
        if (isUrl) {
            if (!this.e.imgInner) return null;
            return {
                host: this.e.imgWrap,
                target: this.e.imgInner,
                ...slotSpec
            };
        }
        if (!this.e.svgContainer || !this.e.svgInner) return null;
        return {
            host: this.e.svgContainer,
            target: this.e.svgInner,
            ...slotSpec
        };
    }

    _buildBaseDOM() {
        const b = super._buildBaseDOM();

        b.innerContent.style.display = 'flex';
        b.innerContent.style.flexDirection = 'column';

        const lbl = document.createElement('div');
        lbl.className = 'widget-label';
        lbl.style.width = '100%';
        lbl.style.marginBottom = '8px';
        lbl.style.letterSpacing = '1px';
        lbl.style.flexShrink = '0';
        lbl.style.position = 'relative';
        lbl.style.zIndex = '10';
        b.innerContent.appendChild(lbl);
        this.lblEl = lbl;

        const imgWrap = document.createElement("d\u0069v");
        imgWrap.style.flex = '1';
        imgWrap.style.width = '100%';
        imgWrap.style.position = 'relative';
        imgWrap.style.overflow = 'hidden';
        imgWrap.style.display = 'flex';
        imgWrap.style.alignItems = 'stretch';
        imgWrap.style.justifyContent = 'center';
        imgWrap.style.minHeight = '0';
        imgWrap.setAttribute('data-wa-align', 'middle');

        const imgInner = document.createElement("d\u0069v");
        imgInner.style.position = 'relative';
        imgInner.style.width = '100%';
        imgInner.style.height = '100%';
        imgInner.style.minHeight = '0';
        imgInner.style.flex = '1 1 auto';

        const img = document.createElement('img');
        img.style.display = 'block';
        img.ondragstart = (e) => e.preventDefault();

        const svgContainer = document.createElement("d\u0069v");
        svgContainer.style.display = 'none';
        svgContainer.style.flex = '1 1 auto';
        svgContainer.style.width = '100%';
        svgContainer.style.height = '100%';
        svgContainer.style.minHeight = '0';
        svgContainer.style.position = 'relative';
        svgContainer.style.overflow = 'hidden';
        svgContainer.style.alignItems = 'center';
        svgContainer.style.justifyContent = 'center';
        svgContainer.setAttribute('data-wa-align', 'middle');

        const svgInner = document.createElement("d\u0069v");
        svgInner.style.position = 'relative';
        svgInner.style.width = '100%';
        svgInner.style.height = '100%';
        svgInner.style.minHeight = '0';

        img.onerror = () => {
            this._handlePrimaryImageError();
        };
        img.onload = () => {
            this._handlePrimaryImageLoad();
        };

        imgInner.appendChild(img);
        imgWrap.appendChild(imgInner);
        svgContainer.appendChild(svgInner);
        imgWrap.appendChild(svgContainer);
        b.innerContent.appendChild(imgWrap);

        this.e = { img, imgInner, svgInner, svgContainer, imgWrap };
        this._refreshTimer = null;
        this._refreshTimerNative = false;
        this._cachedLiveRefreshSig = undefined;
        this._lastUrlImageLoadAt = undefined;
        this._lastAppliedUrl = undefined;
        this._lastAppliedSvgRaw = undefined;
        this._cachedSourceType = undefined;
        this._pendingProbe = null;
        this._hasPaintedContent = false;
        this._showingFallback = false;
        this._cachedFallbackUrl = undefined;
        this._activeBlobUrl = null;
        this._pendingBlobUrl = null;
        this._retiringBlobUrl = null;
        this._retiringBlobTimer = null;
        this._activeSwapProbe = null;
        this._refreshAbortController = null;
        this._refreshInFlight = false;
        this._refreshInFlightTimer = null;
        this._loadedSourceUrl = undefined;
        this._cachedSourceUrl = undefined;
        this._noCorsUrl = null;
        this._blobLoadGen = 0;
        this._directStreamUrl = null;
        this._refreshSeq = 0;

        return b;
    }

    _revokeBlobUrlSafe(url) {
        if (!url || typeof url !== 'string' || url.indexOf('blob:') !== 0) return;
        if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
            try {
                URL.revokeObjectURL(url);
            } catch (_e) { /* ignore */ }
        }
    }

    _clearRetiringBlob() {
        if (this._retiringBlobTimer) {
            clearTimeout(this._retiringBlobTimer);
            this._retiringBlobTimer = null;
        }
        if (this._retiringBlobUrl) {
            const u = this._retiringBlobUrl;
            this._retiringBlobUrl = null;
            if (u !== this._activeBlobUrl && u !== this._pendingBlobUrl) {
                this._revokeBlobUrlSafe(u);
            }
        }
    }

    _clearRefreshInFlight() {
        this._refreshInFlight = false;
        if (this._refreshInFlightTimer) {
            clearTimeout(this._refreshInFlightTimer);
            this._refreshInFlightTimer = null;
        }
        if (this._refreshAbortController) {
            try {
                this._refreshAbortController.abort();
            } catch (_e) { /* ignore */ }
            this._refreshAbortController = null;
        }
    }

    _releaseAllBlobs() {
        this._clearRetiringBlob();
        this._activeSwapProbe = null;
        if (this._pendingBlobUrl) {
            const p = this._pendingBlobUrl;
            this._pendingBlobUrl = null;
            this._revokeBlobUrlSafe(p);
        }
        if (this._activeBlobUrl) {
            const a = this._activeBlobUrl;
            this._activeBlobUrl = null;
            this._revokeBlobUrlSafe(a);
        }
    }

    _resolveFallbackUrl() {
        return ImageWidget._resolveEffectiveFallbackUrl(this.overrides);
    }

    _markImageRole(role) {
        if (!this.e || !this.e.img) return;
        if (!role || role === 'none') {
            this.e.img.removeAttribute('data-ds-img-role');
        } else {
            this.e.img.setAttribute('data-ds-img-role', role);
        }
    }

    _setImageVisible(visible) {
        const img = this.e && this.e.img;
        if (!img) return;
        if (visible) {
            img.style.visibility = '';
            if ((this.config.sourceType || 'url') === 'url') {
                img.style.display = 'block';
            }
        } else {
            img.style.visibility = 'hidden';
        }
    }

    _handlePrimaryImageError() {
        this._clearRefreshInFlight();
        if (this._pendingBlobUrl) {
            const p = this._pendingBlobUrl;
            this._pendingBlobUrl = null;
            if (p !== this._activeBlobUrl) this._revokeBlobUrlSafe(p);
        }
        if (!this.e || !this.e.img || !this.e.img.hasAttribute('src')) return;
        const role = this.e.img.getAttribute('data-ds-img-role');
        if (role === 'fallback') {
            this._setImageVisible(false);
            this._markImageRole('none');
            this._showingFallback = false;
            this._requestResponsiveReflowAfterContentChange();
            return;
        }

        const fallback = this._resolveFallbackUrl();
        if (!fallback) {
            this._setImageVisible(false);
            this._markImageRole('none');
            this._showingFallback = false;
            this._requestResponsiveReflowAfterContentChange();
            return;
        }

        this._showingFallback = true;
        this._markImageRole('fallback');
        this._setImageVisible(false);
        this.e.img.src = fallback;
    }

    _handlePrimaryImageLoad() {
        if (!this._activeSwapProbe) {
            this._lastUrlImageLoadAt = Date.now();
            this._clearRefreshInFlight();
        }
        const currentSrc = (this.e && this.e.img && this.e.img.getAttribute('src')) || '';
        if (this._activeBlobUrl && this._activeBlobUrl !== currentSrc && this._activeBlobUrl !== this._retiringBlobUrl) {
            this._revokeBlobUrlSafe(this._activeBlobUrl);
        }
        if (currentSrc.indexOf('blob:') === 0) {
            this._activeBlobUrl = currentSrc;
            if (this._pendingBlobUrl === currentSrc) {
                this._pendingBlobUrl = null;
            }
        } else {
            this._activeBlobUrl = null;
        }
        const role = this.e.img.getAttribute('data-ds-img-role');
        this._setImageVisible(true);
        if (role === 'primary' || !role) {
            this._showingFallback = false;
        }
        // The image's intrinsic dimensions are only known once it loads. The Responsive
        // Columns masonry span was measured before load (container collapsed), so reflow
        // now or the widget keeps the wrong height until a viewport resize.
        this._requestResponsiveReflowAfterContentChange();
    }

    _requestResponsiveReflowAfterContentChange() {
        if (typeof BaseWidget !== 'undefined' && typeof BaseWidget.isResponsiveMode === 'function'
            && BaseWidget.isResponsiveMode() && typeof Dashboard !== 'undefined'
            && typeof Dashboard._requestResponsiveReflow === 'function') {
            Dashboard._requestResponsiveReflow(this.id);
        }
    }

    _preparePrimaryImageLoad() {
        this._showingFallback = false;
        this._markImageRole('primary');
    }

    _isWidgetVisible(c) {
        if (!this.elements || !this.elements.wrapper || this.elements.wrapper.style.display === 'none') return false;
        const cfg = c || this.config;
        return cfg.visible !== false;
    }

    _liveRefreshEligible(c) {
        if (!c || c.liveRefresh !== true || (c.sourceType || 'url') !== 'url') return false;
        if (typeof Dashboard !== 'undefined' && Dashboard.isEditMode) return false;
        if (!this._isWidgetVisible(c)) return false;
        const url = typeof c.url === 'string' ? c.url.trim() : '';
        return url.length > 0;
    }

    _getImageRefreshIntervalMs(c) {
        const rawMs = c.intervalUnit === 'minutes'
            ? c.refreshInterval * 60000
            : c.refreshInterval * 1000;
        return Math.max(200, rawMs);
    }

    _stopLiveRefreshTimer() {
        this._clearRefreshInFlight();
        const handle = this._refreshTimer;
        if (!handle) return;
        if (this._refreshTimerNative) {
            clearInterval(handle);
        } else if (typeof WorkerTimer !== 'undefined' && WorkerTimer.clearInterval) {
            WorkerTimer.clearInterval(handle);
        } else {
            clearInterval(handle);
        }
        this._refreshTimer = null;
        this._refreshTimerNative = false;
    }

    _startLiveRefreshTimer(intervalMs) {
        this._stopLiveRefreshTimer();
        const tick = () => {
            try {
                this._doRefresh();
            } catch (err) {
                console.error('[ImageWidget] Live refresh tick failed:', err);
            }
        };
        if (typeof WorkerTimer !== 'undefined' && WorkerTimer.setInterval) {
            this._refreshTimer = WorkerTimer.setInterval(tick, intervalMs);
            this._refreshTimerNative = false;
        } else {
            this._refreshTimer = setInterval(tick, intervalMs);
            this._refreshTimerNative = true;
        }
    }

    /**
     * Start/stop/restart live refresh only when timer-relevant config changes.
     * Avoids resetting the interval on cosmetic renders (editor sliders, MQTT repaints).
     */
    _syncLiveRefreshTimer(c) {
        const sig = ImageWidget._liveRefreshConfigSignature(c);
        if (!this._liveRefreshEligible(c)) {
            this._stopLiveRefreshTimer();
            this._cachedLiveRefreshSig = sig;
            return;
        }

        const sigChanged = this._cachedLiveRefreshSig !== sig;
        const needsStart = !this._refreshTimer;
        if (!sigChanged && !needsStart) return;

        if (sigChanged || needsStart) {
            this._lastUrlImageLoadAt = undefined;
            this._directStreamUrl = null;
            this._clearRefreshInFlight();
        }
        this._cachedLiveRefreshSig = sig;
        this._startLiveRefreshTimer(this._getImageRefreshIntervalMs(c));
        this._doRefresh();
    }

    _syncEditModeVisuals(resolved) {
        const c = resolved || this.config;
        super._syncEditModeVisuals(c);
        this._syncLiveRefreshTimer(c);
    }

    _shouldAnimateContent() {
        const c = this.config;
        if (typeof Dashboard !== 'undefined' && Dashboard.isEditMode) return false;
        if (!this._hasPaintedContent) return false;
        const anim = c.contentAnimation;
        if (!anim || anim === 'none') return false;
        return typeof WidgetAnimations !== 'undefined' && typeof WidgetAnimations.swap === 'function';
    }

    _cancelContentSwap() {
        if (typeof WidgetAnimations !== 'undefined' && typeof WidgetAnimations.cancelTargetSwap === 'function') {
            if (this.e.imgInner) WidgetAnimations.cancelTargetSwap(this.e.imgInner);
            if (this.e.svgInner) WidgetAnimations.cancelTargetSwap(this.e.svgInner);
        }
        this._activeSwapProbe = null;
        this._clearRetiringBlob();
    }

    _maybeAnimatedSetSrc(src) {
        if (!this._shouldAnimateContent() || (this.config.sourceType || 'url') !== 'url') {
            this._preparePrimaryImageLoad();
            this._lastAppliedUrl = src;
            this.e.img.src = src;
            return;
        }
        this._animateUrlSwap(src);
    }

    _animateUrlSwap(newSrc) {
        const slot = this.getAnimationSlot('content');
        if (!slot || !slot.target) {
            this._preparePrimaryImageLoad();
            this._lastAppliedUrl = newSrc;
            this.e.img.src = newSrc;
            return;
        }

        if (this._pendingProbe) {
            this._pendingProbe.onload = null;
            this._pendingProbe.onerror = null;
            this._pendingProbe.src = '';
            this._pendingProbe = null;
        }

        const probe = new Image();
        const widget = this;
        this._pendingProbe = probe;

        const commitSwap = function () {
            if (widget._pendingProbe !== probe) {
                probe.onload = null;
                probe.onerror = null;
                probe.src = '';
                return;
            }
            widget._pendingProbe = null;
            probe.onload = null;
            probe.onerror = null;

            WidgetAnimations.cancelTargetSwap(slot.target);
            const prevBlob = widget._activeBlobUrl;
            const oldClone = slot.target.cloneNode(true);
            if (prevBlob && prevBlob !== newSrc && prevBlob.indexOf('blob:') === 0) {
                widget._clearRetiringBlob();
                widget._retiringBlobUrl = prevBlob;
            }
            if (newSrc.indexOf('blob:') === 0) {
                widget._activeBlobUrl = newSrc;
                if (widget._pendingBlobUrl === newSrc) {
                    widget._pendingBlobUrl = null;
                }
            } else {
                widget._activeBlobUrl = null;
            }

            const oldImg = widget.e.img;
            if (oldImg) {
                probe.style.cssText = oldImg.style.cssText;
                probe.ondragstart = oldImg.ondragstart;
                if (oldImg.parentNode) {
                    oldImg.parentNode.replaceChild(probe, oldImg);
                }
                oldImg.onload = null;
                oldImg.onerror = null;
                oldImg.removeAttribute('src');
            } else if (widget.e && widget.e.imgInner) {
                probe.style.display = 'block';
                probe.ondragstart = function (e) { e.preventDefault(); };
                widget.e.imgInner.appendChild(probe);
            }
            probe.onerror = function () {
                widget._handlePrimaryImageError();
            };
            probe.onload = function () {
                widget._handlePrimaryImageLoad();
            };
            widget.e.img = probe;
            widget._activeSwapProbe = probe;
            widget._preparePrimaryImageLoad();
            widget._setImageVisible(true);
            widget._lastAppliedUrl = newSrc;
            widget._requestResponsiveReflowAfterContentChange();

            const newClone = slot.target.cloneNode(true);

            let finalized = false;
            const finishSwap = function () {
                if (finalized) return;
                finalized = true;
                if (widget._activeSwapProbe === probe) {
                    widget._activeSwapProbe = null;
                }
                widget._clearRetiringBlob();
                widget._lastUrlImageLoadAt = Date.now();
                widget._clearRefreshInFlight();
            };

            WidgetAnimations.swap({
                host: slot.host,
                target: slot.target,
                animation: slot.animation,
                duration: slot.duration,
                allowed: slot.allowed,
                exitContent: oldClone,
                enterContent: newClone,
                onDone: finishSwap,
                onCancel: finishSwap
            });
        };

        probe.onload = function () {
            if (widget._pendingProbe !== probe) {
                probe.onload = null;
                probe.onerror = null;
                probe.src = '';
                return;
            }
            if (typeof probe.decode === 'function') {
                try {
                    const p = probe.decode();
                    if (p && typeof p.then === 'function') {
                        p.then(commitSwap, commitSwap);
                        return;
                    }
                } catch (_e) { /* ignore */ }
            }
            commitSwap();
        };

        probe.onerror = function () {
            if (widget._pendingProbe !== probe) {
                probe.onload = null;
                probe.onerror = null;
                probe.src = '';
                return;
            }
            widget._pendingProbe = null;
            probe.onload = null;
            probe.onerror = null;
            widget._lastAppliedUrl = newSrc;
            widget._handlePrimaryImageError();
            probe.src = '';
        };

        probe.src = newSrc;
    }

    _applySvgContent(c) {
        this.e.svgInner.innerHTML = ImageWidget._buildSvgHtml(c.svgRaw);
        this._applySvgElementLayout(c);
    }

    _applySvgElementLayout(c) {
        const svgInner = this.e.svgInner;
        const childSvg = svgInner ? svgInner.querySelector('svg') : null;

        svgInner.style.opacity = '';
        svgInner.style.transform = '';
        svgInner.style.position = 'relative';
        svgInner.style.width = '100%';
        svgInner.style.height = '100%';
        svgInner.style.top = '';
        svgInner.style.left = '';

        if (!childSvg) {
            svgInner.style.opacity = c.opacity / 100;
            return;
        }

        childSvg.style.opacity = c.opacity / 100;
        childSvg.style.width = '';
        childSvg.style.height = '';
        childSvg.style.transform = '';
        childSvg.style.position = '';
        childSvg.style.top = '';
        childSvg.style.left = '';
        childSvg.style.borderRadius = '0';

        if (c.fit) {
            childSvg.style.width = '100%';
            childSvg.style.height = '100%';
            childSvg.setAttribute('preserveAspectRatio', c.proportional ? 'xMidYMid meet' : 'none');
            if (c.moveX !== 0 || c.moveY !== 0) {
                childSvg.style.transform = `translate(${c.moveX}px, ${c.moveY}px)`;
            }
        } else {
            childSvg.removeAttribute('preserveAspectRatio');
            childSvg.style.position = 'absolute';
            childSvg.style.left = '50%';
            childSvg.style.top = '50%';
            const s = (c.scale !== undefined && c.scale !== null) ? c.scale / 100 : 1;
            childSvg.style.transform = `translate(-50%, -50%) translate(${c.moveX}px, ${c.moveY}px) scale(${s})`;
            childSvg.style.width = 'auto';
            childSvg.style.height = 'auto';
        }
    }

    _maybeAnimatedSetSvg(c) {
        const sig = c.svgRaw || '';
        if (!this._shouldAnimateContent() || c.sourceType !== 'svg') {
            this._applySvgContent(c);
            this._lastAppliedSvgRaw = sig;
            return;
        }
        this._animateSvgSwap(c);
    }

    _animateSvgSwap(c) {
        const slot = this.getAnimationSlot('content');
        const sig = c.svgRaw || '';
        if (!slot || !slot.target) {
            this._applySvgContent(c);
            this._lastAppliedSvgRaw = sig;
            return;
        }

        WidgetAnimations.cancelTargetSwap(slot.target);
        const oldClone = slot.target.cloneNode(true);
        this._applySvgContent(c);
        this._lastAppliedSvgRaw = sig;
        const newClone = slot.target.cloneNode(true);
        WidgetAnimations.swap({
            host: slot.host,
            target: slot.target,
            animation: slot.animation,
            duration: slot.duration,
            allowed: slot.allowed,
            exitContent: oldClone,
            enterContent: newClone
        });
    }

    /**
     * A URL can be snapshotted into one revocable blob when fetch and createObjectURL exist.
     * blob: sources are already object URLs and must be assigned directly.
     * Skips fetch for endpoints already identified as non-CORS to avoid failing network requests.
     */
    _canBlobLoad(sourceUrl) {
        if (!sourceUrl || sourceUrl.indexOf('blob:') === 0) return false;
        if (typeof fetch !== 'function') return false;
        if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return false;
        if (this._noCorsUrl === sourceUrl) return false;
        return true;
    }

    /**
     * Direct image source assignment for non-CORS camera snapshots and streams.
     * For periodic snapshots, appends a unique query parameter (_ds_cb) so intermediate
     * and browser HTTP caches return fresh frames on every tick.
     * Sticky streams (e.g. MJPEG multipart feeds) keep a single stable address.
     */
    _useDirectImageSource(src, sticky) {
        if (!sticky && src.indexOf('data:') !== 0 && src.indexOf('blob:') !== 0) {
            this._directStreamUrl = null;
            this._refreshSeq = ((this._refreshSeq || 0) + 1) % 1000000;
            const sep = src.indexOf('?') !== -1 ? '&' : '?';
            this._maybeAnimatedSetSrc(src + sep + '_ds_cb=' + Date.now() + '_' + this._refreshSeq);
            return;
        }
        if (sticky) this._directStreamUrl = src;
        const current = (this.e && this.e.img && this.e.img.getAttribute('src')) || '';
        if (current === src) {
            this._lastAppliedUrl = src;
            return;
        }
        this._maybeAnimatedSetSrc(src);
    }

    _applyFetchedBlob(blob, gen) {
        const blobUrl = URL.createObjectURL(blob);
        if (this._blobLoadGen !== gen) {
            this._revokeBlobUrlSafe(blobUrl);
            return;
        }
        if (this._pendingBlobUrl && this._pendingBlobUrl !== this._activeBlobUrl) {
            this._revokeBlobUrlSafe(this._pendingBlobUrl);
        }
        this._pendingBlobUrl = blobUrl;
        this._directStreamUrl = null;
        this._maybeAnimatedSetSrc(blobUrl);
    }

    /**
     * Loads one frame as a blob and revokes the previous blob after the new frame is shown.
     * Uses standard CORS fetch so same-origin, Homey local proxy, and CORS-enabled camera feeds
     * load real image bytes into ephemeral blobs with immediate revocation upon replacement.
     * Endpoints lacking CORS headers gracefully fall back to direct <img src> with cache-busting.
     */
    _startBlobImageLoad(sourceUrl, force) {
        const src = typeof sourceUrl === 'string' ? sourceUrl : '';
        if (!force && src === this._loadedSourceUrl) return;
        if (!force && this._directStreamUrl === src && src !== '') return;

        this._loadedSourceUrl = src;
        if (this._directStreamUrl && this._directStreamUrl !== src) this._directStreamUrl = null;

        const gen = (this._blobLoadGen || 0) + 1;
        this._blobLoadGen = gen;
        this._clearRefreshInFlight();

        if (!src) {
            this._releaseAllBlobs();
            this._maybeAnimatedSetSrc('');
            return;
        }

        const editMode = typeof Dashboard !== 'undefined' && Dashboard.isEditMode;
        if (editMode || !this._canBlobLoad(src)) {
            this._maybeAnimatedSetSrc(src);
            return;
        }

        this._refreshInFlight = true;
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        this._refreshAbortController = controller;
        if (this._refreshInFlightTimer) clearTimeout(this._refreshInFlightTimer);
        const widget = this;
        this._refreshInFlightTimer = setTimeout(function () {
            if (widget._blobLoadGen !== gen) return;
            widget._clearRefreshInFlight();
        }, 15000);

        const fetchOpts = { cache: 'no-store', credentials: 'same-origin' };
        if (controller) fetchOpts.signal = controller.signal;

        fetch(src, fetchOpts)
            .then(function (res) {
                if (widget._blobLoadGen !== gen) return null;
                if (!res || !res.ok) {
                    throw new Error(res ? ('HTTP ' + res.status) : 'No response');
                }
                return res.blob();
            })
            .then(function (blob) {
                if (widget._blobLoadGen !== gen) return;
                widget._refreshAbortController = null;
                widget._refreshInFlight = false;
                if (widget._refreshInFlightTimer) {
                    clearTimeout(widget._refreshInFlightTimer);
                    widget._refreshInFlightTimer = null;
                }
                if (!blob || !blob.size) {
                    throw new Error('Empty blob');
                }
                if (typeof Dashboard !== 'undefined' && !Dashboard.isEditMode && widget.elements && widget.elements.wrapper && widget.elements.wrapper.style.display === 'none') {
                    widget._loadedSourceUrl = undefined;
                    return;
                }
                widget._applyFetchedBlob(blob, gen);
            })
            .catch(function (err) {
                if (widget._blobLoadGen !== gen) return;
                if (err && err.name === 'AbortError' && widget._refreshAbortController && widget._refreshAbortController !== controller) return;
                widget._refreshInFlight = false;
                if (widget._refreshInFlightTimer) {
                    clearTimeout(widget._refreshInFlightTimer);
                    widget._refreshInFlightTimer = null;
                }
                widget._refreshAbortController = null;
                if (src.indexOf('data:') === 0) {
                    widget._handlePrimaryImageError();
                    return;
                }
                widget._noCorsUrl = src;
                widget._useDirectImageSource(src, !!(err && err.name === 'AbortError'));
            });
    }

    _doRefresh() {
        if (typeof Dashboard !== 'undefined' && Dashboard.isEditMode) return;
        const c = this.config;
        if (!this._liveRefreshEligible(c)) return;
        if (this._refreshInFlight) return;
        const minMs = this._getImageRefreshIntervalMs(c);
        const now = Date.now();
        if (this._lastUrlImageLoadAt != null && now - this._lastUrlImageLoadAt < minMs) return;

        const baseUrl = typeof c.url === 'string' ? c.url.trim() : '';
        if (!baseUrl) return;
        if (this._directStreamUrl === baseUrl) return;

        this._lastUrlImageLoadAt = now;
        this._startBlobImageLoad(baseUrl, true);

        if (typeof performance !== 'undefined' && typeof performance.clearResourceTimings === 'function') {
            performance.clearResourceTimings();
        }
    }

    _syncImageLayout(c) {
        const img = this.e.img;
        const imgWrap = this.e.imgWrap;
        const imgInner = this.e.imgInner;
        const svgContainer = this.e.svgContainer;

        this.lblEl.textContent = c.label;
        this.lblEl.style.display = c.label ? 'block' : 'none';
        this.applyTypographyToElement(this.lblEl, 'label', c);
        this.lblEl.style.transform = `translate(${c.labelOffX}px, ${c.labelOffY}px)`;

        const outerRadius = c.cornerRadius || 0;
        const dist = (c.padding || 0) + (c.borderWidth || 0);
        const innerRadius = Math.max(0, outerRadius - dist);
        imgWrap.style.borderRadius = `${innerRadius}px`;

        // In Responsive Columns the container is measured at height:auto to derive the
        // row span. flex:1 (1 1 0%) collapses to 0 with an auto-height flex parent, so
        // the image's natural aspect height could never be measured and the container
        // was stuck at the Min Widget Height. flex:1 1 auto keeps the natural height as
        // the flex basis (auto -> image aspect height; definite cell -> still fills).
        // svgContainer already uses 1 1 auto so SVG sources are unaffected.
        imgWrap.style.flex = (typeof BaseWidget !== 'undefined' && BaseWidget.isResponsiveMode && BaseWidget.isResponsiveMode())
            ? '1 1 auto' : '1';

        const isUrl = c.sourceType === 'url';

        if (imgInner) {
            imgInner.style.display = isUrl ? 'block' : 'none';
            if (isUrl) {
                imgInner.style.width = '100%';
                imgInner.style.height = '100%';
            }
        }
        if (svgContainer) {
            svgContainer.style.display = isUrl ? 'none' : 'flex';
            if (!isUrl) {
                svgContainer.style.width = '100%';
                svgContainer.style.height = '100%';
            }
        }

        if (c.deactivated) {
            const deactCol = BaseWidget.getDeactivatedColor(c);
            const accentCol = BaseWidget.getDeactivatedColorAccent(c);
            if (c.label) {
                this.lblEl.style.display = 'block';
                this.lblEl.style.color = accentCol;
            } else {
                this.lblEl.style.display = 'none';
            }
            imgWrap.style.border = `2px solid ${deactCol}`;
            imgWrap.style.boxSizing = 'border-box';
            if (img) img.style.opacity = '0';
            if (svgContainer) svgContainer.style.opacity = '0';
            return;
        } else {
            imgWrap.style.border = '';
            if (svgContainer) svgContainer.style.opacity = '';
        }

        if (isUrl) {
            img.style.display = 'block';
            img.style.objectFit = '';

            img.style.opacity = c.opacity / 100;
            img.style.width = '';
            img.style.height = '';
            img.style.transform = '';
            img.style.position = '';
            img.style.top = '';
            img.style.left = '';
            img.style.borderRadius = '0';

            if (c.fit) {
                img.style.width = '100%';
                img.style.height = '100%';
                if (c.proportional) {
                    img.style.objectFit = 'contain';
                } else {
                    img.style.objectFit = 'fill';
                }
                if (c.moveX !== 0 || c.moveY !== 0) {
                    img.style.transform = `translate(${c.moveX}px, ${c.moveY}px)`;
                }
            } else {
                img.style.position = 'absolute';
                img.style.left = '50%';
                img.style.top = '50%';
                const s = (c.scale !== undefined && c.scale !== null) ? c.scale / 100 : 1;
                img.style.transform = `translate(-50%, -50%) translate(${c.moveX}px, ${c.moveY}px) scale(${s})`;
                img.style.width = 'auto';
                img.style.height = 'auto';
            }
        } else {
            img.style.display = 'none';
            this._applySvgElementLayout(c);
        }
    }

    _onGeometryUpdate() {
        this._syncImageLayout(this.config);
    }

    _renderSpecific(resolvedConfig) {
        const c = resolvedConfig || this.config;
        const sourceType = c.sourceType || 'url';

        if (this._cachedSourceType !== sourceType) {
            this._lastAppliedUrl = undefined;
            this._lastAppliedSvgRaw = undefined;
            this._loadedSourceUrl = undefined;
            this._cachedSourceUrl = undefined;
            this._noCorsUrl = null;
            this._directStreamUrl = null;
            this._cancelContentSwap();
            this._releaseAllBlobs();
            this._cachedSourceType = sourceType;
            this._cachedLiveRefreshSig = undefined;
        }

        this._syncImageLayout(c);

        if (!c.visible && (typeof Dashboard === 'undefined' || !Dashboard.isEditMode)) {
            this._blobLoadGen = (this._blobLoadGen || 0) + 1;
            this._stopLiveRefreshTimer();
            if (this._pendingProbe) {
                this._pendingProbe.onload = null;
                this._pendingProbe.onerror = null;
                this._pendingProbe.src = '';
                this._pendingProbe = null;
            }
            this._cancelContentSwap();
            this._releaseAllBlobs();
            if (this.e && this.e.img && (this._lastAppliedUrl !== undefined || this.e.img.hasAttribute('src'))) {
                this._markImageRole('none');
                this._showingFallback = false;
                this.e.img.removeAttribute('src');
                this._lastAppliedUrl = undefined;
                this._loadedSourceUrl = undefined;
                this._directStreamUrl = null;
                this._lastUrlImageLoadAt = undefined;
            }
            return;
        }

        if (sourceType === 'url') {
            const rawUrl = c.url || '';
            if (this._cachedSourceUrl !== rawUrl) {
                this._cachedSourceUrl = rawUrl;
                this._noCorsUrl = null;
            }

            const fallbackSig = Object.prototype.hasOwnProperty.call(this.overrides, 'fallbackUrl')
                ? String(__nullish(this.overrides.fallbackUrl, ''))
                : '\x1e' + String(__nullish(c.defaultImageFallbackUrl, 'images/brokenlink.png'));
            if (this._cachedFallbackUrl !== fallbackSig) {
                this._cachedFallbackUrl = fallbackSig;
                this._lastAppliedUrl = undefined;
                this._loadedSourceUrl = undefined;
            }

            this._syncLiveRefreshTimer(c);
            if (!this._liveRefreshEligible(c)) {
                this._lastUrlImageLoadAt = undefined;
                const target = c.url || '';
                const isLiveConfigured = c.liveRefresh === true && (typeof Dashboard === 'undefined' || !Dashboard.isEditMode);
                if (!isLiveConfigured) {
                    this._releaseAllBlobs();
                    this._loadedSourceUrl = target;
                    if (target !== this._lastAppliedUrl) {
                        this._maybeAnimatedSetSrc(target);
                    }
                }
            }
        } else {
            this._stopLiveRefreshTimer();
            this._releaseAllBlobs();
            this._cachedLiveRefreshSig = undefined;
            this._loadedSourceUrl = undefined;
            this._directStreamUrl = null;
            this._lastUrlImageLoadAt = undefined;
            const sig = c.svgRaw || '';
            if (sig !== this._lastAppliedSvgRaw) {
                this._maybeAnimatedSetSvg(c);
            }
        }

        if (!this._hasPaintedContent) {
            this._hasPaintedContent = true;
        }
    }

    onRemove() {
        if (this._pendingProbe) {
            this._pendingProbe.onload = null;
            this._pendingProbe.onerror = null;
            this._pendingProbe.src = '';
            this._pendingProbe = null;
        }
        this._cancelContentSwap();
        this._blobLoadGen = (this._blobLoadGen || 0) + 1;
        this._stopLiveRefreshTimer();
        this._releaseAllBlobs();
        this._cachedLiveRefreshSig = undefined;
        this._loadedSourceUrl = undefined;
        this._cachedSourceUrl = undefined;
        this._noCorsUrl = null;
        this._directStreamUrl = null;
        this._lastUrlImageLoadAt = undefined;
        super.onRemove();
    }

    pauseForBackground() {
        this._blobLoadGen = (this._blobLoadGen || 0) + 1;
        this._stopLiveRefreshTimer();
        if (this._pendingProbe) {
            this._pendingProbe.onload = null;
            this._pendingProbe.onerror = null;
            this._pendingProbe.src = '';
            this._pendingProbe = null;
        }
        this._cancelContentSwap();
        if (this._pendingBlobUrl && this._pendingBlobUrl !== this._activeBlobUrl) {
            this._revokeBlobUrlSafe(this._pendingBlobUrl);
            this._pendingBlobUrl = null;
        }
        const shown = (this.e && this.e.img && this.e.img.getAttribute('src')) || '';
        if (!shown) this._loadedSourceUrl = undefined;
    }

    resumeFromBackground() {
        if (this.elements && this.elements.wrapper && this.elements.wrapper.style.display !== 'none') {
            this._syncLiveRefreshTimer(this.config);
        }
    }
}

WidgetRegistry.register('image', ImageWidget);
