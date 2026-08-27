import React, { useState, useRef, useEffect } from 'react';
import { FileCode, Sliders, Globe, PlusCircle, Sparkles, Languages, ChevronDown, Info, Zap, Palette, History } from 'lucide-react';
import { SAMPLE_DATASETS } from '../utils/audioSamples';
import { UILanguage, SUPPORTED_UI_LANGUAGES, getTranslation } from '../utils/i18n';

interface HeaderProps {
  onLoadSample?: (sampleId: string) => void;
  onOpenSettings: () => void;
  onOpenLanguageSettings: () => void;
  onOpenInfo: () => void;
  onOpenHistory?: () => void;
  hasData?: boolean;
  onReset?: () => void;
  currentLanguage?: string;
  primaryLanguage?: string;
  detectedLanguages?: string[];
  isCodeSwitched?: boolean;
  uiLanguage: UILanguage;
  setUiLanguage?: (lang: UILanguage) => void;
  onSelectUILanguage?: (lang: UILanguage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  onOpenSettings,
  onOpenLanguageSettings,
  onOpenInfo,
  onOpenHistory,
  hasData = false,
  onReset,
  detectedLanguages,
  isCodeSwitched,
  uiLanguage,
  setUiLanguage,
  onSelectUILanguage,
}) => {
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = (key: string) => getTranslation(uiLanguage, key);
  const currentLangMeta = SUPPORTED_UI_LANGUAGES.find((l) => l.code === uiLanguage) || SUPPORTED_UI_LANGUAGES[0];

  const handleLanguageChange = (lang: UILanguage) => {
    if (setUiLanguage) setUiLanguage(lang);
    if (onSelectUILanguage) onSelectUILanguage(lang);
    setIsLangDropdownOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      <div className="flex items-center flex-wrap gap-2">
        {/* Sample dataset selector */}
        <div className="hidden xl:flex items-center bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-xl p-1">
          <span className="text-xs text-slate-400 px-2 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {t('samples')}
          </span>
          {SAMPLE_DATASETS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onLoadSample && onLoadSample(sample.id)}
              className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all whitespace-nowrap cursor-pointer"
              title={`Load sample: ${sample.title}`}
            >
              {sample.category}
            </button>
          ))}
        </div>

        {/* UI Language Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-950/80 hover:bg-slate-800/80 border border-white/10 hover:border-cyan-500/40 rounded-xl transition-all shadow-sm cursor-pointer backdrop-blur-md"
            title="Switch interface language"
          >
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <span className="flex items-center gap-1">
              <span>{currentLangMeta.flag}</span>
              <span>{currentLangMeta.nativeName}</span>
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLangDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-white/10">
                {t('uiLanguage')}
              </div>
              {SUPPORTED_UI_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    uiLanguage === lang.code
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {lang.code.toUpperCase()}
                  </span>
                </button>
              ))}
              <div className="border-t border-white/10 pt-1">
                <button
                  onClick={() => {
                    setIsLangDropdownOpen(false);
                    onOpenLanguageSettings();
                  }}
                  className="w-full px-3 py-1.5 text-[11px] text-left text-cyan-400 hover:text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  &bull; {t('uiSettingsTitle')}...
                </button>
              </div>
            </div>
          )}
        </div>

        {hasData && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 hover:text-cyan-300 border border-white/10 rounded-xl transition-all shadow-sm cursor-pointer backdrop-blur-md"
            title="Upload or record new audio"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('newAudio')}</span>
          </button>
        )}

        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 hover:border-cyan-500/40 border border-white/10 rounded-xl transition-all shadow-sm cursor-pointer backdrop-blur-md"
          title="Saved Lyrics & Timing History"
        >
          <History className="w-3.5 h-3.5 text-cyan-400" />
          <span>History</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 hover:border-cyan-500/40 border border-white/10 rounded-xl transition-all shadow-sm cursor-pointer backdrop-blur-md"
          title="Open Theme Customizer, Glassmorphism & TTML Settings"
        >
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t('ttmlConfig')}</span>
        </button>

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
