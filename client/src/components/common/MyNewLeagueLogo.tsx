
import React, { useState, useEffect, useMemo } from "react";
import { enhancedLogoManager } from "@/lib/enhancedLogoManager";
import LazyImage from "./LazyImage";

interface MyNewLeagueLogoProps {
  leagueId: number;
  leagueName?: string;
  logoUrl?: string; // API-provided logo URL
  alt?: string;
  size?: string;
  className?: string;
  moveLeft?: boolean;
  fallbackUrl?: string;
}

// Cache for computed league logo results
const leagueLogoCache = new Map<string, { result: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Generate cache key for league logo computation
function generateLeagueCacheKey(leagueId: number, leagueName?: string): string {
  return `league_${leagueId}_${leagueName || 'unknown'}`;
}

const MyNewLeagueLogo: React.FC<MyNewLeagueLogoProps> = ({
  leagueId,
  leagueName,
  logoUrl,
  alt,
  size = "32px",
  className = "",
  moveLeft = false,
  fallbackUrl = "/assets/fallback-logo.svg"
}) => {
  const [resolvedLogoUrl, setResolvedLogoUrl] = useState<string>(fallbackUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Memoized logo URL resolution - prioritize API-provided logoUrl
  const resolveLogoUrl = useMemo(async () => {
    if (!leagueId) {
      console.warn(`⚠️ [MyNewLeagueLogo] No leagueId provided for ${leagueName || 'Unknown League'}`);
      return fallbackUrl;
    }

    // If we have a direct logoUrl from the API, use it immediately
    if (logoUrl && logoUrl.trim() !== '' && !logoUrl.includes('fallback')) {
      console.log(`🎯 [MyNewLeagueLogo] Using API-provided logo for ${leagueName || leagueId}: ${logoUrl}`);
      return logoUrl;
    }

    const cacheKey = generateLeagueCacheKey(leagueId, leagueName);

    // Check cache for enhanced logo manager results
    const cached = leagueLogoCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`💾 [MyNewLeagueLogo] Cache hit for league: ${leagueName || leagueId}`);
      return cached.result;
    }

    console.log(`🔍 [MyNewLeagueLogo] Fetching logo for league: ${leagueName || 'Unknown'} (ID: ${leagueId})`);

    try {
      const logoResponse = await enhancedLogoManager.getLeagueLogo('MyNewLeagueLogo', {
        type: 'league',
        shape: 'normal',
        leagueId: leagueId,
        leagueName: leagueName,
        logoUrl: logoUrl, // Pass the API-provided URL
        fallbackUrl: fallbackUrl
      });

      // Cache the result
      leagueLogoCache.set(cacheKey, {
        result: logoResponse.url,
        timestamp: now
      });

      console.log(`✅ [MyNewLeagueLogo] Logo resolved for ${leagueName || leagueId}:`, {
        url: logoResponse.url,
        cached: logoResponse.cached,
        fallbackUsed: logoResponse.fallbackUsed,
        loadTime: logoResponse.loadTime + 'ms',
        apiProvided: !!logoUrl
      });

      return logoResponse.url;
    } catch (error) {
      console.error(`❌ [MyNewLeagueLogo] Error resolving logo for league ${leagueId}:`, error);
      
      // Cache the fallback result too
      leagueLogoCache.set(cacheKey, {
        result: fallbackUrl,
        timestamp: now
      });

      return fallbackUrl;
    }
  }, [leagueId, leagueName, logoUrl, fallbackUrl]);

  // Resolve logo URL on component mount or when dependencies change
  useEffect(() => {
    let isMounted = true;

    const fetchLogo = async () => {
      setIsLoading(true);
      setHasError(false);

      // If we have a direct API logoUrl, use it immediately without waiting
      if (logoUrl && logoUrl.trim() !== '' && !logoUrl.includes('fallback')) {
        console.log(`⚡ [MyNewLeagueLogo] Immediate display of API logo for ${leagueName || leagueId}: ${logoUrl}`);
        if (isMounted) {
          setResolvedLogoUrl(logoUrl);
          setIsLoading(false);
        }
        return;
      }

      try {
        const url = await resolveLogoUrl;
        if (isMounted) {
          setResolvedLogoUrl(url);
          setIsLoading(false);
          console.log(`🎯 [MyNewLeagueLogo] Final resolved URL for ${leagueName || leagueId}: ${url}`);
        }
      } catch (error) {
        console.error(`❌ [MyNewLeagueLogo] Failed to resolve logo URL for league ${leagueId}:`, error);
        if (isMounted) {
          setResolvedLogoUrl(fallbackUrl);
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    fetchLogo();

    return () => {
      isMounted = false;
    };
  }, [resolveLogoUrl, fallbackUrl, leagueId, logoUrl, leagueName]);

  // Memoized inline styles
  const containerStyle = useMemo(() => ({
    width: size,
    height: size,
    position: "relative" as const,
    left: moveLeft ? "-16px" : "4px",
  }), [size, moveLeft]);

  const imageStyle = useMemo(() => ({ 
    backgroundColor: "transparent",
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    borderRadius: "0%",
  }), []);

  const handleError = () => {
    if (!hasError) {
      console.warn(`🚫 [MyNewLeagueLogo] Image failed to load for league ${leagueId} (${leagueName || 'Unknown'})`);
      console.warn(`🚫 [MyNewLeagueLogo] Failed URL: ${resolvedLogoUrl}`);
      console.warn(`🚫 [MyNewLeagueLogo] API provided URL: ${logoUrl || 'None'}`);
      
      // If the API-provided URL failed, try the enhanced logo manager
      if (logoUrl && resolvedLogoUrl === logoUrl) {
        console.log(`🔄 [MyNewLeagueLogo] API URL failed, trying enhanced logo manager for league ${leagueId}`);
        
        if (enhancedLogoManager && typeof enhancedLogoManager.forceRefreshLeagueLogo === 'function') {
          enhancedLogoManager.forceRefreshLeagueLogo(leagueId, 'MyNewLeagueLogo-Retry')
            .then(response => {
              if (!response.fallbackUsed && response.url !== fallbackUrl && response.url !== logoUrl) {
                console.log(`🔄 [MyNewLeagueLogo] Retry successful for league ${leagueId}, new URL: ${response.url}`);
                setResolvedLogoUrl(response.url);
                setHasError(false);
                return;
              } else {
                setResolvedLogoUrl(fallbackUrl);
                setHasError(true);
              }
            })
            .catch(error => {
              console.warn(`🔄 [MyNewLeagueLogo] Retry failed for league ${leagueId}:`, error);
              setResolvedLogoUrl(fallbackUrl);
              setHasError(true);
            });
        } else {
          setResolvedLogoUrl(fallbackUrl);
          setHasError(true);
        }
      } else {
        setResolvedLogoUrl(fallbackUrl);
        setHasError(true);
      }
    }
  };

  const handleLoad = () => {
    if (!hasError) {
      console.log(`✅ [MyNewLeagueLogo] Successfully loaded logo for league ${leagueId} from: ${resolvedLogoUrl}`);
    }
  };

  if (isLoading) {
    return (
      <div 
        className={`league-logo-container ${className} bg-gray-200 animate-pulse`}
        style={containerStyle}
      />
    );
  }

  // Debug logging before render
  console.log(`🖼️ [MyNewLeagueLogo] Rendering league ${leagueId} (${leagueName}):`, {
    resolvedLogoUrl,
    apiProvidedUrl: logoUrl,
    isLoading,
    hasError,
    fallbackUrl
  });

  return (
    <div
      className={`league-logo-container ${className}`}
      style={containerStyle}
    >
      <LazyImage
        src={resolvedLogoUrl}
        alt={alt || leagueName || `League ${leagueId}`}
        title={leagueName || `League ${leagueId}`}
        className="league-logo"
        style={imageStyle}
        fallbackSrc={fallbackUrl}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};

export default MyNewLeagueLogo;
