/**
 * Live Lights picker and Combine dialog for the Light Grid inspector.
 * Loaded on first use. Not part of editor boot.
 */
(function () {
    'use strict';

    var DIALOG_ID = 'light-grid-picker';
    var COMBINE_ID = 'light-grid-combine';
    var liveListener = null;

    function topicKey(topic) {
        return String(topic == null ? '' : topic).trim();
    }

    function coercePayload(payload) {
        if (typeof payload !== 'string') return payload;
        var text = payload.trim();
        if (!text || (text.charAt(0) !== '{' && text.charAt(0) !== '[')) return payload;
        try { return JSON.parse(text); } catch (err) { return payload; }
    }

    function isLightJson(topic, meta, payload) {
        var cap = meta && meta.capabilityId ? String(meta.capabilityId) : '';
        if (cap === 'light_state_json') return true;
        if (/(?:^|\/)light_state_json$/i.test(String(topic || ''))) return true;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
        var state = payload.state;
        var stateOk = state === 'ON' || state === 'OFF' || state === 'on' || state === 'off' || state === true || state === false;
        if (!stateOk) return false;
        return payload.brightness != null || payload.color != null || payload.color_temp != null || payload.color_mode != null;
    }

    function censusTopics() {
        var seen = Object.create(null);
        var list = [];
        function add(topic) {
            if (topic == null || topic === '' || seen[topic]) return;
            seen[topic] = true;
            list.push(String(topic));
        }
        if (typeof Dashboard !== 'undefined' && Dashboard.liveData) {
            Object.keys(Dashboard.liveData).forEach(add);
        }
        if (typeof Dashboard !== 'undefined' && Dashboard.topicMeta) {
            Object.keys(Dashboard.topicMeta).forEach(add);
        }
        var driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        if (driver && driver.seenTopics && typeof driver.seenTopics.forEach === 'function') {
            driver.seenTopics.forEach(function (_row, topic) { add(topic); });
        }
        return list;
    }

    function lightName(topic) {
        if (typeof LightGridWidget !== 'undefined' && typeof LightGridWidget.lightNameFromTopic === 'function') {
            return LightGridWidget.lightNameFromTopic(topic);
        }
        return 'New Light';
    }

    function scanLights() {
        var topics = censusTopics();
        var found = [];
        for (var i = 0; i < topics.length; i++) {
            var topic = topics[i];
            var meta = (typeof Dashboard !== 'undefined' && Dashboard.topicMeta) ? Dashboard.topicMeta[topic] : null;
            var raw = (typeof Dashboard !== 'undefined' && Dashboard.liveData) ? Dashboard.liveData[topic] : undefined;
            var payload = coercePayload(raw);
            if (!isLightJson(topic, meta, payload)) continue;
            found.push({
                topic: topic,
                name: lightName(topic),
                payload: payload
            });
        }
        found.sort(function (a, b) {
            return String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' });
        });
        return found;
    }

    function topicInDevices(devices, key) {
        if (!devices || !key) return false;
        for (var i = 0; i < devices.length; i++) {
            var topics = devices[i] && devices[i].topics;
            if (!topics) continue;
            for (var t = 0; t < topics.length; t++) {
                if (topicKey(topics[t]) === key) return true;
            }
        }
        return false;
    }

    function indexOwners(devices) {
        var map = Object.create(null);
        for (var i = 0; i < devices.length; i++) {
            var dev = devices[i];
            var topics = dev && dev.topics;
            if (!topics) continue;
            for (var t = 0; t < topics.length; t++) {
                var key = topicKey(topics[t]);
                if (!key) continue;
                if (!map[key]) map[key] = [];
                map[key].push(dev);
            }
        }
        return map;
    }

    function deviceHasRealTopic(dev) {
        var topics = dev && dev.topics;
        if (!topics) return false;
        for (var i = 0; i < topics.length; i++) {
            if (topicKey(topics[i])) return true;
        }
        return false;
    }

    /**
     * Mutates `devices` in place. Unchecked topics already present are removed.
     * Checked topics already present are left alone. Checked new topics are appended.
     */
    function applySelection(devices, picks) {
        var before = devices.slice();
        var changed = false;
        var owners = indexOwners(devices);
        var touched = [];
        var i;
        for (i = 0; i < picks.length; i++) {
            var pick = picks[i];
            if (!pick || pick.checked) continue;
            var list = owners[pick.topic] || [];
            for (var d = 0; d < list.length; d++) {
                var dev = list[d];
                if (!dev.topics) continue;
                var next = [];
                var removed = false;
                for (var t = 0; t < dev.topics.length; t++) {
                    if (topicKey(dev.topics[t]) === pick.topic) removed = true;
                    else next.push(dev.topics[t]);
                }
                if (removed) {
                    dev.topics = next;
                    changed = true;
                    if (touched.indexOf(dev) < 0) touched.push(dev);
                }
            }
        }
        for (i = devices.length - 1; i >= 0; i--) {
            if (touched.indexOf(devices[i]) !== -1 && !deviceHasRealTopic(devices[i])) {
                devices.splice(i, 1);
            }
        }
        owners = indexOwners(devices);
        for (i = 0; i < picks.length; i++) {
            var add = picks[i];
            if (!add || !add.checked || !add.topic) continue;
            if (owners[add.topic]) continue;
            var created = {
                name: add.name || 'New Light',
                outputMode: 'light',
                topics: [add.topic],
                icons: { on: {} },
                overridePresets: false,
                presets: []
            };
            devices.push(created);
            owners[add.topic] = [created];
            changed = true;
        }
        return { changed: changed, before: before };
    }

    function paintThumb(icon, fill, raw) {
        var look = (typeof LightGridWidget !== 'undefined' && typeof LightGridWidget.liveLightAppearance === 'function')
            ? LightGridWidget.liveLightAppearance(raw)
            : { on: false, cssColor: '', brightness: 0 };
        var strength = look.brightness / 255;
        if (strength < 0) strength = 0;
        if (strength > 1) strength = 1;
        if (!look.on) {
            icon.style.color = 'var(--ui-text-muted)';
            icon.style.opacity = '0.45';
            icon.style.filter = 'none';
            fill.style.width = '0%';
            fill.style.background = 'transparent';
            return;
        }
        var color = look.cssColor || 'var(--ui-accent)';
        icon.style.color = color;
        icon.style.opacity = String(0.35 + (0.65 * strength));
        icon.style.filter = 'drop-shadow(0 0 ' + Math.round(3 + (7 * strength)) + 'px ' + color + ')';
        fill.style.width = Math.round(strength * 100) + '%';
        fill.style.background = color;
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
        var devices = Array.isArray(options.devices) ? options.devices : [];
        stopLive();
        var lights = scanLights();
        var byTopic = Object.create(null);

        DialogHost.openFloating({
            id: DIALOG_ID,
            title: 'Live Lights',
            icon: 'ph-lightbulb',
            className: 'lg-pick-dialog',
            defaultSize: { w: Math.min(720, window.innerWidth * 0.92), h: Math.min(520, window.innerHeight * 0.86) },
            minSize: { w: 420, h: 320 },
            buildBody: function (body) {
                body.classList.add('lg-pick-body');
                var root = document.createElement('div');
                root.className = 'lg-pick-root';

                var hint = document.createElement('p');
                hint.className = 'lg-pick-hint';
                hint.textContent = 'Checked lights that are new are added. Lights already in this grid stay as they are. Unchecked lights that are in this grid are removed.';
                root.appendChild(hint);

                var search = document.createElement('input');
                search.type = 'search';
                search.className = 'control-input w-full text-xs';
                search.placeholder = 'Search lights';
                search.setAttribute('aria-label', 'Search lights');
                root.appendChild(search);

                var scroll = document.createElement('div');
                scroll.className = 'lg-pick-scroll gallery-items';

                var empty = document.createElement('div');
                empty.className = 'gallery-empty';
                empty.textContent = 'No live light topics yet.';
                empty.style.display = lights.length ? 'none' : '';
                scroll.appendChild(empty);

                var noMatch = document.createElement('div');
                noMatch.className = 'gallery-empty';
                noMatch.textContent = 'No matching lights.';
                noMatch.style.display = 'none';
                scroll.appendChild(noMatch);

                var grid = document.createElement('div');
                grid.className = 'lg-pick-grid';
                grid.style.display = lights.length ? '' : 'none';

                lights.forEach(function (entry) {
                    var inGrid = topicInDevices(devices, entry.topic);
                    var card = document.createElement('div');
                    card.className = 'gallery-item lg-pick-card' + (inGrid ? ' is-selected' : '');
                    card.setAttribute('role', 'checkbox');
                    card.setAttribute('aria-checked', inGrid ? 'true' : 'false');
                    card.title = entry.name;

                    var thumb = document.createElement('div');
                    thumb.className = 'lg-pick-thumb';
                    var icon = document.createElement('i');
                    icon.className = 'ph-fill ph-lightbulb lg-pick-icon';
                    icon.setAttribute('aria-hidden', 'true');
                    var bar = document.createElement('div');
                    bar.className = 'lg-pick-bar';
                    var fill = document.createElement('div');
                    fill.className = 'lg-pick-bar-fill';
                    bar.appendChild(fill);
                    thumb.appendChild(icon);
                    thumb.appendChild(bar);

                    var nameEl = document.createElement('div');
                    nameEl.className = 'lg-pick-name';
                    nameEl.textContent = entry.name;

                    var foot = document.createElement('div');
                    foot.className = 'lg-pick-foot';
                    if (inGrid) {
                        var badge = document.createElement('span');
                        badge.className = 'lg-pick-badge';
                        badge.textContent = 'In Grid';
                        foot.appendChild(badge);
                    }
                    var box = document.createElement('input');
                    box.type = 'checkbox';
                    box.className = 'ds-checkbox';
                    box.checked = inGrid;
                    box.title = inGrid ? 'In this grid' : 'Add to this grid';
                    box.setAttribute('aria-label', entry.name);
                    foot.appendChild(box);

                    card.appendChild(thumb);
                    card.appendChild(nameEl);
                    card.appendChild(foot);
                    grid.appendChild(card);

                    var record = {
                        topic: entry.topic,
                        name: entry.name,
                        checked: inGrid,
                        el: card,
                        box: box,
                        icon: icon,
                        fill: fill
                    };
                    byTopic[entry.topic] = record;
                    paintThumb(icon, fill, entry.payload);

                    function setChecked(next) {
                        record.checked = next === true;
                        box.checked = record.checked;
                        card.classList.toggle('is-selected', record.checked);
                        card.setAttribute('aria-checked', record.checked ? 'true' : 'false');
                    }
                    box.addEventListener('click', function (e) { e.stopPropagation(); });
                    box.addEventListener('change', function () { setChecked(box.checked); });
                    card.addEventListener('click', function () { setChecked(!record.checked); });
                });

                scroll.appendChild(grid);
                root.appendChild(scroll);
                body.appendChild(root);

                search.addEventListener('input', function () {
                    var q = search.value.trim().toLowerCase();
                    var visible = 0;
                    var keys = Object.keys(byTopic);
                    for (var i = 0; i < keys.length; i++) {
                        var rec = byTopic[keys[i]];
                        var show = !q || rec.name.toLowerCase().indexOf(q) !== -1;
                        rec.el.style.display = show ? '' : 'none';
                        if (show) visible++;
                    }
                    var filtering = !!q && lights.length > 0;
                    noMatch.style.display = (filtering && visible === 0) ? '' : 'none';
                    grid.style.display = (lights.length && visible > 0) ? '' : 'none';
                });

                liveListener = function (topic, payload) {
                    var rec = byTopic[topic];
                    if (!rec) return;
                    paintThumb(rec.icon, rec.fill, coercePayload(payload));
                };
                if (typeof Dashboard !== 'undefined' && typeof Dashboard.addLiveTopicListener === 'function') {
                    Dashboard.addLiveTopicListener(liveListener);
                }
            },
            buildFooter: function (footer) {
                footer.classList.add('lg-pick-footer');
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
                applyBtn.textContent = 'Apply to Light Grid';
                applyBtn.addEventListener('click', function () {
                    var picks = [];
                    var keys = Object.keys(byTopic);
                    for (var i = 0; i < keys.length; i++) {
                        var rec = byTopic[keys[i]];
                        picks.push({ topic: rec.topic, name: rec.name, checked: rec.checked });
                    }
                    var result = applySelection(devices, picks);
                    if (result.changed && typeof options.onApply === 'function') options.onApply(result.before);
                    DialogHost.requestClose(DIALOG_ID);
                });
                footer.appendChild(cancel);
                footer.appendChild(applyBtn);
            },
            onClose: function () {
                stopLive();
            }
        });
    }

    function openCombine(devices, onChoose) {
        if (typeof DialogHost === 'undefined' || typeof DialogHost.openFloating !== 'function') {
            throw new Error('Dialog host unavailable');
        }
        var list = Array.isArray(devices) ? devices : [];
        var selected = list.length ? list[0] : null;
        DialogHost.openFloating({
            id: COMBINE_ID,
            title: 'Combine Light Devices',
            icon: 'ph-unite',
            className: 'lg-combine-dialog',
            defaultSize: { w: Math.min(440, window.innerWidth * 0.92), h: Math.min(420, window.innerHeight * 0.8) },
            minSize: { w: 320, h: 260 },
            buildBody: function (body) {
                var hint = document.createElement('p');
                hint.className = 'lg-pick-hint';
                hint.textContent = 'Move every topic into the device you choose. The other selected devices are removed. The chosen device keeps its name, icon, and settings.';
                body.appendChild(hint);
                var wrap = document.createElement('div');
                wrap.className = 'lg-combine-list';
                list.forEach(function (dev, idx) {
                    var label = document.createElement('label');
                    label.className = 'lg-pick-choice' + (idx === 0 ? ' is-current' : '');
                    var radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = 'lg-combine-target';
                    radio.className = 'lg-pick-radio';
                    radio.checked = idx === 0;
                    var name = (dev && dev.name) ? String(dev.name) : 'New Light';
                    radio.setAttribute('aria-label', name);
                    radio.addEventListener('change', function () {
                        selected = dev;
                        var choices = wrap.querySelectorAll('.lg-pick-choice');
                        for (var i = 0; i < choices.length; i++) {
                            choices[i].classList.toggle('is-current', choices[i] === label);
                        }
                    });
                    var nameEl = document.createElement('span');
                    nameEl.className = 'lg-pick-choice-name';
                    nameEl.textContent = name;
                    label.appendChild(radio);
                    label.appendChild(nameEl);
                    wrap.appendChild(label);
                });
                body.appendChild(wrap);
            },
            buildFooter: function (footer) {
                var cancel = document.createElement('button');
                cancel.type = 'button';
                cancel.className = 'btn-tool ds-dialog-button';
                cancel.textContent = 'Cancel';
                cancel.addEventListener('click', function () {
                    DialogHost.requestClose(COMBINE_ID);
                });
                var ok = document.createElement('button');
                ok.type = 'button';
                ok.className = 'btn-tool ds-dialog-button primary';
                ok.textContent = 'Combine';
                ok.addEventListener('click', function () {
                    DialogHost.requestClose(COMBINE_ID);
                    if (selected && typeof onChoose === 'function') onChoose(selected);
                });
                footer.appendChild(cancel);
                footer.appendChild(ok);
            }
        });
    }

    window.LightGridPicker = {
        open: open,
        openCombine: openCombine
    };
})();
