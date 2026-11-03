/**
 * Tools script: Auto-Widget Gallery (lazy-loaded via tools-catalog).
 * Editor-only. Previews are real widgets that are not added to Dashboard.widgets
 * until the user confirms a batch.
 *
 * ============================================================================
 * IMPORTANT DEVELOPER NOTE - LIVE RULE EXTRACTION & DIAGRAM GENERATION
 * ============================================================================
 * The companion tool `scripts/auto-widget-diagram.js` (accessible in Editor Tools
 * when `?test_mode=full` is active) dynamically generates an interactive top-down
 * decision flowchart and real-time topic path tracer directly from this script.
 *
 * DO NOT hardcode rules in `auto-widget-diagram.js`. Instead:
 * 1. Every pre-pass rule in `PREPASS_RULES` and every classification rule in
 *    `RULE_PIPELINE` MUST be preceded by a structured `/* @rule ... * /` comment
 *    block with human-readable `@rule`, `@title`, `@when`, `@why`, `@main`, and
 *    `@options` tags.
 * 2. When adding, removing, reordering, or changing a rule in `RULE_PIPELINE`,
 *    update its `/* @rule ... * /` comment block and descriptor fields (`id`,
 *    `title`, `when`, `why`, `cards`, `match`, `build`) in lockstep.
 * 3. `auto-widget-diagram.js` fetches this file's source text to parse the
 *    `@rule` comment blocks and live `match` function source alongside
 *    `AutoWidgetGallery.getRulePipeline()` and `AutoWidgetGallery.traceTopic()`,
 *    ensuring the visual diagram always reflects the real script automatically.
 * ============================================================================
 */
(function () {
    var AWG_COL = 240;
    var AWG_GAP = 16;
    var AWG_FOOT = 80;
    var AWG_PREVIEW = 200;
    var AWG_ROW = AWG_PREVIEW + AWG_FOOT;

    function spanSize(cols, rows) {
        var cardH = rows * AWG_ROW + (rows - 1) * AWG_GAP;
        return {
            w: cols * AWG_COL + (cols - 1) * AWG_GAP,
            h: cardH - AWG_FOOT,
            col: cols,
            row: rows
        };
    }

    var TILES = {
        '1x1': spanSize(1, 1),
        '2x1': spanSize(2, 1),
        '2x2': spanSize(2, 2),
        '1x2': spanSize(1, 2)
    };

    var INFER_RULES = [
        { word: 'temperature', unit: '°C', icon: 'ph-thermometer' },
        { word: 'temp', unit: '°C', icon: 'ph-thermometer' },
        { word: 'thermostat', unit: '°C', icon: 'ph-thermometer' },
        { word: 'setpoint', unit: '°C', icon: 'ph-thermometer' },
        { word: 'humidity', unit: '%', icon: 'ph-drop' },
        { word: 'humid', unit: '%', icon: 'ph-drop' },
        { word: 'pressure', unit: 'hPa', icon: 'ph-gauge' },
        { word: 'baro', unit: 'hPa', icon: 'ph-gauge' },
        { word: 'co2', unit: 'ppm', icon: 'ph-cloud' },
        { word: 'voc', unit: 'ppb', icon: 'ph-wind' },
        { word: 'pm25', unit: 'µg/m³', icon: 'ph-cloud-fog' },
        { word: 'noise', unit: 'dB', icon: 'ph-waveform' },
        { word: 'sound', unit: 'dB', icon: 'ph-waveform' },
        { word: 'rain', unit: 'mm', icon: 'ph-cloud-rain' },
        { word: 'ultraviolet', unit: 'UV', icon: 'ph-sun' },
        { word: 'uv', unit: 'UV', icon: 'ph-sun' },
        { word: 'meter power', unit: 'kWh', icon: 'ph-plug-charging' },
        { word: 'energy', unit: 'kWh', icon: 'ph-plug-charging' },
        { word: 'kwh', unit: 'kWh', icon: 'ph-plug-charging' },
        { word: 'gas', unit: 'm³', icon: 'ph-flame' },
        { word: 'measure power', unit: 'W', icon: 'ph-lightning' },
        { word: 'power', unit: 'W', icon: 'ph-lightning' },
        { word: 'watt', unit: 'W', icon: 'ph-lightning' },
        { word: 'voltage', unit: 'V', icon: 'ph-activity' },
        { word: 'volt', unit: 'V', icon: 'ph-activity' },
        { word: 'current', unit: 'A', icon: 'ph-waves' },
        { word: 'amp', unit: 'A', icon: 'ph-waves' },
        { word: 'battery', unit: '%', icon: 'ph-battery-charging' },
        { word: 'luminance', unit: 'lx', icon: 'ph-sun-dim' },
        { word: 'lux', unit: 'lx', icon: 'ph-sun-dim' },
        { word: 'dim', unit: '%', icon: 'ph-lightbulb' },
        { word: 'light', unit: '%', icon: 'ph-lightbulb' },
        { word: 'lamp', unit: '%', icon: 'ph-lightbulb' },
        { word: 'volume', unit: '%', icon: 'ph-speaker-high' },
        { word: 'speaker', unit: '%', icon: 'ph-speaker-high' },
        { word: 'cpu', unit: '%', icon: 'ph-cpu' },
        { word: 'memory', unit: '%', icon: 'ph-memory' },
        { word: 'rpm', unit: 'rpm', icon: 'ph-fan' },
        { word: 'fan', unit: '%', icon: 'ph-fan' },
        { word: 'motion', icon: 'ph-person-simple-walk' },
        { word: 'presence', icon: 'ph-person-simple-walk' },
        { word: 'occupancy', icon: 'ph-person-simple-walk' },
        { word: 'pir', icon: 'ph-person-simple-walk' },
        { word: 'contact', icon: 'ph-door' },
        { word: 'door', icon: 'ph-door' },
        { word: 'window', icon: 'ph-door' },
        { word: 'curtain', unit: '%', icon: 'ph-columns' },
        { word: 'blinds', unit: '%', icon: 'ph-columns' },
        { word: 'smoke', icon: 'ph-fire' },
        { word: 'fire', icon: 'ph-fire' },
        { word: 'tamper', icon: 'ph-shield-warning' },
        { word: 'alarm', icon: 'ph-bell-ringing' },
        { word: 'water', icon: 'ph-drop-half-bottom' },
        { word: 'leak', icon: 'ph-drop-half-bottom' },
        { word: 'flood', icon: 'ph-drop-half-bottom' },
        { word: 'lock', icon: 'ph-lock-key' },
        { word: 'wind', unit: 'm/s', icon: 'ph-wind' },
        { word: 'pv', unit: 'W', icon: 'ph-sun' },
        { word: 'flow', icon: 'ph-play-circle' },
        { word: 'mood', icon: 'ph-sparkle' },
        { word: 'variable', icon: 'ph-toggle-left' },
        { word: 'nozzle', unit: '°C', icon: 'ph-needle' },
        { word: 'bed', unit: '°C', icon: 'ph-square' },
        { word: 'chamber', unit: '°C', icon: 'ph-cube' },
        { word: 'layers', icon: 'ph-stack' },
        { word: 'layer', icon: 'ph-stack' },
        { word: 'speed', unit: 'mm/s', icon: 'ph-speedometer' },
        { word: 'remaining', unit: 'min', icon: 'ph-timer' },
        { word: 'eta', unit: 'min', icon: 'ph-timer' },
        { word: 'percentage', unit: '%', icon: 'ph-percent' },
        { word: 'progress', unit: '%', icon: 'ph-percent' },
        { word: 'printer', icon: 'ph-printer' },
        { word: 'print', icon: 'ph-printer' },
        { word: 'capacity', unit: 'GB', icon: 'ph-database' },
        { word: 'storage', unit: 'GB', icon: 'ph-database' },
        { word: 'health', icon: 'ph-heartbeat' },
        { word: 'hdno', icon: 'ph-hard-drive' },
        { word: 'hdd', icon: 'ph-hard-drive' },
        { word: 'ssd', icon: 'ph-hard-drive' },
        { word: 'disk', icon: 'ph-hard-drive' },
        { word: 'drive', icon: 'ph-hard-drive' },
        { word: 'serial', icon: 'ph-barcode' },
        { word: 'model', icon: 'ph-tag' },
        { word: 'server', icon: 'ph-server' },
        { word: 'nas', icon: 'ph-server' },
        { word: 'grid', unit: 'W', icon: 'ph-transmission-tower' },
        { word: 'load', unit: 'W', icon: 'ph-house-line' },
        { word: 'solar', unit: 'W', icon: 'ph-sun' },
        { word: 'buffer', icon: 'ph-battery-charging' },
        { word: 'compressor', icon: 'ph-cylinder' },
        { word: 'heatlevel', icon: 'ph-chart-bar' },
        { word: 'oscillation', icon: 'ph-arrows-left-right' },
        { word: 'oscillate', icon: 'ph-arrows-left-right' },
        { word: 'heater', icon: 'ph-fire' },
        { word: 'crypto', icon: 'ph-currency-btc' },
        { word: 'bitcoin', icon: 'ph-currency-btc' },
        { word: 'btc', icon: 'ph-currency-btc' },
        { word: 'rss', icon: 'ph-rss' },
        { word: 'feed', icon: 'ph-rss' },
        { word: 'weather', icon: 'ph-cloud-sun' },
        { word: 'forecast', icon: 'ph-cloud-sun' },
        { word: 'camera', icon: 'ph-video-camera' },
        { word: 'cameras', icon: 'ph-video-camera' },
        { word: 'identify', icon: 'ph-crosshair' },
        { word: 'locate', icon: 'ph-crosshair' },
        { word: 'remove', icon: 'ph-trash' },
        { word: 'doorbell', icon: 'ph-bell' },
        { word: 'shutter', unit: '%', icon: 'ph-columns' },
        { word: 'spot', icon: 'ph-lightbulb' }
    ];

    var FRACTION_CAPS = {
        dim: true,
        volume_set: true,
        windowcoverings_set: true,
        light_hue: true,
        light_saturation: true,
        light_temperature: true
    };

    var PERCENT_CAPS = {
        measure_humidity: true,
        measure_battery: true,
        cpu_load: true,
        humidity: true
    };

    var prefHideUsed = true;
    var session = null;
    var previewSeq = 0;

    function topicMeta(topic) {
        if (typeof Dashboard === 'undefined' || !Dashboard.topicMeta) return null;
        return Dashboard.topicMeta[topic] || null;
    }

    function readPayload(topic) {
        if (typeof Dashboard !== 'undefined' && Dashboard.liveData &&
            Object.prototype.hasOwnProperty.call(Dashboard.liveData, topic)) {
            return Dashboard.liveData[topic];
        }
        var driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        if (driver && driver.seenTopics && typeof driver.seenTopics.get === 'function') {
            var row = driver.seenTopics.get(topic);
            if (row && row.payload !== undefined) return row.payload;
        }
        return undefined;
    }

    function readStamp(topic) {
        var driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        if (driver && driver.seenTopics && typeof driver.seenTopics.get === 'function') {
            var row = driver.seenTopics.get(topic);
            if (row && row.timestamp) return Number(row.timestamp) || 0;
        }
        return 0;
    }

    function currentPage() {
        var page = (typeof MASTER_SETTINGS !== 'undefined') ? MASTER_SETTINGS.currentPage : 1;
        var n = parseInt(page, 10);
        return isFinite(n) && n > 0 ? n : 1;
    }

    function titleCase(value) {
        return String(value || '').split(/\s+/).filter(Boolean).map(function (word) {
            var lower = word.toLowerCase();
            if (lower === 'hdd') return 'HDD';
            if (lower === 'ssd') return 'SSD';
            if (lower === 'uv') return 'UV';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
    }

    function topicParts(topic) {
        return String(topic || '').split('/').filter(Boolean);
    }

    function lastSegment(topic) {
        var parts = topicParts(topic);
        return parts.length ? parts[parts.length - 1] : '';
    }

    function capabilityId(topic, meta) {
        if (meta && meta.capabilityId) return String(meta.capabilityId).toLowerCase();
        return String(lastSegment(topic) || '').toLowerCase();
    }

    function isSwitchCapability(topic, meta) {
        var cap = capabilityId(topic, meta);
        return cap === 'onoff' || cap.indexOf('onoff.') === 0 || cap.indexOf('alarm_') === 0;
    }

    function isPushActionCapability(topic, meta) {
        if (meta && (meta.isFlow || meta.isMood)) {
            var fmCap = capabilityId(topic, meta);
            if (fmCap === 'start' || fmCap === 'set' || fmCap === 'trigger') return true;
        }
        var cap = capabilityId(topic, meta);
        return cap === 'button' || cap.indexOf('button.') === 0 || cap === 'start' || cap === 'set';
    }

    function isVariableTopic(topic, meta) {
        if (meta && meta.isVariable) return true;
        var t = String(topic || '');
        if (t.indexOf('homey/variables/') === 0 || t.indexOf('homeassistant/variables/') === 0) return true;
        if (t.indexOf('local/') === 0) return true;
        return false;
    }

    function isFlowActionTopic(topic, meta) {
        var cap = capabilityId(topic, meta);
        if (meta && meta.isFlow) {
            return cap === 'start' || cap === 'set' || cap === 'trigger';
        }
        var t = String(topic || '').toLowerCase();
        if (t.indexOf('homey/flows/') === 0 || t.indexOf('homeassistant/flows/') === 0 || t.indexOf('flows/') === 0) {
            return cap === 'start' || cap === 'set' || cap === 'trigger';
        }
        return false;
    }

    function isMoodActionTopic(topic, meta) {
        var cap = capabilityId(topic, meta);
        if (meta && meta.isMood) {
            return cap === 'set' || cap === 'start' || cap === 'trigger';
        }
        var t = String(topic || '').toLowerCase();
        if (t.indexOf('homey/moods/') === 0 || t.indexOf('homeassistant/moods/') === 0 || t.indexOf('moods/') === 0 || t.indexOf('mood-') === 0) {
            return cap === 'set' || cap === 'start' || cap === 'trigger';
        }
        return false;
    }

    function findFlowEnabledTopic(startTopic, meta, candidateTopics) {
        var replaced = String(startTopic || '').replace(/\/(start|set|trigger)$/i, '/enabled');
        if (replaced !== startTopic) {
            if (candidateTopics && candidateTopics.indexOf(replaced) !== -1) return replaced;
            if (typeof Dashboard !== 'undefined') {
                if (Dashboard.topicMeta && Dashboard.topicMeta[replaced]) return replaced;
                if (Dashboard.liveData && Object.prototype.hasOwnProperty.call(Dashboard.liveData, replaced)) return replaced;
            }
            var driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
            if (driver && driver.seenTopics && typeof driver.seenTopics.has === 'function' && driver.seenTopics.has(replaced)) {
                return replaced;
            }
        }
        if (meta && meta.deviceId) {
            var searchList = candidateTopics || [];
            if (!searchList.length && typeof Dashboard !== 'undefined' && Dashboard.topicMeta) {
                searchList = Object.keys(Dashboard.topicMeta);
            }
            for (var i = 0; i < searchList.length; i++) {
                var cand = searchList[i];
                if (cand === startTopic) continue;
                var candMeta = topicMeta(cand);
                if (candMeta && candMeta.isFlow && String(candMeta.deviceId) === String(meta.deviceId)) {
                    var cCap = capabilityId(cand, candMeta);
                    if (cCap === 'enabled') return cand;
                }
            }
        }
        return null;
    }

    // homey/event/<name> and homey/insight/<name> are channels, not device names.
    // The card title is the leaf (rssFeedNu). "Event" or "Insight" only when that leaf is the word itself.
    function homeyTransportLeaf(topic) {
        var text = String(topic || '');
        var rest = '';
        if (text.indexOf('homey/event/') === 0) rest = text.slice(12);
        else if (text.indexOf('homey/insight/') === 0) rest = text.slice(14);
        else if (text.indexOf('homeassistant/event/') === 0) rest = text.slice(20);
        else if (text.indexOf('homeassistant/insight/') === 0) rest = text.slice(22);
        else return '';
        var parts = rest.split('/').filter(Boolean);
        return parts.length ? parts[parts.length - 1] : '';
    }

    function labelFromSegment(seg) {
        var text = String(seg || '').trim();
        if (!text) return '';
        if (/[a-z]/.test(text) && /[A-Z]/.test(text)) return text;
        return titleCase(text.replace(/[_-]+/g, ' '));
    }

    function deviceLabel(topic) {
        var leaf = homeyTransportLeaf(topic);
        if (leaf) return labelFromSegment(leaf);
        var parts = topicParts(topic);
        if (!parts.length) return '';
        var seg = parts[0];
        if (seg === 'local' || seg === 'homey' || seg === 'homeassistant' || seg === 'sim' || seg === 'mqtt' || seg === 'nodered') {
            seg = parts.length >= 2 ? parts[parts.length - 2] : '';
        }
        return titleCase(String(seg).replace(/[_-]+/g, ' '));
    }

    function leafCapabilityLabel(leaf) {
        var s = String(leaf || '').trim();
        if (!s) return '';
        if (s.indexOf('alarm_') === 0) {
            return titleCase(s.slice(6).replace(/[._-]+/g, ' ') + ' alarm');
        }
        if (s.indexOf('measure_') === 0) {
            s = s.slice(8);
        } else if (s.indexOf('meter_') === 0) {
            return titleCase(s.slice(6).replace(/[._-]+/g, ' ') + ' meter');
        } else if (s.indexOf('button.') === 0) {
            s = s.slice(7);
        } else if (s.indexOf('onoff.') === 0) {
            s = s.slice(6);
        }
        return titleCase(s.replace(/[._-]+/g, ' '));
    }

    function friendlyName(topic, meta) {
        var transportLeaf = homeyTransportLeaf(topic);
        if (transportLeaf) return labelFromSegment(transportLeaf) || 'Widget';
        var capTitle = meta && meta.title ? String(meta.title).trim() : '';
        if (meta && (meta.isFlow || meta.isMood)) {
            if (capTitle) return capTitle.replace(/\s*[·-]\s*(Start|Set|Trigger)$/i, '');
            var fParts = topicParts(topic);
            if (fParts.length >= 2) {
                var cleanSeg = fParts[fParts.length - 2].replace(/-[a-f0-9]{4,8}$/i, '');
                return labelFromSegment(cleanSeg);
            }
        }
        var device = deviceLabel(topic);
        if (device && capTitle && capTitle.toLowerCase() !== device.toLowerCase()) {
            return device + ' ' + capTitle;
        }
        if (capTitle) return capTitle;
        var leaf = lastSegment(topic);
        if (device && (leaf === 'onoff' || leaf === 'button')) return device;
        if (device && leaf) {
            var subTitle = leafCapabilityLabel(leaf);
            if (subTitle && subTitle.toLowerCase() !== device.toLowerCase()) {
                return device + ' ' + subTitle;
            }
        }
        if (device && topicParts(topic).length > 1) return device;
        var parts = topicParts(topic);
        var tail = parts.slice(-2).join(' ');
        var named = titleCase(tail.replace(/[_-]+/g, ' '));
        return named || 'Widget';
    }

    function topicWords(topic) {
        return String(topic || '')
            .replace(/([a-z0-9])([A-Z])/g, function (m, p1, p2) { return p1 + ' ' + p2; })
            .toLowerCase()
            .replace(/[_./-]+/g, ' ');
    }

    function hasWord(blob, word) {
        return (' ' + blob + ' ').indexOf(' ' + word + ' ') !== -1;
    }

    function inferUnitIcon(topic, meta) {
        var t = String(topic || '');
        var capBlob = meta && meta.capabilityId ? topicWords(meta.capabilityId) : '';
        var titleBlob = meta && meta.title ? topicWords(meta.title) : '';
        var blob = (capBlob + ' ' + topicWords(topic) + ' ' + titleBlob).trim();
        var unit = (meta && meta.units) ? String(meta.units) : '';
        var icon = '';
        if ((meta && meta.isFlow) || t.indexOf('homey/flows/') === 0 || t.indexOf('homeassistant/flows/') === 0 || t.indexOf('flows/') === 0) icon = 'ph-play-circle';
        else if ((meta && meta.isMood) || t.indexOf('homey/moods/') === 0 || t.indexOf('homeassistant/moods/') === 0 || t.indexOf('moods/') === 0) icon = 'ph-sparkle';
        for (var i = 0; i < INFER_RULES.length; i++) {
            var rule = INFER_RULES[i];
            if (!hasWord(blob, rule.word)) continue;
            if (!unit && rule.unit) unit = rule.unit;
            if (!icon && rule.icon) icon = rule.icon;
            if (unit && icon) break;
        }
        return { unit: unit, icon: icon };
    }

    function sourceCategory(topic, meta) {
        var t = String(topic || '');
        if (t.indexOf('local/') === 0) return 'local';
        if (meta && meta.isVariable) return 'variable';
        if (meta && (meta.isFlow || meta.isMood)) return 'automation';
        if (t.indexOf('homey/flows/') === 0 || t.indexOf('homeassistant/flows/') === 0 || t.indexOf('flows/') === 0) return 'automation';
        if (t.indexOf('homey/moods/') === 0 || t.indexOf('homeassistant/moods/') === 0 || t.indexOf('moods/') === 0 || t.indexOf('mood-') === 0) return 'automation';
        if (/^mood-|-start$|\/start$|\/enabled$/i.test(t)) return 'automation';
        if (t.indexOf('homey/insight/') === 0 || t.indexOf('homeassistant/insight/') === 0 || /insight/i.test(t) || /\/log(?:\/|$)|\/list(?:\/|$)/i.test(t)) return 'insight';
        return 'device';
    }

    function accessFlags(meta, topic) {
        if ((meta && meta.isMood) || isMoodActionTopic(topic, meta)) {
            return { getable: false, setable: true };
        }
        var getable = !!(meta && meta.getable === true);
        var setable = !!(meta && meta.setable === true);
        var known = meta && (meta.getable !== undefined || meta.setable !== undefined);
        if (!known && String(topic).indexOf('local/') === 0) {
            getable = true;
            setable = true;
        }
        if (!known && isSwitchCapability(topic, meta)) {
            getable = true;
            setable = true;
        }
        return { getable: getable, setable: setable };
    }

    function accessCode(flags, meta, topic) {
        var localBare = String(topic).indexOf('local/') === 0 && !(meta && (meta.getable !== undefined || meta.setable !== undefined));
        if (localBare) return 'L';
        if (flags.getable && flags.setable) return 'RW';
        if (flags.setable && !flags.getable) return 'W';
        if (flags.getable) return 'R';
        if (String(topic).indexOf('local/') === 0 || (meta && meta.isVariable)) return 'L';
        return 'R';
    }

    function asNumber(value) {
        if (typeof value === 'number' && isFinite(value)) return value;
        if (typeof value === 'boolean') return null;
        if (typeof value !== 'string') return null;
        var text = value.trim();
        if (!text || !/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return null;
        var n = parseFloat(text);
        return isFinite(n) ? n : null;
    }

    function isBooleanValue(value) {
        if (typeof value === 'boolean') return true;
        if (typeof value !== 'string') return false;
        var text = value.trim().toLowerCase();
        return text === 'true' || text === 'false';
    }

    function parseJsonArray(value) {
        if (Array.isArray(value)) return value;
        if (typeof value !== 'string') return null;
        var text = value.trim();
        if (!text || text.charAt(0) !== '[') return null;
        try {
            var parsed = JSON.parse(text);
            return Array.isArray(parsed) ? parsed : null;
        } catch (err) {
            return null;
        }
    }

    /** "4,12,-8,1.5,56.8,0" — every part must be a finite number. */
    function parseNumericCsv(value) {
        if (typeof value !== 'string') return null;
        var text = value.trim();
        if (!text || text.indexOf(',') === -1) return null;
        if (text.charAt(0) === '[' || text.charAt(0) === '{') return null;
        var parts = text.split(',');
        if (parts.length < 2) return null;
        var out = [];
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i].trim();
            if (!part) return null;
            var n = asNumber(part);
            if (n === null) return null;
            out.push(n);
        }
        return out;
    }

    /**
     * {"0":0,"1":0,"2":-1} — every key is a sample index and every value is a number.
     * Indexes start at 0 or 1 and stay close together, so device ids are not a series.
     */
    function parseIndexedNumberSeries(value) {
        var obj = null;
        if (value && typeof value === 'object' && !Array.isArray(value)) obj = value;
        else if (typeof value === 'string') {
            var text = value.trim();
            if (!text || text.charAt(0) !== '{') return null;
            try {
                var parsed = JSON.parse(text);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) obj = parsed;
            } catch (err) {
                return null;
            }
        }
        if (!obj) return null;
        var keys = Object.keys(obj);
        if (keys.length < 2) return null;
        var points = [];
        for (var i = 0; i < keys.length; i++) {
            if (!/^\d+$/.test(keys[i])) return null;
            var raw = obj[keys[i]];
            var n = (typeof raw === 'number' && isFinite(raw)) ? raw : asNumber(raw);
            if (n === null) return null;
            points.push({ index: parseInt(keys[i], 10), value: n });
        }
        points.sort(function (a, b) { return a.index - b.index; });
        var min = points[0].index;
        var max = points[points.length - 1].index;
        var span = max - min + 1;
        if (min > 1) return null;
        if (span > points.length * 2) return null;
        var series = [];
        for (var p = 0; p < points.length; p++) series.push(points[p].value);
        return series;
    }

    function isListFlag(value) {
        if (typeof value === 'boolean') return true;
        if (typeof value === 'number') return value === 0 || value === 1;
        if (typeof value !== 'string') return false;
        var text = value.trim().toLowerCase();
        return text === 'true' || text === 'false' || text === '0' || text === '1' || text === 'yes' || text === 'no';
    }

    /** One checklist row: text (or content / message), optional checked or state, optional timestamp. */
    function isListRowItem(item) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
        var hasText = item.text !== undefined || item.content !== undefined || item.message !== undefined;
        if (!hasText && isLightStateObject(item)) return false;
        var text = item.text !== undefined ? item.text : (item.content !== undefined ? item.content : item.message);
        if (text === undefined || text === null || typeof text === 'object') return false;
        if (item.checked !== undefined && !isListFlag(item.checked)) return false;
        if (item.state !== undefined && !isListFlag(item.state)) return false;
        if (item.timestamp !== undefined) {
            var stamp = (typeof item.timestamp === 'number' && isFinite(item.timestamp)) ? item.timestamp : asNumber(item.timestamp);
            if (stamp === null) return false;
        }
        return true;
    }

    /**
     * [{"checked":false,"text":"teeed","timestamp":1774877121341}]
     * or {"0":{...row},"1":{...row}}. Graph points and color objects do not match.
     */
    function isListRowSeries(value) {
        var list = null;
        if (Array.isArray(value)) {
            list = value;
        } else {
            var obj = null;
            if (value && typeof value === 'object' && !Array.isArray(value)) obj = value;
            else if (typeof value === 'string') {
                var text = value.trim();
                if (!text || text.charAt(0) !== '{') return false;
                try {
                    var parsed = JSON.parse(text);
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) obj = parsed;
                } catch (err) {
                    return false;
                }
            }
            if (!obj) return false;
            var keys = Object.keys(obj);
            if (!keys.length) return false;
            list = [];
            for (var i = 0; i < keys.length; i++) {
                if (!/^\d+$/.test(keys[i])) return false;
                list.push(obj[keys[i]]);
            }
        }
        if (!list || !list.length) return false;
        for (var j = 0; j < list.length; j++) {
            if (!isListRowItem(list[j])) return false;
        }
        return true;
    }

    function isGraphArray(list) {
        if (!list || !list.length) return false;
        var allNum = true;
        var allPoint = true;
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (asNumber(item) === null) allNum = false;
            var point = item && typeof item === 'object' && (item.v !== undefined || item.value !== undefined || item.y !== undefined);
            if (!point) allPoint = false;
        }
        return allNum || allPoint;
    }

    function looksLikeTimeValue(value) {
        if (value == null || value === '' || typeof value === 'boolean') return false;
        if (typeof value === 'number') return isFinite(value) && value > 1e8;
        var text = String(value).trim();
        if (!text) return false;
        if (/^\d+(\.\d+)?$/.test(text)) return parseFloat(text) > 1e8;
        if (/^\d{4}-\d{2}-\d{2}/.test(text)) return true;
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) return true;
        if (/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}/.test(text)) return true;
        return !isNaN(Date.parse(text));
    }

    function graphSeriesHasTime(sample) {
        var list = parseJsonArray(sample);
        if (!list && sample && typeof sample === 'object' && Array.isArray(sample.data)) list = sample.data;
        if (!list) return false;
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (!item || typeof item !== 'object') continue;
            if (looksLikeTimeValue(item.t) || looksLikeTimeValue(item.time) || looksLikeTimeValue(item.timestamp)) return true;
            if (typeof item.l === 'string' && looksLikeTimeValue(item.l)) return true;
            if (typeof item.x === 'string' && looksLikeTimeValue(item.x)) return true;
        }
        return false;
    }

    function isStringList(list) {
        if (!list || !list.length) return false;
        for (var i = 0; i < list.length; i++) {
            if (typeof list[i] !== 'string') return false;
        }
        return true;
    }

    function isImageUrl(value) {
        if (typeof value !== 'string') return false;
        var text = value.trim();
        if (text.indexOf('/images/') === 0 || text.indexOf('data:image/') === 0) return true;
        if (!/^https?:\/\//i.test(text)) return false;
        return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(text);
    }

    function isSvgMarkup(value) {
        if (typeof value !== 'string') return false;
        var text = value.trim().toLowerCase();
        return text.indexOf('<svg') === 0 && text.lastIndexOf('</svg>') === text.length - 6;
    }

    function isVideoUrl(value) {
        if (typeof value !== 'string') return false;
        var text = value.trim();
        if (text.indexOf('rtsp://') === 0) return true;
        return /\.(m3u8|mjpg|mjpeg)(\?.*)?$/i.test(text);
    }

    function isPhosphorClass(value) {
        return typeof value === 'string' && /^ph-[a-z0-9-]+$/i.test(value.trim());
    }

    function isLongText(value) {
        if (typeof value !== 'string') return false;
        if (isMarkdown(value)) return true;
        if (value.length > 40) return true;
        if (value.indexOf('\n') !== -1) return true;
        if (value.indexOf('# ') !== -1) return true;
        if (value.indexOf('**') !== -1) return true;
        if (value.indexOf('|---|') !== -1) return true;
        if (value.indexOf(':ph-') !== -1) return true;
        if (value.indexOf('[color') !== -1) return true;
        if (value.indexOf('{{') !== -1) return true;
        return false;
    }

    function isFractionCap(cap) {
        return !!FRACTION_CAPS[String(cap || '').toLowerCase()];
    }

    function isPercentCap(cap, unit, topic) {
        var c = String(cap || '').toLowerCase();
        if (PERCENT_CAPS[c]) return true;
        if (unit === '%') return true;
        var words = topicWords(topic);
        return hasWord(words, 'humidity') || hasWord(words, 'cpu') || hasWord(words, 'load');
    }

    function videoRegistered() {
        return typeof WidgetRegistry !== 'undefined' && typeof WidgetRegistry.get === 'function' && !!WidgetRegistry.get('videostream');
    }

    function cloneData(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function initSessionRange(entry, value) {
        var meta = entry.meta;
        var metaMin = meta && meta.min !== null && meta.min !== undefined ? Number(meta.min) : NaN;
        var metaMax = meta && meta.max !== null && meta.max !== undefined ? Number(meta.max) : NaN;
        if (isFinite(metaMin) && isFinite(metaMax) && metaMax > metaMin) {
            entry._sessionMin = metaMin;
            entry._sessionMax = metaMax;
            return;
        }
        var v = asNumber(value);
        if (v === null) {
            entry._sessionMin = 0;
            entry._sessionMax = 100;
            return;
        }
        var cap = capabilityId(entry.topic, meta);
        if (isPercentCap(cap, entry.unit, entry.topic) && v >= 0 && v <= 100) {
            entry._sessionMin = 0;
            entry._sessionMax = 100;
            return;
        }
        entry._sessionMin = v < 0 ? v : 0;
        entry._sessionMax = v > 0 ? v : (v < 0 ? 0 : 100);
    }

    // Homey capabilities often publish 0..1. A slider in that band needs Fractions
    // and a max of 1 until a larger sample arrives.
    function applySliderValueHints(entry, value) {
        if (!entry || entry.type !== 'slider') return false;
        var v = asNumber(value);
        if (v === null) return false;
        var changed = false;
        if (v <= 1 && !entry._sliderFractions) {
            entry._sliderFractions = true;
            changed = true;
        }
        if (isFinite(entry._sessionMax) && v > entry._sessionMax) {
            entry._sessionMax = v;
            if (v > 1) entry._sliderMaxRaised = true;
            changed = true;
        }
        if (!entry._sliderMaxRaised && v >= 0 && v <= 1 && entry._sessionMax !== 1) {
            entry._sessionMax = 1;
            changed = true;
        }
        return changed;
    }

    function writeSliderHints(entry) {
        if (!entry || entry.type !== 'slider') return;
        var bags = [];
        if (entry.overrides) bags.push(entry.overrides);
        if (entry.widget && entry.widget.overrides) bags.push(entry.widget.overrides);
        for (var i = 0; i < bags.length; i++) {
            if (entry._sliderFractions) bags[i].allowDecimals = true;
            if (entry._sessionMax != null && isFinite(entry._sessionMax)) bags[i].max = entry._sessionMax;
        }
    }

    function expandSessionRange(entry, value) {
        var hinted = entry && entry.type === 'slider' ? applySliderValueHints(entry, value) : false;
        if (hinted) writeSliderHints(entry);
        if (!entry || entry.rangeMode !== 'session') return hinted;
        var v = asNumber(value);
        if (v === null) return false;
        var changed = false;
        if (v < entry._sessionMin) {
            entry._sessionMin = v;
            changed = true;
        }
        if (v > entry._sessionMax) {
            entry._sessionMax = v;
            changed = true;
        }
        if (changed && entry.overrides && (entry.type === 'gauge' || entry.type === 'slider')) {
            entry.overrides.min = entry._sessionMin;
            entry.overrides.max = entry._sessionMax;
        }
        if (hinted) writeSliderHints(entry);
        return changed || hinted;
    }

    function applyRangeToOverrides(entry, overrides) {
        if (!entry || (entry.rangeMode !== 'session' && entry.rangeMode !== 'fixed')) return overrides;
        overrides.min = entry._sessionMin;
        overrides.max = entry._sessionMax;
        return overrides;
    }

    function cloneSettings(settings) {
        return JSON.parse(JSON.stringify(settings || {}));
    }

    function mergeIconsOverride(targetIcons, extraIcons) {
        if (!extraIcons || typeof extraIcons !== 'object') return targetIcons;
        var out = targetIcons && typeof targetIcons === 'object' ? cloneSettings(targetIcons) : {};
        if (extraIcons.on && typeof extraIcons.on === 'object') {
            out.on = Object.assign({}, out.on || {}, extraIcons.on);
        }
        if (extraIcons.off && typeof extraIcons.off === 'object') {
            out.off = Object.assign({}, out.off || {}, extraIcons.off);
        }
        return out;
    }

    function looksToPresets(type, looks, dataFor) {
        return looks.map(function (look) {
            return {
                id: look.id,
                label: look.label,
                type: type,
                tile: look.tile,
                build: function () {
                    var data = dataFor();
                    var overrides = cloneSettings(look.settings);
                    delete overrides.width;
                    delete overrides.height;
                    var extra = data.overrides || {};
                    Object.keys(extra).forEach(function (key) {
                        if (key === 'icons') {
                            overrides.icons = mergeIconsOverride(overrides.icons, extra.icons);
                        } else if (extra[key] !== undefined) {
                            overrides[key] = extra[key];
                        }
                    });
                    return { bindings: data.bindings || {}, overrides: overrides };
                }
            };
        });
    }

    var GAUGE_LOOKS = [
        {
            id: 'arc-outer',
            label: 'Arc - Outer Values',
            tile: '1x1',
            settings: {
                width: 140,
                height: 180,
                barType: 'round',
                gapRound: -25,
                gapHoriz: 8,
                gaugeSizeOffset: -10,
                showLabels: true,
                rotateLabels: false,
                labelCount: 5,
                labelOffset: 18,
                showIcon: true,
                icons: { on: { offsetY: 0 } },
                iconSize: 50,
                typography: { value: { fontSize: 48, offsetY: 0 } },
                valueAlignment: 'center'
            }
        },
        {
            id: 'arc-center-icon',
            label: 'Arc - Center Icon',
            tile: '1x1',
            settings: {
                width: 140,
                height: 180,
                barType: 'round',
                gapRound: -25,
                gaugeSizeOffset: 0,
                showLabels: false,
                rotateLabels: false,
                labelOffset: 0,
                showIcon: true,
                iconSize: 50,
                typography: { value: { fontSize: 48, offsetY: 0 } },
                valueAlignment: 'center',
                gapHoriz: 8,
                icons: { on: { offsetY: 0 } }
            }
        },
        {
            id: 'horizontal-icon-left',
            label: 'Horizontal - Icon Left',
            tile: '2x1',
            settings: {
                width: 340,
                height: 120,
                barType: 'horizontal',
                gapRound: -25,
                gaugeSizeOffset: 0,
                showLabels: false,
                rotateLabels: false,
                labelOffset: 0,
                showIcon: true,
                iconSize: 66,
                typography: { value: { fontSize: 48, offsetY: 0 } },
                valueAlignment: 'left',
                gapHoriz: 8,
                icons: { on: { offsetY: 0 } }
            }
        }
    ];

    var SWITCH_LOOKS = [
        {
            id: 'button-inside-right',
            label: 'Button Label Inside',
            tile: '1x1',
            settings: {
                style: 'button',
                showIcon: true,
                textOnlyLabelVerticalAlign: 'center',
                buttonLabelPosition: 'inside_right'
            }
        },
        {
            id: 'button-inside',
            label: 'Button Label Inside (Bottom)',
            tile: '1x1',
            settings: {
                style: 'button',
                showIcon: true,
                textOnlyLabelVerticalAlign: 'center',
                buttonLabelPosition: 'inside_bottom'
            }
        },
        {
            id: 'pill',
            label: 'Pill Switch',
            tile: '1x1',
            settings: {
                style: 'switch',
                showIcon: false,
                textOnlyLabelVerticalAlign: 'center',
                buttonLabelPosition: 'top'
            }
        }
    ];

    var SLIDER_LOOKS = [
        {
            id: 'slider-top',
            label: 'Horizontal Slider - Label Top',
            tile: '2x1',
            settings: {
                typography: { caption: { fontSize: 18 }, unit: { fontSize: 18 } },
                vertical: false,
                labelLocation: 'top',
                valueLocation: 'middle',
                showVal: true
            }
        },
        {
            id: 'slider-vertical',
            label: 'Vertical Slider - Label Bottom',
            tile: '1x2',
            settings: {
                typography: { caption: { fontSize: 18 }, unit: { fontSize: 10 } },
                vertical: true,
                labelLocation: 'bottom',
                valueLocation: 'middle',
                showVal: true
            }
        }
    ];

    var LINE_GRAPH_POINTS = {
        id: 'line-points',
        label: 'X Axis (points), Y Axis Values',
        tile: '2x1',
        settings: {
            autoMin: true,
            min: 0,
            autoMax: true,
            useBaseline: true,
            showAxisX: true,
            showAxisY: true,
            timeFormat: 'Datapoints',
            timezoneConvert: false,
            autoAxisResX: true,
            autoAxisResY: true,
            axisResX: 3,
            showPointValues: false,
            autoPointValuesInterval: true,
            pointValuesInterval: 1,
            gridHTopShow: false,
            gridHBotShow: true,
            gridHBaseShow: true,
            gridHInnerShow: false,
            gridHInnerW: 1,
            gridHInnerOp: 60,
            gridVLeftShow: true,
            gridVRightShow: false,
            gridVShow: false,
            gridVOp: 60,
            type: 'line',
            showLegend: true
        }
    };

    var BAR_GRAPH_POINTS = {
        id: 'bar-points',
        label: 'Bar Graph - Y Axis Values',
        tile: '2x1',
        settings: Object.assign(cloneSettings(LINE_GRAPH_POINTS.settings), {
            type: 'bar',
            barDirection: 'vertical'
        })
    };

    function graphLooks(entry) {
        if (!graphSeriesHasTime(entry && entry.sample)) {
            return [LINE_GRAPH_POINTS, BAR_GRAPH_POINTS];
        }
        var dated = {
            id: 'line-date-hour',
            label: 'X Axis (Date-Hour), Y Axis Values',
            tile: '2x1',
            settings: cloneSettings(LINE_GRAPH_POINTS.settings)
        };
        dated.settings.timeFormat = 'DateHours';
        var datedBar = {
            id: 'bar-date-hour',
            label: 'Bar Graph (Date-Hour)',
            tile: '2x1',
            settings: cloneSettings(BAR_GRAPH_POINTS.settings)
        };
        datedBar.settings.timeFormat = 'DateHours';
        return [dated, datedBar];
    }

    var BATTERY_LOOKS = [
        {
            id: 'battery-solid',
            label: 'Horizontal Battery',
            tile: '1x1',
            settings: { vertical: false, segments: 0 }
        },
        {
            id: 'battery-segments',
            label: 'Horizontal Battery Segmented',
            tile: '1x1',
            settings: { vertical: false, segments: 6 }
        }
    ];

    var LIST_LOOKS = [
        {
            id: 'list-timestamp',
            label: 'List + Timestamp',
            tile: '2x2',
            settings: {
                showIcons: false,
                showTimestamp: true,
                enableCheckboxes: false,
                time24h: true,
                dateFormat: 'none'
            }
        }
    ];

    function inferredIconsBlock(entry, bothSlots) {
        var icon = entry && entry.inferred && entry.inferred.icon ? entry.inferred.icon : '';
        if (!icon) return null;
        if (bothSlots) {
            return {
                on: { source: 'phosphor', builtin: icon },
                off: { source: 'phosphor', builtin: icon }
            };
        }
        return {
            on: { source: 'phosphor', builtin: icon }
        };
    }

    function numericPresets(entry) {
        return looksToPresets('gauge', GAUGE_LOOKS, function () {
            var overrides = { label: entry.name };
            if (entry.unit) overrides.unit = entry.unit;
            var icons = inferredIconsBlock(entry, false);
            if (icons) overrides.icons = icons;
            return { bindings: { value: entry.topic }, overrides: overrides };
        });
    }

    function graphSeriesForEntry(entry) {
        var name = (entry && entry.name) ? String(entry.name) : 'Graph 1';
        if (typeof GraphWidget !== 'undefined' && typeof GraphWidget.createSeries === 'function') {
        return GraphWidget.createSeries(0, { name: name, nameLocked: true, data: '', valueMultiplier: 0 });
    }
    return {
        id: 'g1',
        name: name,
        nameLocked: true,
        visible: true,
        data: '',
        positiveColor: '@markerTint1',
        negativeColor: '@markerTint1',
        positiveFillColor: '@markerTint1',
        negativeFillColor: '@markerTint1',
        valueMultiplier: 0
    };
    }

    function graphPresets(entry) {
        return looksToPresets('graph', graphLooks(entry), function () {
            return {
                bindings: { series: [{ data: entry.topic }] },
                overrides: {
                    label: entry.name,
                    series: [graphSeriesForEntry(entry)]
                }
            };
        });
    }

    function labelValuePresets(entry) {
        return singlePreset('label', 'Label', 'label', '1x1', function () {
            return {
                bindings: { text: entry.topic },
                overrides: { label: entry.name }
            };
        });
    }

    function textBlockPresets(entry, tile) {
        return singlePreset('text', 'Text', 'text', tile || '2x1', function () {
            return {
                bindings: { text: entry.topic },
                overrides: {
                    label: entry.name,
                    textVerticalAlign: 'top',
                    text: '{{' + entry.topic + '}}'
                }
            };
        });
    }

    function editBoxPresets(entry) {
        return singlePreset('editbox', 'Edit Box', 'editbox', '2x1', function () {
            return {
                bindings: {},
                overrides: {
                    label: entry.name,
                    outputTopic: entry.topic
                }
            };
        });
    }

    function sliderPresets(entry) {
        return looksToPresets('slider', SLIDER_LOOKS, function () {
            var overrides = {
                label: entry.name,
                outputTopic: entry.topic
            };
            if (entry.fraction) overrides.unit = '%';
            else if (entry.unit) overrides.unit = entry.unit;
            return { bindings: { value: entry.topic }, overrides: overrides };
        });
    }

    function switchPresets(entry, mode, extraOverrides, extraBindings) {
        return looksToPresets('switch', SWITCH_LOOKS, function () {
            var overrides = Object.assign({
                buttonLabel: entry.name,
                outputTopic: entry.topic
            }, extraOverrides || {});
            if (mode) overrides.mode = mode;
            var icons = inferredIconsBlock(entry, true);
            if (icons && !overrides.icons) overrides.icons = icons;
            var baseBindings = mode === 'push' ? {} : { state: entry.topic };
            var bindings = Object.assign({}, baseBindings, extraBindings || {});
            return { bindings: bindings, overrides: overrides };
        });
    }

    function iconChoicePresets(entry) {
        return singlePreset('icon', 'Icon', 'icon', '1x1', function () {
            var overrides = { label: entry.name };
            var icons = inferredIconsBlock(entry, true);
            if (icons) overrides.icons = icons;
            return {
                bindings: { active: entry.topic },
                overrides: overrides
            };
        });
    }

    function finishEntry(draft) {
        draft.previewKey = 'awgprev_' + (++previewSeq);
        draft.hostKey = 'awghost_' + previewSeq;
        draft.presetIndex = 0;
        draft.updatedAt = draft.updatedAt || 0;
        draft._lastPayload = draft.sample;
        if (draft.rangeMode === 'session') initSessionRange(draft, draft.sample);
        if (draft.rangeMode === 'fixed') {
            draft._sessionMin = draft.fixedMin;
            draft._sessionMax = draft.fixedMax;
        }
        applyPreset(draft);
        return draft;
    }

    function clearFactoryPick(entry) {
        if (!entry) return;
        entry.factoryPresetId = '';
        entry.factoryPresetName = '';
        entry.factoryVariantId = '';
        entry.factoryVariantName = '';
        entry.factoryHasSubs = false;
        entry.factoryKind = '';
        entry.factoryWidth = 0;
        entry.factoryHeight = 0;
    }

    function applyPreset(entry) {
        clearFactoryPick(entry);
        var presets = entry.presets || [];
        if (!presets.length) return;
        if (entry.presetIndex < 0) entry.presetIndex = 0;
        if (entry.presetIndex >= presets.length) entry.presetIndex = 0;
        var preset = presets[entry.presetIndex];
        var built = preset.build();
        var overrides = Object.assign({}, built.overrides || {}, {
            x: 0,
            y: 0,
            page: currentPage(),
            metaName: entry.name
        });
        delete overrides.width;
        delete overrides.height;
        entry.type = preset.type;
        if (entry.type === 'slider') {
            applySliderValueHints(entry, entry._lastPayload != null ? entry._lastPayload : entry.sample);
        }
        if (entry.fraction && (preset.type === 'gauge' || preset.type === 'slider')) {
            overrides.min = 0;
            overrides.max = (preset.type === 'slider' && entry._sliderMaxRaised && isFinite(entry._sessionMax)) ? entry._sessionMax : 1;
            overrides.unit = '%';
            if (preset.type === 'slider') overrides.allowDecimals = true;
        } else if (preset.type === 'gauge' || preset.type === 'slider') {
            applyRangeToOverrides(entry, overrides);
        }
        if (entry.type === 'slider' && entry._sliderFractions) overrides.allowDecimals = true;
        entry.tile = preset.tile;
        entry.overrides = overrides;
        entry.bindings = built.bindings || {};
        rememberOriginalLook(entry);
    }

    function rememberOriginalLook(entry) {
        if (!entry || entry._originalLook) return;
        entry._originalLook = {
            type: entry.type,
            tile: entry.tile,
            choiceIndex: entry.choiceIndex,
            presetIndex: entry.presetIndex,
            presets: entry.presets,
            overrides: cloneData(entry.overrides || {}),
            bindings: cloneData(entry.bindings || {})
        };
    }

    function restoreOriginalLook(entry) {
        var snap = entry && entry._originalLook;
        if (!snap) return;
        entry.type = snap.type;
        entry.tile = snap.tile;
        entry.choiceIndex = snap.choiceIndex;
        entry.presetIndex = snap.presetIndex;
        entry.presets = snap.presets;
        entry.overrides = cloneData(snap.overrides || {});
        entry.bindings = cloneData(snap.bindings || {});
        clearFactoryPick(entry);
    }

    function makeEntry(partial) {
        partial.topics = partial.topics || [partial.topic];
        partial.presets = partial.presets || [];
        return finishEntry(partial);
    }

    function singlePreset(id, label, type, tile, build) {
        return [{ id: id, label: label, type: type, tile: tile, build: build }];
    }

    function asChoice(id, label, presets) {
        return { id: id, label: label, presets: presets };
    }

    function useChoices(entry, choices, defaultId) {
        entry.choices = choices;
        var index = 0;
        for (var i = 0; i < choices.length; i++) {
            if (choices[i].id === defaultId) index = i;
        }
        entry.choiceIndex = index;
        entry.presets = choices[index].presets;
        entry.presetIndex = 0;
        applyPreset(entry);
        return entry;
    }

    function cardWith(common, extra, choices, defaultId) {
        var entry = makeEntry(Object.assign({}, common, extra || {}, { presets: [] }));
        return useChoices(entry, choices, defaultId);
    }

    function coercePayload(value) {
        if (typeof value !== 'string') return value;
        var text = value.trim();
        if (!text) return value;
        if (text.charAt(0) !== '{' && text.charAt(0) !== '[') return value;
        try {
            return JSON.parse(text);
        } catch (err) {
            return value;
        }
    }

    function markdownProbe(value) {
        if (typeof value !== 'string') return '';
        return value
            .replace(/\u00a0/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
            .replace(/[\uFF1A\uFE55]/g, ':')
            .replace(/\uFF5C/g, '|');
    }

    function isMarkdown(value) {
        var text = markdownProbe(value);
        if (!text) return false;
        if (text.indexOf('|---|') !== -1 || text.indexOf(':---') !== -1 || text.indexOf('---:') !== -1) return true;
        if (text.indexOf('![') !== -1) return true;
        if (text.indexOf('###') !== -1 || text.indexOf('# ') !== -1) return true;
        if (text.indexOf('[color') !== -1 || text.indexOf('<br') !== -1) return true;
        if (text.indexOf(':ph-') !== -1 || text.indexOf(':ph(') !== -1) return true;
        if (text.indexOf('<table') !== -1 || text.indexOf('<hr') !== -1) return true;
        var lines = text.split(/\r\n|\n|\r/);
        var pipeRows = 0;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].replace(/^\s+|\s+$/g, '');
            if (!line) continue;
            if (/^([-*_])\1{2,}$/.test(line)) return true;
            if (/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line)) return true;
            if (line.split('|').length >= 3) pipeRows++;
        }
        return pipeRows >= 2;
    }

    function isLightStateTopic(topic, meta) {
        var cap = capabilityId(topic, meta);
        return cap === 'light_state_json' || /(?:^|\/)light_state_json$/i.test(String(topic));
    }

    function isLightStateObject(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        var state = value.state;
        return state === 'ON' || state === 'OFF' || state === 'on' || state === 'off' || state === true || state === false;
    }

    function isColorString(value) {
        if (typeof value !== 'string') return false;
        var text = value.trim();
        if (/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(text)) return true;
        return /^(?:rgb|rgba|hsl|hsla)\(/i.test(text);
    }

    function isColorObject(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        var keys = Object.keys(value);
        if (!keys.length || keys.length > 4) return false;
        var allowed = { r: 1, g: 1, b: 1, a: 1, red: 1, green: 1, blue: 1, alpha: 1, h: 1, s: 1, l: 1, v: 1 };
        var lower = {};
        for (var i = 0; i < keys.length; i++) {
            var key = String(keys[i]).toLowerCase();
            if (!allowed[key]) return false;
            lower[key] = value[keys[i]];
        }
        if (lower.r != null && lower.g != null && lower.b != null) return true;
        if (lower.red != null && lower.green != null && lower.blue != null) return true;
        if (lower.h != null && lower.s != null && (lower.l != null || lower.v != null)) return true;
        return false;
    }

    function colorChannel(value) {
        var n = Number(value);
        if (!isFinite(n)) return 0;
        if (n >= 0 && n <= 1) return Math.round(n * 255);
        return Math.round(Math.max(0, Math.min(255, n)));
    }

    function colorToCss(value) {
        if (typeof value === 'string') return value.trim();
        if (!value || typeof value !== 'object') return '#000000';
        var lower = {};
        Object.keys(value).forEach(function (key) { lower[String(key).toLowerCase()] = value[key]; });
        var r = lower.r != null ? lower.r : lower.red;
        var g = lower.g != null ? lower.g : lower.green;
        var b = lower.b != null ? lower.b : lower.blue;
        if (r == null && lower.h != null) {
            var hue = Number(lower.h);
            var sat = Number(lower.s);
            var light = lower.l != null ? Number(lower.l) : Number(lower.v);
            if (!isFinite(hue)) hue = 0;
            if (!isFinite(sat)) sat = 0;
            if (!isFinite(light)) light = 0;
            if (sat >= 0 && sat <= 1) sat = sat * 100;
            if (light >= 0 && light <= 1) light = light * 100;
            return 'hsl(' + Math.round(hue) + ', ' + Math.round(sat) + '%, ' + Math.round(light) + '%)';
        }
        return 'rgb(' + colorChannel(r) + ', ' + colorChannel(g) + ', ' + colorChannel(b) + ')';
    }

    function containerColorPresets(entry, css) {
        return singlePreset('container', 'Container', 'empty', '1x1', function () {
            return {
                bindings: {
                    container: {
                        background: { startColor: entry.topic, endColor: entry.topic }
                    }
                },
                overrides: {
                    label: entry.name,
                    container: {
                        show: true,
                        background: {
                            startColor: css,
                            endColor: css,
                            startOpacity: 100,
                            endOpacity: 100
                        }
                    }
                }
            };
        });
    }

    function isBooleanPayload(value, meta, topic) {
        if (typeof value === 'boolean') return true;
        if (meta && String(meta.type || '').toLowerCase() === 'boolean') return true;
        if (typeof value === 'string') {
            var text = value.trim().toLowerCase();
            if (text === 'true' || text === 'false' || text === 'on' || text === 'off' || text === 'yes' || text === 'no') return true;
        }
        var cap = capabilityId(topic, meta);
        if (cap === 'onoff' || cap.indexOf('onoff.') === 0 || cap.indexOf('alarm_') === 0) {
            if (value === 0 || value === 1 || value === '0' || value === '1') return true;
        }
        return false;
    }

    function numberChoices(entry, writable) {
        var choices = [
            asChoice('gauge', 'Gauge', numericPresets(entry)),
            asChoice('label', 'Label', labelValuePresets(entry)),
            asChoice('graph', 'Graph', graphPresets(entry))
        ];
        if (writable) choices.splice(1, 0, asChoice('slider', 'Slider', sliderPresets(entry)));
        return choices;
    }

    function buildTopicContext(topic, payload, meta, consumed) {
        var flags = accessFlags(meta, topic);
        var code = accessCode(flags, meta, topic);
        var name = friendlyName(topic, meta);
        var cap = capabilityId(topic, meta);
        var inferred = inferUnitIcon(topic, meta);
        var value = coercePayload(payload);
        var authoritativeUnit = (meta && meta.units ? String(meta.units).trim() : '') || inferred.unit || '';
        var category = sourceCategory(topic, meta);
        var common = {
            topic: topic,
            meta: meta,
            name: name,
            access: code,
            category: category,
            inferred: inferred,
            unit: authoritativeUnit,
            sample: payload,
            updatedAt: readStamp(topic)
        };
        var text = typeof value === 'string' ? value : (typeof payload === 'string' ? payload : '');
        var asList = Array.isArray(value) ? value : parseJsonArray(text);
        if (!asList && value && typeof value === 'object') {
            if (Array.isArray(value.data)) asList = value.data;
            else if (Array.isArray(value.values)) asList = value.values;
        }
        if (!asList) {
            var csvList = parseNumericCsv(text);
            if (csvList) asList = csvList;
        }
        var numeric = asNumber(value);
        if (numeric === null && typeof value === 'number' && isFinite(value)) numeric = value;
        return {
            topic: topic,
            payload: payload,
            meta: meta,
            consumed: consumed || {},
            flags: flags,
            code: code,
            name: name,
            cap: cap,
            inferred: inferred,
            unit: authoritativeUnit,
            category: category,
            value: value,
            text: text,
            asList: asList,
            numeric: numeric,
            common: common
        };
    }

    /*
     * @rule prepass-lightgrid
     * @stage Pre-Pass Aggregation
     * @title Unified Light Grid Grouping
     * @when Topic ends with `/light_state_json` (or capabilityId is `light_state_json`) OR payload is a JSON light state object `{ state: "ON"|"OFF"|true|false, ... }`.
     * @why Combines all smart lights into one shared 2x2 Light Grid widget and marks each light's sibling `/dim` topic as consumed (while keeping `/onoff` available as a standalone Switch/Button).
     * @main Light Grid (2x2)
     * @options None (shared multi-device grid)
     */
    var PREPASS_RULES = [
        {
            id: 'prepass-lightgrid',
            stage: 'prepass',
            title: 'Unified Light Grid Grouping',
            when: 'Topic capability is light_state_json or JSON payload has { state: "ON" | "OFF" | true | false }',
            why: 'Aggregates all smart light state topics into a single 2x2 Light Grid card and consumes sibling /dim topics while keeping /onoff buttons available.',
            cards: [
                {
                    role: 'grid',
                    accessWhen: 'RW',
                    mainWidget: { id: 'lightgrid', label: 'Light Grid', type: 'lightgrid', tile: '2x2', presets: ['Light Grid'] },
                    optionalWidgets: []
                }
            ],
            match: function (ctx) {
                return isLightStateTopic(ctx.topic, ctx.meta) || isLightStateObject(ctx.value);
            }
        }
    ];

    /*
     * ========================================================================
     * ORDERED PER-TOPIC CLASSIFICATION PIPELINE (TOP-DOWN)
     * First matching rule in RULE_PIPELINE wins and produces 1 or 2 cards.
     * ========================================================================
     */
    var RULE_PIPELINE = [
        /*
         * @rule rule-flow
         * @title Homey Flow Action Button
         * @when Topic is a write-only Homey Flow trigger (`isFlow` / `start` / `set` / `trigger`).
         * @why Flows are write-only actions that trigger automations without maintaining a readable return state; they use a momentary Push Button (`mode: "push"`) defaulting to Button Label Inside (Label Right). If the matching `enabled` topic is available, it binds to the Deactivated setting with Inverted mapping and is marked consumed.
         * @main Switch (Push Button, 1x1)
         * @options Icon (1x1)
         */
        {
            id: 'rule-flow',
            title: 'Homey Flow Action Button',
            when: 'Write-only topic for a Homey Flow trigger (start/set/trigger)',
            why: 'Flows need a momentary Push Button (mode: push) with Button Label Inside (Label Right). Sibling enabled topic binds to Deactivated (Inverted).',
            cards: [
                {
                    role: 'write',
                    accessWhen: 'W (setable && !getable)',
                    mainWidget: { id: 'switch', label: 'Switch (Push)', type: 'switch', tile: '1x1', presets: ['Button Label Inside', 'Pill Switch'] },
                    optionalWidgets: [
                        { id: 'icon', label: 'Icon', type: 'icon', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                if (!ctx.flags.setable || ctx.flags.getable) return false;
                return isFlowActionTopic(ctx.topic, ctx.meta);
            },
            build: function (ctx) {
                var enabledTopic = findFlowEnabledTopic(ctx.topic, ctx.meta);
                var extraBindings = null;
                var extraOverrides = null;
                if (enabledTopic) {
                    if (ctx.consumed) ctx.consumed[enabledTopic] = true;
                    extraBindings = { deactivated: enabledTopic };
                    extraOverrides = {
                        deactivated_bind_mapTrue: 'False',
                        deactivated_bind_mapFalse: 'True',
                        deactivated_bind_transformMode: 'stringMap'
                    };
                }
                return [cardWith(ctx.common, { id: 'flow:' + ctx.topic, role: 'write', writeOnly: true, rangeMode: 'none', ruleId: 'rule-flow' }, [
                    asChoice('switch', 'Switch', switchPresets(ctx.common, 'push', extraOverrides, extraBindings)),
                    asChoice('icon', 'Icon', iconChoicePresets(ctx.common))
                ], 'switch')];
            }
        },

        /*
         * @rule rule-mood
         * @title Homey Mood Action Button
         * @when Topic is a write-only Homey Mood trigger (`isMood` / `set`).
         * @why Moods are write-only scenes that do not maintain readable state; they use a momentary Push Button (`mode: "push"`) defaulting to Button Label Inside (Label Right).
         * @main Switch (Push Button, 1x1)
         * @options Icon (1x1)
         */
        {
            id: 'rule-mood',
            title: 'Homey Mood Action Button',
            when: 'Write-only topic for a Homey Mood trigger (set)',
            why: 'Moods need a momentary Push Button (mode: push) with Button Label Inside (Label Right) to trigger the scene.',
            cards: [
                {
                    role: 'write',
                    accessWhen: 'W (setable && !getable)',
                    mainWidget: { id: 'switch', label: 'Switch (Push)', type: 'switch', tile: '1x1', presets: ['Button Label Inside', 'Pill Switch'] },
                    optionalWidgets: [
                        { id: 'icon', label: 'Icon', type: 'icon', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                if (!ctx.flags.setable || ctx.flags.getable) return false;
                return isMoodActionTopic(ctx.topic, ctx.meta);
            },
            build: function (ctx) {
                return [cardWith(ctx.common, { id: 'mood:' + ctx.topic, role: 'write', writeOnly: true, rangeMode: 'none', ruleId: 'rule-mood' }, [
                    asChoice('switch', 'Switch', switchPresets(ctx.common, 'push')),
                    asChoice('icon', 'Icon', iconChoicePresets(ctx.common))
                ], 'switch')];
            }
        },

        /*
         * @rule rule-push-action
         * @title Write-Only Action / Push Trigger
         * @when Topic is write-only (`setable && !getable`) AND is a button capability (`button.*`), or stateless empty/false trigger.
         * @why Stateless actions and triggers do not have a persistent readable state; they require a momentary Push Button (`mode: "push"`).
         * @main Switch (Push Button, 1x1)
         * @options Icon (1x1)
         */
        {
            id: 'rule-push-action',
            title: 'Write-Only Action / Push Trigger',
            when: 'Write-only topic (setable && !getable) for a button capability or empty trigger payload',
            why: 'Stateless actions need a momentary Push Button (mode: push) instead of a stateful on/off toggle.',
            cards: [
                {
                    role: 'write',
                    accessWhen: 'W (setable && !getable)',
                    mainWidget: { id: 'switch', label: 'Switch (Push)', type: 'switch', tile: '1x1', presets: ['Button Label Inside', 'Pill Switch'] },
                    optionalWidgets: [
                        { id: 'icon', label: 'Icon', type: 'icon', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                if (!ctx.flags.setable || ctx.flags.getable) return false;
                if (isPushActionCapability(ctx.topic, ctx.meta)) return true;
                return ctx.text === '' && (ctx.value === undefined || ctx.value === null || ctx.value === '' || ctx.value === false);
            },
            build: function (ctx) {
                return [cardWith(ctx.common, { id: 'trigger:' + ctx.topic, role: 'write', writeOnly: true, rangeMode: 'none', ruleId: 'rule-push-action' }, [
                    asChoice('switch', 'Switch', switchPresets(ctx.common, 'push')),
                    asChoice('icon', 'Icon', iconChoicePresets(ctx.common))
                ], 'switch')];
            }
        },

        /*
         * @rule rule-variable-boolean
         * @title Writable Boolean Variable
         * @when Topic is a writable variable (`isVariable` / `homey/variables/*` / `local/*` with `setable === true`) and payload or metadata is boolean.
         * @why Boolean variables represent controllable flags or binary state indicators. Defaults to an On / Off Icon widget for clean status display, with an optional Toggle Switch button (Button Label Inside Label Right) for direct interaction.
         * @main Icon (1x1)
         * @options Switch (Toggle, 1x1), Label (1x1)
         */
        {
            id: 'rule-variable-boolean',
            title: 'Writable Boolean Variable',
            when: 'Writable variable with boolean payload or type',
            why: 'Boolean variables default to an On / Off Icon widget for status display, with a selectable Toggle Switch button (Button Label Inside Label Right).',
            cards: [
                {
                    role: 'read-write',
                    accessWhen: 'RW / W (setable)',
                    mainWidget: { id: 'icon', label: 'Icon', type: 'icon', tile: '1x1', presets: ['Icon'] },
                    optionalWidgets: [
                        { id: 'switch', label: 'Switch', type: 'switch', tile: '1x1', presets: ['Button Label Inside', 'Pill Switch'] },
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                return isVariableTopic(ctx.topic, ctx.meta) && ctx.flags.setable && isBooleanPayload(ctx.value, ctx.meta, ctx.topic);
            },
            build: function (ctx) {
                return [cardWith(ctx.common, { id: 'varbool:' + ctx.topic, rangeMode: 'none', ruleId: 'rule-variable-boolean' }, [
                    asChoice('icon', 'Icon', iconChoicePresets(ctx.common)),
                    asChoice('switch', 'Switch', switchPresets(ctx.common, 'toggle')),
                    asChoice('label', 'Label', labelValuePresets(ctx.common))
                ], 'icon')];
            }
        },

        /*
         * @rule rule-boolean-switch
         * @title Controllable On/Off Switch & Binary Device
         * @when Topic is writable (`setable === true`) AND capability is `onoff`, `onoff.*`, or `alarm_*`, OR payload/metadata is boolean (`true`/`false`, `"on"`/`"off"`, `"yes"`/`"no"`, or `0`/`1` on `onoff`/`alarm_*`).
         * @why Writable boolean device topics represent controllable switches, relays, smart plugs, or smart appliances that users toggle on and off.
         * @main Switch (1x1)
         * @options Icon (1x1), Label (1x1)
         */
        {
            id: 'rule-boolean-switch',
            title: 'Controllable On/Off Switch & Binary Device',
            when: 'Writable (setable) topic with onoff/onoff.*/alarm_* capability or boolean payload (true/false/on/off/yes/no)',
            why: 'Writable boolean topics represent interactive switches, plugs, or relays that can be toggled on the canvas.',
            cards: [
                {
                    role: 'read-write',
                    accessWhen: 'RW / W (setable)',
                    mainWidget: { id: 'switch', label: 'Switch', type: 'switch', tile: '1x1', presets: ['Button Label Inside', 'Pill Switch'] },
                    optionalWidgets: [
                        { id: 'icon', label: 'Icon', type: 'icon', tile: '1x1' },
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                return ctx.flags.setable && (isSwitchCapability(ctx.topic, ctx.meta) || isBooleanPayload(ctx.value, ctx.meta, ctx.topic));
            },
            build: function (ctx) {
                return [cardWith(ctx.common, { id: 'bool:' + ctx.topic, rangeMode: 'none', ruleId: 'rule-boolean-switch' }, [
                    asChoice('switch', 'Switch', switchPresets(ctx.common)),
                    asChoice('icon', 'Icon', iconChoicePresets(ctx.common)),
                    asChoice('label', 'Label', labelValuePresets(ctx.common))
                ], 'switch')];
            }
        },

        /*
         * @rule rule-boolean-sensor
         * @title Read-Only Binary Sensor / Contact / Motion / Alarm
         * @when Topic is read-only (`!setable`) AND capability is `onoff`, `onoff.*`, or `alarm_*`, OR payload/metadata is boolean.
         * @why Read-only binary signals (door/window contact, motion, smoke, leak, flow enabled state) are status indicators and default to an Icon widget.
         * @main Icon (1x1)
         * @options Label (1x1), Switch (1x1)
         */
        {
            id: 'rule-boolean-sensor',
            title: 'Read-Only Binary Sensor / Contact / Motion / Alarm',
            when: 'Read-only (!setable) topic with onoff/onoff.*/alarm_* capability or boolean payload',
            why: 'Binary sensors (motion, door contact, smoke, water leak) display status via an active/inactive Icon without sending write commands.',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'R (!setable)',
                    mainWidget: { id: 'icon', label: 'Icon', type: 'icon', tile: '1x1', presets: ['Icon'] },
                    optionalWidgets: [
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' },
                        { id: 'switch', label: 'Switch', type: 'switch', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                return !ctx.flags.setable && (isSwitchCapability(ctx.topic, ctx.meta) || isBooleanPayload(ctx.value, ctx.meta, ctx.topic));
            },
            build: function (ctx) {
                return [cardWith(ctx.common, { id: 'sensor:' + ctx.topic, role: 'read', rangeMode: 'none', ruleId: 'rule-boolean-sensor' }, [
                    asChoice('icon', 'Icon', iconChoicePresets(ctx.common)),
                    asChoice('label', 'Label', labelValuePresets(ctx.common)),
                    asChoice('switch', 'Switch', switchPresets(ctx.common))
                ], 'icon')];
            }
        },

        /*
         * @rule rule-markdown
         * @title Formatted Markdown / Table / Calendar Block
         * @when String payload contains Markdown tables (`|---|`, `:---`, `:---:`), a `---` rule, two or more pipe rows, headings (`# `, `###`), images (`![`), Phosphor tokens (`:ph-`, including `:ph-icon|50:`), or inline color/HTML tags (`[color`, `<br`).
         * @why Rich Markdown content (such as iCal calendar views, weather tables, or formatted status lines) requires the Markdown engine in the Text widget (2x1, or 2x2 when > 160 chars).
         * @main Text (2x1 or 2x2)
         * @options Label (1x1)
         */
        {
            id: 'rule-markdown',
            title: 'Formatted Markdown / Table / Calendar Block',
            when: 'String payload contains Markdown syntax (tables |---|, :---: alignment, --- rules, two or more pipe rows, headings # / ###, images ![, :ph- icons including sized :ph-icon|50:, [color, or <br)',
            why: 'Structured Markdown tables and rich text need the full Markdown renderer in the Text widget (2x2 when > 160 chars, otherwise 2x1).',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'Any',
                    mainWidget: { id: 'text', label: 'Text', type: 'text', tile: '2x1 / 2x2', presets: ['Text'] },
                    optionalWidgets: [
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                return isMarkdown(ctx.text);
            },
            build: function (ctx) {
                var mdTile = ctx.text.length > 160 ? '2x2' : '2x1';
                return [cardWith(ctx.common, { id: 'text:' + ctx.topic, rangeMode: 'none', ruleId: 'rule-markdown' }, [
                    asChoice('text', 'Text', textBlockPresets(ctx.common, mdTile)),
                    asChoice('label', 'Label', labelValuePresets(ctx.common))
                ], 'text')];
            }
        },

        /*
         * @rule rule-svg
         * @title Inline SVG Vector Markup
         * @when String payload starts with `<svg` and ends with `</svg>`.
         * @why Raw SVG markup renders as scalable vector art inside an Image widget.
         * @main Image (1x1)
         * @options Text (2x1)
         */
        {
            id: 'rule-svg',
            title: 'Inline SVG Vector Markup',
            when: 'String payload starts with <svg and ends with </svg>',
            why: 'Inline SVG XML is rendered directly by the Image widget.',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'Any',
                    mainWidget: { id: 'image', label: 'Image', type: 'image', tile: '1x1', presets: ['SVG'] },
                    optionalWidgets: [
                        { id: 'text', label: 'Text', type: 'text', tile: '2x1' }
                    ]
                }
            ],
            match: function (ctx) {
                return isSvgMarkup(ctx.text);
            },
            build: function (ctx) {
                var topic = ctx.topic;
                var name = ctx.name;
                return [cardWith(ctx.common, { id: 'img:' + topic, rangeMode: 'none', ruleId: 'rule-svg' }, [
                    asChoice('image', 'Image', singlePreset('svg', 'SVG', 'image', '1x1', function () {
                        return {
                            bindings: { url: topic },
                            overrides: { label: name }
                        };
                    })),
                    asChoice('text', 'Text', textBlockPresets(ctx.common, '2x1'))
                ], 'image')];
            }
        },

        /*
         * @rule rule-image-url
         * @title Image URL or Data URI
         * @when String payload starts with `/images/`, `data:image/`, or is an `http(s)://` URL ending in `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, or `.svg`.
         * @why Image URLs and data URIs bind to the `url` property of an Image widget (1x1).
         * @main Image (1x1)
         * @options Label (1x1)
         */
        {
            id: 'rule-image-url',
            title: 'Image URL or Data URI',
            when: 'String payload is /images/..., data:image/..., or an http(s) URL ending in .png/.jpg/.jpeg/.gif/.webp/.svg',
            why: 'Binds the live image path or URL directly to an Image widget.',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'Any',
                    mainWidget: { id: 'image', label: 'Image', type: 'image', tile: '1x1', presets: ['Image'] },
                    optionalWidgets: [
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                return isImageUrl(ctx.text);
            },
            build: function (ctx) {
                var topic = ctx.topic;
                var name = ctx.name;
                return [cardWith(ctx.common, { id: 'img:' + topic, rangeMode: 'none', ruleId: 'rule-image-url' }, [
                    asChoice('image', 'Image', singlePreset('image', 'Image', 'image', '1x1', function () {
                        return {
                            bindings: { url: topic },
                            overrides: { label: name }
                        };
                    })),
                    asChoice('label', 'Label', labelValuePresets(ctx.common))
                ], 'image')];
            }
        },

        /*
         * @rule rule-video-url
         * @title Live Video Stream URL
         * @when `videostream` widget is registered (`?test_mode=full`) AND string payload starts with `rtsp://` or ends in `.m3u8`, `.mjpg`, or `.mjpeg`.
         * @why Camera and HLS/MJPEG/RTSP streams play inside the experimental Video Stream widget (2x1).
         * @main Video (2x1)
         * @options Label (1x1)
         */
        {
            id: 'rule-video-url',
            title: 'Live Video Stream URL',
            when: 'VideoStream widget is registered and payload is rtsp:// or .m3u8 / .mjpg / .mjpeg stream URL',
            why: 'Routes live video stream URLs to the 2x1 Video Stream widget.',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'Any (when videostream is registered)',
                    mainWidget: { id: 'videostream', label: 'Video', type: 'videostream', tile: '2x1', presets: ['Video Stream'] },
                    optionalWidgets: [
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                return isVideoUrl(ctx.text) && videoRegistered();
            },
            build: function (ctx) {
                var topic = ctx.topic;
                var name = ctx.name;
                return [cardWith(ctx.common, { id: 'video:' + topic, rangeMode: 'none', ruleId: 'rule-video-url' }, [
                    asChoice('videostream', 'Video', singlePreset('video', 'Video Stream', 'videostream', '2x1', function () {
                        return {
                            bindings: { url: topic },
                            overrides: { label: name }
                        };
                    })),
                    asChoice('label', 'Label', labelValuePresets(ctx.common))
                ], 'videostream')];
            }
        },

        /*
         * @rule rule-phosphor-icon
         * @title Dynamic Phosphor Icon Slug
         * @when String payload matches a Phosphor icon class name (`^ph-[a-z0-9-]+$`).
         * @why Binds the topic to `icons.on.builtin` on an Icon widget so the displayed glyph updates dynamically from the payload.
         * @main Icon (1x1)
         * @options Label (1x1)
         */
        {
            id: 'rule-phosphor-icon',
            title: 'Dynamic Phosphor Icon Slug',
            when: 'String payload matches ^ph-[a-z0-9-]+$ (e.g. "ph-sun" or "ph-warning")',
            why: 'Drives an Icon widget glyph dynamically from the incoming Phosphor class name.',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'Any',
                    mainWidget: { id: 'icon', label: 'Icon', type: 'icon', tile: '1x1', presets: ['Phosphor Icon'] },
                    optionalWidgets: [
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                return isPhosphorClass(ctx.text);
            },
            build: function (ctx) {
                var topic = ctx.topic;
                var name = ctx.name;
                var glyph = ctx.text.trim();
                return [cardWith(ctx.common, { id: 'icon:' + topic, rangeMode: 'none', ruleId: 'rule-phosphor-icon' }, [
                    asChoice('icon', 'Icon', singlePreset('phosphor', 'Phosphor Icon', 'icon', '1x1', function () {
                        return {
                            bindings: { icons: { on: { builtin: topic } } },
                            overrides: {
                                label: name,
                                icons: {
                                    on: { source: 'phosphor', builtin: glyph },
                                    off: { source: 'phosphor', builtin: glyph }
                                }
                            }
                        };
                    })),
                    asChoice('label', 'Label', labelValuePresets(ctx.common))
                ], 'icon')];
            }
        },

        /*
         * @rule rule-color
         * @title CSS Color String or RGB / HSL Color Object
         * @when Payload is a hex color (`#rgb`, `#rrggbb`, `#rrggbbaa`), `rgb()`/`hsl()` string, or an object with `{r,g,b}` / `{h,s,l|v}` keys.
         * @why Binds the container background start/end color of a 1x1 Container swatch to the live color topic, with Label as an option.
         * @main Container (1x1)
         * @options Label (1x1)
         */
        {
            id: 'rule-color',
            title: 'CSS Color String or RGB / HSL Color Object',
            when: 'Payload is a #hex / rgb() / hsl() string or an {r,g,b} / {h,s,l} color object',
            why: 'Renders a live color swatch by binding a 1x1 Container background to the color topic.',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'Any',
                    mainWidget: { id: 'container', label: 'Container', type: 'empty', tile: '1x1', presets: ['Container'] },
                    optionalWidgets: [
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                return isColorString(ctx.text) || isColorObject(ctx.value);
            },
            build: function (ctx) {
                var css = colorToCss(isColorString(ctx.text) ? ctx.text : ctx.value);
                var colorEntry = Object.assign({}, ctx.common, { name: ctx.name });
                return [cardWith(ctx.common, { id: 'color:' + ctx.topic, rangeMode: 'none', ruleId: 'rule-color' }, [
                    asChoice('container', 'Container', containerColorPresets(colorEntry, css)),
                    asChoice('label', 'Label', labelValuePresets(colorEntry))
                ], 'container')];
            }
        },

        /*
         * @rule rule-graph-series
         * @title Numeric Series Array or Homey Insight Stream
         * @when Payload is a JSON array of numbers or `{v|value|y, t|time|timestamp}` point objects, OR a comma-separated list of numbers only (for example `4,12,-8,1.5,56.8,0`), OR an object whose keys are sample indexes and whose values are numbers (for example `{"0":0,"1":0,"2":-1}`), OR topic path contains `insight` with a non-Markdown, non-scalar string payload.
         * @why Plots historical series, numeric CSV samples, indexed sample objects, or Homey Insights in a 2x1 Graph widget, automatically picking Date-Hour X-axis when timestamps exist or Datapoints X-axis otherwise.
         * @main Graph (2x1)
         * @options Label (1x1)
         */
        {
            id: 'rule-graph-series',
            title: 'Numeric Series Array or Homey Insight Stream',
            when: 'Payload is an array of numbers, a comma-separated list of numbers (4,12,-8,1.5), an indexed sample object ({"0":0,"1":1}), or {v, t} points, or topic contains "insight" with series data',
            why: 'Plots numeric arrays, numeric CSV samples, indexed sample objects, and Homey Insights on a 2x1 Graph (with Date-Hour axis when timestamps are detected, plus Bar Graph preset).',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'Any',
                    mainWidget: { id: 'graph', label: 'Graph', type: 'graph', tile: '2x1', presets: ['X Axis (points), Y Axis Values', 'X Axis (Date-Hour), Y Axis Values', 'Bar Graph - Y Axis Values'] },
                    optionalWidgets: [
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                var topStr = String(ctx.topic || '').toLowerCase();
                if (topStr.indexOf('homey/insight/') === 0 || topStr.indexOf('homey/insight') === 0 || /\/insight\b/i.test(topStr)) {
                    return true;
                }
                if (isGraphArray(ctx.asList)) return true;
                if (ctx.value && typeof ctx.value === 'object') {
                    if (Array.isArray(ctx.value.data) && isGraphArray(ctx.value.data)) return true;
                    if (Array.isArray(ctx.value.values) && isGraphArray(ctx.value.values)) return true;
                }
                if (parseNumericCsv(ctx.text)) return true;
                if (parseIndexedNumberSeries(ctx.value) || parseIndexedNumberSeries(ctx.text) || parseIndexedNumberSeries(ctx.payload)) return true;
                return false;
            },
            build: function (ctx) {
                return [cardWith(ctx.common, { id: 'graph:' + ctx.topic, rangeMode: 'none', ruleId: 'rule-graph-series' }, [
                    asChoice('graph', 'Graph', graphPresets(ctx.common)),
                    asChoice('label', 'Label', labelValuePresets(ctx.common))
                ], 'graph')];
            }
        },

        /*
         * @rule rule-string-list
         * @title String Array, Checklist Rows, or Log / List Topic
         * @when Payload is an array of strings, OR a list of row objects with `text` (or `content` / `message`) and optional `checked` and `timestamp` (for example `[{"checked":false,"text":"Front door","timestamp":1774877121341}]`), OR the same rows under numeric keys, OR topic path contains `/log` or `/list` with a plain non-Markdown string payload.
         * @why Displays rolling log lines, string arrays, and checklist rows inside a 2x2 List / Log widget with timestamps.
         * @main List (2x2)
         * @options Text (2x1), Label (1x1)
         */
        {
            id: 'rule-string-list',
            title: 'String Array, Checklist Rows, or Log / List Topic',
            when: 'Payload is a string array ["a", "b"], a checklist [{"checked":false,"text":"Front door","timestamp":1774877121341}], or topic path contains /log or /list with plain text',
            why: 'Formats string arrays, checklist rows, and log streams into a scrollable 2x2 List widget with timestamps.',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'Any',
                    mainWidget: { id: 'list', label: 'List', type: 'list', tile: '2x2', presets: ['List + Timestamp'] },
                    optionalWidgets: [
                        { id: 'text', label: 'Text', type: 'text', tile: '2x1' },
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                var logTopic = /\/log(?:\/|$)/i.test(String(ctx.topic)) || /\/list(?:\/|$)/i.test(String(ctx.topic));
                if (isStringList(ctx.asList)) return true;
                if (isListRowSeries(ctx.asList) || isListRowSeries(ctx.value) || isListRowSeries(ctx.text)) return true;
                return logTopic && typeof ctx.text === 'string' && ctx.text && !isMarkdown(ctx.text);
            },
            build: function (ctx) {
                var topic = ctx.topic;
                var name = ctx.name;
                return [cardWith(ctx.common, { id: 'list:' + topic, rangeMode: 'none', ruleId: 'rule-string-list' }, [
                    asChoice('list', 'List', looksToPresets('list', LIST_LOOKS, function () {
                        return {
                            bindings: { data: topic },
                            overrides: { label: name }
                        };
                    })),
                    asChoice('text', 'Text', textBlockPresets(ctx.common, '2x1')),
                    asChoice('label', 'Label', labelValuePresets(ctx.common))
                ], 'list')];
            }
        },

        /*
         * @rule rule-battery
         * @title Battery Level Sensor (0-100%)
         * @when Payload is a number in `0..100` AND capability is `measure_battery` or topic contains the word `battery`.
         * @why Maps battery charge readings to the dedicated 1x1 Battery widget (solid or segmented) with fixed 0..100 bounds, plus Gauge and Label options.
         * @main Battery (1x1)
         * @options Gauge (1x1 / 2x1), Label (1x1)
         */
        {
            id: 'rule-battery',
            title: 'Battery Level Sensor (0-100%)',
            when: 'Numeric value (0..100) on measure_battery capability or topic containing "battery"',
            why: 'Uses the dedicated 1x1 Battery widget with fixed 0..100% bounds and offers Gauge or Label in the dropdown.',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'Any',
                    mainWidget: { id: 'battery', label: 'Battery', type: 'battery', tile: '1x1', presets: ['Horizontal Battery', 'Horizontal Battery Segmented'] },
                    optionalWidgets: [
                        { id: 'gauge', label: 'Gauge', type: 'gauge', tile: '1x1 / 2x1' },
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                var batteryTopic = ctx.cap === 'measure_battery' || hasWord(topicWords(ctx.topic), 'battery');
                return batteryTopic && ctx.numeric !== null && ctx.numeric >= 0 && ctx.numeric <= 100;
            },
            build: function (ctx) {
                var topic = ctx.topic;
                var name = ctx.name;
                var battCommon = Object.assign({}, ctx.common, { unit: ctx.common.unit || '%' });
                return [cardWith(battCommon, {
                    id: 'battery:' + topic,
                    rangeMode: 'fixed',
                    fixedMin: 0,
                    fixedMax: 100,
                    ruleId: 'rule-battery'
                }, [
                    asChoice('battery', 'Battery', looksToPresets('battery', BATTERY_LOOKS, function () {
                        return {
                            bindings: { value: topic },
                            overrides: { label: name }
                        };
                    })),
                    asChoice('gauge', 'Gauge', numericPresets(battCommon)),
                    asChoice('label', 'Label', labelValuePresets(battCommon))
                ], 'battery')];
            }
        },

        /*
         * @rule rule-fraction-number
         * @title Normalized 0..1 Fraction Capability (Dim, Volume, Coverings, Light Channels)
         * @when Payload is numeric AND capability is in `FRACTION_CAPS` (`dim`, `volume_set`, `windowcoverings_set`, `light_hue`, `light_saturation`, `light_temperature`).
         * @why Homey fraction capabilities run from `0` to `1` (`%`). Generates a Gauge read card when readable and a Slider control card when writable (both for RW).
         * @main Read Card: Gauge (1x1) | Write Card: Slider (2x1)
         * @options Slider (if writable), Gauge, Label (1x1), Graph (2x1)
         */
        {
            id: 'rule-fraction-number',
            title: 'Normalized 0..1 Fraction Capability (Dim, Volume, Coverings)',
            when: 'Numeric payload on capability in FRACTION_CAPS (dim, volume_set, windowcoverings_set, light_hue/saturation/temperature)',
            why: 'Configures fixed 0..1 range with % unit. Produces a Gauge card for reading and a Slider card for writing (both when RW).',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'R or RW (getable || !setable)',
                    mainWidget: { id: 'gauge', label: 'Gauge', type: 'gauge', tile: '1x1', presets: ['Arc - Outer Values', 'Arc - Center Icon', 'Horizontal - Icon Left'] },
                    optionalWidgets: [
                        { id: 'slider', label: 'Slider (if writable)', type: 'slider', tile: '2x1 / 1x2' },
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' },
                        { id: 'graph', label: 'Graph', type: 'graph', tile: '2x1' }
                    ]
                },
                {
                    role: 'write',
                    accessWhen: 'W or RW (setable)',
                    mainWidget: { id: 'slider', label: 'Slider', type: 'slider', tile: '2x1', presets: ['Horizontal Slider - Label Top', 'Vertical Slider - Label Bottom'] },
                    optionalWidgets: [
                        { id: 'gauge', label: 'Gauge', type: 'gauge', tile: '1x1 / 2x1' },
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' },
                        { id: 'graph', label: 'Graph', type: 'graph', tile: '2x1' }
                    ]
                }
            ],
            match: function (ctx) {
                return ctx.numeric !== null && isFractionCap(ctx.cap);
            },
            build: function (ctx) {
                var fractionOut = [];
                var fractionBase = Object.assign({}, ctx.common, { fraction: true, unit: '%' });
                if (ctx.flags.getable || !ctx.flags.setable) {
                    fractionOut.push(cardWith(fractionBase, {
                        id: 'num:' + ctx.topic + ':read',
                        role: 'read',
                        fraction: true,
                        rangeMode: 'fixed',
                        fixedMin: 0,
                        fixedMax: 1,
                        unit: '%',
                        ruleId: 'rule-fraction-number'
                    }, numberChoices(fractionBase, !!ctx.flags.setable), 'gauge'));
                }
                if (ctx.flags.setable) {
                    fractionOut.push(cardWith(fractionBase, {
                        id: 'num:' + ctx.topic + ':write',
                        role: 'write',
                        fraction: true,
                        rangeMode: 'fixed',
                        fixedMin: 0,
                        fixedMax: 1,
                        unit: '%',
                        ruleId: 'rule-fraction-number'
                    }, numberChoices(fractionBase, true), 'slider'));
                }
                return fractionOut;
            }
        },

        /*
         * @rule rule-number
         * @title General Numeric Sensor or Setpoint
         * @when Payload is a finite number or numeric string (e.g. `21.5`, `230`, `-4.2`).
         * @why Numeric measurements (temperature, power, humidity, pressure, voltage) use capability or session min/max bounds. Generates a Gauge read card and, when writable, a Slider write card. A slider whose value is 1 or below enables Fractions. Values from 0 to 1 start with max 1, and a later higher value raises that max.
         * @main Read Card: Gauge (1x1) | Write Card: Slider (2x1)
         * @options Slider (if writable), Gauge, Label (1x1), Graph (2x1)
         */
        {
            id: 'rule-number',
            title: 'General Numeric Sensor or Setpoint',
            when: 'Payload is a finite number or numeric string (e.g. temperature, power, voltage, humidity)',
            why: 'Builds a Gauge read card with inferred unit/icon and session bounds, plus a Slider write card when the topic is writable. A slider whose value is 1 or below enables Fractions. Values from 0 to 1 start with max 1, and a later higher value raises that max.',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'R or RW (getable || !setable)',
                    mainWidget: { id: 'gauge', label: 'Gauge', type: 'gauge', tile: '1x1', presets: ['Arc - Outer Values', 'Arc - Center Icon', 'Horizontal - Icon Left'] },
                    optionalWidgets: [
                        { id: 'slider', label: 'Slider (if writable)', type: 'slider', tile: '2x1 / 1x2' },
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' },
                        { id: 'graph', label: 'Graph', type: 'graph', tile: '2x1' }
                    ]
                },
                {
                    role: 'write',
                    accessWhen: 'W or RW (setable)',
                    mainWidget: { id: 'slider', label: 'Slider', type: 'slider', tile: '2x1', presets: ['Horizontal Slider - Label Top', 'Vertical Slider - Label Bottom'] },
                    optionalWidgets: [
                        { id: 'gauge', label: 'Gauge', type: 'gauge', tile: '1x1 / 2x1' },
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' },
                        { id: 'graph', label: 'Graph', type: 'graph', tile: '2x1' }
                    ]
                }
            ],
            match: function (ctx) {
                return ctx.numeric !== null;
            },
            build: function (ctx) {
                var numericOut = [];
                if (ctx.flags.getable || !ctx.flags.setable) {
                    numericOut.push(cardWith(ctx.common, {
                        id: 'num:' + ctx.topic + ':read',
                        role: 'read',
                        rangeMode: 'session',
                        ruleId: 'rule-number'
                    }, numberChoices(ctx.common, !!ctx.flags.setable), 'gauge'));
                }
                if (ctx.flags.setable) {
                    numericOut.push(cardWith(ctx.common, {
                        id: 'num:' + ctx.topic + ':write',
                        role: 'write',
                        rangeMode: 'session',
                        ruleId: 'rule-number'
                    }, numberChoices(ctx.common, true), 'slider'));
                }
                return numericOut;
            }
        },

        /*
         * @rule rule-long-text
         * @title Long or Multi-Line Text (> 40 chars)
         * @when Payload is a non-empty string longer than 40 characters, containing newlines (`\n`), or containing `{{topic}}` placeholders.
         * @why Multi-line and longer strings require word wrapping inside a 2x1 (or 2x2 when > 160 chars) Text widget rather than clipping in a 1x1 Label.
         * @main Text (2x1 or 2x2)
         * @options Label (1x1)
         */
        {
            id: 'rule-long-text',
            title: 'Long or Multi-Line Text (> 40 chars)',
            when: 'Non-empty string with length > 40, line breaks (\\n), or {{topic}} tokens',
            why: 'Long strings need word-wrapping in a 2x1 or 2x2 Text widget instead of a single-line Label.',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'Any',
                    mainWidget: { id: 'text', label: 'Text', type: 'text', tile: '2x1 / 2x2', presets: ['Text'] },
                    optionalWidgets: [
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' }
                    ]
                }
            ],
            match: function (ctx) {
                return typeof ctx.text === 'string' && ctx.text.length > 0 && isLongText(ctx.text);
            },
            build: function (ctx) {
                var readTile = ctx.text.length > 160 ? '2x2' : '2x1';
                var longChoices = [
                    asChoice('text', 'Text', textBlockPresets(ctx.common, readTile)),
                    asChoice('label', 'Label', labelValuePresets(ctx.common))
                ];
                return [cardWith(ctx.common, { id: 'text:' + ctx.topic, rangeMode: 'none', ruleId: 'rule-long-text' }, longChoices, 'text')];
            }
        },

        /*
         * @rule rule-short-text
         * @title Short Status String or Writable Text Variable (<= 40 chars)
         * @when Payload is a non-empty single-line string of 40 characters or fewer.
         * @why Short strings (modes, states, short text variables) fit in a 1x1 Label for reading, and when writable (`setable`), also generate a 2x1 Edit Box card for user input.
         * @main Read Card: Label (1x1) | Write Card: Edit Box (2x1)
         * @options Text (2x1), Edit Box (2x1), Label (1x1)
         */
        {
            id: 'rule-short-text',
            title: 'Short Status String or Writable Text Variable (<= 40 chars)',
            when: 'Non-empty single-line string <= 40 characters',
            why: 'Displays short status strings in a 1x1 Label and adds a 2x1 Edit Box card when the topic is writable.',
            cards: [
                {
                    role: 'read',
                    accessWhen: 'R or RW (getable || !setable)',
                    mainWidget: { id: 'label', label: 'Label', type: 'label', tile: '1x1', presets: ['Label'] },
                    optionalWidgets: [
                        { id: 'text', label: 'Text (if writable)', type: 'text', tile: '2x1' },
                        { id: 'editbox', label: 'Edit Box (if writable)', type: 'editbox', tile: '2x1' }
                    ]
                },
                {
                    role: 'write',
                    accessWhen: 'W or RW (setable)',
                    mainWidget: { id: 'editbox', label: 'Edit Box', type: 'editbox', tile: '2x1', presets: ['Edit Box'] },
                    optionalWidgets: [
                        { id: 'label', label: 'Label', type: 'label', tile: '1x1' },
                        { id: 'text', label: 'Text', type: 'text', tile: '2x1' }
                    ]
                }
            ],
            match: function (ctx) {
                return typeof ctx.text === 'string' && ctx.text.length > 0 && !isLongText(ctx.text);
            },
            build: function (ctx) {
                var cards = [];
                var shortChoices = [asChoice('label', 'Label', labelValuePresets(ctx.common))];
                if (ctx.flags.setable) {
                    shortChoices.push(asChoice('text', 'Text', textBlockPresets(ctx.common, '2x1')));
                    shortChoices.push(asChoice('editbox', 'Edit Box', editBoxPresets(ctx.common)));
                }
                if (ctx.flags.getable || !ctx.flags.setable) {
                    cards.push(cardWith(ctx.common, { id: 'text:' + ctx.topic + ':read', role: 'read', rangeMode: 'none', ruleId: 'rule-short-text' }, shortChoices, 'label'));
                }
                if (ctx.flags.setable && ctx.flags.getable) {
                    cards.push(cardWith(ctx.common, { id: 'text:' + ctx.topic + ':write', role: 'write', rangeMode: 'none', ruleId: 'rule-short-text' }, shortChoices, 'editbox'));
                } else if (ctx.flags.setable && !ctx.flags.getable && !cards.length) {
                    cards.push(cardWith(ctx.common, { id: 'text:' + ctx.topic + ':write', role: 'write', rangeMode: 'none', ruleId: 'rule-short-text' }, shortChoices, 'editbox'));
                }
                return cards;
            }
        }
    ];

    function classifyTopic(topic, payload, meta, consumed) {
        if (!topic || (consumed && consumed[topic])) return [];
        var ctx = buildTopicContext(topic, payload, meta, consumed);
        for (var i = 0; i < RULE_PIPELINE.length; i++) {
            var rule = RULE_PIPELINE[i];
            if (rule.match(ctx)) {
                return rule.build(ctx);
            }
        }
        return [];
    }

    function traceTopic(topic, payload, meta, consumed) {
        var effectiveMeta = meta !== undefined ? meta : topicMeta(topic);
        var effectivePayload = payload !== undefined ? payload : seedPayload(topic, effectiveMeta);
        var ctx = buildTopicContext(topic, effectivePayload, effectiveMeta, consumed || {});
        var isConsumed = !!(consumed && consumed[topic]);
        var isLightPrepass = PREPASS_RULES[0].match(ctx);
        var steps = [];
        var matchedRule = null;
        var entries = [];

        if (isLightPrepass) {
            matchedRule = PREPASS_RULES[0];
            var builtGrid = buildLightGrids([topic]);
            entries = builtGrid.grids;
        }

        for (var i = 0; i < RULE_PIPELINE.length; i++) {
            var rule = RULE_PIPELINE[i];
            var evaluated = false;
            var hit = false;
            if (!isLightPrepass && !isConsumed && !matchedRule && effectivePayload !== undefined) {
                evaluated = true;
                hit = !!rule.match(ctx);
                if (hit) {
                    matchedRule = rule;
                    entries = rule.build(ctx);
                }
            }
            steps.push({
                id: rule.id,
                index: i + 1,
                title: rule.title,
                when: rule.when,
                why: rule.why,
                evaluated: evaluated,
                matched: hit,
                skippedBecausePriorMatch: !!(matchedRule && matchedRule.id !== rule.id && evaluated === false)
            });
        }

        return {
            topic: topic,
            payload: effectivePayload,
            coercedValue: ctx.value,
            meta: effectiveMeta,
            name: ctx.name,
            access: ctx.code,
            flags: ctx.flags,
            cap: ctx.cap,
            category: ctx.category,
            inferred: ctx.inferred,
            unit: ctx.unit,
            numeric: ctx.numeric,
            isConsumed: isConsumed,
            isLightPrepass: isLightPrepass,
            matchedRuleId: matchedRule ? matchedRule.id : null,
            matchedRule: matchedRule,
            steps: steps,
            entries: entries
        };
    }

    function buildLightGrids(topics) {
        var lights = [];
        var consumed = Object.create(null);
        for (var i = 0; i < topics.length; i++) {
            var topic = topics[i];
            var meta = topicMeta(topic);
            var payload = coercePayload(readPayload(topic));
            var named = isLightStateTopic(topic, meta);
            if (!named && !isLightStateObject(payload)) continue;
            consumed[topic] = true;
            if (named) {
                var deviceKey = String(topic).replace(/\/light_state_json$/i, '');
                consumed[deviceKey + '/dim'] = true;
            }
            lights.push({
                name: deviceLabel(topic) || friendlyName(topic, meta),
                outputMode: 'light',
                topics: [topic]
            });
        }
        for (var f = 0; f < topics.length; f++) {
            var fTop = topics[f];
            var fMeta = topicMeta(fTop);
            if (isFlowActionTopic(fTop, fMeta)) {
                var enTop = findFlowEnabledTopic(fTop, fMeta, topics);
                if (enTop) consumed[enTop] = true;
            }
        }
        if (!lights.length) return { grids: [], consumed: consumed };
        var topicsInGrid = lights.map(function (light) { return light.topics[0]; });
        var gridTopic = topicsInGrid[0];
        var grid = makeEntry({
            id: 'grid:lights',
            topic: gridTopic,
            topics: topicsInGrid,
            meta: topicMeta(gridTopic),
            name: 'Lights',
            access: 'RW',
            category: 'device',
            inferred: { icon: 'ph-lightbulb', unit: '' },
            unit: '',
            sample: readPayload(gridTopic),
            updatedAt: readStamp(gridTopic),
            kind: 'lightgrid',
            ruleId: 'prepass-lightgrid',
            rangeMode: 'none',
            keepSize: true,
            presets: []
        });
        useChoices(grid, [
            asChoice('lightgrid', 'Light Grid', singlePreset('lightgrid', 'Light Grid', 'lightgrid', '2x2', function () {
                return {
                    bindings: {},
                    overrides: { lightsData: lights }
                };
            }))
        ], 'lightgrid');
        return { grids: [grid], consumed: consumed };
    }

    function censusTopics() {
        var seen = Object.create(null);
        var rawList = [];
        function add(topic) {
            if (topic == null || topic === '' || seen[topic]) return;
            seen[topic] = true;
            rawList.push(String(topic));
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
        var bareEvents = Object.create(null);
        for (var i = 0; i < rawList.length; i++) {
            var name = rawList[i];
            if (name.indexOf('homey/event/') === 0) bareEvents[name.slice(12)] = true;
            else if (name.indexOf('homey/insight/') === 0) bareEvents[name.slice(14)] = true;
        }
        var list = [];
        for (var j = 0; j < rawList.length; j++) {
            var t = rawList[j];
            if (bareEvents[t] && t.indexOf('/') === -1) continue;
            list.push(t);
        }
        return list;
    }

    function seedPayload(topic, meta) {
        var payload = readPayload(topic);
        if (payload !== undefined) return payload;
        var topLower = String(topic || '').toLowerCase();
        if (topLower.indexOf('homey/insight/') === 0 || topLower.indexOf('homey/insight') === 0 || /\/insight\b/i.test(topLower)) {
            return { name: friendlyName(topic, meta), data: [] };
        }
        if ((meta && meta.isMood) || isMoodActionTopic(topic, meta)) return '';
        var cap = capabilityId(topic, meta);
        if (meta && meta.setable && !meta.getable && isPushActionCapability(topic, meta)) return '';
        if (cap === 'onoff' || cap.indexOf('onoff.') === 0 || cap.indexOf('alarm_') === 0) return false;
        if (isFractionCap(cap)) return 0;
        if (meta && meta.setable && !meta.getable) return '';
        return undefined;
    }

    function classifyAll() {
        var topics = censusTopics();
        var lights = buildLightGrids(topics);
        var entries = lights.grids.slice();
        for (var i = 0; i < topics.length; i++) {
            var topic = topics[i];
            var meta = topicMeta(topic);
            var payload = seedPayload(topic, meta);
            if (payload === undefined) continue;
            var made = classifyTopic(topic, payload, meta, lights.consumed);
            for (var j = 0; j < made.length; j++) entries.push(made[j]);
        }
        return { entries: entries, consumed: lights.consumed };
    }

    function collectUsedTopics() {
        var used = Object.create(null);
        var re = /\{\{([^}]+)\}\}/g;
        function add(value) {
            if (typeof value === 'string' && value.trim()) used[value.trim()] = true;
        }
        function walkBindings(node) {
            if (typeof node === 'string') {
                add(node);
                return;
            }
            if (!node || typeof node !== 'object') return;
            if (Array.isArray(node)) {
                for (var i = 0; i < node.length; i++) walkBindings(node[i]);
                return;
            }
            var keys = Object.keys(node);
            for (var k = 0; k < keys.length; k++) walkBindings(node[keys[k]]);
        }
        function walkPlaceholders(value) {
            if (typeof value !== 'string' || value.indexOf('{{') === -1) return;
            re.lastIndex = 0;
            var match;
            while ((match = re.exec(value))) add(match[1]);
        }
        function walkOverrides(node) {
            if (typeof node === 'string') {
                walkPlaceholders(node);
                return;
            }
            if (!node || typeof node !== 'object') return;
            if (Array.isArray(node)) {
                for (var i = 0; i < node.length; i++) walkOverrides(node[i]);
                return;
            }
            var keys = Object.keys(node);
            for (var k = 0; k < keys.length; k++) {
                var key = keys[k];
                var child = node[key];
                if (key === 'outputTopic' || key === 'topic' || key === 'dimTopic') add(child);
                if (key === 'topics' && Array.isArray(child)) {
                    for (var t = 0; t < child.length; t++) add(child[t]);
                }
                walkOverrides(child);
            }
        }
        var widgets = (typeof Dashboard !== 'undefined' && Dashboard.widgets) ? Dashboard.widgets : {};
        Object.keys(widgets).forEach(function (id) {
            var widget = widgets[id];
            if (!widget) return;
            walkBindings(widget.bindings);
            walkOverrides(widget.overrides);
        });
        return used;
    }

    function entryInUse(entry) {
        if (!session || !session.used) return false;
        var topics = entry.topics || [];
        for (var i = 0; i < topics.length; i++) {
            if (session.used[topics[i]]) return true;
        }
        return false;
    }

    function payloadText(entry) {
        var value = entry._lastPayload !== undefined ? entry._lastPayload : entry.sample;
        if (value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        try { return JSON.stringify(value); } catch (err) { return ''; }
    }

    function entryChoiceIds(entry) {
        var choices = entry && entry.choices ? entry.choices : [];
        var out = [];
        for (var i = 0; i < choices.length; i++) {
            out.push(String(choices[i].id || '').toLowerCase());
            out.push(String(choices[i].label || '').toLowerCase());
        }
        if (entry && entry.type) out.push(String(entry.type).toLowerCase());
        return out.join(' ');
    }

    function entrySearchBlob(entry) {
        var parts = [
            entry.name || '',
            (entry.topics || []).join(' '),
            topicWords((entry.topics || []).join(' ')),
            entry.type || '',
            entry.access || '',
            entry.unit || '',
            entry.category || '',
            entryChoiceIds(entry),
            payloadText(entry)
        ];
        if (entry.meta && entry.meta.zoneName) parts.push(entry.meta.zoneName);
        if (entry.meta && entry.meta.capabilityId) parts.push(entry.meta.capabilityId);
        return parts.join(' ').toLowerCase();
    }

    function matchesQueryToken(entry, blob, token) {
        var negate = false;
        var raw = token;
        if (raw.length > 1 && raw.charAt(0) === '-') {
            negate = true;
            raw = raw.slice(1);
        }
        var hit = false;
        var colon = raw.indexOf(':');
        if (colon > 0) {
            var prefix = raw.slice(0, colon);
            var val = raw.slice(colon + 1);
            if (!val) return true;
            if (prefix === 'type' || prefix === 'widget') {
                hit = String(entry.type || '').toLowerCase().indexOf(val) !== -1 || entryChoiceIds(entry).indexOf(val) !== -1;
            } else if (prefix === 'access' || prefix === 'mode') {
                hit = String(entry.access || '').toLowerCase() === val;
            } else if (prefix === 'unit') {
                hit = String(entry.unit || '').toLowerCase().indexOf(val) !== -1;
            } else if (prefix === 'source' || prefix === 'cat') {
                hit = String(entry.category || '').toLowerCase().indexOf(val) !== -1;
            } else if (prefix === 'dev' || prefix === 'device') {
                hit = deviceLabel(entry.topic || '').toLowerCase().indexOf(val) !== -1 || String(entry.topic || '').toLowerCase().indexOf(val) !== -1;
            } else {
                hit = blob.indexOf(raw) !== -1;
            }
        } else {
            hit = blob.indexOf(raw) !== -1;
        }
        return negate ? !hit : hit;
    }

    function matchesQuery(entry) {
        var query = (session && session.query) ? session.query : '';
        if (!query) return true;
        var tokens = query.split(/\s+/).filter(Boolean);
        if (!tokens.length) return true;
        var blob = entrySearchBlob(entry);
        for (var i = 0; i < tokens.length; i++) {
            if (!matchesQueryToken(entry, blob, tokens[i])) return false;
        }
        return true;
    }

    function matchesFacetFilters(entry, ignoreType) {
        if (!session) return true;
        if (!ignoreType && session.typeFilter && session.typeFilter !== 'all') {
            var activeChoice = entry.choices && entry.choices[entry.choiceIndex] ? entry.choices[entry.choiceIndex].id : entry.type;
            if (activeChoice !== session.typeFilter && entry.type !== session.typeFilter) return false;
        }
        if (session.accessFilter && session.accessFilter !== 'all') {
            var code = entry.access || 'R';
            if (session.accessFilter === 'writable') {
                if (code !== 'RW' && code !== 'W' && code !== 'L') return false;
            } else if (session.accessFilter === 'readonly') {
                if (code !== 'R') return false;
            } else if (code !== session.accessFilter) {
                return false;
            }
        }
        if (session.sourceFilter && session.sourceFilter !== 'all') {
            if ((entry.category || 'device') !== session.sourceFilter) return false;
        }
        return true;
    }

    function isVisible(entry) {
        if (!matchesQuery(entry)) return false;
        if (!matchesFacetFilters(entry, false)) return false;
        if (session && session.hideUsed && entryInUse(entry)) return false;
        return true;
    }

    function accessRank(code) {
        if (code === 'RW') return 0;
        if (code === 'W') return 1;
        if (code === 'R') return 2;
        return 3;
    }

    function sortedVisible() {
        var list = [];
        var entries = session ? session.entries : [];
        for (var i = 0; i < entries.length; i++) {
            if (isVisible(entries[i])) list.push(entries[i]);
        }
        var mode = session && session.sortKey ? session.sortKey : 'activity';
        list.sort(function (a, b) {
            if (mode === 'name') return String(a.name).localeCompare(String(b.name));
            if (mode === 'type') {
                var typeCmp = String(a.type).localeCompare(String(b.type));
                if (typeCmp) return typeCmp;
                return String(a.name).localeCompare(String(b.name));
            }
            if (mode === 'access') {
                var rank = accessRank(a.access) - accessRank(b.access);
                if (rank) return rank;
                return String(a.name).localeCompare(String(b.name));
            }
            var time = (b.updatedAt || 0) - (a.updatedAt || 0);
            if (time) return time;
            return String(a.name).localeCompare(String(b.name));
        });
        return list;
    }

    var TYPE_LABELS = {
        gauge: 'Gauge',
        switch: 'Switch',
        slider: 'Slider',
        icon: 'Icon',
        graph: 'Graph',
        text: 'Text',
        label: 'Label',
        battery: 'Battery',
        lightgrid: 'Light Grid',
        list: 'List',
        image: 'Image',
        videostream: 'Video',
        editbox: 'Edit Box',
        container: 'Container',
        empty: 'Container'
    };

    function refreshTypeFilterOptions() {
        if (!session || !session.typeFilterEl) return;
        var counts = Object.create(null);
        var total = 0;
        for (var i = 0; i < session.entries.length; i++) {
            var entry = session.entries[i];
            if (session.hideUsed && entryInUse(entry)) continue;
            if (!matchesQuery(entry)) continue;
            if (!matchesFacetFilters(entry, true)) continue;
            var key = entry.choices && entry.choices[entry.choiceIndex] ? entry.choices[entry.choiceIndex].id : entry.type;
            if (!key) continue;
            counts[key] = (counts[key] || 0) + 1;
            total++;
        }
        var current = session.typeFilter || 'all';
        var keys = Object.keys(counts).sort(function (a, b) {
            return (counts[b] - counts[a]) || a.localeCompare(b);
        });
        if (current !== 'all' && !counts[current]) keys.push(current);
        var select = session.typeFilterEl;
        select.innerHTML = '';
        var allOpt = document.createElement('option');
        allOpt.value = 'all';
        allOpt.textContent = 'All Widget Types (' + total + ')';
        select.appendChild(allOpt);
        for (var k = 0; k < keys.length; k++) {
            var id = keys[k];
            var opt = document.createElement('option');
            opt.value = id;
            var nice = TYPE_LABELS[id] || titleCase(id);
            opt.textContent = nice + ' (' + (counts[id] || 0) + ')';
            select.appendChild(opt);
        }
        select.value = current;
    }

    function selectedCount() {
        if (!session || !session.selected) return 0;
        return session.selected.size;
    }

    function notifyCount() {
        if (!session) return;
        var count = selectedCount();
        var visCount = session.visible ? session.visible.length : 0;
        if (session.countEl) {
            session.countEl.textContent = count + (count === 1 ? ' widget selected' : ' widgets selected') + ' · ' + visCount + ' shown';
        }
        if (session.addBtn) {
            session.addBtn.textContent = 'Add Selected to Canvas (' + count + ')';
            session.addBtn.disabled = count === 0;
        }
        if (typeof session.onCount === 'function') session.onCount(count);
    }

    function paintSelection(entry) {
        if (!entry || !entry.card) return;
        var on = session && session.selected && session.selected.has(entry.id);
        entry.card.classList.toggle('is-selected', !!on);
        if (entry.selectBox) entry.selectBox.checked = !!on;
        if (entry.selectBtn) entry.selectBtn.classList.toggle('is-checked', !!on);
    }

    function syncNameTooltip(entry) {
        if (!entry) return;
        var el = entry.nameText || entry.nameEl;
        if (!el) return;
        el.title = '';
        if (entry.nameEl) entry.nameEl.title = '';
        if (el.scrollWidth > el.clientWidth + 1) {
            el.title = entry.name || '';
            if (entry.nameEl) entry.nameEl.title = entry.name || '';
        }
    }

    function accessTagHtml(code) {
        if (typeof UIUtils === 'undefined' || typeof UIUtils.createAccessLevelTag !== 'function') {
            return code || 'R';
        }
        if (code === 'L') return UIUtils.createAccessLevelTag(false, false, false, false, true);
        if (code === 'W') return UIUtils.createAccessLevelTag(false, true);
        if (code === 'RW') return UIUtils.createAccessLevelTag(true, true);
        return UIUtils.createAccessLevelTag(true, false);
    }

    function paintCard(entry) {
        if (!entry || !entry.card) return;
        entry.card.classList.remove('awg-tile-1x1', 'awg-tile-2x1', 'awg-tile-2x2', 'awg-tile-1x2');
        entry.card.classList.add('awg-tile-' + (entry.tile || '1x1'));
        if (entry.preview) entry.preview.className = 'awg-preview';
        if (entry.nameText) entry.nameText.textContent = entry.name || '';
        if (entry.badgeEl) {
            entry.badgeEl.innerHTML = accessTagHtml(entry.access || 'R');
            var tag = entry.badgeEl.querySelector('svg');
            if (tag) tag.style.marginLeft = '0';
        }
        if (entry.usedEl) {
            var showUsed = entryInUse(entry) && !(session && session.hideUsed);
            entry.usedEl.style.display = showUsed ? 'inline-flex' : 'none';
        }
        var menuOpen = !!(session && session.styleMenuEntry === entry);
        if (entry.card) entry.card.classList.toggle('is-style-open', menuOpen);
        if (entry.styleActions) entry.styleActions.hidden = false;
        if (entry.styleBtn) {
            entry.styleBtn.hidden = false;
            var presetName = styleButtonText(entry);
            if (entry.styleLabel) entry.styleLabel.textContent = presetName;
            entry.styleBtn.title = 'Template: ' + presetName + '. Click to choose another.';
            entry.styleBtn.setAttribute('aria-label', 'Choose template. Current template: ' + presetName);
            entry.styleBtn.setAttribute('aria-expanded', menuOpen ? 'true' : 'false');
        }
        if (entry.typeSelect) {
            var choices = entry.choices || [];
            var signature = choices.map(function (choice) { return choice.id; }).join('|');
            entry.typeSelect.hidden = choices.length < 2;
            if (choices.length >= 2 && entry.typeSelect.getAttribute('data-awg-built') !== signature) {
                entry.typeSelect.innerHTML = '';
                choices.forEach(function (choice) {
                    var option = document.createElement('option');
                    option.value = choice.id;
                    option.textContent = choice.label;
                    entry.typeSelect.appendChild(option);
                });
                entry.typeSelect.setAttribute('data-awg-built', signature);
            }
            if (choices.length >= 2 && choices[entry.choiceIndex]) {
                entry.typeSelect.value = choices[entry.choiceIndex].id;
            }
        }
        entry.card.title = (entry.topics || [entry.topic]).join('\n');
        paintSelection(entry);
        if (entry.nameEl && entry.nameEl.isConnected) syncNameTooltip(entry);
    }

    function pulseCard(entry) {
        if (!entry || !entry.card) return;
        entry.card.classList.remove('is-live');
        // Restart the animation if another payload arrives mid-pulse.
        void entry.card.offsetWidth;
        entry.card.classList.add('is-live');
        if (entry._pulseTimer) clearTimeout(entry._pulseTimer);
        entry._pulseTimer = setTimeout(function () {
            if (entry.card) entry.card.classList.remove('is-live');
            entry._pulseTimer = 0;
        }, 600);
    }

    function unmountPreview(entry) {
        if (!entry || !entry.widget) return;
        try {
            if (typeof entry.widget.destroy === 'function') entry.widget.destroy();
        } catch (err) { /* preview teardown */ }
        entry.widget = null;
        if (entry.preview) entry.preview.innerHTML = '';
    }

    function previewPixelSize(entry) {
        var el = entry && entry.preview;
        var w = el ? el.clientWidth : 0;
        var h = el ? el.clientHeight : 0;
        if (w > 8 && h > 8) return { w: Math.round(w), h: Math.round(h) };
        var tile = TILES[entry && entry.tile ? entry.tile : '1x1'] || TILES['1x1'];
        return { w: tile.w, h: tile.h };
    }

    function readThemeBackdrop() {
        // Dialog mode reads the live dashboard. The wizard applies the theme
        // chosen on the previous step before the gallery mounts, so the same
        // cache is that theme while Populate Your Canvas is open.
        var cache = (typeof Dashboard !== 'undefined' && Dashboard._domCache) ? Dashboard._domCache : null;
        if (cache && (cache.bgImage || cache.bgColor)) {
            return {
                color: cache.bgColor || 'transparent',
                image: cache.bgImage || 'none',
                size: cache.bgSize || 'cover',
                repeat: cache.bgRepeat || 'no-repeat',
                position: 'center'
            };
        }
        var canvas = document.getElementById('dashboard-canvas');
        var wrapper = document.getElementById('dashboard-wrapper');
        var el = canvas;
        if (wrapper && canvas && (canvas.style.backgroundImage === 'none' || canvas.style.backgroundColor === 'transparent')) {
            el = wrapper;
        }
        if (!el) return null;
        var computed = (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function')
            ? window.getComputedStyle(el)
            : null;
        return {
            color: el.style.backgroundColor || (computed ? computed.backgroundColor : '') || 'transparent',
            image: el.style.backgroundImage || (computed ? computed.backgroundImage : '') || 'none',
            size: el.style.backgroundSize || (computed ? computed.backgroundSize : '') || 'cover',
            repeat: el.style.backgroundRepeat || (computed ? computed.backgroundRepeat : '') || 'no-repeat',
            position: el.style.backgroundPosition || (computed ? computed.backgroundPosition : '') || 'center'
        };
    }

    function paintGalleryBackdrop() {
        if (!session || !session.grid) return;
        var backdrop = readThemeBackdrop();
        if (!backdrop) return;
        var grid = session.grid;
        grid.style.backgroundColor = backdrop.color;
        grid.style.backgroundImage = backdrop.image;
        grid.style.backgroundSize = backdrop.size;
        grid.style.backgroundRepeat = backdrop.repeat;
        grid.style.backgroundPosition = backdrop.position;
    }

    function paintPreviewStage(entry) {
        paintGalleryBackdrop();
        if (!entry || !entry.preview || !entry.preview.parentNode) return;
        var wrap = entry.preview.parentNode;
        wrap.style.backgroundColor = 'transparent';
        wrap.style.backgroundImage = 'none';
    }

    function fitMountedPreview(entry) {
        paintPreviewStage(entry);
        if (!entry || !entry.widget || !entry.widget.overrides || !entry.preview) return;
        var size = previewPixelSize(entry);
        if (entry.widget.overrides.width === size.w && entry.widget.overrides.height === size.h) return;
        entry.widget.overrides.width = size.w;
        entry.widget.overrides.height = size.h;
        if (typeof entry.widget.notifyOverridesMutated === 'function') entry.widget.notifyOverridesMutated();
        try { entry.widget.render(); } catch (err) { /* preview resize */ }
    }

    function applyPreviewChrome(overrides) {
        if (!overrides) return;
        overrides.padding = 10;
        overrides.cornerRadius = 0;
        overrides.borderWidth = 0;
        if (!overrides.container || typeof overrides.container !== 'object') overrides.container = {};
        overrides.container.padding = 10;
        if (!overrides.container.border || typeof overrides.container.border !== 'object') overrides.container.border = {};
        overrides.container.border.width = 0;
        overrides.container.border.cornerRadius = 0;
    }

    function mountPreview(entry) {
        if (!entry || entry.widget || !entry.preview) return;
        if (typeof WidgetRegistry === 'undefined' || typeof WidgetRegistry.get !== 'function') return;
        var WidgetClass = WidgetRegistry.get(entry.type);
        if (!WidgetClass) return;
        entry.preview.id = entry.hostKey;
        var previewOverrides = cloneData(entry.overrides);
        var fitted = previewPixelSize(entry);
        previewOverrides.x = 0;
        previewOverrides.y = 0;
        previewOverrides.width = fitted.w;
        previewOverrides.height = fitted.h;
        applyPreviewChrome(previewOverrides);
        try {
            entry.widget = new WidgetClass(entry.hostKey, entry.previewKey, previewOverrides, cloneData(entry.bindings || {}));
            paintPreviewStage(entry);
            if (entry.widget.elements && entry.widget.elements.wrapper) {
                entry.widget.elements.wrapper.style.pointerEvents = 'none';
            }
            requestAnimationFrame(function () { fitMountedPreview(entry); });
        } catch (err) {
            entry.widget = null;
            entry.preview.textContent = 'Preview unavailable';
        }
    }

    function scheduleRender(entry) {
        if (!entry || !entry.widget || entry._renderQueued) return;
        entry._renderQueued = true;
        requestAnimationFrame(function () {
            entry._renderQueued = false;
            if (!entry.widget) return;
            if (entry.type === 'slider') writeSliderHints(entry);
            if ((entry.rangeMode === 'session' || entry.rangeMode === 'fixed')
                && (entry.type === 'gauge' || entry.type === 'slider')) {
                entry.widget.overrides.min = entry._sessionMin;
                entry.widget.overrides.max = entry._sessionMax;
                if (typeof entry.widget.notifyOverridesMutated === 'function') entry.widget.notifyOverridesMutated();
            } else if (entry.type === 'slider' && typeof entry.widget.notifyOverridesMutated === 'function') {
                entry.widget.notifyOverridesMutated();
            }
            try { entry.widget.render(); } catch (err) { /* live preview */ }
        });
    }

    function bindPreviewResizeObserver() {
        if (!session || !session.grid || typeof ResizeObserver === 'undefined') return;
        if (session._resizeObserver) session._resizeObserver.disconnect();
        var queued = false;
        session._resizeObserver = new ResizeObserver(function () {
            if (!session || queued) return;
            queued = true;
            requestAnimationFrame(function () {
                queued = false;
                if (!session) return;
                session.entries.forEach(function (entry) {
                    paintPreviewStage(entry);
                    fitMountedPreview(entry);
                    syncNameTooltip(entry);
                });
            });
        });
        session._resizeObserver.observe(session.grid);
        session.entries.forEach(function (entry) {
            if (entry.preview) session._resizeObserver.observe(entry.preview);
            if (entry.card) session._resizeObserver.observe(entry.card);
        });
    }

    function observePreviewResize(entry) {
        if (!session || !session._resizeObserver || !entry) return;
        if (entry.preview) session._resizeObserver.observe(entry.preview);
        if (entry.card) session._resizeObserver.observe(entry.card);
    }

    function unbindPreviewResizeObserver() {
        if (!session || !session._resizeObserver) return;
        session._resizeObserver.disconnect();
        session._resizeObserver = null;
    }

    function bindObserver() {
        if (!session || !session.grid || typeof IntersectionObserver === 'undefined') {
            if (session) {
                session.entries.forEach(function (entry) {
                    if (isVisible(entry)) mountPreview(entry);
                });
            }
            return;
        }
        if (session.observer) session.observer.disconnect();
        session.observer = new IntersectionObserver(function (records) {
            for (var i = 0; i < records.length; i++) {
                var record = records[i];
                var id = record.target.getAttribute('data-awg-id');
                var entry = session && session.byId ? session.byId[id] : null;
                if (!entry) continue;
                if (record.isIntersecting) mountPreview(entry);
                else unmountPreview(entry);
            }
        }, { root: session.grid, rootMargin: '200px', threshold: 0.01 });
        session.entries.forEach(function (entry) {
            if (entry.card) session.observer.observe(entry.card);
        });
    }

    function layoutCards() {
        if (!session || !session.grid) return;
        refreshTypeFilterOptions();
        var visible = sortedVisible();
        var seen = Object.create(null);
        var frag = document.createDocumentFragment();
        for (var i = 0; i < visible.length; i++) {
            var entry = visible[i];
            seen[entry.id] = true;
            if (entry.card) {
                entry.card.hidden = false;
                frag.appendChild(entry.card);
            }
        }
        session.entries.forEach(function (entry) {
            if (seen[entry.id] || !entry.card) return;
            entry.card.hidden = true;
            unmountPreview(entry);
            frag.appendChild(entry.card);
        });
        session.grid.appendChild(frag);
        if (session.emptyEl) session.emptyEl.hidden = visible.length !== 0;
        session.visible = visible;
        notifyCount();
        requestAnimationFrame(function () {
            if (!session) return;
            session.entries.forEach(function (entry) {
                syncNameTooltip(entry);
                fitMountedPreview(entry);
            });
        });
    }

    function appendNewCards(made) {
        if (!session || !session.grid || !made || !made.length) return;
        if (!session.visible) session.visible = [];
        refreshTypeFilterOptions();
        for (var i = 0; i < made.length; i++) {
            var entry = made[i];
            if (!entry.card) continue;
            var show = isVisible(entry);
            entry.card.hidden = !show;
            if (!show) unmountPreview(entry);
            session.grid.appendChild(entry.card);
            observePreviewResize(entry);
            if (show) session.visible.push(entry);
        }
        if (session.emptyEl) session.emptyEl.hidden = session.visible.length !== 0;
        notifyCount();
        requestAnimationFrame(function () {
            if (!session) return;
            made.forEach(syncNameTooltip);
        });
    }

    function indexEntry(entry) {
        session.byId[entry.id] = entry;
        var topics = entry.topics || [];
        for (var i = 0; i < topics.length; i++) {
            var topic = topics[i];
            if (!session.byTopic[topic]) session.byTopic[topic] = [];
            session.byTopic[topic].push(entry);
            session.known[topic] = true;
        }
    }

    function buildCard(entry) {
        var card = document.createElement('div');
        card.className = 'gallery-item';
        card.setAttribute('data-awg-id', entry.id);

        var thumb = document.createElement('div');
        thumb.className = 'gallery-item-thumb-wrap';
        var preview = document.createElement('div');
        preview.className = 'awg-preview';
        var styleActions = document.createElement('div');
        styleActions.className = 'gallery-item-hover-actions';
        var styleBtn = document.createElement('button');
        styleBtn.type = 'button';
        styleBtn.className = 'gallery-hover-btn awg-style-btn';
        styleBtn.setAttribute('aria-haspopup', 'menu');
        styleBtn.setAttribute('aria-expanded', 'false');
        var styleLabel = document.createElement('span');
        styleLabel.className = 'awg-style-btn-label';
        var styleCaret = document.createElement('i');
        styleCaret.className = 'ph-bold ph-caret-down awg-style-btn-caret';
        styleCaret.setAttribute('aria-hidden', 'true');
        styleBtn.appendChild(styleLabel);
        styleBtn.appendChild(styleCaret);
        styleBtn.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            toggleStyleMenu(entry, styleBtn);
        });
        styleActions.appendChild(styleBtn);
        thumb.appendChild(preview);
        thumb.appendChild(styleActions);

        var nameEl = document.createElement('div');
        nameEl.className = 'gallery-item-name';
        var nameText = document.createElement('span');
        nameText.className = 'awg-card-name';
        var badgeEl = document.createElement('span');
        var usedEl = document.createElement('span');
        usedEl.className = 'factory-badge';
        usedEl.textContent = 'In Use';
        nameEl.appendChild(nameText);
        nameEl.appendChild(badgeEl);
        nameEl.appendChild(usedEl);

        var typeSelect = document.createElement('select');
        typeSelect.className = 'control-input';
        typeSelect.title = 'Widget type';
        typeSelect.addEventListener('click', function (event) { event.stopPropagation(); });
        typeSelect.addEventListener('change', function () {
            convertType(entry, typeSelect.value);
        });

        var selectBtn = document.createElement('label');
        selectBtn.className = 'ds-checkbox-row';
        var selectBox = document.createElement('input');
        selectBox.type = 'checkbox';
        selectBox.className = 'ds-checkbox';
        var selectText = document.createElement('span');
        selectText.className = 'ds-checkbox-row__status';
        selectText.textContent = 'Select';
        selectBtn.appendChild(selectBox);
        selectBtn.appendChild(selectText);
        selectBox.addEventListener('click', function (event) { event.stopPropagation(); });
        selectBox.addEventListener('change', function () {
            setSelected(entry, selectBox.checked);
        });

        var foot = document.createElement('div');
        foot.className = 'awg-card-foot';
        foot.appendChild(typeSelect);
        foot.appendChild(selectBtn);

        var chrome = document.createElement('div');
        chrome.className = 'awg-card-chrome';
        chrome.appendChild(nameEl);
        chrome.appendChild(foot);

        card.appendChild(thumb);
        card.appendChild(chrome);

        entry.card = card;
        entry.preview = preview;
        entry.styleActions = styleActions;
        entry.styleBtn = styleBtn;
        entry.styleLabel = styleLabel;
        entry.nameEl = nameEl;
        entry.nameText = nameText;
        entry.badgeEl = badgeEl;
        entry.usedEl = usedEl;
        entry.selectBtn = selectBtn;
        entry.selectBox = selectBox;
        entry.typeSelect = typeSelect;
        paintCard(entry);
        return card;
    }

    function styleChoices(entry) {
        var choices = entry && entry.choices ? entry.choices : [];
        if (choices.length) return choices;
        if (entry && entry.presets && entry.presets.length) {
            return [{ id: entry.type || 'style', label: entry.type || 'Style', presets: entry.presets }];
        }
        return [];
    }

    function styleButtonText(entry) {
        if (entry && entry.factoryPresetName) {
            var sub = entry.factoryVariantName;
            var showSub = entry.factoryHasSubs && sub && String(sub).toLowerCase() !== 'default';
            if (showSub) return entry.factoryPresetName + ' / ' + sub;
            return entry.factoryPresetName;
        }
        var preset = entry && entry.presets && entry.presets[entry.presetIndex];
        return preset && preset.label ? preset.label : 'Templates';
    }

    function selectStyle(entry, choiceIndex, presetIndex) {
        var choices = styleChoices(entry);
        var choice = choices[choiceIndex];
        if (!choice || !entry) return;
        entry.choiceIndex = choiceIndex;
        entry.presets = choice.presets || [];
        entry.presetIndex = presetIndex;
        applyPreset(entry);
        refreshEntryInPlace(entry);
    }

    function refreshEntryInPlace(entry) {
        if (!entry) return;
        unmountPreview(entry);
        paintCard(entry);
        if (!entry.card) return;
        var show = isVisible(entry);
        entry.card.hidden = !show;
        if (session && session.visible) {
            var idx = session.visible.indexOf(entry);
            if (show && idx < 0) session.visible.push(entry);
            if (!show && idx >= 0) session.visible.splice(idx, 1);
        }
        if (show) mountPreview(entry);
        syncNameTooltip(entry);
        notifyCount();
        refreshTypeFilterOptions();
        if (session && session.emptyEl) session.emptyEl.hidden = !!(session.visible && session.visible.length);
    }

    function clearStyleSubTimer() {
        if (!session || !session._styleSubTimer) return;
        clearTimeout(session._styleSubTimer);
        session._styleSubTimer = null;
    }

    function closeStyleSubmenu() {
        if (!session) return;
        clearStyleSubTimer();
        session._styleSubToken = (session._styleSubToken || 0) + 1;
        if (session.styleSubRow) session.styleSubRow.classList.remove('is-open');
        if (session.styleSubmenu && session.styleSubmenu.parentNode) {
            session.styleSubmenu.parentNode.removeChild(session.styleSubmenu);
        }
        session.styleSubmenu = null;
        session.styleSubRow = null;
        session.styleSubItem = null;
    }

    function scheduleCloseStyleSubmenu() {
        if (!session) return;
        clearStyleSubTimer();
        session._styleSubTimer = setTimeout(function () {
            closeStyleSubmenu();
        }, 180);
    }

    function closeStyleMenu() {
        if (!session || !session.styleMenu) return;
        closeStyleSubmenu();
        var entry = session.styleMenuEntry;
        if (session.styleMenu.parentNode) session.styleMenu.parentNode.removeChild(session.styleMenu);
        session.styleMenu = null;
        session.styleMenuEntry = null;
        session._styleMenuToken = (session._styleMenuToken || 0) + 1;
        if (entry && entry.card) entry.card.classList.remove('is-style-open');
        if (entry && entry.styleBtn) entry.styleBtn.setAttribute('aria-expanded', 'false');
    }

    function releaseMenuHeight(menu) {
        if (menu) menu.style.maxHeight = 'none';
    }

    function clampMenuHeight(menu, top) {
        if (!menu) return top;
        var margin = 8;
        var height = menu.offsetHeight;
        var limit = window.innerHeight - margin - top;
        if (height <= limit) {
            menu.style.maxHeight = 'none';
            return top;
        }
        if (limit < 96) {
            top = margin;
            limit = window.innerHeight - (margin * 2);
        }
        menu.style.maxHeight = Math.floor(Math.max(96, limit)) + 'px';
        menu.style.top = Math.round(top) + 'px';
        return top;
    }

    function placeStyleMenu(anchor) {
        var menu = session && session.styleMenu;
        if (!menu || !anchor) return;
        releaseMenuHeight(menu);
        var rect = anchor.getBoundingClientRect();
        var margin = 8;
        menu.style.left = '0px';
        menu.style.top = '0px';
        var width = menu.offsetWidth;
        var height = menu.offsetHeight;
        var left = rect.right - width;
        if (left < margin) left = rect.left;
        if (left + width > window.innerWidth - margin) left = window.innerWidth - margin - width;
        if (left < margin) left = margin;
        var top = rect.bottom + 6;
        if (top + height > window.innerHeight - margin) top = rect.top - height - 6;
        if (top < margin) top = margin;
        menu.style.left = Math.round(left) + 'px';
        menu.style.top = Math.round(top) + 'px';
        clampMenuHeight(menu, top);
    }

    function manifestTypesFor(type) {
        var key = String(type || '');
        if (key === 'empty') return ['empty', 'container'];
        if (key === 'textbox') return ['list'];
        return [key];
    }

    function loadTemplateCatalog(type) {
        var empty = { builtin: [], user: [] };
        if (typeof Dashboard === 'undefined' || typeof Dashboard._loadWidgetPresetsManifest !== 'function') {
            return Promise.resolve(empty);
        }
        var userPromise = (typeof Dashboard._loadUserWidgetPresets === 'function')
            ? Dashboard._loadUserWidgetPresets(type).catch(function () { return []; })
            : Promise.resolve([]);
        return Dashboard._loadWidgetPresetsManifest().then(function (manifest) {
            var builtin = [];
            var keys = manifestTypesFor(type);
            var seen = {};
            for (var k = 0; k < keys.length; k++) {
                var list = manifest && manifest[keys[k]];
                if (!list || !list.length) continue;
                for (var i = 0; i < list.length; i++) {
                    var item = list[i];
                    if (!item || !item.file || seen[item.file]) continue;
                    seen[item.file] = true;
                    builtin.push({
                        kind: 'builtin',
                        id: item.id || item.file,
                        name: item.name || item.id || 'Template',
                        file: item.file,
                        variantCount: item.variantCount > 1 ? item.variantCount : 1
                    });
                }
            }
            builtin.sort(function (a, b) {
                var an = String(a.name).toLowerCase();
                var bn = String(b.name).toLowerCase();
                if (an < bn) return -1;
                if (an > bn) return 1;
                return 0;
            });
            return userPromise.then(function (user) {
                var mine = [];
                if (user && user.length) {
                    for (var u = 0; u < user.length; u++) {
                        var row = user[u];
                        if (!row) continue;
                        mine.push({
                            kind: 'user',
                            id: row.fullName || row.fileId,
                            name: row.name || row.fileId || 'Preset',
                            fullName: row.fullName,
                            file: row.fileId,
                            variantCount: row.variantCount > 1 ? row.variantCount : 1
                        });
                    }
                }
                return { builtin: builtin, user: mine };
            });
        }).catch(function () { return empty; });
    }

    function fetchPresetFile(item, type) {
        if (!session._presetFileCache) session._presetFileCache = {};
        var key = (item.kind || 'builtin') + '|' + type + '|' + (item.kind === 'user' ? item.fullName : item.file);
        if (session._presetFileCache[key]) return session._presetFileCache[key];
        var promise;
        if (item.kind === 'user' && typeof Dashboard._loadUserWidgetPresetFile === 'function') {
            promise = Dashboard._loadUserWidgetPresetFile(item.fullName);
        } else if (typeof Dashboard.fetchBuiltInWidgetPresetFile === 'function') {
            promise = Dashboard.fetchBuiltInWidgetPresetFile(type, item.file);
        } else {
            promise = Promise.reject(new Error('Preset loader is not available'));
        }
        session._presetFileCache[key] = promise.catch(function (err) {
            delete session._presetFileCache[key];
            throw err;
        });
        return session._presetFileCache[key];
    }

    function applyFactorySettings(entry, file, variantIndex, item) {
        var presets = entry.presets || [];
        var preset = presets[entry.presetIndex] || presets[0];
        if (!preset || typeof preset.build !== 'function') return;
        var built = preset.build();
        var base = Object.assign({}, built.overrides || {});
        var variants = file && file.variants ? file.variants : [];
        var variant = variants[variantIndex] || variants[0];
        if (!variant) return;
        var settings = cloneData(variant.settings || {});
        var width = Number(settings.width);
        var height = Number(settings.height);
        if (typeof Dashboard._stripWidgetPresetExcludedKeys === 'function') {
            settings = Dashboard._stripWidgetPresetExcludedKeys(settings);
        }
        delete settings.width;
        delete settings.height;
        var identity = ['label', 'buttonLabel', 'unit', 'outputTopic', 'text', 'lightsData', 'placeholder', 'mode'];
        var kept = {};
        for (var i = 0; i < identity.length; i++) {
            var key = identity[i];
            if (base[key] !== undefined) kept[key] = base[key];
        }
        var keptIcons = (!settings.icons && base.icons) ? cloneData(base.icons) : null;
        var merged = cloneData(base);
        if (typeof Dashboard._deepMergePresetSettings === 'function') {
            Dashboard._deepMergePresetSettings(merged, settings);
        } else {
            Object.assign(merged, settings);
        }
        Object.keys(kept).forEach(function (keptKey) { merged[keptKey] = kept[keptKey]; });
        if (keptIcons) merged.icons = keptIcons;
        if (entry.type === 'slider') {
            applySliderValueHints(entry, entry._lastPayload != null ? entry._lastPayload : entry.sample);
        }
        if (entry.fraction && (entry.type === 'gauge' || entry.type === 'slider')) {
            merged.min = 0;
            merged.max = (entry.type === 'slider' && entry._sliderMaxRaised && isFinite(entry._sessionMax)) ? entry._sessionMax : 1;
            merged.unit = '%';
            if (entry.type === 'slider') merged.allowDecimals = true;
        } else if (entry.type === 'gauge' || entry.type === 'slider') {
            applyRangeToOverrides(entry, merged);
        }
        if (entry.type === 'slider' && entry._sliderFractions) merged.allowDecimals = true;
        merged.x = 0;
        merged.y = 0;
        merged.page = currentPage();
        merged.metaName = entry.name;
        delete merged.width;
        delete merged.height;
        entry.overrides = merged;
        entry.bindings = built.bindings || {};
        entry.factoryKind = item.kind || 'builtin';
        entry.factoryPresetId = item.id || '';
        entry.factoryPresetName = item.name || (file && file.name) || 'Template';
        entry.factoryVariantId = variant.id != null ? String(variant.id) : String(variantIndex);
        entry.factoryVariantName = variant.name || '';
        entry.factoryHasSubs = variants.length > 1;
        entry.factoryWidth = width > 8 ? width : 0;
        entry.factoryHeight = height > 8 ? height : 0;
    }

    function finishFactoryApply(entry) {
        closeStyleMenu();
        refreshEntryInPlace(entry);
    }

    function applyCatalogVariant(entry, item, variantIndex) {
        if (!session || !entry || !item) return;
        var seq = (session._factoryApplySeq = (session._factoryApplySeq || 0) + 1);
        fetchPresetFile(item, entry.type).then(function (file) {
            if (!session || seq !== session._factoryApplySeq || !file) return;
            var index = variantIndex;
            if (!file.variants || index < 0 || index >= file.variants.length) index = 0;
            applyFactorySettings(entry, file, index, item);
            finishFactoryApply(entry);
        }).catch(function () { /* leave the menu open when the file cannot load */ });
    }

    function menuMark(current) {
        var mark = document.createElement('i');
        mark.className = current ? 'ph-bold ph-check' : 'awg-style-menu-mark';
        mark.setAttribute('aria-hidden', 'true');
        return mark;
    }

    function subPresetsFor(file) {
        var variants = file && file.variants ? file.variants : [];
        if (variants.length <= 1) return [];
        return variants;
    }

    function placeStyleSubmenu(row, menuEl) {
        var sub = menuEl || (session && session.styleSubmenu);
        if (!sub || !row) return;
        releaseMenuHeight(sub);
        var rect = row.getBoundingClientRect();
        var margin = 8;
        sub.style.left = '0px';
        sub.style.top = '0px';
        var width = sub.offsetWidth;
        var height = sub.offsetHeight;
        var left = rect.right + 6;
        if (left + width > window.innerWidth - margin) left = rect.left - width - 6;
        if (left < margin) left = margin;
        var top = rect.top;
        if (top + height > window.innerHeight - margin) top = window.innerHeight - margin - height;
        if (top < margin) top = margin;
        sub.style.left = Math.round(left) + 'px';
        sub.style.top = Math.round(top) + 'px';
        clampMenuHeight(sub, top);
    }

    function fillStyleSubmenu(sub, entry, item, row, file) {
        sub.innerHTML = '';
        var variants = subPresetsFor(file);
        if (!variants.length) {
            closeStyleSubmenu();
            return;
        }
        appendMenuHead(sub, item && item.name ? item.name : 'Sub-presets');
        for (var i = 0; i < variants.length; i++) {
            (function (index, variant) {
                var current = entry.factoryKind === (item.kind || 'builtin')
                    && entry.factoryPresetId === item.id
                    && String(entry.factoryVariantId) === String(variant.id != null ? variant.id : index);
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'awg-style-menu-item' + (current ? ' is-current' : '');
                btn.setAttribute('role', 'menuitemradio');
                btn.setAttribute('aria-checked', current ? 'true' : 'false');
                var name = document.createElement('span');
                name.textContent = variant.name || ('Sub-preset ' + (index + 1));
                btn.appendChild(menuMark(current));
                btn.appendChild(name);
                btn.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    applyCatalogVariant(entry, item, index);
                });
                sub.appendChild(btn);
            })(i, variants[i]);
        }
        placeStyleSubmenu(row);
    }

    function openStyleSubmenu(entry, item, row) {
        if (!session || !entry || !item || !row) return;
        clearStyleSubTimer();
        if (session.styleSubItem === item && session.styleSubmenu) {
            placeStyleSubmenu(row);
            return;
        }
        closeStyleSubmenu();
        session.styleSubItem = item;
        row.classList.add('is-open');
        session.styleSubRow = row;
        var sub = document.createElement('div');
        sub.className = 'awg-style-menu awg-style-submenu';
        sub.setAttribute('role', 'menu');
        var note = document.createElement('div');
        note.className = 'awg-style-menu-note';
        note.textContent = 'Loading...';
        sub.appendChild(note);
        sub.addEventListener('mouseenter', clearStyleSubTimer);
        sub.addEventListener('mouseleave', scheduleCloseStyleSubmenu);
        sub.addEventListener('click', function (event) { event.stopPropagation(); });
        sub.addEventListener('mousedown', function (event) { event.stopPropagation(); });
        document.body.appendChild(sub);
        session.styleSubmenu = sub;
        placeStyleSubmenu(row);
        var token = (session._styleSubToken = (session._styleSubToken || 0) + 1);
        fetchPresetFile(item, entry.type).then(function (file) {
            if (!session || session._styleSubToken !== token || session.styleSubmenu !== sub || session.styleSubItem !== item) return;
            if (!subPresetsFor(file).length) {
                closeStyleSubmenu();
                return;
            }
            fillStyleSubmenu(sub, entry, item, row, file);
        }).catch(function () {
            if (!session || session.styleSubmenu !== sub) return;
            sub.innerHTML = '';
            var fail = document.createElement('div');
            fail.className = 'awg-style-menu-note';
            fail.textContent = 'Could not load this template';
            sub.appendChild(fail);
            placeStyleSubmenu(row);
        });
    }

    function appendTemplateRow(menu, entry, item) {
        var hasSubs = item.variantCount > 1;
        var current = entry.factoryKind === (item.kind || 'builtin') && entry.factoryPresetId === item.id;
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'awg-style-menu-item' + (current ? ' is-current' : '');
        row.setAttribute('role', hasSubs ? 'menuitem' : 'menuitemradio');
        row.setAttribute('aria-haspopup', hasSubs ? 'menu' : 'false');
        row.setAttribute('aria-checked', (!hasSubs && current) ? 'true' : 'false');
        var name = document.createElement('span');
        name.textContent = item.name || 'Template';
        row.appendChild(menuMark(current));
        row.appendChild(name);
        if (hasSubs) {
            var caret = document.createElement('i');
            caret.className = 'ph-bold ph-caret-right awg-style-menu-caret';
            caret.setAttribute('aria-hidden', 'true');
            row.appendChild(caret);
        }
        row.addEventListener('mouseenter', function () {
            if (hasSubs) openStyleSubmenu(entry, item, row);
            else closeStyleSubmenu();
        });
        row.addEventListener('mouseleave', function () {
            if (hasSubs) scheduleCloseStyleSubmenu();
        });
        row.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (hasSubs) {
                openStyleSubmenu(entry, item, row);
                return;
            }
            applyCatalogVariant(entry, item, 0);
        });
        menu.appendChild(row);
    }

    function appendLookFallback(menu, entry) {
        var presets = entry.presets || [];
        if (!presets.length) {
            var note = document.createElement('div');
            note.className = 'awg-style-menu-note';
            note.textContent = 'No templates for this widget';
            menu.appendChild(note);
            return;
        }
        var choiceIndex = entry.choiceIndex || 0;
        for (var p = 0; p < presets.length; p++) {
            (function (presetIndex, preset) {
                var current = !entry.factoryPresetName && entry.presetIndex === presetIndex;
                var row = document.createElement('button');
                row.type = 'button';
                row.className = 'awg-style-menu-item' + (current ? ' is-current' : '');
                row.setAttribute('role', 'menuitemradio');
                row.setAttribute('aria-checked', current ? 'true' : 'false');
                var name = document.createElement('span');
                name.textContent = preset.label || 'Preset';
                row.appendChild(menuMark(current));
                row.appendChild(name);
                row.addEventListener('mouseenter', scheduleCloseStyleSubmenu);
                row.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeStyleMenu();
                    if (!current) selectStyle(entry, choiceIndex, presetIndex);
                });
                menu.appendChild(row);
            })(p, presets[p]);
        }
    }

    function renderStyleMenu(menu, entry, anchor, catalog) {
        menu.innerHTML = '';
        var builtin = catalog && catalog.builtin ? catalog.builtin : [];
        var user = catalog && catalog.user ? catalog.user : [];
        if (!builtin.length && !user.length) {
            appendMenuHead(menu, 'Templates');
            appendLookFallback(menu, entry);
            placeStyleMenu(anchor);
            return;
        }
        if (user.length) {
            appendMenuHead(menu, 'My Presets');
            for (var u = 0; u < user.length; u++) appendTemplateRow(menu, entry, user[u]);
        }
        if (builtin.length) {
            appendMenuHead(menu, 'Templates');
            for (var b = 0; b < builtin.length; b++) appendTemplateRow(menu, entry, builtin[b]);
        }
        placeStyleMenu(anchor);
    }

    function appendMenuHead(menu, text) {
        var head = document.createElement('div');
        head.className = 'awg-style-menu-head';
        head.textContent = text;
        menu.appendChild(head);
    }

    function openStyleMenu(entry, anchor) {
        if (!session || !entry || !anchor) return;
        closeDefaultsMenu();
        closeStyleMenu();
        var token = (session._styleMenuToken = (session._styleMenuToken || 0) + 1);
        var menu = document.createElement('div');
        menu.className = 'awg-style-menu';
        menu.setAttribute('role', 'menu');
        menu.addEventListener('click', function (event) { event.stopPropagation(); });
        menu.addEventListener('mousedown', function (event) { event.stopPropagation(); });
        menu.addEventListener('scroll', function () { closeStyleSubmenu(); });
        appendMenuHead(menu, 'Templates');
        var loading = document.createElement('div');
        loading.className = 'awg-style-menu-note';
        loading.textContent = 'Loading...';
        menu.appendChild(loading);
        document.body.appendChild(menu);
        session.styleMenu = menu;
        session.styleMenuEntry = entry;
        if (entry.card) entry.card.classList.add('is-style-open');
        if (entry.styleBtn) entry.styleBtn.setAttribute('aria-expanded', 'true');
        placeStyleMenu(anchor);
        loadTemplateCatalog(entry.type).then(function (catalog) {
            if (!session || session._styleMenuToken !== token || session.styleMenu !== menu) return;
            renderStyleMenu(menu, entry, anchor, catalog);
        });
    }

    function toggleStyleMenu(entry, anchor) {
        if (session && session.styleMenuEntry === entry) {
            closeStyleMenu();
            return;
        }
        openStyleMenu(entry, anchor);
    }

    function onStyleMenuPointer(event) {
        if (!session) return;
        var target = event.target;
        if (session.styleMenu) {
            var insideStyle = session.styleMenu.contains(target) ||
                (session.styleSubmenu && session.styleSubmenu.contains(target)) ||
                (session.styleMenuEntry && session.styleMenuEntry.styleBtn && session.styleMenuEntry.styleBtn.contains(target));
            if (!insideStyle) closeStyleMenu();
        }
        if (session.defaultsMenu) {
            var insideDefaults = session.defaultsMenu.contains(target) ||
                (session.defaultsSubmenu && session.defaultsSubmenu.contains(target)) ||
                (session.defaultsVariantMenu && session.defaultsVariantMenu.contains(target)) ||
                (session.defaultsBtn && session.defaultsBtn.contains(target));
            if (!insideDefaults) closeDefaultsMenu();
        }
    }

    function onStyleMenuKey(event) {
        if (!session || event.key !== 'Escape') return;
        if (!session.styleMenu && !session.defaultsMenu) return;
        event.preventDefault();
        var btn = session.styleMenuEntry && session.styleMenuEntry.styleBtn;
        var defaultsBtn = session.defaultsBtn;
        var defaultsWasOpen = !!session.defaultsMenu;
        closeStyleMenu();
        closeDefaultsMenu();
        if (defaultsWasOpen && defaultsBtn && typeof defaultsBtn.focus === 'function') defaultsBtn.focus();
        else if (btn && typeof btn.focus === 'function') btn.focus();
    }

    function onStyleMenuReflow() {
        closeStyleMenu();
        closeDefaultsMenu();
    }

    function bindStyleMenuListeners() {
        if (!session) return;
        if (!session._styleMenuBound) {
            session._styleMenuBound = true;
            session._styleMenuPointer = onStyleMenuPointer;
            session._styleMenuKey = onStyleMenuKey;
            session._styleMenuReflow = onStyleMenuReflow;
            document.addEventListener('mousedown', session._styleMenuPointer, true);
            document.addEventListener('keydown', session._styleMenuKey);
            window.addEventListener('resize', session._styleMenuReflow);
        }
        if (session.grid && session._styleMenuReflow) {
            session.grid.removeEventListener('scroll', session._styleMenuReflow);
            session.grid.addEventListener('scroll', session._styleMenuReflow);
        }
    }

    function unbindStyleMenuListeners() {
        if (!session || !session._styleMenuBound) return;
        document.removeEventListener('mousedown', session._styleMenuPointer, true);
        document.removeEventListener('keydown', session._styleMenuKey);
        window.removeEventListener('resize', session._styleMenuReflow);
        if (session.grid && session._styleMenuReflow) session.grid.removeEventListener('scroll', session._styleMenuReflow);
        session._styleMenuBound = false;
    }

    function galleryTypes() {
        var seen = Object.create(null);
        var list = [];
        var entries = session && session.entries ? session.entries : [];
        for (var i = 0; i < entries.length; i++) {
            var type = entries[i].type;
            if (!type || seen[type]) continue;
            seen[type] = true;
            list.push(type);
        }
        list.sort(function (a, b) {
            var la = TYPE_LABELS[a] || a;
            var lb = TYPE_LABELS[b] || b;
            if (la < lb) return -1;
            if (la > lb) return 1;
            return 0;
        });
        return list;
    }

    function typeDefaultIs(type, item, variantIndex) {
        var stored = session && session.typeDefaults ? session.typeDefaults[type] : null;
        if (!stored || !item) return false;
        if (String(stored.presetId) !== String(item.id || '')) return false;
        if ((stored.kind || 'builtin') !== (item.kind || 'builtin')) return false;
        if (variantIndex == null) return !(item.variantCount > 1);
        return stored.variantIndex === variantIndex;
    }

    function applyStoredTypeDefault(entry) {
        if (!session || !session.typeDefaults || !entry) return;
        var stored = session.typeDefaults[entry.type];
        if (!stored || !stored.file || !stored.item) return;
        applyFactorySettings(entry, stored.file, stored.variantIndex, stored.item);
    }

    function applyTypeDefault(type, file, variantIndex, item) {
        if (!session || !type || !file || !item) return;
        if (!session.typeDefaults) session.typeDefaults = Object.create(null);
        var index = variantIndex;
        if (!file.variants || index < 0 || index >= file.variants.length) index = 0;
        session.typeDefaults[type] = {
            presetId: String(item.id || ''),
            kind: item.kind || 'builtin',
            variantIndex: index,
            file: file,
            item: item
        };
        var entries = session.entries || [];
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].type !== type) continue;
            applyFactorySettings(entries[i], file, index, item);
            refreshEntryInPlace(entries[i]);
        }
    }

    function resetTypeDefaults() {
        if (!session) return;
        session.typeDefaults = Object.create(null);
        var entries = session.entries || [];
        for (var i = 0; i < entries.length; i++) {
            restoreOriginalLook(entries[i]);
            refreshEntryInPlace(entries[i]);
        }
    }

    function chooseTypeDefault(type, item, variantIndex) {
        if (!session || !item) return;
        var seq = (session._defaultsApplySeq = (session._defaultsApplySeq || 0) + 1);
        fetchPresetFile(item, type).then(function (file) {
            if (!session || seq !== session._defaultsApplySeq || !file) return;
            applyTypeDefault(type, file, variantIndex, item);
        });
    }

    function closeDefaultsVariantMenu() {
        if (!session) return;
        if (session._defaultsVariantTimer) {
            clearTimeout(session._defaultsVariantTimer);
            session._defaultsVariantTimer = null;
        }
        session._defaultsVariantToken = (session._defaultsVariantToken || 0) + 1;
        if (session.defaultsVariantRow) session.defaultsVariantRow.classList.remove('is-open');
        if (session.defaultsVariantMenu && session.defaultsVariantMenu.parentNode) {
            session.defaultsVariantMenu.parentNode.removeChild(session.defaultsVariantMenu);
        }
        session.defaultsVariantMenu = null;
        session.defaultsVariantRow = null;
        session.defaultsVariantItem = null;
    }

    function closeDefaultsPresetMenu() {
        if (!session) return;
        closeDefaultsVariantMenu();
        if (session._defaultsPresetTimer) {
            clearTimeout(session._defaultsPresetTimer);
            session._defaultsPresetTimer = null;
        }
        session._defaultsPresetToken = (session._defaultsPresetToken || 0) + 1;
        if (session.defaultsPresetRow) session.defaultsPresetRow.classList.remove('is-open');
        if (session.defaultsSubmenu && session.defaultsSubmenu.parentNode) {
            session.defaultsSubmenu.parentNode.removeChild(session.defaultsSubmenu);
        }
        session.defaultsSubmenu = null;
        session.defaultsSubmenuType = null;
        session.defaultsPresetRow = null;
    }

    function closeDefaultsMenu() {
        if (!session) return;
        closeDefaultsPresetMenu();
        if (session.defaultsMenu && session.defaultsMenu.parentNode) {
            session.defaultsMenu.parentNode.removeChild(session.defaultsMenu);
        }
        session.defaultsMenu = null;
        session.defaultsAnchor = null;
        if (session.defaultsBtn) session.defaultsBtn.setAttribute('aria-expanded', 'false');
    }

    function scheduleCloseDefaultsVariant() {
        if (!session) return;
        if (session._defaultsVariantTimer) clearTimeout(session._defaultsVariantTimer);
        session._defaultsVariantTimer = setTimeout(function () {
            closeDefaultsVariantMenu();
        }, 180);
    }

    function placeDropdownMenu(menu, anchor) {
        if (!menu || !anchor) return;
        releaseMenuHeight(menu);
        var rect = anchor.getBoundingClientRect();
        var margin = 8;
        menu.style.left = '0px';
        menu.style.top = '0px';
        var width = menu.offsetWidth;
        var height = menu.offsetHeight;
        var left = rect.left;
        if (left + width > window.innerWidth - margin) left = window.innerWidth - margin - width;
        if (left < margin) left = margin;
        var top = rect.bottom + 6;
        if (top + height > window.innerHeight - margin) top = rect.top - height - 6;
        if (top < margin) top = margin;
        menu.style.left = Math.round(left) + 'px';
        menu.style.top = Math.round(top) + 'px';
        clampMenuHeight(menu, top);
    }

    function appendDefaultsNote(menu, text) {
        var note = document.createElement('div');
        note.className = 'awg-style-menu-note';
        note.textContent = text;
        menu.appendChild(note);
    }

    function fillDefaultsVariantMenu(sub, type, item, row, file) {
        sub.innerHTML = '';
        var variants = subPresetsFor(file);
        if (!variants.length) {
            closeDefaultsVariantMenu();
            return;
        }
        appendMenuHead(sub, item && item.name ? item.name : 'Sub-presets');
        for (var i = 0; i < variants.length; i++) {
            (function (index, variant) {
                var current = typeDefaultIs(type, item, index);
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'awg-style-menu-item' + (current ? ' is-current' : '');
                btn.setAttribute('role', 'menuitemradio');
                btn.setAttribute('aria-checked', current ? 'true' : 'false');
                var name = document.createElement('span');
                name.textContent = variant.name || ('Preset ' + (index + 1));
                btn.appendChild(menuMark(current));
                btn.appendChild(name);
                btn.addEventListener('mouseenter', function () {
                    if (session && session._defaultsVariantTimer) {
                        clearTimeout(session._defaultsVariantTimer);
                        session._defaultsVariantTimer = null;
                    }
                });
                btn.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeDefaultsMenu();
                    chooseTypeDefault(type, item, index);
                });
                sub.appendChild(btn);
            })(i, variants[i]);
        }
        placeStyleSubmenu(row, sub);
    }

    function openDefaultsVariantMenu(type, item, row) {
        if (!session || !item || !row) return;
        if (session._defaultsVariantTimer) {
            clearTimeout(session._defaultsVariantTimer);
            session._defaultsVariantTimer = null;
        }
        if (session.defaultsVariantItem === item && session.defaultsVariantMenu) {
            placeStyleSubmenu(row, session.defaultsVariantMenu);
            return;
        }
        closeDefaultsVariantMenu();
        session.defaultsVariantItem = item;
        row.classList.add('is-open');
        session.defaultsVariantRow = row;
        var sub = document.createElement('div');
        sub.className = 'awg-style-menu awg-style-submenu';
        sub.setAttribute('role', 'menu');
        appendDefaultsNote(sub, 'Loading...');
        sub.addEventListener('mouseenter', function () {
            if (session && session._defaultsVariantTimer) {
                clearTimeout(session._defaultsVariantTimer);
                session._defaultsVariantTimer = null;
            }
        });
        sub.addEventListener('mouseleave', scheduleCloseDefaultsVariant);
        sub.addEventListener('mousedown', function (event) { event.stopPropagation(); });
        document.body.appendChild(sub);
        session.defaultsVariantMenu = sub;
        placeStyleSubmenu(row, sub);
        var token = session._defaultsVariantToken;
        fetchPresetFile(item, type).then(function (file) {
            if (!session || session._defaultsVariantToken !== token || session.defaultsVariantMenu !== sub || session.defaultsVariantItem !== item) return;
            if (!subPresetsFor(file).length) {
                closeDefaultsVariantMenu();
                return;
            }
            fillDefaultsVariantMenu(sub, type, item, row, file);
        }).catch(function () {
            if (!session || session.defaultsVariantMenu !== sub) return;
            sub.innerHTML = '';
            appendDefaultsNote(sub, 'Could not load this template');
            placeStyleSubmenu(row, sub);
        });
    }

    function appendDefaultsPresetRow(menu, type, item) {
        var hasSubs = item.variantCount > 1;
        var stored = session && session.typeDefaults ? session.typeDefaults[type] : null;
        var branch = !!(stored && String(stored.presetId) === String(item.id || '') && (stored.kind || 'builtin') === (item.kind || 'builtin'));
        var current = hasSubs ? branch : typeDefaultIs(type, item, null);
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'awg-style-menu-item' + (current ? ' is-current' : '');
        row.setAttribute('role', hasSubs ? 'menuitem' : 'menuitemradio');
        row.setAttribute('aria-haspopup', hasSubs ? 'menu' : 'false');
        row.setAttribute('aria-checked', (!hasSubs && current) ? 'true' : 'false');
        var name = document.createElement('span');
        name.textContent = item.name || 'Template';
        row.appendChild(menuMark(current));
        row.appendChild(name);
        if (hasSubs) {
            var caret = document.createElement('i');
            caret.className = 'ph-bold ph-caret-right awg-style-menu-caret';
            caret.setAttribute('aria-hidden', 'true');
            row.appendChild(caret);
        }
        row.addEventListener('mouseenter', function () {
            if (hasSubs) openDefaultsVariantMenu(type, item, row);
            else closeDefaultsVariantMenu();
        });
        row.addEventListener('mouseleave', function () {
            if (hasSubs) scheduleCloseDefaultsVariant();
        });
        row.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (hasSubs) {
                openDefaultsVariantMenu(type, item, row);
                return;
            }
            closeDefaultsMenu();
            chooseTypeDefault(type, item, 0);
        });
        menu.appendChild(row);
    }

    function fillDefaultsPresetMenu(menu, type, catalog, row) {
        menu.innerHTML = '';
        var builtin = catalog && catalog.builtin ? catalog.builtin : [];
        var user = catalog && catalog.user ? catalog.user : [];
        if (!builtin.length && !user.length) {
            appendDefaultsNote(menu, 'No templates');
            placeStyleSubmenu(row, menu);
            return;
        }
        if (user.length) {
            appendMenuHead(menu, 'My Presets');
            for (var u = 0; u < user.length; u++) appendDefaultsPresetRow(menu, type, user[u]);
        }
        if (builtin.length) {
            appendMenuHead(menu, 'Templates');
            for (var b = 0; b < builtin.length; b++) appendDefaultsPresetRow(menu, type, builtin[b]);
        }
        placeStyleSubmenu(row, menu);
    }

    function openDefaultsPresetMenu(row, type) {
        if (!session || !row) return;
        if (session.defaultsSubmenu && session.defaultsSubmenuType === type) {
            placeStyleSubmenu(row, session.defaultsSubmenu);
            return;
        }
        closeDefaultsPresetMenu();
        row.classList.add('is-open');
        session.defaultsPresetRow = row;
        var submenu = document.createElement('div');
        submenu.className = 'awg-style-menu awg-style-submenu';
        submenu.setAttribute('role', 'menu');
        appendDefaultsNote(submenu, 'Loading...');
        submenu.addEventListener('mouseenter', function () {
            if (session && session._defaultsPresetTimer) {
                clearTimeout(session._defaultsPresetTimer);
                session._defaultsPresetTimer = null;
            }
        });
        submenu.addEventListener('mousedown', function (event) { event.stopPropagation(); });
        document.body.appendChild(submenu);
        session.defaultsSubmenu = submenu;
        session.defaultsSubmenuType = type;
        placeStyleSubmenu(row, submenu);
        var token = session._defaultsPresetToken;
        loadTemplateCatalog(type).then(function (catalog) {
            if (!session || session._defaultsPresetToken !== token || session.defaultsSubmenu !== submenu) return;
            fillDefaultsPresetMenu(submenu, type, catalog, row);
        });
    }

    function appendDefaultsTypeRow(menu, type) {
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'awg-style-menu-item has-submenu';
        row.setAttribute('role', 'menuitem');
        row.setAttribute('aria-haspopup', 'menu');
        var name = document.createElement('span');
        name.textContent = TYPE_LABELS[type] || type;
        row.appendChild(name);
        var caret = document.createElement('i');
        caret.className = 'ph-bold ph-caret-right awg-style-menu-caret';
        caret.setAttribute('aria-hidden', 'true');
        row.appendChild(caret);
        row.addEventListener('mouseenter', function () {
            openDefaultsPresetMenu(row, type);
        });
        row.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            openDefaultsPresetMenu(row, type);
        });
        menu.appendChild(row);
    }

    function openDefaultsMenu(anchor) {
        if (!session || !anchor) return;
        closeStyleMenu();
        closeDefaultsMenu();
        var menu = document.createElement('div');
        menu.className = 'awg-style-menu';
        menu.setAttribute('role', 'menu');
        menu.addEventListener('mousedown', function (event) { event.stopPropagation(); });
        var resetRow = document.createElement('button');
        resetRow.type = 'button';
        resetRow.className = 'awg-style-menu-item';
        resetRow.setAttribute('role', 'menuitem');
        var resetName = document.createElement('span');
        resetName.textContent = 'Reset to Default';
        resetRow.appendChild(resetName);
        resetRow.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            closeDefaultsMenu();
            resetTypeDefaults();
        });
        menu.appendChild(resetRow);
        appendDefaultsNote(menu, 'Loading...');
        document.body.appendChild(menu);
        session.defaultsMenu = menu;
        session.defaultsAnchor = anchor;
        anchor.setAttribute('aria-expanded', 'true');
        placeDropdownMenu(menu, anchor);
        var types = galleryTypes();
        var listToken = (session._defaultsListToken = (session._defaultsListToken || 0) + 1);
        Promise.all(types.map(function (type) {
            return loadTemplateCatalog(type).then(function (catalog) {
                var builtin = catalog && catalog.builtin ? catalog.builtin.length : 0;
                var user = catalog && catalog.user ? catalog.user.length : 0;
                return (builtin + user) > 0 ? type : '';
            });
        })).then(function (flags) {
            if (!session || session.defaultsMenu !== menu || session._defaultsListToken !== listToken) return;
            menu.innerHTML = '';
            menu.appendChild(resetRow);
            var ready = [];
            for (var i = 0; i < flags.length; i++) if (flags[i]) ready.push(flags[i]);
            if (ready.length) appendMenuHead(menu, 'Widgets');
            else appendDefaultsNote(menu, 'No presets for these widgets');
            for (var j = 0; j < ready.length; j++) appendDefaultsTypeRow(menu, ready[j]);
            placeDropdownMenu(menu, anchor);
        });
    }

    function toggleDefaultsMenu(anchor) {
        if (session && session.defaultsMenu && session.defaultsAnchor === anchor) {
            closeDefaultsMenu();
            return;
        }
        openDefaultsMenu(anchor);
    }

    function setSelected(entry, selected) {
        if (!session || !session.selected || !entry) return;
        if (selected) session.selected.add(entry.id);
        else session.selected.delete(entry.id);
        paintSelection(entry);
        notifyCount();
    }

    function convertType(entry, choiceId) {
        var choices = entry && entry.choices ? entry.choices : [];
        for (var i = 0; i < choices.length; i++) {
            if (choices[i].id !== choiceId) continue;
            entry.choiceIndex = i;
            entry.presets = choices[i].presets;
            entry.presetIndex = 0;
            applyPreset(entry);
            unmountPreview(entry);
            paintCard(entry);
            if (entry.card && !entry.card.hidden) mountPreview(entry);
            refreshTypeFilterOptions();
            return;
        }
    }

    function selectAllVisible() {
        var list = session.visible || [];
        for (var i = 0; i < list.length; i++) session.selected.add(list[i].id);
        session.entries.forEach(paintSelection);
        notifyCount();
    }

    function clearSelection() {
        session.selected.clear();
        session.anchorIndex = -1;
        session.entries.forEach(paintSelection);
        notifyCount();
    }

    function buildChrome() {
        var shell = document.createElement('div');
        shell.className = 'awg-shell';

        var toolbar = document.createElement('div');
        toolbar.className = 'awg-toolbar';

        var search = document.createElement('input');
        search.type = 'search';
        search.className = 'control-input awg-search';
        search.placeholder = 'Search topics, names, values, or tokens (e.g. living temp, type:gauge, -alarm)';
        search.value = session.query || '';
        search.addEventListener('input', function () {
            session.query = String(search.value || '').trim().toLowerCase();
            layoutCards();
        });

        var typeFilter = document.createElement('select');
        typeFilter.className = 'control-input awg-filter-select';
        typeFilter.title = 'Filter by Widget Type';
        typeFilter.addEventListener('change', function () {
            session.typeFilter = typeFilter.value;
            layoutCards();
        });
        session.typeFilterEl = typeFilter;

        var accessFilter = document.createElement('select');
        accessFilter.className = 'control-input awg-filter-select';
        accessFilter.title = 'Filter by Access Mode';
        [
            ['all', 'All Access Modes'],
            ['writable', 'Controllable (RW / W / L)'],
            ['readonly', 'Read-Only Sensors (R)'],
            ['RW', 'Read & Write (RW)'],
            ['W', 'Write-Only Triggers (W)'],
            ['L', 'Local Topics (L)']
        ].forEach(function (pair) {
            var opt = document.createElement('option');
            opt.value = pair[0];
            opt.textContent = pair[1];
            accessFilter.appendChild(opt);
        });
        accessFilter.value = session.accessFilter || 'all';
        accessFilter.addEventListener('change', function () {
            session.accessFilter = accessFilter.value;
            layoutCards();
        });

        var sourceFilter = document.createElement('select');
        sourceFilter.className = 'control-input awg-filter-select';
        sourceFilter.title = 'Filter by Source Category';
        [
            ['all', 'All Sources'],
            ['device', 'Devices & Capabilities'],
            ['variable', 'Variables'],
            ['automation', 'Flows & Moods'],
            ['insight', 'Insights & Logs'],
            ['local', 'Local Loopback']
        ].forEach(function (pair) {
            var opt = document.createElement('option');
            opt.value = pair[0];
            opt.textContent = pair[1];
            sourceFilter.appendChild(opt);
        });
        sourceFilter.value = session.sourceFilter || 'all';
        sourceFilter.addEventListener('change', function () {
            session.sourceFilter = sourceFilter.value;
            layoutCards();
        });

        var hideLabel = document.createElement('label');
        hideLabel.className = 'ds-checkbox-row awg-unused-toggle';
        var hideInput = document.createElement('input');
        hideInput.type = 'checkbox';
        hideInput.className = 'ds-checkbox';
        hideInput.checked = !!session.hideUsed;
        hideInput.addEventListener('change', function () {
            session.hideUsed = !!hideInput.checked;
            hideLabel.classList.toggle('is-checked', !!hideInput.checked);
            if (session.mode !== 'wizard') prefHideUsed = session.hideUsed;
            session.entries.forEach(paintCard);
            layoutCards();
        });
        hideLabel.classList.toggle('is-checked', !!hideInput.checked);
        var hideText = document.createElement('span');
        hideText.className = 'ds-checkbox-row__status';
        hideText.textContent = 'Only show unused topics';
        hideLabel.appendChild(hideInput);
        hideLabel.appendChild(hideText);

        var sort = document.createElement('select');
        sort.className = 'control-input awg-sort';
        [
            ['activity', 'Live Activity (Recently Updated)'],
            ['name', 'Topic / Device Name (A-Z)'],
            ['type', 'Widget Type'],
            ['access', 'Access Mode (Writable First)']
        ].forEach(function (pair) {
            var option = document.createElement('option');
            option.value = pair[0];
            option.textContent = pair[1];
            sort.appendChild(option);
        });
        sort.value = session.sortKey || 'activity';
        sort.addEventListener('change', function () {
            session.sortKey = sort.value;
            layoutCards();
        });

        var row1 = document.createElement('div');
        row1.className = 'awg-toolbar-row';
        row1.appendChild(search);
        row1.appendChild(typeFilter);
        row1.appendChild(accessFilter);
        row1.appendChild(sourceFilter);

        var selectAll = document.createElement('button');
        selectAll.type = 'button';
        selectAll.className = 'btn-tool ds-dialog-button';
        selectAll.textContent = 'Select All Visible';
        selectAll.addEventListener('click', selectAllVisible);

        var clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'btn-tool ds-dialog-button';
        clearBtn.textContent = 'Clear Selection';
        clearBtn.addEventListener('click', clearSelection);

        var countEl = document.createElement('span');
        countEl.className = 'awg-count';
        session.countEl = countEl;

        var refreshBtn = document.createElement('button');
        refreshBtn.type = 'button';
        refreshBtn.className = 'btn-tool ds-dialog-button';
        refreshBtn.innerHTML = '<i class="ph-bold ph-arrows-clockwise"></i><span>Refresh Values</span>';
        refreshBtn.title = 'Ask Homey to send the last known value for every topic again.';
        var driverNow = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        refreshBtn.hidden = !(driverNow && typeof driverNow.requestStateSync === 'function');
        refreshBtn.addEventListener('click', function () {
            requestLatestValues();
        });
        session.refreshBtn = refreshBtn;

        var defaultsBtn = document.createElement('button');
        defaultsBtn.type = 'button';
        defaultsBtn.className = 'control-input awg-defaults-btn';
        defaultsBtn.innerHTML = '<span>Default Widget Presets</span><i class="ph-bold ph-caret-down" aria-hidden="true"></i>';
        defaultsBtn.title = 'Apply one template to every thumbnail of a widget type. This lasts until the editor reloads.';
        defaultsBtn.setAttribute('aria-haspopup', 'menu');
        defaultsBtn.setAttribute('aria-expanded', 'false');
        defaultsBtn.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            toggleDefaultsMenu(defaultsBtn);
        });
        session.defaultsBtn = defaultsBtn;

        var row2 = document.createElement('div');
        row2.className = 'awg-toolbar-row';
        row2.appendChild(defaultsBtn);
        row2.appendChild(sort);
        if (session.mode !== 'wizard') row2.appendChild(hideLabel);
        row2.appendChild(refreshBtn);
        row2.appendChild(selectAll);
        row2.appendChild(clearBtn);
        row2.appendChild(countEl);

        toolbar.appendChild(row1);
        toolbar.appendChild(row2);

        var grid = document.createElement('div');
        grid.className = 'awg-masonry-grid';
        var empty = document.createElement('div');
        empty.className = 'awg-empty';
        empty.textContent = 'No live topics match this view yet. Values appear here as the data driver receives them.';
        grid.appendChild(empty);
        session.emptyEl = empty;

        shell.appendChild(toolbar);
        shell.appendChild(grid);
        return shell;
    }

    function rememberTopics(entries) {
        session.known = Object.create(null);
        session.byTopic = Object.create(null);
        session.byId = Object.create(null);
        entries.forEach(indexEntry);
    }

    function startSession(host, options) {
        options = options || {};
        var classified = classifyAll();
        session = {
            mode: options.mode || 'dialog',
            hideUsed: options.hideUsed !== undefined ? !!options.hideUsed : (options.mode === 'wizard' ? false : prefHideUsed),
            sortKey: 'activity',
            typeDefaults: Object.create(null),
            query: '',
            typeFilter: 'all',
            accessFilter: 'all',
            sourceFilter: 'all',
            entries: classified.entries,
            consumed: classified.consumed,
            selected: new Set(),
            used: options.mode === 'wizard' ? Object.create(null) : collectUsedTopics(),
            onCount: options.onCount || null,
            anchorIndex: -1,
            visible: [],
            known: Object.create(null),
            byTopic: Object.create(null),
            byId: Object.create(null)
        };
        rememberTopics(session.entries);
        installHook();
        attachShell(host);
    }

    function attachShell(host) {
        if (!session || !host) return;
        host.innerHTML = '';
        host.classList.add('awg-host');
        var shell = buildChrome();
        host.appendChild(shell);
        session.host = host;
        session.shell = shell;
        session.grid = shell.querySelector('.awg-masonry-grid');
        paintGalleryBackdrop();
        session.entries.forEach(function (entry) { buildCard(entry); });
        layoutCards();
        bindObserver();
        bindPreviewResizeObserver();
        bindStyleMenuListeners();
        notifyCount();
    }

    function samePayload(a, b) {
        return a === b;
    }

    function attachLightRow(topic, meta) {
        if (!session) return;
        if (!session.consumed) session.consumed = Object.create(null);
        session.consumed[topic] = true;
        if (isLightStateTopic(topic, meta)) {
            var deviceKey = String(topic).replace(/\/light_state_json$/i, '');
            session.consumed[deviceKey + '/dim'] = true;
        }
        var grid = null;
        for (var i = 0; i < session.entries.length; i++) {
            if (session.entries[i].type === 'lightgrid') {
                grid = session.entries[i];
                break;
            }
        }
        if (!grid) {
            var built = buildLightGrids([topic]);
            if (!built.grids.length) return;
            grid = built.grids[0];
            Object.keys(built.consumed).forEach(function (key) { session.consumed[key] = true; });
            session.entries.push(grid);
            indexEntry(grid);
            if (session.grid) buildCard(grid);
            appendNewCards([grid]);
            if (session.observer && grid.card) session.observer.observe(grid.card);
            return;
        }
        var row = {
            name: deviceLabel(topic) || friendlyName(topic, meta),
            outputMode: 'light',
            topics: [topic]
        };
        if (!grid.overrides) grid.overrides = {};
        if (!Array.isArray(grid.overrides.lightsData)) grid.overrides.lightsData = [];
        grid.overrides.lightsData.push(row);
        if (!grid.topics) grid.topics = [];
        if (grid.topics.indexOf(topic) < 0) grid.topics.push(topic);
        if (!session.byTopic[topic]) session.byTopic[topic] = [];
        if (session.byTopic[topic].indexOf(grid) < 0) session.byTopic[topic].push(grid);
        unmountPreview(grid);
        if (grid.card && !grid.card.hidden) mountPreview(grid);
    }

    // Homey also publishes the bare event name beside homey/event/<name>. That alias is the same value.
    function transportTopicPresent(topic) {
        if (session && session.known && session.known[topic]) return true;
        if (typeof Dashboard !== 'undefined' && Dashboard.liveData &&
            Object.prototype.hasOwnProperty.call(Dashboard.liveData, topic)) return true;
        if (typeof Dashboard !== 'undefined' && Dashboard.topicMeta && Dashboard.topicMeta[topic]) return true;
        var driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        if (driver && driver.seenTopics && typeof driver.seenTopics.has === 'function' && driver.seenTopics.has(topic)) {
            return true;
        }
        return false;
    }

    function isShadowedTransportAlias(topic) {
        var text = String(topic || '');
        if (!text || text.indexOf('/') !== -1) return false;
        return transportTopicPresent('homey/event/' + text) || transportTopicPresent('homey/insight/' + text);
    }

    function considerNewTopic(topic, payload) {
        if (!session || session.known[topic]) return;
        if (isShadowedTransportAlias(topic)) {
            session.known[topic] = true;
            return;
        }
        var meta = topicMeta(topic);
        var value = coercePayload(payload);
        if (isLightStateTopic(topic, meta) || isLightStateObject(value)) {
            session.known[topic] = true;
            attachLightRow(topic, meta);
            return;
        }
        session.known[topic] = true;
        if (session.consumed && session.consumed[topic]) return;
        var made = classifyTopic(topic, payload, meta, session.consumed || {});
        if (!made.length) return;
        for (var i = 0; i < made.length; i++) {
            applyStoredTypeDefault(made[i]);
            session.entries.push(made[i]);
            indexEntry(made[i]);
            if (session.grid) buildCard(made[i]);
        }
        appendNewCards(made);
        if (session.observer) {
            made.forEach(function (entry) {
                if (entry.card) session.observer.observe(entry.card);
            });
        }
    }

    function onLive(topic, payload) {
        if (!session || topic == null || topic === '') return;
        if (!session.known[topic]) {
            considerNewTopic(topic, payload);
            return;
        }
        var list = session.byTopic[topic];
        if (!list || !list.length) return;
        var now = Date.now();
        for (var i = 0; i < list.length; i++) {
            var entry = list[i];
            var unchanged = samePayload(entry._lastPayload, payload);
            entry._lastPayload = payload;
            if (!unchanged) {
                entry.updatedAt = now;
                expandSessionRange(entry, payload);
                scheduleRender(entry);
            }
            pulseCard(entry);
        }
    }

    function installHook() {
        if (!session || session._hooked || typeof Dashboard === 'undefined') return;
        session._hooked = true;
        session._prevApply = Dashboard.applyLocalTopicPayload;
        session._prevBatch = Dashboard.applyLocalTopicPayloadBatch;
        session._wrappedApply = function (topic, payload) {
            var result = session._prevApply.apply(Dashboard, arguments);
            onLive(topic, payload);
            return result;
        };
        session._wrappedBatch = function (map) {
            var result = session._prevBatch.apply(Dashboard, arguments);
            if (map && typeof map.forEach === 'function') {
                map.forEach(function (payload, topic) { onLive(topic, payload); });
            }
            return result;
        };
        Dashboard.applyLocalTopicPayload = session._wrappedApply;
        Dashboard.applyLocalTopicPayloadBatch = session._wrappedBatch;
        session._driverType = activeDriverType();
        session._prevInitDriver = Dashboard.initDataDriver;
        session._wrappedInitDriver = function () {
            var before = activeDriverType();
            var result = session._prevInitDriver.apply(Dashboard, arguments);
            if (!session) return result;
            var after = activeDriverType();
            if (after !== before) {
                try {
                    resetSessionForPlatform();
                } catch (err) { /* gallery reset must not block the editor platform switch */ }
            }
            return result;
        };
        Dashboard.initDataDriver = session._wrappedInitDriver;
    }

    function activeDriverType() {
        if (typeof DataDriverRegistry !== 'undefined' && typeof DataDriverRegistry.getType === 'function') {
            var registered = DataDriverRegistry.getType();
            if (registered) return String(registered);
        }
        if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.dataDriver) {
            return String(MASTER_SETTINGS.dataDriver);
        }
        return '';
    }

    function requestLatestValues() {
        var driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        if (driver && typeof driver.requestStateSync === 'function') driver.requestStateSync();
    }

    function syncRefreshButton() {
        if (!session || !session.refreshBtn) return;
        var driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        session.refreshBtn.hidden = !(driver && typeof driver.requestStateSync === 'function');
    }

    function resetSessionForPlatform() {
        if (!session) return;
        closeStyleMenu();
        if (session.observer) {
            session.observer.disconnect();
            session.observer = null;
        }
        unbindPreviewResizeObserver();
        unmountAll();
        session.entries.forEach(function (entry) {
            if (entry.card && entry.card.parentNode) entry.card.parentNode.removeChild(entry.card);
        });
        var classified = classifyAll();
        session.entries = classified.entries;
        session.consumed = classified.consumed;
        session.selected = new Set();
        session.visible = [];
        session.anchorIndex = -1;
        session._driverType = activeDriverType();
        rememberTopics(session.entries);
        if (session.grid) {
            session.entries.forEach(function (entry) { buildCard(entry); });
            layoutCards();
            bindObserver();
            bindPreviewResizeObserver();
        }
        syncRefreshButton();
        notifyCount();
        var dtLower = String(session._driverType).toLowerCase();
        if (dtLower === 'homey' || dtLower === 'homeassistant') requestLatestValues();
    }

    function removeHook() {
        if (!session || !session._hooked || typeof Dashboard === 'undefined') return;
        if (Dashboard.applyLocalTopicPayload === session._wrappedApply && session._prevApply) {
            Dashboard.applyLocalTopicPayload = session._prevApply;
        }
        if (Dashboard.applyLocalTopicPayloadBatch === session._wrappedBatch && session._prevBatch) {
            Dashboard.applyLocalTopicPayloadBatch = session._prevBatch;
        }
        if (Dashboard.initDataDriver === session._wrappedInitDriver && session._prevInitDriver) {
            Dashboard.initDataDriver = session._prevInitDriver;
        }
        session._hooked = false;
    }

    function unmountAll() {
        if (!session) return;
        session.entries.forEach(function (entry) {
            if (entry._pulseTimer) clearTimeout(entry._pulseTimer);
            unmountPreview(entry);
        });
    }

    function destroy() {
        if (!session) return;
        closeStyleMenu();
        closeDefaultsMenu();
        unbindStyleMenuListeners();
        removeHook();
        unbindPreviewResizeObserver();
        unmountAll();
        if (session.observer) session.observer.disconnect();
        if (session.host) {
            session.host.innerHTML = '';
            session.host.classList.remove('awg-host');
        }
        session = null;
    }

    function pause() {
        if (!session || session.mode !== 'wizard') return;
        closeStyleMenu();
        unbindPreviewResizeObserver();
        unmountAll();
        if (session.observer) {
            session.observer.disconnect();
            session.observer = null;
        }
        if (session.shell && session.shell.parentNode) session.shell.parentNode.removeChild(session.shell);
        session.shell = null;
        session.grid = null;
        session.entries.forEach(function (entry) {
            entry.card = null;
            entry.preview = null;
            entry.widget = null;
        });
    }

    function resume(host, options) {
        options = options || {};
        if (session && session.mode === 'wizard' && session.entries) {
            session.onCount = options.onCount || session.onCount;
            if (options.hideUsed !== undefined) session.hideUsed = !!options.hideUsed;
            attachShell(host);
            return;
        }
        destroy();
        if (typeof DialogHost !== 'undefined' && typeof DialogHost.close === 'function') {
            DialogHost.close('auto-widget-gallery');
        }
        startSession(host, {
            mode: 'wizard',
            hideUsed: false,
            onCount: options.onCount || null
        });
    }

    function collectSpecs() {
        if (!session) return [];
        var specs = [];
        session.entries.forEach(function (entry) {
            if (!session.selected.has(entry.id)) return;
            var fitted = previewPixelSize(entry);
            var placeW = fitted.w;
            var placeH = fitted.h;
            var keepSize = !!entry.keepSize;
            if (entry.factoryWidth > 8 && entry.factoryHeight > 8) {
                placeW = entry.factoryWidth;
                placeH = entry.factoryHeight;
                keepSize = false;
            }
            specs.push({
                type: entry.type,
                tile: entry.tile || '1x1',
                name: entry.name,
                keepSize: keepSize,
                placeW: placeW,
                placeH: placeH,
                overrides: cloneData(entry.overrides || {}),
                bindings: cloneData(entry.bindings || {})
            });
        });
        return specs;
    }

    function gridStep() {
        var size = (typeof MASTER_SETTINGS !== 'undefined') ? Number(MASTER_SETTINGS.gridSize) : 10;
        if (!isFinite(size) || size <= 0) size = 10;
        return size;
    }

    function snap(value) {
        var step = gridStep();
        return Math.round(Number(value) / step) * step;
    }

    function widgetOnPage(widget, page) {
        var raw = widget && widget.overrides && widget.overrides.page != null ? widget.overrides.page : 1;
        if (typeof Dashboard.resolveEffectivePageForWidgetId === 'function') {
            raw = Dashboard.resolveEffectivePageForWidgetId(widget.id, raw);
        }
        if (typeof WidgetPageSpec !== 'undefined' && typeof WidgetPageSpec.coversPage === 'function') {
            return WidgetPageSpec.coversPage(raw, page);
        }
        var parts = String(raw).split(',');
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].trim() === String(page)) return true;
        }
        return false;
    }

    function canvasSize() {
        var width = 0;
        var height = 0;
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._canvasDimensionPx === 'function' && typeof MASTER_SETTINGS !== 'undefined') {
            width = Dashboard._canvasDimensionPx(MASTER_SETTINGS.canvasWidth);
            height = Dashboard._canvasDimensionPx(MASTER_SETTINGS.canvasHeight);
        }
        var canvas = document.getElementById('dashboard-canvas');
        if (!(width > 0) && canvas) width = canvas.offsetWidth;
        if (!(height > 0) && canvas) height = canvas.offsetHeight;
        return {
            width: width > 0 ? width : 1280,
            height: height > 0 ? height : 720
        };
    }

    function defaultWidgetSize() {
        var w = 260;
        var h = 300;
        if (typeof MASTER_SETTINGS !== 'undefined') {
            var dw = Number(MASTER_SETTINGS.defaultWidth);
            var dh = Number(MASTER_SETTINGS.defaultHeight);
            if (dw > 0) w = dw;
            if (dh > 0) h = dh;
        }
        return { w: w, h: h };
    }

    function widgetBox(overrides) {
        var defaults = defaultWidgetSize();
        var w = Number(overrides && overrides.width);
        var h = Number(overrides && overrides.height);
        if (!(w > 0)) w = defaults.w;
        if (!(h > 0)) h = defaults.h;
        return { w: w, h: h };
    }

    function collectPageRects(page) {
        var rects = [];
        var defaults = defaultWidgetSize();
        var widgets = (typeof Dashboard !== 'undefined' && Dashboard.widgets) ? Dashboard.widgets : {};
        Object.keys(widgets).forEach(function (id) {
            var widget = widgets[id];
            if (!widget || !widgetOnPage(widget, page)) return;
            var ov = widget.overrides || {};
            var x = Number(ov.x);
            var y = Number(ov.y);
            var w = Number(ov.width);
            var h = Number(ov.height);
            if (!isFinite(x)) x = 0;
            if (!isFinite(y)) y = 0;
            if (!(w > 0)) w = defaults.w;
            if (!(h > 0)) h = defaults.h;
            rects.push({ x: x, y: y, w: w, h: h });
        });
        return rects;
    }

    function findSpot(w, h, rects, canvas) {
        var step = gridStep();
        if (!(step > 0)) step = 10;
        var margin = snap(20);
        if (margin < 0) margin = 0;
        var limitX = canvas.width - w;
        var limitY = canvas.height - h;
        if (limitX < 0 || limitY < 0) return null;
        var startX = margin <= limitX ? margin : 0;
        var startY = margin <= limitY ? margin : 0;
        var y = startY;
        while (y <= limitY + 0.01) {
            var x = startX;
            while (x <= limitX + 0.01) {
                var blocked = false;
                for (var i = 0; i < rects.length; i++) {
                    var other = rects[i];
                    if (x < other.x + other.w + margin && x + w + margin > other.x &&
                        y < other.y + other.h + margin && y + h + margin > other.y) {
                        blocked = true;
                        break;
                    }
                }
                if (!blocked) return { x: x, y: y };
                var nextX = snap(x + step);
                if (nextX <= x) nextX = x + step;
                x = nextX;
            }
            var nextY = snap(y + step);
            if (nextY <= y) nextY = y + step;
            y = nextY;
        }
        return null;
    }

    function tellOtherPages(pages) {
        if (!pages || !pages.length || typeof CustomDialog === 'undefined' || typeof CustomDialog.alert !== 'function') return;
        var list = pages.join(', ');
        var where = pages.length === 1 ? ('page ' + list) : ('pages ' + list);
        var message = 'Some widgets did not fit on this page. They were added to ' + where + '. This page stays open.\n\nUse the arrows beside the page name in the editor sidebar to open another page.';
        setTimeout(function () {
            CustomDialog.alert(message, 'Widgets on Another Page');
        }, 0);
    }

    function place(specs) {
        if (!specs || !specs.length || typeof Dashboard === 'undefined' || typeof Dashboard.createWidget !== 'function') return 0;
        var startPage = currentPage();
        var responsive = typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.layoutMode === 'responsive';
        var origin = snap(20);
        var canvas = canvasSize();
        var added = {};
        var otherPages = [];
        function rectsFor(page) {
            var list = collectPageRects(page);
            var more = added[page];
            if (!more) return list;
            for (var r = 0; r < more.length; r++) list.push(more[r]);
            return list;
        }
        function remember(page, box) {
            if (!added[page]) added[page] = [];
            added[page].push(box);
            if (page !== startPage && otherPages.indexOf(page) < 0) otherPages.push(page);
        }

        var order = 1;
        if (responsive) {
            var widgets = Dashboard.widgets || {};
            Object.keys(widgets).forEach(function (id) {
                var widget = widgets[id];
                var layout = widget && widget.overrides && widget.overrides.layout && widget.overrides.layout.responsive;
                var value = layout ? parseInt(layout.order, 10) : NaN;
                if (isFinite(value) && value >= order) order = value + 1;
            });
        }
        var columnCount = 1;
        if (responsive && typeof Dashboard.currentResponsiveColumnCount === 'function') {
            columnCount = Dashboard.currentResponsiveColumnCount();
        }
        if (!isFinite(columnCount) || columnCount < 1) columnCount = 1;

        var beforeSelection = typeof Dashboard._captureSelectionState === 'function' ? Dashboard._captureSelectionState() : null;
        var beforeGroups = typeof Dashboard._cloneJson === 'function' ? Dashboard._cloneJson(Dashboard.groups || {}) : {};
        var reserved = new Set();
        var created = [];

        if (typeof Dashboard.beginHistoryAction === 'function') Dashboard.beginHistoryAction('Auto-Widget Gallery');
        try {
            for (var i = 0; i < specs.length; i++) {
                var spec = specs[i];
                if (!spec || !spec.type) continue;
                var tile = TILES[spec.tile] || TILES['1x1'];
                var overrides = cloneData(spec.overrides || {});
                if (!overrides.metaName && spec.name) overrides.metaName = spec.name;
                if (!spec.keepSize) {
                    overrides.width = spec.placeW > 8 ? spec.placeW : tile.w;
                    overrides.height = spec.placeH > 8 ? spec.placeH : tile.h;
                } else {
                    delete overrides.width;
                    delete overrides.height;
                }
                if (!responsive) {
                    var box = widgetBox(overrides);
                    var chosen = startPage;
                    var spot = null;
                    var tries = 0;
                    while (tries < 40) {
                        spot = findSpot(box.w, box.h, rectsFor(chosen), canvas);
                        if (spot) break;
                        chosen += 1;
                        tries += 1;
                    }
                    if (!spot) {
                        chosen = startPage;
                        spot = { x: 0, y: 0 };
                    }
                    overrides.x = spot.x;
                    overrides.y = spot.y;
                    overrides.page = chosen;
                    remember(chosen, { x: spot.x, y: spot.y, w: box.w, h: box.h });
                } else {
                    overrides.x = origin;
                    overrides.y = origin;
                    overrides.page = startPage;
                    var span = spec.tile === '1x1' ? 1 : Math.min(2, columnCount);
                    overrides.layout = {
                        responsive: {
                            order: order,
                            columnSpan: span,
                            rowSpan: tile.row > 1 ? 2 : 1,
                            cellHeight: 0,
                            preferredColumn: 0,
                            hidden: false
                        }
                    };
                    order += 1;
                }
                var id = typeof Dashboard._generateUniqueWidgetId === 'function'
                    ? Dashboard._generateUniqueWidgetId(spec.type, reserved)
                    : (spec.type + '_' + Date.now() + '_' + i);
                if (!id) continue;
                reserved.add(id);
                Dashboard.createWidget(spec.type, id, overrides, cloneData(spec.bindings || {}), true);
                if (!Dashboard.widgets || !Dashboard.widgets[id]) continue;
                created.push(id);
                if (typeof Dashboard._recordHistoryEntry === 'function' && typeof Dashboard._serializeWidgetById === 'function') {
                    Dashboard._recordHistoryEntry({
                        kind: 'widget-create-delete',
                        widgetId: id,
                        beforeWidget: null,
                        afterWidget: Dashboard._serializeWidgetById(id),
                        beforeGroups: beforeGroups,
                        afterGroups: typeof Dashboard._cloneJson === 'function' ? Dashboard._cloneJson(Dashboard.groups || {}) : beforeGroups,
                        beforeSelection: beforeSelection,
                        afterSelection: beforeSelection
                    });
                }
            }
        } finally {
            if (typeof Dashboard.commitHistoryAction === 'function') Dashboard.commitHistoryAction();
        }

        if (!created.length) return 0;
        if (typeof Dashboard.loadFonts === 'function') Dashboard.loadFonts();
        if (typeof Editor !== 'undefined' && typeof Editor.refreshDropdown === 'function') {
            Editor.refreshDropdown(Dashboard.widgets);
        }
        if (typeof Dashboard.markUnsaved === 'function') Dashboard.markUnsaved();
        if (typeof Dashboard._refreshEditorPageIndicator === 'function') Dashboard._refreshEditorPageIndicator();
        if (responsive && typeof Dashboard._requestResponsiveLayoutAfterStructureChange === 'function') {
            Dashboard._requestResponsiveLayoutAfterStructureChange();
        }
        tellOtherPages(otherPages);
        return created.length;
    }

    function openDialog() {
        if (typeof DialogHost === 'undefined' || typeof DialogHost.openFloating !== 'function') {
            throw new Error('Dialog host unavailable');
        }
        destroy();
        DialogHost.openFloating({
            id: 'auto-widget-gallery',
            title: 'Auto-Widget Gallery',
            icon: 'ph-squares-four',
            className: 'awg-dialog',
            defaultSize: { w: Math.min(1200, window.innerWidth * 0.94), h: Math.min(860, window.innerHeight * 0.9) },
            minSize: { w: 720, h: 480 },
            buildBody: function (body) {
                startSession(body, { mode: 'dialog', hideUsed: prefHideUsed });
            },
            buildFooter: function (footer) {
                if (!session) return;
                footer.classList.add('awg-dialog-footer');
                var cancel = document.createElement('button');
                cancel.type = 'button';
                cancel.className = 'btn-tool ds-dialog-button';
                cancel.textContent = 'Cancel';
                cancel.addEventListener('click', function () {
                    DialogHost.requestClose('auto-widget-gallery');
                });
                var add = document.createElement('button');
                add.type = 'button';
                add.className = 'btn-tool ds-dialog-button primary';
                add.textContent = 'Add Selected to Canvas (0)';
                add.disabled = true;
                add.addEventListener('click', function () {
                    var specs = collectSpecs();
                    try {
                        if (specs.length) place(specs);
                    } finally {
                        DialogHost.requestClose('auto-widget-gallery');
                    }
                });
                session.addBtn = add;
                footer.appendChild(cancel);
                footer.appendChild(add);
                notifyCount();
            },
            onClose: function () {
                destroy();
            }
        });
    }

    function getRulePipeline() {
        return {
            prepass: PREPASS_RULES,
            rules: RULE_PIPELINE,
            inferRules: INFER_RULES,
            fractionCaps: Object.keys(FRACTION_CAPS),
            percentCaps: Object.keys(PERCENT_CAPS),
            tiles: TILES
        };
    }

    window.AutoWidgetGallery = {
        open: openDialog,
        resume: resume,
        pause: pause,
        destroy: destroy,
        collectSpecs: collectSpecs,
        place: place,
        selectedCount: selectedCount,
        getRulePipeline: getRulePipeline,
        traceTopic: traceTopic,
        censusTopics: censusTopics,
        classifyAll: classifyAll,
        topicMeta: topicMeta,
        readPayload: readPayload,
        seedPayload: seedPayload,
        buildLightGrids: buildLightGrids,
        applyPreset: applyPreset,
        convertType: convertType
    };

    if (typeof ToolsRegistry !== 'undefined') {
        ToolsRegistry.register({
            id: 'auto-widget-gallery',
            label: 'Auto-Widget Gallery',
            description: 'Generate and batch-add live widgets from incoming data streams.',
            icon: 'ph-squares-four',
            script: 'scripts/auto-widget-gallery.js',
            run: function () {
                return openDialog();
            }
        });
    }
})();
