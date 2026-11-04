/**
 * Pure string helpers for Markdown editing in a textarea (no DOM).
 * Used by the Text widget full editor; no optional chaining (Safari 12).
 */
(function (global) {
    function normIdx(n, max) {
        if (n < 0) return 0;
        if (n > max) return max;
        return n;
    }

    function lineIndexAt(s, pos) {
        if (!s.length) return 0;
        const p = normIdx(pos, s.length);
        let i = 0;
        const lines = s.split('\n');
        let acc = 0;
        for (i = 0; i < lines.length; i++) {
            const L = lines[i].length;
            const lineEnd = acc + L;
            if (p <= lineEnd) return i;
            acc = lineEnd + 1;
        }
        return lines.length - 1;
    }

    function lineRange(s, start, end) {
        const a = normIdx(start, s.length);
        const b = normIdx(end, s.length);
        const from = a < b ? a : b;
        const to = a < b ? b : a;
        const i0 = lineIndexAt(s, from);
        const i1 = lineIndexAt(s, to > 0 && to > from ? to - 1 : to);
        const lStart = i0;
        const lEnd = i1 < i0 ? i0 : i1;
        return { lineStart: lStart, lineEnd: lEnd };
    }

    function mapSelectedLines(s, start, end, fn) {
        const r = lineRange(s, start, end);
        const lines = s.split('\n');
        const out = [];
        let j = 0;
        for (j = 0; j < lines.length; j++) {
            if (j < r.lineStart || j > r.lineEnd) {
                out.push(lines[j]);
            } else {
                out.push(fn(lines[j], j));
            }
        }
        return out.join('\n');
    }

    function insertAt(s, start, end, ins) {
        const a = normIdx(start, s.length);
        const b = normIdx(end, s.length);
        const from = a < b ? a : b;
        const to = a < b ? b : a;
        return { text: s.slice(0, from) + ins + s.slice(to), cursor: from + ins.length, selEnd: from + ins.length };
    }

    function wrapRange(s, start, end, before, after) {
        const a = normIdx(start, s.length);
        const b = normIdx(end, s.length);
        const from = a < b ? a : b;
        const to = a < b ? b : a;
        const selected = s.slice(from, to) || (before === '**' ? 'bold text' : before === '*' ? 'italic' : (before === '<s>' ? 'strikethrough' : 'text'));
        const ins = before + selected + (after || '');
        const t = s.slice(0, from) + ins + s.slice(to);
        const c1 = from + before.length;
        const c2 = c1 + selected.length;
        return { text: t, start: c1, end: c2 };
    }

    function wrapBlockCallout(s, start, end, blockIndex) {
        let bi = parseInt(String(blockIndex), 10);
        if (!(bi >= 1 && bi <= 4)) bi = 1;
        const a = normIdx(start, s.length);
        const b = normIdx(end, s.length);
        const from = a < b ? a : b;
        const to = a < b ? b : a;
        const selected = s.slice(from, to) || 'Callout text';
        const before = '[block' + bi + ':';
        const after = ']';
        const ins = before + selected + after;
        const t = s.slice(0, from) + ins + s.slice(to);
        const c1 = from + before.length;
        const c2 = c1 + selected.length;
        return { text: t, start: c1, end: c2 };
    }

    function stripHeadingPrefix(line) {
        const m = /^\s{0,3}(#{1,6})\s+/.exec(line);
        if (m) {
            return line.slice(0, m.index) + line.slice(m.index + m[0].length);
        }
        return line;
    }

    function setHeadingLevelFixed(s, start, end, level) {
        if (level < 1) level = 1;
        if (level > 3) level = 3;
        const prefix = new Array(level + 1).join('#') + ' ';
        return mapSelectedLines(s, start, end, function (line) {
            const stripped = stripHeadingPrefix(line);
            const rest = stripped.replace(/^\s*/, '');
            if (!rest) return prefix;
            return prefix + rest;
        });
    }

    function splitCellSegmentsWithOffsets(cellText) {
        var re = /<br\s*\/?>/gi;
        var segs = [];
        var last = 0;
        var m;
        while ((m = re.exec(cellText)) !== null) {
            segs.push({ start: last, end: m.index, text: cellText.slice(last, m.index) });
            last = m.index + m[0].length;
        }
        segs.push({ start: last, end: cellText.length, text: cellText.slice(last) });
        return segs;
    }

    function setHeadingInCellSegment(seg, level) {
        var prefix = '';
        var body = seg;
        if (typeof MarkdownCellColor !== 'undefined' && MarkdownCellColor.parseDirective) {
            var d = MarkdownCellColor.parseDirective(seg);
            if (d) {
                prefix = seg.slice(0, seg.length - d.body.length);
                body = d.body;
            }
        }
        var leadMatch = /^\s*/.exec(body);
        var lead = leadMatch ? leadMatch[0] : '';
        var rest = body.slice(lead.length);
        var hm = /^(#{1,3})\s+/.exec(rest);
        if (hm) {
            rest = rest.slice(hm[0].length);
            if (hm[1].length === level) {
                return prefix + lead + rest;
            }
        }
        var marker = new Array(level + 1).join('#') + ' ';
        return prefix + lead + marker + rest;
    }

    /**
     * Set/toggle a heading. Inside a pipe-table cell the heading is applied to the
     * current <br> segment (so the table row is not broken); elsewhere it is a line heading.
     */
    function setHeadingSmart(s, start, end, level) {
        if (level < 1) level = 1;
        if (level > 3) level = 3;
        var text = String(s == null ? '' : s);
        var pos = normIdx(start, text.length);
        var ctx = (typeof MarkdownTableUtils !== 'undefined' && MarkdownTableUtils.getTableCellAtOffset)
            ? MarkdownTableUtils.getTableCellAtOffset(text, pos)
            : null;
        if (!ctx) {
            return setHeadingLevelFixed(text, start, end, level);
        }
        var cellText = ctx.cellText;
        var posInCell = pos - ctx.cellStart;
        if (posInCell < 0) posInCell = 0;
        if (posInCell > cellText.length) posInCell = cellText.length;
        var segs = splitCellSegmentsWithOffsets(cellText);
        var k = segs.length - 1;
        var i;
        for (i = 0; i < segs.length; i++) {
            if (posInCell >= segs[i].start && posInCell <= segs[i].end) {
                k = i;
                break;
            }
        }
        var oldSeg = segs[k].text;
        var newSeg = setHeadingInCellSegment(oldSeg, level);
        var newCellText = cellText.slice(0, segs[k].start) + newSeg + cellText.slice(segs[k].end);
        var delta = newSeg.length - oldSeg.length;
        var newPosInCell = posInCell + delta;
        if (newPosInCell < segs[k].start) newPosInCell = segs[k].start;
        if (newPosInCell > newCellText.length) newPosInCell = newCellText.length;
        var rebuilt = text.slice(0, ctx.cellStart) + newCellText + text.slice(ctx.cellEnd);
        var cursor = ctx.cellStart + newPosInCell;
        return { text: rebuilt, cursor: cursor, selEnd: cursor };
    }

    function toggleUnorderedList(s, start, end) {
        return mapSelectedLines(s, start, end, function (line) {
            const t = line.replace(/^\s*/, '');
            if (t.indexOf('- ') === 0) return line.replace(/^(\s*)- /, '$1');
            if (t.indexOf('* ') === 0) return line.replace(/^(\s*)\* /, '$1');
            const indent = line.length - t.length;
            return line.slice(0, indent) + '- ' + t;
        });
    }

    function toggleOrderedList(s, start, end) {
        let n = 1;
        return mapSelectedLines(s, start, end, function (line) {
            const t = line.replace(/^\s*/, '');
            const om = /^\d+\.\s+/.exec(t);
            if (om) {
                return line.replace(/^\s*\d+\.\s+/, '');
            }
            const indent = line.length - t.length;
            const r = line.slice(0, indent) + n + '. ' + t;
            n += 1;
            return r;
        });
    }

    function toggleBlockquote(s, start, end) {
        return mapSelectedLines(s, start, end, function (line) {
            if (line.indexOf('> ') === 0) return line.slice(2);
            return '> ' + line;
        });
    }

    function buildTableMarkdown(columns, dataRows) {
        const c = Math.max(1, Math.min(12, Math.floor(columns) || 2));
        const r = Math.max(1, Math.min(20, Math.floor(dataRows) || 2));
        const headers = [];
        const sep = [];
        let h = 0;
        for (h = 0; h < c; h++) {
            headers.push('Col ' + (h + 1));
            sep.push('---');
        }
        const headRow = '| ' + headers.join(' | ') + ' |';
        const sepRow = '| ' + sep.join(' | ') + ' |';
        const rows = [];
        let i = 0;
        for (i = 0; i < r; i++) {
            const cells = [];
            let j = 0;
            for (j = 0; j < c; j++) {
                cells.push(' ');
            }
            rows.push('| ' + cells.join(' | ') + ' |');
        }
        return headRow + '\n' + sepRow + '\n' + rows.join('\n') + '\n';
    }

    const MarkdownTextOps = {
        insertAt: insertAt,
        lineRange: lineRange,
        wrapBold: function (s, start, end) { return wrapRange(s, start, end, '**', '**'); },
        wrapItalic: function (s, start, end) { return wrapRange(s, start, end, '*', '*'); },
        wrapStrikethrough: function (s, start, end) { return wrapRange(s, start, end, '<s>', '</s>'); },
        wrapInlineCode: function (s, start, end) { return wrapRange(s, start, end, '`', '`'); },
        wrapBlockCallout: wrapBlockCallout,
        wrapCodeBlock: function (s, start, end) {
            const a = normIdx(start, s.length);
            const b = normIdx(end, s.length);
            const from = a < b ? a : b;
            const to = a < b ? b : a;
            const body = s.slice(from, to) || 'code';
            const block = '```\n' + body + '\n```\n';
            return { text: s.slice(0, from) + block + s.slice(to), start: from + 4, end: from + 4 + body.length };
        },
        setHeading: setHeadingSmart,
        toggleBulletList: toggleUnorderedList,
        toggleNumberedList: toggleOrderedList,
        toggleBlockquote: toggleBlockquote,
        insertHorizontalRule: function (s, start) {
            const p = normIdx(start, s.length);
            const before = s.slice(0, p);
            const after = s.slice(p);
            const ins = (before && before.slice(-1) !== '\n' ? '\n' : '') + '---\n';
            return insertAt(s, p, p, ins);
        },
        insertLink: function (s, start, end, url, openNewTab) {
            const a = normIdx(start, s.length);
            const b = normIdx(end, s.length);
            const from = a < b ? a : b;
            const to = a < b ? b : a;
            const u = (url && String(url)) || 'https://';
            const label = s.slice(from, to) || 'link text';
            const suffix = openNewTab === true ? ' ^' : '';
            const md = '[' + label + '](' + u + suffix + ')';
            return { text: s.slice(0, from) + md + s.slice(to), start: from, end: from + md.length };
        },
        insertImage: function (s, start, end, url, alt) {
            const a = normIdx(start, s.length);
            const b = normIdx(end, s.length);
            const from = a < b ? a : b;
            const to = a < b ? b : a;
            const u = (url && String(url)) || '';
            const al = (alt && String(alt)) || 'Image';
            const md = '![' + al + '](' + u + ')';
            return { text: s.slice(0, from) + md + s.slice(to), start: from + md.length, selEnd: from + md.length };
        },
        buildTable: buildTableMarkdown,
        insertText: function (s, start, end, t) { return insertAt(s, start, end, t || ''); },

        getTableCellContext: function (text, start, end) {
            if (typeof MarkdownTableUtils === 'undefined' || !MarkdownTableUtils.getTableCellAtOffset) {
                return null;
            }
            var a = normIdx(start, String(text).length);
            return MarkdownTableUtils.getTableCellAtOffset(text, a);
        },

        getTableColumnAlign: function (text, start, end) {
            if (typeof MarkdownTableUtils === 'undefined' || !MarkdownTableUtils.getTableColumnAlignAtOffset) {
                return null;
            }
            var a = normIdx(start, String(text).length);
            return MarkdownTableUtils.getTableColumnAlignAtOffset(text, a);
        },

        setTableColumnAlign: function (text, start, end, align) {
            if (typeof MarkdownTableUtils === 'undefined' || !MarkdownTableUtils.setTableColumnAlign) {
                return { text: text, cursor: start, selEnd: end };
            }
            var a = normIdx(start, String(text).length);
            return MarkdownTableUtils.setTableColumnAlign(text, a, align);
        },

        applyTableCellBackground: function (text, start, end, colorSpec) {
            var ctx = MarkdownTextOps.getTableCellContext(text, start, end);
            if (!ctx || typeof MarkdownCellColor === 'undefined') {
                return { text: text, cursor: start, selEnd: end };
            }
            var validated = MarkdownCellColor.validateColorSpec(colorSpec);
            if (!validated) {
                return { text: text, cursor: start, selEnd: end };
            }
            var newCell = MarkdownCellColor.setCellDirective(ctx.cellText, validated);
            var t = String(text);
            var rebuilt = t.slice(0, ctx.cellStart) + newCell + t.slice(ctx.cellEnd);
            var cursor = ctx.cellStart + newCell.length;
            return { text: rebuilt, cursor: cursor, selEnd: cursor };
        },

        removeTableCellBackground: function (text, start, end) {
            var ctx = MarkdownTextOps.getTableCellContext(text, start, end);
            if (!ctx || typeof MarkdownCellColor === 'undefined') {
                return { text: text, cursor: start, selEnd: end };
            }
            var newCell = MarkdownCellColor.removeCellDirective(ctx.cellText);
            var t = String(text);
            var rebuilt = t.slice(0, ctx.cellStart) + newCell + t.slice(ctx.cellEnd);
            var cursor = ctx.cellStart + newCell.length;
            return { text: rebuilt, cursor: cursor, selEnd: cursor };
        },

        getTextColorAtSelection: function (text, start, end) {
            if (typeof MarkdownTextColor === 'undefined') return '';
            var a = normIdx(start, String(text).length);
            var b = normIdx(end, String(text).length);
            var wrap = MarkdownTextColor.parseWrapAt(text, a, b);
            return wrap && wrap.color ? wrap.color : '';
        },

        wrapTextColor: function (text, start, end, colorSpec) {
            if (typeof MarkdownTextColor === 'undefined') {
                return { text: text, cursor: start, selEnd: end };
            }
            var validated = MarkdownTextColor.validateColorSpec(colorSpec);
            if (!validated) {
                return { text: text, cursor: start, selEnd: end };
            }
            var a = normIdx(start, String(text).length);
            var b = normIdx(end, String(text).length);
            var from = a < b ? a : b;
            var to = a < b ? b : a;
            var existing = MarkdownTextColor.parseWrapAt(text, from, to);
            if (existing && existing.color) {
                var inner = String(text).slice(existing.innerStart, existing.innerEnd);
                var wrapped = MarkdownTextColor.formatWrap(validated, inner);
                var rebuilt = String(text).slice(0, existing.openStart) + wrapped + String(text).slice(existing.closeEnd);
                var c1 = existing.openStart + ('[color ' + validated + ']').length;
                var c2 = c1 + inner.length;
                return { text: rebuilt, cursor: c1, selEnd: c2 };
            }
            var selected = String(text).slice(from, to) || 'text';
            var ins = MarkdownTextColor.formatWrap(validated, selected);
            var t = String(text).slice(0, from) + ins + String(text).slice(to);
            var c1 = from + ('[color ' + validated + ']').length;
            var c2 = c1 + selected.length;
            return { text: t, cursor: c1, selEnd: c2 };
        },

        unwrapTextColor: function (text, start, end) {
            if (typeof MarkdownTextColor === 'undefined') {
                return { text: text, cursor: start, selEnd: end };
            }
            var a = normIdx(start, String(text).length);
            var b = normIdx(end, String(text).length);
            var wrap = MarkdownTextColor.parseWrapAt(text, a, b);
            if (!wrap) {
                return { text: text, cursor: start, selEnd: end };
            }
            var inner = String(text).slice(wrap.innerStart, wrap.innerEnd);
            var rebuilt = String(text).slice(0, wrap.openStart) + inner + String(text).slice(wrap.closeEnd);
            var cursor = wrap.openStart;
            var selEnd = wrap.openStart + inner.length;
            return { text: rebuilt, cursor: cursor, selEnd: selEnd };
        },

        wrapBlink: function (text, start, end, scale) {
            if (typeof MarkdownBlink === 'undefined' || !MarkdownBlink.formatWrap) {
                return { text: text, cursor: start, selEnd: end };
            }
            var n = MarkdownBlink.parseScale(scale == null || scale === '' ? '1' : scale);
            if (n == null) n = 1;
            var a = normIdx(start, String(text).length);
            var b = normIdx(end, String(text).length);
            var from = a < b ? a : b;
            var to = a < b ? b : a;
            var existing = MarkdownBlink.parseWrapAt(text, from, to);
            if (existing) {
                var inner = String(text).slice(existing.innerStart, existing.innerEnd);
                var wrapped = MarkdownBlink.formatWrap(n, inner);
                var rebuilt = String(text).slice(0, existing.openStart) + wrapped + String(text).slice(existing.closeEnd);
                var c1 = existing.openStart + MarkdownBlink.formatOpenTag(n).length;
                var c2 = c1 + inner.length;
                return { text: rebuilt, cursor: c1, selEnd: c2 };
            }
            var selected = String(text).slice(from, to) || 'text';
            var ins = MarkdownBlink.formatWrap(n, selected);
            var t = String(text).slice(0, from) + ins + String(text).slice(to);
            var c1 = from + MarkdownBlink.formatOpenTag(n).length;
            var c2 = c1 + selected.length;
            return { text: t, cursor: c1, selEnd: c2 };
        }
    };

    global.MarkdownTextOps = MarkdownTextOps;
})(typeof window !== 'undefined' ? window : this);
