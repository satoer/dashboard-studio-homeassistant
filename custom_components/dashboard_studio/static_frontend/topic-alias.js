/**
 * Maps between canonical Homey topics (homey/variables|flows|moods|event|insight/...) and
 * the legacy names used before they were standardized, so existing dashboard bindings keep working.
 */
const HomeyTopicAlias = {
    VARIABLES: 'homey/variables/',
    FLOWS: 'homey/flows/',
    MOODS: 'homey/moods/',
    EVENTS: 'homey/event/',
    INSIGHTS: 'homey/insight/',
    HA_VARIABLES: 'homeassistant/variables/',
    HA_FLOWS: 'homeassistant/flows/',
    HA_MOODS: 'homeassistant/moods/',
    HA_EVENTS: 'homeassistant/event/',
    HA_INSIGHTS: 'homeassistant/insight/',
    LEGACY_MOOD: 'mood-',

    /** Canonical topic to its legacy name, or null when the topic has no legacy form. */
    legacyOf: function (topic) {
        if (!topic || typeof topic !== 'string') return null;
        if (topic.indexOf('homey/') === 0) {
            if (topic.indexOf(this.VARIABLES) === 0) return topic.slice(this.VARIABLES.length);
            if (topic.indexOf(this.FLOWS) === 0) return topic.slice(this.FLOWS.length);
            if (topic.indexOf(this.MOODS) === 0) return this.LEGACY_MOOD + topic.slice(this.MOODS.length);
            if (topic.indexOf(this.EVENTS) === 0) return topic.slice(this.EVENTS.length);
            if (topic.indexOf(this.INSIGHTS) === 0) return topic.slice(this.INSIGHTS.length);
        } else if (topic.indexOf('homeassistant/') === 0) {
            if (topic.indexOf(this.HA_VARIABLES) === 0) return topic.slice(this.HA_VARIABLES.length);
            if (topic.indexOf(this.HA_FLOWS) === 0) return topic.slice(this.HA_FLOWS.length);
            if (topic.indexOf(this.HA_MOODS) === 0) return this.LEGACY_MOOD + topic.slice(this.HA_MOODS.length);
            if (topic.indexOf(this.HA_EVENTS) === 0) return topic.slice(this.HA_EVENTS.length);
            if (topic.indexOf(this.HA_INSIGHTS) === 0) return topic.slice(this.HA_INSIGHTS.length);
        }
        return null;
    },

    /** Legacy topic to its canonical name, or null when the topic does not look like a legacy Homey topic. */
    canonicalOf: function (topic) {
        if (!topic || typeof topic !== 'string' || topic.indexOf('homey/') === 0 || topic.indexOf('homeassistant/') === 0) return null;
        if (topic.indexOf(this.LEGACY_MOOD) === 0 && topic.slice(-4) === '/set') {
            return this.MOODS + topic.slice(this.LEGACY_MOOD.length);
        }
        if (topic.slice(-6) === '/start' || topic.slice(-8) === '/enabled') return this.FLOWS + topic;
        if (topic.slice(-6) === '/value' && topic.indexOf('/') === topic.length - 6) return this.VARIABLES + topic;

        if (topic.indexOf('event/') === 0) return 'homey/' + topic;
        if (topic.indexOf('insight/') === 0) return 'homey/' + topic;
        if (topic.indexOf('variables/') === 0) return 'homey/' + topic;
        if (topic.indexOf('flows/') === 0) return 'homey/' + topic;
        if (topic.indexOf('moods/') === 0) return 'homey/' + topic;

        // Bare topic names without slashes map to events (or insights if known)
        if (topic.indexOf('/') === -1 && topic.indexOf('local/') !== 0) {
            var inTopic = this.INSIGHTS + topic;
            if (typeof Dashboard !== 'undefined') {
                if (Dashboard.liveData && Object.prototype.hasOwnProperty.call(Dashboard.liveData, inTopic)) return inTopic;
                if (Dashboard.topicMeta && Dashboard.topicMeta[inTopic]) return inTopic;
            }
            var driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
            if (driver && driver.seenTopics && typeof driver.seenTopics.has === 'function' && driver.seenTopics.has(inTopic)) {
                return inTopic;
            }
            return this.EVENTS + topic;
        }
        return null;
    },

    /** The other name of a topic, whichever form was given. */
    aliasOf: function (topic) {
        return this.legacyOf(topic) || this.canonicalOf(topic);
    }
};

/**
 * Resolves short, friendly, or partial topic names into canonical Homey topics.
 * Detects ambiguity and provides candidates with metadata tags.
 */
const HomeyTopicResolver = {
    /** Checks if a topic is a local loopback topic (local/*) which must never be altered. */
    isLocal: function (topic) {
        return typeof topic === 'string' && topic.indexOf('local/') === 0;
    },

    /**
     * Resolves matching candidate canonical topics for a given input query.
     * @param {string} rawInput
     * @returns {{ exact: boolean, isLocal: boolean, candidates: Array<{ topic: string, title: string, type: string, badge: string, icon: string, zoneName?: string }> }}
     */
    findCandidates: function (rawInput) {
        if (!rawInput || typeof rawInput !== 'string') {
            return { exact: false, isLocal: false, candidates: [] };
        }
        var input = rawInput.trim();
        if (!input) return { exact: false, isLocal: false, candidates: [] };

        // 1. Local topics are always exact and never modified
        if (this.isLocal(input)) {
            return {
                exact: true,
                isLocal: true,
                candidates: [{ topic: input, title: input, type: 'local', badge: 'Local', icon: 'ph-arrows-clockwise' }]
            };
        }

        // 2. Exact match in Dashboard.topicMeta or Dashboard.liveData
        var hasMeta = typeof Dashboard !== 'undefined' && Dashboard.topicMeta;
        var hasLive = typeof Dashboard !== 'undefined' && Dashboard.liveData;

        if ((hasMeta && Dashboard.topicMeta[input]) || (hasLive && Object.prototype.hasOwnProperty.call(Dashboard.liveData, input))) {
            var directMeta = hasMeta ? Dashboard.topicMeta[input] : null;
            return {
                exact: true,
                isLocal: false,
                candidates: [this._buildCandidate(input, directMeta)]
            };
        }

        var candidateMap = Object.create(null);
        var self = this;

        function addCandidate(topic, meta) {
            if (!topic || self.isLocal(topic) || candidateMap[topic]) return;
            // Ignore legacy aliases if canonical topic is known
            var canon = HomeyTopicAlias.canonicalOf(topic);
            if (canon && canon !== topic && ((hasMeta && Dashboard.topicMeta[canon]) || (hasLive && Object.prototype.hasOwnProperty.call(Dashboard.liveData, canon)))) {
                return;
            }
            candidateMap[topic] = self._buildCandidate(topic, meta || (hasMeta ? Dashboard.topicMeta[topic] : null));
        }

        // 3. Known canonical alias in HomeyTopicAlias (e.g. legacy mood-.../set)
        var aliasCanon = HomeyTopicAlias.canonicalOf(input);
        if (aliasCanon && ((hasMeta && Dashboard.topicMeta[aliasCanon]) || (hasLive && Object.prototype.hasOwnProperty.call(Dashboard.liveData, aliasCanon)))) {
            addCandidate(aliasCanon, hasMeta ? Dashboard.topicMeta[aliasCanon] : null);
        }

        var cleanInput = input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        var slugInput = input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        var inputLeaf = input.indexOf('/') >= 0 ? input.split('/').pop().trim() : input;
        var cleanInputLeaf = inputLeaf.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

        // Collect all distinct topics
        var allTopics = [];
        var seenTopics = Object.create(null);
        function pushTopic(t) {
            if (t && !seenTopics[t] && !self.isLocal(t)) {
                seenTopics[t] = true;
                allTopics.push(t);
            }
        }

        if (hasMeta) Object.keys(Dashboard.topicMeta).forEach(pushTopic);
        if (hasLive) Object.keys(Dashboard.liveData).forEach(pushTopic);
        var driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        if (driver && driver.seenTopics && typeof driver.seenTopics.forEach === 'function') {
            driver.seenTopics.forEach(function (_val, t) { pushTopic(t); });
        }

        for (var i = 0; i < allTopics.length; i++) {
            var t = allTopics[i];
            var meta = hasMeta ? Dashboard.topicMeta[t] : null;
            var title = (meta && meta.title) ? String(meta.title).trim() : '';
            var cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
            var leaf = t.split('/').pop() || '';
            var cleanLeaf = leaf.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

            var matches = false;

            // Direct leaf match (e.g. Accu_Laadschema matching homey/event/Accu_Laadschema)
            if (cleanLeaf && (cleanLeaf === cleanInput || cleanLeaf === cleanInputLeaf)) {
                matches = true;
            }
            // Prefix omission match (e.g. event/Accu_Laadschema -> homey/event/Accu_Laadschema)
            else if (t.indexOf('homey/' + input) === 0 || t === 'homey/' + input || t.indexOf('homeassistant/' + input) === 0 || t === 'homeassistant/' + input) {
                matches = true;
            }
            // Title / display name match (e.g. Film Kijken matching Woonkamer • Film Kijken)
            else if (cleanTitle) {
                var rawTitleParts = title.split(/\s*[\u2022•-]\s*/);
                var lastPartClean = rawTitleParts[rawTitleParts.length - 1].toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
                if (cleanTitle === cleanInput || lastPartClean === cleanInput) {
                    matches = true;
                }
            }

            // Mood / flow / variable slug match
            if (!matches && slugInput && t.indexOf('homey/') === 0) {
                if (t.indexOf('homey/moods/') === 0) {
                    var moodSeg = t.slice(12, -4); // strip homey/moods/ and /set
                    var moodParts = moodSeg.split('-');
                    if (moodParts.length > 1) moodParts.pop(); // strip shortId
                    var moodSlug = moodParts.join('-');
                    if (moodSlug === slugInput || moodSlug.indexOf(slugInput) >= 0) {
                        matches = true;
                    }
                } else if (t.indexOf('homey/flows/') === 0) {
                    var flowSeg = t.slice(12).split('/')[0];
                    var flowParts = flowSeg.split('-');
                    if (flowParts.length > 1) flowParts.pop(); // strip shortId
                    var flowSlug = flowParts.join('-');
                    if (flowSlug === slugInput || flowSlug.indexOf(slugInput) >= 0) {
                        matches = true;
                    }
                } else if (t.indexOf('homey/variables/') === 0) {
                    var varSlug = t.slice(16, -6); // strip homey/variables/ and /value
                    if (varSlug === slugInput) {
                        matches = true;
                    }
                }
            }

            // Device capability match (e.g. "Woonkamer Lamp onoff" -> "Woonkamer Lamp/onoff")
            if (!matches && t.indexOf('/') > 0 && t.indexOf('homey/') !== 0) {
                var devNormalized = t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
                if (devNormalized === cleanInput) {
                    matches = true;
                }
            }

            if (matches) {
                addCandidate(t, meta);
            }
        }

        var candidateList = [];
        var keys = Object.keys(candidateMap);
        for (var j = 0; j < keys.length; j++) {
            candidateList.push(candidateMap[keys[j]]);
        }

        return {
            exact: false,
            isLocal: false,
            candidates: candidateList
        };
    },

    _buildCandidate: function (topic, meta) {
        var t = String(topic || '');
        var title = (meta && meta.title) ? String(meta.title).trim() : '';
        var zoneName = (meta && meta.zoneName) ? String(meta.zoneName).trim() : '';

        if (t.indexOf('homey/event/') === 0 || t.indexOf('homeassistant/event/') === 0) {
            var evName = t.indexOf('homeassistant/') === 0 ? t.slice(20) : t.slice(12);
            return {
                topic: t,
                title: evName,
                type: 'event',
                badge: 'Event',
                icon: 'ph-broadcast'
            };
        }
        if (t.indexOf('homey/insight/') === 0 || t.indexOf('homeassistant/insight/') === 0) {
            var inName = t.indexOf('homeassistant/') === 0 ? t.slice(22) : t.slice(14);
            return {
                topic: t,
                title: inName,
                type: 'insight',
                badge: 'Insight',
                icon: 'ph-chart-line'
            };
        }
        if (t.indexOf('homey/moods/') === 0 || t.indexOf('homeassistant/moods/') === 0 || (meta && meta.isMood)) {
            return {
                topic: t,
                title: title || t.split('/')[2] || 'Scene',
                type: 'mood',
                badge: (t.indexOf('homeassistant/') === 0 || (meta && meta.domain === 'scene')) ? 'Scene' : 'Mood',
                icon: 'ph-sparkle',
                zoneName: zoneName
            };
        }
        if (t.indexOf('homey/variables/') === 0 || t.indexOf('homeassistant/variables/') === 0 || (meta && meta.isVariable)) {
            var vName = title || (t.indexOf('homeassistant/') === 0 ? t.slice(24, -6) : t.slice(16, -6));
            return {
                topic: t,
                title: vName,
                type: 'variable',
                badge: (t.indexOf('homeassistant/') === 0 || (meta && meta.domain && meta.domain.indexOf('input_') === 0)) ? 'Helper' : 'Variable',
                icon: 'ph-tag'
            };
        }
        if (t.indexOf('homey/flows/') === 0 || t.indexOf('homeassistant/flows/') === 0 || (meta && meta.isFlow)) {
            return {
                topic: t,
                title: title || 'Flow',
                type: 'flow',
                badge: (t.indexOf('homeassistant/') === 0 || (meta && (meta.domain === 'automation' || meta.domain === 'script'))) ? 'Automation' : 'Flow',
                icon: 'ph-git-branch'
            };
        }
        if (t.indexOf('local/') === 0) {
            return {
                topic: t,
                title: t,
                type: 'local',
                badge: 'Local',
                icon: 'ph-arrows-clockwise'
            };
        }
        return {
            topic: t,
            title: title || t,
            type: 'device',
            badge: 'Device',
            icon: 'ph-cpu',
            zoneName: zoneName
        };
    }
};

if (typeof window !== 'undefined') {
    window.HomeyTopicAlias = HomeyTopicAlias;
    window.HomeyTopicResolver = HomeyTopicResolver;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HomeyTopicAlias: HomeyTopicAlias,
        HomeyTopicResolver: HomeyTopicResolver
    };
}
