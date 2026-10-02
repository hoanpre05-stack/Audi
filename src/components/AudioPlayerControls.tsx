import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  FastForward,
  Rewind,
  Activity,
} from 'lucide-react';

interface AudioPlayerControlsProps {
  isPlaying: boolean;
  onPlayToggle: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  isLoop: boolean;
  onLoopToggle: () => void;
}

export const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
  isPlaying,
  onPlayToggle,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onMuteToggle,
  isLoop,
  onLoopToggle,
}) => {
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00.0';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-2xl flex flex-col gap-3">
      {/* Timeline Scrubber */}
      <div className="flex items-center gap-3 w-full">
        <span className="text-[11px] font-mono text-amber-300/90 font-bold w-14 text-right tabular-nums shrink-0">
          {formatTime(currentTime)}
        </span>

        <div
          onClick={handleTimelineClick}
          className="relative flex-1 h-2.5 bg-zinc-900 border border-zinc-800 rounded-full cursor-pointer group flex items-center transition-all hover:border-zinc-700 overflow-hidden"
        >
          {/* Progress bar fill with glow */}
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 rounded-full relative transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Scrubber head */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg shadow-rose-500/80 ring-2 ring-rose-400 scale-90 group-hover:scale-125 transition-transform" />
          </div>
        </div>

        <span className="text-[11px] font-mono text-zinc-400 font-medium w-14 tabular-nums shrink-0">
          {formatTime(duration)}
        </span>
      </div>

      {/* Main playback control bar */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Beat sync status indicator + LED pulse */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800/80">
            <div
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isPlaying
                  ? 'bg-rose-500 shadow-lg shadow-rose-500/90 animate-pulse'
                  : 'bg-zinc-600'
              }`}
            />
            <Activity className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-[11px] font-medium text-zinc-300 truncate hidden sm:inline">
              {isPlaying ? 'Syncing Beats' : 'Paused'}
            </span>
          </div>

          {/* Simulated VU Meter LED bars */}
          <div className="hidden md:flex items-center gap-0.5 h-3.5 px-1.5 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className={`w-1 h-full rounded-sm transition-all ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'}`} style={{ animationDuration: '400ms' }} />
            <div className={`w-1 h-full rounded-sm transition-all ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'}`} style={{ animationDuration: '600ms' }} />
            <div className={`w-1 h-full rounded-sm transition-all ${isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-zinc-700'}`} style={{ animationDuration: '300ms' }} />
            <div className={`w-1 h-full rounded-sm transition-all ${isPlaying ? 'bg-rose-500 animate-pulse' : 'bg-zinc-700'}`} style={{ animationDuration: '500ms' }} />
          </div>
        </div>

        {/* Center: Play / Pause / Skip */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 5))}
            title="Tua lại 5s"
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            onClick={onPlayToggle}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white flex items-center justify-center shadow-xl shadow-rose-500/25 border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 5))}
            title="Tua tới 5s"
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSeek(0)}
            title="Về đầu bài"
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors hidden sm:block"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Volume & Loop Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onLoopToggle}
            title={isLoop ? 'Lặp lại: Bật' : 'Lặp lại: Tắt'}
            className={`p-2 rounded-xl border transition-all ${
              isLoop
                ? 'text-rose-300 bg-rose-500/15 border-rose-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
            <button
              onClick={onMuteToggle}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-rose-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-14 sm:w-20 accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-mono text-zinc-400 w-7 text-right tabular-nums hidden sm:inline">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
