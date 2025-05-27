import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { safeSubstring } from '@/lib/dateUtils';

interface LeagueCollapseToggleProps {
  leagueName: string;
  countryName: string;
  leagueLogo?: string;
  matchCount: number;
  liveMatches: number;
  recentMatches: number;
  isExpanded: boolean;
  onToggle: () => void;
  isPopular?: boolean;
}

const LeagueCollapseToggle: React.FC<LeagueCollapseToggleProps> = ({
  leagueName,
  countryName,
  leagueLogo,
  matchCount,
  liveMatches = 0,
  recentMatches = 0,
  isExpanded,
  onToggle,
  isPopular = false
}) => {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-200"
    >
      <div className="flex items-center gap-3">
        {/* League Logo */}
        <img
          src={leagueLogo || '/assets/fallback-logo.svg'}
          alt={safeSubstring(leagueName, 0) || 'League'}
          className="w-5 h-5 object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== '/assets/fallback-logo.svg') {
              target.src = '/assets/fallback-logo.svg';
            }
          }}
        />

        {/* League Info */}
        <div className="flex flex-col items-start">
          <span className="font-medium text-sm text-gray-800">
            {safeSubstring(leagueName, 0)}{countryName && countryName !== 'Unknown' ? safeSubstring(countryName, 0) : ''}
          </span>
          <span className="text-xs text-gray-500">
            {countryName || 'Unknown Country'}
          </span>
        </div>

        {/* Match Count */}
        <span className="text-xs text-gray-500 ml-2">
          {matchCount} {matchCount === 1 ? 'match' : 'matches'}
        </span>

        {/* Popular Badge */}
        {isPopular && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            Popular
          </span>
        )}

        {/* Live/Recent badges */}
        {liveMatches > 0 && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold animate-pulse">
            {liveMatches} LIVE
          </span>
        )}
        {recentMatches > 0 && !liveMatches && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
            {recentMatches} Recent
          </span>
        )}
      </div>

      {/* Expand/Collapse Icon */}
      {isExpanded ? (
        <ChevronUp className="h-4 w-4 text-gray-500" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-500" />
      )}
    </button>
  );
};

export default LeagueCollapseToggle;