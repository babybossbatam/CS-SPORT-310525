
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

  // Simple URL validation helper
  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false;
    if (url.includes('fallback') || url.includes('undefined') || url.includes('null')) return false;
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  // Memoized logo URL resolution - simplified and prioritized
  const resolveLogoUrl = useMemo(() => {
    return new Promise<string>(async (resolve) => {
      if (!leagueId) {
        console.warn(`⚠️ [MyNewLeagueLogo] No leagueId provided for ${leagueName || 'Unknown League'}`);
        resolve(fallbackUrl);
        return;
      }

      // Priority 1: API-provided URL (if valid)
      if (logoUrl && isValidUrl(logoUrl)) {
        console.log(`🎯 [MyNewLeagueLogo] Using API-provided logo for ${leagueName || leagueId}: ${logoUrl}`);
        resolve(logoUrl);
        return;
      }

      // Priority 2: Check cache
      const cacheKey = generateLeagueCacheKey(leagueId, leagueName);
      const cached = leagueLogoCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log(`💾 [MyNewLeagueLogo] Cache hit for league: ${leagueName || leagueId}`);
        resolve(cached.result);
        return;
      }

      // Priority 3: Try our server proxy endpoint
      try {
        const proxyUrl = `/api/league-logo/${leagueId}`;
        const response = await fetch(proxyUrl);
        
        if (response.ok) {
          console.log(`✅ [MyNewLeagueLogo] Server proxy success for league ${leagueId}`);
          // Cache the proxy URL
          leagueLogoCache.set(cacheKey, { result: proxyUrl, timestamp: now });
          resolve(proxyUrl);
          return;
        }
      } catch (error) {
        console.warn(`⚠️ [MyNewLeagueLogo] Server proxy failed for league ${leagueId}:`, error);
      }

      // Priority 4: Enhanced logo manager as fallback
      try {
        console.log(`🔍 [MyNewLeagueLogo] Trying enhanced manager for league: ${leagueName || 'Unknown'} (ID: ${leagueId})`);
        
        const logoResponse = await enhancedLogoManager.getLeagueLogo('MyNewLeagueLogo', {
          type: 'league',
          shape: 'normal',
          leagueId: leagueId,
          leagueName: leagueName,
          logoUrl: logoUrl,
          fallbackUrl: fallbackUrl
        });

        // Cache the result
        leagueLogoCache.set(cacheKey, {
          result: logoResponse.url,
          timestamp: now
        });

        console.log(`✅ [MyNewLeagueLogo] Enhanced manager success for ${leagueName || leagueId}: ${logoResponse.url}`);
        resolve(logoResponse.url);
      } catch (error) {
        console.error(`❌ [MyNewLeagueLogo] Enhanced manager failed for league ${leagueId}:`, error);
        
        // Cache the fallback
        leagueLogoCache.set(cacheKey, { result: fallbackUrl, timestamp: now });
        resolve(fallbackUrl);
      }
    });
  }, [leagueId, leagueName, logoUrl, fallbackUrl]);

  // Resolve logo URL on component mount or when dependencies change
  useEffect(() => {
    let isMounted = true;

    const fetchLogo = async () => {
      setIsLoading(true);
      setHasError(false);

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
  }, [resolveLogoUrl, fallbackUrl, leagueId]);

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
      
      // Simple fallback - no recursive calls
      setResolvedLogoUrl(fallbackUrl);
      setHasError(true);
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

  // Additional debugging for failed cases
  if (hasError && resolvedLogoUrl === fallbackUrl) {
    console.warn(`🚨 [MyNewLeagueLogo] League ${leagueId} (${leagueName}) failed all sources:`, {
      hadApiUrl: !!logoUrl,
      serverProxyUrl: `/api/league-logo/${leagueId}`,
      willTryDirectApi: `https://media.api-sports.io/football/leagues/${leagueId}.png`
    });
  }

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
