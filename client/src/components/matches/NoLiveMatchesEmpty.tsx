
import { Button } from '@/components/ui/button';

interface NoLiveMatchesEmptyProps {
  onBackToHome?: () => void;
  showBackButton?: boolean;
  title?: string;
  description?: string;
}

const NoLiveMatchesEmpty = ({ 
  onBackToHome, 
  showBackButton = true,
  title = "No Live Matches",
  description = "There are no matches currently in play. Our system is continuously monitoring for live matches."
}: NoLiveMatchesEmptyProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-100 min-h-[400px]">
      {/* Stadium seats illustration */}
      <div className="mb-8">
        <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stadium structure */}
          <path 
            d="M10 60 L10 20 Q10 15 15 15 L105 15 Q110 15 110 20 L110 60 L95 70 L25 70 Z" 
            fill="#6B7280" 
            stroke="#4B5563" 
            strokeWidth="2"
          />
          
          {/* Seats */}
          <circle cx="30" cy="45" r="8" fill="#EA580C" />
          <circle cx="50" cy="45" r="8" fill="#EA580C" />
          <circle cx="70" cy="45" r="8" fill="#EA580C" />
          <circle cx="90" cy="45" r="8" fill="#EA580C" />
          
          {/* Stadium roof structure */}
          <path 
            d="M5 20 Q60 5 115 20" 
            stroke="#4B5563" 
            strokeWidth="2" 
            fill="none"
          />
          <line x1="15" y1="20" x2="12" y2="15" stroke="#4B5563" strokeWidth="2" />
          <line x1="105" y1="20" x2="108" y2="15" stroke="#4B5563" strokeWidth="2" />
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
          onClick={onBackToHome}
          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full text-base font-medium shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          See All Matches
        </Button>
      )}
    </div>
  );
};

export default NoLiveMatchesEmpty;
