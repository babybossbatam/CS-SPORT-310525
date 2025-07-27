
import React, { useState } from 'react';

interface MyLeagueLogoProps {
  leagueId: number;
  leagueName?: string;
  className?: string;
  size?: number;
  onError?: () => void;
}

export const MyLeagueLogo: React.FC<MyLeagueLogoProps> = ({
  leagueId,
  leagueName,
  className = "w-6 h-6",
  size = 24,
  onError
}) => {
  const [currentSrc, setCurrentSrc] = useState(`/api/league-logo/square/${leagueId}`);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      // Try alternative sources
      const fallbackSources = [
        `https://media.api-sports.io/football/leagues/${leagueId}.png`,
        `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitions:default1.png/v12/Competitions/${leagueId}`,
        '/assets/fallback-logo.svg'
      ];

      // Find next source that hasn't been tried
      const currentIndex = fallbackSources.findIndex(src => src === currentSrc);
      const nextIndex = currentIndex + 1;

      if (nextIndex < fallbackSources.length) {
        console.log(`🔄 [MyLeagueLogo] Trying fallback ${nextIndex} for league ${leagueId}: ${fallbackSources[nextIndex]}`);
        setCurrentSrc(fallbackSources[nextIndex]);
      } else {
        console.warn(`🚫 [MyLeagueLogo] All sources failed for league ${leagueId}`);
        setHasError(true);
        onError?.();
      }
    }
  };

  return (
    <img
      src={currentSrc}
      alt={leagueName || `League ${leagueId}`}
      className={className}
      style={{ backgroundColor: "transparent" }}
      onError={handleError}
      onLoad={() => {
        console.log(`✅ [MyLeagueLogo] Successfully loaded logo for league ${leagueId} from: ${currentSrc}`);
      }}
    />
  );
};

export default MyLeagueLogo;
