import { separateGluedWords } from '../utils';

/**
 * Helper to normalize words, prevent clumping, and enforce micro-timestamps & agent mappings
 */
export function normalizeExtractedParagraphs(
  rawParagraphs: any[],
  primaryLang = 'en',
  timeOffset = 0,
  startWordIndex = 1,
  startParaIndex = 1
) {
  let wordCounter = startWordIndex;
  let paraCounter = startParaIndex;
  const detectedLanguagesSet = new Set<string>();
  if (primaryLang) detectedLanguagesSet.add(primaryLang);

  const detectedAgentIds = new Set<string>();

  const paragraphs = (rawParagraphs || []).map((p: any) => {
    const pId = `p${paraCounter++}`;
    const pLang = p.lang || primaryLang;
    if (pLang) detectedLanguagesSet.add(pLang);

    const isBg = Boolean(p.isBackground || p.role === 'harmony' || p.role === 'background' || String(p.text || '').startsWith('('));
    const pRole = p.role || (isBg ? 'harmony' : 'lead');
    const pAgentId = p.agentId || (isBg ? 'v_bg' : 'v1');
    detectedAgentIds.add(pAgentId);

    const rawWords: any[] = Array.isArray(p.words) ? p.words : [];
    const pStart = (Number(p.start) || 0) + timeOffset;
    const pEnd = (Number(p.end) > (Number(p.start) || 0) ? Number(p.end) : (Number(p.start) || 0) + 1.0) + timeOffset;

    // Ensure no clumped or concatenated words
    const unpackedWordEntries: {
      word: string;
      start: number;
      end: number;
      lang?: string;
      confidence?: number;
      pauseAfter?: number;
      agentId?: string;
      isBackground?: boolean;
    }[] = [];

    if (rawWords.length === 0 && p.text) {
      const splitWords = separateGluedWords(p.text);
      const wordDuration = Math.max(0.1, (pEnd - pStart) / (splitWords.length || 1));
      splitWords.forEach((sw: string, idx: number) => {
        const wStart = pStart + idx * wordDuration;
        const wEnd = Math.min(pEnd, wStart + wordDuration * 0.95);
        unpackedWordEntries.push({
          word: sw.trim(),
          start: Number(wStart.toFixed(3)),
          end: Number(wEnd.toFixed(3)),
          lang: pLang,
          confidence: 0.95,
          pauseAfter: Number((wordDuration * 0.05).toFixed(3)),
          agentId: pAgentId,
          isBackground: isBg,
        });
      });
    } else {
      rawWords.forEach((w: any) => {
        const wordStr = String(w.word || '').trim();
        if (!wordStr) return;

        const wStart = (Number(w.start) || 0) + timeOffset;
        const wEnd = (Number(w.end) > (Number(w.start) || 0) ? Number(w.end) : (Number(w.start) || 0) + 0.3) + timeOffset;
        const subWords = separateGluedWords(wordStr);
        const wAgentId = w.agentId || pAgentId;
        const wIsBg = w.isBackground !== undefined ? Boolean(w.isBackground) : isBg;

        if (subWords.length > 1) {
          const weights = subWords.map((sw: string) => {
            const vowels = (sw.match(/[aeiouy]/gi) || []).length;
            return Math.max(1, sw.length + vowels * 0.5);
          });
          const totalWeight = weights.reduce((a, b) => a + b, 0) || subWords.length;
          const totalInterval = wEnd - wStart;
          let currentSubStart = wStart;

          subWords.forEach((sw: string, idx: number) => {
            const charWeight = weights[idx] / totalWeight;
            const subDuration = Math.max(0.06, totalInterval * charWeight);
            const subEnd = idx === subWords.length - 1 ? wEnd : Math.min(wEnd, currentSubStart + subDuration * 0.95);

            unpackedWordEntries.push({
              word: sw.trim(),
              start: Number(currentSubStart.toFixed(3)),
              end: Number(subEnd.toFixed(3)),
              lang: w.lang || pLang,
              confidence: Number(w.confidence ?? 0.95),
              pauseAfter: idx === subWords.length - 1 ? Number(w.pauseAfter || 0) : 0.02,
              agentId: wAgentId,
              isBackground: wIsBg,
            });
            currentSubStart = subEnd;
          });
        } else {
          unpackedWordEntries.push({
            word: wordStr.trim(),
            start: Number(wStart.toFixed(3)),
            end: Number(wEnd.toFixed(3)),
            lang: w.lang || pLang,
            confidence: Number(w.confidence ?? 0.95),
            pauseAfter: Number(w.pauseAfter || 0),
            agentId: wAgentId,
            isBackground: wIsBg,
          });
        }
      });
    }

    let runningWordEnd = pStart;
    const words = unpackedWordEntries.map((w) => {
      const wId = `${pId}_w${wordCounter++}`;
      const start = Math.max(runningWordEnd, w.start);
      const end = Math.max(start + 0.040, w.end);
      const duration = Number((end - start).toFixed(3));
      runningWordEnd = end;

      const wLang = w.lang || pLang;
      if (wLang) detectedLanguagesSet.add(wLang);

      return {
        id: wId,
        word: w.word.trim(),
        start: Number(start.toFixed(3)),
        end: Number(end.toFixed(3)),
        duration,
        pauseAfter: Number((w.pauseAfter || 0).toFixed(3)),
        pauseType:
          (w.pauseAfter || 0) > 0.6
            ? 'sentence'
            : (w.pauseAfter || 0) > 0.3
            ? 'syntactic'
            : (w.pauseAfter || 0) > 0.1
            ? 'short'
            : 'none',
        confidence: Number((w.confidence ?? 0.95).toFixed(2)),
        lang: wLang !== primaryLang ? wLang : undefined,
        agentId: w.agentId || pAgentId,
        isBackground: w.isBackground ?? isBg,
      };
    });

    // Compute micro-gaps between consecutive words
    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i];
      const nextWord = words[i + 1];
      const actualGap = Number((nextWord.start - currentWord.end).toFixed(3));
      if (actualGap > 0.03) {
        currentWord.pauseAfter = actualGap;
        currentWord.pauseType =
          actualGap > 0.6 ? 'sentence' : actualGap > 0.3 ? 'syntactic' : 'short';
      }
    }

    // Reconstruct line text with clean single space between every word
    const lineText = words.map((w: any) => w.word.trim()).join(' ').replace(/\s+/g, ' ').trim();

    return {
      id: pId,
      text: lineText || p.text || '',
      start: words[0]?.start ?? pStart,
      end: words[words.length - 1]?.end ?? pEnd,
      lang: pLang,
      songPart: p.songPart || undefined,
      agentId: pAgentId,
      role: pRole,
      isBackground: isBg,
      words,
    };
  });

  return {
    paragraphs,
    nextWordIndex: wordCounter,
    nextParaIndex: paraCounter,
    detectedLanguages: Array.from(detectedLanguagesSet),
    detectedAgentIds: Array.from(detectedAgentIds),
  };
}

/**
 * Constructs compliant Apple Music TTML agents list from parsed data and detected roles
 */
export function buildAgentsList(parsedAgents: any[] = [], paragraphs: any[] = [], detectedAgentIds: string[] = []) {
  const agentsMap = new Map<string, { id: string; name: string; type: 'person' | 'group' | 'other'; role?: string }>();

  // Default primary lead vocalist
  agentsMap.set('v1', { id: 'v1', name: 'Lead Vocalist', type: 'person', role: 'lead' });

  if (Array.isArray(parsedAgents)) {
    parsedAgents.forEach((a: any) => {
      if (a && a.id) {
        agentsMap.set(a.id, {
          id: String(a.id),
          name: a.name || (a.id === 'v1' ? 'Lead Vocalist' : a.id === 'v_bg' ? 'Backing Harmonies' : `Singer ${a.id}`),
          type: a.type === 'group' || a.type === 'other' ? a.type : 'person',
          role: a.role || (a.id === 'v_bg' ? 'background' : a.id === 'v1' ? 'lead' : 'featured'),
        });
      }
    });
  }

  // Check paragraphs for agents not yet defined
  paragraphs.forEach((p: any) => {
    if (p.agentId && !agentsMap.has(p.agentId)) {
      if (p.agentId === 'v_bg' || p.isBackground) {
        agentsMap.set('v_bg', { id: 'v_bg', name: 'Backing Harmonies', type: 'group', role: 'background' });
      } else if (p.agentId === 'v2') {
        agentsMap.set('v2', { id: 'v2', name: 'Duet Vocalist', type: 'person', role: 'featured' });
      } else {
        agentsMap.set(p.agentId, { id: p.agentId, name: `Singer ${p.agentId}`, type: 'person', role: p.role || 'featured' });
      }
    }
    if (p.isBackground && !agentsMap.has('v_bg')) {
      agentsMap.set('v_bg', { id: 'v_bg', name: 'Backing Harmonies', type: 'group', role: 'background' });
    }
  });

  detectedAgentIds.forEach((id) => {
    if (!agentsMap.has(id)) {
      if (id === 'v_bg') {
        agentsMap.set('v_bg', { id: 'v_bg', name: 'Backing Harmonies', type: 'group', role: 'background' });
      } else {
        agentsMap.set(id, { id, name: `Singer ${id}`, type: 'person', role: 'featured' });
      }
    }
  });

  return Array.from(agentsMap.values());
}
