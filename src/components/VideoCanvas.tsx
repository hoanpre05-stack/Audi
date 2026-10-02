import React, { useEffect, useRef, useState } from 'react';
import { ProjectData, LyricLine, WordTiming } from '../types';

interface VideoCanvasProps {
  project: ProjectData;
  currentTime: number;
  isPlaying: boolean;
  audioAnalyser?: AnalyserNode | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  previewScale?: number;
  isExporting?: boolean;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  project,
  currentTime,
  isPlaying,
  audioAnalyser,
  canvasRef,
  isExporting,
  audioRef,
}) => {
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; size: number; speedY: number; alpha: number }>>([]);

  // Live mutable refs to avoid tearing down RAF loop on every state change
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const projectRef = useRef(project);
  projectRef.current = project;

  const isExportingRef = useRef(isExporting);
  isExportingRef.current = isExporting;

  const bgImageRef = useRef<HTMLImageElement | null>(null);
  bgImageRef.current = bgImage;

  // Determine canvas resolution based on aspect ratio
  const getCanvasDimensions = () => {
    switch (project.aspectRatio) {
      case '9:16':
        return { width: 1080, height: 1920 };
      case '16:9':
        return { width: 1920, height: 1080 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '4:5':
        return { width: 1080, height: 1350 };
      default:
        return { width: 1080, height: 1920 };
    }
  };

  const { width: V_WIDTH, height: V_HEIGHT } = getCanvasDimensions();

  // Load background image
  useEffect(() => {
    if (!project.background.imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = project.background.imageUrl;
    img.onload = () => setBgImage(img);
  }, [project.background.imageUrl]);

  // Initialize floating particles
  useEffect(() => {
    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * V_WIDTH,
        y: Math.random() * V_HEIGHT,
        size: Math.random() * 4 + 1.5,
        speedY: Math.random() * 0.8 + 0.3,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }
    particlesRef.current = particles;
  }, [V_WIDTH, V_HEIGHT]);

  // Main rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set internal resolution
    if (canvas.width !== V_WIDTH || canvas.height !== V_HEIGHT) {
      canvas.width = V_WIDTH;
      canvas.height = V_HEIGHT;
    }

    const render = () => {
      ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

      // Continuous 60fps hardware audio clock
      let sampleTime = currentTimeRef.current;
      if (audioRef?.current && isPlayingRef.current && !isExportingRef.current) {
        sampleTime = audioRef.current.currentTime;
      }

      const curProj = projectRef.current;
      const curPlaying = isPlayingRef.current;
      const curBg = bgImageRef.current;

      // 1. Get live audio frequency data for beat reaction
      let bassEnergy = 0;
      let frequencyData = new Uint8Array(64);
      if (audioAnalyser) {
        audioAnalyser.getByteFrequencyData(frequencyData);
        // Average low-end frequencies (bass)
        let sum = 0;
        for (let i = 0; i < 8; i++) sum += frequencyData[i];
        bassEnergy = sum / 8; // 0 to 255
      } else if (curPlaying) {
        // Fallback procedural beat bounce
        const bpm = 90;
        const beatSec = 60 / bpm;
        const phase = (sampleTime % beatSec) / beatSec;
        bassEnergy = Math.max(0, Math.sin(phase * Math.PI)) * 180;
      }

      const bassFactor = bassEnergy / 255; // 0.0 to 1.0

      // 2. Render Background with Effects
      ctx.save();
      if (curBg && curBg.complete && curBg.naturalWidth > 0) {
        let scale = 1.05;
        let offsetX = 0;
        let offsetY = 0;
        const effect = curProj.background.effect;

        if (effect === 'ken_burns') {
          scale = 1.08 + 0.06 * Math.sin(sampleTime * 0.3);
          offsetX = Math.sin(sampleTime * 0.25) * 30;
          offsetY = Math.cos(sampleTime * 0.2) * 20;
        } else if (effect === 'bass_pulse') {
          scale = 1.03 + bassFactor * 0.06;
        }

        // Draw image cover-fit with scale & pan
        const imgAspect = curBg.naturalWidth / curBg.naturalHeight;
        const canvasAspect = V_WIDTH / V_HEIGHT;
        let renderW = V_WIDTH;
        let renderH = V_HEIGHT;

        if (imgAspect > canvasAspect) {
          renderH = V_HEIGHT * scale;
          renderW = renderH * imgAspect;
        } else {
          renderW = V_WIDTH * scale;
          renderH = renderW / imgAspect;
        }

        const drawX = (V_WIDTH - renderW) / 2 + offsetX;
        const drawY = (V_HEIGHT - renderH) / 2 + offsetY;

        ctx.drawImage(curBg, drawX, drawY, renderW, renderH);

        // Vinyl Spin Mode: draw center turntable vinyl
        if (effect === 'vinyl_spin') {
          // Dim the background more
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

          const centerX = V_WIDTH / 2;
          const centerY = V_HEIGHT * 0.42;
          const vinylRadius = Math.min(V_WIDTH, V_HEIGHT) * 0.32;
          const rotation = isPlaying ? currentTime * 1.5 : 0;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(rotation);

          // Outer vinyl disc (grooves)
          ctx.beginPath();
          ctx.arc(0, 0, vinylRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#111115';
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#27272a';
          ctx.stroke();

          // Vinyl grooves
          for (let r = vinylRadius * 0.55; r < vinylRadius * 0.95; r += 14) {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
            ctx.stroke();
          }

          // Center label with album cover
          if (curBg) {
            ctx.beginPath();
            ctx.arc(0, 0, vinylRadius * 0.42, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(
              curBg,
              -vinylRadius * 0.42,
              -vinylRadius * 0.42,
              vinylRadius * 0.84,
              vinylRadius * 0.84
            );
          }

          // Center spindle hole
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fillStyle = '#09090b';
          ctx.fill();
          ctx.strokeStyle = '#52525b';
          ctx.stroke();

          ctx.restore();
        }
      } else {
        // Fallback stylish dark gradient background
        const grad = ctx.createLinearGradient(0, 0, V_WIDTH, V_HEIGHT);
        grad.addColorStop(0, '#09090b');
        grad.addColorStop(0.5, '#18181b');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      }
      ctx.restore();

      // 3. Apply Color Grade Filters & Overlays
      ctx.save();
      const filter = project.background.filter;
      if (filter === 'sunset') {
        const sunGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
        sunGrad.addColorStop(0, 'rgba(244, 63, 94, 0.25)');
        sunGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
        sunGrad.addColorStop(1, 'rgba(15, 23, 42, 0.7)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      } else if (filter === 'cyberpunk') {
        const cyberGrad = ctx.createLinearGradient(0, 0, V_WIDTH, V_HEIGHT);
        cyberGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
        cyberGrad.addColorStop(1, 'rgba(236, 72, 153, 0.35)');
        ctx.fillStyle = cyberGrad;
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      } else if (filter === 'cinematic_teal') {
        const tealGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
        tealGrad.addColorStop(0, 'rgba(13, 148, 136, 0.25)');
        tealGrad.addColorStop(1, 'rgba(249, 115, 22, 0.2)');
        ctx.fillStyle = tealGrad;
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      } else if (filter === 'vintage_warm') {
        ctx.fillStyle = 'rgba(217, 119, 6, 0.18)';
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      } else if (filter === 'moody_bw') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      }

      // Dimming overlay
      ctx.fillStyle = `rgba(0, 0, 0, ${project.background.dimOpacity})`;
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      // Vignette effect
      const vignette = ctx.createRadialGradient(
        V_WIDTH / 2,
        V_HEIGHT / 2,
        Math.min(V_WIDTH, V_HEIGHT) * 0.4,
        V_WIDTH / 2,
        V_HEIGHT / 2,
        Math.max(V_WIDTH, V_HEIGHT) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      ctx.restore();

      // 4. Floating Particles Effect
      if (project.background.effect === 'particles_glow') {
        ctx.save();
        ctx.fillStyle = project.typography.highlightColor || '#F43F5E';
        particlesRef.current.forEach((p) => {
          p.y -= p.speedY;
          if (p.y < -10) {
            p.y = V_HEIGHT + 10;
            p.x = Math.random() * V_WIDTH;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.globalAlpha = p.alpha + Math.sin(currentTime * 2 + p.x) * 0.2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = project.typography.highlightColor;
          ctx.fill();
        });
        ctx.restore();
      }

      // 5. Audio Visualizer Spectrum / Waves
      if (project.visualizer.type !== 'none') {
        ctx.save();
        ctx.globalAlpha = project.visualizer.opacity;
        const visColor = project.visualizer.color || '#F43F5E';

        if (project.visualizer.type === 'bars') {
          const barCount = project.visualizer.barCount || 30;
          const totalWidth = V_WIDTH * 0.75;
          const barWidth = totalWidth / barCount - 4;
          const startX = (V_WIDTH - totalWidth) / 2;
          const baseY = V_HEIGHT * 0.88;

          for (let i = 0; i < barCount; i++) {
            // Frequency or wave simulation
            let val = 0.2;
            if (audioAnalyser) {
              const freqIdx = Math.floor((i / barCount) * 40);
              val = frequencyData[freqIdx] / 255;
            } else if (isPlaying) {
              val =
                0.25 +
                0.55 * Math.abs(Math.sin(currentTime * 5 + i * 0.35)) * (0.4 + 0.6 * bassFactor);
            }

            const barHeight = Math.max(8, val * 160);
            const x = startX + i * (barWidth + 4);
            const y = baseY - barHeight;

            const barGrad = ctx.createLinearGradient(0, y, 0, baseY);
            barGrad.addColorStop(0, visColor);
            barGrad.addColorStop(1, 'rgba(255, 255, 255, 0.15)');

            ctx.fillStyle = barGrad;
            ctx.shadowBlur = 8;
            ctx.shadowColor = visColor;

            // Draw rounded bar
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
            ctx.fill();
          }
        } else if (project.visualizer.type === 'wave') {
          const centerY = V_HEIGHT * 0.86;
          ctx.beginPath();
          ctx.lineWidth = 4;
          ctx.strokeStyle = visColor;
          ctx.shadowBlur = 12;
          ctx.shadowColor = visColor;

          for (let x = 0; x < V_WIDTH; x += 10) {
            const waveAmp = 25 * (0.3 + 0.7 * bassFactor);
            const y =
              centerY +
              Math.sin((x / V_WIDTH) * 12 + currentTime * 4) * waveAmp +
              Math.sin((x / V_WIDTH) * 24 - currentTime * 3) * (waveAmp * 0.4);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        } else if (project.visualizer.type === 'circle') {
          const cX = V_WIDTH / 2;
          const cY = V_HEIGHT * 0.42;
          const baseR = Math.min(V_WIDTH, V_HEIGHT) * 0.34;
          const barCount = 48;

          ctx.save();
          ctx.translate(cX, cY);
          for (let i = 0; i < barCount; i++) {
            const angle = (i / barCount) * Math.PI * 2;
            let val = 0.2;
            if (audioAnalyser) {
              const freqIdx = Math.floor((i / barCount) * 32);
              val = frequencyData[freqIdx] / 255;
            } else if (isPlaying) {
              val = 0.2 + 0.5 * Math.abs(Math.sin(currentTime * 4 + i * 0.5)) * (0.5 + 0.5 * bassFactor);
            }

            const barLen = 10 + val * 65;
            const x1 = Math.cos(angle) * baseR;
            const y1 = Math.sin(angle) * baseR;
            const x2 = Math.cos(angle) * (baseR + barLen);
            const y2 = Math.sin(angle) * (baseR + barLen);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = visColor;
            ctx.shadowBlur = 8;
            ctx.shadowColor = visColor;
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.restore();
      }

      // 6. Dynamic Generative AI Composition Engine (Completely unconstrained layouts)
      renderGenerativeComposition(
        ctx,
        curProj,
        sampleTime,
        curBg,
        bassFactor,
        frequencyData,
        V_WIDTH,
        V_HEIGHT
      );

      if (curPlaying || isExportingRef.current) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    project,
    currentTime,
    isPlaying,
    isExporting,
    audioAnalyser,
    bgImage,
    V_WIDTH,
    V_HEIGHT,
  ]);

  // Helper to draw a luminous 4-point diamond star / sparkle
  const drawSparkle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    alpha: number,
    color: string
  ) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = color;
    ctx.shadowBlur = 14;
    ctx.shadowColor = color;

    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.quadraticCurveTo(x, y, x + size, y);
    ctx.quadraticCurveTo(x, y, x, y + size);
    ctx.quadraticCurveTo(x, y, x - size, y);
    ctx.quadraticCurveTo(x, y, x, y - size);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, size * 0.28), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Helper: Check whether current time is in an instrumental non-singing section
  const getInstrumentalState = (allLines: LyricLine[], curT: number) => {
    if (!allLines || allLines.length === 0) {
      return { isInstrumental: true, type: 'none', label: 'CHƯA CÓ LỜI BÀI HÁT' };
    }

    const firstL = allLines[0];
    const lastL = allLines[allLines.length - 1];

    // 1. Song Intro (before first line starts with 0.5s transition window)
    if (curT < firstL.startTime - 0.5) {
      return { isInstrumental: true, type: 'intro', label: '♫ INTRO • ĐOẠN NHẠC DẠO ĐẦU' };
    }

    // 2. Song Outro (after last line finishes + 0.6s linger)
    if (curT > lastL.endTime + 0.6) {
      return { isInstrumental: true, type: 'outro', label: '♫ OUTRO • KẾT THÚC BÀI HÁT' };
    }

    // 3. Instrumental Break between lines (gap >= 1.5s)
    let prevL: LyricLine | null = null;
    let nextL: LyricLine | null = null;
    for (let i = 0; i < allLines.length; i++) {
      if (allLines[i].endTime <= curT) prevL = allLines[i];
      if (allLines[i].startTime >= curT && !nextL) nextL = allLines[i];
    }

    if (prevL && nextL) {
      const gap = nextL.startTime - prevL.endTime;
      if (gap >= 1.5 && curT > prevL.endTime + 0.5 && curT < nextL.startTime - 0.5) {
        return { isInstrumental: true, type: 'break', label: '♫ INSTRUMENTAL • ĐOẠN DẠO NHẠC' };
      }
    }

    return { isInstrumental: false, type: 'singing', label: '' };
  };

  // Dynamic Generative AI Composition Engine (Custom unconstrained layouts)
  const renderGenerativeComposition = (
    ctx: CanvasRenderingContext2D,
    proj: ProjectData,
    time: number,
    img: HTMLImageElement | null,
    bassFactor: number,
    frequencyData: Uint8Array,
    width: number,
    height: number
  ) => {
    // Dynamic generative layout with intelligent defaults
    const layout = proj.generativeLayout || {
      artworkDisplay: {
        mode: 'side_card',
        shape: 'rounded_square',
        scale: 0.44,
        glowColor: proj.typography.highlightColor || '#38BDF8',
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
        accentBarColor: proj.typography.highlightColor || '#38BDF8',
      },
      visualizerPlacement: {
        position: 'under_artwork',
        style: 'bars',
        color: proj.typography.highlightColor || '#38BDF8',
      },
      branding: {
        showTrackBadge: true,
        trackBadgeText: proj.channelLogoText || 'AI DIRECTOR CUT',
        titlePlacement: 'above_lyrics',
      },
    };

    ctx.save();
    const isLandscape = proj.aspectRatio === '16:9';
    const isVertical = proj.aspectRatio === '9:16';
    const isSquare = proj.aspectRatio === '1:1' || proj.aspectRatio === '4:5';
    const artMode = layout.artworkDisplay.mode;

    // 1. TOP CINEMATIC STUDIO HUD (Record badge, 4K label, timecode)
    ctx.save();
    const hudY = isVertical ? height * 0.05 : height * 0.07;
    const hudLeftX = width * 0.08;
    const hudRightX = width * 0.92;

    // Red REC indicator
    const isBlink = Math.floor(time * 2) % 2 === 0;
    ctx.beginPath();
    ctx.arc(hudLeftX + 6, hudY - 5, 5, 0, Math.PI * 2);
    ctx.fillStyle = isBlink ? '#EF4444' : '#7F1D1D';
    ctx.shadowBlur = isBlink ? 12 : 2;
    ctx.shadowColor = '#EF4444';
    ctx.fill();

    ctx.font = '700 13px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.textAlign = 'left';
    ctx.fillText('REC', hudLeftX + 18, hudY);

    // Track concept badge
    if (layout.branding?.showTrackBadge || proj.channelLogoText) {
      ctx.fillStyle = proj.typography.highlightColor || '#38BDF8';
      ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `✦ ${(proj.channelLogoText || layout.branding?.trackBadgeText || 'AI DIRECTOR CUT').toUpperCase()}`,
        hudLeftX + 60,
        hudY
      );
    }

    // Timecode in top-right
    const minStr = String(Math.floor(time / 60)).padStart(2, '0');
    const secStr = String(Math.floor(time % 60)).padStart(2, '0');
    const frameStr = String(Math.floor((time * 30) % 30)).padStart(2, '0');
    ctx.textAlign = 'right';
    ctx.font = '700 13px "Space Grotesk", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText(`[ 4K • 60FPS ]   00:${minStr}:${secStr}:${frameStr}`, hudRightX, hudY);
    ctx.restore();

    // 2. RESPONSIVE GEOMETRY (Centering on User's Photo with Flawless Proportions)
    let cardX: number;
    let cardY: number;
    let cardW: number;
    let cardH: number;
    let titleX: number;
    let titleY: number;
    let lyricStartX: number;
    let lyricStartY: number;
    let isCentered: boolean;
    let baseFontSize: number;

    if (isVertical) {
      // 9:16 Vertical Mobile Layout (Shorts / TikTok / Reels)
      cardW = width * 0.65;
      cardH = artMode === 'polaroid_badge' ? cardW * 1.16 : cardW;
      cardX = (width - cardW) / 2;
      cardY = height * 0.15;
      titleX = width / 2;
      titleY = cardY + cardH + 48;
      isCentered = true;
      lyricStartX = width / 2;
      lyricStartY = titleY + 56;
      baseFontSize = 32;
    } else if (isSquare) {
      // 1:1 or 4:5 Square / Portrait Layout
      cardW = width * 0.46;
      cardH = artMode === 'polaroid_badge' ? cardW * 1.16 : cardW;
      cardX = (width - cardW) / 2;
      cardY = height * 0.12;
      titleX = width / 2;
      titleY = cardY + cardH + 42;
      isCentered = true;
      lyricStartX = width / 2;
      lyricStartY = titleY + 50;
      baseFontSize = 28;
    } else {
      // 16:9 Landscape Layout (YouTube MV)
      cardW = width * 0.34;
      cardH = artMode === 'polaroid_badge' ? cardW * 1.16 : cardW;
      cardX = width * 0.08;
      cardY = height * 0.18;
      titleX = width * 0.48;
      titleY = cardY + 28;
      isCentered = false;
      lyricStartX = width * 0.48;
      lyricStartY = titleY + 68;
      baseFontSize = 30;
    }

    // Override lyrics placement if requested
    if (layout.lyricsDisplay?.placement === 'center_stage') {
      isCentered = true;
      lyricStartX = width / 2;
      lyricStartY = height * 0.56;
      baseFontSize = 36;
    } else if (layout.lyricsDisplay?.placement === 'bottom_cinematic') {
      isCentered = true;
      lyricStartX = width / 2;
      lyricStartY = height * 0.74;
    }

    // 100% Freeform AI Custom Spatial Coordinate Overrides with Aspect Ratio Safe Adaptation
    if (layout.artworkDisplay?.customPos) {
      const cp = layout.artworkDisplay.customPos;
      if (cp.widthPercent) {
        cardW = (cp.widthPercent / 100) * width;
      } else {
        cardW = isVertical ? width * 0.62 : isSquare ? width * 0.46 : width * 0.34;
      }

      // Enforce 1:1 pristine square or 1:1.15 polaroid ratio to prevent vertical photo elongation
      const isPolaroid = artMode === 'polaroid_badge' || layout.artworkDisplay.shape === 'polaroid';
      cardH = isPolaroid ? cardW * 1.15 : cardW;

      let targetXPercent = cp.xPercent;
      let targetYPercent = cp.yPercent;

      // In 9:16 vertical or 1:1 square, ensure card stays centered horizontally and well-proportioned
      if (isVertical) {
        targetXPercent = 50;
        cardW = Math.min(cardW, width * 0.68);
        cardH = isPolaroid ? cardW * 1.15 : cardW;
        targetYPercent = Math.min(targetYPercent, 18);
      } else if (isSquare) {
        targetXPercent = 50;
        cardW = Math.min(cardW, width * 0.50);
        cardH = isPolaroid ? cardW * 1.15 : cardW;
        targetYPercent = Math.min(targetYPercent, 16);
      }

      cardX = (targetXPercent / 100) * width - cardW / 2;
      cardY = (targetYPercent / 100) * height;
    }

    if (layout.titleDisplay?.customPos) {
      let targetTitleX = (layout.titleDisplay.customPos.xPercent / 100) * width;
      let targetTitleY = (layout.titleDisplay.customPos.yPercent / 100) * height;

      if (isVertical) {
        targetTitleX = width / 2;
        targetTitleY = Math.max(cardY + cardH + 46, (layout.titleDisplay.customPos.yPercent / 100) * height);
        isCentered = true;
      } else if (isSquare) {
        targetTitleX = width / 2;
        targetTitleY = Math.max(cardY + cardH + 38, (layout.titleDisplay.customPos.yPercent / 100) * height);
        isCentered = true;
      } else if (layout.titleDisplay.alignment) {
        isCentered = layout.titleDisplay.alignment === 'center';
      }

      titleX = targetTitleX;
      titleY = targetTitleY;
    }

    if (layout.lyricsDisplay?.customPos) {
      let targetLyricX = (layout.lyricsDisplay.customPos.xPercent / 100) * width;
      let targetLyricY = (layout.lyricsDisplay.customPos.yPercent / 100) * height;

      if (isVertical) {
        targetLyricX = width / 2;
        targetLyricY = Math.max(titleY + 56, (layout.lyricsDisplay.customPos.yPercent / 100) * height);
        isCentered = true;
      } else if (isSquare) {
        targetLyricX = width / 2;
        targetLyricY = Math.max(titleY + 50, (layout.lyricsDisplay.customPos.yPercent / 100) * height);
        isCentered = true;
      } else if (layout.lyricsDisplay.alignment) {
        isCentered = layout.lyricsDisplay.alignment === 'center';
      }

      lyricStartX = targetLyricX;
      lyricStartY = targetLyricY;
    }

    // Render AI Generative Decorative Props (Laser lines, Ambient Halos, etc.)
    if (layout.decorativeProps && layout.decorativeProps.length > 0) {
      layout.decorativeProps.forEach((prop) => {
        const px = ((prop.xPercent ?? 50) / 100) * width;
        const py = ((prop.yPercent ?? 50) / 100) * height;
        const pColor = prop.color || proj.typography.highlightColor || '#38BDF8';

        if (prop.type === 'laser_divider') {
          ctx.save();
          ctx.strokeStyle = pColor;
          ctx.globalAlpha = 0.65;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 10;
          ctx.shadowColor = pColor;
          ctx.beginPath();
          ctx.moveTo(width * 0.08, py);
          ctx.lineTo(width * 0.92, py);
          ctx.stroke();
          ctx.restore();
        } else if (prop.type === 'ambient_halo') {
          ctx.save();
          const rad = ctx.createRadialGradient(px, py, 10, px, py, width * 0.3);
          rad.addColorStop(0, pColor);
          rad.addColorStop(1, 'transparent');
          ctx.globalAlpha = 0.22;
          ctx.fillStyle = rad;
          ctx.beginPath();
          ctx.arc(px, py, width * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
    }

    // A. FULLSCREEN CINEMATIC LETTERBOX MODE
    if (artMode === 'fullscreen_immersive') {
      ctx.save();
      // Letterbox Bars
      const barH = height * 0.10;
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, barH);
      ctx.fillRect(0, height - barH, width, barH);

      // Gold / Cyan divider lines
      ctx.strokeStyle = proj.typography.highlightColor || '#38BDF8';
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, barH);
      ctx.lineTo(width, barH);
      ctx.moveTo(0, height - barH);
      ctx.lineTo(width, height - barH);
      ctx.stroke();
      ctx.restore();
    }

    // B. ARTWORK CARD / VINYL / POLAROID RENDERING
    if (artMode !== 'fullscreen_immersive' && img) {
      ctx.save();
      const centerX = cardX + cardW / 2;
      const centerY = cardY + cardH / 2;

      // Bass Shockwave Ring
      if (bassFactor > 0.55) {
        ctx.save();
        const shockRadius = (cardW / 2) * (1.1 + (bassFactor - 0.55) * 0.8);
        ctx.beginPath();
        ctx.arc(centerX, centerY, shockRadius, 0, Math.PI * 2);
        ctx.strokeStyle = proj.typography.highlightColor || '#38BDF8';
        ctx.globalAlpha = Math.max(0, 1.0 - (bassFactor - 0.55) * 2);
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 14;
        ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
        ctx.stroke();
        ctx.restore();
      }

      // Apply rotation / tilt effect
      ctx.translate(centerX, centerY);
      if (artMode === 'floating_vinyl' || layout.artworkDisplay.rotationEffect === 'slow_spin') {
        ctx.rotate(time * 0.75);
      } else if (artMode === 'polaroid_badge') {
        ctx.rotate(-0.04 + Math.sin(time * 1.5) * 0.015);
      } else if (layout.artworkDisplay.rotationEffect === 'tilt_breath') {
        const tilt = Math.sin(time * 2) * 0.025;
        const breath = 1.0 + Math.sin(time * 3) * 0.015 + bassFactor * 0.02;
        ctx.rotate(tilt);
        ctx.scale(breath, breath);
      }
      ctx.translate(-centerX, -centerY);

      // Artwork Glow
      const glowBlur = layout.artworkDisplay.glowBlur || 24;
      const glowColor = layout.artworkDisplay.glowColor || proj.typography.highlightColor || '#38BDF8';
      ctx.shadowBlur = glowBlur + bassFactor * 10;
      ctx.shadowColor = glowColor;

      // 1. Polaroid Scrapbook Frame
      if (artMode === 'polaroid_badge') {
        ctx.save();
        // White photo backing
        ctx.fillStyle = '#FAFAFA';
        ctx.shadowBlur = 18;
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 12);
        ctx.fill();

        // Photo cutout inside polaroid
        const pad = 14;
        const photoH = cardH - 64;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(cardX + pad, cardY + pad, cardW - pad * 2, photoH, 6);
        ctx.clip();
        ctx.drawImage(img, cardX + pad, cardY + pad, cardW - pad * 2, photoH);
        ctx.restore();

        // Polaroid handwritten label in bottom margin
        ctx.fillStyle = '#18181B';
        ctx.font = '700 18px "Caveat", "Playfair Display", cursive';
        ctx.textAlign = 'center';
        ctx.fillText(proj.title || 'Polaroid Memory', cardX + cardW / 2, cardY + cardH - 24);

        // Washi tape sticker in top corner
        ctx.fillStyle = 'rgba(253, 230, 138, 0.75)';
        ctx.beginPath();
        ctx.roundRect(cardX + cardW * 0.25, cardY - 8, cardW * 0.5, 18, 4);
        ctx.fill();
        ctx.restore();
      } else {
        // Standard / Vinyl / Glass card clipping
        ctx.beginPath();
        if (artMode === 'floating_vinyl' || layout.artworkDisplay.shape === 'circle_vinyl') {
          ctx.arc(centerX, centerY, cardW / 2, 0, Math.PI * 2);
        } else {
          ctx.roundRect(cardX, cardY, cardW, cardH, 22);
        }
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.save();
        ctx.clip();

        // Draw user's image cover
        const iAspect = img.width / img.height;
        const cAspect = cardW / cardH;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (iAspect > cAspect) {
          sw = img.height * cAspect;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / cAspect;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, cardX, cardY, cardW, cardH);
        ctx.restore(); // restore clip

        // Glassmorphic Outer Border
        ctx.save();
        ctx.lineWidth = 2.5;
        const glassGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        glassGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        glassGrad.addColorStop(1, proj.typography.highlightColor || '#38BDF8');
        ctx.strokeStyle = glassGrad;
        ctx.beginPath();
        if (artMode === 'floating_vinyl' || layout.artworkDisplay.shape === 'circle_vinyl') {
          ctx.arc(centerX, centerY, cardW / 2, 0, Math.PI * 2);
        } else {
          ctx.roundRect(cardX, cardY, cardW, cardH, 22);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 2. Vinyl Grooves, Turntable Platter & Tonearm
      if (artMode === 'floating_vinyl' || layout.artworkDisplay.shape === 'circle_vinyl' || layout.artworkDisplay.showVinylGrooves) {
        ctx.save();
        // Vinyl grooves
        for (let r = 0.35; r < 0.95; r += 0.08) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, (cardW / 2) * r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        // Center spindle
        ctx.beginPath();
        ctx.arc(centerX, centerY, (cardW / 2) * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = '#09090b';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // Realistic Turntable Tonearm Stylus resting on vinyl
        ctx.save();
        const armBaseX = centerX + (cardW / 2) * 1.05;
        const armBaseY = centerY - (cardW / 2) * 0.85;
        const needleX = centerX + (cardW / 2) * 0.45;
        const needleY = centerY + (cardW / 2) * 0.15;

        // Tonearm pivot base
        ctx.beginPath();
        ctx.arc(armBaseX, armBaseY, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#27272A';
        ctx.fill();
        ctx.strokeStyle = '#71717A';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Tonearm metallic shaft
        ctx.beginPath();
        ctx.moveTo(armBaseX, armBaseY);
        ctx.lineTo(needleX, needleY);
        ctx.strokeStyle = '#E4E4E7';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Tonearm cartridge & glowing needle tip
        ctx.fillStyle = proj.typography.highlightColor || '#38BDF8';
        ctx.shadowBlur = 10;
        ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
        ctx.beginPath();
        ctx.arc(needleX, needleY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Viewfinder Brackets
      if (layout.artworkDisplay.showViewfinderCorners && artMode !== 'polaroid_badge') {
        ctx.save();
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 3.5;
        const bLen = 22;
        const bPad = 10;
        const bx = cardX - bPad;
        const by = cardY - bPad;
        const bw = cardW + bPad * 2;
        const bh = cardH + bPad * 2;
        ctx.beginPath(); ctx.moveTo(bx, by + bLen); ctx.lineTo(bx, by); ctx.lineTo(bx + bLen, by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + bw - bLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + bLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, by + bh - bLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bLen, by + bh); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + bw - bLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - bLen); ctx.stroke();
        ctx.restore();
      }

      // Reactive Ring Visualizer Around Artwork
      if (layout.visualizerPlacement?.position === 'around_artwork' || artMode === 'floating_vinyl') {
        ctx.save();
        const baseR = cardW / 2 + 8;
        const ringBars = 48;
        const ringColor = layout.visualizerPlacement?.color || proj.typography.highlightColor || '#38BDF8';
        ctx.translate(centerX, centerY);

        for (let i = 0; i < ringBars; i++) {
          const angle = (i / ringBars) * Math.PI * 2;
          let val = 0.2;
          if (audioAnalyser) {
            const freqIdx = Math.floor((i / ringBars) * 32);
            val = frequencyData[freqIdx] / 255;
          } else if (isPlaying) {
            val = 0.2 + 0.5 * Math.abs(Math.sin(time * 4 + i * 0.4)) * (0.4 + 0.6 * bassFactor);
          }
          const barLen = 5 + val * 40;
          const x1 = Math.cos(angle) * baseR;
          const y1 = Math.sin(angle) * baseR;
          const x2 = Math.cos(angle) * (baseR + barLen);
          const y2 = Math.sin(angle) * (baseR + barLen);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = ringColor;
          ctx.shadowBlur = 8;
          ctx.shadowColor = ringColor;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Reactive Equalizer Bars Docked inside Artwork Frame
      if (layout.visualizerPlacement?.position === 'under_artwork' && artMode !== 'floating_vinyl' && artMode !== 'polaroid_badge') {
        ctx.save();
        const visY = cardY + cardH - 10;
        const visW = cardW - 20;
        const visX = cardX + 10;
        const barCount = 28;
        const barW = (visW / barCount) - 2.5;
        const visColor = layout.visualizerPlacement?.color || proj.typography.highlightColor || '#38BDF8';

        for (let i = 0; i < barCount; i++) {
          let val = 0.2;
          if (audioAnalyser) {
            const freqIdx = Math.floor((i / barCount) * 32);
            val = frequencyData[freqIdx] / 255;
          } else if (isPlaying) {
            val = 0.15 + 0.6 * Math.abs(Math.sin(time * 5 + i * 0.45)) * (0.3 + 0.7 * bassFactor);
          }
          const barH = Math.max(3, val * 22);
          const bx = visX + i * (barW + 2.5);
          const by = visY - barH;

          ctx.fillStyle = visColor;
          ctx.shadowBlur = 8;
          ctx.shadowColor = visColor;
          ctx.beginPath();
          ctx.roundRect(bx, by, barW, barH, 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();
    }

    // 3. TITLE & ARTIST TEXT
    ctx.save();
    ctx.textAlign = isCentered ? 'center' : 'left';
    ctx.font = `800 ${isVertical ? 34 : 32}px "${proj.typography.fontFamily}", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.fillText(proj.title || 'Untitled Track', titleX, titleY);

    if (proj.artist) {
      ctx.font = `700 ${isVertical ? 20 : 18}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = proj.typography.highlightColor || '#38BDF8';
      ctx.shadowBlur = 8;
      ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
      ctx.fillText(proj.artist.toUpperCase(), titleX, titleY + (isVertical ? 32 : 28));
    }
    ctx.restore();

    // 4. CONTINUOUS LYRICS STREAM (Calibrated Synchronization)
    const lines = proj.lyrics;
    const effectiveTime = time + (proj.lyricOffset || 0);

    if (lines && lines.length > 0) {
      // Find active line index
      let activeIdx = lines.findIndex((l) => effectiveTime >= l.startTime && effectiveTime <= l.endTime);
      if (activeIdx === -1) {
        activeIdx = lines.findIndex((l) => effectiveTime < l.startTime);
        if (activeIdx === -1) activeIdx = lines.length - 1;
        else activeIdx = Math.max(0, activeIdx - 1);
      }

      // Dynamic configurable sliding window according to user-selected linesCount (1, 2, 3, or 4)
      const count = Math.max(1, Math.min(4, layout.lyricsDisplay?.linesCount ?? (isVertical ? 3 : 4)));
      let windowStart = 0;
      if (count === 1) {
        windowStart = activeIdx;
      } else if (count === 2) {
        windowStart = Math.max(0, Math.min(lines.length - 2, activeIdx));
      } else {
        windowStart = Math.max(0, Math.min(lines.length - count, activeIdx - 1));
      }
      const visibleLines = lines.slice(windowStart, windowStart + count);

      visibleLines.forEach((line, i) => {
        const lineSpacing = isVertical ? (count === 1 ? 70 : 58) : (count === 1 ? 64 : 50);
        const baseLineY = lyricStartY + 20 + i * lineSpacing;
        const isCurrentLine = effectiveTime >= line.startTime - 0.15 && effectiveTime <= line.endTime + 0.25;

        const lineY = baseLineY;

        ctx.save();
        if (isCurrentLine) {
          // Accent bar next to active line
          if (layout.lyricsDisplay?.showActiveAccentBar && !isCentered) {
            ctx.save();
            ctx.fillStyle = proj.typography.highlightColor || '#38BDF8';
            ctx.shadowBlur = 12 + Math.sin(time * 6) * 4;
            ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
            ctx.beginPath();
            ctx.roundRect(lyricStartX - 16, lineY - 22, 4, 28, 2);
            ctx.fill();
            ctx.restore();
          }

          // Larger focal font if single line mode is active
          const activeFontSize = count === 1 ? baseFontSize + 6 : baseFontSize;
          ctx.font = `800 ${activeFontSize}px "${proj.typography.fontFamily}", sans-serif`;

          // Weighted syllable/character length calculation when word timings are interpolated
          const words = line.words && line.words.length > 0
            ? line.words
            : (() => {
                const arr = line.text.split(/\s+/).filter(Boolean);
                const totalWeight = arr.reduce((acc, w) => acc + Math.max(2, w.length), 0) || 1;
                const lineDuration = Math.max(0.3, line.endTime - line.startTime);
                let curOffset = line.startTime;
                return arr.map((w) => {
                  const wFraction = Math.max(2, w.length) / totalWeight;
                  const wDur = lineDuration * wFraction;
                  const item = {
                    text: w,
                    startTime: Number(curOffset.toFixed(2)),
                    endTime: Number((curOffset + wDur).toFixed(2)),
                  };
                  curOffset += wDur;
                  return item;
                });
              })();

          const spaceW = ctx.measureText(' ').width;
          const wordMeasures = words.map((w) => {
            const txt = proj.typography.textCase === 'uppercase' ? w.text.toUpperCase() : w.text;
            return { text: txt, width: ctx.measureText(txt).width };
          });

          const totalLineW = wordMeasures.reduce((a, b) => a + b.width, 0) + spaceW * (words.length - 1);
          let curWordX = isCentered ? lyricStartX - totalLineW / 2 : lyricStartX;

          words.forEach((w, idx) => {
            const isSung = effectiveTime > w.endTime;
            const isSinging = effectiveTime >= w.startTime && effectiveTime <= w.endTime;
            const wText = wordMeasures[idx].text;
            const wWidth = wordMeasures[idx].width;

            const wDuration = Math.max(0.08, w.endTime - w.startTime);
            const rawProgress = isSinging ? Math.max(0, Math.min(1, (effectiveTime - w.startTime) / wDuration)) : isSung ? 1 : 0;
            const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);

            ctx.save();
            let offsetY = 0;
            let scale = 1.0;
            let rotation = 0;
            const timeSinceEnd = effectiveTime - w.endTime;

            const scalePeak = proj.typography.wordBounceScale ?? layout.keyframeMotion?.wordScalePeak ?? 1.10;
            const tiltAngleDeg = proj.typography.wordTiltAngle ?? layout.keyframeMotion?.wordTiltAngle ?? 3;
            const tiltMax = tiltAngleDeg * (Math.PI / 180);
            const pulseBass = proj.typography.pulseWithBass ?? true;

            if (isSinging) {
              const peak = Math.sin(progress * Math.PI);
              offsetY = -peak * 5;
              const bassBoost = pulseBass ? bassFactor * 0.05 : 0;
              scale = 1.0 + peak * (scalePeak - 1.0) + bassBoost;
              rotation = Math.sin(progress * Math.PI * 2) * tiltMax;
            } else if (isSung && timeSinceEnd < 0.2) {
              const linger = 1 - timeSinceEnd / 0.2;
              scale = 1.0 + linger * 0.03;
            }

            if (scale !== 1.0 || offsetY !== 0 || rotation !== 0) {
              ctx.translate(curWordX + wWidth / 2, lineY + offsetY);
              ctx.scale(scale, scale);
              if (rotation !== 0) ctx.rotate(rotation);
              ctx.translate(-(curWordX + wWidth / 2), -(lineY + offsetY));
            }

            if (isSinging) {
              if (proj.typography.kineticEffect === 'stardust_sparkle' || proj.typography.emotionalSparkles) {
                const sparkX = curWordX + wWidth * Math.min(1, Math.max(0.1, progress));
                const sparkY = lineY - 20 + offsetY;
                drawSparkle(ctx, sparkX, sparkY, 6, Math.abs(Math.sin(time * 6)), proj.typography.highlightColor || '#FDE047');
              }

              ctx.fillStyle = proj.typography.secondaryColor || 'rgba(255, 255, 255, 0.45)';
              ctx.fillText(wText, curWordX, lineY + offsetY);

              ctx.save();
              ctx.beginPath();
              ctx.rect(curWordX - 2, lineY - 30 + offsetY, wWidth * progress + 4, 40);
              ctx.clip();
              ctx.shadowBlur = 18;
              ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
              ctx.fillStyle = proj.typography.highlightColor || '#38BDF8';
              ctx.fillText(wText, curWordX, lineY + offsetY);
              ctx.fillStyle = '#FFFFFF';
              ctx.globalAlpha = 0.9;
              ctx.fillText(wText, curWordX, lineY + offsetY);
              ctx.restore();
            } else if (isSung) {
              ctx.fillStyle = '#FFFFFF';
              ctx.shadowBlur = 6;
              ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
              ctx.fillText(wText, curWordX, lineY + offsetY);
            } else {
              ctx.fillStyle = proj.typography.secondaryColor || 'rgba(255, 255, 255, 0.5)';
              ctx.fillText(wText, curWordX, lineY);
            }

            ctx.restore();
            curWordX += wWidth + spaceW;
          });
        } else {
          // Surrounding visible lines (Always visible, no blank gaps)
          const isPast = time > line.endTime;
          ctx.font = `600 ${baseFontSize - 4}px "Plus Jakarta Sans", sans-serif`;
          ctx.fillStyle = isPast ? 'rgba(255, 255, 255, 0.38)' : (proj.typography.secondaryColor || 'rgba(255, 255, 255, 0.6)');
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          const lineText = proj.typography.textCase === 'uppercase' ? line.text.toUpperCase() : line.text;
          ctx.textAlign = isCentered ? 'center' : 'left';
          ctx.fillText(lineText, lyricStartX, lineY);
        }
        ctx.restore();
      });
    }

    ctx.restore();
  };

  // RIN Music MV Studio Layout (Split-screen with Album Card, Viewfinder brackets, and 4-line stanza)
  const renderRinStudioLayout = (
    ctx: CanvasRenderingContext2D,
    proj: ProjectData,
    time: number,
    img: HTMLImageElement | null,
    bassFactor: number,
    frequencyData: Uint8Array,
    width: number,
    height: number
  ) => {
    ctx.save();

    const isLandscape = proj.aspectRatio === '16:9';
    const isPortrait = proj.aspectRatio === '9:16';

    // 1. Atmospheric liquid teal / cyan background decoration
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#031c26');
    bgGrad.addColorStop(0.5, '#02121a');
    bgGrad.addColorStop(1, '#01090f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic fluid wave shape at bottom
    ctx.save();
    ctx.beginPath();
    const waveH = height * 0.22;
    ctx.moveTo(0, height);
    ctx.lineTo(0, height - waveH);
    ctx.bezierCurveTo(
      width * 0.25,
      height - waveH - 60 - bassFactor * 25,
      width * 0.6,
      height - waveH + 70,
      width,
      height - waveH * 0.7
    );
    ctx.lineTo(width, height);
    ctx.closePath();
    const waveGrad = ctx.createLinearGradient(0, height - waveH, 0, height);
    waveGrad.addColorStop(0, 'rgba(16, 76, 94, 0.45)');
    waveGrad.addColorStop(1, 'rgba(6, 40, 50, 0.75)');
    ctx.fillStyle = waveGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Top-Left Music Channel Logo
    ctx.save();
    const logoX = 70;
    const logoY = 60;
    ctx.beginPath();
    ctx.arc(logoX + 20, logoY + 20, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('♫', logoX + 20, logoY + 27);

    // Top-Right Channel Brand (RIN MEDIA style)
    const rightLogoX = width - 180;
    ctx.textAlign = 'left';
    ctx.font = '900 26px "Orbitron", "Montserrat", sans-serif';
    ctx.fillStyle = '#F59E0B';
    ctx.fillText('RIN', rightLogoX, logoY + 16);
    ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('MEDIA', rightLogoX + 54, logoY + 16);
    ctx.restore();

    // 2. Artwork Card Dimensions & Positioning
    let cardX = 140;
    let cardY = 170;
    let cardW = 740;
    let cardH = 740;

    let textStartX = 960;
    let textStartY = 240;

    if (isPortrait) {
      // 9:16 layout
      cardW = 860;
      cardH = 860;
      cardX = (width - cardW) / 2;
      cardY = 200;
      textStartX = 110;
      textStartY = 1150;
    } else if (proj.aspectRatio === '1:1') {
      // 1:1 layout
      cardW = 460;
      cardH = 460;
      cardX = 60;
      cardY = (height - cardH) / 2;
      textStartX = 560;
      textStartY = 260;
    }

    // Draw Album Artwork Card
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 45;
    ctx.shadowOffsetY = 15;

    // Card background & clipping
    const cardRadius = 32;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.save();
    ctx.clip();

    if (img && img.complete && img.naturalWidth > 0) {
      // Draw image inside card with subtle scale / pan
      const scale = 1.04 + bassFactor * 0.04;
      const iW = cardW * scale;
      const iH = cardH * scale;
      const iX = cardX - (iW - cardW) / 2;
      const iY = cardY - (iH - cardH) / 2;
      ctx.drawImage(img, iX, iY, iW, iH);
    } else {
      const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
      cardGrad.addColorStop(0, '#1e293b');
      cardGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = cardGrad;
      ctx.fillRect(cardX, cardY, cardW, cardH);
    }
    ctx.restore();

    // Card outer border
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.stroke();

    // Viewfinder Camera Corner L-Brackets
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    const bracketLen = 30;
    const bracketPad = 24;

    // Top-Left L-bracket
    ctx.beginPath();
    ctx.moveTo(cardX + bracketPad + bracketLen, cardY + bracketPad);
    ctx.lineTo(cardX + bracketPad, cardY + bracketPad);
    ctx.lineTo(cardX + bracketPad, cardY + bracketPad + bracketLen);
    ctx.stroke();

    // Top-Right Inverted L-bracket
    ctx.beginPath();
    ctx.moveTo(cardX + cardW - bracketPad - bracketLen, cardY + bracketPad);
    ctx.lineTo(cardX + cardW - bracketPad, cardY + bracketPad);
    ctx.lineTo(cardX + cardW - bracketPad, cardY + bracketPad + bracketLen);
    ctx.stroke();
    ctx.restore();

    // Bottom-Left Mini Battery / Equalizer Playing Pill
    ctx.save();
    const pillX = cardX + 30;
    const pillY = cardY + cardH - 52;
    const pillW = 56;
    const pillH = 22;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 11);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Equalizer bars inside pill
    for (let b = 0; b < 3; b++) {
      const barH = 5 + (bassFactor * 8 + Math.abs(Math.sin(time * 6 + b)) * 6);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(pillX + 10 + b * 12, pillY + (pillH - barH) / 2, 4, barH);
    }
    ctx.restore();

    // Bottom-Right Card Artist / Music Watermark
    ctx.save();
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    const watermarkText = proj.channelLogoText || 'RIN MUSIC';
    ctx.fillText(watermarkText, cardX + cardW - 30, cardY + cardH - 36);
    ctx.restore();

    ctx.restore(); // Restore card outer shadow

    // 3. Right Side: Song Title & 4-Line Stanza Lyric Box
    ctx.save();

    // Frosted dark background bar behind title
    ctx.beginPath();
    ctx.roundRect(textStartX - 20, textStartY - 50, isLandscape ? 820 : width - 200, 130, 16);
    ctx.fillStyle = 'rgba(2, 20, 30, 0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Song Title (Large Geometric Bold Caps)
    ctx.font = `900 ${isLandscape ? 46 : 38}px "${proj.typography.fontFamily}", "Orbitron", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.shadowBlur = 16;
    ctx.shadowColor = proj.typography.highlightColor || 'rgba(6, 182, 212, 0.7)';

    const songTitle = (proj.title || 'QUÁ KHỨ ANH KHÔNG THỂ QUÊN').toUpperCase();
    ctx.fillText(songTitle, textStartX, textStartY + 10);

    // Artist Name
    ctx.shadowBlur = 0;
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#E2E8F0';
    const artistName = (proj.artist || 'DƯƠNG MINH TUẤN').toUpperCase();
    ctx.fillText(artistName, textStartX, textStartY + 50);

    // "♫ LYRICS:" Heading
    const lyricsHeaderY = textStartY + 105;
    ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('♫ LYRICS:', textStartX, lyricsHeaderY);

    // 4-Line Stanza Lyrics Calculation
    const lines = proj.lyrics;
    const instState = getInstrumentalState(lines, time);

    if (instState.isInstrumental) {
      // ----------------------------------------------------
      // NON-SINGING SECTION: Sleek Instrumental Visualizer
      // ----------------------------------------------------
      const instHeaderY = textStartY + 105;
      ctx.save();
      ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = proj.typography.highlightColor || '#38BDF8';
      ctx.shadowBlur = 14;
      ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
      ctx.fillText(instState.label, textStartX, instHeaderY);

      // Subtitle
      ctx.shadowBlur = 0;
      ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      const subText =
        instState.type === 'intro'
          ? 'Đang phát giai điệu mở đầu bài hát...'
          : instState.type === 'outro'
          ? 'Giai điệu đang dần khép lại...'
          : 'Giai điệu độc tấu nhạc cụ giữa bài...';
      ctx.fillText(subText, textStartX, instHeaderY + 36);

      // Dynamic animated rhythm sound wave bars dancing to bass
      const waveStartX = textStartX;
      const waveCenterY = instHeaderY + 105;
      const barCount = 18;
      for (let b = 0; b < barCount; b++) {
        const wavePhase = Math.sin(time * 5 + b * 0.35);
        const dynamicH = Math.max(8, 14 + wavePhase * 22 * (0.35 + 0.65 * bassFactor) + bassFactor * 30);
        const barX = waveStartX + b * 20;

        const bGrad = ctx.createLinearGradient(0, waveCenterY - dynamicH, 0, waveCenterY + dynamicH);
        bGrad.addColorStop(0, proj.typography.highlightColor || '#38BDF8');
        bGrad.addColorStop(0.5, '#FFFFFF');
        bGrad.addColorStop(1, 'rgba(56, 189, 248, 0.15)');

        ctx.save();
        ctx.fillStyle = bGrad;
        ctx.shadowBlur = 12;
        ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
        ctx.beginPath();
        ctx.roundRect(barX, waveCenterY - dynamicH / 2, 7, dynamicH, 3.5);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    } else if (lines && lines.length > 0) {
      // Find current active line index
      let activeIdx = lines.findIndex((l) => time >= l.startTime && time <= l.endTime);
      if (activeIdx === -1) {
        // If between lines, find upcoming line
        activeIdx = lines.findIndex((l) => time < l.startTime);
        if (activeIdx === -1) activeIdx = lines.length - 1;
      }

      // Group into stanzas of 4 lines
      const stanzaIdx = Math.max(0, Math.floor(activeIdx / 4));
      const stanzaLines = lines.slice(stanzaIdx * 4, stanzaIdx * 4 + 4);

      // Render the 4 lines of this stanza
      stanzaLines.forEach((line, i) => {
        const lineY = lyricsHeaderY + 46 + i * 50;
        const isCurrentLine = time >= line.startTime && time <= line.endTime;

        ctx.save();
        if (isCurrentLine) {
          // ACTIVE SINGING LINE: Left glowing accent bar (Apple Music / Spotify style)
          ctx.save();
          ctx.fillStyle = proj.typography.highlightColor || '#38BDF8';
          ctx.shadowBlur = 14;
          ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
          ctx.beginPath();
          ctx.roundRect(textStartX - 16, lineY - 24, 4, 30, 2);
          ctx.fill();
          ctx.restore();

          // Font setup for active line
          const baseFontFamily = proj.typography.fontFamily || 'Plus Jakarta Sans';
          ctx.font = `800 29px "${baseFontFamily}", "Plus Jakarta Sans", sans-serif`;

          // Word-by-word karaoke kinetic animation
          const words = line.words && line.words.length > 0
            ? line.words
            : line.text.split(' ').map((w, idx, arr) => ({
                text: w,
                startTime: line.startTime + (idx / arr.length) * (line.endTime - line.startTime),
                endTime: line.startTime + ((idx + 1) / arr.length) * (line.endTime - line.startTime),
              }));

          let curWordX = textStartX;
          const spaceW = ctx.measureText(' ').width;
          const effect = proj.typography.kineticEffect || 'karaoke_glow';

          words.forEach((w) => {
            const isSung = time > w.endTime;
            const isSinging = time >= w.startTime && time <= w.endTime;
            const wText = proj.typography.textCase === 'uppercase' ? w.text.toUpperCase() : w.text;
            const wWidth = ctx.measureText(wText).width;

            const wDuration = Math.max(0.08, w.endTime - w.startTime);
            const rawProgress = isSinging ? Math.max(0, Math.min(1, (time - w.startTime) / wDuration)) : isSung ? 1 : 0;
            const progress = rawProgress * rawProgress * (3 - 2 * rawProgress); // Smoothstep curve

            ctx.save();

            let offsetY = 0;
            let scale = 1.0;
            const timeSinceEnd = time - w.endTime;

            if (isSinging) {
              const peak = Math.sin(progress * Math.PI);
              if (effect === 'emotional_soul') {
                // Sâu lắng & Nhịp thở: Gentle breathing pulse with deep warm soul aura
                offsetY = -peak * 6;
                scale = 1.0 + peak * 0.12;
              } else if (effect === 'stardust_sparkle') {
                // Ánh sao & Bụi cảm xúc: Subtle float with twinkling stardust
                offsetY = -peak * 5;
                scale = 1.0 + peak * 0.09;
              } else if (effect === 'tears_ripple') {
                // Gợn sóng tâm trạng: Liquid wave on syllables
                offsetY = Math.sin(time * 4 + curWordX * 0.05) * 5;
                scale = 1.0 + peak * 0.08;
              } else if (effect === 'dreamy_glow') {
                // Mộng mơ bay bổng: Floating aurora scale
                offsetY = -peak * 4;
                scale = 1.0 + peak * 0.1;
              } else if (effect === 'beat_bounce') {
                // Elastic jump & spring bounce
                offsetY = -peak * 9;
                scale = 1.0 + peak * 0.12 + bassFactor * 0.06;
              } else if (effect === 'wave_float') {
                // Dreamy liquid floating wave
                offsetY = Math.sin(time * 4 + curWordX * 0.04) * 6;
              } else if (effect === 'neon_pulse') {
                // Throbbing neon scale
                scale = 1.04 + 0.05 * Math.sin(time * 8);
              } else {
                // Default karaoke_glow: subtle pop
                offsetY = -peak * 4;
                scale = 1.0 + peak * 0.08;
              }
            } else if (isSung) {
              // Gentle soft-landing decay so words don't snap abruptly
              if (timeSinceEnd < 0.25) {
                const linger = 1 - timeSinceEnd / 0.25;
                scale = 1.0 + linger * 0.04;
                offsetY = -linger * 2;
              }
            }

            // Apply transform if scaled or offset
            if (scale !== 1.0 || offsetY !== 0) {
              ctx.translate(curWordX + wWidth / 2, lineY + offsetY);
              ctx.scale(scale, scale);
              ctx.translate(-(curWordX + wWidth / 2), -(lineY + offsetY));
            }

            if (isSinging) {
              // ACTIVE WORD EMOTIONAL RENDERING

              // 1. Stardust & Sparkle effect (when selected or emotionalSparkles enabled)
              if (effect === 'stardust_sparkle' || proj.typography.emotionalSparkles) {
                const sparkX = curWordX + wWidth * Math.min(1, Math.max(0.1, progress));
                const sparkY = lineY - 26 + offsetY;
                const sparkAlpha = Math.abs(Math.sin(time * 7 + curWordX * 0.1));
                drawSparkle(ctx, sparkX, sparkY, 8 + Math.sin(time * 6) * 2, sparkAlpha, proj.typography.highlightColor || '#FDE047');

                // Floating micro-particles rising softly
                for (let p = 0; p < 2; p++) {
                  const pCycle = (time * 1.5 + p * 0.5) % 1;
                  const px = curWordX + wWidth * (0.25 + p * 0.5) + Math.sin(time * 4 + p) * 3;
                  const py = lineY - 14 - pCycle * 24 + offsetY;
                  const pAlpha = (1 - pCycle) * 0.75;
                  ctx.save();
                  ctx.globalAlpha = pAlpha;
                  ctx.fillStyle = '#FFFFFF';
                  ctx.shadowBlur = 8;
                  ctx.shadowColor = proj.typography.highlightColor || '#FDE047';
                  ctx.beginPath();
                  ctx.arc(px, py, 1.8, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.restore();
                }
              }

              // 2. Emotional Soul Backdrop Glow
              if (effect === 'emotional_soul') {
                ctx.save();
                ctx.fillStyle = proj.typography.highlightColor || '#38BDF8';
                ctx.shadowBlur = 32;
                ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
                ctx.globalAlpha = 0.35 * Math.sin(progress * Math.PI);
                ctx.beginPath();
                ctx.roundRect(curWordX - 8, lineY - 30 + offsetY, wWidth + 16, 40, 10);
                ctx.fill();
                ctx.restore();
              }

              // 3. Tears Ripple Ring
              if (effect === 'tears_ripple') {
                const ripR = progress * 22;
                const ripAlpha = (1 - progress) * 0.55;
                ctx.save();
                ctx.globalAlpha = ripAlpha;
                ctx.strokeStyle = proj.typography.highlightColor || '#38BDF8';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(curWordX + wWidth / 2, lineY - 10 + offsetY, ripR, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
              }

              if (effect === 'neon_pulse') {
                // Intense Cyber Neon Bloom
                ctx.shadowBlur = 32;
                ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(wText, curWordX, lineY + offsetY);

                ctx.strokeStyle = proj.typography.highlightColor || '#38BDF8';
                ctx.lineWidth = 2;
                ctx.strokeText(wText, curWordX, lineY + offsetY);
              } else if (effect === 'dreamy_glow') {
                // Dreamy Aurora Gradient Sweep
                ctx.fillStyle = proj.typography.secondaryColor || 'rgba(255, 255, 255, 0.45)';
                ctx.shadowBlur = 0;
                ctx.fillText(wText, curWordX, lineY + offsetY);

                ctx.save();
                ctx.beginPath();
                ctx.rect(curWordX - 2, lineY - 32 + offsetY, wWidth * progress + 4, 44);
                ctx.clip();

                const auroraGrad = ctx.createLinearGradient(curWordX, lineY - 20, curWordX + wWidth, lineY);
                auroraGrad.addColorStop(0, proj.typography.highlightColor || '#C084FC');
                auroraGrad.addColorStop(0.5, '#FFFFFF');
                auroraGrad.addColorStop(1, proj.typography.secondaryColor || '#F472B6');

                ctx.shadowBlur = 28;
                ctx.shadowColor = proj.typography.highlightColor || '#C084FC';
                ctx.fillStyle = auroraGrad;
                ctx.fillText(wText, curWordX, lineY + offsetY);
                ctx.restore();
              } else if (effect === 'emotional_soul') {
                // Progressive Soul Velvet Wipe
                ctx.fillStyle = proj.typography.secondaryColor || 'rgba(255, 255, 255, 0.45)';
                ctx.shadowBlur = 0;
                ctx.fillText(wText, curWordX, lineY + offsetY);

                ctx.save();
                ctx.beginPath();
                ctx.rect(curWordX - 2, lineY - 32 + offsetY, wWidth * progress + 4, 44);
                ctx.clip();

                const soulGrad = ctx.createLinearGradient(curWordX, lineY - 24, curWordX + wWidth, lineY + 6);
                soulGrad.addColorStop(0, '#FFFFFF');
                soulGrad.addColorStop(0.5, proj.typography.highlightColor || '#38BDF8');
                soulGrad.addColorStop(1, '#FEF08A');

                ctx.shadowBlur = 26;
                ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
                ctx.fillStyle = soulGrad;
                ctx.fillText(wText, curWordX, lineY + offsetY);
                ctx.restore();
              } else {
                // Progressive Left-to-Right Karaoke Sweep Fill (Spotify / Standard)
                ctx.fillStyle = proj.typography.secondaryColor || 'rgba(255, 255, 255, 0.45)';
                ctx.shadowBlur = 0;
                ctx.fillText(wText, curWordX, lineY + offsetY);

                ctx.save();
                ctx.beginPath();
                ctx.rect(curWordX - 2, lineY - 32 + offsetY, wWidth * progress + 4, 44);
                ctx.clip();

                ctx.shadowBlur = 22;
                ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
                ctx.fillStyle = proj.typography.highlightColor || '#38BDF8';
                ctx.fillText(wText, curWordX, lineY + offsetY);

                // Inner core highlight
                ctx.fillStyle = '#FFFFFF';
                ctx.globalAlpha = 0.85;
                ctx.fillText(wText, curWordX, lineY + offsetY);
                ctx.restore();
              }
            } else if (isSung) {
              // Word already completed: warm legible glow
              ctx.fillStyle = '#FFFFFF';
              ctx.shadowBlur = 8;
              ctx.shadowColor = proj.typography.highlightColor || '#38BDF8';
              ctx.fillText(wText, curWordX, lineY + offsetY);
            } else {
              // Upcoming word: elegant translucent
              ctx.fillStyle = proj.typography.secondaryColor || 'rgba(255, 255, 255, 0.5)';
              ctx.shadowBlur = 0;
              ctx.fillText(wText, curWordX, lineY);
            }

            ctx.restore();
            curWordX += wWidth + spaceW;
          });
        } else {
          // NON-ACTIVE LINES: Elegant clean typography with subtle shadow
          const isPast = time > line.endTime;
          ctx.font = '600 25px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = isPast
            ? 'rgba(255, 255, 255, 0.45)'
            : (proj.typography.textColor || 'rgba(255, 255, 255, 0.7)');
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          const lineText = proj.typography.textCase === 'uppercase' ? line.text.toUpperCase() : line.text;
          ctx.fillText(lineText, textStartX, lineY);
        }
        ctx.restore();
      });
    }

    ctx.restore();
    ctx.restore();
  };

  // Track header badge (title & artist)
  const renderTrackHeader = (
    ctx: CanvasRenderingContext2D,
    proj: ProjectData,
    width: number,
    height: number
  ) => {
    ctx.save();
    const topY = height * 0.08;

    // Small glowing music badge
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('LYRIC STUDIO AI', width / 2, topY - 24);

    // Song Title
    ctx.font = `700 36px "${proj.typography.fontFamily}", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.fillText(proj.title || 'Untitled Song', width / 2, topY + 14);

    // Artist
    if (proj.artist) {
      ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = proj.typography.highlightColor || '#FDA4AF';
      ctx.shadowBlur = 6;
      ctx.shadowColor = proj.typography.highlightColor;
      ctx.fillText(proj.artist, width / 2, topY + 46);
    }
    ctx.restore();
  };

  // Kinetic Lyric Rendering Engine
  const renderLyrics = (
    ctx: CanvasRenderingContext2D,
    proj: ProjectData,
    time: number,
    bassFactor: number,
    width: number,
    height: number
  ) => {
    const lines = proj.lyrics;
    if (!lines || lines.length === 0) return;

    const typo = proj.typography;
    const baseFontSize = typo.fontSize * (width / 1080); // Responsive scaling
    const centerY =
      proj.aspectRatio === '16:9' ? height * 0.62 : height * 0.58;

    // 1. Instrumental Check: Zero lyric display during intro, outro, or breaks
    const instState = getInstrumentalState(lines, time);
    if (instState.isInstrumental) {
      if (instState.type === 'intro' || instState.type === 'break') {
        ctx.save();
        ctx.font = `700 ${baseFontSize * 0.55}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = typo.highlightColor || '#38BDF8';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 14;
        ctx.shadowColor = typo.highlightColor || '#38BDF8';
        ctx.fillText(instState.label, width / 2, centerY);
        ctx.restore();
      }
      return;
    }

    // 2. Find active singing line with 0.45s lead-in and exit window
    const displayLineIndex = lines.findIndex(
      (l) => time >= l.startTime - 0.45 && time <= l.endTime + 0.45
    );
    if (displayLineIndex === -1) return;

    const activeLine = lines[displayLineIndex];
    if (!activeLine) return;

    // Smooth cubic line entrance & exit fading
    const inProgress = Math.max(0, Math.min(1, (time - (activeLine.startTime - 0.45)) / 0.45));
    const easeIn = 1 - Math.pow(1 - inProgress, 3);
    const outProgress = Math.max(0, Math.min(1, (time - (activeLine.endTime + 0.05)) / 0.4));
    const easeOut = outProgress * outProgress;

    const lineAlpha = Math.max(0, Math.min(1, easeIn * (1 - easeOut)));
    const lineSlideY = (1 - easeIn) * 16 - easeOut * 8;

    const lineDuration = activeLine.endTime - activeLine.startTime;
    const lineProgress = Math.max(
      0,
      Math.min(1, (time - activeLine.startTime) / Math.max(0.1, lineDuration))
    );
    const isActive = time >= activeLine.startTime && time <= activeLine.endTime;

    ctx.save();
    ctx.globalAlpha = lineAlpha;
    ctx.translate(0, lineSlideY);
    ctx.textAlign = typo.textAlign || 'center';

    // Apply Kinetic Typography style
    switch (typo.kineticEffect) {
      case 'vertical_stack': {
        // Vertical 3-line rolling kinetic stack (TikTok / Reels style)
        const prevLine = lines[displayLineIndex - 1];
        const nextLine = lines[displayLineIndex + 1];

        // Previous Line
        if (prevLine) {
          ctx.save();
          ctx.font = `500 ${baseFontSize * 0.65}px "${typo.fontFamily}", sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          const text = typo.textCase === 'uppercase' ? prevLine.text.toUpperCase() : prevLine.text;
          ctx.fillText(text, width / 2, centerY - baseFontSize * 1.6);
          ctx.restore();
        }

        // Active Line (Large & Highlighted)
        ctx.save();
        const activeScale = isActive ? 1.05 + bassFactor * 0.05 : 0.95;
        ctx.translate(width / 2, centerY);
        ctx.scale(activeScale, activeScale);
        ctx.font = `800 ${baseFontSize * 1.15}px "${typo.fontFamily}", sans-serif`;

        if (typo.textShadow) {
          ctx.shadowBlur = 18;
          ctx.shadowColor = typo.highlightColor;
        }

        const activeText =
          typo.textCase === 'uppercase'
            ? activeLine.text.toUpperCase()
            : activeLine.text;

        ctx.fillStyle = typo.highlightColor;
        ctx.fillText(activeText, 0, 0);

        if (typo.textStroke) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = typo.strokeColor || '#000000';
          ctx.strokeText(activeText, 0, 0);
        }
        ctx.restore();

        // Next Line
        if (nextLine) {
          ctx.save();
          ctx.font = `500 ${baseFontSize * 0.65}px "${typo.fontFamily}", sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          const text = typo.textCase === 'uppercase' ? nextLine.text.toUpperCase() : nextLine.text;
          ctx.fillText(text, width / 2, centerY + baseFontSize * 1.6);
          ctx.restore();
        }
        break;
      }

      case 'emotional_soul':
      case 'stardust_sparkle':
      case 'tears_ripple':
      case 'dreamy_glow':
      case 'karaoke_glow': {
        // Emotional & Spotify style word-by-word progressive fill & glow
        renderKaraokeWords(
          ctx,
          activeLine,
          time,
          typo,
          baseFontSize,
          width / 2,
          centerY,
          bassFactor
        );
        break;
      }

      case 'beat_bounce': {
        // Words pop and bounce according to song beat
        renderBouncingWords(
          ctx,
          activeLine,
          time,
          typo,
          baseFontSize,
          width / 2,
          centerY,
          bassFactor
        );
        break;
      }

      case 'neon_pulse': {
        // Cyberpunk glowing neon borders & pulsing glow
        const glowText =
          typo.textCase === 'uppercase'
            ? activeLine.text.toUpperCase()
            : activeLine.text;

        const pulse = Math.sin(time * 6) * 10 + 20;
        ctx.save();
        ctx.font = `800 ${baseFontSize * 1.1}px "${typo.fontFamily}", sans-serif`;
        ctx.shadowBlur = pulse;
        ctx.shadowColor = typo.highlightColor;
        ctx.fillStyle = typo.textColor || '#FFFFFF';

        const bounceY = centerY - (bassFactor * 12);
        ctx.fillText(glowText, width / 2, bounceY);

        ctx.lineWidth = 3;
        ctx.strokeStyle = typo.highlightColor;
        ctx.strokeText(glowText, width / 2, bounceY);
        ctx.restore();
        break;
      }

      case 'wave_float': {
        // Words float on smooth sinusoidal wave
        renderWavyWords(
          ctx,
          activeLine,
          time,
          typo,
          baseFontSize,
          width / 2,
          centerY
        );
        break;
      }

      case 'typewriter': {
        // Progressive character typewriter reveal
        const fullText =
          typo.textCase === 'uppercase'
            ? activeLine.text.toUpperCase()
            : activeLine.text;

        const charCount = Math.floor(lineProgress * fullText.length);
        const visibleText = fullText.slice(0, charCount);
        const cursor = Math.floor(time * 3) % 2 === 0 ? '|' : '';

        ctx.save();
        ctx.font = `700 ${baseFontSize}px "${typo.fontFamily}", sans-serif`;
        ctx.fillStyle = typo.textColor || '#FFFFFF';
        if (typo.textShadow) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = typo.highlightColor;
        }
        ctx.fillText(visibleText + cursor, width / 2, centerY);
        ctx.restore();
        break;
      }

      case 'cinematic_fade':
      default: {
        // Elegant Remotion-style smooth fade & vertical slide-in
        const enterProgress = Math.min(1, (time - activeLine.startTime) / 0.4);
        const exitProgress = Math.max(0, (time - (activeLine.endTime - 0.3)) / 0.3);

        const alpha = Math.max(0, enterProgress - exitProgress);
        const slideY = centerY + (1 - enterProgress) * 35;

        ctx.save();
        ctx.globalAlpha = isActive ? alpha : 0.2;
        ctx.font = `700 ${baseFontSize}px "${typo.fontFamily}", sans-serif`;
        ctx.fillStyle = typo.highlightColor || '#FFFFFF';

        if (typo.textShadow) {
          ctx.shadowBlur = 14;
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
        }

        const displayText =
          typo.textCase === 'uppercase'
            ? activeLine.text.toUpperCase()
            : activeLine.text;

        ctx.fillText(displayText, width / 2, slideY);
        ctx.restore();
        break;
      }
    }

    ctx.restore();
  };

  // Helper: Word-by-word karaoke glow renderer
  const renderKaraokeWords = (
    ctx: CanvasRenderingContext2D,
    line: LyricLine,
    time: number,
    typo: any,
    fontSize: number,
    centerX: number,
    centerY: number,
    bassFactor: number
  ) => {
    const words = line.words && line.words.length > 0
      ? line.words
      : line.text.split(' ').map((w, i, a) => ({
          text: w,
          startTime: line.startTime + (i / a.length) * (line.endTime - line.startTime),
          endTime: line.startTime + ((i + 1) / a.length) * (line.endTime - line.startTime),
        }));

    ctx.save();
    ctx.font = `800 ${fontSize}px "${typo.fontFamily}", sans-serif`;

    // Calculate total line width to center
    const spaceWidth = ctx.measureText(' ').width;
    const wordMeasures = words.map((w) => {
      const txt = typo.textCase === 'uppercase' ? w.text.toUpperCase() : w.text;
      return { text: txt, width: ctx.measureText(txt).width };
    });

    const totalLineWidth =
      wordMeasures.reduce((acc, curr) => acc + curr.width, 0) +
      spaceWidth * (words.length - 1);

    // If line is very wide for canvas, wrap into two lines or scale down
    let currentX = centerX - totalLineWidth / 2;

    words.forEach((word, idx) => {
      const isPast = time > word.endTime;
      const isCurrent = time >= word.startTime && time <= word.endTime;
      const wordInfo = wordMeasures[idx];

      ctx.save();
      const timeSinceEnd = time - word.endTime;

      if (isCurrent) {
        // Current singing word: smooth S-curve bounce + bright highlight glow
        const wordDur = Math.max(0.08, word.endTime - word.startTime);
        const rawProg = Math.max(0, Math.min(1, (time - word.startTime) / wordDur));
        const smoothProg = rawProg * rawProg * (3 - 2 * rawProg);
        const peak = Math.sin(smoothProg * Math.PI);
        const scale = 1.0 + peak * 0.14 + bassFactor * 0.06;

        // Emotional Sparkles on active word
        if (typo.kineticEffect === 'stardust_sparkle' || typo.emotionalSparkles) {
          const sparkX = currentX + wordInfo.width * Math.min(1, Math.max(0.1, smoothProg));
          const sparkY = centerY - fontSize * 0.7 - peak * 4;
          const sparkAlpha = Math.abs(Math.sin(time * 6 + idx));
          drawSparkle(ctx, sparkX, sparkY, 8, sparkAlpha, typo.highlightColor || '#FDE047');
        }

        ctx.translate(currentX + wordInfo.width / 2, centerY - peak * 4);
        ctx.scale(scale, scale);

        // Backdrop Soul Aura
        if (typo.kineticEffect === 'emotional_soul') {
          ctx.save();
          ctx.fillStyle = typo.highlightColor || '#38BDF8';
          ctx.shadowBlur = 28;
          ctx.shadowColor = typo.highlightColor || '#38BDF8';
          ctx.globalAlpha = 0.3 * peak;
          ctx.beginPath();
          ctx.roundRect(-wordInfo.width / 2 - 8, -fontSize * 0.65, wordInfo.width + 16, fontSize * 1.1, 10);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = typo.highlightColor || '#F43F5E';
        ctx.shadowBlur = 24;
        ctx.shadowColor = typo.highlightColor;
        ctx.fillText(wordInfo.text, -wordInfo.width / 2, 0);

        if (typo.textStroke) {
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = typo.strokeColor || '#000000';
          ctx.strokeText(wordInfo.text, -wordInfo.width / 2, 0);
        }
      } else if (isPast) {
        // Words already sung: soft-landing decay so it doesn't snap
        let scale = 1.0;
        let liftY = 0;
        if (timeSinceEnd < 0.25) {
          const linger = 1 - timeSinceEnd / 0.25;
          scale = 1.0 + linger * 0.04;
          liftY = -linger * 2;
        }

        ctx.translate(currentX + wordInfo.width / 2, centerY + liftY);
        ctx.scale(scale, scale);
        ctx.fillStyle = typo.secondaryColor || '#FDA4AF';
        ctx.shadowBlur = 6;
        ctx.shadowColor = typo.highlightColor || '#F43F5E';
        ctx.fillText(wordInfo.text, -wordInfo.width / 2, 0);
      } else {
        // Upcoming words: dimmed translucent
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.shadowBlur = 0;
        ctx.fillText(wordInfo.text, currentX, centerY);
      }
      ctx.restore();

      currentX += wordInfo.width + spaceWidth;
    });

    ctx.restore();
  };

  // Helper: Bouncing words renderer
  const renderBouncingWords = (
    ctx: CanvasRenderingContext2D,
    line: LyricLine,
    time: number,
    typo: any,
    fontSize: number,
    centerX: number,
    centerY: number,
    bassFactor: number
  ) => {
    const words = line.words && line.words.length > 0
      ? line.words
      : line.text.split(' ').map((w, i, a) => ({
          text: w,
          startTime: line.startTime + (i / a.length) * (line.endTime - line.startTime),
          endTime: line.startTime + ((i + 1) / a.length) * (line.endTime - line.startTime),
        }));

    ctx.save();
    ctx.font = `800 ${fontSize}px "${typo.fontFamily}", sans-serif`;
    const spaceWidth = ctx.measureText(' ').width;
    const wordMeasures = words.map((w) => {
      const txt = typo.textCase === 'uppercase' ? w.text.toUpperCase() : w.text;
      return { text: txt, width: ctx.measureText(txt).width };
    });

    const totalLineWidth =
      wordMeasures.reduce((acc, curr) => acc + curr.width, 0) +
      spaceWidth * (words.length - 1);

    let currentX = centerX - totalLineWidth / 2;

    words.forEach((word, idx) => {
      const wordInfo = wordMeasures[idx];
      const isCurrent = time >= word.startTime && time <= word.endTime;
      const isPast = time > word.endTime;

      let bounceY = 0;
      const timeSinceEnd = time - word.endTime;

      if (isCurrent) {
        const prog = (time - word.startTime) / Math.max(0.08, word.endTime - word.startTime);
        const smoothProg = prog * prog * (3 - 2 * prog);
        bounceY = -Math.sin(smoothProg * Math.PI) * (18 + bassFactor * 10);
      } else if (isPast) {
        if (timeSinceEnd < 0.22) {
          const linger = 1 - timeSinceEnd / 0.22;
          bounceY = -linger * 3;
        }
      }

      ctx.save();
      ctx.fillStyle = isCurrent
        ? typo.highlightColor
        : isPast
        ? typo.textColor
        : 'rgba(255, 255, 255, 0.4)';

      if (isCurrent && typo.textShadow) {
        ctx.shadowBlur = 18;
        ctx.shadowColor = typo.highlightColor;
      }

      ctx.fillText(wordInfo.text, currentX, centerY + bounceY);
      ctx.restore();

      currentX += wordInfo.width + spaceWidth;
    });

    ctx.restore();
  };

  // Helper: Wavy words renderer
  const renderWavyWords = (
    ctx: CanvasRenderingContext2D,
    line: LyricLine,
    time: number,
    typo: any,
    fontSize: number,
    centerX: number,
    centerY: number
  ) => {
    const text =
      typo.textCase === 'uppercase' ? line.text.toUpperCase() : line.text;

    ctx.save();
    ctx.font = `700 ${fontSize}px "${typo.fontFamily}", sans-serif`;
    const letters = text.split('');
    const totalW = letters.reduce((acc, char) => acc + ctx.measureText(char).width, 0);

    let curX = centerX - totalW / 2;
    letters.forEach((char, idx) => {
      const charW = ctx.measureText(char).width;
      const waveY = Math.sin(time * 5 + idx * 0.35) * 14;

      ctx.fillStyle = typo.highlightColor || '#F43F5E';
      ctx.shadowBlur = 10;
      ctx.shadowColor = typo.highlightColor;
      ctx.fillText(char, curX, centerY + waveY);
      curX += charW;
    });
    ctx.restore();
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl bg-zinc-950/80 shadow-2xl border border-zinc-800/80">
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full object-contain rounded-xl shadow-2xl transition-all"
        style={{
          aspectRatio:
            project.aspectRatio === '9:16'
              ? '9/16'
              : project.aspectRatio === '16:9'
              ? '16/9'
              : project.aspectRatio === '4:5'
              ? '4/5'
              : '1/1',
        }}
      />
    </div>
  );
};
