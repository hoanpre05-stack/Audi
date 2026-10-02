/**
 * Background video export engine using HTML5 Canvas + Web Audio API + MediaRecorder + FFmpeg.
 * Merges the animated kinetic typography canvas stream with the audio stream silently
 * and converts to a native MP4 (H.264 / AAC) file for universal compatibility.
 */

export interface ExportProgress {
  progress: number; // 0 to 100
  currentTime: number;
  duration: number;
  isComplete: boolean;
  statusText?: string;
  blobUrl?: string;
  format?: 'mp4' | 'webm';
  error?: string;
}

export class LyricVideoExporter {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isCancelled = false;
  private updateInterval: any = null;
  private originalAudioLoop = false;
  private targetAudioElement: HTMLAudioElement | null = null;

  async exportVideo(
    canvas: HTMLCanvasElement,
    audioElement: HTMLAudioElement,
    duration: number,
    existingAudioStream: MediaStream | null,
    onProgress: (status: ExportProgress) => void
  ): Promise<string> {
    this.recordedChunks = [];
    this.isCancelled = false;
    this.targetAudioElement = audioElement;

    return new Promise(async (resolve, reject) => {
      try {
        // Determine total duration accurately
        let totalDuration = duration || 30;
        if (audioElement.duration && !isNaN(audioElement.duration) && audioElement.duration > 0) {
          totalDuration = audioElement.duration;
        }
        totalDuration = Math.max(1, Number(totalDuration.toFixed(2)));

        // 1. Capture 30 FPS video stream from Canvas
        const canvasStream = canvas.captureStream
          ? canvas.captureStream(30)
          : (canvas as any).mozCaptureStream
          ? (canvas as any).mozCaptureStream(30)
          : null;

        if (!canvasStream) {
          throw new Error('Trình duyệt của bạn không hỗ trợ quay canvas (captureStream).');
        }

        const videoTracks = canvasStream.getVideoTracks();
        if (videoTracks.length === 0) {
          throw new Error('Không tìm thấy luồng hình ảnh từ canvas để xuất video.');
        }

        // 2. Obtain clean audio tracks
        const audioTracks: MediaStreamTrack[] = [];

        // Priority A: Audio tracks from existing AudioContext stream destination
        if (existingAudioStream) {
          const tracks = existingAudioStream.getAudioTracks();
          if (tracks.length > 0) {
            audioTracks.push(...tracks);
          }
        }

        // Priority B: CaptureStream directly on audio element if available
        if (audioTracks.length === 0 && (audioElement as any).captureStream) {
          try {
            const elStream = (audioElement as any).captureStream();
            audioTracks.push(...elStream.getAudioTracks());
          } catch (e) {
            console.warn('captureStream on audio element failed:', e);
          }
        }

        // 3. Assemble combined MediaStream
        const combinedStream = new MediaStream([
          ...videoTracks,
          ...audioTracks,
        ]);

        // 4. Select compatible MIME type depending on whether audio tracks are present
        const hasAudio = audioTracks.length > 0;
        const candidateMimes = hasAudio
          ? [
              'video/webm;codecs=vp9,opus',
              'video/webm;codecs=vp8,opus',
              'video/webm',
              'video/mp4;codecs=avc1,mp4a.40.2',
              'video/mp4',
            ]
          : [
              'video/webm;codecs=vp9',
              'video/webm;codecs=vp8',
              'video/webm',
              'video/mp4',
            ];

        let selectedMime = '';
        for (const m of candidateMimes) {
          if (MediaRecorder.isTypeSupported(m)) {
            selectedMime = m;
            break;
          }
        }

        const recorderOptions: MediaRecorderOptions = {};
        if (selectedMime) {
          recorderOptions.mimeType = selectedMime;
          recorderOptions.videoBitsPerSecond = 5000000; // 5 Mbps
        }

        this.mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.recordedChunks.push(e.data);
          }
        };

        this.mediaRecorder.onstop = async () => {
          if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
          }

          // Restore audio element loop setting
          if (this.targetAudioElement) {
            this.targetAudioElement.loop = this.originalAudioLoop;
          }

          if (this.isCancelled) {
            reject(new Error('Người dùng đã hủy quá trình xuất video.'));
            return;
          }

          if (this.recordedChunks.length === 0) {
            const err = new Error('Quá trình xuất video không tạo ra dữ liệu. Vui lòng thử lại.');
            onProgress({
              progress: 0,
              currentTime: 0,
              duration: totalDuration,
              isComplete: false,
              error: err.message,
            });
            reject(err);
            return;
          }

          const finalMime = selectedMime || (hasAudio ? 'video/webm' : 'video/webm');
          const rawBlob = new Blob(this.recordedChunks, { type: finalMime });

          // Inform user that MP4 encoding is in progress
          onProgress({
            progress: 95,
            currentTime: totalDuration,
            duration: totalDuration,
            isComplete: false,
            statusText: 'Đang chuyển đổi & tối ưu hóa chuẩn MP4 (H.264 / AAC)...',
          });

          // Fast conversion to MP4 on server with FFmpeg
          let convertedMp4Url: string | null = null;
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              console.log(`[Export] Sending ${rawBlob.size} bytes to /api/convert-to-mp4 (attempt ${attempt})...`);
              const res = await fetch('/api/convert-to-mp4', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/octet-stream',
                },
                body: rawBlob,
              });

              if (res.ok) {
                const mp4Blob = await res.blob();
                console.log(`[Export] Successfully received MP4 blob: ${mp4Blob.size} bytes`);
                convertedMp4Url = URL.createObjectURL(mp4Blob);
                break;
              } else {
                const errText = await res.text();
                console.warn(`[Export] Server MP4 conversion failed with status ${res.status}:`, errText);
              }
            } catch (mp4Error) {
              console.warn(`[Export] Attempt ${attempt} conversion error:`, mp4Error);
              if (attempt < 2) await new Promise((r) => setTimeout(r, 800));
            }
          }

          if (convertedMp4Url) {
            onProgress({
              progress: 100,
              currentTime: totalDuration,
              duration: totalDuration,
              isComplete: true,
              blobUrl: convertedMp4Url,
              format: 'mp4',
              statusText: 'Video MP4 Full HD đã sẵn sàng!',
            });

            resolve(convertedMp4Url);
            return;
          }

          // Fallback if conversion fails
          const fallbackUrl = URL.createObjectURL(rawBlob);
          onProgress({
            progress: 100,
            currentTime: totalDuration,
            duration: totalDuration,
            isComplete: true,
            blobUrl: fallbackUrl,
            format: 'webm',
            statusText: 'Video đã xuất hoàn tất!',
          });

          resolve(fallbackUrl);
        };

        this.mediaRecorder.onerror = (e: any) => {
          console.error('MediaRecorder error:', e);
          if (this.targetAudioElement) {
            this.targetAudioElement.loop = this.originalAudioLoop;
          }
          const errMsg = e?.error?.message || 'Lỗi trong quá trình ghi hình video.';
          onProgress({
            progress: 0,
            currentTime: 0,
            duration: totalDuration,
            isComplete: false,
            error: errMsg,
          });
          reject(new Error(errMsg));
        };

        // CRITICAL: Disable loop on audio element so it does not wrap back to 0!
        this.originalAudioLoop = audioElement.loop;
        audioElement.loop = false;

        // Reset audio to start and begin recording
        audioElement.currentTime = 0;
        await audioElement.play().catch((playErr) => {
          console.warn('Audio play during export warning:', playErr);
        });

        const recordStartTime = performance.now();

        // Request data slice every 250ms
        this.mediaRecorder.start(250);

        this.updateInterval = setInterval(() => {
          if (this.isCancelled) {
            if (this.updateInterval) clearInterval(this.updateInterval);
            audioElement.pause();
            audioElement.loop = this.originalAudioLoop;
            return;
          }

          const elapsedSec = (performance.now() - recordStartTime) / 1000;
          const curTime = Math.min(totalDuration, Math.max(audioElement.currentTime, elapsedSec));
          const prog = Math.min(92, Math.round((curTime / totalDuration) * 92));

          onProgress({
            progress: prog,
            currentTime: curTime,
            duration: totalDuration,
            isComplete: false,
            statusText: `Đang kết xuất khung hình ngầm (${Math.round(curTime)}s / ${Math.round(totalDuration)}s)...`,
          });

          // Stop recording when reaching the end of the song
          if (curTime >= totalDuration - 0.1 || audioElement.ended || elapsedSec >= totalDuration + 0.3) {
            if (this.updateInterval) {
              clearInterval(this.updateInterval);
              this.updateInterval = null;
            }
            audioElement.pause();
            audioElement.loop = this.originalAudioLoop;
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
              this.mediaRecorder.stop();
            }
          }
        }, 100);
      } catch (err: any) {
        console.error('Export failed setup:', err);
        if (this.targetAudioElement) {
          this.targetAudioElement.loop = this.originalAudioLoop;
        }
        const errMsg = err?.message || 'Không thể quay video trực tiếp trên trình duyệt này.';
        onProgress({
          progress: 0,
          currentTime: 0,
          duration,
          isComplete: false,
          error: errMsg,
        });
        reject(err);
      }
    });
  }

  cancel() {
    this.isCancelled = true;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.targetAudioElement) {
      this.targetAudioElement.pause();
      this.targetAudioElement.loop = this.originalAudioLoop;
    }
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }
}
