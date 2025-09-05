import React, { useState, useRef, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import {
  isNationalTeam,
  getTeamLogoSources,
  createTeamLogoErrorHandler,
} from "../../lib/teamLogoSources";
import { enhancedLogoManager } from "../../lib/enhancedLogoManager";
import MyCircularFlag from "./MyCircularFlag";
import LazyImage from "./LazyImage";

interface MyWorldTeamLogoProps {
  teamName: string;
  teamLogo?: string;
  alt?: string;
  size?: string;
  className?: string;
  teamId?: number | string;
  moveLeft?: boolean;
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
}

// Cache for computed shouldUseCircularFlag results
const circularFlagCache = new Map<
  string,
  { result: boolean; timestamp: number }
>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Generate cache key for shouldUseCircularFlag computation
function generateCacheKey(
  teamName: string,
  leagueContext?: { name?: string; country?: string },
): string {
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
}) => {
  // Get dark mode state from Redux store
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);

  // Memoized computation with caching for shouldUseCircularFlag
  const shouldUseCircularFlag = useMemo(() => {
    const cacheKey = generateCacheKey(teamName, leagueContext);

    // Check cache first
    const cached = circularFlagCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      console.log(
        `💾 [MyWorldTeamLogo] Cache hit for shouldUseCircularFlag: ${teamName}`,
      );
      return cached.result;
    }

    // Compute the result if not cached or expired
    console.log(
      `🔄 [MyWorldTeamLogo] Computing shouldUseCircularFlag for: ${teamName}`,
    );

    // Enhanced national team detection including U21, youth teams, and specific patterns
    const isNational = isNationalTeam({ name: teamName }, leagueContext);

    // Additional patterns for national teams (including youth teams)
    const isYouthNationalTeam = teamName?.toLowerCase().match(/\b(u\d+|u-\d+|under[-\s]?\d+)\b/) &&
      !teamName?.toLowerCase().includes("club") &&
      !teamName?.toLowerCase().includes("fc") &&
      !teamName?.toLowerCase().includes("united");

    // Check for specific national team patterns
    const hasNationalPattern = teamName && (
      teamName.toLowerCase().includes("national") ||
      teamName.toLowerCase().match(/\b(republic|democratic|federation|kingdom)\b/)
    );

    // Combined national team detection
    const isActualNationalTeam = isNational || isYouthNationalTeam || hasNationalPattern;

    // Additional check for known club teams that should never use circular flags
    const isKnownClubTeam =
      !isActualNationalTeam &&
      (teamName?.toLowerCase().includes("fc") ||
        teamName?.toLowerCase().includes("cf") ||
        teamName?.toLowerCase().includes("united") ||
        teamName?.toLowerCase().includes("city") ||
        teamName?.toLowerCase().includes("athletic") ||
        teamName?.toLowerCase().includes("real") ||
        teamName?.toLowerCase().includes("barcelona") ||
        teamName?.toLowerCase().includes("valencia") ||
        teamName?.toLowerCase().includes("alboraya") ||
        teamName?.toLowerCase().includes("club") ||
        teamName?.toLowerCase().includes("ud "));

    // Enhanced league context detection for national team competitions
    const leagueIndicatesNationalTeams = leagueContext?.name?.toLowerCase().includes('uefa') ||
      leagueContext?.name?.toLowerCase().includes('world cup') ||
      leagueContext?.name?.toLowerCase().includes('euro') ||
      leagueContext?.name?.toLowerCase().includes('nations league') ||
      leagueContext?.name?.toLowerCase().includes('international') ||
      leagueContext?.name?.toLowerCase().includes('qualification') ||
      leagueContext?.name?.toLowerCase().includes('championship') ||
      leagueContext?.name?.toLowerCase().includes('under-21') ||
      leagueContext?.name?.toLowerCase().includes('u21') ||
      leagueContext?.name?.toLowerCase().includes('youth');

    const result =
      (isActualNationalTeam && !isKnownClubTeam) ||
      (leagueIndicatesNationalTeams && !isKnownClubTeam);

    // Cache the result
    circularFlagCache.set(cacheKey, {
      result,
      timestamp: now,
    });

    console.log(
      `💾 [MyWorldTeamLogo] Cached shouldUseCircularFlag result for ${teamName}: ${result}`,
    );
    return result;
  }, [teamName, leagueContext]);

  // Synchronous logo URL resolution
  const logoUrl = useMemo(() => {
    if (teamId) {
      const logoSources = getTeamLogoSources(
        { id: teamId, name: teamName, logo: teamLogo },
        shouldUseCircularFlag || false,
        "football",
      );
      if (logoSources.length > 0) {
        return logoSources[0].url;
      }
    }

    // Fallback to original teamLogo if no teamId
    console.log(
      `⚠️ [MyWorldTeamLogo] No teamId provided for ${teamName}, using original logo`,
    );
    const safeLogo =
      teamLogo && !teamLogo.includes("placeholder.com")
        ? teamLogo
        : "/assets/matchdetaillogo/fallback.png";
    return safeLogo;
  }, [teamId, teamName, teamLogo, shouldUseCircularFlag]);

  // Enhanced logo URL with async loading fallback
  const [resolvedLogoUrl, setResolvedLogoUrl] = React.useState<string>(logoUrl);

  React.useEffect(() => {
    const loadEnhancedLogo = async () => {
      if (teamId && teamName) {
        try {
          console.log(
            `🎯 [MyWorldTeamLogo] Fetching enhanced logo for team: ${teamName} (ID: ${teamId}), shouldUseCircularFlag: ${shouldUseCircularFlag}`,
          );

          // For national teams that should use circular flags, don't use enhanced manager
          if (shouldUseCircularFlag) {
            console.log(
              `🌍 [MyWorldTeamLogo] Skipping enhanced manager for national team: ${teamName}`,
            );
            setResolvedLogoUrl(logoUrl);
            return;
          }

          // Check direct endpoint first
          const directEndpoint = `/api/team-logo/square/${teamId}?size=64`;
          console.log(
            `🔍 [MyWorldTeamLogo] Testing direct endpoint: ${directEndpoint}`,
          );

          const logoResponse = await enhancedLogoManager.getTeamLogo(
            "MyWorldTeamLogo",
            {
              type: "team",
              shape: shouldUseCircularFlag ? "circular" : "normal",
              teamId: teamId,
              teamName: teamName,
              fallbackUrl: logoUrl,
            },
          );

          console.log(
            `✅ [MyWorldTeamLogo] Enhanced logo resolved for ${teamName}:`,
            {
              url: logoResponse.url,
              cached: logoResponse.cached,
              fallbackUsed: logoResponse.fallbackUsed,
              loadTime: logoResponse.loadTime + "ms",
              isServerProxy: logoResponse.url.includes("/api/team-logo/"),
              directEndpoint: directEndpoint,
            },
          );

          setResolvedLogoUrl(logoResponse.url);
        } catch (error) {
          console.warn(
            `⚠️ [MyWorldTeamLogo] Enhanced logo failed for ${teamName}, using fallback:`,
            error,
          );

          // For national teams, don't try server proxy fallback
          if (shouldUseCircularFlag) {
            console.log(
              `🌍 [MyWorldTeamLogo] National team fallback for ${teamName}, using original logoUrl`,
            );
            setResolvedLogoUrl(logoUrl);
          } else {
            console.log(
              `🔄 [MyWorldTeamLogo] Trying direct server proxy for ${teamName}`,
            );
            const directFallback = `/api/team-logo/square/${teamId}?size=64`;
            setResolvedLogoUrl(directFallback);
          }
        }
      } else {
        console.log(
          `❌ [MyWorldTeamLogo] Missing teamId or teamName: ${teamName} (${teamId})`,
        );
        setResolvedLogoUrl(logoUrl);
      }
    };

    loadEnhancedLogo();
  }, [teamId, teamName, logoUrl, shouldUseCircularFlag]);

  // Memoized inline styles
  const containerStyle = useMemo(
    () => ({
      width: size,
      height: size,
      position: "relative" as const,
      left: moveLeft ? "-16px" : "4px",
    }),
    [size, moveLeft],
  );

  const imageStyle = useMemo(
    () => ({
      backgroundColor: "transparent",
      width: "100%",
      height: "100%",
      objectFit: "contain" as const,
      borderRadius: "0%",
      transform: "scale(0.9)",
      // Add theme-aware shadows for better contrast and visibility (lg shadow)
      filter: darkMode
        ? "drop-shadow(0 4px 8px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.2))"
        : "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 16px rgba(0, 0, 0, 0.25))",
      imageRendering: "auto" as const,
    }),
    [darkMode],
  );

  const handleImageError = useCallback(() => {
    console.warn(`⚠️ [MyWorldTeamLogo] Image error for ${teamName}:`, {
      currentUrl: resolvedLogoUrl,
      teamId: teamId,
      hasTeamId: !!teamId,
      isServerProxy: resolvedLogoUrl.includes("/api/team-logo/"),
    });

    // Try different logo sources if teamId is available
    if (teamId && !resolvedLogoUrl.includes("/api/team-logo/")) {
      const fallbackUrl = `/api/team-logo/square/${teamId}?size=32`;
      console.log(
        `🔄 [MyWorldTeamLogo] Trying server proxy fallback: ${fallbackUrl}`,
      );
      setResolvedLogoUrl(fallbackUrl);
      return;
    }

    // Try alternative server proxy sizes
    if (teamId && resolvedLogoUrl.includes("size=64")) {
      const smallerFallback = `/api/team-logo/square/${teamId}?size=32`;
      console.log(
        `🔄 [MyWorldTeamLogo] Trying smaller size fallback: ${smallerFallback}`,
      );
      setResolvedLogoUrl(smallerFallback);
      return;
    }

    // Try the teamLogoSources alternatives
    if (teamId && resolvedLogoUrl.includes("/api/team-logo/")) {
      const sources = getTeamLogoSources(
        { id: teamId, name: teamName },
        false,
        "football",
      );
      const nextSource = sources.find(
        (source) => source.url !== resolvedLogoUrl,
      );
      if (nextSource) {
        console.log(
          `🔄 [MyWorldTeamLogo] Trying next source: ${nextSource.source} - ${nextSource.url}`,
        );
        setResolvedLogoUrl(nextSource.url);
        return;
      }
    }

    // Set final fallback image
    console.log(`🚫 [MyWorldTeamLogo] Using final fallback for ${teamName}`);
    setResolvedLogoUrl("/assets/matchdetaillogo/fallback.png");
  }, [teamId, teamName, resolvedLogoUrl]);

  if (shouldUseCircularFlag) {
    return (
      <MyCircularFlag
        teamName={teamName}
        fallbackUrl={resolvedLogoUrl}
        alt={alt || teamName}
        size={size}
        className={className}
        moveLeft={moveLeft}
        nextMatchInfo={nextMatchInfo}
        showNextMatchOverlay={showNextMatchOverlay}
      />
    );
  }

  // For non-national teams (club teams), use regular LazyImage with cached URL
  return (
    <div
      className={`team-logo-container ${className}`}
      style={{
        ...containerStyle,
        border: "none",
        outline: "none",
        boxShadow: "none",
      }}
    >
      <LazyImage
        src={resolvedLogoUrl}
        alt={alt || teamName}
        title={teamName}
        className="team-logo"
        style={imageStyle}
        onError={handleImageError}
        useTeamLogo={false}
        teamId={teamId}
        teamName={teamName}
        leagueContext={leagueContext}
        priority="medium"
        fallbackSrc={`/api/team-logo/square/${teamId}?size=32`}
      />
    </div>
  );
};

export default MyWorldTeamLogo;