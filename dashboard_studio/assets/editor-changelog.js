/**
 * Editor changelog viewer — connects header version tag to Dashboard Statistics Changelog tab.
 */
(function () {
    const ChangelogViewer = {
        _bound: false,

        init: function () {
            if (this._bound) return;
            this._bound = true;

            const ver = document.getElementById('app-version');
            if (ver) {
                ver.classList.add('header-tag--changelog');
                ver.setAttribute('role', 'button');
                ver.setAttribute('tabindex', '0');
                ver.setAttribute('title', "What's New - release notes");
                ver.addEventListener('click', function () {
                    ChangelogViewer.open();
                });
                ver.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        ChangelogViewer.open();
                    }
                });
            }
        },

        isOpen: function () {
            if (typeof DashboardStatistics !== 'undefined' && typeof DashboardStatistics.isOpen === 'function') {
                return DashboardStatistics.isOpen();
            }
            return false;
        },

        open: async function () {
            if (typeof DashboardStatistics !== 'undefined' && typeof DashboardStatistics.open === 'function') {
                DashboardStatistics.open('changelog');
                return;
            }
            if (typeof ToolsMenu !== 'undefined' && typeof ToolsRegistry !== 'undefined') {
                const spec = ToolsRegistry.get('dashboard-statistics');
                if (spec && typeof ToolsMenu._ensureScript === 'function') {
                    try {
                        await ToolsMenu._ensureScript(spec);
                    } catch (err) {
                        console.error('[ChangelogViewer] Failed to load dashboard statistics script', err);
                    }
                    if (typeof DashboardStatistics !== 'undefined' && typeof DashboardStatistics.open === 'function') {
                        DashboardStatistics.open('changelog');
                    }
                }
            }
        },

        close: function () {
            if (typeof DashboardStatistics !== 'undefined' && typeof DashboardStatistics.close === 'function') {
                DashboardStatistics.close();
            }
        }
    };

    window.ChangelogViewer = ChangelogViewer;
    ChangelogViewer.init();
})();
