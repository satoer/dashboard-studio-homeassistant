'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const url = require('url');
const { Server } = require('socket.io');

let WebSocketImpl = global.WebSocket;
try {
  WebSocketImpl = require('ws');
} catch (_e) {
  WebSocketImpl = global.WebSocket;
}

function resolveExistingDir(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

const APP_ROOT = __dirname;
const ASSETS_ROOT = resolveExistingDir([
  path.join(APP_ROOT, 'assets'),
  path.join(APP_ROOT, '..', 'assets')
]);
const LIB_ROOT = resolveExistingDir([
  path.join(APP_ROOT, 'lib'),
  path.join(APP_ROOT, '..', 'HomeyApp', 'lib')
]);
const LOCALES_ROOT = resolveExistingDir([
  path.join(APP_ROOT, 'locales'),
  path.join(APP_ROOT, '..', 'HomeyApp', 'locales')
]);
const DATA_ROOT = process.env.DATA_PATH
  ? path.resolve(process.env.DATA_PATH)
  : path.join(APP_ROOT, 'userdata');

const { fetchUrlPageTitle, fetchFaviconBytes } = require(path.join(LIB_ROOT, 'url-page-title'));
const webcalMarkdown = require(path.join(LIB_ROOT, 'webcal-markdown'));
const { ICalStreamFilter } = require(path.join(LIB_ROOT, 'ical-stream'));
const icalMerge = require(path.join(LIB_ROOT, 'ical-merge'));
const { RssStreamProcessor } = require(path.join(LIB_ROOT, 'rss-stream'));
const calendarIconBindingsLib = require(path.join(LIB_ROOT, 'calendar-icon-bindings'));
const calendarSourceBlockBindingsLib = require(path.join(LIB_ROOT, 'calendar-source-block-bindings'));

const LIGHT_COMPOSITE_CAP_ID = 'light_state_json';
const LIGHT_SINGLE_CAPS = new Set([
  'onoff',
  'dim',
  'light_hue',
  'light_saturation',
  'light_temperature',
  'light_mode'
]);

const HELPER_DOMAINS = new Set([
  'input_boolean',
  'input_number',
  'input_text',
  'input_select',
  'input_datetime',
  'counter',
  'timer'
]);

const FLOW_DOMAINS = new Set([
  'automation',
  'script'
]);

const MOOD_DOMAINS = new Set([
  'scene'
]);

const BINARY_ON_OFF_DOMAINS = new Set([
  'light',
  'switch',
  'binary_sensor',
  'input_boolean',
  'fan',
  'humidifier',
  'automation',
  'script',
  'remote',
  'siren'
]);

const SKIP_RAW_ATTRIBUTES = new Set([
  'friendly_name',
  'icon',
  'entity_picture',
  'supported_features',
  'supported_color_modes',
  'color_mode',
  'hs_color',
  'rgb_color',
  'xy_color',
  'rgbw_color',
  'rgbww_color',
  'min_color_temp_kelvin',
  'max_color_temp_kelvin',
  'min_mireds',
  'max_mireds',
  'effect_list',
  'options',
  'hvac_modes',
  'fan_modes',
  'swing_modes',
  'preset_modes',
  'source_list',
  'sound_mode_list',
  'attribution',
  'device_class',
  'state_class',
  'restored',
  'editable',
  'unit_of_measurement',
  'native_unit_of_measurement',
  'display_precision',
  'suggested_display_precision',
  'last_reset',
  'assumed_state',
  'initial',
  'has_date',
  'has_time',
  'mode',
  'min',
  'max',
  'step',
  'pattern',
  'entity_id',
  'id',
  'user_id',
  'auto_update',
  'state_color'
]);

const SENSOR_DEVICE_CLASS_MAP = {
  temperature: { id: 'measure_temperature', title: 'Temperature' },
  humidity: { id: 'measure_humidity', title: 'Humidity' },
  carbon_dioxide: { id: 'measure_co2', title: 'CO2' },
  co2: { id: 'measure_co2', title: 'CO2' },
  carbon_monoxide: { id: 'measure_co', title: 'CO' },
  co: { id: 'measure_co', title: 'CO' },
  pm25: { id: 'measure_pm25', title: 'PM2.5' },
  pm2_5: { id: 'measure_pm25', title: 'PM2.5' },
  pm10: { id: 'measure_pm10', title: 'PM10' },
  pm1: { id: 'measure_pm1', title: 'PM1' },
  volatile_organic_compounds: { id: 'measure_voc', title: 'VOC' },
  volatile_organic_compounds_parts: { id: 'measure_voc', title: 'VOC' },
  voc: { id: 'measure_voc', title: 'VOC' },
  aqi: { id: 'measure_aqi', title: 'Air Quality Index' },
  nitrogen_dioxide: { id: 'measure_no2', title: 'NO2' },
  ozone: { id: 'measure_o3', title: 'Ozone' },
  power: { id: 'measure_power', title: 'Power' },
  apparent_power: { id: 'measure_power', title: 'Apparent Power' },
  reactive_power: { id: 'measure_power', title: 'Reactive Power' },
  energy: { id: 'meter_power', title: 'Energy' },
  energy_storage: { id: 'meter_power', title: 'Stored Energy' },
  gas: { id: 'meter_gas', title: 'Gas' },
  water: { id: 'meter_water', title: 'Water' },
  battery: { id: 'measure_battery', title: 'Battery' },
  illuminance: { id: 'measure_luminance', title: 'Luminance' },
  pressure: { id: 'measure_pressure', title: 'Pressure' },
  atmospheric_pressure: { id: 'measure_pressure', title: 'Atmospheric Pressure' },
  voltage: { id: 'measure_voltage', title: 'Voltage' },
  current: { id: 'measure_current', title: 'Current' },
  frequency: { id: 'measure_frequency', title: 'Frequency' },
  signal_strength: { id: 'measure_signal_strength', title: 'Signal Strength' },
  sound_pressure: { id: 'measure_noise', title: 'Noise' },
  wind_speed: { id: 'measure_wind_strength', title: 'Wind Speed' },
  wind_direction: { id: 'measure_wind_angle', title: 'Wind Direction' },
  precipitation: { id: 'measure_rain', title: 'Precipitation' },
  precipitation_intensity: { id: 'measure_rain', title: 'Rain Intensity' },
  moisture: { id: 'measure_moisture', title: 'Moisture' }
};

const BINARY_SENSOR_DEVICE_CLASS_MAP = {
  motion: { id: 'alarm_motion', title: 'Motion' },
  occupancy: { id: 'alarm_presence', title: 'Occupancy' },
  presence: { id: 'alarm_presence', title: 'Presence' },
  door: { id: 'alarm_contact', title: 'Door Contact' },
  garage_door: { id: 'alarm_contact', title: 'Garage Door' },
  window: { id: 'alarm_contact', title: 'Window Contact' },
  opening: { id: 'alarm_contact', title: 'Opening' },
  smoke: { id: 'alarm_smoke', title: 'Smoke Alarm' },
  gas: { id: 'alarm_gas', title: 'Gas Alarm' },
  carbon_monoxide: { id: 'alarm_co', title: 'CO Alarm' },
  moisture: { id: 'alarm_water', title: 'Water Leak' },
  tamper: { id: 'alarm_tamper', title: 'Tamper Alarm' },
  battery: { id: 'alarm_battery', title: 'Low Battery' },
  heat: { id: 'alarm_heat', title: 'Heat Alarm' },
  cold: { id: 'alarm_cold', title: 'Cold Alarm' },
  problem: { id: 'alarm_generic', title: 'Problem' },
  safety: { id: 'alarm_generic', title: 'Safety' },
  vibration: { id: 'alarm_vibration', title: 'Vibration' },
  connectivity: { id: 'alarm_connectivity', title: 'Connectivity' },
  plug: { id: 'onoff', title: 'Plugged In' },
  power: { id: 'onoff', title: 'Power' },
  light: { id: 'alarm_light', title: 'Light Detected' },
  sound: { id: 'alarm_noise', title: 'Sound Detected' },
  lock: { id: 'locked', title: 'Lock' }
};

function flattenSettingsLocaleStrings(node, prefix, out) {
  const acc = out || {};
  const pre = prefix || '';
  if (!node || typeof node !== 'object' || Array.isArray(node)) return acc;
  for (const k of Object.keys(node)) {
    const val = node[k];
    const next = pre ? `${pre}.${k}` : k;
    if (typeof val === 'string') {
      acc[next] = val;
    } else if (val && typeof val === 'object') {
      flattenSettingsLocaleStrings(val, next, acc);
    }
  }
  return acc;
}

function clampNum(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function roundTo(val, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(Number(val) * factor) / factor;
}

function slugifyEntityPart(raw) {
  return String(raw || 'default')
    .trim()
    .toLowerCase()
    .replace(/\.json$/i, '')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'default';
}

function normalizeDashboardId(val) {
  if (!val) return '';
  return String(val).trim().toLowerCase().replace(/\.json$/i, '');
}

function normalizePageId(val) {
  if (!val) return '';
  return String(val).trim().toLowerCase();
}

function normalizeTopicPrefix(topic) {
  if (typeof topic !== 'string') return '';
  const trimmed = topic.trim().replace(/^\/+/, '');
  if (trimmed.startsWith('homeassistant/')) {
    return trimmed.slice('homeassistant/'.length);
  }
  if (trimmed.startsWith('homey/')) {
    return trimmed.slice('homey/'.length);
  }
  return trimmed;
}

class DashboardStudioHAServer {
  constructor() {
    this.settingsFilePath = path.join(DATA_ROOT, 'settings.json');
    this.store = {
      app_settings: {},
      enabled_capabilities: {},
      personal_api_key: ''
    };
    this.stateCache = new Map();
    this.activeSessions = new Map();
    this.publishedBinarySensors = new Set();

    this.haStates = new Map();
    this.haAreas = new Map();
    this.haDevices = new Map();
    this.haEntities = new Map();
    this.haConfig = { time_zone: 'UTC', location_name: 'Home Assistant' };
    this.deviceCapByKey = new Map();
    this.deviceCapsByEntity = new Map();
    this.cachedDevicesResponse = null;

    this.ws = null;
    this.wsConnected = false;
    this.wsAuthenticated = false;
    this.wsMsgId = 1;
    this.wsPending = new Map();
    this.wsReconnectTimer = null;

    this.server = null;
    this.io = null;
    this.port = 5050;
  }

  async start() {
    this.ensureDirectories();
    this.loadPersistentStore();
    this.syncBundledCustomComponent();
    this.startHttpServer();
    this.connectToHomeAssistant();
  }

  ensureDirectories() {
    const dirs = [
      DATA_ROOT,
      path.join(DATA_ROOT, 'dashboards'),
      path.join(DATA_ROOT, 'dashboards', '.snapshots'),
      path.join(DATA_ROOT, 'templates'),
      path.join(DATA_ROOT, 'widgetpresets'),
      path.join(DATA_ROOT, 'widget-presets'),
      path.join(DATA_ROOT, 'images'),
      path.join(DATA_ROOT, 'audio')
    ];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  loadPersistentStore() {
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const raw = fs.readFileSync(this.settingsFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.store.app_settings = parsed.app_settings && typeof parsed.app_settings === 'object'
            ? parsed.app_settings
            : {};
          this.store.enabled_capabilities = parsed.enabled_capabilities && typeof parsed.enabled_capabilities === 'object'
            ? parsed.enabled_capabilities
            : {};
          this.store.personal_api_key = typeof parsed.personal_api_key === 'string'
            ? parsed.personal_api_key
            : '';
        }
      }
    } catch (err) {
      console.error('[DashboardStudio] Failed to load settings.json:', err.message);
    }

    if (process.env.PORT && !this.store.app_settings.serverPort && !this.store.app_settings.port) {
      const envPort = parseInt(process.env.PORT, 10);
      if (Number.isFinite(envPort) && envPort > 0) {
        this.store.app_settings.serverPort = envPort;
      }
    }
    if (process.env.HA_URL && !this.store.app_settings.haUrl) {
      this.store.app_settings.haUrl = process.env.HA_URL;
    }
    if (process.env.HA_TOKEN && !this.store.personal_api_key) {
      this.store.personal_api_key = process.env.HA_TOKEN;
    }
  }

  savePersistentStore() {
    try {
      fs.writeFileSync(this.settingsFilePath, JSON.stringify(this.store, null, 2), 'utf8');
    } catch (err) {
      console.error('[DashboardStudio] Failed to write settings.json:', err.message);
    }
  }

  /**
   * When running inside a Home Assistant Add-on with /homeassistant or /config mounted,
   * automatically install/update the companion custom integration so services and triggers
   * are available in Home Assistant Automations without manual file copying.
   */
  syncBundledCustomComponent() {
    const sourceCandidates = [
      path.join(APP_ROOT, 'custom_components', 'dashboard_studio'),
      path.join(APP_ROOT, '..', 'custom_components', 'dashboard_studio')
    ];
    const sourceDir = sourceCandidates.find((p) => fs.existsSync(p));
    if (!sourceDir) return;

    const targetRoots = ['/homeassistant', '/config'];
    for (const rootDir of targetRoots) {
      try {
        if (fs.existsSync(rootDir) && fs.statSync(rootDir).isDirectory()) {
          const destDir = path.join(rootDir, 'custom_components', 'dashboard_studio');
          this.copyDirectoryRecursive(sourceDir, destDir);
          console.log(`[DashboardStudio] Synced companion integration to ${destDir}`);
          break;
        }
      } catch (err) {
        console.warn(`[DashboardStudio] Could not sync custom_components to ${rootDir}:`, err.message);
      }
    }
  }

  copyDirectoryRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        this.copyDirectoryRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  getAppSettings() {
    return this.store.app_settings || {};
  }

  getEnabledCapabilities() {
    return this.store.enabled_capabilities || {};
  }

  getHaConnectionConfig() {
    const appSettings = this.getAppSettings();
    const supervisorToken = process.env.SUPERVISOR_TOKEN || process.env.HASSIO_TOKEN || '';
    const customToken = (this.store.personal_api_key || process.env.HA_TOKEN || '').trim();
    const customUrl = (appSettings.haUrl || process.env.HA_URL || '').trim().replace(/\/+$/, '');

    if (customToken) {
      const baseHttp = customUrl || 'http://homeassistant.local:8123';
      const baseWs = baseHttp.replace(/^http/i, 'ws') + '/api/websocket';
      return {
        mode: 'custom',
        httpUrl: baseHttp,
        wsUrl: baseWs,
        token: customToken
      };
    }

    if (supervisorToken) {
      return {
        mode: 'supervisor',
        httpUrl: 'http://supervisor/core',
        wsUrl: 'ws://supervisor/core/websocket',
        token: supervisorToken
      };
    }

    const fallbackHttp = customUrl || 'http://127.0.0.1:8123';
    return {
      mode: 'unconfigured',
      httpUrl: fallbackHttp,
      wsUrl: fallbackHttp.replace(/^http/i, 'ws') + '/api/websocket',
      token: ''
    };
  }

  getTimeZone() {
    if (this.haConfig && this.haConfig.time_zone) {
      return this.haConfig.time_zone;
    }
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (_e) {
      return 'UTC';
    }
  }

  i18nTranslate(key) {
    const locales = this.getSettingsUiLocaleBundle();
    if (locales && locales[key]) return locales[key];
    const parts = String(key).split('.');
    return parts[parts.length - 1] || key;
  }

  getSettingsUiLocaleBundle() {
    if (this._cachedLocaleFlat) return this._cachedLocaleFlat;
    try {
      const enPath = path.join(LOCALES_ROOT, 'en.json');
      if (fs.existsSync(enPath)) {
        const raw = JSON.parse(fs.readFileSync(enPath, 'utf8'));
        const flat = flattenSettingsLocaleStrings(raw, '', {});
        // Adapt Homey-specific phrasing in the settings dictionary for Home Assistant
        for (const k of Object.keys(flat)) {
          if (typeof flat[k] === 'string') {
            flat[k] = flat[k]
              .replace(/Removed from Homey/g, 'Removed from Home Assistant')
              .replace(/Homey API is not yet ready/g, 'Home Assistant API is not yet ready')
              .replace(/Homey will stop publishing updates/g, 'Dashboard Studio will stop publishing updates')
              .replace(/all user dashboard files on Homey are removed/g, 'all user dashboard files in the add-on are removed')
              .replace(/outside Homey/g, 'outside Home Assistant')
              .replace(/Only backups the Homey settings/g, 'Only backs up the Home Assistant configuration')
              .replace(/Only restores the Homey settings/g, 'Only restores the Home Assistant configuration');
          }
        }
        this._cachedLocaleFlat = flat;
        return flat;
      }
    } catch (err) {
      console.error('[DashboardStudio] Failed to load locale bundle:', err.message);
    }
    return {};
  }

  getAppVersion() {
    try {
      const pkgPath = path.join(APP_ROOT, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg && pkg.version) return String(pkg.version);
      }
    } catch (_e) {}
    return '2.3.2';
  }

  // =========================================================================
  // Home Assistant WebSocket & REST Client
  // =========================================================================

  connectToHomeAssistant() {
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.close();
      } catch (_e) {}
      this.ws = null;
    }

    this.wsConnected = false;
    this.wsAuthenticated = false;

    const conn = this.getHaConnectionConfig();
    if (!conn.token) {
      console.log('[DashboardStudio] No Home Assistant token configured yet. Open /admin -> Settings to configure your Long-Lived Access Token (or run as a Home Assistant Add-on).');
      return;
    }

    if (!WebSocketImpl) {
      console.error('[DashboardStudio] No WebSocket implementation available.');
      return;
    }

    try {
      const ws = new WebSocketImpl(conn.wsUrl);
      this.ws = ws;

      const onMessage = (eventOrData) => {
        const rawText = typeof eventOrData === 'string'
          ? eventOrData
          : (eventOrData && typeof eventOrData.data !== 'undefined' ? String(eventOrData.data) : String(eventOrData));
        this.handleHaWsMessage(rawText, conn.token);
      };

      const onClose = () => {
        this.wsConnected = false;
        this.wsAuthenticated = false;
        for (const [, pending] of this.wsPending.entries()) {
          pending.reject(new Error('WebSocket closed'));
        }
        this.wsPending.clear();
        this.scheduleHaReconnect();
      };

      const onError = (err) => {
        console.warn('[DashboardStudio] Home Assistant WebSocket error:', err && err.message ? err.message : err);
      };

      if (typeof ws.on === 'function') {
        ws.on('open', () => { this.wsConnected = true; });
        ws.on('message', onMessage);
        ws.on('close', onClose);
        ws.on('error', onError);
      } else {
        ws.onopen = () => { this.wsConnected = true; };
        ws.onmessage = onMessage;
        ws.onclose = onClose;
        ws.onerror = onError;
      }
    } catch (err) {
      console.error('[DashboardStudio] Failed to open Home Assistant WebSocket:', err.message);
      this.scheduleHaReconnect();
    }
  }

  scheduleHaReconnect() {
    if (this.wsReconnectTimer) return;
    this.wsReconnectTimer = setTimeout(() => {
      this.wsReconnectTimer = null;
      this.connectToHomeAssistant();
    }, 5000);
  }

  async handleHaWsMessage(rawText, token) {
    let msg;
    try {
      msg = JSON.parse(rawText);
    } catch (_e) {
      return;
    }
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'auth_required') {
      this.sendWsRaw({ type: 'auth', access_token: token });
      return;
    }

    if (msg.type === 'auth_invalid') {
      console.error('[DashboardStudio] Home Assistant authentication failed:', msg.message || 'Invalid token');
      this.wsAuthenticated = false;
      return;
    }

    if (msg.type === 'auth_ok') {
      console.log('[DashboardStudio] Connected and authenticated with Home Assistant WebSocket API.');
      this.wsAuthenticated = true;
      await this.initializeHaStateAndSubscriptions();
      return;
    }

    if (msg.type === 'result' && msg.id && this.wsPending.has(msg.id)) {
      const pending = this.wsPending.get(msg.id);
      this.wsPending.delete(msg.id);
      if (msg.success) {
        pending.resolve(msg.result);
      } else {
        pending.reject(new Error((msg.error && msg.error.message) || 'HA WebSocket command failed'));
      }
      return;
    }

    if (msg.type === 'event' && msg.event) {
      const ev = msg.event;
      if (ev.event_type === 'state_changed' && ev.data && ev.data.new_state) {
        this.onHaStateChanged(ev.data.entity_id, ev.data.new_state, ev.data.old_state);
      } else if (ev.event_type === 'area_registry_updated' || ev.event_type === 'device_registry_updated' || ev.event_type === 'entity_registry_updated') {
        this.refreshHaRegistries().catch(() => {});
      } else if (ev.event_type === 'dashboard_studio_call' && ev.data) {
        this.handleHaEventBusServiceCall(ev.data).catch((err) => {
          console.error('[DashboardStudio] Event bus service call failed:', err.message);
        });
      }
    }
  }

  sendWsRaw(payload) {
    if (!this.ws) return;
    try {
      this.ws.send(JSON.stringify(payload));
    } catch (err) {
      console.error('[DashboardStudio] WebSocket send error:', err.message);
    }
  }

  sendHaWsCommand(type, extra = {}) {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.wsAuthenticated) {
        return reject(new Error('Home Assistant WebSocket is not connected'));
      }
      const id = this.wsMsgId++;
      const payload = Object.assign({}, extra, { id, type });
      const timeout = setTimeout(() => {
        if (this.wsPending.has(id)) {
          this.wsPending.delete(id);
          reject(new Error(`HA WebSocket command timed out: ${type}`));
        }
      }, 15000);
      this.wsPending.set(id, {
        resolve: (res) => {
          clearTimeout(timeout);
          resolve(res);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        }
      });
      this.sendWsRaw(payload);
    });
  }

  async initializeHaStateAndSubscriptions() {
    try {
      const [config, states] = await Promise.all([
        this.sendHaWsCommand('get_config').catch(() => null),
        this.sendHaWsCommand('get_states').catch(() => [])
      ]);

      if (config && typeof config === 'object') {
        this.haConfig = config;
      }

      if (Array.isArray(states)) {
        this.haStates.clear();
        for (const st of states) {
          if (st && st.entity_id) {
            this.haStates.set(st.entity_id, st);
          }
        }
      }

      await this.refreshHaRegistries();

      await this.sendHaWsCommand('subscribe_events', { event_type: 'state_changed' }).catch(() => {});
      await this.sendHaWsCommand('subscribe_events', { event_type: 'area_registry_updated' }).catch(() => {});
      await this.sendHaWsCommand('subscribe_events', { event_type: 'device_registry_updated' }).catch(() => {});
      await this.sendHaWsCommand('subscribe_events', { event_type: 'entity_registry_updated' }).catch(() => {});
      await this.sendHaWsCommand('subscribe_events', { event_type: 'dashboard_studio_call' }).catch(() => {});

      this.rebuildDeviceCatalog();
      this.populateInitialStateCache(true);
      this.syncAllOpenBinarySensorsToHa();
    } catch (err) {
      console.error('[DashboardStudio] Failed to initialize HA state and subscriptions:', err.message);
    }
  }

  async refreshHaRegistries() {
    const [areas, devices, entities] = await Promise.all([
      this.sendHaWsCommand('config/area_registry/list').catch(() => []),
      this.sendHaWsCommand('config/device_registry/list').catch(() => []),
      this.sendHaWsCommand('config/entity_registry/list').catch(() => [])
    ]);

    if (Array.isArray(areas)) {
      this.haAreas.clear();
      for (const a of areas) {
        if (a && a.area_id) {
          this.haAreas.set(a.area_id, a.name || a.area_id);
        }
      }
    }

    if (Array.isArray(devices)) {
      this.haDevices.clear();
      for (const d of devices) {
        if (d && d.id) {
          this.haDevices.set(d.id, d);
        }
      }
    }

    if (Array.isArray(entities)) {
      this.haEntities.clear();
      for (const e of entities) {
        if (e && e.entity_id) {
          this.haEntities.set(e.entity_id, e);
        }
      }
    }

    this.rebuildDeviceCatalog();
  }

  haRestRequest(method, apiPath, bodyObj, customConn) {
    return new Promise((resolve, reject) => {
      const conn = customConn || this.getHaConnectionConfig();
      if (!conn.token) {
        return reject(new Error('No Home Assistant access token configured'));
      }
      const targetUrl = new url.URL(apiPath.replace(/^\/+/, '/'), conn.httpUrl.endsWith('/') ? conn.httpUrl : conn.httpUrl + '/');
      const isHttps = targetUrl.protocol === 'https:';
      const client = isHttps ? https : http;
      const bodyStr = bodyObj !== undefined && bodyObj !== null ? JSON.stringify(bodyObj) : null;

      const headers = {
        'Authorization': `Bearer ${conn.token}`,
        'Content-Type': 'application/json'
      };
      if (bodyStr) {
        headers['Content-Length'] = Buffer.byteLength(bodyStr);
      }

      const req = client.request(targetUrl, {
        method: method || 'GET',
        headers,
        timeout: 15000
      }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(text ? JSON.parse(text) : {});
            } catch (_e) {
              resolve(text);
            }
          } else {
            reject(new Error(`HA REST ${res.statusCode}: ${text.slice(0, 200)}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('HA REST request timed out'));
      });

      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  }

  // =========================================================================
  // Entity / Capability Extraction & Real-time State Sync
  // =========================================================================

  getAreaNameForEntity(entityId) {
    const entReg = this.haEntities.get(entityId);
    if (entReg) {
      if (entReg.area_id && this.haAreas.has(entReg.area_id)) {
        return this.haAreas.get(entReg.area_id);
      }
      if (entReg.device_id && this.haDevices.has(entReg.device_id)) {
        const dev = this.haDevices.get(entReg.device_id);
        if (dev && dev.area_id && this.haAreas.has(dev.area_id)) {
          return this.haAreas.get(dev.area_id);
        }
      }
    }
    return 'Default';
  }

  buildLightCompositeFromHaState(stateObj) {
    if (!stateObj) return null;
    const attrs = stateObj.attributes || {};
    const isOn = stateObj.state === 'on';
    const brightness = Number.isFinite(Number(attrs.brightness))
      ? roundTo(clampNum(Number(attrs.brightness) / 255, 0, 1), 2)
      : (isOn ? 1 : 0);

    let hue = 0;
    let saturation = 0;
    if (Array.isArray(attrs.hs_color) && attrs.hs_color.length >= 2) {
      hue = roundTo(clampNum(Number(attrs.hs_color[0]) / 360, 0, 1), 3);
      saturation = roundTo(clampNum(Number(attrs.hs_color[1]) / 100, 0, 1), 3);
    }

    let temperature = 0.5;
    if (Number.isFinite(Number(attrs.color_temp_kelvin))) {
      const minK = Number(attrs.min_color_temp_kelvin) || 2000;
      const maxK = Number(attrs.max_color_temp_kelvin) || 6535;
      const span = Math.max(1, maxK - minK);
      // Homey light_temperature: 0 = cool (maxK), 1 = warm (minK)
      temperature = roundTo(clampNum((maxK - Number(attrs.color_temp_kelvin)) / span, 0, 1), 3);
    } else if (Number.isFinite(Number(attrs.color_temp))) {
      const minM = Number(attrs.min_mireds) || 153;
      const maxM = Number(attrs.max_mireds) || 500;
      const span = Math.max(1, maxM - minM);
      temperature = roundTo(clampNum((Number(attrs.color_temp) - minM) / span, 0, 1), 3);
    }

    const colorMode = String(attrs.color_mode || '').toLowerCase();
    const mode = (colorMode === 'hs' || colorMode === 'rgb' || colorMode === 'rgbw' || colorMode === 'rgbww' || colorMode === 'xy')
      ? 'color'
      : 'temperature';

    const compositeObject = {
      state: isOn ? 'ON' : 'OFF',
      brightness: Math.round(brightness * 255),
      color_mode: mode === 'temperature' ? 'color_temp' : 'hs',
      color: { h: Math.round(hue * 360), s: Math.round(saturation * 100) },
      color_temp: Math.round(153 + (temperature * (500 - 153))),
      onoff: isOn,
      dim: brightness,
      mode,
      hue,
      saturation,
      temperature
    };

    return {
      onoff: isOn,
      dim: brightness,
      mode,
      hue,
      saturation,
      temperature,
      compositeObject,
      compositeString: compositeObject
    };
  }

  stripDevicePrefixFromTitle(friendlyName, deviceName) {
    const fn = String(friendlyName || '').trim();
    const dn = String(deviceName || '').trim();
    if (!fn || !dn) return fn;
    if (fn.toLowerCase().startsWith(dn.toLowerCase())) {
      const stripped = fn.slice(dn.length).replace(/^[\s\-:·_]+/, '').trim();
      if (stripped) return stripped;
    }
    return fn;
  }

  deriveEntityObjectSuffix(entityId, deviceSlug) {
    const objId = String(entityId || '').split('.').slice(1).join('.') || String(entityId || '');
    const slug = slugifyEntityPart(objId);
    if (deviceSlug && slug.startsWith(deviceSlug + '_')) {
      const rest = slug.slice(deviceSlug.length + 1).replace(/^_+|_+$/g, '');
      if (rest) return rest;
    }
    return slug;
  }

  resolvePrimaryCapabilityMeta(stateObj, options = {}) {
    const entityId = stateObj.entity_id;
    const domain = entityId.split('.')[0];
    const attrs = stateObj.attributes || {};
    const deviceClass = String(attrs.device_class || '').trim().toLowerCase();
    const unit = attrs.unit_of_measurement !== undefined && attrs.unit_of_measurement !== null
      ? String(attrs.unit_of_measurement).trim()
      : '';
    const friendlyName = attrs.friendly_name || entityId;
    const deviceName = options.deviceName || '';
    const deviceSlug = options.deviceSlug || '';
    const suffixSlug = this.deriveEntityObjectSuffix(entityId, deviceSlug);
    const shortTitle = this.stripDevicePrefixFromTitle(friendlyName, deviceName);

    const formatWithUnit = (label) => {
      const base = String(label || 'Value').trim();
      if (!unit) return base;
      if (base.endsWith(`(${unit})`)) return base;
      return `${base} (${unit})`;
    };

    if (domain === 'sensor') {
      const mapped = SENSOR_DEVICE_CLASS_MAP[deviceClass];
      if (mapped) {
        const baseLabel = (deviceName && shortTitle !== friendlyName) ? shortTitle : (shortTitle || mapped.title);
        return { id: mapped.id, title: formatWithUnit(baseLabel), units: unit || null };
      }

      if (suffixSlug === 'carbon_dioxide' || suffixSlug.endsWith('_co2') || suffixSlug === 'co2' || unit === 'ppm') {
        return { id: 'measure_co2', title: formatWithUnit(shortTitle || 'CO2'), units: unit || null };
      }
      if (
        suffixSlug === 'volatile_organic_compounds' ||
        suffixSlug === 'volatile_organic_compounds_parts' ||
        suffixSlug.endsWith('_voc') ||
        suffixSlug === 'voc' ||
        suffixSlug === 'tvoc' ||
        unit === 'ppb'
      ) {
        return { id: 'measure_voc', title: formatWithUnit(shortTitle || 'VOC'), units: unit || null };
      }
      if (suffixSlug === 'pm2_5' || suffixSlug === 'pm25' || suffixSlug.endsWith('_pm2_5') || suffixSlug.endsWith('_pm25')) {
        return { id: 'measure_pm25', title: formatWithUnit(shortTitle || 'PM2.5'), units: unit || null };
      }
      if (suffixSlug === 'pm10' || suffixSlug.endsWith('_pm10')) {
        return { id: 'measure_pm10', title: formatWithUnit(shortTitle || 'PM10'), units: unit || null };
      }
      if (suffixSlug === 'temperature' || suffixSlug.endsWith('_temperature') || unit === '°C' || unit === '°F') {
        return { id: 'measure_temperature', title: formatWithUnit(shortTitle || 'Temperature'), units: unit || null };
      }
      if (suffixSlug === 'humidity' || suffixSlug.endsWith('_humidity')) {
        return { id: 'measure_humidity', title: formatWithUnit(shortTitle || 'Humidity'), units: unit || null };
      }
      if (suffixSlug === 'power' || suffixSlug.endsWith('_power') || unit === 'W') {
        return { id: 'measure_power', title: formatWithUnit(shortTitle || 'Power'), units: unit || null };
      }
      if (suffixSlug === 'energy' || suffixSlug.endsWith('_energy') || unit === 'kWh' || unit === 'Wh') {
        return { id: 'meter_power', title: formatWithUnit(shortTitle || 'Energy'), units: unit || null };
      }
      if (suffixSlug === 'battery' || suffixSlug.endsWith('_battery')) {
        return { id: 'measure_battery', title: formatWithUnit(shortTitle || 'Battery'), units: unit || null };
      }
      if (suffixSlug === 'illuminance' || suffixSlug === 'lux' || unit === 'lx') {
        return { id: 'measure_luminance', title: formatWithUnit(shortTitle || 'Luminance'), units: unit || null };
      }
      if (suffixSlug === 'pressure' || unit === 'hPa' || unit === 'mbar') {
        return { id: 'measure_pressure', title: formatWithUnit(shortTitle || 'Pressure'), units: unit || null };
      }

      const fallbackId = suffixSlug || 'state';
      return {
        id: fallbackId,
        title: formatWithUnit(shortTitle || fallbackId.replace(/_/g, ' ')),
        units: unit || null
      };
    }

    if (domain === 'binary_sensor') {
      const mapped = BINARY_SENSOR_DEVICE_CLASS_MAP[deviceClass];
      if (mapped) {
        const baseLabel = (deviceName && shortTitle !== friendlyName) ? shortTitle : (shortTitle || mapped.title);
        return { id: mapped.id, title: baseLabel, units: null };
      }
      const fallbackId = suffixSlug
        ? (suffixSlug.startsWith('alarm_') || suffixSlug === 'onoff' ? suffixSlug : `alarm_${suffixSlug}`)
        : 'alarm_generic';
      return {
        id: fallbackId,
        title: shortTitle || 'Binary Sensor',
        units: null
      };
    }

    if (domain === 'number' || domain === 'select' || domain === 'text' || domain === 'button') {
      const fallbackId = suffixSlug || 'state';
      return {
        id: fallbackId,
        title: formatWithUnit(shortTitle || 'State'),
        units: unit || null
      };
    }

    return {
      id: 'state',
      title: formatWithUnit(deviceName && shortTitle !== friendlyName ? shortTitle : 'State'),
      units: unit || null
    };
  }

  extractCapabilitiesForEntity(stateObj, options = {}) {
    const caps = {};
    if (!stateObj || !stateObj.entity_id) return caps;

    const entityId = stateObj.entity_id;
    const domain = entityId.split('.')[0];
    const rawState = stateObj.state;
    const attrs = stateObj.attributes || {};
    const unit = attrs.unit_of_measurement !== undefined && attrs.unit_of_measurement !== null
      ? String(attrs.unit_of_measurement).trim()
      : null;

    let parsedState = rawState;
    if (BINARY_ON_OFF_DOMAINS.has(domain)) {
      parsedState = rawState === 'on';
    } else if (rawState !== 'unavailable' && rawState !== 'unknown' && rawState !== '') {
      const numVal = Number(rawState);
      if (Number.isFinite(numVal) && (attrs.unit_of_measurement !== undefined || domain === 'number' || domain === 'input_number' || domain === 'counter' || domain === 'sensor')) {
        parsedState = numVal;
      }
    }

    if (domain === 'light') {
      const lc = this.buildLightCompositeFromHaState(stateObj);
      if (lc) {
        caps.onoff = { value: lc.onoff, title: 'On / Off', type: 'boolean', units: null };
        caps.dim = { value: lc.dim, title: 'Dim level (0-1)', type: 'number', units: null };
        caps.light_hue = { value: lc.hue, title: 'Light Hue (0-1)', type: 'number', units: null };
        caps.light_saturation = { value: lc.saturation, title: 'Light Saturation (0-1)', type: 'number', units: null };
        caps.light_temperature = { value: lc.temperature, title: 'Color Temperature (0-1)', type: 'number', units: null };
        caps.light_mode = { value: lc.mode, title: 'Light Mode', type: 'string', units: null };
        caps[LIGHT_COMPOSITE_CAP_ID] = {
          value: lc.compositeString,
          title: 'Light Controller (Composite JSON)',
          type: 'string',
          units: null
        };
      }
    } else if (domain === 'sensor' || domain === 'binary_sensor' || domain === 'number' || domain === 'select' || domain === 'text' || domain === 'button') {
      const primaryMeta = this.resolvePrimaryCapabilityMeta(stateObj, options);
      caps[primaryMeta.id] = {
        value: parsedState,
        title: primaryMeta.title,
        type: typeof parsedState,
        units: primaryMeta.units,
        isPrimary: true
      };
    } else if (BINARY_ON_OFF_DOMAINS.has(domain)) {
      const shortTitle = options.deviceName
        ? this.stripDevicePrefixFromTitle(attrs.friendly_name || entityId, options.deviceName)
        : '';
      caps.onoff = {
        value: rawState === 'on',
        title: (shortTitle && shortTitle !== (attrs.friendly_name || entityId)) ? `${shortTitle} · On / Off` : 'On / Off',
        type: 'boolean',
        units: null,
        isPrimary: true
      };
    } else if (domain === 'cover') {
      const pos = Number.isFinite(Number(attrs.current_position))
        ? roundTo(clampNum(Number(attrs.current_position) / 100, 0, 1), 2)
        : (rawState === 'open' ? 1 : 0);
      caps.windowcoverings_set = { value: pos, title: 'Position (0-1)', type: 'number', units: null, isPrimary: true };
      caps.windowcoverings_state = {
        value: rawState === 'opening' ? 'up' : (rawState === 'closing' ? 'down' : 'idle'),
        title: 'Cover State',
        type: 'string',
        units: null
      };
    } else if (domain === 'climate') {
      if (attrs.temperature !== undefined) {
        caps.target_temperature = { value: Number(attrs.temperature), title: 'Target Temperature', type: 'number', units: unit || '°C', isPrimary: true };
      }
      if (attrs.current_temperature !== undefined) {
        caps.measure_temperature = { value: Number(attrs.current_temperature), title: 'Current Temperature', type: 'number', units: unit || '°C' };
      }
      caps.hvac_mode = { value: String(rawState || ''), title: 'HVAC Mode', type: 'string', units: null };
    } else if (domain === 'media_player') {
      caps.speaker_playing = { value: rawState === 'playing', title: 'Playing', type: 'boolean', units: null, isPrimary: true };
      if (attrs.media_artist !== undefined) {
        caps.speaker_artist = { value: String(attrs.media_artist || ''), title: 'Artist', type: 'string', units: null };
      }
      if (attrs.media_title !== undefined) {
        caps.speaker_track = { value: String(attrs.media_title || ''), title: 'Track Title', type: 'string', units: null };
      }
      if (attrs.media_album_name !== undefined) {
        caps.speaker_album = { value: String(attrs.media_album_name || ''), title: 'Album', type: 'string', units: null };
      }
      if (attrs.volume_level !== undefined) {
        caps.volume_set = { value: roundTo(Number(attrs.volume_level), 2), title: 'Volume (0-1)', type: 'number', units: null };
      }
      if (attrs.is_volume_muted !== undefined) {
        caps.volume_mute = { value: Boolean(attrs.is_volume_muted), title: 'Muted', type: 'boolean', units: null };
      }
    } else if (domain === 'lock') {
      caps.locked = { value: rawState === 'locked', title: 'Locked', type: 'boolean', units: null, isPrimary: true };
    } else {
      const primaryMeta = this.resolvePrimaryCapabilityMeta(stateObj, options);
      caps[primaryMeta.id] = {
        value: parsedState,
        title: primaryMeta.title,
        type: typeof parsedState,
        units: primaryMeta.units,
        isPrimary: true
      };
    }

    for (const [attrKey, attrVal] of Object.entries(attrs)) {
      if (SKIP_RAW_ATTRIBUTES.has(attrKey)) continue;
      if (caps[attrKey]) continue;
      if (attrVal === null || attrVal === undefined) continue;
      if (typeof attrVal === 'object') continue;
      caps[attrKey] = {
        value: attrVal,
        title: attrKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        type: typeof attrVal,
        units: null
      };
    }

    return caps;
  }

  shouldCacheCategory(cacheCategory, payload) {
    const settings = this.getAppSettings();
    const cacheMode = settings.cacheValues || settings.stateCaching || 'all';
    if (cacheMode === 'none' || cacheMode === false) return false;
    if (cacheMode === 'devices') {
      return cacheCategory === 'device' || cacheCategory === 'variable';
    }
    if (cacheMode === 'optimized') {
      const raw = typeof payload === 'string' ? payload : JSON.stringify(payload ?? '');
      return Buffer.byteLength(raw, 'utf8') < 16384;
    }
    return true;
  }

  emitMqttStylePayload(payloadObj, cacheCategory = 'device', broadcast = true) {
    if (!payloadObj || !payloadObj.topic) return;
    if (this.shouldCacheCategory(cacheCategory, payloadObj.value)) {
      this.stateCache.set(payloadObj.topic, {
        type: 'mqtt',
        data: payloadObj,
        timestamp: Date.now()
      });
    } else {
      this.stateCache.delete(payloadObj.topic);
    }
    if (broadcast && this.io) {
      this.io.emit('mqtt_message', payloadObj);
    }
  }

  sendDashboardEvent(name, value, broadcast = true) {
    const cleanName = String(name || '').trim().replace(/^(?:homey|homeassistant)\/events?\//i, '');
    if (!cleanName) return;
    const topic = `homey/event/${cleanName}`;
    const payload = { name: cleanName, value };
    if (this.shouldCacheCategory('event', value)) {
      this.stateCache.set(topic, {
        type: 'event',
        data: payload,
        timestamp: Date.now()
      });
    } else {
      this.stateCache.delete(topic);
    }
    if (broadcast && this.io) {
      this.io.emit('dashboard_event', payload);
    }
  }

  emitStateCacheToSocket(socket) {
    if (!socket) return;
    const settings = this.getAppSettings();
    const cacheMode = settings.cacheValues || settings.stateCaching || 'all';
    if (cacheMode === 'none' || cacheMode === false) {
      socket.emit('state_snapshot', []);
      return;
    }
    const sorted = Array.from(this.stateCache.values())
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    const items = sorted.map((item) => ({ type: item.type, data: item.data }));
    socket.emit('state_snapshot', items);
  }

  emitRealtimeTopic(subPath, payload, cacheCategory, broadcast = true) {
    const cleanSub = String(subPath || '').replace(/^\/+/, '');
    if (cleanSub.startsWith('events/') || cleanSub.startsWith('event/')) {
      const evName = cleanSub.replace(/^events?\//, '');
      this.sendDashboardEvent(evName, payload, broadcast);
      return;
    }
    const haTopic = `homeassistant/${cleanSub}`;
    const parts = cleanSub.split('/');
    const deviceId = parts[0] || 'homeassistant';
    const capabilityId = parts.slice(1).join('/') || 'state';
    this.emitMqttStylePayload({
      topic: haTopic,
      value: payload,
      deviceId,
      capabilityId,
      setable: true,
      getable: true,
      title: cleanSub,
      isVariable: cacheCategory === 'variable',
      isFlow: cacheCategory === 'flow',
      isMood: cacheCategory === 'mood'
    }, cacheCategory, broadcast);
  }

  isReadOnlyDomain(domain) {
    return (
      domain === 'sensor' ||
      domain === 'binary_sensor' ||
      domain === 'weather' ||
      domain === 'sun' ||
      domain === 'person' ||
      domain === 'zone' ||
      domain === 'device_tracker'
    );
  }

  rebuildDeviceCatalog() {
    const result = [];
    const byKey = new Map();
    const byEntity = new Map();
    const statesList = Array.from(this.haStates.values());
    const hasAccess = Boolean(this.getHaConnectionConfig().token);

    statesList.sort((a, b) => {
      const nameA = (a.attributes && a.attributes.friendly_name) || a.entity_id;
      const nameB = (b.attributes && b.attributes.friendly_name) || b.entity_id;
      return String(nameA).localeCompare(String(nameB));
    });

    const registerCapMapping = (mapping) => {
      byKey.set(`${mapping.deviceId}/${mapping.capId}`, mapping);
      if (!byEntity.has(mapping.entityId)) {
        byEntity.set(mapping.entityId, []);
      }
      byEntity.get(mapping.entityId).push(mapping);
    };

    const deviceEntitiesBuckets = new Map();
    const standaloneEntities = [];

    for (const st of statesList) {
      if (!st || !st.entity_id) continue;
      const entityId = st.entity_id;
      if (entityId.startsWith('binary_sensor.dashboard_studio_')) continue;

      const domain = entityId.split('.')[0];
      const friendlyName = (st.attributes && st.attributes.friendly_name) || entityId;

      if (FLOW_DOMAINS.has(domain)) {
        result.push({
          id: entityId,
          name: friendlyName,
          zoneName: 'Flows',
          capabilities: [
            {
              id: 'start',
              title: domain === 'script' ? 'Run Script' : 'Trigger Automation',
              type: 'boolean',
              getable: false,
              setable: hasAccess,
              topic: `homeassistant/flows/${entityId}/start`
            },
            {
              id: 'enabled',
              title: 'Enabled',
              type: 'boolean',
              getable: true,
              setable: hasAccess && domain === 'automation',
              topic: `homeassistant/flows/${entityId}/enabled`
            }
          ]
        });
        continue;
      }

      if (MOOD_DOMAINS.has(domain)) {
        result.push({
          id: entityId,
          name: friendlyName,
          zoneName: 'Moods',
          isMood: true,
          moodZone: this.getAreaNameForEntity(entityId),
          capabilities: [
            {
              id: 'set',
              title: 'Activate Scene',
              type: 'boolean',
              getable: false,
              setable: hasAccess,
              topic: `homeassistant/moods/${entityId}/set`
            }
          ]
        });
        continue;
      }

      if (HELPER_DOMAINS.has(domain)) {
        const helperVal = this.extractHelperValue(st);
        result.push({
          id: entityId,
          name: friendlyName,
          zoneName: 'Variables',
          capabilities: [
            {
              id: 'value',
              title: `${friendlyName} (${typeof helperVal})`,
              type: typeof helperVal,
              getable: true,
              setable: hasAccess,
              topic: `homeassistant/variables/${entityId}/value`
            }
          ]
        });
        continue;
      }

      const entReg = this.haEntities.get(entityId);
      const haDevId = entReg && entReg.device_id && this.haDevices.has(entReg.device_id)
        ? entReg.device_id
        : null;

      if (haDevId) {
        if (!deviceEntitiesBuckets.has(haDevId)) {
          deviceEntitiesBuckets.set(haDevId, []);
        }
        deviceEntitiesBuckets.get(haDevId).push(st);
      } else {
        standaloneEntities.push(st);
      }
    }

    const usedDeviceIds = new Set();

    // Build grouped Home Assistant devices
    for (const [haDevId, childStates] of deviceEntitiesBuckets.entries()) {
      const haDev = this.haDevices.get(haDevId) || {};
      const firstFriendly = (childStates[0] && childStates[0].attributes && childStates[0].attributes.friendly_name) || haDevId;
      const deviceName = String(haDev.name_by_user || haDev.name || firstFriendly).trim();
      let deviceSlug = slugifyEntityPart(deviceName);
      if (!deviceSlug || usedDeviceIds.has(deviceSlug)) {
        deviceSlug = `${deviceSlug || 'device'}_${slugifyEntityPart(haDevId).slice(0, 6)}`;
      }
      usedDeviceIds.add(deviceSlug);

      let zoneName = 'Default';
      if (haDev.area_id && this.haAreas.has(haDev.area_id)) {
        zoneName = this.haAreas.get(haDev.area_id);
      } else {
        for (const st of childStates) {
          const areaCandidate = this.getAreaNameForEntity(st.entity_id);
          if (areaCandidate && areaCandidate !== 'Default') {
            zoneName = areaCandidate;
            break;
          }
        }
      }

      // First pass: extract capabilities for each child entity and count base capability IDs
      const rawChildEntries = [];
      const baseCapCount = new Map();
      for (const st of childStates) {
        const entityId = st.entity_id;
        const domain = entityId.split('.')[0];
        const readOnly = this.isReadOnlyDomain(domain);
        const extracted = this.extractCapabilitiesForEntity(st, { deviceName, deviceSlug });
        const suffixSlug = this.deriveEntityObjectSuffix(entityId, deviceSlug);
        const shortEntityLabel = this.stripDevicePrefixFromTitle(
          (st.attributes && st.attributes.friendly_name) || entityId,
          deviceName
        );
        for (const [entityCapId, capMeta] of Object.entries(extracted)) {
          baseCapCount.set(entityCapId, (baseCapCount.get(entityCapId) || 0) + 1);
          rawChildEntries.push({
            entityId,
            domain,
            readOnly,
            entityCapId,
            capMeta,
            suffixSlug,
            shortEntityLabel
          });
        }
      }

      const capabilities = [];
      const seenFinalCapIds = new Set();

      for (const item of rawChildEntries) {
        let finalCapId = item.entityCapId;
        let finalTitle = item.capMeta.title || item.entityCapId;

        if ((baseCapCount.get(item.entityCapId) || 0) > 1) {
          if (item.suffixSlug && item.suffixSlug !== item.entityCapId) {
            finalCapId = `${item.entityCapId}_${item.suffixSlug}`;
          }
          if (item.shortEntityLabel && !finalTitle.toLowerCase().includes(item.shortEntityLabel.toLowerCase())) {
            finalTitle = `${item.shortEntityLabel} · ${finalTitle}`;
          }
        }

        if (seenFinalCapIds.has(finalCapId)) {
          finalCapId = `${finalCapId}_${slugifyEntityPart(item.entityId)}`;
        }
        seenFinalCapIds.add(finalCapId);

        const setable = !item.readOnly && hasAccess;
        const topic = `homeassistant/${deviceSlug}/${finalCapId}`;

        capabilities.push({
          id: finalCapId,
          title: finalTitle,
          type: item.capMeta.type || 'string',
          units: item.capMeta.units || null,
          getable: true,
          setable,
          topic,
          entityId: item.entityId
        });

        registerCapMapping({
          deviceId: deviceSlug,
          deviceName,
          zoneName,
          capId: finalCapId,
          title: `${deviceName} · ${finalTitle}`,
          shortTitle: finalTitle,
          type: item.capMeta.type || 'string',
          units: item.capMeta.units || null,
          getable: true,
          setable,
          topic,
          entityId: item.entityId,
          entityCapId: item.entityCapId,
          isPrimary: Boolean(item.capMeta.isPrimary)
        });
      }

      if (capabilities.length > 0) {
        result.push({
          id: deviceSlug,
          name: deviceName,
          zoneName,
          capabilities
        });
      }
    }

    // Build standalone entities (not linked to a device in HA device registry)
    for (const st of standaloneEntities) {
      const entityId = st.entity_id;
      const domain = entityId.split('.')[0];
      const friendlyName = (st.attributes && st.attributes.friendly_name) || entityId;
      const zoneName = this.getAreaNameForEntity(entityId);
      const readOnly = this.isReadOnlyDomain(domain);
      const extracted = this.extractCapabilitiesForEntity(st);

      const capabilities = Object.keys(extracted).map((cid) => {
        const capMeta = extracted[cid];
        const setable = !readOnly && hasAccess;
        const topic = `homeassistant/${entityId}/${cid}`;
        registerCapMapping({
          deviceId: entityId,
          deviceName: friendlyName,
          zoneName,
          capId: cid,
          title: `${friendlyName} · ${capMeta.title || cid}`,
          shortTitle: capMeta.title || cid,
          type: capMeta.type || 'string',
          units: capMeta.units || null,
          getable: true,
          setable,
          topic,
          entityId,
          entityCapId: cid,
          isPrimary: Boolean(capMeta.isPrimary)
        });
        return {
          id: cid,
          title: capMeta.title || cid,
          type: capMeta.type || 'string',
          units: capMeta.units || null,
          getable: true,
          setable,
          topic,
          entityId
        };
      });

      result.push({
        id: entityId,
        name: friendlyName,
        zoneName,
        capabilities
      });
    }

    result.sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));

    this.deviceCapByKey = byKey;
    this.deviceCapsByEntity = byEntity;
    this.cachedDevicesResponse = result;
    this.migrateLegacyEnabledCapabilities();
    return result;
  }

  migrateLegacyEnabledCapabilities() {
    const enabled = this.store.enabled_capabilities;
    if (!enabled || typeof enabled !== 'object') return;
    let changed = false;

    for (const [key, caps] of Object.entries(enabled)) {
      if (!Array.isArray(caps) || caps.length === 0) continue;
      // Check if `key` is a child entity_id that now belongs to a grouped device
      const mappings = this.deviceCapsByEntity.get(key);
      if (!mappings || mappings.length === 0) continue;

      const groupedMappings = mappings.filter((m) => m.deviceId !== key);
      if (groupedMappings.length === 0) continue;

      for (const oldCap of caps) {
        let target = groupedMappings.find((m) => m.entityCapId === oldCap || m.capId === oldCap);
        if (!target && (oldCap === 'state' || oldCap === 'unit_of_measurement')) {
          target = groupedMappings.find((m) => m.isPrimary) || groupedMappings[0];
        }
        if (target) {
          if (!Array.isArray(enabled[target.deviceId])) {
            enabled[target.deviceId] = [];
          }
          if (!enabled[target.deviceId].includes(target.capId)) {
            enabled[target.deviceId].push(target.capId);
            changed = true;
          }
        }
      }
      delete enabled[key];
      changed = true;
    }

    if (changed) {
      this.savePersistentStore();
    }
  }

  emitEntityStatePayloads(entityId, stateObj, enabledCaps, broadcast = true) {
    if (!entityId || !stateObj || !Array.isArray(enabledCaps) || enabledCaps.length === 0) return;
    const domain = entityId.split('.')[0];
    const attrs = stateObj.attributes || {};
    const friendlyName = attrs.friendly_name || entityId;
    const areaName = this.getAreaNameForEntity(entityId);
    const hasAccess = Boolean(this.getHaConnectionConfig().token);

    // 1. Helper / Variable
    if (HELPER_DOMAINS.has(domain) && (enabledCaps.includes('value') || enabledCaps.includes('state'))) {
      const val = this.extractHelperValue(stateObj);
      this.emitMqttStylePayload({
        topic: `homeassistant/variables/${entityId}/value`,
        value: val,
        deviceId: entityId,
        capabilityId: 'value',
        setable: hasAccess,
        getable: true,
        title: friendlyName,
        isVariable: true,
        type: typeof val,
        domain,
        entityId
      }, 'variable', broadcast);
      return;
    }

    // 2. Automation / Script
    if (FLOW_DOMAINS.has(domain)) {
      if (enabledCaps.includes('start')) {
        this.emitMqttStylePayload({
          topic: `homeassistant/flows/${entityId}/start`,
          value: false,
          deviceId: entityId,
          capabilityId: 'start',
          setable: hasAccess,
          getable: false,
          title: `${friendlyName} · Start`,
          isFlow: true,
          isVariable: false,
          domain,
          entityId
        }, 'flow', broadcast);
      }
      if (enabledCaps.includes('enabled')) {
        const isEnabled = stateObj.state === 'on';
        this.emitMqttStylePayload({
          topic: `homeassistant/flows/${entityId}/enabled`,
          value: isEnabled,
          deviceId: entityId,
          capabilityId: 'enabled',
          setable: hasAccess && domain === 'automation',
          getable: true,
          title: `${friendlyName} · Enabled`,
          isFlow: true,
          isVariable: false,
          domain,
          entityId
        }, 'flow', broadcast);
      }
      return;
    }

    // 3. Scene / Mood
    if (MOOD_DOMAINS.has(domain)) {
      if (enabledCaps.includes('set')) {
        this.emitMqttStylePayload({
          topic: `homeassistant/moods/${entityId}/set`,
          value: false,
          deviceId: entityId,
          capabilityId: 'set',
          setable: hasAccess,
          getable: false,
          title: `${areaName} · ${friendlyName}`,
          isMood: true,
          isVariable: false,
          zoneName: areaName,
          domain,
          entityId
        }, 'mood', broadcast);
      }
      return;
    }

    // 4. Standard standalone entity capabilities
    const readOnlyDomain = this.isReadOnlyDomain(domain);
    const extracted = this.extractCapabilitiesForEntity(stateObj);
    const primaryKey = Object.keys(extracted).find((k) => extracted[k] && extracted[k].isPrimary);

    for (const capId of enabledCaps) {
      const capMeta = extracted[capId] || (capId === 'state' && primaryKey ? extracted[primaryKey] : undefined);
      if (capMeta !== undefined) {
        this.emitMqttStylePayload({
          topic: `homeassistant/${entityId}/${capId}`,
          value: capMeta.value,
          deviceId: entityId,
          capabilityId: capId,
          setable: !readOnlyDomain && hasAccess,
          getable: true,
          title: `${friendlyName} · ${capMeta.title || capId}`,
          units: capMeta.units || attrs.unit_of_measurement || null,
          isVariable: false,
          isFlow: false,
          isMood: false,
          zoneName: areaName,
          type: capMeta.type || typeof capMeta.value,
          domain,
          entityId
        }, 'device', broadcast);
      }
    }
  }

  emitMappedDeviceCapabilityPayload(mapping, stateObj, broadcast = true) {
    if (!mapping || !stateObj) return;
    const extracted = this.extractCapabilitiesForEntity(stateObj, {
      deviceName: mapping.deviceName,
      deviceSlug: mapping.deviceId
    });
    const primaryKey = Object.keys(extracted).find((k) => extracted[k] && extracted[k].isPrimary);
    const capMeta = extracted[mapping.entityCapId] || (primaryKey ? extracted[primaryKey] : undefined);
    if (!capMeta) return;

    const attrs = stateObj.attributes || {};
    const domain = mapping.entityId.split('.')[0];

    this.emitMqttStylePayload({
      topic: mapping.topic,
      value: capMeta.value,
      deviceId: mapping.deviceId,
      capabilityId: mapping.capId,
      setable: mapping.setable,
      getable: mapping.getable,
      title: mapping.title,
      units: capMeta.units || mapping.units || attrs.unit_of_measurement || null,
      isVariable: false,
      isFlow: false,
      isMood: false,
      zoneName: mapping.zoneName,
      type: capMeta.type || typeof capMeta.value,
      domain,
      entityId: mapping.entityId
    }, 'device', broadcast);
  }

  onHaStateChanged(entityId, newState, _oldState) {
    if (!entityId || !newState) return;
    const isNewEntity = !this.haStates.has(entityId);
    this.haStates.set(entityId, newState);
    if (isNewEntity || !this.cachedDevicesResponse) {
      this.rebuildDeviceCatalog();
    }

    const enabledConfig = this.getEnabledCapabilities();

    // 1. Check if any grouped/mapped device capabilities backed by this entity are enabled
    const mappings = this.deviceCapsByEntity.get(entityId) || [];
    for (const mapping of mappings) {
      const devEnabled = enabledConfig[mapping.deviceId];
      if (Array.isArray(devEnabled) && devEnabled.includes(mapping.capId)) {
        this.emitMappedDeviceCapabilityPayload(mapping, newState, true);
      }
    }

    // 2. Check direct entityId entries (Flows, Moods, Variables, or legacy direct entity bindings)
    const directCaps = enabledConfig[entityId];
    if (Array.isArray(directCaps) && directCaps.length > 0) {
      const domain = entityId.split('.')[0];
      if (FLOW_DOMAINS.has(domain) || MOOD_DOMAINS.has(domain) || HELPER_DOMAINS.has(domain) || mappings.length === 0) {
        this.emitEntityStatePayloads(entityId, newState, directCaps, true);
      }
    }
  }

  extractHelperValue(stateObj) {
    if (!stateObj) return null;
    const domain = stateObj.entity_id.split('.')[0];
    const raw = stateObj.state;
    if (domain === 'input_boolean') return raw === 'on';
    if (domain === 'input_number' || domain === 'counter') {
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    }
    return raw;
  }

  populateInitialStateCache(broadcast = false) {
    if (!this.cachedDevicesResponse) {
      this.rebuildDeviceCatalog();
    }
    const enabledConfig = this.getEnabledCapabilities();
    for (const [devOrEntityId, enabledCaps] of Object.entries(enabledConfig)) {
      if (!Array.isArray(enabledCaps) || enabledCaps.length === 0) continue;

      let handledByMapping = false;
      for (const capId of enabledCaps) {
        const mapping = this.deviceCapByKey.get(`${devOrEntityId}/${capId}`);
        if (mapping) {
          handledByMapping = true;
          const st = this.haStates.get(mapping.entityId);
          if (st) {
            this.emitMappedDeviceCapabilityPayload(mapping, st, broadcast);
          }
        }
      }

      if (!handledByMapping) {
        const stateObj = this.haStates.get(devOrEntityId);
        if (stateObj) {
          this.emitEntityStatePayloads(devOrEntityId, stateObj, enabledCaps, broadcast);
        }
      }
    }
    if (broadcast && this.io) {
      for (const socket of this.io.sockets.sockets.values()) {
        this.emitStateCacheToSocket(socket);
      }
    }
  }

  buildGetDevicesResponse() {
    return this.rebuildDeviceCatalog();
  }

  // =========================================================================
  // Command Execution (Dashboard Studio -> Home Assistant Services)
  // =========================================================================

  async handleSetStateCommand(data) {
    if (!data) return;

    let rawTopic = data.topic ? String(data.topic) : '';
    if (!rawTopic && data.deviceId && data.capabilityId) {
      if (data.deviceId === 'dashboardstudio') {
        const rawVal = data.value;
        const valStr = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
        const numParsed = Number(rawVal);
        const valNum = Number.isFinite(numParsed) ? numParsed : 0;
        let valBool = false;
        if (typeof rawVal === 'boolean') valBool = rawVal;
        else if (typeof rawVal === 'number') valBool = rawVal > 0;
        else if (typeof rawVal === 'string') {
          const s = rawVal.trim().toLowerCase();
          valBool = s === 'true' || s === '1' || s === 'on' || s === 'yes';
        }
        await this.fireHaEvent('dashboard_studio_trigger', {
          event: String(data.capabilityId),
          val_str: valStr,
          val_num: valNum,
          val_bool: valBool,
          value: rawVal
        });
        return;
      }
      rawTopic = `homeassistant/${data.deviceId}/${data.capabilityId}`;
    }
    if (!rawTopic) return;
    const val = data.value;

    const settings = this.getAppSettings();
    if (settings.autoEcho !== false && settings.topicEcho !== false) {
      const subPath = normalizeTopicPrefix(rawTopic);
      this.emitRealtimeTopic(subPath, val, 'device');
    }

    const clean = normalizeTopicPrefix(rawTopic);
    const parts = clean.split('/');
    if (parts.length < 2) return;

    // 1. Variable / Helper (`variables/<id>/value` or `variable/<id>`)
    if (parts[0] === 'variable' || parts[0] === 'variables') {
      const varIdentifier = parts[0] === 'variables' && parts[parts.length - 1] === 'value' && parts.length >= 3
        ? parts.slice(1, -1).join('/')
        : parts.slice(1).join('/');
      await this.setHaHelperValue(varIdentifier, val);
      return;
    }

    // 2. Flow / Automation / Script (`flows/<id>/<action>` or `flow/<id>/<action>`)
    if ((parts[0] === 'flow' || parts[0] === 'flows') && parts.length >= 3) {
      const flowId = parts[1];
      const action = parts[2];
      const domain = flowId.split('.')[0];
      if (action === 'start') {
        if (domain === 'script') {
          await this.callHaService('script', 'turn_on', { entity_id: flowId });
        } else {
          await this.callHaService('automation', 'trigger', { entity_id: flowId });
        }
      } else if (action === 'enabled') {
        const enableBool = val === true || val === 'true' || val === 1 || val === '1' || val === 'on';
        await this.callHaService('automation', enableBool ? 'turn_on' : 'turn_off', { entity_id: flowId });
      }
      return;
    }

    // 3. Mood / Scene (`moods/<id>/set` or `mood/<id>/set`)
    if ((parts[0] === 'mood' || parts[0] === 'moods') && parts.length >= 2) {
      const sceneId = parts[1];
      await this.callHaService('scene', 'turn_on', { entity_id: sceneId });
      return;
    }

    // 4. Grouped Device or Direct Entity capability (`<device_or_entity_id>/<capability>`)
    const devOrEntityId = parts[0];
    const capId = parts.slice(1).join('/');

    if (!this.cachedDevicesResponse) {
      this.rebuildDeviceCatalog();
    }

    const mapping = this.deviceCapByKey.get(`${devOrEntityId}/${capId}`);
    if (mapping && mapping.entityId) {
      await this.executeEntityCapabilityService(mapping.entityId, mapping.entityCapId || capId, val);
      return;
    }

    if (!devOrEntityId.includes('.')) return;

    await this.executeEntityCapabilityService(devOrEntityId, capId, val);
  }

  async setHaHelperValue(identifier, value) {
    let targetEntityId = identifier;
    if (!this.haStates.has(targetEntityId)) {
      const lower = String(identifier).toLowerCase();
      for (const [eid, st] of this.haStates.entries()) {
        const fn = (st.attributes && st.attributes.friendly_name) || '';
        if (eid.toLowerCase() === lower || String(fn).toLowerCase() === lower) {
          targetEntityId = eid;
          break;
        }
      }
    }

    const domain = targetEntityId.split('.')[0];
    if (domain === 'input_boolean') {
      const boolVal = value === true || value === 'true' || value === 1 || value === '1' || value === 'on';
      await this.callHaService('input_boolean', boolVal ? 'turn_on' : 'turn_off', { entity_id: targetEntityId });
    } else if (domain === 'input_number') {
      await this.callHaService('input_number', 'set_value', { entity_id: targetEntityId, value: Number(value) });
    } else if (domain === 'number') {
      await this.callHaService('number', 'set_value', { entity_id: targetEntityId, value: Number(value) });
    } else if (domain === 'input_text') {
      await this.callHaService('input_text', 'set_value', { entity_id: targetEntityId, value: String(value ?? '') });
    } else if (domain === 'text') {
      await this.callHaService('text', 'set_value', { entity_id: targetEntityId, value: String(value ?? '') });
    } else if (domain === 'input_select') {
      await this.callHaService('input_select', 'select_option', { entity_id: targetEntityId, option: String(value) });
    } else if (domain === 'select') {
      await this.callHaService('select', 'select_option', { entity_id: targetEntityId, option: String(value) });
    } else if (domain === 'counter') {
      await this.callHaService('counter', 'set_value', { entity_id: targetEntityId, value: Math.round(Number(value)) });
    }
  }

  async executeEntityCapabilityService(entityId, capId, val) {
    const domain = entityId.split('.')[0];
    const currentState = this.haStates.get(entityId);
    const attrs = (currentState && currentState.attributes) || {};

    if (domain === 'light') {
      if (capId === LIGHT_COMPOSITE_CAP_ID) {
        let parsed = val;
        if (typeof val === 'string') {
          try { parsed = JSON.parse(val); } catch (_e) { return; }
        }
        if (!parsed || typeof parsed !== 'object') return;
        if (parsed.onoff === false || parsed.state === 'OFF' || parsed.state === false) {
          await this.callHaService('light', 'turn_off', { entity_id: entityId });
          return;
        }
        const serviceData = { entity_id: entityId };
        if (parsed.brightness !== undefined) {
          serviceData.brightness = Math.round(clampNum(Number(parsed.brightness), 0, 255));
        } else if (parsed.dim !== undefined) {
          serviceData.brightness = Math.round(clampNum(Number(parsed.dim), 0, 1) * 255);
        }
        if ((parsed.color_mode === 'hs' || parsed.color) && parsed.color && typeof parsed.color === 'object') {
          const curHs = Array.isArray(attrs.hs_color) ? attrs.hs_color : [0, 100];
          const h = parsed.color.h !== undefined ? clampNum(Number(parsed.color.h), 0, 360) : curHs[0];
          const s = parsed.color.s !== undefined ? clampNum(Number(parsed.color.s), 0, 100) : curHs[1];
          serviceData.hs_color = [roundTo(h, 1), roundTo(s, 1)];
        } else if (parsed.mode === 'color' && (parsed.hue !== undefined || parsed.saturation !== undefined)) {
          const curHs = Array.isArray(attrs.hs_color) ? attrs.hs_color : [0, 100];
          const h = parsed.hue !== undefined ? clampNum(Number(parsed.hue), 0, 1) * 360 : curHs[0];
          const s = parsed.saturation !== undefined ? clampNum(Number(parsed.saturation), 0, 1) * 100 : curHs[1];
          serviceData.hs_color = [roundTo(h, 1), roundTo(s, 1)];
        } else if (parsed.color_mode === 'color_temp' && parsed.color_temp !== undefined) {
          const minK = Number(attrs.min_color_temp_kelvin) || 2000;
          const maxK = Number(attrs.max_color_temp_kelvin) || 6535;
          const normT = clampNum((Number(parsed.color_temp) - 153) / (500 - 153), 0, 1);
          serviceData.color_temp_kelvin = Math.round(maxK - normT * (maxK - minK));
        } else if (parsed.temperature !== undefined) {
          const minK = Number(attrs.min_color_temp_kelvin) || 2000;
          const maxK = Number(attrs.max_color_temp_kelvin) || 6535;
          const t = clampNum(Number(parsed.temperature), 0, 1);
          serviceData.color_temp_kelvin = Math.round(maxK - t * (maxK - minK));
        }
        await this.callHaService('light', 'turn_on', serviceData);
        return;
      }

      if (capId === 'onoff' || capId === 'state') {
        const turnOn = val === true || val === 'true' || val === 'on' || val === 1 || val === '1';
        await this.callHaService('light', turnOn ? 'turn_on' : 'turn_off', { entity_id: entityId });
        return;
      }

      if (capId === 'dim') {
        const num = clampNum(Number(val), 0, 1);
        if (num <= 0) {
          await this.callHaService('light', 'turn_off', { entity_id: entityId });
        } else {
          await this.callHaService('light', 'turn_on', {
            entity_id: entityId,
            brightness: Math.round(num * 255)
          });
        }
        return;
      }

      if (capId === 'brightness') {
        await this.callHaService('light', 'turn_on', {
          entity_id: entityId,
          brightness: Math.round(clampNum(Number(val), 0, 255))
        });
        return;
      }

      if (capId === 'light_hue' || capId === 'light_saturation') {
        const curHs = Array.isArray(attrs.hs_color) ? attrs.hs_color : [0, 100];
        const h = capId === 'light_hue' ? clampNum(Number(val), 0, 1) * 360 : Number(curHs[0]) || 0;
        const s = capId === 'light_saturation' ? clampNum(Number(val), 0, 1) * 100 : Number(curHs[1]) || 100;
        await this.callHaService('light', 'turn_on', {
          entity_id: entityId,
          hs_color: [roundTo(h, 1), roundTo(s, 1)]
        });
        return;
      }

      if (capId === 'light_temperature') {
        const minK = Number(attrs.min_color_temp_kelvin) || 2000;
        const maxK = Number(attrs.max_color_temp_kelvin) || 6535;
        const t = clampNum(Number(val), 0, 1);
        await this.callHaService('light', 'turn_on', {
          entity_id: entityId,
          color_temp_kelvin: Math.round(maxK - t * (maxK - minK))
        });
        return;
      }
    }

    if (BINARY_ON_OFF_DOMAINS.has(domain) && (capId === 'onoff' || capId === 'state')) {
      const turnOn = val === true || val === 'true' || val === 'on' || val === 1 || val === '1';
      await this.callHaService(domain, turnOn ? 'turn_on' : 'turn_off', { entity_id: entityId });
      return;
    }

    if (domain === 'cover') {
      if (capId === 'windowcoverings_set' || capId === 'current_position') {
        const num = Number(val);
        const pos = num <= 1 && capId === 'windowcoverings_set' ? Math.round(clampNum(num, 0, 1) * 100) : Math.round(clampNum(num, 0, 100));
        await this.callHaService('cover', 'set_cover_position', { entity_id: entityId, position: pos });
      } else {
        const s = String(val).toLowerCase();
        if (s === 'up' || s === 'open' || val === true) {
          await this.callHaService('cover', 'open_cover', { entity_id: entityId });
        } else if (s === 'down' || s === 'close' || s === 'closed' || val === false) {
          await this.callHaService('cover', 'close_cover', { entity_id: entityId });
        } else {
          await this.callHaService('cover', 'stop_cover', { entity_id: entityId });
        }
      }
      return;
    }

    if (domain === 'climate') {
      if (capId === 'target_temperature' || capId === 'temperature') {
        await this.callHaService('climate', 'set_temperature', { entity_id: entityId, temperature: Number(val) });
      } else if (capId === 'state' || capId === 'hvac_mode') {
        await this.callHaService('climate', 'set_hvac_mode', { entity_id: entityId, hvac_mode: String(val) });
      }
      return;
    }

    if (domain === 'media_player') {
      if (capId === 'speaker_playing') {
        const play = val === true || val === 'true' || val === 'playing' || val === 'on' || val === 1;
        await this.callHaService('media_player', play ? 'media_play' : 'media_pause', { entity_id: entityId });
      } else if (capId === 'volume_set' || capId === 'volume_level') {
        await this.callHaService('media_player', 'volume_set', {
          entity_id: entityId,
          volume_level: clampNum(Number(val), 0, 1)
        });
      } else if (capId === 'volume_mute' || capId === 'is_volume_muted') {
        const mute = val === true || val === 'true' || val === 1;
        await this.callHaService('media_player', 'volume_mute', {
          entity_id: entityId,
          is_volume_muted: mute
        });
      } else if (capId === 'speaker_next') {
        await this.callHaService('media_player', 'media_next_track', { entity_id: entityId });
      } else if (capId === 'speaker_prev') {
        await this.callHaService('media_player', 'media_previous_track', { entity_id: entityId });
      }
      return;
    }

    if (domain === 'lock') {
      const lockIt = val === true || val === 'true' || val === 'locked' || val === 1;
      await this.callHaService('lock', lockIt ? 'lock' : 'unlock', { entity_id: entityId });
      return;
    }

    if (domain === 'button' || domain === 'input_button') {
      await this.callHaService(domain, 'press', { entity_id: entityId });
      return;
    }

    if (HELPER_DOMAINS.has(domain) || domain === 'number' || domain === 'select' || domain === 'text') {
      await this.setHaHelperValue(entityId, val);
    }
  }

  async callHaService(domain, service, serviceData) {
    try {
      if (this.ws && this.wsAuthenticated) {
        await this.sendHaWsCommand('call_service', {
          domain,
          service,
          service_data: serviceData
        });
      } else {
        await this.haRestRequest('POST', `/api/services/${domain}/${service}`, serviceData);
      }
    } catch (err) {
      console.error(`[DashboardStudio] Failed calling HA service ${domain}.${service}:`, err.message);
    }
  }

  // =========================================================================
  // Home Assistant Equivalents of All 14 Homey Flowcards
  // =========================================================================

  async fireHaEvent(eventType, eventData) {
    try {
      await this.haRestRequest('POST', `/api/events/${encodeURIComponent(eventType)}`, eventData || {});
    } catch (err) {
      console.warn(`[DashboardStudio] Could not fire HA event ${eventType}:`, err.message);
    }
  }

  isDashboardCurrentlyOpen(dashboardName, pageName) {
    const targetDash = normalizeDashboardId(dashboardName);
    if (!targetDash) return false;
    const targetPage = pageName !== undefined && pageName !== null ? normalizePageId(pageName) : null;

    for (const session of this.activeSessions.values()) {
      if (session.dashboard && session.dashboard === targetDash) {
        if (!targetPage) return true;
        if (session.page && session.page === targetPage) return true;
      }
    }
    return false;
  }

  syncAllOpenBinarySensorsToHa() {
    const byDash = new Map();
    for (const session of this.activeSessions.values()) {
      if (!session.dashboard) continue;
      if (!byDash.has(session.dashboard)) {
        byDash.set(session.dashboard, { count: 0, pages: new Set(), lastPage: '' });
      }
      const entry = byDash.get(session.dashboard);
      entry.count += 1;
      if (session.page) {
        entry.pages.add(session.page);
        entry.lastPage = session.page;
      }
    }

    const allKnownDashboards = new Set([
      ...this.publishedBinarySensors,
      ...byDash.keys()
    ]);

    for (const dash of allKnownDashboards) {
      const info = byDash.get(dash) || { count: 0, pages: new Set(), lastPage: '' };
      this.publishedBinarySensors.add(dash);
      const slug = slugifyEntityPart(dash);
      const entityId = `binary_sensor.dashboard_studio_${slug}_open`;
      const isOpen = info.count > 0;
      const pagesList = Array.from(info.pages);

      this.haRestRequest('POST', `/api/states/${entityId}`, {
        state: isOpen ? 'on' : 'off',
        attributes: {
          friendly_name: `Dashboard Studio: ${dash} Open`,
          device_class: 'connectivity',
          dashboard: dash,
          viewer_count: info.count,
          page: info.lastPage || (pagesList[0] || ''),
          active_pages: pagesList
        }
      }).catch(() => {});
    }
  }

  async handleHaEventBusServiceCall(eventData) {
    if (!eventData || !eventData.action) return;
    const action = String(eventData.action);
    const args = eventData.data || eventData;
    const callId = eventData.call_id || null;

    try {
      const result = await this.executeServiceAction(action, args);
      if (callId) {
        await this.fireHaEvent('dashboard_studio_response', {
          call_id: callId,
          action,
          success: true,
          result
        });
      }
    } catch (err) {
      if (callId) {
        await this.fireHaEvent('dashboard_studio_response', {
          call_id: callId,
          action,
          success: false,
          error: err.message
        });
      }
    }
  }

  async executeServiceAction(action, args) {
    const params = args || {};

    switch (action) {
      case 'send': {
        const eventName = String(params.topic || params.event || params.name || '').trim();
        if (!eventName) throw new Error('Missing "topic" or "event" parameter');
        const payload = params.value !== undefined
          ? params.value
          : (params.data !== undefined ? params.data : '');
        this.sendDashboardEvent(eventName, payload, true);
        return { ok: true, success: true, topic: eventName, event: eventName };
      }

      case 'reload': {
        const rawTarget = params.dashboard !== undefined ? params.dashboard : params.dashboard_name;
        const target = rawTarget ? String(rawTarget).trim().toLowerCase().replace(/\.json$/i, '') : 'all';
        if (this.io) {
          this.io.emit('reload_dashboard', { name: target });
        }
        return { ok: true, success: true, dashboard: target };
      }

      case 'send_insights':
      case 'send_insights_advanced': {
        const entityId = String(params.entity_id || params.insight || params.insight_id || params.entity_1 || '').trim();
        const timeframe = String(params.timespan || params.timeframe || params.time_range || '24h').trim();
        const resolution = String(params.resolution || 'auto').trim();
        const aggMethod = String(params.aggregation || params.agg_method || 'mean').trim();
        const rawTopic = String(params.topic || params.event || entityId).trim();
        const targetInsightName = rawTopic.replace(/^(?:homey|homeassistant)\/insights?\//i, '');
        if (!entityId) {
          throw new Error('"entity_id" is required for send_insights');
        }
        const entries = await this.fetchEntityHistoryEntries(entityId, timeframe);
        const resampled = this.resampleData(entries, timeframe, resolution, aggMethod === 'mean' ? 'average' : aggMethod);
        const payload = {
          name: targetInsightName,
          sourceId: entityId,
          range: timeframe,
          data: resampled
        };
        if (this.shouldCacheCategory('insight', payload)) {
          this.stateCache.set(`homey/insight/${targetInsightName}`, {
            type: 'insight',
            data: payload,
            timestamp: Date.now()
          });
        }
        if (this.io) {
          this.io.emit('dashboard_insight', payload);
        }
        return {
          ok: true,
          success: true,
          points: resampled.length,
          insight_raw: JSON.stringify(resampled)
        };
      }

      case 'load_filter_ical': {
        const res = await this.runLoadFilterIcalService(params);
        const topic = String(params.topic || params.event || '').trim();
        if (topic) {
          this.sendDashboardEvent(topic, res.ical_data, true);
        }
        return res;
      }

      case 'webcal_to_markdown': {
        const res = await this.runWebcalToMarkdownService(params);
        const topic = String(params.topic || params.event || '').trim();
        if (topic) {
          this.sendDashboardEvent(topic, res.markdown, true);
        }
        return res;
      }

      case 'combine_ical_data': {
        const res = await this.runCombineIcalService(params);
        const topic = String(params.topic || params.event || '').trim();
        if (topic) {
          this.sendDashboardEvent(topic, res.ical_data, true);
        }
        return res;
      }

      case 'fetch_rss_markdown': {
        const appSettings = this.getAppSettings();
        const rawUrls = params.urls || params.url || '';
        const rssResult = await RssStreamProcessor.process({
          rawUrls,
          layout: params.layout || 'standard',
          maxItems: Number(params.max_items || params.maxItems) || 10,
          imageWidth: params.image_width,
          dateFormatMode: params.date_format || 'default',
          userDateFormat: appSettings.calendarDateFormat || appSettings.dateFormat || 'dd-mm-yyyy',
          timeZone: this.getTimeZone()
        });
        const topic = String(params.topic || params.event || '').trim();
        if (topic) {
          this.sendDashboardEvent(topic, rssResult.markdown, true);
        }
        return {
          ok: true,
          success: true,
          markdown: rssResult.markdown || '',
          item_count: rssResult.articleCount || 0,
          article_count: rssResult.articleCount || 0,
          latest_headline: rssResult.latestHeadline || '',
          latest_link: rssResult.latestLink || ''
        };
      }

      case 'is_open': {
        const open = this.isDashboardCurrentlyOpen(params.dashboard || params.dashboard_name, params.page);
        return { ok: true, success: true, is_open: open, open };
      }

      default:
        throw new Error(`Unknown service action: ${action}`);
    }
  }

  resolveTimeframeRange(timeframeRaw) {
    const tf = String(timeframeRaw || '7d').trim().toLowerCase();
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    let days = 7;
    if (tf === 'today' || tf === '1d') days = 1;
    else if (tf === '2d' || tf === 'tomorrow') days = 2;
    else if (tf === '3d') days = 3;
    else if (tf === '7d' || tf === 'start_this_week') days = 7;
    else if (tf === '14d') days = 14;
    else if (tf === '30d' || tf === 'start_this_month') days = 30;
    else if (tf === '90d' || tf === 'previous_current_next_month') days = 90;
    const end = new Date(start.getTime() + days * 24 * 3600 * 1000 - 1);
    return { start, end };
  }

  enrichFilteredEvents(events, tz) {
    return (Array.isArray(events) ? events : []).map((ev) => {
      if (!ev || typeof ev !== 'object') return ev;
      const isAllDay = Boolean(ev.allDay);
      const isTimed = !isAllDay;
      const isRecurring = Boolean(webcalMarkdown.isRecurringEvent && webcalMarkdown.isRecurringEvent(ev));
      const calendarEventBlock = webcalMarkdown.getCalendarEventMarkdownBlock
        ? webcalMarkdown.getCalendarEventMarkdownBlock(ev, tz)
        : 1;
      const calendarEventKind = webcalMarkdown.getCalendarEventKind
        ? webcalMarkdown.getCalendarEventKind(ev, tz)
        : 'timed';
      return Object.assign({}, ev, {
        isTimed,
        isAllDay,
        isRecurring,
        calendarEventBlock,
        calendarEventKind
      });
    });
  }

  async runLoadFilterIcalService(params) {
    const rawUrl = String(params.url || '').trim().replace(/^webcal:\/\//i, 'https://');
    if (!rawUrl) throw new Error('Missing calendar "url"');
    const tz = this.getTimeZone();
    const range = this.resolveTimeframeRange(params.timeframe || params.target_mode || '7d');
    const filter = new ICalStreamFilter(rawUrl, range.start, range.end, tz);
    let events = await filter.process();
    const maxEvents = Number(params.max_events || 0);
    if (maxEvents > 0 && Array.isArray(events) && events.length > maxEvents) {
      events = events.slice(0, maxEvents);
    }
    const enriched = this.enrichFilteredEvents(events, tz);
    const envelope = {
      filterStart: range.start.toISOString(),
      filterEnd: range.end.toISOString(),
      events: enriched
    };
    const jsonStr = JSON.stringify(envelope);
    const summaryText = enriched.map((e) => e.summary || '').filter(Boolean).join(', ');
    return {
      ok: true,
      success: true,
      ical_data: jsonStr,
      filtered_events_json: jsonStr,
      event_count: enriched.length,
      summary_text: summaryText
    };
  }

  async runCombineIcalService(params) {
    const inputs = [
      params.ical_1 || params.events_token_a,
      params.ical_2 || params.events_token_b,
      params.ical_3
    ].map((x) => String(x || '').trim()).filter(Boolean);

    const allEvents = [];
    let minStart = Infinity;
    let maxEnd = -Infinity;
    const tz = this.getTimeZone();

    for (const item of inputs) {
      if (/^(?:https?|webcal):\/\//i.test(item)) {
        const loaded = await this.runLoadFilterIcalService({
          url: item,
          timeframe: params.timeframe || '30d'
        });
        const env = JSON.parse(loaded.ical_data);
        if (Array.isArray(env.events)) allEvents.push(...env.events);
        if (env.filterStart) minStart = Math.min(minStart, Date.parse(env.filterStart));
        if (env.filterEnd) maxEnd = Math.max(maxEnd, Date.parse(env.filterEnd));
      } else if (item.startsWith('{')) {
        const env = JSON.parse(item);
        if (Array.isArray(env.events)) allEvents.push(...env.events);
        if (env.filterStart) minStart = Math.min(minStart, Date.parse(env.filterStart));
        if (env.filterEnd) maxEnd = Math.max(maxEnd, Date.parse(env.filterEnd));
      } else if (item.includes('BEGIN:VCALENDAR')) {
        const range = this.resolveTimeframeRange(params.timeframe || '30d');
        const parsed = webcalMarkdown.parseIcsToEvents
          ? webcalMarkdown.parseIcsToEvents(item, range.start, range.end, tz)
          : [];
        allEvents.push(...this.enrichFilteredEvents(parsed, tz));
        minStart = Math.min(minStart, range.start.getTime());
        maxEnd = Math.max(maxEnd, range.end.getTime());
      }
    }

    allEvents.sort((a, b) => {
      const tA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const tB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return tA - tB;
    });

    const envelope = {
      filterStart: Number.isFinite(minStart) ? new Date(minStart).toISOString() : new Date().toISOString(),
      filterEnd: Number.isFinite(maxEnd) ? new Date(maxEnd).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
      events: allEvents
    };
    const jsonStr = JSON.stringify(envelope);
    return {
      ok: true,
      success: true,
      ical_data: jsonStr,
      combined_events_json: jsonStr,
      event_count: allEvents.length,
      summary_text: allEvents.map((e) => e.summary || '').filter(Boolean).join(', ')
    };
  }

  async runWebcalToMarkdownService(params) {
    const settings = Object.assign({}, this.getAppSettings());
    const tz = this.getTimeZone();
    let events = [];
    let filterStart = new Date();

    const rawInput = String(params.droptoken || params.ical_data || params.url_1 || params.url || '').trim();
    if (!rawInput) {
      throw new Error('Provide "url_1" or "ical_data" / "droptoken" for webcal_to_markdown');
    }

    const urlSources = [params.url_1 || params.url, params.url_2, params.url_3]
      .map((u) => String(u || '').trim())
      .filter((u) => /^(?:https?|webcal):\/\//i.test(u));

    if (urlSources.length > 0) {
      const combined = await this.runCombineIcalService({
        ical_1: urlSources[0],
        ical_2: urlSources[1],
        ical_3: urlSources[2],
        timeframe: params.timeframe || '7d'
      });
      const env = JSON.parse(combined.ical_data);
      events = Array.isArray(env.events) ? env.events : [];
      if (env.filterStart) filterStart = new Date(env.filterStart);
    } else if (rawInput.startsWith('{')) {
      const env = JSON.parse(rawInput);
      events = Array.isArray(env.events) ? env.events : [];
      if (env.filterStart) filterStart = new Date(env.filterStart);
    } else if (rawInput.includes('BEGIN:VCALENDAR')) {
      const range = this.resolveTimeframeRange(params.timeframe || '7d');
      filterStart = range.start;
      const parsed = webcalMarkdown.parseIcsToEvents
        ? webcalMarkdown.parseIcsToEvents(rawInput, range.start, range.end, tz)
        : [];
      events = this.enrichFilteredEvents(parsed, tz);
    }

    for (const ev of events) {
      if (ev && typeof ev === 'object') {
        if (ev.startDate) ev.startDate = new Date(ev.startDate);
        if (ev.endDate) ev.endDate = new Date(ev.endDate);
      }
    }

    const iconText = settings.calendarIconBindingsText !== undefined
      ? String(settings.calendarIconBindingsText)
      : this.getDefaultIconBindingsText();
    const parsedIcons = calendarIconBindingsLib.parseIconBindingsText(iconText);

    const showIcons = settings.calendarShowIcons !== false;
    const useDefaultIcon = settings.calendarUseDefaultIcon !== false;
    const defaultIconTrimmed = settings.calendarDefaultIcon ? String(settings.calendarDefaultIcon).trim() : '';
    let effectiveDefaultIcon = '';
    if (showIcons) {
      effectiveDefaultIcon = (useDefaultIcon && defaultIconTrimmed)
        ? defaultIconTrimmed
        : calendarIconBindingsLib.MARKDOWN_PH_SPACER_SLUG;
    }

    const useBlocks = settings.calendarWrapEventsInBlocks !== false;
    const showDaySections = settings.calendarGroupByTimeOfDay !== false;
    const calendarColorMode = settings.calendarColorBlockMode === 'calendar_source' ? 'calendar_source' : 'event_type';
    let calendarSourceBlockMap = null;

    if (useBlocks && calendarColorMode === 'calendar_source') {
      const srcText = settings.calendarSourceBlockBindingsText !== undefined
        ? String(settings.calendarSourceBlockBindingsText)
        : this.getDefaultSourceBlockBindingsText();
      const parsedSrc = calendarSourceBlockBindingsLib.parseSourceBlockBindingsText(srcText);
      const distinctIds = Array.from(new Set(events.map((e) => e && e.calendarId).filter(Boolean))).sort();
      const merged = calendarSourceBlockBindingsLib.assignLeastUsedBlocks(
        parsedSrc.ok ? parsedSrc.bindings : [],
        distinctIds
      );
      calendarSourceBlockMap = calendarSourceBlockBindingsLib.sourceBlockBindingsToMap(merged);
    }

    const nowYMD = webcalMarkdown.getCalendarYMDInTimeZone(new Date(), tz);
    const viewFmt = String(params.format || params.view_type || 'week_view');

    const md = webcalMarkdown.generateCalendarMarkdownFromEvents(events, {
      viewFormat: viewFmt === '1_week' ? 'week_view' : viewFmt,
      weekStart: settings.calendarWeekStart || 'monday',
      dateFormat: settings.calendarDateFormat || 'dd-mm-yyyy',
      useBlocks,
      showDaySections,
      calendarColorBlockMode: calendarColorMode,
      calendarSourceBlockMap,
      calendarEventOrder: webcalMarkdown.normalizeCalendarEventOrder(settings.calendarEventOrder),
      defaultIcon: effectiveDefaultIcon,
      iconBindings: (showIcons && parsedIcons.ok) ? parsedIcons.bindings : [],
      timeZone: tz,
      anchorYMD: nowYMD,
      weekStartYMD: nowYMD,
      filterStart,
      i18n: {
        Sun: 'Sun', Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat',
        Night: 'Night', Morning: 'Morning', Afternoon: 'Afternoon', Evening: 'Evening',
        AllDay: 'All Day', Today: 'Today', Tomorrow: 'Tomorrow', Time: 'Time', Event: 'Event'
      }
    });

    return {
      ok: true,
      success: true,
      markdown: String(md || ''),
      event_count: events.length,
      event_blocks_json: JSON.stringify(events),
      source_blocks_json: JSON.stringify(calendarSourceBlockMap || {})
    };
  }

  getDefaultIconBindingsText() {
    try {
      const en = JSON.parse(fs.readFileSync(path.join(LOCALES_ROOT, 'en.json'), 'utf8'));
      if (en && en.settings && en.settings.calendar && en.settings.calendar.iconBindings && en.settings.calendar.iconBindings.defaultBlock) {
        return String(en.settings.calendar.iconBindings.defaultBlock);
      }
    } catch (_e) {}
    return calendarIconBindingsLib.DEFAULT_CALENDAR_ICON_BINDINGS_TEXT || '';
  }

  getDefaultSourceBlockBindingsText() {
    try {
      const en = JSON.parse(fs.readFileSync(path.join(LOCALES_ROOT, 'en.json'), 'utf8'));
      if (en && en.settings && en.settings.calendar && en.settings.calendar.sourceBlockBindings && en.settings.calendar.sourceBlockBindings.defaultBlock) {
        return String(en.settings.calendar.sourceBlockBindings.defaultBlock);
      }
    } catch (_e) {}
    return '';
  }

  getTimeframeDurationMs(timeframe) {
    const map = {
      '1h': 3600 * 1000,
      '6h': 6 * 3600 * 1000,
      '24h': 24 * 3600 * 1000,
      '7d': 7 * 24 * 3600 * 1000,
      '14d': 14 * 24 * 3600 * 1000,
      '31d': 31 * 24 * 3600 * 1000,
      '365d': 365 * 24 * 3600 * 1000
    };
    return map[timeframe] || map['24h'];
  }

  async fetchEntityHistoryEntries(entityId, timeframe) {
    const durationMs = this.getTimeframeDurationMs(timeframe);
    const startIso = new Date(Date.now() - durationMs).toISOString();
    const endIso = new Date().toISOString();
    const apiPath = `/api/history/period/${encodeURIComponent(startIso)}?filter_entity_id=${encodeURIComponent(entityId)}&end_time=${encodeURIComponent(endIso)}&minimal_response&no_attributes`;

    const raw = await this.haRestRequest('GET', apiPath);
    const list = Array.isArray(raw) && Array.isArray(raw[0]) ? raw[0] : [];
    const entries = [];
    for (const pt of list) {
      if (!pt) continue;
      const v = Number(pt.state !== undefined ? pt.state : pt.s);
      if (!Number.isFinite(v)) continue;
      const tsRaw = pt.last_changed || pt.last_updated || pt.lu;
      const ms = typeof tsRaw === 'number' ? tsRaw * 1000 : Date.parse(tsRaw);
      if (Number.isFinite(ms)) {
        entries.push({ t: new Date(ms).toISOString(), v });
      }
    }
    return entries;
  }

  resampleData(entries, timeframe, resolution, aggMethod = 'average') {
    if (!entries || entries.length === 0) return [];
    const now = Date.now();
    const durationMs = this.getTimeframeDurationMs(timeframe);
    const startTime = now - durationMs;

    let bucketCount = 48;
    const resMap = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 3600 * 1000,
      '6h': 6 * 3600 * 1000,
      '1d': 24 * 3600 * 1000
    };
    if (resolution && resolution !== 'auto' && resMap[resolution]) {
      bucketCount = Math.max(1, Math.min(500, Math.round(durationMs / resMap[resolution])));
    }
    const bucketSize = durationMs / bucketCount;
    const buckets = Array.from({ length: bucketCount }, () => []);

    for (const pt of entries) {
      const ms = Date.parse(pt.t);
      if (!Number.isFinite(ms) || ms < startTime) continue;
      const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor((ms - startTime) / bucketSize)));
      buckets[idx].push(Number(pt.v));
    }

    const out = [];
    let lastKnown = entries.length > 0 ? Number(entries[0].v) : 0;
    for (let i = 0; i < bucketCount; i++) {
      const vals = buckets[i];
      const bucketTs = new Date(Math.round(startTime + (i + 0.5) * bucketSize)).toISOString();
      if (vals.length === 0) {
        if (aggMethod === 'sum' || aggMethod === 'diff') {
          out.push({ t: bucketTs, v: 0 });
        } else {
          out.push({ t: bucketTs, v: roundTo(lastKnown, 2) });
        }
        continue;
      }

      let aggVal = vals[vals.length - 1];
      if (aggMethod === 'average') {
        aggVal = vals.reduce((a, b) => a + b, 0) / vals.length;
      } else if (aggMethod === 'min') {
        aggVal = Math.min(...vals);
      } else if (aggMethod === 'max') {
        aggVal = Math.max(...vals);
      } else if (aggMethod === 'sum') {
        aggVal = vals.reduce((a, b) => a + b, 0);
      } else if (aggMethod === 'median') {
        const sorted = [...vals].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        aggVal = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      } else if (aggMethod === 'first') {
        aggVal = vals[0];
      } else if (aggMethod === 'last') {
        aggVal = vals[vals.length - 1];
      } else if (aggMethod === 'diff') {
        aggVal = vals[vals.length - 1] - vals[0];
      }
      lastKnown = aggVal;
      out.push({ t: bucketTs, v: roundTo(aggVal, 2) });
    }
    return out;
  }

  // =========================================================================
  // File Storage, Snapshots, Galleries & Unused Topic Audit
  // =========================================================================

  sanitizeFileSegment(name) {
    return String(name || '').replace(/\.json$/i, '').replace(/[^a-zA-Z0-9_-]/g, '');
  }

  sanitizeMediaFilename(name) {
    const base = path.basename(String(name || '').replace(/\0/g, ''));
    const safeName = base.replace(/[#?&"'\s]/g, '_');
    if (!safeName || safeName === '.' || safeName === '..') return '';
    if (safeName.includes('/') || safeName.includes('\\') || path.isAbsolute(safeName)) return '';
    return safeName;
  }

  parseDashboardSnapshotStem(stem) {
    const m = String(stem || '').match(/^(.+)_(\d{8})_(\d{6})(?:_(\d+))?$/);
    if (!m) return null;
    return {
      base: m[1],
      datePart: m[2],
      timePart: m[3],
      seq: m[4] ? parseInt(m[4], 10) : 0
    };
  }

  isDashboardSnapshotStem(stem) {
    return this.parseDashboardSnapshotStem(stem) !== null;
  }

  formatSnapshotSuffixFromMtime(mtimeMs) {
    const tz = this.getTimeZone();
    const d = new Date(mtimeMs);
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = fmt.formatToParts(d);
    const g = (t) => (parts.find((p) => p.type === t) || {}).value || '00';
    return `${g('year')}${g('month')}${g('day')}_${g('hour')}${g('minute')}${g('second')}`;
  }

  parseWidgetPresetName(name) {
    const parts = String(name || '').replace(/\.json$/i, '').split('/');
    if (parts.length !== 2) throw new Error('Invalid widget preset path');
    const widgetType = this.sanitizeFileSegment(parts[0]);
    const presetName = this.sanitizeFileSegment(parts[1]);
    if (!widgetType || !presetName) throw new Error('Invalid filename');
    return { widgetType, presetName, fullName: `${widgetType}/${presetName}` };
  }

  normalizeStorageType(type) {
    if (type === 'widget-presets' || type === 'widgetpresets') return 'widgetpresets';
    return String(type || '');
  }

  getFilePath(type, name) {
    const normType = this.normalizeStorageType(type);
    if (normType === 'widgetpresets') {
      const parsed = this.parseWidgetPresetName(name);
      return path.join(DATA_ROOT, 'widgetpresets', parsed.widgetType, `${parsed.presetName}.json`);
    }
    if (!['dashboards', 'templates'].includes(normType)) throw new Error('Invalid file type');
    const safeName = this.sanitizeFileSegment(name);
    if (!safeName) throw new Error('Invalid filename');
    return path.join(DATA_ROOT, normType, `${safeName}.json`);
  }

  pruneDashboardSnapshots(userDir, safeBase, maxSnapshots) {
    if (!fs.existsSync(userDir)) return;
    const entries = [];
    for (const f of fs.readdirSync(userDir)) {
      if (!f.endsWith('.json')) continue;
      const stem = f.replace(/\.json$/i, '');
      const parsed = this.parseDashboardSnapshotStem(stem);
      if (!parsed || parsed.base !== safeBase) continue;
      const full = path.join(userDir, f);
      try {
        const st = fs.statSync(full);
        if (st.isFile()) entries.push({ full, mtimeMs: st.mtimeMs });
      } catch (_e) {}
    }
    entries.sort((a, b) => a.mtimeMs - b.mtimeMs);
    while (entries.length > maxSnapshots) {
      const victim = entries.shift();
      try { fs.unlinkSync(victim.full); } catch (_e) {}
    }
  }

  listDashboardSnapshots(baseName) {
    const safeBase = this.sanitizeFileSegment(baseName);
    if (!safeBase) return [];
    const userDir = path.join(DATA_ROOT, 'dashboards');
    if (!fs.existsSync(userDir)) return [];
    const out = [];
    for (const f of fs.readdirSync(userDir)) {
      if (!f.endsWith('.json')) continue;
      const stem = f.replace(/\.json$/i, '');
      const parsed = this.parseDashboardSnapshotStem(stem);
      if (!parsed || parsed.base !== safeBase) continue;
      const full = path.join(userDir, f);
      try {
        const st = fs.statSync(full);
        if (st.isFile()) out.push({ name: stem, mtimeMs: st.mtimeMs });
      } catch (_e) {}
    }
    out.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return out;
  }

  peekDashboardVersionByName(name) {
    const stem = this.sanitizeFileSegment(name);
    if (!stem) throw new Error('Invalid name');
    let filePath = path.join(DATA_ROOT, 'dashboards', `${stem}.json`);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(ASSETS_ROOT, 'dashboards', `${stem}.json`);
    }
    if (!fs.existsSync(filePath)) throw new Error('File not found');
    try {
      const raw = fs.readFileSync(filePath, 'utf8').slice(0, 1024);
      const vm = raw.match(/"version"\s*:\s*"([^"]+)"/);
      if (vm && vm[1]) return vm[1].trim();
    } catch (_e) {}
    return '1.0.0';
  }

  clearDashboardSnapshotsForBase(baseName) {
    const items = this.listDashboardSnapshots(baseName);
    let deleted = 0;
    for (const it of items) {
      try {
        fs.unlinkSync(this.getFilePath('dashboards', it.name));
        deleted++;
      } catch (_e) {}
    }
    return deleted;
  }

  clearAllDashboardSnapshots() {
    const userDir = path.join(DATA_ROOT, 'dashboards');
    let deletedFiles = 0;
    if (!fs.existsSync(userDir)) return { deletedFiles: 0 };
    for (const f of fs.readdirSync(userDir)) {
      if (!f.endsWith('.json')) continue;
      const stem = f.replace(/\.json$/i, '');
      if (this.isDashboardSnapshotStem(stem)) {
        try {
          fs.unlinkSync(path.join(userDir, f));
          deletedFiles++;
        } catch (_e) {}
      }
    }
    return { deletedFiles };
  }

  listWidgetPresetFiles() {
    const allFiles = new Map();
    const readMeta = (filePath, widgetType, presetName, source) => {
      const fullName = `${widgetType}/${presetName}`;
      let displayName = presetName;
      let variantCount = 1;
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          if (typeof data.name === 'string' && data.name.trim()) displayName = data.name.trim();
          if (Array.isArray(data.variants) && data.variants.length > 0) {
            variantCount = data.variants.length;
          }
        }
      } catch (_e) {}
      allFiles.set(fullName, {
        name: fullName,
        widgetType,
        presetName,
        fileId: presetName,
        displayName,
        variantCount,
        source
      });
    };

    const scanRoot = (rootDir, source) => {
      if (!fs.existsSync(rootDir)) return;
      for (const dirent of fs.readdirSync(rootDir, { withFileTypes: true })) {
        if (!dirent.isDirectory()) continue;
        const widgetType = this.sanitizeFileSegment(dirent.name);
        if (!widgetType) continue;
        const typeDir = path.join(rootDir, dirent.name);
        for (const f of fs.readdirSync(typeDir)) {
          if (!f.endsWith('.json')) continue;
          const presetName = this.sanitizeFileSegment(f.replace(/\.json$/i, ''));
          if (!presetName) continue;
          readMeta(path.join(typeDir, f), widgetType, presetName, source);
        }
      }
    };

    scanRoot(path.join(ASSETS_ROOT, 'widgets', 'presets'), 'factory');
    scanRoot(path.join(DATA_ROOT, 'widgetpresets'), 'user');

    return Array.from(allFiles.values()).sort((a, b) => {
      const an = a.displayName || a.presetName || a.name;
      const bn = b.displayName || b.presetName || b.name;
      return String(an).localeCompare(String(bn), undefined, { sensitivity: 'base' });
    });
  }

  listFiles(type, options = {}) {
    const normType = this.normalizeStorageType(type);
    if (normType === 'widgetpresets') {
      return this.listWidgetPresetFiles();
    }
    if (!['dashboards', 'templates'].includes(normType)) return [];

    const userDir = path.join(DATA_ROOT, normType);
    const factoryDir = path.join(ASSETS_ROOT, normType);
    const allFiles = new Map();

    if (fs.existsSync(factoryDir)) {
      for (const f of fs.readdirSync(factoryDir)) {
        if (f.endsWith('.json')) {
          const stem = f.replace(/\.json$/i, '');
          allFiles.set(stem, { name: stem, source: 'factory' });
        }
      }
    }

    if (fs.existsSync(userDir)) {
      const userFiles = fs.readdirSync(userDir).filter((f) => f.endsWith('.json'));
      const snapshotCountByBase = new Map();
      if (normType === 'dashboards') {
        for (const f of userFiles) {
          const stem = f.replace(/\.json$/i, '');
          const parsed = this.parseDashboardSnapshotStem(stem);
          if (parsed) {
            snapshotCountByBase.set(parsed.base, (snapshotCountByBase.get(parsed.base) || 0) + 1);
          }
        }
      }
      for (const f of userFiles) {
        const stem = f.replace(/\.json$/i, '');
        if (normType === 'dashboards' && this.isDashboardSnapshotStem(stem)) continue;
        const entry = { name: stem, source: 'user' };
        if (normType === 'dashboards') {
          entry.snapshotCount = snapshotCountByBase.get(stem) || 0;
          if (options.includeSnapshots) {
            entry.snapshots = entry.snapshotCount > 0 ? this.listDashboardSnapshots(stem) : [];
          }
        }
        allFiles.set(stem, entry);
      }
    }

    return Array.from(allFiles.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  readFileContent(type, name) {
    const normType = this.normalizeStorageType(type);
    const userPath = this.getFilePath(normType, name);
    if (fs.existsSync(userPath)) {
      return JSON.parse(fs.readFileSync(userPath, 'utf8'));
    }
    let factoryPath;
    if (normType === 'widgetpresets') {
      const parsed = this.parseWidgetPresetName(name);
      factoryPath = path.join(ASSETS_ROOT, 'widgets', 'presets', parsed.widgetType, `${parsed.presetName}.json`);
    } else {
      const safeName = this.sanitizeFileSegment(name);
      factoryPath = path.join(ASSETS_ROOT, normType, `${safeName}.json`);
    }
    if (fs.existsSync(factoryPath)) {
      return JSON.parse(fs.readFileSync(factoryPath, 'utf8'));
    }
    throw new Error(`File not found: ${name}`);
  }

  saveFileContent(type, name, content) {
    const normType = this.normalizeStorageType(type);
    const settings = this.getAppSettings();
    const filePath = this.getFilePath(normType, name);
    const safeBase = normType === 'widgetpresets'
      ? this.parseWidgetPresetName(name).presetName
      : this.sanitizeFileSegment(name);
    if (!safeBase) throw new Error('Invalid filename');

    const keepHistory = settings.keepDashboardFileHistory !== false && settings.dashboardFileHistory !== false;
    if (normType === 'dashboards' && keepHistory && fs.existsSync(filePath)) {
      const maxSnapshots = clampNum(
        parseInt(settings.dashboardFileHistoryMax || settings.dashboardHistoryMaxCount, 10) || 10,
        1,
        50
      );
      try {
        const st = fs.statSync(filePath);
        if (st.isFile()) {
          const suffix = this.formatSnapshotSuffixFromMtime(st.mtimeMs);
          let snapshotStem = `${safeBase}_${suffix}`;
          let snapshotPath = this.getFilePath('dashboards', snapshotStem);
          let extra = 0;
          while (fs.existsSync(snapshotPath)) {
            extra += 1;
            snapshotStem = `${safeBase}_${suffix}_${extra}`;
            snapshotPath = this.getFilePath('dashboards', snapshotStem);
          }
          fs.renameSync(filePath, snapshotPath);
          this.pruneDashboardSnapshots(path.join(DATA_ROOT, 'dashboards'), safeBase, maxSnapshots);
        }
      } catch (_e) {}
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const dataStr = typeof content === 'string' ? content : JSON.stringify(content);
    fs.writeFileSync(filePath, dataStr, 'utf8');
    return safeBase;
  }

  deleteFileByName(type, name) {
    const normType = this.normalizeStorageType(type);
    const filePath = this.getFilePath(normType, name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    throw new Error('File not found or is a built-in factory file');
  }

  isInternalAppIcon(name) {
    const internal = [
      'apple-touch-icon.png',
      'icon-192.png',
      'icon-512.png',
      'responsive-mode.svg',
      'dashboardstudio_logo_darkmode.svg',
      'dashboardstudio_logo_lightmode.svg'
    ];
    return internal.includes(String(name || '').toLowerCase());
  }

  listMediaFiles(mediaType) {
    const isAudio = mediaType === 'audio';
    const folder = isAudio ? 'audio' : 'images';
    const exts = isAudio
      ? new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm', '.flac'])
      : new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']);

    const allFiles = new Map();

    const factoryDir = path.join(ASSETS_ROOT, folder);
    if (fs.existsSync(factoryDir)) {
      for (const f of fs.readdirSync(factoryDir)) {
        if (!isAudio && this.isInternalAppIcon(f)) continue;
        const ext = path.extname(f).toLowerCase();
        if (!exts.has(ext)) continue;
        try {
          const st = fs.statSync(path.join(factoryDir, f));
          if (st.isFile()) {
            allFiles.set(f, {
              name: f,
              url: `${folder}/${encodeURIComponent(f)}`,
              size: st.size,
              mtime: st.mtimeMs,
              source: 'factory'
            });
          }
        } catch (_e) {}
      }
    }

    const userDir = path.join(DATA_ROOT, folder);
    if (fs.existsSync(userDir)) {
      for (const f of fs.readdirSync(userDir)) {
        const ext = path.extname(f).toLowerCase();
        if (!exts.has(ext)) continue;
        try {
          const st = fs.statSync(path.join(userDir, f));
          if (st.isFile()) {
            allFiles.set(f, {
              name: f,
              url: `${folder}/${encodeURIComponent(f)}`,
              size: st.size,
              mtime: st.mtimeMs,
              source: 'user'
            });
          }
        } catch (_e) {}
      }
    }

    return Array.from(allFiles.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  saveMediaFile(mediaType, name, contentBase64) {
    const folder = mediaType === 'audio' ? 'audio' : 'images';
    const safeName = this.sanitizeMediaFilename(name);
    if (!safeName) throw new Error('Invalid filename');
    const filePath = path.join(DATA_ROOT, folder, safeName);
    const matches = String(contentBase64 || '').match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    const buffer = (matches && matches.length === 3)
      ? Buffer.from(matches[2], 'base64')
      : Buffer.from(String(contentBase64 || ''), 'base64');
    fs.writeFileSync(filePath, buffer);
    return safeName;
  }

  deleteMediaFile(mediaType, name) {
    const folder = mediaType === 'audio' ? 'audio' : 'images';
    const safeName = this.sanitizeMediaFilename(name);
    if (!safeName) throw new Error('Invalid filename');
    const userPath = path.join(DATA_ROOT, folder, safeName);
    if (!fs.existsSync(userPath)) {
      const factoryPath = path.join(ASSETS_ROOT, folder, safeName);
      if (fs.existsSync(factoryPath)) {
        throw new Error(`Built-in ${folder} cannot be deleted`);
      }
      throw new Error('File not found');
    }
    fs.unlinkSync(userPath);
    return safeName;
  }

  renameMediaFile(mediaType, fromName, toName) {
    const folder = mediaType === 'audio' ? 'audio' : 'images';
    const safeFrom = this.sanitizeMediaFilename(fromName);
    const safeTo = this.sanitizeMediaFilename(toName);
    if (!safeFrom || !safeTo) throw new Error('Invalid rename arguments');
    const fromPath = path.join(DATA_ROOT, folder, safeFrom);
    if (!fs.existsSync(fromPath)) {
      throw new Error('Source file not found or is a built-in file');
    }
    const extFrom = path.extname(safeFrom).toLowerCase();
    const extTo = path.extname(safeTo).toLowerCase();
    if (extFrom !== extTo) throw new Error('File extension must stay the same');
    const toPath = path.join(DATA_ROOT, folder, safeTo);
    if (fromPath === toPath) return safeTo;
    if (fs.existsSync(toPath)) throw new Error('A file with that name already exists');
    fs.renameSync(fromPath, toPath);
    return safeTo;
  }

  scanDashboardTopics() {
    const primaries = this.listFiles('dashboards');
    const referencedStrings = new Set();
    let dashboardsScanned = 0;
    const tokenRegex = /\{\{\s*([^{}]+?)\s*\}\}/g;

    const collectStrings = (node, depth = 0) => {
      if (!node || depth > 40) return;
      if (typeof node === 'string') {
        const s = node.trim();
        if (!s) return;
        if (s.includes('{{')) {
          tokenRegex.lastIndex = 0;
          let m;
          while ((m = tokenRegex.exec(s)) !== null) {
            referencedStrings.add(m[1].trim());
          }
        }
        referencedStrings.add(s);
        return;
      }
      if (Array.isArray(node)) {
        for (const item of node) collectStrings(item, depth + 1);
        return;
      }
      if (typeof node === 'object') {
        for (const [k, val] of Object.entries(node)) {
          referencedStrings.add(k.trim());
          collectStrings(val, depth + 1);
        }
      }
    };

    for (const p of primaries) {
      try {
        const content = this.readFileContent('dashboards', p.name);
        dashboardsScanned++;
        collectStrings(content, 0);
      } catch (_e) {}
    }

    const allBlob = Array.from(referencedStrings).join('\n');
    const enabledConfig = this.getEnabledCapabilities();
    const devicesList = this.buildGetDevicesResponse();
    const deviceMap = new Map(devicesList.map((d) => [d.id, d]));

    const usedTopics = [];
    const unused = [];
    for (const [devId, caps] of Object.entries(enabledConfig)) {
      if (!Array.isArray(caps)) continue;
      const devMeta = deviceMap.get(devId);
      const zoneName = devMeta ? devMeta.zoneName : 'Unknown';
      const deviceName = devMeta ? devMeta.name : `Removed Entity (${devId})`;
      const deviceExists = Boolean(devMeta);

      for (const capId of caps) {
        const capObj = devMeta && Array.isArray(devMeta.capabilities)
          ? devMeta.capabilities.find((c) => c.id === capId)
          : null;
        let topic = (capObj && capObj.topic) || `homeassistant/${devId}/${capId}`;
        if (!capObj) {
          if (zoneName === 'Variables') topic = `homeassistant/variables/${devId}/value`;
          else if (zoneName === 'Flows') topic = `homeassistant/flows/${devId}/${capId}`;
          else if (zoneName === 'Moods') topic = `homeassistant/moods/${devId}/${capId}`;
        }

        const subTopic = normalizeTopicPrefix(topic);
        let isUsed = false;
        if (allBlob.includes(topic) || allBlob.includes(`homey/${subTopic}`) || allBlob.includes(subTopic) || allBlob.includes(`${devId}/${capId}`)) {
          isUsed = true;
        }
        if (!isUsed && devId.startsWith('light.') && (capId === LIGHT_COMPOSITE_CAP_ID || LIGHT_SINGLE_CAPS.has(capId))) {
          if (allBlob.includes(`${devId}/${LIGHT_COMPOSITE_CAP_ID}`)) {
            isUsed = true;
          }
        }

        if (isUsed) {
          usedTopics.push(topic);
        } else {
          const capTitle = (capObj && capObj.title) || capId;
          unused.push({
            deviceId: devId,
            deviceName,
            zoneName,
            capId,
            capTitle,
            topic,
            deviceExists
          });
        }
      }
    }

    return {
      success: true,
      dashboardCount: dashboardsScanned,
      dashboardsScanned,
      usedTopics,
      unusedCount: unused.length,
      unused
    };
  }

  // =========================================================================
  // HTTP Server, Admin API & Socket.IO Setup
  // =========================================================================

  getLocalIpAddress() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return 'localhost';
  }

  getClientSettingsPayload() {
    const appSettings = this.getAppSettings();
    return Object.assign({
      environment: 'homeassistant',
      hideEditor: false,
      keepDashboardFileHistory: true,
      dashboardFileHistoryMax: 10,
      cacheValues: 'all',
      warnWhenDriverOffline: false,
      autoEcho: true,
      serverPort: this.port || 5050,
      ui: {
        hiddenDrivers: ['homey', 'nodered'],
        showDataConnection: true
      }
    }, appSettings, {
      environment: 'homeassistant'
    });
  }

  startHttpServer() {
    const settings = this.getAppSettings();
    const desiredPort = parseInt(settings.serverPort || settings.port, 10) || parseInt(process.env.PORT, 10) || 5050;
    this.port = desiredPort;

    this.server = http.createServer((req, res) => {
      this.handleHttpRequest(req, res).catch((err) => {
        console.error('[DashboardStudio] HTTP handler error:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
        }
      });
    });

    this.io = new Server(this.server, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
      maxHttpBufferSize: 25 * 1024 * 1024
    });

    this.setupSocketIoHandlers();

    this.server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`[DashboardStudio] Port ${this.port} is busy, trying ${this.port + 1}...`);
        this.port += 1;
        this.server.listen(this.port, '0.0.0.0');
      } else {
        console.error('[DashboardStudio] HTTP server error:', err);
      }
    });

    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`[DashboardStudio] Server listening on http://${this.getLocalIpAddress()}:${this.port}`);
      console.log(`[DashboardStudio] Configuration UI available at http://${this.getLocalIpAddress()}:${this.port}/admin`);
    });
  }

  setupSocketIoHandlers() {
    this.io.on('connection', (socket) => {
      this.activeSessions.set(socket.id, { dashboard: null, page: null });

      socket.on('disconnect', () => {
        this.activeSessions.delete(socket.id);
        this.syncAllOpenBinarySensorsToHa();
      });

      socket.on('request_state_sync', (data, ack) => {
        const respond = typeof ack === 'function' ? ack : (typeof data === 'function' ? data : null);
        this.emitStateCacheToSocket(socket);
        if (respond) respond({ ok: true, topics: this.stateCache.size });
      });

      socket.on('get_settings', () => {
        socket.emit('settings_updated', this.getClientSettingsPayload());
      });

      socket.on('set_state', (data) => {
        this.handleSetStateCommand(data).catch((err) => {
          console.error('[DashboardStudio] set_state error:', err.message);
        });
      });

      // Trigger 1: Dashboard Trigger event (`{ name, value }` or `{ event, value }`)
      socket.on('dashboard_trigger', (data) => {
        const eventName = data && (data.name || data.event);
        if (!eventName) return;
        const rawVal = data.value;
        const valStr = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
        const numParsed = Number(rawVal);
        const valNum = Number.isFinite(numParsed) ? numParsed : 0;
        let valBool = false;
        if (typeof rawVal === 'boolean') valBool = rawVal;
        else if (typeof rawVal === 'number') valBool = rawVal > 0;
        else if (typeof rawVal === 'string') {
          const s = rawVal.trim().toLowerCase();
          valBool = s === 'true' || s === '1' || s === 'on' || s === 'yes';
        }

        this.fireHaEvent('dashboard_studio_trigger', {
          event: String(eventName),
          val_str: valStr,
          val_num: valNum,
          val_bool: valBool,
          value: rawVal
        });
      });

      // Trigger 2: Dashboard Loaded (`{ name, page }` or `{ dashboard, page }`)
      socket.on('dashboard_loaded', (data) => {
        const rawName = data && (data.name || data.dashboard);
        const dashName = rawName ? normalizeDashboardId(rawName) : 'default';
        const page = data && data.page !== undefined ? normalizePageId(data.page) : '1';
        const session = this.activeSessions.get(socket.id) || { dashboard: null, page: null };
        session.dashboard = dashName;
        session.page = page;
        this.activeSessions.set(socket.id, session);
        this.syncAllOpenBinarySensorsToHa();

        this.fireHaEvent('dashboard_studio_loaded', {
          dashboard: dashName,
          dashboard_name: rawName || dashName
        });
      });

      // Trigger 3: Dashboard Page Opened (`{ name, page, restore }` or `{ dashboard, page }`)
      socket.on('dashboard_page', (data) => {
        if (!data) return;
        const session = this.activeSessions.get(socket.id) || { dashboard: 'default', page: null };
        const rawName = data.name || data.dashboard;
        if (rawName) session.dashboard = normalizeDashboardId(rawName);
        if (data.page !== undefined) session.page = normalizePageId(data.page);
        this.activeSessions.set(socket.id, session);
        this.syncAllOpenBinarySensorsToHa();

        if (!data.restore) {
          this.fireHaEvent('dashboard_studio_page_opened', {
            dashboard: session.dashboard || 'default',
            dashboard_name: rawName || session.dashboard || 'default',
            page: session.page || '',
            page_name: data.page !== undefined ? String(data.page) : ''
          });
        }
      });

      // Trigger 4: Dashboard Saved (`{ name }` or `{ dashboard }`)
      socket.on('dashboard_saved', (data) => {
        const rawName = data && (data.name || data.dashboard);
        const dashName = rawName ? normalizeDashboardId(rawName) : 'default';
        this.fireHaEvent('dashboard_studio_saved', {
          dashboard: dashName,
          dashboard_name: rawName || dashName
        });
      });

      // File Storage Socket.IO Handlers (supporting both event-based and callback-based callers)
      socket.on('file_list', (data, callback) => {
        try {
          const type = (data && data.type) || 'dashboards';
          const files = this.listFiles(type);
          socket.emit('file_list_response', { type, files });
          if (typeof callback === 'function') callback({ files });
        } catch (err) {
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      socket.on('file_load', (data, callback) => {
        try {
          const type = (data && data.type) || 'dashboards';
          const name = data && (data.name || data.filename);
          const content = this.readFileContent(type, name);
          socket.emit('file_load_response', { type, name, content });
          if (typeof callback === 'function') callback({ content });
        } catch (err) {
          socket.emit('file_op_error', { op: 'load', message: err.message });
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      socket.on('file_save', (data, callback) => {
        try {
          const type = (data && data.type) || 'dashboards';
          const name = data && (data.name || data.filename);
          const savedName = this.saveFileContent(type, name, data && data.content);
          socket.emit('file_op_success', { op: 'save', type, name });
          if (typeof callback === 'function') callback({ success: true, filename: savedName });
        } catch (err) {
          socket.emit('file_op_error', { op: 'save', message: err.message });
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      socket.on('file_delete', (data, callback) => {
        try {
          const type = (data && data.type) || 'dashboards';
          const name = data && (data.name || data.filename);
          this.deleteFileByName(type, name);
          socket.emit('file_op_success', { op: 'delete', type, name });
          if (typeof callback === 'function') callback({ success: true });
        } catch (err) {
          socket.emit('file_op_error', { op: 'delete', message: err.message });
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      // Snapshot History Socket.IO Handlers
      socket.on('file_history_list', (data, callback) => {
        try {
          const baseName = data && (data.baseName || data.filename);
          const items = this.listDashboardSnapshots(baseName);
          socket.emit('file_history_list_response', {
            type: (data && data.type) || 'dashboards',
            baseName,
            items,
            reqId: data && data.reqId
          });
          if (typeof callback === 'function') callback({ snapshots: items, items });
        } catch (err) {
          socket.emit('file_history_error', { op: 'list', message: err.message, reqId: data && data.reqId });
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      socket.on('file_history_peek', (data, callback) => {
        try {
          const name = data && (data.name || data.snapshotName);
          const version = this.peekDashboardVersionByName(name);
          socket.emit('file_history_peek_response', {
            type: (data && data.type) || 'dashboards',
            name,
            version,
            reqId: data && data.reqId
          });
          if (typeof callback === 'function') callback({ version });
        } catch (err) {
          socket.emit('file_history_error', { op: 'peek', message: err.message, reqId: data && data.reqId });
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      socket.on('file_history_clear', (data, callback) => {
        try {
          const baseName = data && (data.baseName || data.filename);
          this.clearDashboardSnapshotsForBase(baseName);
          socket.emit('file_history_clear_response', {
            type: (data && data.type) || 'dashboards',
            baseName
          });
          if (typeof callback === 'function') callback({ success: true });
        } catch (err) {
          socket.emit('file_history_error', { op: 'clear', message: err.message });
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      // Image Gallery Socket.IO Handlers
      socket.on('image_list', (_data, callback) => {
        try {
          const files = this.listMediaFiles('images');
          socket.emit('image_list_response', files);
          if (typeof callback === 'function') callback({ files });
        } catch (err) {
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      socket.on('image_upload', (data, callback) => {
        try {
          const name = data && (data.name || data.filename);
          const content = data && (data.content || data.data);
          const savedName = this.saveMediaFile('images', name, content);
          socket.emit('image_op_success', { op: 'upload', name: savedName });
          socket.emit('image_list_response', this.listMediaFiles('images'));
          if (typeof callback === 'function') callback({ success: true, name: savedName });
        } catch (err) {
          socket.emit('image_op_error', { op: 'upload', message: err.message });
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      socket.on('image_delete', (data, callback) => {
        try {
          const names = Array.isArray(data && data.names)
            ? data.names
            : ((data && (data.name || data.filename)) ? [data.name || data.filename] : []);
          for (const n of names) {
            this.deleteMediaFile('images', n);
          }
          socket.emit('image_op_success', { op: 'delete', name: data && data.name, names });
          socket.emit('image_list_response', this.listMediaFiles('images'));
          if (typeof callback === 'function') callback({ success: true });
        } catch (err) {
          socket.emit('image_op_error', { op: 'delete', message: err.message });
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      socket.on('image_rename', (data, callback) => {
        try {
          const fromName = data && (data.from || data.oldFilename);
          const toName = data && (data.to || data.newFilename);
          const finalName = this.renameMediaFile('images', fromName, toName);
          socket.emit('image_op_success', { op: 'rename', from: fromName, to: finalName });
          socket.emit('image_list_response', this.listMediaFiles('images'));
          if (typeof callback === 'function') callback({ success: true, to: finalName });
        } catch (err) {
          socket.emit('image_op_error', { op: 'rename', message: err.message });
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      // Audio Gallery Socket.IO Handlers
      socket.on('audio_list', (_data, callback) => {
        try {
          const files = this.listMediaFiles('audio');
          socket.emit('audio_list_response', files);
          if (typeof callback === 'function') callback({ files });
        } catch (err) {
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      socket.on('audio_upload', (data, callback) => {
        try {
          const name = data && (data.name || data.filename);
          const content = data && (data.content || data.data);
          const savedName = this.saveMediaFile('audio', name, content);
          socket.emit('audio_op_success', { op: 'upload', name: savedName });
          socket.emit('audio_list_response', this.listMediaFiles('audio'));
          if (typeof callback === 'function') callback({ success: true, name: savedName });
        } catch (err) {
          socket.emit('audio_op_error', { op: 'upload', message: err.message });
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      socket.on('audio_delete', (data, callback) => {
        try {
          const names = Array.isArray(data && data.names)
            ? data.names
            : ((data && (data.name || data.filename)) ? [data.name || data.filename] : []);
          for (const n of names) {
            this.deleteMediaFile('audio', n);
          }
          socket.emit('audio_op_success', { op: 'delete', name: data && data.name, names });
          socket.emit('audio_list_response', this.listMediaFiles('audio'));
          if (typeof callback === 'function') callback({ success: true });
        } catch (err) {
          socket.emit('audio_op_error', { op: 'delete', message: err.message });
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      socket.on('audio_rename', (data, callback) => {
        try {
          const fromName = data && (data.from || data.oldFilename);
          const toName = data && (data.to || data.newFilename);
          const finalName = this.renameMediaFile('audio', fromName, toName);
          socket.emit('audio_op_success', { op: 'rename', from: fromName, to: finalName });
          socket.emit('audio_list_response', this.listMediaFiles('audio'));
          if (typeof callback === 'function') callback({ success: true, to: finalName });
        } catch (err) {
          socket.emit('audio_op_error', { op: 'rename', message: err.message });
          if (typeof callback === 'function') callback({ error: err.message });
        }
      });

      // URL Page Title Fetcher
      socket.on('fetch_url_title', async (data, callback) => {
        try {
          const title = await fetchUrlPageTitle(data && data.url);
          if (typeof callback === 'function') callback({ ok: true, title: title || '' });
        } catch (err) {
          if (typeof callback === 'function') callback({ ok: false, error: err.message });
        }
      });
    });
  }

  readJsonBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (!raw) return resolve({});
        try {
          resolve(JSON.parse(raw));
        } catch (err) {
          reject(new Error('Invalid JSON body'));
        }
      });
      req.on('error', reject);
    });
  }

  sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(payload));
  }

  async handleHttpRequest(req, res) {
    if (req.url.startsWith('/socket.io/')) return;
    res.setHeader('Access-Control-Allow-Origin', '*');

    const parsedUrl = new url.URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    pathname = pathname.replace(/\/+/g, '/');

    // 1. Admin Configuration Screen (`/admin` or `/admin/`)
    if (pathname === '/admin' || pathname === '/admin/' || pathname === '/admin/index.html') {
      const adminHtmlPath = path.join(APP_ROOT, 'admin', 'index.html');
      if (fs.existsSync(adminHtmlPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
        fs.createReadStream(adminHtmlPath).pipe(res);
        return;
      }
    }

    // 2. REST API Endpoints (`/api/...` or `/admin/api/...`)
    if (pathname.startsWith('/api/') || pathname.startsWith('/admin/api/')) {
      const apiSubPath = pathname.replace(/^\/admin\/api\//, '/api/');
      await this.handleApiRequest(req, res, apiSubPath, parsedUrl);
      return;
    }

    // 3. Security Token Check for Dashboard / Editor routes (when enabled and not an Ingress request)
    const appSettings = this.getAppSettings();
    const isIngress = Boolean(req.headers['x-ingress-path']);
    if (!isIngress && appSettings.requireToken && appSettings.securityToken) {
      let providedToken = parsedUrl.searchParams.get('token');
      if (!providedToken && (req.headers.referer || req.headers.referrer)) {
        try {
          const refUrl = new URL(req.headers.referer || req.headers.referrer);
          providedToken = refUrl.searchParams.get('token');
        } catch (_e) {}
      }
      if (providedToken !== appSettings.securityToken) {
        if (pathname === '/' || pathname === '/index.html' || pathname === '/viewer.html' || pathname === '/editor.html') {
          res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<!DOCTYPE html><html><head><title>Dashboard Studio - Secure Access</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,sans-serif;background:#0f172a;color:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}.container{background:#1e293b;padding:40px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.5);max-width:400px;width:90%;box-sizing:border-box;}h1{color:#f8fafc;font-size:1.5rem;margin-top:0;}p{color:#94a3b8;font-size:0.95rem;margin-bottom:25px;line-height:1.5;}input{width:100%;padding:12px 15px;border:1px solid #334155;border-radius:6px;background:#0f172a;color:white;font-size:16px;box-sizing:border-box;margin-bottom:15px;outline:none;}button{background:#0ea5e9;color:white;border:none;padding:12px 20px;border-radius:6px;font-weight:bold;cursor:pointer;width:100%;font-size:16px;}</style></head><body><div class="container"><h1>Dashboard Secured</h1><p>Please enter your Security Token to continue.</p><form onsubmit="event.preventDefault(); var search = window.location.search; var newToken = \'token=\' + encodeURIComponent(document.getElementById(\'tokenInput\').value); window.location.search = search ? search + \'&\' + newToken : \'?\' + newToken;"><input type="text" id="tokenInput" placeholder="Security Token" required autofocus><button type="submit">Unlock Dashboard</button></form></div></body></html>');
          return;
        }
      }
    }

    // 4. Dynamic `/settings.json` & `/env.json`
    if (pathname.endsWith('/settings.json') || pathname.endsWith('/env.json')) {
      this.sendJson(res, 200, this.getClientSettingsPayload());
      return;
    }

    // 5. URL Page Title & Favicon helper endpoints
    if (pathname.endsWith('/url-page-title') && req.method === 'GET') {
      const targetRaw = parsedUrl.searchParams.get('url');
      try {
        const title = await fetchUrlPageTitle(targetRaw);
        this.sendJson(res, 200, { title: title || '' });
      } catch (_e) {
        this.sendJson(res, 200, { title: '' });
      }
      return;
    }

    if (pathname.endsWith('/url-favicon') && req.method === 'GET') {
      const targetRaw = parsedUrl.searchParams.get('url');
      try {
        if (typeof fetchFaviconBytes === 'function') {
          const result = await fetchFaviconBytes(targetRaw);
          if (result && result.buf && result.buf.length > 0) {
            res.writeHead(200, {
              'Content-Type': result.contentType || 'image/x-icon',
              'Cache-Control': 'public, max-age=86400'
            });
            res.end(result.buf);
            return;
          }
        }
      } catch (_e) {}
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    // 6. Root HTML serving (`/` -> `viewer.html` if viewerMode is enabled, or `index.html`)
    if (pathname === '/' || pathname === '/index.html') {
      const targetHtml = (appSettings.hideEditor || appSettings.viewerMode) ? 'viewer.html' : 'index.html';
      const htmlPath = path.join(ASSETS_ROOT, targetHtml);
      if (fs.existsSync(htmlPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
        fs.createReadStream(htmlPath).pipe(res);
        return;
      }
    }

    // 7. User-saved media or JSON files (`dashboards/`, `templates/`, `widgetpresets/`, `images/`, `audio/`)
    let cleanRel = pathname.replace(/^\/+/, '');
    if (cleanRel === 'templates.js') cleanRel = 'themes.js';
    const topFolder = cleanRel.split('/')[0];
    if (['dashboards', 'templates', 'widgetpresets', 'widget-presets', 'images', 'audio'].includes(topFolder)) {
      const mappedFolder = topFolder === 'widget-presets' ? 'widgetpresets' : topFolder;
      const fileSubPath = cleanRel.slice(topFolder.length + 1);
      const userFile = path.resolve(DATA_ROOT, mappedFolder, fileSubPath);
      if (userFile.startsWith(path.resolve(DATA_ROOT, mappedFolder)) && fs.existsSync(userFile) && fs.statSync(userFile).isFile()) {
        this.serveStaticFile(res, userFile);
        return;
      }
    }

    // 8. Static files from `ASSETS_ROOT`
    if (cleanRel === 'config.json') {
      const haPlatformConfig = path.resolve(__dirname, '..', 'individual platforms', 'homeassistant', 'config.json');
      if (fs.existsSync(haPlatformConfig)) {
        this.serveStaticFile(res, haPlatformConfig);
        return;
      }
    }
    const resolvedAsset = path.resolve(ASSETS_ROOT, cleanRel);
    if (resolvedAsset.startsWith(path.resolve(ASSETS_ROOT)) && fs.existsSync(resolvedAsset) && fs.statSync(resolvedAsset).isFile()) {
      this.serveStaticFile(res, resolvedAsset);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }

  serveStaticFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.webm': 'audio/webm',
      '.flac': 'audio/flac'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  }

  async handleApiRequest(req, res, apiPath, parsedUrl) {
    const method = req.method.toUpperCase();

    if (method === 'GET' && apiPath === '/api/appVersion') {
      return this.sendJson(res, 200, { version: this.getAppVersion() });
    }

    if (method === 'GET' && apiPath === '/api/settingsUiLocale') {
      return this.sendJson(res, 200, this.getSettingsUiLocaleBundle());
    }

    if (method === 'GET' && apiPath === '/api/getDashboardUrl') {
      const hostHeader = req.headers.host || `${this.getLocalIpAddress()}:${this.port}`;
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      return this.sendJson(res, 200, `${protocol}://${hostHeader}`);
    }

    if (method === 'GET' && apiPath === '/api/getDevices') {
      return this.sendJson(res, 200, this.buildGetDevicesResponse());
    }

    if (method === 'GET' && apiPath === '/api/apiKeyStatus') {
      const conn = this.getHaConnectionConfig();
      const isOk = Boolean(conn.token && this.wsAuthenticated);
      return this.sendJson(res, 200, {
        configured: Boolean(conn.token),
        valid: Boolean(conn.token),
        connected: isOk,
        mode: conn.mode,
        key: this.store.personal_api_key || '',
        haUrl: this.getAppSettings().haUrl || conn.httpUrl,
        permissions: conn.token ? {
          variables: { read: true, write: true },
          flows: { read: true, start: true },
          moods: { read: true, set: true }
        } : null
      });
    }

    if (method === 'POST' && apiPath === '/api/verifyApiKey') {
      const body = await this.readJsonBody(req);
      const token = String(body.key !== undefined ? body.key : (body.apiKey || '')).trim();
      const customHaUrl = String(body.haUrl || this.getAppSettings().haUrl || '').trim().replace(/\/+$/, '');
      if (customHaUrl) {
        this.store.app_settings.haUrl = customHaUrl;
      }
      if (!token) {
        this.store.personal_api_key = '';
        this.savePersistentStore();
        this.connectToHomeAssistant();
        const supConn = this.getHaConnectionConfig();
        return this.sendJson(res, 200, {
          valid: Boolean(supConn.token),
          cleared: true,
          mode: supConn.mode,
          permissions: supConn.token ? {
            variables: { read: true, write: true },
            flows: { read: true, start: true },
            moods: { read: true, set: true }
          } : null
        });
      }
      try {
        const testConn = {
          httpUrl: customHaUrl || this.getHaConnectionConfig().httpUrl,
          token
        };
        await this.haRestRequest('GET', '/api/', null, testConn);
        this.store.personal_api_key = token;
        this.savePersistentStore();
        this.connectToHomeAssistant();
        return this.sendJson(res, 200, {
          valid: true,
          permissions: {
            variables: { read: true, write: true },
            flows: { read: true, start: true },
            moods: { read: true, set: true }
          }
        });
      } catch (err) {
        return this.sendJson(res, 200, { valid: false, error: err.message });
      }
    }

    if (method === 'POST' && apiPath === '/api/ha-auto-configure') {
      const body = await this.readJsonBody(req);
      const token = String(body.token || body.key || '').trim();
      if (!token) {
        return this.sendJson(res, 400, { ok: false, error: 'Missing token' });
      }
      const candidates = [];
      if (Array.isArray(body.candidate_urls)) {
        for (const u of body.candidate_urls) {
          const cleanU = String(u || '').trim().replace(/\/+$/, '');
          if (cleanU && !candidates.includes(cleanU)) candidates.push(cleanU);
        }
      }
      if (body.ha_url) {
        const cleanU = String(body.ha_url).trim().replace(/\/+$/, '');
        if (cleanU && !candidates.includes(cleanU)) candidates.unshift(cleanU);
      }
      const currentUrl = (this.getAppSettings().haUrl || '').trim().replace(/\/+$/, '');
      if (currentUrl && !candidates.includes(currentUrl)) candidates.push(currentUrl);
      const remoteIp = String(req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : '')
        .replace(/^::ffff:/, '');
      if (remoteIp && remoteIp !== '127.0.0.1' && remoteIp !== '::1') {
        const remoteCandidate = `http://${remoteIp}:8123`;
        if (!candidates.includes(remoteCandidate)) candidates.push(remoteCandidate);
      }
      for (const fallback of ['http://127.0.0.1:8123', 'http://localhost:8123', 'http://host.docker.internal:8123', 'http://homeassistant.local:8123']) {
        if (!candidates.includes(fallback)) candidates.push(fallback);
      }

      let verifiedUrl = '';
      for (const candidateUrl of candidates) {
        try {
          await this.haRestRequest('GET', '/api/', null, { httpUrl: candidateUrl, token });
          verifiedUrl = candidateUrl;
          break;
        } catch (_e) {}
      }

      this.store.personal_api_key = token;
      if (verifiedUrl) {
        this.store.app_settings.haUrl = verifiedUrl;
      } else if (candidates[0] && !this.store.app_settings.haUrl) {
        this.store.app_settings.haUrl = candidates[0];
      }
      this.savePersistentStore();
      this.connectToHomeAssistant();
      return this.sendJson(res, 200, {
        ok: true,
        connected: Boolean(verifiedUrl),
        haUrl: this.store.app_settings.haUrl || ''
      });
    }

    if (method === 'GET' && apiPath === '/api/settings') {
      return this.sendJson(res, 200, this.getClientSettingsPayload());
    }

    if (method === 'POST' && apiPath === '/api/settings') {
      const val = await this.readJsonBody(req);
      if (val && typeof val === 'object') {
        const iconText = val.calendarIconBindingsText !== undefined ? val.calendarIconBindingsText : (val.calendarIconBindings || '');
        const iconCheck = calendarIconBindingsLib.parseIconBindingsText(String(iconText || ''));
        if (!iconCheck.ok && iconCheck.errors && iconCheck.errors.length > 0) {
          return this.sendJson(res, 400, { error: `Invalid icon bindings on line ${iconCheck.errors[0].line}: ${iconCheck.errors[0].message}` });
        }
        const blockText = val.calendarSourceBlockBindingsText !== undefined ? val.calendarSourceBlockBindingsText : (val.calendarSourceBlockBindings || '');
        const blockCheck = calendarSourceBlockBindingsLib.parseSourceBlockBindingsText(String(blockText || ''));
        if (!blockCheck.ok && blockCheck.errors && blockCheck.errors.length > 0) {
          return this.sendJson(res, 400, { error: `Invalid source block bindings on line ${blockCheck.errors[0].line}: ${blockCheck.errors[0].message}` });
        }
      }
      const prevUrl = this.getAppSettings().haUrl;
      this.store.app_settings = Object.assign({}, this.store.app_settings, val);
      this.savePersistentStore();
      this.populateInitialStateCache(true);
      if (this.io) {
        this.io.emit('settings_updated', this.getClientSettingsPayload());
      }
      if (val && val.haUrl !== undefined && val.haUrl !== prevUrl) {
        this.connectToHomeAssistant();
      }
      return this.sendJson(res, 200, { ok: true });
    }

    if (method === 'GET' && apiPath === '/api/getIconBindingsDefault') {
      return this.sendJson(res, 200, {
        text: this.getDefaultIconBindingsText()
      });
    }

    if (method === 'GET' && apiPath === '/api/getCalendarSourceBlockBindingsDefault') {
      return this.sendJson(res, 200, {
        text: this.getDefaultSourceBlockBindingsText()
      });
    }

    if (method === 'GET' && apiPath === '/api/scanDashboardTopics') {
      return this.sendJson(res, 200, this.scanDashboardTopics());
    }

    if (method === 'POST' && apiPath === '/api/clearDashboardSnapshots') {
      return this.sendJson(res, 200, this.clearAllDashboardSnapshots());
    }

    // Settings store (`Homey.get` / `Homey.set` compatibility)
    if (method === 'GET' && apiPath.startsWith('/api/store/')) {
      const key = decodeURIComponent(apiPath.slice('/api/store/'.length));
      if (key === 'enabled_capabilities' && !this.cachedDevicesResponse && this.haStates.size > 0) {
        this.rebuildDeviceCatalog();
      }
      return this.sendJson(res, 200, { value: this.store[key] !== undefined ? this.store[key] : null });
    }

    if (method === 'POST' && apiPath.startsWith('/api/store/')) {
      const key = decodeURIComponent(apiPath.slice('/api/store/'.length));
      const body = await this.readJsonBody(req);
      const val = body.value;
      this.store[key] = val;
      this.savePersistentStore();
      if (key === 'enabled_capabilities') {
        for (const [cachedTopic, entry] of this.stateCache.entries()) {
          if (entry && entry.type === 'mqtt') {
            this.stateCache.delete(cachedTopic);
          }
        }
        this.populateInitialStateCache(true);
      } else {
        this.populateInitialStateCache(false);
      }
      return this.sendJson(res, 200, { ok: true });
    }

    // File Manager REST endpoints
    if (method === 'GET' && apiPath.startsWith('/api/files/')) {
      const type = decodeURIComponent(apiPath.slice('/api/files/'.length));
      const list = this.listFiles(type, { includeSnapshots: type === 'dashboards' });
      return this.sendJson(res, 200, list);
    }

    if (method === 'DELETE' && apiPath.startsWith('/api/files/')) {
      const rest = apiPath.slice('/api/files/'.length);
      const slashIdx = rest.indexOf('/');
      const type = decodeURIComponent(rest.slice(0, slashIdx));
      const name = decodeURIComponent(rest.slice(slashIdx + 1));
      this.deleteFileByName(type, name);
      return this.sendJson(res, 200, { success: true });
    }

    if (method === 'GET' && apiPath === '/api/images') {
      return this.sendJson(res, 200, this.listMediaFiles('images'));
    }

    if (method === 'DELETE' && apiPath.startsWith('/api/images/')) {
      const name = decodeURIComponent(apiPath.slice('/api/images/'.length));
      this.deleteMediaFile('images', name);
      return this.sendJson(res, 200, { success: true });
    }

    if (method === 'GET' && apiPath === '/api/audio') {
      return this.sendJson(res, 200, this.listMediaFiles('audio'));
    }

    if (method === 'DELETE' && apiPath.startsWith('/api/audio/')) {
      const name = decodeURIComponent(apiPath.slice('/api/audio/'.length));
      this.deleteMediaFile('audio', name);
      return this.sendJson(res, 200, { success: true });
    }

    // Service / Flowcard Action endpoints (`/api/service/:action`)
    if (apiPath.startsWith('/api/service/')) {
      const action = decodeURIComponent(apiPath.slice('/api/service/'.length));
      let args = {};
      if (method === 'POST') {
        args = await this.readJsonBody(req);
      } else {
        for (const [k, v] of parsedUrl.searchParams.entries()) {
          args[k] = v;
        }
      }
      const result = await this.executeServiceAction(action, args);
      return this.sendJson(res, 200, result);
    }

    this.sendJson(res, 404, { error: 'Unknown API endpoint' });
  }
}

const instance = new DashboardStudioHAServer();
instance.start().catch((err) => {
  console.error('[DashboardStudio] Fatal startup error:', err);
});

module.exports = instance;
