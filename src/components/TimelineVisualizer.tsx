import React, { useState, useMemo } from 'react';
import { Clock, Search, Filter, PlayCircle, PauseCircle, Edit3, Check, RotateCcw, AlertTriangle, Layers, Globe, X } from 'lucide-react';
import { WordTiming, PauseEvent, ParagraphSegment } from '../types';
import { UILanguage, getTranslation } from '../utils/i18n';

interface TimelineVisualizerProps {
  words: WordTiming[];
  pauses: PauseEvent[];
  paragraphs: ParagraphSegment[];
  duration: number;
  currentTime: number;
  activeWordId: string | null;
  onSeekToTime: (time: number) => void;
  onUpdateWord?: (wordId: string, updatedFields: Partial<WordTiming>) => void;
  uiLanguage: UILanguage;
}

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({
  words,
  pauses,
  paragraphs,
  duration,
  currentTime,
  activeWordId,
  onSeekToTime,
  onUpdateWord,
  uiLanguage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pauses' | 'codeswitch' | 'high-confidence'>('all');
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editWordText, setEditWordText] = useState('');
  const [editStartTime, setEditStartTime] = useState(0);
  const [editEndTime, setEditEndTime] = useState(0);

  const t = (key: string) => getTranslation(uiLanguage, key);

  const startEdit = (w: WordTiming) => {
    setEditingWordId(w.id);
    setEditWordText(w.word);
    setEditStartTime(w.start);
    setEditEndTime(w.end);
  };

  const cancelEdit = () => {
    setEditingWordId(null);
  };

  const saveEdit = (wordId: string) => {
    if (onUpdateWord) {
      const dur = Number((editEndTime - editStartTime).toFixed(3));
      onUpdateWord(wordId, {
        word: editWordText,
        start: editStartTime,
        end: editEndTime,
        duration: Math.max(0.01, dur),
      });
    }
    setEditingWordId(null);
  };

  // Count code-switched words
  const codeSwitchedCount = useMemo(() => {
    return words.filter((w) => Boolean(w.lang)).length;
  }, [words]);

  // Filtered words
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const matchesSearch = w.word.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterType === 'pauses') {
        return w.pauseAfter > 0.1;
      }
      if (filterType === 'codeswitch') {
        return Boolean(w.lang);
      }
      if (filterType === 'high-confidence') {
        return (w.confidence ?? 1) >= 0.95;
      }
      return true;
    });
  }, [words, searchQuery, filterType]);

  const getPauseBadge = (pauseAfter: number, pauseType?: string) => {
    if (pauseAfter < 0.08) return null;

    if (pauseAfter >= 0.6) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <PauseCircle className="w-3 h-3" />
          {pauseAfter.toFixed(2)}s (Sentence)
        </span>
      );
    }
    if (pauseAfter >= 0.25) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <PauseCircle className="w-3 h-3" />
          {pauseAfter.toFixed(2)}s (Syntactic)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-800 border border-slate-700">
        {pauseAfter.toFixed(2)}s (Breath)
      </span>
    );
  };

  return (
    <div className="relative overflow-hidden glass-panel rounded-2xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] flex flex-col space-y-4 max-w-full box-border">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/3 w-80 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Title & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 z-10 relative">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            {t('timelineTitle')}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('timelineSubtitle')} ({words.length} words, {pauses.length} natural silence gaps).
          </p>
        </div>

        {/* Search & Filter pills */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44"
            />
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-indigo-600 text-white font-medium shadow-sm ring-1 ring-white/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({words.length})
            </button>
            <button
              onClick={() => setFilterType('pauses')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterType === 'pauses' ? 'bg-indigo-600 text-white font-medium shadow-sm ring-1 ring-white/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              With Pauses ({pauses.length})
            </button>
            {codeSwitchedCount > 0 && (
              <button
                onClick={() => setFilterType('codeswitch')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  filterType === 'codeswitch' ? 'bg-purple-600 text-white font-medium shadow-sm ring-1 ring-white/20' : 'text-purple-300 hover:text-white'
                }`}
              >
                <Globe className="w-3 h-3" />
                Code-Switched ({codeSwitchedCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Visual Gantt-style Timeline Strip */}
      <div className="p-3.5 bg-slate-950/75 backdrop-blur-xl rounded-xl border border-white/10 space-y-2 z-10 relative">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-medium text-slate-300">Acoustic Timeline Distribution</span>
          <span className="font-mono text-cyan-400">Total Duration: {duration.toFixed(2)}s</span>
        </div>

        <div className="relative w-full h-8 bg-slate-900/90 rounded-lg overflow-hidden flex items-center border border-white/5">
          {/* Pauses visual bars */}
          {pauses.map((p) => {
            const leftPercent = duration > 0 ? (p.start / duration) * 100 : 0;
            const widthPercent = duration > 0 ? (p.duration / duration) * 100 : 0;
            return (
              <div
                key={p.id}
                onClick={() => onSeekToTime(p.start)}
                className="absolute top-0 bottom-0 bg-rose-500/30 hover:bg-rose-500/60 cursor-pointer border-r border-rose-500/50 transition-colors z-10"
                style={{ left: `${leftPercent}%`, width: `${Math.max(1, widthPercent)}%` }}
                title={`Pause between "${p.prevWord}" and "${p.nextWord}": ${p.duration.toFixed(2)}s`}
              />
            );
          })}

          {/* Words visual bars */}
          {words.map((w) => {
            const leftPercent = duration > 0 ? (w.start / duration) * 100 : 0;
            const widthPercent = duration > 0 ? (w.duration / duration) * 100 : 0;
            const isActive = w.id === activeWordId;
            return (
              <div
                key={w.id}
                onClick={() => onSeekToTime(w.start)}
                className={`absolute top-1 bottom-1 rounded-sm cursor-pointer transition-all ${
                  isActive
                    ? 'bg-cyan-400 ring-2 ring-cyan-300 z-20 shadow-md shadow-cyan-400/50'
                    : w.lang
                    ? 'bg-purple-500/80 hover:bg-purple-400'
                    : 'bg-indigo-600/80 hover:bg-indigo-500'
                }`}
                style={{ left: `${leftPercent}%`, width: `${Math.max(0.5, widthPercent)}%` }}
                title={`${w.word} (${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s)${w.lang ? ` [${w.lang}]` : ''}`}
              />
            );
          })}

          {/* Current playhead marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-300 z-30 pointer-events-none shadow-[0_0_8px_#38bdf8]"
            style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Interactive Word and Pause Table with Glassmorphism */}
      <div className="max-h-[340px] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/70 backdrop-blur-xl z-10 relative">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md text-slate-300 border-b border-white/10 font-mono text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">{t('wordHeader')}</th>
              <th className="py-2.5 px-3">{t('startHeader')}</th>
              <th className="py-2.5 px-3">{t('endHeader')}</th>
              <th className="py-2.5 px-3">{t('durationHeader')}</th>
              <th className="py-2.5 px-3">{t('pauseGapHeader')}</th>
              <th className="py-2.5 px-3">{t('langHeader')} / Conf</th>
              <th className="py-2.5 px-3 text-right">{t('actionsHeader')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-[11px]">
            {filteredWords.map((w, index) => {
              const isActive = w.id === activeWordId;
              const isEditing = editingWordId === w.id;

              return (
                <tr
                  key={w.id}
                  className={`transition-colors ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-200 font-bold'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <td className="py-2 px-3 text-slate-500">{index + 1}</td>

                  {/* Word Column */}
                  <td className="py-2 px-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editWordText}
                        onChange={(e) => setEditWordText(e.target.value)}
                        className="px-2 py-1 bg-slate-900 border border-indigo-500 rounded text-slate-100 focus:outline-none"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSeekToTime(w.start)}
                          className="font-sans text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          {w.word}
                        </button>
                        {w.lang && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            {w.lang}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Start time */}
                  <td className="py-2 px-3 text-slate-400">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(parseFloat(e.target.value))}
                        className="w-16 px-1.5 py-0.5 bg-slate-900 border border-indigo-500 rounded text-slate-100 focus:outline-none"
                      />
                    ) : (
                      `${w.start.toFixed(3)}s`
                    )}
                  </td>

                  {/* End time */}
                  <td className="py-2 px-3 text-slate-400">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(parseFloat(e.target.value))}
                        className="w-16 px-1.5 py-0.5 bg-slate-900 border border-indigo-500 rounded text-slate-100 focus:outline-none"
                      />
                    ) : (
                      `${w.end.toFixed(3)}s`
                    )}
                  </td>

                  {/* Duration */}
                  <td className="py-2 px-3 text-indigo-300">
                    {w.duration.toFixed(3)}s
                  </td>

                  {/* Pause After badge */}
                  <td className="py-2 px-3">
                    {getPauseBadge(w.pauseAfter, w.pauseType) || (
                      <span className="text-slate-600 text-[10px]">--</span>
                    )}
                  </td>

                  {/* Language / Confidence */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-400">
                        {Math.round((w.confidence ?? 0.95) * 100)}%
                      </span>
                    </div>
                  </td>

                  {/* Action buttons */}
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 font-sans">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(w.id)}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                            title="Save Changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onSeekToTime(w.start)}
                            className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-white/10 rounded transition-colors cursor-pointer"
                            title="Play from this word"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startEdit(w)}
                            className="p-1 text-slate-500 hover:text-indigo-300 hover:bg-white/10 rounded transition-colors cursor-pointer"
                            title="Edit word timing"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
