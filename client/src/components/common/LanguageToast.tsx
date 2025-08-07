
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const LanguageToast: React.FC = () => {
  // Add error boundary for when LanguageProvider is not available
  let currentLanguage: string;
  try {
    const languageContext = useLanguage();
    currentLanguage = languageContext.currentLanguage;
  } catch (error) {
    // If LanguageProvider is not available, don't render the toast
    return null;
  }
  const [showToast, setShowToast] = useState(false);
  const [previousLanguage, setPreviousLanguage] = useState(currentLanguage);

  const languageNames: { [key: string]: string } = {
    'en': 'English',
    'es': 'Español',
    'fr': 'Français', 
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português'
  };

  useEffect(() => {
    if (currentLanguage !== previousLanguage) {
      setShowToast(true);
      setPreviousLanguage(currentLanguage);
      
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentLanguage, previousLanguage]);

  if (!showToast) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
        <span className="text-sm font-medium">
          Language changed to {languageNames[currentLanguage]}
        </span>
      </div>
    </div>
  );
};

export default LanguageToast;
