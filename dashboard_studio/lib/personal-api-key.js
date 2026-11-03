const { HomeyAPI } = require('homey-api');

const SETTINGS_KEY = 'personalApiKey';
const AUTH_ERROR_PATTERN = /unauthorized|forbidden|invalid token|missing scopes/i;

/**
 * Manages the Homey owner's Personal API Key: verification, storage and the
 * privileged calls (variable writes, flow starts, mood activations) the app-scoped API cannot make.
 */
class PersonalApiKeyManager {
    constructor(homey, logFn = console.log, errorFn = console.error) {
        this.homey = homey;
        this.log = logFn;
        this.error = errorFn;
        this._reset();
    }

    _reset() {
        this.cachedApi = null;
        this.scopes = [];
        this.permissions = {
            canWriteVariables: false,
            canReadVariables: false,
            canTriggerFlows: false,
            canReadFlows: false,
            canSetMoods: false,
            canReadMoods: false
        };
        this.isValid = false;
        this.lastError = null;
    }

    _apply(inspected) {
        this.cachedApi = inspected.api;
        this.scopes = inspected.scopes;
        this.permissions = inspected.permissions;
        this.isValid = true;
        this.lastError = null;
    }

    getKey() {
        const key = this.homey.settings.get(SETTINGS_KEY);
        return (typeof key === 'string' && key.trim().length > 0) ? key.trim() : null;
    }

    hasKey() {
        return !!this.getKey();
    }

    canWriteVariables() {
        return this.isValid && !!this.cachedApi && this.permissions.canWriteVariables;
    }

    canReadVariables() {
        return this.isValid && !!this.cachedApi && this.permissions.canReadVariables;
    }

    canTriggerFlows() {
        return this.isValid && !!this.cachedApi && this.permissions.canTriggerFlows;
    }

    canReadFlows() {
        return this.isValid && !!this.cachedApi && this.permissions.canReadFlows;
    }

    canSetMoods() {
        return this.isValid && !!this.cachedApi && this.permissions.canSetMoods;
    }

    canReadMoods() {
        return this.isValid && !!this.cachedApi && this.permissions.canReadMoods;
    }

    async _createLocalApi(token) {
        const address = await this.homey.api.getLocalUrl();
        return await HomeyAPI.createLocalAPI({ address, token, debug: null });
    }

    _failure(kind, message) {
        const err = new Error(message);
        err.kind = kind;
        return err;
    }

    _isAuthError(err) {
        const status = err && (err.statusCode || err.status);
        return status === 401 || status === 403 || AUTH_ERROR_PATTERN.test((err && err.message) || '');
    }

    /**
     * Connects with the token and reads its permissions.
     * Throws an Error whose `kind` is 'rejected' (Homey refused the key) or 'unreachable' (could not ask Homey).
     */
    async _inspect(token) {
        const trimmed = (token || '').trim();
        if (!trimmed) throw this._failure('rejected', 'API key is empty');

        let api;
        let session;
        try {
            api = await this._createLocalApi(trimmed);
            session = await api.sessions.getSessionMe();
        } catch (err) {
            const message = (err && err.message) ? err.message : 'Invalid API key or connection failed';
            throw this._failure(this._isAuthError(err) ? 'rejected' : 'unreachable', message);
        }

        const rawScopes = (session && Array.isArray(session.scopes)) ? session.scopes : [];
        const intersectedScopes = (session && Array.isArray(session.intersectedScopes)) ? session.intersectedScopes : [];
        const scopes = Array.from(new Set([...rawScopes, ...intersectedScopes]));
        const hasMaster = scopes.includes('homey');

        // A parent scope (homey.logic, homey.flow, homey.mood) grants every child scope, so Homey may report only the parent.
        const canWriteVariables = hasMaster || scopes.includes('homey.logic');
        const canReadVariables = canWriteVariables || scopes.includes('homey.logic.readonly');

        const canTriggerFlows = hasMaster || scopes.includes('homey.flow') || scopes.includes('homey.flow.start');
        const canReadFlows = canTriggerFlows || scopes.includes('homey.flow.readonly');

        const canSetMoods = hasMaster || scopes.includes('homey.mood') || scopes.includes('homey.mood.set');
        const canReadMoods = canSetMoods || scopes.includes('homey.mood.readonly');

        if (!canWriteVariables && !canReadVariables && !canTriggerFlows && !canReadFlows && !canSetMoods && !canReadMoods) {
            throw this._failure('rejected', 'Key accepted by Homey, but lacks required permissions (Variables, Flows, or Moods).');
        }

        const permissions = {
            canWriteVariables,
            canReadVariables,
            canTriggerFlows,
            canReadFlows,
            canSetMoods,
            canReadMoods,
            variables: {
                read: canReadVariables,
                write: canWriteVariables
            },
            flows: {
                read: canReadFlows,
                start: canTriggerFlows
            },
            moods: {
                read: canReadMoods,
                set: canSetMoods
            }
        };

        return { api, scopes, permissions };
    }

    async init() {
        const key = this.getKey();
        if (!key) {
            this._reset();
            return;
        }
        try {
            this._apply(await this._inspect(key));
            this.log('[API-KEY] Personal API Key initialized successfully.');
        } catch (err) {
            this._reset();
            this.lastError = err.message;
            this.error('[API-KEY] Personal API Key initialization failed:', err.message);
        }
    }

    /**
     * Verifies and stores a key. An empty key clears it, a rejected key is removed (treated as unused),
     * and an unreachable Homey leaves the stored key untouched.
     */
    async saveKey(token) {
        const trimmed = (token || '').trim();
        if (!trimmed) {
            this.homey.settings.unset(SETTINGS_KEY);
            this._reset();
            return {
                valid: true,
                cleared: true,
                scopes: [],
                permissions: this.permissions
            };
        }

        try {
            const inspected = await this._inspect(trimmed);
            this.homey.settings.set(SETTINGS_KEY, trimmed);
            this._apply(inspected);
            return {
                valid: true,
                scopes: inspected.scopes,
                permissions: inspected.permissions
            };
        } catch (err) {
            if (err.kind === 'unreachable') {
                return { valid: false, unreachable: true, error: err.message };
            }
            this.homey.settings.unset(SETTINGS_KEY);
            this._reset();
            this.lastError = err.message;
            return { valid: false, error: err.message };
        }
    }

    getStatus() {
        return {
            configured: this.hasKey(),
            valid: this.isValid,
            scopes: this.scopes || [],
            permissions: {
                canWriteVariables: this.canWriteVariables(),
                canReadVariables: this.canReadVariables(),
                canTriggerFlows: this.canTriggerFlows(),
                canReadFlows: this.canReadFlows(),
                canSetMoods: this.canSetMoods(),
                canReadMoods: this.canReadMoods(),
                variables: {
                    read: this.canReadVariables(),
                    write: this.canWriteVariables()
                },
                flows: {
                    read: this.canReadFlows(),
                    start: this.canTriggerFlows()
                },
                moods: {
                    read: this.canReadMoods(),
                    set: this.canSetMoods()
                }
            },
            error: this.lastError
        };
    }

    async getApi() {
        if (this.cachedApi && this.isValid) return this.cachedApi;
        const key = this.getKey();
        if (!key) return null;
        this._apply(await this._inspect(key));
        return this.cachedApi;
    }

    _noteAuthFailure(err) {
        if (this._isAuthError(err)) {
            this.isValid = false;
            this.lastError = err.message;
        }
    }

    async updateVariable(varId, value) {
        const api = await this.getApi();
        if (!api) throw new Error('Personal API Key is not configured or invalid');
        if (!this.canWriteVariables()) throw new Error('Personal API Key does not have permission to write variables');

        try {
            return await api.logic.updateVariable({ id: varId, variable: { value } });
        } catch (err) {
            this._noteAuthFailure(err);
            throw err;
        }
    }

    async triggerFlow(flow) {
        const api = await this.getApi();
        if (!api) throw new Error('Personal API Key is not configured or invalid');
        if (!this.canTriggerFlows()) throw new Error('Personal API Key does not have permission to start flows');

        const rawId = flow.rawId || (flow.id ? flow.id.replace(/^(flow|advanced):/, '') : '');
        if (!rawId) throw new Error('Invalid flow identifier');

        try {
            return flow.isAdvanced
                ? await api.flow.triggerAdvancedFlow({ id: rawId })
                : await api.flow.triggerFlow({ id: rawId });
        } catch (err) {
            this._noteAuthFailure(err);
            throw err;
        }
    }

    async setMood(moodId) {
        const api = await this.getApi();
        if (!api) throw new Error('Personal API Key is not configured or invalid');
        if (!this.canSetMoods()) throw new Error('Personal API Key does not have permission to set moods');

        const rawId = moodId ? moodId.replace(/^mood:/, '') : '';
        if (!rawId) throw new Error('Invalid mood identifier');

        try {
            if (!api.moods || typeof api.moods.setMood !== 'function') {
                throw new Error('Moods API is not available on this Homey');
            }
            return await api.moods.setMood({ id: rawId });
        } catch (err) {
            this._noteAuthFailure(err);
            throw err;
        }
    }
}

module.exports = PersonalApiKeyManager;
