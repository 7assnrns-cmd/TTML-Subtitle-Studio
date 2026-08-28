/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { MainHub } from './components/MainHub';
import { StorageManager } from './components/StorageManager';
import { LiveAudioAnalyzer, LiveAnalysisState } from './components/LiveAudioAnalyzer';
import { AudioPlayerWaveform } from './components/AudioPlayerWaveform';
import { TTMLCodeViewer } from './components/TTMLCodeViewer';
import { LanguageSettingsModal } from './components/LanguageSettingsModal';
import { InfoModal } from './components/InfoModal';
import { HistoryModal } from './components/HistoryModal';
import { SettingsSection } from './components/SettingsSection';
import { NavigationDock } from './components/NavigationDock';
import { AndroidService } from './utils/androidService';
import { AudioAnalysisResult, TTMLConfig, WordTiming, ParagraphSegment, PauseEvent } from './types';
import { SAMPLE_DATASETS, createSyntheticAudioBuffer } from './utils/audioSamples';
import { calculateTimingStats } from './utils/ttmlGenerator';
import { optimizeAndChunkAudio, AudioChunk } from './utils/audioOptimizer';
import { separateGluedWords, recalibrateWordTimestamps } from './utils/wordSplitting';
import { UILanguage, getTranslation } from './utils/i18n';
import { loadSavedTheme, applyThemeVariables } from './utils/theme';
import { saveToHistory, SavedAnalysis } from './utils/storage';
import { requestNotificationPermission, sendProgressNotification, sendCompletionNotification, sendErrorNotification } from './utils/notifications';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

const DEFAULT_CONFIG: TTMLConfig = {
  profile: 'apple-music',
  timeFormat: 'clock',
  frameRate: 30,
  language: 'ja',
  title: 'Japanese Anime & English Code-Switching Track',
  author: 'v1',
  fontSize: '160%',
  fontFamily: 'Arial, Helvetica, sans-serif',
  textColor: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  activeWordColor: '#38BDF8',
  textAlign: 'center',
  includePauseMetadata: false,
  pauseThreshold: 0.2,
  splitSentencesOnLongPauses: true,
  enableTextOutline: true,
  emitPerWordLang: true,
  enable120HzMode: true,
  animationSpeed: 1.0,
  transitionScale: 1.0,
  visualizerStyle: 'bars',
  visualizerSensitivity: 5,
  subtitleFontWeight: '600',
  subtitleLetterSpacing: '0px',
  audioBufferDuration: 15, // Optimized for mobile stability
  themeConfig: loadSavedTheme(),
};

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '';

const INITIAL_LIVE_STATE: LiveAnalysisState = {
  isActive: false,
  currentChunk: 0,
  totalChunks: 1,
  currentStep: '',
  progressPercent: 0,
  extractedWordsCount: 0,
  extractedParagraphsCount: 0,
  streamedWords: [],
  detectedLanguages: [],
  currentSongPart: '',
  elapsedSeconds: 0,
  estimatedWpm: 0,
  logs: [],
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'hub' | 'editor' | 'history' | 'settings'>('hub');
  
  // Initialization and permissions
  useEffect(() => {
    const initApp = async () => {
      await AndroidService.requestPermissions();
      await AndroidService.getDeviceSpecs();
    };
    initApp();
  }, []);

  const [uiLanguage, setUiLanguage] = useState<UILanguage>('en');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('japanese_english_song.wav');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [liveState, setLiveState] = useState<LiveAnalysisState>(INITIAL_LIVE_STATE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedFile, setLastFailedFile] = useState<{
    file: File | Blob;
    filename: string;
    mimeType: string;
  } | null>(null);

  const [pauseThreshold, setPauseThreshold] = useState<number>(0.2);
  const [languageMode, setLanguageMode] = useState<'auto' | 'manual'>('auto');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ja');
  const [config, setConfig] = useState<TTMLConfig>(DEFAULT_CONFIG);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageSettingsOpen, setIsLanguageSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const timerRef = useRef<any>(null);

  const t = (key: string) => getTranslation(uiLanguage, key);

  // Apply theme variables (blur, border opacity, accent colors) on startup and configuration update
  useEffect(() => {
    applyThemeVariables(config.themeConfig);
  }, [config.themeConfig]);

  // Automatically and safely revoke previous Object URLs to prevent memory leaks
  const prevAudioUrlRef = useRef<string | null>(null);
  useEffect(() => {
    const prevUrl = prevAudioUrlRef.current;
    if (prevUrl && prevUrl !== audioUrl) {
      try {
        URL.revokeObjectURL(prevUrl);
        console.log('[Audio Leak Guard] Revoked unused object URL:', prevUrl);
      } catch (e) {
        console.warn('[Audio Leak Guard] Revoke error:', e);
      }
    }
    prevAudioUrlRef.current = audioUrl;
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (prevAudioUrlRef.current) {
        try {
          URL.revokeObjectURL(prevAudioUrlRef.current);
          console.log('[Audio Leak Guard] Revoked current object URL on unmount:', prevAudioUrlRef.current);
        } catch (e) {}
      }
    };
  }, []);

  // Load default initial sample for an immediate rich experience
  useEffect(() => {
    loadSampleDataset('japanese-english-song');
  }, []);

  const loadSampleDataset = useCallback((sampleId: string) => {
    const sample = SAMPLE_DATASETS.find((s) => s.id === sampleId) || SAMPLE_DATASETS[0];
    setFilename(`${sample.id}.wav`);
    setDuration(sample.duration);
    setAnalysisResult(sample.data);
    setConfig((prev) => ({
      ...prev,
      title: sample.title,
      language: sample.data.language || 'en',
    }));
    setCurrentTime(0);
    setIsPlaying(false);
    setErrorMessage(null);
    setLastFailedFile(null);
    setIsAnalyzing(false);

    try {
      const audioBlob = createSyntheticAudioBuffer(sample.data.words, sample.duration);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (err) {
      console.warn('Synthetic audio creation warning:', err);
    }
  }, [audioUrl]);

  const addLiveLog = (text: string) => {
    const now = new Date();
    const timeStr = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(Math.floor(now.getMilliseconds() / 100))}`;
    setLiveState((prev) => ({
      ...prev,
      logs: [...prev.logs, { time: timeStr, text }].slice(-20),
    }));
  };

  /**
   * High-Performance Cloud AI Audio Ingestion Handler
   */
  const handleAnalyzeAudio = async (
    fileOrBlob: File | Blob,
    uploadedFilename: string,
    mimeType: string,
    threshold: number,
    mode: 'auto' | 'manual' = languageMode,
    targetLang: string = selectedLanguage,
    lyricsText: string = ''
  ) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setIsPlaying(false);
    setLastFailedFile({ file: fileOrBlob, filename: uploadedFilename, mimeType });

    const startTime = Date.now();

    setLiveState({
      isActive: true,
      currentChunk: 1,
      totalChunks: 1,
      currentStep: 'Decoding audio stream into acoustic buffer...',
      progressPercent: 10,
      extractedWordsCount: 0,
      extractedParagraphsCount: 0,
      streamedWords: [],
      detectedLanguages: mode === 'manual' && targetLang ? [targetLang] : [],
      currentSongPart: 'Verse',
      elapsedSeconds: 0,
      estimatedWpm: 0,
      logs: [{
        time: '00:00.0',
        text: `[Cloud AI Pipeline] Initiating fast parallel ingestion for ${uploadedFilename} [${mode === 'auto' ? 'Universal Auto' : targetLang.toUpperCase()}]`
      }],
    });

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLiveState((prev) => ({
        ...prev,
        elapsedSeconds: Number(((Date.now() - startTime) / 1000).toFixed(1)),
      }));
    }, 100);

    try {
      // Create local object URL for preview player
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const arrayBuffer = await fileOrBlob.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: fileOrBlob.type });
      const localUrl = URL.createObjectURL(blob);
      setAudioUrl(localUrl);
      setFilename(uploadedFilename);

      // Measure audio duration in browser
      const tempAudio = new Audio(localUrl);
      tempAudio.onloadedmetadata = () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration)) {
          setDuration(tempAudio.duration);
        }
      };
      tempAudio.onerror = () => {
        console.warn('Browser failed to load temp audio for duration measurement.');
      };

      const cleanMime = (fileOrBlob.type && fileOrBlob.type.startsWith('audio/'))
        ? fileOrBlob.type.split(';')[0].trim()
        : uploadedFilename.endsWith('.mp3') ? 'audio/mp3'
        : uploadedFilename.endsWith('.m4a') ? 'audio/m4a'
        : uploadedFilename.endsWith('.ogg') ? 'audio/ogg'
        : uploadedFilename.endsWith('.flac') ? 'audio/flac'
        : 'audio/wav';

      addLiveLog('Optimizing waveform: resampling to 16kHz mono PCM...');

      // Chunk audio (slices songs into continuous ~20-60s chunks)
      const { chunks, totalDuration: decodedDuration } = await optimizeAndChunkAudio(
        fileOrBlob,
        config.audioBufferDuration || 20,
        (msg, percent) => {
          setLiveState((prev) => ({
            ...prev,
            currentStep: msg,
            progressPercent: percent || prev.progressPercent,
          }));
          addLiveLog(msg);
        }
      );

      if (decodedDuration > 0) {
        setDuration(decodedDuration);
      }

      const totalChunks = chunks.length;
      addLiveLog(`Prepared ${totalChunks} acoustic chunk${totalChunks > 1 ? 's' : ''} for parallel alignment`);

    // Request notification permission and send initial status
    requestNotificationPermission().then(granted => {
      if (granted) {
        sendProgressNotification(20, 'Preparing audio chunks...', uploadedFilename);
      }
    });

      setLiveState((prev) => ({
        ...prev,
        totalChunks,
        progressPercent: 20,
      }));

      // Array to store chunk results in indexed order
      const chunkResults: (any | null)[] = new Array(totalChunks).fill(null);
      const detectedLanguagesSet = new Set<string>();
      const detectedAgentsMap = new Map<string, any>();
      detectedAgentsMap.set('v1', { id: 'v1', name: 'Lead Vocalist', type: 'person', role: 'lead' });

      if (mode === 'manual' && targetLang) {
        detectedLanguagesSet.add(targetLang);
      }

      let completedChunksCount = 0;
      let totalLiveWords = 0;
      let totalLiveParagraphs = 0;
      let latestStreamedWords: WordTiming[] = [];
      let latestSongPart = 'Verse';
      let derivedTitle = uploadedFilename.replace(/\.[^/.]+$/, '');
      let primaryTrackLanguage = mode === 'manual' && targetLang ? targetLang : 'en';

      /**
       * Execute a single chunk analysis request with safe error recovery
       */
      const processSingleChunk = async (chunk: AudioChunk, index: number) => {
        addLiveLog(`Sending Chunk ${index + 1}/${totalChunks} (${chunk.startTime.toFixed(1)}s - ${chunk.endTime.toFixed(1)}s)...`);

        const chunkMime = chunk.isOptimized ? 'audio/wav' : cleanMime;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout for mobile network stability

        let chunkData: any = null;

        try {
          const response = await fetch(`${API_BASE_URL}/api/analyze-chunk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              audioBase64: chunk.base64,
              mimeType: chunkMime,
              chunkIndex: index,
              totalChunks,
              timeOffset: chunk.startTime,
              startWordIndex: 1, // Will be unified during zero-loss stitching
              startParaIndex: 1,
              titleHint: uploadedFilename,
              languageMode: mode,
              selectedLanguage: targetLang,
              lyricsText,
            }),
          });

          clearTimeout(timeoutId);
          const rawText = await response.text();
          
          try {
            chunkData = rawText ? JSON.parse(rawText) : {};
          } catch (parseErr) {
            console.error(`[Chunk Parse Failure] Raw response for Chunk ${index + 1}:`, rawText);
            if (!response.ok) {
              throw new Error(`Chunk ${index + 1} analysis failed (HTTP ${response.status}): ${rawText.substring(0, 100)}`);
            }
            throw new Error(`Unable to parse response from server for Chunk ${index + 1}. Check console for raw text.`);
          }

          if (!response.ok) {
            throw new Error(chunkData.error || `Chunk ${index + 1} analysis failed (HTTP ${response.status})`);
          }

          chunkResults[index] = chunkData;
          completedChunksCount++;
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            throw new Error(`Chunk ${index + 1} analysis timed out. Please check your network stability.`);
          }
          throw err;
        }

        if (!chunkData) return;

        // Yield to main thread to prevent UI freezing
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Live stats computation
        if (chunkData.title && !derivedTitle) {
          derivedTitle = chunkData.title;
        }
        if (chunkData.primaryLanguage && (index === 0 || primaryTrackLanguage === 'en')) {
          primaryTrackLanguage = chunkData.primaryLanguage;
        }
        if (Array.isArray(chunkData.detectedLanguages)) {
          chunkData.detectedLanguages.forEach((l: string) => detectedLanguagesSet.add(l));
        }
        if (Array.isArray(chunkData.agents)) {
          chunkData.agents.forEach((ag: any) => {
            if (ag && ag.id) detectedAgentsMap.set(ag.id, ag);
          });
        }

        const chunkParas: ParagraphSegment[] = chunkData.paragraphs || [];
        const chunkWordsCount = chunkParas.reduce((acc, p) => acc + (p.words?.length || 0), 0);
        totalLiveWords += chunkWordsCount;
        totalLiveParagraphs += chunkParas.length;

        const lastPara = chunkParas[chunkParas.length - 1];
        if (lastPara?.songPart) {
          latestSongPart = lastPara.songPart;
        }

        // Collect latest words for live visual token stream
        const currentExtractedWords: WordTiming[] = [];
        chunkParas.forEach((p) => {
          if (p.words) currentExtractedWords.push(...p.words);
        });
        latestStreamedWords = [...latestStreamedWords, ...currentExtractedWords].slice(-25);

        const elapsedMin = (Date.now() - startTime) / 60000;
        const liveWpm = elapsedMin > 0 ? Math.round(totalLiveWords / elapsedMin) : 0;

        const progressPercent = 20 + Math.floor((completedChunksCount / totalChunks) * 75);

        setLiveState((prev) => ({
          ...prev,
          currentChunk: completedChunksCount,
          currentStep: `Processed Chunk ${completedChunksCount}/${totalChunks} (+${chunkWordsCount} words) [${latestSongPart}]`,
          progressPercent,
          extractedWordsCount: totalLiveWords,
          extractedParagraphsCount: totalLiveParagraphs,
          streamedWords: latestStreamedWords,
          detectedLanguages: Array.from(detectedLanguagesSet),
          currentSongPart: latestSongPart,
          estimatedWpm: liveWpm,
        }));

        sendProgressNotification(
          progressPercent, 
          `Processed ${completedChunksCount}/${totalChunks} chunks [${latestSongPart}]`,
          uploadedFilename
        );

        addLiveLog(`Chunk ${index + 1} aligned: +${chunkWordsCount} words, +${chunkParas.length} lines [${latestSongPart}]`);
      };

      // Parallel chunk execution with concurrency limit = 2 for ultra-fast processing without API contention
      const concurrency = Math.min(2, totalChunks);
      const queue = chunks.map((c, i) => ({ chunk: c, index: i }));
      let queueIdx = 0;

      const worker = async () => {
        while (queueIdx < queue.length) {
          const item = queue[queueIdx++];
          await processSingleChunk(item.chunk, item.index);
        }
      };

      const workers = Array.from({ length: concurrency }, () => worker());
      await Promise.all(workers);

      setLiveState((prev) => ({
        ...prev,
        currentStep: 'Performing zero-loss word boundary stitching & Apple Music TTML synchronization...',
        progressPercent: 95,
      }));
      sendProgressNotification(95, 'Synchronizing word boundaries...', uploadedFilename);
      addLiveLog('Zero-loss stitching: unifying micro-timestamps, pause gaps, and song parts...');

      // ZERO-LOSS WORD MERGING: Cleanly stitch all chunks in canonical order
      const stitchedParagraphs: ParagraphSegment[] = [];
      const stitchedWords: WordTiming[] = [];
      let globalWordIndex = 1;
      let globalParaIndex = 1;

      for (let i = 0; i < totalChunks; i++) {
        const chunkData = chunkResults[i];
        if (!chunkData) continue;

        // Yield to main thread periodically
        if (i % 2 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        const chunkParas: ParagraphSegment[] = chunkData.paragraphs || [];

    for (const p of chunkParas) {
          const pId = `p${globalParaIndex++}`;
          const rawWords = p.words || [];
          const unifiedWords: WordTiming[] = [];
          const pIsBg = Boolean(p.isBackground || p.role === 'harmony' || p.role === 'background');
          const pAgentId = p.agentId || (pIsBg ? 'v_bg' : 'v1');

          for (const w of rawWords) {
            const rawWordStr = String(w.word || '').trim();
            const subTokens = separateGluedWords(rawWordStr);
            const wStart = Number((Number(w.start) || 0).toFixed(4));
            const wEnd = Number((Number(w.end) || wStart + 0.3).toFixed(4));
            
            // Proportional distribution for sub-tokens with high-precision micro-offsets
            const totalSpan = Math.max(0.04 * subTokens.length, wEnd - wStart);
            const wIsBg = w.isBackground ?? pIsBg;
            const wAgent = w.agentId || pAgentId;

            if (subTokens.length > 1) {
              const totalChars = subTokens.reduce((sum, token) => sum + Math.max(1, token.length), 0);
              let runningStart = wStart;

              subTokens.forEach((token, subIdx) => {
                const charRatio = Math.max(1, token.length) / totalChars;
                const subDuration = Number(Math.max(0.02, totalSpan * charRatio).toFixed(4));
                const subEnd = subIdx === subTokens.length - 1 ? wEnd : Number((runningStart + subDuration).toFixed(4));
                const subId = `w${globalWordIndex++}`;

                const wordObj: WordTiming = {
                  id: subId,
                  word: token,
                  start: Number(runningStart.toFixed(4)),
                  end: Number(subEnd.toFixed(4)),
                  duration: Number(Math.max(0.01, subEnd - runningStart).toFixed(4)),
                  pauseAfter: subIdx === subTokens.length - 1 ? Number((w.pauseAfter || 0).toFixed(4)) : 0,
                  pauseType: subIdx === subTokens.length - 1 ? w.pauseType || 'none' : 'none',
                  confidence: Number((w.confidence ?? 0.95).toFixed(2)),
                  lang: w.lang || (p.lang !== primaryTrackLanguage ? p.lang : undefined),
                  agentId: wAgent,
                  role: w.role || p.role,
                  isBackground: wIsBg,
                };

                unifiedWords.push(wordObj);
                stitchedWords.push(wordObj);
                runningStart = subEnd;
              });
            } else {
              const wId = `w${globalWordIndex++}`;
              const wordObj: WordTiming = {
                id: wId,
                word: subTokens[0] || rawWordStr,
                start: wStart,
                end: wEnd,
                duration: Number(Math.max(0.01, wEnd - wStart).toFixed(4)),
                pauseAfter: Number((w.pauseAfter || 0).toFixed(4)),
                pauseType: w.pauseType || 'none',
                confidence: Number((w.confidence ?? 0.95).toFixed(2)),
                lang: w.lang || (p.lang !== primaryTrackLanguage ? p.lang : undefined),
                agentId: wAgent,
                role: w.role || p.role,
                isBackground: wIsBg,
              };

              unifiedWords.push(wordObj);
              stitchedWords.push(wordObj);
            }
          }

          const lineText = unifiedWords.map((w) => w.word.trim()).join(' ').replace(/\s+/g, ' ').trim();

          stitchedParagraphs.push({
            id: pId,
            text: lineText || p.text || '',
            start: unifiedWords[0]?.start ?? p.start,
            end: unifiedWords[unifiedWords.length - 1]?.end ?? p.end,
            lang: p.lang || primaryTrackLanguage,
            songPart: p.songPart,
            agentId: pAgentId,
            role: p.role,
            isBackground: pIsBg,
            words: unifiedWords,
          });
        }
      }

      // Strictly recalibrate all word micro-timestamps against total decoded duration
      const recalibratedWords = recalibrateWordTimestamps(stitchedWords, decodedDuration);
      // Map recalibrated words back into their paragraphs
      const wordMap = new Map(recalibratedWords.map((w) => [w.id, w]));
      stitchedParagraphs.forEach((p) => {
        p.words = p.words.map((w) => (wordMap.get(w.id) as WordTiming) || w);
        if (p.words.length > 0) {
          p.start = p.words[0].start;
          p.end = p.words[p.words.length - 1].end;
        }
      });

      // Compute precise inter-word acoustic pauses across the entire stitched timeline
      const pauseEvents: PauseEvent[] = [];
      let totalSpeechDuration = 0;
      let totalPauseDuration = 0;
      let longestPause = 0;
      let maxEnd = decodedDuration || 0;

      stitchedWords.forEach((w) => {
        totalSpeechDuration += w.duration;
        if (w.end > maxEnd) maxEnd = w.end;
      });

      for (let i = 0; i < stitchedWords.length - 1; i++) {
        const current = stitchedWords[i];
        const next = stitchedWords[i + 1];
        const gap = Number((next.start - current.end).toFixed(3));

        if (gap >= threshold) {
          totalPauseDuration += gap;
          if (gap > longestPause) longestPause = gap;

          pauseEvents.push({
            id: `pause_${i + 1}`,
            start: current.end,
            end: next.start,
            duration: gap,
            prevWord: current.word,
            nextWord: next.word,
            type: gap > 0.6 ? 'sentence-break' : gap > 0.3 ? 'syntactic' : 'breath',
          });

          current.pauseAfter = gap;
          current.pauseType = gap > 0.6 ? 'sentence' : gap > 0.3 ? 'syntactic' : 'short';
        } else if (gap > 0.04) {
          current.pauseAfter = gap;
          current.pauseType = 'short';
        }
      }

      const totalDurationSec = Math.max(decodedDuration || 0, maxEnd || 1);
      const totalWords = stitchedWords.length;
      const wordsPerMinute = totalDurationSec > 0 ? Math.round((totalWords / totalDurationSec) * 60) : 0;
      const averageWordDuration = totalWords > 0 ? totalSpeechDuration / totalWords : 0;
      const detectedLanguagesList = Array.from(detectedLanguagesSet);
      const speechToSilenceRatio = totalPauseDuration > 0
        ? Number((totalSpeechDuration / totalPauseDuration).toFixed(2))
        : Number(totalSpeechDuration.toFixed(2));

      const finalResult: AudioAnalysisResult = {
        title: derivedTitle || uploadedFilename.replace(/\.[^/.]+$/, ''),
        words: stitchedWords,
        pauses: pauseEvents,
        paragraphs: stitchedParagraphs,
        duration: totalDurationSec,
        language: primaryTrackLanguage,
        detectedLanguages: detectedLanguagesList,
        isCodeSwitched: detectedLanguagesList.length > 1,
        rawTranscript: stitchedParagraphs.map((p) => p.text).join('\n'),
        stats: {
          totalWords,
          wordsPerMinute,
          averageWordDuration,
          totalPauseDuration,
          pauseCount: pauseEvents.length,
          longestPause,
          totalSpeechDuration,
          speechToSilenceRatio,
          detectedLanguagesCount: detectedLanguagesList.length,
        },
      };

      setAnalysisResult(finalResult);
      saveToHistory(uploadedFilename, finalResult);
      setDuration(totalDurationSec);
      setConfig((prev) => ({
        ...prev,
        title: derivedTitle || uploadedFilename.replace(/\.[^/.]+$/, ''),
        language: primaryTrackLanguage,
        agents: Array.from(detectedAgentsMap.values()),
      }));

      setLiveState((prev) => ({
        ...prev,
        currentStep: `Zero-loss analysis completed: ${totalWords} words aligned across ${stitchedParagraphs.length} lines.`,
        progressPercent: 100,
        extractedWordsCount: totalWords,
        extractedParagraphsCount: stitchedParagraphs.length,
        detectedLanguages: detectedLanguagesList,
      }));
      addLiveLog(`Analysis complete! Successfully synchronized ${totalWords} words with micro-precision.`);
      sendCompletionNotification(uploadedFilename);

      setTimeout(() => {
        setIsAnalyzing(false);
      }, 700);
    } catch (err: any) {
      console.error('[TTML Alignment Error]', err?.message || err);
      const msg = err.message || 'An unexpected error occurred during phonetic analysis.';
      setErrorMessage(msg);
      sendErrorNotification(msg, `Extraction Failed: ${uploadedFilename}`);
      addLiveLog(`Error: ${msg}`);
      setIsAnalyzing(false);
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleUpdateWord = (wordId: string, updatedFields: Partial<WordTiming>) => {
    if (!analysisResult) return;

    const updatedWords = analysisResult.words.map((w) => {
      if (w.id === wordId) {
        return { ...w, ...updatedFields };
      }
      return w;
    });

    const updatedParagraphs = analysisResult.paragraphs.map((p) => {
      const pWords = p.words.map((w) => {
        if (w.id === wordId) {
          return { ...w, ...updatedFields };
        }
        return w;
      });

      return {
        ...p,
        start: pWords[0]?.start ?? p.start,
        end: pWords[pWords.length - 1]?.end ?? p.end,
        text: pWords.map((w) => w.word.trim()).join(' ').replace(/\s+/g, ' ').trim(),
        words: pWords,
      };
    });

    const updatedStats = calculateTimingStats(updatedWords, analysisResult.pauses);

    setAnalysisResult({
      ...analysisResult,
      words: updatedWords,
      paragraphs: updatedParagraphs,
      stats: updatedStats,
    });
  };

  const activeWordId = useMemo(() => {
    if (!analysisResult || !analysisResult.words.length) return null;
    
    // Find the word whose range [start, end] contains the currentTime
    // Strict boundary: active exactly from start to end
    const activeWord = analysisResult.words.find(
      (w) => currentTime >= w.start && currentTime < w.end
    );
    
    return activeWord ? activeWord.id : null;
  }, [analysisResult, currentTime]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden box-border bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Universal Navigation Header with UI Language Switcher & Tab Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onLoadSample={(sId) => {
          loadSampleDataset(sId);
          setCurrentTab('editor');
        }}
        onOpenInfo={() => setIsInfoOpen(true)}
        hasData={Boolean(analysisResult)}
        onReset={() => {
          setAnalysisResult(null);
          setAudioUrl(null);
          setCurrentTime(0);
          setIsPlaying(false);
          setErrorMessage(null);
          setCurrentTab('hub');
        }}
        uiLanguage={uiLanguage}
        setUiLanguage={setUiLanguage}
        onSelectUILanguage={setUiLanguage}
        isCodeSwitched={analysisResult?.isCodeSwitched}
        detectedLanguages={analysisResult?.detectedLanguages}
        primaryLanguage={analysisResult?.language}
      />

      <NavigationDock
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        uiLanguage={uiLanguage}
        hasData={Boolean(analysisResult)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-32 space-y-6 box-border overflow-x-hidden">
        {/* Error Notification Banner with Instant Retry */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-rose-300 block sm:inline mr-2">
                  Acoustic Processing Notice:
                </strong>
                <span>{errorMessage}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {lastFailedFile && (
                <button
                  onClick={() =>
                    handleAnalyzeAudio(
                      lastFailedFile.file,
                      lastFailedFile.filename,
                      lastFailedFile.mimeType,
                      pauseThreshold,
                      languageMode,
                      selectedLanguage,
                      ''
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Analysis
                </button>
              )}
              <button
                onClick={() => {
                  loadSampleDataset('japanese-english-song');
                  setCurrentTab('editor');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer border border-slate-700"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Load Multilingual Demo
              </button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="analyzer"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <LiveAudioAnalyzer state={liveState} filename={filename} uiLanguage={uiLanguage} />
            </motion.div>
          ) : currentTab === 'hub' ? (
            <motion.div
              key="hub"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <MainHub
                onAnalyzeAudio={handleAnalyzeAudio}
                onSelectSample={(sId) => {
                  loadSampleDataset(sId);
                  setCurrentTab('editor');
                }}
                onOpenHistoryItem={(item) => {
                  setAnalysisResult(item.data);
                  setFilename(item.filename);
                  setDuration(item.data.duration);
                  setConfig((prev) => ({
                    ...prev,
                    title: item.data.title || item.filename,
                  }));
                  setCurrentTab('editor');
                }}
                onNavigateToTab={setCurrentTab}
                uiLanguage={uiLanguage}
              />
            </motion.div>
          ) : currentTab === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <StorageManager
                onSelectSong={(item) => {
                  setAnalysisResult(item.data);
                  setFilename(item.filename);
                  setDuration(item.data.duration);
                  setConfig((prev) => ({
                    ...prev,
                    title: item.data.title || item.filename,
                  }));
                  setCurrentTab('editor');
                }}
                uiLanguage={uiLanguage}
              />
            </motion.div>
          ) : currentTab === 'settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <SettingsSection
                uiLanguage={uiLanguage}
                setUiLanguage={setUiLanguage}
                config={config}
                setConfig={setConfig}
              />
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {analysisResult ? (
                <>
                  {/* Sleek Active Track Header */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                          <span className="uppercase text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-white/10">
                            {analysisResult.language}
                          </span>
                          <span>&bull;</span>
                          <span>{analysisResult.stats.totalWords} synced words</span>
                          <span>&bull;</span>
                          <span>{analysisResult.paragraphs.length} lines</span>
                        </div>
                        <h2 className="text-base font-bold text-slate-100 truncate max-w-md">
                          {analysisResult.title || filename}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => setCurrentTab('hub')}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Import Another Song</span>
                      </button>
                    </div>
                  </div>

                  {/* Audio Waveform & Player */}
                  <AudioPlayerWaveform
                    audioUrl={audioUrl}
                    duration={duration || analysisResult.duration}
                    currentTime={currentTime}
                    setCurrentTime={setCurrentTime}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    words={analysisResult.words}
                    pauses={analysisResult.pauses}
                    activeWordId={activeWordId}
                    uiLanguage={uiLanguage}
                    config={config}
                  />

                  {/* Single Column Code Viewer (Subtitle Preview Removed) */}
                  <div className="w-full">
                    <TTMLCodeViewer
                      paragraphs={analysisResult.paragraphs}
                      config={config}
                      setConfig={setConfig}
                      filename={filename}
                      duration={duration || analysisResult.duration}
                      detectedLanguages={analysisResult.detectedLanguages}
                      uiLanguage={uiLanguage}
                    />
                  </div>
                </>
              ) : (
                /* Empty Studio State */
                <div className="p-8 sm:p-12 rounded-3xl glass-card border border-white/10 text-center space-y-6 max-w-2xl mx-auto my-8 shadow-2xl bg-slate-900/60 backdrop-blur-xl">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                    <Sparkles className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100">
                      No Track Loaded in Karaoke Studio
                    </h2>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                      Upload a local audio file or choose an instant sample preset in the Main Hub to start editing micro-timestamps and singing karaoke.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('hub')}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-xl shadow-cyan-500/20 inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Go to Main Hub to Load Track</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}
