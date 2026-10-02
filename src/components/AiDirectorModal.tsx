import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Wand2,
  Clapperboard,
  Loader2,
  Palette,
  Compass,
  Check,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { ProjectData } from '../types';

interface AiDirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onApplyDesign: (designedProject: Partial<ProjectData>) => void;
}

interface GeneratedDesign {
  conceptName: string;
  conceptMood: string;
  directorNotes: string;
  layoutMode: 'generative_ai';
  generativeLayout?: any;
  channelLogoText?: string;
  typography: any;
  background: any;
  visualizer: any;
}

const CREATIVE_PRESETS = [
  {
    icon: '💿',
    title: 'Đĩa Than Vinyl Turntable Lounge',
    layoutBadge: 'Bố cục Đĩa Than Xoay 3D',
    prompt: 'Bố cục máy quay đĩa than Vinyl cổ điển xoay tròn ở trung tâm, cần gạt kim loại đọc nhạc có đèn LED, vòng sóng âm neon bao quanh đĩa, lời bài hát nổi bật phong cách Studio Lounge ấm áp sang trọng',
  },
  {
    icon: '📷',
    title: 'Khung Kỷ Niệm Polaroid 90s',
    layoutBadge: 'Bố cục Ảnh Chụp Nghiêng',
    prompt: 'Bố cục ảnh Polaroid đặt nghiêng nghệ thuật kèm băng dính dán góc Washi Tape, tên bài hát viết tay chân thực, ca từ tỏa sáng mộng mơ lãng mạn',
  },
  {
    icon: '🎬',
    title: 'Điện Ảnh Hollywood Letterbox',
    layoutBadge: 'Bố cục Phim Tràn Viền 2.35:1',
    prompt: 'Bố cục phim điện ảnh 2.35:1 với dải viền đen trên dưới và đường kẻ laser, hiệu ứng lia máy chậm Ken Burns, ca từ phóng to giữa trung tâm kèm bụi sao Stardust',
  },
  {
    icon: '📐',
    title: 'Tách Tầng Toàn Cảnh Horizon',
    layoutBadge: 'Bố cục Tách Tầng Trên / Dưới',
    prompt: 'Bố cục ảnh góc rộng trải ngang tầng trên, dải sóng âm chạy ngang phân tầng, ca từ trượt dài tầng dưới phong cách bìa tạp chí âm nhạc hiện đại',
  },
  {
    icon: '🔮',
    title: 'Cyberpunk Hologram Terminal',
    layoutBadge: 'Bố cục Radar Cyber Tương Lai',
    prompt: 'Bố cục giao diện tương lai viễn tưởng: radar sóng âm quét tròn quanh ảnh, góc ngắm HUD camera, chữ in hoa tương phản cao dập mạnh theo nhịp bass',
  },
  {
    icon: '🖼️',
    title: 'Thẻ Kính Nổi Studio 2 Cột',
    layoutBadge: 'Bố cục 2 Cột Chuẩn MV',
    prompt: 'Bố cục 2 cột hiện đại: thẻ ảnh kính mờ phản quang có góc ngắm Viewfinder, thanh đo Equalizer bên dưới, lời bài hát trượt mượt mà phong cách RIN Music',
  },
];

export const AiDirectorModal: React.FC<AiDirectorModalProps> = ({
  isOpen,
  onClose,
  project,
  onApplyDesign,
}) => {
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedDesign | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    setIsLoading(true);
    setError(null);

    const promptToSend = customPrompt !== undefined ? customPrompt : userPrompt;

    try {
      const res = await fetch('/api/ai-design-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songTitle: project.title,
          artist: project.artist,
          lyrics: project.lyrics,
          userVisionPrompt: promptToSend,
          aspectRatio: project.aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể kết nối với AI Đạo Diễn.');
      }

      setResult(data.data);
    } catch (err: any) {
      console.error('AI Design error:', err);
      setError(err?.message || 'Có lỗi xảy ra khi tạo phong cách video.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApplyDesign({
      layoutMode: 'generative_ai',
      generativeLayout: result.generativeLayout,
      typography: {
        ...project.typography,
        ...result.typography,
      },
      background: {
        ...project.background,
        ...result.background,
        imageUrl: project.background.imageUrl || result.background.imageUrl,
      },
      visualizer: {
        ...project.visualizer,
        ...result.visualizer,
      },
      channelLogoText: result.channelLogoText || project.channelLogoText,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">
                  AI Đạo Diễn Sáng Tạo Video
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Generative Studio
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                AI tự do phân tích ca từ & thiết kế phong cách chuyển động độc bản
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Creative Ideas */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-2.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>Gợi ý hướng cảm xúc nghệ thuật:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CREATIVE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUserPrompt(p.prompt);
                    handleGenerate(p.prompt);
                  }}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 hover:border-purple-500/50 text-left transition group"
                >
                  <span className="text-xl mt-0.5">{p.icon}</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 transition block truncate">
                      {p.title}
                    </span>
                    <span className="text-[10px] text-purple-400/90 font-medium block truncate mt-0.5">
                      {p.layoutBadge}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* User Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Ý tưởng đạo diễn của bạn (hoặc để trống để AI tự do sáng tạo):</span>
              </span>
              <span className="text-[10px] text-zinc-500">Tùy chọn</span>
            </label>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Ví dụ: 'Hãy thiết kế phong cách phim điện ảnh Hồng Kông thập niên 90, tông vàng ấm mờ ảo, chữ viết tay mềm mại bay bổng theo nốt nhạc...'"
              rows={3}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition resize-none leading-relaxed"
            />
          </div>

          {/* Action Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleGenerate()}
              disabled={isLoading}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-rose-600 to-amber-500 hover:from-purple-500 hover:via-rose-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-500/25 transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Đang Phân Tích Ca Từ & Thiết Kế Video...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {result ? '🎲 Sáng Tạo Concept Khác' : '✨ Để AI Tự Do Thiết Kế Video'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Generated Result Preview */}
          {result && (
            <div className="space-y-4 pt-2 border-t border-zinc-800/80 animate-fadeIn">
              <div className="bg-gradient-to-br from-zinc-950/90 to-zinc-900/90 border border-purple-500/30 rounded-2xl p-4.5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      {result.conceptName}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {result.conceptMood}
                  </span>
                </div>

                {/* Director's Vision Notes */}
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200/90 leading-relaxed italic">
                  "{result.directorNotes}"
                </div>

                {/* Harmonized Palette Preview */}
                <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div
                      className="w-5 h-5 rounded-full mx-auto mb-1 border border-white/20 shadow-sm"
                      style={{ backgroundColor: result.typography.highlightColor }}
                    />
                    <span className="text-[10px] text-zinc-400 block truncate">Highlight</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div
                      className="w-5 h-5 rounded-full mx-auto mb-1 border border-white/20 shadow-sm"
                      style={{ backgroundColor: result.typography.secondaryColor }}
                    />
                    <span className="text-[10px] text-zinc-400 block truncate">Secondary</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div
                      className="w-5 h-5 rounded-full mx-auto mb-1 border border-white/20 shadow-sm"
                      style={{ backgroundColor: result.visualizer.color }}
                    />
                    <span className="text-[10px] text-zinc-400 block truncate">Sóng Nhạc</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-center items-center">
                    <span className="text-[11px] font-bold text-zinc-200 truncate w-full block">
                      {result.typography.fontFamily}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">Font Chữ</span>
                  </div>
                </div>

                {/* Motion Specs */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-2 py-1 rounded-lg bg-zinc-800 text-[11px] text-zinc-300 font-medium">
                    ⚡ Chuyển động: <strong>{result.typography.kineticEffect}</strong>
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-zinc-800 text-[11px] text-zinc-300 font-medium">
                    🎬 Bố cục: <strong>{result.generativeLayout?.artworkDisplay?.mode ? `${result.generativeLayout.artworkDisplay.mode} (${result.generativeLayout.artworkDisplay.shape})` : 'AI Generative Bespoke'}</strong>
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-zinc-800 text-[11px] text-zinc-300 font-medium">
                    ✨ Hiệu ứng: <strong>{result.background.effect}</strong>
                  </span>
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleApply}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Áp Dụng Thiết Kế Này Lên Video Ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
