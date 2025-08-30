import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
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
  };
  nextMatchInfo?: {
    opponent: string;
    date: string;
    venue?: string;
  };
  showNextMatchOverlay?: boolean;
  onLoad?: () => void;
  priority?: string;
  moveLeft?: boolean;
}

// Cache for computed shouldUseCircularFlag results
const circularFlagCache = new Map<string, { result: boolean; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Generate cache key for shouldUseCircularFlag computation
function generateCacheKey(teamName: string, leagueContext?: { name: string; country: string }): string {
  const leagueName = leagueContext?.name?.toLowerCase() || "";
  const leagueCountry = leagueContext?.country || "";
  return `${teamName}_${leagueName}_${leagueCountry}`;
}

const MyWorldTeamLogo: React.FC<MyWorldTeamLogoProps> = ({
  teamName,
  teamId,
  teamLogo,
  alt,
  size = "64px",
  className = "",
  moveLeft = false,
  leagueContext,
  nextMatchInfo,
  showNextMatchOverlay = false,
  onLoad,
  priority = 'low',
}) => {
  const [imageSrc, setImageSrc] = useState<string>(teamLogo || "/assets/fallback.png");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoized computation with caching for shouldUseCircularFlag
  const shouldUseCircularFlag = useMemo(() => {
    const cacheKey = generateCacheKey(teamName, leagueContext);

    // Check cache first
    const cached = circularFlagCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`💾 [MyWorldTeamLogo] Cache hit for shouldUseCircularFlag: ${teamName}`);
      return cached.result;
    }

    console.log(`🔄 [MyWorldTeamLogo] Computing shouldUseCircularFlag for: ${teamName}`);

    const isActualNationalTeam = isNationalTeam({ name: teamName }, leagueContext);
    const isYouthTeam = teamName?.includes("U17") ||
                       teamName?.includes("U19") ||
                       teamName?.includes("U20") ||
                       teamName?.includes("U21") ||
                       teamName?.includes("U23");

    const leagueName = leagueContext?.name?.toLowerCase() || "";
    const isCOTIFTournament = leagueName.includes("cotif");

    // For COTIF Tournament, we need to distinguish between club and national teams
    if (isCOTIFTournament) {
      console.log(`🏆 [MyWorldTeamLogo] COTIF Tournament detected for team: ${teamName}`);

      const isKnownClubTeam =
        (teamId === 532 && teamName.toLowerCase().includes("valencia")) ||
        (teamId === 19922 && teamName.toLowerCase().includes("alboraya")) ||
        teamName.toLowerCase().includes("valencia") ||
        teamName.toLowerCase().includes("alboraya") ||
        teamName.toLowerCase().includes("ud ") ||
        teamName.toLowerCase().includes("fc ") ||
        teamName.toLowerCase().includes("cf ") ||
        teamName.toLowerCase().includes("club ");

      if (isKnownClubTeam) {
        console.log(`🏟️ [MyWorldTeamLogo] COTIF: ${teamName} identified as club team - using club logo`);
        const result = false;
        circularFlagCache.set(cacheKey, { result, timestamp: now });
        return result;
      }

      if (isYouthTeam && isActualNationalTeam) {
        console.log(`🇺🇳 [MyWorldTeamLogo] COTIF: ${teamName} identified as national youth team - using circular flag`);
        const result = true;
        circularFlagCache.set(cacheKey, { result, timestamp: now });
        return result;
      }

      if (isActualNationalTeam) {
        console.log(`🌍 [MyWorldTeamLogo] COTIF: ${teamName} identified as national team - using circular flag`);
        const result = true;
        circularFlagCache.set(cacheKey, { result, timestamp: now });
        return result;
      }
    }

    // Check for known club teams
    const isKnownClubTeam = teamName && (
      teamName.toLowerCase().includes("fc") ||
      teamName.toLowerCase().includes("cf") ||
      teamName.toLowerCase().includes("united") ||
      teamName.toLowerCase().includes("city") ||
      teamName.toLowerCase().includes("athletic") ||
      teamName.toLowerCase().includes("real madrid") ||
      teamName.toLowerCase().includes("barcelona") ||
      teamName.toLowerCase().includes("valencia") ||
      teamName.toLowerCase().includes("alboraya") ||
      teamName.toLowerCase().includes("club")
    );

    // Determine if this is an international competition
    const isFriendliesInternational = leagueName === "friendlies international" ||
                                     leagueName === "international friendlies" ||
                                     (leagueName.includes("friendlies") && leagueName.includes("international"));

    const isUefaNationsLeague = leagueName.includes("uefa nations league") ||
                               leagueName.includes("nations league");

    const isWorldCupQualification = leagueName.includes("world cup") &&
                                   (leagueName.includes("qualification") || leagueName.includes("qualifier"));

    const result = !isKnownClubTeam &&
                   isActualNationalTeam &&
                   (isFriendliesInternational || isUefaNationsLeague || isWorldCupQualification);

    // Cache the result
    circularFlagCache.set(cacheKey, { result, timestamp: now });
    console.log(`💾 [MyWorldTeamLogo] Cached shouldUseCircularFlag result for ${teamName}: ${result}`);
    return result;
  }, [teamName, leagueContext]);

  // Effect to handle logo loading
  useEffect(() => {
    if (!isMountedRef.current) return;

    if (!teamId && !teamName) {
      console.warn(`⚠️ [MyWorldTeamLogo] Missing required props:`, { teamId, teamName });
      setImageSrc("/assets/fallback.png");
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Handle cases where we have teamName but no teamId
    if (!teamId && teamName) {
      console.log(`📝 [MyWorldTeamLogo] Using teamName only for ${teamName}`);
      setImageSrc(teamLogo || "/assets/fallback.png");
      setHasError(false);
      setIsLoading(false);
      return;
    }

    // Check global cache first
    const globalCacheKey = `${teamId}_${teamName}`;
    const globalCached = globalLogoCache.get(globalCacheKey);

    if (globalCached) {
      const age = Date.now() - globalCached.timestamp;
      if (age < GLOBAL_CACHE_DURATION && globalCached.verified) {
        console.log(`🚀 [MyWorldTeamLogo] Using global cache for ${teamName}: ${globalCached.url}`);
        setImageSrc(globalCached.url);
        setHasError(false);
        setIsLoading(false);
        return;
      } else if (age >= GLOBAL_CACHE_DURATION) {
        globalLogoCache.delete(globalCacheKey);
      }
    }

    // Load logo asynchronously
    const loadLogo = async () => {
      if (!isMountedRef.current) return;

      try {
        setIsLoading(true);

        const logoResponse = await enhancedLogoManager.getTeamLogo('MyWorldTeamLogo', {
          type: 'team',
          shape: shouldUseCircularFlag ? 'circular' : 'normal',
          teamId: teamId,
          teamName: teamName,
          fallbackUrl: teamLogo || "/assets/fallback.png"
        });

        if (!isMountedRef.current) return;

        console.log(`✅ [MyWorldTeamLogo] Logo resolved for ${teamName}:`, {
          url: logoResponse.url,
          cached: logoResponse.cached,
          fallbackUsed: logoResponse.fallbackUsed,
          loadTime: logoResponse.loadTime + 'ms'
        });

        // Cache in global memory
        if (teamId && teamName) {
          globalLogoCache.set(globalCacheKey, {
            url: logoResponse.url,
            timestamp: Date.now(),
            verified: true
          });
        }

        setImageSrc(logoResponse.url);
        setHasError(false);
        setIsLoading(false);

      } catch (error) {
        if (!isMountedRef.current) return;

        console.warn(`⚠️ [MyWorldTeamLogo] Enhanced logo manager failed for ${teamName}:`, error);

        // Fallback to getBestTeamLogoUrl
        const fallbackUrl = getBestTeamLogoUrl(teamId, teamName, 64);

        if (fallbackUrl) {
          globalLogoCache.set(globalCacheKey, {
            url: fallbackUrl,
            timestamp: Date.now(),
            verified: false
          });
        }

        setImageSrc(fallbackUrl || "/assets/fallback.png");
        setHasError(!!fallbackUrl);
        setIsLoading(false);
      }
    };

    loadLogo();
  }, [teamId, teamName, teamLogo, shouldUseCircularFlag]);

  const handleLoad = useCallback(() => {
    if (!isMountedRef.current) return;

    if (isLoading) {
      setIsLoading(false);
    }

    if (hasError) {
      setHasError(false);
    }

    // Don't cache fallback images
    if (imageSrc.includes("/assets/fallback") || imageSrc.includes("fallback") || imageSrc.includes("placeholder")) {
      console.log(`⚠️ [MyWorldTeamLogo] Fallback image loaded, not caching: ${imageSrc}`);
      onLoad?.();
      return;
    }

    // Cache in global memory for immediate sharing between components
    if (teamId && teamName) {
      const globalCacheKey = `${teamId}_${teamName}`;
      const existingCache = globalLogoCache.get(globalCacheKey);

      if (!existingCache || existingCache.url !== imageSrc || !existingCache.verified) {
        globalLogoCache.set(globalCacheKey, {
          url: imageSrc,
          timestamp: Date.now(),
          verified: true
        });
        console.log(`💾 [MyWorldTeamLogo] Cached ${teamName} logo in global cache: ${imageSrc}`);
      }
    }
    onLoad?.();
  }, [imageSrc, teamId, teamName, isLoading, hasError, onLoad]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!isMountedRef.current) return;

    if (!e || !e.target) {
      console.warn('⚠️ [MyWorldTeamLogo] Image error event has no target');
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const target = e.target as HTMLImageElement;

    if (!target || typeof target.src !== 'string') {
      console.warn('⚠️ [MyWorldTeamLogo] Invalid image target');
      setHasError(true);
      setIsLoading(false);
      return;
    }

    console.log(`🚫 [MyWorldTeamLogo] Image error for team:`, {
      teamName,
      teamId,
      currentSrc: target.src,
      leagueContext
    });

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
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Try different logo sources if teamId is available
    if (teamId) {
      if (currentSrc.includes('/api/team-logo/') && !currentSrc.endsWith('?size=32')) {
        target.src = `${currentSrc.split('?')[0]}?size=32`;
        console.log(`🔄 [MyWorldTeamLogo] Retrying logo with smaller size for ${teamName}`);
      } else if (!currentSrc.includes('/api/team-logo/')) {
        target.src = `/api/team-logo/square/${teamId}?size=64`;
        console.log(`🔄 [MyWorldTeamLogo] Retrying logo with generic API for ${teamName}`);
      } else {
        target.src = '/assets/fallback.png';
        console.log(`💥 [MyWorldTeamLogo] Final fallback for ${teamName}`);
      }
    } else {
      target.src = '/assets/fallback.png';
      console.log(`💥 [MyWorldTeamLogo] Final fallback for ${teamName} (no teamId)`);
    }

    setHasError(true);
    setIsLoading(false);
  }, [teamId, teamName]);

  if (shouldUseCircularFlag) {
    return (
      <MyCircularFlag
        teamName={teamName}
        fallbackUrl={imageSrc}
        alt={alt || teamName}
        size={size}
        className={className}
        moveLeft={moveLeft}
        nextMatchInfo={nextMatchInfo}
        showNextMatchOverlay={showNextMatchOverlay}
      />
    );
  }

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
        priority={priority as 'high' | 'medium' | 'low'}
      />
    </div>
  );
};

export default MyWorldTeamLogo;