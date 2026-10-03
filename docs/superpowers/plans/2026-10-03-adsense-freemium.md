# AdSense Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make LyricStudio AI a content-first site that Google AdSense can crawl and approve, then add Google login, AI quota, watermark, and PayOS Pro without losing money on Gemini.

**Architecture:** One Express server on Railway keeps the existing React studio and FFmpeg. All public pages (landing, blog, pricing, FAQ, legal) become server-rendered HTML so AdSense reviewers and Googlebot see text without running JS. Only `/studio` and `/account` are React SPAs. Supabase holds Google login plus `profiles` / `usage_daily` / `payments`; PayOS is one-shot QR that adds 30 or 365 days to `pro_until`.

**Tech Stack:** Node 22, Express 4, React 19 + Vite 8, Tailwind v4, TypeScript, vitest, Supabase JS, PayOS v1 API, Google AdSense.

**Spec:** `docs/superpowers/specs/2026-10-03-adsense-freemium-design.md`

## Global Constraints

- Plan is derived at request time from `pro_until > now()`. `profiles.plan` is a cache and is never trusted alone on the server.
- Free: 3 AI calls/day, 720p export, burned-in watermark, ads on. Pro: 50 AI calls/day, 1080p, no watermark, no ads.
- Day boundary is `Asia/Ho_Chi_Minh`.
- Paid days always **extend**: `pro_until = max(now, pro_until) + 30|365` days.
- PayOS amounts: monthly `79000`, yearly `790000` VND. Descriptions ASCII: `LS Pro 1 thang`, `LS Pro 1 nam`.
- `/` must be a landing page. The studio lives at `/studio`. Never 301 `/` to `/studio`.
- Production HTML and built client JS must not contain the string `Khu Vực Quảng Cáo`.
- `ads.txt` must never invent a publisher id. Empty env means an empty file.
- Service role key, PayOS checksum key, Gemini key, `IP_HASH_SALT` stay server-only. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` reach the client.
- If Supabase is unreachable during an AI quota check, **fail closed** with 503 `AUTH_BACKEND`. Never serve uncounted Gemini calls.
- Convert concurrency is 2 in-flight per IP; over that return 429 `CONVERT_BUSY`. Temp files are always unlinked in `finally`.
- AI quota is incremented **after** body validation and **before** calling Gemini. A 5xx from Gemini does not refund the count.
- Contact email comes from `CONTACT_EMAIL`. No `example.com` placeholder ships.

---

## File Structure

New server modules (each one responsibility, unit-testable):

- `src/server/siteConfig.ts` — env → site config (URL, contact, adsense ids, consent, GA).
- `src/server/html.ts` — `escapeHtml`, `html` tag helper, page shell (head, header, footer).
- `src/server/seoFiles.ts` — `ads.txt`, `robots.txt`, `sitemap.xml` renderers.
- `src/server/content.ts` — landing copy, pricing copy, FAQ list, legal page bodies (single source of truth for server templates).
- `src/server/pages.ts` — HTML renderers for every public route.
- `src/server/quota.ts` — pure plan/quota/day math (no I/O).
- `src/server/db.ts` — Supabase service-role client + queries.
- `src/server/identity.ts` — resolve request identity (user or ip_hash), `/api/me` shape.
- `src/server/payos.ts` — pure checksum verification, day-extension math, order codes.
- `src/server/routes/api.ts` — `/api/me`, `/api/payments`, quota enforcement wrapper, rate limits.
- `src/server/routes/payosApi.ts` — create / webhook / status.
- `src/server/routes/publicPages.ts` — Express wiring for HTML routes + SPA fallback.
- `scripts/check-seo.ts` — production crawl assertions.

New shared data (moved out of React pages so server and client agree):

- `src/data/faq.ts` — FAQ list used by `/faq`, landing FAQ section, and `FAQPage` JSON-LD.
- `src/data/legal.ts` — privacy, terms, about, contact bodies.

Tests: `src/server/__tests__/*.test.ts`.

Modified: `server.ts`, `vite.config.ts`, `src/index.css`, `src/AppRouter.tsx`, `src/main.tsx`, `src/App.tsx`, `src/components/AdSenseSlot.tsx`, `src/components/VideoCanvas.tsx`, `.env.example`, `package.json`.

Deleted (replaced by server HTML): `src/pages/BlogIndexPage.tsx`, `src/pages/BlogPostPage.tsx`, `src/pages/AboutPage.tsx`, `src/pages/ContactPage.tsx`, `src/pages/PrivacyPage.tsx`, `src/pages/TermsPage.tsx`, `src/pages/FaqPage.tsx`, `src/components/Breadcrumbs.tsx`, `src/components/layout/*`, `src/utils/seo.tsx`, `src/utils/premium.ts`.

Kept: `src/data/blogPosts.ts` (server imports it directly), `src/components/SeoArticlesSection.tsx` (used inside the studio).

---

## Task 1: Test harness, stable CSS asset, site config, HTML primitives

**Files:**
- Modify: `package.json` (add `test` script, `vitest` devDependency)
- Modify: `vite.config.ts` (stable CSS filename)
- Modify: `src/index.css` (add `@source` for server templates)
- Create: `src/server/siteConfig.ts`
- Create: `src/server/html.ts`
- Test: `src/server/__tests__/siteConfig.test.ts`, `src/server/__tests__/html.test.ts`

**Interfaces:**
- Produces:
  - `siteConfig.ts`: `loadSiteConfig(env?: NodeJS.ProcessEnv): SiteConfig`, interface `SiteConfig { appUrl: string; contactEmail: string; adsenseClient: string; adsenseSlotHeader: string; adsenseSlotSidebar: string; adsenseSlotInfeed: string; consentRequired: boolean; gaMeasurementId: string; ipHashSalt: string; hasAdsense: boolean }`
  - `html.ts`: `escapeHtml(value: unknown): string`, `html(strings: TemplateStringsArray, ...values: unknown[]): string`, `renderShell(props: ShellProps): string`, interface `ShellProps { title: string; description: string; canonical: string; body: string; jsonLd?: Record<string, unknown>[]; robots?: string; bodyClass?: string }`

- [ ] **Step 1: Install vitest and add the test script**

Run: `npm install -D vitest`

Edit `package.json` scripts to include, keeping existing entries:

```json
"test": "vitest run",
"check:seo": "tsx scripts/check-seo.ts"
```

- [ ] **Step 2: Write the failing siteConfig test**

Create `src/server/__tests__/siteConfig.test.ts`:

```ts
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/server/__tests__/siteConfig.test.ts`
Expected: FAIL — cannot resolve `../siteConfig`.

- [ ] **Step 4: Implement siteConfig**

Create `src/server/siteConfig.ts`:

```ts
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
```

- [ ] **Step 5: Write the failing html test**

Create `src/server/__tests__/html.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { escapeHtml, html, renderShell } from '../html';

describe('escapeHtml', () => {
  it('escapes angle brackets, ampersands and quotes', () => {
    expect(escapeHtml('<script>"x" & y</script>')).toBe(
      '&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;',
    );
  });
});

describe('html', () => {
  it('escapes interpolated values and keeps literal markup', () => {
    const out = html`<p>${'<b>no</b>'}</p>`;
    expect(out).toBe('<p>&lt;b&gt;no&lt;/b&gt;</p>');
  });
});

describe('renderShell', () => {
  const props = {
    title: 'Tiêu đề',
    description: 'Mô tả',
    canonical: 'https://x.dev/blog',
    body: '<h1>Chào</h1>',
  };

  it('renders a doctype document with the canonical link', () => {
    const out = renderShell(props);
    expect(out.startsWith('<!doctype html>')).toBe(true);
    expect(out).toContain('<link rel="canonical" href="https://x.dev/blog">');
    expect(out).toContain('<h1>Chào</h1>');
  });

  it('escapes the title and description', () => {
    const out = renderShell({ ...props, title: '<b>T</b>' });
    expect(out).toContain('<title>&lt;b&gt;T</b>');
  });

  it('injects JSON-LD scripts when provided', () => {
    const out = renderShell({ ...props, jsonLd: [{ '@type': 'FAQPage' }] });
    expect(out).toContain('"@type":"FAQPage"');
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run src/server/__tests__/html.test.ts`
Expected: FAIL — cannot resolve `../html`.

- [ ] **Step 7: Implement html.ts**

Create `src/server/html.ts`:

```ts
/** Minimal HTML primitives for server-rendered pages. No template engine dependency. */

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Tagged template that escapes every interpolated value.
 * Arrays are joined so child lists can be nested.
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    out += (Array.isArray(v) ? v.join('') : escapeHtml(v)) + strings[i + 1];
  }
  return out;
}

export interface ShellProps {
  title: string;
  description: string;
  canonical: string;
  body: string;
  jsonLd?: Record<string, unknown>[];
  robots?: string;
}

const NAV = [
  { href: '/studio', label: 'Studio' },
  { href: '/blog', label: 'Blog' },
  { href: '/pricing', label: 'Bảng giá' },
  { href: '/faq', label: 'Hỏi đáp' },
  { href: '/about', label: 'Giới thiệu' },
  { href: '/contact', label: 'Liên hệ' },
];

export function renderShell(props: ShellProps): string {
  const {
    title,
    description,
    canonical,
    body,
    jsonLd,
    robots = 'index,follow,max-image-preview:large',
  } = props;
  const nav = html`
    <nav class="nav">
      ${NAV.map((item) => html`<a href="${item.href}">${item.label}</a>`)}
    </nav>
  `;
  const jsonLdScripts = (jsonLd || [])
    .map(
      (data) =>
        `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`,
    )
    .join('');
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="${escapeHtml(robots)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LyricStudio AI">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/app.css">
<script src="/config.js"></script>
${jsonLdScripts}
</head>
<body class="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">
${nav}
<main class="flex-1 w-full max-w-5xl mx-auto px-4 py-8">${body}</main>
${renderFooter()}
</body>
</html>`;
}

function renderFooter(): string {
  const year = new Date().getFullYear();
  return html`
    <footer class="site-footer">
      <p>© ${year} LyricStudio AI. Công cụ tạo lyric video bằng AI.</p>
      <p><a href="/privacy">Chính sách bảo mật</a> · <a href="/terms">Điều khoản sử dụng</a></p>
    </footer>
  `;
}
```

- [ ] **Step 8: Give Tailwind a stable CSS filename and template scanning**

In `vite.config.ts`, add `build` so the CSS asset keeps a predictable name that server templates can link:

```ts
build: {
  rollupOptions: {
    output: {
      assetFileNames: (asset) =>
        asset.name?.endsWith('.css') ? 'assets/app.css' : 'assets/[name]-[hash][extname]',
    },
  },
},
```

In `src/index.css`, add as the first line so classes used only inside server templates are still generated:

```css
@source "../server/**/*.ts";
```

- [ ] **Step 9: Run all tests**

Run: `npx vitest run`
Expected: PASS — 8 tests.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/index.css src/server
git commit -m "test: add vitest harness, site config and html primitives"
```

---

## Task 2: ads.txt, robots.txt, sitemap.xml, config.js

**Files:**
- Create: `src/server/seoFiles.ts`
- Test: `src/server/__tests__/seoFiles.test.ts`

**Interfaces:**
- Consumes: `loadSiteConfig(): SiteConfig` from Task 1.
- Produces:
  - `renderAdsTxt(cfg: SiteConfig): string`
  - `renderRobotsTxt(cfg: SiteConfig): string`
  - `renderSitemap(cfg: SiteConfig): string`
  - `renderConfigJs(cfg: SiteConfig): string`
  - `PUBLIC_SLUGS: string[]` — static public paths used by both sitemap and tests.

- [ ] **Step 1: Write the failing test**

Create `src/server/__tests__/seoFiles.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/server/__tests__/seoFiles.test.ts`
Expected: FAIL — cannot resolve `../seoFiles`.

- [ ] **Step 3: Implement seoFiles.ts**

Create `src/server/seoFiles.ts`:

```ts
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
  const urls = [
    ...PUBLIC_SLUGS.map((path) => ({ loc: `${cfg.appUrl}${path === '/' ? '' : path}` })),
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/server/__tests__/seoFiles.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/server/seoFiles.ts src/server/__tests__/seoFiles.test.ts
git commit -m "feat: serve ads.txt, robots.txt, sitemap.xml and config.js"
```

---

## Task 3: Shared content modules

**Files:**
- Create: `src/data/faq.ts`
- Create: `src/data/legal.ts`
- Create: `src/data/landing.ts`
- Test: `src/server/__tests__/content.test.ts`

**Interfaces:**
- Produces:
  - `faq.ts`: `export interface FaqItem { q: string; a: string }`, `export const FAQS: FaqItem[]`, `export function faqJsonLd(items?: FaqItem[]): Record<string, unknown>`
  - `legal.ts`: `export interface LegalSection { heading: string; paragraphs?: string[]; list?: string[] }`, `export interface LegalPage { slug: string; title: string; description: string; updated: string; intro: string; sections: LegalSection[] }`, `export const LEGAL_PAGES: LegalPage[]`
  - `landing.ts`: `export const LANDING: { title, description, intro, steps, features, keywords }`

Content requirements: FAQ must describe the real product (3 AI/day free, watermark, Pro). Legal pages must name AdSense/Google cookies, Consent Mode v2, upload-rights responsibility, and use `{contactEmail}` placeholders resolved at render time.

- [ ] **Step 1: Write the failing content test**

Create `src/server/__tests__/content.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { FAQS, faqJsonLd } from '../../data/faq';
import { LEGAL_PAGES } from '../../data/legal';
import { LANDING } from '../../data/landing';

describe('FAQ content', () => {
  it('has between five and twelve entries', () => {
    expect(FAQS.length).toBeGreaterThanOrEqual(5);
    expect(FAQS.length).toBeLessThanOrEqual(12);
  });

  it('does not promote AdSense as a use case', () => {
    expect(FAQS.some((f) => /adsense/i.test(f.q + f.a))).toBe(false);
  });

  it('builds FAQPage JSON-LD', () => {
    const ld = faqJsonLd();
    expect(ld['@type']).toBe('FAQPage');
    expect((ld.mainEntity as unknown[]).length).toBe(FAQS.length);
  });
});

describe('legal content', () => {
  it('covers the four required pages', () => {
    expect(LEGAL_PAGES.map((p) => p.slug).sort()).toEqual(
      ['about', 'contact', 'privacy', 'terms'].sort(),
    );
  });

  it('uses a contact placeholder instead of example.com', () => {
    expect(JSON.stringify(LEGAL_PAGES)).not.toMatch(/example\.com/);
    expect(JSON.stringify(LEGAL_PAGES)).toContain('{contactEmail}');
  });

  it('discloses AdSense and Google cookies in the privacy page', () => {
    const privacy = LEGAL_PAGES.find((p) => p.slug === 'privacy');
    const text = JSON.stringify(privacy);
    expect(text).toMatch(/AdSense/i);
    expect(text).toMatch(/Consent Mode/i);
    expect(text).toMatch(/DoubleClick/i);
  });
});

describe('landing content', () => {
  it('has an intro long enough to be real content', () => {
    expect(LANDING.intro.length).toBeGreaterThanOrEqual(120);
    expect(LANDING.steps.length).toBe(3);
    expect(LANDING.features.length).toBeGreaterThanOrEqual(4);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/server/__tests__/content.test.ts`
Expected: FAIL — cannot resolve `../../data/faq`.

- [ ] **Step 3: Create src/data/faq.ts**

```ts
export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: 'LyricStudio AI có miễn phí không?',
    a: 'Có. Gói miễn phí cho phép bạn tạo lyric video mỗi ngày với 3 lượt xử lý bằng AI, xuất video 720p kèm watermark nhỏ ở góc khung hình. Bản Pro bỏ watermark, nâng lên 1080p và tắt quảng cáo.',
  },
  {
    q: 'Tôi cần biết dựng phim không?',
    a: 'Không. Bạn tải tệp âm thanh lên, AI tự nhận diện lời hát và sinh mốc thời gian theo từng câu. Sau đó bạn chọn font chữ, hiệu ứng chuyển động và xuất video.',
  },
  {
    q: 'AI hỗ trợ những định dạng âm thanh nào?',
    a: 'MP3, WAV và M4A đều được hỗ trợ. Nếu bạn đã có sẵn lời bài hát dạng văn bản, hãy dán vào để AI căn lời chính xác hơn.',
  },
  {
    q: 'Video xuất ra được dùng ở đâu?',
    a: 'Bạn chọn tỷ lệ 9:16 cho TikTok, Reels và Shorts, 16:9 cho YouTube, hoặc 1:1 cho Instagram. Video xuất ở dạng MP4 (H.264 + AAC) để đăng trực tiếp lên các nền tảng này.',
  },
  {
    q: 'Tôi có được xuất video không có watermark không?',
    a: 'Bản Pro xuất 1080p không watermark. Gói miễn phí luôn có watermark LyricStudio AI ở góc dưới bên phải của khung hình.',
  },
  {
    q: 'Tệp âm thanh của tôi có được lưu lại không?',
    a: 'Không lưu lâu dài. Tệp chỉ được xử lý tạm để phân tích lời và căn thời gian rồi bị xóa khỏi bộ nhớ xử lý. Bạn nên xóa bản gốc sau khi tạo xong video.',
  },
  {
    q: 'Tôi được dùng nhạc của người khác không?',
    a: 'Chỉ dùng tệp âm thanh mà bạn có quyền sử dụng: bản thu âm của chính bạn, nhạc công cộng, hoặc nhạc có giấy phép. Bạn chịu trách nhiệm về nội dung tải lên, xem Điều khoản sử dụng.',
  },
  {
    q: 'Mỗi ngày được dùng AI bao nhiêu lần?',
    a: 'Gói miễn phí có 3 lượt mỗi ngày, tính lại lúc 00:00 giờ Việt Nam. Gói Pro có 50 lượt mỗi ngày để dùng công cụ AI và xuất video không giới hạn watermark.',
  },
];

export function faqJsonLd(items: FaqItem[] = FAQS): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
```

- [ ] **Step 4: Create src/data/legal.ts**

```ts
export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface LegalPage {
  slug: string;
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

/** `{contactEmail}` is replaced with CONTACT_EMAIL at render time. */
export const LEGAL_PAGES: LegalPage[] = [
  {
    slug: 'privacy',
    title: 'Chính sách bảo mật',
    description: 'Chính sách bảo mật của LyricStudio AI: dữ liệu chúng tôi thu thập, cookie quảng cáo Google AdSense và quyền của bạn.',
    updated: '18/02/2026',
    intro:
      'LyricStudio AI là công cụ tạo lyric video. Chúng tôi thu thập lượng thông tin tối thiểu cần thiết để vận hành công cụ.',
    sections: [
      {
        heading: '1. Thông tin chúng tôi thu thập',
        paragraphs: [
          'Tệp âm thanh bạn tải lên chỉ được xử lý để phân tích lời và căn khớp thời gian, không được lưu trữ lâu dài cho mục đích khác.',
        ],
        list: [
          'Dữ liệu kỹ thuật: loại trình duyệt, thiết bị và địa chỉ IP đã ẩn danh hóa bằng mã băm.',
          'Tài khoản: nếu bạn đăng nhập bằng Google, chúng tôi lưu email, tên và ảnh đại diện của tài khoản Google đó.',
          'Nội dung bạn chủ động gửi: tin nhắn qua trang Liên hệ.',
        ],
      },
      {
        heading: '2. Cách chúng tôi sử dụng thông tin',
        list: [
          'Vận hành và cải thiện công cụ tạo video.',
          'Hiển thị quảng cáo để duy trì dịch vụ miễn phí.',
          'Phản hồi yêu cầu hỗ trợ bạn gửi tới chúng tôi.',
        ],
      },
      {
        heading: '3. Cookie quảng cáo Google AdSense và DoubleClick',
        paragraphs: [
          'Trang web này hiển thị quảng cáo của Google AdSense. Google và các đối tác quảng cáo có thể dùng cookie để phục vụ quảng cáo dựa trên lần truy cập trước đó của bạn vào trang này hoặc các trang khác.',
          'Chúng tôi áp dụng Google Consent Mode v2: cookie quảng cáo chỉ được dùng sau khi bạn bấm "Đồng ý tất cả" trong thông báo cookie.',
        ],
      },
      {
        heading: '4. Cookie của bên thứ ba',
        list: [
          'Google AdSense / DoubleClick: đo lường và cá nhân hóa quảng cáo.',
          'Google Analytics (nếu được bật): thống kê lưu lượng truy cập ẩn danh.',
          'Supabase: lưu trữ tài khoản và trạng thái gói thành viên.',
        ],
      },
      {
        heading: '5. Quyền của bạn',
        list: [
          'Từ chối hoặc rút lại sự đồng ý cookie bất kỳ lúc nào.',
          'Yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân đã cung cấp.',
          'Gửi yêu cầu liên quan quyền riêng tư tới email bên dưới.',
        ],
      },
      {
        heading: '6. Trẻ em',
        paragraphs: [
          'Dịch vụ không hướng tới trẻ em dưới 13 tuổi và chúng tôi không cố ý thu thập dữ liệu cá nhân của trẻ em.',
        ],
      },
      {
        heading: '7. Liên hệ',
        paragraphs: [
          'Mọi yêu cầu về quyền riêng tư, gửi về {contactEmail}.',
        ],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Điều khoản sử dụng',
    description: 'Điều khoản sử dụng LyricStudio AI, gồm quyền về nội dung, bản quyền âm thanh và gói thành viên Pro.',
    updated: '18/02/2026',
    intro:
      'Bằng việc sử dụng LyricStudio AI, bạn đồng ý với các điều khoản dưới đây.',
    sections: [
      {
        heading: '1. Trách nhiệm về nội dung',
        list: [
          'Bạn chỉ được tải lên tệp âm thanh mà bạn có quyền sử dụng.',
          'Bạn chịu trách nhiệm hoàn toàn về bản quyền lời bài hát, bản thu âm và hình ảnh bạn sử dụng.',
          'Chúng tôi có quyền gỡ bỏ nội dung vi phạm hoặc bị khiếu nại bản quyền.',
        ],
      },
      {
        heading: '2. Gói miễn phí và gói Pro',
        list: [
          'Gói miễn phí: 3 lượt xử lý AI mỗi ngày, xuất 720p kèm watermark.',
          'Gói Pro: 50 lượt AI mỗi ngày, xuất 1080p không watermark, không quảng cáo.',
          'Gói Pro không tự động gia hạn. Mỗi lần thanh toán cộng thêm 30 ngày (gói tháng) hoặc 365 ngày (gói năm) kể từ ngày đang còn hiệu lực.',
          'Thanh toán qua PayOS. Thời điểm kích hoạt là khi hệ thống xác nhận giao dịch thành công.',
        ],
      },
      {
        heading: '3. Giới hạn sử dụng',
        paragraphs: [
          'Chúng tôi có thể tạm thời giới hạn số lượt xử lý AI khi hệ thống quá tải để bảo vệ chất lượng dịch vụ chung.',
        ],
      },
      {
        heading: '4. Liên hệ',
        paragraphs: ['Gửi câu hỏi về điều khoản tới {contactEmail}.'],
      },
    ],
  },
  {
    slug: 'about',
    title: 'Giới thiệu về LyricStudio AI',
    description: 'LyricStudio AI là công cụ tạo lyric video bằng trí tuệ nhân tạng dành cho nhà sáng tạo nội dung Việt Nam.',
    updated: '18/02/2026',
    intro:
      'LyricStudio AI biến quy trình làm lyric video — vốn tốn nhiều thời gian và công cụ phức tạp — thành một trải nghiệm nhanh chóng và dễ dùng.',
    sections: [
      {
        heading: 'Chúng tôi giải quyết vấn đề gì',
        paragraphs: [
          'Trước đây, căn lời hát theo từng từ đòi hỏi người làm video gõ mốc thời gian thủ công, mỗi bài mất hàng giờ. LyricStudio AI dùng trí tuệ nhân tạng để nhận diện giọng hát và sinh mốc thời gian ở cấp độ từ trong vài phút.',
        ],
      },
      {
        heading: 'Dành cho ai',
        list: [
          'Nhạc sĩ độc lập cần video lyric nhanh cho bản phát hành.',
          'Kênh nhạc chill, karaoke và nội dung thư giãn.',
          'Người làm nội dung TikTok, Reels và YouTube Shorts cần video dọc 9:16.',
        ],
      },
      {
        heading: 'Cách chúng tôi kiếm tiền',
        paragraphs: [
          'Công cụ có gói miễn phí. Doanh thu đến từ quảng cáo Google AdSense trên trang nội dung và từ gói Pro dành cho người dùng cần chất lượng xuất cao hơn.',
        ],
      },
      {
        heading: 'Liên hệ',
        paragraphs: ['Bạn có thể liên hệ chúng tôi tại {contactEmail}.'],
      },
    ],
  },
  {
    slug: 'contact',
    title: 'Liên hệ',
    description: 'Liên hệ với đội ngũ LyricStudio AI để được hỗ trợ, báo lỗi hoặc hợp tác.',
    updated: '18/02/2026',
    intro: 'Bạn có câu hỏi, góp ý hoặc muốn báo lỗi? Gửi cho chúng tôi, chúng tôi phản hồi trong 2 ngày làm việc.',
    sections: [
      {
        heading: 'Email',
        paragraphs: [
          'Gửi mọi yêu cầu tới {contactEmail}. Khi liên hệ, vui lòng cho biết bạn đang dùng gói miễn phí hay Pro và gặp lỗi ở bước nào.',
        ],
      },
      {
        heading: 'Khiếu nại bản quyền',
        paragraphs: [
          'Nếu bạn là chủ sở hữu nội dung và thấy nội dung của mình bị sử dụng trái phép, gửi thông báo tới {contactEmail} kèm bằng chứng sở hữu. Chúng tôi sẽ phản hồi trong 5 ngày làm việc.',
        ],
      },
    ],
  },
];
```

- [ ] **Step 5: Create src/data/landing.ts**

```ts
export const LANDING = {
  title: 'Tạo lyric video bằng AI — Miễn phí, không cần biết dựng phim',
  description:
    'LyricStudio AI tự động nhận diện lời hát, căn chữ theo từng từ và xuất lyric video 9:16 hoặc 16:9. 3 lượt AI mỗi ngày miễn phí, không cần phần mềm dựng phim.',
  intro:
    'Làm lyric video từng phải mở phần mềm dựng phim, nghe đi nghe lại từng câu và gõ mốc thời gian bằng tay cho cả bài hát. LyricStudio AI làm thay phần việc đó: bạn tải tệp âm thanh lên, AI nghe và tự căn lời theo từng từ, xong bạn chọn phong cách chữ và xuất video để đăng TikTok, Reels hoặc YouTube. Gói miễn phí dùng được ngay, không cần thẻ tín dụng.',
  steps: [
    { title: 'Tải tệp âm thanh', body: 'MP3, WAV hoặc M4A. Nếu có sẵn lời bài hát, dán vào để AI căn chính xác hơn.' },
    { title: 'AI căn lời và chọn phong cách', body: 'AI tạo mốc thời gian theo từ, sau đó bạn chọn font chữ, hiệu ứng chuyển động và màu sắc.' },
    { title: 'Xuất video', body: 'Chọn 9:16 cho TikTok, Reels, Shorts hoặc 16:9 cho YouTube. Xuất MP4 để đăng ngay.' },
  ],
  features: [
    'Tách lời bài hát bằng AI, hỗ trợ tiếng Việt và tiếng Anh.',
    'Căn khớp sóng âm theo từ, bám đúng nhịp hát thay vì chia đều theo giây.',
    'Kinetic typography với nhiều font nghệ thuật và hiệu ứng chuyển động.',
    'Xuất MP4 (H.264 + AAC) tương thích iOS, Android và máy tính.',
    'Chọn tỷ lệ 9:16, 16:9, 1:1 cho mọi nền tảng mạng xã hội.',
  ],
  keywords: [
    'tạo lyric video',
    'lyric video AI',
    'video lời bài hát',
    'kinetic typography',
    'video karaoke',
    'cách làm lyric video 9:16',
  ],
};
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/server/__tests__/content.test.ts`
Expected: PASS — 9 tests.

- [ ] **Step 7: Commit**

```bash
git add src/data/faq.ts src/data/legal.ts src/data/landing.ts src/server/__tests__/content.test.ts
git commit -m "feat: add shared landing, FAQ and legal content modules"
```

---

## Task 4: Server-rendered public pages

**Files:**
- Create: `src/server/pages.ts`
- Test: `src/server/__tests__/pages.test.ts`

**Interfaces:**
- Consumes: `renderShell`, `html`, `escapeHtml` (Task 1); `FAQS`, `faqJsonLd` (Task 3); `LEGAL_PAGES` (Task 3); `LANDING` (Task 3); `BLOG_POSTS` (existing); `loadSiteConfig`.
- Produces:
  - `renderLanding(cfg: SiteConfig): string`
  - `renderBlogIndex(cfg: SiteConfig): string`
  - `renderBlogPost(cfg: SiteConfig, slug: string): string | null`
  - `renderPricing(cfg: SiteConfig): string`
  - `renderFaq(cfg: SiteConfig): string`
  - `renderLegal(cfg: SiteConfig, slug: string): string | null`
  - `renderNotFound(cfg: SiteConfig): string`

Every page must emit an `<h1>`, at least 300 characters of body text, a canonical link, and legal footer links.

- [ ] **Step 1: Write the failing test**

Create `src/server/__tests__/pages.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { loadSiteConfig } from '../siteConfig';
import {
  renderLanding,
  renderBlogIndex,
  renderBlogPost,
  renderPricing,
  renderFaq,
  renderLegal,
  renderNotFound,
} from '../pages';
import { BLOG_POSTS } from '../../data/blogPosts';

const cfg = loadSiteConfig({ APP_URL: 'https://lyric.dev' } as NodeJS.ProcessEnv);

const bodyText = (page: string): string =>
  page
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const PAGES: Array<[string, string]> = [
  ['landing', renderLanding(cfg)],
  ['blog index', renderBlogIndex(cfg)],
  ['pricing', renderPricing(cfg)],
  ['faq', renderFaq(cfg)],
  ['about', renderLegal(cfg, 'about') || ''],
  ['contact', renderLegal(cfg, 'contact') || ''],
  ['privacy', renderLegal(cfg, 'privacy') || ''],
  ['terms', renderLegal(cfg, 'terms') || ''],
  ['404', renderNotFound(cfg)],
  ['blog post', renderBlogPost(cfg, BLOG_POSTS[0].slug) || ''],
];

describe('public pages', () => {
  it.each(PAGES)('%s contains exactly one h1', (_name, page) => {
    expect(page.match(/<h1[\s>]/g) || []).toHaveLength(1);
  });

  it.each(PAGES)('%s has at least 300 characters of text', (_name, page) => {
    expect(bodyText(page).length).toBeGreaterThanOrEqual(300);
  });

  it.each(PAGES)('%s starts with a doctype', (_name, page) => {
    expect(page.startsWith('<!doctype html>')).toBe(true);
  });

  it('links every blog post from the index', () => {
    const index = renderBlogIndex(cfg);
    for (const post of BLOG_POSTS) {
      expect(index).toContain(`/blog/${post.slug}`);
    }
  });

  it('renders the blog post body as an article element', () => {
    const post = renderBlogPost(cfg, BLOG_POSTS[0].slug);
    expect(post).toContain('<article');
    expect(post).toContain(BLOG_POSTS[0].title);
    expect(post).toContain('application/ld+json');
  });

  it('returns null for an unknown slug', () => {
    expect(renderBlogPost(cfg, 'khong-ton-tai')).toBeNull();
    expect(renderLegal(cfg, 'khong-ton-tai')).toBeNull();
  });

  it('substitutes the contact email in legal pages', () => {
    const privacy = renderLegal(cfg, 'privacy');
    expect(privacy).not.toContain('{contactEmail}');
    expect(privacy).not.toMatch(/example\.com/);
  });

  it('shows both plan prices on the pricing page', () => {
    const pricing = renderPricing(cfg);
    expect(pricing).toContain('79.000');
    expect(pricing).toContain('790.000');
    expect(pricing).toContain('/account');
  });

  it('points the landing CTA at the studio', () => {
    expect(renderLanding(cfg)).toContain('href="/studio"');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/server/__tests__/pages.test.ts`
Expected: FAIL — cannot resolve `../pages`.

- [ ] **Step 3: Implement src/server/pages.ts**

Create `src/server/pages.ts`:

```ts
import { escapeHtml, html, renderShell } from './html';
import type { SiteConfig } from './siteConfig';
import { BLOG_POSTS, type BlogPost } from '../data/blogPosts';
import { FAQS, faqJsonLd } from '../data/faq';
import { LEGAL_PAGES } from '../data/legal';
import { LANDING } from '../data/landing';

const canon = (cfg: SiteConfig, path: string): string => `${cfg.appUrl}${path === '/' ? '' : path}`;

const proseClass = 'space-y-4 text-sm sm:text-[15px] text-zinc-300 leading-7';

function articleBlocks(post: BlogPost): string {
  return post.blocks
    .map((block) => {
      if (block.type === 'heading') return `<h2 class="text-xl font-bold text-white mt-8">${escapeHtml(block.text)}</h2>`;
      if (block.type === 'list') {
        const items = (block.items || [])
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('');
        return `<ul class="list-disc pl-5 space-y-2">${items}</ul>`;
      }
      return `<p>${escapeHtml(block.text)}</p>`;
    })
    .join('');
}

export function renderLanding(cfg: SiteConfig): string {
  const body = html`
    <section class="space-y-6">
      <h1 class="text-3xl sm:text-4xl font-extrabold text-white leading-tight">${LANDING.title}</h1>
      <p class="${proseClass}">${LANDING.intro}</p>
      <p><a class="cta" href="/studio">Mở Studio tạo video</a></p>
    </section>

    <section class="mt-12">
      <h2 class="text-2xl font-bold text-white">Ba bước để có lyric video</h2>
      <ol class="mt-4 space-y-4">
        ${LANDING.steps.map(
          (s, i) => html`<li><strong>${i + 1}. ${s.title}</strong> — ${s.body}</li>`,
        )}
      </ol>
    </section>

    <section class="mt-12">
      <h2 class="text-2xl font-bold text-white">Tính năng nổi bật</h2>
      <ul class="mt-4 list-disc pl-5 space-y-2">
        ${LANDING.features.map((f) => html`<li>${f}</li>`)}
      </ul>
    </section>

    <section class="mt-12 grid gap-4 sm:grid-cols-2">
      <div class="plan-card">
        <h3>Gói miễn phí</h3>
        <p>3 lượt AI mỗi ngày, xuất 720p có watermark, có quảng cáo.</p>
      </div>
      <div class="plan-card">
        <h3>Gói Pro</h3>
        <p>50 lượt AI mỗi ngày, xuất 1080p không watermark, không quảng cáo.</p>
      </div>
    </section>
    <p><a href="/pricing">Xem bảng giá đầy đủ</a></p>

    <section class="mt-12">
      <h2 class="text-2xl font-bold text-white">Câu hỏi thường gặp</h2>
      ${FAQS.map(
        (f) => html`
          <article class="mt-4">
            <h3 class="font-bold text-white">${f.q}</h3>
            <p class="mt-1 ${proseClass}">${f.a}</p>
          </article>
        `,
      )}
    </section>

    <section class="mt-12">
      <h2 class="text-2xl font-bold text-white">Hướng dẫn chi tiết</h2>
      <p class="${proseClass}">
        Đọc các bài hướng dẫn trong
        <a href="/blog">blog của LyricStudio AI</a> để biết cách chọn font chữ, căn mốc thời gian
        và xuất video đúng tỷ lệ cho từng nền tảng.
      </p>
    </section>
  `;
  return renderShell({
    title: `${LANDING.title} | LyricStudio AI`,
    description: LANDING.description,
    canonical: canon(cfg, '/'),
    body,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'LyricStudio AI',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
      },
      faqJsonLd(),
    ],
  });
}

export function renderBlogIndex(cfg: SiteConfig): string {
  const body = html`
    <h1 class="text-3xl font-extrabold text-white">Blog hướng dẫn làm lyric video</h1>
    <p class="${proseClass}">
      Các bài hướng dẫn chi tiết về cách căn lời hát theo từ, chọn font chữ hiệu ứng, xuất video 9:16
      cho TikTok và xử lý bản quyền khi làm lyric video.
    </p>
    <ul class="mt-8 space-y-6">
      ${BLOG_POSTS.map(
        (post) => html`
          <li>
            <article>
              <h2 class="text-xl font-bold text-white">
                <a href="/blog/${post.slug}">${post.title}</a>
              </h2>
              <p class="mt-1 ${proseClass}">${post.description}</p>
              <p class="mt-1 text-xs text-zinc-500">${post.date} · ${post.readingMinutes} phút đọc</p>
            </article>
          </li>
        `,
      )}
    </ul>
  `;
  return renderShell({
    title: 'Blog hướng dẫn làm lyric video | LyricStudio AI',
    description:
      'Hướng dẫn làm lyric video bằng AI: căn lời theo từ, chọn kinetic typography, xuất video 9:16 và xử lý bản quyền.',
    canonical: canon(cfg, '/blog'),
    body,
  });
}

export function renderBlogPost(cfg: SiteConfig, slug: string): string | null {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return null;
  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);
  const faqLd = post.faqs?.length ? [faqJsonLd(post.faqs)] : [];
  const body = html`
    <article>
      <p><a href="/blog">← Về blog</a></p>
      <h1 class="mt-3 text-3xl font-extrabold text-white leading-tight">${post.title}</h1>
      <p class="mt-2 ${proseClass}">${post.description}</p>
      <p class="mt-1 text-xs text-zinc-500">${post.author} · ${post.date} · ${post.readingMinutes} phút đọc</p>
      <div class="mt-8 ${proseClass}">${articleBlocks(post)}</div>
    </article>

    ${post.faqs?.length ? html`
      <section class="mt-12">
        <h2 class="text-2xl font-bold text-white">Câu hỏi thường gặp</h2>
        ${post.faqs.map(
          (f) => html`
            <article class="mt-4">
              <h3 class="font-bold text-white">${f.q}</h3>
              <p class="mt-1 ${proseClass}">${f.a}</p>
            </article>
          `,
        )}
      </section>
    ` : ''}

    <section class="mt-12">
      <h2 class="text-2xl font-bold text-white">Bài liên quan</h2>
      <ul class="mt-4 space-y-2">
        ${related.map((p) => html`<li><a href="/blog/${p.slug}">${p.title}</a></li>`)}
      </ul>
    </section>

    <p class="mt-10"><a class="cta" href="/studio">Mở Studio tạo video miễn phí</a></p>
  `;
  return renderShell({
    title: `${post.title} | LyricStudio AI`,
    description: post.description,
    canonical: canon(cfg, `/blog/${post.slug}`),
    body,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.date,
        author: { '@type': 'Organization', name: post.author },
        publisher: { '@type': 'Organization', name: 'LyricStudio AI' },
        inLanguage: 'vi-VN',
      },
      ...faqLd,
    ],
  });
}

export function renderPricing(cfg: SiteConfig): string {
  const body = html`
    <h1 class="text-3xl font-extrabold text-white">Bảng giá LyricStudio AI</h1>
    <p class="${proseClass}">
      Gói miễn phí dùng để thử công cụ. Gói Pro dành cho người làm video thường xuyên cần xuất
      không watermark, không quảng cáo và hạn mức AI cao hơn. Thanh toán qua PayOS, mỗi lần thanh
      toán cộng thêm thời gian sử dụng.
    </p>
    <div class="mt-8 grid gap-6 sm:grid-cols-2">
      <section class="plan-card">
        <h2>Gói miễn phí</h2>
        <p class="text-2xl font-extrabold text-white">0 đ</p>
        <ul class="mt-4 list-disc pl-5 space-y-2">
          <li>3 lượt xử lý AI mỗi ngày</li>
          <li>Xuất video 720p có watermark</li>
          <li>Có quảng cáo để duy trì dịch vụ</li>
          <li>Dùng ngay, không cần đăng nhập</li>
        </ul>
      </section>
      <section class="plan-card">
        <h2>Gói Pro tháng</h2>
        <p class="text-2xl font-extrabold text-white">79.000 đ / tháng</p>
        <ul class="mt-4 list-disc pl-5 space-y-2">
          <li>50 lượt xử lý AI mỗi ngày</li>
          <li>Xuất video 1080p không watermark</li>
          <li>Không quảng cáo</li>
          <li>Cộng thêm 30 ngày mỗi lần thanh toán</li>
        </ul>
      </section>
      <section class="plan-card">
        <h2>Gói Pro năm</h2>
        <p class="text-2xl font-extrabold text-white">790.000 đ / năm</p>
        <ul class="mt-4 list-disc pl-5 space-y-2">
          <li>Đầy đủ tính năng gói Pro tháng</li>
          <li>Cộng thêm 365 ngày mỗi lần thanh toán</li>
          <li>Tiết kiệm so với trả theo tháng</li>
        </ul>
      </section>
    </div>
    <p class="mt-8">
      <a class="cta" href="/account">Đăng nhập để nâng cấp Pro</a>
    </p>
    <p class="mt-4 ${proseClass}">
      Gói Pro không tự động gia hạn. Khi hết thời hạn, tài khoản trở về gói miễn phí và quảng cáo
      hiển thị trở lại.
    </p>
  `;
  return renderShell({
    title: 'Bảng giá | LyricStudio AI',
    description:
      'Gói miễn phí 3 lượt AI mỗi ngày. Gói Pro 79.000đ mỗi tháng hoặc 790.000đ mỗi năm: 1080p không watermark, không quảng cáo.',
    canonical: canon(cfg, '/pricing'),
    body,
  });
}

export function renderFaq(cfg: SiteConfig): string {
  const body = html`
    <h1 class="text-3xl font-extrabold text-white">Câu hỏi thường gặp về LyricStudio AI</h1>
    <p class="${proseClass}">
      Giải đáp các câu hỏi về cách dùng, giới hạn gói miễn phí, định dạng âm thanh và bản quyền.
    </p>
    ${FAQS.map(
      (f) => html`
        <article class="mt-6">
          <h2 class="text-xl font-bold text-white">${f.q}</h2>
          <p class="mt-2 ${proseClass}">${f.a}</p>
        </article>
      `,
    )}
    <p class="mt-10 ${proseClass}">
      Không tìm thấy câu trả lời? <a href="/contact">Gửi câu hỏi cho chúng tôi</a>.
    </p>
  `;
  return renderShell({
    title: 'Câu hỏi thường gặp | LyricStudio AI',
    description: 'Câu hỏi thường gặp về LyricStudio AI: gói miễn phí, định dạng âm thanh, xuất video và bản quyền.',
    canonical: canon(cfg, '/faq'),
    body,
    jsonLd: [faqJsonLd()],
  });
}

export function renderLegal(cfg: SiteConfig, slug: string): string | null {
  const page = LEGAL_PAGES.find((p) => p.slug === slug);
  if (!page) return null;
  const resolve = (text: string): string => text.replace(/\{contactEmail\}/g, cfg.contactEmail);
  const body = html`
    <h1 class="text-3xl font-extrabold text-white">${page.title}</h1>
    <p class="mt-1 text-xs text-zinc-500">Cập nhật lần cuối: ${page.updated}</p>
    <p class="mt-4 ${proseClass}">${resolve(page.intro)}</p>
    ${page.sections.map(
      (section) => html`
        <section class="mt-6">
          <h2 class="text-xl font-bold text-white">${section.heading}</h2>
          ${(section.paragraphs || []).map((p) => html`<p class="mt-2 ${proseClass}">${resolve(p)}</p>`)}
          ${section.list
            ? html`<ul class="mt-2 list-disc pl-5 space-y-2">
                ${section.list.map((item) => html`<li>${resolve(item)}</li>`)}
              </ul>`
            : ''}
        </section>
      `,
    )}
    <p class="mt-10 ${proseClass}">
      Liên hệ: <a href="mailto:${cfg.contactEmail}">${cfg.contactEmail}</a>
    </p>
  `;
  return renderShell({
    title: `${page.title} | LyricStudio AI`,
    description: page.description,
    canonical: canon(cfg, `/${page.slug}`),
    body,
  });
}

export function renderNotFound(cfg: SiteConfig): string {
  const body = html`
    <h1 class="text-3xl font-extrabold text-white">Không tìm thấy trang</h1>
    <p class="${proseClass}">
      Đường dẫn bạn mở không tồn tại hoặc đã được chuyển đi. Bạn có thể quay lại trang chủ để tạo
      lyric video, hoặc đọc các bài hướng dẫn trong blog.
    </p>
    <p><a class="cta" href="/studio">Mở Studio</a></p>
    <p class="mt-2"><a href="/blog">Đọc blog hướng dẫn</a></p>
  `;
  return renderShell({
    title: 'Không tìm thấy trang | LyricStudio AI',
    description: 'Trang bạn tìm không tồn tại trên LyricStudio AI.',
    canonical: canon(cfg, '/404'),
    body,
    robots: 'noindex,follow',
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/server/__tests__/pages.test.ts`
Expected: PASS — 36 tests (10 pages × 3 checks + 6 specific).

- [ ] **Step 5: Commit**

```bash
git add src/server/pages.ts src/server/__tests__/pages.test.ts
git commit -m "feat: server-render landing, blog, pricing, FAQ and legal pages"
```

---

## Task 5: Wire routes, SPA split, drop the React public pages

**Files:**
- Modify: `server.ts` (replace `startServer` static serving with ordered routes)
- Modify: `src/AppRouter.tsx` (SPA serves only studio and account)
- Modify: `src/main.tsx` (only mount the router for SPA routes)
- Delete: `src/pages/BlogIndexPage.tsx`, `src/pages/BlogPostPage.tsx`, `src/pages/AboutPage.tsx`, `src/pages/ContactPage.tsx`, `src/pages/PrivacyPage.tsx`, `src/pages/TermsPage.tsx`, `src/pages/FaqPage.tsx`, `src/pages/NotFoundPage.tsx`, `src/components/Breadcrumbs.tsx`, `src/components/layout/PublicLayout.tsx`, `src/components/layout/SiteHeader.tsx`, `src/components/layout/SiteFooter.tsx`, `src/utils/seo.tsx`, `src/utils/premium.ts`

**Interfaces:**
- Consumes: `renderAdsTxt`, `renderRobotsTxt`, `renderSitemap`, `renderConfigJs` (Task 2); page renderers (Task 4).
- Produces: Express route order — API/webhook → seo files → HTML pages → static dist → `/studio` + `/account` SPA shell → HTML 404.

- [ ] **Step 1: Add the SEO file routes and public page routes to server.ts**

Replace the `startServer` function in `server.ts` with this structure, keeping every existing `/api/*` handler above it untouched:

```ts
import { loadSiteConfig } from './src/server/siteConfig';
import { renderAdsTxt, renderRobotsTxt, renderSitemap, renderConfigJs } from './src/server/seoFiles';
import {
  renderLanding,
  renderBlogIndex,
  renderBlogPost,
  renderPricing,
  renderFaq,
  renderLegal,
  renderNotFound,
} from './src/server/pages';

const siteCfg = loadSiteConfig();

const sendHtml = (res: express.Response, html: string, status = 200) =>
  res.status(status).type('html').send(html);

// --- SEO / monetization files (must precede static serving) ---
app.get('/ads.txt', (_req, res) => {
  const body = renderAdsTxt(siteCfg);
  res.type('text/plain').send(body);
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(renderRobotsTxt(siteCfg));
});

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').send(renderSitemap(siteCfg));
});

app.get('/config.js', (_req, res) => {
  res
    .set('Cache-Control', 'private, max-age=60')
    .type('application/javascript')
    .send(renderConfigJs(siteCfg));
});

// --- Server-rendered public content pages ---
app.get('/', (_req, res) => sendHtml(res, renderLanding(siteCfg)));
app.get('/blog', (_req, res) => sendHtml(res, renderBlogIndex(siteCfg)));
app.get('/blog/:slug', (req, res) => {
  const page = renderBlogPost(siteCfg, req.params.slug);
  return page ? sendHtml(res, page) : sendHtml(res, renderNotFound(siteCfg), 404);
});
app.get('/pricing', (_req, res) => sendHtml(res, renderPricing(siteCfg)));
app.get('/faq', (_req, res) => sendHtml(res, renderFaq(siteCfg)));
for (const slug of ['about', 'contact', 'privacy', 'terms']) {
  app.get(`/${slug}`, (_req, res) => {
    const page = renderLegal(siteCfg, slug);
    return page ? sendHtml(res, page) : sendHtml(res, renderNotFound(siteCfg), 404);
  });
}
```

- [ ] **Step 2: Replace the static serving block**

Inside `startServer`, replace the `isProd` branch with:

```ts
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, watch: null },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath, { index: false, maxAge: '1h' }));

    // Only the studio and the account page need the React bundle.
    const spaShell = (req: express.Request, res: express.Response) =>
      res.sendFile(path.join(distPath, 'index.html'));

    app.get('/studio', spaShell);
    app.get('/account', spaShell);

    app.get('*', (_req, res) => sendHtml(res, renderNotFound(siteCfg), 404));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LyricStudio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
```

- [ ] **Step 3: Reduce the SPA router to studio and account**

Rewrite `src/AppRouter.tsx` so no public page component remains:

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CookieConsent } from './components/CookieConsent';
import { StudioPage } from './pages/StudioPage';
import { AccountPage } from './pages/AccountPage';

/**
 * The React bundle only serves the studio and the account area.
 * Every public page is server-rendered HTML (see src/server/pages.ts).
 */
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/" element={<StudioPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  );
};
```

- [ ] **Step 4: Delete the replaced React pages and helpers**

Run:

```bash
git rm src/pages/BlogIndexPage.tsx src/pages/BlogPostPage.tsx src/pages/AboutPage.tsx src/pages/ContactPage.tsx src/pages/PrivacyPage.tsx src/pages/TermsPage.tsx src/pages/FaqPage.tsx src/pages/NotFoundPage.tsx src/components/Breadcrumbs.tsx src/components/layout/PublicLayout.tsx src/components/layout/SiteHeader.tsx src/components/layout/SiteFooter.tsx src/utils/seo.tsx src/utils/premium.ts
```

`src/pages/StudioPage.tsx` currently imports `Seo` from `../utils/seo`, so reduce it to the studio shell in the next step's edit. `src/components/SeoArticlesSection.tsx` must keep importing only from `../data/blogPosts`.

- [ ] **Step 5: Replace StudioPage with a plain shell**

Overwrite `src/pages/StudioPage.tsx`:

```tsx
import React from 'react';
import Studio from '../App';

export const StudioPage: React.FC = () => <Studio />;
```

- [ ] **Step 6: Fix StudioPage's Seo import users**

Run: `npx tsc --noEmit`
Expected: errors listing remaining imports of `../utils/seo`, `premium`, `Breadcrumbs`, or deleted layout components.

Fix each remaining importer so `tsc --noEmit` is clean. The only expected importer is the studio's own metadata, which moves to `src/App.tsx`'s static `index.html` copy — remove those `Seo` usages rather than reintroducing the module.

- [ ] **Step 7: Verify production output**

Run: `npm run build`
Expected: build succeeds and `dist/index.html` exists.

Run: `npx cross-env NODE_ENV=production PORT=3100 node server.js` in the background, then `curl -s localhost:3100/ | Select-String "<h1"` and `curl -s localhost:3100/blog | Select-String "<h1"`.
Expected: both print an `<h1>` line.

Stop the background server afterwards.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: serve public pages as HTML and keep studio on /studio"
```

---

## Task 6: Production ad behaviour and the SEO crawl check

**Files:**
- Modify: `src/components/AdSenseSlot.tsx`
- Modify: `src/index.css` (add component classes used by server templates)
- Create: `scripts/check-seo.ts`
- Modify: `package.json` (`check:seo` script)

**Interfaces:**
- Consumes: page renderers (Task 4), `SiteConfig` (Task 1).
- Produces: `check:seo.ts` exits non-zero with a list of failures; exits 0 when every assertion passes.

- [ ] **Step 1: Remove the placeholder in production and read the plan from /api/me**

In `src/components/AdSenseSlot.tsx`, add the plan import at the top and read it from the app config channel the studio already uses:

```tsx
import { getAppConfig, isAdSenseConfigured, refreshAppConfig } from '../utils/appConfig';
import { getViewerPlan } from '../utils/viewer';
```

Replace the final placeholder block (from the `// Not configured yet` comment to the end of the returned JSX) with a block that keeps `sizeClasses` for the dev-only placeholder:

```tsx
  // Development only: keep an educational placeholder so layout stays stable.
  if (!import.meta.env.PROD) {
    return (
      <div className={`relative rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3 text-center ${sizeClasses[format]} ${className}`}>
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
          Khu Vực Quảng Cáo Google AdSense
        </span>
      </div>
    );
  }

  return null;
```

Move the `sizeClasses` object above this block so it stays declared:

Then gate the live unit on the plan, replacing the `shouldServeAd` line:

```tsx
const plan = getViewerPlan();
const shouldServeAd =
  configured && consented && plan === 'free' && Boolean(resolvedSlot);
```

- [ ] **Step 2: Add the viewer plan module**

Create `src/utils/viewer.ts`:

```ts
import { getSession } from '@supabase/supabase-js';

const PLAN_EVENT = 'viewer-plan-change';

let cachedPlan: 'free' | 'pro' = 'free';

export function getViewerPlan(): 'free' | 'pro' {
  return cachedPlan;
}

export function setViewerPlan(plan: 'free' | 'pro'): void {
  if (cachedPlan === plan) return;
  cachedPlan = plan;
  window.dispatchEvent(new CustomEvent<string>(PLAN_EVENT, { detail: plan }));
}

export function onViewerPlanChange(cb: (plan: 'free' | 'pro') => void): () => void {
  const handler = () => cb(cachedPlan);
  window.addEventListener(PLAN_EVENT, handler);
  return () => window.removeEventListener(PLAN_EVENT, handler);
}

/** Load /api/me once and cache the resulting plan. Safe to call from any page. */
export async function refreshViewerPlan(): Promise<'free' | 'pro'> {
  try {
    const session = await getSession();
    const res = await fetch('/api/me', {
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    if (!res.ok) return cachedPlan;
    const data = await res.json();
    setViewerPlan(data.plan === 'pro' ? 'pro' : 'free');
    return cachedPlan;
  } catch {
    return cachedPlan;
  }
}
```

- [ ] **Step 3: Style the server template classes**

Append to `src/index.css`:

```css
@layer components {
  .nav { @apply flex flex-wrap gap-4 px-4 py-3 border-b border-zinc-800 text-sm; }
  .nav a { @apply text-zinc-300 hover:text-rose-400; }
  .site-footer { @apply border-t border-zinc-800 px-4 py-8 text-xs text-zinc-500 space-y-1; }
  .site-footer a { @apply text-zinc-300 hover:text-rose-400; }
  .cta { @apply inline-flex items-center rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-2.5 text-sm font-bold text-white; }
  .plan-card { @apply rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-300; }
  .plan-card h2, .plan-card h3 { @apply text-lg font-bold text-white mb-2; }
  .adsense-container { @apply overflow-hidden flex justify-center; }
}
```

- [ ] **Step 4: Add the Supabase browser client**

Create `src/utils/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const url = (import.meta as unknown as { env?: Record<string, string> }).env
  .VITE_SUPABASE_URL;
const anonKey = (import.meta as unknown as { env?: Record<string, string> }).env
  .VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
```

Then update `src/utils/viewer.ts` to import `getSession` from that module:

```ts
import { supabase } from './supabase';

export async function refreshViewerPlan(): Promise<'free' | 'pro'> {
  try {
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const token = data.session?.access_token;
    ...
```

- [ ] **Step 5: Write the crawl check script**

Create `scripts/check-seo.ts`:

```ts
import { loadSiteConfig } from '../src/server/siteConfig';

const base = process.env.CHECK_BASE_URL || 'http://localhost:3100';
const failures: string[] = [];

const get = async (path: string) => {
  const res = await fetch(`${base}${path}`);
  return { status: res.status, type: res.headers.get('content-type') || '', text: await res.text() };
};

const textOf = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const check = (ok: boolean, message: string) => {
  if (!ok) failures.push(message);
};

const PUBLIC_PATHS = ['/', '/blog', '/pricing', '/faq', '/about', '/contact', '/privacy', '/terms'];

const run = async () => {
  for (const path of PUBLIC_PATHS) {
    const { status, type, text } = await get(path);
    check(status === 200, `${path} returned ${status}, expected 200`);
    check(type.includes('text/html'), `${path} content-type is ${type}`);
    check(/<h1[\s>]/i.test(text), `${path} has no <h1>`);
    check(textOf(text).length >= 300, `${path} has less than 300 characters of text`);
    check(/<link rel="canonical"/i.test(text), `${path} has no canonical link`);
  }

  const firstPost = '/blog/cach-lam-lyric-video-mien-phi';
  const post = await get(firstPost);
  check(post.status === 200, `${firstPost} returned ${post.status}`);
  check(/<article/i.test(post.text), `${firstPost} has no <article> element`);

  const ads = await get('/ads.txt');
  const cfg = loadSiteConfig();
  if (cfg.hasAdsense) {
    check(
      /^google\.com, pub-\d+, DIRECT, f08c47fec0942fa0$/m.test(ads.text.trim()),
      'ads.txt is not the canonical single line',
    );
  } else {
    check(ads.text.trim() === '', 'ads.txt must be empty without a publisher id');
  }

  const robots = await get('/robots.txt');
  check(robots.text.includes('Disallow: /account'), 'robots.txt must disallow /account');
  check(robots.text.includes('Sitemap:'), 'robots.txt must advertise the sitemap');

  const sitemap = await get('/sitemap.xml');
  check(sitemap.text.includes('<loc>'), 'sitemap.xml has no <loc> entries');
  check(sitemap.text.includes('/studio'), 'sitemap.xml is missing /studio');
  check(sitemap.text.includes(firstPost), `sitemap.xml is missing ${firstPost}`);

  for (const path of [...PUBLIC_PATHS, '/ads.txt', '/robots.txt', '/sitemap.xml', '/config.js']) {
    const { text } = await get(path);
    check(!text.includes('Khu Vực Quảng Cáo'), `${path} ships the ad placeholder string`);
  }

  if (failures.length > 0) {
    console.error(`check:seo failed with ${failures.length} problem(s):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('check:seo passed');
};

run().catch((err) => {
  console.error('check:seo crashed:', err);
  process.exit(1);
});
```

- [ ] **Step 6: Run the crawl check against a production build**

Run, in this order:

```bash
npm run build
npx cross-env NODE_ENV=production PORT=3100 node server.js
CHECK_BASE_URL=http://localhost:3100 npx tsx scripts/check-seo.ts
```

Expected: `check:seo passed`.

Stop the background server.

- [ ] **Step 7: Commit**

```bash
git add src/components/AdSenseSlot.tsx src/utils/viewer.ts src/utils/supabase.ts src/index.css scripts/check-seo.ts package.json
git commit -m "feat: production ad gating and SEO crawl check"
```

---

## Task 7: Plan, quota and day-boundary math

**Files:**
- Create: `src/server/quota.ts`
- Test: `src/server/__tests__/quota.test.ts`

**Interfaces:**
- Produces:
  - `export type Plan = 'free' | 'pro'`
  - `AI_LIMIT_FREE = 3`, `AI_LIMIT_PRO = 50`
  - `resolvePlan(proUntil: string | null, now?: Date): Plan`
  - `aiLimit(plan: Plan): number`
  - `dayKey(now?: Date): string`
  - `quotaError(plan: Plan, used: number, limit: number, loggedIn: boolean): { status: number; body: Record<string, unknown> }`

- [ ] **Step 1: Write the failing test**

Create `src/server/__tests__/quota.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  resolvePlan,
  aiLimit,
  dayKey,
  quotaError,
  AI_LIMIT_FREE,
  AI_LIMIT_PRO,
} from '../quota';

describe('resolvePlan', () => {
  const now = new Date('2026-10-03T12:00:00Z');

  it('returns free when there is no expiry', () => {
    expect(resolvePlan(null, now)).toBe('free');
  });

  it('returns free when the expiry is in the past', () => {
    expect(resolvePlan('2026-10-01T00:00:00Z', now)).toBe('free');
  });

  it('returns pro when the expiry is in the future', () => {
    expect(resolvePlan('2026-10-10T00:00:00Z', now)).toBe('pro');
  });

  it('treats exactly-now as expired', () => {
    expect(resolvePlan(now.toISOString(), now)).toBe('free');
  });

  it('treats an unparsable value as free', () => {
    expect(resolvePlan('khong-hop-le', now)).toBe('free');
  });
});

describe('aiLimit', () => {
  it('maps plans to their documented limits', () => {
    expect(aiLimit('free')).toBe(AI_LIMIT_FREE);
    expect(aiLimit('pro')).toBe(AI_LIMIT_PRO);
    expect(AI_LIMIT_FREE).toBe(3);
    expect(AI_LIMIT_PRO).toBe(50);
  });
});

describe('dayKey', () => {
  it('uses the Asia/Ho_Chi_Minh calendar day', () => {
    // 2026-10-03T17:30:00Z is already 2026-10-04 in UTC+7.
    expect(dayKey(new Date('2026-10-03T17:30:00Z'))).toBe('2026-10-04');
  });

  it('keeps UTC+7 midnight inside the previous UTC day correctly', () => {
    expect(dayKey(new Date('2026-10-03T16:59:00Z'))).toBe('2026-10-04');
    expect(dayKey(new Date('2026-10-03T16:00:00Z'))).toBe('2026-10-03');
  });
});

describe('quotaError', () => {
  it('offers an upgrade to a logged-in free user', () => {
    const res = quotaError('free', 4, 3, true);
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('AI_LIMIT_FREE');
    expect(res.body.upgrade).toBe(true);
    expect(res.body.limit).toBe(3);
  });

  it('does not offer an upgrade to an anonymous visitor', () => {
    const res = quotaError('free', 4, 3, false);
    expect(res.body.code).toBe('AI_LIMIT_FREE');
    expect(res.body.upgrade).toBe(false);
  });

  it('reports the fair-use cap for pro users', () => {
    const res = quotaError('pro', 51, 50, true);
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('AI_LIMIT_PRO');
    expect(res.body.limit).toBe(50);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/server/__tests__/quota.test.ts`
Expected: FAIL — cannot resolve `../quota`.

- [ ] **Step 3: Implement src/server/quota.ts**

```ts
export type Plan = 'free' | 'pro';

export const AI_LIMIT_FREE = 3;
export const AI_LIMIT_PRO = 50;

export function resolvePlan(proUntil: string | null, now: Date = new Date()): Plan {
  if (!proUntil) return 'free';
  const ts = Date.parse(proUntil);
  if (Number.isNaN(ts)) return 'free';
  return ts > now.getTime() ? 'pro' : 'free';
}

export function aiLimit(plan: Plan): number {
  return plan === 'pro' ? AI_LIMIT_PRO : AI_LIMIT_FREE;
}

/** Calendar day in Asia/Ho_Chi_Minh as YYYY-MM-DD. */
export function dayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function quotaError(
  plan: Plan,
  used: number,
  limit: number,
  loggedIn: boolean,
): { status: number; body: Record<string, unknown> } {
  return {
    status: 429,
    body:
      plan === 'pro'
        ? { code: 'AI_LIMIT_PRO', used, limit, message: 'Bạn đã dùng hết lượt AI hôm nay. Hãy thử lại ngày mai.' }
        : {
            code: 'AI_LIMIT_FREE',
            used,
            limit,
            upgrade: loggedIn,
            message: 'Bạn đã dùng hết 3 lượt AI miễn phí hôm nay.',
          },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/server/__tests__/quota.test.ts`
Expected: PASS — 11 tests.

- [ ] **Step 5: Commit**

```bash
git add src/server/quota.ts src/server/__tests__/quota.test.ts
git commit -m "feat: add pure plan and quota math with day boundary"
```

---

## Task 8: Supabase schema, identity and quota enforcement

**Files:**
- Create: `supabase/migrations/0001_auth_profiles.sql`
- Create: `supabase/migrations/0002_usage_daily.sql`
- Create: `supabase/migrations/0003_payments.sql`
- Create: `src/server/db.ts`
- Create: `src/server/identity.ts`
- Create: `src/server/routes/api.ts`
- Modify: `server.ts` (mount `/api/me`, `/api/payments`, wrap AI routes with quota)

**Interfaces:**
- Consumes: `resolvePlan`, `aiLimit`, `dayKey`, `quotaError`, `loadSiteConfig` (Task 7, Task 1).
- Produces:
  - `db.ts`: `getAdmin(): SupabaseClient` (throws when service role is unset), `getProfile(userId)`, `getUsage(userId, ipHash, day)`, `incrementUsage(...)`, `getPayments(userId)`
  - `identity.ts`: `hashIp(ip, salt): string`, `resolveIdentity(req): Promise<Identity>` where `Identity = { userId: string | null; ipHash: string | null; email: string | null; name: string | null; avatar: string | null }`
  - `routes/api.ts`: `mountApiRoutes(app: Express, cfg: SiteConfig): void` mounting `GET /api/me`, `GET /api/payments`, `POST /api/usage/consume`

- [ ] **Step 1: Write the migrations**

Create `supabase/migrations/0001_auth_profiles.sql`:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free','pro')),
  pro_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_new_user();
```

Create `supabase/migrations/0002_usage_daily.sql`:

```sql
create table if not exists public.usage_daily (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  ip_hash text,
  day date not null,
  ai_count int not null default 0,
  constraint usage_user_day unique (user_id, day),
  constraint usage_ip_day unique (ip_hash, day),
  constraint usage_has_owner check (user_id is not null or ip_hash is not null)
);

alter table public.usage_daily enable row level security;

create policy "read own usage" on public.usage_daily
  for select using (auth.uid() = user_id);
```

Create `supabase/migrations/0003_payments.sql`:

```sql
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  payos_order_code bigint not null unique,
  amount int not null check (amount in (79000, 790000)),
  plan_kind text not null check (plan_kind in ('monthly','yearly')),
  status text not null default 'pending' check (status in ('pending','paid','cancelled','expired')),
  paid_at timestamptz,
  raw_webhook jsonb,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "read own payments" on public.payments
  for select using (auth.uid() = user_id);
```

- [ ] **Step 2: Write the failing identity test**

Create `src/server/__tests__/identity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { hashIp } from '../identity';

describe('hashIp', () => {
  it('is stable for the same ip and salt', () => {
    expect(hashIp('1.2.3.4', 'salt')).toBe(hashIp('1.2.3.4', 'salt'));
  });

  it('changes when the salt changes', () => {
    expect(hashIp('1.2.3.4', 'a')).not.toBe(hashIp('1.2.3.4', 'b'));
  });

  it('does not leak the raw ip', () => {
    expect(hashIp('1.2.3.4', 'salt')).not.toContain('1.2.3.4');
  });

  it('returns empty string when there is no salt configured', () => {
    expect(hashIp('1.2.3.4', '')).toBe('');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/server/__tests__/identity.test.ts`
Expected: FAIL — cannot resolve `../identity`.

- [ ] **Step 4: Install the Supabase server dependency**

Run: `npm install @supabase/supabase-js`

- [ ] **Step 5: Implement src/server/db.ts**

Create `src/server/db.ts`:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { dayKey } from './quota';

let admin: SupabaseClient | null = null;

export function getAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  admin = createClient(url, key, { auth: { persistSession: false } });
  return admin;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro';
  pro_until: string | null;
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await getAdmin()
    .from('profiles')
    .select('id, email, display_name, avatar_url, plan, pro_until')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileRow) ?? null;
}

export async function getUsageCount(
  userId: string | null,
  ipHash: string | null,
  day: string = dayKey(),
): Promise<number> {
  let query = getAdmin().from('usage_daily').select('ai_count').eq('day', day);
  query = userId ? query.eq('user_id', userId) : query.eq('ip_hash', ipHash ?? '');
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? Number(data.ai_count) || 0 : 0;
}

/**
 * Atomically increment today's counter. Postgres unique constraints make
 * concurrent inserts collide instead of losing a count.
 */
/**
 * Atomically increment today's counter through a Postgres function, so
 * concurrent requests cannot lose a count to a read-then-write race.
 */
export async function incrementUsage(
  userId: string | null,
  ipHash: string | null,
  day: string = dayKey(),
): Promise<number> {
  const { data, error } = await getAdmin().rpc('increment_ai_usage', {
    p_user_id: userId,
    p_ip_hash: userId ? null : ipHash,
    p_day: day,
  });
  if (error) throw error;
  return Number(data) || 0;
}

export async function getPayments(userId: string): Promise<
  Array<{
    orderCode: number;
    amount: number;
    planKind: string;
    status: string;
    paidAt: string | null;
    createdAt: string;
  }>
> {
  const { data, error } = await getAdmin()
    .from('payments')
    .select('payos_order_code, amount, plan_kind, status, paid_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    orderCode: Number(row.payos_order_code),
    amount: Number(row.amount),
    planKind: row.plan_kind,
    status: row.status,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  }));
}
```

- [ ] **Step 6: Add the atomic increment RPC to the usage migration**

Append to `supabase/migrations/0002_usage_daily.sql`:

```sql
create or replace function public.increment_ai_usage(
  p_user_id uuid,
  p_ip_hash text,
  p_day date
) returns int language plpgsql security definer as $$
declare
  v_count int;
begin
  if p_user_id is not null then
    insert into public.usage_daily (user_id, ip_hash, day, ai_count)
    values (p_user_id, null, p_day, 1)
    on conflict (user_id, day) do update
      set ai_count = public.usage_daily.ai_count + 1
      returning ai_count into v_count;
  else
    insert into public.usage_daily (user_id, ip_hash, day, ai_count)
    values (null, p_ip_hash, p_day, 1)
    on conflict (ip_hash, day) do update
      set ai_count = public.usage_daily.ai_count + 1
      returning ai_count into v_count;
  end if;
  return v_count;
end;
$$;

revoke all on function public.increment_ai_usage(uuid, text, date) from public;
grant execute on function public.increment_ai_usage(uuid, text, date) to service_role;
```

The final `db.ts` version of the function:

```ts
export async function incrementUsage(
  userId: string | null,
  ipHash: string | null,
  day: string = dayKey(),
): Promise<number> {
  const { data, error } = await getAdmin().rpc('increment_ai_usage', {
    p_user_id: userId,
    p_ip_hash: userId ? null : ipHash,
    p_day: day,
  });
  if (error) throw error;
  return Number(data) || 0;
}
```

- [ ] **Step 7: Run the identity test after implementing identity.ts**

Create `src/server/identity.ts`:

```ts
import { createHash } from 'crypto';
import type { Request } from 'express';
import { createClient } from '@supabase/supabase-js';

export interface Identity {
  userId: string | null;
  ipHash: string | null;
  email: string | null;
  name: string | null;
  avatar: string | null;
}

export function hashIp(ip: string, salt: string): string {
  if (!salt) return '';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

const ANONYMOUS: Identity = {
  userId: null,
  ipHash: null,
  email: null,
  name: null,
  avatar: null,
};

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
  return req.ip || '';
}

/**
 * Resolve who is calling. A valid access token wins; anything else is treated
 * as an anonymous visitor and never blocks the request.
 */
export async function resolveIdentity(req: Request): Promise<Identity> {
  const salt = process.env.IP_HASH_SALT || '';
  const ipHash = hashIp(clientIp(req), salt) || null;

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return { ...ANONYMOUS, ipHash };
  }
  const token = header.slice('Bearer '.length).trim();

  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return { ...ANONYMOUS, ipHash };

  try {
    const { data, error } = await createClient(url, anon, { auth: { persistSession: false } })
      .auth.getUser(token);
    if (error || !data.user) return { ...ANONYMOUS, ipHash };
    const meta = (data.user.user_metadata || {}) as Record<string, string>;
    return {
      userId: data.user.id,
      ipHash,
      email: data.user.email ?? null,
      name: meta.full_name || meta.name || null,
      avatar: meta.avatar_url || meta.picture || null,
    };
  } catch {
    return { ...ANONYMOUS, ipHash };
  }
}
```

Run: `npx vitest run src/server/__tests__/identity.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 8: Implement /api/me, /api/payments and quota consumption**

Create `src/server/routes/api.ts`:

```ts
import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { SiteConfig } from '../siteConfig';
import { getPayments, getProfile, getUsageCount, incrementUsage } from '../db';
import { resolveIdentity } from '../identity';
import { aiLimit, dayKey, quotaError, resolvePlan } from '../quota';

const perMinute = (max: number) =>
  rateLimit({ windowMs: 60_000, limit: max, standardHeaders: true, legacyHeaders: false });

export function mountApiRoutes(app: Express, cfg: SiteConfig): void {
  app.get('/api/me', perMinute(60), async (req: Request, res: Response) => {
    const identity = await resolveIdentity(req);
    const day = dayKey();
    try {
      if (!identity.userId) {
        const used = identity.ipHash ? await getUsageCount(null, identity.ipHash, day) : 0;
        return res.json({
          userId: null,
          email: null,
          name: null,
          avatar: null,
          plan: 'free',
          proUntil: null,
          aiUsedToday: used,
          aiLimit: aiLimit('free'),
        });
      }
      const profile = await getProfile(identity.userId);
      const plan = resolvePlan(profile?.pro_until ?? null);
      const used = await getUsageCount(identity.userId, null, day);
      return res.json({
        userId: identity.userId,
        email: profile?.email ?? identity.email,
        name: profile?.display_name ?? identity.name,
        avatar: profile?.avatar_url ?? identity.avatar,
        plan,
        proUntil: profile?.pro_until ?? null,
        aiUsedToday: used,
        aiLimit: aiLimit(plan),
      });
    } catch (err) {
      console.error('[/api/me]', err);
      return res.status(503).json({ code: 'AUTH_BACKEND' });
    }
  });

  app.get('/api/payments', perMinute(30), async (req: Request, res: Response) => {
    const identity = await resolveIdentity(req);
    if (!identity.userId) return res.status(401).json({ code: 'AUTH_REQUIRED' });
    try {
      return res.json({ payments: await getPayments(identity.userId) });
    } catch (err) {
      console.error('[/api/payments]', err);
      return res.status(503).json({ code: 'AUTH_BACKEND' });
    }
  });

  /**
   * Consume one AI credit. The studio calls this immediately before any Gemini
   * request so the count can never be bypassed by replaying an API call.
   */
  app.post('/api/usage/consume', perMinute(10), async (req: Request, res: Response) => {
    const identity = await resolveIdentity(req);
    let plan: 'free' | 'pro' = 'free';
    try {
      if (identity.userId) {
        const profile = await getProfile(identity.userId);
        plan = resolvePlan(profile?.pro_until ?? null);
      }
    } catch (err) {
      console.error('[/api/usage/consume] profile lookup failed', err);
      return res.status(503).json({ code: 'AUTH_BACKEND' });
    }

    const limit = aiLimit(plan);
    let used: number;
    try {
      used = await incrementUsage(identity.userId, identity.ipHash, dayKey());
    } catch (err) {
      console.error('[/api/usage/consume] usage increment failed', err);
      return res.status(503).json({ code: 'AUTH_BACKEND' });
    }

    if (used > limit) {
      return res.status(quotaError(plan, used, limit, Boolean(identity.userId)).status).json(
        quotaError(plan, used, limit, Boolean(identity.userId)).body,
      );
    }
    return res.json({ ok: true, plan, used, limit, day: dayKey(), appUrl: cfg.appUrl });
  });
}
```

- [ ] **Step 9: Mount the API and close the bypass on the AI routes**

In `server.ts`, above `startServer()`, add:

```ts
import { mountApiRoutes } from './src/server/routes/api';

mountApiRoutes(app, siteCfg);
```

Then add this guard to the top of every AI route body (`/api/transcribe-lyrics`, `/api/forced-align`, `/api/ai-design-video`, `/api/ai-lyric-assistant`), as the first statement inside the `try`:

```ts
const gate = await consumeAiCredit(req);
if (!gate.ok) {
  return res.status(gate.status).json(gate.body);
}
```

Create the helper in a new file `src/server/guard.ts`:

```ts
import type { Request } from 'express';
import { resolveIdentity } from './identity';
import { getProfile, incrementUsage } from './db';
import { aiLimit, quotaError, resolvePlan } from './quota';

export interface Gate {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}

/**
 * Spend one AI credit for this request. Runs after body validation and before
 * any Gemini call. Never refunds on upstream failure, which stops retry storms
 * from draining the quota.
 */
export async function consumeAiCredit(req: Request): Promise<Gate> {
  let identity;
  try {
    identity = await resolveIdentity(req);
  } catch (err) {
    console.error('[guard] identity failed', err);
    return { ok: false, status: 503, body: { code: 'AUTH_BACKEND' } };
  }

  let plan: 'free' | 'pro' = 'free';
  if (identity.userId) {
    try {
      const profile = await getProfile(identity.userId);
      plan = resolvePlan(profile?.pro_until ?? null);
    } catch (err) {
      console.error('[guard] profile lookup failed', err);
      return { ok: false, status: 503, body: { code: 'AUTH_BACKEND' } };
    }
  }

  const limit = aiLimit(plan);
  let used: number;
  try {
    used = await incrementUsage(identity.userId, identity.ipHash);
  } catch (err) {
    console.error('[guard] usage increment failed', err);
    return { ok: false, status: 503, body: { code: 'AUTH_BACKEND' } };
  }

  if (used > limit) {
    const err = quotaError(plan, used, limit, Boolean(identity.userId));
    return { ok: false, status: err.status, body: err.body };
  }
  return { ok: true, status: 200, body: {} };
}
```

Import it in `server.ts`:

```ts
import { consumeAiCredit } from './src/server/guard';
```

- [ ] **Step 10: Verify typecheck and tests**

Run: `npx tsc --noEmit`
Expected: clean.

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add supabase/migrations src/server server.ts
git commit -m "feat: add Supabase schema, identity resolution and AI quota enforcement"
```

---

## Task 9: Studio watermark, 1080p lock, usage badge, login

**Files:**
- Create: `src/components/AccountPage.tsx`
- Create: `src/utils/me.ts`
- Modify: `src/components/VideoCanvas.tsx` (watermark overlay for Free)
- Modify: `src/components/ExportModal.tsx` (1080p lock)
- Modify: `src/App.tsx` (upload rights confirmation, usage badge)
- Create: `src/pages/AccountPage.tsx`

**Interfaces:**
- Consumes: `refreshViewerPlan`, `getViewerPlan`, `onViewerPlanChange` (Task 6), `/api/me` and `/api/usage/consume` (Task 8), `supabase` (Task 6).
- Produces: `src/utils/me.ts` exporting `fetchMe(): Promise<MeState>` and `MeState { userId, email, name, avatar, plan, proUntil, aiUsedToday, aiLimit }`.

- [ ] **Step 1: Create src/utils/me.ts**

```ts
import { supabase } from './supabase';

export interface MeState {
  userId: string | null;
  email: string | null;
  name: string | null;
  avatar: string | null;
  plan: 'free' | 'pro';
  proUntil: string | null;
  aiUsedToday: number;
  aiLimit: number;
}

export const EMPTY_ME: MeState = {
  userId: null,
  email: null,
  name: null,
  avatar: null,
  plan: 'free',
  proUntil: null,
  aiUsedToday: 0,
  aiLimit: 3,
};

export async function fetchMe(): Promise<MeState> {
  try {
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const token = data.session?.access_token;
    const res = await fetch('/api/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return EMPTY_ME;
    return { ...EMPTY_ME, ...(await res.json()) };
  } catch {
    return EMPTY_ME;
  }
}

/** Spend one AI credit before the studio calls a Gemini route. */
export async function consumeCredit(): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  const token = data.session?.access_token;
  const res = await fetch('/api/usage/consume', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return { ok: false, body: await res.json().catch(() => ({})) };
  return { ok: true, body: {} };
}

export async function signInWithGoogle(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/account` },
  });
}
```

- [ ] **Step 2: Draw the Free watermark on the canvas**

In `src/components/VideoCanvas.tsx`, import `getViewerPlan` and draw the watermark at the end of the render function, after all lyric and effect drawing but before the frame is presented:

```tsx
import { getViewerPlan } from '../utils/viewer';

// ...at the end of the draw routine, after lyric/effect rendering:
if (getViewerPlan() === 'free') {
  const size = Math.max(12, Math.round(width * 0.02));
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${size}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('LyricStudio AI', width - size, height - size);
  ctx.restore();
}
```

Use the canvas dimensions already available in that component for `width` and `height`; if the component names them differently, use its existing variables rather than introducing new ones.

- [ ] **Step 3: Lock 1080p for Free in the export modal**

In `src/components/ExportModal.tsx`, import the plan getter and gate the resolution options:

```tsx
import { getViewerPlan } from '../utils/viewer';

// Inside the resolution selector, before rendering the 1080p option:
const isPro = getViewerPlan() === 'pro';
```

Render 1080p like this so Free users see why it is unavailable:

```tsx
<button
  key={res}
  onClick={() => isPro && setResolution(res)}
  disabled={!isPro && res === '1080p'}
  className={[
    'px-3 py-1.5 rounded-lg text-xs font-bold border transition',
    resolution === res ? 'border-rose-500 text-white' : 'border-zinc-700 text-zinc-400',
    !isPro && res === '1080p' ? 'opacity-40 cursor-not-allowed' : '',
  ].join(' ')}
>
  {res}{!isPro && res === '1080p' ? ' (Pro)' : ''}
</button>
```

- [ ] **Step 4: Add the quota badge and rights confirmation to the studio**

In `src/App.tsx`, add the state and effect:

```tsx
import { EMPTY_ME, consumeCredit, fetchMe, type MeState } from './utils/me';

const [me, setMe] = useState<MeState>(EMPTY_ME);
const [rightsConfirmed, setRightsConfirmed] = useState(false);

useEffect(() => {
  fetchMe().then(setMe);
}, []);

const callAi = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
  const credit = await consumeCredit();
  if (!credit.ok) {
    const code = credit.body.code;
    if (code === 'AI_LIMIT_FREE') {
      window.alert(
        credit.body.upgrade
          ? 'Bạn đã dùng hết 3 lượt AI miễn phí hôm nay. Hãy nâng cấp Pro để dùng 50 lượt mỗi ngày.'
          : 'Bạn đã dùng hết 3 lượt AI miễn phí hôm nay. Đăng nhập Google để có hạn mức riêng, hoặc thử lại ngày mai.',
      );
    } else if (code === 'AI_LIMIT_PRO') {
      window.alert('Bạn đã dùng hết 50 lượt AI hôm nay. Hãy thử lại ngày mai.');
    } else {
      window.alert('Không kiểm tra được hạn mức lượt AI. Vui lòng thử lại sau.');
    }
    fetchMe().then(setMe);
    return null;
  }
  setMe((prev) => ({ ...prev, aiUsedToday: prev.aiUsedToday + 1 }));
  return fn();
};
```

Render the badge next to the top navigation, above the ad slot:

```tsx
<div className="flex items-center justify-between gap-3 px-3 pt-3">
  <span className="text-[11px] text-zinc-400">
    Lượt AI hôm nay: {me.aiUsedToday}/{me.aiLimit}
    {me.plan === 'pro' ? ' · Gói Pro' : ''}
  </span>
  {me.plan !== 'pro' && (
    <a href="/pricing" className="text-[11px] font-bold text-rose-400 hover:text-rose-300">
      Nâng cấp Pro
    </a>
  )}
</div>
```

Wrap the upload button so the first click asks for rights confirmation:

```tsx
const handleAudioFile = async (file: File) => {
  if (!rightsConfirmed) {
    const ok = window.confirm(
      'Tôi xác nhận tôi có quyền sử dụng tệp âm thanh này.\n\nBạn chịu trách nhiệm về bản quyền nội dung tải lên.',
    );
    if (!ok) return;
    setRightsConfirmed(true);
  }
  // ...existing upload logic continues here
};
```

Route every existing Gemini call (`transcribe`, `forced align`, `ai design`, `ai lyric assistant`) through `callAi(...)` so the credit is spent before the request.

- [ ] **Step 5: Create the account page**

Create `src/components/AccountPage.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { fetchMe, signInWithGoogle, EMPTY_ME, type MeState } from '../utils/me';
import { supabase } from '../utils/supabase';
import { refreshViewerPlan } from '../utils/viewer';

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export const AccountPage: React.FC = () => {
  const [me, setMe] = useState<MeState>(EMPTY_ME);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPaid(params.get('paid') === '1');
    fetchMe().then(setMe);
  }, []);

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    await refreshViewerPlan();
    setMe(EMPTY_ME);
  };

  if (!me.userId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <section className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-extrabold text-white">Tài khoản LyricStudio AI</h1>
          <p className="text-sm text-zinc-400">
            Đăng nhập bằng Google để nâng cấp Pro, xem hạn dùng và lịch sử thanh toán.
          </p>
          <button
            onClick={handleSignIn}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-sm font-bold text-white"
          >
            Đăng nhập Google
          </button>
          <p className="text-xs text-zinc-500">
            Chưa cần tài khoản để dùng thử miễn phí tại <a className="text-rose-400" href="/studio">Studio</a>.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <header className="flex items-center gap-3">
        {me.avatar && <img src={me.avatar} alt="" className="w-10 h-10 rounded-full" />}
        <div>
          <h1 className="text-2xl font-extrabold text-white">{me.name || me.email}</h1>
          <p className="text-xs text-zinc-500">{me.email}</p>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-lg font-bold text-white">
          {me.plan === 'pro' ? 'Gói Pro' : 'Gói miễn phí'}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {me.plan === 'pro'
            ? `Pro đến hết ngày ${fmtDate(me.proUntil)}.`
            : 'Gói Pro bỏ watermark, xuất 1080p và không hiện quảng cáo.'}
        </p>
        <p className="mt-3 text-sm text-zinc-300">
          Lượt AI hôm nay: {me.aiUsedToday}/{me.aiLimit}
        </p>
        {me.plan !== 'pro' && (
          <a href="/pricing" className="mt-4 inline-flex px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-sm font-bold text-white">
            Nâng cấp Pro
          </a>
        )}
      </section>

      {paid && (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          {me.plan === 'pro'
            ? 'Thanh toán đã được xác nhận. Gói Pro đã kích hoạt.'
            : 'Đang xác nhận thanh toán. Trang sẽ tự cập nhật trong vài giây.'}
        </p>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-lg font-bold text-white">Đăng xuất</h2>
        <button onClick={handleSignOut} className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-200">
          Đăng xuất
        </button>
      </section>

      <p className="text-xs">
        <a href="/pricing" className="text-rose-400">Bảng giá</a> ·{' '}
        <a href="/" className="text-zinc-400">Trang chủ</a>
      </p>
    </main>
  );
};
```

Create `src/pages/AccountPage.tsx`:

```tsx
import React from 'react';
import { AccountPage as AccountView } from '../components/AccountPage';

export const AccountPage: React.FC = () => <AccountView />;
```

- [ ] **Step 6: Verify typecheck and build**

Run: `npx tsc --noEmit`
Expected: clean.

Run: `npm run build`
Expected: success.

- [ ] **Step 7: Commit**

```bash
git add src/components src/pages src/App.tsx src/utils
git commit -m "feat: add account page, watermark, 1080p lock and AI quota badge"
```

---

## Task 10: PayOS purchase, webhook and pricing upgrade

**Files:**
- Create: `src/server/payos.ts`
- Create: `src/server/routes/payosApi.ts`
- Modify: `server.ts` (mount the PayOS routes)
- Create: `src/utils/checkout.ts`
- Modify: `src/components/AccountPage.tsx` (buy buttons)
- Test: `src/server/__tests__/payos.test.ts`

**Interfaces:**
- Consumes: `resolveIdentity` (Task 8), `getProfile` (Task 8), `getAdmin` (Task 8), `mountApiRoutes` pattern (Task 8).
- Produces:
  - `payos.ts`: `MONTH_DAYS = 30`, `YEAR_DAYS = 365`, `PLANS` map, `verifyChecksum(data: Record<string, string>, checksum: string, key: string): boolean`, `extendProUntil(base: Date | null, days: number, now?: Date): Date`, `makeOrderCode(): number`
  - `routes/payosApi.ts`: `mountPayosRoutes(app: Express, cfg: SiteConfig): void` mounting `POST /api/payos/create`, `POST /api/payos/webhook`, `GET /api/payos/status/:orderCode`
  - `checkout.ts`: `startCheckout(plan: 'monthly' | 'yearly'): Promise<void>`

- [ ] **Step 1: Write the failing PayOS math test**

Create `src/server/__tests__/payos.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';
import {
  verifyChecksum,
  extendProUntil,
  makeOrderCode,
  PLANS,
  MONTH_DAYS,
  YEAR_DAYS,
} from '../payos';

const sign = (data: Record<string, string>, key: string) =>
  createHash('sha256')
    .update(
      Object.keys(data)
        .sort()
        .map((k) => `${k}=${data[k]}`)
        .join('&') + key,
    )
    .digest('hex');

describe('verifyChecksum', () => {
  const data = { orderCode: '123', amount: '79000', status: 'PAID' };

  it('accepts a correct checksum', () => {
    expect(verifyChecksum(data, sign(data, 'secret'), 'secret')).toBe(true);
  });

  it('rejects a checksum made with the wrong key', () => {
    expect(verifyChecksum(data, sign(data, 'other'), 'secret')).toBe(false);
  });

  it('rejects a tampered payload', () => {
    const tampered = { ...data, amount: '1' };
    expect(verifyChecksum(tampered, sign(data, 'secret'), 'secret')).toBe(false);
  });

  it('rejects everything when no key is configured', () => {
    expect(verifyChecksum(data, 'anything', '')).toBe(false);
  });
});

describe('extendProUntil', () => {
  const now = new Date('2026-10-03T00:00:00Z');

  it('adds from now when there is no existing expiry', () => {
    expect(extendProUntil(null, MONTH_DAYS, now).toISOString()).toBe('2026-11-02T00:00:00.000Z');
  });

  it('extends from the existing expiry when it is still in the future', () => {
    const base = new Date('2026-10-20T00:00:00Z');
    expect(extendProUntil(base, MONTH_DAYS, now).toISOString()).toBe('2026-11-19T00:00:00.000Z');
  });

  it('restarts from now when the existing expiry has lapsed', () => {
    const base = new Date('2026-09-01T00:00:00Z');
    expect(extendProUntil(base, MONTH_DAYS, now).toISOString()).toBe('2026-11-02T00:00:00.000Z');
  });

  it('adds a full year', () => {
    expect(YEAR_DAYS).toBe(365);
    expect(extendProUntil(null, YEAR_DAYS, now).toISOString()).toBe('2027-10-03T00:00:00.000Z');
  });
});

describe('makeOrderCode', () => {
  it('produces a positive integer of at most 15 digits', () => {
    const code = makeOrderCode();
    expect(Number.isInteger(code)).toBe(true);
    expect(code).toBeGreaterThan(0);
    expect(String(code).length).toBeLessThanOrEqual(15);
  });

  it('does not repeat within a tight loop', () => {
    const codes = new Set(Array.from({ length: 500 }, () => makeOrderCode()));
    expect(codes.size).toBeGreaterThan(490);
  });
});

describe('PLANS', () => {
  it('prices the documented products', () => {
    expect(PLANS.monthly.amount).toBe(79000);
    expect(PLANS.yearly.amount).toBe(790000);
    expect(PLANS.monthly.days).toBe(MONTH_DAYS);
    expect(PLANS.yearly.days).toBe(YEAR_DAYS);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/server/__tests__/payos.test.ts`
Expected: FAIL — cannot resolve `../payos`.

- [ ] **Step 3: Implement src/server/payos.ts**

```ts
import { createHash, randomInt } from 'crypto';

export const MONTH_DAYS = 30;
export const YEAR_DAYS = 365;

export const PLANS = {
  monthly: { amount: 79000, days: MONTH_DAYS, description: 'LS Pro 1 thang' },
  yearly: { amount: 790000, days: YEAR_DAYS, description: 'LS Pro 1 nam' },
} as const;

export type PlanKind = keyof typeof PLANS;

export function verifyChecksum(
  data: Record<string, string>,
  checksum: string,
  key: string,
): boolean {
  if (!key || !checksum) return false;
  const payload =
    Object.keys(data)
      .sort()
      .map((k) => `${k}=${data[k]}`)
      .join('&') + key;
  const expected = createHash('sha256').update(payload).digest('hex');
  return expected === checksum;
}

/** Paid days always extend the remaining time instead of resetting it. */
export function extendProUntil(base: Date | null, days: number, now: Date = new Date()): Date {
  const start = base && base.getTime() > now.getTime() ? base : now;
  return new Date(start.getTime() + days * 86_400_000);
}

/** Unique-enough PayOS order code, comfortably under the 15-digit limit. */
export function makeOrderCode(): number {
  return Date.now() * 1000 + randomInt(0, 1000);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/server/__tests__/payos.test.ts`
Expected: PASS — 12 tests.

- [ ] **Step 5: Implement the PayOS routes**

Create `src/server/routes/payosApi.ts`:

```ts
import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { SiteConfig } from '../siteConfig';
import { getAdmin, getProfile } from '../db';
import { resolveIdentity } from '../identity';
import {
  PLANS,
  extendProUntil,
  makeOrderCode,
  verifyChecksum,
  type PlanKind,
} from '../payos';

const perMinute = (max: number) =>
  rateLimit({ windowMs: 60_000, limit: max, standardHeaders: true, legacyHeaders: false });

const isPlanKind = (value: unknown): value is PlanKind =>
  value === 'monthly' || value === 'yearly';

async function payosRequest(path: string, payload: Record<string, unknown>): Promise<any> {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  if (!clientId || !apiKey) throw new Error('PayOS is not configured');
  const base = process.env.PAYOS_API_BASE || 'https://api.payos.vn';
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-client-id': clientId, 'x-api-key': apiKey },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`PayOS responded ${res.status}`);
  return res.json();
}

/** Idempotently mark an order paid and extend the member's expiry. */
async function applyPaidOrder(
  orderCode: number,
  rawBody: Record<string, unknown>,
): Promise<'paid' | 'unknown'> {
  const db = getAdmin();
  const { data: payment, error } = await db
    .from('payments')
    .select('id, user_id, plan_kind, status')
    .eq('payos_order_code', orderCode)
    .maybeSingle();
  if (error) throw error;
  if (!payment) return 'unknown';
  if (payment.status === 'paid') return 'paid';

  const days = PLANS[(payment as any).plan_kind as PlanKind].days;
  const { data: profile } = await getProfile((payment as any).user_id);
  const next = extendProUntil(
    profile?.pro_until ? new Date(profile.pro_until) : null,
    days,
  );

  const { error: updateErr } = await db
    .from('payments')
    .update({ status: 'paid', paid_at: new Date().toISOString(), raw_webhook: rawBody })
    .eq('id', (payment as any).id);
  if (updateErr) throw updateErr;

  const { error: profileErr } = await db
    .from('profiles')
    .update({ plan: 'pro', pro_until: next.toISOString(), updated_at: new Date().toISOString() })
    .eq('id', (payment as any).user_id);
  if (profileErr) throw profileErr;

  return 'paid';
}

export function mountPayosRoutes(app: Express, cfg: SiteConfig): void {
  app.post('/api/payos/create', perMinute(5), async (req: Request, res: Response) => {
    const identity = await resolveIdentity(req);
    if (!identity.userId) return res.status(401).json({ code: 'AUTH_REQUIRED' });
    if (!isPlanKind(req.body?.plan)) return res.status(400).json({ code: 'BAD_PLAN' });

    const product = PLANS[req.body.plan];
    try {
      const orderCode = makeOrderCode();
      const response = await payosRequest('/v1/orders', {
        order_code: orderCode,
        amount: product.amount,
        description: product.description,
        cancel_url: `${cfg.appUrl}/pricing?cancelled=1`,
        return_url: `${cfg.appUrl}/account?paid=1&orderCode=${orderCode}`,
      });
      const checkoutUrl = response?.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error('PayOS did not return a checkout URL');

      const { error } = await getAdmin().from('payments').insert({
        user_id: identity.userId,
        payos_order_code: orderCode,
        amount: product.amount,
        plan_kind: req.body.plan,
        status: 'pending',
      });
      if (error) throw error;

      return res.json({ checkoutUrl, orderCode });
    } catch (err) {
      console.error('[/api/payos/create]', err);
      return res.status(502).json({ code: 'PAYOS_CREATE_FAILED' });
    }
  });

  app.post('/api/payos/webhook', async (req: Request, res: Response) => {
    const key = process.env.PAYOS_CHECKSUM_KEY || '';
    const data = (req.body?.data || {}) as Record<string, string>;
    const signature = (req.body?.signature || '') as string;
    if (!verifyChecksum(data, signature, key)) return res.status(400).json({ code: 'BAD_SIGNATURE' });

    const code = Number(data.orderCode);
    if (!Number.isFinite(code)) return res.status(400).json({ code: 'BAD_ORDER' });

    try {
      const result = await applyPaidOrder(code, req.body);
      if (result === 'unknown') {
        console.warn(`[payos webhook] unknown orderCode ${code}; ignoring`);
      }
      return res.json({ ok: true });
    } catch (err) {
      console.error('[/api/payos/webhook]', err);
      return res.status(500).json({ code: 'WEBHOOK_FAILED' });
    }
  });

  app.get('/api/payos/status/:orderCode', perMinute(30), async (req: Request, res: Response) => {
    const identity = await resolveIdentity(req);
    if (!identity.userId) return res.status(401).json({ code: 'AUTH_REQUIRED' });

    const orderCode = Number(req.params.orderCode);
    if (!Number.isFinite(orderCode)) return res.status(400).json({ code: 'BAD_ORDER' });

    const db = getAdmin();
    const { data: payment, error } = await db
      .from('payments')
      .select('user_id, status')
      .eq('payos_order_code', orderCode)
      .maybeSingle();
    if (error) throw error;
    if (!payment || (payment as any).user_id !== identity.userId) {
      return res.status(404).json({ code: 'ORDER_NOT_FOUND' });
    }

    if ((payment as any).status !== 'paid') {
      try {
        const info = await payosRequest(`/v1/orders/${orderCode}`, {});
        const code = (info?.data?.status || '').toUpperCase();
        if (code === 'PAID') {
          await applyPaidOrder(orderCode, { source: 'status-poll', status: code });
        } else if (code === 'CANCELLED' || code === 'EXPIRED') {
          await db
            .from('payments')
            .update({ status: code.toLowerCase() })
            .eq('payos_order_code', orderCode);
        }
      } catch (err) {
        console.error('[/api/payos/status] lookup failed', err);
      }
    }

    const profile = await getProfile(identity.userId);
    const { data: fresh } = await db
      .from('payments')
      .select('status')
      .eq('payos_order_code', orderCode)
      .maybeSingle();
    return res.json({
      status: fresh?.status ?? 'pending',
      plan: profile?.plan ?? 'free',
      proUntil: profile?.pro_until ?? null,
    });
  });
}
```

- [ ] **Step 6: Mount the routes and verify**

In `server.ts`, add:

```ts
import { mountPayosRoutes } from './src/server/routes/payosApi';

mountPayosRoutes(app, siteCfg);
```

Run: `npx tsc --noEmit`
Expected: clean.

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 7: Add the checkout client and upgrade buttons**

Create `src/utils/checkout.ts`:

```ts
import { supabase } from './supabase';

export type PlanKind = 'monthly' | 'yearly';

export async function startCheckout(plan: PlanKind): Promise<void> {
  const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  const token = data.session?.access_token;
  if (!token) {
    window.location.href = '/account';
    return;
  }
  const res = await fetch('/api/payos/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) {
    window.alert('Không tạo được link thanh toán. Vui lòng thử lại sau.');
    return;
  }
  const { checkoutUrl } = await res.json();
  window.location.href = checkoutUrl;
}
```

In `src/components/AccountPage.tsx`, add the import and the purchase block, replacing the single upgrade link for Free users:

```tsx
import { startCheckout } from '../utils/checkout';
```

```tsx
{me.plan !== 'pro' && (
  <div className="mt-4 flex flex-wrap gap-3">
    <button
      onClick={() => startCheckout('monthly')}
      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-sm font-bold text-white"
    >
      Mua Pro 79.000đ / tháng
    </button>
    <button
      onClick={() => startCheckout('yearly')}
      className="px-5 py-2.5 rounded-xl bg-zinc-800 text-sm font-bold text-zinc-100"
    >
      Mua Pro 790.000đ / năm
    </button>
  </div>
)}
```

- [ ] **Step 8: Verify the build**

Run: `npm run build`
Expected: success.

- [ ] **Step 9: Commit**

```bash
git add src/server/payos.ts src/server/routes/payosApi.ts server.ts src/utils/checkout.ts src/components/AccountPage.tsx src/server/__tests__/payos.test.ts
git commit -m "feat: add PayOS purchase, webhook activation and upgrade buttons"
```

---

## Task 11: Convert concurrency limit and env documentation

**Files:**
- Modify: `server.ts` (convert route guard + `finally` cleanup)
- Modify: `.env.example`
- Modify: `Dockerfile` (no change expected; confirm the runtime stage still installs FFmpeg)

**Interfaces:**
- Consumes: existing `/api/convert-to-mp4` handler.
- Produces: convert limiter keyed by IP, max 2 in flight.

- [ ] **Step 1: Add the convert limiter**

In `server.ts`, above the convert route, add:

```ts
const inFlightConverts = new Map<string, number>();
const MAX_CONVERT_PER_IP = 2;

const acquireConvertSlot = (key: string): boolean => {
  const current = inFlightConverts.get(key) ?? 0;
  if (current >= MAX_CONVERT_PER_IP) return false;
  inFlightConverts.set(key, current + 1);
  return true;
};

const releaseConvertSlot = (key: string) => {
  const current = inFlightConverts.get(key) ?? 1;
  if (current <= 1) inFlightConverts.delete(key);
  else inFlightConverts.set(key, current - 1);
};
```

Inside `/api/convert-to-mp4`, as the first statements inside the handler:

```ts
const convertKey = req.ip || 'unknown';
if (!acquireConvertSlot(convertKey)) {
  return res.status(429).json({ code: 'CONVERT_BUSY' });
}
try {
  // ...existing body unchanged...
} finally {
  releaseConvertSlot(convertKey);
  fs.promises.unlink(inputPath).catch(() => {});
  fs.promises.unlink(outputPath).catch(() => {});
}
```

Declare `inputPath` and `outputPath` before the `try` so the `finally` can reference them, and keep the existing explicit unlink calls harmlessly duplicated or remove them in favour of the `finally`.

- [ ] **Step 2: Rewrite .env.example**

Overwrite `.env.example`:

```bash
# --- Site ---
# Public HTTPS origin. Used for canonical links, sitemap, ads.txt and PayOS return URLs.
APP_URL="https://your-domain.com"
# Real contact address shown on Contact, Privacy and the footer.
CONTACT_EMAIL="hello@your-domain.com"
# Salt used to hash visitor IPs before storage. Generate a long random string.
IP_HASH_SALT=""
PORT=3000

# --- AI ---
GEMINI_API_KEY=""
# Optional. Whisper is preferred for word-level timestamps when set.
OPENAI_API_KEY=""

# --- Supabase (auth + database) ---
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
# Server only. Never expose to the browser.
SUPABASE_SERVICE_ROLE_KEY=""

# --- PayOS ---
PAYOS_CLIENT_ID=""
PAYOS_API_KEY=""
PAYOS_CHECKSUM_KEY=""
# Override only for sandbox testing, e.g. https://api-beta.payos.vn
PAYOS_API_BASE=""

# --- Google AdSense ---
# ca-pub-XXXXXXXXXXXXXXXX. Leave empty until the account is approved.
ADSENSE_CLIENT_ID=""
ADSENSE_SLOT_HEADER=""
ADSENSE_SLOT_SIDEBAR=""
ADSENSE_SLOT_INFEED=""
CONSENT_REQUIRED="true"
GA_MEASUREMENT_ID=""
```

Add the two client-only variables as a separate block with a clear comment:

```bash
# --- Client (build time, safe to expose in the bundle) ---
VITE_SUPABASE_URL=""
VITE_SUPABASE_ANON_KEY=""
```

- [ ] **Step 3: Confirm the Dockerfile still installs FFmpeg**

Run: `Select-String -Path Dockerfile -Pattern ffmpeg`
Expected: a match on the `apt-get install` line.

- [ ] **Step 4: Final verification**

Run: `npx tsc --noEmit` then `npx vitest run` then `npm run build`.
Expected: clean typecheck, all tests pass, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add server.ts .env.example Dockerfile
git commit -m "feat: limit concurrent converts and document environment variables"
```

---

## Deployment Checklist (reference, not a task)

1. Create the Supabase project; run the three migrations in order.
2. Enable Google in Supabase Auth. Add `${APP_URL}/account` to the redirect allowlist.
3. In Google Cloud, create an OAuth client and add `https://<project>.supabase.co/auth/v1/callback`.
4. Create the PayOS account and copy client id, api key and checksum key.
5. Set every variable from `.env.example` on Railway.
6. `railway up` / connect the repo, then attach the custom domain and enable HTTPS.
7. `npm run build && npm start` locally against staging envs, then run `CHECK_BASE_URL=https://<domain> npx tsx scripts/check-seo.ts`.
8. Only after the check passes, apply for AdSense with the custom domain.
9. After approval, put the real `ca-pub-…` and slot ids into Railway env vars. No rebuild needed — `/config.js` is served at runtime.
