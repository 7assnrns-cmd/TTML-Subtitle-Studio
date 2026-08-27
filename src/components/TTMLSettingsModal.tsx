import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Check,
  Globe,
  Music2,
  Languages,
  Zap,
  Palette,
  Sparkles,
  RotateCcw,
  Layers,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { TTMLConfig, ThemeCustomizerConfig, AccentColorPreset } from '../types';
import { UILanguage, SUPPORTED_UI_LANGUAGES, getTranslation } from '../utils/i18n';
import {
  ACCENT_PRESETS,
  DEFAULT_THEME_CONFIG,
  applyThemeVariables,
} from '../utils/theme';

interface TTMLSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TTMLConfig;
  setConfig: React.Dispatch<React.SetStateAction<TTMLConfig>>;
  uiLanguage: UILanguage;
  setUiLanguage?: (lang: UILanguage) => void;
  onSelectUILanguage?: (lang: UILanguage) => void;
}

type TabKey = 'theme' | 'general' | 'language';

export const TTMLSettingsModal: React.FC<TTMLSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  setConfig,
  uiLanguage,
  setUiLanguage,
  onSelectUILanguage,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('theme');

  // Current theme config with defaults
  const theme: ThemeCustomizerConfig = config.themeConfig || DEFAULT_THEME_CONFIG;

  const t = (key: string) => getTranslation(uiLanguage, key);

  // Sync theme changes to document CSS variables immediately
  const updateTheme = (updates: Partial<ThemeCustomizerConfig>) => {
    const nextTheme: ThemeCustomizerConfig = {
      ...theme,
      ...updates,
    };
    setConfig((prev) => ({
      ...prev,
      themeConfig: nextTheme,
    }));
    applyThemeVariables(nextTheme);
  };

  const handleResetTheme = () => {
    updateTheme(DEFAULT_THEME_CONFIG);
  };

  const handleLanguageChange = (lang: UILanguage) => {
    if (setUiLanguage) setUiLanguage(lang);
    if (onSelectUILanguage) onSelectUILanguage(lang);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal rounded-2xl w-full max-w-xl shadow-[0_24px_64px_0_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                {t('settingsTitle')}
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {t('settingsDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-white/10 flex gap-2 shrink-0 bg-slate-900/30">
          <button
            onClick={() => setActiveTab('theme')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'theme'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{t('themeTab') || 'Theme & Glassmorphism'}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              Customizer
            </span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t('generalTab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('language')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'language'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{t('uiLanguage')}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-300 flex-1">
          {/* TAB 1: THEME & GLASSMORPHISM CUSTOMIZER */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              {/* Header Description */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    {t('themeCustomizerTitle')}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {t('themeCustomizerDesc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetTheme}
                  className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-slate-900/60 hover:bg-white/10 text-[11px] text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>{t('resetTheme')}</span>
                </button>
              </div>

              {/* 1. Glass Blur Intensity Slider */}
              <div className="glass-card p-4 rounded-xl space-y-3 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-slate-200">
                      {t('blurIntensityLabel')}
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {theme.blurIntensity ?? 16}px
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="32"
                    step="1"
                    value={theme.blurIntensity ?? 16}
                    onChange={(e) =>
                      updateTheme({ blurIntensity: parseInt(e.target.value, 10) })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0px (Crisp / No Blur)</span>
                    <span>16px (Standard)</span>
                    <span>32px (Deep Frost)</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: 'Crisp (0px)', val: 0 },
                    { label: 'Subtle (8px)', val: 8 },
                    { label: 'Standard (16px)', val: 16 },
                    { label: 'Frosted (24px)', val: 24 },
                    { label: 'Deep (32px)', val: 32 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => updateTheme({ blurIntensity: p.val })}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                        (theme.blurIntensity ?? 16) === p.val
                          ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                          : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-white/5'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Border Opacity Slider */}
              <div className="glass-card p-4 rounded-xl space-y-3 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-slate-200">
                      {t('borderOpacityLabel')}
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {Math.round((theme.borderOpacity ?? 0.12) * 100)}%
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="0.02"
                    max="0.40"
                    step="0.01"
                    value={theme.borderOpacity ?? 0.12}
                    onChange={(e) =>
                      updateTheme({ borderOpacity: parseFloat(e.target.value) })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>2% (Ultra Subtle)</span>
                    <span>12% (Refined)</span>
                    <span>40% (Defined Rim)</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: '5% (Minimal)', val: 0.05 },
                    { label: '12% (Balanced)', val: 0.12 },
                    { label: '22% (Defined)', val: 0.22 },
                    { label: '35% (High Contrast)', val: 0.35 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => updateTheme({ borderOpacity: p.val })}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                        Math.abs((theme.borderOpacity ?? 0.12) - p.val) < 0.015
                          ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/50'
                          : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-white/5'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Glass Background Density Slider */}
              <div className="glass-card p-4 rounded-xl space-y-3 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-slate-200">
                      {t('glassOpacityLabel')}
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {Math.round((theme.glassOpacity ?? 0.65) * 100)}%
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="0.30"
                    max="0.95"
                    step="0.05"
                    value={theme.glassOpacity ?? 0.65}
                    onChange={(e) =>
                      updateTheme({ glassOpacity: parseFloat(e.target.value) })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>30% (Transparent)</span>
                    <span>65% (Standard Glass)</span>
                    <span>95% (Dense Dark)</span>
                  </div>
                </div>
              </div>

              {/* 4. Global Accent Color Palette */}
              <div className="glass-card p-4 rounded-xl space-y-3 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-400" />
                    {t('globalAccentColor')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Active: <span className="font-bold text-slate-200 capitalize">{theme.accentColor}</span>
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    Object.keys(ACCENT_PRESETS) as AccentColorPreset[]
                  ).map((presetKey) => {
                    const meta = ACCENT_PRESETS[presetKey];
                    const isSelected = theme.accentColor === presetKey;

                    if (presetKey === 'custom') {
                      return (
                        <button
                          key={presetKey}
                          type="button"
                          onClick={() => updateTheme({ accentColor: 'custom' })}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white/15 border-white/40 ring-2 ring-white/20'
                              : 'bg-slate-900/60 border-white/10 hover:border-white/25'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                              style={{
                                backgroundColor: theme.customAccentHex || '#06b6d4',
                              }}
                            />
                            <span className="text-[11px] font-medium text-slate-200">
                              Custom...
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    }

                    return (
                      <button
                        key={presetKey}
                        type="button"
                        onClick={() => updateTheme({ accentColor: presetKey })}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-cyan-400/40'
                            : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                        }`}
                        style={{
                          backgroundColor: isSelected ? meta.badgeBg : undefined,
                          borderColor: isSelected ? meta.badgeBorder : undefined,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: meta.primaryHex }}
                          />
                          <span
                            className="text-[11px] font-medium"
                            style={{
                              color: isSelected ? meta.textHex : '#cbd5e1',
                            }}
                          >
                            {meta.name}
                          </span>
                        </div>
                        {isSelected && (
                          <Check
                            className="w-3.5 h-3.5"
                            style={{ color: meta.primaryHex }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input if selected */}
                {theme.accentColor === 'custom' && (
                  <div className="pt-2 border-t border-white/10 flex items-center gap-3">
                    <label className="text-[11px] text-slate-400 shrink-0">
                      {t('customAccentColor')}:
                    </label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="color"
                        value={theme.customAccentHex || '#06b6d4'}
                        onChange={(e) =>
                          updateTheme({
                            accentColor: 'custom',
                            customAccentHex: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={theme.customAccentHex || '#06b6d4'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.startsWith('#') && val.length <= 7) {
                            updateTheme({
                              accentColor: 'custom',
                              customAccentHex: val,
                            });
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-950 border border-white/15 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 w-28"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Live Glassmorphism Preview */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  {t('previewGlass')}
                </span>

                <div className="relative rounded-2xl overflow-hidden p-6 border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40">
                  {/* Decorative background grid lights */}
                  <div className="absolute top-2 left-4 w-32 h-32 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />
                  <div className="absolute bottom-2 right-4 w-32 h-32 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />

                  {/* Sample Glass Card */}
                  <div className="relative glass-card p-4 rounded-xl border space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold text-xs text-slate-200">
                          Apple Music Subtitle Stream
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border"
                        style={{
                          backgroundColor: 'rgba(var(--accent-primary-rgb, 6, 182, 212), 0.15)',
                          borderColor: 'rgba(var(--accent-primary-rgb, 6, 182, 212), 0.35)',
                          color: 'var(--accent-primary, #06b6d4)',
                        }}
                      >
                        00:01:24.500
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-100 leading-snug">
                      <span>Synchronized </span>
                      <span
                        className="px-1.5 py-0.5 rounded-md border font-bold"
                        style={{
                          backgroundColor: 'rgba(var(--accent-primary-rgb, 6, 182, 212), 0.25)',
                          borderColor: 'rgba(var(--accent-primary-rgb, 6, 182, 212), 0.50)',
                          color: 'var(--accent-text, #67e8f9)',
                          boxShadow: '0 0 12px rgba(var(--accent-primary-rgb, 6, 182, 212), 0.4)',
                        }}
                      >
                        Karaoke
                      </span>
                      <span> Acoustic Timestamps</span>
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span className="font-mono text-[10px]">Blur: {theme.blurIntensity ?? 16}px</span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">Border: {Math.round((theme.borderOpacity ?? 0.12) * 100)}%</span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">Density: {Math.round((theme.glassOpacity ?? 0.65) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL & TTML OUTPUT */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* 120Hz Mode Setting */}
              <div className="space-y-2.5 glass-card p-4 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-indigo-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        120Hz Refresh Rate Setting
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                          120 FPS
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Hardware-accelerated 120fps rendering, CSS <code className="font-mono text-cyan-300">translateZ(0)</code> composition, and sub-millisecond audio sync.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input
                      type="checkbox"
                      checked={config.enable120HzMode ?? true}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          enable120HzMode: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-cyan-400 shadow-inner"></div>
                  </label>
                </div>
              </div>

              {/* Metadata Section */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5" />
                  {t('generalTab')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">{t('trackTitleLabel')}</label>
                    <input
                      type="text"
                      value={config.title}
                      onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">{t('authorLabel')}</label>
                    <input
                      type="text"
                      value={config.author}
                      onChange={(e) => setConfig((prev) => ({ ...prev, author: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">{t('primaryLangLabel')}</label>
                  <select
                    value={config.language}
                    onChange={(e) => setConfig((prev) => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="en">English (en)</option>
                    <option value="ja">Japanese (ja)</option>
                    <option value="ar">Arabic (ar)</option>
                    <option value="zh">Chinese (zh)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="fr">French (fr)</option>
                    <option value="de">German (de)</option>
                    <option value="it">Italian (it)</option>
                    <option value="ko">Korean (ko)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="pt">Portuguese (pt)</option>
                    <option value="ru">Russian (ru)</option>
                  </select>
                </div>
              </div>

              {/* Multilingual & Code Switching */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h4 className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Multilingual &amp; Code-Switching
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="emitPerWordLang"
                    checked={config.emitPerWordLang ?? true}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        emitPerWordLang: e.target.checked,
                      }))
                    }
                    className="accent-purple-500 rounded cursor-pointer"
                  />
                  <label htmlFor="emitPerWordLang" className="text-slate-300 cursor-pointer">
                    Emit <code className="text-purple-300 font-mono text-[11px]">xml:lang</code> attribute on code-switched <code className="text-cyan-300 font-mono text-[11px]">&lt;span&gt;</code> and <code className="text-cyan-300 font-mono text-[11px]">&lt;p&gt;</code> tags
                  </label>
                </div>
              </div>

              {/* Apple Music Multi-Singer Agent & Background Vocals */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h4 className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5" />
                  Multi-Singer &amp; Background Harmonies
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableMultiAgent"
                      checked={config.enableMultiAgent ?? true}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          enableMultiAgent: e.target.checked,
                        }))
                      }
                      className="accent-cyan-500 rounded cursor-pointer"
                    />
                    <label htmlFor="enableMultiAgent" className="text-slate-300 cursor-pointer">
                      Enable Multi-Singer Agent definitions (<code className="text-cyan-300 font-mono text-[11px]">&lt;ttm:agent&gt;</code> and <code className="text-cyan-300 font-mono text-[11px]">ttm:agent="v1|v2"</code>)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableBackgroundVocals"
                      checked={config.enableBackgroundVocals ?? true}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          enableBackgroundVocals: e.target.checked,
                        }))
                      }
                      className="accent-purple-500 rounded cursor-pointer"
                    />
                    <label htmlFor="enableBackgroundVocals" className="text-slate-300 cursor-pointer">
                      Detect and format background vocal layers &amp; harmonies (<code className="text-purple-300 font-mono text-[11px]">ttm:role="x-bg"</code>)
                    </label>
                  </div>
                </div>
              </div>

              {/* Time & Format */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h4 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                  {t('stylingTab')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">{t('timeFormatLabel')}</label>
                    <select
                      value={config.timeFormat}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          timeFormat: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="clock">00:00:00.000 (Standard Clock)</option>
                      <option value="seconds">1.250s (Metric Seconds)</option>
                      <option value="frames">00:00:00:15 (SMPTE Frames)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">{t('frameRateLabel')}</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={config.frameRate}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          frameRate: parseInt(e.target.value, 10) || 30,
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UI INTERFACE LANGUAGE */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-cyan-400" />
                    {t('uiSettingsTitle')}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t('selectUiLang')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUPPORTED_UI_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      uiLanguage === lang.code
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 font-semibold shadow-md'
                        : 'bg-slate-900/80 border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <div>
                        <span className="block text-xs font-bold">{lang.nativeName}</span>
                        <span className="block text-[10px] text-slate-400">{lang.label}</span>
                      </div>
                    </div>
                    {uiLanguage === lang.code && (
                      <div className="w-6 h-6 rounded-full bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-white/10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Theme auto-saved</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-white font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, var(--accent-secondary, #6366f1) 0%, var(--accent-primary, #06b6d4) 100%)',
              boxShadow: '0 4px 16px rgba(var(--accent-primary-rgb, 6, 182, 212), 0.35)',
            }}
          >
            {t('saveClose')}
          </button>
        </div>
      </div>
    </div>
  );
};
