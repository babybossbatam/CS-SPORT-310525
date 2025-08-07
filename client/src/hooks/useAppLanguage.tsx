
import { useLanguage, useTranslation } from '@/contexts/LanguageContext';

export const useAppLanguage = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const changeLanguageByCountry = (countryName: string) => {
    const countryToLanguageMap: { [key: string]: string } = {
      'United States': 'en',
      'United Kingdom': 'en',
      'Spain': 'es',
      'France': 'fr',
      'Germany': 'de',
      'Italy': 'it',
      'Portugal': 'pt',
      'Brazil': 'pt',
      'Mexico': 'es',
      'Argentina': 'es'
    };

    const language = countryToLanguageMap[countryName];
    if (language) {
      setLanguage(language);
      return true;
    }
    return false;
  };

  const getCurrentLanguageInfo = () => {
    const languageInfo: { [key: string]: { name: string; country: string } } = {
      'en': { name: 'English', country: 'United States' },
      'es': { name: 'Español', country: 'Spain' },
      'fr': { name: 'Français', country: 'France' },
      'de': { name: 'Deutsch', country: 'Germany' },
      'it': { name: 'Italiano', country: 'Italy' },
      'pt': { name: 'Português', country: 'Portugal' }
    };

    return languageInfo[currentLanguage] || languageInfo['en'];
  };

  return {
    currentLanguage,
    setLanguage,
    changeLanguageByCountry,
    getCurrentLanguageInfo,
    t
  };
};
