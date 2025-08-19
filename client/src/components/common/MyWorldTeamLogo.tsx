import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { isNationalTeam, getTeamLogoSources, createTeamLogoErrorHandler } from '../../lib/teamLogoSources';
import { enhancedLogoManager } from '../../lib/enhancedLogoManager';
import { getBestTeamLogoUrl, createTeamLogoErrorHandler as createBetterErrorHandler } from '../../lib/teamLogoUtils';
import MyCircularFlag from './MyCircularFlag';
import LazyImage from './LazyImage';

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
}) => {
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

    // Compute the result if not cached or expired
    console.log(`🔄 [MyWorldTeamLogo] Computing shouldUseCircularFlag for: ${teamName}`);

    const isActualNationalTeam = isNationalTeam({ name: teamName }, leagueContext);
    const isYouthTeam = teamName?.includes("U17") || 
                       teamName?.includes("U19") ||
                       teamName?.includes("U20") || 
                       teamName?.includes("U21") ||
                       teamName?.includes("U23");

    // Special handling for COTIF Tournament - detect club vs national teams
    const leagueName = leagueContext?.name?.toLowerCase() || "";
    const isCOTIFTournament = leagueName.includes("cotif");

    // For COTIF Tournament, we need to distinguish between club and national teams
    if (isCOTIFTournament) {
      console.log(`🏆 [MyWorldTeamLogo] COTIF Tournament detected for team: ${teamName}`);

      // Known club teams in COTIF (Valencia, Alboraya, etc.)
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
        const result = false; // Use club logo format
        circularFlagCache.set(cacheKey, { result, timestamp: now });
        return result;
      }

      // For youth teams in COTIF that are national teams
      if (isYouthTeam && isActualNationalTeam) {
        console.log(`🇺🇳 [MyWorldTeamLogo] COTIF: ${teamName} identified as national youth team - using circular flag`);
        const result = true; // Use circular flag format
        circularFlagCache.set(cacheKey, { result, timestamp: now });
        return result;
      }

      // Default for COTIF: if it's a recognizable country name, use circular flag
      if (isActualNationalTeam) {
        console.log(`🌍 [MyWorldTeamLogo] COTIF: ${teamName} identified as national team - using circular flag`);
        const result = true;
        circularFlagCache.set(cacheKey, { result, timestamp: now });
        return result;
      }
    }

    const leagueCountry = leagueContext?.country?.toLowerCase() || "";

    // Check if this is FIFA Club World Cup (club competition, not national teams)
    const isFifaClubWorldCup = leagueName.includes("fifa club world cup") ||
                              leagueName.includes("club world cup") ||
                              leagueName.includes("fifa club wc");

    // More specific friendlies detection
    const isFriendliesClub = leagueName.includes("friendlies clubs") || 
                            leagueName.includes("friendlies club") ||
                            leagueName.includes("club friendlies");

    // Friendlies International (league ID 10) should be treated as national team competition
    const isFriendliesInternational = leagueName === "friendlies international" ||
                                     leagueName === "international friendlies" ||
                                     (leagueName.includes("friendlies") && 
                                      leagueName.includes("international")) ||
                                     (leagueName === "friendlies" && !isFriendliesClub);

    const isUefaEuropaLeague = leagueName.includes("uefa europa league") || 
                              leagueName.includes("europa league");
    const isUefaConferenceLeague = leagueName.includes("uefa europa conference league") || 
                                  leagueName.includes("europa conference league");
    const isUefaChampionsLeague = leagueName.includes("uefa champions league") || 
                                 leagueName.includes("champions league");
    const isConmebolSudamericana = leagueName.includes("conmebol sudamericana") ||
                                  leagueName.includes("copa sudamericana");

    const isUefaNationsLeague = leagueName.includes("uefa nations league") || 
                               leagueName.includes("nations league");

    // AFC competitions with national teams
    const isAfcU20AsianCup = leagueName.includes("afc u20 asian cup") ||
                            leagueName.includes("afc u-20 asian cup") ||
                            leagueName.includes("asian cup u20") ||
                            leagueName.includes("asian cup u-20");

    // Debug logging for Friendlies International
    if (leagueName.includes("friendlies")) {
      console.log("🔍 [MyWorldTeamLogo] Friendlies Detection:", {
        teamName,
        leagueName,
        isFriendliesInternational,
        isFriendliesClub,
        isActualNationalTeam,
        isYouthTeam
      });
    }

    // Check if this is being used in a standings context (club competition)
    const isStandingsContext = leagueName.includes("standing") || 
                               leagueName.includes("table") ||
                               // Popular domestic leagues that should always use club logos
                               leagueName.includes("premier league") ||
                               leagueName.includes("la liga") ||
                               leagueName.includes("serie a") ||
                               leagueName.includes("bundesliga") ||
                               leagueName.includes("ligue 1") ||
                               leagueName.includes("primeira liga") ||
                               leagueName.includes("eredivisie");

    // Force specific club youth teams to ALWAYS use club logos
    const isClubYouthTeam = (teamName?.includes("Valencia U20") && teamId === 532) ||
                           (teamName?.includes("Alboraya U20") && teamId === 19922);

    // Additional check for known club teams that should NEVER use circular flags
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
      teamName.toLowerCase().includes("club") ||
      teamName.toLowerCase().includes("ud ") ||
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
      teamName.toLowerCase().includes("atletico")
    );

    // Enhanced national team detection for youth and women's teams
    const isWomensNationalTeam = teamName?.endsWith(" W") && isActualNationalTeam && !isKnownClubTeam;
    const isNationalYouthTeam = isYouthTeam && isActualNationalTeam && !isKnownClubTeam;

    // Debug logging for AFC competitions
    if (leagueName.includes("afc") || leagueName.includes("asian cup")) {
      console.log("🏆 [MyWorldTeamLogo] AFC Competition Detection:", {
        teamName,
        leagueName,
        isAfcU20AsianCup,
        isActualNationalTeam,
        isYouthTeam,
        isWomensNationalTeam
      });
    }

    // Use circular flag for national teams in international competitions
    // BUT: Force club teams to ALWAYS use club logos regardless of league context
    const result = !isStandingsContext &&
                   !isClubYouthTeam &&
                   !isKnownClubTeam &&
                   isActualNationalTeam && 
                   (isNationalYouthTeam || isWomensNationalTeam || (!isYouthTeam && !teamName?.endsWith(" W"))) && // Allow national youth and women's teams
                   (isFriendliesInternational || isUefaNationsLeague || isAfcU20AsianCup) && 
                   !isFifaClubWorldCup && 
                   !isFriendliesClub && 
                   !isUefaEuropaLeague && 
                   !isUefaConferenceLeague && 
                   !isUefaChampionsLeague && 
                   !isConmebolSudamericana;

    // Cache the result
    circularFlagCache.set(cacheKey, {
      result,
      timestamp: now
    });



    // Debug logging for specific club youth teams
    if (teamName?.includes("Valencia U20") || teamName?.includes("Alboraya U20")) {
      console.log(`🏟️ [MyWorldTeamLogo] Club Youth Team Detection for ${teamName}:`, {
        teamId: teamId,
        isClubYouthTeam: (teamName?.includes("Valencia U20") && teamId === 532) ||
                        (teamName?.includes("Alboraya U20") && teamId === 19922),
        shouldUseCircularFlag: result,
        leagueName: leagueName
      });
    }

    console.log(`💾 [MyWorldTeamLogo] Cached shouldUseCircularFlag result for ${teamName}: ${result}`);
    return result;
  }, [teamName, leagueContext]);

  // Memoized logo URL resolution using enhancedLogoManager
  const [resolvedLogoUrl, setResolvedLogoUrl] = useState<string>(teamLogo || "/assets/matchdetaillogo/fallback.png");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogo = async () => {
      if (!teamId) {
        setResolvedLogoUrl('/assets/fallback-logo.svg');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await enhancedLogoManager.getTeamLogo('MyWorldTeamLogo', {
          type: 'team',
          shape: shouldUseCircularFlag ? 'circular' : 'normal',
          teamId: Number(teamId),
          teamName: teamName || '',
          sport: 'football',
          fallbackUrl: teamLogo || "/assets/matchdetaillogo/fallback.png"
        });

        console.log(`🏟️ [MyWorldTeamLogo] Logo result for ${teamName}:`, result);
        setResolvedLogoUrl(result.url);
      } catch (error) {
        console.error(`❌ [MyWorldTeamLogo] Failed to load logo for ${teamName}:`, error);
        setResolvedLogoUrl('/assets/fallback-logo.svg');
      } finally {
        setIsLoading(false);
      }
    };

    loadLogo();
  }, [teamId, teamName, teamLogo, shouldUseCircularFlag]);

  // Enhanced logo loading with proper error handling
  // Get team logo with proper error handling
  const handleImageError = useCallback(
    createTeamLogoErrorHandler({ id: teamId, name: teamName }, false),
    [teamId, teamName]
  );

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
    transform: "scale(0.9)"
  }), []);

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
        border: 'none',
        outline: 'none',
        boxShadow: 'none'
      }}
    >
      <LazyImage
        src={resolvedLogoUrl}
        alt={alt || teamName}
        title={teamName}
        className="team-logo"
        style={imageStyle}
        fallbackSrc="/assets/matchdetaillogo/fallback.png"
        onError={handleImageError}
        loading={isLoading}
      />
    </div>
  );
};

export default MyWorldTeamLogo;