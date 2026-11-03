/**
 * Markdown image tint: ![alt|240|@accent](url) via alt-pipe color tokens.
 * Materializes as a CSS-masked span (icon-style silhouette recolor).
 */
(function (global) {
    var DATA_ATTR = 'data-text-md-img-tint';
    var DATA_SRC_ATTR = 'data-text-md-img-src';
    var TINTED_CLASS = 'text-md-img-tinted';

    function validateColorSpec(raw) {
        if (typeof MarkdownColorSpec !== 'undefined' && MarkdownColorSpec.validateColorSpec) {
            return MarkdownColorSpec.validateColorSpec(raw);
        }
        return null;
    }

    function resolveColorCss(spec) {
        if (typeof MarkdownColorSpec !== 'undefined' && MarkdownColorSpec.resolveColorCss) {
            return MarkdownColorSpec.resolveColorCss(spec);
        }
        return spec;
    }

    function escapeHtmlAttrValue(val) {
        if (typeof MarkdownColorSpec !== 'undefined' && MarkdownColorSpec.escapeHtmlAttrValue) {
            return MarkdownColorSpec.escapeHtmlAttrValue(val);
        }
        return String(val == null ? '' : val);
    }

    function maskUrlForSrc(src) {
        var s = String(src == null ? '' : src);
        if (!s.length) return '';
        return 'url("' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")';
    }

    function applyMaskStyles(el, src, resolvedColor) {
        if (!el || !el.style) return;
        var mask = maskUrlForSrc(src);
        if (!mask || !resolvedColor) return;
        el.style.backgroundColor = resolvedColor;
        el.style.webkitMaskImage = mask;
        el.style.maskImage = mask;
        el.style.webkitMaskRepeat = 'no-repeat';
        el.style.maskRepeat = 'no-repeat';
        el.style.webkitMaskPosition = 'center';
        el.style.maskPosition = 'center';
        // Stretch to the box so the tint matches what a normal <img> of the same size would show.
        el.style.webkitMaskSize = '100% 100%';
        el.style.maskSize = '100% 100%';
    }

    /**
     * Hidden, real <img> that gives the tinted span its intrinsic (or explicit) box size.
     * A masked span has no replaced-content size of its own, so without this it collapses to 0x0.
     */
    function buildSizerImg(img, src) {
        var sizer = document.createElement('img');
        sizer.setAttribute('src', src);
        sizer.setAttribute('alt', '');
        sizer.setAttribute('aria-hidden', 'true');
        sizer.className = 'text-md-img-tint-sizer';
        if (img.style.width) sizer.style.width = img.style.width;
        if (img.style.height) sizer.style.height = img.style.height;
        if (img.style.maxWidth) sizer.style.maxWidth = img.style.maxWidth;
        return sizer;
    }

    function replaceImgWithTintedSpan(img) {
        if (!img || !img.getAttribute) return null;
        var spec = img.getAttribute(DATA_ATTR);
        if (!spec) return null;
        var src = img.getAttribute('src') || img.getAttribute(DATA_SRC_ATTR) || '';
        if (!src) return null;
        var resolved = resolveColorCss(spec);
        if (!resolved) return null;

        var span = document.createElement('span');
        span.className = TINTED_CLASS;
        if (img.classList && img.classList.contains('text-md-img-sized')) {
            span.classList.add('text-md-img-sized');
        }
        var alt = img.getAttribute('alt') || '';
        if (alt) {
            span.setAttribute('aria-label', alt);
            span.setAttribute('role', 'img');
        }
        span.setAttribute(DATA_ATTR, spec);
        span.setAttribute(DATA_SRC_ATTR, src);
        span.appendChild(buildSizerImg(img, src));
        applyMaskStyles(span, src, resolved);
        return span;
    }

    function materializeElement(el) {
        if (!el || !el.getAttribute) return;
        var spec = el.getAttribute(DATA_ATTR);
        if (!spec) return;
        var resolved = resolveColorCss(spec);
        if (!resolved) return;
        var src = el.getAttribute(DATA_SRC_ATTR) || '';
        if (!src) return;
        applyMaskStyles(el, src, resolved);
    }

    function materializeInContainer(wrap) {
        if (!wrap || !wrap.querySelectorAll) return;
        var imgs = wrap.querySelectorAll('img[' + DATA_ATTR + ']');
        var i = 0;
        for (i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            var span = replaceImgWithTintedSpan(img);
            if (span && img.parentNode) {
                img.parentNode.replaceChild(span, img);
            }
        }
        var tinted = wrap.querySelectorAll('.' + TINTED_CLASS + '[' + DATA_ATTR + ']');
        for (i = 0; i < tinted.length; i++) {
            materializeElement(tinted[i]);
        }
    }

    function materializeInHtml(html) {
        if (!html || html.indexOf(DATA_ATTR) < 0) return html;
        if (typeof document === 'undefined') return html;
        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        materializeInContainer(wrap);
        return wrap.innerHTML;
    }

    function reapplyFromDataAttrs(rootEl) {
        if (!rootEl || !rootEl.querySelectorAll) return;
        var els = rootEl.querySelectorAll('[' + DATA_ATTR + ']');
        var i = 0;
        for (i = 0; i < els.length; i++) {
            materializeElement(els[i]);
        }
    }

    var MarkdownImageTint = {
        DATA_ATTR: DATA_ATTR,
        DATA_SRC_ATTR: DATA_SRC_ATTR,
        TINTED_CLASS: TINTED_CLASS,
        validateColorSpec: validateColorSpec,
        escapeHtmlAttrValue: escapeHtmlAttrValue,
        materializeInContainer: materializeInContainer,
        materializeInHtml: materializeInHtml,
        reapplyFromDataAttrs: reapplyFromDataAttrs
    };

    global.MarkdownImageTint = MarkdownImageTint;
})(typeof window !== 'undefined' ? window : this);
