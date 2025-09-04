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
  onLoad, // Added for potential use
}) => {
  const [imageSrc, setImageSrc] = useState<string>(teamLogo || "/assets/fallback.png");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

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

    const leagueName = leagueContext?.name?.toLowerCase() || "";
    const leagueCountry = leagueContext?.country?.toLowerCase() || "";

    // Enhanced country name detection for actual national teams
    const countryNames = [
      'malaysia', 'singapore', 'saudi arabia', 'fyr macedonia', 'united arab emirates', 'syria',
      'argentina', 'brazil', 'spain', 'france', 'germany', 'italy', 'england',
      'portugal', 'netherlands', 'belgium', 'croatia', 'morocco', 'japan',
      'south korea', 'australia', 'mexico', 'usa', 'united states', 'canada', 'chile',
      'colombia', 'uruguay', 'peru', 'ecuador', 'venezuela', 'bolivia',
      'paraguay', 'ghana', 'nigeria', 'senegal', 'cameroon', 'tunisia',
      'algeria', 'egypt', 'south africa', 'ivory coast', 'mali', 'burkina faso',
      'cape verde', 'guinea', 'zambia', 'zimbabwe', 'madagascar', 'comoros',
      'mauritius', 'seychelles', 'djibouti', 'somalia', 'eritrea', 'ethiopia',
      'sudan', 'libya', 'chad', 'central african republic', 'democratic republic of congo',
      'republic of congo', 'gabon', 'equatorial guinea', 'sao tome and principe',
      'angola', 'namibia', 'botswana', 'lesotho', 'swaziland', 'malawi',
      'mozambique', 'tanzania', 'kenya', 'uganda', 'rwanda', 'burundi',
      'china', 'india', 'indonesia', 'thailand', 'vietnam', 'philippines',
      'myanmar', 'laos', 'cambodia', 'brunei', 'taiwan', 'hong kong', 'macau', 
      'north korea', 'mongolia', 'bangladesh', 'sri lanka', 'maldives', 'nepal', 
      'bhutan', 'afghanistan', 'pakistan', 'iran', 'iraq', 'lebanon', 'jordan', 
      'palestine', 'israel', 'turkey', 'cyprus', 'armenia', 'georgia', 'azerbaijan', 
      'kazakhstan', 'uzbekistan', 'turkmenistan', 'kyrgyzstan', 'tajikistan', 'russia',
      'ukraine', 'belarus', 'moldova', 'romania', 'bulgaria', 'serbia',
      'bosnia and herzegovina', 'montenegro', 'kosovo', 'albania', 'north macedonia',
      'greece', 'malta', 'san marino', 'vatican', 'monaco', 'andorra', 'liechtenstein', 
      'switzerland', 'austria', 'czech republic', 'slovakia', 'poland', 'hungary', 
      'slovenia', 'latvia', 'lithuania', 'estonia', 'finland', 'sweden', 'norway', 
      'denmark', 'iceland', 'faroe islands', 'greenland', 'ireland', 'united kingdom', 
      'scotland', 'wales', 'northern ireland', 'gibraltar', 'jersey', 'guernsey',
      'isle of man', 'luxembourg', 'new zealand', 'fiji', 'papua new guinea',
      'solomon islands', 'vanuatu', 'new caledonia', 'french polynesia',
      'samoa', 'tonga', 'cook islands', 'niue', 'palau', 'marshall islands',
      'micronesia', 'nauru', 'kiribati', 'tuvalu'
    ];

    // Additional country team names for enhanced detection
    const countryTeamNames = countryNames;

    // Check if this is actually a national team regardless of league name
    const isActualNationalTeam = teamName?.match(/\b(u20|u21|u23|u-20|u-21|u-23)\b/i) ||
                                 countryNames.some(country => 
                                   teamName?.toLowerCase().includes(country.toLowerCase())
                                 ) ||
                                 // Enhanced country team detection
                                 countryTeamNames.some(country => {
                                   const teamLower = teamName?.toLowerCase() || '';
                                   return teamLower === country || 
                                          teamLower.startsWith(country + ' ') ||
                                          teamLower.endsWith(' ' + country) ||
                                          (country.includes(' ') && teamLower.includes(country));
                                 });


    const isYouthTeam = teamName?.includes("U17") ||
                       teamName?.includes("U19") ||
                       teamName?.includes("U20") ||
                       teamName?.includes("U21") ||
                       teamName?.includes("U23");

    // Special handling for COTIF Tournament - detect club vs national teams
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

    // Check if this is FIFA Club World Cup (club competition, not national teams)
    const isFifaClubWorldCup = leagueName.includes("fifa club world cup") ||
                              leagueName.includes("club world cup") ||
                              leagueName.includes("fifa club wc");

    // Enhanced Friendlies detection with more specific logic
    const isFriendliesInternational = leagueName.includes("friendlies") && 
                                     !leagueName.includes("club") &&
                                     !leagueName.includes("youth");

    const isFriendliesClub = leagueName.includes("friendlies") && 
                            leagueName.includes("club");

    // Use these for debugging friendlies
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
        isAfcU20AsianCup: leagueName.includes("afc u20 asian cup") ||
                         leagueName.includes("afc u-20 asian cup") ||
                         leagueName.includes("asian cup u20") ||
                         leagueName.includes("asian cup u-20"),
        isActualNationalTeam,
        isYouthTeam,
        isWomensNationalTeam
      });
    }

    // Friendlies Clubs National Team detection
    const isFriendliesClubsNationalTeam = leagueName.includes("friendlies") && isActualNationalTeam && !isKnownClubTeam && !isYouthTeam;
    // Determine if it's UEFA Nations League
    const isUefaNationsLeague = leagueName.includes("uefa nations league");
    // Determine if it's World Cup Qualification
    const isWorldCupQualification = leagueName.includes("world cup qualification") || leagueName.includes("wc qualification");
    // Determine if it's AFC U20 Asian Cup
    const isAfcU20AsianCup = leagueName.includes("afc u20 asian cup") ||
                             leagueName.includes("afc u-20 asian cup") ||
                             leagueName.includes("asian cup u20") ||
                             leagueName.includes("asian cup u-20");
    // Determine if it's UEFA Europa League
    const isUefaEuropaLeague = leagueName.includes("europa league");
    // Determine if it's UEFA Conference League
    const isUefaConferenceLeague = leagueName.includes("conference league");
    // Determine if it's UEFA Champions League
    const isUefaChampionsLeague = leagueName.includes("champions league");
    // Determine if it's CONMEBOL Sudamericana
    const isConmebolSudamericana = leagueName.includes("sudamericana");


    // Use circular flag for national teams in international competitions
    // BUT: Force club teams to ALWAYS use club logos regardless of league context
    const result = !isStandingsContext &&
                   !isClubYouthTeam &&
                   !isKnownClubTeam &&
                   isActualNationalTeam &&
                   (isNationalYouthTeam || isWomensNationalTeam || (!isYouthTeam && !teamName?.endsWith(" W"))) && // Allow national youth and women's teams
                   (isFriendliesInternational || isUefaNationsLeague || isAfcU20AsianCup || isWorldCupQualification || isFriendliesClubsNationalTeam) && // Added isFriendliesClubsNationalTeam
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
  }, [teamName, leagueContext]); // leagueContext is now a dependency

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