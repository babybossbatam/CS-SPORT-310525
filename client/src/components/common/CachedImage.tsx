
import React, { useState, useEffect } from 'react';
import { imageCache } from '../../lib/imageCache';

interface CachedImageProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  cacheKey?: string;
  imageType?: 'team' | 'league' | 'flag' | 'generic';
  onLoad?: () => void;
  onError?: () => void;
  [key: string]: any;
}

export const CachedImage: React.FC<CachedImageProps> = ({
  src,
  fallbackSrc = '/assets/fallback-logo.svg',
  alt,
  className = '',
  cacheKey,
  imageType = 'generic',
  onLoad,
  onError,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    // Try cache first if cacheKey provided
    if (cacheKey) {
      const cached = imageCache.getCachedImage(cacheKey);
      if (cached) {
        return cached;
      }
    }
    return src;
  });

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset state when src changes
    setHasError(false);
    setIsLoading(true);
    
    // Check cache again for new src
    if (cacheKey) {
      const cached = imageCache.getCachedImage(cacheKey);
      if (cached && cached !== currentSrc) {
        setCurrentSrc(cached);
        return;
      }
    }
    
    // Validate and potentially cache the new src
    if (cacheKey && src !== fallbackSrc) {
      imageCache.validateAndCache(cacheKey, src, imageType);
    }
    
    setCurrentSrc(src);
  }, [src, cacheKey, imageType, fallbackSrc]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    
    // Cache successful load
    if (cacheKey && currentSrc !== fallbackSrc) {
      imageCache.setCachedImage(cacheKey, currentSrc, imageType, 'loaded');
    }
    
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    
    if (!hasError && currentSrc !== fallbackSrc) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
      
      // Cache the fallback to prevent future attempts
      if (cacheKey) {
        imageCache.setCachedImage(cacheKey, fallbackSrc, imageType, 'fallback');
      }
    }
    
    onError?.();
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

// Specialized components for common use cases
export const CachedTeamLogo: React.FC<{
  teamId: number | string;
  teamName?: string;
  logoUrl: string;
  alt?: string;
  className?: string;
  [key: string]: any;
}> = ({ teamId, teamName, logoUrl, alt, className, ...props }) => (
  <CachedImage
    src={logoUrl}
    alt={alt || `${teamName || 'Team'} logo`}
    className={className}
    cacheKey={`team_${teamId}_${teamName || 'unknown'}`}
    imageType="team"
    {...props}
  />
);

export const CachedCountryFlag: React.FC<{
  country: string;
  flagUrl: string;
  alt?: string;
  className?: string;
  [key: string]: any;
}> = ({ country, flagUrl, alt, className, ...props }) => (
  <CachedImage
    src={flagUrl}
    alt={alt || `${country} flag`}
    className={className}
    cacheKey={`flag_${country.toLowerCase()}`}
    imageType="flag"
    {...props}
  />
);

export const CachedLeagueLogo: React.FC<{
  leagueId: number | string;
  logoUrl: string;
  alt?: string;
  className?: string;
  [key: string]: any;
}> = ({ leagueId, logoUrl, alt, className, ...props }) => (
  <CachedImage
    src={logoUrl}
    alt={alt || 'League logo'}
    className={className}
    cacheKey={`league_${leagueId}`}
    imageType="league"
    {...props}
  />
);
