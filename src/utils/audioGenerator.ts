/**
 * Generates procedural royalty-free audio tracks (WAV Blobs)
 * for instant testing and high-quality preset playback.
 */

// Helper to write WAV header
function writeWavHeader(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + samples.length * 2, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count (1 = mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * 2)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Write PCM audio data
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Generates an aesthetic Lo-fi / Dream Pop chill beat
 */
export function generateDemoAudioTrack(durationSeconds = 24): Promise<string> {
  return new Promise((resolve) => {
    const sampleRate = 44100;
    const totalSamples = sampleRate * durationSeconds;
    const buffer = new Float32Array(totalSamples);

    const bpm = 88;
    const beatInterval = 60 / bpm; // ~0.68s per beat
    const barInterval = beatInterval * 4;

    // Chord progressions (MIDI frequencies):
    // Cmaj7 -> Am7 -> Fmaj7 -> G7
    const chords = [
      [261.63, 329.63, 392.0, 493.88], // C, E, G, B
      [220.0, 261.63, 329.63, 392.0],  // A, C, E, G
      [174.61, 220.0, 261.63, 329.63], // F, A, C, E
      [196.0, 246.94, 293.66, 349.23], // G, B, D, F
    ];

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // 1. Drum beat: Kick on beat 1 & 3, Snare on beat 2 & 4
      const beatTime = t % beatInterval;
      const beatNum = Math.floor((t % barInterval) / beatInterval);

      // Kick (beats 0 and 2)
      if (beatNum === 0 || beatNum === 2) {
        if (beatTime < 0.25) {
          const env = Math.exp(-beatTime * 18);
          const freq = 120 * Math.exp(-beatTime * 25) + 45;
          sample += Math.sin(2 * Math.PI * freq * beatTime) * env * 0.45;
        }
      }

      // Snare (beats 1 and 3)
      if (beatNum === 1 || beatNum === 3) {
        if (beatTime < 0.2) {
          const env = Math.exp(-beatTime * 22);
          const noise = (Math.random() * 2 - 1) * env * 0.25;
          const body = Math.sin(2 * Math.PI * 180 * beatTime) * env * 0.2;
          sample += noise + body;
        }
      }

      // Hi-hat (every 1/2 beat)
      const halfBeatTime = t % (beatInterval / 2);
      if (halfBeatTime < 0.08) {
        const env = Math.exp(-halfBeatTime * 45);
        sample += (Math.random() * 2 - 1) * env * 0.12;
      }

      // 2. Chords & Pad
      const chordIndex = Math.floor((t / barInterval) % chords.length);
      const activeChord = chords[chordIndex];
      for (const freq of activeChord) {
        const vibrato = 1 + 0.005 * Math.sin(2 * Math.PI * 4 * t);
        const pad = Math.sin(2 * Math.PI * freq * vibrato * t);
        const overtone = Math.sin(2 * Math.PI * freq * 2 * t) * 0.3;
        sample += (pad + overtone) * 0.07;
      }

      // 3. Sub Bass
      const rootFreq = activeChord[0] / 2;
      sample += Math.sin(2 * Math.PI * rootFreq * t) * 0.22;

      // 4. Subtle Lo-fi vinyl texture
      sample += (Math.random() * 2 - 1) * 0.005;

      buffer[i] = sample;
    }

    const wavBlob = writeWavHeader(buffer, sampleRate);
    const url = URL.createObjectURL(wavBlob);
    resolve(url);
  });
}
