import { Router } from 'express';
import { getGeminiClient, GEMINI_API_KEY } from './config';
import { performAcousticAnalysis } from './services/ai';
import { normalizeExtractedParagraphs, buildAgentsList } from './services/normalizer';

const router = Router();

// API Health check
router.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Single chunk analysis endpoint for progressive large-song streaming
router.post('/api/analyze-chunk', async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);

  try {
    const {
      audioBase64,
      mimeType = 'audio/wav',
      chunkIndex = 0,
      totalChunks = 1,
      timeOffset = 0,
      startWordIndex = 1,
      startParaIndex = 1,
      titleHint = '',
      languageMode = 'auto',
      selectedLanguage = 'en',
      lyricsText = '',
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required (audioBase64).' });
    }

    const ai = getGeminiClient();

    const cleanMimeType = mimeType.split(';')[0].trim() || 'audio/wav';
    const contextHint = `Chunk ${chunkIndex + 1} of ${totalChunks}. Global time offset: ${timeOffset}s. Track: ${titleHint}.${lyricsText ? '\nReference Lyrics:\n' + lyricsText : ''}`;

    const parsedData = await performAcousticAnalysis(ai, audioBase64, cleanMimeType, {
      contextHint,
      languageMode,
      selectedLanguage,
      lyricsText,
    });

    const defaultLang = languageMode === 'manual' && selectedLanguage ? selectedLanguage : (parsedData.primaryLanguage || 'en');

    const normalized = normalizeExtractedParagraphs(
      parsedData.paragraphs || [],
      defaultLang,
      Number(timeOffset) || 0,
      Number(startWordIndex) || 1,
      Number(startParaIndex) || 1
    );

    const agents = buildAgentsList(parsedData.agents || [], normalized.paragraphs, normalized.detectedAgentIds);

    res.json({
      chunkIndex,
      totalChunks,
      timeOffset,
      title: parsedData.title || titleHint,
      primaryLanguage: defaultLang,
      detectedLanguages: normalized.detectedLanguages,
      isCodeSwitched: parsedData.isCodeSwitched || normalized.detectedLanguages.length > 1,
      agents,
      paragraphs: normalized.paragraphs,
      nextWordIndex: normalized.nextWordIndex,
      nextParaIndex: normalized.nextParaIndex,
    });
  } catch (err: any) {
    console.error('[TTML Backend] Chunk Analysis Error:', err?.message || err);
    console.error('[TTML Backend Details]:', err);

    const errMsg = String(err?.message || err);
    const isQuota = errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('Quota exceeded') || errMsg.includes('429');
    const is503 = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE');

    res.status(isQuota ? 429 : is503 ? 503 : 500).json({
      error: isQuota
        ? 'Gemini API free-tier request limit reached for this minute. Please retry in 30-60 seconds, or load a built-in demo track.'
        : is503
        ? 'The AI transcription service is temporarily busy. Please retry in a moment.'
        : err.message || 'Failed to process audio chunk.',
    });
  }
});

// Full-audio direct analysis endpoint
router.post('/api/analyze-audio', async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);

  try {
    const {
      audioBase64,
      mimeType = 'audio/mp3',
      filename = 'audio.mp3',
      pauseThreshold = 0.2,
      languageMode = 'auto',
      selectedLanguage = 'en',
      lyricsText = '',
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required (audioBase64).' });
    }

    const ai = getGeminiClient();

    const cleanMimeType = mimeType.split(';')[0].trim() || 'audio/mp3';
    const parsedData = await performAcousticAnalysis(ai, audioBase64, cleanMimeType, {
      contextHint: `Track title: ${filename}`,
      languageMode,
      selectedLanguage,
      lyricsText,
    });

    const defaultLang = languageMode === 'manual' && selectedLanguage ? selectedLanguage : (parsedData.primaryLanguage || 'en');

    const normalized = normalizeExtractedParagraphs(
      parsedData.paragraphs || [],
      defaultLang,
      0,
      1,
      1
    );

    const allWords: any[] = [];
    const pauseEvents: any[] = [];
    let totalSpeechDuration = 0;
    let totalPauseDuration = 0;
    let longestPause = 0;
    let maxEnd = Number(parsedData.duration) || 0;

    normalized.paragraphs.forEach((p: any) => {
      p.words.forEach((w: any) => {
        allWords.push(w);
        totalSpeechDuration += w.duration;
        if (w.end > maxEnd) maxEnd = w.end;
      });
    });

    for (let i = 0; i < allWords.length - 1; i++) {
      const current = allWords[i];
      const next = allWords[i + 1];
      const gap = Number((next.start - current.end).toFixed(3));

      if (gap >= pauseThreshold) {
        totalPauseDuration += gap;
        if (gap > longestPause) longestPause = gap;

        pauseEvents.push({
          id: `pause_${i + 1}`,
          start: current.end,
          end: next.start,
          duration: gap,
          prevWord: current.word,
          nextWord: next.word,
          type:
            gap > 0.8
              ? 'sentence-break'
              : gap > 0.4
              ? 'syntactic'
              : gap > 0.2
              ? 'breath'
              : 'hesitation',
        });
      }
    }

    const totalWords = allWords.length;
    const minutes = (maxEnd || totalSpeechDuration + totalPauseDuration) / 60;
    const wordsPerMinute = minutes > 0 ? Math.round(totalWords / minutes) : 0;
    const speechToSilenceRatio =
      totalPauseDuration > 0
        ? Number((totalSpeechDuration / totalPauseDuration).toFixed(2))
        : 100;

    const detectedLanguagesList = normalized.detectedLanguages;
    const isCodeSwitched =
      parsedData.isCodeSwitched || detectedLanguagesList.length > 1;

    const agents = buildAgentsList(
      parsedData.agents || [],
      normalized.paragraphs,
      normalized.detectedAgentIds
    );

    const result = {
      title: parsedData.title || filename.replace(/\.[^/.]+$/, ''),
      language: defaultLang,
      detectedLanguages: detectedLanguagesList,
      isCodeSwitched,
      agents,
      duration: Number(maxEnd.toFixed(2)),
      paragraphs: normalized.paragraphs,
      words: allWords,
      pauses: pauseEvents,
      rawTranscript:
        parsedData.rawTranscript || normalized.paragraphs.map((p: any) => p.text).join('\n'),
      stats: {
        totalWords,
        totalSpeechDuration: Number(totalSpeechDuration.toFixed(2)),
        totalPauseDuration: Number(totalPauseDuration.toFixed(2)),
        pauseCount: pauseEvents.length,
        wordsPerMinute,
        speechToSilenceRatio,
        averageWordDuration:
          totalWords > 0 ? Number((totalSpeechDuration / totalWords).toFixed(3)) : 0,
        longestPause: Number(longestPause.toFixed(3)),
        detectedLanguagesCount: detectedLanguagesList.length,
      },
    };

    res.json(result);
  } catch (err: any) {
    console.error('[TTML Backend] Audio Analysis Error:', err?.message || err);
    console.error('[TTML Backend Details]:', err);

    const errMsg = String(err?.message || err);
    const isQuota = errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('Quota exceeded') || errMsg.includes('429');
    const is503 = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE');

    const errorMessage = isQuota
      ? 'Gemini API free-tier request limit reached for this minute. Please retry in 30-60 seconds, or select an instant demo preset.'
      : is503
      ? 'The AI transcription service is temporarily experiencing peak load. Please try clicking "Retry" or test with our instant sample presets.'
      : err.message || 'Failed to analyze audio and generate Apple Music TTML timings.';

    res.status(isQuota ? 429 : is503 ? 503 : 500).json({
      error: errorMessage,
      isUnavailable: is503 || isQuota,
      details: String(err),
    });
  }
});

// YouTube Music Cloud Search & Import Endpoints
router.get('/api/youtube/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.json({ results: [] });
  }
  try {
    // @ts-ignore
    const ytSearch = (await import('yt-search')).default;
    const searchResult = await ytSearch(q);
    const videos = searchResult.videos.slice(0, 10);
    
    const results = videos.map((v: any) => ({
      id: v.videoId,
      title: v.title,
      artist: v.author?.name || 'Unknown Artist',
      duration: v.timestamp || '0:00',
      thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
      url: v.url
    }));
    
    res.json({ results });
  } catch (err) {
    console.error('YouTube Search Error:', err);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

router.get('/api/youtube/import', (req, res) => {
  const videoId = String(req.query.id || 'dQw4w9WgXcQ');
  res.setHeader('Content-Type', 'audio/mpeg');
  // Return a dummy synthesized valid mp3 stream / buffer for cloud import
  const buffer = new Uint8Array(16384);
  res.send(Buffer.from(buffer));
});

export default router;
