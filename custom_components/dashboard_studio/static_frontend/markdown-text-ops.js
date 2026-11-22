/**
 * Pure string helpers for Markdown editing and bidirectional Block Codec (no DOM).
 * Used by the Text widget full editor; no optional chaining or nullish coalescing (Safari 12).
 */
(function (global) {
    function normIdx(n, max) {
        if (n < 0) return 0;
        if (n > max) return max;
        return n;
    }

    function lineIndexAt(s, pos) {
        if (!s.length) return 0;
        var p = normIdx(pos, s.length);
        var i = 0;
        var lines = s.split('\n');
        var acc = 0;
        for (i = 0; i < lines.length; i++) {
            var L = lines[i].length;
            var lineEnd = acc + L;
            if (p <= lineEnd) return i;
            acc = lineEnd + 1;
        }
        return lines.length - 1;
    }

    function lineStartOffset(s, lineIdx) {
        var lines = s.split('\n');
        var acc = 0;
        var i = 0;
        for (i = 0; i < lineIdx && i < lines.length; i++) {
            acc += lines[i].length + 1;
        }
        return acc;
    }

    function lineRange(s, start, end) {
        var a = normIdx(start, s.length);
        var b = normIdx(end, s.length);
        var from = a < b ? a : b;
        var to = a < b ? b : a;
        var i0 = lineIndexAt(s, from);
        var i1 = lineIndexAt(s, to > 0 && to > from ? to - 1 : to);
        var lStart = i0;
        var lEnd = i1 < i0 ? i0 : i1;
        return { lineStart: lStart, lineEnd: lEnd };
    }

    function mapSelectedLines(s, start, end, fn) {
        var r = lineRange(s, start, end);
        var lines = s.split('\n');
        var out = [];
        var j = 0;
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
        var a = normIdx(start, s.length);
        var b = normIdx(end, s.length);
        var from = a < b ? a : b;
        var to = a < b ? b : a;
        return { text: s.slice(0, from) + ins + s.slice(to), cursor: from + ins.length, selEnd: from + ins.length };
    }

    function wrapRange(s, start, end, before, after) {
        var a = normIdx(start, s.length);
        var b = normIdx(end, s.length);
        var from = a < b ? a : b;
        var to = a < b ? b : a;
        var selected = s.slice(from, to) || (before === '**' ? 'bold text' : before === '*' ? 'italic' : (before === '<s>' ? 'strikethrough' : 'text'));
        var ins = before + selected + (after || '');
        var t = s.slice(0, from) + ins + s.slice(to);
        var c1 = from + before.length;
        var c2 = c1 + selected.length;
        return { text: t, start: c1, end: c2 };
    }

    function validateColorSpecFallback(raw) {
        if (typeof MarkdownColorSpec !== 'undefined' && MarkdownColorSpec.validateColorSpec) {
            return MarkdownColorSpec.validateColorSpec(raw);
        }
        var t = String(raw == null ? '' : raw).replace(/^\s+|\s+$/g, '');
        if (!t) return null;
        if (/^#[0-9a-f]{3,8}$/i.test(t) || /^@[a-z][a-z0-9_-]*$/i.test(t)) return t;
        if (/^(?:rgb|hsl)a?\([^)]+\)$/i.test(t)) return t;
        return null;
    }

    function wrapBlockCallout(s, start, end, blockIndex) {
        var bi = parseInt(String(blockIndex), 10);
        if (!(bi >= 1 && bi <= 4)) bi = 1;
        var a = normIdx(start, s.length);
        var b = normIdx(end, s.length);
        var from = a < b ? a : b;
        var to = a < b ? b : a;
        var selected = s.slice(from, to) || 'Callout text';
        var before = '[block' + bi + ':';
        var after = ']';
        var ins = before + selected + after;
        var t = s.slice(0, from) + ins + s.slice(to);
        var c1 = from + before.length;
        var c2 = c1 + selected.length;
        return { text: t, start: c1, end: c2 };
    }

    function wrapBlockCalloutCustom(s, start, end, colorOrIndex) {
        var raw = String(colorOrIndex == null ? '1' : colorOrIndex).replace(/^\s+|\s+$/g, '');
        if (/^[1-4]$/.test(raw)) {
            return wrapBlockCallout(s, start, end, raw);
        }
        var validated = validateColorSpecFallback(raw);
        if (!validated) {
            return wrapBlockCallout(s, start, end, 1);
        }
        var a = normIdx(start, s.length);
        var b = normIdx(end, s.length);
        var from = a < b ? a : b;
        var to = a < b ? b : a;
        var selected = s.slice(from, to) || 'Callout text';
        var before = '[block ' + validated + ':';
        var after = ']';
        var ins = before + selected + after;
        var t = s.slice(0, from) + ins + s.slice(to);
        var c1 = from + before.length;
        var c2 = c1 + selected.length;
        return { text: t, start: c1, end: c2 };
    }

    function stripHeadingPrefix(line) {
        var m = /^\s{0,3}(#{1,6})\s+/.exec(line);
        if (m) {
            return line.slice(0, m.index) + line.slice(m.index + m[0].length);
        }
        return line;
    }

    function setHeadingLevelFixed(s, start, end, level) {
        if (level < 1) level = 1;
        if (level > 3) level = 3;
        var prefix = new Array(level + 1).join('#') + ' ';
        return mapSelectedLines(s, start, end, function (line) {
            var stripped = stripHeadingPrefix(line);
            var rest = stripped.replace(/^\s*/, '');
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
            var t = line.replace(/^\s*/, '');
            if (t.indexOf('- ') === 0) return line.replace(/^(\s*)- /, '$1');
            if (t.indexOf('* ') === 0) return line.replace(/^(\s*)\* /, '$1');
            var indent = line.length - t.length;
            return line.slice(0, indent) + '- ' + t;
        });
    }

    function toggleOrderedList(s, start, end) {
        var n = 1;
        return mapSelectedLines(s, start, end, function (line) {
            var t = line.replace(/^\s*/, '');
            var om = /^\d+\.\s+/.exec(t);
            if (om) {
                return line.replace(/^\s*\d+\.\s+/, '');
            }
            var indent = line.length - t.length;
            var r = line.slice(0, indent) + n + '. ' + t;
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
        var c = Math.max(1, Math.min(20, Math.floor(columns) || 2));
        var r = Math.max(1, Math.min(100, Math.floor(dataRows) || 2));
        var headers = [];
        var sep = [];
        var h = 0;
        for (h = 0; h < c; h++) {
            headers.push('Col ' + (h + 1));
            sep.push('---');
        }
        var headRow = '| ' + headers.join(' | ') + ' |';
        var sepRow = '| ' + sep.join(' | ') + ' |';
        var rows = [];
        var i = 0;
        for (i = 0; i < r; i++) {
            var cells = [];
            var j = 0;
            for (j = 0; j < c; j++) {
                cells.push(' ');
            }
            rows.push('| ' + cells.join(' | ') + ' |');
        }
        return headRow + '\n' + sepRow + '\n' + rows.join('\n') + '\n';
    }

    // ---- Smart pipe splitting (preserves | inside ![...](...), :ph...:, {{...}}, `...`, \|) ----

    function splitPipeRowSmart(line) {
        var s = String(line == null ? '' : line).replace(/^\s+|\s+$/g, '');
        if (!s) return [];
        if (s.charAt(0) === '|') s = s.slice(1);
        if (s.length > 0 && s.charAt(s.length - 1) === '|' && (s.length < 2 || s.charAt(s.length - 2) !== '\\')) {
            s = s.slice(0, -1);
        }
        var cells = [];
        var cur = '';
        var i = 0;
        while (i < s.length) {
            var ch = s.charAt(i);
            var next = i + 1 < s.length ? s.charAt(i + 1) : '';
            if (ch === '\\' && next) {
                cur += ch + next;
                i += 2;
                continue;
            }
            if (ch === '{' && next === '{') {
                var depth = 1;
                var j = i + 2;
                while (j < s.length && depth > 0) {
                    if (s.charAt(j) === '{' && s.charAt(j + 1) === '{') {
                        depth += 1;
                        j += 2;
                    } else if (s.charAt(j) === '}' && s.charAt(j + 1) === '}') {
                        depth -= 1;
                        j += 2;
                    } else {
                        j += 1;
                    }
                }
                cur += s.slice(i, j);
                i = j;
                continue;
            }
            if (ch === '`' && s.indexOf('`', i + 1) > i) {
                var codeEnd = s.indexOf('`', i + 1);
                cur += s.slice(i, codeEnd + 1);
                i = codeEnd + 1;
                continue;
            }
            if ((ch === '!' && next === '[') || ch === '[') {
                var bStart = ch === '!' ? i + 1 : i;
                var bClose = s.indexOf('](', bStart);
                if (bClose > bStart) {
                    var pClose = s.indexOf(')', bClose + 2);
                    if (pClose > bClose) {
                        cur += s.slice(i, pClose + 1);
                        i = pClose + 1;
                        continue;
                    }
                }
            }
            if (ch === ':' && s.slice(i, i + 3) === ':ph') {
                var phParen = s.slice(i, i + 4) === ':ph(';
                if (phParen) {
                    var closeParenColon = s.indexOf('):', i + 4);
                    if (closeParenColon > i) {
                        cur += s.slice(i, closeParenColon + 2);
                        i = closeParenColon + 2;
                        continue;
                    }
                } else {
                    var closeColon = s.indexOf(':', i + 3);
                    if (closeColon > i) {
                        cur += s.slice(i, closeColon + 1);
                        i = closeColon + 1;
                        continue;
                    }
                }
            }
            if (ch === '|') {
                cells.push(cur);
                cur = '';
                i += 1;
                continue;
            }
            cur += ch;
            i += 1;
        }
        cells.push(cur);
        return cells;
    }

    function joinPipeRow(cells) {
        var parts = [];
        var i;
        for (i = 0; i < cells.length; i++) {
            parts.push(cells[i] == null ? '' : String(cells[i]));
        }
        return '| ' + parts.join(' | ') + ' |';
    }

    function getTableBlockContextAtOffset(text, offset) {
        if (typeof MarkdownTableUtils === 'undefined') return null;
        var s = String(text == null ? '' : text).replace(/\r/g, '');
        if (!s.length) return null;
        var pos = normIdx(offset, s.length);
        var lines = s.split('\n');
        var li = lineIndexAt(s, pos);
        var i = 0;
        while (i < lines.length) {
            var headerLine = lines[i];
            var sepLine = lines[i + 1];
            if (MarkdownTableUtils.isHeaderLine(headerLine) && MarkdownTableUtils.isSeparatorLine(sepLine)) {
                var last = i + 1;
                var j = i + 2;
                while (j < lines.length && MarkdownTableUtils.isTableRowLine(lines[j]) && !MarkdownTableUtils.isSeparatorLine(lines[j])) {
                    last = j;
                    j += 1;
                }
                if (li >= i && li <= last) {
                    var alignInfo = MarkdownTableUtils.getTableColumnAlignAtOffset
                        ? MarkdownTableUtils.getTableColumnAlignAtOffset(s, pos)
                        : null;
                    var colCount = Math.max(
                        splitPipeRowSmart(headerLine).length,
                        splitPipeRowSmart(sepLine).length
                    );
                    return {
                        lines: lines,
                        lineIndex: li,
                        headerIndex: i,
                        sepIndex: i + 1,
                        lastIndex: last,
                        colCount: colCount,
                        cellIndex: alignInfo ? alignInfo.cellIndex : 0
                    };
                }
                i = j;
                continue;
            }
            i += 1;
        }
        return null;
    }

    function rebuildLinesWithCursor(lines, targetLineIdx, targetCellIdx) {
        var rebuilt = lines.join('\n');
        var lStart = lineStartOffset(rebuilt, targetLineIdx);
        var line = lines[targetLineIdx] || '';
        var cursor = lStart;
        if (typeof MarkdownTableUtils !== 'undefined' && MarkdownTableUtils.getCellRangesInLine) {
            var ranges = MarkdownTableUtils.getCellRangesInLine(line, lStart);
            if (ranges.length) {
                var idx = Math.max(0, Math.min(ranges.length - 1, targetCellIdx));
                cursor = ranges[idx].start;
                if (line.charAt(cursor - lStart) === ' ') cursor += 1;
            }
        }
        return { text: rebuilt, cursor: cursor, selEnd: cursor };
    }

    function insertTableRow(text, offset, position) {
        var ctx = getTableBlockContextAtOffset(text, offset);
        if (!ctx) return { text: text, cursor: offset, selEnd: offset };
        var blanks = [];
        var c;
        for (c = 0; c < ctx.colCount; c++) blanks.push('');
        var newRow = joinPipeRow(blanks);
        var insertAtIdx;
        if (ctx.lineIndex <= ctx.sepIndex) {
            insertAtIdx = ctx.sepIndex + 1;
        } else {
            insertAtIdx = position === 'above' ? ctx.lineIndex : ctx.lineIndex + 1;
        }
        ctx.lines.splice(insertAtIdx, 0, newRow);
        return rebuildLinesWithCursor(ctx.lines, insertAtIdx, ctx.cellIndex);
    }

    function deleteTableRow(text, offset) {
        var ctx = getTableBlockContextAtOffset(text, offset);
        if (!ctx || ctx.lineIndex <= ctx.sepIndex) {
            return { text: text, cursor: offset, selEnd: offset };
        }
        ctx.lines.splice(ctx.lineIndex, 1);
        var nextLine = Math.min(ctx.lineIndex, ctx.lines.length - 1);
        if (nextLine <= ctx.sepIndex) nextLine = ctx.headerIndex;
        return rebuildLinesWithCursor(ctx.lines, nextLine, ctx.cellIndex);
    }

    function padRowCellsToCount(cells, count, filler) {
        var out = [];
        var i;
        for (i = 0; i < count; i++) {
            out.push(i < cells.length ? String(cells[i]).replace(/^\s+|\s+$/g, '') : filler);
        }
        return out;
    }

    function insertTableColumn(text, offset, position) {
        var ctx = getTableBlockContextAtOffset(text, offset);
        if (!ctx || ctx.colCount >= 20) return { text: text, cursor: offset, selEnd: offset };
        var insCol = position === 'left' ? ctx.cellIndex : ctx.cellIndex + 1;
        if (insCol < 0) insCol = 0;
        if (insCol > ctx.colCount) insCol = ctx.colCount;
        var r;
        for (r = ctx.headerIndex; r <= ctx.lastIndex; r++) {
            var cells = padRowCellsToCount(splitPipeRowSmart(ctx.lines[r]), ctx.colCount, r === ctx.sepIndex ? '---' : '');
            var val = r === ctx.headerIndex ? ('Col ' + (ctx.colCount + 1)) : (r === ctx.sepIndex ? '---' : '');
            cells.splice(insCol, 0, val);
            ctx.lines[r] = joinPipeRow(cells);
        }
        return rebuildLinesWithCursor(ctx.lines, ctx.lineIndex, insCol);
    }

    function deleteTableColumn(text, offset) {
        var ctx = getTableBlockContextAtOffset(text, offset);
        if (!ctx || ctx.colCount <= 1) return { text: text, cursor: offset, selEnd: offset };
        var delCol = Math.max(0, Math.min(ctx.colCount - 1, ctx.cellIndex));
        var r;
        for (r = ctx.headerIndex; r <= ctx.lastIndex; r++) {
            var cells = padRowCellsToCount(splitPipeRowSmart(ctx.lines[r]), ctx.colCount, r === ctx.sepIndex ? '---' : '');
            cells.splice(delCol, 1);
            ctx.lines[r] = joinPipeRow(cells);
        }
        var nextCol = Math.min(delCol, ctx.colCount - 2);
        return rebuildLinesWithCursor(ctx.lines, ctx.lineIndex, nextCol);
    }

    function moveTableColumn(text, offset, dir) {
        var ctx = getTableBlockContextAtOffset(text, offset);
        if (!ctx || ctx.colCount <= 1) return { text: text, cursor: offset, selEnd: offset };
        var fromCol = Math.max(0, Math.min(ctx.colCount - 1, ctx.cellIndex));
        var toCol = fromCol + (dir < 0 ? -1 : 1);
        if (toCol < 0 || toCol >= ctx.colCount) return { text: text, cursor: offset, selEnd: offset };
        var r;
        for (r = ctx.headerIndex; r <= ctx.lastIndex; r++) {
            var cells = padRowCellsToCount(splitPipeRowSmart(ctx.lines[r]), ctx.colCount, r === ctx.sepIndex ? '---' : '');
            var tmp = cells[fromCol];
            cells[fromCol] = cells[toCol];
            cells[toCol] = tmp;
            ctx.lines[r] = joinPipeRow(cells);
        }
        return rebuildLinesWithCursor(ctx.lines, ctx.lineIndex, toCol);
    }

    function repeatChar(ch, count) {
        var out = '';
        var i;
        for (i = 0; i < count; i++) out += ch;
        return out;
    }

    function formatTableAtOffset(text, offset) {
        var ctx = getTableBlockContextAtOffset(text, offset);
        if (!ctx) return { text: text, cursor: offset, selEnd: offset };
        var matrix = [];
        var widths = [];
        var aligns = [];
        var c;
        for (c = 0; c < ctx.colCount; c++) {
            widths.push(3);
            aligns.push('default');
        }
        var r;
        for (r = ctx.headerIndex; r <= ctx.lastIndex; r++) {
            var rowCells = padRowCellsToCount(splitPipeRowSmart(ctx.lines[r]), ctx.colCount, r === ctx.sepIndex ? '---' : '');
            matrix.push(rowCells);
            if (r === ctx.sepIndex) {
                for (c = 0; c < ctx.colCount; c++) {
                    var al = typeof MarkdownTableUtils !== 'undefined' && MarkdownTableUtils.parseColumnAlign
                        ? MarkdownTableUtils.parseColumnAlign(rowCells[c])
                        : 'default';
                    aligns[c] = al;
                    var minW = al === 'center' ? 5 : ((al === 'left' || al === 'right') ? 4 : 3);
                    if (minW > widths[c]) widths[c] = minW;
                }
            } else {
                for (c = 0; c < ctx.colCount; c++) {
                    if (rowCells[c].length > widths[c]) widths[c] = rowCells[c].length;
                }
            }
        }
        for (r = 0; r < matrix.length; r++) {
            var docRowIdx = ctx.headerIndex + r;
            var cells = matrix[r];
            var formatted = [];
            for (c = 0; c < ctx.colCount; c++) {
                var w = widths[c];
                if (docRowIdx === ctx.sepIndex) {
                    var align = aligns[c];
                    if (align === 'center') formatted.push(':' + repeatChar('-', Math.max(3, w - 2)) + ':');
                    else if (align === 'left') formatted.push(':' + repeatChar('-', Math.max(3, w - 1)));
                    else if (align === 'right') formatted.push(repeatChar('-', Math.max(3, w - 1)) + ':');
                    else formatted.push(repeatChar('-', w));
                } else {
                    var val = cells[c];
                    formatted.push(val + repeatChar(' ', Math.max(0, w - val.length)));
                }
            }
            ctx.lines[docRowIdx] = joinPipeRow(formatted);
        }
        return rebuildLinesWithCursor(ctx.lines, ctx.lineIndex, ctx.cellIndex);
    }

    // =========================================================================
    // Bidirectional Markdown <-> Block Codec
    // =========================================================================

    var _blockIdCounter = 0;
    function nextBlockId() {
        _blockIdCounter += 1;
        return 'blk_' + _blockIdCounter;
    }

    function trimStr(v) {
        return String(v == null ? '' : v).replace(/^\s+|\s+$/g, '');
    }

    function normalizeLines(v) {
        return String(v == null ? '' : v).replace(/\\n/g, '\n').replace(/\r\n?/g, '\n');
    }

    function oneLineStr(v) {
        return String(v == null ? '' : v).replace(/\r\n?/g, '\n').replace(/\n/g, ' ');
    }

    function compactColorForPipe(spec) {
        var valid = validateColorSpecFallback(spec);
        if (!valid) return '';
        if (/^(?:rgb|hsl)/i.test(valid)) {
            return valid.replace(/\s+/g, '');
        }
        return valid;
    }

    function safeUrlForMd(raw) {
        var v = trimStr(raw);
        if (!v) return '';
        return v.replace(/[\s()<>]/g, function (c) {
            return encodeURIComponent(c);
        });
    }

    function looksLikeFormulaExpr(inner) {
        var s = trimStr(inner);
        if (!s) return false;
        if (typeof FormulaEngine !== 'undefined' && typeof FormulaEngine.looksLikeFormula === 'function') {
            return FormulaEngine.looksLikeFormula(s);
        }
        return /[()+\-*\/><=!]|\b(?:if|round|abs|min|max|contains|containsanycase|countdown)\s*\(/i.test(s);
    }

    function scanDoubleBraces(src) {
        if (typeof FormulaEngine !== 'undefined' && typeof FormulaEngine.scanDoubleBraceTokens === 'function') {
            return FormulaEngine.scanDoubleBraceTokens(src);
        }
        var s = String(src == null ? '' : src);
        var out = [];
        var i = 0;
        while (i < s.length) {
            var open = s.indexOf('{{', i);
            if (open < 0) break;
            var depth = 1;
            var j = open + 2;
            while (j < s.length && depth > 0) {
                if (s.charAt(j) === '{' && s.charAt(j + 1) === '{') {
                    depth += 1;
                    j += 2;
                } else if (s.charAt(j) === '}' && s.charAt(j + 1) === '}') {
                    depth -= 1;
                    j += 2;
                } else {
                    j += 1;
                }
            }
            if (depth === 0) {
                out.push({ start: open, end: j, inner: s.slice(open + 2, j - 2) });
                i = j;
            } else {
                break;
            }
        }
        return out;
    }

    function formatPositiveSpeed(raw) {
        var s = trimStr(raw);
        if (!s) return '';
        if (/^(?:\d+\.?\d*|\.\d+)$/.test(s) && Number(s) > 0) return s;
        return '';
    }

    function decorateInlineString(raw, opts) {
        var line = String(raw == null ? '' : raw);
        if (!line) return '';
        var o = opts || {};
        if (o.bold) line = '**' + line + '**';
        if (o.italic) line = '*' + line + '*';
        if (o.strike) line = '<s>' + line + '</s>';
        var col = validateColorSpecFallback(o.color);
        if (col) line = '[color ' + col + ']' + line + '[/color]';
        if (o.blink) {
            var spd = formatPositiveSpeed(o.blinkSpeed);
            line = '[blink' + (spd && spd !== '1' ? ' ' + spd : '') + ']' + line + '[/blink]';
        }
        return line;
    }

    /** Unwrap whole-string decorators ([blink], [color], <s>, **, *) only when each covers the entire string. */
    function unwrapWholeStringDecorators(raw) {
        var s = trimStr(raw);
        var res = {
            text: s,
            color: '',
            bold: false,
            italic: false,
            strike: false,
            blink: false,
            blinkSpeed: ''
        };
        if (!s) return res;

        // 1. Outer [blink ...]...[/blink]
        var blinkOpen = /^\[blink(?:\s+([0-9]+(?:\.[0-9]+)?))?\]/i.exec(s);
        if (blinkOpen && s.slice(-8).toLowerCase() === '[/blink]') {
            var depth = 1;
            var pos = blinkOpen[0].length;
            var matchedFull = false;
            var reTag = /\[blink(?:\s+[^\]]*)?\]|\[\/blink\]/gi;
            reTag.lastIndex = pos;
            var m;
            while ((m = reTag.exec(s)) !== null) {
                if (m[0].toLowerCase() === '[/blink]') {
                    depth -= 1;
                    if (depth === 0) {
                        matchedFull = (m.index + 8 === s.length);
                        break;
                    }
                } else {
                    depth += 1;
                }
            }
            if (matchedFull) {
                res.blink = true;
                res.blinkSpeed = blinkOpen[1] ? blinkOpen[1] : '';
                s = s.slice(blinkOpen[0].length, s.length - 8);
            }
        }

        // 2. Outer [color spec]...[/color]
        var colOpen = /^\[color\s+([^\]]+)\]/i.exec(s);
        if (colOpen && s.slice(-8).toLowerCase() === '[/color]') {
            var closeIdx = s.toLowerCase().indexOf('[/color]', colOpen[0].length);
            if (closeIdx === s.length - 8) {
                var validCol = validateColorSpecFallback(colOpen[1]);
                if (validCol) {
                    res.color = validCol;
                    s = s.slice(colOpen[0].length, closeIdx);
                }
            }
        }

        // 3. Outer <s>...</s>
        if (s.length >= 7 && s.slice(0, 3).toLowerCase() === '<s>' && s.slice(-4).toLowerCase() === '</s>') {
            var sClose = s.toLowerCase().indexOf('</s>', 3);
            if (sClose === s.length - 4) {
                res.strike = true;
                s = s.slice(3, sClose);
            }
        }

        // 4. Outer **...** / ***...*** / *...*
        if (s.length >= 6 && s.slice(0, 3) === '***' && s.slice(-3) === '***') {
            var inner3 = s.slice(3, -3);
            if (inner3.indexOf('***') < 0 && inner3.indexOf('\n') < 0) {
                res.bold = true;
                res.italic = true;
                s = inner3;
            }
        } else {
            if (s.length >= 4 && s.slice(0, 2) === '**' && s.slice(-2) === '**') {
                var inner2 = s.slice(2, -2);
                if (inner2.indexOf('**') < 0 && inner2.indexOf('\n') < 0) {
                    res.bold = true;
                    s = inner2;
                }
            }
            if (s.length >= 2 && s.charAt(0) === '*' && s.charAt(s.length - 1) === '*' && s.slice(0, 2) !== '**') {
                var inner1 = s.slice(1, -1);
                if (inner1.indexOf('*') < 0 && inner1.indexOf('\n') < 0) {
                    res.italic = true;
                    s = inner1;
                }
            }
        }

        res.text = s;
        return res;
    }

    function normalizeIconSlug(raw) {
        var s = trimStr(raw).toLowerCase();
        if (!s) return '';
        if (s.indexOf('ph-') === 0) s = s.slice(3);
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return '';
        return s;
    }

    function iconObjToMd(b) {
        var slug = normalizeIconSlug(b.iconName !== undefined ? b.iconName : b.name);
        if (!slug) return '';
        var w = trimStr(b.iconWeight !== undefined ? b.iconWeight : b.weight).toLowerCase();
        var szRaw = trimStr(b.iconSize !== undefined ? b.iconSize : b.size);
        var sz = /^[1-9]\d{0,3}$/.test(szRaw) ? szRaw : '';
        var tintRaw = b.iconTint !== undefined ? b.iconTint : b.tint;
        var secRaw = b.iconSecondary !== undefined ? b.iconSecondary : b.secondary;
        var pri = compactColorForPipe(tintRaw);
        var sec = (w === 'duotone' && pri) ? compactColorForPipe(secRaw) : '';
        var head;
        if (w === 'regular') {
            head = 'ph(ph ph-' + slug;
            var pipes = [];
            if (sz) pipes.push(sz);
            if (pri) pipes.push(pri);
            return ':' + head + (pipes.length ? '|' + pipes.join('|') : '') + '):';
        }
        if (w === 'thin' || w === 'light' || w === 'bold' || w === 'fill' || w === 'duotone') {
            head = 'ph-' + w + ' ph-' + slug;
        } else {
            head = 'ph-' + slug;
        }
        var parts = [head];
        if (sz) parts.push(sz);
        if (pri) parts.push(pri);
        if (sec) parts.push(sec);
        return ':' + parts.join('|') + ':';
    }

    function parseMediaSizeToken(token) {
        var s = trimStr(token).toLowerCase();
        if (!s) return null;
        if (s.slice(-2) === 'px') s = trimStr(s.slice(0, -2));
        var m = /^x([1-9]\d{0,3})$/.exec(s);
        if (m) return { w: '', h: m[1] };
        m = /^([1-9]\d{0,3})x([1-9]\d{0,3})$/.exec(s);
        if (m) return { w: m[1], h: m[2] };
        m = /^([1-9]\d{0,3})$/.exec(s);
        if (m) return { w: m[1], h: '' };
        return null;
    }

    function splitMediaPipeTokens(raw, maxTints) {
        var s = String(raw == null ? '' : raw);
        var w = '';
        var h = '';
        var tints = [];
        var limit = maxTints != null ? maxTints : 1;
        while (true) {
            var idx = s.lastIndexOf('|');
            if (idx < 0) break;
            var tok = trimStr(s.slice(idx + 1));
            if (!tok) break;
            var sz = parseMediaSizeToken(tok);
            var col = validateColorSpecFallback(tok);
            if (sz && !w && !h) {
                w = sz.w;
                h = sz.h;
                s = s.slice(0, idx);
                continue;
            }
            if (col && tints.length < limit) {
                tints.push(col);
                s = s.slice(0, idx);
                continue;
            }
            break;
        }
        var ordered = tints.length === 2 ? [tints[1], tints[0]] : tints;
        return {
            label: s,
            width: w,
            height: h,
            primaryTint: ordered[0] || '',
            secondaryTint: ordered[1] || ''
        };
    }

    function parseIconTokenStr(raw) {
        var s = trimStr(raw);
        if (!s || s.charAt(0) !== ':' || s.charAt(s.length - 1) !== ':') return null;
        var inner = s.slice(1, -1);
        var weight = 'default';
        var slug = '';
        var pipePart = '';
        var bracketMatch = /^ph\(([^)]+)\)$/i.exec(inner);
        if (bracketMatch) {
            var bSplit = splitMediaPipeTokens(bracketMatch[1], 2);
            var bTokens = trimStr(bSplit.label).split(/\s+/);
            var bGlyph = '';
            var bWeight = 'default';
            var ti;
            for (ti = 0; ti < bTokens.length; ti++) {
                var bt = bTokens[ti];
                if (bt === 'ph') bWeight = 'regular';
                else if (bt === 'ph-thin') bWeight = 'thin';
                else if (bt === 'ph-light') bWeight = 'light';
                else if (bt === 'ph-bold') bWeight = 'bold';
                else if (bt === 'ph-fill') bWeight = 'fill';
                else if (bt === 'ph-duotone') bWeight = 'duotone';
                else if (/^ph-[a-z0-9-]+$/i.test(bt)) {
                    if (bGlyph) return null;
                    bGlyph = bt;
                } else {
                    return null;
                }
            }
            if (!bGlyph) return null;
            return {
                name: bGlyph,
                weight: bWeight,
                size: bSplit.width || bSplit.height || '',
                tint: bSplit.primaryTint || '',
                secondary: bSplit.secondaryTint || ''
            };
        }

        var wMatch = /^ph-(thin|light|bold|fill|duotone)\s+(ph-[a-z0-9-]+)((?:\|[^:\s]+)*)$/i.exec(inner);
        if (wMatch) {
            weight = wMatch[1].toLowerCase();
            slug = wMatch[2].toLowerCase();
            pipePart = wMatch[3] || '';
        } else {
            var sMatch = /^ph-([a-z0-9-]+)((?:\|[^:\s]+)*)$/i.exec(inner);
            if (!sMatch) return null;
            slug = 'ph-' + sMatch[1].toLowerCase();
            pipePart = sMatch[2] || '';
        }
        var pSplit = splitMediaPipeTokens(slug + pipePart, 2);
        return {
            name: slug,
            weight: weight,
            size: pSplit.width || pSplit.height || '',
            tint: pSplit.primaryTint || '',
            secondary: pSplit.secondaryTint || ''
        };
    }

    function imageObjToMd(b) {
        var url = safeUrlForMd(b.imageUrl !== undefined ? b.imageUrl : b.url);
        if (!url) return '';
        var altRaw = b.imageAlt !== undefined ? b.imageAlt : b.alt;
        var alt = oneLineStr(altRaw).replace(/[\[\]|]/g, '').replace(/</g, '&lt;');
        var wRaw = trimStr(b.imageWidth !== undefined ? b.imageWidth : b.width);
        var hRaw = trimStr(b.imageHeight !== undefined ? b.imageHeight : b.height);
        var w = /^[1-9]\d{0,3}$/.test(wRaw) ? wRaw : '';
        var h = /^[1-9]\d{0,3}$/.test(hRaw) ? hRaw : '';
        var dims = h ? ((w || '') + 'x' + h) : w;
        var tint = validateColorSpecFallback(b.imageTint !== undefined ? b.imageTint : b.tint) || '';
        var segs = [alt];
        if (dims) segs.push(dims);
        if (tint) segs.push(tint);
        var imgMd = '![' + segs.join('|') + '](' + url + ')';
        if (b.linkUrl && trimStr(b.linkUrl)) {
            var lUrl = safeUrlForMd(b.linkUrl);
            if (lUrl) {
                return '[' + imgMd + '](' + lUrl + (b.linkNewTab ? ' ^' : '') + ')';
            }
        }
        return imgMd;
    }

    function parseImageTokenStr(raw) {
        var s = trimStr(raw);
        var linkUrl = '';
        var linkNewTab = false;
        var linkedMatch = /^\[(!\[[^\]]*\]\([^)\n]+\))\]\(([^)\n]+)\)$/.exec(s);
        if (linkedMatch) {
            s = linkedMatch[1];
            var rawLinkDest = trimStr(linkedMatch[2]);
            if (/\s*\^$/.test(rawLinkDest)) {
                linkNewTab = true;
                linkUrl = trimStr(rawLinkDest.replace(/\s*\^$/, ''));
            } else {
                linkUrl = rawLinkDest;
            }
        }
        var m = /^!\[((?:\\.|[^\]\n\\])*)\]\(([^)\n]+)\)$/.exec(s);
        if (!m) return null;
        var split = splitMediaPipeTokens(m[1], 1);
        return {
            alt: split.label,
            url: trimStr(m[2]),
            width: split.width,
            height: split.height,
            tint: split.primaryTint,
            linkUrl: linkUrl,
            linkNewTab: linkNewTab
        };
    }

    function createDefaultChildBlock(type, valOpt) {
        var id = nextBlockId();
        switch (type) {
            case 'heading':
                return {
                    id: id, type: 'heading', level: '2',
                    text: valOpt != null ? String(valOpt) : 'Heading',
                    color: '', bold: false, italic: false, strike: false, blink: false, blinkSpeed: '',
                    newLine: true
                };
            case 'icon':
                return {
                    id: id, type: 'icon',
                    name: valOpt ? normalizeIconSlug(valOpt) ? ('ph-' + normalizeIconSlug(valOpt)) : 'ph-house' : 'ph-house',
                    weight: 'default', size: '', tint: '', secondary: '', label: '',
                    blink: false, blinkSpeed: '', newLine: false
                };
            case 'image':
                return {
                    id: id, type: 'image',
                    url: valOpt != null ? String(valOpt) : '',
                    alt: 'Image', width: '', height: '', tint: '',
                    linkUrl: '', linkNewTab: false, newLine: false
                };
            case 'topic':
                return {
                    id: id, type: 'topic', mode: 'topic',
                    path: valOpt != null ? String(valOpt) : 'homey/temp',
                    formula: 'if({{homey/temp}} > 20, "Hot", "Cold")',
                    prefix: '', suffix: '',
                    color: '', bold: false, italic: false, strike: false, blink: false, blinkSpeed: '',
                    newLine: false
                };
            case 'link':
                return {
                    id: id, type: 'link', linkType: 'url',
                    label: valOpt != null ? String(valOpt) : 'Open Link',
                    url: 'https://', helpTopic: 'Widgets/text', newTab: true,
                    icon: '', color: '', bold: false, newLine: false
                };
            case 'callout':
                return {
                    id: id, type: 'callout', variant: '1', customColor: '@accent',
                    children: [createDefaultChildBlock('text', valOpt != null ? String(valOpt) : 'Note')],
                    blink: false, blinkSpeed: '', newLine: false
                };
            case 'code':
                return {
                    id: id, type: 'code',
                    code: valOpt != null ? String(valOpt) : 'value',
                    newLine: false
                };
            case 'text':
            default:
                return {
                    id: id, type: 'text',
                    text: valOpt != null ? String(valOpt) : 'Text',
                    color: '', bold: false, italic: false, strike: false, blink: false, blinkSpeed: '',
                    newLine: false
                };
        }
    }

    function createDefaultCell(text) {
        var raw = text == null ? '' : String(text);
        var children = raw ? [createDefaultChildBlock('text', raw)] : [];
        return {
            background: '',
            children: children
        };
    }

    function escapePipesOutsideTokens(raw) {
        var s = String(raw == null ? '' : raw);
        var re = /!\[[^\]\n]*\]\([^\n)]*\)|:ph(?:\([^\n)]*\)|-[a-z0-9-]+(?:\s+ph-[a-z0-9-]+)?(?:\|[^:\n]+)*):|\{\{[\s\S]*?\}\}/gi;
        var result = '';
        var from = 0;
        var escFn = function (chunk) {
            return chunk.replace(/(\\*)\|/g, function (_, slashes) {
                return slashes + (slashes.length % 2 ? '|' : '\\|');
            });
        };
        var m;
        while ((m = re.exec(s)) !== null) {
            result += escFn(s.slice(from, m.index)) + m[0];
            from = m.index + m[0].length;
        }
        return result + escFn(s.slice(from));
    }

    function unescapePipesOutsideTokens(raw) {
        var s = String(raw == null ? '' : raw);
        return s.replace(/\\\|/g, '|');
    }

    function stripLiteralCloseBracketsInCallout(str) {
        return String(str == null ? '' : str).replace(/\]/g, '&#93;');
    }

    function childBlockToInlineMarkdown(ch, opts) {
        if (!ch || !ch.type) return '';
        var o = opts || {};
        var inCell = !!o.inTableCell;
        var inCallout = !!o.inCallout;
        var body = '';

        switch (ch.type) {
            case 'heading': {
                var lvl = parseInt(String(ch.level || '2'), 10);
                if (!(lvl >= 1 && lvl <= 3)) lvl = 2;
                var hText = oneLineStr(ch.text);
                if (!trimStr(hText)) return '';
                if (inCell) hText = escapePipesOutsideTokens(hText);
                var decH = decorateInlineString(hText, {
                    color: ch.color,
                    bold: ch.bold,
                    italic: ch.italic,
                    strike: ch.strike,
                    blink: ch.blink,
                    blinkSpeed: ch.blinkSpeed
                });
                if (inCallout) return decorateInlineString(hText, { bold: true, color: ch.color, italic: ch.italic, strike: ch.strike, blink: ch.blink, blinkSpeed: ch.blinkSpeed });
                return repeatChar('#', lvl) + ' ' + decH;
            }
            case 'icon': {
                body = iconObjToMd(ch);
                if (!body) return '';
                if (ch.label) {
                    var lbl = oneLineStr(ch.label);
                    if (inCell) lbl = escapePipesOutsideTokens(lbl);
                    body = body + ' ' + lbl;
                }
                if (ch.bold || ch.italic || ch.blink) {
                    body = decorateInlineString(body, {
                        bold: ch.bold,
                        italic: ch.italic,
                        blink: ch.blink,
                        blinkSpeed: ch.blinkSpeed
                    });
                }
                return body;
            }
            case 'image': {
                var imgCopy = {
                    imageUrl: ch.url !== undefined ? ch.url : ch.imageUrl,
                    imageAlt: ch.alt !== undefined ? ch.alt : ch.imageAlt,
                    imageWidth: ch.width !== undefined ? ch.width : ch.imageWidth,
                    imageHeight: ch.height !== undefined ? ch.height : ch.imageHeight,
                    imageTint: ch.tint !== undefined ? ch.tint : ch.imageTint,
                    linkUrl: ch.linkUrl,
                    linkNewTab: ch.linkNewTab
                };
                // Images inside [blockN:...] require a size or tint token so TextWidget preprocesses them to <img> before [blockN:] regex runs.
                if (inCallout && !imgCopy.imageWidth && !imgCopy.imageHeight && !imgCopy.imageTint) {
                    imgCopy.imageWidth = '48';
                }
                return imageObjToMd(imgCopy);
            }
            case 'topic': {
                var expr = ch.mode === 'formula'
                    ? trimStr(ch.formula)
                    : trimStr(ch.path).replace(/^\{\{|\}\}$/g, '');
                if (!expr) return '';
                var fullTok = (ch.prefix || '') + '{{' + expr + '}}' + (ch.suffix || '');
                var one = oneLineStr(fullTok);
                if (inCell) one = escapePipesOutsideTokens(one);
                return decorateInlineString(one, {
                    color: ch.color,
                    bold: ch.bold,
                    italic: ch.italic,
                    strike: ch.strike,
                    blink: ch.blink,
                    blinkSpeed: ch.blinkSpeed
                });
            }
            case 'link': {
                var lText = oneLineStr(ch.label || 'Open Link').replace(/[\[\]]/g, '');
                var dest = ch.linkType === 'help'
                    ? ('help://' + trimStr(ch.helpTopic || 'Widgets/text').replace(/^help:\/\//i, ''))
                    : safeUrlForMd(ch.url || 'https://');
                if (!dest) return '';
                var needNewTab = ch.linkType !== 'help' && (ch.newTab || inCallout);
                var linkMd = '[' + lText + '](' + dest + (needNewTab ? ' ^' : '') + ')';
                if (ch.icon) {
                    var lIco = normalizeIconSlug(ch.icon);
                    if (lIco) linkMd = ':ph-' + lIco + ': ' + linkMd;
                }
                if (inCell) linkMd = escapePipesOutsideTokens(linkMd);
                return decorateInlineString(linkMd, {
                    color: ch.color,
                    bold: ch.bold,
                    italic: ch.italic,
                    strike: ch.strike,
                    blink: ch.blink,
                    blinkSpeed: ch.blinkSpeed
                });
            }
            case 'callout': {
                var innerCallout = serializeInlineChildrenToMarkdown(ch.children || [], { inCallout: true, inTableCell: inCell });
                if (inCell && innerCallout.indexOf('\n') >= 0) {
                    innerCallout = innerCallout.replace(/\r?\n/g, '<br>');
                }
                var callHead;
                if (ch.variant === 'custom') {
                    var cc = validateColorSpecFallback(ch.customColor) || '@accent';
                    callHead = '[block ' + cc + ':' + innerCallout + ']';
                } else {
                    var vNum = /^[1-4]$/.test(String(ch.variant)) ? String(ch.variant) : '1';
                    callHead = '[block' + vNum + ':' + innerCallout + ']';
                }
                if (ch.blink && ch.variant !== 'custom') {
                    var cSpd = formatPositiveSpeed(ch.blinkSpeed);
                    callHead = '[blink' + (cSpd && cSpd !== '1' ? ' ' + cSpd : '') + ']' + callHead + '[/blink]';
                }
                return inCell ? escapePipesOutsideTokens(callHead) : callHead;
            }
            case 'code': {
                var cStr = oneLineStr(ch.code || '').replace(/`/g, '\'');
                if (!cStr) return '';
                var cMd = '`' + cStr + '`';
                return inCell ? escapePipesOutsideTokens(cMd) : cMd;
            }
            case 'text':
            default: {
                var rawT = String(ch.text == null ? '' : ch.text).replace(/\r\n?/g, '\n');
                if (!rawT) return '';
                if (inCell) {
                    var tLines = rawT.split('\n');
                    var hasStyle = !!(ch.color || ch.bold || ch.italic || ch.strike || ch.blink);
                    var outL = [];
                    var ti;
                    for (ti = 0; ti < tLines.length; ti++) {
                        var chunk = escapePipesOutsideTokens(tLines[ti]);
                        if (hasStyle && chunk && !/^\s*#{1,3}\s+/.test(chunk)) {
                            chunk = decorateInlineString(chunk, {
                                color: ch.color,
                                bold: ch.bold,
                                italic: ch.italic,
                                strike: ch.strike,
                                blink: ch.blink,
                                blinkSpeed: ch.blinkSpeed
                            });
                        }
                        outL.push(chunk);
                    }
                    var joinedCellText = outL.join('<br>');
                    return inCallout ? stripLiteralCloseBracketsInCallout(joinedCellText) : joinedCellText;
                }
                var styled = decorateInlineString(rawT, {
                    color: ch.color,
                    bold: ch.bold,
                    italic: ch.italic,
                    strike: ch.strike,
                    blink: ch.blink,
                    blinkSpeed: ch.blinkSpeed
                });
                return inCallout ? stripLiteralCloseBracketsInCallout(styled) : styled;
            }
        }
    }

    function serializeInlineChildrenToMarkdown(children, opts) {
        if (!Array.isArray(children) || !children.length) return '';
        var o = opts || {};
        var lineSep = o.inTableCell ? '<br>' : '\n';
        var out = '';
        var hasContent = false;
        var i;
        for (i = 0; i < children.length; i++) {
            var ch = children[i];
            var seg = childBlockToInlineMarkdown(ch, o);
            if (!seg) continue;
            if (!hasContent) {
                out = seg;
                hasContent = true;
            } else if (ch.newLine || ch.type === 'heading') {
                out += lineSep + seg;
            } else {
                out += ' ' + seg;
            }
        }
        return out;
    }

    function findMatchingCloseTagEnd(str, startAfterOpen, openReSrc, closeLiteral) {
        var re = new RegExp(openReSrc + '|' + closeLiteral.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        re.lastIndex = startAfterOpen;
        var depth = 1;
        var m;
        while ((m = re.exec(str)) !== null) {
            if (m[0].toLowerCase() === closeLiteral.toLowerCase()) {
                depth -= 1;
                if (depth === 0) return m.index + m[0].length;
            } else {
                depth += 1;
            }
        }
        return -1;
    }

    function findCalloutCloseBracket(str, openPos) {
        var depth = 0;
        var i;
        for (i = openPos; i < str.length; i++) {
            var ch = str.charAt(i);
            if (ch === '[') depth += 1;
            else if (ch === ']') {
                depth -= 1;
                if (depth === 0) return i;
            }
        }
        return str.indexOf(']', openPos + 6);
    }

    function splitCellLinesOutsideBlocks(s) {
        if (s.toLowerCase().indexOf('[block') < 0) {
            return s.split(/<br\s*\/?>/i);
        }
        var lines = [];
        var last = 0;
        var i = 0;
        while (i < s.length) {
            if (s.charAt(i) === '[' && /^\[block\s*(?:[1-4]|#|@|rgba?\(|hsla?\()/i.test(s.slice(i))) {
                var closeIdx = findCalloutCloseBracket(s, i);
                if (closeIdx > i) {
                    i = closeIdx + 1;
                    continue;
                }
            }
            if (s.charAt(i) === '<') {
                var brM = /^<br\s*\/?>/i.exec(s.slice(i));
                if (brM) {
                    lines.push(s.slice(last, i));
                    i += brM[0].length;
                    last = i;
                    continue;
                }
            }
            i += 1;
        }
        lines.push(s.slice(last));
        return lines;
    }

    function matchInlineSpecialTokenAt(str, pos, opts) {
        var sub = str.slice(pos);
        var o = opts || {};

        // 1. Callout [block...] (optionally wrapped in [blink...]) inside table cells
        if (!o.inCallout) {
            var blkPrefixBlink = /^\[blink(?:\s+[0-9]+(?:\.[0-9]+)?)?\]\s*\[block\s*(?:[1-4]|#|@|rgba?\(|hsla?\()/i.exec(sub);
            if (blkPrefixBlink) {
                var endB = findMatchingCloseTagEnd(str, pos + 6, '\\[blink(?:\\s+[^\\]]*)?\\]', '[/blink]');
                if (endB > pos) {
                    var rawCB = str.slice(pos, endB);
                    if (o.inTableCell) {
                        rawCB = unescapePipesOutsideTokens(rawCB).replace(/<br\s*\/?>/gi, '\n');
                    }
                    var parsedCB = parseCalloutFromText(rawCB);
                    if (parsedCB) return { len: endB - pos, child: parsedCB };
                }
            }
            var blkOpen = /^\[block\s*(?:[1-4]|#[0-9a-fA-F]{3,8}|@[a-zA-Z][a-zA-Z0-9_-]*|rgba?\([^)]*\)|hsla?\([^)]*\))\s*:/i.exec(sub);
            if (blkOpen) {
                var endIdx = findCalloutCloseBracket(sub, 0);
                if (endIdx > 0) {
                    var rawC = sub.slice(0, endIdx + 1);
                    var callSrc = o.inTableCell
                        ? unescapePipesOutsideTokens(rawC).replace(/<br\s*\/?>/gi, '\n')
                        : rawC;
                    var parsedC = parseCalloutFromText(callSrc);
                    if (parsedC) return { len: endIdx + 1, child: parsedC };
                }
            }
        }

        // 2. Whole decorated token wrapper ([blink...], [color...], <s>, ***, **, *) around single icon / topic / styled text
        var decOpen = /^(?:\[blink(?:\s+([0-9]+(?:\.[0-9]+)?))?\]|\[color\s+([^\]]+)\])/i.exec(sub);
        var styleOpen = !decOpen ? /^(<s>|\*\*\*|\*\*|\*)(?=\S)/i.exec(sub) : null;
        var endWrap = -1;
        if (decOpen) {
            var closeTag = decOpen[1] !== undefined || /^\[blink/i.test(decOpen[0]) ? '[/blink]' : '[/color]';
            var openSrc = closeTag === '[/blink]' ? '\\[blink(?:\\s+[^\\]]*)?\\]' : '\\[color\\s+[^\\]]+\\]';
            endWrap = findMatchingCloseTagEnd(str, pos + decOpen[0].length, openSrc, closeTag);
        } else if (styleOpen) {
            var sCloseTag = styleOpen[1].toLowerCase() === '<s>' ? '</s>' : styleOpen[1];
            var closeIdx = str.indexOf(sCloseTag, pos + styleOpen[1].length);
            if (closeIdx > pos && str.slice(pos, closeIdx).indexOf('\n') < 0) {
                endWrap = closeIdx + sCloseTag.length;
            }
        }
        if (endWrap > pos) {
            var fullWrap = str.slice(pos, endWrap);
            var wDec = unwrapWholeStringDecorators(fullWrap);
            var wIcon = parseIconTokenStr(wDec.text);
            if (wIcon && !wDec.color && !wDec.strike) {
                return {
                    len: endWrap - pos,
                    child: {
                        id: nextBlockId(), type: 'icon',
                        name: wIcon.name, weight: wIcon.weight, size: wIcon.size,
                        tint: wIcon.tint, secondary: wIcon.secondary, label: '',
                        blink: wDec.blink, blinkSpeed: wDec.blinkSpeed, newLine: false
                    }
                };
            }
            var wBraces = scanDoubleBraces(wDec.text);
            if (wBraces.length === 1 && wBraces[0].start === 0 && wBraces[0].end === wDec.text.length) {
                var wInner = trimStr(wBraces[0].inner);
                var wIsF = looksLikeFormulaExpr(wInner);
                return {
                    len: endWrap - pos,
                    child: {
                        id: nextBlockId(), type: 'topic',
                        mode: wIsF ? 'formula' : 'topic',
                        path: wIsF ? 'homey/temp' : wInner,
                        formula: wIsF ? wInner : 'if({{homey/temp}} > 20, "Hot", "Cold")',
                        prefix: '', suffix: '',
                        color: wDec.color, bold: wDec.bold, italic: wDec.italic, strike: wDec.strike,
                        blink: wDec.blink, blinkSpeed: wDec.blinkSpeed, newLine: false
                    }
                };
            }
            // Styled plain text span (with optional outer decorators, if it contains no special sub-tokens)
            if (decOpen && !/!\[|:ph|\{\{|`|\[[^\]]+\]\(/.test(wDec.text)) {
                return {
                    len: endWrap - pos,
                    child: {
                        id: nextBlockId(), type: 'text',
                        text: o.inTableCell ? unescapePipesOutsideTokens(wDec.text) : wDec.text,
                        color: wDec.color, bold: wDec.bold, italic: wDec.italic, strike: wDec.strike,
                        blink: wDec.blink, blinkSpeed: wDec.blinkSpeed, newLine: false
                    }
                };
            }
        }

        // 3. Linked or standalone Image
        var linkedImgM = /^\[!\[((?:\\.|[^\]\n\\])*)\]\(([^)\n]+)\)\]\(([^)\n]+)\)/.exec(sub);
        if (linkedImgM) {
            var pImgL = parseImageTokenStr(linkedImgM[0]);
            if (pImgL) {
                return {
                    len: linkedImgM[0].length,
                    child: {
                        id: nextBlockId(), type: 'image',
                        url: pImgL.url, alt: pImgL.alt, width: pImgL.width,
                        height: pImgL.height, tint: pImgL.tint,
                        linkUrl: pImgL.linkUrl, linkNewTab: pImgL.linkNewTab, newLine: false
                    }
                };
            }
        }
        var imgM = /^!\[((?:\\.|[^\]\n\\])*)\]\(([^)\n]+)\)/.exec(sub);
        if (imgM) {
            var pImg = parseImageTokenStr(imgM[0]);
            if (pImg) {
                return {
                    len: imgM[0].length,
                    child: {
                        id: nextBlockId(), type: 'image',
                        url: pImg.url, alt: pImg.alt, width: pImg.width,
                        height: pImg.height, tint: pImg.tint,
                        linkUrl: '', linkNewTab: false, newLine: false
                    }
                };
            }
        }

        // 4. Phosphor Icon (:ph(...): / :ph-weight ph-slug: / :ph-slug:)
        var iconM = /^:ph\([^)\n]+\):|^:ph-(?:thin|light|bold|fill|duotone)\s+ph-[a-z0-9-]+(?:\|[^:\n\s]+)*:|^:ph-[a-z0-9-]+(?:\|[^:\n\s]+)*:/i.exec(sub);
        if (iconM) {
            var pIcon = parseIconTokenStr(iconM[0]);
            if (pIcon) {
                return {
                    len: iconM[0].length,
                    child: {
                        id: nextBlockId(), type: 'icon',
                        name: pIcon.name, weight: pIcon.weight, size: pIcon.size,
                        tint: pIcon.tint, secondary: pIcon.secondary, label: '',
                        blink: false, blinkSpeed: '', newLine: false
                    }
                };
            }
        }

        // 5. Double-brace {{topic}} / {{= formula}}
        if (sub.slice(0, 2) === '{{') {
            var braces = scanDoubleBraces(sub);
            if (braces.length && braces[0].start === 0) {
                var tInner = trimStr(braces[0].inner);
                var tIsF = looksLikeFormulaExpr(tInner);
                return {
                    len: braces[0].end,
                    child: {
                        id: nextBlockId(), type: 'topic',
                        mode: tIsF ? 'formula' : 'topic',
                        path: tIsF ? 'homey/temp' : tInner,
                        formula: tIsF ? tInner : 'if({{homey/temp}} > 20, "Hot", "Cold")',
                        prefix: '', suffix: '',
                        color: '', bold: false, italic: false, strike: false, blink: false, blinkSpeed: '',
                        newLine: false
                    }
                };
            }
        }

        // 6. Markdown Link [label](url)
        var linkM = /^\[([^\]\n]+)\]\(([^)\n]+)\)/.exec(sub);
        if (linkM && !/^\[(?:block|color|blink|\/color|\/blink|cell)/i.test(linkM[0])) {
            var lDest = trimStr(linkM[2]);
            var lIsHelp = /^help:\/\//i.test(lDest);
            var lNewTab = false;
            if (!lIsHelp && /\s*\^$/.test(lDest)) {
                lNewTab = true;
                lDest = trimStr(lDest.replace(/\s*\^$/, ''));
            }
            return {
                len: linkM[0].length,
                child: {
                    id: nextBlockId(), type: 'link',
                    linkType: lIsHelp ? 'help' : 'url',
                    label: linkM[1],
                    url: lIsHelp ? 'https://' : lDest,
                    helpTopic: lIsHelp ? lDest.replace(/^help:\/\//i, '') : 'Widgets/text',
                    newTab: lNewTab,
                    icon: '', color: '', bold: false, newLine: false
                }
            };
        }

        // 7. Inline code `...`
        var codeM = /^`([^`\n]+)`/.exec(sub);
        if (codeM) {
            return {
                len: codeM[0].length,
                child: {
                    id: nextBlockId(), type: 'code',
                    code: codeM[1], newLine: false
                }
            };
        }

        return null;
    }

    function pushTextChunkChild(out, rawText, isNewLine, opts) {
        var o = opts || {};
        var clean = trimStr(rawText);
        if (!clean) return;
        if (o.inTableCell) clean = unescapePipesOutsideTokens(clean);
        var dec = unwrapWholeStringDecorators(clean);
        out.push({
            id: nextBlockId(),
            type: 'text',
            text: dec.text,
            color: dec.color,
            bold: dec.bold,
            italic: dec.italic,
            strike: dec.strike,
            blink: dec.blink,
            blinkSpeed: dec.blinkSpeed,
            newLine: !!isNewLine
        });
    }

    function parseInlineChildrenFromMarkdown(rawStr, opts) {
        var o = opts || {};
        var s = String(rawStr == null ? '' : rawStr).replace(/\r\n?/g, '\n');
        if (!trimStr(s)) return [];
        var rawLines = o.inTableCell ? splitCellLinesOutsideBlocks(s) : s.split('\n');
        var children = [];
        var li;

        for (li = 0; li < rawLines.length; li++) {
            var lineStr = trimStr(rawLines[li]);
            if (!lineStr) continue;
            var lineFirstChild = true;

            if (o.inTableCell) {
                var hm = /^(#{1,3})\s+(.*)$/.exec(lineStr);
                if (hm) {
                    var hTextRaw = unescapePipesOutsideTokens(hm[2]);
                    var hDec = unwrapWholeStringDecorators(hTextRaw);
                    children.push({
                        id: nextBlockId(),
                        type: 'heading',
                        level: String(hm[1].length),
                        text: hDec.text,
                        color: hDec.color,
                        bold: hDec.bold,
                        italic: hDec.italic,
                        strike: hDec.strike,
                        blink: hDec.blink,
                        blinkSpeed: hDec.blinkSpeed,
                        newLine: li > 0
                    });
                    continue;
                }
            }

            var textStart = 0;
            var pos = 0;
            while (pos < lineStr.length) {
                var hit = matchInlineSpecialTokenAt(lineStr, pos, o);
                if (hit) {
                    if (pos > textStart) {
                        var between = lineStr.slice(textStart, pos);
                        if (trimStr(between)) {
                            pushTextChunkChild(children, between, li > 0 && lineFirstChild, o);
                            lineFirstChild = false;
                        }
                    }
                    hit.child.newLine = (li > 0 && lineFirstChild);
                    children.push(hit.child);
                    lineFirstChild = false;
                    pos += hit.len;
                    textStart = pos;
                } else {
                    pos += 1;
                }
            }
            if (textStart < lineStr.length) {
                var tail = lineStr.slice(textStart);
                if (trimStr(tail)) {
                    pushTextChunkChild(children, tail, li > 0 && lineFirstChild, o);
                }
            }
        }
        return children;
    }

    function cellToMarkdown(c) {
        if (!c) return ' ';
        var bg = validateColorSpecFallback(c.background);
        var bgPrefix = bg ? ('[cell ' + bg + ']') : '';
        var body = '';
        if (Array.isArray(c.children)) {
            body = serializeInlineChildrenToMarkdown(c.children, { inTableCell: true });
        } else if (c.type === 'icon') {
            body = iconObjToMd(c);
            if (body && (c.bold || c.italic || c.blink)) {
                body = decorateInlineString(body, {
                    bold: c.bold,
                    italic: c.italic,
                    blink: c.blink,
                    blinkSpeed: c.blinkSpeed
                });
            }
        } else if (c.type === 'image') {
            body = imageObjToMd(c);
        } else if (c.type === 'topic') {
            var expr = c.topicMode === 'formula' ? trimStr(c.formulaExpr) : trimStr(c.topicPath).replace(/^\{\{|\}\}$/g, '');
            if (expr) {
                var core = (c.topicPrefix || '') + '{{' + expr + '}}' + (c.topicSuffix || '');
                body = decorateInlineString(escapePipesOutsideTokens(oneLineStr(core)), {
                    color: c.color,
                    bold: c.bold,
                    italic: c.italic,
                    strike: c.strike,
                    blink: c.blink,
                    blinkSpeed: c.blinkSpeed
                });
            }
        } else {
            var lines = String(c.text == null ? '' : c.text).replace(/\r\n?/g, '\n').split('\n');
            var hasWholeStyle = !!(c.color || c.bold || c.italic || c.strike || c.blink);
            var outLines = [];
            var li;
            for (li = 0; li < lines.length; li++) {
                var chunk = escapePipesOutsideTokens(lines[li]);
                if (hasWholeStyle && chunk && !/^\s*#{1,3}\s+/.test(chunk)) {
                    chunk = decorateInlineString(chunk, {
                        color: c.color,
                        bold: c.bold,
                        italic: c.italic,
                        strike: c.strike,
                        blink: c.blink,
                        blinkSpeed: c.blinkSpeed
                    });
                }
                outLines.push(chunk);
            }
            body = outLines.join('<br>');
        }
        var combined = bgPrefix + body;
        return combined || ' ';
    }

    function parseCellFromMarkdown(rawCell) {
        var c = createDefaultCell('');
        var s = trimStr(rawCell);
        var cellTag = /^\s*\[cell\s+([^\]]+)\]\s*/i.exec(s);
        if (cellTag) {
            var col = validateColorSpecFallback(cellTag[1]);
            if (col) {
                c.background = col;
                s = trimStr(s.slice(cellTag[0].length));
            }
        }
        if (!s) return c;
        c.children = parseInlineChildrenFromMarkdown(s, { inTableCell: true });
        return c;
    }

    var ALIGN_TO_SEP = {
        'default': '---',
        '': '---',
        'left': ':---',
        'center': ':---:',
        'right': '---:'
    };

    function createDefaultBlock(type) {
        var id = nextBlockId();
        switch (type) {
            case 'heading':
                return {
                    id: id, type: 'heading', level: '2', text: 'Section Title',
                    color: '', bold: false, italic: false, strike: false, blink: false, blinkSpeed: ''
                };
            case 'text':
                return {
                    id: id, type: 'text', text: 'New text paragraph',
                    color: '', bold: false, italic: false, strike: false, blink: false, blinkSpeed: ''
                };
            case 'list':
                return {
                    id: id, type: 'list', ordered: false,
                    items: [
                        { text: 'First item', icon: '', color: '', bold: false, italic: false, strike: false },
                        { text: 'Second item', icon: '', color: '', bold: false, italic: false, strike: false }
                    ]
                };
            case 'table':
                return {
                    id: id, type: 'table', headerless: false, align: ['left', 'right'],
                    rows: [
                        [createDefaultCell('Metric'), createDefaultCell('Value')],
                        [createDefaultCell('Temperature'), createDefaultCell('21.5 °C')],
                        [createDefaultCell('Humidity'), createDefaultCell('54%')]
                    ]
                };
            case 'callout':
                return {
                    id: id, type: 'callout', variant: '1', customColor: '@accent',
                    children: [
                        createDefaultChildBlock('icon', 'ph-info'),
                        createDefaultChildBlock('text', 'Important status message')
                    ],
                    blink: false, blinkSpeed: ''
                };
            case 'icon':
                return {
                    id: id, type: 'icon', name: 'ph-house', weight: 'default',
                    size: '28', tint: '', secondary: '', label: '', blink: false, blinkSpeed: ''
                };
            case 'image':
                return {
                    id: id, type: 'image', url: '', alt: 'Image',
                    width: '', height: '', tint: '', linkUrl: '', linkNewTab: false
                };
            case 'topic':
                return {
                    id: id, type: 'topic', mode: 'topic',
                    path: 'homey/temp', formula: 'if({{homey/temp}} > 20, "Hot", "Cold")',
                    prefix: '', suffix: '', color: '', bold: false, italic: false, blink: false, blinkSpeed: ''
                };
            case 'quote':
                return { id: id, type: 'quote', text: 'Quoted note' };
            case 'code':
                return { id: id, type: 'code', code: 'status: online' };
            case 'link':
                return {
                    id: id, type: 'link', linkType: 'url', label: 'Open Link',
                    url: 'https://', helpTopic: 'Widgets/text', newTab: true,
                    icon: '', color: '', bold: false
                };
            case 'rule':
                return { id: id, type: 'rule' };
            default:
                return {
                    id: id, type: 'text', text: '',
                    color: '', bold: false, italic: false, strike: false, blink: false, blinkSpeed: ''
                };
        }
    }

    function blockToMarkdown(b) {
        if (!b || !b.type) return '';
        switch (b.type) {
            case 'heading': {
                var lvl = parseInt(String(b.level || '2'), 10);
                if (!(lvl >= 1 && lvl <= 3)) lvl = 2;
                var hBody = oneLineStr(b.text);
                if (!trimStr(hBody)) return '';
                var hInner = decorateInlineString(hBody, {
                    color: b.color,
                    bold: b.bold,
                    italic: b.italic,
                    strike: b.strike,
                    blink: b.blink,
                    blinkSpeed: b.blinkSpeed
                });
                return repeatChar('#', lvl) + ' ' + hInner;
            }
            case 'text': {
                var rawText = normalizeLines(b.text);
                var lines = rawText.split('\n');
                var out = [];
                var i;
                for (i = 0; i < lines.length; i++) {
                    var ln = lines[i];
                    out.push(ln ? decorateInlineString(ln, b) : '');
                }
                return out.join('\n');
            }
            case 'list': {
                var items = Array.isArray(b.items) ? b.items : [];
                var listOut = [];
                var idx = 0;
                var k;
                for (k = 0; k < items.length; k++) {
                    var it = items[k];
                    if (!it) continue;
                    var itemTxt = oneLineStr(it.text);
                    var iconTok = '';
                    if (it.icon) {
                        var icSlug = normalizeIconSlug(it.icon);
                        if (icSlug) iconTok = ':ph-' + icSlug + ': ';
                    }
                    var decorated = decorateInlineString(itemTxt, {
                        color: it.color,
                        bold: it.bold,
                        italic: it.italic,
                        strike: it.strike
                    });
                    if (!decorated && !iconTok) continue;
                    idx += 1;
                    var marker = b.ordered ? (idx + '. ') : '- ';
                    listOut.push(marker + iconTok + decorated);
                }
                return listOut.join('\n');
            }
            case 'table': {
                var rows = Array.isArray(b.rows) ? b.rows : [];
                var align = Array.isArray(b.align) ? b.align : [];
                var cols = align.length || (rows[0] ? rows[0].length : 2);
                if (!cols || !rows.length) return '';
                var linesOut = [];
                if (b.headerless) {
                    var emptyHdr = [];
                    var c;
                    for (c = 0; c < cols; c++) emptyHdr.push(' ');
                    linesOut.push(joinPipeRow(emptyHdr));
                } else {
                    var hdrCells = [];
                    var hc;
                    for (hc = 0; hc < cols; hc++) {
                        hdrCells.push(cellToMarkdown(rows[0][hc]));
                    }
                    linesOut.push(joinPipeRow(hdrCells));
                }
                var sepCells = [];
                var sc;
                for (sc = 0; sc < cols; sc++) {
                    sepCells.push(ALIGN_TO_SEP[align[sc] || 'default'] || '---');
                }
                linesOut.push(joinPipeRow(sepCells));
                var ri;
                for (ri = 1; ri < rows.length; ri++) {
                    var rowArr = rows[ri] || [];
                    var bodyCells = [];
                    var bc;
                    for (bc = 0; bc < cols; bc++) {
                        bodyCells.push(cellToMarkdown(rowArr[bc]));
                    }
                    linesOut.push(joinPipeRow(bodyCells));
                }
                return linesOut.join('\n');
            }
            case 'callout': {
                var inner = '';
                if (Array.isArray(b.children)) {
                    inner = serializeInlineChildrenToMarkdown(b.children, { inCallout: true });
                } else {
                    var cBody = String(b.text == null ? '' : b.text).replace(/\r\n?/g, '\n');
                    var cPrefix = '';
                    if (b.icon) {
                        var ic = normalizeIconSlug(b.icon);
                        if (ic) cPrefix = ':ph-' + ic + ': ';
                    }
                    var styled = decorateInlineString(cBody, {
                        bold: b.bold,
                        italic: b.italic,
                        strike: b.strike
                    });
                    inner = stripLiteralCloseBracketsInCallout(cPrefix + styled);
                }
                var head;
                if (b.variant === 'custom') {
                    var cc = validateColorSpecFallback(b.customColor) || '@accent';
                    head = '[block ' + cc + ':' + inner + ']';
                } else {
                    var vNum = /^[1-4]$/.test(String(b.variant)) ? String(b.variant) : '1';
                    head = '[block' + vNum + ':' + inner + ']';
                }
                if (b.blink && b.variant !== 'custom') {
                    var spd = formatPositiveSpeed(b.blinkSpeed);
                    return '[blink' + (spd && spd !== '1' ? ' ' + spd : '') + ']' + head + '[/blink]';
                }
                return head;
            }
            case 'icon': {
                var token = iconObjToMd(b);
                if (!token) return '';
                var outIcon = b.label ? (token + ' ' + oneLineStr(b.label)) : token;
                if (b.blink) {
                    var iSpd = formatPositiveSpeed(b.blinkSpeed);
                    outIcon = '[blink' + (iSpd && iSpd !== '1' ? ' ' + iSpd : '') + ']' + outIcon + '[/blink]';
                }
                return outIcon;
            }
            case 'image':
                return imageObjToMd(b);
            case 'topic': {
                var expr = b.mode === 'formula'
                    ? trimStr(b.formula)
                    : trimStr(b.path).replace(/^\{\{|\}\}$/g, '');
                if (!expr) return '';
                var full = (b.prefix || '') + '{{' + expr + '}}' + (b.suffix || '');
                return decorateInlineString(oneLineStr(full), {
                    color: b.color,
                    bold: b.bold,
                    italic: b.italic,
                    blink: b.blink,
                    blinkSpeed: b.blinkSpeed
                });
            }
            case 'quote': {
                var qLines = normalizeLines(b.text).split('\n');
                var qi;
                for (qi = 0; qi < qLines.length; qi++) {
                    qLines[qi] = '> ' + qLines[qi];
                }
                return qLines.join('\n');
            }
            case 'code': {
                var codeBody = String(b.code == null ? '' : b.code).replace(/\r\n?/g, '\n');
                return '```\n' + codeBody + '\n```';
            }
            case 'link': {
                var lbl = oneLineStr(b.label || 'Open Link').replace(/[\[\]]/g, '');
                var dest = b.linkType === 'help'
                    ? ('help://' + trimStr(b.helpTopic || 'Widgets/text').replace(/^help:\/\//i, ''))
                    : safeUrlForMd(b.url || 'https://');
                if (!dest) return '';
                var suffix = (b.linkType !== 'help' && b.newTab) ? ' ^' : '';
                var mdLink = '[' + lbl + '](' + dest + suffix + ')';
                if (b.icon) {
                    var lIcon = normalizeIconSlug(b.icon);
                    if (lIcon) mdLink = ':ph-' + lIcon + ': ' + mdLink;
                }
                return decorateInlineString(mdLink, {
                    color: b.color,
                    bold: b.bold
                });
            }
            case 'rule':
                return '---';
            default:
                return String(b.raw || b.text || '');
        }
    }

    function serializeBlocksToMarkdown(blocks) {
        if (!Array.isArray(blocks) || !blocks.length) return '';
        var out = [];
        var i;
        for (i = 0; i < blocks.length; i++) {
            var md = blockToMarkdown(blocks[i]);
            if (md && md.length) out.push(md);
        }
        return out.join('\n\n');
    }

    function parseCalloutFromText(chunk) {
        var dec = unwrapWholeStringDecorators(chunk);
        var target = trimStr(chunk);
        var blink = false;
        var blinkSpeed = '';
        if (dec.blink && !dec.color && !dec.bold && !dec.italic && !dec.strike) {
            target = trimStr(dec.text);
            blink = true;
            blinkSpeed = dec.blinkSpeed;
        }
        var m = /^\[block\s*(?:([1-4])|(#[0-9a-fA-F]{3,8}|@[a-zA-Z][a-zA-Z0-9_-]*|rgba?\([^)]*\)|hsla?\([^)]*\)))\s*:\s*([\s\S]*?)\]$/i.exec(target);
        if (!m) return null;
        var body = trimStr(m[3]).replace(/&#93;/g, ']');
        var children = parseInlineChildrenFromMarkdown(body, { inCallout: true });
        return {
            id: nextBlockId(),
            type: 'callout',
            variant: m[1] ? m[1] : 'custom',
            customColor: m[2] ? (validateColorSpecFallback(m[2]) || '@accent') : '@accent',
            children: children,
            blink: blink,
            blinkSpeed: blinkSpeed
        };
    }

    function parseSingleLineSpecialized(line) {
        var trimmed = trimStr(line);
        if (!trimmed) return null;

        // 1. Standalone Callout
        var callout = parseCalloutFromText(trimmed);
        if (callout) return callout;

        // 2. Standalone Image (or Linked Image)
        var img = parseImageTokenStr(trimmed);
        if (img) {
            return {
                id: nextBlockId(),
                type: 'image',
                url: img.url,
                alt: img.alt,
                width: img.width,
                height: img.height,
                tint: img.tint,
                linkUrl: img.linkUrl,
                linkNewTab: img.linkNewTab
            };
        }

        // 3. Standalone Icon (with optional blink wrapper)
        var dec = unwrapWholeStringDecorators(trimmed);
        if (!dec.color && !dec.bold && !dec.italic && !dec.strike) {
            var iconCandidate = dec.text;
            var icParsed = parseIconTokenStr(iconCandidate);
            if (icParsed) {
                return {
                    id: nextBlockId(),
                    type: 'icon',
                    name: icParsed.name,
                    weight: icParsed.weight,
                    size: icParsed.size,
                    tint: icParsed.tint,
                    secondary: icParsed.secondary,
                    label: '',
                    blink: dec.blink,
                    blinkSpeed: dec.blinkSpeed
                };
            }
        }

        // 4. Standalone Link (with optional leading :ph-icon: and bold/color)
        if (!dec.italic && !dec.strike && !dec.blink) {
            var linkSrc = dec.text;
            var linkIcon = '';
            var liMatch = /^:(ph-[a-z0-9-]+):\s+/i.exec(linkSrc);
            if (liMatch) {
                linkIcon = liMatch[1].toLowerCase();
                linkSrc = linkSrc.slice(liMatch[0].length);
            }
            var linkMatch = /^\[([^\]\n]+)\]\(([^)\n]+)\)$/.exec(linkSrc);
            if (linkMatch && linkMatch[1].indexOf('![') < 0) {
                var rawDest = trimStr(linkMatch[2]);
                var isHelp = /^help:\/\//i.test(rawDest);
                var newTab = false;
                if (!isHelp && /\s*\^$/.test(rawDest)) {
                    newTab = true;
                    rawDest = trimStr(rawDest.replace(/\s*\^$/, ''));
                }
                return {
                    id: nextBlockId(),
                    type: 'link',
                    linkType: isHelp ? 'help' : 'url',
                    label: linkMatch[1],
                    url: isHelp ? 'https://' : rawDest,
                    helpTopic: isHelp ? rawDest.replace(/^help:\/\//i, '') : 'Widgets/text',
                    newTab: newTab,
                    icon: linkIcon,
                    color: dec.color,
                    bold: dec.bold
                };
            }
        }

        // 5. Standalone Topic / Formula (with optional plain prefix/suffix)
        var braceTokens = scanDoubleBraces(dec.text);
        if (braceTokens.length === 1 && !dec.strike) {
            var tok = braceTokens[0];
            var pre = dec.text.slice(0, tok.start);
            var suf = dec.text.slice(tok.end);
            if (!/[#*`\[\]<>:]/.test(pre) && !/[#*`\[\]<>:]/.test(suf)) {
                var innerExpr = trimStr(tok.inner);
                return {
                    id: nextBlockId(),
                    type: 'topic',
                    mode: looksLikeFormulaExpr(innerExpr) ? 'formula' : 'topic',
                    path: looksLikeFormulaExpr(innerExpr) ? 'homey/temp' : innerExpr,
                    formula: looksLikeFormulaExpr(innerExpr) ? innerExpr : 'if({{homey/temp}} > 20, "Hot", "Cold")',
                    prefix: pre,
                    suffix: suf,
                    color: dec.color,
                    bold: dec.bold,
                    italic: dec.italic,
                    blink: dec.blink,
                    blinkSpeed: dec.blinkSpeed
                };
            }
        }

        return null;
    }

    function isTableSepLine(line) {
        if (typeof MarkdownTableUtils !== 'undefined' && MarkdownTableUtils.isSeparatorLine) {
            return MarkdownTableUtils.isSeparatorLine(line);
        }
        var s = trimStr(line);
        if (s.indexOf('|') < 0) return false;
        if (s.charAt(0) === '|') s = s.slice(1);
        if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1);
        var parts = s.split('|');
        var i;
        for (i = 0; i < parts.length; i++) {
            if (!/^:?-{3,}:?$/.test(trimStr(parts[i]))) return false;
        }
        return parts.length > 0;
    }

    function parseColAlign(raw) {
        if (typeof MarkdownTableUtils !== 'undefined' && MarkdownTableUtils.parseColumnAlign) {
            return MarkdownTableUtils.parseColumnAlign(raw);
        }
        var p = trimStr(raw);
        var left = p.charAt(0) === ':';
        var right = p.charAt(p.length - 1) === ':';
        if (left && right) return 'center';
        if (left) return 'left';
        if (right) return 'right';
        return 'default';
    }

    function isSpecialBlockStart(lines, idx) {
        var line = lines[idx];
        var tr = trimStr(line);
        if (!tr) return true;
        if (/^```/.test(tr)) return true;
        if (/^(#{1,3})\s+/.test(tr)) return true;
        if (/^(?:---+|___+|\*\*\*+)$/.test(tr)) return true;
        if (/^>\s?/.test(tr)) return true;
        if (/^\s*(?:[-*+]|\d+\.)\s+/.test(line)) return true;
        if (/^\[(?:blink[^\]]*\]\s*)?\[block\s*(?:[1-4]|#|@|rgba?\(|hsla?\()/i.test(tr)) return true;
        if (line.indexOf('|') >= 0 && idx + 1 < lines.length && isTableSepLine(lines[idx + 1])) return true;
        if (parseSingleLineSpecialized(tr)) return true;
        return false;
    }

    function parseMarkdownToBlocks(markdownString) {
        var src = normalizeLines(markdownString);
        if (!trimStr(src)) return [];
        var lines = src.split('\n');
        var blocks = [];
        var i = 0;

        while (i < lines.length) {
            var line = lines[i];
            var tr = trimStr(line);

            if (!tr) {
                i += 1;
                continue;
            }

            // 1. Fenced Code Block
            if (/^```/.test(tr)) {
                var codeLines = [];
                i += 1;
                while (i < lines.length && !/^```\s*$/.test(trimStr(lines[i]))) {
                    codeLines.push(lines[i]);
                    i += 1;
                }
                if (i < lines.length && /^```\s*$/.test(trimStr(lines[i]))) i += 1;
                blocks.push({
                    id: nextBlockId(),
                    type: 'code',
                    code: codeLines.join('\n')
                });
                continue;
            }

            // 2. Multi-line or Single-line Block Callout
            if (/^\[(?:blink[^\]]*\]\s*)?\[block\s*(?:[1-4]|#|@|rgba?\(|hsla?\()/i.test(tr)) {
                var buf = lines[i];
                var j = i;
                var calloutParsed = parseCalloutFromText(buf);
                while (!calloutParsed && j + 1 < lines.length) {
                    j += 1;
                    buf += '\n' + lines[j];
                    calloutParsed = parseCalloutFromText(buf);
                    if (buf.indexOf(']') >= 0 && calloutParsed) break;
                    if (j - i > 40) break;
                }
                if (calloutParsed) {
                    blocks.push(calloutParsed);
                    i = j + 1;
                    continue;
                }
            }

            // 3. GFM Pipe Table
            if (line.indexOf('|') >= 0 && i + 1 < lines.length && isTableSepLine(lines[i + 1])) {
                var hdrRaw = splitPipeRowSmart(lines[i]);
                var sepRaw = splitPipeRowSmart(lines[i + 1]);
                var colCount = Math.max(hdrRaw.length, sepRaw.length);
                var align = [];
                var cIdx;
                for (cIdx = 0; cIdx < colCount; cIdx++) {
                    align.push(parseColAlign(sepRaw[cIdx] || '---'));
                }
                var rows = [];
                var hdrRow = [];
                var allHeaderEmpty = true;
                for (cIdx = 0; cIdx < colCount; cIdx++) {
                    var hCell = parseCellFromMarkdown(hdrRaw[cIdx] || '');
                    if (hCell.background || (Array.isArray(hCell.children) && hCell.children.length > 0)) {
                        allHeaderEmpty = false;
                    }
                    hdrRow.push(hCell);
                }
                rows.push(hdrRow);
                i += 2;
                while (i < lines.length && trimStr(lines[i]) && lines[i].indexOf('|') >= 0 && !isTableSepLine(lines[i])) {
                    var bodyRaw = splitPipeRowSmart(lines[i]);
                    var bodyRow = [];
                    for (cIdx = 0; cIdx < colCount; cIdx++) {
                        bodyRow.push(parseCellFromMarkdown(bodyRaw[cIdx] || ''));
                    }
                    rows.push(bodyRow);
                    i += 1;
                }
                blocks.push({
                    id: nextBlockId(),
                    type: 'table',
                    headerless: allHeaderEmpty,
                    align: align,
                    rows: rows
                });
                continue;
            }

            // 4. Horizontal Rule
            if (/^(?:---+|___+|\*\*\*+)$/.test(tr)) {
                blocks.push({ id: nextBlockId(), type: 'rule' });
                i += 1;
                continue;
            }

            // 5. Blockquote
            if (/^>\s?/.test(tr)) {
                var qLines = [];
                while (i < lines.length && /^>\s?/.test(trimStr(lines[i]))) {
                    qLines.push(lines[i].replace(/^\s*>\s?/, ''));
                    i += 1;
                }
                blocks.push({
                    id: nextBlockId(),
                    type: 'quote',
                    text: qLines.join('\n')
                });
                continue;
            }

            // 6. Lists (Ordered / Unordered)
            var uMatch = /^\s*[-*+]\s+(.*)$/.exec(line);
            var oMatch = /^\s*\d+\.\s+(.*)$/.exec(line);
            if (uMatch || oMatch) {
                var isOrdered = !!oMatch;
                var items = [];
                while (i < lines.length) {
                    var lLine = lines[i];
                    var mList = isOrdered ? /^\s*\d+\.\s+(.*)$/.exec(lLine) : /^\s*[-*+]\s+(.*)$/.exec(lLine);
                    if (!mList) break;
                    var itemContent = trimStr(mList[1]);
                    var itemIcon = '';
                    var itemIconMatch = /^:(ph-[a-z0-9-]+):(?:\s+|$)/i.exec(itemContent);
                    if (itemIconMatch) {
                        itemIcon = itemIconMatch[1].toLowerCase();
                        itemContent = trimStr(itemContent.slice(itemIconMatch[0].length));
                    }
                    var itemDec = unwrapWholeStringDecorators(itemContent);
                    var canDec = !itemDec.blink;
                    items.push({
                        text: canDec ? itemDec.text : itemContent,
                        icon: itemIcon,
                        color: canDec ? itemDec.color : '',
                        bold: canDec ? itemDec.bold : false,
                        italic: canDec ? itemDec.italic : false,
                        strike: canDec ? itemDec.strike : false
                    });
                    i += 1;
                }
                blocks.push({
                    id: nextBlockId(),
                    type: 'list',
                    ordered: isOrdered,
                    items: items
                });
                continue;
            }

            // 7. Heading (#, ##, ###)
            var hMatch = /^(#{1,3})\s+(.*)$/.exec(tr);
            if (hMatch) {
                var hDec = unwrapWholeStringDecorators(hMatch[2]);
                blocks.push({
                    id: nextBlockId(),
                    type: 'heading',
                    level: String(hMatch[1].length),
                    text: hDec.text,
                    color: hDec.color,
                    bold: hDec.bold,
                    italic: hDec.italic,
                    strike: hDec.strike,
                    blink: hDec.blink,
                    blinkSpeed: hDec.blinkSpeed
                });
                i += 1;
                continue;
            }

            // 8. Standalone Specialized Line (Image / Icon / Link / Topic / Formula)
            var special = parseSingleLineSpecialized(tr);
            if (special) {
                blocks.push(special);
                i += 1;
                continue;
            }

            // 9. Paragraph / Text Block
            var pLines = [line];
            i += 1;
            while (i < lines.length && trimStr(lines[i]) && !isSpecialBlockStart(lines, i)) {
                pLines.push(lines[i]);
                i += 1;
            }
            var rawPara = pLines.join('\n');
            // Unwrap uniform whole-block decorators across lines if every non-empty line shares identical decoration
            if (pLines.length === 1) {
                var pDec = unwrapWholeStringDecorators(rawPara);
                blocks.push({
                    id: nextBlockId(),
                    type: 'text',
                    text: pDec.text,
                    color: pDec.color,
                    bold: pDec.bold,
                    italic: pDec.italic,
                    strike: pDec.strike,
                    blink: pDec.blink,
                    blinkSpeed: pDec.blinkSpeed
                });
            } else {
                blocks.push({
                    id: nextBlockId(),
                    type: 'text',
                    text: rawPara,
                    color: '',
                    bold: false,
                    italic: false,
                    strike: false,
                    blink: false,
                    blinkSpeed: ''
                });
            }
        }

        return blocks;
    }

    var MarkdownBlockCodec = {
        parseMarkdownToBlocks: parseMarkdownToBlocks,
        serializeBlocksToMarkdown: serializeBlocksToMarkdown,
        blockToMarkdown: blockToMarkdown,
        cellToMarkdown: cellToMarkdown,
        parseCellFromMarkdown: parseCellFromMarkdown,
        createDefaultBlock: createDefaultBlock,
        createDefaultChildBlock: createDefaultChildBlock,
        createDefaultCell: createDefaultCell,
        childBlockToInlineMarkdown: childBlockToInlineMarkdown,
        parseInlineChildrenFromMarkdown: parseInlineChildrenFromMarkdown,
        serializeInlineChildrenToMarkdown: serializeInlineChildrenToMarkdown,
        splitPipeRowSmart: splitPipeRowSmart,
        iconObjToMd: iconObjToMd,
        imageObjToMd: imageObjToMd,
        parseIconTokenStr: parseIconTokenStr,
        parseImageTokenStr: parseImageTokenStr,
        looksLikeFormulaExpr: looksLikeFormulaExpr,
        scanDoubleBraces: scanDoubleBraces,
        normalizeIconSlug: normalizeIconSlug
    };

    var MarkdownTextOps = {
        insertAt: insertAt,
        lineRange: lineRange,
        wrapBold: function (s, start, end) { return wrapRange(s, start, end, '**', '**'); },
        wrapItalic: function (s, start, end) { return wrapRange(s, start, end, '*', '*'); },
        wrapStrikethrough: function (s, start, end) { return wrapRange(s, start, end, '<s>', '</s>'); },
        wrapInlineCode: function (s, start, end) { return wrapRange(s, start, end, '`', '`'); },
        wrapBlockCallout: wrapBlockCallout,
        wrapBlockCalloutCustom: wrapBlockCalloutCustom,
        wrapCodeBlock: function (s, start, end) {
            var a = normIdx(start, s.length);
            var b = normIdx(end, s.length);
            var from = a < b ? a : b;
            var to = a < b ? b : a;
            var body = s.slice(from, to) || 'code';
            var block = '```\n' + body + '\n```\n';
            return { text: s.slice(0, from) + block + s.slice(to), start: from + 4, end: from + 4 + body.length };
        },
        setHeading: setHeadingSmart,
        toggleBulletList: toggleUnorderedList,
        toggleNumberedList: toggleOrderedList,
        toggleBlockquote: toggleBlockquote,
        insertHorizontalRule: function (s, start) {
            var p = normIdx(start, s.length);
            var before = s.slice(0, p);
            var ins = (before && before.slice(-1) !== '\n' ? '\n' : '') + '---\n';
            return insertAt(s, p, p, ins);
        },
        insertLink: function (s, start, end, url, openNewTab, customLabel) {
            var a = normIdx(start, s.length);
            var b = normIdx(end, s.length);
            var from = a < b ? a : b;
            var to = a < b ? b : a;
            var u = (url && String(url)) || 'https://';
            var label = s.slice(from, to) || (customLabel ? String(customLabel) : 'link text');
            var suffix = openNewTab === true ? ' ^' : '';
            var md = '[' + label + '](' + u + suffix + ')';
            return { text: s.slice(0, from) + md + s.slice(to), start: from, end: from + md.length };
        },
        insertImage: function (s, start, end, url, alt) {
            var a = normIdx(start, s.length);
            var b = normIdx(end, s.length);
            var from = a < b ? a : b;
            var to = a < b ? b : a;
            var u = (url && String(url)) || '';
            var al = (alt && String(alt)) || 'Image';
            var md = '![' + al + '](' + u + ')';
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

        insertTableRow: function (text, start, end, position) {
            return insertTableRow(text, start, position);
        },

        deleteTableRow: function (text, start, end) {
            return deleteTableRow(text, start);
        },

        insertTableColumn: function (text, start, end, position) {
            return insertTableColumn(text, start, position);
        },

        deleteTableColumn: function (text, start, end) {
            return deleteTableColumn(text, start);
        },

        moveTableColumn: function (text, start, end, dir) {
            return moveTableColumn(text, start, dir);
        },

        formatTableAtOffset: function (text, start, end) {
            return formatTableAtOffset(text, start);
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
            var c1n = from + ('[color ' + validated + ']').length;
            var c2n = c1n + selected.length;
            return { text: t, cursor: c1n, selEnd: c2n };
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

        getBlinkAtSelection: function (text, start, end) {
            if (typeof MarkdownBlink === 'undefined' || !MarkdownBlink.parseWrapAt) return null;
            var a = normIdx(start, String(text).length);
            var b = normIdx(end, String(text).length);
            return MarkdownBlink.parseWrapAt(text, a, b);
        },

        unwrapBlink: function (text, start, end) {
            if (typeof MarkdownBlink === 'undefined' || !MarkdownBlink.parseWrapAt) {
                return { text: text, cursor: start, selEnd: end };
            }
            var a = normIdx(start, String(text).length);
            var b = normIdx(end, String(text).length);
            var wrap = MarkdownBlink.parseWrapAt(text, a, b);
            if (!wrap) {
                return { text: text, cursor: start, selEnd: end };
            }
            var inner = String(text).slice(wrap.innerStart, wrap.innerEnd);
            var rebuilt = String(text).slice(0, wrap.openStart) + inner + String(text).slice(wrap.closeEnd);
            return { text: rebuilt, cursor: wrap.openStart, selEnd: wrap.openStart + inner.length };
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
            var c1n = from + MarkdownBlink.formatOpenTag(n).length;
            var c2n = c1n + selected.length;
            return { text: t, cursor: c1n, selEnd: c2n };
        },

        BlockCodec: MarkdownBlockCodec
    };

    global.MarkdownBlockCodec = MarkdownBlockCodec;
    global.MarkdownTextOps = MarkdownTextOps;
})(typeof window !== 'undefined' ? window : this);
