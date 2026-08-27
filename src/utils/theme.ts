import { AccentColorPreset, ThemeCustomizerConfig } from '../types';

export interface AccentPresetMeta {
  id: AccentColorPreset;
  name: string;
  primaryHex: string;
  secondaryHex: string;
  glowHex: string;
  textHex: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  previewGradient: string;
}

export const ACCENT_PRESETS: Record<AccentColorPreset, AccentPresetMeta> = {
  cyan: {
    id: 'cyan',
    name: 'Neon Cyan',
    primaryHex: '#06b6d4',
    secondaryHex: '#6366f1',
    glowHex: 'rgba(6, 182, 212, 0.35)',
    textHex: '#67e8f9',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
    badgeBorder: 'rgba(6, 182, 212, 0.40)',
    badgeText: '#67e8f9',
    previewGradient: 'from-cyan-500 to-indigo-500',
  },
  indigo: {
    id: 'indigo',
    name: 'Electric Violet',
    primaryHex: '#6366f1',
    secondaryHex: '#a855f7',
    glowHex: 'rgba(99, 102, 241, 0.35)',
    textHex: '#a5b4fc',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
    badgeBorder: 'rgba(99, 102, 241, 0.40)',
    badgeText: '#c7d2fe',
    previewGradient: 'from-indigo-500 to-purple-500',
  },
  emerald: {
    id: 'emerald',
    name: 'Cyber Emerald',
    primaryHex: '#10b981',
    secondaryHex: '#06b6d4',
    glowHex: 'rgba(16, 185, 129, 0.35)',
    textHex: '#6ee7b7',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.40)',
    badgeText: '#a7f3d0',
    previewGradient: 'from-emerald-500 to-teal-500',
  },
  amber: {
    id: 'amber',
    name: 'Solar Amber',
    primaryHex: '#f59e0b',
    secondaryHex: '#ef4444',
    glowHex: 'rgba(245, 158, 11, 0.35)',
    textHex: '#fcd34d',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.40)',
    badgeText: '#fde68a',
    previewGradient: 'from-amber-500 to-orange-500',
  },
  rose: {
    id: 'rose',
    name: 'Synthwave Rose',
    primaryHex: '#f43f5e',
    secondaryHex: '#ec4899',
    glowHex: 'rgba(244, 63, 94, 0.35)',
    textHex: '#fda4af',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    badgeBorder: 'rgba(244, 63, 94, 0.40)',
    badgeText: '#fecdd3',
    previewGradient: 'from-rose-500 to-pink-500',
  },
  purple: {
    id: 'purple',
    name: 'Deep Nebula',
    primaryHex: '#a855f7',
    secondaryHex: '#3b82f6',
    glowHex: 'rgba(168, 85, 247, 0.35)',
    textHex: '#d8b4fe',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: 'rgba(168, 85, 247, 0.40)',
    badgeText: '#e9d5ff',
    previewGradient: 'from-purple-500 to-blue-500',
  },
  custom: {
    id: 'custom',
    name: 'Custom Accent',
    primaryHex: '#06b6d4',
    secondaryHex: '#6366f1',
    glowHex: 'rgba(6, 182, 212, 0.35)',
    textHex: '#ffffff',
    badgeBg: 'rgba(255, 255, 255, 0.15)',
    badgeBorder: 'rgba(255, 255, 255, 0.30)',
    badgeText: '#ffffff',
    previewGradient: 'from-slate-700 to-slate-900',
  },
};

export const DEFAULT_THEME_CONFIG: ThemeCustomizerConfig = {
  blurIntensity: 16,
  borderOpacity: 0.12,
  glassOpacity: 0.65,
  accentColor: 'cyan',
  customAccentHex: '#06b6d4',
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace(/^#/, '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function applyThemeVariables(theme: ThemeCustomizerConfig = DEFAULT_THEME_CONFIG) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Glassmorphism parameters
  const blurVal = Math.min(36, Math.max(0, theme.blurIntensity ?? 16));
  const borderOp = Math.min(0.5, Math.max(0.02, theme.borderOpacity ?? 0.12));
  const glassOp = Math.min(0.95, Math.max(0.25, theme.glassOpacity ?? 0.65));

  root.style.setProperty('--glass-blur', `${blurVal}px`);
  root.style.setProperty('--glass-border-opacity', `${borderOp}`);
  root.style.setProperty('--glass-bg-opacity', `${glassOp}`);

  // Accent color variables
  const preset = ACCENT_PRESETS[theme.accentColor] || ACCENT_PRESETS.cyan;
  const primaryHex =
    theme.accentColor === 'custom' && theme.customAccentHex
      ? theme.customAccentHex
      : preset.primaryHex;

  const rgb = hexToRgb(primaryHex) || { r: 6, g: 182, b: 212 };
  const secRgb = hexToRgb(preset.secondaryHex) || { r: 99, g: 102, b: 241 };

  root.style.setProperty('--accent-primary', primaryHex);
  root.style.setProperty('--accent-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  root.style.setProperty('--accent-secondary', preset.secondaryHex);
  root.style.setProperty('--accent-secondary-rgb', `${secRgb.r}, ${secRgb.g}, ${secRgb.b}`);
  root.style.setProperty('--accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`);
  root.style.setProperty('--accent-text', preset.textHex || primaryHex);

  // Save to localStorage
  try {
    localStorage.setItem('ttml_studio_theme', JSON.stringify(theme));
  } catch {
    // Ignore localStorage errors in sandboxed environments
  }
}

export function loadSavedTheme(): ThemeCustomizerConfig {
  try {
    const saved = localStorage.getItem('ttml_studio_theme');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_THEME_CONFIG,
        ...parsed,
      };
    }
  } catch {
    // Fall back to default
  }
  return DEFAULT_THEME_CONFIG;
}
