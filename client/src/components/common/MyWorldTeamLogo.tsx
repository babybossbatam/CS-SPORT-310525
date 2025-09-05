import React, { useState, useRef, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import {
  isNationalTeam,
  getTeamLogoSources,
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

    const leagueName = leagueContext?.name?.toLowerCase() || "";

    // Check if this is a national team
    const isActualNationalTeam = isNationalTeam(
      { name: teamName },
      leagueContext,
    );

    // Youth team detection
    const isYouthTeam =
      teamName?.includes("U17") ||
      teamName?.includes("U19") ||
      teamName?.includes("U20") ||
      teamName?.includes("U21") ||
      teamName?.includes("U23");

    // Known club team patterns - these should NEVER use circular flags
    const isKnownClubTeam =
      teamName &&
      (teamName.toLowerCase().includes("fc ") ||
        teamName.toLowerCase().includes("cf ") ||
        teamName.toLowerCase().includes("ac ") ||
        teamName.toLowerCase().includes("sc ") ||
        teamName.toLowerCase().includes("united") ||
        teamName.toLowerCase().includes("city") ||
        teamName.toLowerCase().includes("athletic") ||
        teamName.toLowerCase().includes("real ") ||
        teamName.toLowerCase().includes("club ") ||
        teamName.toLowerCase().includes("ud ") ||
        teamName.toLowerCase().includes("valencia") ||
        teamName.toLowerCase().includes("alboraya") ||
        // Add more specific club patterns
        teamName.toLowerCase().includes("arsenal") ||
        teamName.toLowerCase().includes("liverpool") ||
        teamName.toLowerCase().includes("chelsea") ||
        teamName.toLowerCase().includes("manchester") ||
        teamName.toLowerCase().includes("tottenham") ||
        teamName.toLowerCase().includes("bayern") ||
        teamName.toLowerCase().includes("dortmund") ||
        teamName.toLowerCase().includes("juventus") ||
        teamName.toLowerCase().includes("milan") ||
        teamName.toLowerCase().includes("inter") ||
        teamName.toLowerCase().includes("napoli") ||
        teamName.toLowerCase().includes("roma") ||
        teamName.toLowerCase().includes("psg") ||
        teamName.toLowerCase().includes("olympique") ||
        teamName.toLowerCase().includes("atletico") ||
        teamName.toLowerCase().includes("barcelona") ||
        teamName.toLowerCase().includes("sevilla") ||
        teamName.toLowerCase().includes("villarreal"));

    // Force specific club youth teams to ALWAYS use club logos (never circular flags)
    const isClubYouthTeam =
      (teamName?.includes("Valencia U20") && teamId === 532) ||
      (teamName?.includes("Alboraya U20") && teamId === 19922);

    // League patterns that typically use club teams
    const isClubCompetition =
      leagueName.includes("premier league") ||
      leagueName.includes("la liga") ||
      leagueName.includes("serie a") ||
      leagueName.includes("bundesliga") ||
      leagueName.includes("ligue 1") ||
      leagueName.includes("primeira liga") ||
      leagueName.includes("eredivisie") ||
      leagueName.includes("uefa champions league") ||
      leagueName.includes("uefa europa league") ||
      leagueName.includes("uefa europa conference league") ||
      leagueName.includes("conmebol sudamericana") ||
      leagueName.includes("fifa club world cup") ||
      leagueName.includes("club world cup") ||
      leagueName.includes("standing") ||
      leagueName.includes("table");

    // League patterns that typically use national teams
    const isNationalTeamCompetition =
      leagueName.includes("friendlies international") ||
      leagueName.includes("international friendlies") ||
      leagueName.includes("uefa nations league") ||
      leagueName.includes("nations league") ||
      leagueName.includes("world cup") ||
      leagueName.includes("euro") ||
      leagueName.includes("copa america") ||
      leagueName.includes("afc u20 asian cup") ||
      leagueName.includes("afc u-20 asian cup") ||
      leagueName.includes("asian cup u20") ||
      leagueName.includes("asian cup u-20") ||
      leagueName.includes("olympic") ||
      leagueName.includes("cotif") ||
      leagueName.includes("uefa under-21 championship") ||
      (leagueName.includes("uefa") && leagueName.includes("under-21")) ||
      leagueName.includes("u20") ||
      leagueName.includes("u21") ||
      leagueName.includes("u23") ||
      leagueName.includes("under-20") ||
      leagueName.includes("under-21") ||
      leagueName.includes("under-23") ||
      leagueName.includes("youth");

    // Special handling for mixed competitions like COTIF and Friendlies Clubs
    const isMixedCompetition =
      leagueName.includes("cotif") ||
      leagueName.includes("friendlies clubs") ||
      leagueName.includes("friendlies club") ||
      leagueName.includes("club friendlies");

    // Decision logic
    let result = false;

    // 1. Known club teams should never use circular flags
    if (isKnownClubTeam || isClubYouthTeam) {
      result = false;
      console.log(`🏟️ [MyWorldTeamLogo] ${teamName} identified as club team - using club logo`);
    }
    // 2. Club competitions should use club logos
    else if (isClubCompetition) {
      result = false;
      console.log(`🏆 [MyWorldTeamLogo] ${teamName} in club competition - using club logo`);
    }
    // 3. National team competitions should use circular flags
    else if (isNationalTeamCompetition && isActualNationalTeam) {
      result = true;
      console.log(`🇺🇳 [MyWorldTeamLogo] ${teamName} in national team competition - using circular flag`);
    }
    // 4. Mixed competitions - need to distinguish
    else if (isMixedCompetition) {
      // In mixed competitions, prioritize actual detection
      if (isKnownClubTeam) {
        result = false;
        console.log(`🏟️ [MyWorldTeamLogo] Mixed competition: ${teamName} identified as club team - using club logo`);
      } else if (isActualNationalTeam) {
        result = true;
        console.log(`🇺🇳 [MyWorldTeamLogo] Mixed competition: ${teamName} identified as national team - using circular flag`);
      } else {
        // Default for unclear cases
        result = false;
        console.log(`❓ [MyWorldTeamLogo] Mixed competition: ${teamName} unclear classification - defaulting to club logo`);
      }
    }
    // 5. Default case - use national team detection
    else if (isActualNationalTeam && !isKnownClubTeam) {
      result = true;
      console.log(`🌍 [MyWorldTeamLogo] ${teamName} identified as national team - using circular flag`);
    }
    // 6. Default to club logo for everything else
    else {
      result = false;
      console.log(`🏟️ [MyWorldTeamLogo] ${teamName} defaulting to club logo`);
    }

    // Cache the result
    circularFlagCache.set(cacheKey, {
      result,
      timestamp: now,
    });

    console.log(
      `💾 [MyWorldTeamLogo] Cached shouldUseCircularFlag result for ${teamName}: ${result}`,
    );
    return result;
  }, [teamName, leagueContext, teamId]);

  // Synchronous logo URL resolution for club teams
  const logoUrl = useMemo(() => {
    if (shouldUseCircularFlag) {
      // For national teams, MyCircularFlag will handle the URL
      return teamLogo || "/assets/matchdetaillogo/fallback.png";
    }

    // For club teams, get the best available logo URL
    if (teamId) {
      const logoSources = getTeamLogoSources(
        { id: teamId, name: teamName, logo: teamLogo },
        false, // Never use circular flag sources for club teams
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
      // Add theme-aware shadows for better contrast and visibility
      filter: darkMode
        ? "drop-shadow(0 4px 8px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.2))"
        : "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 16px rgba(0, 0, 0, 0.25))",
      imageRendering: "auto" as const,
    }),
    [darkMode],
  );

  // DECISION POINT: Use MyCircularFlag for national teams, LazyImage for club teams
  if (shouldUseCircularFlag) {
    console.log(`🌍 [MyWorldTeamLogo] Rendering MyCircularFlag for national team: ${teamName}`);
    return (
      <MyCircularFlag
        teamName={teamName}
        fallbackUrl={logoUrl}
        alt={alt || teamName}
        size={size}
        className={className}
        moveLeft={moveLeft}
        nextMatchInfo={nextMatchInfo}
        showNextMatchOverlay={showNextMatchOverlay}
      />
    );
  }

  // For club teams, use LazyImage
  console.log(`🏟️ [MyWorldTeamLogo] Rendering LazyImage for club team: ${teamName}`);
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
        src={logoUrl}
        alt={alt || teamName}
        title={teamName}
        className="team-logo"
        style={imageStyle}
        useTeamLogo={false} // Important: LazyImage should NOT do team logo detection
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