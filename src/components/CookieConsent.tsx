import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { getConsent, setConsent, updateGoogleConsent, type ConsentState } from '../utils/consent';

/**
 * GDPR-compliant cookie consent banner with Google Consent Mode v2 support.
 * Ads only load after the visitor grants consent (see AdSenseSlot).
 */
export const CookieConsent: React.FC = () => {
  const [state, setState] = useState<ConsentState>(() => getConsent());

  useEffect(() => {
    // Only surface the banner while the visitor has not made a choice yet.
    const handler = () => setState(getConsent());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (state !== 'unset') return null;

  const decide = (choice: 'granted' | 'denied') => {
    setConsent(choice);
    updateGoogleConsent(choice);
    setState(choice);
  };

  return (
    <div
      role="dialog"
      aria-label="Thông báo cookie"
      className="fixed bottom-0 inset-x-0 z-[60] p-3 sm:p-4"
    >
      <div className="mx-auto max-w-4xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Cookie className="w-5 h-5" />
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Chúng tôi dùng cookie để vận hành trang và — khi bạn đồng ý — để hiển thị quảng cáo
            Google AdSense phù hợp. Xem{' '}
            <Link to="/privacy" className="text-rose-400 underline hover:text-rose-300">
              Chính sách bảo mật
            </Link>{' '}
            của chúng tôi.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
          <button
            onClick={() => decide('denied')}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            Từ chối
          </button>
          <button
            onClick={() => decide('granted')}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg shadow-rose-500/20 transition"
          >
            Đồng ý tất cả
          </button>
        </div>
      </div>
    </div>
  );
};