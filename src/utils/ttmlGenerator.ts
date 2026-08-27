import { ParagraphSegment, TTMAgent, TTMLConfig, WordTiming } from '../types';

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

/**
 * Generates Apple Music compliant TTML with Multi-Agent Singer Architecture (<ttm:agent>),
 * Background Harmonies Detection, and Microsecond Word-Level Highlighting.
 */
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
    agents: userAgents = [],
    defaultAgentId = 'v1',
  } = config;

  // Build complete list of unique agents present in config and paragraphs
  const agentsMap = new Map<string, TTMAgent>();

  // Ensure default primary agent exists
  agentsMap.set('v1', {
    id: 'v1',
    name: author && author !== 'v1' ? author : 'Lead Vocalist',
    type: 'person',
    role: 'lead',
  });

  // Add configured agents
  if (Array.isArray(userAgents)) {
    userAgents.forEach((a) => {
      if (a && a.id) {
        agentsMap.set(a.id, {
          id: a.id,
          name: a.name || (a.id === 'v1' ? 'Lead Vocalist' : a.id === 'v_bg' ? 'Backing Harmonies' : `Singer ${a.id}`),
          type: a.type || 'person',
          role: a.role || (a.id === 'v_bg' ? 'background' : a.id === 'v1' ? 'lead' : 'featured'),
        });
      }
    });
  }

  // Scan paragraphs for agents
  paragraphs.forEach((p) => {
    const isBg = Boolean(p.isBackground || p.role === 'harmony' || p.role === 'background');
    const agentId = p.agentId || (isBg ? 'v_bg' : defaultAgentId);

    if (!agentsMap.has(agentId)) {
      if (agentId === 'v_bg' || isBg) {
        agentsMap.set('v_bg', {
          id: 'v_bg',
          name: 'Backing Harmonies',
          type: 'group',
          role: 'background',
        });
      } else if (agentId === 'v2') {
        agentsMap.set('v2', {
          id: 'v2',
          name: 'Duet Vocalist',
          type: 'person',
          role: 'featured',
        });
      } else {
        agentsMap.set(agentId, {
          id: agentId,
          name: `Singer ${agentId}`,
          type: 'person',
          role: p.role || 'featured',
        });
      }
    }
  });

  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<!-- 1. Header Metadata List -->\n`;
  xml += `<tt xmlns="http://www.w3.org/ns/ttml"\n`;
  xml += `    xmlns:ttm="http://www.w3.org/ns/ttml#metadata"\n`;
  xml += `    xmlns:itunes="http://music.apple.com/lyric-ttml-internal"\n`;
  xml += `    xml:lang="${escapeXml(language)}"\n`;
  xml += `    itunes:timing="Word">\n`;

  // Apple Music head metadata with multi-agent definitions
  xml += `  <head>\n`;
  xml += `    <metadata>\n`;
  xml += `      <!-- 2. Vocalist/Agent Attribution List -->\n`;
  Array.from(agentsMap.values()).forEach((agent) => {
    xml += `      <ttm:agent type="${escapeXml(agent.type || 'person')}" xml:id="${escapeXml(agent.id)}">${escapeXml(agent.name || agent.id)}</ttm:agent>\n`;
  });
  xml += `      <ttm:title>${escapeXml(title)}</ttm:title>\n`;
  xml += `    </metadata>\n`;
  xml += `  </head>\n`;

  // Body with grouped <div> sections
  const durAttr = metadata?.duration ? ` dur="${formatTimecode(metadata.duration, 'seconds', frameRate)}"` : '';
  xml += `  <body${durAttr}>\n`;
  xml += `    <!-- 3. Synchronized Timed Text List -->\n`;

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
      if (paragraphs.length <= 2) {
        part = idx === 0 ? 'Verse' : 'Chorus';
      } else {
        part = Math.floor(idx / 2) % 2 === 0 ? 'Verse' : 'Chorus';
      }
    }
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
      const pBegin = formatTimecode(para.start, 'seconds', frameRate);
      const pEnd = formatTimecode(para.end, 'seconds', frameRate);
      const lineKey = `L${lineCounter++}`;

      const isBg = Boolean(para.isBackground || para.role === 'harmony' || para.role === 'background');
      const paraAgentId = para.agentId || (isBg ? 'v_bg' : defaultAgentId);

      const pLangAttr =
        emitPerWordLang && para.lang && para.lang !== language
          ? ` xml:lang="${escapeXml(para.lang)}"`
          : '';

      const pRoleAttr = isBg ? ` ttm:role="x-bg"` : '';

      xml += `      <p begin="${pBegin}" end="${pEnd}" itunes:key="${lineKey}" ttm:agent="${escapeXml(paraAgentId)}"${pRoleAttr}${pLangAttr} xml:space="preserve">`;

      para.words.forEach((w: WordTiming, wIdx: number) => {
        const wBegin = formatTimecode(w.start, 'seconds', frameRate);
        const wEnd = formatTimecode(w.end, 'seconds', frameRate);

        const wLangAttr =
          emitPerWordLang && w.lang && w.lang !== para.lang && w.lang !== language
            ? ` xml:lang="${escapeXml(w.lang)}"`
            : '';

        const wAgentAttr =
          w.agentId && w.agentId !== paraAgentId
            ? ` ttm:agent="${escapeXml(w.agentId)}"`
            : '';

        const cleanWord = w.word.trim();
        const isLastWord = wIdx === para.words.length - 1;
        // Non-final words include trailing space inside the span
        const trailingSpace = isLastWord ? '' : ' ';

        xml += `<span begin="${wBegin}" end="${wEnd}"${wAgentAttr}${wLangAttr}>${escapeXml(cleanWord)}${trailingSpace}</span>`;
      });

      xml += `</p>\n`;
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
    const prefix = p.isBackground ? '(Background) ' : p.agentId && p.agentId !== 'v1' ? `[${p.agentId}] ` : '';
    const text = p.words.map((w) => w.word.trim()).join(' ').replace(/\s+/g, ' ').trim();

    srt += `${index}\n${start} --> ${end}\n${prefix}${text}\n\n`;
    index++;
  });

  return srt;
}

export function generateVTT(paragraphs: ParagraphSegment[]): string {
  let vtt = 'WEBVTT - Generated by TTML Subtitle Studio\n\n';

  paragraphs.forEach((p, idx) => {
    const start = formatTimecode(p.start, 'clock');
    const end = formatTimecode(p.end, 'clock');
    const prefix = p.isBackground ? '<v Background>' : p.agentId ? `<v ${p.agentId}>` : '';
    const suffix = prefix ? '</v>' : '';
    const text = p.words.map((w) => w.word.trim()).join(' ').replace(/\s+/g, ' ').trim();

    vtt += `${idx + 1}\n${start} --> ${end}\n${prefix}${text}${suffix}\n\n`;
  });

  return vtt;
}

export function formatLrcTimestamp(seconds: number): string {
  const safeSec = Math.max(0, seconds || 0);
  const m = Math.floor(safeSec / 60);
  const s = Math.floor(safeSec % 60);
  const ms = Math.floor((safeSec % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

export function generateLRC(
  paragraphs: ParagraphSegment[],
  metadata?: { title?: string; artist?: string; album?: string; duration?: number }
): string {
  let lrc = '';
  if (metadata?.title) lrc += `[ti:${metadata.title}]\n`;
  if (metadata?.artist) lrc += `[ar:${metadata.artist}]\n`;
  if (metadata?.album) lrc += `[al:${metadata.album}]\n`;
  if (metadata?.duration) {
    const dm = Math.floor(metadata.duration / 60);
    const ds = Math.floor(metadata.duration % 60);
    lrc += `[length:${String(dm).padStart(2, '0')}:${String(ds).padStart(2, '0')}]\n`;
  }
  lrc += `[by:TTML & LRC Studio (Dual Hybrid Engine)]\n\n`;

  paragraphs.forEach((p) => {
    const timestamp = formatLrcTimestamp(p.start);
    const prefix = p.isBackground ? '(Harmony) ' : '';
    const lineText = p.words && p.words.length > 0
      ? p.words.map((w) => w.word.trim()).join(' ').replace(/\s+/g, ' ').trim()
      : p.text.trim();

    lrc += `[${timestamp}]${prefix}${lineText}\n`;
  });

  return lrc;
}

export function generateEnhancedLRC(
  paragraphs: ParagraphSegment[],
  metadata?: { title?: string; artist?: string; album?: string; duration?: number }
): string {
  let lrc = '';
  if (metadata?.title) lrc += `[ti:${metadata.title}]\n`;
  if (metadata?.artist) lrc += `[ar:${metadata.artist}]\n`;
  if (metadata?.album) lrc += `[al:${metadata.album}]\n`;
  lrc += `[re:TTML Subtitle Studio Enhanced LRC]\n\n`;

  paragraphs.forEach((p) => {
    const lineTimestamp = formatLrcTimestamp(p.start);
    if (!p.words || p.words.length === 0) {
      lrc += `[${lineTimestamp}]${p.text.trim()}\n`;
      return;
    }

    let lineContent = `[${lineTimestamp}]`;
    if (p.isBackground) {
      lineContent += `(Harmony) `;
    }
    p.words.forEach((w, idx) => {
      const wTime = formatLrcTimestamp(w.start);
      const space = idx < p.words.length - 1 ? ' ' : '';
      lineContent += `<${wTime}>${w.word.trim()}${space}`;
    });
    lrc += `${lineContent}\n`;
  });

  return lrc;
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
