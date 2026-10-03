import { describe, it, expect } from 'vitest';
import { BLOG_POSTS } from '../../data/blogPosts';

const MIN_WORDS = 800;

const postWords = (post: (typeof BLOG_POSTS)[number]): number =>
  [
    post.title,
    post.description,
    ...post.blocks.flatMap((b) => [b.text ?? '', ...(b.items ?? [])]),
    ...(post.faqs ?? []).flatMap((f) => [f.q, f.a]),
  ]
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

describe('blog depth', () => {
  it.each(BLOG_POSTS.map((p) => [p.slug, p] as const))(
    '%s reaches the minimum word count',
    (_slug, post) => {
      expect(postWords(post)).toBeGreaterThanOrEqual(MIN_WORDS);
    },
  );

  it.each(BLOG_POSTS.map((p) => [p.slug, p] as const))(
    '%s has at least four headings and two FAQ entries',
    (_slug, post) => {
      expect(post.blocks.filter((b) => b.type === 'heading').length).toBeGreaterThanOrEqual(4);
      expect(post.faqs?.length ?? 0).toBeGreaterThanOrEqual(2);
    },
  );

  it.each(BLOG_POSTS.map((p) => [p.slug, p] as const))(
    '%s keeps readingMinutes honest',
    (_slug, post) => {
      // Vietnamese reads at roughly 200 words per minute.
      const minutes = Math.ceil(postWords(post) / 200);
      expect(post.readingMinutes).toBeGreaterThanOrEqual(minutes - 1);
    },
  );

  it('has no empty blocks or placeholder copy', () => {
    for (const post of BLOG_POSTS) {
      for (const block of post.blocks) {
        const content = block.type === 'list' ? (block.items || []).join(' ') : block.text || '';
        expect(content.trim().length).toBeGreaterThan(0);
        expect(content).not.toMatch(/lorem ipsum|TODO|TBD|example\.com/i);
      }
    }
  });

  it('keeps the AdSense-money framing out of reader-facing copy', () => {
    // The old slugs promised "kiếm tiền bằng AdSense", which reads as thin SEO bait.
    for (const post of BLOG_POSTS) {
      const text = [post.title, post.description].join(' ');
      expect(text).not.toMatch(/adsense/i);
    }
  });
});