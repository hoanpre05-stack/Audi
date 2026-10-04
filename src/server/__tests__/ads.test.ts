import { describe, it, expect } from 'vitest';
import { loadSiteConfig } from '../siteConfig';
import { adUnit } from '../ads';
import { renderLanding, renderBlogPost, renderFaq } from '../pages';
import { BLOG_POSTS } from '../../data/blogPosts';

const withAds = loadSiteConfig({
  APP_URL: 'https://delyai.app',
  ADSENSE_CLIENT_ID: 'ca-pub-1234567890123456',
  ADSENSE_SLOT_HEADER: '111',
  ADSENSE_SLOT_INFEED: '222',
  ADSENSE_SLOT_SIDEBAR: '333',
} as NodeJS.ProcessEnv);

const withoutAds = loadSiteConfig({ APP_URL: 'https://delyai.app' } as NodeJS.ProcessEnv);

describe('adUnit', () => {
  it('renders nothing without a publisher id', () => {
    expect(adUnit(withoutAds, 'header')).toBe('');
  });

  it('renders nothing when the publisher is set but the slot id is not', () => {
    const partial = loadSiteConfig({
      ADSENSE_CLIENT_ID: 'ca-pub-1234567890123456',
    } as NodeJS.ProcessEnv);
    expect(adUnit(partial, 'header')).toBe('');
  });

  it('renders an ins element carrying client and slot', () => {
    const out = adUnit(withAds, 'infeed');
    expect(out).toContain('data-ad-client="ca-pub-1234567890123456"');
    expect(out).toContain('data-ad-slot="222"');
    expect(out).toContain('adsbygoogle');
  });

  it('maps each placement to its own slot id', () => {
    expect(adUnit(withAds, 'header')).toContain('data-ad-slot="111"');
    expect(adUnit(withAds, 'footer')).toContain('data-ad-slot="333"');
  });
});

describe('ad placement on content pages', () => {
  const pages = [
    ['landing', renderLanding(withAds)],
    ['faq', renderFaq(withAds)],
    ['blog post', renderBlogPost(withAds, BLOG_POSTS[0].slug) ?? ''],
  ] as const;

  it.each(pages)('%s carries at least one ad unit when configured', (_name, page) => {
    expect(page).toContain('data-ad-client="ca-pub-1234567890123456"');
  });

  it('puts two units inside a blog article for in-article and end-of-post ads', () => {
    const post = renderBlogPost(withAds, BLOG_POSTS[0].slug) ?? '';
    const articleEnd = post.indexOf('</article>');
    const articleBody = post.slice(0, articleEnd);
    expect((articleBody.match(/data-ad-slot=/g) || []).length).toBeGreaterThanOrEqual(1);
  });

  it.each(pages)('%s has no ad markup before approval', (_name, page) => {
    const pageWithoutAds =
      _name === 'landing'
        ? renderLanding(withoutAds)
        : _name === 'faq'
          ? renderFaq(withoutAds)
          : (renderBlogPost(withoutAds, BLOG_POSTS[0].slug) ?? '');
    expect(pageWithoutAds).not.toContain('data-ad-client');
    expect(pageWithoutAds).not.toContain('adsbygoogle');
  });
});