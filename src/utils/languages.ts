export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  script: string;
}

export const POPULAR_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', script: 'Kanji / Kana' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', script: 'Latin' },
  { code: 'fr', name: 'French', nativeName: 'Français', script: 'Latin' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', script: 'Latin' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', script: 'Arabic' },
  { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文 (普通话)', script: 'Simplified / Traditional' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', script: 'Hangul' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', script: 'Latin' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', script: 'Latin' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', script: 'Cyrillic' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', script: 'Latin' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', script: 'Latin (Quốc Ngữ)' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', script: 'Latin' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', script: 'Thai' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', script: 'Latin' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', script: 'Latin' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', script: 'Latin' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', script: 'Cyrillic' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', script: 'Greek' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', script: 'Hebrew' },
  { code: 'tl', name: 'Tagalog / Filipino', nativeName: 'Tagalog', script: 'Latin' },
  { code: 'yue', name: 'Cantonese', nativeName: '廣東話', script: 'Traditional Han' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Arabic' },
  { code: 'fa', name: 'Persian (Farsi)', nativeName: 'فارسی', script: 'Persian-Arabic' },
];

export function getLanguageLabel(code: string): string {
  const clean = code.toLowerCase().trim();
  const match = POPULAR_LANGUAGES.find((l) => l.code === clean);
  if (match) return `${match.name} (${match.nativeName})`;
  return code.toUpperCase();
}
