
import { Button } from '@/components/ui/button';

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
  title = "No Live Matches",
  description = "There are no matches currently in play. Our system is continuously monitoring for live matches.",
  onDeactivateLiveFilter,
  setLiveFilterActive
}: NoLiveMatchesEmptyProps) => {
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
          It doesn't happen often, but there are no live matches being played right now.
        </p>
        <p className="text-gray-500 text-base mt-2">
          Check it out later
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
          See All Matches
        </Button>
      )}
    </div>
  );
};

export default NoLiveMatchesEmpty;
