
import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import MyCircularFlag from './MyCircularFlag';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  country: string;
}

const languageOptions: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', country: 'United Kingdom' },
  { code: 'en-us', name: 'English (US)', nativeName: 'English (US)', country: 'United States' },
  { code: 'es', name: 'Spanish (Spain)', nativeName: 'Español (España)', country: 'Spain' },
  { code: 'es-mx', name: 'Spanish (Mexico)', nativeName: 'Español (Latinoamérica)', country: 'Mexico' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', country: 'Portugal' },
  { code: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', country: 'Brazil' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文(简体)', country: 'China' },
  { code: 'zh-hk', name: 'Chinese (Hong Kong)', nativeName: '中文(香港)', country: 'Hong Kong' },
  { code: 'zh-tw', name: 'Chinese (Taiwan)', nativeName: '中文(台灣)', country: 'Taiwan' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', country: 'Germany' },
  { code: 'de-at', name: 'German (Austria)', nativeName: 'Deutsch (Österreich)', country: 'Austria' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', country: 'Italy' },
  { code: 'fr', name: 'French', nativeName: 'Français', country: 'France' }
];

const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const { changeLanguageInUrl } = useLanguageNavigation();
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = languageOptions.find(opt => opt.code === currentLanguage) || languageOptions[0];

  const handleLanguageChange = (languageCode: string) => {
    setLanguage(languageCode);
    changeLanguageInUrl(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Current Language Display */}
      <button
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MyCircularFlag
          teamName={currentOption.country}
          size="20px"
          className=""
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentOption.nativeName}
        </span>
        {isOpen ? (
          <ChevronUpIcon className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Language Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              語言 / Language
            </div>
            <div className="space-y-1 mt-2">
              {languageOptions.map((option) => (
                <button
                  key={option.code}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${
                    option.code === currentLanguage
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => handleLanguageChange(option.code)}
                >
                  <MyCircularFlag
                    teamName={option.country}
                    size="20px"
                    className=""
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{option.nativeName}</div>
                    {option.name !== option.nativeName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {option.name}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSelector;
