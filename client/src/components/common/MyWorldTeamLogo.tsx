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

    const leagueName = leagueContext?.name?.toLowerCase() || "";

    // PRIORITY CHECK: Explicitly exclude FIFA Club World Cup and other club competitions
    const isClubCompetition = leagueName.includes('fifa club world cup') ||
                             leagueName.includes('club world cup') ||
                             leagueName.includes('champions league') ||
                             leagueName.includes('europa league') ||
                             leagueName.includes('conference league') ||
                             leagueName.includes('conmebol') ||
                             leagueName.includes('sudamericana') ||
                             leagueName.includes('libertadores');

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

    // Known club indicators that should NEVER use circular flags
    const clubIndicators = [
      " fc",
      " cf",
      " ac",
      " sc",
      " rc",
      " ud",
      " cd",
      " club",
      " united",
      " city",
      " athletic",
      " real ",
      " barcelona",
      " valencia",
      " sevilla",
      " arsenal",
      " liverpool",
      " chelsea",
      " juventus",
      " milan",
      " napoli",
      " roma",
      " ajax",
      " psv",
      " feyenoord",
      " bayern",
      " dortmund",
      " leipzig",
      " manchester",
      " tottenham",
      " atletico",
      " borussia",
      " eintracht",
      " inter",
      " lazio",
      " fiorentina",
      " atalanta",
      " olympique",
      " monaco",
      " lyon",
      " marseille",
      " lille",
      " nice",
      " rennes",
      " strasbourg",
      " psg",
      " paris saint",
      " saint-germain",
      " sporting",
      " porto",
      " benfica",
      " braga",
      " vitoria",
      " gil vicente",
      " famalicao",
      " pacos",
      " tondela",
      // South American club indicators
      " universidad",
      " universidade",
      " instituto",
      " deportivo",
      " deportes",
      " club ",
      " alianza",
      " independiente",
      " nacional",
      " olimpia",
      " cerro",
      " penarol",
      " boca",
      " river",
      " racing",
      " estudiantes",
      " gimnasia",
      " newells",
      " rosario",
      " velez",
      " huracan",
      " lanus",
      " defensa",
      " talleres",
      " colon",
      " union",
      " arsenal",
      " tigre",
      " platense",
      " sarmiento",
    ];
    
    const teamNameLower = teamName.toLowerCase();

    // If team name contains club indicators, it's definitely a club team
    if (clubIndicators.some((indicator) => teamNameLower.includes(indicator))) {
      console.log(`🏟️ [MyWorldTeamLogo] Club indicator found for ${teamName} in ${leagueName}: forcing club logo`);
      return false;
    }

    // Additional specific checks for South American university/club teams
    if (teamNameLower.includes("universidad") || 
        teamNameLower.includes("universidade") ||
        teamNameLower.includes("instituto") ||
        (teamNameLower.includes("alianza") && !teamNameLower.includes("seleccion")) ||
        (teamNameLower.includes("independiente") && !teamNameLower.includes("seleccion"))) {
      console.log(`🏟️ [MyWorldTeamLogo] South American club pattern detected for ${teamName}: forcing club logo`);
      return false;
    }

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

  // DECISION POINT: Use MyCircularFlag for national teams, direct club logo rendering for club teams
  // National teams should ALWAYS use MyCircularFlag regardless of useTeamLogo prop

  // CRITICAL DEBUG: Log the exact decision state
  console.log(`🔥 [MyWorldTeamLogo] CRITICAL DECISION for ${teamName}:`, {
    shouldUseCircularFlag,
    teamId,
    logoUrl: logoUrlForClub,
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

  // For club teams, render club logo directly without using MyCircularFlag
  console.log(`🏟️ [MyWorldTeamLogo] ✅ CONFIRMED: Rendering direct club logo for: ${teamName}`);
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
      <img
        src={logoUrlForClub}
        alt={alt || teamName}
        title={teamName}
        className="team-logo"
        style={imageStyle}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          console.warn(`⚠️ [MyWorldTeamLogo] Club logo error for ${teamName}:`, target.src);

          // Try different fallback options for club teams
          if (teamId && !target.src.includes(`/api/team-logo/square/${teamId}`)) {
            const fallbackUrl = `/api/team-logo/square/${teamId}?size=32`;
            console.log(`🔄 [MyWorldTeamLogo] Trying fallback: ${fallbackUrl}`);
            target.src = fallbackUrl;
            return;
          }

          // Final fallback
          if (!target.src.includes("/assets/fallback-logo.svg")) {
            console.log(`🚫 [MyWorldTeamLogo] Using final fallback for ${teamName}`);
            target.src = "/assets/fallback-logo.svg";
          }
        }}
      />
    </div>
  );
};

export default MyWorldTeamLogo;