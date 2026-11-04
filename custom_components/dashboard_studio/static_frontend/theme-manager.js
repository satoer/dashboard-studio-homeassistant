const ThemeManager = {
    COOKIE: "dashboard_theme",
    /** Click order. Auto is the unset default. */
    MODES: ["auto", "light", "dark"],
    /** Perceived brightness (0-255) at or above this counts as a bright dashboard background. */
    BRIGHT_THRESHOLD: 160,
    mode: "auto",

    init: function () {
        const theme = this.getCookie(this.COOKIE);
        if (theme === "light" || theme === "dark" || theme === "auto") {
            this.mode = theme;
        } else {
            this.mode = "auto";
        }
        this.apply(false);
    },

    toggle: function () {
        const order = this.MODES;
        const idx = order.indexOf(this.mode);
        this.mode = order[(idx < 0 ? 0 : idx + 1) % order.length];
        this.setCookie(this.COOKIE, this.mode, 365);
        this.apply(true);
    },

    /**
     * Re-read the dashboard background while Auto is selected.
     * Forced Light and Dark stay as the user left them.
     */
    syncFromDashboard: function () {
        if (this.mode !== "auto") return;
        this.apply(true);
    },

    apply: function (notify) {
        const isLight = this.resolveIsLight();
        const hadLight = document.body.classList.contains("ui-light");
        if (isLight !== hadLight) {
            if (isLight) document.body.classList.add("ui-light");
            else document.body.classList.remove("ui-light");
            if (notify) this._afterResolvedChange(isLight);
        }
        if (this._iconMode !== this.mode) this.updateIcon();
    },

    resolveIsLight: function () {
        if (this.mode === "light") return true;
        if (this.mode === "dark") return false;
        return this.dashboardBackgroundIsBright() === true;
    },

    /**
     * Color 1 (Start/Flat) is the main dashboard background.
     * Theme tokens and color corrections are resolved the same way as the canvas paint.
     * Returns true when bright, false when dark, null when no color is available yet.
     */
    dashboardBackgroundIsBright: function () {
        const css = this._mainBackgroundCss();
        if (!css || typeof ColorUtils === "undefined" || !ColorUtils.parse || !ColorUtils.hsvToRgb) return null;
        const hsv = ColorUtils.parse(css);
        if (!hsv) return null;
        const rgb = ColorUtils.hsvToRgb(hsv.h, hsv.s, hsv.v);
        let alpha = hsv.a === undefined || hsv.a === null ? 1 : hsv.a;
        if (alpha > 1) alpha = 1;
        if (alpha < 0) alpha = 0;
        const r = rgb.r * alpha;
        const g = rgb.g * alpha;
        const b = rgb.b * alpha;
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness >= this.BRIGHT_THRESHOLD;
    },

    _mainBackgroundCss: function () {
        if (typeof MASTER_SETTINGS === "undefined" || !MASTER_SETTINGS) return null;
        if (typeof Dashboard !== "undefined" && typeof Dashboard.resolveColor === "function") {
            const op = MASTER_SETTINGS.canvasBgOpacity !== undefined ? MASTER_SETTINGS.canvasBgOpacity : 100;
            return Dashboard.resolveColor("canvasBg", op / 100);
        }
        return null;
    },

    _afterResolvedChange: function (isLight) {
        if (typeof Editor !== "undefined" && Editor.refreshDropdown && window.Dashboard) Editor.refreshDropdown(Dashboard.widgets);
        if (typeof Dashboard !== "undefined" && Dashboard.populateAddWidgetMenu) Dashboard.populateAddWidgetMenu();
        if (typeof window !== "undefined" && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent("ds-theme-changed", { detail: { isLight: isLight, mode: this.mode } }));
        }
    },

    updateIcon: function () {
        const btn = document.getElementById("btn-theme-toggle");
        if (!btn) return;
        const icon = btn.querySelector("i");
        if (!icon) return;

        let glyph = "ph-circle-half";
        let title = "Editor theme: Auto. Follows the dashboard background. Click for Light.";
        if (this.mode === "light") {
            glyph = "ph-sun";
            title = "Editor theme: Light. Click for Dark.";
        } else if (this.mode === "dark") {
            glyph = "ph-moon";
            title = "Editor theme: Dark. Click for Auto.";
        }
        icon.className = "ph-bold " + glyph;
        btn.title = title;
        btn.setAttribute("aria-label", title);
        this._iconMode = this.mode;
    },

    setCookie: function (name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    },

    getCookie: function (name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
};

// Auto-init on load
window.addEventListener('DOMContentLoaded', () => ThemeManager.init());