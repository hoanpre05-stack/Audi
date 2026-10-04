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
  return post.blocks
    .map((block) => {
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
    })
    .flat();
}

export function renderLanding(cfg: SiteConfig): string {
  const body = html`
    <section class="space-y-6">
      <h1 class="text-3xl sm:text-4xl font-extrabold text-white leading-tight">${LANDING.title}</h1>
      <p class="${proseClass}">${LANDING.intro}</p>
      <p><a class="cta" href="/studio">Mở Studio tạo video</a></p>
    </section>

    ${raw(adUnit(cfg, 'header'))}

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

    ${raw(adUnit(cfg, 'infeed'))}

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

    ${raw(adUnit(cfg, 'infeed'))}
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
      <div class="mt-8 ${proseClass}">${articleBlocks(post, cfg)}</div>
    </article>

    ${post.faqs?.length
      ? html`
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
        `
      : ''}

    <section class="mt-12">
      <h2 class="text-2xl font-bold text-white">Bài liên quan</h2>
      <ul class="mt-4 space-y-2">
        ${related.map((p) => html`<li><a href="/blog/${p.slug}">${p.title}</a></li>`)}
      </ul>
    </section>

    ${raw(adUnit(cfg, 'footer'))}

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

    ${raw(adUnit(cfg, 'footer'))}
  `;
  return renderShell({
    title: 'Câu hỏi thường gặp | LyricStudio AI',
    description:
      'Câu hỏi thường gặp về LyricStudio AI: gói miễn phí, định dạng âm thanh, xuất video và bản quyền.',
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