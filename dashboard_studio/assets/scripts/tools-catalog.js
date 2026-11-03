/**
 * Eager Tools menu catalog: registers labels + lazy script paths.
 * Heavy tool UIs load on first click via ToolsRegistry.script.
 */
(function () {
    if (typeof ToolsRegistry === 'undefined') return;

    ToolsRegistry.register({
        id: 'widget-preset-editor',
        label: 'Widget Preset Editor',
        icon: 'ph-table',
        script: 'scripts/widget-preset-editor.js',
        run: function () {
            if (typeof WidgetPresetEditor === 'undefined' || typeof WidgetPresetEditor.open !== 'function') {
                throw new Error('Widget Preset Editor failed to load');
            }
            return WidgetPresetEditor.open();
        }
    });

    ToolsRegistry.register({
        id: 'theme-preset-editor',
        label: 'Theme Preset Editor',
        icon: 'ph-palette',
        script: 'scripts/theme-preset-editor.js',
        run: function () {
            if (typeof ThemePresetEditor === 'undefined' || typeof ThemePresetEditor.open !== 'function') {
                throw new Error('Theme Preset Editor failed to load');
            }
            return ThemePresetEditor.open();
        }
    });

    ToolsRegistry.register({
        id: 'link-open-behavior',
        label: 'Set Link Open Behavior',
        icon: 'ph-arrow-square-out',
        script: 'scripts/link-target.js',
        run: function () {
            if (typeof LinkTargetTool === 'undefined' || typeof LinkTargetTool.open !== 'function') {
                throw new Error('Set Link Open Behavior failed to load');
            }
            return LinkTargetTool.open();
        }
    });

    ToolsRegistry.register({
        id: 'auto-widget-gallery',
        label: 'Auto-Widget Gallery',
        description: 'Generate and batch-add live widgets from incoming data streams.',
        icon: 'ph-squares-four',
        script: 'scripts/auto-widget-gallery.js',
        run: function () {
            if (typeof AutoWidgetGallery === 'undefined' || typeof AutoWidgetGallery.open !== 'function') {
                throw new Error('Auto-Widget Gallery failed to load');
            }
            return AutoWidgetGallery.open();
        }
    });

    ToolsRegistry.register({
        id: 'freeze-dynamic-values',
        label: 'Make All Dynamic Values Fixed',
        icon: 'ph-link-break',
        script: 'scripts/freeze-dynamic-values.js',
        run: function () {
            if (typeof FreezeDynamicValues === 'undefined' || typeof FreezeDynamicValues.open !== 'function') {
                throw new Error('Make All Dynamic Values Fixed failed to load');
            }
            return FreezeDynamicValues.open();
        }
    });

    ToolsRegistry.register({
        id: 'dashboard-statistics',
        label: 'About & Dashboard Statistics',
        description: 'Over-the-top telemetry, live metrics, widget analytics, system specs, and about info.',
        icon: 'ph-chart-pie-slice',
        script: 'scripts/dashboard-statistics.js',
        run: function () {
            if (typeof DashboardStatistics === 'undefined' || typeof DashboardStatistics.open !== 'function') {
                throw new Error('Dashboard Statistics failed to load');
            }
            return DashboardStatistics.open();
        }
    });

    var searchParams = typeof window !== 'undefined' && window.location
        ? new URLSearchParams(window.location.search)
        : null;
    var isFullTestMode = !!(searchParams && (
        searchParams.get('test_mode') === 'full' ||
        searchParams.get('text_mode') === 'full'
    ));

    if (isFullTestMode) {
        ToolsRegistry.register({
            id: 'auto-widget-diagram',
            label: 'Auto-Widget Decision Diagram',
            description: 'Interactive top-down rule flowchart and real-time topic tracer for Auto-Widget Gallery.',
            icon: 'ph-tree-structure',
            script: 'scripts/auto-widget-diagram.js',
            run: function () {
                if (typeof AutoWidgetDiagram === 'undefined' || typeof AutoWidgetDiagram.open !== 'function') {
                    throw new Error('Auto-Widget Decision Diagram failed to load');
                }
                return AutoWidgetDiagram.open();
            }
        });
    }
})();
