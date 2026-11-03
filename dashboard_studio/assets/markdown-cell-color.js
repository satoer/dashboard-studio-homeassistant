/**
 * Markdown table cell background directives: [cell #hex] / [cell @token] prefix syntax.
 */
(function (global) {
    var CELL_TAG_RE = /^\s*\[cell\s+([^\]]+)\]\s*/i;
    var CELL_SOURCE_RE = /\[cell\s+[^\]]+\]/i;
    var DATA_ATTR = 'data-text-md-cell-bg';

    function validateColorSpec(raw) {
        if (typeof MarkdownColorSpec !== 'undefined' && MarkdownColorSpec.validateColorSpec) {
            return MarkdownColorSpec.validateColorSpec(raw);
        }
        return null;
    }

    function parseDirective(cellText) {
        var s = String(cellText == null ? '' : cellText);
        var m = CELL_TAG_RE.exec(s);
        if (!m) return null;
        var colorRaw = String(m[1]).trim();
        var color = validateColorSpec(colorRaw);
        if (!color) return null;
        return {
            color: color,
            body: s.slice(m[0].length)
        };
    }

    function formatDirective(color) {
        var c = validateColorSpec(color);
        if (!c) return '';
        return '[cell ' + c + ']';
    }

    function setCellDirective(cellText, color) {
        var directive = formatDirective(color);
        if (!directive) return String(cellText == null ? '' : cellText);
        var parsed = parseDirective(cellText);
        var body = parsed ? parsed.body : String(cellText == null ? '' : cellText);
        return directive + body;
    }

    function removeCellDirective(cellText) {
        var s = String(cellText == null ? '' : cellText);
        var m = CELL_TAG_RE.exec(s);
        if (!m) return s;
        return s.slice(m[0].length);
    }

    function stripDirectiveFromCell(cellText) {
        var parsed = parseDirective(cellText);
        if (!parsed) return String(cellText == null ? '' : cellText);
        var body = parsed.body;
        if (!body || !String(body).length) return '\u200b';
        return body;
    }

    function sourceHasCellDirectives(src) {
        return CELL_SOURCE_RE.test(String(src == null ? '' : src));
    }

    function isAllowedDataAttrValue(val) {
        return validateColorSpec(val) !== null;
    }

    function resolveCellBackgroundCss(spec) {
        if (typeof MarkdownColorSpec !== 'undefined' && MarkdownColorSpec.resolveColorCss) {
            return MarkdownColorSpec.resolveColorCss(spec);
        }
        return spec;
    }

    function applyBackgroundToTableCell(cellEl, spec) {
        if (!cellEl || !cellEl.style || !spec) return;
        var resolved = resolveCellBackgroundCss(spec);
        if (!resolved) return;
        cellEl.setAttribute(DATA_ATTR, spec);
        cellEl.style.setProperty('background-color', resolved);
        cellEl.style.setProperty('background', resolved);
    }

    /**
     * Collect { tableIndex, rowKind, bodyRowIndex, colIndex, color } from markdown source.
     */
    function buildColorMap(src) {
        var entries = [];
        if (!src || typeof MarkdownTableUtils === 'undefined' || !sourceHasCellDirectives(src)) {
            return entries;
        }
        var s = String(src).replace(/\r/g, '');
        var lines = s.split('\n');
        var bodyRowByTable = {};
        MarkdownTableUtils.iterateTableBlocks(s, function (info) {
            var line = lines[info.lineIndex];
            var cells = MarkdownTableUtils.splitRowCells(line);
            var bodyRowIndex = 0;
            if (info.rowKind === 'body') {
                var prev = bodyRowByTable[info.tableIndex];
                bodyRowIndex = prev == null ? 0 : prev;
                bodyRowByTable[info.tableIndex] = bodyRowIndex + 1;
            }
            var ci = 0;
            for (ci = 0; ci < cells.length; ci++) {
                var parsed = parseDirective(cells[ci]);
                if (!parsed) continue;
                entries.push({
                    tableIndex: info.tableIndex,
                    rowKind: info.rowKind,
                    bodyRowIndex: bodyRowIndex,
                    colIndex: ci,
                    color: parsed.color
                });
            }
        });
        return entries;
    }

    /** Remove [cell …] prefixes from table rows in the render copy (markers are not reliable inside GFM cells). */
    function stripDirectivesForRender(src) {
        var s = String(src == null ? '' : src).replace(/\r/g, '');
        if (!s || typeof MarkdownTableUtils === 'undefined') return s;
        if (!sourceHasCellDirectives(s)) return s;
        var lines = s.split('\n');
        var replaced = {};
        MarkdownTableUtils.iterateTableBlocks(s, function (info) {
            if (info.rowKind !== 'header' && info.rowKind !== 'body') return;
            var line = lines[info.lineIndex];
            var cells = MarkdownTableUtils.splitRowCells(line);
            var ci = 0;
            for (ci = 0; ci < cells.length; ci++) {
                cells[ci] = stripDirectiveFromCell(cells[ci]);
            }
            replaced[info.lineIndex] = MarkdownTableUtils.joinRowCells(cells);
        });
        var out = [];
        var li = 0;
        for (li = 0; li < lines.length; li++) {
            out.push(replaced[li] !== undefined ? replaced[li] : lines[li]);
        }
        return out.join('\n');
    }

    function getTableCellElement(table, entry) {
        if (!table || !table.rows || !entry) return null;
        var col = entry.colIndex;
        if (entry.rowKind === 'header') {
            var thead = table.tHead;
            if (thead && thead.rows.length) {
                return thead.rows[0].cells[col] || null;
            }
            return table.rows.length ? table.rows[0].cells[col] || null : null;
        }
        var tbody = table.tBodies;
        if (tbody && tbody.length && tbody[0].rows.length) {
            var br = entry.bodyRowIndex;
            if (br < tbody[0].rows.length) {
                return tbody[0].rows[br].cells[col] || null;
            }
            return null;
        }
        var headerOffset = (table.tHead && table.tHead.rows.length) ? 1 : 0;
        var rowIndex = headerOffset + entry.bodyRowIndex;
        if (rowIndex < table.rows.length) {
            return table.rows[rowIndex].cells[col] || null;
        }
        return null;
    }

    function applyColorMap(rootEl, entries) {
        if (!rootEl || !entries || !entries.length) return;
        var tables = rootEl.querySelectorAll('table');
        var i = 0;
        for (i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var ti = entry.tableIndex;
            if (ti < 0 || ti >= tables.length) continue;
            var cell = getTableCellElement(tables[ti], entry);
            if (cell) {
                applyBackgroundToTableCell(cell, entry.color);
            }
        }
    }

    function applyColorMapFromSource(rootEl, rawMarkdown) {
        if (!rootEl) return;
        var src = rawMarkdown == null ? '' : String(rawMarkdown);
        if (typeof TextWidget !== 'undefined' && TextWidget.expandEscapedNewlines) {
            src = TextWidget.expandEscapedNewlines(src);
        }
        applyColorMap(rootEl, buildColorMap(src));
    }

    var MarkdownCellColor = {
        CELL_TAG_RE: CELL_TAG_RE,
        DATA_ATTR: DATA_ATTR,
        parseDirective: parseDirective,
        formatDirective: formatDirective,
        validateColorSpec: validateColorSpec,
        setCellDirective: setCellDirective,
        removeCellDirective: removeCellDirective,
        buildColorMap: buildColorMap,
        stripDirectivesForRender: stripDirectivesForRender,
        applyColorMap: applyColorMap,
        applyColorMapFromSource: applyColorMapFromSource,
        sourceHasCellDirectives: sourceHasCellDirectives,
        isAllowedDataAttrValue: isAllowedDataAttrValue
    };

    global.MarkdownCellColor = MarkdownCellColor;
})(typeof window !== 'undefined' ? window : this);
