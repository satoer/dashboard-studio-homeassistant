const ConfigLoader = {
    // Default Configuration (Standalone / Local Mode)
    defaults: {
        environment: "local",
        ui: {
            showDataConnection: true,  
            showLocalButtons: true,    
            showServerButtons: false,
            warnWhenDriverOffline: false
        },
        defaults: {
            dataDriver: "homey",       
            
            lockedPlatform: null,
            hideEditor: false,
            keepDashboardFileHistory: true,
            dashboardFileHistoryMax: 10,
            cacheValues: true          
        },
        storage: {
            endpoints: {
                dashboard: "/api/app/com.satoer.dashboardstudio/dashboards",
                template: "/api/app/com.satoer.dashboardstudio/templates"
            }
        }
    },

    config: null,

    RETRY_DELAY_MS: 250,

    retryUrl: function (url) {
        const src = String(url || '');
        return src + (src.indexOf('?') >= 0 ? '&' : '?') + 'reload=' + Date.now();
    },

    /**
     * Back-button restores (Firefox local-network gate, aborted bfcache fetches) throw
     * TypeError/NetworkError instead of HTTP 404. Those recover on a second request.
     */
    isTransientFetchError: function (err) {
        if (!err) return false;
        const name = err.name || '';
        const msg = String(err.message || err);
        if (name === 'AbortError' || name === 'TimeoutError') return true;
        if (name === 'TypeError') return true;
        const lower = msg.toLowerCase();
        if (lower.indexOf('networkerror') !== -1) return true;
        if (lower.indexOf('failed to fetch') !== -1) return true;
        if (lower.indexOf('load failed') !== -1) return true;
        if (lower.indexOf('network request failed') !== -1) return true;
        return false;
    },

    fetchWithRetry: function (url) {
        const self = this;
        const delay = function (ms) {
            return new Promise(function (resolve) { setTimeout(resolve, ms); });
        };
        const tryOnce = function (href) {
            return new Promise(function (resolve, reject) {
                var timer = setTimeout(function () { reject(new Error('Fetch timeout: ' + href)); }, 30000);
                fetch(href).then(function (res) {
                    clearTimeout(timer);
                    resolve(res);
                }, function (err) {
                    clearTimeout(timer);
                    reject(err);
                });
            });
        };
        return tryOnce(url).catch(function (err) {
            if (!self.isTransientFetchError(err)) throw err;
            console.warn('[Config] Fetch refused, retrying:', url);
            return delay(self.RETRY_DELAY_MS).then(function () {
                return tryOnce(self.retryUrl(url));
            }).catch(function (err2) {
                if (!self.isTransientFetchError(err2)) throw err2;
                return delay(self.RETRY_DELAY_MS).then(function () {
                    return tryOnce(self.retryUrl(url));
                });
            });
        });
    },

    // Called to initialize configuration before Dashboard starts
    load: function() {
        this.config = JSON.parse(JSON.stringify(this.defaults));
        
        // 1. Load Static Config
        const p1 = this.fetchWithRetry('config.json')
            .then(response => {
                if (!response.ok) {
                    console.log("[Config] config.json not found, using defaults");
                    return {};
                }
                return response.json();
            })
            .catch(err => {
                console.warn("[Config] Error parsing config.json:", err);
                return {};
            });

        // 2. Load Backend Settings (settings.json)
        const p2 = this.fetchWithRetry('settings.json')
            .then(response => {
                if (!response.ok) return {}; 
                return response.json();
            })
            .catch(err => {
                return {};
            });

        return Promise.all([p1, p2]).then(([staticConfig, backendConfig]) => {
            this.merge(this.config, staticConfig);
            
            this.merge(this.config, backendConfig);
            
            // Map flat keys to structured config expected by Dashboard
            if (!this.config.defaults) this.config.defaults = {};
            if (backendConfig.environment === 'homeassistant' && (!backendConfig.defaults || !backendConfig.defaults.dataDriver)) {
                this.config.defaults.dataDriver = 'homeassistant';
            }
            
            if (backendConfig.hideEditor !== undefined) {
                this.config.defaults.hideEditor = backendConfig.hideEditor;
            } else if (backendConfig.hideEditButton !== undefined) {
                this.config.defaults.hideEditor = backendConfig.hideEditButton;
            }
            if (this.config.defaults.hideEditor === undefined && this.config.defaults.hideEditButton !== undefined) {
                this.config.defaults.hideEditor = this.config.defaults.hideEditButton;
            }
            if (this.config.defaults.hideEditor === undefined) {
                this.config.defaults.hideEditor = false;
            }
            delete this.config.defaults.hideEditButton;
            if (backendConfig.keepDashboardFileHistory !== undefined) {
                this.config.defaults.keepDashboardFileHistory = backendConfig.keepDashboardFileHistory;
            }
            if (backendConfig.dashboardFileHistoryMax !== undefined) {
                let hm = parseInt(backendConfig.dashboardFileHistoryMax, 10);
                if (!isNaN(hm)) this.config.defaults.dashboardFileHistoryMax = Math.min(50, Math.max(1, hm));
            }
            if (backendConfig.cacheValues !== undefined) {
                this.config.defaults.cacheValues = backendConfig.cacheValues;
            }
            if (backendConfig.warnWhenDriverOffline !== undefined) {
                if (!this.config.ui) this.config.ui = {};
                this.config.ui.warnWhenDriverOffline = backendConfig.warnWhenDriverOffline;
            }

            console.log(`[Config] Loaded environment: ${this.config.environment}`);
            window.APP_CONFIG = this.config;
        });
    },

    // Deep merge helper
    merge: function(target, source) {
        if (typeof source !== 'object' || source === null) return source;
        
        for (const key in source) {
            if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
                this.merge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }
};