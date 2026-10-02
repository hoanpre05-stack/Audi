import React, { useState } from 'react';
import {
  TypographyConfig,
  BackgroundConfig,
  VisualizerConfig,
  FontId,
  KineticEffect,
  BackgroundEffect,
  ColorFilter,
  VisualizerType,
  VideoLayoutMode,
  GenerativeLayout,
} from '../types';
import {
  Type,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Palette,
  Activity,
  Check,
  Layout,
  Tv,
  Clapperboard,
  Disc3,
  Camera,
  Layers,
  Wand2,
} from 'lucide-react';

interface StyleCustomizerProps {
  typography: TypographyConfig;
  background: BackgroundConfig;
  visualizer: VisualizerConfig;
  layoutMode?: VideoLayoutMode;
  generativeLayout?: GenerativeLayout;
  channelLogoText?: string;
  onOpenAiDirector?: () => void;
  onUpdateTypography: (typo: TypographyConfig) => void;
  onUpdateBackground: (bg: BackgroundConfig) => void;
  onUpdateVisualizer: (vis: VisualizerConfig) => void;
  onUpdateLayoutMode?: (mode: VideoLayoutMode) => void;
  onUpdateGenerativeLayout?: (layout: GenerativeLayout) => void;
  onUpdateChannelLogo?: (logo: string) => void;
}

const FONTS: { id: FontId; name: string; preview: string; category: string }[] = [
  { id: 'Syne', name: 'Syne', preview: 'Modern Indie', category: 'Avant-garde' },
  { id: 'Bebas Neue', name: 'Bebas Neue', preview: 'BOLD URBAN', category: 'Punchy' },
  { id: 'Playfair Display', name: 'Playfair', preview: 'Cinematic Serif', category: 'Luxury' },
  { id: 'Cinzel', name: 'Cinzel', preview: 'EPIC ROYAL', category: 'Cinematic' },
  { id: 'Caveat', name: 'Caveat', preview: 'Handwritten chill', category: 'Handwriting' },
  { id: 'Dancing Script', name: 'Dancing', preview: 'Romantic Calligraphy', category: 'Script' },
  { id: 'Space Grotesk', name: 'Space Grotesk', preview: 'Techno Lo-Fi', category: 'Modern' },
  { id: 'Montserrat', name: 'Montserrat', preview: 'Clean Aesthetic', category: 'Clean' },
  { id: 'Righteous', name: 'Righteous', preview: '80s Synthwave', category: 'Retro' },
  { id: 'Orbitron', name: 'Orbitron', preview: 'FUTURISTIC', category: 'Sci-Fi' },
  { id: 'Lobster', name: 'Lobster', preview: 'Retro Funky', category: 'Vintage' },
  { id: 'Bangers', name: 'Bangers', preview: 'COMIC POP', category: 'Cartoon' },
];

const KINETIC_EFFECTS: { id: KineticEffect; title: string; desc: string; icon: string; tag?: string }[] = [
  {
    id: 'emotional_soul',
    title: 'Sâu Lắng & Nhịp Thở',
    desc: 'Từng chữ hít thở nhẹ nhàng, hào quang ấm áp da diết',
    icon: '🕯️',
    tag: 'Cảm Xúc',
  },
  {
    id: 'stardust_sparkle',
    title: 'Ánh Sao & Bụi Cảm Xúc',
    desc: 'Tia sáng lấp lánh & bụi sao bay lơ lửng khi ngân nga',
    icon: '✨',
    tag: 'Hot Ballad',
  },
  {
    id: 'tears_ripple',
    title: 'Gợn Sóng Tâm Trạng',
    desc: 'Làn sóng cảm xúc rung rinh như mặt nước mùa thu',
    icon: '💧',
    tag: 'Trầm Lắng',
  },
  {
    id: 'dreamy_glow',
    title: 'Mộng Mơ Bay Bổng',
    desc: 'Chữ tỏa sáng chuyển màu đa tầng mờ ảo điện ảnh',
    icon: '🌸',
    tag: 'Chill MV',
  },
  {
    id: 'karaoke_glow',
    title: 'Karaoke Spotify Flow',
    desc: 'Vuốt màu mượt từ trái qua phải chuẩn MV chuyên nghiệp',
    icon: '🎤',
    tag: 'Tiêu Chuẩn',
  },
  {
    id: 'beat_bounce',
    title: 'Beat Bounce',
    desc: 'Chữ nhún nhảy tưng bừng theo nhịp Bass',
    icon: '⚡',
  },
  {
    id: 'wave_float',
    title: 'Wave Float',
    desc: 'Từng chữ cái lượn sóng nhấp nhô mềm mại',
    icon: '🌊',
  },
  {
    id: 'neon_pulse',
    title: 'Neon Pulse',
    desc: 'Đèn Neon Cyberpunk viền kép phát sáng',
    icon: '🔮',
  },
  {
    id: 'cinematic_fade',
    title: 'Cinematic Fade',
    desc: 'Mờ ảo & trượt nhẹ nhàng chuẩn MV ca nhạc',
    icon: '🎬',
  },
  {
    id: 'typewriter',
    title: 'Typewriter',
    desc: 'Hiệu ứng gõ chữ kèm con trỏ nhấp nháy',
    icon: '⌨️',
  },
];

const BG_EFFECTS: { id: BackgroundEffect; title: string; desc: string }[] = [
  { id: 'ken_burns', title: 'Ken Burns', desc: 'Lia máy & phóng to từ từ mượt mà' },
  { id: 'bass_pulse', title: 'Bass Pulse', desc: 'Ảnh giật nảy theo tiếng trống Bass' },
  { id: 'vinyl_spin', title: 'Vinyl Spin', desc: 'Đĩa than xoay tròn cổ điển' },
  { id: 'particles_glow', title: 'Hạt đom đóm', desc: 'Bụi phát sáng lơ lửng huyền ảo' },
  { id: 'clean_cinematic', title: 'Tối giản', desc: 'Gọn gàng với hiệu ứng tối góc (vignette)' },
];

const COLOR_FILTERS: { id: ColorFilter; title: string; bg: string }[] = [
  { id: 'none', title: 'Gốc', bg: 'bg-zinc-800' },
  { id: 'sunset', title: 'Hoàng hôn', bg: 'bg-gradient-to-r from-rose-500 to-amber-500' },
  { id: 'cyberpunk', title: 'Cyberpunk', bg: 'bg-gradient-to-r from-cyan-400 to-fuchsia-500' },
  { id: 'cinematic_teal', title: 'Teal & Orange', bg: 'bg-gradient-to-r from-teal-500 to-orange-500' },
  { id: 'vintage_warm', title: 'Vintage', bg: 'bg-amber-700' },
  { id: 'moody_bw', title: 'Đen Trắng', bg: 'bg-zinc-600' },
];

const PALETTE_PRESETS = [
  {
    name: 'RIN Music (Teal & Vàng)',
    desc: 'Chuẩn MV Quá Khứ Anh Không Thể Quên',
    highlight: '#38BDF8',
    secondary: '#94A3B8',
    text: '#FFFFFF',
    tag: 'Đề xuất',
  },
  {
    name: 'Cyberpunk Neon',
    desc: 'Hồng dạ quang & Xanh điện tử',
    highlight: '#F43F5E',
    secondary: '#67E8F9',
    text: '#FDE047',
    tag: 'Hot Trend',
  },
  {
    name: 'Vàng Hoàng Hôn',
    desc: 'Hổ phách ấm áp & Sang trọng',
    highlight: '#F59E0B',
    secondary: '#FDE68A',
    text: '#FEF3C7',
    tag: 'Ấm áp',
  },
  {
    name: 'Tím Mộng Mơ',
    desc: 'Tím khói chill indie lo-fi',
    highlight: '#C084FC',
    secondary: '#E9D5FF',
    text: '#FFFFFF',
    tag: 'Chill Lo-Fi',
  },
  {
    name: 'Xanh Lục Ngọc',
    desc: 'Bạc hà tươi sáng thanh thoát',
    highlight: '#10B981',
    secondary: '#A7F3D0',
    text: '#ECFDF5',
    tag: 'Tươi mát',
  },
  {
    name: 'Trắng Bạc Tối Giản',
    desc: 'Minimalism thanh lịch sạch sẽ',
    highlight: '#FFFFFF',
    secondary: '#94A3B8',
    text: '#E2E8F0',
    tag: 'Tối giản',
  },
];

const QUICK_COLORS = [
  '#38BDF8', // Cyan Teal (RIN Music)
  '#F43F5E', // Rose Pink
  '#F59E0B', // Amber Gold
  '#C084FC', // Purple Lilac
  '#10B981', // Emerald Mint
  '#FFFFFF', // Pure White
  '#FDA4AF', // Soft Rose
  '#94A3B8', // Slate Grey
];

const PRESET_BG_IMAGES = [
  { name: 'City Rain', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1080&q=80' },
  { name: 'Cyber Neon', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1080&q=80' },
  { name: 'Coffee Sunset', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1080&q=80' },
  { name: 'Sunset Horizon', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1080&q=80' },
  { name: 'Cosmic Sky', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1080&q=80' },
];

export const StyleCustomizer: React.FC<StyleCustomizerProps> = ({
  typography,
  background,
  visualizer,
  layoutMode,
  generativeLayout,
  channelLogoText,
  onOpenAiDirector,
  onUpdateTypography,
  onUpdateBackground,
  onUpdateVisualizer,
  onUpdateLayoutMode,
  onUpdateGenerativeLayout,
  onUpdateChannelLogo,
}) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'typography' | 'background' | 'visualizer'>('layout');

  // Default generative layout helper
  const currentGen = generativeLayout || {
    artworkDisplay: {
      mode: 'side_card',
      shape: 'rounded_square',
      scale: 0.44,
      glowColor: typography.highlightColor || '#38BDF8',
      glowBlur: 24,
      showViewfinderCorners: true,
      showVinylGrooves: false,
      rotationEffect: 'tilt_breath',
    },
    lyricsDisplay: {
      placement: 'right_side',
      alignment: 'left',
      linesCount: 4,
      showActiveAccentBar: true,
      accentBarColor: typography.highlightColor || '#38BDF8',
    },
    visualizerPlacement: {
      position: 'under_artwork',
      style: 'bars',
      color: typography.highlightColor || '#38BDF8',
    },
    branding: {
      showTrackBadge: true,
      trackBadgeText: channelLogoText || 'AI DIRECTOR CUT',
      titlePlacement: 'above_lyrics',
    },
  };

  const updateGenLayout = (updater: (prev: GenerativeLayout) => GenerativeLayout) => {
    const next = updater(currentGen);
    if (onUpdateGenerativeLayout) {
      onUpdateGenerativeLayout(next);
    }
    if (onUpdateLayoutMode) {
      onUpdateLayoutMode('generative_ai');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
      {/* AI Creative Director Callout Banner */}
      {onOpenAiDirector && (
        <div className="p-3 bg-gradient-to-r from-purple-950/80 via-zinc-900/90 to-rose-950/80 border-b border-zinc-800/80">
          <button
            onClick={onOpenAiDirector}
            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 via-rose-500/20 to-amber-500/20 hover:from-purple-600/30 hover:to-amber-500/30 border border-purple-500/40 hover:border-purple-400 text-left flex items-center justify-between group transition active:scale-[0.98] cursor-pointer shadow-lg shadow-purple-950/30"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 via-rose-500 to-amber-400 flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:scale-105 transition">
                <Clapperboard className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-purple-200 transition">
                    ✨ AI Đạo Diễn Sáng Tạo
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-purple-500/30 text-purple-300 border border-purple-400/30">
                    TỰ DO
                  </span>
                </div>
                <p className="text-[10.5px] text-zinc-400 group-hover:text-zinc-300 transition">
                  Để AI tự do phân tích ca từ & tạo phong cách độc bản
                </p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition shrink-0" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-900/90 p-1">
        <button
          onClick={() => setActiveTab('layout')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'layout'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layout className="w-3.5 h-3.5 text-amber-400" />
          <span>Bố cục Video</span>
        </button>

        <button
          onClick={() => setActiveTab('typography')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'typography'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Type className="w-3.5 h-3.5 text-rose-400" />
          <span>Chữ & Font</span>
        </button>

        <button
          onClick={() => setActiveTab('background')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'background'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
          <span>Nền & Màu</span>
        </button>

        <button
          onClick={() => setActiveTab('visualizer')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'visualizer'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sóng âm</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* TAB 0: AI GENERATIVE LAYOUT STUDIO (NO COOKIE-CUTTER TEMPLATES) */}
        {activeTab === 'layout' && (
          <div className="space-y-4">
            {/* AI Director Interactive Trigger */}
            {onOpenAiDirector && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-rose-900/30 border border-purple-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI Tự Do Thiết Kế Giao Diện</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    BESPOKE AI
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Thay vì dùng mẫu có sẵn, AI sẽ tự do phân tích ca từ & cảm xúc của bức ảnh để tạo ra bố cục, vị trí và chuyển động độc nhất.
                </p>
                <button
                  onClick={onOpenAiDirector}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-rose-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-200" />
                  <span>Yêu Cầu AI Thiết Kế Giao Diện Mới</span>
                </button>
              </div>
            )}

            {/* 1. Freeform AI Concept Inspiration Badges */}
            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Gợi ý hướng cảm xúc nghệ thuật cho AI</span>
                </span>
                <span className="text-[10px] text-amber-400 font-bold">
                  ✨ AI Tự Do Sáng Tạo 100%
                </span>
              </label>

              <p className="text-[11px] text-zinc-400 mb-2.5 leading-relaxed">
                Bấm vào một phong cách bất kỳ bên dưới để AI tự thiết kế tọa độ 2D, hiệu ứng hình ảnh và nhịp chuyển động độc bản dành riêng cho bài hát của bạn:
              </p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'vinyl',
                    shape: 'circle_vinyl',
                    title: 'Đĩa Than Vinyl 3D',
                    desc: 'Bố cục Đĩa Than Xoay 3D',
                    icon: '💿',
                  },
                  {
                    id: 'polaroid',
                    shape: 'polaroid',
                    title: 'Khung Kỷ Niệm Polaroid',
                    desc: 'Bố cục Ảnh Chụp Nghiêng',
                    icon: '📷',
                  },
                  {
                    id: 'cinema',
                    shape: 'frame',
                    title: 'Điện Ảnh Hollywood',
                    desc: 'Bố cục Phim Tràn Viền 2.35:1',
                    icon: '🎬',
                  },
                  {
                    id: 'split',
                    shape: 'rounded_square',
                    title: 'Tách Tầng Toàn Cảnh',
                    desc: 'Bố cục Tách Tầng Trên / Dưới',
                    icon: '📐',
                  },
                  {
                    id: 'cyberpunk',
                    shape: 'rounded_square',
                    title: 'Cyberpunk Hologram',
                    desc: 'Bố cục Radar Cyber Tương Lai',
                    icon: '🔮',
                  },
                  {
                    id: 'studio_card',
                    shape: 'rounded_square',
                    title: 'Thẻ Kính Nổi Studio',
                    desc: 'Bố cục 2 Cột Chuẩn MV',
                    icon: '🖼️',
                  },
                ].map((m) => {
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (onOpenAiDirector) {
                          onOpenAiDirector();
                        } else {
                          updateGenLayout((prev) => ({
                            ...prev,
                            isFreeformAi: true,
                            artworkDisplay: {
                              ...prev.artworkDisplay,
                              shape: m.shape as any,
                            },
                          }));
                        }
                      }}
                      className="p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-800/60 hover:border-purple-500/50 text-left transition flex items-start gap-2 cursor-pointer group"
                    >
                      <span className="text-xl mt-0.5 group-hover:scale-110 transition-transform">{m.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 transition-colors">
                            {m.title}
                          </span>
                          <Sparkles className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-[10px] text-zinc-400 block line-clamp-1 mt-0.5">
                          {m.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Lyrics Placement */}
            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-purple-400" />
                <span>Vị trí lời bài hát (Lyrics Placement)</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'right_side', title: 'Cột bên cạnh' },
                  { id: 'bottom_cinematic', title: 'Dưới cùng điện ảnh' },
                  { id: 'center_stage', title: 'Giữa sân khấu' },
                ].map((lp) => {
                  const isCur = currentGen.lyricsDisplay.placement === lp.id;
                  return (
                    <button
                      key={lp.id}
                      onClick={() =>
                        updateGenLayout((prev) => ({
                          ...prev,
                          lyricsDisplay: {
                            ...prev.lyricsDisplay,
                            placement: lp.id as any,
                            alignment: lp.id === 'right_side' ? 'left' : 'center',
                          },
                        }))
                      }
                      className={`p-2 rounded-xl border text-center transition text-xs font-bold ${
                        isCur
                          ? 'bg-purple-500/20 border-purple-500 text-purple-200 ring-1 ring-purple-500/40 shadow-sm'
                          : 'bg-zinc-950/40 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      {lp.title}
                    </button>
                  );
                })}
              </div>

              {/* Number of Visible Lyric Lines */}
              <div className="mt-3 pt-3 border-t border-zinc-800/60">
                <span className="text-[11px] font-bold text-zinc-300 mb-2 flex items-center justify-between">
                  <span>Số dòng ca từ hiển thị cùng lúc:</span>
                  <span className="text-purple-400 font-mono text-[10px]">
                    {currentGen.lyricsDisplay.linesCount || 3} dòng
                  </span>
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { count: 1, label: '1 Dòng', desc: 'Tập trung' },
                    { count: 2, label: '2 Dòng', desc: 'Gọn gàng' },
                    { count: 3, label: '3 Dòng', desc: 'Cân bằng' },
                    { count: 4, label: '4 Dòng', desc: 'Trọn vẹn' },
                  ].map((l) => {
                    const isCur = (currentGen.lyricsDisplay.linesCount || 3) === l.count;
                    return (
                      <button
                        key={l.count}
                        onClick={() =>
                          updateGenLayout((prev) => ({
                            ...prev,
                            lyricsDisplay: {
                              ...prev.lyricsDisplay,
                              linesCount: l.count,
                            },
                          }))
                        }
                        className={`py-2 px-1 rounded-xl border text-center transition ${
                          isCur
                            ? 'bg-gradient-to-tr from-purple-600 to-rose-600 text-white border-purple-400 font-bold shadow-md shadow-purple-600/25'
                            : 'bg-zinc-950/50 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                        }`}
                      >
                        <span className="text-xs block">{l.label}</span>
                        <span className="text-[9px] text-zinc-400 block opacity-80">{l.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Artwork Animation & Visual Elements */}
            <div className="bg-zinc-950/50 p-3.5 rounded-2xl border border-zinc-800/80 space-y-3">
              <label className="text-xs font-bold text-zinc-300 block">
                Chuyển động & Chi tiết nghệ thuật
              </label>

              {/* Rotation / Breath Motion */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-zinc-400 block font-medium">
                  Hiệu ứng chuyển động của bức ảnh:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'tilt_breath', label: 'Nghiêng thở êm ái' },
                    { id: 'slow_spin', label: 'Xoay tròn đĩa' },
                    { id: 'none', label: 'Giữ tĩnh' },
                  ].map((r) => {
                    const isCur = currentGen.artworkDisplay.rotationEffect === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() =>
                          updateGenLayout((prev) => ({
                            ...prev,
                            artworkDisplay: {
                              ...prev.artworkDisplay,
                              rotationEffect: r.id as any,
                            },
                          }))
                        }
                        className={`p-1.5 rounded-lg border text-center text-[11px] font-semibold transition ${
                          isCur
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Viewfinder brackets & Accent Bar toggles */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() =>
                    updateGenLayout((prev) => ({
                      ...prev,
                      artworkDisplay: {
                        ...prev.artworkDisplay,
                        showViewfinderCorners: !prev.artworkDisplay.showViewfinderCorners,
                      },
                    }))
                  }
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                    currentGen.artworkDisplay.showViewfinderCorners
                      ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span>Góc ngắm Viewfinder</span>
                  <span className="text-[10px]">{currentGen.artworkDisplay.showViewfinderCorners ? 'BẬT' : 'TẮT'}</span>
                </button>

                <button
                  onClick={() =>
                    updateGenLayout((prev) => ({
                      ...prev,
                      lyricsDisplay: {
                        ...prev.lyricsDisplay,
                        showActiveAccentBar: !prev.lyricsDisplay.showActiveAccentBar,
                      },
                    }))
                  }
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                    currentGen.lyricsDisplay.showActiveAccentBar
                      ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span>Vạch sáng câu hát</span>
                  <span className="text-[10px]">{currentGen.lyricsDisplay.showActiveAccentBar ? 'BẬT' : 'TẮT'}</span>
                </button>
              </div>

              {/* Lines count */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-zinc-400 block font-medium">
                  Số dòng lời hiển thị cùng lúc:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 4].map((cnt) => {
                    const isCur = (currentGen.lyricsDisplay.linesCount || 4) === cnt;
                    return (
                      <button
                        key={cnt}
                        onClick={() =>
                          updateGenLayout((prev) => ({
                            ...prev,
                            lyricsDisplay: {
                              ...prev.lyricsDisplay,
                              linesCount: cnt,
                            },
                          }))
                        }
                        className={`p-1.5 rounded-lg border text-center text-xs font-bold transition ${
                          isCur
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {cnt} dòng
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Custom Channel Watermark / Logo Text */}
            <div className="bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
              <label className="text-xs font-bold text-zinc-300 block">
                Tên thương hiệu / Logo góc video (Watermark)
              </label>
              <input
                type="text"
                value={channelLogoText || 'AI DIRECTOR CUT'}
                onChange={(e) => onUpdateChannelLogo && onUpdateChannelLogo(e.target.value)}
                placeholder="VD: ✦ AI MASTERPIECE, TÊN BẠN..."
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
              />
              <p className="text-[11px] text-zinc-500">
                Hiển thị góc trên để định danh bản quyền video của bạn.
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: TYPOGRAPHY & KINETIC FX */}
        {activeTab === 'typography' && (
          <div className="space-y-5">
            {/* Kinetic Typography Effects */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Hiệu ứng cảm xúc từng chữ (Kinetic FX)</span>
                </label>
                <span className="text-[10px] text-amber-400 font-medium">
                  {typography.kineticEffect === 'emotional_soul' || typography.kineticEffect === 'stardust_sparkle'
                    ? '✨ Kiểu Cảm Xúc'
                    : '10 Kiểu Chuyển Động'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {KINETIC_EFFECTS.map((eff) => {
                  const isSelected = typography.kineticEffect === eff.id;
                  return (
                    <button
                      key={eff.id}
                      onClick={() =>
                        onUpdateTypography({ ...typography, kineticEffect: eff.id })
                      }
                      className={`text-left p-2.5 rounded-xl border transition flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-rose-500/15 border-rose-500/80 shadow-md shadow-rose-500/10 ring-1 ring-rose-500/30'
                          : 'bg-zinc-950/40 hover:bg-zinc-800/60 border-zinc-800/80'
                      }`}
                    >
                      <span className="text-xl mt-0.5">{eff.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-rose-300' : 'text-zinc-200'
                            }`}
                          >
                            {eff.title}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {eff.tag && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                                  isSelected
                                    ? 'bg-rose-500/30 text-rose-200'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {eff.tag}
                              </span>
                            )}
                            {isSelected && <Check className="w-3 h-3 text-rose-400" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                          {eff.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Granular Lyric Animation Sliders & Toggles */}
              <div className="mt-3 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-rose-400" />
                    <span>Chỉnh chi tiết Animation của chữ</span>
                  </span>
                  <span className="text-[10px] text-rose-400 font-mono font-bold">
                    Tùy biến cao
                  </span>
                </div>

                {/* 1. Word Bounce Scale Peak */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Độ nảy / Phóng to khi hát:</span>
                    <span className="font-mono text-rose-400 font-bold">
                      {((typography.wordBounceScale ?? 1.10) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="1.35"
                    step="0.02"
                    value={typography.wordBounceScale ?? 1.10}
                    onChange={(e) =>
                      onUpdateTypography({
                        ...typography,
                        wordBounceScale: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-rose-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>100% (Phẳng)</span>
                    <span>115% (Chuẩn MV)</span>
                    <span>135% (Nảy mạnh)</span>
                  </div>
                </div>

                {/* 2. Word Tilt Angle */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Góc xoay nghiêng theo nhịp:</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {typography.wordTiltAngle ?? 3}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={typography.wordTiltAngle ?? 3}
                    onChange={(e) =>
                      onUpdateTypography({
                        ...typography,
                        wordTiltAngle: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500">
                    <span>0° (Thẳng đứng)</span>
                    <span>3° (Nghiêng nhẹ)</span>
                    <span>10° (Nhảy múa)</span>
                  </div>
                </div>

                {/* 3. Toggles: Bass Pulse & Sparkle */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60">
                  <button
                    onClick={() =>
                      onUpdateTypography({
                        ...typography,
                        pulseWithBass: !(typography.pulseWithBass ?? true),
                      })
                    }
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                      typography.pulseWithBass ?? true
                        ? 'bg-rose-500/15 border-rose-500/60 text-rose-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span>⚡ Nhún theo Bass</span>
                    <span className="text-[10px] font-bold">
                      {typography.pulseWithBass ?? true ? 'BẬT' : 'TẮT'}
                    </span>
                  </button>

                  <button
                    onClick={() =>
                      onUpdateTypography({
                        ...typography,
                        emotionalSparkles: !typography.emotionalSparkles,
                      })
                    }
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                      typography.emotionalSparkles || typography.kineticEffect === 'stardust_sparkle'
                        ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span>✨ Bụi sao lấp lánh</span>
                    <span className="text-[10px] font-bold">
                      {typography.emotionalSparkles || typography.kineticEffect === 'stardust_sparkle' ? 'BẬT' : 'TẮT'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Artistic Font Selection */}
            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-purple-400" />
                <span>Font chữ nghệ thuật</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FONTS.map((font) => {
                  const isSelected = typography.fontFamily === font.id;
                  return (
                    <button
                      key={font.id}
                      onClick={() =>
                        onUpdateTypography({ ...typography, fontFamily: font.id })
                      }
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-500 text-white'
                          : 'bg-zinc-950/40 hover:bg-zinc-800/60 border-zinc-800/80 text-zinc-300'
                      }`}
                    >
                      <span
                        className="text-base font-semibold truncate w-full"
                        style={{ fontFamily: font.id }}
                      >
                        {font.preview}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {font.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Palette */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Bảng phối màu chữ & Hiệu ứng</span>
              </label>

              {/* 1. Curated 1-Click Themes */}
              <div>
                <span className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
                  Bộ màu thiết kế sẵn (1-Click Theme)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PALETTE_PRESETS.map((pal, idx) => {
                    const isSelected =
                      typography.highlightColor.toLowerCase() === pal.highlight.toLowerCase();

                    return (
                      <button
                        key={idx}
                        onClick={() =>
                          onUpdateTypography({
                            ...typography,
                            highlightColor: pal.highlight,
                            secondaryColor: pal.secondary,
                            textColor: pal.text,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                            : 'bg-zinc-950/40 hover:bg-zinc-800/60 border-zinc-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-zinc-200 truncate">
                            {pal.name}
                          </span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                            {pal.tag}
                          </span>
                        </div>

                        {/* Color swatches preview bar */}
                        <div className="flex items-center gap-1.5 w-full mt-0.5">
                          <div
                            className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                            style={{ backgroundColor: pal.highlight }}
                            title="Màu hát"
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                            style={{ backgroundColor: pal.secondary }}
                            title="Màu phụ"
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                            style={{ backgroundColor: pal.text }}
                            title="Màu cơ bản"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Detailed Color Pickers with Quick Circles */}
              <div className="space-y-2.5 pt-1">
                {/* Active Highlight Color */}
                <div className="bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">
                      Màu câu/từ đang hát (Active Glow)
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={typography.highlightColor}
                        onChange={(e) =>
                          onUpdateTypography({
                            ...typography,
                            highlightColor: e.target.value,
                          })
                        }
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-zinc-300 uppercase">
                        {typography.highlightColor}
                      </span>
                    </div>
                  </div>
                  {/* Quick Dots */}
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500">Nhanh:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {QUICK_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() =>
                            onUpdateTypography({ ...typography, highlightColor: c })
                          }
                          className={`w-5 h-5 rounded-full border transition hover:scale-110 ${
                            typography.highlightColor.toLowerCase() === c.toLowerCase()
                              ? 'ring-2 ring-white scale-110 border-white'
                              : 'border-zinc-700'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Secondary / Past words color */}
                <div className="bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">
                      Màu từ chờ hát / đã hát (Secondary)
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={typography.secondaryColor}
                        onChange={(e) =>
                          onUpdateTypography({
                            ...typography,
                            secondaryColor: e.target.value,
                          })
                        }
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-zinc-300 uppercase">
                        {typography.secondaryColor}
                      </span>
                    </div>
                  </div>
                  {/* Quick Dots */}
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500">Nhanh:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {QUICK_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() =>
                            onUpdateTypography({ ...typography, secondaryColor: c })
                          }
                          className={`w-5 h-5 rounded-full border transition hover:scale-110 ${
                            typography.secondaryColor.toLowerCase() === c.toLowerCase()
                              ? 'ring-2 ring-white scale-110 border-white'
                              : 'border-zinc-700'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Base text color for other lines */}
                <div className="bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">
                      Màu các câu khác trong đoạn (Inactive)
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={typography.textColor}
                        onChange={(e) =>
                          onUpdateTypography({
                            ...typography,
                            textColor: e.target.value,
                          })
                        }
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-zinc-300 uppercase">
                        {typography.textColor}
                      </span>
                    </div>
                  </div>
                  {/* Quick Dots */}
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500">Nhanh:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {QUICK_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() =>
                            onUpdateTypography({ ...typography, textColor: c })
                          }
                          className={`w-5 h-5 rounded-full border transition hover:scale-110 ${
                            typography.textColor.toLowerCase() === c.toLowerCase()
                              ? 'ring-2 ring-white scale-110 border-white'
                              : 'border-zinc-700'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Font Size & Text Case */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-zinc-300 font-medium">
                    Kích thước chữ
                  </span>
                  <span className="text-xs font-mono text-rose-400">
                    {typography.fontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="22"
                  max="60"
                  step="2"
                  value={typography.fontSize}
                  onChange={(e) =>
                    onUpdateTypography({
                      ...typography,
                      fontSize: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-300 font-medium">
                  Chữ IN HOA
                </span>
                <button
                  onClick={() =>
                    onUpdateTypography({
                      ...typography,
                      textCase:
                        typography.textCase === 'uppercase'
                          ? 'normal'
                          : 'uppercase',
                    })
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    typography.textCase === 'uppercase'
                      ? 'bg-rose-500 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {typography.textCase === 'uppercase' ? 'BẬT' : 'TẮT'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BACKGROUND & FILTERS */}
        {activeTab === 'background' && (
          <div className="space-y-5">
            {/* Background Motion Effects */}
            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Hiệu ứng chuyển động ảnh nền</span>
              </label>
              <div className="space-y-1.5">
                {BG_EFFECTS.map((eff) => {
                  const isSelected = background.effect === eff.id;
                  return (
                    <button
                      key={eff.id}
                      onClick={() =>
                        onUpdateBackground({ ...background, effect: eff.id })
                      }
                      className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-500/80 text-white'
                          : 'bg-zinc-950/40 hover:bg-zinc-800/60 border-zinc-800/80 text-zinc-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{eff.title}</div>
                        <div className="text-[11px] text-zinc-400">
                          {eff.desc}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Filter Presets */}
            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-rose-400" />
                <span>Bộ lọc màu điện ảnh (Color Grade)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_FILTERS.map((f) => {
                  const isSelected = background.filter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() =>
                        onUpdateBackground({ ...background, filter: f.id })
                      }
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/10'
                          : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40'
                      }`}
                    >
                      <div className={`w-full h-8 rounded-lg ${f.bg}`} />
                      <span className="text-[11px] font-medium text-zinc-300">
                        {f.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dim Opacity Slider */}
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-zinc-300 font-medium">
                  Độ tối nền (Làm nổi chữ)
                </span>
                <span className="text-xs font-mono text-purple-400">
                  {Math.round(background.dimOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.85"
                step="0.05"
                value={background.dimOpacity}
                onChange={(e) =>
                  onUpdateBackground({
                    ...background,
                    dimOpacity: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-purple-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Curated Presets Images */}
            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 block">
                Ảnh nền tuyển chọn nghệ thuật
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_BG_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      onUpdateBackground({ ...background, imageUrl: img.url })
                    }
                    className="relative group rounded-xl overflow-hidden aspect-video border border-zinc-800 hover:border-rose-500 transition"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1 text-center">
                      <span className="text-[10px] font-semibold text-white drop-shadow">
                        {img.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VISUALIZER */}
        {activeTab === 'visualizer' && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Kiểu sóng âm (Equalizer Type)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'bars', title: 'Thanh phổ nhạc', desc: 'Equalizer đáy màn hình' },
                  { id: 'wave', title: 'Sóng Sine', desc: 'Đường sóng lượn dẻo' },
                  { id: 'circle', title: 'Vòng tròn đĩa', desc: 'Tỏa tròn xung quanh tâm' },
                  { id: 'none', title: 'Tắt sóng âm', desc: 'Không hiển thị' },
                ].map((vis) => {
                  const isSelected = visualizer.type === vis.id;
                  return (
                    <button
                      key={vis.id}
                      onClick={() =>
                        onUpdateVisualizer({
                          ...visualizer,
                          type: vis.id as VisualizerType,
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500 text-white'
                          : 'bg-zinc-950/40 hover:bg-zinc-800/60 border-zinc-800/80 text-zinc-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{vis.title}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {vis.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visualizer Color */}
            {visualizer.type !== 'none' && (
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-300 font-medium block mb-2">
                  Màu sắc sóng âm
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={visualizer.color}
                    onChange={(e) =>
                      onUpdateVisualizer({
                        ...visualizer,
                        color: e.target.value,
                      })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-zinc-300 uppercase">
                    {visualizer.color}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
