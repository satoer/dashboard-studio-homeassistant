/**
 * Tools script: Auto-Widget Decision Diagram (lazy-loaded via tools-catalog).
 * Accessible only when `?test_mode=full` (or `?text_mode=full`) is active.
 *
 * Dynamically extracts and visualizes the top-down classification pipeline from
 * `scripts/auto-widget-gallery.js` (combining parsed `@rule` comment blocks,
 * live `match` function source, and `AutoWidgetGallery.getRulePipeline()`),
 * with real-time live topic tracing, Main vs. Optional Dropdown widget breakdown,
 * What-If sandbox testing, and live widget previews.
 * Zero memory or runtime footprint when closed.
 */
(function () {
    var state = null;
    var previewCounter = 0;

    var WIDGET_ICONS = {
        arrow: 'ph-arrow-right',
        battery: 'ph-battery-charging',
        clock: 'ph-clock',
        container: 'ph-squares-four',
        empty: 'ph-squares-four',
        editbox: 'ph-textbox',
        gauge: 'ph-gauge',
        graph: 'ph-chart-line',
        icon: 'ph-star',
        image: 'ph-image',
        label: 'ph-text-t',
        lightgrid: 'ph-lightbulb',
        list: 'ph-list-dashes',
        textbox: 'ph-list-dashes',
        menu: 'ph-list',
        slider: 'ph-sliders-horizontal',
        switch: 'ph-toggle-left',
        text: 'ph-text-t',
        videostream: 'ph-video-camera'
    };

    function widgetIconClass(typeOrId) {
        var key = String(typeOrId || '').toLowerCase();
        if ( WidgetRegistry && typeof WidgetRegistry.get === 'function') {
            var cls = WidgetRegistry.get(key === 'container' ? 'empty' : key);
            if (cls && cls.metadata && cls.metadata.icon) return cls.metadata.icon;
        }
        return WIDGET_ICONS[key] || 'ph-cube';
    }

    function ensureGalleryLoaded() {
        if (typeof AutoWidgetGallery !== 'undefined' && typeof AutoWidgetGallery.getRulePipeline === 'function') {
            return Promise.resolve();
        }
        if (typeof WidgetScriptLoader !== 'undefined' && typeof WidgetScriptLoader.loadScript === 'function') {
            return WidgetScriptLoader.loadScript('scripts/auto-widget-gallery.js');
        }
        return Promise.reject(new Error('AutoWidgetGallery script loader unavailable'));
    }

    function fetchGallerySourceText() {
        var url = 'scripts/auto-widget-gallery.js';
        if (typeof WidgetScriptLoader !== 'undefined' && typeof WidgetScriptLoader.authenticatedAssetUrl === 'function') {
            url = WidgetScriptLoader.authenticatedAssetUrl(url);
        }
        var sep = url.indexOf('?') >= 0 ? '&' : '?';
        return fetch(url + sep + 't=' + Date.now(), { cache: 'no-store' })
            .then(function (res) {
                if (!res.ok) return '';
                return res.text();
            })
            .catch(function () {
                return '';
            });
    }

    /**
     * Parses `/* @rule <id> ... * /` comment blocks from auto-widget-gallery.js source text
     * so human-readable rule documentation and source line numbers come straight from the script.
     */
    function parseRuleCommentsFromSource(sourceText) {
        var byId = Object.create(null);
        var order = [];
        if (!sourceText || typeof sourceText !== 'string') {
            return { byId: byId, order: order, headerNote: '' };
        }
        var blockRe = /\/\*([\s\S]*?)\*\//g;
        var match;
        while ((match = blockRe.exec(sourceText)) !== null) {
            var body = match[1];
            if (body.indexOf('@rule') === -1) continue;
            var lineNum = sourceText.slice(0, match.index).split('\n').length;
            var lines = body.split('\n');
            var parsed = {
                id: '',
                stage: 'pipeline',
                title: '',
                when: '',
                why: '',
                main: '',
                options: '',
                line: lineNum
            };
            var currentTag = '';
            for (var i = 0; i < lines.length; i++) {
                var clean = lines[i].replace(/^\s*\*\s?/, '').trim();
                if (!clean) continue;
                var tagMatch = clean.match(/^@(rule|stage|title|when|why|main|options)\s+(.*)$/i);
                if (tagMatch) {
                    currentTag = tagMatch[1].toLowerCase();
                    var val = tagMatch[2].trim();
                    if (currentTag === 'rule') parsed.id = val;
                    else parsed[currentTag] = val;
                } else if (currentTag && currentTag !== 'rule') {
                    parsed[currentTag] += ' ' + clean;
                }
            }
            if (parsed.id && parsed.id.indexOf('<') === -1) {
                byId[parsed.id] = parsed;
                order.push(parsed.id);
            }
        }
        return { byId: byId, order: order };
    }

    function extractFunctionBodySnippet(fn) {
        if (typeof fn !== 'function') return '';
        var raw = String(fn.toString()).trim();
        var bodyStart = raw.indexOf('{');
        var bodyEnd = raw.lastIndexOf('}');
        if (bodyStart !== -1 && bodyEnd > bodyStart) {
            var inner = raw.slice(bodyStart + 1, bodyEnd).trim();
            return inner.replace(/^\s+/gm, function (m) {
                return m.length >= 12 ? m.slice(12) : '';
            });
        }
        return raw;
    }

    function buildDynamicRuleModel(sourceText) {
        var pipeline = AutoWidgetGallery.getRulePipeline();
        var parsedComments = parseRuleCommentsFromSource(sourceText);
        var commentMap = parsedComments.byId;

        function enrichRule(rule, index, stage) {
            var doc = commentMap[rule.id] || {};
            var codeSnippet = extractFunctionBodySnippet(rule.match);
            return {
                id: rule.id,
                stepNumber: stage === 'prepass' ? 'PRE' : String(index + 1),
                stage: stage,
                title: doc.title || rule.title || rule.id,
                when: doc.when || rule.when || '',
                why: doc.why || rule.why || '',
                mainSummary: doc.main || '',
                optionsSummary: doc.options || '',
                sourceLine: doc.line || 0,
                conditionCode: codeSnippet,
                cards: Array.isArray(rule.cards) ? rule.cards : [],
                rawRule: rule
            };
        }

        var prepass = (pipeline.prepass || []).map(function (r, idx) {
            return enrichRule(r, idx, 'prepass');
        });
        var rules = (pipeline.rules || []).map(function (r, idx) {
            return enrichRule(r, idx, 'pipeline');
        });

        return {
            prepass: prepass,
            rules: rules,
            inferRules: pipeline.inferRules || [],
            fractionCaps: pipeline.fractionCaps || [],
            percentCaps: pipeline.percentCaps || [],
            tiles: pipeline.tiles || {}
        };
    }

    function formatPayloadPreview(val) {
        if (val === undefined) return 'undefined';
        if (val === null) return 'null';
        if (typeof val === 'string') {
            var clean = val.replace(/\s+/g, ' ').trim();
            if (clean.length > 48) return '"' + clean.slice(0, 48) + '..."';
            return '"' + clean + '"';
        }
        if (typeof val === 'number' || typeof val === 'boolean') return String(val);
        try {
            var str = JSON.stringify(val);
            if (str.length > 52) return str.slice(0, 52) + '...';
            return str;
        } catch (err) {
            return String(val);
        }
    }

    function accessTagMarkup(code) {
        if (typeof UIUtils !== 'undefined' && typeof UIUtils.createAccessLevelTag === 'function') {
            if (code === 'L') return UIUtils.createAccessLevelTag(false, false, false, false, true);
            if (code === 'W') return UIUtils.createAccessLevelTag(false, true);
            if (code === 'RW') return UIUtils.createAccessLevelTag(true, true);
            return UIUtils.createAccessLevelTag(true, false);
        }
        return '<span class="awd-access-fallback">' + (code || 'R') + '</span>';
    }

    function computeLiveRuleCensus() {
        var byRule = Object.create(null);
        var topics = AutoWidgetGallery.censusTopics ? AutoWidgetGallery.censusTopics() : [];
        var lightRes = AutoWidgetGallery.buildLightGrids ? AutoWidgetGallery.buildLightGrids(topics) : { grids: [], consumed: {} };
        var consumed = lightRes.consumed || {};
        byRule['prepass-lightgrid'] = [];
        for (var i = 0; i < topics.length; i++) {
            var t = topics[i];
            var meta = AutoWidgetGallery.topicMeta(t);
            var payload = AutoWidgetGallery.seedPayload(t, meta);
            var trace = AutoWidgetGallery.traceTopic(t, payload, meta, consumed);
            if (trace.isLightPrepass) {
                byRule['prepass-lightgrid'].push(t);
            } else if (trace.matchedRuleId) {
                if (!byRule[trace.matchedRuleId]) byRule[trace.matchedRuleId] = [];
                byRule[trace.matchedRuleId].push(t);
            }
        }
        return {
            topics: topics,
            consumed: consumed,
            byRule: byRule
        };
    }

    function parseSandboxPayloadInput(rawText) {
        var trimmed = String(rawText || '').trim();
        if (!trimmed) return '';
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;
        if (trimmed === 'null') return null;
        if (/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) {
            var n = parseFloat(trimmed);
            if (isFinite(n)) return n;
        }
        if ((trimmed.charAt(0) === '[' && trimmed.charAt(trimmed.length - 1) === ']') ||
            (trimmed.charAt(0) === '{' && trimmed.charAt(trimmed.length - 1) === '}')) {
            try {
                return JSON.parse(trimmed);
            } catch (e) { /* keep as string */ }
        }
        return rawText;
    }

    function unmountInspectorPreviews() {
        if (!state || !state.previewMounts) return;
        for (var i = 0; i < state.previewMounts.length; i++) {
            var m = state.previewMounts[i];
            if (m && m.widget && typeof m.widget.destroy === 'function') {
                try { m.widget.destroy(); } catch (e) { /* ignore */ }
            }
        }
        state.previewMounts = [];
    }

    function mountEntryMiniPreview(entry, hostEl) {
        if (!entry || !hostEl || typeof WidgetRegistry === 'undefined') return;
        var WidgetClass = WidgetRegistry.get(entry.type);
        if (!WidgetClass) {
            hostEl.textContent = 'Widget type (' + entry.type + ') not registered';
            return;
        }
        hostEl.innerHTML = '';
        var hostId = 'awd_prev_host_' + (++previewCounter);
        var wid = 'awd_prev_wid_' + previewCounter;
        hostEl.id = hostId;

        var canvas = document.getElementById('dashboard-canvas');
        if (canvas && hostEl.parentNode) {
            var computed = window.getComputedStyle ? window.getComputedStyle(canvas) : null;
            var bgColor = canvas.style.backgroundColor || (computed ? computed.backgroundColor : '');
            var bgImage = canvas.style.backgroundImage || (computed ? computed.backgroundImage : '');
            if (bgColor) hostEl.parentNode.style.backgroundColor = bgColor;
            if (bgImage) hostEl.parentNode.style.backgroundImage = bgImage;
        }

        var ov = JSON.parse(JSON.stringify(entry.overrides || {}));
        var w = hostEl.clientWidth > 16 ? hostEl.clientWidth : 220;
        var h = hostEl.clientHeight > 16 ? hostEl.clientHeight : 150;
        ov.x = 0;
        ov.y = 0;
        ov.width = w;
        ov.height = h;
        ov.padding = 0;

        try {
            var widget = new WidgetClass(hostId, wid, ov, JSON.parse(JSON.stringify(entry.bindings || {})));
            if (widget.elements && widget.elements.wrapper) {
                widget.elements.wrapper.style.pointerEvents = 'none';
            }
            state.previewMounts.push({ entry: entry, widget: widget, hostEl: hostEl });
            requestAnimationFrame(function () {
                if (!hostEl.isConnected || !widget || !widget.overrides) return;
                var nw = hostEl.clientWidth;
                var nh = hostEl.clientHeight;
                if (nw > 16 && nh > 16 && (widget.overrides.width !== nw || widget.overrides.height !== nh)) {
                    widget.overrides.width = nw;
                    widget.overrides.height = nh;
                    if (typeof widget.notifyOverridesMutated === 'function') widget.notifyOverridesMutated();
                    try { widget.render(); } catch (e2) { /* ignore */ }
                }
            });
        } catch (err) {
            hostEl.textContent = 'Preview unavailable';
        }
    }

    function ruleContainsWidgetType(rule, widgetTypeFilter) {
        if (!widgetTypeFilter || widgetTypeFilter === 'all') return { main: false, optional: false, any: true };
        var isMain = false;
        var isOpt = false;
        var cards = rule.cards || [];
        for (var i = 0; i < cards.length; i++) {
            var c = cards[i];
            if (c.mainWidget && (c.mainWidget.id === widgetTypeFilter || c.mainWidget.type === widgetTypeFilter)) {
                isMain = true;
            }
            var opts = c.optionalWidgets || [];
            for (var j = 0; j < opts.length; j++) {
                if (opts[j].id === widgetTypeFilter || opts[j].type === widgetTypeFilter) {
                    isOpt = true;
                }
            }
        }
        return { main: isMain, optional: isOpt, any: isMain || isOpt };
    }

    function renderCardOutcomeMarkup(cardSpec, liveEntry) {
        var box = document.createElement('div');
        box.className = 'awd-outcome-card';

        var roleHeader = document.createElement('div');
        roleHeader.className = 'awd-outcome-role';
        var roleBadge = document.createElement('span');
        roleBadge.className = 'awd-role-pill is-' + (cardSpec.role || 'read');
        if (cardSpec.role === 'write') roleBadge.textContent = 'Write Card';
        else if (cardSpec.role === 'read-write') roleBadge.textContent = 'Interactive Card';
        else if (cardSpec.role === 'grid') roleBadge.textContent = 'Shared Multi-Light Card';
        else roleBadge.textContent = 'Read Card';

        var accessHint = document.createElement('span');
        accessHint.className = 'awd-access-hint';
        accessHint.textContent = cardSpec.accessWhen || 'Any';
        roleHeader.appendChild(roleBadge);
        roleHeader.appendChild(accessHint);
        box.appendChild(roleHeader);

        // Main Widget Row
        var mainWrap = document.createElement('div');
        mainWrap.className = 'awd-main-widget-box';
        var mainTag = document.createElement('span');
        mainTag.className = 'awd-slot-label is-main';
        mainTag.textContent = 'MAIN WIDGET';

        var mainSpec = cardSpec.mainWidget || { id: 'label', label: 'Label', type: 'label', tile: '1x1', presets: [] };
        var activeTypeLabel = mainSpec.label;
        var activeTile = mainSpec.tile || '1x1';
        if (liveEntry) {
            var chosenChoice = liveEntry.choices && liveEntry.choices[liveEntry.choiceIndex];
            if (chosenChoice) activeTypeLabel = chosenChoice.label;
            if (liveEntry.tile) activeTile = liveEntry.tile;
        }

        var mainChip = document.createElement('div');
        mainChip.className = 'awd-widget-chip is-primary';
        var iconEl = document.createElement('i');
        iconEl.className = 'ph-bold ' + widgetIconClass(mainSpec.type || mainSpec.id);
        var nameSpan = document.createElement('span');
        nameSpan.className = 'awd-widget-chip-name';
        nameSpan.textContent = activeTypeLabel;
        var tileSpan = document.createElement('span');
        tileSpan.className = 'awd-tile-badge';
        tileSpan.textContent = activeTile;
        mainChip.appendChild(iconEl);
        mainChip.appendChild(nameSpan);
        mainChip.appendChild(tileSpan);

        mainWrap.appendChild(mainTag);
        mainWrap.appendChild(mainChip);

        var presets = mainSpec.presets || [];
        if (presets.length > 0) {
            var presetRow = document.createElement('div');
            presetRow.className = 'awd-presets-row';
            var presetLabel = document.createElement('span');
            presetLabel.className = 'awd-sub-label';
            presetLabel.textContent = presets.length > 1 ? ('Styles (' + presets.length + '):') : 'Style:';
            presetRow.appendChild(presetLabel);
            for (var p = 0; p < presets.length; p++) {
                var pTag = document.createElement('span');
                pTag.className = 'awd-preset-pill' + (p === 0 ? ' is-default' : '');
                pTag.textContent = presets[p];
                presetRow.appendChild(pTag);
            }
            mainWrap.appendChild(presetRow);
        }
        box.appendChild(mainWrap);

        // Optional Dropdown Widgets Row
        var optList = cardSpec.optionalWidgets || [];
        var optWrap = document.createElement('div');
        optWrap.className = 'awd-optional-widgets-box';
        var optHeader = document.createElement('span');
        optHeader.className = 'awd-slot-label is-optional';
        optHeader.textContent = optList.length ? ('OPTIONAL DROPDOWN WIDGETS (' + optList.length + ')') : 'OPTIONAL DROPDOWN WIDGETS';
        optWrap.appendChild(optHeader);

        var optChips = document.createElement('div');
        optChips.className = 'awd-opt-chips';
        if (!optList.length) {
            var noneEl = document.createElement('span');
            noneEl.className = 'awd-no-options';
            noneEl.textContent = 'Single widget type (dropdown hidden)';
            optChips.appendChild(noneEl);
        } else {
            for (var k = 0; k < optList.length; k++) {
                var opt = optList[k];
                var chip = document.createElement('span');
                chip.className = 'awd-widget-chip is-secondary';
                var oIcon = document.createElement('i');
                oIcon.className = 'ph-bold ' + widgetIconClass(opt.type || opt.id);
                var oName = document.createElement('span');
                oName.textContent = opt.label;
                chip.appendChild(oIcon);
                chip.appendChild(oName);
                if (opt.tile) {
                    var oTile = document.createElement('span');
                    oTile.className = 'awd-tile-badge';
                    oTile.textContent = opt.tile;
                    chip.appendChild(oTile);
                }
                optChips.appendChild(chip);
            }
        }
        optWrap.appendChild(optChips);
        box.appendChild(optWrap);

        return box;
    }

    function buildRuleNodeRow(rule, isPrepass) {
        var row = document.createElement('div');
        row.className = 'awd-flow-row' + (isPrepass ? ' is-prepass-row' : '');
        row.setAttribute('data-rule-id', rule.id);

        // Left Spine Column: Decision Box + Down Connector
        var spineCol = document.createElement('div');
        spineCol.className = 'awd-spine-col';

        var decisionCard = document.createElement('div');
        decisionCard.className = 'awd-decision-node';
        decisionCard.addEventListener('click', function () {
            selectRuleForInspector(rule.id);
        });

        var head = document.createElement('div');
        head.className = 'awd-decision-head';

        var stepBadge = document.createElement('span');
        stepBadge.className = 'awd-step-badge' + (isPrepass ? ' is-prepass' : '');
        stepBadge.textContent = isPrepass ? 'PRE-PASS' : ('RULE #' + rule.stepNumber);

        var titleEl = document.createElement('span');
        titleEl.className = 'awd-decision-title';
        titleEl.textContent = rule.title;

        var statusBadge = document.createElement('span');
        statusBadge.className = 'awd-eval-badge';
        statusBadge.textContent = 'IDLE';

        var countBtn = document.createElement('button');
        countBtn.type = 'button';
        countBtn.className = 'awd-topic-count-badge';
        countBtn.title = 'Click to inspect live topics matching this rule';
        countBtn.textContent = '0 live';
        countBtn.addEventListener('click', function (ev) {
            ev.stopPropagation();
            selectRuleForInspector(rule.id, true);
        });

        head.appendChild(stepBadge);
        head.appendChild(titleEl);
        head.appendChild(countBtn);
        head.appendChild(statusBadge);

        var whenEl = document.createElement('div');
        whenEl.className = 'awd-decision-when';
        whenEl.innerHTML = '<strong>IF:</strong> ';
        var whenSpan = document.createElement('span');
        whenSpan.textContent = rule.when;
        whenEl.appendChild(whenSpan);

        var whyEl = document.createElement('div');
        whyEl.className = 'awd-decision-why';
        whyEl.textContent = rule.why;

        var codeEl = document.createElement('pre');
        codeEl.className = 'awd-decision-code';
        codeEl.textContent = rule.conditionCode || '';

        decisionCard.appendChild(head);
        decisionCard.appendChild(whenEl);
        decisionCard.appendChild(whyEl);
        if (rule.conditionCode) decisionCard.appendChild(codeEl);

        var downArrow = document.createElement('div');
        downArrow.className = 'awd-spine-down';
        var downLine = document.createElement('div');
        downLine.className = 'awd-spine-down-line';
        var downLabel = document.createElement('span');
        downLabel.className = 'awd-branch-label is-no';
        downLabel.textContent = 'NO → Next Rule';
        downArrow.appendChild(downLine);
        downArrow.appendChild(downLabel);

        spineCol.appendChild(decisionCard);
        spineCol.appendChild(downArrow);

        // Middle Horizontal Branch Connector (YES -> Match)
        var branchCol = document.createElement('div');
        branchCol.className = 'awd-branch-col';
        var branchLine = document.createElement('div');
        branchLine.className = 'awd-branch-line';
        var yesLabel = document.createElement('span');
        yesLabel.className = 'awd-branch-label is-yes';
        yesLabel.textContent = 'YES → ATTACH';
        branchCol.appendChild(branchLine);
        branchCol.appendChild(yesLabel);

        // Right Column: Generated Widget Card(s)
        var outcomeCol = document.createElement('div');
        outcomeCol.className = 'awd-outcome-col';
        outcomeCol.addEventListener('click', function () {
            selectRuleForInspector(rule.id);
        });

        var cards = rule.cards || [];
        for (var c = 0; c < cards.length; c++) {
            outcomeCol.appendChild(renderCardOutcomeMarkup(cards[c], null));
        }

        row.appendChild(spineCol);
        row.appendChild(branchCol);
        row.appendChild(outcomeCol);

        state.rowElements[rule.id] = {
            row: row,
            decisionCard: decisionCard,
            statusBadge: statusBadge,
            countBtn: countBtn,
            downArrow: downArrow,
            branchCol: branchCol,
            outcomeCol: outcomeCol,
            rule: rule
        };

        return row;
    }

    function buildDiagramCanvas() {
        var wrap = document.createElement('div');
        wrap.className = 'awd-diagram-tree';

        // 1. Entry Stream Header Node
        var entryNode = document.createElement('div');
        entryNode.className = 'awd-entry-node';
        var entryTitle = document.createElement('div');
        entryTitle.className = 'awd-entry-title';
        entryTitle.innerHTML = '<i class="ph-bold ph-broadcast"></i><span>INCOMING LIVE TOPIC & PAYLOAD STREAM</span>';
        var entrySummary = document.createElement('div');
        entrySummary.className = 'awd-entry-summary';
        entrySummary.textContent = 'Select a live topic above or enable Auto-Follow Live Stream to trace its path in real time.';
        var entryPills = document.createElement('div');
        entryPills.className = 'awd-entry-pills';
        entryNode.appendChild(entryTitle);
        entryNode.appendChild(entrySummary);
        entryNode.appendChild(entryPills);

        state.entryNode = entryNode;
        state.entrySummary = entrySummary;
        state.entryPills = entryPills;
        wrap.appendChild(entryNode);

        var entryDown = document.createElement('div');
        entryDown.className = 'awd-entry-down';
        wrap.appendChild(entryDown);

        // 2. Pre-pass Rule(s)
        var model = state.model;
        for (var p = 0; p < model.prepass.length; p++) {
            wrap.appendChild(buildRuleNodeRow(model.prepass[p], true));
        }

        // 3. Ordered Top-Down Pipeline Rules
        for (var i = 0; i < model.rules.length; i++) {
            var rRow = buildRuleNodeRow(model.rules[i], false);
            if (i === model.rules.length - 1) {
                rRow.classList.add('is-last-rule');
            }
            wrap.appendChild(rRow);
        }

        // 4. Fallback End Node (Unmatched / Ignored)
        var fallbackNode = document.createElement('div');
        fallbackNode.className = 'awd-fallback-node';
        fallbackNode.innerHTML = '<i class="ph-bold ph-prohibit"></i><span>No Widget Attached (Empty / Unrecognized Payload or Consumed Sibling Topic)</span>';
        state.fallbackNode = fallbackNode;
        wrap.appendChild(fallbackNode);

        return wrap;
    }

    function applyZoomAndPan() {
        if (!state || !state.treeEl) return;
        state.treeEl.style.transform = 'translate(' + Math.round(state.panX) + 'px, ' + Math.round(state.panY) + 'px) scale(' + state.zoom.toFixed(3) + ')';
        if (state.zoomLabel) {
            state.zoomLabel.textContent = Math.round(state.zoom * 100) + '%';
        }
    }

    function resetViewTransform() {
        if (!state) return;
        state.zoom = 1;
        state.panX = 0;
        state.panY = 0;
        applyZoomAndPan();
        if (state.viewportEl) {
            state.viewportEl.scrollTop = 0;
            state.viewportEl.scrollLeft = 0;
        }
    }

    function scrollRuleIntoView(ruleId) {
        if (!state || !ruleId || !state.rowElements[ruleId] || !state.viewportEl) return;
        var rowEl = state.rowElements[ruleId].row;
        if (rowEl && typeof rowEl.scrollIntoView === 'function') {
            rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function refreshLiveCensusBadges() {
        if (!state || !state.model) return;
        var census = computeLiveRuleCensus();
        state.census = census;

        var allRules = state.model.prepass.concat(state.model.rules);
        for (var i = 0; i < allRules.length; i++) {
            var r = allRules[i];
            var ui = state.rowElements[r.id];
            if (!ui || !ui.countBtn) continue;
            var list = census.byRule[r.id] || [];
            ui.countBtn.textContent = list.length + (list.length === 1 ? ' live topic' : ' live topics');
            ui.countBtn.classList.toggle('has-topics', list.length > 0);
        }

        populateTopicPickerOptions();
    }

    function populateTopicPickerOptions() {
        if (!state || !state.topicSelect) return;
        var topics = state.census ? state.census.topics : (AutoWidgetGallery.censusTopics ? AutoWidgetGallery.censusTopics() : []);
        var filterText = state.topicFilterInput ? String(state.topicFilterInput.value || '').trim().toLowerCase() : '';
        var filtered = topics.filter(function (t) {
            if (!filterText) return true;
            var meta = AutoWidgetGallery.topicMeta(t);
            var payload = AutoWidgetGallery.readPayload(t);
            var blob = (t + ' ' + (meta && meta.title ? meta.title : '') + ' ' + formatPayloadPreview(payload)).toLowerCase();
            return blob.indexOf(filterText) !== -1;
        });

        var currentVal = state.selectedTopic || '';
        var sig = filtered.join('\n') + '||' + currentVal;
        if (state.topicSelect.getAttribute('data-awd-sig') === sig) return;
        state.topicSelect.setAttribute('data-awd-sig', sig);

        state.topicSelect.innerHTML = '';
        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = filtered.length
            ? ('Select a live topic to trace (' + filtered.length + ' available)...')
            : 'No live topics match filter...';
        state.topicSelect.appendChild(placeholder);

        for (var i = 0; i < filtered.length; i++) {
            var topic = filtered[i];
            var meta = AutoWidgetGallery.topicMeta(topic);
            var payload = AutoWidgetGallery.readPayload(topic);
            var opt = document.createElement('option');
            opt.value = topic;
            var preview = formatPayloadPreview(payload);
            var flags = meta ? ((meta.getable && meta.setable) ? 'RW' : (meta.setable ? 'W' : 'R')) : (topic.indexOf('local/') === 0 ? 'L' : 'R');
            opt.textContent = '[' + flags + '] ' + topic + '  =  ' + preview;
            state.topicSelect.appendChild(opt);
        }

        if (currentVal && filtered.indexOf(currentVal) !== -1) {
            state.topicSelect.value = currentVal;
        } else if (currentVal) {
            var extraOpt = document.createElement('option');
            extraOpt.value = currentVal;
            extraOpt.textContent = currentVal + ' = ' + formatPayloadPreview(AutoWidgetGallery.readPayload(currentVal));
            state.topicSelect.appendChild(extraOpt);
            state.topicSelect.value = currentVal;
        }
    }

    function applyWidgetTypeHighlight(widgetType) {
        if (!state) return;
        state.widgetFilter = widgetType || 'all';
        if (state.filterBarEl) {
            var btns = state.filterBarEl.querySelectorAll('[data-widget-filter]');
            for (var b = 0; b < btns.length; b++) {
                var val = btns[b].getAttribute('data-widget-filter');
                btns[b].classList.toggle('is-active', val === state.widgetFilter);
            }
        }
        var allRules = state.model.prepass.concat(state.model.rules);
        for (var i = 0; i < allRules.length; i++) {
            var r = allRules[i];
            var ui = state.rowElements[r.id];
            if (!ui) continue;
            var hit = ruleContainsWidgetType(r, state.widgetFilter);
            ui.row.classList.toggle('is-filter-dimmed', state.widgetFilter !== 'all' && !hit.any);
            ui.row.classList.toggle('is-filter-main', state.widgetFilter !== 'all' && hit.main);
            ui.row.classList.toggle('is-filter-optional', state.widgetFilter !== 'all' && !hit.main && hit.optional);
        }
    }

    function runActiveTrace(pulseMatched) {
        if (!state || !state.model) return;
        var topic = '';
        var payload = undefined;
        var meta = null;
        var consumed = (state.census && state.census.consumed) ? state.census.consumed : {};

        if (state.sandboxMode) {
            topic = state.sandboxTopicInput ? String(state.sandboxTopicInput.value || 'device/sensor').trim() : 'device/sensor';
            payload = parseSandboxPayloadInput(state.sandboxPayloadInput ? state.sandboxPayloadInput.value : '');
            var accessVal = state.sandboxAccessSelect ? state.sandboxAccessSelect.value : 'R';
            var unitVal = state.sandboxUnitInput ? String(state.sandboxUnitInput.value || '').trim() : '';
            meta = {
                getable: accessVal === 'R' || accessVal === 'RW' || accessVal === 'L',
                setable: accessVal === 'W' || accessVal === 'RW' || accessVal === 'L',
                units: unitVal || null
            };
            consumed = {};
        } else {
            topic = state.selectedTopic || '';
            if (topic) {
                meta = AutoWidgetGallery.topicMeta(topic);
                payload = AutoWidgetGallery.seedPayload(topic, meta);
            }
        }

        if (!topic) {
            clearDiagramTraceVisuals();
            renderInspectorPanel(null);
            return;
        }

        var trace = AutoWidgetGallery.traceTopic(topic, payload, meta, consumed);
        state.currentTrace = trace;
        paintDiagramTraceVisuals(trace, pulseMatched);
        renderInspectorPanel(trace);
    }

    function clearDiagramTraceVisuals() {
        if (!state) return;
        if (state.entryNode) state.entryNode.classList.remove('is-traced');
        if (state.entrySummary) {
            state.entrySummary.textContent = 'Select a live topic above, enable Auto-Follow Live Stream, or open the What-If Sandbox to see the real-time path.';
        }
        if (state.entryPills) state.entryPills.innerHTML = '';
        if (state.fallbackNode) state.fallbackNode.classList.remove('is-matched');

        Object.keys(state.rowElements).forEach(function (id) {
            var ui = state.rowElements[id];
            ui.row.classList.remove('is-evaluated-pass', 'is-matched', 'is-skipped-after', 'is-live-pulse');
            ui.statusBadge.textContent = 'IDLE';
            ui.statusBadge.className = 'awd-eval-badge';
        });
    }

    function paintDiagramTraceVisuals(trace, pulseMatched) {
        if (!state || !trace) return;
        state.entryNode.classList.add('is-traced');
        state.entrySummary.textContent = 'Tracing live path for "' + trace.name + '" (' + trace.topic + ')';
        state.entryPills.innerHTML = '';

        var pills = [
            { label: 'Topic', val: trace.topic },
            { label: 'Value', val: formatPayloadPreview(trace.payload) },
            { label: 'Access', html: accessTagMarkup(trace.access) },
            { label: 'Capability', val: trace.cap || '-' }
        ];
        if (trace.unit) pills.push({ label: 'Unit', val: trace.unit });
        if (trace.inferred && trace.inferred.icon) {
            pills.push({ label: 'Inferred Icon', icon: trace.inferred.icon, val: trace.inferred.icon });
        }

        for (var p = 0; p < pills.length; p++) {
            var pill = document.createElement('span');
            pill.className = 'awd-entry-pill';
            var kSpan = document.createElement('strong');
            kSpan.textContent = pills[p].label + ': ';
            pill.appendChild(kSpan);
            if (pills[p].html) {
                var hSpan = document.createElement('span');
                hSpan.innerHTML = pills[p].html;
                pill.appendChild(hSpan);
            } else {
                if (pills[p].icon) {
                    var ic = document.createElement('i');
                    ic.className = 'ph-bold ' + pills[p].icon;
                    pill.appendChild(ic);
                }
                var vSpan = document.createElement('span');
                vSpan.textContent = pills[p].val;
                pill.appendChild(vSpan);
            }
            state.entryPills.appendChild(pill);
        }

        // Prepass visual
        var preUi = state.rowElements['prepass-lightgrid'];
        if (preUi) {
            preUi.row.classList.remove('is-evaluated-pass', 'is-matched', 'is-skipped-after', 'is-live-pulse');
            if (trace.isLightPrepass) {
                preUi.row.classList.add('is-matched');
                preUi.statusBadge.textContent = 'MATCHED';
                preUi.statusBadge.className = 'awd-eval-badge is-match';
                if (pulseMatched) {
                    void preUi.row.offsetWidth;
                    preUi.row.classList.add('is-live-pulse');
                }
            } else {
                preUi.row.classList.add('is-evaluated-pass');
                preUi.statusBadge.textContent = 'PASS (NO)';
                preUi.statusBadge.className = 'awd-eval-badge is-pass';
            }
        }

        // Pipeline steps
        for (var i = 0; i < trace.steps.length; i++) {
            var step = trace.steps[i];
            var ui = state.rowElements[step.id];
            if (!ui) continue;
            ui.row.classList.remove('is-evaluated-pass', 'is-matched', 'is-skipped-after', 'is-live-pulse');
            if (step.matched) {
                ui.row.classList.add('is-matched');
                ui.statusBadge.textContent = 'MATCHED';
                ui.statusBadge.className = 'awd-eval-badge is-match';
                if (pulseMatched) {
                    void ui.row.offsetWidth;
                    ui.row.classList.add('is-live-pulse');
                }
                // Update outcome cards with live entry details if available
                ui.outcomeCol.innerHTML = '';
                var specCards = ui.rule.cards || [];
                for (var c = 0; c < specCards.length; c++) {
                    var matchingLive = trace.entries && trace.entries[c] ? trace.entries[c] : (trace.entries && trace.entries[0] ? trace.entries[0] : null);
                    ui.outcomeCol.appendChild(renderCardOutcomeMarkup(specCards[c], matchingLive));
                }
            } else if (step.evaluated) {
                ui.row.classList.add('is-evaluated-pass');
                ui.statusBadge.textContent = 'PASS (NO)';
                ui.statusBadge.className = 'awd-eval-badge is-pass';
            } else {
                ui.row.classList.add('is-skipped-after');
                ui.statusBadge.textContent = 'NOT REACHED';
                ui.statusBadge.className = 'awd-eval-badge is-skipped';
            }
        }

        if (state.fallbackNode) {
            state.fallbackNode.classList.toggle('is-matched', !trace.matchedRuleId);
        }
    }

    function selectRuleForInspector(ruleId, focusTopicsList) {
        if (!state) return;
        state.inspectedRuleId = ruleId;
        Object.keys(state.rowElements).forEach(function (id) {
            state.rowElements[id].decisionCard.classList.toggle('is-inspected', id === ruleId);
        });
        renderInspectorPanel(state.currentTrace, ruleId, focusTopicsList);
    }

    function renderInspectorPanel(trace, explicitRuleId, focusTopicsList) {
        if (!state || !state.inspectorBody) return;
        unmountInspectorPreviews();
        var body = state.inspectorBody;
        body.innerHTML = '';

        var ruleId = explicitRuleId || (trace && trace.matchedRuleId) || state.inspectedRuleId || (state.model.rules[0] && state.model.rules[0].id);
        var ruleObj = null;
        var allRules = state.model.prepass.concat(state.model.rules);
        for (var i = 0; i < allRules.length; i++) {
            if (allRules[i].id === ruleId) {
                ruleObj = allRules[i];
                break;
            }
        }

        // Section 1: Live Topic Trace Summary & Real Widget Previews (when a topic is active)
        if (trace) {
            var traceSec = document.createElement('div');
            traceSec.className = 'awd-inspector-section';

            var traceTitle = document.createElement('div');
            traceTitle.className = 'awd-inspector-heading';
            traceTitle.innerHTML = '<i class="ph-bold ph-path"></i><span>Live Topic Decision Path</span>';
            traceSec.appendChild(traceTitle);

            var summaryCard = document.createElement('div');
            summaryCard.className = 'awd-trace-summary-card';

            var topicLine = document.createElement('div');
            topicLine.className = 'awd-trace-topic-line';
            var topicCode = document.createElement('code');
            topicCode.textContent = trace.topic;
            var accessSpan = document.createElement('span');
            accessSpan.innerHTML = accessTagMarkup(trace.access);
            topicLine.appendChild(topicCode);
            topicLine.appendChild(accessSpan);
            summaryCard.appendChild(topicLine);

            var valLine = document.createElement('div');
            valLine.className = 'awd-trace-meta-line';
            valLine.textContent = 'Value: ' + formatPayloadPreview(trace.payload) +
                (trace.unit ? (' · Unit: ' + trace.unit) : '') +
                (trace.inferred && trace.inferred.icon ? (' · Icon: ' + trace.inferred.icon) : '');
            summaryCard.appendChild(valLine);

            var outcomeLine = document.createElement('div');
            outcomeLine.className = 'awd-trace-outcome-banner' + (trace.matchedRule ? ' is-hit' : ' is-miss');
            if (trace.matchedRule) {
                outcomeLine.innerHTML = '<i class="ph-bold ph-check-circle"></i><span>Matched <strong>' +
                    trace.matchedRule.title + '</strong> → ' + trace.entries.length +
                    (trace.entries.length === 1 ? ' widget card' : ' widget cards (Read + Write split)') + '</span>';
            } else if (trace.isConsumed) {
                outcomeLine.innerHTML = '<i class="ph-bold ph-info"></i><span>Consumed by paired Flow or Light Grid rule</span>';
            } else {
                outcomeLine.innerHTML = '<i class="ph-bold ph-warning-circle"></i><span>No rule matched this payload</span>';
            }
            summaryCard.appendChild(outcomeLine);
            traceSec.appendChild(summaryCard);

            // Render generated cards + Main vs Optional dropdown + Live Preview
            if (trace.entries && trace.entries.length) {
                for (var eIdx = 0; eIdx < trace.entries.length; eIdx++) {
                    (function (entry) {
                        var cardBox = document.createElement('div');
                        cardBox.className = 'awd-live-preview-card';

                        var cardTop = document.createElement('div');
                        cardTop.className = 'awd-live-preview-head';
                        var roleTag = document.createElement('span');
                        roleTag.className = 'awd-role-pill is-' + (entry.role || 'read');
                        roleTag.textContent = entry.role === 'write' ? 'Write Card' : (entry.role === 'read' ? 'Read Card' : 'Primary Card');
                        var cardName = document.createElement('strong');
                        cardName.textContent = entry.name + ' (' + (entry.tile || '1x1') + ')';
                        cardTop.appendChild(roleTag);
                        cardTop.appendChild(cardName);
                        cardBox.appendChild(cardTop);

                        // Main vs Optional choices breakdown for this specific card
                        var choices = entry.choices || [];
                        var choicesInfo = document.createElement('div');
                        choicesInfo.className = 'awd-card-choices-breakdown';
                        var mainChoice = choices[0];
                        var optChoices = choices.slice(1);
                        var mainHtml = '<div><strong>Main Widget:</strong> <span class="awd-inline-badge is-main">' +
                            (mainChoice ? mainChoice.label : entry.type) + '</span></div>';
                        var optHtml = '<div><strong>Dropdown Options:</strong> ';
                        if (optChoices.length) {
                            optHtml += optChoices.map(function (c) {
                                return '<span class="awd-inline-badge is-opt">' + c.label + '</span>';
                            }).join(' ');
                        } else {
                            optHtml += '<span class="awd-muted-note">None (single widget type)</span>';
                        }
                        optHtml += '</div>';
                        choicesInfo.innerHTML = mainHtml + optHtml;
                        cardBox.appendChild(choicesInfo);

                        // Interactive Controls: Switch Widget Type & Cycle Style Preset + Add to Canvas
                        var ctrlRow = document.createElement('div');
                        ctrlRow.className = 'awd-preview-controls';

                        if (choices.length > 1) {
                            var typeSel = document.createElement('select');
                            typeSel.className = 'control-input';
                            typeSel.title = 'Test Main vs. Optional Dropdown Widget';
                            for (var c = 0; c < choices.length; c++) {
                                var opt = document.createElement('option');
                                opt.value = choices[c].id;
                                opt.textContent = (c === 0 ? '★ Main: ' : '↳ Option: ') + choices[c].label;
                                typeSel.appendChild(opt);
                            }
                            typeSel.value = choices[entry.choiceIndex || 0].id;
                            typeSel.addEventListener('change', function () {
                                AutoWidgetGallery.convertType(entry, typeSel.value);
                                renderInspectorPanel(trace, ruleId);
                            });
                            ctrlRow.appendChild(typeSel);
                        }

                        if (entry.presets && entry.presets.length > 1) {
                            var styleBtn = document.createElement('button');
                            styleBtn.type = 'button';
                            styleBtn.className = 'btn-tool ds-dialog-button';
                            var curPreset = entry.presets[entry.presetIndex || 0];
                            styleBtn.innerHTML = '<i class="ph-bold ph-palette"></i><span>' + (curPreset ? curPreset.label : 'Style') + '</span>';
                            styleBtn.title = 'Cycle style preset';
                            styleBtn.addEventListener('click', function () {
                                entry.presetIndex = ((entry.presetIndex || 0) + 1) % entry.presets.length;
                                AutoWidgetGallery.applyPreset(entry);
                                renderInspectorPanel(trace, ruleId);
                            });
                            ctrlRow.appendChild(styleBtn);
                        }

                        var addSingleBtn = document.createElement('button');
                        addSingleBtn.type = 'button';
                        addSingleBtn.className = 'btn-tool ds-dialog-button primary';
                        addSingleBtn.innerHTML = '<i class="ph-bold ph-plus"></i><span>Add to Canvas</span>';
                        addSingleBtn.addEventListener('click', function () {
                            var tileSpec = state.model.tiles[entry.tile || '1x1'] || { w: 240, h: 200 };
                            AutoWidgetGallery.place([{
                                type: entry.type,
                                tile: entry.tile || '1x1',
                                name: entry.name,
                                keepSize: !!entry.keepSize,
                                placeW: tileSpec.w,
                                placeH: tileSpec.h,
                                overrides: entry.overrides,
                                bindings: entry.bindings
                            }]);
                        });
                        ctrlRow.appendChild(addSingleBtn);
                        cardBox.appendChild(ctrlRow);

                        var stageWrap = document.createElement('div');
                        stageWrap.className = 'awd-mini-stage-wrap';
                        var stageEl = document.createElement('div');
                        stageEl.className = 'awd-mini-stage';
                        stageWrap.appendChild(stageEl);
                        cardBox.appendChild(stageWrap);

                        traceSec.appendChild(cardBox);
                        mountEntryMiniPreview(entry, stageEl);
                    })(trace.entries[eIdx]);
                }
            }

            body.appendChild(traceSec);
        }

        // Section 2: Inspected Rule Details & Live Topics Matching This Rule
        if (ruleObj) {
            var ruleSec = document.createElement('div');
            ruleSec.className = 'awd-inspector-section';

            var rHead = document.createElement('div');
            rHead.className = 'awd-inspector-heading';
            rHead.innerHTML = '<i class="ph-bold ph-magnifying-glass"></i><span>Rule Specification (' +
                (ruleObj.stage === 'prepass' ? 'Pre-Pass' : ('Rule #' + ruleObj.stepNumber)) + ')</span>';
            ruleSec.appendChild(rHead);

            var rBox = document.createElement('div');
            rBox.className = 'awd-rule-detail-box';
            var rTitle = document.createElement('div');
            rTitle.className = 'awd-rule-detail-title';
            rTitle.textContent = ruleObj.title;
            rBox.appendChild(rTitle);

            if (ruleObj.sourceLine) {
                var srcMeta = document.createElement('div');
                srcMeta.className = 'awd-rule-source-meta';
                srcMeta.textContent = 'Extracted from scripts/auto-widget-gallery.js (line ' + ruleObj.sourceLine + ')';
                rBox.appendChild(srcMeta);
            }

            var rWhen = document.createElement('div');
            rWhen.className = 'awd-rule-detail-row';
            rWhen.innerHTML = '<strong>Condition:</strong> ';
            var wSpan = document.createElement('span');
            wSpan.textContent = ruleObj.when;
            rWhen.appendChild(wSpan);
            rBox.appendChild(rWhen);

            var rWhy = document.createElement('div');
            rWhy.className = 'awd-rule-detail-row';
            rWhy.innerHTML = '<strong>Rationale:</strong> ';
            var ySpan = document.createElement('span');
            ySpan.textContent = ruleObj.why;
            rWhy.appendChild(ySpan);
            rBox.appendChild(rWhy);

            if (ruleObj.conditionCode) {
                var rCode = document.createElement('pre');
                rCode.className = 'awd-decision-code';
                rCode.textContent = ruleObj.conditionCode;
                rBox.appendChild(rCode);
            }
            ruleSec.appendChild(rBox);

            // Live Topics Matching This Rule
            var matchingTopics = (state.census && state.census.byRule && state.census.byRule[ruleObj.id]) ? state.census.byRule[ruleObj.id] : [];
            var matchHead = document.createElement('div');
            matchHead.className = 'awd-inspector-subheading';
            matchHead.textContent = 'Live Topics Matching This Rule (' + matchingTopics.length + ')';
            ruleSec.appendChild(matchHead);

            var matchList = document.createElement('div');
            matchList.className = 'awd-matching-topics-list';
            if (!matchingTopics.length) {
                var emptyMatch = document.createElement('div');
                emptyMatch.className = 'awd-muted-note';
                emptyMatch.textContent = 'No currently active topics match this rule yet. Click "Test in Sandbox" below to simulate one.';
                matchList.appendChild(emptyMatch);
            } else {
                for (var m = 0; m < matchingTopics.length; m++) {
                    (function (tName) {
                        var tBtn = document.createElement('button');
                        tBtn.type = 'button';
                        tBtn.className = 'awd-topic-chip' + (state.selectedTopic === tName && !state.sandboxMode ? ' is-active' : '');
                        var pVal = formatPayloadPreview(AutoWidgetGallery.readPayload(tName));
                        tBtn.innerHTML = '<span class="awd-topic-chip-name">' + tName + '</span><span class="awd-topic-chip-val">' + pVal + '</span>';
                        tBtn.addEventListener('click', function () {
                            state.sandboxMode = false;
                            if (state.sandboxBar) state.sandboxBar.hidden = true;
                            if (state.sandboxToggleBtn) state.sandboxToggleBtn.classList.remove('is-active');
                            state.selectedTopic = tName;
                            if (state.topicSelect) state.topicSelect.value = tName;
                            runActiveTrace(true);
                            scrollRuleIntoView(ruleObj.id);
                        });
                        matchList.appendChild(tBtn);
                    })(matchingTopics[m]);
                }
            }
            ruleSec.appendChild(matchList);

            body.appendChild(ruleSec);
            if (focusTopicsList && matchList.scrollIntoView) {
                matchList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        // Section 3: Keyword Unit & Icon Inference Table (INFER_RULES)
        var inferSec = document.createElement('div');
        inferSec.className = 'awd-inspector-section';
        var inferHead = document.createElement('div');
        inferHead.className = 'awd-inspector-heading';
        inferHead.innerHTML = '<i class="ph-bold ph-magic-wand"></i><span>Keyword Unit & Icon Inference (' + state.model.inferRules.length + ' rules)</span>';
        inferSec.appendChild(inferHead);

        var inferGrid = document.createElement('div');
        inferGrid.className = 'awd-infer-grid';
        var activeTopicWords = trace ? String(trace.topic || '').toLowerCase().replace(/[_./-]+/g, ' ') : '';
        for (var ir = 0; ir < state.model.inferRules.length; ir++) {
            var inf = state.model.inferRules[ir];
            var chip = document.createElement('span');
            var matchedWord = activeTopicWords && ((' ' + activeTopicWords + ' ').indexOf(' ' + inf.word + ' ') !== -1);
            chip.className = 'awd-infer-chip' + (matchedWord ? ' is-matched' : '');
            var iconHtml = inf.icon ? ('<i class="ph-bold ' + inf.icon + '"></i>') : '';
            chip.innerHTML = iconHtml + '<strong>' + inf.word + '</strong>' + (inf.unit ? (' → ' + inf.unit) : '');
            inferGrid.appendChild(chip);
        }
        inferSec.appendChild(inferGrid);
        body.appendChild(inferSec);
    }

    function installLiveStreamHook() {
        if (!state || state._hooked || typeof Dashboard === 'undefined') return;
        state._hooked = true;
        state._prevApply = Dashboard.applyLocalTopicPayload;
        state._prevBatch = Dashboard.applyLocalTopicPayloadBatch;

        function handleIncoming(topic) {
            if (!state || !topic) return;
            if (state._rafPending) return;
            state._lastIncomingTopic = String(topic);
            state._rafPending = requestAnimationFrame(function () {
                if (!state) return;
                state._rafPending = 0;
                refreshLiveCensusBadges();
                if (state.autoFollowLive && !state.sandboxMode) {
                    state.selectedTopic = state._lastIncomingTopic;
                    if (state.topicSelect) state.topicSelect.value = state.selectedTopic;
                    runActiveTrace(true);
                    if (state.currentTrace && state.currentTrace.matchedRuleId && state.autoCenterPath) {
                        scrollRuleIntoView(state.currentTrace.matchedRuleId);
                    }
                } else if (!state.sandboxMode && state.selectedTopic === state._lastIncomingTopic) {
                    runActiveTrace(true);
                }
            });
        }

        state._wrappedApply = function (topic) {
            var res = state._prevApply.apply(Dashboard, arguments);
            handleIncoming(topic);
            return res;
        };
        state._wrappedBatch = function (map) {
            var res = state._prevBatch.apply(Dashboard, arguments);
            if (map && typeof map.forEach === 'function') {
                var lastTopic = null;
                map.forEach(function (_payload, t) { lastTopic = t; });
                if (lastTopic) handleIncoming(lastTopic);
            }
            return res;
        };

        Dashboard.applyLocalTopicPayload = state._wrappedApply;
        Dashboard.applyLocalTopicPayloadBatch = state._wrappedBatch;
    }

    function removeLiveStreamHook() {
        if (!state || !state._hooked || typeof Dashboard === 'undefined') return;
        if (state._rafPending) {
            cancelAnimationFrame(state._rafPending);
            state._rafPending = 0;
        }
        if (Dashboard.applyLocalTopicPayload === state._wrappedApply && state._prevApply) {
            Dashboard.applyLocalTopicPayload = state._prevApply;
        }
        if (Dashboard.applyLocalTopicPayloadBatch === state._wrappedBatch && state._prevBatch) {
            Dashboard.applyLocalTopicPayloadBatch = state._prevBatch;
        }
        state._hooked = false;
    }

    function buildUI(host, sourceText) {
        host.innerHTML = '';
        host.classList.add('awd-host');

        var model = buildDynamicRuleModel(sourceText);
        state = {
            host: host,
            model: model,
            rowElements: Object.create(null),
            previewMounts: [],
            selectedTopic: '',
            inspectedRuleId: null,
            currentTrace: null,
            autoFollowLive: false,
            autoCenterPath: true,
            sandboxMode: false,
            compactMode: false,
            widgetFilter: 'all',
            zoom: 1,
            panX: 0,
            panY: 0,
            census: null
        };

        var shell = document.createElement('div');
        shell.className = 'awd-shell';

        // Top Control Bar (Row 1: Live Topic Selector, Auto-Follow, Sandbox Toggle, View Controls)
        var toolbar = document.createElement('div');
        toolbar.className = 'awd-toolbar';

        var row1 = document.createElement('div');
        row1.className = 'awd-toolbar-row';

        var topicFilterInput = document.createElement('input');
        topicFilterInput.type = 'search';
        topicFilterInput.className = 'control-input awd-topic-filter';
        topicFilterInput.placeholder = 'Filter live topics...';
        topicFilterInput.addEventListener('input', function () {
            populateTopicPickerOptions();
        });
        state.topicFilterInput = topicFilterInput;

        var topicSelect = document.createElement('select');
        topicSelect.className = 'control-input awd-topic-select';
        topicSelect.addEventListener('change', function () {
            state.sandboxMode = false;
            if (state.sandboxBar) state.sandboxBar.hidden = true;
            if (state.sandboxToggleBtn) state.sandboxToggleBtn.classList.remove('is-active');
            state.selectedTopic = topicSelect.value;
            runActiveTrace(true);
            if (state.currentTrace && state.currentTrace.matchedRuleId) {
                scrollRuleIntoView(state.currentTrace.matchedRuleId);
            }
        });
        state.topicSelect = topicSelect;

        var autoFollowBtn = document.createElement('button');
        autoFollowBtn.type = 'button';
        autoFollowBtn.className = 'btn-tool ds-dialog-button awd-toggle-btn';
        autoFollowBtn.innerHTML = '<i class="ph-bold ph-broadcast"></i><span>Auto-Follow Live Stream</span>';
        autoFollowBtn.title = 'Automatically trace each incoming live topic in real time as messages arrive.';
        autoFollowBtn.addEventListener('click', function () {
            state.autoFollowLive = !state.autoFollowLive;
            autoFollowBtn.classList.toggle('is-active', state.autoFollowLive);
            if (state.autoFollowLive) {
                state.sandboxMode = false;
                if (state.sandboxBar) state.sandboxBar.hidden = true;
                if (state.sandboxToggleBtn) state.sandboxToggleBtn.classList.remove('is-active');
            }
        });

        var sandboxToggleBtn = document.createElement('button');
        sandboxToggleBtn.type = 'button';
        sandboxToggleBtn.className = 'btn-tool ds-dialog-button awd-toggle-btn';
        sandboxToggleBtn.innerHTML = '<i class="ph-bold ph-flask"></i><span>What-If Sandbox</span>';
        sandboxToggleBtn.title = 'Simulate custom topic names, payloads, and access flags to test any rule path.';
        sandboxToggleBtn.addEventListener('click', function () {
            state.sandboxMode = !state.sandboxMode;
            sandboxToggleBtn.classList.toggle('is-active', state.sandboxMode);
            if (state.sandboxBar) state.sandboxBar.hidden = !state.sandboxMode;
            if (state.sandboxMode) {
                state.autoFollowLive = false;
                autoFollowBtn.classList.remove('is-active');
                runActiveTrace(true);
            } else {
                runActiveTrace(false);
            }
        });
        state.sandboxToggleBtn = sandboxToggleBtn;

        var compactBtn = document.createElement('button');
        compactBtn.type = 'button';
        compactBtn.className = 'btn-tool ds-dialog-button awd-toggle-btn';
        compactBtn.innerHTML = '<i class="ph-bold ph-arrows-in-line-vertical"></i><span>Compact Code</span>';
        compactBtn.title = 'Show or hide extracted JS condition code inside rule nodes.';
        compactBtn.addEventListener('click', function () {
            state.compactMode = !state.compactMode;
            compactBtn.classList.toggle('is-active', state.compactMode);
            if (state.treeEl) state.treeEl.classList.toggle('is-compact', state.compactMode);
        });

        var zoomGroup = document.createElement('div');
        zoomGroup.className = 'awd-zoom-group';
        var zoomOutBtn = document.createElement('button');
        zoomOutBtn.type = 'button';
        zoomOutBtn.className = 'btn-tool ds-dialog-button';
        zoomOutBtn.innerHTML = '<i class="ph-bold ph-minus"></i>';
        zoomOutBtn.title = 'Zoom Out';
        zoomOutBtn.addEventListener('click', function () {
            state.zoom = Math.max(0.55, state.zoom - 0.1);
            applyZoomAndPan();
        });
        var zoomLabel = document.createElement('span');
        zoomLabel.className = 'awd-zoom-label';
        zoomLabel.textContent = '100%';
        state.zoomLabel = zoomLabel;
        var zoomInBtn = document.createElement('button');
        zoomInBtn.type = 'button';
        zoomInBtn.className = 'btn-tool ds-dialog-button';
        zoomInBtn.innerHTML = '<i class="ph-bold ph-plus"></i>';
        zoomInBtn.title = 'Zoom In';
        zoomInBtn.addEventListener('click', function () {
            state.zoom = Math.min(1.5, state.zoom + 0.1);
            applyZoomAndPan();
        });
        var zoomResetBtn = document.createElement('button');
        zoomResetBtn.type = 'button';
        zoomResetBtn.className = 'btn-tool ds-dialog-button';
        zoomResetBtn.textContent = 'Reset View';
        zoomResetBtn.addEventListener('click', resetViewTransform);
        zoomGroup.appendChild(zoomOutBtn);
        zoomGroup.appendChild(zoomLabel);
        zoomGroup.appendChild(zoomInBtn);
        zoomGroup.appendChild(zoomResetBtn);

        row1.appendChild(topicFilterInput);
        row1.appendChild(topicSelect);
        row1.appendChild(autoFollowBtn);
        row1.appendChild(sandboxToggleBtn);
        row1.appendChild(compactBtn);
        row1.appendChild(zoomGroup);
        toolbar.appendChild(row1);

        // Row 2: What-If Sandbox Bar (Hidden by default)
        var sandboxBar = document.createElement('div');
        sandboxBar.className = 'awd-sandbox-bar';
        sandboxBar.hidden = true;

        var sbTopic = document.createElement('input');
        sbTopic.type = 'text';
        sbTopic.className = 'control-input';
        sbTopic.placeholder = 'Simulated Topic (e.g. living-room/measure_temperature)';
        sbTopic.value = 'living-room/measure_temperature';
        state.sandboxTopicInput = sbTopic;

        var sbPayload = document.createElement('input');
        sbPayload.type = 'text';
        sbPayload.className = 'control-input';
        sbPayload.placeholder = 'Simulated Payload (e.g. 21.5, true, #ff5500, [10,20,30])';
        sbPayload.value = '21.5';
        state.sandboxPayloadInput = sbPayload;

        var sbAccess = document.createElement('select');
        sbAccess.className = 'control-input';
        [
            ['R', 'Access: Read-Only (R)'],
            ['RW', 'Access: Read & Write (RW)'],
            ['W', 'Access: Write-Only Trigger (W)'],
            ['L', 'Access: Local Topic (L)']
        ].forEach(function (pair) {
            var o = document.createElement('option');
            o.value = pair[0];
            o.textContent = pair[1];
            sbAccess.appendChild(o);
        });
        sbAccess.value = 'RW';
        state.sandboxAccessSelect = sbAccess;

        var sbUnit = document.createElement('input');
        sbUnit.type = 'text';
        sbUnit.className = 'control-input awd-sandbox-unit';
        sbUnit.placeholder = 'Meta Unit (optional)';
        state.sandboxUnitInput = sbUnit;

        [sbTopic, sbPayload, sbUnit].forEach(function (inp) {
            inp.addEventListener('input', function () {
                if (state && state.sandboxMode) runActiveTrace(false);
            });
        });
        sbAccess.addEventListener('change', function () {
            if (state && state.sandboxMode) runActiveTrace(true);
        });

        sandboxBar.appendChild(sbTopic);
        sandboxBar.appendChild(sbPayload);
        sandboxBar.appendChild(sbAccess);
        sandboxBar.appendChild(sbUnit);
        state.sandboxBar = sandboxBar;
        toolbar.appendChild(sandboxBar);

        // Row 3: Target Widget Type Filter Pills
        var filterBar = document.createElement('div');
        filterBar.className = 'awd-widget-filter-bar';
        var filterLabel = document.createElement('span');
        filterLabel.className = 'awd-filter-bar-label';
        filterLabel.textContent = 'Highlight Widget Paths:';
        filterBar.appendChild(filterLabel);

        var widgetFilterItems = [
            ['all', 'All Rules'],
            ['gauge', 'Gauge'],
            ['switch', 'Switch'],
            ['slider', 'Slider'],
            ['icon', 'Icon'],
            ['graph', 'Graph'],
            ['text', 'Text'],
            ['label', 'Label'],
            ['battery', 'Battery'],
            ['lightgrid', 'Light Grid'],
            ['list', 'List'],
            ['image', 'Image'],
            ['videostream', 'Video'],
            ['editbox', 'Edit Box'],
            ['container', 'Container']
        ];
        for (var wf = 0; wf < widgetFilterItems.length; wf++) {
            (function (pair) {
                var pill = document.createElement('button');
                pill.type = 'button';
                pill.className = 'awd-filter-pill' + (pair[0] === 'all' ? ' is-active' : '');
                pill.setAttribute('data-widget-filter', pair[0]);
                if (pair[0] !== 'all') {
                    var ic = document.createElement('i');
                    ic.className = 'ph-bold ' + widgetIconClass(pair[0]);
                    pill.appendChild(ic);
                }
                var tx = document.createElement('span');
                tx.textContent = pair[1];
                pill.appendChild(tx);
                pill.addEventListener('click', function () {
                    applyWidgetTypeHighlight(pair[0]);
                });
                filterBar.appendChild(pill);
            })(widgetFilterItems[wf]);
        }
        state.filterBarEl = filterBar;
        toolbar.appendChild(filterBar);

        shell.appendChild(toolbar);

        // Main Split Workspace: Left Top-Down Flowchart Viewport + Right Inspector Panel
        var workspace = document.createElement('div');
        workspace.className = 'awd-workspace';

        var viewport = document.createElement('div');
        viewport.className = 'awd-viewport';
        var tree = buildDiagramCanvas();
        viewport.appendChild(tree);
        state.viewportEl = viewport;
        state.treeEl = tree;

        // Wheel Ctrl+Zoom support on viewport
        viewport.addEventListener('wheel', function (e) {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            var delta = e.deltaY < 0 ? 0.08 : -0.08;
            state.zoom = Math.max(0.55, Math.min(1.5, state.zoom + delta));
            applyZoomAndPan();
        }, { passive: false });

        var inspector = document.createElement('div');
        inspector.className = 'awd-inspector';
        var inspectorBody = document.createElement('div');
        inspectorBody.className = 'awd-inspector-body';
        inspector.appendChild(inspectorBody);
        state.inspectorBody = inspectorBody;

        workspace.appendChild(viewport);
        workspace.appendChild(inspector);
        shell.appendChild(workspace);
        host.appendChild(shell);

        refreshLiveCensusBadges();
        installLiveStreamHook();

        // Automatically select the first available live topic so the user sees a real traced path right away
        var initialTopics = state.census && state.census.topics ? state.census.topics : [];
        if (initialTopics.length > 0) {
            state.selectedTopic = initialTopics[0];
            if (state.topicSelect) state.topicSelect.value = state.selectedTopic;
            runActiveTrace(false);
        } else {
            renderInspectorPanel(null, state.model.rules[0] && state.model.rules[0].id);
        }
    }

    function destroySession() {
        if (!state) return;
        removeLiveStreamHook();
        unmountInspectorPreviews();
        if (state.host) {
            state.host.innerHTML = '';
            state.host.classList.remove('awd-host');
        }
        state = null;
    }

    async function openDialog() {
        if (typeof DialogHost === 'undefined' || typeof DialogHost.openFloating !== 'function') {
            throw new Error('Dialog host unavailable');
        }
        await ensureGalleryLoaded();
        var sourceText = await fetchGallerySourceText();
        destroySession();

        DialogHost.openFloating({
            id: 'auto-widget-diagram',
            title: 'Auto-Widget Decision Diagram (Live Rule Flowchart)',
            icon: 'ph-tree-structure',
            className: 'awd-dialog',
            defaultSize: { w: Math.min(1440, Math.round(window.innerWidth * 0.95)), h: Math.min(920, Math.round(window.innerHeight * 0.92)) },
            minSize: { w: 860, h: 540 },
            buildBody: function (body) {
                buildUI(body, sourceText);
            },
            buildFooter: function (footer) {
                footer.classList.add('awd-dialog-footer');
                var note = document.createElement('span');
                note.className = 'awd-footer-note';
                note.textContent = '100% live-extracted from scripts/auto-widget-gallery.js (@rule annotations + RULE_PIPELINE).';

                var openGalleryBtn = document.createElement('button');
                openGalleryBtn.type = 'button';
                openGalleryBtn.className = 'btn-tool ds-dialog-button';
                openGalleryBtn.innerHTML = '<i class="ph-bold ph-squares-four"></i><span>Open Auto-Widget Gallery</span>';
                openGalleryBtn.addEventListener('click', function () {
                    DialogHost.requestClose('auto-widget-diagram').then(function () {
                        if (typeof AutoWidgetGallery !== 'undefined' && typeof AutoWidgetGallery.open === 'function') {
                            AutoWidgetGallery.open();
                        }
                    });
                });

                var closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.className = 'btn-tool ds-dialog-button primary';
                closeBtn.textContent = 'Close';
                closeBtn.addEventListener('click', function () {
                    DialogHost.requestClose('auto-widget-diagram');
                });

                footer.appendChild(note);
                footer.appendChild(openGalleryBtn);
                footer.appendChild(closeBtn);
            },
            onClose: function () {
                destroySession();
            }
        });
    }

    window.AutoWidgetDiagram = {
        open: openDialog,
        destroy: destroySession
    };

    if (typeof ToolsRegistry !== 'undefined') {
        var params = typeof window !== 'undefined' && window.location
            ? new URLSearchParams(window.location.search)
            : null;
        var enabled = !!(params && (params.get('test_mode') === 'full' || params.get('text_mode') === 'full'));
        if (enabled) {
            ToolsRegistry.register({
                id: 'auto-widget-diagram',
                label: 'Auto-Widget Decision Diagram',
                description: 'Interactive top-down rule flowchart and real-time topic tracer for Auto-Widget Gallery.',
                icon: 'ph-tree-structure',
                script: 'scripts/auto-widget-diagram.js',
                run: function () {
                    return openDialog();
                }
            });
        }
    }
})();
