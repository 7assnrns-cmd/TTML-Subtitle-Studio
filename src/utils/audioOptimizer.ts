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
}

export async function optimizeAndChunkAudio(
  fileOrBlob: File | Blob,
  maxChunkDurationSec = 40,
  onProgress?: (msg: string, percent?: number) => void
): Promise<{
  chunks: AudioChunk[];
  totalDuration: number;
  sampleRate: number;
  isOptimized: boolean;
}> {
  if (onProgress) onProgress('Decoding audio waveform in browser...', 15);
  const arrayBuffer = await fileOrBlob.arrayBuffer();

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
        },
      ],
      totalDuration: 0,
      sampleRate: 44100,
      isOptimized: false,
    };
  }

  const audioCtx = new AudioCtx();
  let audioBuffer: AudioBuffer;

  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (decodeErr) {
    console.warn('Direct decodeAudioData failed, falling back to direct upload:', decodeErr);
    await audioCtx.close().catch(() => {});
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
        },
      ],
      totalDuration: 0,
      sampleRate: 44100,
      isOptimized: false,
    };
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
    const startTime = i * chunkDuration;
    const endTime = Math.min(totalDuration, (i + 1) * chunkDuration);
    const chunkLengthSec = endTime - startTime;
    const chunkSampleCount = Math.ceil(chunkLengthSec * targetSampleRate);

    // Create OfflineAudioContext for this specific slice
    const offlineCtx = new OfflineAudioContext(1, chunkSampleCount, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);

    // Start playback with offset
    source.start(0, startTime, chunkLengthSec);

    const resampledChunk = await offlineCtx.startRendering();
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
    });
  }

  await audioCtx.close().catch(() => {});

  return {
    chunks,
    totalDuration,
    sampleRate: targetSampleRate,
    isOptimized: true,
  };
}

/**
 * Encode an AudioBuffer into standard 16-bit PCM WAV format Blob
 */
export function encodeWavBuffer(audioBuffer: AudioBuffer): Blob {
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
