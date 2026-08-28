export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  flag: string;
}

export const POPULAR_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin', flag: '🇺🇸' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', script: 'Kanji / Kana', flag: '🇯🇵' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', script: 'Latin', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', script: 'Latin', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', script: 'Latin', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', script: 'Arabic', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文 (普通话)', script: 'Simplified / Traditional', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', script: 'Hangul', flag: '🇰🇷' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', script: 'Latin', flag: '🇵🇹' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', script: 'Latin', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', script: 'Cyrillic', flag: '🇷🇺' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', script: 'Latin', flag: '🇹🇷' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', script: 'Latin (Quốc Ngữ)', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', script: 'Latin', flag: '🇮🇩' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', script: 'Thai', flag: '🇹🇭' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', script: 'Latin', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', script: 'Latin', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', script: 'Latin', flag: '🇸🇪' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', script: 'Cyrillic', flag: '🇺🇦' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', script: 'Greek', flag: '🇬🇷' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', script: 'Hebrew', flag: '🇮🇱' },
  { code: 'tl', name: 'Tagalog / Filipino', nativeName: 'Tagalog', script: 'Latin', flag: '🇵🇭' },
  { code: 'yue', name: 'Cantonese', nativeName: '廣東話', script: 'Traditional Han', flag: '🇭🇰' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali', flag: '🇧🇩' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Arabic', flag: '🇵🇰' },
  { code: 'fa', name: 'Persian (Farsi)', nativeName: 'فارسی', script: 'Persian-Arabic', flag: '🇮🇷' },
];

export function getLanguageLabel(code: string): string {
  const clean = code.toLowerCase().trim();
  const match = POPULAR_LANGUAGES.find((l) => l.code === clean);
  if (match) return `${match.name} (${match.nativeName})`;
  return code.toUpperCase();
}
