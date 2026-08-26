import React, { useState } from 'react';
import { Tv, Sparkles, Volume2, Clock, PlayCircle, Eye, Languages } from 'lucide-react';
import { ParagraphSegment, TTMLConfig, WordTiming } from '../types';
import { UILanguage, getTranslation } from '../utils/i18n';

interface SubtitleKaraokePreviewProps {
  paragraphs: ParagraphSegment[];
  currentTime: number;
  onSeekToTime: (time: number) => void;
  config: TTMLConfig;
  activeWordId: string | null;
  uiLanguage: UILanguage;
}

export const SubtitleKaraokePreview: React.FC<SubtitleKaraokePreviewProps> = ({
  paragraphs,
  currentTime,
  onSeekToTime,
  config,
  activeWordId,
  uiLanguage,
}) => {
  const [viewMode, setViewMode] = useState<'screen' | 'flow'>('screen');
  const t = (key: string) => getTranslation(uiLanguage, key);

  // Find active paragraph for screen view
  const currentParagraph = paragraphs.find(
    (p) => currentTime >= p.start && currentTime <= (p.end + 0.3)
  );

  // Check if currently in a pause gap
  let currentPauseInfo: { duration: number; prevWord: string; nextWord: string } | null = null;
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    for (let j = 0; j < p.words.length - 1; j++) {
      const w1 = p.words[j];
      const w2 = p.words[j + 1];
      if (currentTime >= w1.end && currentTime < w2.start && (w2.start - w1.end) > 0.08) {
        currentPauseInfo = {
          duration: w2.start - w1.end,
          prevWord: w1.word,
          nextWord: w2.word,
        };
        break;
      }
    }
  }

  const isRtl = (text?: string, lang?: string) => {
    if (lang === 'ar' || lang === 'he' || lang === 'fa' || lang === 'ur') return true;
    if (!text) return false;
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
      {/* Header with view toggles */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-200">
            {t('karaokePreview')}
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('screen')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              viewMode === 'screen' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Video Subtitle Screen
          </button>
          <button
            onClick={() => setViewMode('flow')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              viewMode === 'flow' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Full Dialogue Transcript
          </button>
        </div>
      </div>

      {viewMode === 'screen' ? (
        /* Video Cinema Stage Subtitle Preview */
        <div className="relative w-full aspect-video min-h-[220px] max-h-[300px] rounded-xl bg-gradient-to-b from-slate-950 via-slate-900 to-black border border-slate-800 flex flex-col justify-between p-6 overflow-hidden shadow-2xl">
          {/* Subtle stage ambient glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/15 via-transparent to-transparent pointer-events-none" />

          {/* Top Status Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 z-10">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {currentTime.toFixed(2)}s
            </span>

            {currentPauseInfo ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Acoustic Pause Gap: {currentPauseInfo.duration.toFixed(2)}s
              </span>
            ) : activeWordId ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live Word Sync
              </span>
            ) : (
              <span className="text-[10px] text-slate-600 font-mono">Idle / Intermission</span>
            )}
          </div>

          {/* Subtitle Display Region (Aligned to bottom center / W3C TTML style) */}
          <div className="w-full flex justify-center items-end pb-3 z-10">
            {currentParagraph ? (
              <div
                dir={isRtl(currentParagraph.text, currentParagraph.lang) ? 'rtl' : 'ltr'}
                className="max-w-[92%] px-4 py-2.5 rounded-lg text-center leading-relaxed transition-all shadow-xl bg-slate-950/80 border border-slate-800"
              >
                <p className="text-base sm:text-lg font-medium text-slate-200 flex flex-wrap justify-center items-center gap-y-1">
                  {currentParagraph.words.map((w: WordTiming) => {
                    const isWordActive = w.id === activeWordId;
                    const isWordPast = currentTime > w.end;

                    return (
                      <span
                        key={w.id}
                        onClick={() => onSeekToTime(w.start)}
                        className={`inline-flex items-center mx-1.5 cursor-pointer transition-all duration-150 px-1.5 py-0.5 rounded relative group ${
                          isWordActive
                            ? 'text-cyan-300 font-bold bg-cyan-500/25 scale-110 shadow-md ring-1 ring-cyan-400/50'
                            : isWordPast
                            ? 'text-slate-100'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={`[${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s] ${w.lang ? `(${w.lang.toUpperCase()}) ` : ''}Pause after: ${w.pauseAfter}s - Click to seek`}
                      >
                        <span>{w.word}</span>
                        {w.lang && w.lang !== config.language && (
                          <span className="inline-block ml-1 text-[8px] px-1 py-0 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 align-top uppercase font-mono">
                            {w.lang}
                          </span>
                        )}
                        {w.pauseAfter > 0.25 && (
                          <span className="inline-block ml-1 text-[9px] px-1 py-0 rounded text-rose-300 bg-rose-950/60 border border-rose-800/40 align-middle">
                            {w.pauseAfter.toFixed(2)}s
                          </span>
                        )}
                      </span>
                    );
                  })}
                </p>
              </div>
            ) : (
              <div className="text-xs text-slate-600 italic">
                {t('waitingPlayback')}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full Dialogue Transcript View */
        <div className="w-full max-h-[300px] overflow-y-auto space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
          {paragraphs.map((p, pIdx) => {
            const isParaActive = currentTime >= p.start && currentTime <= p.end;
            const paraIsRtl = isRtl(p.text, p.lang);
            return (
              <div
                key={p.id}
                dir={paraIsRtl ? 'rtl' : 'ltr'}
                className={`p-3 rounded-lg border transition-colors ${
                  isParaActive
                    ? 'bg-indigo-950/40 border-indigo-500/40'
                    : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-indigo-300">Paragraph #{pIdx + 1}</span>
                    {p.songPart && (
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 text-[9px] font-bold">
                        {p.songPart}
                      </span>
                    )}
                    {p.lang && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 text-[9px] uppercase font-bold">
                        {p.lang}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onSeekToTime(p.start)}
                    className="flex items-center gap-1 text-slate-400 hover:text-indigo-300 hover:underline cursor-pointer"
                  >
                    <PlayCircle className="w-3 h-3" />
                    {p.start.toFixed(2)}s - {p.end.toFixed(2)}s
                  </button>
                </div>
                <div className="text-sm leading-relaxed flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  {p.words.map((w) => {
                    const isWordActive = w.id === activeWordId;
                    return (
                      <span
                        key={w.id}
                        onClick={() => onSeekToTime(w.start)}
                        className={`inline-flex items-center px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          isWordActive
                            ? 'bg-cyan-500/30 text-cyan-200 font-bold ring-1 ring-cyan-400/60'
                            : currentTime > w.end
                            ? 'text-slate-200 hover:bg-slate-800'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title={`Click to seek (${w.start.toFixed(2)}s)`}
                      >
                        <span>{w.word}</span>
                        {w.lang && w.lang !== config.language && (
                          <span className="inline-block ml-1 text-[8px] px-1 py-0 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 align-top uppercase font-mono">
                            {w.lang}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
