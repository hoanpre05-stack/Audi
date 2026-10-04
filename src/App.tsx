import React, { useState, useEffect, useRef } from 'react';
import { ProjectData, AspectRatio, LyricLine } from './types';
import { SAMPLE_PROJECTS } from './utils/sampleData';
import { generateDemoAudioTrack } from './utils/audioGenerator';
import { VideoCanvas } from './components/VideoCanvas';
import { AudioPlayerControls } from './components/AudioPlayerControls';
import { Navbar } from './components/Navbar';
import { LyricEditor } from './components/LyricEditor';
import { StyleCustomizer } from './components/StyleCustomizer';
import { AiTranscribeModal } from './components/AiTranscribeModal';
import { ExportModal } from './components/ExportModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { AiDirectorModal } from './components/AiDirectorModal';
import { ForcedAlignmentModal } from './components/ForcedAlignmentModal';
import { AdSenseSlot } from './components/AdSenseSlot';
import { SeoArticlesSection } from './components/SeoArticlesSection';
import { LyricVideoExporter, ExportProgress } from './utils/videoExporter';
import { SlidersHorizontal, ListMusic } from 'lucide-react';

export default function App() {
  const [project, setProject] = useState<ProjectData>(SAMPLE_PROJECTS[0].data);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoop, setIsLoop] = useState<boolean>(true);

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isAiDirectorOpen, setIsAiDirectorOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isForcedAlignmentOpen, setIsForcedAlignmentOpen] = useState<boolean>(false);
  const [rightPanelTab, setRightPanelTab] = useState<'lyrics' | 'styles'>('styles');

  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<ExportProgress>({
    progress: 0,
    currentTime: 0,
    duration: 24,
    isComplete: false,
  });

  // Audio & Canvas references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const streamDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const exporterRef = useRef<LyricVideoExporter | null>(null);

  // Initialize demo audio track on mount
  useEffect(() => {
    let active = true;
    generateDemoAudioTrack(24).then((url) => {
      if (active) {
        setProject((prev) => ({
          ...prev,
          audioUrl: url,
          audioDuration: 24,
        }));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Sync audio source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !project.audioUrl) return;

    audio.src = project.audioUrl;
    audio.load();
    setCurrentTime(0);
    setIsPlaying(false);
  }, [project.audioUrl]);

  // Setup Web Audio Analyser for real-time beat sync & audio export
  const setupAudioAnalyser = () => {
    if (audioContextRef.current || !audioRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      const masterGain = ctx.createGain();
      masterGain.gain.value = isMuted || isExporting ? 0 : volume;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);

      // Route to user's physical speakers through masterGain (can be muted silently during export)
      analyser.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Route to video recorder stream at 100% full volume always
      const streamDest = ctx.createMediaStreamDestination();
      analyser.connect(streamDest);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      masterGainRef.current = masterGain;
      streamDestinationRef.current = streamDest;
    } catch {
      // Audio element might already have a source connected or CORS limitation
    }
  };

  // Sync physical speaker volume & mute states
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = isMuted || isExporting ? 0 : volume;
    }
  }, [volume, isMuted, isExporting]);

  // 60FPS continuous audio time synchronization for silky smooth animations & controls
  useEffect(() => {
    let animId: number;
    const syncTime = () => {
      if (audioRef.current && isPlaying) {
        setCurrentTime(audioRef.current.currentTime);
        animId = requestAnimationFrame(syncTime);
      }
    };
    if (isPlaying) {
      animId = requestAnimationFrame(syncTime);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  // Play / Pause handling
  const handlePlayToggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setupAudioAnalyser();
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Audio play error:', err);
      }
    }
  };

  // Seek handler
  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  // Volume & Mute
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      audioRef.current.muted = false;
    }
  };

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  // Sample song selection
  const handleSelectSample = async (sampleId: string) => {
    const sample = SAMPLE_PROJECTS.find((s) => s.id === sampleId);
    if (!sample) return;

    const demoAudioUrl = await generateDemoAudioTrack(sample.data.audioDuration || 24);
    setProject({
      ...sample.data,
      audioUrl: demoAudioUrl,
    });
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // AI Generated project applied
  const handleProjectGenerated = (newProjectData: Partial<ProjectData>) => {
    setProject((prev) => ({
      ...prev,
      ...newProjectData,
      layoutMode: newProjectData.layoutMode || 'generative_ai',
      generativeLayout: newProjectData.generativeLayout || prev.generativeLayout,
      typography: newProjectData.typography || prev.typography,
      background: newProjectData.background || prev.background,
      lyrics: newProjectData.lyrics || prev.lyrics,
      audioUrl: newProjectData.audioUrl || prev.audioUrl,
      audioDuration: newProjectData.audioDuration || prev.audioDuration,
    }));
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Video Export execution
  const handleStartExport = async () => {
    if (!canvasRef.current || !audioRef.current) return;
    setIsExporting(true);
    setIsPlaying(true);
    setExportStatus({
      progress: 0,
      currentTime: 0,
      duration: project.audioDuration,
      isComplete: false,
    });

    setupAudioAnalyser();
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume().catch(() => {});
    }

    const exporter = new LyricVideoExporter();
    exporterRef.current = exporter;

    try {
      await exporter.exportVideo(
        canvasRef.current,
        audioRef.current,
        project.audioDuration,
        streamDestinationRef.current?.stream || null,
        (status) => {
          setExportStatus(status);
          if (status.isComplete || status.error) {
            setIsExporting(false);
            setIsPlaying(false);
          }
        }
      );
    } catch (err: any) {
      console.warn('Export halted:', err);
      setIsExporting(false);
      setIsPlaying(false);
    }
  };

  const handleCancelExport = () => {
    if (exporterRef.current) {
      exporterRef.current.cancel();
      setIsExporting(false);
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-screen overflow-y-auto bg-zinc-950 text-zinc-100 font-sans select-none">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={project.audioUrl || undefined}
        crossOrigin="anonymous"
        loop={isLoop}
        onTimeUpdate={() => {
          if (audioRef.current && !isPlaying) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onEnded={() => {
          if (!isLoop) setIsPlaying(false);
        }}
      />

      {/* Top Navigation */}
      <Navbar
        aspectRatio={project.aspectRatio}
        onAspectRatioChange={(ratio: AspectRatio) =>
          setProject((p) => ({ ...p, aspectRatio: ratio }))
        }
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenAiDirector={() => setIsAiDirectorOpen(true)}
        onOpenForcedAlignment={() => setIsForcedAlignmentOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onSelectSample={handleSelectSample}
        isExporting={isExporting}
      />

      {/* Main Studio Workspace */}
      <main className="w-full lg:h-[80vh] min-h-[640px] flex flex-col lg:flex-row p-3 gap-3 shrink-0">
        {/* Left Column: Canvas Preview Player & Bottom Playback Bar */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 gap-3">
          {/* Top Banner Ad Slot */}
          <AdSenseSlot placement="header" format="horizontal" className="shrink-0" />

          {/* Canvas Viewport */}
          <div className="flex-1 relative min-h-0 w-full flex items-center justify-center p-2 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 overflow-hidden shadow-inner">
            <VideoCanvas
              project={project}
              currentTime={currentTime}
              isPlaying={isPlaying}
              audioAnalyser={analyserRef.current}
              canvasRef={canvasRef}
              isExporting={isExporting}
              audioRef={audioRef}
            />
          </div>

          {/* Bottom Audio Scrubber & Controls */}
          <AudioPlayerControls
            isPlaying={isPlaying}
            onPlayToggle={handlePlayToggle}
            currentTime={currentTime}
            duration={project.audioDuration}
            onSeek={handleSeek}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            isMuted={isMuted}
            onMuteToggle={handleMuteToggle}
            isLoop={isLoop}
            onLoopToggle={() => setIsLoop(!isLoop)}
          />
        </div>

        {/* Right Column: Inspector / Editor Panels (Tabs) */}
        <div className="w-full lg:w-[460px] xl:w-[500px] flex flex-col h-72 lg:h-full shrink-0">
          {/* Panel Selector Bar */}
          <div className="flex items-center gap-2 mb-2 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/60">
            <button
              onClick={() => setRightPanelTab('styles')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                rightPanelTab === 'styles'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Hiệu Ứng & Font Chữ</span>
            </button>

            <button
              onClick={() => setRightPanelTab('lyrics')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                rightPanelTab === 'lyrics'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Lời Bài Hát ({project.lyrics.length})</span>
            </button>
          </div>

          {/* Tab View */}
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            <div className="flex-1 min-h-0">
              {rightPanelTab === 'styles' ? (
                <StyleCustomizer
                  typography={project.typography}
                  background={project.background}
                  visualizer={project.visualizer}
                  layoutMode={project.layoutMode}
                  generativeLayout={project.generativeLayout}
                  channelLogoText={project.channelLogoText}
                  onOpenAiDirector={() => setIsAiDirectorOpen(true)}
                  onUpdateTypography={(t) =>
                    setProject((p) => ({ ...p, typography: t }))
                  }
                  onUpdateBackground={(b) =>
                    setProject((p) => ({ ...p, background: b }))
                  }
                  onUpdateVisualizer={(v) =>
                    setProject((p) => ({ ...p, visualizer: v }))
                  }
                  onUpdateLayoutMode={(mode) =>
                    setProject((p) => ({ ...p, layoutMode: mode }))
                  }
                  onUpdateGenerativeLayout={(gl) =>
                    setProject((p) => ({ ...p, generativeLayout: gl }))
                  }
                  onUpdateChannelLogo={(logo) =>
                    setProject((p) => ({ ...p, channelLogoText: logo }))
                  }
                />
              ) : (
                <LyricEditor
                  lyrics={project.lyrics}
                  currentTime={currentTime}
                  onSeek={handleSeek}
                  onUpdateLyrics={(l: LyricLine[]) =>
                    setProject((p) => ({ ...p, lyrics: l }))
                  }
                  onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
                  onOpenForcedAlignment={() => setIsForcedAlignmentOpen(true)}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* SEO Articles guide content area (Flows naturally on scroll) */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/80 w-full shrink-0">
        <SeoArticlesSection />
      </div>

      {/* Forced Alignment Studio (Căn Khớp Sóng Âm) Modal */}
      <ForcedAlignmentModal
        isOpen={isForcedAlignmentOpen}
        onClose={() => setIsForcedAlignmentOpen(false)}
        project={project}
        onApplyLyrics={(updatedLyrics) =>
          setProject((p) => ({ ...p, lyrics: updatedLyrics }))
        }
      />

      {/* AI Creative Video Director Modal */}
      <AiDirectorModal
        isOpen={isAiDirectorOpen}
        onClose={() => setIsAiDirectorOpen(false)}
        project={project}
        onApplyDesign={(designed) => {
          setProject((prev) => ({
            ...prev,
            ...designed,
          }));
        }}
      />

      {/* AI Audio Transcription & Auto Video Generation Modal */}
      <AiTranscribeModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onProjectGenerated={handleProjectGenerated}
      />

      {/* Video Exporter Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        exportStatus={exportStatus}
        onStartExport={handleStartExport}
        onCancelExport={handleCancelExport}
        isExporting={isExporting}
        project={project}
      />

      {/* AI Lyrics Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        audioDuration={project.audioDuration}
        onApplyLyrics={(lines) =>
          setProject((p) => ({ ...p, lyrics: lines }))
        }
      />
    </div>
  );
}
