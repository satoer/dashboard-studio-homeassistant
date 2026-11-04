window.StorageRegistry = {
    providers: {},
    activeProviders: {},

    register: function(type, providerClass) {
        this.providers[type] = providerClass;
        console.log(`[Storage] Registered Provider: ${type}`);
    },

    get: function(type) {
        // 1. PRIORITY: Check if the current Data Driver supports storage
        // This allows drivers like Homey (Socket.IO) to handle file saves directly
        // overriding the default Web/API provider.
        if (type === 'server' && window.DataDriverRegistry) {
            const currentDriver = DataDriverRegistry.get();
            if (currentDriver && typeof currentDriver.getStorageProvider === 'function') {
                const driverProvider = currentDriver.getStorageProvider();
                if (driverProvider) return driverProvider;
            }
        }

        // 2. FALLBACK: Use registered standalone providers (Local/Web)
        if (!this.activeProviders[type]) {
            const ProviderClass = this.providers[type];
            if (ProviderClass) {
                const config = window.APP_CONFIG ? window.APP_CONFIG.storage : {};
                this.activeProviders[type] = new ProviderClass(config);
            } else {
                console.error(`[Storage] Provider '${type}' not found.`);
                return null;
            }
        }
        return this.activeProviders[type];
    }
};

class StorageProvider {
    constructor(config) {
        this.config = config || {};
    }

    init() { return Promise.resolve(); }

    // All methods return Promises
    list(type) { return Promise.reject(new Error("list() not implemented")); }
    save(type, name, data) { return Promise.reject(new Error("save() not implemented")); }
    load(type, name) { return Promise.reject(new Error("load() not implemented")); }
    delete(type, name) { return Promise.reject(new Error("delete() not implemented")); }
}