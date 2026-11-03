const PRESET_THEMES = {
    "default_dark": {
        "name": "Default Dark",
        "previewImage": "images/theme-preview/default_dark.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "radial",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 80,
                    "endOpacity": 80,
                    "angle": 145,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 34,
                    "opacity": 26
                },
                "border": {
                    "width": 1,
                    "opacity": 100,
                    "cornerRadius": 12
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#102447",
                    "backgroundAccent": "#020C1F",
                    "surface": "#0F2E52",
                    "surfaceAlt": "#010E26",
                    "surfaceHover": "#334155",
                    "overlay": "#0f172a",
                    "text": "#f8fafc",
                    "textMuted": "#94a3b8",
                    "onSurface": "#f8fafc",
                    "onAccent": "#083344",
                    "accent": "#67e8f9",
                    "accentSoft": "#22d3ee",
                    "accentSecondary": "#06b6d4",
                    "accentOff": "#1e3a5f",
                    "controlOff": "#475569",
                    "thumb": "#ffffff",
                    "border": "#1E3A5F",
                    "borderAccent": "#1A3869",
                    "icon": "#C7D9FF",
                    "iconAccent": "#233B70",
                    "iconMuted": "#64748b",
                    "success": "#22c55e",
                    "warning": "#f59e0b",
                    "danger": "#ef4444",
                    "glow": "#06b6d4",
                    "link": "#22d3ee",
                    "placeholder": "#64748b",
                    "markerTint1": "#b06d7f",
                    "markerTint2": "#b89f5c",
                    "markerTint3": "#6f7eb8",
                    "markerTint4": "#3d9590"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 12,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 36,
                    "fillThickness": 24,
                    "thumbSize": 29,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 8
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "dark_glass": {
        "name": "Dark Glass",
        "previewImage": "images/theme-preview/dark_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "image": "/images/dark-theme.jpg",
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "size": "cover",
                        "type": "radial",
                        "angle": 0,
                        "overlay": false
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 10,
                    "blur": 10,
                    "endOpacity": 10,
                    "angle": 135
                },
                "border": {
                    "opacity": 80,
                    "cornerRadius": 14,
                    "width": 1
                },
                "innerGlow": {
                    "size": 20,
                    "opacity": 60
                },
                "glow": {
                    "enabled": false,
                    "radius": 20,
                    "opacity": 30
                }
            },
            "theme": {
                "colors": {
                    "background": "#102447",
                    "backgroundAccent": "#020C1F",
                    "surface": "#0F2E52",
                    "surfaceAlt": "#010E26",
                    "surfaceHover": "#334155",
                    "overlay": "#0f172a",
                    "text": "#f8fafc",
                    "textMuted": "#94a3b8",
                    "onSurface": "#f8fafc",
                    "onAccent": "#083344",
                    "accent": "#67e8f9",
                    "accentSoft": "#22d3ee",
                    "accentSecondary": "#06b6d4",
                    "accentOff": "#1e3a5f",
                    "controlOff": "#475569",
                    "thumb": "#ffffff",
                    "border": "#1E3A5F",
                    "borderAccent": "#4DA4EB",
                    "icon": "#C7D9FF",
                    "iconAccent": "#233B70",
                    "iconMuted": "#64748b",
                    "success": "#22c55e",
                    "warning": "#f59e0b",
                    "danger": "#ef4444",
                    "glow": "#06b6d4",
                    "link": "#22d3ee",
                    "placeholder": "#64748b",
                    "markerTint1": "#b06d7f",
                    "markerTint2": "#b89f5c",
                    "markerTint3": "#6f7eb8",
                    "markerTint4": "#3d9590"
                }
            },
            "widgetDefaults": {
                "gauge": {
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 13,
                    "trackInnerGlowOpacity": 60,
                    "barOpacity": 50,
                    "barOutlineWidth": 1,
                    "barOutlineOpacity": 90,
                    "barInnerGlow": 14,
                    "barInnerGlowOpacity": 90,
                    "trackThickness": 16,
                    "barThickness": 12
                },
                "graph": {},
                "lightgrid": {
                    "tileBackgroundOpacity": 50,
                    "tileBlur": 5,
                    "tileOutlineWidth": 1,
                    "tileOutlineOpacity": 80,
                    "tileInnerGlow": 25,
                    "tileInnerGlowOpacity": 40
                },
                "menu": {
                    "itemBackgroundOnOpacity": 50,
                    "itemBackgroundOffOpacity": 50,
                    "itemBackgroundHoverOpacity": 50,
                    "itemBlur": 5,
                    "itemOutlineWidth": 1,
                    "itemOutlineOpacity": 80,
                    "itemInnerGlow": 25,
                    "itemInnerGlowOpacity": 60
                },
                "slider": {
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 25,
                    "trackInnerGlowOpacity": 60,
                    "fillOpacity": 50,
                    "fillOutlineWidth": 1,
                    "fillOutlineOpacity": 90,
                    "fillInnerGlow": 14,
                    "fillInnerGlowOpacity": 90,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60,
                    "trackThickness": 28,
                    "fillThickness": 20,
                    "thumbSize": 28
                },
                "switch": {
                    "backgroundOpacity": 50,
                    "buttonBlur": 5,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60,
                    "outlineWidth": 1,
                    "outlineOpacity": 80,
                    "buttonInnerGlow": 25,
                    "buttonInnerGlowOpacity": 60,
                    "buttonRadius": 14
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 8
                }
            }
        }
    },
    "cyberpunk": {
        "name": "Cyberpunk Neon",
        "previewImage": "images/theme-preview/cyberpunk.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "radial",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Oswald', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 80,
                    "endOpacity": 90,
                    "angle": 135,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 25,
                    "opacity": 80
                },
                "border": {
                    "width": 2,
                    "opacity": 80,
                    "cornerRadius": 7
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#0a0018",
                    "backgroundAccent": "#1e0838",
                    "surface": "#2d1b4e",
                    "surfaceAlt": "#1e1040",
                    "surfaceHover": "#4c1d95",
                    "overlay": "#130024",
                    "text": "#f0f0f0",
                    "textMuted": "#c4b5d0",
                    "onSurface": "#f0f0f0",
                    "onAccent": "#0a0018",
                    "accent": "#66ffff",
                    "accentSoft": "#00ffff",
                    "accentSecondary": "#00cccc",
                    "accentOff": "#3b1a5c",
                    "controlOff": "#7c3aed",
                    "thumb": "#ffffff",
                    "border": "#2d1050",
                    "borderAccent": "#d946ef",
                    "icon": "#00ffff",
                    "iconAccent": "#7D1785",
                    "iconMuted": "#c084fc",
                    "success": "#22c55e",
                    "warning": "#eab308",
                    "danger": "#ff003c",
                    "glow": "#00ffff",
                    "link": "#f0abfc",
                    "placeholder": "#a855f7",
                    "markerTint1": "#db2777",
                    "markerTint2": "#84cc16",
                    "markerTint3": "#9333ea",
                    "markerTint4": "#f97316"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 4,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 30,
                    "fillThickness": 20,
                    "thumbSize": 25,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 16,
                    "gap": 6,
                    "textTransform": "uppercase",
                    "fontFamily": "'Oswald', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 30,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 80
                },
                "editbox": {
                    "borderRadius": 3
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "neon_low_poly_dark_glass": {
        "name": "Neon Low-Poly Dark Glass",
        "previewImage": "images/theme-preview/neon_low_poly_dark_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startColor": "#12082a",
                        "startOpacity": 100,
                        "endColor": "#3b1d78",
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 135,
                        "overlay": false,
                        "image": "/images/neon-low-poly-theme.jpg",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Oswald', sans-serif",
                "label": {
                    "color": "@textMuted"
                },
                "value": {
                    "color": "@text"
                }
            },
            "container": {
                "background": {
                    "startColor": "#7c3aed",
                    "startOpacity": 44,
                    "endColor": "#22d3ee",
                    "endOpacity": 30,
                    "angle": 135,
                    "blur": 14
                },
                "glow": {
                    "enabled": true,
                    "color": "@glow",
                    "radius": 18,
                    "opacity": 30
                },
                "border": {
                    "color": "#f0abfc",
                    "width": 1,
                    "opacity": 55,
                    "cornerRadius": 8
                },
                "innerGlow": {
                    "size": 5,
                    "color": "#e9d5ff",
                    "opacity": 24
                }
            },
            "theme": {
                "colors": {
                    "background": "#12082a",
                    "backgroundAccent": "#3b1d78",
                    "surface": "#2a1860",
                    "surfaceAlt": "#1a1040",
                    "surfaceHover": "#4c2490",
                    "overlay": "#0a0418",
                    "text": "#f4f7ff",
                    "textMuted": "#c9c0e0",
                    "onSurface": "#f4f7ff",
                    "onAccent": "#0a0418",
                    "accent": "#3ee0ff",
                    "accentSoft": "#22d3ee",
                    "accentSecondary": "#ff3d8a",
                    "accentOff": "#3d2a68",
                    "controlOff": "#4c2d86",
                    "thumb": "#ffffff",
                    "border": "#6d4ca8",
                    "borderAccent": "#ff3d8a",
                    "icon": "#e8fbff",
                    "iconAccent": "#2a1860",
                    "iconMuted": "#b09ad4",
                    "success": "#b6f25c",
                    "warning": "#ffd24a",
                    "danger": "#ff2d55",
                    "glow": "#3ee0ff",
                    "link": "#ff7ad9",
                    "placeholder": "#b09ad4",
                    "markerTint1": "#3ee0ff",
                    "markerTint2": "#ff3d8a",
                    "markerTint3": "#ffd24a",
                    "markerTint4": "#b6f25c"
                }
            },
            "widgetDefaults": {
                "arrow": {
                    "mainColor": "@accent",
                    "glowColor": "@accentSecondary",
                    "thickness": 8,
                    "headSize": 26,
                    "lineRadius": 2,
                    "glowWidth": 12,
                    "glowOpacity": 50
                },
                "editbox": {
                    "backgroundColor": "#ffffff",
                    "backgroundOpacity": 10,
                    "borderColor": "#ffffff",
                    "borderWidth": 1,
                    "borderRadius": 6
                },
                "gauge": {
                    "barGlow": true,
                    "trackThickness": 14,
                    "trackOpacity": 28,
                    "trackBlur": 10,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffffff",
                    "trackOutlineOpacity": 42,
                    "trackInnerGlow": 4,
                    "trackInnerGlowColor": "#ffffff",
                    "trackInnerGlowOpacity": 34,
                    "barThickness": 10,
                    "barOpacity": 88,
                    "barOutlineWidth": 0,
                    "barInnerGlow": 3,
                    "barInnerGlowOpacity": 30,
                    "barOutlineOpacity": 80
                },
                "graph": {
                    "lineWidth": 2,
                    "lineColor": "@accent",
                    "fill": true,
                    "fillColor": "@accent",
                    "fillOpacity": 22,
                    "barOutlineWidth": 0,
                    "barRadius": 2,
                    "pointSize": 4,
                    "pointColor": "@accentSecondary"
                },
                "lightgrid": {
                    "tileBackgroundColor": "#ffffff",
                    "tileBackgroundOpacity": 12,
                    "tileHoverColor": "@accent",
                    "tileBlur": 8,
                    "tileOutlineWidth": 1,
                    "tileOutlineColor": "#ffffff",
                    "tileOutlineOpacity": 46,
                    "tileInnerGlow": 3,
                    "tileInnerGlowColor": "#ffffff",
                    "tileInnerGlowOpacity": 32,
                    "iconColorOff": "@iconMuted",
                    "iconColorOn": "@accent"
                },
                "list": {
                    "gap": 6,
                    "textColor": "@text",
                    "timeColor": "@textMuted",
                    "iconColor": "@accent"
                },
                "menu": {
                    "itemCornerRadius": 6,
                    "itemBackgroundOn": "@accent",
                    "itemBackgroundOnOpacity": 46,
                    "itemBackgroundOff": "#ffffff",
                    "itemBackgroundOffOpacity": 10,
                    "itemBackgroundHover": "@accentSecondary",
                    "itemBackgroundHoverOpacity": 28,
                    "itemBlur": 8,
                    "itemOutlineWidth": 1,
                    "itemOutlineColor": "#ffffff",
                    "itemOutlineOpacity": 44,
                    "itemInnerGlow": 3,
                    "itemInnerGlowColor": "#ffffff",
                    "itemInnerGlowOpacity": 32
                },
                "slider": {
                    "trackColor": "@controlOff",
                    "fillColor": "@accent",
                    "thumbColor": "@thumb",
                    "trackThickness": 16,
                    "trackOpacity": 28,
                    "trackBlur": 8,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffffff",
                    "trackOutlineOpacity": 44,
                    "trackInnerGlow": 3,
                    "trackInnerGlowColor": "#ffffff",
                    "trackInnerGlowOpacity": 30,
                    "fillThickness": 12,
                    "fillOpacity": 88,
                    "fillOutlineWidth": 0,
                    "fillInnerGlow": 2,
                    "fillInnerGlowOpacity": 28,
                    "thumbSize": 20,
                    "thumbShadow": false,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "@accentSecondary",
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 3,
                    "thumbInnerGlowOpacity": 32,
                    "fillOutlineOpacity": 80
                },
                "switch": {
                    "backgroundColorOn": "@accent",
                    "backgroundColorOff": "@controlOff",
                    "backgroundColorHover": "@accentSecondary",
                    "thumbColor": "@thumb",
                    "buttonRadius": 8,
                    "backgroundOpacity": 48,
                    "buttonBlur": 10,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "@accentSecondary",
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 3,
                    "thumbInnerGlowOpacity": 32,
                    "enableGlow": true,
                    "glowColor": "@glow",
                    "glowRadius": 12,
                    "outlineWidth": 1,
                    "outlineColor": "#ffffff",
                    "outlineOpacity": 55,
                    "buttonInnerGlow": 4,
                    "buttonInnerGlowColor": "#ffffff",
                    "buttonInnerGlowOpacity": 40
                }
            }
        }
    },
    "neon_low_poly_light_glass": {
        "name": "Neon Low-Poly Light Glass",
        "previewImage": "images/theme-preview/neon_low_poly_light_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "image": "/images/neon-low-poly-theme.jpg",
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "size": "cover",
                        "type": "radial",
                        "angle": 0,
                        "overlay": false
                    }
                }
            },
            "typography": {
                "fontFamily": "'Oswald', sans-serif"
            },
            "container": {
                "border": {
                    "cornerRadius": 7,
                    "width": 2,
                    "opacity": 80
                },
                "background": {
                    "startOpacity": 50,
                    "endOpacity": 10,
                    "angle": -45,
                    "blur": 35
                },
                "glow": {
                    "radius": 25,
                    "opacity": 80
                },
                "innerGlow": {
                    "size": 20,
                    "opacity": 60
                }
            },
            "theme": {
                "colors": {
                    "background": "#0a0018",
                    "backgroundAccent": "#1e0838",
                    "surface": "#2d1b4e",
                    "surfaceAlt": "#1e1040",
                    "surfaceHover": "#4c1d95",
                    "overlay": "#130024",
                    "text": "#f0f0f0",
                    "textMuted": "#c4b5d0",
                    "onSurface": "#f0f0f0",
                    "onAccent": "#0a0018",
                    "accent": "#66ffff",
                    "accentSoft": "#00ffff",
                    "accentSecondary": "#00cccc",
                    "accentOff": "#3b1a5c",
                    "controlOff": "#7c3aed",
                    "border": "#2d1050",
                    "borderAccent": "#d946ef",
                    "icon": "#00ffff",
                    "iconAccent": "#7D1785",
                    "iconMuted": "#c084fc",
                    "warning": "#eab308",
                    "danger": "#ff003c",
                    "glow": "#00ffff",
                    "link": "#f0abfc",
                    "placeholder": "#a855f7",
                    "markerTint1": "#db2777",
                    "markerTint2": "#84cc16",
                    "markerTint3": "#9333ea",
                    "markerTint4": "#f97316"
                }
            },
            "widgetDefaults": {
                "arrow": {
                    "glowOpacity": 80
                },
                "editbox": {
                    "borderRadius": 3
                },
                "gauge": {
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 13,
                    "trackInnerGlowOpacity": 60,
                    "barOpacity": 50,
                    "barOutlineWidth": 1,
                    "barOutlineOpacity": 60,
                    "barInnerGlow": 14,
                    "barInnerGlowOpacity": 40,
                    "trackThickness": 16,
                    "barThickness": 12
                },
                "graph": {
                    "fillOpacity": 30
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 50,
                    "tileBlur": 5,
                    "tileOutlineWidth": 1,
                    "tileOutlineOpacity": 80,
                    "tileInnerGlow": 25,
                    "tileInnerGlowOpacity": 40
                },
                "list": {
                    "gap": 6
                },
                "menu": {
                    "itemBackgroundOnOpacity": 50,
                    "itemBackgroundOffOpacity": 50,
                    "itemBackgroundHoverOpacity": 50,
                    "itemBlur": 5,
                    "itemOutlineWidth": 1,
                    "itemOutlineOpacity": 80,
                    "itemInnerGlow": 25,
                    "itemInnerGlowOpacity": 60
                },
                "slider": {
                    "trackThickness": 30,
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 25,
                    "trackInnerGlowOpacity": 60,
                    "fillThickness": 20,
                    "fillOpacity": 50,
                    "fillOutlineWidth": 1,
                    "fillOutlineOpacity": 60,
                    "fillInnerGlow": 14,
                    "fillInnerGlowOpacity": 40,
                    "thumbSize": 25,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60
                },
                "switch": {
                    "buttonRadius": 4,
                    "backgroundOpacity": 50,
                    "buttonBlur": 5,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60,
                    "outlineWidth": 2,
                    "outlineOpacity": 80,
                    "buttonInnerGlow": 25,
                    "buttonInnerGlowOpacity": 60
                }
            }
        }
    },
    "midnight_blue": {
        "name": "Midnight Pro",
        "previewImage": "images/theme-preview/midnight_blue.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 180,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 95,
                    "endOpacity": 100,
                    "angle": 160,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 60,
                    "opacity": 30
                },
                "border": {
                    "width": 1,
                    "opacity": 100,
                    "cornerRadius": 16
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#000000",
                    "backgroundAccent": "#0d1117",
                    "surface": "#161b22",
                    "surfaceAlt": "#0d1117",
                    "surfaceHover": "#21262d",
                    "overlay": "#010409",
                    "text": "#f0f6fc",
                    "textMuted": "#8b949e",
                    "onSurface": "#f0f6fc",
                    "onAccent": "#ffffff",
                    "accent": "#56d364",
                    "accentSoft": "#3fb950",
                    "accentSecondary": "#238636",
                    "accentOff": "#1a2a20",
                    "controlOff": "#484f58",
                    "thumb": "#ffffff",
                    "border": "#21262d",
                    "borderAccent": "#30363d",
                    "icon": "#3fb950",
                    "iconAccent": "#35570F",
                    "iconMuted": "#484f58",
                    "success": "#3fb950",
                    "warning": "#d29922",
                    "danger": "#f85149",
                    "glow": "#3fb950",
                    "link": "#58a6ff",
                    "placeholder": "#484f58",
                    "markerTint1": "#c5566a",
                    "markerTint2": "#c9a227",
                    "markerTint3": "#8b74c9",
                    "markerTint4": "#0f766e"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 16,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 36,
                    "fillThickness": 24,
                    "thumbSize": 29,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 25,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 12
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "executive_suite": {
        "name": "Executive Suite",
        "previewImage": "images/theme-preview/executive_suite.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear_mirror",
                        "angle": 135,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Oswald', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 95,
                    "endOpacity": 100,
                    "angle": 180,
                    "blur": 0
                },
                "glow": {
                    "enabled": false,
                    "radius": 0,
                    "opacity": 0
                },
                "border": {
                    "width": 1,
                    "opacity": 50,
                    "cornerRadius": 4
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#0e0c0a",
                    "backgroundAccent": "#1c1815",
                    "surface": "#2a2420",
                    "surfaceAlt": "#1e1a16",
                    "surfaceHover": "#3d3229",
                    "overlay": "#110e0c",
                    "text": "#fef3c7",
                    "textMuted": "#b4a594",
                    "onSurface": "#fef3c7",
                    "onAccent": "#241804",
                    "accent": "#e5c965",
                    "accentSoft": "#d4af37",
                    "accentSecondary": "#aa8823",
                    "accentOff": "#3d3020",
                    "controlOff": "#6b5e50",
                    "thumb": "#fef3c7",
                    "border": "#3a2e24",
                    "borderAccent": "#5c4a3b",
                    "icon": "#d4af37",
                    "iconAccent": "#7d3223",
                    "iconMuted": "#8a7d71",
                    "success": "#10b981",
                    "warning": "#f59e0b",
                    "danger": "#ef4444",
                    "glow": "#d4af37",
                    "link": "#f3e5ab",
                    "placeholder": "#8a7d71",
                    "markerTint1": "#bc5c68",
                    "markerTint2": "#1e9588",
                    "markerTint3": "#5b6bb5",
                    "markerTint4": "#6d8822"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 4,
                    "enableGlow": false,
                    "outlineWidth": 1,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": false,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 1,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 20,
                    "fillThickness": 16,
                    "thumbSize": 20,
                    "thumbShadow": true,
                    "trackOutlineWidth": 1,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Oswald', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 2
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "fintech_light": {
        "name": "FinTech Light",
        "previewImage": "images/theme-preview/fintech_light.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "flat",
                        "angle": 227,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 95,
                    "endOpacity": 95,
                    "angle": 135,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 40,
                    "opacity": 20
                },
                "border": {
                    "width": 1,
                    "opacity": 100,
                    "cornerRadius": 8
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#dce4f0",
                    "backgroundAccent": "#eef2f8",
                    "surface": "#ffffff",
                    "surfaceAlt": "#f8fafc",
                    "surfaceHover": "#e0e7ff",
                    "overlay": "#c7d2fe",
                    "text": "#1e1b4b",
                    "textMuted": "#64748b",
                    "onSurface": "#1e1b4b",
                    "onAccent": "#ffffff",
                    "accent": "#818cf8",
                    "accentSoft": "#6366f1",
                    "accentSecondary": "#4f46e5",
                    "accentOff": "#9fa8cb",
                    "controlOff": "#6366f1",
                    "thumb": "#ffffff",
                    "border": "#e0e7ff",
                    "borderAccent": "#c7d2fe",
                    "icon": "#4f46e5",
                    "iconAccent": "#b1d4f4",
                    "iconMuted": "#6366f1",
                    "success": "#10b981",
                    "warning": "#f59e0b",
                    "danger": "#ef4444",
                    "glow": "#6366f1",
                    "link": "#4f46e5",
                    "placeholder": "#94a3b8",
                    "markerTint1": "#fb7185",
                    "markerTint2": "#38bdf8",
                    "markerTint3": "#818cf8",
                    "markerTint4": "#34d399"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 8,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 4
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "industrial_monitor": {
        "name": "Industrial Monitor",
        "previewImage": "images/theme-preview/industrial_monitor.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear_mirror",
                        "angle": 135,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Roboto', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 90,
                    "blur": 0
                },
                "glow": {
                    "enabled": false,
                    "radius": 0,
                    "opacity": 0
                },
                "border": {
                    "width": 2,
                    "opacity": 100,
                    "cornerRadius": 2
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#0a0a0b",
                    "backgroundAccent": "#18181b",
                    "surface": "#27272a",
                    "surfaceAlt": "#1c1c1e",
                    "surfaceHover": "#3f3f46",
                    "overlay": "#0a0a0b",
                    "text": "#f4f4f5",
                    "textMuted": "#a1a1aa",
                    "onSurface": "#f4f4f5",
                    "onAccent": "#2e1800",
                    "accent": "#fbbf24",
                    "accentSoft": "#f59e0b",
                    "accentSecondary": "#d97706",
                    "accentOff": "#3b3424",
                    "controlOff": "#71717a",
                    "thumb": "#f4f4f5",
                    "border": "#27272a",
                    "borderAccent": "#52525b",
                    "icon": "#f59e0b",
                    "iconAccent": "#631606",
                    "iconMuted": "#71717a",
                    "success": "#22c55e",
                    "warning": "#f59e0b",
                    "danger": "#ef4444",
                    "glow": "#f59e0b",
                    "link": "#fbbf24",
                    "placeholder": "#71717a",
                    "markerTint1": "#a855f7",
                    "markerTint2": "#f43f5e",
                    "markerTint3": "#22d3ee",
                    "markerTint4": "#84cc16"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 2,
                    "enableGlow": false,
                    "outlineWidth": 2,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": false,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 2,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": false,
                    "trackOutlineWidth": 2,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Roboto', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 0
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "medical_teal": {
        "name": "Medical Teal",
        "previewImage": "images/theme-preview/medical_teal.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "radial",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 90,
                    "endOpacity": 80,
                    "angle": 180,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 15,
                    "opacity": 20
                },
                "border": {
                    "width": 1,
                    "opacity": 60,
                    "cornerRadius": 20
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#ccfbf1",
                    "backgroundAccent": "#e0faf3",
                    "surface": "#ffffff",
                    "surfaceAlt": "#f0fdfa",
                    "surfaceHover": "#99f6e4",
                    "overlay": "#5eead4",
                    "text": "#134e4a",
                    "textMuted": "#475569",
                    "onSurface": "#134e4a",
                    "onAccent": "#ffffff",
                    "accent": "#14b8a6",
                    "accentSoft": "#0d9488",
                    "accentSecondary": "#0f766e",
                    "accentOff": "#7ac5b6",
                    "controlOff": "#0d9488",
                    "thumb": "#ffffff",
                    "border": "#ccfbf1",
                    "borderAccent": "#5eead4",
                    "icon": "#0f766e",
                    "iconAccent": "#A6FFE3",
                    "iconMuted": "#0d9488",
                    "success": "#10b981",
                    "warning": "#f59e0b",
                    "danger": "#ef4444",
                    "glow": "#0d9488",
                    "link": "#0f766e",
                    "placeholder": "#94a3b8",
                    "markerTint1": "#fb7185",
                    "markerTint2": "#8b5cf6",
                    "markerTint3": "#1d4ed8",
                    "markerTint4": "#fdba74"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 20,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 28,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 16
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "dashboard_studio_light": {
        "name": "Dashboard Studio Light",
        "previewImage": "images/theme-preview/dashboard_studio_light.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "radial",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 90,
                    "endOpacity": 80,
                    "angle": 180,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 15,
                    "opacity": 20
                },
                "border": {
                    "width": 1,
                    "opacity": 60,
                    "cornerRadius": 20
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#e4ebf7",
                    "backgroundAccent": "#c7d2fe",
                    "surface": "#ffffff",
                    "surfaceAlt": "#ecf1fa",
                    "surfaceHover": "#dbeafe",
                    "overlay": "#c7d2fe",
                    "text": "#0f172a",
                    "textMuted": "#64748b",
                    "onSurface": "#0f172a",
                    "onAccent": "#ffffff",
                    "accent": "#2563eb",
                    "accentSoft": "#1d4ed8",
                    "accentSecondary": "#1e40af",
                    "accentOff": "#bfdbfe",
                    "controlOff": "#93c5fd",
                    "thumb": "#ffffff",
                    "border": "#dbeafe",
                    "borderAccent": "#93c5fd",
                    "icon": "#2563eb",
                    "iconAccent": "#93c5fd",
                    "iconMuted": "#64748b",
                    "success": "#5289ff",
                    "warning": "#d97706",
                    "danger": "#ef4444",
                    "glow": "#1d4ed8",
                    "link": "#2563eb",
                    "placeholder": "#64748b",
                    "markerTint1": "#2563eb",
                    "markerTint2": "#059669",
                    "markerTint3": "#d97706",
                    "markerTint4": "#8b5cf6"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "backgroundColorOn": "@glow",
                    "backgroundColorOff": "@accentOff",
                    "backgroundColorHover": "@controlOff",
                    "buttonRadius": 20,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "typography": {
                        "buttonLabelInside": {
                            "color": "@onAccent",
                            "colorOff": "@text"
                        }
                    },
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "trackColor": "@border",
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackColor": "@border",
                    "trackThickness": 28,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif",
                    "timeColor": "@textMuted"
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 16
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                }
            }
        }
    },
    "analytics_dashboard": {
        "name": "Analytics Pro",
        "previewImage": "images/theme-preview/analytics_dashboard.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 135,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 135,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 20,
                    "opacity": 25
                },
                "border": {
                    "width": 1,
                    "opacity": 100,
                    "cornerRadius": 6
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#020617",
                    "backgroundAccent": "#0f0b2e",
                    "surface": "#1e1b4b",
                    "surfaceAlt": "#130f35",
                    "surfaceHover": "#312e81",
                    "overlay": "#020617",
                    "text": "#fdf2f8",
                    "textMuted": "#c4b5d0",
                    "onSurface": "#fdf2f8",
                    "onAccent": "#ffffff",
                    "accent": "#f472b6",
                    "accentSoft": "#ec4899",
                    "accentSecondary": "#db2777",
                    "accentOff": "#3b1d50",
                    "controlOff": "#7c3aed",
                    "thumb": "#ffffff",
                    "border": "#1e1b4b",
                    "borderAccent": "#4c1d95",
                    "icon": "#f472b6",
                    "iconAccent": "#7a428a",
                    "iconMuted": "#8b5cf6",
                    "success": "#10b981",
                    "warning": "#f59e0b",
                    "danger": "#ef4444",
                    "glow": "#ec4899",
                    "link": "#f472b6",
                    "placeholder": "#7c3aed",
                    "markerTint1": "#34d399",
                    "markerTint2": "#fbbf24",
                    "markerTint3": "#38bdf8",
                    "markerTint4": "#c084fc"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 6,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 30,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 2
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "solarized_light": {
        "name": "Solarized Light",
        "previewImage": "images/theme-preview/solarized_light.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 135,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Roboto', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 90,
                    "endOpacity": 90,
                    "angle": 45,
                    "blur": 0
                },
                "glow": {
                    "enabled": false,
                    "radius": 0,
                    "opacity": 0
                },
                "border": {
                    "width": 1,
                    "opacity": 50,
                    "cornerRadius": 12
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#eee8d5",
                    "backgroundAccent": "#fdf6e3",
                    "surface": "#fdf6e3",
                    "surfaceAlt": "#f5efdc",
                    "surfaceHover": "#d3cbb8",
                    "overlay": "#eee8d5",
                    "text": "#073642",
                    "textMuted": "#586e75",
                    "onSurface": "#073642",
                    "onAccent": "#ffffff",
                    "accent": "#35c4ba",
                    "accentSoft": "#2aa198",
                    "accentSecondary": "#1a7a73",
                    "accentOff": "#a9bab8",
                    "controlOff": "#2aa198",
                    "thumb": "#fdf6e3",
                    "border": "#c4cdb5",
                    "borderAccent": "#93a1a1",
                    "icon": "#268bd2",
                    "iconAccent": "#BFE3D1",
                    "iconMuted": "#2aa198",
                    "success": "#859900",
                    "warning": "#b58900",
                    "danger": "#dc322f",
                    "glow": "#2aa198",
                    "link": "#268bd2",
                    "placeholder": "#93a1a1",
                    "markerTint1": "#d33682",
                    "markerTint2": "#6c71c4",
                    "markerTint3": "#859900",
                    "markerTint4": "#cb4b16"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 12,
                    "enableGlow": false,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": false,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 18,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Roboto', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 8
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "corporate_grey": {
        "name": "Corporate Slate",
        "previewImage": "images/theme-preview/corporate_grey.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 180,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Roboto', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 180,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 20,
                    "opacity": 60
                },
                "border": {
                    "width": 1,
                    "opacity": 30,
                    "cornerRadius": 8
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#e2e8f0",
                    "backgroundAccent": "#f1f5f9",
                    "surface": "#ffffff",
                    "surfaceAlt": "#f8fafc",
                    "surfaceHover": "#e2e8f0",
                    "overlay": "#cbd5e1",
                    "text": "#0f172a",
                    "textMuted": "#475569",
                    "onSurface": "#0f172a",
                    "onAccent": "#ffffff",
                    "accent": "#60a5fa",
                    "accentSoft": "#3b82f6",
                    "accentSecondary": "#2563eb",
                    "accentOff": "#99afcb",
                    "controlOff": "#3b82f6",
                    "thumb": "#ffffff",
                    "border": "#cbd5e1",
                    "borderAccent": "#94a3b8",
                    "icon": "#2563eb",
                    "iconAccent": "#a3eef7",
                    "iconMuted": "#3b82f6",
                    "success": "#10b981",
                    "warning": "#f59e0b",
                    "danger": "#ef4444",
                    "glow": "#3b82f6",
                    "link": "#2563eb",
                    "placeholder": "#94a3b8",
                    "markerTint1": "#e11d48",
                    "markerTint2": "#0891b2",
                    "markerTint3": "#7c3aed",
                    "markerTint4": "#059669"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 8,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 18,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Roboto', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 4
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "paper_white": {
        "name": "Paper White",
        "previewImage": "images/theme-preview/paper_white.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "flat",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 0,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 15,
                    "opacity": 80
                },
                "border": {
                    "width": 2,
                    "opacity": 100,
                    "cornerRadius": 4
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#e5e7eb",
                    "backgroundAccent": "#f3f4f6",
                    "surface": "#ffffff",
                    "surfaceAlt": "#f9fafb",
                    "surfaceHover": "#d1d5db",
                    "overlay": "#e5e7eb",
                    "text": "#111827",
                    "textMuted": "#4b5563",
                    "onSurface": "#111827",
                    "onAccent": "#ffffff",
                    "accent": "#374151",
                    "accentSoft": "#111827",
                    "accentSecondary": "#1f2937",
                    "accentOff": "#a7aaaf",
                    "controlOff": "#6b7280",
                    "thumb": "#ffffff",
                    "border": "#d1d5db",
                    "borderAccent": "#9ca3af",
                    "icon": "#111827",
                    "iconAccent": "#9ba3a4",
                    "iconMuted": "#6b7280",
                    "success": "#111827",
                    "warning": "#d97706",
                    "danger": "#dc2626",
                    "glow": "#9ca3af",
                    "link": "#111827",
                    "placeholder": "#6b7280",
                    "markerTint1": "#f87171",
                    "markerTint2": "#fbbf24",
                    "markerTint3": "#818cf8",
                    "markerTint4": "#34d399"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 4,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 20,
                    "fillThickness": 16,
                    "thumbSize": 20,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 2
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "ivory_glass": {
        "name": "Ivory Glass",
        "previewImage": "images/theme-preview/ivory_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "type": "linear",
                        "angle": 160,
                        "startColor": "#f3efe8",
                        "startOpacity": 100,
                        "endColor": "#e4d8c8",
                        "endOpacity": 100,
                        "overlay": false,
                        "image": "/images/ivory-theme.jpg",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "label": {
                    "bold": true,
                    "color": "@textMuted"
                },
                "value": {
                    "color": "@text"
                }
            },
            "container": {
                "border": {
                    "cornerRadius": 28,
                    "color": "#ffffff",
                    "opacity": 78,
                    "width": 1
                },
                "background": {
                    "startColor": "#f7f1e6",
                    "startOpacity": 50,
                    "endColor": "#c5e8f2",
                    "endOpacity": 28,
                    "angle": 160,
                    "blur": 8
                },
                "glow": {
                    "enabled": true,
                    "color": "@glow",
                    "radius": 20,
                    "opacity": 14
                },
                "innerGlow": {
                    "size": 14,
                    "color": "#fffdf8",
                    "opacity": 78
                }
            },
            "theme": {
                "colors": {
                    "background": "#f3efe8",
                    "backgroundAccent": "#e4d8c8",
                    "surface": "#faf7f2",
                    "surfaceAlt": "#f3ece3",
                    "surfaceHover": "#e7f3f6",
                    "overlay": "#d7eef4",
                    "text": "#3f3428",
                    "textMuted": "#7a6b5a",
                    "onSurface": "#3f3428",
                    "onAccent": "#1c3340",
                    "accent": "#5eb4cc",
                    "accentSoft": "#9ed4e2",
                    "accentSecondary": "#2f7f96",
                    "accentOff": "#e4ddd4",
                    "controlOff": "#c4bfb7",
                    "thumb": "#fffdf9",
                    "border": "#e6dccf",
                    "borderAccent": "#f4fbfe",
                    "icon": "#3d6d7c",
                    "iconAccent": "#d7eef4",
                    "iconMuted": "#9a8d7c",
                    "success": "#3d8f72",
                    "warning": "#a86a1e",
                    "danger": "#b85c58",
                    "glow": "#9ad8e8",
                    "link": "#2f7590",
                    "placeholder": "#a89884",
                    "markerTint1": "#a86a1e",
                    "markerTint2": "#3d8fad",
                    "markerTint3": "#c4a07a",
                    "markerTint4": "#5a9a90"
                }
            },
            "widgetDefaults": {
                "arrow": {
                    "mainColor": "@accent",
                    "glowColor": "@glow",
                    "thickness": 8,
                    "headSize": 26,
                    "lineRadius": 10,
                    "glowWidth": 10,
                    "glowOpacity": 28
                },
                "editbox": {
                    "backgroundColor": "#fffdf8",
                    "backgroundOpacity": 48,
                    "borderColor": "#ffffff",
                    "borderRadius": 20
                },
                "gauge": {
                    "trackThickness": 18,
                    "trackOpacity": 36,
                    "trackBlur": 14,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffffff",
                    "trackOutlineOpacity": 70,
                    "trackInnerGlow": 8,
                    "trackInnerGlowColor": "#fffdf8",
                    "trackInnerGlowOpacity": 60,
                    "barOpacity": 88,
                    "barOutlineOpacity": 60,
                    "barInnerGlow": 4,
                    "barInnerGlowColor": "#ffffff",
                    "barInnerGlowOpacity": 34,
                    "barOutlineWidth": 1,
                    "barThickness": 12
                },
                "graph": {
                    "lineColor": "@accent",
                    "fillOpacity": 18,
                    "barRadius": 10
                },
                "lightgrid": {
                    "tileBackgroundColor": "#fffdf8",
                    "tileBackgroundOpacity": 46,
                    "tileBlur": 14,
                    "tileOutlineWidth": 1,
                    "tileOutlineColor": "#ffffff",
                    "tileOutlineOpacity": 80,
                    "tileInnerGlow": 6,
                    "tileInnerGlowColor": "#fffdf8",
                    "tileInnerGlowOpacity": 70,
                    "iconColorOff": "@iconMuted",
                    "iconColorOn": "@accent"
                },
                "list": {
                    "gap": 6,
                    "iconSize": 24
                },
                "menu": {
                    "itemCornerRadius": 18,
                    "itemBackgroundOn": "@accent",
                    "itemBackgroundOnOpacity": 28,
                    "itemBackgroundOff": "#fffdf8",
                    "itemBackgroundOffOpacity": 44,
                    "itemBackgroundHover": "@accentSoft",
                    "itemBackgroundHoverOpacity": 22,
                    "itemBlur": 14,
                    "itemOutlineWidth": 1,
                    "itemOutlineColor": "#ffffff",
                    "itemOutlineOpacity": 75,
                    "itemInnerGlow": 6,
                    "itemInnerGlowColor": "#fffdf8",
                    "itemInnerGlowOpacity": 60
                },
                "slider": {
                    "trackThickness": 20,
                    "trackColor": "@controlOff",
                    "trackOpacity": 40,
                    "trackBlur": 14,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffffff",
                    "trackOutlineOpacity": 70,
                    "trackInnerGlow": 6,
                    "trackInnerGlowColor": "#fffdf8",
                    "trackInnerGlowOpacity": 65,
                    "fillThickness": 16,
                    "fillOpacity": 80,
                    "fillOutlineOpacity": 60,
                    "fillInnerGlow": 3,
                    "fillInnerGlowColor": "#ffffff",
                    "fillInnerGlowOpacity": 32,
                    "thumbSize": 24,
                    "thumbShadow": false,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#e5f4f8",
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 36,
                    "fillOutlineWidth": 1
                },
                "switch": {
                    "buttonRadius": 28,
                    "backgroundColorOn": "@accent",
                    "backgroundColorOff": "@controlOff",
                    "backgroundColorHover": "@accentSoft",
                    "backgroundOpacity": 48,
                    "buttonBlur": 16,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#e5f4f8",
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 36,
                    "glowRadius": 14,
                    "outlineWidth": 1,
                    "outlineColor": "#ffffff",
                    "outlineOpacity": 85,
                    "buttonInnerGlow": 8,
                    "buttonInnerGlowColor": "#fffdf8",
                    "buttonInnerGlowOpacity": 70,
                    "typography": {
                        "buttonLabelOutside": {
                            "fontSize": 15,
                            "bold": true
                        },
                        "buttonLabelInside": {
                            "fontSize": 15,
                            "bold": true
                        }
                    }
                }
            }
        }
    },
    "barbie": {
        "name": "Barbie",
        "previewImage": "images/theme-preview/barbie.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear_mirror",
                        "angle": 152,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Playpen Sans'",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 90,
                    "endOpacity": 95,
                    "angle": 135,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 30,
                    "opacity": 68
                },
                "border": {
                    "width": 2,
                    "opacity": 100,
                    "cornerRadius": 25
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#1624A6",
                    "backgroundAccent": "#0694CC",
                    "surface": "#ED61A7",
                    "surfaceAlt": "#db2777",
                    "surfaceHover": "#eab308",
                    "overlay": "#0f172a",
                    "text": "#ffffff",
                    "textMuted": "#FAE3EF",
                    "onSurface": "#ffffff",
                    "onAccent": "#0f172a",
                    "accent": "#fcdb5b",
                    "accentSoft": "#facc15",
                    "accentSecondary": "#af8f0f",
                    "accentOff": "#831843",
                    "controlOff": "#831843",
                    "thumb": "#ffffff",
                    "border": "#831843",
                    "borderAccent": "#F5A6CB",
                    "icon": "#facc15",
                    "iconAccent": "#D43FAC",
                    "iconMuted": "#fbdaeb",
                    "success": "#facc15",
                    "warning": "#eab308",
                    "danger": "#ffffff",
                    "glow": "#facc15",
                    "link": "#facc15",
                    "placeholder": "#fef9c3",
                    "markerTint1": "#fbcfe8",
                    "markerTint2": "#a7f3d0",
                    "markerTint3": "#fecaca",
                    "markerTint4": "#e9d5ff"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 25,
                    "enableGlow": true,
                    "outlineWidth": 2,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 16,
                    "trackThickness": 20,
                    "trackOutlineWidth": 2,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 28,
                    "fillThickness": 20,
                    "thumbSize": 32,
                    "thumbShadow": true,
                    "trackOutlineWidth": 2,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 24,
                    "fontSize": 16,
                    "gap": 6,
                    "textTransform": "none",
                    "fontFamily": "'Playpen Sans'"
                },
                "graph": {
                    "lineWidth": 3,
                    "fill": true,
                    "fillOpacity": 30,
                    "barOutlineWidth": 1,
                    "pointSize": 2
                },
                "arrow": {
                    "thickness": 14,
                    "headSize": 40,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 20,
                    "glowOpacity": 80
                },
                "editbox": {
                    "borderRadius": 21
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "barbie_dark_glass": {
        "name": "Barbie Dark Glass",
        "previewImage": "images/theme-preview/barbie_dark_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "type": "linear_mirror",
                        "angle": 152,
                        "image": "/images/barbie-theme.jpg",
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "size": "cover",
                        "overlay": false
                    }
                }
            },
            "typography": {
                "fontFamily": "'Playpen Sans'",
                "label": {
                    "bold": true
                }
            },
            "container": {
                "glow": {
                    "enabled": false,
                    "radius": 30,
                    "opacity": 68
                },
                "border": {
                    "cornerRadius": 25,
                    "width": 3,
                    "opacity": 90
                },
                "background": {
                    "startOpacity": 20,
                    "endOpacity": 70,
                    "angle": 135,
                    "blur": 5
                },
                "innerGlow": {
                    "size": 20,
                    "opacity": 50
                }
            },
            "theme": {
                "colors": {
                    "background": "#1624A6",
                    "backgroundAccent": "#0694CC",
                    "surface": "#D1A9BD",
                    "surfaceAlt": "#AD005C",
                    "surfaceHover": "#eab308",
                    "overlay": "#110e0c",
                    "text": "#ffffff",
                    "textMuted": "#FAFAFA",
                    "onSurface": "#ffffff",
                    "onAccent": "#0f172a",
                    "accent": "#F0B000",
                    "accentSoft": "#facc15",
                    "accentSecondary": "#E8156D",
                    "accentOff": "#831843",
                    "controlOff": "#831843",
                    "thumb": "#fef3c7",
                    "border": "#831843",
                    "borderAccent": "#EBADFF",
                    "icon": "#F0C413",
                    "iconAccent": "#D43FAC",
                    "iconMuted": "#fbdaeb",
                    "success": "#facc15",
                    "warning": "#eab308",
                    "danger": "#ffffff",
                    "glow": "#facc15",
                    "link": "#facc15",
                    "placeholder": "#fef9c3",
                    "markerTint1": "#fbcfe8",
                    "markerTint2": "#a7f3d0",
                    "markerTint3": "#fecaca",
                    "markerTint4": "#e9d5ff"
                }
            },
            "widgetDefaults": {
                "arrow": {
                    "thickness": 14,
                    "headSize": 40,
                    "glowWidth": 20,
                    "glowOpacity": 80
                },
                "editbox": {
                    "borderRadius": 21
                },
                "gauge": {
                    "trackThickness": 20,
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 2,
                    "trackInnerGlow": 13,
                    "barThickness": 16,
                    "barOpacity": 80,
                    "barGlow": false,
                    "barOutlineWidth": 1,
                    "barOutlineOpacity": 90,
                    "barInnerGlow": 5,
                    "barInnerGlowOpacity": 60,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlowOpacity": 60
                },
                "graph": {
                    "lineWidth": 3,
                    "fillOpacity": 30,
                    "barOutlineWidth": 1,
                    "pointSize": 2
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 50,
                    "tileBlur": 5,
                    "tileOutlineWidth": 1,
                    "tileOutlineOpacity": 80,
                    "tileInnerGlow": 25,
                    "tileInnerGlowOpacity": 40
                },
                "list": {
                    "gap": 6,
                    "iconSize": 24
                },
                "menu": {
                    "itemBackgroundOnOpacity": 50,
                    "itemBackgroundOffOpacity": 50,
                    "itemBackgroundHoverOpacity": 50,
                    "itemBlur": 5,
                    "itemOutlineWidth": 1,
                    "itemOutlineOpacity": 80,
                    "itemInnerGlow": 25,
                    "itemInnerGlowOpacity": 60
                },
                "slider": {
                    "trackThickness": 28,
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 2,
                    "trackInnerGlow": 11,
                    "fillThickness": 20,
                    "fillOpacity": 80,
                    "fillOutlineWidth": 1,
                    "fillOutlineOpacity": 60,
                    "fillInnerGlow": 5,
                    "fillInnerGlowOpacity": 90,
                    "thumbSize": 32,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlowOpacity": 60
                },
                "switch": {
                    "buttonRadius": 25,
                    "backgroundOpacity": 70,
                    "buttonBlur": 5,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60,
                    "enableGlow": false,
                    "outlineWidth": 3,
                    "outlineOpacity": 80,
                    "buttonInnerGlow": 25,
                    "buttonInnerGlowOpacity": 60,
                    "typography": {
                        "buttonLabelOutside": {
                            "fontSize": 15,
                            "bold": true
                        },
                        "buttonLabelInside": {
                            "fontSize": 15,
                            "bold": true
                        }
                    }
                }
            }
        }
    },
    "barbie_light_glass": {
        "name": "Barbie Light Glass",
        "previewImage": "images/theme-preview/barbie_light_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startColor": "#7ec8f5",
                        "startOpacity": 100,
                        "endColor": "#fde7f3",
                        "endOpacity": 100,
                        "type": "linear_mirror",
                        "angle": 152,
                        "overlay": false,
                        "image": "/images/barbie-theme.jpg",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Playpen Sans'",
                "label": {
                    "bold": true,
                    "color": "@textMuted"
                },
                "value": {
                    "color": "@text"
                }
            },
            "container": {
                "background": {
                    "startColor": "#ec4899",
                    "startOpacity": 44,
                    "endColor": "#f9a8d4",
                    "endOpacity": 34,
                    "angle": 155,
                    "blur": 10
                },
                "glow": {
                    "enabled": true,
                    "color": "@glow",
                    "radius": 22,
                    "opacity": 20
                },
                "border": {
                    "color": "#fce7f3",
                    "width": 2,
                    "opacity": 64,
                    "cornerRadius": 26
                },
                "innerGlow": {
                    "size": 7,
                    "color": "#fbcfe8",
                    "opacity": 30
                }
            },
            "theme": {
                "colors": {
                    "background": "#7ec8f5",
                    "backgroundAccent": "#fde7f3",
                    "surface": "#fff0f7",
                    "surfaceAlt": "#fbdceb",
                    "surfaceHover": "#f8c6de",
                    "overlay": "#fce7f3",
                    "text": "#4c1632",
                    "textMuted": "#8d5270",
                    "onSurface": "#4c1632",
                    "onAccent": "#ffffff",
                    "accent": "#e4257e",
                    "accentSoft": "#f472b6",
                    "accentSecondary": "#e6b325",
                    "accentOff": "#e7b3cb",
                    "controlOff": "#f0c2d6",
                    "thumb": "#fff8e8",
                    "border": "#f6d0e3",
                    "borderAccent": "#ffffff",
                    "icon": "#d61f78",
                    "iconAccent": "#fce7f3",
                    "iconMuted": "#b57a96",
                    "success": "#1f9a62",
                    "warning": "#e0a020",
                    "danger": "#c4164a",
                    "glow": "#e4257e",
                    "link": "#be185d",
                    "placeholder": "#b57a96",
                    "markerTint1": "#e6b325",
                    "markerTint2": "#f472b6",
                    "markerTint3": "#7c6cf0",
                    "markerTint4": "#3dbe8a"
                }
            },
            "widgetDefaults": {
                "arrow": {
                    "mainColor": "@accent",
                    "glowColor": "@accentSecondary",
                    "thickness": 12,
                    "headSize": 34,
                    "lineRadius": 12,
                    "glowWidth": 14,
                    "glowOpacity": 40
                },
                "editbox": {
                    "backgroundColor": "#ffffff",
                    "backgroundOpacity": 48,
                    "borderColor": "#ffffff",
                    "borderWidth": 1,
                    "borderRadius": 18
                },
                "gauge": {
                    "barGlow": true,
                    "trackThickness": 18,
                    "trackOpacity": 34,
                    "trackBlur": 12,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffffff",
                    "trackOutlineOpacity": 75,
                    "trackInnerGlow": 6,
                    "trackInnerGlowColor": "#ffffff",
                    "trackInnerGlowOpacity": 60,
                    "barThickness": 14,
                    "barOpacity": 88,
                    "barOutlineWidth": 0,
                    "barInnerGlow": 4,
                    "barInnerGlowColor": "#ffffff",
                    "barInnerGlowOpacity": 45,
                    "barOutlineOpacity": 80
                },
                "graph": {
                    "lineWidth": 3,
                    "lineColor": "@accent",
                    "fill": true,
                    "fillColor": "@accent",
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4,
                    "pointColor": "@accentSecondary"
                },
                "lightgrid": {
                    "tileBackgroundColor": "#ffffff",
                    "tileBackgroundOpacity": 44,
                    "tileHoverColor": "@accentSoft",
                    "tileBlur": 12,
                    "tileOutlineWidth": 1,
                    "tileOutlineColor": "#ffffff",
                    "tileOutlineOpacity": 80,
                    "tileInnerGlow": 6,
                    "tileInnerGlowColor": "#ffffff",
                    "tileInnerGlowOpacity": 60,
                    "iconColorOff": "@iconMuted",
                    "iconColorOn": "@accent"
                },
                "list": {
                    "gap": 6,
                    "iconSize": 24,
                    "textColor": "@text",
                    "timeColor": "@textMuted",
                    "iconColor": "@accent"
                },
                "menu": {
                    "itemCornerRadius": 16,
                    "itemBackgroundOn": "@accent",
                    "itemBackgroundOnOpacity": 34,
                    "itemBackgroundOff": "#ffffff",
                    "itemBackgroundOffOpacity": 40,
                    "itemBackgroundHover": "@accentSoft",
                    "itemBackgroundHoverOpacity": 30,
                    "itemBlur": 12,
                    "itemOutlineWidth": 1,
                    "itemOutlineColor": "#ffffff",
                    "itemOutlineOpacity": 75,
                    "itemInnerGlow": 6,
                    "itemInnerGlowColor": "#ffffff",
                    "itemInnerGlowOpacity": 55
                },
                "slider": {
                    "trackColor": "@controlOff",
                    "fillColor": "@accent",
                    "thumbColor": "@thumb",
                    "trackThickness": 22,
                    "trackOpacity": 36,
                    "trackBlur": 12,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffffff",
                    "trackOutlineOpacity": 75,
                    "trackInnerGlow": 6,
                    "trackInnerGlowColor": "#ffffff",
                    "trackInnerGlowOpacity": 55,
                    "fillThickness": 16,
                    "fillOpacity": 90,
                    "fillOutlineWidth": 0,
                    "fillInnerGlow": 3,
                    "fillInnerGlowColor": "#ffffff",
                    "fillInnerGlowOpacity": 40,
                    "thumbSize": 26,
                    "thumbShadow": false,
                    "thumbOutlineWidth": 2,
                    "thumbOutlineColor": "@accentSecondary",
                    "thumbOutlineOpacity": 90,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 50,
                    "fillOutlineOpacity": 80
                },
                "switch": {
                    "backgroundColorOn": "@accent",
                    "backgroundColorOff": "@controlOff",
                    "backgroundColorHover": "@accentSoft",
                    "thumbColor": "@thumb",
                    "buttonRadius": 24,
                    "backgroundOpacity": 62,
                    "buttonBlur": 14,
                    "thumbOutlineWidth": 2,
                    "thumbOutlineColor": "@accentSecondary",
                    "thumbOutlineOpacity": 90,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 50,
                    "enableGlow": true,
                    "glowColor": "@glow",
                    "glowRadius": 14,
                    "outlineWidth": 1,
                    "outlineColor": "#ffffff",
                    "outlineOpacity": 82,
                    "buttonInnerGlow": 8,
                    "buttonInnerGlowColor": "#ffffff",
                    "buttonInnerGlowOpacity": 65,
                    "typography": {
                        "buttonLabelOutside": {
                            "fontSize": 15,
                            "bold": true
                        },
                        "buttonLabelInside": {
                            "fontSize": 15,
                            "bold": true,
                            "color": "@onAccent"
                        }
                    }
                }
            }
        }
    },
    "mint_fresh": {
        "name": "Mint Fresh",
        "previewImage": "images/theme-preview/mint_fresh.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "radial",
                        "angle": 120,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 120,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 25,
                    "opacity": 50
                },
                "border": {
                    "width": 1,
                    "opacity": 40,
                    "cornerRadius": 25
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#d1fae5",
                    "backgroundAccent": "#ecfdf5",
                    "surface": "#ffffff",
                    "surfaceAlt": "#f0fdf4",
                    "surfaceHover": "#a7f3d0",
                    "overlay": "#6ee7b7",
                    "text": "#064e3b",
                    "textMuted": "#475569",
                    "onSurface": "#064e3b",
                    "onAccent": "#ffffff",
                    "accent": "#10b981",
                    "accentSoft": "#059669",
                    "accentSecondary": "#047857",
                    "accentOff": "#86c2a6",
                    "controlOff": "#059669",
                    "thumb": "#ffffff",
                    "border": "#a7f3d0",
                    "borderAccent": "#6ee7b7",
                    "icon": "#047857",
                    "iconAccent": "#B6F0D4",
                    "iconMuted": "#059669",
                    "success": "#059669",
                    "warning": "#f59e0b",
                    "danger": "#ef4444",
                    "glow": "#10b981",
                    "link": "#047857",
                    "placeholder": "#94a3b8",
                    "markerTint1": "#fca5a5",
                    "markerTint2": "#fdba74",
                    "markerTint3": "#a5b4fc",
                    "markerTint4": "#7dd3fc"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 25,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 28,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 24,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 21
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "sunrise_orange": {
        "name": "Sunrise Orange",
        "previewImage": "images/theme-preview/sunrise_orange.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 180,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Roboto', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 180,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 20,
                    "opacity": 40
                },
                "border": {
                    "width": 1,
                    "opacity": 50,
                    "cornerRadius": 16
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#fed7aa",
                    "backgroundAccent": "#ffedd5",
                    "surface": "#ffffff",
                    "surfaceAlt": "#fff7ed",
                    "surfaceHover": "#fdba74",
                    "overlay": "#fb923c",
                    "text": "#431407",
                    "textMuted": "#78350f",
                    "onSurface": "#431407",
                    "onAccent": "#ffffff",
                    "accent": "#f97316",
                    "accentSoft": "#ea580c",
                    "accentSecondary": "#c2410c",
                    "accentOff": "#cbac88",
                    "controlOff": "#ea580c",
                    "thumb": "#ffffff",
                    "border": "#fde3c5",
                    "borderAccent": "#fb923c",
                    "icon": "#c2410c",
                    "iconAccent": "#EBC39D",
                    "iconMuted": "#ea580c",
                    "success": "#16a34a",
                    "warning": "#d97706",
                    "danger": "#dc2626",
                    "glow": "#f97316",
                    "link": "#c2410c",
                    "placeholder": "#9a3412",
                    "markerTint1": "#fb7185",
                    "markerTint2": "#bef264",
                    "markerTint3": "#c084fc",
                    "markerTint4": "#38bdf8"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 16,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Roboto', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 12
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "ember_dark_glass": {
        "name": "Ember Dark Glass",
        "previewImage": "images/theme-preview/ember_dark_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "type": "linear",
                        "angle": 135,
                        "startColor": "#1a100c",
                        "endColor": "#2a1810",
                        "image": "/images/ember-theme.jpg",
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "size": "cover",
                        "overlay": false
                    }
                }
            },
            "typography": {
                "label": {
                    "bold": true
                }
            },
            "container": {
                "background": {
                    "startColor": "#2a1812",
                    "startOpacity": 46,
                    "endColor": "#ffedd5",
                    "endOpacity": 12,
                    "angle": 135,
                    "blur": 16
                },
                "glow": {
                    "radius": 22
                },
                "border": {
                    "color": "#ffe4c4",
                    "opacity": 40,
                    "width": 1,
                    "cornerRadius": 16
                },
                "innerGlow": {
                    "size": 8,
                    "color": "#ffedd5",
                    "opacity": 36
                }
            },
            "theme": {
                "colors": {
                    "background": "#1a100c",
                    "backgroundAccent": "#2a1810",
                    "surface": "#3a2418",
                    "surfaceAlt": "#24160f",
                    "surfaceHover": "#5c3a24",
                    "overlay": "#120c09",
                    "text": "#fff7ed",
                    "textMuted": "#e7c4a4",
                    "onSurface": "#fff7ed",
                    "onAccent": "#1c1008",
                    "accent": "#fb923c",
                    "accentSoft": "#f59e0b",
                    "accentSecondary": "#ea580c",
                    "accentOff": "#6b442c",
                    "controlOff": "#5c4033",
                    "thumb": "#fff7ed",
                    "border": "#d6a57a",
                    "borderAccent": "#fdba74",
                    "icon": "#fed7aa",
                    "iconAccent": "#7c2d12",
                    "iconMuted": "#c4a484",
                    "success": "#84cc16",
                    "warning": "#facc15",
                    "glow": "#f97316",
                    "link": "#fdba74",
                    "placeholder": "#c4a484",
                    "markerTint1": "#fb7185",
                    "markerTint2": "#fde047",
                    "markerTint3": "#fdba74",
                    "markerTint4": "#86efac"
                }
            },
            "widgetDefaults": {
                "arrow": {
                    "mainColor": "@accent",
                    "glowColor": "@glow",
                    "headSize": 28,
                    "lineRadius": 4,
                    "glowWidth": 16,
                    "glowOpacity": 48
                },
                "editbox": {
                    "backgroundColor": "#ffedd5",
                    "backgroundOpacity": 12,
                    "borderColor": "#ffe4c4",
                    "borderRadius": 10
                },
                "gauge": {
                    "trackThickness": 18,
                    "trackOpacity": 40,
                    "trackBlur": 8,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffe4c4",
                    "trackOutlineOpacity": 40,
                    "trackInnerGlow": 4,
                    "trackInnerGlowColor": "#ffedd5",
                    "trackInnerGlowOpacity": 34,
                    "barThickness": 14,
                    "barOpacity": 88,
                    "barOutlineOpacity": 60,
                    "barInnerGlow": 4,
                    "barInnerGlowColor": "#ffffff",
                    "barInnerGlowOpacity": 34,
                    "barOutlineWidth": 1
                },
                "graph": {
                    "lineColor": "@accent",
                    "fillOpacity": 24,
                    "pointColor": "@accentSoft"
                },
                "lightgrid": {
                    "tileBackgroundColor": "#ffedd5",
                    "tileHoverColor": "@accent",
                    "tileBackgroundOpacity": 12,
                    "tileBlur": 8,
                    "tileOutlineWidth": 1,
                    "tileOutlineColor": "#ffe4c4",
                    "tileOutlineOpacity": 40,
                    "tileInnerGlow": 3,
                    "tileInnerGlowColor": "#ffedd5",
                    "tileInnerGlowOpacity": 30,
                    "iconColorOff": "@iconMuted",
                    "iconColorOn": "@accent"
                },
                "list": {
                    "gap": 6,
                    "iconSize": 24
                },
                "menu": {
                    "itemBackgroundOn": "@accent",
                    "itemBackgroundOnOpacity": 46,
                    "itemBackgroundOff": "#ffedd5",
                    "itemBackgroundOffOpacity": 10,
                    "itemBackgroundHover": "@accentSoft",
                    "itemBackgroundHoverOpacity": 30,
                    "itemBlur": 8,
                    "itemOutlineWidth": 1,
                    "itemOutlineColor": "#ffe4c4",
                    "itemOutlineOpacity": 36,
                    "itemInnerGlow": 3,
                    "itemInnerGlowColor": "#ffedd5",
                    "itemInnerGlowOpacity": 32
                },
                "slider": {
                    "trackThickness": 16,
                    "trackColor": "@controlOff",
                    "trackOpacity": 40,
                    "trackBlur": 8,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffe4c4",
                    "trackOutlineOpacity": 42,
                    "trackInnerGlow": 3,
                    "trackInnerGlowColor": "#ffedd5",
                    "trackInnerGlowOpacity": 36,
                    "fillThickness": 12,
                    "fillOpacity": 82,
                    "fillOutlineOpacity": 60,
                    "fillInnerGlow": 3,
                    "fillInnerGlowColor": "#ffffff",
                    "fillInnerGlowOpacity": 32,
                    "thumbSize": 20,
                    "thumbShadow": false,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#ffe0b0",
                    "thumbOutlineOpacity": 55,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 36,
                    "fillOutlineWidth": 1
                },
                "switch": {
                    "buttonRadius": 10,
                    "backgroundColorOn": "@accent",
                    "backgroundColorOff": "@controlOff",
                    "backgroundColorHover": "@accentSoft",
                    "backgroundOpacity": 48,
                    "buttonBlur": 8,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#ffe0b0",
                    "thumbOutlineOpacity": 55,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 36,
                    "glowRadius": 18,
                    "outlineWidth": 1,
                    "outlineColor": "#ffe4c4",
                    "outlineOpacity": 48,
                    "buttonInnerGlow": 4,
                    "buttonInnerGlowColor": "#ffedd5",
                    "buttonInnerGlowOpacity": 42,
                    "typography": {
                        "buttonLabelOutside": {
                            "fontSize": 15,
                            "bold": true
                        },
                        "buttonLabelInside": {
                            "fontSize": 15,
                            "bold": true
                        }
                    }
                }
            }
        }
    },
    "ember_light_glass": {
        "name": "Ember Light Glass",
        "previewImage": "images/theme-preview/ember_light_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startColor": "#f4d6ac",
                        "startOpacity": 100,
                        "endColor": "#8f552e",
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 135,
                        "overlay": false,
                        "image": "/images/ember-theme.jpg",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48,
                    "color": "@text"
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "color": "@textMuted",
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startColor": "#d4893a",
                    "startOpacity": 42,
                    "endColor": "#fff1d6",
                    "endOpacity": 26,
                    "angle": 135,
                    "blur": 16
                },
                "glow": {
                    "enabled": true,
                    "color": "@glow",
                    "radius": 22,
                    "opacity": 26
                },
                "border": {
                    "color": "#fff6e8",
                    "width": 1,
                    "opacity": 64,
                    "cornerRadius": 12
                },
                "innerGlow": {
                    "size": 8,
                    "color": "#fff8ec",
                    "opacity": 42
                }
            },
            "theme": {
                "colors": {
                    "background": "#f4d6ac",
                    "backgroundAccent": "#a15e32",
                    "surface": "#fff6ea",
                    "surfaceAlt": "#f6e4cc",
                    "surfaceHover": "#f0d2ae",
                    "overlay": "#fff1dc",
                    "text": "#3d1c0c",
                    "textMuted": "#7a4e2c",
                    "onSurface": "#3d1c0c",
                    "onAccent": "#3a1608",
                    "accent": "#e07a18",
                    "accentSoft": "#f0a04a",
                    "accentSecondary": "#a84810",
                    "accentOff": "#e7c9a4",
                    "controlOff": "#edd9be",
                    "thumb": "#fffaf3",
                    "border": "#e8cba8",
                    "borderAccent": "#fff1d8",
                    "icon": "#a84810",
                    "iconAccent": "#fff1dc",
                    "iconMuted": "#a07858",
                    "success": "#3f7d48",
                    "warning": "#a86a1c",
                    "danger": "#c2412d",
                    "glow": "#f0a04a",
                    "link": "#b45312",
                    "placeholder": "#a07858",
                    "markerTint1": "#c45a14",
                    "markerTint2": "#8a3e12",
                    "markerTint3": "#e08a28",
                    "markerTint4": "#f0c36a"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "backgroundColorOn": "@accent",
                    "backgroundColorOff": "@controlOff",
                    "backgroundColorHover": "@accentSoft",
                    "thumbColor": "@thumb",
                    "backgroundOpacity": 48,
                    "buttonBlur": 8,
                    "buttonRadius": 10,
                    "outlineWidth": 1,
                    "outlineColor": "#fff6e8",
                    "outlineOpacity": 64,
                    "enableGlow": true,
                    "glowColor": "@glow",
                    "glowRadius": 18,
                    "buttonInnerGlow": 4,
                    "buttonInnerGlowColor": "#fff8ec",
                    "buttonInnerGlowOpacity": 42,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 8,
                    "thumbInnerGlowOpacity": 50
                },
                "slider": {
                    "trackColor": "@controlOff",
                    "fillColor": "@accent",
                    "thumbColor": "@thumb",
                    "trackThickness": 16,
                    "fillThickness": 12,
                    "thumbSize": 20,
                    "thumbShadow": false,
                    "trackOpacity": 40,
                    "trackBlur": 8,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#fff6e8",
                    "trackOutlineOpacity": 58,
                    "trackInnerGlow": 3,
                    "trackInnerGlowColor": "#fff8ec",
                    "trackInnerGlowOpacity": 36,
                    "fillOpacity": 82,
                    "fillOutlineWidth": 1,
                    "fillOutlineOpacity": 80,
                    "fillInnerGlow": 8,
                    "fillInnerGlowOpacity": 50,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 8,
                    "thumbInnerGlowOpacity": 50
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 14,
                    "trackThickness": 18,
                    "trackOpacity": 40,
                    "trackBlur": 8,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#fff6e8",
                    "trackOutlineOpacity": 56,
                    "trackInnerGlow": 4,
                    "trackInnerGlowColor": "#fff8ec",
                    "trackInnerGlowOpacity": 34,
                    "barOpacity": 88,
                    "barOutlineWidth": 1,
                    "barOutlineOpacity": 80,
                    "barInnerGlow": 8,
                    "barInnerGlowOpacity": 50
                },
                "menu": {
                    "itemCornerRadius": 8,
                    "itemBackgroundOn": "@accent",
                    "itemBackgroundOnOpacity": 46,
                    "itemBackgroundOff": "#fff1d6",
                    "itemBackgroundOffOpacity": 36,
                    "itemBackgroundHover": "@accentSoft",
                    "itemBackgroundHoverOpacity": 30,
                    "itemBlur": 8,
                    "itemOutlineWidth": 1,
                    "itemOutlineColor": "#fff6e8",
                    "itemOutlineOpacity": 52,
                    "itemInnerGlow": 3,
                    "itemInnerGlowColor": "#fff8ec",
                    "itemInnerGlowOpacity": 32
                },
                "lightgrid": {
                    "tileBackgroundColor": "#fff1d6",
                    "tileBackgroundOpacity": 36,
                    "tileHoverColor": "@accent",
                    "tileBlur": 8,
                    "tileOutlineWidth": 1,
                    "tileOutlineColor": "#fff6e8",
                    "tileOutlineOpacity": 56,
                    "tileInnerGlow": 3,
                    "tileInnerGlowColor": "#fff8ec",
                    "tileInnerGlowOpacity": 30,
                    "iconColorOff": "@iconMuted",
                    "iconColorOn": "@accent"
                },
                "editbox": {
                    "backgroundColor": "#fff1d6",
                    "backgroundOpacity": 40,
                    "borderColor": "#fff6e8",
                    "borderWidth": 1,
                    "borderRadius": 10
                },
                "graph": {
                    "lineWidth": 2,
                    "lineColor": "@accent",
                    "fill": true,
                    "fillColor": "@accent",
                    "fillOpacity": 24,
                    "barRadius": 4,
                    "barOutlineWidth": 0,
                    "pointSize": 4,
                    "pointColor": "@accentSoft"
                },
                "arrow": {
                    "mainColor": "@accent",
                    "glowColor": "@glow",
                    "thickness": 10,
                    "headSize": 28,
                    "lineRadius": 4,
                    "glowWidth": 16,
                    "glowOpacity": 48
                },
                "list": {
                    "fontFamily": "'Inter', sans-serif",
                    "fontSize": 14,
                    "textColor": "@text",
                    "timeColor": "@textMuted",
                    "iconColor": "@icon",
                    "textTransform": "none"
                }
            }
        }
    },
    "lavender_mist": {
        "name": "Lavender Mist",
        "previewImage": "images/theme-preview/lavender_mist.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "radial",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 135,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 30,
                    "opacity": 40
                },
                "border": {
                    "width": 1,
                    "opacity": 40,
                    "cornerRadius": 30
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#e9d5ff",
                    "backgroundAccent": "#f3e8ff",
                    "surface": "#ffffff",
                    "surfaceAlt": "#faf5ff",
                    "surfaceHover": "#d8b4fe",
                    "overlay": "#c084fc",
                    "text": "#3b0764",
                    "textMuted": "#6b21a8",
                    "onSurface": "#3b0764",
                    "onAccent": "#ffffff",
                    "accent": "#a855f7",
                    "accentSoft": "#9333ea",
                    "accentSecondary": "#7e22ce",
                    "accentOff": "#baaacc",
                    "controlOff": "#9333ea",
                    "thumb": "#ffffff",
                    "border": "#e9d5ff",
                    "borderAccent": "#c084fc",
                    "icon": "#7e22ce",
                    "iconAccent": "#DEB9EB",
                    "iconMuted": "#9333ea",
                    "success": "#16a34a",
                    "warning": "#f59e0b",
                    "danger": "#ef4444",
                    "glow": "#a855f7",
                    "link": "#7e22ce",
                    "placeholder": "#9333ea",
                    "markerTint1": "#f472b6",
                    "markerTint2": "#6ee7b7",
                    "markerTint3": "#fcd34d",
                    "markerTint4": "#38bdf8"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 30,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 28,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 26
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "orchid_glass": {
        "name": "Orchid Glass",
        "previewImage": "images/theme-preview/orchid_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "type": "linear",
                        "angle": 140,
                        "startColor": "#e6deee",
                        "startOpacity": 100,
                        "endColor": "#f7f1e4",
                        "endOpacity": 100,
                        "overlay": false,
                        "image": "/images/orchid-theme.jpg",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "label": {
                    "bold": true,
                    "color": "@textMuted"
                },
                "value": {
                    "color": "@text"
                }
            },
            "container": {
                "border": {
                    "cornerRadius": 32,
                    "color": "#f3e4b8",
                    "opacity": 70,
                    "width": 1
                },
                "background": {
                    "startColor": "#d4b4e0",
                    "startOpacity": 32,
                    "endColor": "#fffaf4",
                    "endOpacity": 38,
                    "angle": 160,
                    "blur": 17
                },
                "glow": {
                    "enabled": true,
                    "color": "@glow",
                    "radius": 32,
                    "opacity": 24
                },
                "innerGlow": {
                    "size": 16,
                    "color": "#fffaf6",
                    "opacity": 58
                }
            },
            "theme": {
                "colors": {
                    "background": "#e6deee",
                    "backgroundAccent": "#f7f1e4",
                    "surface": "#f8f4fb",
                    "surfaceAlt": "#f3eaf6",
                    "surfaceHover": "#e8ddf2",
                    "overlay": "#f6e4f2",
                    "text": "#3a2748",
                    "textMuted": "#7d688c",
                    "onSurface": "#3a2748",
                    "onAccent": "#fff8fc",
                    "accent": "#ae3181",
                    "accentSoft": "#d478b0",
                    "accentSecondary": "#7a2468",
                    "accentOff": "#e4d0e2",
                    "controlOff": "#e8dce9",
                    "thumb": "#fffaf6",
                    "border": "#e6d5ea",
                    "borderAccent": "#f3e4b8",
                    "icon": "#9a3478",
                    "iconAccent": "#f6e4f2",
                    "iconMuted": "#a892b0",
                    "success": "#3f8a62",
                    "warning": "#b56e22",
                    "danger": "#c4476a",
                    "glow": "#e07ab8",
                    "link": "#9a3478",
                    "placeholder": "#a892b0",
                    "markerTint1": "#b56e22",
                    "markerTint2": "#4e9a96",
                    "markerTint3": "#8b74c4",
                    "markerTint4": "#c45a9a"
                }
            },
            "widgetDefaults": {
                "arrow": {
                    "mainColor": "@accent",
                    "glowColor": "@glow",
                    "thickness": 8,
                    "headSize": 26,
                    "lineRadius": 12,
                    "glowWidth": 18,
                    "glowOpacity": 46
                },
                "editbox": {
                    "backgroundColor": "#fffaf4",
                    "backgroundOpacity": 44,
                    "borderColor": "#f3e4b8",
                    "borderRadius": 22
                },
                "gauge": {
                    "trackOpacity": 28,
                    "trackBlur": 14,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#f3e4b8",
                    "trackOutlineOpacity": 58,
                    "trackInnerGlow": 8,
                    "trackInnerGlowColor": "#fffaf6",
                    "trackInnerGlowOpacity": 50,
                    "barThickness": 10,
                    "barOpacity": 78,
                    "barOutlineOpacity": 60,
                    "barInnerGlow": 4,
                    "barInnerGlowColor": "#ffffff",
                    "barInnerGlowOpacity": 34,
                    "barOutlineWidth": 1,
                    "trackThickness": 16
                },
                "graph": {
                    "lineColor": "@accent",
                    "barRadius": 12,
                    "pointSize": 5,
                    "pointColor": "@accentSoft"
                },
                "lightgrid": {
                    "tileBackgroundColor": "#fffaf4",
                    "tileHoverColor": "@accent",
                    "tileBackgroundOpacity": 36,
                    "tileBlur": 12,
                    "tileOutlineWidth": 1,
                    "tileOutlineColor": "#f3e4b8",
                    "tileOutlineOpacity": 60,
                    "tileInnerGlow": 6,
                    "tileInnerGlowColor": "#fffaf6",
                    "tileInnerGlowOpacity": 50,
                    "iconColorOff": "@iconMuted",
                    "iconColorOn": "@accent"
                },
                "list": {
                    "gap": 6,
                    "iconSize": 24
                },
                "menu": {
                    "itemCornerRadius": 22,
                    "itemBackgroundOn": "@accent",
                    "itemBackgroundOnOpacity": 38,
                    "itemBackgroundOff": "#fffaf4",
                    "itemBackgroundOffOpacity": 40,
                    "itemBackgroundHover": "@accentSoft",
                    "itemBackgroundHoverOpacity": 26,
                    "itemBlur": 12,
                    "itemOutlineWidth": 1,
                    "itemOutlineColor": "#f3e4b8",
                    "itemOutlineOpacity": 56,
                    "itemInnerGlow": 6,
                    "itemInnerGlowColor": "#fffaf6",
                    "itemInnerGlowOpacity": 50
                },
                "slider": {
                    "trackThickness": 22,
                    "trackColor": "@controlOff",
                    "trackOpacity": 28,
                    "trackBlur": 12,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#f3e4b8",
                    "trackOutlineOpacity": 60,
                    "trackInnerGlow": 6,
                    "trackInnerGlowColor": "#fffaf6",
                    "trackInnerGlowOpacity": 52,
                    "fillThickness": 18,
                    "fillOpacity": 74,
                    "fillOutlineOpacity": 60,
                    "fillInnerGlow": 3,
                    "fillInnerGlowColor": "#ffffff",
                    "fillInnerGlowOpacity": 32,
                    "thumbSize": 24,
                    "thumbShadow": false,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#f6e6c0",
                    "thumbOutlineOpacity": 75,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 36,
                    "fillOutlineWidth": 1
                },
                "switch": {
                    "buttonRadius": 40,
                    "backgroundColorOn": "@accent",
                    "backgroundColorOff": "@controlOff",
                    "backgroundColorHover": "@accentSoft",
                    "backgroundOpacity": 40,
                    "buttonBlur": 14,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#f6e6c0",
                    "thumbOutlineOpacity": 75,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 36,
                    "glowRadius": 20,
                    "outlineWidth": 1,
                    "outlineColor": "#f3e4b8",
                    "outlineOpacity": 64,
                    "buttonInnerGlow": 8,
                    "buttonInnerGlowColor": "#fffaf6",
                    "buttonInnerGlowOpacity": 58,
                    "typography": {
                        "buttonLabelOutside": {
                            "fontSize": 15,
                            "bold": true
                        },
                        "buttonLabelInside": {
                            "fontSize": 15,
                            "bold": true
                        }
                    }
                }
            }
        }
    },
    "blueprint": {
        "name": "Engineering Blue",
        "previewImage": "images/theme-preview/blueprint.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "radial",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'JetBrains Mono', monospace",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 90,
                    "blur": 0
                },
                "glow": {
                    "enabled": false,
                    "radius": 0,
                    "opacity": 0
                },
                "border": {
                    "width": 2,
                    "opacity": 30,
                    "cornerRadius": 4
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#bfdbfe",
                    "backgroundAccent": "#dbeafe",
                    "surface": "#ffffff",
                    "surfaceAlt": "#eff6ff",
                    "surfaceHover": "#93c5fd",
                    "overlay": "#60a5fa",
                    "text": "#1e3a5f",
                    "textMuted": "#1d4ed8",
                    "onSurface": "#1e3a5f",
                    "onAccent": "#ffffff",
                    "accent": "#3b82f6",
                    "accentSoft": "#2563eb",
                    "accentSecondary": "#1d4ed8",
                    "accentOff": "#99afcb",
                    "controlOff": "#2563eb",
                    "thumb": "#ffffff",
                    "border": "#93c5fd",
                    "borderAccent": "#60a5fa",
                    "icon": "#1d4ed8",
                    "iconAccent": "#7EB2E0",
                    "iconMuted": "#2563eb",
                    "success": "#2563eb",
                    "warning": "#d97706",
                    "danger": "#dc2626",
                    "glow": "#3b82f6",
                    "link": "#1d4ed8",
                    "placeholder": "#3b82f6",
                    "markerTint1": "#fb923c",
                    "markerTint2": "#f43f5e",
                    "markerTint3": "#4ade80",
                    "markerTint4": "#a855f7"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 4,
                    "enableGlow": false,
                    "outlineWidth": 1,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": false,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 1,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": false,
                    "trackOutlineWidth": 1,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'JetBrains Mono', monospace"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 2
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "kingdom_glass": {
        "name": "Kingdom Glass",
        "previewImage": "images/theme-preview/kingdom_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startColor": "#6eafef",
                        "startOpacity": 100,
                        "endColor": "#d4ebff",
                        "endOpacity": 100,
                        "type": "linear_mirror",
                        "angle": 152,
                        "overlay": false,
                        "image": "/images/kingdom-theme.jpg",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Playpen Sans'",
                "label": {
                    "bold": true,
                    "color": "@textMuted"
                },
                "value": {
                    "color": "@text"
                }
            },
            "container": {
                "background": {
                    "startColor": "#2f7de8",
                    "startOpacity": 46,
                    "endColor": "#7eb6f5",
                    "endOpacity": 36,
                    "angle": 155,
                    "blur": 16
                },
                "glow": {
                    "enabled": true,
                    "color": "@glow",
                    "radius": 20,
                    "opacity": 20
                },
                "border": {
                    "color": "#dbeafe",
                    "width": 2,
                    "opacity": 62,
                    "cornerRadius": 22
                },
                "innerGlow": {
                    "size": 7,
                    "color": "#dbeafe",
                    "opacity": 32
                }
            },
            "theme": {
                "colors": {
                    "background": "#6eafef",
                    "backgroundAccent": "#d4ebff",
                    "surface": "#e7f3ff",
                    "surfaceAlt": "#d3e6fb",
                    "surfaceHover": "#c3dbf7",
                    "overlay": "#d7ebff",
                    "text": "#102848",
                    "textMuted": "#45617f",
                    "onSurface": "#102848",
                    "onAccent": "#ffffff",
                    "accent": "#1b6fe0",
                    "accentSoft": "#3d8ef5",
                    "accentSecondary": "#e0b03a",
                    "accentOff": "#8aafd2",
                    "controlOff": "#a9c3de",
                    "thumb": "#fff9ee",
                    "border": "#c9dff5",
                    "borderAccent": "#ffffff",
                    "icon": "#1b6fe0",
                    "iconAccent": "#d7ebff",
                    "iconMuted": "#6d8aab",
                    "success": "#2c9a4e",
                    "warning": "#e0a020",
                    "danger": "#e23b4a",
                    "glow": "#1b6fe0",
                    "link": "#1558c4",
                    "placeholder": "#6d8aab",
                    "markerTint1": "#e0b03a",
                    "markerTint2": "#2c9a4e",
                    "markerTint3": "#7c6cf0",
                    "markerTint4": "#3d8ef5"
                }
            },
            "widgetDefaults": {
                "arrow": {
                    "mainColor": "@accent",
                    "glowColor": "@accentSecondary",
                    "thickness": 12,
                    "headSize": 34,
                    "lineRadius": 10,
                    "glowWidth": 14,
                    "glowOpacity": 42
                },
                "editbox": {
                    "backgroundColor": "#ffffff",
                    "backgroundOpacity": 46,
                    "borderColor": "#ffffff",
                    "borderWidth": 1,
                    "borderRadius": 16
                },
                "gauge": {
                    "barGlow": true,
                    "trackThickness": 18,
                    "trackOpacity": 34,
                    "trackBlur": 12,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffffff",
                    "trackOutlineOpacity": 70,
                    "trackInnerGlow": 6,
                    "trackInnerGlowColor": "#ffffff",
                    "trackInnerGlowOpacity": 55,
                    "barThickness": 14,
                    "barOpacity": 88,
                    "barOutlineWidth": 0,
                    "barInnerGlow": 4,
                    "barInnerGlowColor": "#ffffff",
                    "barInnerGlowOpacity": 40,
                    "barOutlineOpacity": 80
                },
                "graph": {
                    "lineWidth": 3,
                    "lineColor": "@accent",
                    "fill": true,
                    "fillColor": "@accent",
                    "fillOpacity": 22,
                    "barOutlineWidth": 0,
                    "pointSize": 4,
                    "pointColor": "@accentSecondary"
                },
                "lightgrid": {
                    "tileBackgroundColor": "#ffffff",
                    "tileBackgroundOpacity": 42,
                    "tileHoverColor": "@accentSoft",
                    "tileBlur": 12,
                    "tileOutlineWidth": 1,
                    "tileOutlineColor": "#ffffff",
                    "tileOutlineOpacity": 75,
                    "tileInnerGlow": 6,
                    "tileInnerGlowColor": "#ffffff",
                    "tileInnerGlowOpacity": 55,
                    "iconColorOff": "@iconMuted",
                    "iconColorOn": "@accent"
                },
                "list": {
                    "gap": 6,
                    "iconSize": 24,
                    "textColor": "@text",
                    "timeColor": "@textMuted",
                    "iconColor": "@accent"
                },
                "menu": {
                    "itemCornerRadius": 14,
                    "itemBackgroundOn": "@accent",
                    "itemBackgroundOnOpacity": 36,
                    "itemBackgroundOff": "#ffffff",
                    "itemBackgroundOffOpacity": 36,
                    "itemBackgroundHover": "@accentSoft",
                    "itemBackgroundHoverOpacity": 28,
                    "itemBlur": 12,
                    "itemOutlineWidth": 1,
                    "itemOutlineColor": "#ffffff",
                    "itemOutlineOpacity": 70,
                    "itemInnerGlow": 6,
                    "itemInnerGlowColor": "#ffffff",
                    "itemInnerGlowOpacity": 50
                },
                "slider": {
                    "trackColor": "@controlOff",
                    "fillColor": "@accent",
                    "thumbColor": "@thumb",
                    "trackThickness": 22,
                    "trackOpacity": 36,
                    "trackBlur": 12,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffffff",
                    "trackOutlineOpacity": 70,
                    "trackInnerGlow": 6,
                    "trackInnerGlowColor": "#ffffff",
                    "trackInnerGlowOpacity": 50,
                    "fillThickness": 16,
                    "fillOpacity": 90,
                    "fillOutlineWidth": 0,
                    "fillInnerGlow": 3,
                    "fillInnerGlowColor": "#ffffff",
                    "fillInnerGlowOpacity": 40,
                    "thumbSize": 26,
                    "thumbShadow": false,
                    "thumbOutlineWidth": 2,
                    "thumbOutlineColor": "@accentSecondary",
                    "thumbOutlineOpacity": 90,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 50,
                    "fillOutlineOpacity": 80
                },
                "switch": {
                    "backgroundColorOn": "@accent",
                    "backgroundColorOff": "@controlOff",
                    "backgroundColorHover": "@accentSoft",
                    "thumbColor": "@thumb",
                    "buttonRadius": 22,
                    "backgroundOpacity": 62,
                    "buttonBlur": 14,
                    "thumbOutlineWidth": 2,
                    "thumbOutlineColor": "@accentSecondary",
                    "thumbOutlineOpacity": 90,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 50,
                    "enableGlow": true,
                    "glowColor": "@glow",
                    "glowRadius": 14,
                    "outlineWidth": 1,
                    "outlineColor": "#ffffff",
                    "outlineOpacity": 80,
                    "buttonInnerGlow": 8,
                    "buttonInnerGlowColor": "#ffffff",
                    "buttonInnerGlowOpacity": 60,
                    "typography": {
                        "buttonLabelOutside": {
                            "fontSize": 15,
                            "bold": true
                        },
                        "buttonLabelInside": {
                            "fontSize": 15,
                            "bold": true,
                            "color": "@onAccent"
                        }
                    }
                }
            }
        }
    },
    "latte_macchiato": {
        "name": "Latte Macchiato",
        "previewImage": "images/theme-preview/latte_macchiato.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "radial",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Oswald', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 160,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 20,
                    "opacity": 50
                },
                "border": {
                    "width": 1,
                    "opacity": 30,
                    "cornerRadius": 18
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#d4c5a0",
                    "backgroundAccent": "#ebe5d2",
                    "surface": "#fef3c7",
                    "surfaceAlt": "#f7ecb5",
                    "surfaceHover": "#fcd34d",
                    "overlay": "#fbbf24",
                    "text": "#451a03",
                    "textMuted": "#78350f",
                    "onSurface": "#451a03",
                    "onAccent": "#ffffff",
                    "accent": "#d97706",
                    "accentSoft": "#b45309",
                    "accentSecondary": "#92400e",
                    "accentOff": "#cab86e",
                    "controlOff": "#b45309",
                    "thumb": "#ffffff",
                    "border": "#f5deb0",
                    "borderAccent": "#d97706",
                    "icon": "#92400e",
                    "iconAccent": "#EBDAA0",
                    "iconMuted": "#b45309",
                    "success": "#b45309",
                    "warning": "#d97706",
                    "danger": "#dc2626",
                    "glow": "#d97706",
                    "link": "#92400e",
                    "placeholder": "#b45309",
                    "markerTint1": "#be185d",
                    "markerTint2": "#047857",
                    "markerTint3": "#1d4ed8",
                    "markerTint4": "#6d28d9"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 18,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Oswald', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 14
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "arctic_blue": {
        "name": "Arctic Blue",
        "previewImage": "images/theme-preview/arctic_blue.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 0,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 40,
                    "opacity": 40
                },
                "border": {
                    "width": 1,
                    "opacity": 50,
                    "cornerRadius": 22
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#bae6fd",
                    "backgroundAccent": "#e0f2fe",
                    "surface": "#ffffff",
                    "surfaceAlt": "#f0f9ff",
                    "surfaceHover": "#7dd3fc",
                    "overlay": "#38bdf8",
                    "text": "#0c4a6e",
                    "textMuted": "#0369a1",
                    "onSurface": "#0c4a6e",
                    "onAccent": "#0c4a6e",
                    "accent": "#7dd3fc",
                    "accentSoft": "#38bdf8",
                    "accentSecondary": "#0ea5e9",
                    "accentOff": "#95b8ca",
                    "controlOff": "#0ea5e9",
                    "thumb": "#ffffff",
                    "border": "#bae6fd",
                    "borderAccent": "#38bdf8",
                    "icon": "#0284c7",
                    "iconAccent": "#DEFAFF",
                    "iconMuted": "#0ea5e9",
                    "success": "#0ea5e9",
                    "warning": "#d97706",
                    "danger": "#dc2626",
                    "glow": "#38bdf8",
                    "link": "#0284c7",
                    "placeholder": "#0369a1",
                    "markerTint1": "#f87171",
                    "markerTint2": "#fbbf24",
                    "markerTint3": "#6366f1",
                    "markerTint4": "#047857"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 40,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 18
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "neon_white": {
        "name": "Neon White",
        "previewImage": "images/theme-preview/neon_white.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear_mirror",
                        "angle": 135,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 95,
                    "endOpacity": 95,
                    "angle": 135,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 20,
                    "opacity": 30
                },
                "border": {
                    "width": 1,
                    "opacity": 100,
                    "cornerRadius": 10
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#e0e7ff",
                    "backgroundAccent": "#eef2ff",
                    "surface": "#ffffff",
                    "surfaceAlt": "#f5f3ff",
                    "surfaceHover": "#c7d2fe",
                    "overlay": "#a5b4fc",
                    "text": "#1e1b4b",
                    "textMuted": "#4338ca",
                    "onSurface": "#1e1b4b",
                    "onAccent": "#ffffff",
                    "accent": "#818cf8",
                    "accentSoft": "#6366f1",
                    "accentSecondary": "#4f46e5",
                    "accentOff": "#9fa8cb",
                    "controlOff": "#6366f1",
                    "thumb": "#ffffff",
                    "border": "#c7d2fe",
                    "borderAccent": "#a5b4fc",
                    "icon": "#4f46e5",
                    "iconAccent": "#DEEFFF",
                    "iconMuted": "#6366f1",
                    "success": "#10b981",
                    "warning": "#f59e0b",
                    "danger": "#ef4444",
                    "glow": "#6366f1",
                    "link": "#4338ca",
                    "placeholder": "#6366f1",
                    "markerTint1": "#fda4af",
                    "markerTint2": "#fcd34d",
                    "markerTint3": "#5eead4",
                    "markerTint4": "#ddd6fd"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 10,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 6
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "forest_glass": {
        "name": "Forest",
        "previewImage": "images/theme-preview/forest.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "radial",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 60,
                    "endOpacity": 40,
                    "angle": 135,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 30,
                    "opacity": 40
                },
                "border": {
                    "width": 1,
                    "opacity": 30,
                    "cornerRadius": 24
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#022c22",
                    "backgroundAccent": "#064e3b",
                    "surface": "#065f46",
                    "surfaceAlt": "#064e3b",
                    "surfaceHover": "#047857",
                    "overlay": "#022c22",
                    "text": "#ecfdf5",
                    "textMuted": "#6ee7b7",
                    "onSurface": "#ecfdf5",
                    "onAccent": "#022c22",
                    "accent": "#6ee7b7",
                    "accentSoft": "#34d399",
                    "accentSecondary": "#10b981",
                    "accentOff": "#0b4434",
                    "controlOff": "#10b981",
                    "thumb": "#ecfdf5",
                    "border": "#065f46",
                    "borderAccent": "#10b981",
                    "icon": "#34d399",
                    "iconAccent": "#135E52",
                    "iconMuted": "#10b981",
                    "success": "#34d399",
                    "warning": "#fbbf24",
                    "danger": "#f87171",
                    "glow": "#34d399",
                    "link": "#6ee7b7",
                    "placeholder": "#059669",
                    "markerTint1": "#fca5a5",
                    "markerTint2": "#fcd34d",
                    "markerTint3": "#93c5fd",
                    "markerTint4": "#d8b4fe"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 24,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 20
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "forrest_glass": {
        "name": "Forest Glass",
        "previewImage": "images/theme-preview/forrest_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "image": "/images/forest-theme.jpg",
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "size": "cover",
                        "type": "radial",
                        "angle": 0,
                        "overlay": false
                    }
                }
            },
            "typography": {},
            "container": {
                "border": {
                    "cornerRadius": 18,
                    "opacity": 80,
                    "width": 1
                },
                "background": {
                    "startOpacity": 10,
                    "angle": 135,
                    "blur": 15,
                    "endOpacity": 10
                },
                "glow": {
                    "radius": 30,
                    "opacity": 40
                },
                "innerGlow": {
                    "size": 20,
                    "opacity": 60
                }
            },
            "theme": {
                "colors": {
                    "background": "#0b2c02",
                    "backgroundAccent": "#174e06",
                    "surface": "#1c5f06",
                    "surfaceAlt": "#174e06",
                    "surfaceHover": "#217804",
                    "overlay": "#0b2c02",
                    "text": "#f3fdec",
                    "textMuted": "#9ae76e",
                    "onSurface": "#f3fdec",
                    "onAccent": "#0b2c02",
                    "accent": "#9ae76e",
                    "accentSoft": "#69d334",
                    "accentSecondary": "#42b910",
                    "accentOff": "#19440b",
                    "controlOff": "#42b910",
                    "thumb": "#DBFCC2",
                    "border": "#1c5f06",
                    "borderAccent": "#B1E014",
                    "icon": "#69d334",
                    "iconAccent": "#1c5e13",
                    "iconMuted": "#42b910",
                    "success": "#69d334",
                    "warning": "#fb2459",
                    "danger": "#f871f4",
                    "glow": "#69d334",
                    "link": "#9ae76e",
                    "placeholder": "#2d9605",
                    "markerTint1": "#fca5f9",
                    "markerTint2": "#fc4d70",
                    "markerTint3": "#93fdcf",
                    "markerTint4": "#b4d8fe"
                }
            },
            "widgetDefaults": {
                "editbox": {
                    "borderRadius": 20
                },
                "gauge": {
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 13,
                    "trackInnerGlowOpacity": 60,
                    "barOpacity": 50,
                    "barOutlineWidth": 1,
                    "barOutlineOpacity": 60,
                    "barInnerGlow": 14,
                    "barInnerGlowOpacity": 40,
                    "trackThickness": 16,
                    "barThickness": 12
                },
                "graph": {},
                "lightgrid": {
                    "tileBackgroundOpacity": 50,
                    "tileBlur": 5,
                    "tileOutlineWidth": 1,
                    "tileOutlineOpacity": 80,
                    "tileInnerGlow": 25,
                    "tileInnerGlowOpacity": 40
                },
                "menu": {
                    "itemBackgroundOnOpacity": 50,
                    "itemBackgroundOffOpacity": 50,
                    "itemBackgroundHoverOpacity": 50,
                    "itemBlur": 5,
                    "itemOutlineWidth": 1,
                    "itemOutlineOpacity": 80,
                    "itemInnerGlow": 25,
                    "itemInnerGlowOpacity": 60
                },
                "slider": {
                    "trackThickness": 24,
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 25,
                    "trackInnerGlowOpacity": 60,
                    "fillThickness": 20,
                    "fillOpacity": 50,
                    "fillOutlineWidth": 1,
                    "fillOutlineOpacity": 60,
                    "fillInnerGlow": 14,
                    "fillInnerGlowOpacity": 40,
                    "thumbSize": 24,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60
                },
                "switch": {
                    "buttonRadius": 24,
                    "backgroundOpacity": 50,
                    "buttonBlur": 5,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60,
                    "outlineWidth": 1,
                    "outlineOpacity": 80,
                    "buttonInnerGlow": 25,
                    "buttonInnerGlowOpacity": 60
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                }
            }
        }
    },
    "monochrome": {
        "name": "Monochrome",
        "previewImage": "images/theme-preview/monochrome.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "flat",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'JetBrains Mono', monospace",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 0,
                    "blur": 0
                },
                "glow": {
                    "enabled": false,
                    "radius": 0,
                    "opacity": 0
                },
                "border": {
                    "width": 2,
                    "opacity": 100,
                    "cornerRadius": 0
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#000000",
                    "backgroundAccent": "#0a0a0a",
                    "surface": "#171717",
                    "surfaceAlt": "#0a0a0a",
                    "surfaceHover": "#404040",
                    "overlay": "#000000",
                    "text": "#ffffff",
                    "textMuted": "#a3a3a3",
                    "onSurface": "#ffffff",
                    "onAccent": "#000000",
                    "accent": "#e5e5e5",
                    "accentSoft": "#ffffff",
                    "accentSecondary": "#d4d4d4",
                    "accentOff": "#262626",
                    "controlOff": "#737373",
                    "thumb": "#ffffff",
                    "border": "#262626",
                    "borderAccent": "#525252",
                    "icon": "#ffffff",
                    "iconAccent": "#8f8f8f",
                    "iconMuted": "#737373",
                    "success": "#ffffff",
                    "warning": "#d4d4d4",
                    "danger": "#a3a3a3",
                    "glow": "#ffffff",
                    "link": "#e5e5e5",
                    "placeholder": "#737373",
                    "markerTint1": "#fca5a5",
                    "markerTint2": "#93c5fd",
                    "markerTint3": "#bbf7d0",
                    "markerTint4": "#fcd34d"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 0,
                    "enableGlow": false,
                    "outlineWidth": 1,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": false,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 20,
                    "fillThickness": 16,
                    "thumbSize": 20,
                    "thumbShadow": false,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'JetBrains Mono', monospace"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 0
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "high_voltage": {
        "name": "High Voltage",
        "previewImage": "images/theme-preview/high_voltage.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 90,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Oswald', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 90,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 35,
                    "opacity": 60
                },
                "border": {
                    "width": 2,
                    "opacity": 100,
                    "cornerRadius": 6
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#0c0a00",
                    "backgroundAccent": "#1a1700",
                    "surface": "#292400",
                    "surfaceAlt": "#1f1c00",
                    "surfaceHover": "#3d3700",
                    "overlay": "#0c0a00",
                    "text": "#fef9c3",
                    "textMuted": "#d4b800",
                    "onSurface": "#fef9c3",
                    "onAccent": "#1a1700",
                    "accent": "#fcd34d",
                    "accentSoft": "#fbbf24",
                    "accentSecondary": "#eab308",
                    "accentOff": "#3d3500",
                    "controlOff": "#a16207",
                    "thumb": "#fef9c3",
                    "border": "#3d3500",
                    "borderAccent": "#a16207",
                    "icon": "#fbbf24",
                    "iconAccent": "#922614",
                    "iconMuted": "#a16207",
                    "success": "#22c55e",
                    "warning": "#eab308",
                    "danger": "#ef4444",
                    "glow": "#fbbf24",
                    "link": "#fcd34d",
                    "placeholder": "#a16207",
                    "markerTint1": "#db2777",
                    "markerTint2": "#22d3ee",
                    "markerTint3": "#9333ea",
                    "markerTint4": "#fb923c"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 6,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 18,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Oswald', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 2
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "oceanic_depth": {
        "name": "Oceanic Depth",
        "previewImage": "images/theme-preview/oceanic_depth.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "radial",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 80,
                    "endOpacity": 80,
                    "angle": 120,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 50,
                    "opacity": 40
                },
                "border": {
                    "width": 1,
                    "opacity": 40,
                    "cornerRadius": 40
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#082f49",
                    "backgroundAccent": "#0c4a6e",
                    "surface": "#0e5a8a",
                    "surfaceAlt": "#0c4a6e",
                    "surfaceHover": "#0284c7",
                    "overlay": "#082f49",
                    "text": "#e0f2fe",
                    "textMuted": "#7dd3fc",
                    "onSurface": "#e0f2fe",
                    "onAccent": "#082f49",
                    "accent": "#7dd3fc",
                    "accentSoft": "#38bdf8",
                    "accentSecondary": "#0ea5e9",
                    "accentOff": "#0b4468",
                    "controlOff": "#0ea5e9",
                    "thumb": "#e0f2fe",
                    "border": "#0c4a6e",
                    "borderAccent": "#0ea5e9",
                    "icon": "#38bdf8",
                    "iconAccent": "#185499",
                    "iconMuted": "#0ea5e9",
                    "success": "#38bdf8",
                    "warning": "#fbbf24",
                    "danger": "#f87171",
                    "glow": "#38bdf8",
                    "link": "#7dd3fc",
                    "placeholder": "#0284c7",
                    "markerTint1": "#fca5a5",
                    "markerTint2": "#6ee7b7",
                    "markerTint3": "#fde047",
                    "markerTint4": "#c4b5fd"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 40,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 36
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "deep_sea_dark_glass": {
        "name": "Deep Sea Dark Glass",
        "previewImage": "images/theme-preview/deep_sea_dark_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "image": "/images/deep-sea-theme.jpg",
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "size": "cover",
                        "type": "radial",
                        "angle": 0,
                        "overlay": false
                    }
                }
            },
            "typography": {},
            "container": {
                "background": {
                    "startOpacity": 20,
                    "endOpacity": 40,
                    "blur": 8,
                    "angle": 135
                },
                "border": {
                    "opacity": 80,
                    "width": 1,
                    "cornerRadius": 16
                },
                "innerGlow": {
                    "size": 20,
                    "opacity": 60
                }
            },
            "theme": {
                "colors": {
                    "background": "#0b1433",
                    "backgroundAccent": "#000000",
                    "surface": "#0d2148",
                    "surfaceAlt": "#000000",
                    "surfaceHover": "#2f384e",
                    "overlay": "#000000",
                    "text": "#fbfcff",
                    "textMuted": "#cddbff",
                    "onSurface": "#fbfcff",
                    "onAccent": "#051c2d",
                    "accent": "#69daff",
                    "accentSoft": "#24c5ff",
                    "accentSecondary": "#07baff",
                    "accentOff": "#1f3362",
                    "controlOff": "#505a76",
                    "border": "#1f3362",
                    "borderAccent": "#1d3376",
                    "icon": "#c7d2ff",
                    "iconAccent": "#293983",
                    "iconMuted": "#8593b9",
                    "success": "#2cff96",
                    "warning": "#ffc50b",
                    "danger": "#ff6149",
                    "glow": "#07baff",
                    "link": "#24c5ff",
                    "placeholder": "#8593b9",
                    "markerTint1": "#ff9eab",
                    "markerTint2": "#ffed80",
                    "markerTint3": "#9aa1ff",
                    "markerTint4": "#54c3cc"
                }
            },
            "widgetDefaults": {
                "gauge": {
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 13,
                    "trackInnerGlowOpacity": 60,
                    "barOpacity": 50,
                    "barOutlineWidth": 1,
                    "barOutlineOpacity": 60,
                    "barInnerGlow": 14,
                    "barInnerGlowOpacity": 40,
                    "trackThickness": 16,
                    "barThickness": 12
                },
                "graph": {},
                "lightgrid": {
                    "tileBackgroundOpacity": 50,
                    "tileBlur": 5,
                    "tileOutlineWidth": 1,
                    "tileOutlineOpacity": 80,
                    "tileInnerGlow": 25,
                    "tileInnerGlowOpacity": 40
                },
                "menu": {
                    "itemBackgroundOnOpacity": 50,
                    "itemBackgroundOffOpacity": 50,
                    "itemBackgroundHoverOpacity": 50,
                    "itemBlur": 5,
                    "itemOutlineWidth": 1,
                    "itemOutlineOpacity": 80,
                    "itemInnerGlow": 25,
                    "itemInnerGlowOpacity": 60
                },
                "slider": {
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 25,
                    "trackInnerGlowOpacity": 60,
                    "fillOpacity": 50,
                    "fillOutlineWidth": 1,
                    "fillOutlineOpacity": 60,
                    "fillInnerGlow": 14,
                    "fillInnerGlowOpacity": 40,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60,
                    "trackThickness": 28,
                    "fillThickness": 20,
                    "thumbSize": 28
                },
                "switch": {
                    "backgroundOpacity": 50,
                    "buttonBlur": 5,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60,
                    "outlineWidth": 1,
                    "outlineOpacity": 80,
                    "buttonInnerGlow": 25,
                    "buttonInnerGlowOpacity": 60,
                    "buttonRadius": 16
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 8
                }
            }
        }
    },
    "deep_sea_light_glass": {
        "name": "Deep Sea Light Glass",
        "previewImage": "images/theme-preview/deep_sea_light_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "type": "linear",
                        "angle": 180,
                        "startColor": "#042838",
                        "endColor": "#0a6e8a",
                        "image": "/images/deep-sea-theme.jpg",
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "size": "cover",
                        "overlay": false
                    }
                }
            },
            "typography": {
                "label": {
                    "bold": true
                }
            },
            "container": {
                "border": {
                    "cornerRadius": 20,
                    "color": "#d8fbff",
                    "opacity": 46,
                    "width": 1
                },
                "background": {
                    "startColor": "#0891b2",
                    "startOpacity": 50,
                    "endColor": "#22d3ee",
                    "endOpacity": 34,
                    "angle": 180,
                    "blur": 14
                },
                "glow": {
                    "radius": 26,
                    "opacity": 24
                },
                "innerGlow": {
                    "size": 6,
                    "color": "#67e8f9",
                    "opacity": 26
                }
            },
            "theme": {
                "colors": {
                    "background": "#042838",
                    "backgroundAccent": "#0a6e8a",
                    "surface": "#0c4a62",
                    "surfaceAlt": "#083848",
                    "surfaceHover": "#126888",
                    "overlay": "#021820",
                    "text": "#f3fcff",
                    "textMuted": "#b7e7f5",
                    "onSurface": "#f3fcff",
                    "onAccent": "#042838",
                    "accent": "#3fd0f0",
                    "accentSoft": "#22b8dc",
                    "accentSecondary": "#9af0ff",
                    "accentOff": "#1a5568",
                    "controlOff": "#1e6074",
                    "thumb": "#f4feff",
                    "border": "#2a7d96",
                    "borderAccent": "#9af0ff",
                    "icon": "#d4f6ff",
                    "iconAccent": "#0c4a62",
                    "iconMuted": "#7eb8c8",
                    "success": "#3dd6a0",
                    "warning": "#f5c451",
                    "danger": "#ff7a72",
                    "glow": "#3fd0f0",
                    "link": "#9af0ff",
                    "placeholder": "#7eb8c8",
                    "markerTint1": "#ff9eab",
                    "markerTint2": "#f5c451",
                    "markerTint3": "#9af0ff",
                    "markerTint4": "#c4b5fd"
                }
            },
            "widgetDefaults": {
                "arrow": {
                    "mainColor": "@accent",
                    "glowColor": "@accentSecondary",
                    "thickness": 12,
                    "headSize": 34,
                    "lineRadius": 12,
                    "glowWidth": 14,
                    "glowOpacity": 40
                },
                "editbox": {
                    "backgroundColor": "#d8fbff",
                    "backgroundOpacity": 12,
                    "borderColor": "#d8fbff",
                    "borderRadius": 14
                },
                "gauge": {
                    "trackOpacity": 28,
                    "trackBlur": 12,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#d8fbff",
                    "trackOutlineOpacity": 42,
                    "trackInnerGlow": 6,
                    "trackInnerGlowColor": "#d8fbff",
                    "trackInnerGlowOpacity": 38,
                    "barOpacity": 84,
                    "barInnerGlow": 4,
                    "barInnerGlowColor": "#ffffff",
                    "barInnerGlowOpacity": 34,
                    "barOutlineWidth": 1,
                    "barOutlineOpacity": 80,
                    "trackThickness": 16,
                    "barThickness": 12
                },
                "graph": {
                    "lineColor": "@accent",
                    "fillOpacity": 22,
                    "pointColor": "@accentSecondary"
                },
                "lightgrid": {
                    "tileBackgroundColor": "#d8fbff",
                    "tileHoverColor": "@accent",
                    "tileBackgroundOpacity": 12,
                    "tileBlur": 10,
                    "tileOutlineWidth": 1,
                    "tileOutlineColor": "#d8fbff",
                    "tileOutlineOpacity": 42,
                    "tileInnerGlow": 5,
                    "tileInnerGlowColor": "#d8fbff",
                    "tileInnerGlowOpacity": 36,
                    "iconColorOff": "@iconMuted",
                    "iconColorOn": "@accent"
                },
                "list": {
                    "gap": 6,
                    "iconSize": 24,
                    "iconColor": "@accent"
                },
                "menu": {
                    "itemCornerRadius": 12,
                    "itemBackgroundOn": "@accent",
                    "itemBackgroundOnOpacity": 42,
                    "itemBackgroundOff": "#d8fbff",
                    "itemBackgroundOffOpacity": 10,
                    "itemBackgroundHover": "@accentSoft",
                    "itemBackgroundHoverOpacity": 26,
                    "itemBlur": 10,
                    "itemOutlineWidth": 1,
                    "itemOutlineColor": "#d8fbff",
                    "itemOutlineOpacity": 40,
                    "itemInnerGlow": 5,
                    "itemInnerGlowColor": "#d8fbff",
                    "itemInnerGlowOpacity": 36
                },
                "slider": {
                    "trackThickness": 18,
                    "trackColor": "@controlOff",
                    "trackOpacity": 28,
                    "trackBlur": 10,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#d8fbff",
                    "trackOutlineOpacity": 42,
                    "trackInnerGlow": 5,
                    "trackInnerGlowColor": "#d8fbff",
                    "trackInnerGlowOpacity": 36,
                    "fillThickness": 14,
                    "fillOpacity": 82,
                    "fillInnerGlow": 3,
                    "fillInnerGlowColor": "#ffffff",
                    "fillInnerGlowOpacity": 30,
                    "thumbSize": 22,
                    "thumbShadow": false,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#d8fbff",
                    "thumbOutlineOpacity": 55,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 40,
                    "fillOutlineWidth": 1,
                    "fillOutlineOpacity": 80
                },
                "switch": {
                    "buttonRadius": 20,
                    "backgroundColorOn": "@accent",
                    "backgroundColorOff": "@controlOff",
                    "backgroundColorHover": "@accentSoft",
                    "backgroundOpacity": 44,
                    "buttonBlur": 12,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#d8fbff",
                    "thumbOutlineOpacity": 55,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 40,
                    "glowRadius": 16,
                    "outlineWidth": 1,
                    "outlineColor": "#d8fbff",
                    "outlineOpacity": 48,
                    "buttonInnerGlow": 6,
                    "buttonInnerGlowColor": "#d8fbff",
                    "buttonInnerGlowOpacity": 42,
                    "typography": {
                        "buttonLabelOutside": {
                            "fontSize": 15,
                            "bold": true
                        },
                        "buttonLabelInside": {
                            "fontSize": 15,
                            "bold": true
                        }
                    }
                }
            }
        }
    },
    "tide_glass": {
        "name": "Tide Glass",
        "previewImage": "images/theme-preview/tide_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "type": "linear",
                        "angle": 180,
                        "startColor": "#c5e6e4",
                        "startOpacity": 100,
                        "endColor": "#e6d8c4",
                        "endOpacity": 100,
                        "overlay": false,
                        "image": "/images/tide-theme.jpg",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "label": {
                    "bold": true,
                    "color": "@textMuted"
                },
                "value": {
                    "color": "@text"
                }
            },
            "container": {
                "border": {
                    "cornerRadius": 18,
                    "color": "#f7fffc",
                    "opacity": 72,
                    "width": 1
                },
                "background": {
                    "startColor": "#7eb8c0",
                    "startOpacity": 32,
                    "endColor": "#f7fffe",
                    "endOpacity": 38,
                    "angle": 180,
                    "blur": 20
                },
                "glow": {
                    "enabled": true,
                    "color": "@glow",
                    "radius": 26,
                    "opacity": 20
                },
                "innerGlow": {
                    "size": 10,
                    "color": "#f7fffc",
                    "opacity": 50
                }
            },
            "theme": {
                "colors": {
                    "background": "#c5e6e4",
                    "backgroundAccent": "#e6d8c4",
                    "surface": "#f4faf9",
                    "surfaceAlt": "#e5f3f1",
                    "surfaceHover": "#d4ebe7",
                    "overlay": "#e7f6f4",
                    "text": "#12384a",
                    "textMuted": "#4d6d78",
                    "onSurface": "#12384a",
                    "onAccent": "#f7fffe",
                    "accent": "#176488",
                    "accentSoft": "#3d92ae",
                    "accentSecondary": "#0c4a68",
                    "accentOff": "#c5ddd8",
                    "controlOff": "#d7e6e2",
                    "thumb": "#fffdf8",
                    "border": "#d5ebe6",
                    "borderAccent": "#f7f4ee",
                    "icon": "#165a7c",
                    "iconAccent": "#e7f6f4",
                    "iconMuted": "#7a9aa0",
                    "success": "#2f8a6e",
                    "warning": "#8a6430",
                    "danger": "#c45d62",
                    "glow": "#5eb8c8",
                    "link": "#14607e",
                    "placeholder": "#7a9aa0",
                    "markerTint1": "#8a6430",
                    "markerTint2": "#0c4f77",
                    "markerTint3": "#3d9aaa",
                    "markerTint4": "#6aab9a"
                }
            },
            "widgetDefaults": {
                "arrow": {
                    "mainColor": "@accent",
                    "glowColor": "@glow",
                    "thickness": 8,
                    "headSize": 26,
                    "lineRadius": 8,
                    "glowWidth": 14,
                    "glowOpacity": 42
                },
                "editbox": {
                    "backgroundColor": "#f7fffe",
                    "backgroundOpacity": 42,
                    "borderColor": "#f7fffc",
                    "borderRadius": 14
                },
                "gauge": {
                    "trackOpacity": 32,
                    "trackBlur": 10,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#f7fffc",
                    "trackOutlineOpacity": 58,
                    "trackInnerGlow": 5,
                    "trackInnerGlowColor": "#f7fffc",
                    "trackInnerGlowOpacity": 44,
                    "barOpacity": 80,
                    "barOutlineOpacity": 60,
                    "barInnerGlow": 4,
                    "barInnerGlowColor": "#ffffff",
                    "barInnerGlowOpacity": 34,
                    "barOutlineWidth": 1,
                    "trackThickness": 16,
                    "barThickness": 12
                },
                "graph": {
                    "lineColor": "@accent",
                    "fillOpacity": 22,
                    "barRadius": 8
                },
                "lightgrid": {
                    "tileBackgroundColor": "#f7fffe",
                    "tileHoverColor": "@accent",
                    "tileBackgroundOpacity": 36,
                    "tileBlur": 10,
                    "tileOutlineWidth": 1,
                    "tileOutlineColor": "#f7fffc",
                    "tileOutlineOpacity": 58,
                    "tileInnerGlow": 4,
                    "tileInnerGlowColor": "#f7fffc",
                    "tileInnerGlowOpacity": 42,
                    "iconColorOff": "@iconMuted",
                    "iconColorOn": "@accent"
                },
                "list": {
                    "gap": 6,
                    "iconSize": 24
                },
                "menu": {
                    "itemCornerRadius": 12,
                    "itemBackgroundOn": "@accent",
                    "itemBackgroundOnOpacity": 40,
                    "itemBackgroundOff": "#f7fffe",
                    "itemBackgroundOffOpacity": 36,
                    "itemBackgroundHover": "@accentSoft",
                    "itemBackgroundHoverOpacity": 26,
                    "itemBlur": 10,
                    "itemOutlineWidth": 1,
                    "itemOutlineColor": "#f7fffc",
                    "itemOutlineOpacity": 56,
                    "itemInnerGlow": 4,
                    "itemInnerGlowColor": "#f7fffc",
                    "itemInnerGlowOpacity": 44
                },
                "slider": {
                    "trackThickness": 18,
                    "trackColor": "@controlOff",
                    "trackOpacity": 30,
                    "trackBlur": 10,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#f7fffc",
                    "trackOutlineOpacity": 58,
                    "trackInnerGlow": 4,
                    "trackInnerGlowColor": "#f7fffc",
                    "trackInnerGlowOpacity": 46,
                    "fillThickness": 14,
                    "fillOpacity": 76,
                    "fillOutlineOpacity": 60,
                    "fillInnerGlow": 3,
                    "fillInnerGlowColor": "#ffffff",
                    "fillInnerGlowOpacity": 32,
                    "thumbSize": 22,
                    "thumbShadow": false,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#f3e6cc",
                    "thumbOutlineOpacity": 70,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 36,
                    "fillOutlineWidth": 1
                },
                "switch": {
                    "buttonRadius": 16,
                    "backgroundColorOn": "@accent",
                    "backgroundColorOff": "@controlOff",
                    "backgroundColorHover": "@accentSoft",
                    "backgroundOpacity": 42,
                    "buttonBlur": 11,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#f3e6cc",
                    "thumbOutlineOpacity": 70,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 36,
                    "glowRadius": 16,
                    "outlineWidth": 1,
                    "outlineColor": "#f7fffc",
                    "outlineOpacity": 64,
                    "buttonInnerGlow": 5,
                    "buttonInnerGlowColor": "#f7fffc",
                    "buttonInnerGlowOpacity": 50,
                    "typography": {
                        "buttonLabelOutside": {
                            "fontSize": 15,
                            "bold": true
                        },
                        "buttonLabelInside": {
                            "fontSize": 15,
                            "bold": true
                        }
                    }
                }
            }
        }
    },
    "sunset_gradient": {
        "name": "Sunset Gradient",
        "previewImage": "images/theme-preview/sunset_gradient.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 160,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Roboto', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 90,
                    "endOpacity": 90,
                    "angle": 160,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 40,
                    "opacity": 40
                },
                "border": {
                    "width": 1,
                    "opacity": 50,
                    "cornerRadius": 20
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#3b0718",
                    "backgroundAccent": "#5c0f25",
                    "surface": "#7f1d3e",
                    "surfaceAlt": "#5c0f25",
                    "surfaceHover": "#a8274f",
                    "overlay": "#3b0718",
                    "text": "#fce7f3",
                    "textMuted": "#f9a8d4",
                    "onSurface": "#fce7f3",
                    "onAccent": "#ffffff",
                    "accent": "#fda4af",
                    "accentSoft": "#fb7185",
                    "accentSecondary": "#f43f5e",
                    "accentOff": "#6b1030",
                    "controlOff": "#f43f5e",
                    "thumb": "#fce7f3",
                    "border": "#7f1d3e",
                    "borderAccent": "#f43f5e",
                    "icon": "#fda4af",
                    "iconAccent": "#8A1A6E",
                    "iconMuted": "#f43f5e",
                    "success": "#fb7185",
                    "warning": "#fbbf24",
                    "danger": "#9f1239",
                    "glow": "#fb7185",
                    "link": "#fda4af",
                    "placeholder": "#be123c",
                    "markerTint1": "#14b8a6",
                    "markerTint2": "#fcd34d",
                    "markerTint3": "#38bdf8",
                    "markerTint4": "#a78bfa"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 20,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Roboto', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 16
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "sunset_glass": {
        "name": "Sunset Glass",
        "previewImage": "images/theme-preview/sunset_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startColor": "#6a1848",
                        "startOpacity": 100,
                        "endColor": "#ff7a2e",
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 90,
                        "overlay": false,
                        "image": "/images/sunset-theme.jpg",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Oswald', sans-serif",
                "label": {
                    "color": "@textMuted"
                },
                "value": {
                    "color": "@text"
                }
            },
            "container": {
                "background": {
                    "startColor": "#ff7a1a",
                    "startOpacity": 52,
                    "endColor": "#d4266a",
                    "endOpacity": 40,
                    "angle": 100,
                    "blur": 12
                },
                "glow": {
                    "enabled": true,
                    "color": "@glow",
                    "radius": 26,
                    "opacity": 28
                },
                "border": {
                    "color": "#ffd7a8",
                    "width": 1,
                    "opacity": 55,
                    "cornerRadius": 20
                },
                "innerGlow": {
                    "size": 6,
                    "color": "#ffd08a",
                    "opacity": 26
                }
            },
            "theme": {
                "colors": {
                    "background": "#6a1848",
                    "backgroundAccent": "#ff7a2e",
                    "surface": "#6b2440",
                    "surfaceAlt": "#4a1430",
                    "surfaceHover": "#8a3054",
                    "overlay": "#2a0c18",
                    "text": "#fff6ee",
                    "textMuted": "#ffd0b8",
                    "onSurface": "#fff6ee",
                    "onAccent": "#3a1408",
                    "accent": "#ff9a2e",
                    "accentSoft": "#ffb347",
                    "accentSecondary": "#e23d78",
                    "accentOff": "#7a3a48",
                    "controlOff": "#6b3044",
                    "thumb": "#fff8ee",
                    "border": "#c46a48",
                    "borderAccent": "#ffe0b0",
                    "icon": "#ffe7c2",
                    "iconAccent": "#6b2440",
                    "iconMuted": "#e7a888",
                    "success": "#3dcf9a",
                    "warning": "#ffe08a",
                    "danger": "#ff4d6a",
                    "glow": "#ff9a2e",
                    "link": "#ffe0b0",
                    "placeholder": "#e7a888",
                    "markerTint1": "#e23d78",
                    "markerTint2": "#ff9a2e",
                    "markerTint3": "#7dd3fc",
                    "markerTint4": "#ffe08a"
                }
            },
            "widgetDefaults": {
                "editbox": {
                    "backgroundColor": "#ffe0b0",
                    "backgroundOpacity": 14,
                    "borderColor": "#ffe0b0",
                    "borderWidth": 1,
                    "borderRadius": 12
                },
                "gauge": {
                    "barGlow": true,
                    "trackThickness": 16,
                    "trackOpacity": 30,
                    "trackBlur": 10,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffe0b0",
                    "trackOutlineOpacity": 42,
                    "trackInnerGlow": 6,
                    "trackInnerGlowColor": "#ffe7c2",
                    "trackInnerGlowOpacity": 36,
                    "barThickness": 12,
                    "barOpacity": 86,
                    "barOutlineWidth": 0,
                    "barInnerGlow": 4,
                    "barInnerGlowOpacity": 34,
                    "barOutlineOpacity": 80
                },
                "graph": {
                    "lineWidth": 2,
                    "lineColor": "@accent",
                    "fill": true,
                    "fillColor": "@accent",
                    "fillOpacity": 24,
                    "barOutlineWidth": 0,
                    "pointSize": 4,
                    "pointColor": "@accent"
                },
                "lightgrid": {
                    "tileBackgroundColor": "#ffe0b0",
                    "tileBackgroundOpacity": 14,
                    "tileHoverColor": "@accent",
                    "tileBlur": 10,
                    "tileOutlineWidth": 1,
                    "tileOutlineColor": "#ffe0b0",
                    "tileOutlineOpacity": 42,
                    "tileInnerGlow": 5,
                    "tileInnerGlowColor": "#ffe7c2",
                    "tileInnerGlowOpacity": 34,
                    "iconColorOff": "@iconMuted",
                    "iconColorOn": "@accent"
                },
                "menu": {
                    "itemCornerRadius": 12,
                    "itemBackgroundOn": "@accent",
                    "itemBackgroundOnOpacity": 48,
                    "itemBackgroundOff": "#ffe0b0",
                    "itemBackgroundOffOpacity": 12,
                    "itemBackgroundHover": "@accentSoft",
                    "itemBackgroundHoverOpacity": 28,
                    "itemBlur": 10,
                    "itemOutlineWidth": 1,
                    "itemOutlineColor": "#ffe0b0",
                    "itemOutlineOpacity": 42,
                    "itemInnerGlow": 5,
                    "itemInnerGlowColor": "#ffe7c2",
                    "itemInnerGlowOpacity": 36
                },
                "slider": {
                    "trackColor": "@controlOff",
                    "fillColor": "@accent",
                    "thumbColor": "@thumb",
                    "trackThickness": 20,
                    "trackOpacity": 30,
                    "trackBlur": 10,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffe0b0",
                    "trackOutlineOpacity": 42,
                    "trackInnerGlow": 5,
                    "trackInnerGlowColor": "#ffe7c2",
                    "trackInnerGlowOpacity": 34,
                    "fillThickness": 14,
                    "fillOpacity": 86,
                    "fillOutlineWidth": 0,
                    "fillInnerGlow": 3,
                    "fillInnerGlowOpacity": 32,
                    "thumbSize": 22,
                    "thumbShadow": false,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#ffe0b0",
                    "thumbOutlineOpacity": 55,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowOpacity": 36,
                    "fillOutlineOpacity": 80
                },
                "switch": {
                    "backgroundColorOn": "@accent",
                    "backgroundColorOff": "@controlOff",
                    "backgroundColorHover": "@accentSoft",
                    "thumbColor": "@thumb",
                    "buttonRadius": 14,
                    "backgroundOpacity": 50,
                    "buttonBlur": 12,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#ffe0b0",
                    "thumbOutlineOpacity": 55,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowOpacity": 36,
                    "enableGlow": true,
                    "glowColor": "@glow",
                    "glowRadius": 16,
                    "outlineWidth": 1,
                    "outlineColor": "#ffe0b0",
                    "outlineOpacity": 48,
                    "buttonInnerGlow": 6,
                    "buttonInnerGlowColor": "#ffe7c2",
                    "buttonInnerGlowOpacity": 40
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                }
            }
        }
    },
    "deep_space": {
        "name": "Deep Space",
        "previewImage": "images/theme-preview/deep_space.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "radial",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 45,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 45,
                    "opacity": 40
                },
                "border": {
                    "width": 1,
                    "opacity": 60,
                    "cornerRadius": 18
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#160e30",
                    "backgroundAccent": "#251b4d",
                    "surface": "#332870",
                    "surfaceAlt": "#281f5c",
                    "surfaceHover": "#4c3d99",
                    "overlay": "#160e30",
                    "text": "#ede9fe",
                    "textMuted": "#c4b5fd",
                    "onSurface": "#ede9fe",
                    "onAccent": "#ffffff",
                    "accent": "#c4b5fd",
                    "accentSoft": "#a78bfa",
                    "accentSecondary": "#8b5cf6",
                    "accentOff": "#3b2d6e",
                    "controlOff": "#8b5cf6",
                    "thumb": "#ede9fe",
                    "border": "#332870",
                    "borderAccent": "#7c3aed",
                    "icon": "#a78bfa",
                    "iconAccent": "#422599",
                    "iconMuted": "#7c3aed",
                    "success": "#a78bfa",
                    "warning": "#fbbf24",
                    "danger": "#f87171",
                    "glow": "#a78bfa",
                    "link": "#c4b5fd",
                    "placeholder": "#7c3aed",
                    "markerTint1": "#fb923c",
                    "markerTint2": "#34d399",
                    "markerTint3": "#fb7185",
                    "markerTint4": "#67e8f9"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 18,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 14
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "nebula_dark_glass": {
        "name": "Nebula Dark Glass",
        "previewImage": "images/theme-preview/nebula_dark_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "type": "linear",
                        "angle": 135,
                        "image": "/images/nebula-theme.jpg",
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "size": "cover",
                        "overlay": false
                    }
                }
            },
            "typography": {},
            "container": {
                "border": {
                    "cornerRadius": 15,
                    "opacity": 80,
                    "width": 1
                },
                "background": {
                    "startOpacity": 30,
                    "endOpacity": 60,
                    "angle": 135,
                    "blur": 10
                },
                "glow": {
                    "radius": 20,
                    "opacity": 25
                },
                "innerGlow": {
                    "size": 20,
                    "opacity": 60
                }
            },
            "theme": {
                "colors": {
                    "background": "#000000",
                    "backgroundAccent": "#000000",
                    "surface": "#27102c",
                    "surfaceAlt": "#000000",
                    "surfaceHover": "#8b3aa1",
                    "overlay": "#000000",
                    "text": "#fff6f4",
                    "textMuted": "#ffdef5",
                    "onSurface": "#fff6f4",
                    "onAccent": "#ffffff",
                    "accent": "#ff9677",
                    "accentSoft": "#ff7b4e",
                    "accentSecondary": "#FF6D2D",
                    "accentOff": "#37142b",
                    "controlOff": "#FF6D2D",
                    "border": "#27102c",
                    "borderAccent": "#cd28b5",
                    "icon": "#ff9677",
                    "iconAccent": "#b55783",
                    "iconMuted": "#ff5ff6",
                    "success": "#D98859",
                    "warning": "#a3ff0b",
                    "danger": "#ffd149",
                    "glow": "#ff7b4e",
                    "link": "#ff9677",
                    "placeholder": "#ff3ee8",
                    "markerTint1": "#3fb5ff",
                    "markerTint2": "#98ff25",
                    "markerTint3": "#453aff",
                    "markerTint4": "#ff86e1"
                }
            },
            "widgetDefaults": {
                "editbox": {
                    "borderRadius": 2
                },
                "gauge": {
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 13,
                    "trackInnerGlowOpacity": 60,
                    "barOpacity": 90,
                    "barOutlineWidth": 1,
                    "barOutlineOpacity": 60,
                    "barInnerGlow": 14,
                    "barInnerGlowOpacity": 40,
                    "trackThickness": 16,
                    "barThickness": 12
                },
                "graph": {},
                "lightgrid": {
                    "tileBackgroundOpacity": 50,
                    "tileBlur": 5,
                    "tileOutlineWidth": 1,
                    "tileOutlineOpacity": 80,
                    "tileInnerGlow": 25,
                    "tileInnerGlowOpacity": 40
                },
                "menu": {
                    "itemBackgroundOnOpacity": 50,
                    "itemBackgroundOffOpacity": 50,
                    "itemBackgroundHoverOpacity": 50,
                    "itemBlur": 5,
                    "itemOutlineWidth": 1,
                    "itemOutlineOpacity": 80,
                    "itemInnerGlow": 25,
                    "itemInnerGlowOpacity": 60
                },
                "slider": {
                    "trackThickness": 30,
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 25,
                    "trackInnerGlowOpacity": 60,
                    "fillThickness": 20,
                    "fillOpacity": 90,
                    "fillOutlineWidth": 1,
                    "fillOutlineOpacity": 60,
                    "fillInnerGlow": 14,
                    "fillInnerGlowOpacity": 40,
                    "thumbSize": 24,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60
                },
                "switch": {
                    "buttonRadius": 10,
                    "backgroundOpacity": 50,
                    "buttonBlur": 5,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60,
                    "outlineWidth": 1,
                    "outlineOpacity": 80,
                    "buttonInnerGlow": 25,
                    "buttonInnerGlowOpacity": 60
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                }
            }
        }
    },
    "nebula_light_glass": {
        "name": "Nebula Light Glass",
        "previewImage": "images/theme-preview/nebula_light_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startColor": "#070612",
                        "startOpacity": 100,
                        "endColor": "#1a1440",
                        "endOpacity": 100,
                        "type": "radial",
                        "angle": 0,
                        "overlay": false,
                        "image": "/images/nebula-theme.jpg",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "label": {
                    "color": "@textMuted"
                },
                "value": {
                    "color": "@text"
                }
            },
            "container": {
                "background": {
                    "startColor": "#7c3aed",
                    "startOpacity": 44,
                    "endColor": "#22d3ee",
                    "endOpacity": 32,
                    "angle": 145,
                    "blur": 14
                },
                "glow": {
                    "enabled": true,
                    "color": "@glow",
                    "radius": 28,
                    "opacity": 24
                },
                "border": {
                    "color": "#e9d5ff",
                    "width": 1,
                    "opacity": 48,
                    "cornerRadius": 18
                },
                "innerGlow": {
                    "size": 6,
                    "color": "#c4b5fd",
                    "opacity": 24
                }
            },
            "theme": {
                "colors": {
                    "background": "#070612",
                    "backgroundAccent": "#1a1440",
                    "surface": "#22143a",
                    "surfaceAlt": "#140c28",
                    "surfaceHover": "#3a2460",
                    "overlay": "#05040c",
                    "text": "#f7fbff",
                    "textMuted": "#c9d4ea",
                    "onSurface": "#f7fbff",
                    "onAccent": "#071018",
                    "accent": "#5eeaf0",
                    "accentSoft": "#22d3ee",
                    "accentSecondary": "#e879f9",
                    "accentOff": "#3a2a58",
                    "controlOff": "#3a3058",
                    "thumb": "#f8fbff",
                    "border": "#5b4a86",
                    "borderAccent": "#e879f9",
                    "icon": "#e0fbff",
                    "iconAccent": "#2a1848",
                    "iconMuted": "#a89bc4",
                    "success": "#5eead4",
                    "warning": "#f6c177",
                    "danger": "#fb7185",
                    "glow": "#5eeaf0",
                    "link": "#e879f9",
                    "placeholder": "#a89bc4",
                    "markerTint1": "#5eeaf0",
                    "markerTint2": "#e879f9",
                    "markerTint3": "#f6c177",
                    "markerTint4": "#818cf8"
                }
            },
            "widgetDefaults": {
                "editbox": {
                    "backgroundColor": "#e0fbff",
                    "backgroundOpacity": 10,
                    "borderColor": "#d8fbff",
                    "borderWidth": 1,
                    "borderRadius": 14
                },
                "gauge": {
                    "barGlow": true,
                    "trackThickness": 16,
                    "trackOpacity": 28,
                    "trackBlur": 12,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#d8fbff",
                    "trackOutlineOpacity": 38,
                    "trackInnerGlow": 6,
                    "trackInnerGlowColor": "#e0fbff",
                    "trackInnerGlowOpacity": 36,
                    "barThickness": 12,
                    "barOpacity": 84,
                    "barOutlineWidth": 0,
                    "barInnerGlow": 4,
                    "barInnerGlowOpacity": 34,
                    "barOutlineOpacity": 80
                },
                "graph": {
                    "lineWidth": 2,
                    "lineColor": "@accent",
                    "fill": true,
                    "fillColor": "@accent",
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4,
                    "pointColor": "@accentSecondary"
                },
                "lightgrid": {
                    "tileBackgroundColor": "#e0fbff",
                    "tileBackgroundOpacity": 10,
                    "tileHoverColor": "@accentSecondary",
                    "tileBlur": 10,
                    "tileOutlineWidth": 1,
                    "tileOutlineColor": "#d8fbff",
                    "tileOutlineOpacity": 38,
                    "tileInnerGlow": 5,
                    "tileInnerGlowColor": "#e0fbff",
                    "tileInnerGlowOpacity": 34,
                    "iconColorOff": "@iconMuted",
                    "iconColorOn": "@accent"
                },
                "menu": {
                    "itemCornerRadius": 12,
                    "itemBackgroundOn": "@accent",
                    "itemBackgroundOnOpacity": 40,
                    "itemBackgroundOff": "#e0fbff",
                    "itemBackgroundOffOpacity": 10,
                    "itemBackgroundHover": "@accentSecondary",
                    "itemBackgroundHoverOpacity": 24,
                    "itemBlur": 10,
                    "itemOutlineWidth": 1,
                    "itemOutlineColor": "#d8fbff",
                    "itemOutlineOpacity": 36,
                    "itemInnerGlow": 5,
                    "itemInnerGlowColor": "#e0fbff",
                    "itemInnerGlowOpacity": 34
                },
                "slider": {
                    "trackColor": "@controlOff",
                    "fillColor": "@accent",
                    "thumbColor": "@thumb",
                    "trackThickness": 20,
                    "trackOpacity": 28,
                    "trackBlur": 12,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#d8fbff",
                    "trackOutlineOpacity": 38,
                    "trackInnerGlow": 5,
                    "trackInnerGlowColor": "#e0fbff",
                    "trackInnerGlowOpacity": 34,
                    "fillThickness": 14,
                    "fillOpacity": 82,
                    "fillOutlineWidth": 0,
                    "fillInnerGlow": 3,
                    "fillInnerGlowOpacity": 30,
                    "thumbSize": 22,
                    "thumbShadow": false,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#e879f9",
                    "thumbOutlineOpacity": 70,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowOpacity": 36,
                    "fillOutlineOpacity": 80
                },
                "switch": {
                    "backgroundColorOn": "@accent",
                    "backgroundColorOff": "@controlOff",
                    "backgroundColorHover": "@accentSecondary",
                    "thumbColor": "@thumb",
                    "buttonRadius": 16,
                    "backgroundOpacity": 44,
                    "buttonBlur": 12,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#e879f9",
                    "thumbOutlineOpacity": 70,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowOpacity": 36,
                    "enableGlow": true,
                    "glowColor": "@glow",
                    "glowRadius": 16,
                    "outlineWidth": 1,
                    "outlineColor": "#d8fbff",
                    "outlineOpacity": 44,
                    "buttonInnerGlow": 6,
                    "buttonInnerGlowColor": "#e0fbff",
                    "buttonInnerGlowOpacity": 40
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                }
            }
        }
    },
    "obsidian_red": {
        "name": "Obsidian Red",
        "previewImage": "images/theme-preview/obsidian_red.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 180,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Roboto', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 180,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 20,
                    "opacity": 30
                },
                "border": {
                    "width": 1,
                    "opacity": 80,
                    "cornerRadius": 8
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#1a0000",
                    "backgroundAccent": "#2a0a0a",
                    "surface": "#3b1515",
                    "surfaceAlt": "#2a0a0a",
                    "surfaceHover": "#551c1c",
                    "overlay": "#1a0000",
                    "text": "#fee2e2",
                    "textMuted": "#fca5a5",
                    "onSurface": "#fee2e2",
                    "onAccent": "#ffffff",
                    "accent": "#f87171",
                    "accentSoft": "#ef4444",
                    "accentSecondary": "#dc2626",
                    "accentOff": "#4c1818",
                    "controlOff": "#dc2626",
                    "thumb": "#fee2e2",
                    "border": "#3b1515",
                    "borderAccent": "#dc2626",
                    "icon": "#f87171",
                    "iconAccent": "#750000",
                    "iconMuted": "#dc2626",
                    "success": "#ef4444",
                    "warning": "#fbbf24",
                    "danger": "#7f1d1d",
                    "glow": "#ef4444",
                    "link": "#f87171",
                    "placeholder": "#991b1b",
                    "markerTint1": "#0891b2",
                    "markerTint2": "#d97706",
                    "markerTint3": "#818cf8",
                    "markerTint4": "#65a30d"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 8,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Roboto', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 4
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "ruby_glass": {
        "name": "Ruby Glass",
        "previewImage": "images/theme-preview/ruby_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "type": "linear",
                        "angle": 180,
                        "image": "/images/ruby-theme.jpg",
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "size": "cover",
                        "overlay": false
                    }
                }
            },
            "typography": {
                "fontFamily": "'Roboto', sans-serif"
            },
            "container": {
                "border": {
                    "cornerRadius": 8,
                    "opacity": 80,
                    "width": 1
                },
                "background": {
                    "startOpacity": 20,
                    "endOpacity": 40,
                    "angle": 180,
                    "blur": 8
                },
                "glow": {
                    "radius": 20,
                    "opacity": 30
                },
                "innerGlow": {
                    "size": 27,
                    "opacity": 60
                }
            },
            "theme": {
                "colors": {
                    "background": "#000000",
                    "backgroundAccent": "#110504",
                    "surface": "#2d1210",
                    "surfaceAlt": "#110504",
                    "surfaceHover": "#58211d",
                    "overlay": "#000000",
                    "text": "#ffe5e3",
                    "textMuted": "#ffada7",
                    "onSurface": "#ffe5e3",
                    "onAccent": "#ffffff",
                    "accent": "#ff7d74",
                    "accentSoft": "#ff5549",
                    "accentSecondary": "#ff3a2c",
                    "accentOff": "#491a17",
                    "controlOff": "#ff3a2c",
                    "thumb": "#ffe5e3",
                    "border": "#2d1210",
                    "borderAccent": "#ff3a2c",
                    "icon": "#ff7d74",
                    "iconAccent": "#8d0900",
                    "iconMuted": "#ff3a2c",
                    "success": "#ff5549",
                    "warning": "#ffd125",
                    "danger": "#9d2c24",
                    "glow": "#ff5549",
                    "link": "#ff7d74",
                    "placeholder": "#c82e23",
                    "markerTint1": "#0bb5f1",
                    "markerTint2": "#ff9c07",
                    "markerTint3": "#8588ff",
                    "markerTint4": "#79d911"
                }
            },
            "widgetDefaults": {
                "editbox": {
                    "borderRadius": 4
                },
                "gauge": {
                    "trackOpacity": 0,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 10,
                    "barOpacity": 80,
                    "barOutlineWidth": 1,
                    "barOutlineOpacity": 60,
                    "barInnerGlow": 14,
                    "barInnerGlowOpacity": 90,
                    "trackInnerGlowOpacity": 60,
                    "trackThickness": 16,
                    "barThickness": 12
                },
                "graph": {},
                "lightgrid": {
                    "tileBackgroundOpacity": 50,
                    "tileBlur": 5,
                    "tileOutlineWidth": 1,
                    "tileOutlineOpacity": 80,
                    "tileInnerGlow": 25,
                    "tileInnerGlowOpacity": 40
                },
                "menu": {
                    "itemBackgroundOnOpacity": 50,
                    "itemBackgroundOffOpacity": 50,
                    "itemBackgroundHoverOpacity": 50,
                    "itemBlur": 5,
                    "itemOutlineWidth": 1,
                    "itemOutlineOpacity": 80,
                    "itemInnerGlow": 25,
                    "itemInnerGlowOpacity": 60
                },
                "slider": {
                    "trackThickness": 24,
                    "trackOpacity": 0,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 10,
                    "fillThickness": 20,
                    "fillOpacity": 80,
                    "fillOutlineWidth": 1,
                    "fillOutlineOpacity": 60,
                    "fillInnerGlow": 14,
                    "fillInnerGlowOpacity": 40,
                    "thumbSize": 24,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60,
                    "trackInnerGlowOpacity": 60
                },
                "switch": {
                    "buttonRadius": 8,
                    "backgroundOpacity": 50,
                    "buttonBlur": 5,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60,
                    "outlineWidth": 1,
                    "outlineOpacity": 80,
                    "buttonInnerGlow": 25,
                    "buttonInnerGlowOpacity": 60
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                }
            }
        }
    },
    "logistics_slate": {
        "name": "Logistics Slate",
        "previewImage": "images/theme-preview/logistics_slate.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 135,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Roboto', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 180,
                    "blur": 0
                },
                "glow": {
                    "enabled": false,
                    "radius": 0,
                    "opacity": 0
                },
                "border": {
                    "width": 2,
                    "opacity": 50,
                    "cornerRadius": 6
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#d6d3d1",
                    "backgroundAccent": "#e7e5e4",
                    "surface": "#ffffff",
                    "surfaceAlt": "#f5f5f4",
                    "surfaceHover": "#e7e5e4",
                    "overlay": "#a8a29e",
                    "text": "#1c1917",
                    "textMuted": "#57534e",
                    "onSurface": "#1c1917",
                    "onAccent": "#ffffff",
                    "accent": "#f97316",
                    "accentSoft": "#ea580c",
                    "accentSecondary": "#c2410c",
                    "accentOff": "#cbac88",
                    "controlOff": "#ea580c",
                    "thumb": "#ffffff",
                    "border": "#d6d3d1",
                    "borderAccent": "#a8a29e",
                    "icon": "#c2410c",
                    "iconAccent": "#DEA381",
                    "iconMuted": "#ea580c",
                    "success": "#ea580c",
                    "warning": "#d97706",
                    "danger": "#dc2626",
                    "glow": "#ea580c",
                    "link": "#c2410c",
                    "placeholder": "#78716c",
                    "markerTint1": "#fb7185",
                    "markerTint2": "#8b5cf6",
                    "markerTint3": "#14b8a6",
                    "markerTint4": "#0ea5e9"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 6,
                    "enableGlow": false,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": false,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Roboto', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 2
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "slate_glass": {
        "name": "Slate Glass",
        "previewImage": "images/theme-preview/slate_glass.jpg",
        "version": "2.0.0",
        "themeKind": "full",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startColor": "#0b1220",
                        "endColor": "#151c2c",
                        "image": "/images/slate-theme.jpg",
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "size": "cover",
                        "type": "radial",
                        "angle": 0,
                        "overlay": false
                    }
                }
            },
            "typography": {
                "label": {
                    "bold": true
                }
            },
            "container": {
                "border": {
                    "cornerRadius": 20,
                    "color": "#ffffff",
                    "opacity": 42,
                    "width": 1
                },
                "background": {
                    "startColor": "#1a2233",
                    "startOpacity": 36,
                    "endColor": "#ffffff",
                    "endOpacity": 12,
                    "angle": 150,
                    "blur": 7
                },
                "glow": {
                    "radius": 24,
                    "opacity": 18
                },
                "innerGlow": {
                    "size": 12,
                    "color": "#ffffff",
                    "opacity": 48
                }
            },
            "theme": {
                "colors": {
                    "background": "#0b1220",
                    "backgroundAccent": "#151c2c",
                    "surface": "#1c2433",
                    "surfaceAlt": "#121826",
                    "surfaceHover": "#2a3548",
                    "overlay": "#070b12",
                    "text": "#f4f7fb",
                    "textMuted": "#a8b3c7",
                    "onSurface": "#f4f7fb",
                    "onAccent": "#061018",
                    "accent": "#7dd3fc",
                    "accentSoft": "#38bdf8",
                    "accentSecondary": "#0284c7",
                    "accentOff": "#3d4d63",
                    "controlOff": "#334155",
                    "thumb": "#f8fafc",
                    "border": "#94a3b8",
                    "borderAccent": "#e2e8f0",
                    "icon": "#dbeafe",
                    "iconAccent": "#1e3a5f",
                    "iconMuted": "#7c8da3",
                    "success": "#4ade80",
                    "warning": "#fbbf24",
                    "danger": "#f87171",
                    "glow": "#38bdf8",
                    "link": "#7dd3fc",
                    "placeholder": "#7c8da3",
                    "markerTint1": "#f9a8d4",
                    "markerTint2": "#fcd34d",
                    "markerTint3": "#93c5fd",
                    "markerTint4": "#5eead4"
                }
            },
            "widgetDefaults": {
                "arrow": {
                    "mainColor": "@accent",
                    "glowColor": "@glow",
                    "thickness": 8,
                    "headSize": 26,
                    "lineRadius": 8,
                    "glowWidth": 12,
                    "glowOpacity": 40
                },
                "editbox": {
                    "backgroundColor": "#ffffff",
                    "backgroundOpacity": 16,
                    "borderColor": "#ffffff",
                    "borderRadius": 16
                },
                "gauge": {
                    "trackOpacity": 34,
                    "trackBlur": 12,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffffff",
                    "trackOutlineOpacity": 35,
                    "trackInnerGlow": 6,
                    "trackInnerGlowColor": "#ffffff",
                    "trackInnerGlowOpacity": 40,
                    "barOpacity": 82,
                    "barOutlineOpacity": 60,
                    "barInnerGlow": 4,
                    "barInnerGlowColor": "#ffffff",
                    "barInnerGlowOpacity": 34,
                    "barOutlineWidth": 1,
                    "trackThickness": 16,
                    "barThickness": 12
                },
                "graph": {
                    "lineColor": "@accent",
                    "fillOpacity": 22,
                    "barRadius": 8
                },
                "lightgrid": {
                    "tileBackgroundColor": "#ffffff",
                    "tileBackgroundOpacity": 16,
                    "tileBlur": 10,
                    "tileOutlineWidth": 1,
                    "tileOutlineColor": "#ffffff",
                    "tileOutlineOpacity": 38,
                    "tileInnerGlow": 5,
                    "tileInnerGlowColor": "#ffffff",
                    "tileInnerGlowOpacity": 40,
                    "iconColorOff": "@iconMuted",
                    "iconColorOn": "@accent"
                },
                "list": {
                    "gap": 6,
                    "iconSize": 24
                },
                "menu": {
                    "itemCornerRadius": 14,
                    "itemBackgroundOn": "@accent",
                    "itemBackgroundOnOpacity": 42,
                    "itemBackgroundOff": "#ffffff",
                    "itemBackgroundOffOpacity": 12,
                    "itemBackgroundHover": "@accentSoft",
                    "itemBackgroundHoverOpacity": 28,
                    "itemBlur": 10,
                    "itemOutlineWidth": 1,
                    "itemOutlineColor": "#ffffff",
                    "itemOutlineOpacity": 35,
                    "itemInnerGlow": 4,
                    "itemInnerGlowColor": "#ffffff",
                    "itemInnerGlowOpacity": 40
                },
                "slider": {
                    "trackThickness": 18,
                    "trackColor": "@controlOff",
                    "trackOpacity": 32,
                    "trackBlur": 10,
                    "trackOutlineWidth": 1,
                    "trackOutlineColor": "#ffffff",
                    "trackOutlineOpacity": 40,
                    "trackInnerGlow": 4,
                    "trackInnerGlowColor": "#ffffff",
                    "trackInnerGlowOpacity": 45,
                    "fillThickness": 14,
                    "fillOpacity": 78,
                    "fillOutlineOpacity": 60,
                    "fillInnerGlow": 3,
                    "fillInnerGlowColor": "#ffffff",
                    "fillInnerGlowOpacity": 32,
                    "thumbSize": 22,
                    "thumbShadow": false,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#ffe0b0",
                    "thumbOutlineOpacity": 55,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 36,
                    "fillOutlineWidth": 1
                },
                "switch": {
                    "buttonRadius": 22,
                    "backgroundColorOn": "@accent",
                    "backgroundColorOff": "@controlOff",
                    "backgroundColorHover": "@accentSoft",
                    "backgroundOpacity": 40,
                    "buttonBlur": 12,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineColor": "#ffe0b0",
                    "thumbOutlineOpacity": 55,
                    "thumbInnerGlow": 4,
                    "thumbInnerGlowColor": "#ffffff",
                    "thumbInnerGlowOpacity": 36,
                    "glowRadius": 16,
                    "outlineWidth": 1,
                    "outlineColor": "#ffffff",
                    "outlineOpacity": 50,
                    "buttonInnerGlow": 6,
                    "buttonInnerGlowColor": "#ffffff",
                    "buttonInnerGlowOpacity": 55,
                    "typography": {
                        "buttonLabelOutside": {
                            "fontSize": 15,
                            "bold": true
                        },
                        "buttonLabelInside": {
                            "fontSize": 15,
                            "bold": true
                        }
                    }
                }
            }
        }
    },
    "trading_floor": {
        "name": "Trading Floor",
        "previewImage": "images/theme-preview/trading_floor.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "flat",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'JetBrains Mono', monospace",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 0,
                    "blur": 0
                },
                "glow": {
                    "enabled": false,
                    "radius": 0,
                    "opacity": 0
                },
                "border": {
                    "width": 1,
                    "opacity": 100,
                    "cornerRadius": 0
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#000000",
                    "backgroundAccent": "#0a1610",
                    "surface": "#0a1a10",
                    "surfaceAlt": "#05100a",
                    "surfaceHover": "#14301e",
                    "overlay": "#000000",
                    "text": "#dcfce7",
                    "textMuted": "#4ade80",
                    "onSurface": "#dcfce7",
                    "onAccent": "#022c22",
                    "accent": "#4ade80",
                    "accentSoft": "#22c55e",
                    "accentSecondary": "#16a34a",
                    "accentOff": "#0a2a16",
                    "controlOff": "#16a34a",
                    "thumb": "#dcfce7",
                    "border": "#0a2a16",
                    "borderAccent": "#16a34a",
                    "icon": "#22c55e",
                    "iconAccent": "#266e13",
                    "iconMuted": "#16a34a",
                    "success": "#22c55e",
                    "warning": "#fbbf24",
                    "danger": "#ef4444",
                    "glow": "#22c55e",
                    "link": "#4ade80",
                    "placeholder": "#15803d",
                    "markerTint1": "#e11d48",
                    "markerTint2": "#22c55e",
                    "markerTint3": "#0891b2",
                    "markerTint4": "#9333ea"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 0,
                    "enableGlow": false,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": false,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 20,
                    "fillThickness": 16,
                    "thumbSize": 20,
                    "thumbShadow": false,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'JetBrains Mono', monospace"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 0
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "clean_slate": {
        "name": "Clean Slate",
        "previewImage": "images/theme-preview/clean_slate.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 180,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 180,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 10,
                    "opacity": 60
                },
                "border": {
                    "width": 1,
                    "opacity": 50,
                    "cornerRadius": 12
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#e2e8f0",
                    "backgroundAccent": "#f1f5f9",
                    "surface": "#ffffff",
                    "surfaceAlt": "#f8fafc",
                    "surfaceHover": "#e2e8f0",
                    "overlay": "#cbd5e1",
                    "text": "#0f172a",
                    "textMuted": "#475569",
                    "onSurface": "#0f172a",
                    "onAccent": "#ffffff",
                    "accent": "#38bdf8",
                    "accentSoft": "#0ea5e9",
                    "accentSecondary": "#0284c7",
                    "accentOff": "#95b8ca",
                    "controlOff": "#0ea5e9",
                    "thumb": "#ffffff",
                    "border": "#cbd5e1",
                    "borderAccent": "#94a3b8",
                    "icon": "#0284c7",
                    "iconAccent": "#95e7d3",
                    "iconMuted": "#0ea5e9",
                    "success": "#10b981",
                    "warning": "#f59e0b",
                    "danger": "#ef4444",
                    "glow": "#0ea5e9",
                    "link": "#0284c7",
                    "placeholder": "#94a3b8",
                    "markerTint1": "#fdba74",
                    "markerTint2": "#a78bfa",
                    "markerTint3": "#34d399",
                    "markerTint4": "#f87171"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 12,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 8
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "saas_dashboard": {
        "name": "Modern SaaS",
        "previewImage": "images/theme-preview/saas_dashboard.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 180,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 0,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 20,
                    "opacity": 15
                },
                "border": {
                    "width": 1,
                    "opacity": 100,
                    "cornerRadius": 16
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#ddd6fe",
                    "backgroundAccent": "#ede9fe",
                    "surface": "#ffffff",
                    "surfaceAlt": "#f5f3ff",
                    "surfaceHover": "#ddd6fe",
                    "overlay": "#c4b5fd",
                    "text": "#1e1b4b",
                    "textMuted": "#5b21b6",
                    "onSurface": "#1e1b4b",
                    "onAccent": "#ffffff",
                    "accent": "#8b5cf6",
                    "accentSoft": "#7c3aed",
                    "accentSecondary": "#6d28d9",
                    "accentOff": "#b1abcb",
                    "controlOff": "#7c3aed",
                    "thumb": "#ffffff",
                    "border": "#ddd6fe",
                    "borderAccent": "#a78bfa",
                    "icon": "#6d28d9",
                    "iconAccent": "#a5b3ef",
                    "iconMuted": "#7c3aed",
                    "success": "#10b981",
                    "warning": "#f59e0b",
                    "danger": "#ef4444",
                    "glow": "#7c3aed",
                    "link": "#6d28d9",
                    "placeholder": "#7c3aed",
                    "markerTint1": "#fbbf24",
                    "markerTint2": "#f472b6",
                    "markerTint3": "#67e8f9",
                    "markerTint4": "#4ade80"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 16,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 12
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "architect_plan": {
        "name": "Architect Plan",
        "previewImage": "images/theme-preview/architect_plan.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "flat",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Courier New', monospace",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 0,
                    "blur": 0
                },
                "glow": {
                    "enabled": false,
                    "radius": 0,
                    "opacity": 0
                },
                "border": {
                    "width": 1,
                    "opacity": 100,
                    "cornerRadius": 0
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#e5e7eb",
                    "backgroundAccent": "#f3f4f6",
                    "surface": "#ffffff",
                    "surfaceAlt": "#f9fafb",
                    "surfaceHover": "#d1d5db",
                    "overlay": "#e5e7eb",
                    "text": "#111827",
                    "textMuted": "#4b5563",
                    "onSurface": "#111827",
                    "onAccent": "#ffffff",
                    "accent": "#374151",
                    "accentSoft": "#111827",
                    "accentSecondary": "#1f2937",
                    "accentOff": "#a7aaaf",
                    "controlOff": "#6b7280",
                    "thumb": "#ffffff",
                    "border": "#d1d5db",
                    "borderAccent": "#9ca3af",
                    "icon": "#111827",
                    "iconAccent": "#9ba3a4",
                    "iconMuted": "#6b7280",
                    "success": "#111827",
                    "warning": "#d97706",
                    "danger": "#dc2626",
                    "glow": "#9ca3af",
                    "link": "#111827",
                    "placeholder": "#6b7280",
                    "markerTint1": "#fca5a5",
                    "markerTint2": "#38bdf8",
                    "markerTint3": "#86efac",
                    "markerTint4": "#fcd34d"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 0,
                    "enableGlow": false,
                    "outlineWidth": 1,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": false,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 20,
                    "fillThickness": 16,
                    "thumbSize": 20,
                    "thumbShadow": false,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Courier New', monospace"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 0
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "data_center": {
        "name": "Data Center",
        "previewImage": "images/theme-preview/data_center.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 180,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'JetBrains Mono', monospace",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 180,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 10,
                    "opacity": 30
                },
                "border": {
                    "width": 1,
                    "opacity": 100,
                    "cornerRadius": 4
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#000000",
                    "backgroundAccent": "#071210",
                    "surface": "#0a1f1a",
                    "surfaceAlt": "#071210",
                    "surfaceHover": "#0f3028",
                    "overlay": "#000000",
                    "text": "#ecfdf5",
                    "textMuted": "#34d399",
                    "onSurface": "#ecfdf5",
                    "onAccent": "#042f2e",
                    "accent": "#34d399",
                    "accentSoft": "#10b981",
                    "accentSecondary": "#059669",
                    "accentOff": "#0a2e22",
                    "controlOff": "#059669",
                    "thumb": "#ecfdf5",
                    "border": "#0a2e22",
                    "borderAccent": "#059669",
                    "icon": "#10b981",
                    "iconAccent": "#096811",
                    "iconMuted": "#059669",
                    "success": "#10b981",
                    "warning": "#fbbf24",
                    "danger": "#ef4444",
                    "glow": "#10b981",
                    "link": "#34d399",
                    "placeholder": "#047857",
                    "markerTint1": "#db2777",
                    "markerTint2": "#fbbf24",
                    "markerTint3": "#818cf8",
                    "markerTint4": "#fb923c"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 4,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'JetBrains Mono', monospace"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 2
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "night_shift": {
        "name": "Night Shift",
        "previewImage": "images/theme-preview/night_shift.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 180,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Roboto', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 180,
                    "blur": 0
                },
                "glow": {
                    "enabled": true,
                    "radius": 30,
                    "opacity": 20
                },
                "border": {
                    "width": 1,
                    "opacity": 50,
                    "cornerRadius": 12
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#0c0706",
                    "backgroundAccent": "#1c1210",
                    "surface": "#2d1f1a",
                    "surfaceAlt": "#1c1210",
                    "surfaceHover": "#44302a",
                    "overlay": "#0c0706",
                    "text": "#fed7aa",
                    "textMuted": "#f97316",
                    "onSurface": "#fed7aa",
                    "onAccent": "#ffffff",
                    "accent": "#f97316",
                    "accentSoft": "#ea580c",
                    "accentSecondary": "#c2410c",
                    "accentOff": "#44261a",
                    "controlOff": "#c2410c",
                    "thumb": "#fed7aa",
                    "border": "#3a2418",
                    "borderAccent": "#c2410c",
                    "icon": "#f97316",
                    "iconAccent": "#910f27",
                    "iconMuted": "#c2410c",
                    "success": "#ea580c",
                    "warning": "#f59e0b",
                    "danger": "#991b1b",
                    "glow": "#ea580c",
                    "link": "#f97316",
                    "placeholder": "#9a3412",
                    "markerTint1": "#2dd4bf",
                    "markerTint2": "#a78bfa",
                    "markerTint3": "#fb7185",
                    "markerTint4": "#38bdf8"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 12,
                    "enableGlow": true,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": true,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 24,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": true,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Roboto', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 20,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 15,
                    "glowOpacity": 50
                },
                "editbox": {
                    "borderRadius": 8
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "boring_dark": {
        "name": "Boring Dark",
        "previewImage": "images/theme-preview/boring_dark.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 180,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 180,
                    "blur": 0
                },
                "glow": {
                    "enabled": false,
                    "radius": 0,
                    "opacity": 0
                },
                "border": {
                    "width": 1,
                    "opacity": 100,
                    "cornerRadius": 8
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#131518",
                    "backgroundAccent": "#1a1d21",
                    "surface": "#1e2126",
                    "surfaceAlt": "#181a1f",
                    "surfaceHover": "#272b32",
                    "overlay": "#0e1012",
                    "text": "#e6e8eb",
                    "textMuted": "#8b929c",
                    "onSurface": "#e6e8eb",
                    "onAccent": "#ffffff",
                    "accent": "#5e7a96",
                    "accentSoft": "#4a627a",
                    "accentSecondary": "#3d5267",
                    "accentOff": "#282e37",
                    "controlOff": "#2c323b",
                    "thumb": "#e6e8eb",
                    "border": "#2a2e36",
                    "borderAccent": "#3c434f",
                    "icon": "#cbd0d8",
                    "iconAccent": "#242d38",
                    "iconMuted": "#646c77",
                    "success": "#3e9c6c",
                    "warning": "#c88a3e",
                    "danger": "#b84e52",
                    "glow": "#5e7a96",
                    "link": "#7b97b3",
                    "placeholder": "#585f6a",
                    "markerTint1": "#788698",
                    "markerTint2": "#8b7e74",
                    "markerTint3": "#6f887b",
                    "markerTint4": "#867688"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 8,
                    "enableGlow": false,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": false,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 28,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": false,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 15,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 8,
                    "headSize": 24,
                    "lineRadius": 4,
                    "headRound": 4,
                    "glowWidth": 0,
                    "glowOpacity": 0
                },
                "editbox": {
                    "borderRadius": 6
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "boring_light": {
        "name": "Boring Light",
        "previewImage": "images/theme-preview/boring_light.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "linear",
                        "angle": 180,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Inter', sans-serif",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 180,
                    "blur": 0
                },
                "glow": {
                    "enabled": false,
                    "radius": 0,
                    "opacity": 0
                },
                "border": {
                    "width": 1,
                    "opacity": 100,
                    "cornerRadius": 8
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#f0f2f5",
                    "backgroundAccent": "#e5e8ec",
                    "surface": "#ffffff",
                    "surfaceAlt": "#f6f7f9",
                    "surfaceHover": "#e8ebf0",
                    "overlay": "#cbd5e1",
                    "text": "#1e232a",
                    "textMuted": "#6e7683",
                    "onSurface": "#1e232a",
                    "onAccent": "#ffffff",
                    "accent": "#475569",
                    "accentSoft": "#64748b",
                    "accentSecondary": "#334155",
                    "accentOff": "#cbd2dc",
                    "controlOff": "#d5dae2",
                    "thumb": "#ffffff",
                    "border": "#d8dde4",
                    "borderAccent": "#94a3b8",
                    "icon": "#374151",
                    "iconAccent": "#e2e8f0",
                    "iconMuted": "#8c95a2",
                    "success": "#2d8a5b",
                    "warning": "#b47324",
                    "danger": "#b04347",
                    "glow": "#64748b",
                    "link": "#3b5677",
                    "placeholder": "#9aa1ad",
                    "markerTint1": "#5b6c80",
                    "markerTint2": "#7e7063",
                    "markerTint3": "#567364",
                    "markerTint4": "#736277"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 8,
                    "enableGlow": false,
                    "outlineWidth": 0,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": false,
                    "barThickness": 12,
                    "trackThickness": 16,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 28,
                    "fillThickness": 20,
                    "thumbSize": 24,
                    "thumbShadow": false,
                    "trackOutlineWidth": 0,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "none",
                    "fontFamily": "'Inter', sans-serif"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 15,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 8,
                    "headSize": 24,
                    "lineRadius": 4,
                    "headRound": 4,
                    "glowWidth": 0,
                    "glowOpacity": 0
                },
                "editbox": {
                    "borderRadius": 6
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "eink_light": {
        "name": "E-ink Light",
        "previewImage": "images/theme-preview/eink_light.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "flat",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Courier New', monospace",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 0,
                    "blur": 0
                },
                "glow": {
                    "enabled": false,
                    "radius": 0,
                    "opacity": 0
                },
                "border": {
                    "width": 3,
                    "opacity": 100,
                    "cornerRadius": 10
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#ffffff",
                    "backgroundAccent": "#ffffff",
                    "surface": "#ffffff",
                    "surfaceAlt": "#ffffff",
                    "surfaceHover": "#ffffff",
                    "overlay": "#000000",
                    "text": "#000000",
                    "textMuted": "#000000",
                    "onSurface": "#000000",
                    "onAccent": "#ffffff",
                    "accent": "#000000",
                    "accentSoft": "#000000",
                    "accentSecondary": "#000000",
                    "accentOff": "#ffffff",
                    "controlOff": "#ffffff",
                    "thumb": "#000000",
                    "border": "#000000",
                    "borderAccent": "#000000",
                    "icon": "#000000",
                    "iconAccent": "#949494",
                    "iconMuted": "#000000",
                    "success": "#000000",
                    "warning": "#000000",
                    "danger": "#000000",
                    "glow": "#000000",
                    "link": "#000000",
                    "placeholder": "#000000",
                    "markerTint1": "#93c5fd",
                    "markerTint2": "#fca5a5",
                    "markerTint3": "#86efac",
                    "markerTint4": "#fcd34d"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 0,
                    "enableGlow": false,
                    "outlineWidth": 3,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": false,
                    "barThickness": 14,
                    "trackThickness": 18,
                    "trackOutlineWidth": 3,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 18,
                    "fillThickness": 14,
                    "thumbSize": 24,
                    "thumbShadow": false,
                    "trackOutlineWidth": 3,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "uppercase",
                    "fontFamily": "'Courier New', monospace"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 100,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 0,
                    "glowOpacity": 0
                },
                "editbox": {
                    "borderRadius": 6
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "eink_dark": {
        "name": "E-ink Dark",
        "previewImage": "images/theme-preview/eink_dark.jpg",
        "version": "2.0.0",
        "master": {
            "environment": {
                "canvas": {
                    "background": {
                        "startOpacity": 100,
                        "endOpacity": 100,
                        "type": "flat",
                        "angle": 0,
                        "overlay": false,
                        "image": "",
                        "size": "cover"
                    }
                }
            },
            "typography": {
                "fontFamily": "'Courier New', monospace",
                "base": {
                    "fontSize": 24
                },
                "value": {
                    "fontSize": 48
                },
                "unit": {
                    "fontSize": 20
                },
                "label": {
                    "fontSize": 12,
                    "textTransform": "uppercase"
                }
            },
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "angle": 0,
                    "blur": 0
                },
                "glow": {
                    "enabled": false,
                    "radius": 0,
                    "opacity": 0
                },
                "border": {
                    "width": 3,
                    "opacity": 100,
                    "cornerRadius": 10
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "theme": {
                "colors": {
                    "background": "#000000",
                    "backgroundAccent": "#000000",
                    "surface": "#000000",
                    "surfaceAlt": "#000000",
                    "surfaceHover": "#000000",
                    "overlay": "#000000",
                    "text": "#ffffff",
                    "textMuted": "#ffffff",
                    "onSurface": "#ffffff",
                    "onAccent": "#000000",
                    "accent": "#ffffff",
                    "accentSoft": "#ffffff",
                    "accentSecondary": "#ffffff",
                    "accentOff": "#000000",
                    "controlOff": "#000000",
                    "thumb": "#ffffff",
                    "border": "#ffffff",
                    "borderAccent": "#ffffff",
                    "icon": "#ffffff",
                    "iconAccent": "#8f8f8f",
                    "iconMuted": "#ffffff",
                    "success": "#ffffff",
                    "warning": "#ffffff",
                    "danger": "#ffffff",
                    "glow": "#ffffff",
                    "link": "#ffffff",
                    "placeholder": "#ffffff",
                    "markerTint1": "#52525b",
                    "markerTint2": "#71717a",
                    "markerTint3": "#a1a1aa",
                    "markerTint4": "#d4d4d8"
                }
            },
            "widgetDefaults": {
                "switch": {
                    "buttonRadius": 0,
                    "enableGlow": false,
                    "outlineWidth": 3,
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "gauge": {
                    "barGlow": false,
                    "barThickness": 14,
                    "trackThickness": 18,
                    "trackOutlineWidth": 3,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "slider": {
                    "trackThickness": 18,
                    "fillThickness": 14,
                    "thumbSize": 24,
                    "thumbShadow": false,
                    "trackOutlineWidth": 3,
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "list": {
                    "iconSize": 20,
                    "fontSize": 14,
                    "gap": 4,
                    "textTransform": "uppercase",
                    "fontFamily": "'Courier New', monospace"
                },
                "graph": {
                    "lineWidth": 2,
                    "fill": true,
                    "fillOpacity": 100,
                    "barOutlineWidth": 0,
                    "pointSize": 4
                },
                "arrow": {
                    "thickness": 10,
                    "headSize": 30,
                    "lineRadius": 5,
                    "headRound": 4,
                    "glowWidth": 0,
                    "glowOpacity": 0
                },
                "editbox": {
                    "borderRadius": 6
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                }
            }
        }
    },
    "convert_flat_to_glass": {
        "name": "Convert Flat to Glass",
        "previewImage": "images/theme-preview/convert_flat_to_glass.jpg",
        "version": "2.0.12",
        "themeKind": "adjustment",
        "master": {
            "environment": {},
            "container": {
                "background": {
                    "startOpacity": 20,
                    "endOpacity": 40,
                    "blur": 8
                },
                "border": {
                    "opacity": 80
                },
                "innerGlow": {
                    "size": 20,
                    "opacity": 60
                }
            },
            "widgetDefaults": {
                "gauge": {
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 13,
                    "trackInnerGlowOpacity": 60,
                    "barOpacity": 50,
                    "barOutlineWidth": 1,
                    "barOutlineOpacity": 60,
                    "barInnerGlow": 14,
                    "barInnerGlowOpacity": 40
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 50,
                    "tileBlur": 5,
                    "tileOutlineWidth": 1,
                    "tileOutlineOpacity": 80,
                    "tileInnerGlow": 25,
                    "tileInnerGlowOpacity": 40
                },
                "menu": {
                    "itemBackgroundOnOpacity": 50,
                    "itemBackgroundOffOpacity": 50,
                    "itemBackgroundHoverOpacity": 50,
                    "itemBlur": 5,
                    "itemOutlineWidth": 1,
                    "itemOutlineOpacity": 80,
                    "itemInnerGlow": 25,
                    "itemInnerGlowOpacity": 60
                },
                "slider": {
                    "trackOpacity": 50,
                    "trackBlur": 5,
                    "trackOutlineWidth": 1,
                    "trackOutlineOpacity": 80,
                    "trackInnerGlow": 25,
                    "trackInnerGlowOpacity": 60,
                    "fillOpacity": 50,
                    "fillOutlineWidth": 1,
                    "fillOutlineOpacity": 60,
                    "fillInnerGlow": 14,
                    "fillInnerGlowOpacity": 40,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60
                },
                "switch": {
                    "backgroundOpacity": 50,
                    "buttonBlur": 5,
                    "thumbOutlineWidth": 1,
                    "thumbOutlineOpacity": 80,
                    "thumbInnerGlow": 12,
                    "thumbInnerGlowOpacity": 60,
                    "outlineWidth": 1,
                    "outlineOpacity": 80,
                    "buttonInnerGlow": 25,
                    "buttonInnerGlowOpacity": 60
                }
            }
        }
    },
    "convert_glass_to_flat": {
        "name": "Convert Glass to Flat",
        "previewImage": "images/theme-preview/convert_glass_to_flat.jpg",
        "version": "2.0.12",
        "themeKind": "adjustment",
        "master": {
            "environment": {},
            "container": {
                "background": {
                    "startOpacity": 100,
                    "endOpacity": 100,
                    "blur": 0
                },
                "border": {
                    "opacity": 100
                },
                "innerGlow": {
                    "size": 0,
                    "opacity": 0
                }
            },
            "widgetDefaults": {
                "gauge": {
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineWidth": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "barOpacity": 100,
                    "barOutlineWidth": 0,
                    "barOutlineOpacity": 100,
                    "barInnerGlow": 0,
                    "barInnerGlowOpacity": 0
                },
                "lightgrid": {
                    "tileBackgroundOpacity": 100,
                    "tileBlur": 0,
                    "tileOutlineWidth": 0,
                    "tileOutlineOpacity": 100,
                    "tileInnerGlow": 0,
                    "tileInnerGlowOpacity": 0
                },
                "menu": {
                    "itemBackgroundOnOpacity": 100,
                    "itemBackgroundOffOpacity": 100,
                    "itemBackgroundHoverOpacity": 100,
                    "itemBlur": 0,
                    "itemOutlineWidth": 0,
                    "itemOutlineOpacity": 100,
                    "itemInnerGlow": 0,
                    "itemInnerGlowOpacity": 0
                },
                "slider": {
                    "trackOpacity": 100,
                    "trackBlur": 0,
                    "trackOutlineWidth": 0,
                    "trackOutlineOpacity": 100,
                    "trackInnerGlow": 0,
                    "trackInnerGlowOpacity": 0,
                    "fillOpacity": 100,
                    "fillOutlineWidth": 0,
                    "fillOutlineOpacity": 100,
                    "fillInnerGlow": 0,
                    "fillInnerGlowOpacity": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0
                },
                "switch": {
                    "backgroundOpacity": 100,
                    "buttonBlur": 0,
                    "thumbOutlineWidth": 0,
                    "thumbOutlineOpacity": 100,
                    "thumbInnerGlow": 0,
                    "thumbInnerGlowOpacity": 0,
                    "outlineWidth": 0,
                    "outlineOpacity": 100,
                    "buttonInnerGlow": 0,
                    "buttonInnerGlowOpacity": 0
                }
            }
        }
    }
};

const PRESET_TEMPLATES = PRESET_THEMES;
if (typeof window !== 'undefined') {
    window.PRESET_THEMES = PRESET_THEMES;
    window.PRESET_TEMPLATES = PRESET_THEMES;
}
