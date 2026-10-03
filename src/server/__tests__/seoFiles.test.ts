import { describe, it, expect } from 'vitest';
import { loadSiteConfig } from '../siteConfig';
import { renderAdsTxt, renderRobotsTxt, renderSitemap, renderConfigJs } from '../seoFiles';
import { BLOG_POSTS } from '../../data/blogPosts';

const cfg = loadSiteConfig({
  APP_URL: 'https://lyric.dev',
  ADSENSE_CLIENT_ID: 'ca-pub-1234567890123456',
  ADSENSE_SLOT_HEADER: '111',
  ADSENSE_SLOT_SIDEBAR: '222',
  ADSENSE_SLOT_INFEED: '333',
  GA_MEASUREMENT_ID: 'G-ABC',
} as NodeJS.ProcessEnv);

describe('renderAdsTxt', () => {
  it('writes the single canonical AdSense line', () => {
    expect(renderAdsTxt(cfg).trim()).toBe(
      'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0',
    );
  });

  it('writes an empty file when no publisher id is configured', () => {
    const bare = loadSiteConfig({ APP_URL: 'https://lyric.dev' } as NodeJS.ProcessEnv);
    expect(renderAdsTxt(bare)).toBe('');
  });
});

describe('renderRobotsTxt', () => {
  it('allows crawling, blocks account and points at the sitemap', () => {
    const out = renderRobotsTxt(cfg);
    expect(out).toContain('Allow: /');
    expect(out).toContain('Disallow: /account');
    expect(out).toContain('Sitemap: https://lyric.dev/sitemap.xml');
  });
});

describe('renderSitemap', () => {
  it('lists every page and every blog slug', () => {
    const out = renderSitemap(cfg);
    expect(out).toContain('<loc>https://lyric.dev/</loc>');
    expect(out).toContain('<loc>https://lyric.dev/studio</loc>');
    expect(out).toContain('<loc>https://lyric.dev/pricing</loc>');
    for (const post of BLOG_POSTS) {
      expect(out).toContain(`<loc>https://lyric.dev/blog/${post.slug}</loc>`);
    }
  });

  it('escapes XML entities', () => {
    expect(renderSitemap(cfg)).not.toContain('&blog/');
  });
});

describe('renderConfigJs', () => {
  it('exposes the publisher id and slots as window.__APP_CONFIG__', () => {
    const out = renderConfigJs(cfg);
    expect(out).toContain('window.__APP_CONFIG__');
    expect(out).toContain('"adsenseClient":"ca-pub-1234567890123456"');
    expect(out).toContain('"adsenseSlotHeader":"111"');
    expect(out).toContain('"gaMeasurementId":"G-ABC"');
  });
});