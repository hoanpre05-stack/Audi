import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';
import { getAppConfig, isAdSenseConfigured, refreshAppConfig } from '../utils/appConfig';
import { canUseAdvertising, onConsentChange } from '../utils/consent';

export type AdPlacement = 'header' | 'sidebar' | 'infeed';

interface AdSenseSlotProps {
  /** Semantic placement resolved against runtime config. */
  placement?: AdPlacement;
  /** Explicit AdSense slot id. Overrides `placement` resolution when provided. */
  slotId?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

const SCRIPT_ID = 'adsense-script';

/** Inject the AdSense loader exactly once per page. */
function ensureAdSenseScript(client: string): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
    client,
  )}`;
  document.head.appendChild(script);
}

const resolveSlotId = (placement: AdPlacement | undefined, explicit: string | undefined): string => {
  if (explicit) return explicit;
  const config = getAppConfig();
  if (placement === 'header') return config.adsenseSlotHeader;
  if (placement === 'sidebar') return config.adsenseSlotSidebar;
  if (placement === 'infeed') return config.adsenseSlotInfeed;
  return '';
};

/**
 * Live Google AdSense unit.
 *
 * - Publisher id + slot ids come from runtime config (server `/config.js` -> env vars).
 * - The unit is only rendered after cookie consent is granted (Consent Mode v2).
 * - The loader pushes to `adsbygoogle` lazily when the slot scrolls into view.
 */
export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  placement,
  slotId,
  format = 'auto',
  className = '',
}) => {
  const [, forceUpdate] = useState(0);
  const insRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  useEffect(() => {
    const offConsent = onConsentChange(rerender);
    const onConfigChange = () => {
      refreshAppConfig();
      rerender();
    };
    window.addEventListener('app-config-change', onConfigChange);
    return () => {
      offConsent();
      window.removeEventListener('app-config-change', onConfigChange);
    };
  }, [rerender]);

  const config = getAppConfig();
  const resolvedSlot = resolveSlotId(placement, slotId);
  const configured = isAdSenseConfigured();
  const consented = canUseAdvertising(config.consentRequired);
  const shouldServeAd = configured && consented && Boolean(resolvedSlot);

  useEffect(() => {
    if (!shouldServeAd) {
      pushedRef.current = false;
      return;
    }
    ensureAdSenseScript(config.adsenseClient);

    const el = insRef.current;
    if (!el) return;

    const push = () => {
      if (pushedRef.current) return;
      try {
        const w = window as unknown as { adsbygoogle?: unknown[] };
        w.adsbygoogle = w.adsbygoogle || [];
        w.adsbygoogle.push({});
        pushedRef.current = true;
      } catch (err) {
        console.warn('AdSense push skipped (likely an ad blocker):', err);
      }
    };

    if (typeof IntersectionObserver === 'undefined') {
      push();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          push();
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldServeAd, config.adsenseClient, resolvedSlot]);

  if (shouldServeAd) {
    return (
      <div className={`adsense-container my-3 overflow-hidden flex justify-center ${className}`}>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={config.adsenseClient}
          data-ad-slot={resolvedSlot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Configured but waiting for cookie consent -> render nothing.
  if (configured && !consented) return null;

  // Not configured yet -> show an educational placeholder so the layout stays stable.
  const sizeClasses = {
    auto: 'h-24 w-full',
    horizontal: 'h-20 sm:h-24 w-full',
    rectangle: 'h-64 w-[300px]',
    vertical: 'h-[600px] w-[300px]',
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3 overflow-hidden text-center group transition hover:border-zinc-700/60 ${
        sizeClasses[format]
      } ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-rose-500/5 to-purple-600/5 opacity-50 group-hover:opacity-100 transition duration-500" />
      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Khu Vực Quảng Cáo Google AdSense</span>
        </div>
        <p className="text-[11px] text-zinc-400 max-w-md font-medium leading-relaxed">
          {format === 'rectangle' || format === 'vertical'
            ? 'Vị trí lý tưởng cho biểu ngữ vuông hoặc dọc 300x250.'
            : 'Đặt biểu ngữ ngang 728x90 ở đây để tối ưu hóa RPM (Doanh thu mỗi 1000 lượt xem).'}
        </p>
        <span className="text-[9px] text-zinc-600 font-mono">
          Vị trí: {placement || resolvedSlot || 'chưa đặt'} • Cấu hình qua biến môi trường ADSENSE_CLIENT_ID
        </span>
      </div>
      <div
        className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-300 cursor-help"
        title="Google AdSense cần nội dung bài viết SEO chất lượng để được duyệt nhanh hơn. Xem mục Blog hướng dẫn!"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};