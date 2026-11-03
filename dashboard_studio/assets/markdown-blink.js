/**
 * Markdown blink: [blink]…[/blink] / [blink 1.5]…[/blink].
 * No optional chaining (Safari 12).
 *
 * Block inners (headings, lists, tables, callouts) render as real markdown
 * blocks. CSS animations restart at 0% whenever the text widget replaces
 * innerHTML (live {{topic}} values do this), so new nodes join the current
 * wall-clock phase instead of restarting from invisible.
 */
(function (global) {
    var DATA_ATTR = 'data-text-md-blink';
    var CLOSE_TAG = '[/blink]';
    var CLOSE_LEN = 8;
    var SCALE_MIN = 0.5;
    var SCALE_MAX = 8;
    var BLINK_SOURCE_RE = /\[blink(?:\s+[^\]]*)?\][\s\S]*\[\/blink\]/i;
    var BLOCK_TAG_RE = /<(table|div|h[1-6]|ul|ol|pre|blockquote)\b/i;
    var BLOCK_CALLOUT_RE = /\[block\s*[1-4]\s*:/i;
    var ATX_HEADING_RE = /^#{1,6}(?:[\t ]|$)/;
    var BLOCKQUOTE_RE = /^>(?:[\t ]|$)/;
    var LIST_RE = /^(?:[-*+]|\d+\.)[\t ]/;
    var TABLE_ROW_RE = /^\|(?=.+\|)/;
    var FADE_SEC = 0.2;
    var CYCLE_REF_SEC = 1;
    var kfStyleEl = null;
    var kfSeen = {};
    var kfChunks = [];

    function escapeHtmlAttrValue(val) {
        if (typeof MarkdownColorSpec !== 'undefined' && MarkdownColorSpec.escapeHtmlAttrValue) {
            return MarkdownColorSpec.escapeHtmlAttrValue(val);
        }
        return String(val == null ? '' : val)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;');
    }

    function parseScale(raw) {
        if (raw == null) return 1;
        var t = String(raw).trim();
        if (!t) return 1;
        if (!/^[0-9]+(?:\.[0-9]+)?$/.test(t)) return null;
        var n = parseFloat(t);
        if (!isFinite(n) || n <= 0) return null;
        if (n < SCALE_MIN) n = SCALE_MIN;
        if (n > SCALE_MAX) n = SCALE_MAX;
        return Math.round(n * 1000) / 1000;
    }

    function scaleToToken(n) {
        var v = parseScale(n);
        if (v == null) v = 1;
        if (v === 1) return '1';
        return String(v);
    }

    function formatOpenTag(scale) {
        var n = parseScale(scale);
        if (n == null) n = 1;
        if (n === 1) return '[blink]';
        return '[blink ' + scaleToToken(n) + ']';
    }

    function formatWrap(scale, inner) {
        var body = inner == null ? '' : String(inner);
        return formatOpenTag(scale) + body + CLOSE_TAG;
    }

    function sourceHasBlinkDirectives(src) {
        return BLINK_SOURCE_RE.test(String(src == null ? '' : src));
    }

    function nextOpen(s, from) {
        var re = /\[blink(?:\s+([^\]]*?))?\]/gi;
        re.lastIndex = from < 0 ? 0 : from;
        var m = null;
        while ((m = re.exec(s)) !== null) {
            var scale;
            if (m[1] == null || String(m[1]).trim() === '') {
                scale = 1;
            } else {
                scale = parseScale(m[1]);
                if (scale == null) continue;
            }
            return { index: m.index, length: m[0].length, scale: scale };
        }
        return null;
    }

    function findMatchingClose(s, from) {
        var depth = 1;
        var i = from;
        while (i < s.length) {
            var closeIdx = s.indexOf(CLOSE_TAG, i);
            if (closeIdx < 0) return -1;
            var open = nextOpen(s, i);
            if (open && open.index < closeIdx) {
                depth += 1;
                i = open.index + open.length;
            } else {
                depth -= 1;
                if (depth === 0) return closeIdx;
                i = closeIdx + CLOSE_LEN;
            }
        }
        return -1;
    }

    function findWrapFrom(s, from) {
        var start = from < 0 ? 0 : from;
        while (start < s.length) {
            var open = nextOpen(s, start);
            if (!open) return null;
            var closeIdx = findMatchingClose(s, open.index + open.length);
            if (closeIdx < 0) {
                start = open.index + open.length;
                continue;
            }
            return {
                openStart: open.index,
                openEnd: open.index + open.length,
                innerStart: open.index + open.length,
                innerEnd: closeIdx,
                closeEnd: closeIdx + CLOSE_LEN,
                scale: open.scale
            };
        }
        return null;
    }

    function trimStartWs(s) {
        return String(s == null ? '' : s).replace(/^[\s\u00a0]+/, '');
    }

    function innerLooksLikeBlock(inner) {
        var s = String(inner == null ? '' : inner);
        if (BLOCK_CALLOUT_RE.test(s)) return true;
        if (BLOCK_TAG_RE.test(s)) return true;
        if (s.indexOf('\n') >= 0) return true;
        var t = trimStartWs(s);
        if (ATX_HEADING_RE.test(t)) return true;
        if (BLOCKQUOTE_RE.test(t)) return true;
        if (LIST_RE.test(t)) return true;
        if (TABLE_ROW_RE.test(t)) return true;
        return false;
    }

    function lineHasPipe(s, from, to) {
        var lineStart = s.lastIndexOf('\n', from - 1) + 1;
        var lineEnd = s.indexOf('\n', to);
        if (lineEnd < 0) lineEnd = s.length;
        return s.slice(lineStart, lineEnd).indexOf('|') !== -1;
    }

    function flattenHtml(html) {
        return String(html == null ? '' : html).replace(/\s*\r?\n\s*/g, ' ').trim();
    }

    /**
     * Equal on/off holds. Fade is 0.2s when the cycle is at least 1s.
     * Faster than 1s scales the 1s shape (0.3 / 0.2 / 0.3 / 0.2).
     */
    function cyclePlan(total) {
        var T = typeof total === 'number' ? total : parseScale(total);
        if (T == null || !isFinite(T) || T <= 0) T = 1;
        var fade = FADE_SEC;
        if (T < CYCLE_REF_SEC) fade = FADE_SEC * (T / CYCLE_REF_SEC);
        if (fade * 2 >= T) fade = T / 4;
        var hold = (T - fade * 2) / 2;
        if (hold < 0) hold = 0;
        return { total: T, fade: fade, hold: hold };
    }

    function pct3(n) {
        return Math.round(n * 1000) / 1000;
    }

    function animIdent(scale) {
        return 'text-md-blink-t' + String(scaleToToken(scale)).replace(/\./g, '_');
    }

    function keyframesCss(name, plan) {
        var T = plan.total;
        var pOff = pct3((plan.hold / T) * 100);
        var pFadeOn = pct3(((plan.hold + plan.fade) / T) * 100);
        var pOnEnd = pct3(((plan.hold * 2 + plan.fade) / T) * 100);
        return '@keyframes ' + name + '{'
            + '0%{opacity:0}'
            + pOff + '%{opacity:0}'
            + pFadeOn + '%{opacity:1}'
            + pOnEnd + '%{opacity:1}'
            + '100%{opacity:0}}';
    }

    function writeKeyframeSheet() {
        if (typeof document === 'undefined') return;
        if (!kfStyleEl || !kfStyleEl.parentNode) {
            kfStyleEl = document.createElement('style');
            kfStyleEl.setAttribute('data-text-md-blink-kf', '1');
            document.head.appendChild(kfStyleEl);
        }
        kfStyleEl.textContent = kfChunks.join('')
            + '@media (prefers-reduced-motion:reduce){.text-md-scoped.text-md-root [data-text-md-blink]{animation:none;opacity:1}}';
    }

    function ensureKeyframes(scale) {
        var n = parseScale(scale);
        if (n == null) n = 1;
        var ident = animIdent(n);
        if (kfSeen[ident]) return ident;
        kfSeen[ident] = true;
        var token = scaleToToken(n);
        var plan = cyclePlan(n);
        kfChunks.push(
            keyframesCss(ident, plan)
            + '.text-md-scoped.text-md-root [data-text-md-blink="' + token + '"]{'
            + 'animation-name:' + ident + ';'
            + 'animation-duration:' + plan.total + 's;'
            + 'animation-timing-function:linear;'
            + 'animation-iteration-count:infinite;'
            + 'animation-fill-mode:both;}'
        );
        writeKeyframeSheet();
        return ident;
    }

    function wallClockDelaySec(durationSec) {
        var ms = durationSec * 1000;
        if (!(ms > 0)) return 0;
        return -((Date.now() % ms) / 1000);
    }

    function collectScalesFromHtml(html) {
        var re = /data-text-md-blink="([^"]*)"/g;
        var seen = {};
        var m;
        while ((m = re.exec(String(html))) !== null) {
            var n = parseScale(m[1]);
            if (n == null) n = 1;
            var tok = scaleToToken(n);
            if (!seen[tok]) seen[tok] = n;
        }
        return seen;
    }

    function emitElement(tag, scale, innerHtml) {
        var attr = escapeHtmlAttrValue(scaleToToken(scale));
        return '<' + tag + ' ' + DATA_ATTR + '="' + attr + '">' + innerHtml + '</' + tag + '>';
    }

    function emitBlockElement(source, wrap, innerHtml) {
        var html = emitElement('div', wrap.scale, innerHtml);
        if (lineHasPipe(source, wrap.openStart, wrap.closeEnd)) return html;
        var next = wrap.closeEnd < source.length ? source.charAt(wrap.closeEnd) : '';
        var suffix = (next === '\n' || next === '') ? '\n' : '\n\n';
        return '\n' + html + suffix;
    }

    function preprocessForRender(src, handlers) {
        if (src === undefined || src === null) return '';
        var s = String(src);
        if (!sourceHasBlinkDirectives(s)) return s;
        var h = handlers || {};
        var renderInline = typeof h.renderInline === 'function' ? h.renderInline : function (inner) {
            return inner == null ? '' : String(inner);
        };
        var renderBlock = typeof h.renderBlock === 'function' ? h.renderBlock : renderInline;
        var out = '';
        var i = 0;
        var guard = 0;
        while (i < s.length && guard < 400) {
            guard += 1;
            var wrap = findWrapFrom(s, i);
            if (!wrap) {
                out += s.slice(i);
                break;
            }
            out += s.slice(i, wrap.openStart);
            var inner = s.slice(wrap.innerStart, wrap.innerEnd);
            var innerHtml;
            if (innerLooksLikeBlock(inner)) {
                innerHtml = flattenHtml(renderBlock(inner));
                out += emitBlockElement(s, wrap, innerHtml);
            } else {
                innerHtml = renderInline(inner);
                out += emitElement('span', wrap.scale, innerHtml);
            }
            i = wrap.closeEnd;
        }
        return out;
    }

    function ensureKeyframesForRoot(rootEl) {
        if (!rootEl || !rootEl.querySelectorAll) return;
        var els = rootEl.querySelectorAll('[' + DATA_ATTR + ']');
        var i = 0;
        for (i = 0; i < els.length; i++) {
            var n = parseScale(els[i].getAttribute(DATA_ATTR));
            if (n == null) n = 1;
            ensureKeyframes(n);
        }
    }

    function materializeInHtml(html) {
        if (!html || html.indexOf(DATA_ATTR) < 0) return html;
        var seen = collectScalesFromHtml(html);
        var tok;
        for (tok in seen) {
            if (Object.prototype.hasOwnProperty.call(seen, tok)) {
                ensureKeyframes(seen[tok]);
            }
        }
        return html;
    }

    function reapplyFromDataAttrs(rootEl) {
        ensureKeyframesForRoot(rootEl);
    }

    function syncPhase(rootEl) {
        if (!rootEl || !rootEl.querySelectorAll) return;
        var els = rootEl.querySelectorAll('[' + DATA_ATTR + ']');
        var i = 0;
        for (i = 0; i < els.length; i++) {
            var el = els[i];
            if (!el.style) continue;
            var n = parseScale(el.getAttribute(DATA_ATTR));
            if (n == null) n = 1;
            ensureKeyframes(n);
            el.style.animationDelay = wallClockDelaySec(n).toFixed(3) + 's';
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
        var best = null;
        function consider(from, limit) {
            var i = from;
            while (i < limit) {
                var wrap = findWrapFrom(s, i);
                if (!wrap || wrap.openStart >= limit) break;
                if (a >= wrap.openStart && b <= wrap.closeEnd) {
                    if (!best || wrap.openStart >= best.openStart) best = wrap;
                    consider(wrap.innerStart, wrap.innerEnd);
                }
                i = wrap.closeEnd;
            }
        }
        consider(0, s.length);
        return best;
    }

    var MarkdownBlink = {
        DATA_ATTR: DATA_ATTR,
        SCALE_MIN: SCALE_MIN,
        SCALE_MAX: SCALE_MAX,
        parseScale: parseScale,
        scaleToToken: scaleToToken,
        formatOpenTag: formatOpenTag,
        formatWrap: formatWrap,
        sourceHasBlinkDirectives: sourceHasBlinkDirectives,
        preprocessForRender: preprocessForRender,
        materializeInHtml: materializeInHtml,
        reapplyFromDataAttrs: reapplyFromDataAttrs,
        syncPhase: syncPhase,
        parseWrapAt: parseWrapAt,
        innerLooksLikeBlock: innerLooksLikeBlock,
        cyclePlan: cyclePlan,
        ensureKeyframes: ensureKeyframes
    };

    global.MarkdownBlink = MarkdownBlink;
})(typeof window !== 'undefined' ? window : this);
