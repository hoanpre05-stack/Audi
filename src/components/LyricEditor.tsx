import React, { useState, useEffect } from 'react';
import { LyricLine } from '../types';
import {
  Play,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Edit2,
  Check,
  ChevronRight,
  Radio,
  MoveHorizontal,
  Crosshair,
  AudioWaveform,
} from 'lucide-react';

interface LyricEditorProps {
  lyrics: LyricLine[];
  currentTime: number;
  onSeek: (time: number) => void;
  onUpdateLyrics: (newLyrics: LyricLine[]) => void;
  onOpenAiAssistant?: () => void;
  onOpenForcedAlignment?: () => void;
}

export const LyricEditor: React.FC<LyricEditorProps> = ({
  lyrics,
  currentTime,
  onSeek,
  onUpdateLyrics,
  onOpenAiAssistant,
  onOpenForcedAlignment,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isTapToSyncMode, setIsTapToSyncMode] = useState(false);
  const [tapLineIndex, setTapLineIndex] = useState(0);

  const formatSeconds = (sec: number) => {
    return sec.toFixed(1) + 's';
  };

  const handleStartEdit = (line: LyricLine) => {
    setEditingId(line.id);
    setEditingText(line.text);
  };

  const handleSaveEdit = (lineId: string) => {
    const updated = lyrics.map((l) => {
      if (l.id === lineId) {
        const words = editingText.split(/\s+/).filter(Boolean);
        const dur = (l.endTime - l.startTime) / Math.max(1, words.length);
        const wordTimings = words.map((w, idx) => ({
          text: w,
          startTime: Number((l.startTime + idx * dur).toFixed(2)),
          endTime: Number((l.startTime + (idx + 1) * dur).toFixed(2)),
        }));
        return {
          ...l,
          text: editingText,
          words: wordTimings,
        };
      }
      return l;
    });
    onUpdateLyrics(updated);
    setEditingId(null);
  };

  const handleTimeChange = (
    lineId: string,
    field: 'startTime' | 'endTime',
    delta: number
  ) => {
    const updated = lyrics.map((l) => {
      if (l.id === lineId) {
        const newVal = Math.max(0, Number((l[field] + delta).toFixed(2)));
        const newStart = field === 'startTime' ? newVal : l.startTime;
        const newEnd = field === 'endTime' ? Math.max(newStart + 0.5, newVal) : l.endTime;

        const words = (l.words || []).map((w, i, arr) => {
          const dur = (newEnd - newStart) / Math.max(1, arr.length);
          return {
            ...w,
            startTime: Number((newStart + i * dur).toFixed(2)),
            endTime: Number((newStart + (i + 1) * dur).toFixed(2)),
          };
        });

        return {
          ...l,
          startTime: newStart,
          endTime: newEnd,
          words,
        };
      }
      return l;
    });
    onUpdateLyrics(updated);
  };

  // Set line start time directly to current playing audio timestamp
  const handleSetToCurrentTime = (lineId: string) => {
    const targetTime = Number(currentTime.toFixed(2));
    const updated = lyrics.map((l) => {
      if (l.id === lineId) {
        const dur = Math.max(2.0, l.endTime - l.startTime);
        const newEnd = Number((targetTime + dur).toFixed(2));
        const words = (l.words || []).map((w, i, arr) => {
          const wDur = dur / Math.max(1, arr.length);
          return {
            ...w,
            startTime: Number((targetTime + i * wDur).toFixed(2)),
            endTime: Number((targetTime + (i + 1) * wDur).toFixed(2)),
          };
        });
        return {
          ...l,
          startTime: targetTime,
          endTime: newEnd,
          words,
        };
      }
      return l;
    });
    onUpdateLyrics(updated);
  };

  // Global shift all lyrics forward or backward
  const handleGlobalShift = (deltaSeconds: number) => {
    const updated = lyrics.map((l) => {
      const newStart = Math.max(0, Number((l.startTime + deltaSeconds).toFixed(2)));
      const newEnd = Math.max(newStart + 0.5, Number((l.endTime + deltaSeconds).toFixed(2)));
      const words = (l.words || []).map((w) => ({
        ...w,
        startTime: Math.max(0, Number((w.startTime + deltaSeconds).toFixed(2))),
        endTime: Math.max(0.2, Number((w.endTime + deltaSeconds).toFixed(2))),
      }));
      return {
        ...l,
        startTime: newStart,
        endTime: newEnd,
        words,
      };
    });
    onUpdateLyrics(updated);
  };

  // Live Tap-to-sync: when user taps, records current time for active line
  const handleTapSync = () => {
    if (tapLineIndex >= lyrics.length) {
      setIsTapToSyncMode(false);
      return;
    }

    const currentLine = lyrics[tapLineIndex];
    const prevLine = tapLineIndex > 0 ? lyrics[tapLineIndex - 1] : null;
    const now = Number(currentTime.toFixed(2));

    const updated = [...lyrics];

    // If there is a previous line, set its end time to right before this line
    if (prevLine && prevLine.startTime < now) {
      const prevDur = now - prevLine.startTime;
      const prevWords = (prevLine.words || []).map((w, i, arr) => {
        const step = prevDur / Math.max(1, arr.length);
        return {
          ...w,
          startTime: Number((prevLine.startTime + i * step).toFixed(2)),
          endTime: Number((prevLine.startTime + (i + 1) * step).toFixed(2)),
        };
      });
      updated[tapLineIndex - 1] = {
        ...prevLine,
        endTime: now,
        words: prevWords,
      };
    }

    // Set current line start time to now
    const defaultDur = 3.5;
    const words = (currentLine.words || []).map((w, i, arr) => {
      const step = defaultDur / Math.max(1, arr.length);
      return {
        ...w,
        startTime: Number((now + i * step).toFixed(2)),
        endTime: Number((now + (i + 1) * step).toFixed(2)),
      };
    });

    updated[tapLineIndex] = {
      ...currentLine,
      startTime: now,
      endTime: Number((now + defaultDur).toFixed(2)),
      words,
    };

    onUpdateLyrics(updated);

    // Advance to next line
    if (tapLineIndex + 1 < lyrics.length) {
      setTapLineIndex(tapLineIndex + 1);
    } else {
      setIsTapToSyncMode(false);
    }
  };

  // Keyboard shortcut for Spacebar in Tap-to-Sync mode
  useEffect(() => {
    if (!isTapToSyncMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !editingId) {
        e.preventDefault();
        handleTapSync();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTapToSyncMode, tapLineIndex, currentTime, lyrics, editingId]);

  const handleAddLine = () => {
    const lastLine = lyrics[lyrics.length - 1];
    const newStart = lastLine ? lastLine.endTime + 0.5 : 0;
    const newEnd = newStart + 3.5;
    const newLine: LyricLine = {
      id: `line-${Date.now()}`,
      text: 'Câu hát mới của bạn',
      startTime: Number(newStart.toFixed(1)),
      endTime: Number(newEnd.toFixed(1)),
      words: [
        { text: 'Câu', startTime: newStart, endTime: newStart + 0.8 },
        { text: 'hát', startTime: newStart + 0.8, endTime: newStart + 1.6 },
        { text: 'mới', startTime: newStart + 1.6, endTime: newStart + 2.4 },
        { text: 'của bạn', startTime: newStart + 2.4, endTime: newEnd },
      ],
    };
    onUpdateLyrics([...lyrics, newLine]);
  };

  const handleDeleteLine = (id: string) => {
    onUpdateLyrics(lyrics.filter((l) => l.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
      {/* Header bar */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs sm:text-sm text-zinc-200">
            Khớp Lời Bài Hát
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
            {lyrics.length} câu
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenForcedAlignment && (
            <button
              onClick={onOpenForcedAlignment}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition"
              title="Mở trình Căn Khớp Sóng Âm trực quan"
            >
              <AudioWaveform className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">Căn Sóng Âm</span>
            </button>
          )}

          {/* Live Tap-to-Sync Toggle */}
          <button
            onClick={() => {
              setIsTapToSyncMode(!isTapToSyncMode);
              setTapLineIndex(0);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
              isTapToSyncMode
                ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30 animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
            }`}
            title="Nghe nhạc và gõ phím Cách để chấm nhịp từng câu chuẩn 100%"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gõ Nhịp Trực Tiếp</span>
            <span className="sm:hidden">Gõ Nhịp</span>
          </button>

          {onOpenAiAssistant && (
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 transition"
              title="Nhờ AI trợ lý chỉnh sửa hoặc viết lời"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Lời</span>
            </button>
          )}

          <button
            onClick={handleAddLine}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </div>
      </div>

      {/* Global Offset Bar (Dịch chuyển toàn bộ lời) */}
      <div className="px-3 py-2 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 gap-2 flex-wrap">
        <span className="flex items-center gap-1 font-medium text-zinc-300">
          <MoveHorizontal className="w-3.5 h-3.5 text-rose-400" />
          <span>Căn chỉnh nhịp hát:</span>
        </span>
        <div className="flex items-center gap-1 font-mono">
          <button
            onClick={() => handleGlobalShift(-0.5)}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 hover:text-white transition text-xs font-semibold"
            title="Lùi 0.5s"
          >
            -0.5s
          </button>
          <button
            onClick={() => handleGlobalShift(-0.2)}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 hover:text-white transition text-xs font-semibold"
            title="Lùi 0.2s"
          >
            -0.2s
          </button>
          <button
            onClick={() => handleGlobalShift(-0.1)}
            className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition text-xs font-bold"
            title="Lùi 0.1s (Hát sớm hơn)"
          >
            -0.1s
          </button>
          <button
            onClick={() => handleGlobalShift(0.1)}
            className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 transition text-xs font-bold"
            title="Tiến 0.1s (Hát muộn hơn)"
          >
            +0.1s
          </button>
          <button
            onClick={() => handleGlobalShift(0.2)}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 hover:text-white transition text-xs font-semibold"
            title="Tiến 0.2s"
          >
            +0.2s
          </button>
          <button
            onClick={() => handleGlobalShift(0.5)}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 hover:text-white transition text-xs font-semibold"
            title="Tiến 0.5s"
          >
            +0.5s
          </button>
        </div>
      </div>

      {/* Live Tap-to-sync Active Banner */}
      {isTapToSyncMode && (
        <div className="p-3 bg-gradient-to-r from-rose-950/80 via-purple-950/80 to-zinc-900 border-b border-rose-500/40 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-rose-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              CHẾ ĐỘ GÕ NHỊP (TAP-TO-SYNC)
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              Câu {tapLineIndex + 1} / {lyrics.length}
            </span>
          </div>

          <p className="text-[11px] text-zinc-300">
            Nghe nhạc đang phát, ngay khi ca sĩ cất lời câu dưới đây, bấm nút
            dưới hoặc nhấn phím <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-rose-400 font-mono">Space</kbd>:
          </p>

          <button
            onClick={handleTapSync}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/40 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Crosshair className="w-4 h-4" />
            <span>
              🎯 Chấm Nhịp: &quot;{lyrics[tapLineIndex]?.text || 'Hoàn tất'}&quot;
            </span>
          </button>
        </div>
      )}

      {/* Lyric list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {lyrics.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <Clock className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">Chưa có lời bài hát nào.</p>
            <p className="text-[11px] text-zinc-600 mt-1">
              Bấm &quot;Thêm câu&quot; hoặc dùng AI Phân tích Audio để tự động tạo.
            </p>
          </div>
        ) : (
          lyrics.map((line, idx) => {
            const isActive =
              currentTime >= line.startTime && currentTime <= line.endTime;
            const isEditing = editingId === line.id;
            const isTapTarget = isTapToSyncMode && tapLineIndex === idx;

            return (
              <div
                key={line.id}
                className={`group p-3 rounded-xl border transition-all duration-200 ${
                  isTapTarget
                    ? 'bg-rose-950/50 border-rose-400 shadow-lg shadow-rose-500/30 ring-2 ring-rose-500/50'
                    : isActive
                    ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/20'
                    : 'bg-zinc-950/50 hover:bg-zinc-900/80 border-zinc-800/70'
                }`}
              >
                {/* Top row: Line index, Seek button, Timestamps */}
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSeek(line.startTime)}
                      title="Phát từ câu này"
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition ${
                        isActive
                          ? 'bg-rose-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </button>
                    <span className="text-xs font-semibold text-zinc-400">
                      #{idx + 1}
                    </span>

                    {/* Quick Pin to current playback time button */}
                    <button
                      onClick={() => handleSetToCurrentTime(line.id)}
                      title={`Đặt mốc bắt đầu = thời điểm bài hát đang phát (${currentTime.toFixed(1)}s)`}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 text-[10px] font-medium border border-zinc-700/60 transition"
                    >
                      <Crosshair className="w-3 h-3 text-rose-400" />
                      <span>Gán = {currentTime.toFixed(1)}s</span>
                    </button>
                  </div>

                  {/* Timing adjustments */}
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <div className="flex items-center bg-zinc-900 rounded-md px-1.5 py-0.5 border border-zinc-800">
                      <span className="text-zinc-500 mr-1">Bắt đầu:</span>
                      <button
                        onClick={() => handleTimeChange(line.id, 'startTime', -0.2)}
                        className="text-zinc-400 hover:text-white px-1"
                      >
                        -
                      </button>
                      <span className="text-zinc-200 font-medium">
                        {formatSeconds(line.startTime)}
                      </span>
                      <button
                        onClick={() => handleTimeChange(line.id, 'startTime', 0.2)}
                        className="text-zinc-400 hover:text-white px-1"
                      >
                        +
                      </button>
                    </div>

                    <ChevronRight className="w-3 h-3 text-zinc-600" />

                    <div className="flex items-center bg-zinc-900 rounded-md px-1.5 py-0.5 border border-zinc-800">
                      <span className="text-zinc-500 mr-1">Hết:</span>
                      <button
                        onClick={() => handleTimeChange(line.id, 'endTime', -0.2)}
                        className="text-zinc-400 hover:text-white px-1"
                      >
                        -
                      </button>
                      <span className="text-zinc-200 font-medium">
                        {formatSeconds(line.endTime)}
                      </span>
                      <button
                        onClick={() => handleTimeChange(line.id, 'endTime', 0.2)}
                        className="text-zinc-400 hover:text-white px-1"
                      >
                        +
                      </button>
                    </div>

                    {/* Delete action */}
                    <button
                      onClick={() => handleDeleteLine(line.id)}
                      title="Xóa câu"
                      className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Text Content */}
                {isEditing ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(line.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 bg-zinc-900 border border-rose-500/50 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      onClick={() => handleSaveEdit(line.id)}
                      className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => handleStartEdit(line)}
                    className="flex items-center justify-between cursor-pointer group/text hover:text-white"
                  >
                    <p
                      className={`text-xs sm:text-sm font-medium transition ${
                        isTapTarget
                          ? 'text-rose-200 font-bold'
                          : isActive
                          ? 'text-rose-300 font-semibold'
                          : 'text-zinc-300'
                      }`}
                    >
                      {line.text}
                    </p>
                    <Edit2 className="w-3 h-3 text-zinc-600 group-hover/text:text-zinc-300 transition opacity-0 group-hover:opacity-100" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
