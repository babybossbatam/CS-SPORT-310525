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

    // Get list of known national team names for better detection
    const nationalTeamNames = [
      'Argentina', 'Brazil', 'France', 'Germany', 'Spain', 'Italy', 'England', 'Portugal',
      'Netherlands', 'Belgium', 'Croatia', 'Mexico', 'Colombia', 'Uruguay', 'Chile',
      'Peru', 'Ecuador', 'Venezuela', 'Bolivia', 'Paraguay', 'Costa Rica', 'Panama',
      'Honduras', 'Guatemala', 'El Salvador', 'Nicaragua', 'Jamaica', 'Haiti',
      'Trinidad and Tobago', 'Barbados', 'Grenada', 'Dominican Republic', 'Cuba',
      'Canada', 'USA', 'United States', 'Poland', 'Czech Republic', 'Slovakia',
      'Hungary', 'Romania', 'Russia', 'Bulgaria', 'Serbia', 'Montenegro', 'Bosnia', 'Albania',
      'North Macedonia', 'Macedonia', 'FYR Macedonia', 'Slovenia', 'Kosovo', 'Moldova',
      'Ukraine', 'Belarus', 'Lithuania', 'Latvia', 'Estonia', 'Finland', 'Sweden',
      'Norway', 'Denmark', 'Iceland', 'Ireland', 'Wales', 'Scotland', 'Northern Ireland',
      'Switzerland', 'Austria', 'Luxembourg', 'Liechtenstein', 'Malta', 'Cyprus',
      'Georgia', 'Gibraltar', 'Armenia', 'Azerbaijan', 'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan',
      'Tajikistan', 'Turkmenistan', 'Afghanistan', 'Pakistan', 'India', 'Bangladesh',
      'Sri Lanka', 'Maldives', 'Nepal', 'Bhutan', 'Myanmar', 'Thailand', 'Laos',
      'Cambodia', 'Vietnam', 'Malaysia', 'Singapore', 'Brunei', 'Philippines',
      'Indonesia', 'Timor-Leste', 'Papua New Guinea', 'Fiji', 'Vanuatu', 'Samoa',
      'Tonga', 'Solomon Islands', 'New Zealand', 'Australia', 'Japan', 'South Korea',
      'North Korea', 'China', 'Hong Kong', 'Macau', 'Chinese Taipei', 'Mongolia',
      'Iran', 'Iraq', 'Jordan', 'Lebanon', 'Syria', 'Palestine', 'Israel',
      'Saudi Arabia', 'UAE', 'United Arab Emirates', 'Qatar', 'Bahrain', 'Kuwait',
      'Oman', 'Yemen', 'Turkey', 'Egypt', 'Libya', 'Tunisia', 'Algeria', 'Morocco',
      'Sudan', 'South Sudan', 'Ethiopia', 'Eritrea', 'Djibouti', 'Somalia',
      'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi', 'DR Congo', 'Congo',
      'Central African Republic', 'Chad', 'Cameroon', 'Equatorial Guinea', 'Gabon',
      'São Tomé and Príncipe', 'Nigeria', 'Niger', 'Mali', 'Burkina Faso', 'Ghana',
      'Togo', 'Benin', 'Ivory Coast', 'Liberia', 'Sierra Leone', 'Guinea', 'Guinea-Bissau',
      'Senegal', 'Gambia', 'Mauritania', 'Cape Verde', 'South Africa', 'Namibia',
      'Botswana', 'Zimbabwe', 'Zambia', 'Malawi', 'Mozambique', 'Madagascar',
      'Mauritius', 'Seychelles', 'Comoros', 'Lesotho', 'Eswatini', 'Angola',
      'Faroe Islands'
    ];

    // Check if team name matches a country (considering youth teams)
    const baseTeamName = teamName?.replace(/\s*(U21|U20|U19|U18|U17)\s*/gi, '').trim();
    const isCountryName = nationalTeamNames.some(country =>
      baseTeamName === country || 
      teamName?.includes(country) ||
      // Handle special cases
      (country === 'United Arab Emirates' && (teamName?.includes('UAE') || teamName?.includes('United Arab Emirates'))) ||
      (country === 'United States' && (teamName?.includes('USA') || teamName?.includes('United States')))
    );

    // Known club team patterns - these should NEVER use circular flags
    // BUT exclude if it's actually a country name
    const isKnownClubTeam =
      teamName && !isCountryName &&
      (teamName.toLowerCase().includes("fc ") ||
        teamName.toLowerCase().includes("cf ") ||
        teamName.toLowerCase().includes("ac ") ||
        teamName.toLowerCase().includes("sc ") ||
        (teamName.toLowerCase().includes("united") && !teamName.toLowerCase().includes("united arab emirates") && !teamName.toLowerCase().includes("united states")) ||
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

    // Enhanced debugging for your specific case
    console.log(`🔍 [MyWorldTeamLogo] DECISION ANALYSIS for ${teamName}:`, {
      isKnownClubTeam,
      isClubYouthTeam,
      isClubCompetition,
      isNationalTeamCompetition,
      isActualNationalTeam,
      isMixedCompetition,
      leagueName,
      teamName
    });

    // PRIORITY 1: If it's a confirmed national team, prioritize that over club keywords
    if (isActualNationalTeam && !isClubYouthTeam) {
      // Additional check: even if club keywords exist, verify it's not actually a national team
      if (isNationalTeamCompetition || isMixedCompetition) {
        result = true;
        console.log(`🇺🇳 [MyWorldTeamLogo] PRIORITY: ${teamName} confirmed as national team - using circular flag`);
      } else if (!isClubCompetition) {
        result = true;
        console.log(`🌍 [MyWorldTeamLogo] PRIORITY: ${teamName} is national team outside club competition - using circular flag`);
      } else {
        // National team name but in club competition - check more carefully
        if (isKnownClubTeam && !nationalTeamNames.some(country => 
          teamName.includes(country) || teamName.replace(/\s*(U21|U20|U19|U18|U17)\s*/gi, '').trim() === country
        )) {
          result = false;
          console.log(`🏟️ [MyWorldTeamLogo] ${teamName} has club patterns and no clear country match - using club logo`);
        } else {
          result = true;
          console.log(`🇺🇳 [MyWorldTeamLogo] ${teamName} confirmed country name overrides club keywords - using circular flag`);
        }
      }
    }
    // PRIORITY 2: Clear club teams that are NOT national teams
    else if (isKnownClubTeam && !isActualNationalTeam) {
      result = false;
      console.log(`🏟️ [MyWorldTeamLogo] ${teamName} confirmed as club team - using club logo`);
    }
    // PRIORITY 3: Club youth teams
    else if (isClubYouthTeam) {
      result = false;
      console.log(`🏟️ [MyWorldTeamLogo] ${teamName} confirmed as club youth team - using club logo`);
    }
    // PRIORITY 4: Club competitions (but double-check for national teams)
    else if (isClubCompetition && !isActualNationalTeam) {
      result = false;
      console.log(`🏆 [MyWorldTeamLogo] ${teamName} in club competition and not national team - using club logo`);
    }
    // PRIORITY 5: National team competitions
    else if (isNationalTeamCompetition) {
      result = true;
      console.log(`🇺🇳 [MyWorldTeamLogo] ${teamName} in national team competition - using circular flag`);
    }
    // PRIORITY 6: Mixed competitions - use detection
    else if (isMixedCompetition) {
      result = isActualNationalTeam;
      console.log(`🔄 [MyWorldTeamLogo] Mixed competition: ${teamName} using detection result: ${result}`);
    }
    // PRIORITY 7: Default fallback
    else {
      result = isActualNationalTeam;
      console.log(`❓ [MyWorldTeamLogo] ${teamName} using default national team detection: ${result}`);
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
  // National teams should ALWAYS use MyCircularFlag regardless of useTeamLogo prop
  if (shouldUseCircularFlag) {
    console.log(`🌍 [MyWorldTeamLogo] Rendering MyCircularFlag for national team: ${teamName}`);
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