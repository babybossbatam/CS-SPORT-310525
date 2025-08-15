import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface NoLiveMatchesEmptyProps {
  onBackToHome?: () => void;
  showBackButton?: boolean;
  title?: string;
  description?: string;
  onDeactivateLiveFilter?: () => void;
  setLiveFilterActive?: (active: boolean) => void;
}

export const NoLiveMatchesEmpty = ({ 
  onBackToHome, 
  showBackButton = true,
  title,
  description,
  onDeactivateLiveFilter,
  setLiveFilterActive
}: NoLiveMatchesEmptyProps) => {
  const { translations, currentLanguage } = useLanguage();
  
  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-100 min-h-[400px]">
      {/* No matches illustration */}
      <div className="mb-8">
        <img 
          src="/nomatch.png" 
          alt="No matches available" 
          className="w-32 h-32 mx-auto object-contain filter-none"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>

      {/* Text content */}
      <div className="mb-8 max-w-md">
        <p className="text-gray-600 text-lg leading-relaxed">
          {t('no_live_matches_main')}
        </p>
        <p className="text-gray-500 text-base mt-2">
          {t('check_later')}
        </p>
      </div>

      {/* Call-to-action button */}
      {showBackButton && (
        <Button 
          onClick={() => {
            if (setLiveFilterActive) {
              setLiveFilterActive(false);
            }
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full text-base font-medium shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          {t('see_all_matches')}
        </Button>
      )}
    </div>
  );
};

export default NoLiveMatchesEmpty;