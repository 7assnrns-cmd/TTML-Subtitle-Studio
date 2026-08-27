import React from 'react';
import { Activity, Clock, Mic, VolumeX, Zap, Award } from 'lucide-react';
import { TimingStats } from '../types';
import { UILanguage, getTranslation } from '../utils/i18n';

interface TimingAnalyticsProps {
  stats: TimingStats;
  duration: number;
  uiLanguage: UILanguage;
}

export const TimingAnalytics: React.FC<TimingAnalyticsProps> = ({ stats, duration, uiLanguage }) => {
  const t = (key: string) => getTranslation(uiLanguage, key);

  const speechRatioPercent = duration > 0
    ? Math.round((stats.totalSpeechDuration / duration) * 100)
    : 80;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Metric 1: Total Words */}
      <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>{t('totalWordsMetric')}</span>
          <Mic className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-slate-100 font-mono">{stats.totalWords}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{t('tokens')} extracted</div>
        </div>
      </div>

      {/* Metric 2: Speaking Rate WPM */}
      <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>{t('wpmMetric')}</span>
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-amber-300 font-mono">{stats.wordsPerMinute} <span className="text-xs font-sans text-slate-400">WPM</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {stats.wordsPerMinute > 150 ? 'Brisk Pace' : stats.wordsPerMinute > 110 ? 'Normal Cadence' : 'Deliberate'}
          </div>
        </div>
      </div>

      {/* Metric 3: Total Speech Time */}
      <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>{t('speechDurationMetric')}</span>
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-emerald-400 font-mono">{stats.totalSpeechDuration.toFixed(1)}s</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{speechRatioPercent}% of audio</div>
        </div>
      </div>

      {/* Metric 4: Pauses & Silence */}
      <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>{t('pauseDurationMetric')}</span>
          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-rose-400 font-mono">{stats.pauseCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats.totalPauseDuration.toFixed(1)}s total gaps</div>
        </div>
      </div>

      {/* Metric 5: Average Word Duration */}
      <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>{t('avgWordDurationMetric')}</span>
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-cyan-400 font-mono">{stats.averageWordDuration.toFixed(2)}s</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mean phonation</div>
        </div>
      </div>

      {/* Metric 6: Longest Silence Gap */}
      <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>{t('longestPauseMetric')}</span>
          <Award className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-purple-300 font-mono">{stats.longestPause.toFixed(2)}s</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Max silent interval</div>
        </div>
      </div>
    </div>
  );
};
