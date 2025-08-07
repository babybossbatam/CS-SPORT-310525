
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import MyCircularFlag from './MyCircularFlag';

const LanguageIndicator: React.FC = () => {
  const { currentLanguage } = useLanguage();

  const languageToCountryMap: { [key: string]: string } = {
    'en': 'United States',
    'es': 'Spain', 
    'fr': 'France',
    'de': 'Germany',
    'it': 'Italy',
    'pt': 'Portugal'
  };

  const languageNames: { [key: string]: string } = {
    'en': 'English',
    'es': 'Español',
    'fr': 'Français', 
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português'
  };

  const countryName = languageToCountryMap[currentLanguage] || 'United States';
  const languageName = languageNames[currentLanguage] || 'English';

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <MyCircularFlag
        teamName={countryName}
        size="16px"
        className=""
      />
      <span>{languageName}</span>
    </div>
  );
};

export default LanguageIndicator;
