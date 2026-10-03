import { describe, it, expect } from 'vitest';
import { loadSiteConfig } from '../siteConfig';

describe('loadSiteConfig', () => {
  it('strips trailing slash from appUrl and defaults contact email', () => {
    const cfg = loadSiteConfig({ APP_URL: 'https://example.org/' } as NodeJS.ProcessEnv);
    expect(cfg.appUrl).toBe('https://example.org');
    expect(cfg.contactEmail).toBe('hello@example.org');
  });

  it('uses CONTACT_EMAIL when provided', () => {
    const cfg = loadSiteConfig({ CONTACT_EMAIL: 'hi@shop.vn' } as NodeJS.ProcessEnv);
    expect(cfg.contactEmail).toBe('hi@shop.vn');
  });

  it('detects a configured publisher id', () => {
    const cfg = loadSiteConfig({ ADSENSE_CLIENT_ID: 'ca-pub-1234567890123456' } as NodeJS.ProcessEnv);
    expect(cfg.hasAdsense).toBe(true);
    expect(cfg.adsenseClient).toBe('ca-pub-1234567890123456');
  });

  it('treats a malformed publisher id as not configured', () => {
    const cfg = loadSiteConfig({ ADSENSE_CLIENT_ID: 'pub-123' } as NodeJS.ProcessEnv);
    expect(cfg.hasAdsense).toBe(false);
  });

  it('defaults consentRequired to true and honours CONSENT_REQUIRED=false', () => {
    expect(loadSiteConfig({} as NodeJS.ProcessEnv).consentRequired).toBe(true);
    expect(loadSiteConfig({ CONSENT_REQUIRED: 'false' } as NodeJS.ProcessEnv).consentRequired).toBe(false);
  });
});