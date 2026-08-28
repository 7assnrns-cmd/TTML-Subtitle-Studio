import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Trash2,
  Play,
  Music,
  Clock,
  Calendar,
  Download,
  Search,
  HardDrive,
  FileCode,
  Globe,
  Layers,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  Check,
  AlertTriangle
} from 'lucide-react';
import {
  SavedAnalysis,
  StorageStats,
  getHistory,
  getStorageStats,
  removeHistoryItem,
  clearHistory,
  exportHistoryAsJson,
} from '../utils/storage';
import { generateTTML } from '../utils/ttmlGenerator';
import { UILanguage, getTranslation } from '../utils/i18n';
import { CustomSelect } from './CustomSelect';

interface StorageManagerProps {
  onSelectSong: (item: SavedAnalysis) => void;
  uiLanguage: UILanguage;
}

export const StorageManager: React.FC<StorageManagerProps> = ({
  onSelectSong,
  uiLanguage,
}) => {
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [stats, setStats] = useState<StorageStats>({
    itemCount: 0,
    totalBytes: 0,
    formattedSize: '0 KB',
    percentQuotaUsed: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  const t = (key: string) => getTranslation(uiLanguage, key);

  const reloadData = () => {
    setHistory(getHistory());
    setStats(getStorageStats());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeHistoryItem(id);
    reloadData();
  };

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    clearHistory();
    setConfirmClear(false);
    reloadData();
  };

  const handleExportItem = (item: SavedAnalysis, format: 'ttml' | 'json', e: React.MouseEvent) => {
    e.stopPropagation();
    const baseName = item.filename.replace(/\.[^/.]+$/, '');
    let content = '';
    let ext = format;
    let mime = 'text/plain;charset=utf-8';

    if (format === 'ttml') {
      content = generateTTML(item.data.paragraphs, {
        profile: 'apple-music',
        timeFormat: 'clock',
        frameRate: 30,
        language: item.data.language || 'en',
        title: item.data.title || baseName,
        author: 'v1',
        fontSize: '160%',
        fontFamily: 'Arial, Helvetica, sans-serif',
        textColor: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.75)',
        activeWordColor: '#38BDF8',
        textAlign: 'center',
        includePauseMetadata: false,
        pauseThreshold: 0.2,
        splitSentencesOnLongPauses: true,
        enableTextOutline: true,
        emitPerWordLang: true,
      }, {
        duration: item.data.duration,
        totalWords: item.data.stats?.totalWords || 0,
        detectedLanguages: item.data.detectedLanguages,
      });
      mime = 'application/ttml+xml;charset=utf-8';
    } else {
      content = JSON.stringify(item.data, null, 2);
      mime = 'application/json;charset=utf-8';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccessId(`${item.id}_${format}`);
    setTimeout(() => setDownloadSuccessId(null), 2000);
  };

  const handleExportBackup = () => {
    const jsonStr = exportHistoryAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ttml_studio_history_backup_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const titleMatch = (item.data?.title || item.filename).toLowerCase().includes(searchQuery.toLowerCase());
      const langMatch = selectedLanguageFilter === 'all' || item.data?.language === selectedLanguageFilter;
      return titleMatch && langMatch;
    });
  }, [history, searchQuery, selectedLanguageFilter]);

  const allAvailableLanguages = useMemo(() => {
    return Array.from(
      new Set(history.map((h) => h.data?.language).filter(Boolean) as string[])
    );
  }, [history]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Storage Bar */}
      <div className="relative overflow-hidden rounded-2xl glass-card p-6 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-br from-indigo-500/10 via-cyan-500/10 to-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-300">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  History &amp; Local Storage Manager
                </h2>
                <p className="text-xs text-slate-400">
                  Manage saved TTML subtitle timing analysis, export formats, and storage cache.
                </p>
              </div>
            </div>

            {/* Storage Meter Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  LocalStorage Cache Usage: <strong className="text-cyan-300">{stats.formattedSize}</strong>
                </span>
                <span className="text-slate-400">
                  {stats.percentQuotaUsed}% of estimated 5MB quota
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950/80 rounded-full overflow-hidden border border-white/10 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.percentQuotaUsed > 85
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500'
                  }`}
                  style={{ width: `${Math.max(2, stats.percentQuotaUsed)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportBackup}
              disabled={history.length === 0}
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 disabled:opacity-40 text-slate-200 text-xs font-semibold border border-white/10 transition-all cursor-pointer backdrop-blur-md flex items-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              Backup History (.JSON)
            </button>

            <button
              onClick={handleClearAll}
              disabled={history.length === 0}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                confirmClear
                  ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}
            >
              {confirmClear ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-white animate-bounce" />
                  <span>Click Again to Confirm Clear</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Clear All Cache</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved songs, filenames, or keywords..."
            className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-white/10 text-xs focus:outline-none focus:border-cyan-500/60 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Globe className="w-4 h-4 text-indigo-400" />
          <div className="w-44">
            <CustomSelect
              value={selectedLanguageFilter}
              onChange={(val) => setSelectedLanguageFilter(val as string)}
              options={[
                { label: `All Languages (${history.length})`, value: 'all' },
                ...allAvailableLanguages.map((lang) => ({
                  label: lang.toUpperCase(),
                  value: lang,
                })),
              ]}
            />
          </div>

          <button
            onClick={reloadData}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors cursor-pointer"
            title="Refresh history list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Saved Tracks List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-white/5">
            <Music className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-300">No Saved Subtitle Entries</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery
                  ? 'No entries matched your search query.'
                  : 'Import an audio file or YouTube Music track in the Main Hub or Karaoke Editor to automatically save timing analysis.'}
              </p>
            </div>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              onSelect={onSelectSong}
              onDelete={handleDeleteItem}
              onExport={handleExportItem}
              downloadSuccessId={downloadSuccessId}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface HistoryItemProps {
  item: SavedAnalysis;
  onSelect: (item: SavedAnalysis) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onExport: (item: SavedAnalysis, format: 'ttml' | 'json', e: React.MouseEvent) => void;
  downloadSuccessId: string | null;
}

const HistoryItem = React.memo<HistoryItemProps>(({
  item,
  onSelect,
  onDelete,
  onExport,
  downloadSuccessId,
}) => {
  const wordCount = item.data?.stats?.totalWords || item.data?.words?.length || 0;
  const lineCount = item.data?.paragraphs?.length || 0;

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors flex items-center gap-2">
              <Music className="w-4 h-4 text-cyan-400" />
              {item.data?.title || item.filename}
            </h3>
            {item.data?.language && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 text-[10px] font-bold uppercase font-mono">
                {item.data.language}
              </span>
            )}
            {item.data?.isCodeSwitched && (
              <span className="px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-700/50 text-[10px] font-bold">
                Code-Switched
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {item.data?.duration ? `${item.data.duration.toFixed(1)}s` : 'N/A'}
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              {wordCount} words / {lineCount} lines
            </span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {/* Quick Format Downloads */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={(e) => onExport(item, 'ttml', e)}
              className="px-2.5 py-1 rounded-lg hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer text-[11px] font-mono font-semibold"
              title="Download Apple Music TTML XML"
            >
              {downloadSuccessId === `${item.id}_ttml` ? <Check className="w-3 h-3 text-emerald-400" /> : 'TTML'}
            </button>
            <button
              onClick={(e) => onExport(item, 'json', e)}
              className="px-2.5 py-1 rounded-lg hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer text-[11px] font-mono font-semibold"
              title="Download JSON Breakdown"
            >
              {downloadSuccessId === `${item.id}_json` ? <Check className="w-3 h-3 text-emerald-400" /> : 'JSON'}
            </button>
          </div>

          <button
            onClick={() => onSelect(item)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Open Studio
          </button>

          <button
            onClick={(e) => onDelete(item.id, e)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
            title="Delete from history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
