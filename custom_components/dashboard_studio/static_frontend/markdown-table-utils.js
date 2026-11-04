/**
 * GFM pipe-table helpers for Text widget markdown and the Full editor.
 * No optional chaining (Safari 12).
 */
(function (global) {
    function trimRow(line) {
        var s = String(line == null ? '' : line).trim();
        if (!s) return '';
        if (s.charAt(0) === '|') s = s.slice(1);
        if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1);
        return s;
    }

    function isTableRowLine(line) {
        var s = String(line == null ? '' : line).trim();
        if (!s) return false;
        return s.indexOf('|') !== -1;
    }

    function countColumns(line) {
        var body = trimRow(line);
        if (!body) return 0;
        return body.split('|').length;
    }

    function isSeparatorLine(line) {
        if (!isTableRowLine(line)) return false;
        var body = trimRow(line);
        if (!body) return false;
        var parts = body.split('|');
        var i = 0;
        for (i = 0; i < parts.length; i++) {
            var p = parts[i].trim();
            if (!/^:?-{3,}:?$/.test(p)) return false;
        }
        return parts.length > 0;
    }

    function isHeaderLine(line) {
        if (!isTableRowLine(line)) return false;
        return countColumns(line) >= 1;
    }

    function splitRowCells(line) {
        var body = trimRow(line);
        if (!body) return [];
        return body.split('|');
    }

    function joinRowCells(cells) {
        var i = 0;
        var parts = [];
        for (i = 0; i < cells.length; i++) {
            parts.push(cells[i] == null ? '' : String(cells[i]));
        }
        return '| ' + parts.join(' | ') + ' |';
    }

    function normOffset(offset, max) {
        var n = parseInt(String(offset), 10);
        if (isNaN(n) || n < 0) return 0;
        if (n > max) return max;
        return n;
    }

    /** Character ranges for each cell in a pipe row (document offsets). */
    function getCellRangesInLine(line, lineStartInDoc) {
        var t = String(line == null ? '' : line);
        var pipes = [];
        var i = 0;
        for (i = 0; i < t.length; i++) {
            if (t.charAt(i) === '|') pipes.push(i);
        }
        if (pipes.length < 2) return [];
        var ranges = [];
        var c = 0;
        for (c = 0; c < pipes.length - 1; c++) {
            var localStart = pipes[c] + 1;
            var localEnd = pipes[c + 1];
            ranges.push({
                cellIndex: c,
                start: lineStartInDoc + localStart,
                end: lineStartInDoc + localEnd,
                text: t.slice(localStart, localEnd)
            });
        }
        return ranges;
    }

    function lineIndexAt(text, offset) {
        var s = String(text == null ? '' : text).replace(/\r/g, '');
        if (!s.length) return 0;
        var p = normOffset(offset, s.length);
        var lines = s.split('\n');
        var acc = 0;
        var i = 0;
        for (i = 0; i < lines.length; i++) {
            var L = lines[i].length;
            var lineEnd = acc + L;
            if (p <= lineEnd) return i;
            acc = lineEnd + 1;
        }
        return lines.length - 1;
    }

    function lineStartOffset(text, lineIndex) {
        var s = String(text == null ? '' : text).replace(/\r/g, '');
        var lines = s.split('\n');
        var i = 0;
        var acc = 0;
        for (i = 0; i < lineIndex && i < lines.length; i++) {
            acc += lines[i].length + 1;
        }
        return acc;
    }

    function isLineInTableBlock(lines, lineIndex) {
        var i = 0;
        while (i < lines.length) {
            var headerLine = lines[i];
            var sepLine = lines[i + 1];
            if (isHeaderLine(headerLine) && isSeparatorLine(sepLine)) {
                if (lineIndex === i || lineIndex === i + 1) {
                    return lineIndex === i;
                }
                var j = i + 2;
                while (j < lines.length && isTableRowLine(lines[j]) && !isSeparatorLine(lines[j])) {
                    if (lineIndex === j) return true;
                    j += 1;
                }
                i = j;
                continue;
            }
            i += 1;
        }
        return false;
    }

    /**
     * @param {string} text
     * @param {number} offset
     * @returns {object|null}
     */
    function getTableCellAtOffset(text, offset) {
        var s = String(text == null ? '' : text).replace(/\r/g, '');
        if (!s.length) return null;
        var pos = normOffset(offset, s.length);
        var li = lineIndexAt(s, pos);
        var lines = s.split('\n');
        var line = lines[li];
        if (!line || !isTableRowLine(line) || isSeparatorLine(line)) return null;
        if (!isLineInTableBlock(lines, li)) return null;

        var lineStart = lineStartOffset(s, li);
        var ranges = getCellRangesInLine(line, lineStart);
        var r = 0;
        for (r = 0; r < ranges.length; r++) {
            var cell = ranges[r];
            if (pos >= cell.start && pos <= cell.end) {
                return {
                    inTable: true,
                    lineIndex: li,
                    cellIndex: cell.cellIndex,
                    lineStart: lineStart,
                    lineEnd: lineStart + line.length,
                    cellStart: cell.start,
                    cellEnd: cell.end,
                    cellText: cell.text
                };
            }
        }
        return null;
    }

    /**
     * @param {string} text
     * @param {function({ lineIndex: number, line: string, rowKind: string, tableIndex: number })} fn
     */
    function iterateTableBlocks(text, fn) {
        var s = String(text == null ? '' : text).replace(/\r/g, '');
        if (!s || typeof fn !== 'function') return;
        var lines = s.split('\n');
        var tableIndex = 0;
        var i = 0;
        while (i < lines.length) {
            var headerLine = lines[i];
            var sepLine = lines[i + 1];
            if (isHeaderLine(headerLine) && isSeparatorLine(sepLine)) {
                fn({ lineIndex: i, line: headerLine, rowKind: 'header', tableIndex: tableIndex });
                var j = i + 2;
                while (j < lines.length && isTableRowLine(lines[j]) && !isSeparatorLine(lines[j])) {
                    fn({ lineIndex: j, line: lines[j], rowKind: 'body', tableIndex: tableIndex });
                    j += 1;
                }
                tableIndex += 1;
                i = j;
                continue;
            }
            i += 1;
        }
    }

    var BR_SPLIT_RE = /<br\s*\/?>/gi;

    function splitCellOnBr(cellText) {
        var s = String(cellText == null ? '' : cellText);
        if (s.indexOf('<br') < 0) return [s];
        return s.split(BR_SPLIT_RE);
    }

    function processCellHeadingSegments(cellText, renderInlineFn) {
        var segments = splitCellOnBr(cellText);
        var renderFn = typeof renderInlineFn === 'function' ? renderInlineFn : function (t) {
            return t == null ? '' : String(t);
        };
        var out = [];
        var si = 0;
        for (si = 0; si < segments.length; si++) {
            var seg = segments[si];
            var prefix = '';
            var segBody = seg;
            if (typeof MarkdownCellColor !== 'undefined' && MarkdownCellColor.parseDirective) {
                var cellParsed = MarkdownCellColor.parseDirective(seg);
                if (cellParsed) {
                    prefix = seg.slice(0, seg.length - cellParsed.body.length);
                    segBody = cellParsed.body;
                }
            }
            var hm = /^\s*(#{1,3})\s+([\s\S]+)$/.exec(segBody);
            if (hm) {
                var level = hm[1].length;
                var inner = renderFn(hm[2]);
                out.push(prefix + '<h' + level + '>' + inner + '</h' + level + '>');
            } else {
                out.push(seg);
            }
        }
        return out.join('<br>');
    }

    /**
     * Convert # / ## / ### segments inside pipe-table cells (split on <br>) to h1-h3 HTML.
     * @param {string} src
     * @param {function(string): string} renderInlineFn
     */
    function preprocessTableCellHeadings(src, renderInlineFn) {
        var s = String(src == null ? '' : src).replace(/\r/g, '');
        if (!s || s.indexOf('|') < 0) return s;
        var lines = s.split('\n');
        var replaced = {};
        iterateTableBlocks(s, function (info) {
            if (info.rowKind !== 'header' && info.rowKind !== 'body') return;
            var line = lines[info.lineIndex];
            var cells = splitRowCells(line);
            var ci = 0;
            for (ci = 0; ci < cells.length; ci++) {
                cells[ci] = processCellHeadingSegments(cells[ci], renderInlineFn);
            }
            replaced[info.lineIndex] = joinRowCells(cells);
        });
        if (!Object.keys(replaced).length) return s;
        var out = [];
        var li = 0;
        for (li = 0; li < lines.length; li++) {
            out.push(replaced[li] !== undefined ? replaced[li] : lines[li]);
        }
        return out.join('\n');
    }

    function parseColumnAlign(raw) {
        var p = String(raw == null ? '' : raw).trim();
        if (!/^:?-{3,}:?$/.test(p)) return 'default';
        var left = p.charAt(0) === ':';
        var right = p.charAt(p.length - 1) === ':';
        if (left && right) return 'center';
        if (left) return 'left';
        if (right) return 'right';
        return 'default';
    }

    function formatColumnAlign(align) {
        if (align === 'left') return ':---';
        if (align === 'center') return ':---:';
        if (align === 'right') return '---:';
        return '---';
    }

    function findTableBlockContainingLine(lines, lineIndex) {
        var i = 0;
        while (i < lines.length) {
            var headerLine = lines[i];
            var sepLine = lines[i + 1];
            if (isHeaderLine(headerLine) && isSeparatorLine(sepLine)) {
                var last = i + 1;
                var j = i + 2;
                while (j < lines.length && isTableRowLine(lines[j]) && !isSeparatorLine(lines[j])) {
                    last = j;
                    j += 1;
                }
                if (lineIndex >= i && lineIndex <= last) {
                    return { headerIndex: i, sepIndex: i + 1, lastIndex: last };
                }
                i = j;
                continue;
            }
            i += 1;
        }
        return null;
    }

    function cellIndexAtOffsetInLine(line, lineStartInDoc, offset) {
        var ranges = getCellRangesInLine(line, lineStartInDoc);
        if (!ranges.length) return -1;
        var r = 0;
        for (r = 0; r < ranges.length; r++) {
            if (offset >= ranges[r].start && offset <= ranges[r].end) return ranges[r].cellIndex;
        }
        if (offset < ranges[0].start) return ranges[0].cellIndex;
        return ranges[ranges.length - 1].cellIndex;
    }

    /**
     * Column under the cursor in a GFM table (header, separator, or body).
     * @returns {{ align: string, cellIndex: number }|null}
     */
    function getTableColumnAlignAtOffset(text, offset) {
        var s = String(text == null ? '' : text).replace(/\r/g, '');
        if (!s.length) return null;
        var pos = normOffset(offset, s.length);
        var li = lineIndexAt(s, pos);
        var lines = s.split('\n');
        var block = findTableBlockContainingLine(lines, li);
        if (!block) return null;
        var line = lines[li];
        if (!line || !isTableRowLine(line)) return null;
        var lineStart = lineStartOffset(s, li);
        var cellIndex = cellIndexAtOffsetInLine(line, lineStart, pos);
        if (cellIndex < 0) return null;
        var sepCells = splitRowCells(lines[block.sepIndex]);
        var raw = cellIndex < sepCells.length ? sepCells[cellIndex] : '---';
        return {
            align: parseColumnAlign(raw),
            cellIndex: cellIndex
        };
    }

    /**
     * Set GFM separator alignment for the column under the cursor.
     * @returns {{ text: string, cursor: number, selEnd: number }}
     */
    function setTableColumnAlign(text, offset, align) {
        var s = String(text == null ? '' : text).replace(/\r/g, '');
        var pos = normOffset(offset, s.length);
        var info = getTableColumnAlignAtOffset(s, pos);
        if (!info) return { text: text, cursor: offset, selEnd: offset };
        var lines = s.split('\n');
        var li = lineIndexAt(s, pos);
        var block = findTableBlockContainingLine(lines, li);
        if (!block) return { text: text, cursor: offset, selEnd: offset };
        var sepLine = lines[block.sepIndex];
        var cells = splitRowCells(sepLine);
        var ci = 0;
        for (ci = 0; ci < cells.length; ci++) {
            cells[ci] = String(cells[ci] == null ? '' : cells[ci]).trim();
        }
        while (cells.length <= info.cellIndex) cells.push('---');
        cells[info.cellIndex] = formatColumnAlign(align);
        var newSep = joinRowCells(cells);
        var sepStart = lineStartOffset(s, block.sepIndex);
        var sepEnd = sepStart + sepLine.length;
        var rebuilt = s.slice(0, sepStart) + newSep + s.slice(sepEnd);
        var cursor = pos;
        if (pos >= sepStart && pos <= sepEnd) {
            var rel = pos - sepStart;
            if (rel > newSep.length) rel = newSep.length;
            cursor = sepStart + rel;
        } else if (pos > sepEnd) {
            cursor = pos + (newSep.length - sepLine.length);
        }
        if (cursor < 0) cursor = 0;
        if (cursor > rebuilt.length) cursor = rebuilt.length;
        return { text: rebuilt, cursor: cursor, selEnd: cursor };
    }

    function getMaxColumnCount(rawText) {
        var src = String(rawText == null ? '' : rawText).replace(/\r/g, '');
        if (!src) return 0;
        var lines = src.split('\n');
        var best = 0;
        var i = 0;
        while (i < lines.length) {
            var headerLine = lines[i];
            var sepLine = lines[i + 1];
            if (!isHeaderLine(headerLine) || !isSeparatorLine(sepLine)) {
                i += 1;
                continue;
            }
            var cols = countColumns(headerLine);
            if (cols > best) best = cols;
            i += 2;
            while (i < lines.length && isTableRowLine(lines[i])) i += 1;
        }
        return best;
    }

    var MarkdownTableUtils = {
        trimRow: trimRow,
        isTableRowLine: isTableRowLine,
        isSeparatorLine: isSeparatorLine,
        isHeaderLine: isHeaderLine,
        countColumns: countColumns,
        splitRowCells: splitRowCells,
        joinRowCells: joinRowCells,
        getCellRangesInLine: getCellRangesInLine,
        getTableCellAtOffset: getTableCellAtOffset,
        iterateTableBlocks: iterateTableBlocks,
        getMaxColumnCount: getMaxColumnCount,
        preprocessTableCellHeadings: preprocessTableCellHeadings,
        parseColumnAlign: parseColumnAlign,
        formatColumnAlign: formatColumnAlign,
        getTableColumnAlignAtOffset: getTableColumnAlignAtOffset,
        setTableColumnAlign: setTableColumnAlign
    };

    global.MarkdownTableUtils = MarkdownTableUtils;
})(typeof window !== 'undefined' ? window : this);
