
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';

export const useLanguageNavigation = () => {
  const [location, navigate] = useLocation();
  const { currentLanguage } = useLanguage();
  
  const navigateWithLanguage = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const fullPath = `/${currentLanguage}${cleanPath === '/' ? '' : cleanPath}`;
    navigate(fullPath);
  };

  const getLinkWithLanguage = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${currentLanguage}${cleanPath === '/' ? '' : cleanPath}`;
  };

  const getCurrentLanguageFromUrl = (): string | null => {
    const supportedLanguages = ['en', 'en-us', 'es', 'es-mx', 'zh-hk', 'zh', 'zh-tw', 'de', 'de-at', 'it', 'pt', 'pt-br', 'fr'];
    const pathParts = location.split('/').filter(part => part);
    
    if (pathParts.length > 0 && supportedLanguages.includes(pathParts[0])) {
      return pathParts[0];
    }
    return null;
  };

  const getPathWithoutLanguage = (): string => {
    const supportedLanguages = ['en', 'en-us', 'es', 'es-mx', 'zh-hk', 'zh', 'zh-tw', 'de', 'de-at', 'it', 'pt', 'pt-br', 'fr'];
    const pathParts = location.split('/').filter(part => part);
    
    if (pathParts.length > 0 && supportedLanguages.includes(pathParts[0])) {
      // Remove language part and return the rest
      const remainingPath = pathParts.slice(1).join('/');
      return remainingPath ? `/${remainingPath}` : '/';
    }
    return location;
  };

  const changeLanguageInUrl = (newLanguage: string) => {
    const currentPathWithoutLang = getPathWithoutLanguage();
    const newPath = `/${newLanguage}${currentPathWithoutLang === '/' ? '' : currentPathWithoutLang}`;
    navigate(newPath);
  };

  return {
    navigateWithLanguage,
    getLinkWithLanguage,
    getCurrentLanguageFromUrl,
    getPathWithoutLanguage,
    changeLanguageInUrl
  };
};
