/**
 * Client-side audio resampler, optimizer, and chunking engine.
 * Converts large audio files (e.g. 50MB WAV/MP3 songs) into 16kHz mono WAV chunks
 * to guarantee zero-timeout, continuous acoustic ingestion by Gemini with millisecond precision.
 */

export interface AudioChunk {
  chunkIndex: number;
  totalChunks: number;
  startTime: number;
  endTime: number;
  duration: number;
  blob: Blob;
  base64: string;
  isOptimized?: boolean;
}

export async function optimizeAndChunkAudio(
  fileOrBlob: File | Blob,
  maxChunkDurationSec = 20,
  onProgress?: (msg: string, percent?: number) => void
): Promise<{
  chunks: AudioChunk[];
  totalDuration: number;
  sampleRate: number;
  isOptimized: boolean;
}> {
  if (onProgress) onProgress('Decoding audio waveform in browser...', 15);

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await fileOrBlob.arrayBuffer();
  } catch (err) {
    console.warn('Failed to read file ArrayBuffer:', err);
    const base64 = await blobToBase64(fileOrBlob);
    return {
      chunks: [
        {
          chunkIndex: 0,
          totalChunks: 1,
          startTime: 0,
          endTime: 0,
          duration: 0,
          blob: fileOrBlob,
          base64,
          isOptimized: false,
        },
      ],
      totalDuration: 0,
      sampleRate: 44100,
      isOptimized: false,
    };
  }

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) {
    // Fallback if Web Audio API is unavailable
    const base64 = await blobToBase64(fileOrBlob);
    return {
      chunks: [
        {
          chunkIndex: 0,
          totalChunks: 1,
          startTime: 0,
          endTime: 0,
          duration: 0,
          blob: fileOrBlob,
          base64,
          isOptimized: false,
        },
      ],
      totalDuration: 0,
      sampleRate: 44100,
      isOptimized: false,
    };
  }

  let audioCtx: AudioContext | null = null;
  let audioBuffer: AudioBuffer | null = null;

  // 1. Synchronize the AudioContext sample rate precisely with the input audio file configuration
  let originalSampleRate = 44100;
  try {
    const detectCtx = new OfflineAudioContext(1, 1, 44100);
    const decodedHeaderBuffer = await detectCtx.decodeAudioData(arrayBuffer.slice(0));
    originalSampleRate = decodedHeaderBuffer.sampleRate;
    console.log('[Audio Decoder] Detected input audio native sample rate:', originalSampleRate);
  } catch (e) {
    console.warn('[Audio Decoder] Failed to detect native sample rate, default to 44100:', e);
  }

  try {
    try {
      audioCtx = new AudioCtx({ sampleRate: originalSampleRate });
    } catch (e) {
      console.warn('[Audio Decoder] Context creation with native sampleRate failed, fallback to default:', e);
      audioCtx = new AudioCtx();
    }
    const bufferCopy = arrayBuffer.slice(0);

    audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
      try {
        const res = audioCtx!.decodeAudioData(
          bufferCopy,
          (decoded) => {
            if (decoded) resolve(decoded);
            else reject(new Error('Decoded audio buffer is null or empty'));
          },
          (err) => reject(err || new Error('Failed to decode audio data'))
        );
        if (res && typeof res.then === 'function') {
          res.then(resolve).catch(reject);
        }
      } catch (e) {
        reject(e);
      }
    });
  } catch (decodeErr) {
    console.warn('Direct decodeAudioData failed, falling back to direct upload:', decodeErr);
    if (audioCtx) await audioCtx.close().catch(() => {});
    const base64 = await blobToBase64(fileOrBlob);
    return {
      chunks: [
        {
          chunkIndex: 0,
          totalChunks: 1,
          startTime: 0,
          endTime: 0,
          duration: 0,
          blob: fileOrBlob,
          base64,
          isOptimized: false,
        },
      ],
      totalDuration: 0,
      sampleRate: 44100,
      isOptimized: false,
    };
  }

  if (!audioBuffer || !audioBuffer.duration || isNaN(audioBuffer.duration) || audioBuffer.duration <= 0) {
    if (audioCtx) await audioCtx.close().catch(() => {});
    const base64 = await blobToBase64(fileOrBlob);
    return {
      chunks: [
        {
          chunkIndex: 0,
          totalChunks: 1,
          startTime: 0,
          endTime: 0,
          duration: 0,
          blob: fileOrBlob,
          base64,
          isOptimized: false,
        },
      ],
      totalDuration: 0,
      sampleRate: 44100,
      isOptimized: false,
    };
  }

  // 2. Volume/Amplitude Peak Normalization to standardized -1dB (approx 0.95)
  try {
    let maxVal = 0;
    const numChannels = audioBuffer.numberOfChannels;
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let idx = 0; idx < channelData.length; idx++) {
        const abs = Math.abs(channelData[idx]);
        if (abs > maxVal) maxVal = abs;
      }
    }

    if (maxVal > 0 && maxVal < 0.95) {
      const scale = 0.95 / maxVal;
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let idx = 0; idx < channelData.length; idx++) {
          channelData[idx] *= scale;
        }
      }
      console.log(`[Audio Decoder] Normalized audio track peak amplitude from ${maxVal.toFixed(2)} to 0.95 (scaling x${scale.toFixed(2)})`);
      if (onProgress) {
        onProgress(`Normalized audio track volume (peak scaled from ${maxVal.toFixed(2)} to 0.95)...`, 20);
      }
    }
  } catch (normErr) {
    console.warn('[Audio Decoder] Amplitude normalization warning:', normErr);
  }

  const totalDuration = audioBuffer.duration;
  const targetSampleRate = 16000; // 16kHz mono is standard for speech/lyric phonetics

  // If audio is shorter than 45 seconds, 1 chunk is optimal; otherwise 35-40s chunks
  const numChunks = totalDuration > 45 ? Math.ceil(totalDuration / maxChunkDurationSec) : 1;
  const chunkDuration = totalDuration / numChunks;

  if (onProgress) {
    onProgress(
      `Resampling ${Math.round(totalDuration)}s track into ${numChunks} optimized acoustic chunk${numChunks > 1 ? 's' : ''}...`,
      25
    );
  }

  const chunks: AudioChunk[] = [];

  for (let i = 0; i < numChunks; i++) {
    // Yield to main thread with non-blocking timeouts to prevent UI freezing
    await new Promise((resolve) => setTimeout(resolve, 15));

    const startTime = i * chunkDuration;
    const endTime = Math.min(totalDuration, (i + 1) * chunkDuration);
    const chunkLengthSec = Math.max(0.1, endTime - startTime);
    const chunkSampleCount = Math.ceil(chunkLengthSec * targetSampleRate);

    let offlineCtx: OfflineAudioContext | null = null;
    let source: AudioBufferSourceNode | null = null;

    try {
      // Create OfflineAudioContext for this specific slice
      offlineCtx = new OfflineAudioContext(1, chunkSampleCount, targetSampleRate);
      source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineCtx.destination);

      // Start playback with offset
      source.start(0, startTime, chunkLengthSec);

      const resampledChunk = await new Promise<AudioBuffer>((resolve, reject) => {
        try {
          const res = offlineCtx!.startRendering();
          if (res && typeof res.then === 'function') {
            res.then(resolve).catch(reject);
          } else {
            offlineCtx!.oncomplete = (e) => resolve(e.renderedBuffer);
            (offlineCtx as any).onerror = (e: any) => reject(e);
          }
        } catch (e) {
          reject(e);
        }
      });

      // Cleanup Web Audio nodes to prevent memory overlapping
      source.disconnect();

      const wavBlob = encodeWavBuffer(resampledChunk);
      const base64 = await blobToBase64(wavBlob);

      chunks.push({
        chunkIndex: i,
        totalChunks: numChunks,
        startTime: Number(startTime.toFixed(3)),
        endTime: Number(endTime.toFixed(3)),
        duration: Number(chunkLengthSec.toFixed(3)),
        blob: wavBlob,
        base64,
        isOptimized: true,
      });
    } catch (chunkErr) {
      console.warn(`Chunk ${i} offline rendering failed, fallback to raw file:`, chunkErr);
      if (source) {
        try {
          source.disconnect();
        } catch (e) {}
      }
      const base64 = await blobToBase64(fileOrBlob);
      chunks.push({
        chunkIndex: i,
        totalChunks: numChunks,
        startTime: Number(startTime.toFixed(3)),
        endTime: Number(endTime.toFixed(3)),
        duration: Number(chunkLengthSec.toFixed(3)),
        blob: fileOrBlob,
        base64,
        isOptimized: false,
      });
    }
  }

  if (audioCtx) await audioCtx.close().catch(() => {});

  return {
    chunks,
    totalDuration,
    sampleRate: targetSampleRate,
    isOptimized: chunks.some((c) => c.isOptimized),
  };
}

/**
 * Encode an AudioBuffer into standard 16-bit PCM WAV format Blob
 */
export function encodeWavBuffer(audioBuffer: AudioBuffer): Blob {
  if (!audioBuffer || audioBuffer.numberOfChannels === 0 || audioBuffer.length === 0) {
    return new Blob([], { type: 'audio/wav' });
  }

  const numChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const channelData = audioBuffer.getChannelData(0);
  const dataLength = channelData.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // Write WAV header
  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < channelData.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
