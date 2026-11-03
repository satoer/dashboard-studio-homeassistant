/**
 * Home Assistant Data Driver
 * Uses Socket.IO to communicate with the Dashboard Studio Home Assistant Backend.
 * Supports full file storage (dashboards, templates, widget presets, snapshot history),
 * image and audio galleries, real-time entity/helper/automation/scene state sync,
 * and both direct port and Home Assistant Ingress hosting.
 */
class HomeAssistantDriver extends DataDriver {
    static get metadata() {
        return {
            id: 'homeassistant',
            label: 'Home Assistant',
            description: 'Connects to the Dashboard Studio Home Assistant Backend via Socket.IO.'
        };
    }

    static get schema() {
        return [
            { key: 'homeassistantUrl', type: 'text', label: 'Server URL (Leave empty if hosted on HA)', default: '', cols: 12 }
        ];
    }

    constructor(settings) {
        super(settings);
        this.socket = null;
        this.topicMap = new Map();
        this.seenTopics = new Map();
        this.storageProvider = null;

        this.url = (settings && settings.homeassistantUrl) || (settings && settings.homeyUrl) || window.location.origin;

        this._socketPath = this._resolveSocketPath();
        this.loadSocketIO();
    }

    /**
     * Resolves the Socket.IO endpoint path so both direct port access (/) and
     * Home Assistant Ingress (/api/hassio_ingress/<token>/) route to the server.
     */
    _resolveSocketPath() {
        if (this.settings && this.settings.homeassistantUrl) {
            return '/socket.io';
        }
        var pathname = (typeof window !== 'undefined' && window.location && window.location.pathname)
            ? String(window.location.pathname)
            : '/';
        var basePath = pathname.replace(/\/(?:index|editor|viewer)\.html$/i, '');
        if (!basePath || basePath.slice(-1) !== '/') {
            basePath += '/';
        }
        return basePath + 'socket.io';
    }

    get supportsFileStorage() {
        return true;
    }

    getStorageProvider() {
        if (!this.storageProvider && this.socket) {
            this.storageProvider = new HomeAssistantStorageProvider(this.socket);
        }
        return this.storageProvider;
    }

    listImages() {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.isConnected) return reject(new Error('Not connected to Home Assistant'));
            const timeout = setTimeout(() => { cleanup(); reject(new Error('Timeout listing images')); }, 5000);
            const onResponse = (files) => { cleanup(); resolve(files); };
            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('image_list_response', onResponse);
            };
            this.socket.on('image_list_response', onResponse);
            this.socket.emit('image_list');
        });
    }

    uploadImage(name, base64Content) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.isConnected) return reject(new Error('Not connected to Home Assistant'));
            const timeout = setTimeout(() => { cleanup(); reject(new Error('Timeout uploading image')); }, 15000);
            const onSuccess = (res) => { if (res.op === 'upload' && res.name === name) { cleanup(); resolve(); } };
            const onError = (err) => { if (err.op === 'upload') { cleanup(); reject(new Error(err.message)); } };
            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('image_op_success', onSuccess);
                this.socket.off('image_op_error', onError);
            };
            this.socket.on('image_op_success', onSuccess);
            this.socket.on('image_op_error', onError);
            this.socket.emit('image_upload', { name: name, content: base64Content });
        });
    }

    deleteImage(name) {
        return this.deleteImages([name]);
    }

    deleteImages(names) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.isConnected) return reject(new Error('Not connected to Home Assistant'));
            const timeout = setTimeout(() => { cleanup(); reject(new Error('Timeout deleting images')); }, 10000);
            const onSuccess = (res) => { if (res.op === 'delete') { cleanup(); resolve(); } };
            const onError = (err) => { if (err.op === 'delete') { cleanup(); reject(new Error(err.message)); } };
            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('image_op_success', onSuccess);
                this.socket.off('image_op_error', onError);
            };
            this.socket.on('image_op_success', onSuccess);
            this.socket.on('image_op_error', onError);
            this.socket.emit('image_delete', { names: names, name: names[0] });
        });
    }

    renameImage(fromName, toName) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.isConnected) return reject(new Error('Not connected to Home Assistant'));
            const timeout = setTimeout(() => { cleanup(); reject(new Error('Timeout renaming image')); }, 10000);
            const onSuccess = (res) => {
                if (res.op === 'rename' && res.from === fromName) {
                    cleanup();
                    resolve(res.to);
                }
            };
            const onError = (err) => {
                if (err.op === 'rename') {
                    cleanup();
                    reject(new Error(err.message));
                }
            };
            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('image_op_success', onSuccess);
                this.socket.off('image_op_error', onError);
            };
            this.socket.on('image_op_success', onSuccess);
            this.socket.on('image_op_error', onError);
            this.socket.emit('image_rename', { from: fromName, to: toName });
        });
    }

    listAudio() {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.isConnected) return reject(new Error('Not connected to Home Assistant'));
            const timeout = setTimeout(() => { cleanup(); reject(new Error('Timeout listing audio')); }, 5000);
            const onResponse = (files) => { cleanup(); resolve(files); };
            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('audio_list_response', onResponse);
            };
            this.socket.on('audio_list_response', onResponse);
            this.socket.emit('audio_list');
        });
    }

    uploadAudio(name, base64Content) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.isConnected) return reject(new Error('Not connected to Home Assistant'));
            const timeout = setTimeout(() => { cleanup(); reject(new Error('Timeout uploading audio')); }, 30000);
            const onSuccess = (res) => { if (res.op === 'upload' && res.name === name) { cleanup(); resolve(); } };
            const onError = (err) => { if (err.op === 'upload') { cleanup(); reject(new Error(err.message)); } };
            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('audio_op_success', onSuccess);
                this.socket.off('audio_op_error', onError);
            };
            this.socket.on('audio_op_success', onSuccess);
            this.socket.on('audio_op_error', onError);
            this.socket.emit('audio_upload', { name: name, content: base64Content });
        });
    }

    deleteAudio(name) {
        return this.deleteAudioFiles([name]);
    }

    deleteAudioFiles(names) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.isConnected) return reject(new Error('Not connected to Home Assistant'));
            const timeout = setTimeout(() => { cleanup(); reject(new Error('Timeout deleting audio')); }, 10000);
            const onSuccess = (res) => { if (res.op === 'delete') { cleanup(); resolve(); } };
            const onError = (err) => { if (err.op === 'delete') { cleanup(); reject(new Error(err.message)); } };
            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('audio_op_success', onSuccess);
                this.socket.off('audio_op_error', onError);
            };
            this.socket.on('audio_op_success', onSuccess);
            this.socket.on('audio_op_error', onError);
            this.socket.emit('audio_delete', { names: names, name: names[0] });
        });
    }

    renameAudio(fromName, toName) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.isConnected) return reject(new Error('Not connected to Home Assistant'));
            const timeout = setTimeout(() => { cleanup(); reject(new Error('Timeout renaming audio')); }, 10000);
            const onSuccess = (res) => {
                if (res.op === 'rename' && res.from === fromName) {
                    cleanup();
                    resolve(res.to);
                }
            };
            const onError = (err) => {
                if (err.op === 'rename') {
                    cleanup();
                    reject(new Error(err.message));
                }
            };
            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('audio_op_success', onSuccess);
                this.socket.off('audio_op_error', onError);
            };
            this.socket.on('audio_op_success', onSuccess);
            this.socket.on('audio_op_error', onError);
            this.socket.emit('audio_rename', { from: fromName, to: toName });
        });
    }

    loadSocketIO() {
        if (window.io) {
            this.connect();
            return;
        }

        const scriptUrl = this.url
            ? (this.url.replace(/\/$/, '') + this._socketPath + '/socket.io.js')
            : (this._socketPath + '/socket.io.js');
        console.log('[HomeAssistantDriver] Loading Socket.IO from ' + scriptUrl + '...');

        this._loadSocketScript(scriptUrl, false);
    }

    _loadSocketScript(scriptUrl, isRetry) {
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.onload = () => {
            console.log('[HomeAssistantDriver] Socket.IO loaded.');
            this.connect();
        };
        script.onerror = (err) => {
            script.remove();
            if (!isRetry) {
                console.warn('[HomeAssistantDriver] Socket.IO script refused, retrying...');
                setTimeout(() => {
                    const retryUrl = scriptUrl + (scriptUrl.indexOf('?') >= 0 ? '&' : '?') + 'reload=' + Date.now();
                    this._loadSocketScript(retryUrl, true);
                }, 250);
                return;
            }
            console.error('[HomeAssistantDriver] Failed to load socket.io.js:', err);
            this.notifyStatus(false, 'Script Load Error');
        };
        document.head.appendChild(script);
    }

    /**
     * Emits for both the primary topic and its Home Assistant / Homey alias so widgets
     * bound to either homeassistant/... or homey/... (or legacy forms) receive updates.
     */
    _emitWithAlias(topic, value) {
        this.emitMessage(topic, value);
        if (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function') {
            const alias = HomeyTopicAlias.aliasOf(topic);
            if (alias) this.emitMessage(alias, value);
        }
        if (topic.indexOf('homey/') === 0) {
            const haAlias = 'homeassistant/' + topic.slice(6);
            this.emitMessage(haAlias, value);
        } else if (topic.indexOf('homeassistant/') === 0) {
            const homeyAlias = 'homey/' + topic.slice(14);
            this.emitMessage(homeyAlias, value);
        }
    }

    _recordTopicMeta(topic, data) {
        if (typeof Dashboard === 'undefined') return;
        if (!Dashboard.topicMeta) Dashboard.topicMeta = {};
        const meta = {
            setable: data.setable,
            getable: data.getable,
            min: data.min,
            max: data.max,
            title: data.title,
            units: data.units,
            isVariable: data.isVariable,
            isFlow: data.isFlow,
            isMood: data.isMood,
            zoneName: data.zoneName,
            type: data.type,
            domain: data.domain,
            entityId: data.entityId || data.deviceId
        };
        Dashboard.topicMeta[topic] = meta;
        if (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function') {
            const alias = HomeyTopicAlias.aliasOf(topic);
            if (alias) Dashboard.topicMeta[alias] = meta;
        }
        if (topic.indexOf('homey/') === 0) {
            Dashboard.topicMeta['homeassistant/' + topic.slice(6)] = meta;
        } else if (topic.indexOf('homeassistant/') === 0) {
            Dashboard.topicMeta['homey/' + topic.slice(14)] = meta;
        }
    }

    _registerTopic(topic, mapping, meta) {
        this.topicMap.set(topic, mapping);
        if (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function') {
            const alias = HomeyTopicAlias.aliasOf(topic);
            if (alias) this.topicMap.set(alias, mapping);
        }
        if (topic.indexOf('homey/') === 0) {
            this.topicMap.set('homeassistant/' + topic.slice(6), mapping);
        } else if (topic.indexOf('homeassistant/') === 0) {
            this.topicMap.set('homey/' + topic.slice(14), mapping);
        }
        this.seenTopics.set(topic, meta);
    }

    _applyMqttPayload(data) {
        if (!data || !data.topic) return;
        this._recordTopicMeta(data.topic, data);
        this._registerTopic(
            data.topic,
            { deviceId: data.deviceId, capabilityId: data.capabilityId },
            { deviceId: data.deviceId, capabilityId: data.capabilityId, lastValue: data.value, title: data.title }
        );
        this._emitWithAlias(data.topic, data.value);
    }

    _applyEventPayload(data) {
        if (!data || !data.name) return;
        const rawName = String(data.name).replace(/^(?:homey|homeassistant)\/events?\//i, '');
        const homeyTopic = 'homey/event/' + rawName;
        const haTopic = 'homeassistant/event/' + rawName;
        this._registerTopic(
            homeyTopic,
            { deviceId: 'dashboardstudio', capabilityId: rawName },
            { deviceId: 'dashboardstudio', capabilityId: rawName, lastValue: data.value }
        );
        this.topicMap.set(haTopic, { deviceId: 'dashboardstudio', capabilityId: rawName });
        this._emitWithAlias(homeyTopic, data.value);
    }

    _applyInsightPayload(payload) {
        if (!payload || !payload.name) return;
        const rawName = String(payload.name).replace(/^(?:homey|homeassistant)\/insights?\//i, '');
        const homeyTopic = 'homey/insight/' + rawName;
        const haTopic = 'homeassistant/insight/' + rawName;
        const val = Array.isArray(payload.data)
            ? payload.data.map((d) => [new Date(d.t).getTime(), d.v])
            : payload.data;
        this._registerTopic(
            homeyTopic,
            { deviceId: 'dashboardstudio', capabilityId: 'insight_' + rawName },
            { deviceId: 'dashboardstudio', capabilityId: 'insight_' + rawName, lastValue: val }
        );
        this.topicMap.set(haTopic, { deviceId: 'dashboardstudio', capabilityId: 'insight_' + rawName });
        this._emitWithAlias(homeyTopic, val);
    }

    _applyStateSnapshot(items) {
        if (!Array.isArray(items) || items.length === 0) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item || !item.data) continue;
            if (item.type === 'mqtt') {
                const d = item.data;
                if (!d.topic) continue;
                this._recordTopicMeta(d.topic, d);
                this._registerTopic(
                    d.topic,
                    { deviceId: d.deviceId, capabilityId: d.capabilityId },
                    { deviceId: d.deviceId, capabilityId: d.capabilityId, lastValue: d.value, title: d.title }
                );
            } else if (item.type === 'event') {
                const d = item.data;
                if (!d.name) continue;
                const rawName = String(d.name).replace(/^(?:homey|homeassistant)\/events?\//i, '');
                const topic = 'homey/event/' + rawName;
                this._registerTopic(
                    topic,
                    { deviceId: 'dashboardstudio', capabilityId: rawName },
                    { deviceId: 'dashboardstudio', capabilityId: rawName, lastValue: d.value }
                );
            } else if (item.type === 'insight') {
                const p = item.data;
                if (!p.name) continue;
                const rawName = String(p.name).replace(/^(?:homey|homeassistant)\/insights?\//i, '');
                const topic = 'homey/insight/' + rawName;
                const val = Array.isArray(p.data)
                    ? p.data.map((pt) => [new Date(pt.t).getTime(), pt.v])
                    : p.data;
                this._registerTopic(
                    topic,
                    { deviceId: 'dashboardstudio', capabilityId: 'insight_' + rawName },
                    { deviceId: 'dashboardstudio', capabilityId: 'insight_' + rawName, lastValue: val }
                );
            }
        }

        const hasBatch = typeof Dashboard !== 'undefined'
            && typeof Dashboard.beginStateBatch === 'function'
            && typeof Dashboard.endStateBatch === 'function';

        if (hasBatch) Dashboard.beginStateBatch();
        try {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (!item || !item.data) continue;
                if (item.type === 'mqtt') {
                    const d = item.data;
                    if (d.topic) this._emitWithAlias(d.topic, d.value);
                } else if (item.type === 'event') {
                    const d = item.data;
                    if (d.name) {
                        const rawName = String(d.name).replace(/^(?:homey|homeassistant)\/events?\//i, '');
                        this._emitWithAlias('homey/event/' + rawName, d.value);
                    }
                } else if (item.type === 'insight') {
                    const p = item.data;
                    if (p.name) {
                        const rawName = String(p.name).replace(/^(?:homey|homeassistant)\/insights?\//i, '');
                        const topic = 'homey/insight/' + rawName;
                        const cached = this.seenTopics.get(topic);
                        const val = cached ? cached.lastValue : p.data;
                        this._emitWithAlias(topic, val);
                    }
                }
            }
        } finally {
            if (hasBatch) Dashboard.endStateBatch();
        }
    }

    connect() {
        if (!window.io) return;

        if (this.socket) {
            this.disconnect();
        }

        console.log('[HomeAssistantDriver] Connecting to ' + this.url + ' (path: ' + this._socketPath + ')');
        this.socket = window.io(this.url, {
            path: this._socketPath
        });

        this.storageProvider = new HomeAssistantStorageProvider(this.socket);

        this.socket.on('connect', () => {
            console.log('[HomeAssistantDriver] Connected! ID:', this.socket.id);
            this.notifyStatus(true);
            this.requestStateSync();
            this._restoreOpenDashboardSession();
        });

        this.socket.on('disconnect', () => {
            console.warn('[HomeAssistantDriver] Disconnected');
            this.notifyStatus(false, 'Disconnected');
        });

        this.socket.on('connect_error', (err) => {
            console.error('[HomeAssistantDriver] Connection Error:', err.message);
            this.notifyStatus(false, 'Conn Error');
        });

        this.socket.on('state_snapshot', (items) => {
            this._applyStateSnapshot(items);
        });

        this.socket.on('mqtt_message', (data) => {
            this._applyMqttPayload(data);
        });

        this.socket.on('backend_log', (log) => {
            const colors = {
                SYSTEM: '#3b82f6',
                STORAGE: '#10b981',
                FLOW: '#f59e0b',
                AUTOMATION: '#f59e0b',
                SCENE: '#ec4899',
                MOOD: '#ec4899',
                ACTION: '#8b5cf6',
                INSIGHTS: '#06b6d4',
                ERROR: '#ef4444',
                SECURITY: '#f97316'
            };
            const color = colors[log.type] || '#9ca3af';
            console.log('%c[HA ' + log.type + ']%c ' + log.message, 'color: ' + color + '; font-weight: bold;', 'color: inherit;');
        });

        this.socket.on('dashboard_event', (data) => {
            console.log('[HomeAssistantDriver] Received Event:', data);
            this._applyEventPayload(data);
        });

        this.socket.on('dashboard_insight', (payload) => {
            console.log('[HomeAssistantDriver] Received Insight:', payload.name, payload.range, 'Points:', payload.data ? payload.data.length : 0);
            this._applyInsightPayload(payload);
        });

        this.socket.on('reload_dashboard', (data) => {
            console.log('[HomeAssistantDriver] Received Reload Command:', data);
            if (!data || !data.name) return;

            const targetName = data.name.toLowerCase();
            let currentName = '';

            if (typeof Dashboard !== 'undefined' && Dashboard.activeFileName) {
                currentName = Dashboard.activeFileName.toLowerCase();
            } else {
                const params = new URLSearchParams(window.location.search);
                const cfg = params.get('dashboard') || params.get('cfg') || 'dashboard';
                currentName = cfg.replace(/\.json$/i, '').toLowerCase();
            }

            if (targetName === 'all' || targetName === currentName) {
                console.log('[HomeAssistantDriver] Reloading dashboard (' + currentName + ')...');
                window.location.reload();
            }
        });

        this.socket.on('settings_updated', (newSettings) => {
            console.log('[HomeAssistantDriver] Settings updated from backend:', newSettings);
            if (window.APP_CONFIG && newSettings && typeof newSettings === 'object') {
                if (!window.APP_CONFIG.defaults) window.APP_CONFIG.defaults = {};
                if (newSettings.hideEditor !== undefined) {
                    window.APP_CONFIG.defaults.hideEditor = newSettings.hideEditor;
                } else if (newSettings.hideEditButton !== undefined) {
                    window.APP_CONFIG.defaults.hideEditor = newSettings.hideEditButton;
                }
                delete window.APP_CONFIG.defaults.hideEditButton;
                if (newSettings.keepDashboardFileHistory !== undefined) {
                    window.APP_CONFIG.defaults.keepDashboardFileHistory = newSettings.keepDashboardFileHistory;
                }
                if (newSettings.dashboardFileHistoryMax !== undefined) {
                    let hm = parseInt(newSettings.dashboardFileHistoryMax, 10);
                    if (!isNaN(hm)) {
                        window.APP_CONFIG.defaults.dashboardFileHistoryMax = Math.min(50, Math.max(1, hm));
                    }
                }
                if (newSettings.cacheValues !== undefined) {
                    window.APP_CONFIG.defaults.cacheValues = newSettings.cacheValues;
                }
                if (newSettings.warnWhenDriverOffline !== undefined) {
                    if (!window.APP_CONFIG.ui) window.APP_CONFIG.ui = {};
                    window.APP_CONFIG.ui.warnWhenDriverOffline = newSettings.warnWhenDriverOffline;
                }
                if (typeof Dashboard !== 'undefined') {
                    if (typeof Dashboard.applyUIConfig === 'function') Dashboard.applyUIConfig();
                    if (typeof Dashboard._syncDriverOfflineWarning === 'function') Dashboard._syncDriverOfflineWarning();
                }
            }
        });
    }

    sendLoadNotification(dashboardName, pageNum) {
        if (!dashboardName) return;
        const payload = { name: dashboardName };
        if (pageNum !== undefined && pageNum !== null) {
            const p = parseInt(pageNum, 10);
            if (!isNaN(p) && p >= 1) payload.page = p;
        }
        if (this.socket && this.isConnected) {
            console.log('[HomeAssistantDriver] Sending Load Notification: ' + dashboardName);
            this.socket.emit('dashboard_loaded', payload);
        } else if (this.socket) {
            this.socket.once('connect', () => {
                console.log('[HomeAssistantDriver] Sending Queued Load Notification: ' + dashboardName);
                this.socket.emit('dashboard_loaded', payload);
            });
        }
    }

    sendPageNotification(dashboardName, pageNum, opts) {
        const page = parseInt(pageNum, 10);
        if (isNaN(page) || page < 1) return;
        const payload = { name: dashboardName || null, page: page };
        if (opts && opts.restore) payload.restore = true;
        if (this.socket && this.isConnected) {
            this.socket.emit('dashboard_page', payload);
        } else if (this.socket) {
            this.socket.once('connect', () => {
                this.socket.emit('dashboard_page', payload);
            });
        }
    }

    _restoreOpenDashboardSession() {
        if (typeof Dashboard === 'undefined') return;
        const name = Dashboard.activeFileName ? String(Dashboard.activeFileName).replace(/\.json$/i, '') : null;
        if (!name) return;
        const page = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.currentPage != null)
            ? Math.max(1, parseInt(String(MASTER_SETTINGS.currentPage), 10) || 1)
            : 1;
        this.sendPageNotification(name, page, { restore: true });
    }

    sendSaveNotification(dashboardName) {
        if (this.socket && this.isConnected) {
            console.log('[HomeAssistantDriver] Sending Save Notification: ' + dashboardName);
            this.socket.emit('dashboard_saved', { name: dashboardName });
        }
    }

    requestStateSync(onAck) {
        if (this.socket && this.isConnected) {
            if (typeof onAck === 'function') {
                this.socket.emit('request_state_sync', null, onAck);
            } else {
                this.socket.emit('request_state_sync');
            }
        }
    }

    resumeConnection(announceDashboardName, pageNum) {
        if (!window.io) {
            this.loadSocketIO();
            return;
        }
        if (!this.socket) {
            this.connect();
            if (announceDashboardName) this.sendLoadNotification(announceDashboardName, pageNum);
            return;
        }
        if (!this.socket.connected) {
            if (announceDashboardName) this.sendLoadNotification(announceDashboardName, pageNum);
            try { this.socket.connect(); } catch (e) { this.connect(); }
            return;
        }

        const sock = this.socket;
        let settled = false;
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            if (this.socket !== sock) return;
            console.warn('[HomeAssistantDriver] Socket unresponsive after resume; reconnecting...');
            if (announceDashboardName) {
                this.socket.once('connect', () => {
                    this.sendLoadNotification(announceDashboardName, pageNum);
                });
            }
            try {
                sock.disconnect();
                sock.connect();
            } catch (e) {
                this.connect();
            }
        }, 1500);

        if (announceDashboardName) {
            this.sendLoadNotification(announceDashboardName, pageNum);
        }
        this.requestStateSync(() => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    publish(topic, payload) {
        if (!this.socket || !this.isConnected) {
            console.warn('[HomeAssistantDriver] Cannot publish, disconnected.');
            return;
        }

        let target = this.topicMap.get(topic);
        if (!target && typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function') {
            const alias = HomeyTopicAlias.aliasOf(topic);
            if (alias) target = this.topicMap.get(alias);
        }
        if (!target) {
            if (topic.indexOf('homeassistant/') === 0) {
                target = this.topicMap.get('homey/' + topic.slice(14));
            } else if (topic.indexOf('homey/') === 0) {
                target = this.topicMap.get('homeassistant/' + topic.slice(6));
            }
        }

        if (target) {
            console.log('[HomeAssistantDriver] Setting State: ' + topic + ' -> ' + target.deviceId + '.' + target.capabilityId + ' = ' + payload);
            this.socket.emit('set_state', {
                deviceId: target.deviceId,
                capabilityId: target.capabilityId,
                value: payload
            });
            return;
        }

        // Direct entity_id/attribute fallback (e.g. "light.living_room/onoff" or "homeassistant/flow/my_trigger")
        const cleanTopic = topic
            .replace(/^(?:homey|homeassistant)\/events?\//i, '')
            .replace(/^(?:homey|homeassistant)\/flows?\//i, '');
        console.log('[HomeAssistantDriver] Triggering Automation Event: ' + cleanTopic + ' = ' + payload);
        this.socket.emit('dashboard_trigger', {
            name: cleanTopic,
            value: payload
        });
    }
}

class HomeAssistantStorageProvider extends StorageProvider {
    constructor(socket) {
        super();
        this.socket = socket;
    }

    get id() { return 'homeassistant'; }
    get label() { return 'Home Assistant Storage'; }

    list(type) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.socket.connected) {
                return reject(new Error('Not connected to Home Assistant'));
            }

            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Request timed out'));
            }, 5000);

            const onResponse = (data) => {
                if (data.type === type) {
                    cleanup();
                    resolve(data.files || []);
                }
            };

            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('file_list_response', onResponse);
            };

            this.socket.on('file_list_response', onResponse);
            this.socket.emit('file_list', { type: type });
        });
    }

    save(type, name, data) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.socket.connected) {
                return reject(new Error('Not connected to Home Assistant'));
            }

            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Save timed out'));
            }, 5000);

            const onSuccess = (res) => {
                if (res.op === 'save' && res.type === type && res.name === name) {
                    cleanup();
                    resolve();
                }
            };

            const onError = (err) => {
                if (err.op === 'save') {
                    cleanup();
                    reject(new Error(err.message));
                }
            };

            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('file_op_success', onSuccess);
                this.socket.off('file_op_error', onError);
            };

            this.socket.on('file_op_success', onSuccess);
            this.socket.on('file_op_error', onError);

            this.socket.emit('file_save', { type: type, name: name, content: data });
        });
    }

    load(type, name) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.socket.connected) {
                return reject(new Error('Not connected to Home Assistant'));
            }

            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Load timed out'));
            }, 5000);

            const onResponse = (res) => {
                if (res.type === type && res.name === name) {
                    cleanup();
                    resolve(res.content);
                }
            };

            const onError = (err) => {
                if (err.op === 'load') {
                    cleanup();
                    reject(new Error(err.message));
                }
            };

            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('file_load_response', onResponse);
                this.socket.off('file_op_error', onError);
            };

            this.socket.on('file_load_response', onResponse);
            this.socket.on('file_op_error', onError);

            this.socket.emit('file_load', { type: type, name: name });
        });
    }

    delete(type, name) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.socket.connected) {
                return reject(new Error('Not connected to Home Assistant'));
            }

            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Delete timed out'));
            }, 5000);

            const onSuccess = (res) => {
                if (res.op === 'delete' && res.type === type && res.name === name) {
                    cleanup();
                    resolve();
                }
            };

            const onError = (err) => {
                if (err.op === 'delete') {
                    cleanup();
                    reject(new Error(err.message));
                }
            };

            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('file_op_success', onSuccess);
                this.socket.off('file_op_error', onError);
            };

            this.socket.on('file_op_success', onSuccess);
            this.socket.on('file_op_error', onError);

            this.socket.emit('file_delete', { type: type, name: name });
        });
    }

    listHistory(type, baseName) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.socket.connected) {
                return reject(new Error('Not connected to Home Assistant'));
            }
            const reqId = String(Date.now()) + '_' + Math.random().toString(36).slice(2);
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('History list timed out'));
            }, 8000);
            const onResponse = (data) => {
                if (data && data.reqId === reqId) {
                    cleanup();
                    resolve(data.items || []);
                }
            };
            const onError = (err) => {
                if (err && err.op === 'list' && (!err.reqId || err.reqId === reqId)) {
                    cleanup();
                    reject(new Error(err.message || 'History list failed'));
                }
            };
            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('file_history_list_response', onResponse);
                this.socket.off('file_history_error', onError);
            };
            this.socket.on('file_history_list_response', onResponse);
            this.socket.on('file_history_error', onError);
            this.socket.emit('file_history_list', { type: type, baseName: baseName, reqId: reqId });
        });
    }

    peekVersion(type, name) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.socket.connected) {
                return reject(new Error('Not connected to Home Assistant'));
            }
            const reqId = String(Date.now()) + '_' + Math.random().toString(36).slice(2);
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Version peek timed out'));
            }, 8000);
            const onResponse = (data) => {
                if (data && data.reqId === reqId) {
                    cleanup();
                    resolve(data.version || '1.0.0');
                }
            };
            const onError = (err) => {
                if (err && err.op === 'peek' && (!err.reqId || err.reqId === reqId)) {
                    cleanup();
                    reject(new Error(err.message || 'Version peek failed'));
                }
            };
            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('file_history_peek_response', onResponse);
                this.socket.off('file_history_error', onError);
            };
            this.socket.on('file_history_peek_response', onResponse);
            this.socket.on('file_history_error', onError);
            this.socket.emit('file_history_peek', { type: type, name: name, reqId: reqId });
        });
    }

    clearHistory(type, baseName) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.socket.connected) {
                return reject(new Error('Not connected to Home Assistant'));
            }
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Clear history timed out'));
            }, 15000);
            const onResponse = (data) => {
                if (data && data.type === type && data.baseName === baseName) {
                    cleanup();
                    resolve();
                }
            };
            const onError = (err) => {
                if (err && err.op === 'clear') {
                    cleanup();
                    reject(new Error(err.message || 'Clear history failed'));
                }
            };
            const cleanup = () => {
                clearTimeout(timeout);
                this.socket.off('file_history_clear_response', onResponse);
                this.socket.off('file_history_error', onError);
            };
            this.socket.on('file_history_clear_response', onResponse);
            this.socket.on('file_history_error', onError);
            this.socket.emit('file_history_clear', { type: type, baseName: baseName });
        });
    }
}

DataDriverRegistry.register('homeassistant', HomeAssistantDriver);
