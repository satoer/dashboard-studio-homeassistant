/**
 * Nested widget bindings: path helpers, topic collection for MQTT dispatch, deep merge.
 * Binding leaves are topic strings only; object/array nodes are structural.
 */
const BindingsTree = {
    collectTopicStrings(value, out) {
        if (out === undefined) out = [];
        if (value === null || value === undefined) return out;
        if (typeof value === 'string') {
            if (value !== '') out.push(value);
            return out;
        }
        if (Array.isArray(value)) {
            value.forEach((item) => this.collectTopicStrings(item, out));
            return out;
        }
        if (typeof value === 'object') {
            Object.keys(value).forEach((k) => this.collectTopicStrings(value[k], out));
            return out;
        }
        return out;
    },

    bindingTreeHasTopic(tree, topic) {
        if (topic == null || topic === '') return false;
        const topics = this.collectTopicStrings(tree, []);
        return topics.some((t) => t === topic);
    },

    /**
     * Whether a widget should refresh when `topic` updates: formal bindings and optional widget hooks
     * (e.g. Text widget markdown `{{topic}}` without a binding entry).
     */
    widgetWantsTopic(widget, topic) {
        if (!widget || topic == null || topic === '') return false;
        if (this.bindingTreeHasTopic(widget.bindings, topic)) return true;
        if (typeof widget.usesMarkdownDataTopic === 'function' && widget.usesMarkdownDataTopic(topic)) return true;
        if (typeof widget.usesFormulaTopic === 'function' && widget.usesFormulaTopic(topic)) return true;
        return false;
    },

    getAtPath(tree, pathSegments) {
        if (!tree || !pathSegments || pathSegments.length === 0) return undefined;
        let cur = tree;
        for (let i = 0; i < pathSegments.length; i++) {
            const seg = pathSegments[i];
            if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
            cur = cur[seg];
        }
        return cur;
    },

    setAtPath(tree, pathSegments, topicStr) {
        if (!tree || typeof tree !== 'object' || !pathSegments || pathSegments.length === 0) return;
        let cur = tree;
        for (let i = 0; i < pathSegments.length - 1; i++) {
            const seg = pathSegments[i];
            const next = pathSegments[i + 1];
            const needArray = typeof next === 'number' || (typeof next === 'string' && /^\d+$/.test(String(next)));
            if (cur[seg] === undefined || cur[seg] === null || typeof cur[seg] !== 'object') {
                cur[seg] = needArray ? [] : {};
            }
            cur = cur[seg];
        }
        const last = pathSegments[pathSegments.length - 1];
        cur[last] = topicStr;
    },

    _isEmptyNode(node) {
        if (node === null || node === undefined) return true;
        if (typeof node !== 'object') return false;
        if (Array.isArray(node)) return node.length === 0;
        return Object.keys(node).length === 0;
    },

    /**
     * Remove leaf at path and prune empty parents up to root keys of tree.
     */
    deleteAtPath(tree, pathSegments) {
        if (!tree || typeof tree !== 'object' || !pathSegments || pathSegments.length === 0) return;
        const parents = [];
        let cur = tree;
        for (let i = 0; i < pathSegments.length; i++) {
            const seg = pathSegments[i];
            if (cur === null || cur === undefined || typeof cur !== 'object') return;
            parents.push({ obj: cur, key: seg });
            cur = cur[seg];
        }
        const leaf = parents[parents.length - 1];
        if (!leaf || !(leaf.key in leaf.obj)) return;
        delete leaf.obj[leaf.key];
        for (let p = parents.length - 2; p >= 0; p--) {
            const { obj, key } = parents[p];
            const child = obj[key];
            if (this._isEmptyNode(child)) {
                delete obj[key];
            } else {
                break;
            }
        }
    },

    deepMergeBindings(target, patch) {
        if (!patch || typeof patch !== 'object') return target;
        if (!target || typeof target !== 'object') {
            return Array.isArray(patch) ? patch.slice() : JSON.parse(JSON.stringify(patch));
        }
        if (Array.isArray(patch)) {
            if (!Array.isArray(target)) return patch.slice();
            const out = target.slice();
            patch.forEach((pv, i) => {
                if (pv === null || pv === undefined) return;
                if (typeof pv === 'object' && !Array.isArray(pv)) {
                    const prev = out[i];
                    out[i] = BindingsTree.deepMergeBindings(
                        prev && typeof prev === 'object' && !Array.isArray(prev) ? { ...prev } : {},
                        pv
                    );
                } else {
                    out[i] = pv;
                }
            });
            return out;
        }
        const out = { ...target };
        Object.keys(patch).forEach((k) => {
            const pv = patch[k];
            if (pv === undefined) return;
            if (pv === null) {
                delete out[k];
                return;
            }
            const tv = out[k];
            if (typeof pv === 'object' && !Array.isArray(pv)) {
                out[k] = BindingsTree.deepMergeBindings(
                    tv && typeof tv === 'object' && !Array.isArray(tv) ? tv : {},
                    pv
                );
            } else if (Array.isArray(pv)) {
                out[k] = BindingsTree.deepMergeBindings(Array.isArray(tv) ? tv : [], pv);
            } else {
                out[k] = pv;
            }
        });
        return out;
    }
};

window.BindingsTree = BindingsTree;
