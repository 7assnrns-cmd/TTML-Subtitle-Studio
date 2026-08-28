import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  Palette, 
  SlidersHorizontal, 
  Languages, 
  Sparkles, 
  RotateCcw, 
  Layers, 
  Eye, 
  Check, 
  Zap, 
  Music2, 
  Globe, 
  HardDrive 
} from 'lucide-react';
import { UILanguage, getTranslation, SUPPORTED_UI_LANGUAGES } from '../utils/i18n';
import { CustomSelect } from './CustomSelect';
import { TTMLConfig, ThemeCustomizerConfig, AccentColorPreset } from '../types';
import { ACCENT_PRESETS, DEFAULT_THEME_CONFIG, applyThemeVariables } from '../utils/theme';

interface SettingsSectionProps {
  uiLanguage: UILanguage;
  setUiLanguage: (lang: UILanguage) => void;
  config: TTMLConfig;
  setConfig: React.Dispatch<React.SetStateAction<TTMLConfig>>;
}

type TabKey = 'theme' | 'general' | 'language' | 'storage';

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  uiLanguage,
  setUiLanguage,
  config,
  setConfig,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('theme');
  const t = (key: string) => getTranslation(uiLanguage, key);
  
  const theme: ThemeCustomizerConfig = config.themeConfig || DEFAULT_THEME_CONFIG;

  const updateConfig = (updates: Partial<TTMLConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

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
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Settings className="w-6 h-6 text-cyan-400" />
          </div>
          Settings
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/10 pb-1">
        {(['theme', 'general', 'language', 'storage'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === tab
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'theme' && <Palette className="w-4 h-4" />}
            {tab === 'general' && <SlidersHorizontal className="w-4 h-4" />}
            {tab === 'language' && <Languages className="w-4 h-4" />}
            {tab === 'storage' && <HardDrive className="w-4 h-4" />}
            <span className="capitalize">{tab === 'general' ? 'TTML Config' : tab}</span>
          </button>
        ))}
      </div>

      <div className="w-full space-y-8">
        <div className="space-y-8">
          {activeTab === 'theme' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <Palette className="w-6 h-6 text-cyan-400" />
                    Studio Identity & Theme
                  </h3>
                  <p className="text-sm text-slate-400">Design a workspace that matches your creative workflow.</p>
                </div>
                <button
                  onClick={handleResetTheme}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 rounded-xl transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Theme
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visual Style Column */}
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-2xl border border-white/10 bg-slate-950/30 space-y-6">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Glassmorphism & Depth
                    </h4>
                    
                    {/* Blur Intensity */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Backdrop Blur</label>
                        <span className="font-mono text-xs text-cyan-400">{theme.blurIntensity ?? 16}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="32"
                        step="1"
                        value={theme.blurIntensity ?? 16}
                        onChange={(e) => updateTheme({ blurIntensity: parseInt(e.target.value, 10) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>

                    {/* Glass Opacity */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Surface Opacity</label>
                        <span className="font-mono text-xs text-purple-400">{Math.round((theme.glassOpacity ?? 0.65) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="0.95"
                        step="0.05"
                        value={theme.glassOpacity ?? 0.65}
                        onChange={(e) => updateTheme({ glassOpacity: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                      />
                    </div>

                    {/* Corner Radius */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Corner Rounding</label>
                        <span className="font-mono text-xs text-emerald-400">{theme.borderRadius ?? 16}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="2"
                        value={theme.borderRadius ?? 16}
                        onChange={(e) => updateTheme({ borderRadius: parseInt(e.target.value, 10) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-2xl border border-white/10 bg-slate-950/30 space-y-6">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-400" />
                      Studio Typography
                    </h4>
                    
                    <div className="space-y-4">
                      <CustomSelect
                        label="Interface Font Family"
                        value={theme.fontFamily ?? 'jakarta'}
                        onChange={(val) => updateTheme({ fontFamily: val as string })}
                        options={[
                          { label: 'Plus Jakarta Sans (Modern)', value: 'jakarta' },
                          { label: 'Inter (Geometric)', value: 'inter' },
                          { label: 'JetBrains Mono (Technical)', value: 'mono' },
                          { label: 'System Default (Native)', value: 'sans' },
                        ]}
                      />

                      <CustomSelect
                        label="Interface Font Weight"
                        value={theme.fontWeight ?? '600'}
                        onChange={(val) => updateTheme({ fontWeight: val as string })}
                        options={[
                          { label: 'Light', value: '300' },
                          { label: 'Regular', value: '400' },
                          { label: 'Medium', value: '500' },
                          { label: 'Semi-Bold', value: '600' },
                          { label: 'Bold', value: '700' },
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {/* Color & Accent Column */}
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-2xl border border-white/10 bg-slate-950/30 space-y-6">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-cyan-400" />
                      Accent Color & Glow
                    </h4>

                    {/* Accent Color Presets */}
                    <div className="grid grid-cols-2 gap-3">
                      {(Object.keys(ACCENT_PRESETS) as AccentColorPreset[]).map((presetKey) => {
                        const meta = ACCENT_PRESETS[presetKey];
                        const isSelected = theme.accentColor === presetKey;
                        return (
                          <button
                            key={presetKey}
                            onClick={() => updateTheme({ accentColor: presetKey })}
                            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected ? 'bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/30' : 'bg-slate-900/40 border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div 
                                className="w-3 h-3 rounded-full shrink-0 shadow-sm" 
                                style={{ backgroundColor: presetKey === 'custom' ? theme.customAccentHex : meta.primaryHex }} 
                              />
                              <span className="text-[10px] font-bold text-slate-200 truncate capitalize">{meta.name}</span>
                            </div>
                            {isSelected && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Color Picker */}
                    {theme.accentColor === 'custom' && (
                      <div className="p-4 rounded-xl bg-slate-950/50 border border-white/10 space-y-4 animate-in slide-in-from-top-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom Primary Hex</label>
                          <span className="font-mono text-xs text-white uppercase">{theme.customAccentHex}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="color"
                            value={theme.customAccentHex}
                            onChange={(e) => updateTheme({ customAccentHex: e.target.value })}
                            className="w-12 h-12 rounded-xl border-none bg-transparent cursor-pointer p-0 overflow-hidden"
                          />
                          <input
                            type="text"
                            value={theme.customAccentHex}
                            onChange={(e) => updateTheme({ customAccentHex: e.target.value })}
                            className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    )}

                    {/* Glow Intensity */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accent Glow Intensity</label>
                        <span className="font-mono text-xs text-indigo-400">{Math.round((theme.glowIntensity ?? 0.35) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={theme.glowIntensity ?? 0.35}
                        onChange={(e) => updateTheme({ glowIntensity: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-2xl border border-white/10 bg-slate-950/30 space-y-6">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      Visual Effects
                    </h4>
                    
                    <div className="space-y-2">
                      <CustomSelect
                        label="Gradient Style"
                        value={theme.gradientPreset ?? 'linear'}
                        onChange={(val) => updateTheme({ gradientPreset: val as any })}
                        options={[
                          { label: 'Linear Evolution', value: 'linear' },
                          { label: 'Radial Pulsar', value: 'radial' },
                          { label: 'Holographic Mesh', value: 'mesh' },
                          { label: 'Solid Minimalist', value: 'none' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                    TTML Configuration
                  </h3>
                  <p className="text-sm text-slate-400">Refine the underlying TTML engine and metadata.</p>
                </div>
              </div>

              {/* 120Hz Mode */}
              <div className="glass-card p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                    <Zap className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Ultra-Smooth 120Hz Rendering</h4>
                    <p className="text-xs text-slate-400">Enable high-frequency lyric updates for smooth transitions.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enable120HzMode ?? true}
                    onChange={(e) => setConfig(prev => ({ ...prev, enable120HzMode: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Track Title</label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Author / Artist</label>
                  <input
                    type="text"
                    value={config.author}
                    onChange={(e) => setConfig(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              {/* Animation & Transitions */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 bg-slate-950/30 space-y-6">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  UI Animations & Transitions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Animation Speed</label>
                      <span className="font-mono text-xs text-amber-400">{config.animationSpeed ?? 1.0}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={config.animationSpeed ?? 1.0}
                      onChange={(e) => updateConfig({ animationSpeed: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transition Scale</label>
                      <span className="font-mono text-xs text-amber-400">{config.transitionScale ?? 1.0}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={config.transitionScale ?? 1.0}
                      onChange={(e) => updateConfig({ transitionScale: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Audio Visualizer */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 bg-slate-950/30 space-y-6">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-cyan-400" />
                  Audio Visualizer Engine
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <CustomSelect
                      label="Visualizer Style"
                      value={config.visualizerStyle ?? 'bars'}
                      onChange={(val) => updateConfig({ visualizerStyle: val as any })}
                      options={[
                        { label: 'Acoustic Bars', value: 'bars' },
                        { label: 'Fluid Waveform', value: 'wave' },
                        { label: 'Pulse Circles', value: 'circles' },
                        { label: 'Disabled', value: 'none' },
                      ]}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Waveform Sensitivity</label>
                      <span className="font-mono text-xs text-cyan-400">{config.visualizerSensitivity ?? 5}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={config.visualizerSensitivity ?? 5}
                      onChange={(e) => updateConfig({ visualizerSensitivity: parseInt(e.target.value, 10) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Subtitle Styling */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 bg-slate-950/30 space-y-6">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  Subtitle Font & Spacing
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <CustomSelect
                      label="Font Weight"
                      value={config.subtitleFontWeight ?? '600'}
                      onChange={(val) => updateConfig({ subtitleFontWeight: val as string })}
                      options={[
                        { label: 'Light (300)', value: '300' },
                        { label: 'Regular (400)', value: '400' },
                        { label: 'Semi-Bold (600)', value: '600' },
                        { label: 'Bold (700)', value: '700' },
                        { label: 'Extra-Bold (800)', value: '800' },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <CustomSelect
                      label="Letter Spacing"
                      value={config.subtitleLetterSpacing ?? '0px'}
                      onChange={(val) => updateConfig({ subtitleLetterSpacing: val as string })}
                      options={[
                        { label: 'Tight (-0.5px)', value: '-0.5px' },
                        { label: 'Normal (0px)', value: '0px' },
                        { label: 'Loose (1px)', value: '1px' },
                        { label: 'Wide (2px)', value: '2px' },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Audio Performance */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 bg-slate-950/30 space-y-6">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  Audio Engine & Buffering
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audio Buffer Duration</label>
                    <span className="font-mono text-xs text-emerald-400">{config.audioBufferDuration ?? 20}s</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={config.audioBufferDuration ?? 20}
                    onChange={(e) => updateConfig({ audioBufferDuration: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <p className="text-[10px] text-slate-500">Higher buffer durations provide more stability for complex background extraction tasks but use more memory.</p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-white/10 bg-slate-950/30 space-y-6">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  Multilingual Options
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="emitPerWordLang"
                      checked={config.emitPerWordLang ?? true}
                      onChange={(e) => setConfig(prev => ({ ...prev, emitPerWordLang: e.target.checked }))}
                      className="w-4 h-4 accent-purple-500 rounded"
                    />
                    <label htmlFor="emitPerWordLang" className="text-sm text-slate-300">
                      Emit <code className="text-purple-300">xml:lang</code> for code-switched segments.
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableMultiAgent"
                      checked={config.enableMultiAgent ?? true}
                      onChange={(e) => setConfig(prev => ({ ...prev, enableMultiAgent: e.target.checked }))}
                      className="w-4 h-4 accent-cyan-500 rounded"
                    />
                    <label htmlFor="enableMultiAgent" className="text-sm text-slate-300">
                      Enable Multi-Singer Agent definitions.
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableBackgroundVocals"
                      checked={config.enableBackgroundVocals ?? true}
                      onChange={(e) => setConfig(prev => ({ ...prev, enableBackgroundVocals: e.target.checked }))}
                      className="w-4 h-4 accent-indigo-500 rounded"
                    />
                    <label htmlFor="enableBackgroundVocals" className="text-sm text-slate-300">
                      Detect and format background vocal layers.
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <CustomSelect
                    label="Time Format"
                    value={config.timeFormat}
                    onChange={(val) => setConfig(prev => ({ ...prev, timeFormat: val as any }))}
                    options={[
                      { label: '00:00:00.000 (Standard Clock)', value: 'clock' },
                      { label: '1.250s (Metric Seconds)', value: 'seconds' },
                      { label: '00:00:00:15 (SMPTE Frames)', value: 'frames' },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frame Rate (FPS)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={config.frameRate}
                    onChange={(e) => setConfig(prev => ({ ...prev, frameRate: parseInt(e.target.value, 10) || 30 }))}
                    className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Languages className="w-5 h-5 text-emerald-400" />
                  Interface Language
                </h3>
                <p className="text-sm text-slate-400">Select your preferred interface language.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SUPPORTED_UI_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setUiLanguage(lang.code)}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      uiLanguage === lang.code
                        ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div>
                        <span className="block text-sm font-bold text-slate-200">{lang.nativeName}</span>
                        <span className="block text-xs text-slate-400">{lang.label}</span>
                      </div>
                    </div>
                    {uiLanguage === lang.code && <Check className="w-5 h-5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-amber-400" />
                  Storage & History
                </h3>
                <p className="text-sm text-slate-400">Manage your local analysis history and cached data.</p>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-4">
                <div className="flex items-center gap-3 text-red-400">
                  <RotateCcw className="w-5 h-5" />
                  <span className="font-bold">Dangerous Actions</span>
                </div>
                <p className="text-xs text-slate-400">Clearing history will permanently remove all saved analysis results from this browser.</p>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Clear All Local Cache & History
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  </div>
);
};
