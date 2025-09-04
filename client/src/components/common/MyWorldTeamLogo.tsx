import React, { useState, useRef, useCallback, useMemo } from 'react';
import { isNationalTeam, getTeamLogoSources, createTeamLogoErrorHandler } from '../../lib/teamLogoSources';
import { enhancedLogoManager } from '../../lib/enhancedLogoManager';
import { getBestTeamLogoUrl, createTeamLogoErrorHandler as createBetterErrorHandler } from '../../lib/teamLogoUtils';
import MyCircularFlag from './MyCircularFlag';
import LazyImage from './LazyImage';

// Global in-memory cache for immediate logo sharing between components
const globalLogoCache = new Map<string, { url: string; timestamp: number; verified: boolean }>();

// Cache duration: 30 minutes for active session sharing
const GLOBAL_CACHE_DURATION = 30 * 60 * 1000;

interface MyWorldTeamLogoProps {
  teamName: string;
  teamLogo?: string;
  alt?: string;
  size?: string;
  className?: string;
  teamId?: number | string;
  leagueContext?: {
    name?: string;
    country?: string;
    id?: number; // Added for clarity in cache key and logic
    leagueId?: number; // Alias for id
  };
  nextMatchInfo?: {
    opponent: string;
    date: string;
    venue?: string;
  };
  showNextMatchOverlay?: boolean;
  onLoad?: () => void; // Added for potential use in handleLoad
}

// Cache for computed shouldUseCircularFlag results
const circularFlagCache = new Map<string, { result: boolean; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const MyWorldTeamLogo: React.FC<MyWorldTeamLogoProps> = ({
  teamName,
  teamId,
  teamLogo,
  alt,
  size = "64px",
  className = "",
  moveLeft = false, // This prop is not used in the provided snippet, but kept for consistency if used elsewhere
  leagueContext,
  nextMatchInfo,
  showNextMatchOverlay = false,
  onLoad, // Added for potential use
}) => {
  const [imageSrc, setImageSrc] = useState<string>(teamLogo || "/assets/fallback.png");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // Simplified team context analysis for circular flag decision
  const shouldUseCircularFlag = useMemo(() => {
    // Create cache key for this specific combination
    const cacheKey = `${teamName}-${leagueContext?.name || 'unknown'}-${leagueContext?.id || 'unknown'}`;

    // Check cache first
    const now = Date.now();
    const cached = circularFlagCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return cached.result;
    }

    const leagueName = leagueContext?.name?.toLowerCase() || '';
    const leagueId = leagueContext?.leagueId || leagueContext?.id;

    console.log(`🔍 [MyWorldTeamLogo] Analyzing team for circular flag:`, {
      teamName,
      teamId,
      leagueName,
      leagueId,
      leagueContext
    });

    // Enhanced national team detection
    const isNationalTeam = (teamName: string): boolean => {
      if (!teamName) return false;

      const cleanName = teamName.trim();

      // Common national team patterns
      const nationalTeamPatterns = [
        // Single word countries
        /^(Afghanistan|Albania|Algeria|Argentina|Australia|Austria|Bahrain|Bangladesh|Belarus|Belgium|Bolivia|Brazil|Bulgaria|Cambodia|Cameroon|Canada|Chile|China|Colombia|Croatia|Denmark|Ecuador|Egypt|England|Estonia|Ethiopia|Finland|France|Germany|Ghana|Greece|Hungary|Iceland|India|Indonesia|Iran|Iraq|Ireland|Israel|Italy|Jamaica|Japan|Jordan|Kazakhstan|Kenya|Kuwait|Latvia|Lebanon|Libya|Lithuania|Luxembourg|Malaysia|Mali|Malta|Mexico|Morocco|Nepal|Netherlands|Nigeria|Norway|Oman|Pakistan|Panama|Paraguay|Peru|Philippines|Poland|Portugal|Qatar|Romania|Russia|Scotland|Senegal|Serbia|Singapore|Slovakia|Slovenia|Somalia|Spain|Sweden|Switzerland|Syria|Thailand|Tunisia|Turkey|Ukraine|Uruguay|Venezuela|Vietnam|Wales|Yemen|Zimbabwe)$/i,

        // Multi-word countries and regions
        /^(Saudi Arabia|South Africa|South Korea|North Korea|New Zealand|Costa Rica|El Salvador|United States|United Kingdom|Czech Republic|Bosnia and Herzegovina|North Macedonia|FYR Macedonia|Sierra Leone|Ivory Coast|Burkina Faso|Cape Verde|Central African Republic|Equatorial Guinea|Dominican Republic|Puerto Rico|Trinidad and Tobago|United Arab Emirates|Hong Kong|Chinese Taipei)$/i,

        // Youth teams
        /^(.*)\s+(U17|U19|U20|U21|U23)$/i,

        // Women's teams
        /^(.*)\s+W$/i
      ];

      return nationalTeamPatterns.some(pattern => pattern.test(cleanName));
    };

    let result = false;

    // Check for Friendlies Clubs (ID 667) - use MyCircularFlag for national teams
    if (leagueId === 667 || (leagueName.includes('friendlies') && leagueName.includes('clubs'))) {
      if (isNationalTeam(teamName)) {
        console.log(`🌍 [MyWorldTeamLogo] Friendlies Clubs + National team: Using MyCircularFlag for ${teamName}`);
        result = true;
      } else {
        console.log(`⚽ [MyWorldTeamLogo] Friendlies Clubs + Club team: Using LazyImage for ${teamName}`);
        result = false;
      }
    }
    // Check for regular Friendlies (ID 10) - always use LazyImage for club teams
    else if (leagueId === 10 || (leagueName.includes('friendlies') && !leagueName.includes('clubs'))) {
      console.log(`⚽ [MyWorldTeamLogo] Regular Friendlies: Using LazyImage for ${teamName}`);
      result = false;
    }
    // Check for other international competitions with national teams
    else if (leagueContext?.country === 'World' || 
             leagueContext?.country === 'Europe' ||
             leagueContext?.country === 'International' ||
             /\b(world cup|nations league|euro|championship|copa america|olympics|fifa|uefa|conmebol|caf|afc|concacaf|ofc)\b/i.test(leagueName)) {
      if (isNationalTeam(teamName)) {
        console.log(`🏆 [MyWorldTeamLogo] International competition + National team: Using MyCircularFlag for ${teamName}`);
        result = true;
      } else {
        console.log(`⚽ [MyWorldTeamLogo] International competition + Club team: Using LazyImage for ${teamName}`);
        result = false;
      }
    }
    // All other cases - use LazyImage for club teams
    else {
      console.log(`⚽ [MyWorldTeamLogo] Regular league: Using LazyImage for ${teamName}`);
      result = false;
    }

    // Cache the result
    circularFlagCache.set(cacheKey, {
      result,
      timestamp: now
    });

    return result;
  }, [teamName, teamId, leagueContext]);

  console.log(`🎯 [MyWorldTeamLogo] Final decision for ${teamName}:`, {
    shouldUseCircularFlag,
    teamId,
    leagueContext
  });

  // Memoized logo URL resolution using enhancedLogoManager
  const logoUrl = useMemo(() => {
    // Immediately return the locally managed imageSrc if it's already set and valid
    if (!isLoading && !hasError && imageSrc && !imageSrc.includes("/assets/fallback.png")) {
      return Promise.resolve(imageSrc);
    }

    // If not loading or has error, and no teamId/teamName, use fallback
    if (!teamId || !teamName) {
      return Promise.resolve(teamLogo || "/assets/fallback.png");
    }

    const fetchLogo = async () => {
      console.log(`🎯 [MyWorldTeamLogo] Fetching logo for team: ${teamName} (ID: ${teamId})`);

      // Check global in-memory cache first for immediate sharing
      const globalCacheKey = `${teamId}_${teamName}`;
      const globalCached = globalLogoCache.get(globalCacheKey);

      if (globalCached) {
        const age = Date.now() - globalCached.timestamp;
        if (age < GLOBAL_CACHE_DURATION && globalCached.verified) {
          console.log(`🚀 [MyWorldTeamLogo] Using global cache for ${teamName}: ${globalCached.url}`);
          return globalCached.url;
        } else if (age >= GLOBAL_CACHE_DURATION) {
          // Remove expired entries
          globalLogoCache.delete(globalCacheKey);
        }
      }

      try {
        const logoResponse = await enhancedLogoManager.getTeamLogo('MyWorldTeamLogo', {
          type: 'team',
          shape: shouldUseCircularFlag ? 'circular' : 'normal',
          teamId: teamId,
          teamName: teamName,
          fallbackUrl: teamLogo || "/assets/fallback.png"
        });

        console.log(`✅ [MyWorldTeamLogo] Logo resolved for ${teamName}:`, {
          url: logoResponse.url,
          cached: logoResponse.cached,
          fallbackUsed: logoResponse.fallbackUsed,
          loadTime: logoResponse.loadTime + 'ms'
        });

        // Cache in global memory for immediate sharing between components
        if (teamId && teamName) {
          globalLogoCache.set(globalCacheKey, {
            url: logoResponse.url,
            timestamp: Date.now(),
            verified: true // Assuming enhancedLogoManager returns a valid URL
          });
          console.log(`💾 [MyWorldTeamLogo] Cached ${teamName} logo in global cache: ${logoResponse.url}`);
        }

        return logoResponse.url;
      } catch (error) {
        console.warn(`⚠️ [MyWorldTeamLogo] Enhanced logo manager failed for ${teamName}:`, error);
        // Fallback to getBestTeamLogoUrl if enhancedLogoManager fails
        const fallbackUrl = getBestTeamLogoUrl(teamId, teamName, 64);
        // Cache the fallback URL as well if it's valid
        if (fallbackUrl) {
            globalLogoCache.set(globalCacheKey, {
              url: fallbackUrl,
              timestamp: Date.now(),
              verified: false // Mark as not fully verified if it's a fallback
            });
            console.log(`💾 [MyWorldTeamLogo] Cached fallback for ${teamName} in global cache: ${fallbackUrl}`);
        }
        return fallbackUrl;
      }
    };

    // If not already loaded or errored, initiate the fetch
    if (isLoading && !hasError) {
      return fetchLogo();
    } else if (!isLoading && !hasError) {
      // If already loaded successfully, return the current imageSrc
      return Promise.resolve(imageSrc);
    } else {
      // If there was an error, return fallback
      return Promise.resolve(teamLogo || "/assets/fallback.png");
    }
  }, [teamId, teamName, teamLogo, shouldUseCircularFlag, isLoading, hasError, imageSrc]);

  // Effect to handle the asynchronous logo loading and update state
  React.useEffect(() => {
    if (!teamId || !teamName) {
      console.warn(`⚠️ [MyWorldTeamLogo] Missing required props:`, {
        teamId,
        teamName,
        component: "MyWorldTeamLogo",
      });
      setImageSrc("/assets/fallback.png");
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Check global in-memory cache first for immediate sharing
    const globalCacheKey = `${teamId}_${teamName}`;
    const globalCached = globalLogoCache.get(globalCacheKey);

    if (globalCached) {
      const age = Date.now() - globalCached.timestamp;
      if (age < GLOBAL_CACHE_DURATION && globalCached.verified) {
        console.log(`🚀 [MyWorldTeamLogo] Using global cache for ${teamName}: ${globalCached.url}`);
        // Only update if the cached URL is different from current
        if (imageSrc !== globalCached.url) {
          setImageSrc(globalCached.url);
          setHasError(false);
          setIsLoading(false);
        }
        return;
      } else if (age >= GLOBAL_CACHE_DURATION) {
        // Remove expired entries
        globalLogoCache.delete(globalCacheKey);
      }
    }

    // Only proceed with loading if we don't already have a valid image
    if (!imageSrc || imageSrc === "/assets/fallback.png" || hasError) {
      setIsLoading(true);
      setHasError(false);

      let isMounted = true; // Flag to prevent state update on unmounted component

      logoUrl.then((url) => {
        if (isMounted && url && url !== imageSrc) {
          setImageSrc(url);
          setHasError(url.includes("/assets/fallback.png"));
          setIsLoading(false);
        }
      }).catch((error) => {
        console.error(`❌ [MyWorldTeamLogo] Error setting image src for ${teamName}:`, error);
        if (isMounted) {
          setImageSrc("/assets/fallback.png");
          setHasError(true);
          setIsLoading(false);
        }
      });

      return () => {
        isMounted = false; // Cleanup flag
      };
    }
  }, [teamId, teamName, teamLogo, shouldUseCircularFlag, imageSrc, hasError]); // Added imageSrc and hasError


  const handleLoad = () => {
    // Only update state if currently loading
    if (isLoading) {
      setIsLoading(false);
    }

    // Only update error state if there was an error
    if (hasError) {
      setHasError(false);
    }

    // Don't cache fallback images
    if (
      imageSrc.includes("/assets/fallback") ||
      imageSrc.includes("fallback") ||
      imageSrc.includes("placeholder")
    ) {
      console.log(
        `⚠️ [MyWorldTeamLogo] Fallback image loaded, not caching: ${imageSrc}`,
      );
      onLoad?.(); // Call the onLoad prop if provided
      return;
    }

    // Cache in global memory for immediate sharing between components
    if (teamId && teamName) {
      const globalCacheKey = `${teamId}_${teamName}`;
      const existingCache = globalLogoCache.get(globalCacheKey);

      // Only update cache if URL is different or not verified
      if (!existingCache || existingCache.url !== imageSrc || !existingCache.verified) {
        globalLogoCache.set(globalCacheKey, {
          url: imageSrc,
          timestamp: Date.now(),
          verified: true
        });
        console.log(`💾 [MyWorldTeamLogo] Cached ${teamName} logo in global cache: ${imageSrc}`);
      }
    }
    onLoad?.(); // Call the onLoad prop if provided
  };

    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Safety check to prevent undefined target errors
    if (!e || !e.target) {
      console.warn('⚠️ [MyWorldTeamLogo] Image error event has no target');
      return;
    }

    const target = e.target as HTMLImageElement;

    // Additional safety check for target properties
    if (!target || typeof target.src !== 'string') {
      console.warn('⚠️ [MyWorldTeamLogo] Invalid image target');
      return;
    }

    const currentSrc = target.src;

    // Check if current source is a player image and force fallback
    if (currentSrc.includes('/players/') || currentSrc.includes('Athletes/') || currentSrc.includes('player-')) {
      console.warn(`🚨 [MyWorldTeamLogo] Player image detected for team ${teamName}, using fallback`);
      target.src = '/assets/matchdetaillogo/fallback.png';
      setIsLoading(false);
      return;
    }

    // Don't retry if already showing fallback
    if (currentSrc.includes('/assets/fallback')) {
      console.log(`🚫 [MyWorldTeamLogo] Error on fallback image for ${teamName}, stopping retry.`);
      setHasError(true); // Mark as error if fallback fails
      setIsLoading(false);
      return;
    }

    // Try different logo sources if teamId is available
    if (teamId) {
      // Prioritize the enhanced logo manager's fallback if available
      if (currentSrc.includes('/api/team-logo/') && !currentSrc.endsWith('?size=32')) {
          target.src = `${currentSrc.split('?')[0]}?size=32`; // Try with a smaller size
          console.log(`🔄 [MyWorldTeamLogo] Retrying logo with smaller size for ${teamName}`);
      } else if (!currentSrc.includes('/api/team-logo/')) {
         // Fallback to a generic API endpoint if not already using one
         target.src = `/api/team-logo/square/${teamId}?size=64`; // Use a default size
         console.log(`🔄 [MyWorldTeamLogo] Retrying logo with generic API for ${teamName}`);
      } else {
        // If all retries fail, set to fallback
        target.src = '/assets/fallback.png';
        console.log(`💥 [MyWorldTeamLogo] Final fallback for ${teamName}`);
      }
    } else {
      // If no teamId, directly set to fallback
      target.src = '/assets/fallback.png';
      console.log(`💥 [MyWorldTeamLogo] Final fallback for ${teamName} (no teamId)`);
    }

    // Update state to reflect the error and stop loading if it's the final fallback
    setHasError(true);
    setIsLoading(false);

  }, [teamId, teamName, teamLogo, isLoading, hasError]); // Added missing dependencies

  if (shouldUseCircularFlag) {
    return (
      <MyCircularFlag
        teamName={teamName}
        fallbackUrl={imageSrc} // Use imageSrc which might be from cache or fetched
        alt={alt || teamName}
        size={size}
        className={className}
        moveLeft={moveLeft}
        nextMatchInfo={nextMatchInfo}
        showNextMatchOverlay={showNextMatchOverlay}
      />
    );
  }

  // Define styles for the container and image
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
  };

  // For non-national teams (club teams), use regular LazyImage with cached URL
  return (
    <div
      className={`team-logo-container ${className}`}
      style={{
        ...containerStyle,
        border: 'none',
        outline: 'none',
        boxShadow: 'none'
      }}
    >
      <LazyImage
        src={imageSrc}
        alt={alt || teamName}
        title={teamName}
        className="team-logo"
        style={imageStyle}
        onError={handleImageError}
        onLoad={handleLoad}
        loading="lazy"
        priority="high"
      />
    </div>
  );
};

export default MyWorldTeamLogo;