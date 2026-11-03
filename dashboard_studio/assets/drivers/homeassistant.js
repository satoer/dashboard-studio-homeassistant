function applyHomeAssistantAppSettingsFromSocket(payload) {
    if (!payload || typeof payload !== 'object' || !window.APP_CONFIG || !window.APP_CONFIG.defaults) return;
    var d = window.APP_CONFIG.defaults;
    if (payload.hideEditor !== undefined) {
        d.hideEditor = payload.hideEditor;
    } else if (payload.hideEditButton !== undefined) {
        d.hideEditor = payload.hideEditButton;
    }
    if (payload.keepDashboardFileHistory !== undefined) d.keepDashboardFileHistory = payload.keepDashboardFileHistory;
    if (payload.dashboardFileHistoryMax !== undefined) {
        var n = parseInt(payload.dashboardFileHistoryMax, 10);
        if (!isNaN(n)) d.dashboardFileHistoryMax = Math.min(50, Math.max(1, n));
    }
    if (d.dashboardFileHistoryMax === undefined) {
        d.dashboardFileHistoryMax = 10;
    }
    if (payload.cacheValues !== undefined) d.cacheValues = payload.cacheValues;
    if (payload.warnWhenDriverOffline !== undefined && window.APP_CONFIG.ui) {
        window.APP_CONFIG.ui.warnWhenDriverOffline = payload.warnWhenDriverOffline;
    }
    if (payload.requireToken !== undefined) {
        window.APP_CONFIG.requireToken = payload.requireToken;
    }
    if (payload.securityToken !== undefined) {
        window.APP_CONFIG.securityToken = payload.securityToken;
    }
    if (typeof Dashboard !== 'undefined') {
        if (typeof Dashboard.applyUIConfig === 'function') Dashboard.applyUIConfig();
        if (typeof Dashboard._syncDriverOfflineWarning === 'function') Dashboard._syncDriverOfflineWarning();
        if (typeof Dashboard.updateViewerUrlIndicator === 'function') Dashboard.updateViewerUrlIndicator();
    }
}

/**
 * Home Assistant Data Driver
 * Uses Socket.IO to communicate with the Dashboard Studio Home Assistant Backend.
 * Supports file storage (dashboards, templates, widget presets, snapshot history),
 * image and audio galleries, real-time device/entity/helper/automation/scene state sync,
 * and both direct port and Home Assistant Ingress hosting.
 */
class HomeAssistantDriver extends BaseDataDriver {
    static get metadata() {
        return {
            id: 'homeassistant',
            label: 'Home Assistant',
            description: 'Native connection to Dashboard Studio Home Assistant Backend'
        };
    }

    static get schema() {
        return [
            { key: 'homeassistantUrl', type: 'text', label: 'Server URL (Leave empty if hosted on HA)', default: '', cols: 12 },
            { key: 'stats_panel', type: 'driver_stats', label: 'Statistics', cols: 12 },
            { key: 'monitor_panel', type: 'topic_monitor', label: 'Live Monitor', cols: 12 }
        ];
    }

    get supportsFileStorage() {
        return true;
    }

    constructor(settings) {
        super(settings);
        this.socket = null;
        this.stats = {
            msgCount: 0,
            connectedSince: null,
            lastTopic: null
        };
        this.seenTopics = new Map();

        this.pendingLoadNotification = null;
        this._stateSyncProbeTimer = null;
        this._lastForcedReconnectAt = 0;

        this.topicMap = new Map();
        this.deviceCache = [];

        this.url = (settings && settings.homeassistantUrl)
            ? String(settings.homeassistantUrl).trim().replace(/\/+$/, '')
            : '';
        this._socketPath = this._resolveSocketPath();

        var self = this;
        this.storageProvider = {
            id: 'homeassistant',
            label: 'Home Assistant Storage',

            init: function () { return Promise.resolve(); },

            _fixType: function (t) {
                return t === 'dashboard' ? 'dashboards' : (t === 'template' ? 'templates' : t);
            },

            _setTimeout: function (fn, ms) {
                return (typeof WorkerTimer !== 'undefined' && WorkerTimer.setTimeout
                    ? WorkerTimer.setTimeout : setTimeout)(fn, ms);
            },

            _clearTimeout: function (id) {
                if (!id) return;
                if (typeof WorkerTimer !== 'undefined' && WorkerTimer.clearTimeout) {
                    WorkerTimer.clearTimeout(id);
                } else {
                    clearTimeout(id);
                }
            },

            list: function (type) {
                var fixedType = self.storageProvider._fixType(type);
                return new Promise(function (resolve, reject) {
                    if (!self.socket) return reject(new Error('Not connected'));
                    var timerId = null;
                    self.socket.emit('file_list', { type: fixedType });

                    var onResponse = function (data) {
                        if (data && data.type === fixedType) {
                            self.storageProvider._clearTimeout(timerId);
                            if (self.socket) self.socket.off('file_list_response', onResponse);
                            var files = Array.isArray(data.files) ? data.files : [];
                            resolve(files.map(function (f) {
                                if (typeof f === 'object' && f !== null) {
                                    return {
                                        name: f.name,
                                        id: f.name,
                                        source: f.source,
                                        snapshotCount: typeof f.snapshotCount === 'number' ? f.snapshotCount : 0,
                                        widgetType: f.widgetType,
                                        presetName: f.presetName,
                                        fileId: f.fileId || f.presetName,
                                        displayName: f.displayName,
                                        variantCount: typeof f.variantCount === 'number' ? f.variantCount : undefined
                                    };
                                }
                                return { name: f, id: f, source: 'user', snapshotCount: 0 };
                            }));
                        }
                    };
                    self.socket.on('file_list_response', onResponse);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (self.socket) self.socket.off('file_list_response', onResponse);
                        reject(new Error('Timeout listing files'));
                    }, 5000);
                });
            },

            save: function (type, name, data) {
                var fixedType = self.storageProvider._fixType(type);
                return new Promise(function (resolve, reject) {
                    var done = false;
                    var timerId = null;
                    if (!self.socket) return reject(new Error('Not connected'));
                    self.socket.emit('file_save', { type: fixedType, name: name, content: data });

                    var onSuccess = function (d) {
                        if (d && d.op === 'save' && d.name === name) {
                            cleanup();
                            resolve();
                        }
                    };
                    var onError = function (d) {
                        if (d && d.op === 'save') {
                            cleanup();
                            reject(new Error(d.message));
                        }
                    };
                    var cleanup = function () {
                        done = true;
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('file_op_success', onSuccess);
                        self.socket.off('file_op_error', onError);
                    };

                    self.socket.on('file_op_success', onSuccess);
                    self.socket.on('file_op_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (done) return;
                        cleanup();
                        reject(new Error('Timeout saving file'));
                    }, 15000);
                });
            },

            load: function (type, name) {
                var fixedType = self.storageProvider._fixType(type);
                return new Promise(function (resolve, reject) {
                    var done = false;
                    var timerId = null;
                    if (!self.socket) return reject(new Error('Not connected'));
                    self.socket.emit('file_load', { type: fixedType, name: name });

                    var onResponse = function (data) {
                        if (data && data.type === fixedType && data.name === name) {
                            cleanup();
                            resolve(data.content);
                        }
                    };
                    var onError = function (data) {
                        if (data && data.op === 'load') {
                            cleanup();
                            reject(new Error(data.message));
                        }
                    };
                    var cleanup = function () {
                        done = true;
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('file_load_response', onResponse);
                        self.socket.off('file_op_error', onError);
                    };

                    self.socket.on('file_load_response', onResponse);
                    self.socket.on('file_op_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (done) return;
                        cleanup();
                        reject(new Error('Timeout loading file'));
                    }, 15000);
                });
            },

            delete: function (type, name) {
                var fixedType = self.storageProvider._fixType(type);
                return new Promise(function (resolve, reject) {
                    var done = false;
                    var timerId = null;
                    if (!self.socket) return reject(new Error('Not connected'));
                    self.socket.emit('file_delete', { type: fixedType, name: name });

                    var onSuccess = function (d) {
                        if (d && d.op === 'delete' && d.name === name) {
                            cleanup();
                            resolve();
                        }
                    };
                    var onError = function (d) {
                        if (d && d.op === 'delete') {
                            cleanup();
                            reject(new Error(d.message));
                        }
                    };
                    var cleanup = function () {
                        done = true;
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('file_op_success', onSuccess);
                        self.socket.off('file_op_error', onError);
                    };

                    self.socket.on('file_op_success', onSuccess);
                    self.socket.on('file_op_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (done) return;
                        cleanup();
                        reject(new Error('Timeout deleting file'));
                    }, 15000);
                });
            },

            listImages: function () {
                return new Promise(function (resolve, reject) {
                    if (!self.socket) return reject(new Error('Not connected'));
                    var timerId = null;
                    self.socket.emit('image_list');

                    var onResponse = function (files) {
                        self.storageProvider._clearTimeout(timerId);
                        if (self.socket) self.socket.off('image_list_response', onResponse);
                        resolve(files);
                    };
                    self.socket.on('image_list_response', onResponse);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (self.socket) self.socket.off('image_list_response', onResponse);
                        reject(new Error('Timeout listing images'));
                    }, 5000);
                });
            },

            saveImage: function (name, contentBase64) {
                return new Promise(function (resolve, reject) {
                    var done = false;
                    var timerId = null;
                    if (!self.socket) return reject(new Error('Not connected'));
                    self.socket.emit('image_upload', { name: name, content: contentBase64 });

                    var onSuccess = function (d) {
                        if (d && d.op === 'upload' && d.name === name) {
                            cleanup();
                            resolve();
                        }
                    };
                    var onError = function (d) {
                        if (d && d.op === 'upload') {
                            cleanup();
                            reject(new Error(d.message));
                        }
                    };
                    var cleanup = function () {
                        done = true;
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('image_op_success', onSuccess);
                        self.socket.off('image_op_error', onError);
                    };
                    self.socket.on('image_op_success', onSuccess);
                    self.socket.on('image_op_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (done) return;
                        cleanup();
                        reject(new Error('Timeout saving image'));
                    }, 30000);
                });
            },

            deleteImage: function (name) {
                return new Promise(function (resolve, reject) {
                    var done = false;
                    var timerId = null;
                    if (!self.socket) return reject(new Error('Not connected'));
                    self.socket.emit('image_delete', { name: name });

                    var onSuccess = function (d) {
                        if (d && d.op === 'delete') {
                            cleanup();
                            resolve();
                        }
                    };
                    var onError = function (d) {
                        if (d && d.op === 'delete') {
                            cleanup();
                            reject(new Error(d.message));
                        }
                    };
                    var cleanup = function () {
                        done = true;
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('image_op_success', onSuccess);
                        self.socket.off('image_op_error', onError);
                    };
                    self.socket.on('image_op_success', onSuccess);
                    self.socket.on('image_op_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (done) return;
                        cleanup();
                        reject(new Error('Timeout deleting image'));
                    }, 30000);
                });
            },

            deleteImages: function (names) {
                var list = Array.isArray(names) ? names.filter(Boolean) : (names ? [names] : []);
                if (list.length === 0) return Promise.resolve();
                return new Promise(function (resolve, reject) {
                    var done = false;
                    var timerId = null;
                    if (!self.socket) return reject(new Error('Not connected'));
                    self.socket.emit('image_delete', { names: list });

                    var onSuccess = function (d) {
                        if (d && d.op === 'delete') {
                            cleanup();
                            resolve();
                        }
                    };
                    var onError = function (d) {
                        if (d && d.op === 'delete') {
                            cleanup();
                            reject(new Error(d.message));
                        }
                    };
                    var cleanup = function () {
                        done = true;
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('image_op_success', onSuccess);
                        self.socket.off('image_op_error', onError);
                    };
                    self.socket.on('image_op_success', onSuccess);
                    self.socket.on('image_op_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (done) return;
                        cleanup();
                        reject(new Error('Timeout deleting images'));
                    }, 30000);
                });
            },

            renameImage: function (from, to) {
                return new Promise(function (resolve, reject) {
                    var done = false;
                    var timerId = null;
                    if (!self.socket) return reject(new Error('Not connected'));
                    self.socket.emit('image_rename', { from: from, to: to });

                    var onSuccess = function (d) {
                        if (d && d.op === 'rename' && d.from === from) {
                            cleanup();
                            resolve(d.to);
                        }
                    };
                    var onError = function (d) {
                        if (d && d.op === 'rename') {
                            cleanup();
                            reject(new Error(d.message));
                        }
                    };
                    var cleanup = function () {
                        done = true;
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('image_op_success', onSuccess);
                        self.socket.off('image_op_error', onError);
                    };
                    self.socket.on('image_op_success', onSuccess);
                    self.socket.on('image_op_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (done) return;
                        cleanup();
                        reject(new Error('Timeout renaming image'));
                    }, 30000);
                });
            },

            listAudio: function () {
                return new Promise(function (resolve, reject) {
                    if (!self.socket) return reject(new Error('Not connected'));
                    var timerId = null;
                    self.socket.emit('audio_list');

                    var onResponse = function (files) {
                        self.storageProvider._clearTimeout(timerId);
                        if (self.socket) self.socket.off('audio_list_response', onResponse);
                        resolve(files);
                    };
                    self.socket.on('audio_list_response', onResponse);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (self.socket) self.socket.off('audio_list_response', onResponse);
                        reject(new Error('Timeout listing audio'));
                    }, 5000);
                });
            },

            saveAudio: function (name, contentBase64) {
                return new Promise(function (resolve, reject) {
                    var done = false;
                    var timerId = null;
                    if (!self.socket) return reject(new Error('Not connected'));
                    self.socket.emit('audio_upload', { name: name, content: contentBase64 });

                    var onSuccess = function (d) {
                        if (d && d.op === 'upload' && d.name === name) {
                            cleanup();
                            resolve();
                        }
                    };
                    var onError = function (d) {
                        if (d && d.op === 'upload') {
                            cleanup();
                            reject(new Error(d.message));
                        }
                    };
                    var cleanup = function () {
                        done = true;
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('audio_op_success', onSuccess);
                        self.socket.off('audio_op_error', onError);
                    };
                    self.socket.on('audio_op_success', onSuccess);
                    self.socket.on('audio_op_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (done) return;
                        cleanup();
                        reject(new Error('Timeout saving audio'));
                    }, 30000);
                });
            },

            deleteAudio: function (name) {
                return new Promise(function (resolve, reject) {
                    var done = false;
                    var timerId = null;
                    if (!self.socket) return reject(new Error('Not connected'));
                    self.socket.emit('audio_delete', { name: name });

                    var onSuccess = function (d) {
                        if (d && d.op === 'delete') {
                            cleanup();
                            resolve();
                        }
                    };
                    var onError = function (d) {
                        if (d && d.op === 'delete') {
                            cleanup();
                            reject(new Error(d.message));
                        }
                    };
                    var cleanup = function () {
                        done = true;
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('audio_op_success', onSuccess);
                        self.socket.off('audio_op_error', onError);
                    };
                    self.socket.on('audio_op_success', onSuccess);
                    self.socket.on('audio_op_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (done) return;
                        cleanup();
                        reject(new Error('Timeout deleting audio'));
                    }, 30000);
                });
            },

            deleteAudioFiles: function (names) {
                var list = Array.isArray(names) ? names.filter(Boolean) : (names ? [names] : []);
                if (list.length === 0) return Promise.resolve();
                return new Promise(function (resolve, reject) {
                    var done = false;
                    var timerId = null;
                    if (!self.socket) return reject(new Error('Not connected'));
                    self.socket.emit('audio_delete', { names: list });

                    var onSuccess = function (d) {
                        if (d && d.op === 'delete') {
                            cleanup();
                            resolve();
                        }
                    };
                    var onError = function (d) {
                        if (d && d.op === 'delete') {
                            cleanup();
                            reject(new Error(d.message));
                        }
                    };
                    var cleanup = function () {
                        done = true;
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('audio_op_success', onSuccess);
                        self.socket.off('audio_op_error', onError);
                    };
                    self.socket.on('audio_op_success', onSuccess);
                    self.socket.on('audio_op_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (done) return;
                        cleanup();
                        reject(new Error('Timeout deleting audio'));
                    }, 30000);
                });
            },

            renameAudio: function (from, to) {
                return new Promise(function (resolve, reject) {
                    var done = false;
                    var timerId = null;
                    if (!self.socket) return reject(new Error('Not connected'));
                    self.socket.emit('audio_rename', { from: from, to: to });

                    var onSuccess = function (d) {
                        if (d && d.op === 'rename' && d.from === from) {
                            cleanup();
                            resolve(d.to);
                        }
                    };
                    var onError = function (d) {
                        if (d && d.op === 'rename') {
                            cleanup();
                            reject(new Error(d.message));
                        }
                    };
                    var cleanup = function () {
                        done = true;
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('audio_op_success', onSuccess);
                        self.socket.off('audio_op_error', onError);
                    };
                    self.socket.on('audio_op_success', onSuccess);
                    self.socket.on('audio_op_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        if (done) return;
                        cleanup();
                        reject(new Error('Timeout renaming audio'));
                    }, 30000);
                });
            },

            listHistory: function (type, baseName) {
                var fixedType = self.storageProvider._fixType(type);
                return new Promise(function (resolve, reject) {
                    if (!self.socket) return reject(new Error('Not connected'));
                    var timerId = null;
                    var reqId = 'hl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
                    self.socket.emit('file_history_list', { type: fixedType, baseName: baseName, reqId: reqId });

                    var onResponse = function (data) {
                        if (data && data.reqId === reqId && data.type === fixedType && data.baseName === baseName) {
                            cleanup();
                            resolve(Array.isArray(data.items) ? data.items : []);
                        }
                    };
                    var onError = function (data) {
                        if (data && data.reqId === reqId) {
                            cleanup();
                            reject(new Error((data && data.message) || 'History list failed'));
                        }
                    };
                    var cleanup = function () {
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('file_history_list_response', onResponse);
                        self.socket.off('file_history_error', onError);
                    };

                    self.socket.on('file_history_list_response', onResponse);
                    self.socket.on('file_history_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        cleanup();
                        reject(new Error('Timeout listing history'));
                    }, 5000);
                });
            },

            peekFileVersion: function (type, name) {
                var fixedType = self.storageProvider._fixType(type);
                return new Promise(function (resolve, reject) {
                    if (!self.socket) return reject(new Error('Not connected'));
                    var timerId = null;
                    var reqId = 'hp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
                    self.socket.emit('file_history_peek', { type: fixedType, name: name, reqId: reqId });

                    var onResponse = function (data) {
                        if (data && data.reqId === reqId && data.type === fixedType && data.name === name) {
                            cleanup();
                            resolve(typeof data.version === 'string' ? data.version : '1.0.0');
                        }
                    };
                    var onError = function (data) {
                        if (data && data.reqId === reqId) {
                            cleanup();
                            reject(new Error((data && data.message) || 'Peek failed'));
                        }
                    };
                    var cleanup = function () {
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('file_history_peek_response', onResponse);
                        self.socket.off('file_history_error', onError);
                    };

                    self.socket.on('file_history_peek_response', onResponse);
                    self.socket.on('file_history_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        cleanup();
                        reject(new Error('Timeout peeking file'));
                    }, 5000);
                });
            },

            clearHistory: function (type, baseName) {
                var fixedType = self.storageProvider._fixType(type);
                return new Promise(function (resolve, reject) {
                    if (!self.socket) return reject(new Error('Not connected'));
                    var timerId = null;
                    self.socket.emit('file_history_clear', { type: fixedType, baseName: baseName });

                    var onResponse = function (data) {
                        if (data && data.type === fixedType && data.baseName === baseName) {
                            cleanup();
                            resolve();
                        }
                    };
                    var onError = function (data) {
                        cleanup();
                        reject(new Error((data && data.message) || 'Clear history failed'));
                    };
                    var cleanup = function () {
                        self.storageProvider._clearTimeout(timerId);
                        if (!self.socket) return;
                        self.socket.off('file_history_clear_response', onResponse);
                        self.socket.off('file_history_error', onError);
                    };

                    self.socket.on('file_history_clear_response', onResponse);
                    self.socket.on('file_history_error', onError);
                    timerId = self.storageProvider._setTimeout(function () {
                        cleanup();
                        reject(new Error('Timeout clearing history'));
                    }, 5000);
                });
            }
        };
    }

    /**
     * Resolves the Socket.IO endpoint path so both direct port access (/) and
     * Home Assistant Ingress (/api/hassio_ingress/<token>/) route to the server.
     */
    _resolveSocketPath() {
        if (this.url) {
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

    _socketOptions() {
        return {
            path: this._socketPath,
            forceNew: true,
            reconnection: true,
            reconnectionDelay: 250,
            reconnectionDelayMax: 2000,
            timeout: 20000
        };
    }

    _acquireSocket() {
        var targetKey = (this.url || '') + '|' + this._socketPath;
        if (HomeAssistantDriver._sharedSocket && HomeAssistantDriver._sharedSocketKey === targetKey) {
            HomeAssistantDriver._sharedSocket.removeAllListeners();
            return HomeAssistantDriver._sharedSocket;
        }
        if (HomeAssistantDriver._sharedSocket) {
            try {
                HomeAssistantDriver._sharedSocket.removeAllListeners();
                HomeAssistantDriver._sharedSocket.disconnect();
            } catch (_e) {}
            HomeAssistantDriver._sharedSocket = null;
        }
        if (typeof io === 'undefined') return null;
        HomeAssistantDriver._sharedSocketKey = targetKey;
        HomeAssistantDriver._sharedSocket = this.url
            ? io(this.url, this._socketOptions())
            : io(this._socketOptions());
        return HomeAssistantDriver._sharedSocket;
    }

    _onSocketConnected() {
        if (typeof dsDebug === 'function') dsDebug('[HomeAssistantDriver] Connected to Home Assistant backend');
        this.stats.connectedSince = Date.now();
        this._clearStateSyncProbe();
        this.dispatchStatus(true, 'CONNECTED');
        this.socket.emit('get_settings');
        this._flushPendingLoadNotification();
        this._restoreSession();
        this.requestStateSync();
    }

    _restoreSession() {
        if (this.pendingLoadNotification || !this._session) return;
        if (!this.socket || !this.socket.connected) return;
        this.socket.emit('dashboard_page', { name: this._session.name, page: this._session.page, restore: true });
    }

    _flushPendingLoadNotification() {
        if (!this.pendingLoadNotification) return;
        if (!this.socket || !this.socket.connected) return;
        var pending = this.pendingLoadNotification;
        var name = (typeof pending === 'object' && pending !== null) ? pending.name : pending;
        var page = (typeof pending === 'object' && pending !== null && pending.page) ? pending.page : 1;
        console.log('[HomeAssistantDriver] Sending queued load notification: ' + name + ' (page ' + page + ')');
        this.socket.emit('dashboard_loaded', { name: name, page: page });
        this.pendingLoadNotification = null;
    }

    requestStateSync(opts) {
        if (!this.socket || !this.socket.connected) return;
        if (typeof dsDebug === 'function') dsDebug('[HomeAssistantDriver] Requesting state sync');

        if (typeof opts === 'function') {
            this.socket.emit('request_state_sync', {}, opts);
            return;
        }

        if (!opts || !opts.verify) {
            this.socket.emit('request_state_sync', {});
            return;
        }
        if (this._stateSyncProbeTimer) return;

        var self = this;
        var acknowledged = false;
        this.socket.emit('request_state_sync', {}, function () {
            acknowledged = true;
            self._clearStateSyncProbe();
            self._flushPendingLoadNotification();
        });
        this._stateSyncProbeTimer = setTimeout(function () {
            self._stateSyncProbeTimer = null;
            if (acknowledged) return;
            self._forceReconnect();
        }, HomeAssistantDriver.STATE_SYNC_ACK_TIMEOUT_MS);
    }

    _clearStateSyncProbe() {
        if (!this._stateSyncProbeTimer) return;
        clearTimeout(this._stateSyncProbeTimer);
        this._stateSyncProbeTimer = null;
    }

    _forceReconnect() {
        if (!this.socket) return;
        var now = Date.now();
        if (this._lastForcedReconnectAt && (now - this._lastForcedReconnectAt) < 5000) return;
        this._lastForcedReconnectAt = now;

        console.log('[HomeAssistantDriver] Socket unresponsive after resume; forcing reconnect');
        this.stats.connectedSince = null;
        this.dispatchStatus(false, 'RECONNECTING...');
        this.socket.disconnect();
        this.socket.connect();
    }

    resumeConnection(dashboardName, page) {
        if (dashboardName) {
            var pageNum = Math.max(1, parseInt(page, 10) || 1);
            if (this.socket && this.socket.connected) {
                this.sendLoadNotification(dashboardName, pageNum);
            } else {
                this._session = { name: dashboardName, page: pageNum };
                this.pendingLoadNotification = { name: dashboardName, page: pageNum };
            }
        }

        if (!this.socket) {
            void this.connect();
            return;
        }
        if (!this.socket.connected) {
            this.dispatchStatus(false, 'RECONNECTING...');
            this.socket.connect();
            return;
        }
        this.requestStateSync({ verify: true });
    }

    _ingestMqttMessage(data, skipDispatch) {
        if (!data || !data.topic) return { topic: '', legacyTopic: null, payload: undefined };
        var topic = data.topic;
        var payload = data.value;

        var legacyTopic = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.legacyOf === 'function')
            ? HomeyTopicAlias.legacyOf(topic)
            : null;

        if (data.deviceId && data.capabilityId) {
            var mapping = {
                deviceId: data.deviceId,
                capabilityId: data.capabilityId
            };
            this.topicMap.set(topic, mapping);
            if (legacyTopic) {
                this.topicMap.set(legacyTopic, mapping);
            }
            if (topic.indexOf('homeassistant/') === 0) {
                this.topicMap.set('homey/' + topic.slice(14), mapping);
            } else if (topic.indexOf('homey/') === 0) {
                this.topicMap.set('homeassistant/' + topic.slice(6), mapping);
            }
            if (this.topicMap.size > 5000) {
                var tmIt = this.topicMap.keys().next().value;
                this.topicMap.delete(tmIt);
            }

            var existing = this.deviceCache.find(function (d) { return d.id === data.deviceId; });
            if (!existing) {
                var parts = topic.split('/');
                var name = (parts[0] === 'homeassistant' || parts[0] === 'homey') && parts.length >= 2 ? parts[1] : parts[0];
                this.deviceCache.push({ id: data.deviceId, name: name });
                if (this.deviceCache.length > 1000) this.deviceCache.shift();
            }
        }

        if (typeof Dashboard !== 'undefined' && (data.isVariable || typeof data.getable !== 'undefined')) {
            if (!Dashboard.topicMeta) Dashboard.topicMeta = {};
            Dashboard.topicMeta[topic] = data;
            if (legacyTopic) {
                Dashboard.topicMeta[legacyTopic] = data;
            }
            var metaKeys = Object.keys(Dashboard.topicMeta);
            if (metaKeys.length > 5000) {
                for (var mi = 0, mDel = metaKeys.length - 5000; mi < mDel; mi++) {
                    delete Dashboard.topicMeta[metaKeys[mi]];
                }
            }
        }

        this.updateStatsAndHistory(topic, payload);
        if (!skipDispatch) {
            if (legacyTopic && typeof Dashboard !== 'undefined' && Dashboard.liveData) {
                Dashboard.liveData[legacyTopic] = payload;
            }
            this.dispatchMessage(topic, payload);
        }
        return { topic: topic, legacyTopic: legacyTopic, payload: payload };
    }

    _applyStateSnapshot(items) {
        if (!items || !items.length) return;
        var batch = new Map();
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (!item) continue;
            if (item.type === 'mqtt' && item.data) {
                var r = this._ingestMqttMessage(item.data, true);
                if (r.topic != null && r.topic !== '') {
                    batch.set(r.topic, r.payload);
                    if (r.legacyTopic != null && r.legacyTopic !== '') {
                        batch.set(r.legacyTopic, r.payload);
                    }
                }
            } else if (item.type === 'event' && item.data) {
                var rawEv = String(item.data.name || '').replace(/^(?:homey|homeassistant)\/events?\//i, '');
                var evTopic = 'homey/event/' + rawEv;
                this.updateStatsAndHistory(evTopic, item.data.value);
                batch.set(evTopic, item.data.value);
                if (rawEv) batch.set(rawEv, item.data.value);
            } else if (item.type === 'insight' && item.data) {
                var rawIn = String(item.data.name || '').replace(/^(?:homey|homeassistant)\/insights?\//i, '');
                var inTopic = 'homey/insight/' + rawIn;
                var val = Array.isArray(item.data.data)
                    ? item.data.data.map(function (pt) { return Array.isArray(pt) ? pt : [new Date(pt.t).getTime(), pt.v]; })
                    : item.data.data;
                this.updateStatsAndHistory(inTopic, val);
                batch.set(inTopic, val);
            }
        }
        if (typeof Dashboard !== 'undefined' && typeof Dashboard.applyLocalTopicPayloadBatch === 'function') {
            Dashboard.applyLocalTopicPayloadBatch(batch, this);
        } else {
            var self = this;
            batch.forEach(function (payload, topic) { self.dispatchMessage(topic, payload); });
        }
    }

    _attachSocketHandlers() {
        var self = this;
        this.socket.on('connect', function () { self._onSocketConnected(); });
        this.socket.on('settings_updated', function (data) {
            applyHomeAssistantAppSettingsFromSocket(data);
        });
        this.socket.on('disconnect', function () {
            if (typeof dsDebug === 'function') dsDebug('[HomeAssistantDriver] Disconnected');
            self.stats.connectedSince = null;
            self.dispatchStatus(false, 'DISCONNECTED');
        });
        this.socket.on('connect_error', function (err) {
            console.warn('[HomeAssistantDriver] Connection error:', err && err.message ? err.message : err);
            self.dispatchStatus(false, 'CONN ERROR');
        });
        this.socket.on('state_snapshot', function (items) {
            self._applyStateSnapshot(items);
        });
        this.socket.on('mqtt_message', function (data) {
            self._ingestMqttMessage(data, false);
        });
        this.socket.on('dashboard_event', function (data) {
            if (!data || !data.name) return;
            var rawName = String(data.name).replace(/^(?:homey|homeassistant)\/events?\//i, '');
            var topic = 'homey/event/' + rawName;
            self.updateStatsAndHistory(topic, data.value);
            self.dispatchMessage(topic, data.value);
            self.dispatchMessage(rawName, data.value);
        });
        this.socket.on('dashboard_insight', function (data) {
            if (!data || !data.name) return;
            var rawName = String(data.name).replace(/^(?:homey|homeassistant)\/insights?\//i, '');
            var topic = 'homey/insight/' + rawName;
            var val = Array.isArray(data.data)
                ? data.data.map(function (pt) { return Array.isArray(pt) ? pt : [new Date(pt.t).getTime(), pt.v]; })
                : data.data;
            self.updateStatsAndHistory(topic, val);
            self.dispatchMessage(topic, val);
        });
        this.socket.on('reload_dashboard', function (data) {
            if (!data || !data.name) return;
            if (typeof Dashboard === 'undefined' || !Dashboard.activeFileName) return;
            if (Dashboard.isEditMode) return;
            var requestedName = String(data.name || '').toLowerCase().replace(/\.json$/i, '');
            var currentName = String(Dashboard.activeFileName || '').toLowerCase().replace(/\.json$/i, '');
            if (requestedName !== 'all' && requestedName !== currentName) return;

            var provider = StorageRegistry.get('server');
            if (!provider) {
                window.location.reload();
                return;
            }

            Dashboard.showLoading(Dashboard.activeFileName);
            provider.load('dashboard', Dashboard.activeFileName)
                .then(function (dashData) {
                    if (!dashData) return;
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () {
                            void (async function () {
                                try {
                                    await Dashboard.loadDashboardData(dashData);
                                    if (typeof Dashboard.resyncHomeyLiveData === 'function') {
                                        Dashboard.resyncHomeyLiveData({ announceLoad: true });
                                    } else {
                                        var driver = DataDriverRegistry.get();
                                        if (driver && typeof driver.sendLoadNotification === 'function') {
                                            var activePage = Math.max(1, parseInt(String(typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.currentPage != null ? MASTER_SETTINGS.currentPage : 1), 10) || 1);
                                            driver.sendLoadNotification(Dashboard.activeFileName, activePage);
                                        }
                                    }
                                } finally {
                                    Dashboard.hideLoading();
                                }
                            })();
                        });
                    });
                })
                .catch(function () { Dashboard.hideLoading(); });
        });
    }

    _bindLiveSocket(token) {
        if (token !== this._connectToken) {
            this.dispatchStatus(false, 'DISCONNECTED');
            return;
        }

        this.socket = this._acquireSocket();
        if (!this.socket) {
            console.error('[HomeAssistantDriver] Socket.IO library not found.');
            this.dispatchStatus(false, 'LIB MISSING');
            return;
        }

        this._attachSocketHandlers();

        if (this.socket.connected) {
            this._onSocketConnected();
            return;
        }

        this.dispatchStatus(false, 'CONNECTING...');
        this.socket.connect();
    }

    async connect() {
        if (this.socket && this.socket.connected) {
            this.dispatchStatus(true, 'CONNECTED');
            return;
        }
        if (this._connecting) return;

        this._connectToken = (this._connectToken || 0) + 1;
        var token = this._connectToken;

        if (typeof io !== 'undefined') {
            this._bindLiveSocket(token);
            return;
        }

        this._connecting = true;
        this.dispatchStatus(false, 'LOADING LIB...');

        var scriptUrl = this.url
            ? (this.url + this._socketPath + '/socket.io.js')
            : (this._socketPath + '/socket.io.js');

        try {
            await this.loadDependency(scriptUrl, 'io');
        } catch (e) {
            console.error('[HomeAssistantDriver] Failed to load socket.io library:', e);
            this._connecting = false;
            if (token !== this._connectToken) return;
            this.dispatchStatus(false, 'LIB MISSING');
            return;
        }

        this._connecting = false;

        if (token !== this._connectToken) {
            this.dispatchStatus(false, 'DISCONNECTED');
            return;
        }

        this._bindLiveSocket(token);
    }

    updateStatsAndHistory(topic, payload) {
        this.stats.msgCount++;
        this.stats.lastTopic = topic;

        var existing = this.seenTopics.get(topic) || { count: 0 };
        this.seenTopics.set(topic, {
            payload: payload,
            count: existing.count + 1,
            timestamp: Date.now()
        });
        if (this.seenTopics.size > 1000) {
            var oldestKey = this.seenTopics.keys().next().value;
            this.seenTopics.delete(oldestKey);
        }
    }

    disconnect() {
        this._connectToken = (this._connectToken || 0) + 1;
        this._connecting = false;
        this._clearStateSyncProbe();
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.topicMap.clear();
        this.deviceCache.length = 0;
        super.disconnect();
        this.stats.connectedSince = null;
        this.dispatchStatus(false, 'DISCONNECTED');
    }

    publish(topic, payload) {
        if (!topic) return;
        if (topic.indexOf('local/') === 0) {
            if (typeof Dashboard !== 'undefined') {
                if (!Dashboard.topicMeta) Dashboard.topicMeta = {};
                if (!Dashboard.topicMeta[topic]) {
                    Dashboard.topicMeta[topic] = { getable: true, setable: true, isVariable: false };
                }
            }
            this.updateStatsAndHistory(topic, payload);
            this.dispatchMessage(topic, payload);
            return;
        }

        if (!this.socket || !this.socket.connected) {
            console.warn('[HomeAssistantDriver] Cannot publish, disconnected.');
            return;
        }

        if (this.topicMap.has(topic)) {
            var map = this.topicMap.get(topic);
            this._emitSetState(map.deviceId, map.capabilityId, payload);
            return;
        }

        if (typeof Dashboard !== 'undefined' && Dashboard.topicMeta && Dashboard.topicMeta[topic]) {
            var meta = Dashboard.topicMeta[topic];
            if (meta.deviceId && meta.capabilityId) {
                this._emitSetState(meta.deviceId, meta.capabilityId, payload);
                return;
            }
        }

        var altTopic = (typeof HomeyTopicAlias !== 'undefined' && typeof HomeyTopicAlias.aliasOf === 'function')
            ? HomeyTopicAlias.aliasOf(topic)
            : null;
        if (altTopic && this.topicMap.has(altTopic)) {
            var altMap = this.topicMap.get(altTopic);
            this._emitSetState(altMap.deviceId, altMap.capabilityId, payload);
            return;
        }

        if (typeof HomeyTopicResolver !== 'undefined') {
            var resolveRes = HomeyTopicResolver.findCandidates(topic);
            if (resolveRes && !resolveRes.exact && resolveRes.candidates && resolveRes.candidates.length === 1) {
                var resolved = resolveRes.candidates[0].topic;
                if (this.topicMap.has(resolved)) {
                    var resMap = this.topicMap.get(resolved);
                    this._emitSetState(resMap.deviceId, resMap.capabilityId, payload);
                    return;
                }
                if (resolved.indexOf('homey/event/') === 0 || resolved.indexOf('homeassistant/event/') === 0) {
                    var evName = resolved.replace(/^(?:homey|homeassistant)\/events?\//i, '');
                    this.socket.emit('dashboard_trigger', { name: evName, value: payload });
                    return;
                }
            }
        }

        if (topic.indexOf('/') === -1) {
            this.socket.emit('dashboard_trigger', { name: topic, value: payload });
            return;
        }

        var cleanTopic = topic.replace(/^(?:homey|homeassistant)\//i, '');
        var parts = cleanTopic.split('/');
        if (parts[0] === 'event' || parts[0] === 'events' || parts[0] === 'flow' || parts[0] === 'flows') {
            if (parts[0] === 'event' || parts[0] === 'events') {
                this.socket.emit('dashboard_trigger', { name: parts.slice(1).join('/'), value: payload });
                return;
            }
        }

        this.socket.emit('set_state', {
            topic: topic,
            deviceId: parts[0],
            capabilityId: parts.slice(1).join('/'),
            value: payload
        });
    }

    sendLoadNotification(dashboardName, page) {
        var pageNum = Math.max(1, parseInt(page, 10) || 1);
        this._session = { name: dashboardName, page: pageNum };
        if (this.socket && this.socket.connected) {
            this.socket.emit('dashboard_loaded', { name: dashboardName, page: pageNum });
        } else {
            this.pendingLoadNotification = { name: dashboardName, page: pageNum };
        }
    }

    sendPageNotification(dashboardName, page) {
        var pageNum = Math.max(1, parseInt(page, 10) || 1);
        this._session = { name: dashboardName, page: pageNum };
        if (!this.socket || !this.socket.connected) return;
        this.socket.emit('dashboard_page', { name: dashboardName, page: pageNum });
    }

    sendSaveNotification(dashboardName) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('dashboard_saved', { name: dashboardName });
        }
    }

    _emitSetState(deviceId, capabilityId, value) {
        if (typeof dsDebug === 'function') dsDebug('[HomeAssistantDriver] Controlling: ' + deviceId + ' (' + capabilityId + ') = ' + value);
        this.socket.emit('set_state', {
            deviceId: deviceId,
            capabilityId: capabilityId,
            value: value
        });
    }

    getStorageProvider() {
        return this.storageProvider;
    }

    listImages() { return this.storageProvider.listImages(); }
    uploadImage(name, content) { return this.storageProvider.saveImage(name, content); }
    deleteImage(name) { return this.storageProvider.deleteImage(name); }
    deleteImages(names) { return this.storageProvider.deleteImages(names); }
    renameImage(from, to) { return this.storageProvider.renameImage(from, to); }

    listAudio() { return this.storageProvider.listAudio(); }
    uploadAudio(name, content) { return this.storageProvider.saveAudio(name, content); }
    deleteAudio(name) { return this.storageProvider.deleteAudio(name); }
    deleteAudioFiles(names) { return this.storageProvider.deleteAudioFiles(names); }
    renameAudio(from, to) { return this.storageProvider.renameAudio(from, to); }
}

HomeAssistantDriver._sharedSocket = null;
HomeAssistantDriver._sharedSocketKey = '';
HomeAssistantDriver.STATE_SYNC_ACK_TIMEOUT_MS = 1500;

DataDriverRegistry.register('homeassistant', HomeAssistantDriver);
