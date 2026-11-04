/**
 * Dashboard Studio - Performance Tester & Diagnostic Suite
 * Standalone test mode inspector loaded only when ?test_mode=performance or ?test_mode=full is active.
 * Provides real-time FPS & extremes tracking, automated benchmark suite, and comprehensive diagnostic reports.
 * 
 * Compatibility: Fully Safari 12 / iOS 12 compatible (zero ES2020+ operators).
 */
(function () {
    'use strict';

    // Hard stop: this file must not install hooks, timers, or DOM unless the
    // page was opened with ?test_mode=performance or ?test_mode=full.
    var testModeParam = '';
    try {
        testModeParam = new URLSearchParams(window.location.search).get('test_mode') || '';
    } catch (eTestMode) {
        testModeParam = '';
    }
    if (testModeParam !== 'performance' && testModeParam !== 'full') return;

    if (window.__DS_PERF_TESTER__) return;

    var PerfTester = {
        version: '1.0.0',
        activeTab: 'extremes',
        isExpanded: false,
        isRealtimeActive: true,
        rafId: null,
        lastFrameTime: performance.now(),
        frameCount: 0,
        fpsLastSampleTime: performance.now(),
        currentFps: 60,
        frameTimeMs: 16.6,
        lastActionName: 'None',
        lastActionMs: 0,

        // Session extremes tracking dictionary
        metrics: {
            fps: { count: 0, last: 60, min: 60, max: 60, avg: 60, sum: 60, history: [] },
            frameTime: { count: 0, last: 16.6, min: 16.6, max: 16.6, avg: 16.6, sum: 16.6, history: [] },
            dashboardLoad: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            editorOpen: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            editorClose: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            editModeVisuals: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            editLabelsSync: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            widgetSelection: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            selectionVisual: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            dropdownSync: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            dropdownRebuild: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            inspectorLoad: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            reactiveRefresh: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            responsiveReflow: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            responsiveRemeasure: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            updateGlobal: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            pageSwitch: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            dirtyFlush: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] },
            dashboardRender: { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] }
        },

        benchmarkState: {
            isRunning: false,
            score: null,
            grade: null,
            results: null,
            log: ''
        },

        isViewerMode: function () {
            return window.IS_VIEWER === true || document.body.classList.contains('viewer-mode') || !document.getElementById('editor-panel');
        },

        getDashboard: function () {
            if (typeof Dashboard !== 'undefined') return Dashboard;
            if (typeof window.Dashboard !== 'undefined') return window.Dashboard;
            return null;
        },

        getEditor: function () {
            if (typeof Editor !== 'undefined') return Editor;
            if (typeof window.Editor !== 'undefined') return window.Editor;
            return null;
        },

        getBaseWidget: function () {
            if (typeof BaseWidget !== 'undefined') return BaseWidget;
            if (typeof window.BaseWidget !== 'undefined') return window.BaseWidget;
            return null;
        },

        /**
         * Initialize performance tester, styles, hooks, and DOM elements
         */
        init: function () {
            var self = this;
            this.injectStyles();
            this.waitForDependencies(function () {
                self.installHooks();
                self.mountUI();
                self.startRealtimeMonitoring();
            });
        },

        /**
         * Wait until Dashboard, Editor, and DOM containers are ready
         */
        waitForDependencies: function (callback) {
            var self = this;
            var attempts = 0;
            var interval = setInterval(function () {
                attempts++;
                var d = self.getDashboard();
                var hasDashboard = d && d.init;
                var isViewer = self.isViewerMode();
                if (isViewer) {
                    var canvas = document.getElementById('dashboard-canvas');
                    if ((hasDashboard && canvas) || attempts > 60) {
                        clearInterval(interval);
                        callback();
                    }
                } else {
                    var container = document.getElementById('editor-scroll-container');
                    var tools = document.getElementById('editor-tools');
                    if ((container && tools && hasDashboard) || attempts > 120) {
                        clearInterval(interval);
                        callback();
                    }
                }
            }, 50);
        },

        /**
         * Record a single measurement for a metric key
         */
        recordMetric: function (key, durationMs, actionLabel) {
            var m = this.metrics[key];
            if (!m) {
                m = { count: 0, last: 0, min: 999999, max: 0, avg: 0, sum: 0, history: [] };
                this.metrics[key] = m;
            }
            durationMs = Math.round(durationMs * 100) / 100;
            m.count++;
            m.last = durationMs;
            m.sum += durationMs;
            m.avg = Math.round((m.sum / m.count) * 100) / 100;
            if (durationMs < m.min) m.min = durationMs;
            if (durationMs > m.max) m.max = durationMs;
            m.history.push(durationMs);
            if (m.history.length > 30) m.history.shift();

            if (actionLabel) {
                this.lastActionName = actionLabel;
                this.lastActionMs = durationMs;
            }

            // Schedule UI update asynchronously to avoid inflating measured time
            this.scheduleUiUpdate();
        },

        /**
         * Reset all recorded extremes and histories
         */
        resetExtremes: function () {
            if (this._watchdogTimer) {
                clearTimeout(this._watchdogTimer);
                this._watchdogTimer = null;
            }
            this.benchmarkState.isRunning = false;
            var keys = Object.keys(this.metrics);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var initVal = (k === 'fps') ? 60 : (k === 'frameTime' ? 16.6 : 0);
                var initMin = (k === 'fps' || k === 'frameTime') ? initVal : 999999;
                this.metrics[k] = {
                    count: 0,
                    last: initVal,
                    min: initMin,
                    max: initVal,
                    avg: initVal,
                    sum: 0,
                    history: []
                };
            }
            var d = this.getDashboard();
            if (d && typeof d.lastDashboardLoadDurationMs === 'number' && d.lastDashboardLoadDurationMs > 0) {
                this.recordMetric('dashboardLoad', d.lastDashboardLoadDurationMs, 'Dashboard Load');
            }
            this.lastActionName = 'Reset';
            this.lastActionMs = 0;
            this.benchmarkState.score = null;
            this.benchmarkState.grade = null;
            this.benchmarkState.results = null;
            this.updateUI();
            this.updateTabContent();
        },

        /**
         * Safely wrap a method to measure execution duration (synchronous or Promise-returning)
         */
        wrapMethod: function (targetObj, methodName, metricKey, actionLabel, customCallback) {
            var self = this;
            if (!targetObj || typeof targetObj[methodName] !== 'function') return;
            var original = targetObj[methodName];
            targetObj[methodName] = function () {
                var start = performance.now();
                var args = arguments;
                var result = original.apply(this, args);
                function emit(dur, res) {
                    self.recordMetric(metricKey, dur, actionLabel);
                    if (typeof customCallback === 'function') {
                        try {
                            customCallback(dur, args, res);
                        } catch (e) {
                            console.warn('[PerfTester] callback error:', e);
                        }
                    }
                }
                if (result && typeof result.then === 'function') {
                    return result.then(function (res) {
                        emit(performance.now() - start, res);
                        return res;
                    });
                }
                emit(performance.now() - start, result);
                return result;
            };
        },

        /**
         * Install non-intrusive instrumentation hooks
         */
        installHooks: function () {
            var self = this;
            var d = this.getDashboard();
            if (d) {
                // Hook toggleEditMode
                var origToggle = d.toggleEditMode;
                if (typeof origToggle === 'function') {
                    d.toggleEditMode = function () {
                        var isCurrentlyOpen = document.body.classList.contains('edit-mode');
                        var start = performance.now();
                        var res = origToggle.apply(this, arguments);
                        var dur = performance.now() - start;
                        if (isCurrentlyOpen) {
                            self.recordMetric('editorClose', dur, 'Editor Close');
                        } else {
                            self.recordMetric('editorOpen', dur, 'Editor Open');
                        }
                        return res;
                    };
                }

                // Hook selectWidget
                this.wrapMethod(d, 'selectWidget', 'widgetSelection', 'Select Widget');

                // Hook selection visual state
                this.wrapMethod(d, '_applySelectionVisualState', 'selectionVisual', 'Visual State');

                // Hook responsive passes
                this.wrapMethod(d, '_runResponsiveReflowPass', 'responsiveReflow', 'Responsive Reflow');
                this.wrapMethod(d, '_runResponsiveRemeasurePass', 'responsiveRemeasure', 'Remeasure Pass');

                // Hook global settings update
                this.wrapMethod(d, 'updateGlobal', 'updateGlobal', 'Update Global');

                // Viewer and general runtime hooks
                if (!self._filePayload && d.lastLoadedRawData) {
                    self._filePayload = d.lastLoadedRawData;
                }
                this.wrapMethod(d, 'loadDashboardData', 'dashboardLoad', 'Dashboard Load', function (dur, args) {
                    if (args && args.length && args[0]) {
                        self._filePayload = args[0];
                    }
                });
                this.wrapMethod(d, 'setPage', 'pageSwitch', 'Page Switch');
                this.wrapMethod(d, '_flushDirtyWidgets', 'dirtyFlush', 'Flush Dirty');
                this.wrapMethod(d, 'render', 'dashboardRender', 'Render Dashboard');

                // Read initial dashboard load duration if recorded during boot
                if (typeof d.lastDashboardLoadDurationMs === 'number' && d.lastDashboardLoadDurationMs > 0) {
                    this.recordMetric('dashboardLoad', d.lastDashboardLoadDurationMs, 'Dashboard Load');
                }
            }

            var ed = this.getEditor();
            if (ed) {
                this.wrapMethod(ed, 'loadWidget', 'inspectorLoad', 'Inspector Load');
                this.wrapMethod(ed, 'refreshDropdown', 'dropdownRebuild', 'Dropdown Rebuild');
                this.wrapMethod(ed, 'syncDropdownSelection', 'dropdownSync', 'Dropdown Sync');
                this.wrapMethod(ed, '_refreshReactiveInspector', 'reactiveRefresh', 'Reactive Refresh');
            }

            var bw = this.getBaseWidget();
            if (bw && bw.prototype) {
                this.wrapMethod(bw.prototype, '_syncEditModeVisuals', 'editModeVisuals', 'Edit Visuals');
                this.wrapMethod(bw.prototype, '_syncEditLabelDisplay', 'editLabelsSync', 'Label Sync');
            }
        },

        /**
         * Start real-time requestAnimationFrame FPS loop
         */
        startRealtimeMonitoring: function () {
            var self = this;
            this.isRealtimeActive = true;
            this.lastFrameTime = performance.now();
            this.fpsLastSampleTime = performance.now();
            this.frameCount = 0;

            function frameLoop(now) {
                if (!self.isRealtimeActive) return;
                var delta = now - self.lastFrameTime;
                self.lastFrameTime = now;
                self.frameCount++;

                if (delta > 0 && delta < 500) {
                    self.frameTimeMs = Math.round(delta * 10) / 10;
                }

                // Sample FPS every 500ms
                if (now - self.fpsLastSampleTime >= 500) {
                    var elapsed = (now - self.fpsLastSampleTime) / 1000;
                    var fps = Math.round(self.frameCount / elapsed);
                    self.currentFps = fps;
                    self.frameCount = 0;
                    self.fpsLastSampleTime = now;

                    self.recordMetric('fps', fps, null);
                    self.recordMetric('frameTime', self.frameTimeMs, null);
                }

                self.rafId = requestAnimationFrame(frameLoop);
            }

            this.rafId = requestAnimationFrame(frameLoop);
        },

        /**
         * Stop real-time frame loop
         */
        stopRealtimeMonitoring: function () {
            this.isRealtimeActive = false;
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            this.updateUI();
        },

        /**
         * Toggle real-time monitoring on/off
         */
        toggleRealtimeMonitoring: function () {
            if (this.isRealtimeActive) {
                this.stopRealtimeMonitoring();
            } else {
                this.startRealtimeMonitoring();
            }
        },

        /**
         * Schedule a throttled UI update
         */
        _uiUpdateScheduled: false,
        scheduleUiUpdate: function () {
            var self = this;
            if (this._uiUpdateScheduled) return;
            this._uiUpdateScheduled = true;
            requestAnimationFrame(function () {
                self._uiUpdateScheduled = false;
                self.updateUI();
            });
        },

        /**
         * Compute health classification and colors
         */
        getHealthStatus: function () {
            var fps = this.currentFps;
            var openAvg = this.metrics.editorOpen.count > 0 ? this.metrics.editorOpen.avg : 0;
            if (fps >= 55 && (openAvg === 0 || openAvg < 350)) {
                return { text: 'Optimal', grade: 'A+', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
            } else if (fps >= 45 && (openAvg === 0 || openAvg < 600)) {
                return { text: 'Good', grade: 'A', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' };
            } else if (fps >= 30 && (openAvg === 0 || openAvg < 1200)) {
                return { text: 'Moderate', grade: 'B', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
            } else {
                return { text: 'Lagging', grade: 'C', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
            }
        },

        /**
         * Inject scoped CSS rules matching Dashboard Studio design system
         */
        injectStyles: function () {
            if (document.getElementById('ds-perf-styles')) return;
            var style = document.createElement('style');
            style.id = 'ds-perf-styles';
            style.textContent = [
                '/* Dashboard Studio Performance Tester Styling */',
                '#ds-perf-panel.ds-perf-viewer-overlay {',
                '    position: fixed;',
                '    top: 48px;',
                '    right: 16px;',
                '    width: 440px;',
                '    max-width: calc(100vw - 32px);',
                '    max-height: calc(100vh - 64px);',
                '    z-index: 10000;',
                '    margin: 0;',
                '    background: rgba(15, 23, 42, 0.94);',
                '    border: 1px solid rgba(255, 255, 255, 0.18);',
                '    border-radius: 1rem;',
                '    backdrop-filter: blur(20px) saturate(1.3);',
                '    -webkit-backdrop-filter: blur(20px) saturate(1.3);',
                '    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.55);',
                '    display: flex;',
                '    flex-direction: column;',
                '    overflow: hidden;',
                '}',
                '#ds-perf-panel.ds-perf-viewer-overlay.collapsed,',
                '#ds-perf-panel.ds-perf-viewer-overlay.is-collapsed {',
                '    display: none !important;',
                '}',
                '#ds-perf-panel .section-title {',
                '    font-size: var(--type-title, 0.82rem);',
                '    font-weight: 700;',
                '    color: var(--text-main, #f8fafc);',
                '    margin-bottom: 0;',
                '    display: flex;',
                '    align-items: center;',
                '    gap: 0.5rem;',
                '    cursor: pointer;',
                '    padding: 0.75rem 1rem;',
                '    user-select: none;',
                '    transition: background-color 0.2s ease;',
                '    border-radius: var(--radius-card, 1rem) var(--radius-card, 1rem) 0 0;',
                '}',
                '#ds-perf-panel.collapsed > .section-title {',
                '    border-radius: var(--radius-card, 1rem);',
                '}',
                '#ds-perf-panel .section-title > i:first-child {',
                '    color: var(--accent, #38bdf8);',
                '    font-size: 1.125rem;',
                '}',
                '#ds-perf-panel .section-title:hover {',
                '    background-color: var(--surface-bg-hover, rgba(255, 255, 255, 0.05));',
                '}',
                '#ds-perf-panel .section-title i.chevron {',
                '    margin-left: auto;',
                '    transition: transform 0.3s ease;',
                '    font-size: 11px;',
                '}',
                '#ds-perf-panel.collapsed .section-title i.chevron {',
                '    transform: rotate(-90deg);',
                '}',
                '#ds-perf-panel.collapsed .group-content,',
                '#ds-perf-panel.collapsed .ds-perf-body,',
                '#ds-perf-panel.is-collapsed .ds-perf-body {',
                '    display: none !important;',
                '}',
                '.ds-perf-body {',
                '    padding: 0.75rem 1rem 1rem 1rem;',
                '    border-top: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));',
                '    max-height: 520px;',
                '    overflow-y: auto;',
                '}',
                'body.edit-mode.ui-light .ds-perf-body {',
                '    border-top-color: var(--glass-border, rgba(0, 0, 0, 0.08));',
                '}',
                '.ds-perf-tabs {',
                '    display: grid;',
                '    grid-template-columns: repeat(4, 1fr);',
                '    gap: 4px;',
                '    background: rgba(0, 0, 0, 0.22);',
                '    border-radius: var(--radius-control, 0.75rem);',
                '    padding: 3px;',
                '    margin-bottom: 0.75rem;',
                '}',
                'body.edit-mode.ui-light .ds-perf-tabs {',
                '    background: rgba(0, 0, 0, 0.05);',
                '}',
                '.ds-perf-tab-btn {',
                '    border: none;',
                '    background: transparent;',
                '    color: var(--text-muted, #94a3b8);',
                '    font-size: 11px;',
                '    font-weight: 600;',
                '    padding: 6px 2px;',
                '    border-radius: var(--radius-chip, 0.5rem);',
                '    cursor: pointer;',
                '    display: flex;',
                '    flex-direction: column;',
                '    align-items: center;',
                '    justify-content: center;',
                '    gap: 3px;',
                '    transition: all 0.15s ease;',
                '    text-align: center;',
                '}',
                '.ds-perf-tab-btn i { font-size: 14px; }',
                '.ds-perf-tab-btn:hover:not(.active) {',
                '    background: rgba(255, 255, 255, 0.06);',
                '    color: var(--text-main, #f8fafc);',
                '}',
                '.ds-perf-tab-btn.active {',
                '    background: var(--accent, #3b82f6);',
                '    color: #ffffff;',
                '    box-shadow: var(--elev-1, 0 2px 4px rgba(0, 0, 0, 0.2));',
                '}',
                'body.edit-mode.ui-light .ds-perf-tab-btn:hover:not(.active) {',
                '    background: rgba(0, 0, 0, 0.04);',
                '    color: #1e293b;',
                '}',
                '.ds-perf-grid-cards {',
                '    display: grid;',
                '    grid-template-columns: repeat(3, 1fr);',
                '    gap: 6px;',
                '    margin-bottom: 8px;',
                '}',
                '.ds-perf-card {',
                '    background: var(--surface-bg, rgba(8, 14, 28, 0.55));',
                '    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));',
                '    border-radius: var(--radius-chip, 0.5rem);',
                '    padding: 7px 6px;',
                '    text-align: center;',
                '    box-shadow: var(--elev-1);',
                '}',
                'body.edit-mode.ui-light .ds-perf-card {',
                '    background: rgba(255, 255, 255, 0.85);',
                '    border-color: rgba(0, 0, 0, 0.08);',
                '}',
                '.ds-perf-card-title {',
                '    font-size: 9px;',
                '    font-weight: 700;',
                '    color: var(--text-muted, #94a3b8);',
                '    text-transform: uppercase;',
                '    letter-spacing: 0.05em;',
                '    margin-bottom: 2px;',
                '}',
                '.ds-perf-card-value {',
                '    font-size: 15px;',
                '    font-weight: 700;',
                '    font-family: monospace;',
                '    color: var(--accent, #38bdf8);',
                '    line-height: 1.2;',
                '}',
                '.ds-perf-card-sub {',
                '    font-size: 9px;',
                '    color: var(--text-muted, #94a3b8);',
                '    margin-top: 2px;',
                '}',
                '.ds-perf-table {',
                '    width: 100%;',
                '    border-collapse: separate;',
                '    border-spacing: 0;',
                '    font-size: 11px;',
                '    border-radius: var(--radius-control, 0.75rem);',
                '    overflow: hidden;',
                '    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.12));',
                '    background: var(--surface-bg, rgba(8, 14, 28, 0.55));',
                '}',
                '.ds-perf-table th {',
                '    text-align: left;',
                '    padding: 6px 8px;',
                '    font-size: 10px;',
                '    font-weight: 700;',
                '    text-transform: uppercase;',
                '    letter-spacing: 0.05em;',
                '    color: var(--text-muted, #94a3b8);',
                '    background: rgba(0, 0, 0, 0.3);',
                '    border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));',
                '}',
                '.ds-perf-table td {',
                '    padding: 5px 8px;',
                '    border-bottom: 1px solid rgba(255, 255, 255, 0.05);',
                '}',
                '.ds-perf-table tr:last-child td { border-bottom: none; }',
                '.ds-perf-table tr:hover td { background: rgba(255, 255, 255, 0.04); }',
                'body.edit-mode.ui-light .ds-perf-table,',
                'body.ui-light .ds-perf-table {',
                '    background: rgba(255, 255, 255, 0.85);',
                '    border-color: rgba(0, 0, 0, 0.08);',
                '}',
                'body.edit-mode.ui-light .ds-perf-table th,',
                'body.ui-light .ds-perf-table th {',
                '    background: rgba(0, 0, 0, 0.04);',
                '    border-bottom-color: rgba(0, 0, 0, 0.08);',
                '}',
                'body.edit-mode.ui-light .ds-perf-table td,',
                'body.ui-light .ds-perf-table td {',
                '    border-bottom-color: rgba(0, 0, 0, 0.06);',
                '}',
                'body.edit-mode.ui-light .ds-perf-table tr:hover td,',
                'body.ui-light .ds-perf-table tr:hover td {',
                '    background: rgba(0, 0, 0, 0.03);',
                '}',
                '.ds-perf-num { font-family: monospace; font-weight: 600; }',
                '.ds-perf-pill-fast { color: #10b981; }',
                '.ds-perf-pill-slow { color: #ef4444; }',
                '.ds-perf-bench-box {',
                '    background: var(--surface-bg, rgba(8, 14, 28, 0.55));',
                '    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.12));',
                '    border-radius: var(--radius-control, 0.75rem);',
                '    padding: 14px;',
                '    text-align: center;',
                '    margin-bottom: 10px;',
                '    box-shadow: var(--elev-1);',
                '}',
                'body.edit-mode.ui-light .ds-perf-bench-box {',
                '    background: rgba(255, 255, 255, 0.85);',
                '    border-color: rgba(0, 0, 0, 0.08);',
                '}',
                '.ds-perf-bench-grade {',
                '    font-size: 38px;',
                '    font-weight: 800;',
                '    line-height: 1;',
                '    margin: 8px 0;',
                '    color: var(--accent, #38bdf8);',
                '}',
                '.ds-perf-log-box {',
                '    background: var(--input-bg-solid, rgba(10, 16, 32, 0.92));',
                '    border: 1px solid var(--input-border, rgba(255, 255, 255, 0.12));',
                '    border-radius: var(--radius-control, 0.75rem);',
                '    padding: 10px;',
                '    font-family: monospace;',
                '    font-size: 11px;',
                '    line-height: 1.45;',
                '    color: #cbd5e1;',
                '    max-height: 180px;',
                '    overflow-y: auto;',
                '    white-space: pre-wrap;',
                '    text-align: left;',
                '    margin-top: 10px;',
                '}',
                'body.edit-mode.ui-light .ds-perf-log-box {',
                '    background: #f8fafc;',
                '    border-color: #cbd5e1;',
                '    color: #334155;',
                '}',
                '/* Floating Pill for Viewer and Closed Editor */',
                '#ds-perf-floating-pill {',
                '    position: fixed;',
                '    top: 12px;',
                '    right: 65px;',
                '    z-index: 9999;',
                '    background: var(--glass-bg-solid, rgba(15, 23, 42, 0.92));',
                '    backdrop-filter: var(--glass-blur-chip, blur(16px) saturate(1.25));',
                '    -webkit-backdrop-filter: var(--glass-blur-chip, blur(16px) saturate(1.25));',
                '    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.15));',
                '    border-radius: 20px;',
                '    padding: 5px 12px;',
                '    font-size: 11px;',
                '    font-weight: 600;',
                '    color: var(--text-main, #f8fafc);',
                '    display: flex;',
                '    align-items: center;',
                '    gap: 6px;',
                '    cursor: pointer;',
                '    box-shadow: var(--elev-2, 0 4px 12px rgba(0,0,0,0.3));',
                '    transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;',
                '    user-select: none;',
                '}',
                '#ds-perf-floating-pill:hover {',
                '    transform: scale(1.03);',
                '    background: var(--glass-bg-hover, rgba(30, 41, 59, 0.95));',
                '    border-color: var(--glass-border-highlight, rgba(255, 255, 255, 0.3));',
                '}',
                '#ds-perf-floating-pill { top: 12px; right: 16px; display: flex; }',
                '/* Self-contained button and layout styles inside panel */',
                '#ds-perf-panel .btn-tool {',
                '    display: inline-flex;',
                '    align-items: center;',
                '    justify-content: center;',
                '    gap: 6px;',
                '    height: 28px;',
                '    padding: 0 10px;',
                '    border-radius: 6px;',
                '    font-size: 11px;',
                '    font-weight: 600;',
                '    background: var(--glass-bg, rgba(255, 255, 255, 0.08));',
                '    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.12));',
                '    color: var(--text-main, #f8fafc);',
                '    cursor: pointer;',
                '    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;',
                '    user-select: none;',
                '    box-sizing: border-box;',
                '}',
                '#ds-perf-panel .btn-tool:hover {',
                '    background: var(--glass-bg-hover, rgba(255, 255, 255, 0.15));',
                '    border-color: var(--glass-border-highlight, rgba(255, 255, 255, 0.25));',
                '}',
                '#ds-perf-panel .btn-tool.primary {',
                '    background: var(--accent, #0284c7);',
                '    border-color: var(--accent, #38bdf8);',
                '    color: #ffffff;',
                '}',
                '#ds-perf-panel .btn-tool.primary:hover {',
                '    background: var(--accent-hover, #0369a1);',
                '}',
                '#ds-perf-panel .btn-tool:disabled,',
                '#ds-perf-panel .btn-tool.is-disabled {',
                '    opacity: 0.5;',
                '    cursor: not-allowed;',
                '    pointer-events: none;',
                '}',
                'body.edit-mode.ui-light #ds-perf-panel .btn-tool:not(.primary),',
                'body.ui-light #ds-perf-panel .btn-tool:not(.primary) {',
                '    background: rgba(255, 255, 255, 0.85);',
                '    border-color: rgba(0, 0, 0, 0.12);',
                '    color: var(--text-main, #0f172a);',
                '    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);',
                '}',
                'body.edit-mode.ui-light #ds-perf-panel .btn-tool:not(.primary):hover,',
                'body.ui-light #ds-perf-panel .btn-tool:not(.primary):hover {',
                '    background: #ffffff;',
                '    border-color: rgba(0, 0, 0, 0.22);',
                '    color: var(--text-main, #0f172a);',
                '}',
                'body.edit-mode.ui-light #ds-perf-panel .btn-tool.primary,',
                'body.ui-light #ds-perf-panel .btn-tool.primary {',
                '    background: var(--accent, #0284c7);',
                '    border-color: var(--accent, #0284c7);',
                '    color: #ffffff;',
                '}',
                'body.edit-mode.ui-light #ds-perf-panel .btn-tool.primary:hover,',
                'body.ui-light #ds-perf-panel .btn-tool.primary:hover {',
                '    background: var(--accent-hover, #0369a1);',
                '}',
                '#ds-perf-panel .btn-tool-icon-only {',
                '    padding: 0;',
                '    width: 28px;',
                '    min-width: 28px;',
                '}',
                '#ds-perf-panel .grid { display: grid; }',
                '#ds-perf-panel .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }',
                '#ds-perf-panel .gap-2 { gap: 0.5rem; }',
                '#ds-perf-panel .flex-1 { flex: 1 1 0%; }'
            ].join('\n');
            document.head.appendChild(style);
        },

        /**
         * Mount panel inside #editor-tools between Editor Tools header and Viewer URL
         */
        mountUI: function () {
            var self = this;
            if (document.getElementById('ds-perf-panel')) return;

            var isViewer = this.isViewerMode();
            var tools = document.getElementById('editor-tools');
            if (!isViewer && !tools) {
                setTimeout(function () { self.mountUI(); }, 100);
                return;
            }

            // 1. Create main panel matching .control-group
            var panel = document.createElement('div');
            panel.id = 'ds-perf-panel';
            panel.className = isViewer ? 'control-group ds-perf-viewer-overlay collapsed' : 'control-group collapsed';
            if (!isViewer) {
                panel.style.marginTop = '0.25rem';
                panel.style.marginBottom = '0.75rem';
            }

            var viewerClose = isViewer
                ? '<i class="ph-bold ph-x" id="ds-perf-close-overlay-btn" data-ds-action="close-viewer-overlay" title="Close performance overlay" style="font-size:13px; margin-left:8px; cursor:pointer; opacity:0.75; padding:2px 4px;"></i>'
                : '';

            panel.innerHTML = [
                '<div class="section-title" id="ds-perf-header-toggle" title="' + (isViewer ? 'Performance Monitor' : 'Click to expand/collapse Performance') + '">',
                '    <i class="ph-bold ph-gauge" style="color:var(--accent,#38bdf8); font-size:1.125rem;"></i>',
                '    <span>Performance</span>',
                '    <span id="ds-perf-fps-badge" style="color:var(--text-muted,#94a3b8); font-size:11px; font-weight:normal; margin-left:6px; opacity:0.85;">(60 FPS)</span>',
                '    <i class="ph-bold ph-caret-down chevron" id="ds-perf-expand-icon"></i>',
                viewerClose,
                '</div>',
                '<div class="group-content ds-perf-body" id="ds-perf-body">',
                '    <div class="grid grid-cols-3 gap-2" style="margin-bottom:0.75rem;">',
                '        <button type="button" class="btn-tool primary flex-1" id="ds-perf-drawer-bench-btn" data-ds-action="drawer-bench" title="Run automated performance benchmark">',
                '            <i class="ph-bold ph-play"></i> Bench',
                '        </button>',
                '        <button type="button" class="btn-tool flex-1" id="ds-perf-drawer-reset-btn" data-ds-action="drawer-reset" title="Reset recorded session extremes">',
                '            <i class="ph-bold ph-arrows-counter-clockwise"></i> Reset',
                '        </button>',
                '        <button type="button" class="btn-tool flex-1" id="ds-perf-drawer-export-btn" data-ds-action="drawer-export" title="Export diagnostic performance report">',
                '            <i class="ph-bold ph-download-simple"></i> Export',
                '        </button>',
                '    </div>',
                '    <div class="ds-perf-tabs">',
                '        <button type="button" class="ds-perf-tab-btn active" data-tab="extremes"><i class="ph-bold ph-chart-line-up"></i> Live & Extremes</button>',
                '        <button type="button" class="ds-perf-tab-btn" data-tab="breakdown"><i class="ph-bold ph-table"></i> Breakdown</button>',
                '        <button type="button" class="ds-perf-tab-btn" data-tab="benchmark"><i class="ph-bold ph-lightning"></i> Benchmark</button>',
                '        <button type="button" class="ds-perf-tab-btn" data-tab="report"><i class="ph-bold ph-file-text"></i> Report</button>',
                '    </div>',
                '    <div class="ds-perf-content" id="ds-perf-tab-content"></div>',
                '</div>'
            ].join('\n');

            if (isViewer) {
                document.body.appendChild(panel);
            } else {
                var viewerLink = document.getElementById('dashboard-viewer-url-link');
                var viewerSection = viewerLink ? viewerLink.closest('.toolbar-section') : null;
                var targetDivider = viewerSection && viewerSection.previousElementSibling && viewerSection.previousElementSibling.classList.contains('toolbar-divider')
                    ? viewerSection.previousElementSibling
                    : viewerSection;

                if (targetDivider) {
                    tools.insertBefore(panel, targetDivider);
                } else if (tools.firstElementChild && tools.firstElementChild.nextSibling) {
                    tools.insertBefore(panel, tools.firstElementChild.nextSibling);
                } else {
                    tools.appendChild(panel);
                }
            }

            // 2. Create floating pill for view mode and viewer
            var pill = document.createElement('div');
            pill.id = 'ds-perf-floating-pill';
            pill.title = isViewer
                ? 'Dashboard Studio Performance active. Click to toggle Performance Overlay.'
                : 'Dashboard Studio Performance active. Click to open Performance slideout.';
            pill.innerHTML = '<i class="ph-bold ph-gauge" style="color:#38bdf8;"></i> <span id="ds-perf-pill-fps">60 FPS</span> • <span id="ds-perf-pill-status">Optimal</span>';
            pill.onclick = function () {
                if (isViewer) {
                    self.toggleExpanded();
                } else {
                    var d = self.getDashboard();
                    if (d && typeof d.toggleEditMode === 'function') {
                        if (!document.body.classList.contains('edit-mode')) {
                            d.toggleEditMode();
                        }
                    }
                    self.setExpanded(true);
                    panel.scrollIntoView({ behavior: 'smooth' });
                }
            };
            document.body.appendChild(pill);

            // Escape key listener for viewer overlay
            if (isViewer) {
                window.addEventListener('keydown', function (e) {
                    if (e.key === 'Escape' && self.isExpanded) {
                        self.setExpanded(false);
                    }
                });
            }

            // 3. Attach capturing delegation listener to guarantee clicks fire under any extension/mode
            panel.addEventListener('click', function (e) {
                var actionBtn = e.target.closest('[data-ds-action]');
                if (actionBtn) {
                    var action = actionBtn.getAttribute('data-ds-action');
                    if (action === 'quick-bench' || action === 'drawer-bench' || action === 'run-bench') {
                        e.stopPropagation();
                        e.preventDefault();
                        self.setExpanded(true);
                        self.switchTab('benchmark');
                        self.runAutomatedBenchmark();
                        return;
                    }
                    if (action === 'close-viewer-overlay') {
                        e.stopPropagation();
                        e.preventDefault();
                        self.setExpanded(false);
                        return;
                    }
                    if (action === 'drawer-reset') {
                        e.stopPropagation();
                        e.preventDefault();
                        self.resetExtremes();
                        return;
                    }
                    if (action === 'drawer-export') {
                        e.stopPropagation();
                        e.preventDefault();
                        self.switchTab('report');
                        return;
                    }
                }

                var tabBtn = e.target.closest('.ds-perf-tab-btn');
                if (tabBtn) {
                    var tab = tabBtn.getAttribute('data-tab');
                    if (tab) {
                        e.stopPropagation();
                        e.preventDefault();
                        self.switchTab(tab);
                        return;
                    }
                }

                var headerToggle = e.target.closest('#ds-perf-header-toggle');
                if (headerToggle && !e.target.closest('button') && !e.target.closest('[data-ds-action="close-viewer-overlay"]')) {
                    self.toggleExpanded();
                }
            }, true);

            this.updateUI();
        },

        /**
         * Toggle drawer expanded/collapsed state
         */
        toggleExpanded: function () {
            this.setExpanded(!this.isExpanded);
        },

        setExpanded: function (expanded) {
            this.isExpanded = !!expanded;
            var panel = document.getElementById('ds-perf-panel');
            if (panel) {
                if (this.isExpanded) {
                    panel.classList.remove('collapsed');
                    panel.classList.remove('is-collapsed');
                    panel.classList.add('is-expanded');
                } else {
                    panel.classList.add('collapsed');
                    panel.classList.add('is-collapsed');
                    panel.classList.remove('is-expanded');
                }
            }
            this.updateUI();
        },

        /**
         * Switch active tab
         */
        switchTab: function (tabName) {
            this.activeTab = tabName;
            var panel = document.getElementById('ds-perf-panel');
            if (!panel) return;
            var btns = panel.querySelectorAll('.ds-perf-tab-btn');
            for (var i = 0; i < btns.length; i++) {
                if (btns[i].getAttribute('data-tab') === tabName) {
                    btns[i].classList.add('active');
                } else {
                    btns[i].classList.remove('active');
                }
            }
            this.updateTabContent();
        },

        /**
         * Update top headers, floating badge, and active tab content
         */
        updateUI: function () {
            var fpsBadge = document.getElementById('ds-perf-fps-badge');
            var actionBadge = document.getElementById('ds-perf-last-action-badge');
            var dot = document.getElementById('ds-perf-header-dot');
            var pillFps = document.getElementById('ds-perf-pill-fps');
            var pillStatus = document.getElementById('ds-perf-pill-status');
            var health = this.getHealthStatus();

            if (fpsBadge) {
                fpsBadge.textContent = '(' + this.currentFps + ' FPS)';
            }

            if (dot) {
                dot.style.background = health.color;
                dot.style.boxShadow = '0 0 6px ' + health.color;
            }

            if (actionBadge) {
                if (this.lastActionName !== 'None' && this.lastActionName !== 'Ready') {
                    actionBadge.textContent = this.lastActionMs + 'ms';
                } else {
                    actionBadge.textContent = health.text;
                }
            }

            if (pillFps) pillFps.textContent = this.currentFps + ' FPS';
            if (pillStatus) {
                pillStatus.textContent = health.text;
                pillStatus.style.color = health.color;
            }

            if (this.isExpanded && this.activeTab === 'extremes') {
                this.updateTabContent();
            }
        },

        /**
         * Render content of the active tab
         */
        updateTabContent: function () {
            var container = document.getElementById('ds-perf-tab-content');
            if (!container) return;

            switch (this.activeTab) {
                case 'extremes':
                    container.innerHTML = this.renderExtremesTab();
                    break;
                case 'breakdown':
                    container.innerHTML = this.renderBreakdownTab();
                    break;
                case 'benchmark':
                    container.innerHTML = this.renderBenchmarkTab();
                    this.attachBenchmarkListeners();
                    break;
                case 'report':
                    container.innerHTML = this.renderReportTab();
                    this.attachReportListeners();
                    break;
            }
        },

        /**
         * Tab 1: Live & Extremes Overview
         */
        renderExtremesTab: function () {
            var fps = this.metrics.fps;
            var ft = this.metrics.frameTime;
            var domNodes = document.getElementsByTagName('*').length;
            var d = this.getDashboard() || {};
            var widgetCount = d.widgets ? Object.keys(d.widgets).length : 0;
            var layoutMode = (d.globalBindings && d.globalBindings.layoutMode) || 'fixed';
            var heapMb = (window.performance && window.performance.memory && window.performance.memory.usedJSHeapSize) ?
                Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)) : 'N/A';

            var isViewer = this.isViewerMode();
            var loadM = this.metrics.dashboardLoad || { count: 0, last: 0, min: 999999, max: 0 };
            var openM = this.metrics.editorOpen;
            var closeM = this.metrics.editorClose;
            var selM = this.metrics.widgetSelection;
            var reflowM = this.metrics.responsiveReflow;
            var flushM = this.metrics.dirtyFlush;
            var pageM = this.metrics.pageSwitch;

            var extraCardsHtml = '';
            if (isViewer) {
                extraCardsHtml = [
                    '    <div class="ds-perf-card">',
                    '        <div class="ds-perf-card-title">Dashboard Load</div>',
                    '        <div class="ds-perf-card-value">' + (loadM.count > 0 ? loadM.last + '<span style="font-size:11px;">ms</span>' : '--') + '</div>',
                    '        <div class="ds-perf-card-sub">Min: ' + (loadM.min < 99999 ? loadM.min + 'ms' : '--') + ' | Max: ' + (loadM.max > 0 ? loadM.max + 'ms' : '--') + '</div>',
                    '    </div>',
                    '    <div class="ds-perf-card">',
                    '        <div class="ds-perf-card-title">Reflow Pass</div>',
                    '        <div class="ds-perf-card-value">' + (reflowM.count > 0 ? reflowM.last + 'ms' : '--') + '</div>',
                    '        <div class="ds-perf-card-sub">Min: ' + (reflowM.min < 99999 ? reflowM.min + 'ms' : '--') + ' | Max: ' + (reflowM.max > 0 ? reflowM.max + 'ms' : '--') + '</div>',
                    '    </div>',
                    '    <div class="ds-perf-card">',
                    '        <div class="ds-perf-card-title">Dirty Flush</div>',
                    '        <div class="ds-perf-card-value">' + (flushM.count > 0 ? flushM.last + 'ms' : (pageM.count > 0 ? pageM.last + 'ms' : '--')) + '</div>',
                    '        <div class="ds-perf-card-sub">Flush: ' + flushM.count + ' | Switch: ' + pageM.count + '</div>',
                    '    </div>',
                    '    <div class="ds-perf-card">',
                    '        <div class="ds-perf-card-title">Active Page</div>',
                    '        <div class="ds-perf-card-value">Page ' + (d.currentPage || 1) + '</div>',
                    '        <div class="ds-perf-card-sub">' + widgetCount + ' widgets registered</div>',
                    '    </div>',
                    '    <div class="ds-perf-card">',
                    '        <div class="ds-perf-card-title">Layout Mode</div>',
                    '        <div class="ds-perf-card-value" style="font-size:13px; text-transform:capitalize;">' + layoutMode + '</div>',
                    '        <div class="ds-perf-card-sub">Responsive engine</div>',
                    '    </div>',
                    '    <div class="ds-perf-card">',
                    '        <div class="ds-perf-card-title">Widgets Total</div>',
                    '        <div class="ds-perf-card-value">' + widgetCount + '</div>',
                    '        <div class="ds-perf-card-sub">' + domNodes + ' DOM elements</div>',
                    '    </div>'
                ].join('\n');
            } else {
                extraCardsHtml = [
                    '    <div class="ds-perf-card">',
                    '        <div class="ds-perf-card-title">Dashboard Load</div>',
                    '        <div class="ds-perf-card-value">' + (loadM.count > 0 ? loadM.last + '<span style="font-size:11px;">ms</span>' : '--') + '</div>',
                    '        <div class="ds-perf-card-sub">Min: ' + (loadM.min < 99999 ? loadM.min + 'ms' : '--') + ' | Max: ' + (loadM.max > 0 ? loadM.max + 'ms' : '--') + '</div>',
                    '    </div>',
                    '    <div class="ds-perf-card">',
                    '        <div class="ds-perf-card-title">Editor Open</div>',
                    '        <div class="ds-perf-card-value">' + (openM.count > 0 ? openM.last + 'ms' : '--') + '</div>',
                    '        <div class="ds-perf-card-sub">Min: ' + (openM.min < 99999 ? openM.min + 'ms' : '--') + ' | Max: ' + (openM.max > 0 ? openM.max + 'ms' : '--') + '</div>',
                    '    </div>',
                    '    <div class="ds-perf-card">',
                    '        <div class="ds-perf-card-title">Editor Close</div>',
                    '        <div class="ds-perf-card-value">' + (closeM.count > 0 ? closeM.last + 'ms' : '--') + '</div>',
                    '        <div class="ds-perf-card-sub">Min: ' + (closeM.min < 99999 ? closeM.min + 'ms' : '--') + ' | Max: ' + (closeM.max > 0 ? closeM.max + 'ms' : '--') + '</div>',
                    '    </div>',
                    '    <div class="ds-perf-card">',
                    '        <div class="ds-perf-card-title">Selection</div>',
                    '        <div class="ds-perf-card-value">' + (selM.count > 0 ? selM.last + 'ms' : '--') + '</div>',
                    '        <div class="ds-perf-card-sub">Min: ' + (selM.min < 99999 ? selM.min + 'ms' : '--') + ' | Max: ' + (selM.max > 0 ? selM.max + 'ms' : '--') + '</div>',
                    '    </div>',
                    '    <div class="ds-perf-card">',
                    '        <div class="ds-perf-card-title">Reflow Pass</div>',
                    '        <div class="ds-perf-card-value">' + (reflowM.count > 0 ? reflowM.last + 'ms' : '--') + '</div>',
                    '        <div class="ds-perf-card-sub">Min: ' + (reflowM.min < 99999 ? reflowM.min + 'ms' : '--') + ' | Max: ' + (reflowM.max > 0 ? reflowM.max + 'ms' : '--') + '</div>',
                    '    </div>',
                    '    <div class="ds-perf-card">',
                    '        <div class="ds-perf-card-title">Active Page</div>',
                    '        <div class="ds-perf-card-value">Page ' + (d.currentPage || 1) + '</div>',
                    '        <div class="ds-perf-card-sub">' + widgetCount + ' widgets registered</div>',
                    '    </div>'
                ].join('\n');
            }

            return [
                '<div class="ds-perf-grid-cards">',
                '    <div class="ds-perf-card">',
                '        <div class="ds-perf-card-title">Live FPS</div>',
                '        <div class="ds-perf-card-value">' + this.currentFps + '</div>',
                '        <div class="ds-perf-card-sub">Min: ' + (fps.min < 999 ? fps.min : '--') + ' | Max: ' + fps.max + '</div>',
                '    </div>',
                '    <div class="ds-perf-card">',
                '        <div class="ds-perf-card-title">Frame Time</div>',
                '        <div class="ds-perf-card-value">' + this.frameTimeMs + ' <span style="font-size:11px;">ms</span></div>',
                '        <div class="ds-perf-card-sub">Target: 16.6ms</div>',
                '    </div>',
                '    <div class="ds-perf-card">',
                '        <div class="ds-perf-card-title">JS Heap Memory</div>',
                '        <div class="ds-perf-card-value">' + heapMb + ' <span style="font-size:11px;">MB</span></div>',
                '        <div class="ds-perf-card-sub">DOM: ' + domNodes + ' nodes</div>',
                '    </div>',
                extraCardsHtml,
                '</div>',
                '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; font-size:11px; color:var(--text-muted, #94a3b8);">',
                '    <span>Layout: <strong>' + layoutMode + '</strong> (' + widgetCount + ' widgets)</span>',
                '    <button type="button" class="btn-tool" style="height:26px; min-height:26px; padding:0 8px; font-size:10px;" onclick="window.__DS_PERF_TESTER__.toggleRealtimeMonitoring()"><i class="ph-bold ' + (this.isRealtimeActive ? 'ph-pause' : 'ph-play') + '"></i> ' + (this.isRealtimeActive ? 'Pause' : 'Resume') + '</button>',
                '</div>'
            ].join('\n');
        },

        /**
         * Tab 2: Detailed Action Breakdown Table
         */
        renderBreakdownTab: function () {
            var rows = [
                { key: 'dashboardLoad', label: 'Dashboard Load (loadDashboardData)' },
                { key: 'pageSwitch', label: 'Page Change (updateGlobal currentPage)' },
                { key: 'dirtyFlush', label: 'Dirty Widget Flush (_flushDirtyWidgets)' },
                { key: 'dashboardRender', label: 'Full Dashboard Render (render)' },
                { key: 'responsiveReflow', label: 'Responsive Reflow (_runResponsiveReflowPass)' },
                { key: 'responsiveRemeasure', label: 'Responsive Remeasure (_runResponsiveRemeasurePass)' },
                { key: 'editorOpen', label: 'Editor Open (Total Toggle)' },
                { key: 'editorClose', label: 'Editor Close (Total Toggle)' },
                { key: 'editModeVisuals', label: '↳ Visual Sync (_syncEditModeVisuals)' },
                { key: 'editLabelsSync', label: '↳ Label Sync (_syncEditLabelDisplay)' },
                { key: 'widgetSelection', label: 'Widget Selection (selectWidget)' },
                { key: 'selectionVisual', label: '↳ Selection Visuals (_applySelectionVisualState)' },
                { key: 'dropdownSync', label: 'Dropdown Sync (syncDropdownSelection)' },
                { key: 'dropdownRebuild', label: 'Dropdown Rebuild (refreshDropdown)' },
                { key: 'inspectorLoad', label: 'Inspector DOM Render (loadWidget)' },
                { key: 'reactiveRefresh', label: 'Reactive Refresh (_refreshReactiveInspector)' },
                { key: 'updateGlobal', label: 'Global Settings Commit (updateGlobal)' },
                { key: 'resumeWake', label: 'Resume Wake (emulated hide/show)' }
            ];

            var trHtml = '';
            for (var i = 0; i < rows.length; i++) {
                var r = rows[i];
                var m = this.metrics[r.key];
                var count = m ? m.count : 0;
                var last = m && count > 0 ? m.last + 'ms' : '--';
                var min = m && count > 0 ? (m.min < 99999 ? m.min + 'ms' : '--') : '--';
                var max = m && count > 0 ? m.max + 'ms' : '--';
                var avg = m && count > 0 ? m.avg + 'ms' : '--';

                var pillClass = '';
                if (m && count > 0) {
                    if (m.last < 100) pillClass = 'ds-perf-pill-fast';
                    else if (m.last > 500) pillClass = 'ds-perf-pill-slow';
                }

                trHtml += [
                    '<tr>',
                    '    <td style="font-weight:500;">' + r.label + '</td>',
                    '    <td class="ds-perf-num ' + pillClass + '">' + last + '</td>',
                    '    <td class="ds-perf-num" style="color:#10b981;">' + min + '</td>',
                    '    <td class="ds-perf-num" style="color:#f87171;">' + max + '</td>',
                    '    <td class="ds-perf-num">' + avg + '</td>',
                    '    <td class="ds-perf-num" style="color:var(--text-muted);">' + count + '</td>',
                    '</tr>'
                ].join('');
            }

            return [
                '<div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted); margin-bottom:6px;">Session Extremes & Latency Breakdown</div>',
                '<div style="overflow-x:auto;">',
                '    <table class="ds-perf-table">',
                '        <thead>',
                '            <tr>',
                '                <th>Operation</th>',
                '                <th>Last</th>',
                '                <th>Min</th>',
                '                <th>Max</th>',
                '                <th>Avg</th>',
                '                <th>Runs</th>',
                '            </tr>',
                '        </thead>',
                '        <tbody>' + trHtml + '</tbody>',
                '    </table>',
                '</div>'
            ].join('\n');
        },

        /**
         * Tab 3: Benchmark Suite View
         */
        renderBenchmarkTab: function () {
            var b = this.benchmarkState;
            var isRunning = b.isRunning;
            var score = b.score !== null ? b.score : '--';
            var grade = b.grade !== null ? b.grade : '--';
            var res = b.results;

            var gradeColor = '#38bdf8';
            if (b.score !== null) {
                if (b.score >= 90) gradeColor = '#10b981';
                else if (b.score >= 80) gradeColor = '#38bdf8';
                else if (b.score >= 65) gradeColor = '#f59e0b';
                else if (b.score >= 50) gradeColor = '#fb923c';
                else gradeColor = '#ef4444';
            }

            var summaryHtml = res ? this._renderBenchmarkSubjects(res) : '';

            var benchDesc = 'Loads the original dashboard file with the editor closed, waits until caches settle, then measures each area on its own. Budgets grow with the number of widgets. A missing feature is left blank and is not scored.';

            return [
                '<div class="ds-perf-bench-box">',
                '    <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted,#94a3b8);">AUTOMATED BENCHMARK SUITE</div>',
                '    <div class="ds-perf-bench-grade" style="color:' + gradeColor + ';">' + grade + ' <span style="font-size:18px; font-weight:600; opacity:0.85;">(' + score + '/100)</span></div>',
                '    <div style="font-size:11px; color:var(--text-muted,#94a3b8); margin-bottom:12px;">' + benchDesc + '</div>',
                '    <button type="button" class="btn-tool primary w-full justify-center" id="ds-perf-run-bench-btn" data-ds-action="run-bench" ' + (isRunning ? 'disabled' : '') + '>',
                '        <i class="ph-bold ' + (isRunning ? 'ph-spinner ph-spin' : 'ph-play') + '"></i> ' + (isRunning ? 'Running Benchmark...' : 'Run Automated Benchmark'),
                '    </button>',
                '</div>',
                summaryHtml,
                '<div class="ds-perf-log-box" id="ds-perf-bench-log">' + (b.log || 'Ready to run benchmark. Click the button above to begin.') + '</div>'
            ].join('\n');
        },

        attachBenchmarkListeners: function () {
            var self = this;
            var btn = document.getElementById('ds-perf-run-bench-btn');
            if (btn) {
                btn.onclick = function () {
                    self.runAutomatedBenchmark();
                };
            }
        },

        _roundMs: function (n) {
            return Math.round(n * 100) / 100;
        },

        _averageMs: function (nums) {
            if (!nums || !nums.length) return null;
            var sum = 0;
            var i;
            for (i = 0; i < nums.length; i++) sum += nums[i];
            return Math.round((sum / nums.length) * 100) / 100;
        },

        _widgetCount: function (d) {
            if (!d || !d.widgets) return 0;
            return Object.keys(d.widgets).length;
        },

        _widgetTypeName: function (w) {
            if (!w || typeof WidgetRegistry === 'undefined' || !WidgetRegistry.widgets) return 'unknown';
            var keys = Object.keys(WidgetRegistry.widgets);
            var i;
            for (i = 0; i < keys.length; i++) {
                if (w instanceof WidgetRegistry.widgets[keys[i]]) return keys[i];
            }
            return 'unknown';
        },

        _widgetCoversPageNumber: function (w, page) {
            if (!w) return false;
            var raw = (w.overrides && w.overrides.page != null) ? w.overrides.page : '1';
            if (typeof WidgetPageSpec !== 'undefined' && typeof WidgetPageSpec.coversPage === 'function') {
                return !!WidgetPageSpec.coversPage(raw, page);
            }
            var parts = String(raw).split(',');
            var target = String(page);
            var i;
            for (i = 0; i < parts.length; i++) {
                if (String(parseInt(parts[i], 10)) === target) return true;
            }
            return false;
        },

        _collectPages: function (d) {
            var map = {};
            var widgets = (d && d.widgets) || {};
            var ids = Object.keys(widgets);
            var i;
            var j;
            for (i = 0; i < ids.length; i++) {
                var w = widgets[ids[i]];
                var raw = (w && w.overrides && w.overrides.page != null) ? w.overrides.page : '1';
                var nums = String(raw).match(/\d+/g) || [];
                if (!nums.length) nums = ['1'];
                for (j = 0; j < nums.length; j++) {
                    var n = parseInt(nums[j], 10);
                    if (n > 0 && n < 90) map[n] = true;
                }
            }
            var list = [];
            for (var k in map) {
                if (Object.prototype.hasOwnProperty.call(map, k)) list.push(parseInt(k, 10));
            }
            list.sort(function (a, b) { return a - b; });
            if (!list.length) list.push(1);
            return list;
        },

        _idsOnPage: function (d, page) {
            var out = [];
            var widgets = (d && d.widgets) || {};
            var ids = Object.keys(widgets);
            var i;
            for (i = 0; i < ids.length; i++) {
                if (this._widgetCoversPageNumber(widgets[ids[i]], page)) out.push(ids[i]);
            }
            return out;
        },

        _activePage: function (d) {
            var raw = 1;
            if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && MASTER_SETTINGS.currentPage != null) {
                raw = MASTER_SETTINGS.currentPage;
            } else if (d && d.currentPage != null) {
                raw = d.currentPage;
            }
            var n = parseInt(raw, 10);
            return (isNaN(n) || n < 1) ? 1 : n;
        },

        _goToPage: function (d, page) {
            if (!d || typeof d.updateGlobal !== 'function') return false;
            d.updateGlobal({ currentPage: page });
            return true;
        },

        _layoutMode: function () {
            if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && MASTER_SETTINGS.layoutMode) {
                return String(MASTER_SETTINGS.layoutMode);
            }
            return 'fixed';
        },

        _warmupSettled: function (d) {
            if (!d || typeof d._offPageWarmQueue === 'undefined') return true;
            if (d._offPageWarmTimer) return false;
            var q = d._offPageWarmQueue || [];
            var idx = d._offPageWarmIndex || 0;
            if (!q.length) return true;
            return idx >= q.length;
        },

        _metricCount: function (key) {
            var m = this.metrics[key];
            return m ? m.count : 0;
        },

        _metricAddedAverage: function (key, countBefore) {
            var m = this.metrics[key];
            if (!m || m.count <= countBefore) return null;
            var added = m.count - countBefore;
            if (added > m.history.length) return null;
            return this._averageMs(m.history.slice(m.history.length - added));
        },

        _componentScore: function (ms, budget) {
            if (ms === null || ms === undefined || isNaN(ms)) return null;
            if (budget === null || budget === undefined || !(budget > 0)) return null;
            if (ms <= budget) return 100;
            var ratio = ms / budget;
            if (ratio >= 4) return 0;
            return Math.max(0, Math.round(100 * (4 - ratio) / 3));
        },

        _gradeForScore: function (score) {
            if (score === null || score === undefined) return null;
            if (score >= 90) return 'A+';
            if (score >= 80) return 'A';
            if (score >= 65) return 'B';
            if (score >= 50) return 'C';
            return 'D';
        },

        _subjectDefs: function () {
            return [
                { id: 'fileLoad', label: 'File load', weight: 28, group: 'Load' },
                { id: 'pageFirst', label: 'Page first open', weight: 12, group: 'Pages' },
                { id: 'pageCached', label: 'Page change (cached)', weight: 14, group: 'Pages' },
                { id: 'selection', label: 'Widget selection', weight: 14, group: 'Selection' },
                { id: 'selectionVisual', label: 'Selection highlight', weight: 8, group: 'Selection' },
                { id: 'dropdownSync', label: 'Dropdown sync', weight: 8, group: 'Selection' },
                { id: 'dropdownRebuild', label: 'Dropdown rebuild', weight: 6, group: 'Selection' },
                { id: 'editorOpen', label: 'Editor open', weight: 8, group: 'Editor' },
                { id: 'editorClose', label: 'Editor close', weight: 6, group: 'Editor' },
                { id: 'dirtyFlush', label: 'Dirty flush', weight: 6, group: 'Render' },
                { id: 'editLabels', label: 'Edit labels', weight: 4, group: 'Editor' },
                { id: 'editVisuals', label: 'Edit-mode visuals', weight: 4, group: 'Editor' },
                { id: 'reactiveRefresh', label: 'Reactive inspector', weight: 4, group: 'Editor' },
                { id: 'loadFonts', label: 'Font collect', weight: 4, group: 'Load' },
                { id: 'groupBackdrop', label: 'Group dim overlay', weight: 4, group: 'Render' },
                { id: 'reflow', label: 'Responsive reflow', weight: 6, group: 'Render' },
                { id: 'resumeWake', label: 'Resume wake', weight: 36, group: 'Runtime' }
            ];
        },

        _budgetFor: function (id, ctx) {
            var n = ctx.widgets || 1;
            var onPage = ctx.onPageWidgets || 1;
            var pageN = ctx.pageWidgets || onPage;
            if (id === 'fileLoad') return Math.round(200 + 2.5 * n);
            if (id === 'pageFirst') return Math.round(40 + 2.5 * pageN);
            if (id === 'pageCached') return Math.round(25 + 0.35 * pageN);
            if (id === 'selection') return Math.round(50 + 0.12 * n);
            if (id === 'selectionVisual') return 8;
            if (id === 'dropdownSync') return 5;
            if (id === 'dropdownRebuild') return Math.round(40 + 0.35 * n);
            if (id === 'editorOpen') return Math.round(180 + 0.35 * n);
            if (id === 'editorClose') return Math.round(100 + 0.25 * n);
            if (id === 'dirtyFlush') return Math.round(16 + 0.4 * onPage);
            if (id === 'editLabels') return 3;
            if (id === 'editVisuals') return 8;
            if (id === 'reactiveRefresh') return 5;
            if (id === 'loadFonts') return Math.round(8 + 0.02 * n);
            if (id === 'groupBackdrop') return Math.round(12 + 0.04 * n);
            if (id === 'reflow') return Math.round(15 + 0.05 * n);
            if (id === 'resumeWake') return Math.round(80 + 0.04 * n);
            return null;
        },

        /**
         * Topics a restore must walk: values already in liveData, plus every static
         * widget and group subscription. A Homey snapshot replays the whole cache,
         * including topics no widget displays.
         */
        _collectResumeTopics: function (d) {
            var topics = [];
            var seen = Object.create(null);
            function add(t) {
                if (t == null || t === '') return;
                var s = String(t);
                if (!s || seen[s]) return;
                seen[s] = true;
                topics.push(s);
            }
            var live = d.liveData;
            if (live && typeof live === 'object') {
                var liveKeys = Object.keys(live);
                var li;
                for (li = 0; li < liveKeys.length; li++) add(liveKeys[li]);
            }
            var widgets = d.widgets || {};
            var ids = Object.keys(widgets);
            var wi;
            for (wi = 0; wi < ids.length; wi++) {
                var widget = widgets[ids[wi]];
                if (!widget || typeof widget.getStaticTopicInterests !== 'function') continue;
                var interests = widget.getStaticTopicInterests();
                if (interests && typeof interests.forEach === 'function') interests.forEach(add);
            }
            var groups = d.groups || {};
            var gids = Object.keys(groups);
            var gi;
            for (gi = 0; gi < gids.length; gi++) {
                var g = groups[gids[gi]];
                var b = g && g.bindings;
                if (!b || typeof b !== 'object') continue;
                if (typeof b.visible === 'string') add(b.visible);
                if (typeof b.overridePage === 'string') add(b.overridePage);
                if (typeof b.dimBackgroundWhenVisible === 'string') add(b.dimBackgroundWhenVisible);
            }
            var gb = d.globalBindings;
            if (gb && typeof gb === 'object') {
                var gk = Object.keys(gb);
                var gbi;
                for (gbi = 0; gbi < gk.length; gbi++) {
                    var raw = gb[gk[gbi]];
                    if (typeof raw === 'string') add(raw);
                    else if (raw && typeof raw.topic === 'string') add(raw.topic);
                }
            }
            return topics;
        },

        /**
         * Homey state_snapshot stores each event twice: the bare name and homey/event/<name>.
         * The bare name is usually in the topic index. The homey/event duplicate is not, so
         * every dynamic text widget still resolves config for it. local/ topics are not events.
         */
        _expandStateSnapshotTopics: function (topics) {
            var out = [];
            var seen = Object.create(null);
            var i;
            for (i = 0; i < topics.length; i++) {
                var t = topics[i];
                if (t == null || t === '') continue;
                t = String(t);
                if (!t || seen[t]) continue;
                seen[t] = true;
                out.push(t);
                if (t.indexOf('/') < 0) {
                    var doubled = 'homey/event/' + t;
                    if (!seen[doubled]) {
                        seen[doubled] = true;
                        out.push(doubled);
                    }
                }
            }
            return out;
        },

        /**
         * Emulate minimize/restore and time the synchronous topic replay until the
         * next frame. The page cannot hide the browser window. Pausing via
         * _setPageHidden matches the app's own background path. The replay matches
         * a Homey state_snapshot: same payloads, so widgets that already show those
         * values are not rewritten. resumeConnection is stubbed so the bench does
         * not ask Homey for a second snapshot.
         */
        _measureResumeWake: function (d, done) {
            var self = this;
            if (!d || typeof d._setPageHidden !== 'function' || typeof d.applyLocalTopicPayloadBatch !== 'function') {
                done(null, 0);
                return;
            }
            var topics = this._expandStateSnapshotTopics(this._collectResumeTopics(d));
            if (!d.liveData || typeof d.liveData !== 'object') d.liveData = Object.create(null);
            var seeded = [];
            var i;
            for (i = 0; i < topics.length; i++) {
                if (d.liveData[topics[i]] === undefined) {
                    d.liveData[topics[i]] = 0;
                    seeded.push(topics[i]);
                }
            }
            var map = new Map();
            for (i = 0; i < topics.length; i++) map.set(topics[i], d.liveData[topics[i]]);

            var driver = null;
            if (typeof DataDriverRegistry !== 'undefined' && typeof DataDriverRegistry.get === 'function') {
                driver = DataDriverRegistry.get();
            }
            var origResume = (driver && typeof driver.resumeConnection === 'function') ? driver.resumeConnection : null;
            if (driver && origResume) driver.resumeConnection = function () {};

            var finished = false;
            function cleanup() {
                if (driver && origResume) driver.resumeConnection = origResume;
                if (d._liveResyncVisibilityTimer) {
                    clearTimeout(d._liveResyncVisibilityTimer);
                    d._liveResyncVisibilityTimer = null;
                }
                var s;
                for (s = 0; s < seeded.length; s++) {
                    if (d.liveData && d.liveData[seeded[s]] === 0) delete d.liveData[seeded[s]];
                }
                if (d._pageHidden && typeof d._setPageHidden === 'function') {
                    try { d._setPageHidden(false); } catch (eShow) { /* leave the log to the caller */ }
                }
            }
            function finishMeasure(ms) {
                if (finished) return;
                finished = true;
                try { cleanup(); } catch (eClean) { console.warn('[PerfTester] Resume wake cleanup failed:', eClean); }
                done(ms, topics.length);
            }

            try {
                d._setPageHidden(true);
            } catch (eHide) {
                cleanup();
                done(null, topics.length);
                return;
            }

            var t0 = performance.now();
            try {
                d._setPageHidden(false);
                if (map.size > 0) d.applyLocalTopicPayloadBatch(map, driver);
            } catch (eWake) {
                finishMeasure(self._roundMs(performance.now() - t0));
                return;
            }
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(function () {
                    finishMeasure(self._roundMs(performance.now() - t0));
                });
            } else {
                finishMeasure(self._roundMs(performance.now() - t0));
            }
        },

        _finalizeSubjects: function (measured, ctx) {
            var defs = this._subjectDefs();
            var rows = [];
            var weightSum = 0;
            var acc = 0;
            var i;
            for (i = 0; i < defs.length; i++) {
                var def = defs[i];
                var ms = Object.prototype.hasOwnProperty.call(measured, def.id) ? measured[def.id] : null;
                if (ms !== null && ms !== undefined && !isNaN(ms)) ms = this._roundMs(ms);
                else ms = null;
                var budget = ms === null ? null : this._budgetFor(def.id, ctx);
                var score = this._componentScore(ms, budget);
                if (score !== null) {
                    weightSum += def.weight;
                    acc += score * def.weight;
                }
                rows.push({
                    id: def.id,
                    label: def.label,
                    group: def.group,
                    weight: def.weight,
                    ms: ms,
                    budget: budget,
                    score: score
                });
            }
            var overall = weightSum ? Math.round(acc / weightSum) : null;
            return { rows: rows, score: overall, grade: this._gradeForScore(overall), weightSum: weightSum };
        },

        _renderBenchmarkSubjects: function (res) {
            var rows = (res && res.subjects) || [];
            var html = ['<div style="margin-top:10px; font-size:11px; color:var(--text-muted,#94a3b8);">'];
            if (res && res.widgets) html.push(res.widgets + ' widgets. ');
            if (res && res.settleMs) {
                html.push('Settle ' + res.settleMs + 'ms' + (res.settleComplete ? '' : ' (warmup still running)') + '. ');
            }
            if (res && res.bootLoadMs != null) html.push('Boot load ' + res.bootLoadMs + 'ms (not scored).');
            html.push('</div>');
            html.push('<div style="margin-top:8px; display:flex; flex-direction:column; gap:4px;">');
            var group = '';
            var i;
            for (i = 0; i < rows.length; i++) {
                var row = rows[i];
                if (row.group !== group) {
                    group = row.group;
                    html.push('<div style="margin-top:6px; font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; color:var(--text-muted,#94a3b8);">' + this.escapeHtml(group) + '</div>');
                }
                var timeStr = (row.ms === null || row.ms === undefined) ? '--' : (row.ms + 'ms');
                var budStr = (row.budget === null || row.budget === undefined) ? '--' : (row.budget + 'ms');
                var scoreStr = (row.score === null || row.score === undefined) ? '--' : String(row.score);
                var color = '#94a3b8';
                if (row.score !== null && row.score !== undefined) {
                    if (row.score >= 90) color = '#10b981';
                    else if (row.score >= 65) color = '#38bdf8';
                    else if (row.score >= 50) color = '#f59e0b';
                    else color = '#ef4444';
                }
                html.push('<div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; padding:3px 0; border-bottom:1px solid rgba(148,163,184,0.15);">');
                html.push('<span>' + this.escapeHtml(row.label) + '</span>');
                html.push('<span style="white-space:nowrap;">' + timeStr + ' <span style="color:var(--text-muted,#94a3b8);">/ ' + budStr + '</span> <strong style="color:' + color + ';">' + scoreStr + '</strong></span>');
                html.push('</div>');
            }
            html.push('</div>');
            return html.join('');
        },

        /**
         * File load with the editor closed, then a settle, then one measurement per improvement area.
         * Missing APIs stay blank and are left out of the score. Budgets scale with widget count.
         */
        runAutomatedBenchmark: function () {
            var self = this;
            var d = this.getDashboard();

            if (this.benchmarkState.isRunning) {
                var now = performance.now();
                if (this._benchmarkStartTime && (now - this._benchmarkStartTime > 120000)) {
                    console.warn('[PerfTester] Previous benchmark timed out (>120s). Auto-resetting running state.');
                    this.benchmarkState.isRunning = false;
                } else {
                    console.warn('[PerfTester] Benchmark already in progress. Please wait.');
                    return;
                }
            }

            if (!d) {
                console.warn('[PerfTester] Cannot start benchmark: Dashboard runtime not found.');
                this.benchmarkState.log = '⚠️ Error: Dashboard runtime not ready. Please ensure Dashboard Studio is initialized.\n';
                var errBox = document.getElementById('ds-perf-bench-log');
                if (errBox) errBox.textContent = this.benchmarkState.log;
                return;
            }

            this.benchmarkState.isRunning = true;
            this._benchmarkStartTime = performance.now();
            this.benchmarkState.log = 'Starting benchmark. File load, then settle, then one subject at a time.\n';
            this.updateTabContent();

            function log(msg) {
                self.benchmarkState.log += msg + '\n';
                var box = document.getElementById('ds-perf-bench-log');
                if (box) {
                    box.textContent = self.benchmarkState.log;
                    box.scrollTop = box.scrollHeight;
                }
            }

            var measured = {};
            var ctx = {
                widgets: self._widgetCount(d) || 1,
                onPageWidgets: 1,
                pageWidgets: 1
            };
            var bootMs = (typeof d.initialDashboardLoadDurationMs === 'number') ? d.initialDashboardLoadDurationMs : null;
            var settleMs = 0;
            var settleComplete = true;
            var isViewer = this.isViewerMode();
            var initialEdit = document.body.classList.contains('edit-mode');
            var initialPage = this._activePage(d);
            var initialSelected = d.selectedWidget ? d.selectedWidget.id : null;
            var initialUnsaved = d.hasUnsavedChanges;
            var homePage = initialPage;
            var targetPage = null;
            var finished = false;

            if (this._watchdogTimer) clearTimeout(this._watchdogTimer);
            this._watchdogTimer = setTimeout(function () {
                if (!finished && self.benchmarkState.isRunning) {
                    console.warn('[PerfTester] Watchdog timeout: benchmark suite took >120s.');
                    log('\n⚠️ [Timeout] Benchmark timed out after 120s. Scoring what finished.');
                    finish(true);
                }
            }, 120000);

            function finish(isTimedOut) {
                if (finished) return;
                finished = true;
                if (self._watchdogTimer) {
                    clearTimeout(self._watchdogTimer);
                    self._watchdogTimer = null;
                }

                log('\nRestoring the page, editor, and selection...');
                try {
                    if (typeof d.updateGlobal === 'function' && self._activePage(d) !== initialPage) {
                        d.updateGlobal({ currentPage: initialPage });
                    }
                } catch (ePage) {
                    console.warn('[PerfTester] Page restore error:', ePage);
                }
                try {
                    var editNow = document.body.classList.contains('edit-mode');
                    if (initialEdit && !editNow && typeof d.toggleEditMode === 'function') d.toggleEditMode();
                    else if (!initialEdit && editNow && typeof d.toggleEditMode === 'function') d.toggleEditMode();
                } catch (eEdit) {
                    console.warn('[PerfTester] Edit mode restore error:', eEdit);
                }
                try {
                    if (initialSelected && typeof d.selectWidget === 'function') d.selectWidget(initialSelected);
                    else if (typeof d.selectWidget === 'function') d.selectWidget(null);
                } catch (eSel) {
                    console.warn('[PerfTester] Selection restore error:', eSel);
                }
                try {
                    if (typeof initialUnsaved === 'boolean') {
                        d.hasUnsavedChanges = initialUnsaved;
                        if (typeof d.updateFileIndicator === 'function') d.updateFileIndicator();
                    }
                } catch (eSave) {
                    console.warn('[PerfTester] Unsaved restore error:', eSave);
                }

                if (!ctx.widgets) ctx.widgets = self._widgetCount(d) || 1;
                var packed = self._finalizeSubjects(measured, ctx);
                self.benchmarkState.isRunning = false;
                self.benchmarkState.score = packed.score;
                self.benchmarkState.grade = packed.grade;
                self.benchmarkState.results = {
                    subjects: packed.rows,
                    widgets: ctx.widgets,
                    settleMs: settleMs,
                    settleComplete: settleComplete,
                    bootLoadMs: bootMs,
                    isViewer: isViewer,
                    dashboardLoad: measured.fileLoad != null ? measured.fileLoad : null,
                    avgOpen: measured.editorOpen != null ? measured.editorOpen : null,
                    avgClose: measured.editorClose != null ? measured.editorClose : null,
                    avgSelection: measured.selection != null ? measured.selection : null,
                    reflowTime: measured.reflow != null ? measured.reflow : null,
                    resumeWake: measured.resumeWake != null ? measured.resumeWake : null,
                    resumeTopics: ctx.resumeTopics != null ? ctx.resumeTopics : null
                };

                log('');
                if (bootMs != null) log('Boot load (not scored): ' + bootMs + 'ms');
                log('Widgets: ' + ctx.widgets + '. Settle: ' + settleMs + 'ms' + (settleComplete ? '' : ' (warmup still running)') + '.');
                var r;
                for (r = 0; r < packed.rows.length; r++) {
                    var row = packed.rows[r];
                    var timeStr = row.ms === null ? '--' : (row.ms + 'ms');
                    var budStr = row.budget === null ? '--' : (row.budget + 'ms');
                    var scoreStr = row.score === null ? '--' : String(row.score);
                    log(row.label + ': ' + timeStr + ' (budget ' + budStr + ', score ' + scoreStr + ')');
                }
                if (isTimedOut) {
                    log('\n⚠️ Benchmark finished with timeouts. Score: ' + (packed.score === null ? '--' : packed.score) + '/100 (Grade: ' + (packed.grade || '--') + ')');
                } else {
                    log('\n✅ Benchmark completed. Score: ' + (packed.score === null ? '--' : packed.score) + '/100 (Grade: ' + (packed.grade || '--') + ')');
                }
                self.updateUI();
                self.updateTabContent();
            }

            var queue = [];

            queue.push(function (done) {
                if (d.lastLoadedRawData) self._filePayload = d.lastLoadedRawData;
                if (!isViewer && document.body.classList.contains('edit-mode') && typeof d.toggleEditMode === 'function') {
                    log('Closing the editor so the file load matches a normal open.');
                    d.toggleEditMode();
                }
                done();
            });

            queue.push(function (done) {
                var fileName = d.activeFileName || 'the open dashboard';
                log('\n[1] File load (' + fileName + ', editor closed)');
                var payload = d.lastLoadedRawData || self._filePayload;
                if (!payload || typeof d.loadDashboardData !== 'function') {
                    log('  ↳ No original file payload. Skipped.');
                    done();
                    return;
                }
                var t0 = performance.now();
                var pending = d.loadDashboardData(payload);
                function afterLoad() {
                    measured.fileLoad = self._roundMs(performance.now() - t0);
                    ctx.widgets = self._widgetCount(d) || 1;
                    homePage = self._activePage(d);
                    log('  ↳ ' + measured.fileLoad + 'ms for ' + ctx.widgets + ' widgets');
                    done();
                }
                if (pending && typeof pending.then === 'function') {
                    pending.then(afterLoad).catch(function (eLoad) {
                        log('  ⚠️ Load error: ' + (eLoad && eLoad.message ? eLoad.message : String(eLoad)));
                        ctx.widgets = self._widgetCount(d) || 1;
                        done();
                    });
                } else {
                    afterLoad();
                }
            });

            queue.push(function (done) {
                var pages = self._collectPages(d);
                homePage = self._activePage(d);
                targetPage = null;
                var best = -1;
                var i;
                for (i = 0; i < pages.length; i++) {
                    if (pages[i] === homePage) continue;
                    var count = self._idsOnPage(d, pages[i]).length;
                    if (count > best) {
                        best = count;
                        targetPage = pages[i];
                    }
                }
                if (targetPage === null || typeof d.updateGlobal !== 'function') {
                    log('\n[2] Page first open: not measured (one page, or this build has no page change).');
                    done();
                    return;
                }
                ctx.pageWidgets = Math.max(1, self._idsOnPage(d, targetPage).length);
                log('\n[2] Page first open → page ' + targetPage + ' (' + ctx.pageWidgets + ' widgets, before cache)');
                var t0 = performance.now();
                self._goToPage(d, targetPage);
                measured.pageFirst = self._roundMs(performance.now() - t0);
                log('  ↳ ' + measured.pageFirst + 'ms');
                done();
            });

            queue.push(function (done) {
                var n = ctx.widgets || self._widgetCount(d) || 1;
                var minMs = 1500;
                var maxMs = Math.min(45000, 1500 + n * 55);
                var start = performance.now();
                log('\n[3] Settling so layout caches and off-page warmup can finish (up to ' + Math.round(maxMs) + 'ms)...');
                function tick() {
                    if (finished) return;
                    var elapsed = performance.now() - start;
                    var ready = self._warmupSettled(d);
                    if ((elapsed >= minMs && ready) || elapsed >= maxMs) {
                        settleMs = Math.round(elapsed);
                        settleComplete = !!ready;
                        log('  ↳ Settled in ' + settleMs + 'ms' + (settleComplete ? '.' : ' (warmup still running).'));
                        done();
                        return;
                    }
                    setTimeout(tick, 200);
                }
                setTimeout(tick, 200);
            });

            queue.push(function (done) {
                if (targetPage === null) {
                    log('\n[4] Page change (cached): not measured.');
                    done();
                    return;
                }
                log('\n[4] Page change after cache');
                var times = [];
                var t0 = performance.now();
                self._goToPage(d, homePage);
                times.push(performance.now() - t0);
                setTimeout(function () {
                    if (finished) return;
                    var t1 = performance.now();
                    self._goToPage(d, targetPage);
                    times.push(performance.now() - t1);
                    measured.pageCached = self._averageMs(times);
                    log('  ↳ back to page ' + homePage + ': ' + self._roundMs(times[0]) + 'ms');
                    log('  ↳ return to page ' + targetPage + ': ' + self._roundMs(times[1]) + 'ms');
                    log('  ↳ average ' + measured.pageCached + 'ms');
                    done();
                }, 250);
            });

            queue.push(function (done) {
                if (isViewer || typeof d.toggleEditMode !== 'function') {
                    log('\n[5] Editor open: not measured.');
                    done();
                    return;
                }
                if (document.body.classList.contains('edit-mode')) {
                    log('\n[5] Editor open: editor is already open, so this sample was skipped.');
                    done();
                    return;
                }
                log('\n[5] Editor open');
                var t0 = performance.now();
                d.toggleEditMode();
                measured.editorOpen = self._roundMs(performance.now() - t0);
                log('  ↳ ' + measured.editorOpen + 'ms');
                setTimeout(done, 400);
            });

            queue.push(function (done) {
                if (isViewer || typeof d.selectWidget !== 'function') {
                    log('\n[6] Widget selection: not measured.');
                    done();
                    return;
                }
                if (!document.body.classList.contains('edit-mode') && typeof d.toggleEditMode === 'function') {
                    d.toggleEditMode();
                }
                var page = self._activePage(d);
                var ids = self._idsOnPage(d, page).slice(0, 5);
                ctx.onPageWidgets = self._idsOnPage(d, page).length || 1;
                if (!ids.length) {
                    log('\n[6] Widget selection: no widgets on the current page.');
                    done();
                    return;
                }
                log('\n[6] Widget selection (' + ids.length + ' widgets on page ' + page + ')');
                var visBefore = self._metricCount('selectionVisual');
                var dropBefore = self._metricCount('dropdownSync');
                var times = [];
                var index = 0;
                function one() {
                    if (finished) return;
                    try {
                    if (index >= ids.length) {
                        measured.selection = self._averageMs(times);
                        measured.selectionVisual = self._metricAddedAverage('selectionVisual', visBefore);
                        measured.dropdownSync = self._metricAddedAverage('dropdownSync', dropBefore);
                        log('  ↳ selection average ' + measured.selection + 'ms');
                        log('  ↳ selection highlight ' + (measured.selectionVisual === null ? '--' : measured.selectionVisual + 'ms'));
                        log('  ↳ dropdown sync ' + (measured.dropdownSync === null ? '--' : measured.dropdownSync + 'ms'));
                        done();
                        return;
                    }
                    var id = ids[index];
                    index += 1;
                    var t0 = performance.now();
                    d.selectWidget(id);
                    var ms = self._roundMs(performance.now() - t0);
                    times.push(ms);
                    log('  ↳ ' + id + ': ' + ms + 'ms');
                    setTimeout(one, 60);
                    } catch (eSelStep) {
                        log('  ⚠️ Selection error: ' + (eSelStep && eSelStep.message ? eSelStep.message : String(eSelStep)));
                        done();
                    }
                }
                one();
            });

            queue.push(function (done) {
                if (isViewer) {
                    log('\n[7] Editor subjects: not measured in the viewer.');
                    done();
                    return;
                }
                log('\n[7] Editor subjects');
                var ed = self.getEditor();
                var bw = self.getBaseWidget();
                var proto = bw && bw.prototype;
                var page = self._activePage(d);
                var ids = self._idsOnPage(d, page).slice(0, 20);
                var i;

                if (proto && typeof proto._syncEditLabelDisplay === 'function' && ids.length) {
                    var labelTimes = [];
                    for (i = 0; i < ids.length; i++) {
                        var w = d.widgets[ids[i]];
                        if (!w || typeof w._syncEditLabelDisplay !== 'function') continue;
                        var tLabel = performance.now();
                        w._syncEditLabelDisplay();
                        labelTimes.push(performance.now() - tLabel);
                    }
                    measured.editLabels = self._averageMs(labelTimes);
                    log('  ↳ edit labels ' + (measured.editLabels === null ? '--' : measured.editLabels + 'ms'));
                } else {
                    log('  ↳ edit labels: not measured');
                }

                if (proto && typeof proto._syncEditModeVisuals === 'function' && ids.length) {
                    var visualTimes = [];
                    for (i = 0; i < ids.length; i++) {
                        var wVis = d.widgets[ids[i]];
                        if (!wVis || typeof wVis._syncEditModeVisuals !== 'function') continue;
                        var tVis = performance.now();
                        wVis._syncEditModeVisuals();
                        visualTimes.push(performance.now() - tVis);
                    }
                    measured.editVisuals = self._averageMs(visualTimes);
                    log('  ↳ edit-mode visuals ' + (measured.editVisuals === null ? '--' : measured.editVisuals + 'ms'));
                } else {
                    log('  ↳ edit-mode visuals: not measured');
                }

                if (ed && typeof ed._refreshReactiveInspector === 'function' && ed.currentId) {
                    var tReact = performance.now();
                    ed._refreshReactiveInspector('label');
                    measured.reactiveRefresh = self._roundMs(performance.now() - tReact);
                    log('  ↳ reactive inspector ' + measured.reactiveRefresh + 'ms');
                } else {
                    log('  ↳ reactive inspector: not measured');
                }

                if (document.body.classList.contains('edit-mode') && ed && typeof ed.refreshDropdown === 'function') {
                    var tDrop = performance.now();
                    ed.refreshDropdown(d.widgets);
                    measured.dropdownRebuild = self._roundMs(performance.now() - tDrop);
                    log('  ↳ dropdown rebuild ' + measured.dropdownRebuild + 'ms');
                } else {
                    log('  ↳ dropdown rebuild: not measured');
                }
                done();
            });

            queue.push(function (done) {
                if (isViewer || typeof d.toggleEditMode !== 'function' || !document.body.classList.contains('edit-mode')) {
                    log('\n[8] Editor close: not measured.');
                    done();
                    return;
                }
                log('\n[8] Editor close');
                var t0 = performance.now();
                d.toggleEditMode();
                measured.editorClose = self._roundMs(performance.now() - t0);
                log('  ↳ ' + measured.editorClose + 'ms');
                done();
            });

            queue.push(function (done) {
                log('\n[9] Render subjects');
                var page = self._activePage(d);
                var ids = self._idsOnPage(d, page);
                if (!ids.length) ids = Object.keys(d.widgets || {});
                ctx.onPageWidgets = ids.length || 1;

                if (typeof d._markWidgetDirty === 'function' && typeof d._flushDirtyWidgets === 'function' && ids.length) {
                    var sample = ids.slice(0, 40);
                    var i;
                    for (i = 0; i < sample.length; i++) d._markWidgetDirty(sample[i]);
                    var tFlush = performance.now();
                    d._flushDirtyWidgets(true);
                    measured.dirtyFlush = self._roundMs(performance.now() - tFlush);
                    ctx.onPageWidgets = sample.length;
                    log('  ↳ dirty flush ' + measured.dirtyFlush + 'ms (' + sample.length + ' widgets)');
                } else {
                    log('  ↳ dirty flush: not measured');
                }

                if (typeof d.loadFonts === 'function') {
                    var tFonts = performance.now();
                    d.loadFonts();
                    measured.loadFonts = self._roundMs(performance.now() - tFonts);
                    log('  ↳ font collect ' + measured.loadFonts + 'ms');
                } else {
                    log('  ↳ font collect: not measured');
                }

                if (typeof d._syncGroupBackdropOverlays === 'function') {
                    var tDim = performance.now();
                    d._syncGroupBackdropOverlays();
                    measured.groupBackdrop = self._roundMs(performance.now() - tDim);
                    log('  ↳ group dim overlay ' + measured.groupBackdrop + 'ms');
                } else {
                    log('  ↳ group dim overlay: not measured');
                }

                if (self._layoutMode() === 'responsive' && typeof d._runResponsiveReflowPass === 'function') {
                    var tReflow = performance.now();
                    d._runResponsiveReflowPass();
                    measured.reflow = self._roundMs(performance.now() - tReflow);
                    log('  ↳ responsive reflow ' + measured.reflow + 'ms');
                } else {
                    log('  ↳ responsive reflow: not measured (fixed or scale layout, or this build has no reflow pass)');
                }
                done();
            });

            queue.push(function (done) {
                log('\n[10] Resume wake (emulated hide/show)');
                log('  ↳ The page cannot minimize the browser. Background work is paused and restored. The restore snapshot (each bare event plus its homey/event name) is timed until the next frame.');
                self._measureResumeWake(d, function (ms, topicCount) {
                    if (finished) return;
                    ctx.resumeTopics = topicCount;
                    if (ms === null || ms === undefined) {
                        log('  ↳ not measured');
                        done();
                        return;
                    }
                    measured.resumeWake = ms;
                    self.recordMetric('resumeWake', ms, 'Resume Wake');
                    log('  ↳ ' + ms + 'ms for ' + topicCount + ' topics');
                    done();
                });
            });

            function next() {
                if (finished) return;
                var step = queue.shift();
                if (!step) {
                    finish(false);
                    return;
                }
                try {
                    step(function () {
                        setTimeout(next, 40);
                    });
                } catch (eStep) {
                    log('  ⚠️ Step error: ' + (eStep && eStep.message ? eStep.message : String(eStep)));
                    setTimeout(next, 40);
                }
            }

            setTimeout(next, 40);
        },

        /**
         * Tab 4: Performance & Diagnostic Report View
         */
        renderReportTab: function () {
            var reportMd = this.generateMarkdownReport();
            return [
                '<div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px; color:var(--text-muted,#94a3b8);">PERFORMANCE & DIAGNOSTIC REPORT</div>',
                '<div style="font-size:11px; color:var(--text-muted,#94a3b8); margin-bottom:10px;">',
                '    Export a comprehensive diagnostics and performance report.',
                '</div>',
                '<div class="grid grid-cols-3 gap-2" style="margin-bottom:10px;">',
                '    <button type="button" class="btn-tool primary flex-1" id="ds-perf-copy-md-btn"><i class="ph-bold ph-copy"></i> Copy</button>',
                '    <button type="button" class="btn-tool flex-1" id="ds-perf-download-md-btn"><i class="ph-bold ph-download-simple"></i> .md</button>',
                '    <button type="button" class="btn-tool flex-1" id="ds-perf-download-json-btn"><i class="ph-bold ph-brackets-curly"></i> .json</button>',
                '</div>',
                '<pre class="ds-perf-log-box" style="max-height:220px;" id="ds-perf-report-preview">' + this.escapeHtml(reportMd) + '</pre>'
            ].join('\n');
        },

        attachReportListeners: function () {
            var self = this;
            var copyBtn = document.getElementById('ds-perf-copy-md-btn');
            if (copyBtn) {
                copyBtn.onclick = function () {
                    var md = self.generateMarkdownReport();
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(md).then(function () {
                            copyBtn.innerHTML = '<i class="ph-bold ph-check"></i> Copied!';
                            setTimeout(function () {
                                copyBtn.innerHTML = '<i class="ph-bold ph-copy"></i> Copy';
                            }, 2000);
                        });
                    } else {
                        var ta = document.createElement('textarea');
                        ta.value = md;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                        copyBtn.innerHTML = '<i class="ph-bold ph-check"></i> Copied!';
                        setTimeout(function () {
                            copyBtn.innerHTML = '<i class="ph-bold ph-copy"></i> Copy';
                        }, 2000);
                    }
                };
            }

            var dlMdBtn = document.getElementById('ds-perf-download-md-btn');
            if (dlMdBtn) {
                dlMdBtn.onclick = function () {
                    var md = self.generateMarkdownReport();
                    self.downloadBlob(md, 'ds-perf-report-' + Date.now() + '.md', 'text/markdown');
                };
            }

            var dlJsonBtn = document.getElementById('ds-perf-download-json-btn');
            if (dlJsonBtn) {
                dlJsonBtn.onclick = function () {
                    var json = JSON.stringify(self.getReportData(), null, 2);
                    self.downloadBlob(json, 'ds-perf-data-' + Date.now() + '.json', 'application/json');
                };
            }
        },

        /**
         * Construct structured data payload for diagnostic report
         */
        getReportData: function () {
            var d = this.getDashboard() || {};
            var gb = d.globalBindings || {};
            var widgets = d.widgets || {};
            var widgetKeys = Object.keys(widgets);

            var typeCounts = {};
            for (var i = 0; i < widgetKeys.length; i++) {
                var w = widgets[widgetKeys[i]];
                var t = this._widgetTypeName(w);
                typeCounts[t] = (typeCounts[t] || 0) + 1;
            }

            return {
                timestamp: new Date().toISOString(),
                environment: {
                    userAgent: navigator.userAgent,
                    viewport: window.innerWidth + 'x' + window.innerHeight,
                    devicePixelRatio: window.devicePixelRatio || 1,
                    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
                    deviceMemoryGB: navigator.deviceMemory || 'unknown',
                    domNodesTotal: document.getElementsByTagName('*').length,
                    jsHeapMB: (window.performance && window.performance.memory && window.performance.memory.usedJSHeapSize) ?
                        Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)) : null
                },
                dashboard: {
                    name: (document.getElementById('dashboard-filename-text') && document.getElementById('dashboard-filename-text').textContent) || 'Untitled',
                    layoutMode: gb.layoutMode || 'fixed',
                    columns: gb.columns || 1,
                    pagePadding: gb.pagePadding || 0,
                    activePage: d.currentPage || 1,
                    totalWidgets: widgetKeys.length,
                    widgetTypesBreakdown: typeCounts
                },
                sessionMetrics: this.metrics,
                benchmark: this.benchmarkState
            };
        },

        /**
         * Generate a comprehensive Markdown performance report
         */
        generateMarkdownReport: function () {
            var data = this.getReportData();
            var env = data.environment;
            var dash = data.dashboard;
            var m = data.sessionMetrics;
            var bench = data.benchmark;

            var lines = [
                '# Dashboard Studio Performance & Diagnostic Report',
                '**Generated:** `' + data.timestamp + '`  ',
                '**Dashboard:** `' + dash.name + '` | **Layout:** `' + dash.layoutMode + '` | **Widgets:** `' + dash.totalWidgets + '`  ',
                '**Client:** `' + env.viewport + ' @' + env.devicePixelRatio + 'x` | **DOM Nodes:** `' + env.domNodesTotal + '`  ',
                '',
                '## 1. System Telemetry',
                '- **User Agent:** ' + env.userAgent,
                '- **Hardware Concurrency:** ' + env.hardwareConcurrency + ' cores',
                '- **Memory Heap:** ' + (env.jsHeapMB ? env.jsHeapMB + ' MB' : 'Not reported by browser'),
                '- **Live Frame Rate:** ' + this.currentFps + ' FPS (Frame time: ' + this.frameTimeMs + 'ms)',
                '',
                '## 2. Session Metrics & Extremes Table',
                '| Metric / Action | Runs | Last | Min (Fastest) | Max (Slowest) | Average |',
                '| :--- | :---: | :---: | :---: | :---: | :---: |'
            ];

            var keys = Object.keys(m);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var item = m[k];
                if (item.count === 0 && k !== 'fps' && k !== 'frameTime') continue;
                var minVal = item.min < 99999 ? item.min + 'ms' : '--';
                var maxVal = item.max > 0 ? item.max + 'ms' : '--';
                var lastVal = item.last + (k === 'fps' ? ' fps' : 'ms');
                var avgVal = item.avg + (k === 'fps' ? ' fps' : 'ms');
                lines.push('| `' + k + '` | ' + item.count + ' | ' + lastVal + ' | ' + minVal + ' | ' + maxVal + ' | ' + avgVal + ' |');
            }

            lines.push('');
            lines.push('## 3. Automated Benchmark Results');
            if (bench.score !== null && bench.results && bench.results.subjects) {
                lines.push('- **Overall Benchmark Score:** `' + bench.score + '/100`');
                lines.push('- **Performance Grade:** `' + bench.grade + '`');
                lines.push('- **Widgets used for budgets:** `' + (bench.results.widgets != null ? bench.results.widgets : dash.totalWidgets) + '`');
                if (bench.results.settleMs != null) {
                    lines.push('- **Settle time:** `' + bench.results.settleMs + 'ms' + (bench.results.settleComplete ? '' : ' (warmup still running)') + '`');
                }
                if (bench.results.bootLoadMs != null) {
                    lines.push('- **Boot load (not scored):** `' + bench.results.bootLoadMs + 'ms`');
                }
                if (bench.results.resumeTopics != null) {
                    lines.push('- **Resume wake topics:** `' + bench.results.resumeTopics + '`');
                }
                lines.push('');
                lines.push('Budgets grow with the dashboard. A blank row means this build does not have that feature, so it is not scored.');
                lines.push('');
                lines.push('| Subject | Time | Budget | Score |');
                lines.push('| :--- | ---: | ---: | ---: |');
                var subjects = bench.results.subjects;
                var si;
                for (si = 0; si < subjects.length; si++) {
                    var sub = subjects[si];
                    var timeCell = (sub.ms === null || sub.ms === undefined) ? '--' : (sub.ms + 'ms');
                    var budgetCell = (sub.budget === null || sub.budget === undefined) ? '--' : (sub.budget + 'ms');
                    var scoreCell = (sub.score === null || sub.score === undefined) ? '--' : String(sub.score);
                    lines.push('| ' + sub.label + ' | ' + timeCell + ' | ' + budgetCell + ' | ' + scoreCell + ' |');
                }
            } else if (bench.score !== null) {
                lines.push('- **Overall Benchmark Score:** `' + bench.score + '/100`');
                lines.push('- **Performance Grade:** `' + bench.grade + '`');
            } else {
                lines.push('*Automated benchmark has not been run yet in this session.*');
            }

            lines.push('');
            lines.push('## 4. Diagnostic Analysis & Findings');

            var findings = [];
            if (m.editorOpen.avg > 450) {
                findings.push('- ⚠️ **Editor Open Latency High (' + m.editorOpen.avg + 'ms avg):** Inspector construction or DOM reflow is taking noticeable time. Consider deferring hidden group DOM creation.');
            } else if (m.editorOpen.count > 0) {
                findings.push('- ✅ **Editor Open Latency Healthy (' + m.editorOpen.avg + 'ms avg):** Well within interactive threshold.');
            }

            if (m.widgetSelection.avg > 100) {
                findings.push('- ⚠️ **Widget Selection Latency High (' + m.widgetSelection.avg + 'ms avg):** Dropdown refresh or inspector binding is triggering redundant reflows.');
            } else if (m.widgetSelection.count > 0) {
                findings.push('- ✅ **Widget Selection Fast (' + m.widgetSelection.avg + 'ms avg):** UI updates instantaneously on click.');
            }

            if (m.resumeWake && m.resumeWake.count > 0 && m.resumeWake.avg > 400) {
                findings.push('- ⚠️ **Resume Wake Slow (' + m.resumeWake.avg + 'ms):** Restoring the dashboard replays every live topic on the main thread before the next frame.');
            } else if (m.resumeWake && m.resumeWake.count > 0) {
                findings.push('- ✅ **Resume Wake Fast (' + m.resumeWake.avg + 'ms):** Hide/show topic replay stays inside the resume budget.');
            }

            if (m.responsiveReflow.avg > 25) {
                findings.push('- ⚠️ **Responsive Reflow Duration Elevated (' + m.responsiveReflow.avg + 'ms avg):** Intrinsic height measuring is causing forced layout recalculation.');
            } else if (m.responsiveReflow.count > 0) {
                findings.push('- ✅ **Responsive Reflow Optimal (' + m.responsiveReflow.avg + 'ms avg):** Layout calculation completes smoothly.');
            }

            if (m.dirtyFlush && m.dirtyFlush.avg > 40) {
                findings.push('- ⚠️ **Dirty Flush Latency Elevated (' + m.dirtyFlush.avg + 'ms avg):** Off-page widgets may not be properly bypassed.');
            } else if (m.dirtyFlush && m.dirtyFlush.count > 0) {
                findings.push('- ✅ **Dirty Flush Fast (' + m.dirtyFlush.avg + 'ms avg):** Active page rendering is properly scoped.');
            }

            if (m.pageSwitch && m.pageSwitch.avg > 80) {
                findings.push('- ⚠️ **Page Transition Latency Elevated (' + m.pageSwitch.avg + 'ms avg):** Cross-page widget setup is taking extra time.');
            } else if (m.pageSwitch && m.pageSwitch.count > 0) {
                findings.push('- ✅ **Page Transition Smooth (' + m.pageSwitch.avg + 'ms avg):** Rapid switching between dashboard pages.');
            }

            if (bench.results && bench.results.subjects) {
                var benchRows = bench.results.subjects;
                var bi;
                for (bi = 0; bi < benchRows.length; bi++) {
                    var brow = benchRows[bi];
                    if (brow.score === null || brow.score === undefined || brow.score >= 70) continue;
                    findings.push('- ⚠️ **' + brow.label + ' (' + brow.ms + 'ms, budget ' + brow.budget + 'ms, score ' + brow.score + '):** Over the size-scaled budget for this dashboard.');
                }
            }

            var nodesPerWidget = dash.totalWidgets ? (env.domNodesTotal / dash.totalWidgets) : 0;
            if (dash.totalWidgets > 0 && nodesPerWidget > 140) {
                findings.push('- ⚠️ **High DOM Node Count (' + env.domNodesTotal + ' nodes, about ' + Math.round(nodesPerWidget) + ' per widget):** Hidden pages are keeping a lot of built content.');
            }

            if (findings.length === 0) {
                lines.push('- ✅ All monitored operations are within optimal performance budgets.');
            } else {
                for (var f = 0; f < findings.length; f++) {
                    lines.push(findings[f]);
                }
            }

            lines.push('');
            lines.push('## 5. Widget Distribution');
            var tKeys = Object.keys(dash.widgetTypesBreakdown || {});
            for (var tk = 0; tk < tKeys.length; tk++) {
                lines.push('- `' + tKeys[tk] + '`: ' + dash.widgetTypesBreakdown[tKeys[tk]]);
            }

            return lines.join('\n');
        },

        downloadBlob: function (content, filename, contentType) {
            var blob = new Blob([content], { type: contentType });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        escapeHtml: function (str) {
            return (str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }
    };

    window.__DS_PERF_TESTER__ = PerfTester;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            PerfTester.init();
        });
    } else {
        PerfTester.init();
    }
})();
