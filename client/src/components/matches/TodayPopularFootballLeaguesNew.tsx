import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { RootState, userActions } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
// Removed complex date utilities - using simple date filtering now
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import {
  shouldExcludeFromPopularLeagues,
  isPopularLeagueSuitable,
  isRestrictedUSLeague,
  EXCLUDED_COUNTRIES,
} from "@/lib/MyPopularLeagueExclusion";
import { QUERY_CONFIGS, CACHE_FRESHNESS } from "@/lib/cacheConfig";
// Removed cached query system for live match updates
import { getCurrentUTCDateString } from "@/lib/dateUtilsUpdated";
import { POPULAR_LEAGUES } from "@/lib/constants";
import {
  DEFAULT_POPULAR_TEAMS,
  DEFAULT_POPULAR_LEAGUES,
  POPULAR_COUNTRIES,
  isLiveMatch,
  isEndedMatch,
  isUpcomingMatch,
} from "@/lib/matchFilters";
import { CURRENT_POPULAR_LEAGUES } from "../leagues/PopularLeaguesList";
import {
  getCountryFlagWithFallbackSync,
  clearVenezuelaFlagCache,
  forceRefreshVenezuelaFlag,
  clearAllFlagCache,
  getCountryCode,
} from "../../lib/flagUtils";
import { createFallbackHandler } from "../../lib/MyAPIFallback";
import { MyFallbackAPI } from "../../lib/MyFallbackAPI";
import { getCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam } from "../../lib/teamLogoSources";
import { SimpleDateFilter } from "../../lib/simpleDateFilter";
import "../../styles/MyLogoPositioning.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import MyNormalFlag from "../common/MyNormalFlag";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import { smartFetch, fetchLeagueFixtures } from '@/lib/MyFetchingLogic';
import { isDateStringToday } from "@/lib/dateUtilsUpdated";

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

interface TodayPopularFootballLeaguesNewProps {
  selectedDate: string;
  timeFilterActive?: boolean;
  showTop20?: boolean;
  liveFilterActive?: boolean;
  onMatchCardClick?: (fixture: any) => void;
}

const TodayPopularFootballLeaguesNew: React.FC<
  TodayPopularFootballLeaguesNewProps
> = ({
  selectedDate,
  timeFilterActive = false,
  showTop20 = false,
  liveFilterActive = false,
  onMatchCardClick,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());
  const [previousMatchStatuses, setPreviousMatchStatuses] = useState<Map<number, string>>(new Map());
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(new Set());
  const [previousMatchScores, setPreviousMatchScores] = useState<Map<number, {home: number, away: number}>>(new Map());

  const dispatch = useDispatch();
  const { toast } = useToast();
  const favoriteTeams = useSelector(
    (state: RootState) => state.user.favoriteTeams,
  );

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
    "Iraq",
    "Chile",
    "Colombia",
    "United States",
    "USA",
    "US",
    "United Arab Emirates",
    "United-Arab-Emirates",
  ];

  // Extract league IDs from the popular leagues list component
  const POPULAR_LEAGUE_IDS = [...CURRENT_POPULAR_LEAGUES.map(league => league.id), 667]; // Add Friendlies Clubs

  // Enhanced leagues by country with tier-based filtering
  const POPULAR_LEAGUES_BY_COUNTRY = {
    England: [39, 45, 48], // Premier League, FA Cup, EFL Cup
    Spain: [140, 143], // La Liga, Copa del Rey
    Italy: [135, 137], // Serie A, Coppa Italia
    Germany: [78, 81], // Bundesliga, DFB Pokal
    France: [61, 66], // Ligue 1, Coupe de France
    "United Arab Emirates": [301], // UAE Pro League
    Egypt: [233], // Egyptian Premier League (only major league)
    Iraq: [332], // Iraq League
    Chile: [265], // Primera Division
    Brazil: [71, 72, 73], // Serie A, Serie B, Copa do Brasil
    Colombia: [239, 240], // Primera A, Copa Colombia
    "Saudi Arabia": [307], // Pro League
    USA: [253, 254], // MLS, MLS Cup
    "United States": [253, 254], // MLS, MLS Cup
    US: [253, 254], // MLS, MLS Cup
    // International competitions
    World: [1, 2, 3, 4, 5, 15, 16, 17, 914, 38], // Champions League, Europa, Conference, World Cup, FIFA Club World Cup, CONCACAF Gold Cup, COSAFA Cup, World Cup Qualification
    Europe: [1, 2, 3, 4, 5, 848], // UEFA competitions
    International: [15, 16, 17], // FIFA competitions
  };

  // Use popular leagues from PopularLeaguesList component as primary source
  const POPULAR_LEAGUES = POPULAR_LEAGUE_IDS;

  // Debug: Log the popular leagues list
  console.log(
    "🎯 [POPULAR LEAGUES DEBUG] Full popular leagues list:",
    POPULAR_LEAGUES,
  );
  console.log("🎯 [POPULAR LEAGUES DEBUG] Target leagues check:", {
    league38InList: POPULAR_LEAGUES.includes(38),
    league15InList: POPULAR_LEAGUES.includes(15),
    league16InList: POPULAR_LEAGUES.includes(16),
    league914InList: POPULAR_LEAGUES.includes(914),
  });

  // Popular teams for match prioritization
  const POPULAR_TEAMS = [
    // Premier League
    33,
    40,
    42,
    50,
    47,
    49, // Manchester United, Liverpool, Arsenal, Manchester City, Tottenham, Chelsea
    // La Liga
    529,
    541,
    530,
    548,
    727, // Barcelona, Real Madrid, Atletico Madrid, Real Sociedad, Athletic Bilbao
    // Serie A
    489,
    492,
    496,
    500,
    502,
    505, // AC Milan, Napoli, Juventus, Inter, Fiorentina, Lazio
    // Bundesliga
    157,
    165,
    168,
    173,
    192, // Bayern Munich, Borussia Dortmund, Bayer Leverkusen, RB Leipzig, Eintracht Frankfurt
    // Champions League popular teams
    85,
    81,
    212,
    548, // Paris Saint Germain, AS Monaco, Real Sociedad, Real Sociedad
  ];

  // Use the prioritized popular countries list
  const POPULAR_COUNTRIES = POPULAR_COUNTRIES_ORDER;

  // Clear Venezuela flag cache on component mount to ensure fresh fetch
  useEffect(() => {
    console.log("🔄 Clearing Venezuela flag cache for fresh fetch...");
    clearVenezuelaFlagCache();

    // Also force refresh Venezuela flag asynchronously
    forceRefreshVenezuelaFlag()
      .then((newFlag) => {
        console.log(`✅ Venezuela flag refreshed to: ${newFlag}`);
      })
      .catch((error) => {
        console.error(`❌ Failed to refresh Venezuela flag:`, error);
      });

    // Clear all fallback flags as well to ensure clean state
    clearAllFlagCache();
    console.log("🧹 Cleared all flag cache including fallback flags");
  }, []);

  // Clean up old cache entries on component mount
  useEffect(() => {
    const cleanupOldCache = () => {
      try {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.startsWith('popular_ended_matches_'));
        
        let cleanedCount = 0;
        cacheKeys.forEach(key => {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const { timestamp } = JSON.parse(cached);
              const cacheAge = Date.now() - timestamp;
              
              // Remove cache older than 7 days
              if (cacheAge > 7 * 24 * 60 * 60 * 1000) {
                localStorage.removeItem(key);
                cleanedCount++;
              }
            }
          } catch (error) {
            // Remove corrupted cache entries
            localStorage.removeItem(key);
            cleanedCount++;
          }
        });
        
        if (cleanedCount > 0) {
          console.log(`🧹 [TodayPopularLeagueNew] Cleaned up ${cleanedCount} old cache entries`);
        }
      } catch (error) {
        console.error('Error cleaning up cache:', error);
      }
    };

    cleanupOldCache();
  }, []);

  // Check if a match ended more than 24 hours ago
  const isMatchOldEnded = useCallback((fixture: any): boolean => {
    const status = fixture.fixture.status.short;
    const isEnded = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status);
    
    if (!isEnded) return false;
    
    const matchDate = new Date(fixture.fixture.date);
    const hoursAgo = (Date.now() - matchDate.getTime()) / (1000 * 60 * 60);
    
    return hoursAgo > 24;
  }, []);

  // Cache key for ended matches
  const getCacheKey = useCallback((date: string) => {
    return `popular_ended_matches_${date}`;
  }, []);

  // Get cached ended matches
  const getCachedEndedMatches = useCallback((date: string): any[] => {
    try {
      const cacheKey = getCacheKey(date);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return [];
      
      const { fixtures, timestamp } = JSON.parse(cached);
      const cacheAge = Date.now() - timestamp;
      
      // Cache valid for 7 days for old ended matches
      if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
        console.log(`✅ [TodayPopularLeagueNew] Using cached ended matches for ${date}: ${fixtures.length} matches`);
        return fixtures;
      } else {
        // Remove expired cache
        localStorage.removeItem(cacheKey);
        console.log(`⏰ [TodayPopularLeagueNew] Removed expired cache for ${date}`);
      }
    } catch (error) {
      console.error('Error reading cached ended matches:', error);
    }
    
    return [];
  }, [getCacheKey]);

  // Cache ended matches
  const cacheEndedMatches = useCallback((date: string, fixtures: any[]) => {
    try {
      const endedFixtures = fixtures.filter(isMatchOldEnded);
      
      if (endedFixtures.length === 0) return;
      
      const cacheKey = getCacheKey(date);
      const cacheData = {
        fixtures: endedFixtures,
        timestamp: Date.now(),
        date
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 [TodayPopularLeagueNew] Cached ${endedFixtures.length} ended matches for ${date}`);
    } catch (error) {
      console.error('Error caching ended matches:', error);
    }
  }, [getCacheKey, isMatchOldEnded]);

  // Clear any existing cache before fetching to ensure fresh data
  useEffect(() => {
    // Clear localStorage cache for the current date to prevent stale data
    try {
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('popular_ended_matches_') && key.includes(selectedDate)
      );
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ [TodayPopularLeagueNew] Cleared cache key: ${key}`);
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [selectedDate]);

  // Fetch data with simplified caching (only for old ended matches)
  const { data: allFixtures = [], isLoading: isQueryLoading, isFetching: isQueryFetching, error } = useQuery({
    queryKey: ['popular-leagues-fixtures', selectedDate, Date.now()], // Add timestamp to force fresh data
    queryFn: async () => {
      console.log(`🔄 [TodayPopularLeagueNew] Fetching fresh fixtures for ${selectedDate}`);

      try {
        // Always fetch fresh data from API
        const response = await apiRequest("GET", `/api/fixtures/date/${selectedDate}?all=true&timestamp=${Date.now()}`);
        const fixtures = await response.json();

        if (!fixtures?.length) {
          console.log(`✅ [TodayPopularLeagueNew] No fixtures found for ${selectedDate}`);
          return [];
        }

        console.log(`✅ [TodayPopularLeagueNew] Fetched ${fixtures.length} fresh fixtures for ${selectedDate}`);
        
        // Only cache old ended matches (older than 24 hours) for past dates
        const selectedDateObj = new Date(selectedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDateObj.setHours(0, 0, 0, 0);
        
        if (selectedDateObj < today) {
          const oldEndedMatches = fixtures.filter((fixture: any) => isMatchOldEnded(fixture));
          if (oldEndedMatches.length > 0) {
            cacheEndedMatches(selectedDate, oldEndedMatches);
            console.log(`💾 [TodayPopularLeagueNew] Cached ${oldEndedMatches.length} old ended matches for ${selectedDate}`);
          }
        }

        return fixtures;
      } catch (error) {
        console.error(`❌ [TodayPopularLeagueNew] Error fetching fixtures for ${selectedDate}:`, error);
        return [];
      }
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 30 * 1000, // Keep in cache for 30 seconds only
    refetchOnWindowFocus: true,
    refetchInterval: (data) => {
      // Only auto-refresh if there are live matches
      const hasLiveMatches = data?.some((fixture: any) => 
        ['LIVE', 'LIV', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(fixture.fixture?.status?.short)
      );
      return hasLiveMatches ? 30 * 1000 : false; // 30 seconds for live matches, no auto-refresh otherwise
    },
    retry: 1,
    meta: {
      errorMessage: `Failed to fetch fixtures for ${selectedDate}`
    }
  });

  // Simple filtering without complex date conversions
  const filteredFixtures = useMemo(() => {
    if (!allFixtures?.length) return [];

    console.log(
      `🔍 [SIMPLE FILTER] Processing ${allFixtures.length} fixtures for date: ${selectedDate}`,
    );

    const startTime = Date.now();

    // Simple date matching - check if fixture date matches selected date
    const filtered = allFixtures.filter((fixture) => {
      if (!fixture?.fixture?.date || !fixture?.league || !fixture?.teams) {
        return false;
      }

      // Simple date comparison - extract date part from fixture date
      const fixtureDate = fixture.fixture.date.split('T')[0]; // Gets YYYY-MM-DD part
      const dateMatches = fixtureDate === selectedDate;

      if (!dateMatches) {
        return false;
      }

      // Client-side filtering for popular leagues and countries
      const leagueId = fixture.league?.id;
      const country = fixture.league?.country?.toLowerCase() || "";

      // Check if it's a popular league from our curated list
      const isPopularLeague = POPULAR_LEAGUE_IDS.includes(leagueId);

      // Check if country is excluded
      const isExcludedCountry = EXCLUDED_COUNTRIES.some(excludedCountry => 
        country.includes(excludedCountry.toLowerCase())
      );

      if (isExcludedCountry) {
        console.log(`❌ [COUNTRY EXCLUSION] Excluding fixture from excluded country: "${fixture.league.country}"`);
        return false;
      }

      // Check if it's from a popular country
      const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
        (popularCountry) => country.includes(popularCountry.toLowerCase()),
      );

      // Apply exclusion check FIRST, but skip for key international competitions
      const leagueName = fixture.league?.name?.toLowerCase() || "";

      // Check if this is a key international competition that should never be excluded
      const isKeyInternationalCompetition = [1, 2, 3, 4, 5, 15, 16, 17, 914, 38, 848].includes(leagueId);

      // Early exclusion for women's competitions and other unwanted matches (but skip key international competitions)
      const shouldExclude = !isKeyInternationalCompetition && shouldExcludeFromPopularLeagues(
        fixture.league.name,
        fixture.teams.home.name,
        fixture.teams.away.name,
        country,
      );

      if (shouldExclude) {
        return false;
      }

      // Check if it's an international competition (after exclusion check)
      const isInternationalCompetition =
        // Direct league ID check for international competitions
        [1, 2, 3, 4, 5, 15, 16, 17, 914, 38, 848].includes(leagueId) ||
        // UEFA competitions (but women's already excluded above)
        leagueName.includes("champions league") ||
        leagueName.includes("europa league") ||
        leagueName.includes("conference league") ||
        leagueName.includes("uefa") ||
        leagueName.includes("euro u21") ||
        leagueName.includes("uefa u21") ||
        // FIFA competitions
        leagueName.includes("world cup") ||
        leagueName.includes("fifa club world cup") ||
        leagueName.includes("fifa") ||
        // CONMEBOL competitions
        leagueName.includes("conmebol") ||
        leagueName.includes("copa america") ||
        leagueName.includes("copa libertadores") ||
        leagueName.includes("copa sudamericana") ||
        leagueName.includes("libertadores") ||
        leagueName.includes("sudamericana") ||
        // CONCACAF competitions
        leagueName.includes("concacaf") ||
        leagueName.includes("gold cup") ||
        leagueName.includes("concacaf gold cup") ||
        // Men's International Friendlies (excludes women's)
        (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
        (leagueName.includes("international") &&
          !leagueName.includes("women")) ||
        country.includes("world") ||
        country.includes("europe") ||
        country.includes("international");

      return isPopularLeague || isFromPopularCountry || isInternationalCompetition;
    });

    const endTime = Date.now();

    console.log(
      `🔍 [SIMPLE FILTER] Filtered ${allFixtures.length} fixtures to ${filtered.length} in ${endTime - startTime}ms for ${selectedDate}`,
    );

    return filtered;
  }, [allFixtures, selectedDate]);

  // Group fixtures by country and league
  const groupedFixtures = useMemo(() => {
    if (!filteredFixtures?.length) return {};

    const fixturesByCountry: { [key: string]: any } = {};

    filteredFixtures.forEach((fixture) => {
      const country = fixture.league?.country || "Unknown";
      const leagueId = fixture.league?.id;
      const leagueName = fixture.league?.name || "Unknown League";

      if (!fixturesByCountry[country]) {
        fixturesByCountry[country] = {
          country,
          flag: getCountryFlagWithFallbackSync(country),
          leagues: {},
        };
      }

      if (!fixturesByCountry[country].leagues[leagueId]) {
        const isPopular = POPULAR_LEAGUE_IDS.includes(leagueId);
        const isPopularForCountry = POPULAR_LEAGUES_BY_COUNTRY[country]?.includes(leagueId) || false;
        const isFriendlies = leagueName.toLowerCase().includes("friendlies");

        fixturesByCountry[country].leagues[leagueId] = {
          league: fixture.league,
          matches: [],
          isPopular,
          isPopularForCountry,
          isFriendlies,
        };
      }

      fixturesByCountry[country].leagues[leagueId].matches.push(fixture);
    });

    return fixturesByCountry;
  }, [filteredFixtures]);

  // Sort countries by priority
  const sortedCountries = useMemo(() => {
    const countries = Object.values(groupedFixtures);

    return countries.sort((a: any, b: any) => {
      const aIndex = POPULAR_COUNTRIES_ORDER.indexOf(a.country);
      const bIndex = POPULAR_COUNTRIES_ORDER.indexOf(b.country);

      // If both countries are in the popular list, sort by their order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only one is in the popular list, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // If neither is in the popular list, sort alphabetically
      return a.country.localeCompare(b.country);
    });
  }, [groupedFixtures]);

  // Apply live filter if active
  const liveFilteredCountries = useMemo(() => {
    if (!liveFilterActive) return sortedCountries;

    return sortedCountries
      .map((countryData: any) => {
        const filteredLeagues = Object.keys(countryData.leagues).reduce(
          (acc: any, leagueId: string) => {
            const leagueData = countryData.leagues[leagueId];
            const liveMatches = leagueData.matches.filter((match: any) => {
              const status = match.fixture?.status?.short;
              return ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);
            });

            if (liveMatches.length > 0) {
              acc[leagueId] = {
                ...leagueData,
                matches: liveMatches,
              };
            }
            return acc;
          },
          {},
        );

        return {
          ...countryData,
          leagues: filteredLeagues,
        };
      })
      .filter((countryData) => Object.keys(countryData.leagues).length > 0);
  }, [sortedCountries, liveFilterActive]);

  // Apply top 20 filter
  const top20FilteredCountries = useMemo(() => {
    if (!showTop20) return liveFilteredCountries;
    return liveFilteredCountries.slice(0, 20);
  }, [liveFilteredCountries, showTop20]);

  // Show loading only if we're actually loading and don't have any data
  const showLoading = isQueryLoading && !filteredFixtures.length && !error;

  if (showLoading) {
    console.log(
      `⏳ [TodayPopularLeagueNew] Showing loading for ${selectedDate} - isLoading: ${isQueryLoading}, isFetching: ${isQueryFetching}, fixturesLength: ${filteredFixtures?.length || 0}`,
    );

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
              <div key={i} className="border-b border-gray-100 last:border-b-0">
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

  // Handle error state
  if (error) {
    console.error(`❌ [TodayPopularLeagueNew] Query error for ${selectedDate}:`, error);
    return null; // Let parent component handle error state
  }

  if (!filteredFixtures.length) {
    return null; // Let parent component handle empty state
  }

  // Simple date display
  const currentDate = SimpleDateFilter.getCurrentDate();

  // Get header title
  const getHeaderTitle = () => {
    return "Popular Football Leagues";
  };

  // Format the time for display
  const formatMatchTime = (dateString: string | null | undefined) => {
    try {
      if (!dateString) return "--:--";
      const date = new Date(dateString);
      return format(date, "HH:mm");
    } catch (error) {
      console.error("Error formatting match time:", error);
      return "--:--";
    }
  };

  const addFavoriteTeam = (team: any) => {
    dispatch(userActions.addFavoriteTeam(team));
    toast({
      title: "Added to favorites",
      description: `${team.name} has been added to your favorites.`,
    });
  };

  const removeFavoriteTeam = (teamId: number) => {
    dispatch(userActions.removeFavoriteTeam(teamId));
    toast({
      title: "Removed from favorites",
      description: `Team has been removed from your favorites.`,
    });
  };

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

  return (
    <>
      {/* Create individual league cards from all countries */}

      {top20FilteredCountries.flatMap(
        (countryData: any, countryIndex: number) =>
          Object.values(countryData.leagues)
            .sort((a: any, b: any) => {
              // Debug: Log all World leagues before sorting
              if (countryData.country === "World") {
                console.log(
                  `🌍 [WORLD DEBUG] All World leagues before sorting:`,
                  Object.values(countryData.leagues).map((league: any) => ({
                    id: league.league?.id,
                    name: league.league?.name,
                    isFriendlies: league.isFriendlies,
                    matchCount: league.matches?.length,
                  })),
                );
              }

              // Check for UEFA Nations League - Women first (lowest priority)
              const aIsWomensNationsLeague =
                a.league.name?.toLowerCase().includes("uefa nations league") &&
                a.league.name?.toLowerCase().includes("women");
              const bIsWomensNationsLeague =
                b.league.name?.toLowerCase().includes("uefa nations league") &&
                b.league.name?.toLowerCase().includes("women");

              if (aIsWomensNationsLeague && !bIsWomensNationsLeague) return 1; // a goes to bottom
              if (!aIsWomensNationsLeague && bIsWomensNationsLeague) return -1; // b goes to bottom
              if (aIsWomensNationsLeague && bIsWomensNationsLeague) return 0; // both same priority

              // Prioritize leagues that are popular for this specific country
              if (a.isPopularForCountry && !b.isPopularForCountry) return -1;
              if (!a.isPopularForCountry && b.isPopularForCountry) return 1;

              // Then globally popular leagues
              if (a.isPopular && !b.isPopular) return -1;
              if (!a.isPopular && b.isPopular) return 1;

              // Custom sorting for World leagues
              if (countryData.country === "World") {
                console.log(`🌍 [WORLD SORTING DEBUG] Sorting World leagues:`, {
                  leagueA: {
                    name: a.league?.name,
                    isFriendlies: a.isFriendlies,
                    matchCount: a.matches?.length,
                  },
                  leagueB: {
                    name: b.league?.name,
                    isFriendlies: b.isFriendlies,
                    matchCount: b.matches?.length,
                  },
                });

                const getWorldLeaguePriority = (leagueData: any) => {
                  const name = (leagueData.league?.name || "").toLowerCase();
                  // Check if it's marked as friendlies or contains friendlies in name
                  const isFriendlies =
                    leagueData.isFriendlies || name.includes("friendlies");

                  console.log(
                    `🔍 [PRIORITY CHECK] League: "${leagueData.league?.name}"`,
                    {
                      nameToLower: name,
                      isFriendlies,
                      leagueDataIsFriendlies: leagueData.isFriendlies,
                      nameIncludesFriendlies: name.includes("friendlies"),
                      nameIncludesUefaNationsLeague: name.includes(
                        "uefa nations league",
                      ),
                      exactNameMatch: name === "uefa nations league",
                    },
                  );

                  // Priority 1: FIFA Club World Cup (HIGHEST PRIORITY - moved to top)
                  if (
                    name.includes("fifa club world cup") ||
                    name.includes("club world cup")
                  ) {
                    console.log(
                      `✅ [PRIORITY 1] FIFA Club World Cup found: "${leagueData.league?.name}" - TOP PRIORITY`,
                    );
                    return 1;
                  }

                  // Priority 2: UEFA Nations League
                  if (
                    name.includes("uefa nations league") &&
                    !name.includes("women")
                  ) {
                    console.log(
                      `✅ [PRIORITY 2] UEFA Nations League found: "${leagueData.league?.name}"`,
                    );
                    return 2;
                  }

                  // Priority 3: World Cup Qualification South America
                  if (
                    name.includes("world cup") &&
                    name.includes("qualification") &&
                    name.includes("south america")
                  ) {
                    console.log(
                      `✅ [PRIORITY 3] World Cup Qualification South America found: "${leagueData.league?.name}"`,
                    );
                    return 3;
                  }

                  // Priority 4: World Cup Qualification Europe
                  if (
                    name.includes("world cup") &&
                    name.includes("qualification") &&
                    name.includes("europe")
                  ) {
                    console.log(
                      `✅ [PRIORITY 4] World Cup Qualification Europe found: "${leagueData.league?.name}"`,
                    );
                    return 4;
                  }

                  // Priority 5: Friendlies (but exclude UEFA Nations League and women's matches)
                  if (
                    isFriendlies &&
                    !name.includes("uefa nations league") &&
                    !name.includes("women")
                  ) {
                    console.log(
                      `✅ [PRIORITY 5] Friendlies found: "${leagueData.league?.name}"`,
                    );
                    return 5;
                  }

                  // Priority 6: World Cup Qualification Asia
                  if (
                    name.includes("world cup") &&
                    name.includes("qualification") &&
                    name.includes("asia")
                  ) {
                    console.log(
                      `✅ [PRIORITY 6] World Cup Qualification Asia found: "${leagueData.league?.name}"`,
                    );
                    return 6;
                  }

                  // Priority 7: World Cup Qualification CONCACAF
                  if (
                    name.includes("world cup") &&
                    name.includes("qualification") &&
                    name.includes("concacaf")
                  ) {
                    console.log(
                      `✅ [PRIORITY 7] World Cup Qualification CONCACAF found: "${leagueData.league?.name}"`,
                    );
                    return 7;
                  }

                  // Priority 8: Tournoi Maurice Revello
                  if (name.includes("tournoi maurice revello")) {
                    console.log(
                      `✅ [PRIORITY 8] Tournoi Maurice Revello found: "${leagueData.league?.name}"`,
                    );
                    return 8;
                  }

                  console.log(
                    `❌ [PRIORITY 999] No priority match for: "${leagueData.league?.name}"`,
                  );
                  return 999; // Other leagues go to bottom
                };

                const aPriority = getWorldLeaguePriority(a);
                const bPriority = getWorldLeaguePriority(b);

                console.log(`🎯 [FINAL PRIORITY] Comparison result:`, {
                  leagueA: a.league?.name,
                  priorityA: aPriority,
                  leagueB: b.league?.name,
                  priorityB: bPriority,
                  sortResult: aPriority - bPriority,
                });

                if (aPriority !== bPriority) {
                  return aPriority - bPriority;
                }

                // If same priority, sort alphabetically by league name
                const aName = a.league?.name || "";
                const bName = b.league?.name || "";
                console.log(
                  `📝 [ALPHABETICAL] Same priority, sorting alphabetically:`,
                  {
                    aName,
                    bName,
                    result: aName.localeCompare(bName),
                  },
                );
                return aName.localeCompare(bName);
              }

              // For non-World countries, no additional sorting after popularity checks
              return 0;
            })
            .map((leagueData: any, leagueIndex: number) => {
              const isFirstCard = countryIndex === 0 && leagueIndex === 0;
              return (
                <Card
                  key={`${countryData.country}-${leagueData.league.id}`}
                  className="border bg-card text-card-foreground shadow-md overflow-visible league-card-spacing min-h-[120px]"
                >
                  {/* League Header - Always show unless time filter is active */}
                  {!timeFilterActive && (
                    <CardContent className="flex items-center gap-2 p-2  bg-white border-b border-gray-200">
                      {/* League Star Toggle Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarMatch(leagueData.league.id);
                        }}
                        className="transition-colors"
                        title={`${starredMatches.has(leagueData.league.id) ? "Remove from" : "Add to"} favorites`}
                      >
                        <Star
                          className={`h-5 w-5 transition-all ${
                            starredMatches.has(leagueData.league.id)
                              ? "text-blue-500 fill-blue-500"
                              : "text-blue-300"
                          }`}
                        />
                      </button>

                      <img
                        src={
                          leagueData.league.logo || "/assets/fallback-logo.svg"
                        }
                        alt={leagueData.league.name || "Unknown League"}
                        className="w-6 h-6 object-contain rounded-full"
                        style={{ backgroundColor: "transparent" }}
                        onError={(e) => {
                          console.log(
                            `🚨 League logo failed for: ${leagueData.league.name} in ${leagueData.league.country}`,
                          );
                          (e.target as HTMLImageElement).src =
                            "/assets/fallback-logo.svg";
                        }}
                        onLoad={() => {
                          // Debug Venezuela specifically
                          if (leagueData.league.country === "Venezuela") {
                            console.log(`🇻🇪 Venezuela league detected:`, {
                              country: leagueData.league.country,
                              leagueName: leagueData.league.name,
                              logo: leagueData.league.logo,
                              flag: countryData.flag,
                              expectedVenezuelaFlag:
                                "https://flagcdn.com/w40/ve.png",
                              flagFromSync:
                                getCountryFlagWithFallbackSync("Venezuela"),
                              flagCacheKey: `flag_venezuela`,
                              countryCodeMapping: "VE", // Should be VE for Venezuela
                            });

                            // Check if Venezuela flag is wrong (Colombia flag)
                            if (
                              countryData.flag &&
                              (countryData.flag.includes("/co.png") ||
                                countryData.flag.includes("/co."))
                            ) {
                              console.log(
                                `🚨 Venezuela flag cache corruption detected! Using Colombia flag: ${countryData.flag}`,
                              );
                              console.log(
                                `🔧 Attempting to clear and refresh Venezuela flag...`,
                              );

                              // Clear the corrupted cache and force refresh
                              clearVenezuelaFlagCache();

                              // Force refresh the flag asynchronously
                              forceRefreshVenezuelaFlag()
                                .then((newFlag) => {
                                  console.log(
                                    `✅ Venezuelaflag refreshed to: ${newFlag}`,
                                  );
                                  //                                  // Trigger a re-render ifneeded
                                  window.location.reload();
                                })
                                .catch((error) => {
                                  console.error(
                                    `❌ Failed to refresh Venezuela flag:`,
                                    error,
                                  );
                                });
                            }

                            // Force correct Venezuela flag if wrong
                            if (
                              !countryData.flag.includes("/ve.png" &&
                              !countryData.flag.includes("/ve."))
                            ) {
                              console.log(
                                `🔧 Forcing correct Venezuela flag...`,
                              );
                              const correctFlag =
                                "https://flagcdn.com/w40/ve.png";
                              console.log(
                                `🇻🇪 Setting Venezuela flag to: ${correctFlag}`,
                              );
                              // Force update the flag in the data
                              countryData.flag = correctFlag;
                            }

                            // Check if Venezuela flag is cached incorrectly
                            const debugCountryFlagMapping = (
                              country: string,
                            ) => {
                              console.log(
                                `🔍 Venezuela Debug - Flag mapping for: "${country}"`,
                              );
                              console.log(
                                `🔍 Venezuela Debug - Country code: VE`,
                              );
                              console.log(
                                `🔍 Venezuela Debug - Expected URL: https://flagcdn.com/w40/ve.png`,
                              );
                              console.log(
                                `🔍 Venezuela Debug - Current flag from countryData: ${countryData.flag}`,
                              );
                            };
                            debugCountryFlagMapping("Venezuela");
                          }
                        }}
                      />
                      <div className="flex flex-col flex-1">
                        <span
                          className="font-semibold text-gray-800"
                          style={{
                            fontFamily:
                              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                            fontSize: "13.3px",
                          }}
                        >
                          {safeSubstring(leagueData.league.name, 0) ||
                            "Unknown League"}
                        </span>
                        <span
                          className="text-gray-600"
                          style={{
                            fontFamily:
                              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                            fontSize: "13.3px",
                          }}
                        >
                          {leagueData.league.country || "Unknown Country"}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {leagueData.isPopular &&
                          !leagueData.isPopularForCountry && (
                            <span
                              className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium"
                              style={{ fontSize: "calc(0.75rem * 0.85)" }}
                            >
                              Popular
                            </span>
                          )}
                      </div>
                    </CardContent>
                  )}
                  {/* Matches - Show for all leagues */}

                  <div className="match-cards-wrapper min-h-[80px] overflow-visible">
                    {leagueData.matches
                      .slice(0, timeFilterActive && showTop20 ? 20 : undefined)
                      .sort((a: any, b: any) => {
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
                          "LIV",
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
                          "LIV",
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
                          const aElapsed =
                            Number(a.fixture.status.elapsed) || 0;
                          const bElapsed =
                            Number(b.fixture.status.elapsed) || 0;
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
                          // (those closest to current time but in the past)
                          const aDistance = Math.abs(nowTime - aTime);
                          const bDistance = Math.abs(nowTime - bTime);
                          return aDistance - bDistance;
                        }

                        // DEFAULT: Sort by time proximity to current time
                        const aDistance = Math.abs(aTime - nowTime);
                        const bDistance = Math.abs(bTime - nowTime);
                        return aDistance - bDistance;
                      })
                      .map((match: any) => {
                        const matchId = match.fixture.id;
                        const isHalftimeFlash = halftimeFlashMatches.has(matchId);
                        const isFulltimeFlash = fulltimeFlashMatches.has(matchId);
                        const isGoalFlash = goalFlashMatches.has(matchId);
                        const isStarred = starredMatches.has(matchId);

                        return (
                          <div
                            key={match.fixture.id}
                            className={`match-card-container group ${
                              isHalftimeFlash ? 'halftime-flash' : ''
                            } ${
                              isFulltimeFlash ? 'fulltime-flash' : ''
                            } ${
                              isGoalFlash ? 'goal-flash' : ''
                            }`}
                            onClick={() => onMatchCardClick?.(match)}
                            style={{
                              cursor: onMatchCardClick ? "pointer" : "default",
                            }}
                          >
                            {/* Star Button with true slide-in effect */}
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
                                className={`match-star-icon ${isStarred ? "starred" : ""}`}
                              />
                            </button>

                            {/* Three-grid layout container */}
                            <div className="match-three-grid-container">
                              {/* Top Grid: Match Status */}
                              <div className="match-status-top">
                                {(() => {
                                  const status = match.fixture.status.short;
                                  const elapsed = match.fixture.status.elapsed;

                                  // Live matches status - use API data as-is
                                  if (
                                    [
                                      "LIVE",
                                      "LIV",
                                      "1H",
                                      "HT",
                                      "2H",
                                      "ET",
                                      "BT",
                                      "P",
                                      "INT",
                                    ].includes(status)
                                  ) {
                                    let displayText = "";

                                    if (status === "HT") {
                                      displayText = "Halftime";
                                    } else if (status === "P") {
                                      displayText = "Penalties";
                                    } else if (status === "ET") {
                                      displayText = elapsed
                                        ? `${elapsed}' ET`
                                        : "Extra Time";
                                    } else if (status === "BT") {
                                      displayText = "Break Time";
                                    } else if (status === "INT") {
                                      displayText = "Interrupted";
                                    } else {
                                      // For LIVE, LIV, 1H, 2H - use API elapsed time, ensure it's current
                                      displayText = elapsed && elapsed > 0 ? `${elapsed}'` : "LIVE";
                                    }

                                    return (
                                      <div className="match-status-label status-live">
                                        {displayText}
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
                                    return (
                                      <div className="match-status-label status-ended">
                                        {status === "FT"
                                          ? "Ended"
                                          : status === "AET"
                                            ? "Ended (AET)"
                                            : status === "PEN"
                                              ? "Ended (Penalties)"
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

                                  // Postponed matches status
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
                                    const statusText =
                                      status === "PST"
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
                                                  : status;

                                    return (
                                      <div className="match-status-label status-postponed">
                                        {statusText}
                                      </div>
                                    );
                                  }

                                  // Upcoming matches (TBD status)
                                  if (status === "TBD") {
                                    return (
                                      <div className="match-status-label status-upcoming">
                                        Time TBD
                                      </div>
                                    );
                                  }

                                  // Default - no status display for regular upcoming matches
                                  return null;
                                })()}
                              </div>

                              {/* Middle Grid: Main match content */}
                              <div className="match-content-container">
                                {/* Home Team Name - positioned further left */}
                                <div
                                  className={`home-team-name ${
                                    match.goals.home !== null &&
                                    match.goals.away !== null &&
                                    match.goals.home > match.goals.away
                                      ? "winner"
                                      : ""
                                  }`}
                                >
                                  {shortenTeamName(match.teams.home.name) ||
                                    "Unknown Team"}
                                </div>

                                {/* Home team logo - grid area */}
                                <div className="home-team-logo-container">
                                  <MyWorldTeamLogo
                                    teamName={match.teams.home.name}
                                    teamLogo={
                                      match.teams.home.id
                                        ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                                        : "/assets/fallback-logo.svg"
                                    }
                                    alt={match.teams.home.name}
                                    size="34px"
                                    className="popular-leagues-size"
                                    leagueContext={{
                                      name: leagueData.league.name,
                                      country: leagueData.league.country,
                                    }}
                                  />
                                </div>

                                {/* Score/Time Center - Fixed width and centered */}
                                <div className="match-score-container">
                                  {(() => {
                                    const status = match.fixture.status.short;
                                    const fixtureDate = parseISO(
                                      match.fixture.date,
                                    );

                                    // Live matches - show score only
                                    if (
                                      [
                                        "LIVE",
                                        "LIV",
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

                                    // All finished match statuses - show score only
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
                                      // Check if we have actual numerical scores
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
                                        // Match is finished but no valid score data
                                        return (
                                          <div
                                            className="match-time-display"
                                            style={{ fontSize: "0.882em" }}
                                          >
                                            {format(fixtureDate, "HH:mm")}
                                          </div>
                                        );
                                      }
                                    }

                                    // Postponed or delayed matches
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
                                        <div
                                          className="match-time-display"
                                          style={{ fontSize: "0.882em" }}
                                        >
                                          {format(fixtureDate, "HH:mm")}
                                        </div>
                                      );
                                    }

                                    // Upcoming matches (NS = Not Started, TBD = To Be Determined)
                                    return (
                                      <div
                                        className="match-time-display"
                                        style={{ fontSize: "0.882em" }}
                                      >
                                        {status === "TBD"
                                          ? "TBD"
                                          : format(fixtureDate, "HH:mm")}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Away team logo - grid area */}
                                <div className="away-team-logo-container">
                                  <MyWorldTeamLogo
                                    teamName={match.teams.away.name}
                                    teamLogo={
                                      match.teams.away.id
                                        ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                                        : "/assets/fallback-logo.svg"
                                    }
                                    alt={match.teams.away.name}
                                    size="34px"
                                    className="popular-leagues-size"
                                    leagueContext={{
                                      name: leagueData.league.name,
                                      country: leagueData.league.country,
                                    }}
                                  />
                                </div>

                                {/* Away Team Name - positioned further right */}
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
                                  const penaltyHome = match.score?.penalty?.home;
                                  const penaltyAway = match.score?.penalty?.away;
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
                                        <span className="penalty-winner">
                                          {winnerText}
                                        </span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </Card>
              );
            }),
      )}
    </>
  );
};

export default TodayPopularFootballLeaguesNew;