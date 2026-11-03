/**
 * Shared markdown color validation and CSS resolution (hex, rgb, hsl, @theme tokens).
 */
(function (global) {
    function isTokenRef(val) {
        return typeof MasterLayout !== 'undefined'
            && MasterLayout.isThemeTokenReference
            && MasterLayout.isThemeTokenReference(val);
    }

    function isValidColorString(str) {
        var t = String(str || '').trim();
        if (!t) return false;
        if (isTokenRef(t)) return true;
        if (typeof ColorUtils === 'undefined' || !ColorUtils.parse) return false;
        return ColorUtils.parse(t) !== null;
    }

    function normalizeLiteralColor(str) {
        var t = String(str || '').trim();
        if (!t || isTokenRef(t)) return t;
        if (typeof ColorUtils === 'undefined' || !ColorUtils.parse || !ColorUtils.formatManualColor) {
            return t;
        }
        var parsed = ColorUtils.parse(t);
        if (!parsed) return null;
        var fmt = 'hex';
        try {
            if (typeof localStorage !== 'undefined') {
                var raw = localStorage.getItem('homeyStudio_editorManualColorFormat');
                if (raw === 'rgb' || raw === 'hsl' || raw === 'hex') fmt = raw;
            }
        } catch (e) { /* ignore */ }
        return ColorUtils.formatManualColor(parsed, fmt);
    }

    function validateColorSpec(raw) {
        var t = String(raw == null ? '' : raw).trim();
        if (!t) return null;
        if (isTokenRef(t)) return t;
        return normalizeLiteralColor(t);
    }

    function resolveColorCss(spec) {
        if (typeof BaseWidget !== 'undefined' && BaseWidget.resolveCssColor) {
            return BaseWidget.resolveCssColor(spec);
        }
        if (typeof Dashboard !== 'undefined' && Dashboard.resolveThemeColorValue) {
            return Dashboard.resolveThemeColorValue(spec);
        }
        return spec;
    }

    function escapeHtmlAttrValue(val) {
        return String(val == null ? '' : val)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;');
    }

    var MarkdownColorSpec = {
        isTokenRef: isTokenRef,
        isValidColorString: isValidColorString,
        normalizeLiteralColor: normalizeLiteralColor,
        validateColorSpec: validateColorSpec,
        resolveColorCss: resolveColorCss,
        escapeHtmlAttrValue: escapeHtmlAttrValue
    };

    global.MarkdownColorSpec = MarkdownColorSpec;
})(typeof window !== 'undefined' ? window : this);
