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
        _showTimer: null,
        _fadeTimer: null,
        _isHoveringFlyout: false,
        _initialized: false,

        HOVER_INTENT_MS: 180,
        FADE_GRACE_MS: 500,

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
            if (!enabled) {
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

            // Capture-phase mouseover strips browser native titles everywhere to prevent double tips
            document.addEventListener('mouseover', function (e) {
                var titledEl = e.target.closest ? e.target.closest('[title]') : null;
                if (titledEl && titledEl !== self._helpBtn) {
                    var t = titledEl.getAttribute('title');
                    if (t) {
                        titledEl.setAttribute('data-stored-title', t);
                        titledEl.removeAttribute('title');
                    }
                }

                if (!self.syncState()) {
                    if (self._activeTarget) self._onTargetLeave();
                    return;
                }

                if (self._el && self._el.contains(e.target)) {
                    return;
                }

                var resolved = self.resolveTarget(e.target);
                if (!resolved) {
                    if (self._activeTarget && !self._activeTarget.contains(e.target)) {
                        self._onTargetLeave();
                    }
                    return;
                }

                var target = resolved.el;
                self._onTargetEnter(target, resolved.data);
            }, true);

            document.addEventListener('mouseout', function (e) {
                if (!self._activeTarget) return;

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

            document.addEventListener('pointerdown', function (e) {
                if (self._el && !self._el.contains(e.target) && (!self._activeTarget || !self._activeTarget.contains(e.target))) {
                    self.hideImmediately();
                }
            }, true);

            window.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    self.hideImmediately();
                }
            });

            window.addEventListener('resize', function () {
                self.hideImmediately();
            }, { passive: true });
        },

        resolveTarget: function (rawTarget) {
            if (!rawTarget || !rawTarget.closest) return null;

            // Expand matching candidates to include buttons, controls, labels, and theme elements
            var target = rawTarget.closest(
                '[data-editor-tooltip], .control-label, [data-field-key], ' +
                'button, .btn-tool, .btn-bind, .btn-reset, .editor-color-btn, ' +
                '.dashboard-viewer-url-copy, .theme-correction-name, .toolbar-label, [data-bind-key], [data-reset-key]'
            );
            if (!target) return null;

            // Do not trigger tooltip on flyout's own internal elements
            if (this._el && this._el.contains(target)) return null;

            var key = target.getAttribute('data-editor-tooltip');
            var widgetType = target.getAttribute('data-widget-type');

            if (!key) {
                var fieldWrap = target.closest('[data-field-key]');
                if (fieldWrap) {
                    key = fieldWrap.getAttribute('data-field-key');
                }
            }

            if (!widgetType) {
                var typedEl = target.closest('[data-widget-type]');
                if (typedEl) widgetType = typedEl.getAttribute('data-widget-type');
            }

            if (!widgetType) {
                if (typeof Editor !== 'undefined' && Editor.currentId && typeof Dashboard !== 'undefined' && Dashboard.widgets) {
                    widgetType = widgetTypeFromInstance(Dashboard.widgets[Editor.currentId]);
                }
            }

            var metadata = getMetadata();

            // Identify specialized button classes
            if (!key) {
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

            if (!key && target.textContent && (target.classList.contains('control-label') || target.classList.contains('toolbar-label'))) {
                key = target.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
            }

            var data = null;
            if (key) {
                data = lookupTooltip(metadata, widgetType, key);
            }

            // Fallback for buttons or elements with stored title or aria-label
            if (!data) {
                var hint = target.getAttribute('data-stored-title') || target.getAttribute('title') || target.getAttribute('aria-label') || target.getAttribute('data-field-hint');
                if (hint) {
                    var cleanHint = hint.replace(/[—;]/g, ', ').replace(/\s+/g, ' ').trim();
                    var labelText = target.getAttribute('aria-label') || (target.textContent ? target.textContent.trim() : '');
                    if (!labelText || labelText.length > 30) {
                        labelText = target.tagName === 'BUTTON' ? 'Action' : (key || 'Setting');
                    }
                    data = {
                        title: labelText,
                        description: cleanHint,
                        help: null
                    };
                }
            }

            return data ? { el: target, key: key || 'target', widgetType: widgetType, data: data } : null;
        },

        _onTargetEnter: function (target, data) {
            if (!this.isEnabled()) return;
            var self = this;
            clearTimeout(this._showTimer);
            clearTimeout(this._fadeTimer);

            if (!data) return;

            var isAlreadyVisible = this._el && !this._el.classList.contains('hidden');

            if (this._activeTarget === target && isAlreadyVisible) {
                this._cancelFadeGrace();
                return;
            }

            this._activeTarget = target;

            // Warm-switch immediately if already visible; apply hover-intent delay on cold starts
            if (isAlreadyVisible) {
                this._cancelFadeGrace();
                this._renderAndShow(target, data);
            } else {
                this._showTimer = setTimeout(function () {
                    if (!self.isEnabled()) return;
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

        _renderAndShow: function (target, data) {
            if (!this._el) return;

            this._titleEl.textContent = data.title || '';
            this._bodyEl.textContent = data.description || '';

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

            this._positionFlyout(target);

            this._el.classList.remove('hidden', 'is-fading');
            this._el.classList.add('is-visible');
            this._el.setAttribute('aria-hidden', 'false');

            if (this._shadowEl) {
                this._shadowEl.classList.remove('hidden', 'is-fading');
                this._shadowEl.classList.add('is-visible');
            }
        },

        _buildPath: function (w, h, r, aw, ah, ay, hasArrow) {
            if (!hasArrow) {
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

        _positionFlyout: function (target) {
            var flyout = this._el;
            var editorPanel = document.getElementById('editor-panel');
            if (!flyout || !editorPanel) return;

            var panelRect = editorPanel.getBoundingClientRect();
            var targetRect = target.getBoundingClientRect();

            var cardWidth = 290;
            var arrowWidth = 8;
            var arrowHeight = 16;
            var cornerRadius = 14;
            var windowWidth = window.innerWidth || document.documentElement.clientWidth;
            var windowHeight = window.innerHeight || document.documentElement.clientHeight;

            // Preferred: Docked to right edge of #editor-panel with 4px gap to arrow tip
            var dockedPreferredLeft = panelRect.right + 4;
            var totalFlyoutWidth = cardWidth + arrowWidth;
            var isNarrow = (dockedPreferredLeft + totalFlyoutWidth > windowWidth - 16);
            var hasArrow = !isNarrow;

            var left;
            if (isNarrow) {
                left = Math.max(16, Math.min(windowWidth - cardWidth - 16, targetRect.left));
                flyout.classList.add('is-inline-mode');
                flyout.style.width = cardWidth + 'px';
            } else {
                left = dockedPreferredLeft;
                flyout.classList.remove('is-inline-mode');
                flyout.style.width = totalFlyoutWidth + 'px';
            }

            // Target vertical center
            var targetCenterY = targetRect.top + (targetRect.height / 2);

            // Compute flyout height
            flyout.style.visibility = 'hidden';
            flyout.classList.remove('hidden');
            var flyoutHeight = (this._contentEl && this._contentEl.offsetHeight) ? this._contentEl.offsetHeight : (flyout.offsetHeight || 120);
            flyout.style.height = flyoutHeight + 'px';
            flyout.style.visibility = '';

            var top = targetCenterY - (flyoutHeight / 2);
            var minTop = 16;
            var maxTop = windowHeight - flyoutHeight - 16;
            var clampedTop = Math.max(minTop, Math.min(maxTop, top));

            flyout.style.left = Math.round(left) + 'px';
            flyout.style.top = Math.round(clampedTop) + 'px';

            // Align caret arrow with target center
            var arrowY = Math.round(targetCenterY - clampedTop);

            // Build and apply unified vector frame path
            var pathStr = this._buildPath(cardWidth, flyoutHeight, cornerRadius, arrowWidth, arrowHeight, arrowY, hasArrow);
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
                var shadowLeft = hasArrow ? (dockedPreferredLeft + arrowWidth) : left;
                this._shadowEl.style.left = Math.round(shadowLeft) + 'px';
                this._shadowEl.style.top = Math.round(clampedTop) + 'px';
                this._shadowEl.style.width = cardWidth + 'px';
                this._shadowEl.style.height = flyoutHeight + 'px';
            }
        },

        hideImmediately: function () {
            clearTimeout(this._showTimer);
            clearTimeout(this._fadeTimer);
            this._activeTarget = null;
            this._isHoveringFlyout = false;

            if (this._el) {
                this._el.classList.remove('is-visible', 'is-fading');
                this._el.classList.add('hidden');
                this._el.setAttribute('aria-hidden', 'true');
            }
            if (this._shadowEl) {
                this._shadowEl.classList.remove('is-visible', 'is-fading');
                this._shadowEl.classList.add('hidden');
            }
        }
    };

    global.EditorTooltip = EditorTooltip;
})(typeof window !== 'undefined' ? window : this);
