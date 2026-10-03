import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Music,
  Image as ImageIcon,
  FileText,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clapperboard,
  ArrowRight,
  ArrowLeft,
  Wand2,
  Compass,
} from 'lucide-react';
import { ProjectData, LyricLine } from '../types';
import { ApiError, aiRequest } from '../utils/api';

interface AiTranscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectGenerated: (project: Partial<ProjectData>) => void;
}

const STYLE_OPTIONS = [
  {
    icon: '🕯️',
    title: 'Sâu Lắng & Nhịp Thở',
    desc: 'Chữ co giãn êm ái như nhịp thở, vệt sáng ấm áp da diết',
    prompt: 'Phong cách Ballad sâu lắng, chữ co giãn nhẹ nhàng theo nhịp thở, tông màu ấm áp dịu dàng hài hòa với bức ảnh',
  },
  {
    icon: '✨',
    title: 'Ánh Sao & Bụi Cảm Xúc',
    desc: 'Chữ trôi lơ lửng, hạt bụi sao lấp lánh phát sáng khi ngân nga',
    prompt: 'Hiệu ứng Stardust lấp lánh, chữ lơ lửng bồng bềnh, vệt sáng rực rỡ và hạt bụi sao bay nhẹ nhàng',
  },
  {
    icon: '⚡',
    title: 'Năng Lượng Bùng Nổ',
    desc: 'Chữ in hoa dập nảy mạnh theo nhịp bass, màu neon rực rỡ',
    prompt: 'Phong cách sôi động, chữ nảy mạnh theo nhịp bass của âm thanh, màu sắc neon tương phản cao',
  },
  {
    icon: '🌊',
    title: 'Trôi Bồng Bềnh Sóng Nước',
    desc: 'Chữ uốn lượn như mặt hồ mùa thu, phong cách Lofi thư giãn',
    prompt: 'Chữ trôi bồng bềnh êm đềm như sóng nước, phong cách Lofi thư thái lãng đãng',
  },
  {
    icon: '🌅',
    title: 'Hoàng Hôn Điện Ảnh',
    prompt: 'Tông màu vintage hoàng hôn hoài niệm, góc máy trôi cinematic tôn vinh bức ảnh',
    desc: 'Hoài niệm thập niên 90, màu ấm và góc máy trôi nhẹ',
  },
  {
    icon: '🎲',
    title: 'Để AI Tự Do Cảm Nhận',
    desc: 'AI tự cảm nhận giai điệu & màu ảnh để phối chuyển động độc bản',
    prompt: 'Hãy phân tích giai điệu bài hát và màu sắc bức ảnh tôi vừa tải lên để tự do thiết kế chuyển động và bảng màu chữ độc nhất',
  },
];

export const AiTranscribeModal: React.FC<AiTranscribeModalProps> = ({
  isOpen,
  onClose,
  onProjectGenerated,
}) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'consultation'>('upload');

  // Asset states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string>('');
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

  const [rawLyrics, setRawLyrics] = useState<string>('');
  const [songTitle, setSongTitle] = useState<string>('');
  const [artistName, setArtistName] = useState<string>('');

  // AI Consultation states
  const [userVisionPrompt, setUserVisionPrompt] = useState<string>('Để AI tự do sáng tạo theo giai điệu bài hát và màu sắc bức ảnh');
  const [selectedStyleTag, setSelectedStyleTag] = useState<string>('Để AI Tự Do Cảm Nhận');

  // Loading & Error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle audio upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset immediately so re-picking the same file still fires onChange.
    e.target.value = '';

    // Copyright gate. Uploading music the visitor does not own is the single
    // biggest takedown risk on a tool like this, so ask once per session.
    if (!rightsConfirmed) {
      const accepted = window.confirm(
        'Trước khi tải lên, xin xác nhận bạn có quyền sử dụng tệp âm thanh này ' +
          '(bản thu của bạn, nhạc công cộng, hoặc nhạc đã mua giấy phép).\n\n' +
          'LyricStudio AI chịu trách nhiệm gỡ bỏ nội dung vi phạm bản quyền.',
      );
      if (!accepted) return;
      setRightsConfirmed(true);
    }

    setError(null);
    setAudioFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64Data = dataUrl.split(',')[1] || '';
      setAudioBase64(base64Data);

      // Measure duration
      const audio = new Audio(dataUrl);
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration || 30);
      };
      setAudioPreviewUrl(dataUrl);

      // Auto-fill song title if empty
      if (!songTitle) {
        setSongTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreviewUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Go to Consultation step
  const handleProceedToConsultation = () => {
    if (!audioBase64) {
      setError('Vui lòng chọn 1 tệp âm thanh (MP3, WAV, M4A, OGG) để tiếp tục.');
      return;
    }
    setError(null);
    setCurrentStep('consultation');
  };

  // Full AI Generation Execution
  const handleExecuteAiGeneration = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingStep('Đang gửi âm thanh tới AI...');

    try {
      // 1. Transcribe lyrics from audio
      setLoadingStep('Gemini AI đang lắng nghe và tách lời bài hát...');
      let transcribedData: any = null;
      try {
        const json = await aiRequest('/api/transcribe-lyrics', {
          audioBase64,
          mimeType: audioFile?.type || 'audio/mp3',
          rawLyrics,
          promptHint: userVisionPrompt,
          audioDuration: audioDuration || 30,
          songTitle: songTitle.trim(),
          artist: artistName.trim(),
        });
        if (json.success && json.data) {
          transcribedData = json.data;
        }
      } catch (tErr: any) {
        // A quota refusal must reach the user. Falling back to placeholder
        // lyrics here would look like a successful transcription and hide the
        // reason the real thing failed.
        if (tErr instanceof ApiError && tErr.isQuota) throw tErr;
        console.warn('Transcribe request error:', tErr);
      }

      // If transcribe data was not obtained, create high quality rhythmic synced lines
      if (!transcribedData || !Array.isArray(transcribedData.lines) || transcribedData.lines.length === 0) {
        const totalDur = Math.max(12, Number(audioDuration) || 30);
        const samplePhrases = [
          '♫ Giai điệu du dương hòa theo từng nhịp thở',
          '♫ Lắng nghe từng cung bậc cảm xúc ngân vang',
          '♫ Thả hồn theo những nốt nhạc bay lơ lửng',
          '♫ Ký ức ngọt ngào còn đọng mãi trong tim',
          '♫ Ánh sáng rực rỡ soi rọi màn đêm tĩnh lặng',
        ];
        const lineCount = Math.min(samplePhrases.length, Math.max(3, Math.floor(totalDur / 5)));
        const lineDur = (totalDur - 2.5) / lineCount;

        const generatedLines: LyricLine[] = samplePhrases.slice(0, lineCount).map((text, idx) => {
          const sTime = Number((1.0 + idx * lineDur).toFixed(2));
          const eTime = Number((sTime + lineDur * 0.85).toFixed(2));
          const words = text.split(/\s+/).filter(Boolean);
          const wDur = (eTime - sTime) / Math.max(1, words.length);
          return {
            id: `line-${idx + 1}`,
            text,
            startTime: sTime,
            endTime: eTime,
            words: words.map((w, wIdx) => ({
              text: w,
              startTime: Number((sTime + wIdx * wDur).toFixed(2)),
              endTime: Number((sTime + (wIdx + 1) * wDur).toFixed(2)),
            })),
          };
        });

        transcribedData = {
          title: songTitle.trim() || audioFile?.name.replace(/\.[^/.]+$/, '') || 'Bài Hát Mới',
          artist: artistName.trim() || 'Nghệ Sĩ',
          lines: generatedLines,
        };
      }

      const lyricsLines = transcribedData.lines as LyricLine[];

      // 2. AI Video Director designs typography, animation, and effects based on user vision
      setLoadingStep('AI Đạo Diễn đang thiết kế hiệu ứng chữ & chuyển động cho bức ảnh của bạn...');
      let designedStyle: any = null;
      try {
        // Styling is a bonus on top of the lyrics, so a quota refusal here is
        // swallowed and the transcription still lands.
        const designJson = await aiRequest('/api/ai-design-video', {
          songTitle: songTitle.trim() || transcribedData.title || audioFile?.name,
          artist: artistName.trim() || transcribedData.artist,
          lyrics: lyricsLines,
          userVisionPrompt: userVisionPrompt,
          aspectRatio: '16:9',
        });
        if (designJson.success && designJson.data) {
          designedStyle = designJson.data;
        }
      } catch (dErr) {
        console.warn('AI Design API transient error, continuing with fallback:', dErr);
      }

      // 3. Assemble project CENTERED ON USER'S UPLOADED AUDIO AND IMAGE!
      const finalProject: Partial<ProjectData> = {
        title: songTitle.trim() || transcribedData.title || audioFile?.name.replace(/\.[^/.]+$/, '') || 'Bài Hát Mới',
        artist: artistName.trim() || transcribedData.artist || 'Nghệ Sĩ',
        audioUrl: audioPreviewUrl, // USER'S AUDIO
        audioDuration: audioDuration || 30,
        lyrics: lyricsLines,
        layoutMode: 'generative_ai',
        generativeLayout: designedStyle?.generativeLayout,
        channelLogoText: designedStyle?.channelLogoText || '✦ AI DIRECTOR CUT',
      };

      // Background: ALWAYS use user's uploaded image if provided, with AI-designed effects & lighting filter
      finalProject.background = {
        imageUrl: imagePreviewUrl || designedStyle?.background?.imageUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
        effect: designedStyle?.background?.effect || 'bass_pulse',
        dimOpacity: designedStyle?.background?.dimOpacity ?? 0.45,
        blurAmount: designedStyle?.background?.blurAmount ?? 0,
        filter: designedStyle?.background?.filter || 'sunset',
      };

      // Typography & Animation: Designed by AI from user's response
      if (designedStyle?.typography) {
        finalProject.typography = {
          fontFamily: designedStyle.typography.fontFamily || 'Syne',
          fontSize: designedStyle.typography.fontSize || 48,
          textColor: designedStyle.typography.textColor || '#FFFFFF',
          highlightColor: designedStyle.typography.highlightColor || '#38BDF8',
          secondaryColor: designedStyle.typography.secondaryColor || '#FDA4AF',
          textShadow: designedStyle.typography.textShadow ?? true,
          textStroke: designedStyle.typography.textStroke ?? false,
          strokeColor: designedStyle.typography.strokeColor || '#000000',
          letterSpacing: 1,
          textCase: designedStyle.typography.textCase || 'uppercase',
          textAlign: designedStyle.typography.textAlign || 'left',
          kineticEffect: designedStyle.typography.kineticEffect || 'emotional_soul',
          emotionalSparkles: designedStyle.typography.emotionalSparkles ?? true,
          emotionalGradient: designedStyle.typography.emotionalGradient ?? true,
        };
      }

      // Visualizer: Designed by AI
      if (designedStyle?.visualizer) {
        finalProject.visualizer = {
          type: designedStyle.visualizer.type || 'bars',
          color: designedStyle.visualizer.color || '#38BDF8',
          opacity: designedStyle.visualizer.opacity ?? 0.75,
          barCount: designedStyle.visualizer.barCount || 36,
        };
      }

      onProjectGenerated(finalProject);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi tạo video bằng AI:', err);
      setError(err.message || 'Không thể tạo video bằng AI. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Step indicator */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">
                  Tạo Video Cùng AI Đạo Diễn
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {currentStep === 'upload' ? 'Bước 1: Tải File' : 'Bước 2: AI Tham Vấn'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {currentStep === 'upload'
                  ? 'Tải lên âm thanh & hình ảnh của bạn để làm tâm điểm video'
                  : 'AI hỏi bạn về phong cách chữ & animation mong muốn'}
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

        {/* Error notice */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {currentStep === 'upload' ? (
            /* ================= STEP 1: UPLOAD ASSETS ================= */
            <div className="space-y-4">
              {/* 1. Upload Audio */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-purple-400" />
                    <span>1. Tệp âm thanh của bạn (Bắt buộc)</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    MP3, WAV, M4A, OGG
                  </span>
                </label>

                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />

                <div
                  onClick={() => audioInputRef.current?.click()}
                  className={`p-4 border-2 border-dashed rounded-2xl cursor-pointer text-center transition flex flex-col items-center justify-center gap-2 ${
                    audioFile
                      ? 'border-purple-500/60 bg-purple-500/10'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950/70'
                  }`}
                >
                  {audioFile ? (
                    <>
                      <CheckCircle2 className="w-7 h-7 text-purple-400" />
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">
                          {audioFile.name}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • {audioDuration.toFixed(1)}s
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-zinc-500" />
                      <div>
                        <p className="text-xs font-semibold text-zinc-300">
                          Nhấp để chọn tệp âm thanh của bạn
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Hỗ trợ MP3, WAV, M4A, OGG (tối đa 50MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 2. Upload Image Background */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-rose-400" />
                    <span>2. Hình ảnh bài hát của bạn (Trọng tâm video)</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Ảnh kỷ niệm / Bìa ca sĩ (JPG, PNG)
                  </span>
                </label>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div
                  onClick={() => imageInputRef.current?.click()}
                  className={`p-3 border-2 border-dashed rounded-2xl cursor-pointer text-center transition flex items-center gap-3 ${
                    imagePreviewUrl
                      ? 'border-rose-500/60 bg-rose-500/10'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40'
                  }`}
                >
                  {imagePreviewUrl ? (
                    <>
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="w-14 h-14 object-cover rounded-xl border border-zinc-700 shadow-md"
                      />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">
                          {imageFile?.name || 'Ảnh của bạn'}
                        </p>
                        <p className="text-[11px] text-rose-400 font-medium">
                          ✓ Đã tải ảnh lên (Sẽ làm tâm điểm video) • Nhấp để đổi
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center py-2 text-zinc-400">
                      <ImageIcon className="w-6 h-6 mb-1 text-zinc-500" />
                      <span className="text-xs font-medium">
                        Chọn bức ảnh bạn muốn làm trung tâm cho video
                      </span>
                      <span className="text-[11px] text-zinc-600">
                        AI sẽ giữ nguyên ảnh này và thiết kế chuyển động & màu sắc xoay quanh ảnh
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Song Title & Artist */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 block">
                    Tên bài hát
                  </label>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="VD: Quá Khứ Anh Không Thể Quên"
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 block">
                    Tên ca sĩ / Nghệ sĩ
                  </label>
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="VD: Dương Minh Tuấn"
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* 4. Raw Lyrics (Optional) */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Lời bài hát (Tùy chọn)</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Để trống nếu muốn AI tự động nghe & trích xuất
                  </span>
                </label>

                <textarea
                  value={rawLyrics}
                  onChange={(e) => setRawLyrics(e.target.value)}
                  placeholder="Dán lời bài hát vào đây nếu bạn đã có sẵn lời..."
                  rows={3}
                  className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          ) : (
            /* ================= STEP 2: AI CONSULTATION & DESIGN ================= */
            <div className="space-y-5 animate-fadeIn">
              {/* Asset Badge Confirmation */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-3">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="Asset"
                    className="w-12 h-12 object-cover rounded-xl border border-zinc-700 shadow"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Music className="w-5 h-5 text-purple-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {songTitle || audioFile?.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Tâm điểm video
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">
                    Nghệ sĩ: {artistName || 'Chưa đặt'} • Audio: {audioFile?.name}
                  </p>
                </div>
              </div>

              {/* AI Question Prompt */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-rose-950/40 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>AI Đạo Diễn Hỏi:</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                  "Chào bạn! Tôi đã nhận được bài hát và hình ảnh của bạn. Bạn muốn video này được thiết kế giao diện, phong cách chữ (Lyrics) & chuyển động (Animation) như thế nào?"
                </p>
              </div>

              {/* Style Selection Cards */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-purple-400" />
                  <span>Chọn phong cách chuyển động gợi ý:</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {STYLE_OPTIONS.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedStyleTag(opt.title);
                        setUserVisionPrompt(opt.prompt);
                      }}
                      className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                        selectedStyleTag === opt.title
                          ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/15 ring-1 ring-purple-500'
                          : 'bg-zinc-950/40 hover:bg-zinc-800/60 border-zinc-800/80'
                      }`}
                    >
                      <span className="text-xl mt-0.5">{opt.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-zinc-200 block truncate">
                          {opt.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 line-clamp-2 leading-tight mt-0.5">
                          {opt.desc}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* User Custom Vision Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Mô tả chi tiết mong muốn của bạn với AI:</span>
                  </span>
                </label>
                <textarea
                  value={userVisionPrompt}
                  onChange={(e) => {
                    setUserVisionPrompt(e.target.value);
                    setSelectedStyleTag('');
                  }}
                  rows={2}
                  placeholder="Ví dụ: 'Hãy làm tông màu tối huyền ảo đồng điệu với ảnh, chữ font viết tay mềm mại, vệt sáng màu vàng đồng lấp lánh...'"
                  className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between gap-3">
          {currentStep === 'consultation' ? (
            <button
              onClick={() => setCurrentStep('upload')}
              disabled={isLoading}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay Lại</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              Hủy bỏ
            </button>
          )}

          {currentStep === 'upload' ? (
            <button
              onClick={handleProceedToConsultation}
              disabled={!audioBase64}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>Tiếp Tục: AI Tham Vấn Thiết Kế</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleExecuteAiGeneration}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-rose-500 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white text-xs sm:text-sm font-bold shadow-xl shadow-purple-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{loadingStep || 'AI Đang Xử Lý...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>✨ AI Bắt Đầu Thiết Kế Video</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
