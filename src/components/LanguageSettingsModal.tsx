import React from 'react';
import { X, Globe2, Check, Sparkles } from 'lucide-react';
import { UILanguage, SUPPORTED_UI_LANGUAGES, getTranslation } from '../utils/i18n';

interface LanguageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLanguage?: UILanguage;
  currentLanguage?: UILanguage;
  setUiLanguage?: (lang: UILanguage) => void;
  onSelectLanguage?: (lang: UILanguage) => void;
}

export const LanguageSettingsModal: React.FC<LanguageSettingsModalProps> = ({
  isOpen,
  onClose,
  uiLanguage,
  currentLanguage,
  setUiLanguage,
  onSelectLanguage,
}) => {
  if (!isOpen) return null;

  const activeLang: UILanguage = uiLanguage || currentLanguage || 'en';
  const t = (key: string) => getTranslation(activeLang, key);

  const handleSelect = (langCode: UILanguage) => {
    if (setUiLanguage) setUiLanguage(langCode);
    if (onSelectLanguage) onSelectLanguage(langCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {t('uiSettingsTitle')}
              </h3>
              <p className="text-[11px] text-slate-400">
                {t('selectUiLang')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Options */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-1 gap-2.5">
            {SUPPORTED_UI_LANGUAGES.map((lang) => {
              const isSelected = activeLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-950/80 to-cyan-950/60 border-cyan-500/60 text-white shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <span>{lang.nativeName}</span>
                        {lang.code === 'en' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Default / Primary
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {lang.label} &bull; [{lang.code.toUpperCase()}] &bull; {lang.dir.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Interface localization instantly updates all dashboard titles, inspector tables, karaoke subtitles, and code viewer controls.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            {t('saveClose')}
          </button>
        </div>
      </div>
    </div>
  );
};
