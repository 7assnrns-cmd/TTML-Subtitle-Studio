import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Code,
  FileText,
  CheckCircle2,
  FileSpreadsheet,
  Languages,
  Sparkles,
} from 'lucide-react';
import { ParagraphSegment, TTMLConfig } from '../types';
import { generateTTML, generateSRT, generateVTT } from '../utils/ttmlGenerator';
import { copyToClipboard } from '../utils/clipboard';
import { UILanguage, getTranslation } from '../utils/i18n';

interface TTMLCodeViewerProps {
  paragraphs: ParagraphSegment[];
  config: TTMLConfig;
  setConfig: React.Dispatch<React.SetStateAction<TTMLConfig>>;
  filename: string;
  duration: number;
  detectedLanguages?: string[];
  uiLanguage: UILanguage;
}

export const TTMLCodeViewer: React.FC<TTMLCodeViewerProps> = ({
  paragraphs,
  config,
  setConfig,
  filename,
  duration,
  detectedLanguages = [],
  uiLanguage,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'ttml' | 'srt' | 'vtt' | 'json'>('ttml');

  const t = (key: string) => getTranslation(uiLanguage, key);

  const ttmlXml = generateTTML(paragraphs, config, {
    duration,
    totalWords: paragraphs.reduce((acc, p) => acc + p.words.length, 0),
    detectedLanguages,
  });

  const srtOutput = generateSRT(paragraphs);
  const vttOutput = generateVTT(paragraphs);
  const jsonOutput = JSON.stringify(paragraphs, null, 2);

  const getCurrentCode = () => {
    switch (activeTab) {
      case 'ttml':
        return ttmlXml;
      case 'srt':
        return srtOutput;
      case 'vtt':
        return vttOutput;
      case 'json':
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

  const handleDownload = (ext: string, content: string) => {
    const baseName = filename.replace(/\.[^/.]+$/, '');
    const cleanExt = ext.startsWith('.') ? ext : `.${ext}`;
    const outputName = `${baseName || 'subtitles'}${cleanExt}`;

    const mimeTypes: Record<string, string> = {
      ttml: 'application/ttml+xml;charset=utf-8',
      srt: 'text/plain;charset=utf-8',
      vtt: 'text/vtt;charset=utf-8',
      json: 'application/json;charset=utf-8',
    };

    const blob = new Blob([content], {
      type: mimeTypes[ext.toLowerCase()] || 'text/plain;charset=utf-8',
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Top action & tab bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        {/* Format Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('ttml')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'ttml'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Apple Music TTML
          </button>
          <button
            onClick={() => setActiveTab('srt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'srt'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            SRT
          </button>
          <button
            onClick={() => setActiveTab('vtt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'vtt'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            WebVTT
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'json'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            JSON
          </button>
        </div>

        {/* Time format and schema controls */}
        {activeTab === 'ttml' && (
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px]">{t('formatOptions')}</span>
              <select
                value={config.timeFormat}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    timeFormat: e.target.value as any,
                  }))
                }
                className="bg-transparent text-cyan-300 font-mono text-[11px] focus:outline-none cursor-pointer"
              >
                <option value="clock" className="bg-slate-900">00:00:00.000 (Clock)</option>
                <option value="seconds" className="bg-slate-900">1.250s (Seconds)</option>
                <option value="frames" className="bg-slate-900">00:00:00:15 (SMPTE)</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-300 hover:text-white">
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

        {/* Action Buttons: Copy & Download */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
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

          <button
            onClick={() => handleDownload(activeTab, currentContent)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            title={`Download ${activeTab.toUpperCase()} subtitle file`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {activeTab === 'ttml' ? t('downloadTtml') : `Download .${activeTab}`}
            </span>
          </button>
        </div>
      </div>

      {/* Code / XML Document Container */}
      <div className="relative mt-4 flex-1 min-h-[300px] max-h-[440px] rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex flex-col font-mono">
        {/* Document Stats Header */}
        <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-semibold uppercase">{activeTab} Output</span>
            <span>&bull;</span>
            <span>{lineCount} lines</span>
            <span>&bull;</span>
            <span>{(byteSize / 1024).toFixed(1)} KB</span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'ttml' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> itunes:timing="Word" (Apple Music)
              </span>
            )}
          </div>
        </div>

        {/* Highlighted Code Display */}
        <div className="p-4 flex-1 overflow-auto text-xs leading-relaxed text-slate-300 select-text selection:bg-indigo-500 selection:text-white">
          <pre className="whitespace-pre font-mono">
            {currentContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
