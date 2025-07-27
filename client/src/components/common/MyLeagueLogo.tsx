
import React, { useState, useEffect, useMemo } from 'react';
import { enhancedLogoManager } from '../../lib/enhancedLogoManager';

interface MyLeagueLogoProps {
  leagueId: number;
  leagueName?: string;
  className?: string;
  onError?: () => void;
}

const MyLeagueLogo: React.FC<MyLeagueLogoProps> = ({
  leagueId,
  leagueName,
  className = "w-6 h-6 object-contain rounded-full",
  onError,
}) => {
  const [logoUrl, setLogoUrl] = useState<string>('/assets/fallback-logo.svg');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Memoized logo URL resolution using enhancedLogoManager
  const resolveLogoUrl = useMemo(async () => {
    if (!leagueId) {
      console.warn(`⚠️ [MyLeagueLogo] No leagueId provided for ${leagueName || 'Unknown League'}`);
      return '/assets/fallback-logo.svg';
    }

    console.log(`🎯 [MyLeagueLogo] Fetching logo for league: ${leagueName || 'Unknown'} (ID: ${leagueId})`);

    try {
      const logoResponse = await enhancedLogoManager.getLeagueLogo('MyLeagueLogo', {
        type: 'league',
        shape: 'normal',
        leagueId: leagueId,
        leagueName: leagueName,
        fallbackUrl: '/assets/fallback-logo.svg'
      });

      console.log(`✅ [MyLeagueLogo] Logo resolved for ${leagueName || leagueId}:`, {
        url: logoResponse.url,
        cached: logoResponse.cached,
        fallbackUsed: logoResponse.fallbackUsed,
        loadTime: logoResponse.loadTime + 'ms'
      });

      return logoResponse.url;
    } catch (error) {
      console.error(`❌ [MyLeagueLogo] Error resolving logo for league ${leagueId}:`, error);
      return '/assets/fallback-logo.svg';
    }
  }, [leagueId, leagueName]);

  // Resolve logo URL on component mount or when dependencies change
  useEffect(() => {
    let isMounted = true;

    const fetchLogo = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const url = await resolveLogoUrl;
        if (isMounted) {
          setLogoUrl(url);
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`❌ [MyLeagueLogo] Failed to resolve logo URL for league ${leagueId}:`, error);
        if (isMounted) {
          setLogoUrl('/assets/fallback-logo.svg');
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    fetchLogo();

    return () => {
      isMounted = false;
    };
  }, [resolveLogoUrl]);

  const handleError = () => {
    if (!hasError) {
      console.warn(`🚫 [MyLeagueLogo] Image failed to load for league ${leagueId}, using fallback`);
      setLogoUrl('/assets/fallback-logo.svg');
      setHasError(true);
      onError?.();
    }
  };

  const handleLoad = () => {
    if (!hasError) {
      console.log(`✅ [MyLeagueLogo] Successfully loaded logo for league ${leagueId} from: ${logoUrl}`);
    }
  };

  if (isLoading) {
    return (
      <div 
        className={`${className} bg-gray-200 animate-pulse`}
        style={{ backgroundColor: "transparent" }}
      />
    );
  }

  return (
    <img
      src={logoUrl}
      alt={leagueName || `League ${leagueId}`}
      className={className}
      style={{ backgroundColor: "transparent" }}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
};

export default MyLeagueLogo;
