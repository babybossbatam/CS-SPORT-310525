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

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    console.log(`❌ [MyLeagueLogo] Image failed to load: ${img.src}`);

    if (!img.src.includes('/assets/fallback-logo.svg')) {
      console.log(`🔄 [MyLeagueLogo] Switching to fallback for league ${leagueId}`);

      // Try API endpoint first as backup
      if (!img.src.includes('/api/league-logo/')) {
        console.log(`🔄 [MyLeagueLogo] Trying API endpoint backup for league ${leagueId}`);
        img.src = `/api/league-logo/square/${leagueId}`;
      } else {
        // If API endpoint also failed, use fallback
        console.log(`🔄 [MyLeagueLogo] Using final fallback for league ${leagueId}`);
        img.src = '/assets/fallback-logo.svg';
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