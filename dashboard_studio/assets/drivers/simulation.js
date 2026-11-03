class SimulationDriver extends BaseDataDriver {
    static get MIN_INTERVAL_MS() {
        return 500;
    }

    static get metadata() {
        return {
            label: "Simulation",
            description: "Generates custom data patterns"
        };
    }

    static get schema() {
        const s = [
            { key: 'interval', type: 'number', label: 'Global Interval (ms)', cols: 12, default: SimulationDriver.MIN_INTERVAL_MS },
            { key: 'stats_panel', type: 'driver_stats', label: 'Statistics', cols: 12 },
            { key: 'monitor_panel', type: 'topic_monitor', label: 'Live Monitor', cols: 12 }
        ];
        for (let i = 1; i <= 10; i++) {
            s.push(
                { key: `slot${i}_enable`, type: 'checkbox', label: `Enable User Slot ${i}`, cols: 12 },
                { key: `slot${i}_topic`, type: 'text', label: 'Topic', cols: 6, default: `custom/topic${i}` },
                { key: `slot${i}_type`, type: 'select', label: 'Pattern', cols: 6, options: ['random', 'sine', 'walk'], default: 'random' },
                { key: `slot${i}_min`, type: 'number', label: 'Min', cols: 4, default: 0 },
                { key: `slot${i}_max`, type: 'number', label: 'Max', cols: 4, default: 100 },
                { key: `slot${i}_speed`, type: 'number', label: 'Speed', cols: 4, default: 1 }
            );
        }
        return s;
    }

    constructor(settings) {
        super(settings);
        this.isConnected = false;
        // Worker-backed interval (see WorkerTimer). Main-thread setInterval gets clamped to 1-5 Hz
        // (or worse) right after page load, while a native picker is open, when the tab is
        // partially occluded, and under battery-saver heuristics — which would otherwise show as
        // 30-60 s of apparently frozen data after an import.
        this._simTimerHandle = null;

        this.stats = { msgCount: 0, connectedSince: null, lastTopic: null };
        this.seenTopics = new Map();
        this.stateMap = new Map();
        this.simulators = [];

        this.parseSettings(settings);
    }

    _getNum(val, def) {
        const p = parseFloat(val);
        return isNaN(p) ? def : p;
    }

    parseSettings(settings) {
        this.settings = settings || {};
        this.interval = Math.max(
            SimulationDriver.MIN_INTERVAL_MS,
            this._getNum(this.settings.interval, SimulationDriver.MIN_INTERVAL_MS)
        );
        
        const newSimulators = [];

        for (let i = 1; i <= 10; i++) {
            if (this.settings[`slot${i}_enable`]) {
                newSimulators.push({
                    id: `usr_${i}`,
                    topic: this.settings[`slot${i}_topic`] || `custom/topic${i}`,
                    type: this.settings[`slot${i}_type`] || 'random',
                    min: this._getNum(this.settings[`slot${i}_min`], 0),
                    max: this._getNum(this.settings[`slot${i}_max`], 100),
                    speed: this._getNum(this.settings[`slot${i}_speed`], 1)
                });
            }
        }

        const builtIns = [
            { id: 'b_sine', topic: 'sim/sine', type: 'sine', min: 0, max: 100, speed: 0.05 },
            { id: 'b_cos', topic: 'sim/cosine', type: 'sine', min: -50, max: 50, speed: 0.08, phase: 1.5 },
            { id: 'b_temp', topic: 'sim/temperature', type: 'walk', min: 18, max: 26, speed: 0.2 },
            { id: 'b_hum', topic: 'sim/humidity', type: 'walk', min: 30, max: 60, speed: 0.5 },
            { id: 'b_volt', topic: 'sim/voltage', type: 'random', min: 220, max: 235, speed: 0.5 },
            { id: 'b_rpm', topic: 'sim/rpm', type: 'walk', min: 800, max: 3000, speed: 15 },
            { id: 'b_batt', topic: 'sim/battery_level', type: 'sawtooth', min: 0, max: 100, speed: 0.5 },
            { id: 'b_solar', topic: 'sim/solar_power', type: 'sine', min: 0, max: 4500, speed: 0.02 },
            { id: 'b_wind', topic: 'sim/wind_speed', type: 'random', min: 0, max: 45, speed: 2.0 },
            { id: 'b_cpu', topic: 'sim/cpu_load', type: 'random', min: 5, max: 90, speed: 3.0 },
            { id: 'b_txt', topic: 'sim/text_log', type: 'text', min: 3000, max: 8000 }
        ];
        newSimulators.push(...builtIns);

        const arrays = [
            { id: 'a_s100', topic: 'sim/graph/sine100', type: 'arr_sine', len: 100, min: 0, max: 100, speed: 0.1 },
            { id: 'a_n100', topic: 'sim/graph/noise100', type: 'arr_noise', len: 100, min: 20, max: 80, speed: 0.5 },
            { id: 'a_w50',  topic: 'sim/graph/stock50', type: 'arr_walk', len: 50, min: 100, max: 200, speed: 2.0 },
            { id: 'a_w100', topic: 'sim/graph/trend100', type: 'arr_walk', len: 100, min: 0, max: 1000, speed: 5.0 },
            { id: 'a_sw50', topic: 'sim/graph/saw50', type: 'arr_saw', len: 50, min: 0, max: 10, speed: 0.1 },
            { id: 'a_s20r', topic: 'sim/graph/sine20', type: 'arr_sine', len: 20, min: 10, max: 90, speed: 0.2, rev: true },
            { id: 'a_p50r', topic: 'sim/graph/heartbeat50', type: 'arr_pulse', len: 50, min: 0, max: 100, speed: 0.15, rev: true },
            { id: 'a_n10e', topic: 'sim/graph/noise10', type: 'arr_noise', len: 10, min: 0, max: 50, speed: 2.0, eq: true },
            { id: 'a_m30e', topic: 'sim/graph/mixed30', type: 'arr_mixed', len: 30, min: 0, max: 100, speed: 0.1, eq: true },
            { id: 'a_b15e', topic: 'sim/graph/blocks15', type: 'arr_blocks', len: 15, min: 0, max: 10, speed: 0.05, eq: true }
        ];
        newSimulators.push(...arrays);

        this.simulators = newSimulators;

        const now = Date.now();
        this.simulators.forEach(sim => {
            if (!this.stateMap.has(sim.id)) {
                const mid = (sim.min + sim.max) / 2;
                let state = { angle: sim.phase || 0, val: mid, trend: 0.1, nextMsg: now };
                
                if (sim.type.startsWith('arr_')) {
                    state.buf = Array(sim.len).fill(mid);
                    if (sim.eq) {
                        state.buf = state.buf.map(() => Math.random() * (sim.max - sim.min) + sim.min);
                    } else {
                        for(let i=0; i<sim.len; i++) {
                            state.val = this._calcNext(sim, state);
                            state.buf.push(state.val);
                            state.buf.shift();
                        }
                    }
                }
                this.stateMap.set(sim.id, state);
            }
        });
    }

    updateSettings(newSettings) {
        const oldStr = JSON.stringify(this.settings);
        const mergedSettings = { ...this.settings, ...newSettings };
        const newStr = JSON.stringify(mergedSettings);

        if (oldStr === newStr) return;

        this.parseSettings(mergedSettings);
        if (this.isConnected) this._kickoff();
    }

    _tickSafe() {
        if (!this.isConnected) return;
        try {
            this._tick();
        } catch (e) {
            console.error("[SimDriver] Unhandled error during _tick:", e);
        }
    }

    _startTimer() {
        this._stopTimer();
        if (!this.isConnected) return;
        if (typeof Dashboard !== 'undefined' && Dashboard._pageHidden) return;
        this._simTimerHandle = WorkerTimer.setInterval(() => this._tickSafe(), this.interval);
    }

    pauseForBackground() {
        this._stopTimer();
    }

    resumeFromBackground() {
        if (this.isConnected) this._startTimer();
    }

    _stopTimer() {
        if (this._simTimerHandle) {
            WorkerTimer.clearInterval(this._simTimerHandle);
            this._simTimerHandle = null;
        }
    }

    /**
     * (Re)start the ticker and emit one full tick synchronously so every subscriber
     * (Dashboard.liveData, widgets created in the same sync frame, globalBindings)
     * sees real values on first paint. Used by both connect() and updateSettings()
     * so there is no deferral gap between driver readiness and first data.
     */
    _kickoff() {
        if (!this.isConnected) return;
        this._startTimer();
        this._tick(true);
    }

    connect() {
        this.isConnected = true;
        this.stats.connectedSince = Date.now();
        this.dispatchStatus(true, "SIMULATION");
        this._kickoff();
    }

    disconnect() {
        this.isConnected = false;
        this.stats.connectedSince = null;
        this._stopTimer();
        super.disconnect();
        this.dispatchStatus(false, "STOPPED");
    }

    /**
     * User / widget publishes (e.g. local/* topics). Must not wait behind batched simulator ticks or rAF,
     * or the UI can appear frozen for seconds while the first large tick is processed.
     */
    publish(topic, payload) {
        this.simulators.forEach(sim => {
            if (sim.topic === topic) {
                const state = this.stateMap.get(sim.id);
                if (state) {
                    const num = Number(payload);
                    if (!Number.isNaN(num)) {
                        state.val = num;
                        if (sim.speed === 0 || sim.min === sim.max) {
                            sim.min = num;
                            sim.max = num;
                        } else {
                            if (num < sim.min) sim.min = num;
                            if (num > sim.max) sim.max = num;
                        }
                    }
                }
            }
        });

        const run = () => {
            this._recordMessage(topic, payload);
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.applyLocalTopicPayload === 'function') {
                Dashboard.applyLocalTopicPayload(topic, payload, this);
            } else {
                this.dispatchMessage(topic, payload);
            }
        };
        if (typeof queueMicrotask === 'function') {
            queueMicrotask(run);
        } else {
            setTimeout(run, 0);
        }
    }

    _recordMessage(topic, payload) {
        this.stats.msgCount++;
        this.stats.lastTopic = topic;

        const existing = this.seenTopics.get(topic) || { count: 0 };
        this.seenTopics.set(topic, {
            payload: payload,
            count: existing.count + 1,
            timestamp: Date.now()
        });

        if (this.seenTopics.size > 100) {
            const oldestKey = this.seenTopics.keys().next().value;
            this.seenTopics.delete(oldestKey);
        }
    }

    _calcNext(sim, state) {
        let next = state.val;
        const range = sim.max - sim.min;

        switch (sim.type.replace('arr_', '')) {
            case 'sine':
                state.angle += sim.speed;
                next = ((Math.sin(state.angle) + 1) / 2) * range + sim.min;
                break;
            case 'sawtooth':
            case 'saw':
                next = state.val + (sim.speed * range * 0.1);
                if (next > sim.max) next = sim.min;
                break;
            case 'walk':
                if (Math.random() > 0.95) state.trend = (Math.random() - 0.5) * sim.speed * 2;
                next = state.val + state.trend + (Math.random() - 0.5) * sim.speed;
                if (next > sim.max || next < sim.min) {
                    state.trend *= -1;
                    next = Math.max(sim.min, Math.min(sim.max, next));
                }
                break;
            case 'pulse':
                state.angle += sim.speed;
                const s = Math.sin(state.angle);
                next = (s > 0.9) ? (sim.max * s) : (sim.min + Math.random() * (range * 0.05));
                break;
            case 'blocks':
                next = (Math.random() > 0.90) ? (Math.random() * range + sim.min) : state.val;
                break;
            case 'mixed':
                state.angle += sim.speed;
                next = (((Math.sin(state.angle) + Math.cos(state.angle * 2.5)) + 2) / 4) * range + sim.min;
                break;
            case 'noise':
            case 'random':
            default:
                const change = (Math.random() - 0.5) * sim.speed * 2;
                next = state.val + change;
                if (next > sim.max * 0.9) next -= Math.abs(sim.speed * 0.2);
                if (next < sim.min + (range * 0.1)) next += Math.abs(sim.speed * 0.2);
                break;
        }

        return Math.max(sim.min, Math.min(sim.max, next));
    }

    _tick(forceAll = false) {
        const now = Date.now();
        const batch = new Map();

        const pushOut = (topic, payload) => {
            this._recordMessage(topic, payload);
            batch.set(topic, payload);
        };

        this.simulators.forEach(sim => {
            try {
                const state = this.stateMap.get(sim.id);
                if (!state) return;

                if (sim.type === 'text') {
                    if (forceAll || now >= state.nextMsg) {
                        const msgs = [
                            "ph-check-circle|System nominal",
                            "ph-warning|CPU spike detected",
                            "ph-thermometer-hot|Thermal limit reached",
                            "ph-drop|Moisture detected",
                            "ph-lightning|Power grid fluctuation",
                            "ph-wifi-high|Link established",
                            "ph-user-circle|Admin login",
                            "ph-shield-check|Firewall active"
                        ];
                        const txt = msgs[Math.floor(Math.random() * msgs.length)];
                        pushOut(sim.topic, txt);
                        state.nextMsg = now + (Math.random() * (sim.max - sim.min) + sim.min);
                    }
                    return;
                }

                if (sim.type.startsWith('arr_')) {
                    if (sim.eq) {
                        for(let i=0; i<state.buf.length; i++) {
                            let c = (Math.random() - 0.5) * sim.speed * 5;
                            if (state.buf[i] > sim.max) c -= Math.abs(sim.speed);
                            if (state.buf[i] < sim.min) c += Math.abs(sim.speed);
                            state.buf[i] = Math.max(sim.min, Math.min(sim.max, state.buf[i] + c));
                        }
                    } else {
                        state.val = this._calcNext(sim, state);
                        if (sim.rev) {
                            state.buf.unshift(state.val);
                            state.buf.pop();
                        } else {
                            state.buf.push(state.val);
                            state.buf.shift();
                        }
                    }
                    const out = state.buf.map(v => v.toFixed(2)).join(',');
                    pushOut(sim.topic, out);
                }
                else {
                    state.val = this._calcNext(sim, state);
                    pushOut(sim.topic, parseFloat(state.val.toFixed(2)));
                }
            } catch (e) {
                console.error(`[SimDriver] Error in simulator ${sim.id}:`, e);
            }
        });

        if (batch.size === 0) return;
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.applyLocalTopicPayloadBatch === 'function') {
            Dashboard.applyLocalTopicPayloadBatch(batch, this);
        } else {
            batch.forEach((payload, topic) => this.dispatchMessage(topic, payload));
        }
    }
}

DataDriverRegistry.register('simulation', SimulationDriver);