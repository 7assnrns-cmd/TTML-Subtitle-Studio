import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music2,
  Upload,
  Play,
  Sparkles,
  FileAudio,
  Zap,
  ArrowRight,
  History,
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../utils/audioSamples';
import { getHistory, SavedAnalysis } from '../utils/storage';
import { LanguageDropdown } from './LanguageDropdown';
import { UILanguage, getTranslation } from '../utils/i18n';
import { POPULAR_LANGUAGES } from '../utils/languages';
import { CustomSelect } from './CustomSelect';

interface MainHubProps {
  onAnalyzeAudio: (
    fileOrBlob: File | Blob,
    filename: string,
    mimeType: string,
    threshold: number,
    mode: 'auto' | 'manual',
    targetLang: string,
    lyricsText: string
  ) => void;
  onSelectSample: (sampleId: string) => void;
  onOpenHistoryItem: (item: SavedAnalysis) => void;
  onNavigateToTab: (tab: 'hub' | 'editor' | 'history') => void;
  uiLanguage: UILanguage;
}

const LANGUAGE_OPTIONS = POPULAR_LANGUAGES.map(l => ({ label: `${l.name} (${l.nativeName})`, value: l.code }));
const MODE_OPTIONS = [{ label: 'Universal Auto-Detect', value: 'auto' }, { label: 'Manual Language Target', value: 'manual' }];
const THRESHOLD_OPTIONS = [{ label: '0.15s (Ultra-Tight)', value: 0.15 }, { label: '0.20s (Standard)', value: 0.2 }, { label: '0.35s (Relaxed)', value: 0.35 }];

export const MainHub = React.memo<MainHubProps>(({
  onAnalyzeAudio,
  onSelectSample,
  onOpenHistoryItem,
  onNavigateToTab,
  uiLanguage,
}) => {
  const [recentItems, setRecentItems] = useState<SavedAnalysis[]>([]);
  const [pauseThreshold, setPauseThreshold] = useState<number>(0.2);
  const [languageMode, setLanguageMode] = useState<'auto' | 'manual'>('auto');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ja');
  const [pastedLyrics, setPastedLyrics] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  const t = (key: string) => getTranslation(uiLanguage, key);

  useEffect(() => {
    setRecentItems(getHistory().slice(0, 4));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    onAnalyzeAudio(
      file,
      file.name,
      file.type || 'audio/wav',
      pauseThreshold,
      languageMode,
      selectedLanguage,
      pastedLyrics
    );
    onNavigateToTab('editor');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      processFile(file);
    }
  };

  // Entry transitions configuration
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1], // iOS-like fluid ease-out
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div
      className="space-y-8 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Liquid Glass Hero Card */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-10 bg-slate-900/40 backdrop-blur-3xl shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)]"
      >
        {/* Animated Background Specular Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 15, 0],
            y: [0, -10, 0]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-cyan-500/10 to-purple-500/5 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -20, 0],
            y: [0, 15, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-rose-500/5 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Liquid Glass Workspace &bull; Pro Subtitle Engine</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-none bg-clip-text">
              Universal Multi-Language Karaoke &amp; Subtitle Studio
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Import local audio files to automatically generate Apple Music-style TTML lyrics with word-level micro-timestamps. Correct alignments, manage vocal agents, and sync code-switching lyrics with ease.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Real-time Visual Synchronization</span>
            </div>
            <span className="text-slate-700">&bull;</span>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Multi-Singer Agent Separation</span>
            </div>
            <span className="text-slate-700">&bull;</span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Gemini Transcription Integration</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Core Audio Ingestion Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Local Audio File Drag & Drop / Upload */}
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-white/10 p-6 sm:p-8 bg-slate-900/20 backdrop-blur-2xl shadow-xl flex flex-col justify-between space-y-6"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 shadow-inner">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Local Audio Import</h2>
                  <p className="text-[11px] text-slate-400">High-fidelity local file alignment</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950/80 border border-white/5 text-slate-400">
                WAV, MP3, M4A, FLAC
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upload local studio audio recordings or song files for instant zero-loss word-by-word timestamp extraction.
            </p>

            {/* Drop Zone Box with Liquid feedback */}
            <motion.label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                isDragOver
                  ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/5'
                  : 'border-white/10 bg-slate-950/40 hover:bg-slate-900/30 hover:border-cyan-500/40'
              } group`}
            >
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileAudio className={`w-10 h-10 mb-3 transition-transform duration-300 ${
                isDragOver ? 'text-cyan-400 scale-110' : 'text-slate-500 group-hover:text-cyan-400'
              }`} />
              <p className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300">
                {isDragOver ? 'Drop your audio file here!' : 'Click to browse or drag & drop audio'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Supports Japanese, English, Chinese, Arabic, and multilingual code-switching tracks
              </p>
            </motion.label>
          </div>

          {/* Reference Lyrics Box */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Reference Lyrics (Optional)</span>
              <span className="text-[10px] text-slate-500">Improves timing accuracy drastically</span>
            </div>
            <textarea
              value={pastedLyrics}
              onChange={(e) => setPastedLyrics(e.target.value)}
              placeholder="Paste official lyrics text here (optional)..."
              rows={3}
              className="w-full bg-slate-950/50 border border-white/5 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 font-sans resize-none"
            />
          </div>

          {/* Advanced Configurations */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 text-[11px] block font-medium">Language Detection</span>
              <CustomSelect
                options={MODE_OPTIONS}
                value={languageMode}
                onChange={(v) => setLanguageMode(v as 'auto' | 'manual')}
              />
              {languageMode === 'manual' && (
                <LanguageDropdown
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={(l) => setSelectedLanguage(l)}
                />
              )}
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 text-[11px] block font-medium">Pause Sensitivity</span>
              <CustomSelect
                options={THRESHOLD_OPTIONS}
                value={pauseThreshold}
                onChange={(v) => setPauseThreshold(v as number)}
              />
            </div>
          </div>
        </motion.div>

        {/* Card 2: Instant Multi-Language Sample Datasets */}
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-white/10 p-6 sm:p-8 bg-slate-900/20 backdrop-blur-2xl shadow-xl flex flex-col justify-between space-y-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 shadow-inner">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Instant Demo Presets</h2>
                  <p className="text-[11px] text-slate-400 font-medium text-amber-400">Pre-synchronized files</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/20 text-indigo-300 font-bold">
                No Upload Required
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Experience the TTML Karaoke Editor instantly with pre-aligned multi-language test tracks.
            </p>

            <div className="space-y-3 pt-2">
              {SAMPLE_DATASETS.map((sample) => (
                <motion.div
                  key={sample.id}
                  whileHover={{ scale: 1.015, x: 2, backgroundColor: 'rgba(30, 41, 59, 0.4)' }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    onSelectSample(sample.id);
                    onNavigateToTab('editor');
                  }}
                  className="group p-3.5 rounded-2xl bg-slate-950/40 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-between shadow-md"
                >
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 text-cyan-400" />
                      {sample.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                      <span className="uppercase text-indigo-300">{sample.data.language}</span>
                      <span>&bull;</span>
                      <span>{sample.duration}s</span>
                      <span>&bull;</span>
                      <span>{sample.data.words.length} words</span>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/20 transition-colors flex items-center gap-1 cursor-pointer">
                    <Play className="w-3 h-3 fill-current" />
                    Load
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity Section */}
      {recentItems.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="space-y-4 bg-slate-900/10 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              Recent Song Analyses ({recentItems.length})
            </h2>
            <button
              onClick={() => onNavigateToTab('history')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onOpenHistoryItem(item);
                  onNavigateToTab('editor');
                }}
                className="group p-4 rounded-2xl bg-slate-950/40 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer space-y-2 shadow-md hover:shadow-cyan-500/5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950 border border-white/5 text-cyan-300">
                    {item.data?.language || 'EN'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 truncate">
                  {item.data?.title || item.filename}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono border-t border-white/5">
                  <span>{item.data?.stats?.totalWords || 0} words</span>
                  <span className="text-cyan-400 font-sans font-semibold group-hover:underline flex items-center gap-1">
                    Open Studio &rarr;
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});
