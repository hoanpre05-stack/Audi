import type { SiteConfig } from './siteConfig';
import { BLOG_POSTS } from '../data/blogPosts';

/** Static public paths included in the sitemap. */
export const PUBLIC_SLUGS = [
  '/',
  '/studio',
  '/blog',
  '/pricing',
  '/faq',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
];

const xmlEscape = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderAdsTxt(cfg: SiteConfig): string {
  if (!cfg.hasAdsense) return '';
  const pubId = cfg.adsenseClient.replace(/^ca-/, '');
  return `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;
}

export function renderRobotsTxt(cfg: SiteConfig): string {
  return ['User-agent: *', 'Allow: /', 'Disallow: /account', '', `Sitemap: ${cfg.appUrl}/sitemap.xml`, ''].join('\n');
}

export function renderSitemap(cfg: SiteConfig): string {
  const urls: { loc: string; lastmod?: string }[] = [
    ...PUBLIC_SLUGS.map((path) => ({ loc: `${cfg.appUrl}${path}` })),
    ...BLOG_POSTS.map((post) => ({
      loc: `${cfg.appUrl}/blog/${post.slug}`,
      lastmod: post.date,
    })),
  ];
  const body = urls
    .map((u) =>
      [
        '  <url>',
        `    <loc>${xmlEscape(u.loc)}</loc>`,
        u.lastmod ? `    <lastmod>${xmlEscape(u.lastmod)}</lastmod>` : '',
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function renderConfigJs(cfg: SiteConfig): string {
  const clientConfig = {
    adsenseClient: cfg.adsenseClient,
    adsenseSlotHeader: cfg.adsenseSlotHeader,
    adsenseSlotSidebar: cfg.adsenseSlotSidebar,
    adsenseSlotInfeed: cfg.adsenseSlotInfeed,
    consentRequired: cfg.consentRequired,
    gaMeasurementId: cfg.gaMeasurementId,
    appUrl: cfg.appUrl,
  };
  return `window.__APP_CONFIG__=${JSON.stringify(clientConfig)};\n`;
}