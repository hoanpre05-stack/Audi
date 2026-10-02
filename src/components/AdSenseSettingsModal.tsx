import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  ShieldAlert,
  CheckCircle,
  TrendingUp,
  Settings,
  Sparkles,
  CreditCard,
  Gift,
  Check,
} from 'lucide-react';

interface AdSenseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdSenseSettingsModal: React.FC<AdSenseSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [clientId, setClientId] = useState<string>('');
  const [slotHeader, setSlotHeader] = useState<string>('');
  const [slotSidebar, setSlotSidebar] = useState<string>('');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setClientId(localStorage.getItem('adsense_client_id') || '');
      setSlotHeader(localStorage.getItem('adsense_slot_header') || 'header-slot-123');
      setSlotSidebar(localStorage.getItem('adsense_slot_sidebar') || 'sidebar-slot-456');
      setIsPremium(localStorage.getItem('lyricstudio_premium_status') === 'active');
    }
  }, [isOpen]);

  const handleSaveSettings = () => {
    localStorage.setItem('adsense_client_id', clientId);
    localStorage.setItem('adsense_slot_header', slotHeader);
    localStorage.setItem('adsense_slot_sidebar', slotSidebar);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
      window.location.reload(); // Reload to initialize adsbygoogle tags
    }, 1500);
  };

  const handleSimulatePremium = () => {
    const nextPremium = !isPremium;
    setIsPremium(nextPremium);
    localStorage.setItem('lyricstudio_premium_status', nextPremium ? 'active' : 'inactive');
    onClose();
    window.location.reload(); // Reload to hide/show ads
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base text-white">
              Cài Đặt Kiếm Tiền Google AdSense & Doanh Thu
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-5 max-h-[75vh]">
          {/* AdSense Introduction Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <TrendingUp className="w-4 h-4" />
              <span>Ý TƯỞNG KIẾM TIỀN SÁNG TẠO</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Bạn có thể deploy ứng dụng này lên tên miền riêng (ví dụ: <code>lyricstudio-ai.vn</code>). 
              Gắn mã Publisher Google AdSense của bạn bên dưới để kích hoạt vị trí hiển thị quảng cáo thực tế,
              tự động biến lưu lượng người làm video thành tiền chảy về tài khoản ngân hàng của bạn!
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 block">
                Mã AdSense Publisher ID (data-ad-client)
              </label>
              <input
                type="text"
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
              />
              <span className="text-[10px] text-zinc-500 block">
                Nếu trống, hệ thống sẽ chạy ở chế độ Demo mô phỏng vị trí quảng cáo trực quan.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Slot Quảng cáo ngang (Top)
                </label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={slotHeader}
                  onChange={(e) => setSlotHeader(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Slot Quảng cáo dọc (Sidebar)
                </label>
                <input
                  type="text"
                  placeholder="1234567890"
                  value={slotSidebar}
                  onChange={(e) => setSlotSidebar(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Monetization Strategy Ideas List */}
          <div className="space-y-2 border-t border-zinc-800 pt-4">
            <h4 className="text-xs font-bold text-zinc-200">
              Chiến lược 3 Mô hình tạo doanh thu cho App này:
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li className="flex gap-2">
                <span className="text-amber-400 font-bold">1. AdSense Ads:</span>
                <span>Hiện biểu ngữ quảng cáo tự động khi người dùng đang chỉnh sửa lời bài hát, căn khớp sóng âm, hoặc tải video.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-400 font-bold">2. Premium Upgrade:</span>
                <span>Mô phỏng nâng cấp tài khoản đóng phí để tắt hoàn toàn quảng cáo và mở khóa các font chữ giới hạn.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400 font-bold">3. Affiliate Links:</span>
                <span>Chèn liên kết tiếp thị liên kết (Affiliate) các khóa học làm video, phụ kiện thu âm, microphone bên cạnh trang blog hướng dẫn.</span>
              </li>
            </ul>
          </div>

          {/* Unlock premium simulation button */}
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-purple-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Mô Phỏng Tài Khoản Premium</span>
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isPremium ? 'Đang kích hoạt gói Pro (Đã ẩn quảng cáo)' : 'Mở khóa Pro để kiểm tra chế độ không quảng cáo.'}
              </p>
            </div>
            <button
              onClick={handleSimulatePremium}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                isPremium
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/30'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isPremium ? 'Tắt Premium' : 'Kích Hoạt Pro'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            Hủy
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg shadow-rose-500/20 transition active:scale-95 flex items-center gap-1"
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Đã Lưu & Refresh!</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Lưu Cấu Hình</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
