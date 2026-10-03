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
    expect(out).toContain('<title>&lt;b&gt;T&lt;/b&gt;');
  });

  it('injects JSON-LD scripts when provided', () => {
    const out = renderShell({ ...props, jsonLd: [{ '@type': 'FAQPage' }] });
    expect(out).toContain('"@type":"FAQPage"');
  });
});