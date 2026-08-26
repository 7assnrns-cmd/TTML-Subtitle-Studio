import React from 'react';
import { X, Sliders, Check, Globe, Music2, Languages } from 'lucide-react';
import { TTMLConfig } from '../types';
import { UILanguage, SUPPORTED_UI_LANGUAGES, getTranslation } from '../utils/i18n';

interface TTMLSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TTMLConfig;
  setConfig: React.Dispatch<React.SetStateAction<TTMLConfig>>;
  uiLanguage: UILanguage;
  setUiLanguage?: (lang: UILanguage) => void;
  onSelectUILanguage?: (lang: UILanguage) => void;
}

export const TTMLSettingsModal: React.FC<TTMLSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  setConfig,
  uiLanguage,
  setUiLanguage,
  onSelectUILanguage,
}) => {
  if (!isOpen) return null;

  const t = (key: string) => getTranslation(uiLanguage, key);

  const handleLanguageChange = (lang: UILanguage) => {
    if (setUiLanguage) setUiLanguage(lang);
    if (onSelectUILanguage) onSelectUILanguage(lang);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-100">
              {t('settingsTitle')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-300">
          {/* UI Language Localization Section (Feature 1) */}
          <div className="space-y-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <h4 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              {t('uiLanguage')}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_UI_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                    uiLanguage === lang.code
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 font-semibold'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </span>
                  {uiLanguage === lang.code && <Check className="w-3 h-3 text-cyan-400" />}
                </button>
              ))}
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
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">{t('authorLabel')}</label>
                <input
                  type="text"
                  value={config.author}
                  onChange={(e) => setConfig((prev) => ({ ...prev, author: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">{t('primaryLangLabel')}</label>
              <select
                value={config.language}
                onChange={(e) => setConfig((prev) => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
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
          <div className="space-y-3 pt-2 border-t border-slate-800">
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

          {/* Time & Format */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
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
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
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
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer"
          >
            {t('saveClose')}
          </button>
        </div>
      </div>
    </div>
  );
};
