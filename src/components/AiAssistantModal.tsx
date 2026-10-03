import React, { useState } from 'react';
import { Sparkles, X, Loader2, Music, Wand2 } from 'lucide-react';
import { LyricLine } from '../types';
import { aiRequest } from '../utils/api';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioDuration: number;
  onApplyLyrics: (lines: LyricLine[]) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  audioDuration,
  onApplyLyrics,
}) => {
  const [topic, setTopic] = useState('');
  const [genre, setGenre] = useState('Indie Pop Ballad');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const json = await aiRequest('/api/ai-lyric-assistant', {
        action: 'create_lyrics',
        topic: topic || 'Tình yêu và những chiều hoàng hôn phố vắng',
        genre,
        audioDuration,
      });
      const rawLines: string[] = json.data?.lines || [];

      if (rawLines.length > 0) {
        const step = Math.max(2, (audioDuration || 24) / rawLines.length);
        const newLines: LyricLine[] = rawLines.map((txt: string, idx: number) => {
          const start = Number((idx * step).toFixed(1));
          const end = Number(((idx + 1) * step).toFixed(1));
          const words = txt.split(/\s+/).filter(Boolean);
          const wordStep = (end - start) / Math.max(1, words.length);
          return {
            id: `ai-${Date.now()}-${idx}`,
            text: txt,
            startTime: start,
            endTime: end,
            words: words.map((w, wIdx) => ({
              text: w,
              startTime: Number((start + wIdx * wordStep).toFixed(2)),
              endTime: Number((start + (wIdx + 1) * wordStep).toFixed(2)),
            })),
          };
        });

        onApplyLyrics(newLines);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi gọi AI');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">AI Sáng Tác Lời Bài Hát</h3>
              <p className="text-[11px] text-zinc-400">Tự động căn nhịp theo độ dài âm thanh</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Chủ đề bài hát hoặc cảm xúc
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Cơn mưa rào mùa hạ, kỷ niệm thanh xuân..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Thể loại âm nhạc
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="Indie Pop Ballad">Indie Pop / Acoustic Ballad</option>
              <option value="Chill Lo-Fi Hip Hop">Chill Lo-Fi Hip Hop</option>
              <option value="Synthwave Cyberpunk">Synthwave / EDM Neon</option>
              <option value="R&B Soul Vibe">R&B Soul / V-Pop</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700"
          >
            Đóng
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
            <span>Tạo Lời Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
