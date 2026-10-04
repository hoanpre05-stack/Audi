import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Guards against Windows-1252 mojibake in source files.
 *
 * Editing a UTF-8 file through Windows PowerShell with
 * `Get-Content -Raw` + `Set-Content -Encoding utf8` decodes the bytes as
 * Windows-1252 on the way in and re-encodes as UTF-8 on the way out, which
 * silently turns "bước" into "bÆ°á»›c". The page still renders and every other
 * test still passes, so only a byte-level check catches it.
 */
const DAMAGED = /[\u00C3\u00C2\u00C6\u00D0][\u0080-\u00BF\u2018\u2019\u201C\u201D\u2039\u203A\u0192\u02C6\u02DC]/;

// __dirname is src/server/__tests__, so the repo root is three levels up.
const ROOT = path.resolve(__dirname, '..', '..', '..');

const SOURCE_FILES = [
  'src/server/pages.ts',
  'src/server/html.ts',
  'src/server/ads.ts',
  'src/server/seoFiles.ts',
  'src/server/siteConfig.ts',
  'src/data/landing.ts',
  'src/data/faq.ts',
  'src/data/legal.ts',
  'src/data/blogPosts.ts',
];

describe('source encoding', () => {
  it.each(SOURCE_FILES)('%s has no mojibake', (file) => {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const offenders = text
      .split('\n')
      .map((line, i) => ({ line: i + 1, text: line }))
      .filter((r) => DAMAGED.test(r.text));

    const report = offenders
      .slice(0, 3)
      // Escape to code points so the failure message survives any console encoding.
      .map((r) => `line ${r.line}: ${[...r.text.trim().slice(0, 60)]
        .map((c) => (c.codePointAt(0)! < 128 ? c : `<${c.codePointAt(0)!.toString(16).toUpperCase()}>`))
        .join('')}`)
      .join('\n');

    expect(offenders.length === 0, `mojibake found:\n${report}`).toBe(true);
  });

  it.each(SOURCE_FILES)('%s has no U+FFFD replacement characters', (file) => {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    expect(text.includes('\uFFFD')).toBe(false);
  });
});