/**
 * Dashboard Studio - Editor Tooltip Controller
 * Provides descriptive inspector flyout tooltips with interactive hover bridge,
 * 500ms fade-away grace period with hover rescue, and deep help integration.
 */
(function (global) {
    'use strict';

    var SETTINGS_METADATA = {
        'editor-tools': {
            title: 'Editor Tools',
            description: 'Global editor utilities and quick drawers: upload and manage media in Image and Audio Galleries, share snippets, run automated Tools scripts, cycle the editor theme, or open documentation.',
            help: {
                topic: 'Editor Interface Guide',
                anchor: '2-editor-tools'
            }
        },
        'editor-zoom': {
            title: 'Edit Mode Zoom',
            description: 'Scales the entire dashboard canvas between 20% and 200% while in Edit Mode. Fit larger layouts on compact laptop screens or zoom in for precision editing without affecting runtime view mode.',
            help: {
                topic: 'Editor Interface Guide',
                anchor: '2-editor-tools'
            }
        },
        'viewer-url': {
            title: 'Viewer URL',
            description: 'Direct browser link to run this dashboard in standalone view mode without editor chrome. Also provides actions to save or load with Homey, export or import local files, and reset the canvas.',
            help: {
                topic: 'Editor Interface Guide',
                anchor: '3-viewer-url-dashboard-files'
            }
        },
        'theme': {
            title: 'Theme',
            description: 'Active color palette and visual styling preset. Cycle through installed themes, browse live previews in the Theme Explorer dialog, or import and export theme files.',
            help: {
                topic: 'Editor Interface Guide',
                anchor: '4-theme'
            }
        },
        'create-widget': {
            title: 'Create Widget',
            description: 'Select any widget type (Switch, Slider, Gauge, Text, Clock, and more) from the dropdown and add a new widget instance directly to the center of your active canvas page.',
            help: {
                topic: 'Editor Interface Guide',
                anchor: '5-create-widget'
            }
        },
        'selected-widget': {
            title: 'Selected Widget',
            description: 'Quick actions for the currently selected widget: lock or unlock positioning, adjust layer order (bring forward or send back), reset colors to theme, move to page, duplicate, or delete.',
            help: {
                topic: 'Editor Interface Guide',
                anchor: '6-selected-widget-tools'
            }
        },
        'universal-actions': {
            title: 'Universal Actions',
            description: 'Global clipboard commands (Copy, Cut, Paste), step-by-step history (Undo, Redo), multi-widget grouping tools, and dashboard page insertion or deletion.',
            help: {
                topic: 'Editor Interface Guide',
                anchor: '7-universal-actions'
            }
        }
    };

    var EditorTooltip = {
        HOVER_INTENT_MS: 180,
        FADE_GRACE_MS: 500,

        _el: null,
        _backdropEl: null,
        _frameSvg: null,
        _framePath: null,
        _contentEl: null,
        _titleEl: null,
        _bodyEl: null,
        _helpBtn: null,

        _activeTarget: null,
        _activeHelpSpec: null,
        _showTimer: null,
        _fadeTimer: null,
        _isHoveringFlyout: false,
        _initialized: false,

        /** Returns whether editor tooltips are enabled via master settings. */
        isEnabled: function () {
            if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.editorTooltips === false) {
                return false;
            }
            return true;
        },

        /** Initialize the singleton tooltip DOM element and global listeners. */
        init: function () {
            if (this._initialized) return;
            if (typeof window === 'undefined' || window.IS_VIEWER === true) return;
            if (!document.body) {
                var self = this;
                document.addEventListener('DOMContentLoaded', function () { self.init(); });
                return;
            }

            this._buildFlyoutDom();
            this._bindGlobalEvents();
            this._initialized = true;
        },

        _buildFlyoutDom: function () {
            if (this._el) return;

            var flyout = document.createElement('div');
            flyout.id = 'editor-tooltip-flyout';
            flyout.className = 'editor-tooltip-flyout hidden';
            flyout.setAttribute('role', 'tooltip');
            flyout.setAttribute('aria-hidden', 'true');

            var backdrop = document.createElement('div');
            backdrop.className = 'editor-tooltip-backdrop';
            backdrop.setAttribute('aria-hidden', 'true');
            flyout.appendChild(backdrop);

            var frameSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            frameSvg.setAttribute('class', 'editor-tooltip-frame');
            frameSvg.setAttribute('aria-hidden', 'true');

            var framePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            framePath.setAttribute('class', 'editor-tooltip-frame-path');
            frameSvg.appendChild(framePath);
            flyout.appendChild(frameSvg);

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

            content.appendChild(header);

            var body = document.createElement('div');
            body.className = 'editor-tooltip-body';
            content.appendChild(body);

            flyout.appendChild(content);

            document.body.appendChild(flyout);

            this._el = flyout;
            this._backdropEl = backdrop;
            this._frameSvg = frameSvg;
            this._framePath = framePath;
            this._contentEl = content;
            this._titleEl = title;
            this._bodyEl = body;
            this._helpBtn = helpBtn;

            var self = this;

            // Hover Bridge on the flyout itself (Rescue Window)
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

        _bindGlobalEvents: function () {
            var self = this;

            // Event delegation on mouseover / mouseout for elements with data-editor-tooltip
            document.addEventListener('mouseover', function (e) {
                if (!self.isEnabled()) {
                    self.hideImmediately();
                    return;
                }
                var target = e.target ? e.target.closest('[data-editor-tooltip]') : null;
                if (!target) return;

                var tooltipKey = target.getAttribute('data-editor-tooltip');
                if (!tooltipKey || !SETTINGS_METADATA[tooltipKey]) return;

                if (self._activeTarget === target && self._el && !self._el.classList.contains('hidden')) {
                    self._cancelFadeGrace();
                    return;
                }

                self._onTargetEnter(target, tooltipKey);
            });

            document.addEventListener('mouseout', function (e) {
                var target = e.target ? e.target.closest('[data-editor-tooltip]') : null;
                if (!target) return;

                // Moving to an element inside the same target does not count as leaving
                if (e.relatedTarget && target.contains(e.relatedTarget)) return;

                if (self._activeTarget === target) {
                    self._onTargetLeave();
                }
            });

            // Dismiss immediately on scroll so tooltip doesn't float detached
            var scrollContainer = document.getElementById('editor-scroll-container');
            if (scrollContainer) {
                scrollContainer.addEventListener('scroll', function () {
                    self.hideImmediately();
                }, { passive: true });
            }

            // Dismiss immediately on click outside or escape key
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

        _onTargetEnter: function (target, key) {
            if (!this.isEnabled()) return;
            var self = this;
            clearTimeout(this._showTimer);

            var data = SETTINGS_METADATA[key];
            if (!data) return;

            var isAlreadyVisible = this._el && !this._el.classList.contains('hidden');

            if (this._activeTarget === target && isAlreadyVisible) {
                this._cancelFadeGrace();
                return;
            }

            this._activeTarget = target;

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

            this._fadeTimer = setTimeout(function () {
                if (!self._isHoveringFlyout) {
                    self.hideImmediately();
                }
            }, this.FADE_GRACE_MS);
        },

        _cancelFadeGrace: function () {
            clearTimeout(this._fadeTimer);
            if (this._el) {
                this._el.classList.remove('is-fading');
            }
        },

        _renderAndShow: function (target, data) {
            if (!this._el || !target || !data) return;

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
            if (this._backdropEl) {
                this._backdropEl.style.clipPath = 'path("' + pathStr + '")';
                this._backdropEl.style.webkitClipPath = 'path("' + pathStr + '")';
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
        }
    };

    global.EditorTooltip = EditorTooltip;

    // Auto-initialize on ready
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { EditorTooltip.init(); });
        } else {
            EditorTooltip.init();
        }
    }
})(typeof window !== 'undefined' ? window : this);
