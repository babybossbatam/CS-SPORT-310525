
import { Button } from '@/components/ui/button';

interface NoLiveMatchesEmptyProps {
  onBackToHome?: () => void;
  showBackButton?: boolean;
  title?: string;
  description?: string;
  onDeactivateLiveFilter?: () => void;
}

const NoLiveMatchesEmpty = ({ 
  onBackToHome, 
  showBackButton = true,
  title = "No Live Matches",
  description = "There are no matches currently in play. Our system is continuously monitoring for live matches.",
  onDeactivateLiveFilter
}: NoLiveMatchesEmptyProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-100 min-h-[400px]">
      {/* Stadium seats illustration */}
      <div className="mb-8">
        <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stadium curved roof structure */}
          <path 
            d="M15 25 Q60 10 105 25 L105 35 Q60 20 15 35 Z" 
            fill="#4B5563" 
            stroke="#374151" 
            strokeWidth="1"
          />
          
          {/* Stadium back wall */}
          <path 
            d="M15 35 L15 65 L105 65 L105 35" 
            fill="#6B7280" 
            stroke="#4B5563" 
            strokeWidth="1"
          />
          
          {/* Orange/Red seats in rows */}
          <circle cx="25" cy="50" r="6" fill="#EA580C" />
          <circle cx="40" cy="50" r="6" fill="#EA580C" />
          <circle cx="55" cy="50" r="6" fill="#EA580C" />
          <circle cx="70" cy="50" r="6" fill="#EA580C" />
          <circle cx="85" cy="50" r="6" fill="#EA580C" />
          <circle cx="100" cy="50" r="6" fill="#EA580C" />
          
          {/* Front edge/barrier */}
          <line x1="15" y1="65" x2="105" y2="65" stroke="#374151" strokeWidth="2" />
        </svg>
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
      {showBackButton && onBackToHome && (
        <Button 
          onClick={() => {
            if (onDeactivateLiveFilter) {
              onDeactivateLiveFilter();
            }
            onBackToHome();
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
