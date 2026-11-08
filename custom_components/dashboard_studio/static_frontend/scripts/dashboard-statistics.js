/**
 * Tools script: Dashboard Studio Statistics & Telemetry (lazy-loaded via tools-catalog).
 * Over-the-top mission control HUD, live bus telemetry with X/Y axes, widget distribution donut,
 * topic intelligence with interactive widget-to-page relationship mapping, system diagnostics,
 * sanitized debug export, and About / Support information.
 * Zero memory or runtime overhead when closed.
 */
(function () {
    const HOST_ID = 'dashboard-statistics';

    // Injected glass styling for the Statistics dialog
    const CSS_STYLES = `
    /* Statistics Dialog Core Glass & Tokens (Dark & Light Mode) */
    .ds-stats-dialog {
        --ds-text: var(--ui-text, var(--text-main, #f8fafc));
        --ds-text-dim: var(--ui-text-muted, var(--text-muted, #94a3b8));
        --ds-card-bg: var(--surface-bg, rgba(10, 16, 32, 0.55));
        --ds-card-border: var(--glass-border, rgba(255, 255, 255, 0.08));
        --ds-card-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.25);
        --ds-subtle-bg: rgba(255, 255, 255, 0.03);
        --ds-subtle-border: rgba(255, 255, 255, 0.07);
        --ds-input-bg: var(--input-bg, rgba(10, 16, 30, 0.78));
        --ds-input-border: var(--glass-border, rgba(255, 255, 255, 0.12));
        --ds-val-chip-bg: rgba(255, 255, 255, 0.05);
        --ds-val-chip-color: #38bdf8;
        --ds-val-chip-border: transparent;
        --ds-tab-active-bg: rgba(14, 165, 233, 0.18);
        --ds-tab-active-border: rgba(14, 165, 233, 0.4);
        --ds-tab-active-color: #38bdf8;
        --ds-accent-cyan: #38bdf8;
        --ds-accent-emerald: #34d399;
        --ds-accent-amber: #fbbf24;
        --ds-accent-rose: #fb7185;
        --ds-accent-violet: #c084fc;
        --ds-osc-bg: rgba(4, 9, 20, 0.65);
        --ds-osc-border: rgba(255, 255, 255, 0.08);
        --ds-drawer-bg: rgba(0, 0, 0, 0.25);
    }
    body.ui-light .ds-stats-dialog,
    :root.ui-light .ds-stats-dialog {
        --ds-text: #0f172a;
        --ds-text-dim: #64748b;
        --ds-card-bg: rgba(255, 255, 255, 0.76);
        --ds-card-border: rgba(148, 163, 184, 0.35);
        --ds-card-shadow: 0 4px 16px -4px rgba(31, 38, 135, 0.1);
        --ds-subtle-bg: rgba(241, 245, 249, 0.75);
        --ds-subtle-border: rgba(203, 213, 225, 0.75);
        --ds-input-bg: rgba(255, 255, 255, 0.9);
        --ds-input-border: rgba(148, 163, 184, 0.45);
        --ds-val-chip-bg: rgba(14, 165, 233, 0.12);
        --ds-val-chip-color: #0369a1;
        --ds-val-chip-border: rgba(14, 165, 233, 0.28);
        --ds-tab-active-bg: rgba(14, 165, 233, 0.15);
        --ds-tab-active-border: #0284c7;
        --ds-tab-active-color: #0284c7;
        --ds-accent-cyan: #0284c7;
        --ds-accent-emerald: #059669;
        --ds-accent-amber: #d97706;
        --ds-accent-rose: #e11d48;
        --ds-accent-violet: #7c3aed;
        --ds-osc-bg: rgba(248, 250, 252, 0.95);
        --ds-osc-border: rgba(148, 163, 184, 0.35);
        --ds-drawer-bg: rgba(241, 245, 249, 0.65);
    }

    .ds-stats-dialog.ds-dialog-host-panel {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: var(--radius-card, 1rem);
        background: var(--glass-panel-bg, rgba(15, 23, 42, 0.85));
        backdrop-filter: var(--glass-blur-dialog, blur(36px) saturate(1.5));
        -webkit-backdrop-filter: var(--glass-blur-dialog, blur(36px) saturate(1.5));
        box-shadow: 0 24px 64px -12px rgba(0, 0, 0, 0.56), 0 0 0 1px var(--glass-border, rgba(255, 255, 255, 0.12));
    }
    .ds-stats-dialog .ds-dialog-host-body {
        display: flex;
        flex-direction: column;
        padding: 0;
        overflow: hidden;
        flex: 1 1 auto;
        min-height: 0;
        color: var(--ds-text);
        font-family: inherit;
    }
    .ds-stats-root {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }
    /* Navigation Bar */
    .ds-stats-nav {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.65rem 1.15rem;
        background: var(--surface-bg, rgba(8, 14, 28, 0.5));
        border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
        overflow-x: auto;
        flex-shrink: 0;
    }
    .ds-stats-tab-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.45rem 0.85rem;
        border-radius: var(--radius-control, 0.5rem);
        border: 1px solid transparent;
        background: transparent;
        color: var(--ds-text-dim);
        font-size: 0.82rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.18s ease;
        white-space: nowrap;
    }
    .ds-stats-tab-btn:hover {
        background: var(--glass-bg-hover, rgba(255, 255, 255, 0.08));
        color: var(--ds-text);
    }
    .ds-stats-tab-btn.is-active {
        background: var(--ds-tab-active-bg);
        border-color: var(--ds-tab-active-border);
        color: var(--ds-tab-active-color);
        box-shadow: 0 0 16px -2px rgba(14, 165, 233, 0.28);
        font-weight: 600;
    }
    .ds-stats-tab-btn i {
        font-size: 1.05rem;
    }
    .ds-stats-nav-spacer {
        flex: 1 1 auto;
    }
    .ds-stats-nav-badge {
        font-size: 0.72rem;
        padding: 0.2rem 0.55rem;
        border-radius: 9999px;
        background: rgba(16, 185, 129, 0.16);
        border: 1px solid rgba(16, 185, 129, 0.35);
        color: var(--ds-accent-emerald);
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-weight: 600;
        letter-spacing: 0.02em;
    }
    .ds-stats-pulse-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 8px #10b981;
        animation: ds-stats-pulse 1.8s infinite;
    }
    @keyframes ds-stats-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.35); opacity: 0.5; }
    }
    /* Content Area */
    .ds-stats-viewport {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: 1.15rem;
        min-height: 0;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }
    .ds-stats-tab-pane {
        display: none;
        flex-direction: column;
        gap: 1.15rem;
    }
    .ds-stats-tab-pane.is-active {
        display: flex;
    }
    #ds-tab-changelog.is-active {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }
    #ds-tab-changelog .ds-stats-section {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }

    /* KPI Grid */
    .ds-stats-kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.85rem;
    }
    .ds-stats-card {
        background: var(--ds-card-bg);
        border: 1px solid var(--ds-card-border);
        border-radius: var(--radius-card, 0.85rem);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(12px);
        box-shadow: var(--ds-card-shadow);
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .ds-stats-card:hover {
        border-color: var(--glass-border-highlight, rgba(255, 255, 255, 0.18));
        transform: translateY(-1px);
    }
    .ds-stats-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--ds-text-dim);
        font-size: 0.76rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .ds-stats-card-icon {
        font-size: 1.15rem;
        opacity: 0.9;
    }
    .ds-stats-card-val {
        font-size: 1.85rem;
        font-weight: 800;
        color: var(--ds-text);
        line-height: 1.1;
        font-feature-settings: "tnum";
        font-variant-numeric: tabular-nums;
    }
    .ds-stats-card-sub {
        font-size: 0.74rem;
        color: var(--ds-text-dim);
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-wrap: wrap;
    }
    /* Highlight Glows */
    .ds-glow-cyan { color: var(--ds-accent-cyan); }
    .ds-glow-emerald { color: var(--ds-accent-emerald); }
    .ds-glow-amber { color: var(--ds-accent-amber); }
    .ds-glow-rose { color: var(--ds-accent-rose); }
    .ds-glow-violet { color: var(--ds-accent-violet); }

    /* Section Panels */
    .ds-stats-section {
        background: var(--ds-card-bg);
        border: 1px solid var(--ds-card-border);
        border-radius: var(--radius-card, 0.85rem);
        padding: 1.1rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        box-shadow: var(--ds-card-shadow);
    }
    .ds-stats-section-title {
        font-size: 0.88rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--ds-text);
        flex-shrink: 0;
    }

    /* Page Occupancy Grid */
    .ds-stats-page-grid {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        max-height: clamp(160px, 32vh, 420px);
        overflow-y: auto;
        padding-right: 0.35rem;
    }
    .ds-stats-page-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.82rem;
        padding: 0.35rem 0.6rem;
        border-radius: var(--radius-control, 0.4rem);
        background: var(--ds-subtle-bg);
        border: 1px solid var(--ds-subtle-border);
        transition: background 0.15s;
    }
    .ds-stats-page-row:hover {
        background: var(--glass-bg-hover, rgba(255, 255, 255, 0.08));
    }
    .ds-stats-page-lbl {
        width: 85px;
        flex-shrink: 0;
        font-weight: 600;
        color: var(--ds-text);
        display: flex;
        align-items: center;
        gap: 0.35rem;
    }
    .ds-stats-bar-track {
        flex: 1 1 auto;
        height: 1.25rem;
        background: var(--ds-subtle-border);
        border: 1px solid var(--ds-card-border);
        border-radius: var(--radius-control, 0.35rem);
        overflow: hidden;
        position: relative;
        display: flex;
        align-items: center;
    }
    .ds-stats-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #0284c7, #38bdf8);
        border-radius: var(--radius-control, 0.3rem);
        transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        min-width: 4px;
    }
    .ds-stats-bar-fill.is-empty {
        background: rgba(148, 163, 184, 0.12);
    }
    .ds-stats-bar-val {
        width: 90px;
        text-align: right;
        flex-shrink: 0;
        font-weight: 600;
        color: var(--ds-text-dim);
        font-variant-numeric: tabular-nums;
    }

    /* Topic Intelligence Spectrum */
    .ds-stats-topic-spectrum-bar {
        display: flex;
        height: 1.15rem;
        border-radius: 9999px;
        overflow: hidden;
        border: 1px solid var(--ds-card-border);
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
    }
    .ds-stats-spec-active {
        background: linear-gradient(90deg, #059669, #34d399);
        transition: width 0.4s ease;
    }
    .ds-stats-spec-waiting {
        background: linear-gradient(90deg, #d97706, #fbbf24);
        transition: width 0.4s ease;
    }
    .ds-stats-spec-ghost {
        background: linear-gradient(90deg, #7c3aed, #a78bfa);
        transition: width 0.4s ease;
    }

    /* Topic Filter & Search Bar */
    .ds-stats-topic-filter-bar {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        flex-wrap: wrap;
        margin-top: 0.25rem;
    }
    .ds-stats-topic-search-wrap {
        flex: 1 1 240px;
        position: relative;
    }
    .ds-stats-topic-search-input {
        width: 100%;
        padding: 0.45rem 0.75rem 0.45rem 2rem;
        border-radius: var(--radius-control, 0.5rem);
        background: var(--ds-input-bg);
        border: 1px solid var(--ds-input-border);
        color: var(--ds-text);
        font-size: 0.8rem;
        outline: none;
        transition: border-color 0.18s;
    }
    .ds-stats-topic-search-input:focus {
        border-color: #0284c7;
    }
    .ds-stats-topic-search-icon {
        position: absolute;
        left: 0.65rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.95rem;
        color: var(--ds-text-dim);
        pointer-events: none;
    }
    .ds-stats-topic-pills {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-wrap: wrap;
    }
    .ds-stats-topic-pill-btn {
        background: var(--ds-subtle-bg);
        border: 1px solid var(--ds-card-border);
        border-radius: 9999px;
        padding: 0.3rem 0.65rem;
        font-size: 0.74rem;
        font-weight: 600;
        color: var(--ds-text-dim);
        cursor: pointer;
        transition: all 0.18s;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
    }
    .ds-stats-topic-pill-btn:hover {
        background: var(--glass-bg-hover, rgba(255, 255, 255, 0.12));
        color: var(--ds-text);
    }
    .ds-stats-topic-pill-btn.is-active {
        background: var(--ds-tab-active-bg);
        border-color: var(--ds-tab-active-border);
        color: var(--ds-tab-active-color);
        font-weight: 700;
    }

    /* Topic Explorer List (Guaranteed height and fluid rescaling) */
    .ds-stats-topic-list {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        max-height: clamp(220px, 45vh, 620px);
        overflow-y: auto;
        padding-right: 0.35rem;
    }
    .ds-stats-topic-card {
        flex-shrink: 0;
        min-height: 44px;
        box-sizing: border-box;
        background: var(--ds-card-bg);
        border: 1px solid var(--ds-card-border);
        border-radius: var(--radius-control, 0.5rem);
        overflow: hidden;
        transition: border-color 0.15s ease;
    }
    .ds-stats-topic-card:hover {
        background: var(--ds-subtle-bg);
        border-color: var(--glass-border-highlight, rgba(255, 255, 255, 0.14));
    }
    .ds-stats-topic-card.is-expanded {
        border-color: var(--ds-tab-active-border);
        background: var(--ds-tab-active-bg);
    }
    .ds-stats-topic-row-header {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.55rem 0.75rem;
        cursor: pointer;
        user-select: none;
        min-height: 44px;
        box-sizing: border-box;
    }
    .ds-stats-topic-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .ds-stats-topic-dot.is-active { background: #10b981; box-shadow: 0 0 8px #10b981; }
    .ds-stats-topic-dot.is-waiting { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
    .ds-stats-topic-dot.is-ghost { background: #a855f7; box-shadow: 0 0 8px #a855f7; }

    .ds-stats-topic-name-wrap {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        overflow: hidden;
    }
    .ds-stats-topic-name {
        font-family: monospace;
        font-weight: 700;
        font-size: 0.82rem;
        color: var(--ds-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 0 1 auto;
        min-width: 0;
    }
    .ds-stats-topic-val-chip {
        font-family: monospace;
        font-size: 0.72rem;
        padding: 0.15rem 0.45rem;
        border-radius: 4px;
        background: var(--ds-val-chip-bg);
        color: var(--ds-val-chip-color);
        border: 1px solid var(--ds-val-chip-border);
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 0 1 auto;
        min-width: 0;
        line-height: 1.3;
    }
    .ds-stats-topic-meta-badge {
        font-size: 0.72rem;
        padding: 0.2rem 0.55rem;
        border-radius: 9999px;
        font-weight: 600;
        flex-shrink: 0;
    }
    .ds-stats-topic-meta-badge.is-used {
        background: rgba(14, 165, 233, 0.14);
        border: 1px solid rgba(14, 165, 233, 0.35);
        color: var(--ds-accent-cyan);
    }
    .ds-stats-topic-meta-badge.is-unused {
        background: rgba(168, 85, 247, 0.14);
        border: 1px solid rgba(168, 85, 247, 0.35);
        color: var(--ds-accent-violet);
    }
    .ds-stats-topic-copy-actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        flex-shrink: 0;
        margin-left: 0.15rem;
    }
    .ds-stats-topic-btn {
        width: 20px;
        height: 18px;
        padding: 0;
        border-radius: 4px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--text-secondary, #94a3b8);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.72rem;
        cursor: pointer;
        transition: all 0.15s ease;
        box-sizing: border-box;
    }
    .ds-stats-topic-btn:hover:not(:disabled) {
        background: var(--bg-surface-soft, rgba(255, 255, 255, 0.08));
        border-color: var(--border-subtle, rgba(255, 255, 255, 0.12));
        color: var(--text-primary, #ffffff);
    }
    .ds-theme-light .ds-stats-topic-btn {
        color: #64748b;
    }
    .ds-theme-light .ds-stats-topic-btn:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.06);
        border-color: rgba(0, 0, 0, 0.1);
        color: #0f172a;
    }
    .ds-stats-topic-btn:disabled {
        opacity: 0.25;
        cursor: not-allowed;
    }
    .ds-stats-topic-chevron {
        font-size: 0.9rem;
        color: var(--ds-text-dim);
        transition: transform 0.2s ease;
        flex-shrink: 0;
    }
    .ds-stats-topic-card.is-expanded .ds-stats-topic-chevron {
        transform: rotate(90deg);
        color: var(--ds-tab-active-color);
    }

    /* Connected Widgets Drawer */
    .ds-stats-topic-drawer {
        display: none;
        padding: 0.75rem;
        background: var(--ds-drawer-bg);
        border-top: 1px solid var(--ds-card-border);
        gap: 0.6rem;
        flex-direction: column;
    }
    .ds-stats-topic-card.is-expanded .ds-stats-topic-drawer {
        display: flex;
    }
    .ds-stats-widget-connection-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        background: var(--ds-card-bg);
        border: 1px solid var(--ds-card-border);
        border-radius: var(--radius-control, 0.4rem);
        flex-wrap: wrap;
    }
    .ds-stats-widget-connection-left {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        min-width: 0;
    }
    .ds-stats-widget-icon {
        font-size: 1.15rem;
        color: var(--ds-accent-cyan);
        flex-shrink: 0;
    }
    .ds-stats-widget-name {
        font-weight: 600;
        font-size: 0.82rem;
        color: var(--ds-text);
    }
    .ds-stats-widget-role-tag {
        font-family: monospace;
        font-size: 0.7rem;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        background: var(--ds-subtle-bg);
        border: 1px solid var(--ds-subtle-border);
        color: var(--ds-text-dim);
    }
    .ds-stats-widget-connection-right {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        flex-shrink: 0;
    }
    .ds-stats-page-pill {
        font-size: 0.7rem;
        padding: 0.2rem 0.45rem;
        border-radius: 4px;
        background: rgba(14, 165, 233, 0.12);
        color: var(--ds-accent-cyan);
        font-weight: 600;
        border: 1px solid rgba(14, 165, 233, 0.25);
    }
    .ds-stats-jump-btn {
        background: var(--ds-tab-active-bg);
        border: 1px solid var(--ds-tab-active-border);
        color: var(--ds-tab-active-color);
        padding: 0.3rem 0.65rem;
        border-radius: var(--radius-control, 0.4rem);
        font-size: 0.74rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        transition: all 0.18s;
    }
    .ds-stats-jump-btn:hover {
        background: #0284c7;
        color: #ffffff;
        transform: translateY(-1px);
    }

    /* Interactivity Index Segmented Bar */
    .ds-stats-ratio-bar {
        display: flex;
        height: 1.1rem;
        border-radius: 9999px;
        overflow: hidden;
        border: 1px solid var(--ds-card-border);
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
    }
    .ds-stats-ratio-interactive {
        background: linear-gradient(90deg, #0284c7, #38bdf8);
        transition: width 0.5s ease;
    }
    .ds-stats-ratio-passive {
        background: linear-gradient(90deg, #7c3aed, #a78bfa);
        transition: width 0.5s ease;
    }

    /* Donut Chart Layout */
    .ds-stats-donut-layout {
        display: grid;
        grid-template-columns: minmax(280px, 340px) 1fr;
        gap: 1.5rem;
        align-items: center;
    }
    @media (max-width: 780px) {
        .ds-stats-donut-layout {
            grid-template-columns: 1fr;
        }
    }
    .ds-stats-donut-chart-wrap {
        position: relative;
        width: 100%;
        max-width: 320px;
        margin: 0 auto;
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: visible;
    }
    .ds-stats-donut-svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
        transform-origin: center;
        overflow: visible;
    }
    .ds-stats-donut-slice {
        transition: stroke-width 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease, filter 0.22s ease;
        cursor: pointer;
    }
    .ds-stats-donut-slice.is-lit {
        opacity: 1 !important;
        stroke-width: 28 !important;
        filter: drop-shadow(0 0 14px currentColor);
    }
    .ds-stats-donut-slice.is-dimmed {
        opacity: 0.26 !important;
    }
    .ds-stats-donut-center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        text-align: center;
        padding: 1rem;
    }
    .ds-stats-donut-center-num {
        font-size: 2.2rem;
        font-weight: 800;
        line-height: 1;
        color: var(--ds-text);
    }
    .ds-stats-donut-center-lbl {
        font-size: 0.75rem;
        color: var(--ds-text-dim);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-top: 0.25rem;
    }
    .ds-stats-donut-center-sub {
        font-size: 0.72rem;
        color: var(--ds-accent-cyan);
        font-weight: 600;
        margin-top: 0.15rem;
    }

    /* Legend List with Two-Way Hover Lighting */
    .ds-stats-legend-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 0.6rem;
        max-height: clamp(200px, 40vh, 520px);
        overflow-y: auto;
        padding-right: 0.25rem;
    }
    .ds-stats-legend-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.55rem 0.75rem;
        border-radius: var(--radius-control, 0.5rem);
        background: var(--ds-card-bg);
        border: 1px solid var(--ds-card-border);
        transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        cursor: pointer;
    }
    .ds-stats-legend-item:hover, .ds-stats-legend-item.is-highlighted {
        background: var(--ds-subtle-bg);
        border-color: var(--widget-color-local, var(--ds-tab-active-color));
        transform: translateX(3px);
        box-shadow: 0 0 16px -2px color-mix(in srgb, var(--widget-color-local, rgba(56, 189, 248, 0.25)) 35%, transparent);
    }
    .ds-stats-legend-item.is-dimmed {
        opacity: 0.35;
    }
    .ds-stats-legend-color {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .ds-stats-legend-icon {
        font-size: 1rem;
        color: var(--ds-text-dim);
        flex-shrink: 0;
    }
    .ds-stats-legend-text {
        flex: 1 1 auto;
        min-width: 0;
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--ds-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .ds-stats-legend-count {
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--ds-text-dim);
        font-variant-numeric: tabular-nums;
    }

    /* Real-Time Telemetry Oscilloscope with X/Y Axes */
    .ds-stats-telemetry-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    .ds-stats-telemetry-rate-badge {
        display: flex;
        align-items: baseline;
        gap: 0.4rem;
    }
    .ds-stats-telemetry-rate-num {
        font-size: 1.6rem;
        font-weight: 800;
        color: var(--ds-accent-emerald);
        font-variant-numeric: tabular-nums;
    }
    .ds-stats-telemetry-rate-num.is-bytes {
        color: var(--ds-accent-cyan);
    }
    .ds-stats-telemetry-rate-unit {
        font-size: 0.75rem;
        color: var(--ds-text-dim);
        text-transform: uppercase;
        font-weight: 600;
    }
    .ds-stats-canvas-wrap {
        width: 100%;
        height: 175px;
        background: var(--ds-osc-bg);
        border: 1px solid var(--ds-osc-border);
        border-radius: var(--radius-control, 0.5rem);
        overflow: hidden;
        position: relative;
    }
    .ds-stats-canvas-wrap canvas {
        width: 100%;
        height: 100%;
        display: block;
    }

    /* Busiest Topics Table */
    .ds-stats-leaderboard {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
    }
    .ds-stats-leaderboard-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.45rem 0.65rem;
        background: var(--ds-card-bg);
        border: 1px solid var(--ds-card-border);
        border-radius: var(--radius-control, 0.4rem);
        font-size: 0.78rem;
    }
    .ds-stats-leaderboard-row:hover {
        background: var(--ds-subtle-bg);
    }
    .ds-stats-rank-num {
        width: 22px;
        font-weight: 700;
        color: var(--ds-accent-cyan);
        text-align: center;
    }
    .ds-stats-leaderboard-row .ds-stats-topic-name {
        flex: 1 1 auto;
        font-family: monospace;
        color: var(--ds-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .ds-stats-topic-count {
        font-weight: 700;
        color: var(--ds-accent-emerald);
        font-variant-numeric: tabular-nums;
    }

    /* Live Stream Inspector */
    .ds-stats-feed {
        max-height: 220px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-family: monospace;
        font-size: 0.74rem;
        padding-right: 0.25rem;
    }
    .ds-stats-feed-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.35rem 0.55rem;
        background: var(--ds-card-bg);
        border: 1px solid var(--ds-card-border);
        border-radius: var(--radius-control, 0.35rem);
    }
    .ds-stats-feed-time {
        color: var(--ds-text-dim);
        flex-shrink: 0;
    }
    .ds-stats-feed-topic {
        color: var(--ds-accent-cyan);
        font-weight: 600;
        flex: 0 1 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .ds-stats-feed-payload {
        flex: 1 1 auto;
        color: var(--ds-val-chip-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .ds-stats-feed-btn {
        background: transparent;
        border: none;
        color: var(--ds-text-dim);
        cursor: pointer;
        padding: 0.2rem;
        border-radius: 4px;
        transition: color 0.15s;
    }
    .ds-stats-feed-btn:hover {
        color: var(--ds-text);
    }

    /* System & Diagnostics */
    .ds-stats-diag-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 0.85rem;
    }
    .ds-stats-table {
        width: 100%;
        font-size: 0.8rem;
        border-collapse: collapse;
    }
    .ds-stats-table td {
        padding: 0.45rem 0.4rem;
        border-bottom: 1px solid var(--ds-subtle-border);
    }
    .ds-stats-table td:first-child {
        color: var(--ds-text-dim);
        font-weight: 500;
        width: 44%;
    }
    .ds-stats-table td:last-child {
        color: var(--ds-text);
        font-weight: 600;
        font-family: monospace;
        word-break: break-all;
    }

    /* Widget Info & Registry Table */
    .ds-stats-widget-table-wrap {
        width: 100%;
        overflow-x: auto;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.15);
        border: 1px solid var(--ds-subtle-border);
        margin-top: 0.5rem;
    }
    body.ui-light .ds-stats-widget-table-wrap {
        background: rgba(255, 255, 255, 0.4);
    }
    .ds-stats-widget-table {
        width: 100%;
        font-size: 0.78rem;
        border-collapse: collapse;
        min-width: 540px;
    }
    .ds-stats-widget-table th {
        text-align: left;
        padding: 0.55rem 0.6rem;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ds-text-dim);
        font-weight: 700;
        border-bottom: 1px solid var(--ds-subtle-border);
        background: rgba(255, 255, 255, 0.03);
    }
    body.ui-light .ds-stats-widget-table th {
        background: rgba(0, 0, 0, 0.03);
    }
    .ds-stats-widget-table td {
        padding: 0.45rem 0.6rem;
        border-bottom: 1px solid var(--ds-subtle-border);
        color: var(--ds-text);
        vertical-align: middle;
        font-weight: 400;
        width: auto !important;
        font-family: inherit !important;
        word-break: normal !important;
    }
    .ds-stats-widget-table tr:last-child td {
        border-bottom: none;
    }
    .ds-stats-widget-table tr:hover td {
        background: rgba(255, 255, 255, 0.04);
    }
    body.ui-light .ds-stats-widget-table tr:hover td {
        background: rgba(0, 0, 0, 0.03);
    }
    .ds-widget-name-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
    }
    .ds-widget-icon-box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        font-size: 0.88rem;
        flex-shrink: 0;
    }
    .ds-widget-type-pill {
        display: inline-block;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.72rem;
        background: color-mix(in srgb, var(--widget-color-local, var(--ui-accent)) 15%, transparent);
        color: var(--widget-color-local, var(--ui-accent));
        border: 1px solid color-mix(in srgb, var(--widget-color-local, var(--ui-accent)) 30%, transparent);
    }
    .ds-widget-ver-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.15rem 0.45rem;
        border-radius: 4px;
        font-weight: 700;
        font-family: monospace;
        font-size: 0.74rem;
        background: rgba(6, 182, 212, 0.14);
        color: #22d3ee;
        border: 1px solid rgba(6, 182, 212, 0.28);
    }
    body.ui-light .ds-widget-ver-badge {
        background: rgba(8, 145, 178, 0.12);
        color: #0e7490;
        border-color: rgba(8, 145, 178, 0.25);
    }
    .ds-widget-date-cell {
        font-family: monospace;
        font-size: 0.74rem;
        color: var(--ds-text-dim);
    }
    .ds-widget-usage-cell {
        text-align: right;
        font-weight: 600;
    }
    .ds-widget-usage-active {
        color: #34d399;
    }
    body.ui-light .ds-widget-usage-active {
        color: #059669;
    }
    .ds-widget-usage-zero {
        color: var(--ds-text-dim);
        opacity: 0.6;
    }
    .ds-stats-widget-table tr.ds-widget-row {
        cursor: pointer;
        transition: background 0.15s ease;
    }
    .ds-stats-widget-table tr.ds-widget-row:hover td {
        background: rgba(255, 255, 255, 0.05);
    }
    body.ui-light .ds-stats-widget-table tr.ds-widget-row:hover td {
        background: rgba(0, 0, 0, 0.04);
    }
    .ds-stats-widget-table tr.ds-widget-row.is-expanded td {
        background: rgba(6, 182, 212, 0.08);
        border-bottom-color: transparent;
    }
    .ds-widget-row-caret {
        transition: transform 0.2s ease;
        color: var(--ds-text-dim);
        font-size: 0.8rem;
    }
    .ds-stats-widget-table tr.ds-widget-row.is-expanded .ds-widget-row-caret {
        transform: rotate(90deg);
        color: #22d3ee;
    }
    .ds-widget-drawer-row td {
        padding: 0 !important;
        background: rgba(0, 0, 0, 0.25) !important;
        border-bottom: 1px solid var(--ds-subtle-border);
    }
    body.ui-light .ds-widget-drawer-row td {
        background: rgba(240, 244, 248, 0.7) !important;
    }
    .ds-widget-drawer-content {
        padding: 0.85rem 1rem 1rem 1.25rem;
        border-left: 3px solid #22d3ee;
        margin: 0.4rem 0.6rem 0.6rem 0.6rem;
        border-radius: 6px;
        background: rgba(15, 23, 42, 0.6);
    }
    body.ui-light .ds-widget-drawer-content {
        background: rgba(255, 255, 255, 0.85);
        border-left-color: #0891b2;
    }
    .ds-widget-drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.65rem;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid var(--ds-subtle-border);
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--ds-text);
    }
    .ds-widget-drawer-count {
        font-size: 0.72rem;
        font-weight: 500;
        color: var(--ds-text-dim);
        font-family: monospace;
    }
    .ds-widget-drawer-timeline {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        max-height: 280px;
        overflow-y: auto;
        padding-right: 0.35rem;
    }
    .ds-widget-drawer-card {
        padding: 0.55rem 0.75rem;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--ds-subtle-border);
    }
    body.ui-light .ds-widget-drawer-card {
        background: rgba(0, 0, 0, 0.02);
    }
    .ds-widget-drawer-card-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.35rem;
    }
    .ds-widget-drawer-list {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .ds-widget-drawer-entry {
        margin-bottom: 0.5rem;
    }
    .ds-widget-drawer-entry:last-child {
        margin-bottom: 0;
    }
    .ds-widget-drawer-entry-title {
        display: flex;
        align-items: baseline;
        gap: 0.35rem;
        font-weight: 600;
        font-size: 0.77rem;
        color: var(--ds-text);
        line-height: 1.35;
    }
    .ds-widget-drawer-entry-desc {
        font-size: 0.72rem;
        line-height: 1.45;
        color: var(--ds-text-dim);
        margin: 0.15rem 0 0 0;
    }
    .ds-widget-drawer-empty {
        padding: 0.75rem;
        font-size: 0.78rem;
        color: var(--ds-text-dim);
        text-align: center;
        font-style: italic;
    }
    .ds-widget-history-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.15rem 0.45rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.05);
        color: var(--ds-text-dim);
        border: 1px solid var(--ds-subtle-border);
        transition: all 0.15s ease;
    }
    .ds-widget-row:hover .ds-widget-history-pill {
        background: rgba(6, 182, 212, 0.15);
        color: #22d3ee;
        border-color: rgba(6, 182, 212, 0.3);
    }

    /* Actions Bar */
    .ds-stats-action-row {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-top: 0.5rem;
    }
    .ds-stats-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.55rem 1.15rem;
        border-radius: var(--radius-control, 0.5rem);
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.18s ease;
        border: 1px solid transparent;
    }
    .ds-stats-btn-primary {
        background: #0284c7;
        color: #ffffff;
        box-shadow: 0 2px 10px rgba(2, 132, 199, 0.35);
    }
    .ds-stats-btn-primary:hover {
        background: #0369a1;
        transform: translateY(-1px);
    }
    .ds-stats-btn-secondary {
        background: var(--ds-subtle-bg);
        border: 1px solid var(--ds-card-border);
        color: var(--ds-text);
    }
    .ds-stats-btn-secondary:hover {
        background: var(--glass-bg-hover, rgba(255, 255, 255, 0.12));
    }

    /* About Section */
    .ds-stats-about-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 0.35rem 0.25rem 0.15rem;
        gap: 0.85rem;
    }
    .ds-stats-about-logo {
        height: 56px;
        filter: drop-shadow(0 4px 18px rgba(14, 165, 233, 0.45));
    }
    .ds-stats-about-logo.logo-light { display: none; }
    .ds-stats-about-logo.logo-dark { display: block; }
    body.ui-light .ds-stats-about-logo.logo-light,
    :root.ui-light .ds-stats-about-logo.logo-light { display: block; }
    body.ui-light .ds-stats-about-logo.logo-dark,
    :root.ui-light .ds-stats-about-logo.logo-dark { display: none; }

    .ds-stats-about-title {
        font-size: 1.6rem;
        font-weight: 800;
        color: var(--ds-text);
        letter-spacing: -0.02em;
    }
    .ds-stats-about-ver {
        font-family: var(--font-mono, monospace);
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--ds-accent-cyan);
        margin-left: 0.35rem;
        vertical-align: middle;
    }
    .ds-stats-about-update-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        padding: 0.15rem 0.5rem;
        border-radius: 9999px;
        background: rgba(14, 165, 233, 0.2);
        border: 1px solid rgba(14, 165, 233, 0.5);
        color: var(--ds-accent-cyan, #0ea5e9);
        margin-left: 0.5rem;
        cursor: pointer;
        vertical-align: middle;
        transition: all 0.15s ease;
    }
    .ds-stats-about-update-pill:hover {
        background: rgba(14, 165, 233, 0.32);
        border-color: var(--ds-accent-cyan, #0ea5e9);
        box-shadow: 0 0 10px rgba(14, 165, 233, 0.4);
    }
    .ds-stats-about-uptodate-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        padding: 0.12rem 0.45rem;
        border-radius: 9999px;
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.4);
        color: #10b981;
        margin-left: 0.5rem;
        vertical-align: middle;
    }
    .ds-stats-about-version-status {
        width: 100%;
        max-width: 540px;
        margin: 0 auto;
    }
    .ds-stats-about-update-banner {
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, var(--ds-card-bg) 75%);
        border: 1px solid rgba(14, 165, 233, 0.45);
        border-radius: var(--radius-control, 0.6rem);
        padding: 0.75rem 1rem;
        box-shadow: 0 4px 16px -2px rgba(14, 165, 233, 0.22);
        text-align: left;
    }
    .ds-stats-about-update-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 0.35rem;
    }
    .ds-stats-about-update-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.88rem;
        font-weight: 700;
        color: var(--ds-accent-cyan, #0ea5e9);
    }
    .ds-stats-about-update-desc {
        font-size: 0.78rem;
        color: var(--ds-text-dim);
        line-height: 1.4;
    }
    .ds-stats-about-update-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.76rem;
        font-weight: 600;
        padding: 0.28rem 0.65rem;
        border-radius: var(--radius-control, 0.4rem);
        background: var(--ds-accent-cyan, #0ea5e9);
        color: #ffffff;
        border: none;
        cursor: pointer;
        transition: background 0.15s ease, box-shadow 0.15s ease;
    }
    .ds-stats-about-update-btn:hover {
        background: #0284c7;
        box-shadow: 0 0 10px rgba(14, 165, 233, 0.45);
    }
    .ds-stats-about-tagline {
        font-size: 0.9rem;
        color: var(--ds-text-dim);
        max-width: 520px;
        line-height: 1.45;
    }
    .ds-stats-about-tagline strong {
        color: var(--ds-text);
    }
    .ds-stats-glance-card {
        background: var(--ds-card-bg);
        border: 1px solid var(--ds-card-border);
        border-radius: var(--radius-control, 0.5rem);
        padding: 0.65rem 0.5rem;
        text-align: center;
        box-shadow: var(--ds-card-shadow);
    }
    .ds-stats-glance-lbl {
        font-size: 0.68rem;
        text-transform: uppercase;
        color: var(--ds-text-dim);
        font-weight: 600;
        letter-spacing: 0.04em;
    }
    .ds-stats-glance-val {
        font-size: 1.35rem;
        font-weight: 800;
        line-height: 1.25;
        margin-top: 0.15rem;
        font-variant-numeric: tabular-nums;
    }
    /* Changelog Tab Timeline */
    .ds-stats-changelog-timeline {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        padding-right: 0.35rem;
        padding-top: 0.25rem;
    }
    .ds-stats-changelog-filter-label {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.76rem;
        font-weight: 500;
        color: var(--text-secondary);
        cursor: pointer;
        user-select: none;
        transition: color 0.15s ease;
    }
    .ds-stats-changelog-filter-label:hover {
        color: var(--ds-text);
    }
    .ds-stats-changelog-filter-label input[type="checkbox"] {
        cursor: pointer;
        width: 14px;
        height: 14px;
        accent-color: var(--ds-accent-cyan, #0ea5e9);
        border-radius: 3px;
        margin: 0;
    }
    .ds-stats-changelog-track {
        position: relative;
        margin-left: 0.85rem;
        padding-left: 1.35rem;
        border-left: 2px solid var(--ds-subtle-border);
        display: flex;
        flex-direction: column;
        gap: 0.95rem;
    }
    .ds-stats-changelog-item {
        position: relative;
    }
    .ds-stats-changelog-node {
        position: absolute;
        left: -1.35rem;
        top: 1rem;
        width: 11px;
        height: 11px;
        border-radius: 9999px;
        transform: translate(-50%, -50%);
        background: var(--text-muted);
        border: 2px solid var(--ds-bg-panel, #0f172a);
        box-shadow: 0 0 0 2px var(--ds-subtle-border);
        z-index: 2;
        transition: all 0.2s ease;
    }
    .ds-stats-changelog-node.is-latest {
        background: var(--ds-accent-cyan, #0ea5e9);
        box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.4), 0 0 10px rgba(14, 165, 233, 0.6);
    }
    .ds-stats-changelog-node.is-current {
        width: 13px;
        height: 13px;
        background: var(--ds-accent-cyan, #0ea5e9);
        box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.4), 0 0 12px rgba(14, 165, 233, 0.7);
    }
    .ds-stats-changelog-node.is-newer {
        width: 12px;
        height: 12px;
        background: #f59e0b;
        box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.4), 0 0 10px rgba(245, 158, 11, 0.5);
    }
    .ds-stats-changelog-node.is-milestone {
        width: 13px;
        height: 13px;
        background: #38bdf8;
        box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.5), 0 0 12px rgba(56, 189, 248, 0.5);
    }
    .ds-stats-changelog-node.is-latest.is-milestone,
    .ds-stats-changelog-node.is-current.is-milestone {
        background: #38bdf8;
        box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.6), 0 0 14px rgba(56, 189, 248, 0.8);
    }
    .ds-stats-changelog-card {
        background: var(--ds-card-bg);
        border: 1px solid var(--ds-card-border);
        border-radius: var(--radius-control, 0.6rem);
        padding: 0.85rem 1.05rem;
        box-shadow: var(--ds-card-shadow);
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }
    .ds-stats-changelog-card:hover {
        border-color: var(--ds-card-hover-border);
    }
    .ds-stats-changelog-card.is-latest {
        border-color: rgba(14, 165, 233, 0.45);
        box-shadow: 0 0 18px -4px rgba(14, 165, 233, 0.25);
    }
    .ds-stats-changelog-card.is-current {
        border-width: 2px;
        border-color: var(--ds-accent-cyan, #0ea5e9);
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.14) 0%, var(--ds-card-bg) 70%);
        box-shadow: 0 0 22px -2px rgba(14, 165, 233, 0.35);
    }
    .ds-stats-changelog-card.is-newer {
        border-color: rgba(245, 158, 11, 0.45);
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--ds-card-bg) 65%);
        box-shadow: 0 0 18px -4px rgba(245, 158, 11, 0.22);
    }
    .ds-stats-changelog-card.is-milestone {
        border-color: rgba(56, 189, 248, 0.35);
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, var(--ds-card-bg) 60%);
    }
    .ds-stats-changelog-card.is-current.is-milestone {
        border-width: 2px;
        border-color: var(--ds-accent-cyan, #0ea5e9);
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.18) 0%, var(--ds-card-bg) 65%);
        box-shadow: 0 0 24px -2px rgba(14, 165, 233, 0.42);
    }
    .ds-stats-changelog-card.is-latest.is-milestone {
        border-color: rgba(56, 189, 248, 0.5);
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, var(--ds-card-bg) 65%);
        box-shadow: 0 0 20px -3px rgba(14, 165, 233, 0.3);
    }

    /* Light Mode Changelog Colors */
    body.ui-light .ds-stats-dialog .ds-stats-about-update-banner,
    :root.ui-light .ds-stats-dialog .ds-stats-about-update-banner {
        background: #ffffff;
        border-color: rgba(14, 165, 233, 0.5);
        box-shadow: 0 2px 14px -2px rgba(14, 165, 233, 0.18);
    }
    body.ui-light .ds-stats-dialog .ds-stats-changelog-card,
    :root.ui-light .ds-stats-dialog .ds-stats-changelog-card {
        background: rgba(239, 246, 255, 0.78);
        border-color: rgba(186, 230, 253, 0.65);
    }
    body.ui-light .ds-stats-dialog .ds-stats-changelog-card:hover,
    :root.ui-light .ds-stats-dialog .ds-stats-changelog-card:hover {
        border-color: rgba(125, 211, 252, 0.85);
    }
    body.ui-light .ds-stats-dialog .ds-stats-changelog-card.is-current,
    :root.ui-light .ds-stats-dialog .ds-stats-changelog-card.is-current {
        background: #ffffff;
        border-color: var(--ds-accent-cyan, #0ea5e9);
        box-shadow: 0 0 18px -2px rgba(14, 165, 233, 0.28);
    }
    body.ui-light .ds-stats-dialog .ds-stats-changelog-card.is-newer,
    :root.ui-light .ds-stats-dialog .ds-stats-changelog-card.is-newer {
        background: #ffffff;
        border-color: rgba(245, 158, 11, 0.55);
        box-shadow: 0 0 16px -2px rgba(245, 158, 11, 0.2);
    }
    body.ui-light .ds-stats-dialog .ds-stats-changelog-card.is-milestone,
    :root.ui-light .ds-stats-dialog .ds-stats-changelog-card.is-milestone {
        background: #ffffff;
        border-color: rgba(14, 165, 233, 0.32);
        box-shadow: 0 2px 10px -2px rgba(14, 165, 233, 0.12);
    }
    body.ui-light .ds-stats-dialog .ds-stats-changelog-card.is-milestone:hover,
    :root.ui-light .ds-stats-dialog .ds-stats-changelog-card.is-milestone:hover {
        border-color: rgba(14, 165, 233, 0.55);
    }
    body.ui-light .ds-stats-dialog .ds-stats-changelog-card.is-latest.is-milestone,
    body.ui-light .ds-stats-dialog .ds-stats-changelog-card.is-current.is-milestone,
    :root.ui-light .ds-stats-dialog .ds-stats-changelog-card.is-latest.is-milestone,
    :root.ui-light .ds-stats-dialog .ds-stats-changelog-card.is-current.is-milestone {
        background: #ffffff;
        border-color: rgba(14, 165, 233, 0.55);
        box-shadow: 0 0 16px -2px rgba(14, 165, 233, 0.25);
    }
    .ds-stats-changelog-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 0.55rem;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid var(--ds-subtle-border);
    }
    .ds-stats-changelog-ver-wrap {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    .ds-stats-changelog-badge {
        font-family: var(--font-mono, monospace);
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--ds-accent-cyan);
    }
    .ds-stats-changelog-latest-pill {
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        padding: 0.15rem 0.45rem;
        border-radius: 9999px;
        background: rgba(14, 165, 233, 0.18);
        border: 1px solid rgba(14, 165, 233, 0.4);
        color: var(--ds-accent-cyan);
    }
    .ds-stats-changelog-current-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        padding: 0.15rem 0.5rem;
        border-radius: 9999px;
        background: rgba(14, 165, 233, 0.22);
        border: 1px solid var(--ds-accent-cyan, #0ea5e9);
        color: var(--ds-accent-cyan, #0ea5e9);
    }
    .ds-stats-changelog-newer-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        padding: 0.15rem 0.5rem;
        border-radius: 9999px;
        background: rgba(245, 158, 11, 0.2);
        border: 1px solid rgba(245, 158, 11, 0.5);
        color: #f59e0b;
    }
    .ds-stats-changelog-milestone-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 0.12rem 0.42rem;
        border-radius: 9999px;
        background: rgba(56, 189, 248, 0.15);
        border: 1px solid rgba(56, 189, 248, 0.4);
        color: #38bdf8;
    }
    .ds-stats-changelog-date {
        font-size: 0.76rem;
        color: var(--text-muted);
        font-family: var(--font-mono, monospace);
    }
    .ds-stats-changelog-changes {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }
    .ds-stats-changelog-entry {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }
    .ds-stats-changelog-entry-title {
        display: flex;
        align-items: baseline;
        gap: 0.45rem;
        font-weight: 600;
        font-size: 0.83rem;
        color: var(--ds-text);
        line-height: 1.4;
    }
    .ds-stats-changelog-entry-desc {
        font-size: 0.77rem;
        line-height: 1.5;
        color: var(--text-muted);
        margin: 0;
    }
    .ds-stats-changelog-tag-pill {
        display: inline-flex;
        align-items: center;
        padding: 0.08rem 0.35rem;
        border-radius: 0.25rem;
        font-size: 0.64rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        line-height: 1;
        flex-shrink: 0;
    }
    .ds-stats-changelog-tag-new {
        background: rgba(34, 211, 238, 0.15);
        color: #22d3ee;
        border: 1px solid rgba(34, 211, 238, 0.35);
    }
    .ds-stats-changelog-tag-improved {
        background: rgba(192, 132, 252, 0.15);
        color: #c084fc;
        border: 1px solid rgba(192, 132, 252, 0.35);
    }
    .ds-stats-changelog-tag-changed {
        background: rgba(251, 191, 36, 0.15);
        color: #fbbf24;
        border: 1px solid rgba(251, 191, 36, 0.35);
    }
    .ds-stats-changelog-tag-fixed {
        background: rgba(52, 211, 153, 0.15);
        color: #34d399;
        border: 1px solid rgba(52, 211, 153, 0.35);
    }
    .ds-stats-loading-msg, .ds-stats-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2.5rem 1rem;
        color: var(--text-muted);
        text-align: center;
        gap: 0.5rem;
        font-size: 0.85rem;
    }
    .ds-stats-action-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        padding: 0.25rem 0.6rem;
        border-radius: var(--radius-control, 0.35rem);
        cursor: pointer;
    }
    .ds-stats-bytes-rank {
        background: rgba(14, 165, 233, 0.15) !important;
        color: var(--ds-accent-cyan) !important;
    }
    .ds-stats-coffee-card {
        margin-top: 0.5rem;
        background: linear-gradient(135deg, rgba(234, 88, 12, 0.15), rgba(245, 158, 11, 0.15));
        border: 1px solid rgba(245, 158, 11, 0.35);
        border-radius: var(--radius-card, 0.85rem);
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.65rem;
        max-width: 480px;
        width: 100%;
        box-shadow: 0 8px 24px -6px rgba(245, 158, 11, 0.2);
    }
    .ds-stats-coffee-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: #f59e0b;
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }
    .ds-stats-coffee-desc {
        font-size: 0.78rem;
        color: var(--ds-text-dim);
        line-height: 1.45;
        max-width: 440px;
    }
    body.ui-light .ds-stats-dialog .ds-stats-coffee-card,
    :root.ui-light .ds-stats-dialog .ds-stats-coffee-card {
        background: linear-gradient(135deg, rgba(254, 243, 199, 0.75), rgba(255, 237, 213, 0.75));
        border: 1px solid rgba(245, 158, 11, 0.45);
        box-shadow: 0 6px 20px -4px rgba(245, 158, 11, 0.2);
    }
    body.ui-light .ds-stats-dialog .ds-stats-coffee-title,
    :root.ui-light .ds-stats-dialog .ds-stats-coffee-title {
        color: #b45309;
    }
    body.ui-light .ds-stats-dialog .ds-stats-coffee-desc,
    :root.ui-light .ds-stats-dialog .ds-stats-coffee-desc {
        color: #334155;
    }

    .ds-stats-coffee-btn {
        background: #f59e0b;
        color: #1e293b;
        font-weight: 700;
        padding: 0.65rem 1.5rem;
        border-radius: 9999px;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.88rem;
        transition: transform 0.18s ease, background 0.18s ease;
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.38);
    }
    .ds-stats-coffee-btn:hover {
        background: #fbbf24;
        transform: scale(1.04);
    }
    .ds-stats-links-row {
        display: flex;
        gap: 1.25rem;
        flex-wrap: wrap;
        justify-content: center;
        font-size: 0.8rem;
        margin-top: 0.5rem;
    }
    .ds-stats-link {
        color: var(--ds-accent-cyan);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-weight: 500;
    }
    .ds-stats-link:hover {
        text-decoration: underline;
    }
    .ds-stats-toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(16, 185, 129, 0.4);
        color: #ffffff;
        padding: 0.65rem 1.25rem;
        border-radius: 9999px;
        font-size: 0.82rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 0 16px rgba(16, 185, 129, 0.25);
        opacity: 0;
        pointer-events: none;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 99999;
    }
    .ds-stats-toast.is-show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
    /* Session Console Output Viewer */
    .ds-console-toolbar {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin: 0.75rem 0 0.5rem 0;
        flex-wrap: wrap;
    }
    .ds-console-search-wrap {
        position: relative;
        flex: 1;
        min-width: 200px;
    }
    .ds-console-search-wrap i {
        position: absolute;
        left: 0.65rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
        font-size: 0.85rem;
        pointer-events: none;
    }
    .ds-console-search-input {
        width: 100%;
        padding: 0.38rem 0.65rem 0.38rem 2rem;
        background: var(--bg-surface-soft, rgba(255, 255, 255, 0.04));
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.78rem;
        outline: none;
        box-sizing: border-box;
    }
    .ds-console-search-input:focus {
        border-color: var(--ds-accent-cyan, #06b6d4);
    }
    .ds-console-level-filters {
        display: flex;
        gap: 0.3rem;
    }
    .ds-console-filter-btn {
        background: var(--bg-surface-soft, rgba(255, 255, 255, 0.04));
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
        color: var(--text-secondary);
        padding: 0.3rem 0.65rem;
        border-radius: 6px;
        font-size: 0.74rem;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    .ds-console-filter-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: var(--text-primary);
    }
    .ds-console-filter-btn.is-active {
        background: rgba(6, 182, 212, 0.18);
        border-color: rgba(6, 182, 212, 0.45);
        color: var(--ds-accent-cyan, #06b6d4);
        font-weight: 600;
    }
    .ds-console-viewer {
        background: #080c14;
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
        border-radius: 8px;
        height: 250px;
        overflow-y: auto;
        padding: 0.6rem 0.75rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 0.75rem;
        line-height: 1.45;
        color: #e2e8f0;
        box-sizing: border-box;
    }
    .ds-theme-light .ds-console-viewer {
        background: #f8fafc;
        border-color: rgba(0, 0, 0, 0.12);
        color: #1e293b;
    }
    .ds-console-line {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.15rem 0;
        word-break: break-all;
        white-space: pre-wrap;
    }
    .ds-console-line:hover {
        background: rgba(255, 255, 255, 0.03);
    }
    .ds-theme-light .ds-console-line:hover {
        background: rgba(0, 0, 0, 0.03);
    }
    .ds-console-time {
        color: #64748b;
        flex-shrink: 0;
        font-size: 0.7rem;
        user-select: none;
    }
    .ds-console-badge {
        flex-shrink: 0;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 1px 4px;
        border-radius: 3px;
        text-transform: uppercase;
        user-select: none;
    }
    .ds-console-badge-log {
        background: rgba(148, 163, 184, 0.15);
        color: #94a3b8;
    }
    .ds-console-badge-info {
        background: rgba(56, 189, 248, 0.15);
        color: #38bdf8;
    }
    .ds-console-badge-warn {
        background: rgba(251, 191, 36, 0.18);
        color: #fbbf24;
    }
    .ds-console-badge-error {
        background: rgba(248, 113, 113, 0.2);
        color: #f87171;
    }
    .ds-console-badge-debug {
        background: rgba(167, 139, 250, 0.15);
        color: #a78bfa;
    }
    .ds-console-msg {
        flex: 1;
        min-width: 0;
    }
    .ds-console-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #64748b;
        font-style: italic;
    }
    `;

    // Canonical widget fallback icon dictionary
    const WIDGET_ICONS = {
        arrow: 'ph-arrow-right',
        battery: 'ph-battery-charging',
        clock: 'ph-clock',
        container: 'ph-squares-four',
        empty: 'ph-squares-four',
        editbox: 'ph-textbox',
        gauge: 'ph-gauge',
        graph: 'ph-chart-line',
        icon: 'ph-star',
        image: 'ph-image',
        label: 'ph-text-t',
        lightgrid: 'ph-lightbulb',
        list: 'ph-list-dashes',
        textbox: 'ph-list-dashes',
        menu: 'ph-list',
        slider: 'ph-sliders-horizontal',
        switch: 'ph-toggle-left',
        text: 'ph-text-t',
        videostream: 'ph-video-camera'
    };

    function getWidgetMeta(type) {
        if (!type) return null;
        if (typeof window.WidgetRegistry !== 'undefined') {
            const wClass = (typeof window.WidgetRegistry.get === 'function')
                ? window.WidgetRegistry.get(type)
                : (window.WidgetRegistry.widgets ? (window.WidgetRegistry.widgets[type] || (type === 'container' ? window.WidgetRegistry.widgets['empty'] : (type === 'textbox' ? window.WidgetRegistry.widgets['list'] : null))) : null);
            if (wClass && wClass.metadata) return wClass.metadata;
        }
        return null;
    }

    function getWidgetIcon(type) {
        const meta = getWidgetMeta(type);
        if (meta && meta.icon) return meta.icon;
        const normalized = String(type || '').toLowerCase();
        return WIDGET_ICONS[normalized] || 'ph-cube';
    }

    function getWidgetColorVar(type) {
        const normalized = String(type || '').toLowerCase();
        const colorType = (normalized === 'container') ? 'empty' : ((normalized === 'textbox') ? 'list' : normalized);
        return 'var(--widget-color-' + colorType + ', var(--ui-accent, #38bdf8))';
    }

    // Active platform connection tracking to prevent stale cross-platform topics
    let lastActiveDriverType = null;
    const discoveredUnusedTopics = new Set();

    function ensureStylesInjected() {
        if (document.getElementById('ds-statistics-styles')) return;
        const style = document.createElement('style');
        style.id = 'ds-statistics-styles';
        style.textContent = CSS_STYLES;
        document.head.appendChild(style);
    }

    function showToast(msg) {
        let toast = document.getElementById('ds-stats-toast-el');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'ds-stats-toast-el';
            toast.className = 'ds-stats-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = '<i class="ph-bold ph-check-circle" style="color:#10b981;"></i><span>' + msg + '</span>';
        toast.classList.add('is-show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(function () {
            toast.classList.remove('is-show');
        }, 2800);
    }

    /**
     * Bulletproof clipboard copying with automatic fallback.
     */
    function copyToClipboard(text) {
        return new Promise(function (resolve) {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText(text).then(function () {
                    resolve(true);
                }).catch(function () {
                    resolve(fallbackCopy(text));
                });
            } else {
                resolve(fallbackCopy(text));
            }
        });
    }

    function fallbackCopy(text) {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            ta.style.top = '0';
            ta.setAttribute('readonly', '');
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        } catch (e) {
            return false;
        }
    }

    /**
     * Escapes raw text for safe HTML element and attribute insertion.
     */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Detects human-friendly OS, browser, screen, and hardware properties.
     */
    function detectClientEnvironment() {
        const ua = navigator.userAgent || '';
        const platform = navigator.platform || '';

        let os = 'Unknown OS';
        let osIcon = 'ph-laptop';
        if (/Windows NT 10.0/i.test(ua)) {
            os = 'Windows 10 / 11';
            osIcon = 'ph-windows-logo';
        } else if (/Windows NT 6.3/i.test(ua)) {
            os = 'Windows 8.1';
            osIcon = 'ph-windows-logo';
        } else if (/Windows/i.test(ua)) {
            os = 'Windows';
            osIcon = 'ph-windows-logo';
        } else if (/Macintosh|Mac OS X/i.test(ua)) {
            os = 'macOS';
            osIcon = 'ph-apple-logo';
            if (/AppleWebKit/i.test(ua) && navigator.maxTouchPoints > 0) {
                os = 'iPadOS';
                osIcon = 'ph-device-tablet';
            }
        } else if (/iPhone|iPod/i.test(ua)) {
            os = 'iOS';
            osIcon = 'ph-device-mobile';
        } else if (/iPad/i.test(ua)) {
            os = 'iPadOS';
            osIcon = 'ph-device-tablet';
        } else if (/Android/i.test(ua)) {
            os = 'Android';
            osIcon = 'ph-android-logo';
        } else if (/Linux/i.test(ua)) {
            os = 'Linux';
            osIcon = 'ph-linux-logo';
        }

        if (/WOW64|Win64|x86_64|x64|amd64/i.test(ua) || /x86_64/i.test(platform)) {
            os += ' (64-bit)';
        } else if (/arm64|aarch64/i.test(ua)) {
            os += ' (ARM64)';
        }

        let browser = 'Unknown Browser';
        let browserIcon = 'ph-globe';
        const edgeMatch = ua.match(/Edg\/(\d+)/i);
        const chromeMatch = ua.match(/Chrome\/(\d+)/i);
        const firefoxMatch = ua.match(/Firefox\/(\d+)/i);
        const safariMatch = ua.match(/Version\/(\d+).*Safari/i);
        const operaMatch = ua.match(/OPR\/(\d+)/i);

        if (edgeMatch) {
            browser = 'Microsoft Edge ' + edgeMatch[1];
            browserIcon = 'ph-browser';
        } else if (operaMatch) {
            browser = 'Opera ' + operaMatch[1];
            browserIcon = 'ph-browser';
        } else if (chromeMatch) {
            browser = 'Google Chrome ' + chromeMatch[1];
            browserIcon = 'ph-google-chrome-logo';
        } else if (firefoxMatch) {
            browser = 'Mozilla Firefox ' + firefoxMatch[1];
            browserIcon = 'ph-browser';
        } else if (safariMatch) {
            browser = 'Apple Safari ' + safariMatch[1];
            browserIcon = 'ph-compass';
        }

        let memoryUsage = 'N/A';
        if (typeof performance !== 'undefined' && performance.memory && performance.memory.usedJSHeapSize) {
            const usedMb = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
            const totalMb = (performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(1);
            memoryUsage = `${usedMb} MB (JS Heap) • ${totalMb} MB alloc`;
            if (navigator.deviceMemory) {
                memoryUsage += ` • ${navigator.deviceMemory} GB System`;
            }
        } else {
            try {
                let bytes = 0;
                if (typeof Dashboard !== 'undefined' && Dashboard.widgets) {
                    bytes += JSON.stringify(Dashboard.widgets).length * 2;
                }
                if (typeof Dashboard !== 'undefined' && Dashboard.liveData) {
                    bytes += JSON.stringify(Dashboard.liveData).length * 2;
                }
                const domNodes = document.getElementsByTagName('*').length;
                bytes += domNodes * 1200;
                if (typeof window !== 'undefined' && Array.isArray(window.DS_CONSOLE_BUFFER)) {
                    bytes += window.DS_CONSOLE_BUFFER.length * 250;
                }
                const mb = (bytes / (1024 * 1024)).toFixed(1);
                memoryUsage = `~${mb} MB (Estimated Footprint)`;
                if (navigator.deviceMemory) {
                    memoryUsage += ` • ${navigator.deviceMemory} GB System`;
                }
            } catch (e) {
                memoryUsage = navigator.deviceMemory ? `${navigator.deviceMemory} GB System RAM` : 'N/A';
            }
        }

        return {
            os: os,
            osIcon: osIcon,
            browser: browser,
            browserIcon: browserIcon,
            screenRes: window.screen.width + ' × ' + window.screen.height,
            colorDepth: (window.screen.colorDepth || 24) + '-bit',
            viewport: window.innerWidth + ' × ' + window.innerHeight,
            dpr: (window.devicePixelRatio || 1).toFixed(2),
            cpuCores: navigator.hardwareConcurrency ? navigator.hardwareConcurrency + ' Logical Cores' : 'Unknown',
            memoryUsage: memoryUsage,
            ramEstimate: memoryUsage,
            touchPoints: navigator.maxTouchPoints || 0,
            colorScheme: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'Dark' : 'Light'
        };
    }

    // Active state container while dialog is open
    let session = null;

    /**
     * Inspects current Dashboard and extracts comprehensive analytics and topic maps.
     */
    function analyzeDashboard() {
        const widgets = (typeof Dashboard !== 'undefined' && Dashboard.widgets) ? Dashboard.widgets : {};
        const widgetIds = Object.keys(widgets);
        const totalWidgets = widgetIds.length;

        let activeWidgets = 0;
        let deactivatedWidgets = 0;
        let hiddenWidgets = 0;
        let interactiveWidgetsCount = 0;
        let passiveWidgetsCount = 0;

        const typeCounts = {};
        const boundTopicsSet = new Set();
        const topicToWidgetsMap = {}; // Maps topic -> Array of { id, name, type, icon, page, role }
        let staticWidgets = 0;
        let dynamicWidgets = 0;
        let totalWidgetSurfaceArea = 0;

        // Discover all pages from widgets & Dashboard
        const pageWidgetMap = {};
        const multiPageWidgets = [];
        let maxPage = 1;

        if (typeof Dashboard !== 'undefined' && typeof Dashboard._getPagesWithWidgets === 'function') {
            const pages = Dashboard._getPagesWithWidgets();
            if (pages && pages.length) {
                maxPage = Math.max(maxPage, Math.max(...pages));
            }
        }

        widgetIds.forEach(function (id) {
            const w = widgets[id];
            if (!w || !w.overrides) return;
            const raw = w.overrides.page != null ? String(w.overrides.page) : '1';

            if (typeof WidgetPageSpec !== 'undefined' && typeof WidgetPageSpec.maxPageInSpec === 'function') {
                const m = WidgetPageSpec.maxPageInSpec(raw);
                if (m > maxPage) maxPage = m;
            } else {
                raw.split(',').forEach(function (tok) {
                    const range = tok.trim().match(/^(\d+)\s*-\s*(\d+)$/);
                    if (range) {
                        const hi = Math.max(parseInt(range[1], 10), parseInt(range[2], 10));
                        if (hi > maxPage) maxPage = hi;
                    } else {
                        const n = parseInt(tok.trim(), 10);
                        if (!isNaN(n) && n > maxPage) maxPage = n;
                    }
                });
            }
        });

        for (let p = 1; p <= maxPage; p++) {
            pageWidgetMap[p] = [];
        }

        const interactiveTypes = { switch: true, slider: true, menu: true, lightgrid: true, editbox: true };

        widgetIds.forEach(function (id) {
            const w = widgets[id];
            if (!w) return;

            const isDeactivated = !!(w.overrides && w.overrides.deactivated);
            const isHidden = !!(w.overrides && w.overrides.hidden) || (w.elements && w.elements.wrapper && w.elements.wrapper.style.display === 'none');

            if (isDeactivated) deactivatedWidgets++;
            else activeWidgets++;
            if (isHidden) hiddenWidgets++;

            // Surface Area
            const width = (w.overrides && w.overrides.width) ? parseInt(w.overrides.width, 10) : 100;
            const height = (w.overrides && w.overrides.height) ? parseInt(w.overrides.height, 10) : 100;
            totalWidgetSurfaceArea += (width * height);

            // Type resolution
            let type = 'unknown';
            if (typeof Dashboard !== 'undefined' && typeof Dashboard._getWidgetTypeByInstance === 'function') {
                type = Dashboard._getWidgetTypeByInstance(w) || 'custom';
            }
            typeCounts[type] = (typeCounts[type] || 0) + 1;

            if (interactiveTypes[type]) interactiveWidgetsCount++;
            else passiveWidgetsCount++;

            // Page detection
            const rawPage = (w.overrides && w.overrides.page != null) ? String(w.overrides.page) : '1';
            let coveredPagesCount = 0;
            for (let p = 1; p <= maxPage; p++) {
                let covers = false;
                if (typeof WidgetPageSpec !== 'undefined' && typeof WidgetPageSpec.coversPage === 'function') {
                    covers = WidgetPageSpec.coversPage(rawPage, p);
                } else {
                    const parts = rawPage.split(',').map(function (s) { return s.trim(); });
                    covers = parts.indexOf(String(p)) !== -1;
                }
                if (covers) {
                    pageWidgetMap[p].push(id);
                    coveredPagesCount++;
                }
            }
            if (coveredPagesCount > 1) multiPageWidgets.push(id);

            // Helper to register topic-to-widget connection
            const meta = getWidgetMeta(type);
            const defaultWidgetLabel = meta ? (meta.label || meta.shortName || type) : (type.charAt(0).toUpperCase() + type.slice(1));
            const widgetName = (w.overrides && w.overrides.metaName)
                ? w.overrides.metaName
                : (w.overrides && w.overrides.label ? w.overrides.label : defaultWidgetLabel);

            let minPage = 1;
            if (typeof WidgetPageSpec !== 'undefined' && typeof WidgetPageSpec.minPage === 'function') {
                minPage = WidgetPageSpec.minPage(rawPage);
            } else {
                const parsedP = parseInt(rawPage.split(',')[0], 10);
                if (!isNaN(parsedP)) minPage = parsedP;
            }

            const registerTopicConnection = function (topic, role) {
                if (!topic || typeof topic !== 'string') return;
                boundTopicsSet.add(topic);
                hasBindings = true;

                if (!topicToWidgetsMap[topic]) topicToWidgetsMap[topic] = [];
                // Check if already registered for same widget
                const existing = topicToWidgetsMap[topic].find(function (item) { return item.id === id; });
                if (existing) {
                    if (!existing.roles.includes(role)) existing.roles.push(role);
                } else {
                    topicToWidgetsMap[topic].push({
                        id: id,
                        name: widgetName,
                        type: type,
                        icon: getWidgetIcon(type),
                        pageSpec: rawPage,
                        targetPage: minPage,
                        roles: [role]
                    });
                }
            };

            // Topic binding detection
            let hasBindings = false;
            if (w.bindings && typeof w.bindings === 'object') {
                const scan = function (obj, path) {
                    if (!obj) return;
                    if (typeof obj === 'string' && obj.length > 0) {
                        registerTopicConnection(obj, path);
                    } else if (typeof obj === 'object') {
                        Object.keys(obj).forEach(function (k) {
                            scan(obj[k], path ? (path + '.' + k) : k);
                        });
                    }
                };
                scan(w.bindings, 'bindings');
            }
            if (w.overrides) {
                ['topic', 'stateTopic', 'valueTopic', 'outputTopic'].forEach(function (k) {
                    if (typeof w.overrides[k] === 'string' && w.overrides[k].length > 0) {
                        registerTopicConnection(w.overrides[k], k);
                    }
                });
                if (Array.isArray(w.overrides.menuItems)) {
                    w.overrides.menuItems.forEach(function (item, idx) {
                        if (item.topic) registerTopicConnection(item.topic, `menuItems[${idx}].topic`);
                        if (item.stateTopic) registerTopicConnection(item.stateTopic, `menuItems[${idx}].stateTopic`);
                    });
                }
                if (Array.isArray(w.overrides.lightsData)) {
                    w.overrides.lightsData.forEach(function (item, idx) {
                        if (item.topic) registerTopicConnection(item.topic, `lightsData[${idx}].topic`);
                    });
                }
            }

            if (hasBindings) dynamicWidgets++;
            else staticWidgets++;
        });

        // Compute active vs empty pages
        let activePagesCount = 0;
        let emptyPagesCount = 0;
        let densestPage = 1;
        let maxPageWidgets = 0;

        for (let p = 1; p <= maxPage; p++) {
            const count = (pageWidgetMap[p] || []).length;
            if (count > 0) {
                activePagesCount++;
                if (count > maxPageWidgets) {
                    maxPageWidgets = count;
                    densestPage = p;
                }
            } else {
                emptyPagesCount++;
            }
        }

        // Driver details & platform tracking
        const driverType = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.getType() : 'none';
        const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;

        if (lastActiveDriverType !== null && lastActiveDriverType !== driverType) {
            discoveredUnusedTopics.clear();
        }
        lastActiveDriverType = driverType;

        // Live topics evaluation
        const liveData = (typeof Dashboard !== 'undefined' && Dashboard.liveData) ? Dashboard.liveData : {};
        const liveTopicsArray = Object.keys(liveData);
        const liveTopicsSet = new Set(liveTopicsArray);

        // Harvest all known topics from system sources to track unused universe
        const harvestTopic = function (t) {
            if (!t || typeof t !== 'string') return;
            if (!boundTopicsSet.has(t)) {
                discoveredUnusedTopics.add(t);
            }
        };

        liveTopicsArray.forEach(harvestTopic);

        // Dashboard.topicMeta is Homey-specific (device capabilities and variables)
        if (driverType === 'homey' && typeof Dashboard !== 'undefined' && Dashboard.topicMeta) {
            Object.keys(Dashboard.topicMeta).forEach(harvestTopic);
        }

        if (driver && driver.seenTopics && typeof driver.seenTopics.forEach === 'function') {
            driver.seenTopics.forEach(function (_row, t) { harvestTopic(t); });
        }

        let activeBoundTopicsCount = 0;
        let waitingBoundTopicsCount = 0;
        const waitingBoundTopics = [];
        const activeBoundTopics = [];

        boundTopicsSet.forEach(function (topic) {
            if (liveTopicsSet.has(topic) && liveData[topic] !== undefined) {
                activeBoundTopicsCount++;
                activeBoundTopics.push(topic);
            } else {
                waitingBoundTopicsCount++;
                waitingBoundTopics.push(topic);
            }
        });

        // Ghost / Unused topics: all known topics not bound to any canvas widget
        const ghostTopics = [];
        discoveredUnusedTopics.forEach(function (t) {
            if (!boundTopicsSet.has(t)) {
                ghostTopics.push(t);
            }
        });

        const isConnected = !!(typeof Dashboard !== 'undefined' && Dashboard._dataDriverConnected);

        let uptimeSec = 0;
        if (driver && driver.stats && driver.stats.connectedSince) {
            uptimeSec = Math.max(0, Math.floor((Date.now() - driver.stats.connectedSince) / 1000));
        }

        // Canvas geometry
        const cWidth = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.canvasWidth) ? parseInt(MASTER_SETTINGS.canvasWidth, 10) : 1920;
        const cHeight = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.canvasHeight) ? parseInt(MASTER_SETTINGS.canvasHeight, 10) : 1080;
        const totalCanvasPx = cWidth * cHeight;
        const areaMegaPx = ((totalCanvasPx) / 1000000).toFixed(2);
        const coveragePct = totalCanvasPx > 0 ? Math.min(100, (totalWidgetSurfaceArea / totalCanvasPx) * 100).toFixed(1) : 0;
        const layoutMode = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.layout && MASTER_SETTINGS.layout.mode) ? MASTER_SETTINGS.layout.mode : 'fixed';

        // Aspect Ratio
        const gcd = function (a, b) { return b === 0 ? a : gcd(b, a % b); };
        const g = gcd(cWidth, cHeight);
        const aspect = (cWidth / g) + ':' + (cHeight / g);

        // Group counts
        const groupCount = (typeof Dashboard !== 'undefined' && Dashboard.groups) ? Object.keys(Dashboard.groups).length : 0;

        return {
            totalWidgets: totalWidgets,
            activeWidgets: activeWidgets,
            deactivatedWidgets: deactivatedWidgets,
            hiddenWidgets: hiddenWidgets,
            interactiveWidgetsCount: interactiveWidgetsCount,
            passiveWidgetsCount: passiveWidgetsCount,
            staticWidgets: staticWidgets,
            dynamicWidgets: dynamicWidgets,
            typeCounts: typeCounts,
            totalPages: maxPage,
            activePagesCount: activePagesCount,
            emptyPagesCount: emptyPagesCount,
            densestPage: densestPage,
            maxPageWidgets: maxPageWidgets,
            pageWidgetMap: pageWidgetMap,
            multiPageCount: multiPageWidgets.length,
            boundTopicsCount: boundTopicsSet.size,
            activeBoundTopicsCount: activeBoundTopicsCount,
            waitingBoundTopicsCount: waitingBoundTopicsCount,
            activeBoundTopics: activeBoundTopics,
            waitingBoundTopics: waitingBoundTopics,
            liveTopicsCount: liveTopicsArray.length,
            ghostTopicsCount: ghostTopics.length,
            ghostTopics: ghostTopics,
            topicToWidgetsMap: topicToWidgetsMap,
            liveData: liveData,
            driverType: driverType,
            isConnected: isConnected,
            driverUptimeSec: uptimeSec,
            driverTotalMsgs: (driver && driver.stats) ? (driver.stats.msgCount || 0) : 0,
            canvasWidth: cWidth,
            canvasHeight: cHeight,
            canvasAreaMegaPx: areaMegaPx,
            coveragePct: coveragePct,
            aspectRatio: aspect,
            layoutMode: layoutMode,
            groupCount: groupCount,
            themeName: (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.theme) ? MASTER_SETTINGS.theme : 'default_dark',
            gridSize: (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.gridSize) ? MASTER_SETTINGS.gridSize : 10,
            gridSnap: !!(typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.gridSnap)
        };
    }

    /**
     * Builds the interactive SVG Donut Chart with two-way legend lighting and uncropped glow.
     */
    function renderDonutChart(container, typeCounts, totalWidgets) {
        container.innerHTML = '';

        const wrap = document.createElement('div');
        wrap.className = 'ds-stats-donut-layout';

        const chartWrap = document.createElement('div');
        chartWrap.className = 'ds-stats-donut-chart-wrap';

        if (totalWidgets === 0) {
            chartWrap.innerHTML = `
                <div class="ds-stats-donut-center">
                    <i class="ph-bold ph-cube-transparent text-3xl" style="color:#64748b;"></i>
                    <div class="ds-stats-donut-center-lbl" style="margin-top:0.5rem;">Canvas is Empty</div>
                </div>`;
            wrap.appendChild(chartWrap);
            container.appendChild(wrap);
            return;
        }

        // SVG Size 320x320 with radius 110: provides 36px outer margin to prevent any drop-shadow glow clipping!
        const size = 320;
        const center = size / 2;
        const strokeWidth = 22;
        const radius = 110;
        const circumference = 2 * Math.PI * radius;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        svg.setAttribute('class', 'ds-stats-donut-svg');

        // Center HUD Readout
        const centerHud = document.createElement('div');
        centerHud.className = 'ds-stats-donut-center';
        centerHud.innerHTML = `
            <div class="ds-stats-donut-center-num" id="ds-donut-center-num">${totalWidgets}</div>
            <div class="ds-stats-donut-center-lbl" id="ds-donut-center-lbl">Total Widgets</div>
            <div class="ds-stats-donut-center-sub" id="ds-donut-center-sub">100% of Canvas</div>
        `;

        const types = Object.keys(typeCounts).sort(function (a, b) {
            return typeCounts[b] - typeCounts[a];
        });

        let accumulatedOffset = 0;

        const legendGrid = document.createElement('div');
        legendGrid.className = 'ds-stats-legend-grid';

        // Two-way synchronized hover lighting
        function highlightSlice(targetType) {
            const allSlices = svg.querySelectorAll('.ds-stats-donut-slice');
            const allLegendItems = legendGrid.querySelectorAll('.ds-stats-legend-item');

            if (!targetType) {
                allSlices.forEach(function (s) { s.classList.remove('is-lit', 'is-dimmed'); });
                allLegendItems.forEach(function (l) { l.classList.remove('is-highlighted', 'is-dimmed'); });
                document.getElementById('ds-donut-center-num').textContent = String(totalWidgets);
                document.getElementById('ds-donut-center-lbl').textContent = 'Total Widgets';
                document.getElementById('ds-donut-center-sub').textContent = '100% of Canvas';
                return;
            }

            allSlices.forEach(function (s) {
                const isMatch = s.getAttribute('data-type') === targetType;
                s.classList.toggle('is-lit', isMatch);
                s.classList.toggle('is-dimmed', !isMatch);
            });

            allLegendItems.forEach(function (l) {
                const isMatch = l.getAttribute('data-type') === targetType;
                l.classList.toggle('is-highlighted', isMatch);
                l.classList.toggle('is-dimmed', !isMatch);
            });

            const count = typeCounts[targetType] || 0;
            const pct = ((count / totalWidgets) * 100).toFixed(1);
            const meta = getWidgetMeta(targetType);
            const hudName = meta ? (meta.shortName || meta.label || targetType) : targetType;
            document.getElementById('ds-donut-center-num').textContent = String(count);
            document.getElementById('ds-donut-center-lbl').textContent = String(hudName).toUpperCase();
            document.getElementById('ds-donut-center-sub').textContent = `${pct}% (${count} widget${count === 1 ? '' : 's'})`;
        }

        types.forEach(function (t) {
            const count = typeCounts[t];
            const pct = (count / totalWidgets) * 100;
            const sliceLen = (count / totalWidgets) * circumference;
            const meta = getWidgetMeta(t);
            const strokeColor = getWidgetColorVar(t);
            const iconClass = (meta && meta.icon) ? meta.icon : getWidgetIcon(t);
            const displayName = meta ? (meta.label || meta.shortName || t) : (t.charAt(0).toUpperCase() + t.slice(1));

            // SVG Circle Slice
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', String(center));
            circle.setAttribute('cy', String(center));
            circle.setAttribute('r', String(radius));
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', strokeColor);
            circle.style.stroke = strokeColor;
            circle.style.color = strokeColor;
            circle.setAttribute('stroke-width', String(strokeWidth));
            circle.setAttribute('stroke-dasharray', `${sliceLen} ${circumference - sliceLen}`);
            circle.setAttribute('stroke-dashoffset', String(-accumulatedOffset));
            circle.setAttribute('class', 'ds-stats-donut-slice');
            circle.setAttribute('data-type', t);

            accumulatedOffset += sliceLen;

            circle.addEventListener('mouseenter', function () { highlightSlice(t); });
            circle.addEventListener('mouseleave', function () { highlightSlice(null); });

            svg.appendChild(circle);

            // Legend item (lighting up the slice when hovered)
            const legendItem = document.createElement('div');
            legendItem.className = 'ds-stats-legend-item';
            legendItem.setAttribute('data-type', t);
            legendItem.style.setProperty('--widget-color-local', strokeColor);
            legendItem.innerHTML = `
                <div class="ds-stats-legend-color" style="background:${strokeColor}; box-shadow: 0 0 8px ${strokeColor};"></div>
                <i class="ph-bold ${iconClass} ds-stats-legend-icon" style="color:${strokeColor};"></i>
                <div class="ds-stats-legend-text" title="${escapeHtml(displayName)}">${escapeHtml(displayName)}</div>
                <div class="ds-stats-legend-count">${count} <span style="font-size:0.7rem;opacity:0.65;">(${pct.toFixed(0)}%)</span></div>
            `;

            legendItem.addEventListener('mouseenter', function () { highlightSlice(t); });
            legendItem.addEventListener('mouseleave', function () { highlightSlice(null); });

            legendGrid.appendChild(legendItem);
        });

        chartWrap.appendChild(svg);
        chartWrap.appendChild(centerHud);

        wrap.appendChild(chartWrap);
        wrap.appendChild(legendGrid);
        container.appendChild(wrap);
    }

    /**
     * Builds the sanitized diagnostic report string for clipboard sharing.
     */
    function buildDebugReport(stats, client) {
        const lines = [];
        lines.push('### Dashboard Studio Diagnostics');
        lines.push('- **App Version:** ' + (window.DASHBOARD_VERSION || '2.1.1'));
        lines.push('- **Migration Target:** ' + (window.LATEST_MIGRATION_VERSION || '2.0.0'));
        lines.push('- **Timestamp:** ' + new Date().toISOString());
        lines.push('');
        lines.push('#### Client & System Specs');
        lines.push('- **Operating System:** ' + client.os);
        lines.push('- **Browser Engine:** ' + client.browser);
        lines.push('- **Screen Resolution:** ' + client.screenRes + ' (' + client.colorDepth + ', DPR ' + client.dpr + ')');
        lines.push('- **Viewport:** ' + client.viewport);
        lines.push('- **Hardware:** ' + client.cpuCores + ' | ' + client.memoryUsage);
        lines.push('- **Touch Support:** ' + (client.touchPoints > 0 ? 'Yes (' + client.touchPoints + ' points)' : 'No'));
        lines.push('- **Theme Preference:** ' + client.colorScheme);
        lines.push('');
        lines.push('#### Canvas & Layout Architecture');
        lines.push('- **Dimensions:** ' + stats.canvasWidth + ' × ' + stats.canvasHeight + ' (' + stats.canvasAreaMegaPx + ' MP, ' + stats.aspectRatio + ')');
        lines.push('- **Layout Mode:** ' + stats.layoutMode.toUpperCase());
        lines.push('- **Total Inferred Pages:** ' + stats.totalPages);
        lines.push('- **Active Pages:** ' + stats.activePagesCount + ' (Empty: ' + stats.emptyPagesCount + ')');
        lines.push('- **Densest Page:** Page ' + stats.densestPage + ' (' + stats.maxPageWidgets + ' widgets)');
        lines.push('- **Multi-Page Widgets:** ' + stats.multiPageCount);
        lines.push('- **Surface Coverage:** ' + stats.coveragePct + '%');
        lines.push('- **Composite Groups:** ' + stats.groupCount);
        lines.push('');
        lines.push('#### Widget Inventory');
        lines.push('- **Total Widgets:** ' + stats.totalWidgets + ' (Active: ' + stats.activeWidgets + ', Deactivated: ' + stats.deactivatedWidgets + ')');
        lines.push('- **Interactivity Index:** ' + stats.interactiveWidgetsCount + ' Interactive Controls | ' + stats.passiveWidgetsCount + ' Passive Indicators');
        lines.push('- **Topic Bindings:** ' + stats.dynamicWidgets + ' Dynamic Widgets | ' + stats.staticWidgets + ' Static Widgets');
        lines.push('- **Type Breakdown:**');
        Object.keys(stats.typeCounts).forEach(function (t) {
            lines.push('  - `' + t + '`: ' + stats.typeCounts[t]);
        });
        lines.push('');
        lines.push('#### Data Driver & Bus Integrity');
        lines.push('- **Active Driver:** ' + stats.driverType.toUpperCase() + ' (' + (stats.isConnected ? 'Connected' : 'Disconnected') + ')');
        lines.push('- **Bound Topics:** ' + stats.boundTopicsCount + ' (' + stats.activeBoundTopicsCount + ' receiving data, ' + stats.waitingBoundTopicsCount + ' waiting)');
        lines.push('- **Topics in Bus Memory:** ' + stats.liveTopicsCount + ' (Ghost topics: ' + stats.ghostTopicsCount + ')');
        lines.push('- **Total Ingested Messages:** ' + stats.driverTotalMsgs);

        // Session Console Output
        const rawLogs = (typeof window !== 'undefined' && Array.isArray(window.DS_CONSOLE_BUFFER)) ? window.DS_CONSOLE_BUFFER : [];
        lines.push('');
        lines.push('#### Session Console Output (' + Math.min(50, rawLogs.length) + ' of ' + rawLogs.length + ' entries)');
        if (rawLogs.length === 0) {
            lines.push('*No console entries recorded in this session.*');
        } else {
            lines.push('```text');
            const recentLogs = rawLogs.slice(-50);
            recentLogs.forEach(function (entry) {
                const lvl = (entry.level || 'log').toUpperCase().padEnd(5, ' ');
                lines.push('[' + (entry.timestamp || '') + '] [' + lvl + '] ' + (entry.text || ''));
            });
            lines.push('```');
            if (rawLogs.length > 50) {
                lines.push('*Note: Showing last 50 entries. Complete session log (' + rawLogs.length + ' entries) is included in the Download Diagnostics JSON export.*');
            }
        }

        return lines.join('\n');
    }

    const WIDGET_TAG_INDEX_MAP = {
        arrow: 1,
        battery: 2,
        clock: 3,
        container: 4,
        empty: 4,
        editbox: 5,
        gauge: 6,
        graph: 7,
        icon: 8,
        image: 9,
        label: 10,
        lightgrid: 11,
        list: 12,
        textbox: 12,
        menu: 13,
        slider: 14,
        switch: 15,
        text: 16,
        videostream: 17
    };

    function getWidgetTagId(type, widgetInfo) {
        if (widgetInfo && typeof widgetInfo.tagId === 'number') return widgetInfo.tagId;
        if (WIDGET_TAG_INDEX_MAP[type]) return WIDGET_TAG_INDEX_MAP[type];
        var targetKey = type + '_widget';
        for (var id in changelogTagLibrary) {
            if (changelogTagLibrary[id] === targetKey) {
                return parseInt(id, 10);
            }
        }
        return null;
    }

    /**
     * Renders the dynamic widget module registry table showing versions, release dates, and canvas usage.
     */
    function renderWidgetRegistryTable(stats) {
        const tbody = document.getElementById('ds-widget-registry-tbody');
        const countLbl = document.getElementById('ds-widget-registry-count');
        if (!tbody) return;

        if (typeof window.WidgetRegistry === 'undefined' || typeof window.WidgetRegistry.getAll !== 'function') {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--ds-text-dim);padding:1rem;">WidgetRegistry is not available.</td></tr>';
            return;
        }

        const allWidgets = window.WidgetRegistry.getAll();
        const typeKeys = Object.keys(allWidgets);
        if (countLbl) {
            countLbl.textContent = `${typeKeys.length} registered modules`;
        }

        const canvasCounts = (stats && stats.typeCounts) ? stats.typeCounts : {};

        const sortedList = typeKeys.map(function (typeKey) {
            const wClass = allWidgets[typeKey];
            const meta = (wClass && wClass.metadata) ? wClass.metadata : {};
            const widgetCount = canvasCounts[typeKey]
                || (typeKey === 'empty' ? canvasCounts['container'] : 0)
                || (typeKey === 'container' ? canvasCounts['empty'] : 0)
                || 0;
            return {
                type: typeKey,
                label: meta.label || meta.shortName || typeKey,
                icon: meta.icon || 'ph-cube',
                category: meta.category || 'General',
                version: meta.version || (window.DASHBOARD_VERSION || '2.0.0'),
                date: meta.date || '—',
                count: widgetCount
            };
        }).sort(function (a, b) {
            return a.label.localeCompare(b.label);
        });

        const rowsHtml = sortedList.map(function (w) {
            const usageHtml = w.count > 0
                ? `<span class="ds-widget-usage-active"><i class="ph-bold ph-check-circle" style="vertical-align:middle;margin-right:3px;"></i>${w.count} active</span>`
                : `<span class="ds-widget-usage-zero">0 on canvas</span>`;

            return `<tr class="ds-widget-row" data-type="${escapeHtml(w.type)}">
                <td>
                    <div class="ds-widget-name-cell">
                        <i class="ph-bold ph-caret-right ds-widget-row-caret"></i>
                        <span class="ds-widget-icon-box" style="background:var(--widget-color-${escapeHtml(w.type)});color:#fff;">
                            <i class="ph-bold ${escapeHtml(w.icon)}"></i>
                        </span>
                        <span>${escapeHtml(w.label)}</span>
                    </div>
                </td>
                <td><span class="ds-widget-type-pill" style="--widget-color-local: var(--widget-color-${escapeHtml(w.type)});" title="Registry type key">${escapeHtml(w.type)}</span></td>
                <td><span style="color:var(--ds-text-dim);">${escapeHtml(w.category)}</span></td>
                <td><span class="ds-widget-ver-badge">v${escapeHtml(w.version)}</span></td>
                <td><span class="ds-widget-date-cell">${escapeHtml(w.date)}</span></td>
                <td class="ds-widget-usage-cell">${usageHtml}</td>
                <td style="text-align:center;"><span class="ds-widget-history-pill"><i class="ph-bold ph-clock-counter-clockwise"></i> Log</span></td>
            </tr>
            <tr class="ds-widget-drawer-row" id="ds-widget-drawer-${escapeHtml(w.type)}" style="display:none;">
                <td colspan="7">
                    <div class="ds-widget-drawer-content" id="ds-widget-drawer-content-${escapeHtml(w.type)}">
                        <div class="ds-stats-loading-msg" style="padding:0.75rem;">
                            <i class="ph-bold ph-spinner ph-spin"></i><span>Loading release notes...</span>
                        </div>
                    </div>
                </td>
            </tr>`;
        }).join('');

        tbody.innerHTML = rowsHtml;

        const rows = tbody.querySelectorAll('.ds-widget-row');
        rows.forEach(function (row) {
            row.addEventListener('click', function () {
                const type = row.getAttribute('data-type');
                const drawerRow = document.getElementById('ds-widget-drawer-' + type);
                if (!drawerRow) return;

                const isExpanded = row.classList.toggle('is-expanded');
                if (isExpanded) {
                    drawerRow.style.display = 'table-row';
                    const widgetObj = sortedList.find(function (item) { return item.type === type; });
                    populateWidgetDrawer(type, widgetObj);
                } else {
                    drawerRow.style.display = 'none';
                }
            });
        });
    }

    function parseChangelogEntry(change) {
        var title = '';
        var description = '';
        if (typeof change === 'string') {
            var dashIdx = change.indexOf(' - ');
            if (dashIdx !== -1) {
                title = change.substring(0, dashIdx).trim();
                description = change.substring(dashIdx + 3).trim();
            } else {
                title = change.trim();
            }
        } else if (change && typeof change === 'object') {
            if (change.title) {
                title = String(change.title).trim();
                description = String(change.description || '').trim();
            } else if (change.text) {
                var dIdx = change.text.indexOf(' - ');
                if (dIdx !== -1) {
                    title = change.text.substring(0, dIdx).trim();
                    description = change.text.substring(dIdx + 3).trim();
                } else {
                    title = String(change.text).trim();
                }
            }
        }

        var cat = '';
        var displayTitle = title;
        var m = title.match(/^\s*(New|Improved|Changed|Fixed|Addition|Bugfix|Change)\b[:\-]?\s*(.*)$/i);
        if (m) {
            cat = m[1].toLowerCase();
            displayTitle = m[2];
        }

        return {
            title: title,
            displayTitle: displayTitle,
            category: cat,
            description: description
        };
    }

    function renderChangelogEntryHtml(parsed, isDrawer) {
        var badgeHtml = '';
        var cat = parsed.category;
        if (cat === 'new' || cat === 'addition') {
            badgeHtml = '<span class="ds-stats-changelog-tag-pill ds-stats-changelog-tag-new">NEW</span>';
        } else if (cat === 'improved' || cat === 'improvement') {
            badgeHtml = '<span class="ds-stats-changelog-tag-pill ds-stats-changelog-tag-improved">IMPROVED</span>';
        } else if (cat === 'changed' || cat === 'change') {
            badgeHtml = '<span class="ds-stats-changelog-tag-pill ds-stats-changelog-tag-changed">CHANGED</span>';
        } else if (cat === 'fixed' || cat === 'bugfix' || cat === 'fix') {
            badgeHtml = '<span class="ds-stats-changelog-tag-pill ds-stats-changelog-tag-fixed">FIXED</span>';
        }

        var entryClass = isDrawer ? 'ds-widget-drawer-entry' : 'ds-stats-changelog-entry';
        var titleClass = isDrawer ? 'ds-widget-drawer-entry-title' : 'ds-stats-changelog-entry-title';
        var descClass = isDrawer ? 'ds-widget-drawer-entry-desc' : 'ds-stats-changelog-entry-desc';

        var out = '<div class="' + entryClass + '">';
        out += '<div class="' + titleClass + '">';
        if (badgeHtml) {
            out += badgeHtml;
        }
        out += '<span>' + escapeHtml(parsed.displayTitle) + '</span>';
        out += '</div>';
        if (parsed.description) {
            out += '<p class="' + descClass + '">' + escapeHtml(parsed.description) + '</p>';
        }
        out += '</div>';
        return out;
    }

    async function populateWidgetDrawer(type, widgetInfo) {
        const container = document.getElementById('ds-widget-drawer-content-' + type);
        if (!container) return;

        const data = await loadChangelogData();
        if (!data || !Array.isArray(data)) {
            container.innerHTML = '<div class="ds-widget-drawer-empty"><i class="ph-bold ph-warning-circle" style="color:var(--ds-accent-amber);margin-right:4px;"></i> Unable to load changelog data.</div>';
            return;
        }

        const tagId = getWidgetTagId(type, widgetInfo);
        const widgetLabel = (widgetInfo && widgetInfo.label) ? widgetInfo.label : type;

        const matchingReleases = [];
        let totalChanges = 0;

        data.forEach(function (rel) {
            const rawChanges = Array.isArray(rel.changes) ? rel.changes : [];
            const matches = rawChanges.filter(function (change) {
                if (!change) return false;
                if (typeof change === 'object' && Array.isArray(change.tags)) {
                    return tagId !== null && change.tags.indexOf(tagId) !== -1;
                }
                return false;
            });

            if (matches.length > 0) {
                matchingReleases.push({
                    version: rel.version,
                    date: rel.date,
                    changes: matches
                });
                totalChanges += matches.length;
            }
        });

        if (matchingReleases.length === 0) {
            container.innerHTML = `
                <div class="ds-widget-drawer-header">
                    <span>${escapeHtml(widgetLabel)} Changelog History</span>
                    <span class="ds-widget-drawer-count">0 recorded changes</span>
                </div>
                <div class="ds-widget-drawer-empty"><i class="ph-bold ph-info" style="margin-right:4px;"></i> No changelog entries recorded for this widget yet.</div>
            `;
            return;
        }

        let html = `
            <div class="ds-widget-drawer-header">
                <span>${escapeHtml(widgetLabel)} Changelog History</span>
                <span class="ds-widget-drawer-count">${totalChanges} recorded change${totalChanges === 1 ? '' : 's'} across ${matchingReleases.length} release${matchingReleases.length === 1 ? '' : 's'}</span>
            </div>
            <div class="ds-widget-drawer-timeline">
        `;

        matchingReleases.forEach(function (rel) {
            const isMilestone = isMilestoneVersion(rel.version);
            const badgeClass = isMilestone ? 'ds-stats-ver-badge is-milestone' : 'ds-stats-ver-badge';

            html += `
                <div class="ds-widget-drawer-card">
                    <div class="ds-widget-drawer-card-header">
                        <span class="${badgeClass}">v${escapeHtml(rel.version)}</span>
                        <span style="font-size:0.73rem;color:var(--ds-text-dim);font-family:monospace;">${escapeHtml(rel.date || '')}</span>
                    </div>
                    <div class="ds-widget-drawer-list">
            `;

            rel.changes.forEach(function (change) {
                var parsed = parseChangelogEntry(change);
                html += renderChangelogEntryHtml(parsed, true);
            });

            html += `</div></div>`;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    const topicFilterState = { filter: 'all', query: '' };
    let changelogData = null;
    let changelogTagLibrary = {};
    let changelogLoadingPromise = null;
    let changelogOnlyNew = false;

    function compareVersions(v1, v2) {
        var clean1 = String(v1 || '0').replace(/^v/i, '').trim();
        var clean2 = String(v2 || '0').replace(/^v/i, '').trim();
        var parts1 = clean1.split('.').map(function (n) { return parseInt(n, 10) || 0; });
        var parts2 = clean2.split('.').map(function (n) { return parseInt(n, 10) || 0; });
        var len = Math.max(parts1.length, parts2.length, 3);
        for (var i = 0; i < len; i++) {
            var p1 = parts1[i] || 0;
            var p2 = parts2[i] || 0;
            if (p1 < p2) return -1;
            if (p1 > p2) return 1;
        }
        return 0;
    }

    /**
     * Returns the platform build number (stamped by the Home Assistant publisher), or 0 when absent.
     */
    function getDashboardBuild() {
        var build = parseInt(typeof window !== 'undefined' ? window.DASHBOARD_BUILD : 0, 10);
        return build > 0 ? build : 0;
    }

    async function loadChangelogData() {
        if (changelogData) return changelogData;
        if (changelogLoadingPromise) return changelogLoadingPromise;

        changelogLoadingPromise = (async function () {
            const basePath = (typeof window !== 'undefined' && window.location && window.location.pathname)
                ? window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)
                : '';
            const rawSources = [
                '../../website/changelog.json',
                '../website/changelog.json',
                'release-changelog.json',
                (basePath ? (basePath + 'release-changelog.json') : null),
                '/dashboard_studio/release-changelog.json',
                '/release-changelog.json',
                'https://satoer.com/dashboardstudio/changelog.json'
            ];
            const sources = [];
            for (let s = 0; s < rawSources.length; s++) {
                if (rawSources[s] && sources.indexOf(rawSources[s]) === -1) {
                    sources.push(rawSources[s]);
                }
            }

            for (let i = 0; i < sources.length; i++) {
                try {
                    const resp = await fetch(sources[i]);
                    if (!resp.ok) continue;
                    const json = await resp.json();
                    const releases = Array.isArray(json) ? json : (json.releases || []);
                    if (releases.length > 0) {
                        changelogData = releases;
                        changelogTagLibrary = (!Array.isArray(json) && json.tagLibrary) ? json.tagLibrary : {};
                        return changelogData;
                    }
                } catch (e) {
                    // fall through to next source
                }
            }
            return null;
        })();

        const result = await changelogLoadingPromise;
        changelogLoadingPromise = null;
        return result;
    }

    /**
     * Updates the About page version status badge and update alert banner.
     */
    async function updateAboutVersionUI() {
        const statusContainer = document.getElementById('ds-stats-about-version-status');
        const badgeSlot = document.getElementById('ds-stats-about-ver-badge-slot');
        if (!statusContainer && !badgeSlot) return;

        const currentVersion = String(window.DASHBOARD_VERSION || '').trim();
        const data = await loadChangelogData();
        if (!data || !Array.isArray(data) || data.length === 0) {
            return;
        }

        const latestRelease = data[0];
        const latestVer = String(latestRelease.version || '').trim();
        const cmp = currentVersion ? compareVersions(latestVer, currentVersion) : 0;

        if (cmp > 0) {
            if (badgeSlot) {
                badgeSlot.innerHTML = `<span class="ds-stats-about-update-pill" id="ds-about-update-pill" role="button" tabindex="0" title="Click to view changelog"><i class="ph-bold ph-arrow-circle-up"></i> Update: v${escapeHtml(latestVer)}</span>`;
                const pill = document.getElementById('ds-about-update-pill');
                if (pill) {
                    pill.onclick = function () { switchTab('changelog'); };
                    pill.onkeydown = function (e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            switchTab('changelog');
                        }
                    };
                }
            }

            if (statusContainer) {
                statusContainer.innerHTML = `
                    <div class="ds-stats-about-update-banner">
                        <div class="ds-stats-about-update-header">
                            <div class="ds-stats-about-update-badge">
                                <i class="ph-bold ph-sparkle"></i>
                                <span>New Version Available: <strong>v${escapeHtml(latestVer)}</strong></span>
                            </div>
                            <button type="button" class="btn-tool ds-stats-about-update-btn" id="ds-about-view-changelog-btn">
                                <i class="ph-bold ph-rocket-launch"></i><span>View Changelog</span>
                            </button>
                        </div>
                        <div class="ds-stats-about-update-desc">
                            You are running <strong>v${escapeHtml(currentVersion)}</strong>. A newer release is available with new features and improvements.
                        </div>
                    </div>
                `;
                const viewBtn = document.getElementById('ds-about-view-changelog-btn');
                if (viewBtn) {
                    viewBtn.onclick = function () { switchTab('changelog'); };
                }
            }
        } else {
            if (badgeSlot) {
                badgeSlot.innerHTML = `<span class="ds-stats-about-uptodate-badge"><i class="ph-bold ph-check"></i> Latest</span>`;
            }
            if (statusContainer) {
                statusContainer.innerHTML = '';
            }
        }
    }

    function isMilestoneVersion(versionStr) {
        if (!versionStr) return false;
        var clean = String(versionStr).replace(/^v/i, '').trim();
        var parts = clean.split('.');
        var last = parts[parts.length - 1];
        return last === '0';
    }

    /**
     * Loads release notes timeline on demand for Changelog tab.
     */
    async function ensureChangelogLoaded() {
        const container = document.getElementById('ds-stats-changelog-timeline');
        if (!container) return;
        if (changelogData) {
            renderChangelogTimeline(container, changelogData);
            updateAboutVersionUI();
            return;
        }
        container.innerHTML = '<div class="ds-stats-loading-msg"><i class="ph-bold ph-spinner ph-spin"></i><span>Loading release notes...</span></div>';

        const data = await loadChangelogData();
        if (data) {
            renderChangelogTimeline(container, data);
            updateAboutVersionUI();
        } else {
            console.error('[DashboardStatistics] Failed to load changelog');
            container.innerHTML = `
                <div class="ds-stats-empty-state">
                    <i class="ph-bold ph-warning-circle" style="color:var(--ds-accent-amber);font-size:1.6rem;"></i>
                    <div style="font-size:0.85rem;font-weight:600;margin-top:0.4rem;">Unable to load changelog</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.2rem;">Please check your connection or try again later.</div>
                    <button type="button" class="btn-tool" style="margin-top:0.75rem;" id="ds-stats-changelog-retry-btn">
                        <i class="ph-bold ph-arrows-clockwise"></i><span>Retry</span>
                    </button>
                </div>
            `;
            const retryBtn = document.getElementById('ds-stats-changelog-retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', function () {
                    ensureChangelogLoaded();
                });
            }
        }
    }

    function renderChangelogTimeline(container, data) {
        if (!container || !Array.isArray(data)) return;
        var currentVersion = String(window.DASHBOARD_VERSION || '').trim();
        var latestRelease = data.length > 0 ? data[0] : null;
        var visibleCount = 0;
        var html = '<div class="ds-stats-changelog-track">';
        data.forEach(function (release, index) {
            var relVer = String(release.version || '').trim();
            var cmp = currentVersion ? compareVersions(relVer, currentVersion) : 0;
            var isCurrent = currentVersion ? (cmp === 0) : (index === 0);
            var isNewer = currentVersion ? (cmp > 0) : false;
            var isLatest = (release === latestRelease);
            var isMilestone = isMilestoneVersion(release.version);
            var rawChanges = Array.isArray(release.changes) ? release.changes : [];
            var filteredChanges = rawChanges;

            if (changelogOnlyNew) {
                filteredChanges = rawChanges.filter(function (change) {
                    var title = typeof change === 'string' ? change : (change.title || change.text || '');
                    return /^\s*(new|addition)\b[:\-]?/i.test(String(title || ''));
                });
                if (filteredChanges.length === 0) {
                    return;
                }
            }

            visibleCount++;
            var changesHtml = '<div class="ds-stats-changelog-changes">';
            filteredChanges.forEach(function (change) {
                var parsed = parseChangelogEntry(change);
                changesHtml += renderChangelogEntryHtml(parsed, false);
            });
            changesHtml += '</div>';

            var nodeClasses = ['ds-stats-changelog-node'];
            var cardClasses = ['ds-stats-changelog-card'];

            if (isCurrent) {
                nodeClasses.push('is-current');
                cardClasses.push('is-current');
            } else if (isNewer) {
                nodeClasses.push('is-newer');
                cardClasses.push('is-newer');
            }

            if (isLatest) {
                nodeClasses.push('is-latest');
                cardClasses.push('is-latest');
            }
            if (isMilestone) {
                nodeClasses.push('is-milestone');
                cardClasses.push('is-milestone');
            }

            var pillsHtml = '';
            if (isCurrent) {
                pillsHtml += '<span class="ds-stats-changelog-current-pill"><i class="ph-bold ph-check-circle"></i> CURRENT VERSION</span>';
            }
            if (isNewer) {
                pillsHtml += '<span class="ds-stats-changelog-newer-pill"><i class="ph-bold ph-arrow-circle-up"></i> NEW VERSION</span>';
            }
            if (isLatest && !isCurrent && !isNewer) {
                pillsHtml += '<span class="ds-stats-changelog-latest-pill">LATEST</span>';
            }
            if (isMilestone) {
                pillsHtml += '<span class="ds-stats-changelog-milestone-pill"><i class="ph-bold ph-sparkle"></i> MILESTONE</span>';
            }

            html += `
                <div class="ds-stats-changelog-item">
                    <div class="${nodeClasses.join(' ')}"></div>
                    <article class="${cardClasses.join(' ')}">
                        <div class="ds-stats-changelog-card-header">
                            <div class="ds-stats-changelog-ver-wrap">
                                <span class="ds-stats-changelog-badge">v${escapeHtml(release.version || '')}</span>
                                ${pillsHtml}
                            </div>
                            <time class="ds-stats-changelog-date">${escapeHtml(release.date || '')}</time>
                        </div>
                        ${changesHtml}
                    </article>
                </div>
            `;
        });
        html += '</div>';

        if (visibleCount === 0) {
            html = `
                <div class="ds-stats-empty-state">
                    <i class="ph-bold ph-funnel" style="color:var(--text-muted);font-size:1.6rem;"></i>
                    <div style="font-size:0.85rem;font-weight:600;margin-top:0.4rem;">No new additions found</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.2rem;">Try unchecking &ldquo;Show only NEW additions&rdquo; to see all updates.</div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Programmatic tab switching helper.
     */
    function switchTab(target) {
        if (!target) return;
        const navBtns = document.querySelectorAll('.ds-stats-tab-btn');
        const tabPanes = document.querySelectorAll('.ds-stats-tab-pane');
        if (!navBtns.length || !tabPanes.length) return;

        let targetBtn = null;
        navBtns.forEach(function (btn) {
            if (btn.getAttribute('data-tab') === target) targetBtn = btn;
        });
        const targetPane = document.getElementById('ds-tab-' + target);
        if (!targetBtn || !targetPane) return;

        navBtns.forEach(function (b) { b.classList.remove('is-active'); });
        tabPanes.forEach(function (p) { p.classList.remove('is-active'); });

        targetBtn.classList.add('is-active');
        targetPane.classList.add('is-active');

        if (target === 'telemetry') {
            renderTelemetryCharts();
            renderLeaderboard();
            renderBytesLeaderboard();
        } else if (target === 'changelog') {
            ensureChangelogLoaded();
        } else if (target === 'about') {
            updateAboutVersionUI();
        } else if (target === 'diagnostics') {
            renderConsoleLogs();
        }
    }

    /**
     * Executes data driver state sync (same as Auto-Widget Gallery).
     */
    function requestLatestValues() {
        const refreshBtn = document.getElementById('ds-topic-refresh-btn');
        const icon = refreshBtn ? refreshBtn.querySelector('i') : null;
        if (icon) icon.classList.add('ph-spin');

        const driver = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.get() : null;
        if (driver && typeof driver.requestStateSync === 'function') {
            driver.requestStateSync();
        } else if (driver && typeof driver._tick === 'function') {
            driver._tick(true);
        } else if (driver && typeof driver.requestAllTopics === 'function') {
            driver.requestAllTopics();
        }

        setTimeout(function () {
            if (icon) icon.classList.remove('ph-spin');
        }, 3000);
    }

    /**
     * Purges cached topic values, marking all bound topics as Waiting while keeping unused universe intact.
     */
    function resetLiveValues() {
        if (typeof Dashboard !== 'undefined' && Dashboard.liveData) {
            for (const k in Dashboard.liveData) {
                if (Object.prototype.hasOwnProperty.call(Dashboard.liveData, k)) {
                    delete Dashboard.liveData[k];
                }
            }
        }
        discoveredUnusedTopics.clear();
        if (session) {
            session.topicFrequencies = {};
            session.topicBytes = {};
            session.dirtyLeaderboard = true;
            session.dirtyTopicIntelligence = true;
        }
        updateTopicIntelligenceRealtime();
        renderLeaderboard();
        renderBytesLeaderboard();
        showToast('Live topic values reset to waiting');
    }

    /**
     * Renders the complete HTML shell and tabs (About is default first tab).
     */
    function buildShell(body) {
        body.innerHTML = `
        <div class="ds-stats-root">
            <nav class="ds-stats-nav">
                <button type="button" class="ds-stats-tab-btn is-active" data-tab="about">
                    <i class="ph-bold ph-heart"></i><span>About &amp; Support</span>
                </button>
                <button type="button" class="ds-stats-tab-btn" data-tab="changelog">
                    <i class="ph-bold ph-rocket-launch"></i><span>Changelog</span>
                </button>
                <button type="button" class="ds-stats-tab-btn" data-tab="overview">
                    <i class="ph-bold ph-compass"></i><span>Overview</span>
                </button>
                <button type="button" class="ds-stats-tab-btn" data-tab="widgets">
                    <i class="ph-bold ph-chart-pie-slice"></i><span>Widget Info</span>
                </button>
                <button type="button" class="ds-stats-tab-btn" data-tab="telemetry">
                    <i class="ph-bold ph-activity"></i><span>Live Telemetry</span>
                </button>
                <button type="button" class="ds-stats-tab-btn" data-tab="diagnostics">
                    <i class="ph-bold ph-wrench"></i><span>Diagnostics</span>
                </button>
                <div class="ds-stats-nav-spacer"></div>
                <div class="ds-stats-nav-badge">
                    <div class="ds-stats-pulse-dot"></div>
                    <span id="ds-stats-status-pill">MONITORING</span>
                </div>
            </nav>
            <div class="ds-stats-viewport">
                <!-- Tab 1: About & Support (Default Start Tab) -->
                <div class="ds-stats-tab-pane is-active" id="ds-tab-about">
                    <div class="ds-stats-section">
                        <div class="ds-stats-section-title">
                            <i class="ph-bold ph-info ds-glow-cyan"></i><span>About</span>
                        </div>
                    <div class="ds-stats-about-box">
                        <img src="images/dashboardstudio_logo_darkmode.svg" alt="Dashboard Studio" class="ds-stats-about-logo logo-dark">
                        <img src="images/dashboardstudio_logo_lightmode.svg" alt="Dashboard Studio" class="ds-stats-about-logo logo-light">
                        <div class="ds-stats-about-title">Dashboard Studio <span class="ds-stats-about-ver">v${escapeHtml(window.DASHBOARD_VERSION || '2.1.1')}${getDashboardBuild() ? ' build ' + getDashboardBuild() : ''}</span><span id="ds-stats-about-ver-badge-slot"></span></div>
                        <div id="ds-stats-about-version-status" class="ds-stats-about-version-status"></div>
                        <div class="ds-stats-about-tagline">
                            Visualize your home, exactly how you imagine it. Crafted with passion and precision by <strong>Satoer Creations</strong> for Homey, MQTT, Node-RED, and modern smart homes.
                        </div>

                        <div class="ds-stats-coffee-card">
                            <div class="ds-stats-coffee-title">
                                ⚡ <span>Enjoying Dashboard Studio?</span>
                            </div>
                            <div class="ds-stats-coffee-desc">
                                Dashboard Studio is built with love and shared freely with the community. If it makes your home smarter and brings you joy, buying Satoer a couple of Red Bulls helps fuel late-night coding sessions, answering community support questions, and developing future features!
                            </div>
                            <a href="https://paypal.me/MichelTwoByTwo" target="_blank" rel="noopener noreferrer" class="ds-stats-coffee-btn">
                                <i class="ph-bold ph-heart" style="color:#ef4444;"></i>
                                <span>Buy Satoer a couple of Red Bulls</span>
                            </a>
                        </div>
                        <div class="ds-stats-links-row">
                            <a href="https://community.homey.app/t/151169" target="_blank" rel="noopener noreferrer" class="ds-stats-link">
                                <i class="ph-bold ph-chat-centered-text"></i><span>Homey Community Topic</span>
                            </a>
                            <span style="opacity:0.3;">•</span>
                            <a href="https://satoer.com/dashboardstudio" target="_blank" rel="noopener noreferrer" class="ds-stats-link">
                                <i class="ph-bold ph-globe"></i><span>Official Website</span>
                            </a>
                            <span style="opacity:0.3;">•</span>
                            <a href="https://satoer.com/dashboardstudio/demo" target="_blank" rel="noopener noreferrer" class="ds-stats-link">
                                <i class="ph-bold ph-play"></i><span>Interactive Demo</span>
                            </a>
                        </div>
                        <div style="font-size:0.74rem;color:var(--text-muted);margin-top:0.75rem;">
                            &copy; 2024-2026 Satoer Creations. All rights reserved. Version ${escapeHtml(window.DASHBOARD_VERSION || '2.1.1')}${getDashboardBuild() ? ' build ' + getDashboardBuild() : ''}.
                        </div>
                    </div>
                    </div>
                </div>

                <!-- Tab 2: Changelog -->
                <div class="ds-stats-tab-pane" id="ds-tab-changelog">
                    <div class="ds-stats-section">
                        <div class="ds-stats-section-title" style="justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
                            <div style="display:flex; align-items:center; gap:0.4rem;">
                                <i class="ph-bold ph-rocket-launch ds-glow-cyan"></i><span>What's New &amp; Release History</span>
                            </div>
                            <label class="ds-stats-changelog-filter-label" title="Show only NEW additions">
                                <input type="checkbox" id="ds-stats-changelog-new-only" />
                                <span>Show only NEW additions</span>
                            </label>
                        </div>
                        <div class="ds-stats-changelog-timeline" id="ds-stats-changelog-timeline">
                            <div class="ds-stats-loading-msg"><i class="ph-bold ph-spinner ph-spin"></i><span>Loading release notes...</span></div>
                        </div>
                    </div>
                </div>

                <!-- Tab 3: Overview -->
                <div class="ds-stats-tab-pane" id="ds-tab-overview">
                    <div class="ds-stats-kpi-grid" id="ds-kpi-grid"></div>

                    <!-- Page Occupancy Spectrum -->
                    <div class="ds-stats-section">
                        <div class="ds-stats-section-title" style="justify-content:space-between;">
                            <div style="display:flex;align-items:center;gap:0.5rem;">
                                <i class="ph-bold ph-browsers ds-glow-cyan"></i><span>Page Occupancy &amp; Density Spectrum</span>
                            </div>
                            <div style="font-size:0.75rem;color:var(--text-muted);" id="ds-multi-page-note"></div>
                        </div>
                        <div class="ds-stats-page-grid" id="ds-page-grid"></div>
                    </div>

                    <!-- Topic Intelligence: Distribution & Widget Relationship Map -->
                    <div class="ds-stats-section">
                        <div class="ds-stats-section-title" style="justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
                            <div style="display:flex;align-items:center;gap:0.5rem;">
                                <i class="ph-bold ph-git-fork ds-glow-amber"></i><span>Topic Intelligence &amp; Widget Relationship Map</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                                <button type="button" class="btn-tool ds-stats-action-btn" id="ds-topic-refresh-btn" title="Ask Homey to send the last known value for every topic again.">
                                    <i class="ph-bold ph-arrows-clockwise"></i><span>Refresh Values</span>
                                </button>
                                <button type="button" class="btn-tool ds-stats-action-btn" id="ds-topic-reset-btn" title="Empty the topic cache; marks all bound topics as waiting until fresh data arrives.">
                                    <i class="ph-bold ph-trash"></i><span>Reset Values</span>
                                </button>
                                <div style="font-size:0.76rem;color:var(--text-muted);" id="ds-topic-spectrum-lbl"></div>
                            </div>
                        </div>

                        <!-- Segmented Distribution Ratio Bar -->
                        <div class="ds-stats-topic-spectrum-bar" id="ds-topic-spectrum-bar">
                            <div class="ds-stats-spec-active" id="ds-spec-active" title="Active Bound Topics"></div>
                            <div class="ds-stats-spec-waiting" id="ds-spec-waiting" title="Waiting Bound Topics"></div>
                            <div class="ds-stats-spec-ghost" id="ds-spec-ghost" title="Unused in Dashboard"></div>
                        </div>

                        <!-- Filter & Search Controls -->
                        <div class="ds-stats-topic-filter-bar">
                            <div class="ds-stats-topic-search-wrap">
                                <i class="ph-bold ph-magnifying-glass ds-stats-topic-search-icon"></i>
                                <input type="text" class="ds-stats-topic-search-input" id="ds-topic-search-input" placeholder="Search topics by name..." />
                            </div>
                            <div class="ds-stats-topic-pills">
                                <button type="button" class="ds-stats-topic-pill-btn is-active" data-topic-filter="all">All (<span id="ds-cnt-all">0</span>)</button>
                                <button type="button" class="ds-stats-topic-pill-btn" data-topic-filter="active">🟢 Active Used (<span id="ds-cnt-active">0</span>)</button>
                                <button type="button" class="ds-stats-topic-pill-btn" data-topic-filter="waiting">🟡 Waiting (<span id="ds-cnt-waiting">0</span>)</button>
                                <button type="button" class="ds-stats-topic-pill-btn" data-topic-filter="unused">🟣 Unused (<span id="ds-cnt-unused">0</span>)</button>
                            </div>
                        </div>

                        <!-- Interactive Topic Explorer List -->
                        <div class="ds-stats-topic-list" id="ds-topic-list"></div>
                    </div>
                </div>

                <!-- Tab 4: Widget Info (Donut Chart, Interactivity & Versions) -->
                <div class="ds-stats-tab-pane" id="ds-tab-widgets">
                    <!-- Interactivity Ratio Bar -->
                    <div class="ds-stats-section">
                        <div class="ds-stats-section-title" style="justify-content:space-between;">
                            <div style="display:flex;align-items:center;gap:0.5rem;">
                                <i class="ph-bold ph-sliders ds-glow-cyan"></i><span>Interactivity Index</span>
                            </div>
                            <div style="font-size:0.76rem;color:var(--text-muted);" id="ds-interactivity-lbl"></div>
                        </div>
                        <div class="ds-stats-ratio-bar" id="ds-ratio-bar">
                            <div class="ds-stats-ratio-interactive" id="ds-ratio-int"></div>
                            <div class="ds-stats-ratio-passive" id="ds-ratio-pas"></div>
                        </div>
                    </div>

                    <div class="ds-stats-section">
                        <div class="ds-stats-section-title">
                            <i class="ph-bold ph-chart-pie-slice ds-glow-emerald"></i><span>Widget Type Distribution</span>
                        </div>
                        <div id="ds-donut-container"></div>
                    </div>

                    <!-- Widget Version & Module Registry -->
                    <div class="ds-stats-section">
                        <div class="ds-stats-section-title" style="justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
                            <div style="display:flex; align-items:center; gap:0.5rem;">
                                <i class="ph-bold ph-cube ds-glow-cyan"></i><span>Widget Version &amp; Module Registry</span>
                            </div>
                            <div style="font-size:0.75rem; color:var(--text-muted);" id="ds-widget-registry-count"></div>
                        </div>
                        <div class="ds-stats-widget-table-wrap">
                            <table class="ds-stats-table ds-stats-widget-table" id="ds-widget-registry-table">
                                <thead>
                                    <tr>
                                        <th>Widget</th>
                                        <th>Type</th>
                                        <th>Category</th>
                                        <th>Version</th>
                                        <th>Date</th>
                                        <th style="text-align:right;">Canvas Usage</th>
                                        <th style="text-align:center;width:75px;">History</th>
                                    </tr>
                                </thead>
                                <tbody id="ds-widget-registry-tbody"></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Tab 5: Live Telemetry (Oscilloscope with X/Y Axes) -->
                <div class="ds-stats-tab-pane" id="ds-tab-telemetry">
                    <div class="ds-stats-section">
                        <div class="ds-stats-telemetry-header">
                            <div class="ds-stats-section-title" style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                                <div style="display:flex;align-items:center;gap:0.5rem;">
                                    <i class="ph-bold ph-wave-sine ds-glow-emerald"></i><span>Real-Time Ingestion Rate</span>
                                </div>
                                <span style="font-size:0.74rem;color:var(--text-muted);font-weight:400;">5-Minute Rolling Window • 1s Sample Interval</span>
                            </div>
                            <div class="ds-stats-telemetry-rate-badge">
                                <span class="ds-stats-telemetry-rate-num" id="ds-rate-readout">0.0</span>
                                <span class="ds-stats-telemetry-rate-unit">Msg / sec</span>
                            </div>
                        </div>
                        <div class="ds-stats-canvas-wrap">
                            <canvas id="ds-sparkline-canvas"></canvas>
                        </div>
                    </div>
                    <div class="ds-stats-section">
                        <div class="ds-stats-telemetry-header">
                            <div class="ds-stats-section-title" style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                                <div style="display:flex;align-items:center;gap:0.5rem;">
                                    <i class="ph-bold ph-chart-line ds-glow-cyan"></i><span>Data Throughput</span>
                                </div>
                                <span style="font-size:0.74rem;color:var(--text-muted);font-weight:400;">Bytes in each changed topic value • 5-Minute Rolling Window</span>
                            </div>
                            <div class="ds-stats-telemetry-rate-badge">
                                <span class="ds-stats-telemetry-rate-num is-bytes" id="ds-byte-readout">0</span>
                                <span class="ds-stats-telemetry-rate-unit" id="ds-byte-unit">B / sec</span>
                            </div>
                        </div>
                        <div class="ds-stats-canvas-wrap">
                            <canvas id="ds-byte-canvas"></canvas>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:1rem;">
                        <div class="ds-stats-section">
                            <div class="ds-stats-section-title">
                                <i class="ph-bold ph-fire ds-glow-amber"></i><span>Busiest Topics (Session Leaderboard)</span>
                            </div>
                            <div class="ds-stats-leaderboard" id="ds-leaderboard"></div>
                        </div>
                        <div class="ds-stats-section">
                            <div class="ds-stats-section-title">
                                <i class="ph-bold ph-database ds-glow-cyan"></i><span>Biggest Topics (Session Leaderboard)</span>
                            </div>
                            <div class="ds-stats-leaderboard" id="ds-bytes-leaderboard"></div>
                        </div>
                        <div class="ds-stats-section">
                            <div class="ds-stats-section-title" style="justify-content:space-between;">
                                <div style="display:flex;align-items:center;gap:0.5rem;">
                                    <i class="ph-bold ph-broadcast ds-glow-cyan"></i><span>Live Stream Inspector</span>
                                </div>
                                <button type="button" class="btn-tool" id="ds-feed-pause-btn" style="padding:0.2rem 0.5rem;font-size:0.75rem;">Pause</button>
                            </div>
                            <div class="ds-stats-feed" id="ds-live-feed"></div>
                        </div>
                    </div>
                </div>

                <!-- Tab 6: Diagnostics -->
                <div class="ds-stats-tab-pane" id="ds-tab-diagnostics">
                    <div class="ds-stats-diag-grid">
                        <div class="ds-stats-section">
                            <div class="ds-stats-section-title">
                                <i class="ph-bold ph-laptop ds-glow-violet"></i><span>Client &amp; Operating System</span>
                            </div>
                            <table class="ds-stats-table" id="ds-os-table"></table>
                        </div>
                        <div class="ds-stats-section">
                            <div class="ds-stats-section-title">
                                <i class="ph-bold ph-plugs ds-glow-rose"></i><span>Data Driver &amp; Transport</span>
                            </div>
                            <table class="ds-stats-table" id="ds-driver-table"></table>
                        </div>
                    </div>
                    <div class="ds-stats-section" style="margin-top: 1rem;">
                        <div class="ds-stats-section-title" style="display:flex;align-items:center;justify-content:space-between;width:100%;flex-wrap:wrap;gap:0.5rem;">
                            <div style="display:flex;align-items:center;gap:0.5rem;">
                                <i class="ph-bold ph-terminal-window ds-glow-amber"></i><span>Session Console Output</span>
                                <span class="ds-stats-pill" id="ds-console-count-pill" style="font-size:0.72rem;padding:2px 8px;">0 entries</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.4rem;">
                                <button type="button" class="ds-stats-btn ds-stats-btn-secondary ds-stats-btn-sm" id="ds-console-copy-btn" title="Copy console output to clipboard">
                                    <i class="ph-bold ph-copy"></i><span>Copy Log</span>
                                </button>
                                <button type="button" class="ds-stats-btn ds-stats-btn-secondary ds-stats-btn-sm" id="ds-console-clear-btn" title="Clear console buffer">
                                    <i class="ph-bold ph-trash"></i><span>Clear</span>
                                </button>
                            </div>
                        </div>
                        <div class="ds-console-toolbar">
                            <div class="ds-console-search-wrap">
                                <i class="ph-bold ph-magnifying-glass"></i>
                                <input type="text" id="ds-console-search" class="ds-console-search-input" placeholder="Filter console logs (e.g. error, homey, widget)..." autocomplete="off" />
                            </div>
                            <div class="ds-console-level-filters" id="ds-console-level-filters">
                                <button type="button" class="ds-console-filter-btn is-active" data-level="all">All</button>
                                <button type="button" class="ds-console-filter-btn" data-level="error">Errors</button>
                                <button type="button" class="ds-console-filter-btn" data-level="warn">Warnings</button>
                                <button type="button" class="ds-console-filter-btn" data-level="info_log">Info &amp; Log</button>
                            </div>
                        </div>
                        <div class="ds-console-viewer" id="ds-console-viewer"></div>
                    </div>
                    <div class="ds-stats-section">
                        <div class="ds-stats-section-title">
                            <i class="ph-bold ph-export ds-glow-cyan"></i><span>Export &amp; Share Diagnostics</span>
                        </div>
                        <p style="font-size:0.8rem;color:var(--text-secondary);margin:0;">
                            Generate a comprehensive, sanitized summary of this dashboard's architecture, hardware environment, and bus metrics. Passwords and tokens are automatically redacted so it is safe to paste directly into the Homey Community Forum or GitHub issue.
                        </p>
                        <div class="ds-stats-action-row">
                            <button type="button" class="ds-stats-btn ds-stats-btn-primary" id="ds-btn-copy-debug">
                                <i class="ph-bold ph-copy"></i><span>Copy Debug Report</span>
                            </button>
                            <button type="button" class="ds-stats-btn ds-stats-btn-secondary" id="ds-btn-download-json">
                                <i class="ph-bold ph-download-simple"></i><span>Download Diagnostics JSON</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        // Bind Tab Switching
        body.querySelectorAll('.ds-stats-tab-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const target = btn.getAttribute('data-tab');
                switchTab(target);
            });
        });

        // Wire Refresh Values and Reset Values buttons
        const refreshBtn = body.querySelector('#ds-topic-refresh-btn');
        if (refreshBtn) {
            refreshBtn.onclick = function () {
                requestLatestValues();
            };
        }

        const resetBtn = body.querySelector('#ds-topic-reset-btn');
        if (resetBtn) {
            resetBtn.onclick = function () {
                resetLiveValues();
            };
        }

        const changelogNewOnlyCb = body.querySelector('#ds-stats-changelog-new-only');
        if (changelogNewOnlyCb) {
            changelogNewOnlyCb.checked = changelogOnlyNew;
            changelogNewOnlyCb.onchange = function () {
                changelogOnlyNew = !!this.checked;
                const container = document.getElementById('ds-stats-changelog-timeline');
                if (container && changelogData) {
                    renderChangelogTimeline(container, changelogData);
                }
            };
        }

        // Populate Static / Initial Analytics
        updateStaticViews();
    }

    /**
     * Renders the interactive Topic Explorer List with guaranteed height and no flex-shrink.
     */
    function renderTopicExplorer(stats, filterCategory, searchQuery) {
        const list = document.getElementById('ds-topic-list');
        if (!list) return;

        filterCategory = filterCategory || 'all';
        searchQuery = (searchQuery || '').trim().toLowerCase();

        // Build list of all distinct topics across bound and live
        const allTopicsMap = {};

        // Active bound
        stats.activeBoundTopics.forEach(function (t) {
            allTopicsMap[t] = {
                topic: t,
                status: 'active',
                widgets: stats.topicToWidgetsMap[t] || [],
                val: stats.liveData[t]
            };
        });

        // Waiting bound
        stats.waitingBoundTopics.forEach(function (t) {
            allTopicsMap[t] = {
                topic: t,
                status: 'waiting',
                widgets: stats.topicToWidgetsMap[t] || [],
                val: undefined
            };
        });

        // Ghost / Unused
        stats.ghostTopics.forEach(function (t) {
            allTopicsMap[t] = {
                topic: t,
                status: 'unused',
                widgets: [],
                val: stats.liveData[t]
            };
        });

        let topicKeys = Object.keys(allTopicsMap);

        // Update counts
        const cntAll = document.getElementById('ds-cnt-all');
        const cntActive = document.getElementById('ds-cnt-active');
        const cntWaiting = document.getElementById('ds-cnt-waiting');
        const cntUnused = document.getElementById('ds-cnt-unused');
        if (cntAll) cntAll.textContent = String(topicKeys.length);
        if (cntActive) cntActive.textContent = String(stats.activeBoundTopics.length);
        if (cntWaiting) cntWaiting.textContent = String(stats.waitingBoundTopics.length);
        if (cntUnused) cntUnused.textContent = String(stats.ghostTopics.length);

        // Filter by category
        if (filterCategory === 'active') {
            topicKeys = topicKeys.filter(function (k) { return allTopicsMap[k].status === 'active'; });
        } else if (filterCategory === 'waiting') {
            topicKeys = topicKeys.filter(function (k) { return allTopicsMap[k].status === 'waiting'; });
        } else if (filterCategory === 'unused') {
            topicKeys = topicKeys.filter(function (k) { return allTopicsMap[k].status === 'unused'; });
        }

        // Filter by search query
        if (searchQuery.length > 0) {
            topicKeys = topicKeys.filter(function (k) {
                return k.toLowerCase().includes(searchQuery);
            });
        }

        // Sort: active first, then waiting, then unused, then alphabetical
        const statusOrder = { active: 1, waiting: 2, unused: 3 };
        topicKeys.sort(function (a, b) {
            const diff = statusOrder[allTopicsMap[a].status] - statusOrder[allTopicsMap[b].status];
            if (diff !== 0) return diff;
            return a.localeCompare(b);
        });

        if (topicKeys.length === 0) {
            list.innerHTML = '<div style="font-size:0.8rem;color:var(--text-muted);padding:1rem;text-align:center;">No topics match the selected filter.</div>';
            return;
        }

        const emptyMsg = list.querySelector(':scope > div:not(.ds-stats-topic-card)');
        if (emptyMsg) emptyMsg.remove();

        // Index existing cards in DOM by topic for in-place reconciliation
        const existingCards = {};
        list.querySelectorAll('.ds-stats-topic-card').forEach(function (card) {
            const t = card.getAttribute('data-topic');
            if (t) existingCards[t] = card;
        });

        const seenKeys = new Set(topicKeys);
        Object.keys(existingCards).forEach(function (t) {
            if (!seenKeys.has(t)) {
                existingCards[t].remove();
                delete existingCards[t];
            }
        });

        topicKeys.forEach(function (topic, idx) {
            const info = allTopicsMap[topic];
            let card = existingCards[topic];
            const dotClass = info.status === 'active' ? 'is-active' : (info.status === 'waiting' ? 'is-waiting' : 'is-ghost');
            const rawPreview = info.val !== undefined ? formatPayload(info.val, 65) : 'no data';
            const safePreview = escapeHtml(rawPreview);
            const safeTopic = escapeHtml(topic);
            const widgetCount = info.widgets.length;

            if (card) {
                card._latestInfo = info;

                const dot = card.querySelector('.ds-stats-topic-dot');
                if (dot) {
                    const expectedDotClass = 'ds-stats-topic-dot ' + dotClass;
                    if (dot.className !== expectedDotClass) {
                        dot.className = expectedDotClass;
                    }
                    const expectedTitle = info.status.toUpperCase();
                    if (dot.title !== expectedTitle) {
                        dot.title = expectedTitle;
                    }
                }

                const valChip = card.querySelector('.ds-stats-topic-val-chip');
                if (valChip && valChip.textContent !== rawPreview) {
                    valChip.textContent = rawPreview;
                    valChip.title = rawPreview;
                }

                const copyValBtn = card.querySelector('.ds-copy-val-btn');
                if (copyValBtn) {
                    const shouldDisable = info.val === undefined;
                    if (copyValBtn.disabled !== shouldDisable) {
                        copyValBtn.disabled = shouldDisable;
                        copyValBtn.title = shouldDisable ? 'No value received yet' : 'Copy Raw Value';
                    }
                }

                const oldBadge = card.querySelector('.ds-stats-topic-meta-badge');
                if (oldBadge) {
                    const isUsed = widgetCount > 0;
                    const expectedBadgeClass = isUsed ? 'ds-stats-topic-meta-badge is-used' : 'ds-stats-topic-meta-badge is-unused';
                    if (oldBadge.className !== expectedBadgeClass) {
                        oldBadge.className = expectedBadgeClass;
                    }
                    let expectedBadgeHtml = '';
                    if (widgetCount > 0) {
                        const uniquePages = Array.from(new Set(info.widgets.map(function (w) { return w.targetPage; }))).sort(function (a, b) { return a - b; });
                        expectedBadgeHtml = `<i class="ph-bold ph-link"></i> ${widgetCount} widget${widgetCount === 1 ? '' : 's'} (P${uniquePages.join(', P')})`;
                    } else {
                        expectedBadgeHtml = `<i class="ph-bold ph-ghost"></i> Unused on canvas`;
                    }
                    if (oldBadge.innerHTML !== expectedBadgeHtml) {
                        oldBadge.innerHTML = expectedBadgeHtml;
                    }
                }
            } else {
                card = document.createElement('div');
                card.className = 'ds-stats-topic-card';
                card.setAttribute('data-topic', topic);
                card._latestInfo = info;

                let metaBadgeHtml = '';
                if (widgetCount > 0) {
                    const uniquePages = Array.from(new Set(info.widgets.map(function (w) { return w.targetPage; }))).sort(function (a, b) { return a - b; });
                    metaBadgeHtml = `<span class="ds-stats-topic-meta-badge is-used"><i class="ph-bold ph-link"></i> ${widgetCount} widget${widgetCount === 1 ? '' : 's'} (P${uniquePages.join(', P')})</span>`;
                } else {
                    metaBadgeHtml = `<span class="ds-stats-topic-meta-badge is-unused"><i class="ph-bold ph-ghost"></i> Unused on canvas</span>`;
                }

                card.innerHTML = `
                    <div class="ds-stats-topic-row-header">
                        <div class="ds-stats-topic-dot ${dotClass}" title="${info.status.toUpperCase()}"></div>
                        <div class="ds-stats-topic-name-wrap">
                            <div class="ds-stats-topic-name" title="${safeTopic}">${safeTopic}</div>
                            <div class="ds-stats-topic-val-chip" title="${safePreview}">${safePreview}</div>
                        </div>
                        ${metaBadgeHtml}
                        <div class="ds-stats-topic-copy-actions">
                            <button type="button" class="ds-stats-topic-btn ds-copy-topic-btn" title="Copy Topic Name">
                                <i class="ph-bold ph-tag"></i>
                            </button>
                            <button type="button" class="ds-stats-topic-btn ds-copy-val-btn" title="${info.val !== undefined ? 'Copy Raw Value' : 'No value received yet'}" ${info.val === undefined ? 'disabled' : ''}>
                                <i class="ph-bold ph-brackets-curly"></i>
                            </button>
                        </div>
                        <i class="ph-bold ph-caret-right ds-stats-topic-chevron"></i>
                    </div>
                    <div class="ds-stats-topic-drawer"></div>
                `;

                const header = card.querySelector('.ds-stats-topic-row-header');
                const drawer = card.querySelector('.ds-stats-topic-drawer');

                const btnCopyTopic = card.querySelector('.ds-copy-topic-btn');
                if (btnCopyTopic) {
                    btnCopyTopic.onclick = function (e) {
                        e.stopPropagation();
                        const currentTopic = card._latestInfo ? card._latestInfo.topic : topic;
                        copyToClipboard(currentTopic).then(function (ok) {
                            if (ok) {
                                btnCopyTopic.innerHTML = '<i class="ph-bold ph-check" style="color:#10b981;"></i>';
                                setTimeout(function () {
                                    btnCopyTopic.innerHTML = '<i class="ph-bold ph-tag"></i>';
                                }, 1000);
                                showToast('Topic name copied');
                            }
                        });
                    };
                }

                const btnCopyVal = card.querySelector('.ds-copy-val-btn');
                if (btnCopyVal) {
                    btnCopyVal.onclick = function (e) {
                        e.stopPropagation();
                        const currentVal = card._latestInfo ? card._latestInfo.val : info.val;
                        if (currentVal === undefined) return;
                        let rawStr = '';
                        if (typeof currentVal === 'object') {
                            try { rawStr = JSON.stringify(currentVal, null, 2); } catch (err) { rawStr = String(currentVal); }
                        } else {
                            rawStr = String(currentVal);
                        }
                        copyToClipboard(rawStr).then(function (ok) {
                            if (ok) {
                                btnCopyVal.innerHTML = '<i class="ph-bold ph-check" style="color:#10b981;"></i>';
                                setTimeout(function () {
                                    btnCopyVal.innerHTML = '<i class="ph-bold ph-brackets-curly"></i>';
                                }, 1000);
                                showToast('Topic value copied');
                            }
                        });
                    };
                }

                header.addEventListener('click', function () {
                    const isExpanded = card.classList.toggle('is-expanded');
                    if (isExpanded && drawer.childNodes.length === 0) {
                        populateTopicDrawer(drawer, card._latestInfo || info);
                    }
                });
            }

            if (list.children[idx] !== card) {
                list.insertBefore(card, list.children[idx] || null);
            }
        });
    }

    /**
     * Fills the expanded topic drawer with connected widgets or unused topic actions.
     */
    function populateTopicDrawer(drawer, info) {
        drawer.innerHTML = '';

        if (info.widgets.length === 0) {
            const emptyNotice = document.createElement('div');
            emptyNotice.style.display = 'flex';
            emptyNotice.style.alignItems = 'center';
            emptyNotice.style.justifyContent = 'space-between';
            emptyNotice.style.fontSize = '0.78rem';
            emptyNotice.style.color = 'var(--text-muted)';
            emptyNotice.innerHTML = `
                <span>Broadcasting live on data bus, but not used by any widget in this dashboard.</span>
                <button type="button" class="ds-stats-jump-btn" id="ds-copy-topic-${encodeURIComponent(info.topic)}">
                    <i class="ph-bold ph-copy"></i><span>Copy Topic Path</span>
                </button>
            `;
            const copyBtn = emptyNotice.querySelector('button');
            if (copyBtn) {
                copyBtn.onclick = function (e) {
                    e.stopPropagation();
                    copyToClipboard(info.topic).then(function () {
                        showToast('Topic copied to clipboard!');
                    });
                };
            }
            drawer.appendChild(emptyNotice);
            return;
        }

        info.widgets.forEach(function (w) {
            const item = document.createElement('div');
            item.className = 'ds-stats-widget-connection-card';
            item.innerHTML = `
                <div class="ds-stats-widget-connection-left">
                    <i class="ph-bold ${escapeHtml(w.icon)} ds-stats-widget-icon" style="color:var(--widget-color-${escapeHtml(w.type)}, var(--ds-accent-cyan));"></i>
                    <div>
                        <div class="ds-stats-widget-name">${escapeHtml(w.name)}</div>
                        <div style="font-size:0.7rem;color:var(--text-muted);display:flex;align-items:center;gap:0.35rem;margin-top:0.15rem;">
                            <span class="ds-widget-type-pill" style="--widget-color-local: var(--widget-color-${escapeHtml(w.type)}); font-size: 0.6rem; padding: 1px 4px;">${escapeHtml(w.type)}</span>
                            <span>•</span>
                            <span class="ds-stats-widget-role-tag">${escapeHtml(w.roles.join(', '))}</span>
                        </div>
                    </div>
                </div>
                <div class="ds-stats-widget-connection-right">
                    <span class="ds-stats-page-pill">Page ${w.targetPage}</span>
                    <button type="button" class="ds-stats-jump-btn" title="Jump to Page and select widget on canvas">
                        <i class="ph-bold ph-arrow-square-out"></i><span>Jump to Widget</span>
                    </button>
                </div>
            `;

            const jumpBtn = item.querySelector('.ds-stats-jump-btn');
            if (jumpBtn) {
                jumpBtn.onclick = function (e) {
                    e.stopPropagation();
                    if (typeof DialogHost !== 'undefined') {
                        DialogHost.close(HOST_ID);
                    }
                    if (typeof Dashboard !== 'undefined') {
                        if (w.targetPage && typeof Dashboard.updateGlobal === 'function') {
                            Dashboard.updateGlobal({ currentPage: w.targetPage });
                        }
                        if (w.id && typeof Dashboard.selectWidget === 'function') {
                            Dashboard.selectWidget(w.id);
                        }
                    }
                    showToast(`Navigated to ${w.name} on Page ${w.targetPage}`);
                };
            }

            drawer.appendChild(item);
        });
    }

    /**
     * Re-evaluates and updates Topic Intelligence spectrum bar, counts, and topic cards in real time.
     */
    function updateTopicIntelligenceRealtime() {
        const stats = analyzeDashboard();

        // 1. Update Spectrum Ratio Bar
        const specActive = document.getElementById('ds-spec-active');
        const specWaiting = document.getElementById('ds-spec-waiting');
        const specGhost = document.getElementById('ds-spec-ghost');
        const specLbl = document.getElementById('ds-topic-spectrum-lbl');

        const totalTrackedTopics = stats.activeBoundTopicsCount + stats.waitingBoundTopicsCount + stats.ghostTopicsCount;
        if (specActive && specWaiting && specGhost && totalTrackedTopics > 0) {
            const actPct = ((stats.activeBoundTopicsCount / totalTrackedTopics) * 100).toFixed(0);
            const waitPct = ((stats.waitingBoundTopicsCount / totalTrackedTopics) * 100).toFixed(0);
            const ghostPct = (100 - actPct - waitPct).toFixed(0);

            const actStr = actPct + '%';
            const waitStr = waitPct + '%';
            const ghostStr = ghostPct + '%';
            if (specActive.style.width !== actStr) specActive.style.width = actStr;
            if (specWaiting.style.width !== waitStr) specWaiting.style.width = waitStr;
            if (specGhost.style.width !== ghostStr) specGhost.style.width = ghostStr;

            if (specLbl) {
                const specText = `${actPct}% Active Bound (${stats.activeBoundTopicsCount}) • ${waitPct}% Waiting (${stats.waitingBoundTopicsCount}) • ${ghostPct}% Unused on Canvas (${stats.ghostTopicsCount})`;
                if (specLbl.textContent !== specText) specLbl.textContent = specText;
            }
        }

        // 2. Update KPI card for Data Topics (Card 3 in Overview)
        const kpiGrid = document.getElementById('ds-kpi-grid');
        if (kpiGrid) {
            const cards = kpiGrid.querySelectorAll('.ds-stats-card');
            if (cards.length >= 3) {
                const sub = cards[2].querySelector('.ds-stats-card-sub');
                if (sub) {
                    const subHtml = `<span>${stats.activeBoundTopicsCount} receiving data</span> • <span>${stats.liveTopicsCount} in bus</span>`;
                    if (sub.innerHTML !== subHtml) sub.innerHTML = subHtml;
                }
            }
        }

        // 3. Render Topic Explorer with preserved scroll position
        const list = document.getElementById('ds-topic-list');
        const prevScroll = list ? list.scrollTop : 0;
        renderTopicExplorer(stats, topicFilterState.filter, topicFilterState.query);
        if (list && list.scrollTop !== prevScroll) list.scrollTop = prevScroll;
    }

    const consoleFilterState = { level: 'all', query: '' };

    /**
     * Renders console log lines with filtering and auto-scroll.
     */
    function renderConsoleLogs() {
        const viewer = document.getElementById('ds-console-viewer');
        if (!viewer) return;

        const countPill = document.getElementById('ds-console-count-pill');
        const rawLogs = (typeof window !== 'undefined' && Array.isArray(window.DS_CONSOLE_BUFFER)) ? window.DS_CONSOLE_BUFFER : [];

        if (countPill) {
            countPill.textContent = rawLogs.length + (rawLogs.length === 1 ? ' entry' : ' entries');
        }

        const q = (consoleFilterState.query || '').trim().toLowerCase();
        const lvl = consoleFilterState.level;

        const filtered = rawLogs.filter(function (entry) {
            if (lvl === 'error' && entry.level !== 'error') return false;
            if (lvl === 'warn' && entry.level !== 'warn') return false;
            if (lvl === 'info_log' && entry.level !== 'info' && entry.level !== 'log') return false;
            if (q) {
                const haystack = ((entry.timestamp || '') + ' ' + (entry.level || '') + ' ' + (entry.text || '')).toLowerCase();
                if (haystack.indexOf(q) === -1) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            viewer.innerHTML = '<div class="ds-console-empty">' + (rawLogs.length === 0 ? 'No console output recorded yet.' : 'No entries matching filter.') + '</div>';
            return;
        }

        const isNearBottom = (viewer.scrollHeight - viewer.scrollTop - viewer.clientHeight) < 40;

        let html = '';
        for (let i = 0; i < filtered.length; i++) {
            const entry = filtered[i];
            const badgeCls = 'ds-console-badge-' + (entry.level || 'log');
            const badgeText = (entry.level || 'log').toUpperCase();
            html += '<div class="ds-console-line">' +
                '<span class="ds-console-time">' + escapeHtml(entry.timestamp || '') + '</span>' +
                '<span class="ds-console-badge ' + badgeCls + '">' + badgeText + '</span>' +
                '<span class="ds-console-msg">' + escapeHtml(entry.text || '') + '</span>' +
                '</div>';
        }
        viewer.innerHTML = html;

        if (isNearBottom) {
            viewer.scrollTop = viewer.scrollHeight;
        }
    }

    /**
     * Initializes listeners, search filter, copy, and clear buttons for the Console Viewer.
     */
    function initConsoleViewer() {
        renderConsoleLogs();

        const filterWrap = document.getElementById('ds-console-level-filters');
        if (filterWrap && !filterWrap._bound) {
            filterWrap._bound = true;
            filterWrap.querySelectorAll('.ds-console-filter-btn').forEach(function (btn) {
                btn.onclick = function () {
                    filterWrap.querySelectorAll('.ds-console-filter-btn').forEach(function (b) { b.classList.remove('is-active'); });
                    btn.classList.add('is-active');
                    consoleFilterState.level = btn.getAttribute('data-level');
                    renderConsoleLogs();
                };
            });
        }

        const searchInput = document.getElementById('ds-console-search');
        if (searchInput && !searchInput._bound) {
            searchInput._bound = true;
            searchInput.value = consoleFilterState.query;
            searchInput.oninput = function () {
                consoleFilterState.query = searchInput.value;
                renderConsoleLogs();
            };
        }

        const copyBtn = document.getElementById('ds-console-copy-btn');
        if (copyBtn && !copyBtn._bound) {
            copyBtn._bound = true;
            copyBtn.onclick = function () {
                const rawLogs = (typeof window !== 'undefined' && Array.isArray(window.DS_CONSOLE_BUFFER)) ? window.DS_CONSOLE_BUFFER : [];
                if (rawLogs.length === 0) {
                    showToast('Console buffer is empty');
                    return;
                }
                const lines = rawLogs.map(function (e) {
                    return '[' + (e.timestamp || '') + '] [' + (e.level || 'log').toUpperCase().padEnd(5, ' ') + '] ' + (e.text || '');
                });
                copyToClipboard(lines.join('\n')).then(function (ok) {
                    if (ok) showToast('📋 Console log copied (' + rawLogs.length + ' entries)');
                    else showToast('⚠️ Could not copy console log');
                });
            };
        }

        const clearBtn = document.getElementById('ds-console-clear-btn');
        if (clearBtn && !clearBtn._bound) {
            clearBtn._bound = true;
            clearBtn.onclick = function () {
                if (typeof window !== 'undefined' && Array.isArray(window.DS_CONSOLE_BUFFER)) {
                    window.DS_CONSOLE_BUFFER.length = 0;
                }
                renderConsoleLogs();
                showToast('Console buffer cleared');
            };
        }

        if (typeof window !== 'undefined') {
            window.DS_ON_CONSOLE_ENTRY = function () {
                const diagTab = document.getElementById('ds-tab-diagnostics');
                if (diagTab && diagTab.classList.contains('is-active')) {
                    renderConsoleLogs();
                }
            };
        }
    }

    /**
     * Populates all KPI cards, pages, donut chart, and diagnostics tables.
     */
    function updateStaticViews() {
        const stats = analyzeDashboard();
        const client = detectClientEnvironment();

        // 1. Overview 8 KPI Cards
        const kpiGrid = document.getElementById('ds-kpi-grid');
        if (kpiGrid) {
            kpiGrid.innerHTML = `
                <div class="ds-stats-card">
                    <div class="ds-stats-card-header">
                        <span>Total Widgets</span>
                        <i class="ph-bold ph-cube ds-stats-card-icon ds-glow-cyan"></i>
                    </div>
                    <div class="ds-stats-card-val">${stats.totalWidgets}</div>
                    <div class="ds-stats-card-sub">
                        <span>${stats.activeWidgets} active</span> • <span>${stats.deactivatedWidgets} off</span>
                    </div>
                </div>
                <div class="ds-stats-card">
                    <div class="ds-stats-card-header">
                        <span>Inferred Pages</span>
                        <i class="ph-bold ph-browsers ds-stats-card-icon ds-glow-emerald"></i>
                    </div>
                    <div class="ds-stats-card-val">${stats.activePagesCount} <span style="font-size:1.1rem;font-weight:500;opacity:0.6;">/ ${stats.totalPages}</span></div>
                    <div class="ds-stats-card-sub">
                        ${stats.emptyPagesCount > 0 ? `<span style="color:#f59e0b;">⚠️ ${stats.emptyPagesCount} empty page(s)</span>` : `<span>All pages populated</span>`}
                    </div>
                </div>
                <div class="ds-stats-card">
                    <div class="ds-stats-card-header">
                        <span>Data Topics</span>
                        <i class="ph-bold ph-git-fork ds-stats-card-icon ds-glow-amber"></i>
                    </div>
                    <div class="ds-stats-card-val">${stats.boundTopicsCount}</div>
                    <div class="ds-stats-card-sub">
                        <span>${stats.activeBoundTopicsCount} receiving data</span> • <span>${stats.liveTopicsCount} in bus</span>
                    </div>
                </div>
                <div class="ds-stats-card">
                    <div class="ds-stats-card-header">
                        <span>Canvas Blueprint</span>
                        <i class="ph-bold ph-aspect-ratio ds-stats-card-icon ds-glow-violet"></i>
                    </div>
                    <div class="ds-stats-card-val" style="font-size:1.45rem;padding-top:0.35rem;">${stats.canvasWidth}×${stats.canvasHeight}</div>
                    <div class="ds-stats-card-sub">
                        <span>${stats.layoutMode.toUpperCase()} mode</span> • <span>${stats.canvasAreaMegaPx} MP (${stats.aspectRatio})</span>
                    </div>
                </div>
                <div class="ds-stats-card">
                    <div class="ds-stats-card-header">
                        <span>Grid &amp; Snap</span>
                        <i class="ph-bold ph-grid-four ds-stats-card-icon ds-glow-cyan"></i>
                    </div>
                    <div class="ds-stats-card-val">${stats.gridSize}<span style="font-size:1rem;font-weight:500;opacity:0.6;">px</span></div>
                    <div class="ds-stats-card-sub">
                        <span>Snap: ${stats.gridSnap ? 'Enabled' : 'Disabled'}</span> • <span>Groups: ${stats.groupCount}</span>
                    </div>
                </div>
                <div class="ds-stats-card">
                    <div class="ds-stats-card-header">
                        <span>Surface Footprint</span>
                        <i class="ph-bold ph-chart-bar-horizontal ds-stats-card-icon ds-glow-emerald"></i>
                    </div>
                    <div class="ds-stats-card-val">${stats.coveragePct}<span style="font-size:1rem;font-weight:500;opacity:0.6;">%</span></div>
                    <div class="ds-stats-card-sub">
                        <span>Canvas area occupied by widgets</span>
                    </div>
                </div>
                <div class="ds-stats-card">
                    <div class="ds-stats-card-header">
                        <span>Data Driver</span>
                        <i class="ph-bold ph-plugs ds-stats-card-icon ds-glow-rose"></i>
                    </div>
                    <div class="ds-stats-card-val" style="font-size:1.4rem;padding-top:0.35rem;">${stats.driverType.toUpperCase()}</div>
                    <div class="ds-stats-card-sub">
                        <span style="color:${stats.isConnected ? '#34d399' : '#f87171'};font-weight:700;">${stats.isConnected ? '● Connected' : '○ Offline'}</span> • <span>${stats.driverTotalMsgs} msgs</span>
                    </div>
                </div>
                <div class="ds-stats-card">
                    <div class="ds-stats-card-header">
                        <span>Active Theme</span>
                        <i class="ph-bold ph-palette ds-stats-card-icon ds-glow-amber"></i>
                    </div>
                    <div class="ds-stats-card-val" style="font-size:1.35rem;padding-top:0.35rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${stats.themeName}">${stats.themeName}</div>
                    <div class="ds-stats-card-sub">
                        <span>UI Mode: ${document.body.classList.contains('ui-light') ? 'Light' : 'Dark'}</span>
                    </div>
                </div>
            `;
        }

        // 3. Page Density Grid (All Discovered Pages)
        const pageGrid = document.getElementById('ds-page-grid');
        const multiNote = document.getElementById('ds-multi-page-note');
        if (multiNote) {
            multiNote.textContent = stats.multiPageCount > 0 ? `${stats.multiPageCount} multi-page widget(s) spanning across pages` : '';
        }

        if (pageGrid) {
            pageGrid.innerHTML = '';
            const maxWidgets = Math.max(1, stats.maxPageWidgets || 1);
            const activeEditorPage = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.currentPage) ? parseInt(MASTER_SETTINGS.currentPage, 10) : 1;

            for (let p = 1; p <= stats.totalPages; p++) {
                const count = (stats.pageWidgetMap[p] || []).length;
                const pct = (count / maxWidgets) * 100;
                const isCurrent = p === activeEditorPage;

                const row = document.createElement('div');
                row.className = 'ds-stats-page-row';
                row.innerHTML = `
                    <div class="ds-stats-page-lbl">
                        <span>Page ${p}</span>
                        ${isCurrent ? '<span style="font-size:0.62rem;padding:0.1rem 0.35rem;border-radius:4px;background:#0284c7;color:#fff;">P' + p + '</span>' : ''}
                    </div>
                    <div class="ds-stats-bar-track">
                        <div class="ds-stats-bar-fill ${count === 0 ? 'is-empty' : ''}" style="width:${count === 0 ? '0%' : Math.max(4, pct) + '%'};"></div>
                    </div>
                    <div class="ds-stats-bar-val">
                        ${count > 0 ? `${count} widget${count === 1 ? '' : 's'}` : '<span style="color:#f59e0b;font-size:0.75rem;">Empty</span>'}
                    </div>
                `;
                pageGrid.appendChild(row);
            }
        }

        // 4. Topic Distribution Spectrum & Explorer (Reactive)
        updateTopicIntelligenceRealtime();

        const searchInput = document.getElementById('ds-topic-search-input');
        if (searchInput && !searchInput._bound) {
            searchInput._bound = true;
            searchInput.value = topicFilterState.query;
            searchInput.oninput = function () {
                topicFilterState.query = searchInput.value;
                updateTopicIntelligenceRealtime();
            };
        }

        document.querySelectorAll('.ds-stats-topic-pill-btn').forEach(function (pill) {
            if (pill.getAttribute('data-topic-filter') === topicFilterState.filter) {
                pill.classList.add('is-active');
            } else {
                pill.classList.remove('is-active');
            }
            if (!pill._bound) {
                pill._bound = true;
                pill.onclick = function () {
                    document.querySelectorAll('.ds-stats-topic-pill-btn').forEach(function (p) { p.classList.remove('is-active'); });
                    pill.classList.add('is-active');
                    topicFilterState.filter = pill.getAttribute('data-topic-filter');
                    updateTopicIntelligenceRealtime();
                };
            }
        });

        // 5. Interactivity Index on Widgets tab
        const ratioInt = document.getElementById('ds-ratio-int');
        const ratioPas = document.getElementById('ds-ratio-pas');
        const ratioLbl = document.getElementById('ds-interactivity-lbl');
        if (ratioInt && ratioPas) {
            const intPct = stats.totalWidgets > 0 ? ((stats.interactiveWidgetsCount / stats.totalWidgets) * 100).toFixed(0) : 50;
            const pasPct = stats.totalWidgets > 0 ? (100 - intPct) : 50;
            ratioInt.style.width = intPct + '%';
            ratioPas.style.width = pasPct + '%';
            if (ratioLbl) {
                ratioLbl.textContent = `${intPct}% Interactive Controls (${stats.interactiveWidgetsCount}) • ${pasPct}% Passive Indicators (${stats.passiveWidgetsCount})`;
            }
        }

        // 6. Donut Chart (Widget Type Distribution)
        const donutBox = document.getElementById('ds-donut-container');
        if (donutBox) {
            renderDonutChart(donutBox, stats.typeCounts, stats.totalWidgets);
        }

        // 6b. Widget Module Versions & Registry Table
        renderWidgetRegistryTable(stats);

        // 7. System & Client Environment Table on Diagnostics Tab
        const osTable = document.getElementById('ds-os-table');
        if (osTable) {
            osTable.innerHTML = `
                <tr><td>Operating System</td><td>${client.os}</td></tr>
                <tr><td>Browser &amp; Engine</td><td>${client.browser}</td></tr>
                <tr><td>Screen Resolution</td><td>${client.screenRes} (${client.colorDepth})</td></tr>
                <tr><td>Device Pixel Ratio</td><td>${client.dpr}x (HiDPI scale)</td></tr>
                <tr><td>Viewport Dimensions</td><td>${client.viewport}</td></tr>
                <tr><td>CPU Hardware</td><td>${client.cpuCores}</td></tr>
                <tr><td>Memory Usage (RAM)</td><td>${client.memoryUsage}</td></tr>
                <tr><td>Touch Support</td><td>${client.touchPoints > 0 ? 'Touch Screen (' + client.touchPoints + ' pts)' : 'Mouse / Desktop'}</td></tr>
                <tr><td>Color Scheme Pref</td><td>${client.colorScheme} Mode</td></tr>
            `;
        }

        const driverTable = document.getElementById('ds-driver-table');
        if (driverTable) {
            const uptimeMins = Math.floor(stats.driverUptimeSec / 60);
            const uptimeSecs = stats.driverUptimeSec % 60;
            driverTable.innerHTML = `
                <tr><td>Active Data Driver</td><td>${stats.driverType.toUpperCase()}</td></tr>
                <tr><td>Connection Status</td><td><span style="color:${stats.isConnected ? '#34d399' : '#f87171'};font-weight:700;">${stats.isConnected ? '● ONLINE' : '○ OFFLINE'}</span></td></tr>
                <tr><td>Connection Uptime</td><td>${uptimeMins}m ${uptimeSecs}s</td></tr>
                <tr><td>Bus Message Count</td><td>${stats.driverTotalMsgs.toLocaleString()}</td></tr>
                <tr><td>Active Bound Topics</td><td>${stats.activeBoundTopicsCount} topics</td></tr>
                <tr><td>Waiting for Data</td><td>${stats.waitingBoundTopicsCount} topics</td></tr>
                <tr><td>Ghost Topics in Bus</td><td>${stats.ghostTopicsCount} topics</td></tr>
                <tr><td>DOM Tree Size</td><td>${document.getElementsByTagName('*').length.toLocaleString()} elements</td></tr>
            `;
        }

        // 8. Bulletproof Export Actions
        const btnCopy = document.getElementById('ds-btn-copy-debug');
        if (btnCopy) {
            btnCopy.onclick = function () {
                const report = buildDebugReport(stats, client);
                copyToClipboard(report).then(function (success) {
                    if (success) {
                        showToast('📋 Debug Report copied to clipboard!');
                    } else {
                        showToast('⚠️ Could not copy automatically. Check console.');
                        console.log(report);
                    }
                });
            };
        }

        const btnDownload = document.getElementById('ds-btn-download-json');
        if (btnDownload) {
            btnDownload.onclick = function () {
                const payload = {
                    version: window.DASHBOARD_VERSION || '2.1.1',
                    generatedAt: new Date().toISOString(),
                    client: client,
                    stats: stats,
                    consoleLogs: (typeof window !== 'undefined' && Array.isArray(window.DS_CONSOLE_BUFFER)) ? window.DS_CONSOLE_BUFFER : []
                };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'dashboard-studio-diagnostics-' + Date.now() + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast('💾 Diagnostics JSON downloaded!');
            };
        }

        // 9. Session Console Log Viewer
        initConsoleViewer();
    }

    function formatAxisRate(n, kind) {
        if (kind === 'bytes') {
            if (n >= 1048576) return (n / 1048576).toFixed(1) + ' MB/s';
            if (n >= 1024) return (n / 1024).toFixed(1) + ' KB/s';
            return Math.round(n) + ' B/s';
        }
        if (n >= 100) return Math.round(n) + ' msg/s';
        return (Math.round(n * 10) / 10) + ' msg/s';
    }

    function formatReadout(n, kind) {
        if (kind === 'bytes') {
            if (n >= 1048576) return (n / 1048576).toFixed(2);
            if (n >= 1024) return (n / 1024).toFixed(1);
            return String(Math.round(n));
        }
        return n.toFixed(1);
    }

    function readoutUnit(n, kind) {
        if (kind !== 'bytes') return 'Msg / sec';
        if (n >= 1048576) return 'MB / sec';
        if (n >= 1024) return 'KB / sec';
        return 'B / sec';
    }

    /**
     * UTF-8 size of a topic value. Objects use their JSON text.
     */
    function payloadByteLength(payload) {
        if (payload == null) return 0;
        let str = '';
        if (typeof payload === 'string') str = payload;
        else if (typeof payload === 'number' || typeof payload === 'boolean') str = String(payload);
        else {
            try { str = JSON.stringify(payload); }
            catch (e) { return 0; }
        }
        if (!str) return 0;
        if (typeof TextEncoder !== 'undefined') {
            if (!payloadByteLength._encoder) payloadByteLength._encoder = new TextEncoder();
            return payloadByteLength._encoder.encode(str).length;
        }
        let bytes = 0;
        for (let i = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            if (c < 0x80) bytes += 1;
            else if (c < 0x800) bytes += 2;
            else if (c >= 0xD800 && c <= 0xDBFF) { bytes += 4; i++; }
            else bytes += 3;
        }
        return bytes;
    }

    /**
     * State snapshots and cache hydrates replay every topic. Count a value only when it
     * actually changes, so a resync does not draw a hundreds-of-messages spike.
     */
    function isChangedPayload(topic, payload) {
        if (typeof Dashboard === 'undefined' || !Dashboard.liveData) return true;
        if (!Object.prototype.hasOwnProperty.call(Dashboard.liveData, topic)) return true;
        if (typeof Dashboard._isSameLivePayload === 'function') {
            return !Dashboard._isSameLivePayload(Dashboard.liveData[topic], payload);
        }
        return Dashboard.liveData[topic] !== payload;
    }

    /**
     * Live Sparkline with X and Y axes. `kind` is 'msgs' or 'bytes'.
     */
    function renderRateChart(canvasId, history, kind, color) {
        if (!session) return;
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const cssWidth = rect.width || 800;
        const cssHeight = rect.height || 175;

        if (canvas.width !== Math.round(cssWidth * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
            canvas.width = Math.round(cssWidth * dpr);
            canvas.height = Math.round(cssHeight * dpr);
        }

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, cssWidth, cssHeight);

        const padLeft = kind === 'bytes' ? 84 : 72;
        const padRight = 24;
        const padTop = 18;
        const padBottom = 26;

        const plotW = Math.max(10, cssWidth - padLeft - padRight);
        const plotH = Math.max(10, cssHeight - padTop - padBottom);

        const isLightMode = (typeof document !== 'undefined') &&
            (document.body.classList.contains('ui-light') || document.documentElement.classList.contains('ui-light'));

        const chartColor = isLightMode ? (kind === 'bytes' ? '#0284c7' : '#059669') : color;
        const axisTextColor = isLightMode ? '#475569' : '#94a3b8';
        const gridColor = isLightMode ? 'rgba(100, 116, 139, 0.22)' : 'rgba(255, 255, 255, 0.07)';
        const minuteGridColor = isLightMode ? 'rgba(100, 116, 139, 0.14)' : 'rgba(255, 255, 255, 0.05)';

        const floor = kind === 'bytes' ? 64 : 5;
        const maxVal = Math.max(floor, Math.ceil(Math.max.apply(null, history) * 1.2));
        const midVal = maxVal / 2;

        ctx.font = '10px monospace';
        ctx.fillStyle = axisTextColor;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        ctx.fillText(formatAxisRate(maxVal, kind), padLeft - 8, padTop);
        ctx.fillText(formatAxisRate(midVal, kind), padLeft - 8, padTop + plotH / 2);
        ctx.fillText(formatAxisRate(0, kind), padLeft - 8, padTop + plotH);

        // Horizontal dashed grid lines
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        [padTop, padTop + plotH / 2, padTop + plotH].forEach(function (y) {
            ctx.beginPath();
            ctx.moveTo(padLeft, Math.round(y));
            ctx.lineTo(padLeft + plotW, Math.round(y));
            ctx.stroke();
        });

        // Vertical dashed grid lines for each minute (-4m, -3m, -2m, -1m)
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = minuteGridColor;
        [0.2, 0.4, 0.6, 0.8].forEach(function (pct) {
            const gx = padLeft + plotW * pct;
            ctx.beginPath();
            ctx.moveTo(Math.round(gx), padTop);
            ctx.lineTo(Math.round(gx), padTop + plotH);
            ctx.stroke();
        });

        // 2. Draw X-Axis timeline labels (5-minute rolling window)
        ctx.setLineDash([]);
        ctx.fillStyle = axisTextColor;
        ctx.textBaseline = 'top';

        ctx.textAlign = 'left';
        ctx.fillText('-5m', padLeft, padTop + plotH + 8);

        ctx.textAlign = 'center';
        ctx.fillText('-4m', padLeft + plotW * 0.2, padTop + plotH + 8);
        ctx.fillText('-3m', padLeft + plotW * 0.4, padTop + plotH + 8);
        ctx.fillText('-2m', padLeft + plotW * 0.6, padTop + plotH + 8);
        ctx.fillText('-1m', padLeft + plotW * 0.8, padTop + plotH + 8);

        ctx.textAlign = 'right';
        ctx.fillStyle = chartColor;
        ctx.fillText('● LIVE', padLeft + plotW, padTop + plotH + 8);

        if (history.length < 2) {
            ctx.restore();
            return;
        }

        // 3. Draw Ingestion Rate Curve
        const step = plotW / (history.length - 1);
        ctx.beginPath();
        let lastX = padLeft;
        let lastY = padTop + plotH;

        history.forEach(function (val, idx) {
            const x = padLeft + idx * step;
            const y = padTop + plotH - ((val / maxVal) * plotH);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            if (idx === history.length - 1) {
                lastX = x;
                lastY = y;
            }
        });

        // Glowing Line Style
        ctx.strokeStyle = chartColor;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = chartColor;
        ctx.shadowBlur = isLightMode ? 4 : 10;
        ctx.stroke();

        // Gradient Fill Under Curve
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.lineTo(padLeft + plotW, padTop + plotH);
        ctx.lineTo(padLeft, padTop + plotH);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
        if (isLightMode) {
            grad.addColorStop(0, kind === 'bytes' ? 'rgba(2, 132, 199, 0.22)' : 'rgba(5, 150, 105, 0.22)');
            grad.addColorStop(1, kind === 'bytes' ? 'rgba(2, 132, 199, 0.0)' : 'rgba(5, 150, 105, 0.0)');
        } else {
            grad.addColorStop(0, color === '#38bdf8' ? 'rgba(56, 189, 248, 0.28)' : 'rgba(52, 211, 153, 0.28)');
            grad.addColorStop(1, color === '#38bdf8' ? 'rgba(56, 189, 248, 0.0)' : 'rgba(52, 211, 153, 0.0)');
        }
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
        ctx.fillStyle = chartColor;
        ctx.shadowColor = chartColor;
        ctx.shadowBlur = isLightMode ? 4 : 8;
        ctx.fill();

        ctx.restore();
    }

    function renderTelemetryCharts() {
        if (!session) return;
        renderRateChart('ds-sparkline-canvas', session.rateHistory, 'msgs', '#34d399');
        renderRateChart('ds-byte-canvas', session.byteHistory, 'bytes', '#38bdf8');
    }

    /**
     * Intercepts live incoming messages while dialog is open.
     * Decoupled from synchronous DOM rendering to prevent UI thrashing.
     */
    function recordLiveMessage(topic, payload) {
        if (!session) return;
        if (!isChangedPayload(topic, payload)) return;
        const bytes = payloadByteLength(payload);
        session.incomingCount++;
        session.byteCount += bytes;
        session.topicFrequencies[topic] = (session.topicFrequencies[topic] || 0) + 1;
        session.topicBytes[topic] = (session.topicBytes[topic] || 0) + bytes;

        if (!session.feedPaused) {
            session.recentFeed.unshift({
                time: new Date().toLocaleTimeString(),
                topic: topic,
                payloadPreview: formatPayload(payload, 80),
                fullPayload: payload
            });
            if (session.recentFeed.length > 10) session.recentFeed.pop();
            session.dirtyFeed = true;
        }

        session.dirtyLeaderboard = true;
    }

    /**
     * Sanitizes, flattens newlines, and truncates payload previews into a clean single line.
     */
    function formatPayload(payload, maxLen) {
        if (payload === null || payload === undefined) return 'null';
        let str = '';
        if (typeof payload === 'object') {
            try { str = JSON.stringify(payload); }
            catch (e) { str = '[Object]'; }
        } else {
            str = String(payload);
        }
        str = str.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
        if (maxLen && str.length > maxLen) {
            str = str.slice(0, maxLen - 3) + '...';
        }
        return str;
    }

    function renderLeaderboard() {
        if (!session) return;
        const box = document.getElementById('ds-leaderboard');
        if (!box) return;

        const topics = Object.keys(session.topicFrequencies).sort(function (a, b) {
            return session.topicFrequencies[b] - session.topicFrequencies[a];
        }).slice(0, 7);

        if (topics.length === 0) {
            box.innerHTML = '<div style="font-size:0.78rem;color:var(--text-muted);padding:0.5rem 0;">Awaiting bus messages...</div>';
            return;
        }

        const emptyMsg = box.querySelector(':scope > div:not(.ds-stats-leaderboard-row)');
        if (emptyMsg) emptyMsg.remove();

        const existingRows = {};
        box.querySelectorAll('.ds-stats-leaderboard-row').forEach(function (row) {
            const t = row.getAttribute('data-topic');
            if (t) existingRows[t] = row;
        });

        const seenKeys = new Set(topics);
        Object.keys(existingRows).forEach(function (t) {
            if (!seenKeys.has(t)) {
                existingRows[t].remove();
                delete existingRows[t];
            }
        });

        topics.forEach(function (topic, idx) {
            const count = session.topicFrequencies[topic];
            let row = existingRows[topic];
            const safeTopic = escapeHtml(topic);
            const countStr = count.toLocaleString();
            const rankStr = '#' + (idx + 1);

            if (row) {
                const rankEl = row.querySelector('.ds-stats-rank-num');
                if (rankEl && rankEl.textContent !== rankStr) {
                    rankEl.textContent = rankStr;
                }
                const countEl = row.querySelector('.ds-stats-topic-count');
                if (countEl && countEl.textContent !== countStr) {
                    countEl.textContent = countStr;
                }
            } else {
                row = document.createElement('div');
                row.className = 'ds-stats-leaderboard-row';
                row.setAttribute('data-topic', topic);
                row.innerHTML = `
                    <div class="ds-stats-rank-num">${rankStr}</div>
                    <div class="ds-stats-topic-name" title="${safeTopic}">${safeTopic}</div>
                    <div class="ds-stats-topic-count">${countStr}</div>
                `;
            }
            if (box.children[idx] !== row) {
                box.insertBefore(row, box.children[idx] || null);
            }
        });
    }

    function formatByteSize(bytes) {
        if (!bytes || bytes <= 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    function renderBytesLeaderboard() {
        if (!session) return;
        const box = document.getElementById('ds-bytes-leaderboard');
        if (!box) return;

        const topics = Object.keys(session.topicBytes || {}).sort(function (a, b) {
            return (session.topicBytes[b] || 0) - (session.topicBytes[a] || 0);
        }).slice(0, 7);

        if (topics.length === 0) {
            box.innerHTML = '<div style="font-size:0.78rem;color:var(--text-muted);padding:0.5rem 0;">Awaiting bus messages...</div>';
            return;
        }

        const emptyMsg = box.querySelector(':scope > div:not(.ds-stats-leaderboard-row)');
        if (emptyMsg) emptyMsg.remove();

        const existingRows = {};
        box.querySelectorAll('.ds-stats-leaderboard-row').forEach(function (row) {
            const t = row.getAttribute('data-topic');
            if (t) existingRows[t] = row;
        });

        const seenKeys = new Set(topics);
        Object.keys(existingRows).forEach(function (t) {
            if (!seenKeys.has(t)) {
                existingRows[t].remove();
                delete existingRows[t];
            }
        });

        topics.forEach(function (topic, idx) {
            const bytes = session.topicBytes[topic] || 0;
            let row = existingRows[topic];
            const safeTopic = escapeHtml(topic);
            const byteStr = formatByteSize(bytes);
            const rankStr = '#' + (idx + 1);

            if (row) {
                const rankEl = row.querySelector('.ds-stats-rank-num');
                if (rankEl && rankEl.textContent !== rankStr) {
                    rankEl.textContent = rankStr;
                }
                const countEl = row.querySelector('.ds-stats-topic-count');
                if (countEl && countEl.textContent !== byteStr) {
                    countEl.textContent = byteStr;
                }
            } else {
                row = document.createElement('div');
                row.className = 'ds-stats-leaderboard-row';
                row.setAttribute('data-topic', topic);
                row.innerHTML = `
                    <div class="ds-stats-rank-num ds-stats-bytes-rank">${rankStr}</div>
                    <div class="ds-stats-topic-name" title="${safeTopic}">${safeTopic}</div>
                    <div class="ds-stats-topic-count" style="color:var(--ds-accent-cyan);font-family:var(--font-mono, monospace);">${byteStr}</div>
                `;
            }
            if (box.children[idx] !== row) {
                box.insertBefore(row, box.children[idx] || null);
            }
        });
    }

    function renderLiveFeed() {
        if (!session) return;
        const feed = document.getElementById('ds-live-feed');
        if (!feed) return;

        if (session.recentFeed.length === 0) {
            feed.innerHTML = '<div style="color:var(--text-muted);padding:0.5rem 0;">No messages received yet.</div>';
            return;
        }

        const emptyMsg = feed.querySelector(':scope > div:not(.ds-stats-feed-item)');
        if (emptyMsg) emptyMsg.remove();

        const existingItems = {};
        feed.querySelectorAll('.ds-stats-feed-item').forEach(function (itemEl) {
            const id = itemEl.getAttribute('data-feed-id');
            if (id) existingItems[id] = itemEl;
        });

        const feedKeys = session.recentFeed.map(function (item) {
            return (item.time || '') + '|' + (item.topic || '') + '|' + (item.payloadPreview || '');
        });
        const seenKeys = new Set(feedKeys);

        Object.keys(existingItems).forEach(function (id) {
            if (!seenKeys.has(id)) {
                existingItems[id].remove();
                delete existingItems[id];
            }
        });

        session.recentFeed.forEach(function (item, idx) {
            const id = feedKeys[idx];
            let row = existingItems[id];
            if (!row) {
                row = document.createElement('div');
                row.className = 'ds-stats-feed-item';
                row.setAttribute('data-feed-id', id);
                const safeTopic = escapeHtml(item.topic);
                const safePreview = escapeHtml(item.payloadPreview);
                row.innerHTML = `
                    <span class="ds-stats-feed-time">${item.time}</span>
                    <span class="ds-stats-feed-topic" title="${safeTopic}">${safeTopic}</span>
                    <span class="ds-stats-feed-payload" title="${safePreview}">${safePreview}</span>
                    <button type="button" class="ds-stats-feed-btn" title="Copy payload"><i class="ph-bold ph-copy"></i></button>
                `;
                const copyBtn = row.querySelector('.ds-stats-feed-btn');
                if (copyBtn) {
                    copyBtn.onclick = function () {
                        copyToClipboard(item.payloadPreview).then(function () {
                            showToast('Payload copied!');
                        });
                    };
                }
            }
            if (feed.children[idx] !== row) {
                feed.insertBefore(row, feed.children[idx] || null);
            }
        });
    }

    /**
     * Cleans up all active telemetry timers, observers, and unhooks dashboard callbacks.
     */
    function teardownSession() {
        if (!session) return;
        if (session.intervalHandle) {
            clearInterval(session.intervalHandle);
            session.intervalHandle = null;
        }
        if (session.resizeObserver) {
            session.resizeObserver.disconnect();
            session.resizeObserver = null;
        }
        if (session.resizeHandler) {
            window.removeEventListener('resize', session.resizeHandler);
            session.resizeHandler = null;
        }
        if (typeof Dashboard !== 'undefined') {
            if (session.origApplyLocal && Dashboard.applyLocalTopicPayload && Dashboard.applyLocalTopicPayload._isStatsWrapped) {
                Dashboard.applyLocalTopicPayload = session.origApplyLocal;
            }
            if (session.origApplyBatch && Dashboard.applyLocalTopicPayloadBatch && Dashboard.applyLocalTopicPayloadBatch._isStatsWrapped) {
                Dashboard.applyLocalTopicPayloadBatch = session.origApplyBatch;
            }
        }
        if (typeof window !== 'undefined') {
            window.DS_ON_CONSOLE_ENTRY = null;
        }
        session = null;
    }

    function isDialogOpen() {
        if (typeof DialogHost !== 'undefined' && typeof DialogHost.isOpen === 'function') {
            return DialogHost.isOpen(HOST_ID);
        }
        return false;
    }

    /**
     * Opens the Dashboard Statistics floating window.
     */
    function openDashboardStatisticsDialog(targetTab) {
        if (typeof DialogHost === 'undefined') {
            throw new Error('DialogHost unavailable');
        }

        if (isDialogOpen()) {
            if (targetTab) {
                switchTab(targetTab);
            } else {
                updateAboutVersionUI();
            }
            if (typeof DialogHost.bringToFront === 'function') {
                DialogHost.bringToFront(HOST_ID);
            }
            return;
        }

        // Clean teardown of any previous active session before initializing new one
        teardownSession();

        const currentDriverType = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.getType() : 'none';
        if (lastActiveDriverType !== null && lastActiveDriverType !== currentDriverType) {
            discoveredUnusedTopics.clear();
        }
        lastActiveDriverType = currentDriverType;

        ensureStylesInjected();

        // Initialize active session with 5-minute prefilled rolling buffer (300 seconds)
        session = {
            driverType: currentDriverType,
            startTime: Date.now(),
            incomingCount: 0,
            byteCount: 0,
            rateHistory: new Array(300).fill(0),
            byteHistory: new Array(300).fill(0),
            topicFrequencies: {},
            topicBytes: {},
            recentFeed: [],
            feedPaused: false,
            dirtyFeed: false,
            dirtyLeaderboard: false,
            dirtyTopicIntelligence: false,
            intervalHandle: null,
            resizeObserver: null,
            resizeHandler: null,
            origApplyLocal: null,
            origApplyBatch: null
        };

        // Temporary bus interception (safe idempotent wrap, only while open)
        if (typeof Dashboard !== 'undefined') {
            if (!Dashboard.applyLocalTopicPayload || !Dashboard.applyLocalTopicPayload._isStatsWrapped) {
                session.origApplyLocal = Dashboard.applyLocalTopicPayload;
                const wrappedLocal = function (topic, payload, driverInstance) {
                    recordLiveMessage(topic, payload);
                    let res;
                    if (session && session.origApplyLocal) {
                        res = session.origApplyLocal.apply(this, arguments);
                    }
                    if (session) {
                        session.dirtyTopicIntelligence = true;
                    }
                    return res;
                };
                wrappedLocal._isStatsWrapped = true;
                Dashboard.applyLocalTopicPayload = wrappedLocal;
            }

            if (!Dashboard.applyLocalTopicPayloadBatch || !Dashboard.applyLocalTopicPayloadBatch._isStatsWrapped) {
                session.origApplyBatch = Dashboard.applyLocalTopicPayloadBatch;
                const wrappedBatch = function (map, driverInstance) {
                    if (map && map.forEach) {
                        map.forEach(function (payload, topic) {
                            recordLiveMessage(topic, payload);
                        });
                    }
                    let res;
                    if (session && session.origApplyBatch) {
                        res = session.origApplyBatch.apply(this, arguments);
                    }
                    if (session) {
                        session.dirtyTopicIntelligence = true;
                        // On batch receipt (e.g. from Homey requestStateSync), update reactive views immediately
                        updateTopicIntelligenceRealtime();
                        session.dirtyTopicIntelligence = false;

                        const refreshBtn = document.getElementById('ds-topic-refresh-btn');
                        const icon = refreshBtn ? refreshBtn.querySelector('i') : null;
                        if (icon) icon.classList.remove('ph-spin');
                    }
                    return res;
                };
                wrappedBatch._isStatsWrapped = true;
                Dashboard.applyLocalTopicPayloadBatch = wrappedBatch;
            }
        }

        DialogHost.openFloating({
            id: HOST_ID,
            title: 'About & Dashboard Statistics',
            icon: 'ph-chart-pie-slice',
            className: 'ds-stats-dialog',
            defaultSize: { w: Math.min(1080, window.innerWidth * 0.92), h: Math.min(740, window.innerHeight * 0.88) },
            minSize: { w: 520, h: 380 },
            buildBody: function (body) {
                buildShell(body);
            },
            onOpen: function () {
                updateAboutVersionUI();
                if (targetTab) {
                    switchTab(targetTab);
                }

                // Pause button binding
                const pauseBtn = document.getElementById('ds-feed-pause-btn');
                if (pauseBtn) {
                    pauseBtn.onclick = function () {
                        if (!session) return;
                        session.feedPaused = !session.feedPaused;
                        pauseBtn.textContent = session.feedPaused ? 'Resume' : 'Pause';
                        pauseBtn.style.color = session.feedPaused ? '#f59e0b' : '';
                    };
                }

                // Setup ResizeObserver on canvas container for instant redraw during dragging / window resize
                const canvasWraps = document.querySelectorAll('.ds-stats-canvas-wrap');
                if (typeof ResizeObserver !== 'undefined' && canvasWraps.length) {
                    session.resizeObserver = new ResizeObserver(function () {
                        if (session) renderTelemetryCharts();
                    });
                    canvasWraps.forEach(function (wrap) { session.resizeObserver.observe(wrap); });
                } else {
                    session.resizeHandler = function () {
                        if (session) renderTelemetryCharts();
                    };
                    window.addEventListener('resize', session.resizeHandler);
                }

                // Periodic telemetry tick (every 1s)
                let lastCount = 0;
                let lastBytes = 0;
                session.intervalHandle = setInterval(function () {
                    if (!session) return;

                    const activeDriverType = (typeof DataDriverRegistry !== 'undefined') ? DataDriverRegistry.getType() : 'none';
                    if (session.driverType !== activeDriverType) {
                        session.driverType = activeDriverType;
                        lastActiveDriverType = activeDriverType;
                        discoveredUnusedTopics.clear();
                        session.topicFrequencies = {};
                        session.topicBytes = {};
                        session.recentFeed = [];
                        session.incomingCount = 0;
                        session.byteCount = 0;
                        lastCount = 0;
                        lastBytes = 0;
                        session.rateHistory = new Array(300).fill(0);
                        session.byteHistory = new Array(300).fill(0);
                        session.dirtyFeed = true;
                        session.dirtyLeaderboard = true;
                        session.dirtyTopicIntelligence = true;
                    }

                    let delta = 0;
                    if (session.incomingCount >= lastCount) {
                        delta = session.incomingCount - lastCount;
                    }
                    lastCount = session.incomingCount;
                    delta = Math.max(0, delta);

                    let byteDelta = 0;
                    if (session.byteCount >= lastBytes) {
                        byteDelta = session.byteCount - lastBytes;
                    }
                    lastBytes = session.byteCount;
                    byteDelta = Math.max(0, byteDelta);

                    session.rateHistory.push(delta);
                    if (session.rateHistory.length > 300) session.rateHistory.shift();
                    session.byteHistory.push(byteDelta);
                    if (session.byteHistory.length > 300) session.byteHistory.shift();

                    const readout = document.getElementById('ds-rate-readout');
                    if (readout) readout.textContent = formatReadout(delta, 'msgs');
                    const byteReadout = document.getElementById('ds-byte-readout');
                    const byteUnit = document.getElementById('ds-byte-unit');
                    if (byteReadout) byteReadout.textContent = formatReadout(byteDelta, 'bytes');
                    if (byteUnit) byteUnit.textContent = readoutUnit(byteDelta, 'bytes');

                    renderTelemetryCharts();

                    if (session.dirtyFeed) {
                        renderLiveFeed();
                        session.dirtyFeed = false;
                    }
                    if (session.dirtyLeaderboard) {
                        renderLeaderboard();
                        renderBytesLeaderboard();
                        session.dirtyLeaderboard = false;
                    }
                    if (session.dirtyTopicIntelligence) {
                        updateTopicIntelligenceRealtime();
                        session.dirtyTopicIntelligence = false;
                    }
                }, 1000);
            },
            onClose: function () {
                teardownSession();
                return true;
            }
        });
    }

    // Public API export
    window.DashboardStatistics = {
        open: function (targetTab) {
            return openDashboardStatisticsDialog(targetTab);
        },
        isOpen: isDialogOpen,
        close: function () {
            if (typeof DialogHost !== 'undefined' && typeof DialogHost.close === 'function') {
                DialogHost.close(HOST_ID);
            }
        },
        switchTab: switchTab
    };

    // Replace the catalog stub with the fully loaded implementation
    if (typeof ToolsRegistry !== 'undefined') {
        ToolsRegistry.register({
            id: 'dashboard-statistics',
            label: 'About & Dashboard Statistics',
            description: 'Over-the-top telemetry, live metrics, widget analytics, system specs, and about info.',
            icon: 'ph-chart-pie-slice',
            script: 'scripts/dashboard-statistics.js',
            run: function () {
                return DashboardStatistics.open();
            }
        });
    }
})();
