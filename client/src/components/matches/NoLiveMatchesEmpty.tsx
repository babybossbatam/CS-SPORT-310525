
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
  description = "It doesn't happen often, but there are no live matches being played right now. Check it out later"
}: NoLiveMatchesEmptyProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 bg-gray-50 min-h-[400px]">
      {/* Football goal/bench illustration */}
      <div className="relative mb-4">
        <svg 
          width="120" 
          height="80" 
          viewBox="0 0 120 80" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto"
        >
          {/* Goal frame */}
          <path 
            d="M20 60 L20 20 Q20 15 25 15 L95 15 Q100 15 100 20 L100 60" 
            stroke="#333" 
            strokeWidth="3" 
            fill="none"
          />
          
          {/* Goal posts */}
          <line x1="20" y1="60" x2="20" y2="65" stroke="#333" strokeWidth="3"/>
          <line x1="100" y1="60" x2="100" y2="65" stroke="#333" strokeWidth="3"/>
          
          {/* Bench seats (orange circles) */}
          <circle cx="35" cy="55" r="6" fill="#FF6B35"/>
          <circle cx="50" cy="55" r="6" fill="#FF6B35"/>
          <circle cx="65" cy="55" r="6" fill="#FF6B35"/>
          <circle cx="80" cy="55" r="6" fill="#FF6B35"/>
        </svg>
      </div>

      {/* Main message */}
      <div className="space-y-3 max-w-md">
        <p className="text-gray-700 text-lg leading-relaxed font-medium">
          It doesn't happen often, but there are no live matches being played right now.
        </p>
        <p className="text-gray-600 text-base">
          Check it out later
        </p>
      </div>

      {/* See All Matches button */}
      <div className="pt-2">
        <Button 
          onClick={onBackToHome}
          className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          See All Matches
        </Button>
      </div>
    </div>
  );
};

export default NoLiveMatchesEmpty;
