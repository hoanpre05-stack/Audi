import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Download,
  Upload,
  Smartphone,
  Tv,
  Square,
  Music2,
  ChevronDown,
  Clapperboard,
  AudioWaveform,
  BookOpen,
  Zap,
} from 'lucide-react';
import { AspectRatio } from '../types';
import { SAMPLE_PROJECTS } from '../utils/sampleData';
import { EMPTY_ME, fetchMe, type MeState } from '../utils/viewer';

/** Daily AI allowance indicator with a link to upgrade. */
const QuotaBadge: React.FC = () => {
  const [me, setMe] = useState<MeState>(EMPTY_ME);

  useEffect(() => {
    void fetchMe().then(setMe);
  }, []);

  const exhausted = me.aiUsedToday >= me.aiLimit && me.quotaAvailable !== false;

  return (
    <Link
      to={me.plan === 'pro' ? '/account' : '/pricing'}
      className={`hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition ${
        exhausted
          ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
      }`}
      title={
        me.plan === 'pro'
          ? `Gói Pro — còn hiệu lực. Hạn mức hôm nay: ${me.aiUsedToday}/${me.aiLimit}`
          : `Lượt AI hôm nay: ${me.aiUsedToday}/${me.aiLimit}. Nâng cấp Pro để có 50 lượt và bỏ watermark.`
      }
    >
      <Zap className="w-3.5 h-3.5" />
      {me.aiUsedToday}/{me.aiLimit}
    </Link>
  );
};

interface NavbarProps {
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onOpenAiModal: () => void;
  onOpenAiDirector?: () => void;
  onOpenForcedAlignment?: () => void;
  onOpenAdSenseSettings?: () => void;
  onOpenExportModal: () => void;
  onSelectSample: (sampleId: string) => void;
  isExporting?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  aspectRatio,
  onAspectRatioChange,
  onOpenAiModal,
  onOpenAiDirector,
  onOpenForcedAlignment,
  onOpenAdSenseSettings,
  onOpenExportModal,
  onSelectSample,
  isExporting = false,
}) => {
  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand logo & tagline */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              LyricStudio AI
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              REMOTION ENGINE
            </span>
          </div>
          <p className="text-xs text-zinc-400 hidden sm:block">
            Tự động tách lời & thiết kế lyric video theo nhịp điệu
          </p>
        </div>
      </div>

      {/* Middle: Aspect Ratio & Sample Song switcher */}
      <div className="flex items-center gap-2">
        {/* Sample Song Preset Selector */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-800 transition">
            <Music2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Mẫu có sẵn</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>
          <div className="absolute right-0 top-full mt-1.5 w-60 p-1.5 bg-zinc-900/95 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-xl hidden group-hover:block z-50">
            <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Chọn bài mẫu thử nghiệm
            </div>
            {SAMPLE_PROJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSample(s.id)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 text-xs text-zinc-200 hover:text-white transition flex flex-col"
              >
                <span className="font-medium">{s.name}</span>
                <span className="text-[10px] text-zinc-500">{s.tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio Buttons */}
        <div className="hidden sm:flex items-center bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800/80">
          <button
            onClick={() => onAspectRatioChange('9:16')}
            title="TikTok / Reels / Shorts (9:16)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              aspectRatio === '9:16'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16</span>
          </button>
          <button
            onClick={() => onAspectRatioChange('16:9')}
            title="YouTube / Landscape (16:9)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              aspectRatio === '16:9'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>16:9</span>
          </button>
          <button
            onClick={() => onAspectRatioChange('1:1')}
            title="Instagram / Square (1:1)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              aspectRatio === '1:1'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>1:1</span>
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <Link
          to="/blog"
          className="hidden md:flex items-center gap-1 px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-800 transition"
          title="Blog & hướng dẫn làm lyric video"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden lg:inline ml-1">Blog</span>
        </Link>

        {/* Daily AI allowance. Self-contained so App.tsx stays untouched. */}
        <QuotaBadge />

        <Link
          to="/account"
          className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-800 transition"
          title="Tài khoản và gói Pro"
        >
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span className="hidden lg:inline ml-1">Pro</span>
        </Link>

        {onOpenForcedAlignment && (
          <button
            onClick={onOpenForcedAlignment}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/25 transition active:scale-95 cursor-pointer border border-sky-400/30"
          >
            <AudioWaveform className="w-4 h-4 text-sky-200 animate-pulse" />
            <span className="hidden md:inline">🌊 Căn Khớp Sóng Âm</span>
            <span className="md:hidden">🌊 Sóng Âm</span>
          </button>
        )}

        {onOpenAiDirector && (
          <button
            onClick={onOpenAiDirector}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-rose-500 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/25 transition active:scale-95 cursor-pointer border border-purple-400/30"
          >
            <Clapperboard className="w-4 h-4 text-amber-200" />
            <span className="hidden md:inline">✨ AI Đạo Diễn Sáng Tạo</span>
            <span className="md:hidden">✨ AI Đạo Diễn</span>
          </button>
        )}

        <button
          onClick={onOpenAiModal}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs sm:text-sm font-semibold transition active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>Tải Nhạc</span>
        </button>

        <button
          onClick={onOpenExportModal}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-rose-500/25 transition active:scale-95 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Video</span>
        </button>
      </div>
    </header>
  );
};
