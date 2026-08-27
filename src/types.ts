export interface TTMAgent {
  id: string; // e.g. "v1", "v2", "v_bg"
  name: string; // e.g. "Lead Singer", "Singer 2", "Backing Vocals"
  type: 'person' | 'group' | 'other';
  role?: 'lead' | 'featured' | 'background' | 'harmony' | 'adlib';
  color?: string; // Hex color for UI badge/karaoke highlight
}

export interface WordTiming {
  id: string;
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
  duration: number; // in seconds
  pauseAfter: number; // pause until next word in seconds (0 if none)
  pauseType?: 'short' | 'medium' | 'long' | 'sentence' | 'syntactic' | 'none';
  confidence?: number;
  lang?: string; // ISO language code (e.g. 'en', 'ja', 'ar', 'es') for code-switching
  agentId?: string; // Singer / Agent ID (e.g. "v1", "v2", "v_bg")
  role?: 'lead' | 'featured' | 'background' | 'harmony' | 'adlib';
  isBackground?: boolean;
}

export interface ParagraphSegment {
  id: string;
  text: string;
  start: number;
  end: number;
  words: WordTiming[];
  speaker?: string;
  agentId?: string; // Singer / Agent ID (e.g. "v1", "v2", "v_bg")
  role?: 'lead' | 'featured' | 'background' | 'harmony' | 'adlib';
  isBackground?: boolean; // True if this is a secondary vocal layer, harmony, or background ad-lib
  lang?: string; // Language of paragraph if mixed
  songPart?: string; // Apple Music song part (e.g. "Verse", "Chorus", "Bridge", "Outro", "Intro")
}

export interface AudioAnalysisResult {
  title: string;
  language: string;
  detectedLanguages?: string[];
  isCodeSwitched?: boolean;
  duration: number;
  paragraphs: ParagraphSegment[];
  words: WordTiming[];
  pauses: PauseEvent[];
  stats: TimingStats;
  rawTranscript: string;
}

export interface PauseEvent {
  id: string;
  start: number;
  end: number;
  duration: number;
  prevWord: string;
  nextWord: string;
  type: 'breath' | 'syntactic' | 'hesitation' | 'sentence-break';
}

export interface TimingStats {
  totalWords: number;
  totalSpeechDuration: number;
  totalPauseDuration: number;
  pauseCount: number;
  wordsPerMinute: number;
  speechToSilenceRatio: number;
  averageWordDuration: number;
  longestPause: number;
  detectedLanguagesCount?: number;
}

export type TTMLTimeFormat = 'clock' | 'seconds' | 'frames';

export type TTMLProfile = 'apple-music' | 'w3c-ttml1' | 'w3c-ttml2' | 'imsc1' | 'ebu-tt';

export type AccentColorPreset = 'cyan' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'custom';

export interface ThemeCustomizerConfig {
  blurIntensity: number; // in px, range 0 - 32px (default 16)
  borderOpacity: number; // in range 0.02 - 0.40 (default 0.12)
  glassOpacity: number;  // in range 0.30 - 0.95 (default 0.65)
  accentColor: AccentColorPreset;
  customAccentHex: string;
}

export interface TTMLConfig {
  profile: TTMLProfile;
  timeFormat: TTMLTimeFormat;
  frameRate: number;
  language: string;
  title: string;
  author: string;
  fontSize: string;
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  activeWordColor: string;
  textAlign: 'left' | 'center' | 'right';
  includePauseMetadata: boolean;
  pauseThreshold: number; // in seconds (e.g. 0.2s)
  splitSentencesOnLongPauses: boolean;
  enableTextOutline: boolean;
  emitPerWordLang?: boolean; // Emit xml:lang on code-switched <span> or <p> tags
  enable120HzMode?: boolean; // 120Hz high refresh rate hardware acceleration mode
  themeConfig?: ThemeCustomizerConfig; // User-adjustable glassmorphism & accent theme
  agents?: TTMAgent[]; // Defined singers/agents in TTML head metadata
  defaultAgentId?: string; // Default agent ID (e.g. "v1")
  enableMultiAgent?: boolean; // Emit <ttm:agent> and ttm:agent attributes in TTML
  enableBackgroundVocals?: boolean; // Format secondary vocal lines as background/harmonies
}

