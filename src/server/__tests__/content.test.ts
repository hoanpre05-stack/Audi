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