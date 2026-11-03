/**
 * Live Graph Values picker dialog for the Graph widget series inspector.
 * Loaded on first use. Not part of editor boot.
 */
(function () {
    'use strict';

    var DIALOG_ID = 'graph-data-picker';
    var liveListener = null;

    function topicKey(topic) {
        return String(topic == null ? '' : topic).trim();
    }

    function friendlyName(topic, meta) {
        if (typeof AutoWidgetGallery !== 'undefined' && typeof AutoWidgetGallery.friendlyName === 'function') {
            return AutoWidgetGallery.friendlyName(topic, meta);
        }
        if (typeof GraphWidget !== 'undefined' && typeof GraphWidget.seriesNameFromTopic === 'function') {
            return GraphWidget.seriesNameFromTopic(topic);
        }
        var parts = String(topic || '').split('/');
        return parts[parts.length - 1] || 'Graph';
    }

    function formatNumberReadout(n) {
        if (n == null || !isFinite(n)) return '--';
        var num = Number(n);
        if (Math.abs(num) >= 10000) return num.toLocaleString();
        if (Number.isInteger(num)) return String(num);
        return num.toFixed(1);
    }

    function isExcludedRule(ruleId) {
        if (!ruleId) return false;
        var excluded = {
            'prepass-lightgrid': true,
            'rule-flow': true,
            'rule-mood': true,
            'rule-push-action': true,
            'rule-variable-boolean': true,
            'rule-boolean-switch': true,
            'rule-boolean-sensor': true,
            'rule-markdown': true,
            'rule-svg': true,
            'rule-image-url': true,
            'rule-video-url': true,
            'rule-phosphor-icon': true,
            'rule-color': true,
            'rule-string-list': true,
            'rule-long-text': true,
            'rule-short-text': true
        };
        return !!excluded[ruleId];
    }

    function extractSeriesPoints(topic, raw, section) {
        if (raw === undefined || raw === null) {
            if (section === 'graph') return { points: [], singleValue: null };
            return null;
        }

        var unwrapped = raw;
        if (typeof raw === 'string') {
            var trimmed = raw.trim();
            if ((trimmed.charAt(0) === '{' || trimmed.charAt(0) === '[') && typeof JSON !== 'undefined') {
                try { unwrapped = JSON.parse(trimmed); } catch (e) { unwrapped = raw; }
            }
        }

        if (section === 'stream') {
            var num = null;
            if (typeof unwrapped === 'number' && isFinite(unwrapped)) {
                num = unwrapped;
            } else if (typeof unwrapped === 'string') {
                var s = unwrapped.trim();
                if (!s.includes(',')) {
                    var p = parseFloat(s);
                    if (isFinite(p)) num = p;
                }
            } else if (unwrapped && typeof unwrapped === 'object' && unwrapped.value !== undefined) {
                var pv = parseFloat(unwrapped.value);
                if (isFinite(pv)) num = pv;
            }
            return { points: num !== null ? [{ v: num, t: Date.now() }] : [], singleValue: num };
        }

        // Section === 'graph'
        if (typeof GraphWidget !== 'undefined') {
            var parsed = GraphWidget.prototype._parseDataInput.call({}, unwrapped);
            if (parsed && parsed.type === 'multi') {
                var points = GraphWidget.pointsFromParsed(parsed);
                var lastVal = null;
                for (var i = points.length - 1; i >= 0; i--) {
                    if (points[i] && points[i].v != null && isFinite(points[i].v)) {
                        lastVal = points[i].v;
                        break;
                    }
                }
                return { points: points, singleValue: lastVal };
            }
            if (parsed && parsed.type === 'single' && parsed.value != null && isFinite(parsed.value)) {
                return { points: [{ v: parsed.value, t: Date.now() }], singleValue: parsed.value };
            }
        }

        return { points: [], singleValue: null };
    }

    function stopLive() {
        if (!liveListener) return;
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.removeLiveTopicListener === 'function') {
            Dashboard.removeLiveTopicListener(liveListener);
        }
        liveListener = null;
    }

    function open(options) {
        options = options || {};
        if (typeof DialogHost === 'undefined' || typeof DialogHost.openFloating !== 'function') {
            throw new Error('Dialog host unavailable');
        }

        var ensureGallery = (typeof AutoWidgetGallery !== 'undefined')
            ? Promise.resolve()
            : ((typeof WidgetScriptLoader !== 'undefined')
                ? WidgetScriptLoader.loadScript('scripts/auto-widget-gallery.js')
                : Promise.resolve());

        ensureGallery.then(function () {
            openDialogWithGallery(options);
        }).catch(function (err) {
            console.warn('[GraphDataPicker] Gallery load warning:', err);
            openDialogWithGallery(options);
        });
    }

    function openDialogWithGallery(options) {
        var widgetId = options.widgetId;
        var existingSeries = Array.isArray(options.series) ? options.series : [];
        var wdg = (typeof Dashboard !== 'undefined' && Dashboard.widgets) ? Dashboard.widgets[widgetId] : null;
        var bindings = (wdg && wdg.bindings) || {};

        stopLive();

        // Ask Homey driver for a rebroadcast of all live topic values
        var driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        var driverType = (typeof DataDriverRegistry !== 'undefined' && typeof DataDriverRegistry.getType === 'function')
            ? DataDriverRegistry.getType()
            : ((typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.dataDriver) ? MASTER_SETTINGS.dataDriver : '');

        if (String(driverType).toLowerCase() === 'homey' && driver && typeof driver.requestStateSync === 'function') {
            try {
                driver.requestStateSync();
            } catch (err) {
                console.warn('[GraphDataPicker] State sync request error:', err);
            }
        }

        // Index existing series by bound topic
        var existingByTopic = Object.create(null);
        if (Array.isArray(existingSeries)) {
            for (var si = 0; si < existingSeries.length; si++) {
                var row = existingSeries[si];
                var boundTopic = (typeof BindingsTree !== 'undefined')
                    ? BindingsTree.getAtPath(bindings, ['series', si, 'data'])
                    : (bindings.series && bindings.series[si] && bindings.series[si].data);
                if (boundTopic) {
                    var bKey = topicKey(boundTopic);
                    existingByTopic[bKey] = {
                        index: si,
                        series: row,
                        name: row.name || ('Graph ' + (si + 1)),
                        color: row.positiveColor || null
                    };
                }
            }
        }

        var topics = (typeof AutoWidgetGallery !== 'undefined' && typeof AutoWidgetGallery.censusTopics === 'function')
            ? AutoWidgetGallery.censusTopics()
            : (function () {
                var seen = Object.create(null);
                var list = [];
                function add(t) {
                    if (t == null || t === '' || seen[t]) return;
                    seen[t] = true;
                    list.push(String(t));
                }
                if (typeof Dashboard !== 'undefined' && Dashboard.liveData) Object.keys(Dashboard.liveData).forEach(add);
                if (typeof Dashboard !== 'undefined' && Dashboard.topicMeta) Object.keys(Dashboard.topicMeta).forEach(add);
                return list;
            })();

        var lightInfo = (typeof AutoWidgetGallery !== 'undefined' && typeof AutoWidgetGallery.buildLightGrids === 'function')
            ? AutoWidgetGallery.buildLightGrids(topics)
            : { grids: [], consumed: {} };

        var graphList = [];
        var streamList = [];
        var markerCounter = 0;
        var byTopic = Object.create(null);
        var colorPickers = [];

        for (var ti = 0; ti < topics.length; ti++) {
            var top = topics[ti];
            if (lightInfo.consumed && lightInfo.consumed[top]) continue;

            var trace = (typeof AutoWidgetGallery !== 'undefined' && typeof AutoWidgetGallery.traceTopic === 'function')
                ? AutoWidgetGallery.traceTopic(top, undefined, undefined, lightInfo.consumed)
                : null;

            if (trace && (trace.isLightPrepass || trace.isConsumed)) continue;
            if (trace && isExcludedRule(trace.matchedRuleId)) continue;

            var targetSection = null;
            if (trace && trace.matchedRuleId === 'rule-graph-series') {
                targetSection = 'graph';
            } else if (trace && (trace.matchedRuleId === 'rule-number' || trace.matchedRuleId === 'rule-battery' || trace.matchedRuleId === 'rule-fraction-number' || trace.numeric !== null)) {
                targetSection = 'stream';
            }

            if (!targetSection) continue;

            var raw = (typeof Dashboard !== 'undefined' && Dashboard.liveData) ? Dashboard.liveData[top] : undefined;
            var extracted = extractSeriesPoints(top, raw, targetSection);

            var inGraph = !!existingByTopic[topicKey(top)];
            var existingInfo = existingByTopic[topicKey(top)];
            var assignedColor;
            if (existingInfo && existingInfo.color) {
                assignedColor = existingInfo.color;
            } else {
                assignedColor = (typeof GraphWidget !== 'undefined')
                    ? GraphWidget.markerTintForIndex(markerCounter++)
                    : '@markerTint1';
            }

            var recName = (existingInfo && existingInfo.name)
                ? existingInfo.name
                : friendlyName(top, trace ? trace.meta : undefined);

            var initialPts = extracted && extracted.points ? extracted.points.slice() : [];
            if (inGraph && existingInfo && existingInfo.series && wdg && typeof wdg._seriesStateFor === 'function') {
                var st = wdg._seriesStateFor(existingInfo.series.id);
                if (st && Array.isArray(st.buffer) && st.buffer.length > 0) {
                    initialPts = st.buffer.slice();
                }
            }

            var entry = {
                topic: top,
                name: recName,
                section: targetSection,
                checked: inGraph,
                inGraph: inGraph,
                color: assignedColor,
                singleValue: extracted ? extracted.singleValue : null,
                points: initialPts,
                lastUpdateMs: Date.now()
            };

            byTopic[top] = entry;
            if (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function') {
                var altTop = HomeyTopicAlias.aliasOf(top);
                if (altTop && altTop !== top) byTopic[altTop] = entry;
            }
            if (targetSection === 'graph') graphList.push(entry);
            else streamList.push(entry);
        }

        function sortByName(a, b) {
            return String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' });
        }
        graphList.sort(sortByName);
        streamList.sort(sortByName);

        DialogHost.openFloating({
            id: DIALOG_ID,
            title: 'Pick Live Values',
            icon: 'ph-chart-line',
            className: 'gp-pick-dialog',
            defaultSize: { w: Math.min(840, window.innerWidth * 0.94), h: Math.min(640, window.innerHeight * 0.88) },
            minSize: { w: 460, h: 360 },
            buildBody: function (body) {
                body.classList.add('gp-pick-body');
                var root = document.createElement('div');
                root.className = 'gp-pick-root';

                var topBar = document.createElement('div');
                topBar.className = 'gp-pick-topbar';

                var hint = document.createElement('p');
                hint.className = 'gp-pick-hint';
                hint.textContent = 'Check topics to plot as graphs. Unchecked topics in this graph are removed. Set the color and friendly name for each graph below.';
                topBar.appendChild(hint);

                var search = document.createElement('input');
                search.type = 'search';
                search.className = 'control-input w-full text-xs';
                search.placeholder = 'Search live values or topics...';
                search.setAttribute('aria-label', 'Search graph values');
                topBar.appendChild(search);
                root.appendChild(topBar);

                var scroll = document.createElement('div');
                scroll.className = 'gp-pick-scroll';

                // Section 1: Graph Data
                var s1Wrap = document.createElement('div');
                s1Wrap.className = 'gp-section';
                var s1Head = document.createElement('div');
                s1Head.className = 'gp-section-header';
                var s1Count = document.createElement('span');
                s1Count.className = 'gp-section-count';
                s1Count.textContent = '(' + graphList.length + ')';
                s1Head.innerHTML = '<i class="ph-bold ph-chart-line-up"></i> <span>Graph Data</span> ';
                s1Head.appendChild(s1Count);

                var s1Desc = document.createElement('p');
                s1Desc.className = 'gp-section-desc';
                s1Desc.textContent = 'Topics delivering full multi-point datasets (Homey Insights, CSV, JSON arrays, key-value series).';
                s1Wrap.appendChild(s1Head);
                s1Wrap.appendChild(s1Desc);

                var s1Empty = document.createElement('div');
                s1Empty.className = 'gp-empty-notice';
                s1Empty.textContent = 'No multi-point graph topics detected yet.';
                s1Empty.style.display = graphList.length ? 'none' : '';
                s1Wrap.appendChild(s1Empty);

                var s1Grid = document.createElement('div');
                s1Grid.className = 'gp-pick-grid';
                s1Wrap.appendChild(s1Grid);
                scroll.appendChild(s1Wrap);

                // Section 2: Streaming Values
                var s2Wrap = document.createElement('div');
                s2Wrap.className = 'gp-section';
                var s2Head = document.createElement('div');
                s2Head.className = 'gp-section-header';
                var s2Count = document.createElement('span');
                s2Count.className = 'gp-section-count';
                s2Count.textContent = '(' + streamList.length + ')';
                s2Head.innerHTML = '<i class="ph-bold ph-broadcast"></i> <span>Streaming Values</span> ';
                s2Head.appendChild(s2Count);

                var s2Desc = document.createElement('p');
                s2Desc.className = 'gp-section-desc';
                s2Desc.textContent = 'Topics delivering live numeric readings. Populated live over time; shows a single line for single values.';
                s2Wrap.appendChild(s2Head);
                s2Wrap.appendChild(s2Desc);

                var s2Empty = document.createElement('div');
                s2Empty.className = 'gp-empty-notice';
                s2Empty.textContent = 'No numeric streaming topics detected yet.';
                s2Empty.style.display = streamList.length ? 'none' : '';
                s2Wrap.appendChild(s2Empty);

                var s2Grid = document.createElement('div');
                s2Grid.className = 'gp-pick-grid';
                s2Wrap.appendChild(s2Grid);
                scroll.appendChild(s2Wrap);

                function createCard(record) {
                    var card = document.createElement('div');
                    card.className = 'gp-pick-card' + (record.checked ? ' is-selected' : '');
                    card.setAttribute('role', 'checkbox');
                    card.setAttribute('aria-checked', record.checked ? 'true' : 'false');

                    // Thumbnail container
                    var thumbWrap = document.createElement('div');
                    thumbWrap.className = 'gp-thumb-wrap';

                    var canvas = document.createElement('canvas');
                    canvas.className = 'gp-thumb-canvas';
                    canvas.width = 180;
                    canvas.height = 90;
                    thumbWrap.appendChild(canvas);

                    // Live Value Badge with Activity Pulse
                    var badge = document.createElement('div');
                    badge.className = 'gp-thumb-badge';
                    var dot = document.createElement('span');
                    dot.className = 'gp-pulse-dot';
                    var valSpan = document.createElement('span');
                    valSpan.className = 'gp-thumb-val';
                    valSpan.textContent = formatNumberReadout(record.singleValue);
                    badge.appendChild(dot);
                    badge.appendChild(valSpan);
                    thumbWrap.appendChild(badge);
                    card.appendChild(thumbWrap);

                    // Card meta: Inline Editable Name + Topic Subtitle
                    var meta = document.createElement('div');
                    meta.className = 'gp-card-meta';

                    var nameInput = document.createElement('input');
                    nameInput.type = 'text';
                    nameInput.className = 'gp-name-input';
                    nameInput.value = record.name;
                    nameInput.title = 'Edit graph name';
                    nameInput.setAttribute('aria-label', 'Edit graph name');
                    nameInput.addEventListener('click', function (e) { e.stopPropagation(); });
                    nameInput.addEventListener('input', function () {
                        record.name = nameInput.value;
                    });
                    meta.appendChild(nameInput);

                    var topicSub = document.createElement('div');
                    topicSub.className = 'gp-topic-subtitle';
                    topicSub.textContent = record.topic;
                    topicSub.title = record.topic;
                    meta.appendChild(topicSub);
                    card.appendChild(meta);

                    // Card bottom row: Checkbox, "In Graph" badge, Color Swatch
                    var foot = document.createElement('div');
                    foot.className = 'gp-card-foot';

                    var leftFoot = document.createElement('div');
                    leftFoot.className = 'gp-foot-left';

                    var box = document.createElement('input');
                    box.type = 'checkbox';
                    box.className = 'ds-checkbox';
                    box.checked = record.checked;
                    box.title = record.inGraph ? 'In this graph' : 'Add to this graph';
                    box.setAttribute('aria-label', record.name);
                    box.addEventListener('click', function (e) { e.stopPropagation(); });
                    box.addEventListener('change', function () { setChecked(box.checked); });
                    leftFoot.appendChild(box);

                    if (record.inGraph) {
                        var inBadge = document.createElement('span');
                        inBadge.className = 'gp-in-graph-badge';
                        inBadge.textContent = 'In Graph';
                        leftFoot.appendChild(inBadge);
                    }
                    foot.appendChild(leftFoot);

                    // Color picker mount
                    var colorMount = document.createElement('div');
                    colorMount.className = 'gp-color-mount';
                    colorMount.title = 'Change graph color';
                    colorMount.addEventListener('click', function (e) { e.stopPropagation(); });
                    foot.appendChild(colorMount);
                    card.appendChild(foot);

                    record.el = card;
                    record.canvas = canvas;
                    record.box = box;
                    record.valSpan = valSpan;
                    record.dot = dot;

                    function renderThumb() {
                        if (typeof GraphWidget !== 'undefined' && typeof GraphWidget.drawThumbnail === 'function') {
                            GraphWidget.drawThumbnail(canvas, {
                                points: record.points,
                                isSingle: record.section === 'stream' && record.points.length <= 1,
                                singleValue: record.singleValue,
                                color: record.color
                            });
                        }
                    }
                    record.renderThumb = renderThumb;

                    // Attach EditorColorPicker
                    if (typeof EditorColorPicker !== 'undefined' && typeof EditorColorPicker.attach === 'function') {
                        var cp = EditorColorPicker.attach({
                            mountCard: colorMount,
                            allowThemeTokens: true,
                            positionMode: 'anchor',
                            triggerTitle: 'Choose graph color',
                            zIndex: 10060,
                            getRaw: function () {
                                return record.color;
                            },
                            setValue: function (val) {
                                if (val) {
                                    record.color = val;
                                    renderThumb();
                                }
                            }
                        });
                        if (cp) colorPickers.push(cp);
                    }

                    function setChecked(next) {
                        record.checked = next === true;
                        box.checked = record.checked;
                        card.classList.toggle('is-selected', record.checked);
                        card.setAttribute('aria-checked', record.checked ? 'true' : 'false');
                    }
                    card.addEventListener('click', function () {
                        setChecked(!record.checked);
                    });

                    renderThumb();
                    return card;
                }

                graphList.forEach(function (rec) {
                    s1Grid.appendChild(createCard(rec));
                });
                streamList.forEach(function (rec) {
                    s2Grid.appendChild(createCard(rec));
                });

                root.appendChild(scroll);
                body.appendChild(root);

                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(function () {
                        var all = graphList.concat(streamList);
                        for (var i = 0; i < all.length; i++) {
                            if (all[i] && typeof all[i].renderThumb === 'function') {
                                all[i].renderThumb();
                            }
                        }
                    });
                }

                // Search filtering
                function applySearchFilter() {
                    var q = search.value.trim().toLowerCase();
                    var allRecs = graphList.concat(streamList);
                    for (var i = 0; i < allRecs.length; i++) {
                        var rec = allRecs[i];
                        if (!rec || !rec.el) continue;
                        var show = !q || rec.name.toLowerCase().indexOf(q) !== -1 || rec.topic.toLowerCase().indexOf(q) !== -1;
                        rec.el.style.display = show ? '' : 'none';
                    }
                }
                search.addEventListener('input', applySearchFilter);

                // Live topic listener with dynamic topic discovery
                var rafScheduled = false;
                var dirtyTopics = Object.create(null);

                function flushLiveRedraws() {
                    rafScheduled = false;
                    var keys = Object.keys(dirtyTopics);
                    for (var i = 0; i < keys.length; i++) {
                        var rec = byTopic[keys[i]];
                        if (!rec && typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function') {
                            var altKey = HomeyTopicAlias.aliasOf(keys[i]);
                            if (altKey) rec = byTopic[altKey];
                        }
                        if (rec && typeof rec.renderThumb === 'function') {
                            rec.renderThumb();
                            if (rec.valSpan) {
                                rec.valSpan.textContent = formatNumberReadout(rec.singleValue);
                            }
                            if (rec.dot) {
                                rec.dot.classList.add('is-pulsing');
                                (function (d) {
                                    setTimeout(function () { d.classList.remove('is-pulsing'); }, 1200);
                                })(rec.dot);
                            }
                        }
                    }
                    dirtyTopics = Object.create(null);
                }

                function scheduleRedraw(topic) {
                    dirtyTopics[topic] = true;
                    if (!rafScheduled) {
                        rafScheduled = true;
                        if (typeof requestAnimationFrame === 'function') {
                            requestAnimationFrame(flushLiveRedraws);
                        } else {
                            setTimeout(flushLiveRedraws, 16);
                        }
                    }
                }

                liveListener = function (topic, payload) {
                    var rec = byTopic[topic];
                    if (!rec && typeof HomeyTopicAlias !== 'undefined') {
                        if (typeof HomeyTopicAlias.aliasOf === 'function') {
                            var alt = HomeyTopicAlias.aliasOf(topic);
                            if (alt) rec = byTopic[alt];
                        }
                        if (!rec && typeof HomeyTopicAlias.canonicalOf === 'function') {
                            var canon = HomeyTopicAlias.canonicalOf(topic);
                            if (canon && canon !== topic) rec = byTopic[canon];
                        }
                    }
                    if (rec) {
                        var updated = extractSeriesPoints(topic, payload, rec.section);
                        if (updated) {
                            rec.singleValue = updated.singleValue;
                            if (rec.section === 'stream') {
                                if (updated.singleValue != null && isFinite(updated.singleValue)) {
                                    rec.points.push({ v: updated.singleValue, t: Date.now() });
                                    if (rec.points.length > 60) rec.points.shift();
                                }
                            } else {
                                rec.points = (updated.points && updated.points.length) ? updated.points.slice() : rec.points;
                            }
                            scheduleRedraw(topic);
                        }
                        return;
                    }

                    // Guard against shadowed aliases appending duplicate cards
                    if (typeof HomeyTopicAlias !== 'undefined') {
                        var shadowCanon = (typeof HomeyTopicAlias.canonicalOf === 'function') ? HomeyTopicAlias.canonicalOf(topic) : null;
                        if (shadowCanon && shadowCanon !== topic && byTopic[shadowCanon]) {
                            byTopic[topic] = byTopic[shadowCanon];
                            return;
                        }
                    }

                    // Newly arrived topic: dynamically classify and append
                    if (typeof AutoWidgetGallery === 'undefined' || typeof AutoWidgetGallery.traceTopic !== 'function') {
                        return;
                    }

                    var oneLight = (typeof AutoWidgetGallery.buildLightGrids === 'function')
                        ? AutoWidgetGallery.buildLightGrids([topic])
                        : null;
                    if (oneLight && oneLight.consumed && oneLight.consumed[topic]) return;

                    var trace = AutoWidgetGallery.traceTopic(topic, payload, undefined, oneLight ? oneLight.consumed : {});
                    if (trace && (trace.isLightPrepass || trace.isConsumed || isExcludedRule(trace.matchedRuleId))) {
                        return;
                    }

                    var targetSection = null;
                    if (trace && trace.matchedRuleId === 'rule-graph-series') {
                        targetSection = 'graph';
                    } else if (trace && (trace.matchedRuleId === 'rule-number' || trace.matchedRuleId === 'rule-battery' || trace.matchedRuleId === 'rule-fraction-number' || trace.numeric !== null)) {
                        targetSection = 'stream';
                    }

                    if (!targetSection) return;

                    var inGraph = !!existingByTopic[topicKey(topic)];
                    var existingInfo = existingByTopic[topicKey(topic)];
                    var assignedColor;
                    if (existingInfo && existingInfo.color) {
                        assignedColor = existingInfo.color;
                    } else {
                        assignedColor = (typeof GraphWidget !== 'undefined')
                            ? GraphWidget.markerTintForIndex(markerCounter++)
                            : '@markerTint1';
                    }

                    var recName = (existingInfo && existingInfo.name)
                        ? existingInfo.name
                        : friendlyName(topic, trace ? trace.meta : undefined);

                    var extracted = extractSeriesPoints(topic, payload, targetSection);

                    var newRec = {
                        topic: topic,
                        name: recName,
                        section: targetSection,
                        checked: inGraph,
                        inGraph: inGraph,
                        color: assignedColor,
                        singleValue: extracted ? extracted.singleValue : null,
                        points: extracted && extracted.points ? extracted.points.slice() : [],
                        lastUpdateMs: Date.now()
                    };

                    byTopic[topic] = newRec;
                    if (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function') {
                        var newAlt = HomeyTopicAlias.aliasOf(topic);
                        if (newAlt && newAlt !== topic) byTopic[newAlt] = newRec;
                    }
                    var cardEl = createCard(newRec);

                    if (targetSection === 'graph') {
                        graphList.push(newRec);
                        s1Empty.style.display = 'none';
                        s1Grid.appendChild(cardEl);
                        s1Count.textContent = '(' + graphList.length + ')';
                    } else {
                        streamList.push(newRec);
                        s2Empty.style.display = 'none';
                        s2Grid.appendChild(cardEl);
                        s2Count.textContent = '(' + streamList.length + ')';
                    }

                    applySearchFilter();
                    scheduleRedraw(topic);
                };

                if (typeof Dashboard !== 'undefined' && typeof Dashboard.addLiveTopicListener === 'function') {
                    Dashboard.addLiveTopicListener(liveListener);
                }
            },
            buildFooter: function (footer) {
                footer.classList.add('gp-pick-footer');

                var cancel = document.createElement('button');
                cancel.type = 'button';
                cancel.className = 'btn-tool ds-dialog-button';
                cancel.textContent = 'Cancel';
                cancel.addEventListener('click', function () {
                    DialogHost.requestClose(DIALOG_ID);
                });

                var applyBtn = document.createElement('button');
                applyBtn.type = 'button';
                applyBtn.className = 'btn-tool ds-dialog-button primary';
                applyBtn.textContent = 'Apply to Graph';
                applyBtn.addEventListener('click', function () {
                    var currentWdg = (typeof Dashboard !== 'undefined' && Dashboard.widgets) ? Dashboard.widgets[widgetId] : null;
                    if (!currentWdg) {
                        DialogHost.requestClose(DIALOG_ID);
                        return;
                    }

                    var currOverrides = currentWdg.overrides || {};
                    var currBindings = currentWdg.bindings || {};
                    var arrBefore = Array.isArray(currOverrides.series) ? currOverrides.series.slice() : [];
                    var nextSeries = [];
                    var boundTopicsByNewSeries = [];

                    var allRecs = graphList.concat(streamList);
                    for (var i = 0; i < allRecs.length; i++) {
                        var rec = allRecs[i];
                        if (!rec.checked) continue;

                        var existingInfo = existingByTopic[topicKey(rec.topic)];
                        if (existingInfo && existingInfo.series) {
                            var s = existingInfo.series;
                            s.name = rec.name;
                            s.positiveColor = rec.color;
                            s.negativeColor = rec.color;
                            s.positiveFillColor = rec.color;
                            s.negativeFillColor = rec.color;
                            nextSeries.push(s);
                            boundTopicsByNewSeries.push({ isExisting: true, topic: rec.topic });
                        } else {
                            if (typeof GraphWidget !== 'undefined') {
                                var created = GraphWidget.createSeries(nextSeries.length, {
                                    name: rec.name,
                                    data: '',
                                    positiveColor: rec.color,
                                    negativeColor: rec.color,
                                    positiveFillColor: rec.color,
                                    negativeFillColor: rec.color
                                });
                                nextSeries.push(created);
                                boundTopicsByNewSeries.push({ isExisting: false, topic: rec.topic });
                            }
                        }
                    }

                    if (nextSeries.length === 0 && typeof GraphWidget !== 'undefined') {
                        nextSeries.push(GraphWidget.createSeries(0));
                    }

                    // Remap bindings
                    var nextBindings = (typeof Editor !== 'undefined' && typeof Editor.remapGraphSeriesBindings === 'function')
                        ? Editor.remapGraphSeriesBindings(currBindings, arrBefore, nextSeries)
                        : JSON.parse(JSON.stringify(currBindings));

                    for (var si = 0; si < nextSeries.length; si++) {
                        var info = boundTopicsByNewSeries[si];
                        if (info && info.topic) {
                            if (typeof BindingsTree !== 'undefined') {
                                BindingsTree.setAtPath(nextBindings, ['series', si, 'data'], info.topic);
                            } else {
                                if (!nextBindings.series) nextBindings.series = [];
                                if (!nextBindings.series[si]) nextBindings.series[si] = {};
                                nextBindings.series[si].data = info.topic;
                            }
                        }
                    }

                    var nextOverrides = JSON.parse(JSON.stringify(currOverrides));
                    nextOverrides.series = nextSeries;

                    Dashboard.updateWidgetBinding(widgetId, nextBindings, true);
                    Dashboard.updateWidget(widgetId, nextOverrides, true);

                    if (typeof options.onApply === 'function') {
                        options.onApply();
                    }
                    DialogHost.requestClose(DIALOG_ID);
                });

                footer.appendChild(cancel);
                footer.appendChild(applyBtn);
            },
            onClose: function () {
                stopLive();
                for (var i = 0; i < colorPickers.length; i++) {
                    try {
                        if (colorPickers[i] && typeof colorPickers[i].destroy === 'function') {
                            colorPickers[i].destroy();
                        }
                    } catch (e) { /* ignore */ }
                }
                colorPickers.length = 0;
            }
        });
    }

    window.GraphDataPicker = {
        open: open
    };
})();