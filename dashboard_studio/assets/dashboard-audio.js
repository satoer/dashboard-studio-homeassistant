/**
 * Dashboard Audio: play short clips on widget events / topic map.
 * View mode only; muted for ARM_MS after each dashboard load (plus edge priming in widgets).
 */
(function () {
    const ARM_MS = 5000;
    const POOL_SIZE = 4;

    const DashboardAudio = {
        _armed: false,
        _armTimer: null,
        _pool: [],
        _poolIndex: 0,
        _topicIndex: Object.create(null),

        init: function () {
            this._armed = false;
            this._pool = [];
            for (let i = 0; i < POOL_SIZE; i++) {
                this._pool.push(new Audio());
            }
            this._poolIndex = 0;
            this.rebuildTopicIndex();
        },

        suppress: function () {
            this._armed = false;
            if (this._armTimer) {
                if (typeof WorkerTimer !== 'undefined' && WorkerTimer.clearTimeout) {
                    WorkerTimer.clearTimeout(this._armTimer);
                } else {
                    clearTimeout(this._armTimer);
                }
                this._armTimer = null;
            }
        },

        arm: function () {
            this._armed = true;
            this._armTimer = null;
        },

        notifyDashboardReady: function () {
            this.suppress();
            this.rebuildTopicIndex();
            const self = this;
            const start = typeof WorkerTimer !== 'undefined' && WorkerTimer.setTimeout
                ? WorkerTimer.setTimeout.bind(WorkerTimer)
                : setTimeout;
            this._armTimer = start(function () {
                self.arm();
            }, ARM_MS);
        },

        isArmed: function () {
            return this._armed === true;
        },

        isEnabled: function () {
            if (typeof Dashboard !== 'undefined' && Dashboard.isEditMode) return false;
            return this.isArmed();
        },

        resolveUrl: function (url) {
            if (url == null) return '';
            let s = String(url).trim();
            if (!s) return '';
            if (s.startsWith('/')) s = s.slice(1);
            return s;
        },

        play: function (url) {
            if (!this.isEnabled()) return;
            const src = this.resolveUrl(url);
            if (!src) return;
            const el = this._pool[this._poolIndex];
            this._poolIndex = (this._poolIndex + 1) % this._pool.length;
            try {
                el.pause();
                el.currentTime = 0;
            } catch (e) { /* ignore */ }
            el.src = src;
            el.play().catch(function () { /* autoplay / missing file */ });
        },

        playFrom: function (audioObj, key) {
            if (!audioObj || typeof audioObj !== 'object' || !key) return;
            this.play(audioObj[key]);
        },

        /**
         * Edge helper for data-driven triggers.
         * First sample primes without playing. Later rise/fall call the matching callbacks.
         * store: { primed: bool, prev: any }
         */
        observeEdge: function (store, next, onRise, onFall) {
            if (!store || typeof store !== 'object') return;
            if (!store.primed) {
                store.prev = next;
                store.primed = true;
                return;
            }
            const prev = store.prev;
            if (prev === next) return;
            store.prev = next;
            if (next && !prev && typeof onRise === 'function') onRise();
            else if (!next && prev && typeof onFall === 'function') onFall();
        },

        /** Fire when value changes after prime (any inequality). */
        observeChange: function (store, next, onChange) {
            if (!store || typeof store !== 'object') return;
            if (!store.primed) {
                store.prev = next;
                store.primed = true;
                return;
            }
            if (store.prev === next) return;
            store.prev = next;
            if (typeof onChange === 'function') onChange();
        },

        /** Numeric cross: fire when crossing into >= high or <= low after prime. */
        observeThresholdCross: function (store, nextNum, high, low, onHigh, onLow) {
            if (!store || typeof store !== 'object') return;
            const n = Number(nextNum);
            if (!store.primed) {
                store.prev = n;
                store.primed = true;
                return;
            }
            const p = Number(store.prev);
            store.prev = n;
            if (isFinite(high) && p < high && n >= high && typeof onHigh === 'function') onHigh();
            if (isFinite(low) && p > low && n <= low && typeof onLow === 'function') onLow();
        },

        normalizeTopicMap: function (raw) {
            let arr = raw;
            if (typeof arr === 'string') {
                try { arr = JSON.parse(arr); } catch (e) { arr = []; }
            }
            if (!Array.isArray(arr)) arr = [];
            // Keep empty draft rows for the editor "Add Topic Audio" flow.
            // Playback indexing still requires both topic and url (see rebuildTopicIndex).
            return arr.map(function (row) {
                return {
                    topic: row && row.topic != null ? String(row.topic) : '',
                    url: row && row.url != null ? String(row.url) : ''
                };
            });
        },

        rebuildTopicIndex: function () {
            const map = Object.create(null);
            const raw = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS)
                ? MASTER_SETTINGS.audioTopicMap
                : null;
            const list = this.normalizeTopicMap(raw);
            list.forEach(function (row) {
                const t = String(row.topic || '').trim();
                const u = String(row.url || '').trim();
                if (t && u) map[t] = u;
            });
            this._topicIndex = map;
        },

        onTopicPayload: function (topic) {
            if (!topic || !this.isEnabled()) return;
            const url = this._topicIndex[topic];
            if (url) this.play(url);
        },

        /** Shared schema slideout builder. */
        schemaGroup: function (id, triggers) {
            return {
                id: id || 'audio',
                title: 'Audio',
                icon: 'ph-music-notes',
                fields: [
                    {
                        key: 'audio',
                        type: 'audio_trigger_map',
                        cols: 12,
                        triggers: Array.isArray(triggers) ? triggers : []
                    }
                ]
            };
        },

        defaultAudio: function (triggers) {
            const o = {};
            (triggers || []).forEach(function (t) {
                if (t && t.key) o[t.key] = '';
            });
            return o;
        }
    };

    window.DashboardAudio = DashboardAudio;
    DashboardAudio.init();
}());
