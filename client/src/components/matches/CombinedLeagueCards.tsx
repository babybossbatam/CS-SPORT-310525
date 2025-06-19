import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, userActions } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import {
  shouldExcludeFromPopularLeagues,
  isPopularLeagueSuitable,
  isRestrictedUSLeague,
} from "@/lib/MyPopularLeagueExclusion";
import { QUERY_CONFIGS, CACHE_FRESHNESS } from "@/lib/cacheConfig";
import { getCurrentUTCDateString } from "@/lib/dateUtilsUpdated";
import { POPULAR_LEAGUES } from "@/lib/constants";
import { useCentralData } from '@/providers/CentralDataProvider';
import {
  DEFAULT_POPULAR_TEAMS,
  DEFAULT_POPULAR_LEAGUES,
  POPULAR_COUNTRIES,
  isLiveMatch,
} from "@/lib/matchFilters";
import { getCountryFlagWithFallbackSync, clearVenezuelaFlagCache, forceRefreshVenezuelaFlag, clearAllFlagCache } from "../../lib/flagUtils";
import { createFallbackHandler } from "../../lib/MyAPIFallback";
import { MyFallbackAPI } from "../../lib/MyFallbackAPI";
import { getCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam } from "../../lib/teamLogoSources";
import { SimpleDateFilter } from "../../lib/simpleDateFilter";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";

import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import MyMatchdetailsScoreboard from "./MyMatchdetailsScoreboard";

// Helper function to shorten team names
export const shortenTeamName = (teamName: string): string => {
  if (!teamName) return teamName;

  // Remove common suffixes that make names too long
  const suffixesToRemove = [
    "-sc",
    "-SC",
    " SC",
    " FC",
    " CF",
    " United",
    " City",
    " Islands",
    " Republic",
    " National Team",
    " U23",
    " U21",
    " U20",
    " U19",
  ];

  let shortened = teamName;
  for (const suffix of suffixesToRemove) {
    if (shortened.endsWith(suffix)) {
      shortened = shortened.replace(suffix, "");
      break;
    }
  }

  // Handle specific country name shortenings
  const countryMappings: { [key: string]: string } = {
    "Cape Verde Islands": "Cape Verde",
    "Central African Republic": "CAR",
    "Dominican Republic": "Dominican Rep",
    "Bosnia and Herzegovina": "Bosnia",
    "Trinidad and Tobago": "Trinidad",
    "Papua New Guinea": "Papua NG",
    "United Arab Emirates": "UAE",
    "Saudi Arabia": "Saudi",
    "South Africa": "S. Africa",
    "New Zealand": "New Zealand",
    "Costa Rica": "Costa Rica",
    "Puerto Rico": "Puerto Rico",
  };

  // Check if the team name matches any country mappings
  if (countryMappings[shortened]) {
    shortened = countryMappings[shortened];
  }

  return shortened.trim();
};

interface CombinedLeagueCardsProps {
  selectedDate: string;
  timeFilterActive?: boolean;
  showTop20?: boolean;
  liveFilterActive?: boolean;
  filteredFixtures?: any[];
  onMatchCardClick?: (match: any) => void;
  lazyLoadingProps?: {
    visibleMatches: Set<number>;
    createLazyRef: (matchId: number) => (node: HTMLDivElement | null) => void;
    LazyMatchSkeleton: React.ComponentType;
  };
}

const CombinedLeagueCards: React.FC<CombinedLeagueCardsProps> = ({
  selectedDate,
  timeFilterActive = false,
  showTop20 = false,
  liveFilterActive = false,
  filteredFixtures: propFilteredFixtures = [],
  onMatchCardClick,
  lazyLoadingProps,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  

  const dispatch = useDispatch();
  const { toast } = useToast();
  const favoriteTeams = useSelector(
    (state: RootState) => state.user.favoriteTeams,
  );

  // Enhanced status verification function
  const verifyMatchStatusWithSportsRadar = useCallback(async (fixture: any) => {
    try {
      const homeTeam = fixture.teams?.home?.name || '';
      const awayTeam = fixture.teams?.away?.name || '';
      
      // Call debug endpoint to get SportsRadar comparison
      const response = await fetch(`/api/debug/fixture/${fixture.fixture.id}/compare`);
      const comparison = await response.json();
      
      if (comparison.sportsRadar?.available && comparison.sportsRadar?.data) {
        const sportsRadarStatus = comparison.sportsRadar.data.status;
        
        // Check if SportsRadar shows the match as finished
        const isFinishedInSportsRadar = ['completed', 'closed', 'ended', 'finished'].some(
          status => sportsRadarStatus?.toLowerCase().includes(status)
        );
        
        if (isFinishedInSportsRadar) {
          console.log(`✅ SportsRadar confirms match is finished: ${homeTeam} vs ${awayTeam}`);
          return 'FT';
        } else {
          console.log(`⚠️ SportsRadar shows match still active: ${homeTeam} vs ${awayTeam} - status: ${sportsRadarStatus}`);
          return fixture.fixture.status.short; // Keep original status
        }
      }
      
      // If SportsRadar data not available, use time-based validation
      console.warn(`📡 SportsRadar data not available for ${homeTeam} vs ${awayTeam}, using time-based validation`);
      return null;
    } catch (error) {
      console.error(`❌ Error verifying match status for fixture ${fixture.fixture.id}:`, error);
      return null;
    }
  }, []);

  // Popular countries prioritization with new requirements
  const POPULAR_COUNTRIES_ORDER = [
    "England",
    "Spain",
    "Italy",
    "Germany",
    "France",
    "World",
    "Europe",
    "South America",
    "Brazil",
    "Saudi Arabia",
    "Egypt",
    "Colombia",
    "United States",
    "USA",
    "US",
    "United Arab Emirates",
    "United-Arab-Emirates",
  ];

  // Enhanced leagues by country with tier-based filtering
  const POPULAR_LEAGUES_BY_COUNTRY = {
    England: [39, 45, 48], // Premier League, FA Cup, EFL Cup
    Spain: [140, 143], // La Liga, Copa del Rey
    Italy: [135, 137], // Serie A, Coppa Italia
    Germany: [78, 81], // Bundesliga, DFB Pokal
    France: [61, 66], // Ligue 1, Coupe de France
    "United Arab Emirates": [301], // UAE Pro League
    Egypt: [233], // Egyptian Premier League (only major league)
    International: [15], // FIFA Club World Cup as separate category
    World: [914, 848, 15], // COSAFA Cup, UEFA Conference League, FIFA Club World Cup
  };

  // Flatten popular leagues for backward compatibility and add COSAFA Cup
  const POPULAR_LEAGUES = [
    ...Object.values(POPULAR_LEAGUES_BY_COUNTRY).flat(),
    914,
  ]; // 914 is COSAFA Cup

  // Smart cache duration based on date type
  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;

  // Longer cache for upcoming dates (4 hours), shorter for today (2 hours)
  const cacheMaxAge = isFuture ? 4 * 60 * 60 * 1000 : isToday ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000;

  // Check if we have fresh cached data
  const fixturesQueryKey = ["all-fixtures-by-date", selectedDate];

  // Use central data cache
  const { fixtures: allFixtures, isLoading: isLoadingAllFixtures, error } = useCentralData();
  const allFixturesError = error;

  // Use the prioritized popular countries list
  const POPULAR_COUNTRIES = POPULAR_COUNTRIES_ORDER;

  // Smart filtering operations
  const filteredFixtures = useMemo(() => {
    // Use provided fixtures if available, otherwise use central data
    const fixturesToFilter = propFilteredFixtures || allFixtures;
    if (!fixturesToFilter?.length) return [];

    console.log(
      `🔍 [CombinedLeagueCards] Processing ${allFixtures.length} fixtures for date: ${selectedDate}`,
    );

    const startTime = Date.now();

    // Determine what type of date is selected
    const today = new Date();
    const todayString = format(today, "yyyy-MM-dd");
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = format(tomorrow, "yyyy-MM-dd");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = format(yesterday, "yyyy-MM-dd");

    // First, map over fixtures to handle stale match detection and create new objects if needed
    const processedFixtures = allFixtures.map((fixture) => {
      // Apply stale match detection and status correction
      if (fixture?.fixture?.date && fixture?.fixture?.status) {
        const matchDate = new Date(fixture.fixture.date);
        const now = new Date();
        const status = fixture.fixture.status.short;
        const hoursElapsed = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);

        // Check if status claims to be live
        const claimsLive = ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);
        
        if (claimsLive && hoursElapsed > 3) {
          // Trigger async verification in background
          verifyMatchStatusWithSportsRadar(fixture).then((verifiedStatus) => {
            if (verifiedStatus === 'FT') {
              console.log(`✅ [CombinedLeagueCards] SportsRadar confirmed match finished: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`);
            }
          });
          
          // For immediate filtering, use time-based validation
          if (hoursElapsed > 3.5) {
            console.warn(`⚠️ [CombinedLeagueCards] Stale live match detected: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name} - status: ${status}, hours elapsed: ${hoursElapsed.toFixed(1)}`);
            
            // Return a new fixture object with updated status
            return {
              ...fixture,
              fixture: {
                ...fixture.fixture,
                status: {
                  ...fixture.fixture.status,
                  short: "FT",
                  long: "Match Finished"
                }
              }
            };
          }
        }
      }
      
      // Return original fixture if no changes needed
      return fixture;
    });

    const filtered = processedFixtures.filter((fixture) => {
      // Apply smart time filtering with selected date context
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          selectedDate + "T12:00:00Z",
        );

        // Check if this match should be included based on the selected date
        const shouldInclude = (() => {
          if (
            selectedDate === tomorrowString &&
            smartResult.label === "tomorrow"
          )
            return true;
          if (selectedDate === todayString && smartResult.label === "today")
            return true;
          if (
            selectedDate === yesterdayString &&
            smartResult.label === "yesterday"
          )
            return true;

          // Handle custom dates
          if (
            selectedDate !== todayString &&
            selectedDate !== tomorrowString &&
            selectedDate !== yesterdayString
          ) {
            if (smartResult.label === "custom" && smartResult.isWithinTimeRange)
              return true;
          }

          return false;
        })();

        if (!shouldInclude) {
          return false;
        }
      }

      // Client-side filtering for popular leagues and countries
      const leagueId = fixture.league?.id;
      const country = fixture.league?.country?.toLowerCase() || "";

      // Check if it's a popular league
      const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);

      // Check if it's from a popular country
      const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
        (popularCountry) => country.includes(popularCountry.toLowerCase()),
      );

      // Apply exclusion check FIRST
      const leagueName = fixture.league?.name?.toLowerCase() || "";
      const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || "";
      const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || "";

      // Early exclusion for women's competitions and other unwanted matches
      if (
        shouldExcludeFromPopularLeagues(
          fixture.league.name,
          fixture.teams.home.name,
          fixture.teams.away.name,
          country,
        )
      ) {
        return false;
      }

      // Check if it's an international competition
      const isInternationalCompetition =
        leagueName.includes("champions league") ||
        leagueName.includes("europa league") ||
        leagueName.includes("conference league") ||
        leagueName.includes("uefa") ||
        leagueName.includes("world cup") ||
        leagueName.includes("fifa club world cup") ||
        leagueName.includes("fifa") ||
        leagueName.includes("conmebol") ||
        leagueName.includes("copa america") ||
        leagueName.includes("copa libertadores") ||
        leagueName.includes("copa sudamericana") ||
        leagueName.includes("libertadores") ||
        leagueName.includes("sudamericana") ||
        (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
        (leagueName.includes("international") &&
          !leagueName.includes("women")) ||
        country.includes("world") ||
        country.includes("europe") ||
        country.includes("international");

      return (
        isPopularLeague || isFromPopularCountry || isInternationalCompetition
      );
    });

    const finalFiltered = filtered.filter((fixture) => {
      // Apply popular league exclusion filters
      if (
        shouldExcludeFromPopularLeagues(
          fixture.league.name,
          fixture.teams.home.name,
          fixture.teams.away.name,
          fixture.league.country,
        )
      ) {
        return false;
      }

      // Additional check for restricted US leagues
      if (isRestrictedUSLeague(fixture.league.id, fixture.league.country)) {
        return false;
      }

      // Skip fixtures with null or undefined country
      if (!fixture.league.country) {
        return false;
      }

      const countryName = fixture.league.country?.toLowerCase() || "";
      const leagueId = fixture.league.id;
      const leagueNameLower = fixture.league.name?.toLowerCase() || "";

      // Check for international competitions first
      const isInternationalCompetition =
        leagueNameLower.includes("champions league") ||
        leagueNameLower.includes("europa league") ||
        leagueNameLower.includes("conference league") ||
        leagueNameLower.includes("uefa") ||
        leagueNameLower.includes("euro") ||
        leagueNameLower.includes("world cup") ||
        leagueNameLower.includes("fifa club world cup") ||
        leagueNameLower.includes("fifa cup") ||
        leagueNameLower.includes("fifa") ||
        leagueNameLower.includes("conmebol") ||
        leagueNameLower.includes("copa america") ||
        leagueNameLower.includes("copa libertadores") ||
        leagueNameLower.includes("copa sudamericana") ||
        leagueNameLower.includes("libertadores") ||
        leagueNameLower.includes("sudamericana") ||
        (leagueNameLower.includes("friendlies") &&
          !leagueNameLower.includes("women")) ||
        (leagueNameLower.includes("international") &&
          !leagueNameLower.includes("women")) ||
        countryName.includes("world") ||
        countryName.includes("europe") ||
        countryName.includes("international");

      // Allow all international competitions through
      if (isInternationalCompetition) {
        return true;
      }

      // Check if it's a popular country
      const matchingCountry = POPULAR_COUNTRIES.find((country) =>
        countryName.includes(country.toLowerCase()),
      );

      if (!matchingCountry) {
        return false;
      }

      return true;
    });

    const endTime = Date.now();

    console.log(
      `🔍 [CombinedLeagueCards] Filtered ${allFixtures.length} fixtures to ${finalFiltered.length} in ${endTime - startTime}ms`,
    );

    return finalFiltered;
  }, [propFilteredFixtures, allFixtures, selectedDate, verifyMatchStatusWithSportsRadar]);

  // Group fixtures by country and league
  const fixturesByCountry = filteredFixtures.reduce(
    (acc: any, fixture: any) => {
      // Add comprehensive null checks
      if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
        return acc;
      }

      // Ensure league has required properties
      const league = fixture.league;
      if (!league.id || !league.name) {
        console.warn("Invalid league data:", league);
        return acc;
      }

      const country = league.country;

      // Use centralized exclusion filter
      const leagueName = league.name?.toLowerCase() || "";
      const homeTeamName = fixture.teams?.home?.name || "";
      const awayTeamName = fixture.teams?.away?.name || "";

      // Check if fixture should be excluded using popular league specialized filter
      if (
        shouldExcludeFromPopularLeagues(
          leagueName,
          homeTeamName,
          awayTeamName,
          country,
        )
      ) {
        return acc;
      }

      // Additional check for restricted US leagues
      if (isRestrictedUSLeague(league.id, country)) {
        return acc;
      }

      // Skip fixtures without a valid country, but keep World and Europe competitions
      if (
        !country ||
        country === null ||
        country === undefined ||
        typeof country !== "string" ||
        country.trim() === "" ||
        country.toLowerCase() === "unknown"
      ) {
        // Allow World competitions, CONMEBOL, UEFA, and FIFA competitions to pass through
        if (
          league.name &&
          (league.name.toLowerCase().includes("world") ||
            league.name.toLowerCase().includes("europe") ||
            league.name.toLowerCase().includes("uefa") ||
            league.name.toLowerCase().includes("fifa") ||
            league.name.toLowerCase().includes("fifa club world cup") ||
            league.name.toLowerCase().includes("champions") ||
            league.name.toLowerCase().includes("conference") ||
            (league.name.toLowerCase().includes("friendlies") &&
              !league.name.toLowerCase().includes("women")) ||
            (league.name.toLowerCase().includes("international") &&
              !league.name.toLowerCase().includes("women")) ||
            league.name.toLowerCase().includes("conmebol") ||
            league.name.toLowerCase().includes("copa america") ||
            league.name.toLowerCase().includes("copa libertadores") ||
            league.name.toLowerCase().includes("copa sudamericana"))
        ) {
          // Determine the appropriate country key
          let countryKey = "World";
          if (
            league.name.toLowerCase().includes("fifa club world cup") ||
            league.name.toLowerCase().includes("club world cup")
          ) {
            countryKey = "International";
          } else if (
            league.name.toLowerCase().includes("conmebol") ||
            league.name.toLowerCase().includes("copa america") ||
            league.name.toLowerCase().includes("copa libertadores") ||
            league.name.toLowerCase().includes("copa sudamericana")
          ) {
            countryKey = "South America";
          } else if (
            league.name.toLowerCase().includes("uefa") ||
            league.name.toLowerCase().includes("europe") ||
            league.name.toLowerCase().includes("champions") ||
            league.name.toLowerCase().includes("conference") ||
            league.name.toLowerCase().includes("nations league")
          ) {
            countryKey = "Europe";
          }

          if (!acc[countryKey]) {
            acc[countryKey] = {
              country: countryKey,
              flag: getCountryFlagWithFallbackSync(countryKey),
              leagues: {},
              hasPopularLeague: true,
            };
          }
          const leagueId = league.id;

          if (!acc[countryKey].leagues[leagueId]) {
            const unrestrictedCountries = [
              "Brazil",
              "Colombia",
              "Saudi Arabia",
              "USA",
              "United States",
              "United-States",
              "US",
              "United Arab Emirates",
              "United-Arab-Emirates",
              "Europe",
              "South America",
              "World",
            ];
            const isUnrestrictedCountry =
              unrestrictedCountries.includes(countryKey);

            acc[countryKey].leagues[leagueId] = {
              league: { ...league, country: countryKey },
              matches: [],
              isPopular:
                POPULAR_LEAGUES.includes(leagueId) || isUnrestrictedCountry,
              isFriendlies: league.name.toLowerCase().includes("friendlies"),
            };
          }
          acc[countryKey].leagues[leagueId].matches.push(fixture);
          return acc;
        }

        return acc;
      }

      const validCountry = country.trim();

      // Only allow valid country names, World, and Europe
      if (
        validCountry !== "World" &&
        validCountry !== "Europe" &&
        validCountry.length === 0
      ) {
        return acc;
      }

      const leagueId = league.id;
      if (!acc[country]) {
        acc[country] = {
          country,
          flag: getCountryFlagWithFallbackSync(country, league.flag),
          leagues: {},
          hasPopularLeague: false,
        };
      }

      // Check if this is a popular league for this country
      const countryPopularLeagues = POPULAR_LEAGUES_BY_COUNTRY[country] || [];
      const isPopularForCountry = countryPopularLeagues.includes(leagueId);
      const isGloballyPopular = POPULAR_LEAGUES.includes(leagueId);

      // For unrestricted countries, consider all leagues as "popular"
      const unrestrictedCountries = [
        "Brazil",
        "Colombia",
        "Saudi Arabia",
        "USA",
        "United States",
        "United-States",
        "US",
        "United Arab Emirates",
        "United-Arab-Emirates",
        "Europe",
        "South America",
        "World",
      ];
      const isUnrestrictedCountry = unrestrictedCountries.includes(country);

      if (isPopularForCountry || isGloballyPopular || isUnrestrictedCountry) {
        acc[country].hasPopularLeague = true;
      }

      if (!acc[country].leagues[leagueId]) {
        acc[country].leagues[leagueId] = {
          league: {
            ...league,
            logo:
              league.logo ||
              "https://media.api-sports.io/football/leagues/1.png",
          },
          matches: [],
          isPopular:
            isPopularForCountry || isGloballyPopular || isUnrestrictedCountry,
          isPopularForCountry: isPopularForCountry || isUnrestrictedCountry,
          isFriendlies: league.name.toLowerCase().includes("friendlies"),
        };
      }

      // Validate team data before adding
      if (
        fixture.teams.home &&
        fixture.teams.away &&
        fixture.teams.home.name &&
        fixture.teams.away.name
      ) {
        acc[country].leagues[leagueId].matches.push({
          ...fixture,
          teams: {
            home: {
              ...fixture.teams.home,
              logo: fixture.teams.home.logo || "/assets/fallback-logo.svg",
            },
            away: {
              ...fixture.teams.away,
              logo: fixture.teams.away.logo || "/assets/fallback-logo.svg",
            },
          },
        });
      }

      return acc;
    },
    {},
  );

  // Filter to show only popular countries with badge system
  const filteredCountries = Object.values(fixturesByCountry).filter(
    (countryData: any) => {
      return countryData.hasPopularLeague;
    },
  );

  // Sort countries by the POPULAR_COUNTRIES_ORDER
  const sortedCountries = useMemo(() => {
    return filteredCountries.sort((a: any, b: any) => {
      const getPopularCountryIndex = (country: string) => {
        if (!country) return 999;
        const index = POPULAR_COUNTRIES_ORDER.findIndex(
          (pc) =>
            safeSubstring(country, 0).toLowerCase() ===
            safeSubstring(pc, 0).toLowerCase(),
        );
        return index === -1 ? 999 : index;
      };

      const aPopularIndex = getPopularCountryIndex(a.country);
      const bPopularIndex = getPopularCountryIndex(b.country);

      const aIsPopularCountry = aPopularIndex !== 999;
      const bIsPopularCountry = bPopularIndex !== 999;

      // Priority order: Popular countries with badge leagues first
      if (
        aIsPopularCountry &&
        a.hasPopularLeague &&
        (!bIsPopularCountry || !b.hasPopularLeague)
      )
        return -1;
      if (
        bIsPopularCountry &&
        b.hasPopularLeague &&
        (!aIsPopularCountry || !a.hasPopularLeague)
      )
        return 1;

      // Both are popular countries with badge leagues - sort by priority order
      if (
        aIsPopularCountry &&
        a.hasPopularLeague &&
        bIsPopularCountry &&
        b.hasPopularLeague
      ) {
        return aPopularIndex - bPopularIndex;
      }

      // Default to alphabetical sorting for other cases
      const countryA = a.country || "";
      const countryB = b.country || "";
      return countryA.localeCompare(countryB);
    });
  }, [filteredCountries]);

  // Apply live filters
  const liveFilteredCountries = useMemo(() => {
    if (!liveFilterActive) return sortedCountries;

    return sortedCountries
      .map((countryData) => {
        const updatedLeagues = Object.entries(countryData.leagues).reduce(
          (acc: any, [leagueId, leagueData]: any) => {
            const updatedMatches = leagueData.matches.filter((match: any) => {
              return (
                match.fixture.status.short === "LIV" ||
                match.fixture.status.short === "HT"
              );
            });

            if (updatedMatches.length > 0) {
              acc[leagueId] = {
                ...leagueData,
                matches: updatedMatches,
              };
            }
            return acc;
          },
          {},
        );

        return {
          ...countryData,
          leagues: updatedLeagues,
        };
      })
      .filter((countryData) => Object.keys(countryData.leagues).length > 0);
  }, [sortedCountries, liveFilterActive]);

  // Apply top 20 filters
  const top20FilteredCountries = useMemo(() => {
    if (!showTop20) return liveFilteredCountries;
    return liveFilteredCountries.slice(0, 20);
  }, [liveFilteredCountries, showTop20]);

  const toggleStarMatch = (matchId: number) => {
    setStarredMatches((prev) => {
      const newStarred = new Set(prev);
      if (newStarred.has(matchId)) {
        newStarred.delete(matchId);
      } else {
        newStarred.add(matchId);
      }
      return newStarred;
    });
  };

  const handleMatchClick = (match: any) => {
    // Call the parent onMatchCardClick to handle right column display
    if (onMatchCardClick) {
      onMatchCardClick(match);
    }
  };

  // Start with all countries collapsed by default
  useEffect(() => {
    setExpandedCountries(new Set());
  }, [selectedDate]);

  // Clear Venezuela flag cache on component mount
  useEffect(() => {
    console.log('🔄 Clearing Venezuela flag cache for fresh fetch...');
    clearVenezuelaFlagCache();
    forceRefreshVenezuelaFlag().then(newFlag => {
      console.log(`✅ Venezuela flag refreshed to: ${newFlag}`);
    }).catch(error => {
      console.error(`❌ Failed to refresh Venezuela flag:`, error);
    });
    clearAllFlagCache();
    console.log('🧹 Cleared all flag cache including fallback flags');
  }, []);

  // Show loading only if we're actually loading and don't have any cached data
  const showLoading = (isLoadingAllFixtures && !allFixtures?.length);

  if (showLoading) {
    console.log(`⏳ [CombinedLeagueCards] Showing loading for ${selectedDate} - isLoading: ${isLoadingAllFixtures}, allFixturesLength: ${allFixtures?.length || 0}`);

    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-3 w-40" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-b border-gray-100 last:border-b-0"
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-4 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!filteredFixtures.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this date</p>
        </CardContent>
      </Card>
    );
  }

  // Get header title
  const getHeaderTitle = () => {
    return "Popular Football Leagues";
  };

  // Collect all matches from all leagues and countries into a single array
  const allMatches = useMemo(() => {
    const matches: any[] = [];

    top20FilteredCountries.forEach((countryData: any) => {
      Object.values(countryData.leagues).forEach((leagueData: any) => {
        leagueData.matches.forEach((match: any) => {
          matches.push({
            ...match,
            leagueInfo: leagueData.league,
            countryInfo: countryData.country,
            isPopular: leagueData.isPopular,
            isPopularForCountry: leagueData.isPopularForCountry,
          });
        });
      });
    });

    // Sort all matches by priority: Live > Upcoming > Finished
    return matches.sort((a: any, b: any) => {
      const now = new Date();
      const aDate = parseISO(a.fixture.date);
      const bDate = parseISO(b.fixture.date);
      const aStatus = a.fixture.status.short;
      const bStatus = b.fixture.status.short;

      // Ensure valid dates
      if (!isValid(aDate) || !isValid(bDate)) {
        return 0;
      }

      const aTime = aDate.getTime();
      const bTime = bDate.getTime();
      const nowTime = now.getTime();

      // Define status categories
      const aLive = [
        "LIVE",
        "1H",
        "HT",
        "2H",
        "ET",
        "BT",
        "P",
        "INT",
      ].includes(aStatus);
      const bLive = [
        "LIVE",
        "1H",
        "HT",
        "2H",
        "ET",
        "BT",
        "P",
        "INT",
      ].includes(bStatus);

      const aUpcoming = aStatus === "NS" || aStatus === "TBD";
      const bUpcoming = bStatus === "NS" || bStatus === "TBD";

      const aFinished = [
        "FT",
        "AET",
        "PEN",
        "AWD",
        "WO",
        "ABD",
        "CANC",
        "SUSP",
      ].includes(aStatus);
      const bFinished = [
        "FT",
        "AET",
        "PEN",
        "AWD",
        "WO",
        "ABD",
        "CANC",
        "SUSP",
      ].includes(bStatus);

      // PRIORITY 1: LIVE matches always come first
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;

      // If both are LIVE, sort by elapsed time (shortest first)
      if (aLive && bLive) {
        const aElapsed = Number(a.fixture.status.elapsed) || 0;
        const bElapsed = Number(b.fixture.status.elapsed) || 0;
        return aElapsed - bElapsed;
      }

      // PRIORITY 2: Upcoming matches, sorted by time proximity to current time
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;

      if (aUpcoming && bUpcoming) {
        // Sort by time distance from now (nearest first)
        const aDistance = Math.abs(aTime - nowTime);
        const bDistance = Math.abs(bTime - nowTime);
        return aDistance - bDistance;
      }

      // PRIORITY 3: Recently finished matches, sorted by recency (most recent first)
      if (aFinished && !bFinished) return 1;
      if (!aFinished && bFinished) return -1;

      if (aFinished && bFinished) {
        // For finished matches, prioritize the most recently finished
        const aDistance = Math.abs(nowTime - aTime);
        const bDistance = Math.abs(nowTime - bTime);
        return aDistance - bDistance;
      }

      // DEFAULT: Sort by time proximity to current time
      const aDistance = Math.abs(aTime - nowTime);
      const bDistance = Math.abs(bTime - nowTime);
      return aDistance - bDistance;
    });
  }, [top20FilteredCountries]);

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        {getHeaderTitle()}
      </CardHeader>

      {/* Single Combined Card with All Matches */}
      <Card className="border bg-card text-card-foreground shadow-md overflow-hidden mb-4">
        <CardContent className="p-0">
          <div className="space-y-0">
            {allMatches
              .slice(0, timeFilterActive && showTop20 ? 20 : undefined)
              .map((match: any) => {
                const isVisible = !lazyLoadingProps || lazyLoadingProps.visibleMatches.has(match.fixture.id);

                return (
                  <div 
                    key={match.fixture.id}
                    ref={lazyLoadingProps?.createLazyRef(match.fixture.id)}
                    style={{ minHeight: '60px' }}
                  >
                    {isVisible ? (
                  <div
                            key={match.fixture.id}
                            className="match-card-container group"
                            onClick={() => handleMatchClick(match)}
                            style={{ 
                              cursor: onMatchCardClick ? 'pointer' : 'default',
                              userSelect: 'none'
                            }}
                          >
                    {/* Star Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStarMatch(match.fixture.id);
                      }}
                      className="match-star-button"
                      title="Add to favorites"
                      onMouseEnter={(e) => {
                        e.currentTarget
                          .closest(".group")
                          ?.classList.add("disable-hover");
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget
                          .closest(".group")
                          ?.classList.remove("disable-hover");
                      }}
                    >
                      <Star
                        className={`match-star-icon ${
                          starredMatches.has(match.fixture.id)
                            ? "starred"
                            : ""
                        }`}
                      />
                    </button>

                    {/* Three-grid layout container */}
                    <div className="match-three-grid-container">
                      {/* Top Grid: Match Status */}
                      <div className="match-status-top">
                        {(() => {
                          const status = match.fixture.status.short;
                          const elapsed = match.fixture.status.elapsed;

                          // Live matches status
                          if (
                            [
                              "LIVE",
                              "1H",
                              "HT",
                              "2H",
                              "ET",
                              "BT",
                              "P",
                              "INT",
                            ].includes(status)
                          ) {
                            return (
                              <div className="match-status-label status-live">
                                {status === "HT"
                                  ? "Halftime"
                                  : `${elapsed || 0}'`}
                              </div>
                            );
                          }

                          // Finished matches
                          if (
                            [
                              "FT",
                              "AET",
                              "PEN",
                              "AWD",
                              "WO",
                              "ABD",
                              "CANC",
                              "SUSP",
                            ].includes(status)
                          ) {
                            return (
                              <div className="match-status-label status-ended">
                                {status === "FT"
                                  ? "Ended"
                                  : status === "AET"
                                    ? "AET"
                                    : status === "PEN"
                                      ? "PEN"
                                      : status === "AWD"
                                        ? "Awarded"
                                        : status === "WO"
                                          ? "Walkover"
                                          : status === "ABD"
                                            ? "Abandoned"
                                            : status === "CANC"
                                              ? "Cancelled"
                                              : status === "SUSP"
                                                ? "Suspended"
                                                : status}
                              </div>
                            );
                          }

                          // Postponed matches
                          if (
                            [
                              "PST",
                              "CANC",
                              "ABD",
                              "SUSP",
                              "AWD",
                              "WO",
                            ].includes(status)
                          ) {
                            return (
                              <div className="match-status-label status-postponed">
                                {status === "PST"
                                  ? "Postponed"
                                  : status === "CANC"
                                    ? "Cancelled"
                                    : status === "ABD"
                                      ? "Abandoned"
                                      : status === "SUSP"
                                        ? "Suspended"
                                        : status === "AWD"
                                          ? "Awarded"
                                          : status === "WO"
                                            ? "Walkover"
                                            : status}
                              </div>
                            );
                          }

                          // Upcoming matches - no status needed in top grid
                          return null;
                        })()}
                      </div>

                      {/* Middle Grid: Main Content */}
                      <div className="match-content-container">
                      {/* Home Team Name */}
                      <div
                        className={`home-team-name ${
                          match.goals.home !== null &&
                          match.goals.away !==null &&
                          match.goals.home > match.goals.away
                            ? "winner"
                            : ""
                        }`}
                      >
                        {shortenTeamName(match.teams.home.name) ||
                          "Unknown Team"}
                      </div>

                      {/* Home team logo */}
                      <div className="home-team-logo-container">
                        {isNationalTeam(
                          match.teams.home,
                          match.leagueInfo,
                        ) ? (
                          <MyCircularFlag
                            teamName={match.teams.home.name}
                            fallbackUrl={
                              match.teams.home.id
                                ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                                : "/assets/fallback-logo.svg"
                            }
                            alt={match.teams.home.name}
                            size="32px"
                            className="team-logo"
                          />
                        ) : (
                          <LazyImage
                            src={
                              match.teams.home.id
                                ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                                : "/assets/fallback-logo.svg"
                            }
                            alt={match.teams.home.name}
                            title={match.teams.home.name}
                            className="team-logo"
                            style={{ 
                              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))"
                            }}
                            fallbackSrc="/assets/fallback-logo.svg"
                          />
                        )}
                      </div>

                      {/* Score/Time Center */}
                        <div className="match-score-container">
                          {(() => {
                            const status = match.fixture.status.short;
                            const fixtureDate = parseISO(
                              match.fixture.date,
                            );

                            // Live matches
                            if (
                              [
                                "LIVE",
                                "1H",
                                "HT",
                                "2H",
                                "ET",
                                "BT",
                                "P",
                                "INT",
                              ].includes(status)
                            ) {
                              return (
                                <div className="match-score-display">
                                  <span className="score-number">
                                    {match.goals.home ?? 0}
                                  </span>
                                  <span className="score-separator">
                                    -
                                  </span>
                                  <span className="score-number">
                                    {match.goals.away ?? 0}
                                  </span>
                                </div>
                              );
                            }

                            // All finished match statuses
                            if (
                              [
                                "FT",
                                "AET",
                                "PEN",
                                "AWD",
                                "WO",
                                "ABD",
                                "CANC",
                                "SUSP",
                              ].includes(status)
                            ) {
                              const homeScore = match.goals.home;
                              const awayScore = match.goals.away;
                              const hasValidScores =
                                homeScore !== null &&
                                homeScore !== undefined &&
                                awayScore !== null &&
                                awayScore !== undefined &&
                                !isNaN(Number(homeScore)) &&
                                !isNaN(Number(awayScore));

                              if (hasValidScores) {
                                return (
                                  <div className="match-score-display">
                                    <span className="score-number">
                                      {homeScore}
                                    </span>
                                    <span className="score-separator">
                                      -
                                    </span>
                                    <span className="score-number">
                                      {awayScore}
                                    </span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="match-time-display">
                                    {format(fixtureDate, "HH:mm")}
                                  </div>
                                );
                              }
                            }

                            // Upcoming matches
                            return (
                              <div className="match-time-display">
                                {status === "TBD"
                                  ? "TBD"
                                  : format(fixtureDate, "HH:mm")}
                              </div>
                            );
                          })()}
                        </div>

                      {/* Away team logo */}
                      <div className="away-team-logo-container">
                        {isNationalTeam(
                          match.teams.away,
                          match.leagueInfo,
                        ) ? (
                          <MyCircularFlag
                            teamName={match.teams.away.name}
                            fallbackUrl={
                              match.teams.away.id
                                ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                                : "/assets/fallback-logo.svg"
                            }
                            alt={match.teams.away.name}
                            size="32px"
                            className="team-logo"
                          />
                        ) : (
                          <LazyImage
                            src={
                              match.teams.away.id
                                ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                                : "/assets/fallback-logo.svg"
                            }
                            alt={match.teams.away.name}
                            title={match.teams.away.name}
                            className="team-logo"
                            style={{ 
                              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))"
                            }}
                            fallbackSrc="/assets/fallback-logo.svg"
                          />
                        )}
                        </div>

                        {/* Away Team Name */}
                        <div
                          className={`away-team-name ${
                            match.goals.home !== null &&
                            match.goals.away !== null &&
                            match.goals.away > match.goals.home
                              ? "winner"
                              : ""
                          }`}
                        >
                          {shortenTeamName(match.teams.away.name) ||
                            "Unknown Team"}
                        </div>
                      </div>

                      {/* Bottom Grid: Penalty Result Status */}
                      <div className="match-penalty-bottom">
                        {(() => {
                          const status = match.fixture.status.short;
                          const isPenaltyMatch = status === "PEN";
                          const penaltyHome =
                            match.score?.penalty?.home;
                          const penaltyAway =
                            match.score?.penalty?.away;
                          const hasPenaltyScores =
                            penaltyHome !== null &&
                            penaltyHome !== undefined &&
                            penaltyAway !== null &&
                            penaltyAway !== undefined;

                          if (isPenaltyMatch && hasPenaltyScores) {
                            const winnerText =
                              penaltyHome > penaltyAway
                                ? `${shortenTeamName(match.teams.home.name)} won ${penaltyHome}-${penaltyAway} on penalties`
                                : `${shortenTeamName(match.teams.away.name)} won ${penaltyAway}-${penaltyHome} on penalties`;

                            return (
                              <div className="penalty-result-display">
                                <div className="penalty-winner">
                                  {winnerText}
                                </div>
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </div>
                    </div>

                    {/* League and Country Info - Small indicator on the right */}
                    {!timeFilterActive && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-70">
                        <img
                          src={
                            match.leagueInfo.logo ||
                            "/assets/fallback-logo.svg"
                          }
                          alt={match.leagueInfo.name || "Unknown League"}
                          className="w-4 h-4 object-contain"
                          title={`${match.leagueInfo.name} (${match.countryInfo})`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/assets/fallback-logo.svg";
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                      lazyLoadingProps?.LazyMatchSkeleton ? (
                        <lazyLoadingProps.LazyMatchSkeleton />
                      ) : null
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      
    </>
  );
};

export default CombinedLeagueCards;