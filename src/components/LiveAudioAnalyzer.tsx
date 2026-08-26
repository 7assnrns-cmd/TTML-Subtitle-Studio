import React, { useEffect, useState, useRef } from 'react';
import {
  Activity,
  Sparkles,
  Layers,
  Globe2,
  FileCode2,
  Clock,
  Radio,
  Music2,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { WordTiming } from '../types';
import { UILanguage, getTranslation } from '../utils/i18n';

export interface LiveAnalysisState {
  isActive: boolean;
  currentChunk: number;
  totalChunks: number;
  currentStep: string;
  progressPercent: number;
  extractedWordsCount: number;
  extractedParagraphsCount: number;
  streamedWords: WordTiming[];
  detectedLanguages: string[];
  currentSongPart?: string;
  elapsedSeconds: number;
  estimatedWpm: number;
  logs: { time: string; text: string }[];
}

interface LiveAudioAnalyzerProps {
  state: LiveAnalysisState;
  filename: string;
  uiLanguage: UILanguage;
}

export const LiveAudioAnalyzer: React.FC<LiveAudioAnalyzerProps> = ({
  state,
  filename,
  uiLanguage,
}) => {
  const [tickerOffset, setTickerOffset] = useState(0);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const t = (key: string) => getTranslation(uiLanguage, key);

  // Auto-scroll streamed words container to keep latest token visible
  useEffect(() => {
    if (wordsContainerRef.current) {
      wordsContainerRef.current.scrollTop = wordsContainerRef.current.scrollHeight;
    }
  }, [state.streamedWords]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [state.logs]);

  // Subtle animated waveform bars
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerOffset((prev) => (prev + 1) % 100);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-indigo-950/50 space-y-5 animate-in fade-in zoom-in-95 duration-300">
      {/* Header bar with Live Pulse & Chunk status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white tracking-wide flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                {t('realtimeAnalyzer')}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {t('livePhoneticScan')}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
              {t('analyzingFile')} <span className="text-slate-200 font-medium">{filename}</span> {t('withEngine')}
            </p>
          </div>
        </div>

        {/* Chunk & Time Tracker */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('chunkProgress')} {state.currentChunk} {t('of')} {state.totalChunks}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{state.elapsedSeconds.toFixed(1)}s {t('elapsed')}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Current Operation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            {state.currentStep || 'Processing acoustic waveform...'}
          </span>
          <span className="font-mono text-cyan-400 font-bold">{Math.round(state.progressPercent)}%</span>
        </div>
        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-cyan-500/50"
            style={{ width: `${Math.max(5, Math.min(100, state.progressPercent))}%` }}
          />
        </div>
      </div>

      {/* Live Metric Tickers Grid (Feature 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Word Counter */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            {t('extractedWords')}
          </span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight text-amber-300">
              {state.extractedWordsCount}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{t('tokens')}</span>
          </div>
        </div>

        {/* Song Parts */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Music2 className="w-3 h-3 text-indigo-400" />
            {t('activeSongPart')}
          </span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-base sm:text-lg font-bold text-indigo-300 font-mono truncate">
              {state.currentSongPart || 'Verse'}
            </span>
          </div>
        </div>

        {/* Multilingual / Code-Switching */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Globe2 className="w-3 h-3 text-emerald-400" />
            {t('detectedLangs')}
          </span>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {state.detectedLanguages.length > 0 ? (
              state.detectedLanguages.map((l) => (
                <span
                  key={l}
                  className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase"
                >
                  {l}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 font-mono">Analyzing...</span>
            )}
          </div>
        </div>

        {/* Processing Cadence / Words Per Min */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            {t('liveWpm')}
          </span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono tracking-tight">
              {state.estimatedWpm}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">WPM</span>
          </div>
        </div>
      </div>

      {/* Real-time Streamed Word-level Tokens & Live Pipeline Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Streamed Word Bubbles */}
        <div className="lg:col-span-2 bg-slate-950/90 border border-slate-800/90 rounded-xl p-4 flex flex-col h-48">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
              {t('phoneticStream')}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {state.streamedWords.length} in buffer
            </span>
          </div>

          <div
            ref={wordsContainerRef}
            className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs"
          >
            {state.streamedWords.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs text-center italic">
                {t('waitingTokens')}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 items-center content-start">
                {state.streamedWords.map((w, idx) => (
                  <div
                    key={`${w.id || idx}_${w.start}`}
                    className="group relative inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-200 transition-all text-xs"
                  >
                    <span className="font-bold text-cyan-300">{w.word}</span>
                    <span className="text-[9px] text-slate-500 group-hover:text-slate-400">
                      {w.start.toFixed(2)}s
                    </span>
                    {w.lang && (
                      <span className="text-[8px] uppercase px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                        {w.lang}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Terminal Stream Logs */}
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-4 flex flex-col h-48">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              {t('systemLog')}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div
            ref={logsContainerRef}
            className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] text-slate-400"
          >
            {state.logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-600 shrink-0 text-[10px]">[{log.time}]</span>
                <span className="text-slate-300">{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
