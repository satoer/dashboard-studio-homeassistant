class MqttDriver extends BaseDataDriver {
    static get metadata() {
        return {
            label: "MQTT Client",
            description: "Connect to a broker via WebSockets. ⚠️ NOTE: Browsers will block non-SSL connections if the dashboard is loaded via HTTPS."
        };
    }

    static get schema() {
        return [
            { key: 'host', type: 'text', label: 'Broker Host (⚠️ Use HTTP if no SSL)', cols: 8, default: 'localhost' },
            { key: 'port', type: 'number', label: 'Port (WS)', cols: 4, default: 9001 },
            
            { key: 'clientId', type: 'text', label: 'Client ID (Optional)', cols: 6 },
            { key: 'useSSL', type: 'checkbox', label: 'Use SSL/TLS', cols: 6 },
            
            { key: 'username', type: 'text', label: 'Username', cols: 6 },
            { key: 'password', type: 'text', label: 'Password', cols: 6 },
            
            { key: 'subTopic', type: 'text', label: 'Subscribe Topic', cols: 12, default: '#' },

            { key: 'stats_panel', type: 'driver_stats', label: 'Statistics', cols: 12 },
            { key: 'monitor_panel', type: 'topic_monitor', label: 'Live Monitor', cols: 12 }
        ];
    }

    constructor(settings) {
        super(settings);
        
        this.stats = {
            msgCount: 0,
            connectedSince: null,
            lastTopic: null
        };
        
        this.seenTopics = new Map();
        this.client = null;
        this.reconnectTimer = null;
        this.isIntentionalDisconnect = false;
    }

    async connect() {
        this._clearReconnectTimer();

        this.isIntentionalDisconnect = false;

        const host = this.settings.host || 'localhost';
        const port = parseInt(this.settings.port) || 9001;
        const useSSL = this.settings.useSSL || false;

        // Proactive Security Alert
        if (window.location.protocol === 'https:' && !useSSL) {
            console.warn("[MqttDriver] Browser will block non-SSL WebSockets on an HTTPS page.");
            if (typeof CustomDialog !== 'undefined') {
                CustomDialog.alert("You are accessing the dashboard via HTTPS. Browser security will silently block the standard MQTT connection.\n\nPlease enable SSL/TLS in the settings below, or access the dashboard via a standard HTTP URL.", "MQTT Security Block");
            }
        }
        
        let clientId = this.settings.clientId;
        if (!clientId) {
            clientId = "dash_" + Math.random().toString(16).substr(2, 8);
        }

        console.log(`[MqttDriver] Connecting to ${host}:${port} (SSL: ${useSSL})...`);
        this.dispatchStatus(false, "LOADING LIB...");

        try {
            await this.loadDependency("https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js", "Paho");
        } catch (e) {
            console.error("[MqttDriver] Failed to load Paho MQTT library:", e);
            this.dispatchStatus(false, "LIB MISSING");
            this._scheduleReconnect();
            return;
        }

        try {
            if (typeof Paho === 'undefined') {
                console.error("Paho MQTT Library not loaded.");
                this.dispatchStatus(false, "LIB MISSING");
                this._scheduleReconnect();
                return;
            }

            this.client = new Paho.MQTT.Client(host, port, clientId);

            this.client.onConnectionLost = (responseObject) => this._onConnectionLost(responseObject);
            this.client.onMessageArrived = (message) => this._onMessageArrived(message);

            const connectOptions = {
                onSuccess: () => this._onConnect(),
                onFailure: (ctx) => this._onFail(ctx),
                useSSL: useSSL,
                keepAliveInterval: 30,
                timeout: 5
            };

            if (this.settings.username) connectOptions.userName = this.settings.username;
            if (this.settings.password) connectOptions.password = this.settings.password;

            this.dispatchStatus(false, "CONNECTING...");
            this.client.connect(connectOptions);

        } catch (e) {
            console.error("[MqttDriver] Init Error:", e);
            this.dispatchStatus(false, "INIT ERROR");
            this._scheduleReconnect();
        }
    }

    _teardownClient() {
        if (this.client) {
            this.client.onConnectionLost = () => {};
            this.client.onMessageArrived = () => {};
            try {
                this.client.disconnect();
            } catch (e) {
                // Ignored: Paho throws when already disconnected
            }
        }
        this.client = null;
        this.stats.connectedSince = null;

        this._clearReconnectTimer();
    }

    disconnect() {
        this.isIntentionalDisconnect = true;
        this._teardownClient();
        super.disconnect();
        this.dispatchStatus(false, "DISCONNECTED");
    }

    publish(topic, payload) {
        if (!this.client || !this.client.isConnected()) {
            console.warn("[MqttDriver] Cannot publish: Not connected.");
            return;
        }

        try {
            let payloadStr = payload;
            if (typeof payload === 'object') {
                payloadStr = JSON.stringify(payload);
            } else {
                payloadStr = String(payload);
            }

            const message = new Paho.MQTT.Message(payloadStr);
            message.destinationName = topic;
            this.client.send(message);
        } catch (e) {
            console.error("[MqttDriver] Publish failed:", e);
        }
    }

    updateSettings(newSettings) {
        const needsReconnect = 
            newSettings.host !== this.settings.host ||
            newSettings.port !== this.settings.port ||
            newSettings.useSSL !== this.settings.useSSL ||
            newSettings.username !== this.settings.username ||
            newSettings.password !== this.settings.password;

        const oldSub = this.settings.subTopic;
        this.settings = { ...this.settings, ...newSettings };

        if (needsReconnect) {
            this._teardownClient();
            this.connect();
        } else if (this.client && this.client.isConnected() && oldSub !== this.settings.subTopic) {
            console.log(`[MqttDriver] Updating subscription: ${oldSub} -> ${this.settings.subTopic}`);
            try {
                this.client.unsubscribe(oldSub);
                this.client.subscribe(this.settings.subTopic || '#');
            } catch(e) { console.warn("Sub update failed", e); }
        }
    }

    _scheduleReconnect() {
        if (this.isIntentionalDisconnect) return;

        console.log("[MqttDriver] Scheduling reconnect in 5s...");
        this.dispatchStatus(false, "RETRYING IN 5s...");

        // WorkerTimer: a native setTimeout can be starved 10-20s by browser throttling
        // (cold-start, background tab, modal loops), which would delay reconnect far
        // past the intended 5s. The worker-thread timer is not subject to that.
        if (this.reconnectTimer) this._clearReconnectTimer();
        if (typeof WorkerTimer !== 'undefined' && WorkerTimer && typeof WorkerTimer.setTimeout === 'function') {
            this.reconnectTimer = WorkerTimer.setTimeout(() => {
                console.log("[MqttDriver] Attempting Reconnect...");
                this.reconnectTimer = null;
                this.connect();
            }, 5000);
        } else {
            this.reconnectTimer = setTimeout(() => {
                console.log("[MqttDriver] Attempting Reconnect...");
                this.reconnectTimer = null;
                this.connect();
            }, 5000);
        }
    }

    _clearReconnectTimer() {
        if (!this.reconnectTimer) return;
        // WorkerTimer handles are objects; native setTimeout handles are numbers.
        if (typeof this.reconnectTimer === 'object' && typeof WorkerTimer !== 'undefined'
            && WorkerTimer && typeof WorkerTimer.clearTimeout === 'function') {
            WorkerTimer.clearTimeout(this.reconnectTimer);
        } else {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = null;
    }

    _onConnect() {
        console.log("[MqttDriver] Connected!");
        this._clearReconnectTimer();

        this.stats.connectedSince = Date.now();
        this.dispatchStatus(true, "CONNECTED");
        const topic = this.settings.subTopic || '#';
        this.client.subscribe(topic);
    }

    _onFail(responseObject) {
        console.error("[MqttDriver] Connection Failed:", responseObject.errorMessage);
        this.stats.connectedSince = null;
        this.dispatchStatus(false, "FAILED");
        this._scheduleReconnect();
    }

    _onConnectionLost(responseObject) {
        console.warn("[MqttDriver] Connection Lost:", responseObject.errorMessage);
        this.stats.connectedSince = null;
        
        if (responseObject.errorCode !== 0) {
            this.dispatchStatus(false, "LOST CONN");
            this._scheduleReconnect();
        } else {
            this.dispatchStatus(false, "DISCONNECTED");
        }
    }

    _onMessageArrived(message) {
        const topic = message.destinationName;
        let payload = message.payloadString;

        try {
            payload = JSON.parse(payload);
        } catch (e) {
            if (!isNaN(payload) && payload.trim() !== '') {
                payload = parseFloat(payload);
            }
        }

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

        this.dispatchMessage(topic, payload);
    }
}

DataDriverRegistry.register('mqtt', MqttDriver);