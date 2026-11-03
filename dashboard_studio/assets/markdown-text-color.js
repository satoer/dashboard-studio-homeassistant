/**
 * Markdown inline text color: [color #hex]…[/color] / [color @token]…[/color].
 */
(function (global) {
    var COLOR_TAG_RE = /\[color\s+([^\]]+)\]([\s\S]*?)\[\/color\]/gi;
    var COLOR_SOURCE_RE = /\[color\s+[^\]]+\][\s\S]*?\[\/color\]/i;
    var DATA_ATTR = 'data-text-md-col';

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

    function sourceHasTextColorDirectives(src) {
        return COLOR_SOURCE_RE.test(String(src == null ? '' : src));
    }

    function preprocessForRender(src, renderInnerFn) {
        if (src === undefined || src === null) return '';
        var s = String(src);
        if (!sourceHasTextColorDirectives(s)) return s;
        var renderFn = typeof renderInnerFn === 'function' ? renderInnerFn : function (inner) {
            return inner == null ? '' : String(inner);
        };
        return s.replace(COLOR_TAG_RE, function (_m, colorRaw, inner) {
            var color = validateColorSpec(colorRaw);
            if (!color) return _m;
            var body = inner == null ? '' : String(inner);
            var innerHtml = renderFn(body);
            return '<span ' + DATA_ATTR + '="' + escapeHtmlAttrValue(color) + '">' + innerHtml + '</span>';
        });
    }

    function materializeElement(el) {
        if (!el || !el.getAttribute) return;
        var spec = el.getAttribute(DATA_ATTR);
        if (!spec) return;
        var resolved = resolveColorCss(spec);
        if (!resolved) return;
        if (el.style) {
            el.style.color = resolved;
        }
    }

    function materializeInHtml(html) {
        if (!html || html.indexOf(DATA_ATTR) < 0) return html;
        if (typeof document === 'undefined') return html;
        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        var els = wrap.querySelectorAll('[' + DATA_ATTR + ']');
        var i = 0;
        for (i = 0; i < els.length; i++) {
            materializeElement(els[i]);
        }
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

    function parseWrapAt(text, start, end) {
        var s = String(text == null ? '' : text);
        var a = start < 0 ? 0 : start;
        var b = end < 0 ? 0 : end;
        if (a > b) {
            var tmp = a;
            a = b;
            b = tmp;
        }
        var openRe = /\[color\s+([^\]]+)\]/gi;
        var m = null;
        var best = null;
        while ((m = openRe.exec(s)) !== null) {
            var openEnd = m.index + m[0].length;
            var closeIdx = s.indexOf('[/color]', openEnd);
            if (closeIdx < 0) continue;
            var closeEnd = closeIdx + 8;
            if (a >= m.index && b <= closeEnd) {
                if (!best || m.index < best.openStart) {
                    best = {
                        openStart: m.index,
                        openEnd: openEnd,
                        closeStart: closeIdx,
                        closeEnd: closeEnd,
                        color: validateColorSpec(m[1]),
                        innerStart: openEnd,
                        innerEnd: closeIdx
                    };
                }
            }
        }
        return best;
    }

    function formatWrap(color, inner) {
        var c = validateColorSpec(color);
        if (!c) return inner == null ? '' : String(inner);
        var body = inner == null ? '' : String(inner);
        return '[color ' + c + ']' + body + '[/color]';
    }

    var MarkdownTextColor = {
        DATA_ATTR: DATA_ATTR,
        COLOR_TAG_RE: COLOR_TAG_RE,
        validateColorSpec: validateColorSpec,
        sourceHasTextColorDirectives: sourceHasTextColorDirectives,
        preprocessForRender: preprocessForRender,
        materializeInHtml: materializeInHtml,
        reapplyFromDataAttrs: reapplyFromDataAttrs,
        parseWrapAt: parseWrapAt,
        formatWrap: formatWrap
    };

    global.MarkdownTextColor = MarkdownTextColor;
})(typeof window !== 'undefined' ? window : this);
