import React, { useState, useRef, useEffect } from 'react';
import { FileCode, Sliders, Globe, PlusCircle, Sparkles, Languages, ChevronDown, Info, Zap, Palette, History, Settings } from 'lucide-react';
import { SAMPLE_DATASETS } from '../utils/audioSamples';
import { UILanguage, SUPPORTED_UI_LANGUAGES, getTranslation } from '../utils/i18n';

interface HeaderProps {
  currentTab?: 'hub' | 'editor' | 'history' | 'settings';
  onSelectTab?: (tab: 'hub' | 'editor' | 'history' | 'settings') => void;
  onLoadSample?: (sampleId: string) => void;
  onOpenInfo: () => void;
  hasData?: boolean;
  onReset?: () => void;
  currentLanguage?: string;
  primaryLanguage?: string;
  detectedLanguages?: string[];
  isCodeSwitched?: boolean;
  uiLanguage: UILanguage;
  setUiLanguage?: (lang: UILanguage) => void;
  onSelectUILanguage?: (lang: UILanguage) => void;
  backendStatus?: 'checking' | 'connected' | 'failed';
}

export const Header: React.FC<HeaderProps> = ({
  currentTab = 'hub',
  onSelectTab,
  onLoadSample,
  onOpenInfo,
  hasData = false,
  onReset,
  detectedLanguages,
  isCodeSwitched,
  uiLanguage,
  setUiLanguage,
  onSelectUILanguage,
  backendStatus = 'checking',
}) => {
  const t = (key: string) => getTranslation(uiLanguage, key);

  return (
    <header className="border-b border-white/10 bg-slate-900/70 backdrop-blur-xl sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_20px_0_rgba(0,0,0,0.3)] pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
            <FileCode className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm sm:text-lg font-bold text-slate-100 tracking-tight">
              {t('appTitle')}
            </h1>
            <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full flex items-center gap-1 backdrop-blur-md">
              <Zap className="w-2.5 h-2.5 text-cyan-400" />
              Cloud AI Studio
            </span>
            {backendStatus === 'checking' && (
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                Backend: Connecting...
              </span>
            )}
            {backendStatus === 'connected' && (
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Backend: Connected
              </span>
            )}
            {backendStatus === 'failed' && (
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-full flex items-center gap-1.5 backdrop-blur-md animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                Backend: Offline
              </span>
            )}
            {isCodeSwitched && (
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full flex items-center gap-1 backdrop-blur-md">
                <Globe className="w-3 h-3" />
                {t('multilingual')} ({detectedLanguages?.join(' + ').toUpperCase()})
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400">
            {t('appSubtitle')}
          </p>
        </div>
      </div>

      {/* Right Controls Bar */}
      <div className="flex items-center flex-wrap gap-2">
        <button
          onClick={onOpenInfo}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-xl border border-white/10 transition-all cursor-pointer backdrop-blur-md"
          title="W3C TTML Architecture & Specification Guide"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
