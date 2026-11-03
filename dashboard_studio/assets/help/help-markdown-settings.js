/**
 * Default universal typography/spacing for help markdown rendering.
 * Canonical editable copy lives in help/help-content.json → markdownSettings.
 * This object is used for merge fallbacks when keys are missing.
 */
window.HELP_MARKDOWN_SETTINGS_DEFAULTS = {
    topicTitle: {
        fontSize: '1.75rem',
        color: 'var(--ui-accent)',
        fontWeight: '600',
        fontStyle: 'normal',
        borderBottomWidth: '1px',
        borderBottomColor: 'var(--ui-border)',
        paddingBottom: '0.75rem',
        marginBottom: '1.5rem',
        letterSpacing: '0.05em',
        textTransform: 'none'
    },
    base: {
        fontSize: '1.05rem',
        lineHeight: '1.8',
        color: 'var(--ui-text-muted)',
        fontWeight: '400',
        fontStyle: 'normal'
    },
    lead: {
        fontSize: '1.1rem',
        lineHeight: '1.7',
        color: 'var(--ui-text)',
        fontWeight: '400',
        fontStyle: 'normal',
        marginTop: '0',
        marginBottom: '1.5rem',
        background: 'var(--ui-wrapper-bg)',
        borderRadius: '8px',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        borderLeftWidth: '4px',
        borderLeftColor: 'var(--ui-accent)'
    },
    paragraph: {
        fontSize: 'inherit',
        lineHeight: 'inherit',
        color: 'inherit',
        fontWeight: '400',
        fontStyle: 'normal',
        marginTop: '0',
        marginBottom: '1.25rem'
    },
    grid: {
        gap: '1.25rem',
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        btnSize: '42px',
        btnRadius: '8px',
        btnBg: 'var(--ui-tool-bg)',
        btnBorderWidth: '1px',
        btnBorderColor: 'var(--ui-border)',
        btnColor: 'var(--ui-accent)',
        btnIconSize: '1.25rem'
    },
        heading1: {
        fontSize: '2rem',
        lineHeight: '1.3',
        color: 'var(--ui-text)',
        fontWeight: '800',
        fontStyle: 'normal',
        marginTop: '3rem',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottomWidth: '1px',
        borderBottomColor: 'var(--ui-border)',
        letterSpacing: '-0.02em'
    },
    heading2: {
        fontSize: '1.5rem',
        lineHeight: '1.35',
        color: 'var(--ui-text)',
        fontWeight: '700',
        fontStyle: 'normal',
        marginTop: '2.5rem',
        marginBottom: '1.25rem',
        paddingBottom: '0.5rem',
        borderBottomWidth: '0',
        borderBottomColor: 'transparent',
        letterSpacing: '-0.01em'
    },
    heading3: {
        fontSize: '1.35rem',
        lineHeight: '1.4',
        color: 'var(--ui-text)',
        fontWeight: '700',
        fontStyle: 'normal',
        marginTop: '2.5rem',
        marginBottom: '1rem',
        paddingLeft: '0',
        paddingBottom: '0.5rem',
        borderLeftWidth: '0',
        borderLeftColor: 'transparent',
        borderBottomWidth: '3px',
        borderBottomColor: 'var(--ui-accent)',
        letterSpacing: 'normal'
    },
    heading4: {
        fontSize: '1.1rem',
        lineHeight: '1.45',
        color: 'var(--ui-text-muted)',
        fontWeight: '600',
        fontStyle: 'normal',
        marginTop: '1.5rem',
        marginBottom: '0.5rem',
        letterSpacing: '0.08em'
    },
    heading5: {
        fontSize: '1rem',
        lineHeight: '1.45',
        color: 'var(--ui-text)',
        fontWeight: '600',
        fontStyle: 'normal',
        marginTop: '1.25rem',
        marginBottom: '0.5rem'
    },
    heading6: {
        fontSize: '0.95rem',
        lineHeight: '1.45',
        color: 'var(--ui-text-muted)',
        fontWeight: '600',
        fontStyle: 'normal',
        marginTop: '1rem',
        marginBottom: '0.5rem'
    },
    strong: {
        fontWeight: '700',
        fontStyle: 'normal',
        color: 'inherit'
    },
    em: {
        fontWeight: 'inherit',
        fontStyle: 'italic',
        color: 'inherit'
    },
    link: {
        fontSize: 'inherit',
        fontWeight: '700',
        fontStyle: 'normal',
        color: 'var(--ui-accent)',
        textDecoration: 'none'
    },
    list: {
        fontSize: 'inherit',
        lineHeight: 'inherit',
        marginTop: '0',
        marginBottom: '1.5rem',
        paddingLeft: '1.5rem'
    },
    listItem: {
        fontSize: 'inherit',
        lineHeight: 'inherit',
        marginTop: '0',
        marginBottom: '0.65rem'
    },
    nestedList: {
        marginTop: '0.35rem',
        marginBottom: '0.35rem'
    },
    inlineCode: {
        fontSize: '0.9em',
        lineHeight: '1.5',
        fontWeight: '400',
        fontStyle: 'normal',
        color: 'var(--ui-accent)',
        background: 'var(--ui-tool-bg)',
        borderRadius: '6px',
        paddingTop: '0.2rem',
        paddingBottom: '0.2rem',
        paddingLeft: '0.4rem',
        paddingRight: '0.4rem'
    },
    codeBlock: {
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        background: 'var(--ui-tool-bg)',
        borderWidth: '1px',
        borderColor: 'var(--ui-border)',
        borderRadius: '8px'
    },
    codeBlockHeader: {
        fontSize: '0.75rem',
        lineHeight: '1.4',
        fontWeight: '700',
        fontStyle: 'normal',
        color: 'var(--ui-text-muted)',
        letterSpacing: '0.05em',
        paddingTop: '0.5rem',
        paddingBottom: '0.5rem',
        paddingLeft: '1rem',
        paddingRight: '1rem'
    },
    codeBlockBody: {
        fontSize: '0.95em',
        lineHeight: '1.6',
        fontWeight: '400',
        fontStyle: 'normal',
        color: 'var(--ui-accent)',
        paddingTop: '1.25rem',
        paddingBottom: '1.25rem',
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem'
    },
    codeBlockDescription: {
        fontSize: '0.85rem',
        lineHeight: '1.5',
        fontWeight: '400',
        fontStyle: 'italic',
        color: 'var(--ui-text-muted)',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem'
    },
    table: {
        fontSize: '0.95rem',
        lineHeight: '1.5',
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        borderRadius: '8px',
        borderWidth: '1px',
        borderColor: 'var(--ui-border)'
    },
    tableHeader: {
        fontSize: '0.75rem',
        lineHeight: '1.4',
        fontWeight: '700',
        fontStyle: 'normal',
        color: 'var(--ui-text-muted)',
        letterSpacing: '0.05em',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        paddingLeft: '1rem',
        paddingRight: '1rem'
    },
    tableCell: {
        fontSize: 'inherit',
        lineHeight: 'inherit',
        fontWeight: '400',
        fontStyle: 'normal',
        color: 'inherit',
        paddingTop: '1.25rem',
        paddingBottom: '1.25rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        borderBottomWidth: '1px',
        borderBottomColor: 'var(--ui-border)'
    },
    horizontalRule: {
        marginTop: '2rem',
        marginBottom: '2rem'
    },
    blockquote: {
        fontSize: 'inherit',
        lineHeight: 'inherit',
        fontWeight: '400',
        fontStyle: 'italic',
        color: 'var(--ui-text-muted)',
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        background: 'var(--ui-tool-bg)',
        borderLeftWidth: '4px',
        borderLeftColor: 'var(--ui-border)',
        borderRadius: '8px'
    },
    imageHeader: {
        marginTop: '0',
        marginBottom: '1.5rem'
    },
    imageContent: {
        marginTop: '2rem',
        marginBottom: '2rem'
    },
    alert: {
        fontSize: 'inherit',
        lineHeight: 'inherit',
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        paddingTop: '1.25rem',
        paddingBottom: '1.25rem',
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        gap: '1rem',
        background: 'rgba(6, 182, 212, 0.1)',
        borderRadius: '8px',
        borderLeftWidth: '4px',
        borderLeftColor: 'var(--ui-accent)'
    },
    alertWarning: {
        background: 'rgba(245, 158, 11, 0.08)',
        borderLeftColor: '#f59e0b'
    },
    alertIcon: {
        fontSize: '1.5rem',
        lineHeight: '1',
        marginTop: '2px'
    },
    details: {
        marginTop: '0',
        marginBottom: '1rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderWidth: '1px',
        borderColor: 'var(--ui-border)',
        borderRadius: '8px'
    },
    detailsSummary: {
        fontSize: 'inherit',
        lineHeight: 'inherit',
        fontWeight: '600',
        fontStyle: 'normal',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        gap: '0.75rem'
    },
    detailsContent: {
        fontSize: 'inherit',
        lineHeight: 'inherit',
        paddingTop: '1.5rem',
        paddingBottom: '1.5rem',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem'
    },
    badge: {
        fontSize: '0.6rem',
        lineHeight: '1.2',
        fontWeight: '600',
        fontStyle: 'normal',
        letterSpacing: '0.05em',
        paddingTop: '2px',
        paddingBottom: '2px',
        paddingLeft: '6px',
        paddingRight: '6px'
    },
    kbd: {
        fontSize: '0.85em',
        lineHeight: '1',
        fontWeight: '700',
        fontStyle: 'normal',
        paddingTop: '2px',
        paddingBottom: '2px',
        paddingLeft: '4px',
        paddingRight: '4px'
    },
    accessLegend: {
        fontSize: '0.88rem',
        lineHeight: '1.5',
        marginTop: '14px',
        marginBottom: '18px',
        gap: '10px'
    }
};
