/**
 * Widget preset selection model: schema-driven tree, multi-variant files, serialize.
 * Depends: Editor, BaseWidget, WidgetRegistry, MASTER_SETTINGS, Dashboard (type/exclusions).
 *
 * File shape:
 * {
 *   id, name, widgetType, version,
 *   variants: [ { id, name, settings }, ... ]
 * }
 */
window.WidgetPresetModel = {
    SKIP_FIELD_TYPES: {
        heading: true,
        spacer: true,
        widget_presets: true,
        theme_toolbar: true,
        widget_defaults_toolbar: true,
        driver_stats: true,
        topic_monitor: true,
        color_correction: true
    },

    BLOB_FIELD_TYPES: {
        menu_list: true,
        light_list: true,
        preset_grid: true,
        list: true,
        font_list: true,
        extra_output_topic_list: true,
        audio_topic_map: true,
        audio_trigger_map: true
    },

    EXCLUDED_TOP_KEYS: {
        metaName: true,
        locked: true,
        visible: true,
        page: true,
        zIndex: true,
        x: true,
        y: true,
        editorModeOverride: true,
        series: true,
        data: true
    },

    DEFAULT_VARIANT_NAME: 'default',

    cloneJson: function (value) {
        if (value === undefined) return undefined;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            return value;
        }
    },

    getExcludedTopKeys: function () {
        if (typeof Dashboard !== 'undefined' && Dashboard._widgetPresetExcludedKeys) {
            const out = {};
            Dashboard._widgetPresetExcludedKeys.forEach(function (k) { out[k] = true; });
            return out;
        }
        return this.EXCLUDED_TOP_KEYS;
    },

    /** Filesystem-safe id: spaces -> _, strip other punctuation. */
    slugify: function (raw, fallback) {
        let s = String(raw == null ? '' : raw).trim();
        s = s.replace(/\s+/g, '_');
        s = s.replace(/[^a-zA-Z0-9_-]/g, '');
        s = s.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
        if (!s) s = String(fallback || 'preset').replace(/[^a-zA-Z0-9_-]/g, '') || 'preset';
        return s;
    },

    uniqueSlug: function (base, existingIds) {
        const set = {};
        (existingIds || []).forEach(function (id) {
            if (id) set[String(id).toLowerCase()] = true;
        });
        let candidate = base || 'preset';
        let n = 2;
        while (set[candidate.toLowerCase()]) {
            candidate = base + '_' + n;
            n += 1;
        }
        return candidate;
    },

    /**
     * Next free display name. If "Kitchen" is taken, returns "Kitchen (1)", then (2), ...
     * A requested name that already ends in (n) is treated as the same family.
     */
    uniqueDisplayName: function (requested, existingNames, options) {
        options = options || {};
        const excluded = String(options.exclude || '').trim().toLowerCase();
        let base = String(requested || '').trim() || 'Preset';
        const suffixMatch = base.match(/^(.*)\s+\((\d+)\)$/);
        if (suffixMatch && suffixMatch[1].trim()) base = suffixMatch[1].trim();
        const taken = {};
        (existingNames || []).forEach(function (n) {
            const k = String(n || '').trim().toLowerCase();
            if (k && k !== excluded) taken[k] = true;
        });
        if (!taken[base.toLowerCase()]) return base;
        let n = 1;
        let candidate = base + ' (' + n + ')';
        while (taken[candidate.toLowerCase()]) {
            n += 1;
            candidate = base + ' (' + n + ')';
        }
        return candidate;
    },

    isDisplayNameTaken: function (name, existingNames, options) {
        options = options || {};
        const want = String(name || '').trim().toLowerCase();
        if (!want) return false;
        const excluded = String(options.exclude || '').trim().toLowerCase();
        return (existingNames || []).some(function (n) {
            const k = String(n || '').trim().toLowerCase();
            return !!k && k !== excluded && k === want;
        });
    },

    validateDisplayName: function (raw) {
        const name = String(raw == null ? '' : raw).trim();
        if (!name) return { ok: false, error: 'Name is required.' };
        if (name.indexOf('/') >= 0) return { ok: false, error: 'Name cannot contain "/".' };
        return { ok: true, name: name };
    },

    isDefaultVariantName: function (name) {
        return String(name || '').trim().toLowerCase() === this.DEFAULT_VARIANT_NAME;
    },

    findVariantIndexByName: function (preset, subName) {
        const variants = preset && Array.isArray(preset.variants) ? preset.variants : [];
        const want = String(subName || '').trim().toLowerCase();
        if (!want) return -1;
        for (let i = 0; i < variants.length; i++) {
            if (String(variants[i].name || '').trim().toLowerCase() === want) return i;
        }
        return -1;
    },

    findVariantIndexById: function (preset, variantId) {
        const variants = preset && Array.isArray(preset.variants) ? preset.variants : [];
        const want = String(variantId || '');
        for (let i = 0; i < variants.length; i++) {
            if (String(variants[i].id || '') === want) return i;
        }
        return -1;
    },

    /**
     * Normalize a multi-variant preset file. Requires variants[]; no legacy single-settings shape.
     */
    normalizePreset: function (raw, options) {
        options = options || {};
        if (!raw || typeof raw !== 'object') return null;
        if (!Array.isArray(raw.variants) || raw.variants.length === 0) return null;

        const widgetType = String(raw.widgetType || options.widgetType || '').trim();
        const version = String(raw.version || (typeof window !== 'undefined' && window.DASHBOARD_VERSION) || '2.0.0');
        const rawName = (typeof raw.name === 'string') ? raw.name.trim() : '';
        const id = this.slugify(raw.id || options.fileId || rawName || 'preset', 'preset');
        const name = rawName || id || 'Preset';

        const variants = raw.variants.map((v, i) => {
            const vName = String((v && v.name) || this.DEFAULT_VARIANT_NAME).trim() || this.DEFAULT_VARIANT_NAME;
            const vId = this.slugify((v && v.id) || vName, 'v' + i);
            const settings = (v && v.settings && typeof v.settings === 'object' && !Array.isArray(v.settings))
                ? this.cloneJson(v.settings)
                : {};
            return { id: vId, name: vName, settings: settings };
        });

        const seenIds = {};
        variants.forEach((v) => {
            let vid = v.id;
            if (seenIds[vid.toLowerCase()]) {
                vid = this.uniqueSlug(v.id, Object.keys(seenIds));
                v.id = vid;
            }
            seenIds[vid.toLowerCase()] = true;
        });

        return {
            id: id,
            name: name,
            widgetType: widgetType,
            version: version,
            variants: variants
        };
    },

    isMultiVariant: function (preset) {
        return !!(preset && Array.isArray(preset.variants) && preset.variants.length > 1);
    },

    getFieldPath: function (field) {
        if (!field || !field.key) return null;
        if (this.SKIP_FIELD_TYPES[field.type]) return null;
        const excluded = this.getExcludedTopKeys();

        if (field.typographyNested) {
            const tn = field.typographyNested;
            if (!tn.role || !tn.prop) return null;
            return ['typography', tn.role, tn.prop];
        }
        if (field.iconsNested) {
            const icn = field.iconsNested;
            if (!icn.root || !icn.slot || !icn.prop) return null;
            return [icn.root, icn.slot, icn.prop];
        }
        if (field.iconColorOverridesNested) {
            const io = field.iconColorOverridesNested;
            if (!io.slot || !io.prop) return null;
            return ['iconColorOverrides', io.slot, io.prop];
        }
        if (field.layoutNested) {
            const ln = field.layoutNested;
            if (!ln.prop) return null;
            return ['layout', 'responsive', ln.prop];
        }
        if (excluded[field.key]) return null;
        return [field.key];
    },

    pathKey: function (path) {
        return Array.isArray(path) ? path.join('.') : String(path || '');
    },

    getAtPath: function (obj, path) {
        if (!obj || !Array.isArray(path) || path.length === 0) return undefined;
        let cur = obj;
        for (let i = 0; i < path.length; i++) {
            if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
            if (!Object.prototype.hasOwnProperty.call(cur, path[i])) return undefined;
            cur = cur[path[i]];
        }
        return cur;
    },

    hasAtPath: function (obj, path) {
        if (!obj || !Array.isArray(path) || path.length === 0) return false;
        let cur = obj;
        for (let i = 0; i < path.length; i++) {
            if (cur === null || cur === undefined || typeof cur !== 'object') return false;
            if (!Object.prototype.hasOwnProperty.call(cur, path[i])) return false;
            cur = cur[path[i]];
        }
        return true;
    },

    setAtPath: function (obj, path, value) {
        if (!obj || !Array.isArray(path) || path.length === 0) return;
        let cur = obj;
        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            if (!cur[key] || typeof cur[key] !== 'object' || Array.isArray(cur[key])) {
                cur[key] = {};
            }
            cur = cur[key];
        }
        cur[path[path.length - 1]] = value;
    },

    /** Remove a leaf path; prune empty plain objects up the chain. */
    deleteAtPath: function (obj, path) {
        if (!obj || !Array.isArray(path) || path.length === 0) return false;
        const stack = [{ parent: obj, key: null }];
        let cur = obj;
        for (let i = 0; i < path.length - 1; i++) {
            if (cur === null || cur === undefined || typeof cur !== 'object') return false;
            if (!Object.prototype.hasOwnProperty.call(cur, path[i])) return false;
            stack.push({ parent: cur, key: path[i] });
            cur = cur[path[i]];
        }
        if (cur === null || cur === undefined || typeof cur !== 'object') return false;
        const last = path[path.length - 1];
        if (!Object.prototype.hasOwnProperty.call(cur, last)) return false;
        delete cur[last];
        for (let i = stack.length - 1; i >= 1; i--) {
            const frame = stack[i];
            const child = frame.parent[frame.key];
            if (!child || typeof child !== 'object' || Array.isArray(child)) break;
            if (Object.keys(child).length > 0) break;
            delete frame.parent[frame.key];
        }
        return true;
    },

    isFieldChanged: function (field, overrides) {
        const path = this.getFieldPath(field);
        if (!path) return false;
        if (path.length === 1) {
            const key = path[0];
            return !!(overrides && Object.prototype.hasOwnProperty.call(overrides, key)
                && overrides[key] !== null && overrides[key] !== undefined);
        }
        return this.hasAtPath(overrides, path);
    },

    /**
     * Effective value for a leaf: override if present, otherwise the same default chain
     * the inspector uses (including 0 / false). Used when a checked custom leaf must be
     * written into the preset even though it is not a blue-outline override.
     */
    resolveFieldValue: function (field, overrides, mergedValues) {
        const path = this.getFieldPath(field);
        if (!path) return undefined;
        if (this.hasAtPath(overrides, path)) {
            return this.cloneJson(this.getAtPath(overrides, path));
        }
        if (typeof Editor !== 'undefined' && typeof Editor._resolveInspectorFieldRawValue === 'function') {
            const raw = Editor._resolveInspectorFieldRawValue(
                field,
                mergedValues || {},
                overrides || {},
                false,
                mergedValues || {}
            );
            if (raw !== undefined && raw !== null) return this.cloneJson(raw);
        }
        if (path.length === 1 && mergedValues && mergedValues[path[0]] !== undefined
            && mergedValues[path[0]] !== null) {
            return this.cloneJson(mergedValues[path[0]]);
        }
        if (path.length > 1 && mergedValues) {
            const flatKey = field.key;
            if (flatKey && mergedValues[flatKey] !== undefined && mergedValues[flatKey] !== null) {
                return this.cloneJson(mergedValues[flatKey]);
            }
        }
        if (field && Object.prototype.hasOwnProperty.call(field, 'default')
            && field.default !== undefined) {
            return this.cloneJson(field.default);
        }
        if (field && field.defaultKey) {
            if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS[field.defaultKey] !== undefined) {
                return this.cloneJson(MASTER_SETTINGS[field.defaultKey]);
            }
            if (typeof DataConfig !== 'undefined' && DataConfig[field.defaultKey] !== undefined) {
                return this.cloneJson(DataConfig[field.defaultKey]);
            }
        }
        if (field && field.defaultKeyFallback) {
            if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS[field.defaultKeyFallback] !== undefined) {
                return this.cloneJson(MASTER_SETTINGS[field.defaultKeyFallback]);
            }
            if (typeof DataConfig !== 'undefined' && DataConfig[field.defaultKeyFallback] !== undefined) {
                return this.cloneJson(DataConfig[field.defaultKeyFallback]);
            }
        }
        if (field && field.type === 'checkbox') return false;
        if (field && field.type === 'number') return 0;
        if (field && (field.type === 'text' || field.type === 'textarea' || field.type === 'topic')) return '';
        return undefined;
    },

    /**
     * Preset tree includes every eligible field, including those hidden in the inspector
     * by condition / visibleWhen / editor tier. Visibility only affects the live editor UI.
     */
    collectLeafFields: function (fields, group, mergedValues, out) {
        if (!Array.isArray(fields)) return;
        fields.forEach((field) => {
            if (!field || this.SKIP_FIELD_TYPES[field.type]) return;

            if (field.type === 'column_split' && Array.isArray(field.columns)) {
                field.columns.forEach((col) => {
                    const colFields = col && Array.isArray(col.fields) ? col.fields : [];
                    const children = [];
                    this.collectLeafFields(colFields, group, mergedValues, children);
                    if (children.length > 0) {
                        const title = (col && col.title) ? col.title : 'Column';
                        out.push({
                            kind: 'branch',
                            id: 'nest:column:' + title,
                            label: title,
                            children: children
                        });
                    }
                });
                return;
            }

            if ((field.type === 'typography' || field.type === 'icon_style') && Array.isArray(field.fields)) {
                const branchLabel = field.label || (field.type === 'typography' ? 'Typography' : 'Icon');
                const children = [];
                this.collectLeafFields(field.fields, group, mergedValues, children);
                if (children.length > 0) {
                    out.push({
                        kind: 'branch',
                        id: 'nest:' + (field.key || branchLabel),
                        label: branchLabel,
                        children: children
                    });
                }
                return;
            }

            const path = this.getFieldPath(field);
            if (!path) return;

            out.push({
                kind: 'leaf',
                id: this.pathKey(path),
                label: field.label || field.key,
                path: path,
                field: field,
                blob: !!this.BLOB_FIELD_TYPES[field.type]
            });
        });
    },

    buildTree: function (widget) {
        if (!widget || typeof Editor === 'undefined' || typeof Editor._buildWidgetInspectorSchema !== 'function') {
            return [];
        }
        const schema = Editor._buildWidgetInspectorSchema(widget);
        const mergedValues = typeof Editor._buildMergedStaticValues === 'function'
            ? Editor._buildMergedStaticValues(widget)
            : Object.assign({}, typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {}, widget.overrides || {});
        const overrides = widget.overrides || {};
        const tree = [];

        schema.forEach((group, index) => {
            if (!group) return;
            const gid = group.id || ('g_' + index);
            if (gid === 'meta_group' || gid === 'basic_settings' || gid === 'basic_group') {
                return;
            }

            const children = [];
            this.collectLeafFields(group.fields || [], group, mergedValues, children);
            if (children.length === 0) return;

            const annotate = (nodes) => {
                nodes.forEach((node) => {
                    if (node.kind === 'branch') {
                        annotate(node.children || []);
                        return;
                    }
                    node.changed = this.isFieldChanged(node.field, overrides);
                    node.value = this.resolveFieldValue(node.field, overrides, mergedValues);
                });
            };
            annotate(children);

            tree.push({
                kind: 'branch',
                id: 'group:' + gid,
                label: group.title || gid,
                icon: group.icon || 'ph-folder',
                children: children
            });
        });

        return tree;
    },

    walkLeaves: function (nodes, visit) {
        if (!Array.isArray(nodes)) return;
        nodes.forEach((node) => {
            if (!node) return;
            if (node.kind === 'leaf') visit(node);
            else if (node.children) this.walkLeaves(node.children, visit);
        });
    },

    collectChangedPathKeys: function (tree) {
        const keys = [];
        this.walkLeaves(tree, (leaf) => {
            if (leaf.changed) keys.push(leaf.id);
        });
        return keys;
    },

    /** Leaf path keys whose path exists in a preset settings blob. */
    collectPathKeysPresentInSettings: function (tree, settings) {
        const keys = [];
        if (!settings || typeof settings !== 'object') return keys;
        this.walkLeaves(tree, (leaf) => {
            if (!leaf || !leaf.path || !leaf.id) return;
            if (this.hasAtPath(settings, leaf.path)) keys.push(leaf.id);
        });
        return keys;
    },

    serializeSettings: function (widget, tree, checkedPathKeys) {
        const checked = {};
        (checkedPathKeys || []).forEach((k) => { checked[k] = true; });
        const settings = {};
        const overrides = widget.overrides || {};
        const mergedValues = typeof Editor !== 'undefined' && typeof Editor._buildMergedStaticValues === 'function'
            ? Editor._buildMergedStaticValues(widget)
            : Object.assign({}, typeof MASTER_SETTINGS !== 'undefined' ? MASTER_SETTINGS : {}, overrides);

        this.walkLeaves(tree, (leaf) => {
            if (!checked[leaf.id] || !leaf.path) return;
            // Always materialize a concrete value for checked leaves (override or hardcoded default).
            const value = this.resolveFieldValue(leaf.field, overrides, mergedValues);
            if (value === undefined) return;
            this.setAtPath(settings, leaf.path, value);
        });

        return settings;
    },

    /**
     * Build a full multi-variant preset file object (new main, one variant).
     * @param {string} mainName - display name
     * @param {string} [subName] - optional sub display name; empty => variant named "default".
     *   A provided sub name is stored even when this is the only variant (sub dropdown stays hidden until 2+).
     */
    buildPresetFile: function (widget, mainName, subName, tree, checkedPathKeys, options) {
        options = options || {};
        const widgetType = (typeof Dashboard !== 'undefined' && typeof Dashboard._getWidgetTypeByInstance === 'function')
            ? Dashboard._getWidgetTypeByInstance(widget)
            : null;
        const mainOk = this.validateDisplayName(mainName);
        const displayMain = mainOk.ok ? mainOk.name : 'Preset';
        const fileId = options.fileId
            || this.uniqueSlug(this.slugify(displayMain, 'preset'), options.existingFileIds || []);
        const settings = this.serializeSettings(widget, tree, checkedPathKeys);
        const stripped = (typeof Dashboard !== 'undefined' && Dashboard._stripWidgetPresetExcludedKeys)
            ? Dashboard._stripWidgetPresetExcludedKeys(settings)
            : settings;

        let variantName = String(subName || '').trim();
        if (!variantName) variantName = this.DEFAULT_VARIANT_NAME;

        const variantId = this.slugify(variantName, this.DEFAULT_VARIANT_NAME);
        return {
            id: fileId,
            name: displayMain,
            widgetType: widgetType || '',
            version: (typeof window !== 'undefined' && window.DASHBOARD_VERSION) ? String(window.DASHBOARD_VERSION) : '2.0.0',
            variants: [{
                id: variantId,
                name: variantName,
                settings: stripped
            }]
        };
    },

    /**
     * Merge new settings into an existing preset file according to save rules.
     * Returns { preset, overwrite, created, error }.
     */
    mergeIntoExisting: function (existingRaw, mainName, subName, settings, options) {
        options = options || {};
        const existing = this.normalizePreset(existingRaw, options);
        if (!existing) return { error: 'Invalid existing preset.' };

        const mainOk = this.validateDisplayName(mainName);
        if (!mainOk.ok) return { error: mainOk.error };
        // Keep existing display name unless explicitly renaming via options
        if (options.updateMainName) existing.name = mainOk.name;

        const stripped = (typeof Dashboard !== 'undefined' && Dashboard._stripWidgetPresetExcludedKeys)
            ? Dashboard._stripWidgetPresetExcludedKeys(settings || {})
            : this.cloneJson(settings || {});

        const subTrim = String(subName || '').trim();
        const isMulti = existing.variants.length > 1;

        if (!subTrim) {
            if (isMulti) {
                return { error: 'This preset has sub-presets. Select or enter a sub name to overwrite.' };
            }
            // Overwrite lone variant settings; keep its existing name (may be "default" or a prior sub name)
            existing.variants[0].settings = stripped;
            return { preset: existing, overwrite: true, created: false };
        }

        const idx = this.findVariantIndexByName(existing, subTrim);
        if (idx >= 0) {
            existing.variants[idx].settings = stripped;
            return { preset: existing, overwrite: true, created: false };
        }

        // Single variant still named "default": treat a new sub name as naming that variant (not append).
        if (!isMulti && existing.variants.length === 1
            && this.isDefaultVariantName(existing.variants[0].name)
            && !this.isDefaultVariantName(subTrim)) {
            const lone = existing.variants[0];
            lone.name = subTrim;
            lone.id = this.uniqueSlug(this.slugify(subTrim, 'variant'), []);
            lone.settings = stripped;
            return { preset: existing, overwrite: true, created: false };
        }

        // Guard: only one sub named "default"
        if (this.isDefaultVariantName(subTrim)) {
            const hasDefault = existing.variants.some((v) => this.isDefaultVariantName(v.name));
            if (hasDefault) {
                return { error: 'A sub-preset named "default" already exists. Rename it first or choose another name.' };
            }
        }

        // Append new sub; keep the existing lone variant's name as stored (never force it to "default").
        const existingVarIds = existing.variants.map((v) => v.id);
        const newId = this.uniqueSlug(this.slugify(subTrim, 'variant'), existingVarIds);
        existing.variants.push({
            id: newId,
            name: subTrim,
            settings: stripped
        });
        return { preset: existing, overwrite: false, created: true };
    },

    /** @deprecated use buildPresetFile - kept for callers that still pass a single name */
    buildPreset: function (widget, name, tree, checkedPathKeys) {
        return this.buildPresetFile(widget, name, '', tree, checkedPathKeys);
    }
};
