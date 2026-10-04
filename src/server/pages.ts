import { escapeHtml, html, raw, renderShell } from './html';
import type { SiteConfig } from './siteConfig';
import { BLOG_POSTS, type BlogPost } from '../data/blogPosts';
import { FAQS, faqJsonLd } from '../data/faq';
import { LEGAL_PAGES } from '../data/legal';
import { LANDING } from '../data/landing';
import { adUnit } from './ads';

const canon = (cfg: SiteConfig, path: string): string => `${cfg.appUrl}${path}`;

const proseClass = 'space-y-4 text-sm sm:text-[15px] text-zinc-300 leading-7';

/** Returns one fragment per block. `html` joins arrays raw, so these render as markup. */
function articleBlocks(post: BlogPost, cfg: SiteConfig): string[] {
  let headingCount = 0;
  return post.blocks.map((block) => {
    if (block.type === 'heading') {
      headingCount += 1;
      const heading = `<h2 class="text-xl font-bold text-white mt-8">${escapeHtml(block.text)}</h2>`;
      // AdSense favours an in-article unit roughly a third of the way down.
      // Placing it after the third heading keeps it clear of the opening and
      // avoids stranding it in a short article.
      if (headingCount === 3) return [heading, adUnit(cfg, 'infeed')];
      return heading;
    }
    if (block.type === 'list') {
      const items = (block.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      return `<ul class="list-disc pl-5 space-y-2">${items}</ul>`;
    }
    return `<p>${escapeHtml(block.text)}</p>`;
  }).flat();
}

export function renderLanding(cfg: SiteConfig): string {
  const body = html`
    <section class="space-y-6">
      <h1 class="text-3xl sm:text-4xl font-extrabold text-white leading-tight">${LANDING.title}</h1>
      <p class="${proseClass}">${LANDING.intro}</p>
      <p><a class="cta" href="/studio">Má»Ÿ Studio táº¡o video</a></p>
    </section>

    ${raw(adUnit(cfg, 'header'))}

    <section class="mt-12">
      <h2 class="text-2xl font-bold text-white">Ba bÆ°á»›c Ä‘á»ƒ cÃ³ lyric video</h2>
      <ol class="mt-4 space-y-4">
        ${LANDING.steps.map(
          (s, i) => html`<li><strong>${i + 1}. ${s.title}</strong> â€” ${s.body}</li>`,
        )}
      </ol>
    </section>

    <section class="mt-12">
      <h2 class="text-2xl font-bold text-white">TÃ­nh nÄƒng ná»•i báº­t</h2>
      <ul class="mt-4 list-disc pl-5 space-y-2">
        ${LANDING.features.map((f) => html`<li>${f}</li>`)}
      </ul>
    </section>

    <section class="mt-12 grid gap-4 sm:grid-cols-2">
      <div class="plan-card">
        <h3>GÃ³i miá»…n phÃ­</h3>
        <p>3 lÆ°á»£t AI má»—i ngÃ y, xuáº¥t 720p cÃ³ watermark, cÃ³ quáº£ng cÃ¡o.</p>
      </div>
      <div class="plan-card">
        <h3>GÃ³i Pro</h3>
        <p>50 lÆ°á»£t AI má»—i ngÃ y, xuáº¥t 1080p khÃ´ng watermark, khÃ´ng quáº£ng cÃ¡o.</p>
      </div>
    </section>
    <p><a href="/pricing">Xem báº£ng giÃ¡ Ä‘áº§y Ä‘á»§</a></p>

    ${raw(adUnit(cfg, 'infeed'))}

    <section class="mt-12">
      <h2 class="text-2xl font-bold text-white">CÃ¢u há»i thÆ°á»ng gáº·p</h2>
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
      <h2 class="text-2xl font-bold text-white">HÆ°á»›ng dáº«n chi tiáº¿t</h2>
      <p class="${proseClass}">
        Äá»c cÃ¡c bÃ i hÆ°á»›ng dáº«n trong
        <a href="/blog">blog cá»§a LyricStudio AI</a> Ä‘á»ƒ biáº¿t cÃ¡ch chá»n font chá»¯, cÄƒn má»‘c thá»i gian
        vÃ  xuáº¥t video Ä‘Ãºng tá»· lá»‡ cho tá»«ng ná»n táº£ng.
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
    <h1 class="text-3xl font-extrabold text-white">Blog hÆ°á»›ng dáº«n lÃ m lyric video</h1>
    <p class="${proseClass}">
      CÃ¡c bÃ i hÆ°á»›ng dáº«n chi tiáº¿t vá» cÃ¡ch cÄƒn lá»i hÃ¡t theo tá»«, chá»n font chá»¯ hiá»‡u á»©ng, xuáº¥t video 9:16
      cho TikTok vÃ  xá»­ lÃ½ báº£n quyá»n khi lÃ m lyric video.
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
              <p class="mt-1 text-xs text-zinc-500">${post.date} Â· ${post.readingMinutes} phÃºt Ä‘á»c</p>
            </article>
          </li>
        `,
      )}
    </ul>
    ${raw(adUnit(cfg, 'infeed'))}
  `;
  return renderShell({
    title: 'Blog hÆ°á»›ng dáº«n lÃ m lyric video | LyricStudio AI',
    description:
      'HÆ°á»›ng dáº«n lÃ m lyric video báº±ng AI: cÄƒn lá»i theo tá»«, chá»n kinetic typography, xuáº¥t video 9:16 vÃ  xá»­ lÃ½ báº£n quyá»n.',
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
      <p><a href="/blog">â† Vá» blog</a></p>
      <h1 class="mt-3 text-3xl font-extrabold text-white leading-tight">${post.title}</h1>
      <p class="mt-2 ${proseClass}">${post.description}</p>
      <p class="mt-1 text-xs text-zinc-500">${post.author} Â· ${post.date} Â· ${post.readingMinutes} phÃºt Ä‘á»c</p>
      <div class="mt-8 ${proseClass}">${articleBlocks(post, cfg)}</div>
    </article>

    ${post.faqs?.length
      ? html`
          <section class="mt-12">
            <h2 class="text-2xl font-bold text-white">CÃ¢u há»i thÆ°á»ng gáº·p</h2>
            ${post.faqs.map(
              (f) => html`
                <article class="mt-4">
                  <h3 class="font-bold text-white">${f.q}</h3>
                  <p class="mt-1 ${proseClass}">${f.a}</p>
                </article>
              `,
            )}
          </section>
        `
      : ''}

    <section class="mt-12">
      <h2 class="text-2xl font-bold text-white">BÃ i liÃªn quan</h2>
      <ul class="mt-4 space-y-2">
        ${related.map((p) => html`<li><a href="/blog/${p.slug}">${p.title}</a></li>`)}
      </ul>
    </section>

    ${raw(adUnit(cfg, 'footer'))}

    <p class="mt-10"><a class="cta" href="/studio">Má»Ÿ Studio táº¡o video miá»…n phÃ­</a></p>
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
    <h1 class="text-3xl font-extrabold text-white">Báº£ng giÃ¡ LyricStudio AI</h1>
    <p class="${proseClass}">
      GÃ³i miá»…n phÃ­ dÃ¹ng Ä‘á»ƒ thá»­ cÃ´ng cá»¥. GÃ³i Pro dÃ nh cho ngÆ°á»i lÃ m video thÆ°á»ng xuyÃªn cáº§n xuáº¥t
      khÃ´ng watermark, khÃ´ng quáº£ng cÃ¡o vÃ  háº¡n má»©c AI cao hÆ¡n. Thanh toÃ¡n qua PayOS, má»—i láº§n thanh
      toÃ¡n cá»™ng thÃªm thá»i gian sá»­ dá»¥ng.
    </p>
    <div class="mt-8 grid gap-6 sm:grid-cols-2">
      <section class="plan-card">
        <h2>GÃ³i miá»…n phÃ­</h2>
        <p class="text-2xl font-extrabold text-white">0 Ä‘</p>
        <ul class="mt-4 list-disc pl-5 space-y-2">
          <li>3 lÆ°á»£t xá»­ lÃ½ AI má»—i ngÃ y</li>
          <li>Xuáº¥t video 720p cÃ³ watermark</li>
          <li>CÃ³ quáº£ng cÃ¡o Ä‘á»ƒ duy trÃ¬ dá»‹ch vá»¥</li>
          <li>DÃ¹ng ngay, khÃ´ng cáº§n Ä‘Äƒng nháº­p</li>
        </ul>
      </section>
      <section class="plan-card">
        <h2>GÃ³i Pro thÃ¡ng</h2>
        <p class="text-2xl font-extrabold text-white">79.000 Ä‘ / thÃ¡ng</p>
        <ul class="mt-4 list-disc pl-5 space-y-2">
          <li>50 lÆ°á»£t xá»­ lÃ½ AI má»—i ngÃ y</li>
          <li>Xuáº¥t video 1080p khÃ´ng watermark</li>
          <li>KhÃ´ng quáº£ng cÃ¡o</li>
          <li>Cá»™ng thÃªm 30 ngÃ y má»—i láº§n thanh toÃ¡n</li>
        </ul>
      </section>
      <section class="plan-card">
        <h2>GÃ³i Pro nÄƒm</h2>
        <p class="text-2xl font-extrabold text-white">790.000 Ä‘ / nÄƒm</p>
        <ul class="mt-4 list-disc pl-5 space-y-2">
          <li>Äáº§y Ä‘á»§ tÃ­nh nÄƒng gÃ³i Pro thÃ¡ng</li>
          <li>Cá»™ng thÃªm 365 ngÃ y má»—i láº§n thanh toÃ¡n</li>
          <li>Tiáº¿t kiá»‡m so vá»›i tráº£ theo thÃ¡ng</li>
        </ul>
      </section>
    </div>
    <p class="mt-8">
      <a class="cta" href="/account">ÄÄƒng nháº­p Ä‘á»ƒ nÃ¢ng cáº¥p Pro</a>
    </p>
    <p class="mt-4 ${proseClass}">
      GÃ³i Pro khÃ´ng tá»± Ä‘á»™ng gia háº¡n. Khi háº¿t thá»i háº¡n, tÃ i khoáº£n trá»Ÿ vá» gÃ³i miá»…n phÃ­ vÃ  quáº£ng cÃ¡o
      hiá»ƒn thá»‹ trá»Ÿ láº¡i.
    </p>
  `;
  return renderShell({
    title: 'Báº£ng giÃ¡ | LyricStudio AI',
    description:
      'GÃ³i miá»…n phÃ­ 3 lÆ°á»£t AI má»—i ngÃ y. GÃ³i Pro 79.000Ä‘ má»—i thÃ¡ng hoáº·c 790.000Ä‘ má»—i nÄƒm: 1080p khÃ´ng watermark, khÃ´ng quáº£ng cÃ¡o.',
    canonical: canon(cfg, '/pricing'),
    body,
  });
}

export function renderFaq(cfg: SiteConfig): string {
  const body = html`
    <h1 class="text-3xl font-extrabold text-white">CÃ¢u há»i thÆ°á»ng gáº·p vá» LyricStudio AI</h1>
    <p class="${proseClass}">
      Giáº£i Ä‘Ã¡p cÃ¡c cÃ¢u há»i vá» cÃ¡ch dÃ¹ng, giá»›i háº¡n gÃ³i miá»…n phÃ­, Ä‘á»‹nh dáº¡ng Ã¢m thanh vÃ  báº£n quyá»n.
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
      KhÃ´ng tÃ¬m tháº¥y cÃ¢u tráº£ lá»i? <a href="/contact">Gá»­i cÃ¢u há»i cho chÃºng tÃ´i</a>.
    </p>

    ${raw(adUnit(cfg, 'footer'))}
  `;
  return renderShell({
    title: 'CÃ¢u há»i thÆ°á»ng gáº·p | LyricStudio AI',
    description:
      'CÃ¢u há»i thÆ°á»ng gáº·p vá» LyricStudio AI: gÃ³i miá»…n phÃ­, Ä‘á»‹nh dáº¡ng Ã¢m thanh, xuáº¥t video vÃ  báº£n quyá»n.',
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
    <p class="mt-1 text-xs text-zinc-500">Cáº­p nháº­t láº§n cuá»‘i: ${page.updated}</p>
    <p class="mt-4 ${proseClass}">${resolve(page.intro)}</p>
    ${page.sections.map(
      (section) => html`
        <section class="mt-6">
          <h2 class="text-xl font-bold text-white">${section.heading}</h2>
          ${(section.paragraphs || []).map(
            (p) => html`<p class="mt-2 ${proseClass}">${resolve(p)}</p>`,
          )}
          ${section.list
            ? html`<ul class="mt-2 list-disc pl-5 space-y-2">
                ${section.list.map((item) => html`<li>${resolve(item)}</li>`)}
              </ul>`
            : ''}
        </section>
      `,
    )}
    <p class="mt-10 ${proseClass}">
      LiÃªn há»‡: <a href="mailto:${cfg.contactEmail}">${cfg.contactEmail}</a>
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
    <h1 class="text-3xl font-extrabold text-white">KhÃ´ng tÃ¬m tháº¥y trang</h1>
    <p class="${proseClass}">
      ÄÆ°á»ng dáº«n báº¡n má»Ÿ khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ Ä‘Æ°á»£c chuyá»ƒn Ä‘i. Báº¡n cÃ³ thá»ƒ quay láº¡i trang chá»§ Ä‘á»ƒ táº¡o
      lyric video, hoáº·c Ä‘á»c cÃ¡c bÃ i hÆ°á»›ng dáº«n trong blog.
    </p>
    <p><a class="cta" href="/studio">Má»Ÿ Studio</a></p>
    <p class="mt-2"><a href="/blog">Äá»c blog hÆ°á»›ng dáº«n</a></p>
  `;
  return renderShell({
    title: 'KhÃ´ng tÃ¬m tháº¥y trang | LyricStudio AI',
    description: 'Trang báº¡n tÃ¬m khÃ´ng tá»“n táº¡i trÃªn LyricStudio AI.',
    canonical: canon(cfg, '/404'),
    body,
    robots: 'noindex,follow',
  });
}
