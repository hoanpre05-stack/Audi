import type { SiteConfig } from './siteConfig';
import { html } from './html';

export type AdSlot = 'header' | 'infeed' | 'footer';

const SLOT_ENV: Record<AdSlot, keyof SiteConfig> = {
  header: 'adsenseSlotHeader',
  infeed: 'adsenseSlotInfeed',
  footer: 'adsenseSlotSidebar',
};

/**
 * A server-rendered AdSense unit.
 *
 * Deliberately inert by default: with no publisher id or no configured slot the
 * markup is empty, so the layout never shows an "ad goes here" box. The
 * client-side loader (`src/components/AdSenseSlot.tsx`) pushes the unit after
 * consent and only while the viewer is on the free plan, which is what removes
 * ads for Pro members.
 */
export function adUnit(cfg: SiteConfig, slot: AdSlot): string {
  if (!cfg.hasAdsense) return '';

  const slotId = String(cfg[SLOT_ENV[slot]] || '').trim();
  if (!slotId) return '';

  const width = slot === 'header' || slot === 'footer' ? 728 : 336;

  return html`
    <aside class="ad-slot" aria-label="Quảng cáo">
      <ins
        class="adsbygoogle"
        style="display: block; width: 100%; max-width: ${width}px; margin: 0 auto"
        data-ad-client="${cfg.adsenseClient}"
        data-ad-slot="${slotId}"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </aside>
  `;
}