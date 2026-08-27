import React, { useState, useRef, useEffect } from 'react';
import { Tv, Sparkles, Volume2, Clock, PlayCircle, Eye, Languages, AlignLeft, MoveHorizontal, WrapText, Zap, Music2, Mic2 } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'karaoke' | 'screen' | 'flow'>('karaoke');
  const [displayLayout, setDisplayLayout] = useState<'marquee' | 'wrap'>('marquee');
  const marqueeContainerRef = useRef<HTMLDivElement | null>(null);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const activeKaraokeLineRef = useRef<HTMLDivElement | null>(null);
  const karaokeScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const t = (key: string) => getTranslation(uiLanguage, key);

  // Find active paragraph (with tight 0.20s anti-drift tolerance)
  const currentParagraph = paragraphs.find(
    (p) => currentTime >= p.start && currentTime <= (p.end + 0.20)
  );

  // Smooth auto-scroll active karaoke line into vertical center
  useEffect(() => {
    if (viewMode === 'karaoke' && activeKaraokeLineRef.current && karaokeScrollContainerRef.current) {
      const container = karaokeScrollContainerRef.current;
      const line = activeKaraokeLineRef.current;
      const targetY = line.offsetTop - (container.clientHeight / 2) + (line.clientHeight / 2);

      container.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth',
      });
    }
  }, [currentParagraph?.id, viewMode]);

  // Auto-scroll marquee to center active word dynamically
  useEffect(() => {
    if (viewMode === 'screen' && displayLayout === 'marquee' && marqueeContainerRef.current && activeWordRef.current) {
      const container = marqueeContainerRef.current;
      const wordElem = activeWordRef.current;
      const targetScroll = wordElem.offsetLeft - (container.clientWidth / 2) + (wordElem.clientWidth / 2);
      
      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [activeWordId, displayLayout, currentTime, viewMode]);

  // Check if currently in an acoustic pause gap
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

  const is120Hz = config.enable120HzMode ?? true;

  return (
    <div
      className={`relative overflow-hidden glass-card rounded-2xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] flex flex-col space-y-4 max-w-full box-border ${
        is120Hz ? 'high-refresh-120hz' : ''
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with view and layout toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200">
            {t('karaokePreview')}
          </h3>
          {is120Hz ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono flex items-center gap-1 shadow-sm">
              <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
              120Hz ProMotion
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-slate-400 font-mono">
              60Hz Standard
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'screen' && (
            <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setDisplayLayout('marquee')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer text-[11px] ${
                  displayLayout === 'marquee'
                    ? 'bg-indigo-600/90 text-white font-medium shadow-sm ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dynamic auto-centering marquee for long lines"
              >
                <MoveHorizontal className="w-3 h-3" />
                <span>Marquee Focus</span>
              </button>
              <button
                onClick={() => setDisplayLayout('wrap')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer text-[11px] ${
                  displayLayout === 'wrap'
                    ? 'bg-indigo-600/90 text-white font-medium shadow-sm ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dynamic fluid multi-line reflow"
              >
                <WrapText className="w-3 h-3" />
                <span>Fluid Reflow</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('karaoke')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'karaoke' ? 'bg-indigo-600 text-white font-medium shadow-sm ring-1 ring-white/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic2 className="w-3.5 h-3.5" />
              <span>Apple Music Style</span>
            </button>
            <button
              onClick={() => setViewMode('screen')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'screen' ? 'bg-indigo-600 text-white font-medium shadow-sm ring-1 ring-white/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cinema Stage
            </button>
            <button
              onClick={() => setViewMode('flow')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'flow' ? 'bg-indigo-600 text-white font-medium shadow-sm ring-1 ring-white/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dialogue Flow
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'karaoke' ? (
        /* Authentic Apple Music Karaoke UI with Word-by-Word Wipe and Vertical Flow */
        <div
          ref={karaokeScrollContainerRef}
          className="relative w-full h-[360px] rounded-2xl bg-gradient-to-b from-slate-950 via-[#070b14] to-black border border-white/10 overflow-y-auto no-scrollbar p-6 space-y-6 shadow-2xl backdrop-blur-2xl box-border scroll-smooth select-none"
        >
          {/* Subtle Top & Bottom Gradient Masks */}
          <div className="sticky -top-6 left-0 right-0 h-10 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none z-20" />

          {paragraphs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <Music2 className="w-8 h-8 opacity-40 animate-pulse" />
              <p className="text-sm italic">{t('waitingPlayback')}</p>
            </div>
          ) : (
            paragraphs.map((p, pIdx) => {
              const isLineActive = currentParagraph?.id === p.id;
              const isLinePast = currentTime > p.end;
              const isLineFuture = currentTime < p.start;
              const isBg = p.isBackground || p.agentId === 'v_bg';
              const isDuet = p.agentId === 'v2';

              return (
                <div
                  key={p.id}
                  ref={isLineActive ? activeKaraokeLineRef.current ? null : activeKaraokeLineRef : null}
                  onClick={() => onSeekToTime(p.start)}
                  dir={isRtl(p.text, p.lang) ? 'rtl' : 'ltr'}
                  className={`group cursor-pointer transition-all duration-300 transform rounded-2xl p-4 ${
                    isLineActive
                      ? 'scale-105 opacity-100 bg-white/[0.04] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
                      : isLinePast
                      ? 'opacity-70 blur-[0.2px] hover:opacity-90 hover:bg-white/[0.02]'
                      : 'opacity-35 blur-[0.6px] hover:opacity-60 hover:bg-white/[0.02]'
                  } ${
                    isDuet
                      ? 'text-right sm:text-right border-r-2 border-r-amber-500/40'
                      : isBg
                      ? 'text-center italic'
                      : 'text-left'
                  }`}
                >
                  {/* Song part & Singer Badges */}
                  <div className={`flex items-center gap-2 mb-2 ${isDuet ? 'justify-end' : isBg ? 'justify-center' : 'justify-start'}`}>
                    {p.songPart && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-600/80 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm border border-indigo-400/30">
                        {p.songPart}
                      </span>
                    )}
                    {p.agentId && p.agentId !== 'v1' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-600/90 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm border border-amber-400/30 font-mono">
                        {p.agentId}
                      </span>
                    )}
                    {isBg && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-600/90 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm border border-purple-400/30">
                        Backing Harmonies
                      </span>
                    )}
                  </div>

                  {/* Word-by-word Wipe Line */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 leading-snug">
                    {p.words.map((w: WordTiming) => {
                      // Calculate sub-millisecond word fill progress (0.0 to 1.0)
                      let progress = 0;
                      if (currentTime >= w.end) {
                        progress = 1;
                      } else if (currentTime <= w.start) {
                        progress = 0;
                      } else {
                        progress = Math.max(0, Math.min(1, (currentTime - w.start) / Math.max(0.001, w.end - w.start)));
                      }

                      const isWordActive = currentTime >= w.start && currentTime <= w.end;

                      return (
                        <span
                          key={w.id}
                          style={{
                            background: isLineActive
                              ? `linear-gradient(to right, #ffffff 0%, #ffffff ${progress * 100}%, rgba(255, 255, 255, 0.35) ${progress * 100}%, rgba(255, 255, 255, 0.35) 100%)`
                              : undefined,
                            WebkitBackgroundClip: isLineActive ? 'text' : undefined,
                            WebkitTextFillColor: isLineActive ? 'transparent' : undefined,
                          }}
                          className={`inline-block transition-all duration-75 select-none font-bold text-2xl sm:text-3xl tracking-tight ${
                            !isLineActive
                              ? isLinePast
                                ? 'text-slate-200'
                                : 'text-slate-500'
                              : isWordActive
                              ? '[text-shadow:0_0_12px_rgba(255,255,255,0.6)]'
                              : ''
                          }`}
                        >
                          {w.word}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          <div className="sticky -bottom-6 left-0 right-0 h-10 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
        </div>
      ) : viewMode === 'screen' ? (
        /* Video Cinema Stage Subtitle Preview */
        <div className="relative w-full aspect-video min-h-[240px] max-h-[320px] rounded-xl bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-black border border-white/10 flex flex-col justify-between p-6 overflow-hidden shadow-2xl backdrop-blur-2xl box-border">
          {/* Subtle stage ambient glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />

          {/* Top Status Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 z-10">
            <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTime.toFixed(2)}s</span>
            </div>

            {currentPauseInfo ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Acoustic Pause Gap: {currentPauseInfo.duration.toFixed(2)}s
              </span>
            ) : activeWordId ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Sub-Millisecond Sync
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono bg-slate-950/60 px-2 py-0.5 rounded-md border border-white/5">
                Awaiting Audio
              </span>
            )}
          </div>

          {/* Subtitle Display Region with Glassmorphism Float */}
          <div className="w-full flex justify-center items-end pb-2 z-10">
            {currentParagraph ? (
              <div
                dir={isRtl(currentParagraph.text, currentParagraph.lang) ? 'rtl' : 'ltr'}
                className={`w-full max-w-[96%] relative rounded-2xl p-4 text-center transition-all shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-xl border ${
                  currentParagraph.isBackground
                    ? 'bg-purple-950/60 border-purple-500/30'
                    : currentParagraph.agentId === 'v2'
                    ? 'bg-amber-950/60 border-amber-500/30'
                    : 'bg-slate-950/75 border-white/15'
                }`}
              >
                {/* Section and Agent Badges */}
                <div className="absolute -top-3 left-4 flex items-center gap-1.5">
                  {currentParagraph.songPart && (
                    <div className="px-2 py-0.5 rounded-md bg-indigo-600/90 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm border border-indigo-400/30">
                      {currentParagraph.songPart}
                    </div>
                  )}
                  {currentParagraph.agentId && currentParagraph.agentId !== 'v1' && (
                    <div className="px-2 py-0.5 rounded-md bg-amber-600/90 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm border border-amber-400/30 font-mono">
                      {currentParagraph.agentId}
                    </div>
                  )}
                  {currentParagraph.isBackground && (
                    <div className="px-2 py-0.5 rounded-md bg-purple-600/90 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm border border-purple-400/30">
                      Backing Harmonies
                    </div>
                  )}
                </div>

                {displayLayout === 'marquee' ? (
                  /* Marquee Single-Line Scroll View with Gradient Fade Masks */
                  <div
                    ref={marqueeContainerRef}
                    className="w-full overflow-x-auto no-scrollbar scroll-smooth py-1 px-4 flex items-center justify-start sm:justify-center whitespace-nowrap [mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%)]"
                  >
                    <div className="inline-flex items-center space-x-2 shrink-0">
                      {currentParagraph.words.map((w: WordTiming) => {
                        const isWordActive = w.id === activeWordId;
                        const isWordPast = currentTime > w.end;

                        return (
                          <span
                            key={w.id}
                            ref={isWordActive ? activeWordRef : null}
                            onClick={() => onSeekToTime(w.start)}
                            className={`inline cursor-pointer transition-colors duration-150 select-none ${
                              isWordActive
                                ? 'text-cyan-300 font-bold scale-105 drop-shadow-md'
                                : isWordPast
                                ? 'text-slate-100'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                            title={`[${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s] ${w.lang ? `(${w.lang.toUpperCase()}) ` : ''}Pause: ${w.pauseAfter}s - Click to seek`}
                          >
                            <span className="text-base sm:text-lg tracking-wide">{w.word}&nbsp;</span>
                            {w.lang && w.lang !== config.language && (
                              <span className="inline-block ml-0.5 text-[8px] px-1 py-0.2 rounded bg-indigo-900/90 text-indigo-200 border border-indigo-500/40 align-top uppercase font-mono">
                                {w.lang}
                              </span>
                            )}
                            {w.pauseAfter > 0.25 && (
                              <span className="inline-block ml-0.5 text-[9px] px-1 py-0.2 rounded text-rose-300 bg-rose-950/70 border border-rose-700/50 align-middle">
                                {w.pauseAfter.toFixed(2)}s
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Dynamic Multi-line Reflow with Proper Word Separation */
                  <div className="text-center py-1 leading-relaxed">
                    {currentParagraph.words.map((w: WordTiming) => {
                      const isWordActive = w.id === activeWordId;
                      const isWordPast = currentTime > w.end;

                      return (
                        <span
                          key={w.id}
                          onClick={() => onSeekToTime(w.start)}
                          className={`inline cursor-pointer transition-colors duration-100 select-none ${
                            isWordActive
                              ? 'text-cyan-300 font-bold drop-shadow-md'
                              : isWordPast
                              ? 'text-slate-100'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title={`[${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s] Click to seek`}
                        >
                          <span className="text-base sm:text-lg">{w.word}&nbsp;</span>
                          {w.lang && w.lang !== config.language && (
                            <span className="inline-block ml-0.5 text-[8px] px-1 py-0 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 align-top uppercase font-mono">
                              {w.lang}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
                {t('waitingPlayback')}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full Dialogue Transcript View with Frosted Glass Cards */
        <div className="w-full max-h-[360px] overflow-y-auto space-y-3 p-3 bg-slate-950/60 backdrop-blur-xl rounded-xl border border-white/10">
          {paragraphs.map((p, pIdx) => {
            const isParaActive = currentTime >= p.start && currentTime <= p.end;
            const paraIsRtl = isRtl(p.text, p.lang);
            return (
              <div
                key={p.id}
                dir={paraIsRtl ? 'rtl' : 'ltr'}
                className={`p-3.5 rounded-xl border transition-all ${
                  isParaActive
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-slate-900/40 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-indigo-300">Paragraph #{pIdx + 1}</span>
                    {p.songPart && (
                      <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 text-[9px] font-bold">
                        {p.songPart}
                      </span>
                    )}
                    {p.agentId && p.agentId !== 'v1' && (
                      <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/50 text-[9px] font-bold font-mono">
                        {p.agentId}
                      </span>
                    )}
                    {p.isBackground && (
                      <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700/50 text-[9px] font-bold">
                        Harmony
                      </span>
                    )}
                    {p.lang && (
                      <span className="px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 text-[9px] uppercase font-bold">
                        {p.lang}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onSeekToTime(p.start)}
                    className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 hover:underline cursor-pointer transition-colors"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    {p.start.toFixed(2)}s - {p.end.toFixed(2)}s
                  </button>
                </div>
                <div className="text-sm leading-relaxed">
                  {p.words.map((w) => {
                    const isWordActive = w.id === activeWordId;
                    return (
                      <span
                        key={w.id}
                        onClick={() => onSeekToTime(w.start)}
                        className={`inline cursor-pointer transition-colors ${
                          isWordActive
                            ? 'text-cyan-300 font-bold drop-shadow-sm'
                            : currentTime > w.end
                            ? 'text-slate-200'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={`Click to seek (${w.start.toFixed(2)}s)`}
                      >
                        <span>{w.word}&nbsp;</span>
                        {w.lang && w.lang !== config.language && (
                          <span className="inline-block ml-0.5 text-[8px] px-1 py-0 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 align-top uppercase font-mono">
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
