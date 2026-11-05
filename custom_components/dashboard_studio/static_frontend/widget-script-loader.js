/**
 * Loads widget scripts from widgets-manifest.json, then the editor/dashboard stack.
 * With ?test_mode=full, merges experimental entries: same basename as a production script replaces it;
 * experimental-only scripts append after the production-ordered list.
 * viewer.html sets window.IS_VIEWER: lean boot: demand-load widgets/driver/markdown/migrator.
 * editor.html loads the full editor stack (all widgets + EDITOR_TAIL).
 */
const WidgetScriptLoader = {
    /** Core runtime after widgets (editor always; viewer loads pieces selectively). */
    RUNTIME_CORE: [
        'save-format-v2.js',
        'master-layout.js',
        'dashboard.js',
        'dashboard-audio.js',
        'dashboard-dialog.js'
    ],

    MARKDOWN_RUNTIME: [
        'libraries/markdown-it.min.js',
        'libraries/purify.min.js',
        'markdown-color-spec.js',
        'markdown-image-tint.js',
        'markdown-table-utils.js',
        'markdown-cell-color.js',
        'markdown-text-color.js',
        'markdown-blink.js',
        'text-scroll.js'
    ],

    /** Editor chrome required before the dashboard can be shown. */
    EDITOR_TAIL: [
        'dashboard-editor-api.js',
        'editor-reorder.js',
        'editor-color-picker.js',
        'editor-tooltip-data.js',
        'editor-tooltip.js',
        'editor.js',
        'quick-toolbar.js',
        'guide-pointer.js'
    ],

    /**
     * Themes and documentation: read on user action, never during first paint.
     * Kept ahead of EDITOR_DEFERRED because theme-explorer.js needs PRESET_THEMES.
     */
    EDITOR_DEFERRED_MODULES: [
        'themes.js',
        'help/help-markdown-settings.js',
        'help/help-content.js'
    ],

    /**
     * Dialogs, galleries, and the Tools shell. Array order is execution order (async=false), so
     * each entry follows the module it calls into: picker after model, text editor after its ops,
     * reset wizard after the theme explorer it mounts, shell init after the galleries it detects.
     */
    EDITOR_DEFERRED: [
        'widget-preset-model.js',
        'widget-preset-picker.js',
        'editor-changelog.js',
        'theme-explorer.js',
        'reset-canvas-wizard.js',
        'image-gallery.js',
        'audio-gallery.js',
        'markdown-text-ops.js',
        'text-full-editor.js',
        'index-shell-init.js',
        'scripts/tools-menu.js',
        'scripts/dialog-host.js',
        'scripts/tools-catalog.js'
    ],

    /**
     * Globals that editor.html calls through inline onclick but that now arrive in the background
     * batch. Listed per global so a placeholder never answers for a property the real module
     * exposes as data; anything outside these names stays undefined.
     */
    DEFERRED_EDITOR_GLOBALS: {
        HelpSystem: ['toggle', 'clearHelpSearch', 'historyBack', 'historyForward', 'goToPage', 'showWidgetHelp'],
        ImageGallery: ['open', 'close'],
        AudioGallery: ['open', 'close'],
        ThemeExplorer: ['openDialog', 'mountGrid'],
        ServerFileManager: ['open', 'close', 'performSave'],
        ChangelogViewer: ['open', 'close']
    },

    DRIVER_PATHS: {
        homey: 'drivers/homey.js',
        homeassistant: 'drivers/homeassistant.js',
        mqtt: 'drivers/mqtt.js',
        nodered: 'drivers/nodered.js',
        simulation: 'drivers/simulation.js'
    },

    /** Pause before a refused script is requested again (see loadScript). */
    SCRIPT_RETRY_DELAY_MS: 250,

    /** Widget types that need markdown-it / purify / markdown helpers at runtime. */
    MARKDOWN_WIDGET_TYPES: {
        text: true
    },

    /**
     * Registry type → manifest basename when they differ.
     * container.js registers as 'empty'; textbox is a legacy alias for list.
     */
    TYPE_SCRIPT_BASENAME: {
        empty: 'container',
        textbox: 'list'
    },

    basename: function (path) {
        const i = path.lastIndexOf('/');
        return i === -1 ? path : path.slice(i + 1);
    },

    typeFromWidgetPath: function (path) {
        const base = this.basename(path);
        if (!base.toLowerCase().endsWith('.js')) return null;
        return base.slice(0, -3).toLowerCase();
    },

    isExperimentalWidgetsEnabled: function () {
        return new URLSearchParams(window.location.search).get('test_mode') === 'full';
    },

    isTestModeActive: function () {
        const mode = new URLSearchParams(window.location.search).get('test_mode');
        return mode === 'full' || mode === 'performance';
    },

    resolveWidgetPaths: function (manifest, experimentalOn) {
        const prod = Array.isArray(manifest.widgets) ? manifest.widgets.slice() : [];
        const exp = Array.isArray(manifest.experimental) ? manifest.experimental : [];
        if (!experimentalOn) return prod;

        const replaced = prod.map((p) => {
            const b = this.basename(p);
            const hit = exp.find((e) => this.basename(e) === b);
            return hit || p;
        });
        const prodBases = new Set(prod.map((p) => this.basename(p)));
        const extra = exp.filter((e) => !prodBases.has(this.basename(e)));
        return replaced.concat(extra);
    },

    buildTypePathMap: function (paths) {
        const map = {};
        paths.forEach((p) => {
            const t = this.typeFromWidgetPath(p);
            if (t) map[t] = p;
        });
        // Expose registry aliases so demand-load finds the script by saved JSON type.
        Object.keys(this.TYPE_SCRIPT_BASENAME).forEach((registryType) => {
            const basename = this.TYPE_SCRIPT_BASENAME[registryType];
            if (map[basename] && !map[registryType]) {
                map[registryType] = map[basename];
            }
        });
        return map;
    },

    scriptPathForType: function (type, typePathMap) {
        const t = String(type || '').toLowerCase();
        if (typePathMap[t]) return typePathMap[t];
        const basename = this.TYPE_SCRIPT_BASENAME[t];
        if (basename && typePathMap[basename]) return typePathMap[basename];
        return null;
    },

    _loadScriptElement: function (src) {
        return new Promise(function (resolve, reject) {
            const s = document.createElement('script');
            s.src = src;
            s.async = false;
            s.onload = function () { resolve(); };
            s.onerror = function () {
                s.remove();
                reject(new Error('Failed to load script: ' + src));
            };
            document.head.appendChild(s);
        });
    },

    _retryUrl: function (src) {
        return src + (src.indexOf('?') >= 0 ? '&' : '?') + 'reload=' + Date.now();
    },

    /**
     * A browser can refuse a subresource that loaded fine moments earlier, most visibly when returning
     * with the Back button (Firefox's local network access gate auto-denies while the page is restored).
     * One retry on a fresh URL recovers those without hiding a genuinely missing file.
     *
     * Every path is fetched at most once per session. Re-executing a widget script would register a
     * second class object for the same type, leaving the instances already on the canvas failing
     * `instanceof` against the registry and silently dropped by the next save.
     */
    loadScript: function (src) {
        if (src === 'templates.js') src = 'themes.js';
        if (!this._scriptPromises) this._scriptPromises = {};
        if (this._scriptPromises[src]) return this._scriptPromises[src];

        const self = this;
        this._scriptPromises[src] = (async function () {
            try {
                await self._loadScriptElement(src);
                return;
            } catch (e) {
                console.warn('[WidgetScriptLoader] Script refused, retrying:', src);
            }

            await new Promise((resolve) => setTimeout(resolve, self.SCRIPT_RETRY_DELAY_MS));

            try {
                await self._loadScriptElement(self._retryUrl(src));
            } catch (e) {
                // Let a later caller try again rather than caching the failure for the session.
                delete self._scriptPromises[src];
                throw new Error('Failed to load script: ' + src);
            }
        })();

        return this._scriptPromises[src];
    },

    /**
     * @param {{ tolerateFailures?: boolean }} [opts] When set, a script that stays unavailable is logged
     *   and skipped instead of failing the whole batch (view-only boot, where nothing can be saved away).
     */
    loadScriptsParallel: function (paths, opts) {
        const self = this;
        const tolerateFailures = !!(opts && opts.tolerateFailures);
        const unique = [];
        const seen = {};
        (paths || []).forEach(function (p) {
            if (!p || seen[p]) return;
            seen[p] = true;
            unique.push(p);
        });
        return Promise.all(unique.map(function (p) {
            const loading = self.loadScript(p);
            if (!tolerateFailures) return loading;
            return loading.catch(function (e) {
                console.error('[WidgetScriptLoader] Unavailable, rendering without it:', p, e);
            });
        }));
    },

    loadTail: async function (paths) {
        for (let i = 0; i < paths.length; i++) {
            await this.loadScript(paths[i]);
        }
    },

    compareVersions: function (v1, v2) {
        const parts1 = String(v1 || '0').split('.').map(Number);
        const parts2 = String(v2 || '0').split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if ((parts1[i] || 0) < (parts2[i] || 0)) return -1;
            if ((parts1[i] || 0) > (parts2[i] || 0)) return 1;
        }
        return 0;
    },

    _forEachWidgetData: function (data, fn) {
        if (!data || typeof data !== 'object' || typeof fn !== 'function') return;
        const widgets = data.widgets && typeof data.widgets === 'object' ? data.widgets : {};
        Object.keys(widgets).forEach(function (id) {
            if (widgets[id]) fn(widgets[id]);
        });
        const groups = data.groups && typeof data.groups === 'object' ? data.groups : {};
        Object.keys(groups).forEach(function (gid) {
            const g = groups[gid];
            const nested = g && g.widgets && typeof g.widgets === 'object' ? g.widgets : {};
            Object.keys(nested).forEach(function (wid) {
                if (nested[wid]) fn(nested[wid]);
            });
        });
    },

    getLatestMigrationVersion: function () {
        if (typeof DashboardMigrator !== 'undefined' && typeof DashboardMigrator.getLatestMigrationVersion === 'function') {
            return DashboardMigrator.getLatestMigrationVersion();
        }
        if (typeof window !== 'undefined' && window.LATEST_MIGRATION_VERSION) {
            return window.LATEST_MIGRATION_VERSION;
        }
        return '2.0.0';
    },

    /**
     * Cheap probe mirroring migrator early-exit gates so current-version startpages
     * never download migrator.js (~229 KB). Over-eager is safer than under-eager.
     */
    needsMigration: function (data) {
        if (!data || typeof data !== 'object') return false;
        const originalVersion = String(data.version || '1.0.0');
        const latestMigrationVersion = this.getLatestMigrationVersion();
        if (this.compareVersions(originalVersion, latestMigrationVersion) < 0) return true;

        const m = data.master && typeof data.master === 'object' ? data.master : null;
        if (m) {
            if (m.defaultTrackOutlineColor !== undefined || m.defaultTrackOutlineWidth !== undefined) {
                return true;
            }
            if (m.defaultGraphAxisFont !== undefined
                    || m.defaultGraphAxisFontSize !== undefined
                    || m.defaultGraphAxisFontColor !== undefined
                    || m.defaultGraphAxisFontBold !== undefined) {
                return true;
            }
            const env = m.environment && typeof m.environment === 'object' ? m.environment : null;
            const layout = env && env.layout && typeof env.layout === 'object' ? env.layout : null;
            const resp = layout && layout.responsive && typeof layout.responsive === 'object'
                ? layout.responsive : null;
            const removed = { flex: true, masonry: true, subgrid: true, bento: true };
            if (resp && typeof resp.columnMode === 'string' && removed[resp.columnMode]) {
                return true;
            }
        }

        let found = false;
        const axisKeys = ['axisFont', 'axisFontSize', 'axisFontColor', 'axisFontBold'];
        this._forEachWidgetData(data, function (w) {
            if (found || !w) return;
            const o = w.overrides && typeof w.overrides === 'object' ? w.overrides : null;
            if (!o) return;
            if (o.responsiveOrder !== undefined || o.responsiveColumnSpan !== undefined
                    || o.responsiveHeight !== undefined) {
                found = true;
                return;
            }
            if (w.type === 'graph') {
                if (axisKeys.some(function (k) { return o[k] !== undefined; })) {
                    found = true;
                    return;
                }
                const typ = o.typography;
                if (typ && typeof typ === 'object' && typ.axis && typeof typ.axis === 'object') {
                    found = true;
                }
            }
        });
        return found;
    },

    collectWidgetTypes: function (data) {
        const types = new Set();
        this._forEachWidgetData(data, function (w) {
            if (!w || typeof w.type !== 'string') return;
            let t = w.type;
            if (t === 'textbox') t = 'list';
            types.add(t.toLowerCase());
        });
        return types;
    },

    typesNeedMarkdown: function (types) {
        let need = false;
        types.forEach((t) => {
            if (this.MARKDOWN_WIDGET_TYPES[t]) need = true;
        });
        return need;
    },

    resolveDriverTypeFromData: function (data) {
        let driverType = null;
        if (data && data.master && typeof data.master === 'object') {
            const m = data.master;
            if (typeof m.dataDriver === 'string' && m.dataDriver) {
                driverType = m.dataDriver;
            } else if (m.connection && typeof m.connection === 'object' && typeof m.connection.dataDriver === 'string') {
                driverType = m.connection.dataDriver;
            }
        }
        if (!driverType && window.APP_CONFIG && window.APP_CONFIG.defaults) {
            if (window.APP_CONFIG.defaults.lockedPlatform) {
                driverType = window.APP_CONFIG.defaults.lockedPlatform;
            } else if (window.APP_CONFIG.defaults.dataDriver) {
                driverType = window.APP_CONFIG.defaults.dataDriver;
            }
        }
        if (!driverType) driverType = 'homey';
        driverType = String(driverType).toLowerCase();

        if (window.APP_CONFIG && window.APP_CONFIG.environment === 'homeassistant' && driverType === 'homey') {
            driverType = 'homeassistant';
        }

        if (window.APP_CONFIG && window.APP_CONFIG.defaults && window.APP_CONFIG.defaults.lockedPlatform) {
            return String(window.APP_CONFIG.defaults.lockedPlatform).toLowerCase();
        }
        if (window.APP_CONFIG && window.APP_CONFIG.ui && window.APP_CONFIG.ui.hiddenDrivers) {
            let hidden = window.APP_CONFIG.ui.hiddenDrivers;
            if (!Array.isArray(hidden)) hidden = [hidden];
            let isHidden = false;
            for (let hi = 0; hi < hidden.length; hi++) {
                if (String(hidden[hi] || '').toLowerCase() === driverType) {
                    isHidden = true;
                    break;
                }
            }
            if (isHidden) {
                const fallback = (window.APP_CONFIG.defaults && window.APP_CONFIG.defaults.dataDriver)
                    ? window.APP_CONFIG.defaults.dataDriver
                    : 'simulation';
                driverType = String(fallback).toLowerCase();
            }
        }
        return driverType;
    },

    ensureDriverScript: async function (driverType) {
        const key = String(driverType || 'homey').toLowerCase();
        if (typeof DataDriverRegistry !== 'undefined' && DataDriverRegistry.drivers
                && DataDriverRegistry.drivers[key]) {
            return;
        }
        const path = this.DRIVER_PATHS[key];
        if (!path) {
            console.warn('[WidgetScriptLoader] Unknown driver type:', key);
            return;
        }
        await this.loadScript(path);
    },

    _fetchManifest: function () {
        if (this._manifestPromise) return this._manifestPromise;
        const req = (typeof ConfigLoader !== 'undefined' && typeof ConfigLoader.fetchWithRetry === 'function')
            ? ConfigLoader.fetchWithRetry('widgets-manifest.json')
            : fetch('widgets-manifest.json');
        this._manifestPromise = req.then((res) => {
            if (!res.ok) throw new Error('widgets-manifest.json HTTP ' + res.status);
            return res.json();
        });
        return this._manifestPromise;
    },

    /**
     * Late-load runtime pieces for dashboard JSON that arrives after boot (remote reload,
     * file open in the viewer): widget scripts the registry does not know yet, plus the
     * markdown stack when the data contains text widgets. No-op when everything is loaded.
     */
    ensureRuntimeForData: async function (data) {
        if (!data || typeof data !== 'object') return;
        const types = this.collectWidgetTypes(data);
        const hasRegistry = typeof WidgetRegistry !== 'undefined' && typeof WidgetRegistry.get === 'function';
        const missing = new Set();
        types.forEach((t) => {
            if (hasRegistry && !WidgetRegistry.get(t)) missing.add(t);
        });

        const jobs = [];
        if (missing.size > 0) {
            const experimentalOn = this.isExperimentalWidgetsEnabled();
            jobs.push(this._fetchManifest().then((manifest) => {
                const typePathMap = this.buildTypePathMap(this.resolveWidgetPaths(manifest, experimentalOn));
                return this.loadWidgetsForTypes(missing, typePathMap, { tolerateFailures: true });
            }));
        }
        if (this.typesNeedMarkdown(types)) {
            jobs.push(this.ensureMarkdownRuntime());
        }
        if (jobs.length > 0) await Promise.all(jobs);
    },

    ensureThemesScript: async function () {
        if (typeof PRESET_THEMES !== 'undefined' || typeof PRESET_TEMPLATES !== 'undefined') return;
        if (this._themesPromise) return this._themesPromise;
        this._themesPromise = this.loadScript('themes.js');
        return this._themesPromise;
    },

    ensureTemplatesScript: async function () {
        return this.ensureThemesScript();
    },

    ensureMigratorScript: async function () {
        if (typeof DashboardMigrator !== 'undefined') return;
        if (this._migratorPromise) return this._migratorPromise;
        this._migratorPromise = this.loadScript('migrator.js');
        return this._migratorPromise;
    },

    ensureMarkdownRuntime: async function () {
        if (typeof window.markdownit !== 'undefined' && typeof window.DOMPurify !== 'undefined'
                && typeof MarkdownColorSpec !== 'undefined' && typeof MarkdownBlink !== 'undefined'
                && typeof TextScroll !== 'undefined') {
            return;
        }
        if (this._markdownPromise) return this._markdownPromise;
        const self = this;
        this._markdownPromise = this.loadTail(this.MARKDOWN_RUNTIME);
        return this._markdownPromise;
    },

    authenticatedAssetUrl: function (relativePath) {
        let token = null;
        try {
            const cfg = window.APP_CONFIG;
            if (cfg && cfg.requireToken && cfg.securityToken) {
                token = String(cfg.securityToken);
            }
        } catch (e) { /* ignore */ }
        if (!token) {
            try {
                token = new URL(window.location.href).searchParams.get('token');
            } catch (e2) { /* ignore */ }
        }
        if (!token) return relativePath;
        const sep = relativePath.indexOf('?') >= 0 ? '&' : '?';
        return relativePath + sep + 'token=' + encodeURIComponent(token);
    },

    resolveStartupConfigName: function () {
        const params = new URLSearchParams(window.location.search);
        const explicitConfig = params.get('dashboard') || params.get('cfg');
        let configName = explicitConfig;
        if (!configName) {
            let fromCfg = '';
            try {
                if (window.APP_CONFIG && window.APP_CONFIG.defaults && window.APP_CONFIG.defaults.startupDashboard) {
                    fromCfg = String(window.APP_CONFIG.defaults.startupDashboard).trim();
                }
            } catch (eCfg) {
                fromCfg = '';
            }
            configName = fromCfg || 'dashboard';
        }
        if (!configName.toLowerCase().endsWith('.json')) {
            configName += '.json';
        }
        return {
            configName: configName,
            explicitConfig: explicitConfig,
            pageOverride: params.get('page'),
            templateOverride: params.get('template') || params.get('theme')
        };
    },

    fetchDashboardJson: async function (filename) {
        const url = this.authenticatedAssetUrl('dashboards/' + filename);
        const res = (typeof ConfigLoader !== 'undefined' && typeof ConfigLoader.fetchWithRetry === 'function')
            ? await ConfigLoader.fetchWithRetry(url)
            : await fetch(url);
        if (!res.ok) throw new Error('Config not found');
        return res.json();
    },

    /**
     * Fetch the startup dashboard JSON with the same fallback chain as Dashboard.loadStartupConfig.
     */
    fetchStartupDashboard: async function () {
        const meta = this.resolveStartupConfigName();
        const tryLoad = async (name) => {
            if (typeof dsDebug === 'function') dsDebug('[WidgetScriptLoader] Attempting to load: dashboards/' + name);
            return this.fetchDashboardJson(name);
        };

        try {
            const data = await tryLoad(meta.configName);
            return { data: data, loadedName: meta.configName, meta: meta };
        } catch (err) {
            if (!err || err.message !== 'Config not found') throw err;

            if (meta.explicitConfig) {
                console.warn('[WidgetScriptLoader] Configuration file dashboards/' + meta.configName + ' not found.');
                try {
                    const data = await tryLoad('factorydefault.json');
                    return { data: data, loadedName: 'factorydefault.json', meta: meta, missingExplicit: true };
                } catch (e2) {
                    return {
                        data: { master: {}, globalBindings: {}, widgets: {} },
                        loadedName: 'empty_state',
                        meta: meta,
                        missingExplicit: true
                    };
                }
            }

            if (meta.configName === 'dashboard.json') {
                try {
                    const demoData = await tryLoad('demo.json');
                    return { data: demoData, loadedName: 'demo.json', meta: meta };
                } catch (demoErr) {
                    try {
                        const data = await tryLoad('factorydefault.json');
                        return { data: data, loadedName: 'factorydefault.json', meta: meta };
                    } catch (e3) {
                        return {
                            data: { master: {}, globalBindings: {}, widgets: {} },
                            loadedName: 'empty_state',
                            meta: meta
                        };
                    }
                }
            }

            try {
                const data = await tryLoad('factorydefault.json');
                return { data: data, loadedName: 'factorydefault.json', meta: meta };
            } catch (e4) {
                return {
                    data: { master: {}, globalBindings: {}, widgets: {} },
                    loadedName: 'empty_state',
                    meta: meta
                };
            }
        }
    },

    loadWidgetsForTypes: async function (types, typePathMap, opts) {
        const paths = [];
        const self = this;
        types.forEach(function (t) {
            const p = self.scriptPathForType(t, typePathMap);
            if (p) paths.push(p);
            else console.warn('[WidgetScriptLoader] No script for widget type:', t);
        });
        if (paths.length === 0) return;
        await this.loadScriptsParallel(paths, opts);
    },

    /** What a dashboard file needs at runtime. Shared so viewer and editor boot from one set of rules. */
    _resolveBootNeeds: function (data, manifest, experimentalOn) {
        const types = this.collectWidgetTypes(data);
        const allPaths = this.resolveWidgetPaths(manifest, experimentalOn);
        return {
            types: types,
            allPaths: allPaths,
            typePathMap: this.buildTypePathMap(allPaths),
            needsMarkdown: this.typesNeedMarkdown(types),
            needsMigrate: this.needsMigration(data),
            driverType: this.resolveDriverTypeFromData(data)
        };
    },

    isEditorStackReady: function () {
        return this._editorStackComplete === true;
    },

    /** Resolves once the background editor batch has executed; already-resolved in the viewer. */
    whenEditorStackReady: function () {
        return this._editorStackPromise || Promise.resolve();
    },

    _installDeferredEditorStubs: function () {
        const self = this;
        Object.keys(this.DEFERRED_EDITOR_GLOBALS).forEach(function (name) {
            if (window[name]) return;
            const placeholder = {};
            self.DEFERRED_EDITOR_GLOBALS[name].forEach(function (method) {
                placeholder[method] = function () {
                    const args = Array.prototype.slice.call(arguments);
                    return self.whenEditorStackReady().then(function () {
                        const real = window[name];
                        if (!real || real === placeholder || typeof real[method] !== 'function') return undefined;
                        return real[method].apply(real, args);
                    });
                };
            });
            window[name] = placeholder;
        });
    },

    /**
     * Everything the editor needs eventually but not to put the dashboard on screen: the widget
     * types absent from this canvas (for the Add Widget menu and master defaults), the other
     * drivers, themes, help, galleries, and the Tools shell.
     *
     * Failures are tolerated here because nothing in this batch can cost the file data: every type
     * that is actually on the canvas was loaded strictly in runEditor. Saving waits on this batch
     * so a file is never written from a half-known widget registry.
     */
    _loadDeferredEditorStack: function (needs) {
        if (this._editorStackPromise) return this._editorStackPromise;

        const self = this;
        // Filter on the resolved script path, not the type name: registry types and script
        // basenames diverge (type `empty` lives in widgets/container.js).
        const loadedPaths = {};
        needs.types.forEach(function (t) {
            const p = self.scriptPathForType(t, needs.typePathMap);
            if (p) loadedPaths[p] = true;
        });
        const remainingWidgets = needs.allPaths.filter(function (p) { return !loadedPaths[p]; });
        const remainingDrivers = Object.keys(this.DRIVER_PATHS)
            .filter(function (k) {
                if (k === needs.driverType) return false;
                if (window.APP_CONFIG && window.APP_CONFIG.ui && window.APP_CONFIG.ui.hiddenDrivers) {
                    var hidden = window.APP_CONFIG.ui.hiddenDrivers;
                    if (Array.isArray(hidden) && hidden.indexOf(k) !== -1) return false;
                }
                return true;
            })
            .map(function (k) { return self.DRIVER_PATHS[k]; });

        const first = [this.loadScriptsParallel(remainingWidgets.concat(remainingDrivers), { tolerateFailures: true })];
        if (!needs.needsMarkdown) first.push(this.ensureMarkdownRuntime());

        // help-content.js hooks DOMPurify and text-full-editor.js reads the markdown ops at parse,
        // so the modules batch only starts once the widget and markdown batch has executed.
        this._editorStackPromise = Promise.all(first)
            .then(function () {
                return self.loadScriptsParallel(
                    self.EDITOR_DEFERRED_MODULES.concat(self.EDITOR_DEFERRED),
                    { tolerateFailures: true }
                );
            })
            .then(function () {
                self._editorStackComplete = true;
                if (typeof Dashboard !== 'undefined' && typeof Dashboard.onEditorStackReady === 'function') {
                    Dashboard.onEditorStackReady();
                }
            })
            .catch(function (e) {
                console.error('[WidgetScriptLoader] Deferred editor stack failed:', e);
                self._editorStackComplete = true;
            });

        return this._editorStackPromise;
    },

    /** Let the dashboard win the main thread first; the batch is only needed on user action. */
    _scheduleDeferredEditorStack: function (needs) {
        const self = this;
        const start = function () { void self._loadDeferredEditorStack(needs); };
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(start, { timeout: 1200 });
        } else {
            setTimeout(start, 300);
        }
    },

    runEditor: async function () {
        const experimentalOn = this.isExperimentalWidgetsEnabled();

        // 1) Core runtime (no widgets / migrator / markdown yet); parallel download, ordered execution
        await this.loadScriptsParallel(this.RUNTIME_CORE);

        // 2) Config first (security token may live there), then dashboard JSON + manifest together
        await ConfigLoader.load();
        const appConfig = window.APP_CONFIG;

        const [startup, manifest] = await Promise.all([
            this.fetchStartupDashboard(),
            this._fetchManifest()
        ]);

        const data = startup.data || { master: {}, globalBindings: {}, widgets: {} };
        const needs = this._resolveBootNeeds(data, manifest, experimentalOn);

        // 3) Only what has to be on screen. These stay intolerant of failures: a type that never
        //    arrives is dropped from the canvas and the next save would delete it from the file.
        const critical = [this.loadWidgetsForTypes(needs.types, needs.typePathMap)];
        if (needs.needsMarkdown) critical.push(this.ensureMarkdownRuntime());
        if (needs.needsMigrate) critical.push(this.ensureMigratorScript());
        critical.push(this.ensureDriverScript(needs.driverType));
        if ((startup.meta && startup.meta.templateOverride) ||
            (data && data.globalBindings && data.globalBindings.theme)) {
            critical.push(this.ensureThemesScript());
        }
        await Promise.all(critical);

        await this.loadScriptsParallel(this.EDITOR_TAIL);

        // 4) Hand off to Dashboard with preloaded JSON (skips second dashboard fetch)
        window.__DS_BOOT_PRELOAD__ = {
            appConfig: appConfig || window.APP_CONFIG,
            data: data,
            loadedName: startup.loadedName,
            meta: startup.meta,
            missingExplicit: !!startup.missingExplicit
        };

        this._installDeferredEditorStubs();

        if (typeof Dashboard !== 'undefined' && typeof Dashboard.init === 'function') {
            Dashboard.init();
        }

        this._scheduleDeferredEditorStack(needs);

        if (this.isTestModeActive()) {
            await this.loadScriptsParallel(['perf-tester.js?v=' + Date.now()]);
        }
    },

    runViewer: async function () {
        const experimentalOn = this.isExperimentalWidgetsEnabled();

        // 1) Core runtime (no widgets / migrator / markdown yet); parallel download, ordered execution
        await this.loadScriptsParallel(this.RUNTIME_CORE);

        // 2) Config first (security token may live there), then dashboard JSON + manifest together
        await ConfigLoader.load();
        const appConfig = window.APP_CONFIG;

        const [startup, manifest] = await Promise.all([
            this.fetchStartupDashboard(),
            this._fetchManifest()
        ]);

        const data = startup.data || { master: {}, globalBindings: {}, widgets: {} };
        const needs = this._resolveBootNeeds(data, manifest, experimentalOn);

        // 3) Demand-load only what this dashboard needs.
        // View-only boot: a widget the browser refuses must not cost the whole panel its dashboard.
        const parallel = [this.loadWidgetsForTypes(needs.types, needs.typePathMap, { tolerateFailures: true })];
        if (needs.needsMarkdown) parallel.push(this.ensureMarkdownRuntime());
        if (needs.needsMigrate) parallel.push(this.ensureMigratorScript());
        parallel.push(this.ensureDriverScript(needs.driverType));
        if ((startup.meta && startup.meta.templateOverride) ||
            (data && data.globalBindings && data.globalBindings.theme)) {
            parallel.push(this.ensureThemesScript());
        }
        await Promise.all(parallel);

        // 4) Hand off to Dashboard with preloaded JSON (skips second dashboard fetch)
        window.__DS_BOOT_PRELOAD__ = {
            appConfig: appConfig || window.APP_CONFIG,
            data: data,
            loadedName: startup.loadedName,
            meta: startup.meta,
            missingExplicit: !!startup.missingExplicit
        };

        if (typeof Dashboard !== 'undefined' && typeof Dashboard.init === 'function') {
            Dashboard.init();
        }

        if (this.isTestModeActive()) {
            await this.loadScriptsParallel(['perf-tester.js?v=' + Date.now()]);
        }
    },

    run: async function () {
        const isViewer = window.IS_VIEWER === true;
        try {
            if (isViewer) {
                await this.runViewer();
            } else {
                await this.runEditor();
            }
        } catch (e) {
            console.error('[WidgetScriptLoader]', e);
            const msg = e && e.message ? e.message : String(e);

            // The editor stops here on purpose: widget types whose script is missing are dropped from the
            // canvas, so saving a half-loaded dashboard would delete them from the file.
            const detail = 'Dashboard failed to load widgets: ' + msg
                + '\n\nThe browser can refuse a file after you return with the Back button. Reload to try again.';

            if (typeof CustomDialog !== 'undefined' && typeof CustomDialog.confirmWithLabels === 'function') {
                if (await CustomDialog.confirmWithLabels(detail, 'Load Error', 'Reload', 'Close')) {
                    window.location.reload();
                }
                return;
            }
            if (window.confirm(detail + '\n\nReload now?')) window.location.reload();
        }
    }
};

WidgetScriptLoader.run();
