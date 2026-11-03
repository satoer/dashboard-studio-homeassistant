/**
 * Editor Tools menu + automation script registry.
 *
 * Mirrors ShareMenu (index-shell-init.js): a fixed, portaled dropdown anchored to the
 * Tools toolbar button in editor.html. Automation scripts live as separate files in
 * assets/scripts/ and register their menu items via ToolsRegistry.register(spec):
 *   { id, label, icon?, script?, run() }
 * Optional `script` is lazy-loaded via WidgetScriptLoader on first click.
 * The dropdown rebuilds on each open so late registrations appear.
 */
(function () {
    const ToolsRegistry = {
        items: [],
        _loadedScripts: {},

        register: function (spec) {
            if (!spec || !spec.id) return;
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i].id === spec.id) {
                    this.items[i] = spec;
                    return;
                }
            }
            this.items.push(spec);
        },

        get: function (id) {
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i].id === id) return this.items[i];
            }
            return null;
        }
    };
    window.ToolsRegistry = ToolsRegistry;

    const ToolsMenu = {
        toggle: function () {
            const dd = document.getElementById('tools-dropdown');
            const btn = document.getElementById('btn-tools');
            if (!dd || !btn) return;
            if (dd.classList.contains('open')) {
                ToolsMenu.close();
                return;
            }
            ToolsMenu._buildItems();
            if (typeof Editor !== 'undefined' && Editor._closeAllDsFixedDropdowns) {
                Editor._closeAllDsFixedDropdowns(dd);
            }
            dd._dsSelectAnchor = btn.parentElement;
            if (typeof Editor !== 'undefined' && Editor._openDsFixedDropdown) {
                Editor._openDsFixedDropdown(dd, btn, true);
            }
            dd.classList.add('open');
            if (typeof Editor !== 'undefined' && Editor._bindDsFixedDropdownOutsideClick) {
                Editor._bindDsFixedDropdownOutsideClick();
            }
        },

        close: function () {
            const dd = document.getElementById('tools-dropdown');
            if (!dd) return;
            dd.classList.remove('open');
            if (typeof Editor !== 'undefined' && Editor._closeDsFixedDropdown) {
                Editor._closeDsFixedDropdown(dd);
            }
        },

        _buildItems: function () {
            const dd = document.getElementById('tools-dropdown');
            if (!dd) return;
            dd.innerHTML = '';
            const items = ToolsRegistry.items;
            for (var i = 0; i < items.length; i++) {
                dd.appendChild(ToolsMenu._buildItem(items[i]));
            }
        },

        _ensureScript: async function (spec) {
            const src = spec && spec.script ? String(spec.script) : '';
            if (!src) return true;
            if (ToolsRegistry._loadedScripts[src]) return true;
            if (typeof WidgetScriptLoader === 'undefined' || typeof WidgetScriptLoader.loadScript !== 'function') {
                throw new Error('Script loader unavailable');
            }
            await WidgetScriptLoader.loadScript(src);
            ToolsRegistry._loadedScripts[src] = true;
            return true;
        },

        _runSpec: async function (spec) {
            await ToolsMenu._ensureScript(spec);
            const fresh = ToolsRegistry.get(spec.id) || spec;
            if (typeof fresh.run !== 'function') {
                throw new Error('Tool has no run() handler');
            }
            const result = fresh.run();
            if (result && typeof result.then === 'function') await result;
        },

        runTool: async function (id) {
            const spec = ToolsRegistry.get(id);
            if (!spec) return;
            try {
                await ToolsMenu._runSpec(spec);
            } catch (err) {
                const msg = err && err.message ? err.message : String(err);
                if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                    CustomDialog.alert('Tool failed: ' + msg, 'Error');
                }
            }
        },

        _buildItem: function (spec) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tools-dropdown-item';
            if (spec.icon) {
                const icon = document.createElement('i');
                icon.className = 'ph-bold ' + String(spec.icon);
                btn.appendChild(icon);
            }
            const label = document.createElement('span');
            label.textContent = String(spec.label || spec.id);
            btn.appendChild(label);
            if (spec.description) btn.title = String(spec.description);
            btn.addEventListener('click', function () {
                ToolsMenu.close();
                void ToolsMenu._runSpec(spec).catch(function (err) {
                    const msg = err && err.message ? err.message : String(err);
                    if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                        CustomDialog.alert('Tool failed: ' + msg, 'Error');
                    }
                });
            });
            return btn;
        }
    };
    window.ToolsMenu = ToolsMenu;
})();
