// --- COLOR UTILITIES ---
const ColorUtils = {
    // Parse any input (Hex, RGB, Name, or Unified Light JSON) into {h, s, v, a}
    parse: function (input) {
        if (!input) return null;

        // 1. Unified Light State JSON
        if (typeof input === 'object') {
            // Handle Homey/HA Light State
            if (input.color_mode === 'color_temp' && input.color_temp) {
                // Approximate Color Temp to RGB -> HSV
                // Note: Input brightness is 0-255, we need 0-100 for HSV.v
                return this.kelvinToHsv(this.miredToKelvin(input.color_temp), input.brightness);
            }
            if (input.color && input.color.h !== undefined) {
                // HSV Object
                let b = input.brightness !== undefined ? (input.brightness / 255) : 1;
                return { h: input.color.h, s: input.color.s, v: b * 100, a: 1 };
            }
            if (input.r !== undefined && input.g !== undefined && input.b !== undefined) {
                const a = input.a !== undefined ? Number(input.a) : 1;
                const hsv = this.rgbToHsv(Number(input.r), Number(input.g), Number(input.b));
                hsv.a = a;
                return hsv;
            }
            if (input.h !== undefined && input.s !== undefined) {
                const a = input.a !== undefined ? Number(input.a) : 1;
                if (input.v !== undefined) {
                    return { h: Number(input.h), s: Number(input.s), v: Number(input.v), a: a };
                }
                if (input.l !== undefined) {
                    const rgb = this.hslToRgb(Number(input.h), Number(input.s), Number(input.l));
                    const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
                    hsv.a = a;
                    return hsv;
                }
            }
            // Fallback for simple objects or errors
            return null;
        }

        const str = String(input).trim();

        // 2. Hex (strict: reject Markdown "# heading" and other non-color strings)
        if (str.startsWith('#')) {
            let hex = str.slice(1);
            if (!hex.length) return null;
            if (!/^[0-9a-fA-F]+$/.test(hex)) return null;
            if (hex.length !== 3 && hex.length !== 6 && hex.length !== 8) return null;
            if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
            const bigint = parseInt(hex, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return this.rgbToHsv(r, g, b);
        }

        // 3. RGB / RGBA
        if (str.startsWith('rgb')) {
            const parts = str.match(/(\d+(\.\d+)?)/g);
            if (parts && parts.length >= 3) {
                const r = parseFloat(parts[0]);
                const g = parseFloat(parts[1]);
                const b = parseFloat(parts[2]);
                const a = parts.length > 3 ? parseFloat(parts[3]) : 1;
                const hsv = this.rgbToHsv(r, g, b);
                hsv.a = a;
                return hsv;
            }
        }

        // 4. HSL / HSLA (comma-separated)
        if (str.startsWith('hsl')) {
            const m = str.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+(?:\.\d+)?)\s*)?\)/i);
            if (m) {
                const h = parseFloat(m[1]);
                const s = parseFloat(m[2]);
                const l = parseFloat(m[3]);
                const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
                const rgb = this.hslToRgb(h, s, l);
                const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
                hsv.a = a;
                return hsv;
            }
        }

        return null; // Return null if not parsable (e.g. named color we can't easily calc)
    },

    adjust: function (baseColor, corrections) {
        let hsv = this.parse(baseColor);
        if (!hsv) return baseColor; // Cannot adjust unknown formats (e.g. 'red')

        // 1. Hue Correction
        if (corrections.hue_fixed) {
            hsv.h = corrections.hue % 360;
        } else {
            hsv.h = (hsv.h + (corrections.hue || 0)) % 360;
        }
        if (hsv.h < 0) hsv.h += 360;

        // 2. Saturation Correction
        if (corrections.sat_fixed) {
            hsv.s = Math.max(0, Math.min(100, corrections.sat));
        } else if (corrections.sat !== undefined) {
            hsv.s = Math.max(0, Math.min(100, hsv.s * (corrections.sat / 100)));
        }

        // 3. Brightness Correction
        if (corrections.bri_fixed) {
            hsv.v = Math.max(0, Math.min(100, corrections.bri));
        } else if (corrections.bri !== undefined) {
            hsv.v = Math.max(0, Math.min(100, hsv.v * (corrections.bri / 100)));
        }

        // Convert back to CSS string
        const rgb = this.hsvToRgb(hsv.h, hsv.s, hsv.v);
        if (hsv.a < 1) {
            return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${hsv.a})`;
        }
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    },

    // Helpers
    rgbToHsv: function (r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, v = max;
        const d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max === min) h = 0;
        else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, v: v * 100, a: 1 };
    },

    hsvToRgb: function (h, s, v) {
        let r, g, b;
        const i = Math.floor(h / 60);
        const f = h / 60 - i;
        const p = (v / 100) * (1 - (s / 100));
        const q = (v / 100) * (1 - f * (s / 100));
        const t = (v / 100) * (1 - (1 - f) * (s / 100));
        const val = v / 100;

        switch (i % 6) {
            case 0: r = val; g = t; b = p; break;
            case 1: r = q; g = val; b = p; break;
            case 2: r = p; g = val; b = t; break;
            case 3: r = p; g = q; b = val; break;
            case 4: r = t; g = p; b = val; break;
            case 5: r = val; g = p; b = q; break;
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    },

    hslToRgb: function (h, s, l) {
        let hh = h / 360;
        let ss = s / 100;
        let ll = l / 100;
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        let r; let g; let b;
        if (ss === 0) {
            r = g = b = ll;
        } else {
            const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
            const p = 2 * ll - q;
            r = hue2rgb(p, q, hh + 1 / 3);
            g = hue2rgb(p, q, hh);
            b = hue2rgb(p, q, hh - 1 / 3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    },

    rgbToHsl: function (r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: h * 360, s: s * 100, l: l * 100 };
    },

    miredToKelvin: function (mired) { return 1000000 / mired; },

    kelvinToHsv: function (k, brightnessByte) {
        // Simple approximation
        let temp = k / 100;
        let r, g, b;
        if (temp <= 66) {
            r = 255;
            g = temp;
            g = 99.4708025861 * Math.log(g) - 161.1195681661;
            if (temp <= 19) b = 0;
            else {
                b = temp - 10;
                b = 138.5177312231 * Math.log(b) - 305.0447927307;
            }
        } else {
            r = temp - 60;
            r = 329.698727446 * Math.pow(r, -0.1332047592);
            g = temp - 60;
            g = 288.1221695283 * Math.pow(g, -0.0755148492);
            b = 255;
        }

        // Apply brightness scaling to Value
        const v = (brightnessByte / 255) * 100;

        return this.rgbToHsv(
            Math.max(0, Math.min(255, r)),
            Math.max(0, Math.min(255, g)),
            Math.max(0, Math.min(255, b))
        );
    },

    // Convert generic HSB object to CSS RGB
    toCss: function (hsv) {
        const rgb = this.hsvToRgb(hsv.h, hsv.s, hsv.v);
        if (hsv.a !== undefined && hsv.a < 1) {
            return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${hsv.a})`;
        }
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    },

    /**
     * Format an HSV color for the editor manual field (opaque only; no alpha channel).
     * @param {{h:number,s:number,v:number,a?:number}} hsv
     * @param {string} format hex | rgb | hsl
     */
    formatManualColor: function (hsv, format) {
        const rgb = this.hsvToRgb(hsv.h, hsv.s, hsv.v);
        const fmt = String(format || 'hex').toLowerCase();
        if (fmt === 'hex') {
            return ('#' + [rgb.r, rgb.g, rgb.b].map((x) => x.toString(16).padStart(2, '0')).join('')).toUpperCase();
        }
        if (fmt === 'rgb') {
            return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        }
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        const hh = Math.round(hsl.h);
        const ss = Math.round(hsl.s * 10) / 10;
        const ll = Math.round(hsl.l * 10) / 10;
        if (fmt === 'hsl') {
            return `hsl(${hh}, ${ss}%, ${ll}%)`;
        }
        return this.toCss({ h: hsv.h, s: hsv.s, v: hsv.v, a: 1 });
    }
};

// Make globally available for other scripts
window.ColorUtils = ColorUtils;

// Global Registry for Widgets
window.WidgetRegistry = {
    widgets: {}, // Map of type -> Widget Class
    categories: {}, // For future expansion (grouping widgets)

    // Core method to register a new widget
    register: function (type, widgetClass) {
        if (this.widgets[type]) {
            console.warn(`Widget type '${type}' is already registered. Overwriting.`);
        }

        // Ensure the class has the required static methods/properties
        if (!widgetClass.configuration) {
            widgetClass.configuration = { width: 2, height: 2 }; // Default defaults
        }

        this.widgets[type] = widgetClass;
        if (typeof dsDebug === 'function') dsDebug('[Registry] Registered widget: ' + type);

        // Inject dynamic CSS variables for theme switching
        this._injectWidgetStyles(type, widgetClass);

        // Trigger UI updates if Dashboard is ready
        if (window.Dashboard && window.Editor) {
            Editor.refreshDropdown(Dashboard.widgets);
        }
    },

    _injectWidgetStyles: function (type, wClass) {
        if (typeof document === 'undefined') return;
        const meta = wClass.metadata || {};

        let hue = 0;
        if (meta.colorHue !== undefined) {
            hue = meta.colorHue;
        } else {
            for (let i = 0; i < type.length; i++) {
                hue = type.charCodeAt(i) + ((hue << 5) - hue);
            }
            hue = Math.abs(hue) % 360;
        }

        const darkColor = meta.color_dark || `hsl(${hue}, 80%, 65%)`;
        const lightColor = meta.color_light || `hsl(${hue}, 85%, 35%)`;

        let styleTag = document.getElementById('base-widget-dynamic-styles');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'base-widget-dynamic-styles';
            document.head.appendChild(styleTag);
        }

        let aliasRulesDark = '';
        let aliasRulesLight = '';
        if (type === 'empty') {
            aliasRulesDark = ` --widget-color-container: ${darkColor};`;
            aliasRulesLight = ` --widget-color-container: ${lightColor};`;
        } else if (type === 'list') {
            aliasRulesDark = ` --widget-color-textbox: ${darkColor};`;
            aliasRulesLight = ` --widget-color-textbox: ${lightColor};`;
        }

        styleTag.innerHTML += `
            :root { --widget-color-${type}: ${darkColor};${aliasRulesDark} }
            body.ui-light { --widget-color-${type}: ${lightColor};${aliasRulesLight} }
        `;
    },

    get: function (type) {
        if (!type) return null;
        if (this.widgets[type]) return this.widgets[type];
        if (type === 'container') return this.widgets['empty'] || null;
        if (type === 'textbox') return this.widgets['list'] || null;
        return null;
    },

    getAll: function () {
        return this.widgets;
    },

    getTypeKeyForClass: function (ctor) {
        if (!ctor) return null;
        const w = this.widgets;
        for (const t in w) {
            if (Object.prototype.hasOwnProperty.call(w, t) && w[t] === ctor) {
                return t;
            }
        }
        return null;
    },

    getWidgetTagHtml: function (type, showFullName) {
        showFullName = showFullName === true;
        const wClass = this.get(type);
        const meta = wClass ? (wClass.metadata || {}) : {};

        const text = showFullName ? (meta.label || type) : (meta.shortName || type);
        const colorType = (type === 'container' && !this.widgets['container']) ? 'empty' : ((type === 'textbox' && !this.widgets['textbox']) ? 'list' : type);

        return '<span class="widget-registry-type-tag widget-registry-type-tag--inline" style="--widget-color-local: var(--widget-color-' + colorType + ');">' + text + '</span>';
    },

    // Collect all global settings defined by registered widgets
    // This allows widgets to inject settings into MASTER_SETTINGS
    getGlobalSettings: function () {
        let settings = {};
        Object.entries(this.widgets).forEach(([type, w]) => {
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.isWidgetHidden === 'function' && Dashboard.isWidgetHidden(type)) return;
            if (w.globalSettings) {
                Object.assign(settings, w.globalSettings);
            }
        });
        return settings;
    },

    // Collect all global schema definitions to build the Editor UI
    getGlobalSchema: function () {
        let schemas = [];
        Object.keys(this.widgets).forEach(type => {
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.isWidgetHidden === 'function' && Dashboard.isWidgetHidden(type)) return;
            const w = this.widgets[type];
            // Only add the group if the widget actually has global fields to show
            const widgetSchema = w.globalSchema;
            if (widgetSchema && widgetSchema.length > 0) {
                // Add sorting key (strip HTML tags from the title to sort by raw text)
                const rawTitle = w.metadata && w.metadata.label ? w.metadata.label : type;
                schemas.push({
                    id: `global_${type}`,
                    title: `${this.getWidgetTagHtml(type, true)} Defaults`,
                    icon: w.metadata ? w.metadata.icon : 'ph-gear',
                    fields: widgetSchema,
                    _sortKey: rawTitle.toLowerCase()
                });
            }
        });

        // Sort alphabetically based on the clean title name
        schemas.sort((a, b) => a._sortKey.localeCompare(b._sortKey));

        // Remove the temporary sorting key
        schemas.forEach(s => delete s._sortKey);

        return schemas;
    },

    /**
     * Collect raster image URLs from widget overrides for optional dashboard preload.
     * Widget classes may implement static extractPreloadImageUrls(overrides): string[]
     */
    collectPreloadImageUrlsFromOverrides: function (type, overrides) {
        let t = type;
        if (t === 'textbox') t = 'list';
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.isWidgetHidden === 'function' && Dashboard.isWidgetHidden(t)) {
            return [];
        }
        const wClass = this.get(t);
        if (!wClass || typeof wClass.extractPreloadImageUrls !== 'function') return [];
        try {
            const raw = wClass.extractPreloadImageUrls(overrides && typeof overrides === 'object' ? overrides : {}) || [];
            if (!Array.isArray(raw)) return [];
            return raw.map(u => (typeof u === 'string' ? u.trim() : '')).filter(Boolean);
        } catch (e) {
            console.warn('[Registry] extractPreloadImageUrls failed for type', t, e);
            return [];
        }
    }
};

class BaseWidget {
    // Standard layout defaults
    static get BASE_LAYOUT() { return { x: 400, y: 300, width: 260, height: 300, padding: 0 }; }

    /**
     * Parse numeric-like values and guarantee a finite number.
     * Keeps widget math and CSS geometry resilient against malformed dashboard data.
     */
    static toFiniteNumber(raw, fallback) {
        const n = Number(raw);
        if (Number.isFinite(n)) return n;
        const fb = Number(fallback);
        return Number.isFinite(fb) ? fb : 0;
    }

    static clampNumber(value, min, max) {
        let out = BaseWidget.toFiniteNumber(value, min);
        if (min !== undefined && min !== null) {
            const mn = BaseWidget.toFiniteNumber(min, out);
            if (out < mn) out = mn;
        }
        if (max !== undefined && max !== null) {
            const mx = BaseWidget.toFiniteNumber(max, out);
            if (out > mx) out = mx;
        }
        return out;
    }

    static cloneJsonValue(value) {
        if (value === null || value === undefined || typeof value !== 'object') return value;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (err) {
            if (Array.isArray(value)) return value.slice();
            return Object.assign({}, value);
        }
    }

    /**
     * Effective widget width: instance override if present, else master defaultWidth.
     * Used by layout/hit-testing so new widgets can omit width from overrides.
     */
    static resolveInstanceWidth(overrides, masterSettings) {
        const o = overrides || {};
        const ms = masterSettings || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {});
        if (o.width !== undefined && o.width !== null && o.width !== '') {
            return BaseWidget.clampNumber(o.width, 1, null);
        }
        return BaseWidget.clampNumber(ms.defaultWidth || BaseWidget.BASE_LAYOUT.width, 1, null);
    }

    static resolveInstanceHeight(overrides, masterSettings) {
        const o = overrides || {};
        const ms = masterSettings || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {});
        if (o.height !== undefined && o.height !== null && o.height !== '') {
            return BaseWidget.clampNumber(o.height, 1, null);
        }
        return BaseWidget.clampNumber(ms.defaultHeight || BaseWidget.BASE_LAYOUT.height, 1, null);
    }

    /**
     * Clips an off-canvas companion element (such as a floating legend or popover)
     * at the canvas perimeter in edit mode, maintaining its outer frame, outline,
     * drag handles, and off-canvas dim fill.
     */
    static syncCompanionCanvasClipping(hostEl, containerEl, optX, optY, optW, optH) {
        if (!hostEl) return;
        let fillEl = hostEl._offCanvasFill;
        if (!fillEl) {
            fillEl = hostEl.querySelector('.widget-off-canvas-fill');
            if (!fillEl) {
                fillEl = document.createElement('div');
                fillEl.className = 'widget-off-canvas-fill';
                fillEl.setAttribute('aria-hidden', 'true');
                hostEl.appendChild(fillEl);
            }
            hostEl._offCanvasFill = fillEl;
        }

        const targetCont = containerEl || hostEl;

        const resetStyles = function () {
            if (hostEl.style.clipPath) hostEl.style.clipPath = '';
            if (hostEl.style.visibility) hostEl.style.visibility = '';
            if (hostEl.classList.contains('widget-off-canvas')) hostEl.classList.remove('widget-off-canvas');
            if (targetCont !== hostEl) {
                if (targetCont.style.clipPath) targetCont.style.clipPath = '';
                if (targetCont.style.visibility) targetCont.style.visibility = '';
            }
            if (fillEl && fillEl.style.clipPath) fillEl.style.clipPath = '';
        };

        if (typeof window !== "undefined" && window.IS_VIEWER === true) {
            resetStyles();
            return;
        }
        if (typeof Dashboard === "undefined" || !Dashboard.isEditMode || Dashboard._holdLivePreviewActive) {
            resetStyles();
            return;
        }
        if (BaseWidget.isResponsiveMode()) {
            resetStyles();
            return;
        }

        const x = (typeof optX === "number" && Number.isFinite(optX)) ? optX : parseFloat(hostEl.style.left) || 0;
        const y = (typeof optY === "number" && Number.isFinite(optY)) ? optY : parseFloat(hostEl.style.top) || 0;
        const width = (typeof optW === "number" && Number.isFinite(optW)) ? optW : (hostEl.offsetWidth || 0);
        const height = (typeof optH === "number" && Number.isFinite(optH)) ? optH : (hostEl.offsetHeight || 0);

        let boundsW = 0;
        let boundsH = 0;
        if (typeof MASTER_SETTINGS !== "undefined" && MASTER_SETTINGS.canvasWidth > 0 && MASTER_SETTINGS.canvasHeight > 0) {
            boundsW = Number(MASTER_SETTINGS.canvasWidth);
            boundsH = Number(MASTER_SETTINGS.canvasHeight);
        } else {
            const canvasEl = document.getElementById("dashboard-canvas");
            boundsW = canvasEl ? (canvasEl.clientWidth || canvasEl.offsetWidth || 0) : 0;
            boundsH = canvasEl ? (canvasEl.clientHeight || canvasEl.offsetHeight || 0) : 0;
        }

        if (boundsW <= 0 || boundsH <= 0) return;

        const isFullyInside = (x >= 0) && (y >= 0) && ((x + width) <= boundsW) && ((y + height) <= boundsH);
        if (isFullyInside) {
            resetStyles();
            return;
        }

        const isCompletelyOutside = ((x + width) <= 0) || (x >= boundsW) || ((y + height) <= 0) || (y >= boundsH);
        if (isCompletelyOutside) {
            if (targetCont !== hostEl) {
                if (targetCont.style.visibility !== 'hidden') targetCont.style.visibility = 'hidden';
                if (targetCont.style.clipPath) targetCont.style.clipPath = '';
            } else {
                if (targetCont.style.visibility !== 'hidden') targetCont.style.visibility = 'hidden';
            }
            if (hostEl.style.clipPath) hostEl.style.clipPath = '';
            if (hostEl.style.visibility) hostEl.style.visibility = '';
            if (fillEl && fillEl.style.clipPath) fillEl.style.clipPath = '';
            if (!hostEl.classList.contains('widget-off-canvas')) hostEl.classList.add('widget-off-canvas');
            return;
        }

        const leftInset = Math.max(0, -x);
        const topInset = Math.max(0, -y);
        const rightInset = Math.max(0, (x + width) - boundsW);
        const bottomInset = Math.max(0, (y + height) - boundsH);
        const nextClip = "inset(" + topInset + "px " + rightInset + "px " + bottomInset + "px " + leftInset + "px)";

        if (targetCont !== hostEl) {
            if (targetCont.style.clipPath !== nextClip) targetCont.style.clipPath = nextClip;
            if (targetCont.style.visibility) targetCont.style.visibility = '';
            if (hostEl.style.clipPath) hostEl.style.clipPath = '';
            if (hostEl.style.visibility) hostEl.style.visibility = '';
        } else {
            if (hostEl.style.clipPath !== nextClip) hostEl.style.clipPath = nextClip;
            if (hostEl.style.visibility) hostEl.style.visibility = '';
        }

        if (fillEl) {
            const inLeft = leftInset;
            const inTop = topInset;
            const inRight = Math.max(inLeft, width - rightInset);
            const inBottom = Math.max(inTop, height - bottomInset);
            const fillClip = "polygon(evenodd, 0px 0px, " + width + "px 0px, " + width + "px " + height + "px, 0px " + height + "px, 0px 0px, "
                + inLeft + "px " + inTop + "px, " + inRight + "px " + inTop + "px, " + inRight + "px " + inBottom + "px, " + inLeft + "px " + inBottom + "px, " + inLeft + "px " + inTop + "px)";
            if (fillEl.style.clipPath !== fillClip) fillEl.style.clipPath = fillClip;
        }

        if (!hostEl.classList.contains('widget-off-canvas')) hostEl.classList.add('widget-off-canvas');
    }

    static syncElementCanvasClipping(el, optX, optY, optW, optH) {
        BaseWidget.syncCompanionCanvasClipping(el, el, optX, optY, optW, optH);
    }

    /** True when the dashboard is running in Responsive Columns layout mode. */
    static isResponsiveMode() {
        return (typeof MASTER_SETTINGS !== 'undefined'
            && MASTER_SETTINGS
            && MASTER_SETTINGS.layoutMode === 'responsive');
    }

    /**
     * True when the widget uses the responsive grid for layout (false inside an
     * open group in Responsive Columns, where members edit as Fixed Resolution).
     */
    static usesResponsiveGridLayout(widgetOrId) {
        if (!BaseWidget.isResponsiveMode()) return false;
        const widgetId = typeof widgetOrId === 'string' ? widgetOrId : (widgetOrId && widgetOrId.id);
        // Gallery thumbnails are not canvas grid items. They keep fixed pixel geometry.
        if (widgetId && String(widgetId).indexOf('awgprev_') === 0) return false;
        if (widgetId && typeof Dashboard !== 'undefined'
            && typeof Dashboard.isWidgetCompositeAuthoring === 'function'
            && Dashboard.isWidgetCompositeAuthoring(widgetId)) {
            return false;
        }
        return true;
    }

    /**
     * Read a widget's nested Responsive Layout blob (`overrides.layout.responsive`)
     * as an object, or null when unset. Returns null outside Responsive Columns mode
     * so saved responsive settings never affect Fixed Resolution or Scale to Fit.
     */
    static getResponsiveLayout(overrides) {
        if (!BaseWidget.isResponsiveMode()) return null;
        if (!overrides || typeof overrides !== 'object') return null;
        const layout = overrides.layout;
        if (!layout || typeof layout !== 'object') return null;
        const resp = layout.responsive;
        return (resp && typeof resp === 'object') ? resp : null;
    }

    /** Responsive Columns scale mode: `resize` (default) or `rescale`. */
    static normalizeResponsiveScaleMode(raw) {
        return raw === 'rescale' ? 'rescale' : 'resize';
    }

    static getResponsiveScaleMode(overrides) {
        const resp = BaseWidget.getResponsiveLayout(overrides);
        if (!resp) return 'resize';
        return BaseWidget.normalizeResponsiveScaleMode(resp.scaleMode);
    }

    static isResponsiveRescaleMode(overrides) {
        return BaseWidget.isResponsiveMode()
            && BaseWidget.getResponsiveScaleMode(overrides) === 'rescale';
    }

    /** True when fixed-layout auto width/height (fit to content) may apply.
     *  Open-group authoring is a free-form pixel canvas, same as Fixed Resolution.
     *  Closed group Rescale members keep their fixed scaled rect (no fit-content). */
    static allowFixedLayoutAutoSize(widget) {
        if (!widget) return true;
        if (!BaseWidget.usesResponsiveGridLayout(widget)) return true;
        if (BaseWidget.widgetUsesGroupCompositeRescale(widget)) return false;
        return BaseWidget.widgetUsesResponsiveRescale(widget);
    }

    /** Closed composite group member while the group uses Scale Mode Rescale. */
    static widgetUsesGroupCompositeRescale(widget) {
        if (!widget || !BaseWidget.isResponsiveMode()) return false;
        if (typeof Dashboard === 'undefined' || typeof Dashboard.getWidgetCompositeContext !== 'function'
                || typeof Dashboard.getGroupScaleMode !== 'function') return false;
        const ctx = Dashboard.getWidgetCompositeContext(widget.id);
        if (!ctx || ctx.open) return false;
        return Dashboard.getGroupScaleMode(ctx.groupId) === 'rescale';
    }

    /** True when this widget scales its own inner content while its container chrome
     *  (border, radius, glow, padding) stays at native pixel size. Group Rescale members
     *  do this too: the group positions them at a uniformly scaled, centered rect, and
     *  each member then scales only its inner content to fit that rect. */
    static widgetUsesResponsiveRescale(widget) {
        if (!widget || !BaseWidget.isResponsiveMode()) return false;
        if (BaseWidget.widgetUsesGroupCompositeRescale(widget)) return true;
        return BaseWidget.getResponsiveScaleMode(widget.overrides) === 'rescale';
    }

    // Metadata for the UI (Name, Icon, Description)
    static get metadata() {
        return { label: "Base Widget", icon: "ph-cube" };
    }

    // Default Local Overrides (Per-instance settings)
    getDefaultOverrides() { return {}; }

    // Schema for Local Settings (Per-instance editor)
    getSchema() { return []; }

    // Global Settings (Injected into MASTER_SETTINGS)
    // Override this in subclasses to define defaults like 'gaugeCol0'
    static get globalSettings() { return {}; }

    // Global Schema (Injected into GLOBAL EDITOR)
    // Override this in subclasses to define how 'gaugeCol0' is edited
    static get globalSchema() { return []; }

    /** Override in widgets that load raster URLs. Read-only: do not mutate overrides. */
    static extractPreloadImageUrls(overrides) {
        return [];
    }

    /**
     * Master setting `widgetLabelMode` with legacy `showWidgetLabels` (true=always, false=hide).
     * @returns {'hide'|'always'|'hover'}
     */
    static resolveWidgetLabelMode() {
        const m = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        if (typeof m.widgetLabelMode === 'string' && m.widgetLabelMode) {
            const v = m.widgetLabelMode.toLowerCase();
            if (v === 'hide' || v === 'always' || v === 'hover') return v;
        }
        if (m.showWidgetLabels === true) return 'always';
        if (m.showWidgetLabels === false) return 'hide';
        return 'hover';
    }

    /**
     * Standard nested typography property ↔ flat key suffix (e.g. fontFamily ↔ Font → menuLabelFont).
     * Widgets can add role-specific props via `extraByRole` in applyTypographyNestedToConfig.
     */
    static get TYPOGRAPHY_PROP_SUFFIX_PAIRS() {
        return [
            ['fontFamily', 'Font'],
            ['fontSize', 'Fs'],
            ['textAlign', 'Align'],
            ['textTransform', 'Case'],
            ['bold', 'Bold'],
            ['italic', 'Italic'],
            ['colorOff', 'ColOff'],
            ['color', 'Col'],
            ['opacity', 'Opacity'],
            ['offsetX', 'OffX'],
            ['offsetY', 'OffY']
        ];
    }

    static _typographySuffixToPropMap() {
        if (!BaseWidget._cachedSuffixToProp) {
            const o = Object.create(null);
            BaseWidget.TYPOGRAPHY_PROP_SUFFIX_PAIRS.forEach(function (pair) {
                o[pair[1]] = pair[0];
            });
            BaseWidget._cachedSuffixToProp = o;
        }
        return BaseWidget._cachedSuffixToProp;
    }

    static _typographyPropToSuffixStandard() {
        if (!BaseWidget._cachedPropToSuffix) {
            const o = Object.create(null);
            BaseWidget.TYPOGRAPHY_PROP_SUFFIX_PAIRS.forEach(function (pair) {
                o[pair[0]] = pair[1];
            });
            BaseWidget._cachedPropToSuffix = o;
        }
        return BaseWidget._cachedPropToSuffix;
    }

    /**
     * Maps a flat typography field key (e.g. menuLabelFont) to nested storage property (e.g. fontFamily).
     * Returns null if key does not belong to prefix. Extra schema fields should use `typographyNestedProp`.
     */
    static typographyFlatKeyToNestedProp(flatKey, prefix) {
        if (!flatKey || !prefix || flatKey.indexOf(prefix) !== 0) return null;
        const rest = flatKey.slice(prefix.length);
        const map = BaseWidget._typographySuffixToPropMap();
        return map[rest] != null ? map[rest] : null;
    }

    /**
     * Flattens `c.typography[role]` objects onto `prefix + suffix` keys used by applyTypographyToElement and the editor.
     * @param {object} c config bag (must include typography root if present)
     * @param {Array<[string,string]>} rolePrefixTuples [nestedRole, flatPrefix] e.g. ['mdTh','textMdTh']
     * @param {object} [options]
     * @param {function(string,string):boolean} [options.skipWhen] return true to skip copying (role, prop)
     * @param {object<string,object<string,string>>} [options.extraByRole] per-role prop→suffix for custom nested props
     */
    static applyTypographyNestedToConfig(c, rolePrefixTuples, options) {
        if (!c || !Array.isArray(rolePrefixTuples)) return;
        options = options || {};
        const skipWhen = typeof options.skipWhen === 'function' ? options.skipWhen : null;
        const extraByRole = options.extraByRole && typeof options.extraByRole === 'object' ? options.extraByRole : null;
        const standard = BaseWidget._typographyPropToSuffixStandard();

        const root = c.typography;
        if (!root || typeof root !== 'object') return;

        for (let i = 0; i < rolePrefixTuples.length; i++) {
            const role = rolePrefixTuples[i][0];
            const prefix = rolePrefixTuples[i][1];
            const block = root[role];
            if (!block || typeof block !== 'object') continue;
            const extras = extraByRole && extraByRole[role] ? extraByRole[role] : {};
            const propToSuffix = Object.assign(Object.create(null), standard, extras);
            const props = Object.keys(block);
            for (let j = 0; j < props.length; j++) {
                const prop = props[j];
                if (skipWhen && skipWhen(role, prop)) continue;
                const suffix = propToSuffix[prop];
                if (!suffix) continue;
                c[prefix + suffix] = block[prop];
            }
        }
    }

    /**
     * Builds `{ path, configKey }[]` for nested typography MQTT bindings (same role/prefix tuples as flatten).
     * @param {Array<[string,string]>} rolePrefixTuples [nestedRole, flatPrefix]
     * @param {object} [options] same shape as applyTypographyNestedToConfig options
     */
    static buildTypographyBindingOverlaySpec(rolePrefixTuples, options) {
        const spec = [];
        if (!Array.isArray(rolePrefixTuples)) return spec;
        options = options || {};
        const skipWhen = typeof options.skipWhen === 'function' ? options.skipWhen : null;
        const extraByRole = options.extraByRole && typeof options.extraByRole === 'object' ? options.extraByRole : null;
        const standard = BaseWidget._typographyPropToSuffixStandard();

        for (let i = 0; i < rolePrefixTuples.length; i++) {
            const role = rolePrefixTuples[i][0];
            const prefix = rolePrefixTuples[i][1];
            const extras = extraByRole && extraByRole[role] ? extraByRole[role] : {};
            const propToSuffix = Object.assign(Object.create(null), standard, extras);
            const props = Object.keys(propToSuffix);
            for (let j = 0; j < props.length; j++) {
                const prop = props[j];
                if (skipWhen && skipWhen(role, prop)) continue;
                const suffix = propToSuffix[prop];
                if (!suffix) continue;
                spec.push({
                    path: ['typography', role, prop],
                    configKey: prefix + suffix
                });
            }
        }
        return spec;
    }

    /**
     * True when nested override, flat override, or nested/legacy flat binding is set for a typography field.
     */
    static hasTypographySetting(overrides, bindings, role, nestedProp, flatKey) {
        if (!role || !nestedProp) return false;
        const o = overrides && typeof overrides === 'object' ? overrides : null;
        const b = bindings && typeof bindings === 'object' ? bindings : null;

        if (flatKey && o && Object.prototype.hasOwnProperty.call(o, flatKey) && o[flatKey] !== undefined && o[flatKey] !== null) {
            if (nestedProp === 'bold' || nestedProp === 'italic') return true;
            if (String(o[flatKey]).trim() !== '' || o[flatKey] === false || o[flatKey] === 0) return true;
        }
        if (o && o.typography && typeof o.typography === 'object') {
            const block = o.typography[role];
            if (block && typeof block === 'object' && Object.prototype.hasOwnProperty.call(block, nestedProp)) {
                return true;
            }
        }
        if (typeof BindingsTree !== 'undefined' && b) {
            const nestedTopic = BindingsTree.getAtPath(b, ['typography', role, nestedProp]);
            if (typeof nestedTopic === 'string' && nestedTopic !== '') return true;
        }
        if (flatKey && b && typeof b[flatKey] === 'string' && b[flatKey] !== '') return true;
        return false;
    }

    /** Overlay live MQTT on flat typography keys after nested flatten. */
    static applyTypographyBindingOverlay(widget, config, rolePrefixTuples, options) {
        const spec = BaseWidget.buildTypographyBindingOverlaySpec(rolePrefixTuples, options);
        BaseWidget.applyNestedBindingOverlay(widget, config, spec);
    }

    /** Master typography horizontal alignment (matches data-config default). */
    static resolveMasterTextAlign(M) {
        const m = M || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {});
        return m.defaultTextAlign || 'center';
    }

    /** Shared DOM chrome for optional widget label elements (no extra inset; container padding applies). */
    static applyWidgetLabelElementChrome(el, className) {
        if (!el) return;
        el.className = className || 'widget-label';
        el.style.padding = '0';
        el.style.letterSpacing = '1px';
        el.style.width = '100%';
        el.style.boxSizing = 'border-box';
        el.style.flexShrink = '0';
    }

    static getWidgetLabelTypographySchemaOptions(prefix, nestedRole, extraOptions) {
        const role = nestedRole || 'widgetLabel';
        const opts = {
            exclude: ['opacity', 'colorOff'],
            nestedTypography: { root: 'typography', role: role },
            fontDefaultKey: 'fontFamily',
            fontSizeDefaultKey: 'defaultFsLabel',
            colorDefaultKey: 'defaultColLabel',
            alignDefaultKey: 'defaultTextAlign',
            alignLabel: 'Horizontal Alignment',
            caseDefaultKey: 'defaultLabelCase',
            caseLabel: 'Label Case',
            caseOptions: [
                { value: 'uppercase', text: 'UPPERCASE' },
                { value: 'capitalize', text: 'Capitalize' },
                { value: 'lowercase', text: 'lowercase' },
                { value: 'none', text: 'None' }
            ],
            boldDefaultKey: 'defaultLabelBold',
            italicDefaultKey: 'defaultLabelItalic'
        };
        if (extraOptions && typeof extraOptions === 'object') {
            Object.assign(opts, extraOptions);
        }
        return opts;
    }

    static getWidgetLabelTypographySchema(prefix, nestedRole, extraOptions) {
        const opts = BaseWidget.getWidgetLabelTypographySchemaOptions(prefix, nestedRole, extraOptions);
        return BaseWidget.getTypographySchema(prefix, 'Widget Label', opts);
    }

    /** Resolve unset flat typography keys for a widget label role from master defaults. */
    static fillWidgetLabelTypographyResolved(c, M, prefix, options) {
        if (!c || !prefix) return;
        const settings = M || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {});
        const fontK = `${prefix}Font`;
        const fsK = `${prefix}Fs`;
        const colK = `${prefix}Col`;
        const alignK = `${prefix}Align`;
        const caseK = `${prefix}Case`;
        const boldK = `${prefix}Bold`;
        const italicK = `${prefix}Italic`;
        const offXK = `${prefix}OffX`;
        const offYK = `${prefix}OffY`;
        const opK = `${prefix}Opacity`;

        if (!c[fontK]) {
            c[fontK] = c.fontFamily || settings.fontFamily || "'Inter', sans-serif";
        }
        if (c[fsK] == null || c[fsK] === '') {
            c[fsK] = settings.defaultFsLabel != null ? settings.defaultFsLabel : 12;
        }
        if (!c[colK]) {
            c[colK] = settings.defaultColLabel || '@textMuted';
        }
        if (!c[alignK]) {
            c[alignK] = BaseWidget.resolveMasterTextAlign(settings);
        }
        if (!c[caseK]) {
            c[caseK] = settings.defaultLabelCase || 'uppercase';
        }
        if (c[boldK] === undefined || c[boldK] === null) {
            c[boldK] = settings.defaultLabelBold === true;
        }
        if (c[italicK] === undefined || c[italicK] === null) {
            c[italicK] = settings.defaultLabelItalic === true;
        }
        if (options && options.resolveOpacity && (c[opK] === undefined || c[opK] === null || c[opK] === '')) {
            c[opK] = 100;
        }
        if (c[offXK] === undefined || c[offXK] === null) {
            c[offXK] = 0;
        }
        if (c[offYK] === undefined || c[offYK] === null) {
            c[offYK] = 0;
        }
    }

    // Reusable utility for Typography fields
    static getTypographySchema(prefix, title, options = {}) {
        // Inspector widths are equalized per row by Editor.equalizeInspectorGrid:
        // `cols` below only declares row membership (which fields share a row).
        // Visible cells share the row equally; hidden/spacers collapse. Opt-in
        // exception: `fixedCols: 1-12` keeps a width (siblings share the rest),
        // or `equalize: false` keeps the authored `cols`.
        const exclude = options.exclude || [];
        const dualColor = options.dualColor === true;
        const dualColorOffDefaultKey = options.dualColorOffDefaultKey || null;
        const dualColorOnDefaultKey = options.dualColorOnDefaultKey != null ? options.dualColorOnDefaultKey : 'defaultColLabel';
        const nestedTypography = options.nestedTypography;
        const fields = [];

        const fontFamilyLabel = options.fontFamilyLabel || 'Font Family';
        const fontSizeLabel = options.fontSizeLabel || 'Font Size';
        const alignLabel = options.alignLabel || 'Alignment';
        const caseLabel = options.caseLabel || 'Case';
        const boldLabel = options.boldLabel || 'Bold';
        const italicLabel = options.italicLabel || 'Italic';
        const opacityLabel = options.opacityLabel || 'Opacity';
        const offsetXLabel = options.offsetXLabel || 'Offset X';
        const offsetYLabel = options.offsetYLabel || 'Offset Y';
        const singleColorLabel = options.singleColorLabel || 'Color';
        const dualColorOnLabel = options.dualColorOnLabel || 'Color On';
        const dualColorOffLabel = options.dualColorOffLabel || 'Color Off';

        const fontDefaultKey = options.fontDefaultKey !== undefined ? options.fontDefaultKey : 'fontFamily';
        const fontSizeDefaultKey = options.fontSizeDefaultKey !== undefined ? options.fontSizeDefaultKey : 'defaultFsLabel';
        const alignDefaultKey = options.alignDefaultKey !== undefined ? options.alignDefaultKey : 'defaultTextAlign';
        const caseDefaultKey = options.caseDefaultKey !== undefined ? options.caseDefaultKey : 'defaultLabelCase';
        const boldDefaultKey = options.boldDefaultKey !== undefined ? options.boldDefaultKey : 'defaultLabelBold';
        const italicDefaultKey = options.italicDefaultKey !== undefined ? options.italicDefaultKey : 'defaultLabelItalic';
        const colorDefaultKey = options.colorDefaultKey !== undefined ? options.colorDefaultKey : 'defaultColLabel';
        const opacityDefaultKey = options.opacityDefaultKey !== undefined ? options.opacityDefaultKey : null;
        const offXDefaultKey = options.offXDefaultKey !== undefined ? options.offXDefaultKey : null;
        const offYDefaultKey = options.offYDefaultKey !== undefined ? options.offYDefaultKey : null;

        // 12-column grid as three visual columns (each unit = 4 cols): see editor layout rows below.
        if (!exclude.includes('fontFamily')) {
            const f = { key: `${prefix}Font`, type: 'select', label: fontFamilyLabel, options: window.AVAILABLE_FONTS || [], cols: 8 };
            if (fontDefaultKey) f.defaultKey = fontDefaultKey;
            if (options.fontDefaultKeyFallback) f.defaultKeyFallback = options.fontDefaultKeyFallback;
            fields.push(f);
        }
        if (!exclude.includes('size')) {
            const f = { key: `${prefix}Fs`, type: 'number', label: fontSizeLabel, cols: 4 };
            if (fontSizeDefaultKey) f.defaultKey = fontSizeDefaultKey;
            fields.push(f);
        }
        if (!exclude.includes('align')) {
            fields.push({
                key: `${prefix}Align`, type: 'select', label: alignLabel, options: [
                    { value: 'left', text: 'Left' }, { value: 'center', text: 'Center' }, { value: 'right', text: 'Right' }
                ], cols: 4, defaultKey: alignDefaultKey
            });
        }
        if (!exclude.includes('case')) {
            const caseOptions = Array.isArray(options.caseOptions) && options.caseOptions.length
                ? options.caseOptions
                : [
                    { value: 'uppercase', text: 'UPPERCASE' }, { value: 'capitalize', text: 'Capitalize' },
                    { value: 'lowercase', text: 'lowercase' }, { value: 'none', text: 'None' }
                ];
            fields.push({
                key: `${prefix}Case`, type: 'select', label: caseLabel, options: caseOptions,
                cols: 8, defaultKey: caseDefaultKey
            });
        }
        if (!exclude.includes('bold')) {
            fields.push({ key: `${prefix}Bold`, type: 'checkbox', label: boldLabel, cols: 4, defaultKey: boldDefaultKey });
        }
        if (!exclude.includes('italic')) {
            fields.push({ key: `${prefix}Italic`, type: 'checkbox', label: italicLabel, cols: 4, defaultKey: italicDefaultKey });
        }
        const extraFieldsInsert = options.extraFieldsInsert;
        const insertExtraAfterColor = extraFieldsInsert === 'afterColor';
        const extraFieldCopies = Array.isArray(options.extraFields)
            ? options.extraFields.map(function (ef) { return Object.assign({}, ef); })
            : [];
        let extraFieldsRemaining = extraFieldCopies.slice();

        if (!exclude.includes('color')) {
            if (dualColor) {
                fields.push({
                    key: `${prefix}Col`,
                    type: 'color',
                    label: dualColorOnLabel,
                    cols: 4,
                    defaultKey: dualColorOnDefaultKey,
                    gridColStart: 1
                });
                const offField = { key: `${prefix}ColOff`, type: 'color', label: dualColorOffLabel, cols: 4 };
                if (dualColorOffDefaultKey) offField.defaultKey = dualColorOffDefaultKey;
                fields.push(offField);
                if (insertExtraAfterColor && extraFieldsRemaining.length) {
                    for (let xi = 0; xi < extraFieldsRemaining.length; xi++) {
                        fields.push(extraFieldsRemaining[xi]);
                    }
                    extraFieldsRemaining = [];
                }
            } else {
                const colCols = options.singleColorCols != null ? options.singleColorCols : 8;
                const f = {
                    key: `${prefix}Col`,
                    type: 'color',
                    label: singleColorLabel,
                    cols: colCols,
                    gridColStart: 1
                };
                if (colorDefaultKey) f.defaultKey = colorDefaultKey;
                fields.push(f);
                if (insertExtraAfterColor && extraFieldsRemaining.length) {
                    for (let xi = 0; xi < extraFieldsRemaining.length; xi++) {
                        fields.push(extraFieldsRemaining[xi]);
                    }
                    extraFieldsRemaining = [];
                }
            }
        }
        if (!exclude.includes('opacity')) {
            const f = { key: `${prefix}Opacity`, type: 'number', label: opacityLabel, min: 0, max: 100, cols: 4 };
            if (opacityDefaultKey) f.defaultKey = opacityDefaultKey;
            fields.push(f);
        }
        if (!exclude.includes('offset')) {
            const fx = { key: `${prefix}OffX`, type: 'number', label: offsetXLabel, cols: 4, gridColStart: 1 };
            if (offXDefaultKey) fx.defaultKey = offXDefaultKey;
            fields.push(fx);
            const fy = { key: `${prefix}OffY`, type: 'number', label: offsetYLabel, cols: 4 };
            if (offYDefaultKey) fy.defaultKey = offYDefaultKey;
            fields.push(fy);
        }

        if (extraFieldsRemaining.length > 0) {
            for (let ei = 0; ei < extraFieldsRemaining.length; ei++) {
                fields.push(extraFieldsRemaining[ei]);
            }
        }

        if (nestedTypography && nestedTypography.root && nestedTypography.role) {
            const ntRoot = nestedTypography.root;
            const ntRole = nestedTypography.role;
            fields.forEach((field) => {
                if (field.typographyNested && field.typographyNested.root && field.typographyNested.role && field.typographyNested.prop) {
                    return;
                }
                if (field.typographyNestedProp) {
                    field.typographyNested = { root: ntRoot, role: ntRole, prop: field.typographyNestedProp };
                    return;
                }
                const prop = BaseWidget.typographyFlatKeyToNestedProp(field.key, prefix);
                if (prop) {
                    field.typographyNested = { root: ntRoot, role: ntRole, prop };
                }
            });
        }

        const group = {
            key: `group_${prefix}`, // dummy key so it renders
            cols: 12,
            type: 'typography',
            label: title,
            fields: fields
        };
        if (typeof options.dynamicLabel === 'function') {
            group.dynamicLabel = options.dynamicLabel;
        }
        if (Array.isArray(options.dependsOn) && options.dependsOn.length > 0) {
            group.dependsOn = options.dependsOn.slice();
        }
        if (Object.prototype.hasOwnProperty.call(options, 'headerSuffix')) {
            const hs = options.headerSuffix;
            const trimmed = hs != null ? String(hs).trim() : '';
            if (trimmed !== '') {
                group.typographyHeaderSuffix = trimmed;
            }
        }
        if (typeof options.groupVisibleWhen === 'function') {
            group.visibleWhen = options.groupVisibleWhen;
        }
        if (Array.isArray(options.groupDependsOn) && options.groupDependsOn.length > 0) {
            group.dependsOn = options.groupDependsOn;
        }
        return group;
    }

    /** Allowed Phosphor web-font weights for the shared icon-style slideout (see `phosphorWeightClass`). */
    static get PHOSPHOR_ICON_WEIGHTS() {
        return ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'];
    }

    /**
     * Maps stored `weight` string to the Phosphor CSS class prefix (Regular uses base `ph`).
     */
    static phosphorWeightClass(weight) {
        const w = weight == null ? '' : String(weight).toLowerCase().trim();
        if (w === 'thin') return 'ph-thin';
        if (w === 'light') return 'ph-light';
        if (w === 'regular') return 'ph';
        if (w === 'bold') return 'ph-bold';
        if (w === 'duotone') return 'ph-duotone';
        if (w === 'fill') return 'ph-fill';
        return 'ph-fill';
    }

    /**
     * Logical keys: source, builtin, weight, customUrl, tintImage, color, hoverColor, accentColor, size, offsetX, offsetY, rotation.
     * keyMap maps each to a concrete overrides key (e.g. menu item iconOn).
     * Use options.exclude (e.g. ['color','hoverColor','size','transform']) to omit rows; menu uses Appearance for uniform icon size.
     * Use options.pairWeightAndSize when **km.weight** and **km.size** are both present: **Style** and **Icon size** share one row.
     * Widths are equalized per row by Editor.equalizeInspectorGrid (`cols` is
     * row membership only; `fixedCols`/`equalize: false` opts out).
     */
    static getIconStyleFieldDefinitions(keyMap, options = {}) {
        const exclude = new Set(options.exclude || []);
        const km = keyMap || {};
        const pairWs = options.pairWeightAndSize === true && !!km.weight && !!km.size && !exclude.has('size');
        const sk = km.source;
        const srcVal = (values) => {
            const v = values[sk];
            if (v === 'custom' || v === 'favicon') return 'custom';
            return 'phosphor';
        };
        const fields = [];

        fields.push({
            key: sk,
            type: 'select',
            label: 'Icon source',
            cols: 12,
            options: [
                { value: 'phosphor', text: 'Phosphor icon' },
                { value: 'custom', text: 'Custom image' },
                { value: 'favicon', text: 'URL favicon' }
            ]
        });

        if (km.builtin) {
            fields.push({
                key: km.builtin,
                type: 'icon_input',
                label: 'Icon name',
                cols: 12,
                weightFieldKey: km.weight || null,
                dependsOn: km.weight ? [sk, km.weight] : [sk],
                visibleWhen: (values) => srcVal(values) === 'phosphor'
            });
        }
        if (km.weight) {
            fields.push({
                key: km.weight,
                type: 'select',
                label: 'Style',
                cols: pairWs ? 6 : 12,
                gridColStart: pairWs ? 1 : undefined,
                options: [
                    { value: 'thin', text: 'Thin' },
                    { value: 'light', text: 'Light' },
                    { value: 'regular', text: 'Regular' },
                    { value: 'bold', text: 'Bold' },
                    { value: 'fill', text: 'Fill' },
                    { value: 'duotone', text: 'Duotone' }
                ],
                dependsOn: [sk],
                visibleWhen: (values) => srcVal(values) === 'phosphor'
            });
        }
        if (km.size && !exclude.has('size')) {
            fields.push({
                key: km.size,
                type: 'number',
                label: 'Icon size',
                cols: pairWs ? 6 : 12,
                gridColStart: pairWs ? 7 : undefined,
                dependsOn: pairWs ? [sk] : [],
                min: 8,
                max: 256
            });
        }
        if (km.customUrl) {
            fields.push({
                key: km.customUrl,
                type: 'text',
                label: 'Image URL',
                cols: 12,
                imagePicker: true,
                dependsOn: [sk],
                visibleWhen: (values) => srcVal(values) === 'custom' && values[sk] !== 'favicon'
            });
        }
        if (km.tintImage && !exclude.has('tintImage')) {
            fields.push({
                key: km.tintImage,
                type: 'checkbox',
                label: 'Tint with icon color',
                cols: 12,
                dependsOn: [sk],
                visibleWhen: (values) => srcVal(values) === 'custom' && values[sk] !== 'favicon'
            });
        }
        if (km.color && !exclude.has('color')) {
            fields.push({
                key: km.color,
                type: 'color',
                label: 'Color',
                cols: 6,
                dependsOn: [sk],
                gridColStart: 1
            });
        }
        if (km.accentColor && !exclude.has('accentColor')) {
            fields.push({
                key: km.accentColor,
                type: 'color',
                label: 'Accent Color',
                cols: 6,
                dependsOn: [sk, km.weight],
                visibleWhen: (values) => srcVal(values) === 'phosphor' && values[km.weight] === 'duotone'
            });
        }
        if (km.hoverColor && !exclude.has('hoverColor')) {
            fields.push({
                key: km.hoverColor,
                type: 'color',
                label: 'Hover color',
                cols: 6,
                dependsOn: [sk]
            });
        }

        if (!exclude.has('transform') && km.offsetX && km.offsetY && km.rotation) {
            fields.push({
                key: km.offsetX,
                type: 'number',
                label: 'Offset X',
                cols: 4,
                gridColStart: 1
            });
            fields.push({
                key: km.offsetY,
                type: 'number',
                label: 'Offset Y',
                cols: 4
            });
            fields.push({
                key: km.rotation,
                type: 'number',
                label: 'Rotation',
                min: -360,
                max: 360,
                cols: 4
            });
        }

        return fields;
    }

    /**
     * @param {string} title - Primary label prefix (shown bold before the section suffix).
     * @param {object} keyMap - Flat overrides keys (`source`, `builtin`, …) for {@link BaseWidget.getIconStyleFieldDefinitions}.
     * @param {object} [options]
     * @param {string[]} [options.exclude] - Field logical keys to omit from the slideout body.
     * @param {string} [options.headerSuffix] - Muted trailing title (default **`Icon Style`** in the editor).
     *   Paired-slot leaders often use **`Base Icon Style`** when the follower inherits glyph/transform until customized.
     */
    static getIconStyleSchema(title, keyMap, options = {}) {
        const km = keyMap || {};
        const fields = BaseWidget.getIconStyleFieldDefinitions(km, options);
        const groupKey = `group_icon_style_${km.source || 'icon'}`;
        const group = {
            key: groupKey,
            cols: 12,
            type: 'icon_style',
            label: title,
            fields,
            iconStyleKeyMap: { ...km }
        };
        if (Object.prototype.hasOwnProperty.call(options, 'headerSuffix')) {
            const hs = options.headerSuffix;
            const trimmed = hs != null ? String(hs).trim() : '';
            if (trimmed !== '') {
                group.iconStyleHeaderSuffix = trimmed;
            }
        }
        return group;
    }

    /**
     * Maps icon-style schema field `key` values to nested `icons.on|off` property names (menu rows, binding defaults).
     */
    static get ICON_STYLE_NESTED_PROP_BY_FIELD_KEY() {
        return {
            iconSourceOn: 'source',
            iconOn: 'builtin',
            iconWeightOn: 'weight',
            imgOn: 'customUrl',
            colorizeOn: 'tintImage',
            iconSlotAccentOn: 'accentColor',
            iconSlotOffsetXOn: 'offsetX',
            iconSlotOffsetYOn: 'offsetY',
            iconSlotRotationOn: 'rotation',
            iconSize: 'size',
            iconSourceOff: 'source',
            iconOff: 'builtin',
            iconWeightOff: 'weight',
            imgOff: 'customUrl',
            colorizeOff: 'tintImage',
            iconSlotAccentOff: 'accentColor',
            iconSlotOffsetXOff: 'offsetX',
            iconSlotOffsetYOff: 'offsetY',
            iconSlotRotationOff: 'rotation',
            iconSlotSizeOff: 'size',
            iconSlotHoverOn: 'hoverColor',
            iconSlotHoverOff: 'hoverColor'
        };
    }

    /** Menu row binding keys that target `icons.off` (rest target `icons.on`). */
    static get MENU_ICON_OFF_SLOT_FIELD_KEYS() {
        return new Set([
            'iconSourceOff', 'iconOff', 'iconWeightOff', 'imgOff', 'colorizeOff',
            'iconSlotOffsetXOff', 'iconSlotOffsetYOff', 'iconSlotRotationOff',
            'iconSlotSizeOff'
        ]);
    }

    /** Editor `defaultKey` targets for duotone accent fields on icon_style groups. */
    static get ICON_ACCENT_MASTER_DEFAULT_KEYS() {
        return {
            iconSlotAccentOn: 'menuIconAccentOn',
            iconSlotAccentOff: 'menuIconAccentOff'
        };
    }

    static defaultIconAccentThemeRef() {
        return BaseWidget.themeTokenRef('iconAccent');
    }

    static _iconAccentStringSet(v) {
        return v !== undefined && v !== null && String(v).trim() !== '';
    }

    /**
     * Duotone accent for flatten/runtime: nested slot accent → master fallback → `@iconAccent`.
     */
    static resolveIconSlotAccentColor(slot, masterAccentFallback) {
        if (slot && BaseWidget._iconAccentStringSet(slot.accentColor)) return slot.accentColor;
        if (BaseWidget._iconAccentStringSet(masterAccentFallback)) return masterAccentFallback;
        return BaseWidget.defaultIconAccentThemeRef();
    }

    /**
     * Nested `icons` slot → flat offset/rotation keys (via keyMap). Missing or invalid values → 0.
     */
    static flattenIconSlotTransformFlat(slot, keyMap) {
        if (!slot || typeof slot !== 'object' || !keyMap || typeof keyMap !== 'object') return {};
        const out = {};
        const pickNum = (v) => {
            if (v === undefined || v === null || v === '') return 0;
            const n = typeof v === 'number' ? v : parseFloat(String(v).trim());
            return Number.isFinite(n) ? n : 0;
        };
        if (keyMap.offsetX) out[keyMap.offsetX] = pickNum(slot.offsetX);
        if (keyMap.offsetY) out[keyMap.offsetY] = pickNum(slot.offsetY);
        if (keyMap.rotation) out[keyMap.rotation] = pickNum(slot.rotation);
        return out;
    }

    /**
     * Sparse follower slot: `builtin` / `customUrl` stored as `''`, or invalid `source`, or empty `weight`, or
     * blank numeric transform fields should behave like “inherit from leader”, not block inheritance.
     * (Own key with empty placeholder is not a user override.)
     */
    static followerIconInheritPlaceholder(key, followerVal) {
        if (key === 'builtin' || key === 'customUrl') {
            return String(followerVal !== undefined && followerVal !== null ? followerVal : '').trim() === '';
        }
        if (key === 'source') {
            const raw = followerVal !== undefined && followerVal !== null ? String(followerVal).trim() : '';
            return raw !== 'custom' && raw !== 'phosphor' && raw !== 'favicon';
        }
        if (key === 'weight') {
            return String(followerVal !== undefined && followerVal !== null ? followerVal : '').trim() === '';
        }
        if (key === 'offsetX' || key === 'offsetY' || key === 'rotation') {
            return followerVal === undefined || followerVal === null || String(followerVal).trim() === '';
        }
        if (key === 'size') {
            if (followerVal === undefined || followerVal === null || followerVal === '') return true;
            const n = typeof followerVal === 'number' ? followerVal : parseFloat(String(followerVal).trim());
            return !Number.isFinite(n) || n <= 0;
        }
        if (key === 'hoverColor') {
            return followerVal === undefined || followerVal === null || String(followerVal).trim() === '';
        }
        return false;
    }

    /** Remove follower keys that only mean “inherit” so saves stay clean (switch sparse `icons.off`, etc.). */
    static stripIconFollowerInheritPlaceholders(follower, inheritKeys) {
        if (!follower || typeof follower !== 'object' || !inheritKeys || !inheritKeys.length) return;
        let si;
        for (si = 0; si < inheritKeys.length; si++) {
            const k = inheritKeys[si];
            if (!Object.prototype.hasOwnProperty.call(follower, k)) continue;
            if (BaseWidget.followerIconInheritPlaceholder(k, follower[k])) {
                delete follower[k];
            }
        }
    }

    /**
     * For paired icon slots where the follower omits inherited keys: build a merged slot for flatten/render only.
     * Each name in inheritKeys resolves from the follower unless the value is an inherit-placeholder (`''`
     * glyph/url, blank weight, blank transforms, …), then leader.
     * Any own properties on follower not listed in inheritKeys (e.g. per-slot color) are copied verbatim.
     * @param {object} leader
     * @param {object} follower
     * @param {string[]} inheritKeys
     */
    static resolveIconFollowerSlotFromLeader(leader, follower, inheritKeys) {
        const out = {};
        const L = leader && typeof leader === 'object' ? leader : {};
        const F = follower && typeof follower === 'object' ? follower : {};
        let i;
        for (i = 0; i < inheritKeys.length; i++) {
            const k = inheritKeys[i];
            const followerHas = Object.prototype.hasOwnProperty.call(F, k);
            const takeFollower = followerHas && !BaseWidget.followerIconInheritPlaceholder(k, F[k]);
            if (takeFollower) {
                out[k] = F[k];
            } else if (Object.prototype.hasOwnProperty.call(L, k)) {
                out[k] = L[k];
            }
        }
        Object.keys(F).forEach(function (fk) {
            let found = false;
            for (i = 0; i < inheritKeys.length; i++) {
                if (inheritKeys[i] === fk) {
                    found = true;
                    break;
                }
            }
            if (found) return;
            out[fk] = F[fk];
        });
        return out;
    }

    static get TYPOGRAPHY_INHERIT_PROPS() {
        return ['fontFamily', 'fontSize', 'color', 'bold'];
    }

    static followerTypographyInheritPlaceholder(prop, followerVal) {
        if (prop === 'bold') {
            return followerVal === undefined || followerVal === null;
        }
        if (prop === 'fontSize' || prop === 'opacity') {
            if (followerVal === undefined || followerVal === null || followerVal === '') return true;
            const n = typeof followerVal === 'number' ? followerVal : parseFloat(String(followerVal).trim());
            return !Number.isFinite(n);
        }
        return String(followerVal !== undefined && followerVal !== null ? followerVal : '').trim() === '';
    }

    static stripTypographyFollowerInheritPlaceholders(follower, inheritProps) {
        if (!follower || typeof follower !== 'object' || !inheritProps || !inheritProps.length) return;
        let si;
        for (si = 0; si < inheritProps.length; si++) {
            const k = inheritProps[si];
            if (!Object.prototype.hasOwnProperty.call(follower, k)) continue;
            if (BaseWidget.followerTypographyInheritPlaceholder(k, follower[k])) {
                delete follower[k];
            }
        }
    }

    static resolveTypographyFollowerFromLeader(leader, follower, inheritProps) {
        const out = {};
        const L = leader && typeof leader === 'object' ? leader : {};
        const F = follower && typeof follower === 'object' ? follower : {};
        const keys = inheritProps && inheritProps.length ? inheritProps : BaseWidget.TYPOGRAPHY_INHERIT_PROPS;
        let i;
        for (i = 0; i < keys.length; i++) {
            const k = keys[i];
            const followerHas = Object.prototype.hasOwnProperty.call(F, k);
            const takeFollower = followerHas && !BaseWidget.followerTypographyInheritPlaceholder(k, F[k]);
            if (takeFollower) {
                out[k] = F[k];
            } else if (Object.prototype.hasOwnProperty.call(L, k)) {
                out[k] = L[k];
            }
        }
        Object.keys(F).forEach(function (fk) {
            let found = false;
            for (i = 0; i < keys.length; i++) {
                if (keys[i] === fk) {
                    found = true;
                    break;
                }
            }
            if (found) return;
            out[fk] = F[fk];
        });
        return out;
    }

    /** Attach `iconsNested` on each leaf of an icon_style group (`slot`: `'on'` | `'off'`). */
    static attachIconsNestedToIconStyleGroup(group, slot) {
        if (!group || !Array.isArray(group.fields)) return;
        const b = BaseWidget.ICON_STYLE_NESTED_PROP_BY_FIELD_KEY;
        const map = slot === 'off'
            ? {
                iconSourceOff: b.iconSourceOff,
                iconOff: b.iconOff,
                iconWeightOff: b.iconWeightOff,
                imgOff: b.imgOff,
                colorizeOff: b.colorizeOff,
                iconSlotColOff: 'color',
                iconSlotHoverOff: 'hoverColor',
                iconSlotAccentOff: 'accentColor',
                iconSlotOffsetXOff: 'offsetX',
                iconSlotOffsetYOff: 'offsetY',
                iconSlotRotationOff: 'rotation',
                iconSlotSizeOff: 'size'
            }
            : {
                iconSourceOn: b.iconSourceOn,
                iconOn: b.iconOn,
                iconWeightOn: b.iconWeightOn,
                imgOn: b.imgOn,
                colorizeOn: b.colorizeOn,
                iconSlotColOn: 'color',
                iconSlotHoverOn: 'hoverColor',
                iconSlotAccentOn: 'accentColor',
                iconSlotOffsetXOn: 'offsetX',
                iconSlotOffsetYOn: 'offsetY',
                iconSlotRotationOn: 'rotation',
                iconSize: 'size'
            };
        group.fields.forEach((field) => {
            const prop = map[field.key];
            if (prop) field.iconsNested = { root: 'icons', slot, prop };
        });
    }

    /** Set `defaultKey` on accent color fields inside icon_style groups (for editor theme swatch). */
    static attachIconAccentFieldDefaultKeys(group, overrides) {
        if (!group || !Array.isArray(group.fields)) return;
        const map = { ...BaseWidget.ICON_ACCENT_MASTER_DEFAULT_KEYS, ...(overrides || {}) };
        group.fields.forEach((field) => {
            if (field.key && map[field.key]) field.defaultKey = map[field.key];
        });
    }

    /** Infer phosphor vs custom when `iconSource*` was never saved (legacy dashboards). */
    static inferIconStyleSource(values, keyMap) {
        if (!keyMap || !keyMap.source) return 'phosphor';
        const cur = values[keyMap.source];
        if (cur === 'custom' || cur === 'phosphor' || cur === 'favicon') return cur;
        const url = String(values[keyMap.customUrl] || '').trim();
        if (url) return 'custom';
        return 'phosphor';
    }

    /**
     * Flatten one nested icons slot (`icons.on` / `icons.off`) using the same flat key names as merged widget config.
     * Coerces `source` like the editor select (only `custom` | `phosphor`). Used for menu row icon visibility/preview.
     */
    static flattenNestedIconSlotToKeyMap(slot, keyMap, masterAccentFallback) {
        if (!slot || typeof slot !== 'object' || !keyMap || typeof keyMap !== 'object') return {};
        const out = {};
        const rawSrc = slot.source;
        const src = (rawSrc === 'custom' || rawSrc === 'phosphor' || rawSrc === 'favicon') ? rawSrc : 'phosphor';
        if (keyMap.source) out[keyMap.source] = src;
        if (keyMap.builtin) out[keyMap.builtin] = slot.builtin != null ? String(slot.builtin) : '';
        if (keyMap.weight) {
            let w = slot.weight != null ? String(slot.weight).toLowerCase().trim() : '';
            if (!w) w = 'fill';
            out[keyMap.weight] = w;
        }
        if (keyMap.customUrl) out[keyMap.customUrl] = slot.customUrl != null ? String(slot.customUrl) : '';
        if (keyMap.tintImage) out[keyMap.tintImage] = slot.tintImage === true;
        if (keyMap.color && slot.color !== undefined && slot.color !== null) {
            out[keyMap.color] = slot.color;
        }
        if (keyMap.accentColor) {
            out[keyMap.accentColor] = BaseWidget.resolveIconSlotAccentColor(slot, masterAccentFallback);
        }
        if (keyMap.hoverColor && slot.hoverColor !== undefined && slot.hoverColor !== null) {
            out[keyMap.hoverColor] = slot.hoverColor;
        }
        if (keyMap.size && slot.size !== undefined && slot.size !== null) {
            out[keyMap.size] = slot.size;
        }
        Object.assign(out, BaseWidget.flattenIconSlotTransformFlat(slot, keyMap));
        return out;
    }

    /**
     * Build a `@themeToken` string for widget defaults (`static get globalSettings()`).
     * Invalid keys throw so typos fail fast at load time.
     * `background` / `backgroundAccent` are canvas tokens in `MASTER_SETTINGS`; widgets rarely reference them.
     */
    static themeTokenRef(key) {
        const k = key == null ? '' : String(key).trim();
        if (!k || !/^[a-zA-Z][a-zA-Z0-9]*$/.test(k)) {
            throw new Error('BaseWidget.themeTokenRef: invalid theme token key');
        }
        return '@' + k;
    }

    /**
     * Turn master/widget color values into a real CSS color (resolves @themeToken references).
     */
    static resolveCssColor(val) {
        if (val === undefined || val === null) return val;
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.resolveThemeColorValue === 'function') {
            val = Dashboard.resolveThemeColorValue(val);
        }
        if (typeof val === 'object' && val !== null && typeof ColorUtils !== 'undefined' && typeof ColorUtils.parse === 'function') {
            const parsed = ColorUtils.parse(val);
            if (parsed && typeof ColorUtils.toCss === 'function') {
                return ColorUtils.toCss(parsed);
            }
        }
        return val;
    }

    /**
     * Resolve the deactivated color for a widget (defaults to @controlOff).
     */
    static getDeactivatedColor(c) {
        const raw = (c && c.deactivatedColor) || (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultDeactivatedColor ? MASTER_SETTINGS.defaultDeactivatedColor : '@controlOff');
        return BaseWidget.resolveCssColor(raw);
    }

    /**
     * Resolve the deactivated accent color for a widget (defaults to @textMuted).
     */
    static getDeactivatedColorAccent(c) {
        const raw = (c && c.deactivatedColorAccent) || (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultDeactivatedColorAccent ? MASTER_SETTINGS.defaultDeactivatedColorAccent : '@textMuted');
        return BaseWidget.resolveCssColor(raw);
    }

    /**
     * Stable string for cache keys when DOM uses resolved theme colors: changing `MASTER_SETTINGS.themeColors`
     * must invalidate even if widget config still says e.g. `@surface`.
     */
    static getThemeColorsSignature() {
        try {
            const tc = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.themeColors : null;
            if (tc && typeof tc === 'object') return JSON.stringify(tc);
        } catch (e) { /* ignore */ }
        return '';
    }

    /**
     * Overlay a factory or instance layer onto a static config bag.
     * Nested slot/role objects (icons, typography) deep-merge one level; other objects spread;
     * arrays are cloned. Nulls are skipped so they fall through to master.
     */
    static _assignOverrideLayer(base, layer) {
        if (!base || !layer || typeof layer !== 'object') return;
        Object.keys(layer).forEach(function (k) {
            const v = layer[k];
            if (v === undefined || v === null) return;
            if (Array.isArray(v)) {
                base[k] = BaseWidget.cloneJsonValue(v);
                return;
            }
            if (typeof v === 'object') {
                const prev = base[k];
                const prevObj = (prev && typeof prev === 'object' && !Array.isArray(prev)) ? prev : {};
                const childKeys = Object.keys(v);
                let allChildrenObjects = childKeys.length > 0;
                for (let i = 0; i < childKeys.length; i++) {
                    const cv = v[childKeys[i]];
                    if (!cv || typeof cv !== 'object' || Array.isArray(cv)) {
                        allChildrenObjects = false;
                        break;
                    }
                }
                if (allChildrenObjects) {
                    base[k] = BaseWidget._mergeNestedOverrideObjects(prevObj, v);
                } else {
                    base[k] = Object.assign({}, prevObj, v);
                }
                return;
            }
            base[k] = v;
        });
    }

    /**
     * Master defaults + widget factory defaults + instance overrides (no live bindings).
     * Factory values are not stored on `widget.overrides`; they only fill the merged bag
     * so inspector fields show a value without a blue "edited" outline.
     */
    static mergeStaticConfigLayers(masterSettings, factoryDefaults, instanceOverrides) {
        const ms = masterSettings && typeof masterSettings === 'object' ? masterSettings : {};
        const factory = factoryDefaults && typeof factoryDefaults === 'object' ? factoryDefaults : {};
        const ov = instanceOverrides && typeof instanceOverrides === 'object' ? instanceOverrides : {};
        const base = Object.assign({}, ms);
        BaseWidget._assignOverrideLayer(base, factory);
        if (base.width === undefined || base.width === null || base.width === '') {
            base.width = ms.defaultWidth || BaseWidget.BASE_LAYOUT.width;
        }
        if (base.height === undefined || base.height === null || base.height === '') {
            base.height = ms.defaultHeight || BaseWidget.BASE_LAYOUT.height;
        }
        if (base.zIndex === undefined || base.zIndex === null || base.zIndex === '') {
            base.zIndex = 10;
        }
        BaseWidget._assignOverrideLayer(base, ov);
        return base;
    }

    /**
     * Factory + geometry + seed merge for image preload and similar readers.
     * This is NOT what `widget.overrides` contains after construction: instance
     * overrides stay sparse (only identity keys and user-edited fields).
     */
    static buildMergedOverridesForSeed(WidgetClass, id, seed, masterSettings) {
        const ms = masterSettings || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {});
        const baseline = {
            x: 400,
            y: 300,
            width:  ms.defaultWidth  || 260,
            height: ms.defaultHeight || 300,
            zIndex: 10,
            page:   ms.currentPage  || 1
        };
        let widgetDefaults = {};
        try {
            if (WidgetClass && typeof WidgetClass.prototype.getDefaultOverrides === 'function') {
                widgetDefaults = WidgetClass.prototype.getDefaultOverrides.call({ id, overrides: {} }) || {};
            }
        } catch (e) { /* ignore - widget may require DOM context */ }
        return Object.assign({}, baseline, widgetDefaults, seed || {});
    }

    /**
     * Returns true when two persisted override values are functionally equal — meaning the key
     * carries no user-modified information and can be pruned from the save file.
     */
    static valuesEqualForPersist(a, b) {
        if (a === b) return true;
        const aNil = a === null || a === undefined;
        const bNil = b === null || b === undefined;
        if (aNil && bNil) return true;
        if (aNil !== bNil) return false;
        if (typeof a === 'object' || typeof b === 'object') {
            try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; }
        }
        return false;
    }

    /**
     * Renders one icon slot inside a sized wrapper (clears children).
     * `resolved` must contain values for keyMap keys (source, builtin, weight, customUrl, tintImage).
     * When keyMap includes offsetX, offsetY, rotation, applies rotate then translate with origin at slot center.
     */
    static applyIconStyleToElement(wrap, resolved, keyMap, styleOpts) {
        if (!wrap || !keyMap) return;
        styleOpts = styleOpts || {};
        const baseColor = BaseWidget.resolveCssColor(styleOpts.color != null ? String(styleOpts.color) : '#ffffff');
        const hoverRaw = styleOpts.hoverColor != null ? String(styleOpts.hoverColor) : null;
        const hoverColor = hoverRaw ? BaseWidget.resolveCssColor(hoverRaw) : null;
        const useHover = styleOpts.isHovering === true && hoverColor;

        const sizeKey = keyMap.size;
        if (sizeKey) {
            const n = parseFloat(resolved[sizeKey]);
            if (Number.isFinite(n) && n > 0) {
                wrap.style.fontSize = `${n}px`;
                wrap.style.width = `${n}px`;
                wrap.style.height = `${n}px`;
            }
        }

        const appendIconNode = (node) => {
            if (!node) return;
            const hasTransformKeys = !!(keyMap.offsetX && keyMap.offsetY && keyMap.rotation);
            if (!hasTransformKeys) {
                wrap.appendChild(node);
                return;
            }
            const pickTx = (k) => {
                if (!k || resolved[k] === undefined || resolved[k] === null || resolved[k] === '') return 0;
                const v = resolved[k];
                const n = typeof v === 'number' ? v : parseFloat(String(v).trim());
                return Number.isFinite(n) ? n : 0;
            };
            const ox = pickTx(keyMap.offsetX);
            const oy = pickTx(keyMap.offsetY);
            const rot = pickTx(keyMap.rotation);
            if (ox !== 0 || oy !== 0 || rot !== 0) {
                const inner = document.createElement('div');
                inner.className = 'w-full h-full flex items-center justify-center';
                inner.style.transformOrigin = 'center center';
                inner.style.transform = 'rotate(' + rot + 'deg) translate(' + ox + 'px, ' + oy + 'px)';
                inner.appendChild(node);
                wrap.appendChild(inner);
            } else {
                wrap.appendChild(node);
            }
        };

        const source = BaseWidget.inferIconStyleSource(resolved, keyMap);
        let url = String(resolved[keyMap.customUrl] || '').trim();
        if (source === 'favicon') {
            const target = styleOpts && styleOpts.targetUrl !== undefined ? styleOpts.targetUrl : null;
            if (typeof UrlFavicon !== 'undefined' && UrlFavicon && typeof UrlFavicon.resolveFaviconUrl === 'function') {
                const fav = UrlFavicon.resolveFaviconUrl(target);
                url = fav ? String(fav).trim() : '';
            } else {
                url = '';
            }
        }
        const iconClass = String(resolved[keyMap.builtin] || '').trim();
        let weightStr = keyMap.weight ? String(resolved[keyMap.weight] || 'fill').toLowerCase().trim() : 'fill';
        if (weightStr === 'true' || weightStr === '1') weightStr = 'fill';
        if (weightStr === 'false' || weightStr === '0') weightStr = 'regular';
        const weightClass = BaseWidget.phosphorWeightClass(weightStr);
        const tint = source !== 'favicon' && resolved[keyMap.tintImage] === true;

        // Rebuilding the glyph forces Phosphor to upgrade a new <i> on every render.
        // Skip that when the icon, color, size, and transform are unchanged.
        const appliedColor = useHover ? hoverColor : baseColor;
        const sizeKeySig = sizeKey ? String(parseFloat(resolved[sizeKey]) || '') : '';
        const hasTransformKeys = !!(keyMap.offsetX && keyMap.offsetY && keyMap.rotation);
        let txSig = '0,0,0';
        if (hasTransformKeys) {
            const pickTxSig = function (k) {
                if (!k || resolved[k] === undefined || resolved[k] === null || resolved[k] === '') return 0;
                const v = resolved[k];
                const n = typeof v === 'number' ? v : parseFloat(String(v).trim());
                return Number.isFinite(n) ? n : 0;
            };
            txSig = pickTxSig(keyMap.offsetX) + ',' + pickTxSig(keyMap.offsetY) + ',' + pickTxSig(keyMap.rotation);
        }
        let accentSig = '';
        if (source === 'phosphor' && iconClass && weightStr === 'duotone') {
            const accSig = (resolved && resolved.deactivated)
                ? BaseWidget.getDeactivatedColorAccent(resolved)
                : (keyMap.accentColor ? resolved[keyMap.accentColor] : null);
            const accentRawSig = (accSig !== undefined && accSig !== null && String(accSig).trim() !== '') ? accSig : BaseWidget.themeTokenRef('iconAccent');
            accentSig = BaseWidget.resolveCssColor(String(accentRawSig));
        }
        const iconSig = source + '\x1f' + url + '\x1f' + iconClass + '\x1f' + weightStr + '\x1f'
            + (tint ? '1' : '0') + '\x1f' + appliedColor + '\x1f' + sizeKeySig + '\x1f' + txSig + '\x1f'
            + accentSig + '\x1f' + String(styleOpts.targetUrl != null ? styleOpts.targetUrl : '');
        if (wrap._dsIconSig === iconSig && wrap.childNodes.length > 0) {
            if (wrap.style.color !== appliedColor) wrap.style.color = appliedColor;
            return;
        }
        wrap._dsIconSig = iconSig;
        wrap.textContent = '';
        wrap.style.removeProperty('--icon-primary-color');
        wrap.style.removeProperty('--icon-secondary-color');
        wrap.style.color = appliedColor;

        if ((source === 'custom' || source === 'favicon') && url) {
            if (tint) {
                const mask = document.createElement('div');
                mask.className = 'w-full h-full';
                mask.style.backgroundColor = 'currentColor';
                mask.style.webkitMask = `url(${url}) no-repeat center / contain`;
                mask.style.mask = `url(${url}) no-repeat center / contain`;
                appendIconNode(mask);
            } else {
                const img = document.createElement('img');
                img.src = url;
                img.className = 'w-full h-full object-contain';
                if (source === 'favicon') {
                    img.onerror = function () {
                        this.onerror = null;
                        this.style.visibility = 'hidden';
                    };
                }
                appendIconNode(img);
            }
            return;
        }

        if (source === 'phosphor' && iconClass) {
            if (weightStr === 'duotone') {
                const acc = (resolved && resolved.deactivated)
                    ? BaseWidget.getDeactivatedColorAccent(resolved)
                    : (keyMap.accentColor ? resolved[keyMap.accentColor] : null);
                const accentRaw = (acc !== undefined && acc !== null && String(acc).trim() !== '') ? acc : BaseWidget.themeTokenRef('iconAccent');
                const accentResolved = BaseWidget.resolveCssColor(String(accentRaw));
                const primary = useHover && hoverColor ? hoverColor : baseColor;
                wrap.style.setProperty('--icon-primary-color', primary);
                wrap.style.setProperty('--icon-secondary-color', accentResolved);
            }
            const iFont = document.createElement('i');
            iFont.className = `${weightClass} ${iconClass}`;
            appendIconNode(iFont);
        }
    }

    // Typical Typography apply helper
    applyTypographyToElement(el, prefix, config, typoOpts) {
        if (!el) return;
        typoOpts = typoOpts || {};
        if (config[`${prefix}Font`]) el.style.fontFamily = config[`${prefix}Font`];
        if (config[`${prefix}Bold`] !== undefined) el.style.fontWeight = config[`${prefix}Bold`] ? '700' : '400';
        if (config[`${prefix}Italic`] !== undefined) el.style.fontStyle = config[`${prefix}Italic`] ? 'italic' : 'normal';
        if (config[`${prefix}Fs`]) {
            let fs = Number(config[`${prefix}Fs`]);
            const fsScale = typoOpts.fontSizeScale;
            if (fsScale != null && fsScale !== 1 && Number.isFinite(fs) && Number.isFinite(Number(fsScale))) {
                fs = Math.max(1, Math.round(fs * Number(fsScale) * 100) / 100);
            }
            el.style.fontSize = `${fs}px`;
        }

        const overrideColRaw = typoOpts.overrideCol;
        const hasOverrideCol = overrideColRaw !== undefined && overrideColRaw !== null && String(overrideColRaw).trim() !== '';
        let color = hasOverrideCol ? overrideColRaw : (config[`${prefix}Col`] || '#ffffff');
        const colOffRaw = config[`${prefix}ColOff`];
        const hasColOff = colOffRaw !== undefined && colOffRaw !== null && String(colOffRaw).trim() !== '';
        if (hasColOff && typeof typoOpts.colorStateOn === 'boolean' && typoOpts.colorStateOn === false) {
            color = colOffRaw;
        }

        color = BaseWidget.resolveCssColor(color);

        let opacity = config[`${prefix}Opacity`] !== undefined ? Number(config[`${prefix}Opacity`]) : 100;
        if (!Number.isFinite(opacity)) opacity = 100;
        if (opacity < 100 && typeof Dashboard !== 'undefined' && typeof Dashboard.hexToRgba === 'function') {
            color = Dashboard.hexToRgba(color, opacity / 100);
        }
        el.style.color = color;

        if (!typoOpts.skipTextAlign && config[`${prefix}Align`]) {
            const ta = config[`${prefix}Align`];
            if (ta === 'left' || ta === 'center' || ta === 'right') el.style.textAlign = ta;
        }
        if (!typoOpts.skipTextTransform && config[`${prefix}Case`]) el.style.textTransform = config[`${prefix}Case`];

        const lhRaw = config[`${prefix}LineHeight`];
        if (lhRaw !== undefined && lhRaw !== null && lhRaw !== '') {
            const lhNum = Number(lhRaw);
            if (Number.isFinite(lhNum) && lhNum > 0) el.style.lineHeight = String(lhNum);
        }

        const offX = config[`${prefix}OffX`] || 0;
        const offY = config[`${prefix}OffY`] || 0;
        if (offX !== 0 || offY !== 0) el.style.transform = `translate(${offX}px, ${offY}px)`;
        else el.style.transform = 'none';
    }

    // --- Inner glow (shared container chrome) ---
    // Single source of truth so future widgets can reuse the same keys, schema row,
    // save paths, and paint without duplicating logic.
    static get INNER_GLOW_DEFAULT_SIZE() { return 0; }
    static get INNER_GLOW_DEFAULT_OPACITY() { return 100; }
    static get INNER_GLOW_DEFAULT_COLOR() { return '@borderAccent'; }

    // Effective inner glow width from a merged config / master bag. Central gate for
    // editor visibility and the zero-cost runtime early-out below.
    static innerGlowSizeOf(values) {
        if (!values) return 0;
        const raw = Number(values.innerGlow);
        return Number.isFinite(raw) && raw > 0 ? raw : 0;
    }

    // Color + opacity leaves hide until a width is set (instance or master default).
    static innerGlowDetailsVisible(values) {
        return BaseWidget.innerGlowSizeOf(values) > 0;
    }

    // One editor row reused by the Container Style slideout and the master defaults
    // panel. Instance fields save into nested container.innerGlow; master fields write
    // the flat master keys directly (data-config.js parses before this file loads, so
    // its copy stays a literal that calls innerGlowDetailsVisible at render time).
    static getInnerGlowSchemaFields(isGlobal) {
        const leaf = function (prop) {
            return isGlobal ? {} : { containerNested: { path: ['innerGlow', prop] } };
        };
        const detailVisible = function (values) {
            return BaseWidget.innerGlowDetailsVisible(values);
        };
        return [
            Object.assign({ key: 'innerGlow', type: 'number', min: 0, label: 'Inner Glow', cols: 4, default: 0, defaultKey: 'innerGlow' }, leaf('size')),
            Object.assign({ key: 'innerGlowColor', type: 'color', label: 'Inner Glow Color', cols: 4, defaultKey: 'innerGlowColor', dependsOn: ['innerGlow'], visibleWhen: detailVisible }, leaf('color')),
            Object.assign({ key: 'innerGlowOpacity', type: 'number', min: 0, max: 100, label: 'Inner Glow Opacity', cols: 4, defaultKey: 'innerGlowOpacity', dependsOn: ['innerGlow'], visibleWhen: detailVisible }, leaf('opacity'))
        ];
    }

    // Inset halo painted inside the border, fading from Inner Glow Opacity to
    // transparent over Inner Glow px. Returns '' when the width is 0 so the caller
    // keeps the existing box-shadow untouched and pays no color conversion cost.
    static buildInnerGlowBoxShadow(c) {
        if (!c) return '';
        return BaseWidget.elementInnerGlowShadow(c.innerGlow, c.innerGlowColor, c.innerGlowOpacity);
    }

    // Parameterized inset halo for sub-element surfaces (button faces, tiles,
    // tracks, menu rows, flip cards). Same look and cost rules as the container
    // builder above: '' at size 0 so callers keep existing paint untouched.
    static elementInnerGlowShadow(size, color, opacity) {
        const w = Number(size);
        if (!Number.isFinite(w) || w <= 0) return '';
        if (typeof Dashboard === 'undefined' || typeof Dashboard.hexToRgba !== 'function') return '';
        const col = BaseWidget.resolveCssColor(color !== undefined && color !== null && color !== '' ? color : BaseWidget.INNER_GLOW_DEFAULT_COLOR);
        let op = Number(opacity);
        if (!Number.isFinite(op)) op = BaseWidget.INNER_GLOW_DEFAULT_OPACITY;
        op = Math.min(100, Math.max(0, op));
        return 'inset 0 0 ' + w + 'px ' + Dashboard.hexToRgba(col, op / 100);
    }

    // Hide outline or inner-glow color/opacity until the matching width is > 0.
    // isGlobal reads masterKey. Instance reads instKey, then falls back to masterKey.
    static chromeWidthDetailsVisible(values, isGlobal, instKey, masterKey) {
        if (!values) return false;
        const inst = isGlobal === true ? values[masterKey] : values[instKey];
        const raw = Number(inst !== undefined && inst !== null && inst !== '' ? inst : values[masterKey]);
        return Number.isFinite(raw) && raw > 0;
    }

    // Editor gate: hide the color/opacity leaves of an element inner glow until
    // a width is set. sizeKey is the instance field (e.g. 'buttonInnerGlow').
    static elementInnerGlowVisible(sizeKey) {
        return function (values) {
            return BaseWidget.chromeWidthDetailsVisible(values, true, sizeKey, sizeKey);
        };
    }

    // Same gate for outline color/opacity leaves (width key, e.g. 'trackOutlineWidth').
    static elementOutlineDetailsVisible(sizeKey) {
        return BaseWidget.elementInnerGlowVisible(sizeKey);
    }

    // CSS color with a 0-100 opacity applied. The >= 100 fast path keeps the
    // resolved color untouched so default dashboards pay no conversion cost.
    static colorAtOpacity(color, opacity) {
        const css = BaseWidget.resolveCssColor(color);
        const op = Number(opacity);
        if (!Number.isFinite(op) || op >= 100) return css;
        if (op <= 0) return 'rgba(0, 0, 0, 0)';
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.hexToRgba === 'function') {
            return Dashboard.hexToRgba(css, Math.min(1, Math.max(0, op / 100)));
        }
        return css;
    }

    // Common Schema used by all widgets (Layout, Style, etc)
    /** Ordered override keys shown in Basic Settings (geometry is added by the editor). */
    static get basicSettingKeys() {
        return [];
    }

    static get COMMON_SCHEMA() {
        return [
            {
                id: 'meta_group', title: 'Widget', icon: 'ph-info', editorTier: 'both',
                fields: [
                    { key: '_widget_presets', type: 'widget_presets', cols: 12, noBind: true, editorTier: 'both' },
                    { key: 'metaName', type: 'text', label: 'Name', cols: 12, editorTier: 'both' },
                    { key: 'locked', type: 'checkbox', label: 'Locked', cols: 6 },
                    { key: 'deactivated', type: 'checkbox', label: 'Deactivated', cols: 6, default: false },
                    { key: 'visible', type: 'checkbox', label: 'Visibility', cols: 6, default: true, editorTier: 'both' },
                    { key: 'opacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6, default: 100, editorTier: 'both' },
                    { key: 'page', type: 'text', label: 'Page(s) - e.g. 1,2,5-8', cols: 6, editorTier: 'both' },
                    { key: 'zIndex', type: 'number', label: 'Z-Index', cols: 6, editorTier: 'both', default: 10 },
                    {
                        key: 'editorModeOverride', type: 'mode_toggle', label: 'Editor Mode Override',
                        cols: 12, noBind: true, editorTier: 'both',
                        default: 'default'
                    }
                ]
            },
            {
                id: 'layout_group', title: 'Layout & Dimensions', icon: 'ph-arrows-out',
                fields: [
                    { key: 'x', type: 'number', label: 'X', cols: 3 },
                    { key: 'y', type: 'number', label: 'Y', cols: 3 },
                    { key: 'width', type: 'number', label: 'Width', cols: 3, defaultKey: 'defaultWidth' },
                    { key: 'height', type: 'number', label: 'Height', cols: 3, defaultKey: 'defaultHeight' },
                    { key: 'padding', type: 'number', label: 'Padding', cols: 12, defaultKey: 'defaultPadding' },
                ]
            },
            {
                id: 'style_group', title: 'Container Style', icon: 'ph-paint-brush',
                fields: [
                    { key: 'bgVisible', type: 'checkbox', label: 'Show Container', cols: 4, defaultKey: 'bgVisible', containerNested: { path: ['show'] } },
                    { key: 'glowEnabled', type: 'checkbox', label: 'Glow', cols: 4, defaultKey: 'glowEnabled', containerNested: { path: ['glow', 'enabled'] } },
                    { key: 'cornerRadius', type: 'number', label: 'Corner Radius', cols: 4, defaultKey: 'defaultCornerRadius', containerNested: { path: ['border', 'cornerRadius'] } },

                    { key: 'bgColStart', type: 'color', label: 'Background Start Color', cols: 3, defaultKey: 'bgColStart', containerNested: { path: ['background', 'startColor'] } },
                    { key: 'bgOpacityStart', type: 'number', min: 0, max: 100, label: 'Start Opacity', cols: 3, defaultKey: 'bgOpacityStart', containerNested: { path: ['background', 'startOpacity'] } },
                    { key: 'bgColEnd', type: 'color', label: 'Background End Color', cols: 3, defaultKey: 'bgColEnd', containerNested: { path: ['background', 'endColor'] } },
                    { key: 'bgOpacityEnd', type: 'number', min: 0, max: 100, label: 'End Opacity', cols: 3, defaultKey: 'bgOpacityEnd', containerNested: { path: ['background', 'endOpacity'] } },
                    { key: 'bgAngle', type: 'number', label: 'Gradient Angle', cols: 6, defaultKey: 'bgAngle', containerNested: { path: ['background', 'angle'] } },
                    { key: 'bgBlur', type: 'number', min: 0, max: 40, label: 'Background Blur', cols: 6, default: 0, defaultKey: 'bgBlur', containerNested: { path: ['background', 'blur'] } },

                    { key: 'glowColor', type: 'color', label: 'Glow Color', cols: 4, defaultKey: 'glowColor', containerNested: { path: ['glow', 'color'] } },
                    { key: 'glowRadius', type: 'number', label: 'Glow Radius', cols: 4, defaultKey: 'glowRadius', containerNested: { path: ['glow', 'radius'] } },
                    { key: 'glowOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 4, defaultKey: 'glowOpacity', containerNested: { path: ['glow', 'opacity'] } },

                    { key: 'borderColor', type: 'color', label: 'Border Color', cols: 4, defaultKey: 'borderColor', containerNested: { path: ['border', 'color'] } },
                    { key: 'borderWidth', type: 'number', label: 'Border Width', cols: 4, defaultKey: 'defaultBorderWidth', containerNested: { path: ['border', 'width'] } },
                    { key: 'borderOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 4, defaultKey: 'defaultBorderOpacity', containerNested: { path: ['border', 'opacity'] } },

                    ...BaseWidget.getInnerGlowSchemaFields(false)
                ]
            }
        ];
    }

    constructor(containerId, id, overrides = {}, bindings = {}) {
        this.id = id;
        this.containerId = containerId;

        const incoming = {};
        if (overrides && typeof overrides === 'object') {
            Object.keys(overrides).forEach(function (k) {
                incoming[k] = overrides[k];
            });
        }
        if (!incoming.metaName) incoming.metaName = id;

        // Sparse instance overrides only. Factory / master defaults are merged in
        // `get config` and the inspector so unused fields are not blue-outlined.
        this.overrides = incoming;
        this.bindings = bindings;
        this._widgetConfigEpoch = 0;
        this._factoryDefaultsCache = null;
        this._widgetLabelPointerInside = false;
        this._geometryRenderPending = false;
        this.root = document.getElementById(containerId);

        const build = this._buildBaseDOM();
        this.elements = build; // Save elements reference

        this.render();
    }

    /**
     * Find the field aux-key whose binding equals topicPath (root bindings or global master).
     */
    _findAuxKeyForTopic(topicPath) {
        if (!topicPath) return null;
        const walk = (node, prefix) => {
            if (typeof node === 'string') {
                return node === topicPath ? prefix : null;
            }
            if (!node || typeof node !== 'object' || Array.isArray(node)) return null;
            const keys = Object.keys(node);
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                const nextPrefix = prefix ? prefix + '.' + k : k;
                const found = walk(node[k], nextPrefix);
                if (found) return found;
            }
            return null;
        };
        if (this.bindings) {
            const fromTree = walk(this.bindings, '');
            if (fromTree) return fromTree;
        }
        if (typeof Dashboard !== 'undefined' && Dashboard.globalBindings) {
            const gb = Dashboard.globalBindings;
            const gkeys = Object.keys(gb);
            for (let j = 0; j < gkeys.length; j++) {
                if (gb[gkeys[j]] === topicPath) return gkeys[j];
            }
        }
        return null;
    }

    /**
     * Resolve a referenced topic to a finite number for formula evaluation (depth + cycle guarded).
     */
    _resolveTopicToNumber(topicPath, depth, visited) {
        const MAX_DEPTH = 5;
        if (!topicPath || typeof topicPath !== 'string') return { failed: true };
        if (depth > MAX_DEPTH) return { failed: true };
        if (!visited) visited = {};
        if (visited[topicPath]) return { failed: true };
        visited[topicPath] = true;

        try {
            if (typeof Dashboard === 'undefined' || !Dashboard.liveData) return { failed: true };
            if (!Object.prototype.hasOwnProperty.call(Dashboard.liveData, topicPath)) return { failed: true };
            const payload = Dashboard.liveData[topicPath];
            const auxKey = this._findAuxKeyForTopic(topicPath) || topicPath;
            const transformed = this._applyPayloadTransformsForFormula(auxKey, payload, depth, visited);

            if (typeof FormulaEngine !== 'undefined' && FormulaEngine.coerceValue) {
                return FormulaEngine.coerceValue(transformed);
            }
            const n = Number(transformed);
            if (!Number.isFinite(n)) return { failed: true };
            return { v: n, type: 'number' };
        } finally {
            delete visited[topicPath];
        }
    }

    /**
     * Apply binding transforms (map, formula) without color correction. Used for primary and referenced topics.
     */
    _applyPayloadTransformsForFormula(key, value, depth, visited) {
        if (typeof value === 'object' && value !== null) {
            const parsed = ColorUtils.parse(value);
            if (parsed) {
                value = ColorUtils.toCss(parsed);
            }
        }

        if (depth === 0) this._lastFormulaType = null;

        let transformMode = this.overrides[key + '_bind_transformMode'];
        if (transformMode === undefined || transformMode === null) {
            transformMode = MASTER_SETTINGS[key + '_bind_transformMode'];
        }
        const modeStr = (typeof transformMode === 'string') ? transformMode.trim() : '';

        let formula = this.overrides[key + '_bind_formula'];
        if (formula === undefined || formula === null) formula = MASTER_SETTINGS[key + '_bind_formula'];
        const formulaStr = (typeof formula === 'string') ? formula.trim() : '';

        const self = this;
        const resolveFn = function (p) {
            return self._resolveTopicToNumber(p, depth + 1, visited);
        };

        if (modeStr === 'numericFormula') {
            if (formulaStr !== '' && typeof FormulaEngine !== 'undefined') {
                // Text search must see a sentence. Other checkbox formulas still require a number.
                const compactFormula = formulaStr.replace(/\s+\(/g, '(');
                const searchesText = compactFormula.indexOf('contains(') !== -1
                    || compactFormula.indexOf('containsanycase(') !== -1;
                const coerced = FormulaEngine.toNumber(value);
                if (searchesText || !coerced.failed) {
                    const ev = FormulaEngine.evaluate(formulaStr, value, resolveFn);
                    if (!ev.failed && ev.type === 'number' && Number.isFinite(ev.value)) {
                        return ev.value === 0 ? 0 : 1;
                    }
                }
            }
            return value;
        }

        let mapTrue = this.overrides[key + '_bind_mapTrue'];
        if (mapTrue === undefined || mapTrue === null) mapTrue = MASTER_SETTINGS[key + '_bind_mapTrue'];
        let mapFalse = this.overrides[key + '_bind_mapFalse'];
        if (mapFalse === undefined || mapFalse === null) mapFalse = MASTER_SETTINGS[key + '_bind_mapFalse'];

        const mapTrueStr = (typeof mapTrue === 'string') ? mapTrue.trim().toLowerCase() : '';
        const mapFalseStr = (typeof mapFalse === 'string') ? mapFalse.trim().toLowerCase() : '';
        if (mapTrueStr !== '' || mapFalseStr !== '') {
            const norm = String(value).trim().toLowerCase();
            const onlyTrue = mapTrueStr !== '' && mapFalseStr === '';
            const onlyFalse = mapFalseStr !== '' && mapTrueStr === '';

            if (onlyTrue) {
                if (norm === mapTrueStr) return true;
                return false;
            }
            if (onlyFalse) {
                if (norm === mapFalseStr) return false;
                return true;
            }
            if (mapTrueStr !== '' && norm === mapTrueStr) return true;
            if (mapFalseStr !== '' && norm === mapFalseStr) return false;
        }

        if (formulaStr !== '' && typeof FormulaEngine !== 'undefined'
                && modeStr !== 'stringMap' && modeStr !== 'numericFormula') {
            const ev = FormulaEngine.evaluate(formulaStr, value, resolveFn);
            if (!ev.failed) {
                if (ev.type === 'number') {
                    if (Number.isFinite(ev.value)) value = ev.value;
                } else {
                    value = ev.value;
                }
                if (depth === 0) this._lastFormulaType = ev.type;
            }
        }

        return value;
    }

    /**
     * Whether any Numeric Payload Formula on this widget references `topic` via {{topic}} tokens.
     * `excludeKeys` (optional map) skips formulas belonging to those config keys; targeted-update
     * fast paths use it to prove a topic only affects the keys they handle.
     */
    usesFormulaTopic(topic, excludeKeys) {
        if (topic == null || topic === '') return false;
        const normTopic = String(topic).trim();
        if (normTopic === '') return false;
        const re = /\{\{\s*([^{}]+?)\s*\}\}/g;
        const matchesTopic = function (str) {
            if (!str || typeof str !== 'string') return false;
            re.lastIndex = 0;
            let m;
            while ((m = re.exec(str)) !== null) {
                if (String(m[1]).trim() === normTopic) return true;
            }
            return false;
        };
        const o = this.overrides || {};
        let k;
        for (k in o) {
            if (Object.prototype.hasOwnProperty.call(o, k) && k.indexOf('_bind_formula') === k.length - 13) {
                if (excludeKeys && excludeKeys[k.slice(0, -13)]) continue;
                if (matchesTopic(o[k])) return true;
            }
        }
        if (this.bindings && typeof this.bindings === 'object') {
            const bkeys = Object.keys(this.bindings);
            for (let i = 0; i < bkeys.length; i++) {
                const fk = bkeys[i];
                if (excludeKeys && excludeKeys[fk]) continue;
                if (typeof this.bindings[fk] === 'string') {
                    let wf = o[fk + '_bind_formula'];
                    if (wf === undefined || wf === null) wf = MASTER_SETTINGS[fk + '_bind_formula'];
                    if (matchesTopic(wf)) return true;
                }
            }
        }
        return false;
    }

    /** Whether any payload formula (widget or master level) applies to this widget at all. */
    _hasAnyPayloadFormula() {
        const o = this.overrides || {};
        let k;
        for (k in o) {
            if (Object.prototype.hasOwnProperty.call(o, k)
                    && k.indexOf('_bind_formula') === k.length - 13 && o[k]) {
                return true;
            }
        }
        if (this.bindings && typeof this.bindings === 'object') {
            const bkeys = Object.keys(this.bindings);
            for (let i = 0; i < bkeys.length; i++) {
                const fk = bkeys[i];
                if (typeof this.bindings[fk] !== 'string') continue;
                if (MASTER_SETTINGS[fk + '_bind_formula']) return true;
            }
        }
        return false;
    }

    /**
     * Signature of the config generations feeding a render: bumps on widget override/binding
     * edits and on any master settings change. Widgets use it (plus their own data signature)
     * to skip expensive DOM rebuilds whose inputs did not change.
     */
    _renderInputsEpochSig() {
        const globalEpoch = (typeof Dashboard !== 'undefined' && Dashboard._globalConfigEpoch) || 0;
        return this._widgetConfigEpoch + '|' + globalEpoch;
    }

    /**
     * Topics this widget is interested in from static sources: the bindings tree, payload
     * formula `{{topic}}` tokens (widget + master), and subclass extras (markdown templates).
     * Cached per widget; Dashboard builds a topic -> widget index from these sets so inbound
     * messages dispatch in O(subscribers) instead of scanning every widget per message.
     */
    getStaticTopicInterests() {
        if (this._staticTopicInterests) return this._staticTopicInterests;
        const topics = new Set();
        if (typeof BindingsTree !== 'undefined') {
            BindingsTree.collectTopicStrings(this.bindings, []).forEach((t) => topics.add(t));
        }
        this._collectFormulaTopicInterests(topics);
        this._collectExtraTopicInterests(topics);
        this._staticTopicInterests = topics;
        return topics;
    }

    /** All binding keys or nested paths whose topic equals `topic` (used by targeted live-update fast paths). */
    _bindingKeysForTopic(topic) {
        if (topic == null || topic === '') return [];
        const norm = String(topic).trim();
        const alt = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function')
            ? HomeyTopicAlias.aliasOf(topic)
            : null;
        const normAlt = alt ? String(alt).trim() : null;
        const b = this.bindings;
        if (!b || typeof b !== 'object') return [];
        const keys = [];
        const walk = function (node, prefix) {
            if (node == null) return;
            if (typeof node === 'string') {
                const s = node.trim();
                if (node === topic || s === norm || (normAlt && (node === alt || s === normAlt))) {
                    keys.push(prefix);
                }
                return;
            }
            if (typeof node === 'object') {
                const objKeys = Object.keys(node);
                for (let i = 0; i < objKeys.length; i++) {
                    const k = objKeys[i];
                    const nextPrefix = prefix ? prefix + '.' + k : k;
                    walk(node[k], nextPrefix);
                }
            }
        };
        walk(b, '');
        return keys;
    }

    /** Collect `{{topic}}` tokens from widget-level and master-level payload formulas. */
    _collectFormulaTopicInterests(topics) {
        const re = /\{\{\s*([^{}]+?)\s*\}\}/g;
        const collect = function (str) {
            if (!str || typeof str !== 'string') return;
            re.lastIndex = 0;
            let m;
            while ((m = re.exec(str)) !== null) {
                const t = String(m[1]).trim();
                if (t) topics.add(t);
            }
        };
        const o = this.overrides || {};
        Object.keys(o).forEach((k) => {
            if (k.indexOf('_bind_formula') === k.length - 13) collect(o[k]);
        });
        if (this.bindings && typeof this.bindings === 'object') {
            Object.keys(this.bindings).forEach((fk) => {
                if (typeof this.bindings[fk] !== 'string') return;
                let wf = o[fk + '_bind_formula'];
                if (wf === undefined || wf === null) wf = MASTER_SETTINGS[fk + '_bind_formula'];
                collect(wf);
            });
        }
    }

    /** Subclass hook: add topics from sources beyond bindings/formulas (e.g. markdown templates). */
    _collectExtraTopicInterests(topics) { }

    /**
     * Whether this widget's topic interests can change with live data (e.g. a text widget whose
     * bound markdown payload may itself contain `{{topic}}` tokens). Such widgets keep the full
     * per-message BindingsTree.widgetWantsTopic check on top of the static index.
     */
    hasDynamicTopicInterests() {
        return false;
    }

    /**
     * Deep-equal duplicate payloads are dropped for state-style widgets (a re-sent value cannot
     * change what they display). Widgets with aux `__` command/trigger bindings (menu open,
     * list select-all, ...) have event semantics and must hear every message.
     */
    wantsDuplicateTopicPayloads() {
        const b = this.bindings;
        if (!b || typeof b !== 'object') return false;
        const keys = Object.keys(b);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i].indexOf('__') === 0) return true;
        }
        return false;
    }

    /** Drop the cached topic set and tell Dashboard to rebuild its topic index. */
    invalidateTopicInterests() {
        this._staticTopicInterests = null;
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.invalidateTopicIndex === 'function') {
            Dashboard.invalidateTopicIndex();
        }
    }

    /**
     * Must be called after mutating `this.bindings` outside update/updateBindings (aux
     * `_syncBindings` helpers) so the config cache and topic index stay in sync.
     */
    notifyBindingsMutated() {
        this._widgetConfigEpoch += 1;
        this.invalidateTopicInterests();
    }

    /**
     * Call after mutating `this.overrides` outside update() (widget preset apply/reset)
     * so render-skip signatures and the config cache see the change.
     */
    notifyOverridesMutated() {
        this._widgetConfigEpoch += 1;
    }

    /**
     * Text shown for a live payload. 0, false, true, null, and words such as "none" or "nil"
     * are real text. Only a missing value (undefined) is blank.
     * Objects are JSON so a text field does not become "[object Object]".
     */
    static displayText(value) {
        if (value === undefined) return '';
        if (value === null) return 'null';
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (typeof value === 'number') return String(value);
        if (typeof value === 'string') return value;
        if (typeof value === 'object') {
            try { return JSON.stringify(value); } catch (eObj) { return ''; }
        }
        return String(value);
    }

    /**
     * Text/textarea bindings that must stay raw (page specs, JSON data, URLs, publish payloads).
     * Topic path keys are detected by suffix in `_bindingKeyKeepsRawValue`.
     */
    static _liveTextRawKeys() {
        if (!BaseWidget.__liveTextRawKeys) {
            BaseWidget.__liveTextRawKeys = {
                page: true,
                data: true,
                url: true,
                fallbackUrl: true,
                svgRaw: true,
                urlTo: true,
                onPayload: true,
                offPayload: true
            };
        }
        return BaseWidget.__liveTextRawKeys;
    }

    /**
     * Display text keys that must format even if schema collection has not run yet.
     * Schema walk adds the rest (clock labels, separators, and so on).
     */
    static _displayTextKeys() {
        if (!BaseWidget.__displayTextKeys) {
            BaseWidget.__displayTextKeys = {
                label: true,
                text: true,
                buttonLabel: true,
                widgetLabel: true,
                unit: true,
                customPlaceholder: true,
                metaName: true,
                flipLabelHour: true,
                flipLabelMinute: true,
                flipLabelSecond: true,
                textTimeSeparator: true,
                textDateSeparator: true,
                textWeekPrefix: true
            };
        }
        return BaseWidget.__displayTextKeys;
    }

    static _bindingKeyKeepsRawValue(key) {
        if (!key || BaseWidget._liveTextRawKeys()[key]) return true;
        const n = key.length;
        if (n >= 5 && key.indexOf('Topic') === n - 5) return true;
        return false;
    }

    /**
     * text/textarea schema keys for this widget class, minus raw machine fields.
     * Cached per constructor. A re-entrant getSchema (reading config while the set is built)
     * returns null so that pass skips formatting instead of looping.
     */
    _ensureDisplayedTextKeys() {
        const ctor = this.constructor;
        if (ctor._displayedTextKeys) return ctor._displayedTextKeys;
        if (ctor._displayedTextKeysBuilding) return null;
        ctor._displayedTextKeysBuilding = true;
        const set = Object.create(null);
        const collectFields = function (fields) {
            if (!fields || !fields.length) return;
            let i;
            for (i = 0; i < fields.length; i++) {
                const f = fields[i];
                if (!f || typeof f !== 'object') continue;
                if ((f.type === 'text' || f.type === 'textarea') && f.key
                        && !BaseWidget._bindingKeyKeepsRawValue(f.key)) {
                    set[f.key] = true;
                }
                if (f.fields) collectFields(f.fields);
            }
        };
        const collectGroups = function (groups) {
            if (!groups || !groups.length) return;
            let g;
            for (g = 0; g < groups.length; g++) {
                if (groups[g] && groups[g].fields) collectFields(groups[g].fields);
            }
        };
        try {
            collectGroups(ctor.COMMON_SCHEMA || BaseWidget.COMMON_SCHEMA);
            if (typeof this.getSchema === 'function') collectGroups(this.getSchema());
        } catch (eSchema) { /* leave the partial set */ }
        ctor._displayedTextKeysBuilding = false;
        ctor._displayedTextKeys = set;
        return set;
    }

    _isDisplayedTextSetting(key) {
        if (!key || BaseWidget._bindingKeyKeepsRawValue(key)) return false;
        if (BaseWidget._displayTextKeys()[key]) return true;
        const set = this._ensureDisplayedTextKeys();
        return !!(set && set[key]);
    }

    /**
     * Coerce MQTT / Homey payloads onto a boolean field (checkbox, state, visibility-like flags).
     * Strings such as "false" / "0" / "off" must not stay truthy.
     */
    static coerceBindingBoolean(raw) {
        if (raw === true || raw === false) return raw;
        if (typeof raw === 'number') return raw !== 0 && !isNaN(raw);
        if (typeof raw === 'string') {
            const low = raw.toLowerCase().trim();
            if (low === 'false' || low === '0' || low === 'off' || low === 'no' || low === '') return false;
            if (low === 'true' || low === '1' || low === 'on' || low === 'yes') return true;
        }
        return Boolean(raw);
    }

    /**
     * Visibility / checkbox flags: missing values keep `defaultOn` instead of hiding chrome.
     * `!undefined` is true in JS, which previously hid analog parts that had no schema key.
     */
    static configFlag(value, defaultOn) {
        if (value === undefined || value === null || value === '') return defaultOn !== false;
        return BaseWidget.coerceBindingBoolean(value);
    }

    static _bindingValueExpectsBoolean(widget, key, masterDefault) {
        if (typeof masterDefault === 'boolean') return true;
        if (widget && widget.overrides && typeof widget.overrides[key] === 'boolean') return true;
        if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && typeof MASTER_SETTINGS[key] === 'boolean') {
            return true;
        }
        if (widget && typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.lookupMasterDefaultKey === 'function'
                && typeof WidgetRegistry !== 'undefined' && typeof WidgetRegistry.getTypeKeyForClass === 'function'
                && typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS) {
            const mk = SaveFormatV2.lookupMasterDefaultKey(WidgetRegistry.getTypeKeyForClass(widget.constructor), key);
            if (mk && typeof MASTER_SETTINGS[mk] === 'boolean') return true;
        }
        return false;
    }

    /**
     * Copy V2 editor keys (animationReverse, backgroundColorOn, …) onto the internal
     * runtime aliases widgets still read (animReverse, colOn, …).
     * Call once before live resolve so `_correct_*` aliases exist, then again afterwards
     * with overwrite so live editor-key values replace the static alias copies.
     */
    static applyWidgetInstanceAliases(widget, config, overwrite) {
        if (!widget || !config) return;
        if (typeof SaveFormatV2 === 'undefined' || typeof SaveFormatV2.applyInstanceAliasesToConfig !== 'function') return;
        if (typeof WidgetRegistry === 'undefined' || typeof WidgetRegistry.getTypeKeyForClass !== 'function') return;
        SaveFormatV2.applyInstanceAliasesToConfig(
            config,
            WidgetRegistry.getTypeKeyForClass(widget.constructor),
            overwrite === true
        );
    }

    /**
     * Parse unified light / color objects and apply per-key color correction (same as resolveValue tail).
     */
    _finalizeBindingValue(key, value) {
        if (typeof value === 'object' && value !== null) {
            const parsed = ColorUtils.parse(value);
            if (parsed) {
                value = ColorUtils.toCss(parsed);
            }
        }

        value = this._applyPayloadTransformsForFormula(key, value, 0, {});

        // A formula may return a bare @theme-token literal; resolve it to a real
        // color now, before color correction runs. Only bare tokens (type 'token')
        // are resolved, so quoted strings starting with @ stay literal.
        const formulaType = this._lastFormulaType;
        this._lastFormulaType = null;
        if (formulaType === 'token' && typeof value === 'string'
                && typeof Dashboard !== 'undefined' && Dashboard.resolveThemeColorValue) {
            value = Dashboard.resolveThemeColorValue(value);
        }

        let correctEn = this.overrides[key + '_correct_en'];
        if (correctEn === undefined) correctEn = MASTER_SETTINGS[key + '_correct_en'];
        if (correctEn === undefined && this._expandedCorrections) correctEn = this._expandedCorrections[key + '_correct_en'];

        if (correctEn === true) {
            const getParam = (suffix, def) => {
                if (this.overrides[key + suffix] !== undefined && this.overrides[key + suffix] !== null) return this.overrides[key + suffix];
                if (MASTER_SETTINGS[key + suffix] !== undefined && MASTER_SETTINGS[key + suffix] !== null) return MASTER_SETTINGS[key + suffix];
                if (this._expandedCorrections && this._expandedCorrections[key + suffix] !== undefined) return this._expandedCorrections[key + suffix];
                return def;
            };

            const corrections = {
                hue: getParam('_correct_hue', 0),
                sat: getParam('_correct_sat', 100),
                bri: getParam('_correct_bri', 100),
                hue_fixed: getParam('_correct_hue_fixed', false),
                sat_fixed: getParam('_correct_sat_fixed', false),
                bri_fixed: getParam('_correct_bri_fixed', false)
            };

            value = ColorUtils.adjust(value, corrections);
        }

        return value;
    }

    /**
     * After nested flatten, overlay live MQTT values for paths listed in pathSpec:
     * `[{ path: ['icons','on','customUrl'], configKey: 'imgOn' }, ...]`
     */
    static applyNestedBindingOverlay(widget, config, pathSpec) {
        if (!widget || !config || !pathSpec || !pathSpec.length || typeof BindingsTree === 'undefined' || typeof Dashboard === 'undefined' || !Dashboard.liveData) return;
        pathSpec.forEach(({ path, configKey }) => {
            const topic = BindingsTree.getAtPath(widget.bindings, path);
            if (typeof topic !== 'string' || topic === '') return;
            let value = Dashboard.liveData[topic];
            if (value === undefined && typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function') {
                const alt = HomeyTopicAlias.aliasOf(topic);
                if (alt && Dashboard.liveData[alt] !== undefined) value = Dashboard.liveData[alt];
            }
            if (value === undefined) return;
            const prev = config[configKey];
            value = widget._finalizeBindingValue(configKey, value);
            if (typeof prev === 'boolean' || BaseWidget._bindingValueExpectsBoolean(widget, configKey, prev)) {
                value = BaseWidget.coerceBindingBoolean(value);
            } else if (typeof widget._isDisplayedTextSetting === 'function' && widget._isDisplayedTextSetting(configKey)) {
                value = BaseWidget.displayText(value);
            }
            config[configKey] = value;
        });
    }

    /**
     * Binding -> Local Override -> Widget factory default -> Global Default, then optional @theme expansion.
     * @param {boolean} resolveThemeTokens When false, @token refs stay as stored (for editor-facing color fields).
     */
    _resolveValueCore(key, masterDefault, resolveThemeTokens) {
        let value = null;

        const cpath = (typeof SaveFormatV2 !== 'undefined' && SaveFormatV2.CONTAINER_FLAT_TO_PATH)
            ? SaveFormatV2.CONTAINER_FLAT_TO_PATH[key]
            : null;

        // 1. Check Binding (Live Data)
        let boundTopic = (this.bindings && typeof this.bindings[key] === 'string' && this.bindings[key] !== '')
            ? this.bindings[key]
            : undefined;
        if (!boundTopic && cpath && this.bindings && this.bindings.container
                && typeof SaveFormatV2.hasAtPath === 'function' && SaveFormatV2.hasAtPath(this.bindings.container, cpath)) {
            const nestedTopic = SaveFormatV2.getAtPath(this.bindings.container, cpath);
            if (typeof nestedTopic === 'string' && nestedTopic !== '') {
                boundTopic = nestedTopic;
            }
        }

        let fromLiveBinding = false;
        if (boundTopic && typeof Dashboard !== 'undefined' && Dashboard.liveData) {
            if (Dashboard.liveData[boundTopic] !== undefined) {
                value = Dashboard.liveData[boundTopic];
                fromLiveBinding = true;
            } else if (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function') {
                const alt = HomeyTopicAlias.aliasOf(boundTopic);
                if (alt && Dashboard.liveData[alt] !== undefined) {
                    value = Dashboard.liveData[alt];
                    fromLiveBinding = true;
                }
            }
        }
        if (!fromLiveBinding) {
            // 2. Check Local Override (Must ignore nulls so they fall back to factory / Master)
            let localOverride = (this.overrides && this.overrides[key] !== undefined && this.overrides[key] !== null)
                ? this.overrides[key]
                : undefined;
            if (localOverride === undefined && cpath && this.overrides && this.overrides.container
                    && typeof SaveFormatV2.hasAtPath === 'function' && SaveFormatV2.hasAtPath(this.overrides.container, cpath)) {
                const nestedOverride = SaveFormatV2.getAtPath(this.overrides.container, cpath);
                if (nestedOverride !== undefined && nestedOverride !== null) {
                    localOverride = nestedOverride;
                }
            }

            if (localOverride !== undefined && localOverride !== null) {
                value = localOverride;
            } else {
                let factoryVal;
                const bag = this._getFactoryDefaults();
                if (bag) {
                    if (Object.prototype.hasOwnProperty.call(bag, key)
                            && bag[key] !== undefined && bag[key] !== null) {
                        factoryVal = bag[key];
                    } else if (cpath && bag.container
                            && typeof SaveFormatV2.hasAtPath === 'function' && SaveFormatV2.hasAtPath(bag.container, cpath)) {
                        const nestedFactory = SaveFormatV2.getAtPath(bag.container, cpath);
                        if (nestedFactory !== undefined && nestedFactory !== null) {
                            factoryVal = nestedFactory;
                        }
                    }
                }

                // 3. Widget-type factory default (e.g. Text labelCase: 'typography')
                if (factoryVal !== undefined && factoryVal !== null) {
                    value = factoryVal;
                }
                // 4. Global Master Setting (Must ignore nulls so they fall back to hardcoded defaults)
                else if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS[key] !== undefined && MASTER_SETTINGS[key] !== null) {
                    value = MASTER_SETTINGS[key];
                }
                // 5. Fallback
                else {
                    value = masterDefault;
                }
            }
        }

        if (resolveThemeTokens && typeof Dashboard !== 'undefined' && typeof Dashboard.resolveThemeColorValue === 'function') {
            value = Dashboard.resolveThemeColorValue(value);
        }

        value = this._finalizeBindingValue(key, value);
        if (BaseWidget._bindingValueExpectsBoolean(this, key, masterDefault)) {
            value = BaseWidget.coerceBindingBoolean(value);
        } else if (fromLiveBinding && this._isDisplayedTextSetting(key)) {
            value = BaseWidget.displayText(value);
        }
        return value;
    }

    // Helper to resolve a value: Binding -> Local Override -> Global Default
    resolveValue(key, masterDefault) {
        return this._resolveValueCore(key, masterDefault, true);
    }

    /**
     * Same precedence as resolveValue, but keeps @theme token references intact so the editor color
     * picker can open on the Theme tab (same idea as gauge col* keys read straight from merged config).
     * Rendering should still pass values through BaseWidget.resolveCssColor.
     */
    resolveValuePreservingThemeRef(key, masterDefault) {
        return this._resolveValueCore(key, masterDefault, false);
    }

    /**
     * Optimistically reflects a topic payload to liveData and dispatches to bound widgets.
     * Routes through Dashboard.applyLocalTopicPayload so observers, groups, and deduplication
     * stay synchronized.
     */
    static reflectLocalTopic(topic, payload) {
        if (!topic || typeof topic !== 'string') return;
        const t = topic.trim();
        if (!t) return;
        if (typeof Dashboard !== 'undefined') {
            if (typeof Dashboard.applyLocalTopicPayload === 'function') {
                Dashboard.applyLocalTopicPayload(t, payload);
                return;
            }
            if (Dashboard.liveData) {
                Dashboard.liveData[t] = payload;
            }
        }
    }

    reflectLocalTopic(topic, payload) {
        BaseWidget.reflectLocalTopic(topic, payload);
    }

    /**
     * Factory defaults are stable for the widget instance. Cache the bag so
     * `get config` / resolveValue do not allocate it on every key lookup.
     */
    _getFactoryDefaults() {
        if (this._factoryDefaultsCache) return this._factoryDefaultsCache;
        let factory = {};
        try {
            factory = (this.getDefaultOverrides && this.getDefaultOverrides()) || {};
        } catch (eFac) {
            factory = {};
        }
        this._factoryDefaultsCache = factory;
        return factory;
    }

    /**
     * True when page can be decided without `get config`.
     * Group overridePage is already applied in `_isOffActivePageFromSparseOverrides`.
     * A live `bindings.page` on this widget is not, so that case still takes the full path.
     */
    _canSkipOffPageRender() {
        const b = this.bindings;
        if (b && typeof b.page === 'string' && b.page !== '') return false;
        return true;
    }

    /**
     * Widgets with visual state that dynamically depends on the active dashboard page
     * (e.g. Switch or Menu acting as a page navigation button) override this to return true.
     */
    hasPageDependentState() {
        return false;
    }

    /**
     * Off-page check using overrides.page / group overridePage, without `get config`.
     */
    _isOffActivePageFromSparseOverrides() {
        const activePage = Math.max(1, parseInt(String(
            typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.currentPage != null
                ? MASTER_SETTINGS.currentPage
                : 1
        ), 10) || 1);
        const rawPage = (this.overrides && this.overrides.page != null) ? this.overrides.page : '1';
        const pageForRender = (typeof Dashboard !== 'undefined' && typeof Dashboard.resolveEffectivePageForWidgetId === 'function')
            ? Dashboard.resolveEffectivePageForWidgetId(this.id, rawPage)
            : rawPage;
        if (typeof WidgetPageSpec !== 'undefined') {
            return !WidgetPageSpec.coversPage(pageForRender, activePage);
        }
        return String(pageForRender).split(',').map(function (p) { return p.trim(); }).indexOf(String(activePage)) === -1;
    }

    get config() {
        // Static merge + nested flatten + first alias pass only change when config
        // generations change. Cache that bag per epoch so a data tick costs one
        // shallow clone + live-bound key resolution instead of a full MASTER_SETTINGS
        // spread, container flatten, and correction scan per render.
        const epochSig = this._renderInputsEpochSig();
        let cache = this._configBaseCache;
        if (!cache || cache.epochSig !== epochSig) {
            const factory = this._getFactoryDefaults();
            const flattened = BaseWidget.mergeStaticConfigLayers(MASTER_SETTINGS, factory, this.overrides);

            if (typeof SaveFormatV2 !== 'undefined' && typeof SaveFormatV2.applyContainerNestedToConfig === 'function') {
                SaveFormatV2.applyContainerNestedToConfig(flattened);
            }
            BaseWidget.applyWidgetInstanceAliases(this, flattened, false);

            const keysToResolve = new Set();
            Object.keys(this.bindings || {}).forEach((k) => {
                const v = this.bindings[k];
                if (typeof v === 'string' && v !== '') keysToResolve.add(k);
            });

            const expandedCorrections = {};
            Object.keys(flattened).forEach((k) => {
                if (k.indexOf('_correct_') !== -1 && typeof flattened[k] !== 'object') {
                    expandedCorrections[k] = flattened[k];
                    if (k.endsWith('_correct_en') && flattened[k] === true) {
                        keysToResolve.add(k.replace('_correct_en', ''));
                    }
                }
            });

            cache = {
                epochSig: epochSig,
                flattenedBase: flattened,
                keysToResolve: keysToResolve,
                expandedCorrections: expandedCorrections
            };
            this._configBaseCache = cache;
        }

        const c = { ...cache.flattenedBase };
        this._expandedCorrections = cache.expandedCorrections;

        // Drag/resize (and a few other edit gestures) write overrides in place without
        // bumping `_widgetConfigEpoch`. Overlay current top-level override values so
        // cached primitives such as x/y/width/height cannot pin stale geometry.
        const o = this.overrides;
        if (o) {
            const ok = Object.keys(o);
            for (let i = 0; i < ok.length; i++) {
                const k = ok[i];
                const v = o[k];
                if (v === undefined || v === null) continue;
                if (typeof v === 'object') continue;
                c[k] = v;
            }
        }

        // Force resolve for all identified keys (set is frozen for this epoch)
        cache.keysToResolve.forEach(k => {
            c[k] = this.resolveValue(k, c[k]);
        });

        // Resolve standard visual properties that usually inherit from globals
        c.cornerRadius = this.resolveValue('cornerRadius', __nullish(c.cornerRadius, __nullish(MASTER_SETTINGS.defaultCornerRadius, 12)));
        c.borderWidth = this.resolveValue('borderWidth', __nullish(c.borderWidth, __nullish(MASTER_SETTINGS.defaultBorderWidth, 1)));
        c.borderOpacity = this.resolveValue('borderOpacity', __nullish(c.borderOpacity, __nullish(MASTER_SETTINGS.defaultBorderOpacity, 100)));
        c.glowRadius = this.resolveValue('glowRadius', __nullish(c.glowRadius, __nullish(MASTER_SETTINGS.glowRadius, 34)));
        c.glowOpacity = this.resolveValue('glowOpacity', __nullish(c.glowOpacity, __nullish(MASTER_SETTINGS.glowOpacity, 26)));
        c.innerGlow = this.resolveValue('innerGlow', __nullish(c.innerGlow, __nullish(MASTER_SETTINGS.innerGlow, BaseWidget.INNER_GLOW_DEFAULT_SIZE)));
        c.innerGlowOpacity = this.resolveValue('innerGlowOpacity', __nullish(c.innerGlowOpacity, __nullish(MASTER_SETTINGS.innerGlowOpacity, BaseWidget.INNER_GLOW_DEFAULT_OPACITY)));
        c.padding = this.resolveValue('padding', __nullish(c.padding, __nullish(MASTER_SETTINGS.defaultPadding, 12)));
        c.page = this.resolveValue('page', __nullish(c.page, 1));
        c.labelCase = this.resolveValue('labelCase', __nullish(c.labelCase, MASTER_SETTINGS.defaultLabelCase || 'uppercase'));
        c.labelBold = this.resolveValue('labelBold', __nullish(c.labelBold, __nullish(MASTER_SETTINGS.defaultLabelBold, false)));
        c.locked = this.resolveValue('locked', __nullish(c.locked, false));
        let rawDeact = (cache.keysToResolve && cache.keysToResolve.has('deactivated'))
            ? c.deactivated
            : __nullish(c.deactivated, false);
        c.deactivated = rawDeact === true || rawDeact === 'true' || rawDeact === 1 || rawDeact === '1';
        c.opacity = (cache.keysToResolve && cache.keysToResolve.has('opacity'))
            ? c.opacity
            : __nullish(c.opacity, 100);
        c.deactivatedColor = c.deactivatedColor || (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultDeactivatedColor ? MASTER_SETTINGS.defaultDeactivatedColor : '@controlOff');
        c.deactivatedColorAccent = c.deactivatedColorAccent || (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultDeactivatedColorAccent ? MASTER_SETTINGS.defaultDeactivatedColorAccent : '@textMuted');

        // Ensure base container styles are resolved (preserving theme tokens for editor picker)
        c.bgColStart = this.resolveValuePreservingThemeRef('bgColStart', c.bgColStart);
        c.bgColEnd = this.resolveValuePreservingThemeRef('bgColEnd', c.bgColEnd);
        c.borderColor = this.resolveValuePreservingThemeRef('borderColor', c.borderColor);
        c.glowColor = this.resolveValuePreservingThemeRef('glowColor', c.glowColor);
        c.innerGlowColor = this.resolveValuePreservingThemeRef('innerGlowColor', c.innerGlowColor);

        if (this.bindings && this.bindings.container && typeof SaveFormatV2 !== 'undefined'
                && SaveFormatV2.CONTAINER_FLAT_TO_PATH && typeof BaseWidget.applyNestedBindingOverlay === 'function') {
            if (!BaseWidget._containerBindSpec) {
                const containerBindSpec = [];
                const cmap = SaveFormatV2.CONTAINER_FLAT_TO_PATH;
                Object.keys(cmap).forEach(function (flat) {
                    containerBindSpec.push({ path: ['container'].concat(cmap[flat]), configKey: flat });
                });
                BaseWidget._containerBindSpec = containerBindSpec;
            }
            BaseWidget.applyNestedBindingOverlay(this, c, BaseWidget._containerBindSpec);
        }

        // Robust Visibility Logic
        let rawVis = this.resolveValue('visible', true);
        if (typeof rawVis === 'string') {
            rawVis = rawVis.toLowerCase().trim();
            if (rawVis === 'false' || rawVis === '0' || rawVis === 'off') {
                c.visible = false;
            } else {
                c.visible = true;
            }
        } else {
            c.visible = !!rawVis;
        }

        // Core geometry and container visuals must always be finite.
        c.x = BaseWidget.toFiniteNumber(c.x, BaseWidget.BASE_LAYOUT.x);
        c.y = BaseWidget.toFiniteNumber(c.y, BaseWidget.BASE_LAYOUT.y);
        c.width = BaseWidget.clampNumber(c.width, 1, null);
        c.height = BaseWidget.clampNumber(c.height, 1, null);
        c.padding = BaseWidget.clampNumber(c.padding, 0, null);
        c.cornerRadius = BaseWidget.clampNumber(c.cornerRadius, 0, null);
        c.borderWidth = BaseWidget.clampNumber(c.borderWidth, 0, null);
        c.borderOpacity = BaseWidget.clampNumber(c.borderOpacity, 0, 100);
        c.glowRadius = BaseWidget.clampNumber(c.glowRadius, 0, null);
        c.glowOpacity = BaseWidget.clampNumber(c.glowOpacity, 0, 100);
        c.innerGlow = BaseWidget.clampNumber(c.innerGlow, 0, null);
        c.innerGlowOpacity = BaseWidget.clampNumber(c.innerGlowOpacity, 0, 100);
        c.bgBlur = BaseWidget.clampNumber(c.bgBlur, 0, 40);
        c.opacity = BaseWidget.clampNumber(c.opacity, 0, 100);

        delete c.themeColors;
        delete c._masterLayoutVersion;

        // Live bindings write the editor/schema key. Widgets still read the internal alias
        // filled from the static value above, so copy again with overwrite after live overlay.
        BaseWidget.applyWidgetInstanceAliases(this, c, true);

        return c;
    }

    _buildBaseDOM() {
        const wrapper = document.createElement('div');
        wrapper.className = 'widget-wrapper';
        wrapper.id = `widget-${this.id}`;
        wrapper.dataset.id = this.id;

        // Drag/Resize Handles
        const handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d => `<div class="resize-handle rh-${d}" data-dir="${d}"></div>`).join('');
        wrapper.innerHTML = handles;

        const offCanvasFill = document.createElement('div');
        offCanvasFill.className = 'widget-off-canvas-fill';
        offCanvasFill.setAttribute('aria-hidden', 'true');
        wrapper.appendChild(offCanvasFill);

        const container = document.createElement('div');
        container.className = 'widget-container';
        // Error Overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'widget-error';
        errorOverlay.style.display = 'none';
        errorOverlay.innerHTML = '<i class="ph ph-warning"></i><span>Render Error</span>';
        container.appendChild(errorOverlay);

        // Locked Overlay
        const lockedOverlay = document.createElement('div');
        lockedOverlay.className = 'widget-locked-overlay flex items-center justify-center';
        lockedOverlay.style.cssText = 'display:none; position:absolute; inset:0; border-radius:inherit; z-index:100;';
        lockedOverlay.innerHTML = '<i class="ph-fill ph-lock-key text-white text-3xl drop-shadow-md"></i>';
        container.appendChild(lockedOverlay);

        const scaleViewport = document.createElement('div');
        scaleViewport.className = 'widget-content-scale-viewport';
        scaleViewport.style.width = '100%';
        scaleViewport.style.height = '100%';
        scaleViewport.style.position = 'relative';

        const innerContent = document.createElement('div');
        innerContent.className = 'widget-content';
        innerContent.style.width = '100%';
        innerContent.style.height = '100%';
        innerContent.style.position = 'relative';

        scaleViewport.appendChild(innerContent);
        container.appendChild(scaleViewport);
        wrapper.appendChild(container);

        const editLabel = document.createElement('div');
        editLabel.className = 'widget-edit-label';
        editLabel.style.display = 'none';
        editLabel.setAttribute('aria-hidden', 'true');
        const editLabelHeader = document.createElement('div');
        editLabelHeader.className = 'widget-edit-label__header';
        const editLabelTypeRow = document.createElement('div');
        editLabelTypeRow.className = 'widget-edit-label__type-row';
        const self = this;
        const editLabelHelp = document.createElement('button');
        editLabelHelp.type = 'button';
        editLabelHelp.className = 'widget-edit-label__help';
        editLabelHelp.style.display = 'none';
        editLabelHelp.setAttribute('aria-label', 'Open widget help');
        editLabelHelp.title = 'Open widget help';
        editLabelHelp.innerHTML = '<i class="ph-bold ph-question" aria-hidden="true"></i>';
        editLabelHelp.addEventListener('pointerdown', function (e) {
            e.stopPropagation();
        });
        editLabelHelp.addEventListener('pointerup', function (e) {
            e.stopPropagation();
        });
        editLabelHelp.addEventListener('mousedown', function (e) {
            e.stopPropagation();
        });
        editLabelHelp.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const type = editLabelHelp.dataset.widgetType
                || (typeof WidgetRegistry !== 'undefined' && typeof WidgetRegistry.getTypeKeyForClass === 'function' ? WidgetRegistry.getTypeKeyForClass(self.constructor) : null);
            if (typeof HelpSystem !== 'undefined' && typeof HelpSystem.openWidgetHelp === 'function') {
                HelpSystem.openWidgetHelp(type);
            }
        });
        editLabelHeader.appendChild(editLabelTypeRow);
        editLabelHeader.appendChild(editLabelHelp);
        const editLabelName = document.createElement('div');
        editLabelName.className = 'widget-edit-label__name';
        editLabel.appendChild(editLabelHeader);
        editLabel.appendChild(editLabelName);
        wrapper.appendChild(editLabel);

        this.root.appendChild(wrapper);

        wrapper.addEventListener('pointerdown', (e) => Dashboard.handleWidgetMouseDown(e, this.id));

        wrapper.addEventListener('mouseenter', function () {
            self._widgetLabelPointerInside = true;
            if (typeof self._syncEditLabelDisplay === 'function') {
                self._syncEditLabelDisplay();
            }
        });
        wrapper.addEventListener('mouseleave', function () {
            self._widgetLabelPointerInside = false;
            if (typeof self._syncEditLabelDisplay === 'function') {
                self._syncEditLabelDisplay();
            }
        });

        return { wrapper, container, offCanvasFill, scaleViewport, innerContent, errorOverlay, lockedOverlay, editLabel, editLabelTypeRow, editLabelName, editLabelHelp };
    }

    /** Deep-merge nested role/slot objects (typography roles, icons slots) for shallow `update` patches. */
    static _mergeNestedOverrideObjects(prev, patch) {
        const out = { ...(prev && typeof prev === 'object' ? prev : {}) };
        if (!patch || typeof patch !== 'object') return out;
        Object.keys(patch).forEach((key) => {
            const prevChild = out[key] && typeof out[key] === 'object' ? out[key] : {};
            const patchChild = patch[key] && typeof patch[key] === 'object' ? patch[key] : {};
            out[key] = { ...prevChild, ...patchChild };
        });
        return out;
    }

    update(payload, replace = false) {
        if (replace) {
            this.overrides = payload;
        } else {
            const next = { ...this.overrides };
            Object.keys(payload || {}).forEach((key) => {
                if (key === 'icons' && payload.icons != null && typeof payload.icons === 'object') {
                    next.icons = BaseWidget._mergeNestedOverrideObjects(next.icons, payload.icons);
                } else if (key === 'typography' && payload.typography != null && typeof payload.typography === 'object') {
                    next.typography = BaseWidget._mergeNestedOverrideObjects(next.typography, payload.typography);
                } else if (key === 'iconColorOverrides' && payload.iconColorOverrides != null && typeof payload.iconColorOverrides === 'object') {
                    next.iconColorOverrides = BaseWidget._mergeNestedOverrideObjects(next.iconColorOverrides, payload.iconColorOverrides);
                } else if (key === 'audio' && payload.audio != null && typeof payload.audio === 'object') {
                    next.audio = { ...(next.audio && typeof next.audio === 'object' ? next.audio : {}), ...payload.audio };
                } else if (key === 'confirmationDialog' && payload.confirmationDialog != null && typeof payload.confirmationDialog === 'object') {
                    next.confirmationDialog = { ...(next.confirmationDialog && typeof next.confirmationDialog === 'object' ? next.confirmationDialog : {}), ...payload.confirmationDialog };
                } else {
                    next[key] = payload[key];
                }
            });
            this.overrides = next;
        }

        this._widgetConfigEpoch += 1;
        this.invalidateTopicInterests();
        if (payload && payload.metaName) Editor.refreshDropdown(Dashboard.widgets);
        this.render();
    }

    updateBindings(payload, replace = false) {
        if (replace) {
            this.bindings = payload;
        } else if (typeof BindingsTree !== 'undefined') {
            const base = JSON.parse(JSON.stringify(this.bindings || {}));
            this.bindings = BindingsTree.deepMergeBindings(base, payload || {});
        } else {
            this.bindings = { ...this.bindings, ...payload };
        }
        this._widgetConfigEpoch += 1;
        this.invalidateTopicInterests();
        this.render();
    }

    _applyWrapperAndContainerGeometry() {
        // In Responsive Columns the grid engine owns wrapper placement; absolute
        // x/y/width/height must not be written inline (they would override the
        // CSS `position: relative; left/top: auto; width: auto` grid rules).
        if (BaseWidget.isResponsiveMode()) {
            const ctx = (typeof Dashboard !== 'undefined' && typeof Dashboard.getWidgetCompositeContext === 'function')
                ? Dashboard.getWidgetCompositeContext(this.id) : null;
            if (ctx) {
                if (ctx.open) {
                    this._applyCompositeAuthoringGeometry(this.config);
                } else {
                    this._applyCompositeMemberGeometry(this.config);
                    if (typeof Dashboard !== 'undefined' && typeof Dashboard._syncCompositeMemberLayout === 'function') {
                        Dashboard._syncCompositeMemberLayout(this.id);
                    }
                }
                return;
            }
            if (BaseWidget.usesResponsiveGridLayout(this.id)) {
                this._applyResponsiveGeometry(this.config);
            } else {
                this._applyFixedGeometry(this.config);
            }
            return;
        }
        this._applyFixedGeometry(this.config);
    }

    /**
     * Strip responsive-only DOM state (grid placement, rescale transform, scale-mode
     * class) so Fixed Resolution geometry and rendering are not affected by saved
     * `overrides.layout.responsive` values.
     */
    _clearResponsiveLayoutArtifacts() {
        const el = this.elements;
        if (!el || !el.wrapper) return;
        const s = el.wrapper.style;
        s.position = 'absolute';
        s.width = '';
        s.height = '';
        s.order = '';
        s.gridColumn = '';
        s.gridRow = '';
        s.removeProperty('min-height');
        this._responsiveRowSpan = undefined;
        this._responsiveRowStart = undefined;
        this._responsiveColStart = undefined;
        this._responsiveColumnSpan = undefined;
        el.wrapper.classList.remove('responsive-scale-mode');
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._syncResponsiveWidgetScale === 'function') {
            Dashboard._syncResponsiveWidgetScale(this);
        }
    }

    /** Fixed Resolution / Scale geometry: absolute pixel position and size. */
    _applyFixedGeometry(c, skipClipping) {
        this._clearResponsiveLayoutArtifacts();
        const s = this.elements.wrapper.style;
        const cs = this.elements.container.style;
        const x = BaseWidget.toFiniteNumber(c.x, BaseWidget.BASE_LAYOUT.x);
        const y = BaseWidget.toFiniteNumber(c.y, BaseWidget.BASE_LAYOUT.y);
        const width = BaseWidget.clampNumber(c.width, 1, null);
        const height = BaseWidget.clampNumber(c.height, 1, null);
        s.left = `${x}px`;
        s.top = `${y}px`;
        cs.width = `${width}px`;
        cs.height = `${height}px`;
        s.width = `${width}px`;
        s.height = `${height}px`;
        cs.padding = `${BaseWidget.clampNumber(c.padding, 0, null)}px`;
        if (!skipClipping) {
            this._syncCanvasBoundaryClipping(x, y, width, height);
        }
    }

    _syncCanvasBoundaryClipping(optX, optY, optW, optH, skipLabelSync) {
        const el = this.elements;
        if (!el || !el.wrapper || !el.container) return;
        const ws = el.wrapper;
        const cs = el.container;
        let fillEl = el.offCanvasFill;
        if (!fillEl && ws) {
            fillEl = ws.querySelector('.widget-off-canvas-fill');
            if (!fillEl) {
                fillEl = document.createElement('div');
                fillEl.className = 'widget-off-canvas-fill';
                fillEl.setAttribute('aria-hidden', 'true');
                ws.appendChild(fillEl);
            }
            el.offCanvasFill = fillEl;
        }

        if (typeof window !== "undefined" && window.IS_VIEWER === true) {
            if (fillEl && fillEl.style.clipPath) fillEl.style.clipPath = "";
            return;
        }
        if (typeof Dashboard === "undefined" || !Dashboard.isEditMode || Dashboard._holdLivePreviewActive) {
            if (cs.style.clipPath) cs.style.clipPath = "";
            if (cs.style.visibility) cs.style.visibility = "";
            if (fillEl && fillEl.style.clipPath) fillEl.style.clipPath = "";
            if (ws.classList.contains("widget-off-canvas")) ws.classList.remove("widget-off-canvas");
            return;
        }

        if (BaseWidget.isResponsiveMode()) {
            const ctx = (typeof Dashboard.getWidgetCompositeContext === "function")
                ? Dashboard.getWidgetCompositeContext(this.id)
                : null;
            if (!ctx || !ctx.open) {
                if (cs.style.clipPath) cs.style.clipPath = "";
                if (cs.style.visibility) cs.style.visibility = "";
                if (fillEl && fillEl.style.clipPath) fillEl.style.clipPath = "";
                if (ws.classList.contains("widget-off-canvas")) ws.classList.remove("widget-off-canvas");
                return;
            }
        }

        const o = this.overrides || {};
        const x = (typeof optX === "number" && Number.isFinite(optX)) ? optX : BaseWidget.toFiniteNumber(o.x, BaseWidget.BASE_LAYOUT.x);
        const y = (typeof optY === "number" && Number.isFinite(optY)) ? optY : BaseWidget.toFiniteNumber(o.y, BaseWidget.BASE_LAYOUT.y);
        const width = (typeof optW === "number" && Number.isFinite(optW)) ? optW : BaseWidget.resolveInstanceWidth(o);
        const height = (typeof optH === "number" && Number.isFinite(optH)) ? optH : BaseWidget.resolveInstanceHeight(o);

        let boundsW = 0;
        let boundsH = 0;
        if (typeof MASTER_SETTINGS !== "undefined" && MASTER_SETTINGS.canvasWidth > 0 && MASTER_SETTINGS.canvasHeight > 0) {
            boundsW = Number(MASTER_SETTINGS.canvasWidth);
            boundsH = Number(MASTER_SETTINGS.canvasHeight);
        } else {
            const canvasEl = document.getElementById("dashboard-canvas");
            boundsW = canvasEl ? (canvasEl.clientWidth || canvasEl.offsetWidth || 0) : 0;
            boundsH = canvasEl ? (canvasEl.clientHeight || canvasEl.offsetHeight || 0) : 0;
        }

        if (boundsW <= 0 || boundsH <= 0) return;

        if (cs.style.borderRadius && ws.style.borderRadius !== cs.style.borderRadius) {
            ws.style.borderRadius = cs.style.borderRadius;
        }

        const isFullyInside = (x >= 0) && (y >= 0) && ((x + width) <= boundsW) && ((y + height) <= boundsH);
        if (isFullyInside) {
            if (cs.style.clipPath) cs.style.clipPath = "";
            if (cs.style.visibility) cs.style.visibility = "";
            if (fillEl && fillEl.style.clipPath) fillEl.style.clipPath = "";
            if (ws.classList.contains("widget-off-canvas")) ws.classList.remove("widget-off-canvas");
            if (!skipLabelSync && typeof this._syncEditLabelDisplay === 'function') this._syncEditLabelDisplay();
            return;
        }

        const isCompletelyOutside = ((x + width) <= 0) || (x >= boundsW) || ((y + height) <= 0) || (y >= boundsH);
        if (isCompletelyOutside) {
            if (cs.style.visibility !== "hidden") cs.style.visibility = "hidden";
            if (cs.style.clipPath) cs.style.clipPath = "";
            if (fillEl && fillEl.style.clipPath) fillEl.style.clipPath = "";
            if (!ws.classList.contains("widget-off-canvas")) ws.classList.add("widget-off-canvas");
            if (!skipLabelSync && typeof this._syncEditLabelDisplay === 'function') this._syncEditLabelDisplay();
            return;
        }

        const leftInset = Math.max(0, -x);
        const topInset = Math.max(0, -y);
        const rightInset = Math.max(0, (x + width) - boundsW);
        const bottomInset = Math.max(0, (y + height) - boundsH);
        const nextClip = "inset(" + topInset + "px " + rightInset + "px " + bottomInset + "px " + leftInset + "px)";

        if (cs.style.clipPath !== nextClip) cs.style.clipPath = nextClip;
        if (cs.style.visibility) cs.style.visibility = "";

        if (fillEl) {
            const inLeft = leftInset;
            const inTop = topInset;
            const inRight = Math.max(inLeft, width - rightInset);
            const inBottom = Math.max(inTop, height - bottomInset);
            const fillClip = "polygon(evenodd, 0px 0px, " + width + "px 0px, " + width + "px " + height + "px, 0px " + height + "px, 0px 0px, "
                + inLeft + "px " + inTop + "px, " + inRight + "px " + inTop + "px, " + inRight + "px " + inBottom + "px, " + inLeft + "px " + inBottom + "px, " + inLeft + "px " + inTop + "px)";
            if (fillEl.style.clipPath !== fillClip) fillEl.style.clipPath = fillClip;
        }

        if (!ws.classList.contains("widget-off-canvas")) ws.classList.add("widget-off-canvas");
        if (!skipLabelSync && typeof this._syncEditLabelDisplay === 'function') this._syncEditLabelDisplay();
    }

    /**
     * Responsive Columns geometry: clear absolute left/top/width so the CSS grid
     * engine controls placement, then project the nested `layout.responsive` blob
     * (column span, preferred column, cell height, padding) onto the
     * wrapper/container. Masonry row span is computed by the Dashboard reflow pass.
     */
    _applyResponsiveGeometry(c) {
        const s = this.elements.wrapper.style;
        const cs = this.elements.container.style;
        const resp = BaseWidget.getResponsiveLayout(this.overrides) || {};

        s.left = '';
        s.top = '';
        s.position = '';
        s.width = '';
        s.height = '';
        cs.width = '';

        // CSS `order` drives visual grid placement (DOM order stays stable); fall
        // back to the resolved y/x reading order when no explicit order is stored.
        let order = (resp.order !== undefined && resp.order !== null)
            ? parseInt(resp.order, 10) : NaN;
        if (!Number.isFinite(order)) {
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.resolveResponsiveWidgetOrder === 'function') {
                order = Dashboard.resolveResponsiveWidgetOrder(this.id);
            } else {
                order = 0;
            }
        }
        s.order = String(order);

        const rawSpan = (resp.columnSpan !== undefined && resp.columnSpan !== null)
            ? parseInt(resp.columnSpan, 10) : 1;
        let span = Number.isFinite(rawSpan) && rawSpan > 0 ? rawSpan : 1;
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.clampResponsiveColumnSpan === 'function') {
            span = Dashboard.clampResponsiveColumnSpan(span);
        }

        const prefCol = (typeof Dashboard !== 'undefined' && typeof Dashboard.responsivePreferredColumn === 'function')
            ? Dashboard.responsivePreferredColumn(resp.preferredColumn, span)
            : 0;
        let colStart = prefCol;
        if (!(Number.isFinite(colStart) && colStart > 0)
                && Number.isFinite(this._responsiveColStart) && this._responsiveColStart > 0) {
            colStart = this._responsiveColStart;
        }
        if (Number.isFinite(colStart) && colStart > 0) {
            s.gridColumn = colStart + ' / span ' + span;
        } else {
            s.gridColumn = 'span ' + span;
        }

        let heightMode = 'auto';
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.resolveResponsiveHeightMode === 'function') {
            heightMode = Dashboard.resolveResponsiveHeightMode(resp);
        } else {
            const rawMode = (resp.cellHeightMode !== undefined && resp.cellHeightMode !== null && resp.cellHeightMode !== '')
                ? resp.cellHeightMode : resp.heightMode;
            if (rawMode === 'fill' || rawMode === 'fixed' || rawMode === 'auto') {
                heightMode = rawMode;
            } else {
                const legacyH = Number(resp.cellHeight != null ? resp.cellHeight : resp.height);
                if (Number.isFinite(legacyH) && legacyH > 0) heightMode = 'fixed';
            }
        }
        let respHeight = 0;
        if (heightMode === 'fixed') {
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.explicitResponsiveHeightPx === 'function') {
                respHeight = Dashboard.explicitResponsiveHeightPx(resp);
            } else {
                const n = Number(resp.cellHeight != null ? resp.cellHeight : resp.height);
                respHeight = (Number.isFinite(n) && n > 0) ? n : 0;
            }
        }
        // Height is expressed via the masonry row span (computed by the Dashboard reflow
        // from a Fixed pixel height, Auto content height, or Fill stretch after packing).
        // The container fills the spanned rows so widgets pack with no inter-widget gaps;
        // never pin a pixel height here or the container would not fill its cell.
        cs.height = '';

        if (heightMode === 'fixed' || heightMode === 'fill') {
            s.minHeight = '0';
        } else {
            s.removeProperty('min-height');
        }

        // Masonry row span: each widget reserves enough small row tracks to cover its
        // content so widgets in the same column pack tightly. The Dashboard reflow
        // measures the real intrinsic height and stores the span on the widget; before
        // it runs (first frame) fall back to explicit Cell Height / Min Widget Height
        // so the widget never collapses to a single tiny track.
        let rowSpanN = this._responsiveRowSpan;
        if (!Number.isFinite(rowSpanN) || rowSpanN < 1) {
            if (heightMode === 'fill' && typeof Dashboard !== 'undefined'
                    && typeof Dashboard.responsiveFillPackRowSpan === 'function') {
                rowSpanN = Dashboard.responsiveFillPackRowSpan(resp);
            } else if (typeof Dashboard !== 'undefined' && typeof Dashboard.responsiveRowSpanFor === 'function') {
                const fixedH = (c && Number.isFinite(Number(c.height))) ? Number(c.height) : 0;
                const userRowSpan = parseInt(resp.rowSpan, 10);
                const floor = (Number.isFinite(userRowSpan) && userRowSpan > 0) ? userRowSpan : 0;
                // Pixel height is the 4th arg. Passing it as the row-span floor reserved
                // one row per pixel (a 300px design became ~300 rows).
                rowSpanN = Dashboard.responsiveRowSpanFor(respHeight, 0, floor, fixedH);
            } else {
                rowSpanN = 1;
            }
        }
        const rowStart = this._responsiveRowStart;
        if (Number.isFinite(rowStart) && rowStart >= 1) {
            s.gridRow = rowStart + ' / span ' + rowSpanN;
        } else {
            s.gridRow = 'span ' + rowSpanN;
        }

        const respPadding = (resp.padding !== undefined && resp.padding !== null)
            ? resp.padding : null;
        const pad = (respPadding !== null && Number.isFinite(Number(respPadding)))
            ? BaseWidget.clampNumber(Number(respPadding), 0, null)
            : BaseWidget.clampNumber(c.padding, 0, null);
        cs.padding = `${pad}px`;

        const rescale = BaseWidget.widgetUsesResponsiveRescale(this);
        this.elements.wrapper.classList.toggle('responsive-scale-mode', rescale);
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._syncResponsiveWidgetScale === 'function') {
            Dashboard._syncResponsiveWidgetScale(this);
        }
    }

    /**
     * Composite group member (Responsive Columns, group closed): the Dashboard
     * composite pass owns absolute left/top/width/height, so only anchor the
     * wrapper absolutely and let the container fill it. Never clear left/top here
     * (the positioning pass sets them) to avoid flicker on data updates.
     */
    _applyCompositeMemberGeometry(c) {
        const s = this.elements.wrapper.style;
        const cs = this.elements.container.style;
        s.position = 'absolute';
        s.order = '';
        s.gridColumn = '';
        s.gridRow = '';
        s.removeProperty('min-height');
        s.minHeight = '0';
        cs.width = '100%';
        cs.height = '100%';
        const resp = BaseWidget.getResponsiveLayout(this.overrides) || {};
        const padRaw = (resp.padding !== undefined && resp.padding !== null) ? resp.padding : c.padding;
        cs.padding = `${BaseWidget.clampNumber(padRaw, 0, null)}px`;
        const rescale = BaseWidget.widgetUsesResponsiveRescale(this);
        this.elements.wrapper.classList.toggle('responsive-scale-mode', rescale);
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._syncResponsiveWidgetScale === 'function') {
            Dashboard._syncResponsiveWidgetScale(this);
        }
    }

    /**
     * Composite group authoring (Responsive Columns, group open): render the member
     * at its absolute fixed coordinates on the free-form authoring canvas (like Fixed
     * Resolution). The composite outline/origin is only applied on close, so members
     * can be positioned anywhere here.
     */
    _applyCompositeAuthoringGeometry(c) {
        const s = this.elements.wrapper.style;
        const cs = this.elements.container.style;
        const x = BaseWidget.toFiniteNumber(c.x, 0);
        const y = BaseWidget.toFiniteNumber(c.y, 0);
        const width = BaseWidget.clampNumber(c.width, 1, null);
        const height = BaseWidget.clampNumber(c.height, 1, null);
        s.position = 'absolute';
        s.left = `${x}px`;
        s.top = `${y}px`;
        s.width = `${width}px`;
        s.height = `${height}px`;
        s.order = '';
        s.gridColumn = '';
        s.gridRow = '';
        s.removeProperty('min-height');
        cs.width = '100%';
        cs.height = '100%';
        cs.padding = `${BaseWidget.clampNumber(c.padding, 0, null)}px`;
        this.elements.wrapper.classList.remove('responsive-scale-mode');
    }

    _onGeometryUpdate() {
        this._renderSpecific();
    }

    /**
     * Column width times `widthRatio` for Responsive Columns Auto height
     * (and Fixed with Cell Height 0). Never shorter than Min Widget Height.
     * Falls back to the saved or master width before the column has been laid out.
     */
    static responsiveAspectCellHeight(widget, widthRatio) {
        let width = 0;
        const wrap = widget && widget.elements && widget.elements.wrapper;
        if (wrap) width = wrap.offsetWidth || wrap.clientWidth || 0;
        if (!(width > 0)) {
            const ov = widget && widget.overrides;
            const ow = ov && Number(ov.width);
            if (Number.isFinite(ow) && ow > 0) width = ow;
        }
        if (!(width > 0)) {
            const ms = (typeof MASTER_SETTINGS !== 'undefined') ? MASTER_SETTINGS : null;
            const dw = ms && Number(ms.defaultWidth);
            if (Number.isFinite(dw) && dw > 0) width = dw;
        }
        if (!(width > 0)) width = BaseWidget.BASE_LAYOUT.width;
        const ratio = (Number(widthRatio) > 0) ? Number(widthRatio) : 1;
        let height = width * ratio;
        const settings = (typeof MASTER_SETTINGS !== 'undefined') ? MASTER_SETTINGS : null;
        const minH = settings ? Number(settings.layoutResponsiveMinWidgetHeight) : NaN;
        if (Number.isFinite(minH) && minH > 0 && height < minH) height = minH;
        return height;
    }

    /** Square cell: height matches the column width, still floored by Min Widget Height. */
    static responsiveSquareCellHeight(widget) {
        return BaseWidget.responsiveAspectCellHeight(widget, 1);
    }

    /** Widgets with Auto Width / Auto Height override this (Label, Menu). */
    getAutoSizeFlags() {
        return { wAuto: false, hAuto: false };
    }

    /**
     * Intrinsic Auto Width / Auto Height box. Default uses the wrapper, but only
     * while fit-to-content layout is allowed (otherwise the wrapper is the stretched
     * closed-group cell). Label / Menu override this to measure content instead.
     */
    measureFittedContentSize() {
        if (!BaseWidget.allowFixedLayoutAutoSize(this)) return null;
        if (!this.elements || !this.elements.wrapper) return null;
        const wrap = this.elements.wrapper;
        const container = this.elements.container;
        const flags = this.getAutoSizeFlags();
        if (flags.wAuto) {
            if (container) container.style.width = 'fit-content';
            wrap.style.width = 'fit-content';
            wrap.style.minWidth = 'fit-content';
        }
        if (flags.hAuto) {
            if (container) container.style.height = 'fit-content';
            wrap.style.height = 'fit-content';
            wrap.style.minHeight = 'fit-content';
        }
        return {
            width: Math.max(1, Math.round(Math.max(wrap.offsetWidth || 0, wrap.scrollWidth || 0))),
            height: Math.max(1, Math.round(Math.max(wrap.offsetHeight || 0, wrap.scrollHeight || 0)))
        };
    }

    /** Copy the fitted box into Width / Height so closed-group layout uses it. */
    commitFittedAutoSizeToOverrides() {
        if (this._committingFittedSize) return;
        const flags = this.getAutoSizeFlags();
        if (!flags.wAuto && !flags.hAuto) return;
        if (!this.overrides) return;
        const measured = this.measureFittedContentSize();
        if (!measured) return;
        let changed = false;
        if (flags.wAuto && measured.width > 0 && Number(this.overrides.width) !== measured.width) {
            this.overrides.width = measured.width;
            changed = true;
        }
        if (flags.hAuto && measured.height > 0 && Number(this.overrides.height) !== measured.height) {
            this.overrides.height = measured.height;
            changed = true;
        }
        if (!changed) return;
        this._committingFittedSize = true;
        try {
            if (typeof Dashboard !== 'undefined' && typeof Dashboard._syncCompositeMemberLayout === 'function') {
                Dashboard._syncCompositeMemberLayout(this.id);
            }
        } finally {
            this._committingFittedSize = false;
        }
    }

    scheduleFittedAutoSizeCommit() {
        const flags = this.getAutoSizeFlags();
        if (!flags.wAuto && !flags.hAuto) return;
        if (this._fittedSizeRaf) return;
        const self = this;
        const run = function () {
            self._fittedSizeRaf = null;
            self.commitFittedAutoSizeToOverrides();
        };
        if (typeof requestAnimationFrame === 'function') {
            this._fittedSizeRaf = requestAnimationFrame(run);
        } else {
            run();
        }
    }

    flushFittedAutoSize() {
        if (this._fittedSizeRaf != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._fittedSizeRaf);
            this._fittedSizeRaf = null;
        }
        this.commitFittedAutoSizeToOverrides();
    }

    updatePositionSize() {
        this._applyWrapperAndContainerGeometry();
        if (this._geometryRenderPending) return;
        this._geometryRenderPending = true;
        const run = () => {
            this._geometryRenderPending = false;
            this._onGeometryUpdate();
        };
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(run);
        } else {
            run();
        }
    }

    _syncEditLabelDisplay(resolvedConfig) {
        const el = this.elements;
        if (!el || !el.editLabel) return;

        if (typeof Dashboard === 'undefined' || !Dashboard.isEditMode) {
            if (el.editLabel.style.display !== 'none') {
                el.editLabel.style.display = 'none';
                el.editLabel.setAttribute('aria-hidden', 'true');
            }
            return;
        }
        if (el.wrapper && el.wrapper.style.display === 'none') {
            if (el.editLabel.style.display !== 'none') {
                el.editLabel.style.display = 'none';
                el.editLabel.setAttribute('aria-hidden', 'true');
            }
            return;
        }

        const mode = BaseWidget.resolveWidgetLabelMode();
        const isOffCanvas = !!(el.wrapper && el.wrapper.classList.contains('widget-off-canvas'));

        let showNow = false;
        if (isOffCanvas) {
            showNow = true;
        } else if (mode === 'always') {
            showNow = true;
        } else if (mode === 'hover') {
            const selected = !!(el.wrapper && el.wrapper.classList.contains('selected'));
            const coarseHover = selected
                && typeof PointerDrag !== 'undefined' && PointerDrag.isCoarse();
            showNow = !!this._widgetLabelPointerInside || coarseHover;
        } else {
            showNow = false;
        }

        if (!showNow) {
            if (el.editLabel.style.display !== 'none') {
                el.editLabel.style.display = 'none';
                el.editLabel.setAttribute('aria-hidden', 'true');
            }
            if (el.editLabel.style.left) el.editLabel.style.left = '';
            if (el.editLabel.style.top) el.editLabel.style.top = '';
            if (el.editLabel.style.maxWidth) el.editLabel.style.maxWidth = '';
            return;
        }

        if (isOffCanvas) {
            let boundsW = 0;
            let boundsH = 0;
            if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.canvasWidth > 0 && MASTER_SETTINGS.canvasHeight > 0) {
                boundsW = Number(MASTER_SETTINGS.canvasWidth);
                boundsH = Number(MASTER_SETTINGS.canvasHeight);
            } else {
                const canvasEl = document.getElementById('dashboard-canvas');
                boundsW = canvasEl ? (canvasEl.clientWidth || canvasEl.offsetWidth || 0) : 0;
                boundsH = canvasEl ? (canvasEl.clientHeight || canvasEl.offsetHeight || 0) : 0;
            }

            const o = this.overrides || {};
            const x = (el.wrapper && el.wrapper.style.left) ? (parseFloat(el.wrapper.style.left) || 0) : BaseWidget.toFiniteNumber(o.x, BaseWidget.BASE_LAYOUT.x);
            const y = (el.wrapper && el.wrapper.style.top) ? (parseFloat(el.wrapper.style.top) || 0) : BaseWidget.toFiniteNumber(o.y, BaseWidget.BASE_LAYOUT.y);
            const w = (el.wrapper && el.wrapper.offsetWidth) ? el.wrapper.offsetWidth : BaseWidget.resolveInstanceWidth(o);
            const h = (el.wrapper && el.wrapper.offsetHeight) ? el.wrapper.offsetHeight : BaseWidget.resolveInstanceHeight(o);

            let offsetX = 0;
            let offsetY = 0;
            if (boundsW > 0 && x >= 0 && (x + w) > boundsW) {
                offsetX = Math.max(0, (boundsW - x) + 6);
            }
            if (boundsH > 0 && y >= 0 && (y + h) > boundsH) {
                offsetY = Math.max(0, (boundsH - y) + 6);
            }

            if (offsetX > 0) {
                el.editLabel.style.left = offsetX + 'px';
                el.editLabel.style.maxWidth = '220px';
            } else {
                if (el.editLabel.style.left) el.editLabel.style.left = '';
                if (el.editLabel.style.maxWidth) el.editLabel.style.maxWidth = '';
            }

            if (offsetY > 0) {
                el.editLabel.style.top = offsetY + 'px';
            } else {
                if (el.editLabel.style.top) el.editLabel.style.top = '';
            }
        } else {
            if (el.editLabel.style.left) el.editLabel.style.left = '';
            if (el.editLabel.style.top) el.editLabel.style.top = '';
            if (el.editLabel.style.maxWidth) el.editLabel.style.maxWidth = '';
        }

        const regType = typeof WidgetRegistry !== 'undefined' && WidgetRegistry.getTypeKeyForClass
            ? WidgetRegistry.getTypeKeyForClass(this.constructor)
            : null;
        if (!regType) {
            el.editLabel.style.display = 'none';
            el.editLabel.setAttribute('aria-hidden', 'true');
            return;
        }

        if (el.editLabelTypeRow && typeof WidgetRegistry !== 'undefined' && WidgetRegistry.getWidgetTagHtml) {
            if (el.editLabelTypeRow._renderedType !== regType) {
                el.editLabelTypeRow.innerHTML = WidgetRegistry.getWidgetTagHtml(regType, true);
                el.editLabelTypeRow._renderedType = regType;
            }
        } else if (el.editLabelTypeRow && el.editLabelTypeRow._renderedType !== '') {
            el.editLabelTypeRow.innerHTML = '';
            el.editLabelTypeRow._renderedType = '';
        }
        const rawMetaName = (resolvedConfig && resolvedConfig.metaName !== undefined)
            ? resolvedConfig.metaName
            : (this.resolveValue ? this.resolveValue('metaName', (this.overrides && this.overrides.metaName)) : (this.overrides && this.overrides.metaName));
        const nextName = (rawMetaName !== undefined && rawMetaName !== null) ? String(rawMetaName) : '';
        if (el.editLabelName && el.editLabelName.textContent !== nextName) {
            el.editLabelName.textContent = nextName;
        }

        if (el.editLabelHelp) {
            if (el.editLabelHelp._renderedType !== regType) {
                el.editLabelHelp.dataset.widgetType = regType;
                const slug = (typeof HelpSystem !== 'undefined' && typeof HelpSystem.resolveWidgetHelpSlug === 'function')
                    ? HelpSystem.resolveWidgetHelpSlug(regType)
                    : null;
                if (slug) {
                    const wClass = (typeof WidgetRegistry !== 'undefined' && WidgetRegistry.widgets)
                        ? WidgetRegistry.widgets[regType]
                        : null;
                    const typeLabel = (wClass && wClass.metadata && wClass.metadata.label) ? wClass.metadata.label : regType;
                    const helpTitle = 'Open help for ' + typeLabel;
                    el.editLabelHelp.title = helpTitle;
                    el.editLabelHelp.setAttribute('aria-label', helpTitle);
                    el.editLabelHelp.style.display = '';
                } else {
                    el.editLabelHelp.style.display = 'none';
                }
                el.editLabelHelp._renderedType = regType;
            }
        }

        el.editLabel.style.display = '';
        el.editLabel.setAttribute('aria-hidden', 'false');
    }

    /**
     * Wrapper hit testing.
     * Edit mode selects through the stylesheet (`pointer-events: auto` on `.widget-wrapper`).
     * Turning Edit Mode on does not re-render, so an inline `none` left by a view-mode
     * render would outrank that rule and make the widget unselectable.
     * View / hold-preview CSS already passes clicks through the wrapper. Pass true only
     * when this widget must receive clicks while editing is off (an open menu).
     */
    _applyWrapperPointerPolicy(acceptHitsWhenNotEditing) {
        const wrapper = this.elements && this.elements.wrapper;
        if (!wrapper) return;
        const editing = typeof Dashboard !== 'undefined'
            && !!Dashboard.isEditMode
            && !Dashboard._holdLivePreviewActive;
        if (editing) {
            if (wrapper.style.pointerEvents === 'none') wrapper.style.pointerEvents = '';
            return;
        }
        const next = acceptHitsWhenNotEditing ? 'auto' : 'none';
        if (wrapper.style.pointerEvents !== next) wrapper.style.pointerEvents = next;
    }

    _syncEditModeVisuals(resolved) {
        const c = resolved || this.config;
        const el = this.elements;
        if (!el || !el.wrapper) return;
        const warming = typeof Dashboard !== 'undefined' && Dashboard._offPageWarmRender === true;

        if (Dashboard.isEditMode && !Dashboard._holdLivePreviewActive) {
            this._applyWrapperPointerPolicy(false);
        }

        if (Dashboard.isEditMode && typeof Dashboard.isWidgetVisibleInEditor === 'function' && !Dashboard.isWidgetVisibleInEditor(this.id)) {
            if (el.wrapper.style.display !== 'none') el.wrapper.style.display = 'none';
            this._syncEditLabelDisplay();
            return;
        }

        const modalAbsZ = !Dashboard.isEditMode && typeof Dashboard.getGroupModalAbsoluteZForWidget === 'function'
            ? Dashboard.getGroupModalAbsoluteZForWidget(this.id)
            : null;
        if (modalAbsZ !== null && modalAbsZ !== undefined && modalAbsZ !== '') {
            if (el.wrapper.style.zIndex !== modalAbsZ) el.wrapper.style.zIndex = modalAbsZ;
        } else if (c.zIndex !== undefined && el.wrapper.style.zIndex !== String(c.zIndex)) {
            el.wrapper.style.zIndex = c.zIndex;
        }

        // Warmup builds the hidden page while it stays display:none. Showing it
        // here forces a layout of every off-page widget and drops the frame rate.
        if (!warming) {
            if (!c.visible) {
                const effOpacity = (c.opacity !== undefined && c.opacity !== null) ? (BaseWidget.clampNumber(c.opacity, 0, 100) / 100) : 1;
                const targetOpacity = Dashboard.isEditMode ? String(0.5 * effOpacity) : String(effOpacity);
                if (!Dashboard.isEditMode) {
                    if (el.wrapper.style.display !== 'none') el.wrapper.style.display = 'none';
                    // Edit Mode leaves the wrapper at half opacity so it can still be selected.
                    // View mode hides it; drop that inline opacity so a later unhide is not ghosted.
                    if (el.wrapper.style.opacity !== '') el.wrapper.style.opacity = '';
                } else {
                    if (el.wrapper.style.display !== 'block') el.wrapper.style.display = 'block';
                    if (el.wrapper.style.opacity !== targetOpacity) el.wrapper.style.opacity = targetOpacity;
                }
            } else {
                if (el.wrapper.style.display !== 'block') el.wrapper.style.display = 'block';
                const effOpacity = (c.opacity !== undefined && c.opacity !== null) ? (BaseWidget.clampNumber(c.opacity, 0, 100) / 100) : 1;
                if (el.wrapper.style.opacity !== String(effOpacity)) el.wrapper.style.opacity = String(effOpacity);
            }
        }

        // Page changes unhide painted widgets without render(). Record the viewer
        // decision here (static Visibility and topic-driven values already resolved
        // on `c`) so that unhide does not read `get config` again.
        this._viewerPageDisplay = c.visible ? 'block' : 'none';

        const isDeactivated = !!c.deactivated;
        el.wrapper.classList.toggle('widget-is-deactivated', isDeactivated);
        const pe = (isDeactivated && !Dashboard.isEditMode) ? 'none' : '';
        if (el.scaleViewport && el.scaleViewport.style.pointerEvents !== pe) el.scaleViewport.style.pointerEvents = pe;
        if (el.innerContent && el.innerContent.style.pointerEvents !== pe) el.innerContent.style.pointerEvents = pe;
        if (el.container && el.container.style.pointerEvents !== pe) el.container.style.pointerEvents = pe;

        if (typeof Dashboard.isWidgetHiddenByGroupRuntime === 'function' && Dashboard.isWidgetHiddenByGroupRuntime(this.id)) {
            if (el.wrapper.style.display !== 'none') el.wrapper.style.display = 'none';
        }

        const isLocked = Dashboard.isEditMode && typeof Dashboard.isWidgetEffectivelyLocked === 'function'
            ? Dashboard.isWidgetEffectivelyLocked(this.id)
            : (c.locked && Dashboard.isEditMode);
        if (isLocked) {
            if (el.lockedOverlay) {
                el.lockedOverlay.style.display = 'flex';
                el.lockedOverlay.innerHTML = '<i class="ph-fill ph-lock-key text-white text-3xl drop-shadow-md"></i>';
                el.lockedOverlay.style.background = 'rgba(0,0,0,0.4)';
                el.lockedOverlay.style.pointerEvents = 'auto';
            }
            this._hasLockedHandlesHidden = true;
            const handles = el.wrapper.querySelectorAll('.resize-handle');
            for (let h = 0; h < handles.length; h++) handles[h].style.display = 'none';
        } else {
            if (el.lockedOverlay && el.lockedOverlay.style.display !== 'none') el.lockedOverlay.style.display = 'none';
            if (this._hasLockedHandlesHidden) {
                this._hasLockedHandlesHidden = false;
                const handles = el.wrapper.querySelectorAll('.resize-handle');
                for (let h = 0; h < handles.length; h++) handles[h].style.display = '';
            }
        }

        this._syncCanvasBoundaryClipping(undefined, undefined, undefined, undefined, true);
        this._syncEditLabelDisplay(c);
    }

    static syncElementBackdropBlur(el, px) {
        if (!el) return;
        const amount = BaseWidget.clampNumber(px, 0, 40);
        const next = amount > 0 ? ('blur(' + amount + 'px)') : '';
        if (el._dsBackdropBlur === undefined) el._dsBackdropBlur = '';
        if (el._dsBackdropBlur === next) return;
        el._dsBackdropBlur = next;
        if (!next) {
            el.style.removeProperty('-webkit-backdrop-filter');
            el.style.removeProperty('backdrop-filter');
            return;
        }
        el.style.setProperty('-webkit-backdrop-filter', next);
        el.style.setProperty('backdrop-filter', next);
    }

    /**
     * Frost what sits behind this widget box. At 0 the property is left unset so
     * Chromium does not sample the backdrop. CSS filter is not used; that would
     * blur this widget's own content.
     */
    _syncContainerBackdropBlur(containerEl, px) {
        BaseWidget.syncElementBackdropBlur(containerEl, px);
    }

    /**
     * Generic backdrop-blur sync for sub-element surfaces (button faces, tiles,
     * tracks, menu rows, flip cards). Same zero-cost behavior as the container
     * variant: both properties are removed at 0 so the browser never samples
     * the backdrop. Callers gate on translucency like the container does.
     */
    _syncBackdropBlur(el, px) {
        BaseWidget.syncElementBackdropBlur(el, px);
    }

    /**
     * Container chrome (gradient background, border, radius, glow, backdrop blur)
     * for the widget container and any companion panel (graph legend) that shares its look.
     */
    static applyContainerChromeToElement(el, c) {
        if (!el || !c) return;
        if (!c.bgVisible) {
            el.style.background = 'transparent';
            el.style.border = 'none';
            el.style.boxShadow = 'none';
            el.style.borderRadius = '0px';
            BaseWidget.syncElementBackdropBlur(el, 0);
            return;
        }
        const start = Dashboard.hexToRgba(BaseWidget.resolveCssColor(c.bgColStart), (c.bgOpacityStart !== undefined ? c.bgOpacityStart : 100) / 100);
        const end = Dashboard.hexToRgba(BaseWidget.resolveCssColor(c.bgColEnd), (c.bgOpacityEnd !== undefined ? c.bgOpacityEnd : 100) / 100);
        el.style.background = `linear-gradient(${c.bgAngle}deg, ${start}, ${end})`;
        const bdrCol = Dashboard.hexToRgba(BaseWidget.resolveCssColor(c.borderColor), (c.borderOpacity !== undefined ? c.borderOpacity : 100) / 100);
        el.style.border = `${c.borderWidth}px solid ${bdrCol}`;
        el.style.borderRadius = `${c.cornerRadius || 0}px`;
        let shadow = 'none';
        if (c.glowEnabled) {
            const glowRgba = Dashboard.hexToRgba(BaseWidget.resolveCssColor(c.glowColor), (c.glowOpacity !== undefined ? c.glowOpacity : 100) / 100);
            shadow = `0 0 ${c.glowRadius}px -10px ${glowRgba}`;
        }
        const innerGlowShadow = BaseWidget.buildInnerGlowBoxShadow(c);
        el.style.boxShadow = innerGlowShadow ? (shadow === 'none' ? innerGlowShadow : shadow + ', ' + innerGlowShadow) : shadow;

        let blurPx = 0;
        const opStart = (c.bgOpacityStart !== undefined ? c.bgOpacityStart : 100);
        const opEnd = (c.bgOpacityEnd !== undefined ? c.bgOpacityEnd : 100);
        if (opStart < 100 || opEnd < 100) {
            blurPx = BaseWidget.clampNumber(c.bgBlur, 0, 40);
        }
        BaseWidget.syncElementBackdropBlur(el, blurPx);
    }

    render() {
        const el = this.elements;
        if (!el || !el.wrapper) return;

        if (typeof Dashboard !== 'undefined' && Dashboard.isEditMode && typeof Dashboard.isWidgetVisibleInEditor === 'function' && !Dashboard.isWidgetVisibleInEditor(this.id)) {
            el.wrapper.style.display = 'none';
            this._syncEditLabelDisplay();
            return;
        }

        const warming = typeof Dashboard !== 'undefined' && Dashboard._offPageWarmRender === true;
        if (!warming && this._canSkipOffPageRender() && this._isOffActivePageFromSparseOverrides()) {
            el.wrapper.style.display = 'none';
            if (this._onPagePainted) this._hiddenContentStale = true;
            if (typeof this.pauseForBackground === 'function') this.pauseForBackground();
            if (typeof this.syncPageCoverageChrome === 'function') this.syncPageCoverageChrome(false);
            this._syncEditLabelDisplay();
            return;
        }

        const c = this.config;

        // Page Logic (group overridePage replaces member widget page for display only).
        // Widget bindings.page skips the sparse early-out above; still hide here.
        const activePage = Math.max(1, parseInt(String(MASTER_SETTINGS.currentPage != null ? MASTER_SETTINGS.currentPage : 1), 10) || 1);
        const rawPage = c.page != null ? c.page : '1';
        const pageForRender = typeof Dashboard.resolveEffectivePageForWidgetId === 'function'
            ? Dashboard.resolveEffectivePageForWidgetId(this.id, rawPage)
            : rawPage;
        const isOnPage = typeof WidgetPageSpec !== 'undefined'
            ? WidgetPageSpec.coversPage(pageForRender, activePage)
            : String(pageForRender).split(',').map(p => p.trim()).includes(String(activePage));
        if (!isOnPage && !warming) {
            el.wrapper.style.display = 'none';
            if (this._onPagePainted) this._hiddenContentStale = true;
            if (typeof this.pauseForBackground === 'function') this.pauseForBackground();
            if (typeof this.syncPageCoverageChrome === 'function') this.syncPageCoverageChrome(false);
            this._syncEditLabelDisplay(c);
            return;
        }

        if (BaseWidget.isResponsiveMode()) {
            const ctx = (typeof Dashboard !== 'undefined' && typeof Dashboard.getWidgetCompositeContext === 'function')
                ? Dashboard.getWidgetCompositeContext(this.id) : null;
            if (ctx) {
                if (ctx.open) {
                    this._applyCompositeAuthoringGeometry(c);
                } else {
                    this._applyCompositeMemberGeometry(c);
                    if (typeof Dashboard !== 'undefined' && typeof Dashboard._syncCompositeMemberLayout === 'function') {
                        Dashboard._syncCompositeMemberLayout(this.id);
                    }
                }
            } else if (BaseWidget.usesResponsiveGridLayout(this.id)) {
                this._applyResponsiveGeometry(c);
            } else {
                this._applyFixedGeometry(c, true);
            }
        } else {
            this._applyFixedGeometry(c, true);
        }
        el.container.style.fontFamily = c.fontFamily;
        el.container.style.borderRadius = `${c.cornerRadius}px`;

        this._syncEditModeVisuals(c);

        // Background & Border Logic
        const rescaleChrome = BaseWidget.widgetUsesResponsiveRescale(this);
        if (!c.bgVisible) {
            el.container.style.overflow = 'visible';
        } else {
            el.container.style.overflow = rescaleChrome ? 'visible' : 'hidden';
        }
        BaseWidget.applyContainerChromeToElement(el.container, c);

        if (el.scaleViewport) {
            if (rescaleChrome) {
                const innerRadius = Math.max(0, c.cornerRadius - c.borderWidth);
                el.scaleViewport.style.borderRadius = innerRadius + 'px';
                el.scaleViewport.style.overflow = 'hidden';
            } else {
                el.scaleViewport.style.borderRadius = '';
                el.scaleViewport.style.overflow = '';
            }
        }

        let paintedOk = true;
        try {
            this._renderSpecific(c);
            el.errorOverlay.style.display = 'none';
        } catch (err) {
            paintedOk = false;
            console.error(`Widget ${this.id} crashed:`, err);
            el.errorOverlay.style.display = 'flex';
            el.errorOverlay.querySelector('span').textContent = "Render Error: " + err.message;
        }
        if (paintedOk) {
            this._onPagePainted = true;
            this._hiddenContentStale = false;
        }
        if (warming) {
            if (el.wrapper) el.wrapper.style.display = 'none';
            if (typeof this.syncPageCoverageChrome === 'function') this.syncPageCoverageChrome(false);
        }

        if (!warming && BaseWidget.isResponsiveMode() && typeof Dashboard !== 'undefined'
            && typeof Dashboard._syncResponsiveWidgetScale === 'function') {
            Dashboard._syncResponsiveWidgetScale(this);
        }

        // Content height may have changed (list items, text, bindings); recompute the
        // responsive masonry row span so the widget keeps packing tightly. rAF-debounced
        // and a no-op outside Responsive Columns; only this widget is re-measured.
        if (!warming && BaseWidget.isResponsiveMode() && typeof Dashboard !== 'undefined'
            && typeof Dashboard._requestResponsiveReflow === 'function') {
            Dashboard._requestResponsiveReflow(this.id);
        }
    }

    select() {
        this.elements.wrapper.classList.add('selected');
        this._syncEditLabelDisplay();
    }
    deselect() {
        this.elements.wrapper.classList.remove('selected');
        this._syncEditLabelDisplay();
    }

    pauseForBackground() {
        // Subclass hook: pause animations, audio/video streams, or heavy timers when off-page
    }

    resumeFromBackground() {
        // Subclass hook: resume animations or unfreeze timers when returning to active page
    }

    destroy() {
        this.onRemove();
        if (this._fittedSizeRaf != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._fittedSizeRaf);
            this._fittedSizeRaf = null;
        }
        var wrapper = this.elements && this.elements.wrapper;
        if (typeof WidgetAnimations !== 'undefined') {
            if (typeof this.getAnimationSlot === 'function') {
                var slot = this.getAnimationSlot('content');
                if (slot) {
                    if (slot.target && typeof WidgetAnimations.cancelTargetSwap === 'function') {
                        WidgetAnimations.cancelTargetSwap(slot.target);
                    }
                    if (slot.host && typeof WidgetAnimations.purgeSwapArtifacts === 'function') {
                        WidgetAnimations.purgeSwapArtifacts(slot.host, slot.target);
                    }
                }
            }
            var inner = this.elements && this.elements.innerContent;
            if (inner && typeof WidgetAnimations.cancelTargetSwap === 'function') {
                WidgetAnimations.cancelTargetSwap(inner);
            }
            if (wrapper) {
                var descendants = wrapper.getElementsByTagName('*');
                for (var di = 0; di < descendants.length; di++) {
                    if (descendants[di]._waSwapSession && typeof WidgetAnimations.cancelTargetSwap === 'function') {
                        WidgetAnimations.cancelTargetSwap(descendants[di]);
                    }
                }
                if (typeof WidgetAnimations.purgeSwapArtifacts === 'function') {
                    WidgetAnimations.purgeSwapArtifacts(wrapper);
                }
            }
        }
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.invalidateTopicIndex === 'function') {
            Dashboard.invalidateTopicIndex();
        }
        if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        this.elements = null;
        this.e = null;
    }

    /** Targeted DOM helper: update text only when changed. */
    _setTextContentIfChanged(node, value) {
        if (!node) return;
        const next = value == null ? '' : String(value);
        if (node.textContent !== next) node.textContent = next;
    }

    /** Targeted DOM helper: update style property only when changed. */
    _setStyleIfChanged(node, key, value) {
        if (!node || !node.style) return;
        const next = value == null ? '' : String(value);
        if (node.style[key] !== next) node.style[key] = next;
    }

    // Hooks for subclasses
    onRemove() { }
    _renderSpecific() { }
    /**
     * Data-tick hook used by Dashboard topic dispatch.
     * Subclasses should prefer targeted DOM updates here and only call render()
     * when incoming data changes widget structure/config semantics.
     */
    onIncomingData(topic, payload, count) {
        if (this.usesFormulaTopic(topic)) return true;
    }

    /**
     * Targeted data-tick fast path, tried before onIncomingData + dirty-render. Return true
     * only when the update was fully applied with targeted DOM writes and no render() is
     * needed (see GaugeWidget for the reference implementation). Default: not handled.
     */
    onLiveTopicUpdate(topic, payload, count) {
        return false;
    }
}