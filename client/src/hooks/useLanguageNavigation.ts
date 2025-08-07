
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';

export const useLanguageNavigation = () => {
  const [, navigate] = useLocation();
  const { currentLanguage } = useLanguage();
  
  const navigateWithLanguage = (path: string) => {
    const fullPath = path.startsWith('/') ? `/${currentLanguage}${path}` : `/${currentLanguage}/${path}`;
    navigate(fullPath);
  };

  const getLinkWithLanguage = (path: string) => {
    return path.startsWith('/') ? `/${currentLanguage}${path}` : `/${currentLanguage}/${path}`;
  };

  const getCurrentLanguageFromUrl = (): string | null => {
    const [location] = useLocation();
    const supportedLanguages = ['en', 'es', 'zh-hk', 'zh', 'de', 'it', 'pt'];
    const pathParts = location.split('/').filter(part => part);
    
    if (pathParts.length > 0 && supportedLanguages.includes(pathParts[0])) {
      return pathParts[0];
    }
    return null;
  };

  return {
    navigateWithLanguage,
    getLinkWithLanguage,
    getCurrentLanguageFromUrl
  };
};
