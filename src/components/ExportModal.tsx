import React from 'react';
import {
  Download,
  X,
  CheckCircle2,
  Film,
  Sparkles,
  VolumeX,
  FileVideo,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { ExportProgress } from '../utils/videoExporter';
import { ProjectData } from '../types';
import { getViewerPlan, onViewerPlanChange } from '../utils/viewer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportStatus: ExportProgress;
  onStartExport: () => void;
  onCancelExport: () => void;
  isExporting: boolean;
  project: ProjectData;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  exportStatus,
  onStartExport,
  onCancelExport,
  isExporting,
  project,
}) => {
  const [isConvertingMp4, setIsConvertingMp4] = React.useState<boolean>(false);
  const [isPro, setIsPro] = React.useState<boolean>(() => getViewerPlan() === 'pro');

  // Keep the advertised resolution honest if the membership changes while the
  // modal is open.
  React.useEffect(() => onViewerPlanChange((plan) => setIsPro(plan === 'pro')), []);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!exportStatus.blobUrl) return;
    const safeTitle = (project.title || 'lyric-video')
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '-');

    // If it's already converted to mp4
    if (exportStatus.format === 'mp4') {
      const a = document.createElement('a');
      a.href = exportStatus.blobUrl;
      a.download = `${safeTitle}-lyric-video.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // If format was webm, dynamically convert to MP4 via server FFmpeg
    try {
      setIsConvertingMp4(true);
      const blobRes = await fetch(exportStatus.blobUrl);
      const rawBlob = await blobRes.blob();
      const convertRes = await fetch('/api/convert-to-mp4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: rawBlob,
      });

      if (convertRes.ok) {
        const mp4Blob = await convertRes.blob();
        const mp4Url = URL.createObjectURL(mp4Blob);
        const a = document.createElement('a');
        a.href = mp4Url;
        a.download = `${safeTitle}-lyric-video.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsConvertingMp4(false);
        return;
      }
    } catch (e) {
      console.warn('Dynamic MP4 conversion error:', e);
    } finally {
      setIsConvertingMp4(false);
    }

    // Direct download with correct extension based on format to prevent corrupt files
    const a = document.createElement('a');
    a.href = exportStatus.blobUrl;
    const ext = exportStatus.format === 'webm' ? 'webm' : 'mp4';
    a.download = `${safeTitle}-lyric-video.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">
                  Xuất Lyric Video Chuẩn MP4
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isPro
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {isPro ? 'Full HD 1080p' : 'HD 720p'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {isPro ? (
                  <>
                    Render ngầm tự động • Tắt tiếng loa ngoài • Định dạng MP4 chuẩn
                  </>
                ) : (
                  <>
                    Gói miễn phí xuất 720p kèm watermark nhỏ ở góc khung hình.{' '}
                    <a href="/pricing" className="text-rose-400 font-semibold">
                      Nâng cấp Pro
                    </a>{' '}
                    để xuất 1080p không watermark.
                  </>
                )}
              </p>
            </div>
          </div>

          {!isExporting && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center justify-center text-center">
          {/* Completed State */}
          {exportStatus.isComplete && exportStatus.blobUrl ? (
            <div className="w-full space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-56 mx-auto border border-zinc-800 shadow-2xl flex items-center justify-center">
                <video
                  src={exportStatus.blobUrl || undefined}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  Video {exportStatus.format?.toUpperCase() || 'MP4'} đã được render thành công!
                </span>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  Tệp MP4 H.264 tương thích 100% với TikTok, Facebook, YouTube, iPhone và Android.
                </span>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
                >
                  Đóng
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isConvertingMp4}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/30 transition active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {isConvertingMp4 ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang đóng gói MP4...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Tải Video .MP4 Về Máy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : exportStatus.error ? (
            /* Error State */
            <div className="w-full space-y-4 py-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
                <X className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-300">
                  Chưa thể hoàn tất xuất video
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  {exportStatus.error}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
                >
                  Đóng
                </button>
                <button
                  onClick={onStartExport}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white text-xs font-bold transition shadow-lg shadow-rose-500/30"
                >
                  Thử Lại Ngay
                </button>
              </div>
            </div>
          ) : isExporting ? (
            /* Exporting in progress (Silent Background Mode) */
            <div className="w-full space-y-5 py-3">
              {/* Circular percentage */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin"
                  style={{ animationDuration: '1.2s' }}
                />
                <span className="text-2xl font-black font-mono text-white">
                  {exportStatus.progress}%
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-zinc-100">
                  {exportStatus.statusText || 'Đang kết xuất video ngầm...'}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Đã hoàn thành {exportStatus.currentTime.toFixed(1)}s /{' '}
                  {exportStatus.duration.toFixed(1)}s
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 transition-all duration-200"
                  style={{ width: `${exportStatus.progress}%` }}
                />
              </div>

              {/* Silent mode notification */}
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <VolumeX className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-[11px] text-zinc-400 leading-tight">
                  <span className="font-semibold text-zinc-200 block mb-0.5">
                    Chế độ render chạy ngầm không phát tiếng:
                  </span>
                  Loa máy tính đã được tự động tắt tiếng để không làm phiền bạn. Video thành phẩm vẫn có âm thanh Full Stereo 100%.
                </div>
              </div>

              <button
                onClick={onCancelExport}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold transition"
              >
                Hủy quá trình xuất
              </button>
            </div>
          ) : (
            /* Ready to export */
            <div className="space-y-4 py-1">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  Sẵn sàng render lyric video MP4
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Quá trình render diễn ra ngầm trong nền, tự động tắt âm lượng loa ngoài và xuất ra tệp MP4 chuẩn H.264.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800 text-center">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">
                    Tỉ lệ khung hình
                  </span>
                  <span className="text-xs font-bold text-zinc-200">
                    {project.aspectRatio}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">
                    Thời lượng
                  </span>
                  <span className="text-xs font-bold text-zinc-200">
                    {project.audioDuration.toFixed(0)} giây
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">
                    Định dạng file
                  </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <FileVideo className="w-3.5 h-3.5" />
                    <span>MP4 H.264</span>
                  </span>
                </div>
              </div>

              {/* Feature highlight */}
              <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-left space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span><strong>Render ngầm:</strong> Không chiếm dụng màn hình, không giật lag.</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span><strong>Im lặng tuyệt đối:</strong> Loa ngoài tự động tắt tiếng trong lúc render.</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span><strong>Đóng gói MP4:</strong> Tự động tích hợp FFmpeg máy chủ xuất MP4 chính chuẩn.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
                >
                  Để sau
                </button>
                <button
                  onClick={onStartExport}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/30 transition active:scale-95"
                >
                  <span>Bắt Đầu Render MP4</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
