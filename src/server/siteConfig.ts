/** Env-derived site configuration. Single place that reads process.env for the server. */
export interface SiteConfig {
  appUrl: string;
  contactEmail: string;
  adsenseClient: string;
  adsenseSlotHeader: string;
  adsenseSlotSidebar: string;
  adsenseSlotInfeed: string;
  consentRequired: boolean;
  gaMeasurementId: string;
  ipHashSalt: string;
  hasAdsense: boolean;
}

const PUBLISHER_RE = /^ca-pub-\d{6,}$/;

export function loadSiteConfig(env: NodeJS.ProcessEnv = process.env): SiteConfig {
  const appUrl = (env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const adsenseClient = (env.ADSENSE_CLIENT_ID || '').trim();
  return {
    appUrl,
    contactEmail: env.CONTACT_EMAIL || `hello@${appUrl.replace(/^https?:\/\//, '')}`,
    adsenseClient,
    adsenseSlotHeader: env.ADSENSE_SLOT_HEADER || '',
    adsenseSlotSidebar: env.ADSENSE_SLOT_SIDEBAR || '',
    adsenseSlotInfeed: env.ADSENSE_SLOT_INFEED || '',
    consentRequired: (env.CONSENT_REQUIRED || 'true') !== 'false',
    gaMeasurementId: env.GA_MEASUREMENT_ID || '',
    ipHashSalt: env.IP_HASH_SALT || '',
    hasAdsense: PUBLISHER_RE.test(adsenseClient),
  };
}