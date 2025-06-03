
import { Activity } from 'lucide-react';
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
    <div className="p-8 text-center space-y-6">
      {/* Modern animated fallback image container */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-full blur-xl animate-pulse"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
          <img 
            src="/assets/fallback-logo.svg" 
            alt="No live matches available"
            className="h-20 w-20 mx-auto object-contain opacity-60 transition-all duration-300 hover:opacity-80 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/fallback-logo.png';
            }}
          />
        </div>
      </div>

      {/* Modern icon with subtle animation */}
      <div className="relative">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-full">
          <Activity className="h-8 w-8 text-red-600 animate-pulse" />
        </div>
      </div>

      {/* Modern typography */}
      <div className="space-y-3">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {title}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <span>System active • Checking for live matches</span>
        </div>
      </div>

      {/* Modern call-to-action */}
      {showBackButton && onBackToHome && (
        <div className="pt-4">
          <Button 
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Activity className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default NoLiveMatchesEmpty;
