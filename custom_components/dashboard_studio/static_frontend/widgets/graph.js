class GraphWidget extends BaseWidget {
    static get metadata() {
        return { shortName: "Graph", label: "Graph", icon: "ph-chart-line", category: "Data", color_dark: "hsl(160, 80%, 65%)", color_light: "hsl(160, 85%, 35%)", version: "2.3.3", date: "2026-11-04" };
    }

    static getLegendPositionOptions(values, isGlobal) {
        var isResp = (typeof BaseWidget !== 'undefined' && typeof BaseWidget.isResponsiveMode === 'function' && BaseWidget.isResponsiveMode())
            || (isGlobal && values && values.layoutMode === 'responsive');
        if (isResp) {
            return [
                { value: 'top', text: 'Top' },
                { value: 'bottom', text: 'Bottom' },
                { value: 'left', text: 'Left' },
                { value: 'right', text: 'Right' }
            ];
        }
        return [
            { value: 'top', text: 'Top' },
            { value: 'bottom', text: 'Bottom' },
            { value: 'left', text: 'Left' },
            { value: 'right', text: 'Right' },
            { value: 'floating', text: 'Floating' }
        ];
    }



    static get AXIS_Y_INHERIT_PROPS() {
        return ['fontFamily', 'fontSize', 'color', 'bold', 'opacity'];
    }

    static get INHERIT_EDITOR_TYPOGRAPHY_SLOTS() {
        return {
            leaderRole: 'axisX',
            followerRole: 'axisY',
            inheritProps: GraphWidget.AXIS_Y_INHERIT_PROPS,
            followerPrefix: 'axisY',
            leaderPrefix: 'axisX'
        };
    }

    static get GRAPH_AXIS_TYPO_EXTRA_BY_ROLE() {
        return {
            axisX: { fontSize: 'FontSize', color: 'FontColor', bold: 'FontBold', opacity: 'FontOpacity' },
            axisY: { fontSize: 'FontSize', color: 'FontColor', bold: 'FontBold', opacity: 'FontOpacity' }
        };
    }

    static get GRAPH_TYPOGRAPHY_ROLES() {
        return [
            ['widgetLabel', 'label'],
            ['axisX', 'axisX'],
            ['axisY', 'axisY'],
            ['dataText', 'text'],
            ['pointValues', 'pointVal'],
            ['pointValuesBar', 'pointValBar'],
            ['legendItem', 'legendItem']
        ];
    }

    static axisTypographyBlockFromFlat(c, prefix) {
        return {
            fontFamily: c[prefix + 'Font'],
            fontSize: c[prefix + 'FontSize'],
            color: c[prefix + 'FontColor'],
            bold: c[prefix + 'FontBold'],
            opacity: c[prefix + 'FontOpacity']
        };
    }

    static applyAxisTypographyBlockToFlat(c, prefix, block) {
        if (!block || typeof block !== 'object') return;
        if (block.fontFamily !== undefined) c[prefix + 'Font'] = block.fontFamily;
        if (block.fontSize !== undefined && block.fontSize !== null && block.fontSize !== '') {
            c[prefix + 'FontSize'] = block.fontSize;
        }
        if (block.color !== undefined) c[prefix + 'FontColor'] = block.color;
        if (block.bold !== undefined && block.bold !== null) c[prefix + 'FontBold'] = !!block.bold;
        if (block.opacity !== undefined && block.opacity !== null && block.opacity !== '') {
            c[prefix + 'FontOpacity'] = block.opacity;
        }
    }

    static defaultGraphAxisXTypographyFromMaster(M) {
        const master = M && typeof M === 'object' ? M : {};
        return {
            fontFamily: master.defaultGraphAxisXFont || "'Inter', sans-serif",
            fontSize: master.defaultGraphAxisXFontSize != null ? master.defaultGraphAxisXFontSize : 10,
            color: master.defaultGraphAxisXFontColor || '@iconMuted',
            bold: master.defaultGraphAxisXFontBold === true,
            opacity: master.defaultGraphAxisXFontOpacity != null ? master.defaultGraphAxisXFontOpacity : 100
        };
    }

    static resolveGraphAxisYTypographyForRuntime(c, M) {
        const leader = GraphWidget.axisTypographyBlockFromFlat(c, 'axisX');
        const typRoot = c.typography && typeof c.typography === 'object' ? c.typography : {};
        const sparseY = typRoot.axisY && typeof typRoot.axisY === 'object' ? typRoot.axisY : {};
        const resolved = BaseWidget.resolveTypographyFollowerFromLeader(
            leader, sparseY, GraphWidget.AXIS_Y_INHERIT_PROPS
        );
        GraphWidget.applyAxisTypographyBlockToFlat(c, 'axisY', resolved);
    }

    static ensureGraphAxisTypography(o) {
        if (!o || typeof o !== 'object') return;
        if (!o.typography || typeof o.typography !== 'object') o.typography = {};
        if (!o.typography.axisY || typeof o.typography.axisY !== 'object') {
            o.typography.axisY = {};
        }
        BaseWidget.stripTypographyFollowerInheritPlaceholders(
            o.typography.axisY, GraphWidget.AXIS_Y_INHERIT_PROPS
        );
        if (Object.keys(o.typography.axisY).length === 0) delete o.typography.axisY;
    }

    static buildTypographyNestedEditorPatch(widgetType, typoPatch) {
        if (widgetType !== 'graph' || !typoPatch || typeof typoPatch !== 'object') {
            return { typography: typoPatch };
        }
        const env = { typography: Object.assign({}, typoPatch) };
        GraphWidget.ensureGraphAxisTypography(env);
        return { typography: env.typography };
    }



    static applyTypographyNestedToConfig(c) {
        BaseWidget.applyTypographyNestedToConfig(c, GraphWidget.GRAPH_TYPOGRAPHY_ROLES, {
            extraByRole: Object.assign({}, GraphWidget.GRAPH_AXIS_TYPO_EXTRA_BY_ROLE, {
                dataText: { fontSize: 'Size', color: 'Color', bold: 'FontBold' }
            })
        });
    }

    static getNestedBindingOverlaySpec() {
        if (!GraphWidget._cachedNestedBindingOverlaySpec) {
            GraphWidget._cachedNestedBindingOverlaySpec = BaseWidget.buildTypographyBindingOverlaySpec(
                GraphWidget.GRAPH_TYPOGRAPHY_ROLES,
                {
                    extraByRole: Object.assign({}, GraphWidget.GRAPH_AXIS_TYPO_EXTRA_BY_ROLE, {
                        dataText: { fontSize: 'Size', color: 'Color', bold: 'FontBold' }
                    })
                }
            );
        }
        return GraphWidget._cachedNestedBindingOverlaySpec;
    }

    static _fillTypoSlot(c, M, prefix, masterPrefix, defaults) {
        const globalFont = c.globalFontFamily || M.fontFamily || "'Inter', sans-serif";
        if (!c[prefix + 'Font']) c[prefix + 'Font'] = M[masterPrefix + 'Font'] || globalFont;
        if (c[prefix + 'Fs'] == null || c[prefix + 'Fs'] === '') {
            c[prefix + 'Fs'] = M[masterPrefix + 'Fs'] != null ? M[masterPrefix + 'Fs'] : defaults.fs;
        }
        if (!c[prefix + 'Col']) c[prefix + 'Col'] = M[masterPrefix + 'Col'] || defaults.col;
        if (c[prefix + 'Bold'] === undefined || c[prefix + 'Bold'] === null) {
            c[prefix + 'Bold'] = M[masterPrefix + 'Bold'] === true;
        }
        if (c[prefix + 'Italic'] === undefined || c[prefix + 'Italic'] === null) {
            c[prefix + 'Italic'] = M[masterPrefix + 'Italic'] === true;
        }
        if (!c[prefix + 'Align']) c[prefix + 'Align'] = M[masterPrefix + 'Align'] || defaults.align;
        if (!c[prefix + 'Case']) c[prefix + 'Case'] = M[masterPrefix + 'Case'] || defaults.caseMode || 'none';
        if (c[prefix + 'Opacity'] === undefined || c[prefix + 'Opacity'] === null) {
            c[prefix + 'Opacity'] = M[masterPrefix + 'Opacity'] != null ? M[masterPrefix + 'Opacity'] : 100;
        }
        if (defaults.hasOffsets) {
            if (c[prefix + 'OffX'] === undefined || c[prefix + 'OffX'] === null) {
                c[prefix + 'OffX'] = M[masterPrefix + 'OffX'] != null ? M[masterPrefix + 'OffX'] : defaults.offX;
            }
            if (c[prefix + 'OffY'] === undefined || c[prefix + 'OffY'] === null) {
                c[prefix + 'OffY'] = M[masterPrefix + 'OffY'] != null ? M[masterPrefix + 'OffY'] : defaults.offY;
            }
        }
    }

    static fillGraphTypographyResolved(c, M) {
        BaseWidget.fillWidgetLabelTypographyResolved(c, M, 'label');

        const axisXDefaults = GraphWidget.defaultGraphAxisXTypographyFromMaster(M);
        if (!c.axisXFont) c.axisXFont = axisXDefaults.fontFamily;
        if (c.axisXFontSize == null || c.axisXFontSize === '') {
            c.axisXFontSize = axisXDefaults.fontSize;
        }
        if (!c.axisXFontColor) c.axisXFontColor = axisXDefaults.color;
        if (c.axisXFontBold === undefined || c.axisXFontBold === null) {
            c.axisXFontBold = axisXDefaults.bold;
        }
        if (c.axisXFontOpacity == null || c.axisXFontOpacity === '') {
            c.axisXFontOpacity = axisXDefaults.opacity != null ? axisXDefaults.opacity : 100;
        }
        GraphWidget.resolveGraphAxisYTypographyForRuntime(c, M);
        if (c.axisYFontOpacity == null || c.axisYFontOpacity === '') {
            c.axisYFontOpacity = c.axisXFontOpacity != null ? c.axisXFontOpacity : 100;
        }

        if (!c.textFont) c.textFont = M.defaultGraphTextFont || "'Inter', sans-serif";
        if (c.textSize == null || c.textSize === '') {
            c.textSize = M.defaultGraphTextSize != null ? M.defaultGraphTextSize : 14;
        }
        if (!c.textColor) c.textColor = M.defaultGraphTextColor || '@onSurface';
        if (c.textFontBold === undefined || c.textFontBold === null) {
            c.textFontBold = M.defaultGraphTextFontBold === true;
        }

        GraphWidget._fillTypoSlot(c, M, 'pointVal', 'defaultGraphPointVal', {
            fs: 10, col: '@accent', align: 'left', caseMode: 'none', hasOffsets: true, offX: 6, offY: -6
        });
        GraphWidget._fillTypoSlot(c, M, 'pointValBar', 'defaultGraphPointValBar', {
            fs: 10, col: '@accent', align: 'center', caseMode: 'none', hasOffsets: true, offX: 0, offY: -6
        });
        GraphWidget._fillTypoSlot(c, M, 'legendItem', 'defaultGraphLegendItem', {
            fs: 12, col: '@text', align: 'left', caseMode: 'none', hasOffsets: false
        });
    }

    static resolvedGraphType(values, isGlobal) {
        if (!values || typeof values !== 'object') return 'line';
        if (values.type) return values.type;
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        if (isGlobal && values.defaultGraphType) return values.defaultGraphType;
        return M.defaultGraphType || 'line';
    }

    static isLineLike(type) {
        return type === 'line' || type === 'smooth' || type === 'stepped';
    }

    static isBarType(type) {
        return type === 'bar';
    }

    static isBarHorizontal(values, isGlobal) {
        const t = GraphWidget.resolvedGraphType(values, isGlobal);
        if (!GraphWidget.isBarType(t)) return false;
        if (!values || typeof values !== 'object') return false;
        if (values.barDirection !== undefined && values.barDirection !== null) {
            return values.barDirection === 'horizontal';
        }
        if (isGlobal && values.defaultGraphBarDirection) {
            return values.defaultGraphBarDirection === 'horizontal';
        }
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        return (M.defaultGraphBarDirection || 'vertical') === 'horizontal';
    }

    static isTextType(type) {
        return type === 'text';
    }

    static get GRAPH_TIME_FORMAT_OPTIONS() {
        return [
            { value: 'Datapoints', text: 'Datapoints' },
            { value: 'TextLabels', text: 'Text Labels' },
            { value: 'DateHours', text: 'Date Hours' },
            { value: 'Date', text: 'Date' },
            { value: 'HH', text: 'Hours' },
            { value: 'HH:mm', text: 'Hours:Minutes' },
            { value: 'HH:mm:ss', text: 'Hours:Minutes:Seconds' }
        ];
    }

    static get GRAPH_DATE_FORMAT_OPTIONS() {
        return [
            { value: 'DD-MM', text: 'DD-MM' },
            { value: 'DD-MM-YYYY', text: 'DD-MM-YYYY' },
            { value: 'MM-DD', text: 'MM-DD' },
            { value: 'MM-DD-YYYY', text: 'MM-DD-YYYY' }
        ];
    }

    static get GRAPH_ANIMATION_OPTIONS() {
        return [
            { value: 'none', text: 'None' },
            { value: 'morph', text: 'Draw In & Morph' }
        ];
    }

    static resolvedGraphTimeFormat(values, isGlobal) {
        if (!values || typeof values !== 'object') return 'Datapoints';
        if (values.timeFormat) return values.timeFormat;
        if (values.defaultGraphTimeFormat) return values.defaultGraphTimeFormat;
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        return M.defaultGraphTimeFormat || 'Datapoints';
    }

    static graphTimeFormatShowsDate(timeFormat) {
        return timeFormat === 'DateHours' || timeFormat === 'Date';
    }

    static graphTimeFormatShowsTime(timeFormat) {
        return timeFormat === 'DateHours' || timeFormat === 'HH' || timeFormat === 'HH:mm' || timeFormat === 'HH:mm:ss';
    }

    static graphTimeFormatIsTextLabels(timeFormat) {
        return timeFormat === 'TextLabels';
    }

    static graphTimeFormatUsesTimestamp(timeFormat) {
        return timeFormat !== 'Datapoints' && timeFormat !== 'TextLabels';
    }

    static categoryAxisKind(values, isGlobal) {
        const fmt = GraphWidget.resolvedGraphTimeFormat(values, isGlobal);
        if (fmt === 'Datapoints') return 'Datapoints';
        if (fmt === 'TextLabels') return 'Text Labels';
        return 'Time';
    }

    static categoryAxisTitle(values, isGlobal, prefix) {
        const isHoriz = GraphWidget.isBarHorizontal(values, isGlobal);
        const axis = isHoriz ? 'Y Axis' : 'X Axis';
        const kind = GraphWidget.categoryAxisKind(values, isGlobal);
        const lead = prefix ? (axis + ' ' + prefix) : axis;
        return lead + ' (' + kind + ')';
    }

    static valueAxisTitle(values, isGlobal, prefix) {
        const isHoriz = GraphWidget.isBarHorizontal(values, isGlobal);
        const axis = isHoriz ? 'X Axis' : 'Y Axis';
        const lead = prefix ? (axis + ' ' + prefix) : axis;
        return lead + ' (Value)';
    }

    static _objectKeysInLabelOrder(obj) {
        const keys = Object.keys(obj);
        if (keys.length === 0) return keys;
        const allNumeric = keys.every(function (k) {
            const n = parseFloat(k);
            return !isNaN(n) && isFinite(n);
        });
        if (allNumeric) {
            return keys.sort(function (a, b) { return parseFloat(a) - parseFloat(b); });
        }
        return keys;
    }

    static _mapKeyValueObjectToLabeledValues(obj) {
        return GraphWidget._objectKeysInLabelOrder(obj).map(function (k) {
            return { v: obj[k], l: String(k) };
        });
    }

    static _timestampSortKey(t) {
        if (t == null || t === '') return null;
        if (typeof t === 'number' && isFinite(t)) {
            if (t > 1e11) return t;
            if (t > 1e8) return t * 1000;
            return null;
        }
        if (typeof t === 'string' && /^\d+(\.\d+)?$/.test(t.trim())) {
            return GraphWidget._timestampSortKey(parseFloat(t.trim()));
        }
        const ms = new Date(t).getTime();
        return isNaN(ms) ? null : ms;
    }

    static _normalizeSnapshotPoint(item) {
        if (!item || typeof item !== 'object' || !('v' in item)) return item;
        const out = { v: item.v };
        if ('t' in item) {
            const t = item.t;
            out.t = (t != null && String(t) !== '') ? t : null;
        }
        if ('l' in item) {
            out.l = item.l != null ? String(item.l) : '';
        }
        return out;
    }

    static _extractSeriesItems(parsed) {
        if (!parsed) return [];
        if (Array.isArray(parsed)) {
            if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && 'v' in parsed[0]) {
                return GraphWidget._parseSnapshotArrayWithV(parsed);
            }
            return parsed;
        }
        if (typeof parsed === 'object') {
            if (Array.isArray(parsed.data)) {
                return (parsed.data.length > 0 && typeof parsed.data[0] === 'object' && parsed.data[0] !== null && 'v' in parsed.data[0])
                    ? GraphWidget._parseSnapshotArrayWithV(parsed.data)
                    : parsed.data;
            }
            if (Array.isArray(parsed.values)) {
                return (parsed.values.length > 0 && typeof parsed.values[0] === 'object' && parsed.values[0] !== null && 'v' in parsed.values[0])
                    ? GraphWidget._parseSnapshotArrayWithV(parsed.values)
                    : parsed.values;
            }
            return GraphWidget._mapKeyValueObjectToLabeledValues(parsed);
        }
        return [];
    }

    static _parseSnapshotArrayWithV(items) {
        if (items.length === 0) return items;
        const first = items[0];
        if (typeof first !== 'object' || first === null || !('v' in first)) return items;

        const normalized = items.map(function (item) {
            return GraphWidget._normalizeSnapshotPoint(item);
        });

        const sortKeys = normalized.map(function (item) {
            return GraphWidget._timestampSortKey(item && item.t);
        });
        const allHaveValidT = sortKeys.length > 0 && sortKeys.every(function (k) { return k != null; });
        if (!allHaveValidT) return normalized;

        const indexed = normalized.map(function (item, i) {
            return { item: item, i: i, key: sortKeys[i] };
        });
        indexed.sort(function (a, b) {
            if (a.key !== b.key) return a.key - b.key;
            return a.i - b.i;
        });
        return indexed.map(function (entry) { return entry.item; });
    }

    static buildGraphGridSchemaFields(isMaster) {
        const pfx = isMaster ? 'defaultGraph' : '';
        const cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
        const k = function (name) { return isMaster ? (pfx + cap(name)) : name; };
        const dk = function (name) { return isMaster ? {} : { defaultKey: 'defaultGraph' + cap(name) }; };
        const dirDeps = isMaster
            ? ['defaultGraphType', 'defaultGraphBarDirection', 'defaultGraphTimeFormat']
            : ['type', 'barDirection', 'defaultGraphType', 'defaultGraphBarDirection', 'timeFormat', 'defaultGraphTimeFormat'];
        const spaceDeps = isMaster
            ? ['defaultGraphType', 'defaultGraphBarDirection']
            : ['type', 'barDirection', 'defaultGraphType', 'defaultGraphBarDirection'];

        return [
            { type: 'heading', label: 'Plot Border', cols: 12 },
            { key: k('gridHTopShow'), type: 'checkbox', label: 'Top Line', cols: 3, ...dk('gridHTopShow') },
            { key: k('gridHTopCol'), type: 'color', label: isMaster ? 'Top Color' : 'Color', cols: 3, ...dk('gridHTopCol') },
            { key: k('gridHTopW'), type: 'number', label: isMaster ? 'Top Width' : 'Thickness', cols: 3, ...dk('gridHTopW') },
            { key: k('gridHTopOp'), type: 'number', min: 0, max: 100, label: isMaster ? 'Top Opacity' : 'Opacity (%)', cols: 3, ...dk('gridHTopOp') },

            { key: k('gridHBotShow'), type: 'checkbox', label: 'Bottom Line', cols: 3, ...dk('gridHBotShow') },
            { key: k('gridHBotCol'), type: 'color', label: isMaster ? 'Bottom Color' : 'Color', cols: 3, ...dk('gridHBotCol') },
            { key: k('gridHBotW'), type: 'number', label: isMaster ? 'Bottom Width' : 'Thickness', cols: 3, ...dk('gridHBotW') },
            { key: k('gridHBotOp'), type: 'number', min: 0, max: 100, label: isMaster ? 'Bottom Opacity' : 'Opacity (%)', cols: 3, ...dk('gridHBotOp') },

            { key: k('gridVLeftShow'), type: 'checkbox', label: 'Left Line', cols: 3, ...dk('gridVLeftShow') },
            { key: k('gridVLeftCol'), type: 'color', label: isMaster ? 'Left Color' : 'Color', cols: 3, ...dk('gridVLeftCol') },
            { key: k('gridVLeftW'), type: 'number', label: isMaster ? 'Left Width' : 'Thickness', cols: 3, ...dk('gridVLeftW') },
            { key: k('gridVLeftOp'), type: 'number', min: 0, max: 100, label: isMaster ? 'Left Opacity' : 'Opacity (%)', cols: 3, ...dk('gridVLeftOp') },

            { key: k('gridVRightShow'), type: 'checkbox', label: 'Right Line', cols: 3, ...dk('gridVRightShow') },
            { key: k('gridVRightCol'), type: 'color', label: isMaster ? 'Right Color' : 'Color', cols: 3, ...dk('gridVRightCol') },
            { key: k('gridVRightW'), type: 'number', label: isMaster ? 'Right Width' : 'Thickness', cols: 3, ...dk('gridVRightW') },
            { key: k('gridVRightOp'), type: 'number', min: 0, max: 100, label: isMaster ? 'Right Opacity' : 'Opacity (%)', cols: 3, ...dk('gridVRightOp') },

            {
                type: 'heading',
                label: 'X Axis Grid (Time)',
                dynamicLabel: (v, g) => GraphWidget.categoryAxisTitle(v, g, 'Grid'),
                dependsOn: dirDeps,
                cols: 12
            },
            { key: k('gridVShow'), type: 'checkbox', label: 'Grid Lines', cols: 3, ...dk('gridVShow') },
            { key: k('gridVCol'), type: 'color', label: isMaster ? 'Grid Color' : 'Color', cols: 3, ...dk('gridVCol') },
            { key: k('gridVW'), type: 'number', label: isMaster ? 'Grid Width' : 'Thickness', cols: 3, ...dk('gridVW') },
            { key: k('gridVOp'), type: 'number', min: 0, max: 100, label: isMaster ? 'Grid Opacity' : 'Opacity (%)', cols: 3, ...dk('gridVOp') },
            {
                key: k('gridVSpace'), type: 'number',
                label: 'Spacing (0 = Match Category Axis)',
                dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Spacing (0 = Match Y Axis)' : 'Spacing (0 = Match X Axis)',
                dependsOn: spaceDeps,
                cols: 12,
                ...dk('gridVSpace')
            },

            {
                type: 'heading',
                label: 'Y Axis Grid (Value)',
                dynamicLabel: (v, g) => GraphWidget.valueAxisTitle(v, g, 'Grid'),
                dependsOn: dirDeps,
                cols: 12
            },
            { key: k('gridHBaseShow'), type: 'checkbox', label: 'Baseline', cols: 3, ...dk('gridHBaseShow') },
            { key: k('gridHBaseCol'), type: 'color', label: isMaster ? 'Baseline Color' : 'Color', cols: 3, ...dk('gridHBaseCol') },
            { key: k('gridHBaseW'), type: 'number', label: isMaster ? 'Baseline Width' : 'Thickness', cols: 3, ...dk('gridHBaseW') },
            { key: k('gridHBaseOp'), type: 'number', min: 0, max: 100, label: isMaster ? 'Baseline Opacity' : 'Opacity (%)', cols: 3, ...dk('gridHBaseOp') },
            { key: k('gridHInnerShow'), type: 'checkbox', label: 'Grid Lines', cols: 3, ...dk('gridHInnerShow') },
            { key: k('gridHInnerCol'), type: 'color', label: isMaster ? 'Grid Color' : 'Color', cols: 3, ...dk('gridHInnerCol') },
            { key: k('gridHInnerW'), type: 'number', label: isMaster ? 'Grid Width' : 'Thickness', cols: 3, ...dk('gridHInnerW') },
            { key: k('gridHInnerOp'), type: 'number', min: 0, max: 100, label: isMaster ? 'Grid Opacity' : 'Opacity (%)', cols: 3, ...dk('gridHInnerOp') },
            {
                key: k('gridHInnerSpace'), type: 'number',
                label: 'Spacing (0 = Match Value Axis)',
                dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Spacing (0 = Match X Axis)' : 'Spacing (0 = Match Y Axis)',
                dependsOn: spaceDeps,
                cols: 12,
                ...dk('gridHInnerSpace')
            }
        ];
    }

    static buildGraphAnimationSchemaFields(isMaster) {
        const animKey = isMaster ? 'defaultGraphAnimation' : 'graphAnimation';
        const animOn = function (values) {
            const a = values && values[animKey] !== undefined ? values[animKey] : (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultGraphAnimation : 'none');
            return a && a !== 'none';
        };
        const animDeps = isMaster ? ['defaultGraphAnimation'] : ['graphAnimation', 'defaultGraphAnimation'];
        const typeDeps = isMaster
            ? ['defaultGraphAnimation', 'defaultGraphType']
            : ['graphAnimation', 'defaultGraphAnimation', 'type', 'defaultGraphType'];

        const fields = [
            {
                key: animKey, type: 'select', label: 'Animation', cols: 12,
                options: GraphWidget.GRAPH_ANIMATION_OPTIONS,
                ...(isMaster ? {} : { defaultKey: 'defaultGraphAnimation', previewAnimationOnChange: true, animationSlot: 'graph' })
            },
            {
                key: isMaster ? 'defaultGraphAnimDuration' : 'graphAnimDuration',
                type: 'number', label: 'Full Update Period (s)', cols: 6,
                min: 0.2, max: 5.0, step: 0.1,
                ...(isMaster ? {} : { defaultKey: 'defaultGraphAnimDuration' }),
                dependsOn: animDeps, visibleWhen: animOn
            },
            {
                key: isMaster ? 'defaultGraphAnimStreamDuration' : 'graphAnimStreamDuration',
                type: 'number', label: 'Streaming Period (s)', cols: 6,
                min: 0.1, max: 2.0, step: 0.05,
                ...(isMaster ? {} : { defaultKey: 'defaultGraphAnimStreamDuration' }),
                dependsOn: animDeps, visibleWhen: animOn
            },
            {
                key: isMaster ? 'defaultGraphAnimShimmer' : 'graphAnimShimmer',
                type: 'checkbox', label: 'Shimmer on Unchanged Data', cols: 6,
                ...(isMaster ? {} : { defaultKey: 'defaultGraphAnimShimmer' }),
                dependsOn: animDeps, visibleWhen: animOn
            },
            {
                key: isMaster ? 'defaultGraphAnimStaggerBars' : 'graphAnimStaggerBars',
                type: 'checkbox', label: 'Stagger Rise for Bars', cols: 6,
                ...(isMaster ? {} : { defaultKey: 'defaultGraphAnimStaggerBars' }),
                dependsOn: typeDeps,
                visibleWhen: function (values, isGlobal) {
                    if (!animOn(values)) return false;
                    const t = GraphWidget.resolvedGraphType(values, isGlobal);
                    return GraphWidget.isBarType(t);
                }
            }
        ];

        if (!isMaster) {
            fields.push({
                key: 'graphAnimPreviewFull', type: 'action_button', label: 'Preview Full Graph', cols: 6,
                previewAnimationSlot: 'graph',
                dependsOn: animDeps, visibleWhen: animOn
            });
            fields.push({
                key: 'graphAnimPreviewStream', type: 'action_button', label: 'Preview Stream Value', cols: 6,
                previewAnimationSlot: 'graph_stream',
                dependsOn: animDeps, visibleWhen: animOn
            });
        }
        return fields;
    }

    static buildGraphTickSchemaFields(isMaster) {
        const showXKey = isMaster ? 'defaultGraphShowTickX' : 'showTickX';
        const showYKey = isMaster ? 'defaultGraphShowTickY' : 'showTickY';
        const dk = function (masterKey) {
            return isMaster || !masterKey ? {} : { defaultKey: masterKey };
        };

        const xTickVisible = function (values) {
            if (isMaster) return values[showXKey] === true;
            return values.showTickX === true || (values.showTickX === undefined && typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphShowTickX === true);
        };
        const yTickVisible = function (values) {
            if (isMaster) return values[showYKey] === true;
            return values.showTickY === true || (values.showTickY === undefined && typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphShowTickY === true);
        };
        const xTickDeps = isMaster ? [showXKey] : ['showTickX', 'defaultGraphShowTickX'];
        const yTickDeps = isMaster ? [showYKey] : ['showTickY', 'defaultGraphShowTickY'];
        const dirDeps = ['type', 'barDirection', 'defaultGraphType', 'defaultGraphBarDirection'];

        const catTickFields = [];
        const valTickFields = [];
        const pushField = function (bucket, def, visible, deps, cols) {
            const f = Object.assign({ cols: cols || 12 }, def);
            if (visible) GraphWidget.attachGraphFieldVisibleWhen(f, visible, deps);
            bucket.push(f);
        };

        pushField(catTickFields, {
            key: showXKey, type: 'checkbox', label: 'Show X Axis Tick Marks',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Show Y Axis Tick Marks' : 'Show X Axis Tick Marks',
            dependsOn: dirDeps,
            ...dk('defaultGraphShowTickX')
        }, null, null, 12);
        pushField(catTickFields, {
            key: isMaster ? 'defaultGraphTickXSpacing' : 'tickXSpacing',
            type: 'number', label: 'X Axis Tick Spacing (0 = Match Interval)',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Y Axis Tick Spacing (0 = Match Interval)' : 'X Axis Tick Spacing (0 = Match Interval)',
            ...dk('defaultGraphTickXSpacing')
        }, xTickVisible, xTickDeps.concat(dirDeps), 12);
        pushField(catTickFields, {
            key: isMaster ? 'defaultGraphTickXSize' : 'tickXSize',
            type: 'number', label: 'X Axis Tick Size',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Y Axis Tick Size' : 'X Axis Tick Size',
            ...dk('defaultGraphTickXSize')
        }, xTickVisible, xTickDeps.concat(dirDeps), 6);
        pushField(catTickFields, {
            key: isMaster ? 'defaultGraphTickXThickness' : 'tickXThickness',
            type: 'number', label: 'X Axis Tick Thickness',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Y Axis Tick Thickness' : 'X Axis Tick Thickness',
            ...dk('defaultGraphTickXThickness')
        }, xTickVisible, xTickDeps.concat(dirDeps), 6);
        pushField(catTickFields, {
            key: isMaster ? 'defaultGraphTickXColor' : 'tickXColor',
            type: 'color', label: 'X Axis Tick Color',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Y Axis Tick Color' : 'X Axis Tick Color',
            ...dk('defaultGraphTickXColor')
        }, xTickVisible, xTickDeps.concat(dirDeps), 6);
        pushField(catTickFields, {
            key: isMaster ? 'defaultGraphTickXOffset' : 'tickXOffset',
            type: 'number', label: 'X Axis Tick Offset',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Y Axis Tick Offset' : 'X Axis Tick Offset',
            ...dk('defaultGraphTickXOffset')
        }, xTickVisible, xTickDeps.concat(dirDeps), 6);

        pushField(valTickFields, {
            key: showYKey, type: 'checkbox', label: 'Show Y Axis Tick Marks',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Show X Axis Tick Marks' : 'Show Y Axis Tick Marks',
            dependsOn: dirDeps,
            ...dk('defaultGraphShowTickY')
        }, null, null, 12);
        pushField(valTickFields, {
            key: isMaster ? 'defaultGraphTickYCount' : 'tickYCount',
            type: 'number', label: 'Y Axis Tick Count (0 = Match Axis)',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'X Axis Tick Count (0 = Match Axis)' : 'Y Axis Tick Count (0 = Match Axis)',
            ...dk('defaultGraphTickYCount')
        }, yTickVisible, yTickDeps.concat(dirDeps), 12);
        pushField(valTickFields, {
            key: isMaster ? 'defaultGraphTickYSize' : 'tickYSize',
            type: 'number', label: 'Y Axis Tick Size',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'X Axis Tick Size' : 'Y Axis Tick Size',
            ...dk('defaultGraphTickYSize')
        }, yTickVisible, yTickDeps.concat(dirDeps), 6);
        pushField(valTickFields, {
            key: isMaster ? 'defaultGraphTickYThickness' : 'tickYThickness',
            type: 'number', label: 'Y Axis Tick Thickness',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'X Axis Tick Thickness' : 'Y Axis Tick Thickness',
            ...dk('defaultGraphTickYThickness')
        }, yTickVisible, yTickDeps.concat(dirDeps), 6);
        pushField(valTickFields, {
            key: isMaster ? 'defaultGraphTickYColor' : 'tickYColor',
            type: 'color', label: 'Y Axis Tick Color',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'X Axis Tick Color' : 'Y Axis Tick Color',
            ...dk('defaultGraphTickYColor')
        }, yTickVisible, yTickDeps.concat(dirDeps), 6);
        pushField(valTickFields, {
            key: isMaster ? 'defaultGraphTickYOffset' : 'tickYOffset',
            type: 'number', label: 'Y Axis Tick Offset',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'X Axis Tick Offset' : 'Y Axis Tick Offset',
            ...dk('defaultGraphTickYOffset')
        }, yTickVisible, yTickDeps.concat(dirDeps), 6);

        const tickAxisTitleDeps = isMaster
            ? ['defaultGraphType', 'defaultGraphBarDirection', 'defaultGraphTimeFormat']
            : ['type', 'barDirection', 'defaultGraphType', 'defaultGraphBarDirection', 'timeFormat', 'defaultGraphTimeFormat'];
        return [
            {
                key: isMaster ? 'defaultGraphTickSplit' : 'tickSplit',
                type: 'column_split',
                cols: 12,
                dependsOn: tickAxisTitleDeps,
                columns: [
                    {
                        title: 'X Axis (Time)',
                        dynamicTitle: (v, g) => GraphWidget.categoryAxisTitle(v, g),
                        fields: catTickFields
                    },
                    {
                        title: 'Y Axis (Value)',
                        dynamicTitle: (v, g) => GraphWidget.valueAxisTitle(v, g),
                        fields: valTickFields
                    }
                ]
            }
        ];
    }

    static showAxisXTypographyFields(values) {
        return values.showAxisX === true || (values.showAxisX === undefined && typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphShowAxisX === true);
    }

    static showAxisYTypographyFields(values) {
        return values.showAxisY === true || (values.showAxisY === undefined && typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphShowAxisY === true);
    }


    static attachGraphFieldVisibleWhen(field, predicate, dependsOnKeys) {
        if (!field || typeof field !== 'object') return;
        const prevVisibleWhen = field.visibleWhen;
        field.visibleWhen = function (values, isGlobal) {
            if (typeof prevVisibleWhen === 'function' && !prevVisibleWhen(values, isGlobal)) return false;
            return predicate(values, isGlobal);
        };
        if (dependsOnKeys && dependsOnKeys.length) field.dependsOn = dependsOnKeys;
    }

    static buildGraphPointsAndValuesSchemaFields(isMaster) {
        const dk = function (masterKey) {
            return isMaster || !masterKey ? {} : { defaultKey: masterKey };
        };
        const lineOrBar = function (values, isGlobal) {
            const t = GraphWidget.resolvedGraphType(values, isGlobal);
            return GraphWidget.isLineLike(t) || GraphWidget.isBarType(t);
        };
        const typeDeps = isMaster ? ['defaultGraphType'] : ['type', 'defaultGraphType'];

        const fields = [];
        if (isMaster) {
            fields.push({ type: 'heading', label: 'Points & Point Values', cols: 12 });
        } else {
            fields.push({ type: 'heading', label: 'Points', cols: 12 });
        }

        const showPointsField = {
            key: isMaster ? 'defaultGraphPointShow' : 'showPoints',
            type: 'checkbox',
            label: 'Show Points',
            cols: 6,
            ...dk('defaultGraphPointShow')
        };
        GraphWidget.attachGraphFieldVisibleWhen(showPointsField, lineOrBar, typeDeps);
        fields.push(showPointsField);

        const pointSizeField = {
            key: isMaster ? 'defaultGraphPointSize' : 'pointSize',
            type: 'number',
            min: 1,
            label: 'Point Size',
            cols: 6,
            ...dk('defaultGraphPointSize')
        };
        GraphWidget.attachGraphFieldVisibleWhen(pointSizeField, lineOrBar, typeDeps);
        fields.push(pointSizeField);

        const pointValuesVisible = function (values) {
            const showPointValuesKey = isMaster ? 'defaultGraphShowPointValues' : 'showPointValues';
            if (isMaster) return values[showPointValuesKey] === true;
            return values.showPointValues === true || (values.showPointValues === undefined && typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphShowPointValues === true);
        };
        const pointValuesDeps = isMaster ? ['defaultGraphShowPointValues'] : ['showPointValues', 'defaultGraphShowPointValues'];
        fields.push({ type: 'heading', label: 'Point Values', cols: 12 });
        fields.push({
            key: isMaster ? 'defaultGraphShowPointValues' : 'showPointValues',
            type: 'checkbox',
            label: 'Show Point Values',
            cols: 12,
            ...dk('defaultGraphShowPointValues')
        });
        const hoverOnlyField = {
            key: isMaster ? 'defaultGraphPointValuesHoverOnly' : 'pointValuesHoverOnly',
            type: 'checkbox',
            label: 'Show on Hover',
            cols: 6,
            ...dk('defaultGraphPointValuesHoverOnly')
        };
        GraphWidget.attachGraphFieldVisibleWhen(hoverOnlyField, pointValuesVisible, pointValuesDeps);
        fields.push(hoverOnlyField);
        const abbreviateField = {
            key: isMaster ? 'defaultGraphPointValuesAbbreviate' : 'pointValuesAbbreviate',
            type: 'checkbox',
            label: 'Abbreviate Large Values',
            cols: 6,
            ...dk('defaultGraphPointValuesAbbreviate')
        };
        GraphWidget.attachGraphFieldVisibleWhen(abbreviateField, pointValuesVisible, pointValuesDeps);
        fields.push(abbreviateField);
        const pointDecimalsField = {
            key: isMaster ? 'defaultGraphPointValuesDecimals' : 'pointValuesDecimals',
            type: 'number',
            min: 0,
            label: 'Decimals',
            cols: 12,
            ...dk('defaultGraphPointValuesDecimals')
        };
        GraphWidget.attachGraphFieldVisibleWhen(pointDecimalsField, pointValuesVisible, pointValuesDeps);
        fields.push(pointDecimalsField);

        const intervalVisible = function (values) {
            if (!pointValuesVisible(values)) return false;
            const hoverKey = isMaster ? 'defaultGraphPointValuesHoverOnly' : 'pointValuesHoverOnly';
            const hover = values[hoverKey] !== undefined ? values[hoverKey] : (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphPointValuesHoverOnly === true);
            return !hover;
        };
        const intervalDeps = pointValuesDeps.concat(isMaster ? ['defaultGraphPointValuesHoverOnly'] : ['pointValuesHoverOnly', 'defaultGraphPointValuesHoverOnly']);
        const distKey = isMaster ? 'defaultGraphPointValuesDistribution' : 'pointValuesDistribution';
        const distDeps = intervalDeps.concat(isMaster ? ['defaultGraphPointValuesDistribution'] : ['pointValuesDistribution', 'defaultGraphPointValuesDistribution']);
        const distField = {
            key: distKey,
            type: 'select',
            label: 'Point Value Distribution',
            options: [
                { value: 'timeHighLow', text: 'Time (Peaks & Troughs)' },
                { value: 'timeUniform', text: 'Time (Uniform)' },
                { value: 'pointStep', text: 'Point Step (Every N Points)' }
            ],
            cols: 12,
            ...dk('defaultGraphPointValuesDistribution')
        };
        GraphWidget.attachGraphFieldVisibleWhen(distField, intervalVisible, intervalDeps);
        fields.push(distField);

        const isPointStepMode = function (values) {
            const dist = values[distKey] !== undefined
                ? values[distKey]
                : (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphPointValuesDistribution
                    ? MASTER_SETTINGS.defaultGraphPointValuesDistribution
                    : 'timeHighLow');
            return dist === 'pointStep';
        };

        const autoIntervalKey = isMaster ? 'defaultGraphAutoPointValuesInterval' : 'autoPointValuesInterval';
        const isAutoActive = function (values) {
            const a = values[autoIntervalKey] !== undefined
                ? values[autoIntervalKey]
                : (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphAutoPointValuesInterval === true);
            return !!a;
        };
        const autoDeps = distDeps.concat(isMaster ? [autoIntervalKey] : [autoIntervalKey, 'defaultGraphAutoPointValuesInterval']);

        const autoIntervalField = {
            key: autoIntervalKey,
            type: 'checkbox',
            label: 'Auto Interval',
            cols: 6,
            ...dk('defaultGraphAutoPointValuesInterval')
        };
        GraphWidget.attachGraphFieldVisibleWhen(autoIntervalField, intervalVisible, intervalDeps);
        fields.push(autoIntervalField);

        const timeWidthKey = isMaster ? 'defaultGraphPointValuesTimeWidth' : 'pointValuesTimeWidth';
        const timeWidthField = {
            key: timeWidthKey,
            type: 'number',
            min: 1,
            step: 1,
            label: 'Time Section Width (px)',
            cols: 6,
            disableWhen: isAutoActive,
            ...dk('defaultGraphPointValuesTimeWidth')
        };
        GraphWidget.attachGraphFieldVisibleWhen(timeWidthField, function (values) {
            if (!intervalVisible(values)) return false;
            return !isPointStepMode(values);
        }, autoDeps);
        fields.push(timeWidthField);

        const stepKey = isMaster ? 'defaultGraphPointValuesStep' : 'pointValuesStep';
        const pointStepField = {
            key: stepKey,
            type: 'number',
            min: 1,
            step: 1,
            label: 'Point Step',
            cols: 6,
            disableWhen: isAutoActive,
            ...dk('defaultGraphPointValuesStep')
        };
        GraphWidget.attachGraphFieldVisibleWhen(pointStepField, function (values) {
            if (!intervalVisible(values)) return false;
            return isPointStepMode(values);
        }, autoDeps);
        fields.push(pointStepField);
        return fields;
    }

    static buildGraphAxesAndLabelsSchemaFields(isMaster) {
        const showCatKey = isMaster ? 'defaultGraphShowAxisX' : 'showAxisX';
        const showValKey = isMaster ? 'defaultGraphShowAxisY' : 'showAxisY';
        const timeKey = isMaster ? 'defaultGraphTimeFormat' : 'timeFormat';
        const dateKey = isMaster ? 'defaultGraphDateFormat' : 'dateFormat';
        const time24Key = isMaster ? 'defaultGraphTime24h' : 'time24h';
        const tzKey = isMaster ? 'defaultGraphTimezoneConvert' : 'timezoneConvert';
        const resXKey = isMaster ? 'defaultGraphAxisResX' : 'axisResX';
        const offYKey = isMaster ? 'defaultGraphAxisOffY' : 'axisOffY';
        const roundingKey = isMaster ? 'defaultGraphRoundingMode' : 'roundingMode';
        const headroomKey = isMaster ? 'defaultGraphHeadroom' : 'headroom';
        const decimalsKey = isMaster ? 'defaultGraphDecimals' : 'decimals';
        const resYKey = isMaster ? 'defaultGraphAxisResY' : 'axisResY';
        const widthYKey = isMaster ? 'defaultGraphAxisWidthY' : 'axisWidthY';
        const widthXKey = isMaster ? 'defaultGraphAxisWidthX' : 'axisWidthX';
        const offXKey = isMaster ? 'defaultGraphAxisOffX' : 'axisOffX';
        const catRotKey = isMaster ? 'defaultGraphCategoryLabelRotation' : 'categoryLabelRotation';
        const valRotKey = isMaster ? 'defaultGraphValueLabelRotation' : 'valueLabelRotation';
        const autoResXKey = isMaster ? 'defaultGraphAutoAxisResX' : 'autoAxisResX';
        const autoResYKey = isMaster ? 'defaultGraphAutoAxisResY' : 'autoAxisResY';
        const dirDeps = ['type', 'barDirection', 'defaultGraphType', 'defaultGraphBarDirection'];

        const dk = function (masterKey) {
            return isMaster || !masterKey ? {} : { defaultKey: masterKey };
        };
        const catFields = [];
        const valFields = [];
        const pushField = function (bucket, def, visible, deps, customCols) {
            const field = Object.assign({ cols: customCols || 12 }, def);
            if (visible) GraphWidget.attachGraphFieldVisibleWhen(field, visible, deps);
            bucket.push(field);
        };

        const catVisible = function (values) {
            if (isMaster) return values[showCatKey] === true;
            return values.showAxisX === true || (values.showAxisX === undefined && typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphShowAxisX === true);
        };
        const valVisible = function (values) {
            if (isMaster) return values[showValKey] === true;
            return values.showAxisY === true || (values.showAxisY === undefined && typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphShowAxisY === true);
        };
        const catDeps = isMaster ? [showCatKey] : ['showAxisX', 'defaultGraphShowAxisX'];
        const valDeps = isMaster ? [showValKey] : ['showAxisY', 'defaultGraphShowAxisY'];
        const timeFmtDeps = isMaster ? [showCatKey, timeKey] : ['showAxisX', 'defaultGraphShowAxisX', timeKey, 'defaultGraphTimeFormat'];
        const roundingOptions = [
            { value: 'exact', text: 'Fit Data Range (Exact Min/Max)' },
            { value: 'smart', text: 'Clean Steps (1, 2, 5...)' },
            { value: 'strict', text: 'Whole Numbers Only (Counts)' }
        ];

        // Category / Time column fields
        pushField(catFields, {
            key: showCatKey, type: 'checkbox', label: 'Show X Axis',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Show Y Axis' : 'Show X Axis',
            dependsOn: dirDeps,
            ...dk('defaultGraphShowAxisX')
        }, null, null, 12);
        pushField(catFields, {
            key: timeKey, type: 'select', label: 'X Axis Format',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Y Axis Format' : 'X Axis Format',
            options: GraphWidget.GRAPH_TIME_FORMAT_OPTIONS,
            ...dk('defaultGraphTimeFormat')
        }, catVisible, catDeps.concat(dirDeps), 12);
        pushField(catFields, {
            key: dateKey, type: 'select', label: 'Date Format',
            options: GraphWidget.GRAPH_DATE_FORMAT_OPTIONS,
            ...dk('defaultGraphDateFormat')
        }, function (values, isGlobal) {
            if (!catVisible(values)) return false;
            return GraphWidget.graphTimeFormatShowsDate(GraphWidget.resolvedGraphTimeFormat(values, isGlobal));
        }, timeFmtDeps, 12);
        pushField(catFields, {
            key: time24Key, type: 'checkbox', label: '24 Hour Clock',
            ...dk('defaultGraphTime24h')
        }, function (values, isGlobal) {
            if (!catVisible(values)) return false;
            return GraphWidget.graphTimeFormatShowsTime(GraphWidget.resolvedGraphTimeFormat(values, isGlobal));
        }, timeFmtDeps, 12);
        pushField(catFields, {
            key: tzKey, type: 'checkbox', label: 'Convert UTC',
            ...dk('defaultGraphTimezoneConvert')
        }, function (values, isGlobal) {
            if (!catVisible(values)) return false;
            return GraphWidget.graphTimeFormatUsesTimestamp(GraphWidget.resolvedGraphTimeFormat(values, isGlobal));
        }, timeFmtDeps, 12);
        pushField(catFields, {
            key: widthXKey, type: 'number', label: 'X Axis Fixed Width (0 = Auto)',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Y Axis Fixed Width (0 = Auto)' : 'X Axis Fixed Width (0 = Auto)',
            ...dk('defaultGraphAxisWidthX')
        }, catVisible, catDeps.concat(dirDeps), 12);
        pushField(catFields, {
            key: offYKey, type: 'number', label: 'X Axis Spacing',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Y Axis Spacing' : 'X Axis Spacing',
            ...dk('defaultGraphAxisOffY')
        }, catVisible, catDeps.concat(dirDeps), 12);
        pushField(catFields, {
            key: autoResXKey, type: 'checkbox', label: 'Auto X Axis Interval',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Auto Y Axis Interval' : 'Auto X Axis Interval',
            ...dk('defaultGraphAutoAxisResX')
        }, catVisible, catDeps.concat(dirDeps), 12);
        pushField(catFields, {
            key: resXKey, type: 'number', label: 'X Axis Interval',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Y Axis Interval' : 'X Axis Interval',
            ...dk('defaultGraphAxisResX')
        }, function (values) {
            if (!catVisible(values)) return false;
            const auto = values[autoResXKey] !== undefined ? values[autoResXKey] : (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphAutoAxisResX === true);
            return !auto;
        }, catDeps.concat(isMaster ? [autoResXKey] : [autoResXKey, 'defaultGraphAutoAxisResX']).concat(dirDeps), 12);
        pushField(catFields, {
            key: catRotKey, type: 'number', label: 'X Axis Label Rotation',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Y Axis Label Rotation' : 'X Axis Label Rotation',
            ...dk('defaultGraphCategoryLabelRotation')
        }, catVisible, catDeps.concat(dirDeps), 12);

        // Value column fields
        pushField(valFields, {
            key: showValKey, type: 'checkbox', label: 'Show Y Axis',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Show X Axis' : 'Show Y Axis',
            dependsOn: dirDeps,
            ...dk('defaultGraphShowAxisY')
        }, null, null, 12);
        pushField(valFields, {
            key: roundingKey, type: 'select', label: 'Y Axis Scale Mode',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'X Axis Scale Mode' : 'Y Axis Scale Mode',
            options: roundingOptions,
            ...dk('defaultGraphRoundingMode')
        }, valVisible, valDeps.concat(dirDeps), 12);
        pushField(valFields, {
            key: decimalsKey, type: 'number', min: 0, label: 'Y Axis Decimals',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'X Axis Decimals' : 'Y Axis Decimals',
            ...dk('defaultGraphDecimals')
        }, function (values) {
            if (!valVisible(values)) return false;
            const mode = values[roundingKey] !== undefined ? values[roundingKey] : (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultGraphRoundingMode : 'smart');
            return mode === 'exact';
        }, valDeps.concat(isMaster ? [roundingKey] : [roundingKey, 'defaultGraphRoundingMode']).concat(dirDeps), 12);
        pushField(valFields, {
            key: headroomKey, type: 'number', min: 0, max: 100, label: 'Headroom (%)',
            ...dk('defaultGraphHeadroom')
        }, valVisible, valDeps, 12);
        pushField(valFields, {
            key: widthYKey, type: 'number', label: 'Y Axis Fixed Width (0 = Auto)',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'X Axis Fixed Width (0 = Auto)' : 'Y Axis Fixed Width (0 = Auto)',
            ...dk('defaultGraphAxisWidthY')
        }, valVisible, valDeps.concat(dirDeps), 12);
        pushField(valFields, {
            key: offXKey, type: 'number', label: 'Y Axis Spacing',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'X Axis Spacing' : 'Y Axis Spacing',
            ...dk('defaultGraphAxisOffX')
        }, valVisible, valDeps.concat(dirDeps), 12);
        pushField(valFields, {
            key: autoResYKey, type: 'checkbox', label: 'Auto Y Axis Line Count',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'Auto X Axis Line Count' : 'Auto Y Axis Line Count',
            ...dk('defaultGraphAutoAxisResY')
        }, valVisible, valDeps.concat(dirDeps), 12);
        pushField(valFields, {
            key: resYKey, type: 'number', label: 'Y Axis Line Count',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'X Axis Line Count' : 'Y Axis Line Count',
            ...dk('defaultGraphAxisResY')
        }, function (values) {
            if (!valVisible(values)) return false;
            const auto = values[autoResYKey] !== undefined ? values[autoResYKey] : (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphAutoAxisResY === true);
            return !auto;
        }, valDeps.concat(isMaster ? [autoResYKey] : [autoResYKey, 'defaultGraphAutoAxisResY']).concat(dirDeps), 12);
        pushField(valFields, {
            key: valRotKey, type: 'number', label: 'Y Axis Label Rotation',
            dynamicLabel: (v, g) => GraphWidget.isBarHorizontal(v, g) ? 'X Axis Label Rotation' : 'Y Axis Label Rotation',
            ...dk('defaultGraphValueLabelRotation')
        }, valVisible, valDeps.concat(dirDeps), 12);

        const axisTitleDeps = isMaster
            ? ['defaultGraphType', 'defaultGraphBarDirection', 'defaultGraphTimeFormat']
            : ['type', 'barDirection', 'defaultGraphType', 'defaultGraphBarDirection', 'timeFormat', 'defaultGraphTimeFormat'];
        const fields = [
            {
                key: isMaster ? 'defaultGraphAxesSplit' : 'axesSplit',
                type: 'column_split',
                cols: 12,
                dependsOn: axisTitleDeps,
                columns: [
                    {
                        title: 'X Axis (Time)',
                        dynamicTitle: (v, g) => GraphWidget.categoryAxisTitle(v, g),
                        fields: catFields
                    },
                    {
                        title: 'Y Axis (Value)',
                        dynamicTitle: (v, g) => GraphWidget.valueAxisTitle(v, g),
                        fields: valFields
                    }
                ]
            }
        ];
        return fields;
    }

    static attachGraphTypographyGroupVisibility(typoGroup, predicate, dependsOnKeys) {
        if (!typoGroup || typeof typoGroup !== 'object') return;
        GraphWidget.attachGraphFieldVisibleWhen(typoGroup, predicate, dependsOnKeys);
        if (Array.isArray(typoGroup.fields)) {
            typoGroup.fields.forEach((sub) => {
                if (sub && (sub.type === 'typography' || Array.isArray(sub.fields))) {
                    GraphWidget.attachGraphTypographyGroupVisibility(sub, predicate, dependsOnKeys);
                } else {
                    GraphWidget.attachGraphFieldVisibleWhen(sub, predicate, dependsOnKeys);
                }
            });
        }
    }

    static buildGraphWidgetLabelTypographySchema() {
        return BaseWidget.getWidgetLabelTypographySchema('label', 'widgetLabel');
    }

    static buildGraphAxisXTypographySchema(isMaster) {
        const prefix = isMaster ? 'defaultGraphAxisX' : 'axisX';
        const group = BaseWidget.getTypographySchema(prefix, 'X Axis (Time)', {
            dynamicLabel: (v, g) => GraphWidget.categoryAxisTitle(v, g),
            exclude: ['align', 'case', 'offset', 'italic', 'opacity', 'colorOff', 'size', 'bold', 'color'],
            headerSuffix: 'Typography',
            nestedTypography: isMaster ? undefined : { root: 'typography', role: 'axisX' },
            fontDefaultKey: isMaster ? 'fontFamily' : 'defaultGraphAxisXFont',
            extraFieldsInsert: 'afterColor',
            extraFields: [
                {
                    key: isMaster ? 'defaultGraphAxisXFontSize' : 'axisXFontSize',
                    type: 'number', label: 'Font Size', cols: 4,
                    defaultKey: 'defaultGraphAxisXFontSize',
                    typographyNestedProp: isMaster ? undefined : 'fontSize'
                },
                {
                    key: isMaster ? 'defaultGraphAxisXFontColor' : 'axisXFontColor',
                    type: 'color', label: 'Color', cols: 4,
                    defaultKey: 'defaultGraphAxisXFontColor',
                    typographyNestedProp: isMaster ? undefined : 'color'
                },
                {
                    key: isMaster ? 'defaultGraphAxisXFontOpacity' : 'axisXFontOpacity',
                    type: 'number', label: 'Opacity', min: 0, max: 100, cols: 4,
                    defaultKey: 'defaultGraphAxisXFontOpacity',
                    typographyNestedProp: isMaster ? undefined : 'opacity'
                },
                {
                    key: isMaster ? 'defaultGraphAxisXFontBold' : 'axisXFontBold',
                    type: 'checkbox', label: 'Bold', cols: 4,
                    defaultKey: 'defaultGraphAxisXFontBold',
                    typographyNestedProp: isMaster ? undefined : 'bold'
                }
            ]
        });
        const axisTitleDeps = isMaster
            ? ['defaultGraphType', 'defaultGraphBarDirection', 'defaultGraphTimeFormat']
            : ['type', 'barDirection', 'defaultGraphType', 'defaultGraphBarDirection', 'timeFormat', 'defaultGraphTimeFormat'];
        group.dependsOn = (group.dependsOn || []).concat(axisTitleDeps);
        group.dynamicLabel = (v, g) => GraphWidget.categoryAxisTitle(v, g);
        if (!isMaster) {
            GraphWidget.attachGraphTypographyGroupVisibility(
                group,
                (v) => GraphWidget.showAxisXTypographyFields(v),
                ['showAxisX', 'defaultGraphShowAxisX'].concat(axisTitleDeps)
            );
        }
        return group;
    }

    static buildGraphAxisYTypographySchema(isMaster) {
        const prefix = isMaster ? 'defaultGraphAxisY' : 'axisY';
        const leaderFontDefault = isMaster ? 'defaultGraphAxisXFont' : 'axisXFont';
        const leaderSizeDefault = isMaster ? 'defaultGraphAxisXFontSize' : 'axisXFontSize';
        const leaderColorDefault = isMaster ? 'defaultGraphAxisXFontColor' : 'axisXFontColor';
        const leaderOpacityDefault = isMaster ? 'defaultGraphAxisXFontOpacity' : 'axisXFontOpacity';
        const leaderBoldDefault = isMaster ? 'defaultGraphAxisXFontBold' : 'axisXFontBold';
        const group = BaseWidget.getTypographySchema(prefix, 'Y Axis (Value)', {
            dynamicLabel: (v, g) => GraphWidget.valueAxisTitle(v, g),
            exclude: ['align', 'case', 'offset', 'italic', 'opacity', 'colorOff', 'size', 'bold', 'color'],
            nestedTypography: isMaster ? undefined : { root: 'typography', role: 'axisY' },
            fontDefaultKey: leaderFontDefault,
            extraFieldsInsert: 'afterColor',
            extraFields: [
                {
                    key: isMaster ? 'defaultGraphAxisYFontSize' : 'axisYFontSize',
                    type: 'number', label: 'Font Size', cols: 4,
                    defaultKey: leaderSizeDefault,
                    typographyNestedProp: isMaster ? undefined : 'fontSize'
                },
                {
                    key: isMaster ? 'defaultGraphAxisYFontColor' : 'axisYFontColor',
                    type: 'color', label: 'Color', cols: 4,
                    defaultKey: leaderColorDefault,
                    typographyNestedProp: isMaster ? undefined : 'color'
                },
                {
                    key: isMaster ? 'defaultGraphAxisYFontOpacity' : 'axisYFontOpacity',
                    type: 'number', label: 'Opacity', min: 0, max: 100, cols: 4,
                    defaultKey: leaderOpacityDefault,
                    typographyNestedProp: isMaster ? undefined : 'opacity'
                },
                {
                    key: isMaster ? 'defaultGraphAxisYFontBold' : 'axisYFontBold',
                    type: 'checkbox', label: 'Bold', cols: 4,
                    defaultKey: leaderBoldDefault,
                    typographyNestedProp: isMaster ? undefined : 'bold'
                }
            ]
        });
        const axisTitleDeps = isMaster
            ? ['defaultGraphType', 'defaultGraphBarDirection', 'defaultGraphTimeFormat']
            : ['type', 'barDirection', 'defaultGraphType', 'defaultGraphBarDirection', 'timeFormat', 'defaultGraphTimeFormat'];
        group.dependsOn = (group.dependsOn || []).concat(axisTitleDeps);
        group.dynamicLabel = (v, g) => GraphWidget.valueAxisTitle(v, g);
        if (!isMaster) {
            GraphWidget.attachGraphTypographyGroupVisibility(
                group,
                (v) => GraphWidget.showAxisYTypographyFields(v),
                ['showAxisY', 'defaultGraphShowAxisY', 'showAxisX', 'defaultGraphShowAxisX'].concat(axisTitleDeps)
            );
        }
        return group;
    }

    static buildGraphDataTextTypographySchema(isMaster) {
        const prefix = isMaster ? 'defaultGraphText' : 'text';
        const group = BaseWidget.getTypographySchema(prefix, 'Data Values', {
            exclude: ['align', 'case', 'offset', 'italic', 'opacity', 'colorOff', 'size', 'bold', 'color'],
            nestedTypography: isMaster ? undefined : { root: 'typography', role: 'dataText' },
            fontDefaultKey: isMaster ? 'fontFamily' : 'defaultGraphTextFont',
            extraFieldsInsert: 'afterColor',
            extraFields: [
                {
                    key: isMaster ? 'defaultGraphTextSize' : 'textSize',
                    type: 'number', label: 'Font Size', cols: 4,
                    defaultKey: 'defaultGraphTextSize',
                    typographyNestedProp: isMaster ? undefined : 'fontSize'
                },
                {
                    key: isMaster ? 'defaultGraphTextColor' : 'textColor',
                    type: 'color', label: 'Color', cols: 4,
                    defaultKey: 'defaultGraphTextColor',
                    typographyNestedProp: isMaster ? undefined : 'color'
                },
                {
                    key: isMaster ? 'defaultGraphTextFontBold' : 'textFontBold',
                    type: 'checkbox', label: 'Bold', cols: 4,
                    defaultKey: 'defaultGraphTextFontBold',
                    typographyNestedProp: isMaster ? undefined : 'bold'
                }
            ]
        });
        GraphWidget.attachGraphTypographyGroupVisibility(
            group,
            function (v, isGlobal) { return GraphWidget.isTextType(GraphWidget.resolvedGraphType(v, isGlobal)); },
            isMaster ? ['defaultGraphType'] : ['type', 'defaultGraphType']
        );
        return group;
    }

    static buildGraphPointValuesTypographySchema(isMaster) {
        const prefix = isMaster ? 'defaultGraphPointVal' : 'pointVal';
        const group = BaseWidget.getTypographySchema(prefix, 'Point Values (Line)', {
            exclude: ['colorOff'],
            nestedTypography: isMaster ? undefined : { root: 'typography', role: 'pointValues' },
            fontDefaultKey: isMaster ? 'fontFamily' : 'defaultGraphPointValFont',
            fontSizeDefaultKey: 'defaultGraphPointValFs',
            colorDefaultKey: 'defaultGraphPointValCol',
            alignDefaultKey: 'defaultGraphPointValAlign',
            boldDefaultKey: 'defaultGraphPointValBold',
            italicDefaultKey: 'defaultGraphPointValItalic',
            caseDefaultKey: 'defaultGraphPointValCase',
            opacityDefaultKey: 'defaultGraphPointValOpacity',
            offXDefaultKey: 'defaultGraphPointValOffX',
            offYDefaultKey: 'defaultGraphPointValOffY'
        });
        GraphWidget.attachGraphTypographyGroupVisibility(
            group,
            function (v, isGlobal) {
                const isShow = isMaster
                    ? (v && v.defaultGraphShowPointValues === true)
                    : (v && (v.showPointValues === true || (v.showPointValues === undefined && typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphShowPointValues === true)));
                const t = GraphWidget.resolvedGraphType(v, isGlobal);
                return isShow && !GraphWidget.isBarType(t);
            },
            isMaster ? ['defaultGraphShowPointValues', 'defaultGraphType'] : ['showPointValues', 'defaultGraphShowPointValues', 'type', 'defaultGraphType']
        );
        return group;
    }

    static buildGraphPointValuesBarTypographySchema(isMaster) {
        const prefix = isMaster ? 'defaultGraphPointValBar' : 'pointValBar';
        const group = BaseWidget.getTypographySchema(prefix, 'Point Values (Bar)', {
            exclude: ['colorOff'],
            nestedTypography: isMaster ? undefined : { root: 'typography', role: 'pointValuesBar' },
            fontDefaultKey: isMaster ? 'fontFamily' : 'defaultGraphPointValBarFont',
            fontSizeDefaultKey: 'defaultGraphPointValBarFs',
            colorDefaultKey: 'defaultGraphPointValBarCol',
            alignDefaultKey: 'defaultGraphPointValBarAlign',
            boldDefaultKey: 'defaultGraphPointValBarBold',
            italicDefaultKey: 'defaultGraphPointValBarItalic',
            caseDefaultKey: 'defaultGraphPointValBarCase',
            opacityDefaultKey: 'defaultGraphPointValBarOpacity',
            offXDefaultKey: 'defaultGraphPointValBarOffX',
            offYDefaultKey: 'defaultGraphPointValBarOffY'
        });
        GraphWidget.attachGraphTypographyGroupVisibility(
            group,
            function (v, isGlobal) {
                const isShow = isMaster
                    ? (v && v.defaultGraphShowPointValues === true)
                    : (v && (v.showPointValues === true || (v.showPointValues === undefined && typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphShowPointValues === true)));
                const t = GraphWidget.resolvedGraphType(v, isGlobal);
                return isShow && GraphWidget.isBarType(t);
            },
            isMaster ? ['defaultGraphShowPointValues', 'defaultGraphType'] : ['showPointValues', 'defaultGraphShowPointValues', 'type', 'defaultGraphType']
        );
        return group;
    }

    static buildGraphLegendTypographySchema(isMaster) {
        const prefix = isMaster ? 'defaultGraphLegendItem' : 'legendItem';
        const group = BaseWidget.getTypographySchema(prefix, 'Legend', {
            exclude: ['offset', 'colorOff'],
            nestedTypography: isMaster ? undefined : { root: 'typography', role: 'legendItem' },
            fontDefaultKey: isMaster ? 'fontFamily' : 'defaultGraphLegendItemFont',
            fontSizeDefaultKey: 'defaultGraphLegendItemFs',
            colorDefaultKey: 'defaultGraphLegendItemCol',
            alignDefaultKey: 'defaultGraphLegendItemAlign',
            boldDefaultKey: 'defaultGraphLegendItemBold',
            italicDefaultKey: 'defaultGraphLegendItemItalic',
            caseDefaultKey: 'defaultGraphLegendItemCase',
            opacityDefaultKey: 'defaultGraphLegendItemOpacity'
        });
        if (!isMaster) {
            GraphWidget.attachGraphTypographyGroupVisibility(
                group,
                function (v) {
                    if (v.showLegend === true) return true;
                    if (v.showLegend === false) return false;
                    return typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphShowLegend === true;
                },
                ['showLegend', 'defaultGraphShowLegend']
            );
        }
        return group;
    }

    static get GRAPH_TYPE_OPTIONS() {
        return [
            { value: 'line', text: 'Line' },
            { value: 'smooth', text: 'Smooth' },
            { value: 'stepped', text: 'Stepped' },
            { value: 'bar', text: 'Bar' },
            { value: 'text', text: 'Text' }
        ];
    }

    static get GRAPH_DURATION_PRESETS() {
        return [
            { value: '15m', text: '15 Minutes' },
            { value: '1h', text: '1 Hour' },
            { value: '6h', text: '6 Hours' },
            { value: '12h', text: '12 Hours' },
            { value: '24h', text: '24 Hours' },
            { value: '7d', text: '7 Days' },
            { value: '30d', text: '30 Days' },
            { value: 'custom', text: 'Custom' }
        ];
    }

    static get globalSettings() {
        return {
            defaultGraphType: "line",
            defaultGraphSmoothingAmount: 0,
            defaultGraphLineW: 2,
            defaultGraphBarDirection: "vertical",
            defaultGraphBarGap: 2,
            defaultGraphBarRadius: 4,
            defaultGraphPositiveStartOpacity: 40,
            defaultGraphPositiveEndOpacity: 0,
            defaultGraphNegativeStartOpacity: 40,
            defaultGraphNegativeEndOpacity: 0,
            defaultGraphBufferMode: "points",
            defaultGraphDurationPreset: "24h",
            defaultGraphDurationCustomValue: 1,
            defaultGraphDurationCustomUnit: "hours",
            defaultGraphFixedTimeWindow: false,
            defaultGraphTimelineAdvance: 'data',
            defaultGraphLineGaps: "break",
            defaultGraphCategoryLabelRotation: 0,
            defaultGraphValueLabelRotation: 0,
            defaultGraphShowLegend: true,
            defaultGraphLegendPosition: "right",
            defaultGraphLegendLayout: "column",
            defaultGraphLegendSwatch: "square",
            defaultGraphLegendAutoSize: true,
            defaultGraphLegendWidth: 160,
            defaultGraphLegendHeight: 72,
            defaultGraphLegendItemFont: "'Inter', sans-serif",
            defaultGraphLegendItemFs: 12,
            defaultGraphLegendItemCol: "@text",
            defaultGraphLegendItemBold: false,
            defaultGraphLegendItemItalic: false,
            defaultGraphLegendItemAlign: "left",
            defaultGraphLegendItemCase: "none",
            defaultGraphLegendItemOpacity: 100,

            graphBarOutlineColor: "@surfaceAlt",
            graphBarOutlineWidth: 0,
            graphNegBarOutlineColor: "@surfaceAlt",

            defaultGraphPointShow: false,
            defaultGraphPointSize: 4,
            defaultGraphAnimation: "none",
            defaultGraphAnimDuration: 2,
            defaultGraphAnimStreamDuration: 0.6,
            defaultGraphAnimShimmer: true,
            defaultGraphAnimStaggerBars: true,

            defaultGraphDynamicFloor: true,
            defaultGraphDynamicCeiling: true,
            defaultGraphAutoMin: true,
            defaultGraphAutoMax: true,
            defaultGraphUseBaseline: false,
            defaultGraphBaselineVal: 0,
            defaultGraphNegMode: 'show_neg',
            defaultGraphDecimals: 0,
            defaultGraphRoundingMode: 'smart',
            defaultGraphHeadroom: 0,

            defaultGraphTextFont: "'Inter', sans-serif",
            defaultGraphTextSize: 14,
            defaultGraphTextColor: "@onSurface",
            defaultGraphTextFontBold: false,

            defaultGraphMaxPoints: 20,
            defaultGraphReverseDirection: false,
            defaultGraphScrollDir: 'left',
            defaultGraphOffX: 0,
            defaultGraphOffY: 0,

            defaultGraphShowAxisX: false,
            defaultGraphTimeFormat: "Datapoints",
            defaultGraphTime24h: true,
            defaultGraphDateFormat: "DD-MM-YYYY",
            defaultGraphTimezoneConvert: false,
            defaultGraphShowAxisY: false,
            defaultGraphAxisResX: 5,
            defaultGraphAxisResY: 4,
            defaultGraphAutoAxisResX: false,
            defaultGraphAutoAxisResY: false,
            defaultGraphAxisWidthY: 0,
            defaultGraphAxisWidthX: 0,
            defaultGraphAxisOffX: 10,
            defaultGraphAxisOffY: 10,
            defaultGraphAxisXFont: "'Inter', sans-serif",
            defaultGraphAxisXFontSize: 10,
            defaultGraphAxisXFontColor: "@iconMuted",
            defaultGraphAxisXFontOpacity: 100,
            defaultGraphAxisXFontBold: false,
            defaultGraphShowPointValues: false,
            defaultGraphPointValuesHoverOnly: false,
            defaultGraphPointValuesDistribution: 'timeHighLow',
            defaultGraphPointValuesTimeWidth: 48,
            defaultGraphPointValuesStep: 1,
            defaultGraphPointValuesDecimals: 0,
            defaultGraphPointValuesAbbreviate: true,
            defaultGraphPointValFont: "'Inter', sans-serif",
            defaultGraphPointValFs: 10,
            defaultGraphPointValCol: "@accent",
            defaultGraphPointValBold: false,
            defaultGraphPointValItalic: false,
            defaultGraphPointValAlign: "left",
            defaultGraphPointValCase: "none",
            defaultGraphPointValOpacity: 100,
            defaultGraphPointValOffX: 6,
            defaultGraphPointValOffY: -6,
            defaultGraphAutoPointValuesInterval: false,
            defaultGraphPointValBarFont: "'Inter', sans-serif",
            defaultGraphPointValBarFs: 10,
            defaultGraphPointValBarCol: "@accent",
            defaultGraphPointValBarBold: false,
            defaultGraphPointValBarItalic: false,
            defaultGraphPointValBarAlign: "center",
            defaultGraphPointValBarCase: "none",
            defaultGraphPointValBarOpacity: 100,
            defaultGraphPointValBarOffX: 0,
            defaultGraphPointValBarOffY: -6,

            // --- Grid Lines ---
            defaultGraphGridHTopShow: false,
            defaultGraphGridHTopCol: "@accentSoft",
            defaultGraphGridHTopW: 2,
            defaultGraphGridHTopOp: 80,

            defaultGraphGridHBotShow: false,
            defaultGraphGridHBotCol: "@accentSoft",
            defaultGraphGridHBotW: 2,
            defaultGraphGridHBotOp: 80,

            defaultGraphGridHBaseShow: false,
            defaultGraphGridHBaseCol: "@warning",
            defaultGraphGridHBaseW: 2,
            defaultGraphGridHBaseOp: 80,

            defaultGraphGridHInnerShow: false,
            defaultGraphGridHInnerCol: "@borderAccent",
            defaultGraphGridHInnerW: 1,
            defaultGraphGridHInnerOp: 40,
            defaultGraphGridHInnerSpace: 0,

            defaultGraphGridVShow: false,
            defaultGraphGridVCol: "@borderAccent",
            defaultGraphGridVW: 1,
            defaultGraphGridVOp: 40,
            defaultGraphGridVSpace: 0,

            defaultGraphGridVLeftShow: false,
            defaultGraphGridVLeftCol: "@accentSoft",
            defaultGraphGridVLeftW: 2,
            defaultGraphGridVLeftOp: 80,

            defaultGraphGridVRightShow: false,
            defaultGraphGridVRightCol: "@accentSoft",
            defaultGraphGridVRightW: 2,
            defaultGraphGridVRightOp: 80,

            defaultGraphShowTickX: false,
            defaultGraphShowTickY: false,
            defaultGraphTickXSpacing: 0,
            defaultGraphTickYCount: 0,
            defaultGraphTickXSize: 5,
            defaultGraphTickXThickness: 2,
            defaultGraphTickXColor: "@accentSoft",
            defaultGraphTickXOffset: 0,
            defaultGraphTickYSize: 5,
            defaultGraphTickYThickness: 2,
            defaultGraphTickYColor: "@accentSoft",
            defaultGraphTickYOffset: 0
        };
    }

    static get basicSettingKeys() {
        return [
            { key: 'series', cols: 12 },
            { key: 'bufferMode', cols: 6 },
            { key: 'maxPoints', cols: 6 },
            { key: 'dynamicFloor', cols: 6 },
            { key: 'dynamicCeiling', cols: 6 }
        ];
    }

    static get globalSchema() {
        const durationMode = function (values) { return values.defaultGraphBufferMode === 'duration'; };
        const pointsMode = function (values) { return values.defaultGraphBufferMode !== 'duration'; };
        const customDuration = function (values) {
            return values.defaultGraphBufferMode === 'duration' && values.defaultGraphDurationPreset === 'custom';
        };
        const smoothOnly = function (values) { return values.defaultGraphType === 'smooth'; };
        const barOnly = function (values) { return values.defaultGraphType === 'bar'; };
        const outlineOn = function (values) {
            return values.defaultGraphType === 'bar' && Number(values.graphBarOutlineWidth) > 0;
        };
        const legendOn = function (values) { return values.defaultGraphShowLegend !== false; };
        const legendManual = function (values) {
            return legendOn(values) && values.defaultGraphLegendAutoSize === false;
        };
        return [
            { key: 'defaultGraphType', type: 'select', label: 'Default Type', options: GraphWidget.GRAPH_TYPE_OPTIONS, cols: 6 },
            { key: 'defaultGraphLineW', type: 'number', min: 0, label: 'Line Width', cols: 6 },
            {
                key: 'defaultGraphSmoothingAmount', type: 'number', min: 0, max: 100, label: 'Smoothing Amount', cols: 12,
                dependsOn: ['defaultGraphType'], visibleWhen: smoothOnly
            },
            {
                key: 'defaultGraphBarDirection', type: 'select', label: 'Bar Direction', cols: 12,
                options: [{ value: 'vertical', text: 'Vertical' }, { value: 'horizontal', text: 'Horizontal' }],
                dependsOn: ['defaultGraphType'], visibleWhen: barOnly
            },

            { type: 'heading', label: 'Streaming Values', cols: 12 },
            { key: 'defaultGraphBufferMode', type: 'select', label: 'Buffer Mode', cols: 6, options: [
                { value: 'points', text: 'Point Count' },
                { value: 'duration', text: 'Time Period' }
            ] },
            {
                key: 'defaultGraphReverseDirection', type: 'checkbox', label: 'Reverse Direction', cols: 6
            },
            {
                key: 'defaultGraphMaxPoints', type: 'number', label: 'Maximum Data Values', cols: 12,
                dependsOn: ['defaultGraphBufferMode'], visibleWhen: pointsMode
            },
            {
                key: 'defaultGraphDurationPreset', type: 'select', label: 'Time Period', cols: 12,
                options: GraphWidget.GRAPH_DURATION_PRESETS,
                dependsOn: ['defaultGraphBufferMode'], visibleWhen: durationMode
            },
            {
                key: 'defaultGraphFixedTimeWindow', type: 'checkbox', label: 'Fixed Time Period', cols: 6,
                dependsOn: ['defaultGraphBufferMode'], visibleWhen: durationMode
            },
            {
                key: 'defaultGraphTimelineAdvance', type: 'select', label: 'Timeline Progress', cols: 6,
                options: [
                    { value: 'data', text: 'On New Value' },
                    { value: 'time', text: 'Continuous Real Time' }
                ],
                dependsOn: ['defaultGraphBufferMode'], visibleWhen: durationMode
            },
            {
                key: 'defaultGraphDurationCustomValue', type: 'number', min: 1, label: 'Duration', cols: 6,
                dependsOn: ['defaultGraphBufferMode', 'defaultGraphDurationPreset'], visibleWhen: customDuration
            },
            {
                key: 'defaultGraphDurationCustomUnit', type: 'select', label: 'Unit', cols: 6,
                options: [
                    { value: 'minutes', text: 'Minutes' },
                    { value: 'hours', text: 'Hours' },
                    { value: 'days', text: 'Days' }
                ],
                dependsOn: ['defaultGraphBufferMode', 'defaultGraphDurationPreset'], visibleWhen: customDuration
            },
            { key: 'defaultGraphLineGaps', type: 'select', label: 'Line Gaps', cols: 12, options: [
                { value: 'break', text: 'Break on Missing Time' },
                { value: 'connect', text: 'Connect Points' }
            ] },
            { type: 'heading', label: 'Scale Range & Baseline', cols: 12 },
            { key: 'defaultGraphDynamicFloor', type: 'checkbox', label: 'Dynamic Floor', cols: 6 },
            { key: 'defaultGraphDynamicCeiling', type: 'checkbox', label: 'Dynamic Ceiling', cols: 6 },
            { key: 'defaultGraphUseBaseline', type: 'checkbox', label: 'Use Baseline', cols: 6, gridColStart: 1 },
            {
                key: 'defaultGraphBaselineVal', type: 'number', label: 'Baseline Value', cols: 6,
                dependsOn: ['defaultGraphUseBaseline'],
                visibleWhen: function (v) { return v.defaultGraphUseBaseline === true; }
            },
            {
                key: 'defaultGraphNegMode', type: 'select', label: 'Negative Handling', cols: 12,
                options: [
                    { value: 'show_neg', text: 'Show as Negative' },
                    { value: 'show_pos', text: 'Show as Positive' },
                    { value: 'ignore', text: 'Ignore (Hide)' }
                ],
                dependsOn: ['defaultGraphType'],
                visibleWhen: function (values) { return values.defaultGraphType !== 'text'; }
            },

            { key: 'defaultGraphPositiveStartOpacity', type: 'number', min: 0, max: 100, label: 'Positive Start Opacity', cols: 3 },
            { key: 'defaultGraphPositiveEndOpacity', type: 'number', min: 0, max: 100, label: 'Positive End Opacity', cols: 3 },
            { key: 'defaultGraphNegativeStartOpacity', type: 'number', min: 0, max: 100, label: 'Negative Start Opacity', cols: 3 },
            { key: 'defaultGraphNegativeEndOpacity', type: 'number', min: 0, max: 100, label: 'Negative End Opacity', cols: 3 },

            { key: 'defaultGraphOffX', type: 'number', label: 'Graph Offset X', cols: 6 },
            { key: 'defaultGraphOffY', type: 'number', label: 'Graph Offset Y', cols: 6 },

            {
                key: 'defaultGraphBarGap', type: 'number', label: 'Bar Gap', cols: 4,
                dependsOn: ['defaultGraphType'], visibleWhen: barOnly
            },
            {
                key: 'defaultGraphBarRadius', type: 'number', label: 'Bar Radius', cols: 4,
                dependsOn: ['defaultGraphType'], visibleWhen: barOnly
            },
            {
                key: 'graphBarOutlineWidth', type: 'number', label: 'Outline Width', cols: 4,
                dependsOn: ['defaultGraphType'], visibleWhen: barOnly
            },
            {
                key: 'graphBarOutlineColor', type: 'color', label: 'Positive Outline Color', cols: 6,
                dependsOn: ['defaultGraphType', 'graphBarOutlineWidth'], visibleWhen: outlineOn
            },
            {
                key: 'graphNegBarOutlineColor', type: 'color', label: 'Negative Outline Color', cols: 6,
                dependsOn: ['defaultGraphType', 'graphBarOutlineWidth'], visibleWhen: outlineOn
            },

            ...GraphWidget.buildGraphAxesAndLabelsSchemaFields(true),

            ...GraphWidget.buildGraphGridSchemaFields(true),

            { type: 'heading', label: 'Tick Marks', cols: 12 },
            ...GraphWidget.buildGraphTickSchemaFields(true),

            ...GraphWidget.buildGraphPointsAndValuesSchemaFields(true),

            { type: 'heading', label: 'Legend', cols: 12 },
            { key: 'defaultGraphShowLegend', type: 'checkbox', label: 'Show Legend', cols: 6 },
            {
                key: 'defaultGraphLegendPosition', type: 'select', label: 'Position', cols: 6,
                options: [
                    { value: 'top', text: 'Top' },
                    { value: 'bottom', text: 'Bottom' },
                    { value: 'left', text: 'Left' },
                    { value: 'right', text: 'Right' },
                    { value: 'floating', text: 'Floating' }
                ],
                dynamicOptions: function (values, isGlobal) {
                    return GraphWidget.getLegendPositionOptions(values, isGlobal);
                },
                dependsOn: ['defaultGraphShowLegend', 'layoutMode'], visibleWhen: legendOn
            },
            {
                key: 'defaultGraphLegendLayout', type: 'select', label: 'Layout', cols: 6,
                options: [{ value: 'row', text: 'Row' }, { value: 'column', text: 'Column' }],
                dependsOn: ['defaultGraphShowLegend'], visibleWhen: legendOn
            },
            {
                key: 'defaultGraphLegendSwatch', type: 'select', label: 'Swatch', cols: 6,
                options: [
                    { value: 'line', text: 'Line' },
                    { value: 'square', text: 'Square' },
                    { value: 'circle', text: 'Circle' }
                ],
                dependsOn: ['defaultGraphShowLegend'], visibleWhen: legendOn
            },
            {
                key: 'defaultGraphLegendShowContainer', type: 'checkbox', label: 'Show Container', cols: 6,
                dependsOn: ['defaultGraphShowLegend'], visibleWhen: legendOn
            },
            {
                key: 'defaultGraphLegendAutoSize', type: 'checkbox', label: 'Auto Size (Fit to Content)', cols: 6,
                dependsOn: ['defaultGraphShowLegend'], visibleWhen: legendOn
            },
            {
                key: 'defaultGraphLegendWidth', type: 'number', min: 40, label: 'Width', cols: 6,
                dependsOn: ['defaultGraphShowLegend', 'defaultGraphLegendAutoSize'],
                visibleWhen: legendManual
            },
            {
                key: 'defaultGraphLegendHeight', type: 'number', min: 24, label: 'Height', cols: 6,
                dependsOn: ['defaultGraphShowLegend', 'defaultGraphLegendAutoSize'],
                visibleWhen: legendManual
            },

            { type: 'heading', label: 'Animations & Effects', cols: 12 },
            ...GraphWidget.buildGraphAnimationSchemaFields(true),

            { type: 'heading', label: 'Text & Typography', cols: 12 },
            GraphWidget.buildGraphAxisXTypographySchema(true),
            GraphWidget.buildGraphAxisYTypographySchema(true),
            GraphWidget.buildGraphDataTextTypographySchema(true),
            GraphWidget.buildGraphPointValuesTypographySchema(true),
            GraphWidget.buildGraphPointValuesBarTypographySchema(true),
            GraphWidget.buildGraphLegendTypographySchema(true),

        ];
    }
    static SAFETY_CAP() { return 5000; }

    /** Static seeds and snapshots keep up to this many points (pre-2.2 snapshot window). */
    static SNAPSHOT_LIMIT() { return 1000; }

    static markerTintForIndex(i) {
        const n = (Math.abs(i | 0) % 4) + 1;
        return '@markerTint' + n;
    }

    static createSeriesId() {
        return 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    }

    static seriesNameFromTopic(topic) {
        const raw = String(topic || '').trim();
        if (!raw) return '';
        const parts = raw.split('/');
        const leaf = parts[parts.length - 1] || raw;
        const words = leaf.replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (!words) return '';
        return words.replace(/\w\S*/g, function (w) {
            return w.charAt(0).toUpperCase() + w.slice(1);
        });
    }

    static createSeries(index, extra) {
        const tint = GraphWidget.markerTintForIndex(index);
        const series = {
            id: GraphWidget.createSeriesId(),
            name: 'Graph ' + ((index | 0) + 1),
            nameLocked: false,
            visible: true,
            data: '',
            positiveColor: tint,
            negativeColor: tint,
            positiveFillColor: tint,
            negativeFillColor: tint
        };
        if (extra && typeof extra === 'object') {
            const keys = Object.keys(extra);
            for (let i = 0; i < keys.length; i++) series[keys[i]] = extra[keys[i]];
        }
        if (!series.id) series.id = GraphWidget.createSeriesId();
        return series;
    }

    static finiteOrNull(v) {
        if (v == null) return null;
        if (typeof v === 'string') {
            const t = v.trim().toLowerCase();
            if (t === '' || t === 'null' || t === 'nil' || t === 'nan') return null;
        }
        const n = typeof v === 'number' ? v : parseFloat(v);
        return isFinite(n) ? n : null;
    }

    /**
     * Renders a live graph thumbnail preview onto a 2D canvas.
     * Compatible with older engines (no optional chaining or nullish coalescing).
     */
    static drawThumbnail(canvas, options) {
        if (!canvas || !canvas.getContext) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const opts = options || {};
        const points = Array.isArray(opts.points) ? opts.points : [];
        const isSingle = opts.isSingle === true || (points.length <= 1);
        let singleVal = opts.singleValue;
        if (singleVal === undefined && points.length > 0 && points[0].v != null) {
            singleVal = points[0].v;
        }

        const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
        const cssW = canvas.clientWidth > 0 ? canvas.clientWidth : (canvas._cssW || 180);
        const cssH = canvas.clientHeight > 0 ? canvas.clientHeight : (canvas._cssH || 90);
        canvas._cssW = cssW;
        canvas._cssH = cssH;

        if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
            canvas.width = Math.round(cssW * dpr);
            canvas.height = Math.round(cssH * dpr);
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);

        const rawCol = opts.color || '@markerTint1';
        let resolved = (typeof BaseWidget !== 'undefined' && typeof BaseWidget.resolveCssColor === 'function')
            ? BaseWidget.resolveCssColor(rawCol)
            : rawCol;
        if (!resolved || resolved.charAt(0) === '@') resolved = '#38bdf8';

        const isLight = (typeof document !== 'undefined' && document.body && document.body.classList.contains('ui-light')) || opts.isLight === true;

        const padL = 34;
        const padR = 8;
        const padT = 8;
        const padB = 18;
        const plotW = Math.max(1, cssW - padL - padR);
        const plotH = Math.max(1, cssH - padT - padB);

        // Frame and baseline grid lines
        ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(padL, padT, plotW, plotH);

        ctx.beginPath();
        ctx.moveTo(padL, padT + plotH / 2);
        ctx.lineTo(padL + plotW, padT + plotH / 2);
        ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.04)';
        ctx.stroke();

        ctx.font = isLight ? '600 9px system-ui, -apple-system, sans-serif' : '9px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isLight ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.45)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        if (isSingle) {
            const hasNum = singleVal != null && isFinite(singleVal);
            const num = hasNum ? Number(singleVal) : 0;
            const yLine = padT + plotH / 2;

            const labelStr = hasNum ? (Number.isInteger(num) ? String(num) : num.toFixed(1)) : '--';
            ctx.fillText(labelStr, padL - 4, yLine);

            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('Live', padL, padT + plotH + 4);

            if (hasNum) {
                const grad = ctx.createLinearGradient(0, yLine, 0, padT + plotH);
                const colRgba = (typeof Dashboard !== 'undefined' && typeof Dashboard.hexToRgba === 'function')
                    ? Dashboard.hexToRgba(resolved, isLight ? 0.20 : 0.25)
                    : (isLight ? 'rgba(56, 189, 248, 0.20)' : 'rgba(56, 189, 248, 0.25)');
                grad.addColorStop(0, colRgba);
                grad.addColorStop(1, isLight ? 'rgba(248, 250, 252, 0)' : 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(padL, yLine, plotW, padT + plotH - yLine);

                ctx.beginPath();
                ctx.moveTo(padL, yLine);
                ctx.lineTo(padL + plotW, yLine);
                ctx.strokeStyle = resolved;
                ctx.lineWidth = 2.25;
                ctx.stroke();
            }
            return;
        }

        let minV = Infinity;
        let maxV = -Infinity;
        const validPts = [];
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const v = (p && p.v != null) ? GraphWidget.finiteOrNull(p.v) : null;
            if (v != null) {
                validPts.push({ v: v, t: p.t, l: p.l });
                if (v < minV) minV = v;
                if (v > maxV) maxV = v;
            }
        }

        if (validPts.length === 0) {
            minV = 0;
            maxV = 1;
        } else if (minV === maxV) {
            minV -= 1;
            maxV += 1;
        }

        const maxStr = Number.isInteger(maxV) ? String(maxV) : maxV.toFixed(1);
        const minStr = Number.isInteger(minV) ? String(minV) : minV.toFixed(1);
        ctx.fillText(maxStr, padL - 4, padT + 4);
        ctx.fillText(minStr, padL - 4, padT + plotH - 4);

        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        let xStartLabel = '0';
        let xEndLabel = String(Math.max(1, validPts.length - 1));

        if (validPts.length > 0) {
            const firstP = validPts[0];
            const lastP = validPts[validPts.length - 1];
            if (firstP.l && lastP.l) {
                xStartLabel = String(firstP.l);
                xEndLabel = String(lastP.l);
            } else if (firstP.t != null && lastP.t != null) {
                const d1 = new Date(firstP.t);
                const d2 = new Date(lastP.t);
                const pad2 = function (n) { return n < 10 ? '0' + n : String(n); };
                xStartLabel = pad2(d1.getHours()) + ':' + pad2(d1.getMinutes());
                xEndLabel = pad2(d2.getHours()) + ':' + pad2(d2.getMinutes());
            }
        }
        ctx.fillText(xStartLabel, padL, padT + plotH + 4);
        ctx.textAlign = 'right';
        ctx.fillText(xEndLabel, padL + plotW, padT + plotH + 4);

        if (validPts.length < 2) {
            const yPt = padT + plotH / 2;
            ctx.beginPath();
            ctx.moveTo(padL, yPt);
            ctx.lineTo(padL + plotW, yPt);
            ctx.strokeStyle = resolved;
            ctx.lineWidth = 2.25;
            ctx.stroke();
            return;
        }

        const spanV = (maxV - minV) || 1;
        const screenPts = [];
        const n = validPts.length;
        for (let i = 0; i < n; i++) {
            const fracX = i / (n - 1);
            const x = padL + fracX * plotW;
            const fracY = (validPts[i].v - minV) / spanV;
            const y = padT + (1 - fracY) * plotH;
            screenPts.push({ x: x, y: y });
        }

        const fillGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
        const colFillRgba = (typeof Dashboard !== 'undefined' && typeof Dashboard.hexToRgba === 'function')
            ? Dashboard.hexToRgba(resolved, isLight ? 0.28 : 0.35)
            : (isLight ? 'rgba(56, 189, 248, 0.28)' : 'rgba(56, 189, 248, 0.35)');
        fillGrad.addColorStop(0, colFillRgba);
        fillGrad.addColorStop(1, isLight ? 'rgba(248, 250, 252, 0)' : 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(screenPts[0].x, padT + plotH);
        ctx.lineTo(screenPts[0].x, screenPts[0].y);
        for (let i = 1; i < screenPts.length; i++) {
            ctx.lineTo(screenPts[i].x, screenPts[i].y);
        }
        ctx.lineTo(screenPts[screenPts.length - 1].x, padT + plotH);
        ctx.closePath();
        ctx.fillStyle = fillGrad;
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.moveTo(screenPts[0].x, screenPts[0].y);
        for (let i = 1; i < screenPts.length; i++) {
            ctx.lineTo(screenPts[i].x, screenPts[i].y);
        }
        ctx.strokeStyle = resolved;
        ctx.lineWidth = 2.25;
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    static clampOpacity(value, fallback) {
        const n = value != null && value !== '' ? Number(value) : Number(fallback);
        if (!isFinite(n)) return 0;
        if (n < 0) return 0;
        if (n > 100) return 100;
        return n;
    }

    /**
     * Settings on each graph that can follow a topic. `data` is ingested as samples,
     * so the paint overlay skips it. The editor still links it.
     */
    static seriesBindSpec() {
        return [
            { prop: 'data', kind: 'text' },
            { prop: 'name', kind: 'text' },
            { prop: 'visible', kind: 'bool' },
            { prop: 'positiveColor', kind: 'color' },
            { prop: 'negativeColor', kind: 'color' },
            { prop: 'positiveFillColor', kind: 'color' },
            { prop: 'negativeFillColor', kind: 'color' },
            { prop: 'pointColor', kind: 'color' },
            { prop: 'positiveOutlineColor', kind: 'color' },
            { prop: 'negativeOutlineColor', kind: 'color' },
            { prop: 'lineWidth', kind: 'number' },
            { prop: 'positiveStartOpacity', kind: 'number' },
            { prop: 'positiveEndOpacity', kind: 'number' },
            { prop: 'negativeStartOpacity', kind: 'number' },
            { prop: 'negativeEndOpacity', kind: 'number' },
            { prop: 'valueMultiplier', kind: 'number' }
        ];
    }

    static seriesBindPropPattern() {
        const spec = GraphWidget.seriesBindSpec();
        const names = [];
        for (let i = 0; i < spec.length; i++) names.push(spec[i].prop);
        return names.join('|');
    }

    static _coerceSeriesBind(kind, prop, value) {
        if (kind === 'bool') {
            if (typeof value === 'boolean') return value;
            if (typeof value === 'number') return value !== 0;
            if (typeof value === 'string') {
                const t = value.trim().toLowerCase();
                if (t === 'true' || t === '1' || t === 'on' || t === 'yes') return true;
                if (t === 'false' || t === '0' || t === 'off' || t === 'no') return false;
            }
            return null;
        }
        if (kind === 'number') {
            const n = typeof value === 'number' ? value : parseFloat(value);
            if (!isFinite(n)) return null;
            if (prop === 'lineWidth') return n < 0 ? 0 : n;
            if (prop.indexOf('Opacity') !== -1) return GraphWidget.clampOpacity(n, n);
            return n;
        }
        if (value == null) return null;
        const text = String(value);
        if (kind === 'color') return text !== '' ? text : null;
        return text;
    }

    /**
     * A topic, formula, or color correction on a graph setting replaces the
     * painted value. Stored samples stay untouched.
     */
    static applySeriesOutlineBindings(widget, rows) {
        if (!widget || !rows || !rows.length || typeof BindingsTree === 'undefined') return rows;
        const spec = GraphWidget.seriesBindSpec();
        const o = widget.overrides || {};
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row.id) continue;
            for (let p = 0; p < spec.length; p++) {
                const prop = spec[p].prop;
                if (prop === 'data') continue;
                const key = 'graphSeries_' + row.id + '_' + prop;
                const topic = BindingsTree.getAtPath(widget.bindings, ['series', i, prop]);
                const hasTopic = typeof topic === 'string' && topic !== '';
                const hasAux = !!(o[key + '_bind_formula'] || o[key + '_bind_transformMode'] || o[key + '_bind_mapTrue'] || o[key + '_bind_mapFalse'] || o[key + '_correct_en'] === true);
                if (!hasTopic && !hasAux) continue;
                let value = row[prop];
                if (hasTopic && typeof Dashboard !== 'undefined' && Dashboard.liveData && Dashboard.liveData[topic] !== undefined) {
                    value = Dashboard.liveData[topic];
                }
                if (typeof widget._finalizeBindingValue === 'function') value = widget._finalizeBindingValue(key, value);
                const next = GraphWidget._coerceSeriesBind(spec[p].kind, prop, value);
                if (next != null) row[prop] = next;
            }
        }
        return rows;
    }

    static durationMsFrom(preset, value, unit) {
        const map = {
            '15m': 900000,
            '1h': 3600000,
            '6h': 21600000,
            '12h': 43200000,
            '24h': 86400000,
            '7d': 604800000,
            '30d': 2592000000
        };
        if (preset && Object.prototype.hasOwnProperty.call(map, preset)) return map[preset];
        const n = Math.max(0, Number(value) || 0);
        if (unit === 'minutes') return n * 60000;
        if (unit === 'days') return n * 86400000;
        return n * 3600000;
    }

    static pointsFromParsed(parsed) {
        if (!parsed || parsed.type === 'error') return [];
        if (parsed.type === 'single') {
            return [{ v: GraphWidget.finiteOrNull(parsed.value), t: null, l: null, seq: 0 }];
        }
        const values = parsed.values || [];
        const out = [];
        for (let i = 0; i < values.length; i++) {
            const item = values[i];
            if (item && typeof item === 'object') {
                const v = ('v' in item) ? GraphWidget.finiteOrNull(item.v) : GraphWidget.finiteOrNull(item);
                let t = null;
                if ('t' in item) t = GraphWidget._timestampSortKey(item.t);
                const l = ('l' in item && item.l != null) ? String(item.l) : null;
                out.push({ v: v, t: t, l: l, seq: i });
            } else {
                out.push({ v: GraphWidget.finiteOrNull(item), t: null, l: null, seq: i });
            }
        }
        return out;
    }

    static resolveSeriesList(c, M) {
        const master = M || {};
        const raw = c && Array.isArray(c.series) ? c.series : [];
        const lineW = master.defaultGraphLineW != null ? master.defaultGraphLineW : 2;
        const startOp = master.defaultGraphPositiveStartOpacity != null ? master.defaultGraphPositiveStartOpacity : 40;
        const endOp = master.defaultGraphPositiveEndOpacity != null ? master.defaultGraphPositiveEndOpacity : 0;
        const nStart = master.defaultGraphNegativeStartOpacity != null ? master.defaultGraphNegativeStartOpacity : startOp;
        const nEnd = master.defaultGraphNegativeEndOpacity != null ? master.defaultGraphNegativeEndOpacity : 0;
        const out = [];
        for (let i = 0; i < raw.length; i++) {
            const s = raw[i] && typeof raw[i] === 'object' ? raw[i] : {};
            const tint = GraphWidget.markerTintForIndex(i);
            const pos = s.positiveColor || tint;
            const row = {
                id: s.id || ('s' + i),
                name: s.name || ('Graph ' + (i + 1)),
                nameLocked: s.nameLocked === true,
                visible: s.visible !== false,
                data: s.data != null ? String(s.data) : '',
                lineWidth: BaseWidget.clampNumber(s.lineWidth != null && s.lineWidth !== '' ? s.lineWidth : lineW, 0, null),
                positiveColor: pos,
                negativeColor: s.negativeColor || pos,
                positiveFillColor: s.positiveFillColor || pos,
                negativeFillColor: s.negativeFillColor || pos,
                positiveStartOpacity: GraphWidget.clampOpacity(s.positiveStartOpacity, startOp),
                positiveEndOpacity: GraphWidget.clampOpacity(s.positiveEndOpacity, endOp),
                negativeStartOpacity: GraphWidget.clampOpacity(s.negativeStartOpacity, nStart),
                negativeEndOpacity: GraphWidget.clampOpacity(s.negativeEndOpacity, nEnd),
                pointColor: s.pointColor ? String(s.pointColor) : '',
                valueMultiplier: (s.valueMultiplier != null && s.valueMultiplier !== '' && isFinite(Number(s.valueMultiplier)))
                    ? Number(s.valueMultiplier)
                    : 0,
                positiveOutlineColor: (typeof s.positiveOutlineColor === 'string' && s.positiveOutlineColor !== '')
                    ? s.positiveOutlineColor
                    : (master.graphBarOutlineColor || 'transparent'),
                negativeOutlineColor: (typeof s.negativeOutlineColor === 'string' && s.negativeOutlineColor !== '')
                    ? s.negativeOutlineColor
                    : (master.graphNegBarOutlineColor || master.graphBarOutlineColor || 'transparent')
            };
            out.push(row);
        }
        return out;
    }

    _initGraphState() {
        if (this._graphStateInitialized) return;
        this._graphStateInitialized = true;
        if (!this._seriesState) this._seriesState = {};
        if (!this._sessionVisible) this._sessionVisible = {};
        if (this._timelineTimer === undefined) this._timelineTimer = null;
        if (this._timelineRaf === undefined) this._timelineRaf = null;
        if (this._timelineMode === undefined) this._timelineMode = null;
        if (this._timelineTimerMs === undefined) this._timelineTimerMs = null;
        if (this._lastTimelineTick === undefined) this._lastTimelineTick = 0;
        if (this._boundTimelineTick === undefined) this._boundTimelineTick = null;
        if (this._boundTimelineTimer === undefined) this._boundTimelineTimer = null;
        if (this._plotView === undefined) this._plotView = null;
        if (!this.renderedPoints) this.renderedPoints = [];
        if (!this._activeAnimations) this._activeAnimations = {};
        if (!this._lastPlacedPointValues) this._lastPlacedPointValues = {};
        if (!this._pendingAnimationUpdates) this._pendingAnimationUpdates = {};
        if (this._animRaf === undefined) this._animRaf = null;
        if (this._cachedPlotLayout === undefined) this._cachedPlotLayout = null;
        if (!this._boundAnimTick) this._boundAnimTick = this._tickGraphAnimation.bind(this);
        if (!this._scaleState) {
            this._scaleState = {
                currentMin: null,
                currentMax: null,
                fromMin: null,
                fromMax: null,
                startTime: 0,
                duration: 0
            };
        }
    }

    constructor(cid, id, ov, bn) {
        GraphWidget.ensureLegendAutoSize(ov);
        super(cid, id, ov, bn);
        this._initGraphState();
    }

    getDefaultOverrides() {
        const tint = GraphWidget.markerTintForIndex(0);
        return {
            label: "Graph",
            series: [
                GraphWidget.createSeries(0, {
                    name: 'Graph 1',
                    data: '15,20,10,100,94,12.5,23,97,30,10',
                    positiveColor: tint,
                    negativeColor: tint,
                    positiveFillColor: tint,
                    negativeFillColor: tint
                })
            ],
            typography: { widgetLabel: {}, axisX: {}, dataText: {}, pointValues: {}, pointValuesBar: {}, legendItem: {} }
        };
    }

    get config() {
        const c = super.config;
        const getNum = (val, def) => (val !== null && val !== undefined && val !== "") ? val : def;

        GraphWidget.applyTypographyNestedToConfig(c);
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        GraphWidget.fillGraphTypographyResolved(c, M);
        if (this.bindings && this.bindings.typography) {
            BaseWidget.applyNestedBindingOverlay(this, c, GraphWidget.getNestedBindingOverlaySpec());
        }

        const axisOffYSource = c.axisOffY !== undefined && c.axisOffY !== null ? c.axisOffY : c.defaultGraphAxisOffY;
        const axisOffYNum = Number(axisOffYSource);
        const safeAxisOffY = Number.isFinite(axisOffYNum) ? axisOffYNum : 10;
        const axisXFontSizeSource = c.axisXFontSize !== undefined && c.axisXFontSize !== null ? c.axisXFontSize : c.defaultGraphAxisXFontSize;
        const axisXFontSizeNum = Number(axisXFontSizeSource);
        const safeAxisXFontSize = Number.isFinite(axisXFontSizeNum) ? Math.max(1, axisXFontSizeNum) : 10;
        const axisYFontSizeSource = c.axisYFontSize !== undefined && c.axisYFontSize !== null ? c.axisYFontSize : c.axisXFontSize;
        const axisYFontSizeNum = Number(axisYFontSizeSource);
        const safeAxisYFontSize = Number.isFinite(axisYFontSizeNum) ? Math.max(1, axisYFontSizeNum) : safeAxisXFontSize;
        const safeAxisOffX = BaseWidget.toFiniteNumber(c.axisOffX !== undefined && c.axisOffX !== null ? c.axisOffX : c.defaultGraphAxisOffX, 10);
        const safeAxisWidthY = BaseWidget.clampNumber(c.axisWidthY !== undefined && c.axisWidthY !== null ? c.axisWidthY : (c.defaultGraphAxisWidthY || 0), 0, null);
        const safeAxisWidthX = BaseWidget.clampNumber(c.axisWidthX !== undefined && c.axisWidthX !== null ? c.axisWidthX : (c.defaultGraphAxisWidthX || 0), 0, null);
        const safeAxisResX = Math.max(1, Math.floor(BaseWidget.toFiniteNumber(c.axisResX !== undefined && c.axisResX !== null ? c.axisResX : c.defaultGraphAxisResX, 5)));
        const safeAxisResY = Math.max(2, Math.floor(BaseWidget.toFiniteNumber(c.axisResY !== undefined && c.axisResY !== null ? c.axisResY : c.defaultGraphAxisResY, 4)));
        const autoAxisResX = c.autoAxisResX !== undefined && c.autoAxisResX !== null
            ? (c.autoAxisResX === true)
            : (c.defaultGraphAutoAxisResX === true);
        const autoAxisResY = c.autoAxisResY !== undefined && c.autoAxisResY !== null
            ? (c.autoAxisResY === true)
            : (c.defaultGraphAutoAxisResY === true);
        const hoverOnly = c.pointValuesHoverOnly !== undefined && c.pointValuesHoverOnly !== null ? c.pointValuesHoverOnly : (c.defaultGraphPointValuesHoverOnly !== undefined ? c.defaultGraphPointValuesHoverOnly : false);

        const dynamicFloor = (function () {
            if (c.dynamicFloor !== undefined && c.dynamicFloor !== null) return c.dynamicFloor === true;
            if (c.autoMin !== undefined && c.autoMin !== null) return c.autoMin === true;
            if (c.defaultGraphDynamicFloor !== undefined && c.defaultGraphDynamicFloor !== null) return c.defaultGraphDynamicFloor === true;
            if (c.defaultGraphAutoMin !== undefined && c.defaultGraphAutoMin !== null) return c.defaultGraphAutoMin === true;
            return true;
        })();
        const fixedFloor = (function () {
            if (c.fixedFloor !== undefined && c.fixedFloor !== null && c.fixedFloor !== '') return BaseWidget.toFiniteNumber(c.fixedFloor, 0);
            if (c.min !== undefined && c.min !== null && c.min !== '') return BaseWidget.toFiniteNumber(c.min, 0);
            return 0;
        })();
        const dynamicCeiling = (function () {
            if (c.dynamicCeiling !== undefined && c.dynamicCeiling !== null) return c.dynamicCeiling === true;
            if (c.autoMax !== undefined && c.autoMax !== null) return c.autoMax === true;
            if (c.defaultGraphDynamicCeiling !== undefined && c.defaultGraphDynamicCeiling !== null) return c.defaultGraphDynamicCeiling === true;
            if (c.defaultGraphAutoMax !== undefined && c.defaultGraphAutoMax !== null) return c.defaultGraphAutoMax === true;
            return true;
        })();
        const fixedCeiling = (function () {
            if (c.fixedCeiling !== undefined && c.fixedCeiling !== null && c.fixedCeiling !== '') return BaseWidget.toFiniteNumber(c.fixedCeiling, 100);
            if (c.max !== undefined && c.max !== null && c.max !== '') return BaseWidget.toFiniteNumber(c.max, 100);
            return 100;
        })();

        const out = {
            ...c,
            type: c.type || c.defaultGraphType || 'line',
            smoothingAmount: Math.floor(BaseWidget.clampNumber(
                c.smoothingAmount !== undefined && c.smoothingAmount !== null
                    ? c.smoothingAmount
                    : (c.defaultGraphSmoothingAmount !== undefined ? c.defaultGraphSmoothingAmount : 0),
                0,
                100
            )),
            maxPoints: c.maxPoints !== undefined && c.maxPoints !== null ? c.maxPoints : c.defaultGraphMaxPoints,
            reverseDirection: (function () {
                if (c.reverseDirection !== undefined && c.reverseDirection !== null) return c.reverseDirection === true;
                if (c.defaultGraphReverseDirection !== undefined && c.defaultGraphReverseDirection !== null) return c.defaultGraphReverseDirection === true;
                if (c.scrollDir === 'right' || c.defaultGraphScrollDir === 'right') return true;
                return false;
            })(),
            scrollDir: c.scrollDir || c.defaultGraphScrollDir || 'left',
            graphOffX: BaseWidget.toFiniteNumber(c.graphOffX !== undefined && c.graphOffX !== null ? c.graphOffX : (c.defaultGraphOffX || 0), 0),
            graphOffY: BaseWidget.toFiniteNumber(c.graphOffY !== undefined && c.graphOffY !== null ? c.graphOffY : (c.defaultGraphOffY || 0), 0),
            bufferMode: c.bufferMode || c.defaultGraphBufferMode || 'points',
            durationPreset: c.durationPreset || c.defaultGraphDurationPreset || '24h',
            durationCustomValue: Math.max(1, BaseWidget.toFiniteNumber(
                c.durationCustomValue !== undefined && c.durationCustomValue !== null ? c.durationCustomValue : c.defaultGraphDurationCustomValue,
                1
            )),
            durationCustomUnit: c.durationCustomUnit || c.defaultGraphDurationCustomUnit || 'hours',
            fixedTimeWindow: c.fixedTimeWindow !== undefined && c.fixedTimeWindow !== null
                ? c.fixedTimeWindow === true
                : (c.defaultGraphFixedTimeWindow === true),
            timelineAdvance: (function () {
                if (c.timelineAdvance === 'data' || c.timelineAdvance === 'time') return c.timelineAdvance;
                if (c.defaultGraphTimelineAdvance === 'data' || c.defaultGraphTimelineAdvance === 'time') return c.defaultGraphTimelineAdvance;
                return 'data';
            })(),
            lineGaps: c.lineGaps || c.defaultGraphLineGaps || 'break',
            barDirection: c.barDirection || c.defaultGraphBarDirection || 'vertical',
            categoryLabelRotation: BaseWidget.toFiniteNumber(
                c.categoryLabelRotation !== undefined && c.categoryLabelRotation !== null ? c.categoryLabelRotation : c.defaultGraphCategoryLabelRotation,
                0
            ),
            valueLabelRotation: BaseWidget.toFiniteNumber(
                c.valueLabelRotation !== undefined && c.valueLabelRotation !== null ? c.valueLabelRotation : c.defaultGraphValueLabelRotation,
                0
            ),
            showLegend: c.showLegend !== undefined && c.showLegend !== null ? c.showLegend === true : (c.defaultGraphShowLegend === true),
            legendPosition: c.legendPosition || c.defaultGraphLegendPosition || 'right',
            legendLayout: c.legendLayout || c.defaultGraphLegendLayout || 'column',
            legendSwatch: c.legendSwatch || c.defaultGraphLegendSwatch || 'square',
            legendShowContainer: (function (inst) {
                if (c.legendShowContainer !== undefined && c.legendShowContainer !== null) {
                    return c.legendShowContainer === true;
                }
                if (c.defaultGraphLegendShowContainer !== undefined && c.defaultGraphLegendShowContainer !== null) {
                    return c.defaultGraphLegendShowContainer === true;
                }
                const isResp = typeof BaseWidget !== 'undefined'
                    && (typeof BaseWidget.usesResponsiveGridLayout === 'function'
                        ? BaseWidget.usesResponsiveGridLayout(inst)
                        : (BaseWidget.isResponsiveMode && BaseWidget.isResponsiveMode()));
                if (isResp) return false;
                return c.bgVisible === true;
            })(this),
            legendAutoSize: GraphWidget.legendAutoSizeFrom(this, c),
            legendW: Math.max(40, BaseWidget.toFiniteNumber(
                c.legendW !== undefined && c.legendW !== null ? c.legendW : c.defaultGraphLegendWidth,
                160
            )),
            legendH: Math.max(24, BaseWidget.toFiniteNumber(
                c.legendH !== undefined && c.legendH !== null ? c.legendH : c.defaultGraphLegendHeight,
                72
            )),
            legendOffX: (c.legendOffX !== undefined && c.legendOffX !== null && c.legendOffX !== '') ? BaseWidget.toFiniteNumber(c.legendOffX, 0) : null,
            legendOffY: (c.legendOffY !== undefined && c.legendOffY !== null && c.legendOffY !== '') ? BaseWidget.toFiniteNumber(c.legendOffY, 0) : null,
            series: GraphWidget.applySeriesOutlineBindings(this, GraphWidget.resolveSeriesList(c, M)),
            barGap: BaseWidget.clampNumber(c.barGap !== undefined && c.barGap !== null ? c.barGap : c.defaultGraphBarGap, 0, null),
            barRadius: BaseWidget.clampNumber(c.barRadius !== undefined && c.barRadius !== null ? c.barRadius : c.defaultGraphBarRadius, 0, null),
            barOutlineWidth: BaseWidget.clampNumber(c.barOutlineWidth !== undefined && c.barOutlineWidth !== null ? c.barOutlineWidth : (c.graphBarOutlineWidth || 0), 0, null),
            showPoints: c.showPoints !== undefined && c.showPoints !== null ? c.showPoints : (c.defaultGraphPointShow !== undefined ? c.defaultGraphPointShow : false),
            pointSize: BaseWidget.clampNumber(c.pointSize !== undefined && c.pointSize !== null ? c.pointSize : (c.defaultGraphPointSize !== undefined ? c.defaultGraphPointSize : 4), 1, null),

            dynamicFloor: dynamicFloor,
            fixedFloor: fixedFloor,
            dynamicCeiling: dynamicCeiling,
            fixedCeiling: fixedCeiling,
            autoMin: dynamicFloor,
            min: fixedFloor,
            autoMax: dynamicCeiling,
            max: fixedCeiling,
            useBaseline: c.useBaseline !== undefined && c.useBaseline !== null ? c.useBaseline : (c.defaultGraphUseBaseline || false),
            baselineVal: c.baselineVal !== undefined && c.baselineVal !== null ? c.baselineVal : (c.defaultGraphBaselineVal || 0),

            negMode: c.negMode || c.defaultGraphNegMode || 'show_neg',
            decimals: Math.max(0, Math.floor(BaseWidget.toFiniteNumber(c.decimals !== undefined && c.decimals !== null ? c.decimals : (c.defaultGraphDecimals || 0), 0))),
            roundingMode: c.roundingMode || c.defaultGraphRoundingMode || 'smart',
            headroom: BaseWidget.clampNumber(c.headroom !== undefined && c.headroom !== null ? c.headroom : (c.defaultGraphHeadroom || 0), 0, 100),
            showAxisX: c.showAxisX !== undefined && c.showAxisX !== null ? c.showAxisX : c.defaultGraphShowAxisX,
            timeFormat: c.timeFormat || c.defaultGraphTimeFormat || "Datapoints",
            time24h: c.time24h !== undefined && c.time24h !== null ? c.time24h : (c.defaultGraphTime24h !== undefined ? c.defaultGraphTime24h : true),
            dateFormat: c.dateFormat || c.defaultGraphDateFormat || "DD-MM-YYYY",
            timezoneConvert: c.timezoneConvert !== undefined && c.timezoneConvert !== null ? c.timezoneConvert : (c.defaultGraphTimezoneConvert || false),
            showAxisY: c.showAxisY !== undefined && c.showAxisY !== null ? c.showAxisY : c.defaultGraphShowAxisY,
            axisResX: safeAxisResX,
            axisResY: safeAxisResY,
            autoAxisResX: autoAxisResX,
            autoAxisResY: autoAxisResY,
            axisWidthY: safeAxisWidthY,
            axisWidthX: safeAxisWidthX,
            axisOffX: safeAxisOffX,
            axisOffY: safeAxisOffY,

            gridHTopShow: c.gridHTopShow !== undefined && c.gridHTopShow !== null ? c.gridHTopShow : (c.defaultGraphGridHTopShow || false),
            gridHTopCol: c.gridHTopCol || c.defaultGraphGridHTopCol || "@accentSoft",
            gridHTopW: c.gridHTopW !== undefined && c.gridHTopW !== null ? c.gridHTopW : (c.defaultGraphGridHTopW !== undefined ? c.defaultGraphGridHTopW : 2),
            gridHTopOp: c.gridHTopOp !== undefined && c.gridHTopOp !== null ? c.gridHTopOp : (c.defaultGraphGridHTopOp !== undefined ? c.defaultGraphGridHTopOp : 80),

            gridHBotShow: c.gridHBotShow !== undefined && c.gridHBotShow !== null ? c.gridHBotShow : (c.defaultGraphGridHBotShow || false),
            gridHBotCol: c.gridHBotCol || c.defaultGraphGridHBotCol || "@accentSoft",
            gridHBotW: c.gridHBotW !== undefined && c.gridHBotW !== null ? c.gridHBotW : (c.defaultGraphGridHBotW !== undefined ? c.defaultGraphGridHBotW : 2),
            gridHBotOp: c.gridHBotOp !== undefined && c.gridHBotOp !== null ? c.gridHBotOp : (c.defaultGraphGridHBotOp !== undefined ? c.defaultGraphGridHBotOp : 80),

            gridHBaseShow: c.gridHBaseShow !== undefined && c.gridHBaseShow !== null ? c.gridHBaseShow : (c.defaultGraphGridHBaseShow !== undefined ? c.defaultGraphGridHBaseShow : false),
            gridHBaseCol: c.gridHBaseCol || c.defaultGraphGridHBaseCol || "@warning",
            gridHBaseW: c.gridHBaseW !== undefined && c.gridHBaseW !== null ? c.gridHBaseW : (c.defaultGraphGridHBaseW || 2),
            gridHBaseOp: c.gridHBaseOp !== undefined && c.gridHBaseOp !== null ? c.gridHBaseOp : (c.defaultGraphGridHBaseOp !== undefined ? c.defaultGraphGridHBaseOp : 80),

            gridHInnerShow: c.gridHInnerShow !== undefined && c.gridHInnerShow !== null ? c.gridHInnerShow : (c.defaultGraphGridHInnerShow !== undefined ? c.defaultGraphGridHInnerShow : false),
            gridHInnerCol: c.gridHInnerCol || c.defaultGraphGridHInnerCol || "@borderAccent",
            gridHInnerW: c.gridHInnerW !== undefined && c.gridHInnerW !== null ? c.gridHInnerW : (c.defaultGraphGridHInnerW || 1),
            gridHInnerOp: c.gridHInnerOp !== undefined && c.gridHInnerOp !== null ? c.gridHInnerOp : (c.defaultGraphGridHInnerOp !== undefined ? c.defaultGraphGridHInnerOp : 40),
            gridHInnerSpace: c.gridHInnerSpace !== undefined && c.gridHInnerSpace !== null ? c.gridHInnerSpace : (c.defaultGraphGridHInnerSpace || 0),

            gridVShow: c.gridVShow !== undefined && c.gridVShow !== null ? c.gridVShow : (c.defaultGraphGridVShow || false),
            gridVCol: c.gridVCol || c.defaultGraphGridVCol || "@borderAccent",
            gridVW: c.gridVW !== undefined && c.gridVW !== null ? c.gridVW : (c.defaultGraphGridVW || 1),
            gridVOp: c.gridVOp !== undefined && c.gridVOp !== null ? c.gridVOp : (c.defaultGraphGridVOp !== undefined ? c.defaultGraphGridVOp : 40),
            gridVSpace: c.gridVSpace !== undefined && c.gridVSpace !== null ? c.gridVSpace : (c.defaultGraphGridVSpace || 0),

            gridVLeftShow: c.gridVLeftShow !== undefined && c.gridVLeftShow !== null ? c.gridVLeftShow : (c.defaultGraphGridVLeftShow || false),
            gridVLeftCol: c.gridVLeftCol || c.defaultGraphGridVLeftCol || "@accentSoft",
            gridVLeftW: c.gridVLeftW !== undefined && c.gridVLeftW !== null ? c.gridVLeftW : (c.defaultGraphGridVLeftW !== undefined ? c.defaultGraphGridVLeftW : 2),
            gridVLeftOp: c.gridVLeftOp !== undefined && c.gridVLeftOp !== null ? c.gridVLeftOp : (c.defaultGraphGridVLeftOp !== undefined ? c.defaultGraphGridVLeftOp : 80),

            gridVRightShow: c.gridVRightShow !== undefined && c.gridVRightShow !== null ? c.gridVRightShow : (c.defaultGraphGridVRightShow || false),
            gridVRightCol: c.gridVRightCol || c.defaultGraphGridVRightCol || "@accentSoft",
            gridVRightW: c.gridVRightW !== undefined && c.gridVRightW !== null ? c.gridVRightW : (c.defaultGraphGridVRightW !== undefined ? c.defaultGraphGridVRightW : 2),
            gridVRightOp: c.gridVRightOp !== undefined && c.gridVRightOp !== null ? c.gridVRightOp : (c.defaultGraphGridVRightOp !== undefined ? c.defaultGraphGridVRightOp : 80),

            showTickX: c.showTickX !== undefined && c.showTickX !== null ? c.showTickX : (c.defaultGraphShowTickX || false),
            showTickY: c.showTickY !== undefined && c.showTickY !== null ? c.showTickY : (c.defaultGraphShowTickY || false),
            tickXSpacing: BaseWidget.toFiniteNumber(
                c.tickXSpacing !== undefined && c.tickXSpacing !== null ? c.tickXSpacing : c.defaultGraphTickXSpacing,
                0
            ),
            tickYCount: BaseWidget.toFiniteNumber(
                c.tickYCount !== undefined && c.tickYCount !== null ? c.tickYCount : c.defaultGraphTickYCount,
                0
            ),
            tickXSize: BaseWidget.clampNumber(
                c.tickXSize !== undefined && c.tickXSize !== null ? c.tickXSize : (c.defaultGraphTickXSize !== undefined ? c.defaultGraphTickXSize : 5),
                1,
                null
            ),
            tickXThickness: BaseWidget.clampNumber(
                c.tickXThickness !== undefined && c.tickXThickness !== null ? c.tickXThickness : (c.defaultGraphTickXThickness !== undefined ? c.defaultGraphTickXThickness : 2),
                1,
                null
            ),
            tickXColor: c.tickXColor || c.defaultGraphTickXColor || '@accentSoft',
            tickXOffset: BaseWidget.toFiniteNumber(
                c.tickXOffset !== undefined && c.tickXOffset !== null ? c.tickXOffset : (c.defaultGraphTickXOffset || 0),
                0
            ),
            tickYSize: BaseWidget.clampNumber(
                c.tickYSize !== undefined && c.tickYSize !== null ? c.tickYSize : (c.defaultGraphTickYSize !== undefined ? c.defaultGraphTickYSize : 5),
                1,
                null
            ),
            tickYThickness: BaseWidget.clampNumber(
                c.tickYThickness !== undefined && c.tickYThickness !== null ? c.tickYThickness : (c.defaultGraphTickYThickness !== undefined ? c.defaultGraphTickYThickness : 2),
                1,
                null
            ),
            tickYColor: c.tickYColor || c.defaultGraphTickYColor || '@accentSoft',
            tickYOffset: BaseWidget.toFiniteNumber(
                c.tickYOffset !== undefined && c.tickYOffset !== null ? c.tickYOffset : (c.defaultGraphTickYOffset || 0),
                0
            ),

            label: c.label || "",
            labelFont: c.labelFont,
            labelFs: getNum(c.labelFs, M.defaultFsLabel != null ? M.defaultFsLabel : 12),
            labelCol: c.labelCol,
            labelCase: c.labelCase,
            labelBold: c.labelBold,
            labelAlign: c.labelAlign,
            labelItalic: c.labelItalic,
            labelOffX: getNum(c.labelOffX, 0),
            labelOffY: getNum(c.labelOffY, 0),

            axisXFont: c.axisXFont,
            axisXFontSize: safeAxisXFontSize,
            axisXFontColor: c.axisXFontColor,
            axisXFontBold: c.axisXFontBold,
            axisXFontOpacity: BaseWidget.toFiniteNumber(c.axisXFontOpacity, 100),
            axisYFont: c.axisYFont,
            axisYFontSize: safeAxisYFontSize,
            axisYFontColor: c.axisYFontColor,
            axisYFontBold: c.axisYFontBold,
            axisYFontOpacity: BaseWidget.toFiniteNumber(c.axisYFontOpacity, BaseWidget.toFiniteNumber(c.axisXFontOpacity, 100)),

            textFont: c.textFont,
            textSize: getNum(c.textSize, M.defaultGraphTextSize != null ? M.defaultGraphTextSize : 14),
            textColor: c.textColor,
            textFontBold: c.textFontBold,

            showPointValues: c.showPointValues !== undefined && c.showPointValues !== null ? c.showPointValues : (c.defaultGraphShowPointValues !== undefined ? c.defaultGraphShowPointValues : false),
            pointValuesHoverOnly: hoverOnly,
            pointValuesDistribution: c.pointValuesDistribution || (c.defaultGraphPointValuesDistribution || 'timeHighLow'),
            autoPointValuesInterval: c.autoPointValuesInterval !== undefined && c.autoPointValuesInterval !== null
                ? (c.autoPointValuesInterval === true)
                : (c.defaultGraphAutoPointValuesInterval === true),
            pointValuesTimeWidth: Math.max(1, Math.round(BaseWidget.toFiniteNumber(c.pointValuesTimeWidth !== undefined && c.pointValuesTimeWidth !== null ? c.pointValuesTimeWidth : (c.defaultGraphPointValuesTimeWidth !== undefined ? c.defaultGraphPointValuesTimeWidth : 48), 48))),
            pointValuesStep: Math.max(1, Math.round(BaseWidget.toFiniteNumber(c.pointValuesStep !== undefined && c.pointValuesStep !== null ? c.pointValuesStep : (c.defaultGraphPointValuesStep !== undefined ? c.defaultGraphPointValuesStep : 1), 1))),
            pointValuesDecimals: Math.max(0, Math.floor(BaseWidget.toFiniteNumber(c.pointValuesDecimals !== undefined && c.pointValuesDecimals !== null ? c.pointValuesDecimals : (c.defaultGraphPointValuesDecimals !== undefined ? c.defaultGraphPointValuesDecimals : 0), 0))),
            pointValuesAbbreviate: c.pointValuesAbbreviate !== undefined && c.pointValuesAbbreviate !== null ? c.pointValuesAbbreviate : (c.defaultGraphPointValuesAbbreviate !== undefined ? c.defaultGraphPointValuesAbbreviate : true),

            pointValFont: c.pointValFont,
            pointValFs: getNum(c.pointValFs, M.defaultGraphPointValFs != null ? M.defaultGraphPointValFs : 10),
            pointValCol: c.pointValCol,
            pointValBold: c.pointValBold,
            pointValItalic: c.pointValItalic,
            pointValAlign: c.pointValAlign,
            pointValCase: c.pointValCase,
            pointValOpacity: getNum(c.pointValOpacity, 100),
            pointValOffX: getNum(c.pointValOffX, M.defaultGraphPointValOffX != null ? M.defaultGraphPointValOffX : 6),
            pointValOffY: getNum(c.pointValOffY, M.defaultGraphPointValOffY != null ? M.defaultGraphPointValOffY : -6),

            pointValBarFont: c.pointValBarFont,
            pointValBarFs: getNum(c.pointValBarFs, M.defaultGraphPointValBarFs != null ? M.defaultGraphPointValBarFs : 10),
            pointValBarCol: c.pointValBarCol,
            pointValBarBold: c.pointValBarBold,
            pointValBarItalic: c.pointValBarItalic,
            pointValBarAlign: c.pointValBarAlign,
            pointValBarCase: c.pointValBarCase,
            pointValBarOpacity: getNum(c.pointValBarOpacity, 100),
            pointValBarOffX: getNum(c.pointValBarOffX, M.defaultGraphPointValBarOffX != null ? M.defaultGraphPointValBarOffX : 0),
            pointValBarOffY: getNum(c.pointValBarOffY, M.defaultGraphPointValBarOffY != null ? M.defaultGraphPointValBarOffY : -6),

            graphAnimation: c.graphAnimation || c.defaultGraphAnimation || 'none',
            graphAnimDuration: Math.max(0.1, BaseWidget.toFiniteNumber(c.graphAnimDuration !== undefined && c.graphAnimDuration !== null ? c.graphAnimDuration : c.defaultGraphAnimDuration, 2)),
            graphAnimStreamDuration: Math.max(0.05, BaseWidget.toFiniteNumber(c.graphAnimStreamDuration !== undefined && c.graphAnimStreamDuration !== null ? c.graphAnimStreamDuration : c.defaultGraphAnimStreamDuration, 0.6)),
            graphAnimShimmer: c.graphAnimShimmer !== undefined && c.graphAnimShimmer !== null ? c.graphAnimShimmer === true : (c.defaultGraphAnimShimmer !== false),
            graphAnimStaggerBars: c.graphAnimStaggerBars !== undefined && c.graphAnimStaggerBars !== null ? c.graphAnimStaggerBars === true : (c.defaultGraphAnimStaggerBars !== false)
        };

        delete out.typography;
        delete out.data;
        delete out.lineColor;
        delete out.fillCol;
        delete out.negFillCol;
        delete out.fillOpacity;
        delete out.lineWidth;
        delete out.fill;
        delete out.barColor;
        delete out.pointColor;
        delete out.linearTimeScale;
        delete out.graphLineCol;
        delete out.graphFillCol;
        delete out.graphNegFillColor;
        delete out.defaultGraphFill;
        delete out.defaultGraphFillOpacity;
        delete out.defaultGraphBarColor;
        delete out.defaultGraphPointColor;
        delete out.defaultGraphLinearTimeScale;
        return out;
    }

    getSchema() {
        const widgetLabelTypo = GraphWidget.buildGraphWidgetLabelTypographySchema();
        const axisXTypo = GraphWidget.buildGraphAxisXTypographySchema(false);
        const axisYTypo = GraphWidget.buildGraphAxisYTypographySchema(false);
        const dataTextTypo = GraphWidget.buildGraphDataTextTypographySchema(false);
        const pointValuesTypo = GraphWidget.buildGraphPointValuesTypographySchema(false);
        const pointValuesBarTypo = GraphWidget.buildGraphPointValuesBarTypographySchema(false);
        const legendTypo = GraphWidget.buildGraphLegendTypographySchema(false);

        const smoothOnly = function (v, isGlobal) {
            return GraphWidget.resolvedGraphType(v, isGlobal) === 'smooth';
        };
        const barOnly = function (v, isGlobal) {
            return GraphWidget.isBarType(GraphWidget.resolvedGraphType(v, isGlobal));
        };
        const lineOrBar = function (v, isGlobal) {
            const t = GraphWidget.resolvedGraphType(v, isGlobal);
            return GraphWidget.isLineLike(t) || GraphWidget.isBarType(t);
        };
        const pointsMode = function (v) {
            const m = v.bufferMode !== undefined ? v.bufferMode : (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultGraphBufferMode : 'points');
            return m !== 'duration';
        };
        const durationMode = function (v) {
            const m = v.bufferMode !== undefined ? v.bufferMode : (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultGraphBufferMode : 'points');
            return m === 'duration';
        };
        const customDuration = function (v) {
            const m = v.bufferMode !== undefined ? v.bufferMode : (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultGraphBufferMode : 'points');
            const p = v.durationPreset !== undefined ? v.durationPreset : (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultGraphDurationPreset : '24h');
            return m === 'duration' && p === 'custom';
        };

        const legendOn = function (v) {
            if (v.showLegend === true) return true;
            if (v.showLegend === false) return false;
            return typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphShowLegend === true;
        };
        const legendFloat = function (v) {
            const isResp = typeof BaseWidget !== 'undefined' && typeof BaseWidget.isResponsiveMode === 'function' && BaseWidget.isResponsiveMode();
            if (isResp) return false;
            const pos = v.legendPosition !== undefined ? v.legendPosition : (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultGraphLegendPosition : 'right');
            return legendOn(v) && pos === 'floating';
        };
        const legendManual = function (v) {
            const auto = v.legendAutoSize !== undefined ? v.legendAutoSize : (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultGraphLegendAutoSize !== false : true);
            return legendOn(v) && auto === false;
        };

        const smoothingAmountField = {
            key: 'smoothingAmount', type: 'number', label: 'Smoothing Amount', min: 0, max: 100, cols: 12,
            defaultKey: 'defaultGraphSmoothingAmount',
            dependsOn: ['type', 'defaultGraphType'],
            visibleWhen: smoothOnly
        };
        const barDirectionField = {
            key: 'barDirection', type: 'select', label: 'Bar Direction', cols: 12, defaultKey: 'defaultGraphBarDirection',
            options: [{ value: 'vertical', text: 'Vertical' }, { value: 'horizontal', text: 'Horizontal' }],
            dependsOn: ['type', 'defaultGraphType'],
            visibleWhen: barOnly
        };
        const fixedFloorField = {
            key: 'fixedFloor', type: 'number', label: 'Fixed Floor', cols: 6,
            dependsOn: ['dynamicFloor', 'defaultGraphDynamicFloor', 'autoMin', 'defaultGraphAutoMin'],
            visibleWhen: function (values) {
                if (values.dynamicFloor !== undefined) return values.dynamicFloor === false;
                if (values.autoMin !== undefined) return values.autoMin === false;
                if (typeof MASTER_SETTINGS !== 'undefined') {
                    if (MASTER_SETTINGS.defaultGraphDynamicFloor !== undefined) return MASTER_SETTINGS.defaultGraphDynamicFloor === false;
                    if (MASTER_SETTINGS.defaultGraphAutoMin !== undefined) return MASTER_SETTINGS.defaultGraphAutoMin === false;
                }
                return false;
            }
        };
        const fixedCeilingField = {
            key: 'fixedCeiling', type: 'number', label: 'Fixed Ceiling', cols: 6,
            dependsOn: ['dynamicCeiling', 'defaultGraphDynamicCeiling', 'autoMax', 'defaultGraphAutoMax'],
            visibleWhen: function (values) {
                if (values.dynamicCeiling !== undefined) return values.dynamicCeiling === false;
                if (values.autoMax !== undefined) return values.autoMax === false;
                if (typeof MASTER_SETTINGS !== 'undefined') {
                    if (MASTER_SETTINGS.defaultGraphDynamicCeiling !== undefined) return MASTER_SETTINGS.defaultGraphDynamicCeiling === false;
                    if (MASTER_SETTINGS.defaultGraphAutoMax !== undefined) return MASTER_SETTINGS.defaultGraphAutoMax === false;
                }
                return false;
            }
        };
        const baselineValField = {
            key: 'baselineVal', type: 'number', label: 'Baseline Value', cols: 6, defaultKey: 'defaultGraphBaselineVal',
            dependsOn: ['useBaseline', 'defaultGraphUseBaseline'],
            visibleWhen: function (values) {
                return values.useBaseline === true || (values.useBaseline === undefined && typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphUseBaseline === true);
            }
        };
        const negModeField = {
            key: 'negMode', type: 'select', label: 'Negative Handling', cols: 12, defaultKey: 'defaultGraphNegMode',
            options: [
                { value: 'show_neg', text: 'Show as Negative' },
                { value: 'show_pos', text: 'Show as Positive' },
                { value: 'ignore', text: 'Ignore (Hide)' }
            ],
            dependsOn: ['type', 'defaultGraphType'],
            visibleWhen: function (v, isGlobal) {
                return GraphWidget.resolvedGraphType(v, isGlobal) !== 'text';
            }
        };
        const animOn = function (values) {
            const v = values ? (values.graphAnimation !== undefined ? values.graphAnimation : values.defaultGraphAnimation) : null;
            return v != null && v !== '' && v !== 'none';
        };

        return [
            {
                id: 'gr_data', title: 'Data & Behavior', icon: 'ph-lightning', defaultExpanded: true,
                fields: [
                    {
                        key: 'series', type: 'graph_series_list', label: 'Graphs', cols: 12, noBind: true,
                        dependsOn: ['type', 'showPoints', 'defaultGraphType', 'defaultGraphPointShow']
                    },
                    { type: 'heading', label: 'Streaming Values', cols: 12 },
                    {
                        key: 'bufferMode', type: 'select', label: 'Buffer Mode', cols: 6, defaultKey: 'defaultGraphBufferMode',
                        options: [
                            { value: 'points', text: 'Point Count' },
                            { value: 'duration', text: 'Time Period' }
                        ]
                    },
                    {
                        key: 'reverseDirection', type: 'checkbox', label: 'Reverse Direction', cols: 6, defaultKey: 'defaultGraphReverseDirection'
                    },
                    {
                        key: 'maxPoints', type: 'number', label: 'Maximum Data Values', cols: 12, defaultKey: 'defaultGraphMaxPoints',
                        dependsOn: ['bufferMode', 'defaultGraphBufferMode'], visibleWhen: pointsMode
                    },
                    {
                        key: 'durationPreset', type: 'select', label: 'Time Period', cols: 12, defaultKey: 'defaultGraphDurationPreset',
                        options: GraphWidget.GRAPH_DURATION_PRESETS,
                        dependsOn: ['bufferMode', 'defaultGraphBufferMode'], visibleWhen: durationMode
                    },
                    {
                        key: 'fixedTimeWindow', type: 'checkbox', label: 'Fixed Time Period', cols: 6, defaultKey: 'defaultGraphFixedTimeWindow',
                        dependsOn: ['bufferMode', 'defaultGraphBufferMode'], visibleWhen: durationMode
                    },
                    {
                        key: 'timelineAdvance', type: 'select', label: 'Timeline Progress', cols: 6, defaultKey: 'defaultGraphTimelineAdvance',
                        options: [
                            { value: 'data', text: 'On New Value' },
                            { value: 'time', text: 'Continuous Real Time' }
                        ],
                        dependsOn: ['bufferMode', 'defaultGraphBufferMode'], visibleWhen: durationMode
                    },
                    {
                        key: 'durationCustomValue', type: 'number', min: 1, label: 'Duration', cols: 6, defaultKey: 'defaultGraphDurationCustomValue',
                        dependsOn: ['bufferMode', 'durationPreset', 'defaultGraphBufferMode', 'defaultGraphDurationPreset'], visibleWhen: customDuration
                    },
                    {
                        key: 'durationCustomUnit', type: 'select', label: 'Unit', cols: 6, defaultKey: 'defaultGraphDurationCustomUnit',
                        options: [
                            { value: 'minutes', text: 'Minutes' },
                            { value: 'hours', text: 'Hours' },
                            { value: 'days', text: 'Days' }
                        ],
                        dependsOn: ['bufferMode', 'durationPreset', 'defaultGraphBufferMode', 'defaultGraphDurationPreset'], visibleWhen: customDuration
                    },
                    {
                        key: 'lineGaps', type: 'select', label: 'Line Gaps', cols: 12, defaultKey: 'defaultGraphLineGaps',
                        options: [
                            { value: 'break', text: 'Break on Missing Time' },
                            { value: 'connect', text: 'Connect Points' }
                        ],
                        dependsOn: ['type', 'defaultGraphType'],
                        visibleWhen: function (v, isGlobal) { return GraphWidget.isLineLike(GraphWidget.resolvedGraphType(v, isGlobal)); }
                    },
                    { type: 'heading', label: 'Scale Range & Baseline', cols: 12 },
                    { key: 'dynamicFloor', type: 'checkbox', label: 'Dynamic Floor', cols: 6, defaultKey: 'defaultGraphDynamicFloor' },
                    { key: 'dynamicCeiling', type: 'checkbox', label: 'Dynamic Ceiling', cols: 6, defaultKey: 'defaultGraphDynamicCeiling' },
                    fixedFloorField,
                    fixedCeilingField,
                    { key: 'useBaseline', type: 'checkbox', label: 'Use Baseline', cols: 6, gridColStart: 1, defaultKey: 'defaultGraphUseBaseline' },
                    baselineValField,
                    negModeField
                ]
            },
            {
                id: 'gr_style', title: 'Appearance', icon: 'ph-palette',
                fields: [
                    {
                        key: 'type', type: 'select', label: 'Visual Type', cols: 12, defaultKey: 'defaultGraphType',
                        options: GraphWidget.GRAPH_TYPE_OPTIONS
                    },
                    smoothingAmountField,
                    barDirectionField,
                    {
                        key: 'barGap', type: 'number', label: 'Bar Gap', cols: 4, gridColStart: 1, defaultKey: 'defaultGraphBarGap',
                        dependsOn: ['type', 'defaultGraphType'], visibleWhen: barOnly
                    },
                    {
                        key: 'barRadius', type: 'number', label: 'Bar Radius', cols: 4, defaultKey: 'defaultGraphBarRadius',
                        dependsOn: ['type', 'defaultGraphType'], visibleWhen: barOnly
                    },
                    {
                        key: 'barOutlineWidth', type: 'number', label: 'Outline Width', cols: 4, defaultKey: 'graphBarOutlineWidth',
                        dependsOn: ['type', 'defaultGraphType'], visibleWhen: barOnly
                    },
                    { key: 'graphOffX', type: 'number', label: 'Graph Offset X', cols: 6, gridColStart: 1, defaultKey: 'defaultGraphOffX' },
                    { key: 'graphOffY', type: 'number', label: 'Graph Offset Y', cols: 6, defaultKey: 'defaultGraphOffY' },
                    { key: 'deactivatedColor', type: 'color', label: 'Deactivated Color', cols: 6, defaultKey: 'defaultDeactivatedColor', default: '@controlOff' },
                    { key: 'deactivatedColorAccent', type: 'color', label: 'Deactivated Color Accent', cols: 6, defaultKey: 'defaultDeactivatedColorAccent', default: '@textMuted' }
                ]
            },
            {
                id: 'gr_axes', title: 'Axes & Labels', icon: 'ph-ruler',
                fields: GraphWidget.buildGraphAxesAndLabelsSchemaFields(false)
            },
            {
                id: 'gr_grid', title: 'Grid Lines', icon: 'ph-grid-nine',
                fields: GraphWidget.buildGraphGridSchemaFields(false)
            },
            {
                id: 'gr_ticks', title: 'Tick Marks', icon: 'ph-hash',
                fields: GraphWidget.buildGraphTickSchemaFields(false)
            },
            {
                id: 'gr_points', title: 'Points & Point Values', icon: 'ph-dots-three-outline',
                fields: GraphWidget.buildGraphPointsAndValuesSchemaFields(false)
            },
            {
                id: 'gr_legend', title: 'Legend', icon: 'ph-list-bullets',
                fields: [
                    { key: 'showLegend', type: 'checkbox', label: 'Show Legend', cols: 6, defaultKey: 'defaultGraphShowLegend' },
                    {
                        key: 'legendPosition', type: 'select', label: 'Position', cols: 6, defaultKey: 'defaultGraphLegendPosition',
                        options: [
                            { value: 'top', text: 'Top' },
                            { value: 'bottom', text: 'Bottom' },
                            { value: 'left', text: 'Left' },
                            { value: 'right', text: 'Right' },
                            { value: 'floating', text: 'Floating' }
                        ],
                        dynamicOptions: function (values, isGlobal) {
                            return GraphWidget.getLegendPositionOptions(values, isGlobal);
                        },
                        dependsOn: ['showLegend', 'defaultGraphShowLegend'],
                        visibleWhen: legendOn
                    },
                    {
                        key: 'legendLayout', type: 'select', label: 'Layout', cols: 6, defaultKey: 'defaultGraphLegendLayout',
                        options: [{ value: 'row', text: 'Row' }, { value: 'column', text: 'Column' }],
                        dependsOn: ['showLegend', 'defaultGraphShowLegend'],
                        visibleWhen: legendOn
                    },
                    {
                        key: 'legendSwatch', type: 'select', label: 'Swatch', cols: 6, defaultKey: 'defaultGraphLegendSwatch',
                        options: [
                            { value: 'line', text: 'Line' },
                            { value: 'square', text: 'Square' },
                            { value: 'circle', text: 'Circle' }
                        ],
                        dependsOn: ['showLegend', 'defaultGraphShowLegend'],
                        visibleWhen: legendOn
                    },
                    {
                        key: 'legendShowContainer', type: 'checkbox', label: 'Show Container', cols: 6,
                        defaultKey: 'defaultGraphLegendShowContainer',
                        dependsOn: ['showLegend', 'defaultGraphShowLegend', 'bgVisible'],
                        visibleWhen: legendOn
                    },
                    {
                        key: 'legendAutoSize', type: 'checkbox', label: 'Auto Size (Fit to Content)', cols: 6,
                        defaultKey: 'defaultGraphLegendAutoSize',
                        dependsOn: ['showLegend', 'defaultGraphShowLegend'],
                        visibleWhen: legendOn
                    },
                    {
                        key: 'legendW', type: 'number', min: 40, label: 'Width', cols: 6, defaultKey: 'defaultGraphLegendWidth',
                        dependsOn: ['showLegend', 'legendAutoSize', 'defaultGraphShowLegend', 'defaultGraphLegendAutoSize'],
                        visibleWhen: legendManual
                    },
                    {
                        key: 'legendH', type: 'number', min: 24, label: 'Height', cols: 6, defaultKey: 'defaultGraphLegendHeight',
                        dependsOn: ['showLegend', 'legendAutoSize', 'defaultGraphShowLegend', 'defaultGraphLegendAutoSize'],
                        visibleWhen: legendManual
                    },
                    {
                        key: 'legendOffX', type: 'number', label: 'Offset X', cols: 6,
                        dependsOn: ['showLegend', 'legendPosition', 'defaultGraphShowLegend', 'defaultGraphLegendPosition'],
                        visibleWhen: legendFloat
                    },
                    {
                        key: 'legendOffY', type: 'number', label: 'Offset Y', cols: 6,
                        dependsOn: ['showLegend', 'legendPosition', 'defaultGraphShowLegend', 'defaultGraphLegendPosition'],
                        visibleWhen: legendFloat
                    }
                ]
            },
            {
                id: 'gr_animation', title: 'Animations & Effects', icon: 'ph-sparkle',
                fields: GraphWidget.buildGraphAnimationSchemaFields(false)
            },
            {
                id: 'gr_typography', title: 'Text & Typography', icon: 'ph-text-t',
                fields: [
                    { key: 'label', type: 'text', label: 'Widget Label', cols: 12 },
                    widgetLabelTypo,
                    axisXTypo,
                    axisYTypo,
                    dataTextTypo,
                    pointValuesTypo,
                    pointValuesBarTypo,
                    legendTypo
                ]
            }
        ];
    }
    _buildBaseDOM() {
        const b = super._buildBaseDOM();
        this._initGraphState();

        b.innerContent.classList.add('graph-inner-content');
        b.innerContent.style.display = 'flex';
        b.innerContent.style.flexDirection = 'column';

        // --- Standardized Label DOM ---
        const lbl = document.createElement('div');
        lbl.className = 'widget-label graph-widget-label';
        lbl.style.width = '100%';
        lbl.style.flexShrink = '0';
        b.innerContent.appendChild(lbl);
        this.lblEl = lbl;

        const bodyWrap = document.createElement('div');
        bodyWrap.className = 'graph-body-wrap';
        b.innerContent.appendChild(bodyWrap);
        this.bodyWrap = bodyWrap;

        const chartWrap = document.createElement('div');
        chartWrap.className = 'graph-chart-wrap';
        bodyWrap.appendChild(chartWrap);
        this.chartWrap = chartWrap;

        const canvas = document.createElement('canvas');
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', 'Graph');
        chartWrap.appendChild(canvas);
        this.canvas = canvas;
        this.ctx = canvas.getContext ? canvas.getContext('2d') : null;

        const a11y = document.createElement('span');
        a11y.className = 'ds-visually-hidden';
        a11y.setAttribute('aria-live', 'polite');
        chartWrap.appendChild(a11y);
        this._plotA11yEl = a11y;

        const hover = document.createElement('div');
        hover.className = 'graph-hover-label';
        chartWrap.appendChild(hover);
        this._hoverLabelEl = hover;

        const legend = document.createElement('div');
        legend.className = 'graph-legend';
        legend.id = 'graph-legend-' + this.id;
        legend.style.display = 'none';
        legend.style.position = 'absolute';
        legend.style.zIndex = '20';
        legend.style.padding = '0';

        const legendOffCanvasFill = document.createElement('div');
        legendOffCanvasFill.className = 'widget-off-canvas-fill';
        legendOffCanvasFill.setAttribute('aria-hidden', 'true');
        legend.appendChild(legendOffCanvasFill);

        const legendBody = document.createElement('div');
        legendBody.className = 'graph-legend-body';
        legend.appendChild(legendBody);

        const handleDirs = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
        for (let hi = 0; hi < handleDirs.length; hi++) {
            const handle = document.createElement('div');
            handle.className = 'resize-handle rh-' + handleDirs[hi] + ' graph-legend-rh';
            handle.setAttribute('data-dir', handleDirs[hi]);
            legend.appendChild(handle);
        }
        this.legendEl = legend;
        this.legendBody = legendBody;
        this.legendHandles = legend.querySelectorAll('.graph-legend-rh');
        this.e = { canvas: canvas, ctx: this.ctx, legend: legend };
        this._bindLegendPointer();
        this._needsPageRevealAnimation = true;

        this._boundGraphMouseMove = this._handleGraphMouseMove.bind(this);
        this._boundGraphMouseLeave = this._handleGraphMouseLeave.bind(this);
        canvas.addEventListener('mousemove', this._boundGraphMouseMove);
        canvas.addEventListener('mouseleave', this._boundGraphMouseLeave);

        b.container.classList.add('interactive', 'graph-widget-container');

        this._ensurePlotResizeObserver();

        return b;
    }

    /**
     * Hook for `WidgetAnimations.previewOnce(widget, slot)` when the user clicks
     * either Preview button or changes the Animation dropdown in the inspector.
     */
    getAnimationSlot(slot) {
        if (slot === 'graph' || slot === 'graph_stream') {
            const self = this;
            return {
                customPreview: true,
                preview: function () {
                    self.previewGraphAnimation(slot === 'graph_stream' ? 'stream' : 'full');
                }
            };
        }
        return null;
    }

    /**
     * Triggers an interactive preview of either the full-graph reveal/morph or
     * a simulated streaming point directly on the canvas.
     */
    previewGraphAnimation(mode) {
        const c = this.config;
        this._plotView = c;
        this._needsPageRevealAnimation = false;
        this._syncSeriesSeeds(c);
        const animMode = c.graphAnimation && c.graphAnimation !== 'none' ? c.graphAnimation : 'morph';
        const list = c.series || [];
        const settings = this._bufferSettings(c);

        for (let i = 0; i < list.length; i++) {
            const spec = list[i];
            if (!spec || !this._seriesDrawn(spec)) continue;
            const state = this._ensureSeriesState(spec.id);
            const curBuf = state.buffer && state.buffer.length ? state.buffer.slice() : [];

            if (mode === 'stream') {
                // Preview buffers stay local. Writing them onto state.buffer
                // would replace a short or topic-bound series until the next payload.
                let prevBuf = curBuf;
                if (prevBuf.length < 2) {
                    const baseNow = Date.now();
                    prevBuf = [
                        { v: 25, t: baseNow - 4000, l: null, seq: 0 },
                        { v: 55, t: baseNow - 3000, l: null, seq: 1 },
                        { v: 40, t: baseNow - 2000, l: null, seq: 2 },
                        { v: 75, t: baseNow - 1000, l: null, seq: 3 }
                    ];
                }
                let minV = Infinity;
                let maxV = -Infinity;
                let nextSeq = prevBuf.length;
                for (let p = 0; p < prevBuf.length; p++) {
                    const sample = prevBuf[p];
                    const val = sample && sample.v;
                    if (val != null && isFinite(val)) {
                        if (val < minV) minV = val;
                        if (val > maxV) maxV = val;
                    }
                    if (sample && sample.seq != null && isFinite(sample.seq) && sample.seq + 1 > nextSeq) {
                        nextSeq = sample.seq + 1;
                    }
                }
                if (!isFinite(minV) || !isFinite(maxV)) { minV = 10; maxV = 90; }
                const span = (maxV - minV) || 40;
                const lastV = prevBuf.length > 0 && prevBuf[prevBuf.length - 1].v != null ? prevBuf[prevBuf.length - 1].v : 50;
                const delta = (Math.random() - 0.45) * span * 0.65;
                let nextV = Math.round((lastV + delta) * 10) / 10;
                if (minV >= 0 && nextV < 0) nextV = Math.abs(nextV);
                const newPt = { v: nextV, t: Date.now(), l: null, seq: nextSeq };
                const unpruned = prevBuf.concat([newPt]);
                const nextBuf = this._pruneBuffer(unpruned, settings, 'stream');
                const droppedCount = Math.max(0, unpruned.length - nextBuf.length);
                const droppedPts = droppedCount > 0 ? prevBuf.slice(0, droppedCount) : [];
                const durMs = Math.max(120, Math.round((c.graphAnimStreamDuration || 0.6) * 1000));
                this._startSeriesAnimation(spec.id, animMode, 'stream', prevBuf, nextBuf, durMs, droppedPts);
            } else {
                const durMs = Math.max(150, Math.round((c.graphAnimDuration || 2) * 1000));
                if (this._previewToggleMorph === undefined) this._previewToggleMorph = false;
                const isMorph = (animMode === 'morph') && this._previewToggleMorph;
                if (!isMorph || !curBuf.length) {
                    this._startSeriesAnimation(spec.id, 'draw', 'snapshot', [], curBuf, durMs, []);
                } else {
                    const synthFrom = [];
                    for (let p = 0; p < curBuf.length; p++) {
                        const pt = curBuf[p];
                        const v = pt && pt.v != null && isFinite(pt.v) ? pt.v : 0;
                        const wave = Math.sin(p * 0.9 + (Date.now() % 1000) * 0.006) * 0.35;
                        synthFrom.push({
                            v: v * (0.65 + wave),
                            t: pt ? pt.t : null,
                            l: pt ? pt.l : null,
                            seq: pt && pt.seq != null ? pt.seq : p
                        });
                    }
                    this._startSeriesAnimation(spec.id, 'morph', 'snapshot', synthFrom, curBuf, durMs, []);
                }
            }
        }
        if (mode !== 'stream') {
            this._previewToggleMorph = !this._previewToggleMorph;
        }
    }

    /**
     * Drawable chart box in CSS pixels. Prefers the live chartWrap size so editor
     * resize, Responsive Columns, and scale layout all rebuild the plot. Falls back
     * to config width/height when the wrap has not been laid out yet (0x0).
     */
    _measurePlotBox() {
        const wrap = this.chartWrap;
        if (wrap) {
            const w = wrap.clientWidth;
            const h = wrap.clientHeight;
            if (w >= 10 && h >= 10) {
                if (!this._measuredPlotBox) this._measuredPlotBox = { w: 0, h: 0 };
                this._measuredPlotBox.w = w;
                this._measuredPlotBox.h = h;
                return this._measuredPlotBox;
            }
        }
        const c = this.config || {};
        const pad = (c.padding !== undefined && c.padding !== null ? c.padding : 0) * 2;
        const labelHeight = c.label ? ((c.labelFs || 14) + 8) : 0;
        const cw = c.width !== undefined && c.width !== null ? c.width : 0;
        const ch = c.height !== undefined && c.height !== null ? c.height : 0;
        let availW = cw - pad;
        let availH = (ch - pad) - labelHeight;
        const isResp = typeof BaseWidget !== 'undefined'
            && (typeof BaseWidget.usesResponsiveGridLayout === 'function'
                ? BaseWidget.usesResponsiveGridLayout(this)
                : (BaseWidget.isResponsiveMode && BaseWidget.isResponsiveMode()));
        if (isResp && c.showLegend && !c.legendAutoSize) {
            const pos = c.legendPosition || 'right';
            if (pos === 'left' || pos === 'right') {
                availW -= ((c.legendW > 0 ? c.legendW : 160) + 8);
            }
        }
        return {
            w: Math.max(10, availW),
            h: Math.max(10, availH)
        };
    }

    /**
     * Auto Cell Height, and Fixed with Cell Height 0: the plot has no content
     * height. Measuring the canvas reads its bitmap and the cell grows without
     * a bound. Use half the column width, and never less than Min Widget Height.
     * An explicit Fixed height above 0 skips this.
     */
    measureResponsiveIntrinsicHeight() {
        let h = BaseWidget.responsiveAspectCellHeight(this, 0.5);
        const legend = this.legendEl;
        if (legend && legend.dataset.stacked === '1') {
            const pos = legend.dataset.position || 'right';
            if (pos === 'top' || pos === 'bottom') {
                const extra = legend.offsetHeight || 0;
                if (extra > 0) h += extra + 8;
            }
        }
        return h;
    }

    _ensurePlotResizeObserver() {
        if (this._plotResizeObserver || typeof ResizeObserver === 'undefined') return;
        const wrap = this.chartWrap;
        if (!wrap) return;
        const self = this;
        this._plotResizeObserver = new ResizeObserver(function () {
            self._schedulePlotResizeRender();
        });
        this._plotResizeObserver.observe(wrap);
    }

    _schedulePlotResizeRender() {
        if (!this._graphIsOnPage()) return;
        if (this._plotResizeRaf != null) return;
        const self = this;
        const run = function () {
            self._plotResizeRaf = null;
            if (!self._graphIsOnPage()) return;
            self._renderSpecific();
        };
        if (typeof requestAnimationFrame === 'function') {
            this._plotResizeRaf = requestAnimationFrame(run);
        } else {
            run();
        }
    }

    _schedulePlotDraw() {
        if (!this._graphIsOnPage()) return;
        const wrap = this.elements && this.elements.wrapper;
        if (wrap && wrap.style.display === 'none') return;
        if (this._plotPaintRaf != null || this._animRaf != null) return;
        const self = this;
        const run = function () {
            self._plotPaintRaf = null;
            if (!self._graphIsOnPage()) return;
            const host = self.elements && self.elements.wrapper;
            if (host && host.style.display === 'none') return;
            if (self._plotView) {
                self._renderPlotOnly();
            } else {
                self._renderSpecific();
            }
        };
        if (typeof requestAnimationFrame === 'function') {
            this._plotPaintRaf = requestAnimationFrame(run);
        } else {
            run();
        }
    }

    _teardownPlotResizeObserver() {
        if (this._plotResizeObserver) {
            this._plotResizeObserver.disconnect();
            this._plotResizeObserver = null;
        }
        if (this._plotResizeRaf != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._plotResizeRaf);
        }
        this._plotResizeRaf = null;
        if (this._plotPaintRaf != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._plotPaintRaf);
        }
        this._plotPaintRaf = null;
        if (this._animRaf != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._animRaf);
        }
        this._animRaf = null;
        this._activeAnimations = {};
    }

    onRemove() {
        this._pendingAnimationUpdates = {};
        this._clearTimelineTimer();
        this._teardownPlotResizeObserver();
        if (this._animRaf != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._animRaf);
        }
        this._animRaf = null;
        this._activeAnimations = {};
        this._lastPlacedPointValues = null;
        this._boundAnimTick = null;
        this._boundTimelineTick = null;
        this._boundTimelineTimer = null;
        this._scaleState = null;
        this._cachedPlotLayout = null;
        if (this._legendPointerBinding && typeof this._legendPointerBinding.destroy === 'function') {
            this._legendPointerBinding.destroy();
            this._legendPointerBinding = null;
        }
        if (this.legendEl && this.legendEl.parentNode) this.legendEl.parentNode.removeChild(this.legendEl);
        this.legendEl = null;
        this.legendBody = null;
        this.legendHandles = null;
        if (this.e && this.e.canvas) {
            if (this._boundGraphMouseMove) this.e.canvas.removeEventListener('mousemove', this._boundGraphMouseMove);
            if (this._boundGraphMouseLeave) this.e.canvas.removeEventListener('mouseleave', this._boundGraphMouseLeave);
            this.e.canvas.width = 0;
            this.e.canvas.height = 0;
        }
        this.canvas = null;
        this.ctx = null;
        this.chartWrap = null;
        this.bodyWrap = null;
        this.lblEl = null;
        this._plotA11yEl = null;
        this._hoverLabelEl = null;
        this.e = null;
        this._boundGraphMouseMove = null;
        this._boundGraphMouseLeave = null;
        this.renderedPoints = null;
        this._seriesState = {};
        this._plotView = null;
        super.onRemove();
    }

    /**
     * A saved width or height means the user sized the panel, so auto size stays off
     * until they turn it on. A legend with neither dimension still fits its content.
     */
    static ensureLegendAutoSize(overrides) {
        if (!overrides || Object.prototype.hasOwnProperty.call(overrides, 'legendAutoSize')) return;
        if (Object.prototype.hasOwnProperty.call(overrides, 'legendW') || Object.prototype.hasOwnProperty.call(overrides, 'legendH')) {
            overrides.legendAutoSize = false;
        }
    }

    static legendAutoSizeFrom(widget, c) {
        if (c && (c.legendAutoSize === true || c.legendAutoSize === false)) return c.legendAutoSize === true;
        if (c && c.defaultGraphLegendAutoSize === false) return false;
        const ov = widget && widget.overrides;
        if (ov && (Object.prototype.hasOwnProperty.call(ov, 'legendW') || Object.prototype.hasOwnProperty.call(ov, 'legendH'))) {
            return false;
        }
        return true;
    }

    static shiftFloatingLegend(overrides, dx, dy) {
        if (!overrides || (!dx && !dy)) return;
        const pos = overrides.legendPosition
            || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultGraphLegendPosition : 'right');
        if (pos !== 'floating') return;
        if (overrides.legendOffX != null && overrides.legendOffX !== '') {
            overrides.legendOffX = Number(overrides.legendOffX) + dx;
        }
        if (overrides.legendOffY != null && overrides.legendOffY !== '') {
            overrides.legendOffY = Number(overrides.legendOffY) + dy;
        }
    }

    _noteLegendAnchor() {
        const o = this.overrides;
        if (!o) return;
        const x = Number(o.x);
        const y = Number(o.y);
        if (isFinite(x)) this._legendAnchorX = x;
        if (isFinite(y)) this._legendAnchorY = y;
    }

    _shiftFloatingLegendForContainerMove() {
        const o = this.overrides;
        if (!o) return;
        const x = Number(o.x);
        const y = Number(o.y);
        if (!isFinite(x) || !isFinite(y)) return;
        const prevX = this._legendAnchorX;
        const prevY = this._legendAnchorY;
        if (prevX == null || prevY == null || !isFinite(prevX) || !isFinite(prevY)) {
            this._noteLegendAnchor();
            return;
        }
        const dx = x - prevX;
        const dy = y - prevY;
        this._noteLegendAnchor();
        if (!dx && !dy) return;
        const pos = o.legendPosition
            || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultGraphLegendPosition : 'right');
        if (pos !== 'floating') return;
        if (o.legendOffX != null && o.legendOffX !== '') o.legendOffX = Number(o.legendOffX) + dx;
        else o.legendOffX = x + (Number(o.width) || 0) + 8;
        if (o.legendOffY != null && o.legendOffY !== '') o.legendOffY = Number(o.legendOffY) + dy;
        else o.legendOffY = y;
    }

    update(payload, replace) {
        if (payload && this.overrides && payload.legendOffX === undefined && payload.legendOffY === undefined) {
            let dx = 0;
            let dy = 0;
            if (payload.x !== undefined && this.overrides.x !== undefined && payload.x !== this.overrides.x) {
                dx = payload.x - this.overrides.x;
            }
            if (payload.y !== undefined && this.overrides.y !== undefined && payload.y !== this.overrides.y) {
                dy = payload.y - this.overrides.y;
            }
            if (dx !== 0 || dy !== 0) {
                const pos = (this.overrides.legendPosition)
                    || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultGraphLegendPosition : 'right');
                const shown = (this.overrides.showLegend !== undefined && this.overrides.showLegend !== null)
                    ? this.overrides.showLegend === true
                    : (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.defaultGraphShowLegend === true);
                const stacked = typeof BaseWidget !== 'undefined' && BaseWidget.isResponsiveMode && BaseWidget.isResponsiveMode();
                if (shown && pos === 'floating' && !stacked) {
                    if (this.overrides.legendOffX != null) payload.legendOffX = Number(this.overrides.legendOffX) + dx;
                    if (this.overrides.legendOffY != null) payload.legendOffY = Number(this.overrides.legendOffY) + dy;
                }
            }
        }
        super.update(payload, replace === true);
        this._noteLegendAnchor();
    }

    updatePositionSize() {
        this._shiftFloatingLegendForContainerMove();
        BaseWidget.prototype.updatePositionSize.call(this);
        if (this.legendEl && this.legendEl.style.display !== 'none' && this.legendEl.dataset.stacked !== '1') {
            const o = this.overrides || {};
            const pos = o.legendPosition
                || (typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS.defaultGraphLegendPosition : 'right');
            if (pos !== 'floating' && !this._legendDragging) {
                const c = this._plotView || this.config;
                const auto = c && c.legendAutoSize === true;
                this._placeLegendPanel(c, this.legendEl, auto);
                this._noteLegendAnchor();
            }
        }
    }

    _seriesDataTopic(index) {
        const b = this.bindings;
        if (!b) return '';
        if (Array.isArray(b.series) && b.series[index] && typeof b.series[index].data === 'string') {
            return b.series[index].data.trim();
        }
        if (index === 0 && typeof b.data === 'string') {
            return b.data.trim();
        }
        return '';
    }

    _liveValueForTopic(topic) {
        if (!topic || typeof Dashboard === 'undefined' || !Dashboard.liveData) return undefined;
        if (Object.prototype.hasOwnProperty.call(Dashboard.liveData, topic)) return Dashboard.liveData[topic];
        if (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function') {
            const alias = HomeyTopicAlias.aliasOf(topic);
            if (alias && Object.prototype.hasOwnProperty.call(Dashboard.liveData, alias)) return Dashboard.liveData[alias];
        }
        return undefined;
    }

    syncPageCoverageChrome(onPage) {
        const legend = this.legendEl;
        const stacked = legend && legend.dataset.stacked === '1';
        if (legend && !stacked) {
            if (!onPage) {
                if (legend.style.display !== 'none') {
                    this._legendPageDisplay = legend.style.display;
                }
                this._legendHiddenForPage = true;
                legend.style.display = 'none';
            } else {
                if (!this._graphIsOnPage()) {
                    legend.style.display = 'none';
                    this._legendHiddenForPage = true;
                    return;
                }
                if (this._legendHiddenForPage) {
                    const c = this._plotView || this.config;
                    if (c && c.showLegend && c.legendPosition !== 'hidden') {
                        legend.style.display = (this._legendPageDisplay && this._legendPageDisplay !== 'none') ? this._legendPageDisplay : '';
                        this._legendHiddenForPage = false;
                        this._placeLegendPanel(c, legend, c.legendAutoSize === true);
                    }
                }
            }
        }
        if (!onPage) {
            this._pausedInBackground = true;
            this._clearTimelineTimer();
        }
    }


    _hasMatchingPlacedLabel(list, oldLbl) {
        if (!list || !oldLbl) return false;
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if (item && item.val === oldLbl.val && Math.abs(item.x - oldLbl.x) < 2 && Math.abs(item.y - oldLbl.y) < 2) {
                return true;
            }
        }
        return false;
    }

    _isLabelUnchanged(prevList, val, x, y) {
        if (!prevList) return false;
        for (let i = 0; i < prevList.length; i++) {
            const item = prevList[i];
            if (item && item.val === val && Math.abs(item.x - x) < 2 && Math.abs(item.y - y) < 2) {
                return true;
            }
        }
        return false;
    }

    _parseDataInput(input) {
        if (typeof input === 'number') return { type: 'single', value: input };
        if (typeof input === 'string' && !input.includes(',') && input.trim() !== '' && !isNaN(Number(input.trim()))) {
            return { type: 'single', value: Number(input.trim()) };
        }

        let rawValues = [];
        try {
            let cleanData = input;
            if (typeof cleanData === 'string') {
                cleanData = cleanData.trim();
                if (cleanData.startsWith('{') || cleanData.startsWith('[')) {
                    let parsed = null;
                    try {
                        parsed = JSON.parse(cleanData);
                    } catch (e) {
                        try {
                            parsed = JSON.parse(cleanData.replace(/'/g, '"'));
                        } catch (e2) {
                            console.warn("Graph JSON loose parse failed");
                        }
                    }

                    if (parsed) {
                        rawValues = GraphWidget._extractSeriesItems(parsed);
                    } else {
                        const stripped = cleanData.replace(/^[\{\[]|[\]\}]$/g, '');
                        rawValues = stripped.split(',').map(v => v.trim());
                    }
                } else {
                    rawValues = cleanData.split(',').map(v => v.trim());
                }
            } else if (typeof cleanData === 'object' && cleanData !== null) {
                rawValues = GraphWidget._extractSeriesItems(cleanData);
            }
        } catch (e) {
            console.warn("Graph data parse error", e);
            return { type: 'error' };
        }

        return { type: 'multi', values: rawValues };
    }


    _resolvePlotColor(color, opacityPct) {
        let raw = color;
        if (raw && typeof raw === 'object' && typeof ColorUtils !== 'undefined' && ColorUtils.parse && ColorUtils.toCss) {
            const parsed = ColorUtils.parse(raw);
            if (parsed) raw = ColorUtils.toCss(parsed);
        }
        const resolved = BaseWidget.resolveCssColor(raw);
        let css = '#000000';
        if (typeof resolved === 'string' && resolved !== '') css = resolved;
        else if (typeof raw === 'string' && raw !== '') css = raw;
        let out = css;
        if (!(opacityPct === undefined || opacityPct === null || opacityPct === 100)) {
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.hexToRgba === 'function') {
                out = Dashboard.hexToRgba(css, opacityPct / 100);
            }
        }
        if (!out || String(out).charAt(0) === '@') return 'transparent';
        return out;
    }

    _setCanvasFont(ctx, size, family, bold, italic) {
        const style = italic ? 'italic ' : '';
        const weight = bold ? '700' : '400';
        ctx.font = style + weight + ' ' + (size || 10) + 'px ' + (family || 'sans-serif');
    }

    _formatTimeScaleTick(ms, c, sampleTs) {
        if (!c.timezoneConvert && typeof sampleTs === 'string' && sampleTs.charAt(sampleTs.length - 1) === 'Z') {
            return this._formatTimestamp(new Date(ms).toISOString(), c);
        }
        return this._formatTimestamp(ms, c);
    }

    _timeScaleLabelCount(c, plotW, sampleWidth) {
        if (c.autoAxisResX === true) {
            const gap = Math.max(4, (c.axisXFontSize || 10) * 0.35);
            const need = Math.max(1, sampleWidth + gap);
            const count = Math.floor((Math.max(1, plotW) + gap) / need);
            return Math.max(2, count);
        }
        const steps = Math.max(1, Math.floor(Number(c.axisResX) || 1));
        return steps + 1;
    }

    _getNeatTimeCandidateSteps(timeFormat) {
        const fmt = timeFormat || 'HH:mm';
        if (fmt === 'HH' || fmt === 'DateHours') {
            return [
                { unit: 'hour', step: 1, ms: 3600000 },
                { unit: 'hour', step: 2, ms: 7200000 },
                { unit: 'hour', step: 3, ms: 10800000 },
                { unit: 'hour', step: 4, ms: 14400000 },
                { unit: 'hour', step: 6, ms: 21600000 },
                { unit: 'hour', step: 8, ms: 28800000 },
                { unit: 'hour', step: 12, ms: 43200000 },
                { unit: 'day', step: 1, ms: 86400000 },
                { unit: 'day', step: 2, ms: 172800000 },
                { unit: 'day', step: 3, ms: 259200000 },
                { unit: 'day', step: 7, ms: 604800000 },
                { unit: 'day', step: 14, ms: 1209600000 },
                { unit: 'month', step: 1, ms: 2592000000 },
                { unit: 'month', step: 3, ms: 7776000000 },
                { unit: 'month', step: 6, ms: 15552000000 },
                { unit: 'year', step: 1, ms: 31536000000 }
            ];
        }
        if (fmt === 'Date') {
            return [
                { unit: 'day', step: 1, ms: 86400000 },
                { unit: 'day', step: 2, ms: 172800000 },
                { unit: 'day', step: 3, ms: 259200000 },
                { unit: 'day', step: 5, ms: 432000000 },
                { unit: 'day', step: 7, ms: 604800000 },
                { unit: 'day', step: 14, ms: 1209600000 },
                { unit: 'month', step: 1, ms: 2592000000 },
                { unit: 'month', step: 2, ms: 5184000000 },
                { unit: 'month', step: 3, ms: 7776000000 },
                { unit: 'month', step: 6, ms: 15552000000 },
                { unit: 'year', step: 1, ms: 31536000000 }
            ];
        }
        if (fmt === 'HH:mm:ss') {
            return [
                { unit: 'second', step: 1, ms: 1000 },
                { unit: 'second', step: 2, ms: 2000 },
                { unit: 'second', step: 5, ms: 5000 },
                { unit: 'second', step: 10, ms: 10000 },
                { unit: 'second', step: 15, ms: 15000 },
                { unit: 'second', step: 20, ms: 20000 },
                { unit: 'second', step: 30, ms: 30000 },
                { unit: 'minute', step: 1, ms: 60000 },
                { unit: 'minute', step: 2, ms: 120000 },
                { unit: 'minute', step: 5, ms: 300000 },
                { unit: 'minute', step: 10, ms: 600000 },
                { unit: 'minute', step: 15, ms: 900000 },
                { unit: 'minute', step: 20, ms: 1200000 },
                { unit: 'minute', step: 30, ms: 1800000 },
                { unit: 'hour', step: 1, ms: 3600000 },
                { unit: 'hour', step: 2, ms: 7200000 },
                { unit: 'hour', step: 3, ms: 10800000 },
                { unit: 'hour', step: 4, ms: 14400000 },
                { unit: 'hour', step: 6, ms: 21600000 },
                { unit: 'hour', step: 12, ms: 43200000 },
                { unit: 'day', step: 1, ms: 86400000 }
            ];
        }
        return [
            { unit: 'minute', step: 1, ms: 60000 },
            { unit: 'minute', step: 2, ms: 120000 },
            { unit: 'minute', step: 5, ms: 300000 },
            { unit: 'minute', step: 10, ms: 600000 },
            { unit: 'minute', step: 15, ms: 900000 },
            { unit: 'minute', step: 20, ms: 1200000 },
            { unit: 'minute', step: 30, ms: 1800000 },
            { unit: 'hour', step: 1, ms: 3600000 },
            { unit: 'hour', step: 2, ms: 7200000 },
            { unit: 'hour', step: 3, ms: 10800000 },
            { unit: 'hour', step: 4, ms: 14400000 },
            { unit: 'hour', step: 6, ms: 21600000 },
            { unit: 'hour', step: 8, ms: 28800000 },
            { unit: 'hour', step: 12, ms: 43200000 },
            { unit: 'day', step: 1, ms: 86400000 },
            { unit: 'day', step: 2, ms: 172800000 },
            { unit: 'day', step: 7, ms: 604800000 },
            { unit: 'month', step: 1, ms: 2592000000 },
            { unit: 'year', step: 1, ms: 31536000000 }
        ];
    }

    _findNextNeatTimestamp(t, unit, step) {
        const d = new Date(t);
        if (unit === 'second') {
            d.setMilliseconds(0);
            const s = d.getSeconds();
            const rem = s % step;
            if (rem !== 0) d.setSeconds(s + (step - rem));
            if (d.getTime() < t) d.setSeconds(d.getSeconds() + step);
            return d.getTime();
        }
        if (unit === 'minute') {
            d.setSeconds(0, 0);
            const m = d.getMinutes();
            const rem = m % step;
            if (rem !== 0) d.setMinutes(m + (step - rem));
            if (d.getTime() < t) d.setMinutes(d.getMinutes() + step);
            return d.getTime();
        }
        if (unit === 'hour') {
            d.setMinutes(0, 0, 0);
            const h = d.getHours();
            const rem = h % step;
            if (rem !== 0) d.setHours(h + (step - rem));
            if (d.getTime() < t) d.setHours(d.getHours() + step);
            return d.getTime();
        }
        if (unit === 'day') {
            d.setHours(0, 0, 0, 0);
            if (step === 1) {
                if (d.getTime() < t) d.setDate(d.getDate() + 1);
            } else if (step === 7) {
                const dayOfWeek = (d.getDay() + 6) % 7;
                if (dayOfWeek !== 0) d.setDate(d.getDate() + (7 - dayOfWeek));
                if (d.getTime() < t) d.setDate(d.getDate() + 7);
            } else {
                const day = d.getDate();
                const rem = (day - 1) % step;
                if (rem !== 0) d.setDate(day + (step - rem));
                if (d.getTime() < t) d.setDate(d.getDate() + step);
            }
            return d.getTime();
        }
        if (unit === 'month') {
            d.setHours(0, 0, 0, 0);
            d.setDate(1);
            const m = d.getMonth();
            const rem = m % step;
            if (rem !== 0) d.setMonth(m + (step - rem));
            if (d.getTime() < t) d.setMonth(d.getMonth() + step);
            return d.getTime();
        }
        d.setHours(0, 0, 0, 0);
        d.setMonth(0, 1);
        if (d.getTime() < t) d.setFullYear(d.getFullYear() + step);
        return d.getTime();
    }

    _advanceNeatTimestamp(date, unit, step) {
        if (unit === 'second') {
            date.setSeconds(date.getSeconds() + step);
        } else if (unit === 'minute') {
            date.setMinutes(date.getMinutes() + step);
        } else if (unit === 'hour') {
            date.setHours(date.getHours() + step);
        } else if (unit === 'day') {
            date.setDate(date.getDate() + step);
        } else if (unit === 'month') {
            date.setMonth(date.getMonth() + step);
        } else if (unit === 'year') {
            date.setFullYear(date.getFullYear() + step);
        }
    }

    _buildTimeScaleTicks(domain, labelCount, c, alongPx, sampleFoot) {
        if (!domain || !isFinite(domain.t0) || !isFinite(domain.t1)) return [];
        const t0 = domain.t0;
        const t1 = domain.t1;
        const span = t1 - t0;
        if (span <= 0) {
            return [{
                frac: 0.5,
                ms: t0,
                text: this._formatTimeScaleTick(t0, c, domain.sample)
            }];
        }

        const candidates = this._getNeatTimeCandidateSteps(c.timeFormat);
        let chosenStep = candidates[0];

        if (c.autoAxisResX === true) {
            const px = Math.max(1, alongPx || 400);
            const foot = Math.max(8, sampleFoot || 24);
            const gap = Math.max(6, (c.axisXFontSize || 10) * 0.5);
            const minDistPx = foot + gap;
            for (let i = 0; i < candidates.length; i++) {
                const cand = candidates[i];
                const distPx = (cand.ms / span) * px;
                if (distPx >= minDistPx) {
                    chosenStep = cand;
                    break;
                }
                chosenStep = cand;
            }
        } else {
            const manualVal = Math.max(1, Math.floor(Number(c.axisResX) || 1));
            const fmt = c.timeFormat || 'HH:mm';
            if (fmt === 'HH' || fmt === 'DateHours') {
                chosenStep = { unit: 'hour', step: manualVal, ms: manualVal * 3600000 };
            } else if (fmt === 'Date') {
                chosenStep = { unit: 'day', step: manualVal, ms: manualVal * 86400000 };
            } else if (fmt === 'HH:mm:ss') {
                chosenStep = { unit: 'second', step: manualVal, ms: manualVal * 1000 };
            } else {
                chosenStep = { unit: 'minute', step: manualVal, ms: manualVal * 60000 };
            }
        }

        let curMs = this._findNextNeatTimestamp(t0, chosenStep.unit, chosenStep.step);
        const curDate = new Date(curMs);
        const ticks = [];
        let prevText = null;

        while (curMs <= t1 + 1e-4) {
            const frac = Math.max(0, Math.min(1, (curMs - t0) / span));
            const text = this._formatTimeScaleTick(curMs, c, domain.sample);
            if (text !== '' && text !== prevText) {
                ticks.push({
                    frac: frac,
                    ms: curMs,
                    text: text
                });
                prevText = text;
            }
            this._advanceNeatTimestamp(curDate, chosenStep.unit, chosenStep.step);
            curMs = curDate.getTime();
        }

        if (ticks.length === 0) {
            const midMs = Math.round(t0 + span / 2);
            ticks.push({
                frac: 0.5,
                ms: midMs,
                text: this._formatTimeScaleTick(midMs, c, domain.sample)
            });
        }

        return ticks;
    }


    _preparePlotCanvas(availW, availH, originX, originY) {
        const canvas = this.canvas;
        const ctx = this.ctx;
        if (!canvas || !ctx) return null;
        const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
        const w = Math.max(1, Math.round(availW));
        const h = Math.max(1, Math.round(availH));
        if (this._canvasCssW !== w || this._canvasCssH !== h || this._canvasDpr !== dpr) {
            this._canvasCssW = w;
            this._canvasCssH = h;
            this._canvasDpr = dpr;
            canvas.width = Math.max(1, Math.round(w * dpr));
            canvas.height = Math.max(1, Math.round(h * dpr));
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
        }
        const ox = originX > 0 ? originX : 0;
        const oy = originY > 0 ? originY : 0;
        this._plotCanvasOriginX = ox;
        this._plotCanvasOriginY = oy;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        if (ox || oy) ctx.translate(ox, oy);
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        return ctx;
    }

    _drawCanvasLine(ctx, x1, y1, x2, y2, color, width, opacity) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = this._resolvePlotColor(color, opacity);
        ctx.lineWidth = width || 1;
        ctx.stroke();
    }

    _traceMonotonePath(ctx, pts) {
        if (!pts || pts.length < 2) return;
        if (pts.length === 2) {
            ctx.moveTo(pts[0].x, pts[0].y);
            ctx.lineTo(pts[1].x, pts[1].y);
            return;
        }
        const n = pts.length;
        const xs = new Array(n);
        const ys = new Array(n);
        const deltas = new Array(n - 1);
        const m = new Array(n);
        for (let i = 0; i < n; i++) {
            xs[i] = pts[i].x;
            ys[i] = pts[i].y;
        }
        for (let i = 0; i < n - 1; i++) {
            const dx = xs[i + 1] - xs[i];
            deltas[i] = Math.abs(dx) < 1e-12 ? 0 : (ys[i + 1] - ys[i]) / dx;
        }
        m[0] = deltas[0];
        m[n - 1] = deltas[n - 2];
        for (let i = 1; i < n - 1; i++) {
            if (deltas[i - 1] * deltas[i] <= 0) m[i] = 0;
            else m[i] = (deltas[i - 1] + deltas[i]) / 2;
        }
        for (let i = 0; i < n - 1; i++) {
            if (Math.abs(deltas[i]) < 1e-12) {
                m[i] = 0;
                m[i + 1] = 0;
            } else {
                const alpha = m[i] / deltas[i];
                const beta = m[i + 1] / deltas[i];
                const s = alpha * alpha + beta * beta;
                if (s > 9) {
                    const t = 3 / Math.sqrt(s);
                    m[i] = t * alpha * deltas[i];
                    m[i + 1] = t * beta * deltas[i];
                }
            }
        }
        ctx.moveTo(xs[0], ys[0]);
        for (let i = 0; i < n - 1; i++) {
            const dx = xs[i + 1] - xs[i];
            ctx.bezierCurveTo(
                xs[i] + dx / 3,
                ys[i] + m[i] * dx / 3,
                xs[i + 1] - dx / 3,
                ys[i + 1] - m[i + 1] * dx / 3,
                xs[i + 1],
                ys[i + 1]
            );
        }
    }

    _traceCurvePath(ctx, pts, type, horizontal) {
        if (!pts || pts.length === 0) return;
        if (pts.length === 1) {
            ctx.moveTo(pts[0].x, pts[0].y);
            return;
        }
        if (type === 'smooth') {
            this._traceMonotonePath(ctx, pts);
            return;
        }
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            if (type === 'stepped') {
                if (horizontal) {
                    ctx.lineTo(pts[i - 1].x, pts[i].y);
                } else {
                    ctx.lineTo(pts[i].x, pts[i - 1].y);
                }
            }
            ctx.lineTo(pts[i].x, pts[i].y);
        }
    }


    _formatPointValueLabel(val, c) {
        if (val === null || val === undefined) return '';
        const textStr = this._formatPointValue(val, c.pointValuesDecimals, c.pointValuesAbbreviate);
        if (!textStr) return '';
        const isBar = c.type === 'bar';
        const textCase = isBar ? c.pointValBarCase : c.pointValCase;
        return this._applyPointValueCase(textStr, textCase);
    }

    _drawPointValueLabel(ctx, val, cx, cy, c, customColor, opacityFactor) {
        const formattedText = this._formatPointValueLabel(val, c);
        if (!formattedText) return;
        const factor = opacityFactor != null ? opacityFactor : 1;
        if (factor <= 0.01) return;
        const isBar = c.type === 'bar';
        const offX = isBar ? c.pointValBarOffX : c.pointValOffX;
        const offY = isBar ? c.pointValBarOffY : c.pointValOffY;
        const xPos = cx + offX;
        const yPos = cy + offY;
        const align = isBar ? c.pointValBarAlign : c.pointValAlign;
        let textAlign = 'left';
        if (align === 'center') textAlign = 'center';
        else if (align === 'right') textAlign = 'right';
        const opacity = isBar ? c.pointValBarOpacity : c.pointValOpacity;
        const opPct = (typeof opacity === 'number' ? opacity : 100) * factor;
        const fs = isBar ? c.pointValBarFs : c.pointValFs;
        const font = isBar ? c.pointValBarFont : c.pointValFont;
        const bold = isBar ? c.pointValBarBold : c.pointValBold;
        const italic = isBar ? c.pointValBarItalic : c.pointValItalic;
        this._setCanvasFont(ctx, fs, font, bold, italic);
        const baseCol = isBar ? c.pointValBarCol : c.pointValCol;
        const resolvedCol = (baseCol && baseCol !== '') ? baseCol : (customColor || '@accent');
        ctx.fillStyle = this._resolvePlotColor(resolvedCol, opPct);
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'middle';
        const fitted = this._shiftLabelAnchor(
            isNaN(xPos) ? 0 : xPos,
            isNaN(yPos) ? 0 : yPos,
            this._estimateGraphTextWidth(formattedText, fs, font, bold),
            Math.max(1, Number(fs) || 10) * 1.25,
            textAlign,
            'middle',
            this._plotTextLimits
        );
        ctx.fillText(formattedText, fitted.x, fitted.y);
    }

    _drawDistributedPointValues(ctx, c, geom, rows, seriesPlottedPts, horizontal, domain) {
        if (!seriesPlottedPts || !rows) return;
        const drawnSeries = [];
        for (let s = 0; s < rows.length; s++) {
            if (rows[s] && rows[s].drawn && seriesPlottedPts[s] && seriesPlottedPts[s].length > 0) {
                drawnSeries.push({ seriesIndex: s, spec: rows[s].spec, points: seriesPlottedPts[s] });
            }
        }
        const numSeries = drawnSeries.length;
        if (numSeries === 0) return;

        const plotSpan = horizontal ? geom.drawH : geom.drawW;
        if (plotSpan <= 0) return;

        const distMode = c.pointValuesDistribution || 'timeHighLow';
        const isPointStep = distMode === 'pointStep';
        const isTimeUniform = distMode === 'timeUniform';

        let gridDivisions;
        let timeTargetStep = 48;
        if (c.autoPointValuesInterval === true) {
            timeTargetStep = 48;
            gridDivisions = Math.max(4, Math.min(24, Math.floor(plotSpan / 48)));
        } else {
            timeTargetStep = Math.max(1, Math.round(Number(c.pointValuesTimeWidth) || 48));
            gridDivisions = Math.max(2, Math.min(2000, Math.floor(plotSpan / timeTargetStep)));
        }
        if (gridDivisions < 1) gridDivisions = 1;

        const fs = Number(c.type === 'bar' ? c.pointValBarFs : c.pointValFs) || 10;
        const spacingFactor = (c.autoPointValuesInterval !== true && timeTargetStep < 48) ? Math.max(0, timeTargetStep / 48) : 1;
        const minSpacing = Math.max(0, Math.max(26, fs * 2.5) * spacingFactor);
        const minCrossSpacing = Math.max(0, Math.max(12, fs * 1.2) * spacingFactor);
        const placedLabels = [];
        const currentSeriesPlaced = {};
        const self = this;

        const tryPlaceLabel = function (pt, spec, seriesIdx, bestKey, labeledKeys) {
            const inBounds = pt.x >= -2 && pt.x <= geom.drawW + 2 && pt.y >= -2 && pt.y <= geom.drawH + 2;
            if (!inBounds) return false;

            const candPos = horizontal ? pt.y : pt.x;
            const candCross = horizontal ? pt.x : pt.y;
            for (let i = 0; i < placedLabels.length; i++) {
                const lbl = placedLabels[i];
                if (lbl.seriesIdx === seriesIdx) {
                    if (!isPointStep && Math.abs(candPos - lbl.pos) < minSpacing) return false;
                    if (isPointStep && Math.abs(candPos - lbl.pos) < 0.5) return false;
                } else {
                    const posDist = Math.abs(candPos - lbl.pos);
                    const crossDist = Math.abs(candCross - lbl.cross);
                    if (posDist < (isPointStep ? 6 : minSpacing) && crossDist < minCrossSpacing) {
                        return false;
                    }
                }
            }

            let opFactor = 1.0;
            const anim = self._activeAnimations && spec && spec.id && self._activeAnimations[spec.id];
            if (anim) {
                opFactor = self._pointValueAnimationOpacity(pt, anim, plotSpan, horizontal, c.reverseDirection === true);
            }
            if (opFactor <= 0.01) return false;

            if (bestKey != null && labeledKeys) labeledKeys[bestKey] = true;
            placedLabels.push({ pos: candPos, cross: candCross, seriesIdx: seriesIdx });
            const isNeg = pt.neg === true || pt.v < geom.baseline;
            const seriesCol = spec.pointColor || (!isNeg ? spec.positiveColor : spec.negativeColor);
            const labelCol = c.type === 'bar'
                ? (c.pointValBarCol || '@accent')
                : (c.pointValCol || seriesCol || '@accent');

            if (spec && spec.id) {
                if (!currentSeriesPlaced[spec.id]) currentSeriesPlaced[spec.id] = [];
                const targetVal = pt.toVal != null ? pt.toVal : pt.v;
                currentSeriesPlaced[spec.id].push({ val: targetVal, x: pt.x, y: pt.y, col: labelCol });
            }

            if (anim && anim.updateMode !== 'stream') {
                const isUnchanged = anim.animMode !== 'draw' && self._isLabelUnchanged(anim.prevPlacedLabels, pt.v, pt.x, pt.y);
                const op = isUnchanged ? 1.0 : opFactor;
                self._drawPointValueLabel(ctx, pt.v, pt.x, pt.y, c, labelCol, op);
                return true;
            }

            self._drawPointValueLabel(ctx, pt.v, pt.x, pt.y, c, labelCol, opFactor);
            return true;
        };

        const isDuration = c.bufferMode === 'duration' && domain && domain.isTime && isFinite(domain.t0) && isFinite(domain.t1) && domain.t1 > domain.t0;
        const effectivePeriod = isDuration && domain.period ? domain.period : (isDuration ? (domain.t1 - domain.t0) : 0);
        const timeStep = isDuration && effectivePeriod > 0 ? (effectivePeriod / gridDivisions) : 0;

        for (let d = 0; d < numSeries; d++) {
            const seriesObj = drawnSeries[d];
            const pts = seriesObj.points;
            const spec = seriesObj.spec || {};
            const offsetFraction = numSeries > 1 ? (d / numSeries) : 0;
            const labeledKeys = Object.create(null);

            const getCoord = isDuration
                ? function (p) {
                    if (!p) return 0;
                    if (p.t != null && isFinite(p.t)) return p.t;
                    if (p.pt && p.pt.t != null && isFinite(p.pt.t)) return p.pt.t;
                    return 0;
                }
                : function (p) {
                    if (!p) return 0;
                    if (p.seq != null && isFinite(p.seq)) return p.seq;
                    if (p.pt && p.pt.seq != null && isFinite(p.pt.seq)) return p.pt.seq;
                    if (p.index != null && isFinite(p.index)) return p.index;
                    if (p.cat != null && isFinite(p.cat)) return p.cat;
                    return 0;
                };

            const sortedPts = pts.slice().sort(function (a, b) {
                return getCoord(a) - getCoord(b);
            });

            if (isPointStep) {
                var step;
                if (c.autoPointValuesInterval === true) {
                    var maxFit = Math.max(1, Math.floor(plotSpan / 48));
                    step = Math.max(1, Math.ceil(sortedPts.length / maxFit));
                } else {
                    step = Math.max(1, Math.round(Number(c.pointValuesStep) || 1));
                }
                for (let i = 0; i < sortedPts.length; i++) {
                    const p = sortedPts[i];
                    const nodeSeq = (p.seq != null && isFinite(p.seq))
                        ? p.seq
                        : (p.pt && p.pt.seq != null && isFinite(p.pt.seq)
                            ? p.pt.seq
                            : (p.index != null && isFinite(p.index) ? p.index : i));
                    if (Math.abs(nodeSeq) % step === 0) {
                        const pointKey = 'seq_' + nodeSeq;
                        if (!labeledKeys[pointKey]) {
                            tryPlaceLabel(p, spec, d, pointKey, labeledKeys);
                        }
                    }
                }
                continue;
            }

            const seriesStep = isDuration
                ? timeStep
                : Math.max(0.001, Math.max(Number(c.maxPoints) || 20, sortedPts.length) / gridDivisions);

            if (seriesStep <= 0) continue;

            const seriesOffset = offsetFraction * seriesStep;
            const firstCoord = getCoord(sortedPts[0]);
            const lastCoord = getCoord(sortedPts[sortedPts.length - 1]);
            const minK = Math.floor((firstCoord - seriesOffset) / seriesStep);
            const maxK = Math.floor((lastCoord - seriesOffset) / seriesStep);
            const startK = isDuration ? Math.max(minK, Math.floor((domain.t0 - seriesOffset) / seriesStep)) : minK;
            const endK = isDuration ? Math.min(maxK, Math.ceil((domain.t1 - seriesOffset) / seriesStep)) : maxK;

            let ptr = 0;
            for (let k = startK; k <= endK; k++) {
                const cellStart = k * seriesStep + seriesOffset;
                const cellEnd = cellStart + seriesStep;
                const cellCenter = cellStart + seriesStep * 0.5;

                while (ptr < sortedPts.length && getCoord(sortedPts[ptr]) < cellStart) ptr++;
                const cellStartIdx = ptr;
                while (ptr < sortedPts.length && getCoord(sortedPts[ptr]) < cellEnd) ptr++;
                const cellEndIdx = ptr;

                if (cellStartIdx >= cellEndIdx) continue;

                let bestPoint = sortedPts[cellStartIdx];

                if (cellEndIdx - cellStartIdx > 1) {
                    let foundPeakOrTrough = false;
                    if (!isTimeUniform) {
                        let maxExtremum = -1;
                        for (let i = cellStartIdx; i < cellEndIdx; i++) {
                            const p = sortedPts[i];
                            const prev = i > 0 ? sortedPts[i - 1].v : p.v;
                            const next = i < sortedPts.length - 1 ? sortedPts[i + 1].v : p.v;
                            const isPeak = p.v >= prev && p.v >= next && (p.v > prev || p.v > next);
                            const isTrough = p.v <= prev && p.v <= next && (p.v < prev || p.v < next);
                            if (isPeak || isTrough) {
                                const score = Math.max(Math.abs(p.v - prev), Math.abs(p.v - next));
                                if (score > maxExtremum) {
                                    maxExtremum = score;
                                    bestPoint = p;
                                    foundPeakOrTrough = true;
                                }
                            }
                        }
                    }
                    if (!foundPeakOrTrough) {
                        let bestCenterDist = Infinity;
                        for (let i = cellStartIdx; i < cellEndIdx; i++) {
                            const dist = Math.abs(getCoord(sortedPts[i]) - cellCenter);
                            if (dist < bestCenterDist) {
                                bestCenterDist = dist;
                                bestPoint = sortedPts[i];
                            }
                        }
                    }
                }

                const pointKey = getCoord(bestPoint);
                if (!labeledKeys[pointKey]) {
                    tryPlaceLabel(bestPoint, spec, d, pointKey, labeledKeys);
                }
            }
        }

        // Draw-in mode cross-fade: fade out previous point value labels during the animation interval
        for (let d = 0; d < numSeries; d++) {
            const sObj = drawnSeries[d];
            const sp = sObj.spec || {};
            const sAnim = self._activeAnimations && sp.id && self._activeAnimations[sp.id];
            if (sAnim && sAnim.animMode === 'morph' && sAnim.updateMode !== 'stream' && sAnim.prevPlacedLabels && sAnim.prevPlacedLabels.length > 0) {
                const p = sAnim.progress != null ? sAnim.progress : 1.0;
                const fadeOut = Math.max(0, Math.min(1.0, 1.0 - p));
                if (fadeOut > 0.01) {
                    for (let j = 0; j < sAnim.prevPlacedLabels.length; j++) {
                        const oldLbl = sAnim.prevPlacedLabels[j];
                        if (self._hasMatchingPlacedLabel(currentSeriesPlaced[sp.id], oldLbl)) continue;
                        self._drawPointValueLabel(ctx, oldLbl.val, oldLbl.x, oldLbl.y, c, oldLbl.col, fadeOut);
                    }
                }
            }
        }

        if (!this._lastPlacedPointValues) this._lastPlacedPointValues = {};
        for (let sId in currentSeriesPlaced) {
            if (Object.prototype.hasOwnProperty.call(currentSeriesPlaced, sId)) {
                this._lastPlacedPointValues[sId] = currentSeriesPlaced[sId];
            }
        }
    }

    _hideHoverLabel() {
        const el = this._hoverLabelEl;
        if (el && el.style.display !== 'none') el.style.display = 'none';
    }

    _showHoverLabel(pt, c) {
        const el = this._hoverLabelEl;
        if (!el) return;
        const formatted = this._formatPointValueLabel(pt.val, c);
        if (!formatted) {
            this._hideHoverLabel();
            return;
        }
        if (el.textContent !== formatted) el.textContent = formatted;
        const isBar = c.type === 'bar';
        const offX = isBar ? c.pointValBarOffX : c.pointValOffX;
        const offY = isBar ? c.pointValBarOffY : c.pointValOffY;
        const startX = this._lastStartX || 0;
        const fs = isBar ? c.pointValBarFs : c.pointValFs;
        const font = isBar ? c.pointValBarFont : c.pointValFont;
        const bold = isBar ? c.pointValBarBold : c.pointValBold;
        const italic = isBar ? c.pointValBarItalic : c.pointValItalic;
        const opacity = isBar ? c.pointValBarOpacity : c.pointValOpacity;
        const color = this._resolvePlotColor(isBar ? c.pointValBarCol : c.pointValCol, typeof opacity === 'number' ? opacity : 100);
        el.style.left = ((this._plotCanvasOriginX || 0) + startX + pt.x + (offX || 0)) + 'px';
        el.style.top = ((this._plotCanvasOriginY || 0) + pt.y + (offY || 0)) + 'px';
        el.style.color = color;
        el.style.fontSize = (fs || 10) + 'px';
        el.style.fontFamily = font || 'sans-serif';
        el.style.fontWeight = bold ? '700' : '400';
        el.style.fontStyle = italic ? 'italic' : 'normal';
        el.style.display = 'block';
    }

    _updatePlotA11y(c, lastVal) {
        const el = this._plotA11yEl;
        const canvas = this.canvas;
        if (!el && !canvas) return;
        const type = c.type || 'line';
        const last = (lastVal === null || lastVal === undefined || isNaN(lastVal)) ? '' : String(lastVal);
        const summary = last ? ('Graph (' + type + '), last value ' + last) : ('Graph (' + type + ')');
        if (canvas && canvas.getAttribute('aria-label') !== summary) canvas.setAttribute('aria-label', summary);
        if (el && el.textContent !== summary) el.textContent = summary;
    }

    resumeFromBackground() {
        if (!this._graphIsOnPage()) {
            this.syncPageCoverageChrome(false);
            return;
        }
        const wasPaused = this._pausedInBackground === true;
        this._pausedInBackground = false;
        const c = this._plotView || this.config;
        const legend = this.legendEl;
        if (legend && legend.dataset.stacked !== '1' && c && c.showLegend && c.legendPosition !== 'hidden') {
            this._legendHiddenForPage = false;
            legend.style.display = (this._legendPageDisplay && this._legendPageDisplay !== 'none') ? this._legendPageDisplay : '';
            this._placeLegendPanel(c, legend, c.legendAutoSize === true);
        }
        this._syncTimelineTimer(c);
        if (!wasPaused) return;

        this._needsPageRevealAnimation = true;
        if (c && c.graphAnimation && c.graphAnimation !== 'none') {
            const list = c.series || [];
            let anyDrawn = false;
            for (let i = 0; i < list.length; i++) {
                const spec = list[i];
                if (!spec || !this._seriesDrawn(spec)) continue;
                const seriesId = spec.id || ('s' + i);
                const state = this._seriesState && this._seriesState[seriesId];
                if (state && state.buffer && state.buffer.length > 0) {
                    anyDrawn = true;
                    const durMs = Math.max(150, Math.round((c.graphAnimDuration || 2) * 1000));
                    this._startSeriesAnimation(seriesId, 'draw', 'snapshot', state.buffer, state.buffer, durMs, []);
                }
            }
            if (anyDrawn) {
                this._needsPageRevealAnimation = false;
            }
        }
    }

    pauseForBackground() {
        this._pausedInBackground = true;
        this._pendingAnimationUpdates = {};
        this._clearTimelineTimer();
        this._lastPlacedPointValues = {};
        this._cachedPlotLayout = null;
        if (this._plotResizeRaf != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._plotResizeRaf);
        }
        this._plotResizeRaf = null;
        if (this._plotPaintRaf != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._plotPaintRaf);
        }
        this._plotPaintRaf = null;
        if (this._animRaf != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._animRaf);
            this._animRaf = null;
        }
        this._activeAnimations = {};
        const legend = this.legendEl;
        if (legend && legend.dataset.stacked !== '1') {
            if (!this._legendHiddenForPage) {
                this._legendPageDisplay = legend.style.display;
                this._legendHiddenForPage = true;
                legend.style.display = 'none';
            }
        }
    }

    _resolveAxisDecimals(c, scale) {
        if (!c || c.roundingMode === 'strict') return 0;
        if (c.roundingMode === 'exact') {
            return Math.max(0, Math.floor(BaseWidget.toFiniteNumber(c.decimals, 0)));
        }
        let smartDec = scale && scale.decimals != null ? Math.max(0, Math.floor(scale.decimals)) : 0;
        if (scale && scale.ticks && scale.ticks.length > 1) {
            let step = scale.tickStep || Math.abs(scale.ticks[1] - scale.ticks[0]);
            let absMax = Math.max(
                Math.abs(scale.renderMin != null ? scale.renderMin : 0),
                Math.abs(scale.renderMax != null ? scale.renderMax : 0)
            );
            if (absMax >= 1000) {
                const scaledStep = absMax >= 1000000 ? (step / 1000000) : (step / 1000);
                if (scaledStep > 0 && scaledStep < 1) {
                    const minKDec = Math.max(0, Math.ceil(-Math.log10(scaledStep) + 1e-9));
                    if (minKDec > smartDec) smartDec = minKDec;
                }
            }
        }
        return smartDec;
    }

    _formatYAxisValue(val, decimals) {
        if (val === 0) return parseFloat((0).toFixed(decimals)).toString();
        const sign = val < 0 ? '-' : '';
        const absVal = Math.abs(val);
        if (absVal >= 1000000) return sign + parseFloat((absVal / 1000000).toFixed(decimals)) + 'M';
        if (absVal >= 1000) return sign + parseFloat((absVal / 1000).toFixed(decimals)) + 'k';
        return sign + parseFloat(absVal.toFixed(decimals)).toString();
    }

    _formatTimestamp(ts, c) {
        if (!ts) return "";
        let safeTs = ts;
        if (!c.timezoneConvert && typeof ts === 'string' && ts.endsWith('Z')) {
            safeTs = ts.slice(0, -1);
        }
        const date = new Date(safeTs);
        if (isNaN(date.getTime())) return "";

        const showsDate = GraphWidget.graphTimeFormatShowsDate(c.timeFormat);
        const showsTime = GraphWidget.graphTimeFormatShowsTime(c.timeFormat);
        const pad = (n) => n < 10 ? '0' + n : n;

        let timeStr = "";
        if (showsTime) {
            let hours = date.getHours();
            const minutes = date.getMinutes();
            const seconds = date.getSeconds();
            const rawHours = hours;

            if (!c.time24h) {
                hours = hours % 12;
                hours = hours ? hours : 12;
            }

            const timeMode = c.timeFormat === 'DateHours' ? 'HH' : c.timeFormat;
            if (timeMode === 'HH') {
                timeStr = `${pad(hours)}`;
            } else if (timeMode === 'HH:mm') {
                timeStr = `${pad(hours)}:${pad(minutes)}`;
            } else if (timeMode === 'HH:mm:ss') {
                timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
            }

            if (!c.time24h && timeStr) {
                timeStr += ` ${rawHours >= 12 ? 'PM' : 'AM'}`;
            }
        }

        let dateStr = "";
        if (showsDate && c.dateFormat && c.dateFormat !== 'none') {
            const day = pad(date.getDate());
            const month = pad(date.getMonth() + 1);
            const year = date.getFullYear();
            switch (c.dateFormat) {
                case 'DD-MM': dateStr = `${day}-${month}`; break;
                case 'DD-MM-YYYY': dateStr = `${day}-${month}-${year}`; break;
                case 'MM-DD': dateStr = `${month}-${day}`; break;
                case 'MM-DD-YYYY': dateStr = `${month}-${day}-${year}`; break;
            }
        }

        if (dateStr && timeStr) return `${dateStr} ${timeStr}`;
        if (dateStr) return dateStr;
        return timeStr;
    }


    _formatPointValue(val, decimals, abbreviate) {
        if (val === null || val === undefined || isNaN(val)) return '';
        let scaledVal = val;
        let suffix = '';
        if (abbreviate) {
            const absVal = Math.abs(val);
            if (absVal >= 1000000) {
                scaledVal = val / 1000000;
                suffix = 'M';
            } else if (absVal >= 1000) {
                scaledVal = val / 1000;
                suffix = 'k';
            }
        }
        return scaledVal.toFixed(decimals) + suffix;
    }

    _estimateGraphTextWidth(text, fontSize, fontFamily, bold) {
        const str = text == null ? '' : String(text);
        if (!str) return 0;
        const fs = Math.max(1, Number(fontSize) || 10);
        const family = fontFamily || 'sans-serif';
        const lines = str.split('\n');
        let ctx = GraphWidget._textMeasureCtx;
        if (!ctx && typeof document !== 'undefined') {
            const canvas = document.createElement('canvas');
            ctx = canvas.getContext ? canvas.getContext('2d') : null;
            GraphWidget._textMeasureCtx = ctx || null;
        }
        let maxW = 0;
        if (ctx) {
            const fontStr = (bold ? '700 ' : '400 ') + fs + 'px ' + family;
            if (ctx._lastFont !== fontStr) {
                ctx.font = fontStr;
                ctx._lastFont = fontStr;
            }
            for (let i = 0; i < lines.length; i++) {
                const w = ctx.measureText(lines[i]).width;
                if (w > maxW) maxW = w;
            }
            return maxW;
        }
        for (let i = 0; i < lines.length; i++) {
            const w = lines[i].length * fs * (bold ? 0.68 : 0.62);
            if (w > maxW) maxW = w;
        }
        return maxW;
    }


    _applyPointValueCase(text, textCase) {
        if (!text) return text;
        if (textCase === 'uppercase') return text.toUpperCase();
        if (textCase === 'lowercase') return text.toLowerCase();
        if (textCase === 'capitalize') return text.charAt(0).toUpperCase() + text.slice(1);
        return text;
    }


    _handleGraphMouseMove(event) {
        const c = this._plotView;
        const canvas = this.canvas;
        if (!c || !canvas || c.deactivated || !c.showPointValues || !c.pointValuesHoverOnly || !this.renderedPoints || !this.renderedPoints.length) {
            this._hideHoverLabel();
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const startX = this._lastStartX || 0;
        let scale = 1;
        if (typeof Dashboard !== 'undefined' && Dashboard._editorZoomScale > 0 && Dashboard._editorZoomScale !== 1) {
            scale = Dashboard._editorZoomScale;
        }
        const mouseX = (event.clientX - rect.left) / scale - (this._plotCanvasOriginX || 0) - startX;
        const mouseY = (event.clientY - rect.top) / scale - (this._plotCanvasOriginY || 0);
        const threshold = c.pointSize + 10;
        let hit = null;

        for (let i = 0; i < this.renderedPoints.length; i++) {
            const pt = this.renderedPoints[i];
            let isHovered = false;
            if (pt.type === 'bar') {
                const margin = 10;
                isHovered = (mouseX >= pt.barX - margin && mouseX <= pt.barX + pt.barW + margin
                    && mouseY >= pt.rectY - margin && mouseY <= pt.rectY + pt.rectH + margin);
            } else {
                const dx = mouseX - pt.x;
                const dy = mouseY - pt.y;
                isHovered = Math.sqrt(dx * dx + dy * dy) <= threshold;
            }
            if (isHovered) {
                hit = pt;
                break;
            }
        }

        if (hit) this._showHoverLabel(hit, c);
        else this._hideHoverLabel();
    }

    _handleGraphMouseLeave() {
        this._hideHoverLabel();
    }


    wantsDuplicateTopicPayloads() {
        const b = this.bindings;
        if (b && Array.isArray(b.series)) {
            for (let i = 0; i < b.series.length; i++) {
                const row = b.series[i];
                if (row && typeof row.data === 'string' && row.data.trim()) return true;
            }
        }
        if (b && typeof b.data === 'string' && b.data.trim()) return true;
        return BaseWidget.prototype.wantsDuplicateTopicPayloads.call(this);
    }

    _seriesIndexForTopic(topic) {
        const indices = this._seriesIndicesForTopic(topic);
        return indices.length ? indices[0] : -1;
    }

    _seriesIndicesForTopic(topic) {
        const b = this.bindings;
        if (!b) return [];
        const norm = String(topic || '').trim();
        if (!norm) return [];
        const matched = [];
        if (Array.isArray(b.series)) {
            for (let i = 0; i < b.series.length; i++) {
                const row = b.series[i];
                if (row && typeof row.data === 'string' && (row.data === topic || row.data.trim() === norm)) {
                    matched.push(i);
                }
            }
        }
        if (!matched.length && typeof b.data === 'string' && (b.data === topic || b.data.trim() === norm)) {
            matched.push(0);
        }
        return matched;
    }

    _bufferSettings(c) {
        if (c) {
            return {
                bufferMode: c.bufferMode || 'points',
                maxPoints: c.maxPoints,
                durationPreset: c.durationPreset,
                durationCustomValue: c.durationCustomValue,
                durationCustomUnit: c.durationCustomUnit
            };
        }
        const o = this.overrides || {};
        const M = typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {};
        return {
            bufferMode: o.bufferMode || M.defaultGraphBufferMode || 'points',
            maxPoints: o.maxPoints != null ? o.maxPoints : M.defaultGraphMaxPoints,
            durationPreset: o.durationPreset || M.defaultGraphDurationPreset || '24h',
            durationCustomValue: o.durationCustomValue != null ? o.durationCustomValue : M.defaultGraphDurationCustomValue,
            durationCustomUnit: o.durationCustomUnit || M.defaultGraphDurationCustomUnit || 'hours'
        };
    }

    _ensureSeriesState(id) {
        if (!this._seriesState) this._seriesState = {};
        if (!this._seriesState[id]) {
            this._seriesState[id] = { buffer: [], seedKey: null, lastSnapshotKey: null, mode: 'empty' };
        }
        return this._seriesState[id];
    }

    _runtimeSeriesList() {
        const saved = this.overrides && this.overrides.series;
        if (Array.isArray(saved)) return saved;
        const c = this.config;
        if (c && Array.isArray(c.series)) return c.series;
        return [];
    }

    _seriesSpecAt(index) {
        const list = this._runtimeSeriesList();
        if (list[index]) return list[index];
        return { id: 's' + index };
    }

    _pruneBuffer(buf, settings, mode) {
        const src = buf || [];
        const next = src.slice();
        let hasTime = false;
        let needsSort = false;
        let prevT = -Infinity;
        for (let i = 0; i < next.length; i++) {
            const pt = next[i];
            if (pt && pt.t != null) {
                hasTime = true;
                if (pt.t < prevT) needsSort = true;
                prevT = pt.t;
            }
        }
        if (hasTime && needsSort) {
            next.sort(function (a, b) { return (a && a.t ? a.t : 0) - (b && b.t ? b.t : 0); });
        }
        if (settings.bufferMode === 'duration') {
            const period = GraphWidget.durationMsFrom(settings.durationPreset, settings.durationCustomValue, settings.durationCustomUnit);
            const cutoff = Date.now() - period;
            let lastPreCutoff = null;
            const kept = [];
            for (let i = 0; i < next.length; i++) {
                const p = next[i];
                if (!p) continue;
                if (p.t != null) {
                    if (p.t >= cutoff) {
                        kept.push(p);
                    } else {
                        if (!lastPreCutoff || p.t > lastPreCutoff.t) {
                            lastPreCutoff = p;
                        }
                    }
                } else if (!hasTime) {
                    kept.push(p);
                }
            }
            if (lastPreCutoff) {
                kept.unshift(lastPreCutoff);
            }
            const cap = GraphWidget.SAFETY_CAP();
            if (kept.length > cap) return kept.slice(kept.length - cap);
            return kept;
        }
        // Stream samples obey Point Count. Snapshots and static seeds keep the wide
        // snapshot window so a fixed 24-hour CSV keeps every value it was given.
        const points = Math.max(1, Math.floor(Number(settings.maxPoints) || 20));
        const limit = mode === 'stream' ? points : Math.max(points, GraphWidget.SNAPSHOT_LIMIT());
        if (next.length <= limit) return next;
        return next.slice(next.length - limit);
    }

    _payloadForSeries(spec, payload) {
        const key = 'graphSeries_' + spec.id + '_data';
        const o = this.overrides || {};
        if (o[key + '_bind_formula'] || o[key + '_bind_transformMode'] || o[key + '_bind_mapTrue'] || o[key + '_bind_mapFalse']) {
            return this._applyPayloadTransformsForFormula(key, payload, 0, {});
        }
        return payload;
    }

    /**
     * Smooth cubic ease-out: fast start, gentle landing.
     */
    static _easeOutCubic(t) {
        const clamped = t < 0 ? 0 : (t > 1 ? 1 : t);
        return 1 - Math.pow(1 - clamped, 3);
    }

    /**
     * Smooth cubic ease-in-out for conveyor shifts and morphing.
     */
    static _easeInOutCubic(t) {
        const x = t < 0 ? 0 : (t > 1 ? 1 : t);
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    /**
     * Evaluates the 0% -> 200% -> 100% elastic plop curve for a normalized
     * local progress `t` in [0, 1].
     */
    static _evalElasticPlop(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1.0;
        // 0.00 -> 0.45: Smoothly accelerate from 0.0 to 2.0 (200% peak)
        if (t < 0.45) {
            const p1 = t / 0.45;
            return 2.0 * Math.sin(p1 * Math.PI * 0.5);
        }
        // 0.45 -> 0.80: Ease down from 2.0 to 0.90 (slight undershoot cushion)
        if (t < 0.80) {
            const p2 = (t - 0.45) / 0.35;
            const e2 = (1 - Math.cos(p2 * Math.PI)) * 0.5;
            return 2.0 - 1.10 * e2;
        }
        // 0.80 -> 1.00: Settle from 0.90 to 1.00 (100% rest)
        const p3 = (t - 0.80) / 0.20;
        const e3 = Math.sin(p3 * Math.PI * 0.5);
        return 0.90 + 0.10 * e3;
    }

    /**
     * Detects whether `toBuf` is a shifted window of `fromBuf` (e.g. a graph
     * scrolling left as `k` new points enter on the right).
     * Returns positive `k` when shifting left by `k` slots, or 0 if no shift.
     */
    static _detectBufferShift(fromBuf, toBuf) {
        if (!fromBuf || !toBuf || fromBuf.length < 3 || toBuf.length < 3) return 0;
        const nFrom = fromBuf.length;
        const nTo = toBuf.length;
        const maxShift = Math.min(Math.floor(nFrom * 0.5), Math.floor(nTo * 0.5), 12);
        if (maxShift < 1) return 0;

        for (let s = 1; s <= maxShift; s++) {
            const overlap = Math.min(nFrom - s, nTo);
            if (overlap < 2) continue;
            let matches = 0;
            let matchedByTimestampOrLabel = false;
            let firstVal = null;
            let hasVariance = false;
            for (let i = 0; i < overlap; i++) {
                const a = fromBuf[i + s];
                const b = toBuf[i];
                if (!a || !b) continue;
                if (a.t != null && b.t != null && a.t === b.t) {
                    matches++;
                    matchedByTimestampOrLabel = true;
                } else if (a.l != null && b.l != null && a.l !== '' && a.l === b.l) {
                    matches++;
                    matchedByTimestampOrLabel = true;
                } else if (a.v != null && b.v != null && isFinite(a.v) && isFinite(b.v) && Math.abs(a.v - b.v) < 1e-6) {
                    matches++;
                    if (firstVal === null) {
                        firstVal = b.v;
                    } else if (Math.abs(b.v - firstVal) > 1e-6) {
                        hasVariance = true;
                    }
                }
            }
            if (matches === overlap) {
                if (!matchedByTimestampOrLabel && !hasVariance) {
                    continue;
                }
                return s;
            }
        }
        return 0;
    }

    /**
     * Samples a value from a point buffer at a normalized position `frac` in [0, 1].
     * Used when morphing between buffers of different lengths.
     */
    static _sampleBufferAtFrac(buf, frac) {
        if (!buf || !buf.length) return 0;
        if (buf.length === 1) {
            return (buf[0] && buf[0].v != null && isFinite(buf[0].v)) ? buf[0].v : 0;
        }
        const clamped = frac < 0 ? 0 : (frac > 1 ? 1 : frac);
        const pos = clamped * (buf.length - 1);
        const idx0 = Math.floor(pos);
        const idx1 = Math.min(buf.length - 1, idx0 + 1);
        const alpha = pos - idx0;
        const v0 = (buf[idx0] && buf[idx0].v != null && isFinite(buf[idx0].v)) ? buf[idx0].v : 0;
        const v1 = (buf[idx1] && buf[idx1].v != null && isFinite(buf[idx1].v)) ? buf[idx1].v : v0;
        return v0 + (v1 - v0) * alpha;
    }

    _handleSeriesDataUpdate(seriesId, updateMode, prevBuf, nextBuf, droppedPts) {
        if (!this._graphIsOnPage()) return;
        const c = this._plotView || this.config;
        const animMode = c.graphAnimation;
        if (!animMode || animMode === 'none') return;
        const activeAnim = this._activeAnimations && this._activeAnimations[seriesId];
        if (activeAnim && activeAnim.animMode === 'draw' && (activeAnim.progress == null || activeAnim.progress < 1.0)) {
            if (!this._pendingAnimationUpdates) this._pendingAnimationUpdates = {};
            this._pendingAnimationUpdates[seriesId] = {
                updateMode: updateMode,
                prevBuf: (activeAnim.toBuffer && activeAnim.toBuffer.length > 0) ? activeAnim.toBuffer.slice() : (nextBuf ? nextBuf.slice() : []),
                nextBuf: nextBuf ? nextBuf.slice() : [],
                droppedPts: Array.isArray(droppedPts) ? droppedPts.slice() : []
            };
            return;
        }
        const durSec = updateMode === 'stream'
            ? (c.graphAnimStreamDuration != null ? c.graphAnimStreamDuration : 0.6)
            : (c.graphAnimDuration != null ? c.graphAnimDuration : 2);
        this._needsPageRevealAnimation = false;
        this._startSeriesAnimation(
            seriesId,
            animMode,
            updateMode,
            prevBuf,
            nextBuf,
            Math.max(80, Math.round(durSec * 1000)),
            droppedPts
        );
    }

    _handleSeriesDuplicatePayload(seriesId, buffer) {
        if (!this._graphIsOnPage()) return;
        const c = this._plotView || this.config;
        if (!c.graphAnimation || c.graphAnimation === 'none' || c.graphAnimShimmer === false) return;
        const activeAnim = this._activeAnimations && this._activeAnimations[seriesId];
        if (activeAnim && (activeAnim.progress == null || activeAnim.progress < 1.0)) {
            return;
        }
        this._startSeriesAnimation(seriesId, 'shimmer', 'snapshot', buffer, buffer, 850, []);
    }

    _startSeriesAnimation(seriesId, animMode, updateMode, fromBuf, toBuf, durationMs, droppedPts) {
        if (!this._activeAnimations) this._activeAnimations = {};
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const prevAnim = this._activeAnimations[seriesId];

        let effectiveFrom = fromBuf ? fromBuf.slice() : [];
        if (prevAnim && prevAnim.currentBuffer && prevAnim.currentBuffer.length > 0) {
            const cleanCurrent = [];
            for (let i = 0; i < prevAnim.currentBuffer.length; i++) {
                const pt = prevAnim.currentBuffer[i];
                if (pt && !pt.isDropped) cleanCurrent.push(pt);
            }
            if (cleanCurrent.length > 0) effectiveFrom = cleanCurrent;
        }

        const targetBuf = toBuf ? toBuf.slice() : [];
        const isInitialReveal = animMode === 'draw'
            || (effectiveFrom.length === 0 && updateMode !== 'stream')
            || (this._needsPageRevealAnimation === true && updateMode !== 'stream' && animMode !== 'morph');
        this._needsPageRevealAnimation = false;
        const effectiveAnimMode = isInitialReveal ? 'draw' : (animMode === 'shimmer' ? 'shimmer' : (animMode === 'none' ? 'none' : 'morph'));
        const shiftSlots = (effectiveAnimMode === 'morph' && updateMode === 'snapshot')
            ? GraphWidget._detectBufferShift(effectiveFrom, targetBuf)
            : 0;

        const prevPlaced = (effectiveAnimMode !== 'draw' && this._lastPlacedPointValues && this._lastPlacedPointValues[seriesId])
            ? this._lastPlacedPointValues[seriesId].slice()
            : [];

        this._activeAnimations[seriesId] = {
            animMode: effectiveAnimMode,
            updateMode: updateMode,
            fromBuffer: effectiveFrom,
            toBuffer: targetBuf,
            prevPlacedLabels: prevPlaced,
            droppedPoints: Array.isArray(droppedPts) ? droppedPts.slice() : [],
            shiftSlots: shiftSlots,
            startTime: now,
            duration: Math.max(80, durationMs || 1000),
            progress: 0,
            currentBuffer: null
        };

        if (effectiveAnimMode === 'draw' || !this._hasPlottedFiniteData) {
            if (this._scaleState) {
                this._scaleState.fromMin = null;
                this._scaleState.fromMax = null;
            }
        } else if (this._scaleState && this._scaleState.currentMin != null && this._scaleState.currentMax != null) {
            this._scaleState.fromMin = this._scaleState.currentMin;
            this._scaleState.fromMax = this._scaleState.currentMax;
            this._scaleState.startTime = now;
            this._scaleState.duration = Math.max(150, durationMs || 1000);
            this._scaleState.easing = (effectiveAnimMode === 'morph' && updateMode !== 'stream') ? 'inOut' : 'out';
        }

        if (!this._boundAnimTick) {
            this._boundAnimTick = this._tickGraphAnimation.bind(this);
        }
        if (!this._animRaf && typeof requestAnimationFrame === 'function') {
            this._animRaf = requestAnimationFrame(this._boundAnimTick);
        }
    }

    _tickGraphAnimation() {
        this._animRaf = null;
        if (!this._graphIsOnPage()) {
            this._activeAnimations = {};
            this._cachedPlotLayout = null;
            return;
        }
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const keys = this._activeAnimations ? Object.keys(this._activeAnimations) : [];
        if (!keys.length) {
            this._cachedPlotLayout = null;
            return;
        }

        let anyActive = false;
        for (let i = 0; i < keys.length; i++) {
            const sid = keys[i];
            const anim = this._activeAnimations[sid];
            if (!anim) continue;
            const elapsed = now - anim.startTime;
            const p = elapsed / anim.duration;

            if (p >= 1.0) {
                delete this._activeAnimations[sid];
                if (this._pendingAnimationUpdates && this._pendingAnimationUpdates[sid]) {
                    const pending = this._pendingAnimationUpdates[sid];
                    delete this._pendingAnimationUpdates[sid];
                    const c = this._plotView || this.config;
                    const durSec = pending.updateMode === 'stream'
                        ? (c.graphAnimStreamDuration != null ? c.graphAnimStreamDuration : 0.6)
                        : (c.graphAnimDuration != null ? c.graphAnimDuration : 2);
                    this._startSeriesAnimation(
                        sid,
                        'morph',
                        pending.updateMode,
                        pending.prevBuf,
                        pending.nextBuf,
                        Math.max(80, Math.round(durSec * 1000)),
                        pending.droppedPts
                    );
                    anyActive = true;
                }
            } else {
                anim.progress = Math.max(0, Math.min(1.0, p));
                anyActive = true;
            }
        }

        this._renderPlotOnly();

        if (!this._boundAnimTick) {
            this._boundAnimTick = this._tickGraphAnimation.bind(this);
        }
        if (anyActive && typeof requestAnimationFrame === 'function') {
            this._animRaf = requestAnimationFrame(this._boundAnimTick);
        } else if (!anyActive) {
            this._cachedPlotLayout = null;
        }
    }

    /**
     * Computes the per-frame intermediate point buffer and phase progress flags:
     *
     * - `shimmer`: leaves coordinates intact and sets `anim.shimmerProgress`.
     * - `stream` (4-Stage Pipeline):
     *    Phase 1 (0.00 - 0.25): Conveyor shift (`shiftProgress`). Oldest dropped
     *                           point slides out while existing points slide over.
     *    Phase 2 (0.15 - 0.55): New point elastic plop (`0% -> 200% -> 100%`).
     *    Phase 3 (0.45 - 0.85): Line & fill trace from previous point to new point.
     *    Phase 4 (0.85 - 1.00): If `showPoints` is false, retract new point `100% -> 0%`.
     * - `draw` (Choreographed Reveal):
     *    Sweeps across the plot (`drawProgress`) while raising values from baseline.
     * - `morph` (Shift-Aware Full Graph Update):
     *    Slides by `shiftSlots` if a window shift was detected, or resamples across
     *    normalized category space for smooth in-place morphing.
     */
    _computeAnimatedBuffer(anim, stateBuffer) {
        if (!anim || anim.progress >= 1.0) return stateBuffer;
        const p = anim.progress;

        if (anim.animMode === 'shimmer') {
            anim.shimmerProgress = p;
            return stateBuffer;
        }

        const from = anim.fromBuffer || [];
        const to = anim.toBuffer || stateBuffer || [];
        if (!to.length) return stateBuffer;

        // --- STREAMING 4-STAGE PIPELINE ---
        if (anim.updateMode === 'stream') {
            const shiftRaw = Math.min(1.0, p / 0.25);
            const plopRaw = Math.max(0.0, Math.min(1.0, (p - 0.15) / 0.40));
            const traceRaw = Math.max(0.0, Math.min(1.0, (p - 0.45) / 0.40));
            const retractRaw = Math.max(0.0, Math.min(1.0, (p - 0.85) / 0.15));

            anim.streamShiftProgress = GraphWidget._easeInOutCubic(shiftRaw);
            anim.streamPlopScale = GraphWidget._evalElasticPlop(plopRaw);
            anim.streamTraceProgress = GraphWidget._easeOutCubic(traceRaw);
            anim.streamRetractProgress = GraphWidget._easeInOutCubic(retractRaw);

            const dropped = anim.droppedPoints || [];
            const res = [];

            if (dropped.length > 0 && anim.streamShiftProgress < 1.0) {
                for (let d = 0; d < dropped.length; d++) {
                    const dp = dropped[d];
                    if (!dp) continue;
                    res.push({
                        v: dp.v,
                        t: dp.t,
                        l: dp.l,
                        seq: dp.seq,
                        isDropped: true,
                        dropIndex: d,
                        dropCount: dropped.length
                    });
                }
            }

            for (let i = 0; i < to.length; i++) {
                const pt = to[i];
                const isLast = (i === to.length - 1);
                res.push({
                    v: pt ? pt.v : null,
                    t: pt ? pt.t : null,
                    l: pt ? pt.l : null,
                    seq: pt && pt.seq != null ? pt.seq : i,
                    streamSlotIndex: i,
                    streamSlotCount: to.length,
                    isStreamNew: isLast
                });
            }
            return res;
        }

        // --- CHOREOGRAPHED REVEAL (EMPTY -> FULL OR DRAW MODE) ---
        if (!from.length || anim.animMode === 'draw') {
            anim.drawProgress = GraphWidget._easeOutCubic(p);
            anim.drawRawProgress = p;
            const res = [];
            for (let i = 0; i < to.length; i++) {
                const tPt = to[i];
                res.push({
                    v: tPt ? tPt.v : null,
                    fromVal: null,
                    toVal: (tPt && tPt.v != null && isFinite(tPt.v)) ? tPt.v : null,
                    t: tPt ? tPt.t : null,
                    l: tPt ? tPt.l : null,
                    seq: tPt && tPt.seq != null ? tPt.seq : i,
                    isDrawReveal: true
                });
            }
            return res;
        }

        // --- SHIFT-AWARE MORPH (SLIDING WINDOW UPDATE) ---
        const easeP = GraphWidget._easeInOutCubic(p);
        const shift = anim.shiftSlots || 0;
        if (shift > 0 && from.length >= shift && to.length >= 2) {
            anim.morphShiftProgress = easeP;
            anim.morphShiftSlots = shift;
            const res = [];
            // Include the outgoing shifted points so they slide smoothly off the edge
            if (easeP < 1.0) {
                for (let d = 0; d < shift; d++) {
                    const dp = from[d];
                    if (!dp) continue;
                    res.push({
                        v: dp.v,
                        fromVal: (dp && dp.v != null && isFinite(dp.v)) ? dp.v : null,
                        toVal: null,
                        t: dp.t,
                        l: dp.l,
                        seq: dp.seq != null ? dp.seq : d,
                        isDropped: true,
                        dropIndex: d,
                        dropCount: shift
                    });
                }
            }
            const overlap = from.length - shift;
            for (let i = 0; i < to.length; i++) {
                const tPt = to[i];
                const tV = (tPt && tPt.v != null && isFinite(tPt.v)) ? tPt.v : 0;
                let v = tV;
                let isNew = false;
                let fV = null;
                if (i < overlap && from[i + shift]) {
                    const fPt = from[i + shift];
                    fV = (fPt && fPt.v != null && isFinite(fPt.v)) ? fPt.v : tV;
                    v = fV + (tV - fV) * easeP;
                } else {
                    isNew = true;
                }
                res.push({
                    v: v,
                    fromVal: (fV != null && isFinite(fV)) ? fV : null,
                    toVal: (tPt && tPt.v != null && isFinite(tPt.v)) ? tPt.v : null,
                    t: tPt ? tPt.t : null,
                    l: tPt ? tPt.l : null,
                    seq: tPt && tPt.seq != null ? tPt.seq : i,
                    streamSlotIndex: i,
                    streamSlotCount: to.length,
                    isMorphNew: isNew
                });
            }
            return res;
        }

        // --- PURE IN-PLACE MORPH (RESAMPLED ACROSS NORMALIZED CATEGORY SPACE) ---
        const nTo = to.length;
        const res = [];
        for (let i = 0; i < nTo; i++) {
            const tPt = to[i];
            const frac = nTo <= 1 ? 0.5 : i / (nTo - 1);
            const fV = GraphWidget._sampleBufferAtFrac(from, frac);
            const tV = (tPt && tPt.v != null && isFinite(tPt.v)) ? tPt.v : fV;
            const v = fV + (tV - fV) * easeP;
            res.push({
                v: v,
                fromVal: (fV != null && isFinite(fV)) ? fV : null,
                toVal: (tV != null && isFinite(tV)) ? tV : null,
                t: tPt ? tPt.t : null,
                l: tPt ? tPt.l : null,
                seq: tPt && tPt.seq != null ? tPt.seq : i
            });
        }
        return res;
    }

    /**
     * Computes the scale multiplier for a plotted point during animation.
     * Supports both `showPoints === true` and the temporary "ghost point" when
     * `showPoints === false` (scales 0% -> 200% -> 100%, then 100% -> 0% once
     * the line segment finishes drawing).
     */
    _pointAnimationScale(pt, index, anim, totalSpan, horizontal, showPointsEnabled, isReversed) {
        if (!anim) return showPointsEnabled ? 1.0 : 0.0;
        if (pt && pt.isDropped) return showPointsEnabled ? 1.0 : 0.0;

        if (anim.animMode === 'shimmer') {
            if (!showPointsEnabled) return 0.0;
            const span = Math.max(1, totalSpan);
            const rawPos = horizontal ? (pt ? pt.y : 0) : (pt ? pt.x : 0);
            const progPos = isReversed ? (span - rawPos) : rawPos;
            const shimmerCenter = (anim.shimmerProgress || 0) * (span + 100) - 50;
            const dist = Math.abs(progPos - shimmerCenter);
            if (dist < 45) {
                return 1.0 + 0.55 * Math.cos((dist / 45) * Math.PI * 0.5);
            }
            return 1.0;
        }

        // Streaming 4-stage pipeline
        if (anim.updateMode === 'stream') {
            if (pt && pt.isStreamNew) {
                const plop = anim.streamPlopScale != null ? anim.streamPlopScale : 1.0;
                if (showPointsEnabled) {
                    return plop;
                }
                // When showPoints is disabled, retract smoothly from 100% to 0% in Phase 4
                const retract = anim.streamRetractProgress || 0;
                if (retract > 0) {
                    return plop * (1.0 - retract);
                }
                return plop;
            }
            return showPointsEnabled ? 1.0 : 0.0;
        }

        // Choreographed Reveal (`draw`) or Shift-Aware Morph new points
        if (anim.drawProgress != null) {
            const span = Math.max(1, totalSpan);
            const pos = horizontal ? (pt ? pt.y : 0) : (pt ? pt.x : 0);
            const distFromStart = isReversed ? (span - pos) : pos;
            const u = Math.max(0, Math.min(1, distFromStart / span));
            const p = anim.drawRawProgress != null ? anim.drawRawProgress : anim.drawProgress;

            const pTouch = 0.12 + u * 0.78;
            const pStart = u * 0.78;

            if (p < pStart) return 0.0;

            if (p <= pTouch) {
                const localT = Math.max(0, Math.min(1.0, (p - pStart) / 0.12));
                return GraphWidget._evalElasticPlop(localT);
            }

            if (showPointsEnabled) return 1.0;

            // Ghost point: retract smoothly to 0% once the line has touched the point
            const retractT = Math.max(0, Math.min(1.0, (p - pTouch) / 0.10));
            return Math.max(0.0, 1.0 - retractT);
        }

        if (anim.morphShiftProgress != null && pt && pt.isMorphNew) {
            const localT = Math.max(0, Math.min(1, (anim.morphShiftProgress - 0.25) / 0.75));
            const plop = GraphWidget._evalElasticPlop(localT);
            if (showPointsEnabled) return plop;
            if (localT >= 0.99) return 0.0;
            if (localT > 0.75) return plop * (1.0 - (localT - 0.75) / 0.25);
            return plop;
        }

        return showPointsEnabled ? 1.0 : 0.0;
    }

    _pointValueAnimationOpacity(pt, anim, totalSpan, horizontal, isReversed) {
        if (!anim) return 1.0;
        if (pt && pt.isDropped) return Math.max(0, 1.0 - (anim.streamShiftProgress || anim.morphShiftProgress || 0));
        if (anim.animMode === 'shimmer') return 1.0;

        if (anim.updateMode === 'stream') {
            if (pt && pt.isStreamNew) {
                return anim.streamTraceProgress != null ? anim.streamTraceProgress : 1.0;
            }
            return 1.0;
        }

        if (anim.drawProgress != null) {
            const span = Math.max(1, totalSpan);
            const pos = horizontal ? (pt ? pt.y : 0) : (pt ? pt.x : 0);
            const distFromStart = isReversed ? (span - pos) : pos;
            const u = Math.max(0, Math.min(1, distFromStart / span));
            const p = anim.drawRawProgress != null ? anim.drawRawProgress : anim.drawProgress;
            const pTouch = 0.12 + u * 0.78;
            if (p < pTouch - 0.04) return 0.0;
            return Math.max(0, Math.min(1.0, (p - (pTouch - 0.04)) / 0.10));
        }

        if (anim.morphShiftProgress != null && pt && pt.isMorphNew) {
            return Math.max(0, Math.min(1, (anim.morphShiftProgress - 0.4) / 0.6));
        }

        return 1.0;
    }

    /**
     * Builds the progressive line/curve point list for a streaming update so the
     * segment from `prevPt` to `newPt` traces smoothly during Phase 3 without
     * prematurely bending monotone cubic tangents during Phases 1 & 2.
     */
    _buildStreamTracePoints(screenPts, traceProgress, type, horizontal) {
        if (!screenPts || screenPts.length < 2) return screenPts;
        let newIdx = -1;
        for (let i = screenPts.length - 1; i >= 0; i--) {
            if (screenPts[i] && screenPts[i].isStreamNew) {
                newIdx = i;
                break;
            }
        }
        if (newIdx < 0) return screenPts;

        // If `reverseDirection` placed the new point at index 0, trace from index 1 -> 0
        if (newIdx === 0) {
            const targetPt = screenPts[0];
            const prevPt = screenPts[1];
            const rest = screenPts.slice(1);
            if (traceProgress <= 0.001) return rest;
            if (traceProgress >= 0.999) return screenPts;

            if (type === 'stepped') {
                const cornerX = horizontal ? targetPt.x : prevPt.x;
                const cornerY = horizontal ? prevPt.y : targetPt.y;
                if (traceProgress <= 0.5) {
                    const t1 = traceProgress * 2;
                    const tip1 = Object.assign({}, targetPt, {
                        x: prevPt.x + (cornerX - prevPt.x) * t1,
                        y: prevPt.y + (cornerY - prevPt.y) * t1,
                        synthetic: true
                    });
                    return [tip1].concat(rest);
                }
                const t2 = (traceProgress - 0.5) * 2;
                const cornerPt = Object.assign({}, targetPt, { x: cornerX, y: cornerY, synthetic: true });
                const tip2 = Object.assign({}, targetPt, {
                    x: cornerX + (targetPt.x - cornerX) * t2,
                    y: cornerY + (targetPt.y - cornerY) * t2,
                    synthetic: true
                });
                return [tip2, cornerPt].concat(rest);
            }

            const tip = Object.assign({}, targetPt, {
                x: prevPt.x + (targetPt.x - prevPt.x) * traceProgress,
                y: prevPt.y + (targetPt.y - prevPt.y) * traceProgress,
                v: prevPt.v + (targetPt.v - prevPt.v) * traceProgress
            });
            return [tip].concat(rest);
        }

        // Standard left-to-right order: new point is at the end (`newIdx === screenPts.length - 1`)
        const basePts = screenPts.slice(0, newIdx);
        const prevPt = screenPts[newIdx - 1];
        const targetPt = screenPts[newIdx];
        if (traceProgress <= 0.001) return basePts;
        if (traceProgress >= 0.999) return screenPts;

        if (type === 'stepped') {
            const cornerX = horizontal ? prevPt.x : targetPt.x;
            const cornerY = horizontal ? targetPt.y : prevPt.y;
            if (traceProgress <= 0.5) {
                const t1 = traceProgress * 2;
                const tip1 = Object.assign({}, targetPt, {
                    x: prevPt.x + (cornerX - prevPt.x) * t1,
                    y: prevPt.y + (cornerY - prevPt.y) * t1,
                    synthetic: true
                });
                return basePts.concat([tip1]);
            }
            const t2 = (traceProgress - 0.5) * 2;
            const tip2 = Object.assign({}, targetPt, {
                x: cornerX + (targetPt.x - cornerX) * t2,
                y: cornerY + (targetPt.y - cornerY) * t2,
                synthetic: true
            });
            return basePts.concat([tip2]);
        }

        const tip = Object.assign({}, targetPt, {
            x: prevPt.x + (targetPt.x - prevPt.x) * traceProgress,
            y: prevPt.y + (targetPt.y - prevPt.y) * traceProgress,
            v: prevPt.v + (targetPt.v - prevPt.v) * traceProgress
        });
        return basePts.concat([tip]);
    }

    _drawSeriesShimmer(ctx, pts, type, horizontal, progress, baseWidth, drawW, drawH, isReversed) {
        if (!pts || pts.length < 2) return;
        const span = horizontal ? drawH : drawW;
        const rawCenter = progress * (span + 100) - 50;
        const shimmerCenter = isReversed ? (span - rawCenter) : rawCenter;
        ctx.save();
        ctx.beginPath();
        ctx.rect(-2, -2, drawW + 4, drawH + 4);
        ctx.clip();
        ctx.beginPath();
        this._traceCurvePath(ctx, pts, type, horizontal);
        ctx.lineWidth = Math.max(2, baseWidth + 3);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const grad = horizontal
            ? ctx.createLinearGradient(0, shimmerCenter - 40, 0, shimmerCenter + 40)
            : ctx.createLinearGradient(shimmerCenter - 40, 0, shimmerCenter + 40, 0);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = grad;
        ctx.stroke();
        ctx.restore();
    }

    _ingestSeriesPayload(index, payload) {
        const spec = this._seriesSpecAt(index);
        const state = this._ensureSeriesState(spec.id || ('s' + index));
        state.lastRaw = payload;
        const prepared = this._payloadForSeries(spec, payload);
        const parsed = this._parseDataInput(prepared);
        if (!parsed || parsed.type === 'error') return;
        const settings = this._bufferSettings(null);
        if (parsed.type === 'single') {
            const point = { v: GraphWidget.finiteOrNull(parsed.value), t: Date.now(), l: null };
            if (!state.buffer) {
                state.buffer = [];
                state.streamSeq = 0;
            }
            if (state.streamSeq == null) {
                state.streamSeq = state.buffer.length;
                for (let i = 0; i < state.buffer.length; i++) {
                    if (state.buffer[i] && state.buffer[i].seq == null) state.buffer[i].seq = i;
                }
            }
            point.seq = state.streamSeq++;
            const prevBuf = state.buffer ? state.buffer.slice() : [];
            const unpruned = prevBuf.concat([point]);
            const nextBuf = this._pruneBuffer(unpruned, settings, 'stream');
            const droppedCount = Math.max(0, unpruned.length - nextBuf.length);
            const droppedPts = droppedCount > 0 ? prevBuf.slice(0, droppedCount) : [];
            state.buffer = nextBuf;
            state.mode = 'stream';
            this._handleSeriesDataUpdate(spec.id || ('s' + index), 'stream', prevBuf, state.buffer, droppedPts);
            return;
        }
        let key = '';
        if (typeof prepared === 'string') key = prepared;
        else {
            try { key = JSON.stringify(prepared); } catch (e) { key = String(prepared); }
        }
        if (state.mode === 'snapshot' && state.lastSnapshotKey === key) {
            this._handleSeriesDuplicatePayload(spec.id || ('s' + index), state.buffer);
            return;
        }
        const prevBuf = state.buffer ? state.buffer.slice() : [];
        state.buffer = this._pruneBuffer(GraphWidget.pointsFromParsed(parsed), settings, 'snapshot');
        state.mode = 'snapshot';
        state.lastSnapshotKey = key;
        state.streamSeq = state.buffer ? state.buffer.length : 0;
        this._handleSeriesDataUpdate(spec.id || ('s' + index), 'snapshot', prevBuf, state.buffer, []);
    }

    onLiveTopicUpdate(topic, payload) {
        const indices = this._seriesIndicesForTopic(topic);
        if (!indices.length) return false;
        if (this.usesFormulaTopic(topic)) return false;
        if (this.bindings && typeof this.bindings.page === 'string' && this.bindings.page.trim() === topic) return false;
        const norm = String(topic || '').trim();
        const replaying = typeof Dashboard !== 'undefined' && Dashboard._replayingLiveData === true;
        for (let m = 0; m < indices.length; m++) {
            const idx = indices[m];
            const spec = this._seriesSpecAt(idx);
            const state = this._ensureSeriesState(spec.id || ('s' + idx));
            if (replaying && state.hydratedTopic === norm && state.hydratedPayload === payload) {
                continue;
            }
            this._ingestSeriesPayload(idx, payload);
            state.hydratedTopic = norm;
            state.hydratedPayload = payload;
        }
        this._schedulePlotDraw();
        return true;
    }

    onIncomingData(topic, payload) {
        const indices = this._seriesIndicesForTopic(topic);
        if (indices.length > 0) {
            for (let m = 0; m < indices.length; m++) {
                this._ingestSeriesPayload(indices[m], payload);
            }
        }
        if (!topic || !this.usesFormulaTopic(topic)) return;
        const list = this._runtimeSeriesList();
        if (!list.length) return;
        const normTopic = String(topic).trim();
        const formulaTopicRe = /\{\{\s*([^{}]+?)\s*\}\}/g;
        for (let i = 0; i < list.length; i++) {
            if (indices.indexOf(i) >= 0) continue;
            const spec = list[i];
            if (!spec || !spec.id) continue;
            const formula = this.overrides['graphSeries_' + spec.id + '_data_bind_formula'];
            if (typeof formula !== 'string') continue;
            formulaTopicRe.lastIndex = 0;
            let m;
            let matches = false;
            while ((m = formulaTopicRe.exec(formula)) !== null) {
                if (String(m[1]).trim() === normTopic) {
                    matches = true;
                    break;
                }
            }
            if (!matches) continue;
            const state = this._seriesState && this._seriesState[spec.id];
            if (state && state.lastRaw !== undefined) this._ingestSeriesPayload(i, state.lastRaw);
        }
    }

    _clearTimelineTimer() {
        if (this._timelineRaf != null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._timelineRaf);
            this._timelineRaf = null;
        }
        if (this._timelineTimer != null) {
            clearInterval(this._timelineTimer);
            clearTimeout(this._timelineTimer);
            this._timelineTimer = null;
        }
        this._timelineMode = null;
        this._timelineTimerMs = null;
        this._lastTimelineTick = 0;
    }

    _graphIsOnPage() {
        const wrap = this.elements && this.elements.wrapper;
        if (!wrap || wrap.style.display === 'none') return false;
        if (typeof this._isOffActivePageFromSparseOverrides === 'function' && this._isOffActivePageFromSparseOverrides()) {
            return false;
        }
        if (typeof Dashboard !== 'undefined') {
            if (typeof Dashboard.isWidgetHiddenByGroupRuntime === 'function' && Dashboard.isWidgetHiddenByGroupRuntime(this.id)) {
                return false;
            }
            if (typeof Dashboard._widgetCoversActivePage === 'function') {
                return Dashboard._widgetCoversActivePage(this.id, this);
            }
        }
        return true;
    }

    _syncTimelineTimer(c) {
        const isRealTime = c && c.bufferMode === 'duration' && c.timelineAdvance === 'time';
        const onPage = this._graphIsOnPage() && !this._pausedInBackground;
        if (!isRealTime || !onPage) {
            this._clearTimelineTimer();
            return;
        }

        const period = GraphWidget.durationMsFrom(c.durationPreset, c.durationCustomValue, c.durationCustomUnit);
        const plotW = Math.max(100, (this.canvas && this.canvas.clientWidth) || 400);
        const idealMs = Math.round((0.5 * period) / plotW);

        const isSmoothRafMode = idealMs <= 100;
        const targetCadenceMs = isSmoothRafMode
            ? Math.max(30, idealMs)
            : Math.max(100, Math.min(2000, idealMs));

        const targetMode = isSmoothRafMode ? 'raf' : 'timer';
        if (this._timelineMode === targetMode && this._timelineTimerMs === targetCadenceMs) {
            return;
        }

        this._clearTimelineTimer();
        this._timelineMode = targetMode;
        this._timelineTimerMs = targetCadenceMs;
        this._lastTimelineTick = 0;

        if (isSmoothRafMode) {
            if (!this._boundTimelineTick) {
                this._boundTimelineTick = this._tickTimeline.bind(this);
            }
            if (typeof requestAnimationFrame === 'function') {
                this._timelineRaf = requestAnimationFrame(this._boundTimelineTick);
            }
        } else {
            if (!this._boundTimelineTimer) {
                this._boundTimelineTimer = this._onTimelineTimerFired.bind(this);
            }
            this._timelineTimer = setInterval(this._boundTimelineTimer, targetCadenceMs);
        }
    }

    _tickTimeline() {
        this._timelineRaf = null;
        if (!this._graphIsOnPage() || this._pausedInBackground) {
            this._clearTimelineTimer();
            return;
        }
        if (typeof document !== 'undefined' && document.hidden) {
            if (typeof requestAnimationFrame === 'function') {
                this._timelineRaf = requestAnimationFrame(this._boundTimelineTick);
            }
            return;
        }

        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const cadence = this._timelineTimerMs || 33;
        const elapsed = now - (this._lastTimelineTick || 0);

        if (elapsed >= cadence) {
            this._lastTimelineTick = now;
            if (!this._animRaf) {
                this._renderPlotOnly();
            }
        }

        if (typeof requestAnimationFrame === 'function') {
            this._timelineRaf = requestAnimationFrame(this._boundTimelineTick);
        }
    }

    _onTimelineTimerFired() {
        if (!this._graphIsOnPage() || this._pausedInBackground) {
            this._clearTimelineTimer();
            return;
        }
        if (typeof document !== 'undefined' && document.hidden) return;
        const self = this;
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(function () {
                if (!self._graphIsOnPage() || self._pausedInBackground) return;
                if (!self._animRaf) {
                    self._renderPlotOnly();
                }
            });
        } else {
            if (!this._animRaf) {
                this._renderPlotOnly();
            }
        }
    }

    _syncSeriesSeeds(c) {
        const list = c.series || [];
        const settings = this._bufferSettings(c);
        const keep = {};
        let startedInitialReveal = false;
        const shouldRevealOnLoad = this._needsPageRevealAnimation === true
            && c.graphAnimation && c.graphAnimation !== 'none'
            && this._graphIsOnPage();
        for (let i = 0; i < list.length; i++) {
            const spec = list[i];
            const state = this._ensureSeriesState(spec.id);
            keep[spec.id] = true;
            const dataStr = spec.data == null ? '' : String(spec.data);
            const topic = this._seriesDataTopic(i);
            if (topic) {
                if (state.hydratedTopic !== topic) {
                    state.buffer = [];
                    state.mode = 'empty';
                    state.lastSnapshotKey = null;
                    state.lastRaw = undefined;
                    state.hydratedTopic = topic;
                    state.hydratedPayload = undefined;
                }
                state.seedKey = dataStr;
                const payload = this._liveValueForTopic(topic);
                if (payload !== undefined && payload !== state.hydratedPayload) {
                    state.hydratedPayload = payload;
                    this._ingestSeriesPayload(i, payload);
                }
                continue;
            }
            if (state.hydratedTopic) {
                state.hydratedTopic = '';
                state.hydratedPayload = undefined;
                state.seedKey = null;
            }
            if (state.seedKey === dataStr) continue;
            const hadPreviousSeed = state.seedKey !== null;
            state.seedKey = dataStr;
            if (dataStr === '') {
                if (state.mode !== 'stream') state.buffer = [];
                continue;
            }
            const parsed = this._parseDataInput(dataStr);
            if (!parsed || parsed.type === 'error') continue;
            const prevBuf = state.buffer ? state.buffer.slice() : [];
            state.buffer = this._pruneBuffer(GraphWidget.pointsFromParsed(parsed), settings, parsed.type === 'single' ? 'stream' : 'snapshot');
            state.mode = parsed.type === 'single' ? 'seed' : 'snapshot';
            state.lastSnapshotKey = parsed.type === 'single' ? null : dataStr;
            state.streamSeq = state.buffer ? state.buffer.length : 0;
            if (hadPreviousSeed) {
                const seriesId = spec.id || ('s' + i);
                const editing = typeof Dashboard !== 'undefined' && Dashboard.isEditMode && !Dashboard._holdLivePreviewActive;
                if (editing) {
                    if (this._activeAnimations) delete this._activeAnimations[seriesId];
                    if (this._pendingAnimationUpdates) delete this._pendingAnimationUpdates[seriesId];
                } else {
                    this._handleSeriesDataUpdate(seriesId, parsed.type === 'single' ? 'stream' : 'snapshot', prevBuf, state.buffer, []);
                }
            } else if (shouldRevealOnLoad && this._seriesDrawn(spec) && state.buffer && state.buffer.length > 0) {
                const seriesId = spec.id || ('s' + i);
                const editing = typeof Dashboard !== 'undefined' && Dashboard.isEditMode && !Dashboard._holdLivePreviewActive;
                if (!editing) {
                    const dur = Math.max(150, Math.round(Number(c.graphAnimDuration || 2) * 1000));
                    this._startSeriesAnimation(seriesId, 'draw', 'snapshot', [], state.buffer, dur, []);
                    startedInitialReveal = true;
                }
            }
        }
        this._needsPageRevealAnimation = false;
        const ids = Object.keys(this._seriesState);
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            if (!keep[id]) {
                delete this._seriesState[id];
                if (this._activeAnimations) delete this._activeAnimations[id];
                if (this._pendingAnimationUpdates) delete this._pendingAnimationUpdates[id];
                if (this._lastPlacedPointValues) delete this._lastPlacedPointValues[id];
                if (this._sessionVisible) delete this._sessionVisible[id];
            }
        }
    }

    _seriesDrawn(spec) {
        if (!spec) return false;
        if (typeof Dashboard !== 'undefined' && Dashboard.isEditMode) {
            return spec.visible !== false;
        }
        if (this._sessionVisible && Object.prototype.hasOwnProperty.call(this._sessionVisible, spec.id)) {
            return this._sessionVisible[spec.id] !== false;
        }
        return spec.visible !== false;
    }

    _onLegendActivate(seriesId) {
        if (typeof Dashboard !== 'undefined' && Dashboard.isEditMode) {
            const list = this._runtimeSeriesList();
            const next = [];
            for (let i = 0; i < list.length; i++) {
                const row = Object.assign({}, list[i]);
                if (row.id === seriesId) row.visible = row.visible === false;
                next.push(row);
            }
            if (this._sessionVisible) delete this._sessionVisible[seriesId];
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.updateWidget === 'function') {
                Dashboard.updateWidget(this.id, { series: next });
                if (typeof Editor !== 'undefined' && Editor.currentId === this.id && typeof Editor.loadWidget === 'function') {
                    Editor.loadWidget(this.id);
                }
            } else {
                this.update({ series: next });
            }
            return;
        }
        const list = (this._plotView && this._plotView.series) || [];
        let saved = true;
        for (let i = 0; i < list.length; i++) {
            if (list[i].id === seriesId) { saved = list[i].visible !== false; break; }
        }
        const current = (this._sessionVisible && Object.prototype.hasOwnProperty.call(this._sessionVisible, seriesId))
            ? this._sessionVisible[seriesId] !== false
            : saved;
        if (!this._sessionVisible) this._sessionVisible = {};
        this._sessionVisible[seriesId] = !current;
        this._legendDomSig = '';
        this._schedulePlotDraw();
    }

    _bindLegendPointer() {
        const legend = this.legendEl;
        if (!legend || this._legendPointerBound) return;
        this._legendPointerBound = true;
        const self = this;
        legend.addEventListener('pointerdown', function (e) {
            e.stopPropagation();
            if (typeof Dashboard === 'undefined' || !Dashboard.isEditMode || typeof Dashboard.selectWidget !== 'function') return;
            if (typeof Dashboard._wantsAddToSelection === 'function' && Dashboard._wantsAddToSelection(e)) {
                Dashboard.selectWidget(self.id, true);
                return;
            }
            const ids = Dashboard.selectedIds || [];
            if (ids.indexOf(self.id) === -1 || ids.length !== 1) Dashboard.selectWidget(self.id, false);
        });
        legend.addEventListener('click', function (e) {
            let n = e.target;
            let id = '';
            while (n && n !== legend) {
                if (n.getAttribute && n.getAttribute('data-series-id')) {
                    id = n.getAttribute('data-series-id');
                    break;
                }
                n = n.parentNode;
            }
            if (!id) return;
            if (self._legendSuppressClick) {
                self._legendSuppressClick = false;
                return;
            }
            if (self._legendDragMoved) {
                self._legendDragMoved = false;
                return;
            }
            self._onLegendActivate(id);
        });
        if (typeof PointerDrag === 'undefined') return;
        this._legendPointerBinding = PointerDrag.bind(legend, {
            raf: false,
            shouldStart: function (e) {
                if (typeof Dashboard === 'undefined' || !Dashboard.isEditMode) return false;
                if (legend.dataset.stacked === '1') return false;
                return true;
            },
            onDown: function (e) {
                self._legendDragMoved = false;
                self._legendDragging = true;
                const resizing = e.target.classList && e.target.classList.contains('graph-legend-rh');
                let seriesId = '';
                if (!resizing) {
                    let n = e.target;
                    while (n && n !== legend) {
                        if (n.getAttribute && n.getAttribute('data-series-id')) {
                            seriesId = n.getAttribute('data-series-id');
                            break;
                        }
                        n = n.parentNode;
                    }
                }
                return {
                    seriesId: seriesId,
                    resizing: resizing,
                    dir: resizing ? (e.target.getAttribute('data-dir') || '') : '',
                    wasFloating: legend.dataset.position === 'floating',
                    startX: e.clientX,
                    startY: e.clientY,
                    offX: parseFloat(legend.style.left) || 0,
                    offY: parseFloat(legend.style.top) || 0,
                    w: legend.offsetWidth,
                    h: legend.offsetHeight,
                    before: {
                        legendPosition: self.overrides.legendPosition,
                        legendAutoSize: self.overrides.legendAutoSize,
                        legendOffX: self.overrides.legendOffX,
                        legendOffY: self.overrides.legendOffY,
                        legendW: self.overrides.legendW,
                        legendH: self.overrides.legendH
                    },
                    grid: (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.snapToGrid) ? (MASTER_SETTINGS.gridSize || 1) : 1
                };
            },
            onMove: function (em, ctx) {
                if (!ctx) return;
                const zoom = (typeof Dashboard !== 'undefined' && typeof Dashboard._canvasPointerScale === 'function')
                    ? Dashboard._canvasPointerScale()
                    : 1;
                const dx = (em.clientX - ctx.startX) / zoom;
                const dy = (em.clientY - ctx.startY) / zoom;
                if (Math.abs(dx) + Math.abs(dy) > 3) self._legendDragMoved = true;
                if (!self._legendDragMoved) return;
                // Dragging a docked panel detaches it: it turns floating at its
                // current on-canvas spot and then follows the pointer.
                if (!ctx.wasFloating) {
                    ctx.wasFloating = true;
                    ctx.becameFloating = true;
                    ctx.offX = parseFloat(legend.style.left) || 0;
                    ctx.offY = parseFloat(legend.style.top) || 0;
                    ctx.w = legend.offsetWidth;
                    ctx.h = legend.offsetHeight;
                    legend.dataset.position = 'floating';
                    legend.classList.add('graph-legend--floating');
                }
                const grid = ctx.grid || 1;
                if (ctx.resizing) {
                    const dir = ctx.dir || '';
                    let newW = ctx.w;
                    let newH = ctx.h;
                    let newX = ctx.offX;
                    let newY = ctx.offY;
                    if (dir.indexOf('e') !== -1) newW = ctx.w + dx;
                    if (dir.indexOf('w') !== -1) { newW = ctx.w - dx; newX = ctx.offX + dx; }
                    if (dir.indexOf('s') !== -1) newH = ctx.h + dy;
                    if (dir.indexOf('n') !== -1) { newH = ctx.h - dy; newY = ctx.offY + dy; }
                    if (dir.indexOf('e') !== -1 || dir.indexOf('w') !== -1) newW = Math.max(40, Math.round(newW / grid) * grid);
                    if (dir.indexOf('s') !== -1 || dir.indexOf('n') !== -1) newH = Math.max(24, Math.round(newH / grid) * grid);
                    if (dir.indexOf('w') !== -1) newX = Math.round(newX / grid) * grid;
                    if (dir.indexOf('n') !== -1) newY = Math.round(newY / grid) * grid;
                    ctx.nextW = newW;
                    ctx.nextH = newH;
                    ctx.nextX = newX;
                    ctx.nextY = newY;
                    legend.style.width = newW + 'px';
                    legend.style.height = newH + 'px';
                    legend.style.left = newX + 'px';
                    legend.style.top = newY + 'px';
                    BaseWidget.syncCompanionCanvasClipping(legend, self.legendBody, newX, newY, newW, newH);
                } else {
                    ctx.nextX = Math.round((ctx.offX + dx) / grid) * grid;
                    ctx.nextY = Math.round((ctx.offY + dy) / grid) * grid;
                    legend.style.left = ctx.nextX + 'px';
                    legend.style.top = ctx.nextY + 'px';
                    BaseWidget.syncCompanionCanvasClipping(legend, self.legendBody, ctx.nextX, ctx.nextY, ctx.w, ctx.h);
                }
            },
            onUp: function (ev, ctx) {
                self._legendDragging = false;
                if (!ctx) return;
                if (!self._legendDragMoved) {
                    if (ctx.seriesId) {
                        self._legendSuppressClick = true;
                        self._onLegendActivate(ctx.seriesId);
                    }
                    return;
                }
                const patch = {};
                if (ctx.becameFloating) patch.legendPosition = 'floating';
                if (ctx.resizing) {
                    patch.legendAutoSize = false;
                    patch.legendW = ctx.nextW;
                    patch.legendH = ctx.nextH;
                    patch.legendOffX = ctx.nextX;
                    patch.legendOffY = ctx.nextY;
                    patch.legendPosition = 'floating';
                } else {
                    patch.legendOffX = ctx.nextX;
                    patch.legendOffY = ctx.nextY;
                }
                self.update(patch);
                if (typeof Dashboard !== 'undefined' && typeof Dashboard.markUnsaved === 'function') {
                    Dashboard.markUnsaved();
                }
                const afterLegend = {
                    legendPosition: self.overrides.legendPosition,
                    legendAutoSize: self.overrides.legendAutoSize,
                    legendOffX: self.overrides.legendOffX,
                    legendOffY: self.overrides.legendOffY,
                    legendW: self.overrides.legendW,
                    legendH: self.overrides.legendH
                };
                if (typeof Dashboard !== 'undefined' && Dashboard._recordHistoryEntry && typeof Dashboard._isEqualJson === 'function'
                    && !Dashboard._isEqualJson(ctx.before, afterLegend)) {
                    Dashboard._recordHistoryEntry({
                        kind: 'widget-overrides',
                        id: self.id,
                        before: ctx.before,
                        after: afterLegend
                    });
                }
                if (typeof Editor !== 'undefined' && typeof Editor.notifyExternalWidgetChange === 'function') {
                    Editor.notifyExternalWidgetChange(self.id, true);
                }
            }
        });
    }

    _legendMountKey(c) {
        if (!c || !c.showLegend) return 'hidden';
        if (typeof BaseWidget !== 'undefined'
            && (typeof BaseWidget.usesResponsiveGridLayout === 'function'
                ? BaseWidget.usesResponsiveGridLayout(this)
                : (BaseWidget.isResponsiveMode && BaseWidget.isResponsiveMode()))) {
            return 'stacked';
        }
        return 'canvas';
    }

    _widgetBox() {
        const o = this.overrides || {};
        const num = function (v, fallback) {
            const n = Number(v);
            return isFinite(n) ? n : fallback;
        };
        let x = num(o.x, 0);
        let y = num(o.y, 0);
        let w = num(o.width, 0);
        let h = num(o.height, 0);
        const wrap = this.elements && this.elements.wrapper;
        if (wrap && wrap.style) {
            const sl = parseFloat(wrap.style.left);
            const st = parseFloat(wrap.style.top);
            const sw = parseFloat(wrap.style.width);
            const sh = parseFloat(wrap.style.height);
            if (isFinite(sl)) x = sl;
            if (isFinite(st)) y = st;
            if (isFinite(sw) && sw > 0) w = sw;
            if (isFinite(sh) && sh > 0) h = sh;
        }
        const container = this.elements && this.elements.container;
        if (container && container.style) {
            if (!(w > 0)) {
                const cw = parseFloat(container.style.width);
                if (isFinite(cw) && cw > 0) w = cw;
            }
            if (!(h > 0)) {
                const ch = parseFloat(container.style.height);
                if (isFinite(ch) && ch > 0) h = ch;
            }
        }
        return { x: x, y: y, w: w, h: h };
    }

    _legendHost() {
        const wrap = this.elements && this.elements.wrapper;
        if (wrap && wrap.parentNode) return wrap.parentNode;
        return document.getElementById('dashboard-canvas');
    }

    _legendFrame(c, measured) {
        const box = this._widgetBox();
        const gap = 8;
        const pos = c.legendPosition || 'right';
        const lw = (measured && measured.width > 0) ? measured.width : (c.legendW > 0 ? c.legendW : 160);
        const lh = (measured && measured.height > 0) ? measured.height : (c.legendH > 0 ? c.legendH : 72);
        if (pos === 'floating') {
            const left = c.legendOffX != null ? c.legendOffX : (box.x + box.w + gap);
            const top = c.legendOffY != null ? c.legendOffY : box.y;
            return { left: left, top: top, width: lw, height: lh };
        }
        if (pos === 'left') return { left: Math.max(0, box.x - lw - gap), top: Math.max(0, box.y), width: lw, height: lh };
        if (pos === 'top') return { left: Math.max(0, box.x), top: Math.max(0, box.y - lh - gap), width: lw, height: lh };
        if (pos === 'bottom') return { left: Math.max(0, box.x), top: box.y + box.h + gap, width: lw, height: lh };
        return { left: box.x + box.w + gap, top: Math.max(0, box.y), width: lw, height: lh };
    }

    _syncLegend(c) {
        const legend = this.legendEl;
        const host = this.elements && this.elements.innerContent;
        if (!legend || !host) return;
        const isWarming = typeof Dashboard !== 'undefined' && Dashboard._offPageWarmRender === true;
        const isOffPage = !this._graphIsOnPage();
        if (isWarming || isOffPage) {
            this._legendHiddenForPage = true;
            legend.style.display = 'none';
            this._syncLegendHandles(c);
            this._noteLegendAnchor();
            return;
        }
        if (this._legendDragging) return;
        const mount = this._legendMountKey(c);
        const rawPos = (c && c.legendPosition) || 'right';
        const pos = (mount === 'stacked' && rawPos === 'floating') ? 'bottom' : rawPos;
        legend.dataset.position = pos;
        legend.dataset.stacked = mount === 'stacked' ? '1' : '0';
        host.style.flexDirection = 'column';
        if (this._legendMountApplied !== mount || (mount === 'stacked' && this._prevStackedPos !== pos)) {
            const wasStacked = this._legendMountApplied === 'stacked';
            this._legendMountApplied = mount;
            this._prevStackedPos = pos;
            if ((mount === 'stacked' || wasStacked)
                && typeof Dashboard !== 'undefined'
                && typeof Dashboard._requestResponsiveReflow === 'function') {
                Dashboard._requestResponsiveReflow(this.id);
            }
        }
        if (!c.showLegend || mount === 'hidden') {
            legend.style.display = 'none';
            if (this.bodyWrap) {
                this.bodyWrap.style.flexDirection = 'column';
                this.bodyWrap.style.alignItems = '';
            }
            if (this.chartWrap) {
                this.chartWrap.style.flex = '1';
                this.chartWrap.style.width = '100%';
                this.chartWrap.style.height = '100%';
                this.chartWrap.style.minWidth = '0';
            }
            this._syncLegendHandles(c);
            this._noteLegendAnchor();
            return;
        }
        const auto = c.legendAutoSize === true;
        const layoutClass = c.legendLayout === 'column' ? ' graph-legend--column' : '';
        const themeSig = (typeof BaseWidget !== 'undefined' && typeof BaseWidget.getThemeColorsSignature === 'function')
            ? BaseWidget.getThemeColorsSignature()
            : '';
        const typoCol = (typeof BaseWidget !== 'undefined' && typeof BaseWidget.resolveCssColor === 'function')
            ? BaseWidget.resolveCssColor(c.legendItemCol)
            : (c.legendItemCol || '');
        const showLegendContainer = c.legendShowContainer === true;
        const chromeSig = (showLegendContainer ? '1' : '0') + ':' + (c.bgColStart || '') + ':' + (c.bgOpacityStart != null ? c.bgOpacityStart : '') + ':' + (c.bgColEnd || '') + ':' + (c.bgOpacityEnd != null ? c.bgOpacityEnd : '') + ':' + (c.bgAngle != null ? c.bgAngle : '') + ':' + (c.borderColor || '') + ':' + (c.borderWidth != null ? c.borderWidth : '') + ':' + (c.borderOpacity != null ? c.borderOpacity : '') + ':' + (c.cornerRadius != null ? c.cornerRadius : '') + ':' + (c.bgBlur != null ? c.bgBlur : '') + ':' + (c.glowEnabled ? '1' : '0') + ':' + (c.glowColor || '') + ':' + (c.glowRadius != null ? c.glowRadius : '') + ':' + (c.glowOpacity != null ? c.glowOpacity : '') + ':' + (c.innerGlow || 0) + ':' + (c.innerGlowColor || '') + ':' + (c.innerGlowOpacity || 0);
        let sig = mount + '|' + pos + '|' + (showLegendContainer ? '1' : '0') + '|' + c.legendLayout + '|' + c.legendSwatch + '|' + c.type + '|' + typoCol + '|' + (c.legendItemFont || '') + '|' + (c.legendItemFs || '') + '|' + (c.legendItemBold ? '1' : '0') + '|' + (c.legendItemItalic ? '1' : '0') + '|' + (c.legendItemOpacity != null ? c.legendItemOpacity : '') + '|' + (c.deactivated ? '1' : '0') + '|' + themeSig + '|' + chromeSig;
        const list = c.series || [];
        for (let i = 0; i < list.length; i++) {
            const s = list[i];
            const col = this._resolvePlotColor(c.deactivated ? BaseWidget.getDeactivatedColorAccent(c) : s.positiveColor, 100);
            sig += '|' + s.id + ':' + s.name + ':' + col + ':' + (this._seriesDrawn(s) ? '1' : '0');
        }
        const sigChanged = (this._legendDomSig !== sig);
        if (sigChanged) {
            const legendChrome = Object.assign({}, c, {
                bgVisible: showLegendContainer
            });
            BaseWidget.applyContainerChromeToElement(this.legendBody, legendChrome);
            legend.style.background = 'transparent';
            legend.style.border = 'none';
            legend.style.boxShadow = 'none';
            legend.style.borderRadius = (c && c.cornerRadius != null ? c.cornerRadius : 0) + 'px';
            this._legendDomSig = sig;
        }
        if (mount === 'stacked') {
            this._legendHiddenForPage = false;
            const bodyWrap = this.bodyWrap || host;
            const chartWrap = this.chartWrap;

            if (pos === 'top') {
                bodyWrap.style.flexDirection = 'column';
                bodyWrap.style.alignItems = '';
                legend.className = 'graph-legend graph-legend--stacked graph-legend--top' + layoutClass + (auto ? ' graph-legend--autosize' : '');
                legend.style.position = 'relative';
                legend.style.zIndex = '';
                legend.style.left = '';
                legend.style.top = '';
                legend.style.width = '100%';
                legend.style.height = auto ? '' : (c.legendH > 0 ? (c.legendH + 'px') : '');
                legend.style.maxWidth = '';
                legend.style.flexShrink = '0';
                legend.style.display = '';
                if (chartWrap && legend.nextSibling !== chartWrap) {
                    bodyWrap.insertBefore(legend, chartWrap);
                } else if (legend.parentNode !== bodyWrap) {
                    bodyWrap.insertBefore(legend, bodyWrap.firstChild);
                }
                if (chartWrap) {
                    chartWrap.style.flex = '1';
                    chartWrap.style.width = '100%';
                    chartWrap.style.height = '';
                    chartWrap.style.minWidth = '0';
                }
            } else if (pos === 'bottom') {
                bodyWrap.style.flexDirection = 'column';
                bodyWrap.style.alignItems = '';
                legend.className = 'graph-legend graph-legend--stacked graph-legend--bottom' + layoutClass + (auto ? ' graph-legend--autosize' : '');
                legend.style.position = 'relative';
                legend.style.zIndex = '';
                legend.style.left = '';
                legend.style.top = '';
                legend.style.width = '100%';
                legend.style.height = auto ? '' : (c.legendH > 0 ? (c.legendH + 'px') : '');
                legend.style.maxWidth = '';
                legend.style.flexShrink = '0';
                legend.style.display = '';
                if (legend.parentNode !== bodyWrap || bodyWrap.lastChild !== legend) {
                    bodyWrap.appendChild(legend);
                }
                if (chartWrap) {
                    chartWrap.style.flex = '1';
                    chartWrap.style.width = '100%';
                    chartWrap.style.height = '';
                    chartWrap.style.minWidth = '0';
                }
            } else if (pos === 'left') {
                bodyWrap.style.flexDirection = 'row';
                bodyWrap.style.alignItems = 'stretch';
                legend.className = 'graph-legend graph-legend--stacked graph-legend--left' + layoutClass + (auto ? ' graph-legend--autosize' : '');
                legend.style.position = 'relative';
                legend.style.zIndex = '';
                legend.style.left = '';
                legend.style.top = '';
                legend.style.flexShrink = '0';
                const lw = c.legendW > 0 ? c.legendW : (c.defaultGraphLegendWidth || 160);
                legend.style.width = auto ? 'auto' : (lw + 'px');
                legend.style.maxWidth = '50%';
                legend.style.height = auto ? '100%' : (c.legendH > 0 ? (c.legendH + 'px') : '100%');
                legend.style.display = '';
                if (chartWrap && legend.nextSibling !== chartWrap) {
                    bodyWrap.insertBefore(legend, chartWrap);
                } else if (legend.parentNode !== bodyWrap) {
                    bodyWrap.insertBefore(legend, bodyWrap.firstChild);
                }
                if (chartWrap) {
                    chartWrap.style.flex = '1';
                    chartWrap.style.width = 'auto';
                    chartWrap.style.height = '100%';
                    chartWrap.style.minWidth = '0';
                }
            } else {
                // right
                bodyWrap.style.flexDirection = 'row';
                bodyWrap.style.alignItems = 'stretch';
                legend.className = 'graph-legend graph-legend--stacked graph-legend--right' + layoutClass + (auto ? ' graph-legend--autosize' : '');
                legend.style.position = 'relative';
                legend.style.zIndex = '';
                legend.style.left = '';
                legend.style.top = '';
                legend.style.flexShrink = '0';
                const lw = c.legendW > 0 ? c.legendW : (c.defaultGraphLegendWidth || 160);
                legend.style.width = auto ? 'auto' : (lw + 'px');
                legend.style.maxWidth = '50%';
                legend.style.height = auto ? '100%' : (c.legendH > 0 ? (c.legendH + 'px') : '100%');
                legend.style.display = '';
                if (legend.parentNode !== bodyWrap || bodyWrap.lastChild !== legend) {
                    bodyWrap.appendChild(legend);
                }
                if (chartWrap) {
                    chartWrap.style.flex = '1';
                    chartWrap.style.width = 'auto';
                    chartWrap.style.height = '100%';
                    chartWrap.style.minWidth = '0';
                }
            }
        } else {
            const bodyWrap = this.bodyWrap || host;
            bodyWrap.style.flexDirection = 'column';
            bodyWrap.style.alignItems = '';
            if (this.chartWrap) {
                this.chartWrap.style.flex = '1';
                this.chartWrap.style.width = '100%';
                this.chartWrap.style.height = '100%';
                this.chartWrap.style.minWidth = '0';
            }
            legend.className = 'graph-legend' + layoutClass + (pos === 'floating' ? ' graph-legend--floating' : '') + (auto ? ' graph-legend--autosize' : '');
            legend.style.position = 'absolute';
            legend.style.zIndex = '20';
            legend.style.maxWidth = '';
            legend.style.flexShrink = '';
            const parent = this._legendHost();
            if (parent && legend.parentNode !== parent) parent.appendChild(legend);
            legend.style.display = this._legendHiddenForPage ? 'none' : '';
            if (!this._legendHiddenForPage) this._placeLegendPanel(c, legend, auto);
        }
        this._syncLegendHandles(c);
        if (!sigChanged) {
            this._noteLegendAnchor();
            return;
        }
        const itemsHost = this.legendBody || legend;
        while (itemsHost.firstChild) itemsHost.removeChild(itemsHost.firstChild);
        for (let i = 0; i < list.length; i++) {
            const s = list[i];
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'graph-legend-item' + (this._seriesDrawn(s) ? '' : ' is-hidden');
            btn.setAttribute('data-series-id', s.id);
            btn.title = s.name || ('Graph ' + (i + 1));
            const sw = document.createElement('span');
            let swClass = 'graph-legend-swatch';
            if (c.legendSwatch === 'square') swClass += ' graph-legend-swatch--square';
            else if (c.legendSwatch === 'circle') swClass += ' graph-legend-swatch--circle';
            sw.className = swClass;
            sw.style.background = this._resolvePlotColor(c.deactivated ? BaseWidget.getDeactivatedColorAccent(c) : s.positiveColor, 100);
            const name = document.createElement('span');
            name.className = 'graph-legend-name';
            name.textContent = s.name || ('Graph ' + (i + 1));
            this.applyTypographyToElement(name, 'legendItem', c);
            btn.appendChild(sw);
            btn.appendChild(name);
            itemsHost.appendChild(btn);
        }
        if (mount === 'canvas' && !this._legendHiddenForPage) this._placeLegendPanel(c, legend, auto);
        this._noteLegendAnchor();
    }

    _placeLegendPanel(c, legend, auto) {
        if (auto) {
            legend.style.width = '';
            legend.style.height = '';
            const measured = { width: legend.offsetWidth, height: legend.offsetHeight };
            const frame = this._legendFrame(c, measured);
            legend.style.left = frame.left + 'px';
            legend.style.top = frame.top + 'px';
            BaseWidget.syncCompanionCanvasClipping(legend, this.legendBody, frame.left, frame.top, measured.width, measured.height);
            return;
        }
        const frame = this._legendFrame(c);
        legend.style.left = frame.left + 'px';
        legend.style.top = frame.top + 'px';
        const w = Math.max(40, frame.width);
        const h = Math.max(24, frame.height);
        legend.style.width = w + 'px';
        legend.style.height = h + 'px';
        BaseWidget.syncCompanionCanvasClipping(legend, this.legendBody, frame.left, frame.top, w, h);
    }

    _syncCanvasBoundaryClipping(optX, optY, optW, optH, skipLabelSync) {
        super._syncCanvasBoundaryClipping(optX, optY, optW, optH, skipLabelSync);
        if (this.legendEl && this.legendEl.dataset.stacked !== '1') {
            const left = parseFloat(this.legendEl.style.left) || 0;
            const top = parseFloat(this.legendEl.style.top) || 0;
            const w = this.legendEl.offsetWidth || 0;
            const h = this.legendEl.offsetHeight || 0;
            BaseWidget.syncCompanionCanvasClipping(this.legendEl, this.legendBody, left, top, w, h);
        }
    }

    select() {
        BaseWidget.prototype.select.call(this);
        this._syncLegendHandles(null);
    }

    deselect() {
        BaseWidget.prototype.deselect.call(this);
        this._syncLegendHandles(null);
    }

    _syncEditModeVisuals(resolved) {
        BaseWidget.prototype._syncEditModeVisuals.call(this, resolved);
        this._syncLegendHandles(resolved);
    }

    _syncLegendHandles(c) {
        const legend = this.legendEl;
        const handles = this.legendHandles;
        if (!legend || !handles) return;
        const stacked = legend.dataset.stacked === '1';
        const editing = typeof Dashboard !== 'undefined' && Dashboard.isEditMode && !Dashboard._holdLivePreviewActive;
        const ids = (editing && Array.isArray(Dashboard.selectedIds)) ? Dashboard.selectedIds : [];
        let selected = false;
        let multi = false;
        for (let i = 0; i < ids.length; i++) {
            if (ids[i] !== this.id) continue;
            if (ids.length === 1) selected = true;
            else multi = true;
        }
        const locked = typeof Dashboard !== 'undefined' && typeof Dashboard.isWidgetEffectivelyLocked === 'function'
            ? Dashboard.isWidgetEffectivelyLocked(this.id)
            : !!(c && c.locked);
        const hidden = legend.style.display === 'none';
        const show = selected && !stacked && !locked && !hidden;
        for (let i = 0; i < handles.length; i++) {
            handles[i].style.display = show ? 'block' : 'none';
        }
        legend.classList.toggle('selected', !!show);
        legend.classList.toggle('multi-selected', !!(multi && !stacked && !hidden));
        legend.classList.toggle('is-selected', !!show);
        legend.classList.toggle('is-multi-selected', !!(multi && !stacked && !hidden));
    }

    /**
     * Same zero the pre-2.2 bar chart used for Negative Handling.
     * Dynamic Floor uses the smallest sample, so nothing sits below it.
     */
    _barNegativeBaseline(c) {
        if (c.useBaseline === true) {
            const b = Number(c.baselineVal);
            return isFinite(b) ? b : 0;
        }
        return 0;
    }

    /**
     * Show as Positive mirrors a sample above the baseline and keeps it negative
     * for color. The plotted value alone can no longer tell the two apart.
     */
    _mapBarSample(v, c, baseline) {
        const n = GraphWidget.finiteOrNull(v);
        if (n == null) return null;
        if (c.type === 'text') return { value: n, negative: false, rawVal: n };
        const base = isFinite(baseline) ? baseline : 0;
        const negative = n < base;
        if (negative && c.negMode === 'ignore') return null;
        let value = n;
        if (negative && c.negMode === 'show_pos') value = base + (base - n);
        return { value: value, negative: negative, rawVal: n };
    }

    _placeValue(cat, value, geom, clamp) {
        const span = geom.span || 1;
        let frac = (value - geom.renderMin) / span;
        if (clamp === true) {
            if (frac < 0) frac = 0;
            if (frac > 1) frac = 1;
        } else if (isFinite(frac)) {
            if (frac < -20) frac = -20;
            else if (frac > 20) frac = 20;
        } else {
            frac = 0;
        }
        if (geom.horizontal) return { x: frac * geom.drawW, y: cat * geom.drawH };
        return { x: cat * geom.drawW, y: geom.drawH - frac * geom.drawH };
    }

    _rotatedLabelBox(text, fontSize, family, bold, angleDeg) {
        const w = this._estimateGraphTextWidth(text, fontSize, family, bold);
        const lines = String(text || '').split('\n').length;
        const h = Math.max(1, lines) * Math.max(1, Number(fontSize) || 10) * 1.25;
        const rad = Math.abs(Number(angleDeg) || 0) * Math.PI / 180;
        return {
            w: w * Math.abs(Math.cos(rad)) + h * Math.abs(Math.sin(rad)),
            h: w * Math.abs(Math.sin(rad)) + h * Math.abs(Math.cos(rad)),
            rawW: w,
            rawH: h
        };
    }

    _widestLabelBox(texts, fontSize, family, bold, angle) {
        let w = 0;
        let h = 0;
        const list = texts || [];
        for (let i = 0; i < list.length; i++) {
            if (list[i] == null || list[i] === '') continue;
            const box = this._rotatedLabelBox(list[i], fontSize, family, bold, angle);
            if (box.w > w) w = box.w;
            if (box.h > h) h = box.h;
        }
        return { w: w, h: h };
    }

    /**
     * Room for the real tick strings. A fixed axis width is a minimum, so a
     * narrow width cannot clip a longer label. End labels need half their
     * width, with no cap, or the first and last dates draw off the canvas.
     */
    _graphAxisReserve(c, horizontal, yTexts, catTexts, edgeTexts) {
        const catOnBottom = !horizontal;
        const catBox = this._widestLabelBox(catTexts, c.axisXFontSize, c.axisXFont, c.axisXFontBold, c.categoryLabelRotation);
        const valBox = this._widestLabelBox(yTexts, c.axisYFontSize, c.axisYFont, c.axisYFontBold, c.valueLabelRotation);
        const pad = 6;
        let reservedLeft = 0;
        let reservedRight = 8;
        let reservedBottom = 0;
        let reservedTop = 4;
        const offX = Math.max(0, Number(c.axisOffX) || 0);
        const offY = Math.max(0, Number(c.axisOffY) || 0);
        if (c.showAxisY) {
            if (horizontal) {
                reservedBottom = Math.max(c.axisWidthY > 0 ? c.axisWidthY : 0, valBox.h + pad + offX);
                reservedLeft = Math.max(reservedLeft, valBox.w / 2 + pad);
                reservedRight = Math.max(reservedRight, valBox.w / 2 + pad);
            } else {
                reservedLeft = Math.max(c.axisWidthY > 0 ? c.axisWidthY : 0, valBox.w + pad + offX);
                reservedTop = Math.max(reservedTop, valBox.h / 2 + 2);
            }
        }
        if (c.showAxisX) {
            if (catOnBottom) {
                reservedBottom = Math.max(reservedBottom, c.axisWidthX > 0 ? c.axisWidthX : 0, catBox.h + pad + offY);
                reservedRight = Math.max(reservedRight, catBox.w / 2 + pad);
                reservedLeft = Math.max(reservedLeft, catBox.w / 2 + pad);
            } else {
                reservedLeft = Math.max(reservedLeft, c.axisWidthX > 0 ? c.axisWidthX : 0, catBox.w + pad + offY);
                reservedTop = Math.max(reservedTop, catBox.h / 2 + 2);
            }
        }
        if (edgeTexts && edgeTexts.length) {
            const isText = c.type === 'text';
            const isBar = c.type === 'bar';
            const fs = isText ? (c.textSize || 10) : (isBar ? (c.pointValBarFs || 10) : (c.pointValFs || 10));
            const family = isText ? c.textFont : (isBar ? c.pointValBarFont : c.pointValFont);
            const bold = isText ? c.textFontBold : (isBar ? c.pointValBarBold : c.pointValBold);
            let ew = 0;
            for (let i = 0; i < edgeTexts.length; i++) {
                const w = this._estimateGraphTextWidth(edgeTexts[i], fs, family, bold);
                if (w > ew) ew = w;
            }
            const eh = Math.max(1, Number(fs) || 10) * 1.25;
            reservedLeft = Math.max(reservedLeft, ew / 2 + pad);
            reservedRight = Math.max(reservedRight, ew / 2 + pad);
            reservedTop = Math.max(reservedTop, eh / 2 + 2);
            reservedBottom = Math.max(reservedBottom, eh / 2 + 2);
        }
        return {
            left: reservedLeft,
            right: reservedRight,
            top: reservedTop,
            bottom: reservedBottom,
            catBox: { w: Math.max(8, catBox.w), h: Math.max(8, catBox.h) }
        };
    }

    _fitGraphReserve(box, reserve) {
        const minPlot = 24;
        let left = reserve.left;
        let right = reserve.right;
        let top = reserve.top;
        let bottom = reserve.bottom;
        const maxX = Math.max(0, box.w - minPlot);
        if (left + right > maxX && (left + right) > 0) {
            const scale = maxX / (left + right);
            left *= scale;
            right *= scale;
        }
        const maxY = Math.max(0, box.h - minPlot);
        if (top + bottom > maxY && (top + bottom) > 0) {
            const scale = maxY / (top + bottom);
            top *= scale;
            bottom *= scale;
        }
        return { left: left, right: right, top: top, bottom: bottom, catBox: reserve.catBox };
    }

    _shiftLabelAnchor(x, y, rawW, rawH, align, baseline, limits) {
        if (!limits || !isFinite(rawW) || !isFinite(rawH)) return { x: x, y: y };
        let left = x;
        let top = y;
        if (align === 'center') left = x - rawW / 2;
        else if (align === 'right') left = x - rawW;
        if (baseline === 'middle') top = y - rawH / 2;
        else if (baseline === 'bottom') top = y - rawH;
        const spanX = limits.maxX - limits.minX;
        const spanY = limits.maxY - limits.minY;
        let dx = 0;
        let dy = 0;
        if (rawW >= spanX) dx = limits.minX - left;
        else {
            if (left < limits.minX) dx = limits.minX - left;
            if (left + rawW + dx > limits.maxX) dx = limits.maxX - (left + rawW);
        }
        if (rawH >= spanY) dy = limits.minY - top;
        else {
            if (top < limits.minY) dy = limits.minY - top;
            if (top + rawH + dy > limits.maxY) dy = limits.maxY - (top + rawH);
        }
        return { x: x + dx, y: y + dy };
    }

    _drawEdgeLabel(ctx, text, x, y, angleDeg, edge, fit) {
        const rad = (Number(angleDeg) || 0) * Math.PI / 180;
        let ax = x;
        let ay = y;
        if (fit && fit.limits) {
            const box = this._rotatedLabelBox(text, fit.fontSize, fit.family, fit.bold, angleDeg);
            let align = 'right';
            let baseline = 'middle';
            if (edge === 'bottom') {
                baseline = 'top';
                if (rad < -0.001) align = 'right';
                else if (rad > 0.001) align = 'left';
                else align = 'center';
            }
            const shifted = this._shiftLabelAnchor(ax, ay, box.w, box.h, align, baseline, fit.limits);
            ax = shifted.x;
            ay = shifted.y;
        }
        const lines = String(text || '').split('\n');
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(rad);
        if (edge === 'bottom') {
            if (rad < -0.001) { ctx.textAlign = 'right'; ctx.textBaseline = 'top'; }
            else if (rad > 0.001) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; }
            else { ctx.textAlign = 'center'; ctx.textBaseline = 'top'; }
        } else {
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
        }
        const fs = parseFloat(ctx.font) || 10;
        const lh = fs * 1.2;
        const start = edge === 'bottom' ? 0 : -((lines.length - 1) * lh) / 2;
        for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], 0, start + i * lh);
        ctx.restore();
    }

    static traceRoundRect(ctx, x, y, w, h, r) {
        let rx = x;
        let ry = y;
        let rw = w;
        let rh = h;
        if (rw < 0) { rx += rw; rw = -rw; }
        if (rh < 0) { ry += rh; rh = -rh; }
        const radius = Math.max(0, Math.min(r || 0, rw / 2, rh / 2));
        ctx.beginPath();
        if (radius <= 0) {
            ctx.rect(rx, ry, rw, rh);
            return;
        }
        const x2 = rx + rw;
        const y2 = ry + rh;
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(x2 - radius, ry);
        ctx.quadraticCurveTo(x2, ry, x2, ry + radius);
        ctx.lineTo(x2, y2 - radius);
        ctx.quadraticCurveTo(x2, y2, x2 - radius, y2);
        ctx.lineTo(rx + radius, y2);
        ctx.quadraticCurveTo(rx, y2, rx, y2 - radius);
        ctx.lineTo(rx, ry + radius);
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
        ctx.closePath();
    }

    _renderPlotOnly() {
        const c = this._plotView || this.config;
        this._paintGraph(c);
    }

    _renderSpecific(resolvedConfig) {
        const c = resolvedConfig || this.config;
        this._plotView = c;
        if (this.lblEl) {
            this.lblEl.textContent = c.label || '';
            this.lblEl.style.display = c.label ? 'block' : 'none';
            this.applyTypographyToElement(this.lblEl, 'label', c);
            this.lblEl.style.transform = 'translate(' + (c.labelOffX || 0) + 'px, ' + (c.labelOffY || 0) + 'px)';
        }
        if (this.chartWrap) {
            this.chartWrap.style.transform = 'translate(' + (c.graphOffX || 0) + 'px, ' + (c.graphOffY || 0) + 'px)';
        }
        this._syncSeriesSeeds(c);
        this._syncLegend(c);
        this._syncTimelineTimer(c);
        this._paintGraph(c);
    }

    _buildSeriesPlotRows(c) {
        const rows = [];
        let tMin = Infinity;
        let tMax = -Infinity;
        let anyTime = false;
        let maxLen = 1;
        const list = c.series || [];
        for (let i = 0; i < list.length; i++) {
            const spec = list[i];
            const drawn = this._seriesDrawn(spec);
            const state = this._seriesState[spec.id];
            const rawStateBuf = state && state.buffer ? state.buffer : [];
            const anim = this._activeAnimations && this._activeAnimations[spec.id];
            const buf = anim ? this._computeAnimatedBuffer(anim, rawStateBuf) : rawStateBuf;
            if (anim) anim.currentBuffer = buf;

            let logicalLen = 0;
            for (let p = 0; p < buf.length; p++) {
                if (buf[p] && !buf[p].isDropped) logicalLen++;
            }
            if (logicalLen > maxLen) maxLen = logicalLen;

            if (drawn) {
                for (let p = 0; p < buf.length; p++) {
                    const pt = buf[p];
                    if (pt && !pt.isDropped && pt.t != null && isFinite(pt.t)) {
                        anyTime = true;
                        if (pt.t < tMin) tMin = pt.t;
                        if (pt.t > tMax) tMax = pt.t;
                    }
                }
            }
            rows.push({ spec: spec, buf: buf, drawn: drawn, anim: anim, logicalLen: logicalLen });
        }

        let domain = null;
        const useTimeDomain = c.bufferMode === 'duration' || GraphWidget.graphTimeFormatUsesTimestamp(c.timeFormat);
        if (useTimeDomain && anyTime && isFinite(tMin) && isFinite(tMax)) {
            if (c.bufferMode === 'duration') {
                const period = GraphWidget.durationMsFrom(c.durationPreset, c.durationCustomValue, c.durationCustomUnit);
                const isRealTime = c.timelineAdvance === 'time';
                const now = Date.now();
                const windowEnd = isRealTime ? now : tMax;
                let windowStart;
                if (c.fixedTimeWindow) {
                    windowStart = windowEnd - period;
                } else {
                    const dataSpan = windowEnd - tMin;
                    const periodPassed = dataSpan >= (period * 0.9);
                    windowStart = periodPassed ? (windowEnd - period) : tMin;
                }
                const t0 = windowStart;
                const t1 = windowEnd > windowStart ? windowEnd : windowStart + 1;
                domain = { t0: t0, t1: t1, isTime: true, period: period, sample: null };
            } else {
                domain = { t0: tMin, t1: tMax === tMin ? tMax + 1 : tMax, isTime: true, sample: null };
            }
        }
        return { rows: rows, domain: domain, maxLen: maxLen };
    }

    _projectSeriesPoints(c, rows, domain, maxLen, horizontal, isReversed) {
        const self = this;
        const applyMul = function (spec, v) {
            const n = GraphWidget.finiteOrNull(v);
            if (n == null) return null;
            const mul = spec && spec.valueMultiplier != null ? Number(spec.valueMultiplier) : 0;
            if (!isFinite(mul) || mul === 0) return n;
            return n * mul;
        };
        const barBaseline = this._barNegativeBaseline(c);
        const scaleV = function (spec, v) {
            const scaled = applyMul(spec, v);
            if (scaled == null) return { value: null, negative: false, rawVal: null };
            const mapped = self._mapBarSample(scaled, c, barBaseline);
            if (!mapped) return { value: null, negative: false, rawVal: scaled };
            return mapped;
        };

        const placed = [];
        let dataMin = Infinity;
        let dataMax = -Infinity;
        let finiteCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const pts = [];
            const buf = row.buf;
            const anim = row.anim;
            const slots = Math.max(1, maxLen);
            let denom = Math.max(1, slots - 1);

            if (anim && anim.updateMode === 'stream' && (!anim.droppedPoints || anim.droppedPoints.length === 0)) {
                if (anim.fromBuffer && anim.toBuffer && anim.toBuffer.length > anim.fromBuffer.length && anim.fromBuffer.length > 1) {
                    const fromDenom = anim.fromBuffer.length - 1;
                    const toDenom = anim.toBuffer.length - 1;
                    const shiftP = anim.streamShiftProgress != null ? anim.streamShiftProgress : 1.0;
                    denom = fromDenom + shiftP * (toDenom - fromDenom);
                }
            }

            let conveyorShiftSlots = 0;
            if (anim) {
                if (anim.updateMode === 'stream' && anim.streamShiftProgress != null && anim.droppedPoints && anim.droppedPoints.length > 0) {
                    conveyorShiftSlots = (1.0 - anim.streamShiftProgress) * anim.droppedPoints.length;
                } else if (anim.morphShiftProgress != null && anim.morphShiftSlots > 0) {
                    conveyorShiftSlots = (1.0 - anim.morphShiftProgress) * anim.morphShiftSlots;
                }
            }

            if (domain) {
                const span = domain.t1 - domain.t0 || 1;
                const untimed = [];
                for (let p = 0; p < buf.length; p++) {
                    const item = buf[p];
                    if (!item) continue;
                    if (item.t != null && isFinite(item.t)) {
                        const rawCat = (item.t - domain.t0) / span;
                        const cat = isReversed ? (1 - rawCat) : rawCat;
                        const scaled = scaleV(row.spec, item.v);
                        const scaledFrom = item.fromVal != null ? scaleV(row.spec, item.fromVal) : null;
                        const scaledTo = item.toVal != null ? scaleV(row.spec, item.toVal) : null;
                        pts.push({
                            cat: cat,
                            v: scaled.value,
                            fromVal: scaledFrom ? (scaledFrom.value != null ? scaledFrom.value : scaledFrom.rawVal) : null,
                            toVal: scaledTo ? (scaledTo.value != null ? scaledTo.value : scaledTo.rawVal) : null,
                            neg: scaled.negative,
                            rawVal: scaled.rawVal,
                            t: item.t,
                            l: item.l,
                            seq: item.seq != null ? item.seq : p,
                            isDropped: item.isDropped === true,
                            isStreamNew: item.isStreamNew === true,
                            isMorphNew: item.isMorphNew === true,
                            isDrawReveal: item.isDrawReveal === true
                        });
                    } else {
                        untimed.push(item);
                    }
                }
                const n = untimed.length;
                for (let u = 0; u < n; u++) {
                    const item = untimed[u];
                    const rawCat = n === 1 ? 1 : u / (n - 1);
                    const cat = isReversed ? (1 - rawCat) : rawCat;
                    const scaled = scaleV(row.spec, item && item.v);
                    const scaledFrom = (item && item.fromVal != null) ? scaleV(row.spec, item.fromVal) : null;
                    const scaledTo = (item && item.toVal != null) ? scaleV(row.spec, item.toVal) : null;
                    pts.push({
                        cat: cat,
                        v: scaled.value,
                        fromVal: scaledFrom ? (scaledFrom.value != null ? scaledFrom.value : scaledFrom.rawVal) : null,
                        toVal: scaledTo ? (scaledTo.value != null ? scaledTo.value : scaledTo.rawVal) : null,
                        neg: scaled.negative,
                        rawVal: scaled.rawVal,
                        t: null,
                        l: item && item.l,
                        seq: item && item.seq != null ? item.seq : u,
                        isDropped: item && item.isDropped === true,
                        isStreamNew: item && item.isStreamNew === true,
                        isMorphNew: item && item.isMorphNew === true,
                        isDrawReveal: item && item.isDrawReveal === true
                    });
                }
                pts.sort(function (a, b) { return a.cat - b.cat; });
            } else {
                let logicalIdx = 0;
                for (let p = 0; p < buf.length; p++) {
                    const item = buf[p];
                    if (!item) continue;
                    let slotPos;
                    if (item.isDropped) {
                        const dropIdx = item.dropIndex != null ? item.dropIndex : 0;
                        const dropCnt = item.dropCount != null ? item.dropCount : 1;
                        slotPos = (dropIdx - dropCnt) + conveyorShiftSlots;
                    } else {
                        slotPos = logicalIdx + ( item.isStreamNew ? 0 : conveyorShiftSlots );
                        logicalIdx++;
                    }
                    const rawCat = slots <= 1 ? 0.5 : (slotPos / denom);
                    const cat = isReversed ? (1 - rawCat) : rawCat;
                    const scaled = scaleV(row.spec, item.v);
                    const scaledFrom = item.fromVal != null ? scaleV(row.spec, item.fromVal) : null;
                    const scaledTo = item.toVal != null ? scaleV(row.spec, item.toVal) : null;
                    pts.push({
                        cat: cat,
                        v: scaled.value,
                        fromVal: scaledFrom ? (scaledFrom.value != null ? scaledFrom.value : scaledFrom.rawVal) : null,
                        toVal: scaledTo ? (scaledTo.value != null ? scaledTo.value : scaledTo.rawVal) : null,
                        neg: scaled.negative,
                        rawVal: scaled.rawVal,
                        t: item.t,
                        l: item.l,
                        seq: item.seq != null ? item.seq : p,
                        slotIndex: slotPos,
                        isDropped: item.isDropped === true,
                        isStreamNew: item.isStreamNew === true,
                        isMorphNew: item.isMorphNew === true,
                        isDrawReveal: item.isDrawReveal === true
                    });
                }
                pts.sort(function (a, b) { return a.cat - b.cat; });
            }

            if (row.drawn) {
                for (let p = 0; p < pts.length; p++) {
                    if (pts[p].isDropped) continue;
                    const v = (anim && pts[p].toVal != null && isFinite(pts[p].toVal)) ? pts[p].toVal : pts[p].v;
                    if (v == null || !isFinite(v)) continue;
                    finiteCount++;
                    if (v < dataMin) dataMin = v;
                    if (v > dataMax) dataMax = v;
                }
            }
            placed.push(pts);
        }

        if (finiteCount === 0) { dataMin = 0; dataMax = 1; }
        this._hasPlottedFiniteData = (finiteCount > 0);
        return { placed: placed, dataMin: dataMin, dataMax: dataMax };
    }

    _resolvePlotScaleAndReserves(box, c, rows, placed, domain, maxLen, dataMin, dataMax, horizontal) {
        const self = this;
        const isDynamicFloor = c.dynamicFloor !== undefined ? c.dynamicFloor !== false : (c.autoMin !== false);
        const fixedFloorVal = (c.fixedFloor != null && isFinite(Number(c.fixedFloor)))
            ? Number(c.fixedFloor)
            : ((c.min != null && isFinite(Number(c.min))) ? Number(c.min) : null);
        const isDynamicCeil = c.dynamicCeiling !== undefined ? c.dynamicCeiling !== false : (c.autoMax !== false);
        const fixedCeilVal = (c.fixedCeiling != null && isFinite(Number(c.fixedCeiling)))
            ? Number(c.fixedCeiling)
            : ((c.max != null && isFinite(Number(c.max))) ? Number(c.max) : null);
        const isBaselineFloor = c.useBaseline === true && (c.negMode === 'ignore' || c.negMode === 'show_pos');
        const baselineVal = Number(c.baselineVal) || 0;
        const effectiveLockMin = !isDynamicFloor
            ? fixedFloorVal
            : (isBaselineFloor ? baselineVal : null);
        const effectiveLockMax = !isDynamicCeil
            ? fixedCeilVal
            : null;

        const estMin = effectiveLockMin != null ? effectiveLockMin : dataMin;
        const estMax = effectiveLockMax != null ? effectiveLockMax : dataMax;

        const isRealTime = c && c.bufferMode === 'duration' && c.timelineAdvance === 'time';
        const isAnimating = !!(this._activeAnimations && Object.keys(this._activeAnimations).length > 0) || isRealTime;
        const epochSig = this._renderInputsEpochSig ? this._renderInputsEpochSig() : null;
        let laid = null;
        let reserve = null;

        if (isAnimating && this._cachedPlotLayout &&
            this._cachedPlotLayout.boxW === box.w &&
            this._cachedPlotLayout.boxH === box.h &&
            this._cachedPlotLayout.horizontal === horizontal &&
            this._cachedPlotLayout.estMin === estMin &&
            this._cachedPlotLayout.estMax === estMax &&
            this._cachedPlotLayout.epochSig === epochSig) {
            reserve = this._cachedPlotLayout.reserve;
            laid = {
                drawW: this._cachedPlotLayout.drawW,
                drawH: this._cachedPlotLayout.drawH,
                scale: Object.assign({}, this._cachedPlotLayout.scale)
            };
        } else {
            const isTimeAxis = domain && GraphWidget.graphTimeFormatUsesTimestamp(c.timeFormat);
            const labelC = c;
            const catSamples = [];
            if (isTimeAxis) {
                catSamples.push(this._formatTimeScaleTick(domain.t0, labelC, domain.sample) || '00:00');
                catSamples.push(this._formatTimeScaleTick(domain.t0 + (domain.t1 - domain.t0) / 2, labelC, domain.sample) || '');
                catSamples.push(this._formatTimeScaleTick(domain.t1, labelC, domain.sample) || '');
            } else if (GraphWidget.graphTimeFormatIsTextLabels(c.timeFormat)) {
                for (let s = 0; s < placed.length; s++) {
                    const pts = placed[s];
                    for (let p = 0; p < pts.length; p++) {
                        if (pts[p] && pts[p].l != null && String(pts[p].l) !== '') catSamples.push(String(pts[p].l));
                    }
                }
                if (!catSamples.length) catSamples.push('0');
            } else {
                catSamples.push(String(Math.max(0, maxLen - 1)));
            }

            const edgeTexts = [];
            if (c.type === 'text' || (c.showPointValues && !c.pointValuesHoverOnly)) {
                for (let s = 0; s < placed.length; s++) {
                    const pts = placed[s];
                    const step = Math.max(1, Math.ceil(pts.length / 40));
                    for (let p = 0; p < pts.length; p += step) {
                        const raw = pts[p] && pts[p].v;
                        let text = '';
                        if (c.type === 'text') {
                            if (raw != null && isFinite(raw)) text = Number(raw).toFixed(c.decimals);
                            else if (pts[p] && pts[p].l != null) text = String(pts[p].l);
                        } else {
                            text = this._formatPointValueLabel(raw, c);
                        }
                        if (text) edgeTexts.push(text);
                    }
                }
            }
            const buildScale = function (res) {
                const nextW = Math.max(10, box.w - res.left - res.right);
                const nextH = Math.max(10, box.h - res.bottom - res.top);
                const room = horizontal ? nextW : nextH;
                const fs = Math.max(8, Number(c.axisYFontSize) || 10);
                const targetStep = horizontal
                    ? Math.max(56, Math.round(fs * 5.0))
                    : Math.max(28, Math.round(fs * 2.8));

                let targetIntervals = Math.max(1, (c.axisResY || 4) - 1);
                let minIntervals = 2;
                let maxIntervals = 8;

                if (c.autoAxisResY === true) {
                    const autoFit = Math.max(2, Math.min(40, Math.floor(room / targetStep)));
                    let safeTarget = autoFit;
                    if (c.roundingMode === 'exact') {
                        const userDec = Math.max(0, Math.floor(BaseWidget.toFiniteNumber(c.decimals, 0)));
                        const minStepForDec = Math.pow(10, -userDec);
                        const lo = effectiveLockMin != null ? effectiveLockMin : dataMin;
                        const hi = effectiveLockMax != null ? effectiveLockMax : dataMax;
                        const effSpan = Math.max(1e-9, Math.abs(hi - lo));
                        const maxIntervalsForDec = Math.max(1, Math.floor(effSpan / minStepForDec));
                        safeTarget = Math.max(1, Math.min(autoFit, maxIntervalsForDec));
                    }
                    targetIntervals = safeTarget;
                    minIntervals = Math.max(1, Math.floor(safeTarget * 0.65));
                    maxIntervals = Math.max(targetIntervals, Math.min(40, Math.ceil(autoFit * 1.35)));
                } else if (c.roundingMode === 'smart') {
                    minIntervals = Math.max(1, Math.min(targetIntervals, 3));
                    maxIntervals = Math.max(targetIntervals + 2, 8);
                }

                if (c.roundingMode !== 'smart') {
                    minIntervals = Math.max(1, targetIntervals);
                    maxIntervals = Math.max(minIntervals, targetIntervals);
                }

                const nextScale = DashboardMathUtils.calculateNiceTicks(dataMin, dataMax, {
                    headroomPct: c.headroom,
                    clampMinToZero: false,
                    baseline: baselineVal,
                    baselineActive: c.useBaseline === true,
                    lockMin: effectiveLockMin,
                    lockMax: effectiveLockMax,
                    roundingMode: c.roundingMode || 'smart',
                    decimals: c.decimals,
                    targetIntervals: targetIntervals,
                    minIntervals: minIntervals,
                    maxIntervals: maxIntervals
                });
                return { drawW: nextW, drawH: nextH, scale: nextScale };
            };

            const yTextsFrom = function (nextScale, dec) {
                const texts = [];
                const ticks = nextScale && nextScale.ticks ? nextScale.ticks : [];
                for (let i = 0; i < ticks.length; i++) texts.push(self._formatYAxisValue(ticks[i], dec));
                if (nextScale && nextScale.edgeMin != null) texts.push(self._formatYAxisValue(nextScale.edgeMin, dec));
                if (nextScale && nextScale.edgeMax != null) texts.push(self._formatYAxisValue(nextScale.edgeMax, dec));
                if (!texts.length) {
                    texts.push(self._formatYAxisValue(dataMax, dec));
                    texts.push(self._formatYAxisValue(dataMin, dec));
                }
                if (c.gridHBaseShow) {
                    const bVal = c.useBaseline ? (Number(c.baselineVal) || 0) : 0;
                    texts.push(self._formatYAxisValue(bVal, dec));
                }
                return texts;
            };

            const reserveBaselineVal = c.useBaseline ? (Number(c.baselineVal) || 0) : 0;
            reserve = this._fitGraphReserve(box, this._graphAxisReserve(c, horizontal, [
                this._formatYAxisValue(estMax, c.decimals),
                this._formatYAxisValue(estMin, c.decimals),
                this._formatYAxisValue(isBaselineFloor ? reserveBaselineVal : 0, c.decimals)
            ], catSamples, edgeTexts));
            laid = buildScale(reserve);
            for (let pass = 0; pass < 2; pass++) {
                const dec = this._resolveAxisDecimals(c, laid.scale);
                const next = this._fitGraphReserve(box, this._graphAxisReserve(c, horizontal, yTextsFrom(laid.scale, dec), catSamples, edgeTexts));
                const grew = next.left > reserve.left + 0.5 || next.right > reserve.right + 0.5
                    || next.top > reserve.top + 0.5 || next.bottom > reserve.bottom + 0.5;
                reserve = next;
                laid = buildScale(reserve);
                if (!grew) break;
            }

            if (isAnimating) {
                this._cachedPlotLayout = {
                    epochSig: epochSig,
                    boxW: box.w,
                    boxH: box.h,
                    horizontal: horizontal,
                    estMin: estMin,
                    estMax: estMax,
                    reserve: reserve,
                    drawW: laid.drawW,
                    drawH: laid.drawH,
                    scale: Object.assign({}, laid.scale)
                };
            }
        }

        const scale = laid.scale;
        if (this._scaleState) {
            const ss = this._scaleState;
            const animKeys = this._activeAnimations ? Object.keys(this._activeAnimations) : [];
            let hasDrawReveal = false;
            if (this._activeAnimations) {
                for (let k = 0; k < animKeys.length; k++) {
                    const a = this._activeAnimations[animKeys[k]];
                    if (a && a.animMode === 'draw') {
                        hasDrawReveal = true;
                        break;
                    }
                }
            }
            if (!hasDrawReveal && animKeys.length > 0 && c.graphAnimation && c.graphAnimation !== 'none' && ss.fromMin != null && ss.fromMax != null) {
                const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                const dur = Math.max(80, ss.duration || 250);
                const t = Math.max(0, Math.min(1, (now - ss.startTime) / dur));
                const se = ss.easing === 'inOut' ? GraphWidget._easeInOutCubic(t) : GraphWidget._easeOutCubic(t);
                scale.renderMin = ss.fromMin + (scale.renderMin - ss.fromMin) * se;
                scale.renderMax = ss.fromMax + (scale.renderMax - ss.fromMax) * se;
            } else {
                ss.fromMin = null;
                ss.fromMax = null;
            }
            ss.currentMin = scale.renderMin;
            ss.currentMax = scale.renderMax;
        }

        const drawW = laid.drawW;
        const drawH = laid.drawH;
        const alongPx = horizontal ? drawH : drawW;
        const decimals = this._resolveAxisDecimals(c, scale);
        const geom = {
            horizontal: horizontal,
            drawW: drawW,
            drawH: drawH,
            renderMin: scale.renderMin,
            renderMax: scale.renderMax,
            span: (scale.renderMax - scale.renderMin) || 1,
            baseline: c.useBaseline ? (Number(c.baselineVal) || 0) : (c.negMode === 'show_pos' || (scale.renderMin < 0 && scale.renderMax > 0) ? 0 : scale.renderMin)
        };
        const basePt = this._placeValue(0, geom.baseline, geom, true);
        const baseAlong = horizontal ? basePt.x : basePt.y;

        return {
            reserve: reserve,
            drawW: drawW,
            drawH: drawH,
            alongPx: alongPx,
            scale: scale,
            catBox: reserve.catBox || { w: 8, h: 12 },
            decimals: decimals,
            geom: geom,
            basePt: basePt,
            baseAlong: baseAlong
        };
    }

    _buildCategoryTicks(c, domain, maxLen, alongPx, catBox, horizontal, isReversed, placed, rows) {
        const catOnBottom = !horizontal;
        const isTimeAxis = domain && GraphWidget.graphTimeFormatUsesTimestamp(c.timeFormat);
        const labelC = c;
        const catTicks = [];

        if (isTimeAxis) {
            const sampleW = this._rotatedLabelBox(
                this._formatTimeScaleTick(domain.t0, labelC, domain.sample),
                c.axisXFontSize, c.axisXFont, c.axisXFontBold, c.categoryLabelRotation
            );
            const foot = catOnBottom ? sampleW.w : sampleW.h;
            const count = this._timeScaleLabelCount(c, alongPx, Math.max(8, foot));
            const built = this._buildTimeScaleTicks(domain, count, labelC, alongPx, foot);
            const bands = Math.min(Math.max(2, Math.floor(alongPx)), Math.max(1, maxLen));
            const band = alongPx / bands;
            for (let i = 0; i < built.length; i++) {
                let frac = isReversed ? (1 - built[i].frac) : built[i].frac;
                if (c.type === 'bar' && maxLen > 1 && alongPx > band) {
                    const barCenterSpan = alongPx - band;
                    frac = ((band / 2) + frac * barCenterSpan) / alongPx;
                }
                catTicks.push({ frac: frac, text: built[i].text });
            }
        } else {
            const isBar = c.type === 'bar';
            const bands = Math.min(Math.max(2, Math.floor(alongPx)), Math.max(1, maxLen));
            const n = Math.max(1, maxLen);
            let skip = Math.max(1, c.axisResX || 1);
            if (c.autoAxisResX === true) {
                const foot = catOnBottom ? catBox.w : catBox.h;
                const fit = Math.max(1, Math.floor(alongPx / Math.max(8, foot + 4)));
                skip = Math.max(1, Math.ceil(n / fit));
            }
            for (let i = 0; i < n; i += skip) {
                const rawFrac = isBar ? ((i + 0.5) / bands) : (n <= 1 ? 0.5 : i / (n - 1));
                const frac = isReversed ? (1 - rawFrac) : rawFrac;
                let text = String(i);
                if (GraphWidget.graphTimeFormatIsTextLabels(c.timeFormat)) {
                    text = '';
                    for (let s = 0; s < placed.length; s++) {
                        if (!rows[s].drawn) continue;
                        const activePts = [];
                        for (let k = 0; k < placed[s].length; k++) {
                            if (!placed[s][k].isDropped) activePts.push(placed[s][k]);
                        }
                        const pt = activePts[i];
                        if (pt && pt.l) { text = String(pt.l); break; }
                    }
                }
                catTicks.push({ frac: frac, text: text });
            }
        }
        catTicks.sort(function (a, b) { return a.frac - b.frac; });
        return catTicks;
    }

    _drawPlotGridAndBorders(ctx, c, geom, scale, catTicks, basePt, showBaseline, deactCol, drawW, drawH, horizontal) {
        const self = this;
        const strokeAxis = function (show, col, w, op, x1, y1, x2, y2) {
            if (!show) return;
            self._drawCanvasLine(ctx, x1, y1, x2, y2, deactCol || col, w, op);
        };

        if (c.gridHInnerShow) {
            const ticks = scale.ticks || [];
            const skipN = c.gridHInnerSpace > 0 ? Math.max(1, Math.floor(c.gridHInnerSpace)) : 1;
            const maxSpan = horizontal ? drawW : drawH;
            for (let i = 0; i < ticks.length; i += skipN) {
                const v = ticks[i];
                const pt = self._placeValue(0, v, geom);
                const pos = horizontal ? pt.x : pt.y;
                if (pos < -0.5 || pos > maxSpan + 0.5) continue;
                const atBase = showBaseline && Math.abs(horizontal ? (pt.x - basePt.x) : (pt.y - basePt.y)) < 1.0;
                if (atBase) continue;
                if (horizontal) self._drawCanvasLine(ctx, pt.x, 0, pt.x, drawH, deactCol || c.gridHInnerCol, c.gridHInnerW, c.gridHInnerOp);
                else self._drawCanvasLine(ctx, 0, pt.y, drawW, pt.y, deactCol || c.gridHInnerCol, c.gridHInnerW, c.gridHInnerOp);
            }
        }
        if (c.gridVShow) {
            const skipN = c.gridVSpace > 0 ? Math.max(1, Math.floor(c.gridVSpace)) : 1;
            for (let i = 0; i < catTicks.length; i += skipN) {
                const frac = catTicks[i].frac;
                if (horizontal) self._drawCanvasLine(ctx, 0, frac * drawH, drawW, frac * drawH, deactCol || c.gridVCol, c.gridVW, c.gridVOp);
                else self._drawCanvasLine(ctx, frac * drawW, 0, frac * drawW, drawH, deactCol || c.gridVCol, c.gridVW, c.gridVOp);
            }
        }
        if (showBaseline) {
            if (horizontal) self._drawCanvasLine(ctx, basePt.x, 0, basePt.x, drawH, deactCol || c.gridHBaseCol, c.gridHBaseW, c.gridHBaseOp);
            else self._drawCanvasLine(ctx, 0, basePt.y, drawW, basePt.y, deactCol || c.gridHBaseCol, c.gridHBaseW, c.gridHBaseOp);
        }

        strokeAxis(c.gridHTopShow, c.gridHTopCol, c.gridHTopW, c.gridHTopOp, 0, 0, drawW, 0);
        strokeAxis(c.gridHBotShow, c.gridHBotCol, c.gridHBotW, c.gridHBotOp, 0, drawH, drawW, drawH);
        strokeAxis(c.gridVLeftShow, c.gridVLeftCol, c.gridVLeftW, c.gridVLeftOp, 0, 0, 0, drawH);
        strokeAxis(c.gridVRightShow, c.gridVRightCol, c.gridVRightW, c.gridVRightOp, drawW, 0, drawW, drawH);
    }

    _drawBarSeries(ctx, c, geom, rows, placed, drawnSeries, maxLen, alongPx, baseAlong, domain, accent, deactCol, drawW, drawH, horizontal, isReversed, barLabelPts) {
        const pixelCap = Math.max(2, Math.floor(alongPx));
        const bands = Math.min(pixelCap, Math.max(1, maxLen));
        const band = (horizontal ? drawH : drawW) / bands;
        const gap = Math.max(0, Number(c.barGap) || 0);
        const numSeries = drawnSeries.length || 1;
        const maxPossibleGap = Math.max(0, (band - numSeries) / numSeries);
        const effectiveGap = Math.min(gap, maxPossibleGap);
        const each = Math.max(1, (band - numSeries * effectiveGap) / numSeries);

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, drawW, drawH);
        ctx.clip();

        let lastVal = null;
        for (let s = 0; s < drawnSeries.length; s++) {
            const idx = drawnSeries[s];
            const spec = rows[idx].spec;
            const pts = placed[idx];
            const barAnim = rows[idx].anim;

            for (let p = 0; p < pts.length; p++) {
                const pt = pts[p];
                if (!pt || pt.v == null || !isFinite(pt.v)) continue;
                const value = pt.v;
                const negative = pt.neg === true;
                if (!pt.isDropped) lastVal = value;
                const positive = !negative;
                const color = accent || (positive ? spec.positiveColor : spec.negativeColor);
                const outline = positive ? spec.positiveOutlineColor : spec.negativeOutlineColor;

                const bandPos = (pt.cat * Math.max(1, bands - 1));
                const bandStart = (domain && domain.isTime)
                    ? (pt.cat * Math.max(0, alongPx - band))
                    : (bandPos * band);
                let barScale = 1.0;

                if (barAnim) {
                    if (barAnim.animMode === 'shimmer' && barAnim.shimmerProgress != null) {
                        const normB = isReversed ? (1 - pt.cat) : pt.cat;
                        const shimmerCenter = -0.18 + barAnim.shimmerProgress * 1.36;
                        const dist = Math.abs(normB - shimmerCenter);
                        if (dist < 0.18) {
                            barScale = 1.0 + 0.08 * Math.cos((dist / 0.18) * Math.PI * 0.5);
                        }
                    } else if (barAnim.updateMode === 'stream') {
                        if (pt.isStreamNew) {
                            const riseRaw = Math.max(0, Math.min(1, (barAnim.progress - 0.15) / 0.70));
                            barScale = GraphWidget._easeOutCubic(riseRaw);
                        }
                    } else if (barAnim.drawProgress != null) {
                        const rawOrderFrac = pt.cat != null ? pt.cat : 0;
                        const orderFrac = Math.max(0, Math.min(1, isReversed ? (1 - rawOrderFrac) : rawOrderFrac));
                        const delay = (c.graphAnimStaggerBars !== false) ? (orderFrac * 0.45) : 0;
                        const spanDur = (c.graphAnimStaggerBars !== false) ? 0.55 : 1.0;
                        const localT = Math.max(0, Math.min(1, (barAnim.progress - delay) / spanDur));
                        barScale = GraphWidget._easeOutCubic(localT);
                    } else if (barAnim.morphShiftProgress != null && pt.isMorphNew) {
                        const localT = Math.max(0, Math.min(1, (barAnim.morphShiftProgress - 0.25) / 0.75));
                        barScale = GraphWidget._easeOutCubic(localT);
                    }
                }

                let x;
                let y;
                let w;
                let h;
                let xVal = 0;
                let yVal = 0;
                if (horizontal) {
                    const y0 = bandStart + (effectiveGap / 2) + s * (each + effectiveGap);
                    const y1 = y0 + Math.max(1, each);
                    xVal = this._placeValue(0, value, geom).x;
                    const fullW = Math.abs(xVal - baseAlong);
                    w = fullW * barScale;
                    x = (xVal >= baseAlong) ? baseAlong : (baseAlong - w);
                    y = y0;
                    h = Math.max(1, y1 - y0);
                } else {
                    const x0 = bandStart + (effectiveGap / 2) + s * (each + effectiveGap);
                    yVal = this._placeValue(0, value, geom).y;
                    x = x0;
                    const fullH = Math.abs(yVal - baseAlong);
                    h = fullH * barScale;
                    y = (yVal <= baseAlong) ? (baseAlong - h) : baseAlong;
                    w = Math.max(1, each);
                }
                GraphWidget.traceRoundRect(ctx, x, y, w, h, c.barRadius || 0);
                ctx.fillStyle = this._resolvePlotColor(color, 100);
                ctx.fill();
                if (c.barOutlineWidth > 0) {
                    ctx.lineWidth = c.barOutlineWidth;
                    ctx.strokeStyle = this._resolvePlotColor(deactCol || outline, 100);
                    ctx.stroke();
                }
                if (!pt.isDropped) {
                    const tip = horizontal
                        ? { x: (xVal >= baseAlong ? baseAlong + w : baseAlong - w), y: y + h / 2 }
                        : { x: x + w / 2, y: (yVal <= baseAlong ? baseAlong - h : baseAlong + h) };
                    this.renderedPoints.push({ x: tip.x, y: tip.y, val: value, type: 'bar', barX: x, barW: w, rectY: y, rectH: h });
                    if (c.showPointValues && !c.pointValuesHoverOnly) {
                        const barTargetVal = (pt.toVal != null && isFinite(pt.toVal)) ? pt.toVal : value;
                        const displayVal = (barAnim && barAnim.updateMode === 'stream') ? value : barTargetVal;
                        if (!barLabelPts[idx]) barLabelPts[idx] = [];
                        barLabelPts[idx].push({
                            x: tip.x,
                            y: tip.y,
                            v: displayVal,
                            toVal: barTargetVal,
                            cat: pt.cat,
                            t: pt.t,
                            seq: pt.seq != null ? pt.seq : p,
                            l: pt.l,
                            neg: negative,
                            index: p,
                            isStreamNew: pt.isStreamNew === true,
                            isMorphNew: pt.isMorphNew === true,
                            isDrawReveal: pt.isDrawReveal === true,
                            isDropped: false
                        });
                    }
                }
            }
        }
        ctx.restore();
        if (c.showPointValues && !c.pointValuesHoverOnly) {
            this._drawDistributedPointValues(ctx, c, geom, rows, barLabelPts, horizontal, domain);
        }
        return lastVal;
    }

    _drawLineSeries(ctx, c, geom, rows, placed, alongPx, baseAlong, domain, accent, drawW, drawH, horizontal, isReversed, seriesPlottedPts) {
        const self = this;
        const breakGaps = c.lineGaps !== 'connect';
        const pixelCap = Math.max(2, Math.floor(alongPx));
        let lastVal = null;

        for (let s = 0; s < rows.length; s++) {
            if (!rows[s].drawn) continue;
            seriesPlottedPts[s] = [];
            const spec = rows[s].spec;
            const pts = placed[s];
            const anim = rows[s].anim;
            const segments = DashboardMathUtils.splitSeriesByGaps(pts, breakGaps && !!domain);

            for (let g = 0; g < segments.length; g++) {
                let seg = segments[g];
                if (c.type === 'smooth' && c.smoothingAmount > 0 && typeof DashboardMathUtils.smoothSeriesStaged === 'function') {
                    const vals = [];
                    for (let i = 0; i < seg.length; i++) vals.push(seg[i].v);
                    const sm = DashboardMathUtils.smoothSeriesStaged(vals, c.smoothingAmount);
                    const copy = [];
                    for (let i = 0; i < seg.length; i++) {
                        copy.push(Object.assign({}, seg[i], { v: sm[i] }));
                    }
                    seg = copy;
                }
                const samples = [];
                for (let i = 0; i < seg.length; i++) {
                    const along = seg[i].cat * alongPx;
                    samples.push(Object.assign({}, seg[i], { x: along, y: seg[i].v }));
                }
                let drawPts = samples;
                if (samples.length > pixelCap) {
                    drawPts = c.type === 'stepped'
                        ? DashboardMathUtils.downsampleStepped(samples, pixelCap)
                        : DashboardMathUtils.downsampleLttb(samples, pixelCap);
                }
                const screenPts = [];
                for (let i = 0; i < drawPts.length; i++) {
                    const dp = drawPts[i];
                    const catVal = dp.cat != null ? dp.cat : (dp.x / alongPx);
                    const plotVal = dp.y;

                    const sp = this._placeValue(catVal, plotVal, geom);
                    screenPts.push({
                        x: sp.x,
                        y: sp.y,
                        v: dp.y,
                        fromVal: dp.fromVal !== undefined ? dp.fromVal : (dp.pt && dp.pt.fromVal !== undefined ? dp.pt.fromVal : null),
                        toVal: dp.toVal !== undefined ? dp.toVal : (dp.pt && dp.pt.toVal !== undefined ? dp.pt.toVal : null),
                        t: dp.t,
                        cat: catVal,
                        seq: dp.seq,
                        l: dp.l,
                        neg: dp.neg,
                        rawVal: dp.rawVal,
                        index: i,
                        pt: dp,
                        isDropped: dp.isDropped === true,
                        isStreamNew: dp.isStreamNew === true,
                        isMorphNew: dp.isMorphNew === true,
                        isDrawReveal: dp.isDrawReveal === true
                    });
                    if (!dp.isDropped) lastVal = dp.y;
                }
                if (screenPts.length === 0) continue;

                for (let i = 0; i < screenPts.length; i++) {
                    if (!screenPts[i].isDropped) {
                        seriesPlottedPts[s].push(screenPts[i]);
                    }
                }

                let curvePts = screenPts;
                if (anim && anim.updateMode === 'stream' && anim.streamTraceProgress != null) {
                    curvePts = this._buildStreamTracePoints(screenPts, anim.streamTraceProgress, c.type, horizontal);
                }

                let lineReach = null;
                let fillFadeFactor = 1.0;
                if (anim && anim.drawProgress != null) {
                    const p = anim.drawRawProgress != null ? anim.drawRawProgress : anim.drawProgress;
                    const lineFrac = Math.max(0, Math.min(1.0, (p - 0.12) / 0.78));
                    lineReach = lineFrac * alongPx;
                    fillFadeFactor = lineFrac;
                }

                const clipPlotBoundsAndSweep = function () {
                    ctx.beginPath();
                    if (lineReach == null) {
                        ctx.rect(-2, -2, drawW + 4, drawH + 4);
                    } else if (horizontal) {
                        if (isReversed) {
                            ctx.rect(-2, Math.max(0, drawH - lineReach), drawW + 4, Math.min(drawH + 2, lineReach + 2));
                        } else {
                            ctx.rect(-2, 0, drawW + 4, Math.max(0, lineReach));
                        }
                    } else if (isReversed) {
                        ctx.rect(Math.max(0, drawW - lineReach), -2, Math.min(drawW + 2, lineReach + 2), drawH + 4);
                    } else {
                        ctx.rect(0, -2, Math.max(0, lineReach), drawH + 4);
                    }
                    ctx.clip();
                };

                if (c.negMode === 'show_pos' && curvePts.length >= 1) {
                    const subRuns = [];
                    let curRun = [];
                    let curNeg = curvePts[0].neg === true;
                    for (let i = 0; i < curvePts.length; i++) {
                        const pt = curvePts[i];
                        const isNeg = pt.neg === true;
                        if (i === 0) {
                            curRun.push(pt);
                            continue;
                        }
                        const prev = curvePts[i - 1];
                        if (isNeg !== curNeg) {
                            const v1 = prev.rawVal != null ? prev.rawVal : prev.v;
                            const v2 = pt.rawVal != null ? pt.rawVal : pt.v;
                            const base = geom.baseline;
                            let alpha = 0.5;
                            if (v2 !== v1) {
                                alpha = (base - v1) / (v2 - v1);
                                if (alpha < 0) alpha = 0;
                                else if (alpha > 1) alpha = 1;
                            }
                            const crossX = prev.x + alpha * (pt.x - prev.x);
                            const crossY = prev.y + alpha * (pt.y - prev.y);
                            const crossPt = {
                                x: horizontal ? baseAlong : crossX,
                                y: horizontal ? crossY : baseAlong,
                                v: base,
                                neg: curNeg,
                                synthetic: true
                            };
                            curRun.push(crossPt);
                            subRuns.push({ neg: curNeg, pts: curRun });
                            const nextStart = {
                                x: crossPt.x,
                                y: crossPt.y,
                                v: base,
                                neg: isNeg,
                                synthetic: true
                            };
                            curRun = [nextStart, pt];
                            curNeg = isNeg;
                        } else {
                            curRun.push(pt);
                        }
                    }
                    if (curRun.length > 0) {
                        subRuns.push({ neg: curNeg, pts: curRun });
                    }

                    for (let r = 0; r < subRuns.length; r++) {
                        const run = subRuns[r];
                        const rPts = run.pts;
                        if (rPts.length < 1) continue;
                        const isPos = !run.neg;
                        const startOp = isPos ? spec.positiveStartOpacity : spec.negativeStartOpacity;
                        if (startOp > 0 && fillFadeFactor > 0.001) {
                            const endOp = (isPos ? spec.positiveEndOpacity : spec.negativeEndOpacity) * fillFadeFactor;
                            const effStartOp = startOp * fillFadeFactor;
                            const col = accent || (isPos ? spec.positiveFillColor : spec.negativeFillColor);
                            ctx.save();
                            clipPlotBoundsAndSweep();
                            ctx.beginPath();
                            if (horizontal) {
                                const grad = ctx.createLinearGradient(drawW, 0, baseAlong, 0);
                                grad.addColorStop(0, self._resolvePlotColor(col, effStartOp));
                                grad.addColorStop(1, self._resolvePlotColor(col, endOp));
                                self._traceCurvePath(ctx, rPts, c.type, true);
                                ctx.lineTo(baseAlong, rPts[rPts.length - 1].y);
                                ctx.lineTo(baseAlong, rPts[0].y);
                                ctx.closePath();
                                ctx.fillStyle = grad;
                                ctx.fill();
                            } else {
                                const grad = ctx.createLinearGradient(0, 0, 0, baseAlong);
                                grad.addColorStop(0, self._resolvePlotColor(col, effStartOp));
                                grad.addColorStop(1, self._resolvePlotColor(col, endOp));
                                self._traceCurvePath(ctx, rPts, c.type, false);
                                ctx.lineTo(rPts[rPts.length - 1].x, baseAlong);
                                ctx.lineTo(rPts[0].x, baseAlong);
                                ctx.closePath();
                                ctx.fillStyle = grad;
                                ctx.fill();
                            }
                            ctx.restore();
                        }
                        if (spec.lineWidth > 0) {
                            ctx.save();
                            clipPlotBoundsAndSweep();
                            ctx.beginPath();
                            self._traceCurvePath(ctx, rPts, c.type, horizontal);
                            ctx.lineWidth = spec.lineWidth;
                            ctx.lineJoin = 'round';
                            ctx.lineCap = 'round';
                            ctx.strokeStyle = self._resolvePlotColor(accent || (isPos ? spec.positiveColor : spec.negativeColor), 100);
                            ctx.stroke();
                            ctx.restore();
                        }
                    }
                } else if (curvePts.length >= 1) {
                    const paintFill = function (positive) {
                        if (fillFadeFactor <= 0.001) return;
                        const startOp = (positive ? spec.positiveStartOpacity : spec.negativeStartOpacity) * fillFadeFactor;
                        if (!(startOp > 0)) return;
                        const endOp = (positive ? spec.positiveEndOpacity : spec.negativeEndOpacity) * fillFadeFactor;
                        const col = accent || (positive ? spec.positiveFillColor : spec.negativeFillColor);
                        ctx.save();
                        clipPlotBoundsAndSweep();
                        ctx.beginPath();
                        if (horizontal) {
                            if (positive) ctx.rect(baseAlong, 0, Math.max(0, drawW - baseAlong), drawH);
                            else ctx.rect(0, 0, Math.max(0, baseAlong), drawH);
                            const grad = ctx.createLinearGradient(positive ? drawW : 0, 0, baseAlong, 0);
                            grad.addColorStop(0, self._resolvePlotColor(col, startOp));
                            grad.addColorStop(1, self._resolvePlotColor(col, endOp));
                            ctx.clip();
                            ctx.beginPath();
                            self._traceCurvePath(ctx, curvePts, c.type, true);
                            ctx.lineTo(baseAlong, curvePts[curvePts.length - 1].y);
                            ctx.lineTo(baseAlong, curvePts[0].y);
                            ctx.closePath();
                            ctx.fillStyle = grad;
                            ctx.fill();
                        } else {
                            if (positive) ctx.rect(0, 0, drawW, Math.max(0, baseAlong));
                            else ctx.rect(0, baseAlong, drawW, Math.max(0, drawH - baseAlong));
                            const yFar = positive ? 0 : drawH;
                            const grad = ctx.createLinearGradient(0, yFar, 0, baseAlong);
                            grad.addColorStop(0, self._resolvePlotColor(col, startOp));
                            grad.addColorStop(1, self._resolvePlotColor(col, endOp));
                            ctx.clip();
                            ctx.beginPath();
                            self._traceCurvePath(ctx, curvePts, c.type, false);
                            ctx.lineTo(curvePts[curvePts.length - 1].x, baseAlong);
                            ctx.lineTo(curvePts[0].x, baseAlong);
                            ctx.closePath();
                            ctx.fillStyle = grad;
                            ctx.fill();
                        }
                        ctx.restore();
                    };
                    paintFill(true);
                    paintFill(false);

                    if (spec.lineWidth > 0) {
                        const strokeSeg = function (clip) {
                            const positive = clip !== 'negative';
                            ctx.save();
                            clipPlotBoundsAndSweep();
                            if (clip !== 'all') {
                                ctx.beginPath();
                                if (horizontal) {
                                    if (positive) ctx.rect(baseAlong, -2, drawW - baseAlong + 2, drawH + 4);
                                    else ctx.rect(-2, -2, baseAlong + 2, drawH + 4);
                                } else if (positive) ctx.rect(-2, -2, drawW + 4, baseAlong + 2);
                                else ctx.rect(-2, baseAlong, drawW + 4, drawH - baseAlong + 2);
                                ctx.clip();
                            }
                            ctx.beginPath();
                            self._traceCurvePath(ctx, curvePts, c.type, horizontal);
                            ctx.lineWidth = spec.lineWidth;
                            ctx.lineJoin = 'round';
                            ctx.lineCap = 'round';
                            ctx.strokeStyle = self._resolvePlotColor(accent || (positive ? spec.positiveColor : spec.negativeColor), 100);
                            ctx.stroke();
                            ctx.restore();
                        };
                        const same = (accent || spec.positiveColor) === (accent || spec.negativeColor);
                        if (same) strokeSeg('all');
                        else { strokeSeg('positive'); strokeSeg('negative'); }
                    }
                }

                const shouldEvaluatePoints = c.showPoints || !!anim;
                if (shouldEvaluatePoints) {
                    for (let i = 0; i < screenPts.length; i++) {
                        const spt = screenPts[i];
                        if (spt.synthetic) continue;
                        const inPlot = spt.x >= -2 && spt.x <= drawW + 2 && spt.y >= -2 && spt.y <= drawH + 2;
                        if (!inPlot) continue;
                        if (!spt.isDropped) {
                            self.renderedPoints.push({ x: spt.x, y: spt.y, val: spt.v, type: 'point' });
                        }

                        const ptScale = self._pointAnimationScale(spt, i, anim, alongPx, horizontal, c.showPoints === true, isReversed);
                        if (ptScale <= 0.01) continue;

                        const basePointDia = Math.max(3, Number(c.pointSize) || 4);
                        const radius = Math.max(0.5, (basePointDia / 2) * ptScale);
                        const isNeg = spt.neg === true || spt.v < geom.baseline;
                        const col = accent || spec.pointColor || (!isNeg ? spec.positiveColor : spec.negativeColor);
                        ctx.beginPath();
                        ctx.arc(spt.x, spt.y, radius, 0, Math.PI * 2);
                        ctx.fillStyle = self._resolvePlotColor(col, 100);
                        ctx.fill();
                    }
                } else {
                    for (let i = 0; i < screenPts.length; i++) {
                        const spt = screenPts[i];
                        if (spt.synthetic || spt.isDropped) continue;
                        const inPlot = spt.x >= -2 && spt.x <= drawW + 2 && spt.y >= -2 && spt.y <= drawH + 2;
                        if (inPlot) {
                            self.renderedPoints.push({ x: spt.x, y: spt.y, val: spt.v, type: 'point' });
                        }
                    }
                }

                if (anim && anim.animMode === 'shimmer' && anim.shimmerProgress != null) {
                    self._drawSeriesShimmer(ctx, curvePts, c.type, horizontal, anim.shimmerProgress, spec.lineWidth || 2, drawW, drawH, isReversed);
                }
            }
        }
        if (c.showPointValues && !c.pointValuesHoverOnly) {
            this._drawDistributedPointValues(ctx, c, geom, rows, seriesPlottedPts, horizontal, domain);
        }
        return lastVal;
    }

    _drawPlotAxesAndTicks(ctx, c, geom, scale, catTicks, basePt, showBaseline, decimals, deactCol, drawW, drawH, horizontal) {
        if (c.showAxisY) {
            this._setCanvasFont(ctx, c.axisYFontSize, c.axisYFont, c.axisYFontBold, false);
            ctx.fillStyle = this._resolvePlotColor(deactCol || c.axisYFontColor, c.axisYFontOpacity);
            const ticks = scale.ticks || [];
            const yFit = { limits: this._plotTextLimits, fontSize: c.axisYFontSize, family: c.axisYFont, bold: c.axisYFontBold };
            const fs = Math.max(8, Number(c.axisYFontSize) || 10);
            const baseText = this._formatYAxisValue(geom.baseline, decimals);
            const basePos = horizontal ? basePt.x : basePt.y;
            const minSpacing = horizontal
                ? Math.max(16, this._rotatedLabelBox(baseText, fs, c.axisYFont, c.axisYFontBold, c.valueLabelRotation).w + 4)
                : Math.max(10, fs * 1.2);

            const hasEdgeMin = scale && scale.edgeMin != null;
            const hasEdgeMax = scale && scale.edgeMax != null;
            const minPt = hasEdgeMin ? this._placeValue(0, scale.edgeMin, geom) : null;
            const maxPt = hasEdgeMax ? this._placeValue(0, scale.edgeMax, geom) : null;
            const minPos = minPt ? (horizontal ? minPt.x : minPt.y) : null;
            const maxPos = maxPt ? (horizontal ? maxPt.x : maxPt.y) : null;
            const drawnLabels = {};

            const maxSpan = horizontal ? drawW : drawH;
            for (let i = 0; i < ticks.length; i++) {
                const v = ticks[i];
                const pt = this._placeValue(0, v, geom);
                const pos = horizontal ? pt.x : pt.y;
                if (pos < -0.5 || pos > maxSpan + 0.5) continue;
                if (showBaseline && Math.abs(pos - basePos) < minSpacing) continue;
                if (hasEdgeMin && Math.abs(pos - minPos) < minSpacing) continue;
                if (hasEdgeMax && Math.abs(pos - maxPos) < minSpacing) continue;

                const text = this._formatYAxisValue(v, decimals);
                if (drawnLabels[text]) continue;
                drawnLabels[text] = true;
                if (horizontal) {
                    this._drawEdgeLabel(ctx, text, pt.x, drawH + Math.max(0, c.axisOffX), c.valueLabelRotation, 'bottom', yFit);
                } else {
                    this._drawEdgeLabel(ctx, text, -Math.max(0, c.axisOffX), pt.y, c.valueLabelRotation, 'left', yFit);
                }
            }
            if (hasEdgeMin) {
                const minPos = minPt ? (horizontal ? minPt.x : minPt.y) : null;
                if (minPos != null && minPos >= -0.5 && minPos <= maxSpan + 0.5) {
                    const text = this._formatYAxisValue(scale.edgeMin, decimals);
                    if (!drawnLabels[text]) {
                        drawnLabels[text] = true;
                        if (horizontal) {
                            this._drawEdgeLabel(ctx, text, minPt.x, drawH + Math.max(0, c.axisOffX), c.valueLabelRotation, 'bottom', yFit);
                        } else {
                            this._drawEdgeLabel(ctx, text, -Math.max(0, c.axisOffX), minPt.y, c.valueLabelRotation, 'left', yFit);
                        }
                    }
                }
            }
            if (hasEdgeMax) {
                const maxPos = maxPt ? (horizontal ? maxPt.x : maxPt.y) : null;
                if (maxPos != null && maxPos >= -0.5 && maxPos <= maxSpan + 0.5) {
                    const text = this._formatYAxisValue(scale.edgeMax, decimals);
                    if (!drawnLabels[text]) {
                        drawnLabels[text] = true;
                        if (horizontal) {
                            this._drawEdgeLabel(ctx, text, maxPt.x, drawH + Math.max(0, c.axisOffX), c.valueLabelRotation, 'bottom', yFit);
                        } else {
                            this._drawEdgeLabel(ctx, text, -Math.max(0, c.axisOffX), maxPt.y, c.valueLabelRotation, 'left', yFit);
                        }
                    }
                }
            }
            if (showBaseline && !drawnLabels[baseText] && basePos >= -0.5 && basePos <= maxSpan + 0.5) {
                drawnLabels[baseText] = true;
                const baseLabelOp = c.gridHBaseCol ? (c.gridHBaseOp != null ? c.gridHBaseOp : c.axisYFontOpacity) : c.axisYFontOpacity;
                ctx.fillStyle = this._resolvePlotColor(deactCol || c.gridHBaseCol || c.axisYFontColor, baseLabelOp);
                if (horizontal) {
                    this._drawEdgeLabel(ctx, baseText, basePt.x, drawH + Math.max(0, c.axisOffX), c.valueLabelRotation, 'bottom', yFit);
                } else {
                    this._drawEdgeLabel(ctx, baseText, -Math.max(0, c.axisOffX), basePt.y, c.valueLabelRotation, 'left', yFit);
                }
                ctx.fillStyle = this._resolvePlotColor(deactCol || c.axisYFontColor, c.axisYFontOpacity);
            }
        }
        if (c.showTickY) {
            let yTicks = scale.ticks ? scale.ticks.slice() : [];
            if (scale && scale.edgeMin != null && yTicks.indexOf(scale.edgeMin) < 0) yTicks.push(scale.edgeMin);
            if (scale && scale.edgeMax != null && yTicks.indexOf(scale.edgeMax) < 0) yTicks.push(scale.edgeMax);
            if (c.tickYCount > 1 && scale && scale.renderMin != null && scale.renderMax != null) {
                yTicks = [];
                const count = Math.max(2, Math.floor(c.tickYCount));
                for (let ti = 0; ti < count; ti++) {
                    yTicks.push(scale.renderMin + (ti / (count - 1)) * (scale.renderMax - scale.renderMin));
                }
            }
            const maxSpan = horizontal ? drawW : drawH;
            for (let i = 0; i < yTicks.length; i++) {
                const v = yTicks[i];
                if (horizontal) {
                    const x = this._placeValue(0, v, geom).x;
                    if (x < -0.5 || x > maxSpan + 0.5) continue;
                    this._drawCanvasLine(ctx, x, drawH + (c.tickYOffset || 0), x, drawH + (c.tickYOffset || 0) + (c.tickYSize || 6), deactCol || c.tickYColor, c.tickYThickness, 100);
                } else {
                    const y = this._placeValue(0, v, geom).y;
                    if (y < -0.5 || y > maxSpan + 0.5) continue;
                    this._drawCanvasLine(ctx, -(c.tickYOffset || 0), y, -(c.tickYOffset || 0) - (c.tickYSize || 6), y, deactCol || c.tickYColor, c.tickYThickness, 100);
                }
            }
        }
        if (c.showAxisX) {
            this._setCanvasFont(ctx, c.axisXFontSize, c.axisXFont, c.axisXFontBold, false);
            ctx.fillStyle = this._resolvePlotColor(deactCol || c.axisXFontColor, c.axisXFontOpacity);
            const xFit = { limits: this._plotTextLimits, fontSize: c.axisXFontSize, family: c.axisXFont, bold: c.axisXFontBold };
            for (let i = 0; i < catTicks.length; i++) {
                const tick = catTicks[i];
                if (horizontal) {
                    this._drawEdgeLabel(ctx, tick.text, -Math.max(0, c.axisOffY), tick.frac * drawH, c.categoryLabelRotation, 'left', xFit);
                } else {
                    this._drawEdgeLabel(ctx, tick.text, tick.frac * drawW, drawH + Math.max(0, c.axisOffY), c.categoryLabelRotation, 'bottom', xFit);
                }
            }
        }
        if (c.showTickX) {
            const step = Math.max(1, Math.floor(Number(c.tickXSpacing) || 1));
            for (let i = 0; i < catTicks.length; i += step) {
                const tick = catTicks[i];
                if (horizontal) {
                    const y = tick.frac * drawH;
                    this._drawCanvasLine(ctx, -(c.tickXOffset || 0), y, -(c.tickXOffset || 0) - (c.tickXSize || 6), y, deactCol || c.tickXColor, c.tickXThickness, 100);
                } else {
                    const x = tick.frac * drawW;
                    this._drawCanvasLine(ctx, x, drawH + (c.tickXOffset || 0), x, drawH + (c.tickXOffset || 0) + (c.tickXSize || 6), deactCol || c.tickXColor, c.tickXThickness, 100);
                }
            }
        }
    }

    _paintGraph(c) {
        const box = this._measurePlotBox();
        const ctx = this._preparePlotCanvas(box.w, box.h, 0, 0);
        if (!ctx) return;
        const horizontal = c.type === 'bar' && c.barDirection === 'horizontal';
        const isReversed = c.reverseDirection === true;

        const seriesLayout = this._buildSeriesPlotRows(c);
        const rows = seriesLayout.rows;
        const domain = seriesLayout.domain;
        const maxLen = seriesLayout.maxLen;

        const proj = this._projectSeriesPoints(c, rows, domain, maxLen, horizontal, isReversed);
        const placed = proj.placed;
        const dataMin = proj.dataMin;
        const dataMax = proj.dataMax;

        const resolved = this._resolvePlotScaleAndReserves(box, c, rows, placed, domain, maxLen, dataMin, dataMax, horizontal);
        const reserve = resolved.reserve;
        const drawW = resolved.drawW;
        const drawH = resolved.drawH;
        const alongPx = resolved.alongPx;
        const scale = resolved.scale;
        const catBox = resolved.catBox;
        const decimals = resolved.decimals;
        const geom = resolved.geom;
        const basePt = resolved.basePt;
        const baseAlong = resolved.baseAlong;

        this._lastStartX = reserve.left;
        this._plotCanvasOriginX = 0;
        this._plotCanvasOriginY = reserve.top;
        this._plotTextLimits = {
            minX: -reserve.left + 1,
            maxX: drawW + reserve.right - 1,
            minY: -reserve.top + 1,
            maxY: drawH + reserve.bottom - 1
        };
        this.renderedPoints = [];

        const deact = c.deactivated === true;
        const deactCol = deact ? BaseWidget.getDeactivatedColor(c) : null;
        const accent = deact ? BaseWidget.getDeactivatedColorAccent(c) : null;

        const onBottomLine = horizontal
            ? (Math.abs(basePt.x - 0) < 0.5 || geom.baseline <= geom.renderMin)
            : (Math.abs(basePt.y - drawH) < 0.5 || geom.baseline <= geom.renderMin);
        const withinPlot = geom.baseline <= geom.renderMax && (horizontal ? (basePt.x <= drawW + 0.5) : (basePt.y >= -0.5));
        const showBaseline = c.gridHBaseShow && !onBottomLine && withinPlot;

        const catTicks = this._buildCategoryTicks(c, domain, maxLen, alongPx, catBox, horizontal, isReversed, placed, rows);

        ctx.save();
        ctx.translate(reserve.left, reserve.top);

        this._drawPlotGridAndBorders(ctx, c, geom, scale, catTicks, basePt, showBaseline, deactCol, drawW, drawH, horizontal);

        let lastVal = null;
        if (c.type === 'bar') {
            const drawnSeries = [];
            for (let i = 0; i < rows.length; i++) if (rows[i].drawn) drawnSeries.push(i);
            const barLabelPts = [];
            lastVal = this._drawBarSeries(ctx, c, geom, rows, placed, drawnSeries, maxLen, alongPx, baseAlong, domain, accent, deactCol, drawW, drawH, horizontal, isReversed, barLabelPts);
        } else if (c.type !== 'text') {
            const seriesPlottedPts = [];
            lastVal = this._drawLineSeries(ctx, c, geom, rows, placed, alongPx, baseAlong, domain, accent, drawW, drawH, horizontal, isReversed, seriesPlottedPts);
        } else {
            // Legacy text plot: one centered text per slot at mid height
            this._setCanvasFont(ctx, c.textSize, c.textFont, c.textFontBold, false);
            ctx.fillStyle = this._resolvePlotColor(accent || c.textColor, 100);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const pixelCap = Math.max(2, Math.floor(alongPx));
            for (let s = 0; s < rows.length; s++) {
                if (!rows[s].drawn) continue;
                const pts = placed[s];
                const count = Math.max(1, pts.length);
                const step = Math.max(1, Math.ceil(count / pixelCap));
                for (let i = 0; i < pts.length; i += step) {
                    if (pts[i].isDropped) continue;
                    const raw = pts[i].v;
                    let text = '';
                    if (raw != null && isFinite(raw)) text = Number(raw).toFixed(c.decimals);
                    else if (pts[i].l != null && String(pts[i].l) !== '') text = String(pts[i].l);
                    else if (raw != null) text = String(raw);
                    if (!text) continue;
                    const x = pts[i].t != null
                        ? pts[i].cat * drawW
                        : ((i + 0.5) / count) * drawW;
                    const fitted = this._shiftLabelAnchor(
                        isNaN(x) ? 0 : x,
                        drawH / 2,
                        this._estimateGraphTextWidth(text, c.textSize, c.textFont, c.textFontBold),
                        Math.max(1, Number(c.textSize) || 10) * 1.25,
                        'center',
                        'middle',
                        this._plotTextLimits
                    );
                    ctx.fillText(text, fitted.x, fitted.y);
                    lastVal = (raw != null && isFinite(raw)) ? raw : lastVal;
                }
            }
            ctx.restore();
            this._updatePlotA11y(c, lastVal);
            return;
        }

        this._drawPlotAxesAndTicks(ctx, c, geom, scale, catTicks, basePt, showBaseline, decimals, deactCol, drawW, drawH, horizontal);

        ctx.restore();
        this._updatePlotA11y(c, lastVal);
    }
}

WidgetRegistry.register('graph', GraphWidget);