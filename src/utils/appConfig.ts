/**
 * Runtime application configuration.
 *
 * Priority (low -> high):
 *   1. Hard-coded defaults
 *   2. Build-time Vite env vars (VITE_*)
 *   3. Server-injected config from `/config.js` (window.__APP_CONFIG__)  <- production source of truth
 *   4. Per-browser overrides saved in localStorage (useful for local testing)
 */
export interface AppConfig {
  adsenseClient: string;
  adsenseSlotHeader: string;
  adsenseSlotSidebar: string;
  adsenseSlotInfeed: string;
  consentRequired: boolean;
  gaMeasurementId: string;
  appUrl: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<AppConfig>;
  }
}

const DEFAULTS: AppConfig = {
  adsenseClient: '',
  adsenseSlotHeader: 'header-slot-123',
  adsenseSlotSidebar: 'sidebar-slot-456',
  adsenseSlotInfeed: 'infeed-slot-789',
  consentRequired: true,
  gaMeasurementId: '',
  appUrl: '',
};

const readViteEnv = (): Partial<AppConfig> => {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    adsenseClient: env.VITE_ADSENSE_CLIENT_ID || '',
    gaMeasurementId: env.VITE_GA_MEASUREMENT_ID || '',
    appUrl: env.VITE_APP_URL || origin,
  };
};

const readLocalOverrides = (): Partial<AppConfig> => {
  if (typeof window === 'undefined') return {};
  try {
    const out: Partial<AppConfig> = {};
    const client = window.localStorage.getItem('adsense_client_id');
    const header = window.localStorage.getItem('adsense_slot_header');
    const sidebar = window.localStorage.getItem('adsense_slot_sidebar');
    const infeed = window.localStorage.getItem('adsense_slot_infeed');
    if (client) out.adsenseClient = client;
    if (header) out.adsenseSlotHeader = header;
    if (sidebar) out.adsenseSlotSidebar = sidebar;
    if (infeed) out.adsenseSlotInfeed = infeed;
    return out;
  } catch {
    return {};
  }
};

let cached: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (cached) return cached;
  const injected = (typeof window !== 'undefined' && window.__APP_CONFIG__) || {};
  cached = {
    ...DEFAULTS,
    ...readViteEnv(),
    ...injected,
    ...readLocalOverrides(),
  };
  return cached;
}

/** Clear the cache so newly saved settings take effect without a full page reload. */
export function refreshAppConfig(): AppConfig {
  cached = null;
  return getAppConfig();
}

/** True when a valid `ca-pub-...` publisher id is available. */
export function isAdSenseConfigured(): boolean {
  return /^ca-pub-\d{6,}$/.test(getAppConfig().adsenseClient.trim());
}

/** Absolute site base URL without a trailing slash. */
export function getSiteUrl(): string {
  const configured = getAppConfig().appUrl;
  const base = configured || (typeof window !== 'undefined' ? window.location.origin : '');
  return base.replace(/\/+$/, '');
}