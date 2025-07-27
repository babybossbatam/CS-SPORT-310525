
import React, { useState, useEffect } from 'react';
import { leagueLogoCache, getLeagueLogoCacheKey } from '../../lib/logoCache';

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
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  // Define fallback sources in priority order
  const fallbackSources = [
    `/api/league-logo/square/${leagueId}`,
    `https://media.api-sports.io/football/leagues/${leagueId}.png`,
    `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitions:default1.png/v12/Competitions/${leagueId}`,
    '/assets/fallback-logo.svg'
  ];

  useEffect(() => {
    // Check cache first
    const cacheKey = getLeagueLogoCacheKey(leagueId, leagueName);
    const cached = leagueLogoCache.getCached(cacheKey);
    
    if (cached && !cached.url.includes('fallback-logo.svg')) {
      console.log(`✅ [MyLeagueLogo] Using cached logo for league ${leagueId}: ${cached.url}`);
      setCurrentSrc(cached.url);
      return;
    }
    
    // Start with first source if no valid cache
    console.log(`🔄 [MyLeagueLogo] Loading logo for league ${leagueId} from: ${fallbackSources[0]}`);
    setCurrentSrc(fallbackSources[0]);
    setFallbackIndex(0);
    setHasError(false);
  }, [leagueId, leagueName]);

  const handleError = () => {
    const nextIndex = fallbackIndex + 1;
    
    if (nextIndex < fallbackSources.length && !hasError) {
      console.log(`🔄 [MyLeagueLogo] Trying fallback ${nextIndex} for league ${leagueId}: ${fallbackSources[nextIndex]}`);
      setFallbackIndex(nextIndex);
      setCurrentSrc(fallbackSources[nextIndex]);
    } else {
      console.warn(`🚫 [MyLeagueLogo] All sources failed for league ${leagueId}`);
      setHasError(true);
      onError?.();
    }
  };

  const handleLoad = () => {
    // Cache the successful URL
    const cacheKey = getLeagueLogoCacheKey(leagueId, leagueName);
    const isFallback = currentSrc.includes('fallback-logo.svg');
    
    leagueLogoCache.setCached(cacheKey, currentSrc, `source-${fallbackIndex}`, !isFallback);
    
    console.log(`✅ [MyLeagueLogo] Successfully loaded logo for league ${leagueId} from: ${currentSrc}`);
  };

  return (
    <img
      src={currentSrc}
      alt={leagueName || `League ${leagueId}`}
      className={className}
      style={{ backgroundColor: "transparent" }}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
};

export default MyLeagueLogo;
