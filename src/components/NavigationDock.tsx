import React from 'react';
import { motion } from 'motion/react';
import { Home, Sparkles, History, Settings } from 'lucide-react';
import { UILanguage, getTranslation } from '../utils/i18n';

interface NavigationDockProps {
  currentTab: 'hub' | 'editor' | 'history' | 'settings';
  onSelectTab: (tab: 'hub' | 'editor' | 'history' | 'settings') => void;
  uiLanguage: UILanguage;
  hasData?: boolean;
}

export const NavigationDock: React.FC<NavigationDockProps> = ({
  currentTab,
  onSelectTab,
  uiLanguage,
  hasData = false,
}) => {
  const t = (key: string) => getTranslation(uiLanguage, key);

  const tabs = [
    { id: 'hub', label: 'Main Hub', icon: Home },
    { id: 'editor', label: 'Karaoke Studio', icon: Sparkles, badge: hasData },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4">
      <nav className="flex items-center gap-1 p-1.5 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
        {/* Sliding Active Indicator */}
        <div className="absolute inset-y-1.5 left-1.5 right-1.5 pointer-events-none">
          <div className="relative h-full w-full">
            <motion.div
              layoutId="activeTabPill"
              transition={{
                type: 'spring',
                bounce: 0.2,
                duration: 0.5,
              }}
              className="absolute h-full rounded-xl bg-gradient-to-r from-indigo-500/80 via-cyan-500/80 to-teal-500/80 shadow-[0_0_15px_rgba(56,189,248,0.3)] ring-1 ring-white/20"
              style={{
                width: `${100 / tabs.length}%`,
                left: `${(tabs.findIndex(t => t.id === currentTab) * 100) / tabs.length}%`,
              }}
            />
          </div>
        </div>

        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer z-10 whitespace-nowrap ${
              currentTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${currentTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{tab.label}</span>
            {'badge' in tab && tab.badge && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};
