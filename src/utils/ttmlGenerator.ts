import { ParagraphSegment, TTMLConfig, WordTiming } from '../types';

export function formatTimecode(seconds: number, format: TTMLConfig['timeFormat'], frameRate = 30): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;

  if (format === 'seconds') {
    return `${seconds.toFixed(3)}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');

  if (format === 'frames') {
    const frames = Math.floor(((seconds % 1) * 1000) / (1000 / frameRate));
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}:${pad(frames)}`;
  }

  // Default clock time '00:00:00.000'
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(milliseconds, 3)}`;
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateTTML(
  paragraphs: ParagraphSegment[],
  config: TTMLConfig,
  metadata?: {
    duration?: number;
    rawTranscript?: string;
    totalWords?: number;
    totalPauses?: number;
    detectedLanguages?: string[];
  }
): string {
  const {
    language = 'en',
    title = 'Audio Subtitle Transcription',
    author = 'v1',
    timeFormat = 'clock',
    frameRate = 30,
    emitPerWordLang = false,
  } = config;

  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<tt xmlns="http://www.w3.org/ns/ttml"\n`;
  xml += `    xmlns:ttm="http://www.w3.org/ns/ttml#metadata"\n`;
  xml += `    xmlns:itunes="http://music.apple.com/lyric-ttml-internal"\n`;
  xml += `    xml:lang="${escapeXml(language)}"\n`;
  xml += `    itunes:timing="Word">\n`;

  // Clean Apple Music head metadata
  xml += `  <head>\n`;
  xml += `    <metadata>\n`;
  xml += `      <ttm:agent type="person" xml:id="v1">${escapeXml(author || 'v1')}</ttm:agent>\n`;
  xml += `      <ttm:title>${escapeXml(title)}</ttm:title>\n`;
  xml += `    </metadata>\n`;
  xml += `  </head>\n`;

  // Body with grouped <div> sections
  xml += `  <body>\n`;

  // Group paragraphs into songPart blocks (e.g. Verse, Chorus, Bridge, Outro, Intro)
  interface SongPartGroup {
    songPart: string;
    paras: ParagraphSegment[];
  }

  const groups: SongPartGroup[] = [];
  let currentGroup: SongPartGroup | null = null;

  paragraphs.forEach((p, idx) => {
    let part = p.songPart?.trim() || '';
    if (!part) {
      // Default to "Verse" for initial lines, "Chorus" for subsequent blocks
      if (paragraphs.length <= 2) {
        part = idx === 0 ? 'Verse' : 'Chorus';
      } else {
        part = Math.floor(idx / 2) % 2 === 0 ? 'Verse' : 'Chorus';
      }
    }
    // Capitalize first letter (e.g. "verse" -> "Verse")
    part = part.charAt(0).toUpperCase() + part.slice(1);

    if (!currentGroup || currentGroup.songPart !== part) {
      currentGroup = { songPart: part, paras: [p] };
      groups.push(currentGroup);
    } else {
      currentGroup.paras.push(p);
    }
  });

  let lineCounter = 1;

  groups.forEach((group) => {
    xml += `    <div itunes:songPart="${escapeXml(group.songPart)}">\n`;

    group.paras.forEach((para) => {
      const pBegin = formatTimecode(para.start, timeFormat, frameRate);
      const pEnd = formatTimecode(para.end, timeFormat, frameRate);
      const lineKey = `L${lineCounter++}`;
      const pLangAttr =
        emitPerWordLang && para.lang && para.lang !== language
          ? ` xml:lang="${escapeXml(para.lang)}"`
          : '';

      xml += `      <p begin="${pBegin}" end="${pEnd}" itunes:key="${lineKey}" ttm:agent="v1"${pLangAttr}>\n`;

      para.words.forEach((w: WordTiming, wIdx: number) => {
        const wBegin = formatTimecode(w.start, timeFormat, frameRate);
        const wEnd = formatTimecode(w.end, timeFormat, frameRate);
        const wLangAttr =
          emitPerWordLang && w.lang && w.lang !== para.lang && w.lang !== language
            ? ` xml:lang="${escapeXml(w.lang)}"`
            : '';

        const cleanWord = w.word.trim();
        const isLastWord = wIdx === para.words.length - 1;
        // In Apple Music TTML, non-final word spans include their trailing space delimiter
        // so word text nodes never concatenate or glue together during rendering or ingestion.
        const trailingSpace = isLastWord ? '' : ' ';

        xml += `        <span begin="${wBegin}" end="${wEnd}"${wLangAttr}>${escapeXml(cleanWord)}${trailingSpace}</span>\n`;
      });

      xml += `      </p>\n`;
    });

    xml += `    </div>\n`;
  });

  xml += `  </body>\n`;
  xml += `</tt>\n`;

  return xml;
}

export function generateSRT(paragraphs: ParagraphSegment[]): string {
  let srt = '';
  let index = 1;

  paragraphs.forEach((p) => {
    const start = formatTimecode(p.start, 'clock').replace('.', ',');
    const end = formatTimecode(p.end, 'clock').replace('.', ',');
    const text = p.words.map((w) => w.word.trim()).join(' ').replace(/\s+/g, ' ').trim();

    srt += `${index}\n${start} --> ${end}\n${text}\n\n`;
    index++;
  });

  return srt;
}

export function generateVTT(paragraphs: ParagraphSegment[]): string {
  let vtt = 'WEBVTT - Generated by TTML Subtitle Studio\n\n';

  paragraphs.forEach((p, idx) => {
    const start = formatTimecode(p.start, 'clock');
    const end = formatTimecode(p.end, 'clock');
    const text = p.words.map((w) => w.word.trim()).join(' ').replace(/\s+/g, ' ').trim();

    vtt += `${idx + 1}\n${start} --> ${end}\n${text}\n\n`;
  });

  return vtt;
}

export function calculateTimingStats(words: WordTiming[], duration: number): {
  totalWords: number;
  totalSpeechDuration: number;
  totalPauseDuration: number;
  pauseCount: number;
  wordsPerMinute: number;
  speechToSilenceRatio: number;
  averageWordDuration: number;
  longestPause: number;
} {
  const totalWords = words.length;
  let totalSpeechDuration = 0;
  let totalPauseDuration = 0;
  let pauseCount = 0;
  let longestPause = 0;

  words.forEach((w) => {
    totalSpeechDuration += w.duration;
    if (w.pauseAfter > 0.05) {
      totalPauseDuration += w.pauseAfter;
      pauseCount++;
      if (w.pauseAfter > longestPause) {
        longestPause = w.pauseAfter;
      }
    }
  });

  const totalTime = duration > 0 ? duration : (totalSpeechDuration + totalPauseDuration);
  const minutes = totalTime / 60;
  const wordsPerMinute = minutes > 0 ? Math.round(totalWords / minutes) : 0;
  const speechToSilenceRatio = totalPauseDuration > 0
    ? Number((totalSpeechDuration / totalPauseDuration).toFixed(2))
    : totalSpeechDuration > 0 ? 100 : 0;
  const averageWordDuration = totalWords > 0
    ? Number((totalSpeechDuration / totalWords).toFixed(3))
    : 0;

  return {
    totalWords,
    totalSpeechDuration: Number(totalSpeechDuration.toFixed(2)),
    totalPauseDuration: Number(totalPauseDuration.toFixed(2)),
    pauseCount,
    wordsPerMinute,
    speechToSilenceRatio,
    averageWordDuration,
    longestPause: Number(longestPause.toFixed(3)),
  };
}
