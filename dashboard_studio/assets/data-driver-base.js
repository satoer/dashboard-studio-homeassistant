window.DataDriverRegistry = {
    drivers: {},
    currentDriver: null,
    currentType: null,

    register: function (type, driverClass) {
        if (this.drivers[type]) {
            console.warn(`Data Driver '${type}' is already registered. Overwriting.`);
        }
        this.drivers[type] = driverClass;
        if (typeof dsDebug === 'function') dsDebug('[Registry] Registered Data Driver: ' + type);
    },

    init: function (type, settings) {
        if (this.currentDriver) {
            this.currentDriver.disconnect();
        }

        const DriverClass = this.drivers[type] || this.drivers['nodered'];
        if (!DriverClass) {
            console.error(`Unknown Data Driver: ${type}`);
            return;
        }

        this.currentType = type;
        this.currentDriver = new DriverClass(settings);

        // Omit .connect() here to allow the caller 
        // to attach event listeners before the driver fires its initial connection status.
        return this.currentDriver;
    },

    get: function () {
        return this.currentDriver;
    },

    getType: function () {
        return this.currentType;
    }
};

class BaseDataDriver {
    constructor(settings) {
        this.settings = settings || {};
        this.onMessageCallback = null;
        this.onStatusChangeCallback = null;
    }

    static get metadata() {
        return { label: "Base Driver", description: "Abstract Data Driver" };
    }

    static get schema() {
        return [];
    }

    // Indicate that this driver supports file operations (Save/Load)
    get supportsFileStorage() {
        return false;
    }

    connect() { console.warn("connect() not implemented"); }

    // Explicitly clear callbacks to prevent zombie updates
    disconnect() {
        this.onMessageCallback = null;
        this.onStatusChangeCallback = null;
    }

    subscribe(topic) { }
    publish(topic, payload) { console.warn("publish() not implemented"); }

    // Hot-reload settings without disconnecting
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        // Subclasses should override this to react to changes
    }

    // Notify backend that dashboard has loaded (Trigger Flow)
    // Subclasses should override this if they support the feature (e.g. Homey)
    sendLoadNotification(dashboardName, page) {
        // Default: Do nothing
    }

    sendPageNotification(dashboardName, page) {
        // Default: Do nothing
    }

    onMessage(cb) { this.onMessageCallback = cb; }
    onStatusChange(cb) { this.onStatusChangeCallback = cb; }

    dispatchMessage(topic, payload) {
        if (this.onMessageCallback) this.onMessageCallback(topic, payload);
    }

    dispatchStatus(isConnected, message) {
        if (this.onStatusChangeCallback) this.onStatusChangeCallback(isConnected, message);
    }

    /**
     * Optional: Return a StorageProvider interface if this driver supports file operations.
     * This allows drivers like Homey (Socket.IO) to handle file saves directly.
     * @returns {StorageProvider|null}
     */
    getStorageProvider() {
        return null;
    }

    /**
     * Utility to dynamically load external dependencies
     * Resolves immediately if the global variable already exists.
     */
    async loadDependency(url, globalVar) {
        if (globalVar && window[globalVar]) return Promise.resolve();

        // Check if script is already added but still loading
        const existing = document.querySelector(`script[src="${url}"]`);
        if (existing) {
            if (globalVar && window[globalVar]) return Promise.resolve();
            if (existing.readyState === 'complete' || existing.readyState === 'loaded') {
                return Promise.resolve();
            }
            return new Promise((resolve, reject) => {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', () => reject(new Error(`Failed to load dependency: ${url}`)), { once: true });
            });
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load dependency: ${url}`));
            document.head.appendChild(script);
        });
    }
}