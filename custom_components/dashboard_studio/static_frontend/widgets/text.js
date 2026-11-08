class TextWidget extends BaseWidget {
    static _textMdTypographyExtraByRole() {
        const extra = {
            mdTh: { colorFilled: 'ColFilled' },
            mdCode: { backgroundColor: 'Bg' }
        };
        TextWidget._textMdTypographyRoleDefs().forEach(function (d) {
            if (!extra[d.role]) extra[d.role] = {};
            extra[d.role].blockSpacing = 'BlockSpace';
            extra[d.role].lineHeight = 'LineHeight';
        });
        return extra;
    }

    static get metadata() {
        return {
            label: 'Text',
            shortName: 'Text',
            icon: 'ph-text-t',
            category: 'Text',
            color_dark: 'hsl(300, 80%, 65%)',
            color_light: 'hsl(300, 85%, 35%)',
            version: '2.4.0',
            date: '2026-11-07'
        };
    }

    static get globalSettings() {
        return {
            textMdTextWrap: true,
            textMdLinkTarget: 'markdown',
            textMdAutoFitText: false,
            textMdOverflowScroll: false,
            textMdParaBlockSpace: 8,
            textMdH1BlockSpace: 8,
            textMdH2BlockSpace: 8,
            textMdH3BlockSpace: 8,
            textMdThBlockSpace: 8,
            textMdTdBlockSpace: 0,
            textMdBlockTypographyBlockSpace: 8,
            textMdBlockTypographyLineHeight: 1.35,
            textMdCodeBlockSpace: 8,
            textMdCodeLineHeight: 1.35,
            textMdSyncTableColumnWidths: false,
            textMdEqualTableColumnWidths: false,
            textMdTableColumnWidthPx: 0,
            textMdTableStyle: 'minimal',
            /** 'auto' | 'monday' | 'sunday' | 'saturday' — which columns get weekend highlight for Calendar table styles. */
            textMdCalendarWeekStart: 'auto',
            textMdTableBorderRadius: 5,
            textMdTableCellPadding: 10,
            textMdTableBorderColor: '@border',
            textMdTableBorderOpacity: 100,
            textMdSeparatorColor: '@border',
            textMdSeparatorOpacity: 100,
            textMdTableHeaderBg: '@accentSoft',
            textMdTableHeaderBgOpacity: 100,
            textMdTableHeaderAccentBg: '@accent',
            textMdTableHeaderAccentBgOpacity: 100,
            textMdTableRowBg: '@surfaceAlt',
            textMdTableRowBgOpacity: 40,
            textMdTableRowAltBg: '@surface',
            textMdTableRowAltBgOpacity: 40,
            textMdHrColor: '@border',
            textMdHrOpacity: 100,
            textMdIconColor: '@icon',
            textMdIconOpacity: 100,
            textMdIconWeight: 'regular',
            textMdIconAccentColor: '@iconAccent',
            textMdIconAccentOpacity: 100,
            textMdBlock1Color: '@markerTint1',
            textMdBlock2Color: '@markerTint2',
            textMdBlock3Color: '@markerTint3',
            textMdBlock4Color: '@markerTint4',

            defaultTextContentAnimationOnLiveTopics: false,

            textMdParaFs: 12,
            textMdParaCol: '@textMuted',
            textMdParaAlign: 'left',
            textMdParaCase: 'none',
            textMdParaBold: false,
            textMdParaItalic: false,
            textMdParaOpacity: 100,
            textMdParaOffX: 0,
            textMdParaOffY: 0,

            textMdBlockTypographyFs: 12,
            textMdBlockTypographyCol: '@text',
            textMdBlockTypographyAlign: 'left',
            textMdBlockTypographyCase: 'none',
            textMdBlockTypographyBold: false,
            textMdBlockTypographyItalic: false,
            textMdBlockTypographyOpacity: 100,
            textMdBlockTypographyOffX: 0,
            textMdBlockTypographyOffY: 0,

            textMdCodeFs: 12,
            textMdCodeCol: '@thumb',
            textMdCodeBg: '@accentOff',
            textMdCodeAlign: 'left',
            textMdCodeCase: 'none',
            textMdCodeBold: false,
            textMdCodeItalic: false,
            textMdCodeOpacity: 100,
            textMdCodeOffX: 0,
            textMdCodeOffY: 0,

            textMdH1Fs: 24,
            textMdH1Col: '@text',
            textMdH1Align: 'left',
            textMdH1Case: 'none',
            textMdH1Bold: true,
            textMdH1Italic: false,
            textMdH1Opacity: 100,
            textMdH1OffX: 0,
            textMdH1OffY: 0,

            textMdH2Fs: 18,
            textMdH2Col: '@text',
            textMdH2Align: 'left',
            textMdH2Case: 'none',
            textMdH2Bold: true,
            textMdH2Italic: false,
            textMdH2Opacity: 100,
            textMdH2OffX: 0,
            textMdH2OffY: 0,

            textMdH3Fs: 14,
            textMdH3Col: '@text',
            textMdH3Align: 'left',
            textMdH3Case: 'none',
            textMdH3Bold: true,
            textMdH3Italic: false,
            textMdH3Opacity: 100,
            textMdH3OffX: 0,
            textMdH3OffY: 0,

            textMdThFs: 12,
            textMdThCol: '@accentSoft',
            textMdThAlign: 'table_defined',
            textMdThCase: 'uppercase',
            textMdThBold: true,
            textMdThItalic: false,
            textMdThOpacity: 100,
            textMdThOffX: 0,
            textMdThOffY: 0,
            textMdThColFilled: '@onAccent',

            textMdTdFs: 12,
            textMdTdCol: '@text',
            textMdTdAlign: 'table_defined',
            textMdTdCase: 'none',
            textMdTdBold: false,
            textMdTdItalic: false,
            textMdTdOpacity: 100,
            textMdTdOffX: 0,
            textMdTdOffY: 0
        };
    }

    /**
     * Per-role definitions for Markdown typography (instance + global master panels).
     * Nested save shape: `typography.{role}`; flat/runtime keys: `{prefix}*`.
     */
    static _textMdTypographyRoleDefs() {
        return [
            { prefix: 'textMdPara', title: 'Paragraph', role: 'mdParagraph', globalFs: 'defaultFsLabel', globalCol: 'defaultColLabel' },
            { prefix: 'textMdH1', title: 'Header 1', role: 'mdH1', globalFs: 'defaultFsGeneral', globalCol: 'defaultColVal' },
            { prefix: 'textMdH2', title: 'Header 2', role: 'mdH2', globalFs: 'defaultFsGeneral', globalCol: 'defaultColVal' },
            { prefix: 'textMdH3', title: 'Header 3', role: 'mdH3', globalFs: 'defaultFsLabel', globalCol: 'defaultColVal' },
            { prefix: 'textMdTh', title: 'Table Header', role: 'mdTh', globalFs: 'defaultFsLabel', globalCol: 'defaultColVal' },
            { prefix: 'textMdTd', title: 'Table Text', role: 'mdTableText', globalFs: 'defaultFsLabel', globalCol: 'defaultColVal' },
            { prefix: 'textMdBlockTypography', title: 'Block', role: 'mdBlockTypography', globalFs: 'defaultFsLabel', globalCol: 'defaultColVal' },
            { prefix: 'textMdCode', title: 'Code', role: 'mdCode', globalFs: 'defaultFsLabel', globalCol: 'defaultColVal' }
        ];
    }

    static _makeTextMdTypographyGroup(roleDef, isGlobalMaster) {
        const p = roleDef.prefix;
        const opt = {
            nestedTypography: { root: 'typography', role: roleDef.role },
            opacityDefaultKey: null,
            offXDefaultKey: null,
            offYDefaultKey: null
        };
        if (roleDef.role === 'mdTh') {
            opt.extraFieldsInsert = 'afterColor';
            opt.singleColorCols = 4;
            opt.extraFields = [{
                key: p + 'ColFilled',
                type: 'color',
                label: 'Header text',
                cols: 4,
                defaultKey: 'textMdThColFilled',
                typographyNestedProp: 'colorFilled'
            }];
        } else if (roleDef.role === 'mdCode') {
            opt.extraFieldsInsert = 'afterColor';
            opt.singleColorCols = 4;
            opt.singleColorLabel = 'Text';
            opt.extraFields = [{
                key: p + 'Bg',
                type: 'color',
                label: 'Background',
                cols: 4,
                defaultKey: p + 'Bg',
                typographyNestedProp: 'backgroundColor'
            }];
        } else {
            opt.extraFields = [];
        }
        opt.extraFields.push({
            key: p + 'BlockSpace',
            type: 'number',
            label: 'Vertical Spacing (px)',
            min: -64,
            max: 64,
            cols: 6,
            defaultKey: p + 'BlockSpace',
            typographyNestedProp: 'blockSpacing'
        });
        opt.extraFields.push({
            key: p + 'LineHeight',
            type: 'number',
            label: 'Line Height',
            step: 0.1,
            min: 0.5,
            max: 4,
            cols: 6,
            defaultKey: isGlobalMaster
                ? (roleDef.role === 'mdBlockTypography' ? 'textMdBlockTypographyLineHeight' : 'defaultLabelLineHeight')
                : p + 'LineHeight',
            defaultKeyFallback: isGlobalMaster
                ? null
                : (roleDef.role === 'mdBlockTypography' ? 'textMdBlockTypographyLineHeight' : 'defaultLabelLineHeight'),
            typographyNestedProp: 'lineHeight'
        });
        if (isGlobalMaster) {
            opt.fontDefaultKey = 'fontFamily';
            opt.fontSizeDefaultKey = roleDef.globalFs;
            opt.colorDefaultKey = roleDef.globalCol;
            opt.alignDefaultKey = 'defaultTextAlign';
            if (roleDef.role === 'mdTh') opt.alignDefaultKey = 'textMdThAlign';
            else if (roleDef.role === 'mdTableText') opt.alignDefaultKey = 'textMdTdAlign';
            opt.caseDefaultKey = 'defaultLabelCase';
            opt.boldDefaultKey = 'defaultLabelBold';
            opt.italicDefaultKey = 'defaultLabelItalic';
        } else {
            opt.fontDefaultKey = p + 'Font';
            opt.fontDefaultKeyFallback = 'fontFamily';
            opt.fontSizeDefaultKey = p + 'Fs';
            opt.colorDefaultKey = p + 'Col';
            opt.alignDefaultKey = p + 'Align';
            opt.caseDefaultKey = p + 'Case';
            opt.boldDefaultKey = p + 'Bold';
            opt.italicDefaultKey = p + 'Italic';
            opt.opacityDefaultKey = p + 'Opacity';
            opt.offXDefaultKey = p + 'OffX';
            opt.offYDefaultKey = p + 'OffY';
        }
        const group = BaseWidget.getTypographySchema(p, roleDef.title, opt);
        if (roleDef.role === 'mdTh' || roleDef.role === 'mdTableText') {
            const alignKey = p + 'Align';
            const tblAlignOpts = [
                { value: TextWidget.MD_TABLE_ALIGN_TABLE_DEFINED, text: 'Table-Defined' },
                { value: 'left', text: 'Left' },
                { value: 'center', text: 'Center' },
                { value: 'right', text: 'Right' }
            ];
            for (let fi = 0; fi < group.fields.length; fi++) {
                const f = group.fields[fi];
                if (f && f.key === alignKey) {
                    f.options = tblAlignOpts.slice();
                    break;
                }
            }
        }
        TextWidget._augmentTypographyAlignCaseFields(group, isGlobalMaster);
        return group;
    }

    /**
     * When editing a widget instance, Alignment/Case in typography are only active if Text Settings
     * use Typography mode; otherwise they are disabled (widget-level values overrule).
     */
    static _augmentTypographyAlignCaseFields(group, isGlobalMaster) {
        if (!group || !Array.isArray(group.fields)) return;
        const pushDep = function (field, key) {
            const d = field.dependsOn ? field.dependsOn.slice() : [];
            if (d.indexOf(key) === -1) d.push(key);
            field.dependsOn = d;
        };
        for (let i = 0; i < group.fields.length; i++) {
            const field = group.fields[i];
            if (!field || !field.key) continue;
            if (field.key.slice(-5) === 'Align') {
                const baseLabel = field.label || 'Alignment';
                pushDep(field, 'textAlign');
                field.disableWhen = function (values, ig) {
                    if (ig) return false;
                    return !TextWidget.useTypographyAlign(values);
                };
                field.dynamicLabel = function (values, ig) {
                    const over = !ig && !TextWidget.useTypographyAlign(values);
                    return over ? baseLabel + ' (overruled)' : baseLabel;
                };
            } else if (field.key.slice(-4) === 'Case') {
                const baseLabel = field.label || 'Case';
                pushDep(field, 'labelCase');
                field.disableWhen = function (values, ig) {
                    if (ig) return false;
                    return !TextWidget.useTypographyCase(values);
                };
                field.dynamicLabel = function (values, ig) {
                    const over = !ig && !TextWidget.useTypographyCase(values);
                    return over ? baseLabel + ' (overruled)' : baseLabel;
                };
            }
        }
    }

    static _textMdTypographyGroupsForEditor(isGlobalMaster) {
        return TextWidget._textMdTypographyRoleDefs().map(function (d) {
            return TextWidget._makeTextMdTypographyGroup(d, isGlobalMaster);
        });
    }

    static _tableColumnWidthModeOptions() {
        return [
            { value: TextWidget.TABLE_COLUMN_WIDTH_MODE_AUTO, text: 'Auto (each table natural width)' },
            { value: TextWidget.TABLE_COLUMN_WIDTH_MODE_ALIGN, text: 'Align table columns (same column count)' },
            { value: TextWidget.TABLE_COLUMN_WIDTH_MODE_EQUAL, text: 'Equal Table Column Widths' },
            { value: TextWidget.TABLE_COLUMN_WIDTH_MODE_FIXED, text: 'Fixed Table Column Width' },
            { value: TextWidget.TABLE_COLUMN_WIDTH_MODE_CUSTOM, text: 'Custom Column Width' }
        ];
    }

    static normalizeTableColumnWidthMode(raw) {
        const v = String(raw == null ? '' : raw).trim();
        if (v === TextWidget.TABLE_COLUMN_WIDTH_MODE_AUTO) return v;
        if (v === TextWidget.TABLE_COLUMN_WIDTH_MODE_EQUAL) return v;
        if (v === TextWidget.TABLE_COLUMN_WIDTH_MODE_FIXED) return v;
        if (v === TextWidget.TABLE_COLUMN_WIDTH_MODE_CUSTOM) return v;
        if (v === TextWidget.TABLE_COLUMN_WIDTH_MODE_ALIGN) return v;
        return TextWidget.TABLE_COLUMN_WIDTH_MODE_AUTO;
    }

    static getMaxMarkdownTableColumnCount(rawText) {
        if (typeof MarkdownTableUtils !== 'undefined' && MarkdownTableUtils.getMaxColumnCount) {
            return MarkdownTableUtils.getMaxColumnCount(rawText);
        }
        return 0;
    }

    static _trimMarkdownCell(line) {
        if (typeof MarkdownTableUtils !== 'undefined' && MarkdownTableUtils.trimRow) {
            return MarkdownTableUtils.trimRow(line);
        }
        return '';
    }

    static _countMarkdownTableColumns(line) {
        if (typeof MarkdownTableUtils !== 'undefined' && MarkdownTableUtils.countColumns) {
            return MarkdownTableUtils.countColumns(line);
        }
        return 0;
    }

    static _isMarkdownTableRowLine(line) {
        if (typeof MarkdownTableUtils !== 'undefined' && MarkdownTableUtils.isTableRowLine) {
            return MarkdownTableUtils.isTableRowLine(line);
        }
        return false;
    }

    static _isMarkdownTableHeaderLine(line) {
        if (typeof MarkdownTableUtils !== 'undefined' && MarkdownTableUtils.isHeaderLine) {
            return MarkdownTableUtils.isHeaderLine(line);
        }
        return false;
    }

    static _isMarkdownTableSeparatorLine(line) {
        if (typeof MarkdownTableUtils !== 'undefined' && MarkdownTableUtils.isSeparatorLine) {
            return MarkdownTableUtils.isSeparatorLine(line);
        }
        return false;
    }

    static _applyCellBackgroundFromSource(rootEl, rawMarkdown) {
        if (typeof MarkdownCellColor !== 'undefined' && MarkdownCellColor.applyColorMapFromSource) {
            MarkdownCellColor.applyColorMapFromSource(rootEl, rawMarkdown);
        }
    }

    /**
     * Fingerprint of markdown that affects rendered HTML (cell `[cell …]` prefixes stripped).
     * Used to distinguish cell-color-only edits from body edits when sanitized HTML is unchanged.
     */
    static _buildRenderableBodySignature(widget, c) {
        var raw = '';
        if (widget && typeof widget._getMarkdownTemplateSource === 'function') {
            raw = widget._getMarkdownTemplateSource(c);
        } else if (c && c.text !== undefined && c.text !== null) {
            raw = String(c.text);
        }
        raw = TextWidget.expandEscapedNewlines(raw);
        if (typeof MarkdownCellColor !== 'undefined' && MarkdownCellColor.stripDirectivesForRender) {
            raw = MarkdownCellColor.stripDirectivesForRender(raw);
        }
        var paths = TextWidget.collectMarkdownDataTopicPaths(raw);
        if (!paths.length) return raw;
        var parts = [raw];
        var i = 0;
        for (i = 0; i < paths.length; i++) {
            var resolved = widget && typeof widget._resolveMarkdownDataPath === 'function'
                ? widget._resolveMarkdownDataPath(paths[i])
                : '';
            parts.push(paths[i]);
            parts.push(resolved === undefined || resolved === null ? '' : String(resolved));
        }
        return parts.join('\x01');
    }

    static _coerceCustomColumnWidths(raw) {
        const arr = [];
        if (!Array.isArray(raw)) return arr;
        for (let i = 0; i < raw.length; i++) {
            const v = parseInt(String(raw[i]), 10);
            arr.push(isNaN(v) || v < 0 ? 0 : v);
        }
        return arr;
    }

    static _coerceNonNegativeInt(raw, max) {
        const n = parseInt(String(raw == null ? '' : raw), 10);
        if (isNaN(n) || n < 0) return 0;
        const cap = (typeof max === 'number' && max >= 0) ? max : 40;
        if (n > cap) return cap;
        return n;
    }

    /** The text widget whose inspector is open, or null outside that edit session. */
    static _selectedTextWidget() {
        if (typeof Dashboard === 'undefined' || !Dashboard.isEditMode || !Dashboard.widgets) return null;
        if (typeof Editor === 'undefined' || !Editor || !Editor.currentId) return null;
        if (Editor.currentId === 'MULTIPLE' || Editor.currentId === 'GLOBAL_SETTINGS') return null;
        var w = Dashboard.widgets[Editor.currentId];
        if (!w || w.constructor !== TextWidget) return null;
        return w;
    }

    /**
     * Column count for the custom-width editors.
     * A table written in Text Content wins. Otherwise the selected widget's current
     * topic value (and inline {{topic}} text) is counted. Amount of Columns is the fallback.
     */
    static customColumnEditorCount(values) {
        if (!values) return 0;
        const mode = TextWidget.normalizeTableColumnWidthMode(values.mdTableColumnWidthMode);
        if (mode !== TextWidget.TABLE_COLUMN_WIDTH_MODE_CUSTOM) return 0;
        const detected = TextWidget.detectedMarkdownTableColumnCount(values);
        if (detected > 0) return detected;
        return TextWidget._coerceNonNegativeInt(values.mdTableCustomColumnCount);
    }

    /**
     * Tables in saved Text Content, else the live markdown for the selected widget.
     * Live lookup runs only while that widget's inspector is open.
     */
    static detectedMarkdownTableColumnCount(values) {
        var staticText = values && values.text != null ? String(values.text) : '';
        var staticCount = TextWidget.getMaxMarkdownTableColumnCount(staticText);
        if (staticCount > 0) return staticCount;
        var w = TextWidget._selectedTextWidget();
        if (!w || typeof w.liveMarkdownTableColumnCount !== 'function') return 0;
        return w.liveMarkdownTableColumnCount(staticText);
    }

    /** True when Custom Column Width has no table yet, so Amount of Columns is shown. */
    static customColumnAmountVisible(values) {
        if (!values) return false;
        const mode = TextWidget.normalizeTableColumnWidthMode(values.mdTableColumnWidthMode);
        if (mode !== TextWidget.TABLE_COLUMN_WIDTH_MODE_CUSTOM) return false;
        return TextWidget.detectedMarkdownTableColumnCount(values) <= 0;
    }

    static _buildCustomColumnWidthItems(values) {
        const count = TextWidget.customColumnEditorCount(values);
        if (count <= 0) return [];
        const rawColumns = values.mdTableCustomColumnWidths && values.mdTableCustomColumnWidths.columns;
        const cols = TextWidget._coerceCustomColumnWidths(rawColumns);
        const out = [];
        for (let i = 0; i < count; i++) {
            out.push({
                key: 'col_' + i,
                label: 'Column ' + (i + 1),
                value: cols[i] != null ? cols[i] : 0,
                min: 0
            });
        }
        return out;
    }

    static get basicSettingKeys() {
        return ['text', 'mdTableStyle'];
    }

    static get globalSchema() {
        const tableStyleOpts = TextWidget._mdTableStyleOptions();
        return [
            { type: 'heading', label: 'Layout & Markdown', cols: 12 },
            {
                key: 'textMdLinkTarget',
                type: 'select',
                label: 'Link Open Behavior',
                cols: 12,
                default: 'markdown',
                defaultKey: 'textMdLinkTarget',
                options: [
                    { value: 'markdown', text: 'Use Markdown Setting (per link)' },
                    { value: 'new', text: 'Always Open in New Tab' },
                    { value: 'current', text: 'Always Open in Same Tab' }
                ]
            },
            {
                key: 'textMdTextWrap',
                type: 'checkbox',
                label: 'Wrap Text',
                cols: 12
            },
            {
                key: 'textMdAutoFitText',
                type: 'checkbox',
                label: 'Auto-Fit Text to Frame',
                cols: 6,
                dependsOn: ['textMdOverflowScroll'],
                visibleWhen: function (values) {
                    return !values || values.textMdOverflowScroll !== true;
                }
            },
            {
                key: 'textMdOverflowScroll',
                type: 'checkbox',
                label: 'Scroll Overflow Content',
                cols: 6,
                dependsOn: ['textMdAutoFitText'],
                visibleWhen: function (values) {
                    return !values || values.textMdAutoFitText !== true;
                }
            },

            { type: 'heading', label: 'Markdown', cols: 12 },
            { key: 'textMdTableStyle', type: 'select', label: 'Table Style', cols: 12, options: tableStyleOpts },
            {
                key: 'textMdCalendarWeekStart',
                type: 'select',
                label: 'Region (first day of week)',
                cols: 12,
                defaultKey: 'textMdCalendarWeekStart',
                options: [
                    { value: 'auto', text: 'Auto (from Dashboard)' },
                    { value: 'monday', text: 'Europe (Monday)' },
                    { value: 'sunday', text: 'Americas / Japan (Sunday)' },
                    { value: 'saturday', text: 'Middle East (Saturday)' }
                ],
                dependsOn: ['textMdTableStyle', 'mdTableStyle'],
                visibleWhen: function (values) {
                    if (!values) return false;
                    const k = String(
                        (values.mdTableStyle != null && String(values.mdTableStyle) !== '') ? values.mdTableStyle
                            : (values.textMdTableStyle != null ? values.textMdTableStyle : '')
                    );
                    return k === 'calendar' || k === 'week_planner' || k === 'month_view';
                }
            },
            { key: 'textMdSyncTableColumnWidths', type: 'checkbox', label: 'Align table columns (same column count)', cols: 6 },
            { key: 'textMdEqualTableColumnWidths', type: 'checkbox', label: 'Equal Table Column Widths', cols: 6 },
            { key: 'textMdTableColumnWidthPx', type: 'number', label: 'Table Fixed Column Width (px, 0 = Auto)', min: 0, cols: 12 },
            { key: 'textMdTableBorderRadius', type: 'number', label: 'Table Border Radius (px)', min: 0, max: 64, cols: 6 },
            { key: 'textMdTableCellPadding', type: 'number', label: 'Table Cell Padding (px)', min: 0, max: 64, cols: 6 },
            {
                key: 'textMdIconWeight',
                type: 'select',
                label: 'Markdown Icon Style',
                cols: 12,
                options: [
                    { value: 'thin', text: 'Thin' },
                    { value: 'light', text: 'Light' },
                    { value: 'regular', text: 'Regular' },
                    { value: 'bold', text: 'Bold' },
                    { value: 'fill', text: 'Fill' },
                    { value: 'duotone', text: 'Duotone' }
                ]
            },
            { key: 'textMdIconColor', type: 'color', label: 'Markdown Icon', cols: 6 },
            { key: 'textMdIconOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6 },
            { key: 'textMdIconAccentColor', type: 'color', label: 'Markdown Icon Accent Color', cols: 6 },
            { key: 'textMdIconAccentOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6 },
            { key: 'textMdTableBorderColor', type: 'color', label: 'Table Border', cols: 6 },
            { key: 'textMdTableBorderOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6 },
            { key: 'textMdSeparatorColor', type: 'color', label: 'Separator Line', cols: 6 },
            { key: 'textMdSeparatorOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6 },
            { key: 'textMdTableHeaderBg', type: 'color', label: 'Table Header Background', cols: 6 },
            { key: 'textMdTableHeaderBgOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6 },
            { key: 'textMdTableHeaderAccentBg', type: 'color', label: 'Table Header Background Accent', cols: 6 },
            { key: 'textMdTableHeaderAccentBgOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6 },
            { key: 'textMdTableRowBg', type: 'color', label: 'Table Row Background', cols: 6 },
            { key: 'textMdTableRowBgOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6 },
            { key: 'textMdTableRowAltBg', type: 'color', label: 'Table Alternate Row', cols: 6 },
            { key: 'textMdTableRowAltBgOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6 },
            { key: 'textMdHrColor', type: 'color', label: 'Horizontal Rule', cols: 6 },
            { key: 'textMdHrOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6 },
            { key: 'textMdBlock1Color', type: 'color', label: 'Block 1 Color', cols: 6 },
            { key: 'textMdBlock2Color', type: 'color', label: 'Block 2 Color', cols: 6 },
            { key: 'textMdBlock3Color', type: 'color', label: 'Block 3 Color', cols: 6 },
            { key: 'textMdBlock4Color', type: 'color', label: 'Block 4 Color', cols: 6 },

            { type: 'heading', label: 'Animations & Effects', cols: 12 },
            {
                key: 'defaultTextContentAnimationOnLiveTopics',
                type: 'checkbox',
                label: 'Animate When Inline Topics Change',
                cols: 12,
                hint: 'Default for new text widgets: replay the transition when inline {{topic}} placeholders in the markdown update. Separate from binding the whole Text Content field to a topic.'
            },

            { type: 'heading', label: 'Typography', cols: 12 }
        ].concat(TextWidget._textMdTypographyGroupsForEditor(true));
    }

    /** True when per-role horizontal alignment from typography is used (not widget-level Left/Center/Right). */
    static useTypographyAlign(c) {
        const a = c && c.textAlign;
        if (a === 'left' || a === 'center' || a === 'right') return false;
        return true;
    }

    /** True when table cell typography should not set `text-align` (markdown column rules apply). */
    static textMdAlignUsesTableMarkdown(alignVal) {
        const v = alignVal == null ? '' : String(alignVal).trim();
        return v === TextWidget.MD_TABLE_ALIGN_TABLE_DEFINED;
    }

    /**
     * When this signature changes, table `td`/`th` may need a fresh parse: typography or widget horizontal
     * alignment applies inline `text-align`, which overwrites GFM ` :---: ` styles on the same element.
     */
    static _tableCellHorizontalAlignModesSig(c) {
        const useTypo = TextWidget.useTypographyAlign(c) ? '1' : '0';
        const ta = c && c.textAlign !== undefined && c.textAlign !== null ? String(c.textAlign) : '';
        const tdA = c && c.textMdTdAlign !== undefined && c.textMdTdAlign !== null ? String(c.textMdTdAlign) : '';
        const thA = c && c.textMdThAlign !== undefined && c.textMdThAlign !== null ? String(c.textMdThAlign) : '';
        return useTypo + '\x01' + ta + '\x01' + tdA + '\x01' + thA;
    }

    /** True when per-role case from typography is used (not widget-level case). */
    static useTypographyCase(c) {
        const l = c && c.labelCase;
        if (l === 'uppercase' || l === 'capitalize' || l === 'lowercase' || l === 'none') return false;
        return true;
    }

    static _ensurePurifyClassHook() {
        if (TextWidget._purifyHookInstalled) return;
        if (typeof window === 'undefined' || !window.DOMPurify || typeof window.DOMPurify.addHook !== 'function') return;
        TextWidget._purifyHookInstalled = true;
        const mdTdThTextAlignOnlyRe = /^\s*text-align\s*:\s*(left|right|center)\s*;?\s*$/;
        const mdBlockDivClassRe = /^text-md-block\s+text-md-block-[1-4]$/;
        const mdImgSizedClassRe = /^text-md-img-sized$/;
        const mdImgPreprocessedClassRe = /^text-md-img-preprocessed$/;
        window.DOMPurify.addHook('uponSanitizeAttribute', function (node, data) {
            if (!data) return;
            const attrName = data.attrName;
            const tag = node && node.nodeName ? String(node.nodeName).toLowerCase() : '';
            if (attrName === 'class' && tag === 'i') return;
            if (attrName === 'class' && tag === 'img') {
                const cv = data.attrValue == null ? '' : String(data.attrValue).trim().replace(/\s+/g, ' ');
                if (mdImgSizedClassRe.test(cv) || mdImgPreprocessedClassRe.test(cv)) return;
                data.keepAttr = false;
                return;
            }
            if (attrName === 'style' && tag === 'i') {
                const cv = data.attrValue == null ? '' : String(data.attrValue);
                if (TextWidget._markdownPurifyAllowIconStyle(cv)) return;
                data.keepAttr = false;
                return;
            }
            if (attrName === 'class' && tag === 'span') {
                const cv = data.attrValue == null ? '' : String(data.attrValue).trim();
                if (cv === 'ds-formula-countdown') return;
                data.keepAttr = false;
                return;
            }
            if (attrName === 'class' && tag === 'div') {
                const cv = data.attrValue == null ? '' : String(data.attrValue).trim().replace(/\s+/g, ' ');
                if (mdBlockDivClassRe.test(cv)) return;
                data.keepAttr = false;
                return;
            }
            if (attrName === 'style' && (tag === 'td' || tag === 'th')) {
                const v = data.attrValue == null ? '' : String(data.attrValue);
                if (mdTdThTextAlignOnlyRe.test(v)) return;
                data.keepAttr = false;
                return;
            }
            if (attrName === 'class' || attrName === 'style') {
                data.keepAttr = false;
            }
        });
    }

    /** Harden <a target="_blank"> after sanitize (global hook, once). */
    static _ensurePurifyAnchorHook() {
        if (TextWidget._purifyAnchorHookInstalled) return;
        if (typeof window === 'undefined' || !window.DOMPurify || typeof window.DOMPurify.addHook !== 'function') return;
        TextWidget._purifyAnchorHookInstalled = true;
        window.DOMPurify.addHook('uponSanitizeAttribute', function (node, data) {
            if (!data || data.attrName !== 'href' || data.attrValue == null) return;
            const href = String(data.attrValue);
            if (/^help:\/\//i.test(href) || href.charAt(0) === '#') {
                data.forceKeepAttr = true;
            }
        });
        window.DOMPurify.addHook('afterSanitizeAttributes', function (node) {
            if (!node || !node.tagName) return;
            if (String(node.tagName).toLowerCase() !== 'a') return;
            const tgt = node.getAttribute('target');
            if (tgt && String(tgt).toLowerCase() === '_blank') {
                node.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    static _getMarkdownIt() {
        if (TextWidget._mdInstance) return TextWidget._mdInstance;
        const Md = typeof window !== 'undefined' ? window.markdownit : null;
        if (typeof Md !== 'function') return null;
        const md = Md({ html: true, linkify: false, breaks: true });
        TextWidget._installMarkdownNewTabRenderer(md);
        TextWidget._mdInstance = md;
        return TextWidget._mdInstance;
    }

    /**
     * Matching `[` for the `]` that immediately precedes `](` in an inline link (label may contain nested brackets).
     */
    static _findMarkdownLinkLabelOpenBracket(s, closeBracketIdx) {
        if (s == null || closeBracketIdx < 1) return -1;
        var depth = 0;
        var i = closeBracketIdx - 1;
        while (i >= 0) {
            var c = s.charAt(i);
            if (c === '\\' && i > 0) {
                i -= 2;
                continue;
            }
            if (c === ']') {
                depth++;
            } else if (c === '[') {
                if (depth === 0) return i;
                depth--;
            }
            i--;
        }
        return -1;
    }

    /**
     * Closing `)` for `](destination...)` respecting nested parens and quoted optional titles.
     */
    static _findMarkdownInlineLinkCloseParen(s, destStart) {
        if (s == null || destStart < 0) return -1;
        var depth = 0;
        var inQuote = '';
        var i = destStart;
        while (i < s.length) {
            var c = s.charAt(i);
            var next = i + 1 < s.length ? s.charAt(i + 1) : '';
            if (!inQuote && c === '\\' && next && (next === '"' || next === "'" || next === '(' || next === ')')) {
                i += 2;
                continue;
            }
            if (inQuote) {
                if (c === '\\') {
                    i += 2;
                    continue;
                }
                if (c === inQuote) {
                    inQuote = '';
                }
                i++;
                continue;
            }
            if (c === '"') {
                inQuote = '"';
                i++;
                continue;
            }
            if (c === "'") {
                inQuote = "'";
                i++;
                continue;
            }
            if (c === '(') {
                depth++;
            } else if (c === ')') {
                if (depth === 0) return i;
                depth--;
            }
            i++;
        }
        return -1;
    }

    /** ZWNJ marks “open in new tab” — stripped in {@link #_installMarkdownNewTabRenderer}. */
    static _markdownNewTabHrefSentinel() {
        return '\u200c';
    }

    /**
     * `[label](url ^)` → `[label](url` + sentinel + `)` so the link opens in a new tab (caret may be spaced as in the UI spec).
     */
    static _preprocessMarkdownNewTabLinks(src) {
        if (src === undefined || src === null) return '';
        var ZWNJ = TextWidget._markdownNewTabHrefSentinel();
        var s = String(src);
        var pos = 0;
        var out = '';
        while (pos < s.length) {
            var linkCloseBracket = s.indexOf('](', pos);
            if (linkCloseBracket < 0) {
                out += s.slice(pos);
                break;
            }
            var labelOpen = TextWidget._findMarkdownLinkLabelOpenBracket(s, linkCloseBracket);
            if (labelOpen < 0) {
                out += s.slice(pos, linkCloseBracket + 2);
                pos = linkCloseBracket + 2;
                continue;
            }
            var isImage = labelOpen > 0 && s.charAt(labelOpen - 1) === '!';
            if (isImage) {
                out += s.slice(pos, linkCloseBracket + 2);
                pos = linkCloseBracket + 2;
                continue;
            }
            var destStart = linkCloseBracket + 2;
            var destClose = TextWidget._findMarkdownInlineLinkCloseParen(s, destStart);
            if (destClose < 0) {
                out += s.slice(pos, linkCloseBracket + 2);
                pos = linkCloseBracket + 2;
                continue;
            }
            var rawDest = s.slice(destStart, destClose);
            var tail = rawDest.match(/\s*\^[\s\u00a0]*$/);
            if (!tail) {
                out += s.slice(pos, destClose + 1);
                pos = destClose + 1;
                continue;
            }
            var destCore = rawDest.slice(0, rawDest.length - tail[0].length).replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, '');
            if (!destCore.length) {
                out += s.slice(pos, destClose + 1);
                pos = destClose + 1;
                continue;
            }
            var labelPart = s.slice(labelOpen, linkCloseBracket + 1);
            // Bare domain URLs (scheme://host with no path) would Punycode-encode the
            // ZWNJ into the hostname. A trailing slash moves it to the path component
            // where it is safely percent-encoded and detectable by the renderer.
            if (/^https?:\/\/[^\/?#]+$/i.test(destCore)) destCore += '/';
            var rebuilt = labelPart + '(' + destCore + ZWNJ + ')';
            out += s.slice(pos, labelOpen) + rebuilt;
            pos = destClose + 1;
        }
        return out;
    }

    static _installMarkdownNewTabRenderer(md) {
        if (TextWidget._mdNewTabRendererInstalled) return;
        if (!md || typeof md.renderer !== 'object' || !md.renderer.rules) return;
        TextWidget._mdNewTabRendererInstalled = true;
        var defaultLinkOpen = md.renderer.rules.link_open;
        if (!defaultLinkOpen) {
            defaultLinkOpen = function (tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options);
            };
        }
        md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
            var tok = tokens[idx];
            if (tok && typeof tok.attrGet === 'function' && typeof tok.attrSet === 'function') {
                var raw = tok.attrGet('href');
                if (raw != null && raw !== '') {
                    var dec = raw;
                    try {
                        dec = decodeURIComponent(String(raw));
                    } catch (err) {
                        dec = String(raw);
                    }
                    var strip = false;
                    var nextHref = dec;
                    if (dec.length && dec.charCodeAt(dec.length - 1) === 0x200c) {
                        strip = true;
                        nextHref = dec.slice(0, -1);
                    } else {
                        var low = String(raw).toLowerCase();
                        var suf = '%e2%80%8c';
                        if (low.length >= suf.length && low.slice(low.length - suf.length) === suf) {
                            strip = true;
                            var clipped = String(raw).slice(0, String(raw).length - 9);
                            try {
                                nextHref = decodeURIComponent(clipped);
                            } catch (err2) {
                                nextHref = clipped;
                            }
                        }
                    }
                    if (strip) {
                        tok.attrSet('href', nextHref);
                        tok.attrSet('target', '_blank');
                    }
                }
            }
            return defaultLinkOpen(tokens, idx, options, env, self);
        };
    }

    /** Cap inline payload formulas per markdown template (extra formula tokens insert `-`). */
    static get MARKDOWN_FORMULA_TOKEN_CAP() {
        return 256;
    }

    /** Fresh global RegExp for non-nested `{{ ... }}` tokens (fallback when FormulaEngine is unavailable). */
    static _markdownDataTokenGlobalRe() {
        return new RegExp('\\{\\{\\s*([^\\{\\}]+?)\\s*\\}\\}', 'g');
    }

    static _markdownLooksLikeFormula(inner) {
        if (typeof FormulaEngine !== 'undefined' && typeof FormulaEngine.looksLikeFormula === 'function') {
            return FormulaEngine.looksLikeFormula(inner);
        }
        return false;
    }

    static _scanMarkdownBraceTokens(src) {
        if (typeof FormulaEngine !== 'undefined' && typeof FormulaEngine.scanDoubleBraceTokens === 'function') {
            return FormulaEngine.scanDoubleBraceTokens(src);
        }
        const out = [];
        if (src === undefined || src === null) return out;
        const re = TextWidget._markdownDataTokenGlobalRe();
        const s = String(src);
        let m;
        while ((m = re.exec(s)) !== null) {
            out.push({
                start: m.index,
                end: m.index + m[0].length,
                inner: String(m[1])
            });
        }
        return out;
    }

    static collectMarkdownDataTopicPaths(src) {
        const out = [];
        const seen = {};
        const walk = function (text) {
            if (text === undefined || text === null) return;
            const tokens = TextWidget._scanMarkdownBraceTokens(text);
            let i;
            for (i = 0; i < tokens.length; i++) {
                const inner = String(tokens[i].inner || '').trim();
                if (!inner) continue;
                if (TextWidget._markdownLooksLikeFormula(inner)) {
                    walk(inner);
                } else if (!seen[inner]) {
                    seen[inner] = true;
                    out.push(inner);
                }
            }
        };
        walk(src);
        return out;
    }

    static markdownTextReferencesTopicPath(src, topic) {
        if (topic == null || topic === '') return false;
        const paths = TextWidget.collectMarkdownDataTopicPaths(src);
        for (let i = 0; i < paths.length; i++) {
            if (paths[i] === topic) return true;
        }
        return false;
    }

    /**
     * Resolve a `{{path}}` segment. A live topic with that id wins, so a widget
     * setting that happens to share the name cannot blank the markdown body.
     * Otherwise treat it as a widget key via resolveValue. Missing topics fail
     * (caller maps that to `-` for display).
     */
    _tryResolveMarkdownDataPath(topicPath) {
        if (typeof Dashboard !== 'undefined' && Dashboard.liveData
                && Object.prototype.hasOwnProperty.call(Dashboard.liveData, topicPath)) {
            return { v: this._finalizeBindingValue(topicPath, Dashboard.liveData[topicPath]) };
        }
        const primary = this.resolveValue(topicPath, undefined);
        if (primary !== undefined && primary !== null) {
            return { v: primary };
        }
        if (typeof topicPath === 'string' && topicPath.indexOf('local/') === 0) {
            return { v: '0s' };
        }
        return { failed: true };
    }

    _resolveMarkdownDataPath(topicPath) {
        const hit = this._tryResolveMarkdownDataPath(topicPath);
        if (!hit || hit.failed || hit.v === undefined) return '-';
        return BaseWidget.displayText(hit.v);
    }

    /**
     * All markdown template strings that may contain `{{topic}}` tokens for this widget
     * (bound live payload, static override, and optional resolved config text).
     */
    _markdownTemplateSources(c) {
        var out = [];
        var seen = {};
        var push = function (raw) {
            if (raw === undefined || raw === null) return;
            var s = String(raw);
            if (!s || seen[s]) return;
            seen[s] = true;
            out.push(s);
        };
        if (c && c.text !== undefined && c.text !== null && String(c.text) !== '') {
            push(c.text);
        }
        var boundKey = this.bindings && typeof this.bindings.text === 'string' ? this.bindings.text : '';
        if (boundKey && typeof Dashboard !== 'undefined' && Dashboard.liveData) {
            push(Dashboard.liveData[boundKey]);
        }
        if (this.overrides && this.overrides.text !== undefined && this.overrides.text !== null) {
            push(this.overrides.text);
        }
        return out;
    }

    /**
     * Primary markdown template for signatures and inline-topic detection.
     * Bound Text Content uses resolved `c.text` so Binding Options formulas apply
     * before markdown `{{topic}}` / payload-formula interpolation.
     */
    _getMarkdownTemplateSource(c) {
        var boundKey = this.bindings && typeof this.bindings.text === 'string' ? this.bindings.text : '';
        if (boundKey && c && c.text !== undefined && c.text !== null) {
            return String(c.text);
        }
        if (boundKey && typeof Dashboard !== 'undefined' && Dashboard.liveData) {
            var liveRaw = Dashboard.liveData[boundKey];
            if (liveRaw !== undefined && liveRaw !== null) return String(liveRaw);
        }
        if (c && c.text !== undefined && c.text !== null && String(c.text) !== '') return String(c.text);
        if (this.overrides && this.overrides.text !== undefined && this.overrides.text !== null) {
            return String(this.overrides.text);
        }
        return '';
    }

    /**
     * Bound text topic, if this widget's markdown body arrives as a live payload.
     * Empty when Text Content is only the saved override.
     */
    _boundTextTopic() {
        var b = this.bindings;
        return (b && typeof b.text === 'string' && b.text !== '') ? b.text : '';
    }

    /** True when a formula or map can rewrite the bound text into a different markdown string. */
    _textBindingHasRewrite() {
        var o = this.overrides || {};
        var master = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS) ? MASTER_SETTINGS : null;
        var pick = function (key) {
            if (o[key] !== undefined && o[key] !== null && o[key] !== '') return o[key];
            if (master && master[key] !== undefined && master[key] !== null && master[key] !== '') return master[key];
            return '';
        };
        var formula = pick('text_bind_formula');
        var mode = pick('text_bind_transformMode');
        var mapTrue = pick('text_bind_mapTrue');
        var mapFalse = pick('text_bind_mapFalse');
        if (typeof formula === 'string' && formula.trim() !== '') return true;
        if (typeof mode === 'string' && mode.trim() !== '') return true;
        if (typeof mapTrue === 'string' && mapTrue.indexOf('{{') >= 0) return true;
        if (typeof mapFalse === 'string' && mapFalse.indexOf('{{') >= 0) return true;
        return false;
    }

    /**
     * Markdown string `payload` would display as Text Content, without `get config`.
     * Plain strings are returned as-is. A formula or map is applied only when one is set.
     */
    _templateStringForPayload(payload) {
        if (payload === undefined || payload === null) return '';
        var value = payload;
        if (this._textBindingHasRewrite()) {
            try {
                value = this._finalizeBindingValue('text', payload);
            } catch (eRewrite) {
                value = payload;
            }
        }
        if (value === undefined || value === null) return '';
        if (typeof value === 'string') return value;
        return BaseWidget.displayText(value);
    }

    /** `{{topic}}` paths inside one candidate Text Content payload. No `get config`. */
    _markdownTopicPathsForPayload(payload) {
        var template = this._templateStringForPayload(payload);
        if (!template || template.indexOf('{{') < 0) return [];
        return TextWidget.collectMarkdownDataTopicPaths(template);
    }

    /** Stable signature of those paths, used to see if the topic index must be rebuilt. */
    markdownTopicSignatureForPayload(payload) {
        var paths = this._markdownTopicPathsForPayload(payload);
        if (!paths.length) return '';
        return paths.join('\n');
    }

    /** True when `topic` is the binding that supplies this widget's live markdown body. */
    liveMarkdownTopicsDependOn(topic) {
        var bound = this._boundTextTopic();
        if (!bound) return false;
        if (bound === topic) return true;
        var alt = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function')
            ? HomeyTopicAlias.aliasOf(bound)
            : null;
        return alt !== null && alt === topic;
    }

    /**
     * Topics referenced by the current live markdown body. Saved override tokens are
     * already in getStaticTopicInterests. Called while the topic index is built.
     */
    collectLiveMarkdownTopicPaths() {
        var bound = this._boundTextTopic();
        if (!bound || typeof Dashboard === 'undefined' || !Dashboard.liveData) return [];
        var payload;
        if (Object.prototype.hasOwnProperty.call(Dashboard.liveData, bound)) {
            payload = Dashboard.liveData[bound];
        } else if (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function') {
            var alt = HomeyTopicAlias.aliasOf(bound);
            if (alt && Object.prototype.hasOwnProperty.call(Dashboard.liveData, alt)) {
                payload = Dashboard.liveData[alt];
            }
        }
        if (payload === undefined) return [];
        return this._markdownTopicPathsForPayload(payload);
    }

    /** True when any known markdown template for this widget references `{{topic}}`. */
    _markdownTemplateReferencesTopic(topic) {
        if (topic == null || topic === '') return false;
        var paths = this.collectLiveMarkdownTopicPaths();
        var alt = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function')
            ? HomeyTopicAlias.aliasOf(topic)
            : null;
        var i;
        for (i = 0; i < paths.length; i++) {
            if (paths[i] === topic || (alt && paths[i] === alt)) return true;
        }
        if (this.overrides && this.overrides.text != null) {
            if (TextWidget.markdownTextReferencesTopicPath(this.overrides.text, topic)) return true;
            if (alt && TextWidget.markdownTextReferencesTopicPath(this.overrides.text, alt)) return true;
        }
        return false;
    }

    /** True when the active markdown template includes inline `{{topic}}` or payload-formula tokens. */
    _markdownTemplateHasInlineTopics(c) {
        var template = this._getMarkdownTemplateSource(c);
        if (!template) return false;
        if (String(template).indexOf('{{') < 0) return false;
        return TextWidget._scanMarkdownBraceTokens(template).length > 0;
    }

    /**
     * Used by BindingsTree.widgetWantsTopic so inbound MQTT updates re-render this widget when `{{topic}}`
     * without a formal binding row for that key.
     */
    usesMarkdownDataTopic(topic) {
        return this._markdownTemplateReferencesTopic(topic);
    }

    /** Static markdown template tokens (overrides.text) join the topic index. */
    _collectExtraTopicInterests(topics) {
        if (this.overrides && this.overrides.text !== undefined && this.overrides.text !== null) {
            TextWidget.collectMarkdownDataTopicPaths(this.overrides.text).forEach((p) => topics.add(p));
        }
    }

    /**
     * Live `{{topic}}` tokens are written into the dashboard topic index when the bound
     * text payload changes (see collectLiveMarkdownTopicPaths). Matching a topic must not
     * call `get config`, so a text binding alone is not a dynamic interest.
     */
    hasDynamicTopicInterests() {
        return false;
    }

    /**
     * Replace `{{topic/path}}` tokens using `resolveFn(topicPath)`.
     * Payload formulas are not evaluated here (instance `_resolveMarkdownDynamicPlaceholders` handles those).
     * If `escapeInserted` is true, each replacement is passed through `_escapePlainText` before markdown-it
     * (so resolved values cannot become HTML). If false, inserts raw strings — use only when the whole
     * `src` is escaped once afterward (e.g. markdown-it unavailable).
     */
    static _preprocessMarkdownDynamicPlaceholders(src, resolveFn, escapeInserted) {
        if (src === undefined || src === null) return '';
        if (typeof resolveFn !== 'function') return String(src);
        const esc = escapeInserted === true;
        const raw = String(src);
        const tokens = TextWidget._scanMarkdownBraceTokens(raw);
        if (!tokens.length) return raw;
        let out = '';
        let last = 0;
        let i;
        for (i = 0; i < tokens.length; i++) {
            const tok = tokens[i];
            out += raw.slice(last, tok.start);
            const inner = String(tok.inner || '').trim();
            let resolved;
            if (!inner || TextWidget._markdownLooksLikeFormula(inner)) {
                resolved = inner ? '-' : '';
            } else {
                resolved = resolveFn(inner);
            }
            if (resolved === undefined || resolved === null) resolved = '-';
            if (typeof resolved === 'string') resolved = TextWidget.expandEscapedNewlines(resolved);
            else resolved = String(resolved);
            out += esc ? TextWidget._escapePlainText(resolved) : resolved;
            last = tok.end;
        }
        out += raw.slice(last);
        return out;
    }

    static _isTokenInsideMarkdownDirectiveParam(raw, tokStart) {
        const lineStart = raw.lastIndexOf('\n', tokStart - 1) + 1;
        const prefix = raw.slice(lineStart, tokStart);
        const lastOpenBr = prefix.lastIndexOf('[');
        const lastCloseBr = prefix.lastIndexOf(']');
        if (lastOpenBr > lastCloseBr) {
            const bracketPrefix = prefix.slice(lastOpenBr);
            if (/^\[cell\b/i.test(bracketPrefix)) return true;
            if (/^\[(?:color|blink)\s*:[^:]*$/i.test(bracketPrefix)) return true;
            if (lastOpenBr > 0 && prefix.charAt(lastOpenBr - 1) === '!') return true;
        }
        const lastPh = prefix.lastIndexOf(':ph(');
        if (lastPh >= 0 && prefix.indexOf('):', lastPh) < 0) return true;
        return false;
    }

    _getMarkdownPlaceholderPlan(src) {
        const raw = src === undefined || src === null ? '' : String(src);
        if (this._mdPlaceholderPlan && this._mdPlaceholderPlan.src === raw) {
            return this._mdPlaceholderPlan;
        }
        const scanned = raw.indexOf('{{') < 0 ? [] : TextWidget._scanMarkdownBraceTokens(raw);
        const tokens = [];
        let formulaCount = 0;
        const cap = TextWidget.MARKDOWN_FORMULA_TOKEN_CAP;
        let i;
        for (i = 0; i < scanned.length; i++) {
            const inner = String(scanned[i].inner || '').trim();
            if (TextWidget._markdownLooksLikeFormula(inner)) {
                formulaCount += 1;
                const hasCd = (typeof FormulaEngine !== 'undefined' && typeof FormulaEngine.hasCountdown === 'function')
                    ? FormulaEngine.hasCountdown(inner)
                    : false;
                tokens.push({
                    kind: 'formula',
                    start: scanned[i].start,
                    end: scanned[i].end,
                    inner: inner,
                    overCap: formulaCount > cap,
                    hasCountdown: hasCd,
                    countdownId: 'cd_' + i,
                    inDirectiveParam: hasCd ? TextWidget._isTokenInsideMarkdownDirectiveParam(raw, scanned[i].start) : false
                });
            } else {
                tokens.push({
                    kind: 'topic',
                    start: scanned[i].start,
                    end: scanned[i].end,
                    inner: inner
                });
            }
        }
        this._mdPlaceholderPlan = { src: raw, tokens: tokens };
        return this._mdPlaceholderPlan;
    }

    _evaluateMarkdownFormula(inner, countdownId) {
        if (typeof FormulaEngine === 'undefined' || typeof FormulaEngine.evaluate !== 'function') {
            return '-';
        }
        const self = this;
        const resolveFn = function (path) {
            const hit = self._tryResolveMarkdownDataPath(path);
            if (!hit || hit.failed) return { failed: true };
            if (typeof FormulaEngine.coerceValue === 'function') {
                return FormulaEngine.coerceValue(hit.v);
            }
            return { v: hit.v, type: typeof hit.v === 'number' ? 'number' : 'string' };
        };
        const cdCtx = this.id + '::__md__::' + (countdownId || inner);
        const ev = FormulaEngine.evaluate(inner, undefined, resolveFn, {
            disallowValue: true,
            countdownContext: cdCtx
        });
        if (!ev || ev.failed) return '-';
        if (ev.value === undefined || ev.value === null) return '-';
        return ev.value;
    }

    _resolveMarkdownDynamicPlaceholders(src, escapeInserted, wrapCountdowns) {
        const raw = src === undefined || src === null ? '' : String(src);
        if (wrapCountdowns === true) {
            this._activeMdCountdownTokens = [];
            this._activeMdDirectiveCountdowns = [];
            this._hasActiveExtraCountdowns = false;
        }
        if (raw.indexOf('{{') < 0) return raw;
        const plan = this._getMarkdownPlaceholderPlan(raw);
        if (!plan.tokens.length) return raw;
        const esc = escapeInserted === true;
        let out = '';
        let last = 0;
        let i;
        for (i = 0; i < plan.tokens.length; i++) {
            const tok = plan.tokens[i];
            out += raw.slice(last, tok.start);
            let resolved;
            if (!tok.inner) {
                resolved = '';
            } else if (tok.kind === 'formula') {
                resolved = tok.overCap ? '-' : this._evaluateMarkdownFormula(tok.inner, tok.countdownId);
            } else {
                resolved = this._resolveMarkdownDataPath(tok.inner);
            }
            if (resolved === undefined || resolved === null) resolved = '-';
            if (typeof resolved === 'string') resolved = TextWidget.expandEscapedNewlines(resolved);
            else resolved = String(resolved);
            if (wrapCountdowns === true && tok.kind === 'formula' && tok.hasCountdown && !tok.overCap) {
                if (tok.inDirectiveParam) {
                    this._activeMdDirectiveCountdowns.push({
                        id: tok.countdownId,
                        inner: tok.inner,
                        lastVal: resolved
                    });
                    out += esc ? TextWidget._escapePlainText(resolved) : resolved;
                } else {
                    this._activeMdCountdownTokens.push({
                        id: tok.countdownId,
                        inner: tok.inner
                    });
                    out += '<span class="ds-formula-countdown" data-countdown-id="' + tok.countdownId + '">'
                        + TextWidget._escapePlainText(resolved) + '</span>';
                }
            } else {
                out += esc ? TextWidget._escapePlainText(resolved) : resolved;
            }
            last = tok.end;
        }
        out += raw.slice(last);
        if (wrapCountdowns === true && (this._activeMdCountdownTokens.length > 0 || this._activeMdDirectiveCountdowns.length > 0)) {
            this._hasActiveExtraCountdowns = typeof FormulaEngine !== 'undefined'
                && typeof FormulaEngine.hasActiveCountdownsForWidget === 'function'
                && FormulaEngine.hasActiveCountdownsForWidget(this.id);
        }
        return out;
    }

    /** Normalize stored markdown icon weight to BaseWidget.PHOSPHOR_ICON_WEIGHTS vocabulary. */
    static normalizeMarkdownIconWeight(w) {
        const s = w == null ? '' : String(w).toLowerCase().trim();
        if (s === 'thin' || s === 'light' || s === 'regular' || s === 'bold' || s === 'fill' || s === 'duotone') {
            return s;
        }
        return 'regular';
    }

    /** Map a Phosphor weight CSS token to logical weight key, or null if not a weight token. */
    static _markdownPhosphorWeightKeyFromClassToken(token) {
        const t = token == null ? '' : String(token).trim();
        if (t === 'ph') return 'regular';
        if (t === 'ph-thin') return 'thin';
        if (t === 'ph-light') return 'light';
        if (t === 'ph-bold') return 'bold';
        if (t === 'ph-fill') return 'fill';
        if (t === 'ph-duotone') return 'duotone';
        return null;
    }

    /** True if token is a glyph class (`ph-*`) and not a hyphenated weight-only token. */
    static _markdownPhosphorIsGlyphClassToken(token) {
        const t = token == null ? '' : String(token).trim();
        if (!/^ph-[a-z0-9-]+$/.test(t)) return false;
        if (t === 'ph-thin' || t === 'ph-light' || t === 'ph-bold' || t === 'ph-fill' || t === 'ph-duotone') {
            return false;
        }
        return true;
    }

    /**
     * Parse `:ph( … ):` inner text. Returns `{ weightKey, glyphClass, mediaSize, primaryTint, secondaryTint }`
     * or null if invalid. First weight token wins; glyph must appear exactly once (full class e.g. ph-android-logo).
     * Trailing `|size` / `|color` / `|color|color` pipe tokens are peeled via `_splitIconPipeTokens`.
     */
    static _parseBracketPhosphorInner(inner, opts) {
        const o = opts || {};
        const innerTrim = inner == null ? '' : String(inner).trim();
        if (!innerTrim) return null;
        const pipeSplit = TextWidget._splitIconPipeTokens(innerTrim);
        const innerForTokens = pipeSplit.label.trim();
        if (!innerForTokens) return null;
        const parts = innerForTokens.split(/\s+/);
        const tokens = [];
        let ti;
        for (ti = 0; ti < parts.length; ti++) {
            if (parts[ti].length > 0) tokens.push(parts[ti]);
        }
        if (tokens.length === 0) return null;
        let firstWeightKey = null;
        const glyphs = [];
        for (ti = 0; ti < tokens.length; ti++) {
            const tok = tokens[ti];
            const wk = TextWidget._markdownPhosphorWeightKeyFromClassToken(tok);
            if (wk !== null) {
                if (firstWeightKey === null) firstWeightKey = wk;
                continue;
            }
            if (TextWidget._markdownPhosphorIsGlyphClassToken(tok)) {
                glyphs.push(tok);
                continue;
            }
            return null;
        }
        if (glyphs.length !== 1) return null;
        const weightKey = firstWeightKey !== null
            ? TextWidget.normalizeMarkdownIconWeight(firstWeightKey)
            : TextWidget.normalizeMarkdownIconWeight(o.defaultWeight);
        return {
            weightKey: weightKey,
            glyphClass: glyphs[0],
            mediaSize: pipeSplit.size,
            primaryTint: pipeSplit.primaryTint,
            secondaryTint: pipeSplit.secondaryTint
        };
    }

    static _markdownEscapeHtmlAttrValue(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Obsidian-style pipe size: `32`, `240x180`, or `x180` (pixels).
     * @returns {{ w: number|null, h: number|null }|null}
     */
    static _parseMediaSizePipe(sizeStr) {
        if (sizeStr === undefined || sizeStr === null) return null;
        let s = String(sizeStr).trim().toLowerCase();
        if (!s) return null;
        if (s.endsWith('px')) s = s.slice(0, -2).trim();
        let m = s.match(/^x(\d+(?:\.\d+)?)$/);
        if (m) {
            const h = parseFloat(m[1]);
            return isNaN(h) || h <= 0 || h > 4096 ? null : { w: null, h: h };
        }
        m = s.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
        if (m) {
            const w = parseFloat(m[1]);
            const h = parseFloat(m[2]);
            if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0 || w > 4096 || h > 4096) return null;
            return { w: w, h: h };
        }
        m = s.match(/^(\d+(?:\.\d+)?)$/);
        if (m) {
            const w = parseFloat(m[1]);
            return isNaN(w) || w <= 0 || w > 4096 ? null : { w: w, h: null };
        }
        return null;
    }

    /** Split trailing `|size` from a label when the size token is valid. */
    static _splitLabelAndMediaSizePipe(label) {
        const split = TextWidget._splitLabelAndImagePipeTokens(label);
        return { label: split.label, size: split.size };
    }

    static _validateImageTintSpec(raw) {
        if (typeof MarkdownImageTint !== 'undefined' && MarkdownImageTint.validateColorSpec) {
            return MarkdownImageTint.validateColorSpec(raw);
        }
        if (typeof MarkdownColorSpec !== 'undefined' && MarkdownColorSpec.validateColorSpec) {
            return MarkdownColorSpec.validateColorSpec(raw);
        }
        return null;
    }

    /**
     * Peel trailing `|token` segments from a label (order-independent), shared by image
     * and icon tinting. Each token is classified as size (`_parseMediaSizePipe`) or tint
     * (`MarkdownColorSpec`). Up to `maxTints` color specs are collected (peeled right-to-left).
     */
    static _splitLabelAndMediaPipeTokens(label, opts) {
        const o = opts || {};
        const maxTints = o.maxTints != null ? o.maxTints : 1;
        let s = label == null ? '' : String(label);
        let size = null;
        const tints = [];
        while (true) {
            const idx = s.lastIndexOf('|');
            if (idx < 0) break;
            const token = s.slice(idx + 1).replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, '');
            if (!token.length) break;
            const parsedSize = TextWidget._parseMediaSizePipe(token);
            const parsedTint = TextWidget._validateImageTintSpec(token);
            if (parsedSize && !size) {
                size = parsedSize;
                s = s.slice(0, idx);
                continue;
            }
            if (parsedTint && tints.length < maxTints) {
                tints.push(parsedTint);
                s = s.slice(0, idx);
                continue;
            }
            break;
        }
        return { label: s, size: size, tints: tints };
    }

    /**
     * Peel trailing `|token` segments from an image alt label (order-independent).
     * Image tinting accepts a single color spec; wrapper over the shared peeler.
     */
    static _splitLabelAndImagePipeTokens(label) {
        const split = TextWidget._splitLabelAndMediaPipeTokens(label, { maxTints: 1 });
        return { label: split.label, size: split.size, tint: split.tints[0] || null };
    }

    /**
     * Peel trailing `|token` segments from an icon label/inner. Icons accept up to two
     * color specs: the first written is the primary tint, the second the secondary
     * (duotone accent) tint. Reuses the same size/tint classification as image tinting.
     */
    static _splitIconPipeTokens(label) {
        const split = TextWidget._splitLabelAndMediaPipeTokens(label, { maxTints: 2 });
        const tints = split.tints; // peeled right-to-left
        const ordered = tints.length === 2 ? [tints[1], tints[0]] : tints;
        return {
            label: split.label,
            size: split.size,
            primaryTint: ordered[0] || null,
            secondaryTint: ordered[1] || null
        };
    }

    static _imageTintDataAttrString(tint) {
        if (!tint) return '';
        const esc = (typeof MarkdownImageTint !== 'undefined' && MarkdownImageTint.escapeHtmlAttrValue)
            ? MarkdownImageTint.escapeHtmlAttrValue(tint)
            : TextWidget._markdownEscapeHtmlAttrValue(String(tint));
        return 'data-text-md-img-tint="' + esc + '"';
    }

    static _mediaSizeDataAttrString(size) {
        if (!size) return '';
        const parts = [];
        if (size.w != null && !isNaN(size.w)) {
            parts.push('data-md-w="' + TextWidget._markdownEscapeHtmlAttrValue(String(size.w)) + '"');
        }
        if (size.h != null && !isNaN(size.h)) {
            parts.push('data-md-h="' + TextWidget._markdownEscapeHtmlAttrValue(String(size.h)) + '"');
        }
        return parts.length ? parts.join(' ') : '';
    }

    /** Resolve a validated markdown color spec (hex/@token/rgb) to a CSS color string. */
    static _resolveMarkdownTintCss(spec) {
        if (spec == null) return '';
        const s = String(spec).trim();
        if (!s) return '';
        if (typeof MarkdownColorSpec !== 'undefined' && MarkdownColorSpec.resolveColorCss) {
            const resolved = MarkdownColorSpec.resolveColorCss(s);
            return resolved ? String(resolved) : '';
        }
        if (typeof BaseWidget !== 'undefined' && BaseWidget.resolveCssColor) {
            const resolved = BaseWidget.resolveCssColor(s);
            return resolved ? String(resolved) : '';
        }
        return s;
    }

    /**
     * Build the inline `style` declaration string for a Phosphor `<i>`.
     * Markdown tints (`primaryTint` / `secondaryTint`) override editor defaults:
     * - duotone weight: primary + secondary layers (two tints), or uniform (one tint);
     * - other weights: a single tint recolors the glyph via `--text-md-icon-color`;
     *   a second tint is ignored gracefully (no multi-layer support to map it onto).
     */
    static _iconInlineStyleDecls(wKey, o) {
        const hasPrimary = o.primaryTint != null && String(o.primaryTint).length > 0;
        const hasSecondary = o.secondaryTint != null && String(o.secondaryTint).length > 0;
        if (wKey === 'duotone') {
            let pri, sec;
            if (hasPrimary && hasSecondary) {
                pri = TextWidget._resolveMarkdownTintCss(o.primaryTint) || 'currentColor';
                sec = TextWidget._resolveMarkdownTintCss(o.secondaryTint) || 'currentColor';
            } else if (hasPrimary) {
                pri = TextWidget._resolveMarkdownTintCss(o.primaryTint) || 'currentColor';
                sec = pri;
            } else {
                pri = o.duotonePrimaryCss != null ? String(o.duotonePrimaryCss) : 'currentColor';
                sec = o.duotoneSecondaryCss != null ? String(o.duotoneSecondaryCss) : 'currentColor';
            }
            return '--icon-primary-color:' + pri + ';--icon-secondary-color:' + sec;
        }
        if (hasPrimary) {
            const css = TextWidget._resolveMarkdownTintCss(o.primaryTint);
            if (!css) return '';
            return '--text-md-icon-color:' + css;
        }
        return '';
    }

    /** Emit `<i>` for Phosphor icon; duotone sets inline CSS variables for pseudo-elements. */
    static _markdownEmitPhosphorIconHtml(weightKey, glyphClass, opts) {
        const o = opts || {};
        const wKey = TextWidget.normalizeMarkdownIconWeight(weightKey);
        const wClass = BaseWidget.phosphorWeightClass(wKey);
        const g = glyphClass == null ? '' : String(glyphClass).trim();
        const cls = (wClass + ' ' + g + ' text-md-ph-icon').replace(/\s+/g, ' ').trim();
        let attr = 'class="' + TextWidget._markdownEscapeHtmlAttrValue(cls) + '"';
        const sizeAttr = TextWidget._mediaSizeDataAttrString(o.mediaSize);
        if (sizeAttr) attr += ' ' + sizeAttr;
        const styleDecls = TextWidget._iconInlineStyleDecls(wKey, o);
        if (styleDecls) {
            attr += ' style="' + TextWidget._markdownEscapeHtmlAttrValue(styleDecls) + '"';
        }
        return '<i ' + attr + ' aria-hidden="true">&#8203;</i>';
    }

    static _markdownLegacySlugToGlyphClass(name) {
        const n = name == null ? '' : String(name).trim();
        if (!n) return 'ph-question';
        if (TextWidget._markdownPhosphorIsGlyphClassToken(n)) return n;
        return 'ph-' + n;
    }

    static _markdownLegacySlugToHtml(name, opts) {
        if (name === 'spacer') {
            return '<i class="ph ph-calendar text-md-ph-icon text-md-ph-icon-spacer" aria-hidden="true">&#8203;</i>';
        }
        const o = opts || {};
        const dw = TextWidget.normalizeMarkdownIconWeight(o.defaultWeight);
        return TextWidget._markdownEmitPhosphorIconHtml(dw, TextWidget._markdownLegacySlugToGlyphClass(name), o);
    }

    /**
     * Allow only markdown icon CSS-variable declarations on `<i style="…">`:
     * `--icon-primary-color`, `--icon-secondary-color` (duotone layers), and
     * `--text-md-icon-color` (single-color recolor). Any subset, in any order, no duplicates.
     */
    static _markdownPurifyAllowIconStyle(val) {
        const v = val == null ? '' : String(val).trim();
        if (!v) return false;
        const safeVal = /^[a-zA-Z0-9#().,%/\s:,+\-_]*$/;
        const allowed = {
            '--icon-primary-color': true,
            '--icon-secondary-color': true,
            '--text-md-icon-color': true
        };
        const parts = v.split(';');
        const decl = [];
        let i;
        for (i = 0; i < parts.length; i++) {
            const p = parts[i].trim();
            if (p.length > 0) decl.push(p);
        }
        if (decl.length === 0 || decl.length > 3) return false;
        const seen = {};
        for (i = 0; i < decl.length; i++) {
            const m = decl[i].match(/^([a-zA-Z\-]+)\s*:\s*(.+)$/);
            if (!m) return false;
            const name = m[1].trim();
            const value = m[2].trim();
            if (!allowed[name]) return false;
            if (seen[name]) return false;
            if (value.length > 600) return false;
            if (!safeVal.test(value)) return false;
            seen[name] = true;
        }
        return true;
    }

    /**
     * `:ph(ph-duotone ph-android-logo):` bracket form first, then legacy `:ph-slug:`.
     * All forms accept trailing `|size`, `|color`, or `|color|color` pipe tokens (order-independent),
     * reusing the same tint classification as image tinting (`MarkdownColorSpec`).
     * @param {{ defaultWeight?: string, duotonePrimaryCss?: string, duotoneSecondaryCss?: string }} [opts]
     */
    static _preprocessPhosphorIcons(src, opts) {
        if (src === undefined || src === null) return '';
        const o = opts || {};
        let out = String(src);
        out = out.replace(/:ph\(([^)]*)\):/g, function (_m, inner) {
            const parsed = TextWidget._parseBracketPhosphorInner(inner, o);
            if (!parsed) return '';
            const emitOpts = Object.assign({}, o);
            if (parsed.mediaSize) emitOpts.mediaSize = parsed.mediaSize;
            if (parsed.primaryTint) emitOpts.primaryTint = parsed.primaryTint;
            if (parsed.secondaryTint) emitOpts.secondaryTint = parsed.secondaryTint;
            return TextWidget._markdownEmitPhosphorIconHtml(parsed.weightKey, parsed.glyphClass, emitOpts);
        });
        /** Space-separated weight + full glyph class: `:ph-duotone ph-android-logo:` (no inner parentheses). */
        out = out.replace(/:ph-(thin|light|bold|fill|duotone)\s+(ph-[a-z0-9-]+)((?:\|[^:\s]+)*)?:/g, function (_m, wSlug, glyphFull, pipeRaw) {
            var keyMap = { thin: 'thin', light: 'light', bold: 'bold', fill: 'fill', duotone: 'duotone' };
            var wk = keyMap[wSlug];
            var split = TextWidget._splitIconPipeTokens(glyphFull + (pipeRaw || ''));
            var emitOpts = Object.assign({}, o);
            if (split.size) emitOpts.mediaSize = split.size;
            if (split.primaryTint) emitOpts.primaryTint = split.primaryTint;
            if (split.secondaryTint) emitOpts.secondaryTint = split.secondaryTint;
            return TextWidget._markdownEmitPhosphorIconHtml(wk, glyphFull, emitOpts);
        });
        out = out.replace(/:ph-([a-z0-9-]+)((?:\|[^:\s]+)*)?:/g, function (_m, nm, pipeRaw) {
            var split = TextWidget._splitIconPipeTokens('ph-' + nm + (pipeRaw || ''));
            var emitOpts = Object.assign({}, o);
            if (split.size) emitOpts.mediaSize = split.size;
            if (split.primaryTint) emitOpts.primaryTint = split.primaryTint;
            if (split.secondaryTint) emitOpts.secondaryTint = split.secondaryTint;
            return TextWidget._markdownLegacySlugToHtml(nm, emitOpts);
        });
        return out;
    }

    /** Obsidian-style `![alt|240|@accent](url)` image size/tint → `<img>` with data attrs before markdown-it. */
    static _preprocessMarkdownImagesWithSize(src) {
        if (src === undefined || src === null) return '';
        return String(src).replace(/!\[((?:\\.|[^\]\n\\])*)\]\(([^\s"'<>\\()]+(?:\\.[^\s"'<>\\()]+)*)\)/g, function (_m, alt, url) {
            const split = TextWidget._splitLabelAndImagePipeTokens(alt);
            if (!split.size && !split.tint) return _m;
            const dataSize = TextWidget._mediaSizeDataAttrString(split.size);
            const dataTint = TextWidget._imageTintDataAttrString(split.tint);
            const escAlt = TextWidget._markdownEscapeHtmlAttrValue(split.label);
            const escUrl = TextWidget._markdownEscapeHtmlAttrValue(url);
            const imgClass = split.size ? 'text-md-img-sized' : 'text-md-img-preprocessed';
            const extra = [dataSize, dataTint].filter(function (x) { return x && x.length; }).join(' ');
            return '<img src="' + escUrl + '" alt="' + escAlt + '" class="' + imgClass + '"' + (extra ? ' ' + extra : '') + '>';
        });
    }

    /** Shortcodes `[block1:text]` … `[block4:text]` (case-insensitive) → sanitized container div markup. */
    static _preprocessBlocks(src, opts) {
        if (src === undefined || src === null) return '';
        const pOpts = opts || {};
        const srcStr = String(src);
        return srcStr.replace(/\[block\s*([1-4])\s*:\s*([\s\S]*?)\]/gi, function (_m, index, inner, offset) {
            const raw = inner == null ? '' : String(inner);
            const bodyTrim = raw.replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, '');
            const innerHtml = TextWidget._renderMarkdownInlineBody(bodyTrim, pOpts);
            // Blank lines after a block terminate markdown-it HTML blocks for following paragraphs,
            // but inside a GFM table row they break the row and spill the block full widget width.
            var suffix = '\n\n';
            var lineStart = srcStr.lastIndexOf('\n', offset - 1) + 1;
            var lineEnd = srcStr.indexOf('\n', offset);
            if (lineEnd < 0) lineEnd = srcStr.length;
            var line = srcStr.slice(lineStart, lineEnd);
            if (TextWidget._isMarkdownTableRowLine(line)) {
                suffix = '';
            }
            return '<div class="text-md-block text-md-block-' + index + '">' + innerHtml + '</div>' + suffix;
        });
    }

    /**
     * Turn literal two-character `\n` sequences into line feeds (for single-line markdown / topic payloads).
     * Does not interpret other escape sequences.
     */
    static expandEscapedNewlines(value) {
        if (value === undefined || value === null) return '';
        const s = String(value);
        if (s.indexOf('\\n') < 0) return s;
        return s.split('\\n').join('\n');
    }

    static _escapePlainText(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * When true, the string can be rendered as escaped plain text in a single &lt;p&gt; (and &lt;br&gt; for
     * newlines) with the same visual result as markdown-it, without `md.render` or DOMPurify.
     * Conservative: when in doubt, returns false. Skips: `{{` tokens, :ph-: (HTML after icon preprocess), block/list/quotes, links/images, code, emphasis delimiters, etc.
     * @param {string} preAfterPhosphor Result of {@link #_preprocessPhosphorIcons} on the raw `text` field
     * @param {string|undefined} rawForDynamicCheck Original `text` (before icon preprocess) to detect `{{`
     */
    static _plainTextMdCanSkipMarkdownIt(preAfterPhosphor, rawForDynamicCheck) {
        const pre = preAfterPhosphor;
        if (typeof MarkdownCellColor !== 'undefined'
            && MarkdownCellColor.sourceHasCellDirectives
            && MarkdownCellColor.sourceHasCellDirectives(rawForDynamicCheck)) {
            return false;
        }
        if (typeof MarkdownTextColor !== 'undefined'
            && MarkdownTextColor.sourceHasTextColorDirectives
            && MarkdownTextColor.sourceHasTextColorDirectives(rawForDynamicCheck)) {
            return false;
        }
        if (typeof MarkdownBlink !== 'undefined'
            && MarkdownBlink.sourceHasBlinkDirectives
            && MarkdownBlink.sourceHasBlinkDirectives(rawForDynamicCheck)) {
            return false;
        }
        if (String(rawForDynamicCheck).indexOf('{{') >= 0) return false;
        if (pre == null) return true;
        if (pre.length > 200000) return false;
        if (pre.indexOf('<') >= 0) return false;
        if (pre.indexOf('\\') >= 0) return false;
        if (pre.indexOf('|') >= 0) return false;
        if (pre.indexOf('`') >= 0) return false;
        if (pre.indexOf('**') >= 0 || pre.indexOf('__') >= 0) return false;
        if (pre.indexOf('~~') >= 0) return false;
        if (pre.indexOf('](') >= 0 || pre.indexOf('![') >= 0) return false;
        if (pre.indexOf('[') >= 0) return false;
        if (/  \n|  $/m.test(pre)) return false;
        if (/\*[^*]+\*/.test(pre)) return false;
        if (/(^|\n)\s*#/.test(pre)) return false;
        if (/(^|\n)\s*>\s?/m.test(pre)) return false;
        if (/(^|\n)\s*[-*+](?=\s)/m.test(pre)) return false;
        if (/(^|\n)\s*[-*+](?=\n|$)/m.test(pre)) return false;
        if (/(^|\n)\s*\d+\.\s/m.test(pre)) return false;
        if (/(^|\n)\s*[-*]{3,}\s*$/m.test(pre) || /(^|\n)\s*_{3,}\s*$/m.test(pre)) return false;
        if (pre.indexOf('__') < 0 && pre.indexOf('_') >= 0) {
            if (/(^|[^A-Za-z0-9])_([^_\n]+)_(?=[^A-Za-z0-9_]|$)/.test(pre)) return false;
        }
        return true;
    }

    static _sanitizeMarkdownHtml(html) {
        TextWidget._ensurePurifyClassHook();
        TextWidget._ensurePurifyAnchorHook();
        const P = typeof window !== 'undefined' ? window.DOMPurify : null;
        if (!P || typeof P.sanitize !== 'function') return '';
        const allowedTags = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'strong', 'em', 's', 'i', 'br',
            'ul', 'ol', 'li', 'img', 'a', 'code', 'pre', 'blockquote'
        ];
        return P.sanitize(html, {
            ALLOWED_TAGS: allowedTags,
            ALLOWED_ATTR: ['class', 'style', 'src', 'alt', 'title', 'href', 'target', 'rel', 'data-md-align', 'data-md-w', 'data-md-h', 'data-text-md-col', 'data-text-md-img-tint', 'data-text-md-blink', 'data-countdown-id'],
            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|help):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
        });
    }

    /** Turn trusted data-md-w/h attrs into inline px styles on a container element. */
    static _materializeMediaSizeAttrsInContainer(wrap) {
        if (!wrap || !wrap.querySelectorAll) return;
        var els = wrap.querySelectorAll('[data-md-w], [data-md-h]');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var wRaw = el.getAttribute('data-md-w');
            var hRaw = el.getAttribute('data-md-h');
            var w = wRaw != null && wRaw !== '' ? parseFloat(wRaw) : null;
            var h = hRaw != null && hRaw !== '' ? parseFloat(hRaw) : null;
            var tag = el.tagName ? String(el.tagName).toLowerCase() : '';
            if (tag === 'img') {
                if (w != null && !isNaN(w) && w > 0) {
                    el.style.width = w + 'px';
                    el.style.maxWidth = 'none';
                }
                if (h != null && !isNaN(h) && h > 0) {
                    el.style.height = h + 'px';
                }
                if (w != null && !isNaN(w) && w > 0 && (h == null || isNaN(h))) {
                    el.style.height = 'auto';
                }
                if (h != null && !isNaN(h) && h > 0 && (w == null || isNaN(w))) {
                    el.style.width = 'auto';
                }
            } else if (tag === 'i') {
                var fontPx = null;
                if (w != null && !isNaN(w) && w > 0 && h != null && !isNaN(h) && h > 0) {
                    fontPx = Math.min(w, h);
                } else if (w != null && !isNaN(w) && w > 0) {
                    fontPx = w;
                } else if (h != null && !isNaN(h) && h > 0) {
                    fontPx = h;
                }
                if (fontPx != null) el.style.fontSize = fontPx + 'px';
            }
            el.removeAttribute('data-md-w');
            el.removeAttribute('data-md-h');
        }
    }

    /** Turn trusted data-md-w/h attrs into inline px styles (runs after DOMPurify). */
    static _materializeMediaSizeAttrsInHtml(html) {
        if (!html || (html.indexOf('data-md-w') < 0 && html.indexOf('data-md-h') < 0)) return html;
        if (typeof document === 'undefined') return html;
        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        TextWidget._materializeMediaSizeAttrsInContainer(wrap);
        return wrap.innerHTML;
    }

    static _markdownThElementIsEmpty(th) {
        if (!th) return true;
        const imgs = th.querySelectorAll('img');
        for (let i = 0; i < imgs.length; i++) {
            const alt = String(imgs[i].getAttribute('alt') || '').replace(/\u00a0/g, ' ').trim();
            if (alt.length > 0) return false;
        }
        const links = th.querySelectorAll('a');
        for (let j = 0; j < links.length; j++) {
            const linkText = String(links[j].textContent || '').replace(/\u00a0/g, ' ').trim();
            if (linkText.length > 0) return false;
        }
        const text = String(th.textContent || '').replace(/\u00a0/g, ' ').trim();
        return text.length === 0;
    }

    static _stripEmptyMarkdownTableHeadersInContainer(wrap, hasTextAlign, hasThead) {
        if (!wrap || !wrap.querySelectorAll) return;
        if (hasTextAlign) {
            var styled = wrap.querySelectorAll('td[style], th[style]');
            for (var si = 0; si < styled.length; si++) {
                var ta = styled[si].style.textAlign;
                if (ta === 'left' || ta === 'center' || ta === 'right') {
                    styled[si].setAttribute('data-md-align', ta);
                }
                styled[si].removeAttribute('style');
            }
        }
        if (hasThead) {
            var tables = wrap.querySelectorAll('table');
            for (var ti = 0; ti < tables.length; ti++) {
                var thead = tables[ti].tHead;
                if (!thead || !thead.rows.length) continue;
                var headerRow = thead.rows[0];
                var cells = headerRow.cells;
                if (!cells.length) continue;
                var allEmpty = true;
                for (var ci = 0; ci < cells.length; ci++) {
                    if (!TextWidget._markdownThElementIsEmpty(cells[ci])) {
                        allEmpty = false;
                        break;
                    }
                }
                if (allEmpty && thead.parentNode) thead.parentNode.removeChild(thead);
            }
        }
    }

    /** Remove `<thead>` when every header cell is empty (GFM still requires the row in source). */
    static _stripEmptyMarkdownTableHeadersFromHtml(html) {
        if (!html) return html;
        var hasTextAlign = html.indexOf('text-align') >= 0;
        var hasThead = html.indexOf('<thead') >= 0;
        if (!hasTextAlign && !hasThead) return html;
        if (typeof document === 'undefined') return html;
        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        TextWidget._stripEmptyMarkdownTableHeadersInContainer(wrap, hasTextAlign, hasThead);
        return wrap.innerHTML;
    }

    /** Render inline markdown for table cell headings, text color inner bodies, and block callouts. */
    static _renderMarkdownInlineBody(body, phOpts) {
        const md = TextWidget._getMarkdownIt();
        const opts = phOpts || {};
        let raw = body == null ? '' : String(body);
        if (typeof MarkdownBlink !== 'undefined' && MarkdownBlink.preprocessForRender) {
            raw = MarkdownBlink.preprocessForRender(raw, {
                renderInline: function (inner) {
                    return TextWidget._renderMarkdownInlineBody(inner, opts);
                },
                renderBlock: function (inner) {
                    return TextWidget._renderMarkdownFragmentToSafeHtml(inner, {
                        phOpts: opts,
                        hadEscapedNewlines: true,
                        rawForPlainCheck: inner
                    });
                }
            });
        }
        raw = TextWidget._preprocessMarkdownImagesWithSize(raw);
        const prep = TextWidget._preprocessPhosphorIcons(raw, opts);
        let colored = prep;
        if (typeof MarkdownTextColor !== 'undefined' && MarkdownTextColor.preprocessForRender) {
            colored = MarkdownTextColor.preprocessForRender(prep, function (inner) {
                return TextWidget._renderMarkdownInlineBody(inner, opts);
            });
        }
        if (md && typeof md.renderInline === 'function') {
            return md.renderInline(colored);
        }
        return colored.length ? colored : '';
    }

    static _finalizeMarkdownHtml(html) {
        var out = TextWidget._sanitizeMarkdownHtml(html);
        if (!out) return out;
        if (typeof document !== 'undefined') {
            var hasMediaSize = out.indexOf('data-md-w') >= 0 || out.indexOf('data-md-h') >= 0;
            var hasTextAlign = out.indexOf('text-align') >= 0;
            var hasThead = out.indexOf('<thead') >= 0;
            var hasTextCol = typeof MarkdownTextColor !== 'undefined' && MarkdownTextColor.DATA_ATTR
                && out.indexOf(MarkdownTextColor.DATA_ATTR) >= 0;
            var hasImgTint = typeof MarkdownImageTint !== 'undefined' && MarkdownImageTint.DATA_ATTR
                && out.indexOf(MarkdownImageTint.DATA_ATTR) >= 0;
            if (hasMediaSize || hasTextAlign || hasThead || hasTextCol || hasImgTint) {
                var wrap = document.createElement('div');
                wrap.innerHTML = out;
                if (hasMediaSize) {
                    TextWidget._materializeMediaSizeAttrsInContainer(wrap);
                }
                if (hasTextAlign || hasThead) {
                    TextWidget._stripEmptyMarkdownTableHeadersInContainer(wrap, hasTextAlign, hasThead);
                }
                if (hasTextCol && MarkdownTextColor.reapplyFromDataAttrs) {
                    MarkdownTextColor.reapplyFromDataAttrs(wrap);
                }
                if (hasImgTint && MarkdownImageTint.materializeInContainer) {
                    MarkdownImageTint.materializeInContainer(wrap);
                }
                out = wrap.innerHTML;
            }
        }
        if (typeof MarkdownBlink !== 'undefined' && MarkdownBlink.materializeInHtml) {
            out = MarkdownBlink.materializeInHtml(out);
        }
        return out;
    }

    static textMdTypographyRolePrefixTuples() {
        return [
            ['mdParagraph', 'textMdPara'],
            ['mdH1', 'textMdH1'],
            ['mdH2', 'textMdH2'],
            ['mdH3', 'textMdH3'],
            ['mdTh', 'textMdTh'],
            ['mdTableText', 'textMdTd'],
            ['mdBlockTypography', 'textMdBlockTypography'],
            ['mdCode', 'textMdCode']
        ];
    }

    /**
     * Flattens overrides.typography roles onto textMd* flat keys for editor + applyTypographyToElement.
     */
    static applyTypographyNestedToConfig(c) {
        BaseWidget.applyTypographyNestedToConfig(c, TextWidget.textMdTypographyRolePrefixTuples(), {
            extraByRole: TextWidget._textMdTypographyExtraByRole()
        });
    }

    static getNestedBindingOverlaySpec() {
        return BaseWidget.buildTypographyBindingOverlaySpec(TextWidget.textMdTypographyRolePrefixTuples(), {
            extraByRole: TextWidget._textMdTypographyExtraByRole()
        });
    }

    static _resolveTextMdRoleBlockSpace(c, prefix, masterKey, hardDefault) {
        const fallback = hardDefault != null ? hardDefault : TextWidget.TEXT_MD_BLOCK_SPACE_DEFAULT;
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        let v = c[prefix + 'BlockSpace'];
        if (v === undefined || v === null || v === '') {
            v = M[masterKey];
        }
        if (v === undefined || v === null || v === '') {
            v = fallback;
        }
        const n = parseInt(String(v), 10);
        return isNaN(n) ? fallback : n;
    }

    static _resolveTextMdRoleLineHeight(c, prefix, masterKey, hardDefault) {
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const globalLh = M.defaultLabelLineHeight != null ? M.defaultLabelLineHeight : 1.5;
        const fallback = hardDefault != null ? hardDefault : globalLh;
        let v = c[prefix + 'LineHeight'];
        if (v === undefined || v === null || v === '') {
            v = M[masterKey];
        }
        if (v === undefined || v === null || v === '') {
            v = fallback;
        }
        const n = parseFloat(String(v));
        return !Number.isFinite(n) || n <= 0 ? fallback : n;
    }

    static fillTextTypographyDefaults(c) {
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        const ff = M.fontFamily || c.fontFamily || c.globalFontFamily || "'Inter', sans-serif";
        const alignBase = TextWidget.useTypographyAlign(c)
            ? 'left'
            : (c.textAlign || M.defaultTextAlign || 'center');
        const caseBase = TextWidget.useTypographyCase(c)
            ? 'none'
            : (c.labelCase !== undefined && c.labelCase !== null && String(c.labelCase).trim() !== ''
                ? c.labelCase
                : (M.defaultLabelCase || 'uppercase'));
        const boldBase = M.defaultLabelBold === true;
        const italicBase = M.defaultLabelItalic === true;

        const fillPrefix = function (prefix, opts) {
            if (!c[prefix + 'Font']) c[prefix + 'Font'] = ff;
            if (c[prefix + 'Fs'] === undefined || c[prefix + 'Fs'] === null || c[prefix + 'Fs'] === '') {
                c[prefix + 'Fs'] = opts.fs != null ? opts.fs : 12;
            }
            if (!c[prefix + 'Col']) c[prefix + 'Col'] = opts.col || '@text';
            if (!c[prefix + 'Align']) c[prefix + 'Align'] = opts.align || alignBase;
            if (c[prefix + 'Case'] === undefined || c[prefix + 'Case'] === null || String(c[prefix + 'Case']).trim() === '') {
                c[prefix + 'Case'] = opts.case != null ? opts.case : caseBase;
            }
            if (c[prefix + 'Bold'] === undefined || c[prefix + 'Bold'] === null) {
                c[prefix + 'Bold'] = opts.bold !== undefined ? opts.bold : boldBase;
            }
            if (c[prefix + 'Italic'] === undefined || c[prefix + 'Italic'] === null) {
                c[prefix + 'Italic'] = opts.italic !== undefined ? opts.italic : italicBase;
            }
            if (c[prefix + 'Opacity'] === undefined || c[prefix + 'Opacity'] === null || c[prefix + 'Opacity'] === '') {
                c[prefix + 'Opacity'] = 100;
            }
            if (c[prefix + 'OffX'] === undefined || c[prefix + 'OffX'] === null) c[prefix + 'OffX'] = 0;
            if (c[prefix + 'OffY'] === undefined || c[prefix + 'OffY'] === null) c[prefix + 'OffY'] = 0;
            if (c[prefix + 'BlockSpace'] === undefined || c[prefix + 'BlockSpace'] === null || c[prefix + 'BlockSpace'] === '') {
                c[prefix + 'BlockSpace'] = opts.blockSpace != null ? opts.blockSpace : TextWidget.TEXT_MD_BLOCK_SPACE_DEFAULT;
            }
            if (c[prefix + 'LineHeight'] === undefined || c[prefix + 'LineHeight'] === null || c[prefix + 'LineHeight'] === '') {
                c[prefix + 'LineHeight'] = opts.lineHeight != null ? opts.lineHeight : (M.defaultLabelLineHeight != null ? M.defaultLabelLineHeight : 1.5);
            }
        };

        const fsLabel = M.defaultFsLabel != null ? M.defaultFsLabel : 12;
        const fsGeneral = M.defaultFsGeneral != null ? M.defaultFsGeneral : 24;
        const fsH2 = Math.round((fsLabel + fsGeneral) / 2);
        const fsH3 = fsLabel + 2;

        fillPrefix('textMdPara', {
            fs: M.textMdParaFs != null ? M.textMdParaFs : fsLabel,
            col: M.textMdParaCol || M.defaultColLabel || '@textMuted',
            align: M.textMdParaAlign || alignBase,
            case: M.textMdParaCase != null && String(M.textMdParaCase).trim() !== '' ? M.textMdParaCase : 'none',
            bold: M.textMdParaBold !== undefined && M.textMdParaBold !== null ? M.textMdParaBold : boldBase,
            italic: M.textMdParaItalic !== undefined && M.textMdParaItalic !== null ? M.textMdParaItalic : italicBase,
            blockSpace: TextWidget._resolveTextMdRoleBlockSpace(c, 'textMdPara', 'textMdParaBlockSpace'),
            lineHeight: TextWidget._resolveTextMdRoleLineHeight(c, 'textMdPara', 'textMdParaLineHeight')
        });
        fillPrefix('textMdBlockTypography', {
            fs: M.textMdBlockTypographyFs != null ? M.textMdBlockTypographyFs : fsLabel,
            col: M.textMdBlockTypographyCol || M.defaultColVal || '@text',
            align: M.textMdBlockTypographyAlign || alignBase,
            case: M.textMdBlockTypographyCase != null && String(M.textMdBlockTypographyCase).trim() !== ''
                ? M.textMdBlockTypographyCase
                : 'none',
            bold: M.textMdBlockTypographyBold !== undefined && M.textMdBlockTypographyBold !== null ? M.textMdBlockTypographyBold : boldBase,
            italic: M.textMdBlockTypographyItalic !== undefined && M.textMdBlockTypographyItalic !== null ? M.textMdBlockTypographyItalic : italicBase,
            blockSpace: TextWidget._resolveTextMdRoleBlockSpace(c, 'textMdBlockTypography', 'textMdBlockTypographyBlockSpace'),
            lineHeight: TextWidget._resolveTextMdRoleLineHeight(
                c, 'textMdBlockTypography', 'textMdBlockTypographyLineHeight', TextWidget.TEXT_MD_BLOCK_TYPO_LINE_HEIGHT_DEFAULT
            )
        });
        // Code blocks should be readable and stable across themes.
        fillPrefix('textMdCode', {
            fs: M.textMdCodeFs != null ? M.textMdCodeFs : fsLabel,
            col: M.textMdCodeCol || M.defaultColVal || '@thumb',
            align: M.textMdCodeAlign || 'left',
            case: M.textMdCodeCase != null && String(M.textMdCodeCase).trim() !== ''
                ? M.textMdCodeCase
                : 'none',
            bold: M.textMdCodeBold !== undefined && M.textMdCodeBold !== null ? M.textMdCodeBold : false,
            italic: M.textMdCodeItalic !== undefined && M.textMdCodeItalic !== null ? M.textMdCodeItalic : false,
            blockSpace: TextWidget._resolveTextMdRoleBlockSpace(c, 'textMdCode', 'textMdCodeBlockSpace'),
            lineHeight: TextWidget._resolveTextMdRoleLineHeight(
                c, 'textMdCode', 'textMdCodeLineHeight', TextWidget.TEXT_MD_BLOCK_TYPO_LINE_HEIGHT_DEFAULT
            )
        });
        // Only override when not explicitly configured; keep user preference intact.
        if (!c.textMdCodeFont || c.textMdCodeFont === ff) {
            c.textMdCodeFont = "'JetBrains Mono', monospace";
        }
        if (!c.textMdCodeBg) {
            c.textMdCodeBg = M.textMdCodeBg != null && String(M.textMdCodeBg).trim() !== ''
                ? M.textMdCodeBg
                : '@accentOff';
        }
        fillPrefix('textMdH1', {
            fs: M.textMdH1Fs != null ? M.textMdH1Fs : fsGeneral,
            col: M.textMdH1Col || M.defaultColVal || '@text',
            align: M.textMdH1Align || alignBase,
            case: M.textMdH1Case != null && String(M.textMdH1Case).trim() !== '' ? M.textMdH1Case : 'none',
            bold: M.textMdH1Bold !== undefined && M.textMdH1Bold !== null ? M.textMdH1Bold : true,
            italic: M.textMdH1Italic !== undefined && M.textMdH1Italic !== null ? M.textMdH1Italic : false,
            blockSpace: TextWidget._resolveTextMdRoleBlockSpace(c, 'textMdH1', 'textMdH1BlockSpace'),
            lineHeight: TextWidget._resolveTextMdRoleLineHeight(c, 'textMdH1', 'textMdH1LineHeight')
        });
        fillPrefix('textMdH2', {
            fs: M.textMdH2Fs != null ? M.textMdH2Fs : fsH2,
            col: M.textMdH2Col || M.defaultColVal || '@text',
            align: M.textMdH2Align || alignBase,
            case: M.textMdH2Case != null && String(M.textMdH2Case).trim() !== '' ? M.textMdH2Case : 'none',
            bold: M.textMdH2Bold !== undefined && M.textMdH2Bold !== null ? M.textMdH2Bold : true,
            italic: M.textMdH2Italic !== undefined && M.textMdH2Italic !== null ? M.textMdH2Italic : false,
            blockSpace: TextWidget._resolveTextMdRoleBlockSpace(c, 'textMdH2', 'textMdH2BlockSpace'),
            lineHeight: TextWidget._resolveTextMdRoleLineHeight(c, 'textMdH2', 'textMdH2LineHeight')
        });
        fillPrefix('textMdH3', {
            fs: M.textMdH3Fs != null ? M.textMdH3Fs : fsH3,
            col: M.textMdH3Col || M.defaultColVal || '@text',
            align: M.textMdH3Align || alignBase,
            case: M.textMdH3Case != null && String(M.textMdH3Case).trim() !== '' ? M.textMdH3Case : 'none',
            bold: M.textMdH3Bold !== undefined && M.textMdH3Bold !== null ? M.textMdH3Bold : true,
            italic: M.textMdH3Italic !== undefined && M.textMdH3Italic !== null ? M.textMdH3Italic : false,
            blockSpace: TextWidget._resolveTextMdRoleBlockSpace(c, 'textMdH3', 'textMdH3BlockSpace'),
            lineHeight: TextWidget._resolveTextMdRoleLineHeight(c, 'textMdH3', 'textMdH3LineHeight')
        });
        fillPrefix('textMdTh', {
            fs: M.textMdThFs != null ? M.textMdThFs : fsLabel,
            col: M.textMdThCol || '@accentSoft',
            align: M.textMdThAlign !== undefined && M.textMdThAlign !== null && String(M.textMdThAlign).trim() !== ''
                ? M.textMdThAlign
                : TextWidget.MD_TABLE_ALIGN_TABLE_DEFINED,
            case: M.textMdThCase != null && String(M.textMdThCase).trim() !== '' ? M.textMdThCase : caseBase,
            bold: M.textMdThBold !== undefined && M.textMdThBold !== null ? M.textMdThBold : true,
            italic: M.textMdThItalic !== undefined && M.textMdThItalic !== null ? M.textMdThItalic : false,
            blockSpace: TextWidget._resolveTextMdRoleBlockSpace(c, 'textMdTh', 'textMdThBlockSpace'),
            lineHeight: TextWidget._resolveTextMdRoleLineHeight(c, 'textMdTh', 'textMdThLineHeight')
        });
        if (!c.textMdThColFilled) {
            c.textMdThColFilled = M.textMdThColFilled != null && M.textMdThColFilled !== ''
                ? M.textMdThColFilled
                : c.textMdThCol;
        }
        fillPrefix('textMdTd', {
            fs: M.textMdTdFs != null ? M.textMdTdFs : fsLabel,
            col: M.textMdTdCol || M.defaultColVal || '@text',
            align: M.textMdTdAlign !== undefined && M.textMdTdAlign !== null && String(M.textMdTdAlign).trim() !== ''
                ? M.textMdTdAlign
                : TextWidget.MD_TABLE_ALIGN_TABLE_DEFINED,
            case: M.textMdTdCase != null && String(M.textMdTdCase).trim() !== '' ? M.textMdTdCase : 'none',
            bold: M.textMdTdBold !== undefined && M.textMdTdBold !== null ? M.textMdTdBold : boldBase,
            italic: M.textMdTdItalic !== undefined && M.textMdTdItalic !== null ? M.textMdTdItalic : italicBase,
            blockSpace: TextWidget._resolveTextMdRoleBlockSpace(
                c, 'textMdTd', 'textMdTdBlockSpace', TextWidget.TEXT_MD_TABLE_TEXT_BLOCK_SPACE_DEFAULT
            ),
            lineHeight: TextWidget._resolveTextMdRoleLineHeight(c, 'textMdTd', 'textMdTdLineHeight')
        });
    }

    static _setScrollbarThemeVars(el) {
        if (!el || !el.style) return;
        const R = BaseWidget.resolveCssColor;
        const T = BaseWidget.themeTokenRef;
        el.style.setProperty('--text-md-scroll-track', R(T('surfaceAlt')));
        el.style.setProperty('--text-md-scroll-thumb', R(T('border')));
        el.style.setProperty('--text-md-scroll-thumb-hover', R(T('surfaceHover')));
    }

    static _clearScrollbarThemeVars(el) {
        if (!el || !el.style) return;
        el.style.removeProperty('--text-md-scroll-track');
        el.style.removeProperty('--text-md-scroll-thumb');
        el.style.removeProperty('--text-md-scroll-thumb-hover');
    }

    /**
     * Table styles whose header chrome uses --text-md-th-bg on thead cells (see scoped CSS).
     * Used to pick header text color: `textMdThColFilled` (**Header text** in typography) vs `textMdThCol` (**Color**).
     * Side Header is special: only the top-left `th` uses **Header text**; see `_mdIsSideHeaderCornerTh`.
     */
    static mdTableStyleUsesFilledHeader(styleKey) {
        if (!TextWidget._mdFilledHeaderStyleSet) {
            TextWidget._mdFilledHeaderStyleSet = new Set([
                'solid_header', 'card_rows', 'calendar', 'week_planner', 'month_view',
                'kanban_columns', 'bubble_grid', 'inset_cells', 'neon_row',
                'stat_strip'
            ]);
        }
        const s = styleKey == null ? '' : String(styleKey).trim();
        return TextWidget._mdFilledHeaderStyleSet.has(s);
    }

    /**
     * True when `th` is the first cell of the first row of a Side Header table (top-left corner).
     */
    static _mdIsSideHeaderCornerTh(th) {
        if (!th || th.tagName !== 'TH') return false;
        var table = typeof th.closest === 'function' ? th.closest('table') : null;
        if (!table || !table.classList || !table.classList.contains('text-md-table--side_header')) return false;
        var thead = table.tHead;
        var firstRow = thead && thead.rows.length ? thead.rows[0] : null;
        if (!firstRow && table.rows && table.rows.length) {
            firstRow = table.rows[0];
        }
        if (!firstRow || !firstRow.cells || !firstRow.cells.length) return false;
        return firstRow.cells[0] === th;
    }

    static _mdTableStyleOptions() {
        return [
            { value: 'borderless', text: 'Borderless' },
            { value: 'minimal', text: 'Minimal' },
            { value: 'grid', text: 'Grid' },
            { value: 'zebra', text: 'Zebra' },
            { value: 'solid_header', text: 'Solid Header' },
            { value: 'card_rows', text: 'Card Rows' },
            { value: 'calendar', text: 'Calendar — Simple Grid' },
            { value: 'week_planner', text: 'Calendar — Week Planner' },
            { value: 'month_view', text: 'Calendar — Month View' },
            { value: 'compact', text: 'Compact Dense' },
            { value: 'timeline', text: 'Timeline View' },
            { value: 'col_zebra', text: 'Column Zebra' },
            { value: 'dashed', text: 'Dashed Ledger' },
            { value: 'pills', text: 'Floating Pills' },
            { value: 'outline', text: 'Outer Outline' },
            { value: 'receipt', text: 'Modern Receipt' },
            { value: 'side_header', text: 'Side Header' },
            { value: 'double_lined', text: 'Double Lined' },
            { value: 'kanban_columns', text: 'Kanban Columns' },
            { value: 'bubble_grid', text: 'Bubble Grid' },
            { value: 'stat_strip', text: 'Stat Strip' },
            { value: 'ledger_rail', text: 'Ledger with Rail' },
            { value: 'inset_cells', text: 'Inset Cells' },
            { value: 'neon_row', text: 'Neon Row Highlight' }
        ];
    }

    static _tableStyleClass(style) {
        const s = String(style == null ? 'minimal' : style).toLowerCase();
        const map = {
            borderless: 'text-md-table--borderless',
            minimal: 'text-md-table--minimal',
            grid: 'text-md-table--grid',
            zebra: 'text-md-table--zebra',
            solid_header: 'text-md-table--solid_header',
            card_rows: 'text-md-table--card_rows',
            calendar: 'text-md-table--calendar',
            compact: 'text-md-table--compact',
            timeline: 'text-md-table--timeline',
            col_zebra: 'text-md-table--col_zebra',
            dashed: 'text-md-table--dashed',
            pills: 'text-md-table--pills',
            outline: 'text-md-table--outline',
            receipt: 'text-md-table--receipt',
            side_header: 'text-md-table--side_header',
            double_lined: 'text-md-table--double_lined',
            week_planner: 'text-md-table--week_planner',
            month_view: 'text-md-table--month_view',
            kanban_columns: 'text-md-table--kanban_columns',
            bubble_grid: 'text-md-table--bubble_grid',
            stat_strip: 'text-md-table--stat_strip',
            ledger_rail: 'text-md-table--ledger_rail',
            inset_cells: 'text-md-table--inset_cells',
            neon_row: 'text-md-table--neon_row'
        };
        return map[s] ? map[s] : 'text-md-table--minimal';
    }

    /**
     * Calendar / week / month table styles: weekend column highlight by first-day-of-week (class on table).
     * Europe Mon: Sat=6, Sun=7. Americas Sun: Sun=1, Sat=7. Middle East Sat: Sat=1, Sun=2.
     */
    static _mdCalendarWeekendScopedRows(S) {
        const tables = [
            { sel: 'text-md-table--calendar', thBg: 'var(--text-md-th-accent-bg,var(--text-md-th-bg))', tdBg: 'var(--text-md-tr-alt)' },
            { sel: 'text-md-table--week_planner', thBg: 'var(--text-md-th-accent-bg,var(--text-md-th-bg))', tdBg: 'var(--text-md-tr-alt)' },
            { sel: 'text-md-table--month_view', thBg: 'var(--text-md-th-accent-bg,var(--text-md-th-bg))', tdBg: 'var(--text-md-tr-alt)' }
        ];
        const regions = [
            { cls: 'text-md-cal--ws-mon', th: [6, 7], td: [6, 7] },
            { cls: 'text-md-cal--ws-sun', th: [1, 7], td: [1, 7] },
            { cls: 'text-md-cal--ws-sat', th: [1, 2], td: [1, 2] }
        ];
        const out = [];
        let ti = 0;
        let ri = 0;
        for (ti = 0; ti < tables.length; ti++) {
            const T = tables[ti];
            for (ri = 0; ri < regions.length; ri++) {
                const R = regions[ri];
                const thPair = S + '.text-md-root table.' + T.sel + '.' + R.cls + ' thead th:nth-child(' + R.th[0] + '),' + S + '.text-md-root table.' + T.sel + '.' + R.cls + ' thead th:nth-child(' + R.th[1] + ')';
                out.push(thPair + '{background:' + T.thBg + ';}');
                const tdPair = S + '.text-md-root table.' + T.sel + '.' + R.cls + ' tbody td:nth-child(' + R.td[0] + '),' + S + '.text-md-root table.' + T.sel + '.' + R.cls + ' tbody td:nth-child(' + R.td[1] + ')';
                out.push(tdPair + '{background:' + T.tdBg + ';}');
            }
        }
        return out;
    }

    static _mdTableStyleHasCalendarWeekend(styleKey) {
        const s = String(styleKey == null ? '' : styleKey).trim();
        return s === 'calendar' || s === 'week_planner' || s === 'month_view';
    }

    static _mdCalendarWeekStartClass(weekStart) {
        const w = String(weekStart == null ? 'monday' : weekStart).toLowerCase();
        if (w === 'sunday') return 'text-md-cal--ws-sun';
        if (w === 'saturday') return 'text-md-cal--ws-sat';
        return 'text-md-cal--ws-mon';
    }

    static _buildScopedCss(scopeSelector) {
        const S = scopeSelector;
        return [
            S + '.text-md-root{width:100%;box-sizing:border-box;}',
            S + '.text-md-scroll-host{scrollbar-width:thin;scrollbar-color:var(--text-md-scroll-thumb) var(--text-md-scroll-track);box-sizing:border-box;}',
            S + '.text-md-scroll-host::-webkit-scrollbar{width:6px;height:6px;}',
            S + '.text-md-scroll-host::-webkit-scrollbar-track{background:var(--text-md-scroll-track);border-radius:3px;}',
            S + '.text-md-scroll-host::-webkit-scrollbar-thumb{background:var(--text-md-scroll-thumb);border-radius:3px;}',
            S + '.text-md-scroll-host::-webkit-scrollbar-thumb:hover{background:var(--text-md-scroll-thumb-hover);}',
            S + '.text-md-root i.text-md-ph-icon{display:inline-block;vertical-align:-0.15em;line-height:1;color:var(--text-md-icon-color,currentColor);}',
            S + '.text-md-root span[data-text-md-blink]{display:inline-block;}',
            S + '.text-md-root div[data-text-md-blink]{display:block;}',
            '@media (prefers-reduced-motion:reduce){' + S + '.text-md-root [data-text-md-blink]{animation:none;opacity:1;}}',
            S + '.text-md-root h1,' + S + '.text-md-root h2,' + S + '.text-md-root h3,' + S + '.text-md-root h4,' + S + '.text-md-root h5,' + S + '.text-md-root h6{text-transform:none;}',
            S + '.text-md-root ul{list-style-type: disc;padding-left: 1.5rem;margin-top:0;margin-bottom: var(--text-md-para-block-space, 8px);}',
            S + '.text-md-root ol{list-style-type: decimal;padding-left: 1.5rem;margin-top:0;margin-bottom: var(--text-md-para-block-space, 8px);}',
            S + '.text-md-root p{margin-top:0;margin-bottom:var(--text-md-para-block-space,8px);}',
            S + '.text-md-root h1{margin-top:0;margin-bottom:var(--text-md-h1-block-space,8px);}',
            S + '.text-md-root h2{margin-top:0;margin-bottom:var(--text-md-h2-block-space,8px);}',
            S + '.text-md-root h3,' + S + '.text-md-root h4,' + S + '.text-md-root h5,' + S + '.text-md-root h6{margin-top:0;margin-bottom:var(--text-md-h3-block-space,8px);}',
            S + '.text-md-root table{margin-top:0;margin-bottom:var(--text-md-th-block-space,8px);}',
            S + '.text-md-root img{max-width: 100%;height: auto;border-radius: 4px;display: block;margin-bottom: var(--text-md-para-block-space, 8px);}',
            S + '.text-md-root img.text-md-img-sized{display:inline-block;vertical-align:middle;margin-bottom:0;}',
            S + '.text-md-root .text-md-img-tinted{display:inline-block;vertical-align:middle;margin-bottom:0;}',
            S + '.text-md-root .text-md-img-tinted .text-md-img-tint-sizer{display:block;visibility:hidden;max-width:100%;height:auto;margin:0;border-radius:0;}',
            S + '.text-md-root > *:last-child{margin-bottom:0;}',
            S + '.text-md-root hr{border:none;border-top:1px solid var(--text-md-hr-color,currentColor);margin:var(--text-md-para-block-space,8px) 0;}',
            // Links inherit the surrounding text style (no blue link color); underline only on hover.
            S + '.text-md-root a{color:inherit;text-decoration:none;}',
            S + '.text-md-root a:hover{text-decoration:underline;}',
            // Code typography overrides the global UI theme styling in index.css.
            S + '.text-md-root pre{margin-top:0;margin-bottom:var(--text-md-code-block-space,8px);background:var(--tmd-code-bg);border:1px solid color-mix(in srgb, var(--tmd-code-col) 30%, transparent);overflow:auto;font-size:var(--tmd-code-fs);border-radius:0.25rem;padding:0.5em 0.65em;font-family:var(--tmd-code-ff);font-weight:var(--tmd-code-fw);font-style:var(--tmd-code-fst);color:var(--tmd-code-col);text-align:var(--tmd-code-ta);text-transform:var(--tmd-code-tt);line-height:var(--tmd-code-lh);margin-left:var(--tmd-code-ml,0px);transform:var(--tmd-code-txb,none);}',
            S + '.text-md-root code{font-family:var(--tmd-code-ff);font-size:var(--tmd-code-fs);font-weight:var(--tmd-code-fw);font-style:var(--tmd-code-fst);color:var(--tmd-code-col);padding:0.1em 0.25em;border-radius:0.2rem;background:var(--tmd-code-bg);text-align:var(--tmd-code-ta);text-transform:var(--tmd-code-tt);line-height:var(--tmd-code-lh);transform:var(--tmd-code-tx);}',
            S + '.text-md-root pre code{padding:0;background:transparent;}',
            S + '.text-md-root .text-md-block{display:block;margin-bottom:var(--text-md-block-typography-block-space,8px);padding:6px 10px;border-radius:6px;word-break:break-word;white-space:normal;box-sizing:border-box;box-shadow:0 1px 2px rgba(0,0,0,0.02);transition:transform 0.1s ease, box-shadow 0.1s ease;}',
            S + '.text-md-root.text-md-nowrap p,' + S + '.text-md-root.text-md-nowrap h1,' + S + '.text-md-root.text-md-nowrap h2,' + S + '.text-md-root.text-md-nowrap h3,' + S + '.text-md-root.text-md-nowrap h4,' + S + '.text-md-root.text-md-nowrap h5,' + S + '.text-md-root.text-md-nowrap h6,' + S + '.text-md-root.text-md-nowrap li,' + S + '.text-md-root.text-md-nowrap td,' + S + '.text-md-root.text-md-nowrap th,' + S + '.text-md-root.text-md-nowrap .text-md-block{white-space:nowrap;word-break:normal;overflow-wrap:normal;}',
            S + '.text-md-root .text-md-block:last-child{margin-bottom:0;}',
            S + '.text-md-root .text-md-block:hover{transform:translateY(-1px);box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);}',
            S + '.text-md-root .text-md-block.text-md-block-1{border:1px solid var(--text-md-block-1-border,transparent);background:var(--text-md-block-1-bg,transparent);border-left:4px solid var(--text-md-block-1-solid,transparent);}',
            S + '.text-md-root .text-md-block.text-md-block-2{border:1px solid var(--text-md-block-2-border,transparent);background:var(--text-md-block-2-bg,transparent);border-left:4px solid var(--text-md-block-2-solid,transparent);}',
            S + '.text-md-root .text-md-block.text-md-block-3{border:1px solid var(--text-md-block-3-border,transparent);background:var(--text-md-block-3-bg,transparent);border-left:4px solid var(--text-md-block-3-solid,transparent);}',
            S + '.text-md-root .text-md-block.text-md-block-4{border:1px solid var(--text-md-block-4-border,transparent);background:var(--text-md-block-4-bg,transparent);border-left:4px solid var(--text-md-block-4-solid,transparent);}',
            S + '.text-md-root table.text-md-table{width:100%;box-sizing:border-box;background:var(--text-md-tr-bg,transparent);}',
            S + '.text-md-root table.text-md-table th{padding:var(--text-md-table-cell-padding,10px);vertical-align:top;}',
            S + '.text-md-root table.text-md-table td{padding-top:calc(var(--text-md-table-cell-padding, 10px) + var(--text-md-td-block-space, 0px) / 2);padding-bottom:calc(var(--text-md-table-cell-padding, 10px) + var(--text-md-td-block-space, 0px) / 2);padding-left:var(--text-md-table-cell-padding, 10px);padding-right:var(--text-md-table-cell-padding, 10px);vertical-align:top;}',
            S + '.text-md-root table.text-md-table--minimal,' + S + '.text-md-root table.text-md-table--grid,' + S + '.text-md-root table.text-md-table--zebra,' + S + '.text-md-root table.text-md-table--solid_header,' + S + '.text-md-root table.text-md-table--compact,' + S + '.text-md-root table.text-md-table--timeline,' + S + '.text-md-root table.text-md-table--col_zebra,' + S + '.text-md-root table.text-md-table--dashed,' + S + '.text-md-root table.text-md-table--outline,' + S + '.text-md-root table.text-md-table--receipt,' + S + '.text-md-root table.text-md-table--side_header,' + S + '.text-md-root table.text-md-table--double_lined,' + S + '.text-md-root table.text-md-table--calendar,' + S + '.text-md-root table.text-md-table--week_planner,' + S + '.text-md-root table.text-md-table--month_view{border-radius:var(--text-md-table-radius,5px);overflow:hidden;}',
            S + '.text-md-root table.text-md-table--borderless th{border:none;background:var(--text-md-tr-bg);}',
            S + '.text-md-root table.text-md-table--borderless td{border:none;background:var(--text-md-tr-bg);}',
            S + '.text-md-root table.text-md-table--minimal{border-collapse:separate;border-spacing:0;}',
            S + '.text-md-root table.text-md-table--minimal th{border:none;border-bottom:1px solid var(--text-md-separator-color,var(--text-md-table-border));background:var(--text-md-tr-bg);}',
            S + '.text-md-root table.text-md-table--minimal td{border:none;border-bottom:1px solid var(--text-md-separator-color,var(--text-md-table-border));background:var(--text-md-tr-bg);}',
            S + '.text-md-root table.text-md-table--minimal tr:last-child td{border-bottom:none;}',
            S + '.text-md-root table.text-md-table--grid{border-collapse:separate;border-spacing:0;border:1px solid var(--text-md-table-border);}',
            S + '.text-md-root table.text-md-table--grid th,' + S + '.text-md-root table.text-md-table--grid td{border:none;border-right:1px solid var(--text-md-table-border);border-bottom:1px solid var(--text-md-table-border);}',
            S + '.text-md-root table.text-md-table--grid th:last-child,' + S + '.text-md-root table.text-md-table--grid td:last-child{border-right:none;}',
            S + '.text-md-root table.text-md-table--grid tr:last-child td{border-bottom:none;}',
            S + '.text-md-root table.text-md-table--zebra{border-collapse:separate;border-spacing:0;}',
            S + '.text-md-root table.text-md-table--zebra th,' + S + '.text-md-root table.text-md-table--zebra td{border-bottom:1px solid var(--text-md-separator-color,var(--text-md-table-border));}',
            S + '.text-md-root table.text-md-table--zebra tbody tr:nth-child(odd) td{background:var(--text-md-tr-bg);}',
            S + '.text-md-root table.text-md-table--zebra tbody tr:nth-child(even) td{background:var(--text-md-tr-alt);}',
            S + '.text-md-root table.text-md-table--solid_header{border-collapse:separate;border-spacing:0;}',
            S + '.text-md-root table.text-md-table--solid_header thead th{background:var(--text-md-th-bg);border-bottom:1px solid var(--text-md-separator-color,var(--text-md-table-border));}',
            S + '.text-md-root table.text-md-table--solid_header tbody td{border-bottom:1px solid var(--text-md-separator-color,var(--text-md-table-border));background:var(--text-md-tr-bg);}',
            S + '.text-md-root table.text-md-table--solid_header tbody tr:last-child td{border-bottom:none;}',
            S + '.text-md-root table.text-md-table--card_rows{border-collapse:separate;border-spacing:0 8px;width:100%;background:transparent;}',
            S + '.text-md-root table.text-md-table--card_rows thead th{background:var(--text-md-th-bg);border:1px solid var(--text-md-table-border);padding:var(--text-md-table-cell-padding,10px);}',
            S + '.text-md-root table.text-md-table--card_rows thead th:first-child{border-radius:6px 0 0 6px;}',
            S + '.text-md-root table.text-md-table--card_rows thead th:last-child{border-radius:0 6px 6px 0;}',
            S + '.text-md-root table.text-md-table--card_rows thead th:only-child{border-radius:6px;}',
            S + '.text-md-root table.text-md-table--card_rows tbody td{background:var(--text-md-tr-bg);border:1px solid var(--text-md-table-border);padding:var(--text-md-table-cell-padding,10px);vertical-align:top;}',
            S + '.text-md-root table.text-md-table--card_rows tbody tr td:first-child{border-radius:6px 0 0 6px;}',
            S + '.text-md-root table.text-md-table--card_rows tbody tr td:last-child{border-radius:0 6px 6px 0;}',
            S + '.text-md-root table.text-md-table--card_rows tbody tr td:only-child{border-radius:6px;}',
            S + '.text-md-root table.text-md-table--calendar{border-collapse:separate;border-spacing:0;border:1px solid var(--text-md-table-border);table-layout:fixed;width:100%;}',
            S + '.text-md-root table.text-md-table--calendar thead th{background:var(--text-md-th-bg);font-weight:600;text-align:center;padding:var(--text-md-table-cell-padding,10px);border:none;border-right:1px solid var(--text-md-table-border);border-bottom:1px solid var(--text-md-table-border);width:14.28%;}',
            S + '.text-md-root table.text-md-table--calendar tbody td{border:none;border-right:1px solid var(--text-md-table-border);border-bottom:1px solid var(--text-md-table-border);padding:var(--text-md-table-cell-padding,10px);width:14.28%;min-height:52px;vertical-align:top;text-align:left;}',
            S + '.text-md-root table.text-md-table--calendar th:last-child,' + S + '.text-md-root table.text-md-table--calendar td:last-child{border-right:none;}',
            S + '.text-md-root table.text-md-table--calendar tr:last-child td{border-bottom:none;}',
            S + '.text-md-root table.text-md-table--week_planner{border-collapse:separate;border-spacing:0;border:1px solid var(--text-md-table-border);width:100%;table-layout:fixed;}',
            S + '.text-md-root table.text-md-table--week_planner thead th{background:var(--text-md-th-bg);font-weight:700;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;padding:var(--text-md-table-cell-padding,10px);border:none;border-right:1px solid var(--text-md-table-border);border-bottom:1px solid var(--text-md-table-border);text-align:center;vertical-align:middle;line-height:1.25;}',
            S + '.text-md-root table.text-md-table--week_planner tbody td{border:none;border-right:1px solid var(--text-md-table-border);border-bottom:1px solid var(--text-md-table-border);padding:var(--text-md-table-cell-padding,10px);min-height:104px;vertical-align:top;text-align:left;background:var(--text-md-tr-bg);line-height:1.4;}',
            S + '.text-md-root table.text-md-table--week_planner th:last-child,' + S + '.text-md-root table.text-md-table--week_planner td:last-child{border-right:none;}',
            S + '.text-md-root table.text-md-table--week_planner tr:last-child td{border-bottom:none;}',
            S + '.text-md-root table.text-md-table--month_view{border-collapse:separate;border-spacing:0;border:1px solid var(--text-md-table-border);table-layout:fixed;width:100%;}',
            S + '.text-md-root table.text-md-table--month_view thead th{background:var(--text-md-th-bg);border:none;border-right:1px solid var(--text-md-table-border);border-bottom:1px solid var(--text-md-table-border);padding:var(--text-md-table-cell-padding,10px);font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;line-height:1.2;text-align:center;vertical-align:middle;}',
            S + '.text-md-root table.text-md-table--month_view tbody td{border:none;border-right:1px solid var(--text-md-table-border);border-bottom:1px solid var(--text-md-table-border);min-height:92px;vertical-align:top;padding:var(--text-md-table-cell-padding,10px);background:var(--text-md-tr-bg);text-align:left;line-height:1.35;}',
            S + '.text-md-root table.text-md-table--month_view th:last-child,' + S + '.text-md-root table.text-md-table--month_view td:last-child{border-right:none;}',
            S + '.text-md-root table.text-md-table--month_view tr:last-child td{border-bottom:none;}',
            S + '.text-md-root table.text-md-table--compact{border-collapse:separate;border-spacing:0;}',
            S + '.text-md-root table.text-md-table--compact th,' + S + '.text-md-root table.text-md-table--compact td{padding:var(--text-md-table-cell-padding,10px);border-bottom:1px solid var(--text-md-separator-color,var(--text-md-table-border));font-size:0.85em;}',
            S + '.text-md-root table.text-md-table--compact tr:last-child td,' + S + '.text-md-root table.text-md-table--compact tr:last-child th{border-bottom:none;}',
            S + '.text-md-root table.text-md-table--timeline{border-collapse:separate;border-spacing:0;}',
            S + '.text-md-root table.text-md-table--timeline th,' + S + '.text-md-root table.text-md-table--timeline td{border:none;border-bottom:none;}',
            S + '.text-md-root table.text-md-table--timeline td:first-child,' + S + '.text-md-root table.text-md-table--timeline th:first-child{text-align:right;width:25%;border-right:2px solid var(--text-md-separator-color,var(--text-md-table-border));padding-right:16px;}',
            S + '.text-md-root table.text-md-table--timeline td:not(:first-child),' + S + '.text-md-root table.text-md-table--timeline th:not(:first-child){padding-left:16px;}',
            S + '.text-md-root table.text-md-table--col_zebra{border-collapse:separate;border-spacing:0;}',
            S + '.text-md-root table.text-md-table--col_zebra th,' + S + '.text-md-root table.text-md-table--col_zebra td{border-bottom:1px solid var(--text-md-separator-color,var(--text-md-table-border));}',
            S + '.text-md-root table.text-md-table--col_zebra th:nth-child(odd),' + S + '.text-md-root table.text-md-table--col_zebra td:nth-child(odd){background:var(--text-md-tr-bg);}',
            S + '.text-md-root table.text-md-table--col_zebra th:nth-child(even),' + S + '.text-md-root table.text-md-table--col_zebra td:nth-child(even){background:var(--text-md-tr-alt);}',
            S + '.text-md-root table.text-md-table--dashed{border-collapse:separate;border-spacing:0;}',
            S + '.text-md-root table.text-md-table--dashed th,' + S + '.text-md-root table.text-md-table--dashed td{border-bottom:1px dashed var(--text-md-separator-color,var(--text-md-table-border));padding:var(--text-md-table-cell-padding,10px);}',
            S + '.text-md-root table.text-md-table--dashed tr:last-child td,' + S + '.text-md-root table.text-md-table--dashed tr:last-child th{border-bottom:none;}',
            S + '.text-md-root table.text-md-table--pills{border-collapse:separate;border-spacing:0 10px;width:100%;background:transparent;}',
            S + '.text-md-root table.text-md-table--pills th,' + S + '.text-md-root table.text-md-table--pills td{background:var(--text-md-tr-bg);padding:var(--text-md-table-cell-padding,10px);}',
            S + '.text-md-root table.text-md-table--pills th:first-child,' + S + '.text-md-root table.text-md-table--pills td:first-child{border-radius:999px 0 0 999px;}',
            S + '.text-md-root table.text-md-table--pills th:last-child,' + S + '.text-md-root table.text-md-table--pills td:last-child{border-radius:0 999px 999px 0;}',
            S + '.text-md-root table.text-md-table--pills th:only-child,' + S + '.text-md-root table.text-md-table--pills td:only-child{border-radius:999px;}',
            S + '.text-md-root table.text-md-table--outline{border-collapse:separate;border-spacing:0;border:2px solid var(--text-md-table-border);}',
            S + '.text-md-root table.text-md-table--outline th,' + S + '.text-md-root table.text-md-table--outline td{border:none;}',
            S + '.text-md-root table.text-md-table--receipt{border-collapse:separate;border-spacing:0;border-top:2px solid var(--text-md-table-border);border-bottom:2px solid var(--text-md-table-border);}',
            S + '.text-md-root table.text-md-table--receipt th,' + S + '.text-md-root table.text-md-table--receipt td{border-bottom:1px dotted var(--text-md-separator-color,var(--text-md-table-border));padding:var(--text-md-table-cell-padding,10px);}',
            S + '.text-md-root table.text-md-table--receipt tr:last-child td,' + S + '.text-md-root table.text-md-table--receipt tr:last-child th{border-bottom:none;}',
            S + '.text-md-root table.text-md-table--receipt td:last-child,' + S + '.text-md-root table.text-md-table--receipt th:last-child{text-align:right;}',
            S + '.text-md-root table.text-md-table--side_header{border-collapse:separate;border-spacing:0;}',
            S + '.text-md-root table.text-md-table--side_header th,' + S + '.text-md-root table.text-md-table--side_header td{border-bottom:1px solid var(--text-md-separator-color,var(--text-md-table-border));}',
            S + '.text-md-root table.text-md-table--side_header td:first-child,' + S + '.text-md-root table.text-md-table--side_header th:first-child{background:var(--text-md-th-bg);font-weight:bold;}',
            S + '.text-md-root table.text-md-table--double_lined{border-collapse:separate;border-spacing:0;}',
            S + '.text-md-root table.text-md-table--double_lined th,' + S + '.text-md-root table.text-md-table--double_lined td{border-bottom:3px double var(--text-md-separator-color,var(--text-md-table-border));padding:var(--text-md-table-cell-padding,10px);}',
            S + '.text-md-root table.text-md-table--double_lined tr:last-child td,' + S + '.text-md-root table.text-md-table--double_lined tr:last-child th{border-bottom:none;}',
            S + '.text-md-root table.text-md-table--kanban_columns{border-collapse:separate;border-spacing:14px 0;width:100%;table-layout:fixed;background:transparent;}',
            S + '.text-md-root table.text-md-table--kanban_columns thead th{border-radius:12px 12px 0 0;border:1px solid var(--text-md-table-border);border-bottom:none;padding:var(--text-md-table-cell-padding,10px);background:var(--text-md-th-bg);font-weight:700;text-align:center;vertical-align:middle;box-shadow:0 2px 0 var(--text-md-table-border);}',
            S + '.text-md-root table.text-md-table--kanban_columns tbody td{border-radius:0;border-left:1px solid var(--text-md-table-border);border-right:1px solid var(--text-md-table-border);border-top:none;border-bottom:none;padding:var(--text-md-table-cell-padding,10px);background:var(--text-md-tr-bg);vertical-align:top;min-height:88px;line-height:1.4;}',
            S + '.text-md-root table.text-md-table--kanban_columns tbody tr:last-child td{border-radius:0 0 12px 12px;border-bottom:1px solid var(--text-md-table-border);}',
            S + '.text-md-root table.text-md-table--bubble_grid{border-collapse:separate;border-spacing:10px;width:100%;background:transparent;}',
            S + '.text-md-root table.text-md-table--bubble_grid th,' + S + '.text-md-root table.text-md-table--bubble_grid td{border-radius:16px;border:1px solid var(--text-md-table-border);padding:var(--text-md-table-cell-padding,10px);background:var(--text-md-tr-bg);vertical-align:top;line-height:1.4;}',
            S + '.text-md-root table.text-md-table--bubble_grid thead th{background:var(--text-md-th-bg);font-weight:700;text-align:center;}',
            S + '.text-md-root table.text-md-table--stat_strip{border-collapse:separate;border-spacing:0;width:100%;}',
            S + '.text-md-root table.text-md-table--stat_strip thead th{text-align:center;padding:var(--text-md-table-cell-padding,10px);font-size:0.65rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;background:var(--text-md-th-bg);border:none;border-right:1px solid var(--text-md-separator-color,var(--text-md-table-border));line-height:1.3;}',
            S + '.text-md-root table.text-md-table--stat_strip thead th:last-child{border-right:none;}',
            S + '.text-md-root table.text-md-table--stat_strip tbody td{text-align:center;padding:var(--text-md-table-cell-padding,10px);font-size:1.12rem;font-weight:600;background:var(--text-md-tr-bg);border:none;border-right:1px solid var(--text-md-separator-color,var(--text-md-table-border));vertical-align:top;line-height:1.25;}',
            S + '.text-md-root table.text-md-table--stat_strip tbody td:last-child{border-right:none;}',
            S + '.text-md-root table.text-md-table--ledger_rail{border-collapse:separate;border-spacing:0;width:100%;}',
            S + '.text-md-root table.text-md-table--ledger_rail th:first-child,' + S + '.text-md-root table.text-md-table--ledger_rail td:first-child{width:30%;max-width:240px;border-right:4px solid var(--text-md-separator-color,var(--text-md-table-border));background:var(--text-md-tr-alt);font-weight:600;text-align:left;padding:var(--text-md-table-cell-padding,10px);vertical-align:top;}',
            S + '.text-md-root table.text-md-table--ledger_rail th:not(:first-child),' + S + '.text-md-root table.text-md-table--ledger_rail td:not(:first-child){padding:var(--text-md-table-cell-padding,10px);border-bottom:1px solid var(--text-md-separator-color,var(--text-md-table-border));vertical-align:top;line-height:1.4;}',
            S + '.text-md-root table.text-md-table--ledger_rail tbody tr:last-child td{border-bottom:none;}',
            S + '.text-md-root table.text-md-table--inset_cells{border-collapse:separate;border-spacing:0;width:100%;}',
            S + '.text-md-root table.text-md-table--inset_cells th,' + S + '.text-md-root table.text-md-table--inset_cells td{border:1px solid var(--text-md-table-border);padding:var(--text-md-table-cell-padding,10px);background:var(--text-md-tr-bg);box-shadow:inset 0 2px 6px var(--text-md-table-border);vertical-align:top;line-height:1.4;}',
            S + '.text-md-root table.text-md-table--inset_cells thead th{background:var(--text-md-th-bg);font-weight:700;box-shadow:inset 0 -2px 0 var(--text-md-table-border);}',
            S + '.text-md-root table.text-md-table--neon_row{border-collapse:separate;border-spacing:0;width:100%;}',
            S + '.text-md-root table.text-md-table--neon_row th,' + S + '.text-md-root table.text-md-table--neon_row td{border-bottom:1px solid var(--text-md-separator-color,var(--text-md-table-border));padding:var(--text-md-table-cell-padding,10px);vertical-align:top;line-height:1.4;}',
            S + '.text-md-root table.text-md-table--neon_row thead th{background:var(--text-md-th-bg);font-weight:700;border-bottom:2px solid var(--text-md-separator-color,var(--text-md-table-border));}',
            S + '.text-md-root table.text-md-table--neon_row tbody tr:nth-child(odd) td{background:var(--text-md-tr-bg);}',
            S + '.text-md-root table.text-md-table--neon_row tbody tr:nth-child(even) td{background:var(--text-md-tr-alt);box-shadow:inset 3px 0 0 0 var(--text-md-table-border);}',
            S + '.text-md-root.text-md-scoped table.text-md-table td{padding-top:calc(var(--text-md-table-cell-padding, 10px) + var(--text-md-td-block-space, 0px) / 2);padding-bottom:calc(var(--text-md-table-cell-padding, 10px) + var(--text-md-td-block-space, 0px) / 2);padding-left:var(--text-md-table-cell-padding, 10px);padding-right:var(--text-md-table-cell-padding, 10px);}',
            S + '.text-md-root p,' + S + '.text-md-root li{font-family:var(--tmd-p-ff);font-size:var(--tmd-p-fs);font-weight:var(--tmd-p-fw);font-style:var(--tmd-p-fst);color:var(--tmd-p-col);text-align:var(--tmd-p-ta);text-transform:var(--tmd-p-tt);line-height:var(--tmd-p-lh);margin-left:var(--tmd-p-ml,0px);transform:var(--tmd-p-txb,none);}',
            S + '.text-md-root h1{font-family:var(--tmd-h1-ff);font-size:var(--tmd-h1-fs);font-weight:var(--tmd-h1-fw);font-style:var(--tmd-h1-fst);color:var(--tmd-h1-col);text-align:var(--tmd-h1-ta);text-transform:var(--tmd-h1-tt);line-height:var(--tmd-h1-lh);margin-left:var(--tmd-h1-ml,0px);transform:var(--tmd-h1-txb,none);}',
            S + '.text-md-root h2{font-family:var(--tmd-h2-ff);font-size:var(--tmd-h2-fs);font-weight:var(--tmd-h2-fw);font-style:var(--tmd-h2-fst);color:var(--tmd-h2-col);text-align:var(--tmd-h2-ta);text-transform:var(--tmd-h2-tt);line-height:var(--tmd-h2-lh);margin-left:var(--tmd-h2-ml,0px);transform:var(--tmd-h2-txb,none);}',
            S + '.text-md-root h3,' + S + '.text-md-root h4,' + S + '.text-md-root h5,' + S + '.text-md-root h6{font-family:var(--tmd-h3-ff);font-size:var(--tmd-h3-fs);font-weight:var(--tmd-h3-fw);font-style:var(--tmd-h3-fst);color:var(--tmd-h3-col);text-align:var(--tmd-h3-ta);text-transform:var(--tmd-h3-tt);line-height:var(--tmd-h3-lh);margin-left:var(--tmd-h3-ml,0px);transform:var(--tmd-h3-txb,none);}',
            S + '.text-md-root .text-md-block,' + S + '.text-md-root .text-md-block p,' + S + '.text-md-root .text-md-block li{font-family:var(--tmd-blk-ff);font-size:var(--tmd-blk-fs);font-weight:var(--tmd-blk-fw);font-style:var(--tmd-blk-fst);color:var(--tmd-blk-col);text-align:var(--tmd-blk-ta);text-transform:var(--tmd-blk-tt);line-height:var(--tmd-blk-lh);margin-left:var(--tmd-blk-ml,0px);transform:var(--tmd-blk-txb,none);}',
            S + '.text-md-root table.text-md-table td[data-md-align="left"],' + S + '.text-md-root table.text-md-table th[data-md-align="left"]{text-align:left;}',
            S + '.text-md-root table.text-md-table td[data-md-align="center"],' + S + '.text-md-root table.text-md-table th[data-md-align="center"]{text-align:center;}',
            S + '.text-md-root table.text-md-table td[data-md-align="right"],' + S + '.text-md-root table.text-md-table th[data-md-align="right"]{text-align:right;}',
            S + '.text-md-root.text-md-global-align p,' + S + '.text-md-root.text-md-global-align h1,' + S + '.text-md-root.text-md-global-align h2,' + S + '.text-md-root.text-md-global-align h3,' + S + '.text-md-root.text-md-global-align h4,' + S + '.text-md-root.text-md-global-align h5,' + S + '.text-md-root.text-md-global-align h6,' + S + '.text-md-root.text-md-global-align li,' + S + '.text-md-root.text-md-global-align .text-md-block{text-align:var(--tmd-global-ta);}',
            S + '.text-md-root.text-md-global-case p,' + S + '.text-md-root.text-md-global-case h1,' + S + '.text-md-root.text-md-global-case h2,' + S + '.text-md-root.text-md-global-case h3,' + S + '.text-md-root.text-md-global-case h4,' + S + '.text-md-root.text-md-global-case h5,' + S + '.text-md-root.text-md-global-case h6,' + S + '.text-md-root.text-md-global-case li,' + S + '.text-md-root.text-md-global-case .text-md-block{text-transform:var(--tmd-global-tt);}'
        ].concat(TextWidget._mdCalendarWeekendScopedRows(S)).join('');
    }

    /** Combine any CSS color format with a 0-100 opacity value. */
    static resolveMarkdownColorWithOpacity(color, opacityPercent) {
        const raw = color == null ? '' : String(color).trim();
        if (!raw || raw.toLowerCase() === 'transparent') return 'transparent';
        const resolved = BaseWidget.resolveCssColor(raw);
        const opRaw = opacityPercent !== undefined && opacityPercent !== null ? Number(opacityPercent) : 100;
        const op = Number.isFinite(opRaw) ? Math.max(0, Math.min(100, opRaw)) : 100;
        if (op <= 0) return 'transparent';
        if (typeof ColorUtils === 'undefined' || !ColorUtils || typeof ColorUtils.parse !== 'function' || typeof ColorUtils.toCss !== 'function') {
            return resolved;
        }
        const hsv = ColorUtils.parse(resolved);
        if (!hsv) return resolved;
        // Opacity setting is the final alpha (not multiplied with source alpha),
        // so defaults with embedded alpha (e.g. rgba(...,0.05)) still respect the configured slider exactly.
        hsv.a = Math.max(0, Math.min(1, op / 100));
        return ColorUtils.toCss(hsv);
    }

    static get AUDIO_TRIGGERS() {
        return [
            { key: 'textChange', label: 'On Text Change' }
        ];
    }

    getDefaultOverrides() {
        return {
            text: '# :ph-text-t: Text Widget\n*Open the "**Text Settings**" panel to edit this content.*',
            label: '',
            textAlign: 'typography',
            labelCase: 'typography',
            dropShadowOpacity: 0,
            dropShadowColor: '@overlay',
            dropShadowBlur: 1,
            typography: {
                widgetLabel: {},
                mdParagraph: {},
                mdH1: {},
                mdH2: {},
                mdH3: {},
                mdTh: {},
                mdTableText: {},
                mdBlockTypography: {},
                mdCode: {}
            },
            audio: (typeof DashboardAudio !== 'undefined' && DashboardAudio.defaultAudio)
                ? DashboardAudio.defaultAudio(TextWidget.AUDIO_TRIGGERS)
                : { textChange: '' }

        };
    }

    get config() {
        const c = super.config;
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};

        c.textVerticalAlign = c.textVerticalAlign || c.defaultTextVerticalAlign || 'middle';

        TextWidget.applyTypographyNestedToConfig(c);
        BaseWidget.applyTypographyNestedToConfig(c, [['widgetLabel', 'textWidgetLabel']]);
        TextWidget.fillTextTypographyDefaults(c);
        BaseWidget.fillWidgetLabelTypographyResolved(c, M, 'textWidgetLabel');

        c.text = c.text !== undefined && c.text !== null ? String(c.text) : '';
        c.label = c.label != null ? String(c.label) : '';
        c.textRotation = c.textRotation !== undefined && c.textRotation !== null ? c.textRotation : 0;
        c.textOffX = c.textOffX !== undefined && c.textOffX !== null ? c.textOffX : 0;
        c.textOffY = c.textOffY !== undefined && c.textOffY !== null ? c.textOffY : 0;

        const self = this;
        const resolveMd = function (instanceKey, masterKey, hardDefault) {
            const masterVal = M[masterKey] !== undefined && M[masterKey] !== null ? M[masterKey] : hardDefault;
            const resolved = self.resolveValuePreservingThemeRef(instanceKey, masterVal);
            if (resolved === undefined || resolved === null || resolved === '') return masterVal;
            return resolved;
        };
        const resolveMdOpacity = function (instanceKey, masterKey, hardDefault) {
            const v = resolveMd(instanceKey, masterKey, hardDefault);
            const n = Number(v);
            if (!Number.isFinite(n)) return hardDefault;
            return Math.max(0, Math.min(100, n));
        };
        const resolveMdInt = function (instanceKey, masterKey, hardDefault, minVal, maxVal) {
            const v = resolveMd(instanceKey, masterKey, hardDefault);
            const n = parseInt(String(v), 10);
            if (isNaN(n)) return hardDefault;
            return Math.max(minVal, Math.min(maxVal, n));
        };
        const hasOwnNonEmptyOverride = function (key) {
            return self.overrides[key] !== undefined && self.overrides[key] !== null && self.overrides[key] !== '';
        };
        // Canonical-first default chain:
        // - Prefer canonical keys (instance -> master -> hard default)
        // - Accept legacy keys only when they are explicitly set on this widget instance
        // This prevents stale legacy master keys from silently overriding canonical defaults.
        const resolveMdCanonicalWithLegacyInstance = function (canonical) {
            if (!canonical || !canonical.instanceKey || !canonical.masterKey) return undefined;
            if (hasOwnNonEmptyOverride(canonical.instanceKey)) {
                return resolveMd(canonical.instanceKey, canonical.masterKey, canonical.hardDefault);
            }
            if (canonical.legacyInstanceKey && hasOwnNonEmptyOverride(canonical.legacyInstanceKey)) {
                return resolveMd(
                    canonical.legacyInstanceKey,
                    canonical.legacyMasterKey || canonical.masterKey,
                    canonical.legacyHardDefault !== undefined ? canonical.legacyHardDefault : canonical.hardDefault
                );
            }
            return resolveMd(canonical.instanceKey, canonical.masterKey, canonical.hardDefault);
        };
        const resolveMdOpacityCanonicalWithLegacyInstance = function (canonical) {
            const v = resolveMdCanonicalWithLegacyInstance(canonical);
            const n = Number(v);
            if (!Number.isFinite(n)) return canonical && canonical.hardDefault !== undefined ? canonical.hardDefault : 0;
            return Math.max(0, Math.min(100, n));
        };
        c.mdTableStyle = resolveMd('mdTableStyle', 'textMdTableStyle', 'minimal');
        {
            const rawWs = resolveMd('mdCalendarWeekStart', 'textMdCalendarWeekStart', 'auto');
            let wsl = String(rawWs == null ? '' : rawWs).toLowerCase();
            if (!wsl || wsl === 'auto') {
                wsl = (typeof DashboardI18n !== 'undefined' && typeof DashboardI18n.getEffectiveFirstDayOfWeek === 'function')
                    ? DashboardI18n.getEffectiveFirstDayOfWeek()
                    : 'monday';
            }
            c.mdCalendarWeekStart = (wsl === 'sunday' || wsl === 'saturday' || wsl === 'monday') ? wsl : 'monday';
        }
        c.mdTableBorderRadius = resolveMdInt('mdTableBorderRadius', 'textMdTableBorderRadius', 5, 0, 64);
        c.mdTableCellPadding = resolveMdInt('mdTableCellPadding', 'textMdTableCellPadding', 10, 0, 64);
        c.mdTableBorderColor = resolveMd('mdTableBorderColor', 'textMdTableBorderColor', '@border');
        c.mdTableBorderOpacity = resolveMdOpacity('mdTableBorderOpacity', 'textMdTableBorderOpacity', 100);
        c.mdSeparatorColor = resolveMd('mdSeparatorColor', 'textMdSeparatorColor', c.mdTableBorderColor);
        c.mdSeparatorOpacity = resolveMdOpacity('mdSeparatorOpacity', 'textMdSeparatorOpacity', c.mdTableBorderOpacity);
        c.mdTableHeaderBg = resolveMd('mdTableHeaderBg', 'textMdTableHeaderBg', '@accentSoft');
        c.mdTableHeaderBgOpacity = resolveMdOpacity('mdTableHeaderBgOpacity', 'textMdTableHeaderBgOpacity', 100);
        c.mdTableHeaderAccentBg = resolveMd('mdTableHeaderAccentBg', 'textMdTableHeaderAccentBg', '@accent');
        c.mdTableHeaderAccentBgOpacity = resolveMdOpacity('mdTableHeaderAccentBgOpacity', 'textMdTableHeaderAccentBgOpacity', 100);
        c.mdTableRowBg = resolveMdCanonicalWithLegacyInstance({
            instanceKey: 'mdTableRowBg',
            masterKey: 'textMdTableRowBg',
            hardDefault: '@surfaceAlt',
            legacyInstanceKey: 'mdTableBackgroundColor',
            legacyMasterKey: 'textMdTableBackgroundColor',
            legacyHardDefault: 'transparent'
        });
        c.mdTableRowBgOpacity = resolveMdOpacityCanonicalWithLegacyInstance({
            instanceKey: 'mdTableRowBgOpacity',
            masterKey: 'textMdTableRowBgOpacity',
            hardDefault: 40,
            legacyInstanceKey: 'mdTableBackgroundOpacity',
            legacyMasterKey: 'textMdTableBackgroundOpacity',
            legacyHardDefault: 100
        });
        c.mdTableRowAltBg = resolveMd('mdTableRowAltBg', 'textMdTableRowAltBg', '@surface');
        c.mdTableRowAltBgOpacity = resolveMdOpacity('mdTableRowAltBgOpacity', 'textMdTableRowAltBgOpacity', 40);
        c.mdHrColor = resolveMd('mdHrColor', 'textMdHrColor', '@border');
        c.mdHrOpacity = resolveMdOpacity('mdHrOpacity', 'textMdHrOpacity', 100);
        c.mdIconColor = resolveMd('mdIconColor', 'textMdIconColor', '@icon');
        c.mdIconOpacity = resolveMdOpacity('mdIconOpacity', 'textMdIconOpacity', 100);
        {
            const rawW = resolveMd('mdIconWeight', 'textMdIconWeight', 'regular');
            c.mdIconWeight = TextWidget.normalizeMarkdownIconWeight(rawW);
        }
        c.mdIconAccentColor = resolveMd('mdIconAccentColor', 'textMdIconAccentColor', '@iconAccent');
        c.mdIconAccentOpacity = resolveMdOpacity('mdIconAccentOpacity', 'textMdIconAccentOpacity', 100);
        c.mdBlock1Color = resolveMd('mdBlock1Color', 'textMdBlock1Color', '@markerTint1');
        c.mdBlock2Color = resolveMd('mdBlock2Color', 'textMdBlock2Color', '@markerTint2');
        c.mdBlock3Color = resolveMd('mdBlock3Color', 'textMdBlock3Color', '@markerTint3');
        c.mdBlock4Color = resolveMd('mdBlock4Color', 'textMdBlock4Color', '@markerTint4');
        c.dropShadowOpacity = resolveMdOpacity('dropShadowOpacity', null, 0);
        c.dropShadowColor = resolveMd('dropShadowColor', null, '@overlay');
        c.dropShadowBlur = resolveMdInt('dropShadowBlur', null, 1, 0, 100);
        c.mdTextWrap = resolveMd('mdTextWrap', 'textMdTextWrap', true) !== false;
        c.mdLinkTarget = resolveMd('mdLinkTarget', 'textMdLinkTarget', 'markdown');
        c.mdAutoFitText = this.resolveValue('mdAutoFitText', M.textMdAutoFitText === true) === true;
        c.mdOverflowScroll = this.resolveValue('mdOverflowScroll', M.textMdOverflowScroll === true) === true;
        if (typeof TextScroll !== 'undefined' && TextScroll.normalizeConfig) {
            c.textScroll = this.resolveValue('textScroll', TextScroll.DIR_NONE);
            c.textScrollMotion = this.resolveValue('textScrollMotion', TextScroll.MOTION_LOOP);
            c.textScrollSpeed = this.resolveValue('textScrollSpeed', TextScroll.SPEED_DEFAULT);
            c.textScrollReverse = this.resolveValue('textScrollReverse', false) === true;
            c.textScrollOverflowOnly = this.resolveValue('textScrollOverflowOnly', true) !== false;
            c.textScrollGap = this.resolveValue('textScrollGap', TextScroll.GAP_DEFAULT);
            c.textScrollHold = this.resolveValue('textScrollHold', TextScroll.HOLD_DEFAULT);
            c.textScrollFade = this.resolveValue('textScrollFade', TextScroll.FADE_DEFAULT);
            TextScroll.normalizeConfig(c);
        } else {
            c.textScroll = 'none';
            c.textScrollMotion = 'loop';
            c.textScrollSpeed = 50;
            c.textScrollReverse = false;
            c.textScrollOverflowOnly = true;
            c.textScrollGap = 48;
            c.textScrollHold = 1;
            c.textScrollFade = 0.2;
        }
        var textScrollOn = c.textScroll === 'horizontal' || c.textScroll === 'vertical';
        if (textScrollOn) {
            c.mdAutoFitText = false;
            c.mdOverflowScroll = false;
            c.contentAnimation = 'none';
        } else if (c.mdOverflowScroll) {
            c.mdAutoFitText = false;
        } else if (c.mdAutoFitText) {
            c.mdOverflowScroll = false;
        }
        {
            const modeRaw = this.resolveValue('mdTableColumnWidthMode', TextWidget.TABLE_COLUMN_WIDTH_MODE_AUTO);
            c.mdTableColumnWidthMode = TextWidget.normalizeTableColumnWidthMode(modeRaw);
        }
        {
            const vPx = this.resolveValue('mdTableColumnWidthPx', 0);
            const pNum = vPx !== undefined && vPx !== null && vPx !== '' ? parseInt(String(vPx), 10) : 0;
            c.mdTableColumnWidthPx = isNaN(pNum) || pNum < 0 ? 0 : pNum;
        }
        {
            const rawCustom = this.resolveValue('mdTableCustomColumnWidths', null);
            const srcCols = rawCustom && rawCustom.columns;
            c.mdTableCustomColumnWidths = { columns: TextWidget._coerceCustomColumnWidths(srcCols) };
        }

        if (typeof WidgetAnimations !== 'undefined' && WidgetAnimations.normalizeConfig) {
            WidgetAnimations.normalizeConfig(c, 'content');
        }
        c.contentAnimationOnLiveTopics = this.resolveValue('contentAnimationOnLiveTopics', false) === true;

        BaseWidget.applyTypographyBindingOverlay(this, c, TextWidget.textMdTypographyRolePrefixTuples(), {
            extraByRole: TextWidget._textMdTypographyExtraByRole()
        });
        BaseWidget.applyTypographyBindingOverlay(this, c, [['widgetLabel', 'textWidgetLabel']]);

        delete c.typography;
        delete c.fontFamily;
        delete c.fontSize;
        delete c.textColor;
        delete c.lineHeight;

        return c;
    }

    /** Animations & Effects slideout for the text widget (content-swap + text scroll). */
    static _textScrollOn(values) {
        if (!values) return false;
        var v = values.textScroll;
        return v === 'horizontal' || v === 'vertical';
    }

    static _textScrollMotion(values) {
        if (!values || values.textScrollMotion == null || String(values.textScrollMotion) === '') {
            return 'loop';
        }
        return String(values.textScrollMotion);
    }

    static _textScrollSchemaFields() {
        var scrollOn = function (values) { return TextWidget._textScrollOn(values); };
        var motionIs = function (id) {
            return function (values) {
                return TextWidget._textScrollOn(values) && TextWidget._textScrollMotion(values) === id;
            };
        };
        var holdOrFade = function (values) {
            if (!TextWidget._textScrollOn(values)) return false;
            var m = TextWidget._textScrollMotion(values);
            return m === 'loop' || m === 'reset';
        };
        return [
            { type: 'heading', label: 'Text Scroll', cols: 12 },
            {
                key: 'textScroll',
                type: 'select',
                label: 'Text Scroll',
                cols: 12,
                default: 'none',
                options: [
                    { value: 'none', text: 'None' },
                    { value: 'horizontal', text: 'Horizontal' },
                    { value: 'vertical', text: 'Vertical' }
                ]
            },
            {
                key: 'textScrollMotion',
                type: 'select',
                label: 'Motion',
                cols: 12,
                default: 'loop',
                options: [
                    { value: 'loop', text: 'Loop' },
                    { value: 'bounce', text: 'Bounce' },
                    { value: 'reset', text: 'Reset' }
                ],
                dependsOn: ['textScroll'],
                visibleWhen: scrollOn
            },
            {
                key: 'textScrollSpeed',
                type: 'number',
                label: 'Speed',
                cols: 12,
                min: 10,
                max: 300,
                step: 1,
                default: 50,
                dependsOn: ['textScroll'],
                visibleWhen: scrollOn
            },
            {
                key: 'textScrollReverse',
                type: 'checkbox',
                label: 'Reverse',
                cols: 12,
                default: false,
                dependsOn: ['textScroll'],
                visibleWhen: scrollOn
            },
            {
                key: 'textScrollOverflowOnly',
                type: 'checkbox',
                label: 'Only When Text Overflows',
                cols: 12,
                default: true,
                dependsOn: ['textScroll'],
                visibleWhen: scrollOn
            },
            {
                key: 'textScrollGap',
                type: 'number',
                label: 'Gap',
                cols: 12,
                min: 0,
                max: 2000,
                step: 1,
                default: 48,
                dependsOn: ['textScroll', 'textScrollMotion'],
                visibleWhen: motionIs('loop')
            },
            {
                key: 'textScrollHold',
                type: 'number',
                label: 'Hold (s)',
                cols: 12,
                min: 0,
                max: 60,
                step: 0.1,
                default: 1,
                dependsOn: ['textScroll', 'textScrollMotion'],
                visibleWhen: holdOrFade,
                dynamicLabel: function (values) {
                    return TextWidget._textScrollMotion(values) === 'loop' ? 'Start Hold (s)' : 'Hold (s)';
                }
            },
            {
                key: 'textScrollFade',
                type: 'number',
                label: 'Fade (s)',
                cols: 12,
                min: 0,
                max: 5,
                step: 0.05,
                default: 0.2,
                dependsOn: ['textScroll', 'textScrollMotion'],
                visibleWhen: motionIs('reset')
            }
        ];
    }

    static _textAnimationsSchemaGroup() {
        var group;
        if (typeof WidgetAnimations !== 'undefined' && WidgetAnimations.getSchemaGroup) {
            group = WidgetAnimations.getSchemaGroup({
                slot: 'content',
                groupId: 'txt_anim_content',
                allowed: { categories: ['content-swap'] }
            });
            group.fields.splice(2, 0, {
                key: 'contentAnimationOnLiveTopics',
                type: 'checkbox',
                label: 'Animate When Inline Topics Change',
                cols: 12,
                default: false,
                defaultKey: 'defaultTextContentAnimationOnLiveTopics',
                hint: 'Inline {{topic}} tokens inside the markdown only. When off, those values still update without a transition. Binding Text Content to a topic always animates when the payload changes, regardless of this setting.',
                dependsOn: ['contentAnimation'],
                visibleWhen: function (values) {
                    if (!values) return false;
                    const v = values.contentAnimation;
                    return v != null && String(v) !== '' && String(v) !== 'none';
                }
            });
            var hideSwap = function (field) {
                if (!field || field.type === 'heading') return;
                var prev = field.visibleWhen;
                var deps = Array.isArray(field.dependsOn) ? field.dependsOn.slice() : [];
                if (deps.indexOf('textScroll') === -1) deps.push('textScroll');
                field.dependsOn = deps;
                field.visibleWhen = function (values) {
                    if (TextWidget._textScrollOn(values)) return false;
                    if (typeof prev === 'function') return prev(values);
                    return true;
                };
            };
            var fi;
            for (fi = 0; fi < group.fields.length; fi++) {
                hideSwap(group.fields[fi]);
            }
        } else {
            group = { id: 'txt_anim_content', title: 'Animations & Effects', icon: 'ph-sparkle', fields: [] };
        }
        var extra = TextWidget._textScrollSchemaFields();
        var i;
        for (i = 0; i < extra.length; i++) {
            group.fields.push(extra[i]);
        }
        return group;
    }

    getSchema() {
        const tableStyleOpts = TextWidget._mdTableStyleOptions();
        return [
            {
                id: 'txt_settings',
                title: 'Text Settings',
                icon: 'ph-text-t',
                fields: [
                    {
                        key: 'text', type: 'textarea', label: 'Text Content', cols: 12,
                        fullMarkdownEditor: true,
                        deferDependencyUntilBlur: true,
                        widgetTextPreviewDebounceMs: 500,
                        labelHelpLink: {
                            linkText: 'Markdown Formatting Reference',
                            topic: 'Data Types & Formats',
                            widgetSub: 'markdown-formatting'
                        }
                    },
                    {
                        key: 'textAlign', type: 'select', label: 'Horizontal Alignment', options: [
                            { value: 'typography', text: 'Use Typography Settings' },
                            { value: 'left', text: 'Left' },
                            { value: 'center', text: 'Center' },
                            { value: 'right', text: 'Right' }
                        ], cols: 12, default: 'typography'
                    },
                    {
                        key: 'textVerticalAlign', type: 'select', label: 'Vertical Alignment', options: [
                            { value: 'top', text: 'Top' },
                            { value: 'middle', text: 'Middle' },
                            { value: 'bottom', text: 'Bottom' }
                        ], cols: 12, defaultKey: 'defaultTextVerticalAlign',
                        dependsOn: ['layoutMode'],
                        // Responsive Columns always pins text to the top, so the control is irrelevant there.
                        visibleWhen: function () {
                            return !(typeof BaseWidget !== 'undefined'
                                && BaseWidget.isResponsiveMode && BaseWidget.isResponsiveMode());
                        }
                    },
                    {
                        key: 'labelCase', type: 'select', label: 'Text Case', options: [
                            { value: 'typography', text: 'Use Typography Settings' },
                            { value: 'uppercase', text: 'UPPERCASE' },
                            { value: 'capitalize', text: 'Capitalize' },
                            { value: 'lowercase', text: 'lowercase' },
                            { value: 'none', text: 'None' }
                        ], cols: 12, default: 'typography'
                    },
                    { key: 'textRotation', type: 'number', label: 'Rotation', min: -360, max: 360, cols: 4, default: 0 },
                    { key: 'textOffX', type: 'number', label: 'Offset X', cols: 4, default: 0 },
                    { key: 'textOffY', type: 'number', label: 'Offset Y', cols: 4, default: 0 },
                    {
                        key: 'mdLinkTarget',
                        type: 'select',
                        label: 'Link Open Behavior',
                        cols: 12,
                        default: 'markdown',
                        defaultKey: 'textMdLinkTarget',
                        options: [
                            { value: 'markdown', text: 'Use Markdown Setting (per link)' },
                            { value: 'new', text: 'Always Open in New Tab' },
                            { value: 'current', text: 'Always Open in Same Tab' }
                        ]
                    },
                    {
                        key: 'mdTextWrap',
                        type: 'checkbox',
                        label: 'Wrap Text',
                        cols: 4,
                        defaultKey: 'textMdTextWrap'
                    },
                    {
                        key: 'mdAutoFitText',
                        type: 'checkbox',
                        label: 'Auto-Fit Text to Frame',
                        cols: 4,
                        defaultKey: 'textMdAutoFitText',
                        dependsOn: ['mdOverflowScroll', 'textScroll'],
                        visibleWhen: function (values) {
                            if (!values) return true;
                            var scroll = values.textScroll;
                            if (scroll === 'horizontal' || scroll === 'vertical') return false;
                            return values.mdOverflowScroll !== true;
                        }
                    },
                    {
                        key: 'mdOverflowScroll',
                        type: 'checkbox',
                        label: 'Scroll Overflow Content',
                        cols: 4,
                        defaultKey: 'textMdOverflowScroll',
                        dependsOn: ['mdAutoFitText', 'textScroll'],
                        visibleWhen: function (values) {
                            if (!values) return true;
                            var scroll = values.textScroll;
                            if (scroll === 'horizontal' || scroll === 'vertical') return false;
                            return values.mdAutoFitText !== true;
                        }
                    }
                ]
            },
            (typeof DashboardAudio !== 'undefined' && DashboardAudio.schemaGroup)
                ? DashboardAudio.schemaGroup('txt_audio', TextWidget.AUDIO_TRIGGERS)
                : {
                    id: 'txt_audio', title: 'Audio', icon: 'ph-music-notes',
                    fields: [{ key: 'audio', type: 'audio_trigger_map', cols: 12, triggers: TextWidget.AUDIO_TRIGGERS }]
                },
            {
                id: 'txt_md_colors',
                title: 'Markdown',
                icon: 'ph-table',
                fields: [
                    {
                        key: 'mdTableStyle', type: 'select', label: 'Table Style', cols: 6,
                        options: tableStyleOpts,
                        defaultKey: 'textMdTableStyle'
                    },
                    {
                        key: 'mdCalendarWeekStart', type: 'select', label: 'Region (first day of week)', cols: 6,
                        defaultKey: 'textMdCalendarWeekStart',
                        options: [
                            { value: 'auto', text: 'Auto (from Dashboard)' },
                            { value: 'monday', text: 'Europe (Monday)' },
                            { value: 'sunday', text: 'Americas / Japan (Sunday)' },
                            { value: 'saturday', text: 'Middle East (Saturday)' }
                        ],
                        dependsOn: ['mdTableStyle', 'textMdTableStyle'],
                        visibleWhen: function (values) {
                            if (!values) return false;
                            const k = String(
                                (values.mdTableStyle != null && String(values.mdTableStyle) !== '') ? values.mdTableStyle
                                    : (values.textMdTableStyle != null ? values.textMdTableStyle : '')
                            );
                            return k === 'calendar' || k === 'week_planner' || k === 'month_view';
                        }
                    },
                    {
                        key: 'mdTableColumnWidthMode',
                        type: 'select',
                        label: 'Table Column Width Mode',
                        cols: 6,
                        options: TextWidget._tableColumnWidthModeOptions(),
                        default: TextWidget.TABLE_COLUMN_WIDTH_MODE_AUTO
                    },
                    {
                        key: 'mdTableCustomColumnCount',
                        type: 'number',
                        label: 'Amount of Columns',
                        min: 0,
                        max: 40,
                        cols: 6,
                        default: 0,
                        dependsOn: ['mdTableColumnWidthMode', 'text'],
                        visibleWhen: function (values) {
                            return TextWidget.customColumnAmountVisible(values);
                        }
                    },
                    {
                        key: 'mdTableColumnWidthPx',
                        type: 'number',
                        label: 'Fixed Table Column Width (px, 0 = Auto)',
                        min: 0,
                        cols: 12,
                        default: 0,
                        dependsOn: ['mdTableColumnWidthMode'],
                        visibleWhen: function (values) {
                            return TextWidget.normalizeTableColumnWidthMode(values && values.mdTableColumnWidthMode) === TextWidget.TABLE_COLUMN_WIDTH_MODE_FIXED;
                        }
                    },
                    {
                        key: 'mdTableCustomColumnWidths',
                        type: 'dynamic_number_list',
                        label: 'Custom Column Width (px, 0 = Auto)',
                        cols: 12,
                        dependsOn: ['mdTableColumnWidthMode', 'text', 'mdTableCustomColumnCount'],
                        dynamicItems: function (values) {
                            return TextWidget._buildCustomColumnWidthItems(values);
                        },
                        visibleWhen: function (values) {
                            return TextWidget.normalizeTableColumnWidthMode(values && values.mdTableColumnWidthMode) === TextWidget.TABLE_COLUMN_WIDTH_MODE_CUSTOM;
                        }
                    },
                    { key: 'mdTableBorderRadius', type: 'number', label: 'Table Border Radius (px)', min: 0, max: 64, cols: 6, defaultKey: 'textMdTableBorderRadius' },
                    { key: 'mdTableCellPadding', type: 'number', label: 'Table Cell Padding (px)', min: 0, max: 64, cols: 6, defaultKey: 'textMdTableCellPadding' },
                    {
                        key: 'mdIconWeight',
                        type: 'select',
                        label: 'Markdown Icon Style',
                        cols: 12,
                        defaultKey: 'textMdIconWeight',
                        options: [
                            { value: 'thin', text: 'Thin' },
                            { value: 'light', text: 'Light' },
                            { value: 'regular', text: 'Regular' },
                            { value: 'bold', text: 'Bold' },
                            { value: 'fill', text: 'Fill' },
                            { value: 'duotone', text: 'Duotone' }
                        ]
                    },
                    { key: 'mdIconColor', type: 'color', label: 'Markdown Icon Color', cols: 6, defaultKey: 'textMdIconColor' },
                    { key: 'mdIconOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6, defaultKey: 'textMdIconOpacity' },
                    {
                        key: 'mdIconAccentColor',
                        type: 'color',
                        label: 'Markdown Icon Accent Color',
                        cols: 6,
                        defaultKey: 'textMdIconAccentColor'
                    },
                    { key: 'mdIconAccentOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6, defaultKey: 'textMdIconAccentOpacity' },
                    { key: 'mdTableBorderColor', type: 'color', label: 'Table Border Color', cols: 6, defaultKey: 'textMdTableBorderColor' },
                    { key: 'mdTableBorderOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6, defaultKey: 'textMdTableBorderOpacity' },
                    { key: 'mdSeparatorColor', type: 'color', label: 'Separator Line Color', cols: 6, defaultKey: 'textMdSeparatorColor' },
                    { key: 'mdSeparatorOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6, defaultKey: 'textMdSeparatorOpacity' },
                    { key: 'mdTableHeaderBg', type: 'color', label: 'Table Header Background Color', cols: 6, defaultKey: 'textMdTableHeaderBg' },
                    { key: 'mdTableHeaderBgOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6, defaultKey: 'textMdTableHeaderBgOpacity' },
                    { key: 'mdTableHeaderAccentBg', type: 'color', label: 'Table Header Background Accent Color', cols: 6, defaultKey: 'textMdTableHeaderAccentBg' },
                    { key: 'mdTableHeaderAccentBgOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6, defaultKey: 'textMdTableHeaderAccentBgOpacity' },
                    { key: 'mdTableRowBg', type: 'color', label: 'Table Row Background Color', cols: 6, defaultKey: 'textMdTableRowBg' },
                    { key: 'mdTableRowBgOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6, defaultKey: 'textMdTableRowBgOpacity' },
                    { key: 'mdTableRowAltBg', type: 'color', label: 'Table Alternate Row Background', cols: 6, defaultKey: 'textMdTableRowAltBg' },
                    { key: 'mdTableRowAltBgOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6, defaultKey: 'textMdTableRowAltBgOpacity' },
                    { key: 'mdHrColor', type: 'color', label: 'Horizontal Rule Color', cols: 6, defaultKey: 'textMdHrColor' },
                    { key: 'mdHrOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 6, defaultKey: 'textMdHrOpacity' },
                    { key: 'mdBlock1Color', type: 'color', label: 'Block 1 Color', cols: 6, defaultKey: 'textMdBlock1Color' },
                    { key: 'mdBlock2Color', type: 'color', label: 'Block 2 Color', cols: 6, defaultKey: 'textMdBlock2Color' },
                    { key: 'mdBlock3Color', type: 'color', label: 'Block 3 Color', cols: 6, defaultKey: 'textMdBlock3Color' },
                    { key: 'mdBlock4Color', type: 'color', label: 'Block 4 Color', cols: 6, defaultKey: 'textMdBlock4Color' }
                ]
            },
            {
                id: 'txt_appear',
                title: 'Appearance',
                icon: 'ph-palette',
                fields: [
                    {
                        key: 'dropShadowOpacity',
                        type: 'number',
                        min: 0,
                        max: 100,
                        label: 'Drop Shadow Opacity',
                        cols: 4,
                        default: 0
                    },
                    {
                        key: 'dropShadowColor',
                        type: 'color',
                        label: 'Shadow Color',
                        cols: 4,
                        default: '@overlay',
                        dependsOn: ['dropShadowOpacity'],
                        visibleWhen: function (values) {
                            return Number(values && values.dropShadowOpacity) > 0;
                        }
                    },
                    {
                        key: 'dropShadowBlur',
                        type: 'number',
                        min: 0,
                        label: 'Shadow Blur',
                        cols: 4,
                        default: 1,
                        dependsOn: ['dropShadowOpacity'],
                        visibleWhen: function (values) {
                            return Number(values && values.dropShadowOpacity) > 0;
                        }
                    },
                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }
                ]
            },
            {
                id: 'txt_typography',
                title: 'Text & Typography',
                icon: 'ph-text-t',
                fields: [
                    { key: 'label', type: 'text', label: 'Widget Label', cols: 12 },
                    BaseWidget.getWidgetLabelTypographySchema('textWidgetLabel', 'widgetLabel'),
                    ...TextWidget._textMdTypographyGroupsForEditor(false)
                ]
            },
            TextWidget._textAnimationsSchemaGroup()
        ];
    }

    getAnimationSlot(slot) {
        if (slot !== 'content') return null;
        var c = this.config;
        if (!this.txtEl || !this.mdRoot) return null;
        var scrollOn = (c.textScroll === 'horizontal' || c.textScroll === 'vertical');
        return {
            host: this.txtEl,
            target: this.mdRoot,
            animation: scrollOn ? 'none' : c.contentAnimation,
            duration: c.contentAnimationDuration,
            allowed: { categories: ['content-swap'] }
        };
    }

    _ensureScopedStyle() {
        if (TextWidget._sharedCssCache && TextWidget._sharedCssCache.indexOf('--text-md-td-block-space') === -1) {
            TextWidget._sharedCssCache = null;
        }
        if (TextWidget._sharedCssCache && TextWidget._sharedCssCache.indexOf('--text-md-para-block-space') === -1) {
            TextWidget._sharedCssCache = null;
            if (TextWidget._sharedStyleEl && TextWidget._sharedStyleEl.parentNode) {
                TextWidget._sharedStyleEl.parentNode.removeChild(TextWidget._sharedStyleEl);
                TextWidget._sharedStyleEl = null;
            }
        }
        if (TextWidget._sharedCssCache && TextWidget._sharedCssCache.indexOf('text-md-block-1') === -1) {
            TextWidget._sharedCssCache = null;
            if (TextWidget._sharedStyleEl && TextWidget._sharedStyleEl.parentNode) {
                TextWidget._sharedStyleEl.parentNode.removeChild(TextWidget._sharedStyleEl);
                TextWidget._sharedStyleEl = null;
            }
        }
        if (TextWidget._sharedCssCache && TextWidget._sharedCssCache.indexOf('.text-md-root .text-md-block{display:block') !== -1 && TextWidget._sharedCssCache.indexOf('font-weight:600') !== -1) {
            TextWidget._sharedCssCache = null;
            if (TextWidget._sharedStyleEl && TextWidget._sharedStyleEl.parentNode) {
                TextWidget._sharedStyleEl.parentNode.removeChild(TextWidget._sharedStyleEl);
                TextWidget._sharedStyleEl = null;
            }
        }
        if (TextWidget._sharedCssCache && TextWidget._sharedCssCache.indexOf('i.text-md-ph-icon') === -1) {
            TextWidget._sharedCssCache = null;
            if (TextWidget._sharedStyleEl && TextWidget._sharedStyleEl.parentNode) {
                TextWidget._sharedStyleEl.parentNode.removeChild(TextWidget._sharedStyleEl);
                TextWidget._sharedStyleEl = null;
            }
        }
        if (TextWidget._sharedCssCache && TextWidget._sharedCssCache.indexOf('.text-md-root.text-md-scroll-host') !== -1) {
            TextWidget._sharedCssCache = null;
            if (TextWidget._sharedStyleEl && TextWidget._sharedStyleEl.parentNode) {
                TextWidget._sharedStyleEl.parentNode.removeChild(TextWidget._sharedStyleEl);
                TextWidget._sharedStyleEl = null;
            }
        }
        if (TextWidget._sharedCssCache && TextWidget._sharedCssCache.indexOf('--tmd-p-ff') === -1) {
            TextWidget._sharedCssCache = null;
            if (TextWidget._sharedStyleEl && TextWidget._sharedStyleEl.parentNode) {
                TextWidget._sharedStyleEl.parentNode.removeChild(TextWidget._sharedStyleEl);
                TextWidget._sharedStyleEl = null;
            }
        }
        if (TextWidget._sharedCssCache && TextWidget._sharedCssCache.indexOf('text-md-root.text-md-filled-hdr table.text-md-table') === -1) {
            TextWidget._sharedCssCache = null;
            if (TextWidget._sharedStyleEl && TextWidget._sharedStyleEl.parentNode) {
                TextWidget._sharedStyleEl.parentNode.removeChild(TextWidget._sharedStyleEl);
                TextWidget._sharedStyleEl = null;
            }
        }
        if (TextWidget._sharedCssCache && TextWidget._sharedCssCache.indexOf('kanban_columns tbody tr:last-child') === -1) {
            TextWidget._sharedCssCache = null;
            if (TextWidget._sharedStyleEl && TextWidget._sharedStyleEl.parentNode) {
                TextWidget._sharedStyleEl.parentNode.removeChild(TextWidget._sharedStyleEl);
                TextWidget._sharedStyleEl = null;
            }
        }
        if (TextWidget._sharedCssCache && TextWidget._sharedCssCache.indexOf('--tmd-code-bg') === -1
            && TextWidget._sharedCssCache.indexOf('--tmd-code-col') !== -1) {
            TextWidget._sharedCssCache = null;
            if (TextWidget._sharedStyleEl && TextWidget._sharedStyleEl.parentNode) {
                TextWidget._sharedStyleEl.parentNode.removeChild(TextWidget._sharedStyleEl);
                TextWidget._sharedStyleEl = null;
            }
        }
        if (TextWidget._sharedCssCache && TextWidget._sharedCssCache.indexOf('animation:text-md-blink var(--text-md-blink-duration') !== -1) {
            TextWidget._sharedCssCache = null;
            if (TextWidget._sharedStyleEl && TextWidget._sharedStyleEl.parentNode) {
                TextWidget._sharedStyleEl.parentNode.removeChild(TextWidget._sharedStyleEl);
                TextWidget._sharedStyleEl = null;
            }
        }
        if (TextWidget._sharedStyleEl && TextWidget._sharedStyleEl.parentNode) return;
        if (!TextWidget._sharedCssCache) {
            TextWidget._sharedCssCache = TextWidget._buildScopedCss('.text-md-scoped');
        }
        var el = document.createElement('style');
        el.setAttribute('data-text-md-scope', 'shared');
        el.textContent = TextWidget._sharedCssCache;
        document.head.appendChild(el);
        TextWidget._sharedStyleEl = el;
    }

    /** Resolved colors / default weight for `:ph:` markdown icon preprocessing (matches `get config`). */
    _getMarkdownPhosphorIconOpts() {
        const c = this.config || {};
        return {
            defaultWeight: TextWidget.normalizeMarkdownIconWeight(c.mdIconWeight),
            duotonePrimaryCss: TextWidget.resolveMarkdownColorWithOpacity(c.mdIconColor, c.mdIconOpacity),
            duotoneSecondaryCss: TextWidget.resolveMarkdownColorWithOpacity(c.mdIconAccentColor, c.mdIconAccentOpacity)
        };
    }

    static _renderMarkdownFragmentToSafeHtml(src, ctx) {
        const opts = ctx || {};
        const phOpts = opts.phOpts || {};
        const hadEscapedNewlines = !!opts.hadEscapedNewlines;
        const rawForCheck = opts.rawForPlainCheck !== undefined ? opts.rawForPlainCheck : src;
        const md = TextWidget._getMarkdownIt();
        let pre = src == null ? '' : String(src);
        if (typeof MarkdownBlink !== 'undefined' && MarkdownBlink.preprocessForRender) {
            pre = MarkdownBlink.preprocessForRender(pre, {
                renderInline: function (inner) {
                    return TextWidget._renderMarkdownInlineBody(inner, phOpts);
                },
                renderBlock: function (inner) {
                    return TextWidget._renderMarkdownFragmentToSafeHtml(inner, {
                        phOpts: phOpts,
                        hadEscapedNewlines: true,
                        rawForPlainCheck: inner
                    });
                }
            });
        }
        pre = TextWidget._preprocessMarkdownImagesWithSize(pre);
        pre = TextWidget._preprocessPhosphorIcons(pre, phOpts);
        pre = TextWidget._preprocessMarkdownNewTabLinks(pre);
        const inlineRender = function (body) {
            return TextWidget._renderMarkdownInlineBody(body, phOpts);
        };
        if (typeof MarkdownTableUtils !== 'undefined' && MarkdownTableUtils.preprocessTableCellHeadings) {
            pre = MarkdownTableUtils.preprocessTableCellHeadings(pre, inlineRender);
        }
        if (typeof MarkdownTextColor !== 'undefined' && MarkdownTextColor.preprocessForRender) {
            pre = MarkdownTextColor.preprocessForRender(pre, inlineRender);
        }
        if (typeof MarkdownCellColor !== 'undefined' && MarkdownCellColor.stripDirectivesForRender) {
            pre = MarkdownCellColor.stripDirectivesForRender(pre);
        }
        pre = TextWidget._preprocessBlocks(pre, phOpts);
        if (!md) {
            if (pre.indexOf('<') >= 0) {
                return TextWidget._finalizeMarkdownHtml(pre);
            }
            const esc = TextWidget._escapePlainText(pre);
            return esc.length ? '<p>' + esc.replace(/\r\n/g, '\n').split('\n').join('<br>') + '</p>' : '';
        }
        if (!hadEscapedNewlines && TextWidget._plainTextMdCanSkipMarkdownIt(pre, rawForCheck)) {
            const esc = TextWidget._escapePlainText(pre);
            if (!esc.length) return '';
            if (esc.indexOf('\n') < 0) return '<p>' + esc + '</p>';
            return '<p>' + esc.replace(/\r\n/g, '\n').split('\n').join('<br>') + '</p>';
        }
        const dirty = md.render(pre);
        return TextWidget._finalizeMarkdownHtml(dirty);
    }

    _renderMarkdownToSafeHtml(raw) {
        const hadEscapedNewlines = typeof raw === 'string' && raw.indexOf('\\n') >= 0;
        raw = TextWidget.expandEscapedNewlines(raw);
        const phOpts = this._getMarkdownPhosphorIconOpts();
        // Resolve {{topic}} before icon/block preprocessing so live payloads match bound Text Content.
        const pre = this._resolveMarkdownDynamicPlaceholders(raw, false, true);
        return this._applyLinkTargetToHtml(TextWidget._renderMarkdownFragmentToSafeHtml(pre, {
            phOpts: phOpts,
            hadEscapedNewlines: hadEscapedNewlines,
            rawForPlainCheck: raw
        }));
    }

    /** Widget-level Link Open Behavior: 'markdown' (per-link `^`), 'new' (force new tab), 'current' (force same tab). */
    _resolveLinkTargetMode() {
        var v = this.config ? this.config.mdLinkTarget : null;
        return (v === 'new' || v === 'current') ? v : 'markdown';
    }

    /** Force every markdown link to a new or same tab per the widget setting; leave per-link behavior when 'markdown'. */
    _applyLinkTargetToHtml(html) {
        var mode = this._resolveLinkTargetMode();
        if (mode === 'markdown' || !html || html.indexOf('<a') < 0) return html;
        if (typeof document === 'undefined') return html;
        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        var anchors = wrap.querySelectorAll('a[href]');
        var i = 0;
        for (i = 0; i < anchors.length; i++) {
            var a = anchors[i];
            var href = String(a.getAttribute('href') || '').trim();
            if (!href.length || href.charAt(0) === '#') continue;
            if (mode === 'new') {
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer');
            } else {
                a.removeAttribute('target');
                a.removeAttribute('rel');
            }
        }
        return wrap.innerHTML;
    }

    _applyTableClasses(rootEl, styleKey, calendarWeekStart) {
        const cls = TextWidget._tableStyleClass(styleKey);
        const sk = String(styleKey == null ? '' : styleKey).trim();
        const ws = TextWidget._mdTableStyleHasCalendarWeekend(sk)
            ? TextWidget._mdCalendarWeekStartClass(calendarWeekStart)
            : '';
        const tables = rootEl.querySelectorAll('table');
        for (let i = 0; i < tables.length; i++) {
            tables[i].className = 'text-md-table ' + cls + (ws ? ' ' + ws : '');
        }
    }

    /**
     * Column count for a simple grid table (no colspan/rowspan). Returns -1 if not uniform.
     */
    static _mdTableUniformColumnCount(table) {
        if (!table || !table.rows || table.rows.length === 0) return -1;
        const first = table.rows[0];
        if (!first || first.cells.length === 0) return -1;
        const n = first.cells.length;
        for (let j = 0; j < n; j++) {
            const cell = first.cells[j];
            if (!cell || cell.colSpan !== 1 || cell.rowSpan !== 1) return -1;
        }
        for (let r = 0; r < table.rows.length; r++) {
            const row = table.rows[r];
            if (row.cells.length < n) return -1;
            for (let j = 0; j < n; j++) {
                const cell = row.cells[j];
                if (!cell || cell.colSpan !== 1 || cell.rowSpan !== 1) return -1;
            }
        }
        return n;
    }

    static _mdTableColumnMaxWidth(table, colIndex) {
        let max = 0;
        for (let r = 0; r < table.rows.length; r++) {
            const row = table.rows[r];
            const cell = row.cells[colIndex];
            if (!cell) return null;
            const w = cell.getBoundingClientRect().width;
            if (w > max) max = w;
        }
        return max;
    }

    static _mdTableApplySyncedColumnFractions(table, fractions) {
        if (!table || !fractions || fractions.length === 0) return;
        let cg = table.querySelector('colgroup[data-md-sync-cols="1"]');
        if (!cg) {
            cg = document.createElement('colgroup');
            cg.setAttribute('data-md-sync-cols', '1');
            table.insertBefore(cg, table.firstChild);
        } else {
            while (cg.firstChild) cg.removeChild(cg.firstChild);
        }
        for (let i = 0; i < fractions.length; i++) {
            const col = document.createElement('col');
            col.style.width = (fractions[i] * 100) + '%';
            cg.appendChild(col);
        }
        table.style.tableLayout = 'fixed';
        table.style.width = '100%';
    }

    /** Per-table user column layout: equal, fixed, or custom per-column px. Skips non-grid tables (colspan/rowspan). */
    static _mdTableApplyUserColumnLayout(rootEl, c) {
        if (!rootEl || !c) return;
        const mode = TextWidget.normalizeTableColumnWidthMode(c.mdTableColumnWidthMode);
        const fixedRaw = c.mdTableColumnWidthPx;
        const fixedPx = typeof fixedRaw === 'number' && !isNaN(fixedRaw) ? fixedRaw : parseInt(String(fixedRaw), 10);
        const fixed = isNaN(fixedPx) || fixedPx < 0 ? 0 : fixedPx;
        const customColumns = c.mdTableCustomColumnWidths && c.mdTableCustomColumnWidths.columns;
        const custom = TextWidget._coerceCustomColumnWidths(customColumns);
        const useFixed = mode === TextWidget.TABLE_COLUMN_WIDTH_MODE_FIXED && fixed > 0;
        const useEqual = mode === TextWidget.TABLE_COLUMN_WIDTH_MODE_EQUAL;
        const useCustom = mode === TextWidget.TABLE_COLUMN_WIDTH_MODE_CUSTOM && custom.length > 0;
        if (!useFixed && !useEqual && !useCustom) {
            const staleTables = rootEl.querySelectorAll('table.text-md-table');
            for (let i = 0; i < staleTables.length; i++) {
                const stale = staleTables[i];
                const staleCg = stale.querySelector('colgroup[data-md-cols-user="1"]');
                if (staleCg && staleCg.parentNode) staleCg.parentNode.removeChild(staleCg);
                stale.style.tableLayout = '';
                stale.style.width = '';
            }
            return;
        }

        const tables = rootEl.querySelectorAll('table.text-md-table');
        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            const n = TextWidget._mdTableUniformColumnCount(table);
            if (n <= 0) continue;

            let cg = table.querySelector('colgroup[data-md-cols-user="1"]');
            if (!cg) {
                cg = document.createElement('colgroup');
                cg.setAttribute('data-md-cols-user', '1');
                table.insertBefore(cg, table.firstChild);
            } else {
                while (cg.firstChild) cg.removeChild(cg.firstChild);
            }

            if (useFixed) {
                for (let j = 0; j < n; j++) {
                    const col = document.createElement('col');
                    col.style.width = fixed + 'px';
                    cg.appendChild(col);
                }
                table.style.tableLayout = 'fixed';
                table.style.width = (n * fixed) + 'px';
            } else if (useCustom) {
                let hasFixedCol = false;
                let hasAutoCol = false;
                let totalFixedWidth = 0;
                for (let j = 0; j < n; j++) {
                    const col = document.createElement('col');
                    const w = custom[j] != null ? custom[j] : 0;
                    if (w > 0) {
                        col.style.width = w + 'px';
                        hasFixedCol = true;
                        totalFixedWidth += w;
                    } else {
                        hasAutoCol = true;
                    }
                    cg.appendChild(col);
                }
                if (hasFixedCol && !hasAutoCol) {
                    table.style.tableLayout = 'fixed';
                    table.style.width = totalFixedWidth + 'px';
                } else {
                    table.style.tableLayout = '';
                    table.style.width = '100%';
                }
            } else {
                const eachPct = 100 / n;
                for (let j = 0; j < n; j++) {
                    const col = document.createElement('col');
                    col.style.width = eachPct + '%';
                    cg.appendChild(col);
                }
                table.style.tableLayout = 'fixed';
                table.style.width = '100%';
            }
        }
    }

    /**
     * For each group of tables with the same uniform column count (≥2 tables), apply identical
     * percentage column widths so vertical edges line up. Skips tables with colspan/rowspan.
     */
    static _syncMarkdownTableColumnWidths(rootEl) {
        if (!rootEl) return;
        const tables = rootEl.querySelectorAll('table.text-md-table');
        if (tables.length < 2) return;

        const byCount = new Map();
        for (let i = 0; i < tables.length; i++) {
            const t = tables[i];
            const n = TextWidget._mdTableUniformColumnCount(t);
            if (n <= 0) continue;
            if (!byCount.has(n)) byCount.set(n, []);
            byCount.get(n).push(t);
        }

        byCount.forEach(function (group, n) {
            if (group.length < 2) return;
            const maxW = new Array(n).fill(0);
            let bad = false;
            for (let g = 0; g < group.length; g++) {
                const t = group[g];
                for (let j = 0; j < n; j++) {
                    const w = TextWidget._mdTableColumnMaxWidth(t, j);
                    if (w == null || !(w > 0)) {
                        bad = true;
                        break;
                    }
                    maxW[j] = Math.max(maxW[j], w);
                }
                if (bad) break;
            }
            if (bad) return;
            const total = maxW.reduce(function (a, b) { return a + b; }, 0);
            if (!(total > 0)) return;
            const fr = maxW.map(function (w) { return w / total; });
            for (let g = 0; g < group.length; g++) {
                TextWidget._mdTableApplySyncedColumnFractions(group[g], fr);
            }
        });
    }

    /** True when `el` sits inside a `[blockN:]` `.text-md-block` container (paragraph/list styling must skip). */
    static _mdTypographyTargetInsideBlock(el) {
        if (!el || !el.parentElement) return false;
        if (typeof el.closest === 'function') {
            return !!el.closest('.text-md-block');
        }
        var anc = el.parentElement;
        while (anc) {
            if (anc.classList && anc.classList.contains && anc.classList.contains('text-md-block')) return true;
            anc = anc.parentElement;
        }
        return false;
    }

    _setTypoVar(prefix, cssPrefix, config, typoOpts) {
        var root = this.mdRoot;
        if (!root) return;
        
        var ff = config[prefix + 'Font'];
        this._setCssVarIfChanged(root, '--tmd-' + cssPrefix + '-ff', ff ? ff : 'inherit');
        
        var fw = config[prefix + 'Bold'] !== undefined ? (config[prefix + 'Bold'] ? '700' : '400') : 'inherit';
        this._setCssVarIfChanged(root, '--tmd-' + cssPrefix + '-fw', fw);
        
        var fst = config[prefix + 'Italic'] !== undefined ? (config[prefix + 'Italic'] ? 'italic' : 'normal') : 'inherit';
        this._setCssVarIfChanged(root, '--tmd-' + cssPrefix + '-fst', fst);
        
        var fsVal = 'inherit';
        if (config[prefix + 'Fs']) {
            var fs = Number(config[prefix + 'Fs']);
            var fsScale = typoOpts.fontSizeScale;
            if (fsScale != null && fsScale !== 1 && Number.isFinite(fs) && Number.isFinite(Number(fsScale))) {
                fs = Math.max(1, Math.round(fs * Number(fsScale) * 100) / 100);
            }
            fsVal = fs + 'px';
        }
        this._setCssVarIfChanged(root, '--tmd-' + cssPrefix + '-fs', fsVal);
        
        var color = config[prefix + 'Col'] || '#ffffff';
        if (typoOpts.overrideCol) color = typoOpts.overrideCol;
        color = BaseWidget.resolveCssColor(color);
        var opacity = config[prefix + 'Opacity'] !== undefined ? Number(config[prefix + 'Opacity']) : 100;
        if (!Number.isFinite(opacity)) opacity = 100;
        if (opacity < 100 && typeof Dashboard !== 'undefined' && typeof Dashboard.hexToRgba === 'function') {
            color = Dashboard.hexToRgba(color, opacity / 100);
        }
        this._setCssVarIfChanged(root, '--tmd-' + cssPrefix + '-col', color);
        
        var ta = config[prefix + 'Align'];
        var taVal = (!typoOpts.skipTextAlign && (ta === 'left' || ta === 'center' || ta === 'right')) ? ta : 'inherit';
        this._setCssVarIfChanged(root, '--tmd-' + cssPrefix + '-ta', taVal);
        var tt = (!typoOpts.skipTextTransform && config[prefix + 'Case']) ? config[prefix + 'Case'] : 'inherit';
        this._setCssVarIfChanged(root, '--tmd-' + cssPrefix + '-tt', tt);
        
        var lhRaw = config[prefix + 'LineHeight'];
        var lhVal = 'inherit';
        if (lhRaw !== undefined && lhRaw !== null && lhRaw !== '') {
            var lhNum = Number(lhRaw);
            if (Number.isFinite(lhNum) && lhNum > 0) lhVal = String(lhNum);
        }
        this._setCssVarIfChanged(root, '--tmd-' + cssPrefix + '-lh', lhVal);
        
        var offX = config[prefix + 'OffX'] || 0;
        var offY = config[prefix + 'OffY'] || 0;
        var txVal = (offX !== 0 || offY !== 0) ? ('translate(' + offX + 'px, ' + offY + 'px)') : 'none';
        this._setCssVarIfChanged(root, '--tmd-' + cssPrefix + '-tx', txVal);
        // Block elements (p, li, headings, callouts, pre) apply the horizontal offset as
        // margin-left and only the vertical offset as transform. A translateX on a 100%-wide
        // block pushes its right edge past the container, which forced an unnecessary
        // horizontal scrollbar in scroll mode. Margin keeps the block inside the container.
        this._setCssVarIfChanged(root, '--tmd-' + cssPrefix + '-ml', offX !== 0 ? (offX + 'px') : '0px');
        this._setCssVarIfChanged(root, '--tmd-' + cssPrefix + '-txb', offY !== 0 ? ('translateY(' + offY + 'px)') : 'none');
    }

    _applyTypographyCssVars(c) {
        var root = this.mdRoot;
        if (!root) return;
        var fitMult = (c.mdAutoFitText === true && this._autoFitMultiplier != null)
            ? this._autoFitMultiplier
            : 1;
        var typoOpts = {
            skipTextAlign: !TextWidget.useTypographyAlign(c),
            skipTextTransform: !TextWidget.useTypographyCase(c),
            fontSizeScale: fitMult
        };

        this._setTypoVar('textMdPara', 'p', c, typoOpts);
        this._setTypoVar('textMdH1', 'h1', c, typoOpts);
        this._setTypoVar('textMdH2', 'h2', c, typoOpts);
        this._setTypoVar('textMdH3', 'h3', c, typoOpts);
        this._setTypoVar('textMdBlockTypography', 'blk', c, typoOpts);
        this._setTypoVar('textMdCode', 'code', c, typoOpts);
        this._setCssVarIfChanged(root, '--tmd-code-bg', BaseWidget.resolveCssColor(c.textMdCodeBg || '@accentOff'));
        if (c.deactivated) {
            var accentCol = BaseWidget.getDeactivatedColorAccent(c);
            this._setCssVarIfChanged(root, '--tmd-p-col', accentCol);
            this._setCssVarIfChanged(root, '--tmd-h1-col', accentCol);
            this._setCssVarIfChanged(root, '--tmd-h2-col', accentCol);
            this._setCssVarIfChanged(root, '--tmd-h3-col', accentCol);
            this._setCssVarIfChanged(root, '--tmd-blk-col', accentCol);
            this._setCssVarIfChanged(root, '--tmd-code-col', accentCol);
            this._setCssVarIfChanged(root, '--tmd-code-bg', 'transparent');
        }

        var useA = TextWidget.useTypographyAlign(c);
        var useC = TextWidget.useTypographyCase(c);
        if (!useA) {
            var ta = c.textAlign || 'left';
            this._setCssVarIfChanged(root, '--tmd-global-ta', ta);
            root.classList.add('text-md-global-align');
        } else {
            root.classList.remove('text-md-global-align');
        }

        if (!useC) {
            var tt = 'none';
            var lc = c.labelCase;
            if (lc === 'uppercase') tt = 'uppercase';
            else if (lc === 'capitalize') tt = 'capitalize';
            else if (lc === 'lowercase') tt = 'lowercase';
            this._setCssVarIfChanged(root, '--tmd-global-tt', tt);
            root.classList.add('text-md-global-case');
        } else {
            root.classList.remove('text-md-global-case');
        }
    }

    /** Inline typography on table cells (matches pre-optimization behavior; overrides table-style preset font-size). */
    _applyTableCellTypography(c) {
        var root = this.mdRoot;
        if (!root) return;
        var fitMult = (c.mdAutoFitText === true && this._autoFitMultiplier != null)
            ? this._autoFitMultiplier
            : 1;
        var typoOpts = {
            skipTextAlign: !TextWidget.useTypographyAlign(c),
            skipTextTransform: !TextWidget.useTypographyCase(c),
            fontSizeScale: fitMult
        };
        var tds = root.querySelectorAll('td');
        var j = 0;
        for (j = 0; j < tds.length; j++) {
            var tdOpts = Object.assign({}, typoOpts);
            if (TextWidget.textMdAlignUsesTableMarkdown(c.textMdTdAlign)) tdOpts.skipTextAlign = true;
            this.applyTypographyToElement(tds[j], 'textMdTd', c, tdOpts);
        }
        var ths = root.querySelectorAll('th');
        var styleKey = String(c.mdTableStyle == null ? '' : c.mdTableStyle).trim();
        var filledHdr = TextWidget.mdTableStyleUsesFilledHeader(styleKey);
        var colFilledSet = c.textMdThColFilled != null && String(c.textMdThColFilled).trim() !== '';
        var alignMdTh = TextWidget.textMdAlignUsesTableMarkdown(c.textMdThAlign);
        var n = 0;
        for (n = 0; n < ths.length; n++) {
            var th = ths[n];
            var thTypoOpts = Object.assign({}, typoOpts);
            var useFilledCol = filledHdr && colFilledSet;
            if (styleKey === 'side_header') {
                useFilledCol = colFilledSet && TextWidget._mdIsSideHeaderCornerTh(th);
            }
            if (useFilledCol) {
                thTypoOpts.overrideCol = c.textMdThColFilled;
            }
            if (alignMdTh) thTypoOpts.skipTextAlign = true;
            this.applyTypographyToElement(th, 'textMdTh', c, thTypoOpts);
        }
        if (styleKey === 'side_header') {
            var sideHeaderCells = root.querySelectorAll('table.text-md-table--side_header td:first-child');
            var sideTypoOpts = Object.assign({}, typoOpts);
            if (alignMdTh) sideTypoOpts.skipTextAlign = true;
            var sh = 0;
            for (sh = 0; sh < sideHeaderCells.length; sh++) {
                this.applyTypographyToElement(sideHeaderCells[sh], 'textMdTh', c, sideTypoOpts);
            }
        }
        if (c.deactivated) {
            var accentCol = BaseWidget.getDeactivatedColorAccent(c);
            root.querySelectorAll('td, th').forEach(function (cell) {
                cell.style.color = accentCol;
            });
        }
    }

    /**
     * When not in Typography mode, widget-level horizontal alignment applies to table cells.
     * (Paragraph/heading align uses CSS vars on .text-md-root.)
     */
    _applyAlignCaseOverrides(c) {
        var root = this.mdRoot;
        if (!root) return;
        var useA = TextWidget.useTypographyAlign(c);
        var useC = TextWidget.useTypographyCase(c);
        if (useA && useC) {
            root.style.textAlign = '';
            root.style.textTransform = '';
            return;
        }
        var tableCells = root.querySelectorAll('td,th');
        if (!useA) {
            var ta = c.textAlign || 'left';
            var ti = 0;
            for (ti = 0; ti < tableCells.length; ti++) {
                tableCells[ti].style.textAlign = ta;
            }
            root.style.textAlign = ta;
        } else {
            root.style.textAlign = '';
        }
        if (!useC) {
            var tt = 'none';
            var lc = c.labelCase;
            if (lc === 'uppercase') tt = 'uppercase';
            else if (lc === 'capitalize') tt = 'capitalize';
            else if (lc === 'lowercase') tt = 'lowercase';
            var tj = 0;
            for (tj = 0; tj < tableCells.length; tj++) {
                tableCells[tj].style.textTransform = tt;
            }
            root.style.textTransform = '';
        } else {
            root.style.textTransform = '';
        }
    }

    /**
     * Drop shadow applied directly behind markdown content elements.
     * Zero-cost early exit when opacity is 0 or unconfigured.
     */
    _applyDropShadow(c, targetRoot) {
        var root = targetRoot || this.mdRoot;
        if (!root) return;
        var isMainRoot = !targetRoot || targetRoot === this.mdRoot;
        var op = Number(c && c.dropShadowOpacity);
        if (!Number.isFinite(op) || op <= 0 || (c && c.deactivated)) {
            if (isMainRoot) {
                if (this._cachedDropShadowFilter) {
                    root.style.filter = '';
                    this._cachedDropShadowFilter = '';
                }
            } else if (root.style && root.style.filter) {
                root.style.filter = '';
            }
            return;
        }
        var blur = Number(c && c.dropShadowBlur);
        if (!Number.isFinite(blur) || blur < 0) blur = 1;
        var rawCol = (c && c.dropShadowColor) ? c.dropShadowColor : '@overlay';
        var shadowCol = TextWidget.resolveMarkdownColorWithOpacity(rawCol, op);
        var filterVal = 'drop-shadow(1px 1px ' + blur + 'px ' + shadowCol + ')';
        if (isMainRoot) {
            if (this._cachedDropShadowFilter !== filterVal) {
                root.style.filter = filterVal;
                this._cachedDropShadowFilter = filterVal;
            }
        } else if (root.style) {
            root.style.filter = filterVal;
        }
    }

    _applyMarkdownTypographyPresentation(c) {
        this._applyTypographyCssVars(c);
        this._applyTableCellTypography(c);
        this._applyAlignCaseOverrides(c);
        this._applyDropShadow(c);
    }

    _buildBaseDOM() {
        const b = super._buildBaseDOM();
        b.innerContent.style.display = 'flex';
        b.innerContent.style.flexDirection = 'column';
        b.innerContent.style.alignItems = 'stretch';
        b.innerContent.style.justifyContent = 'flex-start';
        b.innerContent.style.overflow = 'hidden';
        b.innerContent.style.minHeight = '0';

        const widgetLabelEl = document.createElement('div');
        BaseWidget.applyWidgetLabelElementChrome(widgetLabelEl);
        widgetLabelEl.style.display = 'none';
        b.innerContent.appendChild(widgetLabelEl);
        this.widgetLabelEl = widgetLabelEl;

        const wrap = document.createElement('div');
        wrap.className = 'text-widget-content';
        wrap.style.width = '100%';
        wrap.style.flex = '1 1 0';
        wrap.style.minHeight = '0';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.position = 'relative';

        const scrollHost = document.createElement('div');
        scrollHost.className = 'text-md-scroll-host-base';
        scrollHost.style.width = '100%';
        scrollHost.style.flex = 'none';
        scrollHost.style.minHeight = 'auto';
        scrollHost.style.display = 'block';
        scrollHost.style.boxSizing = 'border-box';

        const mdRoot = document.createElement('div');
        mdRoot.className = 'text-md-root text-md-scoped';
        mdRoot.style.flex = 'none';
        mdRoot.style.minHeight = '0';
        mdRoot.style.width = '100%';
        mdRoot.style.overflow = 'visible';
        mdRoot.style.boxSizing = 'border-box';

        scrollHost.appendChild(mdRoot);
        wrap.appendChild(scrollHost);
        b.innerContent.appendChild(wrap);

        b.container.classList.add('interactive', 'text-widget-container');

        this.txtEl = wrap;
        this.mdScrollHost = scrollHost;
        this.mdRoot = mdRoot;
        if (!this._boundMdWheelHandler) this._boundMdWheelHandler = this._onMdWheel.bind(this);
        scrollHost.addEventListener('wheel', this._boundMdWheelHandler, { passive: false });
        if (!this._boundMdClickHandler) this._boundMdClickHandler = this._onMdClick.bind(this);
        scrollHost.addEventListener('click', this._boundMdClickHandler, false);

        return b;
    }

    /**
     * Wheel UX: if only horizontal overflow exists, use wheel to scroll sideways.
     * When vertical overflow exists, keep normal vertical wheel behavior.
     */
    _onMdWheel(evt) {
        const scrollHost = this.mdScrollHost;
        if (!scrollHost || !evt) return;
        if (!scrollHost.classList.contains('text-md-scroll-host')) return;
        const hasVerticalOverflow = scrollHost.scrollHeight > (scrollHost.clientHeight + 1);
        if (hasVerticalOverflow) return;
        const hasHorizontalOverflow = scrollHost.scrollWidth > (scrollHost.clientWidth + 1);
        if (!hasHorizontalOverflow) return;
        const delta = evt.deltaY !== 0 ? evt.deltaY : evt.deltaX;
        if (!delta) return;
        scrollHost.scrollLeft += delta;
        evt.preventDefault();
    }

    /** Blocks link navigation in edit mode; otherwise allows native browser behavior. */
    _onMdClick(evt) {
        if (!evt || evt.defaultPrevented) return;
        const c = this.config;
        if (typeof Dashboard === 'undefined' || (!Dashboard.isEditMode && !(c && c.deactivated))) return;

        const root = this.mdScrollHost || this.mdRoot;
        if (!root) return;

        var el = evt.target;
        while (el && el !== root) {
            if (el.tagName && String(el.tagName).toLowerCase() === 'a') break;
            el = el.parentNode;
        }
        if (!el || el === root) return;

        var href = el.getAttribute('href');
        if (!href) return;
        href = String(href).trim();
        if (!href.length || href.charAt(0) === '#') return;

        evt.preventDefault();
    }

    _getContentSwapCoordinator() {
        if (!this._contentSwapCoordinator && typeof WidgetAnimations !== 'undefined'
            && typeof WidgetAnimations.createContentSwap === 'function') {
            var widget = this;
            this._contentSwapCoordinator = WidgetAnimations.createContentSwap({
                coalesceMs: TextWidget.CONTENT_ANIM_COALESCE_MS,
                onSwapDone: function () {
                    if (!widget) return;
                    var root = widget.mdRoot;
                    var host = widget.txtEl;
                    if (typeof WidgetAnimations !== 'undefined') {
                        if (typeof WidgetAnimations.purgeSwapArtifacts === 'function') {
                            WidgetAnimations.purgeSwapArtifacts(host, root);
                        } else if (root && typeof WidgetAnimations.releaseTargetVisible === 'function') {
                            WidgetAnimations.releaseTargetVisible(root, host);
                        }
                    }
                    widget._commitTextContentFromConfig();
                    if (widget.config) widget._applyTextWidgetChrome(widget.config, true);
                }
            });
        }
        return this._contentSwapCoordinator || null;
    }

    onRemove() {
        var coord = this._getContentSwapCoordinator();
        if (coord) coord.dispose(this.mdRoot);
        this._contentSwapCoordinator = null;
        if (typeof TextScroll !== 'undefined' && TextScroll.teardown) {
            TextScroll.teardown(this);
        }
        if (this._autoFitResizeObserver) {
            this._autoFitResizeObserver.disconnect();
            this._autoFitResizeObserver = null;
        }
        if (this.mdScrollHost && this._boundMdWheelHandler) {
            this.mdScrollHost.removeEventListener('wheel', this._boundMdWheelHandler, false);
        }
        if (this.mdScrollHost && this._boundMdClickHandler) {
            this.mdScrollHost.removeEventListener('click', this._boundMdClickHandler, false);
        }
        this._boundMdWheelHandler = null;
        this._boundMdClickHandler = null;
        super.onRemove();
    }

    pauseForBackground() {
        if (typeof TextScroll !== 'undefined' && TextScroll.teardown) {
            TextScroll.teardown(this);
        }
    }

    resumeFromBackground() {
        if (this.elements && this.elements.wrapper && this.elements.wrapper.style.display === 'none') {
            return;
        }
        if (typeof TextScroll === 'undefined' || !TextScroll.scheduleSync) {
            if (this._autoFitOnReveal === true) this._resumeAutoFitAfterShow();
            return;
        }
        var widget = this;
        function startScroll() {
            if (widget.elements && widget.elements.wrapper && widget.elements.wrapper.style.display === 'none') {
                return;
            }
            if (widget._autoFitOnReveal === true) widget._resumeAutoFitAfterShow();
            TextScroll.scheduleSync(widget);
        }
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(startScroll);
        } else {
            startScroll();
        }
    }

    _resumeAutoFitAfterShow() {
        if (this._autoFitOnReveal !== true) return;
        if (this.elements && this.elements.wrapper && this.elements.wrapper.style.display === 'none') return;
        var c = this.config;
        if (c && c.mdAutoFitText === true) this._syncTextAutoFit(c);
    }

    /** Builds a fingerprint of all keys that affect per-element typography styling. */
    _buildStyleSignature(c) {
        var keys = TextWidget._STYLE_SIG_KEYS;
        var parts = new Array(keys.length + 1);
        for (var i = 0; i < keys.length; i++) {
            parts[i] = c[keys[i]];
        }
        parts[keys.length] = BaseWidget.getThemeColorsSignature();
        return parts.join('\x01');
    }

    /**
     * Theme + markdown icon options shared by content and animation source signatures.
     */
    _buildMarkdownRenderMetaSignature(c) {
        var themeSig = typeof BaseWidget.getThemeColorsSignature === 'function' ? BaseWidget.getThemeColorsSignature() : '';
        var iconSig = String(c.mdIconWeight || '') + '\x02'
            + String(c.mdIconAccentColor || '') + '\x02'
            + String(c.mdIconAccentOpacity != null ? c.mdIconAccentOpacity : '') + '\x02'
            + String(c.mdIconColor || '') + '\x02'
            + String(c.mdIconOpacity != null ? c.mdIconOpacity : '');
        var localeSig = (typeof DashboardI18n !== 'undefined' && typeof DashboardI18n.getEffectiveLocaleSetting === 'function')
            ? (DashboardI18n.getEffectiveLocaleSetting() + '\x02' + JSON.stringify(typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.customLocale : null))
            : '';
        return themeSig + '\x01' + iconSig + '\x01' + String(c.mdLinkTarget || 'markdown') + '\x01' + localeSig;
    }

    /**
     * Fingerprint for whether **Animations & Effects** should run: Text Content source only
     * (not inline {{topic}} inserts). Inline live values still re-render via {@link #_buildContentSignature}.
     * Topic-bound Text Content changes when the bound payload changes (separate from inline tokens).
     */
    _buildAnimationSourceSignature(c) {
        var raw = this._getMarkdownTemplateSource(c);
        if (raw === '') return '\x00';
        return raw + '\x01' + this._buildMarkdownRenderMetaSignature(c);
    }

    /**
     * Cheap fingerprint of everything that influences markdown HTML output:
     * raw text source + all resolved {{topic}} values + theme + markdown icon options.
     * Avoids re-running markdown-it + DOMPurify when only geometry/style changed.
     */
    _buildContentSignature(c) {
        var raw = this._getMarkdownTemplateSource(c);
        if (raw === '') return '\x00';
        var metaSig = this._buildMarkdownRenderMetaSignature(c);
        var paths = TextWidget.collectMarkdownDataTopicPaths(raw);
        if (paths.length === 0) return raw + '\x01' + metaSig;
        var parts = [raw];
        for (var i = 0; i < paths.length; i++) {
            var resolved = this._resolveMarkdownDataPath(paths[i]);
            parts.push(paths[i]);
            parts.push(resolved === undefined || resolved === null ? '' : String(resolved));
        }
        parts.push(metaSig);
        return parts.join('\x01');
    }

    /** Conditionally updates a CSS custom property only when the value has changed. */
    _setCssVarIfChanged(el, prop, value) {
        if (!this._cachedCssVars) this._cachedCssVars = {};
        if (this._cachedCssVars[prop] === value) return false;
        el.style.setProperty(prop, value);
        this._cachedCssVars[prop] = value;
        return true;
    }

    _topicAffectsMarkdownTemplate(topic) {
        return this._markdownTemplateReferencesTopic(topic);
    }

    /**
     * Column count of the markdown that is actually showing: bound Text Content, then inline {{topic}} values.
     * Used by the editor while this widget is selected. Does not read get config.
     */
    liveMarkdownTableColumnCount(staticText) {
        var src = staticText == null ? '' : String(staticText);
        var boundKey = this.bindings && typeof this.bindings.text === 'string' ? this.bindings.text : '';
        if (boundKey) {
            var resolved = this.resolveValue('text', src);
            src = resolved == null ? '' : String(resolved);
        }
        src = TextWidget.expandEscapedNewlines(src);
        if (src.indexOf('{{') !== -1) {
            src = this._resolveMarkdownDynamicPlaceholders(src, false);
        }
        return TextWidget.getMaxMarkdownTableColumnCount(src);
    }

    /** In-place inspector update when a new payload changes the live table. No width values are saved. */
    _refreshCustomColumnEditorsFromLive(textBindingHit, templateHit) {
        if (!textBindingHit && !templateHit) return;
        if (typeof Dashboard === 'undefined' || !Dashboard.isEditMode) return;
        if (typeof Editor === 'undefined' || !Editor || Editor.currentId !== this.id) return;
        var modeRaw = this.overrides ? this.overrides.mdTableColumnWidthMode : '';
        if (TextWidget.normalizeTableColumnWidthMode(modeRaw) !== TextWidget.TABLE_COLUMN_WIDTH_MODE_CUSTOM) return;
        if (typeof Editor.refreshTextCustomColumnFields === 'function') {
            Editor.refreshTextCustomColumnFields();
        }
    }

    onIncomingData(topic, payload, count) {
        if (topic == null || topic === '') return false;
        const bindings = this.bindings || {};
        const altTopic = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function')
            ? HomeyTopicAlias.aliasOf(topic)
            : null;
        const hitKeys = Object.keys(bindings).filter((k) => bindings[k] === topic || (altTopic && bindings[k] === altTopic));
        const hasTemplateHit = this._topicAffectsMarkdownTemplate(topic);
        if (hitKeys.length === 0 && !hasTemplateHit) return false;
        this._refreshCustomColumnEditorsFromLive(hitKeys.indexOf('text') !== -1, hasTemplateHit);
        return true;
    }

    /** Ensure inline live updates land on the visible root, not a hidden mdRoot under a stale swap clone. */
    _ensureLiveMarkdownRootVisible() {
        var root = this.mdRoot;
        var host = this.txtEl;
        if (!root) return;
        if (typeof WidgetAnimations === 'undefined') return;
        if (typeof WidgetAnimations.isTargetSwapActive === 'function'
            && WidgetAnimations.isTargetSwapActive(root)) {
            return;
        }
        var coord = this._contentSwapCoordinator;
        if (coord && typeof coord.isPending === 'function' && coord.isPending()) {
            return;
        }
        if (typeof WidgetAnimations.purgeSwapArtifacts === 'function') {
            WidgetAnimations.purgeSwapArtifacts(host, root);
        } else if (typeof WidgetAnimations.releaseTargetVisible === 'function') {
            WidgetAnimations.releaseTargetVisible(root, host);
        }
    }

    /** Update mdRoot HTML, reusing a single plain <p> element in place when possible. */
    static _setMarkdownRootHtml(root, html) {
        if (!root) return;
        if (typeof html === 'string' && html.length >= 7
            && html.slice(0, 3) === '<p>' && html.slice(-4) === '</p>') {
            var inner = html.slice(3, -4);
            if (inner.indexOf('<') < 0 && inner.indexOf('&') < 0
                && root.children && root.children.length === 1
                && root.childNodes && root.childNodes.length === 1) {
                var p = root.firstElementChild;
                if (p && p.tagName === 'P' && p.children.length === 0 && !p.hasAttributes()) {
                    if (p.textContent !== inner) {
                        p.textContent = inner;
                    }
                    return;
                }
            }
        }
        root.innerHTML = html;
    }

    /** Refresh markdown HTML for inline `{{topic}}` value changes (never triggers content animation). */
    _applyInlineLiveContentHtml(html, contentSig) {
        var root = this.mdRoot;
        if (!root) return;
        this._ensureLiveMarkdownRootVisible();
        TextWidget._setMarkdownRootHtml(root, html);
        this._cachedRenderHtml = html;
        this._cachedContentSig = contentSig;
        this._cachedRenderableBodySig = TextWidget._buildRenderableBodySignature(this, this.config);
    }

    /** Cancel an in-flight content swap so presentation edits apply to the visible root immediately. */
    _releaseActiveContentSwap() {
        var root = this.mdRoot;
        var host = this.txtEl;
        if (!root) return;
        if (typeof WidgetAnimations !== 'undefined') {
            if (typeof WidgetAnimations.purgeSwapArtifacts === 'function') {
                WidgetAnimations.purgeSwapArtifacts(host, root);
                return;
            }
            if (typeof WidgetAnimations.isTargetSwapActive === 'function'
                && WidgetAnimations.isTargetSwapActive(root)
                && typeof WidgetAnimations.cancelTargetSwap === 'function') {
                WidgetAnimations.cancelTargetSwap(root);
            }
        }
        if (root.style && root.style.visibility === 'hidden') {
            root.style.visibility = '';
        }
    }

    _applyMarkdownCssVars(c, opts) {
        opts = opts || {};
        var liveInlineOnly = opts.liveInlineOnly === true;
        var root = this.mdRoot;
        if (!root || !c) return;
        var M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        var lh = M.defaultLabelLineHeight != null ? M.defaultLabelLineHeight : 1.5;
        var fitMult = 1;
        if (c.mdAutoFitText === true && this._autoFitMultiplier != null && this._autoFitMultiplier > 0) {
            fitMult = this._autoFitMultiplier;
        }
        var scaleBlockSpace = function (raw, hardDefault) {
            var fallback = hardDefault != null ? hardDefault : TextWidget.TEXT_MD_BLOCK_SPACE_DEFAULT;
            var n = parseInt(String(raw), 10);
            if (isNaN(n)) n = fallback;
            if (fitMult !== 1) n = Math.round(n * fitMult * 100) / 100;
            return n + 'px';
        };
        var tableRadius = c.mdTableBorderRadius;
        var tablePadding = c.mdTableCellPadding;
        if (fitMult !== 1) {
            tableRadius = Math.max(0, Math.round(Number(tableRadius) * fitMult * 100) / 100);
            tablePadding = Math.max(0, Math.round(Number(tablePadding) * fitMult * 100) / 100);
        }
        var lhStr = String(lh);
        var cssChanged = false;
        if (this._cachedLineHeight !== lhStr) {
            root.style.lineHeight = lhStr;
            this._cachedLineHeight = lhStr;
            cssChanged = true;
        }
        cssChanged = this._setCssVarIfChanged(root, '--text-md-line-height', lhStr) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-para-block-space', scaleBlockSpace(c.textMdParaBlockSpace)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-h1-block-space', scaleBlockSpace(c.textMdH1BlockSpace)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-h2-block-space', scaleBlockSpace(c.textMdH2BlockSpace)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-h3-block-space', scaleBlockSpace(c.textMdH3BlockSpace)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-th-block-space', scaleBlockSpace(c.textMdThBlockSpace)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-td-block-space', scaleBlockSpace(c.textMdTdBlockSpace, TextWidget.TEXT_MD_TABLE_TEXT_BLOCK_SPACE_DEFAULT)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-block-typography-block-space', scaleBlockSpace(c.textMdBlockTypographyBlockSpace)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-code-block-space', scaleBlockSpace(c.textMdCodeBlockSpace)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-table-radius', String(tableRadius) + 'px') || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-table-cell-padding', String(tablePadding) + 'px') || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-table-border', TextWidget.resolveMarkdownColorWithOpacity(c.mdTableBorderColor, c.mdTableBorderOpacity)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-separator-color', TextWidget.resolveMarkdownColorWithOpacity(c.mdSeparatorColor, c.mdSeparatorOpacity)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-th-bg', TextWidget.resolveMarkdownColorWithOpacity(c.mdTableHeaderBg, c.mdTableHeaderBgOpacity)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-th-accent-bg', TextWidget.resolveMarkdownColorWithOpacity(c.mdTableHeaderAccentBg, c.mdTableHeaderAccentBgOpacity)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-tr-bg', TextWidget.resolveMarkdownColorWithOpacity(c.mdTableRowBg, c.mdTableRowBgOpacity)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-tr-alt', TextWidget.resolveMarkdownColorWithOpacity(c.mdTableRowAltBg, c.mdTableRowAltBgOpacity)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-hr-color', TextWidget.resolveMarkdownColorWithOpacity(c.mdHrColor, c.mdHrOpacity)) || cssChanged;
        cssChanged = this._setCssVarIfChanged(root, '--text-md-icon-color', TextWidget.resolveMarkdownColorWithOpacity(c.mdIconColor, c.mdIconOpacity)) || cssChanged;
        for (let bi = 1; bi <= 4; bi++) {
            var bcol = c['mdBlock' + bi + 'Color'];
            var bpre = 'text-md-block-' + bi;
            cssChanged = this._setCssVarIfChanged(root, '--' + bpre + '-solid', TextWidget.resolveMarkdownColorWithOpacity(bcol, 100)) || cssChanged;
            cssChanged = this._setCssVarIfChanged(root, '--' + bpre + '-bg', TextWidget.resolveMarkdownColorWithOpacity(bcol, 30)) || cssChanged;
            cssChanged = this._setCssVarIfChanged(root, '--' + bpre + '-border', TextWidget.resolveMarkdownColorWithOpacity(bcol, 38)) || cssChanged;
        }
        if (c.deactivated) {
            var deactCol = BaseWidget.getDeactivatedColor(c);
            var accentCol = BaseWidget.getDeactivatedColorAccent(c);
            cssChanged = this._setCssVarIfChanged(root, '--text-md-table-border', deactCol) || cssChanged;
            cssChanged = this._setCssVarIfChanged(root, '--text-md-separator-color', deactCol) || cssChanged;
            cssChanged = this._setCssVarIfChanged(root, '--text-md-hr-color', deactCol) || cssChanged;
            cssChanged = this._setCssVarIfChanged(root, '--text-md-icon-color', accentCol) || cssChanged;
            cssChanged = this._setCssVarIfChanged(root, '--text-md-th-bg', 'transparent') || cssChanged;
            cssChanged = this._setCssVarIfChanged(root, '--text-md-th-accent-bg', 'transparent') || cssChanged;
            cssChanged = this._setCssVarIfChanged(root, '--text-md-tr-bg', 'transparent') || cssChanged;
            cssChanged = this._setCssVarIfChanged(root, '--text-md-tr-alt', 'transparent') || cssChanged;
            for (let bi = 1; bi <= 4; bi++) {
                var bpre = 'text-md-block-' + bi;
                cssChanged = this._setCssVarIfChanged(root, '--' + bpre + '-solid', accentCol) || cssChanged;
                cssChanged = this._setCssVarIfChanged(root, '--' + bpre + '-bg', 'transparent') || cssChanged;
                cssChanged = this._setCssVarIfChanged(root, '--' + bpre + '-border', deactCol) || cssChanged;
            }
        }
        if (cssChanged && !liveInlineOnly && opts.autoFitSilent !== true) {
            this._releaseActiveContentSwap();
        }
    }

    /**
     * Typography, table classes, and column layout on parsed markdown DOM.
     * Always safe to run while content animation defers innerHTML — only appearance keys change.
     * @param {object} [opts]
     * @param {boolean} [opts.liveInlineOnly] HTML refresh from inline `{{topic}}` values only
     */
    _applyMarkdownDomPresentation(c, htmlChanged, opts) {
        opts = opts || {};
        var liveInlineOnly = opts.liveInlineOnly === true;
        var root = this.mdRoot;
        if (!root || !c) return;

        var styleSig = this._buildStyleSignature(c);
        var customColsSig = '';
        if (c.mdTableCustomColumnWidths && Array.isArray(c.mdTableCustomColumnWidths.columns)) {
            customColsSig = c.mdTableCustomColumnWidths.columns.join(',');
        }

        var tableStyleChanged = this._cachedTableStyle !== c.mdTableStyle
            || this._cachedCalWeekStart !== c.mdCalendarWeekStart;
        var styleChanged = styleSig !== this._cachedStyleSig;
        var columnLayoutChanged = this._cachedColMode !== c.mdTableColumnWidthMode
            || this._cachedColWidthPx !== c.mdTableColumnWidthPx
            || this._cachedCustomColsSig !== customColsSig;
        var presentationChanged = htmlChanged || tableStyleChanged || styleChanged || columnLayoutChanged;

        if (presentationChanged && !(htmlChanged && liveInlineOnly)) {
            this._releaseActiveContentSwap();
        }

        if (htmlChanged || tableStyleChanged) {
            this._applyTableClasses(root, c.mdTableStyle, c.mdCalendarWeekStart);
            this._cachedTableStyle = c.mdTableStyle;
            this._cachedCalWeekStart = c.mdCalendarWeekStart;
        }

        if (htmlChanged || styleChanged) {
            this._applyMarkdownTypographyPresentation(c);
            this._cachedStyleSig = styleSig;
        }

        if (htmlChanged || columnLayoutChanged) {
            TextWidget._mdTableApplyUserColumnLayout(root, c);
            this._cachedColMode = c.mdTableColumnWidthMode;
            this._cachedColWidthPx = c.mdTableColumnWidthPx;
            this._cachedCustomColsSig = customColsSig;
        }

        if (c.mdTableColumnWidthMode === TextWidget.TABLE_COLUMN_WIDTH_MODE_ALIGN
            && (htmlChanged || columnLayoutChanged)) {
            if (!this._pendingSyncRaf) {
                this._pendingSyncRaf = true;
                var self = this;
                var syncRoot = root;
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(function () {
                        self._pendingSyncRaf = false;
                        TextWidget._syncMarkdownTableColumnWidths(syncRoot);
                        if (self.config && self.config.mdAutoFitText === true) {
                            self._syncTextAutoFit(self.config);
                        }
                        if (typeof TextScroll !== 'undefined' && TextScroll.scheduleSync) {
                            TextScroll.scheduleSync(self);
                        }
                    });
                } else {
                    this._pendingSyncRaf = false;
                    TextWidget._syncMarkdownTableColumnWidths(root);
                    if (this.config && this.config.mdAutoFitText === true) {
                        this._syncTextAutoFit(this.config);
                    }
                    if (typeof TextScroll !== 'undefined' && TextScroll.scheduleSync) {
                        TextScroll.scheduleSync(this);
                    }
                }
            }
        }

        if (c.text && typeof MarkdownCellColor !== 'undefined'
            && MarkdownCellColor.sourceHasCellDirectives(c.text)) {
            TextWidget._applyCellBackgroundFromSource(root, c.text);
        }
        if (c.text && typeof MarkdownTextColor !== 'undefined'
            && MarkdownTextColor.sourceHasTextColorDirectives
            && MarkdownTextColor.sourceHasTextColorDirectives(c.text)) {
            MarkdownTextColor.reapplyFromDataAttrs(root);
        }
        if (c.text && typeof MarkdownBlink !== 'undefined'
            && MarkdownBlink.sourceHasBlinkDirectives
            && MarkdownBlink.sourceHasBlinkDirectives(c.text)) {
            if (MarkdownBlink.reapplyFromDataAttrs) {
                MarkdownBlink.reapplyFromDataAttrs(root);
            }
            if (htmlChanged && MarkdownBlink.syncPhase) {
                MarkdownBlink.syncPhase(root);
            }
        }
        if (typeof MarkdownImageTint !== 'undefined' && MarkdownImageTint.reapplyFromDataAttrs
            && root.querySelector('[data-text-md-img-tint]')) {
            MarkdownImageTint.reapplyFromDataAttrs(root);
        }
    }

    /**
     * Effective vertical alignment. In Responsive Columns layout the saved setting is
     * ignored and content is always pinned to the top; otherwise the configured value wins.
     */
    static _effectiveTextVerticalAlign(c, fallback) {
        if (typeof BaseWidget !== 'undefined' && BaseWidget.isResponsiveMode && BaseWidget.isResponsiveMode()) {
            return 'top';
        }
        return (c && c.textVerticalAlign) ? c.textVerticalAlign : (fallback || 'middle');
    }

    /** Map widget vertical alignment to animation shell alignment (host `data-wa-align`). */
    _animationAlignForVertical(c) {
        var vAlign = TextWidget._effectiveTextVerticalAlign(c, 'middle');
        if (vAlign === 'bottom') return 'bottom';
        if (vAlign === 'middle' || vAlign === 'center') return 'middle';
        return 'top';
    }

    _clearMdRootScrollContentAlign(root) {
        if (!root || !root.style) return;
        root.style.display = '';
        root.style.flexDirection = '';
        root.style.minHeight = '';
        root.style.justifyContent = '';
    }

    /** Scroll mode: pin short content top/middle/bottom inside the scroll host via mdRoot flex. */
    _applyMdRootScrollContentAlign(root, vAlign) {
        if (!root || !root.style) return;
        root.style.display = 'flex';
        root.style.flexDirection = 'column';
        root.style.minHeight = '100%';
        root.style.boxSizing = 'border-box';
        if (vAlign === 'bottom') {
            root.style.justifyContent = 'flex-end';
        } else if (vAlign === 'middle' || vAlign === 'center') {
            root.style.justifyContent = 'center';
        } else {
            root.style.justifyContent = 'flex-start';
        }
    }

    /** Pin scroll host to vertical alignment after layout changes or post content-swap chrome reapply. */
    _syncScrollOverflowPosition(c) {
        if (!c || c.mdOverflowScroll !== true) return;
        var scrollHost = this.mdScrollHost;
        if (!scrollHost) return;
        var vAlign = TextWidget._effectiveTextVerticalAlign(c, 'top');
        if (vAlign === 'bottom') {
            scrollHost.scrollTop = scrollHost.scrollHeight;
        } else if (vAlign === 'middle' || vAlign === 'center') {
            scrollHost.scrollTop = Math.max(0, Math.floor((scrollHost.scrollHeight - scrollHost.clientHeight) / 2));
        } else {
            scrollHost.scrollTop = 0;
        }
    }

    _resetAutoFitMultiplier(c) {
        if (this._autoFitMultiplier == null || this._autoFitMultiplier === 1) {
            this._autoFitMultiplier = 1;
            this._cachedAutoFitMultiplier = 1;
            return;
        }
        this._autoFitMultiplier = 1;
        this._cachedAutoFitMultiplier = 1;
        if (c && this.mdRoot) {
            this._applyMarkdownCssVars(c, { autoFitSilent: true });
            this._applyMarkdownTypographyPresentation(c);
        }
    }

    _measureAutoFitContent(root) {
        return {
            w: Math.max(root.scrollWidth, root.offsetWidth),
            h: Math.max(root.scrollHeight, root.offsetHeight)
        };
    }

    _contentFitsAutoFitBox(root, boxW, boxH) {
        var measured = this._measureAutoFitContent(root);
        return measured.w <= (boxW + 1) && measured.h <= (boxH + 1);
    }

    _applyAutoFitPresentation(c, silent) {
        this._applyMarkdownCssVars(c, { autoFitSilent: silent === true });
        this._applyMarkdownTypographyPresentation(c);
        var root = this.mdRoot;
        if (root) {
            TextWidget._mdTableApplyUserColumnLayout(root, c);
        }
    }

    _ensureAutoFitResizeObserver() {
        if (this._autoFitResizeObserver || typeof ResizeObserver === 'undefined') return;
        var scrollHost = this.mdScrollHost;
        if (!scrollHost) return;
        var self = this;
        this._autoFitResizeObserver = new ResizeObserver(function () {
            if (self.config && self.config.mdAutoFitText === true) {
                self._scheduleTextAutoFit(self.config);
            }
        });
        this._autoFitResizeObserver.observe(scrollHost);
    }

    _scheduleTextAutoFit(c) {
        if (!c || c.mdAutoFitText !== true) return;
        if (this._pendingAutoFitRaf) return;
        this._pendingAutoFitRaf = true;
        var self = this;
        var cfg = c;
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(function () {
                self._pendingAutoFitRaf = false;
                self._syncTextAutoFit(cfg || self.config);
            });
        } else {
            this._pendingAutoFitRaf = false;
            this._syncTextAutoFit(cfg || this.config);
        }
    }

    /**
     * Binary-search a uniform typography multiplier so content fits the bounded host at full width.
     * Uses inline font sizes (not transform) so content-swap clones already match the target scale.
     */
    _syncTextAutoFit(c) {
        if (!c || c.mdAutoFitText !== true) {
            this._resetAutoFitMultiplier(c);
            return;
        }
        var scrollHost = this.mdScrollHost;
        var root = this.mdRoot;
        if (!scrollHost || !root) return;
        if (typeof WidgetAnimations !== 'undefined'
            && typeof WidgetAnimations.isTargetSwapActive === 'function'
            && WidgetAnimations.isTargetSwapActive(root)) {
            return;
        }

        var boxW = scrollHost.clientWidth;
        var boxH = scrollHost.clientHeight;
        if (boxW < 1 || boxH < 1) return;

        var hasContent = root.childNodes.length > 0 || String(root.textContent || '').trim() !== '';
        if (!hasContent) {
            this._autoFitMultiplier = 1;
            this._cachedAutoFitMultiplier = 1;
            return;
        }

        var self = this;
        var lo = TextWidget.AUTO_FIT_SCALE_MIN;
        var hi = TextWidget.AUTO_FIT_SCALE_MAX;
        var best = 1;

        this._autoFitMultiplier = 1;
        this._applyAutoFitPresentation(c, true);
        if (this._contentFitsAutoFitBox(root, boxW, boxH)) {
            lo = 1;
            best = 1;
            for (var up = 0; up < 12; up++) {
                var midUp = (lo + hi) / 2;
                self._autoFitMultiplier = midUp;
                self._applyAutoFitPresentation(c, true);
                if (self._contentFitsAutoFitBox(root, boxW, boxH)) {
                    best = midUp;
                    lo = midUp;
                } else {
                    hi = midUp;
                }
                if (hi - lo < TextWidget.AUTO_FIT_SCALE_EPS) break;
            }
        } else {
            hi = 1;
            best = lo;
            for (var down = 0; down < 12; down++) {
                var midDown = (lo + hi) / 2;
                self._autoFitMultiplier = midDown;
                self._applyAutoFitPresentation(c, true);
                if (self._contentFitsAutoFitBox(root, boxW, boxH)) {
                    best = midDown;
                    lo = midDown;
                } else {
                    hi = midDown;
                }
                if (hi - lo < TextWidget.AUTO_FIT_SCALE_EPS) break;
            }
        }

        if (Math.abs(best - 1) < TextWidget.AUTO_FIT_SCALE_EPS) best = 1;
        if (this._cachedAutoFitMultiplier === best && this._autoFitMultiplier === best) {
            return;
        }

        this._autoFitMultiplier = best;
        this._cachedAutoFitMultiplier = best;
        this._applyAutoFitPresentation(c, false);
    }

    /** Apply absolute bounded host styles shared by scroll and auto-fit modes. */
    _applyBoundedScrollHostLayout(scrollHost, root, vAlign, overflowMode, useFlexContentAlign) {
        var wrap = this.txtEl;
        this._pinInnerContentLayout(this.elements.innerContent);
        if (this.elements.innerContent && this.elements.innerContent.style) {
            this.elements.innerContent.style.overflow = 'hidden';
        }
        if (wrap && wrap.style) {
            wrap.style.flex = '1 1 0';
            wrap.style.minHeight = '0';
            wrap.style.height = '';
            wrap.style.width = '100%';
            wrap.style.alignSelf = 'stretch';
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'column';
            wrap.style.justifyContent = 'flex-start';
        }
        scrollHost.style.flex = 'none';
        scrollHost.style.minHeight = '0';
        scrollHost.style.display = 'flex';
        scrollHost.style.flexDirection = 'column';
        scrollHost.style.maxHeight = '';
        scrollHost.style.position = 'absolute';
        scrollHost.style.left = '0';
        scrollHost.style.top = '0';
        scrollHost.style.right = '0';
        scrollHost.style.bottom = '0';
        scrollHost.style.width = '100%';
        scrollHost.style.height = '100%';
        scrollHost.style.pointerEvents = 'auto';
        scrollHost.style.webkitOverflowScrolling = overflowMode === 'scroll' ? 'touch' : '';
        if (overflowMode === 'scroll') {
            scrollHost.style.overflow = '';
            scrollHost.style.overflowX = 'auto';
            scrollHost.style.overflowY = 'auto';
        } else {
            scrollHost.style.overflow = 'hidden';
            scrollHost.style.overflowX = 'hidden';
            scrollHost.style.overflowY = 'hidden';
        }
        root.style.flex = 'none';
        root.style.width = '100%';
        root.style.height = 'auto';
        root.style.maxHeight = 'none';
        root.style.position = '';
        root.style.overflow = 'visible';
        if (useFlexContentAlign) {
            this._applyMdRootScrollContentAlign(root, vAlign);
        } else {
            this._clearMdRootScrollContentAlign(root);
        }
    }

    /** Widget label stays at the top; vertical alignment applies to markdown content only. */
    _applyWrapVerticalAlign(wrap, vAlign) {
        if (!wrap || !wrap.style) return;
        if (vAlign === 'bottom') {
            wrap.style.justifyContent = 'flex-end';
        } else if (vAlign === 'middle' || vAlign === 'center') {
            wrap.style.justifyContent = 'center';
        } else {
            wrap.style.justifyContent = 'flex-start';
        }
    }

    _pinInnerContentLayout(el) {
        if (!el || !el.style) return;
        el.style.justifyContent = 'flex-start';
        el.style.alignItems = 'stretch';
    }

    /** Reset scroll host to shrink-wrap layout (default text widget mode). */
    _applyShrinkWrapScrollHostLayout(scrollHost, root, wrap, vAlign, rootRef) {
        // Legacy WebKit (iOS 12): keep the scroll host shrink-wrapped; pin vertical alignment on the
        // content wrapper below the widget label so Safari 12 still sees a non-zero content box.
        this._pinInnerContentLayout(this.elements.innerContent);
        if (this.elements.innerContent && this.elements.innerContent.style) {
            // Shrink-wrap must not clip the markdown. flex-basis 0 + min-height 0
            // collapses the body to nothing inside an overflow-hidden frame.
            this.elements.innerContent.style.overflow = 'visible';
        }
        if (wrap && wrap.style) {
            wrap.style.flex = '1 1 auto';
            wrap.style.minHeight = 'auto';
            wrap.style.height = '';
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'column';
            this._applyWrapVerticalAlign(wrap, vAlign);
        }
        scrollHost.classList.remove('text-md-scroll-host');
        TextWidget._clearScrollbarThemeVars(scrollHost);
        scrollHost.style.flex = 'none';
        scrollHost.style.minHeight = 'auto';
        scrollHost.style.display = 'block';
        scrollHost.style.flexDirection = '';
        scrollHost.style.maxHeight = '';
        scrollHost.style.position = '';
        scrollHost.style.left = '';
        scrollHost.style.top = '';
        scrollHost.style.right = '';
        scrollHost.style.bottom = '';
        scrollHost.style.width = '100%';
        scrollHost.style.height = 'auto';
        scrollHost.style.overflowX = '';
        scrollHost.style.overflowY = '';
        scrollHost.style.webkitOverflowScrolling = '';
        scrollHost.style.overflow = 'visible';
        scrollHost.style.pointerEvents = '';
        root.style.flex = 'none';
        root.style.width = '100%';
        root.style.height = 'auto';
        root.style.maxHeight = '';
        root.style.overflow = 'visible';
        this._clearMdRootScrollContentAlign(root);
        this._resetAutoFitMultiplier(this.config);
        var swapActive = typeof WidgetAnimations !== 'undefined'
            && typeof WidgetAnimations.isTargetSwapActive === 'function'
            && WidgetAnimations.isTargetSwapActive(rootRef || root);
        if (!swapActive) {
            wrap.style.overflow = '';
        }
    }

    /**
     * Auto Cell Height: measure the markdown document, not the bounded scroll viewport.
     * Scroll Overflow Content / Auto-Fit pin the host with position:absolute, so the
     * container's scrollHeight collapses and masonry falls back to Min Widget Height.
     */
    measureResponsiveIntrinsicHeight() {
        var container = this.elements && this.elements.container;
        var root = this.mdRoot;
        if (!container || !root) return 0;
        if (typeof TextScroll !== 'undefined' && TextScroll.isActive && TextScroll.isActive(this.config)) {
            return Math.max(container.offsetHeight || 0, container.clientHeight || 0);
        }
        var cs = container.style;
        var prevHeight = cs.height;
        var prevMin = root.style.minHeight;
        var prevJustify = root.style.justifyContent;
        cs.height = 'auto';
        root.style.minHeight = '0';
        root.style.justifyContent = 'flex-start';
        var h = 0;
        try {
            var label = this.widgetLabelEl;
            var labelH = 0;
            if (label && label.style.display !== 'none') {
                labelH = Math.max(label.offsetHeight || 0, label.scrollHeight || 0);
                if (labelH > 0) labelH += 8;
            }
            var contentH = Math.max(root.scrollHeight || 0, root.offsetHeight || 0);
            var padY = 0;
            if (typeof window !== 'undefined' && window.getComputedStyle) {
                var style = window.getComputedStyle(container);
                padY = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0)
                    + (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0);
            }
            h = labelH + contentH + padY;
        } finally {
            cs.height = prevHeight;
            root.style.minHeight = prevMin;
            root.style.justifyContent = prevJustify;
        }
        return h;
    }

    _bindMarkdownImagesForResponsiveReflow() {
        var root = this.mdRoot;
        if (!root) return;
        var imgs = root.querySelectorAll('img');
        var widget = this;
        this._mdImgReflowGen = (this._mdImgReflowGen || 0) + 1;
        var gen = this._mdImgReflowGen;
        var i;
        for (i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            if (img.getAttribute('data-ds-resp-reflow') === '1') continue;
            img.setAttribute('data-ds-resp-reflow', '1');
            if (img.complete) continue;
            var fire = function () {
                if (gen !== widget._mdImgReflowGen) return;
                if (typeof TextScroll !== 'undefined' && TextScroll.scheduleSync) {
                    TextScroll.scheduleSync(widget);
                }
                if (typeof BaseWidget !== 'undefined' && BaseWidget.isResponsiveMode
                        && BaseWidget.isResponsiveMode()
                        && typeof Dashboard !== 'undefined'
                        && typeof Dashboard._requestResponsiveReflow === 'function') {
                    var rl = (typeof BaseWidget.getResponsiveLayout === 'function')
                        ? BaseWidget.getResponsiveLayout(widget.overrides) : null;
                    if (typeof Dashboard.resolveResponsiveHeightMode === 'function'
                            && Dashboard.resolveResponsiveHeightMode(rl || {}) === 'fill') {
                        return;
                    }
                    Dashboard._requestResponsiveReflow(widget.id);
                }
            };
            img.addEventListener('load', fire);
            img.addEventListener('error', fire);
        }
    }

    /** Commit path for animated content HTML: update caches, re-apply DOM presentation and chrome. */
    _commitTextContentHtml(html, contentSig, animSourceSig, c) {
        var root = this.mdRoot;
        if (!root) return;
        TextWidget._setMarkdownRootHtml(root, html);
        this._cachedRenderHtml = html;
        this._cachedContentSig = contentSig;
        this._cachedRenderableBodySig = TextWidget._buildRenderableBodySignature(this, c);
        this._cachedAnimSourceSig = animSourceSig;
        this._applyMarkdownDomPresentation(c, true);
        if (c.mdAutoFitText === true) {
            this._syncTextAutoFit(c);
        } else {
            this._resetAutoFitMultiplier(c);
        }
        this._applyTextWidgetChrome(c, true);
        this._applyWidgetLabelPresentation(c);
        this._bindMarkdownImagesForResponsiveReflow();
    }

    /** Re-render markdown from current config (fresh inline `{{topic}}` values at commit time). */
    _commitTextContentFromConfig() {
        var c = this.config;
        if (!c) return;
        var html = this._renderMarkdownToSafeHtml(this._getMarkdownTemplateSource(c));
        this._commitTextContentHtml(
            html,
            this._buildContentSignature(c),
            this._buildAnimationSourceSignature(c),
            c
        );
    }

    /** Signature for widget label text + typography flat keys. */
    _widgetLabelRenderSignature(c) {
        if (!c) return '';
        return [
            c.label,
            c.textWidgetLabelFont,
            c.textWidgetLabelFs,
            c.textWidgetLabelCol,
            c.textWidgetLabelAlign,
            c.textWidgetLabelCase,
            c.textWidgetLabelBold,
            c.textWidgetLabelItalic,
            c.textWidgetLabelOffX,
            c.textWidgetLabelOffY,
            c.deactivated ? '1' : '0'
        ].join('\x01');
    }

    _applyWidgetLabelPresentation(c) {
        var el = this.widgetLabelEl;
        if (!el || !c) return;
        var labelText = c.label != null ? String(c.label) : '';
        el.textContent = labelText;
        el.style.display = labelText ? 'block' : 'none';
        if (labelText) {
            this.applyTypographyToElement(el, 'textWidgetLabel', c);
            if (c.deactivated) {
                el.style.color = BaseWidget.getDeactivatedColorAccent(c);
            }
            el.style.transform = 'translate(' + (c.textWidgetLabelOffX || 0) + 'px, ' + (c.textWidgetLabelOffY || 0) + 'px)';
            // Fixed gap below the label so it never touches the markdown content (e.g. a leading table),
            // independent of the per-role Vertical Spacing which can be 0.
            el.style.marginBottom = '8px';
        } else {
            el.style.transform = 'none';
            el.style.marginBottom = '0';
        }
        this._cachedWidgetLabelSig = this._widgetLabelRenderSignature(c);
    }

    /** Widget chrome: offset/rotation, scroll overflow host, flex alignment, animation host hint. */
    _applyTextWidgetChrome(c, force) {
        var forceApply = force === true;
        var el = this.elements.innerContent;
        var wrap = this.txtEl;
        var scrollHost = this.mdScrollHost;
        var root = this.mdRoot;
        if (!el || !wrap || !scrollHost || !root || !c) return;

        var transformStr = 'translate(' + c.textOffX + 'px, ' + c.textOffY + 'px) rotate(' + c.textRotation + 'deg)';
        var autoFitMode = c.mdAutoFitText === true;
        var scrollMode = !autoFitMode && c.mdOverflowScroll === true;
        var textScrollMode = !autoFitMode && !scrollMode
            && (c.textScroll === 'horizontal' || c.textScroll === 'vertical');
        var vAlign = TextWidget._effectiveTextVerticalAlign(c, 'middle');
        var useTypoAlign = TextWidget.useTypographyAlign(c);
        var hAlign = c.textAlign;
        var wrapOn = c.mdTextWrap !== false;
        var layoutMode = autoFitMode ? 'a' : (scrollMode ? 's' : (textScrollMode ? 't' : 'd'));
        var layoutKey = layoutMode + '\x01' + vAlign + '\x01' + (wrapOn ? 'w' : 'n')
            + '\x01' + (c.textScroll || 'none') + '\x01' + (c.textScrollMotion || 'loop');
        var hostLayoutChanged = this._cachedLayoutKey !== layoutKey;
        var chromeChanged = forceApply || hostLayoutChanged
            || this._cachedTransform !== transformStr
            || this._cachedUseTypoAlign !== useTypoAlign
            || this._cachedHAlign !== hAlign;
        if (chromeChanged) {
            this._releaseActiveContentSwap();
        }

        if (forceApply || this._cachedTransform !== transformStr) {
            wrap.style.transform = transformStr;
            this._cachedTransform = transformStr;
        }

        if (forceApply || this._cachedTextWrap !== wrapOn) {
            if (wrapOn) {
                root.classList.remove('text-md-nowrap');
            } else {
                root.classList.add('text-md-nowrap');
            }
            this._cachedTextWrap = wrapOn;
        }

        if (hostLayoutChanged) {
            this._pinInnerContentLayout(el);
            if (!textScrollMode && typeof TextScroll !== 'undefined' && TextScroll.teardown) {
                TextScroll.teardown(this);
            }
            if (autoFitMode) {
                scrollHost.classList.remove('text-md-scroll-host');
                TextWidget._clearScrollbarThemeVars(scrollHost);
                this._applyBoundedScrollHostLayout(scrollHost, root, vAlign, 'hidden', true);
            } else if (scrollMode) {
                scrollHost.classList.add('text-md-scroll-host');
                TextWidget._setScrollbarThemeVars(scrollHost);
                this._applyBoundedScrollHostLayout(scrollHost, root, vAlign, 'scroll', true);
                this._resetAutoFitMultiplier(c);
            } else if (textScrollMode) {
                scrollHost.classList.remove('text-md-scroll-host');
                TextWidget._clearScrollbarThemeVars(scrollHost);
                this._applyBoundedScrollHostLayout(scrollHost, root, vAlign, 'hidden', false);
                this._resetAutoFitMultiplier(c);
                if (wrap && wrap.style) wrap.style.overflow = 'hidden';
            } else {
                this._applyShrinkWrapScrollHostLayout(scrollHost, root, wrap, vAlign, root);
            }
            this._cachedLayoutKey = layoutKey;
            this._cachedScrollMode = scrollMode;
            this._cachedVAlign = vAlign;
        }

        wrap.setAttribute('data-wa-align', this._animationAlignForVertical(c));

        if (forceApply || hostLayoutChanged || this._cachedUseTypoAlign !== useTypoAlign || this._cachedHAlign !== hAlign) {
            if (autoFitMode || scrollMode || textScrollMode || useTypoAlign) {
                wrap.style.alignSelf = 'stretch';
                wrap.style.width = '100%';
            } else if (hAlign === 'center') {
                wrap.style.alignSelf = 'center';
                wrap.style.width = '';
            } else if (hAlign === 'right') {
                wrap.style.alignSelf = 'flex-end';
                wrap.style.width = '';
            } else {
                wrap.style.alignSelf = 'flex-start';
                wrap.style.width = '';
            }
            this._cachedUseTypoAlign = useTypoAlign;
            this._cachedHAlign = hAlign;
        }

        if (scrollMode && hostLayoutChanged) {
            var selfScroll = this;
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(function () {
                    selfScroll._syncScrollOverflowPosition(c);
                });
            } else {
                this._syncScrollOverflowPosition(c);
            }
        }

        if (autoFitMode) {
            this._ensureAutoFitResizeObserver();
        } else if (this._autoFitMultiplier != null && this._autoFitMultiplier !== 1) {
            this._resetAutoFitMultiplier(c);
        }

        if (textScrollMode && typeof TextScroll !== 'undefined' && TextScroll.scheduleSync) {
            TextScroll.scheduleSync(this);
        } else if (!textScrollMode && typeof TextScroll !== 'undefined' && TextScroll.teardown && this._textScroll) {
            TextScroll.teardown(this);
        }
    }

    _renderSpecific(resolvedConfig) {
        var c = resolvedConfig || this.config;
        var root = this.mdRoot;

        var contentSwap = this._getContentSwapCoordinator();
        if (root && contentSwap) contentSwap.releaseIfIdle(root);

        this._ensureScopedStyle();

        var contentSig = this._buildContentSignature(c);
        var animSourceSig = this._buildAnimationSourceSignature(c);
        var contentChanged = contentSig !== this._cachedContentSig;
        var animSourceChanged = animSourceSig !== this._cachedAnimSourceSig;
        if (typeof DashboardAudio !== 'undefined') {
            if (!this._audioContentStore) this._audioContentStore = {};
            DashboardAudio.observeChange(this._audioContentStore, contentSig, function () {
                DashboardAudio.playFrom(c.audio, 'textChange');
            });
        }
        var animOnInlineTopics = c.contentAnimationOnLiveTopics === true;
        var animTriggerChanged = animOnInlineTopics ? contentChanged : animSourceChanged;
        var templateHasInlineTopics = this._markdownTemplateHasInlineTopics(c);
        var mayInlineLiveRefresh = templateHasInlineTopics && !animSourceChanged && !animOnInlineTopics;

        this._applyMarkdownCssVars(c, { liveInlineOnly: mayInlineLiveRefresh });

        var cellHorizModesSig = TextWidget._tableCellHorizontalAlignModesSig(c);
        var cellHorizModesChanged = cellHorizModesSig !== this._cachedTableCellHorizAlignModesSig;
        var htmlChanged = false;

        if (contentChanged || cellHorizModesChanged || mayInlineLiveRefresh) {
            var markdownSrc = this._getMarkdownTemplateSource(c);
            var html = this._renderMarkdownToSafeHtml(markdownSrc);
            var contentSigNow = this._buildContentSignature(c);
            var bodySigNow = TextWidget._buildRenderableBodySignature(this, c);
            var htmlDiffers = html !== this._cachedRenderHtml;

            if (mayInlineLiveRefresh && htmlDiffers) {
                this._applyInlineLiveContentHtml(html, contentSigNow);
                htmlChanged = true;
            } else if (cellHorizModesChanged || htmlDiffers) {
                var anim = c.contentAnimation;
                var textScrollOn = (c.textScroll === 'horizontal' || c.textScroll === 'vertical');
                var inEditor = (typeof Dashboard !== 'undefined') && Dashboard.isEditMode;
                var firstPaint = (this._cachedRenderHtml === null || this._cachedRenderHtml === undefined);
                var animated = false;
                if (!textScrollOn && anim && anim !== 'none' && !inEditor && !firstPaint && animTriggerChanged && contentSwap) {
                    var self = this;
                    animated = contentSwap.notifyContentChange(
                        {
                            host: this.txtEl,
                            target: root,
                            animation: anim,
                            duration: c.contentAnimationDuration,
                            allowed: { categories: ['content-swap'] }
                        },
                        {
                            isFirstPaint: firstPaint,
                            applyLive: function () {
                                self._commitTextContentFromConfig();
                            },
                            commitDeferred: function () {
                                self._commitTextContentFromConfig();
                            }
                        }
                    );
                }
                if (!animated) {
                    TextWidget._setMarkdownRootHtml(root, html);
                    this._cachedRenderHtml = html;
                    if (contentChanged) this._cachedContentSig = contentSigNow;
                    this._cachedRenderableBodySig = bodySigNow;
                    if (animSourceChanged) this._cachedAnimSourceSig = animSourceSig;
                    htmlChanged = true;
                }
            } else if (contentChanged) {
                var bodyUnchanged = bodySigNow === this._cachedRenderableBodySig;
                if (bodyUnchanged) {
                    this._cachedContentSig = contentSigNow;
                } else {
                    TextWidget._setMarkdownRootHtml(root, html);
                    this._cachedRenderHtml = html;
                    this._cachedContentSig = contentSigNow;
                    this._cachedRenderableBodySig = bodySigNow;
                    if (animSourceChanged) this._cachedAnimSourceSig = animSourceSig;
                    htmlChanged = true;
                }
            }
            if (cellHorizModesChanged) {
                this._cachedTableCellHorizAlignModesSig = cellHorizModesSig;
            }
        }

        this._applyMarkdownDomPresentation(c, htmlChanged, {
            liveInlineOnly: mayInlineLiveRefresh && htmlChanged
        });

        this._autoFitOnReveal = c.mdAutoFitText === true;
        if (c.mdAutoFitText === true) {
            this._ensureAutoFitResizeObserver();
            this._syncTextAutoFit(c);
        } else {
            this._resetAutoFitMultiplier(c);
        }

        this._applyTextWidgetChrome(c);
        this._applyWidgetLabelPresentation(c);

        if (contentSwap) contentSwap.scheduleFlush();
    }

    _applyAnimatedContentDomStyling(root, c) {
        this._applyMarkdownDomPresentation(c, true);
        if (root && root !== this.mdRoot) {
            this._applyDropShadow(c, root);
        }
    }

    _hasPropertyFormulaCountdown() {
        if (typeof FormulaEngine === 'undefined' || typeof FormulaEngine.hasCountdown !== 'function') return false;
        const o = this.overrides || {};
        const keys = Object.keys(o);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (k.indexOf('_bind_formula') === k.length - 13 && typeof o[k] === 'string' && FormulaEngine.hasCountdown(o[k])) {
                return true;
            }
        }
        return false;
    }

    tickCountdowns() {
        if (this._hasPropertyFormulaCountdown()) {
            this._cachedContentSig = null;
            super.tickCountdowns();
            return;
        }
        const dirTokens = this._activeMdDirectiveCountdowns || [];
        for (let di = 0; di < dirTokens.length; di++) {
            const dt = dirTokens[di];
            let nextDirVal = this._evaluateMarkdownFormula(dt.inner, dt.id);
            if (nextDirVal === undefined || nextDirVal === null) nextDirVal = '-';
            nextDirVal = typeof nextDirVal === 'string' ? TextWidget.expandEscapedNewlines(nextDirVal) : String(nextDirVal);
            if (nextDirVal !== dt.lastVal) {
                this._cachedContentSig = null;
                super.tickCountdowns();
                return;
            }
        }
        const root = this.mdRoot;
        const tokens = this._activeMdCountdownTokens || [];
        if (!root || tokens.length === 0) {
            this._cachedContentSig = null;
            super.tickCountdowns();
            return;
        }
        const tokenMap = Object.create(null);
        for (let ti = 0; ti < tokens.length; ti++) {
            const tok = tokens[ti];
            let val = this._evaluateMarkdownFormula(tok.inner, tok.id);
            if (val === undefined || val === null) val = '-';
            val = typeof val === 'string' ? TextWidget.expandEscapedNewlines(val) : String(val);
            tokenMap[tok.id] = val;
        }
        const spans = root.querySelectorAll('.ds-formula-countdown[data-countdown-id]');
        let lenChanged = false;
        for (let si = 0; si < spans.length; si++) {
            const span = spans[si];
            const cid = span.getAttribute('data-countdown-id');
            if (cid && Object.prototype.hasOwnProperty.call(tokenMap, cid)) {
                const prevText = span.textContent || '';
                const nextText = tokenMap[cid];
                if (prevText !== nextText) {
                    if (prevText.length !== nextText.length) lenChanged = true;
                    span.textContent = nextText;
                }
            }
        }
        if (lenChanged && this.config && this.config.mdAutoFitText === true) {
            this._syncTextAutoFit(this.config);
        }
        this._hasActiveExtraCountdowns = typeof FormulaEngine !== 'undefined'
            && typeof FormulaEngine.hasActiveCountdownsForWidget === 'function'
            && FormulaEngine.hasActiveCountdownsForWidget(this.id);
        this._syncCountdownHeartbeatRegistration();
    }

}

// Static members are assigned after the class body (not as `static x = …` class
// fields) so the script parses on legacy WebKit (iOS 12 / Safari 12), which throws
// a SyntaxError on public/static class fields. See `.cursorrules` Legacy WebKit rule.

// Table header / body typography: honor GFM ` :---: ` column alignment unless overridden.
TextWidget.MD_TABLE_ALIGN_TABLE_DEFINED = 'table_defined';

TextWidget.TABLE_COLUMN_WIDTH_MODE_AUTO = 'auto';
TextWidget.TABLE_COLUMN_WIDTH_MODE_ALIGN = 'align_columns';
TextWidget.TABLE_COLUMN_WIDTH_MODE_EQUAL = 'equal_columns';
TextWidget.TABLE_COLUMN_WIDTH_MODE_FIXED = 'fixed_columns';
TextWidget.TABLE_COLUMN_WIDTH_MODE_CUSTOM = 'custom_columns';

// Coalesce rapid content updates before one transition (ms).
TextWidget.CONTENT_ANIM_COALESCE_MS = 80;

TextWidget.AUTO_FIT_SCALE_MIN = 0.15;
TextWidget.AUTO_FIT_SCALE_MAX = 5.0;
TextWidget.AUTO_FIT_SCALE_EPS = 0.005;

TextWidget.TEXT_MD_BLOCK_SPACE_DEFAULT = 8;
TextWidget.TEXT_MD_TABLE_TEXT_BLOCK_SPACE_DEFAULT = 0;
TextWidget.TEXT_MD_BLOCK_TYPO_LINE_HEIGHT_DEFAULT = 1.35;

TextWidget._mdInstance = null;
TextWidget._purifyHookInstalled = false;
TextWidget._purifyAnchorHookInstalled = false;
TextWidget._mdNewTabRendererInstalled = false;
TextWidget._sharedStyleEl = null;
TextWidget._sharedCssCache = null;

TextWidget._STYLE_SIG_KEYS = [
    'textMdParaFont', 'textMdParaFs', 'textMdParaCol', 'textMdParaBold', 'textMdParaItalic',
    'textMdParaAlign', 'textMdParaCase', 'textMdParaOpacity', 'textMdParaOffX', 'textMdParaOffY', 'textMdParaBlockSpace', 'textMdParaLineHeight',
    'textMdBlockTypographyFont', 'textMdBlockTypographyFs', 'textMdBlockTypographyCol', 'textMdBlockTypographyBold', 'textMdBlockTypographyItalic',
    'textMdBlockTypographyAlign', 'textMdBlockTypographyCase', 'textMdBlockTypographyOpacity', 'textMdBlockTypographyOffX', 'textMdBlockTypographyOffY', 'textMdBlockTypographyBlockSpace', 'textMdBlockTypographyLineHeight',
    'textMdCodeFont', 'textMdCodeFs', 'textMdCodeCol', 'textMdCodeBg', 'textMdCodeBold', 'textMdCodeItalic',
    'textMdCodeAlign', 'textMdCodeCase', 'textMdCodeOpacity', 'textMdCodeOffX', 'textMdCodeOffY', 'textMdCodeBlockSpace', 'textMdCodeLineHeight',
    'textMdH1Font', 'textMdH1Fs', 'textMdH1Col', 'textMdH1Bold', 'textMdH1Italic',
    'textMdH1Align', 'textMdH1Case', 'textMdH1Opacity', 'textMdH1OffX', 'textMdH1OffY', 'textMdH1BlockSpace', 'textMdH1LineHeight',
    'textMdH2Font', 'textMdH2Fs', 'textMdH2Col', 'textMdH2Bold', 'textMdH2Italic',
    'textMdH2Align', 'textMdH2Case', 'textMdH2Opacity', 'textMdH2OffX', 'textMdH2OffY', 'textMdH2BlockSpace', 'textMdH2LineHeight',
    'textMdH3Font', 'textMdH3Fs', 'textMdH3Col', 'textMdH3Bold', 'textMdH3Italic',
    'textMdH3Align', 'textMdH3Case', 'textMdH3Opacity', 'textMdH3OffX', 'textMdH3OffY', 'textMdH3BlockSpace', 'textMdH3LineHeight',
    'textMdThFont', 'textMdThFs', 'textMdThCol', 'textMdThBold', 'textMdThItalic',
    'textMdThAlign', 'textMdThCase', 'textMdThOpacity', 'textMdThOffX', 'textMdThOffY', 'textMdThColFilled', 'textMdThBlockSpace', 'textMdThLineHeight',
    'textMdTdFont', 'textMdTdFs', 'textMdTdCol', 'textMdTdBold', 'textMdTdItalic',
    'textMdTdAlign', 'textMdTdCase', 'textMdTdOpacity', 'textMdTdOffX', 'textMdTdOffY', 'textMdTdBlockSpace', 'textMdTdLineHeight',
    'mdBlock1Color', 'mdBlock2Color', 'mdBlock3Color', 'mdBlock4Color',
    'textAlign', 'labelCase', 'mdTableStyle',
    'dropShadowOpacity', 'dropShadowColor', 'dropShadowBlur',
    'deactivated', 'deactivatedColor', 'deactivatedColorAccent'
];

WidgetRegistry.register('text', TextWidget);
