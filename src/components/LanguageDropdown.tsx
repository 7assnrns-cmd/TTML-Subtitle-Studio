import React from 'react';
import { POPULAR_LANGUAGES } from '../utils/languages';
import { CustomSelect } from './CustomSelect';

interface LanguageDropdownProps {
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  uiLanguage: string;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  selectedLanguage,
  onSelectLanguage,
}) => {
  const options = POPULAR_LANGUAGES.map(lang => ({
    label: `${lang.name} (${lang.nativeName})`,
    value: lang.code,
    icon: <span className="text-sm">{lang.flag}</span>
  }));

  return (
    <div className="w-full">
      <CustomSelect
        value={selectedLanguage}
        onChange={(val) => onSelectLanguage(val as string)}
        options={options}
        placeholder="Select Language"
      />
    </div>
  );
};
