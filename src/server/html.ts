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