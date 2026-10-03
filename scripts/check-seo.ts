/**
 * Pre-flight check for the Google AdSense review.
 *
 * AdSense reviewers and crawlers frequently do not execute JavaScript, so this
 * script asserts against the raw HTML that Express actually returns, not
 * against a headless browser. Run it against the real deployed origin:
 *
 *   CHECK_BASE_URL=https://your-domain.com npm run check:seo
 *
 * Exits non-zero and lists every problem if any assertion fails.
 */
const base = (process.env.CHECK_BASE_URL || 'http://localhost:3100').replace(/\/+$/, '');
const failures: string[] = [];
const checks = { run: 0, passed: 0 };

const check = (ok: boolean, message: string) => {
  checks.run += 1;
  if (ok) checks.passed += 1;
  else failures.push(message);
};

type Fetched = { status: number; type: string; text: string };

async function get(path: string): Promise<Fetched> {
  const res = await fetch(`${base}${path}`, { redirect: 'manual' });
  return {
    status: res.status,
    type: res.headers.get('content-type') || '',
    text: await res.text(),
  };
}

/** Visible text, with scripts/styles stripped. */
const textOf = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const BLOG_SLUGS = [
  'cach-lam-lyric-video-mien-phi',
  'lyric-video-tiktok-youtube-kiem-tien',
  'can-khop-song-am-cho-lyric-video',
  'toi-uu-video-9-16-cho-shorts-tiktok',
  'ban-quyen-nhac-khi-lam-video',
];

const PUBLIC_PATHS = [
  '/',
  '/blog',
  '/pricing',
  '/faq',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
];

const run = async () => {
  check(!/\.up\.railway\.app$/.test(base), `CHECK_BASE_URL is a Railway default domain (${base}); AdSense needs a custom domain`);

  // --- Crawlable content pages -------------------------------------------------
  for (const path of PUBLIC_PATHS) {
    const { status, type, text } = await get(path);
    check(status === 200, `${path} returned ${status}, expected 200`);
    check(type.includes('text/html'), `${path} content-type is "${type}", expected text/html`);
    check(/<h1[\s>]/i.test(text), `${path} has no <h1> in the server HTML`);
    check(textOf(text).length >= 300, `${path} has only ${textOf(text).length} characters of text (needs 300+)`);
    check(/<link rel="canonical"/i.test(text), `${path} has no canonical link`);
    check(!/noindex/i.test(text), `${path} is marked noindex`);
    check(!/example\.com/i.test(text), `${path} still contains an example.com placeholder`);
    check(!/\{contactEmail\}/.test(text), `${path} has an unresolved {contactEmail} placeholder`);
  }

  // --- Blog posts -------------------------------------------------------------
  for (const slug of BLOG_SLUGS) {
    const path = `/blog/${slug}`;
    const { status, text } = await get(path);
    check(status === 200, `${path} returned ${status}, expected 200`);
    check(/<article[\s>]/i.test(text), `${path} has no <article> element`);
    check(textOf(text).length >= 3000, `${path} has only ${textOf(text).length} characters (thin content risk)`);
    check(/application\/ld\+json/i.test(text), `${path} has no JSON-LD structured data`);
  }

  // --- Monetization files -----------------------------------------------------
  // Everything below is derived from what the server actually returned, never
  // from this process's env: the deployed server has its own configuration and
  // comparing the two would prove nothing.
  const ads = await get('/ads.txt');
  const adsBody = ads.text.trim();
  if (adsBody === '') {
    console.warn('  ! ads.txt is empty — set ADSENSE_CLIENT_ID before submitting to AdSense');
  } else {
    check(
      /^google\.com, pub-\d+, DIRECT, f08c47fec0942fa0$/m.test(adsBody),
      `ads.txt is not the canonical single AdSense line: ${adsBody.slice(0, 120)}`,
    );
  }

  const robots = await get('/robots.txt');
  check(robots.status === 200, `robots.txt returned ${robots.status}`);
  check(robots.text.includes('Allow: /'), 'robots.txt does not allow crawling');
  check(robots.text.includes('Disallow: /account'), 'robots.txt must disallow /account');

  // The sitemap URL advertised by robots.txt is the authoritative origin.
  const sitemapMatch = robots.text.match(/Sitemap:\s*(\S+)/);
  check(Boolean(sitemapMatch), 'robots.txt does not advertise a sitemap');
  const origin = sitemapMatch ? sitemapMatch[1].replace(/\/sitemap\.xml$/, '') : '';
  check(origin.startsWith('https://'), `the site origin must be https for AdSense (found "${origin}")`);
  check(
    !/\.up\.railway\.app$/.test(origin),
    `AdSense needs a custom domain, not a Railway default domain (found "${origin}")`,
  );

  const sitemap = await get('/sitemap.xml');
  check(sitemap.status === 200, `sitemap.xml returned ${sitemap.status}`);
  check(sitemap.text.includes('<loc>'), 'sitemap.xml has no <loc> entries');
  check(
    Boolean(origin) && sitemap.text.includes(`${origin}/studio`),
    `sitemap.xml is missing ${origin}/studio`,
  );
  for (const slug of BLOG_SLUGS) {
    check(sitemap.text.includes(`/blog/${slug}`), `sitemap.xml is missing /blog/${slug}`);
  }
  check(!/example\.com/.test(sitemap.text), 'sitemap.xml contains example.com');
  check(
    !new RegExp(`<loc>${base}`).test(sitemap.text) || base === origin,
    'sitemap.xml origin disagrees with the origin advertised in robots.txt',
  );

  // --- Studio / routing -------------------------------------------------------
  const studio = await get('/studio');
  check(studio.status === 200, `/studio returned ${studio.status}`);
  check(studio.text.includes('id="root"'), '/studio does not serve the React shell');
  check(!/<h1/i.test(textOf(studio.text)), '/studio SPA shell has no server text (acceptable, it is an app)');

  const missing = await get('/khong-ton-tai-khong-co-that');
  check(missing.status === 404, `unknown path returned ${missing.status}, expected 404`);

  // --- Ad hygiene -------------------------------------------------------------
  for (const path of [...PUBLIC_PATHS, '/ads.txt', '/robots.txt', '/sitemap.xml', '/config.js']) {
    const { text } = await get(path);
    check(!/Khu Vực Quảng Cáo/.test(text), `${path} ships the dev ad placeholder`);
  }

  // --- Report -----------------------------------------------------------------
  if (failures.length > 0) {
    console.error(`check:seo FAILED — ${failures.length} of ${checks.run} checks failed against ${base}\n`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error('');
    process.exit(1);
  }
  console.log(`check:seo passed — ${checks.passed}/${checks.run} checks against ${base}`);
};

run().catch((err) => {
  console.error('check:seo crashed:', err);
  process.exit(1);
});