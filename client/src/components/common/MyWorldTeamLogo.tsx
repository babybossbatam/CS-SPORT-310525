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
    originalName?: string; // Added to preserve original league name if transformed
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

    const isActualNationalTeam = isNationalTeam(
      { name: teamName },
      leagueContext,
    );
    const isYouthTeam =
      teamName?.includes("U17") ||
      teamName?.includes("U19") ||
      teamName?.includes("U20") ||
      teamName?.includes("U21") ||
      teamName?.includes("U23");

    // Special handling for COTIF Tournament - detect club vs national teams
    const leagueName = leagueContext?.name?.toLowerCase() || "";
    const isCOTIFTournament = leagueName.includes("cotif");

    // For COTIF Tournament, we need to distinguish between club and national teams
    if (isCOTIFTournament) {
      console.log(
        `🏆 [MyWorldTeamLogo] COTIF Tournament detected for team: ${teamName}`,
      );

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
        console.log(
          `🏟️ [MyWorldTeamLogo] COTIF: ${teamName} identified as club team - using club logo`,
        );
        const result = false; // Use club logo format
        circularFlagCache.set(cacheKey, { result, timestamp: now });
        return result;
      }

      // For youth teams in COTIF that are national teams
      if (isYouthTeam && isActualNationalTeam) {
        console.log(
          `🇺🇳 [MyWorldTeamLogo] COTIF: ${teamName} identified as national youth team - using circular flag`,
        );
        const result = true; // Use circular flag format
        circularFlagCache.set(cacheKey, { result, timestamp: now });
        return result;
      }

      // Default for COTIF: if it's a recognizable country name, use circular flag
      if (isActualNationalTeam) {
        console.log(
          `🌍 [MyWorldTeamLogo] COTIF: ${teamName} identified as national team - using circular flag`,
        );
        const result = true;
        circularFlagCache.set(cacheKey, { result, timestamp: now });
        return result;
      }
    }

    const leagueCountry = leagueContext?.country?.toLowerCase() || "";

    // Check if this is FIFA Club World Cup (club competition, not national teams)
    const isFifaClubWorldCup =
      leagueName.includes("fifa club world cup") ||
      leagueName.includes("club world cup") ||
      leagueName.includes("fifa club wc");

    // More specific friendlies detection
    const isFriendliesClub =
      leagueName.includes("friendlies clubs") ||
      leagueName.includes("friendlies club") ||
      leagueName.includes("club friendlies");

    // Friendlies International (league ID 10) should be treated as national team competition
    const isFriendliesInternational =
      leagueName === "friendlies international" ||
      leagueName === "international friendlies" ||
      (leagueName.includes("friendlies") &&
        leagueName.includes("international")) ||
      (leagueName === "friendlies" && !isFriendliesClub);

    // Special handling for "Friendlies Clubs" - distinguish between national and club teams
    if (isFriendliesClub) {
      console.log(
        `🏆 [MyWorldTeamLogo] Friendlies Clubs detected for team: ${teamName}`,
      );

      // Comprehensive international team names from circle-flags gallery
      const internationalTeamNames = [
        'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
        'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas',
        'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize',
        'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
        'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
        'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China',
        'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba',
        'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
        'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia',
        'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
        'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
        'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
        'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
        'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan',
        'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
        'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
        'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia',
        'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
        'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
        'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
        'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
        'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
        'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
        'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
        'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
        'Sao Tome and Principe', 'Saudi Arabia', 'Scotland', 'Senegal', 'Serbia',
        'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
        'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka',
        'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
        'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga',
        'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
        'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
        'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Wales',
        'Yemen', 'Zambia', 'Zimbabwe', 'England', 'FYR Macedonia', 'UAE', 'USA', 'UK'
      ];

      // Known club team patterns
      const isDefinitelyClubTeam =
        teamName.toLowerCase().includes("fc ") ||
        teamName.toLowerCase().includes(" fc") ||
        teamName.toLowerCase().includes("cf ") ||
        teamName.toLowerCase().includes(" cf") ||
        teamName.toLowerCase().includes("sc ") ||
        teamName.toLowerCase().includes(" sc") ||
        teamName.toLowerCase().includes("ac ") ||
        teamName.toLowerCase().includes(" ac") ||
        teamName.toLowerCase().includes("real ") ||
        teamName.toLowerCase().includes("club ") ||
        teamName.toLowerCase().includes(" club") ||
        teamName.toLowerCase().includes("united") ||
        teamName.toLowerCase().includes("city") ||
        teamName.toLowerCase().includes("town") ||
        teamName.toLowerCase().includes("rovers") ||
        teamName.toLowerCase().includes("athletic") ||
        teamName.toLowerCase().includes("sporting") ||
        teamName.toLowerCase().includes("dynamo") ||
        teamName.toLowerCase().includes("lokomotiv") ||
        teamName.toLowerCase().includes("olympiakos") ||
        teamName.toLowerCase().includes("panathinaikos");

      // Enhanced national team detection using comprehensive list
      const isDefinitelyNationalTeam = internationalTeamNames.some(country => {
        const teamNameLower = teamName.toLowerCase().trim();
        const countryLower = country.toLowerCase();

        // Exact match
        if (teamNameLower === countryLower) return true;

        // Remove common suffixes for comparison
        const cleanTeamName = teamNameLower.replace(/\s+(u21|u20|u19|u23|national team)$/i, '').trim();
        const cleanCountry = countryLower.replace(/\s+(u21|u20|u19|u23|national team)$/i, '').trim();

        return cleanTeamName === cleanCountry;
      });

      if (isDefinitelyClubTeam && !isDefinitelyNationalTeam) {
        console.log(
          `🏟️ [MyWorldTeamLogo] Friendlies Clubs: ${teamName} identified as club team - using club logo`,
        );
        const result = false; // Use club logo format
        circularFlagCache.set(cacheKey, { result, timestamp: now });
        return result;
      }

      if (isDefinitelyNationalTeam && !isDefinitelyClubTeam) {
        console.log(
          `🇺🇳 [MyWorldTeamLogo] Friendlies Clubs: ${teamName} identified as national team - transforming to Friendlies International`,
        );

        // Transform league context to indicate it's international
        if (leagueContext && leagueContext.name === 'Friendlies Clubs') {
          // Ensure leagueContext is mutable and has name property
          leagueContext.name = 'Friendlies International';
          leagueContext.originalName = 'Friendlies Clubs'; // Store original name
        }

        const result = true; // Use circular flag format
        circularFlagCache.set(cacheKey, { result, timestamp: now });
        return result;
      }

      // If uncertain, check if it's a recognizable national team
      if (isActualNationalTeam) {
        console.log(
          `🌍 [MyWorldTeamLogo] Friendlies Clubs: ${teamName} identified as national team by isNationalTeam - transforming to Friendlies International`,
        );

        // Transform league context to indicate it's international
        if (leagueContext && leagueContext.name === 'Friendlies Clubs') {
          leagueContext.name = 'Friendlies International';
          leagueContext.originalName = 'Friendlies Clubs';
        }

        const result = true;
        circularFlagCache.set(cacheKey, { result, timestamp: now });
        return result;
      }

      // Default for unclear cases in Friendlies Clubs - use club logo
      console.log(
        `❓ [MyWorldTeamLogo] Friendlies Clubs: ${teamName} unclear classification - defaulting to club logo`,
      );
      const result = false;
      circularFlagCache.set(cacheKey, { result, timestamp: now });
      return result;
    }

    const isUefaEuropaLeague =
      leagueName.includes("uefa europa league") ||
      leagueName.includes("europa league");
    const isUefaConferenceLeague =
      leagueName.includes("uefa europa conference league") ||
      leagueName.includes("europa conference league");
    const isUefaChampionsLeague =
      leagueName.includes("uefa champions league") ||
      leagueName.includes("champions league");
    const isConmebolSudamericana =
      leagueName.includes("conmebol sudamericana") ||
      leagueName.includes("copa sudamericana");

    const isUefaNationsLeague =
      leagueName.includes("uefa nations league") ||
      leagueName.includes("nations league");

    // AFC competitions with national teams
    const isAfcU20AsianCup =
      leagueName.includes("afc u20 asian cup") ||
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
        isYouthTeam,
      });
    }

    // Check if this is being used in a standings context (club competition)
    const isStandingsContext =
      leagueName.includes("standing") ||
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
    const isClubYouthTeam =
      (teamName?.includes("Valencia U20") && teamId === 532) ||
      (teamName?.includes("Alboraya U20") && teamId === 19922);

    // Additional check for known club teams that should NEVER use circular flags
    const isKnownClubTeam =
      teamName &&
      (teamName.toLowerCase().includes("fc") ||
        teamName.toLowerCase().includes("cf") ||
        teamName.toLowerCase().includes("united") ||
        teamName.toLowerCase().includes("city") ||
        teamName.toLowerCase().includes("athletic") ||
        teamName.toLowerCase().includes("realmadrid") ||
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
        teamName.toLowerCase().includes("atletico"));

    // Enhanced national team detection for youth and women's teams
    const isWomensNationalTeam =
      teamName?.endsWith(" W") && isActualNationalTeam && !isKnownClubTeam;
    const isNationalYouthTeam =
      isYouthTeam && isActualNationalTeam && !isKnownClubTeam;

    // Debug logging for AFC competitions
    if (leagueName.includes("afc") || leagueName.includes("asian cup")) {
      console.log("🏆 [MyWorldTeamLogo] AFC Competition Detection:", {
        teamName,
        leagueName,
        isAfcU20AsianCup,
        isActualNationalTeam,
        isYouthTeam,
        isWomensNationalTeam,
      });
    }

    // Comprehensive recognized country names list
    const isRecognizedCountryName =
      teamName &&
      ([
        "Iraq",
        "Pakistan",
        "Australia",
        "Northern Mariana Islands",
        "Yemen",
        "Singapore",
        "San Marino",
        "Malaysia",
        "Lebanon",
        "Kuwait",
        "Myanmar",
        "Uzbekistan",
        "Sri Lanka",
        "Vietnam",
        "Bangladesh",
        "Afghanistan",
        "India",
        "Iran",
        "Japan",
        "Thailand",
        "Mongolia",
        "Indonesia",
        "Laos",
        "Syria",
        "Philippines",
        "Turkmenistan",
        "Chinese Taipei",
        "Palestine",
        "Kyrgyz Republic",
        "Hong Kong",
        "Bahrain",
        "Jordan",
        "Bhutan",
        "Tajikistan",
        "Nepal",
        "Qatar",
        "Brunei",
        "UAE",
        "Guam",
        "Saudi Arabia",
        "FYR Macedonia",
        "North Macedonia",
        "Macedonia",
        "United Arab Emirates",
        "Finland",

        "Belarus",
        "Belgium",
      ].includes(teamName.replace(/\s+U\d+$/, "").trim()) ||
        [
          "Iraq",
          "Pakistan",
          "Australia",
          "Northern Mariana Islands",
          "Yemen",
          "Singapore",
          "Malaysia",
          "Lebanon",
          "Kuwait",
          "Myanmar",
          "Uzbekistan",
          "Sri Lanka",
          "Vietnam",
          "Bangladesh",
          "Afghanistan",
          "India",
          "Iran",
          "Japan",
          "Thailand",
          "Mongolia",
          "Indonesia",
          "Laos",
          "Syria",
          "Philippines",
          "Turkmenistan",
          "Chinese Taipei",
          "Palestine",
          "Kyrgyz Republic",
          "Hong Kong",
          "Bahrain",
          "Jordan",
          "Bhutan",
          "Tajikistan",
          "Nepal",
          "Qatar",
          "Brunei",
          "Guam",
          "Saudi Arabia",
          "FYR Macedonia",
          "North Macedonia",
          "Macedonia",
          "United Arab Emirates",
          "Finland",

          "Belarus",
          "Belgium",
        ].includes(teamName));

    // Force circular flag for all recognized national teams
    const result =
      !isStandingsContext &&
      !isClubYouthTeam &&
      !isKnownClubTeam &&
      (isActualNationalTeam || isRecognizedCountryName) &&
      !isFifaClubWorldCup &&
      !isFriendliesClub &&
      !isUefaEuropaLeague &&
      !isUefaConferenceLeague &&
      !isUefaChampionsLeague &&
      !isConmebolSudamericana;

    // Cache the result
    circularFlagCache.set(cacheKey, {
      result,
      timestamp: now,
    });

    // Debug logging for specific club youth teams
    if (
      teamName?.includes("Valencia U20") ||
      teamName?.includes("Alboraya U20")
    ) {
      console.log(
        `🏟️ [MyWorldTeamLogo] Club Youth Team Detection for ${teamName}:`,
        {
          teamId: teamId,
          isClubYouthTeam:
            (teamName?.includes("Valencia U20") && teamId === 532) ||
            (teamName?.includes("Alboraya U20") && teamId === 19922),
          shouldUseCircularFlag: result,
          leagueName: leagueName,
        },
      );
    }

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
        moveLeft={moveLeft}
      />
    </div>
  );
};

export default MyWorldTeamLogo;