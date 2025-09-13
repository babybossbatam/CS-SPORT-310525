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

  // Mocking 'sport' and 'logoUrl' for the sake of the example to compile
  // In a real scenario, these would come from props, context, or another state management solution.
  const sport = "football"; 
  const logoUrl = teamLogo || `/api/team-logo/square/${teamId}?size=64&sport=${sport}`;


  // Enhanced national team detection with more comprehensive patterns
  const shouldUseCircularFlag = useMemo(() => {
    if (!teamName) return false;

    // PRIORITY CHECK: Explicitly exclude FIFA Club World Cup and other club competitions
    const isClubCompetition = leagueContext?.name?.toLowerCase().includes('fifa club world cup') ||
                             leagueContext?.name?.toLowerCase().includes('club world cup') ||
                             leagueContext?.name?.toLowerCase().includes('champions league') ||
                             leagueContext?.name?.toLowerCase().includes('europa league') ||
                             leagueContext?.name?.toLowerCase().includes('conference league');

    if (isClubCompetition) {
      console.log(`🏟️ [MyWorldTeamLogo] Club competition detected: ${leagueContext?.name} - forcing club logo for ${teamName}`);
      return false;
    }

    // Direct check using the isNationalTeam function
    const isNational = isNationalTeam({ name: teamName }, leagueContext);

    // Additional specific checks for youth teams that might be missed
    const additionalNationalChecks = [
      'republic of ireland u21',
      'northern ireland u21', 
      'faroe islands u21',
      'kosovo u21',
      'iceland u21',
      'romania u21',
      'moldova u21'
    ];

    const isAdditionalNational = additionalNationalChecks.includes(teamName.toLowerCase());

    // Enhanced detection for youth teams
    const youthTeamPattern = /^(.+?)\s+(u|under)[-\s]?(17|19|20|21|23)$/i;
    const youthMatch = teamName.match(youthTeamPattern);
    let isYouthNational = false;

    if (youthMatch) {
      const baseCountry = youthMatch[1].trim().toLowerCase();
      const knownCountries = [
        'republic of ireland', 'northern ireland', 'faroe islands', 'kosovo', 
        'iceland', 'romania', 'moldova', 'england', 'scotland', 'wales',
        'spain', 'italy', 'france', 'germany', 'portugal', 'netherlands',
        'belgium', 'croatia', 'poland', 'czech republic', 'slovakia',
        'andorra', 'san marino', 'monaco', 'liechtenstein'
      ];
      isYouthNational = knownCountries.includes(baseCountry);
    }

    // Specific check for European microstates
    const isMicrostate = ['andorra', 'san marino', 'monaco', 'liechtenstein', 'vatican city']
      .includes(teamName.toLowerCase());

    const finalDecision = isNational || isAdditionalNational || isYouthNational || isMicrostate;

    // Additional debug for specific problematic teams
    if (teamName.toLowerCase().includes('andorra') || teamName.toLowerCase().includes('san marino')) {
      console.log(`🚨 [MyWorldTeamLogo] MICROSTATE DEBUG for ${teamName}:`, {
        teamNameLower: teamName.toLowerCase(),
        isNational,
        isAdditionalNational,
        isYouthNational,
        isMicrostate: ['andorra', 'san marino', 'monaco', 'liechtenstein', 'vatican city']
          .includes(teamName.toLowerCase()),
        finalDecision,
        leagueContext: leagueContext?.name
      });
    }

    console.log(`🔥 [MyWorldTeamLogo] CRITICAL DECISION for ${teamName}:`, {
      shouldUseCircularFlag: finalDecision,
      isNational,
      isAdditionalNational,
      isYouthNational,
      isMicrostate: ['andorra', 'san marino', 'monaco', 'liechtenstein', 'vatican city']
        .includes(teamName.toLowerCase()),
      teamId,
      logoUrl: logoUrl || `/api/team-logo/square/${teamId}?size=64&sport=${sport}`,
      leagueContext
    });

    return finalDecision;
  }, [teamName, leagueContext, teamId, logoUrl, sport]);


  // Synchronous logo URL resolution for club teams
  const logoUrlForClub = useMemo(() => {
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
        fallbackUrl={logoUrlForClub} // Use logoUrlForClub as fallback for national teams too
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
        src={logoUrlForClub}
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