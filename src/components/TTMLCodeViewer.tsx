import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Copy,
  Check,
  Download,
  Code,
  FileText,
  CheckCircle2,
  FileSpreadsheet,
  Zap,
  Music2,
  Share2,
  ListFilter,
  Users,
  Mic,
  Clock,
  Layers,
} from 'lucide-react';
import { ParagraphSegment, TTMLConfig } from '../types';
import { generateTTML } from '../utils/ttmlGenerator';
import { copyToClipboard } from '../utils/clipboard';
import { UILanguage, getTranslation } from '../utils/i18n';
import { CustomSelect } from './CustomSelect';

interface TTMLCodeViewerProps {
  paragraphs: ParagraphSegment[];
  config: TTMLConfig;
  setConfig: React.Dispatch<React.SetStateAction<TTMLConfig>>;
  filename: string;
  duration: number;
  detectedLanguages?: string[];
  uiLanguage: UILanguage;
}

export const TTMLCodeViewer = React.memo<TTMLCodeViewerProps>(({
  paragraphs,
  config,
  setConfig,
  filename,
  duration,
  detectedLanguages = [],
  uiLanguage,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [activeTab, setActiveTab] = useState<'ttml' | 'breakdown'>('ttml');
  const [virtualScrollTop, setVirtualScrollTop] = useState(0);

  const handleVirtualScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setVirtualScrollTop(e.currentTarget.scrollTop);
  }, []);

  const itemHeight = 110;
  const containerHeight = 220;
  const startIndex = Math.max(0, Math.floor(virtualScrollTop / itemHeight) - 2);
  const endIndex = Math.min(paragraphs.length, Math.floor((virtualScrollTop + containerHeight) / itemHeight) + 2);

  const visibleParagraphs = useMemo(() => {
    return paragraphs.slice(startIndex, endIndex).map((p, idx) => ({
      p,
      originalIndex: startIndex + idx,
    }));
  }, [paragraphs, startIndex, endIndex]);

  const paddingTop = startIndex * itemHeight;
  const paddingBottom = Math.max(0, paragraphs.length - endIndex) * itemHeight;

  const t = (key: string) => getTranslation(uiLanguage, key);

  const ttmlXml = useMemo(() => {
    return generateTTML(paragraphs, config, {
      duration,
      totalWords: paragraphs.reduce((acc, p) => acc + p.words.length, 0),
      detectedLanguages,
    });
  }, [paragraphs, config, duration, detectedLanguages]);

  const baseTitle = filename.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');
  const jsonOutput = JSON.stringify(paragraphs, null, 2);

  const getCurrentCode = () => {
    switch (activeTab) {
      case 'ttml':
        return ttmlXml;
      case 'breakdown':
        return jsonOutput;
    }
  };

  const currentContent = getCurrentCode();
  const lineCount = currentContent.split('\n').length;
  const byteSize = new Blob([currentContent]).size;

  const handleCopy = async () => {
    const success = await copyToClipboard(currentContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const baseName = filename.replace(/\.[^/.]+$/, '');
    const ext = activeTab === 'ttml' ? 'ttml' : 'json';
    const outputName = `${baseName || 'lyrics'}.${ext}`;

    if (navigator.share) {
      try {
        const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
        const file = new File([blob], outputName, { type: 'text/plain' });
        await navigator.share({
          title: `${baseTitle} - ${activeTab.toUpperCase()}`,
          text: `Subtitle file for ${baseTitle}`,
          files: [file],
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch {
        // Fallback to text sharing
        try {
          await navigator.share({
            title: `${baseTitle} - ${activeTab.toUpperCase()}`,
            text: currentContent,
          });
          setShared(true);
          setTimeout(() => setShared(false), 2000);
          return;
        } catch {
          // Fallback to download
        }
      }
    }
    handleDownload(activeTab, currentContent);
  };

  const handleDownload = (formatKey: string, content: string) => {
    const baseName = filename.replace(/\.[^/.]+$/, '');
    const ext = formatKey === 'ttml' ? 'ttml' : 'json';
    const outputName = `${baseName || 'lyrics'}.${ext}`;

    const mimeTypes: Record<string, string> = {
      ttml: 'application/ttml+xml;charset=utf-8',
      json: 'application/json;charset=utf-8',
    };

    const blob = new Blob([content], {
      type: mimeTypes[formatKey.toLowerCase()] || 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = outputName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative overflow-hidden glass-card rounded-2xl p-4 sm:p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] flex flex-col h-full max-w-full box-border">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/3 w-80 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top action & tab bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 z-10 relative">
        {/* Format Selector Tabs */}
        <div className="flex items-center flex-wrap gap-1 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('ttml')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ttml'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Code className="w-4 h-4" />
            Apple Music TTML
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'breakdown'
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-sm ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <ListFilter className="w-4 h-4 text-cyan-300" />
            3-List Breakdown
          </button>
        </div>

        {/* Time format and schema controls */}
        {activeTab === 'ttml' && (
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="w-40">
              <CustomSelect
                value={config.timeFormat}
                onChange={(val) => setConfig((prev) => ({ ...prev, timeFormat: val as any }))}
                options={[
                  { label: '00:00:00.000 (Clock)', value: 'clock' },
                  { label: '1.250s (Seconds)', value: 'seconds' },
                  { label: '00:00:00:15 (SMPTE)', value: 'frames' },
                ]}
              />
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 text-[11px] text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={config.emitPerWordLang ?? true}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    emitPerWordLang: e.target.checked,
                  }))
                }
                className="accent-indigo-500 rounded cursor-pointer"
              />
              <span>xml:lang tag</span>
            </label>
          </div>
        )}

        {/* Action Buttons: Copy, Share & Download */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold border border-white/10 transition-all cursor-pointer backdrop-blur-md"
            title="Copy current subtitle format to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">{t('copied')}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('copyXml')}</span>
              </>
            )}
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold border border-white/10 transition-all cursor-pointer backdrop-blur-md"
              title="Share file natively (Android / Mobile)"
            >
              {shared ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Shared</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Share</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => handleDownload(activeTab, currentContent)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 ring-1 ring-white/20 transition-all cursor-pointer active:scale-95"
            title={`Download ${activeTab.toUpperCase()} subtitle file`}
          >
            <Download className="w-4 h-4" />
            <span>
              {activeTab === 'ttml'
                ? t('downloadTtml')
                : 'Download Breakdown'}
            </span>
          </button>
        </div>
      </div>

      {/* Code / XML Document Container */}
      <div className="relative mt-4 flex-1 min-h-[300px] max-h-[440px] rounded-xl bg-slate-950/80 backdrop-blur-2xl border border-white/10 overflow-hidden flex flex-col font-mono z-10">
        {/* Document Stats Header */}
        <div className="px-4 py-2 bg-slate-900/80 border-b border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-semibold uppercase">{activeTab} Output</span>
            <span>&bull;</span>
            <span>{lineCount} lines</span>
            <span>&bull;</span>
            <span>{(byteSize / 1024).toFixed(1)} KB</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-cyan-400 flex items-center gap-1 font-sans text-[11px]">
              <Zap className="w-3 h-3 text-cyan-400" /> Cloud AI Word Micro-Timing
            </span>
            {activeTab === 'ttml' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> itunes:timing="Word" (Apple Music)
              </span>
            )}
          </div>
        </div>

        {/* Highlighted Code or 3-List Breakdown Display */}
        {activeTab === 'breakdown' ? (
          <div className="p-4 flex-1 overflow-auto space-y-5 text-xs text-slate-300">
            {/* List 1: Header Metadata List */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-[11px] border-b border-cyan-500/20 pb-1">
                <FileText className="w-3.5 h-3.5" />
                1. Header Metadata List
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">Song Title</span>
                  <span className="font-semibold text-slate-200">{config.title || baseTitle}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Author / Artist</span>
                  <span className="font-semibold text-slate-200">{config.author || 'Artist v1'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Primary Language</span>
                  <span className="font-semibold text-cyan-300 uppercase">{config.language || 'JA'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Duration</span>
                  <span className="font-semibold text-slate-200">{duration.toFixed(1)}s</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Time Profile</span>
                  <span className="font-semibold text-slate-200">{config.profile}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Time Format</span>
                  <span className="font-semibold text-slate-200">{config.timeFormat}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Words</span>
                  <span className="font-semibold text-slate-200">{paragraphs.reduce((acc, p) => acc + p.words.length, 0)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Lines</span>
                  <span className="font-semibold text-slate-200">{paragraphs.length}</span>
                </div>
              </div>
            </div>

            {/* List 2: Vocalist / Agent Attribution List */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-[11px] border-b border-indigo-500/20 pb-1">
                <Users className="w-3.5 h-3.5" />
                2. Vocalist / Agent Attribution List
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-cyan-400" /> Lead Vocalist
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">v1</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Primary vocal track performer</p>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-purple-400" /> Secondary Vocalist
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">v2</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Duet / Secondary vocals</p>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-amber-400" /> Background / Harmonies
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">v_bg</span>
                  </div>
                  <p className="text-[11px] text-slate-400">ChORUS / Background vocal layer</p>
                </div>
              </div>
            </div>

            {/* List 3: Synchronized Timed Text List */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px] border-b border-emerald-500/20 pb-1">
                <Clock className="w-3.5 h-3.5" />
                3. Synchronized Timed Text List ({paragraphs.length} Lines)
              </div>
              <div 
                className="space-y-2 max-h-[220px] overflow-y-auto pr-1"
                onScroll={handleVirtualScroll}
              >
                <div style={{ paddingTop, paddingBottom }} className="space-y-2">
                  {visibleParagraphs.map(({ p, originalIndex }) => (
                    <div key={p.id || originalIndex} className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-cyan-300 font-medium">
                          [{p.start.toFixed(2)}s &rarr; {p.end.toFixed(2)}s]
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                            {p.songPart || 'Verse'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                            {p.agentId || 'v1'}
                          </span>
                        </div>
                      </div>
                      <div className="font-medium text-slate-100 text-xs">
                        {p.text}
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/60">
                        {p.words.map((w) => (
                          <span
                            key={w.id}
                            className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1"
                          >
                            <span className="text-white">{w.word}</span>
                            <span className="text-slate-500 text-[9px] font-mono">({w.start.toFixed(2)}s)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 flex-1 overflow-auto text-xs leading-relaxed text-slate-300 select-text selection:bg-indigo-500 selection:text-white">
            <pre className="whitespace-pre font-mono">
              {currentContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
});

