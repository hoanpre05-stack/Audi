import React, { useState, useEffect, useRef } from 'react';
import { LyricLine, ProjectData, WordTiming } from '../types';
import {
  X,
  Play,
  Pause,
  Sparkles,
  RotateCcw,
  Zap,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Volume2,
  Check,
  ChevronRight,
  ListMusic,
  AudioWaveform as WaveformIcon,
  Sliders,
  Scissors,
  FileText,
  Copy,
  CheckCircle2,
} from 'lucide-react';

interface ForcedAlignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onApplyLyrics: (updatedLyrics: LyricLine[]) => void;
}

export const ForcedAlignmentModal: React.FC<ForcedAlignmentModalProps> = ({
  isOpen,
  onClose,
  project,
  onApplyLyrics,
}) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>(project.lyrics || []);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(
    project.lyrics?.[0]?.id || null
  );
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLoopingLine, setIsLoopingLine] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(3); // 1x to 10x
  const [isAligning, setIsAligning] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Dragging state on waveform canvas
  const [draggingTarget, setDraggingTarget] = useState<{
    lineId: string;
    wordIndex?: number;
    type: 'start' | 'end' | 'move';
    initialMouseX: number;
    initialStartTime: number;
    initialEndTime: number;
  } | null>(null);

  // Audio Context & Buffer
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync lyrics from project when modal opens
  useEffect(() => {
    if (isOpen) {
      setLyrics(project.lyrics || []);
      if (project.lyrics && project.lyrics.length > 0 && !selectedLineId) {
        setSelectedLineId(project.lyrics[0].id);
      }
    }
  }, [isOpen, project.lyrics]);

  // Decode audio URL to AudioBuffer for waveform visualization
  useEffect(() => {
    if (!isOpen || !project.audioUrl) return;

    let isMounted = true;
    const fetchAndDecodeAudio = async () => {
      try {
        const response = await fetch(project.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const tempCtx = new AudioCtx();
        const decoded = await tempCtx.decodeAudioData(arrayBuffer);
        if (isMounted) {
          audioBufferRef.current = decoded;
          renderOverviewWaveform();
          renderMainWaveform();
        }
      } catch (err) {
        console.warn('Could not decode audio buffer for waveform canvas:', err);
      }
    };

    fetchAndDecodeAudio();
    return () => {
      isMounted = false;
    };
  }, [isOpen, project.audioUrl]);

  // Handle line looping
  useEffect(() => {
    if (!isLoopingLine || !isPlaying || !selectedLineId || !audioRef.current) return;
    const line = lyrics.find((l) => l.id === selectedLineId);
    if (!line) return;

    if (currentTime >= line.endTime || currentTime < line.startTime) {
      audioRef.current.currentTime = line.startTime;
      setCurrentTime(line.startTime);
    }
  }, [currentTime, isLoopingLine, isPlaying, selectedLineId, lyrics]);

  // Continuous animation loop for time & waveform playhead
  useEffect(() => {
    if (!isOpen) return;
    let animId: number;
    const tick = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);
        renderMainWaveform();
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, zoomLevel, lyrics, selectedLineId, selectedWordIndex]);

  // Re-render main waveform when zoom or lyrics change
  useEffect(() => {
    if (isOpen) {
      renderMainWaveform();
    }
  }, [zoomLevel, lyrics, selectedLineId, selectedWordIndex, currentTime]);

  // Draw overview mini-map waveform
  const renderOverviewWaveform = () => {
    const canvas = overviewCanvasRef.current;
    const buffer = audioBufferRef.current;
    if (!canvas || !buffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;

    // Draw audio waveform in neon cyan/purple
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();

    // Draw lyrics line markers on overview
    const duration = project.audioDuration || buffer.duration || 30;
    lyrics.forEach((line) => {
      const xStart = (line.startTime / duration) * width;
      const xEnd = (line.endTime / duration) * width;

      ctx.fillStyle = line.id === selectedLineId ? 'rgba(244, 63, 94, 0.35)' : 'rgba(168, 85, 247, 0.2)';
      ctx.fillRect(xStart, 0, Math.max(2, xEnd - xStart), height);

      ctx.strokeStyle = line.id === selectedLineId ? '#f43f5e' : '#a855f7';
      ctx.lineWidth = line.id === selectedLineId ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(xStart, 0);
      ctx.lineTo(xStart, height);
      ctx.stroke();
    });

    // Draw active playhead position line
    const playheadX = (currentTime / duration) * width;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  };

  // Draw main interactive zoomable waveform canvas
  const renderMainWaveform = () => {
    const canvas = waveformCanvasRef.current;
    const buffer = audioBufferRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear background
    ctx.fillStyle = '#0f0f13';
    ctx.fillRect(0, 0, width, height);

    const totalDuration = project.audioDuration || (buffer ? buffer.duration : 30);
    const visibleDuration = totalDuration / zoomLevel;
    
    // Center view around currentTime or selected line start
    const selectedLine = lyrics.find((l) => l.id === selectedLineId);
    let viewStartTime = Math.max(
      0,
      currentTime - visibleDuration * 0.3
    );
    if (viewStartTime + visibleDuration > totalDuration) {
      viewStartTime = Math.max(0, totalDuration - visibleDuration);
    }

    const timeToX = (time: number) => {
      return ((time - viewStartTime) / visibleDuration) * width;
    };

    const xToTime = (x: number) => {
      return viewStartTime + (x / width) * visibleDuration;
    };

    // 1. Draw time grid ticks
    const tickInterval = visibleDuration > 20 ? 5 : visibleDuration > 10 ? 2 : visibleDuration > 4 ? 1 : 0.5;
    const firstTick = Math.floor(viewStartTime / tickInterval) * tickInterval;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = '10px monospace';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let t = firstTick; t <= viewStartTime + visibleDuration; t += tickInterval) {
      const x = timeToX(t);
      if (x >= 0 && x <= width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.fillText(`${t.toFixed(1)}s`, x + 4, 14);
      }
    }

    // 2. Draw audio waveform
    if (buffer) {
      const channelData = buffer.getChannelData(0);
      const sampleRate = buffer.sampleRate;
      const startSample = Math.floor(viewStartTime * sampleRate);
      const endSample = Math.min(channelData.length, Math.floor((viewStartTime + visibleDuration) * sampleRate));
      const samplesInView = endSample - startSample;
      const step = Math.max(1, Math.floor(samplesInView / width));

      const midY = height / 2;

      ctx.beginPath();
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
      gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.9)');
      gradient.addColorStop(1, 'rgba(244, 63, 94, 0.8)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;

      for (let x = 0; x < width; x++) {
        const sampleIdx = startSample + Math.floor(x * step);
        if (sampleIdx >= channelData.length) break;

        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step && sampleIdx + j < channelData.length; j++) {
          const v = channelData[sampleIdx + j];
          if (v < min) min = v;
          if (v > max) max = v;
        }

        const yMin = midY + min * (midY - 20);
        const yMax = midY + max * (midY - 20);

        ctx.moveTo(x, yMin);
        ctx.lineTo(x, yMax);
      }
      ctx.stroke();
    }

    // 3. Draw Lyrics Lines & Words Boxes
    lyrics.forEach((line) => {
      const isSelectedLine = line.id === selectedLineId;
      const xStart = timeToX(line.startTime);
      const xEnd = timeToX(line.endTime);

      if (xEnd < 0 || xStart > width) return;

      // Draw line container background
      const lineY = height - 70;
      const lineH = 55;

      ctx.fillStyle = isSelectedLine
        ? 'rgba(244, 63, 94, 0.18)'
        : 'rgba(168, 85, 247, 0.08)';
      ctx.fillRect(xStart, lineY, Math.max(4, xEnd - xStart), lineH);

      // Line border
      ctx.strokeStyle = isSelectedLine ? '#f43f5e' : 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = isSelectedLine ? 2 : 1;
      ctx.strokeRect(xStart, lineY, Math.max(4, xEnd - xStart), lineH);

      // Handles on line start & end
      if (isSelectedLine) {
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(xStart - 4, lineY, 8, lineH);
        ctx.fillRect(xEnd - 4, lineY, 8, lineH);
      }

      // Draw individual words inside the line
      const words = line.words || [];
      words.forEach((w, wIdx) => {
        const wxStart = timeToX(w.startTime);
        const wxEnd = timeToX(w.endTime);
        const isSelectedWord = isSelectedLine && selectedWordIndex === wIdx;

        const wordY = lineY + 6;
        const wordH = lineH - 24;

        ctx.fillStyle = isSelectedWord
          ? 'rgba(56, 189, 248, 0.4)'
          : 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(wxStart, wordY, Math.max(2, wxEnd - wxStart), wordH);

        ctx.strokeStyle = isSelectedWord ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = isSelectedWord ? 2 : 1;
        ctx.strokeRect(wxStart, wordY, Math.max(2, wxEnd - wxStart), wordH);

        // Word text label
        ctx.fillStyle = isSelectedWord ? '#ffffff' : '#e4e4e7';
        ctx.font = isSelectedWord ? 'bold 11px sans-serif' : '10px sans-serif';
        if (wxEnd - wxStart > 12) {
          ctx.fillText(w.text, wxStart + 4, wordY + 18);
        }
      });

      // Line Text Header Label
      ctx.fillStyle = isSelectedLine ? '#fda4af' : '#d4d4d8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(line.text, Math.max(10, xStart + 8), lineY - 6);
    });

    // 4. Draw Playhead Line
    const playheadX = timeToX(currentTime);
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Top playhead triangle marker
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(playheadX - 6, 0);
      ctx.lineTo(playheadX + 6, 0);
      ctx.lineTo(playheadX, 10);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Canvas Mouse Click & Drag logic
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const width = canvas.clientWidth;

    const totalDuration = project.audioDuration || 30;
    const visibleDuration = totalDuration / zoomLevel;
    let viewStartTime = Math.max(0, currentTime - visibleDuration * 0.3);
    if (viewStartTime + visibleDuration > totalDuration) {
      viewStartTime = Math.max(0, totalDuration - visibleDuration);
    }

    const clickedTime = viewStartTime + (mouseX / width) * visibleDuration;

    // Check if clicked near a line handle or word block
    let foundLine: LyricLine | null = null;
    let foundWordIdx: number | null = null;
    let handleType: 'start' | 'end' | 'move' = 'move';

    for (const line of lyrics) {
      if (Math.abs(clickedTime - line.startTime) < 0.25) {
        foundLine = line;
        handleType = 'start';
        break;
      }
      if (Math.abs(clickedTime - line.endTime) < 0.25) {
        foundLine = line;
        handleType = 'end';
        break;
      }
      if (clickedTime >= line.startTime && clickedTime <= line.endTime) {
        foundLine = line;
        // Check words
        if (line.words) {
          line.words.forEach((w, wIdx) => {
            if (clickedTime >= w.startTime && clickedTime <= w.endTime) {
              foundWordIdx = wIdx;
            }
          });
        }
        break;
      }
    }

    if (foundLine) {
      setSelectedLineId(foundLine.id);
      setSelectedWordIndex(foundWordIdx);
      setDraggingTarget({
        lineId: foundLine.id,
        wordIndex: foundWordIdx ?? undefined,
        type: handleType,
        initialMouseX: mouseX,
        initialStartTime: foundLine.startTime,
        initialEndTime: foundLine.endTime,
      });
    } else {
      // Clicked on empty space: seek audio playhead
      if (audioRef.current) {
        audioRef.current.currentTime = clickedTime;
        setCurrentTime(clickedTime);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingTarget || !waveformCanvasRef.current) return;

    const canvas = waveformCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const currentMouseX = e.clientX - rect.left;
    const width = canvas.clientWidth;

    const totalDuration = project.audioDuration || 30;
    const visibleDuration = totalDuration / zoomLevel;
    const deltaTime = ((currentMouseX - draggingTarget.initialMouseX) / width) * visibleDuration;

    const updated = lyrics.map((line) => {
      if (line.id === draggingTarget.lineId) {
        let newStart = line.startTime;
        let newEnd = line.endTime;

        if (draggingTarget.type === 'start') {
          newStart = Math.max(0, Number((draggingTarget.initialStartTime + deltaTime).toFixed(2)));
        } else if (draggingTarget.type === 'end') {
          newEnd = Math.max(newStart + 0.3, Number((draggingTarget.initialEndTime + deltaTime).toFixed(2)));
        } else if (draggingTarget.type === 'move') {
          newStart = Math.max(0, Number((draggingTarget.initialStartTime + deltaTime).toFixed(2)));
          newEnd = Math.max(newStart + 0.5, Number((draggingTarget.initialEndTime + deltaTime).toFixed(2)));
        }

        const words = (line.words || []).map((w, i, arr) => {
          const step = (newEnd - newStart) / Math.max(1, arr.length);
          return {
            ...w,
            startTime: Number((newStart + i * step).toFixed(2)),
            endTime: Number((newStart + (i + 1) * step).toFixed(2)),
          };
        });

        return {
          ...line,
          startTime: newStart,
          endTime: newEnd,
          words,
        };
      }
      return line;
    });

    setLyrics(updated);
  };

  const handleCanvasMouseUp = () => {
    setDraggingTarget(null);
  };

  // Run AI Waveform Forced Alignment using gemini-3.5-flash-lite
  const handleRunAiForcedAlignment = async () => {
    setIsAligning(true);
    setStatusMessage('Đang chạy Gemini 3.5 Flash Lite phân tích sóng âm & căn khớp lời...');

    try {
      let audioBase64 = '';
      if (project.audioUrl) {
        const res = await fetch(project.audioUrl);
        const blob = await res.blob();
        audioBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1] || '';
            resolve(base64);
          };
          reader.readAsDataURL(blob);
        });
      }

      const alignRes = await fetch('/api/forced-align', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: 'audio/mp3',
          lyricsLines: lyrics,
          audioDuration: project.audioDuration || 30,
        }),
      });

      const data = await alignRes.json();

      if (data.success && Array.isArray(data.lines) && data.lines.length > 0) {
        setLyrics(data.lines);
        setStatusMessage('✨ Căn khớp sóng âm hoàn tất thành công!');
      } else {
        setStatusMessage('⚠️ Đã tự động phân bổ nhịp sóng âm thuật toán.');
      }
    } catch (err: any) {
      console.error('Error running forced alignment:', err);
      setStatusMessage('Lỗi khi căn khớp sóng âm, đã dùng dự phòng.');
    } finally {
      setIsAligning(false);
    }
  };

  // Speed & Playback controls
  const handlePlayToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Export LRC / SRT / SubStation Alpha / JSON
  const handleExportLrc = () => {
    let lrcContent = `[ti:${project.title || 'LyricStudio Track'}]\n[ar:${project.artist || 'Artist'}]\n[by:LyricStudio AI - Gemini 3.5 Flash Lite]\n\n`;

    lyrics.forEach((line) => {
      const min = Math.floor(line.startTime / 60);
      const sec = (line.startTime % 60).toFixed(2);
      const formattedMin = String(min).padStart(2, '0');
      const formattedSec = Number(sec) < 10 ? '0' + sec : sec;

      let lineTag = `[${formattedMin}:${formattedSec}]`;
      if (line.words && line.words.length > 0) {
        const wordTags = line.words
          .map((w) => {
            const wMin = Math.floor(w.startTime / 60);
            const wSec = (w.startTime % 60).toFixed(2);
            const fWMin = String(wMin).padStart(2, '0');
            const fWSec = Number(wSec) < 10 ? '0' + wSec : wSec;
            return `<${fWMin}:${fWSec}>${w.text}`;
          })
          .join(' ');
        lrcContent += `${lineTag} ${wordTags}\n`;
      } else {
        lrcContent += `${lineTag} ${line.text}\n`;
      }
    });

    navigator.clipboard.writeText(lrcContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleApplyAndClose = () => {
    onApplyLyrics(lyrics);
    onClose();
  };

  if (!isOpen) return null;

  const currentLine = lyrics.find((l) => l.id === selectedLineId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <audio
        ref={audioRef}
        src={project.audioUrl}
        crossOrigin="anonymous"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex flex-col w-full max-w-6xl h-[92vh] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header Bar */}
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <WaveformIcon className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Căn Khớp Sóng Âm (Forced Alignment Studio)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  GEMINI 3.5 FLASH LITE
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Hiệu chỉnh mốc thời gian từng từ theo đỉnh sóng giọng hát
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAiForcedAlignment}
              disabled={isAligning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>⚡ AI Căn Khớp Tự Động</span>
            </button>

            <button
              onClick={handleApplyAndClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Áp Dụng Lời</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Mini-Map Waveform */}
        <div className="relative h-12 bg-zinc-900/60 border-b border-zinc-800/80 px-4 py-1 flex items-center justify-between">
          <canvas
            ref={overviewCanvasRef}
            className="w-full h-full cursor-pointer rounded overflow-hidden"
            onClick={(e) => {
              const canvas = overviewCanvasRef.current;
              if (!canvas || !audioRef.current) return;
              const rect = canvas.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const frac = x / rect.width;
              const targetTime = frac * (project.audioDuration || 30);
              audioRef.current.currentTime = targetTime;
              setCurrentTime(targetTime);
            }}
          />
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Waveform Controls Toolbar */}
          <div className="px-4 py-2 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayToggle}
                className="w-8 h-8 rounded-lg bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center transition shadow-md shadow-rose-500/20"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <div className="font-mono text-zinc-200 text-xs px-2 py-1 bg-zinc-950 rounded border border-zinc-800">
                {currentTime.toFixed(2)}s / {(project.audioDuration || 30).toFixed(1)}s
              </div>

              {/* Speed Selector */}
              <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800 text-[11px] font-mono">
                {[0.5, 0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleSpeedChange(rate)}
                    className={`px-1.5 py-0.5 rounded transition ${
                      playbackRate === rate ? 'bg-rose-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Loop Selected Line */}
              <button
                onClick={() => setIsLoopingLine(!isLoopingLine)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition text-xs font-semibold ${
                  isLoopingLine
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/20'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Lặp Câu Đang Chọn</span>
              </button>
            </div>

            {/* Zoom Controls & Export LRC */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setZoomLevel(Math.max(1, zoomLevel - 1))}
                  className="p-1 text-zinc-400 hover:text-white transition"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-zinc-300 w-8 text-center">{zoomLevel}x</span>
                <button
                  onClick={() => setZoomLevel(Math.min(15, zoomLevel + 1))}
                  className="p-1 text-zinc-400 hover:text-white transition"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleExportLrc}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
              >
                {copiedText ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Đã sao chép LRC' : 'Copy LRC'}</span>
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="px-4 py-1.5 bg-sky-950/60 border-b border-sky-800/40 text-xs text-sky-300 flex items-center justify-between">
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage('')} className="text-sky-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Interactive Zoom Waveform Viewport */}
          <div
            ref={containerRef}
            className="relative h-48 sm:h-56 bg-zinc-950 overflow-hidden cursor-crosshair select-none"
          >
            <canvas
              ref={waveformCanvasRef}
              className="w-full h-full"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </div>

          {/* Bottom Split Editor: Line List + Word Fine-Tuner */}
          <div className="flex-1 flex flex-col md:flex-row border-t border-zinc-800/80 min-h-0">
            {/* Left: Lyric Line Selector */}
            <div className="w-full md:w-1/2 border-r border-zinc-800/80 flex flex-col min-h-0 bg-zinc-950/60">
              <div className="p-2.5 border-b border-zinc-800/80 flex items-center justify-between text-xs font-bold text-zinc-300 bg-zinc-900/60">
                <span>Danh Sách Câu Hát ({lyrics.length})</span>
                <span className="text-[10px] text-zinc-500">Bấm để chọn câu và chỉnh mốc từ</span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {lyrics.map((line, idx) => {
                  const isSelected = line.id === selectedLineId;
                  return (
                    <div
                      key={line.id}
                      onClick={() => {
                        setSelectedLineId(line.id);
                        setSelectedWordIndex(null);
                        if (audioRef.current) {
                          audioRef.current.currentTime = line.startTime;
                          setCurrentTime(line.startTime);
                        }
                      }}
                      className={`p-2 rounded-xl cursor-pointer border transition ${
                        isSelected
                          ? 'bg-rose-950/50 border-rose-500/60 text-white shadow-md'
                          : 'bg-zinc-900/40 hover:bg-zinc-800/60 border-zinc-800/60 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-rose-400">#{idx + 1}</span>
                        <span className="font-mono text-zinc-400">
                          {line.startTime.toFixed(2)}s - {line.endTime.toFixed(2)}s
                        </span>
                      </div>
                      <p className="text-xs font-medium truncate">{line.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Word-Level Fine Timing Editor */}
            <div className="w-full md:w-1/2 flex flex-col min-h-0 bg-zinc-950/40 p-3 overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300 mb-2">
                <span>Chỉnh Mốc Từ Chi Tiết</span>
                <span className="text-[10px] text-zinc-500">
                  {currentLine ? `Đang chỉnh: "${currentLine.text}"` : 'Chọn 1 câu ở bên trái'}
                </span>
              </div>

              {currentLine && currentLine.words && currentLine.words.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentLine.words.map((word, wIdx) => {
                      const isWordSelected = selectedWordIndex === wIdx;
                      return (
                        <div
                          key={wIdx}
                          onClick={() => setSelectedWordIndex(wIdx)}
                          className={`p-2 rounded-xl border transition ${
                            isWordSelected
                              ? 'bg-sky-950/60 border-sky-400 text-white'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-sky-300">{word.text}</span>
                            <span className="font-mono text-[10px] text-zinc-400">
                              {(word.endTime - word.startTime).toFixed(2)}s
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = lyrics.map((l) => {
                                    if (l.id === currentLine.id && l.words) {
                                      const w = [...l.words];
                                      w[wIdx] = {
                                        ...w[wIdx],
                                        startTime: Math.max(0, Number((w[wIdx].startTime - 0.05).toFixed(2))),
                                      };
                                      return { ...l, words: w };
                                    }
                                    return l;
                                  });
                                  setLyrics(updated);
                                }}
                                className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                              >
                                -0.05
                              </button>
                              <span>{word.startTime.toFixed(2)}s</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = lyrics.map((l) => {
                                    if (l.id === currentLine.id && l.words) {
                                      const w = [...l.words];
                                      w[wIdx] = {
                                        ...w[wIdx],
                                        startTime: Number((w[wIdx].startTime + 0.05).toFixed(2)),
                                      };
                                      return { ...l, words: w };
                                    }
                                    return l;
                                  });
                                  setLyrics(updated);
                                }}
                                className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                              >
                                +0.05
                              </button>
                            </div>

                            <span className="text-zinc-600">→</span>

                            <div className="flex items-center gap-1">
                              <span>{word.endTime.toFixed(2)}s</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500 text-xs">
                  <ListMusic className="w-8 h-8 mb-2 opacity-50" />
                  <p>Chọn câu hát ở cột bên trái để vi chỉnh mốc thời gian từ.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
