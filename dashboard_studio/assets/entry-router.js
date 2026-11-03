/**
 * Lightweight entry router for index.html.
 * Reads hideEditor from config.json and settings.json, then redirects to viewer or editor.
 * Same-session revisits use sessionStorage to skip the config round-trip (startpage-friendly).
 * Prefer bookmarking viewer.html directly for absolute cold-start speed.
 */
(function () {
    var path = window.location.pathname || '';
    if (path.endsWith('/editor.html') || path.endsWith('/viewer.html')) {
        return;
    }

    var CACHE_KEY = 'ds_hideEditor';

    function readHideEditorFromConfig(data) {
        if (!data || typeof data !== 'object') return undefined;
        if (data.defaults && data.defaults.hideEditor !== undefined) {
            return data.defaults.hideEditor === true;
        }
        if (data.defaults && data.defaults.hideEditButton !== undefined) {
            return data.defaults.hideEditButton === true;
        }
        if (data.hideEditor !== undefined) return data.hideEditor === true;
        if (data.hideEditButton !== undefined) return data.hideEditButton === true;
        return undefined;
    }

    function resolveHideEditor(configData, settingsData) {
        let hideEditor = readHideEditorFromConfig(configData);
        const settingsValue = readHideEditorFromConfig(settingsData);
        if (settingsValue !== undefined) hideEditor = settingsValue;
        return hideEditor === true;
    }

    function forceEditorMode() {
        const params = new URLSearchParams(window.location.search);
        return params.get('editor') === '1' || params.get('editor') === 'true';
    }

    function redirectTarget(hideEditor) {
        const suffix = (window.location.search || '') + (window.location.hash || '');
        const target = hideEditor && !forceEditorMode() ? 'viewer.html' : 'editor.html';
        if (path.endsWith('/' + target)) {
            return;
        }
        window.location.replace(target + suffix);
    }

    function fetchJson(url) {
        return new Promise(function (resolve) {
            var timer = setTimeout(function () { resolve({}); }, 15000);
            fetch(url).then(function (res) {
                clearTimeout(timer);
                if (!res.ok) return resolve({});
                res.json().then(resolve, function () { resolve({}); });
            }).catch(function () {
                clearTimeout(timer);
                resolve({});
            });
        });
    }

    function cacheHideEditor(hideEditor) {
        try {
            sessionStorage.setItem(CACHE_KEY, hideEditor ? '1' : '0');
        } catch (e) { /* private mode */ }
    }

    function readCachedHideEditor() {
        try {
            const v = sessionStorage.getItem(CACHE_KEY);
            if (v === '1') return true;
            if (v === '0') return false;
        } catch (e) { /* private mode */ }
        return undefined;
    }

    function fetchAndRedirect() {
        return Promise.all([
            fetchJson('config.json'),
            fetchJson('settings.json')
        ]).then(function (results) {
            const hideEditor = resolveHideEditor(results[0], results[1]);
            cacheHideEditor(hideEditor);
            redirectTarget(hideEditor);
        }).catch(function () {
            cacheHideEditor(false);
            redirectTarget(false);
        });
    }

    // Same-session revisit: redirect immediately from cache, refresh cache in background.
    if (!forceEditorMode()) {
        const cached = readCachedHideEditor();
        if (cached !== undefined) {
            redirectTarget(cached);
            Promise.all([fetchJson('config.json'), fetchJson('settings.json')]).then(function (results) {
                cacheHideEditor(resolveHideEditor(results[0], results[1]));
            }).catch(function () { /* ignore */ });
            return;
        }
    }

    fetchAndRedirect();
})();
