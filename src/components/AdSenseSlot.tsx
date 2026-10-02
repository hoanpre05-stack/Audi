import React, { useEffect, useState } from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';

interface AdSenseSlotProps {
  slotId: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  slotId,
  format = 'auto',
  className = '',
}) => {
  const [adClient, setAdClient] = useState<string>('');
  const [hasRemovedAds, setHasRemovedAds] = useState<boolean>(false);

  useEffect(() => {
    // Check if user has entered their own AdSense Publisher ID in localStorage
    const savedClient = localStorage.getItem('adsense_client_id');
    if (savedClient) {
      setAdClient(savedClient);
    }

    // Check premium status to hide ads
    const isPremium = localStorage.getItem('lyricstudio_premium_status') === 'active';
    setHasRemovedAds(isPremium);

    // Load actual google adsense script if client ID is configured
    if (savedClient && !isPremium) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.warn('Google AdSense block warning / ad blocker active:', e);
      }
    }
  }, []);

  if (hasRemovedAds) {
    return null;
  }

  // If no AdSense publisher ID is saved, show an elegant, educational placeholder
  // teaching the user how AdSense will look and perform on their live site.
  if (!adClient) {
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
        {/* Animated ambient glow */}
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
            Slot: {slotId} • Định dạng: {format}
          </span>
        </div>

        {/* Info hover badge */}
        <div className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-300 cursor-help" title="Google AdSense cần nội dung bài viết SEO chất lượng để được duyệt nhanh hơn. Cuộn xuống xem mục Hướng dẫn SEO!">
          <HelpCircle className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  return (
    <div className={`adsense-container my-3 overflow-hidden flex justify-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};
