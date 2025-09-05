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

  // Optimized computation with simplified logic and reduced logging
  const shouldUseCircularFlag = useMemo(() => {
    const cacheKey = generateCacheKey(teamName, leagueContext);

    // Check cache first
    const cached = circularFlagCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return cached.result;
    }

    const leagueName = leagueContext?.name?.toLowerCase() || "";
    
    // Fast path: Check obvious club patterns first
    const clubKeywords = ["fc ", "cf ", "ac ", "sc ", "city", "united", "athletic", "real ", "club "];
    const isObviousClub = clubKeywords.some(keyword => teamName?.toLowerCase().includes(keyword));
    
    // Fast path: Check obvious national team competitions
    const nationalCompetitions = ["nations league", "world cup", "euro", "copa america", "friendlies international", "uefa under-21"];
    const isNationalCompetition = nationalCompetitions.some(comp => leagueName.includes(comp));
    
    let result = false;
    
    // Simplified decision logic
    if (isNationalCompetition && !isObviousClub) {
      result = true;
    } else if (isObviousClub) {
      result = false;
    } else {
      // Only do complex check for ambiguous cases
      result = isNationalTeam({ name: teamName }, leagueContext);
    }

    // Cache the result
    circularFlagCache.set(cacheKey, {
      result,
      timestamp: now,
    });

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
  // National teams should ALWAYS use MyCircularFlag regardless of useTeamLogo prop

  // CRITICAL DEBUG: Log the exact decision state
  console.log(`🔥 [MyWorldTeamLogo] CRITICAL DECISION for ${teamName}:`, {
    shouldUseCircularFlag,
    teamId,
    logoUrl,
    leagueContext
  });

  if (shouldUseCircularFlag) {
    console.log(`🌍 [MyWorldTeamLogo] ✅ CONFIRMED: Rendering MyCircularFlag for national team: ${teamName}`);
    return (
      <MyCircularFlag
        teamName={teamName}
        teamId={teamId} // Pass teamId to MyCircularFlag for better fallback handling
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
  console.log(`🏟️ [MyWorldTeamLogo] ❌ FALLBACK: Rendering LazyImage for club team: ${teamName} (shouldUseCircularFlag was ${shouldUseCircularFlag})`);
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