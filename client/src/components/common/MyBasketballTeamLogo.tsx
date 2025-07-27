import React, { useMemo } from "react";
import MyBasketballCircularFlag from "./MyBasketballCircularFlag";
import LazyImage from "./LazyImage";
import { isNationalTeam, getTeamLogoSources, createTeamLogoErrorHandler } from "../../lib/teamLogoSources";

interface MyBasketballTeamLogoProps {
  teamName: string;
  teamId?: number;
  teamLogo?: string;
  logoUrl?: string; // Alternative prop name for compatibility
  alt?: string;
  size?: string | "small" | "medium" | "large";
  className?: string;
  moveLeft?: boolean;
  country?: string; // Basketball teams often have explicit country info
}

// Cache for computed shouldUseCircularFlag results
const basketballCircularFlagCache = new Map<string, { result: boolean; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Generate cache key for shouldUseCircularFlag computation
const generateCacheKey = (teamName: string, country?: string): string => {
  return `basketball_${teamName}_${country || 'unknown'}`;
};

const MyBasketballTeamLogo: React.FC<MyBasketballTeamLogoProps> = ({
  teamName,
  teamId,
  teamLogo,
  logoUrl,
  alt,
  size = "64px",
  className = "",
  moveLeft = false,
  country,
}) => {
  // Convert size strings to pixel values for basketball
  const getSizeValue = (size: string): string => {
    switch (size) {
      case "small":
        return "32px";
      case "medium":
        return "48px";
      case "large":
        return "64px";
      case "xs":
        return "24px";
      default:
        return size;
    }
  };

  const actualSize = getSizeValue(size);
  const logoSource = teamLogo || logoUrl;

  // Memoized computation for shouldUseCircularFlag specific to basketball
  const shouldUseCircularFlag = useMemo(() => {
    const cacheKey = generateCacheKey(teamName, country);

    // Check cache first
    const cached = basketballCircularFlagCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`💾 [MyBasketballTeamLogo] Cache hit for shouldUseCircularFlag: ${teamName}`);
      return cached.result;
    }

    // Compute the result if not cached or expired
    console.log(`🔄 [MyBasketballTeamLogo] Computing shouldUseCircularFlag for: ${teamName}`);

    // Basketball-specific logic for determining when to use circular flags
    const isNationalTeam = teamName?.toLowerCase().includes("national") ||
                          teamName?.toLowerCase().includes("senior") ||
                          teamName?.toLowerCase().includes("men's") ||
                          teamName?.toLowerCase().includes("women's") ||
                          teamName?.includes("U18") ||
                          teamName?.includes("U19") ||
                          teamName?.includes("U20") ||
                          teamName?.includes("U21") ||
                          teamName?.includes("U23");

    // Check if it's a country-based team (common in international basketball)
    const countryBasedTeam = country !== undefined || 
                            teamName?.toLowerCase().includes("national") ||
                            /^[A-Z][a-z]+ (Senior|Men|Women|U\d+)/.test(teamName);

    // For EuroLeague and major club competitions, prefer club logos
    const isClubTeam = teamName?.toLowerCase().includes("fc ") ||
                      teamName?.toLowerCase().includes("bc ") ||
                      teamName?.toLowerCase().includes("basketball") ||
                      teamName?.toLowerCase().includes("club") ||
                      // Major basketball club patterns
                      /^(Real|FC|BC|Olympiacos|Panathinaikos|CSKA|Fenerbahce|Zalgiris|Maccabi)/i.test(teamName);

    const result = (isNationalTeam || countryBasedTeam) && !isClubTeam;

    // Cache the result
    basketballCircularFlagCache.set(cacheKey, {
      result,
      timestamp: now
    });

    console.log(`🏀 [MyBasketballTeamLogo] shouldUseCircularFlag for ${teamName}: ${result}`, {
      isNationalTeam,
      countryBasedTeam,
      isClubTeam,
      country
    });

    return result;
  }, [teamName, country]);

  // For basketball teams, use team logo sources with basketball sport parameter
  const getLogoUrl = () => {
    if (teamId) {
      const logoSources = getTeamLogoSources({ id: teamId, name: teamName }, false, 'basketball');
      return logoSources[0]?.url || "/assets/fallback-logo.svg";
    }
    return "/assets/fallback-logo.svg";
  };

  // If we should use circular flag (for national teams)
  if (shouldUseCircularFlag) {
    return (
      <MyBasketballCircularFlag
        teamName={teamName}
        teamId={teamId}
        fallbackUrl={logoSource || "/assets/fallback-logo.svg"}
        alt={alt || teamName}
        size={actualSize}
        className={className}
        moveLeft={moveLeft}
        countryName={country}
      />
    );
  }

  // For club teams, use regular logo with LazyImage
  const finalLogoUrl = logoSource || 
                      (teamId ? `https://media.api-sports.io/basketball/teams/${teamId}.png` : null) ||
                      "/assets/fallback-logo.svg";

  return (
    <div
      className={`basketball-team-logo ${className}`}
      style={{
        width: actualSize,
        height: actualSize,
        position: "relative",
        left: moveLeft ? "-16px" : "4px",
        borderRadius: "50%",
        overflow: "hidden",
      }}
    >
      <LazyImage
        src={finalLogoUrl}
        alt={alt || teamName}
        className="team-logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "50%",
        }}
        onError={
          teamId 
            ? createTeamLogoErrorHandler({ id: teamId, name: teamName }, false, 'basketball')
            : (e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("/assets/fallback-logo.svg")) {
                  target.src = "/assets/fallback-logo.svg";
                }
              }
        }
      />
    </div>
  );
};

export default MyBasketballTeamLogo;