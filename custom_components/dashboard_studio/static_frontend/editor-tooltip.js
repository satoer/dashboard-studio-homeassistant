/**
 * Dashboard Studio - Editor Tooltip Controller
 * Provides descriptive inspector flyout tooltips with interactive hover bridge,
 * 500ms fade-away grace period with hover rescue, hardware-accelerated frosted glass blur,
 * single-path vector frame, and deep links to Help documentation.
 *
 * Data dictionary is cleanly isolated in assets/editor-tooltip-data.js.
 */
(function (global) {
    'use strict';

    var getMetadata = function () {
        if (typeof EditorTooltipData !== 'undefined') return EditorTooltipData;
        if (global && global.EditorTooltipData) return global.EditorTooltipData;
        return {};
    };

    /** Registry type aliases. Container is registered as empty. List used to be textbox. */
    var tooltipTypeAliases = function (widgetType) {
        if (widgetType === 'empty' || widgetType === 'container') return ['empty', 'container'];
        if (widgetType === 'list' || widgetType === 'textbox') return ['list', 'textbox'];
        return widgetType ? [widgetType] : [];
    };

    var lookupTooltip = function (metadata, widgetType, key) {
        if (!metadata || !key) return null;
        var aliases = tooltipTypeAliases(widgetType);
        var i;
        for (i = 0; i < aliases.length; i++) {
            var row = metadata[aliases[i] + '.' + key];
            if (row) return row;
        }
        return metadata[key] || null;
    };

    var widgetTypeFromInstance = function (widget) {
        if (!widget) return null;
        if (typeof WidgetRegistry !== 'undefined' && typeof WidgetRegistry.getTypeKeyForClass === 'function') {
            var found = WidgetRegistry.getTypeKeyForClass(widget.constructor);
            if (found) return found;
        }
        if (typeof Dashboard !== 'undefined' && typeof Dashboard._getWidgetTypeByInstance === 'function') {
            return Dashboard._getWidgetTypeByInstance(widget) || null;
        }
        return null;
    };

    var EditorTooltip = {
        _el: null,
        _shadowEl: null,
        _contentEl: null,
        _frameSvg: null,
        _framePath: null,
        _titleEl: null,
        _bodyEl: null,
        _helpBtn: null,
        _activeHelpSpec: null,
        _activeTarget: null,
        _activeData: null,
        _topicValueEl: null,
        _topicValueText: null,
        _showTimer: null,
        _fadeTimer: null,
        _liveRefreshTimer: null,
        _isHoveringFlyout: false,
        _isPointerDown: false,
        _isDragging: false,
        _initialized: false,

        HOVER_INTENT_MS: 180,
        FADE_GRACE_MS: 500,
        TOPIC_REFRESH_MS: 300,

        isEnabled: function () {
            if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.editorTooltips !== undefined) {
                return Boolean(MASTER_SETTINGS.editorTooltips);
            }
            return true;
        },

        syncState: function () {
            var enabled = this.isEnabled();
            if (typeof document !== 'undefined' && document.body) {
                document.body.classList.toggle('editor-tooltips-active', enabled);
            }
            if (!enabled && !(this._activeData && this._activeData.alwaysShow)) {
                this.hideImmediately();
            }
            return enabled;
        },

        init: function () {
            if (this._initialized) {
                this.syncState();
                return;
            }
            this._buildFlyoutDom();
            this._bindEvents();
            this.syncState();
            this._initialized = true;
        },

        _buildFlyoutDom: function () {
            if (this._el) return;

            var shadow = document.createElement('div');
            shadow.className = 'editor-tooltip-shadow hidden';
            shadow.setAttribute('aria-hidden', 'true');
            document.body.appendChild(shadow);
            this._shadowEl = shadow;

            var flyout = document.createElement('div');
            flyout.className = 'editor-tooltip-flyout hidden';
            flyout.setAttribute('role', 'tooltip');
            flyout.setAttribute('aria-hidden', 'true');

            var svgNs = 'http://www.w3.org/2000/svg';
            var svg = document.createElementNS(svgNs, 'svg');
            svg.setAttribute('class', 'editor-tooltip-frame');
            svg.setAttribute('aria-hidden', 'true');

            var path = document.createElementNS(svgNs, 'path');
            path.setAttribute('class', 'editor-tooltip-frame-path');
            svg.appendChild(path);
            flyout.appendChild(svg);
            this._frameSvg = svg;
            this._framePath = path;

            var content = document.createElement('div');
            content.className = 'editor-tooltip-content';

            var header = document.createElement('div');
            header.className = 'editor-tooltip-header';

            var title = document.createElement('span');
            title.className = 'editor-tooltip-title';
            header.appendChild(title);

            var helpBtn = document.createElement('button');
            helpBtn.type = 'button';
            helpBtn.className = 'editor-tooltip-help-btn';
            helpBtn.setAttribute('aria-label', 'Open Help documentation');
            helpBtn.title = 'Open Help documentation for this setting';
            helpBtn.innerHTML = '<i class="ph-bold ph-question"></i>';
            header.appendChild(helpBtn);

            var body = document.createElement('div');
            body.className = 'editor-tooltip-body';

            content.appendChild(header);
            content.appendChild(body);
            flyout.appendChild(content);
            document.body.appendChild(flyout);

            this._el = flyout;
            this._contentEl = content;
            this._titleEl = title;
            this._bodyEl = body;
            this._helpBtn = helpBtn;

            var self = this;
            flyout.addEventListener('mouseenter', function () {
                self._isHoveringFlyout = true;
                self._cancelFadeGrace();
            });

            flyout.addEventListener('mouseleave', function () {
                self._isHoveringFlyout = false;
                self._startFadeGrace();
            });

            helpBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var spec = self._activeHelpSpec;
                self.hideImmediately();
                if (!spec || typeof HelpSystem === 'undefined') return;

                if (typeof HelpSystem.openFromEditorSpec === 'function') {
                    HelpSystem.openFromEditorSpec(spec);
                } else if (typeof HelpSystem.goToPage === 'function') {
                    HelpSystem.goToPage(spec.topic, spec.widgetSub || null, spec.anchor || null);
                }
            });
        },

        _bindEvents: function () {
            var self = this;

            // Capture-phase mouseover strips browser native titles in the editor to prevent double tips,
            // while preserving regular native tooltips for special cases (the FAB edit button and Quick Toolbar)
            document.addEventListener('mouseover', function (e) {
                var titledEl = e.target.closest ? e.target.closest('[title], [data-stored-title]') : null;
                if (titledEl && titledEl !== self._helpBtn) {
                    var isSpecialRegularTooltip = Boolean(titledEl.closest('#fab-mode-switch, #quick-toolbar-host, .quick-toolbar-shell, .quick-toolbar-clip, .quick-toolbar-flyout'));
                    if (isSpecialRegularTooltip) {
                        if (!titledEl.getAttribute('title') && titledEl.getAttribute('data-stored-title')) {
                            titledEl.setAttribute('title', titledEl.getAttribute('data-stored-title'));
                        }
                        return;
                    }

                    var t = titledEl.getAttribute('title');
                    if (t) {
                        titledEl.setAttribute('data-stored-title', t);
                        titledEl.removeAttribute('title');
                    }
                }

                if (self._isDragging || self._isPointerDown) {
                    return;
                }

                var tooltipsEnabled = self.syncState();

                if (self._el && self._el.contains(e.target)) {
                    return;
                }

                var resolved = self.resolveTarget(e.target, tooltipsEnabled);
                if (!resolved) {
                    if (self._activeTarget && !self._activeTarget.contains(e.target)) {
                        if (self._activeTarget.closest && self._activeTarget.closest('.text-full-editor, .tfe-studio, .text-full-editor-table-picker')) {
                            self.hideImmediately();
                        } else {
                            self._onTargetLeave();
                        }
                    }
                    return;
                }

                var target = resolved.el;
                self._onTargetEnter(target, resolved.data);
            }, true);

            document.addEventListener('mouseout', function (e) {
                if (!self._activeTarget) return;

                if (self._activeTarget.closest && self._activeTarget.closest('.text-full-editor, .tfe-studio, .text-full-editor-table-picker')) {
                    if (!self._activeTarget.contains(e.relatedTarget)) {
                        self.hideImmediately();
                    }
                    return;
                }

                if (self._el && self._el.contains(e.relatedTarget)) {
                    return;
                }

                if (self._activeTarget.contains(e.relatedTarget)) {
                    return;
                }

                self._onTargetLeave();
            });

            var scrollContainer = document.getElementById('editor-scroll-container');
            if (scrollContainer) {
                scrollContainer.addEventListener('scroll', function () {
                    self.hideImmediately();
                }, { passive: true });
            }

            document.addEventListener('scroll', function (e) {
                if (self._el && e.target && e.target.nodeType === 1 && self._el.contains(e.target)) {
                    return;
                }
                self.hideImmediately();
            }, true);

            document.addEventListener('pointerdown', function (e) {
                self._isPointerDown = true;
                if (!self._el || !self._el.contains(e.target)) {
                    self.hideImmediately();
                }
            }, true);

            window.addEventListener('pointerup', function () {
                self._isPointerDown = false;
            }, true);

            window.addEventListener('pointercancel', function () {
                self._isPointerDown = false;
            }, true);

            document.addEventListener('dragstart', function () {
                self._isDragging = true;
                self.hideImmediately();
            }, true);

            document.addEventListener('dragend', function () {
                self._isDragging = false;
                self._isPointerDown = false;
                self.hideImmediately();
            }, true);

            document.addEventListener('drop', function () {
                self._isDragging = false;
                self._isPointerDown = false;
                self.hideImmediately();
            }, true);

            window.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    self.hideImmediately();
                }
            });

            window.addEventListener('resize', function () {
                self.hideImmediately();
            }, { passive: true });

            window.addEventListener('blur', function () {
                self._isPointerDown = false;
                self._isDragging = false;
                self.hideImmediately();
            });
        },

        resolveTarget: function (rawTarget, tooltipsEnabled) {
            if (!rawTarget || !rawTarget.closest) return null;
            var settingTooltipsEnabled = (tooltipsEnabled !== undefined) ? Boolean(tooltipsEnabled) : this.isEnabled();

            // Special cases: Cogwheel FAB edit button and Quick Toolbar use regular tooltips
            if (rawTarget.closest('#fab-mode-switch, #quick-toolbar-host, .quick-toolbar-shell, .quick-toolbar-clip, .quick-toolbar-flyout')) {
                return null;
            }

            // Do not trigger tooltip on flyout's own internal elements
            if (this._el && this._el.contains(rawTarget)) return null;

            // Topic preview rows (bound-topic dropdown items & Live Monitor rows) always work,
            // yielding to inner action buttons when general setting tooltips are enabled.
            var topicPreviewEl = rawTarget.closest('[data-topic-preview]');
            var innerActionBtn = topicPreviewEl ? rawTarget.closest('button, .btn-tool') : null;
            var insideTopicPreviewAction = Boolean(innerActionBtn && topicPreviewEl.contains(innerActionBtn));
            if (topicPreviewEl && (!insideTopicPreviewAction || !settingTooltipsEnabled)) {
                var topicAddr = topicPreviewEl.getAttribute('data-topic-preview');
                if (topicAddr) {
                    return {
                        el: topicPreviewEl,
                        key: 'topic-preview',
                        widgetType: null,
                        data: {
                            topicPreview: topicAddr,
                            topicSource: topicPreviewEl.getAttribute('data-topic-preview-source') || 'dropdown',
                            alwaysShow: true,
                            help: null
                        }
                    };
                }
            }

            var richTipEl = rawTarget.closest('[data-tip-body]');
            if (richTipEl) {
                var tipBody = richTipEl.getAttribute('data-tip-body') || '';
                var tipTitle = richTipEl.getAttribute('data-tip-title') || '';
                if (!tipTitle && richTipEl.textContent) tipTitle = richTipEl.textContent.trim();
                if (!tipTitle) tipTitle = 'Tip';
                if (tipBody) {
                    return {
                        el: richTipEl,
                        key: 'rich-tip',
                        widgetType: null,
                        data: {
                            title: tipTitle,
                            description: tipBody,
                            alwaysShow: true,
                            help: null
                        }
                    };
                }
            }

            if (!settingTooltipsEnabled) return null;

            var insideTfe = Boolean(rawTarget.closest('.text-full-editor, .tfe-studio, .text-full-editor-table-picker'));

            // Expand matching candidates to include buttons, controls, labels, and theme elements
            var target = insideTfe
                ? rawTarget.closest('button, .btn-tool, .ds-help-link, .tfe-block-handle, .tfe-nested-handle, .tfe-list-item-handle')
                : rawTarget.closest(
                    '[data-editor-tooltip], .control-label, [data-field-key], ' +
                    'button, .btn-tool, .btn-bind, .btn-reset, .editor-color-btn, ' +
                    '.dashboard-viewer-url-copy, .theme-correction-name, .toolbar-label, [data-bind-key], [data-reset-key]'
                );
            if (!target) return null;

            // Do not trigger tooltip on flyout's own internal elements
            if (this._el && this._el.contains(target)) return null;

            var key = target.getAttribute('data-editor-tooltip');
            var widgetType = target.getAttribute('data-widget-type');

            if (!key && !insideTfe) {
                var fieldWrap = target.closest('[data-field-key]');
                if (fieldWrap) {
                    key = fieldWrap.getAttribute('data-field-key');
                }
            }

            if (!widgetType && !insideTfe) {
                var typedEl = target.closest('[data-widget-type]');
                if (typedEl) widgetType = typedEl.getAttribute('data-widget-type');
            }

            if (!widgetType && !insideTfe) {
                if (typeof Editor !== 'undefined' && Editor.currentId && typeof Dashboard !== 'undefined' && Dashboard.widgets) {
                    widgetType = widgetTypeFromInstance(Dashboard.widgets[Editor.currentId]);
                }
            }

            var metadata = getMetadata();

            // Identify specialized button classes
            if (!key && !insideTfe) {
                if (target.classList.contains('btn-bind') || target.hasAttribute('data-bind-key')) {
                    key = 'button.bind';
                } else if (target.classList.contains('btn-reset') || target.hasAttribute('data-reset-key')) {
                    key = 'button.reset';
                } else if (target.classList.contains('editor-color-btn')) {
                    key = 'button.color-picker';
                } else if (target.id && (metadata[target.id] || target.id.startsWith('btn-') || target.id.startsWith('toolbar-'))) {
                    key = target.id;
                }
            }

            if (!key && !insideTfe && target.textContent && (target.classList.contains('control-label') || target.classList.contains('toolbar-label'))) {
                key = target.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
            }

            var data = null;
            if (key) {
                data = lookupTooltip(metadata, widgetType, key);
            }

            // Fallback for buttons or elements with stored title or aria-label
            if (!data) {
                var hint = insideTfe
                    ? (target.getAttribute('data-stored-title') || target.getAttribute('title') || target.getAttribute('data-field-hint'))
                    : (target.getAttribute('data-stored-title') || target.getAttribute('title') || target.getAttribute('aria-label') || target.getAttribute('data-field-hint'));
                if (hint) {
                    var cleanHint = hint.replace(/[—;]/g, ', ').replace(/\s+/g, ' ').trim();
                    var labelText = (insideTfe ? '' : target.getAttribute('aria-label')) || (target.textContent ? target.textContent.trim() : '');
                    if (!labelText || labelText.length > 30) {
                        labelText = target.tagName === 'BUTTON' ? 'Action' : (key || 'Setting');
                    }
                    if (!insideTfe || cleanHint.toLowerCase() !== labelText.toLowerCase()) {
                        data = {
                            title: labelText,
                            description: cleanHint,
                            help: null
                        };
                    }
                }
            }

            return data ? { el: target, key: key || 'target', widgetType: widgetType, data: data } : null;
        },

        _onTargetEnter: function (target, data) {
            if (!data) return;
            if (!this.isEnabled() && !data.alwaysShow) return;
            var self = this;
            clearTimeout(this._showTimer);
            clearTimeout(this._fadeTimer);

            var isAlreadyVisible = this._el && !this._el.classList.contains('hidden');

            if (this._activeTarget === target && isAlreadyVisible) {
                this._cancelFadeGrace();
                return;
            }

            this._activeTarget = target;
            this._activeData = data;

            // Warm-switch immediately if already visible; apply hover-intent delay on cold starts
            if (isAlreadyVisible) {
                this._cancelFadeGrace();
                this._renderAndShow(target, data);
            } else {
                this._showTimer = setTimeout(function () {
                    if (!self.isEnabled() && !data.alwaysShow) return;
                    if (self._activeTarget === target) {
                        self._renderAndShow(target, data);
                    }
                }, this.HOVER_INTENT_MS);
            }
        },

        _onTargetLeave: function () {
            clearTimeout(this._showTimer);
            this._startFadeGrace();
        },

        _startFadeGrace: function () {
            var self = this;
            if (!this._el || this._el.classList.contains('hidden')) return;

            clearTimeout(this._fadeTimer);
            this._el.classList.add('is-fading');
            if (this._shadowEl) this._shadowEl.classList.add('is-fading');

            this._fadeTimer = setTimeout(function () {
                if (!self._isHoveringFlyout) {
                    self.hideImmediately();
                }
            }, this.FADE_GRACE_MS);
        },

        _cancelFadeGrace: function () {
            clearTimeout(this._fadeTimer);
            if (this._el) this._el.classList.remove('is-fading');
            if (this._shadowEl) this._shadowEl.classList.remove('is-fading');
        },

        _renderBodyContent: function (desc) {
            var bodyEl = this._bodyEl;
            if (!bodyEl) return false;
            bodyEl.innerHTML = '';

            if (!desc) return false;

            // Check if description contains bullet points
            if (!desc.includes('•') && !desc.includes('\n- ') && !desc.includes('\n* ')) {
                bodyEl.textContent = desc;
                return false;
            }

            var leadText = '';
            var items = [];

            if (desc.includes('\n')) {
                var rawParts = desc.split(/\n/);
                for (var i = 0; i < rawParts.length; i++) {
                    var line = rawParts[i].trim();
                    if (!line) continue;
                    if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
                        var clean = line.replace(/^[•\-\*]\s*/, '').trim();
                        if (clean) items.push(clean);
                    } else if (items.length === 0) {
                        leadText = leadText ? (leadText + ' ' + line) : line;
                    } else {
                        items[items.length - 1] += ' ' + line;
                    }
                }
            } else {
                var parts = desc.split('•');
                leadText = parts[0].trim();
                for (var p = 1; p < parts.length; p++) {
                    var c = parts[p].trim();
                    if (c) items.push(c);
                }
            }

            if (leadText) {
                var leadEl = document.createElement('div');
                leadEl.className = 'editor-tooltip-lead';
                leadEl.textContent = leadText;
                bodyEl.appendChild(leadEl);
            }

            if (items.length > 0) {
                var ul = document.createElement('ul');
                ul.className = 'editor-tooltip-bullets';
                for (var j = 0; j < items.length; j++) {
                    var li = document.createElement('li');
                    li.className = 'editor-tooltip-bullet-item';
                    var itemText = items[j];
                    var colonIdx = itemText.indexOf(':');
                    if (colonIdx > 0 && colonIdx < 50) {
                        var strong = document.createElement('strong');
                        strong.className = 'editor-tooltip-bullet-title';
                        strong.textContent = itemText.slice(0, colonIdx + 1);
                        li.appendChild(strong);
                        var spaceNode = document.createTextNode(' ' + itemText.slice(colonIdx + 1).trim());
                        li.appendChild(spaceNode);
                    } else {
                        li.textContent = itemText;
                    }
                    ul.appendChild(li);
                }
                bodyEl.appendChild(ul);
            }

            return true;
        },

        _getTopicPreviewPayload: function (topic, source) {
            if (!topic) return { hasValue: false, value: undefined };
            var preferMonitor = source === 'monitor';
            if (preferMonitor && typeof DataDriverRegistry !== 'undefined' && typeof DataDriverRegistry.get === 'function') {
                var driver = DataDriverRegistry.get();
                if (driver && driver.seenTopics && typeof driver.seenTopics.get === 'function') {
                    var seenEntry = driver.seenTopics.get(topic);
                    if (seenEntry && seenEntry.payload !== undefined) {
                        return { hasValue: true, value: seenEntry.payload };
                    }
                }
            }
            if (typeof Dashboard !== 'undefined' && Dashboard.liveData
                && Object.prototype.hasOwnProperty.call(Dashboard.liveData, topic)
                && Dashboard.liveData[topic] !== undefined) {
                return { hasValue: true, value: Dashboard.liveData[topic] };
            }
            if (!preferMonitor && typeof DataDriverRegistry !== 'undefined' && typeof DataDriverRegistry.get === 'function') {
                var drv = DataDriverRegistry.get();
                if (drv && drv.seenTopics && typeof drv.seenTopics.get === 'function') {
                    var seen = drv.seenTopics.get(topic);
                    if (seen && seen.payload !== undefined) {
                        return { hasValue: true, value: seen.payload };
                    }
                }
            }
            return { hasValue: false, value: undefined };
        },

        _formatTopicValue: function (hasValue, value) {
            if (!hasValue || value === undefined) {
                return { text: 'No value received yet', isEmpty: true, isMissing: true };
            }
            if (value === null) {
                return { text: 'null', isEmpty: false, isMissing: false };
            }
            if (typeof value === 'string') {
                if (value === '') {
                    return { text: '"" (empty string)', isEmpty: true, isMissing: false };
                }
                if (value.length > 2000) {
                    return {
                        text: value.slice(0, 2000) + '\n... (truncated, ' + value.length + ' chars)',
                        isEmpty: false,
                        isMissing: false
                    };
                }
                return { text: value, isEmpty: false, isMissing: false };
            }
            if (typeof value === 'object') {
                var json;
                try {
                    json = JSON.stringify(value, null, 2);
                } catch (e) {
                    json = String(value);
                }
                if (json && json.length > 2000) {
                    json = json.slice(0, 2000) + '\n... (truncated, ' + json.length + ' chars)';
                }
                return { text: json || '{}', isEmpty: false, isMissing: false };
            }
            return { text: String(value), isEmpty: false, isMissing: false };
        },

        _renderTopicPreviewContent: function (topic, source) {
            var bodyEl = this._bodyEl;
            if (!bodyEl) return;
            bodyEl.innerHTML = '';

            var addrLabel = document.createElement('div');
            addrLabel.className = 'editor-tooltip-topic-label';
            addrLabel.textContent = 'Topic Address';
            bodyEl.appendChild(addrLabel);

            var addrEl = document.createElement('div');
            addrEl.className = 'editor-tooltip-topic-path';
            addrEl.textContent = topic;
            bodyEl.appendChild(addrEl);

            var valLabel = document.createElement('div');
            valLabel.className = 'editor-tooltip-topic-label';
            valLabel.textContent = 'Current Value';
            bodyEl.appendChild(valLabel);

            var payloadInfo = this._getTopicPreviewPayload(topic, source);
            var formatted = this._formatTopicValue(payloadInfo.hasValue, payloadInfo.value);

            var valEl = document.createElement('pre');
            valEl.className = 'editor-tooltip-topic-value';
            if (formatted.isEmpty) valEl.classList.add('is-empty');
            if (formatted.isMissing) valEl.classList.add('is-missing');
            valEl.textContent = formatted.text;
            bodyEl.appendChild(valEl);

            this._topicValueEl = valEl;
            this._topicValueText = formatted.text;
        },

        _stopLiveTopicRefresh: function () {
            if (this._liveRefreshTimer) {
                clearInterval(this._liveRefreshTimer);
                this._liveRefreshTimer = null;
            }
        },

        _startLiveTopicRefresh: function (target, data) {
            this._stopLiveTopicRefresh();
            var self = this;
            this._liveRefreshTimer = setInterval(function () {
                if (!self._el || self._el.classList.contains('hidden') || self._activeTarget !== target) {
                    self._stopLiveTopicRefresh();
                    return;
                }
                if (!target || !target.isConnected || target.getClientRects().length === 0) {
                    self.hideImmediately();
                    return;
                }
                if (!self._topicValueEl) return;

                var payloadInfo = self._getTopicPreviewPayload(data.topicPreview, data.topicSource);
                var formatted = self._formatTopicValue(payloadInfo.hasValue, payloadInfo.value);
                if (formatted.text === self._topicValueText) return;

                self._topicValueText = formatted.text;
                self._topicValueEl.textContent = formatted.text;
                self._topicValueEl.classList.toggle('is-empty', formatted.isEmpty);
                self._topicValueEl.classList.toggle('is-missing', formatted.isMissing);
                self._positionFlyout(target, false, true);
            }, this.TOPIC_REFRESH_MS);
        },

        _renderAndShow: function (target, data) {
            if (!this._el) return;

            var isTopicPreview = Boolean(data && data.topicPreview);
            var isList = false;

            this._stopLiveTopicRefresh();
            this._activeData = data;

            if (isTopicPreview) {
                this._el.classList.add('is-topic-preview');
                this._titleEl.textContent = data.topicSource === 'monitor' ? 'Live Topic' : 'Topic Value';
                this._renderTopicPreviewContent(data.topicPreview, data.topicSource);
            } else {
                this._el.classList.remove('is-topic-preview');
                this._topicValueEl = null;
                this._topicValueText = null;
                this._titleEl.textContent = data.title || '';
                isList = this._renderBodyContent(data.description || '');
            }

            if (data.help && data.help.topic) {
                this._activeHelpSpec = data.help;
                this._helpBtn.style.display = '';
                this._helpBtn.title = 'Open in Help: ' + (data.title || 'Setting');
                this._el.classList.remove('no-help');
            } else {
                this._activeHelpSpec = null;
                this._helpBtn.style.display = 'none';
                this._el.classList.add('no-help');
            }

            this._positionFlyout(target, isList, isTopicPreview);

            this._el.classList.remove('hidden', 'is-fading');
            this._el.classList.add('is-visible');
            this._el.setAttribute('aria-hidden', 'false');

            if (this._shadowEl) {
                this._shadowEl.classList.remove('hidden', 'is-fading');
                this._shadowEl.classList.add('is-visible');
            }

            if (isTopicPreview) {
                this._startLiveTopicRefresh(target, data);
            }
        },

        _buildPath: function (w, h, r, aw, ah, along, arrowSide) {
            if (arrowSide === 'down' || arrowSide === 'up') {
                var base2 = ah / 2;
                var tipLen = aw;
                var cx = Math.max(r + base2, Math.min(w - r - base2, along));
                if (arrowSide === 'down') {
                    return [
                        'M 0 ' + r,
                        'A ' + r + ' ' + r + ' 0 0 1 ' + r + ' 0',
                        'L ' + (w - r) + ' 0',
                        'A ' + r + ' ' + r + ' 0 0 1 ' + w + ' ' + r,
                        'L ' + w + ' ' + (h - r),
                        'A ' + r + ' ' + r + ' 0 0 1 ' + (w - r) + ' ' + h,
                        'L ' + (cx + base2) + ' ' + h,
                        'L ' + cx + ' ' + (h + tipLen),
                        'L ' + (cx - base2) + ' ' + h,
                        'L ' + r + ' ' + h,
                        'A ' + r + ' ' + r + ' 0 0 1 0 ' + (h - r),
                        'Z'
                    ].join(' ');
                }
                var y0 = tipLen;
                return [
                    'M 0 ' + (y0 + r),
                    'A ' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + y0,
                    'L ' + (cx - base2) + ' ' + y0,
                    'L ' + cx + ' 0',
                    'L ' + (cx + base2) + ' ' + y0,
                    'L ' + (w - r) + ' ' + y0,
                    'A ' + r + ' ' + r + ' 0 0 1 ' + w + ' ' + (y0 + r),
                    'L ' + w + ' ' + (y0 + h - r),
                    'A ' + r + ' ' + r + ' 0 0 1 ' + (w - r) + ' ' + (y0 + h),
                    'L ' + r + ' ' + (y0 + h),
                    'A ' + r + ' ' + r + ' 0 0 1 0 ' + (y0 + h - r),
                    'Z'
                ].join(' ');
            }
            var ay = along;
            if (!arrowSide || arrowSide === 'none') {
                return [
                    'M 0 ' + r,
                    'A ' + r + ' ' + r + ' 0 0 1 ' + r + ' 0',
                    'L ' + (w - r) + ' 0',
                    'A ' + r + ' ' + r + ' 0 0 1 ' + w + ' ' + r,
                    'L ' + w + ' ' + (h - r),
                    'A ' + r + ' ' + r + ' 0 0 1 ' + (w - r) + ' ' + h,
                    'L ' + r + ' ' + h,
                    'A ' + r + ' ' + r + ' 0 0 1 0 ' + (h - r),
                    'Z'
                ].join(' ');
            }
            var ah2 = ah / 2;
            var topLimit = r + ah2;
            var botLimit = h - r - ah2;
            var clampedY = Math.max(topLimit, Math.min(botLimit, ay));
            var totalW = w + aw;

            if (arrowSide === 'right') {
                return [
                    'M 0 ' + r,
                    'A ' + r + ' ' + r + ' 0 0 1 ' + r + ' 0',
                    'L ' + (w - r) + ' 0',
                    'A ' + r + ' ' + r + ' 0 0 1 ' + w + ' ' + r,
                    'L ' + w + ' ' + (clampedY - ah2),
                    'L ' + totalW + ' ' + clampedY,
                    'L ' + w + ' ' + (clampedY + ah2),
                    'L ' + w + ' ' + (h - r),
                    'A ' + r + ' ' + r + ' 0 0 1 ' + (w - r) + ' ' + h,
                    'L ' + r + ' ' + h,
                    'A ' + r + ' ' + r + ' 0 0 1 0 ' + (h - r),
                    'Z'
                ].join(' ');
            }

            return [
                'M ' + aw + ' ' + r,
                'A ' + r + ' ' + r + ' 0 0 1 ' + (aw + r) + ' 0',
                'L ' + (totalW - r) + ' 0',
                'A ' + r + ' ' + r + ' 0 0 1 ' + totalW + ' ' + r,
                'L ' + totalW + ' ' + (h - r),
                'A ' + r + ' ' + r + ' 0 0 1 ' + (totalW - r) + ' ' + h,
                'L ' + (aw + r) + ' ' + h,
                'A ' + r + ' ' + r + ' 0 0 1 ' + aw + ' ' + (h - r),
                'L ' + aw + ' ' + (clampedY + ah2),
                'L 0 ' + clampedY,
                'L ' + aw + ' ' + (clampedY - ah2),
                'Z'
            ].join(' ');
        },

        _positionFlyoutVertical: function (target, isList, isTopicPreview) {
            var flyout = this._el;
            if (!flyout) return;
            var targetRect = target.getBoundingClientRect();
            var cardWidth = (isList || isTopicPreview) ? 320 : 290;
            var arrowTip = 8;
            var arrowBase = 16;
            var cornerRadius = 14;
            var gap = 8;
            var windowWidth = window.innerWidth || document.documentElement.clientWidth;
            var windowHeight = window.innerHeight || document.documentElement.clientHeight;

            flyout.classList.add('is-elevated');
            if (this._shadowEl) this._shadowEl.classList.add('is-elevated');
            flyout.classList.remove('is-arrow-right', 'is-inline-mode');
            flyout.style.width = cardWidth + 'px';
            flyout.style.visibility = 'hidden';
            flyout.style.height = '';
            flyout.classList.remove('hidden');
            flyout.classList.add('is-place-above');
            flyout.classList.remove('is-place-below');

            var cardH = (this._contentEl && this._contentEl.offsetHeight) ? this._contentEl.offsetHeight : (flyout.offsetHeight || 120);
            var totalH = cardH + arrowTip;
            var left = Math.round(targetRect.left + (targetRect.width / 2) - (cardWidth / 2));
            left = Math.max(12, Math.min(windowWidth - cardWidth - 12, left));

            var aboveTop = targetRect.top - totalH - gap;
            var placeBelow = aboveTop < 12;
            var top = placeBelow ? (targetRect.bottom + gap) : aboveTop;
            if (placeBelow && top + totalH > windowHeight - 12) {
                top = Math.max(12, windowHeight - totalH - 12);
            }

            flyout.classList.toggle('is-place-above', !placeBelow);
            flyout.classList.toggle('is-place-below', placeBelow);
            flyout.style.height = totalH + 'px';
            flyout.style.visibility = '';
            flyout.style.left = left + 'px';
            flyout.style.top = Math.round(top) + 'px';

            var arrowX = (targetRect.left + (targetRect.width / 2)) - left;
            var arrowSide = placeBelow ? 'up' : 'down';
            var pathStr = this._buildPath(cardWidth, cardH, cornerRadius, arrowTip, arrowBase, arrowX, arrowSide);
            if (this._frameSvg) {
                this._frameSvg.setAttribute('viewBox', '0 0 ' + cardWidth + ' ' + totalH);
            }
            if (this._framePath) {
                this._framePath.setAttribute('d', pathStr);
            }
            flyout.style.clipPath = 'path("' + pathStr + '")';
            flyout.style.webkitClipPath = 'path("' + pathStr + '")';

            if (this._shadowEl) {
                this._shadowEl.style.left = left + 'px';
                this._shadowEl.style.top = Math.round(top + (placeBelow ? arrowTip : 0)) + 'px';
                this._shadowEl.style.width = cardWidth + 'px';
                this._shadowEl.style.height = cardH + 'px';
            }
        },

        _positionFlyout: function (target, isList, isTopicPreview) {
            var flyout = this._el;
            if (!flyout) return;
            var tipPlace = target.getAttribute ? target.getAttribute('data-tip-place') : '';
            if (tipPlace === 'above') {
                this._positionFlyoutVertical(target, isList, isTopicPreview);
                return;
            }
            flyout.classList.remove('is-place-above', 'is-place-below');
            var editorPanel = document.getElementById('editor-panel');
            var panelRect = editorPanel ? editorPanel.getBoundingClientRect() : null;
            var targetRect = target.getBoundingClientRect();

            var menuEl = target.closest ? target.closest('.ds-editor-menu, .ds-select-menu') : null;
            var tfeRootEl = target.closest ? target.closest('.text-full-editor, .tfe-studio, .text-full-editor-table-picker, .text-full-editor-floating') : null;
            var inEditorPanel = Boolean(!tfeRootEl && editorPanel && editorPanel.contains(target));
            var isElevated = Boolean(tfeRootEl || (target.closest && target.closest('.ds-editor-menu, .ds-select-menu, .ds-dialog-host-backdrop, .ds-dialog-backdrop')));
            flyout.classList.toggle('is-elevated', isElevated);
            if (this._shadowEl) this._shadowEl.classList.toggle('is-elevated', isElevated);

            var anchorLeft;
            var anchorRight;
            if (menuEl) {
                var menuRect = menuEl.getBoundingClientRect();
                var alignedToEditorPanel = !tfeRootEl && panelRect && panelRect.width > 0
                    && menuRect.left >= panelRect.left - 12
                    && menuRect.right <= panelRect.right + 12;
                anchorLeft = alignedToEditorPanel ? panelRect.left : menuRect.left;
                anchorRight = alignedToEditorPanel ? panelRect.right : menuRect.right;
            } else if (inEditorPanel && panelRect && panelRect.width > 0) {
                anchorLeft = panelRect.left;
                anchorRight = panelRect.right;
            } else {
                anchorLeft = targetRect.left;
                anchorRight = targetRect.right;
            }

            var cardWidth = (isList || isTopicPreview) ? 320 : 290;
            var arrowWidth = 8;
            var arrowHeight = 16;
            var cornerRadius = 14;
            var windowWidth = window.innerWidth || document.documentElement.clientWidth;
            var windowHeight = window.innerHeight || document.documentElement.clientHeight;

            var totalFlyoutWidth = cardWidth + arrowWidth;
            var rightSlotLeft = anchorRight + 4;
            var leftSlotLeft = anchorLeft - totalFlyoutWidth - 4;
            var arrowSide;
            var left;

            var preferLeft = Boolean(tfeRootEl && target.closest && target.closest('.tfe-palette, .tfe-block-handle, .tfe-nested-handle, .tfe-list-item-handle'));
            if (preferLeft) {
                if (leftSlotLeft >= 12) {
                    arrowSide = 'right';
                    left = leftSlotLeft;
                } else if (rightSlotLeft + totalFlyoutWidth <= windowWidth - 16) {
                    arrowSide = 'left';
                    left = rightSlotLeft;
                } else {
                    arrowSide = 'none';
                    left = Math.max(16, Math.min(windowWidth - cardWidth - 16, targetRect.left));
                }
            } else if (rightSlotLeft + totalFlyoutWidth <= windowWidth - 16) {
                arrowSide = 'left';
                left = rightSlotLeft;
            } else if (leftSlotLeft >= 16) {
                arrowSide = 'right';
                left = leftSlotLeft;
            } else {
                arrowSide = 'none';
                left = Math.max(16, Math.min(windowWidth - cardWidth - 16, targetRect.left));
            }

            flyout.classList.toggle('is-inline-mode', arrowSide === 'none');
            flyout.classList.toggle('is-arrow-right', arrowSide === 'right');
            flyout.style.width = (arrowSide === 'none' ? cardWidth : totalFlyoutWidth) + 'px';

            // Target vertical center
            var targetCenterY = targetRect.top + (targetRect.height / 2);

            // Compute flyout height
            flyout.style.visibility = 'hidden';
            flyout.style.height = '';
            flyout.classList.remove('hidden');
            var flyoutHeight = (this._contentEl && this._contentEl.offsetHeight) ? this._contentEl.offsetHeight : (flyout.offsetHeight || 120);
            flyout.style.height = flyoutHeight + 'px';
            flyout.style.visibility = '';

            var top = targetCenterY - (flyoutHeight / 2);
            var minTop = 16;
            var maxTop = Math.max(minTop, windowHeight - flyoutHeight - 16);
            var clampedTop = Math.max(minTop, Math.min(maxTop, top));

            flyout.style.left = Math.round(left) + 'px';
            flyout.style.top = Math.round(clampedTop) + 'px';

            // Align caret arrow with target center
            var arrowY = Math.round(targetCenterY - clampedTop);

            // Build and apply unified vector frame path
            var hasArrow = arrowSide !== 'none';
            var pathStr = this._buildPath(cardWidth, flyoutHeight, cornerRadius, arrowWidth, arrowHeight, arrowY, arrowSide);
            if (this._frameSvg) {
                this._frameSvg.setAttribute('viewBox', '0 0 ' + (hasArrow ? totalFlyoutWidth : cardWidth) + ' ' + flyoutHeight);
            }
            if (this._framePath) {
                this._framePath.setAttribute('d', pathStr);
            }

            // Apply clipPath directly to the glass flyout element
            flyout.style.clipPath = 'path("' + pathStr + '")';
            flyout.style.webkitClipPath = 'path("' + pathStr + '")';

            // Position sibling shadow element behind the card body
            if (this._shadowEl) {
                var shadowLeft = arrowSide === 'left' ? (left + arrowWidth) : left;
                this._shadowEl.style.left = Math.round(shadowLeft) + 'px';
                this._shadowEl.style.top = Math.round(clampedTop) + 'px';
                this._shadowEl.style.width = cardWidth + 'px';
                this._shadowEl.style.height = flyoutHeight + 'px';
            }
        },

        hideImmediately: function () {
            clearTimeout(this._showTimer);
            clearTimeout(this._fadeTimer);
            this._stopLiveTopicRefresh();
            this._activeTarget = null;
            this._activeData = null;
            this._topicValueEl = null;
            this._topicValueText = null;
            this._isHoveringFlyout = false;

            if (this._el) {
                this._el.classList.remove('is-visible', 'is-fading', 'is-elevated', 'is-arrow-right', 'is-inline-mode', 'is-topic-preview', 'is-place-above', 'is-place-below');
                this._el.classList.add('hidden');
                this._el.setAttribute('aria-hidden', 'true');
            }
            if (this._shadowEl) {
                this._shadowEl.classList.remove('is-visible', 'is-fading', 'is-elevated');
                this._shadowEl.classList.add('hidden');
            }
        }
    };

    global.EditorTooltip = EditorTooltip;
})(typeof window !== 'undefined' ? window : this);
