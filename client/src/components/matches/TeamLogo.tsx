import React, { useState, useEffect } from 'react';

interface TeamLogoProps {
  logoUrl: string;
  teamName: string;
  teamId?: number | string;
  size?: 'sm' | 'md' | 'lg';
  isHome?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  winner?: boolean;
}

const TeamLogo: React.FC<TeamLogoProps> = ({ 
  logoUrl, 
  teamName,
  teamId,
  size = 'md',
  isHome = true,
  onClick,
  winner = false
}) => {
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>(logoUrl);
  const [primaryImageFailed, setPrimaryImageFailed] = useState(false);
  const [secondaryImageFailed, setSecondaryImageFailed] = useState(false);

  // Alternative logo URLs from different API sources
  const apiFootballUrl = teamId ? `https://media.api-sports.io/football/teams/${teamId}.png` : '';
  const sportmonkUrl = teamId ? `https://cdn.sportmonks.com/images/soccer/teams/${teamId}.png` : '';

  // Determine logo size based on the size prop
  const logoSize = {
    sm: "h-[40px]",
    md: "h-[69px]",
    lg: "h-[90px]"
  }[size];

  useEffect(() => {
    // Reset failure status if logoUrl changes
    if (logoUrl !== currentLogoUrl && !primaryImageFailed) {
      setCurrentLogoUrl(logoUrl);
      setPrimaryImageFailed(false);
      setSecondaryImageFailed(false);
    }
  }, [logoUrl]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = e.target as HTMLImageElement;
    
    if (!primaryImageFailed) {
      // Try API Football URL first
      setPrimaryImageFailed(true);
      if (apiFootballUrl) {
        setCurrentLogoUrl(apiFootballUrl);
        return;
      }
    }
    
    if (!secondaryImageFailed && sportmonkUrl) {
      // Try SportMonk as second fallback
      setSecondaryImageFailed(true);
      setCurrentLogoUrl(sportmonkUrl);
      return;
    }

    // Final fallback to generic logo
    if (primaryImageFailed && secondaryImageFailed) {
      imgElement.src = '/src/assets/fallback-logo.png';
    }
  };

  return (
    <div 
      className="relative"
      onClick={onClick}
    >
      {/* Team logo */}
      <div
        className="relative z-20"
        style={{ 
          cursor: onClick ? 'pointer' : 'default'
        }}
      >
        {/* Winner badge */}
        {winner && (
          <div 
            className="absolute -top-4 -right-4 bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743-.143A1.494 1.494 0 0 1 12 11.286V20.25a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 .75-.75v-3.857a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 1-.75-.75V12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 0 .75-.75V2.625a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0-.75.75v1.125c0 .621-.504 1.125-1.125 1.125H13.5a6.75 6.75 0 0 0-8.334-2.979Z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamLogo;