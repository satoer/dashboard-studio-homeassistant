class VideoStreamWidget extends BaseWidget {
    static get metadata() {
        return { label: "Video Stream", shortName: "Video", icon: "ph-video-camera", category: "Media", color_dark: "hsl(350, 80%, 65%)", color_light: "hsl(350, 85%, 35%)", version: "2.3.1", date: "2026-11-02" };
    }

    static get globalSettings() {
        return {
            defaultVsShowLiveInEditor: false,
            defaultVsZoom: 100,
            defaultVsPanX: 0,
            defaultVsPanY: 0
        };
    }

    static get globalSchema() {
        return [
            { key: 'defaultVsShowLiveInEditor', type: 'checkbox', label: 'Default Show Live in Editor', cols: 12 },
            { key: 'defaultVsZoom', type: 'number', label: 'Default Zoom %', cols: 4 },
            { key: 'defaultVsPanX', type: 'number', label: 'Default Pan X', cols: 4 },
            { key: 'defaultVsPanY', type: 'number', label: 'Default Pan Y', cols: 4 }
        ];
    }

    /** `url` is stream/page for iframe, not a static raster asset. */
    static extractPreloadImageUrls(overrides) {
        return [];
    }

    getDefaultOverrides() {
        return {
            url: "",
            showLiveInEditor: false,
            zoom: 100,
            panX: 0,
            panY: 0,
            
            label: "",
            labelFont: "'Inter', sans-serif",
            labelFs: null,
            labelCol: null,
            labelAlign: "center",
            labelOffX: 0,
            labelOffY: 0,
            labelCase: "uppercase"
        };
    }

    get config() {
        const c = super.config;
        return {
            ...c,
            url: c.url || "",
            showLiveInEditor: c.showLiveInEditor !== undefined && c.showLiveInEditor !== null ? c.showLiveInEditor : (c.defaultVsShowLiveInEditor || false),
            zoom: c.zoom !== undefined && c.zoom !== null ? c.zoom : (c.defaultVsZoom || 100),
            panX: c.panX !== undefined && c.panX !== null ? c.panX : (c.defaultVsPanX || 0),
            panY: c.panY !== undefined && c.panY !== null ? c.panY : (c.defaultVsPanY || 0),

            label: c.label || "",
            labelFont: c.labelFont || c.fontFamily || "'Inter', sans-serif",
            labelFs: __nullish(c.labelFs, __nullish(c.defaultFsLabel, 12)),
            labelCol: __nullish(c.labelCol, __nullish(c.defaultColLabel, "@textMuted")),
            labelAlign: c.labelAlign || c.defaultTextAlign || "center",
            labelOffX: __nullish(c.labelOffX, 0),
            labelOffY: __nullish(c.labelOffY, 0),
            labelCase: c.labelCase || c.defaultLabelCase || 'uppercase'
        };
    }

    getSchema() {
        return [
            {
                id: 'vs_data', title: 'Data & Source', icon: 'ph-image',
                fields: [
                    { key: 'url', type: 'text', label: 'Stream URL', cols: 12 },
                    { key: 'showLiveInEditor', type: 'checkbox', label: 'Show Live Stream in Editor', cols: 12, defaultKey: 'defaultVsShowLiveInEditor' }
                ]
            },
            {
                id: 'vs_layout', title: 'Appearance', icon: 'ph-palette',
                fields: [
                    { key: 'zoom', type: 'number', label: 'Zoom Level %', cols: 4, defaultKey: 'defaultVsZoom' },
                    { key: 'panX', type: 'number', label: 'Pan X', cols: 4, defaultKey: 'defaultVsPanX' },
                    { key: 'panY', type: 'number', label: 'Pan Y', cols: 4, defaultKey: 'defaultVsPanY' },
                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }
                ]
            },
            {
                id: 'vs_label', title: 'Text & Typography', icon: 'ph-text-t',
                fields: [
                    { key: 'label', type: 'text', label: 'Text', cols: 12 },
                    { key: 'labelFont', type: 'select', label: 'Font Family', options: window.AVAILABLE_FONTS, cols: 8, defaultKey: 'fontFamily' },
                    { key: 'labelBold', type: 'checkbox', label: 'Label Bold', cols: 4, defaultKey: 'defaultLabelBold' },
                    { key: 'labelFs', type: 'number', label: 'Font Size', cols: 4, defaultKey: 'defaultFsLabel' },
                    { key: 'labelCol', type: 'color', label: 'Label Color', cols: 4, defaultKey: 'defaultColLabel' },
                    {
                        key: 'labelAlign', type: 'select', label: 'Horizontal Alignment', options: [
                            { value: 'left', text: 'Left' },
                            { value: 'center', text: 'Center' },
                            { value: 'right', text: 'Right' }
                        ], cols: 4, defaultKey: 'defaultTextAlign'
                    },
                    {
                        key: 'labelCase', type: 'select', label: 'Label Case', options: [
                            { value: 'uppercase', text: 'UPPERCASE' }, { value: 'capitalize', text: 'Capitalize' }, { value: 'lowercase', text: 'lowercase' }, { value: 'none', text: 'None' }
                        ], cols: 12, defaultKey: 'defaultLabelCase'
                    },
                    { key: 'labelOffX', type: 'number', label: 'Offset X', cols: 6 },
                    { key: 'labelOffY', type: 'number', label: 'Offset Y', cols: 6 }
                ]
            }
        ];
    }

    _buildBaseDOM() {
        const b = super._buildBaseDOM();
        
        b.innerContent.style.display = 'flex';
        b.innerContent.style.flexDirection = 'column';

        // --- Standardized Label DOM ---
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

        // --- Stream Wrapper (handles Aspect Ratio & Cropping bounds) ---
        const streamWrap = document.createElement('div');
        streamWrap.style.flex = '1';
        streamWrap.style.width = '100%';
        streamWrap.style.position = 'relative';
        streamWrap.style.overflow = 'hidden';
        streamWrap.style.display = 'flex';
        streamWrap.style.alignItems = 'center';
        streamWrap.style.justifyContent = 'center';
        streamWrap.style.backgroundColor = '#000'; // Dark baseline for video
        
        // --- Placeholder for Edit Mode or missing URL ---
        const placeholder = document.createElement('div');
        placeholder.style.position = 'absolute';
        placeholder.style.inset = '0';
        placeholder.style.display = 'none';
        placeholder.style.flexDirection = 'column';
        placeholder.style.alignItems = 'center';
        placeholder.style.justifyContent = 'center';
        placeholder.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        placeholder.style.color = 'rgba(255, 255, 255, 0.5)';
        placeholder.style.textAlign = 'center';
        placeholder.style.padding = '8px';
        placeholder.style.overflow = 'hidden';
        
        const phIcon = document.createElement('i');
        phIcon.className = 'ph ph-video-camera';
        phIcon.style.fontSize = '32px';
        phIcon.style.marginBottom = '8px';
        
        const phText = document.createElement('div');
        phText.style.fontSize = '11px';
        phText.style.wordBreak = 'break-all';
        phText.style.fontFamily = 'monospace';
        phText.style.opacity = '0.7';
        
        placeholder.appendChild(phIcon);
        placeholder.appendChild(phText);
        streamWrap.appendChild(placeholder);
        
        b.innerContent.appendChild(streamWrap);

        this.e = { streamWrap, placeholder, phText };
        this.iframeEl = null;

        return b;
    }

    _mountIframe(url) {
        if (!this.iframeEl) {
            this.iframeEl = document.createElement('iframe');
            this.iframeEl.style.position = 'absolute';
            this.iframeEl.style.border = 'none';
            this.iframeEl.style.width = '100%';
            this.iframeEl.style.height = '100%';
            // Use pointer-events none in edit mode so it doesn't swallow drags
            if (Dashboard.isEditMode) {
                this.iframeEl.style.pointerEvents = 'none';
            }
            this.e.streamWrap.appendChild(this.iframeEl);
        }
        
        // Only trigger a reload if the URL actually changed to prevent flickering
        if (this.iframeEl.src !== url) {
            this.iframeEl.src = url;
            console.log(`[VideoStreamWidget] Mounted/Updated stream: ${url}`);
        }
    }

    _unmountIframe() {
        if (this.iframeEl) {
            console.log(`[VideoStreamWidget] Unmounting stream to save memory`);
            // Properly clear iframe before remove to halt processes
            this.iframeEl.src = 'about:blank';
            if (this.iframeEl.parentNode) {
                this.iframeEl.parentNode.removeChild(this.iframeEl);
            }
            this.iframeEl = null;
        }
    }

    onRemove() {
        super.onRemove();
        this._unmountIframe();
    }

    pauseForBackground() {
        this._unmountIframe();
    }

    resumeFromBackground() {
        if (this.elements && this.elements.wrapper && this.elements.wrapper.style.display !== 'none') {
            this._renderSpecific();
        }
    }

    _renderSpecific() {
        const c = this.config;
        const streamWrap = this.e.streamWrap;

        // --- Apply Label Formatting ---
        this.lblEl.textContent = c.label;
        this.lblEl.style.display = c.label ? 'block' : 'none';
        this.lblEl.style.fontFamily = c.labelFont;
        this.lblEl.style.fontWeight = c.labelBold ? '700' : '400';
        this.lblEl.style.fontSize = `${c.labelFs}px`;
        this.lblEl.style.color = BaseWidget.resolveCssColor(c.labelCol);
        this.lblEl.style.textAlign = c.labelAlign;
        this.lblEl.style.textTransform = c.labelCase;
        this.lblEl.style.transform = `translate(${c.labelOffX}px, ${c.labelOffY}px)`;

        // --- Concentric Inner Radius Calculation ---
        const outerRadius = c.cornerRadius || 0;
        const dist = (c.padding || 0) + (c.borderWidth || 0);
        const innerRadius = Math.max(0, outerRadius - dist);
        streamWrap.style.borderRadius = `${innerRadius}px`;

        streamWrap.style.height = '100%'; // Fill containing flex container vertically

        if (c.deactivated) {
            const deactCol = BaseWidget.getDeactivatedColor(c);
            const accentCol = BaseWidget.getDeactivatedColorAccent(c);
            if (c.label) {
                this.lblEl.style.display = 'block';
                this.lblEl.style.color = accentCol;
            } else {
                this.lblEl.style.display = 'none';
            }
            streamWrap.style.border = `2px solid ${deactCol}`;
            streamWrap.style.boxSizing = 'border-box';
            streamWrap.style.backgroundColor = 'transparent';
            this.e.placeholder.style.display = 'none';
            if (this.iframeEl) {
                this.iframeEl.style.opacity = '0';
                this.iframeEl.style.pointerEvents = 'none';
            }
            return;
        } else {
            this.lblEl.style.color = BaseWidget.resolveCssColor(c.labelCol);
            streamWrap.style.border = '';
            streamWrap.style.backgroundColor = '#000';
            if (this.iframeEl) {
                this.iframeEl.style.opacity = '';
                this.iframeEl.style.pointerEvents = Dashboard.isEditMode ? 'none' : 'auto';
            }
        }

        // --- Determine Effective Visibility ---
        // BaseWidget hides the wrapper `display: none` if page matches fail or condition fails
        const isEffectivelyVisible = this.elements.wrapper.style.display !== 'none'
            && (typeof Dashboard === 'undefined' || !Dashboard._pageHidden);
        
        const shouldMountLive = isEffectivelyVisible && 
            (!Dashboard.isEditMode || c.showLiveInEditor) && 
            !!c.url;

        if (shouldMountLive) {
            this.e.placeholder.style.display = 'none';
            this._mountIframe(c.url);
            
            // Apply Zoom and Pan
            if (this.iframeEl) {
                const s = (c.zoom !== undefined && c.zoom !== null) ? c.zoom / 100 : 1;
                // Using transform scale requires ensuring origin is center or handling object-fit
                this.iframeEl.style.transform = `translate(${c.panX}px, ${c.panY}px) scale(${s})`;
            }
        } else {
            // Unmount the WebRTC stream to save memory/resources
            this._unmountIframe();
            
            // Show Placeholder if we are in Edit mode
            if (Dashboard.isEditMode) {
                this.e.placeholder.style.display = 'flex';
                this.e.phText.textContent = c.url ? c.url : "No Stream URL configured";
            } else {
                this.e.placeholder.style.display = 'none';
            }
        }
    }
}

WidgetRegistry.register('videostream', VideoStreamWidget);
