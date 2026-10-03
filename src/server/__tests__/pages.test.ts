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